// Wave T51 rig: machine-validate the Astral candidate
// against the REAL audit code before anything lands
// (WAVE-T51-ASTRAL-PLAN.md §6/§7). Run: node validate.mjs
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t51/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t51/scripts/audit-placement.mjs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps();
const src = MAPS['celestic'];
const tiers = makeTiers(TILE_CHARS);
const towns = townSetOf(MAPS);
const kind = (rows, x, y) => TILE_CHARS[rows[y][x]];
let fails = 0;
const ok = (name, cond, detail = '') => { console.log((cond ? '  ok ' : '  FAIL ') + name + (cond ? '' : ' — ' + detail)); if (!cond) fails++; };

// candidate map: clerk re-seated (9,4); verbatim DIRS copies appended
const DIRS_TEXT = 'ASTRAL TOWN — East: ROUTE 210 — NORTH.';
const copies = COPY_SEATS.map(([x, y]) => ({ x, y, text: DIRS_TEXT }));
const npcs = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 9, y: 4 } : n));
const CAND = { ...src, rows: CANDIDATE, npcs, signs: [...src.signs, ...copies] };
const MAPS2 = { ...MAPS, celestic: CAND };

// 1. shape
ok('candidate shape 28x18', CANDIDATE.length === 18 && CANDIDATE.every((r) => [...r].length === 28));

// 2. stamps byte-preserved (segments of the candidate rows)
const seg = (y, x0, x1) => [...CANDIDATE[y]].slice(x0, x1 + 1).join('');
const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;
ok('center stamp', seg(2, 3, 6) === 'jklm' && seg(3, 3, 6) === 'AJKA', seg(2, 3, 6) + '/' + seg(3, 3, 6));
ok('mart stamp', seg(2, 9, 12) === 'deef' && seg(3, 9, 12) === 'P12P', seg(2, 9, 12) + '/' + seg(3, 9, 12));
ok('house stamp', seg(2, 15, 17) === CH['th-celestic'].repeat(3) && seg(3, 15, 17) === CH['tw-celestic'] + 's' + CH['tw-celestic'], seg(2, 15, 17) + '/' + seg(3, 15, 17));
ok('shrine walls + door', seg(3, 20, 23) === CH['tl-celestic'] + 's' + CH['tl-celestic'] + CH['tl-celestic'], seg(3, 20, 23));
ok('shrine roof = duskroof x4 (declared)', seg(2, 20, 23) === CH['duskroof'].repeat(4), seg(2, 20, 23));
ok('shrine forecourt coronetfloor x6', [2, 3, 4].every((y) => seg(y, 24, 25) === CH['coronetfloor'].repeat(2)));
ok('plaza block shrinefloor 45', (() => { let n = 0; for (let y = 11; y <= 15; y++) for (let x = 3; x <= 11; x++) if (CANDIDATE[y][x] === CH['shrinefloor']) n++; return n === 45; })());

// 3. warps / npcs / signs / encounters
ok('warps deep-equal', JSON.stringify(CAND.warps) === JSON.stringify(src.warps));
const shippedNpc = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 9, y: 4 } : n));
ok('npcs: clerk (9,4), all else byte-equal', JSON.stringify(npcs) === JSON.stringify(shippedNpc));
ok('shipped signs byte-present', src.signs.every((s) => CAND.signs.some((t) => t.x === s.x && t.y === s.y && t.text === s.text)));
ok('DIRS copies verbatim at seats', copies.every((c) => CAND.signs.some((s) => s.x === c.x && s.y === c.y && s.text === DIRS_TEXT)));
ok('encounters deep-equal', JSON.stringify(CAND.encounters) === JSON.stringify(src.encounters));

// 4. walkability of every post, landing, exit and the start
const walk = (x, y) => WALKABLE.has(CANDIDATE[y][x]);
for (const n of npcs) ok('npc post walkable ' + n.name, walk(n.x, n.y), n.x + ',' + n.y);
for (const w of src.warps) {
  if (w.via) ok('via walkable -> ' + w.to.map, walk(w.via.x, w.via.y));
  ok('warp cell walkable -> ' + w.to.map + ' @' + w.x + ',' + w.y, walk(w.x, w.y));
}
for (const [id, mm] of Object.entries(MAPS)) for (const w of mm.warps || [])
  if (w.to && w.to.map === 'celestic') ok('inbound landing walkable from ' + id, walk(w.to.x, w.to.y), w.to.x + ',' + w.to.y);
ok('start (26,8) walkable', walk(26, 8));
ok('cottage step-offs walkable', walk(23, 7) && walk(23, 16));

// 5. diff discipline: every changed cell is a declared class
const ALLOWED = new Set([
  'tg2-celestic>moonfloor', 'tg-celestic>moonfloor', 'tg2-celestic>tg-celestic',
  'tr-celestic>duskroof',
  'tg2-celestic>th-celestic', 'tg-celestic>th-celestic',
  'tg2-celestic>tw-celestic', 'tg-celestic>tw-celestic',
  'tg2-celestic>door-house', 'tg-celestic>door-house',
  'tg-celestic>sign', 'tg2-celestic>sign',
  'tg2-celestic>ringstone', 'tg-celestic>ringstone',
  'tg2-celestic>muralpanel', 'tg-celestic>muralpanel',
]);
const counts = {}; let changed = 0; const bad = [];
for (let y = 0; y < CANDIDATE.length; y++) for (let x = 0; x < [...CANDIDATE[y]].length; x++) {
  const a = kind(src.rows, x, y), b = kind(CANDIDATE, x, y);
  if (a === b) continue;
  changed++;
  const key = a + '>' + b;
  counts[key] = (counts[key] || 0) + 1;
  if (!ALLOWED.has(key)) bad.push(`${x},${y} ${key}`);
}
ok('diff discipline (declared classes only)', bad.length === 0, bad.slice(0, 8).join('; '));
console.log('  changed cells:', changed, JSON.stringify(counts));
ok('tg2 retired', !CANDIDATE.join('').includes(CH['tg2-celestic']));

// 6. the real audit on the candidate
const r = await scoreTown('celestic', MAPS2, WALKABLE, tiersFor('celestic', tiers));
const clarity = analyzeMap('celestic', CAND, { WALKABLE, tiers, townSet: towns });
const gate = gateCheck(r, clarity);
const tuple = [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot,
  r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged,
  r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny,
  +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)];
console.log('  tuple:', JSON.stringify(tuple));
console.log('  junctionSites:', JSON.stringify(r.junctionSites), 'bare:', r.junctionsBare);
console.log('  connFails:', JSON.stringify(r.connFails || []));
console.log('  examples:', JSON.stringify(r.examples || []));
ok('STRICT GATES PASS', gate.pass === true, JSON.stringify(gate.gates.filter((g) => !g.ok)));
ok('one network component', r.netComponents === 1, String(r.netComponents));
ok('apronMin >= 0.6', r.apronMin >= 0.6, String(r.apronMin));

console.log(fails === 0 ? 'VALIDATOR: ALL PASS' : `VALIDATOR: ${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
