// Wave T51 rig: build the Astral candidate grid from the
// shipped rows (WAVE-T51-ASTRAL-PLAN.md §6). Blanket first
// (every tg2 cell -> tg), then the declared street / stamp /
// prop / cottage / sign edits on top. COPY_SEATS is filled by
// validator rounds — verbatim DIRS copies at named bare
// junctions only, on green shoulders.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t51/scripts/audit-desire-paths.mjs';

const { MAPS, TILE_CHARS } = await loadMaps(false);
const src = MAPS.celestic;
const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;

const grid = src.rows.map((r) => [...r]);
const set = (x, y, kind) => { grid[y][x] = CH[kind]; };

// blanket: the mud sea leaves the town
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++)
  if (grid[y][x] === CH['tg2-celestic']) grid[y][x] = CH['tg-celestic'];

// street graph (moonfloor)
const STREET = [];
for (let x = 2; x <= 23; x++) STREET.push([x, 4]);              // front street
for (let x = 1; x <= 26; x++) STREET.push([x, 8]);              // south road
for (const y of [5, 6, 7, 9]) STREET.push([26, y]);             // east arm
STREET.push([27, 8], [27, 9]);                                  // r210-north exit cells
for (const y of [5, 6, 7]) STREET.push([10, y]);                // Mart avenue (UME at (11,7) keeps her post)
STREET.push([7, 9], [7, 10]);                                   // plaza avenue
for (const y of [9, 10, 11]) STREET.push([19, y]);              // BLYTHE lane
for (const [x, y] of STREET) set(x, y, 'moonfloor');

// the Shrine takes the kit roof (House keeps th-celestic)
for (const x of [20, 21, 22, 23]) set(x, 2, 'duskroof');

// facade cottages (th-celestic + tw-celestic + door-house, no warps)
for (const x of [22, 23, 24]) set(x, 5, 'th-celestic');
set(22, 6, 'tw-celestic'); set(23, 6, 'door-house'); set(24, 6, 'tw-celestic');
for (const x of [22, 23, 24]) set(x, 14, 'th-celestic');
set(22, 15, 'tw-celestic'); set(23, 15, 'door-house'); set(24, 15, 'tw-celestic');

// the one invisible DIRS gains its tile
set(13, 10, 'sign');

// the ring-stone pair at the plaza's north gate
set(3, 10, 'ringstone'); set(11, 10, 'ringstone');

// the mural panels at the two recorded beats
set(14, 15, 'muralpanel'); set(20, 12, 'muralpanel');

export const COPY_SEATS = [
  // round 1: the five bare junction sites were (10,4), (7,8),
  // (10,8), (19,8), (26,8) — four copies on green shoulders,
  // each within Chebyshev 2 of its site(s); (12,6) covers both
  // Mart-avenue crossings.
  [12, 6],
  [6, 6],
  [21, 7],
  [24, 7],
];
for (const [x, y] of COPY_SEATS) set(x, y, 'sign');

export const CANDIDATE = grid.map((r) => r.join(''));
