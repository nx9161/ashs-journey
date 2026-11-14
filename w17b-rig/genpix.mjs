// W17-B kit art generator: writes .pix files for the 20 tranche-2 kinds.
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

// ---- Route 6: Lily Pond (idx 1112-1115)
writePix('pondturf', 'Wave W17-B (Route 6): pond turf — soft blue-green pond-meadow with reed flecks and tiny pond-blossom dots. Route 6\u2019s own ground (NO-SAME-KIT law; WAVE-W17-ROUTE-PROGRAM-PLAN.md).',
  speckle('pondturf', 'a', [['b', 0.18], ['r', 0.07], ['f', 0.02]]),
  { a: '#6da266', b: '#5f955c', r: '#4a7a52', f: '#eef2e2' });
writePix('lilyfloor', 'Wave W17-B (Route 6): lily sand — pale shore sand with faint green ripple flecks and white foam dots (design-authorised sand, own texture).',
  speckle('lilyfloor', 'a', [['b', 0.17], ['g', 0.06], ['w', 0.04]]),
  { a: '#d8cda6', b: '#cabd94', g: '#a8bf8e', w: '#f0ead2' });
writePix('pondwillow', 'Wave W17-B (Route 6): pond willow — wide drooping willow with hanging strands, pond turf baked in at measured colours.',
  (() => { const rows = []; const r = rng('pondwillow'); const shape = { 0: [4, 11], 1: [2, 13], 2: [1, 14], 3: [1, 14], 4: [2, 13], 5: [2, 13], 6: [3, 12], 7: [3, 12], 8: [4, 11] };
    for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = ((x * 7 + y * 13) % 11 === 0) ? 'b' : 'a';
      if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.3 ? 'u' : v < 0.75 ? 't' : 'h'; if (y <= 2 && x <= 7) c = 'h'; }
      if (y >= 9 && y <= 11 && (x === 2 || x === 5 || x === 10 || x === 13) && r() < 0.8) c = 't';
      if (y >= 11 && y <= 14 && (x === 7 || x === 8)) c = 'k';
      s += c; } rows.push(s); } return rows; })(),
  { a: '#6da266', b: '#5f955c', t: '#5d8f57', u: '#4c7847', h: '#86b877', k: '#6b4a38' });
writeProp('pondpad', 'Wave W17-B (Route 6): pond pads — lily pads with one pink blossom at the pond shore on pond turf (fully opaque, ground baked in). Name avoids Fenland\u2019s registered lilypad kind.',
  (() => { const rows = speckle('pondpad', 'a', [['b', 0.15]]);
    for (const [x, y] of [[3,5],[4,5],[5,5],[3,6],[4,6],[5,6],[4,4]]) put(rows, x, y, 'p');
    for (const [x, y] of [[9,9],[10,9],[11,9],[9,10],[10,10],[11,10],[10,8]]) put(rows, x, y, 'p');
    for (const [x, y] of [[6,11],[7,11],[6,12],[7,12]]) put(rows, x, y, 'p');
    put(rows, 4, 5, 'l'); put(rows, 10, 9, 'l'); put(rows, 10, 8, 'f'); put(rows, 5, 5, 'd'); put(rows, 11, 10, 'd');
    return rows; })(),
  { a: '#6da266', b: '#5f955c', p: '#4e8a4f', l: '#79b877', d: '#3c6e3e', f: '#e8a0bf' });
// ---- Route 7: Gatehouse Road (idx 1116-1119)
writePix('fenceturf', 'Wave W17-B (Route 7): fence turf — short-cropped even turf with fine speckle and sparse pale flower dots. Route 7\u2019s own ground.',
  speckle('fenceturf', 'a', [['b', 0.15], ['l', 0.08], ['f', 0.015]]),
  { a: '#79ad63', b: '#6da257', l: '#8abd74', f: '#e8e4f0' });
writePix('gatefloor', 'Wave W17-B (Route 7): gate lane — pale sand with a darker fence-shadow speckle along the top and bottom edges and pebble dots (design-authorised sand, own texture).',
  (() => { const rows = speckle('gatefloor', 'a', [['b', 0.16], ['p', 0.05]]); const r = rng('gatefloor-edge');
    for (const y of [0, 1, 14, 15]) for (let x = 0; x < 16; x++) if (r() < 0.45) put(rows, x, y, 's');
    return rows; })(),
  { a: '#dccfa8', b: '#cdbb92', p: '#b3a077', s: '#a89468' });
writePix('gateelm', 'Wave W17-B (Route 7): gate elm — tall oval yellow-green elm on fence turf (ground baked in).',
  (() => { const rows = treeRows('gateelm', G('a', 'b'), ['u', 't', 'h'], 'k'); return rows; })(),
  { a: '#79ad63', b: '#6da257', t: '#639c46', u: '#528237', h: '#93c46e', k: '#71493d' });
writeProp('fencepost', 'Wave W17-B (Route 7): fence run — three posts and two rails of weathered fence on fence turf (fully opaque, ground baked in). Name avoids the shipped gatepost dressing kind.',
  (() => { const rows = speckle('fencepost', 'a', [['b', 0.13]]);
    for (const x of [2, 7, 12]) for (let y = 5; y <= 12; y++) put(rows, x, y, 'w');
    for (let x = 0; x < 16; x++) { put(rows, x, 6, 'r'); put(rows, x, 10, 'r'); }
    for (const x of [2, 7, 12]) { put(rows, x, 5, 'd'); put(rows, x, 6, 'd'); put(rows, x, 10, 'd'); }
    return rows; })(),
  { a: '#79ad63', b: '#6da257', w: '#8a6a44', r: '#a07c50', d: '#6e5233' });
// ---- Route 8: Perfume Garden (idx 1120-1123)
writePix('perfumeturf', 'Wave W17-B (Route 8): perfume turf — meadow turf dense with pink, violet and white perfume flecks (the sign\u2019s scented grass, drawn). Route 8\u2019s own ground.',
  speckle('perfumeturf', 'a', [['b', 0.16], ['p', 0.05], ['v', 0.04], ['w', 0.03]]),
  { a: '#6ea763', b: '#619758', p: '#e39ec4', v: '#b49ae0', w: '#f2eee2' });
writePix('perfumefloor', 'Wave W17-B (Route 8): petal sand — pale sand strewn with rose and violet petal flecks (design-authorised sand, own texture).',
  speckle('perfumefloor', 'a', [['b', 0.16], ['p', 0.045], ['v', 0.035]]),
  { a: '#dccdaa', b: '#cfbd95', p: '#df9fbe', v: '#b49ae0' });
writePix('perfumebloom', 'Wave W17-B (Route 8): perfume blossom — a blossom-canopied tree in rose and white over perfume turf (ground baked in).',
  treeRows('perfumebloom', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#6ea763', b: '#619758', t: '#d98ab4', u: '#c26a9c', h: '#f0c4da', k: '#6b4632' });
writeProp('perfumehedge', 'Wave W17-B (Route 8): perfume hedge — a rounded tended hedge box studded with blooms on perfume turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('perfumehedge', 'a', [['b', 0.13]]);
    for (let y = 5; y <= 11; y++) for (let x = 2; x <= 13; x++) put(rows, x, y, 'g');
    for (let x = 3; x <= 12; x++) { put(rows, x, 5, 'l'); }
    const r = rng('perfumehedge-bloom');
    for (let y = 6; y <= 11; y++) for (let x = 3; x <= 12; x++) { const v = r(); if (v < 0.10) put(rows, x, y, 'p'); else if (v < 0.16) put(rows, x, y, 'w'); else if (v < 0.30) put(rows, x, y, 'd'); }
    return rows; })(),
  { a: '#6ea763', b: '#619758', g: '#4e7d43', l: '#6da257', d: '#3e6636', p: '#e39ec4', w: '#f2eee2' });
// ---- Route 9: Boulder Field (idx 1124-1127)
writePix('boulderturf', 'Wave W17-B (Route 9): boulder turf — dry thinning turf over broken rock, olive-brown with stone speckle. Route 9\u2019s own ground.',
  speckle('boulderturf', 'a', [['b', 0.18], ['s', 0.10], ['d', 0.05]]),
  { a: '#8a8a5e', b: '#7a7a50', s: '#9a9580', d: '#66684c' });
writePix('boulderfloor', 'Wave W17-B (Route 9): cracked shelf path — pale stone-sand with dark crack seams wandering across (design: cracked rock shelves, own texture).',
  (() => { const rows = speckle('boulderfloor', 'a', [['b', 0.15], ['s', 0.06]]);
    const crack = [[1,2],[2,3],[3,3],[4,4],[5,5],[5,6],[6,7],[10,1],[11,2],[11,3],[12,4],[13,5],[7,11],[8,12],[8,13],[9,14],[2,12],[3,12],[4,13]];
    for (const [x, y] of crack) put(rows, x, y, 'c');
    return rows; })(),
  { a: '#cdbb96', b: '#bda87f', s: '#a89a76', c: '#77694c' });
writePix('boulderpine', 'Wave W17-B (Route 9): boulder pine — sparse hardy pine on boulder turf (ground baked in).',
  pineRows('boulderpine', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#8a8a5e', b: '#7a7a50', t: '#5c7350', u: '#4a5f42', h: '#7d9470', k: '#5d4a38' });
writeProp('fieldboulder', 'Wave W17-B (Route 9): field boulder — a large warm-grey boulder cluster on boulder turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('fieldboulder', 'a', [['b', 0.15], ['s', 0.05]]);
    for (const [x, y] of [[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12]]) put(rows, x, y, 's');
    for (const [x, y] of [[5,8],[6,8],[7,8],[8,8],[6,9],[7,10]]) put(rows, x, y, 'l');
    for (const [x, y] of [[3,11],[12,11],[4,12],[11,12]]) put(rows, x, y, 'd');
    return rows; })(),
  { a: '#8a8a5e', b: '#7a7a50', s: '#a39a86', l: '#c0b8a2', d: '#7d7460' });
// ---- Route 10: Coilworks Road (idx 1128-1131)
writePix('conductturf', 'Wave W17-B (Route 10): conduct turf — scorched olive turf with sparse copper flecks near the lines. Route 10\u2019s own ground.',
  speckle('conductturf', 'a', [['b', 0.17], ['d', 0.07], ['c', 0.02]]),
  { a: '#7d8a52', b: '#6d7a46', d: '#59663a', c: '#c47f4a' });
writePix('conductfloor', 'Wave W17-B (Route 10): ash sand — pale grey-sand with dark flecks and faint cable-shadow dashes (design-authorised sand family, own texture).',
  (() => { const rows = speckle('conductfloor', 'a', [['b', 0.16], ['d', 0.06]]);
    for (const [x, y] of [[2,4],[3,4],[7,9],[8,9],[11,13],[12,13]]) put(rows, x, y, 'd');
    return rows; })(),
  { a: '#cfc4a4', b: '#bfb28e', d: '#8a7c5e' });
writePix('conductpine', 'Wave W17-B (Route 10): conduct pine — dark pine with singed rust tips on conduct turf (ground baked in).',
  (() => { const rows = pineRows('conductpine', G('a', 'b'), ['u', 't', 'h'], 'k'); const r = rng('conductpine-singe');
    for (let y = 1; y <= 9; y++) for (let x = 0; x < 16; x++) if ((rows[y][x] === 'h' || rows[y][x] === 't') && r() < 0.10) put(rows, x, y, 's');
    return rows; })(),
  { a: '#7d8a52', b: '#6d7a46', t: '#44603f', u: '#374f34', h: '#5c7d54', s: '#a85f38', k: '#54402e' });
writeProp('pylonbase', 'Wave W17-B (Route 10): pylon base — the steel lattice foot of a line pylon, cross-braced with copper bolts, on conduct turf (fully opaque, ground baked in).',
  (() => { const rows = speckle('pylonbase', 'a', [['b', 0.13]]);
    for (const y of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) { put(rows, 4, y, 's'); put(rows, 11, y, 's'); }
    for (let x = 4; x <= 11; x++) { put(rows, x, 3, 's'); put(rows, x, 12, 's'); }
    for (const [x, y] of [[5,4],[6,5],[7,6],[8,7],[9,8],[10,9],[10,4],[9,5],[8,6],[7,7],[6,8],[5,9],[5,10],[6,11],[10,10],[9,11]]) put(rows, x, y, 's');
    for (const [x, y] of [[4,3],[11,3],[4,12],[11,12]]) put(rows, x, y, 'c');
    for (let x = 3; x <= 12; x++) put(rows, x, 13, 'd');
    return rows; })(),
  { a: '#7d8a52', b: '#6d7a46', s: '#8b93a0', c: '#c47f4a', d: '#59663a' });
console.log('pix written');
