import { TextureHelper } from "../helpers/texture_helper";
import { AssetLoader } from "../lib/asset_loader";
import { Renderer, TextAlign } from "../lib/renderer";
import { ServiceLocator } from "../lib/service_locator";
import { Rect } from "../lib/shape";
import { Elem, Tidy, Layoutable } from "../lib/tidy";
import { Size } from "../math/size";
import { Vector } from "../math/vector";

type FontFamily = "Jumpman";
type Drawable = HTMLCanvasElement | HTMLImageElement;

export enum ControlState {
  Normal,
  Hover,
  Active,
  Disabled,
}

export abstract class Control implements Layoutable {
  private _state: ControlState = ControlState.Normal;

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
  private _textColor: string;
  private _fontSize: number;

  constructor(
    text: string,
    options?: Partial<{
      font: FontFamily;
      size: number;
      textColor: string;
    }>
  ) {
    super();

    this._text = text;

    this._textColor = options?.textColor ?? "#eeeeee";
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
    this._oy = rect.y + Math.floor(rect.h / 2);
  }

  draw(renderer: Renderer): void {
    renderer.drawText(this._text, this._ox, this._oy, {
      font: this._font,
      align: "center",
      color: this._textColor,
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

export class Button extends Label {
  private _background!: Drawable;

  private _stateBackgrounds: Map<ControlState, Drawable> = new Map<
    ControlState,
    Drawable
  >();

  constructor(
    title: string,
    options?: Partial<{
      font: FontFamily;
      size: number;
    }>
  ) {
    super(title, options);
  }

  override setFrame(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }): void {
    super.setFrame(rect);

    const assetLoader = ServiceLocator.resolve(AssetLoader);

    let normalImage: Drawable = assetLoader.getImage("button_square_gloss");
    normalImage = TextureHelper.stretch(normalImage, rect.w, rect.h);
    this._stateBackgrounds.set(ControlState.Normal, normalImage);

    let hoverImage: Drawable = assetLoader.getImage(
      "button_square_depth_gloss"
    );
    hoverImage = TextureHelper.stretch(hoverImage, rect.w, rect.h);
    this._stateBackgrounds.set(ControlState.Hover, hoverImage);

    this._background = this._stateBackgrounds.get(ControlState.Normal)!;

    this.setState(ControlState.Normal);
  }

  override setState(state: ControlState): void {
    super.setState(state);

    this._background = this._stateBackgrounds.get(this.state)!;
  }

  update(dt: number): void {}

  draw(renderer: Renderer): void {
    renderer.drawImage(this._background, this._frame.x, this._frame.y);

    super.draw(renderer);
  }
}

export class UI {
  static mouse: {
    x: number;
  };

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
      textColor: string;
    }>
  ): Elem<Label> {
    return Tidy.elem(new Label(text, options), {
      minSize: { w: 0, h: 48 },
      stretch: "horizontal",
    });
  }

  static button(title: string, options?: Partial<{}>): Elem<Button> {
    return Tidy.elem(new Button(title, options), {
      minSize: { w: 192, h: 64 },
      stretch: "horizontal",
    });
  }
}
