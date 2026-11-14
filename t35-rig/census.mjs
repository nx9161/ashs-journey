// T35 census probe: lilycove char histogram + key-cell kinds, game's own tables.
import { loadMaps } from '/home/hatch/workspace/ashs-journey-t35/scripts/audit-desire-paths.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const m = MAPS.lilycove;
const H = m.rows.length, W = m.rows[0].length;
const kind = (ch) => TILE_CHARS[ch];
const cell = (x, y) => m.rows[y][x];
console.log(`lilycove ${W}x${H} start=(${m.start.x},${m.start.y}) music=${m.music} weather=${m.weather}`);

const hist = new Map();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const ch = cell(x, y);
  const k = ch + '|' + (kind(ch) ?? '?');
  hist.set(k, (hist.get(k) || 0) + 1);
}
for (const [k, n] of [...hist.entries()].sort((a, b) => b[1] - a[1])) {
  const [ch, kd] = k.split('|');
  console.log(`  ${JSON.stringify(ch)} U+${ch.codePointAt(0).toString(16).toUpperCase()} kind=${kd} n=${n} walk=${WALKABLE.has(ch)}`);
}
const show = (label, x, y) => console.log(`${label} (${x},${y}) char=${JSON.stringify(cell(x, y))} kind=${kind(cell(x, y))} walk=${WALKABLE.has(cell(x, y))}`);
for (const s of m.signs) show('SIGN ' + s.text.slice(0, 22), s.x, s.y);
for (const n of m.npcs) show('NPC ' + n.name, n.x, n.y);
for (const w of m.warps) { show('WARP->' + w.to.map, w.x, w.y); if (w.via) show('  via', w.via.x, w.via.y); }
show('START', m.start.x, m.start.y);
for (const [id, mm] of Object.entries(MAPS)) {
  for (const w of mm.warps || []) if (w.to && w.to.map === 'lilycove') show(`INBOUND from ${id} warp (${w.x},${w.y}) lands`, w.to.x, w.to.y);
}
for (const pat of [',', '.']) {
  let cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cell(x, y) === pat) cells.push([x, y]);
  console.log(pat + ' cells:', JSON.stringify(cells));
}
console.log('rows grid (kind suffix per cell):');
for (let y = 0; y < H; y++) {
  let line = '';
  for (let x = 0; x < W; x++) { const k = kind(cell(x, y)) || '?'; line += (k.includes('-') ? k.split('-')[0] : k.slice(0, 2)).padEnd(4); }
  console.log(String(y).padStart(2), line);
}
