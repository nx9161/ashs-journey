
// ---- src/engine/rng.mjs ----
// rng.mjs — seeded multi-stream PRNG (mulberry32 class).
// Separate streams: rng.encounter / rng.battle / rng.misc — QA can lock battle RNG
// while leaving encounters live (architecture §7.1). Same seed + same inputs =
// identical playthrough.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRngStreams(seed) {
  const s = seed >>> 0;
  return {
    seed: s,
    encounter: mulberry32(s ^ 0x9e3779b9),
    battle: mulberry32(s ^ 0x85ebca6b),
    misc: mulberry32(s ^ 0xc2b2ae35),
  };
}

// roll(p, rngFn): true with probability p in [0,1].
function roll(p, rngFn) {
  return rngFn() < p;
}

// intIn(lo, hi, rngFn): uniform integer in [lo, hi].
function intIn(lo, hi, rngFn) {
  return lo + Math.floor(rngFn() * (hi - lo + 1));
}

// pick weighted: entries [[weight, value], ...]
function pickWeighted(entries, rngFn) {
  let total = 0;
  for (let i = 0; i < entries.length; i++) total += entries[i][0];
  let r = rngFn() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i][0];
    if (r <= 0) return entries[i][1];
  }
  return entries[entries.length - 1][1];
}


// ---- src/engine/formulas.mjs ----
// formulas.mjs — battle math as PURE functions (architecture §7.3).
// Reimplemented from documented Gen 4/5 systems (dossier §B). Named exports double
// as the ADR note's documented constants. Unit-testable without a browser.

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

// Attacking type -> defending type -> multiplier. Absent = 1.
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

function effectiveness(moveType, defenderTypes) {
  const row = TYPE_CHART[moveType] || {};
  let m = 1;
  for (let i = 0; i < defenderTypes.length; i++) {
    m *= (row[defenderTypes[i]] !== undefined ? row[defenderTypes[i]] : 1);
  }
  return m;
}

// Documented Gen 4/5 damage: floor(floor(floor(2*L/5+2)*Power*A/D)/50)+2
// then STAB 1.5x, type effectiveness, crit 2x (1/16 Gen 2-5), random 0.85-1.00,
// burn halves physical.
function calcDamage(level, power, atk, def, opts) {
  const o = opts || {};
  const stab = o.stab ? 1.5 : 1;
  const eff = o.effectiveness !== undefined ? o.effectiveness : 1;
  const crit = o.crit ? 2 : 1;
  const rand = o.random !== undefined ? o.random : 1;
  const burn = o.burn && o.physical ? 0.5 : 1;
  const base = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * atk / def) / 50) + 2;
  return Math.max(1, Math.floor(base * stab * eff * crit * rand * burn));
}

const CRIT_CHANCE = 1 / 16; // Gen 2-5 value
const STAB_MULT = 1.5;
const RANDOM_MIN = 0.85;
const RANDOM_MAX = 1.0;

// Stat stage ladder: stage in [-6, 6]; each stage x1.5 / ÷1.5.
function stageMultiplier(stage) {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

function statValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + 5;
}
function hpValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + level + 10;
}

// Catch: documented Gen 5 values (dossier §B1 + GD §3.3).
// a = ((3*HPmax - 2*HPcur) / (3*HPmax)) * catchRate * ballBonus * statusBonus
// statusBonus: 2.5 sleep/freeze, 1.5 para/poison/burn. a >= 255 => guaranteed.
const STATUS_CATCH_BONUS = {
  sleep: 2.5, freeze: 2.5, paralysis: 1.5, poison: 1.5, burn: 1.5, badlyPoisoned: 1.5,
};

function catchA(hpMax, hpCur, catchRate, ballBonus, status) {
  const sb = (status && STATUS_CATCH_BONUS[status]) || 1;
  return ((3 * hpMax - 2 * hpCur) / (3 * hpMax)) * catchRate * ballBonus * sb;
}

// Shake checks per documented Gen 4/5 shake probability.
// Returns the number of successful shakes (0-3). Caller provides rng().
function shakeChecks(a, rng) {
  if (a >= 255) return 3;
  let shakes = 0;
  for (let i = 0; i < 3; i++) {
    // Documented shake probability: b = 65536 / (255/a)^(1/4)... simplified to the
    // standard approximation used in reimplementations: p = a/255 scaled per shake.
    const p = Math.pow(a / 255, 0.75);
    if (rng() < p) shakes++;
    else break;
  }
  return shakes;
}

function isCriticalCapture(a) {
  // Gen 5 critical capture: rare instant-catch flourish on low-odds throws.
  // Eligibility scales inversely with `a`; kept as theater per GD §3.3.
  return a < 60;
}

// XP: documented growth curves reimplemented (GD §3.4).
function xpForLevel(curve, level) {
  const n = level;
  switch (curve) {
    case 'erratic':
      if (n <= 50) return Math.floor((n * n * n * (100 - n)) / 50);
      if (n <= 68) return Math.floor((n * n * n * (150 - n)) / 100);
      if (n <= 98) return Math.floor((n * n * n * ((1911 - 10 * n) / 3)) / 500);
      return Math.floor((n * n * n * (160 - n)) / 100);
    case 'fast': return Math.floor((4 * n * n * n) / 5);
    case 'mediumfast': return n * n * n;
    case 'mediumslow': return Math.floor((6 / 5) * n * n * n - 15 * n * n + 100 * n - 140);
    case 'slow': return Math.floor((5 * n * n * n) / 4);
    case 'fluctuating':
      if (n <= 15) return Math.floor((n * n * n * (((n + 1) / 3 + 24) / 50)));
      if (n <= 36) return Math.floor((n * n * n * ((n + 14) / 50)));
      return Math.floor((n * n * n * ((n / 2 + 32) / 50)));
    default: return n * n * n;
  }
}

// Simplified documented-style XP yield: base * level / 7, wild modifier 1x.
function xpYield(baseXp, level, isWild) {
  return Math.max(1, Math.floor((baseXp * level) / 7) * (isWild ? 1 : 1));
}

// Turn order: priority bracket -> Speed (paralysis quarters Speed, Gen 4-6) -> random.
function turnOrder(a, b, rng) {
  const pa = a.priority || 0, pb = b.priority || 0;
  if (pa !== pb) return pa > pb ? [a, b] : [b, a];
  const sa = a.status === 'paralysis' ? Math.floor(a.speed / 4) : a.speed;
  const sb = b.status === 'paralysis' ? Math.floor(b.speed / 4) : b.speed;
  if (sa !== sb) return sa > sb ? [a, b] : [b, a];
  return rng() < 0.5 ? [a, b] : [b, a];
}


// ---- src/engine/loop.mjs ----
// loop.mjs — fixed-timestep 30 Hz sim + interpolated rAF render (architecture §2.1).
// Sim tick 30 Hz. Render every rAF with accumulator alpha. Max 5 catch-up steps
// (spiral-of-death guard). Input sampled per rAF, applied at next tick.
// visibilitychange -> sim halts + autosave hook (dossier).

const SIM_HZ = 30;
const SIM_DT = 1 / SIM_HZ;
const MAX_CATCHUP = 5;

class Loop {
  constructor(game) {
    this.game = game;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.rafId = 0;
    this.frameTimes = []; // rolling frame-time histogram (perf HUD, QA)
    this.onAutosave = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = this._now();
    const raf = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(this._now()), 16);
    const step = (t) => {
      if (!this.running) return;
      this._tick(t);
      this.rafId = raf(step);
    };
    this.rafId = raf(step);
  }

  stop() {
    this.running = false;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.rafId);
  }

  // Headless / test driver: advance the sim by exactly n ticks.
  stepTicks(n) {
    for (let i = 0; i < n; i++) {
      this.game.update(SIM_DT);
    }
    this.game.render(1);
  }

  // Advance wall-clock ms (for headless time-based sequences like the 3s disclaimer).
  stepMs(ms) {
    let remaining = ms / 1000;
    while (remaining > 0) {
      const dt = Math.min(remaining, SIM_DT);
      this.game.update(dt);
      remaining -= dt;
    }
    this.game.render(1);
  }

  _now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  _tick(t) {
    let frameMs = t - this.last;
    this.last = t;
    if (frameMs > 250) frameMs = 250; // background-tab return: drop debt
    this.acc += frameMs / 1000;
    let steps = 0;
    while (this.acc >= SIM_DT && steps < MAX_CATCHUP) {
      this.game.input.sample();
      this.game.update(SIM_DT);
      this.acc -= SIM_DT;
      steps++;
    }
    if (steps === MAX_CATCHUP) this.acc = 0; // shed excess debt, never spiral
    const alpha = Math.min(1, this.acc / SIM_DT);
    const t0 = this._now();
    this.game.render(alpha);
    const cost = this._now() - t0;
    this.frameTimes.push(cost);
    if (this.frameTimes.length > 240) this.frameTimes.shift();
  }

  // Mean frame cost over the last window (ms) — QA perf overlay.
  meanFrameCost() {
    if (!this.frameTimes.length) return 0;
    let s = 0;
    for (let i = 0; i < this.frameTimes.length; i++) s += this.frameTimes[i];
    return s / this.frameTimes.length;
  }

  bindVisibility(pauseFn) {
    if (typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.onAutosave) this.onAutosave();
        if (pauseFn) pauseFn();
      }
    });
  }
}


// ---- src/engine/input.mjs ----
// input.mjs — keyboard + touch D-pad/A/B input with per-tick edge detection.
// DOM overlays are built by ui.mjs; this module owns state. Headless driver injects
// via `inject(code)` / `release(code)`. 4-way D-pad: last-pressed-wins diagonals.

const KEYMAP = {
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
const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select',
  'pageup', 'pagedown', 'slot1', 'slot2', 'slot3', 'slot4', 'fullscreen', 'mute', 'escape'];

class Input {
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


// ---- src/engine/audio.mjs ----
// audio.mjs — WebAudio chiptune engine (stub + note-table player).
// Contract: docs/contracts.md §2. Voice Designer fills the full score next wave.
// 4 channels (2 pulse, 1 triangle, 1 noise). Music unlocks on first user gesture.
// Safe no-op when AudioContext is unavailable (headless / SSR). Persisted mute.

const CHANNELS = ['pulse1', 'pulse2', 'triangle', 'noise'];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicVol = 0.8;
    this.sfxVol = 0.8;
    this._unlocked = false;
    this._musicTimer = null;
    this._noiseBuf = null;
  }

  // Call from the first user gesture (A press / tap).
  unlock() {
    if (this._unlocked) return;
    const AC = typeof AudioContext !== 'undefined' ? AudioContext
      : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);
    if (!AC) return; // headless: stay silent, never throw
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this._unlocked = true;
    } catch (e) { /* audio unavailable: silent mode */ }
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  _freq(pitch) {
    // Scientific pitch notation -> Hz. A4 = 440.
    const names = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const m = /^([A-G]#?)(\d)$/.exec(pitch);
    if (!m) return 440;
    const midi = ((parseInt(m[2], 10) + 1) * 12) + names[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // noteTable: { bpm, tracks: [{ wave:'pulse'|'triangle'|'noise', duty, vol, notes:[[beat,pitch,beats],...] }] }
  playMusic(table) {
    if (!this._unlocked || !table) return;
    this.stopMusic();
    const spb = 60 / (table.bpm || 120);
    const t0 = this.ctx.currentTime + 0.05;
    this._musicTimer = [];
    for (const tr of table.tracks || []) {
      for (const [beat, pitch, beats] of tr.notes) {
        const t = t0 + beat * spb;
        const dur = beats * spb;
        this._schedule(tr, pitch, t, dur, (tr.vol || 0.5) * this.musicVol);
      }
    }
  }

  stopMusic() {
    this._musicTimer = null; // one-shot scheduler; tables are short loops re-triggered by scenes
  }

  // sfx: { wave, vol, notes } — same shape, single track.
  playSfx(sfx) {
    if (!this._unlocked || !sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const tr = sfx.track || sfx;
    for (const [beat, pitch, beats] of (tr.notes || [])) {
      this._schedule(
        { wave: tr.wave || 'pulse', duty: tr.duty || 0.5 },
        pitch, t + beat * 0.06, beats * 0.06, (tr.vol || 0.5) * this.sfxVol,
      );
    }
  }

  _schedule(tr, pitch, t, dur, vol) {
    if (!this.ctx) return;
    try {
      if (tr.wave === 'noise') {
        const src = this.ctx.createBufferSource();
        src.buffer = this._noiseBuffer();
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 1000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t); src.stop(t + dur + 0.02);
      } else {
        const o = this.ctx.createOscillator();
        o.type = tr.wave === 'triangle' ? 'triangle' : 'square';
        if (pitch) o.frequency.value = this._freq(pitch);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + dur + 0.02);
      }
    } catch (e) { /* never let audio break the game */ }
  }

  _noiseBuffer() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  }
}

// Built-in SFX stubs (original blips) — Voice Designer replaces with the full set.
const SFX = {
  blip:   { wave: 'pulse', vol: 0.35, notes: [[0, 'E5', 1]] },
  tick:   { wave: 'pulse', vol: 0.25, notes: [[0, 'A5', 1]] },
  back:   { wave: 'pulse', vol: 0.35, notes: [[0, 'C5', 1]] },
  fanfare:{ wave: 'pulse', vol: 0.5,  notes: [[0, 'C5', 2], [2, 'E5', 2], [4, 'G5', 2], [6, 'C6', 4]] },
  heal:   { wave: 'triangle', vol: 0.5, notes: [[0, 'G4', 2], [2, 'C5', 2], [4, 'E5', 4]] },
  error:  { wave: 'pulse', vol: 0.35, notes: [[0, 'A3', 2], [2, 'G3', 3]] },
  throw_: { wave: 'noise', vol: 0.4, notes: [[0, null, 3]] },
  rattle: { wave: 'noise', vol: 0.45, notes: [[0, null, 2], [3, null, 2]] },
  click:  { wave: 'pulse', vol: 0.6, notes: [[0, 'C6', 1], [1, 'E6', 2]] },
  dex:    { wave: 'pulse', vol: 0.5, notes: [[0, 'E5', 2], [2, 'G5', 2], [4, 'B5', 2], [6, 'E6', 4]] },
  lowhp:  { wave: 'pulse', vol: 0.5, notes: [[0, 'A4', 2], [2, 'A4', 2], [4, 'A4', 2]] },
  encounter: { wave: 'pulse', vol: 0.5, notes: [[0, 'G4', 1], [1, 'A4', 1], [2, 'B4', 1], [3, 'C5', 3]] },
};


// ---- src/engine/render.mjs ----
// render.mjs — Canvas 2D renderer with the ADR-007 perf budgets.
// DPR auto-tier: cap 2; tier to 1 on <=2GB RAM or software rasterizer.
// Viewport culling: only tiles/entities intersecting the camera rect are drawn.
// Hot-path rules: no shadowBlur, no per-frame gradients, imageSmoothingEnabled=false.

const TILE = 16;

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.viewW = 0; this.viewH = 0;   // logical px
    this.camX = 0; this.camY = 0;     // camera top-left in world px
    this.shakeX = 0; this.shakeY = 0; // screen-shake offset (px, logical)
    this.flashA = 0;                  // white flash overlay alpha
    this.fadeA = 0; this.fadeColor = '#000';
    this.autoTier();
  }

  autoTier() {
    let dpr = 1;
    try {
      const w = typeof window !== 'undefined' ? window : {};
      dpr = Math.min(2, w.devicePixelRatio || 1);
      const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
      if (mem <= 2) dpr = 1; // ADR-007: auto-tier to 1 on <=2GB RAM
    } catch (e) { dpr = 1; }
    this.dpr = dpr;
  }

  // Logical viewport (game px). Internal res capped by design (gameux §2).
  resize(logicalW, logicalH, cssW, cssH) {
    this.viewW = logicalW; this.viewH = logicalH;
    this.canvas.width = Math.round(logicalW * this.dpr);
    this.canvas.height = Math.round(logicalH * this.dpr);
    if (this.canvas.style) {
      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
    }
  }

  begin() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, this.viewW, this.viewH);
    c.save();
    c.translate(-Math.round(this.camX) + this.shakeX, -Math.round(this.camY) + this.shakeY);
  }

  end() {
    const c = this.ctx;
    c.restore();
    if (this.flashA > 0) {
      c.fillStyle = 'rgba(255,255,255,' + this.flashA.toFixed(3) + ')';
      c.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.fadeA > 0) {
      c.globalAlpha = Math.min(1, this.fadeA);
      c.fillStyle = this.fadeColor;
      c.fillRect(0, 0, this.viewW, this.viewH);
      c.globalAlpha = 1;
    }
  }

  // Camera centers on a world point, clamped to map bounds.
  centerOn(wx, wy, mapWpx, mapHpx) {
    this.camX = Math.max(0, Math.min(mapWpx - this.viewW, wx - this.viewW / 2));
    this.camY = Math.max(0, Math.min(mapHpx - this.viewH, wy - this.viewH / 2));
    if (mapWpx <= this.viewW) this.camX = (mapWpx - this.viewW) / 2;
    if (mapHpx <= this.viewH) this.camY = (mapHpx - this.viewH) / 2;
  }

  // Viewport rect in world px — for culling.
  viewRect() {
    return {
      x0: this.camX - TILE, y0: this.camY - TILE,
      x1: this.camX + this.viewW + TILE, y1: this.camY + this.viewH + TILE,
    };
  }

  // Blit a pre-rendered offscreen sprite (zero per-frame allocation).
  blit(sprite, dx, dy) {
    const c = this.ctx;
    const w = sprite.width, h = sprite.height;
    // Cull against viewport
    if (dx + w < this.camX - TILE || dy + h < this.camY - TILE ||
        dx > this.camX + this.viewW + TILE || dy > this.camY + this.viewH + TILE) return;
    c.drawImage(sprite, Math.round(dx), Math.round(dy));
  }

  text(str, x, y, opts) {
    const o = opts || {};
    const c = this.ctx;
    c.font = (o.bold ? 'bold ' : '') + (o.size || 8) + 'px monospace';
    c.textBaseline = 'top';
    if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.55)';
      c.fillText(str, x + 1, y + 1);
    }
    c.fillStyle = o.color || '#fff';
    c.fillText(str, x, y);
  }

  panel(x, y, w, h, fill, border) {
    const c = this.ctx;
    c.fillStyle = fill || '#f8f8f0';
    c.fillRect(x, y, w, h);
    c.strokeStyle = border || '#202028';
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // HP bar with colorblind-safe stripe overlay under 25% (gameux §7).
  hpBar(x, y, w, h, frac, reducedMotion) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#28182c';
    c.fillRect(x, y, w, h);
    const col = f > 0.5 ? '#58c94f' : (f > 0.25 ? '#e8c832' : '#e84040');
    c.fillStyle = col;
    c.fillRect(x + 1, y + 1, Math.floor((w - 2) * f), h - 2);
    if (f <= 0.25 && f > 0 && !reducedMotion) {
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let sx = x + 2; sx < x + w - 2; sx += 4) {
        c.fillRect(sx, y + 1, 1, h - 2);
      }
    }
  }
}


// ---- src/engine/tiles.mjs ----
// tiles.mjs — procedural 16x16 tile painter (PLACEHOLDER per assets/manifest.yaml).
// Palette-authored per tileset, no multiply overlays (gameux §6).
// Art Director replaces with hand-authored tileset per docs/contracts.md §1.

const TILE_CHARS = {
  '#': 'tree', '.': 'path', ',': 'grass', '~': 'water',
  'H': 'house', 'D': 'door', 'S': 'sign', 'G': 'gymwall',
  'E': 'gymdoor', 'C': 'centerdoor', 'F': 'flower', 'R': 'rock',
  ' ': 'void',
};

const PAL = {
  grassBase: '#5da24a', grassDark: '#4c8a3e', grassLight: '#6fb45c',
  pathBase: '#d8c08a', pathDark: '#c2a878',
  treeBase: '#3e7a34', treeDark: '#2e5e28', treeLight: '#54a048',
  waterBase: '#3a7bd5', waterDark: '#2e63b0', waterLight: '#5a9ae8',
  houseBase: '#c9a06a', houseDark: '#a8825a', roofBase: '#b0503c', roofDark: '#8e3e2e',
  doorBase: '#6a4a2e', signBase: '#8a6a42', gymBase: '#8a8aa0', gymDark: '#6a6a80',
  flowerA: '#e86a8a', flowerB: '#f0e060', rockBase: '#9a9aa5', rockDark: '#7a7a85',
};

// Deterministic 2D hash for painter dithering (no RNG needed).
function h2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function paintTile(ctx, kind, px, py) {
  const T = 16;
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
  switch (kind) {
    case 'grass':
      r(0, 0, T, T, PAL.grassBase);
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(h2(px + i * 3, py) * 14), y = Math.floor(h2(px, py + i * 5) * 12);
        r(x, y, 2, 3, h2(x, y) > 0.5 ? PAL.grassDark : PAL.grassLight);
      }
      break;
    case 'path':
      r(0, 0, T, T, PAL.pathBase);
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(h2(px + i, py + 9) * 14), y = Math.floor(h2(px + 3, py + i) * 14);
        r(x, y, 3, 2, PAL.pathDark);
      }
      break;
    case 'flower':
      r(0, 0, T, T, PAL.grassBase);
      r(6, 6, 4, 4, PAL.flowerA); r(7, 3, 2, 2, PAL.flowerB); r(7, 11, 2, 2, PAL.flowerB);
      break;
    case 'tree':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 10, 2, 6, '#5a3a24');
      r(2, 2, 12, 9, PAL.treeBase);
      r(3, 3, 5, 3, PAL.treeLight); r(8, 7, 5, 3, PAL.treeDark);
      break;
    case 'water':
      r(0, 0, T, T, PAL.waterBase);
      for (let i = 0; i < 4; i++) {
        const y = Math.floor(h2(px + i * 7, py) * 14);
        r(1, y, 6, 1, PAL.waterLight); r(9, (y + 7) % 15, 6, 1, PAL.waterDark);
      }
      break;
    case 'house':
      r(0, 0, T, T, PAL.houseBase);
      r(0, 0, T, 5, PAL.roofBase); r(0, 4, T, 1, PAL.roofDark);
      r(3, 8, 4, 5, PAL.doorBase); r(10, 8, 3, 3, '#3a5a7a');
      break;
    case 'gymwall':
      r(0, 0, T, T, PAL.gymBase);
      r(0, 0, T, 2, PAL.gymDark); r(0, 14, T, 2, PAL.gymDark);
      r(7, 4, 2, 8, PAL.gymDark);
      break;
    case 'door': case 'gymdoor': case 'centerdoor':
      r(0, 0, T, T, kind === 'gymwall' ? PAL.gymBase : PAL.houseBase);
      r(4, 2, 8, 14, PAL.doorBase); r(5, 3, 6, 12, '#3e2c1c');
      break;
    case 'sign':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 8, 2, 8, '#5a3a24'); r(3, 2, 10, 7, PAL.signBase);
      r(4, 3, 8, 1, '#6e5233');
      break;
    case 'rock':
      r(0, 0, T, T, PAL.grassBase);
      r(3, 5, 10, 8, PAL.rockBase); r(4, 6, 4, 3, '#b5b5c0'); r(8, 9, 4, 3, PAL.rockDark);
      break;
    default:
      r(0, 0, T, T, '#101018');
  }
}

// Pre-render one offscreen canvas per tile kind (blitted in hot path).
function buildTileCache(doc) {
  const cache = {};
  for (const key of Object.keys(TILE_CHARS)) {
    const kind = TILE_CHARS[key];
    if (cache[kind]) continue;
    const cv = doc.createElement('canvas');
    cv.width = 16; cv.height = 16;
    paintTile(cv.getContext('2d'), kind, 0, 0);
    cache[kind] = cv;
  }
  return cache;
}


// ---- src/engine/sprites.mjs ----
// sprites.mjs — SpriteForge v1 (PLACEHOLDER per assets/manifest.yaml).
// Seeded symmetric pixel creatures with body-type silhouettes. Stand-ins only —
// Art Director replaces with original pixel art per docs/contracts.md §1.
// Palette rules honored: <=12 colors + alpha, 1px dark outline, no gradients,
// no anti-aliasing.


const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#ee99ac',
};

// Body-type silhouette templates: list of [x0,y0,x1,y1] rects on a 16x16 grid.
// Silhouettes are drawn symmetric about the vertical center axis.
const BODIES = {
  bird:   [[6, 4, 10, 12], [4, 6, 6, 10], [10, 6, 12, 10], [6, 2, 10, 5]],
  quad:   [[4, 7, 12, 13], [3, 4, 7, 8], [9, 4, 13, 8], [4, 13, 6, 15], [10, 13, 12, 15]],
  biped:  [[6, 6, 10, 13], [5, 3, 11, 7], [6, 13, 7, 15], [9, 13, 10, 15], [4, 7, 6, 10], [10, 7, 12, 10]],
  serpent:[[5, 3, 11, 7], [6, 7, 10, 11], [7, 11, 9, 14], [11, 4, 13, 6]],
  blob:   [[5, 5, 11, 12], [6, 3, 10, 6], [4, 8, 6, 11], [10, 8, 12, 11]],
  fish:   [[5, 6, 11, 11], [3, 4, 5, 8], [11, 7, 13, 10], [6, 4, 10, 6]],
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Forge a species sprite: doc = document-like, species = {spriteSeed, body, types}, size = px.
function forgeSprite(doc, species, size) {
  const grid = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const cell = size / grid;
  const rng = mulberry32(species.spriteSeed || 1);
  const main = TYPE_COLORS[species.types[0]] || '#a8a878';
  const dark = shade(main, -70);
  const light = shade(main, 45);
  const accent = species.types[1] ? TYPE_COLORS[species.types[1]] : light;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * cell, y * cell, w * cell, h * cell); };

  const rects = BODIES[species.body] || BODIES.blob;
  // 1) dark outline pass: draw each rect expanded by 1 grid cell
  for (const [x0, y0, x1, y1] of rects) px(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, dark);
  // 2) fill pass with flat tones + deterministic dither
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const v = rng();
        px(x, y, 1, 1, v < 0.12 ? light : (v < 0.24 ? accent : main));
      }
    }
  }
  // 3) eyes (front-facing, white + dark pupil)
  const ey = 5, exl = 6, exr = 9;
  px(exl, ey, 1, 1, '#ffffff'); px(exr, ey, 1, 1, '#ffffff');
  px(exl, ey, 1, 1, '#1a1a22'); px(exr, ey, 1, 1, '#1a1a22');
  // 4) species-specific flourish by id hash (ears / tail / crest)
  const f = species.spriteSeed % 4;
  if (f === 0) { px(4, 1, 2, 3, dark); px(10, 1, 2, 3, dark); px(4, 2, 2, 1, accent); px(10, 2, 2, 1, accent); }
  else if (f === 1) { px(12, 9, 3, 2, dark); px(13, 10, 2, 2, accent); }
  else if (f === 2) { px(6, 0, 4, 2, accent); }
  return cv;
}

// Player / NPC overworld sprite: simple 16x16 humanoid in palette colors.
function forgeHumanoid(doc, opts) {
  const o = opts || {};
  const size = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const skin = o.skin || '#f0c8a0', shirt = o.shirt || '#d84a3a',
        pants = o.pants || '#3a5a9a', hair = o.hair || '#2a2018';
  // outline
  px(5, 1, 6, 14, '#1a1a22');
  // head + hair
  px(6, 2, 4, 4, skin); px(6, 2, 4, 2, hair); px(5, 3, 1, 2, hair); px(10, 3, 1, 2, hair);
  // body
  px(6, 6, 4, 5, shirt);
  // legs
  px(6, 11, 2, 3, pants); px(8, 11, 2, 3, pants);
  // eyes
  px(7, 4, 1, 1, '#1a1a22'); px(9, 4, 1, 1, '#1a1a22');
  return cv;
}


// ---- src/data/species.mjs ----
// species.mjs — slice roster data (Kanto opening: Pallet -> Pewter).
// Original data tables for this fan project. spriteSeed feeds SpriteForge v1;
// Art Director replaces sprites per docs/contracts.md §1.

const SPECIES = {
  partner: {
    id: 'partner', name: 'Pikachu', dexNo: 25, types: ['electric'],
    base: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
    catchRate: 190, growth: 'mediumfast', baseXp: 82, body: 'quad', spriteSeed: 2501,
    learnset: { 1: ['thundershock', 'growl'], 5: ['quickattack'] },
    flavor: 'A spirited partner who refused the easy path. Never leaves your side.',
  },
  pidgey: {
    id: 'pidgey', name: 'Pidgey', dexNo: 16, types: ['normal', 'flying'],
    base: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 },
    catchRate: 255, growth: 'mediumslow', baseXp: 50, body: 'bird', spriteSeed: 1601,
    learnset: { 1: ['tackle'], 3: ['gust'], 5: ['quickattack'] },
    flavor: 'Common on quiet routes. Gusts up dust when it takes off.',
  },
  rattata: {
    id: 'rattata', name: 'Rattata', dexNo: 19, types: ['normal'],
    base: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 },
    catchRate: 255, growth: 'mediumfast', baseXp: 51, body: 'quad', spriteSeed: 1901,
    learnset: { 1: ['tackle', 'tailwhip'], 4: ['quickattack'] },
    flavor: 'Quick teeth, quicker feet. Nibbles anything left unattended.',
  },
  caterpie: {
    id: 'caterpie', name: 'Caterpie', dexNo: 10, types: ['bug'],
    base: { hp: 45, atk: 30, def: 35, spa: 20, spd: 20, spe: 45 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1001,
    learnset: { 1: ['tackle', 'stringshot'] },
    flavor: 'Gentle and green. Its antennae taste the air for friends.',
  },
  weedle: {
    id: 'weedle', name: 'Weedle', dexNo: 13, types: ['bug', 'poison'],
    base: { hp: 40, atk: 35, def: 30, spa: 20, spd: 20, spe: 50 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1301,
    learnset: { 1: ['poisonsting', 'stringshot'] },
    flavor: 'Mind the stinger. It only uses it when startled.',
  },
  spearow: {
    id: 'spearow', name: 'Spearow', dexNo: 21, types: ['normal', 'flying'],
    base: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 },
    catchRate: 255, growth: 'mediumfast', baseXp: 52, body: 'bird', spriteSeed: 2101,
    learnset: { 1: ['peck', 'growl'] },
    flavor: 'Territorial and loud. Best admired from a respectful distance.',
  },
  zubat: {
    id: 'zubat', name: 'Zubat', dexNo: 41, types: ['poison', 'flying'],
    base: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 },
    catchRate: 255, growth: 'mediumfast', baseXp: 49, body: 'bird', spriteSeed: 4101,
    learnset: { 1: ['leechlife', 'supersonic'] },
    flavor: 'Navigates by sound. Startles easily in dark tunnels.',
  },
  geodude: {
    id: 'geodude', name: 'Geodude', dexNo: 74, types: ['rock', 'ground'],
    base: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 },
    catchRate: 255, growth: 'mediumslow', baseXp: 60, body: 'blob', spriteSeed: 7401,
    learnset: { 1: ['tackle', 'defensecurl'], 6: ['rockthrow'] },
    flavor: 'Arms of living stone. Often mistaken for an ordinary boulder.',
  },
  onix: {
    id: 'onix', name: 'Onix', dexNo: 95, types: ['rock', 'ground'],
    base: { hp: 35, atk: 45, def: 160, spa: 30, spd: 45, spe: 70 },
    catchRate: 45, growth: 'mediumfast', baseXp: 77, body: 'serpent', spriteSeed: 9501,
    learnset: { 1: ['tackle', 'harden'], 8: ['rockthrow'] },
    flavor: 'A chain of boulders given will. The gym leader\u2019s ace.',
  },
  bulbasaur: {
    id: 'bulbasaur', name: 'Bulbasaur', dexNo: 1, types: ['grass', 'poison'],
    base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
    catchRate: 45, growth: 'mediumslow', baseXp: 64, body: 'quad', spriteSeed: 101,
    learnset: { 1: ['tackle', 'growl'], 5: ['vinewhip'] },
    flavor: 'A seed on its back drinks the morning sun.',
  },
  charmander: {
    id: 'charmander', name: 'Charmander', dexNo: 4, types: ['fire'],
    base: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    catchRate: 45, growth: 'mediumslow', baseXp: 62, body: 'biped', spriteSeed: 401,
    learnset: { 1: ['scratch', 'growl'], 5: ['ember'] },
    flavor: 'Its tail flame mirrors its spirit — bright and stubborn.',
  },
  squirtle: {
    id: 'squirtle', name: 'Squirtle', dexNo: 7, types: ['water'],
    base: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
    catchRate: 45, growth: 'mediumslow', baseXp: 63, body: 'biped', spriteSeed: 701,
    learnset: { 1: ['tackle', 'tailwhip'], 5: ['watergun'] },
    flavor: 'Withdraws into its shell, then answers with a jet of water.',
  },
  nidoranm: {
    id: 'nidoranm', name: 'Nidoran\u2642', dexNo: 32, types: ['poison'],
    base: { hp: 46, atk: 57, def: 40, spa: 40, spd: 40, spe: 50 },
    catchRate: 235, growth: 'mediumslow', baseXp: 55, body: 'quad', spriteSeed: 3201,
    learnset: { 1: ['scratch', 'growl'] },
    flavor: 'Ears always up. Hears a trainer\u2019s step long before seeing one.',
  },
  mankey: {
    id: 'mankey', name: 'Mankey', dexNo: 56, types: ['fighting'],
    base: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 },
    catchRate: 190, growth: 'mediumfast', baseXp: 61, body: 'biped', spriteSeed: 5601,
    learnset: { 1: ['scratch', 'leer'] },
    flavor: 'Angers fast, forgives faster — usually after a good battle.',
  },
};

const SPECIES_LIST = Object.keys(SPECIES);

// Dex tracking: 1025 species tracked honestly; playable = slice roster.
// Undiscovered species render as "???" (gameux OQ recommendation).
const DEX_TOTAL = 1025;


// ---- src/data/moves.mjs ----
// moves.mjs — slice move data. Original implementations of documented systems.
// cat: 'physical' | 'special' | 'status'. Effects are simple, named, and reviewable.

const MOVES = {
  tackle:      { id: 'tackle', name: 'Tackle', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  scratch:     { id: 'scratch', name: 'Scratch', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  quickattack: { id: 'quickattack', name: 'Quick Attack', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 30, priority: 1 },
  pound:       { id: 'pound', name: 'Pound', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  growl:       { id: 'growl', name: 'Growl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'foe', atk: -1 } },
  tailwhip:    { id: 'tailwhip', name: 'Tail Whip', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  leer:        { id: 'leer', name: 'Leer', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  supersonic:  { id: 'supersonic', name: 'Supersonic', type: 'normal', cat: 'status', power: 0, acc: 55, pp: 20, priority: 0, effect: { target: 'foe', status: 'confusion' } },
  thundershock:{ id: 'thundershock', name: 'Thunder Shock', type: 'electric', cat: 'special', power: 40, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', status: 'paralysis', chance: 10 } },
  ember:       { id: 'ember', name: 'Ember', type: 'fire', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0, effect: { target: 'foe', status: 'burn', chance: 10 } },
  watergun:    { id: 'watergun', name: 'Water Gun', type: 'water', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0 },
  vinewhip:    { id: 'vinewhip', name: 'Vine Whip', type: 'grass', cat: 'physical', power: 45, acc: 100, pp: 25, priority: 0 },
  gust:        { id: 'gust', name: 'Gust', type: 'flying', cat: 'special', power: 40, acc: 100, pp: 35, priority: 0 },
  peck:        { id: 'peck', name: 'Peck', type: 'flying', cat: 'physical', power: 35, acc: 100, pp: 35, priority: 0 },
  poisonsting: { id: 'poisonsting', name: 'Poison Sting', type: 'poison', cat: 'physical', power: 15, acc: 100, pp: 35, priority: 0, effect: { target: 'foe', status: 'poison', chance: 30 } },
  stringshot:  { id: 'stringshot', name: 'String Shot', type: 'bug', cat: 'status', power: 0, acc: 95, pp: 40, priority: 0, effect: { target: 'foe', spe: -2 } },
  leechlife:   { id: 'leechlife', name: 'Leech Life', type: 'bug', cat: 'physical', power: 20, acc: 100, pp: 15, priority: 0, effect: { target: 'foe', drain: 0.5 } },
  rockthrow:   { id: 'rockthrow', name: 'Rock Throw', type: 'rock', cat: 'physical', power: 50, acc: 90, pp: 15, priority: 0 },
  defensecurl: { id: 'defensecurl', name: 'Defense Curl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'self', def: 1 } },
  harden:      { id: 'harden', name: 'Harden', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'self', def: 1 } },
};

// effect: { target:'foe'|'self', atk/def/spa/spd/spe stages [-6,6], status, chance (0-100), drain }


// ---- src/data/items.mjs ----
// items.mjs — slice item data. Curated ball roster per GD §3.3 (phone-UI-sized).

const BALLS = {
  pokeball:  { id: 'pokeball', name: 'Poke Ball', bonus: 1, desc: 'The baseline. Reliable.' },
  greatball: { id: 'greatball', name: 'Great Ball', bonus: 1.5, desc: '1.5x catch rate.' },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', bonus: 2, desc: '2x catch rate.' },
};

const ITEMS = {
  potion: { id: 'potion', name: 'Potion', pocket: 'medicine', heal: 20, desc: 'Restores 20 HP.' },
  pokeball:  { id: 'pokeball', name: 'Poke Ball', pocket: 'balls', desc: BALLS.pokeball.desc },
  greatball: { id: 'greatball', name: 'Great Ball', pocket: 'balls', desc: BALLS.greatball.desc },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', pocket: 'balls', desc: BALLS.ultraball.desc },
  boulderbadge: { id: 'boulderbadge', name: 'Boulder Badge', pocket: 'key', desc: 'Won from Brock of Pewter Gym. Raises party obedience and Attack.' },
};

const POCKETS = ['balls', 'medicine', 'key'];


// ---- src/data/maps.mjs ----
// maps.mjs — Kanto opening slice: Pallet -> Route 1 -> Viridian -> Route 2 -> Pewter (+ interiors).
// Tile legend: # tree | . path | , grass | ~ water | H house | D door | S sign |
//              G gymwall | E gymdoor | C centerdoor | F flower | R rock | ' ' void
// Warps fire on step. Doors are step-warps; edge exits are listed per tile.

function rows(list) { return list; }

const MAPS = {
  pallet: {
    id: 'pallet', name: 'Pallet Town', music: 'pallet-theme',
    rows: rows([
      '################',
      '#..............#',
      '#..HH......HH..#',
      '#..HH..SS..HH..#',
      '#..............#',
      '#......##......#',
      '#......##......#',
      '#..FF......FF..#',
      '#..............#',
      '#......,,......#',
      '######....######',
    ]),
    warps: [
      { x: 6, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 7, y: 10, to: { map: 'route1', x: 7, y: 14 } },
      { x: 8, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 9, y: 10, to: { map: 'route1', x: 7, y: 14 } },
    ],
    signs: [
      { x: 6, y: 3, text: "PROF. HAWTHORN'S LAB — Pokemon research. The professor is out on Route 1 today." },
      { x: 7, y: 3, text: "PROF. HAWTHORN'S LAB — Pokemon research. The professor is out on Route 1 today." },
    ],
    npcs: [
      { x: 10, y: 4, name: 'GARY', skin: '#f0c8a0', shirt: '#3a5a9a', pants: '#2a2a3a', hair: '#6a4a2a',
        dialogue: ["Yo! Smell ya later, {player}! I'm off to grab my first partner!", "My grandpa's the professor, so I get the good stuff. Try to keep up!"] },
    ],
    encounters: null,
    start: { x: 7, y: 7, dir: 'down' },
  },

  route1: {
    id: 'route1', name: 'Route 1', music: 'route1-theme',
    rows: rows([
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,......,,..#',
      '#,,..SS..,,..#',
      '#,,......,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,..FF..,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#####....#####',
    ]),
    warps: [
      { x: 5, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 6, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 7, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 8, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 5, y: 15, to: { map: 'pallet', x: 7, y: 9 } },
      { x: 6, y: 15, to: { map: 'pallet', x: 7, y: 9 } },
      { x: 7, y: 15, to: { map: 'pallet', x: 8, y: 9 } },
      { x: 8, y: 15, to: { map: 'pallet', x: 8, y: 9 } },
    ],
    signs: [
      { x: 5, y: 6, text: 'ROUTE 1 — Pallet Town to Viridian City. Tall grass rustles with wild Pokemon.' },
    ],
    npcs: [
      { x: 9, y: 5, name: 'AIDE', skin: '#f0c8a0', shirt: '#4a9a4a', pants: '#3a3a4a', hair: '#1a1a1a',
        dialogue: ["Wild Pokemon live in the tall grass! Walk through it and keep your eyes open.", "Weaken them first, then throw a Poke Ball. The professor gave you five to start."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'pidgey', min: 2, max: 4, weight: 45 },
        { species: 'rattata', min: 2, max: 4, weight: 45 },
        { species: 'spearow', min: 3, max: 5, weight: 10 },
      ],
    },
    start: null,
  },

  viridian: {
    id: 'viridian', name: 'Viridian City', music: 'viridian-theme',
    rows: rows([
      '######....######',
      '#......##......#',
      '#..HH..##..HH..#',
      '#..HH......HH..#',
      '#......CC......#',
      '#......CC......#',
      '#..SS......SS..#',
      '#..............#',
      '#..FF......FF..#',
      '#......,,......#',
      '######....######',
    ]),
    warps: [
      { x: 7, y: 4, to: { map: 'center', x: 4, y: 4 } },
      { x: 8, y: 4, to: { map: 'center', x: 5, y: 4 } },
      { x: 6, y: 0, to: { map: 'route2', x: 6, y: 12 } },
      { x: 7, y: 0, to: { map: 'route2', x: 7, y: 12 } },
      { x: 8, y: 0, to: { map: 'route2', x: 6, y: 12 } },
      { x: 9, y: 0, to: { map: 'route2', x: 7, y: 12 } },
      { x: 6, y: 10, to: { map: 'route1', x: 6, y: 1 } },
      { x: 7, y: 10, to: { map: 'route1', x: 7, y: 1 } },
      { x: 8, y: 10, to: { map: 'route1', x: 6, y: 1 } },
      { x: 9, y: 10, to: { map: 'route1', x: 7, y: 1 } },
    ],
    signs: [
      { x: 3, y: 6, text: 'VIRIDIAN CITY — The city of evergreen. The Pokemon Center heals your team for free.' },
    ],
    npcs: [
      { x: 11, y: 7, name: 'HIKER', skin: '#d8a878', shirt: '#8a6a3a', pants: '#4a4a5a', hair: '#3a2a1a',
        dialogue: ["Heading north? Route 2's grass is thicker — I saw a Mankey up there yesterday.", "The Pewter Gym is past it. Rock-types! Bring water or grass if you can."] },
    ],
    encounters: null,
    start: null,
  },

  center: {
    id: 'center', name: 'Pokemon Center', music: 'center-theme', indoor: true,
    rows: rows([
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#...DD...#',
      '##########',
    ]),
    warps: [
      { x: 4, y: 5, to: { map: 'viridian', x: 7, y: 6 } },
      { x: 5, y: 5, to: { map: 'viridian', x: 8, y: 6 } },
    ],
    signs: [],
    npcs: [
      { x: 4, y: 2, name: 'NURSE', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#f0a0b0', hair: '#e86a5a',
        dialogue: ["Welcome to the Pokemon Center! Let me heal your team..."], heal: true,
        afterHeal: ["All better! Your Pokemon are fighting fit. Come back any time."] },
    ],
    encounters: null,
    start: null,
  },

  route2: {
    id: 'route2', name: 'Route 2', music: 'route1-theme',
    rows: rows([
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,..RR..,,..#',
      '#,,......,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#####....#####',
    ]),
    warps: [
      { x: 5, y: 0, to: { map: 'pewter', x: 7, y: 9 } },
      { x: 6, y: 0, to: { map: 'pewter', x: 7, y: 9 } },
      { x: 7, y: 0, to: { map: 'pewter', x: 8, y: 9 } },
      { x: 8, y: 0, to: { map: 'pewter', x: 8, y: 9 } },
      { x: 5, y: 13, to: { map: 'viridian', x: 5, y: 1 } },
      { x: 6, y: 13, to: { map: 'viridian', x: 6, y: 1 } },
      { x: 7, y: 13, to: { map: 'viridian', x: 9, y: 1 } },
      { x: 8, y: 13, to: { map: 'viridian', x: 10, y: 1 } },
    ],
    signs: [],
    npcs: [],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'caterpie', min: 3, max: 5, weight: 30 },
        { species: 'weedle', min: 3, max: 5, weight: 30 },
        { species: 'pidgey', min: 3, max: 5, weight: 25 },
        { species: 'nidoranm', min: 4, max: 6, weight: 10 },
        { species: 'mankey', min: 4, max: 6, weight: 5 },
      ],
    },
    start: null,
  },

  pewter: {
    id: 'pewter', name: 'Pewter City', music: 'pewter-theme',
    rows: rows([
      '################',
      '#......GG......#',
      '#..HH..GG..HH..#',
      '#..HH..EE..HH..#',
      '#......GG......#',
      '#......##......#',
      '#..SS......SS..#',
      '#..............#',
      '#..FF......FF..#',
      '#......,,......#',
      '######....######',
    ]),
    warps: [
      { x: 7, y: 3, to: { map: 'gym', x: 5, y: 7 } },
      { x: 8, y: 3, to: { map: 'gym', x: 6, y: 7 } },
      { x: 6, y: 10, to: { map: 'route2', x: 6, y: 1 } },
      { x: 7, y: 10, to: { map: 'route2', x: 7, y: 1 } },
      { x: 8, y: 10, to: { map: 'route2', x: 6, y: 1 } },
      { x: 9, y: 10, to: { map: 'route2', x: 7, y: 1 } },
    ],
    signs: [
      { x: 3, y: 6, text: 'PEWTER CITY — A stone-gray city nestled between mountains.' },
      { x: 11, y: 6, text: 'PEWTER GYM — Leader: Brock. The rock-solid Pokemon trainer!' },
    ],
    npcs: [
      { x: 10, y: 4, name: 'COACH', skin: '#d8a878', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        dialogue: ["Brock's rock-types shrug off electric attacks — your partner's sparks won't cut it.", "Catch something with water or grass on Route 2. Or just outlast him. You've got heart."] },
    ],
    encounters: null,
    start: null,
  },

  gym: {
    id: 'gym', name: 'Pewter Gym', music: 'gym-theme', indoor: true,
    rows: rows([
      '############',
      '#..........#',
      '#.R......R.#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#####..#####',
    ]),
    warps: [
      { x: 5, y: 8, to: { map: 'pewter', x: 6, y: 4 } },
      { x: 6, y: 8, to: { map: 'pewter', x: 9, y: 4 } },
    ],
    signs: [],
    npcs: [
      { x: 5, y: 2, name: 'BROCK', skin: '#c89878', shirt: '#c8782a', pants: '#4a5a3a', hair: '#1a1a1a',
        trainer: 'brock',
        dialogue: ["I'm Brock! I'm Pewter's Gym Leader! My rock-hard willpower is evident even in my Pokemon!", "My Pokemon are all rock hard, and have true-grit determination!"] },
    ],
    encounters: null,
    start: null,
  },
};

const MAP_LIST = Object.keys(MAPS);

// Tile passability: walkable kinds.
const WALKABLE = new Set(['.', ',', 'D', 'E', 'C', 'F']);

// Trainer definitions for the slice.
const TRAINERS = {
  brock: {
    id: 'brock', name: 'Brock', title: 'Pewter Gym Leader',
    intro: ["My rock-type Pokemon will crush you! Show me what you've got!"],
    lose: ["I took you for granted... You're stronger than I thought.", "Take the Boulder Badge — you earned it."],
    team: [
      { species: 'geodude', level: 12 },
      { species: 'onix', level: 14 },
    ],
    reward: 900,
    badge: 'boulderbadge',
  },
};


// ---- src/data/dialogue.mjs ----
// dialogue.mjs — original writing only. Anime story beats are plot facts, not scripts.
// No quoted or closely-paraphrased anime lines (GC §3.3).

const INTRO_SCRIPT = {
  professor: 'PROF. HAWTHORN',
  lines: [
    'Ah — you made it. I was starting to worry the alarm won again.',
    'Welcome to the world of Pokemon! My name is Hawthorn. I study how Pokemon and people grow together.',
    'You must be {player}. That spark in your eyes — you are ready for the road.',
    'Now then... every trainer begins with a partner. But I have a confession.',
    'The three young Pokemon I set aside for new trainers... they have already found homes this morning.',
    'There is one left. A difficult one. It has opinions, and it has already shocked two of my aides today.',
  ],
  starterMoment: [
    'Go on — say hello. Careful now...',
    '...It shocked you too! Ha! That means it likes you. Mostly.',
    'Listen well: this one will never stay inside a Poke Ball. It walks beside you, or not at all.',
    'A bond like that is rarer than any badge. Treat it well, {player}.',
    'Your journey starts on Route 1, north of Pallet Town. Catch Pokemon, grow strong — and when you are ready, Pewter Gym awaits.',
  ],
};

const TUTORIAL_AIDE_EXTRA = [
  'One more thing — press START anytime to open the menu. Bag, party, dex, save... it is all there.',
];

const GYM_WIN_TEXT = [
  'You defeated Gym Leader Brock!',
];

const SLICE_CAPSTONE = [
  '{player} received the Boulder Badge!',
  'With the Boulder Badge, your Pokemon will obey you, and your team hits a little harder.',
  '...To be continued. The road to Cerulean City lies ahead — in the next chapter.',
];


// ---- src/game/state.mjs ----
// state.mjs — GameState: the runtime state IS the save shape (architecture §2.3).
// schemaVersion 1. Frontier-ready hooks from day one: badges.symbols (7 locked),
// dex.befriended (third dex state), facilities registry, story.flags open map.


const SCHEMA_VERSION = 1;

function defaultState() {
  return {
    v: SCHEMA_VERSION,
    player: { name: 'ASH', rivalName: 'GARY', trainerId: 0, playtimeSec: 0, money: 300 },
    party: [],
    boxes: {},
    dex: { caught: {}, seen: {}, befriended: {} }, // dexNo -> true
    badges: { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] },
    story: {
      chapter: 0, beat: 0, flags: {},
      position: { map: 'pallet', x: 7, y: 7, dir: 'down' },
      difficulty: 'normal',
    },
    pikachu: { mood: 'happy', foundItemCooldown: 0 },
    settings: {
      textSpeed: 'normal', battleAnims: true, shake: true, reducedMotion: false,
      mute: false, musicVol: 0.8, sfxVol: 0.8, controlsFlip: false, keymap: null, hudScale: 1,
    },
    facilities: { registry: [], unlocked: [] },
    bag: { pokeball: 5, potion: 2 },
    meta: { createdAt: 0, updatedAt: 0, playtimeSec: 0, location: 'Pallet Town' },
  };
}

// Battle-mon factory: {speciesId, nickname, level, xp, moves[{id,pp}], ivs, hp...}
function makeMon(speciesId, level, speciesTable, movesTable) {
  const sp = speciesTable[speciesId];
  const mon = {
    speciesId,
    nickname: null,
    level,
    xp: xpForLevel(sp.growth, level),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    status: null,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ot: 'ASH',
    friendship: 70,
  };
  const learned = [];
  for (const lv of Object.keys(sp.learnset).map(Number).sort((a, b) => a - b)) {
    if (lv <= level) learned.push(...sp.learnset[lv]);
  }
  for (const mid of learned.slice(-4)) {
    const mv = movesTable[mid];
    mon.moves.push({ id: mid, pp: mv.pp, maxPp: mv.pp });
  }
  mon.maxHp = hpValue(sp.base.hp, level);
  mon.hp = mon.maxHp;
  mon.stats = {
    atk: statValue(sp.base.atk, level),
    def: statValue(sp.base.def, level),
    spa: statValue(sp.base.spa, level),
    spd: statValue(sp.base.spd, level),
    spe: statValue(sp.base.spe, level),
  };
  return mon;
}


function displayName(mon, speciesTable) {
  return mon.nickname || speciesTable[mon.speciesId].name;
}

// Dex helpers — honest tracked-vs-playable wording lives in the UI layer.
function dexRegister(dex, kind, dexNo) {
  dex[kind][dexNo] = true;
  if (kind === 'caught' || kind === 'befriended') dex.seen[dexNo] = true;
}
function dexCaughtCount(dex) { return Object.keys(dex.caught).length; }


// ---- src/save/schema.mjs ----
// schema.mjs — save schema v1 validation + migration.
// Hand-rolled typed validator (LCR ruling §9.8). Whitelist, never blacklist.


const SAVE_KEY = 'pdr.save.guest';

// Whitelisted top-level keys. Unknown keys => reject (architecture §3.4).
const TOP_KEYS = ['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story',
  'pikachu', 'settings', 'facilities', 'bag', 'meta'];

function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

function validateSave(data) {
  const errors = [];
  if (!isObj(data)) return { ok: false, errors: ['not-an-object'] };
  for (const k of Object.keys(data)) {
    if (!TOP_KEYS.includes(k)) errors.push('unknown-key:' + k);
  }
  if (data.v !== SCHEMA_VERSION) errors.push('bad-schema-version');
  if (!isObj(data.player) || typeof data.player.name !== 'string') errors.push('bad-player');
  if (!Array.isArray(data.party) || data.party.length > 6) errors.push('bad-party');
  for (const m of (data.party || [])) {
    if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number') { errors.push('bad-mon'); break; }
    if (m.level < 1 || m.level > 100) { errors.push('bad-mon-level'); break; }
    if (!Array.isArray(m.moves) || m.moves.length > 4) { errors.push('bad-mon-moves'); break; }
  }
  if (!isObj(data.dex)) errors.push('bad-dex');
  if (!isObj(data.badges) || !Array.isArray(data.badges.kanto)) errors.push('bad-badges');
  if (!isObj(data.story) || !isObj(data.story.position)) errors.push('bad-story');
  return { ok: errors.length === 0, errors };
}

// v0 -> v1 migration chain. v0 never shipped publicly; stub kept for the chain.
function migrate(data) {
  if (!isObj(data)) return null;
  if (data.v === 0) {
    data.v = 1;
    data.facilities = data.facilities || { registry: [], unlocked: [] };
    data.badges = data.badges || { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] };
  }
  return data;
}

function saveSizeBytes(data) {
  try { return new Blob([JSON.stringify(data)]).size; }
  catch (e) { return JSON.stringify(data).length; }
}


// ---- src/save/store.mjs ----
// store.mjs — guest localStorage save store (Track A).
// Versioned JSON, quota-exceeded guard, export-before-overwrite (PRD edge 9).


function storage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) { /* fall through */ }
  return null;
}

class SaveStore {
  constructor() {
    this.lastError = null;
  }

  exists() {
    const s = storage();
    if (!s) return false;
    return s.getItem(SAVE_KEY) !== null;
  }

  load() {
    const s = storage();
    if (!s) return { ok: false, reason: 'no-storage' };
    const raw = s.getItem(SAVE_KEY);
    if (raw === null) return { ok: false, reason: 'empty' };
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, reason: 'corrupt-json' }; }
    data = migrate(data);
    const v = validateSave(data);
    if (!v.ok) return { ok: false, reason: 'invalid', errors: v.errors };
    return { ok: true, data };
  }

  save(state) {
    const s = storage();
    if (!s) { this.lastError = 'no-storage'; return { ok: false, reason: 'no-storage' }; }
    state.meta.updatedAt = Date.now();
    const bytes = saveSizeBytes(state);
    if (bytes > 65536) { this.lastError = 'over-budget'; return { ok: false, reason: 'over-budget', bytes }; }
    try {
      s.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota guard: never silently overwrite — surface + offer export.
      this.lastError = 'quota';
      return { ok: false, reason: 'quota', exportPayload: JSON.stringify(state) };
    }
    return { ok: true, bytes };
  }

  erase() {
    const s = storage();
    if (s) s.removeItem(SAVE_KEY);
  }

  exportFile(state) {
    return JSON.stringify(state);
  }
}

function freshState() {
  const st = defaultState();
  st.meta.createdAt = Date.now();
  st.meta.updatedAt = Date.now();
  return st;
}


// ---- src/game/scenes.mjs ----
// scenes.mjs — scene stack (push/pop/replace) + UI-state layer.
// Scenes: boot/title/intro/overworld/battle. UI panels swap without scene reloads.

class SceneStack {
  constructor(game) {
    this.game = game;
    this.stack = [];
  }
  get top() { return this.stack[this.stack.length - 1]; }
  push(scene) {
    const cur = this.top;
    if (cur && cur.suspend) cur.suspend();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  pop() {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const cur = this.top;
    if (cur && cur.resume) cur.resume();
    return s;
  }
  replace(scene) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  clear() {
    while (this.stack.length) this.pop();
  }
  update(dt) { const t = this.top; if (t && t.update) t.update(dt); }
  render(r, alpha) { const t = this.top; if (t && t.render) t.render(r, alpha); }
}


// ---- src/game/ui.mjs ----
// ui.mjs — DOM chrome: D-pad/A/B overlays, dialogue, menus, panels.
// Two backends: browser DOM, and headless (records calls; input-driven).
// Battle command panel replaces the D-pad zone (one-thumb rule, gameux §2).

const TEXT_SPEED_CPS = { slow: 15, normal: 30, fast: 60, instant: 9999 };

function stubEl() {
  return {
    children: [], style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, addEventListener() {}, removeEventListener() {},
    set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
    querySelector() { return stubEl(); }, querySelectorAll() { return []; },
    focus() {}, click() {},
  };
}

class UI {
  constructor(game) {
    this.game = game;
    this.headless = (typeof document === 'undefined');
    this.root = null;
    this.dpadEl = null; this.cmdEl = null;
    this.dlg = null;      // { lines, idx, chars, cb, speaker }
    this.menu = null;     // { title, items, idx, cb, battle }
    this.panel = null;    // named panel open (dex/party/bag/save/options)
    this.toastQ = [];
    this.log = [];        // headless: record of UI calls (test assertions)
    this._els = {};
  }

  init() {
    if (this.headless) return;
    const doc = document;
    this.root = doc.getElementById('ui');
    this.buildControls();
    this.buildDialogue();
    this.buildMenu();
    this.buildToasts();
  }

  el(tag, cls, parent) {
    if (this.headless) return stubEl();
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- touch controls ----
  buildControls() {
    const g = this.el('div', 'controls', this.root);
    const pad = this.el('div', 'dpad', g);
    this.dpadEl = pad;
    const mk = (action, cls, label) => {
      const b = this.el('button', 'padbtn ' + cls, pad);
      b.textContent = label;
      b.setAttribute('aria-label', action);
      const on = (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); };
      const off = (e) => { e.preventDefault(); this.game.input.release(action); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    mk('up', 'p-up', '▲'); mk('down', 'p-down', '▼');
    mk('left', 'p-left', '◀'); mk('right', 'p-right', '▶');
    const ab = this.el('div', 'ab', g);
    const mkA = (action, cls, label) => {
      const b = this.el('button', 'abtn ' + cls, ab);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      b.addEventListener('pointercancel', (e) => e.preventDefault());
      return b;
    };
    mkA('a', 'a-a', 'A'); mkA('b', 'a-b', 'B');
    const sys = this.el('div', 'sysbtns', g);
    const mkS = (action, label) => {
      const b = this.el('button', 'sysbtn', sys);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      return b;
    };
    mkS('start', 'START'); mkS('select', 'SELECT');
    // Command panel (battle) — hidden unless battle scene shows it.
    this.cmdEl = this.el('div', 'cmdpanel hidden', g);
  }

  // Battle command panel: 2x2 grid replacing the D-pad zone (gameux §4.2).
  showCommands(items, cb) {
    // items: [{label, icon, value, disabled}]
    this.menu = { title: null, items, idx: 0, cb, battle: true, kind: 'commands' };
    this.log.push({ ui: 'commands', items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  buildDialogue() {
    this.dlgEl = this.el('div', 'dialogue hidden', this.root);
    this.dlgName = this.el('div', 'dlg-name', this.dlgEl);
    this.dlgText = this.el('div', 'dlg-text', this.dlgEl);
    this.dlgHint = this.el('div', 'dlg-hint', this.dlgEl);
    this.dlgHint.textContent = '▼';
  }

  say(lines, cb, speaker) {
    this.dlg = { lines: lines.slice(), idx: 0, chars: 0, cb: cb || null, speaker: speaker || null, done: false };
    this.log.push({ ui: 'dialogue', lines });
    if (!this.headless) {
      this.dlgEl.classList.remove('hidden');
      this.dlgName.textContent = this.dlg.speaker || '';
      this.dlgName.style.display = this.dlg.speaker ? 'block' : 'none';
      this.dlgText.textContent = '';
    }
  }

  get dialogueOpen() { return !!this.dlg; }

  advanceDialogue() {
    const d = this.dlg;
    if (!d) return false;
    const full = d.lines[d.idx];
    const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
    if (d.chars < full.length && speed < 9999) {
      d.chars = full.length; // first press completes the line
      if (!this.headless) this.dlgText.textContent = full;
      return true;
    }
    d.idx++;
    d.chars = 0;
    if (d.idx >= d.lines.length) {
      this.closeDialogue();
      const cb = d.cb; d.cb = null;
      if (cb) cb();
      return false;
    }
    if (!this.headless) this.dlgText.textContent = '';
    return true;
  }

  closeDialogue() {
    this.dlg = null;
    if (!this.headless) this.dlgEl.classList.add('hidden');
  }

  buildMenu() {
    this.menuEl = this.el('div', 'menu hidden', this.root);
    this.menuTitle = this.el('div', 'menu-title', this.menuEl);
    this.menuList = this.el('div', 'menu-list', this.menuEl);
  }

  showMenu(title, items, cb, opts) {
    this.menu = { title, items, idx: 0, cb, battle: !!(opts && opts.battle), kind: 'menu' };
    this.log.push({ ui: 'menu', title, items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  renderMenu() {
    if (this.headless) return;
    const m = this.menu;
    if (!m) { this.menuEl.classList.add('hidden'); return; }
    this.menuEl.classList.remove('hidden');
    this.menuTitle.textContent = m.title || '';
    this.menuTitle.style.display = m.title ? 'block' : 'none';
    this.menuList.innerHTML = '';
    m.items.forEach((it, i) => {
      const r = document.createElement('button');
      r.className = 'menu-row' + (i === m.idx ? ' cursor' : '') + (it.disabled ? ' disabled' : '');
      r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span><span>' + it.label + '</span>';
      r.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      this.menuList.appendChild(r);
    });
  }

  moveMenu(d) {
    const m = this.menu;
    if (!m) return;
    const n = m.items.length;
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx({ wave: 'pulse', vol: 0.25, notes: [[0, 'A5', 1]] });
    if (!this.headless) this.renderMenu();
  }

  chooseMenu(i) {
    const m = this.menu;
    if (!m) return;
    const idx = (i === undefined ? m.idx : i);
    const it = m.items[idx];
    if (!it || it.disabled) return;
    this.menu = null;
    if (!this.headless) this.menuEl.classList.add('hidden');
    this.game.audio.playSfx({ wave: 'pulse', vol: 0.35, notes: [[0, 'E5', 1]] });
    const cb = m.cb;
    if (cb) cb(it.value, idx);
  }

  cancelMenu() {
    const m = this.menu;
    if (!m) return;
    this.menu = null;
    if (!this.headless) this.menuEl.classList.add('hidden');
    const cb = m.cb;
    if (cb) cb(null, -1);
  }

  get menuOpen() { return !!this.menu; }

  buildToasts() {
    this.toastEl = this.el('div', 'toasts', this.root);
  }

  toast(text) {
    this.toastQ.push({ text, t: 0 });
    this.log.push({ ui: 'toast', text });
    if (this.headless) return;
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    this.toastEl.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2500);
  }

  // Per-tick UI input handling. Returns true if UI consumed input.
  update(dt) {
    const input = this.game.input;
    // Typewriter advance
    if (this.dlg) {
      const d = this.dlg;
      const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
      if (speed < 9999 && d.chars < d.lines[d.idx].length) {
        d.chars = Math.min(d.lines[d.idx].length, d.chars + speed * dt);
        if (!this.headless) this.dlgText.textContent = d.lines[d.idx].slice(0, Math.floor(d.chars));
      }
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.game.audio.unlock();
        this.advanceDialogue();
        return true;
      }
      if (input.wasPressed('b')) { /* B does not skip story dialogue */ }
      return true; // dialogue modal
    }
    if (this.menu) {
      if (input.wasPressed('up')) this.moveMenu(-1);
      else if (input.wasPressed('down')) this.moveMenu(1);
      else if (input.wasPressed('left') && this.menu.battle) this.moveMenu(-1);
      else if (input.wasPressed('right') && this.menu.battle) this.moveMenu(1);
      else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
      else if (input.wasPressed('b') || input.wasPressed('escape')) { this.cancelMenu(); return true; }
      return true; // menu modal
    }
    return false;
  }

  setBattleMode(on) {
    if (this.headless) return;
    this.dpadEl.classList.toggle('hidden', on);
    this.cmdEl.classList.toggle('hidden', !on);
  }

  setHudVisible(v) {
    if (this.headless) return;
    this.root.classList.toggle('nohud', !v);
  }

  // Headless test helper: choose a menu item by index.
  debugChoose(i) { this.chooseMenu(i); }
}


// ---- src/game/title.mjs ----
// title.mjs — boot disclaimer card (GC verbatim, §2a) + title screen.
// The legal card renders in the shell before any interactive element and is not
// skippable-in-one-tap on first boot (readable dwell >= 3 seconds).

const DISCLAIMER_BOOT = [
  "ASH'S JOURNEY",
  'An unofficial fan homage. Not affiliated with, endorsed by, or connected to',
  'Nintendo, Creatures Inc., or GAME FREAK inc.',
  '',
  'Pok\u00e9mon, Pikachu, and all character names are trademarks of',
  'Nintendo / Creatures Inc. / GAME FREAK inc.',
  'This is a free, non-commercial fan project made with love by fans.',
  'No purchase is required or accepted. Please support the official releases.',
];

const DISCLAIMER_CREDITS = [
  'LEGAL',
  '',
  'This game is an unofficial fan work and is not affiliated with, endorsed by,',
  'sponsored by, or connected to Nintendo Co., Ltd., Creatures Inc., or',
  'GAME FREAK inc. Pok\u00e9mon and all related names, characters, and indicia are',
  'trademarks of their respective owners.',
  '',
  'All code, artwork, music, sound effects, and dialogue in this game are',
  'original creations made for this fan project; no game assets were copied or',
  'extracted from any official release.',
  '',
  'This game is free, carries no advertising, accepts no payments, donations,',
  'or tips, and collects no personal data for commercial purposes.',
  '',
  'If you represent a rights holder and have concerns about this project,',
  'contact the developer directly and we will respond promptly.',
  '// OQ-grade: rights-holder contact resolves to an owner-designated address',
  '// before any public share. Not a dead link in a signed build.',
];

const GAME_TITLE = "ASH'S JOURNEY";
const GAME_SUBTITLE = 'An Unofficial Fan Homage';

class BootScene {
  enter() {
    this.t = 0;
    this.phase = 'legal'; // legal -> title
    this.ready = false;  // interactive only after dwell
    this.menuIdx = 0;
    this.game.ui.log.push({ ui: 'boot' });
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.phase === 'legal') {
      if (this.t >= 3) this.ready = true;
      if (this.ready && (input.wasPressed('a') || input.wasPressed('start'))) {
        this.phase = 'title';
        this.t = 0;
        this.game.audio.unlock();
      }
      return;
    }
    // title menu
    const items = this.menuItems();
    if (input.wasPressed('up')) { this.menuIdx = (this.menuIdx + items.length - 1) % items.length; }
    if (input.wasPressed('down')) { this.menuIdx = (this.menuIdx + 1) % items.length; }
    if (input.wasPressed('a') || input.wasPressed('start')) {
      const it = items[this.menuIdx];
      this.game.audio.unlock();
      if (it.value === 'new') this.game.newGame();
      else if (it.value === 'continue') this.game.continueGame();
      else if (it.value === 'options') this.game.openOptions();
    }
  }
  menuItems() {
    const items = [{ label: 'New Game', value: 'new' }];
    if (this.game.store.exists()) items.push({ label: 'Continue', value: 'continue' });
    items.push({ label: 'Options', value: 'options' });
    return items;
  }
  render(r) {
    const g = this.game;
    if (this.phase === 'legal') {
      this.renderLegal(r);
      return;
    }
    // Title art: original — rising sun bands + silhouettes (no official key art).
    const w = r.viewW, h = r.viewH;
    const bands = ['#2a1a3a', '#5a2a4a', '#a04a3a', '#e08a4a', '#f8c86a'];
    for (let i = 0; i < bands.length; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    // Sun disc
    g.ctx2dcircle(w / 2, h * 0.42, 26, '#ffe9a8');
    // Ash + Pikachu silhouettes (original shapes)
    g.ctx2dcircle(w / 2 - 14, h * 0.62, 7, '#1a1a22');
    g.ctx2drect(w / 2 - 20, h * 0.62 + 5, 12, 14, '#1a1a22');
    g.ctx2dcircle(w / 2 + 16, h * 0.66, 5, '#1a1a22');
    r.text(GAME_TITLE, 8, 8, { size: 14, bold: true, color: '#fff' });
    r.text(GAME_SUBTITLE, 8, 26, { size: 8, color: '#ffe9a8' });
    const items = this.menuItems();
    const pulse = Math.floor(this.t * 2) % 2 === 0;
    items.forEach((it, i) => {
      const y = h - 64 + i * 14;
      r.text((i === this.menuIdx ? '\u25b8 ' : '  ') + it.label, w / 2 - 40, y,
        { size: 10, color: i === this.menuIdx && pulse ? '#ffe9a8' : '#fff' });
    });
    if (pulse) r.text('PRESS START / TAP A', w / 2 - 52, h - 14, { size: 8, color: '#fff' });
    r.text('Unofficial fan homage — not affiliated with Nintendo.', 4, h - 26, { size: 6, color: '#ddd' });
  }
  renderLegal(r) {
    const w = r.viewW, h = r.viewH;
    r.panel(6, 6, w - 12, h - 12, '#101018', '#e8c832');
    let y = 16;
    for (const line of DISCLAIMER_BOOT) {
      const size = y === 16 ? 12 : 7;
      const bold = y === 16;
      r.text(line, 14, y, { size, bold, color: y === 16 ? '#e8c832' : '#f0f0f0' });
      y += size + 5;
    }
    if (this.ready) {
      const pulse = Math.floor(this.t * 2) % 2 === 0;
      if (pulse) r.text('Press A / tap to continue', 14, h - 22, { size: 8, color: '#e8c832' });
    }
  }
}


// ---- src/game/intro.mjs ----
// intro.mjs — professor intro, name entry, starter moment (Pikachu refuses the ball).
// Original dialogue. Skippable on replay via "Skip intro (veteran)" (gameux §5).


class IntroScene {
  enter() {
    this.step = 'ask-skip';
    this.lineIdx = 0;
    this.name = 'ASH';
    this.rival = 'GARY';
    this.game.ui.log.push({ ui: 'intro' });
    this.begin();
  }

  begin() {
    const g = this.game;
    if (g.skipIntroVeteran) {
      this.finishIntro();
      return;
    }
    this.step = 'professor';
    const lines = INTRO_SCRIPT.lines.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => this.nameEntry(), INTRO_SCRIPT.professor);
  }

  nameEntry() {
    // Slice build: name entry keeps the canon default; full A-Z grid ships Wave 2.
    const g = this.game;
    g.ui.showMenu('Your name?', [
      { label: 'ASH (default)', value: 'ASH' },
      { label: 'Keep: ' + (g.state.player.name || 'ASH'), value: g.state.player.name || 'ASH' },
    ], (value) => {
      if (value) this.name = value;
      g.state.player.name = this.name;
      this.starterMoment();
    });
  }

  starterMoment() {
    const g = this.game;
    const lines = INTRO_SCRIPT.starterMoment.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => {
      // Partner joins OUTSIDE the ball system (EP014 homage — hard rule).
      const pikachu = makeMon('partner', 5, SPECIES, MOVES);
      g.state.party.push(pikachu);
      const sp = SPECIES.partner;
      dexRegister(g.state.dex, 'seen', sp.dexNo);
      dexRegister(g.state.dex, 'caught', sp.dexNo);
      g.state.story.flags.metPartner = true;
      g.state.story.flags.refusedBall = true;
      g.audio.playSfx(SFX.dex);
      g.ui.toast(sp.name + ' joined your party!');
      this.finishIntro();
    }, INTRO_SCRIPT.professor);
  }

  finishIntro() {
    const g = this.game;
    g.state.story.flags.introDone = true;
    g.state.story.position = { map: 'pallet', x: 7, y: 7, dir: 'down' };
    g.saveGame(true);
    g.startOverworld();
  }

  update(dt) { /* UI modal drives */ }
  render(r) {
    // Professor's lab backdrop: original flat bands.
    const w = r.viewW, h = r.viewH;
    const bands = ['#1a2a4a', '#2a3a5a', '#3a4a6a'];
    for (let i = 0; i < bands.length; i++) {
      this.game.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    r.text(INTRO_SCRIPT.professor, 8, 8, { size: 10, bold: true, color: '#ffe9a8' });
  }
}


// ---- src/game/battle.mjs ----
// battle.mjs — turn-based battle state machine (architecture §2.2).
// States: intro | command | moves | bag | party | catchseq | resolve | faint |
//          xp | victory | defeat | run. Transitions are data-ish, no spaghetti.


const HP_DRAIN_PER_SEC = 90; // ADR-004 feel budget

class BattleScene {
  constructor(opts) {
    this.kind = opts.kind; // 'wild' | 'trainer'
    this.foeMon = opts.foe;
    this.trainer = opts.trainer || null;
    this.returnTo = opts.returnTo;
    this.trainerIdx = 0;
  }

  enter() {
    const g = this.game;
    g.ui.setBattleMode(true);
    this.state = 'intro';
    this.t = 0;
    this.msg = '';
    if (this.kind === 'trainer') {
      const t0 = this.trainer.team[0];
      this.foeMon = makeMon(t0.species, t0.level, SPECIES, MOVES);
    }
    this.ally = this.firstAble(g);
    this.foe = this.foeMon;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.allyStages = this.ally.stages;
    this.turn = 1;
    this.actions = [];
    this.animQ = [];
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.xpAnim = 0;
    this.shakeT = 0;
    this.flashT = 0;
    this.catchState = null;
    this.fled = false;
    this.critCap = false;
    this.log = [];
    g.ui.log.push({ ui: 'battle', kind: this.kind, foe: this.foe.speciesId });
    const foeName = displayName(this.foe, SPECIES);
    this.say(this.kind === 'wild' ? 'Wild ' + foeName + ' appeared!' : 'Trainer ' + this.trainer.name + ' wants to battle!');
  }

  firstAble(g) {
    for (const m of g.state.party) if (m.hp > 0) return m;
    return g.state.party[0];
  }

  say(text, cb) {
    this.msg = text;
    this.msgCb = cb || null;
    this.msgOpen = true;
    this.game.ui.log.push({ ui: 'battle-msg', text });
  }

  update(dt) {
    const g = this.game;
    const input = g.input;
    // Screen shake / flash decay
    if (this.shakeT > 0) { this.shakeT -= dt * 1000; g.renderer.shakeX = (Math.random() - 0.5) * 8; g.renderer.shakeY = (Math.random() - 0.5) * 8; }
    else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    if (this.flashT > 0) { this.flashT -= dt * 1000; g.renderer.flashA = Math.max(0, this.flashT / 60) * 0.8; }

    // Animated HP drain (90 HP/s)
    this.drainHp(dt);

    if (g.ui.update(dt)) return;
    if (this.msgOpen) {
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.msgOpen = false;
        const cb = this.msgCb; this.msgCb = null;
        if (cb) cb();
        else this.afterMsg();
      }
      return;
    }
    switch (this.state) {
      case 'intro': break; // driven by msg cb
      case 'command': this.updateCommand(input); break;
      case 'resolve': this.updateResolve(dt); break;
      case 'catchseq': this.updateCatch(dt); break;
      case 'xp': this.updateXp(dt); break;
      case 'victory': case 'defeat': break;
    }
  }

  afterMsg() {
    const s = this.state;
    if (s === 'intro') this.toCommand();
    else if (s === 'resolve') this.nextAction();
    else if (s === 'victory') this.finishVictory();
    else if (s === 'defeat') this.finishDefeat();
    else if (s === 'faintfoe') this.afterFaintFoe();
  }

  toCommand() {
    this.state = 'command';
    const items = [
      { label: 'FIGHT', value: 'fight' },
      { label: 'BAG', value: 'bag' },
      { label: 'PARTY', value: 'party' },
      { label: this.kind === 'wild' ? 'RUN' : 'RUN', value: 'run', disabled: this.kind !== 'wild' },
    ];
    this.game.ui.showCommands(items, (value) => this.onCommand(value));
  }

  updateCommand() { /* menu modal drives via ui */ }

  onCommand(value) {
    const g = this.game;
    if (value === null) { this.toCommand(); return; } // cancelled -> back
    if (value === 'fight') {
      const ally = this.ally;
      const items = ally.moves.map((m, i) => {
        const mv = MOVES[m.id];
        return { label: mv.name + '  ' + m.pp + '/' + m.maxPp, value: i, disabled: m.pp <= 0 };
      });
      items.push({ label: 'Back', value: -1 });
      this.state = 'moves';
      g.ui.showMenu('Choose a move', items, (v) => {
        if (v === null || v === -1) { this.toCommand(); return; }
        this.playerAction = { type: 'move', idx: v };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      });
    } else if (value === 'bag') {
      this.state = 'bag';
      const items = [];
      for (const bid of Object.keys(BALLS)) {
        const n = g.state.bag[bid] || 0;
        items.push({ label: BALLS[bid].name + ' x' + n, value: bid, disabled: n <= 0 || this.kind !== 'wild' });
      }
      const potions = g.state.bag.potion || 0;
      items.push({ label: 'Potion x' + potions, value: 'potion', disabled: potions <= 0 });
      items.push({ label: 'Back', value: null });
      g.ui.showMenu('Bag', items, (v) => {
        if (v === null) { this.toCommand(); return; }
        if (v === 'potion') { this.usePotion(); return; }
        this.playerAction = { type: 'ball', ball: v };
        this.foeAction = null; // throwing a ball: foe still acts? DS: ball replaces your move; foe moves first if faster. Simplify: foe acts after throw fails only.
        this.beginCatch(v);
      });
    } else if (value === 'party') {
      this.openPartyMenu(false);
    } else if (value === 'run') {
      if (this.kind === 'wild') {
        this.say('Got away safely!', () => this.endBattle(true));
      } else {
        this.say("Can't escape a trainer battle!", () => this.toCommand());
      }
    }
  }

  openPartyMenu(inFaint) {
    const g = this.game;
    const items = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      const tag = m === this.ally ? ' (active)' : '';
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + ' ' + m.hp + '/' + m.maxHp + tag, value: i, disabled: m.hp <= 0 || m === this.ally };
    });
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu(inFaint ? 'Choose next Pokemon' : 'Party', items, (v) => {
      if (v === null || v === -1) { if (!inFaint) this.toCommand(); return; }
      const old = this.ally;
      this.ally = g.state.party[v];
      this.allyStages = this.ally.stages;
      this.hpAnim.ally = this.ally.hp;
      if (inFaint) {
        this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this.toCommand());
      } else {
        this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
          this.playerAction = { type: 'switch', from: old };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      }
    });
  }

  usePotion() {
    const g = this.game;
    const items = g.state.party.map((m, i) => ({
      label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i, disabled: m.hp <= 0 || m.hp >= m.maxHp,
    }));
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Use Potion on...', items, (v) => {
      if (v === null || v === -1) { this.toCommand(); return; }
      const m = g.state.party[v];
      g.state.bag.potion--;
      m.hp = Math.min(m.maxHp, m.hp + 20);
      this.hpAnim.ally = m.hp; // snap if active
      this.say(displayName(m, SPECIES) + ' recovered 20 HP!', () => {
        this.playerAction = { type: 'item' };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      });
    });
  }

  chooseFoeAction() {
    const g = this.game;
    const usable = this.foe.moves.map((m, i) => i).filter((i) => this.foe.moves[i].pp > 0);
    if (!usable.length) return { type: 'move', idx: 0, struggle: true };
    // Gym-leader-ish AI: prefer super-effective moves, else random.
    const allyTypes = SPECIES[this.ally.speciesId].types;
    let best = usable[0], bestScore = -1;
    for (const i of usable) {
      const mv = MOVES[this.foe.moves[i].id];
      if (mv.cat === 'status') continue;
      const e = effectiveness(mv.type, allyTypes);
      const score = e * (0.5 + g.rng.battle());
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (g.rng.battle() < 0.25) best = usable[Math.floor(g.rng.battle() * usable.length)];
    return { type: 'move', idx: best };
  }

  effStats(mon, stages) {
    const sp = SPECIES[mon.speciesId];
    return {
      atk: Math.floor(mon.stats.atk * stageMultiplier(stages.atk)),
      def: Math.floor(mon.stats.def * stageMultiplier(stages.def)),
      spa: Math.floor(mon.stats.spa * stageMultiplier(stages.spa)),
      spd: Math.floor(mon.stats.spd * stageMultiplier(stages.spd)),
      spe: Math.floor(mon.stats.spe * stageMultiplier(stages.spe)),
    };
  }

  beginTurn() {
    this.state = 'resolve';
    const pa = this.playerAction, fa = this.foeAction;
    const mk = (side, action) => {
      const mon = side === 'ally' ? this.ally : this.foe;
      const stages = side === 'ally' ? this.allyStages : this.foeStages;
      const stats = this.effStats(mon, stages);
      let priority = 0, move = null;
      if (action && action.type === 'move') {
        move = action.struggle ? { name: 'Struggle', type: 'normal', cat: 'physical', power: 50, acc: 100 } : MOVES[mon.moves[action.idx].id];
        priority = move.priority || 0;
      }
      return { side, action, mon, stats, priority, move };
    };
    const order = [];
    if (pa && pa.type !== 'switch' && pa.type !== 'item' && pa.type !== 'ball') order.push(mk('ally', pa));
    if (fa) order.push(mk('foe', fa));
    if (pa && (pa.type === 'switch' || pa.type === 'item' || pa.type === 'ball')) {
      // non-attack actions happen first, then foe acts
      this.actions = fa ? [mk('foe', fa)] : [];
      if (pa.type === 'switch' || pa.type === 'item') { /* already applied */ }
      this.state = 'resolve';
      this.nextAction();
      return;
    }
    // sort by priority -> Speed (paralysis quarters Speed) -> random tiebreak
    const cmp = (x, y) => {
      if (x.priority !== y.priority) return y.priority - x.priority;
      const sx = x.mon.status === 'paralysis' ? Math.floor(x.stats.spe / 4) : x.stats.spe;
      const sy = y.mon.status === 'paralysis' ? Math.floor(y.stats.spe / 4) : y.stats.spe;
      if (sx !== sy) return sy - sx;
      return this.game.rng.battle() < 0.5 ? -1 : 1;
    };
    this.actions = order.slice().sort(cmp);
    this.nextAction();
  }

  nextAction() {
    if (this.state !== 'resolve') return;
    const next = this.actions.shift();
    if (!next) { this.endTurnStatus(); return; }
    if (next.mon.hp <= 0) { this.nextAction(); return; } // fainted mid-turn
    this.execMove(next);
  }

  execMove(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);

    // Paralysis / sleep / freeze / confusion gates
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      this.say(atkName + ' is paralyzed! It can\'t move!', () => this.nextAction());
      return;
    }
    if (atk.status === 'sleep') {
      atk.statusTurns = (atk.statusTurns || 2) - 1;
      if (atk.statusTurns <= 0) { atk.status = null; this.say(atkName + ' woke up!', () => this.execMoveContinue(entry)); }
      else this.say(atkName + ' is fast asleep.', () => this.nextAction());
      return;
    }
    if (atk.status === 'freeze') {
      if (roll(0.2, g.rng.battle)) { atk.status = null; this.say(atkName + ' thawed out!', () => this.execMoveContinue(entry)); }
      else { this.say(atkName + ' is frozen solid!', () => this.nextAction()); }
      return;
    }
    if (atk.confused && roll(0.33, g.rng.battle)) {
      const dmg = Math.max(1, Math.floor(calcDamage(atk.level, 40, entry.stats.atk, entry.stats.def, {}) / 2));
      atk.hp = Math.max(0, atk.hp - dmg);
      this.say(atkName + ' hurt itself in confusion!', () => this.checkFaint(entry.side, () => this.nextAction()));
      return;
    }
    this.execMoveContinue(entry);
  }

  execMoveContinue(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);
    const defName = displayName(def, SPECIES);

    // PP
    if (entry.action && !entry.action.struggle && entry.action.type === 'move') {
      const slot = atk.moves[entry.action.idx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }

    // Accuracy check
    const acc = mv.acc || 100;
    if (acc < 100 && !roll(acc / 100, g.rng.battle)) {
      this.say(atkName + ' used ' + mv.name + '!', () => {
        this.say('But it missed!', () => this.nextAction());
      });
      return;
    }

    this.say(atkName + ' used ' + mv.name + '!', () => {
      if (mv.cat === 'status') { this.applyStatusMove(entry, mv); return; }
      const atkStat = mv.cat === 'physical' ? entry.stats.atk : entry.stats.spa;
      const defStat = mv.cat === 'physical'
        ? Math.floor(def.stats.def * stageMultiplier(defStages.def))
        : Math.floor(def.stats.spd * stageMultiplier(defStages.spd));
      const eff = effectiveness(mv.type, SPECIES[def.speciesId].types);
      const stab = SPECIES[atk.speciesId].types.includes(mv.type);
      const crit = roll(CRIT_CHANCE, g.rng.battle);
      const rand = RANDOM_MIN + g.rng.battle() * (RANDOM_MAX - RANDOM_MIN);
      const burn = atk.status === 'burn';
      if (eff === 0) {
        this.say('It doesn\'t affect ' + defName + '...', () => this.nextAction());
        return;
      }
      const dmg = calcDamage(atk.level, mv.power, atkStat, defStat,
        { stab, effectiveness: eff, crit, random: rand, burn, physical: mv.cat === 'physical' });
      def.hp = Math.max(0, def.hp - dmg);
      // Impact theater: hit-stop feel via shake/flash
      if (eff > 1) { this.shakeT = 120; this.flashT = 60; }
      else if (eff < 1) { this.shakeT = 60; }
      if (crit) this.flashT = 90;
      let extra = '';
      if (crit) extra = ' A critical hit!';
      if (eff > 1) extra += " It's super effective!";
      else if (eff < 1) extra += " It's not very effective...";
      const after = () => {
        // Secondary effect, then the damage line (never double-say the effectiveness line).
        let msg2 = defName + ' took ' + dmg + ' damage!';
        if (mv.effect && mv.effect.status && (!mv.effect.chance || roll(mv.effect.chance / 100, g.rng.battle))) {
          if (!def.status) {
            def.status = mv.effect.status;
            if (mv.effect.status === 'confusion') def.confused = true;
            msg2 = defName + this.statusText(mv.effect.status);
          }
        }
        if (mv.effect && mv.effect.drain) {
          atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * mv.effect.drain));
        }
        this.say(msg2, () => {
          this.checkFaint(foeSide, () => this.nextAction());
        });
      };
      if (extra.trim()) this.say(extra.trim(), after);
      else after();
    });
  }

  statusText(s) {
    return { burn: ' was burned!', poison: ' was poisoned!', paralysis: ' was paralyzed!', sleep: ' fell asleep!', freeze: ' was frozen solid!', confusion: ' became confused!' }[s] || ' was afflicted!';
  }

  applyStatusMove(entry, mv) {
    const g = this.game;
    const ef = mv.effect || {};
    const target = ef.target === 'self' ? entry.mon : (entry.side === 'ally' ? this.foe : this.ally);
    const stages = ef.target === 'self' ? (entry.side === 'ally' ? this.allyStages : this.foeStages) : (entry.side === 'ally' ? this.foeStages : this.allyStages);
    const tName = displayName(target, SPECIES);
    let msg = '';
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
      if (ef[k]) {
        stages[k] = Math.max(-6, Math.min(6, stages[k] + ef[k]));
        msg = tName + (ef[k] > 0 ? "'s " + k.toUpperCase() + ' rose!' : "'s " + k.toUpperCase() + ' fell!');
      }
    }
    if (ef.status === 'confusion') {
      target.confused = true;
      msg = tName + ' became confused!';
    }
    this.say(msg || 'Nothing happened.', () => this.nextAction());
  }

  checkFaint(side, cb) {
    const mon = side === 'ally' ? this.ally : this.foe;
    if (mon.hp > 0) { cb(); return; }
    const name = displayName(mon, SPECIES);
    this.say(name + ' fainted!', () => {
      if (side === 'foe') {
        this.state = 'faintfoe';
        this.afterFaintFoe();
      } else {
        const g = this.game;
        const anyLeft = g.state.party.some((m) => m.hp > 0);
        if (!anyLeft) {
          this.state = 'defeat';
          this.say('You have no Pokemon left!', () => this.afterMsg());
        } else {
          this.openPartyMenu(true);
        }
      }
    });
  }

  afterFaintFoe() {
    const g = this.game;
    if (this.kind === 'trainer') {
      this.trainerIdx++;
      if (this.trainerIdx < this.trainer.team.length) {
        const t = this.trainer.team[this.trainerIdx];
        this.foe = makeMon(t.species, t.level, SPECIES, MOVES);
        this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        this.hpAnim.foe = this.foe.hp;
        const foeName = displayName(this.foe, SPECIES);
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => {
          this.state = 'resolve';
          this.awardXp(() => this.toCommand());
        });
        return;
      }
      this.awardXp(() => this.winTrainer());
    } else {
      this.awardXp(() => {
        this.state = 'victory';
        this.say('Wild ' + displayName(this.foe, SPECIES) + ' was defeated!', () => this.afterMsg());
      });
    }
  }

  awardXp(cb) {
    const g = this.game;
    const base = SPECIES[this.foe.speciesId].baseXp;
    const gain = xpYield(base, this.foe.level, this.kind === 'wild');
    this.pendingXp = (this.pendingXp || 0) + gain;
    this.xpCb = cb;
    this.state = 'xp';
    this.xpT = 0;
  }

  updateXp(dt) {
    const g = this.game;
    // XP bar ease-out over 600ms (gameux §4.2), then level-ups
    this.xpT += dt * 1000;
    if (this.xpT < 600) return;
    if (!this.xpApplied) {
      this.xpApplied = true;
      const msgs = [];
      for (const m of g.state.party) {
        if (m.hp <= 0) continue;
        m.xp += this.pendingXp;
        let leveled = false;
        while (m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1) && m.level < 100) {
          m.level++;
          leveled = true;
          const sp = SPECIES[m.speciesId];
          m.maxHp = hpValue(sp.base.hp, m.level);
          m.hp = Math.min(m.maxHp, m.hp + Math.floor(m.maxHp * 0.2));
          m.stats = {
            atk: statValue(sp.base.atk, m.level), def: statValue(sp.base.def, m.level),
            spa: statValue(sp.base.spa, m.level), spd: statValue(sp.base.spd, m.level),
            spe: statValue(sp.base.spe, m.level),
          };
          // Learn new moves
          const newMoves = (sp.learnset[m.level] || []);
          for (const mid of newMoves) {
            if (m.moves.length < 4) m.moves.push({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp });
            else m.moves[3] = { id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp }; // slice: replace oldest-known slot
          }
        }
        if (leveled) msgs.push(displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!');
      }
      g.audio.playSfx(SFX.dex);
      this.pendingXp = 0;
      this.xpApplied = false;
      const cb = this.xpCb; this.xpCb = null;
      if (msgs.length) this.say(msgs.join(' '), () => { this.state = 'resolve'; if (cb) cb(); });
      else { this.state = 'resolve'; if (cb) cb(); }
    }
  }

  endTurnStatus() {
    // Burn/poison tick (1/16 max HP), then next command or faint checks.
    const tick = (mon, stages, side, done) => {
      if (mon.hp <= 0) { done(); return; }
      if (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'badlyPoisoned') {
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - dmg);
        this.say(displayName(mon, SPECIES) + ' is hurt by ' + mon.status + '!', () => {
          this.checkFaint(side, done);
        });
        return;
      }
      done();
    };
    tick(this.ally, this.allyStages, 'ally', () => {
      if (this.state === 'defeat' || !this.ally || this.ally.hp <= 0) { this.nextAfterStatus(); return; }
      tick(this.foe, this.foeStages, 'foe', () => this.nextAfterStatus());
    });
  }

  nextAfterStatus() {
    if (this.state === 'defeat') { this.afterMsg(); return; }
    if (this.state === 'faintfoe') { this.afterFaintFoe(); return; }
    this.turn++;
    this.toCommand();
  }

  // ---- Catch sequence: the theater (gameux §4.2) ----
  beginCatch(ballId) {
    const g = this.game;
    g.state.bag[ballId]--;
    const ball = BALLS[ballId];
    this.state = 'catchseq';
    this.catchState = { ball, phase: 'throw', t: 0, shakes: 0, need: 0, a: 0 };
    g.audio.playSfx(SFX.throw_);
    this.msg = 'You threw a ' + ball.name + '!'; // throw plays immediately, no modal
    this.msgOpen = false;
    const foe = this.foe;
    const a = catchA(foe.maxHp, foe.hp, SPECIES[foe.speciesId].catchRate, ball.bonus, foe.status);
    this.catchState.a = a;
    this.critCap = isCriticalCapture(a) && roll(0.05, g.rng.battle);
    this.catchState.need = this.critCap ? 1 : shakeChecks(a, g.rng.battle);
    if (this.critCap) g.ui.toast('Critical capture!');
  }

  updateCatch(dt) {
    const g = this.game;
    const c = this.catchState;
    c.t += dt * 1000;
    // throw 26f (~430ms) -> absorb -> ball drop -> 3x800ms shakes -> click
    if (c.phase === 'throw' && c.t >= 430) { c.phase = 'shakes'; c.t = 0; }
    else if (c.phase === 'shakes') {
      const want = c.need;
      const doneShakes = Math.floor(c.t / 800);
      if (c.shakes < doneShakes && c.shakes < want) {
        c.shakes++;
        g.audio.playSfx(SFX.rattle);
      }
      if (c.shakes >= want && c.t >= want * 800 + 200) {
        if (want >= 3 || (this.critCap && want >= 1)) this.catchSuccess();
        else this.catchBreak(c.shakes);
      }
    }
  }

  catchSuccess() {
    const g = this.game;
    g.audio.playSfx(SFX.click);
    const foe = this.foe;
    const name = displayName(foe, SPECIES);
    dexRegister(g.state.dex, 'caught', SPECIES[foe.speciesId].dexNo);
    let dest = 'party';
    if (g.state.party.length >= 6) {
      const box = g.state.boxes.box1 || (g.state.boxes.box1 = []);
      box.push({ speciesId: foe.speciesId, level: foe.level, xp: foe.xp, nickname: null, moves: foe.moves.map((m) => m.id), ivs: foe.ivs });
      dest = 'Box 1';
    } else {
      foe.hp = foe.maxHp; // caught fresh
      g.state.party.push(foe);
    }
    g.audio.playSfx(SFX.dex);
    this.say('Gotcha! ' + name + ' was caught! (' + dest + ')', () => {
      g.ui.toast(name + ' registered in the Dex!');
      this.endBattle(true);
    });
  }

  catchBreak(shakesDone) {
    const g = this.game;
    const name = displayName(this.foe, SPECIES);
    g.renderer.flashA = 0.8;
    this.say('Oh no! ' + name + ' broke free after ' + shakesDone + ' shake' + (shakesDone === 1 ? '' : 's') + '!', () => {
      g.renderer.flashA = 0;
      // Break-out mood: it may attack immediately (foe gets a free move)
      this.playerAction = { type: 'ballthrown' };
      this.foeAction = this.chooseFoeAction();
      this.state = 'resolve';
      const mk = (side, action) => {
        const mon = side === 'ally' ? this.ally : this.foe;
        const stages = side === 'ally' ? this.allyStages : this.foeStages;
        const stats = this.effStats(mon, stages);
        let move = null, priority = 0;
        if (action.type === 'move') {
          move = MOVES[mon.moves[action.idx].id];
          priority = move.priority || 0;
        }
        return { side, action, mon, stats, priority, move };
      };
      this.actions = [mk('foe', this.foeAction)];
      this.nextAction();
    });
  }

  winTrainer() {
    const g = this.game;
    const t = this.trainer;
    this.state = 'victory';
    g.state.player.money += t.reward;
    g.state.story.flags['beat_' + t.id] = true;
    // No battle-message here: the capstone dialogue below ends the battle exactly once.
    this.msg = 'You defeated ' + t.title + ' ' + t.name + '! Got $' + t.reward + '.';
    this.msgOpen = false;
    if (t.badge) {
      g.state.badges.kanto.push(t.badge);
      g.audio.playSfx(SFX.fanfare);
      const lines = SLICE_CAPSTONE.map((l) => l.replace('{player}', g.state.player.name));
      g.ui.say(lines, () => this.endBattle(true), '');
    } else {
      g.ui.say(t.lose, () => this.endBattle(true), t.name);
    }
  }

  finishVictory() {
    this.endBattle(true);
  }

  finishDefeat() {
    const g = this.game;
    // Defeat: fade -> Pokemon Center (overworld, healed, money halved) — architecture §2.2
    g.state.player.money = Math.floor(g.state.player.money / 2);
    this.endBattle(false);
    g.ui.say(['You hurried to the Pokemon Center...'], () => {
      const ow = this.returnTo;
      ow.loadMap('center');
      ow.player.tx = 4; ow.player.ty = 3; ow.player.px = 4 * TILE; ow.player.py = 3 * TILE;
      ow.player.fx = 4; ow.player.fy = 3;
      ow.trail = [];
      ow.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 3, dir: 'down' };
      g.ui.toast('Your Pokemon were healed. (Lost half your money.)');
    });
  }

  endBattle(won) {
    const g = this.game;
    g.ui.setBattleMode(false);
    g.renderer.shakeX = 0; g.renderer.shakeY = 0; g.renderer.flashA = 0;
    // Reset battle temp state on party mons
    for (const m of g.state.party) { m.confused = false; m.statusTurns = 0; }
    g.scenes.pop();
    g.autosave('battle');
  }

  drainHp(dt) {
    const rate = HP_DRAIN_PER_SEC * dt;
    let dirty = false;
    if (this.hpAnim.ally !== this.ally.hp) {
      const d = this.ally.hp - this.hpAnim.ally;
      this.hpAnim.ally += Math.sign(d) * Math.min(Math.abs(d), rate);
      if (Math.abs(this.ally.hp - this.hpAnim.ally) < 1) this.hpAnim.ally = this.ally.hp;
      dirty = true;
    }
    if (this.hpAnim.foe !== this.foe.hp) {
      const d = this.foe.hp - this.hpAnim.foe;
      this.hpAnim.foe += Math.sign(d) * Math.min(Math.abs(d), rate);
      if (Math.abs(this.foe.hp - this.hpAnim.foe) < 1) this.hpAnim.foe = this.foe.hp;
      dirty = true;
    }
    void dirty;
  }

  render(r) {
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    // Battle background: banded vertical steps (max 5, gameux §6) per terrain.
    const bands = this.kind === 'trainer'
      ? ['#3a3a4a', '#4a4a5a', '#5a5a6a', '#6a6a7a', '#7a7a8a']
      : ['#2a6a3a', '#3a7a4a', '#4a8a5a', '#5a9a6a', '#6aaa7a'];
    for (let i = 0; i < 5; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / 5, w, h / 5 + 1);
    }
    r.begin();
    // Platforms: enemy upper-left, player lower-right (gameux §4.2)
    const foeSpr = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allySpr = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    const bob = Math.sin(this.t * 0.004) * 2;
    r.blit(foeSpr, w * 0.62, h * 0.12 + bob);
    r.blit(allySpr, w * 0.14, h * 0.52 - bob);
    // Catch ball arc
    if (this.state === 'catchseq' && this.catchState.phase === 'throw') {
      const k = Math.min(1, this.catchState.t / 430);
      const bx = w * 0.2 + (w * 0.5) * k;
      const by = h * 0.6 - Math.sin(k * Math.PI) * h * 0.35;
      g.ctx2dcircle(bx, by, 5, '#e84040');
    }
    if (this.state === 'catchseq' && this.catchState.phase === 'shakes') {
      const wob = Math.sin(this.catchState.t * 0.05) * 3;
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3, 6, '#e8e8f0');
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3 - 2, 6, '#e84040');
    }
    r.end();
    // HP plates (Gen 5 idiom, original art)
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 110, h - 84, this.ally, this.hpAnim.ally, true);
    // Message box
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 40, w - 8, 36, '#f8f8f0', '#202028');
      const txt = this.msg.length > 52 ? this.msg.slice(0, 52) : this.msg;
      r.text(txt, 10, h - 32, { size: 8, color: '#202028', shadow: false });
      if (this.msg.length > 52) r.text(this.msg.slice(52, 104), 10, h - 20, { size: 8, color: '#202028', shadow: false });
    }
    this.t += 16;
  }

  plate(r, x, y, mon, hpShown, isAlly) {
    const g = this.game;
    const sp = SPECIES[mon.speciesId];
    const w = 104, h = isAlly ? 30 : 22;
    r.panel(x, y, w, h, '#f0ead8', '#202028');
    r.text(displayName(mon, SPECIES), x + 4, y + 2, { size: 8, bold: true, color: '#202028', shadow: false });
    r.text('Lv' + mon.level, x + w - 26, y + 2, { size: 8, color: '#202028', shadow: false });
    r.hpBar(x + 4, y + 12, w - 8, 6, hpShown / mon.maxHp, g.state.settings.reducedMotion);
    if (isAlly) {
      r.text(Math.ceil(hpShown) + '/' + mon.maxHp, x + 4, y + 20, { size: 7, color: '#202028', shadow: false });
      if (mon.status) r.text(mon.status.toUpperCase().slice(0, 3), x + w - 24, y + 20, { size: 7, bold: true, color: '#a040a0', shadow: false });
    } else if (mon.status) {
      r.text(mon.status.toUpperCase().slice(0, 3), x + w - 24, y + 12, { size: 7, bold: true, color: '#a040a0', shadow: false });
    }
  }
}


// ---- src/game/overworld.mjs ----
// overworld.mjs — tile-map exploration: interpolated grid movement, tall-grass
// encounters (rustle -> ! -> transition, 900ms per ADR-004), follower partner,
// NPCs, signs, warps, pause menu (Bag/Party/Dex/Save/Options).


const WALK_MS = 200; // ~200ms per walked tile (GD feel note)

class OverworldScene {
  enter() {
    const g = this.game;
    this.mapId = g.state.story.position.map;
    this.loadMap(this.mapId);
    const p = g.state.story.position;
    this.player = { tx: p.x, ty: p.y, px: p.x * TILE, py: p.y * TILE, dir: p.dir || 'down', moving: false, moveT: 0, fx: p.x, fy: p.y };
    this.trail = []; // partner path history
    this.partner = { px: this.player.px, py: this.player.py, hop: 0 };
    this.enc = null; // encounter sequence state
    this.banner = { text: this.map.name.toUpperCase(), t: 0 };
    this.stepsSinceEncounter = 0;
    this.chainCount = 0;
    this.pausedMenu = false;
    g.ui.setBattleMode(false);
  }

  loadMap(id) {
    this.mapId = id;
    this.map = MAPS[id];
    this.w = this.map.rows[0].length;
    this.h = this.map.rows.length;
  }

  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ' ';
    return this.map.rows[y][x];
  }

  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (!WALKABLE.has(t)) return false;
    // NPCs block
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return false;
    return true;
  }

  warpAt(x, y) {
    for (const wp of this.map.warps) if (wp.x === x && wp.y === y) return wp;
    return null;
  }

  npcAt(x, y) {
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return n;
    return null;
  }

  signAt(x, y) {
    for (const s of this.map.signs) if (s.x === x && s.y === y) return s;
    return null;
  }

  update(dt) {
    const g = this.game;
    if (g.ui.update(dt)) return; // modal UI consumes input
    if (this.enc) { this.updateEncounter(dt); return; }

    const input = g.input;
    // Pause menu
    if (input.wasPressed('start') || input.wasPressed('escape')) {
      this.openPauseMenu();
      return;
    }
    // Interact
    if (input.wasPressed('a')) {
      if (this.tryInteract()) return;
    }

    // Movement
    const p = this.player;
    if (!p.moving) {
      const d = input.dir();
      if (d) {
        p.dir = d;
        const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
        const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
        if (this.walkable(p.tx + dx, p.ty + dy)) {
          p.moving = true; p.moveT = 0;
          p.fx = p.tx; p.fy = p.ty;
          p.tx += dx; p.ty += dy;
        }
      }
    } else {
      p.moveT += dt * 1000;
      const k = Math.min(1, p.moveT / WALK_MS);
      p.px = (p.fx + (p.tx - p.fx) * k) * TILE;
      p.py = (p.fy + (p.ty - p.fy) * k) * TILE;
      if (k >= 1) {
        p.moving = false;
        p.px = p.tx * TILE; p.py = p.ty * TILE;
        this.trail.push({ x: p.tx, y: p.ty });
        if (this.trail.length > 24) this.trail.shift();
        this.onStep(p.tx, p.ty);
      }
    }
    // Partner follows 1 tile behind with hop
    const tp = this.trail.length >= 2 ? this.trail[this.trail.length - 2] : { x: p.tx, y: p.ty };
    const tpx = tp.x * TILE, tpy = tp.y * TILE;
    this.partner.px += (tpx - this.partner.px) * Math.min(1, dt * 10);
    this.partner.py += (tpy - this.partner.py) * Math.min(1, dt * 10);
    this.partner.hop += dt * 6;

    // Playtime + banner
    g.state.story.playtimeSec = (g.state.story.playtimeSec || 0);
    this.playAcc = (this.playAcc || 0) + dt;
    if (this.playAcc >= 1) { this.playAcc -= 1; g.state.player.playtimeSec++; }
    if (this.banner.t > 0) this.banner.t -= dt;
  }

  onStep(x, y) {
    const g = this.game;
    const wp = this.warpAt(x, y);
    if (wp) {
      const to = wp.to;
      this.loadMap(to.map);
      this.player.tx = to.x; this.player.ty = to.y;
      this.player.px = to.x * TILE; this.player.py = to.y * TILE;
      this.player.fx = to.x; this.player.fy = to.y;
      this.trail = [];
      this.partner.px = this.player.px; this.partner.py = this.player.py;
      g.state.story.position = { map: to.map, x: to.x, y: to.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.state.meta.location = this.map.name;
      g.autosave('area');
      return;
    }
    // Tall grass encounter check (anti-frustration: force after 20 silent steps)
    const t = this.tileAt(x, y);
    if (t === ',' && this.map.encounters && !g.state.story.flags.noEncounters) {
      this.stepsSinceEncounter++;
      let p = this.map.encounters.rate;
      if (this.stepsSinceEncounter > 20) p = 1;
      if (this.chainCount >= 2) p = 0; // no triple chains
      if (roll(p, g.rng.encounter)) {
        this.startEncounter();
      }
    } else {
      this.stepsSinceEncounter = 0;
    }
  }

  startEncounter() {
    const g = this.game;
    const table = this.map.encounters.table;
    const spId = pickWeighted(table.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = table.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    this.enc = {
      phase: 'rustle', t: 0,
      foe: makeMon(spId, level, SPECIES, MOVES),
    };
    this.stepsSinceEncounter = 0;
    this.chainCount++;
    g.audio.playSfx(SFX.encounter);
  }

  updateEncounter(dt) {
    const g = this.game;
    const e = this.enc;
    e.t += dt * 1000;
    // 3-beat: rustle 200ms -> ! 300ms -> transition 400ms (ADR-004, gameux §6)
    if (e.phase === 'rustle' && e.t >= 200) { e.phase = 'exclaim'; e.t = 0; }
    else if (e.phase === 'exclaim' && e.t >= 300) { e.phase = 'transition'; e.t = 0; g.renderer.flashA = 0.7; }
    else if (e.phase === 'transition' && e.t >= 400) {
      g.renderer.flashA = 0;
      const foe = e.foe;
      this.enc = null;
      dexRegister(g.state.dex, 'seen', SPECIES[foe.speciesId].dexNo);
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this }));
    }
    if (g.renderer.flashA > 0 && e.phase !== 'transition') {
      g.renderer.flashA = Math.max(0, g.renderer.flashA - dt * 3);
    }
  }

  tryInteract() {
    const g = this.game;
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    // Partner interaction (facing Pikachu's tile)
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) {
      const moods = { happy: 'is happy! It nuzzles your hand.', curious: 'tilts its head, curious.', sleepy: 'yawns... maybe it needs a rest soon.' };
      g.ui.toast('Pikachu ' + (moods[g.state.pikachu.mood] || moods.happy));
      return true;
    }
    const npc = this.npcAt(fx, fy);
    if (npc) {
      if (npc.trainer) { this.startTrainerBattle(npc); return true; }
      const lines = npc.dialogue.map((l) => l.replace('{player}', g.state.player.name));
      if (npc.heal) {
        g.ui.say(lines, () => {
          this.healParty(false);
          g.ui.say(npc.afterHeal || ['All better!'], null, npc.name);
        }, npc.name);
      } else {
        g.ui.say(lines, null, npc.name);
      }
      return true;
    }
    const sign = this.signAt(fx, fy);
    if (sign) { g.ui.say([sign.text]); return true; }
    // Also check the tile the player stands on for signs (adjacent readability)
    return false;
  }

  startTrainerBattle(npc) {
    const g = this.game;
    if (g.state.story.flags['beat_' + npc.trainer]) {
      g.ui.say(npc.dialogue.slice(1), null, npc.name);
      return;
    }
    const t = TRAINERS[npc.trainer];
    g.ui.say(t.intro, () => {
      g.scenes.push(new BattleScene({ kind: 'trainer', trainer: t, returnTo: this }));
    }, npc.name);
  }

  healParty(announce) {
    const g = this.game;
    for (const m of g.state.party) {
      m.hp = m.maxHp; m.status = null;
      m.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const mv of m.moves) mv.pp = mv.maxPp;
    }
    g.audio.playSfx(SFX.heal);
    if (announce) g.ui.toast('Your Pokemon were healed to full health!');
  }

  openPauseMenu() {
    const g = this.game;
    g.ui.showMenu('MENU', [
      { label: 'Bag', value: 'bag' },
      { label: 'Party', value: 'party' },
      { label: 'Dex', value: 'dex' },
      { label: 'Save', value: 'save' },
      { label: 'Options', value: 'options' },
      { label: 'Account — coming in Track B', value: 'account', disabled: true },
      { label: 'Close', value: 'close' },
    ], (value) => {
      if (value === 'bag') g.openBag();
      else if (value === 'party') g.openParty();
      else if (value === 'dex') g.openDex();
      else if (value === 'save') g.openSave();
      else if (value === 'options') g.openOptions();
    });
  }

  areaCompletion() {
    const g = this.game;
    if (!this.map.encounters) return null;
    const species = [...new Set(this.map.encounters.table.map((e) => e.species))];
    const caught = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
    return { caught, total: species.length };
  }

  render(r) {
    const g = this.game;
    const T = TILE;
    // Camera centers on player
    r.centerOn(this.player.px + T / 2, this.player.py + T / 2, this.w * T, this.h * T);
    r.begin();
    // Tiles (viewport-culled)
    const vr = r.viewRect();
    const x0 = Math.max(0, Math.floor(vr.x0 / T)), x1 = Math.min(this.w - 1, Math.ceil(vr.x1 / T));
    const y0 = Math.max(0, Math.floor(vr.y0 / T)), y1 = Math.min(this.h - 1, Math.ceil(vr.y1 / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.map.rows[y][x];
        const kind = g.tileKind(ch);
        r.blit(g.tileCache[kind], x * T, y * T);
      }
    }
    // Encounter rustle effect
    if (this.enc && this.enc.phase === 'rustle') {
      const jx = (this.game.rng.misc() - 0.5) * 3;
      r.blit(g.tileCache.grass, this.player.tx * T + jx, this.player.ty * T);
    }
    // NPCs
    for (const n of this.map.npcs) {
      r.blit(g.npcSprite(n), n.x * T, n.y * T - 4);
    }
    // Partner (hop) + player
    const hop = Math.abs(Math.sin(this.partner.hop)) * 3;
    r.blit(g.spriteCache.partner, Math.round(this.partner.px), Math.round(this.partner.py) - Math.round(hop));
    r.blit(g.playerSprite(this.player.dir, this.player.moving), Math.round(this.player.px), Math.round(this.player.py));
    // "!" exclamation
    if (this.enc && this.enc.phase === 'exclaim') {
      r.text('!', this.player.px + 4, this.player.py - 14, { size: 12, bold: true, color: '#e84040' });
    }
    r.end();
    // HUD overlays (canvas)
    if (this.banner.t > 0) {
      r.text(this.banner.text, 8, 8, { size: 10, bold: true, color: '#fff' });
    }
    const comp = this.areaCompletion();
    if (comp) {
      r.text(this.map.name + ' \u00b7 ' + comp.caught + '/' + comp.total + ' caught', 8, r.viewH - 12, { size: 7, color: '#ffe9a8' });
    }
    // Dex caught counter (honest wording)
    r.text('Dex ' + dexCaughtCount(g.state.dex) + '/' + DEX_TOTAL, r.viewW - 78, 8, { size: 7, color: '#fff' });
  }
}


// ---- src/game/main.mjs ----
// main.mjs — Game root: owns loop, renderer, input, audio, UI, scenes, save.
// Scene flow: BOOT (legal card) -> TITLE -> INTRO -> OVERWORLD <-> BATTLE.
// Battle/overworld menus (Bag/Party/Dex/Save/Options) live here as UI states.


function nextSeed() {
  if (typeof globalThis !== 'undefined' && globalThis.__SEED__) return globalThis.__SEED__ >>> 0;
  return (Date.now() ^ (Math.random() * 1e9)) >>> 0;
}

const doc = (typeof document !== 'undefined') ? document : {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0, height: 0, style: {},
        getContext: () => new Proxy({}, {
          get: (t, p) => {
            if (p === 'canvas') return {};
            if (p === 'measureText') return () => ({ width: 10 });
            if (p === 'getImageData') return () => ({ data: [] });
            return () => {};
          },
          set: () => true,
        }),
      };
    }
    return { style: {}, appendChild() {}, addEventListener() {} };
  },
  getElementById: () => null,
  addEventListener() {},
};

class Game {
  constructor(canvas) {
    this.canvas = canvas || doc.createElement('canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new AudioEngine();
    this.ui = new UI(this);
    this.scenes = new SceneStack(this);
    this.loop = new Loop(this);
    this.store = new SaveStore();
    this.state = freshState();
    this.rng = makeRngStreams(nextSeed());
    this.tileCache = buildTileCache(doc);
    this.spriteCache = {};
    this.npcCache = {};
    this.skipIntroVeteran = false;
    this._lastAutosave = 0;
    this.layoutMode = 'portrait';
  }

  tileKind(ch) { return TILE_CHARS[ch] || 'void'; }

  buildSprites() {
    for (const id of Object.keys(SPECIES)) {
      this.spriteCache[id] = forgeSprite(doc, SPECIES[id], 48);
    }
    this.playerSprites = {
      down: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      up: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      left: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      right: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
    };
  }

  playerSprite(dir, moving) { return this.playerSprites[dir] || this.playerSprites.down; }

  npcSprite(npc) {
    if (!this.npcCache[npc.name]) {
      this.npcCache[npc.name] = forgeHumanoid(doc, npc);
    }
    return this.npcCache[npc.name];
  }

  // Canvas 2D helpers used by scenes.
  ctx2dfill(color, x, y, w, h) {
    const c = this.renderer.ctx;
    c.fillStyle = color; c.fillRect(x, y, w, h);
  }
  ctx2drect(x, y, w, h, color) { this.ctx2dfill(color, x, y, w, h); }
  ctx2dcircle(x, y, rad, color) {
    const c = this.renderer.ctx;
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }

  boot() {
    this.ui.init();
    this.input.bindKeyboard();
    this.buildSprites();
    this.applyLayout();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this.applyLayout());
    }
    this.loop.onAutosave = () => this.saveGame(true);
    this.loop.bindVisibility(() => { /* sim halts via rAF freeze; autosave queued above */ });
    this.audio.setMuted(false);
    this.scenes.push(new BootScene());
    this.loop.start();
  }

  applyLayout() {
    const r = this.renderer;
    if (typeof window === 'undefined') {
      r.resize(256, 192, 256, 192);
      this.layoutMode = 'desktop';
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (fine && w >= 700) {
      this.layoutMode = 'desktop';
      r.resize(384, 216, Math.min(1120, w * 0.9), Math.min(630, h * 0.62));
      document.body.classList.add('desktop');
    } else if (w > h) {
      this.layoutMode = 'landscape';
      r.resize(256, 192, w * 0.72, h);
      document.body.classList.remove('desktop');
    } else {
      this.layoutMode = 'portrait';
      r.resize(256, 256, w, h * 0.45);
      document.body.classList.remove('desktop');
    }
    document.body.classList.toggle('flip', !!this.state.settings.controlsFlip);
  }

  update(dt) {
    this.ui.update(dt);
    this.scenes.update(dt);
  }

  render(alpha) {
    this.scenes.render(this.renderer, alpha);
  }

  // ---- game flow ----
  newGame() {
    this.state = freshState();
    this.state.player.name = 'ASH';
    this.rng = makeRngStreams(nextSeed());
    this.skipIntroVeteran = this.store.exists();
    this.scenes.replace(new IntroScene());
  }

  continueGame() {
    const res = this.store.load();
    if (!res.ok) {
      this.ui.toast('Save data invalid (' + res.reason + '). Starting fresh is safest.');
      return;
    }
    this.state = res.data;
    this.audio.setMuted(!!this.state.settings.mute);
    this.scenes.replace(new OverworldScene());
    this.ui.toast('Welcome back, ' + this.state.player.name + '!');
  }

  startOverworld() {
    this.scenes.replace(new OverworldScene());
  }

  saveGame(quiet) {
    const res = this.store.save(this.state);
    if (!quiet || !res.ok) {
      if (res.ok) this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)');
      else this.ui.toast('Save failed: ' + res.reason);
    }
    return res;
  }

  autosave(reason) {
    const now = Date.now();
    if (now - this._lastAutosave < 5000) return; // 5s throttle floor
    this._lastAutosave = now;
    this.saveGame(true);
  }

  // ---- menus (UI states, no scene reload) ----
  openBag() {
    const g = this;
    const items = [];
    for (const pocket of POCKETS) {
      const inPocket = Object.keys(ITEMS).filter((id) => ITEMS[id].pocket === pocket && (g.state.bag[id] || 0) > 0);
      for (const id of inPocket) {
        items.push({ label: ITEMS[id].name + ' x' + g.state.bag[id], value: id });
      }
    }
    if (!items.length) items.push({ label: '(empty)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Bag', items, (v) => {
      if (v === 'potion') {
        const targets = g.state.party.map((m, i) => ({
          label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i,
          disabled: m.hp <= 0 || m.hp >= m.maxHp,
        }));
        targets.push({ label: 'Back', value: -1 });
        g.ui.showMenu('Use Potion on...', targets, (t) => {
          if (t === null || t === -1) { g.openBag(); return; }
          const m = g.state.party[t];
          g.state.bag.potion--;
          m.hp = Math.min(m.maxHp, m.hp + 20);
          g.audio.playSfx(SFX.heal);
          g.ui.toast(displayName(m, SPECIES) + ' recovered 20 HP!');
        });
      }
    });
  }

  openParty() {
    const g = this;
    const items = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + '  ' + m.hp + '/' + m.maxHp, value: i };
    });
    for (let i = g.state.party.length; i < 6; i++) items.push({ label: '—', value: -1, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Party', items, (v) => {
      if (v === null || v === 'close' || v === -1) return;
      const m = g.state.party[v];
      const sp = SPECIES[m.speciesId];
      g.ui.showMenu(displayName(m, SPECIES), [
        { label: 'Summary', value: 'summary' },
        { label: 'Close', value: 'close' },
      ], (a) => {
        if (a === 'summary') {
          const mv = m.moves.map((mm) => MOVES[mm.id].name + ' ' + mm.pp + '/' + mm.maxPp).join(', ');
          g.ui.say([
            displayName(m, SPECIES) + '  Lv' + m.level + '  HP ' + m.hp + '/' + m.maxHp,
            'ATK ' + m.stats.atk + '  DEF ' + m.stats.def + '  SPA ' + m.stats.spa + '  SPD ' + m.stats.spd + '  SPE ' + m.stats.spe,
            'Moves: ' + mv,
            'OT: ' + m.ot + '  No. ' + sp.dexNo,
            sp.flavor,
          ], null, 'Summary');
        }
      });
    });
  }

  openDex() {
    const g = this;
    const caught = dexCaughtCount(g.state.dex);
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner').map((id) => {
      const sp = SPECIES[id];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      const mark = c ? '[CAUGHT]' : (s ? '[SEEN]' : '[???]');
      return { label: 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + mark, value: id };
    });
    items.unshift({ label: 'Caught ' + caught + ' / ' + DEX_TOTAL + ' (tracked)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Pokedex', items, (v) => {
      if (!v || v === 'close') return;
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(); return; }
      g.ui.say([
        'No.' + sp.dexNo + '  ' + sp.name + '  ' + sp.types.join('/'),
        sp.flavor,
        'Status: ' + (c ? 'CAUGHT' : 'SEEN'),
      ], () => g.openDex(), 'Dex');
    });
  }

  openSave() {
    const g = this;
    const caught = dexCaughtCount(g.state.dex);
    const badges = g.state.badges.kanto.length;
    const mins = Math.floor((g.state.player.playtimeSec || 0) / 60);
    const when = g.state.meta.updatedAt ? new Date(g.state.meta.updatedAt).toLocaleString() : 'never';
    g.ui.showMenu('Save', [
      { label: g.state.meta.location + ' · ' + mins + 'm · ' + badges + ' badges · Dex ' + caught, value: null, disabled: true },
      { label: 'Last saved: ' + when, value: null, disabled: true },
      { label: 'Sync: guest-local (Track B: cloud)', value: null, disabled: true },
      { label: 'Save now', value: 'save' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'save') g.saveGame(false);
    });
  }

  openOptions() {
    const g = this;
    const s = g.state.settings;
    const yn = (b) => b ? 'ON' : 'OFF';
    g.ui.showMenu('Options', [
      { label: 'Text speed: ' + s.textSpeed, value: 'text' },
      { label: 'Mute: ' + yn(s.mute), value: 'mute' },
      { label: 'Battle animations: ' + yn(s.battleAnims), value: 'banim' },
      { label: 'Screen shake: ' + yn(s.shake), value: 'shake' },
      { label: 'Reduced motion: ' + yn(s.reducedMotion), value: 'rmotion' },
      { label: 'Flip controls: ' + yn(s.controlsFlip), value: 'flip' },
      { label: 'Legal / credits', value: 'legal' },
      { label: 'Erase save', value: 'erase' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'text') {
        const order = ['slow', 'normal', 'fast', 'instant'];
        s.textSpeed = order[(order.indexOf(s.textSpeed) + 1) % order.length];
      } else if (v === 'mute') { s.mute = !s.mute; g.audio.setMuted(s.mute); }
      else if (v === 'banim') s.battleAnims = !s.battleAnims;
      else if (v === 'shake') s.shake = !s.shake;
      else if (v === 'rmotion') s.reducedMotion = !s.reducedMotion;
      else if (v === 'flip') { s.controlsFlip = !s.controlsFlip; g.applyLayout(); }
      else if (v === 'legal') { g.ui.say(DISCLAIMER_CREDITS, null, ''); return; }
      else if (v === 'erase') {
        g.ui.showMenu('Erase ALL save data?', [
          { label: 'Yes, erase everything', value: 'yes' },
          { label: 'No, keep it', value: 'no' },
        ], (a) => {
          if (a === 'yes') {
            g.ui.showMenu('Really sure? This cannot be undone.', [
              { label: 'Yes, erase', value: 'yes2' },
              { label: 'No', value: 'no' },
            ], (b) => {
              if (b === 'yes2') {
                g.store.erase();
                g.ui.toast('Save data erased.');
              }
            });
          }
        });
        return;
      } else return;
      g.saveGame(true);
      g.openOptions();
    });
  }
}

// Bootstrap (browser). Headless harness imports Game directly.
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');
    const game = new Game(canvas);
    game.boot();
  });
}
