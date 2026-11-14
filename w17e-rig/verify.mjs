// Parity proof: after-state vs before-snapshot, per file. Non-row
// fields must be JSON-identical; rows may differ ONLY at cells
// whose before-kind is cavefloor (-> crownfloor) or cavewall
// (-> crownwall). Asserts water counts unchanged, no generic cave
// base kind remains, and the cave-encounter trigger chars
// ('.'/'R', overworld-systems sysEncounterStep) census is
// identical before/after in both grids.
import fs from 'node:fs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
const before = JSON.parse(fs.readFileSync('/tmp/w17e-before.json', 'utf8'));
const TRANS = { cavefloor: ['crownfloor'], cavewall: ['crownwall'] };
let fail = 0;
for (const [file, pack] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  const key = file + ':victoryroad';
  const a = before[key], b = pack['victoryroad'];
  const rest = (m) => { const c = { ...m }; delete c.rows; return JSON.stringify(c); };
  if (rest(a) !== rest(b)) { console.log('FAIL rest differs', key); fail++; continue; }
  let changed = 0, bad = 0; const hist = {};
  for (let y = 0; y < a.rows.length; y++) for (let x = 0; x < a.rows[y].length; x++) {
    const ca = a.rows[y][x], cb = b.rows[y][x];
    const ka = TILE_CHARS[ca], kb = TILE_CHARS[cb];
    if (ca !== cb) { changed++; if (!(TRANS[ka] || []).includes(kb)) { bad++; console.log('  BAD cell', key, x, y, ka, '->', kb); } }
    hist[kb] = (hist[kb] || 0) + 1;
  }
  const wat = (m) => m.rows.join('').split('').filter((c) => TILE_CHARS[c] === 'water').length;
  const trig = (m) => { const s = m.rows.join(''); return { dot: s.split('').filter((c) => c === '.').length, R: s.split('').filter((c) => c === 'R').length }; };
  const ta = trig(a), tb = trig(b);
  const generic = (hist['cavefloor'] || 0) + (hist['cavewall'] || 0);
  console.log(key, 'changed', changed, 'bad', bad, 'water', wat(a), '->', wat(b), 'genericLeft', generic,
    'triggers . :', ta.dot, '->', tb.dot, ' R:', ta.R, '->', tb.R,
    '| kit hist: crownfloor:' + (hist['crownfloor'] || 0), 'crownwall:' + (hist['crownwall'] || 0),
    '| dressing kept:', ['rock','caveboulder','crackedfloor','bannerwall','rubble','lavaglow','torchpost','cavelantern','water'].map((k) => `${k}:${hist[k] || 0}`).join(' '));
  if (bad || wat(a) !== wat(b) || generic || ta.dot !== tb.dot || ta.R !== tb.R) fail++;
}
console.log(fail ? 'PARITY FAIL' : 'PARITY OK');
process.exit(fail ? 1 : 0);
