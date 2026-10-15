// sprites.mjs — SpriteForge v1 (PLACEHOLDER per assets/manifest.yaml).
// Seeded symmetric pixel creatures with body-type silhouettes. Stand-ins only —
// Art Director replaces with original pixel art per docs/contracts.md §1.
// Palette rules honored: <=12 colors + alpha, 1px dark outline, no gradients,
// no anti-aliasing.

import { mulberry32 } from './rng.mjs';

const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#ee99ac',
};

// Body-type silhouette templates: list of [x0,y0,x1,y1] rects on a 16x16 grid.
// Silhouettes are drawn symmetric about the vertical center axis.
const BODIES = {
  bird:   [[6, 4, 10, 12], [4, 6, 6, 10], [10, 6, 12, 10], [6, 2, 10, 5]],
  quad:   [[4, 7, 12, 13], [3, 4, 7, 8], [9, 4, 13, 8], [4, 13, 6, 15], [10, 13, 12, 15]],
  biped:  [[6, 6, 10, 13], [5, 3, 11, 7], [6, 13, 7, 15], [9, 13, 10, 15], [4, 7, 6, 10], [10, 7, 12, 10]],
  serpent:[[5, 3, 11, 7], [6, 7, 10, 11], [7, 11, 9, 14], [11, 4, 13, 6]],
  blob:   [[5, 5, 11, 12], [6, 3, 10, 6], [4, 8, 6, 11], [10, 8, 12, 11]],
  fish:   [[5, 6, 11, 11], [3, 4, 5, 8], [11, 7, 13, 10], [6, 4, 10, 6]],
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Forge a species sprite: doc = document-like, species = {spriteSeed, body, types}, size = px.
export function forgeSprite(doc, species, size) {
  const grid = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const cell = size / grid;
  const rng = mulberry32(species.spriteSeed || 1);
  const main = TYPE_COLORS[species.types[0]] || '#a8a878';
  const dark = shade(main, -70);
  const light = shade(main, 45);
  const accent = species.types[1] ? TYPE_COLORS[species.types[1]] : light;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * cell, y * cell, w * cell, h * cell); };

  const rects = BODIES[species.body] || BODIES.blob;
  // 1) dark outline pass: draw each rect expanded by 1 grid cell
  for (const [x0, y0, x1, y1] of rects) px(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, dark);
  // 2) fill pass with flat tones + deterministic dither
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const v = rng();
        px(x, y, 1, 1, v < 0.12 ? light : (v < 0.24 ? accent : main));
      }
    }
  }
  // 3) eyes (front-facing, white + dark pupil)
  const ey = 5, exl = 6, exr = 9;
  px(exl, ey, 1, 1, '#ffffff'); px(exr, ey, 1, 1, '#ffffff');
  px(exl, ey, 1, 1, '#1a1a22'); px(exr, ey, 1, 1, '#1a1a22');
  // 4) species-specific flourish by id hash (ears / tail / crest)
  const f = species.spriteSeed % 4;
  if (f === 0) { px(4, 1, 2, 3, dark); px(10, 1, 2, 3, dark); px(4, 2, 2, 1, accent); px(10, 2, 2, 1, accent); }
  else if (f === 1) { px(12, 9, 3, 2, dark); px(13, 10, 2, 2, accent); }
  else if (f === 2) { px(6, 0, 4, 2, accent); }
  return cv;
}

// Player / NPC overworld sprite: simple 16x16 humanoid in palette colors.
export function forgeHumanoid(doc, opts) {
  const o = opts || {};
  const size = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const skin = o.skin || '#f0c8a0', shirt = o.shirt || '#d84a3a',
        pants = o.pants || '#3a5a9a', hair = o.hair || '#2a2018';
  // outline
  px(5, 1, 6, 14, '#1a1a22');
  // head + hair
  px(6, 2, 4, 4, skin); px(6, 2, 4, 2, hair); px(5, 3, 1, 2, hair); px(10, 3, 1, 2, hair);
  // body
  px(6, 6, 4, 5, shirt);
  // legs
  px(6, 11, 2, 3, pants); px(8, 11, 2, 3, pants);
  // eyes
  px(7, 4, 1, 1, '#1a1a22'); px(9, 4, 1, 1, '#1a1a22');
  return cv;
}
