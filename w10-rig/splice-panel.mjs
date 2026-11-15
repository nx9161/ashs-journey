// splice-panel.mjs — W10 art-data splice (fleet convention).
// Full build-art regeneration is red on main for pre-existing legacy
// violations (tiles family palette budget; tile-prop-sapling outline),
// so — as every W17 wave did — the new entry is generated in build-art's
// exact emission format (assets/sprites/tools/build-art.mjs lines
// 367-369) from the parsed .pix and spliced into art-data.mjs at its
// file-walk position (pix/keyart/panel-*.pix sorts immediately before
// pix/keyart/title-keyart.pix). Additions-only; idempotent.
//   node w10-rig/splice-panel.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PIX = path.join(ROOT, 'assets', 'sprites', 'pix', 'keyart', 'panel-shrine-chronofae.pix');
const DATA = path.join(ROOT, 'assets', 'sprites', 'art-data.mjs');

const s = parsePix(fs.readFileSync(PIX, 'utf8'), PIX);
const pal = {};
for (const [ch, v] of Object.entries(s.pal)) pal[ch] = v.hex;
let entry = `  ${JSON.stringify(s.id)}: { w: ${s.w}, h: ${s.h}, pal: ${JSON.stringify(pal)}, rows: [\n`;
for (const row of s.rows) entry += `    ${JSON.stringify(row)},\n`;
entry += '  ] },\n';

const data = fs.readFileSync(DATA, 'utf8');
if (data.includes(`  ${JSON.stringify(s.id)}:`)) {
  console.log('splice-panel: entry already present, no change');
  process.exit(0);
}
const anchor = '  "title-keyart":';
const at = data.indexOf(anchor);
if (at < 0) { console.error('splice-panel: anchor title-keyart not found'); process.exit(1); }
fs.writeFileSync(DATA, data.slice(0, at) + entry + data.slice(at));
console.log(`splice-panel: inserted ${s.id} (${entry.length} B) before title-keyart`);
