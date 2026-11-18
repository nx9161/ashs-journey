// start-pos.mjs — the ONE resolver for "where does the player land on
// this map" whenever a flow places the player by a map's start: the
// Preserve/Marsh gate entries, the zone-hub bounce, the safari exit,
// Fly, and the load-time rescue in OverworldScene.enter.
//
// Every candidate is validated against the target map's bounds and
// standable tiles. An invalid candidate degrades to a scanned safe
// tile — never to a hardcoded coordinate. (The 2026-11-17 Preserve
// softlock: the gate's stale `{ x: 10, y: 17 }` fallback placed the
// player 3 rows below the 20x14 safari map — invisible, immovable,
// session counter frozen, Continue restoring the trap. Campaign-
// ending. This module exists so that class can never recur.)

import { WALKABLE } from '../data/maps.mjs';

export function startTileAt(mapDef, x, y) {
  if (!mapDef || !Array.isArray(mapDef.rows)) return ' ';
  if (y < 0 || y >= mapDef.rows.length || x < 0 || x >= mapDef.rows[y].length) return ' ';
  return mapDef.rows[y][x];
}

// Standable for a start placement: a WALKABLE tile, or open water —
// the surf routes' authored starts are water tiles by design (the
// player arrives there already surfing).
export function isStartStandable(mapDef, x, y) {
  const t = startTileAt(mapDef, x, y);
  return t !== ' ' && (WALKABLE.has(t) || t === '~');
}

// Resolve a landing position for mapDef: the authored start first,
// then the caller's fallback (e.g. a session's planted exit), each
// only if it is in-bounds and standable. Otherwise scan for a safe
// tile: just inside one of the map's own warps first, then the first
// standable tile from the south edge up. Warp tiles and NPC posts are
// never landed on (a warp tile would bounce the player straight back
// out; an NPC post is occupied ground).
export function resolveStartPos(mapDef, fallback) {
  if (!mapDef || !Array.isArray(mapDef.rows) || !mapDef.rows.length) return { x: 0, y: 0 };
  const ok = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && isStartStandable(mapDef, p.x, p.y);
  if (ok(mapDef.start)) return { x: mapDef.start.x, y: mapDef.start.y };
  if (ok(fallback)) return { x: fallback.x, y: fallback.y };
  const warpSet = new Set((mapDef.warps || []).map((w) => w.x + ',' + w.y));
  const npcSet = new Set((mapDef.npcs || []).map((n) => n.x + ',' + n.y));
  const free = (x, y, water) => {
    const t = startTileAt(mapDef, x, y);
    if (t === ' ' || warpSet.has(x + ',' + y) || npcSet.has(x + ',' + y)) return false;
    return water ? (WALKABLE.has(t) || t === '~') : WALKABLE.has(t);
  };
  for (const water of [false, true]) {
    for (const w of mapDef.warps || []) {
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (free(w.x + dx, w.y + dy, water)) return { x: w.x + dx, y: w.y + dy };
      }
    }
    for (let y = mapDef.rows.length - 1; y >= 0; y--) {
      for (let x = 0; x < mapDef.rows[y].length; x++) {
        if (free(x, y, water)) return { x, y };
      }
    }
  }
  return { x: 0, y: 0 };
}

// ---- Foot safety (BUG-009) ----------------------------------------
// A tile is FOOT-standable when a player on foot can stand on it
// (WALKABLE; open water counts only while surfing). A player on foot
// on a tile with no foot-standable neighbour can never take a step
// again — that is the sea-lane trap shape: Marisol's open east edge
// warps onto open water in the Amber Sea, and every return warp sits
// on water too. These helpers are the shared vocabulary of the
// foot-entry gate (overworld onStep), the landing safety net
// (doWarp) and the load rescue (OverworldScene.enter).

export function tileAt(mapDef, x, y) {
  return startTileAt(mapDef, x, y);
}

export function isWaterTile(t) {
  return t === '~' || t === 'W';
}

export function isFootStandable(mapDef, x, y) {
  return WALKABLE.has(startTileAt(mapDef, x, y));
}

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function footNeighbours(mapDef, x, y) {
  const out = [];
  for (const [dx, dy] of DIRS4) {
    if (isFootStandable(mapDef, x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
  }
  return out;
}

// Foot-trapped: from (x, y) the player cannot step onto ANY
// foot-standable tile — true for mid-sea water, false for water
// beside a shore, false for any ordinary floor tile.
export function isFootTrapped(mapDef, x, y) {
  return footNeighbours(mapDef, x, y).length === 0;
}

// Can a player standing at (x, y) reach a warp on foot? Floods the
// foot-standable component; a land pocket with no warp in it (the
// Amber Sea's islet) is standable ground but still a trap.
export function footReachable(mapDef, x, y) {
  if (!isFootStandable(mapDef, x, y)) return false;
  const warpSet = new Set((mapDef.warps || []).filter((w) => w.to).map((w) => w.x + ',' + w.y));
  if (warpSet.has(x + ',' + y)) return true;
  const seen = new Set([x + ',' + y]);
  const queue = [{ x, y }];
  while (queue.length) {
    const c = queue.shift();
    for (const n of footNeighbours(mapDef, c.x, c.y)) {
      const k = n.x + ',' + n.y;
      if (seen.has(k)) continue;
      if (warpSet.has(k)) return true;
      seen.add(k);
      queue.push(n);
    }
  }
  return false;
}

export function isFootSafe(mapDef, x, y) {
  return isFootStandable(mapDef, x, y) && footReachable(mapDef, x, y);
}

function footSpotOn(mapDef, pos) {
  if (pos && isFootSafe(mapDef, pos.x, pos.y)) return { x: pos.x, y: pos.y };
  const warpSet = new Set((mapDef.warps || []).map((w) => w.x + ',' + w.y));
  const npcSet = new Set((mapDef.npcs || []).map((n) => n.x + ',' + n.y));
  // A map with no warps at all (the dive trenches, the event
  // islands) is entered and left by non-warp flows; there the best
  // rescue is simply standable ground the player can step off —
  // walkability restored, the map's own exits do the rest.
  const warpless = !(mapDef.warps || []).some((w) => w.to);
  const free = warpless
    ? (x, y) => isFootStandable(mapDef, x, y) && !isFootTrapped(mapDef, x, y) && !npcSet.has(x + ',' + y)
    : (x, y) => isFootSafe(mapDef, x, y) && !warpSet.has(x + ',' + y) && !npcSet.has(x + ',' + y);
  if (mapDef.start && free(mapDef.start.x, mapDef.start.y)) return { x: mapDef.start.x, y: mapDef.start.y };
  for (const w of mapDef.warps || []) {
    for (const [dx, dy] of DIRS4) {
      if (free(w.x + dx, w.y + dy)) return { x: w.x + dx, y: w.y + dy };
    }
  }
  for (let y = mapDef.rows.length - 1; y >= 0; y--) {
    for (let x = 0; x < mapDef.rows[y].length; x++) {
      if (free(x, y)) return { x, y };
    }
  }
  return null;
}

// resolveFootPos(mapId, maps, pos): where a player on foot in
// trouble on `mapId` should be put — foot-safe ground on the same
// map first (the authored start, then warp-adjacent ground, then a
// scan from the south edge up, mirroring resolveStartPos), then
// breadth-first through the warp graph (sea lanes chain route to
// route before they reach a town): the nearest destination that
// resolves foot-safe ground wins, so a trapped sea save washes up
// in the town its lane serves. Returns {mapId, x, y}, or null when
// nothing resolves — callers then leave the position exactly as it
// was; the rescue never makes a save worse.
export function resolveFootPos(mapId, maps, pos) {
  const mapDef = maps && maps[mapId];
  if (!mapDef || !Array.isArray(mapDef.rows) || !mapDef.rows.length) return null;
  const spot = footSpotOn(mapDef, pos);
  if (spot) return { mapId, x: spot.x, y: spot.y };
  const seen = new Set([mapId]);
  let frontier = [mapId];
  for (let depth = 0; depth < 4 && frontier.length; depth++) {
    const next = [];
    for (const id of frontier) {
      for (const w of maps[id].warps || []) {
        if (!w.to || seen.has(w.to.map) || !maps[w.to.map]) continue;
        seen.add(w.to.map);
        const destSpot = footSpotOn(maps[w.to.map], w.to);
        if (destSpot) return { mapId: w.to.map, x: destSpot.x, y: destSpot.y };
        next.push(w.to.map);
      }
    }
    frontier = next;
  }
  return null;
}
