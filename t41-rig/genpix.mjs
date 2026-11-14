// Wave T41 rig: author the four Shingle Town .pix tiles from
// pattern rules (raked shell-sand floor / scalloped shell-shingle
// roof) and hand-authored prop rows (the TIDESLUG beside ANA /
// the tide's driftwood log), then assert every row is exactly
// 16 chars. The rendered tiles are viewed via pix2png before
// landing — files are the deliverable.
import { writeFileSync } from 'node:fs';

const D = '/home/hatch/workspace/ashs-journey-t41/assets/sprites/pix/tiles/';
const H = (x, y, a, b, m) => ((x * a + y * b) % m + m) % m;

function emit(name, header, rows, pal) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + r);
  const body = ['# ' + header, 'PIX ' + name + ' 16 16', ...rows, 'PAL',
    ...Object.entries(pal).map(([c, [hex, label]]) => c + ' ' + hex + ' ' + label), ''].join('\n');
  writeFileSync(D + name + '.pix', body);
  console.log('wrote', name);
}

// --- shellfloor: raked shingle-sand with shell chips ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      if (y % 4 === 3 && H(x, y, 3, 7, 11) !== 0) { r += 'g'; continue; } // rake groove (broken)
      if (H(x, y, 7, 3, 41) === 0) { r += 'w'; continue; }                 // white shell chip
      if (H(x, y, 5, 11, 67) === 0) { r += 'k'; continue; }                // pink shell fleck
      if (H(x, y, 11, 5, 29) === 0) { r += 's'; continue; }                // grey pebble
      if (H(x, y, 3, 11, 13) === 0) { r += 'n'; continue; }                // pale sand lift
      r += 'p';
    }
    rows.push(r);
  }
  emit('tile-shellfloor',
    "Wave T41 (Shingle kit): shellfloor — Shingle Town's own\n# street kind. RAKED SHINGLE-SAND: pale shell-sand (#d9c491\n# body) combed into fine horizontal rake grooves every four\n# pixels, strewn with shell chips — white shell shards, a\n# pink shell fleck, grey pebbles — in loose tide-line drifts.\n# Structurally unlike the beach's own unraked psand speckle\n# (byte-kept beside it), Wildflower's petal scatter on cream\n# gravel and Clover's flecked packed earth. The registered\n# street material of the town's front street, gate lanes and\n# cottage lanes. (NO-SAME-KIT law; WAVE-T41-SHINGLE-PLAN.md.)",
    rows,
    { p: ['#d9c491', 'shell-sand-body'], g: ['#b4a17e', 'rake-groove'], w: ['#f2ead6', 'shell-chip'], k: ['#e3a48f', 'pink-shell'], s: ['#8d8272', 'pebble'], n: ['#e6d7ac', 'sand-lift'] });
}

// --- shellroof: scalloped shell-shingle courses ---
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    const v = y % 4, course = Math.floor(y / 4), stag = (course % 2) * 2;
    for (let x = 0; x < 16; x++) {
      const u = (x + stag) % 4;
      if (v === 0) { r += 'l'; continue; }                        // lit course crown
      if (v === 3 && (u === 1 || u === 2)) { r += 'd'; continue; } // scallop cup shadow
      if (v === 3) { r += 'g'; continue; }                        // course lip shadow
      if (u === 0) { r += 'g'; continue; }                        // shingle side seam
      if (H(x, y, 7, 5, 47) === 0) { r += 'w'; continue; }        // shell-white fleck
      r += 'p';
    }
    rows.push(r);
  }
  emit('tile-shellroof',
    "Wave T41 (Shingle kit): shellroof — Shingle Town's own roof\n# kind. SCALLOPED SHELL SHINGLE: courses of pale sand\n# shingles (#d9c491) whose lower edges curve into scallop\n# arcs, each course shadowed under its lip, shell-white\n# flecks on the faces. A scalloped course is structurally\n# unlike Clover's vertical batten boards, Hushmoor's dark\n# gravel shingles and the Lab/Mart's flat slate (byte-kept).\n# Worn by the House and the town's two facade cottages.\n# (NO-SAME-KIT law; WAVE-T41-SHINGLE-PLAN.md.)",
    rows,
    { p: ['#d9c491', 'shingle-body'], l: ['#e8dcbc', 'course-crown'], g: ['#b4a17e', 'lip-shadow'], d: ['#a08b62', 'scallop-cup'], w: ['#f2ead6', 'shell-fleck'] });
}

// --- beach ground helper for the two props (measured psand bake) ---
function beach() {
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      if (H(x, y, 5, 3, 7) === 0) { r += 'b'; continue; }   // worn speckle
      if (H(x, y, 7, 11, 53) === 0) { r += 'n'; continue; } // pale lift
      r += 'p';
    }
    rows.push(r);
  }
  return rows.map((r) => [...r]);
}
const BEACH_PAL = { p: ['#c6b388', 'beach-sand'], b: ['#a69274', 'sand-worn'], n: ['#d7c699', 'sand-pale'] };

// --- tideslug prop: the TIDESLUG beside ANA's post ---
{
  const g = beach();
  const put = (x, y, c) => { g[y][x] = c; };
  // slug body: plump oval, rows 7-11, x3-12; head east (right)
  const body = [
    [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
    [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8],
    [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
    [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
  ];
  for (const [x, y] of body) put(x, y, 't');
  // belly fringe (paler) along the bottom edge
  for (const x of [4, 5, 6, 7, 8, 9, 10, 11, 12]) put(x, 11, 'l');
  put(3, 10, 'l'); put(13, 9, 'o');
  // outline: dark rim on the north + tail
  for (const x of [5, 6, 7, 8, 9, 10]) put(x, 6, 'o');
  put(4, 7, 'o'); put(3, 8, 'o'); put(3, 9, 't');
  // cerata: orange-tipped dots along the back
  for (const [x, y] of [[5, 5], [7, 5], [9, 5], [6, 6], [8, 6], [10, 6]]) { put(x, y, 'o'); }
  for (const [x, y] of [[5, 4], [7, 4], [9, 4]]) { put(x, y, 'k'); }
  // rhinophores at the head (east)
  put(12, 6, 'o'); put(13, 5, 'o'); put(13, 4, 'k'); put(12, 5, 't');
  // eye dot
  put(12, 8, 'o');
  // shell chips at its base
  put(2, 12, 'w'); put(9, 12, 'w'); put(14, 11, 'w');
  emit('tile-prop-tideslug',
    "Wave T41 (Shingle kit): tideslug — the TIDESLUG of Shingle\n# Beach, seated beside BEACHCOMBER ANA's post; her byte-kept\n# dialogue is its caption ('TIDESLUG change colour with the\n# coast here. The lab writes it down; the beach just does\n# it.'). A low sea-slug worn teal-blue on this shore,\n# orange-tipped cerata along its back, on the beach's own\n# sand (measured #c6b388) baked in, fully opaque.\n# (NO-SAME-KIT law; WAVE-T41-SHINGLE-PLAN.md.)",
    g.map((r) => r.join('')),
    { ...BEACH_PAL, t: ['#3f8f8a', 'slug-body'], l: ['#7fb8ad', 'slug-fringe'], o: ['#2a5f5c', 'slug-shade'], k: ['#e8875a', 'cerata-tip'], w: ['#f2ead6', 'shell-chip'] });
}

// --- tidelog prop: the tide's driftwood on the west beach ---
{
  const g = beach();
  const put = (x, y, c) => { g[y][x] = c; };
  // log body rows 7-10, x1-14
  for (let y = 7; y <= 10; y++) for (let x = 1; x <= 14; x++) put(x, y, 'w');
  // top light + grain lines
  for (let x = 1; x <= 14; x++) put(x, 7, 'l');
  for (const x of [3, 4, 8, 9, 10]) put(x, 8, 'g');
  for (const x of [5, 6, 11]) put(x, 9, 'g');
  // knot
  put(6, 9, 'r'); put(6, 8, 'r');
  // cut end (east): concentric rings
  put(14, 7, 'g'); put(14, 8, 'r'); put(14, 9, 'r'); put(14, 10, 'g'); put(13, 8, 'g'); put(13, 9, 'g');
  // west end shadow
  put(1, 9, 'g'); put(1, 10, 'g');
  // contact shadow beneath
  for (let x = 2; x <= 13; x++) put(x, 11, 'b');
  // one white shell at its foot + chips
  put(3, 12, 's'); put(4, 12, 's'); put(11, 12, 'n');
  emit('tile-prop-tidelog',
    "Wave T41 (Shingle kit): tidelog — a bleached driftwood log\n# delivered by the tide, seated on the west beach; the beach\n# sign's own words made visible ('The tide delivers shells,\n# driftwood, and the occasional research assistant.').\n# Weathered pale wood, dark end rings, one white shell at\n# its foot, on the beach's own sand (measured #c6b388)\n# baked in, fully opaque. (NO-SAME-KIT law;\n# WAVE-T41-SHINGLE-PLAN.md.)",
    g.map((r) => r.join('')),
    { ...BEACH_PAL, w: ['#b39b7d', 'bleached-wood'], l: ['#cdb69a', 'wood-light'], g: ['#8a7358', 'wood-grain'], r: ['#71523d', 'end-ring'], s: ['#f2ead6', 'shell'] });
}
