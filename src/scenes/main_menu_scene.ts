import { CANVAS_H, CANVAS_W } from "../constants";
import { Control, UI } from "../core/ui";
import { Renderer } from "../lib/renderer";
import { Scene } from "../lib/scene_manager";
import { Layout, Tidy } from "../lib/tidy";

export class MainMenuScene extends Scene {
  private _layout: Layout<Control> = Tidy.border([
    UI.panel(),
    Tidy.border(
      [
        Tidy.vstack<Control>(
          [
            UI.label("Pong!", { size: 40, textColor: "#ee2747" }),
            UI.button("Start", { size: 32 }),
            UI.button("Settings", { size: 32 }),
            UI.button("Quit", { size: 32 }),
          ],
          {
            spacing: 20,
          }
        ),
      ],
      {
        margin: Tidy.margin(16),
      }
    ),
  ]);

  constructor() {
    super();

    const w = 300;
    const h = 48 + 64 * 3 + 20 * 3 + 32;
    const x = (CANVAS_W - w) / 2;
    const y = (CANVAS_H - h) / 2;
    this._layout.reshape(x, y, w, h);
  }

  update(dt: number): void {
    for (let widget of this._layout.widgets()) {
      widget.update(dt);
    }
  }

  draw(renderer: Renderer): void {
    for (let widget of this._layout.widgets()) {
      widget.draw(renderer);
    }
  }
}
