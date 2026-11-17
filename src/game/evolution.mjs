// evolution.mjs — the Evolution Ceremony: a dedicated full-screen scene
// for the transformation ritual (Evolution Cutscene wave, 2026-11-17).
//
// Design (SPEC: ~/workspace/your_files/evolution-cutscene/SPEC.md):
// a duration-stepped timeline (TweenJS-style steps/actions, MIT-technique
// research — no code taken): letterbox bars in → the opening line held as
// a beat → the transformation (accelerating old/new alternation, a glow
// silhouette phase, a white-hold at the peak during which the data swap
// lands) → reveal settle → the congratulations line → bars out, control
// returned to exactly the scene that was suspended.
//
// Timing is accumulated sim dt (the F6 real-clock law — never a
// render counter, never setTimeout). Sprites are the shipped 64x64
// battle fronts at integer 2x. Silhouette frames are pre-baked once per
// ceremony from the authored white variants (Canvas source-in tint) —
// no per-frame filters, no shadowBlur (renderer hot-path rules).
//
// Cancel: B (or the on-screen STOP plate on touch) during the
// transformation aborts before the swap — species unchanged, and a
// stone spent to start the ceremony is refunded by evolveMon's caller
// contract (the scene reports the cancel through onDone(false)).

const BAR_H = 26;            // letterbox bar height (logical px)
const BAR_MS = 350;          // bars in/out duration
const TRANSFORM_MS = 3000;   // full transformation, standard motion
const TRANSFORM_MS_RM = 900; // reduced motion: a plain crossfade
const REVEAL_MS = 850;       // new-form settle after the swap
const OUTRO_MS = 260;

// Deterministic starfield (seeded by the species pair — no Math.random,
// so headless drives and replays see the identical sky every time).
function starfield(seedStr, w, h) {
  let s = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { s ^= seedStr.charCodeAt(i); s = Math.imul(s, 16777619); }
  const pts = [];
  for (let i = 0; i < 46; i++) {
    s = Math.imul(s ^ (s >>> 15), 2246822519); s = Math.imul(s ^ (s >>> 13), 3266489917); s ^= s >>> 16;
    const x = (s >>> 0) % w;
    s = Math.imul(s ^ (s >>> 15), 2246822519); s = Math.imul(s ^ (s >>> 13), 3266489917); s ^= s >>> 16;
    const y = (s >>> 0) % h;
    pts.push({ x, y, tw: i % 3 });
  }
  return pts;
}

// Tint a white-silhouette canvas to a flat colour (source-in). Returns
// null when the platform cannot rasterize (headless stubs) — callers
// fall back to the white silhouette itself.
function tinted(doc, whiteCv, color) {
  try {
    const cv = doc.createElement('canvas');
    cv.width = whiteCv.width; cv.height = whiteCv.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(whiteCv, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, cv.width, cv.height);
    return cv;
  } catch (e) { return null; }
}

// ---------------------------------------------------------------------
// HatchScene — the Egg Hatch ceremony (same wave): the step-tick hatch
// in overworld-systems used to resolve as two say() lines (and the
// CLIONARCH blue Egg as a bare toast at the completion sweep). The data
// layer (johtoStepTick/hatchMon) is untouched — the mon is already
// hatched when this scene is pushed; the scene is presentation only,
// the W10 parity contract. The Egg itself is an original pixel pattern
// authored here (no egg sprite exists in the shipped art): shell, shade
// and spots in 4 flat colours, cracks revealed in three stages.
// ---------------------------------------------------------------------

const EGG_ROWS = [
  '......OOOOOO........',
  '....OOSSSSSSOO......',
  '...OSSSSSSSSSSO.....',
  '..OSSSSSSSSSSSSO....',
  '..OSSSPPSSSSSSSO....',
  '.OSSSSSSSSSSSSSSO...',
  '.OSSSSSSSSPPSSSSO...',
  '.OSSSSSSSSSSSSSSO...',
  '.OSSSSSSSSSSSSSSO...',
  '.OSSSPPSSSSSSSSSO...',
  '.OSSSSSSSSSSSSSSO...',
  '.OSSSSSSSSSSSSsSO...',
  '.OSSSSSSSSSSSSsSO...',
  '.OSSSPPSSSSSSssSO...',
  '..OSSSSSSSSSsssO....',
  '..OSSSSSSSSSssO.....',
  '...OSSSSSSSsSO......',
  '....OOSSSSOO........',
  '......OOOOOO........',
];
const EGG_PAL = { O: '#2a2438', S: '#f2e8d5', s: '#d9c9a8', P: '#57b8a2' };
// Crack pixels (x,y in egg-grid units), revealed in three chunks.
const EGG_CRACKS = [
  [[4, 9], [5, 9], [6, 10], [7, 9], [8, 9], [9, 10]],
  [[10, 9], [11, 9], [12, 10], [13, 9], [14, 9], [7, 11], [8, 12]],
  [[15, 9], [16, 10], [11, 11], [12, 12], [6, 12], [5, 13], [13, 13], [10, 13]],
];
const CRACK_MS = 2400;
const CRACK_MS_RM = 800;

export class HatchScene {
  // opts: { mon, name, onDone } — mon is ALREADY hatched (data layer
  // owns the mutation); name is its display name for the reveal line.
  constructor(opts) {
    this.mon = opts.mon;
    this.name = opts.name;
    this.onDone = opts.onDone || null;
    this.phase = 'intro'; // intro → crack → reveal → line2 → outro
    this.t = 0;
    this.barK = 0;
    this.done = false;
    this.stars = starfield('egg>' + this.mon.speciesId, 256, 256);
    this._glow = null;
  }

  enter() {
    const g = this.game;
    const doc = typeof document !== 'undefined' ? document : null;
    const art = g.spriteCache && g.spriteCache[this.mon.speciesId];
    if (doc && art && art.frontWhite) this._glow = tinted(doc, art.frontWhite, '#7a5cff');
    g.ui.say(['Oh? The Egg is hatching!'], () => {
      if (this.phase === 'intro') { this.phase = 'crack'; this.t = 0; }
    });
  }

  _outro() {
    if (this.phase === 'outro') return;
    this.phase = 'outro';
    this.t = 0;
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    this.game.scenes.pop();
    if (this.onDone) this.onDone();
  }

  handleTap() { return false; } // taps fall through to dialogue advance

  update(dt) {
    const g = this.game;
    const ms = dt * 1000;
    this.t += ms;
    const target = this.phase === 'outro' ? 0 : 1;
    const step = ms / BAR_MS;
    this.barK = target > this.barK ? Math.min(1, this.barK + step) : Math.max(0, this.barK - step);
    if (this.phase === 'crack') {
      const dur = g.state.settings.reducedMotion ? CRACK_MS_RM : CRACK_MS;
      if (this.t >= dur) { this.phase = 'reveal'; this.t = 0; if (g.audio && g.audio.playCry) g.audio.playCry(this.mon.speciesId); }
    } else if (this.phase === 'reveal') {
      if (this.t >= REVEAL_MS) {
        this.phase = 'line2';
        g.ui.say([this.name + ' hatched from the Egg!'], () => this._outro());
      }
    } else if (this.phase === 'outro') {
      if (this.t >= OUTRO_MS) this._finish();
    }
  }

  render(r) {
    const g = this.game;
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    const w = r.viewW, h = r.viewH;
    const cx = w / 2;
    const reduced = g.state.settings.reducedMotion;
    const bands = ['#0b0b18', '#101024', '#16162e', '#101024', '#0b0b18'];
    for (let i = 0; i < bands.length; i++) g.ctx2dfill(bands[i], 0, Math.floor((h * i) / bands.length), w, Math.ceil(h / bands.length) + 1);
    for (const s of this.stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin((this.t + s.tw * 400) / 700));
      r.ctx.globalAlpha = tw * 0.8;
      g.ctx2dfill('#e8ecff', s.x, s.y, 1, 1);
    }
    r.ctx.globalAlpha = 1;
    const baseY = 168;
    // Platform disc.
    r.ctx.globalAlpha = 0.5;
    g.ctx2dfill('#23233f', cx - 52, baseY - 4, 104, 8);
    r.ctx.globalAlpha = 1;
    g.ctx2dfill('#2e2e4f', cx - 44, baseY - 2, 88, 3);

    if (this.phase === 'reveal' || this.phase === 'line2' || this.phase === 'outro') {
      const art = g.spriteCache[this.mon.speciesId];
      const size = 128;
      if (this._glow) {
        r.ctx.globalAlpha = this.phase === 'reveal' ? 0.3 : 0.16;
        const gs = size * 1.18;
        r.blitS(this._glow, cx - gs / 2, baseY - gs, gs, gs);
        r.ctx.globalAlpha = 1;
      }
      if (art) r.blitS(art.front, cx - size / 2, baseY - size, size, size);
      if (this.phase === 'reveal' && !reduced) {
        const p = Math.min(1, this.t / REVEAL_MS);
        r.ctx.globalAlpha = 1 - p;
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          const rad = 26 + 44 * p;
          g.ctx2dfill('#ffe9a8', Math.round(cx + Math.cos(ang) * rad), Math.round(baseY - 56 + Math.sin(ang) * rad * 0.7), 2, 2);
        }
        r.ctx.globalAlpha = 1;
      }
    } else {
      // The Egg: wiggle grows with crack progress; cracks land in stages.
      const dur = reduced ? CRACK_MS_RM : CRACK_MS;
      const p = this.phase === 'crack' ? Math.min(1, this.t / dur) : 0;
      const shake = reduced ? 0 : Math.round(Math.sin(this.t / 90) * (1 + 3 * p) * (this.phase === 'crack' ? 1 : 0.3));
      const cell = 5, ew = 20 * cell, eh = EGG_ROWS.length * cell;
      const ex = cx - ew / 2 + shake, ey = baseY - eh;
      // Glow builds behind the shell as hatching nears.
      if (p > 0.35) {
        r.ctx.globalAlpha = 0.25 * p;
        g.ctx2dfill('#8a7cff', ex + 10, ey + 14, ew - 20, eh - 24);
        r.ctx.globalAlpha = 1;
      }
      for (let y = 0; y < EGG_ROWS.length; y++) {
        const row = EGG_ROWS[y];
        for (let x = 0; x < row.length; x++) {
          const c = EGG_PAL[row[x]];
          if (c) g.ctx2dfill(c, ex + x * cell, ey + y * cell, cell, cell);
        }
      }
      const stages = p < 0.34 ? 0 : p < 0.67 ? 1 : p < 0.97 ? 2 : 3;
      for (let sIdx = 0; sIdx < stages; sIdx++) {
        for (const [px, py] of EGG_CRACKS[sIdx]) g.ctx2dfill('#2a2438', ex + px * cell, ey + py * cell, cell, cell);
      }
      if (this.phase === 'crack' && p >= 0.97) { // the burst beat
        r.ctx.globalAlpha = (p - 0.97) / 0.03 * 0.85;
        g.ctx2dfill('#ffffff', 0, 0, w, h);
        r.ctx.globalAlpha = 1;
      }
    }

    const barH = Math.round(BAR_H * this.barK);
    if (barH > 0) {
      g.ctx2dfill('#000000', 0, 0, w, barH);
      g.ctx2dfill('#000000', 0, h - barH, w, barH);
    }
    r.end();
    r.camX = pcx; r.camY = pcy;
  }
}

export class EvolutionScene {
  // opts: { mon, fromId, toId, fromName, oldName, newName, apply, onDone }
  // apply() performs the data swap (species/stats/dex) — called exactly
  // once, at the white-hold peak, and never on a cancel.
  constructor(opts) {
    this.mon = opts.mon;
    this.fromId = opts.fromId;
    this.toId = opts.toId;
    this.fromName = opts.fromName;
    this.oldName = opts.oldName;
    this.newName = opts.newName;
    this.applyFn = opts.apply;
    this.onDone = opts.onDone || null;
    this.phase = 'intro'; // intro → transform → reveal → line2 → outro
    this.t = 0;           // ms inside the current phase
    this.barK = 0;        // letterbox 0..1
    this.applied = false;
    this.cancelled = false;
    this.done = false;
    this.stars = starfield(this.fromId + '>' + this.toId, 256, 256);
    this._silOld = null; this._silNew = null; this._glowNew = null;
    this._cancelRect = null;
  }

  enter() {
    const g = this.game;
    const doc = typeof document !== 'undefined' ? document : null;
    const aOld = g.spriteCache && g.spriteCache[this.fromId];
    const aNew = g.spriteCache && g.spriteCache[this.toId];
    if (doc && aOld && aNew) {
      if (aOld.frontWhite) this._silOld = tinted(doc, aOld.frontWhite, '#cfd8ff');
      if (aNew.frontWhite) {
        this._silNew = tinted(doc, aNew.frontWhite, '#cfd8ff');
        this._glowNew = tinted(doc, aNew.frontWhite, '#7a5cff');
      }
    }
    g.ui.say(['What? ' + this.fromName + ' is evolving!'], () => {
      if (this.phase === 'intro') { this.phase = 'transform'; this.t = 0; }
    });
  }

  _cancel() {
    if (this.phase !== 'transform' || this.cancelled) return;
    this.cancelled = true;
    this.phase = 'lineX';
    const g = this.game;
    g.ui.say(['Huh? ' + this.fromName + ' stopped evolving!'], () => this._outro());
  }

  _outro() {
    if (this.phase === 'outro') return;
    this.phase = 'outro';
    this.t = 0;
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    const g = this.game;
    g.scenes.pop();
    if (this.onDone) this.onDone(!this.cancelled);
  }

  handleTap(vx, vy) {
    if (this.phase === 'transform' && this._cancelRect) {
      const r = this._cancelRect;
      if (vx >= r.x && vx <= r.x + r.w && vy >= r.y && vy <= r.y + r.h) {
        this._cancel();
        return true;
      }
    }
    return false; // every other tap falls through to the dialogue advance
  }

  update(dt) {
    const g = this.game;
    const ms = dt * 1000;
    this.t += ms;
    // Letterbox: in during intro/transform, held, out during outro.
    const target = this.phase === 'outro' ? 0 : 1;
    const step = ms / BAR_MS;
    this.barK = target > this.barK ? Math.min(1, this.barK + step) : Math.max(0, this.barK - step);

    if (this.phase === 'transform') {
      if (g.input.wasPressed('b')) { this._cancel(); return; }
      const dur = g.state.settings.reducedMotion ? TRANSFORM_MS_RM : TRANSFORM_MS;
      if (this.t >= dur) {
        // The white-hold peak: the one moment the data swap lands.
        if (!this.applied) {
          this.applied = true;
          this.applyFn();
          if (g.audio && g.audio.playCry) g.audio.playCry(this.toId);
        }
        this.phase = 'reveal';
        this.t = 0;
      }
    } else if (this.phase === 'reveal') {
      if (this.t >= REVEAL_MS) {
        this.phase = 'line2';
        g.ui.say(['Congratulations! Your ' + this.oldName + ' evolved into ' + this.newName + '!'], () => this._outro());
      }
    } else if (this.phase === 'outro') {
      if (this.t >= OUTRO_MS) this._finish();
    }
  }

  // Which form shows at transform time t (and in what finish):
  // 0–40% plain alternation, accelerating; 40–80% glow silhouettes;
  // 80–100% the new form's silhouette brightening to white.
  _transformFrame(dur) {
    const p = Math.min(1, this.t / dur);
    const aOld = this.game.spriteCache[this.fromId];
    const aNew = this.game.spriteCache[this.toId];
    if (p < 0.4) {
      const interval = 240 - 130 * (p / 0.4); // 240ms → 110ms
      const odd = Math.floor(this.t / interval) % 2 === 1;
      return { spr: odd ? aNew.front : aOld.front, glow: 0.25 + 0.35 * p };
    }
    if (p < 0.8) {
      const interval = 110 - 60 * ((p - 0.4) / 0.4); // 110ms → 50ms
      const odd = Math.floor(this.t / interval) % 2 === 1;
      const spr = odd ? (this._silNew || aNew.frontWhite || aNew.front) : (this._silOld || aOld.frontWhite || aOld.front);
      return { spr, glow: 0.6 + 0.4 * ((p - 0.4) / 0.4) };
    }
    return { spr: this._silNew || aNew.frontWhite || aNew.front, glow: 1, white: (p - 0.8) / 0.2 };
  }

  render(r) {
    const g = this.game;
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    const w = r.viewW, h = r.viewH;
    const cx = w / 2;
    const reduced = g.state.settings.reducedMotion;

    // Backdrop: deep ceremony navy in flat bands (no gradients).
    const bands = ['#0b0b18', '#101024', '#16162e', '#101024', '#0b0b18'];
    for (let i = 0; i < bands.length; i++) g.ctx2dfill(bands[i], 0, Math.floor((h * i) / bands.length), w, Math.ceil(h / bands.length) + 1);
    // Stars.
    for (const s of this.stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin((this.t + s.tw * 400) / 700));
      r.ctx.globalAlpha = tw * (this.phase === 'transform' ? 1 : 0.7);
      g.ctx2dfill('#e8ecff', s.x, s.y, 1, 1);
    }
    r.ctx.globalAlpha = 1;

    const aOld = g.spriteCache[this.fromId];
    const aNew = g.spriteCache[this.toId];
    const baseY = 168; // sprite baseline (logical px)
    const size = 128;  // 64px authored art at integer 2x

    let spr = aOld.front, glowK = 0.3, scaleK = 1, alphaOld = 0;
    if (this.phase === 'transform') {
      const dur = reduced ? TRANSFORM_MS_RM : TRANSFORM_MS;
      if (reduced) {
        // Reduced motion: no flashing — a calm crossfade, old under new.
        const p = Math.min(1, this.t / dur);
        spr = aOld.front; alphaOld = 1; glowK = 0.3 + 0.5 * p;
        this._xfNew = p;
      } else {
        const f = this._transformFrame(dur);
        spr = f.spr; glowK = f.glow;
        if (f.white) { // peak: white silhouette pulses over the glow
          this._whiteK = f.white;
        } else this._whiteK = 0;
      }
    } else if (this.phase === 'reveal' || this.phase === 'line2' || this.phase === 'outro') {
      this._whiteK = 0;
      spr = aNew.front;
      glowK = this.phase === 'reveal' ? 0.9 : 0.45;
      if (this.phase === 'reveal') scaleK = 1.07 - 0.07 * Math.min(1, this.t / REVEAL_MS); // settle
    }

    // Glow halo (pre-baked coloured silhouette, drawn large + faded).
    const glowSpr = this._glowNew || (aNew && aNew.frontWhite);
    if (glowSpr && glowK > 0) {
      r.ctx.globalAlpha = 0.35 * glowK;
      const gs = size * 1.18;
      r.blitS(glowSpr, cx - gs / 2, baseY - gs, gs, gs);
      r.ctx.globalAlpha = 1;
    }
    // Platform disc.
    r.ctx.globalAlpha = 0.5;
    g.ctx2dfill('#23233f', cx - 52, baseY - 4, 104, 8);
    r.ctx.globalAlpha = 1;
    g.ctx2dfill('#2e2e4f', cx - 44, baseY - 2, 88, 3);

    // The form itself.
    const ds = Math.round(size * scaleK);
    if (this.phase === 'transform' && reduced) {
      r.blitS(aOld.front, cx - size / 2, baseY - size, size, size);
      r.ctx.globalAlpha = this._xfNew || 0;
      r.blitS(aNew.front, cx - size / 2, baseY - size, size, size);
      r.ctx.globalAlpha = 1;
    } else {
      r.blitS(spr, cx - ds / 2, baseY - ds, ds, ds);
      if (this.phase === 'transform' && this._whiteK && aNew.frontWhite) {
        r.ctx.globalAlpha = this._whiteK;
        r.blitS(aNew.frontWhite, cx - ds / 2, baseY - ds, ds, ds);
        r.ctx.globalAlpha = 1;
      }
    }

    // Reveal sparkles (deterministic ring, expanding + fading).
    if (this.phase === 'reveal' && !reduced) {
      const p = Math.min(1, this.t / REVEAL_MS);
      r.ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const rad = 26 + 44 * p;
        const sx = Math.round(cx + Math.cos(ang) * rad), sy = Math.round(baseY - 56 + Math.sin(ang) * rad * 0.7);
        g.ctx2dfill('#ffe9a8', sx, sy, 2, 2);
      }
      r.ctx.globalAlpha = 1;
    }

    // Letterbox bars.
    const barH = Math.round(BAR_H * this.barK);
    if (barH > 0) {
      g.ctx2dfill('#000000', 0, 0, w, barH);
      g.ctx2dfill('#000000', 0, h - barH, w, barH);
    }

    // Touch cancel affordance (transform phase only).
    this._cancelRect = null;
    if (this.phase === 'transform') {
      const bw = 74, bh = 18, bx = w - bw - 8, by = h - barH - bh - 6;
      r.panel(bx, by, bw, bh, '#1a1a2e');
      r.text('✕ STOP', bx + bw / 2, by + 4, { size: 10, bold: true, align: 'center', color: '#ffd7d7' });
      this._cancelRect = { x: bx, y: by, w: bw, h: bh };
      r.text('B: stop evolution', 8, h - barH - 16, { size: 8, color: '#9aa3c7' });
    }

    r.end();
    r.camX = pcx; r.camY = pcy;
  }
}
