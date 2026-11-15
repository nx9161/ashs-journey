// W17-AD parity proof: independently recompute each lane's
// expected rows from the before-snapshot + transforms.mjs
// (clear-then-stamp clusters, then sand/rock kind swaps) and
// compare EXACTLY against the shipped maps5 definitions;
// non-row fields (encounters, warps, all records) must be
// JSON-identical; per-kind counts must match the census
// modulo the two conversions; warp cells byte-identical;
// the literal trigger census holds ('~' water count exact,
// 'R' converts entire, no 'W'/'L'/'G'/'.' ever appears).
import fs from 'node:fs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import { CH, CLUSTERS, LANES } from './transforms.mjs';
const before = JSON.parse(fs.readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
const kindOf = (ch) => TILE_CHARS[ch] || ('?' + ch);
let bad = 0;
for (const [id, lane] of Object.entries(LANES)) {
  const b = before['maps5:' + id]; const a = MAPS5[id];
  if (!a) { console.log(id, 'MISSING after'); bad++; continue; }
  const { rows: br, ...bRest } = b; const { rows: ar, ...aRest } = a;
  if (JSON.stringify(bRest) !== JSON.stringify(aRest)) { console.log(id, 'NON-ROW FIELDS DIFFER'); bad++; }
  // Recompute expected rows.
  const rows = br.map((r) => [...r]);
  const clusterCells = new Set();
  for (const [cx, cy] of Object.values(CLUSTERS)) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) clusterCells.add((cx + dx) + ',' + (cy + dy));
  const out = rows.map((r) => r.slice());
  for (const key of clusterCells) { const [x, y] = key.split(',').map(Number); out[y][x] = '~'; }
  for (const [cid, mv] of Object.entries(lane.move)) {
    const [cx, cy] = CLUSTERS[cid]; const [tx, ty] = mv.to;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) out[ty + dy][tx + dx] = rows[cy + (mv.flip ? 1 - dy : dy)][cx + dx];
  }
  const sandCh = CH(lane.sand), rockCh = CH(lane.rock);
  const expected = out.map((r) => r.map((ch) => { const k = kindOf(ch); return k === 'sand' ? sandCh : k === 'rock' ? rockCh : ch; }).join(''));
  if (JSON.stringify(expected) !== JSON.stringify(ar)) { console.log(id, 'ROWS != expected recomputation'); bad++;
    for (let y = 0; y < ar.length; y++) if (expected[y] !== ar[y]) console.log('  row', y, '\n   exp', expected[y], '\n   got', ar[y]);
  }
  for (const w of b.warps || []) if (ar[w.y][w.x] !== br[w.y][w.x]) { console.log(id, 'WARP CELL CHANGED', w.x, w.y); bad++; }
  const cnt = (rs, ch) => rs.join('').split('').filter((c) => c === ch).length;
  for (const ch of ['~', 'W', 'L', 'G', '.']) if (cnt(ar, ch) !== cnt(br, ch)) { console.log(id, 'trigger char', JSON.stringify(ch), cnt(br, ch), '->', cnt(ar, ch)); bad++; }
  if (cnt(ar, 'R') !== 0) { console.log(id, "'R' remains:", cnt(ar, 'R')); bad++; }
  const kc = (rs) => { const c = {}; for (const r of rs) for (const ch of r) c[kindOf(ch)] = (c[kindOf(ch)] || 0) + 1; return c; };
  const ac = kc(ar);
  console.log(id, 'cells:', ar.length * ar[0].length, '| kinds after:', Object.entries(ac).sort((p, q) => q[1] - p[1]).map(([k, n]) => `${k}:${n}`).join(' '));
}
console.log(bad === 0 ? 'PARITY OK' : `PARITY FAILURES: ${bad}`);
process.exit(bad ? 1 : 0);
