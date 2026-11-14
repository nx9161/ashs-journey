// W17-A kit art generator: writes .pix files for the 19 tranche-1 kinds.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const DIR = process.env.PIXDIR;
function rng(seed) { let h = createHash('sha256').update(seed).digest(); let i = 0; return () => { if (i >= 28) { h = createHash('sha256').update(h).digest(); i = 0; } return h[i++] / 256; }; }
function speckle(seed, base, flecks) { // flecks: [char, density]
  const r = rng(seed); const rows = [];
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = base; for (const [fc, d] of flecks) if (r() < d) { c = fc; break; } s += c; } rows.push(s); }
  return rows;
}
function writePix(name, title, rows, pal) {
  const body = [`# ${title}`, `PIX ${name} 16 16`, ...rows, 'PAL', ...Object.entries(pal).map(([k, v]) => `${k} ${v}`)].join('\n') + '\n';
  writeFileSync(`${DIR}/tile-${name}.pix`, body);
}
function writeProp(name, title, rows, pal) {
  const body = [`# ${title}`, `PIX tile-prop-${name} 16 16`, ...rows, 'PAL', ...Object.entries(pal).map(([k, v]) => `${k} ${v}`)].join('\n') + '\n';
  writeFileSync(`${DIR}/tile-prop-${name}.pix`, body);
}
function treeRows(seed, groundFn, can, trunk) {
  // canopy ellipse rows 1..9, trunk 10..13; surround from groundFn(x,y)
  const rows = [];
  const shape = { 1: [5, 10], 2: [3, 12], 3: [2, 13], 4: [2, 13], 5: [2, 13], 6: [3, 12], 7: [3, 12], 8: [4, 11], 9: [5, 10] };
  const r = rng(seed);
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) {
    let c = groundFn(x, y);
    if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.3 ? can[0] : v < 0.75 ? can[1] : can[2]; if (y <= 3 && x <= 7) c = can[2]; }
    if (y >= 10 && y <= 13 && (x === 7 || x === 8)) c = trunk;
    if (y === 14 && x >= 6 && x <= 9) c = can[0];
    s += c; } rows.push(s); }
  return rows;
}
const G = (base, fl) => (x, y) => { const v = ((x * 7 + y * 13) % 11); return v === 0 ? fl : base; };

// ---- Route 1: Chalk Meadow
writePix('chalkturf', 'Wave W17-A (Route 1): chalk meadow turf — even meadow green with chalk flecks and clover dots. Route 1\u2019s own ground (NO-SAME-KIT law; WAVE-W17-ROUTE-PROGRAM-PLAN.md).',
  speckle('chalkturf', 'a', [['b', 0.16], ['l', 0.10], ['f', 0.035]]),
  { a: '#74a267', b: '#68985d', l: '#85ba78', f: '#e8e4c8' });
writePix('chalkfloor', 'Wave W17-A (Route 1): chalk-sand path — pale chalk sand with white streaks and pebble dots (design-authorised sand, own texture).',
  speckle('chalkfloor', 'a', [['b', 0.18], ['w', 0.07], ['p', 0.05]]),
  { a: '#d9cba4', b: '#cbbd92', w: '#efe6c4', p: '#b7a67e' });
writePix('meadowoak', 'Wave W17-A (Route 1): meadow oak — round bright canopy, chalk turf baked in at measured colours.',
  treeRows('meadowoak', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#74a267', b: '#68985d', t: '#5d854b', u: '#4e7340', h: '#8ab273', k: '#71493d' });
writeProp('chalkstone', 'Wave W17-A (Route 1): chalkstone — pale chalk boulders on chalk turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('chalkstone', 'a', [['b', 0.16], ['f', 0.03]]); const put = (x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
    for (const [x, y] of [[5,9],[6,9],[7,9],[8,9],[9,9],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[6,11],[7,11],[8,11],[9,11]]) put(x, y, 's');
    for (const [x, y] of [[6,8],[7,8],[8,8],[7,9],[8,10]]) put(x, y, 'l');
    for (const [x, y] of [[5,11],[10,11],[6,12],[7,12],[8,12],[9,12]]) put(x, y, 'd'); return rows; })(),
  { a: '#74a267', b: '#68985d', f: '#e8e4c8', s: '#cfc9b4', l: '#e6e1cd', d: '#a49e88' });
// ---- Route 2: Needlewood
writePix('needleturf', 'Wave W17-A (Route 2): needlewood turf — deep forest loam green with brown needle litter.',
  speckle('needleturf', 'a', [['b', 0.20], ['n', 0.09], ['l', 0.06]]),
  { a: '#527a46', b: '#476e3c', n: '#7a5c38', l: '#639055' });
writePix('needlefloor', 'Wave W17-A (Route 2): needle path — needle-strewn earth-sand, brown strokes over pale sand (design-authorised sand family, own texture).',
  speckle('needlefloor', 'a', [['b', 0.18], ['n', 0.10], ['s', 0.08]]),
  { a: '#a8895e', b: '#96754c', n: '#6e5233', s: '#c2a878' });
writePix('needlepine', 'Wave W17-A (Route 2): needle pine — dark blue-green conical canopy, straight trunk, needle turf baked in.',
  (() => { const rows = []; const r = rng('needlepine'); const shape = { 1: [7, 8], 2: [6, 9], 3: [6, 9], 4: [5, 10], 5: [5, 10], 6: [4, 11], 7: [4, 11], 8: [3, 12], 9: [3, 12] };
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = ((x * 7 + y * 13) % 11 === 0) ? 'b' : 'a';
      if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.35 ? 'u' : v < 0.8 ? 't' : 'h'; }
      if (y >= 10 && y <= 13 && (x === 7 || x === 8)) c = 'k'; if (y === 14 && x >= 6 && x <= 9) c = 'u'; s += c; } rows.push(s); } return rows; })(),
  { a: '#527a46', b: '#476e3c', t: '#3f6b4f', u: '#33573f', h: '#5c8a68', k: '#5d4030' });
// ---- Route 3: Scree Shelf
writePix('screegrit', 'Wave W17-A (Route 3): scree grit — grey-olive angular grit with pebble speckle. Route 3\u2019s own ground.',
  speckle('screegrit', 'a', [['b', 0.20], ['c', 0.12], ['d', 0.07]]),
  { a: '#8f8b74', b: '#7d7a66', c: '#a3a08a', d: '#6b6858' });
writePix('shelffloor', 'Wave W17-A (Route 3): shelf-stone flags — large flat grey slabs with staggered joints (design: bare rock and ledges).',
  (() => { const rows = speckle('shelffloor', 'a', [['b', 0.14], ['l', 0.06]]); const joint = (y, xs) => { for (const x of xs) rows[y] = rows[y].substring(0, x) + 'm' + rows[y].substring(x + 1); };
    rows[7] = 'mmmmmmmmmmmmmmmm'; rows[15] = 'mmmmmmmmmmmmmmmm'; joint(3, [5, 11]); joint(11, [3, 9, 14]); joint(0, []); return rows; })(),
  { a: '#b5ae9e', b: '#a39c8a', l: '#c4beaf', m: '#948d7c' });
writePix('cragpine', 'Wave W17-A (Route 3): crag pine — sparse grey-green pine on scree grit (ground baked in).',
  treeRows('cragpine', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#8f8b74', b: '#7d7a66', t: '#5c7350', u: '#4a5f42', h: '#7d9470', k: '#5d4a38' });
writeProp('screeboulder', 'Wave W17-A (Route 3): scree boulder — a fallen grey boulder pile on scree grit (fully opaque, ground baked in).',
  (() => { const rows = speckle('screeboulder', 'a', [['b', 0.18], ['d', 0.06]]); const put = (x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
    for (const [x, y] of [[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[6,12],[7,12],[8,12],[9,12]]) put(x, y, 's');
    for (const [x, y] of [[6,9],[7,9],[8,9],[7,10],[8,11]]) put(x, y, 'l');
    for (const [x, y] of [[4,11],[11,11],[5,12],[10,12]]) put(x, y, 'd'); return rows; })(),
  { a: '#8f8b74', b: '#7d7a66', d: '#6b6858', s: '#9d9d9d', l: '#bcbcbc', });
// ---- Route 4: Terrace Ledge
writePix('terraceturf', 'Wave W17-A (Route 4): terrace turf — banded meadow turf with lighter lip lines, the ledged shelf\u2019s own ground.',
  (() => { const r = rng('terraceturf'); const rows = []; for (let y = 0; y < 16; y++) { let s = ''; const band = (y === 5 || y === 11) ? 'l' : (Math.floor(y / 6) % 2 ? 'b' : 'a'); for (let x = 0; x < 16; x++) { let c = band; if (band !== 'l' && r() < 0.14) c = band === 'a' ? 'b' : 'a'; s += c; } rows.push(s); } return rows; })(),
  { a: '#6f9c5f', b: '#63914f', l: '#93c07e' });
writePix('ledgefloor', 'Wave W17-A (Route 4): ledge-step path — stone-sand slabs with a step line every four rows (the one-way descent, drawn).',
  (() => { const rows = speckle('ledgefloor', 'a', [['b', 0.15], ['l', 0.05]]); for (const y of [3, 7, 11, 15]) rows[y] = 'mmmmmmmmmmmmmmmm'; for (const y of [4, 8, 12]) rows[y] = 'llllllllllllllll'; return rows; })(),
  { a: '#c9b78f', b: '#b3a077', l: '#ddd0a8', m: '#a89468' });
writePix('ledgepine', 'Wave W17-A (Route 4): ledge pine — wind-bent pine on terrace turf (ground baked in).',
  treeRows('ledgepine', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#6f9c5f', b: '#63914f', t: '#557d43', u: '#476b38', h: '#7fae67', k: '#6b4a33' });
writeProp('ledgecairn', 'Wave W17-A (Route 4): ledge cairn — a stacked-stone cairn at the ledge lip on terrace turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('ledgecairn', 'a', [['b', 0.14]]); const put = (x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
    for (const [x, y] of [[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[6,11],[7,11],[8,11],[9,11],[6,10],[7,10],[8,10],[7,9]]) put(x, y, 's');
    for (const [x, y] of [[7,10],[8,9]]) put(x, y, 'l'); for (const [x, y] of [[5,12],[10,12]]) put(x, y, 'd'); return rows; })(),
  { a: '#6f9c5f', b: '#63914f', s: '#a8a294', l: '#c2bcab', d: '#847e6e' });
// ---- Route 5: Day-Care Garden
writePix('gardenmeadow', 'Wave W17-A (Route 5): garden meadow — yellow-green meadow with sparse bloom dots. Route 5\u2019s own ground.',
  speckle('gardenmeadow', 'a', [['b', 0.16], ['f', 0.018], ['w', 0.014], ['y', 0.012]]),
  { a: '#82b163', b: '#74a257', f: '#e8a0bf', w: '#f2f0e0', y: '#eed97a' });
writePix('bloomfloor', 'Wave W17-A (Route 5): bloom lane — pale garden sand with petal flecks and brick-edge dots (design-authorised sand, own texture).',
  speckle('bloomfloor', 'a', [['b', 0.16], ['p', 0.03], ['r', 0.03]]),
  { a: '#e0cfa3', b: '#d2bf92', p: '#e8a0bf', r: '#b0765a' });
writePix('gardenelm', 'Wave W17-A (Route 5): garden elm — bright round elm on garden meadow (ground baked in).',
  treeRows('gardenelm', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#82b163', b: '#74a257', t: '#679c4e', u: '#57853f', h: '#97c47a', k: '#71493d' });
writeProp('bloombed', 'Wave W17-A (Route 5): bloom bed — a fenced flower bed of bloom rows on garden meadow (fully opaque, ground baked in).',
  (() => { const rows = speckle('bloombed', 'a', [['b', 0.14]]); const put = (x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
    for (let x = 2; x <= 13; x++) { put(x, 4, 't'); put(x, 12, 't'); }
    for (let y = 5; y <= 11; y++) { put(2, y, 't'); put(13, y, 't'); }
    for (let y = 5; y <= 11; y++) for (let x = 3; x <= 12; x++) put(x, y, 's');
    const blooms = ['f', 'w', 'y']; let bi = 0;
    for (let y = 6; y <= 10; y += 2) for (let x = 4; x <= 11; x += 2) put(x, y, blooms[bi++ % 3]);
    for (let y = 6; y <= 10; y++) for (let x = 3; x <= 12; x++) if ((x + y) % 3 === 0 && rows[y][x] === 's') put(x, y, 'g');
    return rows; })(),
  { a: '#82b163', b: '#74a257', t: '#8a6a44', s: '#5d7a43', g: '#6d8f52', f: '#e8a0bf', w: '#f2f0e0', y: '#eed97a' });
console.log('pix written');
