// art-gate.mjs — Black 2 graphics imposition (docs/black2-baseline.md, B2-G1/G2).
// Enforces, against the GENERATED registry assets/sprites/art-data.mjs:
//   (a) B2-G1: every battle-sprite entry sits on the standard battle canvas
//       (caps.battleCanvas) — Black 2 put 3,607 of 4,480 validated graphics on
//       one 256x128 battle canvas; ours is one canvas too, no exceptions.
//   (b) B2-G2: the number of entries using >16 colors (Black 2: 97% of 2D art
//       is 4bpp/16-color) may not exceed the frozen ceiling measured
//       2026-11-11 (caps.maxOver16ColorEntries). New art lives at <=16 colors;
//       the legacy exceedances are a ceiling that may only shrink.
// Used colors are counted on the MATERIALIZED raster: derived entries
// (base+deltas / base+shiftY) are resolved through their base chain, exactly
// as the engine renders them. Zero-dependency, Node stdlib only (repo rule).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART } from '../assets/sprites/art-data.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const caps = JSON.parse(fs.readFileSync(path.join(root, 'scripts/art-gate.caps.json'), 'utf8'));
const [capW, capH] = caps.battleCanvas.split('x').map(Number);

// Battle-sprite entries: species/partner fronts and backs plus their derived
// companions (-bob layout pair, -accent delta pair). Trainer battle art
// (<name>-battle, 48x64) is a different, separately-uniform class — not matched.
const BATTLE_RE = /^[a-z][a-z0-9]*-(front|back)(-(bob|accent))?$/;

const memo = new Map();
function rowsOf(key, depth = 0) {
  if (memo.has(key)) return memo.get(key);
  if (depth > 8) throw new Error(`art-gate: derivation chain too deep at ${key}`);
  const e = ART[key];
  let rows;
  if (e.rows) {
    rows = e.rows;
  } else {
    if (!ART[e.base]) throw new Error(`art-gate: ${key} derives from missing base ${e.base}`);
    const base = rowsOf(e.base, depth + 1).map((r) => r.split(''));
    if (e.deltas) for (const [x, y, c] of e.deltas) base[y][x] = c;
    rows = base.map((r) => r.join('')); // shiftY entries: same colors, same canvas
  }
  memo.set(key, rows);
  return rows;
}
function usedColors(key) {
  const s = new Set();
  for (const r of rowsOf(key)) for (const ch of r) if (ch !== '.') s.add(ch);
  return s.size;
}

let fail = 0;
const keys = Object.keys(ART);

// (a) battle canvas discipline
const battle = keys.filter((k) => BATTLE_RE.test(k));
const offCanvas = battle.filter((k) => ART[k].w !== capW || ART[k].h !== capH);
if (offCanvas.length) {
  fail = 1;
  console.log(`art-gate: B2-G1 FAIL — ${offCanvas.length} battle entries off the ${caps.battleCanvas} canvas: ${offCanvas.slice(0, 8).join(', ')}`);
}

// (b) 16-color discipline ceiling
let over = 0;
for (const k of keys) if (usedColors(k) > 16) over++;
if (over > caps.maxOver16ColorEntries) {
  fail = 1;
  console.log(`art-gate: B2-G2 FAIL — ${over} entries use >16 colors, ceiling is ${caps.maxOver16ColorEntries} (frozen 2026-11-11, shrink-only)`);
}

console.log(`art-gate: ${keys.length} entries · ${battle.length} battle entries on ${caps.battleCanvas} (${offCanvas.length} off-canvas) · ${over}/${caps.maxOver16ColorEntries} entries >16 colors — ${fail ? 'GATE FAILED' : 'gate PASS'}`);
process.exit(fail);
