// Raw grids for the ids in env IDS (comma list), chars verbatim + kind histograms.
import { MAPS5 } from '../src/data/maps5.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
for (const id of (process.env.IDS || '').split(',').filter(Boolean)) {
  const m = MAPS5[id]; if (!m) { console.log(id, 'MISSING'); continue; }
  console.log(`\n### maps5:${id} "${m.name}"`);
  m.rows.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r));
  console.log('   ' + [...m.rows[0]].map((_, x) => String(x % 10)).join(''));
  const kinds = {};
  for (const r of m.rows) for (const ch of r) kinds[TILE_CHARS[ch] || ('?' + ch)] = (kinds[TILE_CHARS[ch] || ('?' + ch)] || 0) + 1;
  console.log('kinds:', Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' '));
  console.log('warps:', (m.warps || []).map(w => `(${w.x},${w.y})[${m.rows[w.y][w.x]}]->${w.to.map}(${w.to.x},${w.to.y})`).join(' '));
  console.log('npcs:', (m.npcs || []).map(n => `${n.name}@${n.x},${n.y}[${TILE_CHARS[m.rows[n.y][n.x]]}]`).join(' '), '| signs:', (m.signs || []).map(s => `${s.x},${s.y}[${TILE_CHARS[m.rows[s.y][s.x]]}]`).join(' '));
}
