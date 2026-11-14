// Wave T64 rig: build the Sanctum candidate grid from the
// shipped rows (WAVE-T64-SANCTUM-PLAN.md §6). The street graph
// converts 1:1 (path -> stepfloor), all eight surf exits gain
// stepfloor jetty heads + necks (four directions; the inbound
// landing cells stay water), the north shore gains its sand
// rim behind the stamps (apron repair; the ice-isle landings
// (2,1),(3,1) excepted), the Sanctum Shrine stamp takes the
// vermillion shrineroof, the five invisible signs gain their
// tiles, and the kit props take their seats. LANE cells are
// added only on the validator's printed evidence. COPY_SEATS
// stays empty unless the validator names a bare junction.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';

const { MAPS, TILE_CHARS } = await loadMaps(false);
const src = MAPS['shamouti'];
const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;

const grid = src.rows.map((r) => [...r]);
const set = (x, y, kind) => { grid[y][x] = CH[kind]; };

// street graph 1:1: every shipped path cell -> stepfloor
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++)
  if (grid[y][x] === CH['path']) grid[y][x] = CH['stepfloor'];

// the jetty heads + necks: the surf exits STAND on the kit
// floor (the T59/T61/T62 pattern — the conn BFS seeds only on
// network cells, so the exit cells themselves carry the floor
// kind; the warp records are untouched). The inbound landing
// cells (1,6),(1,7),(2,1),(3,1),(26,6),(26,7),(13,16) are NOT
// necks and stay water as shipped.
for (const [x, y] of [
  [2, 17], [3, 17], [2, 16], [3, 16],   // S exits + necks
  [0, 8], [0, 9], [1, 8], [1, 9],       // W exits + necks
  [27, 8], [27, 9], [26, 8], [26, 9],   // E exits + necks
  [13, 0], [14, 0], [13, 1], [14, 1],   // N exits + necks
]) set(x, y, 'stepfloor');

// the north shore rim (apron repair): row 1 behind the stamps
// in the island's own sand — EXCEPT the north jetty necks
// (13,1),(14,1) (stepfloor above), the ice-isle landings
// (2,1),(3,1) (stay water), and (26,1) (no stamp ring
// reaches it; stays water).
for (let x = 4; x <= 12; x++) set(x, 1, 'sand');
for (let x = 15; x <= 25; x++) set(x, 1, 'sand');

// the Sanctum Shrine stamp takes the vermillion shrineroof
// (its four shipped roof-teal cells; geometry/door/step-off
// byte-kept — the fleet's roof-swap register, plan §3.3)
for (const [x, y] of [[3, 2], [4, 2], [5, 2], [6, 2]]) set(x, y, 'shrineroof');

// the five invisible signs gain their tiles
set(13, 9, 'sign');   // SHRINE PLAZA (was shrinefloor)
set(8, 7, 'sign');    // DIRS (was path)
set(8, 10, 'sign');   // DIRS (was path)
set(3, 14, 'sign');   // DIRS (was path)
set(19, 5, 'sign');   // MART (was path)

// the clerk's post cell: the town's only flower stood on the
// Mart's west-front apron — it takes stepfloor as his post
// (plan §6; the flower was doorstep decor, the clerk is the
// Mart's own)
set(19, 4, 'stepfloor');

// props: the festival lantern pair at the plaza's NE + SE
// shoulders (tropgrass); the nobori banner at the ferry
// landing's east shoulder (sand)
set(17, 6, 'festlantern');
set(18, 13, 'festlantern');
set(16, 15, 'fairbanner');

// the shipped signpost re-seats at the Mart's east shore
// corner (23,3): the threaded shore roads straddle both its
// shipped post (19,6) E+W and the grove corner (19,7) E+W
// (the validator's onFabric straddle, rounds 1-2). At (23,3)
// it stands on the Mart stamp's own shore cell, beside its
// sign tile's building, with no opposite network pair; its
// shipped cell and the grove corner revert to tropgrass.
set(19, 6, 'tropgrass');
set(23, 3, 'signpost');

// lane threading — added only on the validator's printed
// evidence (routes.mjs round 1 on the un-threaded candidate):
// the desire lines run the north rim to the Mart, the grove's
// row-8 crossing + west edge to the east jetty, the east
// shore column, the row-10 east crossing, and two stamp-gap
// cells. Grass encounter cells are NEVER threaded (the plots
// are byte-preserved, plan §4).
export const LANE = [
  [15, 1], [16, 1], [17, 1], [18, 1], [18, 2], [18, 3], [18, 4], // rim + shore lane: ice-isle lines to the Mart/clerk (x74 on (18,4))
  [18, 8], [19, 8], [20, 8], [21, 8], [22, 8], [23, 8], [24, 8], // grove row-8 crossing to the east jetty (x26-28)
  [20, 6], [20, 7], [21, 6], [21, 7], // grove west edge: Mart/house lines to the east jetty
  [18, 6], [18, 9], [18, 10], [18, 11], [18, 12], // east shore column ((18,8) is in the row-8 crossing; (18,7) stays tropgrass — threading it straddled the re-seated signpost E+W, round-1 validator)
  [17, 12], [17, 13], [17, 14], [16, 14], // the column's south link to the marina row
  [19, 10], [20, 10], [21, 10], [22, 10], [23, 10], [24, 10], [25, 10], // row-10 east crossing: plaza lines to the east shore
  [13, 3], [13, 6], // stamp-gap cells on the Center/House desire lines (x17)
  [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [8, 2], [8, 3], // round 2: the west rim lane + the spur to the west DIRS — the ice-isle lines to sign@8,7 (0.417/0.462)
  [7, 1], [7, 2], [7, 3], // round 2: the shrine's west shore — ice-isle lines to the marina posts
  [2, 10], [2, 11], [2, 12], [2, 13], // round 2: the west shore column — fire-isle lines to the marina posts (0.6)
  [18, 14], [19, 14], [20, 14], [21, 14], [22, 14], [23, 14], [25, 13], [25, 12], [25, 11], // round 3: the SE shore lane — sea-north <-> lightning-isle lines (x11). NOT (24,13): threading it straddles the marina lifering (24,14) N+S; NOT (23,13): E-plot grass, byte-preserved
  [22, 4], [23, 4], [24, 4], [25, 4], [25, 5], [25, 6], [22, 6], [23, 6], [23, 7], [24, 7], // round 3: the Mart's east shore + the east jetty's west shore — the copy sign's own desire lines (0.42-0.69)
  [19, 9], [20, 9], [21, 9], [22, 9], // round 3: the grove row-9 crossing — plaza lines to the east jetty
  [18, 7], [19, 6], // round 3: the shore column + the signpost's shipped cell, freed by the signpost's re-seat to (23,3)
  [2, 4], [2, 5], [2, 6], // round 3: the west shore column's north arm (x9)
  [11, 6], // round 3: the single ground cell on the shrine lines west of the plaza (x12)
  [19, 1], [20, 1], [21, 1], [22, 1], [23, 1], [24, 1], [25, 1], [25, 2], [25, 3], // round 4: the east rim lane — the ice-isle lines to the copy sign run the whole north shore (0.5/0.526)
  [19, 7], // round 4: the grove corner, freed when the signpost re-seated to (23,3) (x7)
  [19, 11], [5, 11], [20, 11], [20, 12], [20, 13], // round 4: printed micro-cells on the plaza/east + shrine lines (x2-3 each). NOT (24,13): threading it straddles the marina lifering (24,14) N+S (onFabric) — proven trade-off, dossier
];
for (const [x, y] of LANE) set(x, y, 'stepfloor');

// verbatim DIRS copies at validator-named bare junctions only
// (round 1: the east jetty site [[25,8],[26,9],[25,9],[26,8]]
// is bare. Round 2 moved the seat from the sand shoulder
// (24,7) — whose own desire routes wandered the open rim
// (0.41-0.57) — to the jetty street's own shore cell (25,7),
// the only other cell within Chebyshev 2 of all four site
// cells; its routes step off the fabric at the last cell)
export const COPY_SEATS = [
  [25, 7],
  [18, 2], // round 4: the north-jetty rim junction [[18,1]] is bare — the copy stands on the sand shoulder between the House and Mart roofs, directly under the junction cell ((17,2)/(19,2) were tried first and are roof cells — the validator's stamp checks caught both)
  [20, 15], // round 4: the SE-lane junction [[20,14]] is bare — the copy stands on the marina shore at the lane's corner
];
for (const [x, y] of COPY_SEATS) set(x, y, 'sign');

export const CANDIDATE = grid.map((r) => r.join(''));
