// render-panel.mjs — rasterize a panel .pix to a PNG proof at 3x
// (nearest-neighbour). Usage:
//   node w10-rig/render-panel.mjs <pix-file> <out.png> [scale]
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';
import { rasterize, encodePng } from '../assets/sprites/tools/png.mjs';

const [pixPath, outPath, scaleArg] = process.argv.slice(2);
const scale = scaleArg ? +scaleArg : 3;
const s = parsePix(fs.readFileSync(pixPath, 'utf8'), pixPath);
const src = rasterize(s);
const W = s.w * scale, H = s.h * scale;
const out = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const so = (((y / scale) | 0) * s.w + ((x / scale) | 0)) * 4;
  const oo = (y * W + x) * 4;
  out[oo] = src[so]; out[oo + 1] = src[so + 1]; out[oo + 2] = src[so + 2]; out[oo + 3] = src[so + 3];
}
fs.mkdirSync(new URL('.', `file://${outPath}`).pathname, { recursive: true });
fs.writeFileSync(outPath, encodePng(W, H, out));
console.log(`render-panel: ${s.id} ${s.w}x${s.h} @${scale}x -> ${outPath}`);
