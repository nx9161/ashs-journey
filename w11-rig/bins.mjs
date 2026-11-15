// bins.mjs — diagnostic: print the audit-style palette bins of a pair.
// NOTE: approximates scripts/audit-battle-art.mjs (its mass base
// differs slightly); the audit itself is the ground truth.
import { parsePix } from '../assets/sprites/tools/pix.mjs';
import fs from 'node:fs';
const rgb = (hex) => Array.isArray(hex) ? hex : [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
function bins(path) {
  const { pal, rows } = parsePix(fs.readFileSync(path, 'utf8'), path);
  const counts = new Map(); let mass = 0;
  for (const row of rows) for (const ch of row) {
    if (ch === '.') continue; mass++;
    const hex = pal[ch].hex; counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const present = new Map();
  for (const [hex, n] of counts) {
    if (n / mass < 0.015) continue;
    const [r, g, b] = rgb(hex);
    const bin = (r >> 6) * 16 + (g >> 6) * 4 + (b >> 6);
    present.set(bin, (present.get(bin) || 0) + n);
  }
  return { mass, present };
}
const [f, b] = [bins(process.argv[2]), bins(process.argv[3])];
const F = new Set(f.present.keys()), B = new Set(b.present.keys());
const inter = [...F].filter(x => B.has(x));
console.log('front bins', F.size, [...F].sort((a, b) => a - b).join(','));
console.log('back  bins', B.size, [...B].sort((a, b) => a - b).join(','));
console.log('pairJ =', (inter.length / new Set([...F, ...B]).size).toFixed(3), ' inter', inter.length, 'union', new Set([...F, ...B]).size);
console.log('front-only:', [...F].filter(x => !B.has(x)).map(x => x + '(' + f.present.get(x) + 'px)').join(' '));
console.log('back-only :', [...B].filter(x => !F.has(x)).map(x => x + '(' + b.present.get(x) + 'px)').join(' '));
