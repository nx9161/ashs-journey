// audio.mjs — WebAudio chiptune engine: note-table player with loop scheduler.
// Contract: docs/contracts.md §2. Score lives in audio/note-tables.mjs
// (import stripped by the zero-dep build; module-order.json pins it first).
// 4-6 channel budget (2 pulse, 1 triangle, 1 noise) enforced by VOICE_BUDGET.
// Music unlocks on first user gesture. Safe no-op when AudioContext is
// unavailable (headless / SSR). Persisted mute + volume via applySettings.
// Every gameplay-critical cue keeps a visual twin (see audio/SCORE.md).

import { MUSIC, SFXSET, CRIES, CRY_ALIASES, deriveCry } from '../../audio/note-tables.mjs';
import { SPECIES } from '../data/species.mjs';

export const CHANNELS = ['pulse1', 'pulse2', 'triangle', 'noise'];
export const VOICE_BUDGET = 6; // hard cap on concurrent live voices (polyphony discipline)
export const SFX_SCALE = 0.06; // SFX beats -> seconds (60ms per beat)
const EPS = 1e-6; // sub-audible simultaneity epsilon for voice-overlap math

const PITCH_RE = /^([A-G][#b]?)(\d)$/;
const NAMES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export function freqOf(pitch) {
  // Scientific pitch notation -> Hz. A4 = 440.
  const m = PITCH_RE.exec(pitch);
  if (!m) return 440;
  const midi = ((parseInt(m[2], 10) + 1) * 12) + NAMES[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const MUSIC_TRACKS = MUSIC;
export const CRY_TABLE = CRIES;

// ---- cry resolution (W12-T1, plan §3.2) ----
// SPECIES is the base roster object; src/data/merge.mjs folds every
// expansion roster into that same object at load, so by cry time this
// binding sees all 509 records. Evo stage = evo-graph chain depth (0/1/2),
// computed lazily, rebuilt if the roster size changes (late test folds).
let _cryStageCache = null;
let _cryStageSize = -1;
function cryStageOf(id) {
  const size = Object.keys(SPECIES).length;
  if (!_cryStageCache || _cryStageSize !== size) {
    const depth = {};
    for (const k of Object.keys(SPECIES)) depth[k] = 0;
    let changed = true;
    while (changed) {
      changed = false;
      for (const [k, sp] of Object.entries(SPECIES)) {
        const to = sp.evo && sp.evo.to;
        if (to && depth[to] !== undefined && depth[to] < depth[k] + 1) { depth[to] = depth[k] + 1; changed = true; }
      }
    }
    _cryStageCache = depth;
    _cryStageSize = size;
  }
  return _cryStageCache[id] || 0;
}

// Resolution order (Director Rulings 3 + 4): authored CRIES always win;
// then the alias map (partner -> the authored VOLTIK cry); then formes
// resolve to their base record (which may itself be authored); then the
// deterministic derivation. Returns undefined for unknown ids — playCry's
// legacy fallback is the safety net for those, and for those only.
export function resolveCry(speciesId) {
  if (CRIES[speciesId]) return CRIES[speciesId];
  const alias = CRY_ALIASES[speciesId];
  if (alias && CRIES[alias]) return CRIES[alias];
  let rec = SPECIES[speciesId];
  if (!rec) return undefined;
  if (rec.form && rec.baseSpecies) rec = SPECIES[rec.baseSpecies] || rec;
  if (CRIES[rec.id]) return CRIES[rec.id];
  return deriveCry(rec, cryStageOf(rec.id));
}
// Legacy key compatibility for existing call sites: blip/tick/back/fanfare/heal/
// error/throw_/rattle/click/dex/lowhp/encounter all exist in SFXSET.
export const SFX = SFXSET;

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;   // mute switch
    this.musicBus = null; // music volume
    this.sfxBus = null;   // sfx volume
    this.muted = false;
    this.musicVol = 0.8;
    this.sfxVol = 0.8;
    this.reducedMotion = false;
    this._unlocked = false;
    this._musicId = null;      // currently playing music track
    this._areaMusicId = null;  // last non-battle track (restore target)
    this._schedTimer = null;
    this._noiseBuf = null;
    this._pulseWaves = {};
    // Polyphony discipline: track scheduled voices as [start, stop) windows;
    // the cap applies to voices *sounding together*, not to the whole
    // look-ahead queue (a scheduled loop holds dozens of future notes).
    this._live = [];
  }

  // Call from the first user gesture (A press / tap). AC may be injected
  // (tests) — otherwise resolves the browser's AudioContext.
  unlock(AC) {
    if (this._unlocked) { this.resume(); return; }
    const Ctor = AC || (typeof AudioContext !== 'undefined' ? AudioContext
      : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null));
    if (!Ctor) return; // headless: stay silent, never throw
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVol;
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVol;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this._unlocked = true;
      // Suspended-context recovery (audit U4): iOS interruptions and tab
      // backgrounding can park the context at 'suspended' while the game
      // keeps running — resume when the tab becomes visible again.
      if (typeof document !== 'undefined' && document.addEventListener && !this._visHook) {
        this._visHook = true;
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.resume(); });
      }
      // If a track was requested before unlock (e.g. title theme queued at
      // boot), start it now that the gesture arrived. _musicId is cleared
      // first so the same-id no-op guard doesn't swallow the replay.
      if (this._pendingMusic) { const id = this._pendingMusic; this._pendingMusic = null; this._musicId = null; this.playMusic(id); }
    } catch (e) { /* audio unavailable: silent mode */ }
  }

  // Resume a context parked at 'suspended' (audit U4). Called on gesture
  // return (unlock re-entry), on visibility return, and by the music
  // scheduler, which keeps firing on timers even while suspended.
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        const p = this.ctx.resume();
        if (p && p.catch) p.catch(() => { /* still suspended: a later path retries */ });
      } catch (e) { /* stay silent */ }
    }
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  setMusicVolume(v) {
    this.musicVol = Math.min(1, Math.max(0, +v || 0));
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
  }

  setSfxVolume(v) {
    this.sfxVol = Math.min(1, Math.max(0, +v || 0));
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  setReducedMotion(b) {
    this.reducedMotion = !!b;
  }

  // Persisted settings object from game state: { mute, musicVol, sfxVol, reducedMotion }.
  applySettings(s) {
    if (!s) return;
    this.setMuted(!!s.mute);
    if (typeof s.musicVol === 'number') this.setMusicVolume(s.musicVol);
    if (typeof s.sfxVol === 'number') this.setSfxVolume(s.sfxVol);
    this.setReducedMotion(!!s.reducedMotion);
  }

  // ---- music ----
  _tableBeats(table) {
    let end = 0;
    for (const tr of table.tracks || []) {
      for (const [beat, , beats] of tr.notes) end = Math.max(end, beat + beats);
    }
    return end;
  }

  // id: key in MUSIC. opts.area=false for battle music (not a restore target).
  // No-op when the same track is already playing (no restart churn on warps).
  playMusic(id, opts) {
    if (!id || !MUSIC[id]) return;
    const area = !opts || opts.area !== false;
    if (this._musicId === id) { if (area) this._areaMusicId = id; return; }
    this._musicId = id;
    if (area) this._areaMusicId = id;
    if (!this._unlocked || !this.ctx) { this._pendingMusic = id; return; }
    this._clearSched();
    const table = MUSIC[id];
    const spb = 60 / (table.bpm || 120);
    const loopLen = Math.max(0.25, this._tableBeats(table) * spb);
    let nextStart = this.ctx.currentTime + 0.06;
    const scheduleLoop = () => {
      if (this.ctx.state === 'suspended') this.resume(); // audit U4: self-heal after interruptions
      const t0 = nextStart;
      try {
        for (const tr of table.tracks) {
          for (const [beat, pitch, beats] of tr.notes) {
            this._schedule(tr, pitch, t0 + beat * spb, beats * spb, tr.vol || 0.5, this.musicBus);
          }
        }
      } catch (e) { /* never let audio break the game */ }
      nextStart = t0 + loopLen;
      this._schedTimer = setTimeout(scheduleLoop, Math.max(0, (nextStart - this.ctx.currentTime - 0.25) * 1000));
    };
    scheduleLoop();
  }

  stopMusic() {
    this._clearSched();
    this._musicId = null;
  }

  restoreAreaMusic() {
    if (this._areaMusicId) this.playMusic(this._areaMusicId);
  }

  _clearSched() {
    if (this._schedTimer) { clearTimeout(this._schedTimer); this._schedTimer = null; }
  }

  // ---- SFX ----
  // key: SFXSET key (e.g. 'ui-blip') or a raw table { wave, duty, vol, env, notes }.
  playSfx(key) {
    if (!this._unlocked || !this.ctx || this.muted) return;
    const table = typeof key === 'string' ? SFXSET[key] : key;
    if (!table) return;
    const t = this.ctx.currentTime;
    const tr = table.track || table;
    try {
      for (const [beat, pitch, beats] of (tr.notes || [])) {
        this._schedule(
          { wave: tr.wave || 'pulse', duty: tr.duty || 0.5, env: tr.env },
          pitch, t + beat * SFX_SCALE, beats * SFX_SCALE, tr.vol || 0.5, this.sfxBus,
        );
      }
    } catch (e) { /* never let audio break the game */ }
  }

  // Convenience pairs (visual twins live in the scenes; see audio/SCORE.md).
  encounter() { this.playSfx('encounter-sting'); this.playSfx('encounter-sting-melody'); }
  transition() { this.playSfx(this.reducedMotion ? 'transition-fade' : 'transition-whoosh'); }
  playCry(speciesId) {
    // W12-T1: every roster species resolves via resolveCry (authored ->
    // alias -> forme-base -> derived). The table below is now only a
    // defensive default for ids outside the roster (e.g. 'missingno').
    const cry = resolveCry(speciesId);
    this.playSfx(cry || { wave: 'pulse', duty: 0.25, vol: 0.35, env: [0.004, 0.15], notes: [[0, 'E5', 1], [1, 'C5', 1]] });
  }
  // Battle impact theater: sound picks the effectiveness tier.
  hitFeedback(eff) {
    if (eff > 1) { this.playSfx('battle-super-boom'); this.playSfx('battle-super'); }
    else if (eff < 1) { this.playSfx('battle-hit'); this.playSfx('battle-noteff'); }
    else { this.playSfx('battle-hit'); this.playSfx('battle-hit-tone'); }
  }
  catchBreakout() { this.playSfx('catch-breakout'); this.playSfx('catch-breakout-tone'); }

  // ---- voice synthesis ----
  _schedule(tr, pitch, t, dur, vol, bus) {
    if (!this.ctx || !bus) return;
    if (!this._voiceSlot(t, dur)) return; // polyphony discipline: 4-6 channels
    const g = this.ctx.createGain();
    const env = tr.env; // [attack, decay] seconds; peak = vol
    try {
      if (tr.wave === 'noise') {
        const src = this.ctx.createBufferSource();
        src.buffer = this._noiseBuffer();
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 1000;
        this._applyEnv(g.gain, t, vol, dur, env);
        src.connect(f); f.connect(g); g.connect(bus);
        this._voiceStart(src, t, Math.max(dur, env ? env[0] + env[1] : dur));
      } else {
        const o = this.ctx.createOscillator();
        if (tr.wave === 'triangle') { o.type = 'triangle'; }
        else { o.setPeriodicWave(this._pulseWave(tr.duty || 0.5)); }
        if (pitch) o.frequency.value = freqOf(pitch);
        this._applyEnv(g.gain, t, vol, dur, env);
        o.connect(g); g.connect(bus);
        this._voiceStart(o, t, Math.max(dur, env ? env[0] + env[1] : dur));
      }
    } catch (e) { /* never let audio break the game */ }
  }

  _applyEnv(param, t, vol, dur, env) {
    if (env && env.length === 2) {
      param.setValueAtTime(0.0001, t);
      param.linearRampToValueAtTime(Math.max(0.0001, vol), t + env[0]);
      param.exponentialRampToValueAtTime(0.0001, t + env[0] + env[1]);
    } else {
      param.setValueAtTime(vol, t);
      param.exponentialRampToValueAtTime(0.0001, t + dur);
    }
  }

  // True when a new voice [t, t+dur) can start without exceeding the budget.
  // Measures *simultaneous* voices: the sweep checks every instant where the
  // overlap count can change (the new note's start + each existing note's
  // start inside its span) — the same event-sweep the verify-audio audit uses.
  // EPS: note times are absolute AudioContext seconds (large magnitudes), so
  // float association noise can leave a 1-ulp phantom "overlap" between a
  // voice that just ended and one starting now. 1µs is far below audibility.
  _voiceSlot(t, dur) {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this._live = this._live.filter((v) => v.stop > now);
    const instants = [t];
    for (const v of this._live) if (v.start > t + EPS && v.start < t + dur) instants.push(v.start);
    for (const s of instants) {
      let n = 0;
      for (const v of this._live) if (v.start <= s + EPS && v.stop > s + EPS) n++;
      if (n >= VOICE_BUDGET) return false;
    }
    return true;
  }

  _voiceStart(node, t, stopDur) {
    // Budget window ends at stopDur (the +0.03 below is sub-audible scheduling
    // slack, excluded so the budget audit and the engine agree).
    this._live.push({ start: t, stop: t + stopDur });
    node.onended = () => { /* window-pruned in _voiceSlot; kept for debuggers */ };
    node.start(t);
    node.stop(t + stopDur + 0.03);
  }

  // Duty-cycle pulse timbres (0.125 / 0.25 / 0.5) via PeriodicWave.
  _pulseWave(duty) {
    const key = String(duty);
    if (!this._pulseWaves[key]) {
      const N = 24;
      const real = new Float32Array(N);
      const imag = new Float32Array(N);
      real[0] = 2 * duty - 1;
      for (let k = 1; k < N; k++) {
        imag[k] = (k % 2 === 1) ? (4 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) : 0;
      }
      this._pulseWaves[key] = this.ctx.createPeriodicWave(real, imag, { disableNormalization: true });
    }
    return this._pulseWaves[key];
  }

  _noiseBuffer() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  }
}
