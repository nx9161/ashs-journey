// W15-T2 census: decode violet + ecruteak with the game's own TILE_CHARS,
// print the landmark footprints (kinds per cell), warps, signs, NPC posts.
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';

const MAPS = MAPS6.MAPS || MAPS6;
for (const id of ['violet', 'ecruteak']) {
  const m = MAPS[id];
  console.log(`\n=== ${id} "${m.name}" ${m.rows[0].length}x${m.rows.length} ===`);
  const grid = m.rows.map((r) => [...r].map((ch) => TILE_CHARS[ch] || ('?' + ch)));
  // footprint windows from the plan: violet x12-19 y1-4 ; ecruteak x21-26 y1-4
  const win = id === 'violet' ? { x0: 11, x1: 20, y0: 1, y1: 4 } : { x0: 20, x1: 27, y0: 1, y1: 4 };
  for (let y = win.y0; y <= win.y1; y++) {
    const cells = [];
    for (let x = win.x0; x <= win.x1; x++) cells.push(`${x},${y}:${grid[y][x]}`);
    console.log(cells.join('  '));
  }
  console.log('warps:', JSON.stringify(m.warps.filter((w) => w.y <= 5)));
  console.log('signs:', JSON.stringify((m.signs || []).map((s) => [s.x, s.y, (s.text || s.lines || '').toString().slice(0, 60)])));
  console.log('npcs:', JSON.stringify((m.npcs || []).map((n) => [n.x, n.y, n.name])));
}
