// tests/map-id-registry-checks.mjs — Wave W3 (War Room E2E Phase 2):
// the Map-ID Registry gate. Standalone suite in the repo's checks style:
//   node tests/map-id-registry-checks.mjs
//
// WHY THIS EXISTS: merge.mjs folds MAPS…MAPS9 with Object.assign, so when
// two packs define the same map id the later file silently wins and the
// earlier definition becomes dead data that still looks maintained. That
// is how Maris's Crown Road (maps7) was shadowed by Borea's Summit Road
// (maps9) under the shared id `victory-road` — Perennial's warps and
// Wally's finale landed in the wrong region's road (audit Cluster 1 F-3),
// and 30 of 44 duplicated ids had drifted apart (F-5).
//
// WHAT THIS GATE HOLDS:
//  1. THE SPLIT IS PERMANENT: `victory-road` is Borea's Summit Road and
//     is defined exactly once (maps9); `victory-road-maris` is Maris's
//     Crown Road, defined exactly once (maps7); both warp chains are
//     pinned end to end (evergrande ⇄ victory-road-maris,
//     r223/pokemon-league ⇄ victory-road, no other inbound warps).
//  2. THE DRIFT RATCHET (title-guard T3 discipline): every duplicated id
//     is frozen in the BASELINE table below — status I (all copies
//     byte-identical) or D (drifted), with a content fingerprint per
//     copy, in merge order (winner = last). ANY deviation fails by id:
//     a new duplicate, a removed copy, or a changed copy. Reconciling a
//     drifted pair is welcome — update its baseline line in the SAME
//     commit as the data change (the burn-down rule). The full per-id
//     registry lives in ~/workspace/muse-directive/W3-DUALCOPY-REGISTRY.md.
//  3. NO DANGLING REFERENCES: every warp in every definition (not just
//     the merged view), every story NPC post/patch, and every
//     narrative-db chapter location must target a defined map id.
//     (Legendary-arc `lair` fields are lore slugs, not map ids — the
//     designed stubs in story-kanto prove it — so they are out of scope
//     here by design; narrative-db-checks owns event/trainer integrity.)
//
// Census at W3 baseline (post-split): 484 definitions, 432 unique ids,
// 43 duplicated ids (14 identical / 29 drifted).

import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0; const failures = [];
function ok(name, cond, detail = '') { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name + (detail ? ' — ' + detail : '')); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));

const packs = [];
{
  const base = await D('maps.mjs');
  packs.push(['maps.mjs', base.MAPS]);
  for (let i = 2; i <= 9; i++) {
    const mod = await D(`maps${i}.mjs`);
    packs.push([`maps${i}.mjs`, mod[`MAPS${i}`]]);
  }
}
const MERGED = {};
for (const [, obj] of packs) Object.assign(MERGED, obj);
const byId = new Map();
for (const [f, obj] of packs) for (const [id, m] of Object.entries(obj)) {
  if (!byId.has(id)) byId.set(id, []);
  byId.get(id).push({ file: f, m, json: JSON.stringify(m) });
}
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };

// ---------- 1. census ----------
const totalDefs = [...byId.values()].reduce((a, v) => a + v.length, 0);
ok('census: 484 map definitions across maps.mjs…maps9.mjs', totalDefs === 484, `got ${totalDefs} — a wave that adds/removes a definition updates this line in the same commit`);
ok('census: 432 unique map ids after the split', byId.size === 432, `got ${byId.size}`);

// ---------- 2. the victory-road split is permanent ----------
const vr = byId.get('victory-road') || [];
ok('victory-road defined exactly once, in maps9, as Summit Road (Borea)',
  vr.length === 1 && vr[0].file === 'maps9.mjs' && vr[0].m.name === 'Summit Road',
  JSON.stringify(vr.map((x) => x.file)));
const vm = byId.get('victory-road-maris') || [];
ok('victory-road-maris defined exactly once, in maps7, as Crown Road (Maris)',
  vm.length === 1 && vm[0].file === 'maps7.mjs' && vm[0].m.name === 'Crown Road',
  JSON.stringify(vm.map((x) => x.file)));

const wset = (id, to) => (MERGED[id].warps || []).filter((w) => w.to.map === to).map((w) => `${w.x},${w.y}->${w.to.x},${w.to.y}`).sort();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok('chain: evergrande -> victory-road-maris (4 warps, authored landings)',
  eq(wset('evergrande', 'victory-road-maris'), ['14,6->11,14', '15,6->12,14', '20,6->18,1', '21,6->19,1']), wset('evergrande', 'victory-road-maris').join(' '));
ok('chain: evergrande -> victory-road is empty (no cross-region warp left)',
  wset('evergrande', 'victory-road').length === 0);
ok('chain: victory-road-maris -> evergrande (4 returns)',
  eq(wset('victory-road-maris', 'evergrande'), ['11,15->14,7', '12,15->15,7', '18,0->20,5', '19,0->21,5']), wset('victory-road-maris', 'evergrande').join(' '));
ok('chain: r223 + pokemon-league -> victory-road (2 + 2 warps)',
  eq(wset('r223', 'victory-road'), ['11,17->12,16', '12,17->12,16']) && eq(wset('pokemon-league', 'victory-road'), ['13,17->12,1', '14,17->12,1']));
ok('chain: victory-road -> r223 + pokemon-league (4 returns)',
  eq([...wset('victory-road', 'r223'), ...wset('victory-road', 'pokemon-league')].sort(), ['12,0->13,16', '12,17->11,1', '13,0->14,16', '13,17->12,1']));
{
  const inbound = { 'victory-road': new Set(), 'victory-road-maris': new Set() };
  for (const [id, m] of Object.entries(MERGED)) for (const w of m.warps || []) if (inbound[w.to.map]) inbound[w.to.map].add(id);
  ok('chain: inbound to victory-road only from r223 + pokemon-league', eq([...inbound['victory-road']].sort(), ['pokemon-league', 'r223']), [...inbound['victory-road']].join(','));
  ok('chain: inbound to victory-road-maris only from evergrande', eq([...inbound['victory-road-maris']].sort(), ['evergrande']), [...inbound['victory-road-maris']].join(','));
}

// ---------- 3. the drift ratchet ----------
// id: [status 'I'|'D', 'file:fnv8', ...] — copies in merge order, winner last.
// Burn-down rule: a commit that reconciles or deliberately edits a copy
// updates that id's line here in the same commit. Nothing else may move it.
const BASELINE = {
  "center": ['D', 'maps.mjs:bb3ce9d4', 'maps3.mjs:779a3d3e'],
  "ceruleancave": ['D', 'maps2.mjs:fdc075ab', 'maps3.mjs:46e003ef'],
  "cinnabar": ['I', 'maps2.mjs:3b9e0f64', 'maps3.mjs:3b9e0f64'],
  "dojo": ['D', 'maps2.mjs:d5bd6555', 'maps3.mjs:164b72a8'],
  "fuchsia": ['I', 'maps2.mjs:c4a97f15', 'maps3.mjs:c4a97f15'],
  "gamecorner": ['D', 'maps2.mjs:37481247', 'maps4.mjs:e32d7897'],
  "gym-celadon": ['I', 'maps2.mjs:b35a031f', 'maps3.mjs:b35a031f'],
  "gym-cerulean": ['I', 'maps2.mjs:2b5ba67b', 'maps3.mjs:2b5ba67b'],
  "gym-cinnabar": ['D', 'maps2.mjs:10d6a21c', 'maps3.mjs:10d6a21c', 'maps4.mjs:14befa4b'],
  "gym-fuchsia": ['I', 'maps2.mjs:6e7a3bac', 'maps3.mjs:6e7a3bac'],
  "gym-saffron": ['D', 'maps2.mjs:fd33dceb', 'maps3.mjs:fd33dceb', 'maps4.mjs:9c869a6b'],
  "gym-vermilion": ['I', 'maps2.mjs:c9bc48c8', 'maps3.mjs:c9bc48c8'],
  "gym-viridian": ['D', 'maps2.mjs:0ffee92f', 'maps3.mjs:cccc62bf'],
  "hideout": ['D', 'maps2.mjs:ce1ebeed', 'maps4.mjs:04c239d9'],
  "indigo": ['I', 'maps2.mjs:d8421648', 'maps3.mjs:d8421648'],
  "lavender": ['I', 'maps2.mjs:b6496b5b', 'maps3.mjs:b6496b5b'],
  "league": ['D', 'maps2.mjs:d1bda1de', 'maps3.mjs:45ee82be'],
  "mansion": ['D', 'maps2.mjs:6036b681', 'maps3.mjs:0b89e84d'],
  "newisland": ['D', 'maps2.mjs:06f895d7', 'maps3.mjs:87e908ce', 'maps4.mjs:0a2b629f'],
  "pallet": ['D', 'maps.mjs:4b19b4ef', 'maps2.mjs:e32d3d85', 'maps3.mjs:9797c889'],
  "pewter": ['D', 'maps.mjs:c6fbbbdb', 'maps2.mjs:74dbbce8'],
  "powerplant": ['D', 'maps2.mjs:7ce38a29', 'maps3.mjs:f19569a9'],
  "rocktunnel": ['D', 'maps2.mjs:474d1700', 'maps3.mjs:a4e228fb'],
  "route10": ['I', 'maps2.mjs:d1f5b22e', 'maps3.mjs:d1f5b22e'],
  "route12": ['D', 'maps2.mjs:36d73b34', 'maps3.mjs:39ebce16'],
  "route15": ['I', 'maps2.mjs:babb41d0', 'maps3.mjs:babb41d0'],
  "route16": ['I', 'maps2.mjs:1eaf6921', 'maps3.mjs:1eaf6921'],
  "route19": ['D', 'maps2.mjs:4fd4b29e', 'maps3.mjs:94d84d03'],
  "route20": ['I', 'maps2.mjs:ef5202c8', 'maps3.mjs:ef5202c8'],
  "route22": ['D', 'maps2.mjs:7626f36c', 'maps3.mjs:54796ea0'],
  "route8": ['D', 'maps2.mjs:720445b3', 'maps3.mjs:b69ace77'],
  "route9": ['D', 'maps2.mjs:bbff285f', 'maps3.mjs:8dd0c280'],
  "safari": ['D', 'maps2.mjs:a840460d', 'maps3.mjs:2a374dee'],
  "saffron": ['I', 'maps2.mjs:58e6e12d', 'maps3.mjs:58e6e12d'],
  "seafoam": ['D', 'maps2.mjs:e1621a14', 'maps3.mjs:00bf11b4'],
  "silph1": ['D', 'maps2.mjs:33bf502b', 'maps3.mjs:de66dcd1', 'maps4.mjs:b46c0ad2'],
  "silph2": ['D', 'maps2.mjs:21068e6c', 'maps3.mjs:a3e6994c', 'maps4.mjs:c666a5eb'],
  "stanne": ['D', 'maps2.mjs:24fa77c5', 'maps4.mjs:9c9e452f'],
  "tower1": ['I', 'maps2.mjs:008f0030', 'maps3.mjs:008f0030'],
  "tower2": ['D', 'maps2.mjs:67e834db', 'maps3.mjs:209d7be2'],
  "vermilion": ['D', 'maps2.mjs:95f01316', 'maps4.mjs:3ea316ac', 'maps5.mjs:b04ae76c', 'maps6.mjs:d97cdbc0'],
  "victoryroad": ['D', 'maps2.mjs:68ee1404', 'maps3.mjs:4d27c6e3'],
  "viridian": ['D', 'maps.mjs:ee32a92d', 'maps2.mjs:2de2d36f', 'maps3.mjs:af6d11d0'],
};

const dupNow = new Map([...byId.entries()].filter(([, v]) => v.length > 1));
ok('ratchet: duplicated-id set is exactly the W3 baseline (43 ids)',
  eq([...dupNow.keys()].sort(), Object.keys(BASELINE).sort()),
  `added: ${[...dupNow.keys()].filter((id) => !BASELINE[id]).join(',') || 'none'} · removed: ${Object.keys(BASELINE).filter((id) => !dupNow.has(id)).join(',') || 'none'}`);
const identicalNow = [];
for (const [id, [status, ...want]] of Object.entries(BASELINE)) {
  const v = dupNow.get(id);
  if (!v) { ok(`ratchet: ${id} still duplicated`, false, 'definition removed without a baseline update'); continue; }
  const got = v.map((x) => `${x.file}:${fnv(x.json)}`);
  ok(`ratchet: ${id} copies unchanged (${status === 'I' ? 'identical' : 'drifted, frozen'})`,
    eq(got, want), `want ${want.join(' ')} · got ${got.join(' ')} — if this edit was deliberate, update the baseline line in this commit`);
  if (v.every((x) => x.json === v[0].json)) identicalNow.push(id);
}
ok('identical set: the 14 byte-identical duplicates are exactly the baseline I-set',
  eq(identicalNow.sort(), Object.entries(BASELINE).filter(([, [s]]) => s === 'I').map(([id]) => id).sort()),
  identicalNow.join(','));
console.log(`  registry: ${identicalNow.length} identical duplicates (tolerated, byte-identical): ${identicalNow.join(', ')}`);
console.log(`  registry: ${Object.keys(BASELINE).length - identicalNow.length} drifted duplicates frozen by fingerprint — see W3-DUALCOPY-REGISTRY.md`);

// ---------- 4. no dangling references ----------
let warpN = 0; const badWarps = [];
for (const [id, v] of byId) for (const x of v) for (const w of x.m.warps || []) {
  warpN++;
  if (!byId.has(w.to.map)) badWarps.push(`${id}@${x.file} -> ${w.to.map}`);
}
ok(`references: all ${warpN} warps in all definitions target defined maps`, badWarps.length === 0, badWarps.slice(0, 5).join(' · '));

const asArr = (v) => (Array.isArray(v) ? v : Object.values(v || {}));
let postN = 0; const badPosts = [];
for (const [f, keys] of [['story-johto.mjs', ['JOHTO_NPCS', 'JOHTO_NPC_PATCHES']], ['story-hoenn.mjs', ['HOENN_NPCS', 'HOENN_NPC_PATCHES']], ['story-sinnoh.mjs', ['SINNOH_NPCS', 'SINNOH_NPC_PATCHES']]]) {
  const mod = await D(f);
  for (const k of keys) for (const n of asArr(mod[k])) {
    if (!n || !n.map) continue;
    postN++;
    if (!byId.has(n.map)) badPosts.push(`${f}:${k}:${n.name || '?'} -> ${n.map}`);
  }
}
ok(`references: all ${postN} story NPC posts/patches target defined maps`, badPosts.length === 0, badPosts.slice(0, 5).join(' · '));

const nd = await D('narrative-db.mjs');
let locN = 0; const badLocs = [];
for (const c of nd.NARRATIVE_CHAPTERS) for (const m of c.locations || []) {
  locN++;
  if (!byId.has(m)) badLocs.push(`${c.id} -> ${m}`);
}
ok(`references: all ${locN} narrative-db chapter locations are defined maps`, badLocs.length === 0, badLocs.slice(0, 5).join(' · '));

// Wally's finale post rides the split (also covered by actor-lifecycle,
// pinned here because this gate owns the split):
{
  const hoenn = await D('story-hoenn.mjs');
  const wally = asArr(hoenn.HOENN_NPCS).find((n) => n.name === 'WALLY' && n.hoenn === 'wally_final');
  ok('split: Wally finale post stands on victory-road-maris (11,6)',
    !!wally && wally.map === 'victory-road-maris' && wally.x === 11 && wally.y === 6,
    wally ? `${wally.map}@${wally.x},${wally.y}` : 'post not found');
}

console.log(`\nmap-id-registry-checks: ${pass} pass, ${failures.length} fail`);
process.exit(failures.length ? 1 : 0);
