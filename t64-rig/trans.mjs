import { loadMaps } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';
import { CANDIDATE } from './rows.mjs';
const { MAPS, TILE_CHARS } = await loadMaps(false);
const src = MAPS['shamouti'];
const tr = {};
for (let y = 0; y < 18; y++) for (let x = 0; x < 28; x++) {
  const a = TILE_CHARS[src.rows[y][x]], b = TILE_CHARS[CANDIDATE[y][x]];
  if (a !== b) tr[a + '->' + b] = (tr[a + '->' + b] || 0) + 1;
}
console.log(JSON.stringify(tr, null, 1));
