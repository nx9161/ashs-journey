// T64 census: shamouti exactly as shipped, game's own loaders.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const m = MAPS['shamouti'];
const H = m.rows.length, W = m.rows[0].length;
console.log(`dims ${W}x${H} music=${m.music} weather=${m.weather} start=${JSON.stringify(m.start)}`);
const counts = new Map(); const cells = new Map();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = TILE_CHARS[m.rows[y][x]] || ('?' + m.rows[y][x]);
  counts.set(k, (counts.get(k) || 0) + 1);
  if (!cells.has(k)) cells.set(k, []);
  cells.get(k).push([x, y]);
}
for (const [k, n] of [...counts.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`${k}: ${n}  ${JSON.stringify(cells.get(k))}`);
console.log('--- signs, tile under each:');
for (const s of m.signs || []) console.log(`(${s.x},${s.y}) on ${TILE_CHARS[m.rows[s.y][s.x]]} :: ${s.text}`);
console.log('--- npcs, tile under each:');
for (const n of m.npcs || []) console.log(`${n.name} (${n.x},${n.y}) on ${TILE_CHARS[m.rows[n.y][n.x]]}`);
console.log('--- warps:');
for (const w of m.warps || []) console.log(`(${w.x},${w.y}) on ${TILE_CHARS[m.rows[w.y][w.x]]} -> ${w.to.map} (${w.to.x},${w.to.y})${w.via ? ' via (' + w.via.x + ',' + w.via.y + ') on ' + TILE_CHARS[m.rows[w.via.y][w.via.x]] : ''}`);
console.log('--- inbound landings into shamouti:');
for (const [id, mm] of Object.entries(MAPS)) for (const w of mm.warps || [])
  if (w.to.map === 'shamouti') console.log(`${id} (${w.x},${w.y}) -> shamouti (${w.to.x},${w.to.y}) on ${TILE_CHARS[m.rows[w.to.y][w.to.x]]}`);
console.log('--- grid (kinds, abbreviated):');
const ab = (k) => ({ 'tg2-shamouti': 'M', 'tc-shamouti': 'T', 'tr-shamouti': 'R', 'th-shamouti': 'H', 'tl-shamouti': 'L', 'tw-shamouti': 'W', water: '~', sign: 'S', door: 'D' }[k] || (k === 'path' ? '.' : k ? k.slice(0, 1) : '?'));
for (let y = 0; y < H; y++) {
  let line = '';
  for (let x = 0; x < W; x++) line += ab(TILE_CHARS[m.rows[y][x]] || '?');
  console.log(String(y).padStart(2) + ' ' + line);
}
