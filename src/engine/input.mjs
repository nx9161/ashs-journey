// input.mjs — keyboard + touch D-pad/A/B input with per-tick edge detection.
// DOM overlays are built by ui.mjs; this module owns state. Headless driver injects
// via `inject(code)` / `release(code)`. 4-way D-pad: last-pressed-wins diagonals.

export const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a',
  Enter: 'start', // Uix ruling (phase4-uix-signoff): Enter = START, A = Z/Space. One key, one job.
  KeyX: 'b', Backspace: 'b',
  ShiftLeft: 'select', ShiftRight: 'select',
  KeyQ: 'pageup', KeyE: 'pagedown',
  PageUp: 'pageup', PageDown: 'pagedown', // laptop physicals (Mac: fn+↑/↓)
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4',
  KeyF: 'fullscreen', KeyM: 'mute', Escape: 'escape',
};
export const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select',
  'pageup', 'pagedown', 'slot1', 'slot2', 'slot3', 'slot4', 'fullscreen', 'mute', 'escape'];
// Gamepad (W3C standard mapping): button index -> action. Shoulders page
// lists (the game's pageup/pagedown equivalents); 12-15 are the D-pad.
export const PAD_BUTTONS = { 0: 'a', 1: 'b', 4: 'pageup', 5: 'pagedown', 8: 'select', 9: 'start',
  12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class Input {
  constructor() {
    this.held = {};      // action -> bool (current physical state)
    this.pressed = {};   // action -> bool (edge: went down since last sample)
    this._dirStack = []; // last-pressed-wins for diagonals
    this.remap = Object.assign({}, KEYMAP);
    this._padHeld = {};  // action -> bool, gamepad-sourced held state
    this.flipControls = false;
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; }
    this._bound = false;
  }

  bindKeyboard() {
    if (this._bound || typeof document === 'undefined') return;
    this._bound = true;
    // AUDIT FIX (S-38, blocker): keystrokes typed into form fields (auth
    // username/password, any DOM input) belong to the field, never to the
    // game — without this shield, letters a/d/s/w/z/x and Space were
    // preventDefault()ed as game keys and could not be typed at all.
    const fromField = (e) => {
      const t = e.target;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    };
    const down = (e) => {
      if (fromField(e)) return;
      const action = this.remap[e.code];
      if (!action) return;
      if (['up', 'down', 'left', 'right', 'a', 'b'].includes(action)) e.preventDefault();
      this._press(action, !!e.repeat);
    };
    const up = (e) => {
      if (fromField(e)) return;
      const action = this.remap[e.code];
      if (!action) return;
      this._release(action);
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    // Touch overlays call press/release directly.
  }

  // Gamepad polling, called once per tick from sample(). The first
  // connected pad wins; the left stick acts as digital directions at a
  // 0.5 threshold. State transitions feed the same _press/_release path
  // as keyboard/touch, so edges, held state and the direction stack
  // behave identically. No pad, no API (headless), or a disconnect is a
  // silent no-op — a disconnect simply releases whatever the pad held.
  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    let pad = null;
    for (const p of navigator.getGamepads() || []) if (p && p.connected) { pad = p; break; }
    const now = {};
    if (pad) {
      for (const i in PAD_BUTTONS) if (pad.buttons[i] && pad.buttons[i].pressed) now[PAD_BUTTONS[i]] = true;
      const x = pad.axes[0] || 0, y = pad.axes[1] || 0;
      if (x < -0.5) now.left = true; else if (x > 0.5) now.right = true;
      if (y < -0.5) now.up = true; else if (y > 0.5) now.down = true;
    }
    for (const a of ACTIONS) {
      const is = !!now[a];
      if (is === !!this._padHeld[a]) continue;
      this._padHeld[a] = is;
      if (is) this._press(a); else this._release(a);
    }
  }

  _press(action, repeat) {
    // AUDIT FIX (laptop paging): OS key-repeat re-fires direction edges so
    // HOLDING an arrow scrolls menus/lists (Platinum behavior). Buttons
    // (a/b/start) stay edge-only — a held A must never double-confirm.
    if (!this.held[action] || (repeat && ['up', 'down', 'left', 'right'].includes(action))) this.pressed[action] = true;
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
    this.pollGamepad();
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
