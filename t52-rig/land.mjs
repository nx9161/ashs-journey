// Wave T51 rig: land the validated Astral candidate into
// src/data/maps9.mjs — block-scoped rows replacement inside
// the celestic block only, the MART CLERK re-seat anchored on
// his own dialogue line, and the verbatim DIRS copies appended
// after the last shipped celestic sign. Everything else
// byte-preserved.
import fs from 'node:fs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';

const FILE = '/home/hatch/workspace/ashs-journey-t51/src/data/maps9.mjs';
const DIRS_TEXT = 'ASTRAL TOWN — East: ROUTE 210 — NORTH.';

let src = fs.readFileSync(FILE, 'utf8');

// 0. hash every map's rows for the post-land proof
const { loadMaps } = await import('/home/hatch/workspace/ashs-journey-t51/scripts/audit-desire-paths.mjs');
const pre = await loadMaps();
const preHash = {};
for (const [id, m] of Object.entries(pre.MAPS)) preHash[id] = JSON.stringify(m.rows);

// 1. the celestic block
const blockStart = src.indexOf('"id": "celestic"');
if (blockStart < 0) throw new Error('celestic block not found');

// 2. rows replacement (block-scoped)
const rowsKey = '"rows": [';
const rowsStart = src.indexOf(rowsKey, blockStart);
const segStart = rowsStart + rowsKey.length;
const rowsEnd = src.indexOf('\n    ],', segStart);
const segment = src.slice(segStart, rowsEnd);
const shippedRows = [...segment.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse('"' + m[1] + '"'));
if (shippedRows.length !== 18) throw new Error('expected 18 shipped rows, found ' + shippedRows.length);
if (JSON.stringify(shippedRows) !== JSON.stringify(pre.MAPS['celestic'].rows)) throw new Error('segment rows != loader rows');
const replacement = '\n' + CANDIDATE.map((r) => '      ' + JSON.stringify(r)).join(',\n') + '\n';
src = src.slice(0, segStart) + replacement + src.slice(rowsEnd);
console.log('rows replaced: 18 -> 18 candidate rows');

// 3. the clerk re-seat (anchored on his Astral dialogue)
const clerkAnchor = '"dialogue": ["Astral Town Mart';
const ci = src.indexOf(clerkAnchor, blockStart);
if (ci < 0) throw new Error('clerk anchor not found');
const lineStart = src.lastIndexOf('\n', ci) + 1;
const lineEnd = src.indexOf('\n', ci);
const line = src.slice(lineStart, lineEnd);
if (!line.includes('{"x": 3, "y": 5, "name": "MART CLERK"')) throw new Error('clerk line shape unexpected: ' + line.slice(0, 60));
const newLine = line.replace('{"x": 3, "y": 5,', '{"x": 9, "y": 4,');
src = src.slice(0, lineStart) + newLine + src.slice(lineEnd);
console.log('clerk re-seated (3,5) -> (9,4)');

// 4. the sign appends (after the last shipped celestic sign — the DIRS record itself)
const lastSign = '      {"x": 13, "y": 10, "text": "' + DIRS_TEXT + '"}';
const si = src.indexOf(lastSign, blockStart);
if (si < 0) throw new Error('last-sign anchor not found');
if (src.indexOf(lastSign, si + 1) > 0) throw new Error('last-sign anchor not unique');
const appends = COPY_SEATS.map(([x, y]) => '      {"x": ' + x + ', "y": ' + y + ', "text": "' + DIRS_TEXT + '"}');
src = src.slice(0, si + lastSign.length) + ',\n' + appends.join(',\n') + src.slice(si + lastSign.length);
console.log('DIRS copies appended:', COPY_SEATS.length);

fs.writeFileSync(FILE, src);

// 5. post-land proof: reload and compare everything
const post = await import('/home/hatch/workspace/ashs-journey-t51/scripts/audit-desire-paths.mjs?landed=1');
const postMaps = (await post.loadMaps()).MAPS;
for (const [id, m] of Object.entries(postMaps)) {
  if (id === 'celestic') continue;
  if (JSON.stringify(m.rows) !== preHash[id]) throw new Error('OTHER MAP CHANGED: ' + id);
}
const landed = postMaps['celestic'];
if (JSON.stringify(landed.rows) !== JSON.stringify(CANDIDATE)) throw new Error('landed rows != candidate');
const clerk = landed.npcs.find((n) => n.name === 'MART CLERK');
if (!(clerk.x === 9 && clerk.y === 4)) throw new Error('clerk not at (9,4)');
if (landed.signs.length !== 3 + COPY_SEATS.length) throw new Error('expected ' + (3 + COPY_SEATS.length) + ' signs, found ' + landed.signs.length);
console.log('POST-LAND PROOF: all other maps byte-identical; celestic rows == candidate; clerk (9,4); signs 3+' + COPY_SEATS.length + '=' + landed.signs.length);
