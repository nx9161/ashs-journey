// T37 shipped-gates probe: sandgem exactly as shipped, real audit code + footprint dump.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t41/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor, STREET_REGISTRY } from '/home/hatch/workspace/ashs-journey-t41/scripts/audit-placement.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const tiers = makeTiers(TILE_CHARS);
const clarity0 = analyzeMap('sandgem', MAPS.sandgem, { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const r = await scoreTown('sandgem', MAPS, WALKABLE, tiersFor('sandgem', tiers));
const gate = gateCheck(r, clarity0);
console.log('GATE:', JSON.stringify(gate, null, 1));
console.log('examples:', JSON.stringify(r.examples));
console.log('connFails:', JSON.stringify(r.connFails));
console.log('junctionSites:', JSON.stringify(r.junctionSites), 'junctions:', r.junctions, 'bare:', r.junctionsBare);
console.log('GUARD TUPLE:', JSON.stringify([gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged, r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny, +clarity0.meanStrict.toFixed(4), +clarity0.meanFabric.toFixed(4)]));
console.log('netCompSizes:', JSON.stringify(r.netCompSizes));
console.log('lamps:', r.lamps, 'unlit:', r.unlitFrac, 'onFabric:', JSON.stringify(r.onFabricList), 'shoulder:', JSON.stringify(r.shoulderList));
console.log('buildings count:', r.buildings.length);
// per-footprint apron dump (replicates scoreTown R5 with detail)
const kind = (ch) => TILE_CHARS[ch];
const m = MAPS.sandgem, H = m.rows.length, W = m.rows[0].length;
const cell = (x, y) => m.rows[y][x];
const BUILD = (k) => k.startsWith('roof') || k.startsWith('wall') || k.startsWith('door') || k.startsWith('th-') || k.startsWith('tr-') || k.startsWith('tl-') || k.startsWith('tw-') || ['house', 'gymwall', 'gymdoor', 'centerdoor', 'gym-rock', 'gym-volt', 'fossildisplay', 'dresswindow', 'ancientpillar', 'drakeroof', 'parapetroof', 'slabroof', 'cedarroof', 'thatchroof', 'sageroof', 'towerroof', 'mossroof', 'pineroof', 'coproof', 'safariroof', 'surfroof', 'shackroof', 'slateroof', 'glassroof', 'canvasroof', 'mansardroof', 'copperroof', 'bronzroof', 'shingleroof', 'sakuraroof', 'trellisroof', 'beaconroof', 'timberroof', 'steamroof', 'leafroof', 'lotusroof'].includes(k);
const bcomp = new Map(); let bnc = 0; const footprints = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!BUILD(kind(cell(x, y))) || bcomp.has(y * W + x)) continue;
  const cells = []; const q = [[x, y]]; bcomp.set(y * W + x, bnc);
  while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!bcomp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && BUILD(kind(cell(nx, ny)))) { bcomp.set(k, bnc); q.push([nx, ny]); } } }
  if (cells.length >= 3) footprints.push(cells); bnc++;
}
for (const fp of footprints) {
  const ring = new Set();
  for (const [x, y] of fp) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    if (kind(cell(nx, ny)) === 'cavewall') continue;
    if (!bcomp.has(ny * W + nx)) ring.add(ny * W + nx); }
  let clear = 0; const unclear = [];
  for (const k of ring) { const cx = k % W, cy = (k / W) | 0; if (WALKABLE.has(cell(cx, cy))) clear++; else unclear.push(`${kind(cell(cx, cy))}@${cx},${cy}`); }
  const frac = ring.size ? clear / ring.size : 1;
  console.log(`FOOTPRINT cells=${JSON.stringify(fp)} ring=${ring.size} clear=${clear} frac=${frac.toFixed(3)} unclear=[${unclear.join(' ')}]`);
}
