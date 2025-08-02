import { InputListener } from "./input_listener";
import { Renderer } from "./renderer";
import { ServiceLocator } from "./service_locator";

type Pos = { x: number; y: number };
type Size = { w: number; h: number };
type Frame = Pos & Size;

type InputState = {
  mouse: { pos: Pos; button1: boolean; button2: boolean };
};

enum ControlState {
  Normal,
  Hover,
  Active,
  Disabled,
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
  background: Partial<Record<ControlState, string>>;
};

export abstract class Control {
  private _minSize: Size;
  private _stretch: Stretch;
  private _enabled: boolean = true;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(isEnabled: boolean) {
    this._enabled = isEnabled;

    if (!this._enabled) {
      this._state = ControlState.Disabled;
    }
  }

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

  constructor(options: ButtonOptions) {
    super(options.minSize, options.stretch);

    this._options = options;
  }

  draw(renderer: Renderer): void {
    const { x, y, w, h } = this._frame;

    const background = this._options.background[this.state]!;
    renderer.drawRect(x, y, w, h, background);
  }

  update(dt: number, input: InputState): void {
    const { x, y } = input.mouse.pos;

    const isHit = this.hitTest(x, y) === this;

    this._state = isHit
      ? input.mouse.button1
        ? ControlState.Active
        : ControlState.Hover
      : ControlState.Normal;
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

  button(options: Partial<ButtonOptions>): Button {
    const w = options.minSize?.w ?? 100;
    const h = options.minSize?.h ?? 40;

    const normalBackgroundColor =
      options.background?.[ControlState.Normal] || "#ccc";

    const background: Record<ControlState, string> = {
      [ControlState.Normal]: normalBackgroundColor,
      [ControlState.Hover]:
        options.background?.[ControlState.Hover] || normalBackgroundColor,
      [ControlState.Active]:
        options.background?.[ControlState.Hover] || normalBackgroundColor,
      [ControlState.Disabled]:
        options.background?.[ControlState.Hover] || normalBackgroundColor,
    };

    return new Button({
      minSize: { w, h },
      stretch: Stretch.none,
      background: background,
    });
  },
};
