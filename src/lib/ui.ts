import { TextureHelper } from "../helpers/texture_helper";
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

export type Style = {
  button: ButtonStyle;
};

type InputState = {
  mouse: { pos: Pos; button1: boolean; button2: boolean };
};

enum ControlState {
  Normal,
  Hover,
  Active,
}

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
};

const DEFAULT_BUTTON_OPTIONS: ButtonOptions = {
  minSize: { w: 100, h: 40 },
  stretch: Stretch.none,
  style: {
    font: "16px Arial",
    textColor: "#ffffff",
    background: {
      normal: "#2979FF",
      hover: "#5393FF",
      active: "#1C54B2",
    },
  },
  enabled: () => true,
};

export abstract class Control {
  private _minSize: Size;
  private _stretch: Stretch;

  enabled: boolean = true;

  protected _state: ControlState = ControlState.Normal;

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
    if (!this.enabled) return undefined;

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

    const isHit = this.hitTest(x, y) === this;

    let state: ControlState = ControlState.Normal;

    state = isHit
      ? input.mouse.button1
        ? ControlState.Active
        : ControlState.Hover
      : ControlState.Normal;

    if (state !== this._state) {
      this._state = state;

      this.updateContent();
    }
  }

  draw(renderer: Renderer): void {
    const { x, y } = this._frame;
    renderer.drawImage(this._content, x, y);
  }

  private updateContent() {
    // update background
    const { w, h } = this._frame;
    this._content = TextureHelper.generate(w, h, (ctx) => {
      if (!this.enabled) {
        ctx.globalAlpha = 0.5;
      }

      switch (this._state) {
        case ControlState.Active:
          ctx.fillStyle = this._options.style.background.active;
          break;
        case ControlState.Hover:
          ctx.fillStyle = this._options.style.background.hover;
          break;
        case ControlState.Normal:
          ctx.fillStyle = this._options.style.background.normal;
          break;
      }
      ctx.fillRect(0, 0, w, h);

      ctx.font = this._options.style.font;
      const heightMetrics = ctx.measureText("Mg");
      // For text height use a consistent height regardless of letters in text.
      const textH =
        heightMetrics.actualBoundingBoxAscent +
        heightMetrics.actualBoundingBoxDescent;
      const textW = ctx.measureText(this._title).width;

      ctx.fillStyle = this._options.style.textColor;
      const textX = Math.floor((w - textW) / 2);
      const textY = Math.floor((h + textH) / 2);
      ctx.fillText(this._title, textX, textY);

      ctx.globalAlpha = 1.0;
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
    let { x, y } = this._inputListener.getMousePosition();

    if (x < 0 || x >= this._size.w || y < 0 || y >= this._size.h) {
      x = -1;
      y = -1;
    }

    for (let [child, _] of this._children) {
      const input: InputState = {
        mouse: { pos: { x, y }, button1: false, button2: false },
      };

      child.update(dt, input);
    }
  }

  draw(renderer: Renderer) {
    for (let [child, _] of this._children) {
      child.draw(renderer);
    }
  }
}

export const UI = {
  layout(): Layout {
    return new Layout();
  },

  button(title: string, options?: DeepPartial<ButtonOptions>): Button {
    return new Button(
      title,
      DeepPartial.merge(DEFAULT_BUTTON_OPTIONS, options || {})
    );
  },
};
