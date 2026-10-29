// build-art.mjs — Art Director sprite pipeline: .pix sources -> atlases + data.
// Steps: parse -> validate (palette cap, outline, margin, orphans) -> mirror
// resolve -> bob-frame derivation (marked) -> shelf-pack atlases (2048 cap,
// 1px transparent cell padding) -> emit PNG + atlas JSON (contracts §1.1) +
// art-data.mjs (game wiring payload for the owning seat).
// Deterministic: same sources -> byte-identical outputs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix, parseDeltaPix, materializeDeltaRows, mergedDeltaPal, resolveMirrors, colorCount, hasInnerMargin, hasInnerMarginTopSides, outlineOk, orphanCount, paintedCount } from './pix.mjs';
import { encodePng, rasterize } from './png.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PIX = path.join(ROOT, 'pix');
const DIST = path.join(ROOT, 'dist');
const ATLAS_MAX = 2048;
const CELL_PAD = 1; // 1px transparent margin per sprite cell (contracts §1.1)

const FAMILIES = ['tiles', 'ash', 'partner', 'brock', 'npcs', 'species', 'ui'];
// tiles are full-bleed (seamless); characters/sprites/icons need inner margin.
const NEEDS_INNER_MARGIN = new Set(['ash', 'partner', 'brock', 'npcs', 'species', 'ui']);
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

// Premium+ W0: layered delta frames (.deltapix) — see pix.mjs parseDeltaPix.
function walkDeltaPix(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'drafts') out.push(...walkDeltaPix(p)); }
    else if (e.name.endsWith('.deltapix')) out.push(p);
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
    if (cc > 32) errors.push(`${s.id}: palette cap ${cc} > 32`);
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

  // ---- layered delta frames (Premium+ W0): validate each .deltapix
  // against its base, then push a MATERIALIZED sprite (for atlas packing
  // + the shared pixel checks) that remembers its delta form for the
  // art-data emission below. Deltas emit AFTER every full sprite, so all
  // pre-existing ART keys keep byte-identical blocks in identical order.
  const deltaSprites = [];
  const deltaFiles = walkDeltaPix(PIX).filter((f) => !f.includes(`${path.sep}drafts${path.sep}`));
  for (const f of deltaFiles) {
    let d;
    try { d = parseDeltaPix(fs.readFileSync(f, 'utf8'), f); }
    catch (e) { errors.push(e.message); continue; }
    const base = byId.get(d.base);
    if (!base || !base.rows) { errors.push(`${d.id}: delta base missing or itself a delta: ${d.base}`); continue; }
    if (base.w !== d.w || base.h !== d.h) { errors.push(`${d.id}: delta size ${d.w}x${d.h} != base ${base.w}x${base.h}`); continue; }
    if (byId.has(d.id)) { errors.push(`${d.id}: delta id collides with an existing sprite`); continue; }
    for (const [, , ch] of d.deltas) {
      if (ch !== '.' && !d.pal[ch] && !base.pal[ch]) {
        errors.push(`${d.id}: delta char "${ch}" declared in neither delta nor base palette`);
      }
    }
    const mat = {
      id: d.id, w: d.w, h: d.h,
      rows: materializeDeltaRows(base, d), pal: mergedDeltaPal(base, d),
      family: familyOf(f), deltaOf: d.base, deltaPal: d.pal, deltaList: d.deltas,
      path: f + ' (delta of ' + d.base + ')',
    };
    deltaSprites.push(mat);
    byId.set(d.id, mat);
    sprites.push(mat);
  }

  // ---- Premium+ W2 (AN-1): back-bob parity via SHIFT deltas ----
  // Fronts have shipped a derived bob frame since Wave 6; backs had
  // none (0/162). A bob is a pure 2px downward shift of the base pose,
  // so the back bob ships as a shift-delta art-data entry
  // ({ base, shiftY: 2 } — ~60 B) instead of a full 64x64 frame
  // (~4.5 KB): 162 backs cost ~10 KB, not ~730 KB. The materialized
  // sprite still packs into the atlas like any other sprite, and the
  // runtime materializer (src/engine/art.mjs) resolves shiftY.
  // The partner front (the one battler front without a derived bob —
  // the species-family derivation above never covered the partner
  // family) gains its bob the same way.
  const shiftSprites = [];
  for (const s of [...sprites]) {
    const wantsBackBob = (s.family === 'species' || s.family === 'partner') && s.id.endsWith('-back') && !byId.has(s.id + '-bob');
    const wantsPartnerFrontBob = s.family === 'partner' && s.id.endsWith('-front') && !byId.has(s.id + '-bob');
    if (!wantsBackBob && !wantsPartnerFrontBob) continue;
    const shift = 2;
    const rows = s.rows.map((r) => '.'.repeat(s.w));
    for (let y = 0; y < s.h - shift; y++) rows[y + shift] = s.rows[y];
    const mat = {
      id: s.id + '-bob', w: s.w, h: s.h, rows, pal: s.pal,
      family: s.family, shiftOf: s.id, shiftY: shift,
      path: s.path + ' (shift-delta bob)',
    };
    shiftSprites.push(mat);
    byId.set(mat.id, mat);
    sprites.push(mat);
  }

  // ---- per-family palette budget (Wave 0, 2026-10-27) ----
  // The old tileset-wide cap (<= 16 colors across every tile sprite) is
  // replaced by a per-family budget: the tiles family's color UNION is
  // capped at 48 distinct hexes. Other families are bounded by the
  // per-sprite cap (32) alone; a family that needs a union budget gets
  // its own entry here, deliberately, never by silently widening this one.
  // Wave 5a raise (2026-10-28, the ONE deliberate raise for interiors):
  // 48 -> 54. The interior families need hues the outdoor union never
  // had: the Center's rose set (floor #f2ddd5, wall #e8b4c4, mid
  // #c97e97, baseboard #9e5570), the Mart's pale sage floor (#cfd4c2),
  // and the League's purple trim (#6a4a7a) — exactly 6 new hexes,
  // counted from the Wave 5a tiles as authored; every other Wave 5a
  // hex reuses the existing 48. Sized to the real need, no headroom
  // banked for future waves.
  // Premium+ W0 raise (2026-10-28, spec §5 + world audit §13 — the second
  // deliberate raise, on the record): 54 -> 72. The Premium+ world
  // programme (town identity sets, ground texture families, dungeon
  // sub-themes, light system) needs hues the shipped union never had;
  // the cap is set ONCE here, before any Premium+ tile is drawn, and
  // palette-audit.mjs mirrors it. Current union at the raise: 54.
  // Premium+ W5 raise (2026-10-29, third deliberate raise, on the
  // record): 72 -> 640. Forced by arithmetic, not appetite: spec TX-1
  // requires >= 80 unique colours on a single town's logical raster,
  // which is impossible while the whole tiles family holds <= 72 hexes
  // (a map cannot show more colours than the family contains). The W5
  // town-identity programme (11 ground palettes with pairwise-distant
  // dominant hues) plus the TX-1 texture families were first sized at
  // ~486 hexes (cap 512), but as finally authored (11 town palettes
  // with HSL-derived tones, per-variant palette splits across the
  // ground/cave/tree/floor families) the union MEASURES 624 hexes
  // (palette-audit.mjs, verified by independent QA) — above 512, so
  // the cap is set at 640: just above the measured union, no headroom
  // banked beyond it. palette-audit.mjs mirrors it. [Comment
  // corrected at QA: the first draft of this note stopped at the
  // 486/512 estimate while the code already carried 640.]
  // Stage J3a: 640 -> 760 — the Johto tile family (57 new tiles: six
  // settlements x eight identity tiles + nine Johto kinds) carries its
  // own per-town anchors/accents by design (Premium+ identity law);
  // the raise is recorded in docs/audit-register.md (J3a section),
  // following the W5 palette-cap-raise precedent.
  // Stage J3b: 760 -> 800 — the five east-Johto settlements (olivine /
  // cianwood / mahogany / blackthorn / silvertown) add 40 identity
  // tiles on the same per-town anchor programme; the union MEASURES
  // 783 hexes, so the cap is set just above the measured union, no
  // headroom banked beyond it. Recorded in docs/audit-register.md
  // (J3b section), same precedent.
  // Stage H3a: 800 -> 940 — the eleven west/central-Hoenn settlements
  // (littleroot..fortree) add 88 identity tiles + 7 Hoenn kinds on the
  // same per-town anchor programme; the union MEASURES 920 hexes, so
  // the cap is set just above the measured union, no headroom banked
  // beyond it. Recorded in docs/audit-register.md (H3a section), same
  // precedent. (H3b's five east settlements will re-measure.)
  // Stage H3b: 940 -> 1010 — the five east-Hoenn settlements
  // (lilycove..evergrande) add 40 identity tiles + 8 H3b kinds on the
  // same per-town anchor programme; the union MEASURES 996 hexes, so
  // the cap is set just above the measured union, no headroom banked
  // beyond it. Recorded in docs/audit-register.md (H3b section), same
  // precedent.
  // Stage S3a: 1010 -> 1120 — the ten west/central-Sinnoh settlements
  // (twinleaf..canalave) add 80 identity tiles + 8 S3 kinds on the
  // same per-town anchor programme; the union MEASURES 1106 hexes, so
  // the cap is set just above the measured union, no headroom banked
  // beyond it. Recorded in docs/audit-register.md (Arc 4 Stage S3a
  // section), same precedent. (S3b's four east settlements will
  // re-measure.)
  const FAMILY_PALETTE_BUDGETS = { tiles: 1120 };
  for (const [fam, budget] of Object.entries(FAMILY_PALETTE_BUDGETS)) {
    const hexes = new Set();
    for (const s of sprites) {
      if (s.family !== fam) continue;
      for (const row of s.rows) for (const ch of row) {
        if (ch !== '.') hexes.add(s.pal[ch].hex);
      }
    }
    if (hexes.size > budget) {
      errors.push(`${fam} family palette cap: ${hexes.size} > ${budget} (per-family budget for the ${fam} family)`);
    }
  }

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
    // Shelf pack, multi-page (Arc2 J2a, 2026-10-29): a family whose cells
    // exceed one 2048x2048 page continues onto atlas-<fam>-2, -3, ...
    // instead of failing. Every page still honours the contracts §1.1
    // ceiling (<=2048x2048, 1px cell padding); page 1 keeps the legacy
    // atlas-<fam>.png/.json names, and single-page families produce
    // byte-identical output to the pre-split packer. A single sprite
    // larger than a page still fails loudly.
    const pages = [];
    let cells = [], x = 0, y = 0, rowH = 0, maxW = 0;
    const flush = () => { if (cells.length) pages.push({ cells, maxW, h: y + rowH }); cells = []; x = 0; y = 0; rowH = 0; maxW = 0; };
    for (const s of members) {
      const cw = s.w + CELL_PAD * 2, ch = s.h + CELL_PAD * 2;
      if (cw > ATLAS_MAX || ch > ATLAS_MAX) { errors.push(`atlas ${fam}: sprite ${s.id} exceeds 2048x2048 page`); continue; }
      if (x + cw > ATLAS_MAX) { y += rowH; x = 0; rowH = 0; }
      if (y + ch > ATLAS_MAX) { flush(); }
      cells.push({ s, x: x + CELL_PAD, y: y + CELL_PAD });
      x += cw; rowH = Math.max(rowH, ch); maxW = Math.max(maxW, x);
    }
    flush();
    let famCount = 0;
    pages.forEach((page, pi) => {
      const AW = Math.min(ATLAS_MAX, page.maxW), AH = Math.min(ATLAS_MAX, page.h);
      const rgba = Buffer.alloc(AW * AH * 4);
      const jsonSprites = {};
      for (const { s, x: sx, y: sy } of page.cells) {
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
          ...(s.deltaOf ? { delta_of: s.deltaOf } : {}),
        };
      }
      const suffix = pi === 0 ? '' : `-${pi + 1}`;
      const pngName = `atlas-${fam}${suffix}.png`;
      fs.writeFileSync(path.join(DIST, pngName), encodePng(AW, AH, rgba));
      const json = {
        atlas: pngName, tile: fam === 'species' || fam === 'partner' || fam === 'brock' ? 48 : 16,
        size: [AW, AH], sprites: jsonSprites,
        ...(pages.length > 1 ? { page: pi + 1, pages: pages.length } : {}),
      };
      fs.writeFileSync(path.join(DIST, `atlas-${fam}${suffix}.json`), JSON.stringify(json, null, 2) + '\n');
      famCount += page.cells.length;
      if (pi === 0) atlases[fam] = { png: pngName, w: AW, h: AH, count: famCount };
    });
    if (atlases[fam]) atlases[fam].count = famCount;
  }
  if (errors.length) {
    console.error('BUILD FAILED:'); for (const e of errors) console.error('  ✗ ' + e);
    process.exit(1);
  }

  // ---- art-data.mjs: wiring payload (game consumes this; owning seat wires it) ----
  // Premium+ W0 (spec §5): the internal art-data ceiling, raised on the
  // record 3.0 MB -> 5.5 MB for the Premium+ programme (hybrid battler
  // path + full world programme; expected end state ≈4.7 MB). This is
  // the ONLY enforcement site; budgets.json's 12,582,912 B per-bundle
  // hard gate is unchanged and still governs the shipped bundles.
  // Arc 3 H2a raise (2026-10-29, on the record — see docs/audit-register.md
  // H2a section): 5.5 MB -> 7,100,000. Forced by measured arithmetic, not
  // appetite: the H0 pack decision (monolith, ratified) projects the
  // Hoenn-close art-data at 4,914,208 + 138 x 14,483 (measured Johto
  // per-species art) = 6,912,862 B, plus ~70 KB of H3 tile art; the cap
  // is set just above that Hoenn-close projection, no further headroom
  // banked. Arc 4 re-measures (H0 re-open triggers) before Sinnoh art.
  // Arc 4 S2a raise (2026-10-29, on the record — see docs/audit-register.md
  // S2a section): 7,100,000 -> 8,800,000. Same measured law as H2a: S2a
  // takes art-data to 7,731,350 B (+731,140 for 53 species = 13,795 per
  // species, vs H2a's measured 14,570); S2b's remaining 61 entries
  // (54 species + 7 formes) at that unit project +~842,000, landing the
  // Sinnoh-close art-data at ~8.57 MB with S3 tile art still to come;
  // the cap is set just above that projection. budgets.json's
  // 12,582,912 B hard gate is unchanged and still governs.
  const ART_DATA_CEILING_BYTES = 8800000;
  let data = '// art-data.mjs — GENERATED by assets/sprites/tools/build-art.mjs. Do not hand-edit.\n';
  data += '// Regenerate: node assets/sprites/tools/build-art.mjs (deterministic).\n';
  data += 'export const ART = {\n';
  for (const s of sprites) {
    if (s.shiftOf) {
      // Shift-delta form (W2 back-bob): base id + vertical shift only.
      data += `  ${JSON.stringify(s.id)}: { base: ${JSON.stringify(s.shiftOf)}, w: ${s.w}, h: ${s.h}, pal: {}, shiftY: ${s.shiftY} },\n`;
      continue;
    }
    if (s.deltaOf) {
      // Delta form: base id + this sprite's OWN palette keys (new hexes
      // only) + the sparse [x, y, char] override list. The runtime
      // materializes it against the base (src/engine/art.mjs).
      data += `  ${JSON.stringify(s.id)}: { base: ${JSON.stringify(s.deltaOf)}, w: ${s.w}, h: ${s.h}, pal: ${JSON.stringify(mapPal(s.deltaPal))}, deltas: ${JSON.stringify(s.deltaList)} },\n`;
      continue;
    }
    data += `  ${JSON.stringify(s.id)}: { w: ${s.w}, h: ${s.h}, pal: ${JSON.stringify(mapPal(s.pal))}, rows: [\n`;
    for (const row of s.rows) data += `    ${JSON.stringify(row)},\n`;
    data += '  ] },\n';
  }
  data += '};\n';
  if (Buffer.byteLength(data) > ART_DATA_CEILING_BYTES) {
    console.error(`BUILD FAILED — art-data ceiling: ${Buffer.byteLength(data)} > ${ART_DATA_CEILING_BYTES} (Premium+ W0 internal ceiling, spec §5)`);
    process.exit(1);
  }
  data += 'export const ART_META = ' + JSON.stringify({
    families: FAMILIES,
    generated: new Date().toISOString().slice(0, 10),
    derived_bob: derived.map((d) => d.id),
    shift_bob: shiftSprites.map((d) => d.id),
    delta_frames: deltaSprites.map((d) => d.id),
  }, null, 2) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'art-data.mjs'), data);

  console.log('art build OK — ' + sprites.length + ' sprites, ' + derived.length + ' derived bob frames, ' + deltaSprites.length + ' delta frames');
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
