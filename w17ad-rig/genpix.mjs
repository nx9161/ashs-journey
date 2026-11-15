// W17-AD kit art generator: writes .pix files for the 8
// Amber Sea lane kinds (West 1536-1537, Central 1538-1539,
// East 1540-1541, North 1542-1543). Sea-lane idiom (Maris/
// Borea): sand kinds are full shore-sand tiles; rock kinds
// are jointed boulders standing in baked shipped-palette
// water with a foam collar — the lane's register is carried
// by the boulder/sand, never by a mismatched water square.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const DIR = process.env.PIXDIR;
function rng(seed) { let h = createHash('sha256').update(seed).digest(); let i = 0; return () => { if (i >= 28) { h = createHash('sha256').update(h).digest(); i = 0; } return h[i++] / 256; }; }
function speckle(seed, base, flecks) {
  const r = rng(seed); const rows = [];
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = base; for (const [fc, d] of flecks) if (r() < d) { c = fc; break; } s += c; } rows.push(s); }
  return rows;
}
const put = (rows, x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };
const sprinkle = (rows, seed, test, c, d) => { const r = rng(seed); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (test(rows[y][x]) && r() < d) put(rows, x, y, c); };
function writePix(name, title, rows, pal) {
  const body = [`# ${title}`, `PIX ${name} 16 16`, ...rows, 'PAL', ...Object.entries(pal).map(([k, v]) => `${k} ${v}`)].join('\n') + '\n';
  writeFileSync(`${DIR}/tile-${name}.pix`, body);
}
// A sea rock: jointed boulder in baked shipped water, foam
// collar at base. opts: spans (row->[x0,x1]), jointDensity,
// glint (lantern-warm pixels on the boulder's top rows).
function seaRock(seed, opts = {}) {
  const rows = speckle(seed, 'w', [['x', 0.12], ['y', 0.05]]);
  const spans = opts.spans || { 3: [6, 9], 4: [5, 10], 5: [4, 11], 6: [4, 11], 7: [3, 12], 8: [3, 12], 9: [4, 11], 10: [4, 11], 11: [5, 10], 12: [5, 10] };
  const ys = Object.keys(spans).map(Number).sort((a, b) => a - b);
  for (const y of ys) for (let x = spans[y][0]; x <= spans[y][1]; x++) put(rows, x, y, 'm');
  sprinkle(rows, seed + '-joint', (c) => c === 'm', 'z', opts.jointDensity ?? 0.16);
  sprinkle(rows, seed + '-face', (c) => c === 'm', 'c', 0.22);
  // Lit top: the first span row lit narrow, second row partial.
  const [t0, t1] = [ys[0], ys[1]];
  for (let x = spans[t0][0] + 1; x <= spans[t0][1] - 1; x++) if (rows[t0][x] === 'm') put(rows, x, t0, 'p');
  for (let x = spans[t1][0]; x <= spans[t1][0] + 3; x++) if (rows[t1][x] === 'm') put(rows, x, t1, 'p');
  if (opts.glint) {
    const r = rng(seed + '-glint');
    for (const y of ys.slice(0, 3)) for (let x = 0; x < 16; x++) if ((rows[y][x] === 'm' || rows[y][x] === 'c' || rows[y][x] === 'p') && r() < 0.13) put(rows, x, y, 'g');
  }
  const r = rng(seed + '-foam');
  for (let x = 3; x <= 12; x++) { if (r() < 0.75) put(rows, x, 13, 'f'); if (r() < 0.4) put(rows, x, 12, 'f'); }
  return rows;
}
// Short horizontal wake streaks (2-3 px) on base cells.
function wakeStreaks(rows, seed, c, n) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(r() * 16), x = Math.floor(r() * 13), len = 2 + Math.floor(r() * 2);
    for (let dx = 0; dx < len; dx++) if (rows[y][x + dx] === 'a') put(rows, x + dx, y, c);
  }
  return rows;
}
const WATER = { w: '#567cbd', x: '#476baa', y: '#7093c7', f: '#eef2e6' };

// ---- West (1536-1537): First Ferry Water — warm gold-green shallows, the ferry wake in the sand
writePix('wakesand', 'Wave W17-AD (Amber Sea — West): wake sand — warm gold-green shallows sand, wake-flecked: the first water out of Marisol, still gold with the shore and green with the shallows, carrying the ferry wake as short pale streaks combed west-east across the tread — the wake drawn as fleck register in the kind (design: coral heads in clear shallows, a ferry wake crossing the lane). West’s own sand — split from its twin Central by temperature and traffic entire (warm gold-green under the wake vs garden-bright still water) and from Maris’s bright sand (R219) by hue: this sand is olive-gold, that one pale lemon.',
  wakeStreaks(speckle('wakesand', 'a', [['b', 0.14], ['s', 0.03]]), 'wakesand-wake', 's', 9),
  { a: '#c8bf7d', b: '#a89e5e', s: '#f6f2d8' });
writePix('wakerock', 'Wave W17-AD (Amber Sea — West): wake rock — a low rounded wake-washed boulder standing in the shipped sea, its crown washed pale by every crossing’s wash, foam collar at its base (design: small rocky islets in the lane). West’s own rock — split from Central’s taller garden rock by stance entire (low and wash-rounded vs tall and bright-faced) and from Maris’s mooring rock by wear: this stone is smoothed by traffic, that one is rope-worn.',
  seaRock('wakerock', { spans: { 5: [5, 10], 6: [4, 11], 7: [3, 12], 8: [3, 12], 9: [4, 11], 10: [4, 11], 11: [5, 10], 12: [5, 10] }, jointDensity: 0.12 }),
  { ...WATER, z: '#7d7462', c: '#c6bda8', m: '#9a8f7a', p: '#e6dfc8' });

// ---- Central (1538-1539): the Crossing Heart — bright garden sand, coral-pink flecks
writePix('gardensand', 'Wave W17-AD (Amber Sea — Central): garden sand — bright garden sand, coral-pink flecks: the crossing heart’s shore sand, bright and warm, flecked coral-pink where the coral gardens stand under the shallows and their colour combs up onto the islets (design: coral gardens in the shallows, ferry wakes crossing). Central’s own sand — split from its twin West by register entire (garden pink on bright still sand vs the wake’s pale streaks on gold-green) and from Maris’s quiet sand by the garden itself: this sand carries planted colour in its own register, that one is garden seen through glass-clear water (water dressing there, sand register here).',
  speckle('gardensand', 'a', [['b', 0.11], ['p', 0.05], ['s', 0.02]]),
  { a: '#ead9a4', b: '#d3ba7f', p: '#e59a8c', s: '#f8f1dc' });
writePix('gardenrock', 'Wave W17-AD (Amber Sea — Central): garden rock — a taller garden boulder standing in the shipped sea, bright faces up where the garden light hits it, foam collar at its base (design: the crossing’s islets stand taller over the gardens). Central’s own rock — split from West’s low wash-rounded stone by stance entire and from Maris’s tower-isle rock by face: this boulder is bright-faced and tall, a garden marker, not a shore stone.',
  seaRock('gardenrock', { spans: { 2: [6, 9], 3: [5, 10], 4: [4, 11], 5: [4, 11], 6: [3, 12], 7: [3, 12], 8: [3, 12], 9: [4, 11], 10: [4, 11], 11: [5, 10], 12: [5, 10] }, jointDensity: 0.14 }),
  { ...WATER, z: '#6e685c', c: '#d0c9b4', m: '#8f8a7c', p: '#f2eedd' });

// ---- East (1540-1541): Resort Water — the brightest warm harbour sand, shell-flecked
writePix('resortsand', 'Wave W17-AD (Amber Sea — East): resort sand — bright warm harbour sand, shell-flecked: the fleet’s brightest shore sand, bleached warm by the resort shore sun and flecked with shell white and sparse shell pink (design: Reefside’s rock spikes standing in pink shell sand, Calamondin’s pools glinting off the lane). East’s own sand — split from its twin North by light entire (the brightest water in the program vs the deep channel’s darkest sand) and from Borea’s solar sand (R222) by company: this sand is harbour-kept and shell-strewn, that one is beach-road shore.',
  speckle('resortsand', 'a', [['b', 0.11], ['s', 0.05], ['p', 0.015]]),
  { a: '#f0deb0', b: '#dec894', s: '#faf3e2', p: '#eec9b8' });
writePix('resortrock', 'Wave W17-AD (Amber Sea — East): resort rock — a clean pale boulder standing in the shipped sea, its faces worked smooth and light, foam collar at its base (design: rock spikes in pink shell sand at the Reefside end — the lane’s rocks are the harbour’s kept stones). East’s own rock — split from North’s deep-shadow shrine rock by light entire (pale worked faces in bright water vs dark stone in the channel) and from Foamline’s footing rock by keeping: this stone is a harbour ornament, that one is a walkway footing.',
  seaRock('resortrock', { jointDensity: 0.08 }),
  { ...WATER, z: '#86806f', c: '#d9d3c1', m: '#a8a294', p: '#f6f1e2' });

// ---- North (1542-1543): Pilgrim Water — the fleet’s darkest sand, deep-shadow rock with a lantern glint
writePix('shrinesand', 'Wave W17-AD (Amber Sea — North): shrine sand — deep-channel sand, sparse flecks: the sea-lane fleet’s darkest sand value, an olive-brown bottom lying under the narrowing channel toward Sanctum, its flecks sparse where the light thins (design: the lane narrowing toward the festival shore, the three shrine isles standing off it — their own maps, not this lane’s; the sand darkens toward them). North’s own sand — split from its twin East by light entire (darkest vs brightest in the program) and from the League sand (R223) by hue: this bottom is olive-brown channel earth, that one is slate-blue cliff shadow.',
  speckle('shrinesand', 'a', [['b', 0.12], ['d', 0.04], ['s', 0.025]]),
  { a: '#a4936e', b: '#877650', d: '#77683f', s: '#c9bb96' });
writePix('shrinerock', 'Wave W17-AD (Amber Sea — North): shrine rock — a deep-shadow boulder standing in the shipped sea, dark in the channel, carrying a sparse lantern-warm glint at its top register — Sanctum’s lantern light reaching the lane’s last stones, drawn in the kind at art layer only (design: lantern light on the water at the far end). North’s own rock — split from East’s pale worked stone by light entire and from the shrine isles’ own rocks by office: this stone stands IN the lane as its last marker; the isles themselves are out of program and unbuilt by this wave.',
  seaRock('shrinerock', { jointDensity: 0.18, glint: true }),
  { ...WATER, z: '#3f3d37', c: '#8a867c', m: '#5e5c55', p: '#77736a', g: '#e8b25a' });
console.log('pix written');
