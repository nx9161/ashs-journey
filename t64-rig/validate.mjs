// Wave T64 rig: machine-validate the Sanctum candidate against
// the REAL audit code before anything lands
// (WAVE-T64-SANCTUM-PLAN.md §6/§7). Run: node validate.mjs
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-placement.mjs';
import { CANDIDATE, COPY_SEATS, LANE } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps();
const src = MAPS['shamouti'];
const tiers = makeTiers(TILE_CHARS);
let fails = 0;
const ok = (name, cond, detail = '') => { console.log((cond ? '  ok ' : '  FAIL ') + name + (cond ? '' : ' — ' + detail)); if (!cond) fails++; };

const DIRS_TEXT = src.signs.find((s) => s.x === 8 && s.y === 7).text;
const copies = COPY_SEATS.map(([x, y]) => ({ x, y, text: DIRS_TEXT }));
const npcs = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 19, y: 4 } : n));
const CAND = { ...src, rows: CANDIDATE, npcs, signs: [...src.signs, ...copies] };
const MAPS2 = { ...MAPS, shamouti: CAND };

ok('candidate shape 28x18', CANDIDATE.length === 18 && CANDIDATE.every((r) => [...r].length === 28));

const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;
const seg = (y, x0, x1) => [...CANDIDATE[y]].slice(x0, x1 + 1).join('');
const srcSeg = (y, x0, x1) => [...src.rows[y]].slice(x0, x1 + 1).join('');
const kindCount = (kname) => { let n = 0; for (const r of CANDIDATE) for (const ch of r) if (TILE_CHARS[ch] === kname) n++; return n; };

ok('shrine stamp walls+door byte-equal (row 3)', seg(3, 3, 6) === srcSeg(3, 3, 6), seg(3, 3, 6));
ok('shrine roof = shrineroof x4', seg(2, 3, 6) === CH['shrineroof'].repeat(4), seg(2, 3, 6));
ok('center stamp byte-equal', seg(2, 9, 12) === srcSeg(2, 9, 12) && seg(3, 9, 12) === srcSeg(3, 9, 12));
ok('house stamp byte-equal', seg(2, 15, 17) === srcSeg(2, 15, 17) && seg(3, 15, 17) === srcSeg(3, 15, 17));
ok('mart stamp byte-equal (slate kept)', seg(2, 19, 22) === srcSeg(2, 19, 22) && seg(3, 19, 22) === srcSeg(3, 19, 22));
ok('encounter grass 15 byte-equal', kindCount('grass') === 15 && [[4, 8], [5, 8], [6, 8], [4, 9], [5, 9], [6, 9], [6, 12], [21, 12], [22, 12], [23, 12], [5, 13], [6, 13], [21, 13], [22, 13], [23, 13]].every(([x, y]) => CANDIDATE[y][x] === CH['grass']));
ok('path cells = 0', kindCount('path') === 0, 'got ' + kindCount('path'));
ok('stepfloor = 230 (round-4 candidate, transitions in plan §9)', kindCount('stepfloor') === 230, 'got ' + kindCount('stepfloor'));
ok('water = 128 (164 - 26 stepfloor - 10 rim sand)', kindCount('water') === 128, 'got ' + kindCount('water'));
ok('sand = 11 (35 + 10 rim - lane - 1 banner seat - 1 copy seat; the (18,2) copy stands on a lane cell, fabric-neutral, validator-measured)', kindCount('sand') === 11, 'got ' + kindCount('sand'));
ok('signpost re-seated (23,3); (19,6)+(19,7) threaded', CANDIDATE[3][23] === CH['signpost'] && CANDIDATE[6][19] === CH['stepfloor'] && CANDIDATE[7][19] === CH['stepfloor']);
ok('tropgrass = 5 (30 - 2 lantern seats - lane)', kindCount('tropgrass') === 5, 'got ' + kindCount('tropgrass'));
ok('shrinefloor = 29 (30 - 1 plaza sign tile)', kindCount('shrinefloor') === 29, 'got ' + kindCount('shrinefloor'));
ok('flower = 0 (the clerk seat took it)', kindCount('flower') === 0, 'got ' + kindCount('flower'));
ok('roof-teal = 0 (shrine re-crowned)', kindCount('roof-teal-m') + kindCount('roof-teal-l') + kindCount('roof-teal-r') === 0);
ok('dressing byte-counts (feststand 5, shrinegate 4, tree 3, palm 3, rock 3, lifering 3, lamp 2, signpost 1, bench 1)', kindCount('feststand') === 5 && kindCount('shrinegate') === 4 && kindCount('tree') === 3 && kindCount('palm') === 3 && kindCount('rock') === 3 && kindCount('lifering') === 3 && kindCount('lamp') === 2 && kindCount('signpost') === 1 && kindCount('bench') === 1);
ok('sign tiles at (13,9),(8,7),(8,10),(3,14),(19,5)', [[13, 9], [8, 7], [8, 10], [3, 14], [19, 5]].every(([x, y]) => CANDIDATE[y][x] === CH['sign']));
ok('props seated', CANDIDATE[6][17] === CH['festlantern'] && CANDIDATE[13][18] === CH['festlantern'] && CANDIDATE[15][16] === CH['fairbanner']);
ok('clerk cell (19,4) is stepfloor', CANDIDATE[4][19] === CH['stepfloor']);
ok('DIRS copies verbatim at seats', copies.every((c) => CAND.signs.some((s) => s.x === c.x && s.y === c.y && s.text === DIRS_TEXT)) && COPY_SEATS.every(([x, y]) => CANDIDATE[y][x] === CH['sign']));

ok('warps deep-equal', JSON.stringify(CAND.warps) === JSON.stringify(src.warps));
const shippedNpc = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 19, y: 4 } : n));
ok('npcs: clerk (19,4), all else byte-equal', JSON.stringify(npcs) === JSON.stringify(shippedNpc));
ok('shipped signs byte-present', src.signs.every((s) => CAND.signs.some((t) => t.x === s.x && t.y === s.y && t.text === s.text)));
ok('encounters deep-equal', JSON.stringify(CAND.encounters) === JSON.stringify(src.encounters));

const walk = (x, y) => WALKABLE.has(CANDIDATE[y][x]);
for (const n of npcs) {
  // ORAPOTAM's shipped post stands ON a grass encounter cell
  // (6,12) beside its rock — a byte-preserved plot post (the
  // T30 PIOTR precedent), asserted byte-equal, not walkable-tier.
  if (n.name === 'ORAPOTAM') { ok('npc post byte-equal ORAPOTAM (grass plot, shipped)', CANDIDATE[n.y][n.x] === src.rows[n.y][n.x] && TILE_CHARS[CANDIDATE[n.y][n.x]] === 'grass'); continue; }
  ok('npc post walkable ' + n.name, walk(n.x, n.y), n.x + ',' + n.y);
}
for (const w of src.warps) {
  if (w.via) ok('via walkable -> ' + w.to.map, walk(w.via.x, w.via.y));
  ok('warp cell walkable -> ' + w.to.map + ' @' + w.x + ',' + w.y, walk(w.x, w.y));
}
ok('all 8 surf exits stand on stepfloor (jetty heads)', [[2, 17], [3, 17], [0, 8], [0, 9], [27, 8], [27, 9], [13, 0], [14, 0]].every(([x, y]) => CANDIDATE[y][x] === CH['stepfloor']));
for (const [id, mm] of Object.entries(MAPS)) for (const w of mm.warps || [])
  if (w.to && w.to.map === 'shamouti') {
    if (TILE_CHARS[src.rows[w.to.y][w.to.x]] === 'water')
      ok('inbound sea landing stays water from ' + id, TILE_CHARS[CANDIDATE[w.to.y][w.to.x]] === 'water', w.to.x + ',' + w.to.y);
    else ok('inbound landing walkable from ' + id, walk(w.to.x, w.to.y), w.to.x + ',' + w.to.y);
  }
ok('start (14,15) walkable', walk(14, 15));

const clarity = analyzeMap('shamouti', CAND, { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const r = await scoreTown('shamouti', MAPS2, WALKABLE, tiersFor('shamouti', tiers));
const gate = gateCheck(r, clarity);
console.log('GATE:', JSON.stringify(gate));
console.log('examples:', JSON.stringify(r.examples));
console.log('connFails:', JSON.stringify(r.connFails));
console.log('junctionSites:', JSON.stringify(r.junctionSites), 'junctions:', r.junctions, 'bare:', r.junctionsBare);
console.log('GUARD TUPLE:', JSON.stringify([gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged, r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny, +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)]));
console.log('netCompSizes:', JSON.stringify(r.netCompSizes));
console.log('buildings:', r.buildings, 'apronMin:', r.apronMin, 'apronLow:', r.apronLow, 'onFabric:', JSON.stringify(r.onFabricList), 'shoulder:', JSON.stringify(r.shoulderList), 'unanchored:', r.unanchoredAny, '/', r.decor);
// DISCLOSED EXCEPTION (plan §7, BLOCKED-FABRIC-GATE.md): the
// fabric gate alone fails — ceiling.mjs proves no lawful grid
// passes (superset 0.9704; plots cause 93% of the deficit).
// Every OTHER gate must pass; the pin lands with pass flag 0.
ok('DISCLOSED EXCEPTION: only the fabric gate fails', gate.gates.every((g) => g.name.startsWith('fabric') ? !g.ok : g.ok), JSON.stringify(gate.gates.filter((g) => !g.ok)));
console.log(fails === 0 ? 'VALIDATE: ALL OK' : 'VALIDATE: ' + fails + ' FAILS');
process.exit(fails ? 1 : 0);
