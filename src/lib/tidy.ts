// Types for internal use by Tidy.
type Size = { w: number; h: number };
type Rect = { x: number; y: number; w: number; h: number };
type Margin = { l: number; t: number; r: number; b: number };
type Stretch = "none" | "horizontal" | "vertical" | "all";

/**
 * Controls that need their frame set by Tidy should implement the Layoutable
 * interface.
 */
export interface Layoutable {
  setFrame(rect: Rect): void;
}

/**
 * The base class for layout components used by Tidy.
 */
export abstract class Layout<T extends Layoutable = Layoutable> {
  readonly children: Layout<T>[];
  readonly minSize: Size;
  readonly stretch: Stretch;
  readonly spacing: number;
  expSize: Size | null = null;
  frame: Rect | null = null;

  constructor(
    children: Layout<T>[],
    minSize: Size = { w: 0, h: 0 },
    stretch: Stretch = "all",
    spacing: number
  ) {
    this.children = children;
    this.minSize = minSize;
    this.stretch = stretch;
    this.spacing = spacing;
  }

  /**
   * Call re-shape to re-calculate frames of all components managed by this
   * layout.
   * @param x The x-origin for the layout.
   * @param y The y-origin for the layout.
   * @param w The width of the layout.
   * @param h The height of the layout.
   */
  reshape(x: number, y: number, w: number, h: number): void {
    this.expand();
    this.layout({ x: x, y: y, w: w, h: h });
  }

  /**
   * Iterate over all widgets that are part of the layout.
   */
  *widgets(): Generator<T> {
    for (const child of this.children) {
      yield* child.widgets();
    }
  }

  protected expand(): void {
    for (const ch of this.children) {
      ch.expand();
    }
    this.expandChildren();
  }

  protected layout(rect: Rect): void {
    this.layoutChildren(rect);
    for (const ch of this.children) {
      if (ch.frame) ch.layout(ch.frame);
    }
  }

  protected static spread(
    targetSize: number,
    sizeStretchPairs: [number, number][]
  ): number[] {
    const sizes = sizeStretchPairs.map(([sz]) => sz);
    const stretches = sizeStretchPairs.map(([, st]) => st);

    const fixedSize = sizes.reduce((acc, sz) => acc + sz, 0);
    const flexySize = Math.max(0, targetSize - fixedSize);
    const totalStretch = stretches.reduce((acc, st) => acc + st, 0);
    const flexyUnit =
      totalStretch > 0 ? Math.floor(flexySize / totalStretch) : 0;

    const flexyAdds = stretches.map((st) => st * flexyUnit);
    const totalFlexy = flexyAdds.reduce((acc, val) => acc + val, 0);
    const flexyErr = flexySize - totalFlexy;

    if (flexyErr !== 0) {
      const lastStretchIdx = stretches
        .map((st, i) => [st, i])
        .filter(([st]) => st > 0)
        .map(([, i]) => i)
        .pop();
      if (lastStretchIdx !== undefined) {
        flexyAdds[lastStretchIdx] += flexyErr;
      }
    }

    return sizes.map((sz, i) => sz + flexyAdds[i]);
  }

  protected abstract expandChildren(): void;
  protected abstract layoutChildren(rect: Rect): void;
}

export class Elem<T extends Layoutable> extends Layout<T> {
  readonly widget: T;

  constructor(
    widget: T,
    minSize: Size = { w: 0, h: 0 },
    stretch: Stretch = "all"
  ) {
    super([], minSize, stretch, 0);
    this.widget = widget;
  }

  override *widgets(): Generator<T> {
    yield this.widget;
  }

  protected expandChildren(): void {
    this.expSize = this.minSize;
  }

  protected layoutChildren(rect: Rect): void {
    this.widget.setFrame(rect);
  }
}

class Border<T extends Layoutable> extends Layout<T> {
  readonly margin: Margin;

  constructor(
    children: Layout<T>[],
    minSize: Size = { w: 0, h: 0 },
    stretch: Stretch = "all",
    margin: Margin = { l: 0, t: 0, r: 0, b: 0 }
  ) {
    super(children, minSize, stretch, 0);
    this.margin = margin;
  }

  protected expandChildren(): void {
    let w = this.margin.l + this.margin.r;
    let h = this.margin.t + this.margin.b;
    for (const ch of this.children) {
      if (ch.expSize) {
        w = Math.max(w, ch.expSize.w);
        h = Math.max(h, ch.expSize.h);
      }
    }
    this.expSize = { w: w, h: h };
  }

  protected layoutChildren(rect: Rect): void {
    const { l, t, r, b } = this.margin;
    const x = rect.x + l;
    const y = rect.y + t;
    const w = rect.w - l - r;
    const h = rect.h - t - b;

    this.frame = { x, y, w, h };

    for (const ch of this.children) {
      ch.frame = { x, y, w, h };
    }
  }
}

class VStack<T extends Layoutable> extends Layout<T> {
  protected expandChildren(): void {
    let w = 0;
    let h = 0;
    for (const ch of this.children) {
      if (ch.expSize) {
        w = Math.max(w, ch.expSize.w);
        h += ch.expSize.h;
      }
    }
    h += Math.max(0, this.children.length - 1) * this.spacing;
    this.expSize = { w: w, h: h };
  }

  protected layoutChildren(rect: Rect): void {
    const totalSpacing = Math.max(0, this.children.length - 1) * this.spacing;
    const heights = Layout.spread(
      rect.h - totalSpacing,
      this.children.map((ch) => [
        ch.expSize?.h ?? 0,
        ch.stretch === "vertical" || ch.stretch === "all" ? 1 : 0,
      ])
    );

    let y = rect.y;
    for (let i = 0; i < this.children.length; ++i) {
      const ch = this.children[i];
      const h = heights[i];
      const w =
        ch.stretch === "horizontal" || ch.stretch === "all"
          ? rect.w
          : ch.expSize?.w ?? 0;
      ch.frame = { x: rect.x, y, w, h };
      y += h + this.spacing;
    }
  }
}

class HStack<T extends Layoutable> extends Layout<T> {
  protected expandChildren(): void {
    let w = 0;
    let h = 0;
    for (const ch of this.children) {
      if (ch.expSize) {
        w += ch.expSize.w;
        h = Math.max(h, ch.expSize.h);
      }
    }
    w += Math.max(0, this.children.length - 1) * this.spacing;
    this.expSize = { w: w, h: h };
  }

  protected layoutChildren(rect: Rect): void {
    const totalSpacing = Math.max(0, this.children.length - 1) * this.spacing;
    const widths = Layout.spread(
      rect.w - totalSpacing,
      this.children.map((ch) => [
        ch.expSize?.w ?? 0,
        ch.stretch === "horizontal" || ch.stretch === "all" ? 1 : 0,
      ])
    );

    let x = rect.x;
    for (let i = 0; i < this.children.length; ++i) {
      const ch = this.children[i];
      const w = widths[i];
      const h =
        ch.stretch === "vertical" || ch.stretch === "all"
          ? rect.h
          : ch.expSize?.h ?? 0;
      ch.frame = { x, y: rect.y, w, h };
      x += w + this.spacing;
    }
  }
}

export class Tidy {
  static border<T extends Layoutable>(
    children: Layout<T>[] | Layout<T>,
    options: Partial<{ margin: Margin; stretch: Stretch; minSize: Size }> = {}
  ): Border<T> {
    return new Border(
      Array.isArray(children) ? children : [children],
      options.minSize ?? { w: 0, h: 0 },
      options.stretch ?? "all",
      options.margin ?? { t: 0, b: 0, l: 0, r: 0 }
    );
  }

  static hstack<T extends Layoutable>(
    children: Layout<T> | Layout<T>[],
    options: Partial<{ spacing: number; stretch: Stretch }> = {}
  ): HStack<T> {
    return new HStack(
      Array.isArray(children) ? children : [children],
      { w: 0, h: 0 },
      options.stretch ?? "horizontal",
      options.spacing ?? 0
    );
  }

  static vstack<T extends Layoutable>(
    children: Layout<T> | Layout<T>[],
    options: Partial<{ spacing: number; stretch: Stretch }> = {}
  ): VStack<T> {
    return new VStack<T>(
      Array.isArray(children) ? children : [children],
      { w: 0, h: 0 },
      options.stretch ?? "vertical",
      options.spacing ?? 0
    );
  }

  static elem<T extends Layoutable>(
    widget: T,
    options: Partial<{ minSize: Size; stretch: Stretch }> = {}
  ): Elem<T> {
    return new Elem(
      widget,
      options.minSize ?? { w: 0, h: 0 },
      options.stretch ?? "none"
    );
  }

  static size(w: number, h: number): Size {
    return { w: w, h: h };
  }

  static margin(h: number, v: number): Margin;
  static margin(all: number): Margin;
  static margin(l: number, t: number, r: number, b: number): Margin;
  static margin(l: number, t?: number, r?: number, b?: number): Margin {
    t = t ?? l;
    r = r ?? l;
    b = b ?? t;
    return { l: l, t: t, r: r, b: b };
  }
}
