import { Vector } from "./vector";

export enum InputAction {
  DPadU = 1 << 0,
  DPadD = 1 << 1,
  DPadL = 1 << 2,
  DPadR = 1 << 3,
  ButtonA = 1 << 4,
  ButtonB = 1 << 5,
  ButtonX = 1 << 6,
  ButtonY = 1 << 7,
  ButtonL = 1 << 8,
  ButtonR = 1 << 9,
  Start = 1 << 10,
  Select = 1 << 11,
}

/**
 - Always allow mouse input.
 - Switch between keyboard and gamepad as needed.
 - input actions are mapped to gamepad controls.
 - Keyboard keys are mapped to input actions (gamepad controls are leading with regards to possible actions).
 - Use settings to map keyboard inputs to gamepad inputs with sensible defaults.
 - Ideally we develop games that can be played with standard SNES-like controls.
 - TODO: With regards to UI controls, when mouse is used, hide focus, otherwise use focus on key press. 
 */

/**
 * Keep track of user input.
 */
export class InputListener {
  private readonly _keyboardInputMap: Map<string, InputAction>;
  private readonly _gamepadInputMap: Map<number, InputAction>;
  private readonly _heldKeys: Set<string> = new Set<string>();

  private _mousePos: Vector = Vector.new(-1, -1);
  private _isMouseDown: boolean = false;
  private _isMouseClicked: boolean = false;

  /**
   * The state buffer contains both current & previous states.
   */
  private _stateBuffer = [0, 0];
  /**
   * The index of the current state in the buffer, changed on every update.
   */
  private _stateIdx = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._keyboardInputMap = new Map<string, InputAction>([
      ["w", InputAction.DPadU],
      ["s", InputAction.DPadD],
      ["a", InputAction.DPadL],
      ["d", InputAction.DPadR],
      [" ", InputAction.ButtonA],
      ["enter", InputAction.Start],
      ["escape", InputAction.Select],
      ["f5", InputAction.ButtonL],
      ["f6", InputAction.ButtonR]
    ]);
    this._gamepadInputMap = new Map<number, InputAction>([
      [12, InputAction.DPadU],
      [13, InputAction.DPadD],
      [14, InputAction.DPadL],
      [15, InputAction.DPadR],
      [0, InputAction.ButtonA],
      [1, InputAction.ButtonB],
      [2, InputAction.ButtonX],
      [3, InputAction.ButtonY],
      [4, InputAction.ButtonL], // maybe 6
      [5, InputAction.ButtonR], // maybe 7
      [8, InputAction.Start],
      [9, InputAction.Select],
    ]);

    window.addEventListener("keydown", (e) => {
      e.preventDefault();
      this._heldKeys.add(e.key.toLowerCase());
    });

    window.addEventListener("keyup", (e) => {
      e.preventDefault();
      this._heldKeys.delete(e.key.toLowerCase());
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
      this._mousePos.x = e.clientX - rect.left;
      this._mousePos.y = e.clientY - rect.top;
    });

    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected:", e.gamepad);
    });
  }

  update() {
    // Toggle active input states.
    this._stateIdx = 1 - this._stateIdx;
    // State with an empty current state.
    var state = 0;

    this._isMouseClicked = false;

    // Add gamepad inputs to current input state.
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Use first connected gamepad
    if (gp) {
      for (let [index, action] of this._gamepadInputMap) {
        if (gp.buttons[index].pressed) {
          state |= action;
        }
      }
    }

    // Add keyboard inputs to current input state.
    for (const key of this._heldKeys) {
      const action = this._keyboardInputMap.get(key);
      if (action) {
        state |= action;
      }
    }

    // Set current state.
    this._stateBuffer[this._stateIdx] = state;
  }

  isInputDown(input: InputAction): boolean {
    const state = this._stateBuffer[this._stateIdx];
    return (state & input) !== 0;
  }

  isInputReleased(input: InputAction): boolean {
    const state = this._stateBuffer[this._stateIdx];
    const lastState = this._stateBuffer[1 - this._stateIdx];

    return (state & input) !== 0 && (lastState & input) === 0;
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this._mousePos.x, y: this._mousePos.y };
  }

  get isMouseDown(): boolean {
    return this._isMouseDown;
  }

  get isMouseClicked(): boolean {
    return this._isMouseClicked;
  }
}
