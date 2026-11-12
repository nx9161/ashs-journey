// wfc-tiled.mjs — Wave H WaveFunctionCollapse tool (SimpleTiled model).
//
// Algorithm basis: mxgmn/WaveFunctionCollapse (MIT, (c) 2016 Maxim
// Gumin) — reimplemented natively for this engine; NONE of that repo's
// sample images/tiles are used (they sit outside its MIT grant, and
// our adjacency is learned from OUR OWN shipped maps only).
//
// Modes:
//   audit   — learn kind adjacency from the corpus (all maps, or all
//             but the target), then list every adjacent kind pair in
//             the target the corpus never produces: placement defects
//             in the WFC sense (a lamp inside a roof run, dirt against
//             a door face, ...). The desire-path + placement audits
//             remain the connectivity authorities; this is the texture
//             plausibility check.
//   propose — pin everything except the map's ground cells (tg-*/tg2-*
//             by default) and re-lay the ground with seeded SimpleTiled
//             WFC over the learned adjacency; emits an overlay JSON the
//             audit tools score via --overlay. A proposal is a DRAFT
//             for a human seat (Art Director) — it optimizes adjacency
//             plausibility, never connectivity or layout.
// Usage:
//   node scripts/wfc-tiled.mjs audit [--map id] [--top n]
//   node scripts/wfc-tiled.mjs propose --map id [--seed n] [--out overlay.json]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadMaps, makeTiers, townSetOf } from './audit-desire-paths.mjs';

const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const OPP = { n: 's', e: 'w', s: 'n', w: 'e' };
// Town-family kinds abstract to their prefix (tg-cerulean -> tg):
// adjacency is a property of the FAMILY, not the town — the same
// prefix-matching the engine's kit branch uses. Without this the
// corpus can never produce a held-out town's own pairs.
const FAM_RE = /^(tg2?|tc|td|th|tr|tl|tw|flora)-/;
export const famOf = (kind) => { const m = FAM_RE.exec(kind); return m ? m[1] : kind; };

export function learnAdjacency(MAPS, tiers, excludeId = null) {
  // adj.get(kind).get(dir) = Map(kindB -> count); freq = kind counts.
  const adj = new Map(); const freq = new Map();
  const addAdj = (a, dir, b) => {
    if (!adj.has(a)) adj.set(a, new Map());
    const dm = adj.get(a); if (!dm.has(dir)) dm.set(dir, new Map());
    const m = dm.get(dir); m.set(b, (m.get(b) || 0) + 1);
  };
  for (const [id, m] of Object.entries(MAPS)) {
    if (id === excludeId || !m.rows) continue;
    const H = m.rows.length, W = m.rows[0].length;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = famOf(tiers.kind(m.rows[y][x])); freq.set(a, (freq.get(a) || 0) + 1);
      for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        addAdj(a, dir, famOf(tiers.kind(m.rows[ny][nx])));
      }
    }
  }
  return { adj, freq };
}
const allows = (model, a, dir, b) => {
  const dm = model.adj.get(a); if (!dm) return false;
  const m = dm.get(dir); return !!m && m.has(b);
};

export function auditMap(id, MAPS, tiers, model) {
  const m = MAPS[id]; if (!m) return null;
  const H = m.rows.length, W = m.rows[0].length;
  const bad = new Map(); let pairs = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = famOf(tiers.kind(m.rows[y][x]));
    for (const dir of ['e', 's']) { // each unordered pair once
      const [dx, dy] = DIRS[dir]; const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const b = famOf(tiers.kind(m.rows[ny][nx])); pairs++;
      if (!allows(model, a, dir, b)) {
        const key = `${a} -${dir}-> ${b}`;
        if (!bad.has(key)) bad.set(key, { pair: key, count: 0, at: [] });
        const e = bad.get(key); e.count++; if (e.at.length < 3) e.at.push(`${x},${y}`);
      }
    }
  }
  return { id, pairs, violations: [...bad.values()].sort((p, q) => q.count - p.count) };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function proposeGround(id, MAPS, tiers, model, { seed = 1, groundKinds = null, maxRestarts = 40 } = {}) {
  const m = MAPS[id]; if (!m) return null;
  const H = m.rows.length, W = m.rows[0].length;
  const kindGrid = m.rows.map((r) => r.split('').map((ch) => famOf(tiers.kind(ch))));
  // char per FAMILY: the map's own char for that family; for a ground
  // family the map lacks (tg2 in a tg-only town), the town's own tg2
  // char from TILE_CHARS (kind tg2-<suffix>, suffix from its tg kind).
  const charFor = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!charFor.has(kindGrid[y][x])) charFor.set(kindGrid[y][x], m.rows[y][x]);
  const suffix = (() => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = tiers.kind(m.rows[y][x]); const mm = /^tg-(.+)$/.exec(k); if (mm) return mm[1]; } return null; })();
  if (suffix && !charFor.has('tg2')) {
    for (const [ch, ks] of Object.entries(tiers.TILE_CHARS || {})) if ((Array.isArray(ks) ? ks : [ks]).includes(`tg2-${suffix}`)) { charFor.set('tg2', ch); break; }
  }
  const isGround = groundKinds || ((k) => k === 'tg' || k === 'tg2');
  // Candidate set: the ground families available to this map.
  const local = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isGround(kindGrid[y][x])) local.add(kindGrid[y][x]);
  if (charFor.has('tg2')) local.add('tg2');
  if (charFor.has('tg')) local.add('tg');
  const candidates = [...local].filter((k) => charFor.has(k));
  if (!candidates.length) return { id, rows: m.rows, note: 'no ground cells' };
  const weights = candidates.map((k) => Math.max(1, model.freq.get(k) || 1));
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < maxRestarts; attempt++) {
    const cell = []; // per-cell Set of candidate kinds, or fixed kind string
    for (let y = 0; y < H; y++) { cell.push([]); for (let x = 0; x < W; x++) cell[y].push(isGround(kindGrid[y][x]) ? new Set(candidates) : kindGrid[y][x]); }
    const propagate = (sx, sy) => {
      const stack = [[sx, sy]];
      while (stack.length) {
        const [cx, cy] = stack.pop(); const cur = cell[cy][cx];
        const curKinds = cur instanceof Set ? [...cur] : [cur];
        for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
          const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ncell = cell[ny][nx];
          if (!(ncell instanceof Set)) {
            // fixed neighbour constrains current cell only if current is a set (handled when current was collapsed); here: check consistency
            if (!curKinds.some((k) => allows(model, k, dir, ncell))) return false;
            continue;
          }
          let changed = false;
          for (const k of [...ncell]) if (!curKinds.some((ck) => allows(model, k, OPP[dir], ck))) { ncell.delete(k); changed = true; }
          if (!ncell.size) return false;
          if (changed) stack.push([nx, ny]);
        }
      }
      return true;
    };
    let ok = true;
    // initial propagation from every fixed cell border
    for (let y = 0; y < H && ok; y++) for (let x = 0; x < W && ok; x++) if (cell[y][x] instanceof Set) ok = propagate(x, y);
    while (ok) {
      // lowest-entropy ground cell (ties: rng)
      let best = null, bestScore = 1e9;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = cell[y][x];
        if (c instanceof Set && c.size > 1) { const s = c.size + rng() * 0.01; if (s < bestScore) { bestScore = s; best = [x, y]; } } }
      if (!best) break;
      const [bx, by] = best; const opts = [...cell[by][bx]];
      let tot = 0; const ws = opts.map((k) => { const w = weights[candidates.indexOf(k)] || 1; tot += w; return w; });
      let r = rng() * tot, pick = opts[0];
      for (let i = 0; i < opts.length; i++) { r -= ws[i]; if (r <= 0) { pick = opts[i]; break; } }
      cell[by][bx] = new Set([pick]);
      ok = propagate(bx, by);
    }
    if (!ok) continue;
    const rows = [];
    for (let y = 0; y < H; y++) { let row = '';
      for (let x = 0; x < W; x++) { const c = cell[y][x]; const k = c instanceof Set ? [...c][0] : c; row += charFor.get(k) || m.rows[y][x]; }
      rows.push(row); }
    return { id, rows, attempts: attempt + 1 };
  }
  return { id, rows: m.rows, note: `WFC failed after ${maxRestarts} restarts` };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [mode, ...rest] = process.argv.slice(2);
  const opt = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : null; };
  const { MAPS, TILE_CHARS } = await loadMaps();
  const tiers = makeTiers(TILE_CHARS);
  if (mode === 'audit') {
    const ids = opt('--map') ? [opt('--map')] : [...townSetOf(MAPS), 'pallet'];
    for (const id of ids) {
      const model = learnAdjacency(MAPS, tiers, id);
      const r = auditMap(id, MAPS, tiers, model);
      if (!r) continue;
      const tot = r.violations.reduce((s, v) => s + v.count, 0);
      console.log(`${id}: ${r.pairs} adjacent pairs, ${tot} corpus-unseen (${(100 * tot / r.pairs).toFixed(1)}%), ${r.violations.length} distinct`);
      for (const v of r.violations.slice(0, +(opt('--top') || 5))) console.log(`    ${v.pair} x${v.count} e.g. @${v.at.join(' ')}`);
    }
  } else if (mode === 'propose') {
    const id = opt('--map'); if (!id) { console.log('propose needs --map'); process.exit(1); }
    const model = learnAdjacency(MAPS, tiers, null);
    const r = proposeGround(id, MAPS, tiers, model, { seed: +(opt('--seed') || 1) });
    console.log(`${id}: proposal ${r.note || `ok after ${r.attempts} attempt(s)`}`);
    if (opt('--out')) { writeFileSync(opt('--out'), JSON.stringify({ [id]: { rows: r.rows } }, null, 1)); console.log('overlay ->', opt('--out')); }
  } else {
    console.log('usage: wfc-tiled.mjs audit [--map id] | propose --map id [--seed n] [--out file]');
  }
}
