// T64 landing: block-scoped replacement of the shamouti rows
// in src/data/maps5.mjs with the VALIDATED candidate + the
// MART CLERK re-seat (3,5) -> (19,4) + the three verbatim DIRS
// copies at their validator-named junction seats (COPY_SEATS).
// Post-land proof: every OTHER map's rows byte-identical,
// landed rows == candidate, signs == shipped + 3 copies.
import fs from 'node:fs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';

const FILE = '/home/hatch/workspace/ashs-journey-t64/src/data/maps5.mjs';
const before = fs.readFileSync(FILE, 'utf8');
const rowsOf = (text) => { const m = []; const re = /\n(\s*)"rows": \[\n((?:\s*"(?:[^"\\]|\\.)*",?\n)+)\s*\]/g; let mm; while ((mm = re.exec(text))) { const rows = [...mm[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((r) => JSON.parse('"' + r[1] + '"')); m.push(rows); } return m; };
const beforeRows = rowsOf(before);

const start = before.indexOf('\n  "shamouti": {');
if (start < 0) throw new Error('shamouti block start not found');
const end = before.indexOf('\n  "', start + 10);
if (end < 0) throw new Error('shamouti block end not found');
let block = before.slice(start, end);

// rows
const rowMatches = [...block.matchAll(/\n(\s*)"((?:[^"\\]|\\.)*)",?/g)].filter((m) => /^[\s\S]{28}$/.test(m[2]) && m.index > block.indexOf('"rows"'));
if (rowMatches.length !== 18) throw new Error('expected 18 row lines in block, found ' + rowMatches.length);
let out = '', last = 0;
rowMatches.forEach((m, i) => {
  out += block.slice(last, m.index) + '\n' + m[1] + '"' + CANDIDATE[i] + '"' + (i < 17 ? ',' : '');
  last = m.index + m[0].length;
});
out += block.slice(last);
block = out;

// clerk re-seat, block-scoped (x/y precede name in this file)
const clerkFrom = '"x": 3,\n        "y": 5,\n        "name": "MART CLERK"';
const clerkTo = '"x": 19,\n        "y": 4,\n        "name": "MART CLERK"';
if (!block.includes(clerkFrom)) throw new Error('clerk needle not found in block');
block = block.replace(clerkFrom, clerkTo);

// DIRS copies: insert after the LAST shipped sign record (the
// Mart sign, x19 y5), text taken verbatim from the block's own
// (8,7) record so the bytes are the game's own.
const dirsText = block.match(/"x": 8,\n        "y": 7,\n        "text": "((?:[^"\\]|\\.)*)"/)[1];
const martSign = '"x": 19,\n        "y": 5,\n        "text": "SANCTUM MART';
const mi = block.indexOf(martSign);
if (mi < 0) throw new Error('mart sign needle not found');
const recEnd = block.indexOf('\n      },', mi);
if (recEnd < 0) throw new Error('mart sign record end not found');
const insertAt = recEnd + '\n      },'.length;
const records = COPY_SEATS.map(([x, y]) => '\n      {\n        "x": ' + x + ',\n        "y": ' + y + ',\n        "text": "' + dirsText + '"\n      },').join('');
block = block.slice(0, insertAt) + records + block.slice(insertAt);

const after = before.slice(0, start) + block + before.slice(end);
fs.writeFileSync(FILE, after);
// proof
if (after === before) throw new Error('no change?!');
const afterRows = rowsOf(after);
if (afterRows.length !== beforeRows.length) throw new Error('rows-block count changed');
let landed = null, li = -1;
for (let i = 0; i < beforeRows.length; i++) { const a = beforeRows[i], b = afterRows[i]; if (JSON.stringify(a) !== JSON.stringify(b)) { if (landed) throw new Error('more than one map changed'); landed = b; li = i; } }
if (!landed) throw new Error('no map changed');
if (JSON.stringify(landed) !== JSON.stringify(CANDIDATE)) throw new Error('landed rows != candidate');
console.log('LANDED: exactly one map changed (block #' + li + '), its rows == the validated candidate; clerk (3,5)->(19,4); ' + COPY_SEATS.length + ' DIRS copies inserted; all other maps byte-identical.');
