// W17-C kit art generator: writes .pix files for the 20 tranche-3 kinds.
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
const G = (base, fl) => (x, y) => { const v = ((x * 7 + y * 13) % 11); return v === 0 ? fl : base; };
const put = (rows, x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };

// ---- Route 11: Sleeper Meadow (idx 1132-1135)
writePix('hollowturf', 'Wave W17-C (Route 11): hollow turf — warm meadow green with faint crescent scuff arcs, the trace of the hollow where something huge once slept. Route 11\u2019s own ground (NO-SAME-KIT law; WAVE-W17-ROUTE-PROGRAM-PLAN.md).',
  (() => { const rows = speckle('hollowturf', 'a', [['b', 0.16], ['d', 0.05]]);
    for (const [x, y] of [[3,4],[4,3],[5,3],[6,3],[7,4],[10,11],[11,10],[12,10],[13,10],[14,11]]) put(rows, x, y, 's');
    return rows; })(),
  { a: '#77a860', b: '#689655', d: '#597f4a', s: '#93ba7c' });
writePix('trenchfloor', 'Wave W17-C (Route 11): trench sand — pale survey sand with short dug-edge dashes and rare red flag flecks (design-authorised sand, own texture).',
  speckle('trenchfloor', 'a', [['b', 0.16], ['t', 0.07], ['f', 0.012]]),
  { a: '#d9cbA4', b: '#c9b98f', t: '#a08c60', f: '#c0453a' });
writePix('hollowoak', 'Wave W17-C (Route 11): hollow oak — broad round oak with a warm amber-green canopy on hollow turf (ground baked in).',
  treeRows('hollowoak', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#77a860', b: '#689655', t: '#5d8a41', u: '#4c7334', h: '#8ab364', k: '#6e4c34' });
writeProp('surveypost', 'Wave W17-C (Route 11): survey post — a striped survey stake with a red flag and a pale map sheet pinned at its base, on hollow turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('surveypost', 'a', [['b', 0.13]]);
    for (let y = 4; y <= 12; y++) put(rows, 7, y, 'w');
    for (let y = 4; y <= 12; y += 2) put(rows, 7, y, 'r');
    for (const [x, y] of [[8,4],[9,4],[10,4],[8,5],[9,5]]) put(rows, x, y, 'f');
    for (const [x, y] of [[4,12],[5,12],[6,12],[4,13],[5,13],[6,13]]) put(rows, x, y, 'm');
    put(rows, 5, 12, 't');
    return rows; })(),
  { a: '#77a860', b: '#689655', w: '#e8e2d2', r: '#c0453a', f: '#d84a3e', m: '#efe8d4', t: '#8a9a6a' });
// ---- Route 12: Reed Boardwalk (idx 1136-1139)
writePix('reedturf', 'Wave W17-C (Route 12): reed turf — marshy green with vertical reed-stroke flecks along the channels. Route 12\u2019s own ground.',
  speckle('reedturf', 'a', [['b', 0.15], ['r', 0.09], ['d', 0.04]]),
  { a: '#6f9e5e', b: '#619052', r: '#4d7a44', d: '#557f52' });
writePix('reedfloor', 'Wave W17-C (Route 12): reed boardwalk — the route\u2019s own boardwalk weave: horizontal warm planks with dark seams every four rows and nail dots (canalave precedent family, own weave).',
  (() => { const rows = []; const r = rng('reedfloor');
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = 'a'; const v = r(); if (v < 0.14) c = 'b'; if (y % 4 === 3) c = 's'; if ((x === 1 || x === 14) && y % 4 === 1) c = 'n'; s += c; } rows.push(s); }
    return rows; })(),
  { a: '#b99a68', b: '#a98a58', s: '#7d6240', n: '#5d4a30' });
writePix('reedwillow', 'Wave W17-C (Route 12): reed willow — a narrow willow with long hanging reed-green strands, slimmer than Route 6\u2019s pond willow, on reed turf (ground baked in).',
  (() => { const rows = []; const r = rng('reedwillow'); const shape = { 0: [5, 10], 1: [3, 12], 2: [2, 13], 3: [2, 13], 4: [3, 12], 5: [3, 12], 6: [4, 11], 7: [4, 11], 8: [5, 10] };
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = ((x * 7 + y * 13) % 11 === 0) ? 'b' : 'a';
      if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.3 ? 'u' : v < 0.75 ? 't' : 'h'; if (y <= 2 && x <= 7) c = 'h'; }
      if (y >= 9 && y <= 12 && (x === 3 || x === 6 || x === 9 || x === 12) && r() < 0.75) c = 't';
      if (y >= 11 && y <= 14 && (x === 7 || x === 8)) c = 'k';
      s += c; } rows.push(s); } return rows; })(),
  { a: '#6f9e5e', b: '#619052', t: '#55853f', u: '#446e33', h: '#7fae62', k: '#63503a' });
writeProp('railpost', 'Wave W17-C (Route 12): rail posts — two boardwalk railing posts with a top rail, on reed turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('railpost', 'a', [['b', 0.13], ['r', 0.05]]);
    for (const x of [3, 12]) for (let y = 5; y <= 13; y++) put(rows, x, y, 'w');
    for (let x = 0; x < 16; x++) put(rows, x, 6, 'r');
    for (const x of [3, 12]) { put(rows, x, 5, 'd'); put(rows, x, 6, 'd'); }
    return rows; })(),
  { a: '#6f9e5e', b: '#619052', r: '#4d7a44', w: '#8a6c46', d: '#6b5233' });
// ---- Route 15: Copycat Grass (idx 1140-1143)
writePix('copyturf', 'Wave W17-C (Route 15): copy turf — meadow turf whose pale tuft flecks land in near-duplicate pairs, the copying grass drawn at texture scale. Route 15\u2019s own ground.',
  (() => { const rows = speckle('copyturf', 'a', [['b', 0.15], ['d', 0.05]]); const r = rng('copyturf-pairs');
    for (let i = 0; i < 9; i++) { const x = 1 + Math.floor(r() * 13), y = Math.floor(r() * 16); put(rows, x, y, 'p'); put(rows, x + 1, y, 'e'); }
    return rows; })(),
  { a: '#74a75e', b: '#659452', d: '#567f46', p: '#a9cc8d', e: '#c2deb0' });
writePix('copyfloor', 'Wave W17-C (Route 15): copy sand — pale sand with a faint offset echo speckle, every dark fleck shadowed by a paler twin (design-authorised sand, own texture).',
  (() => { const rows = speckle('copyfloor', 'a', [['b', 0.15]]); const r = rng('copyfloor-echo');
    for (let i = 0; i < 10; i++) { const x = 1 + Math.floor(r() * 13), y = Math.floor(r() * 15); put(rows, x, y, 'd'); put(rows, x + 1, y + 1, 'e'); }
    return rows; })(),
  { a: '#dbd0a8', b: '#cbbd93', d: '#a8946c', e: '#e9e1c2' });
writePix('copyelm', 'Wave W17-C (Route 15): copy elm — an elm whose canopy carries a pale echo fringe along its east edge, the copy never quite the thing itself, on copy turf (ground baked in).',
  (() => { const rows = treeRows('copyelm', G('a', 'b'), ['u', 't', 'h'], 'k');
    for (let y = 2; y <= 8; y++) { const row = rows[y]; for (let x = 15; x >= 0; x--) if (row[x] === 't' || row[x] === 'u' || row[x] === 'h') { if (x + 1 < 16 && rows[y][x + 1] !== 't' && rows[y][x + 1] !== 'u' && rows[y][x + 1] !== 'h') put(rows, x + 1, y, 'e'); break; } }
    return rows; })(),
  { a: '#74a75e', b: '#659452', t: '#5c8a44', u: '#4b7236', h: '#8cb96a', e: '#bcd8a2', k: '#6b4a36' });
writeProp('mirrorbloom', 'Wave W17-C (Route 15): mirror bloom — two mirrored bloom clumps, rose and its paler copy side by side, on copy turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('mirrorbloom', 'a', [['b', 0.13]]);
    for (const [x, y] of [[3,6],[4,6],[5,6],[3,7],[4,7],[5,7],[4,5]]) put(rows, x, y, 'g');
    for (const [x, y] of [[10,6],[11,6],[12,6],[10,7],[11,7],[12,7],[11,5]]) put(rows, x, y, 'g');
    for (const [x, y] of [[3,6],[5,7],[4,5]]) put(rows, x, y, 'p');
    for (const [x, y] of [[10,6],[12,7],[11,5]]) put(rows, x, y, 'e');
    put(rows, 4, 6, 'w'); put(rows, 11, 6, 'w');
    return rows; })(),
  { a: '#74a75e', b: '#659452', g: '#4e7d43', p: '#e39ec4', e: '#eec6dc', w: '#f2eee2' });
// ---- Route 16: Cycling Slope (idx 1144-1147)
writePix('slopeturf', 'Wave W17-C (Route 16): slope turf — hillside green with diagonal mow stripes running down the grade. Route 16\u2019s own ground.',
  (() => { const rows = []; const r = rng('slopeturf');
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = ((x + y) % 8 < 4) ? 'a' : 'b'; if (r() < 0.06) c = 'd'; s += c; } rows.push(s); }
    return rows; })(),
  { a: '#71a45c', b: '#639251', d: '#547e44' });
writePix('asphaltfloor', 'Wave W17-C (Route 16): asphalt — the paved cycling road: dark grey asphalt with stone speckle and a pale dashed centre line (design: paved cycling slope).',
  (() => { const rows = speckle('asphaltfloor', 'a', [['b', 0.17], ['s', 0.05]]);
    for (const y of [1, 2, 5, 6, 9, 10, 13, 14]) { put(rows, 7, y, 'l'); put(rows, 8, y, 'l'); }
    return rows; })(),
  { a: '#6d6d72', b: '#5d5d62', s: '#83838a', l: '#e3ddc2' });
writePix('slopefir', 'Wave W17-C (Route 16): slope fir — a tall straight fir on slope turf (ground baked in). Name avoids Pomelo\u2019s registered slopepine prop.',
  pineRows('slopefir', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#71a45c', b: '#639251', t: '#3f6b3c', u: '#33572f', h: '#5c8a52', k: '#59452f' });
writeProp('sloperail', 'Wave W17-C (Route 16): slope rail — a steel guardrail run on posts along the descent, on slope turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('sloperail', 'a', [['b', 0.12]]);
    for (const x of [1, 7, 13]) for (let y = 6; y <= 13; y++) put(rows, x, y, 'p');
    for (let x = 0; x < 16; x++) { put(rows, x, 7, 'r'); put(rows, x, 11, 'r'); }
    for (let x = 0; x < 16; x++) put(rows, x, 8, 'h');
    return rows; })(),
  { a: '#71a45c', b: '#639251', p: '#6e5233', r: '#9aa0a8', h: '#c2c8ce' });
// ---- Route 19: Bramble Beach (idx 1148-1151)
writePix('beachturf', 'Wave W17-C (Route 19): beach turf — dune grass, sandy green with shell-white and pink flecks where the road becomes shoreline. Route 19\u2019s own ground.',
  speckle('beachturf', 'a', [['b', 0.15], ['s', 0.06], ['w', 0.025], ['p', 0.015]]),
  { a: '#8aa763', b: '#7a9557', s: '#b3ac7c', w: '#f0ead6', p: '#e8b7c2' });
writePix('shorefloor', 'Wave W17-C (Route 19): shore sand — wet shore sand with foam-white speckle and faint ripple arcs (design-authorised sand, own texture).',
  (() => { const rows = speckle('shorefloor', 'a', [['b', 0.15], ['w', 0.05]]);
    for (const [x, y] of [[2,5],[3,4],[4,4],[5,5],[9,12],[10,11],[11,11],[12,12]]) put(rows, x, y, 'r');
    return rows; })(),
  { a: '#e0d0a2', b: '#d0bd8c', w: '#f4eedd', r: '#c4ae76' });
writePix('beachpalm', 'Wave W17-C (Route 19): beach palm — a leaning palm with a full frond crown on beach turf (ground baked in).',
  (() => { const rows = []; const r = rng('beachpalm');
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = ((x * 7 + y * 13) % 11 === 0) ? 'b' : 'a';
      if (y <= 4) { const span = { 0: [1, 14], 1: [2, 13], 2: [3, 12], 3: [4, 11], 4: [5, 10] }[y]; if (x >= span[0] && x <= span[1] && (x + y) % 2 === 0) { const v = r(); c = v < 0.4 ? 't' : v < 0.8 ? 'h' : 'u'; } }
      if (y >= 4 && y <= 6 && x >= 6 && x <= 9) c = 't';
      if (y >= 6 && y <= 13 && (x === 8 || x === 9)) c = 'k';
      if (y >= 10 && y <= 13 && x === 7) c = 'k';
      if (y === 14 && x >= 6 && x <= 10) c = 't';
      s += c; } rows.push(s); } return rows; })(),
  { a: '#8aa763', b: '#7a9557', t: '#5d9448', u: '#4c7a3a', h: '#7cb45e', k: '#8a6f4d' });
writeProp('shoredrift', 'Wave W17-C (Route 19): shore drift — a bleached driftwood log with a branch stub, washed up on beach turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('shoredrift', 'a', [['b', 0.13], ['s', 0.04]]);
    for (let x = 2; x <= 13; x++) { put(rows, x, 9, 'w'); put(rows, x, 10, 'w'); }
    for (let x = 3; x <= 12; x++) put(rows, x, 11, 'd');
    for (const [x, y] of [[9,7],[9,8],[10,8]]) put(rows, x, y, 'w');
    put(rows, 2, 9, 'd'); put(rows, 13, 10, 'd'); put(rows, 6, 9, 'g'); put(rows, 11, 10, 'g');
    return rows; })(),
  { a: '#8aa763', b: '#7a9557', s: '#b3ac7c', w: '#cfc4a8', d: '#a89a78', g: '#8a7c5e' });
console.log('pix written');
