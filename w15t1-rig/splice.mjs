// Wave W15-T1 rig: additions-only splice of the 8 new tile
// entries into art-data.mjs, anchored after the last W17-AD
// route-program tile entry present in file order (the prior
// program's tail). Species/cast/prop entries stay byte-identical
// — build-art.mjs is NOT run (W-DIFF2 lesson: it does not
// reproduce; entry-granularity splice is the standing rule).
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const NAMES = ['tile-hushtowercap-l', 'tile-hushtowercap-c', 'tile-hushtowercap-r',
  'tile-hushtowershaft', 'tile-vantcap-l', 'tile-vantcap-c', 'tile-vantcap-r', 'tile-vantshaft'];
const PRIOR = ['tile-wakesand', 'tile-wakerock', 'tile-gardensand', 'tile-gardenrock',
  'tile-resortsand', 'tile-resortrock', 'tile-shrinesand', 'tile-shrinerock'];

function entry(name) {
  const pix = parsePix(fs.readFileSync(ROOT + 'assets/sprites/pix/tiles/' + name + '.pix', 'utf8'), name);
  const pal = Object.entries(pix.pal).map(([c, p]) => JSON.stringify(c) + ':' + JSON.stringify(p.hex)).join(',');
  const rows = pix.rows.map((r) => '    ' + JSON.stringify(r)).join(',\n');
  return '  ' + JSON.stringify(name) + ': { w: ' + pix.w + ', h: ' + pix.h + ', pal: {' + pal + '}, rows: [\n' + rows + '\n  ] },';
}

const path = ROOT + 'assets/sprites/art-data.mjs';
const src = fs.readFileSync(path, 'utf8');
for (const n of NAMES) if (src.includes(JSON.stringify(n) + ':')) throw new Error(n + ' already present');
let ANCHOR = null, anchorPos = -1;
for (const n of PRIOR) { const p = src.indexOf(JSON.stringify(n) + ':'); if (p > anchorPos) { anchorPos = p; ANCHOR = JSON.stringify(n); } }
if (!ANCHOR) throw new Error('no prior-program anchor entry found');
const ai = src.indexOf(ANCHOR);
const close = src.indexOf('\n  ] },', ai);
if (close < 0) throw new Error('anchor close not found');
const insertAt = close + '\n  ] },'.length;
const block = NAMES.map(entry).join('\n');
const out = src.slice(0, insertAt) + '\n' + block + src.slice(insertAt);
if (out.replace('\n' + block, '') !== src) throw new Error('splice is not additions-only');
fs.writeFileSync(path, out);
console.log('spliced', NAMES.length, 'entries after', ANCHOR, '; bytes', src.length, '->', out.length);
