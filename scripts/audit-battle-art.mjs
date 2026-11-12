// audit-battle-art.mjs — Wave J Tranche 0 instrument (B2-G10).
// Grades every converted Kanto battle front+back pair against the
// B2-G10 battle sprite standard and runs the uniqueness gate over
// the whole converted roster. REPORTING tool: it never edits art.
// Usage:
//   node scripts/audit-battle-art.mjs [--json <path>] [--md <path>]
//        [--sheet <path>] [--flagged-sheet <path>]
// Exit 0 always in audit mode; the summary line is the contract.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix, outlineOk, orphanCount } from '../assets/sprites/tools/pix.mjs';
import { rasterize, encodePng } from '../assets/sprites/tools/png.mjs';
import { NAME_REGISTRY } from '../src/data/name-registry.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

// ---------- roster ----------
// Kanto scope = every registry species entry except the two non-Kanto
// pilot slots (milotic, torterra). 149 records: 148 front/back pairs in
// pix/species + the partner pair in pix/partner. Owner-reserved slots
// (eevee line, articuno, moltres) are NOT in the registry and NOT
// graded — still franchise art awaiting the owner's picture-first call.
const NON_KANTO = new Set(['milotic', 'torterra']);
const REG = NAME_REGISTRY.species;
const IDS = Object.keys(REG).filter((id) => !NON_KANTO.has(id));

const dexOf = {};
for (const mod of ['species', 'species2', 'species3', 'species4', 'species5']) {
  try {
    const m = await import(`../src/data/${mod}.mjs`);
    for (const key of Object.keys(m)) {
      const t = m[key];
      if (t && typeof t === 'object' && !Array.isArray(t)) {
        for (const [id, rec] of Object.entries(t)) if (rec && rec.dexNo) dexOf[id] = rec.dexNo;
      }
    }
  } catch { /* module absent — ordering falls back */ }
}
const FORM_BASE = { pinkbutterfree: 'butterfree', crystalonix: 'onix', giantdragonite: 'dragonite' };
for (const [f, b] of Object.entries(FORM_BASE)) if (dexOf[b]) dexOf[f] = dexOf[b];
if (!dexOf.partner) dexOf.partner = 25;

// ---------- screen-time queue ----------
// Tiers (charter): T0 partner, T1 starter lines, T2 early-route
// commons, T3 gym-ace lines, T4 legendaries + headline pilot,
// T5 the rest by dex. Lines move together at their best member's tier.
const LINES = NAME_REGISTRY.lines;
const lineOf = {};
for (const [key, members] of Object.entries(LINES)) for (const id of members) lineOf[id] = key;
const SINGLES = { onix: 'straton', zapdos: 'fulminis', mewtwo: 'omnigen', mew: 'primara', zubat: 'skreep', golbat: 'skreep' };
for (const [id, key] of Object.entries(SINGLES)) if (!lineOf[id]) lineOf[id] = key;
const TIER_OF_LINE = {
  voltik: 0,
  buddin: 1, embry: 1, bublet: 1,
  dunplume: 2, scurrat: 2, keenbeak: 2, fronlet: 2, thornib: 2,
  toxikit: 2, toxibuck: 2, viplet: 2, armadune: 2, skreep: 2,
  nightbud: 2, pitchlet: 2, moling: 2, tinkletom: 2, tadlet: 2,
  napseer: 2, muscling: 2, rumbling: 2,
  straton: 3, astlet: 3, fumorb: 3, cinderpup: 3, platlet: 3,
  fulminis: 4, omnigen: 4, primara: 4, vulcanis: 4,
};
function tierOf(id) {
  if (id === 'partner') return 0;
  const key = lineOf[id];
  return key && TIER_OF_LINE[key] !== undefined ? TIER_OF_LINE[key] : 5;
}
function queueSort(a, b) {
  const ta = tierOf(a), tb = tierOf(b);
  if (ta !== tb) return ta - tb;
  if (a === 'partner') return -1; if (b === 'partner') return 1;
  const la = lineOf[a] || a, lb = lineOf[b] || b;
  const da = Math.min(...(LINES[la] || [a]).map((x) => dexOf[x] || 999));
  const db = Math.min(...(LINES[lb] || [b]).map((x) => dexOf[x] || 999));
  if (da !== db) return da - db;
  const sa = (dexOf[a] || 999) + (FORM_BASE[a] ? 0.5 : 0);
  const sb = (dexOf[b] || 999) + (FORM_BASE[b] ? 0.5 : 0);
  return sa - sb;
}
const QUEUE = [...IDS].sort(queueSort);

// ---------- sprite metrics ----------
const hexRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
function hueSat(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const sat = mx === 0 ? 0 : d / mx;
  let hue = 0;
  if (d) {
    if (mx === r) hue = ((g - b) / d) % 6;
    else if (mx === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60; if (hue < 0) hue += 360;
  }
  return { hue, sat };
}
function analyze(s) {
  const { w, h, rows, pal } = s;
  const grid = new Uint8Array(w * h);
  const counts = new Map(); // hex -> px
  let mass = 0, minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    grid[y * w + x] = 1; mass++;
    const hex = pal[ch].hex;
    counts.set(hex, (counts.get(hex) || 0) + 1);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : grid[y * w + x];
  // thin/wisp fraction: opaque px with <=1 opaque 4-neighbour
  let thin = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y)) continue;
    const n = at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1);
    if (n <= 1) thin++;
  }
  // components (8-connected: pixel art joins features diagonally —
  // tails, whiskers, flame tips. 4-connectivity shatters every diagonal
  // stroke into false "specks"; the repo's own orphan rule is 8-based.)
  const seen = new Uint8Array(w * h); const compSizes = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y) || seen[y * w + x]) continue;
    let size = 0; const stack = [[x, y]]; seen[y * w + x] = 1;
    while (stack.length) {
      const [cx, cy] = stack.pop(); size++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (at(nx, ny) && !seen[ny * w + nx]) { seen[ny * w + nx] = 1; stack.push([nx, ny]); }
      }
    }
    compSizes.push(size);
  }
  compSizes.sort((a, b) => b - a);
  const detached = Math.max(0, compSizes.length - 1);
  const specks = compSizes.slice(1).filter((sz) => sz < 9).length;
  // value steps on the body mass: distinct luminance buckets across
  // ALL non-outline body colors at >=2% of body pixels. (First pass
  // restricted steps to the dominant hue family; that misfires on
  // marked designs — LANCEWASP's yellow/black body carries its value
  // structure ACROSS hues, in stripes. B2-G10 amended to match: the
  // body mass, not one hue family, is the shading surface.)
  const outlineHex = pal.O ? pal.O.hex : null;
  const bodyCounts = new Map([...counts].filter(([hex]) => hex !== outlineHex));
  const bodyPx = [...bodyCounts.values()].reduce((a, b) => a + b, 0) || 1;
  let steps = 0;
  if (bodyCounts.size) {
    const buckets = new Set([...bodyCounts.entries()]
      .filter(([, n]) => n / bodyPx >= 0.02)
      .map(([hex]) => {
        const [r, g, b] = hexRgb(hex);
        return Math.round(((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) / 0.07);
      }));
    steps = buckets.size;
  }
  // silhouette signature: aspect-preserving fit into 16x16, a cell is
  // occupied when >=35% of its source area is opaque. (Any-hit over the
  // raw bbox saturates: every blob normalizes to the same full square
  // and the gate flags everything — measured, 742 false flags.)
  const sig = new Uint8Array(256);
  if (mass) {
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const scale = Math.min(16 / bw, 16 / bh);
    const ox = (16 - bw * scale) / 2, oy = (16 - bh * scale) / 2;
    const hits = new Float32Array(256), area = new Float32Array(256);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const tx = Math.min(15, Math.floor(ox + x * scale)), ty = Math.min(15, Math.floor(oy + y * scale));
      area[ty * 16 + tx] += scale * scale;
      if (at(minX + x, minY + y)) hits[ty * 16 + tx] += scale * scale;
    }
    for (let i = 0; i < 256; i++) sig[i] = area[i] > 0 && hits[i] / area[i] >= 0.35 ? 1 : 0;
  }
  // quantized palette bins (2 bits/channel), present at >=1.5% of mass
  const bins = new Set();
  for (const [hex, n] of counts) {
    if (n / mass < 0.015) continue;
    const [r, g, b] = hexRgb(hex);
    bins.add((r >> 6) * 16 + (g >> 6) * 4 + (b >> 6));
  }
  // ribbon share (Wave J2): the fraction of opaque rows whose opaque
  // count is <=5 px. The mass/wisp measures are blind to the sliver
  // class — a creature carried on a 2px-wide ribbon (measured:
  // VIGILET, 0.41/0.38) has healthy mass, ~0 thin fraction (ribbon
  // pixels keep 2 vertical neighbours), and a normalized silhouette.
  // Roster calibration: next-highest view is LANCEWASP 0.31 (wasp
  // waist + stinger, reads fine); the 0.31-0.38 band is empty, the
  // FAIL line sits mid-band at 0.35.
  let opaqueRows = 0, ribbonRows = 0;
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (at(x, y)) n++;
    if (n > 0) { opaqueRows++; if (n <= 5) ribbonRows++; }
  }
  const oc = outlineOk(s);
  return {
    mass, thinFrac: mass ? thin / mass : 1, detached, specks,
    ribbonFrac: opaqueRows ? ribbonRows / opaqueRows : 0,
    colors: counts.size, steps, outlineOk: oc.ok, outlineBad: oc.bad || 0,
    orphans: orphanCount(s), sig, bins,
    colorSet: new Set([...counts.keys()].filter((hex) => hex !== outlineHex)),
    bbox: [minX, minY, maxX, maxY],
  };
}
const iou = (a, b) => {
  let inter = 0, uni = 0;
  for (let i = 0; i < 256; i++) { if (a[i] & b[i]) inter++; if (a[i] | b[i]) uni++; }
  return uni ? inter / uni : 0;
};
const jaccard = (a, b) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return (a.size + b.size - inter) ? inter / (a.size + b.size - inter) : 0;
};

// ---------- run the audit ----------
function loadPair(id) {
  const dir = id === 'partner' ? 'assets/sprites/pix/partner' : 'assets/sprites/pix/species';
  const base = id === 'partner' ? 'partner' : id;
  const f = parsePix(fs.readFileSync(path.join(ROOT, dir, `${base}-front.pix`), 'utf8'), `${base}-front`);
  const b = parsePix(fs.readFileSync(path.join(ROOT, dir, `${base}-back.pix`), 'utf8'), `${base}-back`);
  return { front: f, back: b };
}
const records = [];
for (const id of QUEUE) {
  const { front, back } = loadPair(id);
  const F = analyze(front), B = analyze(back);
  // Pair consistency is measured on quantized palette bins, NOT exact
  // hexes: front and back are median-cut independently, so the same
  // family lands 1-2 units apart (#eda245 vs #eda244) and exact-hex
  // Jaccard reads ~0.00 for genuinely consistent pairs (measured).
  const pairJac = jaccard(F.bins, B.bins);
  const reasons = [];
  const check = (view, A) => {
    if (A.mass < 400) reasons.push(`${view} mass ${A.mass} < 400`);
    if (A.thinFrac > 0.35) reasons.push(`${view} wisp ${(A.thinFrac * 100).toFixed(0)}% > 35%`);
    if (A.ribbonFrac > 0.35) reasons.push(`${view} ribbon share ${A.ribbonFrac.toFixed(2)} > 0.35 (presence carried on <=5px rows)`);
    if (A.specks > 0) reasons.push(`${view} ${A.specks} speck component(s) < 9px`);
    if (A.detached > 4) reasons.push(`${view} ${A.detached} detached components > 4`);
    if (!A.outlineOk) reasons.push(`${view} outline breaks (${A.outlineBad}px)`);
    if (A.orphans > 0) reasons.push(`${view} ${A.orphans} orphan px`);
    if (A.steps < 3) reasons.push(`${view} value steps ${A.steps} < 3`);
    if (A.colors < 5) reasons.push(`${view} colors ${A.colors} < 5`);
  };
  check('front', F); check('back', B);
  if (pairJac < 0.5) reasons.push(`pair palette Jaccard ${pairJac.toFixed(2)} < 0.5`);
  let grade = reasons.length ? 'FAIL' : 'PASS';
  if (grade === 'PASS') {
    const watch = [];
    if (F.mass < 600 || B.mass < 600) watch.push('mass < 600');
    if (F.thinFrac > 0.25 || B.thinFrac > 0.25) watch.push('wisp > 25%');
    if (F.colors <= 6 || B.colors <= 6) watch.push('colors <= 6');
    if (pairJac < 0.6) watch.push('pair Jaccard < 0.6');
    if (watch.length) { grade = 'WATCH'; reasons.push(...watch.map((x) => 'watch: ' + x)); }
  }
  const design = REG[id].design;
  const designOk = design && fs.existsSync(path.join(ROOT, 'assets/sprites/designs', `${design}.png`)) && fs.existsSync(path.join(ROOT, 'assets/sprites/designs', `${design}-back.png`));
  records.push({
    id, name: REG[id].name, dex: dexOf[id] || null, tier: tierOf(id),
    queue: records.length + 1, grade, reasons, pairJac: +pairJac.toFixed(3),
    design, designOk: !!designOk,
    front: { mass: F.mass, thin: +F.thinFrac.toFixed(3), colors: F.colors, steps: F.steps, detached: F.detached, specks: F.specks, ribbon: +F.ribbonFrac.toFixed(3) },
    back: { mass: B.mass, thin: +B.thinFrac.toFixed(3), colors: B.colors, steps: B.steps, detached: B.detached, specks: B.specks, ribbon: +B.ribbonFrac.toFixed(3) },
    _F: F, _B: B, _front: front, _back: back,
  });
}
// uniqueness gate (fronts and backs separately; a pair flags if either does)
const EXEMPT = new Set(['partner|pikachu', 'butterfree|pinkbutterfree', 'crystalonix|onix', 'dragonite|giantdragonite']);
const pairKey = (a, b) => [a, b].sort().join('|');
const flags = [];
for (let i = 0; i < records.length; i++) for (let j = i + 1; j < records.length; j++) {
  const A = records[i], B = records[j];
  for (const view of ['front', 'back']) {
    const X = view === 'front' ? A._F : A._B, Y = view === 'front' ? B._F : B._B;
    const s = iou(X.sig, Y.sig), p = jaccard(X.bins, Y.bins);
    const twin = s >= 0.72 && p >= 0.45, shared = s >= 0.85;
    if (twin || shared) {
      flags.push({
        a: A.id, b: B.id, view, silhouette: +s.toFixed(3), palette: +p.toFixed(3),
        kind: shared ? 'shared-body' : 'palette-twin',
        exempt: EXEMPT.has(pairKey(A.id, B.id)) ? 'same-creature/form records' : null,
        junior: B.id, // B is later in queue order = lower screen-time priority
      });
    }
  }
}
// nearest neighbour per record (fronts) for the table
for (const r of records) {
  let best = null;
  for (const o of records) {
    if (o === r) continue;
    const s = iou(r._F.sig, o._F.sig);
    if (!best || s > best.s) best = { id: o.id, s };
  }
  r.nearestFront = { id: best.id, iou: +best.s.toFixed(3) };
}

// ---------- outputs ----------
const summary = {
  records: records.length,
  pass: records.filter((r) => r.grade === 'PASS').length,
  watch: records.filter((r) => r.grade === 'WATCH').length,
  fail: records.filter((r) => r.grade === 'FAIL').length,
  flags: flags.filter((f) => !f.exempt).length,
  flagsExempt: flags.filter((f) => f.exempt).length,
  missingDesigns: records.filter((r) => !r.designOk).map((r) => r.id),
};
console.log(`B2-G10 audit: ${summary.records} records — PASS ${summary.pass} / WATCH ${summary.watch} / FAIL ${summary.fail}; uniqueness flags ${summary.flags} (+${summary.flagsExempt} exempt form/same-creature)`);
for (const r of records.filter((x) => x.grade === 'FAIL')) console.log(`  FAIL #${r.queue} ${r.name} (${r.id}): ${r.reasons.join('; ')}`);
for (const f of flags.filter((x) => !x.exempt)) console.log(`  FLAG ${f.a} x ${f.b} [${f.view}] ${f.kind} sil=${f.silhouette} pal=${f.palette} -> junior ${f.junior} redesigned`);

const jsonPath = opt('--json');
if (jsonPath) {
  const clean = records.map(({ _F, _B, _front, _back, ...r }) => r);
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, records: clean, flags }, null, 1));
}
function sheet(recs, file, scale, cols) {
  const cw = 64 * scale * 2 + 12, chh = 64 * scale + 8;
  const rowsN = Math.ceil(recs.length / cols);
  const W = cols * cw + 4, H = rowsN * chh + 4;
  const buf = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { buf[i * 4] = 32; buf[i * 4 + 1] = 32; buf[i * 4 + 2] = 38; buf[i * 4 + 3] = 255; }
  const blit = (rgba, sw, dx, dy) => {
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const so = (y * sw + x) * 4;
      if (rgba[so + 3] === 0) continue;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        const o = ((dy + y * scale + sy) * W + dx + x * scale + sx) * 4;
        buf[o] = rgba[so]; buf[o + 1] = rgba[so + 1]; buf[o + 2] = rgba[so + 2]; buf[o + 3] = 255;
      }
    }
  };
  recs.forEach((r, i) => {
    const cx = 4 + (i % cols) * cw, cy = 4 + Math.floor(i / cols) * chh;
    blit(rasterize(r._front), 64, cx + 4, cy + 4);
    blit(rasterize(r._back), 64, cx + 8 + 64 * scale, cy + 4);
  });
  fs.writeFileSync(file, encodePng(W, H, buf));
}
if (opt('--sheet')) sheet(records, opt('--sheet'), 2, 10);
if (opt('--flagged-sheet')) {
  const flaggedIds = new Set([...records.filter((r) => r.grade === 'FAIL').map((r) => r.id), ...flags.filter((f) => !f.exempt).map((f) => f.junior)]);
  sheet(records.filter((r) => flaggedIds.has(r.id)), opt('--flagged-sheet'), 4, 4);
}
const mdPath = opt('--md');
if (mdPath) {
  const L = [];
  L.push('# Wave J — Tranche 0 Audit (B2-G10)', '');
  L.push(`Scope: ${summary.records} converted Kanto records (148 pix/species pairs + the partner pair). PASS ${summary.pass} / WATCH ${summary.watch} / FAIL ${summary.fail}. Uniqueness flags: ${summary.flags} action + ${summary.flagsExempt} exempt (same-creature/form records).`, '');
  L.push('Queue order = screen time: T0 partner, T1 starter lines, T2 early-route commons, T3 gym-ace lines, T4 legendaries + headline, T5 rest by dex.', '');
  L.push('| # | Record | Name | Tier | Grade | F mass/wisp/col/steps | B mass/wisp/col/steps | Pair J | Nearest front (IoU) | Reasons |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of records) {
    L.push(`| ${r.queue} | ${r.id} | ${r.name} | T${r.tier} | ${r.grade} | ${r.front.mass}/${r.front.thin}/${r.front.colors}/${r.front.steps} | ${r.back.mass}/${r.back.thin}/${r.back.colors}/${r.back.steps} | ${r.pairJac} | ${r.nearestFront.id} (${r.nearestFront.iou}) | ${r.reasons.join('; ') || '—'} |`);
  }
  L.push('', '## Uniqueness flags (junior = lower screen-time priority, gets the differentiating redesign)', '');
  L.push('| Pair | View | Kind | Silhouette IoU | Palette J | Junior | Exempt |');
  L.push('|---|---|---|---|---|---|---|');
  for (const f of flags) L.push(`| ${f.a} x ${f.b} | ${f.view} | ${f.kind} | ${f.silhouette} | ${f.palette} | ${f.junior} | ${f.exempt || '—'} |`);
  if (!flags.length) L.push('| (none) | | | | | | |');
  L.push('', `Design sources missing: ${summary.missingDesigns.length ? summary.missingDesigns.join(', ') : 'none'}.`, '');
  L.push('## Calibration notes (instrument honesty)', '');
  L.push('- Pair palette Jaccard is computed on 2-bit-quantized bins: front/back are median-cut independently and identical families land 1-2 hex units apart (#eda245 vs #eda244); exact-hex Jaccard read ~0.00 for genuinely consistent pairs. B2-G10 amended to say so.', '');
  L.push('- The silhouette signature is an aspect-preserving 16x16 fit with a 35% coverage floor. The first pass (any-hit over the raw bbox) saturated and flagged 742 pairs; the shipped numbers are from the calibrated signature.', '');
  L.push('- Components are 8-connected: pixel art joins tails/whiskers/flames diagonally, and 4-connectivity shatters them into false specks (the repo orphan rule is likewise 8-based). Specks that remain are genuinely detached at render.', '');
  L.push('- PRIMARA correction: the Wave G sheet grade called it wispy. Measured: mass 513/602 and wisp 1.8% are FINE. Its failure is value depth (2 steps — pale on pale) + 2 front specks. The flat-shading class, not the mass class.', '');
  L.push('- Ribbon share (Wave J2 addendum): rows carrying <=5 opaque px, as a share of opaque rows. The mass/wisp/silhouette measures are all blind to the sliver class (a 2px ribbon keeps 2 vertical neighbours per pixel, and the signature normalizes its bbox away). VIGILET measured 0.41/0.38 — the roster outlier; next-highest view LANCEWASP 0.31. FAIL line 0.35 sits in the empty 0.31-0.38 band, so no previously-graded record changes class under the new rule.', '');
  L.push('- Flag dispositions are decided per tranche, in three classes: clear twins -> junior redesign; evolution-line pairs -> strengthen the junior\'s escalation element; back-view-only collisions -> an authored back marking. The gate flags; it does not auto-condemn.', '');
  L.push('## Redraw tranches (queue order over the FAIL + flag-junior set)', '');
  const redrawSet = records.filter((r) => r.grade === 'FAIL' || flags.some((f) => !f.exempt && f.junior === r.id));
  L.push(`Redraw set: ${redrawSet.length} records (FAIL ${summary.fail} + flag juniors not already failing).`, '');
  for (let i = 0; i < redrawSet.length; i += 14) {
    const chunk = redrawSet.slice(i, i + 14);
    L.push(`- Tranche ${i / 14 + 1}: ${chunk.map((r) => r.name).join(', ')}`, '');
  }
  fs.writeFileSync(mdPath, L.join('\n'));
}
