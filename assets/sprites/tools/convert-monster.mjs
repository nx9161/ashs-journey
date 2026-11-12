// convert-monster.mjs — Wave G generated-monster conversion pipeline.
// Converts a generated monster design (PNG on a plain near-white ground)
// into a battle sprite in the game's .pix source format:
//   PNG -> edge flood-fill background removal -> optional palette pass
//   -> area-average downscale into the 64x64 battle canvas (1px margin)
//   -> median-cut quantization to <=15 colors -> kit outline discipline
//   (#2a1800 on every edge pixel, char 'O') -> orphan cleanup -> .pix.
// Deterministic: same input + flags -> byte-identical output.
// Zero-dependency (reuses the pipeline's own PNG decoder).
//
// Usage:
//   node assets/sprites/tools/convert-monster.mjs <design.png> <sprite-id>
//        [--out <dir>] [--fit 60] [--colors 15] [--deepen-violet]
//        [--name "Display Name"]
// The .pix lands in <dir>/<sprite-id>.pix (default dir: pix/species).
// Design sources are archived under assets/sprites/designs/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // assets/sprites
const OUTLINE = [0x2a, 0x18, 0x00];
const CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // no 'O' (outline), no '.'

function parseArgs(argv) {
  const [png, id, ...rest] = argv;
  if (!png || !id) {
    console.error('usage: convert-monster.mjs <design.png> <sprite-id> [--out dir] [--fit n] [--colors n] [--deepen-violet] [--name "Name"]');
    process.exit(2);
  }
  const o = { png, id, out: path.join(ROOT, 'pix', 'species'), fit: 60, colors: 15, deepenViolet: false, name: id };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') o.out = rest[++i];
    else if (rest[i] === '--fit') o.fit = +rest[++i];
    else if (rest[i] === '--colors') o.colors = +rest[++i];
    else if (rest[i] === '--deepen-violet') o.deepenViolet = true;
    else if (rest[i] === '--boost-thin') o.boostThin = true;
    else if (rest[i] === '--name') o.name = rest[++i];
    else { console.error('unknown flag: ' + rest[i]); process.exit(2); }
  }
  return o;
}

// ---- palette pass: OMNIGEN contrast (owner-approved: deeper violet,
// defined outline, orbs restored — same design). Applied at full res,
// before downscale, on non-background pixels only. Neutral greys (the
// orb metal) are left alone; lavender/violet body tones deepen.
function deepenViolet(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  const isViolet = b >= r && r >= g && b > 90; // blue-dominant with red over green
  if (!isViolet && sat < 0.04) return [r, g, b]; // orb metal / neutral sparkle core
  if (!isViolet) return [r, g, b];
  // deepen: pull lights toward a saturated violet family
  const f = 0.78;
  return [
    Math.round(70 + (r - 70) * f + 18),
    Math.round(40 + (g - 40) * f),
    Math.round(120 + (b - 120) * f + 26),
  ].map((v) => Math.max(0, Math.min(255, v)));
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const { w, h, rgba } = decodePng(fs.readFileSync(o.png));
  const N = w * h;
  const isBgSrc = (i) => rgba[i * 4] > 242 && rgba[i * 4 + 1] > 242 && rgba[i * 4 + 2] > 242;
  // flood fill background from the edges
  const bg = new Uint8Array(N);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (!bg[i] && isBgSrc(i)) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
  for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
  }
  // working RGBA with bg -> alpha 0 (+ optional palette pass)
  const src = new Float32Array(N * 4);
  let minx = w, miny = h, maxx = -1, maxy = -1;
  for (let i = 0; i < N; i++) {
    if (bg[i]) continue;
    let r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    if (o.deepenViolet) [r, g, b] = deepenViolet(r, g, b);
    src[i * 4] = r; src[i * 4 + 1] = g; src[i * 4 + 2] = b; src[i * 4 + 3] = 255;
    const x = i % w, y = (i / w) | 0;
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  if (maxx < 0) { console.error('convert-monster: nothing but background in ' + o.png); process.exit(1); }
  const bw = maxx - minx + 1, bh = maxy - miny + 1;
  const scale = Math.min(o.fit / bw, o.fit / bh);
  const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
  // --boost-thin: thin dark/saturated structures (OMNIGEN's orb ring)
  // vanish under area averaging. Build a 1px-dilated "ink" mask; cell
  // alpha becomes max(area alpha, ink coverage), so thin lines survive
  // at reduced strength instead of dropping below the threshold.
  let ink = null;
  if (o.boostThin) {
    ink = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (bg[i]) continue;
      const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn > 22 || mx < 205) ink[i] = 1;
    }
    const dil = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!ink[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) dil[ny * w + nx] = 1;
      }
    }
    ink = dil;
  }
  // area-average downscale (alpha-weighted)
  const small = new Float32Array(tw * th * 4);
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const x0 = minx + (tx / tw) * bw, x1 = minx + ((tx + 1) / tw) * bw;
      const y0 = miny + (ty / th) * bh, y1 = miny + ((ty + 1) / th) * bh;
      let rS = 0, gS = 0, bS = 0, aS = 0, inkS = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0);
          const wy = Math.min(y + 1, y1) - Math.max(y, y0);
          if (wx <= 0 || wy <= 0) continue;
          const i = y * w + x, a = src[i * 4 + 3] / 255;
          const wt = wx * wy * a;
          rS += src[i * 4] * wt; gS += src[i * 4 + 1] * wt; bS += src[i * 4 + 2] * wt; aS += wt;
          if (ink && ink[i]) inkS += wx * wy;
        }
      }
      const j = (ty * tw + tx) * 4;
      if (aS > 0) { small[j] = rS / aS; small[j + 1] = gS / aS; small[j + 2] = bS / aS; }
      small[j + 3] = aS / ((x1 - x0) * (y1 - y0)) * 255;
      if (ink) {
        const inkCov = inkS / ((x1 - x0) * (y1 - y0)) * 255;
        if (inkCov > small[j + 3]) {
          // color for ink-only cells: reuse the cell's averaged color if
          // any, else a deep violet-grey (ring metal shadow).
          if (aS === 0) { small[j] = 96; small[j + 1] = 88; small[j + 2] = 128; }
          small[j + 3] = inkCov;
        }
      }
    }
  }
  // alpha threshold -> opaque mask + colors
  const opaque = new Uint8Array(tw * th);
  const pixels = [];
  for (let i = 0; i < tw * th; i++) {
    if (small[i * 4 + 3] > 110) {
      opaque[i] = 1;
      pixels.push([Math.round(small[i * 4]), Math.round(small[i * 4 + 1]), Math.round(small[i * 4 + 2])]);
    }
  }
  // orphan cleanup (8-neighbor singletons, iterated) — build-art rejects them
  const at = (x, y) => (x < 0 || y < 0 || x >= tw || y >= th) ? 0 : opaque[y * tw + x];
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      if (!at(x, y)) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && at(x + dx, y + dy)) n++;
      if (n === 0) { opaque[y * tw + x] = 0; changed = true; }
    }
  }
  const kept = [];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    if (opaque[y * tw + x]) { const i = (y * tw + x) * 4; kept.push([Math.round(small[i]), Math.round(small[i + 1]), Math.round(small[i + 2])]); }
  }
  // ---- median-cut quantization (deterministic) ----
  function quantize(pts, maxColors) {
    if (!pts.length) return [];
    let boxes = [pts];
    while (boxes.length < maxColors) {
      // pick the box with the largest channel range (ties: first)
      let bi = -1, brange = -1, bchan = 0;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (b.length < 2) continue;
        for (let c = 0; c < 3; c++) {
          let mn = 255, mx = 0;
          for (const p of b) { if (p[c] < mn) mn = p[c]; if (p[c] > mx) mx = p[c]; }
          if (mx - mn > brange) { brange = mx - mn; bi = i; bchan = c; }
        }
      }
      if (bi < 0 || brange === 0) break;
      const box = boxes.splice(bi, 1)[0];
      box.sort((a, b2) => a[bchan] - b2[bchan] || a[0] - b2[0] || a[1] - b2[1] || a[2] - b2[2]);
      const mid = box.length >> 1;
      boxes.push(box.slice(0, mid), box.slice(mid));
    }
    return boxes.map((b) => {
      let r = 0, g = 0, bl = 0;
      for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
      return [Math.round(r / b.length), Math.round(g / b.length), Math.round(bl / b.length)];
    });
  }
  const palette = quantize(kept, o.colors);
  const nearest = (r, g, b) => {
    let best = 0, bd = 1e9;
    for (let i = 0; i < palette.length; i++) {
      const d = (palette[i][0] - r) ** 2 + (palette[i][1] - g) ** 2 + (palette[i][2] - b) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  // compose the 64x64 canvas: centered horizontally, grounded (bottom
  // row 62; frame rows 0/63 and cols 0/63 stay clear per the .pix
  // inner-margin rule for the species family).
  const W2 = 64, H2 = 64;
  const grid = new Int16Array(W2 * H2).fill(-1); // palette idx or -2 outline
  const ox = ((W2 - tw) >> 1), oy = 63 - th;
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    if (!opaque[y * tw + x]) continue;
    const i = (y * tw + x) * 4;
    grid[(oy + y) * W2 + (ox + x)] = nearest(Math.round(small[i]), Math.round(small[i + 1]), Math.round(small[i + 2]));
  }
  // outline discipline: every painted pixel 4-adjacent to transparency
  // becomes the kit outline color (char 'O').
  const gat = (x, y) => (x < 0 || y < 0 || x >= W2 || y >= H2) ? -1 : grid[y * W2 + x];
  const isClear = (x, y) => gat(x, y) === -1; // only true transparency; -2 (outline) is painted
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    if (gat(x, y) < 0) continue;
    if (isClear(x + 1, y) || isClear(x - 1, y) || isClear(x, y + 1) || isClear(x, y - 1)) grid[y * W2 + x] = -2;
  }
  // emit .pix
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const rows = [];
  for (let y = 0; y < H2; y++) {
    let row = '';
    for (let x = 0; x < W2; x++) {
      const v = grid[y * W2 + x];
      row += v === -1 ? '.' : v === -2 ? 'O' : CHARS[v];
    }
    rows.push(row);
  }
  const palLines = [`O ${hex(OUTLINE)} kit outline`];
  palette.forEach((c, i) => palLines.push(`${CHARS[i]} ${hex(c)}`));
  const text = `# ${o.id} battle sprite, 64x64. Wave G: generated original design,\n# converted by assets/sprites/tools/convert-monster.mjs from\n# assets/sprites/designs/${path.basename(o.png)} (deterministic).\nPIX ${o.id} 64 64\n${rows.join('\n')}\nPAL\n${palLines.join('\n')}\n`;
  fs.mkdirSync(o.out, { recursive: true });
  const dest = path.join(o.out, o.id + '.pix');
  fs.writeFileSync(dest, text);
  const used = new Set(rows.join('').replace(/\./g, '').split('')).size;
  console.log(`convert-monster: ${o.id} <- ${path.basename(o.png)}  ${tw}x${th} sprite, ${palette.length + 1} colors (incl. outline), ${kept.length} painted px -> ${dest}`);
}

main();
