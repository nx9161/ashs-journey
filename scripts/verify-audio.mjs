// verify-audio.mjs — headless verification for the Wave 2 audio order.
// Seat 24 (Voice Designer). Validates the note tables against the contract
// schema, audits the channel budget, and exercises the engine's scheduling
// logic through a fake AudioContext (no audible output — asserts events,
// timings, frequencies, gains, mute/volume/reduced-motion behavior).
// Exit 0 = all pass. Run: node scripts/verify-audio.mjs

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let failures = 0;
const ok = (name) => console.log('  PASS ' + name);
const bad = (name, why) => { failures++; console.log('  FAIL ' + name + ' — ' + why); };

console.log('[1] node --check (syntax)');
for (const f of ['audio/note-tables.mjs', 'src/engine/audio.mjs']) {
  try { execFileSync('node', ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); ok(f); }
  catch (e) { bad(f, 'node --check failed'); }
}

const { MUSIC, SFXSET, CRIES, TRACKLIST, AREA_MUSIC } = await import(path.join(ROOT, 'audio', 'note-tables.mjs'));
const { MAPS } = await import(path.join(ROOT, 'src', 'data', 'maps.mjs'));
const engine = await import(path.join(ROOT, 'src', 'engine', 'audio.mjs'));

console.log('[2] note-table schema (contract §2.1)');
const PITCH_RE = /^([A-G][#b]?)(\d)$/;
const WAVES = new Set(['pulse', 'triangle', 'noise']);
const DUTIES = new Set([0.125, 0.25, 0.5]);
function checkTable(t, label, isMusic) {
  if (!t.id || typeof t.id !== 'string') bad(label, 'missing id');
  if (isMusic) {
    if (!t.title) bad(label, 'music missing title');
    if (!(t.bpm > 0)) bad(label, 'bad bpm');
  }
  const tracks = isMusic ? (t.tracks || []) : [t];
  if (isMusic && (tracks.length < 1 || tracks.length > 4)) bad(label, 'track count ' + tracks.length + ' outside 1..4');
  const waveCount = { pulse: 0, triangle: 0, noise: 0 };
  for (const tr of tracks) {
    if (!WAVES.has(tr.wave)) { bad(label, 'bad wave ' + tr.wave); continue; }
    waveCount[tr.wave]++;
    if (tr.wave === 'pulse' && !DUTIES.has(tr.duty)) bad(label, 'bad duty ' + tr.duty);
    if (!(tr.vol > 0 && tr.vol <= 1)) bad(label, 'vol out of (0,1]');
    if (tr.env && !(Array.isArray(tr.env) && tr.env.length === 2 && tr.env[0] >= 0 && tr.env[1] > 0)) bad(label, 'bad env');
    if (!Array.isArray(tr.notes) || !tr.notes.length) { bad(label, 'empty notes'); continue; }
    for (const n of tr.notes) {
      if (!Array.isArray(n) || n.length !== 3) { bad(label, 'note not a 3-tuple'); break; }
      const [beat, pitch, beats] = n;
      if (!(typeof beat === 'number' && beat >= 0)) bad(label, 'bad beat offset ' + beat);
      if (!(typeof beats === 'number' && beats > 0)) bad(label, 'bad beats ' + beats);
      if (pitch === null) { if (tr.wave !== 'noise') bad(label, 'null pitch on non-noise track'); }
      else if (!PITCH_RE.test(pitch)) bad(label, 'bad pitch ' + pitch);
    }
  }
  if (isMusic) {
    if (waveCount.pulse > 2) bad(label, 'more than 2 pulse tracks');
    if (waveCount.triangle > 1) bad(label, 'more than 1 triangle track');
    if (waveCount.noise > 1) bad(label, 'more than 1 noise track');
  }
}
const seen = new Set();
for (const [id, t] of Object.entries(MUSIC)) { if (seen.has(id)) bad(id, 'dup id'); seen.add(id); checkTable(t, 'music:' + id, true); }
for (const [id, t] of Object.entries(SFXSET)) { if (seen.has(id)) bad(id, 'dup id'); seen.add(id); checkTable(t, 'sfx:' + id, false); }
for (const [id, t] of Object.entries(CRIES)) { if (seen.has(id)) bad(id, 'dup id'); seen.add(id); checkTable(t, 'cry:' + id, false); }
if (!failures) ok('schema: ' + Object.keys(MUSIC).length + ' music, ' + Object.keys(SFXSET).length + ' sfx, ' + Object.keys(CRIES).length + ' cries');
if (JSON.stringify(TRACKLIST.music.sort()) !== JSON.stringify(Object.keys(MUSIC).sort())) bad('tracklist', 'music index mismatch');
else ok('TRACKLIST index consistent');

console.log('[3] channel budget: max simultaneous voices <= 6 per track');
function maxOverlap(table) {
  const events = [];
  const spb = 60 / (table.bpm || 120);
  for (const tr of table.tracks) for (const [beat, , beats] of tr.notes) {
    events.push([beat * spb, 1], [(beat + beats) * spb, -1]);
  }
  // At identical timestamps, ends free a voice before starts claim one
  // (matches the engine's onended-driven voice accounting).
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0, max = 0;
  for (const [, d] of events) { cur += d; max = Math.max(max, cur); }
  return max;
}
for (const [id, t] of Object.entries(MUSIC)) {
  const m = maxOverlap(t);
  if (m > 6) bad('polyphony:' + id, m + ' simultaneous voices');
}
if (!failures) ok('all music tracks within 4-6 voice budget');
for (const [id, t] of Object.entries(MUSIC)) {
  const secs = Math.max(...t.tracks.flatMap((tr) => tr.notes.map(([b, , d]) => b + d))) * (60 / t.bpm);
  if (!(secs > 1 && secs < 60)) bad('loop:' + id, 'loop length ' + secs.toFixed(2) + 's');
}
if (!failures) ok('loop lengths sane (1s..60s)');

console.log('[4] map music cross-refs');
for (const [id, m] of Object.entries(MAPS)) {
  if (m.music && !MUSIC[m.music]) bad('map:' + id, 'music id ' + m.music + ' not in score');
}
for (const [map, track] of Object.entries(AREA_MUSIC)) {
  if (!MAPS[map]) bad('area-music:' + map, 'unknown map');
  if (!MUSIC[track]) bad('area-music:' + map, 'unknown track ' + track);
}
if (!failures) ok('every map.music resolves to a composed track');

console.log('[5] engine scheduling exercise (fake AudioContext)');
// ---- fake WebAudio ----
function fakeParam() {
  const calls = [];
  return { calls, value: 1,
    setValueAtTime(v, t) { this.value = v; calls.push(['set', v, t]); },
    linearRampToValueAtTime(v, t) { calls.push(['lin', v, t]); },
    exponentialRampToValueAtTime(v, t) { calls.push(['exp', v, t]); } };
}
const EVENTS = [];
function fakeNode(kind, ctx) {
  const gain = fakeParam();
  return { kind, ctx, gain, frequency: { value: 0 }, type: 'square',
    _wave: null, _start: 0, _stop: 0, onended: null,
    setPeriodicWave(w) { this._wave = w; },
    connect() {}, start(t) { this._start = t; EVENTS.push({ kind, node: this, start: t }); },
    stop(t) { this._stop = t; },
    createGain() { return { gain: fakeParam(), connect() {} }; } };
}
class FakeAC {
  constructor() { this.currentTime = 100; this.sampleRate = 44100; this.destination = {}; this.gains = []; }
  createGain() { const p = fakeParam(); this.gains.push(p); return { gain: p, connect() {} }; }
  createOscillator() { const n = fakeNode('osc', this); return n; }
  createBufferSource() { return fakeNode('noise', this); }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} }; }
  createBuffer(ch, len) { return { getChannelData() { return new Float32Array(len); } }; }
  createPeriodicWave() { return { fake: true }; }
}

const A = new engine.AudioEngine();
// 5a. headless no-op (never unlocked)
try { A.playSfx('ui-blip'); A.playMusic('title-theme'); A.encounter(); A.playCry('pikachu'); ok('headless no-op never throws'); }
catch (e) { bad('headless', e.message); }
// 5b. unlock + freq math
if (engine.freqOf('A4') !== 440) bad('freqOf', 'A4 != 440');
else if (Math.abs(engine.freqOf('C4') - 261.63) > 0.5) bad('freqOf', 'C4 off');
else ok('freqOf pitch math (A4=440, C4≈261.63)');
A.unlock(FakeAC);
if (!A._unlocked) bad('unlock', 'did not unlock with injected AC'); else ok('unlock(FakeAC)');
// 5c. SFX scheduling: ui-blip = E6 ≈ 1318.5 Hz at t≈currentTime, gain peak = vol
// (_live reset: the fake clock is frozen, so scheduled voices never expire on their own)
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.playSfx('ui-blip');
if (EVENTS.length !== 1) bad('sfx:ui-blip', 'expected 1 event, got ' + EVENTS.length);
else {
  const e = EVENTS[0];
  const f = e.node.frequency.value;
  if (Math.abs(f - 1318.51) > 1) bad('sfx:ui-blip', 'freq ' + f + ' != E6');
  else {
    const gp = A.ctx.gains[A.ctx.gains.length - 1];
    const ramp = gp.calls.find((c) => c[0] === 'lin');
    if (!ramp || Math.abs(ramp[1] - 0.35) > 1e-6) bad('sfx:ui-blip', 'envelope peak != vol 0.35');
    else ok('playSfx schedules E6 pulse with [attack,decay] envelope at vol 0.35');
  }
}
// 5d. sfx volume is live on the bus
EVENTS.length = 0;
A.setSfxVolume(0.5);
A.playSfx('ui-blip');
const busGain = A.sfxBus.gain.calls.find((c) => c[0] === 'set');
if (!busGain || Math.abs(busGain[1] - 0.5) > 1e-9) bad('sfx-volume', 'bus gain not applied live');
else ok('setSfxVolume applies live to the sfx bus');
A.setSfxVolume(0.8);
// 5e. mute suppresses scheduling and zeroes master
EVENTS.length = 0;
A.setMuted(true);
A.playSfx('ui-blip');
const mg = A.master.gain.calls.find((c) => c[0] === 'set' && c[1] === 0);
if (EVENTS.length !== 0) bad('mute', 'scheduled ' + EVENTS.length + ' events while muted');
else if (!mg) bad('mute', 'master gain not zeroed');
else ok('mute suppresses all scheduling + zeroes master gain');
A.setMuted(false);
// 5f. music: one loop scheduled, no restart churn on same id
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.stopMusic(); // unlock() already auto-started the pending title theme; reset for a clean replay
A.playMusic('title-theme');
const firstCount = EVENTS.length;
const expected = Object.values(MUSIC['title-theme'].tracks).reduce((a, tr) => a + tr.notes.length, 0);
if (firstCount !== expected) bad('music:title-theme', 'scheduled ' + firstCount + ' != ' + expected + ' notes');
else if (A._musicId !== 'title-theme') bad('music:title-theme', '_musicId not set');
else if (!A._schedTimer) bad('music:title-theme', 'loop timer not armed');
else ok('playMusic schedules the full first loop (' + expected + ' notes) + arms the loop timer');
A.playMusic('title-theme');
if (EVENTS.length !== firstCount) bad('music:churn', 'same-id replay re-scheduled');
else ok('same-id playMusic is a no-op (no restart churn)');
// 5g. battle music is not an area-restore target; restore works
A.playMusic('battle-wild-theme', { area: false });
if (A._musicId !== 'battle-wild-theme') bad('music:battle', 'battle theme not playing');
else if (A._areaMusicId === 'battle-wild-theme') bad('music:battle', 'battle theme polluted area restore target');
else ok('battle music plays without becoming the area-restore target');
A.restoreAreaMusic();
if (A._musicId !== 'title-theme') bad('music:restore', 'did not restore area track');
else ok('restoreAreaMusic returns to the last area track');
A.stopMusic();
if (A._musicId !== null || A._schedTimer !== null) bad('music:stop', 'timer/id not cleared');
else ok('stopMusic clears the loop timer');
// 5h. reduced-motion transition swap
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.setReducedMotion(true); A.transition();
const hasFade = EVENTS.some((e) => e.kind === 'osc');
A.setReducedMotion(false); EVENTS.length = 0; A.transition();
const hasWhoosh = EVENTS.some((e) => e.kind === 'noise');
if (!hasFade || !hasWhoosh) bad('transition', 'reduced-motion swap wrong');
else ok('transition(): whoosh normally, soft fade under reduced motion');
// 5i. cries: known species + unknown fallback
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.playCry('pikachu');
if (EVENTS.length === 0) bad('cry', 'pikachu cry scheduled nothing');
else { A.playCry('missingno'); if (EVENTS.length === 0) bad('cry', 'fallback missing'); else ok('playCry: per-species motifs + generic fallback'); }
// 5j. polyphony cap: 10 simultaneous notes -> at most 6 scheduled
EVENTS.length = 0;
A._live = [];
A.playSfx({ wave: 'pulse', duty: 0.5, vol: 0.5, notes: Array.from({ length: 10 }, () => [0, 'C5', 1]) });
if (EVENTS.length > 6) bad('polyphony', EVENTS.length + ' > 6 voices scheduled');
else ok('voice budget cap enforced (' + EVENTS.length + ' of 10 simultaneous notes scheduled)');
// 5k. applySettings wiring
A.applySettings({ mute: true, musicVol: 0.3, sfxVol: 0.4, reducedMotion: true });
if (!A.muted || A.musicVol !== 0.3 || A.sfxVol !== 0.4 || !A.reducedMotion) bad('applySettings', 'settings not applied');
else ok('applySettings persists mute + both volumes + reduced motion');

console.log(failures ? '\nAUDIO VERIFY: ' + failures + ' FAILURES' : '\nAUDIO VERIFY: ALL PASS');
process.exit(failures ? 1 : 0);
