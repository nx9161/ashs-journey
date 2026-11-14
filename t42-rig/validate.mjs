// Wave T42 rig: score the candidate jubilife grid with the REAL
// audit code before any data file is touched, and prove the diff
// discipline: every changed cell is a declared change, encounter
// cells never move, stamps change only at the declared roof cells.
import { loadMaps, analyzeMap, makeTiers } from '/home/hatch/workspace/ashs-journey-t42/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t42/scripts/audit-placement.mjs';
import { ROWS, CHANGES } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const shipped = MAPS['jubilife'];
const tiers = tiersFor('jubilife', makeTiers(TILE_CHARS));

// --- NPC override: the orphaned clerk re-seats at the Mart's apron ---
const CLERK_TO = [9, 4];
const npcs = shipped.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: CLERK_TO[0], y: CLERK_TO[1] } : n));
// --- sign copies: verbatim DIRS records at validator-named bare junctions ---
const DIRS_TEXT = shipped.signs.find((s) => s.x === 16 && s.y === 12).text;
const COPIES = [[12, 5], [6, 12], [2, 13]];
const signs = [...shipped.signs, ...COPIES.map(([x, y]) => ({ x, y, text: DIRS_TEXT }))];

const cand = { ...shipped, rows: ROWS, npcs, signs };

// --- diff discipline ---
const declared = new Map();
for (const c of CHANGES) declared.set(c.x + ',' + c.y, c.to);
const errors = [];
let diffs = 0, tg2Left = 0, beamfloor = 0;
for (let y = 0; y < ROWS.length; y++) for (let x = 0; x < ROWS[0].length; x++) {
  const a = shipped.rows[y][x], b = ROWS[y][x];
  const kb = TILE_CHARS[b];
  if (kb === 'tg2-jubilife') tg2Left++;
  if (kb === 'beamfloor') beamfloor++;
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
// stamp footprints: within each stamp's bounding box only the
// declared roof cells may change (avenue/blanket cells between
// the stamps are outside the boxes and change freely).
const stampOk = new Set(['15,2', '16,2', '17,2', '18,2']);
for (const [x0, x1, y0, y1, ok] of [[3, 6, 2, 3, new Set()], [9, 12, 2, 3, new Set()], [15, 18, 2, 3, stampOk], [21, 23, 2, 3, new Set()], [3, 5, 11, 12, new Set(['3,11', '4,11', '5,11'])]]) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (shipped.rows[y][x] !== ROWS[y][x] && !ok.has(x + ',' + y))
      errors.push(`STAMP CELL MOVED at (${x},${y}) stamp box ${x0}-${x1},${y0}-${y1}`);
  }
}
// sacred singles: doors, on-tile signs, posts, dressing
for (const [x, y, why] of [[4, 3, 'center-door'], [10, 3, 'mart-door'], [16, 3, 'tv-door'], [22, 3, 'house-door'], [4, 12, 'condo-door'], [2, 5, 'town-sign'], [24, 4, 'tv-sign'], [11, 7, 'VESK-post'], [18, 12, 'MOSS-post'], [1, 4, 'lamp'], [19, 4, 'bikestand'], [18, 17, 'postbox'], [8, 3, 'switchboard'], [12, 12, 'fence'], [15, 12, 'fence']]) {
  if (shipped.rows[y][x] !== ROWS[y][x]) errors.push(`SACRED CELL MOVED at (${x},${y}): ${why}`);
}
console.log('diff cells:', diffs, '| declared:', declared.size, '| tg2 left:', tg2Left, '| beamfloor:', beamfloor);
for (const e of errors) console.log('  !!', e);
if (errors.length) { console.log('DIFF DISCIPLINE FAILED'); process.exit(1); }

// --- gates with the real audit code ---
const townSet = new Set(Object.keys(MAPS));
const r = await scoreTown('jubilife', { jubilife: cand }, WALKABLE, tiers);
const clarity = analyzeMap('jubilife', cand, { WALKABLE, tiers, townSet });
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
console.log('connFails:', JSON.stringify((r.connFails || []).slice(0, 6)));
