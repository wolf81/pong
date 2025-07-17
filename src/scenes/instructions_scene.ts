import { CANVAS_H, CANVAS_W } from "../constants";
import { Control, UI } from "../core/ui";
import { AudioHelper } from "../helpers/audio_helper";
import { Renderer } from "../lib/renderer";
import { Scene, SceneManager } from "../lib/scene_manager";
import { ServiceLocator } from "../lib/service_locator";
import { Layout, Tidy } from "../lib/tidy";
import { MainMenuScene } from "./main_menu_scene";

function showMainMenu() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  sceneManager.push(new MainMenuScene());
}

export class InstructionsScene extends Scene {
  private _layout: Layout<Control> = Tidy.border([
    UI.panel(),
    Tidy.border(
      [
        Tidy.vstack<Control>(
          [
            UI.label("Instructions", { size: 40, textColor: "#ee2747" }),
            UI.label("You control the left paddle.", {
              size: 26,
              textColor: "#ee2747",
            }),
            UI.label("Press <W> to move up, <S> to move down.", {
              size: 26,
              textColor: "#ee2747",
            }),
            UI.label("You score a point by moving the ball in opponent goal.", {
              size: 26,
              textColor: "#ee2747",
            }),
            UI.label("The first player that scores 5 points wins the game.", {
              size: 26,
              textColor: "#ee2747",
            }),
            UI.button("Menu", { size: 32, onClick: () => showMainMenu() }),
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

    // Create the panel in the center of the screen.
    // The contents will automatically stretch to fit width, but we need to
    // determine height manually in this case.
    const w = 760;
    const h = 40 + 4 * 26 + 64 + 5 * 20 + 32;
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
