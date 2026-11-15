// tests/interior-variety-checks.mjs — Wave W16: the house-interior
// variety guard (unioned at the W16-T2 merge).
// Run: node tests/interior-variety-checks.mjs (exit 1 on any failure).
//
// This suite is the UNION of the two tranche guards, kept whole:
//   Part I  — W16-T1's sections G-1..G-5 (123 checks: G1-G3 group
//             retirement + the 13 T1 houses' invariant/reach/metric
//             pins), embedded verbatim from the T1 file.
//   Part II — W16-T2's sections A/B/C (202 checks: A per-house pins
//             x28, B group retirement x10, C layout quality for the
//             8 T2 layouts), embedded verbatim from the T2 file.
// Each part keeps its own loader, pins and check names; the parts
// share only the exit code. Merged total: 616 checks.
//   Part III — W16-B's sections W16B1..W16B6 (291 checks: labs /
//             contests / league chambers / gym pairs), added at the
//             W16-T3 merge; T3's original 'B' labels are relabeled
//             W16B* because Part II already owns 'B' for house-group
//             retirement. Body otherwise verbatim.

import { buildGameJs } from '../scripts/build.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import path from 'node:path'; // for Part III (W16-B)
import { fileURLToPath } from 'node:url';

let PASS = 0, FAIL = 0;

// =====================================================================
// Part I — W16-T1 sections G-1..G-5 (verbatim; original header kept).
// =====================================================================
// interior-variety-checks.mjs — the INTERIOR VARIETY guard (War Room E2E
// Phase 2, Wave W16 — the NO-SAME-KIT law applied to house interiors).
// Run: node tests/interior-variety-checks.mjs (exit 1 on any failure).
//
// Why this exists: the NO-SAME-KIT audit (§4) measured 28 of 62 houses
// standing on 10 shared exact grids — the five big 14x10 templates
// (G1-G4, G9) are literally one room differing only in the single prop
// at (10,6). W16 retires the shared grids group by group: one member
// per group (the keeper, named below) keeps the inherited grid; every
// other member gets a full re-layout inside the unchanged shell, built
// only from already-registered kinds, with every invariant (warps,
// doors, landings, NPC posts incl. story-appended posts) byte-pinned.
//
// This suite lands with W16-T1 and covers G1-G3 (13 houses). W16-T2
// extends it to G4-G10 and W16-B to the labs/contests/chambers/gym
// pairs, per WAVE-W16-INTERIORS-PLAN.md §3 (G-1..G-5).
//
//   G-1 group retirement — member grid hashes pairwise distinct; the
//       only member still on the frozen template hash is the keeper.
//   G-2 invariant data pins — sha of the canonical {warps, start, npcs
//       (x,y,name), signs, items, hidden, events} per scoped house,
//       recorded at plan time on the pre-wave tree.
//   G-3 invariant cells — wall ring + door row byte-identical; post
//       cells, the landing pair, and story-appended post cells keep
//       their pre-wave char (the floor cell under a post never moves,
//       even where a layout uses the floor-kind identity lever).
//   G-4 reachability — BFS reach from landing == 91 for every scoped
//       14x10 house (the pre-wave baseline); every post reachable.
//   G-5 standard metrics — open floor >= 60% of interior cells; at
//       most one rug run (4-connected rug-kind component); and, for
//       the NEW layouts only, every solid furniture cell belongs to a
//       wall-anchored group (Interior Standard rules 1/4). Keepers are
//       exempt from the anchoring metric — their inherited template
//       carries a free-standing table at (2,6) by design of the grid
//       the keeper exists to preserve; they are pinned by G-1 instead.

{
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const js = buildGameJs({ auth: true });
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map });
vm.runInContext(js + '\n;this.__X = { MAPS, WALKABLE: [...WALKABLE] };', ctx);
const { MAPS, WALKABLE } = ctx.__X;
const walk = new Set(WALKABLE);
const kindOf = (ch) => TILE_CHARS[ch];
const sha12 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
const sha16 = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const gridHash = (m) => sha12(m.rows.join('\n'));

// ---------------- scope (W16-T1: G1-G3) --------------------------------
const GROUPS = [
  { name: 'G1', template: 'e9c665d9d0e5', keeper: 'house-violet',
    members: ['house-celestic', 'house-cianwood', 'house-littleroot-rival', 'house-twinleaf-rival', 'house-violet'] },
  { name: 'G2', template: 'f7f7dd9851dc', keeper: 'house-twinleaf',
    members: ['house-littleroot', 'house-mahogany', 'house-newbark', 'house-twinleaf'] },
  { name: 'G3', template: '0a1e6d87f134', keeper: 'house-oldale',
    members: ['house-cherrygrove', 'house-olivine', 'house-pastoria', 'house-oldale'] },
];
const SCOPED = GROUPS.flatMap(g => g.members);
// story-appended posts beyond the map npcs arrays (plan §1/§2)
const APPENDED = { 'house-cianwood': [[10, 5]] };
// G-2 pins, recorded at plan time on the pre-wave tree (12444481)
const DATA_PINS = {
  'house-celestic': '78ef3b26049be97c', 'house-cianwood': '3f7ea0563398cb58',
  'house-littleroot-rival': '99b0adbcb9bcccea', 'house-twinleaf-rival': 'd82b6ff91c8fd7dd',
  'house-violet': 'b3ab171cbc7d418f', 'house-littleroot': 'a988e63d95463bcd',
  'house-mahogany': '7eb1881599e14c83', 'house-newbark': 'b98adc13267c6a3c',
  'house-twinleaf': '5ee88bb635099e95', 'house-cherrygrove': 'da32839ef0fca5df',
  'house-olivine': '5a4cb195a5313904', 'house-pastoria': 'f0108bf52c98aba6',
  'house-oldale': 'd8608c89f2041bf2',
};
const RUGKINDS = new Set(['rug', 'rug2', 'rug3']);
const BASE_REACH = 91; // every scoped 14x10 house, pre-wave baseline

function bfsReach(m) {
  const rows = m.rows, H = rows.length, W = [...rows[0]].length;
  const starts = [];
  if (m.start) starts.push([m.start.x, m.start.y]);
  for (const w of (m.warps || [])) starts.push([w.x, w.y]);
  const seen = new Set(); const q = [];
  for (const [x, y] of starts) { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } }
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue;
      if (!walk.has([...rows[ny]][nx])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
const postsOf = (id) => [...(MAPS[id].npcs || []).map(n => [n.x, n.y]), ...(APPENDED[id] || [])];

// ---------------- G-1: group retirement --------------------------------
for (const g of GROUPS) {
  const hashes = g.members.map(id => gridHash(MAPS[id]));
  ok(`G-1 ${g.name} member grids pairwise distinct (${g.members.length} houses)`,
    new Set(hashes).size === hashes.length, hashes.join(','));
  ok(`G-1 ${g.name} keeper ${g.keeper} still on the frozen template grid`,
    gridHash(MAPS[g.keeper]) === g.template, gridHash(MAPS[g.keeper]));
  const stray = g.members.filter(id => id !== g.keeper && gridHash(MAPS[id]) === g.template);
  ok(`G-1 ${g.name} no non-keeper remains on the template grid`, stray.length === 0, stray.join(','));
}

// ---------------- G-2: invariant data pins -----------------------------
for (const id of SCOPED) {
  const m = MAPS[id];
  const canon = JSON.stringify({ w: m.warps, s: m.start, n: (m.npcs || []).map(n => [n.x, n.y, n.name]), g: m.signs, i: m.items, h: m.hidden, e: (m.events || []).length });
  ok(`G-2 ${id} invariant data (warps/start/npcs/signs/items/hidden/events) matches plan-time pin`,
    sha16(canon) === DATA_PINS[id], sha16(canon));
}

// ---------------- G-3: invariant cells ---------------------------------
for (const id of SCOPED) {
  const m = MAPS[id];
  const rows = m.rows.map(r => [...r]);
  let ringOk = rows[0].every(ch => kindOf(ch) === 'housewall') && rows[9].every((ch, x) => kindOf(ch) === ((x === 6 || x === 7) ? 'door' : 'housewall'));
  for (let y = 1; y <= 8 && ringOk; y++) if (kindOf(rows[y][0]) !== 'housewall' || kindOf(rows[y][13]) !== 'housewall') ringOk = false;
  ok(`G-3 ${id} wall ring + door cells byte-identical`, ringOk);
  const cells = [[6, 8], [7, 8], ...postsOf(id)];
  const bad = cells.filter(([x, y]) => kindOf(rows[y][x]) !== 'housefloor');
  ok(`G-3 ${id} landing pair + post cells keep their pre-wave floor char`, bad.length === 0, bad.map(c => c.join(',')).join(' '));
  const solidNbr = [];
  for (const [px, py] of postsOf(id)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
    if (!walk.has(rows[py + dy][px + dx])) solidNbr.push(`${px + dx},${py + dy}`);
  ok(`G-3 ${id} no solid tile beside any post (Standard rule 13)`, solidNbr.length === 0, solidNbr.join(' '));
}

// ---------------- G-4: reachability ------------------------------------
for (const id of SCOPED) {
  const reach = bfsReach(MAPS[id]);
  ok(`G-4 ${id} BFS reach == baseline ${BASE_REACH}`, reach.size === BASE_REACH, String(reach.size));
  const lost = postsOf(id).filter(([x, y]) => !reach.has(x + ',' + y));
  ok(`G-4 ${id} every post reachable`, lost.length === 0, lost.map(c => c.join(',')).join(' '));
}

// ---------------- G-5: standard metrics --------------------------------
for (const id of SCOPED) {
  const m = MAPS[id];
  const rows = m.rows.map(r => [...r]);
  let walkIn = 0; const rugSet = new Set(); const solidSet = new Set();
  for (let y = 1; y <= 8; y++) for (let x = 1; x <= 12; x++) {
    const ch = rows[y][x], k = x + ',' + y;
    if (walk.has(ch)) walkIn++;
    else solidSet.add(k);
    if (RUGKINDS.has(kindOf(ch))) rugSet.add(k);
  }
  ok(`G-5 ${id} open floor >= 60% of interior cells`, walkIn / 96 >= 0.60, (walkIn / 96 * 100).toFixed(1) + '%');
  let runs = 0; const rs = new Set(rugSet);
  while (rs.size) {
    runs++; const stack = [rs.values().next().value]; rs.delete(stack[0]);
    while (stack.length) { const [cx, cy] = stack.pop().split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (cx + dx) + ',' + (cy + dy); if (rs.has(k)) { rs.delete(k); stack.push(k); } } }
  }
  ok(`G-5 ${id} at most one rug run (single accent, Standard rule 8)`, runs <= 1, String(runs));
}
for (const g of GROUPS) for (const id of g.members) {
  if (id === g.keeper) continue; // keepers pinned by G-1 hash (see header)
  const rows = MAPS[id].rows.map(r => [...r]);
  const solidSet = new Set();
  for (let y = 1; y <= 8; y++) for (let x = 1; x <= 12; x++) if (!walk.has(rows[y][x])) solidSet.add(x + ',' + y);
  const anchored = new Set();
  for (const k of solidSet) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (kindOf(rows[y + dy][x + dx]) === 'housewall') { anchored.add(k); break; }
  }
  const stack = [...anchored];
  while (stack.length) { const [cx, cy] = stack.pop().split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (cx + dx) + ',' + (cy + dy); if (solidSet.has(k) && !anchored.has(k)) { anchored.add(k); stack.push(k); } } }
  const floating = [...solidSet].filter(k => !anchored.has(k));
  ok(`G-5 ${id} every solid furniture cell is wall-anchored or in a wall-anchored group (rules 1/4)`,
    floating.length === 0, floating.join(' '));
}
  PASS += pass; FAIL += fail;
  console.log(`interior-variety [Part I — W16-T1 G-sections]: ${pass} pass / ${fail} fail`);
}

// =====================================================================
// Part II — W16-T2 sections A/B/C (verbatim; original header kept).
// =====================================================================
// tests/interior-variety-checks.mjs — Wave W16: the house-interior variety guard.
// Run: node tests/interior-variety-checks.mjs (exit 1 on any failure).
//
// Pins the NO-SAME-KIT interior program (plan: WAVE-W16-INTERIORS-PLAN.md):
// the 10 shared house templates (28 houses) retire group by group; every
// scoped house keeps its shipped data, invariant cells, reachability and
// open floor byte-identical while its furniture layout becomes its own.
//
//   A (all 28 houses) — A1 data pin: sha256 over the map's
//      warps/start/npcs/signs/items/hidden/events (the census construction)
//      equals the pre-wave pin. A2 invariant cells: the char at every
//      wall-ring / warp / start / NPC-post / sign coordinate equals the
//      pre-wave char. A3 reach: census BFS (seeds = start + all warp
//      cells, 4-dir over WALKABLE chars) equals the pinned baseline.
//      A4 every NPC post cell is in the reached set. A5 open floor:
//      walkable interior share equals the pinned baseline and is >= 60%
//      (Interior Standard rule 2).
//   B (10 groups) — B1 member grid hashes pairwise distinct. B2 the named
//      keeper still stands on the frozen template hash. B3 every
//      non-keeper is off the template hash.
//   C (the 8 W16-T2 layouts L11-L18) — layout-quality pins scoped to the
//      tranche's own builds: C1 one rug accent (a single rug kind, one
//      connected run of <= 2 cells). C2 every solid furniture cell is
//      wall-adjacent or touches a wall-adjacent solid (Interior Standard
//      rules 1+4). C3 the door path carries no solid (14x10: the cols 6-7 corridor; 10x7: the landing pair — the small shell has no corridor in the shipped design). C4 every post's
//      four standing cells are walkable (rules 5/13).
//
// Global dead pockets (== 1069) are pinned by scripts/audit-reachability.mjs
// in the same runner's audits group; this suite pins the per-map half.
// W16-B room pins (labs / contests / chambers / gym pairs) land with W16-B.
// NOTE (T2 build state): sections A+C and B for G4-G10 are green on the T2
// branch; B for G1-G3 goes green when W16-T1 merges ahead of T2 (the
// merge sequences the tranches) — the checks are written whole here.

await (async () => {
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const { MAPS5 } = await import(join(ROOT, 'src/data/maps5.mjs'));
const { MAPS6 } = await import(join(ROOT, 'src/data/maps6.mjs'));
const { MAPS7 } = await import(join(ROOT, 'src/data/maps7.mjs'));
const { MAPS8 } = await import(join(ROOT, 'src/data/maps8.mjs'));
const { MAPS9 } = await import(join(ROOT, 'src/data/maps9.mjs'));
const { WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));
const { TILE_CHARS } = await import(join(ROOT, 'src/engine/tiles.mjs'));
const ALL = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const gridHash = (m) => sha(m.rows.join('\n')).slice(0, 12);
const dataSha = (m) => sha(JSON.stringify([m.warps || null, m.start || null, m.npcs || null, m.signs || null, m.items || null, m.hidden || null, m.events || null]));
const kindAt = (m, x, y) => TILE_CHARS[[...m.rows[y]][x]];
function bfs(m) {
  const H = m.rows.length, W = [...m.rows[0]].length;
  const starts = [];
  if (m.start) starts.push([m.start.x, m.start.y]);
  for (const w of m.warps || []) starts.push([w.x, w.y]);
  const seen = new Set(); const q = [];
  for (const [x, y] of starts) { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } }
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue;
      if (!WALKABLE.has([...m.rows[ny]][nx])) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
function openPct(m) {
  const H = m.rows.length, W = [...m.rows[0]].length;
  let open = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (WALKABLE.has([...m.rows[y]][x])) open++;
  return Math.round((open / ((W - 2) * (H - 2))) * 1000) / 10;
}

const PINS = {"house-celestic":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"dc563007e857630321a099e8eab28872d9a6cc79c7ab69037a18b93c689ca619","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-cianwood":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"aac259c2368f92d154217638f8bf3f8e9cded99a4db1497ce00cca31e91e05cb","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-littleroot-rival":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"df3b6a0b6cc70199422f910ac5e7f7ec6615f3419cee7b971581593f01680de0","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-twinleaf-rival":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"016ec9540bf44a11efdf8c6dbf39561033aac57669f99413f2d258eeea2f70a8","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-violet":{"group":"G1","keeper":true,"template":"e9c665d9d0e5","dataSha":"ea841bd0f2cb899be998e88fabfc30fa1cc6d0b6c70d44d83a687f7707d7fa16","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-littleroot":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"73fa073d19043c2d823490fbae55d02cce778de824332ba0a46cd0ffb31d1368","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-mahogany":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"31f247699e0f8744d449100288b567ff9f3cee97428a87cb19a9ba25cae3b00f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-newbark":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"64a3e797666d870f690f29a5fa9999c9f2cf11b5b920f61b43815bfd349fbaba","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-twinleaf":{"group":"G2","keeper":true,"template":"f7f7dd9851dc","dataSha":"75f94a16174d4b2b4f33eedb3bc9508c3d81f630d91473140bb40081b24c504f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-cherrygrove":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"3ad1b60baa04aa93366e5cd6501af8ab70164a1692abda76d673ea5eb676f6c0","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-oldale":{"group":"G3","keeper":true,"template":"0a1e6d87f134","dataSha":"0214485b86d76d5aa499073d7a4b7e776e31ac3d7fd2331218b83385af2c9bc0","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-olivine":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"726558df4c376554c712cc68ca6f002c11377c36ded476823bc5e3401f263ad7","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-pastoria":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"bff9f8dd886e1ce0d04500ca05fa148cf449157b08b6d0ea072dab47f19fa439","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-goldenrod":{"group":"G4","keeper":true,"template":"f9b74239e61d","dataSha":"705700d97c0cc31714f15a2a3fa7b029d68f2e1630508a13165d7900756c9531","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-silvertown":{"group":"G4","keeper":false,"template":"f9b74239e61d","dataSha":"a73135576fb409bd028a9f59afc6e8c0960f6369db440860fe5c40179307bd74","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-sunnyshore":{"group":"G4","keeper":false,"template":"f9b74239e61d","dataSha":"f3e92c7444070416078049b06c2950a9519d01e1771539a0bf36d6ce5bc00f0c","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-valencia":{"group":"G5","keeper":true,"template":"8ac338233599","dataSha":"469766c0445980d8a7c1d9528996b087eff9dcde9937fe0082e335ece4d744ee","reach":27,"openPct":67.5,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-viridian":{"group":"G5","keeper":false,"template":"8ac338233599","dataSha":"3c1598ddaf732ce0b5b195abcd2468c6f16a00145d3880dd709ee365cfce5c22","reach":27,"openPct":67.5,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-celadon-w":{"group":"G6","keeper":true,"template":"43e76035e337","dataSha":"248aee91ae5e4952e2e1d593802ce6b06cd801f722a38bbd0b3abb672e33f1dc","reach":30,"openPct":75,"inv":[[0,0,7774],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-mikan":{"group":"G6","keeper":false,"template":"43e76035e337","dataSha":"20d7ecb42f0067d58f72c67f633b4788173c183e590331b976f1e3578da6c518","reach":30,"openPct":75,"inv":[[0,0,7774],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-kumquat":{"group":"G7","keeper":true,"template":"180a902e1361","dataSha":"cf3d73b239862e0761fde70a7aeb0e28904f54c4a59d5c6873cce313f2ff1f5c","reach":26,"openPct":65,"inv":[[0,0,7769],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-lavender":{"group":"G7","keeper":false,"template":"180a902e1361","dataSha":"84c06d3f76f31bae8fbfaa288e1268a3a3fad30c9f90b025d796d18dcdebdd8a","reach":26,"openPct":65,"inv":[[0,0,7769],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-fuchsia":{"group":"G8","keeper":true,"template":"f26bfc6ded28","dataSha":"7112d6b1382c4a7180fa8dc1e65214320ff3956a499f2e737e4ec025287a2087","reach":28,"openPct":70,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-shamouti":{"group":"G8","keeper":false,"template":"f26bfc6ded28","dataSha":"8c30d354959d0c981d8a171b8f18f3630ff5db8995dc537b18a40cf25ae2e7d6","reach":28,"openPct":70,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-azalea":{"group":"G9","keeper":true,"template":"2ea085879aba","dataSha":"f1291a59c99a97cd519e77381dbad343bc8d0cbcb6f3a6f973af3e74036fcb7d","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-petalburg":{"group":"G9","keeper":false,"template":"2ea085879aba","dataSha":"e5910b1b3d97d837effadcd437559737b0e9de45e05c4db3f81c8591fe32458a","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-ecruteak":{"group":"G10","keeper":true,"template":"be235489d2cd","dataSha":"c40b10c33a767053b2442e39cd581ddb315f62772f1233f7afb5d09765a359ee","reach":90,"openPct":91.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-lavaridge":{"group":"G10","keeper":false,"template":"be235489d2cd","dataSha":"6fea9b83b9991fd385ec79ecfc5659559fbe2893c846db8510e97b0413bca2ec","reach":90,"openPct":91.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]}};

const GROUPS = {
  G1: ['house-celestic', 'house-cianwood', 'house-littleroot-rival', 'house-twinleaf-rival', 'house-violet'],
  G2: ['house-littleroot', 'house-mahogany', 'house-newbark', 'house-twinleaf'],
  G3: ['house-cherrygrove', 'house-oldale', 'house-olivine', 'house-pastoria'],
  G4: ['house-goldenrod', 'house-silvertown', 'house-sunnyshore'],
  G5: ['house-valencia', 'house-viridian'],
  G6: ['house-celadon-w', 'house-mikan'],
  G7: ['house-kumquat', 'house-lavender'],
  G8: ['house-fuchsia', 'house-shamouti'],
  G9: ['house-azalea', 'house-petalburg'],
  G10: ['house-ecruteak', 'house-lavaridge'],
};

// ---- Section A: per-house invariants (all 28) ----
for (const [id, pin] of Object.entries(PINS)) {
  const m = ALL[id];
  ok('A1 ' + id + ' data pin', !!m && dataSha(m) === pin.dataSha);
  let invOk = !!m;
  if (m) for (const [x, y, cp] of pin.inv) if ([...m.rows[y]][x].codePointAt(0) !== cp) { invOk = false; break; }
  ok('A2 ' + id + ' invariant cells byte-identical', invOk);
  const seen = m ? bfs(m) : new Set();
  ok('A3 ' + id + ' reach == baseline ' + pin.reach, seen.size === pin.reach, 'got ' + seen.size);
  let postsOk = true;
  for (const n of (m && m.npcs) || []) if (!seen.has(n.x + ',' + n.y)) postsOk = false;
  ok('A4 ' + id + ' posts reachable', postsOk);
  const op = m ? openPct(m) : 0;
  ok('A5 ' + id + ' open floor == ' + pin.openPct + '% and >= 60%', op === pin.openPct && op >= 60, 'got ' + op);
}

// ---- Section B: group retirement (all 10 groups) ----
for (const [g, members] of Object.entries(GROUPS)) {
  const hs = members.map((id) => gridHash(ALL[id]));
  ok('B1 ' + g + ' member grids pairwise distinct', new Set(hs).size === hs.length, hs.join(' '));
  const keeper = members.find((id) => PINS[id].keeper);
  ok('B2 ' + g + ' keeper ' + keeper + ' on frozen template', gridHash(ALL[keeper]) === PINS[keeper].template);
  ok('B3 ' + g + ' non-keepers off template', members.filter((id) => !PINS[id].keeper).every((id) => gridHash(ALL[id]) !== PINS[id].template));
}

// ---- Section C: T2 layout quality (L11-L18) ----
const T2 = ['house-silvertown', 'house-sunnyshore', 'house-petalburg', 'house-lavaridge', 'house-viridian', 'house-mikan', 'house-lavender', 'house-shamouti'];
const RUGS = new Set(['rug', 'rug2', 'rug3']);
for (const id of T2) {
  const m = ALL[id];
  const H = m.rows.length, W = [...m.rows[0]].length;
  const rugCells = [];
  const solids = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const k = kindAt(m, x, y);
    if (RUGS.has(k)) rugCells.push([x, y, k]);
    if (!WALKABLE.has([...m.rows[y]][x])) solids.push([x, y]);
  }
  const rugKinds = new Set(rugCells.map((c) => c[2]));
  let comps = 0;
  const rset = new Set(rugCells.map((c) => c[0] + ',' + c[1]));
  const rseen = new Set();
  for (const key of rset) {
    if (rseen.has(key)) continue;
    comps++;
    const q = [key]; rseen.add(key);
    while (q.length) { const [cx, cy] = q.pop().split(',').map(Number);
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const k2 = (cx+dx) + ',' + (cy+dy); if (rset.has(k2) && !rseen.has(k2)) { rseen.add(k2); q.push(k2); } } }
  }
  ok('C1 ' + id + ' single rug accent', rugKinds.size === 1 && comps === 1 && rugCells.length <= 2, rugCells.length + ' cells, ' + rugKinds.size + ' kinds, ' + comps + ' runs');
  const sset = new Set(solids.map((c) => c[0] + ',' + c[1]));
  const wallAdj = ([x, y]) => x === 1 || y === 1 || x === W - 2 || y === H - 2;
  const unanchored = solids.filter((c) => !wallAdj(c) && ![[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => { const n = [c[0]+dx, c[1]+dy]; return sset.has(n[0] + ',' + n[1]) && wallAdj(n); }));
  ok('C2 ' + id + ' furniture wall-anchored', unanchored.length === 0, unanchored.map((c) => c.join(',')).join(' '));
  let pathSolid = 0;
  if (W === 14) { // 14x10: the 2-wide door->post corridor (cols 6-7) stays solid-free
    for (const x of [6, 7]) for (let y = 1; y < H - 1; y++) if (!WALKABLE.has([...m.rows[y]][x])) pathSolid++;
  } else { // 10x7: no corridor exists in the shipped design (the dining pair
    // stands before the doors in every template) — pin the landing pair itself
    for (const x of [4, 5]) if (!WALKABLE.has([...m.rows[4]][x])) pathSolid++;
  }
  ok('C3 ' + id + ' door path solid-free', pathSolid === 0, pathSolid + ' solids');
  let standOk = true;
  for (const n of m.npcs || []) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (!WALKABLE.has([...m.rows[n.y + dy]][n.x + dx])) standOk = false;
  ok('C4 ' + id + ' post standing cells walkable', standOk);
}
  PASS += pass; FAIL += fail;
  console.log('interior-variety [Part II — W16-T2 A/B/C sections]: ' + pass + ' pass / ' + fail + ' fail');
})();


// =====================================================================
// Part III — W16-B sections W16B1..W16B6 (verbatim; original header kept,
// labels relabeled B* -> W16B* at the W16-T3 merge: Part II owns 'B').
// =====================================================================
// tests/interior-variety-checks.mjs — Wave W16 (War Room E2E Phase 2):
// the INTERIOR VARIETY guard, W16-B tranche (labs, contests, chambers,
// gym pairs). WHY: the NO-SAME-KIT audit (sec.4) measured the labs trio /
// contest quartet / league chambers each on ONE grid, and 4 gym pairs
// wearing one grid (and one type kit) per pair. W16-B retires every one.
//
//   W16B1 SET RETIREMENT — within each B set every member grid is
//      pairwise distinct; the named keeper alone still sits on the
//      frozen template hash; chambers (dressing-level) sit on NO
//      template. Includes the Fortree freeze: gym-fortree wears NO
//      grass kit (leafplanter/vinepost/seedvault gone) and wears the
//      roost register (birdcage/telescope/mapdesk); gym-eterna keeps
//      the grass kit as the pair keeper.
//   W16B2 INVARIANT DATA — per scoped map, sha256 of the serialized
//      {warps, start, npcs, signs, items, hidden, events, encounters}
//      equals the plan-time pin.
//   W16B3 INVARIANT CELLS — the coordinate sets carrying door / sign /
//      podium / counter / battlemat kinds equal the pins, and every
//      post — map npc or story-appended (professors, MAIA x4, gym
//      leaders + trainers, stewards, aides) — still stands on its
//      recorded floor kind at its recorded cell.
//   W16B4 REACHABILITY — BFS reach from the landing equals the baseline
//      for every scoped map (global dead pockets == 1069 held by
//      scripts/audit-reachability.mjs in the audits group).
//   W16B5 STANDARD METRICS — open floor >= 60% in every scoped room;
//      at most one rug accent run (<=2 adjacent cells, one row).
//   W16B6 LAYOUT FREEZE — every scoped map's grid hash equals its
//      post-wave pin (burn-down rule: a future layout change updates
//      the pin in the SAME commit).

await (async () => {
let pass = 0; const failures = [];
function ok(name, cond, detail = '') { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name + (detail ? ' — ' + detail : '')); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));
const packs = [];
{
  const base = await D('maps.mjs');
  packs.push(base.MAPS);
  for (let i = 2; i <= 9; i++) { const mod = await D('maps' + i + '.mjs'); packs.push(mod['MAPS' + i]); }
}
const MAPS = {};
for (const obj of packs) Object.assign(MAPS, obj);
const { TILE_CHARS } = await import(path.join(ROOT, 'src/engine/tiles.mjs'));
const { buildGameJs } = await import(path.join(ROOT, 'scripts/build.mjs'));
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map });
vm.runInContext(buildGameJs({ auth: true }) + '\n;this.__W = [...WALKABLE];', ctx);
const WALK = new Set(ctx.__W);
const kindOf = (ch) => TILE_CHARS[ch];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const gridSha = (m) => sha(m.rows.join('\n'));
const dataSha = (m) => sha(JSON.stringify({ warps: m.warps, start: m.start, npcs: m.npcs, signs: m.signs, items: m.items, hidden: m.hidden, events: m.events, encounters: m.encounters }));

const PINS = {
 "birch-lab": {
  "grid": "914e613ee828ca3384634352688465e767af5f770271d07a624e70647241ef1d",
  "data": "053853c1ce81b2bc215d9d038316bb3a73ffd8bad730ae70ea0b978c0316f0ab",
  "reach": 153,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,2"
   ],
   "podium": [],
   "counter": [],
   "battlemat": []
  }
 },
 "elm-lab": {
  "grid": "b139fdde0a9ffcdd666ae962fd686139e1d6b973a92bd73a02359abb2dac4c78",
  "data": "033a7dc881d2037a181b74989b02310131e8f410503bcaf4385009225a383a96",
  "reach": 153,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,2"
   ],
   "podium": [],
   "counter": [],
   "battlemat": []
  }
 },
 "rowan-lab": {
  "grid": "fa74c6db08bd695fa29a0e2c2891219c5e63c61886fe6eaecdb4b6cc2377fa53",
  "data": "7951d61db557d4db20ac8cd7d4adff65e3cba692db202a849b4fdde382cf5734",
  "reach": 153,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,2"
   ],
   "podium": [],
   "counter": [],
   "battlemat": []
  }
 },
 "contest-fallarbor": {
  "grid": "df63fbf0b220fd301b1423ad74384da004c00fbc6a2d1c7eaf404703894513ae",
  "data": "bcaa029547ce104e1d308414d80bb3936fbda8b1de85cb5ccf1c2cdd31b315d5",
  "reach": 151,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,3"
   ],
   "podium": [],
   "counter": [
    "8,2",
    "9,2"
   ],
   "battlemat": [
    "7,5",
    "8,5",
    "9,5",
    "10,5",
    "7,6",
    "8,6",
    "9,6",
    "10,6"
   ]
  }
 },
 "contest-lilycove": {
  "grid": "6457f7aef6a8803911a4beab2ee17a9bed7a9a00b4e7abfceac87703f1bd7a64",
  "data": "01f96c433c3ab4142cbf417a16963c42a10cc53bd9ba18128b0a3c2d8c3d0c60",
  "reach": 151,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,3"
   ],
   "podium": [],
   "counter": [
    "8,2",
    "9,2"
   ],
   "battlemat": [
    "7,5",
    "8,5",
    "9,5",
    "10,5",
    "7,6",
    "8,6",
    "9,6",
    "10,6"
   ]
  }
 },
 "contest-slateport": {
  "grid": "d3d5a5b03543d6cc69bd06da4d76e15fc69e8e0b4c97afbe424133e721a9088b",
  "data": "603eab38bcd7dd777c90086b3c22387b4e8114a40c2cb5e9fe58cadf443fd32f",
  "reach": 151,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,3"
   ],
   "podium": [],
   "counter": [
    "8,2",
    "9,2"
   ],
   "battlemat": [
    "7,5",
    "8,5",
    "9,5",
    "10,5",
    "7,6",
    "8,6",
    "9,6",
    "10,6"
   ]
  }
 },
 "contest-verdanturf": {
  "grid": "7cc98e8958fb066abdedbdd6ec75c722c5892db01776ec69b34bff961519643d",
  "data": "af3c8b039f9a8d9f86341e3329228ed54b8742fc7f4c64d9d9f2fcb57f828eac",
  "reach": 151,
  "pos": {
   "door": [
    "8,11",
    "9,11"
   ],
   "sign": [
    "8,3"
   ],
   "podium": [],
   "counter": [
    "8,2",
    "9,2"
   ],
   "battlemat": [
    "7,5",
    "8,5",
    "9,5",
    "10,5",
    "7,6",
    "8,6",
    "9,6",
    "10,6"
   ]
  }
 },
 "league-chamber-1": {
  "grid": "415c42f629636e827426df9ea1e0071e096f2ace5d85ca5799a2f117be41bb7a",
  "data": "96d350992d212b80732044190d0c6da4753ef0be1b55c93901e3fc3223693a89",
  "reach": 141,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [
    "7,3"
   ],
   "podium": [
    "7,2",
    "8,2"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "league-chamber-2": {
  "grid": "800fb3519b47870d9dddcf03f3bce05c92b6e63d9713fb9ccdaef30f2595422e",
  "data": "5bf7a5494cca2228a8ae26392532ba7695e9e3d514b254373ca4d304ae6b67e7",
  "reach": 141,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [
    "7,3"
   ],
   "podium": [
    "7,2",
    "8,2"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "league-chamber-3": {
  "grid": "7a9493d252b2525e9ee390c681f92d524aa1bddbf57cf6c83f9333a1234092ed",
  "data": "bd817617c8ac7fb14977d97b8b109812fe7287c812970890490b935e6b972e55",
  "reach": 141,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [
    "7,3"
   ],
   "podium": [
    "7,2",
    "8,2"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "league-chamber-4": {
  "grid": "f149b5515265e6b0a40ac2193ca2dd0ca0ec2408c302d0d0f8feeb667282b2dc",
  "data": "e122fa2162af93f62416b5cb203b311181d6cb26b44744eb6018499cf1fcd809",
  "reach": 141,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [
    "7,3"
   ],
   "podium": [
    "7,2",
    "8,2"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-olivine": {
  "grid": "eb00c7f13a990f57af39d8defac167bd2b310f6103e38118e5f767a6ee65a3d0",
  "data": "a529b7876674ff9ec0ef6d757f434b1497ba6dd68f57e6527a56013d07f6f487",
  "reach": 108,
  "pos": {
   "door": [
    "7,9",
    "8,9"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,4",
    "8,4",
    "7,5",
    "8,5"
   ]
  }
 },
 "gym-violet": {
  "grid": "ac1e72b52b48013b619a0bb18a7671f31d98860d9a135e71740bf93d880f30ce",
  "data": "2d63908d7112d46c6570a8e1274eacc615a39e5bf9065eaba43d8b0d5096136d",
  "reach": 108,
  "pos": {
   "door": [
    "7,9",
    "8,9"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,4",
    "8,4",
    "7,5",
    "8,5"
   ]
  }
 },
 "gym-oreburgh": {
  "grid": "768c39b7655e890826db899e5af5d084eb42a98b517f7a30a33b705de3464106",
  "data": "3a61186eb1d5b10dcffe2cae0da88ef56fd66d119b5c12c60d894a6efc831cdc",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-rustboro": {
  "grid": "48cd5e613f3560949025a0823b6e07ef20d68942ef0b78ba9c0bd05a1e692b64",
  "data": "8944b388c3ce97916c6870bf81d44982b69609e3797ff144849c34ef29cdc839",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-veilstone": {
  "grid": "fa8cb1a65c40b6e51c9fc2e197570b02af1f3cbdfd6ef3969d68df3286a08c92",
  "data": "37a0aab89c769f6dd92a98f3382740e78b5af620a6824f3bc7b788ac336a2e43",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-dewford": {
  "grid": "dda2c53e9a565df760744175f16bf7c92b600a5c689172e5ae4fb767059eea3a",
  "data": "72143ef61b271bf035ee079f51b1f81619032cb0be80c19dcf4a719b8d49667a",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-fortree": {
  "grid": "c97e9eff0960ee5faff8ccf6f86c7bb0ea24e031cfc576f32305bed8abfdea41",
  "data": "15c26edec2f612de53994e2c6c1bd8fc3e68fd488c8dee5deea658cf043d479b",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 },
 "gym-eterna": {
  "grid": "f485674de851a43b264a553a42ad01ef2eae9688823cdeeae1074fda27674d92",
  "data": "6420b8c9819c06e033764927c2d40995923d3672650454dd31795b18d73142c1",
  "reach": 136,
  "pos": {
   "door": [
    "7,11",
    "8,11"
   ],
   "sign": [],
   "podium": [
    "7,1",
    "8,1"
   ],
   "counter": [],
   "battlemat": [
    "7,5",
    "8,5",
    "7,6",
    "8,6"
   ]
  }
 }
};
// Gym Identity T2 re-pin (Director ruling, disclosed): the gym-olivine
// pair-template value below is gym-violet's grid sha; violet took its
// own gustfloor at T2, so the pin moved to violet's NEW grid (the pair
// is deliberately split by the wave — violet keeps its own pin, and
// olivine's steelfloor grid stays off it). PINS grids for both gyms
// moved the same way, floor swap only, nothing else.
const TEMPLATES = {
 "lab": "b139fdde0a9ffcdd666ae962fd686139e1d6b973a92bd73a02359abb2dac4c78",
 "contest": "d3d5a5b03543d6cc69bd06da4d76e15fc69e8e0b4c97afbe424133e721a9088b",
 "chamber": "14470350f7bd8c30c3b88ce432d95d12e321ac8b8f491cff1878245f4ca0e54a",
 "gym-olivine": "ac1e72b52b48013b619a0bb18a7671f31d98860d9a135e71740bf93d880f30ce",
 "gym-oreburgh": "48cd5e613f3560949025a0823b6e07ef20d68942ef0b78ba9c0bd05a1e692b64",
 "gym-veilstone": "dda2c53e9a565df760744175f16bf7c92b600a5c689172e5ae4fb767059eea3a",
 "gym-fortree": "f485674de851a43b264a553a42ad01ef2eae9688823cdeeae1074fda27674d92"
};
const LABS = ['birch-lab', 'elm-lab', 'rowan-lab'];
const CONTESTS = ['contest-fallarbor', 'contest-lilycove', 'contest-slateport', 'contest-verdanturf'];
const CHAMBERS = ['league-chamber-1', 'league-chamber-2', 'league-chamber-3', 'league-chamber-4'];
const GYM_PAIRS = [ // [re-dressed, keeper]
  ['gym-olivine', 'gym-violet'], ['gym-oreburgh', 'gym-rustboro'],
  ['gym-veilstone', 'gym-dewford'], ['gym-fortree', 'gym-eterna'],
];
const SCOPED = [...LABS, ...CONTESTS, ...CHAMBERS, ...GYM_PAIRS.flat()];

// ---------------- W16B1: set retirement -----------------------------------
function distinct(name, ids) {
  const hs = ids.map((id) => gridSha(MAPS[id]));
  ok(name, new Set(hs).size === ids.length, hs.join(' '));
}
distinct('W16B1 labs trio pairwise distinct', LABS);
ok('W16B1 elm-lab keeps the lab template', gridSha(MAPS['elm-lab']) === TEMPLATES.lab);
ok('W16B1 birch-lab off the lab template', gridSha(MAPS['birch-lab']) !== TEMPLATES.lab);
ok('W16B1 rowan-lab off the lab template', gridSha(MAPS['rowan-lab']) !== TEMPLATES.lab);
distinct('W16B1 contest quartet pairwise distinct', CONTESTS);
ok('W16B1 contest-slateport keeps the contest template', gridSha(MAPS['contest-slateport']) === TEMPLATES.contest);
for (const id of CONTESTS.filter((c) => c !== 'contest-slateport'))
  ok('W16B1 ' + id + ' off the contest template', gridSha(MAPS[id]) !== TEMPLATES.contest);
distinct('W16B1 league chambers pairwise distinct (dressing)', CHAMBERS);
for (const id of CHAMBERS)
  ok('W16B1 ' + id + ' off the chamber template', gridSha(MAPS[id]) !== TEMPLATES.chamber);
for (const [changed, keeper] of GYM_PAIRS) {
  ok('W16B1 ' + keeper + ' keeps its pair template', gridSha(MAPS[keeper]) === TEMPLATES[changed]);
  ok('W16B1 ' + changed + ' off its pair template', gridSha(MAPS[changed]) !== TEMPLATES[changed]);
  ok('W16B1 pair ' + changed + '/' + keeper + ' distinct', gridSha(MAPS[changed]) !== gridSha(MAPS[keeper]));
}
// Fortree correctness: the flying gym wears no grass kit.
{
  const kinds = new Set();
  MAPS['gym-fortree'].rows.forEach((r) => [...r].forEach((ch) => kinds.add(kindOf(ch))));
  ok('W16B1 gym-fortree wears no grass kit (leafplanter/vinepost/seedvault gone)',
    !kinds.has('leafplanter') && !kinds.has('vinepost') && !kinds.has('seedvault'));
  ok('W16B1 gym-fortree wears the roost register (birdcage/telescope/mapdesk)',
    kinds.has('birdcage') && kinds.has('telescope') && kinds.has('mapdesk'));
  const ek = new Set();
  MAPS['gym-eterna'].rows.forEach((r) => [...r].forEach((ch) => ek.add(kindOf(ch))));
  ok('W16B1 gym-eterna keeps the grass kit (keeper)', ek.has('leafplanter') && ek.has('vinepost') && ek.has('seedvault'));
}

// ---------------- W16B2: invariant data pins -------------------------------
for (const id of SCOPED)
  ok('W16B2 ' + id + ' invariant data (warps/start/npcs/signs/items/hidden/events/encounters)', dataSha(MAPS[id]) === PINS[id].data);

// ---------------- W16B3: invariant cells + posts ---------------------------
const PIN_KINDS = ['door', 'sign', 'podium', 'counter', 'battlemat'];
for (const id of SCOPED) {
  const m = MAPS[id];
  for (const k of PIN_KINDS) {
    const got = [];
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (kindOf(ch) === k) got.push(x + ',' + y); }));
    ok('W16B3 ' + id + ' ' + k + ' cells pinned', JSON.stringify(got) === JSON.stringify(PINS[id].pos[k]),
      'got ' + got.join(' ') + ' want ' + PINS[id].pos[k].join(' '));
  }
}
// Gym Identity T2 re-pin (Director ruling, disclosed): gym-violet and
// gym-olivine took their own floor kinds (gustfloor / steelfloor), so
// the floor kind under their posts is their own — the posts themselves
// never moved. Later tranches add their W16-B gyms here the same way.
const FLOOR_OVERRIDES = { 'gym-violet': 'gustfloor', 'gym-olivine': 'steelfloor' };
const FLOOR_OF = (id) => FLOOR_OVERRIDES[id] || (id.includes('lab') ? 'labfloor' : id.includes('contest') ? 'silphfloor' : 'gymfloor');
// map-npc post cells keep their floor kind
for (const id of SCOPED) for (const n of MAPS[id].npcs || [])
  ok('W16B3 ' + id + ' post cell (' + n.x + ',' + n.y + ') floor intact', kindOf(MAPS[id].rows[n.y][n.x]) === FLOOR_OF(id));
// story-appended posts: coordinate pins + floor kind under the post
const APPENDED = [
  ['birch-lab', 'PROF. ASPEN', 7, 3, 'labfloor'], ['rowan-lab', 'PROF. SORREL', 8, 3, 'labfloor'],
  ['elm-lab', 'PROF. LINDEN', 8, 4, 'labfloor'],
  ['contest-fallarbor', 'MAIA', 8, 6, 'battlemat'], ['contest-lilycove', 'MAIA', 8, 6, 'battlemat'],
  ['contest-slateport', 'MAIA', 8, 6, 'battlemat'], ['contest-verdanturf', 'MAIA', 8, 6, 'battlemat'],
  ['gym-olivine', 'LIORA', 7, 2, 'steelfloor'], ['gym-violet', 'AVEN', 7, 2, 'gustfloor'],
  ['gym-oreburgh', 'RONAN', 7, 2, 'gymfloor'], ['gym-rustboro', 'SAXA', 7, 2, 'gymfloor'],
  ['gym-veilstone', 'MAREN', 7, 2, 'gymfloor'], ['gym-dewford', 'ENZO', 7, 2, 'gymfloor'],
  ['gym-fortree', 'ARIA', 7, 2, 'gymfloor'], ['gym-eterna', 'TANSY', 7, 2, 'gymfloor'],
  ['gym-rustboro', 'YOUNGSTER BRAM', 4, 5, 'gymfloor'], ['gym-rustboro', 'HIKER SELLA', 11, 5, 'gymfloor'],
  ['gym-dewford', 'BLACKBELT ROOK', 4, 5, 'gymfloor'], ['gym-dewford', 'BATTLE GIRL SANA', 11, 5, 'gymfloor'],
  ['gym-fortree', 'BIRD KEEPER ANSEL', 4, 5, 'gymfloor'], ['gym-fortree', 'PICNICKER WREN', 11, 5, 'gymfloor'],
  ['gym-oreburgh', 'MINER COLE', 4, 5, 'gymfloor'], ['gym-oreburgh', 'MINER FENN', 11, 5, 'gymfloor'],
  ['gym-eterna', 'AROMA ADEPT LIA', 4, 5, 'gymfloor'], ['gym-eterna', 'AROMA ADEPT ROSALIE', 11, 5, 'gymfloor'],
  ['gym-veilstone', 'BLACK BELT JON', 4, 5, 'gymfloor'], ['gym-veilstone', 'BLACK BELT RUE', 11, 5, 'gymfloor'],
];
{
  const { HOENN_NPCS } = await D('story-hoenn.mjs');
  const { JOHTO_NPCS } = await D('story-johto.mjs');
  const { SINNOH_NPCS } = await D('story-sinnoh.mjs');
  const cast = [...HOENN_NPCS, ...JOHTO_NPCS, ...SINNOH_NPCS];
  for (const [map, name, x, y, floor] of APPENDED) {
    const hit = cast.find((n) => n.map === map && n.name === name);
    ok('W16B3 appended post ' + name + ' @ ' + map + ' (' + x + ',' + y + ')', !!hit && hit.x === x && hit.y === y,
      hit ? 'at ' + hit.x + ',' + hit.y : 'not found');
    ok('W16B3 floor under ' + name + ' @ ' + map, kindOf(MAPS[map].rows[y][x]) === floor);
  }
}

// ---------------- W16B4: reachability --------------------------------------
function reach(m) {
  const H = m.rows.length, W = m.rows[0].length;
  const seen = new Set(); const q = [[m.start.x, m.start.y]];
  while (q.length) { const [x, y] = q.pop(); const k = x + ',' + y;
    if (seen.has(k) || x < 0 || y < 0 || x >= W || y >= H || !WALK.has(m.rows[y][x])) continue;
    seen.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  return seen.size;
}
for (const id of SCOPED)
  ok('W16B4 ' + id + ' reach == baseline ' + PINS[id].reach, reach(MAPS[id]) === PINS[id].reach, 'got ' + reach(MAPS[id]));

// ---------------- W16B5: standard metrics ----------------------------------
const RUG_KINDS = new Set(['rug', 'rug2', 'rug3']);
for (const id of SCOPED) {
  const m = MAPS[id];
  let tot = 0, open = 0; const rugs = [];
  m.rows.forEach((row, y) => { if (y === 0 || y === m.rows.length - 1) return;
    [...row].forEach((ch, x) => { if (x === 0 || x === row.length - 1) return; tot++;
      if (WALK.has(ch)) open++;
      if (RUG_KINDS.has(kindOf(ch))) rugs.push([x, y]); }); });
  ok('W16B5 ' + id + ' open floor >= 60%', open / tot >= 0.6, (100 * open / tot).toFixed(1) + '%');
  const oneRun = rugs.length <= 2 && (rugs.length < 2 || Math.abs(rugs[0][0] - rugs[1][0]) + Math.abs(rugs[0][1] - rugs[1][1]) === 1);
  ok('W16B5 ' + id + ' at most one rug accent run', oneRun, rugs.length + ' rug cells');
}

// ---------------- W16B6: layout freeze -------------------------------------
for (const id of SCOPED)
  ok('W16B6 ' + id + ' layout pin', gridSha(MAPS[id]) === PINS[id].grid);

PASS += pass; FAIL += failures.length;
  console.log('interior-variety [Part III — W16-B W16B sections]: ' + pass + ' pass / ' + failures.length + ' fail');

})();

console.log(`\ninterior-variety: ${PASS} pass / ${FAIL} fail`);
process.exit(FAIL ? 1 : 0);
