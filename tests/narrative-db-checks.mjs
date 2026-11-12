// tests/narrative-db-checks.mjs — Wave D (Phase 5): the narrative
// database's integrity gate. Standalone suite in the repo's checks style:
//   node tests/narrative-db-checks.mjs
// Part A (pure): schema shape, referential integrity against the shipped
// tables (every location is a real map, every dialogue event exists,
// every battle is a real trainer, every dependency resolves, no orphan
// chapters, canon flags well-formed), full coverage of the shipped story
// (all five quest chains, every legendary arc, every Town Tale, every
// Frontier facility, and every merged EVENTS id accounted for exactly
// once), plus drift checks that re-derive the mapping from the source
// tables so the DB cannot silently rot when story data changes.
// Part B (bundle): boots the built game headlessly and proves the Quest
// Log's STORY section reads chapter state from the DB, and that a
// chapter's dialogue hook dispatches through the shipped event runner.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0; const failures = [];
function ok(name, cond) { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));

// ---------- re-derive the shipped tables exactly as merge.mjs folds them ----------
const maps = {};
const TRAINERS = {};
for (let i = 1; i <= 9; i++) {
  const m = await D('maps' + (i === 1 ? '' : i) + '.mjs');
  Object.assign(maps, m['MAPS' + (i === 1 ? '' : i)]);
  for (const k of Object.keys(m)) if (k.startsWith('TRAINERS')) Object.assign(TRAINERS, m[k]);
}
const K = await D('story-kanto.mjs'); const O = await D('story-orange.mjs'); const J = await D('story-johto.mjs');
const H = await D('story-hoenn.mjs'); const S = await D('story-sinnoh.mjs');
Object.assign(TRAINERS, O.ORANGE_TRAINERS, J.JOHTO_TRAINERS, H.HOENN_TRAINERS, S.SINNOH_TRAINERS);
const EVENTS = Object.assign({}, K.EVENTS, O.ORANGE_EVENTS, J.JOHTO_EVENTS, H.HOENN_EVENTS, S.SINNOH_EVENTS);
const TALES = Object.assign({}, (await D('quests.mjs')).QUESTS, J.JOHTO_TALES, H.HOENN_TALES, S.SINNOH_TALES);
const LEGENDARY = Object.assign({}, K.LEGENDARY_ARCS, O.ORANGE_LEGENDARY_ARCS, J.JOHTO_LEGENDARY_ARCS, H.HOENN_LEGENDARY_ARCS, S.SINNOH_LEGENDARY_ARCS);
const CHAINS = { kanto: K.MAIN_QUESTS, orange: O.ORANGE_QUESTS, johto: J.JOHTO_QUESTS, hoenn: H.HOENN_QUESTS, sinnoh: S.SINNOH_QUESTS };
const { ARCS } = await D('arcs.mjs');
const { CHAPTERS: SPINE } = await D('story.mjs');
const { SPECIES } = await D('species.mjs');
Object.assign(SPECIES, (await D('species2.mjs')).SPECIES2, (await D('species3.mjs')).SPECIES_JOHTO,
  (await D('species4.mjs')).SPECIES_HOENN, (await D('species5.mjs')).SPECIES_SINNOH); // merge.mjs's fold
const { BOND_CHARACTERS } = await import(path.join(ROOT, 'src/game/bonds.mjs'));
const { FACILITIES, FACILITY_IDS } = await D('frontier.mjs');
const DB = await D('narrative-db.mjs');
const { NARRATIVE_ARCS, NARRATIVE_VOLUMES, NARRATIVE_CHAPTERS } = DB;

// ---------- the declared-flag universe ----------
// A flag is "declared" if some shipped mechanism can set it: an event
// step {flag}, a literal code assignment (flags.X = true), a badge win
// (battle.mjs derives badge_<name> from trainer defs), a map arrival
// (overworld-systems sets reached_<mapId>), or an NPC spec winFlag.
const declared = new Set();
for (const ev of Object.values(EVENTS)) {
  const steps = Array.isArray(ev) ? ev : (ev && ev.steps) || [];
  for (const s of steps) if (s && s.flag) declared.add(s.flag);
}
for (const t of Object.values(TRAINERS)) if (t.badge) declared.add('badge_' + t.badge.replace(/badge$/, ''));
for (const id of Object.keys(maps)) declared.add('reached_' + id);
for (const map of Object.values(maps)) for (const n of map.npcs || []) if (n.winFlag) declared.add(n.winFlag);
// Legendary step flags are produced by the arc machinery itself, driven
// by these very tables — the tables are their declaration.
for (const la of Object.values(LEGENDARY)) for (const s of la.steps || []) if (s && s.flag) declared.add(s.flag);
let gameSourceText = '';
{
  const files = [];
  const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.mjs')) files.push(p); } };
  walk(path.join(ROOT, 'src/game')); walk(path.join(ROOT, 'src/save')); walk(path.join(ROOT, 'src/engine'));
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    gameSourceText += src + '\n';
    for (const m of src.matchAll(/flags\.([A-Za-z0-9_]+)\s*=\s*true/g)) declared.add(m[1]);
    for (const m of src.matchAll(/flags\[['"]([A-Za-z0-9_]+)['"]\]\s*=\s*true/g)) declared.add(m[1]);
  }
}
// A flag is also declared when shipped code names it as a string literal
// (helper-arg producers, e.g. mayContest(..., 'may_slateport_done')) or
// reads it through the flags object — the name exists in the system.
const flagDeclared = (f) => declared.has(f) || gameSourceText.includes("'" + f + "'") || gameSourceText.includes('"' + f + '"') || new RegExp('flags\\.' + f + '\\b').test(gameSourceText);

// ---------- A1: schema shape + canon discipline ----------
const arcById = Object.fromEntries(NARRATIVE_ARCS.map((a) => [a.id, a]));
const volByN = Object.fromEntries(NARRATIVE_VOLUMES.map((v) => [v.n, v]));
const chById = Object.fromEntries(NARRATIVE_CHAPTERS.map((c) => [c.id, c]));
ok('A1 arc ids == arcs.mjs registry', NARRATIVE_ARCS.length === ARCS.length && ARCS.every((a) => arcById[a.id]));
ok('A1 volume ids == ADR-015 spine (story.mjs CHAPTERS)', NARRATIVE_VOLUMES.length === SPINE.length && SPINE.every((c) => NARRATIVE_VOLUMES.some((v) => v.id === c.id && v.n === c.n)));
ok('A1 arc volume lists == arcs.mjs chapters', ARCS.every((a) => JSON.stringify(arcById[a.id].volumes) === JSON.stringify(a.chapters.map((n) => (SPINE.find((c) => c.n === n) || {}).id))));
ok('A1 volume arcId matches the registry owner', NARRATIVE_VOLUMES.every((v) => { const owner = ARCS.find((a) => a.chapters.includes(v.n)); return owner && v.arcId === owner.id; }));
ok('A1 canon vocabulary is exactly {original, canon-structure}', [...NARRATIVE_ARCS, ...NARRATIVE_VOLUMES, ...NARRATIVE_CHAPTERS].every((e) => e.canon === 'original' || e.canon === 'canon-structure'));
ok('A1 sealed arcs are structure-only slots', NARRATIVE_ARCS.every((a) => (a.status === 'sealed') === (a.canon === 'canon-structure')));
ok('A1 every populated chapter is the game\'s own (canon: original)', NARRATIVE_CHAPTERS.every((c) => c.canon === 'original'));
ok('A1 sealed arcs carry no chapters', NARRATIVE_ARCS.filter((a) => a.status === 'sealed').every((a) => !NARRATIVE_CHAPTERS.some((c) => c.arcId === a.id)));
ok('A1 chapter ids unique', Object.keys(chById).length === NARRATIVE_CHAPTERS.length);
ok('A1 chapter kinds are the four documented kinds', NARRATIVE_CHAPTERS.every((c) => ['main', 'legendary', 'tale', 'facility'].includes(c.kind)));

// ---------- A2: referential integrity ----------
// Wave E closed the known-dead set: ev_scope_boss / ev_silph_boss named
// battle ids (rocket_admin_hideout / rocket_admin_silph) that no trainer
// table defined, and the engine's battle step skips unknown ids silently
// (overworld-systems: `if (!t0) { next(); }`), so both beats no-opped.
// The trainers now exist (maps3.mjs TRAINERS3), so the ledger is EMPTY:
// any unresolved battle reference from here on is a hard failure.
const KNOWN_UNRESOLVED_BATTLES = [];
let bad = [];
const unresolvedBattles = new Set();
for (const c of NARRATIVE_CHAPTERS) {
  if (!arcById[c.arcId]) bad.push(c.id + ':arc');
  if (!volByN[c.volume] || volByN[c.volume].arcId !== c.arcId) bad.push(c.id + ':volume');
  for (const m of c.locations || []) if (!maps[m]) bad.push(c.id + ':loc:' + m);
  for (const e of c.events || []) if (!EVENTS[e]) bad.push(c.id + ':ev:' + e);
  for (const b of [...(c.battles || []), ...(c.rivalBattles || [])]) if (!TRAINERS[b]) unresolvedBattles.add(b);
  for (const r of c.rivalBattles || []) if (!(c.battles || []).includes(r)) bad.push(c.id + ':rival-not-in-battles');
  for (const r of c.relationships || []) if (!BOND_CHARACTERS.some((b) => b.id === r)) bad.push(c.id + ':bond:' + r);
  for (const w of c.wildBattles || []) if (!SPECIES[w.species]) bad.push(c.id + ':wild:' + w.species);
  for (const d of c.requires || []) if (!chById[d]) bad.push(c.id + ':req:' + d);
}
ok('A2 every chapter reference resolves (arc/volume/maps/events/bonds/species/deps)', bad.length === 0);
if (bad.length) console.log('    ' + bad.slice(0, 12).join(', '));
ok('A2 battle references resolve (known-dead ledger is empty since Wave E)',
  JSON.stringify([...unresolvedBattles].sort()) === JSON.stringify(KNOWN_UNRESOLVED_BATTLES),
  [...unresolvedBattles].join(','));
ok('A2 live chapters have at least one real location (roaming arcs exempt)',
  NARRATIVE_CHAPTERS.every((c) => c.designedOnly || c.roaming || (c.locations || []).length > 0));
ok('A2 main-chapter completion flags are declared in the shipped flag system',
  NARRATIVE_CHAPTERS.filter((c) => c.kind === 'main' && c.flag).every((c) => flagDeclared(c.flag)));
ok('A2 requiresFlags are declared', NARRATIVE_CHAPTERS.every((c) => (c.requiresFlags || []).every((f) => flagDeclared(f))));
ok('A2 a live legendary chapter\'s completion flag is its source arc\'s final step flag',
  NARRATIVE_CHAPTERS.filter((c) => c.kind === 'legendary' && !c.designedOnly)
    .every((c) => { const steps = (LEGENDARY[c.id].steps || []).filter((x) => x && x.flag); return steps.length > 0 && c.flag === steps[steps.length - 1].flag; }));
ok('A2 facility chapters match frontier.mjs (slot, brain facility exists)',
  NARRATIVE_CHAPTERS.filter((c) => c.kind === 'facility')
    .every((c) => FACILITY_IDS[c.symbolSlot] && c.id === 'facility_' + FACILITY_IDS[c.symbolSlot] && FACILITIES[FACILITY_IDS[c.symbolSlot]]));
{ // dependency graph is acyclic
  const WHITE = 0, GRAY = 1, BLACK = 2; const color = new Map(NARRATIVE_CHAPTERS.map((c) => [c.id, WHITE]));
  let cyclic = false;
  const visit = (id) => { color.set(id, GRAY); for (const d of chById[id].requires || []) { if (color.get(d) === GRAY) cyclic = true; else if (color.get(d) === WHITE) visit(d); } color.set(id, BLACK); };
  for (const c of NARRATIVE_CHAPTERS) if (color.get(c.id) === WHITE) visit(c.id);
  ok('A2 chapter dependency graph is acyclic', !cyclic);
}

// ---------- A3: coverage of the shipped story + drift ----------
for (const [arcId, chain] of Object.entries(CHAINS)) {
  const dbChain = DB.mainChainOf(arcId);
  ok('A3 ' + arcId + ' main chain maps 1:1 in order (ids, flags, titles faithful)',
    dbChain.length === chain.length
    && dbChain.every((c, i) => c.id === chain[i].id && (c.flag || null) === (chain[i].flag || null) && c.title === chain[i].text)
    && dbChain.every((c, i) => JSON.stringify(c.requires || []) === JSON.stringify(i === 0 ? [] : [chain[i - 1].id])));
}
ok('A3 every merged LEGENDARY_ARCS entry has exactly one legendary chapter',
  Object.keys(LEGENDARY).every((id) => chById[id] && chById[id].kind === 'legendary')
  && NARRATIVE_CHAPTERS.filter((c) => c.kind === 'legendary').length === Object.keys(LEGENDARY).length);
ok('A3 designedOnly mirrors the source tables exactly',
  NARRATIVE_CHAPTERS.filter((c) => c.kind === 'legendary').every((c) => !!c.designedOnly === !!LEGENDARY[c.id].designedOnly));
ok('A3 every Town Tale has exactly one tale chapter (title faithful, located in its named town)',
  Object.keys(TALES).every((id) => chById[id] && chById[id].kind === 'tale' && chById[id].title === TALES[id].title
    && (chById[id].locations || []).some((m) => maps[m] && maps[m].name === TALES[id].town))
  && NARRATIVE_CHAPTERS.filter((c) => c.kind === 'tale').length === Object.keys(TALES).length);
ok('A3 every Frontier facility has exactly one facility chapter',
  FACILITY_IDS.every((f) => chById['facility_' + f]) && NARRATIVE_CHAPTERS.filter((c) => c.kind === 'facility').length === FACILITY_IDS.length);
{ // every merged event accounted for exactly once
  const seen = new Map();
  for (const c of NARRATIVE_CHAPTERS) for (const e of c.events || []) seen.set(e, (seen.get(e) || 0) + 1);
  for (const v of NARRATIVE_VOLUMES) for (const e of v.events || []) seen.set(e, (seen.get(e) || 0) + 1);
  const ids = Object.keys(EVENTS);
  ok('A3 every merged EVENTS id appears exactly once across chapters + volume pools (' + ids.length + ' events)',
    ids.every((id) => seen.get(id) === 1) && seen.size === ids.length,
    );
}
ok('A3 no orphan chapters: every chapter sits in a registry arc and one of its volumes',
  NARRATIVE_CHAPTERS.every((c) => arcById[c.arcId] && arcById[c.arcId].volumes.includes((volByN[c.volume] || {}).id)));
ok('A3 Johto volume seams: Fog Badge closes Vol 3, Rising Badge closes Vol 4, conference/Red in Vol 5',
  (chById.q_johto_fog || {}).volume === 3 && (chById.q_johto_rising || {}).volume === 4
  && (chById.q_johto_conference || {}).volume === 5 && (chById.q_johto_red || {}).volume === 5);
ok('A3 legendary chapters sit in their arc\'s last volume; tales in its first',
  NARRATIVE_CHAPTERS.filter((c) => c.kind === 'legendary').every((c) => {
    const vols = arcById[c.arcId].volumes;
    return DB.narrativeVolumeById(vols[vols.length - 1]).n === c.volume;
  })
  && NARRATIVE_CHAPTERS.filter((c) => c.kind === 'tale').every((c) => volByN[c.volume] && volByN[c.volume].id === arcById[c.arcId].volumes[0]));

// ---------- A4: helper behavior over synthetic states ----------
const fresh = () => ({ story: { arc: 'kanto', flags: {}, quests: {}, regionsDone: [], bonds: {} }, badges: { kanto: [], symbols: [] } });
{
  const st = fresh();
  ok('A4 fresh state: the opening chapter is current, the next is locked',
    DB.chapterStateOf(st, 'q_partner') === 'current' && DB.chapterStateOf(st, 'q_boulder') === 'locked'
    && DB.currentChapterOf(st).id === 'q_partner');
  st.story.flags.metPartner = true;
  ok('A4 completing the intro flag completes q_partner and advances the current chapter',
    DB.chapterStateOf(st, 'q_partner') === 'complete' && DB.currentChapterOf(st).id === 'q_boulder'
    && DB.nextObjectiveOf(st).chapterId === 'q_boulder');
  ok('A4 unreached arcs read locked; the roaming legendary reads available in a reached arc',
    DB.chapterStateOf(fresh(), 'q_johto_arrival') === 'locked'
    && DB.chapterStateOf(fresh(), 'arc_zapdos') === 'available'
    && DB.chapterStateOf(fresh(), 'arc_latias') === 'locked');
  const st2 = fresh(); st2.story.quests.arc_zapdos = 'complete'; st2.story.quests.tale_pallet = 1;
  ok('A4 legendary + tale state reads the story.quests ledger',
    DB.chapterStateOf(st2, 'arc_zapdos') === 'complete' && DB.chapterStateOf(st2, 'tale_pallet') === 'current');
  const st3 = fresh(); st3.badges.symbols = ['silver'];
  ok('A4 facility state reads the symbol slots (silver = current, gold = complete)',
    DB.chapterStateOf(st3, 'facility_tower') === 'current' && DB.chapterStateOf(st3, 'facility_factory') === 'locked');
  st3.badges.symbols = ['gold'];
  ok('A4 facility gold reads complete', DB.chapterStateOf(st3, 'facility_tower') === 'complete');
  ok('A4 designed stubs read designed; unknown ids read unknown',
    DB.chapterStateOf(fresh(), 'arc_victini') === 'designed' && DB.chapterStateOf(fresh(), 'nope') === 'unknown');
  const prog = DB.arcProgressOf(fresh(), 'kanto');
  ok('A4 arcProgressOf counts the Kanto DB (24 main / 6 legendary / 10 tales)',
    prog.main.total === 24 && prog.legendary.total === 6 && prog.tales.total === 10,
    JSON.stringify(prog));
}

// ---------- Part B: the built bundle, headless ----------
// The Quest Log's STORY section reads chapter state from the DB, and a
// chapter's dialogue hook dispatches through the shipped event runner.
const { buildGameJs } = await import(path.join(ROOT, 'scripts/build.mjs'));
const gameJs = buildGameJs();
{
  const memStore = {};
  globalThis.localStorage = {
    getItem: (k) => (k in memStore ? memStore[k] : null),
    setItem: (k, v) => { memStore[k] = String(v); },
    removeItem: (k) => { delete memStore[k]; },
  };
  globalThis.__SEED__ = 20261111;
  globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };
}
const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('NDB-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('ndb-pass ' + name);
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
  function storyRows(g) {
    return (g.ui.menu ? g.ui.menu.items : []).filter(function (it) { return it.value && it.value.indexOf('ndb:') === 0; });
  }

  // ---- B1: fresh journey — the STORY section reads the DB ----
  var g = mkGame(301); boot(g);
  ok('B1 the played intro completes the DB opening chapter (q_partner) and the current chapter is q_boulder',
    chapterStateOf(g.state, 'q_partner') === 'complete' && currentChapterOf(g.state).id === 'q_boulder',
    currentChapterOf(g.state) && currentChapterOf(g.state).id);
  ok('B1 nextObjectiveOf reads the DB: the Boulder Badge chapter is the objective',
    nextObjectiveOf(g.state).chapterId === 'q_boulder' && nextObjectiveOf(g.state).objective === 'Win the Boulder Badge in Pewter City');
  g.openQuestLog(); tk(g, 3);
  var rows = storyRows(g);
  ok('B1 Quest Log STORY section: exactly the reached arcs (Kanto only on a fresh journey)',
    rows.length === 1 && rows[0].value === 'ndb:kanto', JSON.stringify(rows.map(function (r) { return r.value; })));
  ok('B1 the Kanto row names the DB current chapter and progress (1/24)',
    rows.length === 1 && rows[0].label.indexOf('Boulder Badge') >= 0 && rows[0].label.indexOf('1/24') >= 0,
    rows.length && rows[0].label);
  ok('B1 selecting the row opens the arc detail from the DB',
    pickVal(g, 'ndb:kanto') && g.ui.dlg && g.ui.dlg.lines.join(' | ').indexOf('Now: Win the Boulder Badge in Pewter City') >= 0
      && g.ui.dlg.lines.join(' | ').indexOf('Through Viridian Forest') >= 0
      && g.ui.dlg.lines.join(' | ').indexOf('Story chapters 1 of 24') >= 0,
    g.ui.dlg ? g.ui.dlg.lines.join(' | ').slice(0, 160) : 'no dialogue');
  drain(g); tk(g, 3);
  ok('B1 the detail returns to the Quest Log (existing sections intact)',
    !!g.ui.menu && g.ui.menu.items.some(function (it) { return it.value === 'q:q_boulder'; }));

  // ---- B2: progression is flag-driven through the DB ----
  g.state.story.flags.badge_boulder = true;
  g.openQuestLog(); tk(g, 3);
  rows = storyRows(g);
  ok('B2 earning the Boulder Badge advances the DB current chapter (row now the Cerulean road, 2/24)',
    rows.length === 1 && rows[0].label.indexOf('Cross Mt. Moon and reach Cerulean City') >= 0 && rows[0].label.indexOf('2/24') >= 0
      && chapterStateOf(g.state, 'q_boulder') === 'complete' && currentChapterOf(g.state).id === 'q_cerulean',
    rows.length && rows[0].label);
  if (g.ui.menu) g.ui.menu = null;

  // ---- B3: dialogue hooks dispatch through the shipped event runner ----
  var bill = narrativeChapterById('q_bill');
  ok('B3 the DB chapter q_bill references its dialogue event by id (ev_bill)',
    !!bill && (bill.events || []).indexOf('ev_bill') >= 0, bill && JSON.stringify(bill.events));
  var ow = gotoMap(g, 'cerulean', 12, 8);
  ow.runEvent(bill.events[0]); tk(g, 3); drain(g); tk(g, 3); drain(g);
  ok('B3 dispatching the referenced event runs the shipped scene (bill_helped set, quest ledger complete)',
    g.state.story.flags.bill_helped === true && g.state.story.quests.q_bill === 'complete'
      && chapterStateOf(g.state, 'q_bill') === 'complete',
    'bill_helped=' + g.state.story.flags.bill_helped + ' quest=' + g.state.story.quests.q_bill);

  globalThis.__NDBQ__ = Q;
})();`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__NDBQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

console.log('\nNARRATIVE DB TOTAL: ' + pass + '/' + (pass + failures.length) + ' passed');
if (failures.length) { console.log('FAILURES: ' + failures.join(' ; ')); process.exit(1); }
