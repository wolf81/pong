import { TextureHelper } from "../helpers/texture_helper";
import {
  ServiceLocator,
  AssetLoader,
  Layoutable,
  Rect,
  Shape,
  Renderer,
  Elem,
  Tidy,
  Vector,
} from "../lib/ignite";

type FontFamily = "Jumpman";
type Drawable = HTMLCanvasElement | HTMLImageElement;
type Mouse = {
  pos: Vector;
  buttonState: "none" | "down" | "up";
};

type LabelOptions = {
  font: FontFamily;
  size: number;
  textColor: string;
  background: string;
};
type ButtonOptions = LabelOptions & {
  onClick: () => void;
  normalImage: string;
  hoverImage: string;
  activeImage: string;
  disabledImage: string;
};

function loadImage(name: string): Drawable {
  const assetLoader = ServiceLocator.resolve(AssetLoader);
  return assetLoader.getImage(name);
}

export enum ControlState {
  // Default state when no interactions happen inside the control.
  Normal,
  // Hover & highlight state, e.g. when mouse is hovering over the control.
  Hover,
  // Active & selected state, e.g. when mouse is pressed inside the control.
  Active,
  // Disabled state, no interaction possible.
  Disabled,
}

export abstract class Control implements Layoutable {
  private _state: ControlState = ControlState.Normal;

  protected _frame: Rect = Shape.rect(0, 0, 0, 0);

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
    this._frame = Shape.rect(rect.x, rect.y, rect.w, rect.h);
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
  private _backgroundName?: string;
  protected _background?: Drawable;

  constructor(text: string, options?: Partial<LabelOptions>) {
    super();

    this._text = text;

    this._textColor = options?.textColor ?? "#eeeeee";
    const fontName = options?.font ?? "Jumpman";
    this._fontSize = options?.size ?? 24;
    this._font = `${this._fontSize}px ${fontName}`;
    this._backgroundName = options?.background;
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

    if (this._backgroundName) {
      let image: Drawable = loadImage(this._backgroundName);
      this._background = TextureHelper.stretch(image, rect.w, rect.h);
    }
  }

  draw(renderer: Renderer): void {
    if (this._background) {
      renderer.drawImage(this._background, this.frame.x, this.frame.y);
    }

    renderer.drawText(this._text, this._ox, this._oy, {
      font: this._font,
      align: "center",
      color: this._textColor,
    });
  }
}

export class Panel extends Control {
  private _background!: HTMLCanvasElement;
  private _imageName: string;

  constructor(imageName: string) {
    super();
    this._imageName = imageName;
  }

  draw(renderer: Renderer): void {
    renderer.drawImage(this._background, this._frame.x, this._frame.y);
  }

  setFrame(rect: { x: number; y: number; w: number; h: number }): void {
    super.setFrame(rect);

    const assetLoader = ServiceLocator.resolve(AssetLoader);
    const image = assetLoader.getImage(this._imageName);
    this._background = TextureHelper.stretch(image, rect.w, rect.h);
  }
}

export class Button extends Label {
  private _onClick: () => void;

  private _stateBackgrounds: Map<ControlState, Drawable> = new Map<
    ControlState,
    Drawable
  >();

  constructor(title: string, options?: Partial<ButtonOptions>) {
    super(title, options);

    this._onClick = options?.onClick ? options.onClick : () => {};
  }

  override setFrame(rect: {
    x: number;
    y: number;
    w: number;
    h: number;
  }): void {
    super.setFrame(rect);

    const assetLoader = ServiceLocator.resolve(AssetLoader);

    const stateImageInfo: Map<ControlState, string> = new Map<
      ControlState,
      string
    >([
      [ControlState.Normal, "button_square_depth_flat"],
      [ControlState.Hover, "button_square_depth_gloss"],
      [ControlState.Active, "button_square_gloss"],
      [ControlState.Disabled, "button_square_depth_flat"],
    ]);

    for (let [state, imageName] of stateImageInfo) {
      let image: Drawable = assetLoader.getImage(imageName);
      image = TextureHelper.stretch(image, rect.w, rect.h);
      this._stateBackgrounds.set(state, image);
    }

    this._background = this._stateBackgrounds.get(ControlState.Normal)!;
  }

  override setState(state: ControlState): void {
    super.setState(state);

    this._background = this._stateBackgrounds.get(this.state)!;
  }

  update(dt: number): void {
    const isHit = Shape.containsPoint(this._frame, UI.mouse.pos);
    const isPress = isHit && UI.mouse.buttonState === "down";
    const isRelease =
      this.state === ControlState.Active && UI.mouse.buttonState === "up";

    if (!isHit) {
      this.setState(ControlState.Normal);
    } else {
      this.setState(ControlState.Hover);
    }

    if (isPress && !isRelease) {
      const state =
        UI.mouse.buttonState === "down"
          ? ControlState.Active
          : ControlState.Hover;
      this.setState(state);
    }

    if (isRelease) {
      this._onClick();
      this.setState(ControlState.Normal);
    }
  }
}

class Space extends Control {
  draw(_: Renderer): void {}
}

export class UI {
  static panel(imageName: string = "button_square_border"): Elem<Panel> {
    return Tidy.elem(new Panel(imageName), {
      minSize: { w: 0, h: 0 },
      stretch: "all",
    });
  }

  static label(text: string, options?: Partial<LabelOptions>): Elem<Label> {
    return Tidy.elem(new Label(text, options), {
      minSize: { w: 0, h: options?.size ?? 48 },
      stretch: "horizontal",
    });
  }

  static button(title: string, options?: Partial<ButtonOptions>): Elem<Button> {
    return Tidy.elem(new Button(title, options), {
      minSize: { w: 192, h: 64 },
      stretch: "horizontal",
    });
  }

  static flexSpace(stretch: "horizontal" | "vertical"): Elem<Space> {
    return Tidy.elem(new Space(), { stretch: stretch });
  }

  private static _mouse: Mouse = {
    pos: { x: 0, y: 0 },
    buttonState: "none",
  };

  static get mouse(): Mouse {
    return this._mouse;
  }

  static init(canvas: HTMLCanvasElement) {
    window.addEventListener("mousedown", (e) => {
      this._mouse.buttonState = "down";
    });

    window.addEventListener("mouseup", (e) => {
      this._mouse.buttonState = "up";
    });

    window.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouse.pos.x = e.clientX - rect.left;
      this._mouse.pos.y = e.clientY - rect.top;
    });
  }

  static update() {
    if (this._mouse.buttonState === "up") {
      this._mouse.buttonState = "none";
    }
  }
}
