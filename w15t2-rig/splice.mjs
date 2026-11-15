// Wave W15-T2 rig: additions-only splice of the 6 new tile entries into
// art-data.mjs, anchored after "tile-shrinerock" (the last W17-AD entry).
// Species/cast entries stay byte-identical — build-art.mjs is NOT run
// (W-DIFF2 lesson). Re-runnable during art iteration: an entry already
// spliced by this script is removed first, then re-inserted identically
// positioned; vs the base file the result is additions-only (proven by
// the caller diffing against base).
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const NAMES = ['tile-newleafcap-l', 'tile-newleafcap-c', 'tile-newleafcap-r',
  'tile-chimecap-l', 'tile-chimecap-c', 'tile-chimecap-r'];
const ANCHOR = '"tile-shrinerock"';

function entry(name) {
  const pix = parsePix(fs.readFileSync(ROOT + 'assets/sprites/pix/tiles/' + name + '.pix', 'utf8'), name);
  const pal = Object.entries(pix.pal).map(([c, p]) => JSON.stringify(c) + ':' + JSON.stringify(p.hex)).join(',');
  const rows = pix.rows.map((r) => '    ' + JSON.stringify(r)).join(',\n');
  return '  ' + JSON.stringify(name) + ': { w: ' + pix.w + ', h: ' + pix.h + ', pal: {' + pal + '}, rows: [\n' + rows + '\n  ] },';
}
function stripEntry(src, name) {
  const k = src.indexOf('  ' + JSON.stringify(name) + ':');
  if (k < 0) return src;
  const end = src.indexOf('\n  ] },', k);
  if (end < 0) throw new Error('entry end not found for ' + name);
  return src.slice(0, k) + src.slice(end + '\n  ] },'.length + 1);
}

const path = ROOT + 'assets/sprites/art-data.mjs';
let src = fs.readFileSync(path, 'utf8');
for (const n of NAMES) src = stripEntry(src, n);
const ai = src.indexOf(ANCHOR);
if (ai < 0) throw new Error('anchor not found');
const close = src.indexOf('\n  ] },', ai);
if (close < 0) throw new Error('anchor close not found');
const insertAt = close + '\n  ] },'.length;
const block = NAMES.map(entry).join('\n');
const out = src.slice(0, insertAt) + '\n' + block + src.slice(insertAt);
fs.writeFileSync(path, out);
console.log('spliced', NAMES.length, 'entries after', ANCHOR, '; bytes', src.length, '->', out.length);
