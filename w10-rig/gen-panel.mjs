// gen-panel.mjs — W10 proof panel generator (deterministic).
// Authors `panel-shrine-chronofae` (128x80, the W10 panel canvas
// standard) as a .pix source: CHRONOFAE revealed in the younger light
// at the Holly Forest shrine, per ev_johto_celebi's own recorded text
// ("a small green shape hangs in that younger light, wings ticking
// like a clock that counts in seasons"). Original composition, drawn
// from CHRONOFAE's design record as reference only — no battle frame
// is traced, enlarged, or reused (Director ruling 4).
// Same code -> byte-identical .pix. Run:
//   node w10-rig/gen-panel.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 128, H = 80;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sprites', 'pix', 'keyart', 'panel-shrine-chronofae.pix');

// deterministic texture hash (no RNG state, no Date)
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663) ^ ((x + y) * 83492791)) >>> 0;

const grid = new Array(W * H).fill('D');
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c; };
const get = (x, y) => grid[y * W + x];
function ellipse(cx, cy, rx, ry, c, rot = 0) {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const R = Math.ceil(Math.max(rx, ry)) + 1;
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x - cx, dy = y - cy;
    const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
    if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) set(x, y, c);
  }
}
function rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); }

// ---- backdrop: canopy gradient, darker at the edges (vignette) ----
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let c = y < 12 ? 'K' : y < 26 ? 'D' : y < 44 ? 'd' : y < 60 ? 'G' : 'd';
  const edge = Math.min(x, W - 1 - x, y, H - 1 - y);
  if (edge < 6 && hash(x, y) % 3 === 0) c = 'K';
  if (hash(x, y) % 23 === 0) c = c === 'K' ? 'D' : 'd'; // foliage speckle, calm
  set(x, y, c);
}
// canopy masses top + corners
ellipse(14, 2, 22, 9, 'K'); ellipse(114, 2, 22, 9, 'K'); ellipse(64, -4, 30, 9, 'K');
ellipse(8, 16, 10, 12, 'D'); ellipse(120, 16, 10, 12, 'D');
ellipse(30, 6, 12, 6, 'D'); ellipse(98, 6, 12, 6, 'D');

// ---- the younger light: a soft shaft behind the shrine ----
ellipse(64, 36, 31, 27, 'L');
ellipse(64, 35, 22, 20, 'L');
ellipse(64, 34, 14, 13, 'Y');
for (let y = 8; y < 62; y++) for (let x = 40; x < 88; x++) {
  if (get(x, y) === 'L' && hash(x, y) % 5 === 0) set(x, y, 'g'); // leaf-light flecks
}
// break the shaft's rim (no hard disc edge): rim L pixels dissolve
// into leaf-light green against the darker foliage
for (let y = 6; y < 64; y++) for (let x = 30; x < 98; x++) {
  if (get(x, y) !== 'L') continue;
  const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !['L', 'Y', 'g'].includes(get(x + dx, y + dy)));
  if (rim && hash(x, y) % 3 !== 0) set(x, y, 'g');
}

// ---- forest floor (leaf-mould, unstepped-on) ----
rect(0, 66, W - 1, H - 1, 'F');
for (let y = 66; y < H; y++) for (let x = 0; x < W; x++) {
  const h = hash(x, y) % 10;
  if (h < 2) set(x, y, 's'); else if (h < 4) set(x, y, 'M');
}
ellipse(64, 70, 26, 6, 'F'); // light-struck mould under the shrine
for (let y = 65; y < 76; y++) for (let x = 42; x < 86; x++) if (hash(x, y) % 6 === 0 && get(x, y) === 'F') set(x, y, 'L');

// ---- side trees ----
for (const tx of [9, 115]) {
  rect(tx, 26, tx + 4, 66, 'F');
  rect(tx + 4, 26, tx + 4, 66, 's');
  ellipse(tx + 2, 18, 11, 13, 'D'); ellipse(tx + 2, 12, 8, 8, 'K');
  for (let y = 4; y < 30; y++) for (let x = tx - 8; x < tx + 13; x++) if (get(x, y) === 'D' && hash(x, y) % 7 === 0) set(x, y, 'd');
}

// ---- the shrine (stone, moss-kept) ----
// steps
rect(46, 64, 82, 65, 'S'); rect(46, 65, 82, 65, 's');
rect(49, 62, 79, 63, 'S'); rect(49, 63, 79, 63, 's');
// back panel + pillars
rect(54, 42, 74, 62, 'S');
rect(54, 42, 57, 62, 'S'); rect(71, 42, 74, 62, 'S');
rect(57, 42, 57, 62, 's'); rect(70, 42, 70, 62, 's'); // pillar shade lines
for (let y = 43; y < 62; y++) for (let x = 55; x < 74; x++) if (hash(x, y) % 9 === 0 && get(x, y) === 'S') set(x, y, 's');
for (let y = 43; y < 62; y++) for (let x = 55; x < 74; x++) if (hash(x, y) % 13 === 0) set(x, y, 'M'); // moss
// lintel + roof slab
rect(52, 37, 76, 40, 'S'); rect(52, 40, 76, 40, 's');
rect(50, 34, 78, 36, 's'); rect(50, 34, 78, 34, 'S');
for (let x = 51; x < 78; x++) if (hash(x, 33) % 3 !== 0) set(x, 33, 'M'); // moss cap
// the niche: the opened Sealed Orb resting in the shrine's hollow
ellipse(64, 53, 5, 6, 'O');
ellipse(64, 53, 3, 4, 's');
ellipse(64, 52, 2, 2, 'Y'); set(64, 51, 'Y');

// ---- CHRONOFAE, hanging in the light (center 64, head ~y14) ----
// wings first (behind the body): pale blades angled up-back
ellipse(53, 9, 9, 3.4, 'W', -0.62); ellipse(75, 9, 9, 3.4, 'W', 0.62);
ellipse(54, 10, 8, 2.6, 'P', -0.62); ellipse(74, 10, 8, 2.6, 'P', 0.62);
ellipse(55, 9, 7, 2.2, 'W', -0.62); ellipse(73, 9, 7, 2.2, 'W', 0.62);
// antennae with light-bulb tips
for (let i = 0; i <= 4; i++) { set(61 - Math.round(i * 0.7), 8 - i, 'b'); set(67 + Math.round(i * 0.7), 8 - i, 'b'); }
ellipse(57, 3, 1.6, 1.6, 'L'); ellipse(71, 3, 1.6, 1.6, 'L');
// head
ellipse(64, 14, 6.4, 5.8, 'B');
ellipse(66, 17, 4.6, 3.4, 'b'); // shade low-right
ellipse(63, 13, 5.2, 4.6, 'B'); // restore lit face
// eyes: tall dark ovals with a glint
for (const ex of [60, 67]) { ellipse(ex, 14, 1.3, 2.1, 'O'); set(ex, 13, 'W'); }
// cheeks + mouth
set(58, 17, 'P'); set(59, 17, 'P'); set(69, 17, 'P'); set(70, 17, 'P');
set(63, 18, 'O'); set(64, 18, 'O');
// body + cream belly
ellipse(64, 25, 4.4, 5.2, 'B');
ellipse(65, 27, 3.4, 3.8, 'b');
ellipse(63, 26, 2.6, 3.6, 'L');
// arms + dangling legs (feet end at y32 — one row of light above the
// shrine's moss cap at y33, so the figure HANGS, per the event text)
rect(58, 23, 59, 26, 'B'); rect(69, 23, 70, 26, 'B');
rect(61, 29, 62, 31, 'b'); rect(66, 29, 67, 31, 'b');
set(61, 32, 'B'); set(67, 32, 'B');

// ---- season motes in the light ----
for (let i = 0; i < 46; i++) {
  const x = 38 + (hash(i, 7) % 52), y = 10 + (hash(i, 13) % 48);
  const c = ['Y', 'L', 'P'][hash(i, 29) % 3];
  if (get(x, y) === 'L' || get(x, y) === 'Y' || get(x, y) === 'g') set(x, y, c);
}
// firefly flecks in the dark foliage
for (let i = 0; i < 14; i++) {
  const x = hash(i, 41) % 128, y = 6 + (hash(i, 53) % 40);
  if (get(x, y) === 'K' || get(x, y) === 'D') set(x, y, 'g');
}

// ---- frame (title-keyart idiom: 1px outline ring) ----
for (let x = 0; x < W; x++) { set(x, 0, 'O'); set(x, H - 1, 'O'); }
for (let y = 0; y < H; y++) { set(0, y, 'O'); set(W - 1, y, 'O'); }

const PAL = [
  ['O', '#201812', 'frame outline'],
  ['K', '#0e2a1c', 'deepest canopy'],
  ['D', '#1d4a30', 'canopy'],
  ['d', '#2f6e45', 'foliage mid'],
  ['G', '#57a75e', 'leaf'],
  ['g', '#8ecf78', 'young leaf'],
  ['L', '#d9eda3', 'morning light'],
  ['Y', '#f8eec2', 'glow core'],
  ['S', '#9aa189', 'stone light'],
  ['s', '#5f6355', 'stone shade'],
  ['M', '#71835a', 'moss'],
  ['F', '#7a5a36', 'leaf mould'],
  ['B', '#5fd95e', 'chronofae body'],
  ['b', '#2f9e46', 'chronofae shade'],
  ['W', '#eefaf0', 'wing white'],
  ['P', '#bfe3ff', 'wing tint'],
];
const rows = [];
for (let y = 0; y < H; y++) rows.push(grid.slice(y * W, (y + 1) * W).join(''));
const text = `# panel-shrine-chronofae 128x80. W10 cutscene panel: CHRONOFAE at the\n# Holly Forest shrine (ev_johto_celebi). Original in-house art,\n# generated deterministically by w10-rig/gen-panel.mjs.\nPIX panel-shrine-chronofae 128 80\n${rows.join('\n')}\nPAL\n${PAL.map(([c, hex, n]) => `${c} ${hex} ${n}`).join('\n')}\n`;
fs.writeFileSync(OUT, text);
const used = new Set(rows.join('').split('')).size;
console.log(`gen-panel: panel-shrine-chronofae 128x80, ${used} palette chars -> ${OUT} (${text.length} B source)`);
