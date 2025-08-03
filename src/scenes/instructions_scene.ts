import { CANVAS_H, CANVAS_W } from "../constants";
import { AudioHelper } from "../helpers/audio_helper";
import { Renderer, Scene, SceneManager, ServiceLocator } from "../lib/ignite";
import { Layout, UI } from "../lib/ignite/ui";
import { MainMenuScene } from "./main_menu_scene";

function showMainMenu() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  sceneManager.push(new MainMenuScene());
}

export class InstructionsScene extends Scene {
  private _layout: Layout;
  /*
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
        margin: Tidy.margin(16, 16, 16, 16),
      }
    ),
  ]);
  */

  constructor() {
    super();

    this._layout = UI.layout();

    const label1 = UI.label("Instructions");
    const label2 = UI.label("You control the left paddle.", {
      style: { font: "26px Jumpman" },
    });
    const label3 = UI.label("Press <W> to move up, <S> to move down.", {
      style: { font: "26px Jumpman" },
    });
    const label4 = UI.label(
      "You score a point by moving the ball in opponent goal.",
      { style: { font: "26px Jumpman" } }
    );
    const label5 = UI.label(
      "The first player that scores 5 points wins the game.",
      { style: { font: "26px Jumpman" } }
    );
    const button = UI.button("Menu", {
      options: { click: () => showMainMenu() },
    });

    const panel = UI.panel([label1, label2, label3, label4, label5, button], {
      style: { spacing: 20 },
    });
    this._layout.addChild(
      panel,
      { x: CANVAS_W / 2, y: CANVAS_H / 2 },
      { anchor: "center", size: { w: 760, h: "wrap" } }
    );

    this._layout.resize(CANVAS_W, CANVAS_H);
  }

  update(dt: number): void {
    this._layout.update(dt);
  }

  draw(renderer: Renderer): void {
    this._layout.draw(renderer);
  }
}
