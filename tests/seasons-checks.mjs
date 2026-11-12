// seasons-checks.mjs — Black 2 baseline: season system invariants.
import { seasonForDate, seasonTintFor, seasonalHex, seasonalSwapFor, SEASON_ORDER } from '../src/game/seasons.mjs';
let fail = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); fail = 1; } };
// All 12 months resolve, cycle length exactly 4, monthly advance.
// Anchor: January opens Spring (so November plays in Autumn).
const names = [];
for (let m = 0; m < 12; m++) names.push(seasonForDate(new Date(2026, m, 15)).name);
ok(names[0] === 'Spring', 'January anchors Spring, got ' + names[0]);
for (let m = 0; m < 12; m++) ok(names[m] === SEASON_ORDER[(m + 1) % 4], `month ${m} follows the 4-cycle`);
ok(names[10] === 'Autumn', 'November is Autumn, got ' + names[10]);
ok(new Set(names.slice(0, 4)).size === 4, 'four distinct seasons per cycle');
// Presentation bounds: tint always subtle illumination.
for (let m = 0; m < 12; m++) { const s = seasonForDate(new Date(2026, m, 1)); ok(s.tint.alpha > 0 && s.tint.alpha <= 0.1, 'tint alpha subtle'); ok(s.color.startsWith('#'), 'glyph color present'); }
// Map gating: interiors and dark maps never tint; outdoors do.
ok(seasonTintFor({ indoor: true }) === null, 'indoor -> no tint');
ok(seasonTintFor({ dark: true }) === null, 'dark -> no tint');
ok(seasonTintFor({}) !== null, 'outdoor -> tint');
ok(seasonTintFor(null) === null, 'no map -> no tint');
// Seasonal art grade: greens re-grade per season; non-greens never move.
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const autumn = rgb(seasonalHex('#5da24a', 'Autumn'));
ok(autumn[0] > autumn[1], 'autumn grass reads amber (red wins), got ' + seasonalHex('#5da24a', 'Autumn'));
const winter = rgb(seasonalHex('#5da24a', 'Winter'));
ok(winter[0] > 170 && winter[1] > 180 && winter[2] > 180, 'winter grass reads snow-pale, got ' + seasonalHex('#5da24a', 'Winter'));
for (const s of SEASON_ORDER) {
  ok(seasonalHex('#8a5a30', s) === '#8a5a30', 'trunk brown untouched in ' + s);
  ok(seasonalHex('#3a6fd8', s) === '#3a6fd8', 'water blue untouched in ' + s);
  ok(seasonalHex('#e8e4da', s) === '#e8e4da', 'path stone untouched in ' + s);
}
const swap = seasonalSwapFor({ a: '#5da24a', b: '#8a5a30', c: '#2e7d46' });
ok(!('b' in swap), 'swap never includes non-greens');
ok(Object.keys(swap).length >= 1, 'current season re-grades at least one green');
console.log(fail ? 'seasons-checks FAILED' : 'seasons-checks: all PASS (' + names.join(' → ') + ' → …)');
process.exit(fail);
