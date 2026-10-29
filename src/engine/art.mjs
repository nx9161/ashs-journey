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

// ---- Layered delta frames (Premium+ W0, spec §4 W0 item 1) ----
// ART entries authored as .deltapix ship in delta form:
//   { base, w, h, pal, deltas: [[x, y, char], ...] }
// where pal carries ONLY palette keys the base lacks and each delta is a
// palette-index override ('.' erases to transparent). materializeArt()
// resolves an entry to the full { w, h, pal, rows } shape every consumer
// already expects; full entries return as-is (identity — zero behaviour
// change for all pre-existing art). Results are cached per id; the base
// chain is depth-1 by build law (build-art rejects a delta base).
const matCache = new Map();
export function materializeArt(id) {
  const a = ART[id];
  if (!a) return null;
  if (!a.deltas) return a;
  const hit = matCache.get(id);
  if (hit) return hit;
  const base = materializeArt(a.base);
  if (!base) return null;
  const rows = base.rows.map((r) => r.split(''));
  for (const [x, y, ch] of a.deltas) {
    if (rows[y] && x >= 0 && x < rows[y].length) rows[y][x] = ch;
  }
  const out = { w: a.w, h: a.h, pal: { ...base.pal, ...a.pal }, rows: rows.map((r) => r.join('')) };
  matCache.set(id, out);
  return out;
}

const cvCache = new Map();

function artCacheKey(id, scale, white, swap) {
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
  const k = artCacheKey(id, scale || 1, !!white, swap);
  const hit = cvCache.get(k);
  if (hit) return hit;
  const a = materializeArt(id);
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
  // [idle1, idle2, walk1, walk2, walk3, walk4] — 16x32 canvases since
  // Wave 3a (the right-facing set is authored art of its own, NOT a
  // mirror of the left set — cap logo, hip strap buckle, bag pocket).
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const ids = ['idle-1', 'idle-2', 'walk-1', 'walk-2', 'walk-3', 'walk-4'];
  return ids.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1) || artCanvas(doc, 'ash-down-' + f, 1));
}

// ---- NPC art selection (Wave 0: explicit art field, not name strings) ----
// Every NPC instance in the data (src/data/maps*.mjs, quests.mjs
// TALE_NPCS, bonds.mjs PARLEY_NPCS) carries an explicit `art` kind:
// the generic kinds ('youngster' | 'rival' | 'coach' | 'aide' |
// 'nurse' | 'lass' | 'professor' | 'brock' | 'pc'), plus since
// Wave 3b the role kinds ('hiker' | 'swimmer' | 'sailor' |
// 'scientist' | 'fisher' | 'elder' | 'kid' | 'camper' |
// 'bugcatcher' | 'biker' | 'grunt' | 'clerk' | 'worker' |
// 'officer' | 'lady' | 'gent' | 'monk' | 'ranger' |
// 'acetrainer' | 'twin'), plus, since Wave 3a, one individual kind per named-cast member ('gary',
// 'garychamp', 'mom', 'hawthorn', 'misty', 'surge', 'erika', 'koga',
// 'sabrina', 'blaine', 'giovanni', 'lorelei', 'bruno', 'agatha',
// 'lance', 'rue', 'cole', 'sparcoach'), plus, since the Wave 4
// addendum, the two Pokemon Tower spirit kinds ('cubonespirit' |
// 'marowakspirit' — 16x20 overworld species sprites, deliberately NOT
// in NPC_SWAP_KEYS so their authored ghost palettes never swap). That
// field is the primary key. The
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

// ---- NPC palette-swap (Wave 0; Wave 3a uniform scheme) ----
// Map data carries an authored palette per instance (skin / shirt /
// pants / hair) — 98 distinct tuples that the hand-art path used to
// ignore entirely. Each NPC kind's sprite keys its primary garment
// colors distinctly; this table maps palette KEY -> data FIELD for the
// keys that carry instance identity. Authored secondary shades (cap,
// glasses, vest-dark, uniform accent) are kind identity, not instance
// palette, and stay authored. (Wave 0 note, superseded in Wave 3a: the
// nurse sprite's legs once used a split key T; the Wave 3a redraws put
// EVERY named-cast kind on the uniform S/H/J/P key scheme below, so
// nurse and brock remap through the same keys as everyone else. The
// named kinds' authored palettes were chosen to agree with their
// instances' data palettes, so the swap is an identity mapping for
// them — it exists so the discipline holds, not to recolor them.)
const NPC_SWAP_KEYS = {
  youngster: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  rival: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  lass: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  nurse: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  coach: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  aide: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  professor: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  brock: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  // Wave 3b generic population — every generic kind is authored on the
  // same uniform swap scheme (hair/shirt/pants/skin as distinct keys),
  // so the ~98 authored instance palettes render across the whole crowd.
  hiker: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  swimmer: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  sailor: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  scientist: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  fisher: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  elder: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  kid: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  camper: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  bugcatcher: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  biker: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  grunt: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  clerk: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  worker: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  officer: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  lady: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  gent: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  monk: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  ranger: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  acetrainer: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  twin: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  // Wave 3a named cast — individual sprites, uniform swap keys.
  gary: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  garychamp: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  mom: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  hawthorn: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  misty: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  surge: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  erika: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  koga: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  sabrina: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  blaine: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  giovanni: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  lorelei: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  bruno: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  agatha: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  lance: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  rue: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  cole: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
  sparcoach: { S: 'skin', H: 'hair', J: 'shirt', P: 'pants' },
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

// Wave 3a: the follower's at-rest pair (blink / ear-twitch), drawn at
// the same 16x20 canvas as the hop pair.
export function partnerIdleFrames(doc) {
  const a = artCanvas(doc, 'pikachu-idle-1', 1);
  const b = artCanvas(doc, 'pikachu-idle-2', 1);
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
  // Premium+ W0 (TX-1 prerequisite): grassground — grass-texture ground
  // with NO encounter behaviour. Encounter code keys on the map CHAR
  // (',' only; see overworld.mjs onStep / overworld-systems.mjs
  // sysEncounterStep), and grassground's char '_' is in none of those
  // branches, so dressing a cell grassground can never create or remove
  // an encounter. W5 does the re-dress; W0 only wires the kind.
  grassground: 'tile-grassground',
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
  // Wave 4 nature & dungeons.
  cavewall: 'tile-cavewall-1', cavefloor: 'tile-cavefloor-1', caveboulder: 'tile-caveboulder-1',
  towerwall: 'tile-towerwall', towerfloor: 'tile-towerfloor-1',
  silphwall: 'tile-silphwall', silphfloor: 'tile-silphfloor-1',
  plantwall: 'tile-plantwall', plantfloor: 'tile-plantfloor-1',
  // Wave 5a interiors: per-family tilesets + the prop library. Kind ->
  // tile-<kind> for walls; floors resolve through their variant lists;
  // props are tile-prop-<kind> (composited over their floor, below).
  centerfloor: 'tile-centerfloor-1', centerwall: 'tile-centerwall',
  martfloor: 'tile-martfloor-1', martwall: 'tile-martwall',
  housefloor: 'tile-housefloor-1', housewall: 'tile-housewall',
  gymfloor: 'tile-gymfloor-1', gymwallin: 'tile-gymwallin',
  labfloor: 'tile-labfloor-1', labwall: 'tile-labwall',
  annewall: 'tile-annewall', leaguewall: 'tile-leaguewall',
  counter: 'tile-prop-counter', healmachine: 'tile-prop-healmachine',
  pcdesk: 'tile-prop-pcdesk', bed: 'tile-prop-bed', table: 'tile-prop-table',
  chair: 'tile-prop-chair', shelf: 'tile-prop-shelf', plant: 'tile-prop-plant',
  martshelf: 'tile-prop-martshelf', goods: 'tile-prop-goods',
  podium: 'tile-prop-podium', statue: 'tile-prop-statue',
  badgecase: 'tile-prop-badgecase', labmachine: 'tile-prop-labmachine',
  labtank: 'tile-prop-labtank', labdesk: 'tile-prop-labdesk',
  cabinbed: 'tile-prop-cabinbed', cabintable: 'tile-prop-cabintable',
  porthole: 'tile-prop-porthole', slotmachine: 'tile-prop-slotmachine',
  throne: 'tile-prop-throne', memorial: 'tile-prop-memorial',
  officedesk: 'tile-prop-officedesk', sofa: 'tile-prop-sofa',
  stool: 'tile-prop-stool', rug: 'tile-prop-rug', battlemat: 'tile-prop-battlemat',
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
  cache.flowerVariants = ids(['tile-flower', 'tile-flower-2', 'tile-flower-3']);
  // Wave 4: tree-variant pool = 3 species (oak / pine / elm) x 2 sizes +
  // the bush. The resolver picks by the (x + 2y) mod n rule documented in
  // resolveTileLayers, so orthogonally adjacent trees never share a stamp.
  cache.treeVariants = ids(['tile-tree', 'tile-tree-oak-small', 'tile-tree-pine',
    'tile-tree-pine-small', 'tile-tree-elm', 'tile-tree-elm-small', 'tile-bush']);
  if (cache.treeVariants.length) cache.tree = cache.treeVariants[0];
  cache.rockVariants = ids(['tile-rock', 'tile-rock-2', 'tile-rock-3']);
  if (cache.rockVariants.length) cache.rock = cache.rockVariants[0];
  cache.caveWallVariants = ids(['tile-cavewall-1', 'tile-cavewall-2', 'tile-cavewall-3']);
  if (cache.caveWallVariants.length) cache.cavewall = cache.caveWallVariants[0];
  cache.stalactite = artCanvas(doc, 'tile-stalactite', 1);
  cache.caveFloorVariants = ids(['tile-cavefloor-1', 'tile-cavefloor-2', 'tile-cavefloor-3']);
  if (cache.caveFloorVariants.length) cache.cavefloor = cache.caveFloorVariants[0];
  cache.caveBoulderVariants = ids(['tile-caveboulder-1', 'tile-caveboulder-2', 'tile-caveboulder-3']);
  if (cache.caveBoulderVariants.length) cache.caveboulder = cache.caveBoulderVariants[0];
  cache.towerFloorVariants = ids(['tile-towerfloor-1', 'tile-towerfloor-2']);
  if (cache.towerFloorVariants.length) cache.towerfloor = cache.towerFloorVariants[0];
  cache.silphFloorVariants = ids(['tile-silphfloor-1', 'tile-silphfloor-2']);
  if (cache.silphFloorVariants.length) cache.silphfloor = cache.silphFloorVariants[0];
  cache.plantFloorVariants = ids(['tile-plantfloor-1', 'tile-plantfloor-2']);
  if (cache.plantFloorVariants.length) cache.plantfloor = cache.plantFloorVariants[0];
  // Wave 5a interior floor variants (2 per family, spread-hash picked).
  cache.centerFloorVariants = ids(['tile-centerfloor-1', 'tile-centerfloor-2']);
  if (cache.centerFloorVariants.length) cache.centerfloor = cache.centerFloorVariants[0];
  cache.martFloorVariants = ids(['tile-martfloor-1', 'tile-martfloor-2']);
  if (cache.martFloorVariants.length) cache.martfloor = cache.martFloorVariants[0];
  cache.houseFloorVariants = ids(['tile-housefloor-1', 'tile-housefloor-2']);
  if (cache.houseFloorVariants.length) cache.housefloor = cache.houseFloorVariants[0];
  cache.gymFloorVariants = ids(['tile-gymfloor-1', 'tile-gymfloor-2']);
  if (cache.gymFloorVariants.length) cache.gymfloor = cache.gymFloorVariants[0];
  cache.labFloorVariants = ids(['tile-labfloor-1', 'tile-labfloor-2']);
  if (cache.labFloorVariants.length) cache.labfloor = cache.labFloorVariants[0];
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

// ---- Wave 4: nature & dungeon helpers ----
// Kind families for the Wave 4 sets (used for ground compositing under
// object tiles and for cave-context detection around rocks/boulders).
const CAVE_KINDS = new Set(['cavewall', 'cavefloor', 'caveboulder']);
const DUNGEON_WALLS = new Set(['cavewall', 'towerwall', 'silphwall', 'plantwall']);
const FLOOR_VARIANTS = {
  grass: 'grassVariants', path: 'pathVariants', cavefloor: 'caveFloorVariants',
  towerfloor: 'towerFloorVariants', silphfloor: 'silphFloorVariants', plantfloor: 'plantFloorVariants',
  centerfloor: 'centerFloorVariants', martfloor: 'martFloorVariants',
  housefloor: 'houseFloorVariants', gymfloor: 'gymFloorVariants', labfloor: 'labFloorVariants',
};
// Wave 5a: interior floor kinds are ground families of their own (a prop
// inside a Center stands on Center floor, never on grass or path), and
// interior walls cast the shared shadow strip onto the floor below.
const INTERIOR_FLOORS = new Set(['centerfloor', 'martfloor', 'housefloor', 'gymfloor', 'labfloor']);
const INTERIOR_WALLS = new Set(['centerwall', 'martwall', 'housewall', 'gymwallin', 'labwall', 'annewall', 'leaguewall']);
const PROP_KINDS = new Set(['counter', 'healmachine', 'pcdesk', 'bed', 'table',
  'chair', 'shelf', 'plant', 'martshelf', 'goods', 'podium', 'statue',
  'badgecase', 'labmachine', 'labtank', 'labdesk', 'cabinbed', 'cabintable',
  'porthole', 'slotmachine', 'throne', 'memorial', 'officedesk', 'sofa',
  'stool', 'rug', 'battlemat']);
function groundFamilyOf(kind) {
  if (kind === 'grass' || kind === 'grassground' || kind === 'flower' || kind === 'tree' || kind === 'rock' || kind === 'sign' ||
      kind === 'fence' || kind === 'lamp' || kind === 'flowerbed') return 'grass';
  if (kind === 'cavefloor' || kind === 'towerfloor' || kind === 'silphfloor' || kind === 'plantfloor') return kind;
  if (INTERIOR_FLOORS.has(kind)) return kind;
  if (kind === 'path' || isArchKind(kind)) return 'path';
  return null;
}
// Wave 4 spread hash: hashTile's output clusters in the low two-thirds
// over map-sized grids (measured: at every salt, an 18x13 grid never
// reaches the top third), which would starve 3-variant sets of their
// third variant. This second hash mixes with larger multipliers and
// distributes near-uniformly (measured ~78/74/82 over the same grid);
// it is used ONLY by the Wave 4 sets — Wave 1 picks keep hashTile so
// their shipped look does not move.
export function hashTileSpread(x, y, salt) {
  let h = (Math.imul(x + 1, 2654435761) ^ Math.imul(y + 1, 2246822519) ^ Math.imul(salt + 1, 3266489917)) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
function pickVariantSpread(arr, x, y, salt) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(hashTileSpread(x, y, salt) * arr.length) % arr.length];
}
function groundBase(cache, family, x, y) {
  if (!family) return null;
  const arr = cache[FLOOR_VARIANTS[family]];
  if (family === 'grass') return pickVariant(arr, x, y, 13) || cache[family] || null;
  if (family === 'path') return pickVariant(arr, x, y, 21) || cache[family] || null;
  return pickVariantSpread(arr, x, y, 61) || cache[family] || null;
}
// Tree-variant index: (x + 2y) mod n. Orthogonal steps change the index
// by 1 (east/west) or 2 (north/south) — never by 0 mod n for n >= 3 — so
// two orthogonally adjacent trees can NEVER resolve to the same stamp,
// while the species/size mix still varies across every forest (Wave 4 QA:
// forest audit, no two adjacent identical tree stamps).
export function treeVariantIndex(x, y, n) {
  return ((x + 2 * y) % n + n) % n;
}
// Boulder variant for the runtime (Strength) boulder overlay: must agree
// with the map-tile resolver at the boulder's home position so the two
// draws are the same sprite, and follow the boulder when it is pushed.
export function boulderCanvasFor(cache, x, y, cave) {
  const arr = cave ? cache.caveBoulderVariants : cache.rockVariants;
  const v = cave ? pickVariantSpread(arr, x, y, 53) : pickVariant(arr, x, y, 43);
  return v || (cave ? cache.caveboulder : cache.rock) || null;
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
    case 'grassground': {
      // Premium+ W0: textured meadow ground — its own authored tile,
      // never a tall/encounter variant (isTallGrass applies to the
      // 'grass' kind only). Building shadow + path dirt-edge dressing
      // match the base-grass treatment so W5 re-dress blends in.
      const layers = [cache.grassground || pickVariant(cache.grassVariants, x, y, 13) || cache.grass];
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
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
      const grassy = (k) => k === 'grass' || k === 'grassground' || k === 'flower' || k === 'tree' || k === 'rock' || k === 'sign';
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
      // Wave 4: a cave bank gets foam only — the sand shore scallop is an
      // outdoor treatment and must not appear in the cave set.
      const caveBank = DIRS.some((d) => CAVE_KINDS.has(nb[d]));
      let shore = false;
      for (const d of DIRS) {
        if (nb[d] && nb[d] !== 'water' && nb[d] !== 'void' && cache.shore && cache.shore[d]) {
          if (!caveBank) layers.push(cache.shore[d]);
          shore = true;
        }
      }
      if (shore && cache.foamFrames && cache.foamFrames.length) {
        layers.push(cache.foamFrames[frame % cache.foamFrames.length]);
      }
      return layers.filter(Boolean);
    }
    case 'cavewall': {
      // Strata walls by position hash; an exposed face (floor to the
      // south) with a lucky hash wears the stalactite face instead.
      if (nb.s === 'cavefloor' && cache.stalactite && hashTileSpread(x, y, 52) < 0.45) return [cache.stalactite];
      return [pickVariantSpread(cache.caveWallVariants, x, y, 51) || cache.cavewall].filter(Boolean);
    }
    case 'cavefloor': case 'towerfloor': case 'silphfloor': case 'plantfloor': {
      const layers = [groundBase(cache, kind, x, y)];
      // A dungeon wall directly north casts the shared shadow strip.
      if (DUNGEON_WALLS.has(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      if (hashTileSpread(x, y, 62) < 0.10 && cache.detail && cache.detail.pebbles) layers.push(cache.detail.pebbles);
      return layers.filter(Boolean);
    }
    case 'centerfloor': case 'martfloor': case 'housefloor': case 'gymfloor': case 'labfloor': {
      // Wave 5a interior floors: own variant pair; an interior or
      // dungeon wall directly north casts the shared shadow strip.
      // Interiors are swept — no pebble detail indoors.
      const layers = [groundBase(cache, kind, x, y)];
      if ((INTERIOR_WALLS.has(nb.n) || DUNGEON_WALLS.has(nb.n)) && cache.shadowStrip) layers.push(cache.shadowStrip);
      return layers.filter(Boolean);
    }
    case 'tree': case 'rock': case 'caveboulder': case 'sign': case 'flower':
    case 'fence': case 'lamp': case 'flowerbed':
    // Wave 5a props: furniture composites over the floor it stands on,
    // exactly like the outdoor objects above (transparent surrounds in
    // the .pix; the ground layer comes from the neighbours, interior
    // floor families included). Rugs / battle mats are walkable
    // dressings drawn the same way, over their floor.
    case 'counter': case 'healmachine': case 'pcdesk': case 'bed':
    case 'table': case 'chair': case 'shelf': case 'plant':
    case 'martshelf': case 'goods': case 'podium': case 'statue':
    case 'badgecase': case 'labmachine': case 'labtank': case 'labdesk':
    case 'cabinbed': case 'cabintable': case 'porthole': case 'slotmachine':
    case 'throne': case 'memorial': case 'officedesk': case 'sofa':
    case 'stool': case 'rug': case 'battlemat': {
      // Object tiles carry transparent surrounds (Wave 1): lay the ground
      // the object stands on beneath it — south neighbour's family first
      // (the contact edge), else the neighbour majority, else grass.
      // Wave 4: the dungeon floors are ground families of their own, so a
      // cave boulder never sits on a square of grass again.
      let ground = groundFamilyOf(nb.s);
      if (!ground) {
        const counts = {};
        for (const d of DIRS) { const f = groundFamilyOf(nb[d]); if (f) counts[f] = (counts[f] || 0) + 1; }
        ground = ['grass', 'path', 'cavefloor', 'towerfloor', 'silphfloor', 'plantfloor',
          'centerfloor', 'martfloor', 'housefloor', 'gymfloor', 'labfloor']
          .filter((f) => counts[f]).sort((a, b) => counts[b] - counts[a])[0] || 'grass';
      }
      const layers = [];
      const base = groundBase(cache, ground, x, y);
      if (base) layers.push(base);
      if (kind === 'flower') layers.push(pickVariant(cache.flowerVariants, x, y, 31) || cache.flower);
      else if (kind === 'tree') {
        const tv = cache.treeVariants;
        layers.push(tv && tv.length ? tv[treeVariantIndex(x, y, tv.length)] : cache.tree);
      } else if (kind === 'rock') {
        const cave = ground === 'cavefloor' || DIRS.some((d) => CAVE_KINDS.has(nb[d]));
        layers.push(boulderCanvasFor(cache, x, y, cave));
      } else if (kind === 'caveboulder') {
        layers.push(boulderCanvasFor(cache, x, y, true));
      } else if (cache[kind]) layers.push(cache[kind]);
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

// ---- dialogue portraits (Wave 3b: the 15 authored portraits, wired) ----
// Speaker name -> portrait subject. Speakers are NPC names (overworld
// dialogue), story `who` strings, and UI speakers ('Prof. Hawthorn').
// Normalization: uppercase, parentheticals dropped, punctuation folded
// to spaces — 'GIOVANNI (phone)' and 'Giovanni' resolve alike. A speaker
// with no entry has NO portrait (the dialogue UI shows none — never a
// placeholder). All 15 portrait subjects are reachable through this map.
const SPEAKER_PORTRAITS = {
  'ASH': 'ash',
  'GARY': 'gary', 'CHAMPION': 'gary',
  'PROF HAWTHORN': 'hawthorn', 'HAWTHORN': 'hawthorn',
  'MISTY': 'misty', 'LT SURGE': 'surge', 'SURGE': 'surge',
  'ERIKA': 'erika', 'KOGA': 'koga', 'SABRINA': 'sabrina',
  'BLAINE': 'blaine', 'GIOVANNI': 'giovanni', 'THE BOSS': 'giovanni',
  'LORELEI': 'lorelei', 'BRUNO': 'bruno', 'AGATHA': 'agatha',
  'LANCE': 'lance', 'NURSE': 'nurse', 'NURSE JOY': 'nurse',
};
export function speakerPortraitId(speaker) {
  if (!speaker || typeof speaker !== 'string') return null;
  const norm = speaker.toUpperCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^A-Z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const subject = SPEAKER_PORTRAITS[norm];
  return subject ? 'portrait-' + subject : null;
}
export function speakerPortraitCanvas(doc, speaker) {
  const id = speakerPortraitId(speaker);
  return id ? artCanvas(doc, id, 1) : null;
}

// ---- trainer battle presentation (Wave 3b mechanism, Wave 6b art) ----
// The authored battle-scale trainer sprites (48x64), presented during
// the battle intro (state 'intro' — the challenge/send-out message
// chain) only: the foe trainer stands on the foe platform, Ash's back
// on the ally platform; battlers take over the moment the intro chain
// hands off to commands/RT. Trainers without a battle-scale sprite
// return null and the intro keeps the foe battler on the platform
// (graceful degrade for generic trainers).
// Wave 6b resolution: the 16 named figures resolve by trainer id, with
// name as fallback. Gary's five rival battles use gary-battle; his
// Champion battle (id gary_champion / title Champion) uses
// garychamp-battle. The uniformed duo resolves per its two data
// identities: the Route 2 ambush (id r2_duo, name 'Rue & Cole')
// presents Rue; the later duo battles (ids duo2..duo5, name
// 'Mara & Jules' — the same pair under their cover names) present
// Cole. Both duo sprites are thereby reachable in real battles.
const TRAINER_BATTLE_ART = {
  brock: 'brock-battle', misty: 'misty-battle', surge: 'surge-battle',
  erika: 'erika-battle', koga: 'koga-battle', sabrina: 'sabrina-battle',
  blaine: 'blaine-battle', giovanni: 'giovanni-battle',
  lorelei: 'lorelei-battle', bruno: 'bruno-battle',
  agatha: 'agatha-battle', lance: 'lance-battle',
  gary: 'gary-battle', garychamp: 'garychamp-battle',
  rue: 'rue-battle', cole: 'cole-battle',
};
const TRAINER_BATTLE_IDS = {
  brock: 'brock', misty: 'misty', surge: 'surge', erika: 'erika',
  koga: 'koga', sabrina: 'sabrina', blaine: 'blaine',
  giovanni: 'giovanni', lorelei: 'lorelei', bruno: 'bruno',
  agatha: 'agatha', lance: 'lance',
  gary_cerulean: 'gary', gary_stanne: 'gary', gary_tower: 'gary',
  gary_silph: 'gary', gary_r22_final: 'gary',
  gary_champion: 'garychamp',
  r2_duo: 'rue',
  duo2_vermilion: 'cole', duo3_celadon: 'cole', duo4_saffron: 'cole',
  duo5_island: 'cole',
};
const TRAINER_BATTLE_NAMES = {
  'brock': 'brock', 'misty': 'misty', 'lt. surge': 'surge',
  'erika': 'erika', 'koga': 'koga', 'sabrina': 'sabrina',
  'blaine': 'blaine', 'giovanni': 'giovanni', 'lorelei': 'lorelei',
  'bruno': 'bruno', 'agatha': 'agatha', 'lance': 'lance',
  'rue & cole': 'rue', 'mara & jules': 'cole',
};
export function trainerBattleArt(doc, trainer) {
  if (!trainer) return null;
  const name = String(trainer.name || '').toLowerCase();
  const id = String(trainer.id || '').toLowerCase();
  const title = String(trainer.title || '').toLowerCase();
  let kind = TRAINER_BATTLE_IDS[id] || TRAINER_BATTLE_NAMES[name] || null;
  if (!kind && (name === 'gary' || id.startsWith('gary'))) {
    kind = (id === 'gary_champion' || title.includes('champion')) ? 'garychamp' : 'gary';
  }
  return kind ? artCanvas(doc, TRAINER_BATTLE_ART[kind], 1) : null;
}
export function playerBattleBackArt(doc) {
  return artCanvas(doc, 'ash-battle-back', 1);
}
