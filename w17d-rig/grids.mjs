// Raw per-file grids: every cell printed as its kind name initial map.
// Prints chars verbatim too (caves use non-route vocab — read the chars).
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
for (const [file, pack] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  for (const id of ['route20','route22','moon1','moon2','rocktunnel']) {
    const m = pack[id]; if (!m) continue;
    console.log(`\n### ${file}:${id} "${m.name}"`);
    m.rows.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r));
    const kinds = {};
    for (const r of m.rows) for (const ch of r) kinds[TILE_CHARS[ch] || ('?' + ch)] = (kinds[TILE_CHARS[ch] || ('?' + ch)] || 0) + 1;
    console.log('kinds:', Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' '));
    console.log('warps:', (m.warps || []).map(w => `(${w.x},${w.y})[${m.rows[w.y][w.x]}]->${w.to.map}(${w.to.x},${w.to.y})`).join(' '));
    console.log('npcs:', (m.npcs || []).map(n => `${n.name}@${n.x},${n.y}[${m.rows[n.y][n.x]}]`).join(' '), '| signs:', (m.signs || []).map(s => `${s.x},${s.y}[${m.rows[s.y][s.x]}]`).join(' '));
    console.log('encounters:', m.encounters ? JSON.stringify(m.encounters) : 'null');
  }
}
