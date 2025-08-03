import { Settings } from "./settings";
import { UI } from "./core/ui";
import { LoadingScene } from "./scenes/loading_scene";
import {
  SceneManager,
  InputListener,
  AssetLoader,
  ServiceLocator,
  Timer,
  Renderer,
  InputAction,
} from "./lib/ignite";

/**
 * The Game class contains the core game logic.
 */
export class Game {
  private _sceneManager: SceneManager;
  private _inputListener: InputListener;
  private _assetLoader: AssetLoader;

  constructor(canvas: HTMLCanvasElement) {
    this._inputListener = new InputListener(canvas);
    ServiceLocator.register(InputListener, this._inputListener);

    this._sceneManager = new SceneManager(canvas.width, canvas.height);
    ServiceLocator.register(SceneManager, this._sceneManager);

    this._assetLoader = new AssetLoader();
    ServiceLocator.register(AssetLoader, this._assetLoader);

    UI.init(canvas);
  }

  async init(): Promise<void> {
    this._sceneManager.switch(new LoadingScene());
  }

  update(dt: number) {
    this._sceneManager.update(dt);

    if (this._inputListener.isInputReleased(InputAction.ButtonL)) {
      Settings.showFps = !Settings.showFps;
      Settings.showDraws = !Settings.showDraws;
    }

    this._inputListener.update();

    Timer.update(dt);
  }

  draw(renderer: Renderer) {
    this._sceneManager.draw(renderer);
  }
}
