// audit-placement.mjs — Wave H permanent placement-relativity scorer
// + CLEAN-standard checks (owner exemplars, 2026-11-12).
//
// Per settlement (the 62 + pallet as reference town):
//   R1 door links (route-to-exit dressed fraction per door)
//   R2 objects across path lines   R3 unsigned junctions
//   R4 lamp coverage                R5 building separation
//   R6/R7 decor anchoring + walkway connectivity
//   CLEAN: PATH-FABRIC (network components, step-offs on/touching),
//          APRON (building ring clearance), ANCHOR-UNIT (any-anchor),
//          EDGE-MASS (trees in the edge band), JUNCTION-MARK coverage.
// --gates evaluates the Phase 2 acceptance gates per town:
//   strict >= 0.60, fabric >= 0.98 (from audit-desire-paths),
//   100% door step-offs on/touching the fabric, exactly ONE fabric
//   component, junction-mark coverage >= 90%, unanchored decor <= 5%,
//   APRON: no building under 60% ring clearance and no gap-0 pair,
//   FREESTANDING-CLEARANCE (owner rule, 2026-11-12): zero freestanding
//   objects straddled by fabric (fabric on both opposite sides), and
//   every freestanding object shoulder-adjacent (within 1 tile of a
//   fabric edge / building / junction site). Fences (borders) and
//   composed building units (postbox at its door, building signs,
//   stalls) are exempt by the rule's own terms.
// Usage: node scripts/audit-placement.mjs [--map id[,id...]]
//        [--overlay file.json] [--gates] [--json out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadMaps, makeTiers, townSetOf, analyzeMap } from './audit-desire-paths.mjs';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DECOR_KINDS = ['lamp', 'fence', 'flowerbed', 'sign', 'flower'];
// FREESTANDING objects (owner rule): independent objects that must
// stand on the shoulder, never straddled by the fabric. Exempt:
// 'fence' (runs as borders), composed building units (postbox, stall,
// sign-lab/sign-center/sign-gym/sign-mart are building-attached).
// The STRADDLE count covers every freestanding kind incl. landscaping
// (td-*, flower, flowerbed). SHOULDER-ADJACENCY gates only the route
// furniture — the rule's own list (lamps, signs, pots, barrels,
// standalone props); td-*/flower landscaping is governed by
// ANCHOR-UNIT + EDGE-MASS (tree-band dress pieces are vegetation
// mass, not roadside furniture) and is reported, not gated.
const FREESTANDING = (k) => k === 'lamp' || k === 'signpost' || k.startsWith('td-') ||
  ['flower', 'flowerbed', 'barrel', 'crates', 'sandcrate', 'well', 'bench', 'statue', 'pottedtree', 'haycart'].includes(k);
const ROUTE_FURNITURE = (k) => ['lamp', 'signpost', 'barrel', 'crates', 'sandcrate', 'well', 'bench', 'statue', 'pottedtree', 'haycart'].includes(k);
// BUILD: a building's MASS. Beyond the roof/wall/door families, the kit
// authors structural building parts under their own kinds — gym roof
// bands (gym-rock, gym-volt) and the museum/lab display + column parts
// (fossildisplay, dresswindow, ancientpillar). Before W4 the classifier
// missed them, so one visual building fragmented into several
// "footprints" whose parts filled each other's apron rings (Flintridge:
// the Mart read as two footprints merged at gap 0, the museum/gym
// complex at 0.32 ring clearance). They are mass, not neighbours.
// The roof SIGN faces (sign-gym, sign-lab, sign-center, sign-mart) are
// deliberately NOT mass: a sign is a face hung on a building, and
// counting it as structure would credit a floating sign as a bridge —
// Craterlake's Center sign sits in its building's ring and would lift
// that ring 0.588 -> 0.625 without a single tile moving (W4 probe).
const BUILD = (k) => k.startsWith('roof') || k.startsWith('wall') || k.startsWith('door') || k.startsWith('th-') || k.startsWith('tr-') || k.startsWith('tl-') || k.startsWith('tw-') || ['house', 'gymwall', 'gymdoor', 'centerdoor', 'gym-rock', 'gym-volt', 'fossildisplay', 'dresswindow', 'ancientpillar', 'drakeroof', 'parapetroof'].includes(k);
// ('drakeroof'/'parapetroof': the W-DIFF kit-identity roof kinds —
// wall-class roofs that don't carry the roof-/th- prefixes; registered
// here so house footprints/aprons measure whole, W-DIFF-AUDIT Phase C.)

// STREET-MATERIAL REGISTRY (W4, 2026-11-13). The network tier counts
// the universal street materials (path, psand*, tg2-*). A town whose
// CLEAN build record authors a dressed material AS its street fabric
// registers that material here, per town: vermilion — the T6 build
// record seats Arcport's gym on the boardwalk dock street and keeps
// the captains' row on it; boardwalk is the harbour's street material
// (the desire-paths fabric tier already counts it via DRESSED_KINDS).
// Without the registration the audit was blind to the dock street:
// gym step-offs 5/7, connectivity 72/110 — while the walkable graph
// itself connects 177/177 (T6 CHECKLIST residual, closed by W4).
// NOT registered, deliberately: fortree / slateport / pacifidlog
// boardwalk is un-rebuilt legacy state whose connectivity belongs to
// their rebuild waves (they register, and mark their junctions, when
// they are brought to the CLEAN standard); sunnyshore's harbourstone
// is decorative inlay speckle, not a street, and is not registrable
// as one. tests/placement-gates-checks.mjs pins this registry's exact
// contents and every unregistered town's baseline gate tuple, so the
// registration can neither leak nor silently widen.
export const STREET_REGISTRY = { vermilion: ['boardwalk'], blackthorn: ['settfloor'], silvertown: ['marblefloor'] };
// W-DIFF pilot extension (2026-11-13, documented exception #6/#7 in the
// guard): blackthorn's settfloor and silvertown's marblefloor are the
// first two kit-level identity street materials (owner ruling: "Every
// town kit should be different" — muse-directive/W-DIFF-AUDIT.md Phase
// B/C). Each is registered to exactly its one town, like boardwalk.
export function tiersFor(id, tiers) {
  const extra = STREET_REGISTRY[id];
  if (!extra || !extra.length) return tiers;
  const isNetwork = (ch) => { const k = tiers.kind(ch); return tiers.isNetwork(ch) || extra.includes(k); };
  return { ...tiers, isNetwork };
}
const TREE = (k) => k.startsWith('tc-') || k === 'tree';

export async function scoreTown(id, MAPS, WALKABLE, tiers) {
  const { kind, isStrict, isNetwork } = tiers;
  const isNet = (ch) => isNetwork(ch);
  const m = MAPS[id], H = m.rows.length, W = m.rows[0].length;
  const cell = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? m.rows[y][x] : '#';
  const warpSet = new Set((m.warps || []).map(w => w.y * W + w.x));
  const walk = (x, y) => WALKABLE.has(cell(x, y)) || warpSet.has(y * W + x);
  const T = new Set();
  for (const w of m.warps || []) { const k = kind(cell(w.x, w.y)); if (w.via || k.startsWith('door')) T.add(w.y * W + w.x); }
  const exits = (m.warps || []).filter(w => w.x === 0 || w.y === 0 || w.x === W - 1 || w.y === H - 1).map(w => [w.x, w.y]);
  const bfsDist = (sources, passFn) => {
    const d = new Map(); const q = [];
    for (const [x, y] of sources) { const k = y * W + x; if (!d.has(k)) { d.set(k, 0); q.push([x, y]); } }
    while (q.length) { const [x, y] = q.shift(); const cd = d.get(y * W + x);
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (!d.has(k) && passFn(nx, ny)) { d.set(k, cd + 1); q.push([nx, ny]); } } }
    return d;
  };
  const astarPath = (src, goals) => {
    const key = (x, y) => y * W + x; const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
    const pass = (x, y) => walk(x, y) && (goalSet.has(key(x, y)) || !T.has(key(x, y)));
    const came = new Map(), gs = new Map([[key(src[0], src[1]), 0]]); const pq = [[0, key(src[0], src[1])]];
    const h = (x, y) => Math.min(...goals.map(([gx, gy]) => Math.abs(x - gx) + Math.abs(y - gy)));
    while (pq.length) { let bi = 0; for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[bi][0]) bi = i; const [, cur] = pq.splice(bi, 1)[0];
      if (goalSet.has(cur) && cur !== key(src[0], src[1])) { const p = [cur]; let c = cur; while (came.has(c)) { c = came.get(c); p.push(c); } return p.reverse().map(k => [k % W, (k / W) | 0]); }
      const cx = cur % W, cy = (cur / W) | 0, cg = gs.get(cur);
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (!pass(nx, ny)) continue; const nk = key(nx, ny), ng = cg + 1;
        if (ng < (gs.get(nk) ?? 1e9)) { gs.set(nk, ng); came.set(nk, cur); const f = ng + h(nx, ny); const ex = pq.findIndex(p => p[1] === nk); if (ex >= 0) pq[ex][0] = f; else pq.push([f, nk]); } } }
    return null;
  };

  const r = { id, name: m.name || id, doors: 0, weakLinks: 0, interrupts: 0, lamps: 0, unlitFrac: null,
    merged: 0, tight: 0, buildings: 0, apronLow: 0, apronMin: 1, decor: 0, unanchoredPath: 0, unanchoredAny: 0,
    netComponents: 0, netCompSizes: [], stepOn: 0, stepTouch: 0, stepTot: 0, junctions: 0, junctionsBare: 0,
    trees: 0, treesIsolated: 0, noWalkway: 0 };
  const examples = [];

  // PATH-FABRIC components (all network cells; sizes reported)
  const comp = new Map(); let nc = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isNet(cell(x, y)) || comp.has(y * W + x)) continue;
    let sz = 0; const q = [[x, y]]; comp.set(y * W + x, nc);
    while (q.length) { const [cx, cy] = q.pop(); sz++; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!comp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && isNet(cell(nx, ny))) { comp.set(k, nc); q.push([nx, ny]); } } }
    r.netCompSizes.push(sz); nc++;
  }
  r.netComponents = nc;

  // doors: step-offs, R1 weak links, R7 walkway connection
  // Step-off definition: warps with `via` use it; door-kind warps
  // without `via` (e.g. pallet's houses) step off one tile south.
  const doorWarps = [];
  for (const w of m.warps || []) {
    const k = kind(cell(w.x, w.y));
    if (w.via) doorWarps.push({ w, sx: w.via.x, sy: w.via.y });
    else if (k.startsWith('door')) doorWarps.push({ w, sx: w.x, sy: w.y + 1 });
  }
  for (const { w, sx, sy } of doorWarps) {
    r.doors++; r.stepTot++;
    if (isNet(cell(sx, sy))) { r.stepOn++; r.stepTouch++; }
    else { let touch = false; for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) if (isNet(cell(sx + dx, sy + dy))) touch = true; if (touch) r.stepTouch++; }
    if (exits.length) {
      const p = astarPath([sx, sy], exits);
      if (p) { let dS = 0; for (const [x, y] of p) if (isStrict(cell(x, y))) dS++; if (dS / p.length < 0.5) { r.weakLinks++; if (examples.length < 6) examples.push(`door->${w.to.map} step-off@${sx},${sy} route-to-exit strict ${(dS / p.length).toFixed(2)}`); } }
      const net = bfsDist([[sx, sy]], (x, y) => isStrict(cell(x, y)));
      const reached = exits.some(([ex2, ey2]) => net.has(ey2 * W + ex2) || DIRS.some(([dx, dy]) => net.has((ey2 + dy) * W + (ex2 + dx))));
      if (!reached) r.noWalkway++;
    }
  }

  // decor: R2 interrupts, R6 anchoring (path-only and any-anchor)
  const isDecor = (ch) => { const k = kind(ch); return k.startsWith('td-') || DECOR_KINDS.includes(k); };
  const netCells = [], buildCells = [], decorCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell(x, y);
    if (isNet(ch)) netCells.push([x, y]); if (BUILD(kind(ch))) buildCells.push([x, y]); if (isDecor(ch)) decorCells.push([x, y]); }
  const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
  for (const [x, y] of decorCells) {
    r.decor++;
    const nN = isNet(cell(x, y - 1)), nS = isNet(cell(x, y + 1)), nE = isNet(cell(x + 1, y)), nW = isNet(cell(x - 1, y));
    if ((nN && nS) || (nE && nW)) r.interrupts++;
    let dmin = 1e9; for (const [px, py] of netCells) { const d = cheb(x, y, px, py); if (d < dmin) dmin = d; }
    if (dmin > 3) r.unanchoredPath++;
    const near = (pts, rr) => pts.some(([px, py]) => cheb(x, y, px, py) <= rr);
    const anchored = near(buildCells, 2) || near(netCells, 2) || decorCells.some(([px, py]) => !(px === x && py === y) && cheb(x, y, px, py) <= 2);
    if (!anchored) { r.unanchoredAny++; if (examples.length < 10) examples.push(`${kind(cell(x, y))}@${x},${y} unanchored (no building/fabric/decor unit within 2)`); }
  }

  // FREESTANDING-CLEARANCE (owner rule, 2026-11-12): a freestanding
  // object is ON-FABRIC when the route straddles it — fabric on both
  // opposite sides (N+S or E+W); a 3-fabric-neighbour pocket is a
  // watch item, not a straddle. Shoulder-adjacency is checked after
  // the junction pass (below), against fabric/buildings/junctions.
  const freeCells = [];
  r.onFabric = 0; r.onFabricList = []; r.fabricPockets = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = kind(cell(x, y)); if (!FREESTANDING(k)) continue;
    const fN = isNet(cell(x, y - 1)), fS = isNet(cell(x, y + 1)), fE = isNet(cell(x + 1, y)), fW = isNet(cell(x - 1, y));
    const straddle = (fN && fS) || (fE && fW);
    const nFab = [fN, fS, fE, fW].filter(Boolean).length;
    freeCells.push({ x, y, k, fN, fS, fE, fW, nFab });
    if (straddle) { r.onFabric++; if (r.onFabricList.length < 8) r.onFabricList.push(`${k}@${x},${y}`); }
    else if (nFab === 3) r.fabricPockets++;
  }
  r.freestanding = freeCells.length;

  // CONNECTIVITY (owner priority, 2026-11-12: "Connectivity and clear
  // path"): all-pairs reachability on the FABRIC GRAPH ALONE — every
  // door step-off must reach every exit and every other door step-off
  // without ever leaving fabric cells. Stronger than the component
  // count: it is stated door-by-door, exit-by-exit.
  r.connPairs = 0; r.connOk = 0; r.connFails = [];
  {
    const nodes = []; const seenNode = new Set();
    for (const { sx, sy } of doorWarps) { const k = sy * W + sx; if (!seenNode.has(k)) { seenNode.add(k); nodes.push({ t: 'door', x: sx, y: sy }); } }
    for (const [ex, ey] of exits) { const k = ey * W + ex; if (!seenNode.has(k)) { seenNode.add(k); nodes.push({ t: 'exit', x: ex, y: ey }); } }
    const fabAt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && isNet(cell(x, y));
    for (const a of nodes) {
      const reach = new Set();
      if (fabAt(a.x, a.y)) { const q = [[a.x, a.y]]; reach.add(a.y * W + a.x);
        while (q.length) { const [cx, cy] = q.pop(); for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx; if (!reach.has(k) && fabAt(nx, ny)) { reach.add(k); q.push([nx, ny]); } } } }
      for (const b of nodes) { if (b === a) continue; r.connPairs++; if (reach.has(b.y * W + b.x)) r.connOk++; else if (r.connFails.length < 4) r.connFails.push(`${a.t}@${a.x},${a.y} -/-> ${b.t}@${b.x},${b.y}`); }
    }
  }

  // R3 junctions + JUNCTION-MARK coverage. A junction is a SITE: a
  // connected cluster (8-conn) of fabric cells with >=3 fabric
  // neighbours. (Phase 1 counted cells; on 2-wide CLEAN fabrics every
  // lane cell has degree >=3, which measures lane width, not decision
  // points — the owner's own exemplar streets would fail. Sites keep
  // the gate's meaning: every decision point/plaza carries a mark.)
  const signPts = (m.signs || []).map(s => [s.x, s.y]);
  const jCells = netCells.filter(([x, y]) => DIRS.filter(([dx, dy]) => isNet(cell(x + dx, y + dy))).length >= 3);
  r.junctionCells = jCells.length;
  const jSeen = new Set(); const jKey = (x, y) => y * W + x;
  for (const [x, y] of jCells) {
    if (jSeen.has(jKey(x, y))) continue;
    const site = []; const q = [[x, y]]; jSeen.add(jKey(x, y));
    while (q.length) { const [cx, cy] = q.pop(); site.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy;
        if (!jSeen.has(jKey(nx, ny)) && jCells.some(([jx, jy]) => jx === nx && jy === ny)) { jSeen.add(jKey(nx, ny)); q.push([nx, ny]); } } }
    r.junctions++;
    r.junctionSites = r.junctionSites || [];
    r.junctionSites.push(site);
    if (!signPts.some(([sx, sy]) => site.some(([jx, jy]) => cheb(jx, jy, sx, sy) <= 2))) r.junctionsBare++;
  }

  // FREESTANDING shoulder-adjacency: route furniture must stand at
  // the shoulder of what it serves — within 1 tile of a fabric edge,
  // or within the 2-tile unit radius of its building / junction /
  // NPC post. Straddled objects are counted in onFabric, not here.
  // Landscaping (td-*, flower, flowerbed) floaters are reported
  // separately (r.landscapingFloat); ANCHOR-UNIT gates them.
  r.shoulderOrphans = 0; r.shoulderList = []; r.landscapingFloat = 0;
  {
    const jCellsAll = (r.junctionSites || []).flat();
    const npcPts = (m.npcs || []).map(n => [n.x, n.y]);
    const unitPts = []; // composed-unit anchors: stalls, postboxes, building signs
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = kind(cell(x, y)); if (k === 'stall' || k === 'postbox' || k.startsWith('sign-')) unitPts.push([x, y]); }
    const serves = (f) => f.nFab >= 1 ||
      buildCells.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      jCellsAll.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      npcPts.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      unitPts.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2);
    for (const f of freeCells) {
      if ((f.fN && f.fS) || (f.fE && f.fW)) continue;
      if (ROUTE_FURNITURE(f.k)) { if (!serves(f)) { r.shoulderOrphans++; if (r.shoulderList.length < 8) r.shoulderList.push(`${f.k}@${f.x},${f.y}`); } }
      else if (!serves(f)) r.landscapingFloat++;
    }
  }

  // R4 lamps
  const lampPts = decorCells.filter(([x, y]) => kind(cell(x, y)) === 'lamp');
  r.lamps = lampPts.length;
  if (lampPts.length) {
    const d = bfsDist(lampPts, (x, y) => walk(x, y));
    let unlit = 0;
    for (const [x, y] of netCells) { const dd = d.get(y * W + x); if (dd === undefined || dd > 6) unlit++; }
    r.unlitFrac = netCells.length ? +(unlit / netCells.length).toFixed(3) : null;
  }

  // R5 buildings + APRON
  const bcomp = new Map(); let bnc = 0; const footprints = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!BUILD(kind(cell(x, y))) || bcomp.has(y * W + x)) continue;
    const cells = []; const q = [[x, y]]; bcomp.set(y * W + x, bnc);
    while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]);
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
        if (!bcomp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && BUILD(kind(cell(nx, ny)))) { bcomp.set(k, bnc); q.push([nx, ny]); } } }
    if (cells.length >= 3) footprints.push(cells); bnc++;
  }
  r.buildings = footprints.length;
  for (const fp of footprints) {
    const ring = new Set();
    for (const [x, y] of fp) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      // The town frame (cavewall — the cliff/rock face the settlement
      // is built against) is the boundary of the playable town, not a
      // crowding neighbour: it leaves the ring exactly like an
      // out-of-bounds cell (W4). Flintridge's museum/gym complex
      // stands at the cliff foot by design; counting the cliff face
      // against its clearance measured the frame, not the building.
      if (kind(cell(nx, ny)) === 'cavewall') continue;
      if (!bcomp.has(ny * W + nx)) ring.add(ny * W + nx); }
    let clear = 0; for (const k of ring) if (WALKABLE.has(cell(k % W, (k / W) | 0))) clear++;
    const frac = ring.size ? clear / ring.size : 1;
    if (frac < r.apronMin) r.apronMin = +frac.toFixed(3);
    if (frac < 0.6) r.apronLow++;
  }
  for (let i = 0; i < footprints.length; i++) for (let j = i + 1; j < footprints.length; j++) {
    let gmin = 1e9;
    for (const [ax, ay] of footprints[i]) for (const [bx, by] of footprints[j]) { const d = cheb(ax, ay, bx, by) - 1; if (d < gmin) gmin = d; }
    if (gmin === 0) r.merged++; else if (gmin === 1) r.tight++;
  }

  // EDGE-MASS
  const tcomp = new Map(); let tnc = 0; const tSizes = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!TREE(kind(cell(x, y))) || tcomp.has(y * W + x)) continue;
    let sz = 0; const q = [[x, y]]; tcomp.set(y * W + x, tnc);
    while (q.length) { const [cx, cy] = q.pop(); sz++; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!tcomp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && TREE(kind(cell(nx, ny)))) { tcomp.set(k, tnc); q.push([nx, ny]); } } }
    tSizes.set(tnc, sz); tnc++;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!TREE(kind(cell(x, y)))) continue; r.trees++;
    const inBand = x < 3 || y < 3 || x >= W - 3 || y >= H - 3;
    if (!inBand && (tSizes.get(tcomp.get(y * W + x)) || 0) < 4) r.treesIsolated++;
  }
  r.examples = examples;
  return r;
}

export function gateCheck(r, clarity) {
  const gates = [];
  const push = (name, ok, detail) => gates.push({ name, ok, detail });
  if (clarity) {
    push('strict>=0.60', clarity.meanStrict >= 0.60, `strict=${clarity.meanStrict}`);
    push('fabric>=0.98', clarity.meanFabric >= 0.98, `fabric=${clarity.meanFabric}`);
  }
  push('step-offs 100% on/touching', r.stepTot > 0 && r.stepTouch === r.stepTot, `${r.stepTouch}/${r.stepTot}`);
  push('CONNECTIVITY all-pairs on fabric', r.connPairs > 0 && r.connOk === r.connPairs, `${r.connOk}/${r.connPairs} pairs${r.connFails && r.connFails.length ? ' e.g. ' + r.connFails[0] : ''}`);
  push('exactly 1 fabric component', r.netComponents === 1, `components=${r.netComponents} sizes=${r.netCompSizes.join('+')}`);
  const jCov = r.junctions ? 1 - r.junctionsBare / r.junctions : 1;
  push('junction-mark>=90%', jCov >= 0.90, `covered ${r.junctions - r.junctionsBare}/${r.junctions}`);
  const uFrac = r.decor ? r.unanchoredAny / r.decor : 0;
  push('unanchored<=5%', uFrac <= 0.05, `${r.unanchoredAny}/${r.decor} decor unanchored`);
  push('APRON no <60% / no gap-0', r.apronLow === 0 && r.merged === 0, `apronLow=${r.apronLow} min=${r.apronMin} merged=${r.merged} tight=${r.tight}`);
  push('FREESTANDING-CLEARANCE on-fabric=0', (r.onFabric || 0) === 0, `onFabric=${r.onFabric || 0}${r.onFabricList && r.onFabricList.length ? ' e.g. ' + r.onFabricList[0] : ''} pockets=${r.fabricPockets || 0}`);
  push('shoulder-adjacency', (r.shoulderOrphans || 0) === 0, `orphans=${r.shoulderOrphans || 0}${r.shoulderList && r.shoulderList.length ? ' e.g. ' + r.shoulderList[0] : ''} of ${r.freestanding || 0} freestanding`);
  return { id: r.id, pass: gates.every(g => g.ok), gates };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const overlay = opt('--overlay') ? JSON.parse(readFileSync(opt('--overlay'), 'utf8')) : {};
  const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(overlay);
  const tiers = makeTiers(TILE_CHARS);
  const towns = townSetOf(MAPS);
  const ids = opt('--map') ? opt('--map').split(',') : [...towns, 'pallet'].filter(id => MAPS[id]);
  const out = [];
  for (const id of ids) {
    if (!MAPS[id]) continue;
    const r = await scoreTown(id, MAPS, WALKABLE, tiersFor(id, tiers));
    let gate = null;
    if (args.includes('--gates')) {
      const clarity = analyzeMap(id, MAPS[id], { WALKABLE, tiers, townSet: towns });
      gate = gateCheck(r, clarity);
      r.strict = clarity.meanStrict; r.fabric = clarity.meanFabric;
    }
    out.push({ ...r, gate });
    console.log(`${id}: doors=${r.doors} weak=${r.weakLinks} noWalk=${r.noWalkway} int=${r.interrupts} lamps=${r.lamps} unlit=${r.unlitFrac} comps=${r.netComponents}(${r.netCompSizes.join('+')}) step=${r.stepTouch}/${r.stepTot} conn=${r.connOk}/${r.connPairs} junc=${r.junctions - r.junctionsBare}/${r.junctions} unanchAny=${r.unanchoredAny}/${r.decor} onFab=${r.onFabric || 0} shoulderOrph=${r.shoulderOrphans || 0} apronLow=${r.apronLow} merged=${r.merged} tight=${r.tight} isoTrees=${r.treesIsolated}${gate ? ` | strict=${r.strict} fabric=${r.fabric} | GATES ${gate.pass ? 'PASS' : 'FAIL: ' + gate.gates.filter(g => !g.ok).map(g => g.name + ' (' + g.detail + ')').join('; ')}` : ''}`);
    if (r.examples && r.examples.length) for (const e of r.examples.slice(0, 3)) console.log(`    ${e}`);
  }
  if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify(out, null, 1));
}
