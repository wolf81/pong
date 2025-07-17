/**
 * Keep track of user input.
 */
export class InputListener {
  private _keys = new Set<string>();
  private _keyTimes = new Map<
    string,
    { pressedAt: number; lastRepeat: number }
  >();
  private _releasedKeys = new Set<string>();

  private _repeatDelay = 300; // Milliseconds before first repeat.
  private _repeatInterval = 100; // Milliseconds between repeats.

  private _mouseX: number = -1;
  private _mouseY: number = -1;

  private _isMouseDown: boolean = false;
  private _isMouseClicked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      e.preventDefault();
      const key = e.key;
      if (!this._keys.has(key)) {
        this._keys.add(key);
        const now = performance.now();
        this._keyTimes.set(key, {
          pressedAt: now,
          lastRepeat: 0,
        });
      }
    });

    window.addEventListener("keyup", (e) => {
      e.preventDefault();
      const key = e.key;
      this._keys.delete(key);
      this._keyTimes.delete(key);
      this._releasedKeys.add(key);
    });

    window.addEventListener("mousedown", (e) => {
      this._isMouseDown = true;
    });

    window.addEventListener("mouseup", (e) => {
      this._isMouseDown = false;
      this._isMouseClicked = true;
    });

    window.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });
  }

  /** Call this once per frame to reset transient state */
  update() {
    this._releasedKeys.clear();
    this._isMouseClicked = false;
  }

  isKeyDown(key: string): boolean {
    return this._keys.has(key);
  }

  wasKeyReleased(key: string): boolean {
    return this._releasedKeys.has(key);
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this._mouseX, y: this._mouseY };
  }

  get isMouseDown(): boolean {
    return this._isMouseDown;
  }

  get isMouseClicked(): boolean {
    return this._isMouseClicked;
  }

  private shouldFire(key: string): boolean {
    if (!this._keys.has(key)) return false;

    const now = performance.now();
    const times = this._keyTimes.get(key);
    if (!times) return false;

    const heldFor = now - times.pressedAt;

    if (times.lastRepeat === 0) {
      // Handle first press.
      times.lastRepeat = now;
      return true;
    }

    const sinceLast = now - times.lastRepeat;

    if (heldFor >= this._repeatDelay && sinceLast >= this._repeatInterval) {
      times.lastRepeat = now;
      return true;
    }

    return false;
  }
}
