// T64: write the four kit .pix files in the repo's .pix format
// (PIX header + rows + PAL) — FLOOR stepfloor, WALL shrineroof,
// PROP festlantern on measured tropgrass (#5fa064 base family),
// PROP fairbanner on measured sand (#c6b388 base family).
import { writeFileSync } from 'node:fs';
const D = '/home/hatch/workspace/ashs-journey-t64/assets/sprites/pix/tiles/';
function pix(name, comment, pal, rows) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + r);
  const used = new Set(rows.join('').split(''));
  for (const c of used) if (!(c in pal)) throw new Error(name + ' unpaletted ' + c);
  const palLines = Object.entries(pal).map(([k, v]) => k + ' ' + v).join('\n');
  writeFileSync(D + name, '# Wave T64 (Sanctum): ' + comment + '\nPIX ' + name.replace(/\.pix$/, '') + ' 16 16\n' + rows.join('\n') + '\nPAL\n' + palLines + '\n');
  console.log('wrote', name, 'colors', Object.keys(pal).length);
  console.log(rows.join('\n'));
}
// deterministic speckle
const speck = (x, y, n) => ((x * 31 + y * 17 + x * y * 7) % n) === 0;

// stepfloor — FESTIVAL STEPPING STONES: two large soft stepping
// discs (offset, one corner-wrapped so the tiling scatters) on
// warm festival sand; sparse vermillion/gold petal flecks.
{
  const discs = [[5, 5, 4.3], [14, 13, 4.3], [-2, 13, 4.3], [14, -3, 4.3], [-2, -3, 4.3]];
  const rows = [];
  for (let y = 0; y < 16; y++) { let r = '';
    for (let x = 0; x < 16; x++) {
      let c = speck(x, y, 7) ? 'b' : (speck(x + 3, y + 1, 11) ? 'c' : 'a');
      for (const [cx, cy, rr] of discs) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= rr - 1.1) c = speck(x, y, 9) ? 'e' : 'D';
        else if (d <= rr) c = 's';
      }
      if ((x === 11 && y === 3) || (x === 2 && y === 11)) c = 'v';
      if (x === 9 && y === 10) c = 'g';
      r += c;
    } rows.push(r); }
  pix('tile-stepfloor.pix', 'festival stepping stones — large soft pale discs scattered on warm festival sand, sparse vermillion and gold petal flecks. Sanctum\u2019s street. (NO-SAME-KIT law; WAVE-T64-SANCTUM-PLAN.md \u00a75.)', {
    a: '#d6c096 festival sand', b: '#cbb489 sand speckle', c: '#e2d2aa sand light',
    D: '#eadfc0 stepping stone', e: '#f4ecd4 stone highlight', s: '#b39d72 stone rim',
    v: '#c8451f vermillion petal', g: '#e0a83c gold petal',
  }, rows);
}
// shrineroof — VERMILLION SHRINE ROOF: horizontal vermillion
// tile courses, dark ridge line closing each course, gold
// ridge cap along the top row.
{
  const rows = [];
  for (let y = 0; y < 16; y++) { let r = '';
    for (let x = 0; x < 16; x++) {
      if (y === 0) r += 'g';
      else if (y === 1) r += 'd';
      else {
        const course = ((y - 2) / 4) | 0, yy = (y - 2) % 4;
        if (yy === 3) r += 'd';
        else {
          const seam = ((x + course * 3) % 6) === 0;
          r += seam ? 'd' : (yy === 0 ? 'V' : 'v');
        }
      }
    } rows.push(r); }
  pix('tile-shrineroof.pix', 'vermillion shrine roof — horizontal vermillion tile courses with dark ridge lines and a gold ridge cap. Worn only by the Sanctum Shrine stamp. (NO-SAME-KIT law; WAVE-T64-SANCTUM-PLAN.md \u00a75.)', {
    g: '#e8b64c gold ridge cap', d: '#7e2413 ridge dark', V: '#cf4a24 vermillion light', v: '#b8371d vermillion',
  }, rows);
}
// festlantern — FESTIVAL LANTERN POST on tropgrass: dark pole,
// crossarm, one round amber paper lantern with vermillion caps.
{
  const bg = [];
  for (let y = 0; y < 16; y++) { let r = '';
    for (let x = 0; x < 16; x++) r += speck(x, y, 6) ? 'b' : (speck(x + 5, y + 2, 9) ? 'c' : (speck(x + 1, y + 7, 13) ? 'd' : 'a'));
    bg.push(r.split('')); }
  const put = (x, y, c) => { bg[y][x] = c; };
  for (let y = 2; y < 15; y++) put(7, y, 'p');                    // pole
  for (let x = 4; x <= 11; x++) put(x, 2, 'p');                  // crossarm
  put(10, 3, 'p');                                               // hanger
  // lantern body x8..12? centred on hanger x10: rows 4..9
  const body = { 4: [9, 10, 11], 5: [8, 9, 10, 11, 12], 6: [8, 9, 10, 11, 12], 7: [8, 9, 10, 11, 12], 8: [9, 10, 11] };
  for (const [y, xs] of Object.entries(body)) for (const x of xs) put(x, +y, 'L');
  put(10, 6, 'G'); put(10, 5, 'G'); put(9, 6, 'G');              // glow heart
  for (const x of [9, 10, 11]) { put(x, 3 + 1, 'L'); }
  for (const x of [9, 10, 11]) put(x, 4, 'L');
  for (const x of [9, 10, 11]) put(x, 3, 'p');
  // caps: row above body is hanger; paint cap rows properly:
  for (const x of [9, 10, 11]) put(x, 4, 'L');
  put(10, 9, 'v'); put(10, 10, 'v');                             // bottom cap + tassel
  for (const x of [9, 10, 11]) put(x, 8, 'L');
  // vermillion top cap row (y=4 becomes cap, body 5..8)
  for (const x of [9, 10, 11]) put(x, 4, 'v');
  for (let x = 5; x <= 9; x++) put(x, 15, 'e');                  // base shadow
  put(6, 14, 'e'); put(7, 14, 'e'); put(8, 14, 'e');
  pix('tile-prop-festlantern.pix', 'festival lantern post — dark pole and crossarm, one round amber paper lantern with vermillion caps, on tropgrass. Plaza shoulders, Sanctum. (NO-SAME-KIT law; WAVE-T64-SANCTUM-PLAN.md \u00a75.)', {
    a: '#5fa064 trop-grass', b: '#4c8b4a trop-grass-dark', c: '#729e66 grass-light', d: '#7fb273 leaf-highlight', e: '#458650 trop-grass-deep',
    p: '#3a2c20 pole dark', L: '#f2b64c lantern amber', G: '#ffd97a lantern glow', v: '#b8371d vermillion cap',
  }, bg.map((r) => r.join('')));
}
// fairbanner — NOBORI BANNER POLE on sand: tall pole, vertical
// vermillion banner with a white wave-crest glyph.
{
  const bg = [];
  for (let y = 0; y < 16; y++) { let r = '';
    for (let x = 0; x < 16; x++) r += speck(x, y, 7) ? 'b' : (speck(x + 2, y + 4, 10) ? 'c' : (speck(x + 6, y + 1, 13) ? 'd' : 'a'));
    bg.push(r.split('')); }
  const put = (x, y, c) => { bg[y][x] = c; };
  for (let y = 1; y < 15; y++) put(3, y, 'p');                   // pole
  for (let x = 3; x <= 10; x++) put(x, 1, 'p');                  // top arm
  for (let y = 2; y <= 12; y++) { for (let x = 5; x <= 10; x++) put(x, y, 'v'); }  // banner field
  for (let y = 2; y <= 12; y++) { put(5, y, 'V'); put(10, y, 'V'); }              // banner edges
  // white wave glyph: two arcs
  const wave = [[7, 4], [8, 4], [6, 5], [9, 5], [7, 6], [8, 6], [7, 8], [8, 8], [6, 9], [9, 9], [7, 10], [8, 10]];
  for (const [x, y] of wave) put(x, y, 'w');
  for (let x = 2; x <= 5; x++) put(x, 15, 'd');                  // base shade
  pix('tile-prop-fairbanner.pix', 'nobori banner pole — tall pole, vertical vermillion banner with a white wave-crest glyph, on sand. The ferry landing, Sanctum. (NO-SAME-KIT law; WAVE-T64-SANCTUM-PLAN.md \u00a75.)', {
    a: '#c6b388 sand', b: '#bdab85 sand-shade', c: '#d4c69c sand-light', d: '#b2a581 sand-pebble',
    p: '#3a2c20 pole dark', v: '#b8371d vermillion', V: '#cf4a24 vermillion light', w: '#f6f1e2 wave white',
  }, bg.map((r) => r.join('')));
}
