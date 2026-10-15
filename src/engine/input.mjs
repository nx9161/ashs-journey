// input.mjs — keyboard + touch D-pad/A/B input with per-tick edge detection.
// DOM overlays are built by ui.mjs; this module owns state. Headless driver injects
// via `inject(code)` / `release(code)`. 4-way D-pad: last-pressed-wins diagonals.

export const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a',
  KeyX: 'b', Backspace: 'b',
  ShiftLeft: 'select', ShiftRight: 'select',
  KeyQ: 'pageup', KeyE: 'pagedown',
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4',
  KeyF: 'fullscreen', KeyM: 'mute', Escape: 'escape',
};
export const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select',
  'pageup', 'pagedown', 'slot1', 'slot2', 'slot3', 'slot4', 'fullscreen', 'mute', 'escape'];

export class Input {
  constructor() {
    this.held = {};      // action -> bool (current physical state)
    this.pressed = {};   // action -> bool (edge: went down since last sample)
    this._dirStack = []; // last-pressed-wins for diagonals
    this.remap = Object.assign({}, KEYMAP);
    this.flipControls = false;
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; }
    this._bound = false;
  }

  bindKeyboard() {
    if (this._bound || typeof document === 'undefined') return;
    this._bound = true;
    const down = (e) => {
      const action = this.remap[e.code];
      if (!action) return;
      if (['up', 'down', 'left', 'right', 'a', 'b'].includes(action)) e.preventDefault();
      this._press(action);
    };
    const up = (e) => {
      const action = this.remap[e.code];
      if (!action) return;
      this._release(action);
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    // Touch overlays call press/release directly.
  }

  _press(action) {
    if (!this.held[action]) this.pressed[action] = true;
    this.held[action] = true;
    if (['up', 'down', 'left', 'right'].includes(action)) {
      this._dirStack = this._dirStack.filter((d) => d !== action);
      this._dirStack.push(action);
    }
  }

  _release(action) {
    this.held[action] = false;
    this._dirStack = this._dirStack.filter((d) => d !== action);
  }

  // Public API for touch overlays + headless driver.
  press(action) { this._press(action); }
  release(action) { this._release(action); }
  inject(action) { this._press(action); }      // headless: momentary press
  releaseAll() {
    for (const a of ACTIONS) this._release(a);
  }

  // Called once per sim tick (and per rAF in loop) — edges consumed here.
  sample() {
    // pressed[] stays true until consumed by game code via wasPressed().
  }

  wasPressed(action) {
    const p = !!this.pressed[action];
    this.pressed[action] = false;
    return p;
  }

  isHeld(action) { return !!this.held[action]; }

  // 4-way direction, last-pressed wins (diagonals ignored per gameux §2).
  dir() {
    return this._dirStack.length ? this._dirStack[this._dirStack.length - 1] : null;
  }

  consumeAll() {
    for (const a of ACTIONS) this.pressed[a] = false;
  }
}
