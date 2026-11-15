// render-pix.mjs — contact sheets from .pix files for proof renders.
// Usage: node w11-rig/render-pix.mjs <out.png> <scale> <pix...>
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';
import { encodePng } from '../assets/sprites/tools/png.mjs';

const [out, scaleS, ...files] = process.argv.slice(2);
const scale = parseInt(scaleS, 10) || 4;
const sprites = files.map((f) => parsePix(fs.readFileSync(f, 'utf8'), f));
const cell = 64 * scale;
const W = cell * sprites.length, H = cell;
const rgba = new Uint8Array(W * H * 4);
// slate backdrop (38,44,58)
for (let i = 0; i < W * H; i++) {
  rgba[i * 4] = 38; rgba[i * 4 + 1] = 44; rgba[i * 4 + 2] = 58; rgba[i * 4 + 3] = 255;
}
sprites.forEach((s, si) => {
  const { pal, rows } = s;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    const hex = pal[ch].hex;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const px = si * cell + x * scale + dx, py = y * scale + dy;
      const j = (py * W + px) * 4;
      rgba[j] = r; rgba[j + 1] = g; rgba[j + 2] = b; rgba[j + 3] = 255;
    }
  }
});
fs.writeFileSync(out, encodePng(W, H, rgba));
console.log('sheet ->', out);
