// render-panels.mjs — proof renderer: .pix -> PNG at 2x (256x160)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix } from '../assets/sprites/tools/pix.mjs';
import { encodePng } from '../assets/sprites/tools/png.mjs';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.argv[2];
for (const id of process.argv.slice(3)) {
  const s = parsePix(fs.readFileSync(path.join(ROOT, 'assets/sprites/pix/keyart', id + '.pix'), 'utf8'), id);
  const S = 2, W = s.w * S, H = s.h * S, rgba = Buffer.alloc(W * H * 4);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  s.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const [r, gg, b] = hex(s.pal[ch].hex);
      for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
        const o = ((y * S + dy) * W + x * S + dx) * 4;
        rgba[o] = r; rgba[o + 1] = gg; rgba[o + 2] = b; rgba[o + 3] = 255;
      }
    });
  });
  fs.writeFileSync(path.join(outDir, id + '.png'), encodePng(W, H, rgba));
  console.log('rendered ' + id + '.png');
}
