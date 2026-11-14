// actor-lifecycle-checks.mjs — Wave ACT (Actor Lifecycle) guard.
//   node tests/actor-lifecycle-checks.mjs
// The owner's law: every character has a particular post; cinematic
// characters ARRIVE via events; quest characters wait at their post;
// when the quest ends or the player performs the triggering action,
// the character MOVES. This suite guards the layer that makes the
// second half true:
//   IDENTITY — every census post (authored placements + the append
//   tables + the parley pair, assembled in loadMap's own order)
//   yields a unique, stable charId (slug(name)@map, '#n' duplicates).
//   PERSISTENCE — story.actors directives survive a JSON
//   round-trip + migrate + validateSave; a pre-ACT save (no
//   story.actors) loads with {} filled; malformed entries sanitize
//   away instead of breaking the save.
//   PRIMITIVES — the runSteps actor vocabulary (actorEnter /
//   actorMove / actorExit / actorShow / actorHide), the walker, and
//   the tale-completion watcher are wired in the shipped source.
//   THE THREE PROOFS — Master Ko's tale-end relocation (tale_saffron
//   onComplete), the Canopy parley's cinematic entry + departure
//   (ev_parley_enter + runParleyNpc exits), and Emil's quest-end
//   relocation (Meadowbrook departure -> Crown Road post, held
//   empty by ACTOR_DEFAULTS until his farewell scene completes).
//   W9 PROOFS — Intern Vesk's tale-end relocation to the Revelry TV
//   door (tale_sinnoh_jubilife onComplete), the off-map completion
//   application + save-resume resolution (a tale already complete in
//   the save resolves its actor to the post-completion post), and
//   the two flag-gated departures (Liora leaves the lighthouse
//   once Lumi is healed; Darian leaves the lake once the WRATHWYRM
//   is calmed — ACTOR_FLAG_DEFAULTS, saved overrides still win).

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));
const G = (f) => import(path.join(ROOT, 'src/game', f));
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ---------- merged tables (merge.mjs's folds, in test idiom) ----------
const { MAPS, WALKABLE } = await D('maps.mjs');
for (const f of ['maps2', 'maps3', 'maps4', 'maps5', 'maps6', 'maps7', 'maps8', 'maps9']) {
  const m = await D(f + '.mjs');
  Object.assign(MAPS, m[Object.keys(m).find((k) => k.startsWith('MAPS'))]);
}
const Q = await D('quests.mjs');
const johto = await D('story-johto.mjs');
const hoenn = await D('story-hoenn.mjs');
const sinnoh = await D('story-sinnoh.mjs');
const kanto = await D('story-kanto.mjs');
const { actorSlug, actorCharId, actorDirective, setActorOverride, ACTOR_DEFAULTS, ACTOR_FLAG_DEFAULTS, actorLifecycleMixin } = await G('actors.mjs');
// The bundle folds the regional tale tables into quests.mjs's QUESTS
// (merge.mjs, Object.assign on the same object the watcher iterates;
// merge.mjs runs in bundle scope, so the fold is pinned by source
// below rather than by importing it here).
const SRC_MERGE = fs.readFileSync(path.join(ROOT, 'src/data/merge.mjs'), 'utf8');
const { defaultState } = await G('state.mjs');
const { validateSave, migrate } = await import(path.join(ROOT, 'src/save/schema.mjs'));
const { PARLEY_NPCS } = await G('bonds.mjs');

const SRC_OW = fs.readFileSync(path.join(ROOT, 'src/game/overworld.mjs'), 'utf8');
const SRC_SYS = fs.readFileSync(path.join(ROOT, 'src/game/overworld-systems.mjs'), 'utf8');
const SRC_ACT = fs.readFileSync(path.join(ROOT, 'src/game/actors.mjs'), 'utf8');

const walkableAt = (mapId, x, y) => {
  const m = MAPS[mapId];
  return !!m && WALKABLE.has((m.rows[y] || '')[x]);
};
const bfsExists = (mapId, sx, sy, tx, ty) => {
  const seen = new Set([sx + ',' + sy]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) return true;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (!seen.has(k) && walkableAt(mapId, nx, ny)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return false;
};

// ---------- identity: the census assembly, in loadMap's order ----------
function assembledNpcs(mapId) {
  const m = MAPS[mapId];
  if (!m) return [];
  // The mart scene fields only its appended actors here (the origin
  // clerk is a single runtime clone, covered by the SHOPKEEPER post).
  let npcs = mapId === 'mart' ? [] : (m.npcs || []).filter((n) => !n.mart);
  npcs = [...npcs, ...Q.TALE_NPCS.filter((n) => n.map === mapId)];
  npcs = [...npcs, ...johto.JOHTO_NPCS.filter((n) => n.map === mapId)];
  npcs = [...npcs, ...hoenn.HOENN_NPCS.filter((n) => n.map === mapId)];
  npcs = [...npcs, ...sinnoh.SINNOH_NPCS.filter((n) => n.map === mapId)];
  if (mapId === 'celadon') npcs = [...npcs, ...PARLEY_NPCS];
  return npcs;
}
function cidsOf(mapId) {
  const seen = new Map();
  return assembledNpcs(mapId).map((n) => {
    const base = actorCharId(n.name, mapId);
    const occ = seen.get(base) || 0;
    seen.set(base, occ + 1);
    return occ ? base + '#' + (occ + 1) : base;
  });
}
let totalPosts = 0;
let dupReport = '';
const allCids = new Set();
for (const mapId of Object.keys(MAPS)) {
  const cids = cidsOf(mapId);
  totalPosts += cids.length;
  const dup = cids.find((c, i) => cids.indexOf(c) !== i);
  if (dup && !dupReport) dupReport = mapId + ': ' + dup;
  for (const c of cids) allCids.add(mapId + '|' + c);
}
ok('census assembles a real population (>600 posts)', totalPosts > 600, String(totalPosts));
ok('every census post yields a unique charId on its map', !dupReport, dupReport);
for (const cid of ['mom@pallet', 'master-ko@dojo', 'emil@petalburg', 'emil@victory-road-maris',
  'rue@celadon', 'cole@celadon', 'harbormaster@vermilion', 'shopkeeper@mart']) {
  const mapId = cid.split('@')[1];
  ok('charId exists: ' + cid, cidsOf(mapId).includes(cid));
}
ok('slug derivation is the documented one',
  actorCharId('MASTER KO', 'dojo') === 'master-ko@dojo'
  && actorCharId("EMIL'S NEIGHBOR UNA", 'petalburg') === 'emil-s-neighbor-una@petalburg'
  && actorSlug('PROF. ROWAN') === 'prof-rowan');

// ---------- persistence: overrides across save/load ----------
ok('ACTOR_DEFAULTS holds the Crown Road post empty until Emil departs',
  ACTOR_DEFAULTS['emil@victory-road-maris'] && ACTOR_DEFAULTS['emil@victory-road-maris'].hidden === true);
ok('directive precedence: default applies with no save', (() => {
  const s = defaultState();
  const d = actorDirective(s, 'emil@victory-road-maris');
  return !!d && d.hidden === true && actorDirective(s, 'mom@pallet') === null;
})());
{
  const s = defaultState();
  ok('new saves start with an empty override store', !!s.story.actors && Object.keys(s.story.actors).length === 0);
  setActorOverride(s, 'master-ko@dojo', { map: 'dojo', x: 5, y: 5, hidden: false });
  setActorOverride(s, 'emil@petalburg', { hidden: true, map: 'petalburg' });
  setActorOverride(s, 'emil@victory-road-maris', { hidden: false });
  const round = migrate(JSON.parse(JSON.stringify(s)));
  const v = validateSave(round);
  ok('overrides survive JSON round-trip + migrate + validate', v.ok
    && actorDirective(round, 'master-ko@dojo').x === 5
    && actorDirective(round, 'emil@petalburg').hidden === true
    && actorDirective(round, 'emil@victory-road-maris').hidden === false,
    v.errors.join(','));
}
{
  const s = defaultState();
  delete s.story.actors; // a pre-ACT save
  const round = migrate(JSON.parse(JSON.stringify(s)));
  ok('pre-ACT save loads with story.actors filled {}',
    !!round.story.actors && Object.keys(round.story.actors).length === 0 && validateSave(round).ok);
}
{
  const s = defaultState();
  s.story.actors = { 'master-ko@dojo': { map: 42 } };
  ok('validateSave rejects a malformed actors entry',
    validateSave(s).errors.includes('bad-story-actors-entry'));
  const s2 = defaultState();
  s2.story.actors = { 'bad key': { hidden: true }, 'emil@petalburg': { hidden: true, x: 3 }, 'master-ko@dojo': { map: 42, x: 'a' } };
  const round = migrate(JSON.parse(JSON.stringify(s2)));
  ok('malformed entries sanitize away on load (character stands home)',
    !('bad key' in round.story.actors)
    && round.story.actors['emil@petalburg'].hidden === true
    && round.story.actors['emil@petalburg'].x === undefined
    && round.story.actors['master-ko@dojo'].map === undefined);
}

// ---------- primitives wired ----------
for (const k of ['actorEnter', 'actorMove', 'actorExit', 'actorShow', 'actorHide']) {
  ok('runSteps handles ' + k, SRC_SYS.includes('s.' + k) && SRC_SYS.includes('runActorStep'));
}
ok('walker + watcher wired in the scene',
  SRC_OW.includes('queueActorWalk') && SRC_OW.includes('updateActorWalk')
  && SRC_OW.includes('this.checkTaleCompletions()') && SRC_ACT.includes("mark = 'talefx_' + id"));
ok('identity + resolver wired in loadMap',
  SRC_OW.includes('c._cid') && SRC_OW.includes('actorDirective') && SRC_OW.includes('_actorHidden'));

// ---------- proof 1: Master Ko relocates when tale_saffron completes ----------
{
  const t = Q.QUESTS.tale_saffron;
  const step = t && Array.isArray(t.onComplete) && t.onComplete[0] && t.onComplete[0].actorMove;
  ok('tale_saffron carries the Ko relocation directive',
    !!step && step.who === 'master-ko@dojo' && Array.isArray(step.to) && step.to[0] === 5 && step.to[1] === 5);
  const ko = (MAPS.dojo.npcs || []).find((n) => n.name === 'MASTER KO');
  ok('Ko authored post is the master seat (7,1), destination is the doorway (5,5)',
    !!ko && ko.x === 7 && ko.y === 1 && walkableAt('dojo', 5, 5) && bfsExists('dojo', 7, 1, 5, 5));
}

// ---------- proof 2: the Canopy parley enters, and departs ----------
{
  const ev = kanto.EVENTS.ev_parley_enter;
  ok('ev_parley_enter exists', Array.isArray(ev));
  const enters = (ev || []).filter((s) => s.actorEnter).map((s) => s.actorEnter);
  const rue = enters.find((e) => e.who === 'rue@celadon');
  const cole = enters.find((e) => e.who === 'cole@celadon');
  const cornerWarps = (MAPS.celadon.warps || []).filter((w) => w.to.map === 'gamecorner');
  const onWarp = (e) => !!e && cornerWarps.some((w) => w.x === e.x && w.y === e.y);
  ok('both parley actors enter from the Game Corner doors',
    onWarp(rue) && onWarp(cole) && rue.x !== cole.x);
  const endsAtPost = (e, post) => !!e && Array.isArray(e.path)
    && e.path[e.path.length - 1][0] === post.x && e.path[e.path.length - 1][1] === post.y;
  const ruePost = PARLEY_NPCS.find((n) => n.name === 'RUE');
  const colePost = PARLEY_NPCS.find((n) => n.name === 'COLE');
  ok('entry paths end at the authored parley posts', endsAtPost(rue, ruePost) && endsAtPost(cole, colePost));
  const pathTilesOk = (e) => !!e && e.path.every(([x, y]) => walkableAt('celadon', x, y));
  ok('entry path tiles are walkable', pathTilesOk(rue) && pathTilesOk(cole));
  ok('sysLoadMap fires the entry (entry-scene idiom)', SRC_SYS.includes('maybePlayParleyEnter(') && SRC_ACT.includes("this.runEvent('ev_parley_enter')"));
  ok('a resolved parley departs on foot (runParleyNpc exits)',
    SRC_SYS.includes("actorExit: { who: 'rue@celadon'") && SRC_SYS.includes("actorExit: { who: 'cole@celadon'"));
}

// ---------- proof 3: Emil relocates at his quest's end ----------
{
  const wP = hoenn.HOENN_NPCS.find((n) => n.name === 'EMIL' && n.map === 'petalburg');
  const wV = hoenn.HOENN_NPCS.find((n) => n.name === 'EMIL' && n.map === 'victory-road-maris');
  ok('both Emil posts are authored (Meadowbrook + Crown Road)',
    !!wP && wP.x === 13 && wP.y === 7 && !!wV && wV.x === 11 && wV.y === 6);
  ok('Emil posts stand on walkable tiles', walkableAt('petalburg', 13, 7) && walkableAt('victory-road-maris', 11, 6));
  ok('the departure route east out of Meadowbrook exists', bfsExists('petalburg', 13, 7, 29, 8));
  ok('the farewell scene wires the relocation (exit + show)',
    SRC_SYS.includes("actorExit: { who: 'emil@petalburg'") && SRC_SYS.includes("actorShow: { who: 'emil@victory-road-maris' }"));
}

// ---------- W9 proof 4: Intern Vesk relocates when his tale completes ----------
{
  const t = sinnoh.SINNOH_TALES.tale_sinnoh_jubilife;
  const step = t && Array.isArray(t.onComplete) && t.onComplete[0] && t.onComplete[0].actorMove;
  ok('W9: SINNOH_TALES carries the Vesk relocation, and merge.mjs folds it into the watcher\'s QUESTS',
    !!step && step.who === 'broadcast-intern-vesk@jubilife'
    && Array.isArray(step.to) && step.to[0] === 15 && step.to[1] === 4
    && SRC_MERGE.includes('Object.assign(QUESTS, SINNOH_TALES)'));
  ok('W9: Vesk charId exists in the census', cidsOf('jubilife').includes('broadcast-intern-vesk@jubilife'));
  const vesk = (MAPS.jubilife.npcs || []).find((n) => n.name === 'BROADCAST INTERN VESK');
  const tvWarp = (MAPS.jubilife.warps || []).find((w) => w.to && w.to.map === 'jubilife-tv');
  ok('W9: Vesk authored post is the plaza (11,7); destination is the TV door flank (15,4), walkable + reachable, door-front (16,4) left clear',
    !!vesk && vesk.x === 11 && vesk.y === 7 && !!tvWarp && tvWarp.x === 16 && tvWarp.y === 3
    && walkableAt('jubilife', 15, 4) && bfsExists('jubilife', 11, 7, 15, 4)
    && !(step && step.to[0] === tvWarp.x && step.to[1] === tvWarp.y + 1)
    && !(MAPS.jubilife.warps || []).some((w) => w.x === 15 && w.y === 4));
}

// ---------- W9 proof 5: off-map completion application + save-resume ----------
{
  // A pre-W9 save: the tale is already complete, no talefx marker,
  // no actors override. The watcher fires the tale's steps on first
  // update — possibly on a map that is NOT the actor's home (the
  // player may be anywhere). Applying the step from a foreign scene
  // must still write the override against the actor's home map.
  const stubScene = (state, mapId) => ({
    mapId, game: { state }, actorByCid: () => null,
  });
  const s = defaultState();
  s.story.quests.tale_sinnoh_jubilife = 'complete';
  ok('W9 save-resume: before the watcher pass, Vesk resolves home (no directive)',
    actorDirective(s, 'broadcast-intern-vesk@jubilife') === null);
  const step = sinnoh.SINNOH_TALES.tale_sinnoh_jubilife.onComplete[0];
  actorLifecycleMixin.runActorStep.call(stubScene(s, 'jubilife-tv'), step, () => {});
  const d = actorDirective(s, 'broadcast-intern-vesk@jubilife');
  ok('W9 save-resume: the off-map application writes the HOME map (jubilife), post (15,4)',
    !!d && d.map === 'jubilife' && d.x === 15 && d.y === 4 && d.hidden === false,
    JSON.stringify(d));
  const round = migrate(JSON.parse(JSON.stringify(s)));
  const rd = actorDirective(round, 'broadcast-intern-vesk@jubilife');
  ok('W9 save-resume: the resolved post survives migrate + validateSave',
    validateSave(round).ok && !!rd && rd.map === 'jubilife' && rd.x === 15 && rd.y === 4);
  // Regression pin for the same defect on the pre-W9 beat: Ko's tale
  // completes inside saffron-shop on its IOU branch — his override
  // must name the dojo, never the shop, or he vanishes from home.
  const s2 = defaultState();
  const koStep = Q.QUESTS.tale_saffron.onComplete[0];
  actorLifecycleMixin.runActorStep.call(stubScene(s2, 'saffron-shop'), koStep, () => {});
  const kd = actorDirective(s2, 'master-ko@dojo');
  ok('W9 regression: Ko applied from saffron-shop still lands in the dojo (5,5)',
    !!kd && kd.map === 'dojo' && kd.x === 5 && kd.y === 5, JSON.stringify(kd));
}

// ---------- W9 proof 6: Liora leaves the lighthouse once Lumi is healed ----------
{
  const jLight = johto.JOHTO_NPCS.find((n) => n.name === 'LIORA' && n.map === 'lighthouse-2');
  const jGym = johto.JOHTO_NPCS.find((n) => n.name === 'LIORA' && n.map === 'gym-olivine');
  ok('W9: both Liora posts are authored (lighthouse (5,4), gym (7,2))',
    !!jLight && jLight.x === 5 && jLight.y === 4 && !!jGym && jGym.x === 7 && jGym.y === 2);
  ok('W9: Liora charId exists in the census', cidsOf('lighthouse-2').includes('liora@lighthouse-2'));
  const s = defaultState();
  ok('W9: before the delivery, Liora stands at the lighthouse (no directive)',
    actorDirective(s, 'liora@lighthouse-2') === null);
  s.story.flags.amphy_healed = true;
  const d = actorDirective(s, 'liora@lighthouse-2');
  ok('W9: after amphy_healed, the lighthouse post resolves empty (she is at her gym)',
    !!d && d.hidden === true && ACTOR_FLAG_DEFAULTS['liora@lighthouse-2'].flag === 'amphy_healed');
  setActorOverride(s, 'liora@lighthouse-2', { hidden: false });
  ok('W9: a saved override still wins over the flag-gated default',
    actorDirective(s, 'liora@lighthouse-2').hidden === false);
}

// ---------- W9 proof 7: Darian leaves the lake once the WRATHWYRM is calmed ----------
{
  const lLake = johto.JOHTO_NPCS.find((n) => n.name === 'DARIAN' && n.map === 'lake-of-rage');
  const lTown = johto.JOHTO_NPCS.find((n) => n.name === 'DARIAN' && n.map === 'mahogany');
  ok('W9: both Darian posts are authored (lake (16,15), Redwood (18,7))',
    !!lLake && lLake.x === 16 && lLake.y === 15 && !!lTown && lTown.x === 18 && lTown.y === 7);
  ok('W9: Darian charId exists in the census', cidsOf('lake-of-rage').includes('darian@lake-of-rage'));
  const s = defaultState();
  ok('W9: before the lake beat, Darian stands at the lake (no directive)',
    actorDirective(s, 'darian@lake-of-rage') === null);
  s.story.flags.red_gyarados_done = true;
  const d = actorDirective(s, 'darian@lake-of-rage');
  ok('W9: after red_gyarados_done, the lake post resolves empty (he is in Redwood), and his Redwood post is untouched',
    !!d && d.hidden === true && ACTOR_FLAG_DEFAULTS['darian@lake-of-rage'].flag === 'red_gyarados_done'
    && actorDirective(s, 'lance@mahogany') === null);
}

console.log(`\nactor-lifecycle: ${pass} pass, ${fail} fail (${totalPosts} census posts)`);
process.exit(fail ? 1 : 0);
