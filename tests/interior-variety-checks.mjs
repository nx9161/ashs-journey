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
// share only the exit code. Merged total: 325 checks.
// W16-B room pins (labs / contests / chambers / gym pairs) extend
// this file when W16-B merges.

import { buildGameJs } from '../scripts/build.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
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

console.log(`\ninterior-variety: ${PASS} pass / ${FAIL} fail`);
process.exit(FAIL ? 1 : 0);
