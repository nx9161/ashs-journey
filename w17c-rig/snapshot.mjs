// Snapshot per-file definitions of routes 11/12/15/16/19 to a JSON file (arg: out path).
import fs from 'node:fs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
const out = {};
for (const [file, pack] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  for (const id of ['route11','route12','route15','route16','route19']) {
    if (pack[id]) out[file + ':' + id] = JSON.parse(JSON.stringify(pack[id]));
  }
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('snapshotted', Object.keys(out).length, 'definitions');
