// W17-E converter: char-for-char kind swaps inside the rows arrays
// of victoryroad in maps2.mjs AND maps3.mjs. Cave method (W17-D):
// 'L' (cavefloor) -> crownfloor char, 'G' (cavewall) -> crownwall
// char — art layer only; every other char (rock boulders,
// caveboulder, crackedfloor, bannerwall, rubble, lavaglow,
// torchpost, cavelantern, water) is preserved exactly. The two
// copies are class D in the strongest form (different sizes,
// drifted records): each copy is converted on its own rows;
// records are never touched. Replacements are length-preserving
// and spliced in place by offset, so every byte outside the row
// strings is preserved exactly. Assertions run against the
// before-snapshot (/tmp/w17e-before.json).
import fs from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const before = JSON.parse(fs.readFileSync('/tmp/w17e-before.json', 'utf8'));
const CH = (i) => String.fromCodePoint(0x1E00 + i);
const F = CH(1166), W = CH(1167);
const FILES = { 'maps2.mjs': ['victoryroad'], 'maps3.mjs': ['victoryroad'] };

function rowsSpan(src, id) {
  const start = src.indexOf(`  ${id}: {`);
  if (start < 0) throw new Error('block not found: ' + id);
  const rowsKw = src.indexOf('rows: rows([', start);
  if (rowsKw < 0) throw new Error('rows not found: ' + id);
  const arrStart = src.indexOf('[', rowsKw) + 1;
  const arrEnd = src.indexOf('])', arrStart);
  if (arrEnd < 0) throw new Error('rows end not found: ' + id);
  return { arrStart, arrEnd };
}

for (const [file, ids] of Object.entries(FILES)) {
  const path = ROOT + 'src/data/' + file;
  let src = fs.readFileSync(path, 'utf8');
  const short = file.replace('.mjs', '');
  const edits = [];
  for (const id of ids) {
    const snap = before[short + ':' + id];
    if (!snap) throw new Error('no snapshot for ' + short + ':' + id);
    const { arrStart, arrEnd } = rowsSpan(src, id);
    const arrText = src.slice(arrStart, arrEnd);
    const matches = [...arrText.matchAll(/'([^']*)'/g)];
    if (matches.length !== snap.rows.length) throw new Error(`${id}: row count mismatch ${matches.length} vs snapshot ${snap.rows.length}`);
    matches.forEach((m, y) => {
      const row = m[1];
      if (row !== snap.rows[y]) throw new Error(`${short}:${id}: source row ${y} differs from snapshot`);
      let out = '';
      for (const c of row) out += c === 'L' ? F : c === 'G' ? W : c;
      if (out.length !== row.length) throw new Error(`${id}: row ${y} length changed`);
      edits.push({ start: arrStart + m.index + 1, end: arrStart + m.index + 1 + row.length, text: out });
    });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  fs.writeFileSync(path, src);
  console.log('converted', file, ids.join(' '));
}
