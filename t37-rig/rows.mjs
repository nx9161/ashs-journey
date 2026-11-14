// Wave T37 rig: the candidate sootopolis rows, built over the
// shipped rows with every change DECLARED (cell, from, to, why)
// and every claim's shipped kind asserted, so a geometry slip
// throws here instead of paving a sacred cell in the data file.
// Plan: WAVE-T37-CRATERLAKE-PLAN.md §6.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t37/scripts/audit-desire-paths.mjs';
import { T37_KIND_CHARS } from '/home/hatch/workspace/ashs-journey-t37/src/engine/tiles.mjs';

const { MAPS, TILE_CHARS } = await loadMaps(false);
const m = MAPS['sootopolis'];
// kind -> char AS USED IN THIS MAP's rows (town-variant chars are
// per-town; scan the shipped rows so CH speaks sootopolis).
const CH = { ...T37_KIND_CHARS };
for (const row of m.rows) for (const ch of row) { const k = TILE_CHARS[ch]; if (k && !(k in CH)) CH[k] = ch; }
// kinds absent from this map (door-house: sootopolis ships no house
// doors) resolve from the global char table — an unresolved kind
// would write `undefined` into the row and shift every later cell.
for (const k of ['door-house']) if (!(k in CH)) CH[k] = Object.keys(TILE_CHARS).find((ch) => TILE_CHARS[ch] === k);
const base = m.rows.map((r) => [...r]);
const W = m.rows[0].length, H = m.rows.length;
const kind = (x, y) => TILE_CHARS[base[y][x]];
const out = base.map((r) => [...r]);
export const CHANGES = [];
const set = (x, y, toKind, why, fromOk) => {
  const from = kind(x, y);
  if (!fromOk.includes(from)) throw new Error(`claim (${x},${y}) ${why}: shipped kind ${from} not in [${fromOk}]`);
  if (from === toKind) return;
  out[y][x] = CH[toKind];
  CHANGES.push({ x, y, from, to: toKind, why });
};

const GROUND = ['tg-sootopolis', 'tg2-sootopolis'];
// --- blanket: the 116-cell tg2 mud sea retires to calm tg ---
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
  if (kind(x, y) === 'tg2-sootopolis') { out[y][x] = CH['tg-sootopolis']; CHANGES.push({ x, y, from: 'tg2-sootopolis', to: 'tg-sootopolis', why: 'blanket' }); }

// --- rim ledge: the row-1 rock band behind the stamps -> tg (§3.4) ---
for (let x = 1; x <= 12; x++) set(x, 1, 'tg-sootopolis', 'rim-ledge', ['rock']);
for (let x = 15; x <= 26; x++) set(x, 1, 'tg-sootopolis', 'rim-ledge', ['rock']);
// --- ventstones at the ledge's two ends ---
set(1, 1, 'ventstone', 'ventstone', ['rock']);
set(26, 1, 'ventstone', 'ventstone', ['rock']);
// --- front street: rows 4-5, x1-19 (the crater-lake sign (20,4)
// + lamp (20,5) stand as its east terminus — the shipped ground
// east of them was always lawn, and a floor pair at x21-26 would
// float as its own component behind the sign/lamp column) ---
for (let x = 1; x <= 19; x++) set(x, 4, 'craterfloor', 'front-street', GROUND);
for (let x = 1; x <= 19; x++) { if (x !== 2) set(x, 5, 'craterfloor', 'front-street', GROUND); }
// --- cave throat: the mouth's own floor spills to the street ---
for (const [x, y] of [[13, 2], [14, 2], [13, 3], [14, 3]]) set(x, y, 'cavefloor', 'cave-throat', ['tg2-sootopolis']);
// --- cave avenue + west spoke ---
for (let y = 6; y <= 9; y++) set(12, y, 'craterfloor', 'cave-avenue', GROUND);
for (let y = 6; y <= 9; y++) set(7, y, 'craterfloor', 'west-spoke', GROUND);
// --- east avenue: the x19 lane (the lamp (20,7) stands in the
// east lane's line byte-kept — paving (20,6)/(20,8) around it
// would straddle it N+S, an on-fabric fail; the avenue flows
// via x19 and widens at the shore corner (20,9)) ---
for (let y = 6; y <= 9; y++) set(19, y, 'craterfloor', 'east-avenue', GROUND);
// --- lake ring: north shore (column (11,9) byte-kept) ---
for (let x = 7; x <= 20; x++) { if (x !== 11) set(x, 9, 'craterfloor', 'north-shore', GROUND); }
// --- lake ring: west shore ---
for (let y = 10; y <= 14; y++) set(8, y, 'craterfloor', 'west-shore', GROUND);
// --- lake ring: east shore thread (dots (20,12),(20,13) byte-kept) ---
set(20, 11, 'craterfloor', 'east-shore', GROUND);
set(19, 12, 'craterfloor', 'east-shore', GROUND);
set(20, 14, 'craterfloor', 'east-shore', GROUND);
// --- lake ring: south shore (column (10,15) byte-kept) + SE corner ---
for (let x = 7; x <= 19; x++) { if (x !== 10) set(x, 15, 'craterfloor', 'south-shore', GROUND); }
set(20, 15, 'craterfloor', 'south-shore-corner', GROUND);
// --- the south lane jogs around the column's south side (row 16),
// closing the ring the byte-kept column interrupts at row 15 ---
for (let x = 9; x <= 11; x++) set(x, 16, 'craterfloor', 'south-lane-jog', ['tg2-sootopolis']);
// --- W encounter-plot threads: the fishers' lane to ONEN's plot —
// a spur off the north shore at (6,9),(5,9),(5,10) joining the
// plot's north dots, and the shore lane's (5,15),(6,15) joining
// its south dots (the dots are network by tier; landlocked in
// lawn they would float as two 3-cell components). The spur
// threads x5, not x6: a floor at (6,10) would straddle the
// bench (7,10) E+W, an on-fabric fail ---
set(6, 9, 'craterfloor', 'plot-thread-n', GROUND);
set(5, 9, 'craterfloor', 'plot-thread-n', GROUND);
set(5, 10, 'craterfloor', 'plot-thread-n', GROUND);
set(5, 15, 'craterfloor', 'plot-thread-s', GROUND);
set(6, 15, 'craterfloor', 'plot-thread-s', GROUND);
// --- gym roof swap (kind only, geometry identical) ---
for (let x = 15; x <= 18; x++) set(x, 2, 'craterroof', 'gym-roof', ['tr-sootopolis']);
// --- facade cottage W: rows 7-8, x3-5 ---
for (let x = 3; x <= 5; x++) set(x, 7, 'craterroof', 'cottageW-roof', GROUND);
set(3, 8, 'craterwall', 'cottageW-wall', GROUND);
set(4, 8, 'door-house', 'cottageW-door', GROUND);
set(5, 8, 'craterwall', 'cottageW-wall', GROUND);
// --- facade cottage E: rows 5-6, x23-25 ---
for (let x = 23; x <= 25; x++) set(x, 5, 'craterroof', 'cottageE-roof', GROUND);
set(23, 6, 'craterwall', 'cottageE-wall', GROUND);
set(24, 6, 'door-house', 'cottageE-door', GROUND);
set(25, 6, 'craterwall', 'cottageE-wall', GROUND);
// --- the painter's easel on the east shore ---
set(19, 14, 'painteasel', 'easel', ['tg2-sootopolis']);
// --- the two invisible DIRS posts gain their tiles ---
set(8, 8, 'sign', 'dirs-tile', ['tg2-sootopolis']);
set(17, 8, 'sign', 'dirs-tile', ['tg2-sootopolis']);
// --- DIRS copies at the validator-named bare junctions (green
// shoulders only): the east-shore thread junction (20,12) takes
// its copy at (19,11); the south shore's west end (8,15) and the
// W plot's south thread (5,14)/(6,15) share one copy at (8,16),
// the shore lane's south shoulder; the plot's north thread
// junction (5,11) takes its copy at (4,10), the plot's NW
// corner. Two nearer seats were measured and rejected: (7,16)
// and (7,14) both sit on the plot's own edge, where their
// desire paths cut the encounter grass and drag the town
// fabric under the gate — (8,16) and (4,10) approach on fabric
// from every POI ---
set(19, 11, 'sign', 'dirs-copy', ['tg2-sootopolis']);
set(8, 16, 'sign', 'dirs-copy', GROUND);
set(4, 10, 'sign', 'dirs-copy', GROUND);

export const ROWS = out.map((r) => r.join(''));
export { T37_KIND_CHARS };
