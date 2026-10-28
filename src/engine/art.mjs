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
// Wave 1 terrain system (world-art census §3/§4 Wave 1): the single-tile
// lookup below is superseded at draw time by resolveTileLayers(), which
// composes each cell from variant + transition layers:
//   * deterministic per-position variants (hashTile on map x/y — stable
//     across frames and reloads, no game state involved);
//   * runtime auto-tiling: transition overlays are chosen from the four
//     neighbour KINDS at draw time, so all 56 maps inherit the terrain
//     system with zero map-data edits;
//   * object tiles (tree / rock / sign / flower) are authored with
//     transparent surrounds and are laid over the ground their position
//     actually stands on (the south neighbour's ground family, else the
//     neighbour majority) — no more grass squares baked onto sand.
// Presentation only: nothing here reads or writes game state.
const TILE_ART = {
  tree: 'tile-tree', path: 'tile-path', grass: 'tile-grass',
  house: 'tile-house', door: 'tile-door', sign: 'tile-sign',
  gymwall: 'tile-gymwall', gymdoor: 'tile-gymdoor', centerdoor: 'tile-centerdoor',
  flower: 'tile-flower', rock: 'tile-rock',
  // Wave 2 architecture + dressing: kind -> tile-<kind> for every piece.
  'roof-terra-l': 'tile-roof-terra-l', 'roof-terra-m': 'tile-roof-terra-m',
  'roof-terra-r': 'tile-roof-terra-r', 'roof-terra-chimney': 'tile-roof-terra-chimney',
  'roof-slate-l': 'tile-roof-slate-l', 'roof-slate-m': 'tile-roof-slate-m', 'roof-slate-r': 'tile-roof-slate-r',
  'roof-teal-l': 'tile-roof-teal-l', 'roof-teal-m': 'tile-roof-teal-m', 'roof-teal-r': 'tile-roof-teal-r',
  'roof-center-l': 'tile-roof-center-l', 'roof-center-m': 'tile-roof-center-m', 'roof-center-r': 'tile-roof-center-r',
  'sign-center': 'tile-sign-center', 'sign-gym': 'tile-sign-gym', 'sign-mart': 'tile-sign-mart', 'sign-lab': 'tile-sign-lab',
  'wall-house-lit': 'tile-wall-house-lit', 'wall-house-unlit': 'tile-wall-house-unlit',
  'door-house': 'tile-door-house', 'wall-house-plain': 'tile-wall-house-plain',
  'wall-wood-lit': 'tile-wall-wood-lit', 'door-wood-facade': 'tile-door-wood-facade',
  'wall-brick-lit': 'tile-wall-brick-lit', 'door-brick': 'tile-door-brick', 'wall-brick-plain': 'tile-wall-brick-plain',
  'wall-center': 'tile-wall-center', 'door-center-l': 'tile-door-center-l', 'door-center-r': 'tile-door-center-r',
  'wall-mart': 'tile-wall-mart', 'door-mart-l': 'tile-door-mart-l', 'door-mart-r': 'tile-door-mart-r',
  'wall-gym': 'tile-wall-gym', 'door-gym-l': 'tile-door-gym-l', 'door-gym-r': 'tile-door-gym-r',
  'wall-lab': 'tile-wall-lab', 'wall-lab-plain': 'tile-wall-lab-plain',
  'door-lab-l': 'tile-door-lab-l', 'door-lab-r': 'tile-door-lab-r', 'door-lab-facade': 'tile-door-lab-facade',
  'door-wood-l': 'tile-door-wood-l', 'door-wood-r': 'tile-door-wood-r',
  step: 'tile-step', fence: 'tile-fence', lamp: 'tile-lamp', flowerbed: 'tile-flowerbed',
};

// Wave 2: kinds that are part of a building (for ground-shadow anchoring
// and for the ground a dressing object stands on).
const ARCH_KINDS = new Set([
  'house', 'door', 'gymwall', 'gymdoor', 'centerdoor',
  ...Object.keys(TILE_ART).filter((k) => !['tree', 'path', 'grass', 'sign', 'flower', 'rock', 'fence', 'lamp', 'flowerbed'].includes(k)),
]);
export function isArchKind(kind) { return ARCH_KINDS.has(kind); }

// Deterministic 2D position hash (same family as tiles.mjs h2).
export function hashTile(x, y, salt) {
  let h = (x * 374761393 + y * 668265263 + (salt || 0) * 2246822519) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function pickVariant(arr, x, y, salt) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(hashTile(x, y, salt) * arr.length) % arr.length];
}

// A ',' cell renders TALL (tufted encounter grass) or BASE (plain textured
// grass) by this one hash rule — the resolver and the fringe logic must
// agree on it, so it lives in exactly one place.
function isTallGrass(x, y) { return hashTile(x, y, 11) < 0.78; }

export function buildArtTileCache(doc) {
  // kind -> canvas (16x16). 'water' -> [water-1..3] animated frames.
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
  const ids = (list) => list.map((id) => artCanvas(doc, id, 1)).filter(Boolean);
  cache.grassVariants = ids(['tile-grass', 'tile-grass-2', 'tile-grass-3', 'tile-grass-4', 'tile-grass-5', 'tile-grass-6']);
  cache.tallVariants = ids(['tile-tallgrass-1', 'tile-tallgrass-2', 'tile-tallgrass-3', 'tile-tallgrass-4']);
  cache.pathVariants = ids(['tile-path', 'tile-path-2', 'tile-path-3']);
  cache.flowerVariants = ids(['tile-flower', 'tile-flower-2']);
  // Legacy single-tile callers (rustle overlay) get a tufted tile: the
  // rustle draws over the player's grass cell, which is tufted now.
  if (cache.tallVariants.length) cache.grass = cache.tallVariants[0];
  if (cache.flowerVariants.length) cache.flower = cache.flowerVariants[0];
  const water = ids(['tile-water-1', 'tile-water-2', 'tile-water-3']);
  if (water.length) cache.water = water;
  else {
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), 'water', 0, 0);
    cache.water = fb;
  }
  cache.foamFrames = ids(['tile-foam-1', 'tile-foam-2', 'tile-foam-3']);
  const sides = (base, corners) => {
    const o = {};
    for (const d of ['n', 'e', 's', 'w']) o[d] = artCanvas(doc, base + '-' + d, 1);
    if (corners) for (const c of ['ne', 'nw', 'se', 'sw']) o[c] = artCanvas(doc, base + '-' + c, 1);
    return o;
  };
  cache.shore = sides('tile-shore');               // on water, side facing land
  cache.edgeDirt = sides('tile-edge-dirt', true);  // on grass, side/corner facing path
  cache.edgeGrass = sides('tile-edge-grass');      // on path, side facing grass
  cache.edgeWet = sides('tile-edge-wet');          // on path, side facing water
  cache.fringeTall = sides('tile-fringe-tall');    // on base grass, side facing tall grass
  cache.detail = {
    pebbles: artCanvas(doc, 'tile-detail-pebbles', 1),
    dirt: artCanvas(doc, 'tile-detail-dirt', 1),
  };
  // Wave 2: ground-shadow strip laid on ground cells directly south of
  // a building, anchoring every structure.
  cache.shadowStrip = artCanvas(doc, 'tile-shadow', 1);
  return cache;
}

export function tileSprite(cache, kind, t) {
  const v = cache[kind];
  if (!v) return null;
  if (Array.isArray(v)) return v[Math.floor((t || 0) / 600) % v.length]; // water shimmer (3 frames, Wave 1)
  return v;
}

const DIRS = ['n', 'e', 's', 'w'];

// Compose the layer stack for one map cell. kindAt(x, y) returns the tile
// KIND at a map position, or null off-map (off-map neighbours never raise
// a transition). t is the shared animation clock (water/foam stay in sync
// with tileSprite's 600ms frame step). Returns canvases in draw order.
export function resolveTileLayers(cache, kind, x, y, kindAt, t) {
  const at = (dx, dy) => {
    const k = kindAt(x + dx, y + dy);
    return k == null ? kind : k;
  };
  const nb = { n: at(0, -1), e: at(1, 0), s: at(0, 1), w: at(-1, 0) };
  const frame = Math.floor((t || 0) / 600);
  switch (kind) {
    case 'grass': {
      const layers = [];
      if (isTallGrass(x, y)) {
        layers.push(pickVariant(cache.tallVariants, x, y, 12) || cache.grass);
      } else {
        layers.push(pickVariant(cache.grassVariants, x, y, 13) || cache.grass);
        const dh = hashTile(x, y, 14);
        if (dh < 0.10 && cache.detail.pebbles) layers.push(cache.detail.pebbles);
        else if (dh < 0.18 && cache.detail.dirt) layers.push(cache.detail.dirt);
        // grass<->tallgrass: short tufts lean in from a tall neighbour.
        const off = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
        for (const d of DIRS) {
          const [dx, dy] = off[d];
          if (kindAt(x + dx, y + dy) === 'grass' && isTallGrass(x + dx, y + dy) &&
              cache.fringeTall && cache.fringeTall[d]) layers.push(cache.fringeTall[d]);
        }
      }
      // Wave 2: building directly north -> ground-shadow strip.
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      // grass<->path: worn dirt edge on the grass side (corners first).
      if (cache.edgeDirt) {
        const p = { n: nb.n === 'path', e: nb.e === 'path', s: nb.s === 'path', w: nb.w === 'path' };
        const used = new Set();
        for (const c of ['ne', 'se', 'sw', 'nw']) {
          if (p[c[0]] && p[c[1]] && cache.edgeDirt[c]) {
            layers.push(cache.edgeDirt[c]); used.add(c[0]); used.add(c[1]);
          }
        }
        for (const d of DIRS) {
          if (p[d] && !used.has(d) && cache.edgeDirt[d]) layers.push(cache.edgeDirt[d]);
        }
      }
      return layers.filter(Boolean);
    }
    case 'path': {
      const layers = [pickVariant(cache.pathVariants, x, y, 21) || cache.path];
      // Wave 2: a building directly north anchors this cell with its
      // ground-shadow strip.
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      if (hashTile(x, y, 22) < 0.10 && cache.detail.pebbles) layers.push(cache.detail.pebbles);
      const grassy = (k) => k === 'grass' || k === 'flower' || k === 'tree' || k === 'rock' || k === 'sign';
      for (const d of DIRS) {
        if (nb[d] === 'water' && cache.edgeWet && cache.edgeWet[d]) layers.push(cache.edgeWet[d]);
        // Fringe on ~70% of path cells (position hash): a fringe on every
        // cell reads as stitching; broken spill reads as growth.
        else if (grassy(nb[d]) && cache.edgeGrass && cache.edgeGrass[d] &&
                 hashTile(x, y, 23 + d.charCodeAt(0)) < 0.7) layers.push(cache.edgeGrass[d]);
      }
      return layers.filter(Boolean);
    }
    case 'water': {
      const layers = [];
      const base = Array.isArray(cache.water) ? cache.water[frame % cache.water.length] : cache.water;
      if (base) layers.push(base);
      // Shore/foam on EVERY bank: any non-water, non-void neighbour is land.
      let shore = false;
      for (const d of DIRS) {
        if (nb[d] && nb[d] !== 'water' && nb[d] !== 'void' && cache.shore && cache.shore[d]) {
          layers.push(cache.shore[d]); shore = true;
        }
      }
      if (shore && cache.foamFrames && cache.foamFrames.length) {
        layers.push(cache.foamFrames[frame % cache.foamFrames.length]);
      }
      return layers.filter(Boolean);
    }
    case 'tree': case 'rock': case 'sign': case 'flower':
    case 'fence': case 'lamp': case 'flowerbed': {
      // Object tiles carry transparent surrounds (Wave 1): lay the ground
      // the object stands on beneath it — south neighbour's family first
      // (the contact edge), else the neighbour majority, else grass.
      const fam = (k) => (k === 'grass' || k === 'flower' || k === 'tree' || k === 'rock' || k === 'sign' || k === 'fence' || k === 'lamp' || k === 'flowerbed')
        ? 'grass'
        : (k === 'path' || isArchKind(k)) ? 'path' : null;
      let ground = fam(nb.s);
      if (!ground) {
        const counts = { grass: 0, path: 0 };
        for (const d of DIRS) { const f = fam(nb[d]); if (f) counts[f]++; }
        ground = counts.path > counts.grass ? 'path' : 'grass';
      }
      const base = ground === 'path'
        ? (pickVariant(cache.pathVariants, x, y, 21) || cache.path)
        : (pickVariant(cache.grassVariants, x, y, 13) || cache.grass);
      const layers = [];
      if (base) layers.push(base);
      if (kind === 'flower') layers.push(pickVariant(cache.flowerVariants, x, y, 31) || cache.flower);
      else if (cache[kind]) layers.push(cache[kind]);
      return layers.filter(Boolean);
    }
    default: {
      const v = cache[kind];
      if (!v) return [];
      if (Array.isArray(v)) return [v[frame % v.length]];
      return [v];
    }
  }
}

// ---- UI icons (ART ui family) ----
export function uiIcon(doc, name) {
  return artCanvas(doc, 'icon-' + name, 1);
}
