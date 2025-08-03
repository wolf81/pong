import { CANVAS_H, CANVAS_W } from "../constants";
import { AudioHelper } from "../helpers/audio_helper";
import { ServiceLocator, SceneManager, Scene, Renderer } from "../lib/ignite";
import { Layout, Style, UI } from "../lib/ignite/ui";
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
  private _layout: Layout;

  constructor() {
    super();

    UI.setStyle(uiStyle);

    this._layout = UI.layout();

    const label = UI.label("Pong!");
    const button1 = UI.button("Play", {
      options: {
        click: () => startGame(),
      },
    });
    const button2 = UI.button("Instructions", {
      options: { click: () => showInstructions() },
    });
    const panel = UI.panel([label, button1, button2]);

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
}

const uiStyle: Style = {
  button: {
    font: "32px Jumpman",
    minSize: { w: 192, h: 64 },
    textColor: "#ffffff",
    background: {
      normal: "button_square_depth_flat",
      hover: "button_square_depth_gloss",
      active: "button_square_gloss",
    },
  },
  label: {
    align: "center",
    font: "40px Jumpman",
    padding: 10,
    textColor: "#ee2747",
  },
  panel: {
    padding: 16,
    spacing: 16,
    background: "button_square_border",
  },
};
