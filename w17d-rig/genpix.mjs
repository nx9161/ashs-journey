// W17-D kit art generator: writes .pix files for the 14 tranche-4 kinds.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const DIR = process.env.PIXDIR;
function rng(seed) { let h = createHash('sha256').update(seed).digest(); let i = 0; return () => { if (i >= 28) { h = createHash('sha256').update(h).digest(); i = 0; } return h[i++] / 256; }; }
function speckle(seed, base, flecks) {
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
function pineRows(seed, groundFn, can, trunk) {
  const rows = []; const r = rng(seed); const shape = { 1: [7, 8], 2: [6, 9], 3: [6, 9], 4: [5, 10], 5: [5, 10], 6: [4, 11], 7: [4, 11], 8: [3, 12], 9: [3, 12] };
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = groundFn(x, y);
    if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.35 ? can[0] : v < 0.8 ? can[1] : can[2]; }
    if (y >= 10 && y <= 13 && (x === 7 || x === 8)) c = trunk; if (y === 14 && x >= 6 && x <= 9) c = can[0]; s += c; } rows.push(s); }
  return rows;
}
// Banded cave wall in the cavewall-1 idiom: dark slate cap, rock band
// with a crack, warm strata band, dark band, slate base — plus pale
// hanging points (cones) drawn into the cap in the wall's own art.
function caveWallRows(seed, K) {
  const rows = []; const r = rng(seed);
  const bands = [K.z, K.z, K.z, K.m, K.m, K.m, K.m, K.a, K.a, K.a, K.z, K.z, K.z, K.g, K.g, K.g];
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = bands[y]; if (r() < 0.10) c = bands[y] === K.m ? K.z : K.m; s += c; } rows.push(s); }
  const put = (x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
  for (const cx of [2, 8, 13]) { put(cx, 3, K.c); put(cx, 4, K.c); put(cx, 5, K.c); }
  put(11, 4, K.g); put(11, 5, K.g); put(11, 6, K.g);
  return rows;
}
const G = (base, fl) => (x, y) => { const v = ((x * 7 + y * 13) % 11); return v === 0 ? fl : base; };
const put = (rows, x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };

// ---- Route 20: Rime Surf (idx 1152-1155)
writePix('rimeshore', 'Wave W17-D (Route 20): rime shore — frost-touched shore turf, pale sage with white rime flecks and shell grit where the surf lane meets the Rime Isles\u2019 cold. Route 20\u2019s own ground (NO-SAME-KIT law; WAVE-W17-ROUTE-PROGRAM-PLAN.md).',
  speckle('rimeshore', 'a', [['b', 0.16], ['d', 0.05], ['w', 0.05], ['s', 0.03]]),
  { a: '#7d9b8a', b: '#6d8a7a', d: '#5b7a6e', w: '#eef4f2', s: '#cfd8ce' });
writePix('surfloor', 'Wave W17-D (Route 20): surf sand — cold wet shore sand with foam flecks, the surf lane\u2019s own surface (design-authorised sand over cold blue water, own texture).',
  speckle('surfloor', 'a', [['b', 0.16], ['d', 0.05], ['w', 0.05]]),
  { a: '#d8cdb2', b: '#c8bb9c', d: '#b3a37f', w: '#f4f6f0' });
writePix('surfpine', 'Wave W17-D (Route 20): surf pine — a deep teal pine with frost-pale tips, on rime shore (ground baked in).',
  (() => { const rows = pineRows('surfpine', G('a', 'b'), ['u', 't', 'h'], 'k'); const r = rng('surfpine-frost');
    for (let y = 1; y <= 5; y++) for (let x = 0; x < 16; x++) if ((rows[y][x] === 't' || rows[y][x] === 'h') && r() < 0.30) put(rows, x, y, 'f');
    return rows; })(),
  { a: '#7d9b8a', b: '#6d8a7a', t: '#3e6b57', u: '#2f5545', h: '#5d8a72', f: '#dcebe4', k: '#5d4a38' });
writeProp('coldspring', 'Wave W17-D (Route 20): cold spring — a pale ice-blue seep pool with a white rime rim and frost tufts, on rime shore (fully opaque, ground baked in). The Rime caves breathe cold; the shore answers with springs that never warm.',
  (() => { const rows = speckle('coldspring', 'a', [['b', 0.13], ['w', 0.03]]);
    for (const [x, y] of [[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8]]) put(rows, x, y, 'w');
    for (const [x, y] of [[6,6],[7,6],[8,6],[9,6],[6,7],[7,7],[8,7],[9,7],[7,8],[8,8]]) put(rows, x, y, 'c');
    for (const [x, y] of [[7,7],[8,7]]) put(rows, x, y, 'D');
    for (const [x, y] of [[2,11],[13,12],[3,4]]) put(rows, x, y, 't');
    return rows; })(),
  { a: '#7d9b8a', b: '#6d8a7a', w: '#eef4f2', c: '#a8d4de', D: '#7fb2c4', t: '#5d8a72' });
// ---- Route 22: League Road (idx 1156-1159)
writePix('leagueturf', 'Wave W17-D (Route 22): league turf — the guarded meadow of the League road, rich green with gold flecks kept like a ceremony ground. Route 22\u2019s own ground.',
  speckle('leagueturf', 'a', [['b', 0.15], ['d', 0.05], ['g', 0.03]]),
  { a: '#79a95c', b: '#6a9850', d: '#59823f', g: '#e5c65c' });
writePix('leaguewayfloor', 'Wave W17-D (Route 22): league way — ceremonial paved slabs, large pale flags with grout seams (plain slabs; distinct from Grapefruit\u2019s herringbone leaguefloor). The road the League keeps for its challengers.',
  (() => { const rows = speckle('leaguewayfloor', 'a', [['b', 0.13], ['h', 0.05]]);
    for (let x = 0; x < 16; x++) { put(rows, x, 7, 's'); put(rows, x, 15, 's'); }
    for (let y = 0; y < 7; y++) put(rows, 7, y, 's');
    for (let y = 8; y < 15; y++) put(rows, 3, y, 's');
    for (let y = 8; y < 15; y++) put(rows, 11, y, 's');
    return rows; })(),
  { a: '#d9d2ba', b: '#c9c0a4', s: '#b3a888', h: '#e8e2cc' });
writePix('leagueoak', 'Wave W17-D (Route 22): league oak — a stately broad oak, deeper green than the meadow oaks of the south road, on league turf (ground baked in).',
  treeRows('leagueoak', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#79a95c', b: '#6a9850', t: '#4f7d38', u: '#3f652c', h: '#6f9c4c', k: '#6e4c34' });
writeProp('leaguepost', 'Wave W17-D (Route 22): league post — a dressed stone marker pillar with a gold band, standing on league turf (fully opaque, ground baked in). The gate\u2019s own furniture: eight badges open the road.',
  (() => { const rows = speckle('leaguepost', 'a', [['b', 0.13], ['g', 0.02]]);
    for (let y = 3; y <= 13; y++) { put(rows, 6, y, 's'); put(rows, 7, y, 's'); put(rows, 8, y, 's'); put(rows, 9, y, 's'); }
    for (const x of [5, 6, 7, 8, 9, 10]) { put(rows, x, 2, 'c'); put(rows, x, 13, 'd'); put(rows, x, 14, 'd'); }
    for (const x of [6, 7, 8, 9]) put(rows, x, 6, 'g');
    put(rows, 7, 9, 'd'); put(rows, 8, 10, 'd');
    return rows; })(),
  { a: '#79a95c', b: '#6a9850', g: '#e5c65c', s: '#b9b2a0', d: '#8f8875', c: '#d9d2ba' });
// ---- Mt. Lunestone 1F: Lunestone Deep (idx 1160-1161)
writePix('lunefloor', 'Wave W17-D (Lunestone 1F): lune floor — pale moonstone cave flags, lavender-grey with grout dashes and rare bright sparkle; the upper dark of the fossil mountain in its own stone (not Hushmoor\u2019s town moonfloor).',
  (() => { const rows = speckle('lunefloor', 'a', [['b', 0.18], ['d', 0.07], ['s', 0.012]]);
    const r = rng('lunefloor-grout');
    for (let i = 0; i < 12; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 16); put(rows, x, y, 'g'); put(rows, x + 1, y, 'g'); }
    return rows; })(),
  { a: '#a89cc0', b: '#bcb0d2', d: '#978bb2', g: '#8478a0', s: '#e9e2f7' });
writePix('lunewall', 'Wave W17-D (Lunestone 1F): lune wall — banded moonstone cave wall in the cavewall idiom, a paler lavender register with its own hanging points and a fossil-warm strata band.',
  caveWallRows('lunewall', { z: 'z', m: 'm', a: 'a', c: 'c', g: 'g' }),
  { z: '#6f6584', m: '#9890ad', a: '#b3a58e', c: '#cfc6de', g: '#565064' });
// ---- Mt. Lunestone B1F: Lunestone Dark (idx 1162-1163)
writePix('darklunefloor', 'Wave W17-D (Lunestone B1F): dark lune floor — the same moonstone seam one value down: near-black blue-grey flags with dim grout and the rarest sparkle, the fossil chamber floor.',
  (() => { const rows = speckle('darklunefloor', 'a', [['b', 0.17], ['s', 0.006]]);
    const r = rng('darklunefloor-grout');
    for (let i = 0; i < 12; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 16); put(rows, x, y, 'g'); put(rows, x + 1, y, 'g'); }
    return rows; })(),
  { a: '#4c4a63', b: '#5a5872', g: '#35334a', s: '#8f8fb5' });
writePix('darklunewall', 'Wave W17-D (Lunestone B1F): dark lune wall — the lune wall\u2019s deep twin, split from 1F by value, not hue: near-black blue-grey bands with a dim strata seam.',
  caveWallRows('darklunewall', { z: 'z', m: 'm', a: 'a', c: 'c', g: 'g' }),
  { z: '#2e2c40', m: '#454359', a: '#5d5648', c: '#6d6a86', g: '#232130' });
// ---- Stonebore Tunnel: Stonebore Strata (idx 1164-1165)
writePix('stratadeepfloor', 'Wave W17-D (Stonebore): strata-deep floor — the tunnel\u2019s own strata seam one band down: the shipped stratafloor hues stepped deeper for the bore\u2019s unlit middle (per-route extension of its own family, not shared).',
  speckle('stratadeepfloor', 'B', [['D', 0.36], ['A', 0.09]]),
  { B: '#77664c', D: '#5d4f3a', A: '#8a795c' });
writePix('stratadeepwall', 'Wave W17-D (Stonebore): strata-deep wall — the shipped stratwall\u2019s deep band, same warm seam at a lower value, with the family\u2019s two dark course lines.',
  (() => { const rows = speckle('stratadeepwall', 'B', [['D', 0.30], ['A', 0.14]]);
    for (let x = 0; x < 16; x++) { put(rows, x, 4, 'D'); put(rows, x, 9, 'D'); }
    return rows; })(),
  { B: '#6b5f45', D: '#4e4433', A: '#7d6f52' });
console.log('pix written');
