// art.mjs — hand-authored pixel-art wiring (Phase 4 Wave 3, Game Producer).
// Replaces the SpriteForge placeholder calls with real ART data per
// assets/sprites/README.md (wiring handoff) and docs/contracts.md §1.
// Battlers are 32x32 authored; drawn at 48px via Renderer.blitS with
// imageSmoothingEnabled=false (README: "scale in canvas if the contract says so").
// Runtime transforms (README): attack = 1.2x scale for 3 frames then back;
// impact = white palette-swap 2 frames + screen shake; faint = sink 8px + fade
// to 0 alpha over 20 frames; idle bob = build-time derived `-bob` frame.
// Species / tile kinds WITHOUT authored art fall back to the forge painters —
// those are documented placeholders, never presented as finished art.

import { ART } from '../../assets/sprites/art-data.mjs';
import { forgeSprite, forgeHumanoid } from './sprites.mjs';
import { paintTile } from './tiles.mjs';

const cvCache = new Map();

function key(id, scale, white) { return id + '|' + scale + '|' + (white ? 'w' : 'n'); }

// Rasterize one ART sprite to an offscreen canvas at integer pixel scale.
// white=true: impact-flash variant (every inked pixel -> white).
export function artCanvas(doc, id, scale, white) {
  const k = key(id, scale || 1, !!white);
  const hit = cvCache.get(k);
  if (hit) return hit;
  const a = ART[id];
  if (!a) return null;
  const s = scale || 1;
  const cv = doc.createElement('canvas');
  cv.width = a.w * s; cv.height = a.h * s;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < a.h; y++) {
    const row = a.rows[y] || '';
    for (let x = 0; x < a.w; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      ctx.fillStyle = white ? '#ffffff' : (a.pal[ch] || '#ff00ff');
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  cvCache.set(k, cv);
  return cv;
}

// ---- battle battlers (32px ART -> 48px draw size via blitS) ----
export function speciesBattleArt(doc, speciesId, species) {
  const mk = (id) => artCanvas(doc, id, 1, false);
  const front = mk(speciesId + '-front');
  const back = mk(speciesId + '-back');
  if (front && back) {
    return {
      front, back,
      frontBob: mk(speciesId + '-front-bob'),
      frontWhite: artCanvas(doc, speciesId + '-front', 1, true),
      backWhite: artCanvas(doc, speciesId + '-back', 1, true),
      size: 48,
    };
  }
  // Fallback: forge stand-in (documented; replaced when art ships).
  const cv = forgeSprite(doc, species, 48);
  return { front: cv, back: cv, frontBob: null, frontWhite: null, backWhite: null, size: 48, forgeFallback: true };
}

// ---- overworld ----
export function ashFrames(doc, dir) {
  // [idle1, idle2, walk1, walk2, walk3, walk4] — 16x16 canvases.
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const ids = ['idle-1', 'idle-2', 'walk-1', 'walk-2', 'walk-3', 'walk-4'];
  return ids.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1) || artCanvas(doc, 'ash-down-' + f, 1));
}

const NPC_ROLE = {
  AIDE: 'aide', COACH: 'coach', NURSE: 'nurse', GARY: 'rival',
  BEA: 'lass', LISA: 'lass',
};
export function npcFrames(doc, npc) {
  const name = ((npc && npc.name) || '').toUpperCase();
  if (name === 'BROCK') {
    return [artCanvas(doc, 'brock-idle-1', 1), artCanvas(doc, 'brock-idle-2', 1)];
  }
  const role = NPC_ROLE[name] || 'youngster';
  const a = artCanvas(doc, 'npc-' + role + '-idle-1', 1);
  const b = artCanvas(doc, 'npc-' + role + '-idle-2', 1);
  if (a && b) return [a, b];
  // Fallback: forge placeholder humanoid.
  const cv = forgeHumanoid(doc, npc);
  return [cv, cv];
}

export function partnerHopFrames(doc) {
  const a = artCanvas(doc, 'pikachu-hop-1', 1);
  const b = artCanvas(doc, 'pikachu-hop-2', 1);
  return (a && b) ? [a, b] : null;
}

// ---- tiles ----
const TILE_ART = {
  tree: 'tile-tree', path: 'tile-path', grass: 'tile-grass',
  house: 'tile-house', door: 'tile-door', sign: 'tile-sign',
  gymwall: 'tile-gymwall', gymdoor: 'tile-gymdoor', centerdoor: 'tile-centerdoor',
  flower: 'tile-flower', rock: 'tile-rock',
};

export function buildArtTileCache(doc) {
  // kind -> canvas (16x16). 'water' -> [water-1, water-2] animated pair.
  // 'void' stays a solid fill (no art). Kinds without ART fall back to paintTile.
  const cache = {};
  for (const kind of Object.keys(TILE_ART)) {
    const cv = artCanvas(doc, TILE_ART[kind], 1);
    if (cv) { cache[kind] = cv; continue; }
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), kind, 0, 0);
    cache[kind] = fb;
  }
  const w1 = artCanvas(doc, 'tile-water-1', 1);
  const w2 = artCanvas(doc, 'tile-water-2', 1);
  if (w1 && w2) cache.water = [w1, w2];
  else {
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), 'water', 0, 0);
    cache.water = fb;
  }
  return cache;
}

export function tileSprite(cache, kind, t) {
  const v = cache[kind];
  if (!v) return null;
  if (Array.isArray(v)) return v[Math.floor((t || 0) / 600) % 2]; // water shimmer
  return v;
}

// ---- UI icons (ART ui family) ----
export function uiIcon(doc, name) {
  return artCanvas(doc, 'icon-' + name, 1);
}
