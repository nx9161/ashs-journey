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
// Reconcile R1 (2026-11-15): league, pallet, viridian, pewter and center
// reconciled to single definitions — 477 definitions, 38 duplicated ids
// (14 identical / 24 drifted). vermilion was found to be a spread-
// derivation chain (maps2 base -> maps4/maps5 patches -> maps6 winner),
// so under the Director's derivation-base ruling (R2/newisland precedent)
// it stands as a frozen layered definition, pinned below — NOT deleted.
// Folded view proven byte-identical across the change
// (your_files/reconcile-r1).
// Reconcile R2 (2026-11-15, merged onto R1 by the Director): ceruleancave,
// gym-viridian, route12, silph2 and victoryroad reconciled to single
// definitions, and newisland's maps2 copy retired — 470 definitions,
// 33 duplicated ids (14 identical / 19 drifted). maps3.newisland is NOT
// a dead copy: maps4 derives its winner from it, so the pair stands as a
// frozen two-layer definition, pinned below. Folded view proven
// byte-identical across the union (your_files/reconcile-r2).
// Reconcile R3 (2026-11-15): the 17 behaviour-only MEDIUM ids reconciled —
// 13 to single definitions (dojo, mansion, powerplant, rocktunnel, route19,
// route22, route8, route9, safari, seafoam, tower2, gym-cinnabar,
// gym-saffron) and 16 dead copies retired — 454 definitions, 20 duplicated
// ids (14 identical / 6 drifted). Four of the 17 are NOT single: stanne,
// gamecorner and hideout stand as frozen two-layer definitions (maps4
// spreads the maps2 base and patches start/warps/events), and silph1's
// maps2 corpse was retired leaving its maps3 base + maps4 patch pair
// frozen. Folded view proven byte-identical across the change
// (your_files/reconcile-r3).
// Reconcile R4 (2026-11-15): the identical-14 (cinnabar, fuchsia, indigo,
// lavender, route10, route15, route16, route20, saffron, tower1,
// gym-celadon, gym-cerulean, gym-fuchsia, gym-vermilion) reconciled —
// each pair was byte-identical literals in maps2+maps3, and a full sweep
// (intra-pack derivations + pinned direct reads) found no derivation
// base and no pack-specific reader for any of them, so the fold-
// discarded maps2 copy was deleted and the maps3 copy stands as the
// single definition: 440 definitions, 6 duplicated ids (0 identical /
// 6 drifted, all frozen layered). Folded view proven byte-identical
// across the change (your_files/reconcile-r4).
// PROGRAM CLOSED: with R4 the dual-copy reconciliation is complete —
// the only duplicated ids left on the books are the six sanctioned
// frozen layered definitions: vermilion (4-layer derivation chain, R1),
// newisland (maps3 base + maps4 patch, R2), and stanne, gamecorner,
// hideout (maps2 base + maps4 patch) and silph1 (maps3 base + maps4
// patch) from R3 — each a single definition by construction, not a
// duplicate. The true-duplicate count is 0.

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
ok('census: 440 map definitions across maps.mjs…maps9.mjs', totalDefs === 440, `got ${totalDefs} — a wave that adds/removes a definition updates this line in the same commit`);
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
// W-CHAR2 T1 (deliberate edit, disclosed): gamecorner / silph1 /
// vermilion lines moved — service posts standing on those maps took
// per-region service kinds (art field only; the frozen layer structure
// is untouched, every layer's fingerprint moved only because the
// resolved NPC data carries the new art value).
const BASELINE = {
  // Reconcile R3: maps2 is NOT a dead copy — maps4.mjs derives its winner
  // from it ({...MAPS2.gamecorner, warps + the poster entrance}), so the
  // pair is frozen as a two-layer single definition.
  "gamecorner": ['D', 'maps2.mjs:b030ed1c', 'maps4.mjs:19c55a0c'],
  // Reconcile R3: maps2 is NOT a dead copy — maps4.mjs derives its winner
  // from it ({...MAPS2.hideout, warps re-pointed at the Game Corner poster
  // entrance, + the entry event}), so the pair is frozen as a two-layer
  // single definition.
  "hideout": ['D', 'maps2.mjs:ce1ebeed', 'maps4.mjs:04c239d9'],
  // Reconcile R2: maps2's alternate island retired; maps3 is NOT a dead copy —
  // maps4.mjs derives its winner from it ({...MAPS3.newisland, events, warps}),
  // so the pair is frozen as a two-layer single definition.
  "newisland": ['D', 'maps3.mjs:87e908ce', 'maps4.mjs:0a2b629f'],
  // Reconcile R3: maps2's corpse retired; maps3 is NOT a dead copy —
  // maps4.mjs derives its winner from it ({...MAPS3.silph1, events + the
  // rival ambush}), so the pair is frozen as a two-layer single definition.
  "silph1": ['D', 'maps3.mjs:78f6b844', 'maps4.mjs:e3b8c1cd'],
  // Reconcile R3: maps2 is NOT a dead copy — maps4.mjs derives its winner
  // from it ({...MAPS2.stanne, start} — the boarding patch), so the pair
  // is frozen as a two-layer single definition.
  "stanne": ['D', 'maps2.mjs:24a81714', 'maps4.mjs:99facee4'],
  // vermilion: FROZEN DERIVATION CHAIN (Reconcile R1, Director ruling) —
  // maps2's literal is the derivation base: MAPS4.vermilion spreads it
  // (+SAILOR BRINE, +ev_movie_arrive), MAPS5 spreads maps4 (+CAPT AMBER),
  // MAPS6 spreads maps5 (+CAPT EASTBOUND) and wins the fold. The earlier
  // copies are load-bearing layers, not dead duplicates; do not delete
  // them without materializing the chain first.
  "vermilion": ['D', 'maps2.mjs:bb3a1cf6', 'maps4.mjs:b3365ecc', 'maps5.mjs:7e80e24c', 'maps6.mjs:2267d920'],
};

const dupNow = new Map([...byId.entries()].filter(([, v]) => v.length > 1));
ok('ratchet: duplicated-id set is exactly the baseline (6 ids after Reconcile R1 + R2 + R3 + R4 — all frozen layered definitions)',
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
ok('identical set: no byte-identical duplicates remain — the identical set is empty after Reconcile R4',
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
  const wally = asArr(hoenn.HOENN_NPCS).find((n) => n.name === 'EMIL' && n.hoenn === 'wally_final');
  ok('split: Emil finale post stands on victory-road-maris (11,6)',
    !!wally && wally.map === 'victory-road-maris' && wally.x === 11 && wally.y === 6,
    wally ? `${wally.map}@${wally.x},${wally.y}` : 'post not found');
}

console.log(`\nmap-id-registry-checks: ${pass} pass, ${failures.length} fail`);
process.exit(failures.length ? 1 : 0);
