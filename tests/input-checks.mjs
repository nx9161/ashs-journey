// tests/input-checks.mjs — Wave E: gamepad wiring checks (headless).
//   node tests/input-checks.mjs
// Drives src/engine/input.mjs with a stubbed navigator.getGamepads:
// standard-mapping buttons + left stick must land on the same action
// layer as keyboard/touch, and absent/disconnected pads must be a
// silent no-op (the game also runs where navigator has no gamepad API).

import { Input } from '../src/engine/input.mjs';

let pass = 0; const failures = [];
function ok(name, cond) { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name); } }

function fakePad() {
  return {
    connected: true,
    buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
    axes: [0, 0, 0, 0],
  };
}
let pads = [];
function setNavigator(v) {
  Object.defineProperty(globalThis, 'navigator', { value: v, configurable: true, writable: true });
}
setNavigator({ getGamepads: () => pads });

// --- absent pad: no API, empty list, null slots — all silent no-ops ---
{
  const inp = new Input();
  setNavigator({});
  inp.sample();
  ok('no gamepad API: sample() is a no-op', inp.dir() === null && !inp.isHeld('a'));
  setNavigator({ getGamepads: () => pads });
  pads = [];
  inp.sample();
  ok('empty pad list: no-op', inp.dir() === null);
  pads = [null, null];
  inp.sample();
  ok('null pad slots: no-op', inp.dir() === null);
}

// --- buttons: A/B/Start/Select/shoulders map to the action layer ---
{
  const inp = new Input();
  const pad = fakePad();
  pads = [pad];
  pad.buttons[0].pressed = true;
  inp.sample();
  ok('button 0 (A) presses action a', inp.wasPressed('a') && inp.isHeld('a'));
  pad.buttons[0].pressed = false;
  inp.sample();
  ok('button 0 release releases a', !inp.isHeld('a'));
  pad.buttons[1].pressed = true; inp.sample();
  ok('button 1 (B) presses action b', inp.wasPressed('b'));
  pad.buttons[1].pressed = false; inp.sample();
  pad.buttons[9].pressed = true; inp.sample();
  ok('button 9 presses start', inp.wasPressed('start'));
  pad.buttons[9].pressed = false; inp.sample();
  pad.buttons[8].pressed = true; inp.sample();
  ok('button 8 presses select', inp.wasPressed('select'));
  pad.buttons[8].pressed = false; inp.sample();
  pad.buttons[4].pressed = true; inp.sample();
  ok('button 4 (LB) presses pageup', inp.wasPressed('pageup'));
  pad.buttons[4].pressed = false;
  pad.buttons[5].pressed = true; inp.sample();
  ok('button 5 (RB) presses pagedown', inp.wasPressed('pagedown'));
  pad.buttons[5].pressed = false; inp.sample();
  ok('held button does not re-fire its edge', !inp.wasPressed('pagedown'));
}

// --- D-pad + stick: directions with last-pressed-wins, like the keys ---
{
  const inp = new Input();
  const pad = fakePad();
  pads = [pad];
  pad.buttons[12].pressed = true; inp.sample();
  ok('d-pad up drives dir()', inp.dir() === 'up' && inp.isHeld('up'));
  pad.buttons[14].pressed = true; inp.sample();
  ok('d-pad left wins as last pressed', inp.dir() === 'left');
  pad.buttons[14].pressed = false; inp.sample();
  ok('releasing left falls back to held up', inp.dir() === 'up');
  pad.buttons[12].pressed = false; inp.sample();
  ok('all d-pad released: dir() null', inp.dir() === null);
  pad.axes[0] = 0.9; inp.sample();
  ok('stick right (0.9) drives dir()', inp.dir() === 'right');
  pad.axes[0] = 0.3; inp.sample();
  ok('stick under threshold (0.3) releases', inp.dir() === null);
  pad.axes[1] = -0.9; inp.sample();
  ok('stick up (-0.9) drives dir()', inp.dir() === 'up');
  pad.axes[1] = 0; inp.sample();
  ok('stick centered releases', inp.dir() === null);
}

// --- hot-plug: first CONNECTED pad wins; disconnect releases its holds ---
{
  const inp = new Input();
  const dead = fakePad(); dead.connected = false;
  const live = fakePad();
  pads = [dead, live];
  live.buttons[0].pressed = true;
  inp.sample();
  ok('disconnected first pad is skipped', inp.isHeld('a') && inp.wasPressed('a'));
  pads = [null];
  inp.sample();
  ok('disconnect releases pad-held actions', !inp.isHeld('a') && inp.dir() === null);
  inp.sample();
  ok('post-disconnect samples stay quiet', !inp.wasPressed('a'));
}

console.log('input-checks: ' + pass + '/' + (pass + failures.length) + ' passed');
if (failures.length) { console.log('FAILURES: ' + failures.join('; ')); process.exit(1); }
