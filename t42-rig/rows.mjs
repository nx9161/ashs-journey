// Wave T42 rig: candidate jubilife grid — the shipped rows plus
// the declared change set of WAVE-T42-REVELRY-PLAN.md §6. Built
// programmatically so no exotic char is ever transcribed by hand:
// explicit overrides first (streets, roofs, sign tiles, props),
// then the blanket tg2 -> tg over every unclaimed cell.
import { MAPS9 } from '../src/data/maps9.mjs';
import { T42_KIND_CHARS, SINNOH_TOWN_CHARS } from '../src/engine/tiles.mjs';

const shipped = MAPS9['jubilife'];
const TC = SINNOH_TOWN_CHARS['jubilife'];
const BF = T42_KIND_CHARS['beamfloor'];
const BR = T42_KIND_CHARS['beamroof'];
const CR = T42_KIND_CHARS['condoroof'];
const ST = T42_KIND_CHARS['screentotem'];

const grid = shipped.rows.map((r) => [...r]);
export const CHANGES = [];
const claimed = new Set();
function set(x, y, ch, kind) {
  claimed.add(x + ',' + y);
  if (grid[y][x] !== ch) { grid[y][x] = ch; CHANGES.push({ x, y, to: kind }); }
}
// street(): only shipped tg2 cells take the slab (dressing cells
// inside a street range — the bikestand (19,4), the fence (14,12)
// — are never claimed by a range).
function street(x, y) { if (grid[y][x] === TC.tg2) set(x, y, BF, 'beamfloor'); }

// --- streets (beamfloor) ---
for (let x = 2; x <= 23; x++) street(x, 4);                 // front street
for (const [x, y] of [[13, 0], [14, 0], [13, 1], [14, 1], [13, 2], [14, 2], [13, 3], [14, 3]]) street(x, y); // north avenue + exits
for (let x = 0; x <= 29; x++) { street(x, 8); street(x, 9); } // east-west avenue (exits incl.)
for (let y = 5; y <= 19; y++) { street(13, y); street(14, y); } // south avenue + exits (13,19),(14,19)
for (let x = 4; x <= 12; x++) street(x, 13);                // row 13 lateral W (condo landing)
for (let x = 15; x <= 17; x++) street(x, 13);               // row 13 lateral E (MOSS row)
street(11, 5); street(11, 6);                               // VESK lane (Mart via -> his post)
for (let x = 3; x <= 24; x++) street(x, 18);                // south frontage street (anchors the south planters; threads the plot's south dots)
set(23, 5, BF, 'beamfloor'); set(23, 6, BF, 'beamfloor'); set(23, 7, BF, 'beamfloor'); // house lane: the (20,4)-(23,4) strip is walled off the front street by the bikestand (19,4) + TV sign (24,4) — it joins the E-W avenue down x23 (tg cells paved as a lane)
// plot threading (T30 lesson — the dots are network-tier; unthreaded clusters are islands):
street(7, 14);                                              // east dot column (7,15),(7,16) -> cluster A via (6,14)
street(3, 13); street(3, 14);                               // dot (3,15) -> row 13 lateral
street(1, 14); street(2, 14); street(1, 15); street(1, 16); // west plot lane: dot (2,16) -> (3,14)
street(5, 17);                                              // south dots (3,17),(4,17),(6,17) -> row 18 street

// --- roofs: station tr -> beamroof; condo th -> condoroof ---
for (const x of [15, 16, 17, 18]) set(x, 2, BR, 'beamroof');
for (const x of [3, 4, 5]) set(x, 11, CR, 'condoroof');

// --- the seven invisible DIRS records gain their sign tiles ---
for (const [x, y] of [[16, 12], [2, 17], [20, 2], [8, 16], [10, 16], [15, 16], [21, 16]]) set(x, y, 'S', 'sign');

// --- verbatim DIRS copy tiles (validator-named bare junctions;
// shoulders only — a sign ON the street punches the fabric, T22) ---
set(12, 5, 'S', 'sign');
set(6, 12, 'S', 'sign');
set(2, 13, 'S', 'sign');

// --- props: the screen totem pair on the front lawn ---
set(2, 4, ST, 'screentotem');
set(25, 4, ST, 'screentotem');

// --- blanket: every unclaimed tg2 cell -> tg ---
for (let y = 0; y < 20; y++) for (let x = 0; x < 30; x++) {
  if (!claimed.has(x + ',' + y) && grid[y][x] === TC.tg2) set(x, y, TC.tg, 'tg-jubilife');
}

export const ROWS = grid.map((r) => r.join(''));
