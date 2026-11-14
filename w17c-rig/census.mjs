import { loadMaps } from '../scripts/audit-desire-paths.mjs';
const { MAPS, TILE_CHARS } = await loadMaps(false);
const IDS = ['route11','route12','route15','route16','route19'];
for (const id of IDS) {
  const m = MAPS[id];
  if (!m) { console.log(`\n### ${id}: MISSING`); continue; }
  const H = m.rows.length, W = m.rows[0].length;
  const counts = new Map();
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) { const k = TILE_CHARS[m.rows[y][x]] || ('?'+m.rows[y][x]); counts.set(k,(counts.get(k)||0)+1); }
  const hist = [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k}:${n}`).join(' ');
  console.log(`\n### ${id} "${m.name}" ${W}x${H} indoor=${!!m.indoor} dark=${!!m.dark} weather=${m.weather||'-'}`);
  console.log(`kinds: ${hist}`);
  console.log(`warps: ${(m.warps||[]).map(w=>`(${w.x},${w.y})->${w.to.map}(${w.to.x},${w.to.y})`).join(' ')}`);
  console.log(`signs: ${(m.signs||[]).map(s=>`(${s.x},${s.y})[${TILE_CHARS[m.rows[s.y][s.x]]}] "${s.text}"`).join(' | ')}`);
  console.log(`npcs: ${(m.npcs||[]).map(n=>`${n.name}(${n.x},${n.y})`).join(' ')}`);
  console.log(`encounters: ${m.encounters ? `rate=${m.encounters.rate} table=${m.encounters.table.map(t=>`${t.species}:${t.min}-${t.max}w${t.weight}`).join(',')}` : 'null'}`);
}
