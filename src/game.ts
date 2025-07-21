import { Renderer } from "./lib/renderer";
import { AssetLoader } from "./lib/asset_loader";
import { InputListener } from "./lib/input_listener";
import { SceneManager } from "./lib/scene_manager";
import { ServiceLocator } from "./lib/service_locator";
import { Settings } from "./settings";
import { UI } from "./core/ui";
import { Timer } from "./lib/timer";
import { LoadingScene } from "./scenes/loading_scene";

/**
 * The Game class contains the core game logic.
 */
export class Game {
  private _sceneManager: SceneManager;
  private _inputListener: InputListener;

  constructor(canvas: HTMLCanvasElement) {
    this._inputListener = new InputListener(canvas);
    ServiceLocator.register(InputListener, this._inputListener);

    this._sceneManager = new SceneManager(canvas.width, canvas.height);
    ServiceLocator.register(SceneManager, this._sceneManager);

    UI.init(canvas);
  }

  async init(): Promise<void> {
    const assetLoader = new AssetLoader();
    await assetLoader.preload();
    ServiceLocator.register(AssetLoader, assetLoader);

    this._sceneManager.switch(new LoadingScene());
  }

  update(dt: number) {
    this._sceneManager.update(dt);

    if (this._inputListener.wasKeyReleased("F1")) {
      Settings.showFps = !Settings.showFps;
      Settings.showDraws = !Settings.showDraws;
    }

    this._inputListener.update();

    Timer.update(dt);
    UI.update();
  }

  draw(renderer: Renderer) {
    this._sceneManager.draw(renderer);
  }
}
