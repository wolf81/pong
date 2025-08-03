import { Assert } from "./assert";
import { AssetLoader } from "./asset_loader";
import { DeepPartial } from "./deep_partial";
import { InputListener } from "./input_listener";
import { TextureHelper } from "./internal/texture_helper";
import { Renderer } from "./renderer";
import { ServiceLocator } from "./service_locator";

type Pos = { x: number; y: number };
type Size = { w: number; h: number };
type Frame = Pos & Size;
type SizeSpec = number | "fill" | "wrap";

export type ButtonOptions = {
  enabled: () => boolean;
  click: () => void;
};

export type ButtonStyle = {
  font: string;
  minSize: Size;
  textColor: string;
  background: {
    normal: string;
    hover: string;
    active: string;
  };
};

export type LabelStyle = {
  font: string;
  textColor: string;
  padding: number;
};

export type PanelStyle = {
  background: string;
  padding: number;
  spacing: number;
};

export type Style = {
  button: ButtonStyle;
  panel: PanelStyle;
  label: LabelStyle;
};

let defaultStyle: Style = {
  button: {
    minSize: { w: 100, h: 40 },
    font: "16px Arial",
    textColor: "#ffffff",
    background: {
      normal: "#2979FF",
      hover: "#5393FF",
      active: "#1C54B2",
    },
  },
  panel: {
    background: "#6767cc",
    padding: 10,
    spacing: 10,
  },
  label: {
    padding: 8,
    font: "16px Arial",
    textColor: "#333333",
  },
};

type InputState = {
  mouse: { pos: Pos; button1: boolean; button2: boolean };
};

type ControlState = "normal" | "hover" | "active";

type Anchor =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export enum Stretch {
  none = 0,
  horz = 1 << 0,
  vert = 1 << 1,
  all = 1,
}

export type ButtonConfig = {
  options?: DeepPartial<ButtonOptions>;
  style?: DeepPartial<ButtonStyle>;
};

export type PanelConfig = {
  options?: DeepPartial<PanelOptions>;
  style?: DeepPartial<PanelStyle>;
};

export type LabelConfig = {
  options?: DeepPartial<LabelOptions>;
  style?: DeepPartial<LabelStyle>;
};

const DEFAULT_BUTTON_OPTIONS: ButtonOptions = {
  enabled: () => true,
  click: () => {},
};

// TODO: Should probably be part of Panel and Button style options.
const IMAGE_CORNER_RADIUS = 10;

const ANCHOR_OFFSETS: Record<Anchor, (w: number, h: number) => Pos> = {
  "top-left": () => ({ x: 0, y: 0 }),
  top: (w, h) => ({ x: -w / 2, y: 0 }),
  "top-right": (w) => ({ x: -w, y: 0 }),
  left: (w, h) => ({ x: 0, y: -h / 2 }),
  center: (w, h) => ({ x: -w / 2, y: -h / 2 }),
  right: (w, h) => ({ x: -w, y: -h / 2 }),
  "bottom-left": (w, h) => ({ x: 0, y: -h }),
  bottom: (w, h) => ({ x: -w / 2, y: -h }),
  "bottom-right": (w, h) => ({ x: -w, y: -h }),
};

// const DEFAULT_BUTTON_STYLE: ButtonOptions = {
//   style: defaultStyle.button,
//   minSize: { w: 100, h: 40 },
// };

export type LabelOptions = {
  align: "left" | "center" | "right";
};

const DEFAULT_LABEL_OPTIONS: LabelOptions = {
  align: "left",
};

export type PanelOptions = {
  style: PanelStyle;
};

const DEFAULT_PANEL_OPTIONS: PanelOptions = {
  style: defaultStyle.panel,
  // TODO: Support both horz / vert orientation.
};

export type LayoutOptions = {
  size: { w: SizeSpec; h: SizeSpec };
  anchor: Anchor;
};

export abstract class Control {
  protected _enabled: boolean = true;
  protected _state: ControlState = "normal";

  get enabled(): boolean {
    return this._enabled;
  }

  get state(): ControlState {
    return this._state;
  }

  protected _frame: Frame = { x: 0, y: 0, w: 0, h: 0 };

  setFrame(x: number, y: number, w: number, h: number) {
    this._frame = { x, y, w, h };
  }

  abstract draw(renderer: Renderer): void;

  abstract update(dt: number, input: InputState): void;

  hitTest(x: number, y: number): Control | undefined {
    if (!this._enabled) return undefined;

    const isHit =
      x >= this._frame.x &&
      x < this._frame.x + this._frame.w &&
      y >= this._frame.y &&
      y < this._frame.y + this._frame.h;

    return isHit ? this : undefined;
  }

  abstract measure(): Size;
}

export class Button extends Control {
  private readonly _options: ButtonOptions;
  private readonly _style: ButtonStyle;

  private readonly _title: string;

  private _content!: HTMLCanvasElement;
  private _wasHit: boolean = false;

  constructor(title: string, options: ButtonOptions, style: ButtonStyle) {
    super();

    this._title = title;
    this._options = options;
    this._style = style;
  }

  override setFrame(x: number, y: number, w: number, h: number): void {
    super.setFrame(x, y, w, h);

    this.updateContent();
  }

  update(dt: number, input: InputState): void {
    const { x, y } = input.mouse.pos;

    const isHover = this.hitTest(x, y) === this;
    const isHit = isHover && input.mouse.button1;

    const enabled = this._options.enabled();
    let state: ControlState = "normal";
    state = isHit ? "active" : isHover ? "hover" : "normal";

    const isRelease = this._wasHit && isHover && !input.mouse.button1;
    this._wasHit = isHover && input.mouse.button1;

    if (isRelease) {
      this._options.click();
    }

    const stateChanged = state !== this._state;
    const enabledChanged = enabled !== this._enabled;

    if (stateChanged || enabledChanged) {
      this._state = state;
      this._enabled = enabled;

      this.updateContent();
    }
  }

  draw(renderer: Renderer): void {
    const { x, y } = this._frame;
    renderer.drawImage(this._content, x, y);
  }

  private updateContent() {
    const { w, h } = this._frame;
    const background = this._style.background[this._state];
    const title = this._title;

    this._content = TextureHelper.generate(w, h, (ctx) => {
      ctx.save();
      if (!this.enabled) ctx.globalAlpha = 0.5;

      drawBackground(ctx, background, w, h);

      ctx.font = this._style.font;
      ctx.fillStyle = this._style.textColor;

      const metrics = ctx.measureText("Mg");
      const textH =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const textW = ctx.measureText(title).width;

      const textX = Math.floor((w - textW) / 2);
      const textY = Math.floor((h + textH) / 2);
      ctx.fillText(title, textX, textY);

      ctx.restore();
    });
  }

  override measure(): Size {
    return this._style.minSize;
  }
}

type ControlInfo = {
  pos: Pos;
  size: { w: SizeSpec; h: SizeSpec };
  anchor: Anchor;
};

export class Label extends Control {
  private _text: string;
  private readonly _options: LabelOptions;
  private readonly _style: LabelStyle;

  constructor(text: string, options: LabelOptions, style: LabelStyle) {
    super();

    this._text = text;
    this._options = options;
    this._style = style;
  }

  override measure(): Size {
    const canvas = document.createElement("canvas")!;
    const ctx = canvas.getContext("2d")!;
    ctx.font = this._style.font;
    const heightMetrics = ctx.measureText("Mg");

    const totalPadding = this._style.padding * 2;

    const w = ctx.measureText(this._text).width + totalPadding;
    const h =
      heightMetrics.actualBoundingBoxAscent +
      heightMetrics.actualBoundingBoxDescent +
      totalPadding;

    return { w, h };
  }

  update(dt: number, input: InputState): void {}

  draw(renderer: Renderer): void {
    const { x, y, w, h } = this._frame;
    renderer.drawText(this._text, x + w / 2, y + h / 2, {
      font: this._style.font,
      color: this._style.textColor,
      align: this._options.align,
    });
  }
}

export class Layout {
  private readonly _inputListener: InputListener;

  private readonly _children: Map<Control, ControlInfo> = new Map<
    Control,
    ControlInfo
  >();

  private _size: Size = { w: 0, h: 0 };

  constructor() {
    this._inputListener = ServiceLocator.resolve(InputListener);
  }

  addChild(
    control: Control,
    pos: { x: number; y: number },
    options: Partial<LayoutOptions>
  ) {
    this._children.set(control, {
      pos: pos,
      anchor: options.anchor || "top-left",
      size: options.size || { w: "wrap", h: "wrap" },
    });
  }

  resize(w: number, h: number) {
    this._size = { w, h };

    for (let [child, info] of this._children) {
      let { w, h } = child.measure();
      let { x, y } = info.pos;

      switch (info.size.w) {
        case "fill":
          w = this._size.w;
          break;
        case "wrap":
          break;
        default:
          w = Math.min(info.size.w, this._size.w);
          break;
      }

      switch (info.size.h) {
        case "fill":
          h = this._size.h;
          break;
        case "wrap":
          break;
        default:
          h = Math.min(info.size.h, this._size.h);
          break;
      }

      const offset = ANCHOR_OFFSETS[info.anchor](w, h);

      child.setFrame(
        Math.floor(x + offset.x),
        Math.floor(y + offset.y),
        Math.floor(w),
        Math.floor(h)
      );
    }
  }

  update(dt: number) {
    if (this._size.w === 0 || this._size.h === 0) return;

    let { x, y } = this._inputListener.getMousePosition();

    if (x < 0 || x >= this._size.w || y < 0 || y >= this._size.h) {
      x = -1;
      y = -1;
    }

    for (let [child, _] of this._children) {
      const input: InputState = {
        mouse: {
          pos: { x, y },
          button1: this._inputListener.isMouseDown,
          button2: false,
        },
      };

      child.update(dt, input);
    }
  }

  draw(renderer: Renderer) {
    if (this._size.w === 0 || this._size.h === 0) return;

    for (let [child, _] of this._children) {
      child.draw(renderer);
    }
  }
}

export class Panel extends Control {
  private _background!: HTMLCanvasElement;

  private readonly _children: Control[];
  private readonly _options: PanelOptions;
  private readonly _style: PanelStyle;

  constructor(children: Control[], options: PanelOptions, style: PanelStyle) {
    super();

    this._children = children;
    this._options = options;
    this._style = style;
  }

  override measure(): Size {
    let w = 0;
    let h = 0;

    const totalPadding = this._style.padding * 2;
    const childCount = this._children.length;
    const totalSpacing = Math.max(childCount - 1, 0) * this._style.spacing;

    for (let child of this._children) {
      const childSize = child.measure();
      w = Math.max(w, childSize.w);
      h += childSize.h;
    }

    return { w: w + totalPadding, h: h + totalPadding + totalSpacing };
  }

  override setFrame(x: number, y: number, w: number, h: number): void {
    super.setFrame(x, y, w, h);

    const padding = this._style.padding;
    let childY = y + padding;
    let childW = w - padding * 2;

    // TODO: The calculation here doesn't guarantee same results as in
    // getSize(), so perhaps cache results of getSize for each child and
    // re-apply here.
    for (let child of this._children) {
      const childSize = child.measure();
      child.setFrame(x + padding, childY, childW, childSize.h);
      childY += this._style.spacing + childSize.h;
    }

    this._background = TextureHelper.generate(w, h, (ctx) => {
      drawBackground(ctx, this._style.background, w, h);
    });
  }

  update(dt: number, input: InputState): void {
    for (let child of this._children) {
      child.update(dt, input);
    }
  }

  draw(renderer: Renderer): void {
    const { x, y, w, h } = this._frame;

    renderer.drawImage(this._background, x, y);

    for (let child of this._children) {
      child.draw(renderer);
    }
  }
}

export const UI = {
  /**
   * Set a default style for all controls.
   * @param style
   */
  setStyle(style: Style) {
    defaultStyle = style;
  },

  /**
   * Create a new layout. A layout is a required root component for any view.
   * @returns
   */
  layout(): Layout {
    return new Layout();
  },

  label(text: string, config: LabelConfig = {}): Label {
    return new Label(
      text,
      DeepPartial.merge(DEFAULT_LABEL_OPTIONS, config.options || {}),
      DeepPartial.merge(defaultStyle.label, config.style || {})
    );
  },

  /**
   * Create a button.
   * @param title
   * @param options
   * @returns
   */
  button(title: string, config: ButtonConfig = {}): Button {
    return new Button(
      title,
      DeepPartial.merge(DEFAULT_BUTTON_OPTIONS, config.options || {}),
      DeepPartial.merge(defaultStyle.button, config.style || {})
    );
  },

  /**
   * Create a panel. A panel is a container with a background color or image.
   * @param config
   * @returns
   */
  panel(children: Control[] | Control, config: PanelConfig = {}): Panel {
    return new Panel(
      Array.isArray(children) ? children : [children],
      DeepPartial.merge(DEFAULT_PANEL_OPTIONS, config.options || {}),
      DeepPartial.merge(defaultStyle.panel, config.style || {})
    );
  },
};

function isColorString(text: string): boolean {
  return text.startsWith("#") || text.startsWith("rgb(");
}

function getImage(name: string): HTMLImageElement {
  const assetLoader = ServiceLocator.resolve(AssetLoader);
  const image = assetLoader.getImage(name);
  Assert.defined(image, `No image asset found with name: ${name}`);
  return image;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  drawable: string,
  w: number,
  h: number
) {
  if (isColorString(drawable)) {
    ctx.fillStyle = drawable;
    ctx.fillRect(0, 0, w, h);
  } else {
    const image = TextureHelper.stretch(
      getImage(drawable),
      w,
      h,
      IMAGE_CORNER_RADIUS
    );
    ctx.drawImage(image, 0, 0);
  }
}
