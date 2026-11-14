// W17-B converter: char-for-char kind swaps on the ground/path/tree
// chars ONLY ('_' -> route ground, '.' -> route path, '#' -> route
// tree) inside the rows arrays of routes 6-10 in maps2.mjs (+ the
// maps3.mjs copies of routes 8/9/10, written identically), plus
// signature props placed on asserted grassground cells. Replacements
// are length-preserving and spliced in place by offset, so every
// byte outside the row strings is preserved exactly. Assertions run
// against the before-snapshot (/tmp/w17b-before.json).
import fs from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const before = JSON.parse(fs.readFileSync('/tmp/w17b-before.json', 'utf8'));
const CH = (i) => String.fromCodePoint(0x1E00 + i);
// kind char by index: ground, path, tree, prop
const KITS = {
  route6:  { g: CH(1112), p: CH(1113), t: CH(1114), prop: CH(1115), props: [[6,3],[9,4],[9,3],[6,4],[10,4],[5,3]], nProps: 2 },
  route7:  { g: CH(1116), p: CH(1117), t: CH(1118), prop: CH(1119), props: [[6,4],[6,6],[5,6],[7,4],[7,6]], nProps: 2 },
  route8:  { g: CH(1120), p: CH(1121), t: CH(1122), prop: CH(1123), props: [[6,6],[9,6],[5,6],[10,6],[7,6],[8,6]], nProps: 2 },
  route9:  { g: CH(1124), p: CH(1125), t: CH(1126), prop: CH(1127), props: [[2,1],[12,9],[12,1],[3,1],[11,9]], nProps: 2 },
  route10: { g: CH(1128), p: CH(1129), t: CH(1130), prop: CH(1131), props: [[5,1],[10,3],[7,12],[5,3],[13,2],[4,1]], nProps: 3 },
};
const FILES = { 'maps2.mjs': ['route6','route7','route8','route9','route10'], 'maps3.mjs': ['route8','route9','route10'] };

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

const placedReport = {};
for (const [file, ids] of Object.entries(FILES)) {
  const path = ROOT + 'src/data/' + file;
  let src = fs.readFileSync(path, 'utf8');
  const short = file.replace('.mjs', '');
  const edits = []; // {start, end, text} over row-string contents
  for (const id of ids) {
    const kit = KITS[id];
    const snap = before[short + ':' + id];
    if (!snap) throw new Error('no snapshot for ' + short + ':' + id);
    const blocked = new Set();
    for (const n of snap.npcs || []) blocked.add(n.x + ',' + n.y);
    for (const w of snap.warps || []) blocked.add(w.x + ',' + w.y);
    for (const s of snap.signs || []) blocked.add(s.x + ',' + s.y);
    const chosen = [];
    for (const [x, y] of kit.props) {
      if (chosen.length >= kit.nProps) break;
      if (blocked.has(x + ',' + y)) continue;
      if (snap.rows[y][x] !== '_') continue;
      chosen.push([x, y]);
    }
    if (chosen.length < kit.nProps) throw new Error(`${id}: only ${chosen.length} lawful prop cells found`);
    placedReport[short + ':' + id] = chosen;
    const { arrStart, arrEnd } = rowsSpan(src, id);
    const arrText = src.slice(arrStart, arrEnd);
    const matches = [...arrText.matchAll(/'([^']*)'/g)];
    if (matches.length !== snap.rows.length) throw new Error(`${id}: row count mismatch ${matches.length} vs snapshot ${snap.rows.length}`);
    matches.forEach((m, y) => {
      const row = m[1];
      if (row !== snap.rows[y]) throw new Error(`${id}: source row ${y} differs from snapshot`);
      let out = '';
      for (const c of row) out += c === '_' ? kit.g : c === '.' ? kit.p : c === '#' ? kit.t : c;
      for (const [px, py] of chosen) if (py === y) {
        if (out[px] !== kit.g) throw new Error(`${id}: prop cell ${px},${py} is not converted ground`);
        out = out.substring(0, px) + kit.prop + out.substring(px + 1);
      }
      if (out.length !== row.length) throw new Error(`${id}: row ${y} length changed`);
      edits.push({ start: arrStart + m.index + 1, end: arrStart + m.index + 1 + row.length, text: out });
    });
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  fs.writeFileSync(path, src);
  console.log('converted', file, ids.join(' '));
}
console.log('props placed:', JSON.stringify(placedReport));
