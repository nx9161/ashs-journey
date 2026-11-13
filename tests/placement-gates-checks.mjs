// tests/placement-gates-checks.mjs — Wave W4 (War Room E2E Phase 2):
// the strict placement-gates guard. Standalone suite in the repo's
// checks style:
//   node tests/placement-gates-checks.mjs
//
// WHY THIS EXISTS: two towns reported "done" — Arcport and Flintridge —
// failed the STRICT per-town placement gates (audit Cluster 1). The W4
// root-cause pass found the failures were mostly AUDIT-INSTRUMENT
// defects, not town defects:
//   * the network tier did not count boardwalk, so Arcport's authored
//     dock street was invisible to it (connectivity 72/110, gym
//     step-offs 5/7 — while the walkable graph connects 177/177);
//   * the BUILD classifier missed the kit's structural kinds (gym-rock,
//     gym-volt, fossildisplay, dresswindow, ancientpillar), so single
//     buildings fragmented into fake footprints (Flintridge's Mart read
//     as a merged pair; its museum/gym complex at 0.32 ring clearance);
//   * the apron ring counted the town frame (cavewall cliff face) as a
//     crowding neighbour, measuring the frame instead of the building.
// The remainder was town-side: six unmarked junctions in Flintridge,
// five in Arcport (counted once the dock street is visible), and two
// Arcport lamps straddling fabric seams. W4 fixed both sides, and the
// audit-side fixes are deliberately SCOPED (a per-town street-material
// registry with exactly one entry; classifier corrections that move no
// other town). This suite is the ratchet that keeps them scoped.
//
// WHAT THIS GATE HOLDS:
//  1. THE REGISTRY IS EXACTLY { vermilion: ['boardwalk'] } — any new
//     entry is a reviewed act, never a silent widening.
//  2. BOTH W4 TOWNS PASS the strict gates on the production scoring
//     path (scoreTown + tiersFor + gateCheck, as the CLI runs them).
//  3. NEGATIVE: vermilion scored with RAW tiers still fails, with the
//     pre-W4 connectivity/step-off numbers (72/110, 5/7) — the
//     registration is load-bearing and the old blindness reproducible.
//     (Its raw component count pins at 1, not the pre-W4 2: the town-
//     side lamp re-seat retired the isolated shore cell that used to
//     form the second component.)
//  4. NO OTHER TOWN MOVES: every town's full gate tuple equals its
//     pinned value below (pre-W4 baselines for the untouched towns;
//     post-W4 values for vermilion + pewter). Any future change to
//     the audit's tiers/classifiers or to a town's data that moves a
//     tuple fails HERE, by town — update the pin in the same commit
//     as a reviewed change (the W3 burn-down rule).
//     ONE DOCUMENTED EXCEPTION: rustboro's pin is its POST-W4 tuple.
//     Rustboro carries four fossildisplay cells (its fossil exhibits);
//     the BUILD correction counts them as the mass they are, refining
//     its apronMin 0.875 -> 0.833. Its gate STATUS and apronLow are
//     unchanged (PASS before and after) — a measurement refinement of
//     one sub-metric, disclosed here and in the W4 repair note.
//     Tuple: [pass, connOk, connPairs, stepTouch, stepTot, components,
//     SECOND DOCUMENTED EXCEPTION (T19 merge): cianwood's pin is its
//     POST-T19 tuple. The Tidewall rebuild (gym terrace + worn steps,
//     jetty footing repaired) moved the town FAIL -> PASS: conn
//     42/72 -> 72/72, junctionSites 2 -> 6, apronMin 0.824 -> 0.688,
//     strict 0.9591 -> 0.7965, fabric 0.9926 -> 0.9993 — the rebuilt
//     town's measured values, re-pinned at the T19 director merge.
//     Tuple: [pass, connOk, connPairs, stepTouch, stepTot, components,
//     junctionSites, junctionsBare, apronLow, apronMin, merged,
//     onFabric, shoulderOrphans, unanchoredAny, strict, fabric].

import { loadMaps, makeTiers, townSetOf, analyzeMap } from '../scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor, STREET_REGISTRY } from '../scripts/audit-placement.mjs';

let pass = 0; const failures = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps();
const tiers = makeTiers(TILE_CHARS);
const towns = townSetOf(MAPS);
const ids = [...towns].filter((id) => MAPS[id]);

async function gateTuple(id, t) {
  const r = await scoreTown(id, MAPS, WALKABLE, t);
  const clarity = analyzeMap(id, MAPS[id], { WALKABLE, tiers, townSet: towns });
  const gate = gateCheck(r, clarity);
  return { r, gate, tuple: [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot,
    r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged,
    r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny,
    +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)] };
}

// 1. registry scope lock
ok('street registry is exactly { vermilion: [boardwalk] }',
  JSON.stringify(STREET_REGISTRY) === '{"vermilion":["boardwalk"]}',
  JSON.stringify(STREET_REGISTRY));

// 2. census: the 64 towns of townSetOf (pallet included)
ok('gate census covers 64 towns', ids.length === 64, `${ids.length} ids`);

// 3. negative: raw tiers reproduce the pre-W4 vermilion blindness
{
  const { r, gate } = await gateTuple('vermilion', tiers);
  ok('negative: vermilion on raw tiers still FAILS the gates', gate.pass === false);
  ok('negative: raw-tiers connectivity is the pre-W4 72/110', r.connOk === 72 && r.connPairs === 110, `${r.connOk}/${r.connPairs}`);
  ok('negative: raw-tiers step-offs are the pre-W4 5/7', r.stepTouch === 5 && r.stepTot === 7, `${r.stepTouch}/${r.stepTot}`);
  ok('negative: raw-tiers components pin at 1 (split shore cell retired by the lamp re-seat)', r.netComponents === 1, `${r.netComponents}`);
}

// 4. per-town pins on the production path (targets use post-W4 pins)
const PIN = {
  "azalea": [1, 132, 132, 8, 8, 1, 8, 0, 0, 0.688, 0, 0, 0, 0, 0.7723, 0.9977],
  "blackthorn": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.824, 0, 0, 0, 0, 0.9534, 0.9867],
  "canalave": [0, 36, 90, 8, 8, 3, 3, 0, 1, 0.417, 0, 0, 0, 0, 1, 1],
  "celadon": [1, 156, 156, 10, 10, 1, 3, 0, 0, 0.611, 0, 0, 0, 0, 0.9725, 1],
  "celestic": [1, 56, 56, 6, 6, 1, 3, 0, 0, 0.882, 0, 0, 0, 0, 1, 1],
  "cerulean": [1, 132, 132, 7, 7, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.7314, 0.9839],
  "cherrygrove": [1, 72, 72, 5, 5, 1, 5, 0, 0, 0.688, 0, 0, 0, 0, 0.7126, 0.9902],
  "cianwood": [1, 72, 72, 7, 7, 1, 6, 0, 0, 0.688, 0, 0, 0, 0, 0.7965, 0.9993],
  "cinnabar": [1, 90, 90, 9, 9, 1, 3, 0, 0, 0.769, 0, 0, 0, 0, 0.8694, 1],
  "dewford": [0, 72, 110, 7, 7, 1, 6, 0, 1, 0.588, 0, 0, 0, 0, 0.9625, 0.9625],
  "ecruteak": [1, 156, 156, 11, 11, 1, 6, 0, 0, 0.625, 0, 0, 0, 0, 0.7915, 0.9937],
  "eterna": [1, 182, 182, 8, 8, 1, 7, 0, 0, 0.813, 0, 0, 0, 0, 0.9593, 0.9921],
  "evergrande": [0, 12, 42, 5, 5, 2, 4, 0, 0, 0.938, 0, 0, 0, 0, 0.9773, 0.9778],
  "fallarbor": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.875, 0, 0, 0, 0, 0.9463, 0.984],
  "fight-area": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 1, 1],
  "floaroma": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 0.9994, 0.9994],
  "fortree": [0, 72, 110, 7, 7, 1, 2, 0, 0, 0.824, 0, 0, 0, 0, 0.9756, 0.9805],
  "frontierhub": [1, 210, 210, 15, 15, 1, 3, 0, 0, 0.85, 0, 0, 0, 0, 0.9829, 0.9829],
  "fuchsia": [1, 182, 182, 9, 9, 1, 3, 0, 0, 0.643, 0, 0, 0, 0, 0.8625, 0.9952],
  "goldenrod": [1, 182, 182, 10, 10, 1, 12, 0, 0, 0.65, 0, 0, 0, 0, 0.8671, 0.9828],
  "hearthome": [1, 272, 272, 9, 9, 1, 3, 0, 0, 0.786, 0, 0, 0, 1, 0.991, 0.9973],
  "indigo": [1, 156, 156, 11, 11, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.9164, 0.988],
  "jubilife": [1, 210, 210, 7, 7, 1, 11, 0, 0, 0.813, 0, 0, 0, 0, 0.9336, 0.9978],
  "kumquat": [0, 42, 72, 7, 7, 1, 6, 0, 3, 0.5, 0, 0, 0, 0, 0.9742, 0.9742],
  "lavaridge": [0, 72, 72, 7, 7, 1, 1, 0, 0, 0.929, 0, 0, 0, 0, 0.9715, 0.9715],
  "lavender": [1, 132, 132, 7, 7, 1, 2, 0, 0, 0.643, 0, 0, 0, 0, 0.7211, 0.9873],
  "lilycove": [0, 42, 72, 5, 5, 1, 8, 0, 0, 0.706, 0, 0, 0, 0, 0.9249, 0.9687],
  "littleroot": [1, 90, 90, 8, 8, 1, 6, 0, 0, 0.929, 0, 0, 0, 1, 0.8968, 0.987],
  "mahogany": [1, 156, 156, 7, 7, 1, 3, 0, 0, 0.857, 0, 0, 0, 0, 0.9727, 1],
  "mauville": [1, 210, 210, 7, 7, 1, 9, 0, 0, 0.929, 0, 0, 0, 0, 0.9382, 0.9931],
  "mikan": [0, 42, 72, 7, 7, 1, 4, 0, 3, 0.429, 0, 0, 0, 0, 0.9717, 0.9717],
  "moro": [0, 12, 30, 4, 4, 1, 1, 0, 1, 0.529, 0, 0, 0, 0, 0.9402, 0.9402],
  "mossdeep": [0, 30, 132, 6, 6, 2, 3, 0, 0, 0.667, 0, 0, 0, 0, 0.9289, 0.9289],
  "navel": [0, 30, 90, 6, 6, 1, 5, 0, 1, 0.588, 0, 0, 0, 0, 0.9418, 0.9418],
  "newbark": [1, 72, 72, 7, 7, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.7385, 0.9913],
  "oldale": [0, 110, 110, 5, 5, 1, 4, 0, 0, 0.857, 0, 0, 0, 1, 0.9301, 0.9665],
  "olivine": [0, 72, 110, 7, 7, 1, 9, 0, 0, 0.929, 0, 0, 0, 0, 0.9134, 0.9864],
  "oreburgh": [1, 182, 182, 8, 8, 1, 1, 0, 0, 0.714, 0, 0, 0, 0, 0.9985, 1],
  "pacifidlog": [0, 12, 30, 4, 4, 1, 0, 0, 0, 0.75, 0, 0, 0, 0, 0.9367, 0.9367],
  "pallet": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.643, 0, 0, 0, 0, 0.9463, 0.9945],
  "pastoria": [1, 182, 182, 8, 8, 1, 8, 0, 0, 0.824, 0, 0, 0, 0, 0.9582, 0.9945],
  "petalburg": [1, 110, 110, 7, 7, 1, 6, 0, 0, 0.857, 0, 0, 0, 1, 0.9611, 0.9944],
  "pewter": [1, 110, 110, 8, 8, 1, 6, 0, 0, 0.824, 0, 0, 0, 0, 0.8602, 1],
  "pummelo": [0, 30, 56, 6, 6, 1, 3, 0, 1, 0.529, 0, 0, 0, 0, 0.9639, 0.9639],
  "resort-area": [1, 182, 182, 6, 6, 1, 5, 0, 0, 0.941, 0, 0, 0, 0, 0.944, 0.9846],
  "rustboro": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.833, 0, 0, 0, 0, 0.9566, 0.9877],
  "saffron": [1, 156, 156, 10, 10, 1, 2, 0, 0, 0.875, 0, 0, 0, 0, 0.7649, 1],
  "sandgem": [1, 156, 156, 7, 7, 1, 1, 0, 0, 0.833, 0, 0, 0, 0, 1, 1],
  "shamouti": [0, 30, 182, 6, 6, 1, 4, 0, 1, 0.588, 0, 0, 0, 0, 0.912, 0.912],
  "silvertown": [0, 90, 90, 6, 6, 1, 6, 0, 0, 0.929, 0, 0, 0, 1, 0.9125, 0.9747],
  "slateport": [0, 56, 90, 6, 6, 1, 1, 0, 0, 0.875, 0, 0, 0, 0, 0.9972, 0.9972],
  "snowpoint": [1, 90, 90, 8, 8, 1, 3, 0, 0, 0.824, 0, 0, 0, 0, 0.998, 0.9983],
  "solaceon": [1, 110, 110, 7, 7, 1, 11, 0, 0, 0.938, 0, 0, 0, 0, 0.9226, 0.9948],
  "sootopolis": [0, 30, 30, 6, 6, 1, 3, 0, 1, 0.588, 0, 0, 0, 0, 0.9831, 0.9834],
  "sunnyshore": [1, 132, 132, 8, 8, 1, 3, 0, 0, 0.875, 0, 0, 0, 0, 0.9967, 0.9967],
  "survival-area": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 1, 1],
  "trovita": [0, 30, 56, 6, 6, 1, 3, 0, 3, 0.563, 0, 0, 0, 0, 0.9466, 0.9466],
  "twinleaf": [1, 90, 90, 6, 6, 1, 3, 0, 0, 0.824, 0, 0, 0, 0, 0.9833, 0.994],
  "valencia": [0, 42, 72, 7, 7, 1, 2, 0, 2, 0.429, 0, 0, 0, 0, 0.9654, 0.9654],
  "veilstone": [1, 132, 132, 8, 8, 1, 9, 0, 0, 0.765, 0, 0, 0, 0, 0.94, 0.9965],
  "verdanturf": [0, 56, 90, 6, 6, 1, 1, 0, 0, 0.875, 0, 0, 0, 0, 0.9444, 0.9553],
  "vermilion": [1, 110, 110, 7, 7, 1, 7, 0, 0, 0.8, 0, 0, 0, 0, 0.8378, 0.9961],
  "violet": [1, 156, 156, 9, 9, 1, 4, 0, 0, 0.65, 0, 0, 0, 0, 0.9083, 0.9967],
  "viridian": [1, 240, 240, 7, 7, 1, 3, 0, 0, 0.643, 0, 0, 0, 0, 0.933, 1],};
for (const id of ids) {
  const { tuple } = await gateTuple(id, tiersFor(id, tiers));
  ok(`pin: ${id} gate tuple unchanged`, JSON.stringify(tuple) === JSON.stringify(PIN[id]),
    `got ${JSON.stringify(tuple)} want ${JSON.stringify(PIN[id])}`);
}

console.log(`\nplacement-gates-checks: ${pass} pass, ${failures.length} fail`);
process.exit(failures.length ? 1 : 0);
