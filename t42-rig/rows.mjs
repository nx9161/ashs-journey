// Wave T40 rig: candidate twinleaf grid — the shipped rows plus
// the declared change set of WAVE-T40-CLOVER-PLAN.md §6. Built
// programmatically so no exotic char is ever transcribed by hand:
// explicit overrides first (streets, roofs, cottages, sign tile,
// props), then the blanket tg2 -> tg over every unclaimed cell.
import { MAPS9 } from '../src/data/maps9.mjs';
import { T40_KIND_CHARS, SINNOH_TOWN_CHARS } from '../src/engine/tiles.mjs';

const shipped = MAPS9['twinleaf'];
const TC = SINNOH_TOWN_CHARS['twinleaf'];
const CF = T40_KIND_CHARS['cloverfloor'];
const BR = T40_KIND_CHARS['battenroof'];
const SAP = T40_KIND_CHARS['sapling'];
const BED = T40_KIND_CHARS['cloverbed'];

const grid = shipped.rows.map((r) => [...r]);
export const CHANGES = [];
const claimed = new Set();
function set(x, y, ch, kind) {
  claimed.add(x + ',' + y);
  if (grid[y][x] !== ch) { grid[y][x] = ch; CHANGES.push({ x, y, to: kind }); }
}
const street = (x, y) => set(x, y, CF, 'cloverfloor');

// --- streets (cloverfloor) ---
for (let x = 1; x <= 26; x++) street(x, 4);              // front street
for (let x = 0; x <= 27; x++) { street(x, 8); street(x, 9); } // through road
for (const y of [5, 6, 7]) { street(1, y); street(13, y); }   // west arm + main lane N
for (let y = 10; y <= 16; y++) street(13, y);            // main lane S (start cell (13,15) incl.)
for (let x = 14; x <= 18; x++) street(x, 16);            // south lane
street(7, 10);                                           // DIRS shoulder (road -> sign corner)
street(8, 10); street(8, 11); street(8, 12);             // DIRS spur (x7,11 is a shipped planter — byte-kept)
street(5, 10); street(5, 11); street(5, 12);             // plot lane: road -> the plot's north dot row
street(2, 13); street(7, 13); street(7, 16);             // plot pinches: thread the W/E/S dot clusters (T30 threading lesson)
street(22, 7);                                           // cottage A step-off

// --- roofs (battenroof): the two houses' th cells + cottage roofs ---
for (const x of [3, 4, 5, 8, 9, 10]) set(x, 2, BR, 'battenroof');
for (const x of [21, 22, 23]) set(x, 5, BR, 'battenroof');   // cottage A roof
for (const x of [17, 18, 19]) set(x, 14, BR, 'battenroof');  // cottage B roof

// --- cottage walls + doors (tw-twinleaf / door-house, no warps) ---
set(21, 6, TC.tw, 'tw-twinleaf'); set(22, 6, 's', 'door-house'); set(23, 6, TC.tw, 'tw-twinleaf');
set(17, 15, TC.tw, 'tw-twinleaf'); set(18, 15, 's', 'door-house'); set(19, 15, TC.tw, 'tw-twinleaf');

// --- the DIRS sign gains its tile ---
set(7, 12, 'S', 'sign');
// --- verbatim DIRS copy seat (validator round 1: junction (13,4) BARE) ---
set(15, 5, 'S', 'sign');

// --- props ---
set(11, 5, SAP, 'sapling'); set(16, 5, SAP, 'sapling');
set(24, 1, BED, 'cloverbed'); set(2, 16, BED, 'cloverbed'); set(25, 13, BED, 'cloverbed');

// --- blanket: every unclaimed tg2 cell -> tg ---
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++) {
  if (!claimed.has(x + ',' + y) && grid[y][x] === TC.tg2) set(x, y, TC.tg, 'tg-twinleaf');
}

export const ROWS = grid.map((r) => r.join(''));
