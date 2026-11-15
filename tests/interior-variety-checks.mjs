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

// W-CHAR2 T2 re-pin (disclosed): A1 data pins moved for the 15 houses
// hosting repointed Named-Crowd-I posts — house-littleroot + house-twinleaf
// (MS. HARLOW -> cast-harlow), house-newbark (AUNTIE ROSE -> cast-rose-auntie),
// house-cherrygrove (FLORIST HANA -> cast-hana-florist), house-oldale
// (FLORIST WREN -> cast-wren-florist, same-person spillover), house-olivine
// (NET MENDER SORREL -> cast-sorrel), house-silvertown (FLAG SEAMSTRESS OONA
// -> cast-oona), house-sunnyshore (PANEL HOST JUNIPER -> cast-juniper),
// house-valencia (RESIDENT MARA -> cast-mara-valencia), house-mikan (RESIDENT
// ULA-MAE -> cast-ula-mae), house-kumquat (RESIDENT SOLANGE -> cast-solange),
// house-fuchsia (AUNTIE MOSS -> cast-moss-auntie), house-shamouti (FEST KEEPER
// WREN -> cast-wren-fest), house-azalea (CHARCOAL BURNER ODO -> cast-odo),
// house-petalburg (PONDKEEPER SOL -> cast-sol-pond). Design fields only (art
// kind), proven per-post by char-design C5; grids, templates, post cells and
// reach values stand at their prior pins.
// W-CHAR2 T3 re-pin (disclosed): A1 data pins moved for 3 houses hosting
// repointed Named-Crowd-II posts — house-littleroot-rival + house-twinleaf-rival
// (MR. OKONKWO -> cast-okonkwo), house-violet (EARL THE TUTOR -> cast-earl);
// W16B2 data pins moved for the three labs — birch-lab + rowan-lab (AIDE COLM
// -> cast-colm), elm-lab (AIDE CORIN -> cast-corin). Design fields only (art
// kind), proven per-post by char-design C5; grids, templates, post cells,
// encounters and reach values stand at their prior pins.
const PINS = {"house-celestic":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"dc563007e857630321a099e8eab28872d9a6cc79c7ab69037a18b93c689ca619","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-cianwood":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"250c11dc15e4c8c860e149ad3cc2e9b88189a926ef76b6fc01ff73d61e97a169","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-littleroot-rival":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"0db1a440e6a2b4baddcb13f4548dac45a984aadc9021eef73970e3e41b0da39e","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-twinleaf-rival":{"group":"G1","keeper":false,"template":"e9c665d9d0e5","dataSha":"e2c101e92d0a9ee9636a1b26c81e3bee6cad646134e3318c9fce1f01cdb4980f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-violet":{"group":"G1","keeper":true,"template":"e9c665d9d0e5","dataSha":"d453b7b50201175e6ab039bb35983e6be79fff4e7ae400a60d5dc19f71fea69f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-littleroot":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"85c962efc0524de873ee1d8938781d825d6e4ebf76cfe9eb69f096655a8bc018","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-mahogany":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"31f247699e0f8744d449100288b567ff9f3cee97428a87cb19a9ba25cae3b00f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-newbark":{"group":"G2","keeper":false,"template":"f7f7dd9851dc","dataSha":"60ea283c91b7787e9142c222006ecb8aa6da26995c289ac483e7b5cbd37fa263","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-twinleaf":{"group":"G2","keeper":true,"template":"f7f7dd9851dc","dataSha":"f959d4cc4a05eb93fad6e9d2071aabd3e2abaa415c9c2e88219308a80ae1c11b","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-cherrygrove":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"6072e3520b952227b0559349ec0600db257d442e601df05eee27da905ee0b3a8","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-oldale":{"group":"G3","keeper":true,"template":"0a1e6d87f134","dataSha":"22c5f8c81f1234f6336cbdae072a28030283adbc7a3b39f4fe9abe1d07dcd8d1","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-olivine":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"1dc228d477d3ad1dc9b22d56c21ed9a4821985f12c6ce7f5026ca9f21c11a09e","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-pastoria":{"group":"G3","keeper":false,"template":"0a1e6d87f134","dataSha":"6d357ba4f51685cedf76682663dc6727f374a3d4069e3dc3b329b3e40bcbbef9","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-goldenrod":{"group":"G4","keeper":true,"template":"f9b74239e61d","dataSha":"705700d97c0cc31714f15a2a3fa7b029d68f2e1630508a13165d7900756c9531","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-silvertown":{"group":"G4","keeper":false,"template":"f9b74239e61d","dataSha":"1341f2b88f3f6c5eebecc729f5a75f2506ba0215923bfa0e56defda88a807552","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-sunnyshore":{"group":"G4","keeper":false,"template":"f9b74239e61d","dataSha":"e715c648a2d84d15d3526343556d2f1895037ae1367a66b27629aab54cff7bce","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-valencia":{"group":"G5","keeper":true,"template":"8ac338233599","dataSha":"542dab69397681bec2e40d3d5bfc1a4aa9612298f62d3a9e25fc0c857da9ed2f","reach":27,"openPct":67.5,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-viridian":{"group":"G5","keeper":false,"template":"8ac338233599","dataSha":"3c1598ddaf732ce0b5b195abcd2468c6f16a00145d3880dd709ee365cfce5c22","reach":27,"openPct":67.5,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-celadon-w":{"group":"G6","keeper":true,"template":"43e76035e337","dataSha":"248aee91ae5e4952e2e1d593802ce6b06cd801f722a38bbd0b3abb672e33f1dc","reach":30,"openPct":75,"inv":[[0,0,7774],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-mikan":{"group":"G6","keeper":false,"template":"43e76035e337","dataSha":"e33a3175d6039d4ffaddc72db99aa703c9f8f22ecff007730b0f42893525a4ca","reach":30,"openPct":75,"inv":[[0,0,7774],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-kumquat":{"group":"G7","keeper":true,"template":"180a902e1361","dataSha":"6eed3cd3961cd68e6bbf976c7ffddb311f4959a87d9f1d0e06867e1d52458911","reach":26,"openPct":65,"inv":[[0,0,7769],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-lavender":{"group":"G7","keeper":false,"template":"180a902e1361","dataSha":"84c06d3f76f31bae8fbfaa288e1268a3a3fad30c9f90b025d796d18dcdebdd8a","reach":26,"openPct":65,"inv":[[0,0,7769],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68]]},"house-fuchsia":{"group":"G8","keeper":true,"template":"f26bfc6ded28","dataSha":"69fd0398518fc5075eaaf85f87370f55795bb1fa22a34078040f5d997465017e","reach":28,"openPct":70,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-shamouti":{"group":"G8","keeper":false,"template":"f26bfc6ded28","dataSha":"b06090986f4fe3b44c1e35c3057717ae17d089e157949c89a8071913719b3a18","reach":28,"openPct":70,"inv":[[0,0,7777],[0,6,60],[1,0,60],[1,6,60],[2,0,60],[2,6,60],[3,0,60],[3,6,60],[4,0,60],[4,6,60],[5,0,60],[5,6,60],[6,0,60],[6,6,60],[7,0,60],[7,6,60],[8,0,60],[8,6,60],[9,0,60],[9,6,60],[0,1,60],[9,1,60],[0,2,60],[9,2,60],[0,3,60],[9,3,60],[0,4,60],[9,4,60],[0,5,60],[9,5,60],[4,5,68],[5,5,68],[6,2,42]]},"house-azalea":{"group":"G9","keeper":true,"template":"2ea085879aba","dataSha":"4c2cfbab8b47e499d14c3efc00b6e0a1dc54f6b3f3bcd81fc2499d95f1c831ed","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-petalburg":{"group":"G9","keeper":false,"template":"2ea085879aba","dataSha":"914889d91d090e8cdb862dce3cf0ab77e7d3d67b9c5ad32e4574c572fab8145f","reach":91,"openPct":92.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-ecruteak":{"group":"G10","keeper":true,"template":"be235489d2cd","dataSha":"6d60274cc191eadfe38b297d3aec95a2de63e2cb7211b38ea470164796e07a33","reach":90,"openPct":91.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]},"house-lavaridge":{"group":"G10","keeper":false,"template":"be235489d2cd","dataSha":"bfc9ce47c5e13f15ffbfd0fe09f869ba2b5094116ce65d381db080f883f73248","reach":90,"openPct":91.7,"inv":[[0,0,60],[0,9,60],[1,0,60],[1,9,60],[2,0,60],[2,9,60],[3,0,60],[3,9,60],[4,0,60],[4,9,60],[5,0,60],[5,9,60],[6,0,60],[6,9,68],[7,0,60],[7,9,68],[8,0,60],[8,9,60],[9,0,60],[9,9,60],[10,0,60],[10,9,60],[11,0,60],[11,9,60],[12,0,60],[12,9,60],[13,0,60],[13,9,60],[0,1,60],[13,1,60],[0,2,60],[13,2,60],[0,3,60],[13,3,60],[0,4,60],[13,4,60],[0,5,60],[13,5,60],[0,6,60],[13,6,60],[0,7,60],[13,7,60],[0,8,60],[13,8,60],[6,8,42],[7,3,42]]}};

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

// W-CHAR2 T4 re-pin (disclosed): W16B2 data pins moved for the two
// labs hosting repointed tail posts — birch-lab (AIDE FERN ->
// cast-fern-aide), rowan-lab (PROF. SORREL'S AIDE -> cast-sorrel-aide).
// Design fields only (art kind), proven per-post by char-design C5;
// grids, templates, post cells, encounters and reach values stand.
const PINS = {
 "birch-lab": {
  "grid": "914e613ee828ca3384634352688465e767af5f770271d07a624e70647241ef1d",
  "data": "05ae1f58ce405772055f278900fa4e6d6e6fcb7b721b28474857b85963e5e4ed",
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
  "data": "2308f685a22be83d38c3137c95b42729d56abce9adc4e87949d83ab863381b2b",
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
  "data": "60b2d004dfd02e7f6deaf739796e62eb61b967e64c9bb6db58a700ac7a11df86",
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
  "data": "23825948f36762339cc5f7804693ee9c8773ddbbfd222bddcd53a64080b81d83",
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
  "data": "7f7b825ceb715c1b97352785f436b0276dda3795a5ebcb6c489084811569263d",
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
  "grid": "6eff10ec8462b4d13d6a724e63b578b2473d9bd90a96f73f1fe8c8b5d99af1ab",
  "data": "536599513921cc58b92b0c726571bfbfb0c408529de89f8d0b0ed9e18a8cdc68",
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
  "grid": "6d69105717800124b254fd2ca1039da498b831a7900d41821fd709b614eacdab",
  "data": "46083fd2d2312a4c3299753bf52093a51921ef283d76cf14e86145963cd62233",
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
  "grid": "848c4eea45f3368f7b4a99957bdfb39ea246ad0ab84174bf35490b071784df71",
  "data": "bbdf136c5afcca7a01d43988b79c6604e81dc09b39fef2d82d09d8bb8d8d9c8e",
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
  "grid": "817fadec1587f37d0ad7325c65cc80f514cfa3a47aeb5edea129ee7571fc4077",
  "data": "1f9122ace00f05a37d3bc74e7ff6a788f1f8766d2629143c6a98975b412a4397",
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
  "grid": "5a29169e19ece65b205adda3cb43e7e9acaa2fec9a205c096bb84f118064ffc6",
  "data": "4455d89c6a5dd7c2f9bb5194ba4ebadf36a974334a1a8a825a92cef45e8b659f",
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
  "grid": "8c93837161cc1eb5799adc2541840bd2a278bf1051acc19ffbffcf19ba6b7141",
  "data": "f3e2332dc6f7742b719f53cff8c0cc370d46233fa1eb2eb8237d5dbc9ef31050",
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
// Gym Identity T3 re-pin (same ruling, disclosed): gym-rustboro and
// gym-dewford are the KEEPERS of their pairs and took their own floors
// (ochrefloor / swashfloor), so the gym-oreburgh and gym-veilstone
// template values moved to the keepers' NEW grids (48cd5e61… ->
// 6d691057…, dda2c53e… -> 817fadec…); oreburgh's and veilstone's own
// PINS grids stay at the old values (their floors land at T4).
// gym-fortree is the re-dressed side of its pair — its PINS grid moved
// to its roostfloor grid (c97e9eff… -> 5a29169e…); the gym-fortree
// template value is gym-eterna's grid and does NOT move. PINS grid for
// gym-dewford moved dda2c53e… -> 817fadec… the same way. Floor swaps
// only; posts, warps, data and reach pins untouched.
// W-CHAR2 T1 re-pin (disclosed): data pins (NOT grids/templates/
// posts/reach) moved for the maps hosting repointed service posts —
// A1 houses house-cianwood (PHARMACIST WREN -> clerk-yamato),
// house-pastoria (MARSH HOSTESS SOLENNE -> host-borea), house-ecruteak
// (TEA HOSTESS YUI -> host-yamato), house-lavaridge (SPRING HOSTESS
// YUI -> host-maris), and the W16B2 data pins of the 8 pair gyms
// (their GYM ATTENDANT posts -> attendant-<region>). Design fields
// only (art kind), proven per-post by char-design C5; every grid,
// template, post cell and reach value stands at its prior pin.
// Gym Identity T4 re-pin (same ruling, disclosed): the three Borea
// W16-B gyms took their own floors (gym-oreburgh shalefloor,
// gym-veilstone tatamifloor, gym-eterna hothousefloor), so their PINS
// grids moved to the post-swap shas (768c39b7… -> 6eff10ec…,
// fa8cb1a6… -> 848c4eea…, f485674d… -> 8c938371…). gym-eterna is the
// KEEPER of its pair, so the gym-fortree template value — eterna's
// grid — moved with it (f485674d… -> 8c938371…), the T3 keeper
// precedent run the other way. gym-oreburgh's and gym-veilstone's
// template values point at their keepers' T3 grids and do NOT move.
// gym-eterna keeps the grass kit (its identity); the floor swap does
// not touch a single dressing cell. Floor swaps only; posts, warps,
// data and reach pins untouched.
const TEMPLATES = {
 "lab": "b139fdde0a9ffcdd666ae962fd686139e1d6b973a92bd73a02359abb2dac4c78",
 "contest": "d3d5a5b03543d6cc69bd06da4d76e15fc69e8e0b4c97afbe424133e721a9088b",
 "chamber": "14470350f7bd8c30c3b88ce432d95d12e321ac8b8f491cff1878245f4ca0e54a",
 "gym-olivine": "ac1e72b52b48013b619a0bb18a7671f31d98860d9a135e71740bf93d880f30ce",
 "gym-oreburgh": "6d69105717800124b254fd2ca1039da498b831a7900d41821fd709b614eacdab",
 "gym-veilstone": "817fadec1587f37d0ad7325c65cc80f514cfa3a47aeb5edea129ee7571fc4077",
 "gym-fortree": "8c93837161cc1eb5799adc2541840bd2a278bf1051acc19ffbffcf19ba6b7141"
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
// Gym Identity T3 (same ruling): gym-rustboro / gym-dewford /
// gym-fortree took ochrefloor / swashfloor / roostfloor.
// Gym Identity T4 (same ruling): gym-oreburgh / gym-veilstone /
// gym-eterna took shalefloor / tatamifloor / hothousefloor.
const FLOOR_OVERRIDES = { 'gym-violet': 'gustfloor', 'gym-olivine': 'steelfloor', 'gym-rustboro': 'ochrefloor', 'gym-dewford': 'swashfloor', 'gym-fortree': 'roostfloor', 'gym-oreburgh': 'shalefloor', 'gym-veilstone': 'tatamifloor', 'gym-eterna': 'hothousefloor' };
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
  ['gym-oreburgh', 'RONAN', 7, 2, 'shalefloor'], ['gym-rustboro', 'SAXA', 7, 2, 'ochrefloor'],
  ['gym-veilstone', 'MAREN', 7, 2, 'tatamifloor'], ['gym-dewford', 'ENZO', 7, 2, 'swashfloor'],
  ['gym-fortree', 'ARIA', 7, 2, 'roostfloor'], ['gym-eterna', 'TANSY', 7, 2, 'hothousefloor'],
  ['gym-rustboro', 'YOUNGSTER BRAM', 4, 5, 'ochrefloor'], ['gym-rustboro', 'HIKER SELLA', 11, 5, 'ochrefloor'],
  ['gym-dewford', 'BLACKBELT ROOK', 4, 5, 'swashfloor'], ['gym-dewford', 'BATTLE GIRL SANA', 11, 5, 'swashfloor'],
  ['gym-fortree', 'BIRD KEEPER ANSEL', 4, 5, 'roostfloor'], ['gym-fortree', 'PICNICKER WREN', 11, 5, 'roostfloor'],
  ['gym-oreburgh', 'MINER COLE', 4, 5, 'shalefloor'], ['gym-oreburgh', 'MINER FENN', 11, 5, 'shalefloor'],
  ['gym-eterna', 'AROMA ADEPT LIA', 4, 5, 'hothousefloor'], ['gym-eterna', 'AROMA ADEPT ROSALIE', 11, 5, 'hothousefloor'],
  ['gym-veilstone', 'BLACK BELT JON', 4, 5, 'tatamifloor'], ['gym-veilstone', 'BLACK BELT RUE', 11, 5, 'tatamifloor'],
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
