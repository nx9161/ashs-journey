// build-kit-art.mjs — Gassasin kit adoption pipeline (Phase 1, 2026-11-11).
// Slices the CC-BY 3.0 tileset sheet + character frames in assets/kit/
// into ART-format entries ({ w, h, pal, rows }) written to
// assets/sprites/kit-art-data.mjs, so kit art rides the exact rails of
// the shipped art system (artCanvas rasterizer, palette swaps, seasonal
// grades). Regenerate: node assets/sprites/tools/build-kit-art.mjs
// (deterministic; zero-dependency — PNG decode via tools/png.mjs).
//
// License: tileset + character by Damian Gasinski aka Gassasin,
// CC-BY 3.0 — see docs/THIRD-PARTY-ART.md. Credit ships in the game's
// Legal/credits screen (src/game/title.mjs DISCLAIMER_CREDITS).
//
// Slice notes (measured on the sheet, 2026-11-11): the sheet's clean
// tile area is the top band + the cabin parts in the mid band. The
// cabin FRONTS are drawn off the 16px grid (door ~18px wide at an 8px
// offset, window ~20px), so door/window tiles are center-crops of the
// front pieces — the crop keeps the full door panel + knob and the
// full window pane; the outer frame rails sit at the crop edges. The
// composed sample scenes at the sheet's bottom were NOT sliced (they
// carry neighbour artifacts by construction).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SHEET = decodePng(fs.readFileSync(path.join(ROOT, 'assets', 'kit', 'gassasin-16x16.png')));

const KEY = (r, g, b, a) => a < 128 || (r > 200 && g < 80 && b > 200); // magenta = transparency key
function px(img, x, y) {
  const o = (y * img.w + x) * 4;
  return [img.rgba[o], img.rgba[o + 1], img.rgba[o + 2], img.rgba[o + 3]];
}
const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// Extract a w*h rect from an image as a color grid (null = transparent).
// keyOut: hex colors additionally treated as transparent (the sign
// tile ships with grass baked around the post; the grass greens key
// out so the sign composites over the town ground like our own td art).
function extract(img, x, y, w, h, keyOut) {
  const grid = [];
  for (let j = 0; j < h; j++) {
    const row = [];
    for (let i = 0; i < w; i++) {
      const [r, g, b, a] = px(img, x + i, y + j);
      if (KEY(r, g, b, a) || (keyOut && keyOut.has(hex(r, g, b)))) row.push(null);
      else row.push(hex(r, g, b));
    }
    grid.push(row);
  }
  return grid;
}

// Pad a 16x16 character frame onto a 16x32 canvas, bottom-anchored —
// the overworld sprite format (ash/NPC frames are all 16x32; the kit
// character is 16x16, drawn standing on the tile's lower half).
function padChar(grid) {
  const out = Array.from({ length: 16 }, () => Array(16).fill(null));
  return out.concat(grid);
}

// B2-G2 discipline: <=16 colors per entry. Over-limit colors fold to
// the nearest kept color (frequency-first, deterministic).
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+?@^~';
function toEntry(grid, forcedKeys) {
  const freq = new Map();
  for (const row of grid) for (const c of row) if (c) freq.set(c, (freq.get(c) || 0) + 1);
  let colors = [...freq.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([c]) => c);
  if (colors.length > 16) {
    const keep = colors.slice(0, 16);
    const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const fold = new Map();
    for (const c of colors.slice(16)) {
      let best = keep[0], bd = 1e9;
      for (const k of keep) {
        const [r1, g1, b1] = rgb(c), [r2, g2, b2] = rgb(k);
        const d = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
        if (d < bd) { bd = d; best = k; }
      }
      fold.set(c, best);
    }
    colors = keep;
    grid = grid.map((row) => row.map((c) => (c && fold.get(c)) || c));
  }
  const pal = {}, keyOf = new Map();
  colors.forEach((c, i) => {
    const k = (forcedKeys && forcedKeys.get(c)) || CHARS[i];
    pal[k] = c; keyOf.set(c, k);
  });
  const rows = grid.map((row) => row.map((c) => (c ? keyOf.get(c) : '.')).join(''));
  return { w: grid[0].length, h: grid.length, pal, rows };
}

// ---- tileset slices (sheet pixel coords, all 16x16) ----
const GRASS_GREENS = new Set(['#008100', '#003f00', '#64e53c']);
const TILES = {
  'kit-grass-1': [0, 0], 'kit-grass-2': [16, 0], 'kit-grass-3': [32, 0],
  'kit-tallgrass': [16, 16], 'kit-flora': [0, 16],
  'kit-path-1': [64, 16], 'kit-path-2': [80, 16],
  'kit-canopy': [124, 12],
  'kit-roof-l': [88, 196], 'kit-roof-m': [120, 196], 'kit-roof-r': [168, 196],
  'kit-roof-dormer': [136, 190],
  'kit-wall-plain': [160, 216],
  // Cabin-front center-crops (see header note): the door (x 99-113)
  // and the window (pane x 117-131, frame to ~133) sit off-grid; the
  // crops center on each motif — full door panel + knob, full pane.
  'kit-door': [98, 228], 'kit-wall-window': [115, 227],
};
const out = {};
for (const [id, [x, y]] of Object.entries(TILES)) out[id] = toEntry(extract(SHEET, x, y, 16, 16));
out['kit-sign'] = toEntry(extract(SHEET, 48, 16, 16, 16, GRASS_GREENS));
// Wave A: the 2-wide cabin entrances (Saffron's dojo, Fuchsia's safari
// gate, Cinnabar's mansion) wear French doors — the kit door pairs with
// its own horizontal mirror, latches meeting at the center post. The
// mirror is derived from the same slice (same palette, still <=16).
out['kit-door-r'] = toEntry(extract(SHEET, 98, 228, 16, 16).map((row) => row.slice().reverse()));

// ---- character frames ----
// Semantic palette keys so the NPC palette-swap machinery (NPC_SWAP_KEYS:
// S skin / H hair / J shirt / P pants) recolors instances exactly as it
// does for our own cast — the player wears the authored kit colors;
// Gary (Pallet) wears his data palette (blue shirt, dark pants).
const CHAR_KEYS = new Map([
  ['#f28e59', 'S'], // skin
  ['#3b2400', 'H'], // hair (main)
  ['#8d5500', 'h'], // hair shade / wood brown
  ['#a03e00', 'a'], // hair accent
  ['#00788a', 'J'], // jacket (main)
  ['#00334e', 'j'], // jacket shade
  ['#001774', 'P'], // pants
  ['#5e0013', 'B'], // shoes
  ['#000000', 'O'], // outline
  ['#b9bbb3', 'W'], ['#696b63', 'g'],
]);
const CHAR_FILES = {
  'kit-char-down-idle': ['Idle', 'Untitled-0'],
  'kit-char-down-walk': ['WalkDown', 'Untitled-2'],
  'kit-char-up-walk': ['WalkUp', 'Untitled-2'],
  'kit-char-left-walk': ['WalkLeft', 'Untitled-3'],
  'kit-char-right-walk': ['WalkRight', 'Untitled-3'],
};
for (const [prefix, [dir, base]] of Object.entries(CHAR_FILES)) {
  for (let i = 0; i < 4; i++) {
    const img = decodePng(fs.readFileSync(path.join(ROOT, 'assets', 'kit', 'character', dir, `${base}_${i}.png`)));
    out[`${prefix}-${i + 1}`] = toEntry(padChar(extract(img, 0, 0, 16, 16)), CHAR_KEYS);
  }
}

let data = '// kit-art-data.mjs — GENERATED by assets/sprites/tools/build-kit-art.mjs. Do not hand-edit.\n';
data += '// Regenerate: node assets/sprites/tools/build-kit-art.mjs (deterministic).\n';
data += '// Art: Damian Gasinski aka Gassasin, CC-BY 3.0 (docs/THIRD-PARTY-ART.md).\n';
data += 'export const KIT_ART = {\n';
for (const id of Object.keys(out).sort()) {
  const e = out[id];
  data += `  ${JSON.stringify(id)}: { w: ${e.w}, h: ${e.h}, pal: ${JSON.stringify(e.pal)}, rows: [\n`;
  for (const row of e.rows) data += `    ${JSON.stringify(row)},\n`;
  data += '  ] },\n';
}
data += '};\n';
fs.writeFileSync(path.join(ROOT, 'assets', 'sprites', 'kit-art-data.mjs'), data);
console.log(`build-kit-art: ${Object.keys(out).length} entries -> assets/sprites/kit-art-data.mjs`);
for (const id of Object.keys(out).sort()) {
  const e = out[id];
  console.log(`  ${id}: ${e.w}x${e.h}, ${Object.keys(e.pal).length} colors`);
}
