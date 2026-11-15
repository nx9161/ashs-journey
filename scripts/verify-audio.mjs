// verify-audio.mjs — headless verification for the Wave 2 audio order.
// Seat 24 (Voice Designer). Validates the note tables against the contract
// schema, audits the channel budget, and exercises the engine's scheduling
// logic through a fake AudioContext (no audible output — asserts events,
// timings, frequencies, gains, mute/volume/reduced-motion behavior).
// W6 added [6] a call-site cross-check (every SFX key the game plays must
// resolve in SFXSET — the audit D1 dead-key guard) and [7] audible proof
// that the fixed keys schedule voices + suspended-context recovery.
// W12-T1 added [10] cry coverage/distinctness (509/509 resolve through the
// engine's own resolution path; pairwise-distinct over independent
// identities; authored precedence + partner alias pinned) and [11] the
// 55,000 B audio byte budget.
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

console.log('[6] call-site cross-check: every played SFX key resolves (W6 / audit D1 guard)');
const fs = await import('node:fs');
function walkMjs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMjs(p));
    else if (e.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}
// Argument text of every playSfx(...) call in a source text: tracks paren
// depth and copies string literals verbatim (so '}' or ')' inside a raw
// table argument cannot truncate the scan).
function playSfxArgs(text) {
  const args = [];
  let i = 0;
  while ((i = text.indexOf('playSfx(', i)) !== -1) {
    let j = i + 'playSfx('.length, depth = 1, arg = '';
    while (j < text.length && depth > 0) {
      const c = text[j];
      if (c === "'" || c === '"' || c === '`') {
        let k = j + 1;
        while (k < text.length && text[k] !== c) { if (text[k] === '\\') k++; k++; }
        arg += text.slice(j, Math.min(k + 1, text.length));
        j = k + 1;
        continue;
      }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { j++; break; } }
      arg += c; j++;
    }
    args.push(arg);
    i = j;
  }
  return args;
}
const KEY_RE = /'([a-z0-9][a-z0-9_-]*)'/g;
let siteCount = 0;
const usedKeys = new Map();   // key -> first file that plays it
const dynamicSites = [];      // playSfx calls with no literal key (must stay exactly the known one)
for (const f of walkMjs(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, f);
  const text = fs.readFileSync(f, 'utf8');
  for (const arg of playSfxArgs(text)) {
    if (rel === path.join('src', 'engine', 'audio.mjs') && arg.trim() === 'key') continue; // the definition
    siteCount++;
    // The one known dynamic call: playCry passing a CRIES table / raw
    // fallback table (cries resolve against CRIES, not SFXSET, by design).
    if (arg.trimStart().startsWith('cry ||')) { dynamicSites.push(rel); continue; }
    const keys = [...arg.matchAll(KEY_RE)].map((m) => m[1]);
    if (!keys.length) { dynamicSites.push(rel + ': playSfx(' + arg.trim().slice(0, 40) + '…)'); continue; }
    for (const k of keys) if (!usedKeys.has(k)) usedKeys.set(k, rel);
  }
  for (const m of text.matchAll(/SFX\[\s*'([^']+)'\s*\]/g)) {
    if (!usedKeys.has(m[1])) usedKeys.set(m[1], rel);
  }
}
let dangling = 0;
for (const [k, rel] of usedKeys) {
  if (!SFXSET[k]) { dangling++; bad('callsite:' + k, 'played in ' + rel + ' but not in SFXSET — the sound is silently dropped'); }
}
if (!dangling) ok('all ' + usedKeys.size + ' distinct SFX keys across ' + siteCount + ' playSfx sites resolve in SFXSET');
if (dynamicSites.length === 1 && dynamicSites[0] === path.join('src', 'engine', 'audio.mjs')) ok('exactly one known dynamic playSfx call (playCry table pass-through)');
else bad('dynamic-calls', 'expected only the playCry pass-through, found: ' + (dynamicSites.join('; ') || 'none'));
// Named regression pins for the W6 fixes: the keys exist AND are played.
for (const k of ['menu-move', 'item-get', 'warp', 'fanfare']) {
  if (!SFXSET[k]) bad('w6-pin:' + k, 'table missing from SFXSET');
  else if (!usedKeys.has(k)) bad('w6-pin:' + k, 'tabled but no call site plays it (unwired)');
}
if (!failures) ok('W6 pins: menu-move / item-get / warp tabled + played; fanfare tabled + played');

console.log('[7] W6 audible proof: fixed keys schedule voices; suspended ctx resumes');
A.setMuted(false); A.setSfxVolume(0.8); A.setMusicVolume(0.8); A.setReducedMotion(false); // undo 5k test settings
for (const key of ['menu-move', 'item-get', 'warp', 'fanfare']) {
  EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
  A.playSfx(key);
  const want = SFXSET[key].notes.length;
  if (EVENTS.length !== want) bad('audible:' + key, 'scheduled ' + EVENTS.length + ' events != ' + want + ' notes');
  else ok('playSfx(\'' + key + '\') schedules all ' + want + ' notes');
}
class FakeAC2 extends FakeAC {
  constructor() { super(); this.state = 'running'; this.resumeCalls = 0; }
  resume() { this.resumeCalls++; this.state = 'running'; return Promise.resolve(); }
}
const B = new engine.AudioEngine();
B.unlock(FakeAC2);
B.ctx.state = 'suspended'; // iOS interruption / backgrounded tab
B.unlock(); // already unlocked: a returning gesture must attempt resume
if (B.ctx.resumeCalls !== 1 || B.ctx.state !== 'running') bad('resume:unlock', 'gesture re-entry did not resume a suspended ctx');
else ok('unlock() re-entry resumes a suspended context');
B.ctx.state = 'suspended';
B.playMusic('title-theme'); // the scheduler's first pass runs synchronously
if (B.ctx.resumeCalls !== 2) bad('resume:scheduler', 'scheduler pass did not attempt resume');
else ok('music scheduler attempts resume when it finds the ctx suspended');
B.stopMusic();

console.log('[8] region charter: merged-map music assignment coverage (W12 / NO-SAME-KIT audio)');
// The merged map table, folded in merge.mjs order, each map charged to the
// region of the file whose definition wins. Every region owns its area
// themes; a region caught playing another region's theme (or an unchartered
// one) fails by map id. Tranches update this charter in the commit that
// changes the assignments (the W3 registry burn-down pattern).
const MAP_FILES = ['maps.mjs', 'maps2.mjs', 'maps3.mjs', 'maps4.mjs', 'maps5.mjs', 'maps6.mjs', 'maps7.mjs', 'maps8.mjs', 'maps9.mjs'];
const MAP_EXPORTS = ['MAPS', 'MAPS2', 'MAPS3', 'MAPS4', 'MAPS5', 'MAPS6', 'MAPS7', 'MAPS8', 'MAPS9'];
const FILE_REGION = { 'maps.mjs': 'arden', 'maps2.mjs': 'arden', 'maps3.mjs': 'arden', 'maps4.mjs': 'arden', 'maps5.mjs': 'amber', 'maps6.mjs': 'yamato', 'maps7.mjs': 'maris', 'maps8.mjs': 'trial', 'maps9.mjs': 'borea' };
const LEGACY_POOL = ['pallet-theme', 'viridian-theme', 'pewter-theme', 'route1-theme']; // Arden's authored set
const REGION_CHARTER = {
  arden: LEGACY_POOL, // Ruling 1: the legacy four were composed for Arden places; they are Arden's identity
  amber: ['amber-town-theme', 'amber-route-theme'],
  yamato: ['yamato-town-theme', 'yamato-route-theme'],
  maris: ['maris-town-theme', 'maris-route-theme'],
  trial: ['trial-town-theme', 'trial-route-theme'], // W12-T3: burn-down closed
  borea: ['borea-town-theme', 'borea-route-theme'], // W12-T3: burn-down closed
};
// Service themes follow the shared service, not the region (the law's own
// code-fact exception): one gym system (Ruling 2), one Center map, the
// title/front-door map.
const SERVICE_THEMES = ['gym-theme', 'center-theme', 'title-theme'];
// Declared inheritance exceptions: vermilion (Arcport) is defined in the
// Arden files; the maps5/maps6 entries are spread overrides that replace
// npcs/events only, so its music is inherited from the Arden definition.
// Charge it to Arden's charter, not to the file that happens to win.
const MUSIC_REGION_OVERRIDE = { vermilion: 'arden' };
{
  const f8 = failures;
  const merged = new Map();
  for (let i = 0; i < MAP_FILES.length; i++) {
    const mod = await import(path.join(ROOT, 'src', 'data', MAP_FILES[i]));
    for (const [id, m] of Object.entries(mod[MAP_EXPORTS[i]])) merged.set(id, { file: MAP_FILES[i], map: m });
  }
  let chartered = 0;
  for (const [id, { file, map }] of merged) {
    const region = MUSIC_REGION_OVERRIDE[id] || FILE_REGION[file];
    if (!map.music) { bad('charter:' + id, 'no music field (engine would fall back to route1-theme)'); continue; }
    if (!MUSIC[map.music]) { bad('charter:' + id, 'music id ' + map.music + ' not in score'); continue; }
    if (!REGION_CHARTER[region].includes(map.music) && !SERVICE_THEMES.includes(map.music)) {
      bad('charter:' + id, map.music + ' is outside the ' + region + ' charter (winning def in ' + file + ')');
      continue;
    }
    chartered++;
  }
  if (failures === f8) ok('all ' + chartered + ' merged maps play inside their region charter (every region on its own town+route pair; the legacy pool is Arden\'s charter only — burn-down closed by W12-T3)');
  // Code-selected contexts: every '-theme' literal named outside the data
  // tables (battle/title/contest call sites, engine fallback) must resolve.
  const themeLits = new Map();
  for (const f of walkMjs(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, f);
    if (rel.startsWith(path.join('src', 'data'))) continue;
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)*-theme)'/g)) if (!themeLits.has(m[1])) themeLits.set(m[1], rel);
  }
  let danglingThemes = 0;
  for (const [t, rel] of themeLits) if (!MUSIC[t]) { danglingThemes++; bad('context-theme:' + t, 'named in ' + rel + ' but not in MUSIC'); }
  if (!danglingThemes) ok('all ' + themeLits.size + ' code-selected theme ids resolve in MUSIC (' + [...themeLits.keys()].sort().join(', ') + ')');
}

console.log('[9] loop distinctness: lead-melody interval fingerprints (W12)');
// A transposed copy has the SAME interval sequence as its source, so
// pairwise-distinct lead interval fingerprints ban variants-by-transposition
// by construction. Lead = tracks[0] (the contract's melody track).
{
  const f9 = failures;
  const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semiOf = (p) => { const m = /^([A-G])([#b]?)(\d)$/.exec(p); return (+m[3] + 1) * 12 + NOTE_BASE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const hashOf = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16).padStart(8, '0'); };
  const prints = new Map();
  const spread = [];
  for (const [id, t] of Object.entries(MUSIC)) {
    const lead = t.tracks[0];
    const notes = [...lead.notes].sort((a, b) => a[0] - b[0]);
    if (notes.length < 2 || notes.some((n) => n[1] === null)) { bad('fingerprint:' + id, 'lead track is not a pitched melody'); continue; }
    const semis = notes.map((n) => semiOf(n[1]));
    const fp = semis.slice(1).map((s, i) => s - semis[i]).join(',');
    if (prints.has(fp)) bad('fingerprint:' + id, 'lead interval sequence identical to ' + prints.get(fp) + ' (transposed-copy class)');
    else prints.set(fp, id);
    spread.push(id + ' bpm' + t.bpm + ' lead-from ' + notes[0][1] + ' fp ' + hashOf(fp));
  }
  if (failures === f9) ok('all ' + prints.size + ' loops carry pairwise-distinct lead interval fingerprints');
  console.log('       spread: ' + spread.join(' · '));
}
console.log('[10] cry coverage + distinctness: every species resolves its own cry (W12-T1)');
const sp1 = await import(path.join(ROOT, 'src', 'data', 'species.mjs'));
const sp2 = await import(path.join(ROOT, 'src', 'data', 'species2.mjs'));
const sp3 = await import(path.join(ROOT, 'src', 'data', 'species3.mjs'));
const sp4 = await import(path.join(ROOT, 'src', 'data', 'species4.mjs'));
const sp5 = await import(path.join(ROOT, 'src', 'data', 'species5.mjs'));
// Fold the expansion rosters into the base SPECIES object — the same object
// the engine imported, folded in merge.mjs's order, exactly as the bundle
// does at load. Only after this fold does the engine see all 509 records.
Object.assign(sp1.SPECIES, sp2.SPECIES2, sp3.SPECIES_JOHTO, sp4.SPECIES_HOENN, sp5.SPECIES_SINNOH);
const ROSTER = sp1.SPECIES;
const rosterIds = Object.keys(ROSTER);
if (rosterIds.length !== 509) bad('cry-roster', 'folded roster has ' + rosterIds.length + ' records, expected 509');
else ok('roster folds to 509 records (merge.mjs order)');
const canonCry = (t) => JSON.stringify([t.wave, t.duty || 0, t.vol, t.env, t.notes]);
const resolved = {};
let unresolved = 0;
for (const id of rosterIds) {
  const t = engine.resolveCry(id);
  if (!t || !Array.isArray(t.notes) || !t.notes.length) { unresolved++; bad('cry-resolve:' + id, 'no cry resolved — would hit the legacy fallback'); }
  else resolved[id] = t;
}
if (!unresolved) ok('coverage: 509/509 records resolve a non-empty cry (legacy fallback reached by zero roster ids)');
// Every resolved table (authored + derived) must satisfy the §2 schema.
const schemaFailuresBefore = failures;
for (const id of rosterIds) if (resolved[id]) checkTable(resolved[id], 'cry-resolved:' + id, false);
if (failures === schemaFailuresBefore) ok('all 509 resolved cry tables pass the SFX schema');
// Authored precedence (Ruling 3): the 14 authored tables are never shadowed.
let precedenceBad = 0;
for (const id of Object.keys(CRIES)) if (engine.resolveCry(id) !== CRIES[id]) { precedenceBad++; bad('cry-precedence:' + id, 'authored table shadowed by derivation'); }
if (!precedenceBad) ok('authored precedence: all ' + Object.keys(CRIES).length + ' authored cries resolve to their own tables');
// Partner alias (Ruling 4): one creature, one voice.
if (engine.resolveCry('partner') !== CRIES.pikachu) bad('cry-partner', 'partner does not resolve to the authored pikachu table');
else ok('partner resolves to the authored VOLTIK (pikachu) cry');
// Formes share their base species' cry (plan §3.2 step 3).
const formeIds = rosterIds.filter((id) => ROSTER[id].form && ROSTER[id].baseSpecies);
let formeBad = 0;
for (const id of formeIds) {
  if (!resolved[id] || canonCry(resolved[id]) !== canonCry(engine.resolveCry(ROSTER[id].baseSpecies))) { formeBad++; bad('cry-forme:' + id, 'does not share its base species\' cry'); }
}
if (!formeBad) ok('all ' + formeIds.length + ' formes share their base species\' cry');
// Distinctness over the independent cry identities: every record except the
// partner (aliased by Ruling 4) and the formes (base-sharing by design).
// Those sharings are pinned by the equality checks above; here, any two
// distinct creatures must never sound alike — a collision fails by pair.
const identities = rosterIds.filter((id) => id !== 'partner' && !(ROSTER[id].form && ROSTER[id].baseSpecies));
const hashSeen = new Map();
let collisions = 0;
for (const id of identities) {
  const h = canonCry(resolved[id]);
  if (hashSeen.has(h)) { collisions++; bad('cry-distinct:' + id, 'resolved cry collides with ' + hashSeen.get(h)); }
  else hashSeen.set(h, id);
}
if (!collisions) ok('pairwise-distinct cries: ' + identities.length + '/' + identities.length + ' independent identities, 0 collisions');
// Determinism: re-resolution reproduces every table exactly.
let detBad = 0;
for (const id of identities) if (canonCry(engine.resolveCry(id)) !== canonCry(resolved[id])) detBad++;
if (!detBad) ok('derivation is deterministic (re-resolution reproduces all tables)');
// Engine-level scheduling through the fake AC: the partner must schedule the
// authored VOLTIK notes, and a derived species its derived notes.
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.playCry('partner');
const partnerFreqs = EVENTS.map((e) => Math.round(e.node.frequency.value));
const authoredFreqs = CRIES.pikachu.notes.map(([, p]) => Math.round(engine.freqOf(p)));
if (JSON.stringify(partnerFreqs) !== JSON.stringify(authoredFreqs)) bad('cry-sched:partner', 'scheduled ' + partnerFreqs.join('/') + ' != authored ' + authoredFreqs.join('/'));
else ok('playCry(\'partner\') schedules the authored VOLTIK notes through the engine');
const derivedId = identities.find((id) => !CRIES[id]);
EVENTS.length = 0; A._live = []; // voices ended (fake clock is frozen)
A.playCry(derivedId);
const derivedFreqs = EVENTS.map((e) => Math.round(e.node.frequency.value));
const derivedWant = resolved[derivedId].notes.map(([, p]) => Math.round(engine.freqOf(p)));
if (JSON.stringify(derivedFreqs) !== JSON.stringify(derivedWant)) bad('cry-sched:derived', derivedId + ' scheduled ' + derivedFreqs.join('/') + ' != derived ' + derivedWant.join('/'));
else ok('playCry(\'' + derivedId + '\') schedules its derived cry (' + derivedWant.length + ' notes) through the engine');

console.log('[11] audio byte budget: note-tables + engine <= 55,000 B (W12 Ruling 5)');
const audioBytes = fs.statSync(path.join(ROOT, 'audio', 'note-tables.mjs')).size
  + fs.statSync(path.join(ROOT, 'src', 'engine', 'audio.mjs')).size;
if (audioBytes > 55000) bad('audio-budget', audioBytes + ' B exceeds the 55,000 B cap');
else ok('audio module total ' + audioBytes + ' B <= 55,000 B cap');

console.log(failures ? '\nAUDIO VERIFY: ' + failures + ' FAILURES' : '\nAUDIO VERIFY: ALL PASS');
process.exit(failures ? 1 : 0);
