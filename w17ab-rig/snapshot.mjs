// Snapshot the MAPS9 definitions of the given ids (arg: out path; ids from env IDS comma list).
import fs from 'node:fs';
import { MAPS9 } from '../src/data/maps9.mjs';
const ids = (process.env.IDS || '').split(',').filter(Boolean);
const out = {};
for (const id of ids) if (MAPS9[id]) out['maps9:' + id] = JSON.parse(JSON.stringify(MAPS9[id]));
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('snapshotted', Object.keys(out).length, 'definitions');
