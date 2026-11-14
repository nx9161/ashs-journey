// W17-C converter: char-for-char kind swaps on the ground/path/tree
// chars ONLY ('_' -> route ground, '.' -> route path, '#' -> route
// tree) inside the rows arrays of routes 11/12/15/16/19 in maps2.mjs
// (+ the maps3.mjs copies of routes 12/15/16/19), plus signature
// props placed on asserted grassground cells. Route 12's two copies
// are NOT row-identical (registry class D — the maps3/live copy
// carries dressing props and its own geometry), so each copy is
// converted on its own rows; routes 15/16/19 rows were byte-
// identical across copies and receive identical converted rows.
// Replacements are length-preserving and spliced in place by
// offset, so every byte outside the row strings is preserved
// exactly. Assertions run against the before-snapshot
// (/tmp/w17c-before.json).
import fs from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const before = JSON.parse(fs.readFileSync('/tmp/w17c-before.json', 'utf8'));
const CH = (i) => String.fromCodePoint(0x1E00 + i);
// kind char by index: ground, path, tree, prop
const KITS = {
  route11: { g: CH(1132), p: CH(1133), t: CH(1134), prop: CH(1135), props: [[2,1],[11,9],[3,1],[10,9],[6,6]], nProps: 2 },
  route12: { g: CH(1136), p: CH(1137), t: CH(1138), prop: CH(1139), props: [[7,6],[10,2],[8,6],[13,1]], propsMaps2: [[13,1],[12,3],[13,2],[6,6]], nProps: 2 },
  route15: { g: CH(1140), p: CH(1141), t: CH(1142), prop: CH(1143), props: [[6,6],[7,6],[2,1],[13,9]], nProps: 2 },
  route16: { g: CH(1144), p: CH(1145), t: CH(1146), prop: CH(1147), props: [[2,6],[3,6],[6,9],[7,9]], nProps: 2 },
  route19: { g: CH(1148), p: CH(1149), t: CH(1150), prop: CH(1151), props: [[2,1],[12,6],[3,1],[10,6]], nProps: 2 },
};
const FILES = { 'maps2.mjs': ['route11','route12','route15','route16','route19'], 'maps3.mjs': ['route12','route15','route16','route19'] };

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
    const cand = (short === 'maps2' && kit.propsMaps2) ? kit.propsMaps2 : kit.props;
    const chosen = [];
    for (const [x, y] of cand) {
      if (chosen.length >= kit.nProps) break;
      if (blocked.has(x + ',' + y)) continue;
      if (snap.rows[y][x] !== '_') continue;
      chosen.push([x, y]);
    }
    if (chosen.length < kit.nProps) throw new Error(`${short}:${id}: only ${chosen.length} lawful prop cells found`);
    placedReport[short + ':' + id] = chosen;
    const { arrStart, arrEnd } = rowsSpan(src, id);
    const arrText = src.slice(arrStart, arrEnd);
    const matches = [...arrText.matchAll(/'([^']*)'/g)];
    if (matches.length !== snap.rows.length) throw new Error(`${id}: row count mismatch ${matches.length} vs snapshot ${snap.rows.length}`);
    matches.forEach((m, y) => {
      const row = m[1];
      if (row !== snap.rows[y]) throw new Error(`${short}:${id}: source row ${y} differs from snapshot`);
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
