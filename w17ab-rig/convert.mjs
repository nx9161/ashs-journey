// W17-AB convert: char-for-char conversion of the Borea
// tranche-8 maps inside src/data/maps9.mjs (Route 223,
// Route 224, Foamline Path, Route 225). Only row strings
// change; every other byte of each definition (warps,
// signs, npcs, encounters) is preserved by construction —
// the splice replaces row-string spans in place,
// length-preserving (every swap is one code point for one
// code point in the BMP-private block U+1E00+). The
// before-snapshot lives DURABLY beside this rig
// (w17ab-rig/before.json), never in /tmp.
import fs from 'node:fs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
const CH = (i) => String.fromCodePoint(0x1E00 + i);
const ROUTES = {
  // Route 223 "League Sea Road" (deep surf lane): seasand ->
  // leaguesand, rock -> leaguerock; water 366, current 8
  // (MECHANIC — byte-identical counts and positions),
  // kelpbed 22, coral 9, kelp 7, uwcoral 5 stand
  // byte-preserved entire. Low convertible count (8 + 6) is
  // the pre-recorded R40-class exception (Ruling #5).
  // Summit Road's side of the south warp pair is NOT in
  // this map and is not edited (excluded map).
  'r223': {
    trans: { seasand: CH(1507), rock: CH(1508) },
    props: {}, propSrc: null,
  },
  // Route 224 "Stone Coast": grassground -> headturf, path
  // -> headfloor, tree -> headpine; encounter grass 45,
  // flower 17, shore water 15, rock 4, signpost 4, fence 3
  // stand byte-preserved. Headstone posts on verified
  // grassground: (2,7) on the north verge at the League
  // end, (23,10) on the south verge at the Foamline end —
  // the design's white stones standing in the prop
  // register along the coast road.
  'r224': {
    trans: { grassground: CH(1509), path: CH(1510), tree: CH(1511) },
    props: { '2,7': CH(1512), '23,10': CH(1512) }, propSrc: 'grassground',
  },
  // Foamline Path (THE CAUSEWAY METHOD, Ruling #4, second
  // use): boardwalk -> foamfloor (the planks ARE the path
  // tier — the causeway has no banks), tree -> foampine,
  // rock -> foamrock; water 332 stands byte-preserved
  // entire. No ground register ships on this map —
  // recorded, not invented. No props. flower-paradise's
  // side of the east warp pair is not edited (out of
  // program).
  'seabreak-path': {
    trans: { boardwalk: CH(1513), tree: CH(1514), rock: CH(1515) },
    props: {}, propSrc: null,
  },
  // Route 225 "Hard Road": grassground -> scorchturf, path
  // -> zonefloor, tree -> zonepine; encounter grass 46,
  // flower 21, pond water 15, rock 6, signpost 2 stand
  // byte-preserved. Training-ground posts on verified
  // grassground: (15,7) on the north verge east of the
  // sign, (19,10) on the south verge — the Wildreach
  // approach flanked as a training ground.
  'r225': {
    trans: { grassground: CH(1516), path: CH(1517), tree: CH(1518) },
    props: { '15,7': CH(1519), '19,10': CH(1519) }, propSrc: 'grassground',
  },
};
const before = JSON.parse(fs.readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
const path = new URL('../src/data/maps9.mjs', import.meta.url).pathname;
let src = fs.readFileSync(path, 'utf8');
function rowsSpan(text, id) {
  const start = text.indexOf(`"${id}": {`);
  if (start < 0) throw new Error('def not found: ' + id);
  const rs = text.indexOf('"rows": [', start);
  const re = text.indexOf(']', rs);
  return [rs, re];
}
const edits = [];
for (const [id, r] of Object.entries(ROUTES)) {
  const snap = before['maps9:' + id];
  if (!snap) throw new Error('no snapshot for ' + id);
  const [rs, re] = rowsSpan(src, id);
  const seg = src.slice(rs, re);
  const rowStrs = [...seg.slice(seg.indexOf('[')).matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (JSON.stringify(rowStrs) !== JSON.stringify(snap.rows)) throw new Error(id + ': source rows != snapshot rows');
  const newRows = snap.rows.map((row, y) => [...row].map((ch, x) => {
    const p = r.props[x + ',' + y]; if (p) return p;
    const t = r.trans[TILE_CHARS[ch]]; return t || ch;
  }).join(''));
  for (const [key, pch] of Object.entries(r.props)) {
    const [x, y] = key.split(',').map(Number);
    if (TILE_CHARS[snap.rows[y][x]] !== r.propSrc) throw new Error(id + ': prop cell ' + key + ' not ' + r.propSrc);
    if (newRows[y][x] !== pch) throw new Error(id + ': prop not applied at ' + key);
  }
  edits.push([rs, re, seg, newRows]);
}
for (const [rs, re, seg, newRows] of edits.sort((a, b) => b[0] - a[0])) {
  let out = seg;
  const open = seg.indexOf('[');
  const matches = [...seg.slice(open).matchAll(/"([^"]*)"/g)];
  if (matches.length !== newRows.length) throw new Error('row-string count mismatch in splice');
  for (let i = matches.length - 1; i >= 0; i--) {
    const idx = open + matches[i].index;
    out = out.slice(0, idx) + '"' + newRows[i] + '"' + out.slice(idx + matches[i][0].length);
  }
  src = src.slice(0, rs) + out + src.slice(re);
}
fs.writeFileSync(path, src);
console.log('converted', Object.keys(ROUTES).length, 'maps in maps9.mjs');
