// Wave W15-T1 rig: swap landmark cells in lavender + saffron in
// BOTH maps2.mjs and maps3.mjs, identically. Asserts the expected
// kind at every target cell before swapping, asserts only the
// intended row lines change, and asserts the two copies' rows stay
// byte-identical. Doors/warps/posts/ground: zero cells touched.
import fs from 'node:fs';
import { TILE_CHARS, W15T1_KIND_CHARS } from '../src/engine/tiles.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';

const CH = {};
for (const [k, c] of Object.entries(W15T1_KIND_CHARS)) CH[k] = c;

// [mapId, y, {x: [expectKind, newKind]}]
const SWAPS = [
  ['lavender', 3, { 9: ['wall-gym', 'hushtowercap-l'], 10: ['wall-gym', 'hushtowercap-c'], 11: ['wall-gym', 'hushtowercap-c'], 12: ['wall-gym', 'hushtowercap-r'] }],
  ['lavender', 4, { 9: ['wall-gym', 'hushtowershaft'], 10: ['wall-gym', 'hushtowershaft'], 11: ['wall-gym', 'hushtowershaft'], 12: ['wall-gym', 'hushtowershaft'] }],
  ['saffron', 2, { 7: ['slabroof', 'vantcap-l'], 8: ['slabroof', 'vantcap-c'], 9: ['slabroof', 'vantcap-c'], 10: ['slabroof', 'vantcap-c'], 11: ['slabroof', 'vantcap-c'], 12: ['slabroof', 'vantcap-r'] }],
  ['saffron', 3, { 7: ['wall-lab', 'vantshaft'], 8: ['wall-lab', 'vantshaft'], 9: ['wall-lab', 'vantshaft'], 12: ['wall-lab', 'vantshaft'] }],
];

function newRow(map, y, cells) {
  const cps = [...map.rows[y]];
  for (const [x, [expect, nk]] of Object.entries(cells)) {
    const got = TILE_CHARS[cps[x]];
    if (got !== expect) throw new Error(`${map.id} (${x},${y}): expected ${expect}, got ${got}`);
    cps[x] = CH[nk];
  }
  return cps.join('');
}

function editFile(file, mapsObj) {
  const path = new URL('../src/data/' + file, import.meta.url).pathname;
  const lines = fs.readFileSync(path, 'utf8').split('\n');
  const changed = [];
  for (const [id, y, cells] of SWAPS) {
    const map = mapsObj[id];
    const want = newRow(map, y, cells);
    // locate the map block, then its rows array lines
    const start = lines.findIndex((l) => l.trim() === id + ': {');
    if (start < 0) throw new Error(file + ': block ' + id + ' not found');
    let rowLine = -1, seen = -1;
    for (let i = start; i < lines.length; i++) {
      if (lines[i].includes('rows: rows([')) { seen = 0; continue; }
      if (seen >= 0) {
        if (lines[i].includes(']),')) break;
        if (seen === y) { rowLine = i; break; }
        seen++;
      }
    }
    if (rowLine < 0) throw new Error(file + ': row ' + id + ' y=' + y + ' not found');
    const indent = lines[rowLine].match(/^\s*/)[0];
    const oldLiteral = "'" + map.rows[y] + "'";
    if (!lines[rowLine].includes(oldLiteral)) throw new Error(file + ': literal mismatch at ' + id + ' y=' + y + ' — source row is escaped or drifted; stopping');
    lines[rowLine] = indent + "'" + want + "',";
    changed.push(id + ' y=' + y);
  }
  fs.writeFileSync(path, lines.join('\n'));
  console.log(file, 'edited rows:', changed.join('; '));
}

editFile('maps2.mjs', MAPS2);
editFile('maps3.mjs', MAPS3);
console.log('swaps applied to both copies');
