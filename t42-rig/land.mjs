// Wave T40 rig: land the validated candidate into maps9.mjs —
// block-scoped rows replacement (trailing commas preserved),
// the clerk re-seat anchored on his unique dialogue, and the
// DIRS copy appended after the twinleaf DIRS signs entry with
// the text extracted from the file itself (byte-identity).
import fs from 'node:fs';
import { ROWS } from './rows.mjs';

const P = '/home/hatch/workspace/ashs-journey-t40/src/data/maps9.mjs';
const lines = fs.readFileSync(P, 'utf8').split('\n');

// --- locate the twinleaf block ---
const start = lines.findIndex((l) => l.includes('"twinleaf": {'));
if (start < 0) throw new Error('twinleaf block not found');
if (lines.findIndex((l, i) => i > start && l.includes('"twinleaf": {')) >= 0) throw new Error('duplicate twinleaf block');

// --- rows replacement ---
const rowsHead = lines.findIndex((l, i) => i > start && l.includes('"rows": ['));
if (rowsHead < 0) throw new Error('rows head not found');
const rowLines = [];
for (let i = rowsHead + 1; i < rowsHead + 40; i++) {
  if (/^\s*"/.test(lines[i])) rowLines.push(i);
  else break;
}
if (rowLines.length !== 18) throw new Error('expected 18 row lines, found ' + rowLines.length);
rowLines.forEach((li, r) => {
  const comma = lines[li].trimEnd().endsWith('",') ? ',' : '';
  lines[li] = '      ' + JSON.stringify(ROWS[r]) + comma;
});
console.log('rows replaced:', rowLines.length);

// --- signs: append the DIRS copy after the twinleaf DIRS entry ---
const COPIES = [[15, 5]];
const dirsIdx = lines.findIndex((l, i) => i > start && l.includes('{"x": 7, "y": 12, "text": "CLOVER TOWN'));
if (dirsIdx < 0) throw new Error('DIRS (7,12) anchor not found');
const text = lines[dirsIdx].match(/"text": "([^"]*)"/)[1];
if (lines[dirsIdx].trimEnd().endsWith('}')) lines[dirsIdx] = lines[dirsIdx] + ',';
const copyLines = COPIES.map(([x, y], i) =>
  '      {"x": ' + x + ', "y": ' + y + ', "text": ' + JSON.stringify(text) + '}' + (i < COPIES.length - 1 ? ',' : ''));
lines.splice(dirsIdx + 1, 0, ...copyLines);
console.log('sign copies appended:', copyLines.length, '| text:', text.slice(0, 40) + '…');

// --- clerk re-seat (3,5) -> (19,4), anchored on his unique dialogue ---
const clerkIdx = lines.findIndex((l, i) => i > start && l.includes('Clover Town Mart — stocked for the road ahead'));
if (clerkIdx < 0) throw new Error('clerk anchor not found');
if (!lines[clerkIdx].includes('{"x": 3, "y": 5, "name": "MART CLERK"')) throw new Error('clerk anchor shape drifted');
lines[clerkIdx] = lines[clerkIdx].replace('{"x": 3, "y": 5, "name": "MART CLERK"', '{"x": 19, "y": 4, "name": "MART CLERK"');
console.log('clerk re-seated: (3,5) -> (19,4)');

fs.writeFileSync(P, lines.join('\n'));
console.log('landed into maps9.mjs');
