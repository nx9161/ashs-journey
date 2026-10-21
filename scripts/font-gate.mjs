// font-gate.mjs — UI v2.4 build gate: prove the EXACT shipped body-font
// bytes carry full basic Latin, in pure Node (no fontTools dependency).
//
// Why this exists: UI v2.1–v2.3 shipped three consecutive body faces whose
// gates "verified" fonts by computed-style strings and width identity —
// proofs that pass even when the rendered glyphs are wrong (see
// docs/ui-v24-root-cause.md). A cmap dump cannot lie about coverage: if
// U+0020–007E are not in the shipped bytes, the build FAILS here.
//
// The body face ships as WOFF (v1) precisely so this parser stays simple:
// WOFF table data is per-table zlib, and cmap is stored untransformed.
// (WOFF2's shared brotli stream + glyf transforms would need a real
// decoder; the Galmuri display faces stay WOFF2 and are not gated here.)
//
// Usage:
//   node scripts/font-gate.mjs <file.woff> [more.woff...]
//   import { woffCmapCodepoints, assertBasicLatin } from './font-gate.mjs'

import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function woffCmapCodepoints(buf) {
  if (buf.length < 44 || buf.readUInt32BE(0) !== 0x774f4646) {
    throw new Error('not a WOFF file (bad signature)');
  }
  const numTables = buf.readUInt16BE(12);
  let cmap = null;
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = buf.toString('ascii', o, o + 4);
    if (tag !== 'cmap') continue;
    const offset = buf.readUInt32BE(o + 4);
    const compLen = buf.readUInt32BE(o + 8);
    const origLen = buf.readUInt32BE(o + 12);
    const raw = buf.subarray(offset, offset + compLen);
    cmap = compLen < origLen ? inflateSync(raw) : Buffer.from(raw);
    break;
  }
  if (!cmap) throw new Error('WOFF has no cmap table');
  return parseCmap(cmap);
}

function parseCmap(cmap) {
  const numTables = cmap.readUInt16BE(2);
  let fmt12 = -1;
  let fmt4 = -1;
  for (let i = 0; i < numTables; i++) {
    const off = cmap.readUInt32BE(4 + i * 8 + 4);
    if (off <= 0 || off + 2 > cmap.length) continue;
    const fmt = cmap.readUInt16BE(off);
    if (fmt === 12 && fmt12 < 0) fmt12 = off;
    if (fmt === 4 && fmt4 < 0) fmt4 = off;
  }
  const set = new Set();
  if (fmt12 >= 0) {
    const nGroups = cmap.readUInt32BE(fmt12 + 12);
    for (let g = 0; g < nGroups; g++) {
      const o = fmt12 + 16 + g * 12;
      const start = cmap.readUInt32BE(o);
      const end = cmap.readUInt32BE(o + 4);
      for (let c = start; c <= end && c <= 0x10ffff; c++) set.add(c);
    }
    return set;
  }
  if (fmt4 >= 0) {
    const segCount = cmap.readUInt16BE(fmt4 + 6) / 2;
    const endOff = fmt4 + 14;
    const startOff = endOff + 2 * segCount + 2;
    for (let s = 0; s < segCount; s++) {
      const end = cmap.readUInt16BE(endOff + s * 2);
      const start = cmap.readUInt16BE(startOff + s * 2);
      if (start === 0xffff && end === 0xffff) continue;
      for (let c = start; c <= end; c++) set.add(c);
    }
    return set;
  }
  throw new Error('cmap has no format 12 or format 4 subtable');
}

// The gate assertion: every printable ASCII codepoint (U+0020–U+007E)
// must be covered by the shipped bytes.
export function assertBasicLatin(buf, label) {
  const set = woffCmapCodepoints(buf);
  const missing = [];
  for (let c = 0x20; c <= 0x7e; c++) if (!set.has(c)) missing.push(c);
  return {
    ok: missing.length === 0,
    label: label || 'font',
    covered: 95 - missing.length,
    missing,
    totalGlyphs: set.size,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('usage: node scripts/font-gate.mjs <file.woff> [...]');
    process.exit(2);
  }
  let failed = 0;
  for (const f of files) {
    try {
      const r = assertBasicLatin(readFileSync(f), f);
      if (r.ok) {
        console.log('pass  font-gate ' + f + ' — basic Latin 95/95 (cmap codepoints: ' + r.totalGlyphs + ')');
      } else {
        failed++;
        console.error('FAIL  font-gate ' + f + ' — missing ' + r.missing.length + ' basic Latin codepoints: '
          + r.missing.map((c) => 'U+' + c.toString(16).toUpperCase().padStart(4, '0')).join(' '));
      }
    } catch (e) {
      failed++;
      console.error('FAIL  font-gate ' + f + ' — ' + e.message);
    }
  }
  process.exit(failed ? 1 : 0);
}
