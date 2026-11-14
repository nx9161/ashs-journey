// Snapshot per-file definitions of victoryroad to a JSON file (arg: out path).
import fs from 'node:fs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
const out = {};
for (const [file, pack] of [['maps2', MAPS2], ['maps3', MAPS3]]) {
  if (pack['victoryroad']) out[file + ':victoryroad'] = JSON.parse(JSON.stringify(pack['victoryroad']));
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('snapshotted', Object.keys(out).length, 'definitions');
