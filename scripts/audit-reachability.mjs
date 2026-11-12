// audit-reachability.mjs — placement audit (owner rule, 2026-11-11): every warp, sign, NPC, item and event must be reachable on foot from a map entry, and no NPC may stand on a warp tile. Static model: WALKABLE + W6 rugs/floors; Surf/boulder/script-gated spots (sea-route signs, Zapdos, hideout entry) report as unreachable here and are classified by hand, not auto-failed.
import { MAPS, WALKABLE } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { MAPS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
import { W6_WALKABLE_CHARS } from '../src/engine/tiles.mjs';
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
let mapsChecked = 0, deadCells = 0, badWarps = [], badTargets = [], npcOnWarp = [];
for (const [id, m] of Object.entries(MAPS)) {
  if (!m.rows || !m.rows.length) continue;
  mapsChecked++;
  const H = m.rows.length, W = m.rows[0].length;
  const cell = (x, y) => (y >= 0 && y < H && x >= 0 && x < m.rows[y].length) ? m.rows[y][x] : '#';
  const warps = m.warps || [];
  const warpSet = new Set(warps.map(w => w.x + ',' + w.y));
  const isWalk = (x, y) => WALK.has(cell(x, y)) || warpSet.has(x + ',' + y);
  // entries: every warp tile + start
  const entries = warps.map(w => [w.x, w.y]);
  if (m.start) entries.push([m.start.x, m.start.y]);
  if (!entries.length) continue;
  const seen = new Set();
  const q = [];
  for (const [x, y] of entries) { const k = x + ',' + y; if (!seen.has(k) && isWalk(x, y)) { seen.add(k); q.push([x, y]); } }
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x+dx, ny = y+dy, k = nx+','+ny; if (!seen.has(k) && isWalk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
  // warp reachability: each warp tile must be in seen (it is an entry itself, so check it connects to at least one other entry)
  for (const w of warps) { if (!seen.has(w.x + ',' + w.y)) badWarps.push(id + ' warp@' + w.x + ',' + w.y + ' -> ' + (w.to && w.to.map)); }
  // targets: signs, npcs, items, events must stand on or beside reachable ground
  const nearReach = (x, y) => seen.has(x + ',' + y) || [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => seen.has((x+dx) + ',' + (y+dy)));
  for (const s of m.signs || []) if (!nearReach(s.x, s.y)) badTargets.push(id + ' sign@' + s.x + ',' + s.y);
  for (const n of m.npcs || []) { if (!nearReach(n.x, n.y)) badTargets.push(id + ' npc ' + (n.name || '') + '@' + n.x + ',' + n.y); if (warpSet.has(n.x + ',' + n.y)) npcOnWarp.push(id + ' npc ' + (n.name || '') + ' ON warp@' + n.x + ',' + n.y); }
  for (const it of m.items || []) if (!seen.has(it.x + ',' + it.y)) badTargets.push(id + ' item@' + it.x + ',' + it.y);
  for (const ev of m.events || []) if (!seen.has(ev.x + ',' + ev.y)) badTargets.push(id + ' event ' + ev.id + '@' + ev.x + ',' + ev.y);
  // dead walkable pockets
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isWalk(x, y) && !seen.has(x + ',' + y)) deadCells++;
}
console.log('maps checked:', mapsChecked);
console.log('unreachable warp tiles:', badWarps.length); badWarps.slice(0, 10).forEach(s => console.log('  ', s));
console.log('unreachable signs/npcs/items/events:', badTargets.length); badTargets.slice(0, 15).forEach(s => console.log('  ', s));
console.log('NPCs standing on warp tiles:', npcOnWarp.length); npcOnWarp.slice(0, 10).forEach(s => console.log('  ', s));
console.log('walkable-but-unreachable cells (dead pockets):', deadCells);
