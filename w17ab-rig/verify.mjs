// W17-AB parity proof: every converted map vs its before-
// snapshot — non-row fields identical (encounter tables,
// warps, NPC posts, signs, items, events byte-identical by
// JSON equality); every changed cell is either a char-for-
// char trans swap or an exact prop cell; the convertible
// source kinds are fully converted; every non-convertible
// shipped kind holds its exact before-count (water, the
// current MECHANIC cells — counts AND positions, kelpbed /
// coral / kelp / uwcoral dressing, encounter grass, flower
// banks, fences); the literal trigger census holds ('.'
// converts entire on the two land routes; 'R' converts
// entire on r223 and Foamline; ',', '~', 'W', 'L', 'G'
// never move). Current positions are compared cell-for-cell.
import fs from 'node:fs';
import { MAPS9 } from '../src/data/maps9.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
const CH = (i) => String.fromCodePoint(0x1E00 + i);
const TRANS = {
  'r223': { seasand: CH(1507), rock: CH(1508) },
  'r224': { grassground: CH(1509), path: CH(1510), tree: CH(1511) },
  'seabreak-path': { boardwalk: CH(1513), tree: CH(1514), rock: CH(1515) },
  'r225': { grassground: CH(1516), path: CH(1517), tree: CH(1518) },
};
const PROPS = {
  'r223': {},
  'r224': { '2,7': CH(1512), '23,10': CH(1512) },
  'seabreak-path': {},
  'r225': { '15,7': CH(1519), '19,10': CH(1519) },
};
const PROP_SRC = { 'r224': 'grassground', 'r225': 'grassground' };
const EXPECT_NEW = {
  'r223': { leaguesand: 8, leaguerock: 6 },
  'r224': { headturf: 192, headfloor: 52, headpine: 81, headpost: 2 },
  'seabreak-path': { foamfloor: 52, foampine: 28, foamrock: 3 },
  'r225': { scorchturf: 190, zonefloor: 52, zonepine: 81, zonepost: 2 },
};
// Literal trigger chars that must read ZERO after conversion, per map.
const ZERO_AFTER = {
  'r223': ['R'],
  'r224': ['.'],
  'seabreak-path': ['R'],
  'r225': ['.'],
};
const before = JSON.parse(fs.readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
let bad = 0;
const kindCount = (rows) => { const c = {}; for (const row of rows) for (const ch of row) { const k = TILE_CHARS[ch] || ch; c[k] = (c[k] || 0) + 1; } return c; };
const charCount = (rows, ch) => rows.join('').split('').filter((c) => c === ch).length;
for (const id of Object.keys(TRANS)) {
  const b = before['maps9:' + id]; const a = MAPS9[id];
  if (!a) { console.log(id, 'MISSING after'); bad++; continue; }
  const { rows: br, ...bRest } = b; const { rows: ar, ...aRest } = a;
  if (JSON.stringify(bRest) !== JSON.stringify(aRest)) { console.log(id, 'NON-ROW FIELDS DIFFER'); bad++; }
  const trans = TRANS[id]; const props = PROPS[id] || {};
  let changed = 0;
  for (let y = 0; y < br.length; y++) for (let x = 0; x < br[y].length; x++) {
    const bc = br[y][x], ac = ar[y][x];
    if (bc === ac) continue;
    changed++;
    const bk = TILE_CHARS[bc];
    if (props[x + ',' + y] && ac === props[x + ',' + y] && bk === PROP_SRC[id]) continue;
    if (trans[bk] && ac === trans[bk]) continue;
    console.log(id, 'ILLEGAL CHANGE at', x, y, bk, '->', TILE_CHARS[ac] || ac); bad++;
  }
  // Mechanic position proof: every 'current' cell identical position.
  for (let y = 0; y < br.length; y++) for (let x = 0; x < br[y].length; x++) {
    if (TILE_CHARS[br[y][x]] === 'current' && ar[y][x] !== br[y][x]) { console.log(id, 'CURRENT MOVED at', x, y); bad++; }
  }
  const bc = kindCount(br), ac = kindCount(ar);
  for (const src of Object.keys(trans)) if (ac[src]) { console.log(id, 'source kind remains:', src, ac[src]); bad++; }
  for (const [k, n] of Object.entries(EXPECT_NEW[id])) if (ac[k] !== n) { console.log(id, 'new kind', k, '=', ac[k], 'expected', n); bad++; }
  for (const k of Object.keys(bc)) {
    if (trans[k] || Object.keys(EXPECT_NEW[id]).includes(k)) continue;
    if (ac[k] !== bc[k]) { console.log(id, 'preserved kind', k, bc[k], '->', ac[k]); bad++; }
  }
  for (const ch of ['.', ',', '~', 'W', 'L', 'G', 'R']) {
    const bb = charCount(br, ch), aa = charCount(ar, ch);
    const expect = ZERO_AFTER[id].includes(ch) ? 0 : bb;
    if (aa !== expect) { console.log(id, 'trigger char', JSON.stringify(ch), bb, '->', aa, 'expected', expect); bad++; }
  }
  console.log(id, 'cells changed:', changed, '| kinds after:', Object.entries(ac).sort((p, q) => q[1] - p[1]).map(([k, n]) => `${k}:${n}`).join(' '));
}
console.log(bad === 0 ? 'PARITY OK' : `PARITY FAILURES: ${bad}`);
process.exit(bad ? 1 : 0);
