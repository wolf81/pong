import { Layout, UI } from "../lib/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { CANVAS_H, CANVAS_W } from "../constants";
import { ControlState } from "../core/ui";

export class TestSceen extends Scene {
  private _ui: Layout = UI.layout();

  constructor() {
    super();

    this._ui.addChild(
      UI.button({
        background: {
          [ControlState.Normal]: "#ffbbcc",
          [ControlState.Hover]: "#ff33aa",
        },
      }),
      { x: 0, y: CANVAS_H },
      "bottom-left"
    );
    this._ui.addChild(
      UI.button({
        background: {
          [ControlState.Normal]: "#88aa55",
          [ControlState.Hover]: "#889933",
          [ControlState.Active]: "#776633",
        },
        minSize: { w: 100, h: 100 },
      }),
      { x: CANVAS_W / 2, y: CANVAS_H / 2 },
      "right"
    );
    this._ui.addChild(
      UI.button({
        background: {
          [ControlState.Normal]: "#4422cc",
          [ControlState.Hover]: "#4466ff",
        },
      }),
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
