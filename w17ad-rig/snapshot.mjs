// Snapshot the MAPS5 definitions of the given ids (arg: out path; ids from env IDS comma list).
import fs from 'node:fs';
import { MAPS5 } from '../src/data/maps5.mjs';
const ids = (process.env.IDS || '').split(',').filter(Boolean);
const out = {};
for (const id of ids) if (MAPS5[id]) out['maps5:' + id] = JSON.parse(JSON.stringify(MAPS5[id]));
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('snapshotted', Object.keys(out).length, 'definitions');
