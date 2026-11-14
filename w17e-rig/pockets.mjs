// Dead-pocket diff: audit-reachability's exact BFS, per file
// definition, before (snapshot defs) vs after (current defs).
import fs from 'node:fs';
import { WALKABLE } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { W6_WALKABLE_CHARS } from '../src/engine/tiles.mjs';
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
const before = JSON.parse(fs.readFileSync('/tmp/w17e-before.json', 'utf8'));
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
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x+dx, ny = y+dy, k = nx+','+ny; if (!seen.has(k) && isWalk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
  const dead = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < m.rows[y].length; x++) if (isWalk(x, y) && !seen.has(x + ',' + y)) dead.push(x + ',' + y);
  return dead;
}
const AFTER = { maps2: MAPS2, maps3: MAPS3 };
let fail = 0;
for (const [file, pack] of Object.entries(AFTER)) {
  const b = before[file + ':victoryroad']; if (!b) continue;
  const dB = deadSet(b), dA = deadSet(pack['victoryroad']);
  const only = (a, c) => a.filter((k) => !c.includes(k));
  const nw = only(dA, dB), healed = only(dB, dA);
  console.log(file + ':victoryroad', 'dead before', dB.length, 'after', dA.length, '| new:', nw.join(' ') || '-', '| healed:', healed.join(' ') || '-');
  if (nw.length || healed.length) fail++;
}
console.log(fail ? 'POCKETS DELTA (see above)' : 'POCKETS IDENTICAL');
process.exit(fail ? 1 : 0);
