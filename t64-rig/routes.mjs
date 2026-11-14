// T64 diag: desire routes on the CANDIDATE via analyzeMap —
// worst fractions + the non-fabric cells they use, counted.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';
const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const src = MAPS['shamouti'];
const DIRS_TEXT = src.signs.find((s) => s.x === 8 && s.y === 7).text;
const npcs = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 19, y: 4 } : n));
const signs = [...src.signs, ...COPY_SEATS.map(([x, y]) => ({ x, y, text: DIRS_TEXT }))];
const CAND = { ...src, rows: CANDIDATE, npcs, signs };
const tiers = makeTiers(TILE_CHARS);
const c = analyzeMap('shamouti', CAND, { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const kind = (x, y) => TILE_CHARS[CANDIDATE[y][x]];
const cellUse = {};
const rows = c.routes.map((r) => {
  const bad = [];
  for (const [x, y] of r.path) if (!tiers.isFabric(CANDIDATE[y][x])) { bad.push(kind(x, y) + '@' + x + ',' + y); cellUse[x + ',' + y] = (cellUse[x + ',' + y] || 0) + 1; }
  return { f: r.fStrict, a: r.a, b: r.b, bad: bad.join(' ') };
}).sort((a, b) => a.f - b.f);
console.log('pairs', c.pairs, 'meanFabric', c.meanFabric, 'meanStrict', c.meanStrict);
for (const r of rows.slice(0, 22)) console.log(r.f, r.a, '<->', r.b, '::', r.bad);
console.log('top non-fabric route cells:', Object.entries(cellUse).sort((a, b) => b[1] - a[1]).slice(0, 26).map(([cc, n]) => cc + '(' + kind(+cc.split(',')[0], +cc.split(',')[1]) + ')x' + n).join(' '));
