// splice-panels.mjs — W10-B art-data splice (fleet convention, the
// W10 splice-panel.mjs generalized to a panel set). Full build-art
// regeneration is red on main for pre-existing legacy violations, so
// each new entry is generated in build-art's exact emission format
// (assets/sprites/tools/build-art.mjs lines 367-369) from its parsed
// .pix and spliced into art-data.mjs at its file-walk position
// (entries sort by id; panel-*.pix walk immediately around the
// existing panel-shrine-chronofae / title-keyart block). Additions-
// only; idempotent. Usage:
//   node w10b-rig/splice-panels.mjs <panel-id> [...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'assets', 'sprites', 'art-data.mjs');
const ids = process.argv.slice(2).sort();
if (!ids.length) { console.error('splice-panels: no panel ids given'); process.exit(1); }

let data = fs.readFileSync(DATA, 'utf8');
for (const id of ids) {
  if (data.includes(`  ${JSON.stringify(id)}:`)) { console.log(`splice-panels: ${id} already present, no change`); continue; }
  const pixPath = path.join(ROOT, 'assets', 'sprites', 'pix', 'keyart', id + '.pix');
  const s = parsePix(fs.readFileSync(pixPath, 'utf8'), pixPath);
  const pal = {};
  for (const [ch, v] of Object.entries(s.pal)) pal[ch] = v.hex;
  let entry = `  ${JSON.stringify(s.id)}: { w: ${s.w}, h: ${s.h}, pal: ${JSON.stringify(pal)}, rows: [\n`;
  for (const row of s.rows) entry += `    ${JSON.stringify(row)},\n`;
  entry += '  ] },\n';
  // insertion point: the first existing top-level entry whose key
  // sorts after this id (file-walk order == sorted order)
  let at = -1;
  for (const m of data.matchAll(/^  "([^"]+)":/gm)) if (m[1] > id) { at = m.index; break; }
  if (at < 0) { console.error(`splice-panels: no sort anchor found for ${id}`); process.exit(1); }
  data = data.slice(0, at) + entry + data.slice(at);
  console.log(`splice-panels: inserted ${id} (${entry.length} B)`);
}
fs.writeFileSync(DATA, data);
