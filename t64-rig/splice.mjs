// Wave T64 rig: additions-only splice of the four new tile
// entries into art-data.mjs, anchored after the tile-prop-
// coralbranch entry (the last T62 tile entry on this base;
// the parallel T63 entries land ahead of it at merge and do
// not collide). Species entries stay byte-identical —
// build-art.mjs is NOT run (W-DIFF2 lesson: it does not
// reproduce).
import fs from 'node:fs';
import { parsePix } from '/home/hatch/workspace/ashs-journey-t64/assets/sprites/tools/pix.mjs';

const ROOT = '/home/hatch/workspace/ashs-journey-t64/';
const NAMES = ['tile-stepfloor', 'tile-shrineroof', 'tile-prop-festlantern', 'tile-prop-fairbanner'];
const ANCHOR = '"tile-prop-sunshade"';

function entry(name) {
  const pix = parsePix(fs.readFileSync(ROOT + 'assets/sprites/pix/tiles/' + name + '.pix', 'utf8'), name);
  const pal = Object.entries(pix.pal).map(([c, p]) => JSON.stringify(c) + ':' + JSON.stringify(p.hex)).join(',');
  const rows = pix.rows.map((r) => '    ' + JSON.stringify(r)).join(',\n');
  return '  ' + JSON.stringify(name) + ': { w: ' + pix.w + ', h: ' + pix.h + ', pal: {' + pal + '}, rows: [\n' + rows + '\n  ] },';
}

const path = ROOT + 'assets/sprites/art-data.mjs';
const src = fs.readFileSync(path, 'utf8');
for (const n of NAMES) if (src.includes(JSON.stringify(n) + ':')) throw new Error(n + ' already present');
const ai = src.indexOf(ANCHOR);
if (ai < 0) throw new Error('anchor not found');
const close = src.indexOf('\n  ] },', ai);
if (close < 0) throw new Error('anchor close not found');
const insertAt = close + '\n  ] },'.length;
const block = NAMES.map(entry).join('\n');
const out = src.slice(0, insertAt) + '\n' + block + src.slice(insertAt);
// additions-only proof: removing the block restores the input exactly
if (out.replace('\n' + block, '') !== src) throw new Error('splice is not additions-only');
fs.writeFileSync(path, out);
console.log('spliced', NAMES.length, 'entries after', ANCHOR, '; bytes', src.length, '->', out.length);
