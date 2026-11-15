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

import { buildGameJs } from '../scripts/build.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import vm from 'node:vm';
import crypto from 'node:crypto';

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

console.log(`\ninterior-variety: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
