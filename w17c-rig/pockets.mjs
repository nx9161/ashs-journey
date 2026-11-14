// Dead-pocket diff: audit-reachability's exact BFS, per route,
// before (snapshot defs) vs after (current defs).
import fs from 'node:fs';
import { MAPS, WALKABLE } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { MAPS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
import { W6_WALKABLE_CHARS } from '../src/engine/tiles.mjs';
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
const before = JSON.parse(fs.readFileSync('/tmp/w17c-before.json', 'utf8'));

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

const AFTER = {};
Object.assign(AFTER, MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
for (const id of ['route11','route12','route15','route16','route19']) {
  const b = before[(id === 'route11' ? 'maps2:' : 'maps3:') + id];
  const dB = deadSet(b), dA = deadSet(AFTER[id]);
  const only = (a, c) => a.filter((k) => !c.includes(k));
  console.log(id, 'dead before', dB.length, 'after', dA.length, '| new:', only(dA, dB).join(' '), '| healed:', only(dB, dA).join(' '));
}
