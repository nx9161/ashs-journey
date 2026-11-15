// W17-AA census: Borea Tranche 7 (r222, r218, r219, r220,
// r221) — the beach road, the causeway, the south sea.
// Measured with the game's own loader (audit-desire-paths
// loadMaps over merged MAPS), plus per-file definition
// state from the MAPS5 pack (Borea's only file).
import { loadMaps } from '../scripts/audit-desire-paths.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
const { MAPS, TILE_CHARS } = await loadMaps(false);
export const IDS = ['orange-sea-west', 'orange-sea-central', 'orange-sea-east', 'orange-sea-north'];
for (const id of IDS) {
  const m = MAPS[id];
  if (!m) { console.log(`\n### ${id}: MISSING`); continue; }
  const in9 = !!MAPS5[id];
  const same = in9 && JSON.stringify(MAPS5[id]) === JSON.stringify(m);
  const H = m.rows.length, W = m.rows[0].length;
  const counts = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = TILE_CHARS[m.rows[y][x]] || ('?' + m.rows[y][x]); counts.set(k, (counts.get(k) || 0) + 1); }
  const hist = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' ');
  console.log(`\n### ${id} "${m.name}" ${W}x${H} indoor=${!!m.indoor} dark=${!!m.dark} weather=${m.weather || '-'} music=${m.music || '-'} maps5=${in9} maps5==merged:${same}`);
  console.log(`kinds: ${hist}`);
  console.log(`warps: ${(m.warps || []).map(w => `(${w.x},${w.y})[${TILE_CHARS[m.rows[w.y][w.x]]}]->${w.to.map}(${w.to.x},${w.to.y})`).join(' ')}`);
  console.log(`signs: ${(m.signs || []).map(s => `(${s.x},${s.y})[${TILE_CHARS[m.rows[s.y][s.x]]}] "${s.text}"`).join(' | ')}`);
  console.log(`npcs: ${(m.npcs || []).map(n => `${n.name}(${n.x},${n.y})[${TILE_CHARS[m.rows[n.y][n.x]]}]`).join(' ')}`);
  console.log(`items: ${JSON.stringify(m.items || [])} hidden: ${JSON.stringify(m.hiddenItems || m.hidden || [])}`);
  console.log(`events: ${JSON.stringify(m.events || [])}`);
  console.log(`encounters: ${JSON.stringify(m.encounters)}`);
  const flat = m.rows.join('');
  const cnt = (ch) => flat.split('').filter((c) => c === ch).length;
  console.log(`trigger census: '.'=${cnt('.')} 'R'=${cnt('R')} ','=${cnt(',')} '~'=${cnt('~')} 'W'=${cnt('W')} 'L'=${cnt('L')} 'G'=${cnt('G')} enc.cave=${m.encounters ? !!m.encounters.cave : 'n/a'}`);
}
