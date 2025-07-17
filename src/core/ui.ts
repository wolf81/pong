import { Renderer } from "../lib/renderer";
import { Rect } from "../lib/shape";
import { Elem, Tidy, Layoutable } from "../lib/tidy";
import { Size } from "../math/size";
import { Vector } from "../math/vector";

export abstract class Control implements Layoutable {
  protected _frame: Rect = Rect.zero;

  get frame(): Rect {
    return this._frame;
  }

  setFrame(rect: { x: number; y: number; w: number; h: number }): void {
    this._frame = new Rect(
      new Vector(rect.x, rect.y),
      new Size(rect.w, rect.h)
    );
  }

  abstract update(dt: number): void;
  abstract draw(renderer: Renderer): void;
}

export class Label extends Control {
  update(dt: number): void {}
  draw(renderer: Renderer): void {
    renderer.drawRect(
      this._frame.x,
      this._frame.y,
      this._frame.w,
      this._frame.h,
      "#3388aa"
    );
  }
}

export class Panel extends Control {
  update(dt: number): void {}
  draw(renderer: Renderer): void {
    renderer.drawRect(
      this._frame.x,
      this._frame.y,
      this._frame.w,
      this._frame.h,
      "#bbbbbb"
    );
  }
}

export class Button extends Control {
  update(dt: number): void {}
  draw(renderer: Renderer): void {
    renderer.drawRect(
      this._frame.x,
      this._frame.y,
      this._frame.w,
      this._frame.h,
      "#9966aa"
    );
  }
}

export class UI {
  static panel(): Elem<Panel> {
    return Tidy.elem(new Panel(), {
      minSize: { w: 0, h: 0 },
      stretch: "all",
    });
  }

  static label(): Elem<Label> {
    return Tidy.elem(new Label(), {
      minSize: { w: 0, h: 40 },
      stretch: "horizontal",
    });
  }

  static button(): Elem<Button> {
    return Tidy.elem(new Button(), {
      minSize: { w: 0, h: 60 },
      stretch: "horizontal",
    });
  }
}
