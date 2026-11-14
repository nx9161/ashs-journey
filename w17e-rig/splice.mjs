// Wave W17-E rig: additions-only splice of the 2 new tile entries
// into art-data.mjs, anchored after the last W17-C tile entry on
// this base (tile-prop-shoredrift). Species entries stay
// byte-identical — build-art.mjs is NOT run (W-DIFF2 lesson: it
// does not reproduce). W17-D's entries land at merge; the
// Director unions.
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const NAMES = ['tile-crownfloor', 'tile-crownwall'];
const ANCHOR = '"tile-prop-shoredrift"';

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
if (out.replace('\n' + block, '') !== src) throw new Error('splice is not additions-only');
fs.writeFileSync(path, out);
console.log('spliced', NAMES.length, 'entries after', ANCHOR, '; bytes', src.length, '->', out.length);
