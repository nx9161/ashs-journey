// W15-T2 swap: replace ONLY the landmark roof-row chars in maps6.mjs.
// violet y=2 x13..18 -> newleafcap l/c/c/c/c/r ; ecruteak y=2 x22..25 ->
// chimecap l/c/c/r. Asserts: old rows found verbatim exactly once in the
// file, new rows differ from old at exactly the target cells, every other
// cell (doors/warps/ground) byte-identical.
import fs from 'node:fs';
import { MAPS6 } from '../src/data/maps6.mjs';

const CH = (idx) => String.fromCodePoint(0x1E00 + idx);
const JOBS = [
  { map: 'violet', y: 2, swaps: { 13: CH(1552), 14: CH(1553), 15: CH(1553), 16: CH(1553), 17: CH(1553), 18: CH(1554) } },
  { map: 'ecruteak', y: 2, swaps: { 22: CH(1556), 23: CH(1557), 24: CH(1557), 25: CH(1558) } },
];
const path = new URL('../src/data/maps6.mjs', import.meta.url).pathname;
let src = fs.readFileSync(path, 'utf8');
for (const job of JOBS) {
  const oldRow = MAPS6[job.map].rows[job.y];
  const chars = [...oldRow];
  for (const [x, ch] of Object.entries(job.swaps)) chars[+x] = ch;
  const newRow = chars.join('');
  const diffs = [...oldRow].filter((c, i) => c !== newRow[i]).length;
  if (diffs !== Object.keys(job.swaps).length) throw new Error(job.map + ': unexpected diff count ' + diffs);
  const quoted = JSON.stringify(oldRow);
  const count = src.split(quoted).length - 1;
  if (count !== 1) throw new Error(job.map + ' row occurs ' + count + ' times, want 1');
  src = src.replace(quoted, JSON.stringify(newRow));
  console.log(job.map, 'y=' + job.y, 'swapped', diffs, 'cells');
}
fs.writeFileSync(path, src);
console.log('maps6.mjs updated');
