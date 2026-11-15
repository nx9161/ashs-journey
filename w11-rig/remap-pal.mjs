// remap-pal.mjs — W11 shared-palette construction at the .pix level.
// Rewrites a back .pix so its palette is drawn from the front .pix's
// palette: within each colour family, back hexes and front hexes are
// both sorted by luminance and matched by a cumulative-mass walk
// (rank matching on letters), so every back hex lands on a front hex
// that itself holds >=1.5% of the front's mass — the audit's counted
// bins — which puts the back's bins inside the front's by
// construction. Silhouette, mass and cell geometry are untouched;
// only palette assignment changes. This is the deterministic form of
// the T1/T3 "posterize to the pair's shared palette" construction,
// applied after conversion because convert-monster always median-cuts
// independently per view and soft-shaded designs drift out of bin.
// Usage: node w11-rig/remap-pal.mjs <front.pix> <back.pix> <out.pix>
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const [frontPath, backPath, outPath, pinsArg] = process.argv.slice(2);
const pins = {};
if (pinsArg) for (const kv of pinsArg.split(',')) {
  const [b, f] = kv.split(':');
  pins[b] = f;
}
const F = parsePix(fs.readFileSync(frontPath, 'utf8'), frontPath);
const B = parsePix(fs.readFileSync(backPath, 'utf8'), backPath);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const family = (c) => {
  const [r, g, b] = c;
  if (r > 180 && g > 130 && b < 140 && r - b > 60) return 'bill';
  if (Math.min(r, g, b) >= 168) return 'pale';
  if (g - r > 30 && g >= b) return 'green';
  if (r - b > 8 && r >= g) return 'warm';
  return 'body';
};
const countsOf = (S) => {
  const counts = {};
  let mass = 0;
  for (const row of S.rows) for (const ch of row) {
    if (ch !== '.') { counts[ch] = (counts[ch] || 0) + 1; mass++; }
  }
  return { counts, mass };
};
const FC = countsOf(F), BC = countsOf(B);
// counted front letters: >=1.5% of front mass, excluding outline
const counted = Object.entries(F.pal)
  .filter(([ch]) => ch !== 'O' && (FC.counts[ch] || 0) / FC.mass >= 0.015)
  .map(([ch, v]) => ({ ch, hex: v.hex, rgb: rgb(v.hex), share: FC.counts[ch] / FC.mass }));
const backHexes = Object.entries(B.pal)
  .filter(([ch]) => ch !== 'O')
  .map(([ch, v]) => ({ ch, hex: v.hex, rgb: rgb(v.hex), n: BC.counts[ch] || 0 }))
  .filter((h) => h.n > 0);
const remap = { O: 'O' };
for (const [b, f] of Object.entries(pins)) {
  remap[b] = f;
  console.log(`  pin: back ${b} -> front ${f}`);
}
const fams = {};
for (const h of backHexes) {
  if (pins[h.ch]) continue;
  (fams[family(h.rgb)] ||= []).push(h);
}
for (const [fam, backs] of Object.entries(fams)) {
  let fronts = counted.filter((f) => family(f.rgb) === fam);
  if (!fronts.length) fronts = counted;
  fronts = [...fronts].sort((a, b) => lum(a.rgb) - lum(b.rgb));
  const sortedBacks = [...backs].sort((a, b) => lum(a.rgb) - lum(b.rgb));
  const totF = fronts.reduce((s, f) => s + f.share, 0);
  const totB = sortedBacks.reduce((s, h) => s + h.n, 0);
  let cum = 0;
  for (const h of sortedBacks) {
    const mid = (cum + h.n / 2) / totB;
    cum += h.n;
    let acc = 0, pick = fronts[fronts.length - 1];
    for (const f of fronts) {
      acc += f.share / totF;
      if (mid <= acc) { pick = f; break; }
    }
    remap[h.ch] = pick.ch;
    console.log(`  ${fam}: back ${h.ch}${h.hex} (${h.n}) -> front ${pick.ch}${pick.hex}`);
  }
}
const rows = B.rows.map((row) => [...row].map((ch) => (ch === '.' ? '.' : remap[ch])).join(''));
const used = new Set(rows.join('').replace(/\./g, '').split(''));
const palLines = Object.entries(F.pal)
  .filter(([ch]) => used.has(ch))
  .map(([ch, v]) => `${ch} ${v.hex}` + (ch === 'O' ? ' kit outline' : ''));
const head = [
  `# ${B.id} battle sprite, 64x64. Palette rank-matched onto the`,
  `# ${F.id} shared palette (w11-rig/remap-pal.mjs) — same art,`,
  `# pair palette by construction.`,
  `PIX ${B.id} 64 64`,
];
fs.writeFileSync(outPath, [...head, ...rows, 'PAL', ...palLines, ''].join('\n'));
const counts = {};
for (const row of rows) for (const ch of row) if (ch !== '.' && ch !== 'O') counts[ch] = (counts[ch] || 0) + 1;
console.log(`${B.id}: letters used:`,
  Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
