// audio.mjs — WebAudio chiptune engine (stub + note-table player).
// Contract: docs/contracts.md §2. Voice Designer fills the full score next wave.
// 4 channels (2 pulse, 1 triangle, 1 noise). Music unlocks on first user gesture.
// Safe no-op when AudioContext is unavailable (headless / SSR). Persisted mute.

export const CHANNELS = ['pulse1', 'pulse2', 'triangle', 'noise'];

export class AudioEngine {
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
export const SFX = {
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
