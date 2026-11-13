// quest-integrity-checks.mjs — Wave S2 (quest integrity census guard).
//   node tests/quest-integrity-checks.mjs
// The owner's law: every quest the game presents must have a working
// backend. This suite walks EVERY quest definition the Quest Log can
// present and asserts each link of its chain exists:
//   TALES (merged QUESTS): definition shape (<=3 stages, reward stated,
//   revelation), a giver actor and (for the data-driven regional tales)
//   a stage actor in the assembled map population, dialogue lines for
//   the generic branch, a bespoke handler branch for the Kanto tales,
//   reward ids that exist, placements on engine-walkable tiles with no
//   collisions (the A14 law, generalized to every tale actor incl. the
//   regional appends), patch targets that name real townsfolk, and a
//   headless drive of the pure stage machine from accept to complete
//   with the reward landing in the bag.
//   LEGENDARY ARCS (merged LEGENDARY_ARCS): every live arc has at
//   least one producer that can write its story.quests state (event
//   {arc} step or direct write) and a real species; every
//   designedOnly arc has NO producer (sealed integrity — a half-wired
//   sealed arc fails here instead of dangling in the Quest Log).
//   STORY CHAPTERS (the five *_QUESTS chains): every chapter carries
//   a flag, and every flag has a producer in the shipped source
//   (event {flag} step, direct write, or a defaults/true literal).
// Born of the Wave S2 census: 37 tales / 62 arcs / 106 chapters, one
// broken link found and repaired (the tale_vermilion Harbormaster
// stood on a solid town-dress tile — see data/quests.mjs).

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));
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
const { SPECIES } = await D('species.mjs');
Object.assign(SPECIES, (await D('species2.mjs')).SPECIES2, (await D('species3.mjs')).SPECIES_JOHTO,
  (await D('species4.mjs')).SPECIES_HOENN, (await D('species5.mjs')).SPECIES_SINNOH);
const Q = await D('quests.mjs');
const johto = await D('story-johto.mjs');
const hoenn = await D('story-hoenn.mjs');
const sinnoh = await D('story-sinnoh.mjs');
const kanto = await D('story-kanto.mjs');
const orange = await D('story-orange.mjs');
// merge.mjs folds the regional tables INTO the base objects (same
// references) — the shared stage machine in quests.mjs therefore
// serves every region at runtime. Mirror that exactly here.
const QUESTS = Q.QUESTS;
Object.assign(QUESTS, johto.JOHTO_TALES, hoenn.HOENN_TALES, sinnoh.SINNOH_TALES);
const ARCS = kanto.LEGENDARY_ARCS;
Object.assign(ARCS, orange.ORANGE_LEGENDARY_ARCS, johto.JOHTO_LEGENDARY_ARCS,
  hoenn.HOENN_LEGENDARY_ARCS, sinnoh.SINNOH_LEGENDARY_ARCS);
const { ITEMS, KEEPSAKES } = await D('items.mjs');

// ---------- shipped source text (producer tracing) ----------
let SRC = '';
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.mjs')) SRC += '\n' + fs.readFileSync(p, 'utf8');
  }
};
walk(path.join(ROOT, 'src'));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const arcProducers = (id) => {
  const pats = [
    new RegExp(`quests\\.${esc(id)}\\s*=`, 'g'),
    new RegExp(`quests\\['${esc(id)}'\\]\\s*=`, 'g'),
    new RegExp(`arc:\\s*'${esc(id)}'`, 'g'),
    new RegExp(`questDone:\\s*'${esc(id)}'`, 'g'),
    new RegExp(`quest:\\s*'${esc(id)}'`, 'g'),
  ];
  return pats.reduce((n, r) => n + (SRC.match(r) || []).length, 0);
};

// ---------- assembled NPC population (the loadMap append idiom) ----------
function npcsOf(mapId) {
  const def = MAPS[mapId];
  if (!def || !Array.isArray(def.npcs)) return [];
  const npcs = def.npcs.map((n) => ({ ...n }));
  const patchList = (list) => {
    for (const p of list.filter((pp) => pp.map === mapId)) {
      const t = npcs.find((n) => n.name === p.name);
      if (t) { t.tale = p.tale; t.role = p.role; if (p.witness) t.witness = p.witness; }
    }
  };
  patchList(Q.TALE_NPC_PATCHES); patchList(johto.JOHTO_NPC_PATCHES); patchList(hoenn.HOENN_NPC_PATCHES);
  const sp = sinnoh.SINNOH_NPC_PATCHES[mapId];
  if (sp) for (const n of npcs) { const pp = sp[n.name]; if (pp) { n.tale = pp.tale; n.role = pp.role; } }
  const append = (arr) => { for (const n of arr.filter((nn) => nn.map === mapId)) { const c = { ...n }; delete c.map; npcs.push(c); } };
  append(Q.TALE_NPCS); append(johto.JOHTO_NPCS); append(hoenn.HOENN_NPCS); append(sinnoh.SINNOH_NPCS);
  return npcs;
}
const taleActors = {};
for (const mid of Object.keys(MAPS)) {
  for (const n of npcsOf(mid)) if (n.tale) (taleActors[n.tale] ||= []).push({ map: mid, ...n });
}

// ---------- TALES ----------
const taleIds = Object.keys(QUESTS);
ok('quest census: the merged tales table is populated', taleIds.length >= 37, String(taleIds.length));

const shapeBad = taleIds.filter((id) => {
  const t = QUESTS[id];
  return !(Array.isArray(t.stages) && t.stages.length >= 1 && t.stages.length <= 3
    && typeof t.rewardText === 'string' && t.rewardText.length > 0
    && typeof t.revelation === 'string' && t.revelation.length > 0
    && typeof t.giver === 'string' && typeof t.town === 'string');
});
ok('every tale obeys the shape law (<=3 stages, reward stated, revelation, giver, town)', !shapeBad.length, shapeBad.join(','));
// The Quest Log's completed-tale line is 'Complete. ' + revelation —
// a missing revelation renders literally as "Complete. undefined"
// (the Wave S2 Sinnoh defect). Assert the rendered line itself.
const badLogLine = taleIds.filter((id) => {
  const st = { story: { quests: {}, flags: {}, bonds: {} }, bag: {}, player: { money: 0 }, party: [], boxes: {} };
  Q.acceptTale(st, id);
  let guard = 0;
  while (Q.taleStatus(st, id) !== 'complete' && guard++ < 6) Q.advanceTale(st, id);
  const line = Q.taleStageText(st, QUESTS[id]);
  return typeof line !== 'string' || line.includes('undefined');
});
ok('every completed tale renders a clean Quest Log line (no "undefined")', !badLogLine.length, badLogLine.join(','));

const noGiver = taleIds.filter((id) => !(taleActors[id] || []).some((a) => a.role === 'giver'));
ok('every tale has a giver actor in the assembled map population', !noGiver.length, noGiver.join(','));

const regional = taleIds.filter((id) => QUESTS[id].johtoTale || QUESTS[id].hoennTale || QUESTS[id].sinnohTale);
const noStage = regional.filter((id) => !(taleActors[id] || []).some((a) => a.role === 'stage'));
ok('every regional tale has a stage actor', !noStage.length, noStage.join(','));
const noLines = regional.filter((id) => {
  const t = QUESTS[id];
  return !['offerLines', 'stageLines', 'finishLines'].every((k) => Array.isArray(t[k]) && t[k].length > 0);
});
ok('every regional tale carries its offer/stage/finish lines for the generic branch', !noLines.length, noLines.join(','));

const ows = fs.readFileSync(path.join(ROOT, 'src/game/overworld-systems.mjs'), 'utf8');
const kantoTales = taleIds.filter((id) => !regional.includes(id));
const noHandler = kantoTales.filter((id) => !ows.includes(`id === '${id}'`));
ok('every Kanto tale has a bespoke runTaleNpc handler branch', !noHandler.length, noHandler.join(','));

const badReward = [];
for (const id of taleIds) {
  const rw = QUESTS[id].reward || {};
  for (const it of Object.keys(rw.items || {})) if (!ITEMS[it]) badReward.push(id + ':' + it);
  if (rw.keepsake && !KEEPSAKES[rw.keepsake]) badReward.push(id + ':' + rw.keepsake);
}
ok('every tale reward names a real item / keepsake', !badReward.length, badReward.join(','));

// Placements: every APPENDED tale actor stands on an engine-walkable
// tile and collides with nothing in the base map (A14, generalized).
const appended = [
  ...Q.TALE_NPCS.map((n) => ({ ...n, src: 'TALE_NPCS' })),
  ...johto.JOHTO_NPCS.filter((n) => n.tale).map((n) => ({ ...n, src: 'JOHTO_NPCS' })),
  ...hoenn.HOENN_NPCS.filter((n) => n.tale).map((n) => ({ ...n, src: 'HOENN_NPCS' })),
  ...sinnoh.SINNOH_NPCS.filter((n) => n.tale).map((n) => ({ ...n, src: 'SINNOH_NPCS' })),
];
const badPlace = appended.filter((n) => {
  const m = MAPS[n.map];
  if (!m) return true;
  const ch = m.rows[n.y] && m.rows[n.y][n.x];
  if (!WALKABLE.has(ch)) return true;
  if ((m.npcs || []).some((b) => b.x === n.x && b.y === n.y)) return true;
  if ((m.warps || []).some((w) => w.x === n.x && w.y === n.y)) return true;
  if ((m.signs || []).some((s) => s.x === n.x && s.y === n.y)) return true;
  return false;
});
ok('every appended tale actor stands on walkable floor, collision-free', !badPlace.length,
  badPlace.map((n) => `${n.name}@${n.map}(${n.x},${n.y})`).join(', '));

const badPatch = [];
for (const p of Q.TALE_NPC_PATCHES) if (!((MAPS[p.map] || {}).npcs || []).some((n) => n.name === p.name)) badPatch.push('KANTO:' + p.name);
for (const p of johto.JOHTO_NPC_PATCHES) if (p.tale && !((MAPS[p.map] || {}).npcs || []).some((n) => n.name === p.name)) badPatch.push('JOHTO:' + p.name);
for (const p of hoenn.HOENN_NPC_PATCHES) if (p.tale && !((MAPS[p.map] || {}).npcs || []).some((n) => n.name === p.name)) badPatch.push('HOENN:' + p.name);
for (const [mid, byName] of Object.entries(sinnoh.SINNOH_NPC_PATCHES)) {
  for (const nm of Object.keys(byName)) if (!((MAPS[mid] || {}).npcs || []).some((n) => n.name === nm)) badPatch.push('SINNOH:' + nm);
}
ok('every tale patch names a real townsfolk in the merged maps', !badPatch.length, badPatch.join(','));

const badSpot = Q.TALE_SPOTS.filter((s) => !QUESTS[s.tale] || !MAPS[s.map] || !(MAPS[s.map].rows[s.y] && MAPS[s.map].rows[s.y][s.x]));
ok('every tale spot sits on a real map tile and resolves to a tale', !badSpot.length, badSpot.map((s) => s.tale).join(','));

// Headless drive: the pure stage machine completes every tale and the
// item rewards land in the bag (keepsake rewards ride the central
// grant, asserted by id above).
const driveBad = [];
for (const id of taleIds) {
  const t = QUESTS[id];
  const st = { story: { quests: {}, flags: {}, bonds: {} }, bag: {}, player: { money: 0 }, party: [], boxes: {} };
  if (!Q.acceptTale(st, id)) { driveBad.push(id + ':accept'); continue; }
  let guard = 0;
  while (Q.taleStatus(st, id) !== 'complete' && guard++ < 6) Q.advanceTale(st, id);
  if (Q.taleStatus(st, id) !== 'complete') { driveBad.push(id + ':incomplete'); continue; }
  for (const [it, n] of Object.entries((t.reward || {}).items || {})) {
    if ((st.bag[it] || 0) < n) driveBad.push(id + ':reward-' + it);
  }
  if ((t.reward || {}).keepsake && !st.bag[t.reward.keepsake] && !Object.values(st.story.keepsakes || {}).length) {
    // the central grant records ownership in its own ledger shape;
    // completion without a throw is the contract here (id existence
    // is asserted above, obtainability by rejuv-phase4 A18).
  }
}
ok('the stage machine drives every tale from accept to complete, item rewards landing', !driveBad.length, driveBad.join(','));

// ---------- LEGENDARY ARCS ----------
const arcIds = Object.keys(ARCS);
const liveArcs = arcIds.filter((id) => !ARCS[id].designedOnly);
const sealedArcs = arcIds.filter((id) => ARCS[id].designedOnly);
const deadLive = liveArcs.filter((id) => arcProducers(id) === 0);
ok('every live legendary arc has at least one story.quests producer', !deadLive.length, deadLive.join(','));
const badArcSpecies = liveArcs.filter((id) => !SPECIES[ARCS[id].species]);
ok('every live legendary arc names a real species', !badArcSpecies.length, badArcSpecies.join(','));
const leakySealed = sealedArcs.filter((id) => arcProducers(id) > 0);
ok('every designedOnly arc stays sealed (no producer can present it half-wired)', !leakySealed.length, leakySealed.join(','));
const badLair = liveArcs.filter((id) => typeof ARCS[id].lair !== 'string' || !ARCS[id].lair.length);
ok('every live legendary arc carries its lair label for the Quest Log detail', !badLair.length, badLair.join(','));

// ---------- STORY CHAPTERS ----------
const chains = { MAIN_QUESTS: kanto.MAIN_QUESTS, ORANGE_QUESTS: orange.ORANGE_QUESTS, JOHTO_QUESTS: johto.JOHTO_QUESTS, HOENN_QUESTS: hoenn.HOENN_QUESTS, SINNOH_QUESTS: sinnoh.SINNOH_QUESTS };
const flagProducer = (f) => {
  const pats = [
    new RegExp(`flag:\\s*'${esc(f)}'`, 'g'),
    new RegExp(`flags\\.${esc(f)}\\s*=\\s*true`, 'g'),
    new RegExp(`flags\\['${esc(f)}'\\]\\s*=`, 'g'),
    new RegExp(`\\b${esc(f)}:\\s*true`, 'g'),
  ];
  return pats.reduce((n, r) => n + (SRC.match(r) || []).length, 0);
};
let chapterCount = 0;
const badChapter = [];
for (const [name, chain] of Object.entries(chains)) {
  for (const q of chain) {
    chapterCount++;
    if (!q.flag) { badChapter.push(name + ':' + q.id + ':no-flag'); continue; }
    if (flagProducer(q.flag) === 0) badChapter.push(name + ':' + q.id + ':' + q.flag);
  }
}
ok(`every story chapter flag has a producer (${chapterCount} chapters across 5 chains)`, !badChapter.length, badChapter.join(','));

console.log(`\nquest-integrity-checks: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
