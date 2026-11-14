// Wave T35 rig: author the four Lotus Cove .pix tiles from pattern
// rules (lavender barrel tile / cobble harbour stone / harbour
// chain barrier / gull mooring post), then assert every row is
// exactly 16 chars. The rendered tiles are viewed via pix2png
// before landing — files are the deliverable.
import { writeFileSync } from 'node:fs';

const D = '/home/hatch/workspace/ashs-journey-t35/assets/sprites/pix/tiles/';
const H = (x, y, a, b, m) => ((x * a + y * b) % m + m) % m;

function emit(name, header, rows, pal) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + r);
  const body = ['# ' + header, 'PIX ' + name + ' 16 16', ...rows, 'PAL',
    ...Object.entries(pal).map(([c, [hex, label]]) => c + ' ' + hex + ' ' + label), ''].join('\n');
  writeFileSync(D + name + '.pix', body);
  console.log('wrote', name);
}

// --- lotusroof: lavender barrel tile, scalloped half-round courses ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    const course = Math.floor(y / 4), v = y % 4;
    const stag = (course % 2) * 2;
    for (let x = 0; x < 16; x++) {
      const u = (x + stag) % 4;
      if (v === 3) { r += 's'; continue; }                    // course shadow seam
      if (u === 0) { r += 's'; continue; }                    // tile side seam
      if (u === 2 && v <= 1) { r += 't'; continue; }          // lit crown of the half-round
      if (u === 1 && v === 2) { r += 'd'; continue; }         // lower shade roll
      if (H(x, y, 7, 3, 17) === 0) { r += 'd'; continue; }    // sparse weather fleck
      r += 'l';
    }
    rows.push(r);
  }
  emit('tile-lotusroof',
    "Wave T35 (Lotus Cove kit): lotusroof — Lotus Cove City's own roof kind.\n# LAVENDER BARREL TILE: overlapping courses of half-round tiles in the\n# town style's own lavender (#9a7fb8 body, #bfa8d4 lit crowns, #66538a\n# seams), courses scalloping every 4px, tile ends staggered course to\n# course. Half-round scalloped courses are structurally unlike every\n# shipped roof: Hushmoor's flat shingle rectangles, Blossom's sakura\n# shingles, Copperton's copper-seamed slabs, Eldergrove's banded\n# thatch, Fairhaven's stitched canvas, Wildflower's open trellis,\n# Highbranch's leaf scales. Worn by the Contest Hall, the Department\n# Store and the town's two facade cottages.\n# (NO-SAME-KIT law; WAVE-T35-LOTUSCOVE-PLAN.md.)",
    rows,
    { l: ['#9a7fb8', 'tile-body'], t: ['#bfa8d4', 'tile-crown'], d: ['#8a6fae', 'tile-shade'], s: ['#66538a', 'tile-seam'] });
}

// --- cobblefloor: round river-cobble harbour mosaic ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    const v = y % 4, band = Math.floor(y / 4);
    for (let x = 0; x < 16; x++) {
      const u = (x + (band % 2) * 2) % 5;
      const stone = H(Math.floor((x + (band % 2) * 2) / 5), band, 3, 7, 4);
      if (v === 3 || u === 0) { r += 'j'; continue; }          // sand joint
      if (u === 2 && v === 0) { r += 'h'; continue; }          // cobble crown highlight
      if (H(x, y, 11, 5, 23) === 0) { r += 'e'; continue; }    // shell fleck
      r += stone === 0 ? 'v' : 'c';                            // lavender-grey / warm grey stone
    }
    rows.push(r);
  }
  emit('tile-cobblefloor',
    "Wave T35 (Lotus Cove kit): cobblefloor — Lotus Cove City's registered\n# street kind (the fleet's street kinds carry the -floor suffix; the\n# desire-path tiers key on it). COBBLE HARBOUR STONE: a mosaic of small\n# rounded river cobbles — warm grey and lavender-grey stones in pale\n# sand joints, sparse shell flecks. A round-stone mosaic is structurally\n# unlike Fairhaven's running-bond quay slabs, Blossom's large inlay\n# slabs, Copperton's square quarry flags, Lilac's bronze lattice grid,\n# Mistford's planks and Beacon's bolted decking.\n# (NO-SAME-KIT law; WAVE-T35-LOTUSCOVE-PLAN.md.)",
    rows,
    { c: ['#a8a29a', 'cobble-grey'], v: ['#9d94a6', 'cobble-lavender'], h: ['#d8d0c0', 'cobble-crown'], j: ['#b8a888', 'sand-joint'], e: ['#e8e0d0', 'shell-fleck'] });
}

// --- chainbar prop: harbour chain barrier on baked cliff rock ---
{
  const grid = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      if (H(x, y, 5, 3, 7) === 0) { r += 'd'; continue; }      // rock shade patch
      if (H(x, y, 3, 11, 13) === 0) { r += 'l'; continue; }    // rock light fleck
      r += 'r';
    }
    grid.push([...r]);
  }
  const put = (x, y, c) => { grid[y][x] = c; };
  // iron posts at x=2 and x=13, y6..15, with caps
  for (let y = 6; y < 16; y++) { put(2, y, 'i'); put(13, y, 'i'); }
  put(2, 5, 'C'); put(13, 5, 'C'); put(1, 6, 'C'); put(14, 6, 'C');
  // sagging chain between the post tops: dips to y=9 mid-span
  const chainY = (x) => 6 + Math.round(3 * Math.sin(Math.PI * (x - 2) / 11));
  for (let x = 2; x <= 13; x++) put(x, chainY(x), (x % 2 === 0) ? 'k' : 'g');
  // notice board hanging at the dip (x6..9, y10..13)
  for (let y = 10; y <= 13; y++) for (let x = 6; x <= 9; x++) put(x, y, 'w');
  for (let y = 11; y <= 12; y++) for (let x = 7; x <= 8; x++) put(x, y, 'p');
  put(6, 10, 'n'); put(9, 10, 'n');
  emit('tile-prop-chainbar',
    "Wave T35 (Lotus Cove kit): chainbar — the harbour chain barrier: two\n# black iron posts, a sagging iron chain, and a small nailed notice\n# board at the dip. The town's own HARBOUR CAVES sign says the mouths\n# are 'both chained and notice-boarded' — this is that dressing made\n# visible on the north cliff brow, flanking the cave mouths at (25,1)\n# and (27,1). Fully opaque: the cliff rock is baked in (measured\n# #8b8b9b / #71523d from the shipped render).\n# (NO-SAME-KIT law; WAVE-T35-LOTUSCOVE-PLAN.md.)",
    grid.map((r) => r.join('')),
    { r: ['#8b8b9b', 'rock-face'], d: ['#71523d', 'rock-shade'], l: ['#a5a5b5', 'rock-light'], i: ['#2e2a33', 'iron-post'], C: ['#4a4450', 'post-cap'], k: ['#1e1a22', 'chain-dark'], g: ['#6a6472', 'chain-light'], w: ['#8a6a42', 'board-wood'], p: ['#e8ddc0', 'notice-paper'], n: ['#3a2c1c', 'nail'] });
}

// --- gullpost prop: mooring post + rope coil + perched brinegull, baked boardwalk ---
{
  const grid = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      if (y % 4 === 3) { r += 's'; continue; }
      if (H(x, y, 3, 11, 9) === 0) { r += 'l'; continue; }
      r += 'p';
    }
    grid.push([...r]);
  }
  const put = (x, y, c) => { grid[y][x] = c; };
  // mooring post x7..8, y6..15, tarred, with two rope bands
  for (let y = 6; y < 16; y++) { put(7, y, 'P'); put(8, y, 'P'); }
  for (const y of [8, 12]) { put(7, y, 'R'); put(8, y, 'R'); }
  put(7, 6, 'T'); put(8, 6, 'T');
  // rope coil at the foot (x4..6, y13..15)
  for (let y = 13; y <= 15; y++) for (let x = 4; x <= 6; x++) put(x, y, y === 14 ? 'r' : 'R');
  // the brinegull, perched on the post top: tail left, head right
  const gull = [
    [3, 3, 'f'], [4, 3, 'f'],
    [4, 4, 'b'], [5, 4, 'b'], [6, 4, 'b'], [7, 4, 'b'], [8, 4, 'b'], [9, 4, 'h'], [10, 4, 'h'],
    [5, 5, 'b'], [6, 5, 'w'], [7, 5, 'w'], [8, 5, 'b'], [9, 5, 'h'], [10, 5, 'e'], [11, 5, 'o'],
    [6, 6, 'b'], [7, 6, 'b'], [8, 6, 'b'],
  ];
  for (const [x, y, c] of gull) put(x, y, c);
  emit('tile-prop-gullpost',
    "Wave T35 (Lotus Cove kit): gullpost — a tarred mooring post at the\n# pier head with a rope coil at its foot and a BRINEGULL perched on\n# top (YUKI's dialogue: 'I practise my appeals on the pier. The\n# BRINEGULL are brutal judges.'). Fully opaque: the boardwalk it\n# stands on is baked in (measured #997e5b / #7d6547), the camoleon\n# precedent. One seat: the pier's last land-side cell (11,15).\n# (NO-SAME-KIT law; WAVE-T35-LOTUSCOVE-PLAN.md.)",
    grid.map((r) => r.join('')),
    { p: ['#997e5b', 'plank-face'], l: ['#a8906a', 'plank-light'], s: ['#7d6547', 'plank-seam'], P: ['#4a3826', 'post'], T: ['#5d4830', 'post-top'], R: ['#c8a86a', 'rope'], r: ['#a8823f', 'rope-shade'], b: ['#f2f0ea', 'gull-body'], w: ['#d8d5cc', 'gull-wing'], h: ['#f2f0ea', 'gull-head'], e: ['#1e1a22', 'gull-eye'], o: ['#e89a3a', 'gull-beak'], f: ['#b8bcc4', 'gull-tail'] });
}
