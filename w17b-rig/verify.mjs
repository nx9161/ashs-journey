// Parity proof: after-state vs before-snapshot. Non-row fields must
// be JSON-identical; rows may differ ONLY at cells whose before-kind
// was grassground/path/tree, landing on the route's own kit kinds
// (or its prop on a former grassground cell).
import fs from 'node:fs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
const before = JSON.parse(fs.readFileSync('/tmp/w17b-before.json', 'utf8'));
const KIT = { route6:['pondturf','lilyfloor','pondwillow','pondpad'], route7:['fenceturf','gatefloor','gateelm','fencepost'], route8:['perfumeturf','perfumefloor','perfumebloom','perfumehedge'], route9:['boulderturf','boulderfloor','boulderpine','fieldboulder'], route10:['conductturf','conductfloor','conductpine','pylonbase'] };
let fail = 0;
for (const [file, pack] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  for (const id of Object.keys(KIT)) {
    const key = file + ':' + id; if (!before[key]) continue;
    const a = before[key], b = pack[id];
    const rest = (m) => { const c = { ...m }; delete c.rows; return JSON.stringify(c); };
    if (rest(a) !== rest(b)) { console.log('FAIL rest differs', key); fail++; continue; }
    let changed = 0, bad = 0; const hist = {};
    for (let y = 0; y < a.rows.length; y++) for (let x = 0; x < a.rows[y].length; x++) {
      const ca = a.rows[y][x], cb = b.rows[y][x];
      const ka = TILE_CHARS[ca], kb = TILE_CHARS[cb];
      if (ca !== cb) { changed++; if (!['grassground','path','tree'].includes(ka) || !KIT[id].includes(kb)) { bad++; console.log('  BAD cell', key, x, y, ka, '->', kb); } }
      hist[kb] = (hist[kb] || 0) + 1;
    }
    const enc = (m) => m.rows.join('').split('').filter((c) => TILE_CHARS[c] === 'grass').length;
    const wat = (m) => m.rows.join('').split('').filter((c) => TILE_CHARS[c] === 'water').length;
    console.log(key, 'changed', changed, 'bad', bad, 'encCells', enc(a), '->', enc(b), 'water', wat(a), '->', wat(b), '| kit hist:', KIT[id].map((k) => `${k}:${hist[k] || 0}`).join(' '));
    if (bad || enc(a) !== enc(b) || wat(a) !== wat(b)) fail++;
  }
}
console.log(fail ? 'PARITY FAIL' : 'PARITY OK');
process.exit(fail ? 1 : 0);
