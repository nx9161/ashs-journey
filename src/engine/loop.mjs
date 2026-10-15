// loop.mjs — fixed-timestep 30 Hz sim + interpolated rAF render (architecture §2.1).
// Sim tick 30 Hz. Render every rAF with accumulator alpha. Max 5 catch-up steps
// (spiral-of-death guard). Input sampled per rAF, applied at next tick.
// visibilitychange -> sim halts + autosave hook (dossier).

export const SIM_HZ = 30;
export const SIM_DT = 1 / SIM_HZ;
export const MAX_CATCHUP = 5;

export class Loop {
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
