import { Heap } from "./heap";

type ScheduledAction = {
  scheduledAt: number;
  action: () => void;
};

// TODO: Timer methods should return handles that can be used to cancel a timer.

/**
 * A simple timer to schedule actions for execution in the future.
 */
export class Timer {
  private _time: number = 0;

  private _heap: Heap<ScheduledAction>;

  // The default timer that is used when static methods are called.
  private static _default: Timer = new Timer();

  constructor() {
    this._heap = new Heap<ScheduledAction>(
      (a, b) => a.scheduledAt - b.scheduledAt
    );
  }

  /**
   * Call the update method every frame to ensure timers will be invoked at the
   * scheduled time.
   * @param dt
   */
  update(dt: number) {
    this._time += dt;

    while (true) {
      const next = this._heap.peek();

      if (!next || next.scheduledAt > this._time) break;

      this._heap.pop()?.action();
    }
  }

  /**
   * Call the default update method every frame to ensure actions will be
   * invoked at the scheduled time.
   * @param dt
   */
  static update(dt: number) {
    this._default.update(dt);
  }

  /**
   * Invoke an action after a delay.
   * @param delay
   * @param action
   */
  after(delay: number, action: () => void) {
    this._heap.push({ scheduledAt: this._time + delay, action: action });
  }

  /**
   * Use the default timer to invoke an action after a delay.
   * @param delay
   * @param action
   */
  static after(delay: number, action: () => void) {
    this._default.after(delay, action);
  }

  /**
   * Invoke an action every few seconds for some duration.
   * @param delay The delay between invocations.
   * @param duration
   * @param action
   * @param onFinish
   */
  every(
    delay: number,
    duration: number,
    action: () => void,
    onFinish?: () => void
  ) {
    const startTime = this._time + delay;
    const endTime = this._time + duration;

    for (let time = startTime; time <= endTime; time += delay) {
      this._heap.push({ scheduledAt: time, action: action });
    }

    if (onFinish) {
      this._heap.push({ scheduledAt: endTime, action: onFinish });
    }
  }

  /**
   * Use the default timer to invoke an action every few seconds for some
   * duration.
   * @param delay The delay between invocations.
   * @param duration
   * @param action
   * @param onFinish
   */
  static every(
    delay: number,
    duration: number,
    action: () => void,
    onFinish?: () => void
  ) {
    this._default.every(delay, duration, action, onFinish);
  }

  /**
   * Remove all scheduled timers, preventing actions from being invoked in the
   * future.
   */
  removeAllTimers() {
    while (this._heap.size() > 0) {
      this._heap.pop();
    }
  }

  /**
   * Remove all scheduled timers from the default timer, preventing actions
   * from being invoked in the future.
   */
  static removeAllTimers() {
    this._default.removeAllTimers();
  }
}
