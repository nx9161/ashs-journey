// Wave T52 rig: land the validated Rimefall candidate into
// src/data/maps9.mjs — block-scoped rows replacement inside
// the snowpoint block only, the MART CLERK re-seat anchored
// on his own dialogue line, and the verbatim DIRS copies
// appended after the last shipped snowpoint sign. Everything
// else byte-preserved.
import fs from 'node:fs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';

const FILE = '/home/hatch/workspace/ashs-journey-t52/src/data/maps9.mjs';
const DIRS_TEXT = 'RIMEFALL CITY — West: LAKE INSIGHT.';

let src = fs.readFileSync(FILE, 'utf8');

// 0. hash every map's rows for the post-land proof
const { loadMaps } = await import('/home/hatch/workspace/ashs-journey-t52/scripts/audit-desire-paths.mjs');
const pre = await loadMaps();
const preHash = {};
for (const [id, m] of Object.entries(pre.MAPS)) preHash[id] = JSON.stringify(m.rows);

// 1. the snowpoint block
const blockStart = src.indexOf('"id": "snowpoint"');
if (blockStart < 0) throw new Error('snowpoint block not found');

// 2. rows replacement (block-scoped)
const rowsKey = '"rows": [';
const rowsStart = src.indexOf(rowsKey, blockStart);
const segStart = rowsStart + rowsKey.length;
const rowsEnd = src.indexOf('\n    ],', segStart);
const segment = src.slice(segStart, rowsEnd);
const shippedRows = [...segment.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse('"' + m[1] + '"'));
if (shippedRows.length !== 18) throw new Error('expected 18 shipped rows, found ' + shippedRows.length);
if (JSON.stringify(shippedRows) !== JSON.stringify(pre.MAPS['snowpoint'].rows)) throw new Error('segment rows != loader rows');
const replacement = '\n' + CANDIDATE.map((r) => '      ' + JSON.stringify(r)).join(',\n') + '\n';
src = src.slice(0, segStart) + replacement + src.slice(rowsEnd);
console.log('rows replaced: 18 -> 18 candidate rows');

// 3. the clerk re-seat (anchored on his Rimefall dialogue)
const clerkAnchor = '"dialogue": ["Rimefall City Mart';
const ci = src.indexOf(clerkAnchor, blockStart);
if (ci < 0) throw new Error('clerk anchor not found');
const lineStart = src.lastIndexOf('\n', ci) + 1;
const lineEnd = src.indexOf('\n', ci);
const line = src.slice(lineStart, lineEnd);
if (!line.includes('{"x": 3, "y": 5, "name": "MART CLERK"')) throw new Error('clerk line shape unexpected: ' + line.slice(0, 60));
const newLine = line.replace('{"x": 3, "y": 5,', '{"x": 9, "y": 4,');
src = src.slice(0, lineStart) + newLine + src.slice(lineEnd);
console.log('clerk re-seated (3,5) -> (9,4)');

// 4. the sign appends (after the last shipped snowpoint sign — the (19,3) DIRS record)
const lastSign = '      {"x": 19, "y": 3, "text": "' + DIRS_TEXT + '"}';
const si = src.indexOf(lastSign, blockStart);
if (si < 0) throw new Error('last-sign anchor not found');
if (src.indexOf(lastSign, si + 1) > 0) throw new Error('last-sign anchor not unique');
const appends = COPY_SEATS.map(([x, y]) => '      {"x": ' + x + ', "y": ' + y + ', "text": "' + DIRS_TEXT + '"}');
src = src.slice(0, si + lastSign.length) + ',\n' + appends.join(',\n') + src.slice(si + lastSign.length);
console.log('DIRS copies appended:', COPY_SEATS.length);

fs.writeFileSync(FILE, src);

// 5. post-land proof: only snowpoint's rows changed in the whole file
const post = await loadMaps(true);
for (const [id, m] of Object.entries(post.MAPS)) {
  const changed = JSON.stringify(m.rows) !== preHash[id];
  if (id === 'snowpoint' && !changed) throw new Error('snowpoint rows did NOT change');
  if (id !== 'snowpoint' && changed) throw new Error('UNEXPECTED row change in ' + id);
}
console.log('post-land proof: only snowpoint rows changed');
