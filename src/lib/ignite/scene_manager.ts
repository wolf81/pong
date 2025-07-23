import { Renderer } from "./renderer";

export abstract class Scene {
  /**
   * Use the initializer to load resources asynchronously.
   */
  async init(): Promise<void> {}

  /**
   * Use the deinitializer to unload resources.
   */
  deinit(): void {}

  abstract update(dt: number): void;

  abstract draw(renderer: Renderer): void;
}

export class SceneManager {
  private _scenes: Scene[] = [
    {
      // A dummy scene to avoid null checks - replace by calling switch()
      async init(): Promise<void> {},
      deinit(): void {},
      update(): void {},
      draw(): void {},
    },
  ];

  /**
   * Get the current active scene, the top-most scene from the internal stack.
   */
  get current(): Scene {
    return this._scenes[this._scenes.length - 1];
  }

  /**
   * Create a scene manager.
   * @param width The width of a scene, typically the canvas width.
   * @param height The height of a scene, typically the canvas height.
   */
  constructor(public readonly width: number, public readonly height: number) {}

  // Replaces all scenes in stack with new scene.
  async switch(scene: Scene) {
    await scene.init();
    this._scenes = [scene];
  }

  // Push a scene upon the stack, can be used to render multiple scenes.
  async push(scene: Scene) {
    await scene.init();
    this._scenes.push(scene);
  }

  // Pop a scene from the stack. Returns false if last scene on the stack.
  pop(): boolean {
    if (this._scenes.length > 1) {
      this._scenes.pop();
      return true;
    }

    return false;
  }

  update(dt: number) {
    const frontScene = this._scenes[this._scenes.length - 1];
    frontScene.update(dt);
  }

  draw(renderer: Renderer) {
    for (let scene of this._scenes) {
      scene.draw(renderer);
    }
  }
}
