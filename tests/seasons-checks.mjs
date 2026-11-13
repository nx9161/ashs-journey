// seasons-checks.mjs — Wave SZ (owner order 2026-11-12): SEASONS REMOVED.
// This file used to pin the season system (monthly rotation, seasonal
// palette grades, tints). It is now the PERMANENT GUARD against its
// return: the season module must not exist, no source may reference the
// season API, and the tile cache must render byte-identical output no
// matter what the calendar says — one fixed, authored palette per place.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtTileCache } from '../src/engine/art.mjs';

let fail = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); fail = 1; } };
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- 1. the module and its wiring are gone ------------------------------
ok(!fs.existsSync(path.join(ROOT, 'src/game/seasons.mjs')), 'src/game/seasons.mjs does not exist');
const order = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/module-order.json'), 'utf8'));
ok(!order.some((p) => String(p).toLowerCase().includes('season')), 'module-order.json lists no season module');

const API_TOKENS = ['seasons.mjs', 'seasonForDate', 'seasonTintFor', 'seasonalHex', 'seasonalSwapFor',
  'seasonalSwapForKit', 'currentSeason', 'SEASON_ORDER', 'SEASON_STYLE', '_hudSeason', 'Season — '];
function scanTree(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { scanTree(p); continue; }
    if (!ent.name.endsWith('.mjs')) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const tok of API_TOKENS) {
      ok(!text.includes(tok), path.relative(ROOT, p) + ' must not reference ' + tok);
    }
  }
}
scanTree(path.join(ROOT, 'src'));
scanTree(path.join(ROOT, 'scripts'));

// ---- 2. date-independence: the cache is identical in every month -------
// Recording stub document: every canvas logs its fill ops, so two cache
// builds can be compared exactly, palettes included.
function makeDoc() {
  return {
    createElement: () => {
      const cv = { width: 0, height: 0, ops: [] };
      cv.getContext = () => {
        const target = {
          fillStyle: '#000000',
          fillRect(x, y, w, h) { cv.ops.push(target.fillStyle + '@' + x + ',' + y + ',' + w + 'x' + h); },
        };
        return new Proxy(target, {
          get: (t, p) => (p in t ? t[p] : () => {}),
          set: (t, p, v) => { t[p] = v; return true; },
        });
      };
      return cv;
    },
  };
}
function serialize(v) {
  if (v && typeof v === 'object') {
    if (Array.isArray(v.ops)) return 'CV(' + v.ops.join(';') + ')';
    if (Array.isArray(v)) return '[' + v.map(serialize).join(',') + ']';
    return '{' + Object.keys(v).sort().map((k) => k + ':' + serialize(v[k])).join(',') + '}';
  }
  return String(v);
}
const RealDate = Date;
function freezeDate(iso) {
  const t = new RealDate(iso).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [t])); }
    static now() { return t; }
  };
}
const builds = [];
for (const iso of ['2026-01-15T12:00:00', '2026-04-15T12:00:00', '2026-07-15T12:00:00', '2026-11-15T12:00:00']) {
  freezeDate(iso);
  builds.push(serialize(buildArtTileCache(makeDoc())));
}
globalThis.Date = RealDate;
for (let i = 1; i < builds.length; i++) {
  ok(builds[i] === builds[0], 'tile cache identical across calendar months (build 0 vs ' + i + ')');
}

// ---- 3. the fixed look IS the authored base palette ----------------------
// Under the removed system a November build wore the Autumn grade, which
// moved both of these greens. They must render exactly as authored now.
ok(builds[0].includes('#6b9e5d'), 'authored tile-grass base green renders ungraded');
ok(builds[0].includes('#008100'), 'authored kit-grass green renders ungraded');

console.log(fail ? 'seasons-checks FAILED' : 'seasons-checks: all PASS (seasons removed — fixed palette in every month)');
process.exit(fail);
