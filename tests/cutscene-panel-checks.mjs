// tests/cutscene-panel-checks.mjs — Wave W10: the cutscene panel
// pipeline's integrity gate. Standalone suite in the repo's checks style:
//   node tests/cutscene-panel-checks.mjs
// Part A (pure): every {panel} step in shipped event data resolves
// through PANELS (src/data/panels.mjs) to a built ART entry; no orphan
// PANELS entries or panel art; panel art obeys the gate (<=16 colors,
// the 128x80 canvas standard); the --scene converter is deterministic
// and gate-clean on a synthetic fixture.
// W10-B growth (ratchet form, pins move only in-commit with their
// tranche): PANEL_STEPS / PANELS_ENTRIES pins, the PANEL_ART_BYTES
// cumulative pin, A7 generalized attach geometry (every panel step,
// not just the proof scene), and A8's per-tranche budget (<=150 KB of
// shipped panel art per tranche, Director ruling W10-B — superseding
// W10's wave-total reading of the same cap).
// Part B (bundle): boots the built game headlessly and PARITY-DRIVES
// the proof event (ev_johto_celebi) twice — once as shipped, once with
// its panel steps stripped — asserting the panel fired (ui log), the
// chain completed (done flag + catch), and the end state and the
// non-panel ui log are IDENTICAL: a panel step is presentation only.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let pass = 0; const failures = [];
function ok(name, cond) { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));

// ---------- Part A: resolution, art gate, budget, converter ----------
const K = await D('story-kanto.mjs'); const O = await D('story-orange.mjs'); const J = await D('story-johto.mjs');
const H = await D('story-hoenn.mjs'); const S = await D('story-sinnoh.mjs');
const EVENTS = Object.assign({}, K.EVENTS, O.ORANGE_EVENTS, J.JOHTO_EVENTS, H.HOENN_EVENTS, S.SINNOH_EVENTS);
const { QUESTS } = await D('quests.mjs');
const { PANELS } = await D('panels.mjs');
const { ART } = await import(path.join(ROOT, 'assets/sprites/art-data.mjs'));

// every step list the runner interprets: EVENTS (+ quest onComplete)
const stepLists = [];
for (const [id, ev] of Object.entries(EVENTS)) stepLists.push([id, Array.isArray(ev) ? ev : (ev.steps || [])]);
for (const [id, q] of Object.entries(QUESTS)) if (Array.isArray(q.onComplete)) stepLists.push([id + '.onComplete', q.onComplete]);

const panelSteps = [];
for (const [id, steps] of stepLists) steps.forEach((s, i) => { if (s && s.panel) panelSteps.push({ id, i, panel: s.panel }); });

// W10-B ratchet pins (move only in-commit with their tranche;
// re-pinned by the merge coordinator against the MERGED tree:
// W10 proof panel + T1's 8 sovereigns + T2's 9 Yamato+Maris panels
// + T3's 11 Borea/rest panels).
const PANEL_STEPS = 29;
const PANELS_ENTRIES = 29;
const PANEL_ART_BYTES = 322126;
const PANEL_ART_BASELINE_W10 = 11171; // the W10 proof panel alone

ok('A1 shipped data carries at least one panel step', panelSteps.length >= 1);
ok('A1 PANEL_STEPS ratchet: shipped panel steps == pin', panelSteps.length === PANEL_STEPS);
ok('A1 PANELS_ENTRIES ratchet: PANELS entries == pin', Object.keys(PANELS).length === PANELS_ENTRIES);
ok('A1 every panel step resolves through PANELS to a built ART entry',
  panelSteps.every(({ panel }) => PANELS[panel] && ART[PANELS[panel].art]),
  );
ok('A2 every PANELS entry is used by at least one panel step (no orphan panels)',
  Object.keys(PANELS).every((k) => panelSteps.some(({ panel }) => panel === k)));
ok('A2 every PANELS art id exists in ART (no orphan art)',
  Object.values(PANELS).every(({ art }) => !!ART[art]));
ok('A3 panel art obeys the gate: <=16 colors, 128x80 canvas standard, full row set',
  Object.values(PANELS).every(({ art }) => {
    const e = ART[art];
    return e && Object.keys(e.pal).length <= 16 && e.w === 128 && e.h === 80 && Array.isArray(e.rows) && e.rows.length === 80;
  }));

// W10 art budget: the panel entries' serialized bytes in art-data.mjs.
const artDataText = fs.readFileSync(path.join(ROOT, 'assets/sprites/art-data.mjs'), 'utf8');
let panelBytes = 0;
for (const { art } of Object.values(PANELS)) {
  const start = artDataText.indexOf(`  ${JSON.stringify(art)}:`);
  const end = start < 0 ? -1 : artDataText.indexOf('\n  ] },\n', start);
  if (start >= 0 && end > start) panelBytes += Buffer.byteLength(artDataText.slice(start, end + 7));
}
// W10-B ratchet pins (measured; move only in-commit with their tranche).
const PANEL_ART_BYTES_PIN = PANEL_ART_BYTES;   // cumulative panel art after W10-B T1+T2+T3 (merge re-pin: 322126)
const PANEL_ART_BYTES_PREV = 199856;  // cumulative after W10-B T1+T2 — the latest tranche (T3) delta is measured from here
console.log('  panel art cumulative: ' + panelBytes + ' B (pin ' + PANEL_ART_BYTES_PIN + ' B; this tranche delta ' + (panelBytes - PANEL_ART_BYTES_PREV) + ' B of the 153600 B per-tranche cap)');
ok('A8 PANEL_ART_BYTES pin: cumulative panel art equals the ratchet pin (measured)', panelBytes === PANEL_ART_BYTES_PIN);
ok('A8 per-tranche budget: the latest tranche\'s panel art is within 150 KB (Director ruling, W10-B)',
  panelBytes - PANEL_ART_BYTES_PREV > 0 && panelBytes - PANEL_ART_BYTES_PREV <= 150 * 1024);

// A7 attach geometry, generalized from the A5 proof-scene pin: every
// panel step in a battle event sits after the event's final build-up
// say and before its battle step; in a non-battle event, after a say.
{
  const BATTLE_KEYS = ['wildBattleCatch', 'wildBattle', 'battleAny', 'battle'];
  const bad = [];
  for (const [id, steps] of stepLists) {
    steps.forEach((s, i) => {
      if (!s || !s.panel) return;
      const bi = steps.findIndex((t) => t && BATTLE_KEYS.some((k) => t[k] !== undefined));
      if (bi >= 0) {
        let lastSay = -1;
        for (let j = 0; j < bi; j++) if (steps[j] && steps[j].say) lastSay = j;
        if (!(i > lastSay && i < bi)) bad.push(id + '@' + i);
      } else if (!steps.slice(0, i).some((t) => t && t.say)) bad.push(id + '@' + i);
    });
  }
  if (bad.length) console.log('  A7 violations: ' + bad.join(', '));
  ok('A7 attach geometry (generalized): every panel step sits after the final build-up say, before the battle step', bad.length === 0);
}

// proof-scene attach geometry at source level
{
  const ev = J.JOHTO_EVENTS.ev_johto_celebi;
  const pi = ev.findIndex((s) => !!s.panel);
  const si = ev.findIndex((s) => !!s.say);
  const bi = ev.findIndex((s) => !!s.wildBattleCatch);
  ok('A5 proof scene: ev_johto_celebi carries exactly one panel step, after the build-up say, before the catch step',
    ev.filter((s) => !!s.panel).length === 1 && pi > si && pi < bi && ev[pi].panel === 'shrine-chronofae');
}

// --scene converter: deterministic + gate-clean on a synthetic fixture
{
  const { encodePng } = await import(path.join(ROOT, 'assets/sprites/tools/png.mjs'));
  const { parsePix, colorCount } = await import(path.join(ROOT, 'assets/sprites/tools/pix.mjs'));
  const W = 320, Hh = 200, rgba = Buffer.alloc(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, dx = x - 160, dy = y - 100;
    const inDisc = dx * dx + dy * dy < 3600;
    rgba[o] = inDisc ? 90 : (x * 255 / W) | 0;
    rgba[o + 1] = inDisc ? 200 : (y * 255 / Hh) | 0;
    rgba[o + 2] = inDisc ? 80 : 140;
    rgba[o + 3] = 255;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'w10-scene-'));
  const fixture = path.join(tmp, 'fixture.png');
  fs.writeFileSync(fixture, encodePng(W, Hh, rgba));
  const tool = path.join(ROOT, 'assets/sprites/tools/convert-monster.mjs');
  const run = (out) => spawnSync('node', [tool, fixture, 'panel-test-fixture', '--scene', '--out', out], { encoding: 'utf8' });
  const r1 = run(path.join(tmp, 'a')), r2 = run(path.join(tmp, 'b'));
  const f1 = path.join(tmp, 'a', 'panel-test-fixture.pix'), f2 = path.join(tmp, 'b', 'panel-test-fixture.pix');
  ok('A6 --scene converter runs clean on a synthetic PNG fixture', r1.status === 0 && r2.status === 0 && fs.existsSync(f1) && fs.existsSync(f2));
  ok('A6 --scene conversion is deterministic (byte-identical across runs)',
    fs.existsSync(f1) && fs.existsSync(f2) && fs.readFileSync(f1, 'utf8') === fs.readFileSync(f2, 'utf8'));
  if (fs.existsSync(f1)) {
    const parsed = parsePix(fs.readFileSync(f1, 'utf8'), f1);
    ok('A6 --scene output parses under the pix pipeline at the 128x80 standard with <=15 colors',
      parsed.w === 128 && parsed.h === 80 && colorCount(parsed) <= 15);
  } else ok('A6 --scene output parses under the pix pipeline at the 128x80 standard with <=15 colors', false);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------- Part B: the built bundle, headless parity drive ----------
const { buildGameJs } = await import(path.join(ROOT, 'scripts/build.mjs'));
const gameJs = buildGameJs();
{
  const memStore = {};
  globalThis.localStorage = {
    getItem: (k) => (k in memStore ? memStore[k] : null),
    setItem: (k, v) => { memStore[k] = String(v); },
    removeItem: (k) => { delete memStore[k]; },
  };
  globalThis.__SEED__ = 20261115;
  globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };
}
const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('W10-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('w10-pass ' + name);
  }
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
    return JSON.stringify(v);
  }
  function mkGame(seed) {
    globalThis.__QFRESET__();
    globalThis.__SEED__ = seed;
    var g = new Game(null);
    g.state.settings.battleStyle = 'classic';
    g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout();
    return g;
  }
  function tk(g, n) { g.loop.stepTicks(n || 2); }
  function pA(g) { g.input.inject('a'); tk(g, 2); g.input.release('a'); }
  function drain(g) { var n = 0; while (g.ui.dialogueOpen && n < 400) { pA(g); n++; } }
  function boot(g) {
    g.scenes.push(new BootScene());
    g.loop.stepMs(3100); tk(g, 2);
    pA(g); pA(g); pA(g);
    drain(g); g.ui.debugChoose(0); tk(g, 3); drain(g);
    return g.scenes.top;
  }
  function gotoMap(g, map, x, y) {
    g.state.story.position = { map: map, x: x, y: y, dir: 'down' };
    var ow = new OverworldScene();
    g.scenes.replace(ow); ow.enter(); tk(g, 4);
    return ow;
  }
  function attemptBall(g, ballId) {
    var guard = 0, threw = false;
    while (guard++ < 300) {
      if (!(g.scenes.top instanceof BattleScene)) break;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (!threw) {
          var bi = m.items.findIndex(function (it) { return !it.disabled && it.value === 'bag'; });
          var ti = m.items.findIndex(function (it) { return !it.disabled && it.value === ballId; });
          if (ti >= 0) { g.ui.debugChoose(ti); tk(g, 3); threw = true; continue; }
          if (bi >= 0) { g.ui.debugChoose(bi); tk(g, 3); continue; }
          break;
        }
        break;
      }
      pA(g); tk(g, 3);
    }
    return threw;
  }
  function snap(g) {
    return canon({
      flags: g.state.story.flags, quests: g.state.story.quests, dex: g.state.dex,
      party: g.state.party.map(function (m) { return [m.speciesId, m.level, m.hp]; }),
      bag: g.state.bag, pos: g.state.story.position,
    });
  }
  function runProof(seed, strip) {
    var g = mkGame(seed); boot(g);
    var mk = function (id, level) { return makeMon(id, level, SPECIES, MOVES); };
    g.state.party = [mk('partner', 190), mk('venusaur', 190)];
    g.state.bag.masterball = 9; g.state.bag.gsball = 1;
    var ow = gotoMap(g, 'ilex-forest', 14, 5);
    drain(g); tk(g, 3);
    var steps = EVENTS.ev_johto_celebi;
    var removed = [];
    if (strip) {
      for (var i = steps.length - 1; i >= 0; i--) if (steps[i].panel) { removed.unshift({ i: i, s: steps[i] }); steps.splice(i, 1); }
    }
    ow.runEvent('ev_johto_celebi');
    var guard = 0;
    while (!g.state.story.flags.ev_johto_celebi_done && guard++ < 900) {
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.scenes.top instanceof BattleScene) { attemptBall(g, 'masterball'); continue; }
      tk(g, 2);
    }
    drain(g); tk(g, 3);
    for (var k = 0; k < removed.length; k++) steps.splice(removed[k].i, 0, removed[k].s);
    var dexNo = SPECIES.celebi.dexNo;
    return {
      g: g,
      done: !!g.state.story.flags.ev_johto_celebi_done,
      caught: !!(g.state.dex && g.state.dex.caught && g.state.dex.caught[dexNo]),
      panels: g.ui.log.filter(function (e) { return e.ui === 'panel'; }),
      logNoPanel: canon(g.ui.log.filter(function (e) { return e.ui !== 'panel'; })),
      snap: snap(g),
    };
  }

  // attach geometry inside the shipped bundle
  var evSteps = EVENTS.ev_johto_celebi;
  var pi = evSteps.findIndex(function (s) { return !!s.panel; });
  var si = evSteps.findIndex(function (s) { return !!s.say; });
  var bi = evSteps.findIndex(function (s) { return !!s.wildBattleCatch; });
  ok('B1 bundle: ev_johto_celebi panel step sits after the build-up say and before the catch step',
    evSteps.filter(function (s) { return !!s.panel; }).length === 1 && pi > si && pi < bi);
  ok('B1 bundle: the panel step names shrine-chronofae and PANELS resolves it to the panel art',
    pi >= 0 && evSteps[pi].panel === 'shrine-chronofae' && PANELS['shrine-chronofae'] && PANELS['shrine-chronofae'].art === 'panel-shrine-chronofae');

  var r1 = runProof(777, false);
  ok('B2 as shipped: the panel fired exactly once, naming the panel art',
    r1.panels.length === 1 && r1.panels[0].art === 'panel-shrine-chronofae', JSON.stringify(r1.panels));
  ok('B2 as shipped: the chain completed — done flag set and CHRONOFAE caught',
    r1.done && r1.caught, 'done=' + r1.done + ' caught=' + r1.caught);

  var r2 = runProof(777, true);
  ok('B3 stripped: no panel fired, and the chain still completed identically (done + caught)',
    r2.panels.length === 0 && r2.done && r2.caught, 'panels=' + r2.panels.length + ' done=' + r2.done + ' caught=' + r2.caught);
  ok('B4 PARITY: end state identical with and without the panel step', r1.snap === r2.snap);
  ok('B5 PARITY: the ui log minus panel entries is identical across both drives', r1.logNoPanel === r2.logNoPanel);

  globalThis.__W10Q__ = Q;
})();`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__W10Q__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

console.log('\nCUTSCENE PANEL TOTAL: ' + pass + '/' + (pass + failures.length) + ' passed');
if (failures.length) { console.log('FAILURES: ' + failures.join(' ; ')); process.exit(1); }
