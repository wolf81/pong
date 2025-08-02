import { Renderer } from "./renderer";

type Pos = { x: number; y: number };
type Size = { w: number; h: number };
type Frame = Pos & Size;

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
  background: string;
};

export abstract class Control {
  private _minSize: Size;
  private _stretch: Stretch;

  protected _frame: Frame = { x: 0, y: 0, w: 0, h: 0 };

  constructor(minSize: Size, stretch: Stretch) {
    this._minSize = minSize;
    this._stretch = stretch;
  }

  setFrame(x: number, y: number, w: number, h: number) {
    this._frame = { x, y, w, h };
  }

  abstract draw(renderer: Renderer): void;

  hitTest(x: number, y: number): Control | undefined {
    const isHit =
      x >= this._frame.x &&
      x < this._frame.x + this._frame.w &&
      y >= this._frame.h &&
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
  private _color: string = "#fff";

  private _options: ButtonOptions;

  constructor(options: ButtonOptions) {
    super(options.minSize, options.stretch);

    this._options = options;
  }

  draw(renderer: Renderer): void {
    const { x, y, w, h } = this._frame;
    renderer.drawRect(x, y, w, h, this._color);
  }
}

type ControlInfo = {
  pos: Pos;
  anchor: Anchor;
};

export class Layout {
  private _children: Map<Control, ControlInfo> = new Map<
    Control,
    ControlInfo
  >();
  private _size: Size = { w: 0, h: 0 };

  addChild(
    control: Control,
    x: number,
    y: number,
    anchor: Anchor = "top-left"
  ) {
    this._children.set(control, { pos: { x: x, y: y }, anchor: anchor });
  }

  resize(w: number, h: number) {
    this._size = { w, h };

    for (let [child, info] of this._children) {
      let { x, y } = info.pos;
      if (x <= 1.0) {
        x = Math.floor(info.pos.x * w);
      }
      if (y <= 1.0) {
        y = Math.floor(info.pos.y * h);
      }
      const childSize = child.getSize(this._size);

      switch (info.anchor) {
        case "top":
          x -= Math.floor(childSize.w / 2);
          break;
        case "left":
          y -= Math.floor(childSize.h / 2);
          break;
        case "right":
          x -= childSize.w;
          y -= Math.floor(childSize.h / 2);
          break;
        case "bottom":
          x -= Math.floor(childSize.w / 2);
          y -= childSize.h;
          break;
        case "top-right":
          x -= childSize.w;
          break;
        case "center":
          x -= Math.floor(childSize.w / 2);
          y -= Math.floor(childSize.h / 2);
          break;
        case "bottom-left":
          y -= childSize.h;
          break;
        case "bottom-right":
          x -= childSize.w;
          y -= childSize.h;
          break;
      }

      child.setFrame(x, y, childSize.w, childSize.h);
    }
  }

  update(dt: number) {}

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

    const background = options.background ?? "#ccc";

    return new Button({
      minSize: { w, h },
      stretch: Stretch.none,
      background: background,
    });
  },
};
