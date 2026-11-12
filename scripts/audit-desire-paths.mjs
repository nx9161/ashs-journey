// audit-desire-paths.mjs — Wave H permanent desire-path audit.
//
// Measures LEGIBILITY, not existence: for every map, A* shortest routes
// between every pair of points of interest (warps, start, signs, NPCs,
// items, events — same POI model as shipped audit-reachability), then
// scores what fraction of each route runs on constructed surface.
//
// Surface tiers (kinds from src/engine/tiles.mjs):
//   pathTier — Phase 1 "strict", kept verbatim for continuity with
//              WAVE-H-CENSUS.md: kind 'path', *floor, rugs/mats,
//              boardwalk, harbourstone, step, door*, psand*.
//   strict   — pathTier + tg2-* (the town walkway material). Phase 1
//              excluded tg2 only because it occurred 0 times inside
//              the 62 settlements; it IS a constructed walkway, and
//              the Phase 2 gates (strict >= 0.60) are defined on it.
//   fabric   — strict + tg-* (undifferentiated town ground).
//
// Usage:
//   node scripts/audit-desire-paths.mjs [--map id[,id...]] [--class c]
//        [--overlay file.json] [--json out.json] [--routes-out file]
// Overlay JSON: { "<mapId>": { "rows": [...], "signs": [...] } } —
// scores a proposed redress before it lands (Wave H Phase 2 workflow).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(resolve(ROOT, p));

export async function loadMaps(overlay = {}) {
  const base = await imp('src/data/maps.mjs');
  const MAPS = base.MAPS;
  for (let i = 2; i <= 9; i++) {
    const mm = await imp(`src/data/maps${i}.mjs`);
    Object.assign(MAPS, mm[`MAPS${i}`]); // named export (maps7 exports DIVE_PAIRS first)
  }
  for (const [id, ov] of Object.entries(overlay)) {
    if (!MAPS[id]) continue;
    if (ov.rows) MAPS[id] = { ...MAPS[id], rows: ov.rows };
    if (ov.signs) MAPS[id] = { ...MAPS[id], signs: ov.signs };
  }
  const tiles = await imp('src/engine/tiles.mjs');
  return { MAPS, WALKABLE: base.WALKABLE, TILE_CHARS: tiles.TILE_CHARS };
}

const DRESSED_KINDS = new Set(['rug', 'rug2', 'rug3', 'battlemat', 'redcarpet', 'boardwalk', 'harbourstone', 'step']);
export function makeTiers(TILE_CHARS) {
  const kind = (ch) => TILE_CHARS[ch] || ('raw:' + ch);
  const isPathTier = (ch) => { const k = kind(ch); return k === 'path' || k.endsWith('floor') || DRESSED_KINDS.has(k) || k.startsWith('door') || k.startsWith('psand'); };
  const isStrict = (ch) => isPathTier(ch) || kind(ch).startsWith('tg2-');
  const isFabric = (ch) => isStrict(ch) || kind(ch).startsWith('tg-');
  const isNetwork = (ch) => { const k = kind(ch); return k === 'path' || k.startsWith('psand') || k.startsWith('tg2-'); };
  return { kind, isPathTier, isStrict, isFabric, isNetwork, TILE_CHARS };
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const INTERIOR_FLOOR = new Set(['!', '$', '*', '+', '-']);
const DUNGEON_FLOOR = new Set(['L', 'Q', '%', '&']);

export function townSetOf(MAPS) {
  return new Set(Object.keys(MAPS).filter(id => {
    const t = new Set((MAPS[id].warps || []).map(w => w.to && w.to.map));
    return t.has('center') || t.has('mart');
  }));
}

function classify(id, m, WALKABLE, townSet) {
  if (townSet.has(id)) return 'settlement';
  let walk = 0, intf = 0, dunf = 0;
  for (const row of m.rows) for (const ch of row) if (WALKABLE.has(ch)) { walk++; if (INTERIOR_FLOOR.has(ch)) intf++; if (DUNGEON_FLOOR.has(ch)) dunf++; }
  if (walk && intf / walk >= 0.5) return 'interior';
  if (walk && dunf / walk >= 0.5) return 'dungeon';
  return 'route';
}

// Multi-source A* -> any goal tile; tiles in T are terminal (never transited).
function astar(m, W, H, WALKABLE, warpSet, T, srcSet, goalSet) {
  const key = (x, y) => y * W + x;
  const walk = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const ch = m.rows[y][x]; return WALKABLE.has(ch) || warpSet.has(key(x, y)); };
  const pass = (x, y) => walk(x, y) && (goalSet.has(key(x, y)) || srcSet.has(key(x, y)) || !T.has(key(x, y)));
  const came = new Map(), gs = new Map();
  const pq = [];
  for (const s of srcSet) { const x = s % W, y = (s / W) | 0; if (!walk(x, y)) continue; gs.set(s, 0); pq.push([0, s]); }
  const h = (x, y) => { let best = 1e9; for (const g of goalSet) { const d = Math.abs(x - (g % W)) + Math.abs(y - ((g / W) | 0)); if (d < best) best = d; } return best; };
  while (pq.length) {
    let bi = 0; for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[bi][0]) bi = i;
    const [, cur] = pq.splice(bi, 1)[0];
    if (goalSet.has(cur) && !srcSet.has(cur)) {
      const path = [cur]; let c = cur; while (came.has(c)) { c = came.get(c); path.push(c); } path.reverse();
      return path.map(k => [k % W, (k / W) | 0]);
    }
    const cx = cur % W, cy = (cur / W) | 0, cg = gs.get(cur);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (!pass(nx, ny)) continue;
      const nk = key(nx, ny), ng = cg + 1;
      if (ng < (gs.get(nk) ?? 1e9)) { gs.set(nk, ng); came.set(nk, cur); const f = ng + h(nx, ny); const ex = pq.findIndex(p => p[1] === nk); if (ex >= 0) pq[ex][0] = f; else pq.push([f, nk]); }
    }
  }
  return null;
}

export function analyzeMap(id, m, ctx) {
  const { WALKABLE, tiers, townSet } = ctx;
  const { kind, isPathTier, isStrict, isFabric } = tiers;
  const H = m.rows.length, W = m.rows[0].length;
  const key = (x, y) => y * W + x;
  const warps = m.warps || [];
  const warpSet = new Set(warps.map(w => key(w.x, w.y)));
  const cell = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? m.rows[y][x] : '#';
  const walkCell = (x, y) => WALKABLE.has(cell(x, y)) || warpSet.has(key(x, y));
  const T = new Set();
  for (const w of warps) { const k = kind(cell(w.x, w.y)); if (w.via || k.startsWith('door')) T.add(key(w.x, w.y)); }
  const pois = [];
  warps.forEach((w) => pois.push({ t: 'warp', label: 'warp->' + (w.to && w.to.map), access: new Set([key(w.x, w.y)]) }));
  if (m.start) pois.push({ t: 'start', label: 'start', access: new Set([key(m.start.x, m.start.y)]) });
  const neighAccess = (x, y) => { const s = new Set(); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (walkCell(nx, ny) && !T.has(key(nx, ny))) s.add(key(nx, ny)); } return s; };
  for (const s of m.signs || []) { let a = neighAccess(s.x, s.y); if (!a.size && walkCell(s.x, s.y)) a = new Set([key(s.x, s.y)]); if (a.size) pois.push({ t: 'sign', label: 'sign@' + s.x + ',' + s.y, access: a }); }
  for (const n of m.npcs || []) { const a = neighAccess(n.x, n.y); if (a.size) pois.push({ t: 'npc', label: 'npc ' + (n.name || '') + '@' + n.x + ',' + n.y, access: a }); }
  for (const it of m.items || []) if (walkCell(it.x, it.y)) pois.push({ t: 'item', label: 'item@' + it.x + ',' + it.y, access: new Set([key(it.x, it.y)]) });
  for (const ev of m.events || []) if (walkCell(ev.x, ev.y)) pois.push({ t: 'event', label: 'event ' + (ev.id || '') + '@' + ev.x + ',' + ev.y, access: new Set([key(ev.x, ev.y)]) });
  const seen = new Set(); const q = [];
  for (const p of pois) if (p.t === 'warp' || p.t === 'start') for (const k of p.access) if (walkCell(k % W, (k / W) | 0)) { seen.add(k); q.push(k); }
  while (q.length) { const c = q.pop(), cx = c % W, cy = (c / W) | 0; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, nk = key(nx, ny); if (!seen.has(nk) && walkCell(nx, ny)) { seen.add(nk); q.push(nk); } } }
  const inSeen = (set) => [...set].some(k => seen.has(k));
  let pairs = 0, unreach = 0, doorT = 0, degen = 0, sumP = 0, sumS = 0, sumF = 0, lt50 = 0, zero = 0, minS = 1;
  const routes = [];
  for (let i = 0; i < pois.length; i++) for (let j = i + 1; j < pois.length; j++) {
    const A = pois[i], B = pois[j];
    const sigA = [...A.access].sort().join(';'), sigB = [...B.access].sort().join(';');
    if (sigA === sigB || [...A.access].some(k => B.access.has(k))) { degen++; continue; }
    const path = astar(m, W, H, WALKABLE, warpSet, T, A.access, B.access);
    if (!path) { if (inSeen(A.access) && inSeen(B.access)) doorT++; else unreach++; continue; }
    pairs++;
    let dP = 0, dS = 0, dF = 0;
    for (const [x, y] of path) { const ch = cell(x, y); if (isPathTier(ch)) dP++; if (isStrict(ch)) dS++; if (isFabric(ch)) dF++; }
    const fP = dP / path.length, fS = dS / path.length, fF = dF / path.length;
    sumP += fP; sumS += fS; sumF += fF; if (fS < minS) minS = fS; if (fS < 0.5) lt50++; if (fS === 0) zero++;
    if (routes.length < 400) routes.push({ a: A.label, b: B.label, fStrict: +fS.toFixed(3), fPath: +fP.toFixed(3), path });
  }
  return {
    id, name: m.name || id, cls: classify(id, m, WALKABLE, townSet), W, H, pois: pois.length,
    pairs, unreachable: unreach, doorTransit: doorT, degenerate: degen,
    meanPath: pairs ? +(sumP / pairs).toFixed(4) : null,
    meanStrict: pairs ? +(sumS / pairs).toFixed(4) : null,
    meanFabric: pairs ? +(sumF / pairs).toFixed(4) : null,
    minStrict: pairs ? +minS.toFixed(3) : null, lt50, zero, routes,
  };
}

export async function analyzeAll({ overlay = {}, only = null, cls = null } = {}) {
  const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(overlay);
  const tiers = makeTiers(TILE_CHARS);
  const townSet = townSetOf(MAPS);
  const ctx = { WALKABLE, tiers, townSet };
  const out = [];
  for (const [id, m] of Object.entries(MAPS)) {
    if (!m.rows || !m.rows.length) continue;
    if (only && !only.has(id)) continue;
    const r = analyzeMap(id, m, ctx);
    if (cls && r.cls !== cls) continue;
    out.push(r);
  }
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const overlay = opt('--overlay') ? JSON.parse(readFileSync(opt('--overlay'), 'utf8')) : {};
  const only = opt('--map') ? new Set(opt('--map').split(',')) : null;
  const results = await analyzeAll({ overlay, only, cls: opt('--class') });
  const scored = results.filter(r => r.pairs > 0);
  const G = { pairs: 0, sumS: 0, sumF: 0, sumP: 0, lt50: 0, zero: 0 };
  for (const r of scored) { G.pairs += r.pairs; G.sumS += r.meanStrict * r.pairs; G.sumF += r.meanFabric * r.pairs; G.sumP += r.meanPath * r.pairs; G.lt50 += r.lt50; G.zero += r.zero; }
  console.log(`maps scored: ${results.length} | pairs: ${G.pairs} | mean strict ${G.pairs ? (G.sumS / G.pairs).toFixed(4) : '-'} | mean fabric ${G.pairs ? (G.sumF / G.pairs).toFixed(4) : '-'} | mean pathTier ${G.pairs ? (G.sumP / G.pairs).toFixed(4) : '-'} | pairs <50% strict: ${G.lt50} | zero: ${G.zero}`);
  const worst = scored.filter(r => r.cls === 'settlement' || r.id === 'pallet').sort((a, b) => a.meanStrict - b.meanStrict).slice(0, 20);
  console.log('LOWEST STRICT (settlements + pallet):');
  for (const r of worst) console.log(`  ${r.id} (${r.name}) strict=${r.meanStrict} fabric=${r.meanFabric} pathTier=${r.meanPath} pairs=${r.pairs} lt50=${r.lt50} zero=${r.zero}`);
  if (only) for (const r of results) console.log(`${r.id}: strict=${r.meanStrict} fabric=${r.meanFabric} pathTier=${r.meanPath} pairs=${r.pairs} pois=${r.pois} unreach=${r.unreachable} doorTransit=${r.doorTransit}`);
  if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify(results.map(({ routes, ...r }) => r), null, 1));
  if (opt('--routes-out')) { const store = {}; for (const r of results) store[r.id] = r.routes; writeFileSync(opt('--routes-out'), JSON.stringify(store)); }
}
