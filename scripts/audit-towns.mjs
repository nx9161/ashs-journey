// audit-towns.mjs — town fabric gate (owner standard: "every town
// perfect", 2026-11-11). A settlement is a map with a Center or Mart
// door. For every settlement, mechanically verified:
//   1. every door's step-off tile (the via landing) is paved — never
//      tall grass, never raw ground;
//   2. every warp landing inside the town is walkable (no entry or
//      exit drops the player inside a wall, tree, or building);
//   3. no NPC stands on a warp tile.
// The visual half of the standard (buildings separated and modelled,
// walkways continuous to the eye) is graded per town on screenshots
// in the style pass (B2-G6) — this gate guards the measurable half.
import { MAPS, WALKABLE } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { MAPS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
import { W6_WALKABLE_CHARS, TILE_CHARS } from '../src/engine/tiles.mjs';
Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
const towns = [];
for (const [id, m] of Object.entries(MAPS)) {
  const targets = new Set((m.warps || []).map((w) => w.to.map));
  if (targets.has('center') || targets.has('mart')) towns.push(id);
}
let fail = 0, doors = 0;
const bad = (msg) => { console.error('TOWN-FAIL', msg); fail = 1; };
for (const id of towns) {
  const m = MAPS[id];
  const warpSet = new Set((m.warps || []).map((w) => w.x + ',' + w.y));
  for (const n of m.npcs || []) if (warpSet.has(n.x + ',' + n.y)) bad(id + ': NPC ' + (n.name || '') + ' on warp@' + n.x + ',' + n.y);
  for (const w of m.warps || []) {
    if (w.via) {
      doors++;
      const ch = m.rows[w.via.y] && m.rows[w.via.y][w.via.x];
      if (ch === ',' || ch === '_') bad(id + ': door to ' + w.to.map + ' steps onto ' + (TILE_CHARS[ch] || ch) + '@' + w.via.x + ',' + w.via.y);
      if (!WALK.has(ch)) bad(id + ': door step-off not walkable@' + w.via.x + ',' + w.via.y);
    }
    const t = MAPS[w.to.map];
    if (t && t.rows) {
      const ch = t.rows[w.to.y] && t.rows[w.to.y][w.to.x];
      if (ch !== undefined && !WALK.has(ch) && ch !== '~') bad(id + ' -> ' + w.to.map + ' landing inside ' + (TILE_CHARS[ch] || ch) + '@' + w.to.x + ',' + w.to.y);
    }
  }
}
console.log(fail ? 'audit-towns FAILED' : 'audit-towns: ' + towns.length + ' settlements, ' + doors + ' door step-offs — all paved, all landings clear, no NPC on a warp');
process.exit(fail);
