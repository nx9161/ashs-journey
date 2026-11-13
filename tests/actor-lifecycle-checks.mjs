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
//   (ev_parley_enter + runParleyNpc exits), and Wally's quest-end
//   relocation (Meadowbrook departure -> Crown Road post, held
//   empty by ACTOR_DEFAULTS until his farewell scene completes).

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
const { actorSlug, actorCharId, actorDirective, setActorOverride, ACTOR_DEFAULTS } = await G('actors.mjs');
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
for (const cid of ['mom@pallet', 'master-ko@dojo', 'wally@petalburg', 'wally@victory-road-maris',
  'rue@celadon', 'cole@celadon', 'harbormaster@vermilion', 'shopkeeper@mart']) {
  const mapId = cid.split('@')[1];
  ok('charId exists: ' + cid, cidsOf(mapId).includes(cid));
}
ok('slug derivation is the documented one',
  actorCharId('MASTER KO', 'dojo') === 'master-ko@dojo'
  && actorCharId("WALLY'S NEIGHBOR UNA", 'petalburg') === 'wally-s-neighbor-una@petalburg'
  && actorSlug('PROF. ROWAN') === 'prof-rowan');

// ---------- persistence: overrides across save/load ----------
ok('ACTOR_DEFAULTS holds the Crown Road post empty until Wally departs',
  ACTOR_DEFAULTS['wally@victory-road-maris'] && ACTOR_DEFAULTS['wally@victory-road-maris'].hidden === true);
ok('directive precedence: default applies with no save', (() => {
  const s = defaultState();
  const d = actorDirective(s, 'wally@victory-road-maris');
  return !!d && d.hidden === true && actorDirective(s, 'mom@pallet') === null;
})());
{
  const s = defaultState();
  ok('new saves start with an empty override store', !!s.story.actors && Object.keys(s.story.actors).length === 0);
  setActorOverride(s, 'master-ko@dojo', { map: 'dojo', x: 5, y: 5, hidden: false });
  setActorOverride(s, 'wally@petalburg', { hidden: true, map: 'petalburg' });
  setActorOverride(s, 'wally@victory-road-maris', { hidden: false });
  const round = migrate(JSON.parse(JSON.stringify(s)));
  const v = validateSave(round);
  ok('overrides survive JSON round-trip + migrate + validate', v.ok
    && actorDirective(round, 'master-ko@dojo').x === 5
    && actorDirective(round, 'wally@petalburg').hidden === true
    && actorDirective(round, 'wally@victory-road-maris').hidden === false,
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
  s2.story.actors = { 'bad key': { hidden: true }, 'wally@petalburg': { hidden: true, x: 3 }, 'master-ko@dojo': { map: 42, x: 'a' } };
  const round = migrate(JSON.parse(JSON.stringify(s2)));
  ok('malformed entries sanitize away on load (character stands home)',
    !('bad key' in round.story.actors)
    && round.story.actors['wally@petalburg'].hidden === true
    && round.story.actors['wally@petalburg'].x === undefined
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

// ---------- proof 3: Wally relocates at his quest's end ----------
{
  const wP = hoenn.HOENN_NPCS.find((n) => n.name === 'WALLY' && n.map === 'petalburg');
  const wV = hoenn.HOENN_NPCS.find((n) => n.name === 'WALLY' && n.map === 'victory-road-maris');
  ok('both Wally posts are authored (Meadowbrook + Crown Road)',
    !!wP && wP.x === 13 && wP.y === 7 && !!wV && wV.x === 11 && wV.y === 6);
  ok('Wally posts stand on walkable tiles', walkableAt('petalburg', 13, 7) && walkableAt('victory-road-maris', 11, 6));
  ok('the departure route east out of Meadowbrook exists', bfsExists('petalburg', 13, 7, 29, 8));
  ok('the farewell scene wires the relocation (exit + show)',
    SRC_SYS.includes("actorExit: { who: 'wally@petalburg'") && SRC_SYS.includes("actorShow: { who: 'wally@victory-road-maris' }"));
}

console.log(`\nactor-lifecycle: ${pass} pass, ${fail} fail (${totalPosts} census posts)`);
process.exit(fail ? 1 : 0);
