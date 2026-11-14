// W17-E kit art generator: writes .pix files for the 2 Crown Road kinds.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const DIR = process.env.PIXDIR;
function rng(seed) { let h = createHash('sha256').update(seed).digest(); let i = 0; return () => { if (i >= 28) { h = createHash('sha256').update(h).digest(); i = 0; } return h[i++] / 256; }; }
function speckle(seed, base, flecks) {
  const r = rng(seed); const rows = [];
  for (let y = 0; y < 16; y++) { let s = ''; for (let x = 0; x < 16; x++) { let c = base; for (const [fc, d] of flecks) if (r() < d) { c = fc; break; } s += c; } rows.push(s); }
  return rows;
}
function writePix(name, title, rows, pal) {
  const body = [`# ${title}`, `PIX ${name} 16 16`, ...rows, 'PAL', ...Object.entries(pal).map(([k, v]) => `${k} ${v}`)].join('\n') + '\n';
  writeFileSync(`${DIR}/tile-${name}.pix`, body);
}
const put = (rows, x, y, c) => { rows[y] = rows[y].substring(0, x) + c + rows[y].substring(x + 1); };

// ---- Crown Road Ceremonial (idx 1166-1167)
// crownfloor: LAID stone — large dressed flags in a running bond
// (full-width grout seams at y=7/15, staggered vertical joints),
// dark violet-charcoal, worn highlights rare. The only cave floor
// in Arden that was built, not formed: split from Lunestone's pale
// moonstone speckle, Stonebore's warm strata speckle, and
// Crownspire's bright veined marble (veinfloor) by value + joints.
writePix('crownfloor', 'Wave W17-E (Crown Road): crown floor — dark ceremonial flags, laid stone in a running bond with grout seams and staggered joints, violet-charcoal worn by thirty years of challengers. The League\u2019s own cave floor (NO-SAME-KIT law; WAVE-W17-ROUTE-PROGRAM-PLAN.md).',
  (() => { const rows = speckle('crownfloor', 'a', [['b', 0.15], ['d', 0.06], ['h', 0.02]]);
    for (let x = 0; x < 16; x++) { put(rows, x, 7, 's'); put(rows, x, 15, 's'); }
    for (let y = 0; y < 7; y++) put(rows, 7, y, 's');
    for (let y = 8; y < 15; y++) { put(rows, 3, y, 's'); put(rows, 11, y, 's'); }
    return rows; })(),
  { a: '#4b4454', b: '#564e60', d: '#3d3747', s: '#2c2733', h: '#6e637c' });
// crownwall: ASHLAR masonry — four squared block courses per tile,
// each course lit on its top edge and shadowed at its foot, vertical
// joints staggered course to course, two short hanging points in
// the wall's own stone. Masonry, not geology: split from Stonebore's
// sedimentary strata bands and Lunestone's natural banded faces.
writePix('crownwall', 'Wave W17-E (Crown Road): crown wall — ashlar block courses, squared and jointed, violet-grey masonry with its own hanging points; the mountain cut into a hall for the League.',
  (() => { const r = rng('crownwall'); const rows = [];
    const joints = { 0: [5, 12], 1: [2, 9], 2: [6, 13], 3: [3, 10] };
    for (let y = 0; y < 16; y++) { const course = (y / 4) | 0; const sub = y % 4; let s = '';
      for (let x = 0; x < 16; x++) { let c = sub === 0 ? 'h' : sub === 3 ? 'z' : 'm';
        if (sub === 1 || sub === 2) { const v = r(); c = v < 0.18 ? 'a' : v < 0.24 ? 'z' : 'm'; }
        if (sub === 0 && r() < 0.2) c = 'a';
        if (joints[course].includes(x)) c = 'z';
        s += c; }
      rows.push(s); }
    for (const px of [4, 11]) { put(rows, px, 0, 'c'); put(rows, px, 1, 'c'); }
    return rows; })(),
  { z: '#2e2a38', m: '#4e4659', a: '#5d5468', h: '#6f6480', c: '#857a99' });
console.log('pix written');
