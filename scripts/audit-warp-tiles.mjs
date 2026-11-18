// audit-warp-tiles.mjs — warp-tile & terrain-registry regression guard
// (2026-11-17, the Crown Road wall): every glyph used on any map must
// be registered with an explicit walkability, every warp's SOURCE tile
// must be enterable under the engine's own walkable() rules, and every
// warp's DESTINATION tile must be in-bounds and standable.
//
// The bug this guards: Crown Road's east exit (17,5) — the only road
// to Crownspire, the League, the Elite Four, the Champion and the
// credits — sits on a bannerwall tile. bannerwall is a registered
// WALL kind (W6 idx 120), so the engine treats the exit cell as solid:
// the player can stand at (16,5) forever and the warp never fires.
// Warps are placed without consulting walkable(), and the BFS
// reachability audit treats a warp as an edge whether or not its
// floor can be stepped on — so no existing check could see it. The
// warp fired only if the floor under it could be entered, and nothing
// verified the floor. This audit verifies the floor, for every warp,
// on every map.
//
// Enterability mirrors the engine exactly (src/game/overworld.mjs
// walkable() + src/game/overworld-systems.mjs sysWalkableExtra): a
// tile is enterable if it is in WALKABLE, or it is one of the system
// tiles sysWalkableExtra admits in a legitimate system state — '~'
// or 'W' while surfing, 'T' once cut. Standability for a destination
// mirrors src/game/start-pos.mjs isStartStandable (WALKABLE, or '~'
// for surf arrivals).
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
import * as TILES from '../src/engine/tiles.mjs';
import { startTileAt, isStartStandable } from '../src/game/start-pos.mjs';

const TILE_CHARS = TILES.TILE_CHARS;
const WALK = new Set([...WALKABLE, ...TILES.W6_WALKABLE_CHARS]);
// char -> { kind, cls } for every wave kind-def set in tiles.mjs.
const charClass = {};
for (const [name, val] of Object.entries(TILES)) {
  if (!name.endsWith('_KIND_DEFS')) continue;
  const chars = TILES[name.replace('_KIND_DEFS', '_KIND_CHARS')];
  if (!chars) continue;
  for (const [kind, cls] of val) if (chars[kind]) charClass[chars[kind]] = { kind, cls };
}
// The one documented exception to (a3): coraldoor (T38) is classed
// 'wall' in its def set as a facade-art family label, but its
// walkability is explicit and intended — src/data/maps.mjs (Wave T38
// note): swapped onto the boat-houses' facade-panel cells "which
// shipped walkable as facade-panel, so the doors stay walkable", and
// its char is in WALKABLE on that authority. Any OTHER wall/prop/dress
// kind found in WALKABLE fails here.
const WALKABLE_CLASS_EXCEPTIONS = new Set(['coraldoor']);

const failures = [];
const fail = (msg) => failures.push(msg);
const enterable = (t) => WALK.has(t) || t === '~' || t === 'W' || t === 'T';

// (a) Terrain registry: every glyph used in any map's rows is
// registered in TILE_CHARS, and every wave kind's def class agrees
// with the walkable set (floor/rug kinds are enterable; wall/prop/
// dress kinds are not, bar the documented exception above).
let mapsChecked = 0, glyphsChecked = 0;
const usedGlyphs = new Set();
for (const [id, m] of Object.entries(MAPS)) {
  if (!m.rows || !m.rows.length) continue;
  mapsChecked++;
  for (const row of m.rows) for (const ch of row) {
    usedGlyphs.add(ch);
    if (!(ch in TILE_CHARS)) fail(`${id}: glyph ${JSON.stringify(ch)} (U+${ch.codePointAt(0).toString(16).toUpperCase()}) is used in rows but NOT registered in TILE_CHARS`);
  }
}
for (const ch of usedGlyphs) {
  glyphsChecked++;
  const cc = charClass[ch];
  if (!cc) continue; // base TILE_CHARS char: WALKABLE membership is its explicit walkability
  if ((cc.cls === 'floor' || cc.cls === 'rug') && !enterable(ch)) {
    fail(`registry: kind ${cc.kind} (class ${cc.cls}, char U+${ch.codePointAt(0).toString(16).toUpperCase()}) is floor-class but NOT enterable`);
  }
  if ((cc.cls === 'wall' || cc.cls === 'prop' || cc.cls === 'dress') && WALK.has(ch) && !WALKABLE_CLASS_EXCEPTIONS.has(cc.kind)) {
    fail(`registry: kind ${cc.kind} (class ${cc.cls}, char U+${ch.codePointAt(0).toString(16).toUpperCase()}) is ${cc.cls}-class but its char is in WALKABLE`);
  }
}

// (b)+(c) Warps: the source tile must be enterable (the engine only
// fires a warp when a step completes ONTO its tile), and the
// destination must exist, in-bounds, and standable.
let warpsChecked = 0, surfSources = 0;
for (const [id, m] of Object.entries(MAPS)) {
  for (const w of m.warps || []) {
    warpsChecked++;
    const st = startTileAt(m, w.x, w.y);
    if (!enterable(st)) {
      fail(`${id}: warp source (${w.x},${w.y}) is NOT enterable — tile ${JSON.stringify(st)} is ${TILE_CHARS[st] || 'UNREGISTERED'}; the warp to ${w.to.map} can never fire`);
    } else if (st === '~' || st === 'W') surfSources++;
    const tm = MAPS[w.to.map];
    if (!tm) { fail(`${id}: warp (${w.x},${w.y}) targets missing map ${w.to.map}`); continue; }
    if (!isStartStandable(tm, w.to.x, w.to.y)) {
      fail(`${id}: warp (${w.x},${w.y}) destination ${w.to.map} (${w.to.x},${w.to.y}) is NOT standable — tile ${JSON.stringify(startTileAt(tm, w.to.x, w.to.y))} is ${TILE_CHARS[startTileAt(tm, w.to.x, w.to.y)] || 'UNREGISTERED'}`);
    }
  }
}

console.log('maps checked:', mapsChecked);
console.log('distinct glyphs checked:', glyphsChecked);
console.log('warps checked:', warpsChecked, `(of which surf-entered sources: ${surfSources})`);
console.log('warp-tile failures:', failures.length);
failures.forEach((s) => console.log('  FAIL', s));
if (failures.length) process.exit(1);
console.log('WARP-TILES AUDIT PASS');
