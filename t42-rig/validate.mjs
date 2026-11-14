// Wave T40 rig: score the candidate twinleaf grid with the REAL
// audit code before any data file is touched, and prove the diff
// discipline: every changed cell is a declared change, encounter
// cells never move, stamps change only at the declared roof cells.
import { loadMaps, analyzeMap, makeTiers } from '/home/hatch/workspace/ashs-journey-t40/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t40/scripts/audit-placement.mjs';
import { ROWS, CHANGES } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const shipped = MAPS['twinleaf'];
const tiers = tiersFor('twinleaf', makeTiers(TILE_CHARS));

// --- NPC override: the orphaned clerk re-seats at the Mart's apron ---
const CLERK_TO = [19, 4];
const npcs = shipped.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: CLERK_TO[0], y: CLERK_TO[1] } : n));
// --- sign copies: verbatim DIRS records at validator-named bare junctions ---
const DIRS_TEXT = shipped.signs.find((s) => s.x === 7 && s.y === 12).text;
const COPIES = [[15, 5]];
const signs = [...shipped.signs, ...COPIES.map(([x, y]) => ({ x, y, text: DIRS_TEXT }))];

const cand = { ...shipped, rows: ROWS, npcs, signs };

// --- diff discipline ---
const declared = new Map();
for (const c of CHANGES) declared.set(c.x + ',' + c.y, c.to);
const errors = [];
let diffs = 0, tg2Left = 0, cloverfloor = 0;
for (let y = 0; y < ROWS.length; y++) for (let x = 0; x < ROWS[0].length; x++) {
  const a = shipped.rows[y][x], b = ROWS[y][x];
  const kb = TILE_CHARS[b];
  if (kb === 'tg2-twinleaf') tg2Left++;
  if (kb === 'cloverfloor') cloverfloor++;
  if (a === b) continue;
  diffs++;
  const want = declared.get(x + ',' + y);
  if (!want) errors.push(`undeclared change at (${x},${y}): ${TILE_CHARS[a]} -> ${kb}`);
  else if (want !== kb) errors.push(`change mismatch at (${x},${y}): declared ${want}, got ${kb}`);
  const ka = TILE_CHARS[a];
  if (ka === 'grass' || ka === 'path') errors.push(`ENCOUNTER CELL MOVED at (${x},${y}): ${ka}`);
}
for (const key of declared.keys()) {
  const [x, y] = key.split(',').map(Number);
  if (shipped.rows[y][x] === ROWS[y][x]) errors.push(`declared change missing at (${x},${y})`);
}
// stamps rows 2-3: only the two houses' roof cells may change (th -> battenroof)
const stampOk = new Set(['3,2', '4,2', '5,2', '8,2', '9,2', '10,2']);
for (let y = 2; y <= 3; y++) for (let x = 0; x < ROWS[0].length; x++) {
  if (shipped.rows[y][x] !== ROWS[y][x] && !stampOk.has(x + ',' + y))
    errors.push(`STAMP CELL MOVED at (${x},${y})`);
}
// sacred singles: doors, on-tile signs, TAM's plot-frame cell, dressing posts
for (const [x, y, why] of [[4, 3, 'house1-door'], [9, 3, 'house2-door'], [2, 5, 'town-sign'], [15, 15, 'lake-sign'], [6, 13, 'TAM-post'], [12, 3, 'flower'], [20, 5, 'flower'], [21, 7, 'flower'], [12, 16, 'fence'], [3, 16, 'fence']]) {
  if (shipped.rows[y][x] !== ROWS[y][x]) errors.push(`SACRED CELL MOVED at (${x},${y}): ${why}`);
}
console.log('diff cells:', diffs, '| declared:', declared.size, '| tg2 left:', tg2Left, '| cloverfloor:', cloverfloor);
for (const e of errors) console.log('  !!', e);
if (errors.length) { console.log('DIFF DISCIPLINE FAILED'); process.exit(1); }

// --- gates with the real audit code ---
const townSet = new Set(Object.keys(MAPS));
const r = await scoreTown('twinleaf', { twinleaf: cand }, WALKABLE, tiers);
const clarity = analyzeMap('twinleaf', cand, { WALKABLE, tiers, townSet });
r.strict = clarity.meanStrict; r.fabric = clarity.meanFabric;
const gate = gateCheck(r, clarity);
const tuple = [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, r.apronMin, r.merged, r.onFabric, r.shoulderOrphans, r.unanchoredAny, r.strict, r.fabric];
console.log('tuple:', JSON.stringify(tuple));
console.log('GATES', gate.pass ? 'PASS' : 'FAIL: ' + gate.gates.filter((g) => !g.ok).map((g) => g.name + ' (' + g.detail + ')').join('; '));
console.log('components:', r.netCompSizes.join('+'), '| lamps:', r.lamps, 'unlit:', r.unlitFrac, '| tight:', r.tight, '| isoTrees:', r.treesIsolated);
if (r.junctionSites) {
  const signPts = signs.map((s) => [s.x, s.y]);
  const cheb = (a, b, c, d) => Math.max(Math.abs(a - c), Math.abs(b - d));
  r.junctionSites.forEach((site, i) => {
    const covered = signPts.some(([sx, sy]) => site.some(([jx, jy]) => cheb(jx, jy, sx, sy) <= 2));
    console.log('junction site', i, covered ? 'covered' : 'BARE', JSON.stringify(site));
  });
}
console.log('examples:', JSON.stringify((r.examples || []).slice(0, 5)));
