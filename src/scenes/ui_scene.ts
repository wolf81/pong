import { ButtonStyle, Layout, Style, UI } from "../lib/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { CANVAS_H, CANVAS_W } from "../constants";

export class TestSceen extends Scene {
  private _ui: Layout = UI.layout();

  constructor() {
    super();

    this._ui.addChild(
      UI.button({
        style: mutedGray,
      }),
      { x: 0, y: CANVAS_H },
      "bottom-left"
    );
    this._ui.addChild(
      UI.button({
        minSize: { w: 100, h: 100 },
        style: blackPink,
      }),
      { x: CANVAS_W / 2, y: CANVAS_H / 2 },
      "right"
    );
    this._ui.addChild(
      UI.button({}),
      { x: CANVAS_W, y: CANVAS_H },
      "bottom-right"
    );
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
  normalColor: "#444",
  hoverColor: "#555",
  activeColor: "#666",
};

const blackPink: Partial<ButtonStyle> = {
  font: "16px Arial",
  textColor: "#000000",
  normalColor: "#EBA9B4",
  hoverColor: "#E38494",
  activeColor: "#CC6B7C",
};
