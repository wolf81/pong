import { Heap } from "./heap";

type ScheduledAction = {
  scheduledAt: number;
  action: () => void;
};

export class Timer {
  private _time: number = 0;

  private _heap: Heap<ScheduledAction>;

  private static _default: Timer = new Timer();

  constructor() {
    this._heap = new Heap<ScheduledAction>(
      (a, b) => a.scheduledAt - b.scheduledAt
    );
  }

  update(dt: number) {
    this._time += dt;

    while (true) {
      const next = this._heap.peek();
      if (!next || next.scheduledAt > this._time) break;

      this._heap.pop()?.action();
    }
  }

  static update(dt: number) {
    this._default.update(dt);
  }

  after(delay: number, action: () => void) {
    this._heap.push({ scheduledAt: this._time + delay, action: action });
  }

  static after(delay: number, action: () => void) {
    this._default.after(delay, action);
  }

  every(
    delay: number,
    duration: number,
    action: () => void,
    onFinish?: () => void
  ) {
    const startTime = this._time + delay;
    const endTime = this._time + duration;

    for (let time = startTime; time < endTime; time += delay) {
      this._heap.push({ scheduledAt: time, action: action });
    }

    if (onFinish) {
      this._heap.push({ scheduledAt: endTime, action: onFinish });
    }
  }

  static every(
    delay: number,
    duration: number,
    action: () => void,
    onFinish?: () => void
  ) {
    this._default.every(delay, duration, action, onFinish);
  }

  removeAllTimers() {
    while (this._heap.size() > 0) {
      this._heap.pop();
    }
  }

  static removeAllTimers() {
    this._default.removeAllTimers();
  }
}
