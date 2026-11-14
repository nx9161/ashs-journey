// W17-D converter: char-for-char kind swaps inside the rows arrays
// of route20/route22/moon1/moon2/rocktunnel in maps2.mjs (+ the
// maps3.mjs copies of route20/route22/rocktunnel), plus signature
// props on asserted grassground cells for the two routes.
// Routes swap '_' -> ground, '.' -> path, '#' -> tree (the
// Tranches 1-3 idiom). Caves swap 'L' (cavefloor) -> the map's own
// floor kind and 'G' (cavewall) -> its own wall kind — art layer
// only; every other char (encounter grass, water, boulders, the
// shipped dressing kinds, door/stair chars) is preserved exactly.
// Dual copies: route20's rows AND records are byte-identical
// across copies; route22/rocktunnel rows are byte-identical while
// their records drifted (registry class D) — converted rows are
// written identically into both copies, record drift untouched.
// Replacements are length-preserving and spliced in place by
// offset, so every byte outside the row strings is preserved
// exactly. Assertions run against the before-snapshot
// (/tmp/w17d-before.json).
import fs from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const before = JSON.parse(fs.readFileSync('/tmp/w17d-before.json', 'utf8'));
const CH = (i) => String.fromCodePoint(0x1E00 + i);
const ROUTES = {
  route20: { g: CH(1152), p: CH(1153), t: CH(1154), prop: CH(1155), props: [[2,1],[4,2],[2,2],[3,2]], nProps: 2 },
  route22: { g: CH(1156), p: CH(1157), t: CH(1158), prop: CH(1159), props: [[2,1],[13,1],[1,1],[10,1]], nProps: 2 },
};
const CAVES = {
  moon1: { f: CH(1160), w: CH(1161) },
  moon2: { f: CH(1162), w: CH(1163) },
  rocktunnel: { f: CH(1164), w: CH(1165) },
};
const FILES = { 'maps2.mjs': ['route20','route22','moon1','moon2','rocktunnel'], 'maps3.mjs': ['route20','route22','rocktunnel'] };

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
  const edits = [];
  for (const id of ids) {
    const snap = before[short + ':' + id];
    if (!snap) throw new Error('no snapshot for ' + short + ':' + id);
    const { arrStart, arrEnd } = rowsSpan(src, id);
    const arrText = src.slice(arrStart, arrEnd);
    const matches = [...arrText.matchAll(/'([^']*)'/g)];
    if (matches.length !== snap.rows.length) throw new Error(`${id}: row count mismatch ${matches.length} vs snapshot ${snap.rows.length}`);
    let chosen = [];
    if (ROUTES[id]) {
      const kit = ROUTES[id];
      const blocked = new Set();
      for (const n of snap.npcs || []) blocked.add(n.x + ',' + n.y);
      for (const w of snap.warps || []) blocked.add(w.x + ',' + w.y);
      for (const s of snap.signs || []) blocked.add(s.x + ',' + s.y);
      for (const [x, y] of kit.props) {
        if (chosen.length >= kit.nProps) break;
        if (blocked.has(x + ',' + y)) continue;
        if (snap.rows[y][x] !== '_') continue;
        chosen.push([x, y]);
      }
      if (chosen.length < kit.nProps) throw new Error(`${short}:${id}: only ${chosen.length} lawful prop cells found`);
      placedReport[short + ':' + id] = chosen;
    }
    matches.forEach((m, y) => {
      const row = m[1];
      if (row !== snap.rows[y]) throw new Error(`${short}:${id}: source row ${y} differs from snapshot`);
      let out = '';
      if (ROUTES[id]) {
        const kit = ROUTES[id];
        for (const c of row) out += c === '_' ? kit.g : c === '.' ? kit.p : c === '#' ? kit.t : c;
        for (const [px, py] of chosen) if (py === y) {
          if (out[px] !== kit.g) throw new Error(`${id}: prop cell ${px},${py} is not converted ground`);
          out = out.substring(0, px) + kit.prop + out.substring(px + 1);
        }
      } else {
        const kit = CAVES[id];
        for (const c of row) out += c === 'L' ? kit.f : c === 'G' ? kit.w : c;
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
