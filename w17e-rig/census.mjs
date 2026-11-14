import { loadMaps } from '../scripts/audit-desire-paths.mjs';
const { MAPS, TILE_CHARS } = await loadMaps(false);
const m = MAPS['victoryroad'];
const H = m.rows.length, W = m.rows[0].length;
const counts = new Map();
for (let y=0;y<H;y++) for (let x=0;x<W;x++) { const k = TILE_CHARS[m.rows[y][x]] || ('?'+m.rows[y][x]); counts.set(k,(counts.get(k)||0)+1); }
console.log(`LIVE victoryroad "${m.name}" ${W}x${H} indoor=${!!m.indoor} dark=${!!m.dark}`);
console.log(`kinds: ${[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k}:${n}`).join(' ')}`);
console.log(`warps: ${(m.warps||[]).map(w=>`(${w.x},${w.y})->${w.to.map}(${w.to.x},${w.to.y})`).join(' ')}`);
console.log(`npcs: ${(m.npcs||[]).map(n=>`${n.name}(${n.x},${n.y})`).join(' ')}`);
console.log(`events: ${JSON.stringify(m.events||[])} items: ${JSON.stringify(m.items||[])}`);
console.log(`encounters: ${JSON.stringify(m.encounters)}`);
console.log(`rows:\n${m.rows.join('\n')}`);
