import { TextureHelper } from "../helpers/texture_helper";
import { AssetLoader } from "./asset_loader";
import { DeepPartial } from "./deep_partial";
import { InputListener } from "./input_listener";
import { Renderer } from "./renderer";
import { ServiceLocator } from "./service_locator";

type Pos = { x: number; y: number };
type Size = { w: number; h: number };
type Frame = Pos & Size;

export type ButtonStyle = {
  font: string;
  textColor: string;
  background: {
    normal: string;
    hover: string;
    active: string;
  };
};

export type PanelStyle = {
  background: string;
};

export type Style = {
  button: ButtonStyle;
  panel: PanelStyle;
};

let defaultStyle: Style = {
  button: {
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

export type ControlOptions = {
  minSize: { w: number; h: number };
  stretch: Stretch;
};

export type ButtonOptions = ControlOptions & {
  style: ButtonStyle;
  enabled: () => boolean;
  click: () => void;
};

const DEFAULT_BUTTON_OPTIONS: ButtonOptions = {
  minSize: { w: 100, h: 40 },
  stretch: Stretch.none,
  style: defaultStyle.button,
  enabled: () => true,
  click: () => {},
};

export type PanelOptions = ControlOptions & {
  background: string; // image or color
  padding: number;
  spacing: number;
};

const DEFAULT_PANEL_OPTIONS: PanelOptions = {
  minSize: { w: 0, h: 0 },
  stretch: Stretch.all,
  padding: 10,
  spacing: 10,
  background: "#aaaaaa",
};

export abstract class Control {
  private _minSize: Size;
  private _stretch: Stretch;

  protected _enabled: boolean = true;
  protected _state: ControlState = "normal";

  get enabled(): boolean {
    return this._enabled;
  }

  get state(): ControlState {
    return this._state;
  }

  protected _frame: Frame = { x: 0, y: 0, w: 0, h: 0 };

  constructor(minSize: Size, stretch: Stretch) {
    this._minSize = minSize;
    this._stretch = stretch;
  }

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

  getSize(constraint: Size): Size {
    let size = this._minSize;

    if ((this._stretch & Stretch.horz) !== 0) {
      size.w = Math.max(constraint.w, size.w);
    } else {
      size.w = Math.min(constraint.w, size.w);
    }
    if ((this._stretch & Stretch.vert) !== 0) {
      size.h = Math.max(constraint.h, size.h);
    } else {
      size.h = Math.min(constraint.h, size.h);
    }

    return size;
  }
}

export class Button extends Control {
  private readonly _options: ButtonOptions;

  private readonly _title: string;

  private _content!: HTMLCanvasElement;
  private _wasHit: boolean = false;

  constructor(title: string, options: ButtonOptions) {
    super(options.minSize, options.stretch);

    this._title = title;
    this._options = options;
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
    const { style } = this._options;
    const bg = style.background[this._state];
    const title = this._title;

    this._content = TextureHelper.generate(w, h, (ctx) => {
      ctx.save();
      if (!this.enabled) ctx.globalAlpha = 0.5;

      if (isColorString(bg)) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      } else {
        const image = TextureHelper.stretch(getImage(bg), w, h, 10);
        ctx.drawImage(image, 0, 0);
      }

      ctx.font = style.font;
      ctx.fillStyle = style.textColor;

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
}

type ControlInfo = {
  pos: Pos;
  anchor: Anchor;
};

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
    anchor: Anchor = "top-left"
  ) {
    this._children.set(control, { pos: pos, anchor: anchor });
  }

  resize(w: number, h: number) {
    this._size = { w, h };

    for (let [child, info] of this._children) {
      const { w, h } = child.getSize(this._size);
      let { x, y } = info.pos;

      switch (info.anchor) {
        case "top":
          x -= Math.floor(w / 2);
          break;
        case "left":
          y -= Math.floor(h / 2);
          break;
        case "right":
          x -= w;
          y -= Math.floor(h / 2);
          break;
        case "bottom":
          x -= Math.floor(w / 2);
          y -= h;
          break;
        case "top-right":
          x -= w;
          break;
        case "center":
          x -= Math.floor(w / 2);
          y -= Math.floor(h / 2);
          break;
        case "bottom-left":
          y -= h;
          break;
        case "bottom-right":
          x -= w;
          y -= h;
          break;
      }

      child.setFrame(x, y, w, h);
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
  private _options: PanelOptions;
  private _children: Control[];

  constructor(children: Control[], options: PanelOptions) {
    super(options.minSize, options.stretch);

    this._children = children;
    this._options = options;
  }

  override getSize(constraint: Size): Size {
    let w = 0;
    let h = 0;

    const totalPadding = this._options.padding * 2;
    const childCount = this._children.length;
    const totalSpacing = Math.max(childCount - 1, 0) * this._options.spacing;

    let maxW = constraint.w - this._options.padding * 2;
    let maxH = constraint.h - this._options.padding * 2 - totalSpacing;

    for (let child of this._children) {
      const childSize = child.getSize({ w: maxW, h: maxH });
      w = Math.max(w, childSize.w);
      h += childSize.h;
    }

    return { w: w + totalPadding, h: h + totalPadding + totalSpacing };
  }

  override setFrame(x: number, y: number, w: number, h: number): void {
    super.setFrame(x, y, w, h);

    const padding = this._options.padding;
    let childY = y + padding;
    let childW = w - padding * 2;

    // TODO: The calculation here doesn't guarantee same results as in
    // getSize(), so perhaps cache results of getSize for each child and
    // re-apply here.
    for (let child of this._children) {
      const childSize = child.getSize({ w: childW, h });
      child.setFrame(x + padding, childY, childW, childSize.h);
      childY += this._options.spacing + childSize.h;
    }

    this._background = TextureHelper.generate(w, h, (ctx) => {
      const bg = this._options.background;
      if (isColorString(bg)) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
      } else {
        const image = TextureHelper.stretch(getImage(bg), w, h, 10);
        ctx.drawImage(image, 0, 0);
      }
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

  /**
   * Create a button.
   * @param title
   * @param options
   * @returns
   */
  button(title: string, options?: DeepPartial<ButtonOptions>): Button {
    return new Button(
      title,
      DeepPartial.merge(DEFAULT_BUTTON_OPTIONS, options || {})
    );
  },

  /**
   * Create a panel. A panel is a container with a background color or image.
   * @param options
   * @returns
   */
  panel(
    children: Control[] | Control,
    options?: DeepPartial<PanelOptions>
  ): Panel {
    return new Panel(
      Array.isArray(children) ? children : [children],
      DeepPartial.merge(DEFAULT_PANEL_OPTIONS, options || {})
    );
  },
};

function isColorString(text: string): boolean {
  return text.startsWith("#") || text.startsWith("rgb(");
}

function getImage(name: string): HTMLImageElement {
  const assetLoader = ServiceLocator.resolve(AssetLoader);
  const image = assetLoader.getImage(name);
  // TODO: Assert ...
  return image;
}
