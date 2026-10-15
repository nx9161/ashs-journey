// build-art.mjs — Art Director sprite pipeline: .pix sources -> atlases + data.
// Steps: parse -> validate (palette cap, outline, margin, orphans) -> mirror
// resolve -> bob-frame derivation (marked) -> shelf-pack atlases (2048 cap,
// 1px transparent cell padding) -> emit PNG + atlas JSON (contracts §1.1) +
// art-data.mjs (game wiring payload for the owning seat).
// Deterministic: same sources -> byte-identical outputs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix, resolveMirrors, colorCount, hasInnerMargin, hasInnerMarginTopSides, outlineOk, orphanCount, paintedCount } from './pix.mjs';
import { encodePng, rasterize } from './png.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PIX = path.join(ROOT, 'pix');
const DIST = path.join(ROOT, 'dist');
const ATLAS_MAX = 2048;
const CELL_PAD = 1; // 1px transparent margin per sprite cell (contracts §1.1)

const FAMILIES = ['tiles', 'ash', 'pikachu', 'brock', 'npcs', 'species', 'ui'];
// tiles are full-bleed (seamless); characters/sprites/icons need inner margin.
const NEEDS_INNER_MARGIN = new Set(['ash', 'pikachu', 'brock', 'npcs', 'species', 'ui']);
// Grounded humanoids stand ON the bottom frame edge (feet on the ground line is
// correct pixel-art practice); the atlas cell padding still ships the 1px
// transparent margin per contracts §1.1. They need clear top/left/right only.
const GROUNDED = new Set(['ash', 'brock', 'npcs']);

function walkPix(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'drafts') out.push(...walkPix(p)); }
    else if (e.name.endsWith('.pix')) out.push(p);
  }
  return out.sort();
}

function familyOf(file) {
  const rel = path.relative(PIX, file);
  const top = rel.split(path.sep)[0];
  return FAMILIES.includes(top) ? top : 'misc';
}

function main() {
  const errors = [];
  const warnings = [];
  const files = walkPix(PIX).filter((f) => !f.includes(`${path.sep}drafts${path.sep}`));
  let sprites = [];
  for (const f of files) {
    try { sprites.push({ ...parsePix(fs.readFileSync(f, 'utf8'), f), family: familyOf(f) }); }
    catch (e) { errors.push(e.message); }
  }
  try { sprites = resolveMirrors(sprites); } catch (e) { errors.push(e.message); }

  // ---- per-sprite checks ----
  for (const s of sprites) {
    if (!s.rows) { errors.push(`${s.path}: unresolved mirror`); continue; }
    const cc = colorCount(s);
    if (cc > 12) errors.push(`${s.id}: palette cap ${cc} > 12`);
    if (NEEDS_INNER_MARGIN.has(s.family)) {
      const m = GROUNDED.has(s.family) ? hasInnerMarginTopSides(s) : hasInnerMargin(s);
      if (!m) errors.push(`${s.id}: missing 1px transparent inner margin${GROUNDED.has(s.family) ? ' (top/sides)' : ''}`);
    }
    const oo = outlineOk(s);
    if (!oo.ok) errors.push(`${s.id}: ${oo.bad} edge pixels not using outline 'O'`);
    const orph = orphanCount(s);
    if (orph > 0) errors.push(`${s.id}: ${orph} orphan pixels`);
    if (paintedCount(s) === 0) errors.push(`${s.id}: fully transparent`);
  }

  // ---- derived bob frames: species/<id>/front.pix -> <id>-front-bob (2px down) ----
  const derived = [];
  const byId = new Map(sprites.map((s) => [s.id, s]));
  for (const s of sprites) {
    if (s.family === 'species' && s.id.endsWith('-front') && !byId.has(s.id + '-bob')) {
      const shift = 2;
      const rows = s.rows.map((r) => '.'.repeat(s.w));
      for (let y = 0; y < s.h - shift; y++) rows[y + shift] = s.rows[y];
      derived.push({
        id: s.id + '-bob', w: s.w, h: s.h, rows, pal: s.pal,
        family: 'species', derivedFrom: s.id, path: s.path + ' (derived)',
      });
    }
  }
  for (const d of derived) {
    byId.set(d.id, d);
    sprites.push(d);
  }

  // ---- tileset palette cap: <= 16 colors across the whole tileset ----
  const tileHexes = new Set();
  for (const s of sprites) {
    if (s.family !== 'tiles') continue;
    for (const row of s.rows) for (const ch of row) {
      if (ch !== '.') tileHexes.add(s.pal[ch].hex);
    }
  }
  if (tileHexes.size > 16) errors.push(`tileset palette cap: ${tileHexes.size} > 16`);

  if (errors.length) {
    console.error('BUILD FAILED — ' + errors.length + ' error(s):');
    for (const e of errors) console.error('  ✗ ' + e);
    process.exit(1);
  }

  // ---- atlas packing (shelf, per family) ----
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  const atlases = {};
  for (const fam of FAMILIES) {
    const members = sprites.filter((s) => s.family === fam)
      .sort((a, b) => (b.h - a.h) || (b.w - a.w));
    if (!members.length) continue;
    // shelf pack
    let x = 0, y = 0, rowH = 0, maxW = 0;
    const cells = [];
    for (const s of members) {
      const cw = s.w + CELL_PAD * 2, ch = s.h + CELL_PAD * 2;
      if (x + cw > ATLAS_MAX) { y += rowH; x = 0; rowH = 0; }
      if (y + ch > ATLAS_MAX) { errors.push(`atlas ${fam}: exceeds 2048x2048`); break; }
      cells.push({ s, x: x + CELL_PAD, y: y + CELL_PAD });
      x += cw; rowH = Math.max(rowH, ch); maxW = Math.max(maxW, x);
    }
    const AW = Math.min(ATLAS_MAX, maxW), AH = Math.min(ATLAS_MAX, y + rowH);
    const rgba = Buffer.alloc(AW * AH * 4);
    const jsonSprites = {};
    for (const { s, x: sx, y: sy } of cells) {
      const px = rasterize(s);
      for (let py = 0; py < s.h; py++) {
        for (let pxx = 0; pxx < s.w; pxx++) {
          const si = (py * s.w + pxx) * 4, di = ((sy + py) * AW + (sx + pxx)) * 4;
          rgba[di] = px[si]; rgba[di + 1] = px[si + 1]; rgba[di + 2] = px[si + 2]; rgba[di + 3] = px[si + 3];
        }
      }
      jsonSprites[s.id] = {
        x: sx, y: sy, w: s.w, h: s.h,
        frames: frameNames(s.id),
        palette: colorCount(s),
        seed: s.seed ?? null,
        derived_from: s.derivedFrom ?? null,
        mirror_of: s.mirrorOf ?? null,
      };
    }
    const pngName = `atlas-${fam}.png`;
    fs.writeFileSync(path.join(DIST, pngName), encodePng(AW, AH, rgba));
    const json = {
      atlas: pngName, tile: fam === 'species' || fam === 'pikachu' || fam === 'brock' ? 48 : 16,
      size: [AW, AH], sprites: jsonSprites,
    };
    fs.writeFileSync(path.join(DIST, `atlas-${fam}.json`), JSON.stringify(json, null, 2) + '\n');
    atlases[fam] = { png: pngName, w: AW, h: AH, count: members.length };
  }
  if (errors.length) {
    console.error('BUILD FAILED:'); for (const e of errors) console.error('  ✗ ' + e);
    process.exit(1);
  }

  // ---- art-data.mjs: wiring payload (game consumes this; owning seat wires it) ----
  let data = '// art-data.mjs — GENERATED by assets/sprites/tools/build-art.mjs. Do not hand-edit.\n';
  data += '// Regenerate: node assets/sprites/tools/build-art.mjs (deterministic).\n';
  data += 'export const ART = {\n';
  for (const s of sprites) {
    data += `  ${JSON.stringify(s.id)}: { w: ${s.w}, h: ${s.h}, pal: ${JSON.stringify(mapPal(s.pal))}, rows: [\n`;
    for (const row of s.rows) data += `    ${JSON.stringify(row)},\n`;
    data += '  ] },\n';
  }
  data += '};\n';
  data += 'export const ART_META = ' + JSON.stringify({
    families: FAMILIES,
    generated: new Date().toISOString().slice(0, 10),
    derived_bob: derived.map((d) => d.id),
  }, null, 2) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'art-data.mjs'), data);

  console.log('art build OK — ' + sprites.length + ' sprites, ' + derived.length + ' derived bob frames');
  for (const [fam, a] of Object.entries(atlases)) {
    console.log(`  ${fam}: ${a.count} sprites -> ${a.png} (${a.w}x${a.h})`);
  }
  for (const wmsg of warnings) console.log('  warn: ' + wmsg);
}

function mapPal(pal) {
  const o = {};
  for (const [ch, v] of Object.entries(pal)) o[ch] = v.hex;
  return o;
}

function frameNames(id) {
  if (/-idle-?2?$/.test(id) || /-idle1$/.test(id)) return ['idle', 'idle2'];
  if (/-walk-[1-4]$/.test(id)) return ['walk-' + id.slice(-1)];
  if (/-front-bob$/.test(id)) return ['bob'];
  if (/-front$/.test(id)) return ['idle'];
  if (/-back$/.test(id)) return ['idle'];
  if (/-hop-[12]$/.test(id)) return ['hop-' + id.slice(-1)];
  return ['idle'];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
