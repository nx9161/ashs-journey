// W17-AB kit art generator: writes .pix files for the 13
// tranche-8 kinds (Borea: Route 223 the League sea road,
// Route 224 the stone coast, Foamline Path the sunny
// causeway, Route 225 the hard road).
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
const G = (base, fl) => (x, y) => { const v = ((x * 7 + y * 13) % 11); return v === 0 ? fl : base; };
const put = (rows, x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
const sprinkle = (rows, seed, test, c, d) => { const r = rng(seed); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (test(rows[y][x]) && r() < d) put(rows, x, y, c); };
// Tiered pine (open conifer tiers, highlight lifted clear).
function tieredPine(seed, groundFn, can, trunk, opts = {}) {
  const rows = [];
  const shape = opts.shape || { 1: [6, 9], 2: [5, 10], 3: [4, 11], 4: [5, 10], 5: [3, 12], 6: [4, 11], 7: [3, 12], 8: [4, 11], 9: [2, 13], 10: [3, 12] };
  const r = rng(seed);
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) {
    let c = groundFn(x, y);
    if (shape[y] && x >= shape[y][0] && x <= shape[y][1]) { const v = r(); c = v < 0.3 ? can[0] : v < 0.75 ? can[1] : can[2]; if (y <= 2) c = can[2]; }
    if (y >= 11 && y <= 13 && (x === 7 || x === 8)) c = trunk;
    if (y === 14 && x >= 6 && x <= 9) c = can[0];
    s += c; } rows.push(s); }
  return rows;
}
// A marker post on a caller-supplied ground (fleet post idiom:
// shaft at x7-8, rows 4-13, ground-shadow foot at row 13).
function markerPost(groundRows, draw, shaftK, shaftD) {
  const rows = groundRows;
  for (let y = 4; y <= 13; y++) put(rows, 7, y, shaftK);
  for (let y = 4; y <= 13; y++) put(rows, 8, y, shaftD);
  draw(rows);
  for (let x = 6; x <= 9; x++) put(rows, x, 13, shaftD);
  return rows;
}
// A sea rock: a jointed boulder standing in baked water, foam
// collar at its base (the Maris lane-rock idiom). The baked
// water is the shipped water palette entire — the tile blends
// into the sea it stands in; the lane's register is carried
// by the boulder, never by a mismatched water square.
function seaRock(seed, opts = {}) {
  const rows = speckle(seed, 'w', [['x', 0.12], ['y', 0.05]]);
  const spans = { 3: [6, 9], 4: [5, 10], 5: [4, 11], 6: [4, 11], 7: [3, 12], 8: [3, 12], 9: [4, 11], 10: [4, 11], 11: [5, 10], 12: [5, 10] };
  for (const [y, [a, b]] of Object.entries(spans)) for (let x = a; x <= b; x++) put(rows, x, Number(y), 'm');
  sprinkle(rows, seed + '-joint', (c) => c === 'm', 'z', opts.jointDensity ?? 0.16);
  sprinkle(rows, seed + '-face', (c) => c === 'm', 'c', 0.22);
  for (let x = 5; x <= 8; x++) put(rows, x, 3, 'p');
  for (let x = 4; x <= 7; x++) put(rows, x, 4, 'p');
  put(rows, 5, 5, 'p'); put(rows, 6, 5, 'p');
  if (opts.verticalJoints) for (const jx of opts.verticalJoints) for (let y = 5; y <= 11; y++) if (rows[y][jx] === 'm') put(rows, jx, y, 'z');
  const r = rng(seed + '-foam');
  for (let x = 3; x <= 12; x++) { if (r() < 0.75) put(rows, x, 13, 'f'); if (r() < 0.4) put(rows, x, 12, 'f'); }
  return rows;
}

// ---- Route 223: League Sea Road (idx 1507-1508)
writePix('leaguesand', 'Wave W17-AB (Route 223): league sand — deep-lane sand, cliff-shadow flecks: a dark slate-teal sand lying under deep water on the League run, carrying cliff-shadow flecks where the Summit cliff throws its shade down the lane and sparse pale shell glints where the light still reaches (design: the League sea road — all water, north to the Summit Road shore; the cliff at the end of it has heard every promise trainers make). Route 223’s own sand — split from the south sea’s bright and long sands by depth entire (dark deep-lane bottom vs gold shallows and sparse open-sea pale) and from its twin Route 229’s loop sand ahead of the program by shade: this sand lies in a cliff’s shadow, that one in open offshore light.',
  speckle('leaguesand', 'a', [['d', 0.10], ['s', 0.04], ['e', 0.03]]),
  { a: '#7fa6b8', d: '#5d8296', s: '#a9c9d6', e: '#4c6e82' });
writePix('leaguerock', 'Wave W17-AB (Route 223): league rock — cliff-foot rock: a dark basalt boulder standing in the deep lane, its joints drawn VERTICAL like the Summit cliff it fell from, foam collar at its base (design: the lane runs to the League cliff; the cliff’s own jointing is columnar, and its foot rocks keep the family habit). Route 223’s own rock — split from Route 220’s swell rock by jointing entire (cliff-vertical vs swell-worn smooth) and from Foamline’s shallows rock by depth: this stone stands in deep shadowed water, that one in bright shallows.',
  seaRock('leaguerock', { verticalJoints: [6, 10], jointDensity: 0.10 }),
  { w: '#567cbd', x: '#476baa', y: '#7093c7', z: '#494650', c: '#9d98a4', m: '#6a6770', p: '#d5d0da', f: '#e8f0ee' });

// ---- Route 224: Stone Coast (idx 1509-1512)
writePix('headturf', 'Wave W17-AB (Route 224): head turf — stone-coast turf, flower flecks: a sage coastal green carrying white and pale-yellow flower flecks and sparse stone-grey grit — the meadow the champion’s road runs through, thickening toward the flower field at the Foamline end (design: flowers beyond counting at the far end of the path; the turf takes their first flecks). Route 224’s own ground — split from its twin Foamline Path by element entire (the dry stone coast vs the plank road over water — Foamline ships no ground register) and from Route 213’s salt turf by register: this turf is flowered meadow, that one salt flat.',
  speckle('headturf', 'a', [['b', 0.12], ['s', 0.03], ['w', 0.02], ['y', 0.015]]),
  { a: '#7cab62', b: '#689a52', s: '#a3a08e', w: '#f4f1de', y: '#eed98c' });
writePix('headfloor', 'Wave W17-AB (Route 224): head floor — the champion’s road pale sand, design-authorised: a pale stone-dust sand running from the League’s door east to the white stone, cool and grey in its grit where the coast’s rock has ground itself into the tread (design: the stone coast east of the League — the road is walked by champions and kept by the Stone Keeper). Split from Route 222’s solar sand by temperature entire (stone-cool vs sun-bleached warm) and from Route 225’s worn sand by keeping: this sand is swept pale, that one is trampled hard.',
  speckle('headfloor', 'a', [['b', 0.11], ['p', 0.04], ['g', 0.03]]),
  { a: '#e6d9ba', b: '#d3c199', p: '#f4ecd8', g: '#ac9a72' });
writePix('headpine', 'Wave W17-AB (Route 224): head pine — a coast pine in deep blue-greens, tiered and wind-kept, its highlight lifted clear of the turf, on head turf (ground baked in). Route 224’s own tree — split from Foamline’s shore pine by stance entire (a walked dry coast vs the causeway’s shore ends) and from Route 221’s tide pine by colour: this crown is deep coast green in League light, that one marsh blue-green.',
  tieredPine('headpine', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#7cab62', b: '#689a52', t: '#437f4e', u: '#2f5e3c', h: '#8cc084', k: '#5a4630' });
writeProp('headpost', 'Wave W17-AB (Route 224): head post — a headstone marker post on the stone coast: a weathered post carrying a small rounded WHITE HEADSTONE at its head, tended and honest — the design’s white stones standing in the prop register (design: a white headstone stands at the far end of the Foamline Path, and flowers beyond counting; the stones on this coast are kept, not carved fresh). On head turf (fully opaque, ground baked in) — split from the fleet’s marker posts by the stone entire: posts mark a road, this one carries a grave’s white tablet.',
  markerPost(speckle('headpost', 'a', [['b', 0.12], ['s', 0.02]]),
    (rows) => { put(rows, 7, 0, 'w'); put(rows, 8, 0, 'w'); for (const y of [1, 2]) { for (let x = 6; x <= 8; x++) put(rows, x, y, 'w'); put(rows, 9, y, 's'); } for (let x = 6; x <= 8; x++) put(rows, x, 3, 'w'); put(rows, 9, 3, 's'); put(rows, 5, 13, 's'); put(rows, 10, 13, 's'); }, 'k', 'd'),
  { a: '#7cab62', b: '#689a52', s: '#c6c0ac', w: '#f2efe4', d: '#5d4c34', k: '#7d6a4c' });

// ---- Foamline Path: the sunny causeway (idx 1513-1515) — the causeway method: no ground register ships
writePix('foamfloor', 'Wave W17-AB (Foamline Path): foam floor — foam-flecked plank floor: sun-bleached pale planks laid along the road over bright water, their joints bright, carrying white foam flecks where the shallows slap the footings — the sea’s own signature drawn in the floor kind’s art, art layer only (design: a plank road over bright water, east of the white stone; the flowers at the end of it are not a rumour). Converts the shipped boardwalk entire — the causeway method (Ruling #4, second use): a causeway has no banks, so the planks ARE the path tier. Split from Route 218’s cause floor by weather entire (foam-white flecks in sun vs amber lamp-glow in rain) and from the shipped boardwalk it replaces by light: bleached and foamed vs plain harbour brown.',
  (() => { const rows = speckle('foamfloor', 'a', [['c', 0.14], ['n', 0.03]]);
    for (const y of [3, 7, 11, 15]) for (let x = 0; x < 16; x++) put(rows, x, y, 'j');
    for (let y = 0; y <= 2; y++) put(rows, 7, y, 'j');
    for (let y = 4; y <= 6; y++) put(rows, 3, y, 'j');
    for (let y = 8; y <= 10; y++) put(rows, 12, y, 'j');
    for (let y = 12; y <= 14; y++) put(rows, 6, y, 'j');
    sprinkle(rows, 'foamfloor-foam', (c) => c === 'a' || c === 'c', 'f', 0.03);
    return rows; })(),
  { a: '#c79f66', c: '#dbb87e', j: '#7d5c33', f: '#f8f4e4', n: '#a37c46' });
writePix('foampine', 'Wave W17-AB (Foamline Path): foam pine — a shore-end pine in bright sunlit greens, tiered and open, its highlight lifted high, standing in bright shore grass baked into the tile (the causeway ships no ground register — the frame trees stand in their own shore grass, as every fleet tree tile carries its footing). Foamline’s own tree — split from Route 218’s cause pine by weather entire (sunlit bright vs rain-dark deep) and from Route 224’s head pine by stance: this pine frames a plank road over water, that one stands on a walked dry coast.',
  tieredPine('foampine', G('a', 'b'), ['u', 't', 'h'], 'k'),
  { a: '#8ab860', b: '#77a54d', t: '#478236', u: '#2f6129', h: '#a5d97e', k: '#5e4630' });
writePix('foamrock', 'Wave W17-AB (Foamline Path): foam rock — shallows footing rock: a pale sun-bleached boulder standing in bright shallows, foam collar thick at its base where the walkway’s feet meet the sea (design: the plank road runs over bright water; its footings stand in the foam the path is named for). Foamline’s own rock — split from Route 218’s footing rock by depth entire (bright shallows vs harbour water) and from Route 223’s cliff rock by face: sun-bleached pale here, basalt-dark there.',
  seaRock('foamrock'),
  { w: '#567cbd', x: '#476baa', y: '#7093c7', z: '#7e7466', c: '#c9bfa9', m: '#a79c8c', p: '#f4efe0', f: '#f2f7ee' });

// ---- Route 225: Hard Road (idx 1516-1519)
writePix('scorchturf', 'Wave W17-AB (Route 225): scorch turf — scorched hardpan turf, crater-dust flecks: a DRY rust-ochre hardpan carrying charcoal scorch flecks and pale crater dust — baked ground, never mud: the colour is kiln-dry orange-brown, the flecks are char and dust, nothing here is wet (design: scorched crater-pocked volcanic ground; everything out here trains, including the weather). Route 225’s own ground — split from its twin Route 227’s ash ground ahead of the program by state entire (scorched hardpan underfoot vs ash fallen on hot grass — and r227’s shipped ashground stands byte-preserved by spec, so the split is also one of office: this ground converts, that biome is kept).',
  speckle('scorchturf', 'a', [['d', 0.09], ['k', 0.05], ['c', 0.06]]),
  { a: '#a87c46', d: '#c9ad7d', k: '#7d5a33', c: '#5f4630' });
writePix('zonefloor', 'Wave W17-AB (Route 225): zone floor — the hard road’s worn sand, design-authorised: a hard-trampled tan sand running from Clashfield’s gate to Wildreach, its tread darkened by a thousand training marches, carrying sparse scorch-edge flecks blown off the hardpan (design: the Battle Zone’s hard road — the sand itself is a training surface). Split from Route 224’s head sand by keeping entire (trampled and worn vs swept pale) and from Route 227’s ash-road sand ahead of the program by cover: this sand is bare to the sun, that one falls under ash.',
  speckle('zonefloor', 'a', [['b', 0.11], ['w', 0.04], ['s', 0.015]]),
  { a: '#d6bc8f', b: '#c2a878', w: '#ab905f', s: '#6e5136' });
writePix('zonepine', 'Wave W17-AB (Route 225): zone pine — a tough SPARSE-crowned pine in dusty grey-greens, its tiers narrow and its highlight dust-pale, on scorch turf (ground baked in): a tree that trains like everything else on this road — lean, hard, and still unmistakably a tree, its canopy fat enough to read at a glance and its tiers open to the heat. Route 225’s own tree — split from Route 224’s head pine by crown entire (sparse dust-green vs full coast green) and from Route 227’s ash-dusted pine ahead of the program by cover: this crown is dusty from the ground up, that one is dusted from the sky down.',
  tieredPine('zonepine', G('a', 'b'), ['u', 't', 'h'], 'k',
    { shape: { 1: [7, 8], 2: [6, 9], 3: [6, 9], 4: [5, 10], 5: [6, 9], 6: [5, 10], 7: [6, 9], 8: [5, 10], 9: [4, 11], 10: [5, 10] } }),
  { a: '#a87c46', b: '#7d5a33', t: '#617349', u: '#47543a', h: '#9aa873', k: '#54402a' });
writeProp('zonepost', 'Wave W17-AB (Route 225): zone post — a training-ground marker post on the hard road: a weathered post carrying a plain CROSSBAR at its head, the Battle Zone’s own punctuation — a marker you train against, set where the road’s verge firms up (design: everything out here trains, including the weather; the posts are the road’s training furniture). On scorch turf (fully opaque, ground baked in) — split from the fleet’s marker posts by the bar entire: posts mark a road, this one marks a ground you work on.',
  markerPost(speckle('zonepost', 'a', [['u', 0.09], ['c', 0.04]]),
    (rows) => { for (let x = 5; x <= 10; x++) put(rows, x, 2, 'k'); for (let x = 5; x <= 10; x++) put(rows, x, 3, 'd'); put(rows, 4, 12, 'd'); put(rows, 11, 12, 'd'); }, 'k', 'd'),
  { a: '#a87c46', u: '#c9ad7d', c: '#5f4630', k: '#6e5136', d: '#4e3823' });
console.log('pix written');
