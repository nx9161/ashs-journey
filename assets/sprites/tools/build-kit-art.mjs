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
const GRIDS = {};
for (const [id, [x, y]] of Object.entries(TILES)) { GRIDS[id] = extract(SHEET, x, y, 16, 16); out[id] = toEntry(GRIDS[id]); }
out['kit-sign'] = toEntry(extract(SHEET, 48, 16, 16, 16, GRASS_GREENS));

// ---- Wave H: the kit's dirt-path EDGE family + derived variants ----
// The sheet's composed dirt blob at cells (6..8, 8..10) is a complete
// 3x3 dirt-on-grass autotile set: corners, straight edges, center
// (the two flat interiors were sliced earlier as kit-path-1/2 from
// the top band). Entry ids are keyed by GRASS side(s) in n,e,s,w
// order — the same key the engine's tg2 autotile branch computes.
// The blob lacks 1-wide runs, end caps and the isolated cell; those
// are composed pixel-wise from the blob's own edge masks — kit
// pixels only, arranged originally (the Wave C derived-tile
// precedent: kit-door-r / kit-door-open). Grass vs dirt classifies
// by channel dominance (kit grass greens have G > R; dirt browns
// have R > G).
const blobAt = (cx, cy) => extract(SHEET, cx * 16, cy * 16, 16, 16);
const BLOB = { nw: blobAt(6, 8), n: blobAt(7, 8), ne: blobAt(8, 8), w: blobAt(6, 9), e: blobAt(8, 9), sw: blobAt(6, 10), s: blobAt(7, 10), se: blobAt(8, 10) };
const isGrassPx = (c) => { if (!c) return false; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16); return g > r && g >= b; };
const dirtAt = (grid, x, y) => { const c = grid[y][x]; return c !== null && !isGrassPx(c); };
// The grass margins are TRANSPARENT, never baked: the engine
// composites each edge tile over the town's own season-graded grass
// (kitTownLayers returns [grassBase, edge]), so the blend follows
// the town palette in every season — the kit-sign key-out precedent,
// generalized. Baked grass would freeze one season's green into the
// path family (first exemplar render, 2026-11-12: summer-green lips
// on autumn ground — rejected on sight).
const clearGrass = (grid) => grid.map((row) => row.map((c) => (c && isGrassPx(c)) ? null : c));
const BLOB_IDS = { n: BLOB.n, e: BLOB.e, s: BLOB.s, w: BLOB.w, ne: BLOB.ne, nw: BLOB.nw, es: BLOB.se, sw: BLOB.sw };
for (const [k, g] of Object.entries(BLOB_IDS)) out[`kit-path-${k}`] = toEntry(clearGrass(g));
// Derived variants are synthesized from the blob's BOUNDARY PROFILES
// (grass depth per row/column of each straight edge), filled with the
// blob center's own dirt. A pixel-mask AND of the source tiles holes
// out wherever two boundaries wobble apart (first exemplar render:
// stepping-stone lanes); profiles guarantee a continuous ribbon with
// the kit's own wavy edge shapes. Depths on opposed sides are capped
// at 7 so a run always keeps its center 2px.
const profDepth = (grid, side) => {
  const d = [];
  if (side === 'w') for (let y = 0; y < 16; y++) { let x = 0; while (x < 16 && !dirtAt(grid, x, y)) x++; d.push(x); }
  if (side === 'e') for (let y = 0; y < 16; y++) { let x = 15; while (x >= 0 && !dirtAt(grid, x, y)) x--; d.push(15 - x); }
  if (side === 'n') for (let x = 0; x < 16; x++) { let y = 0; while (y < 16 && !dirtAt(grid, x, y)) y++; d.push(y); }
  if (side === 's') for (let x = 0; x < 16; x++) { let y = 15; while (y >= 0 && !dirtAt(grid, x, y)) y--; d.push(15 - y); }
  return d;
};
const synthPath = (grassSides) => {
  const fill = blobAt(7, 9); // the blob's own center dirt
  const has = (s) => grassSides.includes(s);
  let dN = has('n') ? profDepth(BLOB.n, 'n') : null;
  let dS = has('s') ? profDepth(BLOB.s, 's') : null;
  let dW = has('w') ? profDepth(BLOB.w, 'w') : null;
  let dE = has('e') ? profDepth(BLOB.e, 'e') : null;
  if (dN && dS) { dN = dN.map((v) => Math.min(v, 7)); dS = dS.map((v) => Math.min(v, 7)); }
  if (dW && dE) { dW = dW.map((v) => Math.min(v, 7)); dE = dE.map((v) => Math.min(v, 7)); }
  const out16 = [];
  for (let y = 0; y < 16; y++) { const row = [];
    for (let x = 0; x < 16; x++) {
      const dirt = (!dN || y >= dN[x]) && (!dS || y <= 15 - dS[x]) && (!dW || x >= dW[y]) && (!dE || x <= 15 - dE[y]);
      row.push(dirt ? fill[y][x] : null);
    } out16.push(row); }
  return out16;
};
out['kit-path-ew'] = toEntry(synthPath('ew'));     // 1-wide vertical run (grass E+W)
out['kit-path-ns'] = toEntry(synthPath('ns'));     // 1-wide horizontal run (grass N+S)
out['kit-path-esw'] = toEntry(synthPath('esw'));   // end cap: fabric north only
out['kit-path-new'] = toEntry(synthPath('new'));   // end cap: fabric south only
out['kit-path-nsw'] = toEntry(synthPath('nsw'));   // end cap: fabric east only
out['kit-path-nes'] = toEntry(synthPath('nes'));   // end cap: fabric west only
out['kit-path-nesw'] = toEntry(synthPath('nesw')); // isolated cell

// ---- Wave C: interiors (the sheet's top-band room set) ----
// Single-cell motifs sliced from the composed room scene; every pick
// is a complete object in its 16x16 cell (the gate's kit canvas law:
// tiles 16x16, only character frames 16x32). Chair and plant carry
// the room's plank floor behind them — the floor hexes key out so
// they composite over the live kit floor like our own props.
const FLOOR_HEXES = new Set(['#8d5500', '#3b2400', '#e6ad27']); // the sheet's plank browns
out['kit-floor-1'] = toEntry(extract(SHEET, 224, 96, 16, 16));
out['kit-floor-2'] = toEntry(extract(SHEET, 224, 112, 16, 16));
out['kit-rug'] = toEntry(extract(SHEET, 200, 96, 16, 16)); // purple diamond rug, center crop
out['kit-rug2'] = toEntry(extract(SHEET, 128, 48, 16, 16)); // pink heart rug
out['kit-bed'] = toEntry(extract(SHEET, 176, 80, 16, 16)); // bed head + blanket top (kit tiles are 16x16 by gate law)
out['kit-table'] = toEntry(extract(SHEET, 176, 112, 16, 16));
out['kit-chair'] = toEntry(extract(SHEET, 240, 96, 16, 16, FLOOR_HEXES));
out['kit-plant'] = toEntry(extract(SHEET, 270, 110, 16, 16, FLOOR_HEXES)); // potted palm: pot + trunk + crown base
out['kit-shelf'] = toEntry(extract(SHEET, 272, 64, 16, 16));
// The sheet's wall is a 10-row wainscot band (transparent below);
// our interior walls are full cells, so the wood panelling extends
// down to a baseboard row — the kit's own C/D wood rows continued.
const housewallGrid = extract(SHEET, 128, 64, 16, 16);
for (let j = 10; j < 16; j++) {
  const srcRow = housewallGrid[j === 15 ? 9 : 6 + ((j - 10) % 3)];
  housewallGrid[j] = srcRow.slice();
}
out['kit-housewall'] = toEntry(housewallGrid);
out['kit-painting-1'] = toEntry(extract(SHEET, 192, 48, 16, 16));
out['kit-painting-2'] = toEntry(extract(SHEET, 208, 48, 16, 16));
// Lab wall: the house wall re-toned cool (labs read clinical, houses warm).
const LABWALL_MAP = { '#e6ad27': '#d7dee5', '#8d5500': '#77879a', '#3b2400': '#46525e' };
const labwallGrid = housewallGrid.map((row) => row.map((c) => (c && LABWALL_MAP[c]) || c));
out['kit-labwall'] = toEntry(labwallGrid);

// ---- Wave C: biome families the kit lacks (ORIGINAL tiles in the
// kit's own pattern language: the kit grass/canopy/tallgrass pixel
// patterns re-toned, never the cabin set stretched out of biome) ----
// Snow: kit speckle carried into a snow scale; the canopy remaps to
// spruce with its lightest tone becoming snow load, and the top
// contour rows dust over.
const SNOW_MAP = { '#008100': '#e9f2f6', '#003f00': '#b9cfdb', '#64e53c': '#ffffff', '#063a00': '#a9c3d2', '#b8fca8': '#ffffff' };
const DRY_MAP = { '#008100': '#d8bf83', '#003f00': '#b39b5e', '#64e53c': '#efdf9f', '#063a00': '#9a8148', '#b8fca8': '#f7ecc0' };
const remapGrid = (grid, map) => grid.map((row) => row.map((c) => (c && map[c]) || c));
out['kit-snow-1'] = toEntry(remapGrid(GRIDS['kit-grass-1'], SNOW_MAP));
out['kit-snow-2'] = toEntry(remapGrid(GRIDS['kit-grass-2'], SNOW_MAP));
out['kit-snow-3'] = toEntry(remapGrid(GRIDS['kit-grass-3'], SNOW_MAP));
out['kit-snowtuft'] = toEntry(remapGrid(GRIDS['kit-tallgrass'], SNOW_MAP));
out['kit-dryground-1'] = toEntry(remapGrid(GRIDS['kit-grass-1'], DRY_MAP));
out['kit-dryground-2'] = toEntry(remapGrid(GRIDS['kit-grass-2'], DRY_MAP));
out['kit-dryground-3'] = toEntry(remapGrid(GRIDS['kit-grass-3'], DRY_MAP));
out['kit-drytall'] = toEntry(remapGrid(GRIDS['kit-tallgrass'], DRY_MAP));
const CANOPY_SNOW_MAP = { '#003f00': '#1e4638', '#008100': '#2e6b52', '#64e53c': '#f4fafc' };
const snowCanopy = remapGrid(GRIDS['kit-canopy'], CANOPY_SNOW_MAP)
  .map((row, j) => (j <= 2 ? row.map((c) => (c === '#2e6b52' ? '#e8f3f8' : c)) : row));
out['kit-canopy-snow'] = toEntry(snowCanopy);
const CANOPY_DRY_MAP = { '#003f00': '#5c5c1e', '#008100': '#8a8a3a', '#64e53c': '#d8cd7a' };
out['kit-canopy-dry'] = toEntry(remapGrid(GRIDS['kit-canopy'], CANOPY_DRY_MAP));
// Kit door, open frame (warp-fade door beat in kit towns): the leaf
// tones drop to deep shadow — a dark opening inside the kept frame,
// the mirror of the authored door-open registry's read.
const DOOR_OPEN_MAP = { '#8d5500': '#201204', '#3b2400': '#0f0702' };
out['kit-door-open'] = toEntry(remapGrid(GRIDS['kit-door'], DOOR_OPEN_MAP));
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
