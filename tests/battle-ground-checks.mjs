// tests/battle-ground-checks.mjs — War Room W-BG (No-Same-Kit fix #3):
// the Battle Ground coverage gate. Standalone suite in the repo's
// checks style:
//   node tests/battle-ground-checks.mjs
//
// WHY THIS EXISTS: BattleScene resolves each battle's Ground (field
// rules + ARENA_ART treatment) from MAP_GROUND[mapId], falling back
// to Open for any unmapped map. At the W-BG baseline only 137 of 432
// merged maps were assigned — every Yamato/Maris/Borea wild battle
// and all seven Frontier facilities silently fought on the Open
// field, however snowy, volcanic or coastal the map was (audit
// §3). W-BG completed the assignment table region by region using
// only the 15 existing treatments.
//
// WHAT THIS GATE HOLDS:
//  1. FULL EXPLICIT COVERAGE: every merged map id has an explicit
//     MAP_GROUND entry, or stands on the NAMED_GAPS list below (a
//     terrain with NO fitting treatment among the 15 — currently
//     empty; a future gap must be named here, never defaulted).
//  2. NO DEAD KEYS / NO INVALID VALUES: every MAP_GROUND key is a
//     merged map id and every value is one of the 15 GROUNDS.
//  3. OPEN IS NEVER SILENT: the set of maps assigned 'open' equals
//     the DELIBERATE_OPEN pin below exactly — Open is an authored
//     choice (towns, houses, league floors), reviewed map by map.
//     Assigning Open to one more map means updating the pin in the
//     same commit, on purpose.
//  4. NO ORPHANED TREATMENT: all 15 Grounds are used by >= 1 map.
//  5. COUNTS PINNED at the W-BG close: 432 merged maps, 432
//     explicit, 394 battle-hosting maps (encounters or npcs), all
//     394 explicit, 263 of them on a non-Open treatment.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

let pass = 0; const failures = [];
function ok(name, cond, detail = '') { if (cond) { pass++; } else { failures.push(name); console.log('  FAIL: ' + name + (detail ? ' — ' + detail : '')); } }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));

const packs = [];
{
  const base = await D('maps.mjs'); packs.push(base.MAPS);
  for (let i = 2; i <= 9; i++) { const mod = await D(`maps${i}.mjs`); packs.push(mod[`MAPS${i}`]); }
}
const MERGED = {};
for (const obj of packs) Object.assign(MERGED, obj);
const { MAP_GROUND, GROUNDS } = await D('grounds.mjs');

// Terrains with NO fitting treatment among the 15 existing Grounds.
// W-BG found none — every map took a fitting treatment (desert and
// ash fields ride Mire's dry-earth treatment; the underwater
// trenches ride Tide). A future map whose terrain fits nothing
// goes HERE by name until an art wave gives it a treatment.
const NAMED_GAPS = [];

// The pinned set of maps whose Open assignment is an authored
// choice. Exactly the 'open'-valued keys of MAP_GROUND at W-BG
// close (149). Any drift fails by name.
const DELIBERATE_OPEN = [
  'birch-lab', 'blackthorn', 'canalave', 'canalave-library',
  'celadon', 'center', 'cerulean', 'cianwood',
  'contest-fallarbor', 'contest-hearthome', 'contest-lilycove', 'contest-slateport',
  'contest-verdanturf', 'dance-theater', 'daycare', 'dewford',
  'dojo', 'ecruteak', 'elm-lab', 'eterna',
  'fight-area', 'frontier-dome', 'frontierhub', 'fuchsia',
  'gamecorner', 'goldenrod', 'great-marsh-gate', 'gym-goldenrod',
  'gym-petalburg', 'hearthome', 'hideout', 'house-azalea',
  'house-blackthorn', 'house-canalave', 'house-celadon-e', 'house-celadon-w',
  'house-celestic', 'house-cerulean', 'house-cherrygrove', 'house-cianwood',
  'house-cinnabar', 'house-dewford', 'house-ecruteak', 'house-eterna',
  'house-fallarbor', 'house-fight', 'house-floaroma', 'house-fortree',
  'house-fuchsia', 'house-goldenrod', 'house-hearthome', 'house-hearthome-poffin',
  'house-indigo', 'house-jubilife', 'house-jubilife-condo', 'house-kumquat',
  'house-lavaridge', 'house-lavender', 'house-littleroot', 'house-littleroot-rival',
  'house-mahogany', 'house-mauville', 'house-mikan', 'house-newbark',
  'house-oldale', 'house-olivine', 'house-oreburgh', 'house-pallet-ash',
  'house-pallet-gary', 'house-pastoria', 'house-petalburg', 'house-pewter-e',
  'house-pewter-w', 'house-resort', 'house-resort-villa', 'house-rustboro',
  'house-sandgem', 'house-shamouti', 'house-silvertown', 'house-slateport',
  'house-snowpoint', 'house-solaceon', 'house-solaceon-daycare', 'house-sunnyshore',
  'house-survival', 'house-twinleaf', 'house-twinleaf-rival', 'house-valencia',
  'house-veilstone', 'house-verdanturf', 'house-vermilion', 'house-violet',
  'house-viridian', 'indigo', 'ivy-lab', 'jubilife',
  'kumquat', 'kurt-house', 'lavender', 'league',
  'league-chamber-1', 'league-chamber-2', 'league-chamber-3', 'league-chamber-4',
  'league-champion', 'league-evergrande', 'league-lobby', 'lilycove',
  'littleroot', 'mahogany', 'mart', 'mauville',
  'mikan', 'moro', 'mossdeep', 'navel',
  'newbark', 'oldale', 'olivine', 'oreburgh',
  'pallet', 'petalburg', 'pewter', 'pokemon-league',
  'pummelo', 'pummelo-stadium', 'resort-area', 'route1',
  'route22', 'rowan-lab', 'rustboro', 'saffron',
  'sandgem', 'shamouti', 'silph1', 'silph2',
  'silver-stadium', 'silvertown', 'slateport', 'solaceon',
  'sunnyshore', 'survival-area', 'trovita', 'twinleaf',
  'valencia', 'veilstone', 'vermilion', 'violet',
  'viridian',
];

const mergedIds = Object.keys(MERGED);
const assigned = Object.keys(MAP_GROUND);
const gapSet = new Set(NAMED_GAPS);

ok('census: 432 merged maps', mergedIds.length === 432, 'got ' + mergedIds.length);
ok('census: 432 explicit MAP_GROUND entries', assigned.length === 432, 'got ' + assigned.length);

const unassigned = mergedIds.filter((id) => !(id in MAP_GROUND) && !gapSet.has(id));
ok('coverage: every merged map explicitly assigned or named-gapped', unassigned.length === 0,
  unassigned.slice(0, 8).join(', ') + (unassigned.length > 8 ? ' …' : ''));
ok('gaps: NAMED_GAPS entries are real maps with no entry',
  NAMED_GAPS.every((id) => (id in MERGED) && !(id in MAP_GROUND)),
  NAMED_GAPS.filter((id) => !(id in MERGED) || (id in MAP_GROUND)).join(', '));

const dead = assigned.filter((id) => !(id in MERGED));
ok('no dead MAP_GROUND keys', dead.length === 0, dead.join(', '));
const invalid = assigned.filter((id) => !(MAP_GROUND[id] in GROUNDS));
ok('every MAP_GROUND value is a real Ground', invalid.length === 0, invalid.join(', '));

const openSet = assigned.filter((id) => MAP_GROUND[id] === 'open').sort();
const pinSet = [...DELIBERATE_OPEN].sort();
ok('open set == DELIBERATE_OPEN pin (149)', JSON.stringify(openSet) === JSON.stringify(pinSet),
  'only-in-data: ' + openSet.filter((x) => !pinSet.includes(x)).join(', ') +
  ' | only-in-pin: ' + pinSet.filter((x) => !openSet.includes(x)).join(', '));

const used = new Set(Object.values(MAP_GROUND));
const orphaned = Object.keys(GROUNDS).filter((g) => !used.has(g));
ok('all 15 treatments in use', orphaned.length === 0 && used.size === 15, orphaned.join(', '));

const hosting = mergedIds.filter((id) => {
  const m = MERGED[id];
  return (m.encounters && m.encounters.table && m.encounters.table.length) || (m.npcs && m.npcs.length);
});
const hostingExplicit = hosting.filter((id) => id in MAP_GROUND);
const hostingNonOpen = hosting.filter((id) => MAP_GROUND[id] && MAP_GROUND[id] !== 'open');
ok('battle-hosting census: 394 maps', hosting.length === 394, 'got ' + hosting.length);
ok('battle-hosting: all 394 explicitly assigned', hostingExplicit.length === 394, 'got ' + hostingExplicit.length);
ok('battle-hosting: 263 on a non-Open treatment', hostingNonOpen.length === 263, 'got ' + hostingNonOpen.length);

console.log(`battle-ground-checks: ${pass} pass, ${failures.length} fail`);
if (failures.length) process.exit(1);
