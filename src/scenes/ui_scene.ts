import { ButtonStyle, Layout, Style, UI } from "../lib/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { CANVAS_H, CANVAS_W } from "../constants";

export class TestSceen extends Scene {
  private _ui: Layout = UI.layout();

  private _blackPinkEnabled: boolean = true;

  constructor() {
    super();

    UI.setStyle(uiStyle);

    const label = UI.label("Pong!", {
      align: "center",
      style: {
        font: "40px Jumpman",
        textColor: "#ee2747",
      },
    });

    const button1 = UI.button("Start", {
      minSize: { w: 192, h: 64 },
      // style: blackPink,
      // style: menuButtonStyle,
      enabled: () => this._blackPinkEnabled,
    });

    const button2 = UI.button("Settings", {
      minSize: { w: 192, h: 64 },
      // style: blackPink,
      click: () => (this._blackPinkEnabled = !this._blackPinkEnabled),
    });

    const button3 = UI.button("Quit", {
      minSize: { w: 300 - 32, h: 64 },
      click: () => (this._blackPinkEnabled = !this._blackPinkEnabled),
    });

    const panel = UI.panel([label, button1, button2, button3], {
      background: "button_square_border",
      padding: 16,
      spacing: 16,
    });

    const center = { x: CANVAS_W / 2, y: CANVAS_H / 2 };

    this._ui.addChild(panel, center, {
      anchor: "center",
    });
    this._ui.resize(CANVAS_W, CANVAS_H);
  }

  update(dt: number): void {
    this._ui.update(dt);
  }

  draw(renderer: Renderer): void {
    this._ui.draw(renderer);
  }
}

const mutedGray: Partial<ButtonStyle> = {
  font: "16px Arial",
  textColor: "#fff",
  background: {
    normal: "button_square_flat",
    hover: "#555",
    active: "#666",
  },
};

const blackPink: Partial<ButtonStyle> = {
  font: "16px Arial",
  textColor: "#000000",
  background: {
    normal: "#EBA9B4",
    hover: "#E38494",
    active: "#CC6B7C",
  },
};

const uiStyle: Style = {
  button: {
    font: "32px Jumpman",
    textColor: "#eeeeee",
    background: {
      normal: "button_square_depth_flat",
      hover: "button_square_depth_gloss",
      active: "button_square_gloss",
    },
  },
  label: {
    padding: 20,
    font: "40px Jumpman",
    textColor: "#ee2747",
  },
  panel: {
    background: "button_square_border",
  },
};
