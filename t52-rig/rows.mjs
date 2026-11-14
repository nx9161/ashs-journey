// Wave T52 rig: build the Rimefall candidate grid from the
// shipped rows (WAVE-T52-RIMEFALL-PLAN.md §6). Blanket first
// (every tg2 cell -> tg), then the declared street / stamp /
// prop / cottage / sign edits on top. COPY_SEATS is filled by
// validator rounds — verbatim DIRS copies at named bare
// junctions only, on snow shoulders.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t52/scripts/audit-desire-paths.mjs';

const { MAPS, TILE_CHARS } = await loadMaps(false);
const src = MAPS.snowpoint;
const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;

const grid = src.rows.map((r) => [...r]);
const set = (x, y, kind) => { grid[y][x] = CH[kind]; };

// blanket: the mud sea leaves the town
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++)
  if (grid[y][x] === CH['tg2-snowpoint']) grid[y][x] = CH['tg-snowpoint'];

// street graph (rimefloor)
const STREET = [];
for (let x = 1; x <= 26; x++) STREET.push([x, 4]);              // front street
for (const y of [5, 6, 7]) STREET.push([1, y]);                 // west arm
for (const y of [8, 9]) for (let x = 0; x <= 19; x++) STREET.push([x, y]); // lake road + exit cells
for (const y of [5, 6, 7, 10]) STREET.push([4, y]);             // temple avenue (row 11 is the temple roof)
for (const y of [5, 6, 7]) STREET.push([10, y]);                // Mart avenue (REN at (11,7) keeps his post)
for (const y of [10, 11, 12]) STREET.push([11, y]);             // harbour avenue
for (const y of [10, 11, 12, 13, 14, 15, 16]) STREET.push([18, y]); // SOLVI lane, extended to the south shore (anchors the (17,17) planter)
// temple precinct: the avenue wraps the temple's east side and
// runs along the garden plot's north row — the only network
// route to the temple door's step-off (4,13), a 'path' cell
// ringed by walls, lanterns and encounter cells
for (const x of [5, 6, 7]) STREET.push([x, 10]);                // row-10 connector
for (const y of [11, 12, 13]) STREET.push([7, y]);              // east lane
for (const x of [3, 5, 6]) STREET.push([x, 13]);                // plot north row (the dot (4,13) stays 'path')
// garden west + south lane: from the plot's west dot (3,14)
// down and along the plot's south edge — puts a street
// shoulder beside the garden lamp (4,15)
for (const y of [14, 15, 16]) STREET.push([2, y]);
for (const x of [3, 4]) STREET.push([x, 16]);
// west shore lane: from the harbour avenue down the west
// pool's shore to the south shore (anchors the (10,17)
// planter and the (7,15) lamp's feeder cell)
for (const x of [10]) for (const y of [12, 13, 14]) STREET.push([x, y]);
for (const y of [14, 15, 16]) STREET.push([9, y]);
STREET.push([8, 15]);
for (const [x, y] of STREET) set(x, y, 'rimefloor');

// the Gym takes the kit roof (the Temple keeps tr-snowpoint)
for (const x of [15, 16, 17, 18]) set(x, 2, 'driftroof');

// facade cottages (th-snowpoint + tw-snowpoint + door-house, no warps)
for (const x of [22, 23, 24]) set(x, 5, 'th-snowpoint');
set(22, 6, 'tw-snowpoint'); set(23, 6, 'door-house'); set(24, 6, 'tw-snowpoint');
for (const x of [20, 21, 22]) set(x, 10, 'th-snowpoint');
set(20, 11, 'tw-snowpoint'); set(21, 11, 'door-house'); set(22, 11, 'tw-snowpoint');

// the three invisible DIRS gain their tiles
set(3, 15, 'sign'); set(14, 10, 'sign'); set(19, 3, 'sign');

// the pier bollards on the boardwalk block's shoulders
set(11, 13, 'ironbollard'); set(16, 13, 'ironbollard');

// the stone lanterns flanking the temple garden's entry —
// (2,13) at the plot row's west end, (6,14) at the east
// lane's foot ((6,13) itself carries the street)
set(2, 13, 'stonelantern'); set(6, 14, 'stonelantern');

export const COPY_SEATS = [
  [6, 5], [12, 5], [7, 16],
];
for (const [x, y] of COPY_SEATS) set(x, y, 'sign');

export const CANDIDATE = grid.map((r) => r.join(''));
