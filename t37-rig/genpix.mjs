// Wave T37 rig: author the five Craterlake .pix tiles from pattern
// rules (crater-white coursed ashlar roof / white crater sett /
// crater-stone wall) and hand-authored prop rows (the painter's
// easel / a crater vent stone), then assert every row is exactly
// 16 chars. The rendered tiles are viewed via pix2png before
// landing — files are the deliverable.
import { writeFileSync } from 'node:fs';

const D = '/home/hatch/workspace/ashs-journey-t37/assets/sprites/pix/tiles/';
const H = (x, y, a, b, m) => ((x * a + y * b) % m + m) % m;

function emit(name, header, rows, pal) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + r);
  const body = ['# ' + header, 'PIX ' + name + ' 16 16', ...rows, 'PAL',
    ...Object.entries(pal).map(([c, [hex, label]]) => c + ' ' + hex + ' ' + label), ''].join('\n');
  writeFileSync(D + name + '.pix', body);
  console.log('wrote', name);
}

// --- craterroof: coursed crater-white ashlar with a vent shadow ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    const course = Math.floor(y / 3), v = y % 3;
    const stag = (course % 2) * 2;
    for (let x = 0; x < 16; x++) {
      const u = (x + stag) % 5;
      if (v === 2) { r += 's'; continue; }                     // course shadow seam
      if (u === 0) { r += 's'; continue; }                     // block side seam
      if (v === 0) { r += 'l'; continue; }                     // lit course crown
      if (H(x, y, 7, 5, 53) === 0) { r += 'v'; continue; }     // sparse vent dot
      if (H(x, y, 3, 11, 37) === 0) { r += 'a'; continue; }    // ash fleck
      r += 'w';
    }
    rows.push(r);
  }
  emit('tile-craterroof',
    "Wave T37 (Craterlake kit): craterroof — Craterlake City's own\n# roof kind. CRATER-WHITE ASHLAR: pale crater-stone blocks\n# (#e6e1d5 body, #f4f1ea lit crowns, #b0aa9c seams — the town\n# style's own roof register) in offset courses of three, ash\n# flecks and a rare dark vent dot in the stone. Coursed ashlar\n# is structurally unlike Lastlight's flat parapet slab, Lotus\n# Cove's scalloped barrel tile, Steamspring's ridged clay\n# barrel and the Gym's banded slab. Worn by the Gym and the\n# town's two facade cottages. (NO-SAME-KIT law;\n# WAVE-T37-CRATERLAKE-PLAN.md.)",
    rows,
    { w: ['#e6e1d5', 'ashlar-body'], l: ['#f4f1ea', 'ashlar-crown'], s: ['#b0aa9c', 'ashlar-seam'], a: ['#8a8478', 'ash-fleck'], v: ['#6e6a60', 'vent-dot'] });
}

// --- craterfloor: white crater sett with ash-drifted grout ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      if (x % 4 === 3 || y % 3 === 2) {                        // ash grout grid
        r += (H(x, y, 5, 3, 7) === 0) ? 'a' : 'g'; continue;  // drifted ash in the joints
      }
      if (H(x, y, 7, 5, 29) === 0) { r += 'a'; continue; }     // ash fleck on a sett
      if (H(x, y, 3, 11, 13) === 0) { r += 'l'; continue; }    // lit sett face
      if (H(x, y, 11, 7, 17) === 0) { r += 'd'; continue; }    // shaded sett face
      r += 'w';
    }
    rows.push(r);
  }
  emit('tile-craterfloor',
    "Wave T37 (Craterlake kit): craterfloor — Craterlake City's\n# registered street kind (the fleet's street kinds carry the\n# -floor suffix; the desire-path tiers key on it). WHITE\n# CRATER SETT: rough white crater-stone setts in a tight dark\n# ash grout grid, grey ash drifted into the joints and flecked\n# across the faces — the painting's white ring streets. A\n# rough small-block white sett is structurally unlike\n# Lastlight's smooth veined marble slabs, Cragmoor's dark\n# basalt sett (the same grammar in black) and Blossom's large\n# inlay slabs. (NO-SAME-KIT law; WAVE-T37-CRATERLAKE-PLAN.md.)",
    rows,
    { w: ['#ddd7c9', 'sett-body'], l: ['#eae5d8', 'sett-lit'], d: ['#c4beae', 'sett-shade'], g: ['#8a8478', 'ash-grout'], a: ['#a39d8f', 'ash-drift'] });
}

// --- craterwall: crater-white stone wall face ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    if (y === 0) { rows.push('llllllllllllllll'); continue; }  // trim course crown
    if (y === 1) {                                              // trim course face
      for (let x = 0; x < 16; x++) r += (x % 4 === 3) ? 's' : 'l';
      rows.push(r); continue;
    }
    if (y >= 13) {                                              // shaded base course
      for (let x = 0; x < 16; x++) r += (y === 13) ? 's' : 'd';
      rows.push(r); continue;
    }
    const course = Math.floor((y - 2) / 4), v = (y - 2) % 4;
    const stag = (course % 2) * 3;
    for (let x = 0; x < 16; x++) {
      const u = (x + stag) % 6;
      if (v === 3 || u === 0) { r += 's'; continue; }           // block seams
      if (H(x, y, 7, 5, 41) === 0) { r += 'a'; continue; }      // ash fleck
      r += 'w';
    }
    rows.push(r);
  }
  emit('tile-craterwall',
    "Wave T37 (Craterlake kit): craterwall — the facade cottages'\n# wall kind. CRATER-WHITE STONE WALL: the ashlar's wall face —\n# a pale trim course at the crown, larger crater-stone blocks\n# (#e6e1d5 body, #b0aa9c seams) in offset courses, a shaded\n# base course at the foot, so a cottage reads as one crater-\n# stone building under its craterroof. (NO-SAME-KIT law;\n# WAVE-T37-CRATERLAKE-PLAN.md.)",
    rows,
    { w: ['#e6e1d5', 'wall-body'], l: ['#f4f1ea', 'trim-course'], s: ['#b0aa9c', 'wall-seam'], d: ['#a39d8f', 'base-course'], a: ['#8a8478', 'ash-fleck'] });
}

// --- painteasel: the painter's easel on the lake's east shore (prop) ---
// (kind name 'painteasel', not 'easel': a base interior furniture
// prop already owns the kind name 'easel' + tile-prop-easel —
// caught by the splice's duplicate check before any harm.)
{
  const rows = [
    'ggdgggggggggdggg',
    'ggggggdggggggggg',
    'ggggkkkkkkkkgggg',
    'ggggkcccccckgggg',
    'ggggkcccccckgggg',
    'ggggkccnccckgggg',
    'ggggkcccccckgggg',
    'ggggkbbbbbbkgggg',
    'ggggkcccccckgggg',
    'ggggkcccccckgggg',
    'ggggkkkkkkkkgggg',
    'gggggtggtgtggggg',
    'ggggtgggtggtgggg',
    'ggggtgrybngtgggg',
    'ggggtgttttgtgggg',
    'gggddddddddddggg',
  ];
  emit('tile-prop-painteasel',
    "Wave T37 (Craterlake kit): painteasel — the gym leader's painting\n# easel, standing on the crater lake's east shore beside\n# CASPIAN FAN RUE's post (her byte-kept words: 'Our gym\n# leader paints battles the way the lake paints mornings';\n# the approved painting shows it on the shore). A timber\n# A-frame easel holding a pale canvas — a lake-blue horizon\n# stroke and one dark diver's mark — with a paint box at its\n# foot. Fully opaque: the town grass it stands on is baked\n# in (measured #2a9327 off the shipped render).\n# (NO-SAME-KIT law; WAVE-T37-CRATERLAKE-PLAN.md.)",
    rows,
    { g: ['#2a9327', 'town-grass'], d: ['#257c20', 'grass-shade'], k: ['#5f4f33', 'dark-timber'], t: ['#a08b62', 'timber'], c: ['#f4f1ea', 'canvas'], b: ['#7fa8c8', 'lake-stroke'], n: ['#33526e', 'deep-stroke'], r: ['#c85a4a', 'paint-red'], y: ['#e8c85a', 'paint-gold'] });
}

// --- ventstone: a crater vent stone (prop) ---
{
  const rows = [
    'ggdggggggggggggg',
    'ggggggggggdggggg',
    'gggggggggggggggg',
    'gggggllllllggggg',
    'ggggllllllllgggg',
    'ggglwwwwwwwwsggg',
    'ggglwwwwawwwsggg',
    'ggglwwwvvwwwsggg',
    'ggglwwvkkvwwsggg',
    'ggglwwwvvwwwsggg',
    'ggglwawwwwwwsggg',
    'gggswwwwwwwwsggg',
    'ggggssssssssgggg',
    'ggggddddddddgggg',
    'gggggggggggggggg',
    'ggggggdggggggggg',
  ];
  emit('tile-prop-ventstone',
    "Wave T37 (Craterlake kit): ventstone — a crater vent stone:\n# a white crater boulder pierced by one round dark vent\n# mouth, ash flecks in the stone — the approved painting's\n# signature rim geology. Two stand at the rim ledge's ends,\n# flanking the north stamp row at the cliff foot. Fully\n# opaque: the town grass it stands on is baked in (measured\n# #2a9327 off the shipped render). (NO-SAME-KIT law;\n# WAVE-T37-CRATERLAKE-PLAN.md.)",
    rows,
    { g: ['#2a9327', 'town-grass'], d: ['#257c20', 'grass-shade'], l: ['#f4f1ea', 'stone-lit'], w: ['#e6e1d5', 'stone-body'], s: ['#b0aa9c', 'stone-shade'], a: ['#a39d8f', 'ash-fleck'], v: ['#4a463e', 'vent-ring'], k: ['#17150f', 'vent-core'] });
}
