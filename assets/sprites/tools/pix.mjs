// pix.mjs — .pix pixel-art source parser (Art Director sprite pipeline v1).
// Format:
//   PIX <id> <w> <h>
//   <h rows of exactly w chars; '.' = transparent>
//   PAL
//   <CHAR> <#rrggbb> [name]
//   (optional) MIRROR <other-id>  — instead of rows/PAL, mirror another sprite
// Rules enforced: rows exact width, every non-'.' char declared in PAL,
// palette <= 32 colors + transparency (Wave 0 art contract, 2026-10-27:
// raised from 12 — see assets/sprites/README.md "Palette/size contracts").

export function parsePix(text, path) {
  const rawLines = text.split('\n');
  const lines = rawLines.map((l) => l.replace(/\r$/, ''));
  // strip comments (# ...) and blank lines, but NOT inside rows
  let i = 0;
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('#'))) i++;
  const head = lines[i++].trim().split(/\s+/);
  if (head[0] !== 'PIX' || head.length < 4) {
    throw new Error(`${path}: bad header, want "PIX <id> <w> <h>"`);
  }
  const [, id, ws, hs] = head;
  const w = +ws, h = +hs;
  if (!id || !Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0 || w > 256 || h > 256) {
    throw new Error(`${path}: bad dimensions in header`);
  }
  // mirror form?
  if (i < lines.length && lines[i].trim().startsWith('MIRROR')) {
    const m = lines[i].trim().split(/\s+/);
    if (m.length !== 2) throw new Error(`${path}: bad MIRROR line`);
    return { id, w, h, mirrorOf: m[1], rows: null, pal: null, path };
  }
  const rows = [];
  for (let r = 0; r < h; r++, i++) {
    if (i >= lines.length) throw new Error(`${path}: expected ${h} rows, got ${r}`);
    const row = lines[i];
    if (row.length !== w) throw new Error(`${path}: row ${r} width ${row.length}, want ${w}`);
    rows.push(row);
  }
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || lines[i].trim() !== 'PAL') {
    throw new Error(`${path}: want PAL section after rows`);
  }
  i++;
  const pal = {};
  while (i < lines.length) {
    const t = lines[i++].trim();
    if (t === '' || t.startsWith('#')) continue;
    const [ch, hex, ...name] = t.split(/\s+/);
    if (!ch || ch.length !== 1 || !/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      throw new Error(`${path}: bad palette line "${t}"`);
    }
    if (ch === '.') throw new Error(`${path}: '.' is reserved for transparency`);
    pal[ch] = { hex: hex.toLowerCase(), name: name.join(' ') || ch };
  }
  // every painted char must be declared
  const used = new Set();
  for (const row of rows) for (const ch of row) if (ch !== '.') used.add(ch);
  for (const ch of used) {
    if (!pal[ch]) throw new Error(`${path}: char "${ch}" painted but not in PAL`);
  }
  const nColors = Object.keys(pal).length;
  if (nColors > 32) throw new Error(`${path}: palette cap violated: ${nColors} > 32`);
  return { id, w, h, mirrorOf: null, rows, pal, path };
}

// Resolve MIRROR entries against the parsed set (horizontal flip).
export function resolveMirrors(sprites) {
  const byId = new Map(sprites.map((s) => [s.id, s]));
  for (const s of sprites) {
    if (!s.mirrorOf) continue;
    const src = byId.get(s.mirrorOf);
    if (!src || src.mirrorOf) throw new Error(`${s.path}: MIRROR target missing: ${s.mirrorOf}`);
    if (src.w !== s.w || src.h !== s.h) throw new Error(`${s.path}: MIRROR size mismatch`);
    s.rows = src.rows.map((row) => [...row].reverse().join(''));
    s.pal = src.pal;
  }
  return sprites;
}

// Count distinct painted colors (excl. transparency).
export function colorCount(s) {
  const set = new Set();
  for (const row of s.rows) for (const ch of row) if (ch !== '.') set.add(s.pal[ch].hex);
  return set.size;
}

// 1px transparent margin inside the frame (characters/species/icons, not tiles).
export function hasInnerMargin(s) {
  return hasInnerMarginTopSides(s) && isClearRow(s, s.h - 1);
}

function isClearRow(s, y) {
  for (let x = 0; x < s.w; x++) if (s.rows[y][x] !== '.') return false;
  return true;
}

// Grounded variant: top/left/right clear; bottom row may carry feet.
export function hasInnerMarginTopSides(s) {
  const { w, h, rows } = s;
  for (let x = 0; x < w; x++) {
    if (rows[0][x] !== '.') return false;
  }
  for (let y = 0; y < h; y++) {
    if (rows[y][0] !== '.' || rows[y][w - 1] !== '.') return false;
  }
  return true;
}

// Outline rule: every outermost painted pixel must use the outline char 'O'
// (outline = darkest shade of the sprite's own palette, contracts §1.2).
// Edge = 4-connectivity (orthogonal): stepped diagonals are legal pixel art
// (gameux §6 bans *unjagged* diagonals only via the orphan/stepping review).
export function outlineOk(s) {
  if (!s.pal.O) return { ok: true, skipped: 'no O in palette' };
  const { w, h, rows } = s;
  const painted = (x, y) => rows[y][x] !== '.';
  const isEdge = (x, y) => (
    x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
    !painted(x - 1, y) || !painted(x + 1, y) || !painted(x, y - 1) || !painted(x, y + 1)
  );
  let bad = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (painted(x, y) && isEdge(x, y) && rows[y][x] !== 'O') bad++;
  }
  return { ok: bad === 0, bad };
}

// Orphan pixels: painted pixel with zero painted 8-neighbors (gameux §6: none).
export function orphanCount(s) {
  const { w, h, rows } = s;
  const painted = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] !== '.';
  let orphans = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!painted(x, y)) continue;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if (painted(x + dx, y + dy)) n++;
    }
    if (n === 0) orphans++;
  }
  return orphans;
}

// ---- Layered delta frames (Premium+ W0, spec §4 W0 / §3 AN-1) ----
// A delta frame ships ONLY the pixels that differ from a base sprite:
// accent/idle frames (blink, ear, flame, wing) cost a handful of palette-
// index entries instead of a full 64x64 sprite (~4-5 KB). Source format
// (.deltapix):
//   PIXD <id> <base-id> <w> <h>
//   <x> <y> <char>        one override per line; char '.' erases to
//                         transparent; any other char must be declared
//                         in this file's PAL or inherited from the base
//   PAL
//   <CHAR> <#rrggbb> [name]   ONLY keys the base does not already carry
//                             (the section may be empty)
// The base must be a full (non-delta) sprite of identical dimensions.
// Materialization is pure: base rows with each override applied, palette
// = base palette overlaid with the delta's own keys.
export function parseDeltaPix(text, path) {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  let i = 0;
  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('#'))) i++;
  const head = (lines[i++] || '').trim().split(/\s+/);
  if (head[0] !== 'PIXD' || head.length < 5) {
    throw new Error(`${path}: bad header, want "PIXD <id> <base-id> <w> <h>"`);
  }
  const [, id, base, ws, hs] = head;
  const w = +ws, h = +hs;
  if (!id || !base || !Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0 || w > 256 || h > 256) {
    throw new Error(`${path}: bad dimensions in header`);
  }
  const deltas = [];
  const seen = new Set();
  while (i < lines.length && lines[i].trim() !== 'PAL') {
    const t = lines[i++].trim();
    if (t === '' || t.startsWith('#')) continue;
    const [xs, ys, ch] = t.split(/\s+/);
    const x = +xs, y = +ys;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) {
      throw new Error(`${path}: delta coord out of bounds "${t}"`);
    }
    if (!ch || ch.length !== 1) throw new Error(`${path}: bad delta char in "${t}"`);
    const key = x + ',' + y;
    if (seen.has(key)) throw new Error(`${path}: duplicate delta coord ${key}`);
    seen.add(key);
    deltas.push([x, y, ch]);
  }
  if (i >= lines.length) throw new Error(`${path}: want PAL section after deltas`);
  i++; // consume PAL
  const pal = {};
  while (i < lines.length) {
    const t = lines[i++].trim();
    if (t === '' || t.startsWith('#')) continue;
    const [ch, hex, ...name] = t.split(/\s+/);
    if (!ch || ch.length !== 1 || !/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      throw new Error(`${path}: bad palette line "${t}"`);
    }
    if (ch === '.') throw new Error(`${path}: '.' is reserved for transparency`);
    pal[ch] = { hex: hex.toLowerCase(), name: name.join(' ') || ch };
  }
  if (Object.keys(pal).length > 32) throw new Error(`${path}: palette cap violated: ${Object.keys(pal).length} > 32`);
  deltas.sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
  return { id, base, w, h, deltas, pal, path };
}

// Materialize a delta against its parsed base sprite -> full rows.
export function materializeDeltaRows(baseSprite, delta) {
  const rows = baseSprite.rows.map((r) => r.split(''));
  for (const [x, y, ch] of delta.deltas) rows[y][x] = ch;
  return rows.map((r) => r.join(''));
}

// Palette a delta sprite renders with: base keys overlaid by delta keys.
export function mergedDeltaPal(baseSprite, delta) {
  return { ...baseSprite.pal, ...delta.pal };
}

export function paintedCount(s) {
  let n = 0;
  for (const row of s.rows) for (const ch of row) if (ch !== '.') n++;
  return n;
}
