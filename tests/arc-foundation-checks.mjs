// arc-foundation-checks.mjs — ADR-027 Stage F (arc foundation) proofs.
// Part A: pure units — the ARCS registry's integrity, the cap/horizon
// helpers, the arc-state derivation, the legacy-save fill (a pre-
// foundation save opens with derived defaults, no data loss), the
// client + server validators over the new story fields, and the pure
// ferry-network rule. Part B: the built bundle in a headless Game —
// the directive lifecycle end to end (Kanto completion -> ARC COMPLETE
// card fires once -> directive pinned in the Quest Log -> homecoming
// clears it, sets arc='orange', stamps the snapshots), the sealed-
// next-arc homecoming, ferry gating with the existing maps (outbound
// locked pre-embark, return never gated), the HUD pill horizon, the
// dex header lines, the Journey arc grouping, the Rare Candy cap read,
// and runEnding's handoff to the machine.
// Run: node tests/arc-foundation-checks.mjs   (exit 1 on any failure)

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

// ================= Part A: pure units =================
const A = await import(join(ROOT, 'src/data/arcs.mjs'));
const { ARCS, arcById, arcForChapter, nextArcOf, currentArcOf, levelCapFor, dexHorizonFor, arcDexSpan, arcStateOf, PLATINUM_DEX_HORIZON } = A;
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const GA = await import(join(ROOT, 'src/game/arcs.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

const clone = (o) => JSON.parse(JSON.stringify(o));
function stateWith(mut) { const s = defaultState(); if (mut) mut(s); return s; }

// -- registry integrity --
{
  ok('A01 registry ids unique, labels are Arc N / Arc N.5',
    new Set(ARCS.map((a) => a.id)).size === ARCS.length
    && ARCS.every((a) => /^Arc \d+(\.5)?$/.test(a.label)));
  const seen = [];
  for (const a of ARCS) seen.push(...a.chapters);
  ok('A02 every chapter 1-13 in exactly one arc',
    seen.length === 13 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].every((n) => seen.filter((x) => x === n).length === 1),
    seen.join(','));
  ok('A03 horizons monotonic 151<=151<=251<=386<=386<=493<=1025 (future rows at the 1025 frame)',
    JSON.stringify(ARCS.map((a) => a.dexHorizon)) === JSON.stringify([151, 151, 251, 386, 386, 493, 1025, 1025, 1025, 1025, 1025]),
    ARCS.map((a) => a.dexHorizon).join(','));
  ok('A04 bands cumulative: max = 100 x bandIndex, min = previous max + 1; Frontier open (null)',
    ARCS.filter((a) => a.band).every((a) => a.band.max === 100 * a.band.bandIndex && a.band.min === (a.band.bandIndex - 1) * 100 + 1)
    && arcById('frontier').band === null);
  ok('A05 Orange SHARES Kanto\'s band object values (Amendment 2)',
    JSON.stringify(arcById('orange').band) === JSON.stringify(arcById('kanto').band)
    && arcById('orange').band.bandIndex === 1);
  ok('A06 Platinum horizon is the Sinnoh row\'s 493; every row carries summary + completion data',
    PLATINUM_DEX_HORIZON === 493 && arcById('sinnoh').dexHorizon === 493
    && ARCS.every((a) => a.summaryLines.length >= 1 && Array.isArray(a.hookLines) && typeof a.completionKey === 'string' && typeof a.completionFlag === 'string'));
  ok('A07 Kanto is the shipped origin (no embark port); Orange embarks vermilion -> valencia',
    arcById('kanto').status === 'shipped' && arcById('kanto').embarkPort === null
    && arcById('orange').embarkPort === 'vermilion' && arcById('orange').arrivalMap === 'valencia'
    && arcById('johto').embarkPort === 'pallet');
}

// -- helpers vs states --
{
  ok('A08 levelCapFor: fresh 100, johto 200, hoenn 300, sinnoh 400, frontier Infinity (open-level convention)',
    levelCapFor(defaultState()) === 100
    && levelCapFor(stateWith((s) => { s.story.arc = 'johto'; })) === 200
    && levelCapFor(stateWith((s) => { s.story.arc = 'hoenn'; })) === 300
    && levelCapFor(stateWith((s) => { s.story.arc = 'sinnoh'; })) === 400
    && levelCapFor(stateWith((s) => { s.story.arc = 'frontier'; })) === Infinity);
  ok('A09 dexHorizonFor follows the current arc (151 / 251 / 386 / 493)',
    dexHorizonFor(defaultState()) === 151
    && dexHorizonFor(stateWith((s) => { s.story.arc = 'johto'; })) === 251
    && dexHorizonFor(stateWith((s) => { s.story.arc = 'frontier'; })) === 386
    && dexHorizonFor(stateWith((s) => { s.story.arc = 'sinnoh'; })) === 493);
  ok('A10 arcForChapter + nextArcOf chain (1 kanto, 2 orange, 5 johto, 7 frontier, 13 horizons; horizons is last)',
    arcForChapter(1).id === 'kanto' && arcForChapter(2).id === 'orange' && arcForChapter(5).id === 'johto'
    && arcForChapter(7).id === 'frontier' && arcForChapter(13).id === 'horizons'
    && nextArcOf('kanto').id === 'orange' && nextArcOf('orange').id === 'johto' && nextArcOf('horizons') === null);
  ok('A11 regional spans: kanto 1-151, orange shares 1-151, johto 152-251, frontier shares hoenn 252-386, sinnoh 387-493',
    JSON.stringify(arcDexSpan(arcById('kanto'))) === JSON.stringify({ lo: 1, hi: 151 })
    && JSON.stringify(arcDexSpan(arcById('orange'))) === JSON.stringify({ lo: 1, hi: 151 })
    && JSON.stringify(arcDexSpan(arcById('johto'))) === JSON.stringify({ lo: 152, hi: 251 })
    && JSON.stringify(arcDexSpan(arcById('frontier'))) === JSON.stringify({ lo: 252, hi: 386 })
    && JSON.stringify(arcDexSpan(arcById('sinnoh'))) === JSON.stringify({ lo: 387, hi: 493 }));
  ok('A12 currentArcOf falls back to Arc 1 on a field-less state',
    currentArcOf({ story: {} }).id === 'kanto' && currentArcOf(null).id === 'kanto');
}

// -- arcStateOf matrix --
{
  const fresh = defaultState();
  ok('A13 fresh state: kanto current, orange + johto sealed',
    arcStateOf(fresh, 'kanto') === 'current' && arcStateOf(fresh, 'orange') === 'sealed' && arcStateOf(fresh, 'johto') === 'sealed');
  const done = stateWith((s) => { s.story.regionsDone = ['kanto']; s.story.arc_directive = 'orange'; });
  ok('A14 Kanto complete + directive: kanto complete, orange locked-next',
    arcStateOf(done, 'kanto') === 'complete' && arcStateOf(done, 'orange') === 'locked-next');
  const after = stateWith((s) => { s.story.regionsDone = ['kanto']; s.story.arc = 'orange'; });
  ok('A15 post-homecoming: orange current, johto sealed (its registry status is sealed this build)',
    arcStateOf(after, 'orange') === 'current' && arcStateOf(after, 'johto') === 'sealed');
}

// -- summary builder (pure) --
{
  const s = stateWith((st) => {
    st.badges.kanto = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];
    st.dex.caught = { 1: true, 25: true, 150: true };
    st.story.hof = [{ team: [{ speciesId: 'bulbasaur', level: 63, nickname: null }], badges: 8 }];
    st.player.playtimeSec = 7200; st.story.arcStartPlaytime = 3600;
  });
  const sum = GA.arcCompleteSummary(s, arcById('kanto'));
  ok('A16 ARC COMPLETE summary: badges 8/8, dex gained 3, national 3/151, playtime 1h 0m, HoF team line, forward names Arc 1.5 + Pallet',
    sum.badgeLine === 'Badges: 8/8' && sum.dexGained === 3 && sum.dexLine.includes('National: 3/151')
    && sum.playtimeLine === 'Playtime this arc: 1h 0m' && sum.teamLine.includes('BUDDIN Lv63')
    && sum.forwardLine.includes('Arc 1.5') && sum.forwardLine.includes('Pallet Town'),
    JSON.stringify(sum));
}

// -- ferry rule (pure) --
{
  const npc = { ferry: 'valencia', ferryArc: 'orange' };
  ok('A17 ferry rule: outbound locked pre-embark; embark unlocks; reachedarc unlocks; reached arrival map unlocks; plain ferry untouched',
    GA.arcFerryAllowed(defaultState(), npc).allowed === false
    && GA.arcFerryAllowed(stateWith((s) => { s.story.flags.embark_orange = true; }), npc).allowed === true
    && GA.arcFerryAllowed(stateWith((s) => { s.story.flags.reachedarc_orange = true; }), npc).allowed === true
    && GA.arcFerryAllowed(stateWith((s) => { s.story.flags.reached_valencia = true; }), npc).allowed === true
    && GA.arcFerryAllowed(defaultState(), { ferry: 'cinnabar' }).allowed === true);
}

// -- legacy-save fill --
function legacyFixture(mut) {
  const s = defaultState();
  delete s.story.arc; delete s.story.arc_directive; delete s.story.arcDexStart; delete s.story.arcStartPlaytime;
  if (mut) mut(s);
  return clone(s); // stored bytes: JSON round-trip, exactly what load() reads
}
{
  const mid = SCH.migrate(legacyFixture());
  ok('A18 legacy mid-Kanto save derives arc kanto, no directive, zero snapshots — and validates',
    mid.story.arc === 'kanto' && mid.story.arc_directive === null
    && mid.story.arcDexStart === 0 && mid.story.arcStartPlaytime === 0
    && SCH.validateSave(mid).ok, JSON.stringify(SCH.validateSave(mid).errors));
  const doneHof = SCH.migrate(legacyFixture((s) => {
    s.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }], badges: 8 }];
    s.story.flags.champion = true;
    s.dex.caught = { 1: true, 3: true };
    s.party = [{ speciesId: 'venusaur', level: 63, nickname: null, xp: 1, moves: [], keepsake: null }];
  }));
  ok('A19 legacy Kanto-complete save (HoF + champion flag, regionsDone still empty as shipped) derives the pending Orange directive',
    doneHof.story.arc === 'kanto' && doneHof.story.arc_directive === 'orange'
    && doneHof.story.arcDexStart === 0 && SCH.validateSave(doneHof).ok,
    JSON.stringify({ arc: doneHof.story.arc, dir: doneHof.story.arc_directive, errs: SCH.validateSave(doneHof).errors }));
  ok('A20 legacy derivation loses nothing: party + dex survive the fill byte-for-byte',
    doneHof.party.length === 1 && doneHof.party[0].speciesId === 'venusaur'
    && doneHof.dex.caught[1] === true && doneHof.dex.caught[3] === true && doneHof.story.hof.length === 1);
  const doneRegions = SCH.migrate(legacyFixture((s) => { s.story.regionsDone = ['kanto']; }));
  ok('A21 legacy save with kanto in regionsDone (and nothing else) derives the same pending directive',
    doneRegions.story.arc_directive === 'orange' && doneRegions.story.arc === 'kanto');
  const postHook = SCH.migrate(legacyFixture((s) => {
    s.story.arc = 'orange'; s.story.flags.hook_orange = true; s.dex.caught = { 1: true, 2: true, 3: true };
  }));
  ok('A22 post-homecoming save: directive is NOT re-derived, arc stays orange, snapshots default to current totals',
    postHook.story.arc === 'orange' && postHook.story.arc_directive === null && postHook.story.arcDexStart === 3);
  const bogus = stateWith((s) => { s.story.arc = 'bogus'; });
  ok('A23 client schema rejects an unknown arc id',
    SCH.validateSave(clone(bogus)).errors.includes('bad-story-arc'),
    JSON.stringify(SCH.validateSave(clone(bogus)).errors));
}

// -- server validator + tables --
{
  const fresh = clone(defaultState());
  const r = VAL.validateSave(fresh);
  ok('A24 server validator accepts a fresh default save carrying the new arc fields',
    r.ok && r.errors.length === 0, JSON.stringify(r.errors));
  const bad1 = clone(defaultState()); bad1.story.arc = 'bogus';
  const bad2 = clone(defaultState()); bad2.story.arcDexStart = 2000;
  const okDir = clone(defaultState()); okDir.story.arc_directive = 'johto';
  ok('A25 server validator: unknown arc rejected, out-of-range arcDexStart rejected, a real directive accepted',
    VAL.validateSave(bad1).errors.includes('bad-arc')
    && VAL.validateSave(bad2).errors.includes('bad-arc-dex-start')
    && VAL.validateSave(okDir).ok, JSON.stringify(VAL.validateSave(bad1).errors));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A26 tables.json in sync and carries the registry arc ids',
    checkOut.includes('tables.json OK') && JSON.stringify(t.arcs) === JSON.stringify(ARCS.map((a) => a.id)),
    checkOut.trim());
  const migrated = SCH.migrate(legacyFixture((s) => {
    s.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }], badges: 8 }];
    s.story.flags.champion = true; s.player.name = 'ASH'; s.player.rivalName = 'GARY';
  }));
  const rv = VAL.validateSave(migrated);
  ok('A27 a migrated legacy completed save passes the SERVER validator (client fill and cloud agree)',
    rv.ok && rv.errors.length === 0, JSON.stringify(rv.errors));
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
    if (!cond) { Q.failures++; console.error('AF-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('af-pass ' + name);
  }
  function mkGame(seed) {
    globalThis.__QFRESET__();
    globalThis.__SEED__ = seed;
    var g = new Game(null);
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
  function pickVal(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
  }
  function gotoMap(g, map, x, y) {
    g.state.story.position = { map: map, x: x, y: y, dir: 'down' };
    var ow = new OverworldScene();
    g.scenes.replace(ow); ow.enter(); tk(g, 4);
    return ow;
  }
  var BADGES8 = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];

  // ---- B1: Kanto completion -> card fires once -> directive pinned ----
  var g1 = mkGame(201); var ow1 = boot(g1);
  var st1 = g1.state;
  st1.badges.kanto = BADGES8.slice();
  st1.story.flags.champion = true;
  st1.party = [makeMon('venusaur', 63, SPECIES, MOVES), makeMon('partner', 65, SPECIES, MOVES)];
  st1.dex.caught = { 1: true, 3: true, 25: true };
  st1.player.playtimeSec = 7200;
  var fired1 = checkArcCompletion(g1);
  var cardText = g1.ui.dlg ? g1.ui.dlg.lines.join(' | ') : '';
  ok('B01 completion fires the ARC COMPLETE card (title + forward line name Arc 1.5 and Pallet)',
    fired1 === true && cardText.includes('ARC 1') && cardText.includes('COMPLETE') && cardText.includes('Arc 1.5'),
    cardText.slice(0, 200));
  drain(g1);
  ok('B02 firing recorded regionsDone + pinned the directive + stamped the fire-once flag',
    st1.story.regionsDone.includes('kanto') && st1.story.arc_directive === 'orange'
    && st1.story.flags.arc_card_kanto === true);
  ok('B03 the card fires ONCE: a second check is a silent no-op',
    checkArcCompletion(g1) === false && !g1.ui.dialogueOpen);

  // ---- B2: the pinned Quest Log directive ----
  g1.openQuestLog();
  var pin = g1.ui.menu.items.find(function (it) { return it.value === 'arcdirective'; });
  ok('B04 Quest Log pins ★ Go home as its first actionable entry while the directive is set',
    !!pin && pin.label.includes('Go home — return to Pallet Town')
    && g1.ui.menu.items.findIndex(function (it) { return it.value === 'arcdirective'; }) < g1.ui.menu.items.findIndex(function (it) { return String(it.value || '').indexOf('q:') === 0; }),
    g1.ui.menu.items.map(function (i) { return i.label; }).join(' / ').slice(0, 200));
  pickVal(g1, 'arcdirective');
  var dirText = g1.ui.dlg ? g1.ui.dlg.lines.join(' | ') : '';
  ok('B05 selecting the directive shows the next arc + who waits at home',
    dirText.includes('Orange Islands') && dirText.includes('Hawthorn'), dirText.slice(0, 200));
  drain(g1); pickVal(g1, 'close'); tk(g1, 2);

  // ---- B3: the homecoming (Kanto -> Orange) ----
  st1.dex.caught = { 1: true, 3: true, 25: true, 150: true };
  var owH = gotoMap(g1, 'house-pallet-ash', 4, 4);
  drain(g1);
  ok('B06 homecoming at Mom\\'s house: arc advances to orange, directive cleared, hook + embark set',
    st1.story.arc === 'orange' && st1.story.arc_directive === null
    && st1.story.flags.hook_orange === true && st1.story.flags.embark_orange === true
    && st1.story.flags.homecoming_orange === true,
    JSON.stringify({ arc: st1.story.arc, dir: st1.story.arc_directive, hook: st1.story.flags.hook_orange, emb: st1.story.flags.embark_orange }));
  ok('B07 homecoming stamps the arc-start snapshots (dex count + playtime) and the region',
    st1.story.arcDexStart === 4 && st1.story.arcStartPlaytime === 7200 && st1.story.region === 'orange',
    JSON.stringify({ d: st1.story.arcDexStart, p: st1.story.arcStartPlaytime, r: st1.story.region }));
  var owH2 = gotoMap(g1, 'house-pallet-ash', 4, 4);
  ok('B08 homecoming fires once: re-entering the house is quiet',
    !g1.ui.dialogueOpen);

  // ---- B4: Johto homecoming (Orange complete -> Johto) ----
  // SUPERSEDED at Stage J4a: the Johto registry row flipped
  // 'sealed' -> 'shipped', so this homecoming now takes the SHIPPED
  // branch of the same machine (the sealed branch's last live proof
  // was this test at Foundation time): hook delivered, directive
  // cleared, the embark IS armed and story.arc advances to johto.
  var g2 = mkGame(202); var ow2 = boot(g2);
  var st2 = g2.state;
  st2.story.arc = 'orange';
  st2.story.regionsDone = ['kanto', 'orange'];
  st2.story.arc_directive = 'johto';
  st2.story.flags.arc_card_orange = true; // isolate: the Orange card already played
  gotoMap(g2, 'house-pallet-ash', 4, 4);
  drain(g2);
  ok('B09 shipped homecoming completes the ritual: hook delivered, directive cleared, embark armed, arc advances to johto (Stage J4a supersedes the sealed-branch assertion)',
    st2.story.arc_directive === null && st2.story.flags.hook_johto === true
    && st2.story.flags.embark_johto === true && st2.story.arc === 'johto',
    JSON.stringify({ arc: st2.story.arc, hook: st2.story.flags.hook_johto, emb: st2.story.flags.embark_johto }));

  // ---- B5: ferry gating with the existing maps ----
  var g3 = mkGame(203); var ow3 = boot(g3);
  var npcOut = { name: 'FERRY TEST', dialogue: ['Test ferry, one crossing.'], ferry: 'vermilion', ferryArc: 'orange', x: 0, y: 0 };
  ow3.sysNpc(npcOut); drain(g3);
  ok('B10 arc ferry outbound stays gated before the embark (no menu, still in Pallet)',
    ow3.mapId === 'pallet' && !g3.ui.menuOpen, 'map=' + ow3.mapId + ' menu=' + g3.ui.menuOpen);
  g3.state.story.flags.embark_orange = true;
  ow3.sysNpc(npcOut); drain(g3);
  var sailMenu = g3.ui.menuOpen && g3.ui.menu.title.indexOf('Sail to vermilion') === 0;
  pickVal(g3, 'yes'); drain(g3);
  ok('B11 after the embark, the crossing sails (en-route card, then landing) and stamps reachedarc',
    sailMenu === true && ow3.mapId === 'vermilion' && g3.state.story.flags.reachedarc_orange === true,
    'map=' + ow3.mapId + ' reached=' + g3.state.story.flags.reachedarc_orange);
  delete g3.state.story.flags.embark_orange;
  var npcBack = { name: 'FERRY BACK', dialogue: ['Homeward ferry.'], ferry: 'pallet', ferryArc: 'orange', x: 0, y: 0 };
  ow3.sysNpc(npcBack); drain(g3);
  var backMenu = g3.ui.menuOpen && g3.ui.menu.title.indexOf('Sail to pallet') === 0;
  pickVal(g3, 'yes'); drain(g3);
  ok('B12 the return leg never gates: with the embark flag deleted, a reached region sails home freely',
    backMenu === true && ow3.mapId === 'pallet', 'map=' + ow3.mapId);

  // ---- B6: HUD pill horizon ----
  var g4 = mkGame(204); var ow4 = boot(g4);
  g4.state.dex.caught = { 1: true, 4: true };
  var chip = '';
  g4.ui.setDexChip = function (t) { chip = t; };
  ow4._hudDex = null; ow4.syncHud();
  ok('B13 HUD pill reads the current arc horizon: Dex 2/151 (not the 1025 frame)', chip === 'Dex 2/151', chip);

  // ---- B7: dex screen header lines + sealed divider ----
  g4.openDex();
  var labels4 = g4.ui.menu.items.map(function (i) { return i.label; });
  ok('B14 dex header: chapter row still first, Regional + National (Platinum 493) lines present, sealed divider before Close',
    labels4[0].indexOf('Journey — Ch.') === 0
    && labels4.some(function (l) { return l === 'Regional — Kanto: 2/151'; })
    && labels4.some(function (l) { return l === 'National — Platinum horizon: 2/493 (0%)'; })
    && labels4[labels4.length - 2].includes('future arcs') && labels4[labels4.length - 1] === 'Close',
    labels4.slice(0, 6).join(' / '));

  // ---- B8: Journey arc grouping ----
  var g5 = mkGame(205); boot(g5);
  g5.openJourney();
  var labels5 = g5.ui.menu.items.map(function (i) { return i.label; });
  ok('B15 Journey groups chapters under arc headers with state (Arc 1 CURRENT, Future arcs SEALED), chapter rows intact',
    labels5.some(function (l) { return l.includes('ARC 1 · KANTO') && l.includes('CURRENT'); })
    && labels5.some(function (l) { return l.includes('FUTURE ARCS') && l.includes('SEALED'); })
    && labels5.some(function (l) { return l.includes('Ch.1 — The Indigo League'); })
    && labels5.some(function (l) { return l.includes('Ch.13 — Horizons'); }),
    labels5.join(' / ').slice(0, 300));
  g5.state.story.regionsDone = ['kanto'];
  g5.openJourney();
  var labels5b = g5.ui.menu.items.map(function (i) { return i.label; });
  ok('B16 with Kanto done, the headers read Arc 1 COMPLETE and Arc 1.5 NEXT',
    labels5b.some(function (l) { return l.includes('ARC 1 · KANTO') && l.includes('COMPLETE'); })
    && labels5b.some(function (l) { return l.includes('ARC 1.5 · ORANGE ISLANDS') && l.includes('NEXT'); }),
    labels5b.join(' / ').slice(0, 300));

  // ---- B9: Rare Candy cap is a registry read ----
  var g6 = mkGame(206); boot(g6);
  g6.state.bag.rarecandy = 2;
  g6.state.party = [makeMon('pidgey', 100, SPECIES, MOVES)];
  g6.useBagItem('rarecandy');
  var rowCap = g6.ui.menu.items[0];
  ok('B17 Rare Candy target disabled at the Arc 1 cap (Lv100) — shipped behaviour, via the registry',
    rowCap.disabled === true, JSON.stringify(rowCap));
  pickVal(g6, -1);
  g6.state.story.arc = 'johto';
  g6.useBagItem('rarecandy');
  var rowCap2 = g6.ui.menu.items[0];
  ok('B18 with story.arc = johto (band 101-200), the same Lv100 mon is no longer capped',
    rowCap2.disabled === false, JSON.stringify(rowCap2));
  pickVal(g6, -1);

  // ---- B10: runEnding hands off to the machine (bridge-card replacement) ----
  var g7 = mkGame(207); var ow7 = boot(g7);
  var st7 = g7.state;
  st7.badges.kanto = BADGES8.slice();
  st7.party = [makeMon('venusaur', 63, SPECIES, MOVES), makeMon('partner', 65, SPECIES, MOVES)];
  var endingDone = false;
  ow7.runEnding(function () { endingDone = true; });
  drain(g7);
  ok('B19 runEnding: HoF recorded, then the machine fired (regionsDone + directive), chain resumed after the card',
    st7.story.hof.length === 1 && st7.story.regionsDone.includes('kanto')
    && st7.story.arc_directive === 'orange' && endingDone === true,
    JSON.stringify({ hof: st7.story.hof.length, done: st7.story.regionsDone, dir: st7.story.arc_directive, cb: endingDone }));

  globalThis.__AFQ__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__AFQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

console.log('\nARC FOUNDATION TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
