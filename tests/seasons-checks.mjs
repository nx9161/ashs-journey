// seasons-checks.mjs — Black 2 baseline: season system invariants.
import { seasonForDate, seasonTintFor, SEASON_ORDER } from '../src/game/seasons.mjs';
let fail = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); fail = 1; } };
// All 12 months resolve, cycle length exactly 4, monthly advance.
const names = [];
for (let m = 0; m < 12; m++) names.push(seasonForDate(new Date(2026, m, 15)).name);
ok(names[0] === 'Winter', 'January anchors Winter, got ' + names[0]);
for (let m = 0; m < 12; m++) ok(names[m] === SEASON_ORDER[m % 4], `month ${m} follows the 4-cycle`);
ok(new Set(names.slice(0, 4)).size === 4, 'four distinct seasons per cycle');
// Presentation bounds: tint always subtle illumination.
for (let m = 0; m < 12; m++) { const s = seasonForDate(new Date(2026, m, 1)); ok(s.tint.alpha > 0 && s.tint.alpha <= 0.1, 'tint alpha subtle'); ok(s.color.startsWith('#'), 'glyph color present'); }
// Map gating: interiors and dark maps never tint; outdoors do.
ok(seasonTintFor({ indoor: true }) === null, 'indoor -> no tint');
ok(seasonTintFor({ dark: true }) === null, 'dark -> no tint');
ok(seasonTintFor({}) !== null, 'outdoor -> tint');
ok(seasonTintFor(null) === null, 'no map -> no tint');
console.log(fail ? 'seasons-checks FAILED' : 'seasons-checks: all PASS (' + names.join(' → ') + ' → …)');
process.exit(fail);
