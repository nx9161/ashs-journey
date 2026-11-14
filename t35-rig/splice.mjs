// Wave T35 rig: splice the four new Lotus Cove tile entries into
// art-data.mjs (additions-only; species byte-identical), matching
// the file's current serializer format exactly. Anchored after
// the 'tile-prop-steamvent' entry (T33's last splice on main).
import { readFileSync, writeFileSync } from 'node:fs';
import { parsePix } from '/home/hatch/workspace/ashs-journey-t35/assets/sprites/tools/pix.mjs';

const ROOT = '/home/hatch/workspace/ashs-journey-t35';
const NAMES = ['tile-lotusroof', 'tile-cobblefloor', 'tile-prop-chainbar', 'tile-prop-gullpost'];
const entries = NAMES.map((name) => {
  const pix = parsePix(readFileSync(`${ROOT}/assets/sprites/pix/tiles/${name}.pix`, 'utf8'), name);
  const pal = {};
  for (const [c, v] of Object.entries(pix.pal)) pal[c] = v.hex;
  return { name, w: pix.w, h: pix.h, rows: pix.rows, pal };
});

function spliceEntry(e) {
  const pal = Object.entries(e.pal).map(([c, hex]) => `${JSON.stringify(c)}:${JSON.stringify(hex)}`).join(',');
  const rows = e.rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n');
  return `  ${JSON.stringify(e.name)}: { w: ${e.w}, h: ${e.h}, pal: {${pal}}, rows: [\n${rows}\n  ] },`;
}

let src = readFileSync(`${ROOT}/assets/sprites/art-data.mjs`, 'utf8');
for (const e of entries) if (src.includes(`"${e.name}":`)) throw new Error('already present: ' + e.name);
const anchor = src.indexOf('"tile-prop-steamvent":');
if (anchor < 0) throw new Error('anchor missing');
const endMark = '\n  ] },';
const end = src.indexOf(endMark, anchor);
if (end < 0) throw new Error('anchor end missing');
const insertAt = end + endMark.length;
src = src.slice(0, insertAt) + '\n' + entries.map(spliceEntry).join('\n') + src.slice(insertAt);
writeFileSync(`${ROOT}/assets/sprites/art-data.mjs`, src);
console.log('spliced', NAMES.join(', '));
