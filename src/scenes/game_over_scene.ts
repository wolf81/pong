import { CANVAS_H, CANVAS_W } from "../constants";
import { Player } from "../core/types";
import { AudioHelper } from "../helpers/audio_helper";
import { ServiceLocator, SceneManager, Scene, Renderer } from "../lib/ignite";
import { Layout, UI } from "../lib/ignite/ui";
import { MainMenuScene } from "./main_menu_scene";

function showMainMenu() {
  AudioHelper.playSound("click5");
  const sceneManager = ServiceLocator.resolve(SceneManager);
  sceneManager.pop();
  sceneManager.push(new MainMenuScene());
}

export class GameOverScene extends Scene {
  private _layout: Layout;
  private _winner: Player;

  constructor(winner: Player) {
    super();

    this._winner = winner;

    this._layout = UI.layout();

    const label1 = UI.label("Game Over");
    const label2 = UI.label(winner === Player.One ? "You Win!" : "You Lose!");
    const button = UI.button("Menu", {
      options: { click: () => showMainMenu() },
    });

    const panel = UI.panel([label1, label2, button]);

    this._layout.addChild(
      panel,
      { x: CANVAS_W / 2, y: CANVAS_H / 2 },
      { anchor: "center", size: { w: 300, h: "wrap" } }
    );

    this._layout.resize(CANVAS_W, CANVAS_H);
  }

  update(dt: number): void {
    this._layout.update(dt);
  }

  draw(renderer: Renderer): void {
    this._layout.draw(renderer);
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
