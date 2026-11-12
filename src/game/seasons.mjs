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
// Anchor (ours): January = Winter, then the cycle turns monthly —
// Feb Spring, Mar Summer, Apr Autumn, May Winter, and so on.

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
  const name = SEASON_ORDER[((month % 4) + 4) % 4];
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
