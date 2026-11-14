// Wave T42 rig: land the validated candidate into maps9.mjs —
// block-scoped rows replacement (trailing commas preserved),
// the DIRS copies appended after the jubilife signs array's last
// entry with the text extracted from the file itself
// (byte-identity), and the clerk re-seat anchored on his unique
// dialogue.
import fs from 'node:fs';
import { ROWS } from './rows.mjs';

const P = '/home/hatch/workspace/ashs-journey-t42/src/data/maps9.mjs';
const lines = fs.readFileSync(P, 'utf8').split('\n');

// --- locate the jubilife block ---
const start = lines.findIndex((l) => l.includes('"jubilife": {'));
if (start < 0) throw new Error('jubilife block not found');
if (lines.findIndex((l, i) => i > start && l.includes('"jubilife": {')) >= 0) throw new Error('duplicate jubilife block');

// --- rows replacement ---
const rowsHead = lines.findIndex((l, i) => i > start && l.includes('"rows": ['));
if (rowsHead < 0) throw new Error('rows head not found');
const rowLines = [];
for (let i = rowsHead + 1; i < rowsHead + 40; i++) {
  if (/^\s*"/.test(lines[i])) rowLines.push(i);
  else break;
}
if (rowLines.length !== 20) throw new Error('expected 20 row lines, found ' + rowLines.length);
rowLines.forEach((li, r) => {
  const comma = lines[li].trimEnd().endsWith('",') ? ',' : '';
  lines[li] = '      ' + JSON.stringify(ROWS[r]) + comma;
});
console.log('rows replaced:', rowLines.length);

// --- signs: append the DIRS copies after the last sign entry ---
const COPIES = [[12, 5], [6, 12], [2, 13]];
const dirsIdx = lines.findIndex((l, i) => i > start && l.includes('{"x": 21, "y": 16, "text": "REVELRY CITY — South:'));
if (dirsIdx < 0) throw new Error('DIRS (21,16) anchor not found');
const text = lines[dirsIdx].match(/"text": "([^"]*)"/)[1];
if (!text.startsWith('REVELRY CITY — South: ROUTE 202')) throw new Error('DIRS text drifted: ' + text.slice(0, 40));
if (lines[dirsIdx].trimEnd().endsWith('}')) lines[dirsIdx] = lines[dirsIdx] + ',';
const copyLines = COPIES.map(([x, y], i) =>
  '      {"x": ' + x + ', "y": ' + y + ', "text": ' + JSON.stringify(text) + '}' + (i < COPIES.length - 1 ? ',' : ''));
lines.splice(dirsIdx + 1, 0, ...copyLines);
console.log('sign copies appended:', copyLines.length, '| text:', text.slice(0, 40) + '…');

// --- clerk re-seat (3,5) -> (9,4), anchored on his unique dialogue ---
const clerkIdx = lines.findIndex((l, i) => i > start && l.includes('Revelry City Mart — stocked for the road ahead'));
if (clerkIdx < 0) throw new Error('clerk anchor not found');
if (!lines[clerkIdx].includes('{"x": 3, "y": 5, "name": "MART CLERK"')) throw new Error('clerk anchor shape drifted');
lines[clerkIdx] = lines[clerkIdx].replace('{"x": 3, "y": 5, "name": "MART CLERK"', '{"x": 9, "y": 4, "name": "MART CLERK"');
console.log('clerk re-seated: (3,5) -> (9,4)');

fs.writeFileSync(P, lines.join('\n'));
console.log('landed into maps9.mjs');
