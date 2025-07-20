/**
 * Use the runloop to run the game at fixed intervals.
 */
export class Runloop {
  private static _alpha: number = 0;
  private static _accumulator: number = 0;
  private static _fps: number = 0;
  private static _lastTime: number = performance.now();

  // TODO: Maybe add a VSync option, to draw 60 FPS as well.

  /**
   * The time step between state updates, by default the state is updated at 60
   * FPS.
   */
  static timeStep: number = 1 / 60;

  /**
   * The last time the world was updated.
   */
  public static get lastTime(): number {
    return this._lastTime;
  }

  /**
   * The current frames per second.
   */
  public static get fps(): number {
    return Math.floor(this._fps);
  }

  /**
   * A value between 0.0 and 1.0 that shows how far we're in the current state.
   *
   * The alpha value can be used for rendering, to linear interpolate between
   * current and next position for smoother movement.
   */
  public static get alpha() {
    return this._alpha;
  }

  /**
   * Update the game state with the current time.
   *
   * Apart from updating the game state, this function also calculates the
   * alpha value.
   *
   * @param time The current time.
   * @param onUpdate A callback that includes the delta time. Use the callback
   * to update the game state.
   */
  static update(time: number, onUpdate: (dt: number) => void) {
    const delta = (time - this._lastTime) / 1000;
    this._fps = 1 / delta;
    this._lastTime = time;
    this._accumulator += delta;

    while (this._accumulator >= this.timeStep) {
      onUpdate(this.timeStep);
      this._accumulator -= this.timeStep;
    }

    this._alpha = this._accumulator / this.timeStep;
  }
}
