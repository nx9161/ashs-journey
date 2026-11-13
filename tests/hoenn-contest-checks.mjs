// hoenn-contest-checks.mjs — Arc 3 Stage H5 (Contest-lite, ruling 7)
// proofs. Part A: pure units — the appeal/jam table (coverage over the
// WHOLE move table, the derivation, the 35 hand-tuned notables), the
// NPC fields, and the ribbon save quintet (defaultState, the client
// schema pair, the server validator pair, gen-tables). Part B: the
// built bundle in a headless Game — the pure contest engine driven
// deterministically (scoring math vs the table, the jam lever changing
// a standing, guaranteed win/loss lines), then the TRUE PATH through
// the shipped presentation: a hall's reception counter (sysInteract on
// the 'α' tile of a contestHall map) -> party pick -> ContestScene
// (the BattleScene presentation, inherited whole) -> 4 rounds of real
// move picks -> 1st place -> the Verdanturf Ribbon persisted -> save
// round-trip -> re-entry win with NO duplicate ribbon -> a second
// hall's ribbon -> a Splash loss with no ribbon. May's story ribbons
// (may_ribbon_* flags, H4) are never touched by player contests.
// Run: node tests/hoenn-contest-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ================= Part A: pure units =================
const C = await import(join(ROOT, 'src/data/contest.mjs'));
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const ALL_MOVES = { ...MV1, ...MOVES2 };
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO, SPECIES_HOENN);
const { MAPS7 } = await import(join(ROOT, 'src/data/maps7.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

{
  const ids = Object.keys(ALL_MOVES);
  const bad = ids.filter((id) => {
    const aj = C.MOVE_APPEAL[id];
    return !aj || !Number.isInteger(aj.appeal) || aj.appeal < 1 || aj.appeal > 8
      || !Number.isInteger(aj.jam) || aj.jam < 0 || aj.jam > 3
      || C.appealJamFor(id) !== aj;
  });
  ok('A01 coverage: EVERY move in the table (146 — 144 + defog/rockclimb, Arc 4 Stage S4 supersession) resolves to appeal/jam through MOVE_APPEAL + appealJamFor — no move lacks values',
    ids.length === 146 && bad.length === 0, bad.join(','));
  ok('A02 the resolver never throws on an unknown id (floor values {1,0} — a contest cannot crash on a move id)',
    C.appealJamFor('not-a-move').appeal === 1 && C.appealJamFor('not-a-move').jam === 0);
  const n = C.CONTEST_NOTABLES;
  ok('A03 notables: exactly 36 hand-tuned overrides, every one a real move id (hyperbeam 8/0 the finale, splash 1/0 the flop, spore 4/3 the rudest snooze, sing 5/2)',
    Object.keys(n).length === 36 && Object.keys(n).every((id) => ALL_MOVES[id])
    && C.appealJamFor('hyperbeam').appeal === 8 && C.appealJamFor('hyperbeam').jam === 0
    && C.appealJamFor('splash').appeal === 1 && C.appealJamFor('splash').jam === 0
    && C.appealJamFor('spore').appeal === 4 && C.appealJamFor('spore').jam === 3
    && C.appealJamFor('sing').appeal === 5 && C.appealJamFor('sing').jam === 2);
  const d = (id) => C.deriveAppealJam(ALL_MOVES[id]);
  ok('A04 the derivation (one place, category/type/effect class): tackle {2,0} by power, razorleaf {4,0} power+highcrit, growth {5,0} self-buff showcase, leer {3,1} foe stage-drop, thunderwave {4,2} status inflict, bubblebeam {3,0} power only (a stage-chance is not a jam)',
    d('tackle').appeal === 2 && d('tackle').jam === 0
    && d('razorleaf').appeal === 4 && d('razorleaf').jam === 0
    && d('growth').appeal === 5 && d('growth').jam === 0
    && d('leer').appeal === 3 && d('leer').jam === 1
    && d('thunderwave').appeal === 4 && d('thunderwave').jam === 2
    && d('bubblebeam').appeal === 3 && d('bubblebeam').jam === 0);
  ok('A05 derived values clamp to the lite scale (appeal 1..6, jam 0..3) for every non-notable move — only notables may reach 7-8',
    Object.keys(ALL_MOVES).filter((id) => !n[id]).every((id) => {
      const aj = C.MOVE_APPEAL[id];
      return aj.appeal >= 1 && aj.appeal <= 6 && aj.jam >= 0 && aj.jam <= 3;
    }));
}

{
  ok('A06 the four Hoenn halls are exactly maps7\'s contestHall fields (verdanturf/fallarbor/slateport/lilycove); CONTEST_RIBBONS is that closed set PLUS the four Hearthome Super Contest rank ribbons (Arc 4 Stage S4 supersession — the H5 closed set grows by data, Hoenn halls untouched)',
    JSON.stringify(C.CONTEST_HALLS) === JSON.stringify(['verdanturf', 'fallarbor', 'slateport', 'lilycove'])
    && JSON.stringify(C.CONTEST_RIBBONS) === JSON.stringify([...C.CONTEST_HALLS, 'hearthome-normal', 'hearthome-great', 'hearthome-ultra', 'hearthome-master'])
    && Object.values(MAPS7).filter((m) => m.contestHall).map((m) => m.contestHall).sort().join(',')
      === [...C.CONTEST_HALLS].sort().join(','));
  const scriptBad = [];
  for (const hall of C.CONTEST_HALLS) {
    const npcs = C.CONTEST_NPCS[hall];
    if (!npcs || npcs.length !== 3) { scriptBad.push(hall + ':field'); continue; }
    for (const npc of npcs) {
      if (!SPECIES[npc.species]) scriptBad.push(hall + ':' + npc.name + ':species');
      if (!Array.isArray(npc.script) || npc.script.length !== 4) scriptBad.push(hall + ':' + npc.name + ':script');
      for (const mid of npc.script || []) {
        if (!ALL_MOVES[mid]) scriptBad.push(hall + ':' + npc.name + ':' + mid);
        else {
          const aj = C.appealJamFor(mid);
          if (aj.appeal < 4 || aj.appeal > 5) scriptBad.push(hall + ':' + npc.name + ':' + mid + ':appeal' + aj.appeal);
          if (hall === 'verdanturf' && aj.jam !== 0) scriptBad.push(hall + ':' + npc.name + ':' + mid + ':jam');
          if (aj.jam > 1) scriptBad.push(hall + ':' + npc.name + ':' + mid + ':jam' + aj.jam);
        }
      }
    }
  }
  ok('A07 NPC fields: 3 original entrants per hall, real Hoenn-era species, 4-round scripts of real moves, every scripted appeal in 4..5 (a hall is winnable with headliners, losable with a flop), jam 0 in Verdanturf and <=1 elsewhere',
    scriptBad.length === 0, scriptBad.join(';'));
  const names = C.CONTEST_HALLS.flatMap((h) => C.CONTEST_NPCS[h].map((x) => x.name));
  ok('A08 the twelve NPC entrants have distinct original names (no canon characters in the player\'s field)',
    names.length === 12 && new Set(names).size === 12);
}

// -- the ribbon save quintet --
{
  ok('A09 defaultState carries contest { ribbons: [] } (quintet 1/5: the default)',
    JSON.stringify(defaultState().contest) === JSON.stringify({ ribbons: [] }));
  const withRibbons = clone(defaultState()); withRibbons.contest.ribbons = ['slateport', 'verdanturf'];
  const badHall = clone(defaultState()); badHall.contest.ribbons = ['mauville'];
  const dupe = clone(defaultState()); dupe.contest.ribbons = ['verdanturf', 'verdanturf'];
  const notArray = clone(defaultState()); notArray.contest = { ribbons: 'verdanturf' };
  ok('A10 client schema (quintet 2/5): an UNORDERED ribbon set validates (slateport before verdanturf — no prefix rule); an unknown hall, a duplicate, and a non-array all reject (bad-contest-ribbons)',
    SCH.validateSave(withRibbons).ok
    && SCH.validateSave(badHall).errors.includes('bad-contest-ribbons')
    && SCH.validateSave(dupe).errors.includes('bad-contest-ribbons')
    && SCH.validateSave(notArray).errors.includes('bad-contest-ribbons'),
    JSON.stringify(SCH.validateSave(withRibbons).errors));
  const preH5 = clone(defaultState()); delete preH5.contest;
  const filled = SCH.migrate(clone(preH5));
  ok('A11 save-fill (quintet 3/5): a pre-H5 save (no contest key) loads clean — migrate fills { ribbons: [] } and the filled save validates; a tampered ribbon list rebuilds to its known ids on load',
    filled.contest && JSON.stringify(filled.contest.ribbons) === '[]' && SCH.validateSave(filled).ok
    && (() => { const t = clone(defaultState()); t.contest = { ribbons: ['verdanturf', 'bogus', 'verdanturf'] };
      const m = SCH.migrate(t); return JSON.stringify(m.contest.ribbons) === JSON.stringify(['verdanturf']); })());
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A12 gen-tables (quintet 4/5): tables.json in sync and carries ribbons = the four Hoenn hall ids + the four Hearthome rank ribbons (emitted from src/data/contest.mjs, never hand-edited; S4 supersession)',
    checkOut.includes('tables.json OK') && JSON.stringify(t.ribbons) === JSON.stringify(C.CONTEST_RIBBONS), checkOut.trim());
  const cloud = clone(defaultState());
  cloud.player.name = 'ASH'; cloud.player.rivalName = 'GARY';
  cloud.story.arc = 'hoenn'; cloud.story.region = 'hoenn';
  cloud.contest.ribbons = ['verdanturf', 'lilycove'];
  cloud.party = [makeMon('charizard', 250, SPECIES, ALL_MOVES)];
  const rv = VAL.validateSave(clone(cloud));
  ok('A13 server validator (quintet 5/5) accepts a save holding ribbons (unordered pair + a Lv250 Hoenn-band mon)',
    rv.ok && rv.errors.length === 0, JSON.stringify(rv.errors));
  const badCloud = clone(cloud); badCloud.contest.ribbons = ['verdanturf', 'verdanturf'];
  const badCloud2 = clone(cloud); badCloud2.contest.ribbons = ['evergrande'];
  const badCloud3 = clone(cloud); badCloud3.contest = 'verdanturf';
  ok('A14 server validator rejects a duplicated ribbon (bad-ribbon), an unknown hall (bad-ribbon), and a non-object contest (bad-contest)',
    VAL.validateSave(badCloud).errors.includes('bad-ribbon')
    && VAL.validateSave(badCloud2).errors.includes('bad-ribbon')
    && VAL.validateSave(badCloud3).errors.includes('bad-contest'),
    JSON.stringify(VAL.validateSave(badCloud).errors));
  const preH5Cloud = clone(cloud); delete preH5Cloud.contest;
  ok('A15 server validator accepts a pre-H5 save with no contest key at all (optionality — the cloud never strands a legacy save)',
    VAL.validateSave(preH5Cloud).ok, JSON.stringify(VAL.validateSave(preH5Cloud).errors));
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
const gameJs = buildGameJs();
const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
globalThis.__SEED__ = 20261029;
globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };

const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('JS-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('js-pass ' + name);
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
  function drain(g) { var n = 0; while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && n < 500) { pA(g); n++; } }
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
  function contestMon(id, moves) {
    var m = makeMon(id, 250, SPECIES, MOVES);
    m.moves = moves.map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; });
    return m;
  }
  // Drive one full contest from the reception counter: sysInteract on
  // the counter tile (9,2), pick party slot pickIdx, then pick move
  // slot moveIdx every round until the scene pops.
  function driveContest(g, ow, pickIdx, moveIdx) {
    ow.sysInteract(9, 2);
    var guard = 0, sawContest = false, moveMenus = 0;
    while (guard++ < 4000) {
      if (g.scenes.top instanceof ContestScene) sawContest = true;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (m.title === 'Enter which Kin?') { g.ui.debugChoose(pickIdx); tk(g, 3); continue; }
        if (m.title === 'Choose a move') { moveMenus++; g.ui.debugChoose(moveIdx); tk(g, 3); continue; }
        g.ui.debugChoose(0); tk(g, 3); continue;
      }
      if (g.scenes.top instanceof ContestScene) { tk(g, 2); continue; }
      if (g.scenes.top instanceof OverworldScene) break;
      tk(g, 2);
    }
    drain(g);
    return { sawContest: sawContest, moveMenus: moveMenus };
  }

  // ===== the pure engine, deterministically (bundle globals) =====
  {
    var mon = contestMon('charizard', ['hyperbeam', 'solarbeam', 'skyattack', 'swordsdance']);
    var st = createContest({ hall: 'verdanturf', playerMon: mon, playerName: 'ASH' });
    var rng = mulberry32(99);
    var allEv = [];
    while (!contestFinished(st)) { allEv = allEv.concat(performRound(st, 'hyperbeam', rng)); }
    var mathOk = allEv.length === 16 && allEv.every(function (ev) {
      var aj = MOVE_APPEAL[ev.moveId];
      return ev.gained === aj.appeal + ev.variance && ev.variance >= 0 && ev.variance <= 2 && ev.jammed === 0;
    });
    var totalsOk = st.entrants.every(function (e) {
      var sum = allEv.filter(function (ev) { return ev.entrant === e.key; }).reduce(function (s, ev) { return s + ev.gained; }, 0);
      return e.total === sum;
    });
    ok('B01 engine scoring math: 16 performances over 4 rounds; every gain == appeal (table) + variance 0..2; entrant totals == the sum of their event gains (no jam in the Verdanturf field)',
      mathOk && totalsOk);
    ok('B02 the headliner line is a guaranteed 1st (hyperbeam x4: player min 32 > any NPC max 28 — placement 1 by construction, seed-independent)',
      placementOf(st) === 1 && st.entrants[0].total >= 32);
  }
  {
    var mon2 = contestMon('magikarp', ['splash']);
    var st2 = createContest({ hall: 'verdanturf', playerMon: mon2, playerName: 'ASH' });
    var rng2 = mulberry32(99);
    while (!contestFinished(st2)) performRound(st2, 'splash', rng2);
    ok('B03 the flop line is a guaranteed loss (splash x4: player max 12 < any NPC min 16 — placement 4 by construction)',
      placementOf(st2) === 4 && st2.entrants[0].total <= 12);
  }
  {
    // The jam lever, A/B on one seed: sing (appeal 5, jam 2) vs splash.
    var run = function (moveId) {
      var m = contestMon('gengar', ['sing', 'splash']);
      var s = createContest({ hall: 'verdanturf', playerMon: m, playerName: 'ASH' });
      var r = mulberry32(4242);
      var evs = [];
      while (!contestFinished(s)) evs = evs.concat(performRound(s, moveId, r));
      return { s: s, evs: evs };
    };
    var jamRun = run('sing'), flopRun = run('splash');
    var jammedTotal = jamRun.evs.reduce(function (s, ev) { return s + ev.jammed; }, 0);
    var npcTotal = function (s) { return s.entrants.slice(1).reduce(function (x, e) { return x + e.total; }, 0); };
    var jamEvents = jamRun.evs.filter(function (ev) { return ev.jammed > 0; });
    var reconOk = jamEvents.every(function (ev) {
      var target = jamRun.s.entrants.find(function (e) { return e.key === ev.jamTarget; });
      var gains = jamRun.evs.filter(function (x) { return x.entrant === ev.jamTarget; }).reduce(function (s2, x) { return s2 + x.gained; }, 0);
      var cuts = jamRun.evs.filter(function (x) { return x.jamTarget === ev.jamTarget; }).reduce(function (s2, x) { return s2 + x.jammed; }, 0);
      return target && target.total === gains - cuts && ev.jammed <= 2;
    });
    ok('B04 JAM changes the standing: on one seed, sing jams the round leader (jammed total > 0) and the NPC field scores EXACTLY that much less than the splash control; every jammed total reconciles event-by-event',
      jammedTotal > 0 && npcTotal(flopRun.s) - npcTotal(jamRun.s) === jammedTotal && reconOk,
      'jammed=' + jammedTotal);
    // A single hand-built performance: the leader so far loses exactly
    // the jam, capped by their round gain; a leader cannot jam itself.
    var m3 = contestMon('gengar', ['sing']);
    var s3 = createContest({ hall: 'slateport', playerMon: m3, playerName: 'ASH' });
    var lead = s3.entrants[1];
    var ev0 = resolvePerformance(s3, lead, 'surf', mulberry32(5));
    var before = lead.total;
    var evJ = resolvePerformance(s3, s3.entrants[0], 'sing', mulberry32(5));
    ok('B05 resolvePerformance: sing jams the round leader so far by exactly min(jam 2, their round gain); the leader\\'s total drops by that cut and the event names the target',
      evJ.jamTarget === lead.key && evJ.jammed === Math.min(2, ev0.gained) && lead.total === before - evJ.jammed && evJ.gained === 5 + evJ.variance);
    var s4 = createContest({ hall: 'slateport', playerMon: m3, playerName: 'ASH' });
    var evSelf = resolvePerformance(s4, s4.entrants[0], 'sing', mulberry32(5));
    ok('B06 a jam played with nobody ahead fizzles (first performer of the round: no target, no cut — you cannot jam yourself)',
      evSelf.jamTarget === null && evSelf.jammed === 0);
  }

  // ===== THE TRUE PATH: counter -> pick -> stage -> ribbon =====
  var g = mkGame(7331); boot(g);
  var st = g.state;
  st.story.arc = 'hoenn'; st.story.region = 'hoenn';
  st.story.flags.may_ribbon_verdanturf = true; // H4's story dressing
  st.party = [
    contestMon('charizard', ['hyperbeam', 'solarbeam', 'skyattack', 'swordsdance']),
    contestMon('magikarp', ['splash']),
  ];
  var ow = gotoMap(g, 'contest-verdanturf', 8, 10);
  ok('B07 the seam is the counter tile only: interacting with open floor (5,5) in a contestHall map opens nothing (no scene change, no menu)',
    (function () { var topBefore = g.scenes.top; ow.sysInteract(5, 5); tk(g, 2); return g.scenes.top === topBefore && !g.ui.menuOpen; })());
  var r1 = driveContest(g, ow, 0, 0);
  ok('B08 the Verdanturf contest runs end-to-end on the battle presentation (ContestScene entered from the counter, exactly 4 Choose-a-move menus — one per round, real moveset)',
    r1.sawContest && r1.moveMenus === 4 && g.scenes.top instanceof OverworldScene,
    'menus=' + r1.moveMenus);
  ok('B09 FIRST PLACE persists the Verdanturf Ribbon (state.contest.ribbons == [verdanturf]) and May\\'s story ribbon flag is untouched by the player\\'s win',
    JSON.stringify(st.contest.ribbons) === JSON.stringify(['verdanturf'])
    && st.story.flags.may_ribbon_verdanturf === true && Object.keys(st.story.flags).filter(function (k) { return k.indexOf('may_') === 0; }).length === 1,
    JSON.stringify(st.contest));
  {
    var roundTrip = migrate(JSON.parse(JSON.stringify(st)));
    ok('B10 the winning save round-trips the client schema (migrate + validateSave clean, ribbon intact)',
      validateSave(roundTrip).ok && JSON.stringify(roundTrip.contest.ribbons) === JSON.stringify(['verdanturf']),
      JSON.stringify(validateSave(roundTrip).errors));
  }
  var r2 = driveContest(g, ow, 0, 0);
  ok('B11 re-enter the same hall and win again: the encore plays (4 more move menus) and the ribbon is NOT duplicated',
    r2.sawContest && r2.moveMenus === 4 && JSON.stringify(st.contest.ribbons) === JSON.stringify(['verdanturf']));
  ow = gotoMap(g, 'contest-slateport', 8, 10);
  var r3 = driveContest(g, ow, 0, 0);
  ok('B12 a second hall awards its own ribbon (Slateport — ribbons are an unordered set across halls)',
    r3.sawContest && JSON.stringify(st.contest.ribbons) === JSON.stringify(['verdanturf', 'slateport']),
    JSON.stringify(st.contest.ribbons));
  ow = gotoMap(g, 'contest-verdanturf', 8, 10);
  var r4 = driveContest(g, ow, 1, 0);
  ok('B13 the loss path: Magikarp\\'s Splash act places without a ribbon (contest completes, ribbons unchanged, no flag or state damage)',
    r4.sawContest && r4.moveMenus === 4 && JSON.stringify(st.contest.ribbons) === JSON.stringify(['verdanturf', 'slateport'])
    && st.party[1].hp === st.party[1].maxHp,
    JSON.stringify(st.contest.ribbons));
  globalThis.__CONTEST_Q__ = Q;
})();`;

let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__CONTEST_Q__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) { if (r.pass) pass++; else fail++; }
  console.log('Part B: ' + QB.results.filter((r) => r.pass).length + '/' + QB.results.length + ' passed');
}

console.log('\nhoenn-contest: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
