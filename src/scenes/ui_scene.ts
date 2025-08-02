import { ButtonStyle, Layout, Style, UI } from "../lib/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { CANVAS_H, CANVAS_W } from "../constants";

export class TestSceen extends Scene {
  private _ui: Layout = UI.layout();

  private _blackPinkEnabled: boolean = true;

  constructor() {
    super();

    const button1 = UI.button("Who am I?", {
      style: mutedGray,
      enabled: () => false,
    });

    const button2 = UI.button("Play", {
      minSize: { w: 100, h: 100 },
      style: blackPink,
      enabled: () => this._blackPinkEnabled,
    });

    const button3 = UI.button("Herro World!", {
      click: () => (this._blackPinkEnabled = !this._blackPinkEnabled),
    });

    const panel = UI.panel([button1, button2, button3]);
    this._ui.addChild(panel, { x: CANVAS_W / 2, y: CANVAS_H / 2 }, "center");
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
    normal: "#444",
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
