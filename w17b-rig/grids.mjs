import { loadMaps } from '../scripts/audit-desire-paths.mjs';
const { MAPS, TILE_CHARS } = await loadMaps(false);
for (const id of ['route6','route7','route8','route9','route10']) {
  const m = MAPS[id]; console.log(`\n### ${id}`);
  m.rows.forEach((r,y)=>{ let s=''; for (const ch of r) { const k=TILE_CHARS[ch]||'?'; s += k==='grassground'?'_':k==='path'?'.':k==='grass'?',':k==='tree'?'#':k==='water'?'~':k==='sign'?'S':'*'; } console.log(String(y).padStart(2)+' '+s); });
  console.log('npcs', (m.npcs||[]).map(n=>`${n.name}@${n.x},${n.y}`).join(' '), '| signs', (m.signs||[]).map(s=>`${s.x},${s.y}`).join(' '));
}
