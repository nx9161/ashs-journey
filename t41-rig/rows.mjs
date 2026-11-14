// Wave T41 rig: candidate sandgem grid — the shipped rows plus
// the declared change set of WAVE-T41-SHINGLE-PLAN.md §6. Built
// programmatically so no exotic char is ever transcribed by
// hand: explicit overrides first (Center restoration, streets,
// beach restorations, roofs, cottages, sign tiles, props), then
// the blanket tg2 -> tg over every unclaimed cell.
import { MAPS9 } from '../src/data/maps9.mjs';
import { T41_KIND_CHARS, SINNOH_TOWN_CHARS } from '../src/engine/tiles.mjs';

const shipped = MAPS9['sandgem'];
const TC = SINNOH_TOWN_CHARS['sandgem'];
const SF = T41_KIND_CHARS['shellfloor'];
const SR = T41_KIND_CHARS['shellroof'];
const SLUG = T41_KIND_CHARS['tideslug'];
const LOG = T41_KIND_CHARS['tidelog'];
const PS = '„'; // psand-s
const PE = '‟'; // psand-e

const grid = shipped.rows.map((r) => [...r]);
export const CHANGES = [];
const claimed = new Set();
function set(x, y, ch, kind) {
  claimed.add(x + ',' + y);
  if (grid[y][x] !== ch) { grid[y][x] = ch; CHANGES.push({ x, y, to: kind }); }
}
const street = (x, y) => set(x, y, SF, 'shellfloor');

// --- Center stamp restoration (the stamp's own chars, §3.2) ---
set(13, 2, 'l', 'roof-center-m'); set(14, 2, 'm', 'roof-center-r');
set(13, 3, 'K', 'door-center-r'); set(14, 3, 'A', 'wall-center');

// --- streets (shellfloor) ---
for (let x = 1; x <= 26; x++) street(x, 4);                 // front street
for (let y = 5; y <= 9; y++) street(1, y);                   // west arm
street(0, 8); street(0, 9);                                 // r201 exit cells
for (let y = 10; y <= 12; y++) street(1, y);                 // beach lane
street(13, 1); street(14, 1); street(15, 1);                // north throat
street(16, 1); street(16, 2); street(16, 3);                // gap lane (Center|Mart)
street(13, 0); street(14, 0);                               // r202 exit cells
street(13, 17); street(14, 17);                             // r219 exit cells
street(5, 12);                                              // house spur
street(2, 8); street(3, 8);                                 // W cottage step spur
for (let y = 8; y <= 12; y++) street(24, y);                 // E cottage lane
// --- round 2 (validator-named): the south desire band + lamp lanes ---
for (let x = 6; x <= 15; x++) street(x, 12);                 // beachfront street W
for (let x = 17; x <= 19; x++) street(x, 12);                // beachfront street E
for (let y = 5; y <= 9; y++) street(6, y);                   // RUE's lane (front <-> beachfront)
for (let y = 5; y <= 7; y++) street(8, y);                   // lamp spur (lamp@8,6 shoulder)
street(11, 5); street(11, 6);                               // FERN's spur (Center south lane)
street(21, 8); street(22, 8); street(23, 8);                // east row-8 run (lamp@20,8 shoulder)

// --- beach gate-column restorations (the beach's own kinds) ---
set(13, 13, PS, 'psand-s'); set(14, 13, PS, 'psand-s');
set(14, 15, PE, 'psand-e');

// --- roofs (shellroof): the House's th cells + cottage roofs ---
for (const x of [3, 4, 5]) set(x, 11, SR, 'shellroof');
for (const x of [2, 3, 4]) set(x, 6, SR, 'shellroof');       // W cottage roof
for (const x of [23, 24, 25]) set(x, 6, SR, 'shellroof');    // E cottage roof

// --- cottage walls + doors (tw-sandgem / door-house, no warps) ---
set(2, 7, TC.tw, 'tw-sandgem'); set(3, 7, 's', 'door-house'); set(4, 7, TC.tw, 'tw-sandgem');
set(23, 7, TC.tw, 'tw-sandgem'); set(24, 7, 's', 'door-house'); set(25, 7, TC.tw, 'tw-sandgem');

// --- the four DIRS signs gain their tiles ---
set(7, 11, 'S', 'sign'); set(10, 11, 'S', 'sign');
set(18, 11, 'S', 'sign'); set(15, 15, 'S', 'sign');

// --- props (beach) ---
// tideslug at (18,13): one cell WEST of ANA's post — the round-1
// seat (20,13) severed the beach band's east arm (the slug was
// the row's only bridge); at (18,13) ANA's own psand cell keeps
// the band whole.
set(18, 13, SLUG, 'tideslug');
set(7, 13, LOG, 'tidelog');

// --- verbatim DIRS copy seats (validator-named bare junctions) ---
export const COPIES = [[15, 2], [15, 5], [2, 9], [3, 13], [23, 12], [7, 5], [10, 5]];
for (const [x, y] of COPIES) set(x, y, 'S', 'sign');

// --- blanket: every unclaimed tg2 cell -> tg ---
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++) {
  if (!claimed.has(x + ',' + y) && grid[y][x] === TC.tg2) set(x, y, TC.tg, 'tg-sandgem');
}

export const ROWS = grid.map((r) => r.join(''));
