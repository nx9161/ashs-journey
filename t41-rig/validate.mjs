// Wave T41 rig: score the candidate sandgem grid with the REAL
// audit code before any data file is touched, and prove the diff
// discipline: every changed cell is a declared change, the beach
// kinds move only at the declared restoration/prop cells, the
// stamps change only at the Center's four restored cells.
import { loadMaps, analyzeMap, makeTiers } from '/home/hatch/workspace/ashs-journey-t41/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t41/scripts/audit-placement.mjs';
import { ROWS, CHANGES, COPIES as ROW_COPIES } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const shipped = MAPS['sandgem'];
const tiers = tiersFor('sandgem', makeTiers(TILE_CHARS));

// --- NPC override: the orphaned clerk re-seats at the Mart's apron ---
const CLERK_TO = [17, 4];
const npcs = shipped.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: CLERK_TO[0], y: CLERK_TO[1] } : n));
// --- sign copies: verbatim DIRS records at validator-named bare junctions ---
const DIRS_TEXT = shipped.signs.find((s) => s.x === 7 && s.y === 11).text;
const COPIES = ROW_COPIES;
const signs = [...shipped.signs, ...COPIES.map(([x, y]) => ({ x, y, text: DIRS_TEXT }))];

const cand = { ...shipped, rows: ROWS, npcs, signs };

// --- diff discipline ---
const declared = new Map();
for (const c of CHANGES) declared.set(c.x + ',' + c.y, c.to);
for (const [x, y] of COPIES) declared.set(x + ',' + y, 'sign');
const errors = [];
let diffs = 0, tg2Left = 0, shellfloor = 0;
const BEACH = new Set(['psand-s', 'psand-w', 'psand-e', 'sand']);
const BEACH_OK = new Set(['13,13', '14,13', '14,15', '18,13', '7,13', '3,13']);
for (let y = 0; y < ROWS.length; y++) for (let x = 0; x < ROWS[0].length; x++) {
  const a = shipped.rows[y][x], b = ROWS[y][x];
  const kb = TILE_CHARS[b], ka = TILE_CHARS[a];
  if (kb === 'tg2-sandgem') tg2Left++;
  if (kb === 'shellfloor') shellfloor++;
  if (a === b) continue;
  diffs++;
  const want = declared.get(x + ',' + y);
  if (!want) errors.push(`undeclared change at (${x},${y}): ${ka} -> ${kb}`);
  else if (want !== kb) errors.push(`change mismatch at (${x},${y}): declared ${want}, got ${kb}`);
  if (BEACH.has(ka) && !BEACH_OK.has(x + ',' + y)) errors.push(`BEACH CELL MOVED at (${x},${y}): ${ka} -> ${kb}`);
}
for (const key of declared.keys()) {
  const [x, y] = key.split(',').map(Number);
  if (shipped.rows[y][x] === ROWS[y][x] && !COPIES.some(([cx, cy]) => cx === x && cy === y)) errors.push(`declared change missing at (${x},${y})`);
}
// stamp discipline: any cell whose SHIPPED kind is a stamp kind
// (roof/wall/door of lab/center/mart) is byte-preserved; the only
// rows 2-3 changes allowed are the declared set — the Center's
// four restored cells (which shipped as tg2, not stamp kinds),
// the gap-lane street cells and blanket cells.
const STAMP_KIND = (k) => k && (k.startsWith('roof-') || k.startsWith('wall-') || k.startsWith('door-') || k === 'sign-center');
for (let y = 0; y < ROWS.length; y++) for (let x = 0; x < ROWS[0].length; x++) {
  if (STAMP_KIND(TILE_CHARS[shipped.rows[y][x]]) && shipped.rows[y][x] !== ROWS[y][x])
    errors.push(`STAMP CELL MOVED at (${x},${y}): ${TILE_CHARS[shipped.rows[y][x]]}`);
}
// sacred singles: doors, on-tile signs, ANA's post cell, dressing
for (const [x, y, why] of [[1, 3, 'lab-sign'], [16, 12, 'beach-sign'], [19, 13, 'ANA-post'], [4, 12, 'house-door'], [5, 3, 'lab-door-l'], [6, 3, 'lab-door-r'], [18, 3, 'mart-door-l'], [19, 3, 'mart-door-r'], [12, 3, 'center-door-l'], [13, 16, 'start'], [17, 1, 'lamp'], [1, 1, 'planter']]) {
  if (shipped.rows[y][x] !== ROWS[y][x]) errors.push(`SACRED CELL MOVED at (${x},${y}): ${why}`);
}
console.log('diff cells:', diffs, '| declared:', declared.size, '| tg2 left:', tg2Left, '| shellfloor:', shellfloor);
for (const e of errors) console.log('  !!', e);
if (errors.length) { console.log('DIFF DISCIPLINE FAILED'); process.exit(1); }

// --- gates with the real audit code ---
const townSet = new Set(Object.keys(MAPS));
const r = await scoreTown('sandgem', { sandgem: cand }, WALKABLE, tiers);
const clarity = analyzeMap('sandgem', cand, { WALKABLE, tiers, townSet });
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
console.log('connFails:', JSON.stringify((r.connFails || []).slice(0, 6)));
console.log('examples:', JSON.stringify((r.examples || []).slice(0, 5)));
// --- diagnostics (round 2+) ---
console.log('shoulderList:', JSON.stringify(r.shoulderList));
console.log('onFabricList:', JSON.stringify(r.onFabricList));
const routes = (clarity.routes || []).slice().sort((a, b) => (a.strict ?? 1) - (b.strict ?? 1));
for (const rt of routes.slice(0, 10)) console.log('route', rt.a, '<->', rt.b, 'strict=', rt.strict, 'fabric=', rt.fabric, 'len=', rt.len ?? rt.path);
// component membership of the non-main components
import { makeTiers as _mt } from '/home/hatch/workspace/ashs-journey-t41/scripts/audit-desire-paths.mjs';
const _tiers = tiersFor('sandgem', _mt(TILE_CHARS));
const net = (x, y) => _tiers.isNetwork(cand.rows[y][x]);
const comp = new Map(); let nc = 0;
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++) {
  if (!net(x, y) || comp.has(y * 28 + x)) continue;
  const cells = []; const q = [[x, y]]; comp.set(y * 28 + x, nc);
  while (q.length) { const [cx, cy] = q.pop(); cells.push(cx + ',' + cy);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < 28 && ny < 18 && net(nx, ny) && !comp.has(ny * 28 + nx)) { comp.set(ny * 28 + nx, nc); q.push([nx, ny]); } } }
  if (cells.length < 40) console.log('small component', nc, cells.length, JSON.stringify(cells));
  nc++;
}
