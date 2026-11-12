// seasons.mjs — the season system (Black 2 baseline imposition, owner order
// 2026-11-11: "make it more like Pokemon Black"). Gen V's signature world
// system, implemented original: the season advances MONTHLY, cycling all
// four seasons every four months — the world you walk in January is not
// the world you walk in February. Before this module the game had only a
// cosmetic season color bar in the clock glyph (quarter-year, hardcoded
// in overworld.mjs); this module is now the single source of season truth.
//
// PRESENTATION ONLY, same doctrine as weather.mjs: seasons read the
// calendar and write NOTHING — no state, no save fields, no encounter or
// battle effects. Season is derived from the date, never stored (the
// Bonds rule: derived, never stored). Effects today: a seasonal light
// tint over outdoor maps, the clock-glyph season bar, and a one-shot
// season toast when the season rolls over. Anything mechanical is a
// future owner ruling, not a silent addition.
//
// Anchor (ours): January opens Spring, then the cycle turns monthly —
// Feb Summer, Mar Autumn, Apr Winter, May Spring… — so November plays
// in Autumn and December in Winter.
//
// SEASONAL ART (added same day, owner verdict "the game looks the
// same"): the season also re-grades the world's vegetation art. Tile
// palettes pass through seasonalHex() below when the tile cache is
// built (buildArtTileCache in engine/art.mjs, fed by main.mjs):
// greens — grass, tall grass, flowers' stems, tree canopies — shift
// per season (spring brighter, autumn amber, winter frost-pale) while
// every non-green (trunks, roofs, paths, water) keeps its authored
// color. Original color math, our own art; the authored palette is
// the Summer grade.

export const SEASON_ORDER = ['Winter', 'Spring', 'Summer', 'Autumn'];

// Per-season presentation: glyph/bar color (the exact hexes the clock
// glyph has always used) and the outdoor light tint (rgb + alpha —
// kept subtle, illumination only, like PHASE_TINTS).
export const SEASON_STYLE = {
  Winter: { color: '#5a9ae8', tint: { rgb: [90, 154, 232], alpha: 0.08 } },
  Spring: { color: '#58c94f', tint: { rgb: [88, 201, 79], alpha: 0.05 } },
  Summer: { color: '#e8c832', tint: { rgb: [232, 200, 50], alpha: 0.04 } },
  Autumn: { color: '#e08a4a', tint: { rgb: [224, 138, 74], alpha: 0.07 } },
};

// Pure resolver: Date -> { name, index, color, tint }.
export function seasonForDate(d) {
  const month = d && typeof d.getMonth === 'function' ? d.getMonth() : 0;
  const name = SEASON_ORDER[(((month + 1) % 4) + 4) % 4];
  const style = SEASON_STYLE[name];
  return { name, index: SEASON_ORDER.indexOf(name), color: style.color, tint: style.tint };
}

// The current season, resolved from the real calendar. Headless-safe:
// any Date failure resolves to the anchor season.
export function currentSeason() {
  try { return seasonForDate(new Date()); } catch (e) { return seasonForDate(null); }
}

// The season's light tint for a map, or null where seasons never show:
// interiors and dark maps (caves own their darkness — same exclusion as
// the time-of-day tint and the weather layer).
export function seasonTintFor(map) {
  if (!map || map.indoor || map.dark) return null;
  return currentSeason().tint;
}

// ---- seasonal art grade -------------------------------------------------
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('');

// One authored color -> its seasonal grade. Only green-dominant colors
// (foliage and grass: g strictly greatest) are re-graded; everything
// else returns unchanged, in every season.
export function seasonalHex(hex, seasonName) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  if (!(g > r && g > b)) return hex;
  switch (seasonName) {
    case 'Spring': return rgbToHex(r * 0.94 + 14, g * 1.07 + 8, b * 0.94 + 6);
    case 'Summer': return rgbToHex(r * 0.97, g, b * 0.97);
    case 'Autumn': return rgbToHex(g * 1.05 + 26, r * 0.58 + g * 0.22, b * 0.5);
    case 'Winter': {
      const lum = (r + g + b) / 3;
      const mix = (t) => lum + (t - lum) * 0.66;
      return rgbToHex(mix(228), mix(238), mix(244));
    }
    default: return hex;
  }
}

// Build an artCanvas swap ({ paletteChar: hex }) re-grading every
// green in a palette for the current season. Entries whose grade is
// unchanged are omitted; an all-unchanged palette yields {}.
export function seasonalSwapFor(pal) {
  if (!pal) return {};
  const season = currentSeason().name;
  const swap = {};
  for (const ch of Object.keys(pal)) {
    const graded = seasonalHex(pal[ch], season);
    if (graded !== pal[ch]) swap[ch] = graded;
  }
  return swap;
}

// ---- kit grade (Wave A, 2026-11-11) --------------------------------------
// The adopted Gassasin kit's greens are far deeper than our authored
// ramp (its grass is a pure #008100 against our #5da24a), and the
// shared Autumn formula drives its red channel from the green — so on
// kit palettes the grade overshoots into deep red (#a11c00, r:g 5.8:1)
// where our own art lands in the amber family (r:g ~2.1:1, b ~0.28r).
// The kit grade corrects ONLY that overshoot, and ONLY on the kit
// path (engine/art.mjs feeds kit palettes through seasonalSwapForKit;
// our own art keeps seasonalHex exactly): after the shared grade, a
// red-dominant Autumn result is pulled back into the family band —
// green floored at r/2.15, blue floored at 0.26r. Every other season
// passes through untouched: the kit's Spring/Summer/Winter grades
// already sit in the family (measured 2026-11-11).
export function seasonalHexKit(hex, seasonName) {
  const graded = seasonalHex(hex, seasonName);
  if (seasonName !== 'Autumn') return graded;
  const rgb = hexToRgb(graded);
  if (!rgb) return graded;
  const [r, g, b] = rgb;
  if (!(r > g)) return graded;
  return rgbToHex(r, Math.max(g, r / 2.15), Math.max(b, r * 0.26));
}

// seasonalSwapFor for kit palettes (same contract as seasonalSwapFor).
export function seasonalSwapForKit(pal) {
  if (!pal) return {};
  const season = currentSeason().name;
  const swap = {};
  for (const ch of Object.keys(pal)) {
    const graded = seasonalHexKit(pal[ch], season);
    if (graded !== pal[ch]) swap[ch] = graded;
  }
  return swap;
}
