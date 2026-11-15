// W15-T1 census: decode lavender + saffron from maps2/maps3 with the
// game's own TILE_CHARS; print kind grids + verify the two copies agree.
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';

function grid(map, x0, x1, y0, y1) {
  const rows = map.rows;
  const out = [];
  for (let y = y0; y <= y1; y++) {
    const cells = [];
    for (let x = x0; x <= x1; x++) {
      const ch = [...rows[y]][x];
      cells.push((TILE_CHARS[ch] || ('?U+' + ch.codePointAt(0).toString(16))).padEnd(13));
    }
    out.push('y=' + y + ' ' + cells.join(' '));
  }
  return out.join('\n');
}

for (const [label, maps] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  for (const id of ['lavender', 'saffron']) {
    const m = maps[id];
    console.log(`\n### ${label} ${id} (${m.name}) rows=${m.rows.length} w=${[...m.rows[0]].length}`);
    if (id === 'lavender') console.log(grid(m, 6, 15, 1, 7));
    else console.log(grid(m, 4, 15, 0, 5));
    console.log('warps:', JSON.stringify(m.warps));
    console.log('signs:', JSON.stringify((m.signs || []).map(s => [s.x, s.y, (s.text || s.lines || '').toString().slice(0, 40)])));
  }
}
// dual-copy row identity
for (const id of ['lavender', 'saffron']) {
  const a = MAPS2[id].rows, b = MAPS3[id].rows;
  console.log(id, 'rows identical maps2==maps3:', JSON.stringify(a) === JSON.stringify(b));
}
