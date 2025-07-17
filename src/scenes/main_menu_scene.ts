import { CANVAS_H, CANVAS_W } from "../constants";
import { Control, UI } from "../core/ui";
import { AudioHelper } from "../helpers/audio_helper";
import { Renderer } from "../lib/renderer";
import { Scene, SceneManager } from "../lib/scene_manager";
import { ServiceLocator } from "../lib/service_locator";
import { Layout, Tidy } from "../lib/tidy";
import { GamePlayScene } from "./game_play_scene";
import { InstructionsScene } from "./instructions_scene";

function startGame() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  (sceneManager.current as GamePlayScene).start();
}

function showInstructions() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  sceneManager.push(new InstructionsScene());
}

export class MainMenuScene extends Scene {
  private _layout: Layout<Control> = Tidy.border([
    UI.panel(),
    Tidy.border(
      [
        Tidy.vstack<Control>(
          [
            UI.label("Pong!", { size: 40, textColor: "#ee2747" }),
            UI.button("Play", { size: 32, onClick: () => startGame() }),
            UI.button("Instructions", {
              size: 32,
              onClick: () => showInstructions(),
            }),
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

    // Create the menu panel in the center of the screen.
    // The contents will automatically stretch to fit width, but we need to
    // determine height manually in this case.
    const w = 300;
    const h = 40 + 64 * 2 + 20 * 2 + 32;
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
