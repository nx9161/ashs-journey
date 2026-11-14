import fs from 'node:fs';
import { parsePix } from '/home/hatch/workspace/ashs-journey-t37/assets/sprites/tools/pix.mjs';
for (const base of process.argv.slice(2)) {
  const pix = parsePix(fs.readFileSync(`/home/hatch/workspace/ashs-journey-t37/assets/sprites/pix/tiles/${base}.pix`, 'utf8'), base);
  console.log(base, pix.w + 'x' + pix.h, 'pal:', Object.keys(pix.pal).length, 'rows ok:', pix.rows.every(r => r.length === pix.w));
  const px = [];
  for (const row of pix.rows) for (const ch of row) { const c = pix.pal[ch].hex; px.push([parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]); }
  fs.writeFileSync(`/tmp/${base}.json`, JSON.stringify({ w: pix.w, h: pix.h, px }));
}
