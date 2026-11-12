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
import { KIT_ART } from '../../assets/sprites/kit-art-data.mjs';
import { forgeSprite, forgeHumanoid } from './sprites.mjs';
import { paintTile, W6_PROP_KINDS, W6_RUG_KINDS, W6_FLOOR_KINDS, W6_WALL_KINDS, W7_PROP_KINDS, O1_PROP_KINDS, O1_FLOOR_KINDS, O1_WALL_KINDS, J3_PROP_KINDS, J3_FLOOR_KINDS, J3_WALL_KINDS, JOHTO_TOWN_ORDER, H3_PROP_KINDS, H3_FLOOR_KINDS, H3_WALL_KINDS, H3B_PROP_KINDS, H3B_FLOOR_KINDS, H3B_WALL_KINDS, HOENN_TOWN_ORDER, S3_PROP_KINDS, S3_FLOOR_KINDS, S3_WALL_KINDS, S3B_PROP_KINDS, S3B_FLOOR_KINDS, S3B_WALL_KINDS, SINNOH_TOWN_ORDER, G2_KINDS } from './tiles.mjs';
import { BATTLER_DRAW_SIZE } from './render.mjs';
import { battlerDrawSize } from '../data/battler-tiers.mjs';

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
  // Kit entries (Gassasin CC-BY tileset/character, Phase 1 2026-11-11)
  // live in their own generated registry; they are plain entries (no
  // delta chains), resolved here so artCanvas — and with it the swap
  // and seasonal-grade machinery — treats them identically to ART.
  const a = ART[id] || KIT_ART[id];
  if (!a) return null;
  if (!a.deltas && !a.shiftY) return a;
  const hit = matCache.get(id);
  if (hit) return hit;
  const base = materializeArt(a.base);
  if (!base) return null;
  if (a.shiftY) {
    // Premium+ W2 shift-delta (back-bob): the base pose shifted down
    // by shiftY rows, top rows transparent — the build-time derived
    // bob, shipped in ~60 B instead of a full frame.
    const rows = base.rows.map(() => '.'.repeat(a.w));
    for (let y = 0; y < a.h - a.shiftY; y++) rows[y + a.shiftY] = base.rows[y];
    const out = { w: a.w, h: a.h, pal: base.pal, rows };
    matCache.set(id, out);
    return out;
  }
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
      // Premium+ W2 (AN-1): back-bob parity (shift-delta derived at
      // build time for all 162 backs) + authored accent deltas for the
      // priority species (null where a species has no accent frame —
      // the idle-class mechanism still animates it procedurally).
      backBob: mk(speciesId + '-back-bob'),
      frontAccent: mk(speciesId + '-front-accent'),
      backAccent: mk(speciesId + '-back-accent'),
      frontWhite: artCanvas(doc, speciesId + '-front', 1, true),
      backWhite: artCanvas(doc, speciesId + '-back', 1, true),
      // Premium+ W8 (SP-1): per-species draw-scale tier (52/64/80,
      // platform-anchored — the classic draw anchors on the frame's
      // bottom edge, so a bigger tier grows UP from the disc). Foe
      // and ally read the same table: staged parity replaces the
      // Wave 0 uniform-size parity. Forge fallback keeps 64.
      size: battlerDrawSize(speciesId),
    };
  }
  // Fallback: forge stand-in (documented; replaced when art ships).
  const cv = forgeSprite(doc, species, BATTLER_DRAW_SIZE);
  return { front: cv, back: cv, frontBob: null, backBob: null, frontAccent: null, backAccent: null, frontWhite: null, backWhite: null, size: BATTLER_DRAW_SIZE, forgeFallback: true };
}

// ---- overworld ----
// Gassasin kit character (Phase 1, owner adoption 2026-11-11): one
// character, idle + walk in 4 directions, authored 16x16 and padded
// bottom-anchored onto the 16x32 overworld frame format by the kit
// pipeline (build-kit-art.mjs) — the draw path is unchanged. The kit
// ships directional idles only for 'down'; other facings idle on their
// walk cycle's standing frame. swap (NPC instances) recolors via the
// semantic palette keys (S/H/J/P) baked into the kit entries.
// forPlayer=true returns the ashFrames layout [idle1..4, walk1..6]
// (the kit's 4 walk frames ping-ponged across the 6 walk slots);
// otherwise returns { idle, walk } sets for the NPC frame picker.
export function kitCharFrames(doc, dir, swap, forPlayer) {
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const cv = (id) => artCanvas(doc, id, 1, false, swap || undefined);
  const walk = [1, 2, 3, 4].map((i) => cv('kit-char-' + d + '-walk-' + i));
  if (walk.some((c) => !c)) return null;
  let idle = null;
  if (d === 'down') {
    const f = [1, 2, 3, 4].map((i) => cv('kit-char-down-idle-' + i));
    if (!f.some((c) => !c)) idle = f;
  }
  if (!idle) idle = [walk[0], walk[0], walk[0], walk[0]];
  if (forPlayer) return [...idle, walk[0], walk[1], walk[2], walk[3], walk[2], walk[1]];
  return { idle, walk };
}

export function ashFrames(doc, dir) {
  // Kit adoption (Phase 1): the player wears the kit character on this
  // branch. Mode sets (run/bike/surf/fish) have no kit equivalent and
  // keep the authored Ash sets via ashModeFrames.
  const kit = kitCharFrames(doc, dir, null, true);
  if (kit) return kit;
  // [idle1..4, walk1..6] — 16x32 canvases since Wave 3a (the right-facing
  // set is authored art of its own, NOT a mirror of the left set — cap
  // logo, hip strap buckle, bag pocket). Premium+ W3 (AN-3): idle extends
  // to 4 frames (breath + hair/strap secondary motion) and the walk cycle
  // to 6 frames/direction with amplified swing (consecutive-frame diff
  // >=150px on the sprite canvas, measured in the W3 rig).
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const ids = ['idle-1', 'idle-2', 'idle-3', 'idle-4',
    'walk-1', 'walk-2', 'walk-3', 'walk-4', 'walk-5', 'walk-6'];
  return ids.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1) || artCanvas(doc, 'ash-down-' + f, 1));
}

// Premium+ W3 (AN-3): mode-specific locomotion sets. Every traversal
// mode renders its OWN art (run 6f, bike 4f, surf 2f, fishing cast+hold
// 2f per direction) — surf/bike are no longer speed changes wearing the
// walk cycle. Missing frames degrade to null entries; callers fall back
// to the walk set only when a whole mode set is absent.
export function ashModeFrames(doc, dir, mode) {
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const names = {
    run: ['run-1', 'run-2', 'run-3', 'run-4', 'run-5', 'run-6'],
    bike: ['bike-1', 'bike-2', 'bike-3', 'bike-4'],
    surf: ['surf-1', 'surf-2'],
    fish: ['fish-cast', 'fish-hold'],
  }[mode] || [];
  return names.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1));
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

// ---- Premium+ W4 (AN-4): directional NPC sets + named/roaming tables ----
// The named cast (Wave 3a's 20 individual kinds) extends its FRONT idle
// to 4 frames with a kind-specific gesture (idle-3/4 deltas). The 24
// roaming generic kinds own walk cycles (2f x 4 dirs). Every one of the
// 48 kinds (all but the PC terminal, a machine that already cycles 4
// screen frames) owns directional idles: up/left/right at 2f each.
export const NPC_NAMED_KINDS = new Set([
  'gary', 'garychamp', 'mom', 'hawthorn', 'brock', 'misty', 'surge',
  'erika', 'koga', 'sabrina', 'blaine', 'giovanni', 'lorelei', 'bruno',
  'agatha', 'lance', 'rue', 'cole', 'nurse', 'sparcoach',
]);
export const NPC_ROAMING_KINDS = new Set([
  'youngster', 'lass', 'kid', 'twin', 'camper', 'bugcatcher', 'hiker',
  'sailor', 'fisher', 'biker', 'worker', 'ranger', 'officer', 'gent',
  'lady', 'elder', 'monk', 'scientist', 'swimmer', 'acetrainer', 'aide',
  'coach', 'rival', 'grunt',
]);

// Directional frame set for one NPC instance: walk pair while moving
// (roaming kinds), else the idle set for the facing — the named cast's
// 4-frame gesture cycle on the front, 2-frame idles elsewhere. Missing
// art degrades to the shipped front pair (npcFrames), never to nothing.
export function npcFramesFor(doc, npc, dir, moving) {
  const kind = npcArtKind(npc);
  if (kind === 'pc') return npcFrames(doc, npc);
  const prefix = kind === 'brock' ? 'brock' : 'npc-' + kind;
  const swap = npcSwapFor(npc, kind);
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  // Kit adoption (Phase 1): Pallet's cast — Gary — wears the kit
  // character, recolored by his instance palette through the standard
  // swap machinery (his blue shirt / dark pants / brown hair read
  // against the player's authored teal). The champion kind
  // ('garychamp') and every other NPC keep their authored art.
  if (kind === 'gary') {
    const set = kitCharFrames(doc, d, swap, false);
    if (set) {
      if (moving) return [set.walk[0], set.walk[1]];
      if (d === 'down') return set.idle; // 4-frame named-cast cycle
      return [set.walk[0], set.walk[0]];
    }
  }
  const cv = (id) => artCanvas(doc, id, 1, false, swap);
  if (moving) {
    const w = [cv(prefix + '-' + d + '-walk-1'), cv(prefix + '-' + d + '-walk-2')].filter(Boolean);
    if (w.length >= 2) return w;
  }
  if (d === 'down') {
    const base = [cv(prefix + '-idle-1'), cv(prefix + '-idle-2')].filter(Boolean);
    if (base.length >= 2) {
      if (NPC_NAMED_KINDS.has(kind)) {
        const g = [cv(prefix + '-idle-3'), cv(prefix + '-idle-4')].filter(Boolean);
        if (g.length >= 2) return [...base, ...g];
      }
      return base;
    }
  } else {
    const f = [cv(prefix + '-' + d + '-idle-1'), cv(prefix + '-' + d + '-idle-2')].filter(Boolean);
    if (f.length >= 2) return f;
  }
  return npcFrames(doc, npc);
}

export function npcFrames(doc, npc) {
  const kind = npcArtKind(npc);
  // Authored terminal art (monitor + box-grid screen + cabinet). A PC
  // is a machine: no palette swap, ever.
  if (kind === 'pc') {
    // Premium+ W3 (AN-6): the PC terminal screen cycles 4 frames
    // (the W3 screen-cycle deltas join the shipped pair).
    const frames = ['npc-pc-idle-1', 'npc-pc-idle-2', 'npc-pc-idle-3', 'npc-pc-idle-4']
      .map((id) => artCanvas(doc, id, 1)).filter(Boolean);
    if (frames.length >= 2) return frames;
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

// Premium+ W3 (AN-2): the follower is fully directional — hop + idle
// pairs for all four facings (down = the Wave 3a front set, redrawn with
// the wide bolt tail; up = back view with stripes; left/right = profiles),
// plus the sleep pair and the look-around emote pair. Every frame paints
// all 4 palette yellows (the shipped 4th yellow painted zero pixels).
const PARTNER_DIR_PREFIX = { down: 'pikachu', up: 'pikachu-up', left: 'pikachu-left', right: 'pikachu-right' };
export function partnerHopFrames(doc, dir) {
  const p = PARTNER_DIR_PREFIX[dir] || 'pikachu';
  const a = artCanvas(doc, p + '-hop-1', 1);
  const b = artCanvas(doc, p + '-hop-2', 1);
  return (a && b) ? [a, b] : null;
}

export function partnerIdleFrames(doc, dir) {
  const p = PARTNER_DIR_PREFIX[dir] || 'pikachu';
  const a = artCanvas(doc, p + '-idle-1', 1);
  const b = artCanvas(doc, p + '-idle-2', 1);
  return (a && b) ? [a, b] : null;
}

export function partnerSleepFrames(doc) {
  const a = artCanvas(doc, 'pikachu-sleep-1', 1);
  const b = artCanvas(doc, 'pikachu-sleep-2', 1);
  return (a && b) ? [a, b] : null;
}

export function partnerLookFrames(doc) {
  const a = artCanvas(doc, 'pikachu-look-1', 1);
  const b = artCanvas(doc, 'pikachu-look-2', 1);
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
  // Premium+ W5 (LD-4): cave light sources + authored item ball.
  cavecrystal: 'tile-cavecrystal', cavelantern: 'tile-cavelantern',
  lavaglow: 'tile-lavaglow', waterglow: 'tile-waterglow',
  itemball: 'tile-itemball',
};
// Premium+ W6 (TX-3/TX-4/TX-5): gym facades + wall dressing draw their
// own tile; props/rugs are tile-prop-<kind>; dungeon floors/walls are
// tile-<kind> (dungeon object props are tile-prop-<kind> too).
for (const k of W6_WALL_KINDS) TILE_ART[k] = 'tile-' + k;
for (const k of W6_FLOOR_KINDS) TILE_ART[k] = 'tile-' + k;
for (const k of [...W6_PROP_KINDS, ...W6_RUG_KINDS]) TILE_ART[k] = 'tile-prop-' + k;
// Premium+ W7 (TX-6): dressing + gate/arch props draw tile-prop-<kind>.
for (const k of W7_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 1.5 Stage O1: Orange kinds — walls/floors draw tile-<kind>,
// props draw tile-prop-<kind> (same convention as W6/W7).
for (const k of [...O1_WALL_KINDS, ...O1_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of O1_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 2 Stage J3a: Johto kinds — same convention as O1.
for (const k of [...J3_WALL_KINDS, ...J3_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of J3_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 3 Stage H3a: Hoenn kinds — same convention as O1/J3.
for (const k of [...H3_WALL_KINDS, ...H3_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of H3_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 3 Stage H3b: Hoenn east/water kinds — same convention as H3a.
for (const k of [...H3B_WALL_KINDS, ...H3B_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of H3B_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 4 Stage S3a: Sinnoh kinds — same convention as H3/H3b.
for (const k of [...S3_WALL_KINDS, ...S3_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of S3_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Arc 4 Stage S3b: Sinnoh east/north kinds — same convention as S3a.
for (const k of [...S3B_WALL_KINDS, ...S3B_FLOOR_KINDS]) TILE_ART[k] = 'tile-' + k;
for (const k of S3B_PROP_KINDS) TILE_ART[k] = 'tile-prop-' + k;
// Perfection Pass Stage 2 Gate 0 (G0-4): the shuttered facade panel draws
// its own tile and renders as-is (no facade group, no upper/side variant).
TILE_ART['facade-panel'] = 'tile-facade-panel';
// Perfection Pass Stage 2 Gate 2 (G2): beach transition kinds draw their
// own feathered tiles (tile-beach-<dir> on the tropgrass side,
// tile-psand-<dir> on the path side).
for (const k of G2_KINDS) TILE_ART[k] = 'tile-' + k;

// Premium+ W6 (TX-3/PL-1): door-open frames, authored in TX-3 for every
// door kind. The warp-fade engine that plays them lands in W7 — W6
// wires the frames (this registry + cache.doorOpen + doorOpenCanvas)
// so W7 only adds timing.
export const DOOR_OPEN_ART = {
  'door-house': 'tile-door-house-open',
  'door-wood-facade': 'tile-door-wood-facade-open',
  'door-brick': 'tile-door-brick-open',
  'door-center-l': 'tile-door-center-l-open',
  'door-center-r': 'tile-door-center-r-open',
  'door-mart-l': 'tile-door-mart-l-open',
  'door-mart-r': 'tile-door-mart-r-open',
  'door-gym-l': 'tile-door-gym-l-open',
  'door-gym-r': 'tile-door-gym-r-open',
  'door-lab-l': 'tile-door-lab-l-open',
  'door-lab-r': 'tile-door-lab-r-open',
  'door-wood-l': 'tile-door-wood-l-open',
  'door-wood-r': 'tile-door-wood-r-open',
  door: 'tile-door-open',
  gymdoor: 'tile-gymdoor-open',
  centerdoor: 'tile-centerdoor-open',
};
export function doorOpenCanvas(doc, kind) {
  const id = DOOR_OPEN_ART[kind];
  return id ? artCanvas(doc, id, 1) : null;
}

// Premium+ W6 (TX-3, anchor P-1/P-4): facade groups. A facade cell is
// part of one building run (its group); the resolver renders the run's
// EDGE cells as side walls (one full shade step darker, P-1) and cells
// with a same-group facade/door to their south as the upper storey
// (window design B where an -upper variant is authored).
const FACADE_GROUPS = {};
for (const t of ['pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar', 'indigo']) FACADE_GROUPS['tw-' + t] = 'house';
for (const t of JOHTO_TOWN_ORDER) FACADE_GROUPS['tw-' + t] = 'house';
for (const t of HOENN_TOWN_ORDER) FACADE_GROUPS['tw-' + t] = 'house';
for (const t of SINNOH_TOWN_ORDER) FACADE_GROUPS['tw-' + t] = 'house';
for (const k of ['wall-house-lit', 'wall-house-unlit', 'wall-house-plain',
  'wall-wood-lit', 'wall-brick-lit', 'wall-brick-plain']) FACADE_GROUPS[k] = 'house';
FACADE_GROUPS['wall-center'] = 'center';
FACADE_GROUPS['wall-mart'] = 'mart';
FACADE_GROUPS['wall-gym'] = 'gym';
for (const k of ['gym-ground', 'gym-rock', 'gym-water', 'gym-volt',
  'gym-leaf', 'gym-psy', 'gym-poison', 'gym-fire']) FACADE_GROUPS[k] = 'gym';
FACADE_GROUPS['wall-lab'] = 'lab';
FACADE_GROUPS['wall-lab-plain'] = 'lab';
const DOOR_GROUP = {
  'door-house': 'house', 'door-wood-facade': 'house', 'door-brick': 'house',
  'door-wood-l': 'house', 'door-wood-r': 'house',
  'door-center-l': 'center', 'door-center-r': 'center',
  'door-mart-l': 'mart', 'door-mart-r': 'mart',
  'door-gym-l': 'gym', 'door-gym-r': 'gym',
  'door-lab-l': 'lab', 'door-lab-r': 'lab', 'door-lab-facade': 'lab',
};
// Readability Round 2 (lever 1): the full door-kind set — every door in
// the game gets the same two glance signals (cream frame surgery in the
// .pix sources + a shared doormat on the ground cell directly south).
const DOOR_KINDS = new Set(['door', 'gymdoor', 'centerdoor', ...Object.keys(DOOR_GROUP)]);
const isDoorKind = (k) => !!k && DOOR_KINDS.has(k);
const FACADE_KIND_LIST = Object.keys(FACADE_GROUPS);
// Premium+ W5 (TX-2): per-town identity kinds -> their authored tiles.
for (const id of ['pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar', 'indigo']) {
  TILE_ART['tg-' + id] = 'tile-tg-' + id;
  TILE_ART['tc-' + id] = 'tile-tc-' + id;
  TILE_ART['td-' + id] = 'tile-td-' + id;
  TILE_ART['tr-' + id] = 'tile-tr-' + id;
  TILE_ART['tl-' + id] = 'tile-tl-' + id;
}
for (const id of ['pallet', 'cerulean', 'celadon', 'lavender', 'fuchsia', 'cinnabar']) {
  TILE_ART['flora-' + id] = 'tile-flora-' + id;
}
// Arc 2 Stage J3a: Johto town identity kinds -> their authored tiles
// (the resolver's prefix branches handle tg/tg2/tc/td/tr/tl/th/tw for
// any town id; tc2 canopy variants are optional and simply absent).
for (const id of JOHTO_TOWN_ORDER) {
  TILE_ART['tg-' + id] = 'tile-tg-' + id;
  TILE_ART['tg2-' + id] = 'tile-tg2-' + id;
  TILE_ART['tc-' + id] = 'tile-tc-' + id;
  TILE_ART['td-' + id] = 'tile-td-' + id;
  TILE_ART['tr-' + id] = 'tile-tr-' + id;
  TILE_ART['tl-' + id] = 'tile-tl-' + id;
  TILE_ART['th-' + id] = 'tile-th-' + id;
  TILE_ART['tw-' + id] = 'tile-tw-' + id;
}
// Arc 3 Stage H3a: Hoenn town identity kinds -> their authored tiles
// (same resolver prefix branches as Johto).
for (const id of SINNOH_TOWN_ORDER) {
  TILE_ART['tg-' + id] = 'tile-tg-' + id;
  TILE_ART['tg2-' + id] = 'tile-tg2-' + id;
  TILE_ART['tc-' + id] = 'tile-tc-' + id;
  TILE_ART['td-' + id] = 'tile-td-' + id;
  TILE_ART['tr-' + id] = 'tile-tr-' + id;
  TILE_ART['tl-' + id] = 'tile-tl-' + id;
  TILE_ART['th-' + id] = 'tile-th-' + id;
  TILE_ART['tw-' + id] = 'tile-tw-' + id;
}
for (const id of HOENN_TOWN_ORDER) {
  TILE_ART['tg-' + id] = 'tile-tg-' + id;
  TILE_ART['tg2-' + id] = 'tile-tg2-' + id;
  TILE_ART['tc-' + id] = 'tile-tc-' + id;
  TILE_ART['td-' + id] = 'tile-td-' + id;
  TILE_ART['tr-' + id] = 'tile-tr-' + id;
  TILE_ART['tl-' + id] = 'tile-tl-' + id;
  TILE_ART['th-' + id] = 'tile-th-' + id;
  TILE_ART['tw-' + id] = 'tile-tw-' + id;
}
// Premium+ W5 round 2: second town ground + town house roof/wall kinds.
for (const id of ['pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar', 'indigo']) {
  TILE_ART['tg2-' + id] = 'tile-tg2-' + id;
  TILE_ART['th-' + id] = 'tile-th-' + id;
  TILE_ART['tw-' + id] = 'tile-tw-' + id;
  TILE_ART['tc2-' + id] = 'tile-tc2-' + id;
}

// Wave 2: kinds that are part of a building (for ground-shadow anchoring
// and for the ground a dressing object stands on).
// Premium+ W5: town ground/canopy/dress/flora kinds, grassground,
// waterglow and the item ball are NOT architecture (they cast no
// building shadow strip and anchor no dressing ground).
const ARCH_KINDS = new Set([
  'house', 'door', 'gymwall', 'gymdoor', 'centerdoor',
  ...Object.keys(TILE_ART).filter((k) => !['tree', 'path', 'grass', 'grassground', 'sign', 'flower', 'rock', 'fence', 'lamp', 'flowerbed',
    'waterglow', 'itemball'].includes(k) &&
    !k.startsWith('tg-') && !k.startsWith('tg2-') && !k.startsWith('tc-') && !k.startsWith('td-') && !k.startsWith('flora-')),
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

export function buildArtTileCache(doc, seasonSwapFor) {
  // kind -> canvas (16x16). 'water' -> [water-1..3] animated frames.
  // 'void' stays a solid fill (no art). Kinds without ART fall back to paintTile.
  // Season grade (Black 2 imposition, 2026-11-11): when seasonSwapFor is
  // supplied (main.mjs passes seasons.mjs's), vegetation tile art —
  // grass / tall grass / flowers / trees / bush / tropgrass — is
  // rasterized with its greens re-graded for the current season. Every
  // other tile keeps its authored palette exactly.
  const VEG_ID = /^tile-(grass|tallgrass|flower|tree|bush|tropgrass|grassground)/;
  const swapFor = (id) => {
    if (!seasonSwapFor || !VEG_ID.test(id)) return undefined;
    const a = materializeArt(id);
    if (!a || !a.pal) return undefined;
    const sw = seasonSwapFor(a.pal);
    return sw && Object.keys(sw).length ? sw : undefined;
  };
  const cache = {};
  for (const kind of Object.keys(TILE_ART)) {
    const cv = artCanvas(doc, TILE_ART[kind], 1, false, swapFor(TILE_ART[kind]));
    if (cv) { cache[kind] = cv; continue; }
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), kind, 0, 0);
    cache[kind] = fb;
  }
  const ids = (list) => list.map((id) => artCanvas(doc, id, 1, false, swapFor(id))).filter(Boolean);
  // ---- Gassasin kit towns (Phase 1: pallet; docs/THIRD-PARTY-ART.md) ----
  // Kit canvases for opted-in towns, keyed cache.kitTowns[mapId] and
  // consumed by resolveTileLayers' kit branch. Vegetation tiles pass
  // through the SAME seasonal grade as our own art — seasonSwapFor
  // re-grades green-dominant kit palette entries, so a kit lawn turns
  // amber in Autumn and snow-pale in Winter like the drawn world;
  // roofs, logs, dirt and doors keep their authored colors.
  const kitSwap = (id) => {
    if (!seasonSwapFor) return undefined;
    const a = KIT_ART[id];
    if (!a || !a.pal) return undefined;
    const sw = seasonSwapFor(a.pal);
    return sw && Object.keys(sw).length ? sw : undefined;
  };
  const kitCv = (id, veg) => artCanvas(doc, id, 1, false, veg ? kitSwap(id) : undefined);
  cache.kitTowns = {
    pallet: {
      grass: ['kit-grass-1', 'kit-grass-2', 'kit-grass-3'].map((id) => kitCv(id, true)).filter(Boolean),
      path: ['kit-path-1', 'kit-path-2'].map((id) => kitCv(id, false)).filter(Boolean),
      tall: kitCv('kit-tallgrass', true),
      flora: kitCv('kit-flora', true),
      canopy: kitCv('kit-canopy', true),
      sign: kitCv('kit-sign', false),
      roofL: kitCv('kit-roof-l', false), roofM: kitCv('kit-roof-m', false),
      roofR: kitCv('kit-roof-r', false), roofDormer: kitCv('kit-roof-dormer', false),
      wallPlain: kitCv('kit-wall-plain', false), wallWindow: kitCv('kit-wall-window', false),
      door: kitCv('kit-door', false),
    },
  };
  if (!cache.kitTowns.pallet.grass.length || !cache.kitTowns.pallet.door) delete cache.kitTowns;
  cache.grassVariants = ids(['tile-grass', 'tile-grass-2', 'tile-grass-3', 'tile-grass-4', 'tile-grass-5', 'tile-grass-6', 'tile-grass-7', 'tile-grass-8', 'tile-grass-9', 'tile-grass-10']); // W5 TX-1: 10 base variants
  cache.tallVariants = ids(['tile-tallgrass-1', 'tile-tallgrass-2', 'tile-tallgrass-3', 'tile-tallgrass-4', 'tile-tallgrass-5', 'tile-tallgrass-6']); // W5 TX-1: 6 tall variants
  cache.pathVariants = ids(['tile-path', 'tile-path-2', 'tile-path-3', 'tile-path-4', 'tile-path-5', 'tile-path-6']); // W5 TX-1: 6 path variants (cobble + worn-centre)
  cache.flowerVariants = ids(['tile-flower', 'tile-flower-2', 'tile-flower-3', 'tile-flower-4', 'tile-flower-5']);
  // Wave 4: tree-variant pool = 3 species (oak / pine / elm) x 2 sizes +
  // the bush. The resolver picks by the (x + 2y) mod n rule documented in
  // resolveTileLayers, so orthogonally adjacent trees never share a stamp.
  cache.treeVariants = ids(['tile-tree', 'tile-tree-oak-small', 'tile-tree-pine',
    'tile-tree-pine-small', 'tile-tree-elm', 'tile-tree-elm-small', 'tile-bush']);
  if (cache.treeVariants.length) cache.tree = cache.treeVariants[0];
  cache.rockVariants = ids(['tile-rock', 'tile-rock-2', 'tile-rock-3']);
  if (cache.rockVariants.length) cache.rock = cache.rockVariants[0];
  cache.caveWallVariants = ids(['tile-cavewall-1', 'tile-cavewall-2', 'tile-cavewall-3', 'tile-cavewall-4', 'tile-cavewall-5']); // W5: +violet strata +basalt
  if (cache.caveWallVariants.length) cache.cavewall = cache.caveWallVariants[0];
  cache.stalactite = artCanvas(doc, 'tile-stalactite', 1);
  cache.caveFloorVariants = ids(['tile-cavefloor-1', 'tile-cavefloor-2', 'tile-cavefloor-3', 'tile-cavefloor-4', 'tile-cavefloor-5']); // W5 TX-1: 5 cave floors
  if (cache.caveFloorVariants.length) cache.cavefloor = cache.caveFloorVariants[0];
  cache.caveBoulderVariants = ids(['tile-caveboulder-1', 'tile-caveboulder-2', 'tile-caveboulder-3']);
  if (cache.caveBoulderVariants.length) cache.caveboulder = cache.caveBoulderVariants[0];
  cache.towerFloorVariants = ids(['tile-towerfloor-1', 'tile-towerfloor-2', 'tile-towerfloor-3', 'tile-towerfloor-4']);
  if (cache.towerFloorVariants.length) cache.towerfloor = cache.towerFloorVariants[0];
  cache.silphFloorVariants = ids(['tile-silphfloor-1', 'tile-silphfloor-2', 'tile-silphfloor-3', 'tile-silphfloor-4']);
  if (cache.silphFloorVariants.length) cache.silphfloor = cache.silphFloorVariants[0];
  cache.plantFloorVariants = ids(['tile-plantfloor-1', 'tile-plantfloor-2', 'tile-plantfloor-3', 'tile-plantfloor-4']);
  if (cache.plantFloorVariants.length) cache.plantfloor = cache.plantFloorVariants[0];
  // Wave 5a interior floor variants (2 per family, spread-hash picked).
  cache.centerFloorVariants = ids(['tile-centerfloor-1', 'tile-centerfloor-2', 'tile-centerfloor-3', 'tile-centerfloor-4']); // W5 TX-1: 4/family
  if (cache.centerFloorVariants.length) cache.centerfloor = cache.centerFloorVariants[0];
  cache.martFloorVariants = ids(['tile-martfloor-1', 'tile-martfloor-2', 'tile-martfloor-3', 'tile-martfloor-4']);
  if (cache.martFloorVariants.length) cache.martfloor = cache.martFloorVariants[0];
  cache.houseFloorVariants = ids(['tile-housefloor-1', 'tile-housefloor-2', 'tile-housefloor-3', 'tile-housefloor-4']);
  if (cache.houseFloorVariants.length) cache.housefloor = cache.houseFloorVariants[0];
  cache.gymFloorVariants = ids(['tile-gymfloor-1', 'tile-gymfloor-2', 'tile-gymfloor-3', 'tile-gymfloor-4']);
  if (cache.gymFloorVariants.length) cache.gymfloor = cache.gymFloorVariants[0];
  cache.labFloorVariants = ids(['tile-labfloor-1', 'tile-labfloor-2', 'tile-labfloor-3', 'tile-labfloor-4']);
  if (cache.labFloorVariants.length) cache.labfloor = cache.labFloorVariants[0];
  // Legacy single-tile callers (rustle overlay) get a tufted tile: the
  // rustle draws over the player's grass cell, which is tufted now.
  if (cache.tallVariants.length) cache.grass = cache.tallVariants[0];
  if (cache.flowerVariants.length) cache.flower = cache.flowerVariants[0];
  const water = ids(['tile-water-1', 'tile-water-2', 'tile-water-3', 'tile-water-4', 'tile-water-5', 'tile-water-6']);
  if (water.length) cache.water = water;
  else {
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), 'water', 0, 0);
    cache.water = fb;
  }
  cache.foamFrames = ids(['tile-foam-1', 'tile-foam-2', 'tile-foam-3', 'tile-foam-4']);
  // ---- Premium+ W3 (AN-5): environment-motion frame sets ----
  // Every set is phase-offset per tile at resolve time (animFrame) on
  // one of three cadence groups — fast 200ms / medium 400ms / slow
  // 800ms — so nothing in the world pulses in unison.
  cache.tallSway = [1, 2, 3, 4, 5, 6].map((v) => ids([
    'tile-tallgrass-' + v, 'tile-tallgrass-' + v + '-sway2', 'tile-tallgrass-' + v + '-sway3',
  ]));
  cache.grassSway = {
    a: ids(['tile-sway-a-1', 'tile-sway-a-2', 'tile-sway-a-3']),
    b: ids(['tile-sway-b-1', 'tile-sway-b-2', 'tile-sway-b-3']),
  };
  cache.treeSway = ['tile-tree', 'tile-tree-oak-small', 'tile-tree-pine',
    'tile-tree-pine-small', 'tile-tree-elm', 'tile-tree-elm-small', 'tile-bush']
    .map((id) => artCanvas(doc, id + '-sway', 1));
  cache.flowerSway = ['tile-flower', 'tile-flower-2', 'tile-flower-3', 'tile-flower-4', 'tile-flower-5']
    .map((id) => artCanvas(doc, id + '-sway', 1));
  cache.lampFrames = ids(['tile-lamp', 'tile-lamp-2', 'tile-lamp-3']);
  if (cache.lampFrames.length) cache.lamp = cache.lampFrames[0];
  cache.smokeGrey = ids(['tile-smoke-grey-1', 'tile-smoke-grey-2', 'tile-smoke-grey-3']);
  cache.smokeWarm = ids(['tile-smoke-warm-1', 'tile-smoke-warm-2', 'tile-smoke-warm-3']);
  cache.shorePulse = ids(['tile-shorepulse-1', 'tile-shorepulse-2', 'tile-shorepulse-3', 'tile-shorepulse-4']);
  cache.crystalFrames = ids(['tile-crystal-1', 'tile-crystal-2']);
  cache.dripFrames = ids(['tile-drip-1', 'tile-drip-2']);
  cache.wakeFrames = ids(['tile-wake-1', 'tile-wake-2']);
  // Animated prop sets (AN-5/AN-6): kind -> frames. Heal machine, lab
  // tank and porthole live indoors too; plant sway + shelf glint are
  // the interior-life pair; lab/slot/pc-desk form the blink family.
  cache.propFrames = {
    healmachine: ids(['tile-prop-healmachine', 'tile-prop-healmachine-2', 'tile-prop-healmachine-3']),
    labtank: ids(['tile-prop-labtank', 'tile-prop-labtank-2', 'tile-prop-labtank-3']),
    porthole: ids(['tile-prop-porthole', 'tile-prop-porthole-2']),
    plant: ids(['tile-prop-plant', 'tile-prop-plant-2']),
    shelf: ids(['tile-prop-shelf', 'tile-prop-shelf-2']),
    labmachine: ids(['tile-prop-labmachine', 'tile-prop-labmachine-2', 'tile-prop-labmachine-3']),
    slotmachine: ids(['tile-prop-slotmachine', 'tile-prop-slotmachine-2', 'tile-prop-slotmachine-3']),
    pcdesk: ids(['tile-prop-pcdesk', 'tile-prop-pcdesk-2', 'tile-prop-pcdesk-3']),
  };
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
    // Premium+ W5 (TX-1): detail overlays 2 -> 12.
    leaves: artCanvas(doc, 'tile-detail-leaves', 1),
    twig: artCanvas(doc, 'tile-detail-twig', 1),
    petals: artCanvas(doc, 'tile-detail-petals', 1),
    shells: artCanvas(doc, 'tile-detail-shells', 1),
    moss: artCanvas(doc, 'tile-detail-moss', 1),
    clover: artCanvas(doc, 'tile-detail-clover', 1),
    sand: artCanvas(doc, 'tile-detail-sand', 1),
    ash: artCanvas(doc, 'tile-detail-ash', 1),
    straw: artCanvas(doc, 'tile-detail-straw', 1),
    blossom: artCanvas(doc, 'tile-detail-blossom', 1),
    bunting: artCanvas(doc, 'tile-detail-bunting', 1),
    cobbleRing: artCanvas(doc, 'tile-detail-cobble-ring', 1),
  };
  cache.detailSet = [cache.detail.pebbles, cache.detail.dirt, cache.detail.leaves,
    cache.detail.twig, cache.detail.petals, cache.detail.shells, cache.detail.moss,
    cache.detail.clover, cache.detail.sand, cache.detail.ash, cache.detail.straw,
    cache.detail.blossom, cache.detail.bunting, cache.detail.cobbleRing].filter(Boolean);
  // Readability pass (2026-10-29): the CALM detail set for outdoor ground —
  // the confetti kinds (petals / blossom / bunting / cobbleRing) leave the
  // outdoor rotation; what remains is low-contrast ground texture only.
  cache.detailCalmSet = [cache.detail.pebbles, cache.detail.dirt, cache.detail.leaves,
    cache.detail.twig, cache.detail.shells, cache.detail.moss,
    cache.detail.clover, cache.detail.sand, cache.detail.ash, cache.detail.straw].filter(Boolean);
  // ---- Premium+ W5: light & shadow sets (LD-1/LD-2) ----
  cache.grassgroundVariants = ids(['tile-grassground', 'tile-grassground-2', 'tile-grassground-3', 'tile-grassground-4']);
  if (cache.grassgroundVariants.length) cache.grassground = cache.grassgroundVariants[0];
  cache.shadowE = artCanvas(doc, 'tile-shadow-e', 1);
  cache.shadowE2 = artCanvas(doc, 'tile-shadow-e2', 1);
  cache.shadowSE = artCanvas(doc, 'tile-shadow-se', 1);
  cache.shadowSE2 = artCanvas(doc, 'tile-shadow-se2', 1);
  cache.shadowScap = artCanvas(doc, 'tile-shadow-scap', 1);
  cache.shadowScap2 = artCanvas(doc, 'tile-shadow-scap2', 1);
  cache.shadowL = artCanvas(doc, 'tile-shadow-l', 1);
  cache.shadowL2 = artCanvas(doc, 'tile-shadow-l2', 1);
  cache.treeShadows = ids(['tile-shadow-tree-1', 'tile-shadow-tree-2', 'tile-shadow-tree-3',
    'tile-shadow-tree-4', 'tile-shadow-tree-5', 'tile-shadow-tree-6', 'tile-shadow-tree-7']);
  cache.shadowRock = artCanvas(doc, 'tile-shadow-rock', 1);
  cache.shadowProp = artCanvas(doc, 'tile-shadow-prop', 1);
  cache.doorMat = artCanvas(doc, 'tile-doormat', 1); // R2 lever 1: shared door signal
  cache.shadowBoulder = artCanvas(doc, 'tile-shadow-boulder', 1);
  cache.glowPools = ids(['tile-glowpool-1', 'tile-glowpool-2']);
  // Premium+ W5 round 3: canopy variant pairs + interior decor overlays.
  cache.canopyVariants = {};
  for (const id of ['pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
    'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar', 'indigo']) {
    cache.canopyVariants['tc-' + id] = ids(['tile-tc-' + id, 'tile-tc2-' + id]);
  }
  cache.decorSet = ids(['tile-decor-books', 'tile-decor-herb', 'tile-decor-cup', 'tile-decor-papers',
    'tile-decor-cushion', 'tile-decor-bottles', 'tile-decor-vase', 'tile-decor-shoes',
    'tile-decor-radio', 'tile-decor-cake', 'tile-decor-globe', 'tile-decor-typer',
    'tile-decor-fern', 'tile-decor-lamp', 'tile-decor-clock', 'tile-decor-basket']);
  // Premium+ W5 (TX-1): interior wall second variants, spread-hash picked.
  cache.wallVariants = {
    centerwall: ids(['tile-centerwall', 'tile-centerwall-2', 'tile-centerwall-3']),
    martwall: ids(['tile-martwall', 'tile-martwall-2']),
    housewall: ids(['tile-housewall', 'tile-housewall-2']),
    gymwallin: ids(['tile-gymwallin', 'tile-gymwallin-2']),
    labwall: ids(['tile-labwall', 'tile-labwall-2']),
    towerwall: ids(['tile-towerwall', 'tile-towerwall-2']),
    silphwall: ids(['tile-silphwall', 'tile-silphwall-2']),
    plantwall: ids(['tile-plantwall', 'tile-plantwall-2']),
  };
  // Night lit-window swaps (LD-2): day kind -> lit canvas. House unlit
  // reuses the shipped lit wall; the other 8 are W5 authored variants.
  cache.litMap = {
    'wall-house-unlit': artCanvas(doc, 'tile-wall-house-lit', 1),
    'wall-house-plain': artCanvas(doc, 'tile-wall-house-plain-lit', 1),
    'wall-center': artCanvas(doc, 'tile-wall-center-lit', 1),
    'wall-mart': artCanvas(doc, 'tile-wall-mart-lit', 1),
    'wall-gym': artCanvas(doc, 'tile-wall-gym-lit', 1),
    'wall-lab': artCanvas(doc, 'tile-wall-lab-lit', 1),
    'wall-lab-plain': artCanvas(doc, 'tile-wall-lab-plain-lit', 1),
    'wall-brick-plain': artCanvas(doc, 'tile-wall-brick-plain-lit', 1),
    'sign-center': artCanvas(doc, 'tile-sign-center-lit', 1),
  };
  // ---- Premium+ W6: floors, foundations, facades, door-open frames ----
  for (const k of W6_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of O1_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of J3_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of H3_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of H3B_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of S3_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  for (const k of S3B_FLOOR_KINDS) cache[k + 'Variants'] = ids(['tile-' + k]);
  cache.foundationVariants = ids(['tile-foundation-1', 'tile-foundation-2', 'tile-foundation-3']);
  // P-1 side walls: the SAME authored art rasterized through a palette
  // swap that darkens every hex by one full shade step (x0.72 — the
  // shipped palettes step at ~0.75/stone-step ratios). Deterministic,
  // no extra .pix, exactly the NPC palette-swap discipline.
  const shadeStep = (hex) => {
    const f = (v) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(v, v + 2), 16) * 0.72)));
    return '#' + [1, 3, 5].map((v) => f(v).toString(16).padStart(2, '0')).join('');
  };
  cache.facadeArt = {};
  for (const kind of FACADE_KIND_LIST) {
    const baseId = TILE_ART[kind];
    if (!baseId) continue;
    const a = materializeArt(baseId);
    if (!a) continue;
    const swap = {};
    for (const [ch, hex] of Object.entries(a.pal)) swap[ch] = shadeStep(hex);
    const upperId = baseId + '-upper';
    const upperA = materializeArt(upperId);
    cache.facadeArt[kind] = {
      base: artCanvas(doc, baseId, 1),
      side: artCanvas(doc, baseId, 1, false, swap),
      upper: upperA ? artCanvas(doc, upperId, 1) : null,
      sideUpper: upperA ? artCanvas(doc, upperId, 1, false, swap) : null,
    };
  }
  cache.doorOpen = {};
  for (const [kind, id] of Object.entries(DOOR_OPEN_ART)) {
    const cv = artCanvas(doc, id, 1);
    if (cv) cache.doorOpen[kind] = cv;
  }
  // Wave 2: ground-shadow strip laid on ground cells directly south of
  // a building, anchoring every structure.
  cache.shadowStrip = artCanvas(doc, 'tile-shadow', 1);
  // ---- Premium+ W7 (TX-6/TX-7): blends, foreground, atmosphere ----
  cache.blendTreeline = artCanvas(doc, 'tile-blend-treeline', 1);
  cache.blendArch = artCanvas(doc, 'tile-blend-arch', 1);
  cache.fgCanopy = ids(['tile-fg-canopy-oak', 'tile-fg-canopy-pine', 'tile-fg-canopy-elm', 'tile-fg-canopy-round']);
  cache.fgEaves = ids(['tile-fg-eave-a', 'tile-fg-eave-b']);
  cache.atmo = {
    warm: artCanvas(doc, 'tile-atmo-warm', 1),
    dust: artCanvas(doc, 'tile-atmo-dust', 1),
    coast: artCanvas(doc, 'tile-atmo-coast', 1),
    leaf: artCanvas(doc, 'tile-atmo-leaf', 1),
    sparkle: artCanvas(doc, 'tile-atmo-sparkle', 1),
  };
  return cache;
}

// ---- Premium+ W7 (TX-7): the foreground layer ----
// Facade kinds of TYPED buildings (Center / Mart / gym / lab) — their
// roof rows gain a foreground eave piece, drawn over the y-sorted
// character pass so eaves and canopies compose with LD-3.
export const TYPED_FACADE_KINDS = new Set(['wall-center', 'wall-mart', 'wall-gym',
  'wall-lab', 'wall-lab-plain', 'gym-ground', 'gym-rock', 'gym-water', 'gym-volt',
  'gym-leaf', 'gym-psy', 'gym-poison', 'gym-fire']);
// Pure foreground rule — shared by the scene render (overworld-systems
// sysRenderForeground) and the W7 census, so the measured coverage IS
// the shipped coverage. Returns the foreground CANVAS for a cell: a
// canopy piece for a forest-border cell (tree / town canopy whose
// south neighbour is not a tree), an eave piece for a typed facade
// cell standing under a roof/sign row, else null. Hash-driven only
// (PL-3): no RNG, no allocation — the return is a cached canvas.
export function foregroundFor(cache, kind, x, y, kindAt, mapId) {
  if (!cache || !kind) return null;
  // Kit towns: kit tiles are self-contained (canopy and facade pieces
  // carry their own overhang shading) — the authored fg canopy/eaves
  // never overlay them.
  if (mapId && cache.kitTowns && cache.kitTowns[mapId]) return null;
  const isTree = kind === 'tree' || kind.startsWith('tc-');
  if (isTree) {
    const s = kindAt(x, y + 1);
    if (s === 'tree' || (s && s.startsWith('tc-'))) return null; // interior of the forest — no border
    if (hashTileSpread(x, y, 141) >= 0.75) return null; // broken canopy line, not a wall of leaves
    const arr = cache.fgCanopy;
    if (!arr || !arr.length) return null;
    return arr[Math.floor(hashTileSpread(x, y, 143) * arr.length) % arr.length];
  }
  if (TYPED_FACADE_KINDS.has(kind)) {
    const n = kindAt(x, y - 1);
    if (!n || !(n.startsWith('roof-') || n.startsWith('sign-') || n.startsWith('tr-') || n.startsWith('th-'))) return null;
    const arr = cache.fgEaves;
    if (!arr || !arr.length) return null;
    return arr[((x % arr.length) + arr.length) % arr.length];
  }
  return null;
}

// ---- Premium+ W5 (LD-2): time-of-day tint (anchor trait P-3) ----
// Four phases derived from the SAME wall-hour source that drives the
// clock glyph (overworld renderClockGlyph) — one source of truth, the
// glyph and the tint can never disagree. The tint is a single flat
// overlay on the WORLD layer only (drawn by the scene after the world
// pass, before any HUD/canvas text; DOM HUD is never tinted by
// construction). Day is the reference capture (alpha 0 — no draw).
// Values tuned so a same-position town capture shifts >= 8% mean
// luminance and >= 6 deg mean hue between day and night on in-map
// pixels (measured in the W5 rig on the logical raster + blend).
export const PHASE_TINTS = {
  dawn: { color: '#f2cf9f', rgb: [242, 207, 159], alpha: 0.18 },
  day: { color: '#000000', rgb: [0, 0, 0], alpha: 0 },
  dusk: { color: '#c05a1c', rgb: [192, 90, 28], alpha: 0.24 },
  night: { color: '#1c2a55', rgb: [28, 42, 85], alpha: 0.38 },
};
export function phaseOfHour(h) {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function tileSprite(cache, kind, t) {
  const v = cache[kind];
  if (!v) return null;
  if (Array.isArray(v)) return v[Math.floor((t || 0) / 400) % v.length]; // water shimmer (6 frames, W3 medium cadence)
  return v;
}

// Premium+ W3 (AN-5): the animation clock. Cadence groups: fast 200ms,
// medium 400ms, slow 800ms. EVERY animated tile is phase-offset by its
// position hash — the frame index is (clock step + per-tile phase), so
// two tiles of the same family at different positions sit at different
// phases and nothing in the world pulses in unison. Hash/phase-driven
// only: no RNG, no per-frame allocation (pure arithmetic on the stack).
// t < 0 is the reduced-motion sentinel (main.mjs passes it when the
// Reduced Motion setting is on): every system freezes on frame 0.
export const CAD_FAST = 200, CAD_MED = 400, CAD_SLOW = 800;
export function animFrame(t, x, y, cadence, nFrames, salt) {
  if (!nFrames || nFrames <= 1 || t < 0) return 0;
  const phase = Math.floor(hashTileSpread(x, y, salt || 0) * nFrames) % nFrames;
  return (Math.floor(t / cadence) + phase) % nFrames;
}
function pickAnim(frames, t, x, y, cadence, salt) {
  if (!frames || !frames.length) return null;
  return frames[animFrame(t, x, y, cadence, frames.length, salt)] || frames[0];
}

// ---- Wave 4: nature & dungeon helpers ----
// Kind families for the Wave 4 sets (used for ground compositing under
// object tiles and for cave-context detection around rocks/boulders).
const CAVE_KINDS = new Set(['cavewall', 'cavefloor', 'caveboulder']);
const DUNGEON_WALLS = new Set(['cavewall', 'towerwall', 'silphwall', 'plantwall',
  // Premium+ W6 (TX-5): the sub-theme wall kinds cast the same strip.
  'icewall', 'iceface', 'stratwall', 'bannerwall', 'cerwall', 'panelwall']);
const FLOOR_VARIANTS = {
  grass: 'grassVariants', path: 'pathVariants', cavefloor: 'caveFloorVariants',
  towerfloor: 'towerFloorVariants', silphfloor: 'silphFloorVariants', plantfloor: 'plantFloorVariants',
  centerfloor: 'centerFloorVariants', martfloor: 'martFloorVariants',
  housefloor: 'houseFloorVariants', gymfloor: 'gymFloorVariants', labfloor: 'labFloorVariants',
};
for (const k of W6_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of O1_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of J3_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of H3_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of H3B_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of S3_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
for (const k of S3B_FLOOR_KINDS) FLOOR_VARIANTS[k] = k + 'Variants';
// Wave 5a: interior floor kinds are ground families of their own (a prop
// inside a Center stands on Center floor, never on grass or path), and
// interior walls cast the shared shadow strip onto the floor below.
const INTERIOR_FLOORS = new Set(['centerfloor', 'martfloor', 'housefloor', 'gymfloor', 'labfloor']);
const INTERIOR_WALLS = new Set(['centerwall', 'martwall', 'housewall', 'gymwallin', 'labwall', 'annewall', 'leaguewall',
  // Premium+ W6 (TX-4): wall-dressing tiles are wall class indoors.
  'dressposter', 'dressclock', 'dresscurtain', 'dressbanner', 'dresspicture',
  'dresspicture2', 'dresswindow', 'dressmirror', 'dresscalendar', 'dressmap', 'dresswreath']);
const PROP_KINDS = new Set(['counter', 'healmachine', 'pcdesk', 'bed', 'table',
  'chair', 'shelf', 'plant', 'martshelf', 'goods', 'podium', 'statue',
  'badgecase', 'labmachine', 'labtank', 'labdesk', 'cabinbed', 'cabintable',
  'porthole', 'slotmachine', 'throne', 'memorial', 'officedesk', 'sofa',
  'stool', 'rug', 'battlemat',
  // Premium+ W6 (TX-4/TX-5): the new prop + rug kinds.
  ...W6_PROP_KINDS, ...W6_RUG_KINDS,
  // Premium+ W7 (TX-6): dressing + gate/arch props.
  ...W7_PROP_KINDS,
  // Arc 1.5 Stage O1: Orange props composite over their ground too.
  ...O1_PROP_KINDS,
  // Arc 2 Stage J3a: Johto props composite over their ground too.
  ...J3_PROP_KINDS,
  // Arc 3 Stage H3a: Hoenn props composite over their ground too.
  ...H3_PROP_KINDS,
  // Arc 3 Stage H3b: Hoenn east props composite over their ground too.
  ...H3B_PROP_KINDS,
  // Arc 4 Stage S3a: Sinnoh props composite over their ground too.
  ...S3_PROP_KINDS,
  // Arc 4 Stage S3b: Sinnoh east/north props composite over their ground too.
  ...S3B_PROP_KINDS]);
export function groundFamilyOf(kind) {
  // Perfection Pass Stage 2 Gate 2 (G2): beach kinds stand on tropgrass,
  // psand kinds stand on path (props composite over the parent ground).
  if (kind && kind.startsWith('beach-')) return 'tropgrass';
  if (kind && kind.startsWith('psand-')) return 'path';
  if (kind && (W6_FLOOR_KINDS.includes(kind) || O1_FLOOR_KINDS.includes(kind) || J3_FLOOR_KINDS.includes(kind) || H3_FLOOR_KINDS.includes(kind) || H3B_FLOOR_KINDS.includes(kind) || S3_FLOOR_KINDS.includes(kind) || S3B_FLOOR_KINDS.includes(kind))) return kind; // W6/O1/J3/H3/H3B/S3/S3B floors are own families
  if (kind && (kind.startsWith('tg-') || kind.startsWith('tg2-'))) return kind; // W5: town ground is its own family
  if (kind && (kind.startsWith('tc-') || kind.startsWith('td-') || kind.startsWith('flora-'))) return 'grass';
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
  if (family.startsWith('tg-') || family.startsWith('tg2-')) return cache[family] || null; // W5 town ground underlay
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

// ---- Premium+ W7 (TX-7): per-biome atmosphere passes ----
// Five authored speckle overlays, one per biome class, composited by
// the resolver on ground/floor cells at a position-hash rate — they
// break the flat ground read (interior warmth, cave dust, coast
// brightness, forest dapple, highland clear-air) without a single
// per-frame overlay allocation: the pass is baked into the tile layer
// stack exactly like the W5 detail set. Classification is by map id.
const ATMO_DUST_MAPS = new Set(['moon1', 'moon2', 'rocktunnel', 'seafoam', 'victoryroad', 'ceruleancave']);
const ATMO_COAST_MAPS = new Set(['vermilion', 'cinnabar', 'cerulean', 'fuchsia', 'route19', 'route20', 'safari']);
const ATMO_SPARKLE_MAPS = new Set(['pewter', 'saffron', 'lavender', 'indigo']);
function atmoKeyFor(mapId) {
  if (!mapId) return null;
  if (ATMO_DUST_MAPS.has(mapId)) return 'dust';
  if (ATMO_COAST_MAPS.has(mapId)) return 'coast';
  if (ATMO_SPARKLE_MAPS.has(mapId)) return 'sparkle';
  if (mapId.startsWith('route') || mapId === 'viridian' || mapId === 'celadon' || mapId === 'pallet' || mapId === 'newisland') return 'leaf';
  return 'warm'; // every interior / dungeon-adjacent map: warmth
}

// ---- Gassasin kit towns (Phase 1) ----
// The kit layer stack for one cell of an opted-in town, or null when
// the kit does not cover the kind (the shipped resolver then composes
// the cell as usual — lamps, props and signs keep their authored art
// in a kit town). Buildings compose positionally from kit pieces:
// a roof row reads left/mid/right across its contiguous run (the
// landmark kind wears the dormer piece), a wall row reads plain-log
// at the run's west end and the window piece at its east end, and the
// door kind wears the kit door. Presentation only — no map data,
// warp, or collision is touched.
function kitTownLayers(cache, kind, x, y, kindAt, mapId) {
  const K = cache.kitTowns[mapId];
  const grassBase = pickVariant(K.grass, x, y, 13) || K.grass[0];
  const run = (kinds) => {
    let c = 0;
    while (kinds.has(kindAt(x - c - 1, y))) c++;
    let last = c;
    while (kinds.has(kindAt(x + (last - c) + 1, y))) last++;
    return [c, last];
  };
  if (kind === 'tg-' + mapId) return [grassBase];
  if (kind === 'tg2-' + mapId) return [pickVariant(K.path, x, y, 21) || K.path[0] || grassBase];
  if (kind === 'tc-' + mapId) return [grassBase, K.canopy].filter(Boolean);
  if (kind === 'td-' + mapId) return [grassBase, K.sign].filter(Boolean);
  if (kind === 'flora-' + mapId) return [K.flora || grassBase];
  if (kind === 'grass') return [K.tall || grassBase];
  if (kind === 'th-' + mapId) {
    const [c, last] = run(new Set(['th-' + mapId, 'tl-' + mapId]));
    return [c === 0 ? K.roofL : c === last ? K.roofR : K.roofM].filter(Boolean);
  }
  if (kind === 'tl-' + mapId) return [K.roofDormer || K.roofM].filter(Boolean);
  if (kind === 'tw-' + mapId) {
    const [c, last] = run(new Set(['tw-' + mapId, 'door-house']));
    return [c === last && last > 0 ? K.wallWindow : K.wallPlain].filter(Boolean);
  }
  if (kind === 'door-house') return [K.door].filter(Boolean);
  return null;
}

// Compose the layer stack for one map cell. kindAt(x, y) returns the tile
// KIND at a map position, or null off-map (off-map neighbours never raise
// a transition). t is the shared animation clock (water/foam stay in sync
// with tileSprite's 600ms frame step). Returns canvases in draw order.
export function resolveTileLayers(cache, kind, x, y, kindAt, t, phase, mapId) {
  const at = (dx, dy) => {
    const k = kindAt(x + dx, y + dy);
    return k == null ? kind : k;
  };
  const nb = { n: at(0, -1), e: at(1, 0), s: at(0, 1), w: at(-1, 0) };
  // Kit towns: the kit stack replaces the composed layers wholesale
  // for covered kinds (see kitTownLayers); uncovered kinds fall
  // through to the shipped composition below.
  if (mapId && cache.kitTowns && cache.kitTowns[mapId]) {
    const kl = kitTownLayers(cache, kind, x, y, kindAt, mapId);
    if (kl) return kl;
  }
  const tt = t || 0; // W3: t < 0 = reduced-motion freeze (animFrame -> 0)
  // Premium+ W5 (LD-2): time-of-day phase, threaded from the scene
  // (day is the reference; caves/interiors always resolve as day).
  const ph = phase || 'day';
  const night = ph === 'night';
  const duskNight = night || ph === 'dusk';
  // LD-1 directional cast shadows (light from the NW): besides the
  // shipped south strip, a building throws an EAST skirt on the cell to
  // its east and an SE corner on the cell to its south-east; L-caps and
  // strip caps close junctions. Ground cases call this after the strip.
  const pushSkirts = (layers) => {
    const wA = isArchKind(at(-1, 0)), nwA = isArchKind(at(-1, -1)), nA = isArchKind(nb.n);
    if (wA && cache.shadowE) layers.push(nwA && cache.shadowE2 ? cache.shadowE2 : cache.shadowE);
    else if (nwA && cache.shadowSE) layers.push(nA && cache.shadowSE2 ? cache.shadowSE2 : cache.shadowSE);
    if (nA && wA && cache.shadowL) layers.push(cache.shadowL);
    // Strip cap: this cell sits east of the strip's last cell (the cell
    // west has a building north of it; this one does not).
    if (!nA && isArchKind(at(-1, -1)) && cache.shadowScap) layers.push(cache.shadowScap);
  };
  // LD-2: lamp glow pools bleed onto the cells around a lamp at
  // dusk/night (the lamp cell itself gets the bright core, below).
  const pushLampGlow = (layers) => {
    if (!duskNight || !cache.glowPools || !cache.glowPools.length) return;
    if (nb.n === 'lamp' || nb.e === 'lamp' || nb.s === 'lamp' || nb.w === 'lamp') layers.push(cache.glowPools[0]);
  };
  // Premium+ W7 (TX-6): terrain-blend overlays — leaf litter where a
  // tree line meets ground, worn threshold stones where a building
  // meets ground (the last two unstitched terrain pairs of audit §11).
  const pushBlends = (layers) => {
    const nk = nb.n;
    if ((nk === 'tree' || (nk && nk.startsWith('tc-'))) && cache.blendTreeline) layers.push(cache.blendTreeline);
    else if (nk && isArchKind(nk) && cache.blendArch && hashTileSpread(x, y, 157) < 0.65) layers.push(cache.blendArch);
  };
  // Readability Round 2 (lever 1): a ground cell directly south of ANY
  // door kind wears the shared doormat — one consistent entrance signal
  // that no wall, path or lawn shares, indoors and out.
  // QA-fix refinement: a two-wide door assembly (door-*-l + door-*-r)
  // gets ONE mat, under its left half — paired mats read as window
  // dressing and diluted the cue (re-grade §2/§6).
  const pushDoorMat = (layers) => {
    if (!cache.doorMat || !isDoorKind(nb.n)) return;
    if (nb.n.endsWith('-r')) {
      const west = at(-1, -1);
      if (west && west.endsWith('-l') && DOOR_GROUP[west] && DOOR_GROUP[west] === DOOR_GROUP[nb.n]) return;
    }
    layers.push(cache.doorMat);
  };
  // Premium+ W7 (TX-7): the biome atmosphere pass for this map.
  const pushAtmo = (layers) => {
    if (!cache.atmo) return;
    const cv = cache.atmo[atmoKeyFor(mapId)];
    if (cv && hashTileSpread(x, y, 151) < 0.22) layers.push(cv); // readability pass: 0.5 -> 0.22 coverage
  };
  // TX-1: the 12-overlay detail set, spread-hash picked.
  // Readability pass (2026-10-29): outdoor ground passes the CALM set —
  // same mechanism, quieter vocabulary, lower rate (call sites).
  const pushDetail = (layers, rate, salt, set) => {
    const pool = set || cache.detailSet;
    if (!pool || !pool.length) return;
    if (hashTileSpread(x, y, salt) < rate) {
      const d = pool[Math.floor(hashTileSpread(x, y, salt + 1) * pool.length) % pool.length];
      if (d) layers.push(d);
    }
  };
  // ---- W5 prefix kinds: town identity + cave light sources ----
  if (kind.startsWith('tg-') || kind.startsWith('tg2-')) {
    // Town ground: the settlement's own street/meadow texture (walkable).
    const layers = [cache[kind] || pickVariant(cache.grassVariants, x, y, 13) || cache.grass];
    // Readability pass: sway overlays cover ~35% of ground cells, not all.
    const sway = hashTileSpread(x, y, 44) < 0.35
      ? pickAnim(hashTileSpread(x, y, 42) < 0.5 ? cache.grassSway.a : cache.grassSway.b, tt, x, y, CAD_SLOW, 41) : null;
    if (sway) layers.push(sway);
    pushLampGlow(layers);
    pushDetail(layers, 0.12, 17, cache.detailCalmSet);
    pushBlends(layers);
    pushAtmo(layers);
    if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    pushSkirts(layers);
    pushDoorMat(layers);
    // Perfection Pass Stage 1 (W2): tg<->path transition set — the same
    // edge-dirt treatment the grass family carries against path (corners
    // first, then sides), keyed on neighbours of kind 'path'. Town ground
    // is the edge-dirt art's second home; this ships the missing set for
    // every town-ground/path border game-wide.
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
  if (kind.startsWith('tc-') || kind.startsWith('td-')) {
    // Town canopy / dress: objects standing on the town ground.
    let ground = groundFamilyOf(nb.s);
    if (!ground) {
      const counts = {};
      for (const d of DIRS) { const f = groundFamilyOf(nb[d]); if (f) counts[f] = (counts[f] || 0) + 1; }
      ground = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'grass';
    }
    const layers = [];
    const base = groundBase(cache, ground, x, y);
    if (base) layers.push(base);
    // W5 LD-1: a building north/west casts strip + skirts onto the
    // ground beneath canopy/dress cells too.
    if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    pushSkirts(layers);
    if (kind.startsWith('tc-')) {
      const blob = cache.treeShadows && cache.treeShadows.length
        ? cache.treeShadows[treeVariantIndex(x, y, cache.treeShadows.length)] : null;
      if (blob) layers.push(blob); // LD-1: canopy shadow blob, 100% of tree cells
      // W5 round 3: hash-pick between the town's two canopy variants.
      const pair = (cache.canopyVariants && cache.canopyVariants[kind]) || [cache[kind]];
      const cv = pickVariantSpread(pair, x, y, 59) || cache[kind];
      if (cv) layers.push(cv);
    } else {
      if (cache.shadowProp) layers.push(cache.shadowProp);
      if (cache[kind]) layers.push(cache[kind]);
    }
    return layers.filter(Boolean);
  }
  if (kind.startsWith('tr-') || kind.startsWith('tl-') || kind.startsWith('th-')) {
    return [cache[kind]].filter(Boolean); // town roof / landmark facade / house roof (solid)
    // tw- house facades fall through to the switch: the TX-3 facade
    // branch gives them side-wall + upper-storey variants (P-1).
  }
  if (kind.startsWith('flora-')) {
    const layers = [cache[kind] || cache.grass];
    const sway = hashTileSpread(x, y, 44) < 0.35 ? pickAnim(cache.grassSway.a, tt, x, y, CAD_SLOW, 41) : null;
    if (sway) layers.push(sway);
    if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    pushSkirts(layers);
    return layers.filter(Boolean);
  }
  if (kind === 'cavecrystal' || kind === 'cavelantern' || kind === 'lavaglow') {
    return [cache[kind]].filter(Boolean); // LD-4 light sources (wall class)
  }
  if (kind === 'waterglow') {
    const layers = [cache[kind] || cache.cavefloor];
    if (DUNGEON_WALLS.has(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    return layers.filter(Boolean);
  }
  const frame = Math.floor(Math.max(0, tt) / 600);
  const nearWater = DIRS.some((d) => nb[d] === 'water');
  const pushPulse = (layers) => { // shore wet-pulse on land at the waterline
    if (!nearWater) return;
    const f = pickAnim(cache.shorePulse, tt, x, y, CAD_SLOW, 31);
    if (f) layers.push(f);
  };
  // Perfection Pass Stage 2 Gate 2 (G2): the tropgrass ground family gets
  // the grassground ground treatment (sway / pulse / detail / blends /
  // atmo / shadow / doormat) PLUS the edge-dirt set against path — until
  // now tropgrass fell through to the bare default tile, so every
  // tropgrass<->path border in the Orange Islands rendered untreated
  // even though the pair is classified FULL. Tropgrass occurs only in
  // the Orange Islands, so this branch is region-scoped in effect.
  const pushEdgeDirtVsPath = (layers) => {
    if (!cache.edgeDirt) return;
    // psand kinds are path material wearing its sand edge — the dirt
    // grammar treats them as path neighbours too.
    const isPathMat = (k) => k === 'path' || (k != null && k.startsWith('psand-'));
    const p = { n: isPathMat(nb.n), e: isPathMat(nb.e), s: isPathMat(nb.s), w: isPathMat(nb.w) };
    const used = new Set();
    for (const c of ['ne', 'se', 'sw', 'nw']) {
      if (p[c[0]] && p[c[1]] && cache.edgeDirt[c]) {
        layers.push(cache.edgeDirt[c]); used.add(c[0]); used.add(c[1]);
      }
    }
    for (const d of DIRS) {
      if (p[d] && !used.has(d) && cache.edgeDirt[d]) layers.push(cache.edgeDirt[d]);
    }
  };
  if (kind === 'tropgrass') {
    const layers = [cache[kind] || pickVariant(cache.grassVariants, x, y, 13) || cache.grass];
    const tgSway = hashTileSpread(x, y, 44) < 0.35
      ? pickAnim(hashTileSpread(x, y, 42) < 0.5 ? cache.grassSway.a : cache.grassSway.b, tt, x, y, CAD_SLOW, 41) : null;
    if (tgSway) layers.push(tgSway);
    pushPulse(layers);
    pushLampGlow(layers);
    pushDetail(layers, 0.10, 19, cache.detailCalmSet);
    pushBlends(layers);
    pushAtmo(layers);
    if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    pushSkirts(layers);
    pushDoorMat(layers);
    pushEdgeDirtVsPath(layers);
    return layers.filter(Boolean);
  }
  // G2: beach / psand transition kinds — the feather toward sand is baked
  // into their own tiles; this branch restores the ground extras the
  // parent kinds carry (pulse, glow, shadow, doormat) plus the remaining
  // open borders: edge-dirt against path on beach cells, wet edge against
  // water and hash-gated grass fringe against grass-family on psand cells
  // (mirroring the path branch's grammar).
  if (kind.startsWith('beach-') || kind.startsWith('psand-')) {
    const layers = [cache[kind]];
    pushPulse(layers);
    pushLampGlow(layers);
    if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
    pushSkirts(layers);
    pushDoorMat(layers);
    if (kind.startsWith('beach-')) {
      pushEdgeDirtVsPath(layers);
    } else {
      const grassy = (k) => k === 'grass' || k === 'grassground' || k === 'tropgrass' || k === 'flower' ||
        (k != null && (k.startsWith('beach-') || k.startsWith('tg-') || k.startsWith('tg2-')));
      for (const d of DIRS) {
        if (nb[d] === 'water' && cache.edgeWet && cache.edgeWet[d]) layers.push(cache.edgeWet[d]);
        else if (grassy(nb[d]) && cache.edgeGrass && cache.edgeGrass[d] &&
                 hashTile(x, y, 23 + d.charCodeAt(0)) < 0.7) layers.push(cache.edgeGrass[d]);
      }
    }
    return layers.filter(Boolean);
  }
  switch (kind) {
    case 'grassground': {
      // Premium+ W0: textured meadow ground — its own authored tile,
      // never a tall/encounter variant (isTallGrass applies to the
      // 'grass' kind only). Building shadow + path dirt-edge dressing
      // match the base-grass treatment so W5 re-dress blends in.
      // Premium+ W5 (TX-1): 4 meadow variants, spread-hash picked.
      const layers = [pickVariantSpread(cache.grassgroundVariants, x, y, 39) || cache.grassground || pickVariant(cache.grassVariants, x, y, 13) || cache.grass];
      const ggSway = hashTileSpread(x, y, 44) < 0.35
        ? pickAnim(hashTileSpread(x, y, 42) < 0.5 ? cache.grassSway.a : cache.grassSway.b, tt, x, y, CAD_SLOW, 41) : null;
      if (ggSway) layers.push(ggSway);
      pushPulse(layers);
      pushLampGlow(layers);
      pushDetail(layers, 0.12, 19, cache.detailCalmSet);
      pushBlends(layers);
      pushAtmo(layers);
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      pushSkirts(layers);
      pushDoorMat(layers);
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
        // W3: tall grass sways — 3 frames x 4 variants, medium cadence.
        const vi = Math.floor(hashTile(x, y, 12) * 4) % 4;
        const swaySet = (cache.tallSway && cache.tallSway[vi] && cache.tallSway[vi].length)
          ? cache.tallSway[vi] : null;
        layers.push(swaySet
          ? pickAnim(swaySet, tt, x, y, CAD_MED, 43)
          : (pickVariant(cache.tallVariants, x, y, 12) || cache.grass));
      } else {
        layers.push(pickVariant(cache.grassVariants, x, y, 13) || cache.grass);
        // W3: base-grass sway overlay (3f x 2 variants, slow cadence).
        const sway = hashTileSpread(x, y, 44) < 0.35
          ? pickAnim(hashTileSpread(x, y, 42) < 0.5 ? cache.grassSway.a : cache.grassSway.b, tt, x, y, CAD_SLOW, 41) : null;
        if (sway) layers.push(sway);
        pushPulse(layers);
        pushLampGlow(layers);
        pushDetail(layers, 0.12, 15, cache.detailCalmSet); // readability pass: was 0.30 full set
        pushBlends(layers);
        pushAtmo(layers);
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
      pushSkirts(layers); // W5 LD-1: east skirt + SE corner
      pushDoorMat(layers);
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
      pushPulse(layers);
      pushLampGlow(layers);
      // Wave 2: a building directly north anchors this cell with its
      // ground-shadow strip.
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      pushSkirts(layers); // W5 LD-1
      pushDoorMat(layers);
      pushDetail(layers, 0.10, 23, cache.detailCalmSet); // readability pass: was 0.20 full set
      pushBlends(layers);
      pushAtmo(layers);
      // Perfection Pass Stage 1 (W2): town ground (tg-/tg2-) joins the
      // grassy family — edgeGrass fringe now fires on path cells bordering
      // town ground, completing the tg<->path set on the path side.
      const grassy = (k) => k === 'grass' || k === 'grassground' || k === 'flower' || k === 'tree' || k === 'rock' || k === 'sign' || (k != null && (k.startsWith('tg-') || k.startsWith('tg2-')));
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
      // W3: water runs 6 frames on the medium cadence, foam 4 on fast —
      // both phase-offset per tile (the shipped pair shared one global
      // 600ms clock and pulsed in unison).
      const base = Array.isArray(cache.water) ? pickAnim(cache.water, tt, x, y, CAD_MED, 71) : cache.water;
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
        layers.push(pickAnim(cache.foamFrames, tt, x, y, CAD_FAST, 73));
      }
      return layers.filter(Boolean);
    }
    case 'cavewall': {
      // Strata walls by position hash; an exposed face (floor to the
      // south) wears the stalactite face. Perfection Pass Stage 2 Gate 0
      // (G0-5, standard B3): the face is DETERMINISTIC — 100% of exposed
      // faces render it (was hash-gated at <45%).
      const layers = [];
      if (nb.s === 'cavefloor' && cache.stalactite) layers.push(cache.stalactite);
      else layers.push(pickVariantSpread(cache.caveWallVariants, x, y, 51) || cache.cavewall);
      // W3: cave drip on exposed faces (slow cadence, phase-offset).
      if (nb.s === 'cavefloor' && hashTileSpread(x, y, 83) < 0.5) {
        const drip = pickAnim(cache.dripFrames, tt, x, y, CAD_SLOW, 83);
        if (drip) layers.push(drip);
      }
      return layers.filter(Boolean);
    }
    case 'cavefloor': case 'towerfloor': case 'silphfloor': case 'plantfloor':
    case 'icefloor': case 'frostfloor': case 'icepool': case 'moonmoss':
    case 'stratafloor': case 'crackedfloor': case 'cerfloor': case 'cerpool':
    case 'gratefloor': case 'cablefloor': {
      const layers = [groundBase(cache, kind, x, y)];
      // A dungeon wall directly north casts the shared shadow strip.
      if (DUNGEON_WALLS.has(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      if (hashTileSpread(x, y, 62) < 0.10 && cache.detail && cache.detail.pebbles) layers.push(cache.detail.pebbles);
      // W5 round 3: tower/silph/plant floors are interiors — decor too
      // (cavefloor keeps its pebbles + crystals only).
      if ((kind === 'towerfloor' || kind === 'silphfloor' || kind === 'plantfloor') && cache.decorSet && cache.decorSet.length && hashTile(x, y, 97) < 0.25) { // R2 lever 6: decor diet (was 0.75)
        const d = pickVariantSpread(cache.decorSet, x, y, 131);
        if (d) layers.push(d);
      }
      // W3: glow-crystal clusters pulse on cave floors near walls.
      if (kind === 'cavefloor' && DIRS.some((d) => nb[d] === 'cavewall') && hashTileSpread(x, y, 81) < 0.14) {
        const cry = pickAnim(cache.crystalFrames, tt, x, y, CAD_MED, 81);
        if (cry) layers.push(cry);
      }
      pushDoorMat(layers); // R2 QA-fix: cave/dungeon exits get the mat too (moon1)
      pushAtmo(layers); // W7: cave dust on dungeon floors
      return layers.filter(Boolean);
    }
    case 'centerfloor': case 'martfloor': case 'housefloor': case 'gymfloor': case 'labfloor': {
      // Wave 5a interior floors: own variant pair; an interior or
      // dungeon wall directly north casts the shared shadow strip.
      // Interiors are swept — no pebble detail indoors.
      // Premium+ W5 (TX-1): variants are 4 per family (bold patterns).
      const layers = [groundBase(cache, kind, x, y)];
      if ((INTERIOR_WALLS.has(nb.n) || DUNGEON_WALLS.has(nb.n)) && cache.shadowStrip) layers.push(cache.shadowStrip);
      // Readability Round 2 (QA fix): interior EXIT notches — gym-style
      // exits are bare floor cells IN the south wall row: raw kindAt
      // south of them is out of bounds (the at() wrapper masks this in
      // nb, so kindAt is asked directly), with a wall to at least one
      // side. They get the same doormat signal as an outdoor door.
      if (cache.doorMat && kindAt(x, y + 1) == null &&
        (INTERIOR_WALLS.has(nb.e) || INTERIOR_WALLS.has(nb.w) || DUNGEON_WALLS.has(nb.e) || DUNGEON_WALLS.has(nb.w))) {
        layers.push(cache.doorMat);
      }
      // Premium+ W5 round 3 (TX-1): hash-scattered decor overlays give
      // small interiors texture + colour depth (books, herb pots, cups,
      // papers, cushions, bottles, vases, shoes).
      // Readability Round 2 (lever 6): the scatter was the interiors'
      // worst congestion source — 75% of floor cells wore a random prop
      // fleck. Dieted to 20%: a floor reads as a floor again.
      if (cache.decorSet && cache.decorSet.length && hashTile(x, y, 97) < 0.20) {
        const d = pickVariantSpread(cache.decorSet, x, y, 131);
        if (d) layers.push(d);
      }
      pushDoorMat(layers); // R2 lever 1/6: interior exit doors get the mat too
      pushAtmo(layers); // W7: interior warmth on interior floors
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
    case 'stool': case 'rug': case 'battlemat':
    case 'medcabinet':
    case 'aquarium':
    case 'waitbench':
    case 'snackmachine':
    case 'freezer':
    case 'shelfend':
    case 'basketstack':
    case 'kitchen':
    case 'bath':
    case 'tvstand':
    case 'gamestation':
    case 'wardrobe':
    case 'tallbooks':
    case 'bigbed':
    case 'counterrun':
    case 'trainingbag':
    case 'weightrack':
    case 'trophycase':
    case 'column':
    case 'serverrack':
    case 'copier':
    case 'cooler':
    case 'workdesk':
    case 'candle':
    case 'urn':
    case 'shrine':
    case 'cushion2':
    case 'leaguefountain':
    case 'plantvat':
    case 'piano':
    case 'telescope':
    case 'fireplace':
    case 'sewingtable':
    case 'trainset':
    case 'easel':
    case 'cradle':
    case 'drum':
    case 'chessboard':
    case 'harp':
    case 'birdcage':
    case 'typewriter':
    case 'rockinghorse':
    case 'teacart':
    case 'spicerack':
    case 'quiltframe':
    case 'potterswheel':
    case 'starglobe':
    case 'bonsai':
    case 'violin':
    case 'boardgames':
    case 'knittingbasket':
    case 'toolbench':
    case 'herbdryer':
    case 'mapdesk':
    case 'grandclock':
    case 'rockpress':
    case 'stonebell':
    case 'miningcart':
    case 'poolblock':
    case 'lifering':
    case 'divingtank':
    case 'coil':
    case 'batterypack':
    case 'switchboard':
    case 'leafplanter':
    case 'seedvault':
    case 'vinepost':
    case 'psypod':
    case 'crystalball':
    case 'focuslamp':
    case 'venomvat':
    case 'thornpost':
    case 'gascanister':
    case 'forge':
    case 'coalscuttle':
    case 'firewood':
    case 'sandcrate':
    case 'fossildisplay':
    case 'sandcolumn':
    case 'rug2':
    case 'rug3':
    case 'redcarpet':
    case 'iceboulder':
    case 'frostrock':
    case 'icecrystal':
    case 'shroomglow':
    case 'shroomcap':
    case 'crystalcluster':
    case 'starrock':
    case 'supportbeam':
    case 'lanternpost':
    case 'rubble':
    case 'torchpost':
    case 'cercrystal':
    case 'cershard':
    case 'tombstone':
    case 'pipecluster':
    // Premium+ W7 (TX-6): dressing + gate/arch props composite the same way.
    case 'bench': case 'planter': case 'crates': case 'barrel':
    case 'signpost': case 'well': case 'postbox': case 'bikestand':
    case 'stall': case 'haycart': case 'sundial': case 'birdbath':
    case 'tub': case 'sacks': case 'pottedtree': case 'waterpump':
    case 'gatepost': case 'gatearch': case 'routearch': case 'vinearch': {
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
      // W5 LD-1: a building north/west casts strip + skirts onto the
      // ground beneath object cells too.
      if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
      pushSkirts(layers);
      // Premium+ W5 (LD-1): every object class casts — canopy blob under
      // trees, contact shadow under rocks/boulders/props/dressing.
      if (kind === 'tree') {
        const blob = cache.treeShadows && cache.treeShadows.length
          ? cache.treeShadows[treeVariantIndex(x, y, cache.treeShadows.length)] : null;
        if (blob) layers.push(blob);
      } else if (kind === 'rock' || kind === 'caveboulder') {
        if (cache.shadowRock) layers.push(cache.shadowRock);
      } else if (kind === 'lamp') {
        if (duskNight && cache.glowPools && cache.glowPools[1]) layers.push(cache.glowPools[1]); // LD-2 core pool
      } else if (kind !== 'rug' && kind !== 'battlemat' && kind !== 'rug2' && kind !== 'rug3' && kind !== 'redcarpet' && cache.shadowProp) {
        layers.push(cache.shadowProp);
      }
      if (kind === 'flower') {
        // W3: flowers sway — the shipped variant is frame 1, the sway
        // delta is frame 2 (medium cadence, per-tile phase).
        const fv = pickVariant(cache.flowerVariants, x, y, 31) || cache.flower;
        const fvi = cache.flowerVariants ? cache.flowerVariants.indexOf(fv) : -1;
        const swayF = (fvi >= 0 && cache.flowerSway) ? cache.flowerSway[fvi] : null;
        // Readability pass: only ~25% of flower cells sway; the rest sit still.
        const fi = (swayF && hashTileSpread(x, y, 49) < 0.25) ? animFrame(tt, x, y, CAD_MED, 2, 47) : 0;
        layers.push(fi === 1 && swayF ? swayF : fv);
      }
      else if (kind === 'tree') {
        // W3: canopy sway — frame 2 delta per variant (slow cadence).
        const tv = cache.treeVariants;
        const baseTree = tv && tv.length ? tv[treeVariantIndex(x, y, tv.length)] : cache.tree;
        const ti = tv ? tv.indexOf(baseTree) : -1;
        const swayT = (ti >= 0 && cache.treeSway) ? cache.treeSway[ti] : null;
        // Readability pass: only ~30% of trees sway; a still forest reads calm.
        const tfi = (swayT && hashTileSpread(x, y, 55) < 0.30) ? animFrame(tt, x, y, CAD_SLOW, 2, 53) : 0;
        layers.push(tfi === 1 && swayT ? swayT : baseTree);
      } else if (kind === 'lamp') {
        // W3: lamp flicker, fast cadence.
        layers.push(pickAnim(cache.lampFrames, tt, x, y, CAD_FAST, 57) || cache.lamp);
      } else if (cache.propFrames && cache.propFrames[kind] && cache.propFrames[kind].length) {
        // W3: animated props — heal/lab/porthole (medium), plant sway +
        // shelf glint (slow), machine/screen blink family (fast).
        const cad = (kind === 'plant' || kind === 'shelf') ? CAD_SLOW
          : (kind === 'labmachine' || kind === 'slotmachine' || kind === 'pcdesk') ? CAD_FAST : CAD_MED;
        layers.push(pickAnim(cache.propFrames[kind], tt, x, y, cad, 61) || cache[kind]);
      } else if (kind === 'rock') {
        const cave = ground === 'cavefloor' || DIRS.some((d) => CAVE_KINDS.has(nb[d]));
        layers.push(boulderCanvasFor(cache, x, y, cave));
      } else if (kind === 'caveboulder') {
        layers.push(boulderCanvasFor(cache, x, y, true));
      } else if (cache[kind]) layers.push(cache[kind]);
      return layers.filter(Boolean);
    }
    default: {
      // Premium+ W5 (LD-2): at night, house/typed-building windows
      // render their lit variants (100% of window kinds with a lit
      // counterpart in cache.litMap).
      if (night && cache.litMap && cache.litMap[kind]) return [cache.litMap[kind]];
      // Premium+ W6 (TX-3, P-1/P-4): facade runs — edge cells render
      // as side walls one full shade step darker; cells standing over
      // a same-group facade/door render the upper-storey variant.
      if (cache.facadeArt && cache.facadeArt[kind]) {
        const grp = FACADE_GROUPS[kind];
        const inGrp = (k) => !!k && (FACADE_GROUPS[k] === grp || DOOR_GROUP[k] === grp);
        const fa = cache.facadeArt[kind];
        const upper = inGrp(nb.s);
        const side = !inGrp(nb.w) || !inGrp(nb.e);
        const cv = upper
          ? (side ? (fa.sideUpper || fa.side) : (fa.upper || fa.base))
          : (side && fa.side ? fa.side : fa.base);
        return [cv].filter(Boolean);
      }
      // Premium+ W6 (TX-3): entrance steps pick a foundation variant;
      // a building directly north anchors the step with its strip.
      if (kind === 'step' && cache.foundationVariants && cache.foundationVariants.length) {
        const layers = [];
        if (isArchKind(nb.n) && cache.shadowStrip) layers.push(cache.shadowStrip);
        layers.push(pickVariantSpread(cache.foundationVariants, x, y, 77) || cache.step);
        return layers.filter(Boolean);
      }
      // W5 TX-1: interior walls pick between their two variants.
      if (cache.wallVariants && cache.wallVariants[kind] && cache.wallVariants[kind].length > 1) {
        return [pickVariantSpread(cache.wallVariants[kind], x, y, 71) || cache[kind]].filter(Boolean);
      }
      const v = cache[kind];
      if (!v) return [];
      // W5 round 3 (TX-1): interior floors get hash-scattered decor
      // overlays (books, herb pots, cups, papers, cushions, bottles,
      // vases, shoes) — texture + colour depth for small interiors.
      if (cache.decorSet && cache.decorSet.length &&
        ['centerfloor', 'martfloor', 'housefloor', 'gymfloor', 'labfloor',
         'towerfloor', 'silphfloor', 'plantfloor'].includes(kind) &&
        hashTile(x, y, 97) < 0.25) { // R2 lever 6: decor diet (was 0.75)
        const d = pickVariantSpread(cache.decorSet, x, y, 131);
        if (d) return [v, d];
      }
      if (Array.isArray(v)) return [v[frame % v.length]];
      // W3: chimney smoke — 3 frames x 2 colourways (colourway by tile
      // hash), slow cadence, drawn over the chimney cell.
      if (kind.indexOf('chimney') >= 0) {
        const set = hashTileSpread(x, y, 67) < 0.5 ? cache.smokeGrey : cache.smokeWarm;
        const smoke = pickAnim(set, tt, x, y, CAD_SLOW, 67);
        return smoke ? [v, smoke] : [v];
      }
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
// Premium+ W2 (TR-1): trainer-CLASS figures for the generic roster.
// Every trainer definition in the game carries a class in its title
// ('Youngster', 'Bug Catcher', 'Jr. Trainer'...); the named 16 above
// keep their own sprites, and every other id resolves to one of the 14
// authored class figures (pix/battle/trainer-<kind>-battle.pix) by
// title keyword, then name keyword, then a youngster default — so
// 104/104 trainer ids present a human figure in the intro (the W2
// coverage audit enumerates every trainer table to prove it). Duo
// battles keep their named resolution above (rue/cole).
const TRAINER_CLASS_ART = {
  youngster: 'trainer-youngster-battle', lass: 'trainer-lass-battle',
  bugcatcher: 'trainer-bugcatcher-battle', camper: 'trainer-camper-battle',
  hiker: 'trainer-hiker-battle', swimmer: 'trainer-swimmer-battle',
  gent: 'trainer-gent-battle', beauty: 'trainer-beauty-battle',
  psychic: 'trainer-psychic-battle', acetrainer: 'trainer-acetrainer-battle',
  fisher: 'trainer-fisher-battle', biker: 'trainer-biker-battle',
  grunt: 'trainer-grunt-battle', engineer: 'trainer-engineer-battle',
};
const TRAINER_CLASS_BY_TITLE = [
  ['youngster', 'youngster'], ['lass', 'lass'], ['bug catcher', 'bugcatcher'],
  ['camper', 'camper'], ['hiker', 'hiker'], ['swimmer', 'swimmer'],
  ['gentleman', 'gent'], ['beauty', 'beauty'], ['psychic', 'psychic'],
  ['ace trainer', 'acetrainer'], ['cooltrainer', 'acetrainer'],
  ['jr. trainer', 'acetrainer'], ['jr trainer', 'acetrainer'],
  ['trainer', 'acetrainer'], ['fisherman', 'fisher'], ['fisher', 'fisher'],
  ['biker', 'biker'], ['grunt', 'grunt'], ['rocket admin', 'grunt'],
  ['engineer', 'engineer'], ['tamer', 'hiker'], ['burglar', 'biker'],
  ['karate', 'acetrainer'], ['gamer', 'youngster'],
];
// Which battle-art kind a trainer presents as: a TRAINER_BATTLE_ART
// key for the named cast, else a TRAINER_CLASS_ART key. Pure (no doc)
// so audits can enumerate coverage without a canvas.
export function trainerArtKind(trainer) {
  if (!trainer) return null;
  const name = String(trainer.name || '').toLowerCase();
  const id = String(trainer.id || '').toLowerCase();
  const title = String(trainer.title || '').toLowerCase();
  let kind = TRAINER_BATTLE_IDS[id] || TRAINER_BATTLE_NAMES[name] || null;
  if (!kind && (name === 'gary' || id.startsWith('gary'))) {
    kind = (id === 'gary_champion' || title.includes('champion')) ? 'garychamp' : 'gary';
  }
  if (kind) return { named: kind };
  for (const [needle, cls] of TRAINER_CLASS_BY_TITLE) {
    if (title.includes(needle)) return { cls };
  }
  // Name-keyword fallback for the title-less definitions (maps3/4
  // route trainers): their ids carry the class (r3_lass, moon_grunt...).
  const hay = id + ' ' + name;
  for (const [needle, cls] of TRAINER_CLASS_BY_TITLE) {
    if (hay.includes(needle.replace(/[^a-z]/g, ''))) return { cls };
  }
  if (hay.includes('lass')) return { cls: 'lass' };
  if (hay.includes('bug')) return { cls: 'bugcatcher' };
  if (hay.includes('grunt')) return { cls: 'grunt' };
  if (hay.includes('camper')) return { cls: 'camper' };
  if (hay.includes('gamer')) return { cls: 'youngster' };
  return { cls: 'youngster' };
}
export function trainerBattleArt(doc, trainer) {
  const res = trainerArtKind(trainer);
  if (!res) return null;
  if (res.named) return artCanvas(doc, TRAINER_BATTLE_ART[res.named], 1);
  return artCanvas(doc, TRAINER_CLASS_ART[res.cls], 1);
}
// Premium+ W2 (TR-2/TR-4): pose variants of the same figure — the
// throw pose (intro send-out) and the defeat pose (victory dialogue),
// authored as .deltapix over every named + class figure. Returns null
// when a figure has no such delta (the base figure is drawn instead).
export function trainerPoseArt(doc, trainer, pose) {
  const res = trainerArtKind(trainer);
  if (!res) return null;
  const base = res.named ? TRAINER_BATTLE_ART[res.named] : TRAINER_CLASS_ART[res.cls];
  return artCanvas(doc, base + '-' + pose, 1);
}
export function playerPoseArt(doc, pose) {
  return artCanvas(doc, 'ash-battle-back-' + pose, 1);
}
export function playerBattleBackArt(doc) {
  return artCanvas(doc, 'ash-battle-back', 1);
}

// Premium+ W1 (FX-5): per-ball battle sprites — 6 authored 16x16 .pix
// balls (pix/ui/ball-*.pix), one per ball id in BALLS plus the GS Ball.
// Returns the rasterized canvas or null when unavailable (headless /
// minimal doc), in which case battle.mjs falls back to its procedural
// rect rendering of the same palettes. `open` draws the burst-open
// variant used on catch break-out (top hemisphere lifted + tilted is
// faked by the caller via two half draws; the base sprite is closed).
export function ballBattleArt(doc, ballId) {
  if (!doc || !ballId) return null;
  return artCanvas(doc, 'ball-' + ballId, 1);
}
