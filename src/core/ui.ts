import { TextureHelper } from "../helpers/texture_helper";
import { AssetLoader } from "../lib/asset_loader";
import { Renderer, TextAlign } from "../lib/renderer";
import { ServiceLocator } from "../lib/service_locator";
import { Rect } from "../lib/shape";
import { Elem, Tidy, Layoutable } from "../lib/tidy";
import { Size } from "../math/size";
import { Vector } from "../math/vector";

type FontFamily = "Jumpman";

export enum ControlState {
  Default,
  Hover,
  Active,
  Disabled,
}

export abstract class Control implements Layoutable {
  private _state: ControlState = ControlState.Default;

  protected _frame: Rect = Rect.zero;

  get state(): ControlState {
    return this._state;
  }

  setState(state: ControlState) {
    this._state = state;
  }

  get frame(): Rect {
    return this._frame;
  }

  setFrame(rect: { x: number; y: number; w: number; h: number }): void {
    this._frame = new Rect(
      new Vector(rect.x, rect.y),
      new Size(rect.w, rect.h)
    );
  }

  update(dt: number): void {}

  abstract draw(renderer: Renderer): void;
}

export class Label extends Control {
  private _ox: number = 0;
  private _oy: number = 0;
  private _font: string;
  private _text: string;
  private _fontSize: number;

  constructor(
    text: string,
    options?: Partial<{
      font: FontFamily;
      size: number;
    }>
  ) {
    super();

    this._text = text;

    const fontName = options?.font ?? "Jumpman";
    this._fontSize = options?.size ?? 24;
    this._font = `${this._fontSize}px ${fontName}`;
  }

  override setFrame(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }): void {
    super.setFrame(rect);

    this._ox = rect.x + Math.floor(rect.w / 2);
    this._oy = rect.y + Math.floor(rect.h / 2 + this._fontSize / 2);
  }

  draw(renderer: Renderer): void {
    renderer.drawText(this._text, this._ox, this._oy, {
      font: this._font,
      align: "center",
      color: "#72287cff",
    });
  }
}

export class Panel extends Control {
  private _background!: HTMLCanvasElement;

  draw(renderer: Renderer): void {
    renderer.drawImage(this._background, this._frame.x, this._frame.y);
  }

  setFrame(rect: { x: number; y: number; w: number; h: number }): void {
    super.setFrame(rect);

    const assetLoader = ServiceLocator.resolve(AssetLoader);
    const image = assetLoader.getImage("button_square_border");
    this._background = TextureHelper.stretch(image, rect.w, rect.h);
  }
}

export class Button extends Control {
  private _background!: HTMLCanvasElement;

  private _stateBackgrounds: Map<ControlState, HTMLCanvasElement> = new Map<
    ControlState,
    HTMLCanvasElement
  >();

  constructor(
    title: string,
    options?: Partial<{
      font: FontFamily;
      size: number;
    }>
  ) {
    super();
  }

  override setFrame(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }): void {
    super.setFrame(rect);
  }

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

  static label(
    text: string,
    options?: Partial<{
      font: FontFamily;
      size: number;
    }>
  ): Elem<Label> {
    return Tidy.elem(new Label(text, options), {
      minSize: { w: 0, h: 48 },
      stretch: "horizontal",
    });
  }

  static button(title: string, options?: Partial<{}>): Elem<Button> {
    return Tidy.elem(new Button(title), {
      minSize: { w: 192, h: 64 },
      stretch: "horizontal",
    });
  }
}
