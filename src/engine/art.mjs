// art.mjs — hand-authored pixel-art wiring (Phase 4 Wave 3, Game Producer).
// Replaces the SpriteForge placeholder calls with real ART data per
// assets/sprites/README.md (wiring handoff) and docs/contracts.md §1.
// Battlers: Wave 0 size standard — authored 64x64 (legacy art 32x32),
// drawn at BATTLER_DRAW_SIZE (64 logical px, both sides) via
// Renderer.blitS with imageSmoothingEnabled=false.
// Runtime transforms (README): attack = 1.2x scale for 3 frames then back;
// impact = white palette-swap 2 frames + screen shake; faint = sink 8px + fade
// to 0 alpha over 20 frames; idle bob = build-time derived `-bob` frame.
// Species / tile kinds WITHOUT authored art fall back to the forge painters —
// those are documented placeholders, never presented as finished art.

import { ART } from '../../assets/sprites/art-data.mjs';
import { forgeSprite, forgeHumanoid } from './sprites.mjs';
import { paintTile } from './tiles.mjs';
import { BATTLER_DRAW_SIZE } from './render.mjs';

const cvCache = new Map();

function key(id, scale, white, swap) {
  let k = id + '|' + scale + '|' + (white ? 'w' : 'n');
  if (swap) {
    const parts = Object.keys(swap).sort().map((ch) => ch + '=' + swap[ch]);
    if (parts.length) k += '|swap:' + parts.join(',');
  }
  return k;
}

// Rasterize one ART sprite to an offscreen canvas at integer pixel scale.
// white=true: impact-flash variant (every inked pixel -> white).
// swap (optional): palette-key -> hex remap applied over the authored
// palette (NPC palette-swap rasterization, Wave 0). Keys not in the swap
// keep their authored color; a sprite rasterized without a swap is the
// authored default.
export function artCanvas(doc, id, scale, white, swap) {
  const k = key(id, scale || 1, !!white, swap);
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
      ctx.fillStyle = white ? '#ffffff' : ((swap && swap[ch]) || a.pal[ch] || '#ff00ff');
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  cvCache.set(k, cv);
  return cv;
}

// ---- battle battlers (authored art -> BATTLER_DRAW_SIZE via blitS) ----
// `size` is THE draw size for both foe and ally: the Wave 0 standard
// (64 logical px). Legacy 32x32 canvases upscale x2 at draw time;
// future 64x64 canvases draw 1:1 — one code path, no per-side literals.
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
      size: BATTLER_DRAW_SIZE,
    };
  }
  // Fallback: forge stand-in (documented; replaced when art ships).
  const cv = forgeSprite(doc, species, BATTLER_DRAW_SIZE);
  return { front: cv, back: cv, frontBob: null, frontWhite: null, backWhite: null, size: BATTLER_DRAW_SIZE, forgeFallback: true };
}

// ---- overworld ----
export function ashFrames(doc, dir) {
  // [idle1, idle2, walk1, walk2, walk3, walk4] — 16x16 canvases.
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const ids = ['idle-1', 'idle-2', 'walk-1', 'walk-2', 'walk-3', 'walk-4'];
  return ids.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1) || artCanvas(doc, 'ash-down-' + f, 1));
}

// ---- NPC art selection (Wave 0: explicit art field, not name strings) ----
// Every NPC instance in the data (src/data/maps*.mjs, quests.mjs
// TALE_NPCS, bonds.mjs PARLEY_NPCS) carries an explicit `art` kind:
// 'youngster' | 'rival' | 'coach' | 'aide' | 'nurse' | 'lass' |
// 'professor' | 'brock' | 'pc'. That field is the primary key. The
// legacy name map below is ONLY a last-resort fallback for an instance
// that predates the field (it is what CHAMPION and SPARRING COACH used
// to miss through — both now carry art:'rival' / art:'coach' in data).
const NPC_ROLE = {
  AIDE: 'aide', COACH: 'coach', NURSE: 'nurse', GARY: 'rival',
  BEA: 'lass', LISA: 'lass',
  // Legacy-name safety net for the two known misses (data now sets the
  // art field explicitly; these keep any un-updated copy honest):
  CHAMPION: 'rival', 'SPARRING COACH': 'coach',
};
export function npcArtKind(npc) {
  if (!npc) return 'youngster';
  // UI v2.3 (defect 5): a PC terminal is a MACHINE, not a person.
  if (npc.pc) return 'pc';
  if (npc.art) return npc.art;
  const name = (npc.name || '').toUpperCase();
  if (name === 'BROCK') return 'brock';
  return NPC_ROLE[name] || 'youngster';
}

// ---- NPC palette-swap (Wave 0) ----
// Map data carries an authored palette per instance (skin / shirt /
// pants / hair) — 98 distinct tuples that the hand-art path used to
// ignore entirely. Each NPC kind's sprite keys its primary garment
// colors distinctly; this table maps palette KEY -> data FIELD for the
// keys that carry instance identity. Authored secondary shades (cap,
// glasses, vest-dark, uniform accent) are kind identity, not instance
// palette, and stay authored. The nurse sprite's legs were split onto
// their own key (T, same hex as the hair key P) in its .pix source so
// hair and pants can remap independently.
const NPC_SWAP_KEYS = {
  youngster: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  rival: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  lass: { S: 'skin', H: 'hair', D: 'shirt', K: 'pants' },
  nurse: { S: 'skin', P: 'hair', W: 'shirt', T: 'pants' },
  coach: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  aide: { S: 'skin', H: 'hair', V: 'shirt', P: 'pants' },
  professor: { S: 'skin', G: 'hair', W: 'shirt', K: 'pants' },
  brock: { S: 'skin', H: 'hair', V: 'shirt', P: 'pants' },
};
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export function npcSwapFor(npc, kind) {
  const table = NPC_SWAP_KEYS[kind];
  if (!table || !npc) return null;
  const swap = {};
  for (const [ch, field] of Object.entries(table)) {
    const hex = npc[field];
    if (typeof hex === 'string' && HEX_RE.test(hex)) swap[ch] = hex.toLowerCase();
  }
  return Object.keys(swap).length ? swap : null;
}

export function npcFrames(doc, npc) {
  const kind = npcArtKind(npc);
  // Authored terminal art (monitor + box-grid screen + cabinet). A PC
  // is a machine: no palette swap, ever.
  if (kind === 'pc') {
    const a = artCanvas(doc, 'npc-pc-idle-1', 1);
    const b = artCanvas(doc, 'npc-pc-idle-2', 1);
    if (a && b) return [a, b];
  }
  const prefix = kind === 'brock' ? 'brock' : 'npc-' + kind;
  const swap = npcSwapFor(npc, kind);
  const a = artCanvas(doc, prefix + '-idle-1', 1, false, swap);
  const b = artCanvas(doc, prefix + '-idle-2', 1, false, swap);
  if (a && b) return [a, b];
  // Fallback: forge placeholder humanoid (honors the data palette).
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
