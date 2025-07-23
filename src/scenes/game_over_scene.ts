import { CANVAS_H, CANVAS_W } from "../constants";
import { Player } from "../core/types";
import { Control, UI } from "../core/ui";
import { AudioHelper } from "../helpers/audio_helper";
import {
  ServiceLocator,
  SceneManager,
  Layout,
  Tidy,
  Scene,
  Renderer,
} from "../lib/ignite";
import { MainMenuScene } from "./main_menu_scene";

function showMainMenu() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  sceneManager.push(new MainMenuScene());
}

function makeLayout(winner: Player): Layout<Control> {
  return Tidy.border([
    UI.panel(),
    Tidy.border(
      [
        Tidy.vstack<Control>(
          [
            UI.label("Game Over", { size: 26, textColor: "#ee2747" }),
            UI.label(winner === Player.One ? "You Win!" : "You Lose!", {
              size: 40,
              textColor: "#ee2747",
            }),
            UI.button("Menu", { size: 32, onClick: () => showMainMenu() }),
          ],
          { spacing: 20 }
        ),
      ],
      {
        margin: Tidy.margin(16, 16, 16, 16),
      }
    ),
  ]);
}

export class GameOverScene extends Scene {
  private _layout: Layout<Control> = Tidy.border([]);
  private _winner: Player;

  constructor(winner: Player) {
    super();

    this._winner = winner;
    this._layout = makeLayout(winner);

    const w = 300;
    const h = 26 + 40 + 64 + 20 * 2 + 32;
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

  override async init(): Promise<void> {
    switch (this._winner) {
      case Player.One:
        AudioHelper.playSound("you_win");
        break;
      case Player.Two:
        AudioHelper.playSound("you_lose");
        break;
    }
  }
}
