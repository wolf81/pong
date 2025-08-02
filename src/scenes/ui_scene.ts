import { Layout, UI } from "../lib/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { CANVAS_H, CANVAS_W } from "../constants";

export class TestSceen extends Scene {
  private _ui: Layout = UI.layout();

  constructor() {
    super();

    this._ui.addChild(UI.button({ background: "#abc" }), 0, 1, "center");
    this._ui.addChild(
      UI.button({ background: "#abc", minSize: { w: 100, h: 100 } }),
      1,
      0.5,
      "right"
    );
    this._ui.addChild(UI.button({ background: "#abc" }), 1, 1, "bottom-right");
    this._ui.resize(CANVAS_W, CANVAS_H);
  }

  update(dt: number): void {
    this._ui.update(dt);
  }

  draw(renderer: Renderer): void {
    this._ui.draw(renderer);
  }
}
