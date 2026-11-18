// nearest-center.mjs — the ONE resolver for "which Center does a
// blackout take the player to" (owner rule, 2026-11-17): the NEAREST
// Center on the map from where the player fainted — not the last one
// visited, not home. Before this module, both blackout paths anchored
// through centerExit() (last-visited lineage), so a player who walked
// past a town without entering its Center was carried all the way
// back to the last Center he HAD entered — in the owner's own run,
// from Route 2 back to Dawnwick, past Fernmere entirely.
//
// Cost model: breadth-first over the DIRECTED warp graph (warps are
// followed exactly as authored, so a one-way drop can never nominate
// a Center the player could not actually reach by that link); the
// primary cost is MAP CROSSINGS. Ties break, in order:
//   1. the player's persisted last-Center town (story.lastCenter),
//      when it is among the nearest — with its exact persisted
//      door-front anchor (the door he actually used);
//   2. the walking distance from the faint tile to the first warp
//      tile the path leaves by (within-map tile BFS), so a faint in
//      Route 2's south half names Fernmere and one by its north
//      ledges names Flintridge;
//   3. authored warp order (deterministic).
// The winning town's door is the Center door closest (same within-map
// metric) to the tile the path arrives on — for a faint inside the
// town itself, closest to the faint tile. The anchor returned is that
// door's `via` (the door-front tile a voluntary entry would produce).
//
// A town qualifies iff it fields a warp into the shared 'center'
// interior carrying a `via` on itself — the same census the Fly fix
// uses: exactly 64 towns/hubs game-wide (Dawnwick included; its
// Center stands on the main street like every town's).
//
// Returns null when no Center town is reachable by warps at all
// (a small set of event/ferry-linked maps with no warp path — the
// caller then falls back to the last-visited lineage, then home).

import { MAPS, WALKABLE } from '../data/maps.mjs';
import { W6_WALKABLE_CHARS } from '../engine/tiles.mjs';

// The enterable set for the within-map distance walks: the shipped
// WALKABLE table + the W6 floor/rug chars + the system tiles
// sysWalkableExtra admits ('~'/'W' surf, 'T' cut) — the same union
// scripts/audit-warp-tiles.mjs uses. NPCs and boulders are ignored:
// they move; the geography does not.
const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS, '~', 'W', 'T']);

export function centerDoorsOf(mapDef) {
  const out = [];
  for (const w of (mapDef && mapDef.warps) || []) {
    if (w.to && w.to.map === 'center' && w.via && w.via.map === mapDef.id) {
      out.push({ door: { x: w.x, y: w.y }, via: { map: w.via.map, x: w.via.x, y: w.via.y } });
    }
  }
  return out;
}

export function isCenterTown(maps, id) {
  const def = maps[id];
  return !!def && centerDoorsOf(def).length > 0;
}

function tileAt(mapDef, x, y) {
  if (!mapDef || !Array.isArray(mapDef.rows)) return ' ';
  if (y < 0 || y >= mapDef.rows.length || x < 0 || x >= mapDef.rows[y].length) return ' ';
  return mapDef.rows[y][x];
}

// Within-map walking distances from (sx, sy) over enterable tiles.
// Warp tiles count as enterable ground (a door you can step on is a
// tile you can stand on for distance purposes, whatever its char).
// Returns a Map of 'x,y' -> steps. Unreached tiles are absent.
export function tileDistances(mapDef, sx, sy) {
  const dist = new Map();
  if (!mapDef || !Array.isArray(mapDef.rows) || !mapDef.rows.length) return dist;
  const warpTiles = new Set(((mapDef.warps) || []).map((w) => w.x + ',' + w.y));
  const enterable = (x, y) => {
    const t = tileAt(mapDef, x, y);
    return t !== ' ' && (WALK.has(t) || warpTiles.has(x + ',' + y));
  };
  if (!enterable(sx, sy)) return dist;
  dist.set(sx + ',' + sy, 0);
  const q = [[sx, sy]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const d = dist.get(x + ',' + y);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (dist.has(k) || !enterable(nx, ny)) continue;
      dist.set(k, d + 1);
      q.push([nx, ny]);
    }
  }
  return dist;
}

// Distance between two tiles of one map: the tile-BFS distance, with
// Manhattan distance as the fallback when the walking graph cannot
// connect them (a ledge-separated pocket — the estimate stays finite
// and deterministic rather than poisoning the comparison).
function tileDist(mapDef, ax, ay, bx, by) {
  if (ax === bx && ay === by) return 0;
  const d = tileDistances(mapDef, ax, ay).get(bx + ',' + by);
  return d === undefined ? Math.abs(ax - bx) + Math.abs(ay - by) : d;
}

// nearestCenterAnchor(fromId, fromX, fromY, lastCenter)
//   -> { map, x, y, town, crossings } | null
// (map, x, y) is the Center-exit anchor: the winning town's Center
// door-front, in the exact shape centerExit() returns.
export function nearestCenterAnchor(fromId, fromX, fromY, lastCenter, maps = MAPS) {
  const src = maps[fromId];
  if (!src || !Array.isArray(src.rows)) return null;
  const fx = Number.isFinite(fromX) ? fromX : (src.start ? src.start.x : 0);
  const fy = Number.isFinite(fromY) ? fromY : (src.start ? src.start.y : 0);

  // Dijkstra over the directed warp graph, keyed (crossings,
  // firstHopDist, seq): uniform crossing cost, the first-hop walking
  // distance as the secondary key. rec: per-map best record.
  const rec = new Map();
  let seq = 0;
  const start = { id: fromId, crossings: 0, firstHop: 0, entry: { x: fx, y: fy }, seq: seq++ };
  rec.set(fromId, start);
  const open = [start];
  const keyOf = (r) => (r.crossings * 100000) + Math.min(r.firstHop, 99999);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i], b = open[bi];
      if (keyOf(a) < keyOf(b) || (keyOf(a) === keyOf(b) && a.seq < b.seq)) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    if (rec.get(cur.id) !== cur) continue; // superseded record
    const def = maps[cur.id];
    if (!def) continue;
    for (const w of def.warps || []) {
      const to = w.to && w.to.map;
      if (!to || !maps[to]) continue;
      const firstHop = cur.id === fromId
        ? tileDist(src, fx, fy, w.x, w.y)
        : cur.firstHop;
      const cand = {
        id: to, crossings: cur.crossings + 1, firstHop,
        entry: { x: w.to.x, y: w.to.y }, seq: seq++,
      };
      const prev = rec.get(to);
      if (!prev || cand.crossings < prev.crossings
        || (cand.crossings === prev.crossings && cand.firstHop < prev.firstHop)) {
        rec.set(to, cand);
        open.push(cand);
      }
    }
  }

  // Candidates: Center towns with a finite record.
  let best = null;
  for (const [id, r] of rec) {
    if (!isCenterTown(maps, id)) continue;
    if (!best || r.crossings < best.r.crossings
      || (r.crossings === best.r.crossings && r.firstHop < best.r.firstHop)
      || (r.crossings === best.r.crossings && r.firstHop === best.r.firstHop && r.seq < best.r.seq)) {
      best = { id, r };
    }
  }
  if (!best) return null;

  // Tie-break 1: the persisted last-Center town, when it sits among
  // the nearest (same crossings, and no strictly shorter first hop) —
  // its exact persisted anchor wins, door and all.
  if (lastCenter && typeof lastCenter.map === 'string' && isCenterTown(maps, lastCenter.map)) {
    const lr = rec.get(lastCenter.map);
    if (lr && lr.crossings === best.r.crossings && lr.firstHop <= best.r.firstHop
      && Number.isFinite(lastCenter.x) && Number.isFinite(lastCenter.y)) {
      return { map: lastCenter.map, x: lastCenter.x, y: lastCenter.y, town: lastCenter.map, crossings: lr.crossings };
    }
  }

  // Door choice: the winning town's Center door closest to the tile
  // the winning path arrives on (the faint tile itself at 0 crossings).
  const townDef = maps[best.id];
  const doors = centerDoorsOf(townDef);
  let door = doors[0];
  let doorDist = Infinity;
  for (const d of doors) {
    const dd = tileDist(townDef, best.r.entry.x, best.r.entry.y, d.door.x, d.door.y);
    if (dd < doorDist) { doorDist = dd; door = d; }
  }
  return { map: door.via.map, x: door.via.x, y: door.via.y, town: best.id, crossings: best.r.crossings };
}
