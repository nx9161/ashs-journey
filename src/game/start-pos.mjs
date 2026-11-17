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
