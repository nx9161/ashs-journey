// kit preview: render the 4 new tiles side by side at 8x
import fs from 'node:fs';
import { parsePix } from '/home/hatch/workspace/ashs-journey-t41/assets/sprites/tools/pix.mjs';
const names = ['tile-shellfloor', 'tile-shellroof', 'tile-prop-tideslug', 'tile-prop-tidelog'];
const S = 8, T = 16;
const W = names.length * T * S, Hh = T * S;
const px = new Uint8Array(W * Hh * 3).fill(255);
names.forEach((n, i) => {
  const pix = parsePix(fs.readFileSync('/home/hatch/workspace/ashs-journey-t41/assets/sprites/pix/tiles/' + n + '.pix', 'utf8'), n);
  pix.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const hex = pix.pal[ch].hex; const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) {
      const o = ((y * S + dy) * W + (i * T + x) * S + dx) * 3;
      px[o] = r; px[o + 1] = g; px[o + 2] = b;
    }
  }));
});
fs.writeFileSync('kit-preview.ppm', Buffer.concat([Buffer.from(`P6\n${W} ${Hh}\n255\n`), Buffer.from(px)]));
console.log('preview written');
