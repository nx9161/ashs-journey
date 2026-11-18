// audit-warp-landings — BUG-009 (2026-11-18): every warp landing in
// the game must be a tile a player can actually arrive on.
//
// Run 5's sea softlock: Marisol's open east edge warps onto open
// water in the Amber Sea; the landing had no foot-standable
// neighbour, the return warps sat on water too, and a player who
// walked in on foot could never move again — Continue restored the
// trap. The fix gates foot entry at step time and rescues trapped
// saves on load; this audit is the permanent census behind both:
//
//   1. Every warps[] landing (viaExit excluded — the dynamic
//      Center/Mart exits resolve at runtime to authored door-fronts)
//      is FOOT (WALKABLE) or WATER ('~'/'W'). A HARD or
//      out-of-bounds landing fails the gate outright.
//   2. Every WATER landing has at least one water neighbour, so a
//      surfing arrival is never stranded on an isolated tile.
//   3. Every map's resolveStartPos returns a standable tile.
//   4. Every map that can be entered on foot resolves a foot-safe
//      tile (resolveFootPos) — the load rescue's promise.
//
// Exit 0 = clean. Any violation prints and exits 1.
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
import { resolveStartPos, isStartStandable, isWaterTile, startTileAt, resolveFootPos } from '../src/game/start-pos.mjs';

// FOOT = standable on foot in the engine: the maps.mjs WALKABLE set
// plus the W6 rug/floor chars (audit-start-positions' precedent).
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const failures = [];
let warpsChecked = 0, waterLandings = 0, mapsChecked = 0;

for (const [id, m] of Object.entries(MAPS)) {
  if (!m || !Array.isArray(m.rows)) continue;
  mapsChecked++;
  const st = resolveStartPos(m, null);
  if (!isStartStandable(m, st.x, st.y)) {
    failures.push(`${id}: resolveStartPos -> (${st.x},${st.y}) is not standable`);
  }
  if (!resolveFootPos(id, MAPS, null)) {
    failures.push(`${id}: resolveFootPos resolves nothing — the load rescue could not place a foot player here`);
  }
  for (const w of m.warps || []) {
    if (!w.to || w.viaExit) continue;
    warpsChecked++;
    const dest = MAPS[w.to.map];
    if (!dest) { failures.push(`${id} (${w.x},${w.y}): warp to unknown map '${w.to.map}'`); continue; }
    const t = startTileAt(dest, w.to.x, w.to.y);
    if (WALK.has(t)) continue; // FOOT landing
    if (isWaterTile(t)) {
      waterLandings++;
      const waterNbr = DIRS4.some(([dx, dy]) => isWaterTile(startTileAt(dest, w.to.x + dx, w.to.y + dy)));
      if (!waterNbr) {
        failures.push(`${id} (${w.x},${w.y}) -> ${w.to.map} (${w.to.x},${w.to.y}): WATER landing '${t}' has no water neighbour — a surfing arrival would be stranded`);
      }
      continue;
    }
    failures.push(`${id} (${w.x},${w.y}) -> ${w.to.map} (${w.to.x},${w.to.y}): landing tile '${t}' is neither standable nor water`);
  }
}

console.log(`audit-warp-landings: ${mapsChecked} maps, ${warpsChecked} warp landings checked, ${waterLandings} water landings`);
if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log('audit-warp-landings: PASS — every warp landing is standable or surf-arrivable water');
