// W17-AD dead-pocket proof (Ruling #1 form): audit-
// reachability's exact BFS, per lane, before (snapshot) vs
// after (converted). The islet variance MOVES the pocket
// cells with the islets, so set-identity is not the test —
// the chartered test is: (a) the per-lane pocket FIGURE is
// identical (25 = 25, so the global audit cannot move);
// (b) every cell in the symmetric difference is a sand cell
// of a moved/flipped cluster (source or destination) —
// i.e. the pockets are exactly the islets, wherever they
// stand, and nothing else changed connectivity.
import fs from 'node:fs';
import { WALKABLE } from '../src/data/maps.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { TILE_CHARS, W6_WALKABLE_CHARS } from '../src/engine/tiles.mjs';
import { CLUSTERS, LANES } from './transforms.mjs';
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
const before = JSON.parse(fs.readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
function deadSet(m) {
  const H = m.rows.length;
  const cell = (x, y) => (y >= 0 && y < H && x >= 0 && x < m.rows[y].length) ? m.rows[y][x] : '#';
  const warps = m.warps || [];
  const warpSet = new Set(warps.map(w => w.x + ',' + w.y));
  const isWalk = (x, y) => WALK.has(cell(x, y)) || warpSet.has(x + ',' + y);
  const entries = warps.map(w => [w.x, w.y]);
  if (m.start) entries.push([m.start.x, m.start.y]);
  const seen = new Set(); const q = [];
  for (const [x, y] of entries) { const k = x + ',' + y; if (!seen.has(k) && isWalk(x, y)) { seen.add(k); q.push([x, y]); } }
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && isWalk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
  const dead = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < m.rows[y].length; x++) if (isWalk(x, y) && !seen.has(x + ',' + y)) dead.push(x + ',' + y);
  return dead;
}
let fail = 0;
for (const [id, lane] of Object.entries(LANES)) {
  const b = before['maps5:' + id];
  const dB = deadSet(b), dA = deadSet(MAPS5[id]);
  const only = (a, c) => a.filter((k) => !c.includes(k));
  const nw = only(dA, dB), healed = only(dB, dA);
  // Allowed difference: cells in any cluster's source or destination box.
  const allowed = new Set();
  for (const [cid, mv] of Object.entries(lane.move)) {
    for (const [ox, oy] of [CLUSTERS[cid], mv.to]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) allowed.add((ox + dx) + ',' + (oy + dy));
  }
  const stray = [...nw, ...healed].filter((k) => !allowed.has(k));
  const countOK = dB.length === dA.length;
  console.log(id, 'dead before', dB.length, 'after', dA.length, '| moved-pocket cells:', nw.length + healed.length, '| stray:', stray.join(' ') || '-');
  if (!countOK || stray.length) fail++;
}
console.log(fail ? 'POCKETS FAIL' : 'POCKETS PROVEN (figure identical; difference confined to the moved islets)');
process.exit(fail ? 1 : 0);
