// rimlight.mjs — W11 T4 sprite-space top-light for a back view.
// Repaints the top contour of the sprite's upper region with the
// pair's pale letters: the topmost painted cell of each column takes
// --top letter, the painted cell beneath it takes --sub letter (only
// where the current letter is a body tone, never the outline). This
// restores, in sprite space, the lit cap the front view carries in
// its pale bins — the share the design-level top-light loses to
// area-average downscale + median-cut fragmentation.
// Usage: node w11-rig/rimlight.mjs <in.pix> <out.pix> <topCh> <subCh>
//        [upperFrac=0.55]
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const [src, dst, topCh, subCh, fracS] = process.argv.slice(2);
const frac = fracS ? parseFloat(fracS) : 0.55;
const S = parsePix(fs.readFileSync(src, 'utf8'), src);
const rows = S.rows.map((r) => [...r]);
let minY = 64, maxY = -1;
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  if (rows[y][x] !== '.') { if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const yLim = minY + Math.floor((maxY - minY + 1) * frac);
let nTop = 0, nSub = 0;
for (let x = 0; x < 64; x++) {
  let stage = 0; // 0 = seeking top interior cell, 1 = seeking sub cell
  for (let y = minY; y <= yLim && stage < 2; y++) {
    const ch = rows[y][x];
    if (ch === '.' || ch === 'O') continue;
    if (ch === topCh || ch === subCh) { stage++; continue; }
    if (stage === 0) { rows[y][x] = topCh; nTop++; }
    else { rows[y][x] = subCh; nSub++; }
    stage++;
  }
}
const out = rows.map((r) => r.join(''));
const palLines = Object.entries(S.pal).map(([ch, v]) =>
  `${ch} ${v.hex}` + (ch === 'O' ? ' kit outline' : ''));
const head = [
  `# ${S.id} battle sprite, 64x64. Rim-light cap in the pair's pale`,
  `# letters (w11-rig/rimlight.mjs) over the rank-matched palette.`,
  `PIX ${S.id} 64 64`,
];
fs.writeFileSync(dst, [...head, ...out, 'PAL', ...palLines, ''].join('\n'));
console.log(`${S.id}: rim-light top ${nTop} cells -> ${topCh}, sub ${nSub} cells -> ${subCh} (upper region y ${minY}..${yLim})`);
