// repair-battle-art.mjs — Wave J B2-G10 repair pipeline (v3).
// Re-converts a locked Wave G design source into a battle sprite
// with the settings B2-G10 demands, fixing the failure classes the
// Tranche 0 audit measured, without touching the design:
//   (1) STRATA — body luminances are pulled toward three tercile
//       band centers before quantization, on an escalating schedule
//       (pull/separation 0.55/0.11 -> 0.70/0.13 -> 0.85/0.15); the
//       first attempt whose palette carries >= 3 body value steps
//       (the audit's own measure) wins.
//   (2) LIGHT GRADIENT (last resort) — genuinely two-tone source
//       art (measured: SKREEP is two flat indigos at luminance
//       0.21/0.31; no rank trick manufactures a third step without
//       checkerboarding) receives a soft top-light gradient
//       (+10% -> -10% by row) before quantization: a render
//       treatment, same silhouette/hues/markings, light added the
//       way sprite shading is normally done.
//   (3) PAIR CONSISTENCY — a back converted with --palette-from
//       <front.pix> first tries the front's palette verbatim
//       (strict); only if the back cannot reach 3 value steps on it
//       (measured: GUSTPLUME/SCURRAT backs — the front palette's
//       own luminance distribution caps them) does it fall back to
//       a UNION palette (front colors + the back's own shades,
//       near-duplicates removed, 15-color cap, 2% distance bias to
//       front colors). Every candidate is scored with the audit's
//       pair Jaccard; a passing candidate needs steps >= 3 AND
//       pair J >= 0.55 (margin over the 0.5 gate).
//   (4) SPECK STRIP — after outlining, any 8-connected painted
//       component under 9 px that is not the main body is deleted.
//       Painted includes outline cells (-2): v1 tested >= 0 and
//       left hollow outline shells behind (measured on VOLTIK).
// Front-end (flood-fill removal, area-average downscale, orphan
// cleanup, median cut, kit outline) is the Wave G converter's, kept
// behavior-identical. Deterministic: fixed candidate order and
// schedules, no randomness — same input + flags, byte-identical out.
//
// Usage:
//   node assets/sprites/tools/repair-battle-art.mjs <design.png> <sprite-id>
//        [--out <dir>] [--fit 60] [--colors 15]
//        [--palette-from <front.pix>] [--name "Display Name"]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';
import { parsePix } from './pix.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // assets/sprites
const OUTLINE = [0x2a, 0x18, 0x00];
const CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const STRATA_SCHEDULE = [
  { pull: 0.55, sep: 0.11, auto: true },
  { pull: 0.70, sep: 0.13, auto: false },
  { pull: 0.85, sep: 0.15, auto: false },
];

function parseArgs(argv) {
  const [png, id, ...rest] = argv;
  if (!png || !id) { console.error('usage: repair-battle-art.mjs <design.png> <sprite-id> [flags]'); process.exit(2); }
  const o = { png, id, out: path.join(ROOT, 'pix', 'species'), fit: 60, colors: 15, paletteFrom: null, name: id };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') o.out = rest[++i];
    else if (rest[i] === '--fit') o.fit = +rest[++i];
    else if (rest[i] === '--colors') o.colors = +rest[++i];
    else if (rest[i] === '--palette-from') o.paletteFrom = rest[++i];
    else if (rest[i] === '--name') o.name = rest[++i];
    else { console.error('unknown flag: ' + rest[i]); process.exit(2); }
  }
  return o;
}

const lum255 = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function strataPass(small, tw, th, pull, sep, auto) {
  const work = new Float32Array(small);
  const idx = [];
  const lums = [];
  for (let i = 0; i < tw * th; i++) {
    if (work[i * 4 + 3] <= 110) continue;
    const r = work[i * 4], g = work[i * 4 + 1], b = work[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx === 0 || (mx - mn) / mx < 0.08) continue;
    idx.push(i); lums.push(lum255(r, g, b));
  }
  if (lums.length < 30) return { small: work, note: 'skipped (too few chromatic px)' };
  const sorted = [...lums].sort((a, b) => a - b);
  const q = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  const iqr = q(0.75) - q(0.25);
  if (auto && iqr >= 0.28) return { small: work, note: `skipped (IQR ${iqr.toFixed(2)} already deep)` };
  const centers = [q(0.2), q(0.5), q(0.8)];
  centers[0] = Math.min(centers[0], centers[1] - sep);
  centers[2] = Math.max(centers[2], centers[1] + sep);
  const t1 = (centers[0] + centers[1]) / 2, t2 = (centers[1] + centers[2]) / 2;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k], L = lums[k];
    const band = L < t1 ? centers[0] : L > t2 ? centers[2] : centers[1];
    const target = L + (band - L) * pull;
    const f = L > 0.01 ? target / L : 1;
    for (let c = 0; c < 3; c++) work[i * 4 + c] = Math.max(0, Math.min(255, work[i * 4 + c] * f));
  }
  return { small: work, note: `pull ${pull} sep ${sep} (IQR ${iqr.toFixed(2)})` };
}

function gradientPass(small, tw, th, strength) {
  const work = new Float32Array(small);
  for (let y = 0; y < th; y++) {
    const f = 1 + strength * (1 - (2 * y) / Math.max(1, th - 1));
    for (let x = 0; x < tw; x++) {
      const i = (y * tw + x) * 4;
      if (work[i + 3] <= 110) continue;
      for (let c = 0; c < 3; c++) work[i + c] = Math.max(0, Math.min(255, work[i + c] * f));
    }
  }
  return work;
}

function quantizeMedianCut(pts, maxColors) {
  if (!pts.length) return [];
  let boxes = [pts];
  while (boxes.length < maxColors) {
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

const binOf = (c) => [c[0] >> 6, c[1] >> 6, c[2] >> 6];
const binKey = (c) => binOf(c).join(',');

// Steps measure identical to scripts/audit-battle-art.mjs rule (4).
function bodySteps(palette, grid) {
  const counts = new Map();
  let body = 0;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v < 0) continue;
    counts.set(v, (counts.get(v) || 0) + 1); body++;
  }
  if (!body) return 0;
  return new Set([...counts.entries()]
    .filter(([, n]) => n / body >= 0.02)
    .map(([pi]) => Math.round(lum255(...palette[pi]) / 0.07))).size;
}

// Pair Jaccard identical to the audit: bins present at >=1.5% of mass.
function massBins(palette, grid) {
  const counts = new Map();
  let total = 0;
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    if (v < 0) continue;
    const k = binKey(palette[v]);
    counts.set(k, (counts.get(k) || 0) + 1); total++;
  }
  return new Set([...counts.entries()].filter(([, n]) => n / total >= 0.015).map(([k]) => k));
}

function buildAttempt(small, tw, th, opaque, palette, bias) {
  const W2 = 64, H2 = 64;
  const grid = new Int16Array(W2 * H2).fill(-1);
  const ox = ((W2 - tw) >> 1), oy = 63 - th;
  const nearest = (r, g, b) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const d = ((palette[i][0] - r) ** 2 + (palette[i][1] - g) ** 2 + (palette[i][2] - b) ** 2) * (bias ? bias[i] : 1);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
    if (!opaque[y * tw + x]) continue;
    const i = (y * tw + x) * 4;
    grid[(oy + y) * W2 + (ox + x)] = nearest(Math.round(small[i]), Math.round(small[i + 1]), Math.round(small[i + 2]));
  }
  const gat = (x, y) => (x < 0 || y < 0 || x >= W2 || y >= H2) ? -1 : grid[y * W2 + x];
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    if (gat(x, y) < 0) continue;
    if (gat(x + 1, y) === -1 || gat(x - 1, y) === -1 || gat(x, y + 1) === -1 || gat(x, y - 1) === -1) grid[y * W2 + x] = -2;
  }
  // SPECK STRIP: painted includes outline (-2) — see header note.
  const seen = new Uint8Array(W2 * H2);
  const comps = [];
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    if (gat(x, y) === -1 || seen[y * W2 + x]) continue;
    const cells = []; const st = [[x, y]]; seen[y * W2 + x] = 1;
    while (st.length) {
      const [cx, cy] = st.pop(); cells.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (gat(nx, ny) !== -1 && !seen[ny * W2 + nx]) { seen[ny * W2 + nx] = 1; st.push([nx, ny]); }
      }
    }
    comps.push(cells);
  }
  comps.sort((a, b) => b.length - a.length);
  let stripped = 0;
  for (let i = 1; i < comps.length; i++) {
    if (comps[i].length < 9) { for (const [x, y] of comps[i]) grid[y * W2 + x] = -1; stripped += comps[i].length; }
  }
  return { grid, stripped, steps: bodySteps(palette, grid) };
}

function frontEnd(o) {
  const { w, h, rgba } = decodePng(fs.readFileSync(o.png));
  const N = w * h;
  const isBgSrc = (i) => rgba[i * 4] > 242 && rgba[i * 4 + 1] > 242 && rgba[i * 4 + 2] > 242;
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
  const src = new Float32Array(N * 4);
  let minx = w, miny = h, maxx = -1, maxy = -1;
  for (let i = 0; i < N; i++) {
    if (bg[i]) continue;
    src[i * 4] = rgba[i * 4]; src[i * 4 + 1] = rgba[i * 4 + 1]; src[i * 4 + 2] = rgba[i * 4 + 2]; src[i * 4 + 3] = 255;
    const x = i % w, y = (i / w) | 0;
    if (x < minx) minx = x; if (x > maxx) maxx = x;
    if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  if (maxx < 0) { console.error('repair-battle-art: nothing but background in ' + o.png); process.exit(1); }
  const bw = maxx - minx + 1, bh = maxy - miny + 1;
  const scale = Math.min(o.fit / bw, o.fit / bh);
  const tw = Math.max(1, Math.round(bw * scale)), th = Math.max(1, Math.round(bh * scale));
  const small = new Float32Array(tw * th * 4);
  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const x0 = minx + (tx / tw) * bw, x1 = minx + ((tx + 1) / tw) * bw;
      const y0 = miny + (ty / th) * bh, y1 = miny + ((ty + 1) / th) * bh;
      let rS = 0, gS = 0, bS = 0, aS = 0;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
        for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
          const wx = Math.min(x + 1, x1) - Math.max(x, x0);
          const wy = Math.min(y + 1, y1) - Math.max(y, y0);
          if (wx <= 0 || wy <= 0) continue;
          const i = y * w + x, a = src[i * 4 + 3] / 255;
          const wt = wx * wy * a;
          rS += src[i * 4] * wt; gS += src[i * 4 + 1] * wt; bS += src[i * 4 + 2] * wt; aS += wt;
        }
      }
      const j = (ty * tw + tx) * 4;
      if (aS > 0) { small[j] = rS / aS; small[j + 1] = gS / aS; small[j + 2] = bS / aS; }
      small[j + 3] = aS / ((x1 - x0) * (y1 - y0)) * 255;
    }
  }
  const opaque = new Uint8Array(tw * th);
  for (let i = 0; i < tw * th; i++) if (small[i * 4 + 3] > 110) opaque[i] = 1;
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
  return { small, tw, th, opaque };
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const { small, tw, th, opaque } = frontEnd(o);
  const keptOf = (sm) => {
    const kept = [];
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
      if (opaque[y * tw + x]) { const i = (y * tw + x) * 4; kept.push([Math.round(sm[i]), Math.round(sm[i + 1]), Math.round(sm[i + 2])]); }
    }
    return kept;
  };
  let frontPalette = null, frontBins = null;
  if (o.paletteFrom) {
    const front = parsePix(fs.readFileSync(o.paletteFrom, 'utf8'), o.paletteFrom);
    frontPalette = Object.entries(front.pal).filter(([ch]) => ch !== 'O').map(([, v]) => {
      const hex = v.hex;
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    });
    const fgrid = front.rows.flatMap((row) => [...row].map((ch) => ch === '.' ? -1 : ch === 'O' ? -2 : Object.keys(front.pal).filter((k) => k !== 'O').indexOf(ch)));
    const fpalOrdered = Object.entries(front.pal).filter(([ch]) => ch !== 'O').map(([, v]) => [parseInt(v.hex.slice(1, 3), 16), parseInt(v.hex.slice(3, 5), 16), parseInt(v.hex.slice(5, 7), 16)]);
    frontBins = massBins(fpalOrdered, fgrid);
  }
  const pairJ = (palette, grid) => {
    if (!frontBins) return null;
    const bb = massBins(palette, grid);
    const inter = [...bb].filter((k) => frontBins.has(k)).length;
    const union = new Set([...bb, ...frontBins]).size;
    return union ? inter / union : 0;
  };
  // Candidate pipeline variants, in preference order.
  const colorVariants = [];
  for (const s of STRATA_SCHEDULE) colorVariants.push({ kind: 'strata', ...s });
  colorVariants.push({ kind: 'strata+gradient', ...STRATA_SCHEDULE[2], grad: 0.10 });
  const paletteModes = frontPalette ? ['strict', 'union'] : ['own'];

  let best = null, bestPass = null;
  outer:
  for (const pm of paletteModes) {
    for (const cv of colorVariants) {
      let sm = strataPass(small, tw, th, cv.pull, cv.sep, cv.auto).small;
      if (cv.grad) sm = gradientPass(sm, tw, th, cv.grad);
      let palette, bias = null;
      if (pm === 'own') {
        palette = quantizeMedianCut(keptOf(sm), o.colors);
      } else if (pm === 'strict') {
        palette = frontPalette;
      } else {
        const own = quantizeMedianCut(keptOf(sm), o.colors);
        palette = [...frontPalette];
        bias = frontPalette.map(() => 0.98);
        for (const c of own) {
          if (palette.length >= o.colors) break;
          const dup = palette.some((p) => Math.max(Math.abs(p[0] - c[0]), Math.abs(p[1] - c[1]), Math.abs(p[2] - c[2])) <= 10);
          if (!dup) { palette.push(c); bias.push(1); }
        }
      }
      const res = buildAttempt(sm, tw, th, opaque, palette, bias);
      const pj = pairJ(palette, res.grid);
      const cand = { ...res, palette, pj, note: `${cv.kind} pull ${cv.pull}${cv.grad ? ' + gradient' : ''} / palette ${pm}` };
      const passes = res.steps >= 3 && (pj === null || pj >= 0.55);
      if (passes) { bestPass = cand; break outer; }
      const score = (c) => (c.steps >= 3 ? 10 : c.steps) + (c.pj === null ? 1 : c.pj);
      if (!best || score(cand) > score(best)) best = cand;
    }
  }
  const chosen = bestPass || best;
  const { grid, palette } = chosen;
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  const rows = [];
  for (let y = 0; y < 64; y++) {
    let row = '';
    for (let x = 0; x < 64; x++) {
      const v = grid[y * 64 + x];
      row += v === -1 ? '.' : v === -2 ? 'O' : CHARS[v];
    }
    rows.push(row);
  }
  const palLines = [`O ${hex(OUTLINE)} kit outline`];
  palette.forEach((c, i) => palLines.push(`${CHARS[i]} ${hex(c)}`));
  const text = `# ${o.id} battle sprite, 64x64. Wave J B2-G10 repair: re-converted by\n# assets/sprites/tools/repair-battle-art.mjs from the locked Wave G design\n# assets/sprites/designs/${path.basename(o.png)} (deterministic; ${chosen.note}; body steps ${chosen.steps}${chosen.pj !== null ? `; pair J ${chosen.pj.toFixed(2)}` : ''}).\nPIX ${o.id} 64 64\n${rows.join('\n')}\nPAL\n${palLines.join('\n')}\n`;
  fs.mkdirSync(o.out, { recursive: true });
  const dest = path.join(o.out, o.id + '.pix');
  fs.writeFileSync(dest, text);
  console.log(`repair-battle-art: ${o.id} <- ${path.basename(o.png)}  ${tw}x${th}, ${palette.length + 1} colors, steps ${chosen.steps}${chosen.pj !== null ? `, pairJ ${chosen.pj.toFixed(2)}` : ''}, stripped ${chosen.stripped}px [${chosen.note}] -> ${dest}`);
  if (!bestPass) console.log(`  ** ESCALATE: ${o.id} no candidate reached steps>=3${frontPalette ? ' with pairJ>=0.55' : ''} — design-touch queue`);
}

main();
