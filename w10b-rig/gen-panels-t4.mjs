// gen-panels-t4.mjs — W10-B T4 Class B battle-reveal panel generators
// (deterministic). Authors the 10 T4 panels (128x80, the W10 panel
// canvas standard) as .pix sources under assets/sprites/pix/keyart/.
// Class B attaches exactly like Class A (Director ruling, plan OQ4):
// each composition is drawn ONLY from its moment's recorded data —
// the Kin's W13 design field + the event's own build-up say text +
// the venue record (quoted per scene below). Original compositions —
// battle art is reference only; no battle frame is traced, enlarged,
// or reused (Director ruling 4). Same code -> byte-identical .pix.
// Run: node w10b-rig/gen-panels-t4.mjs [panel-id ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 128, H = 80;
const KEYART = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sprites', 'pix', 'keyart');

const hash = (x, y) => ((x * 73856093) ^ (y * 19349663) ^ ((x + y) * 83492791)) >>> 0;

function canvas(fill) {
  const grid = new Array(W * H).fill(fill);
  const api = {
    grid,
    set(x, y, c) { if (x >= 0 && y >= 0 && x < W && y < H) grid[y * W + x] = c; },
    get(x, y) { return (x >= 0 && y >= 0 && x < W && y < H) ? grid[y * W + x] : null; },
    ellipse(cx, cy, rx, ry, c, rot = 0) {
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const R = Math.ceil(Math.max(rx, ry)) + 1;
      for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
        const dx = x - cx, dy = y - cy;
        const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
        if ((lx * lx) / (rx * rx) + (ly * ly) / (ry * ry) <= 1) api.set(x, y, c);
      }
    },
    // ellipse OUTLINE (band at the rim) — rings, halos, coils
    ring(cx, cy, rx, ry, c, th = 0.16, rot = 0) {
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const R = Math.ceil(Math.max(rx, ry)) + 1;
      for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
        const dx = x - cx, dy = y - cy;
        const lx = dx * cs + dy * sn, ly = -dx * sn + dy * cs;
        const d = (lx * lx) / (rx * rx) + (ly * ly) / (ry * ry);
        if (d <= 1 && d >= (1 - th) * (1 - th)) api.set(x, y, c);
      }
    },
    rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, c); },
    // filled triangle (sign = winding-agnostic barycentric)
    tri(x0, y0, x1, y1, x2, y2, c) {
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
      const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
      if (d === 0) return;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
        const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
        const g = 1 - a - b;
        if (a >= 0 && b >= 0 && g >= 0) api.set(x, y, c);
      }
    },
    line(x0, y0, x1, y1, c, th = 0) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        api.set(x, y, c);
        if (th) { api.set(x + 1, y, c); api.set(x, y + 1, c); }
      }
    },
    // dissolve the rim of any pixel of char c whose neighbour is not in keep[]
    dissolve(c, keep, mod, seed = 0) {
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (api.get(x, y) !== c) continue;
        const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !keep.includes(api.get(x + dx, y + dy)));
        if (rim && hash(x + seed, y) % mod !== 0) api.set(x, y, api.get(x, y + 1) === c ? api.get(x + 1, y) : keep[0]);
      }
    },
    frame(c) {
      for (let x = 0; x < W; x++) { api.set(x, 0, c); api.set(x, H - 1, c); }
      for (let y = 0; y < H; y++) { api.set(0, y, c); api.set(W - 1, y, c); }
    },
    speckle(chars, region, mod, seed = 0) {
      const [x0, y0, x1, y1] = region;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const cur = api.get(x, y);
        if (chars.from.includes(cur) && hash(x + seed, y) % mod === 0) api.set(x, y, chars.to[hash(x, y + seed) % chars.to.length]);
      }
    },
  };
  return api;
}

function emit(id, title, brief, pal, grid) {
  const rows = [];
  for (let y = 0; y < H; y++) rows.push(grid.slice(y * W, (y + 1) * W).join(''));
  const head = brief.map((l) => '# ' + l).join('\n');
  const text = `${head}\nPIX ${id} 128 80\n${rows.join('\n')}\nPAL\n${pal.map(([c, hex, n]) => `${c} ${hex} ${n}`).join('\n')}\n`;
  const out = path.join(KEYART, id + '.pix');
  fs.writeFileSync(out, text);
  const used = new Set(rows.join('').split(''));
  console.log(`gen-panels-t4: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// 1. FULMINIS — ev_zapdos @ powerplant (the plant's dark)
// design: animal — eagle — great brown eagle, navy flight feathers,
//  sparking wingtips
// say: "Every hair on your arms stands on end. The air tastes of
//  pennies and thunder. Something vast is nesting in the dark
//  between the turbines."
// =====================================================================
function scenePlantFulminis() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 46 ? 'K' : y < 62 ? 'D' : 'd');
  // gantry beams + hanging cables
  g.rect(0, 12, W - 1, 14, 'd'); g.rect(0, 14, W - 1, 14, 'K');
  for (const cx of [18, 46, 82, 110]) g.line(cx, 14, cx + 2, 24 + (cx % 3) * 3, 'd');
  // floor: cable runs + panel seams
  g.rect(0, 66, W - 1, 66, 'K');
  g.line(6, 72, 52, 72, 'K'); g.line(76, 74, 122, 74, 'K'); g.line(20, 77, 108, 77, 'K');
  // two vast turbines (rings + hubs + blades), left and right
  const turbine = (cx, cy, r) => {
    g.ring(cx, cy, r, r, 'S', 0.16); g.ring(cx, cy, r, r, 's', 0.08);
    g.ring(cx, cy, r * 0.62, r * 0.62, 's', 0.10);
    for (let a = 0; a < 3; a++) {
      const t = a * Math.PI * 2 / 3 + 0.5;
      g.tri(cx, cy, cx + Math.round(r * 0.85 * Math.cos(t - 0.4)), cy + Math.round(r * 0.85 * Math.sin(t - 0.4)), cx + Math.round(r * 0.85 * Math.cos(t + 0.4)), cy + Math.round(r * 0.85 * Math.sin(t + 0.4)), 's');
    }
    g.ellipse(cx, cy, 3.4, 3.4, 'S'); g.ellipse(cx, cy, 1.6, 1.6, 'd');
  };
  turbine(22, 40, 17); turbine(106, 40, 17);
  // the nest of cables between the turbines (centre, low)
  g.ellipse(64, 56, 24, 7, 'K'); g.ellipse(64, 54, 22, 6, 'd');
  for (let i = 0; i < 7; i++) g.line(46 + i * 3, 52, 52 + i * 4, 58 + (i % 3), 'K');
  g.speckle({ from: ['d'], to: ['S'] }, [42, 48, 86, 60], 9, 3);
  // ---- FULMINIS nesting in the dark (centre) ----
  // tail fan (navy, left, low)
  g.tri(50, 46, 34, 52, 50, 54, 'N'); g.tri(50, 50, 36, 58, 52, 56, 'n');
  // body (great brown mass, settled)
  g.ellipse(64, 44, 17, 9.4, 'B'); g.ellipse(64, 47, 16, 7.6, 'b'); g.ellipse(63, 42, 15, 7.6, 'B');
  // draped wing: navy flight feathers over the body's right
  g.ellipse(72, 44, 12, 7, 'N', 0.35); g.ellipse(73, 45, 10, 5.6, 'n', 0.35);
  for (let i = 0; i < 4; i++) g.line(66 + i * 3, 40 + i, 78 + i * 2, 48 + i, 'N');
  // neck + head (right, watchful, beak hooked)
  g.ellipse(79, 34, 6.4, 6, 'B', -0.4);
  g.ellipse(84, 29, 5.6, 4.4, 'B', 0.3); g.ellipse(84.6, 30.2, 4.6, 3.4, 'b', 0.3); g.ellipse(83.6, 28.4, 4.8, 3.4, 'B', 0.3);
  g.tri(88, 27, 94, 29, 88, 31, 'Y'); g.tri(90, 30, 93, 33, 89, 32, 'Y'); // hooked beak
  g.set(85, 28, 'Y'); // the amber eye, open in the dark
  // sparking wingtips: bright crosses + falling spark trails
  for (const [sx, sy] of [[88, 50], [90, 54], [44, 40], [42, 44]]) {
    g.set(sx, sy, 'Y'); g.set(sx - 1, sy, 'W'); g.set(sx + 1, sy, 'W'); g.set(sx, sy - 1, 'W'); g.set(sx, sy + 1, 'W');
  }
  for (let i = 0; i < 10; i++) {
    const x = 38 + hash(i, 7) % 56, y = 52 + hash(i, 11) % 12;
    if (g.get(x, y) !== 'B') g.set(x, y, 'Y');
  }
  // static in the air: sparse pale flecks (hair standing on end)
  for (let i = 0; i < 22; i++) {
    const x = 8 + hash(i, 13) % 112, y = 18 + hash(i, 17) % 30;
    if (['K', 'D'].includes(g.get(x, y))) g.set(x, y, 'W');
  }
  g.frame('O');
  return emit('panel-plant-fulminis', 'FULMINIS nesting in the Power Plant (ev_zapdos)', [
    'panel-plant-fulminis 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): FULMINIS nesting in the dark between the turbines',
    '(ev_zapdos, Power Plant). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t4.mjs. Brief = the',
    'species design record (great brown eagle, navy flight feathers,',
    'sparking wingtips) + the event say text ("Something vast is',
    'nesting in the dark between the turbines... pennies and thunder").',
  ], [
    ['O', '#0c0d12', 'frame outline'], ['K', '#171922', 'hall deepest'], ['D', '#232633', 'hall dark'],
    ['d', '#3a4054', 'girder shade'], ['S', '#6a7386', 'turbine steel'], ['s', '#49505f', 'steel shade'],
    ['B', '#7a5230', 'eagle brown'], ['b', '#54371e', 'brown shade'], ['N', '#2c3a5e', 'navy feather'],
    ['n', '#1f2c4a', 'navy shade'], ['Y', '#f2c230', 'spark / eye amber'], ['W', '#efe6cc', 'static fleck'],
  ], g.grid);
}

// =====================================================================
// 2. PYREHAWK — ev_moltres @ victoryroad (Crown Road)
// design: animal — hawk — ember hawk, flame-feathered wings, fierce
//  crest
// say: "Heat breathes out of the cracks ahead in slow waves, and the
//  shadows thrown on the wall have wings. Far too many wings."
// =====================================================================
function sceneCrownroadPyrehawk() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 52 ? 'D' : 'K');
  // the lit cavern wall (right two-thirds): warm, uneven
  g.rect(38, 4, W - 1, 52, 'W'); g.rect(38, 4, 44, 52, 'w');
  g.speckle({ from: ['W'], to: ['w'] }, [38, 4, 127, 52], 18, 2);
  g.speckle({ from: ['D'], to: ['K'] }, [0, 0, 37, 52], 6, 5);
  // ---- THE SHADOW on the wall: wings, far too many ----
  // main wing pair (huge, up-spread)
  g.tri(84, 26, 52, 6, 62, 30, 'S'); g.tri(84, 26, 116, 4, 106, 30, 'S');
  // the second, wrong pair (lower, echoed — the text's excess)
  g.tri(84, 30, 58, 20, 66, 38, 'S'); g.tri(84, 30, 110, 18, 102, 38, 'S');
  // shadow body + head
  g.ellipse(84, 32, 7.4, 10, 'S'); g.ellipse(84, 20, 4.6, 4, 'S');
  g.tri(88, 19, 94, 21, 88, 23, 'S'); // shadow beak
  for (let i = 0; i < 3; i++) g.tri(81 + i * 3, 16, 83 + i * 3, 16, 82 + i * 3, 10 - i, 'S'); // shadow crest
  g.tri(80, 40, 88, 40, 84, 50, 'S'); // shadow tail
  // the cracked floor: dark cracks with heat glowing inside
  g.rect(0, 58, W - 1, H - 1, 'K');
  const crack = (x0, x1, y) => { g.line(x0, y, x1, y + 1, 'S'); g.line(x0, y - 1, x1, y, 'M'); };
  crack(8, 44, 64); crack(52, 92, 68); crack(88, 122, 63); crack(24, 66, 73); crack(70, 108, 75);
  g.ellipse(64, 66, 21, 3.4, 'm'); g.ellipse(64, 66, 12, 2.2, 'M'); // the heat source glow, low centre
  g.speckle({ from: ['K'], to: ['m'] }, [0, 58, 127, 79], 26, 6);
  // heat shimmer flecks rising off the cracks
  for (let i = 0; i < 16; i++) {
    const x = 14 + hash(i, 19) % 100, y = 40 + hash(i, 23) % 18;
    if (['D', 'K', 'W'].includes(g.get(x, y))) g.set(x, y, 'm');
  }
  // ---- PYREHAWK itself: small, at the cracks' edge (left) ----
  // perch rock
  g.ellipse(28, 57, 10, 4.4, 'D'); g.ellipse(28, 55, 8, 3.4, 'w');
  // tail: flame feathers trailing back-left, ember-lit
  g.tri(24, 50, 12, 56, 24, 55, 'R'); g.tri(24, 52, 14, 60, 25, 56, 'F');
  // body (ember hawk, upright, fierce)
  g.ellipse(28, 47, 6.4, 8, 'R'); g.ellipse(28, 48.6, 5.4, 6.6, 'r'); g.ellipse(27.4, 45.6, 5.2, 6.4, 'R');
  // folded wing with flame-feather ticks
  g.ellipse(31, 47, 3.6, 6.4, 'r', 0.3);
  for (let i = 0; i < 3; i++) { g.set(32, 44 + i * 3, 'F'); g.set(33, 45 + i * 3, 'm'); }
  // head + fierce crest + hooked beak
  g.ellipse(28, 37, 4.6, 4, 'R'); g.ellipse(28.4, 38, 3.8, 3.2, 'r'); g.ellipse(27.6, 36.4, 3.8, 3, 'R');
  for (let i = 0; i < 3; i++) g.tri(25 + i * 2.4, 34, 27 + i * 2.4, 34, 26 + i * 2.4, 28 + (i === 1 ? -2 : 0), 'F');
  g.tri(31, 36, 36, 37.4, 31, 39, 'Y'); // beak
  g.set(29, 36.6, 'Y'); // ember eye
  // legs on the rock
  g.line(26, 54, 25, 57, 'Y'); g.line(30, 54, 31, 57, 'Y');
  g.frame('O');
  return emit('panel-crownroad-pyrehawk', 'PYREHAWK on Crown Road — the shadow first (ev_moltres)', [
    'panel-crownroad-pyrehawk 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): PYREHAWK on Crown Road / Victory Road',
    '(ev_moltres). Original in-house art, generated deterministically',
    'by w10b-rig/gen-panels-t4.mjs. Brief = the species design record',
    '(ember hawk, flame-feathered wings, fierce crest) + the event say',
    'text ("the shadows thrown on the wall have wings. Far too many',
    'wings") — the composition is shadow-led, the hawk itself small.',
  ], [
    ['O', '#120806', 'frame outline'], ['K', '#1d0f08', 'cavern deepest'], ['D', '#33200f', 'cavern rock'],
    ['W', '#caa06a', 'lit wall'], ['w', '#9a743f', 'wall shade'], ['S', '#170b04', 'the shadow'],
    ['M', '#e8641e', 'crack heat'], ['m', '#f2a03c', 'heat bright'], ['R', '#8a3a20', 'hawk ember'],
    ['r', '#5e2413', 'hawk shade'], ['F', '#e8641e', 'flame feather'], ['Y', '#f8e58a', 'beak / eye'],
  ], g.grid);
}

// =====================================================================
// 3. GLACIERNE — ev_articuno @ seafoamislands (Seafoam)
// design: animal — sea eagle — great ice sea-eagle, frost crest,
//  glacier-blue wings
// say: "Your breath fogs in the still air. Somewhere deep in the ice,
//  something exhales winter itself — slow, and unbothered by
//  centuries."
// =====================================================================
function sceneSeafoamGlacierne() {
  const g = canvas('D');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'D' : y < 56 ? 'd' : 'L');
  // ice columns (tapered, faceted) at the edges
  const column = (x0, w0) => {
    for (let y = 6; y < 62; y++) { const w = w0 - Math.floor(Math.abs(y - 34) / 14); g.rect(x0, y, x0 + w, y, 'd'); g.set(x0, y, 'L'); }
    g.speckle({ from: ['d'], to: ['L', 'D'] }, [x0, 6, x0 + w0, 62], 9, x0);
  };
  column(4, 10); column(112, 10);
  // hanging icicles
  for (const [ix, len] of [[24, 9], [38, 6], [88, 8], [100, 5]]) g.tri(ix, 0, ix + 4, 0, ix + 2, len, 'L');
  // the frozen floor: crack lines + frost blooms
  g.rect(0, 62, W - 1, H - 1, 'l');
  g.line(10, 68, 44, 66, 'd'); g.line(80, 70, 118, 67, 'd'); g.line(40, 74, 76, 72, 'd');
  for (const [fx, fy] of [[18, 71], [104, 73], [58, 76]]) { g.set(fx, fy, 'W'); g.set(fx - 2, fy, 'W'); g.set(fx + 2, fy, 'W'); g.set(fx, fy - 2, 'W'); g.set(fx, fy + 2, 'W'); }
  // the ice shelf at the cavern's heart
  g.ellipse(64, 60, 26, 5, 'l'); g.ellipse(64, 58, 24, 4.4, 'W');
  // ---- GLACIERNE on the shelf (centre) ----
  // long tail plumes flowing back over the shelf edge
  g.tri(56, 52, 36, 62, 54, 58, 'B'); g.tri(58, 54, 42, 66, 56, 59, 'b');
  // body (great sea-eagle, white head register, glacier body)
  g.ellipse(64, 46, 13, 9, 'B'); g.ellipse(64, 48.4, 12, 7.2, 'b'); g.ellipse(63, 44.4, 11.6, 7.2, 'B');
  g.ellipse(64, 41, 10, 5.4, 'W'); // white breast up into the neck
  // wings half-spread: glacier-blue, feather-ticked
  g.tri(54, 40, 30, 30, 44, 52, 'B'); g.tri(74, 40, 98, 30, 84, 52, 'B');
  g.tri(54, 42, 36, 34, 46, 50, 'b'); g.tri(74, 42, 92, 34, 82, 50, 'b');
  for (let i = 0; i < 4; i++) { g.line(50 - i * 4, 40 + i * 2, 44 - i * 4, 46 + i * 2, 'b'); g.line(78 + i * 4, 40 + i * 2, 84 + i * 4, 46 + i * 2, 'b'); }
  // head + frost crest (white spikes) + beak
  g.ellipse(64, 32, 6, 5, 'W'); g.ellipse(64.6, 33.4, 5, 4, 'l'); g.ellipse(63.4, 31, 5, 3.8, 'W');
  for (let i = 0; i < 5; i++) g.tri(59 + i * 2.4, 28, 61 + i * 2.4, 28, 60 + i * 2.4, 21 + (i === 2 ? -2 : 0), 'W');
  g.speckle({ from: ['W'], to: ['l'] }, [58, 20, 70, 28], 4, 8); // frost rime on the crest
  g.tri(68, 31, 74, 32.6, 68, 34.4, 'Y'); // beak
  g.set(65, 31.4, 'O'); // calm eye
  // legs gripping the shelf
  g.line(60, 53, 59, 57, 'Y'); g.line(68, 53, 69, 57, 'Y');
  // the exhale: breath fog curling from the beak, slow
  g.ellipse(80, 30, 4, 1.8, 'l', 0.3); g.ellipse(87, 28.4, 5, 2.2, 'l', 0.2); g.ellipse(95, 27.4, 5.4, 2.4, 'D', 0.2);
  g.dissolve('l', ['l', 'D'], 2, 31);
  // falling snow, sparse and unbothered
  for (let i = 0; i < 26; i++) {
    const x = 6 + hash(i, 29) % 116, y = 4 + hash(i, 37) % 66;
    if (['D', 'd', 'L'].includes(g.get(x, y))) g.set(x, y, 'W');
  }
  g.frame('O');
  return emit('panel-seafoam-glacierne', 'GLACIERNE in the Seafoam ice (ev_articuno)', [
    'panel-seafoam-glacierne 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): GLACIERNE deep in the Seafoam ice (ev_articuno).',
    'Original in-house art, generated deterministically by',
    'w10b-rig/gen-panels-t4.mjs. Brief = the species design record',
    '(great ice sea-eagle, frost crest, glacier-blue wings) + the',
    'event say text ("something exhales winter itself — slow, and',
    'unbothered by centuries") — its breath fog is in the frame.',
  ], [
    ['O', '#0a141e', 'frame outline'], ['D', '#14344e', 'ice deep'], ['d', '#1f567e', 'ice mid'],
    ['L', '#7fb8d8', 'ice light'], ['l', '#bfe2f2', 'ice pale'], ['W', '#f2f8fc', 'snow / frost'],
    ['B', '#4a90c2', 'glacier wing'], ['b', '#2c6494', 'glacier shade'], ['Y', '#d8b85e', 'beak / feet'],
  ], g.grid);
}

// =====================================================================
// 4. OMNIGEN — ev_mewtwo @ ceruleancave (Tidehaven Cave)
// design: cosmic — seraph — pale violet seraph, halo ring, twin
//  orbiting orbs, closed eyes
// say: "At the heart of it: a stillness shaped like a person who
//  never asked to exist. The journals were right. It dreams — and it
//  has been dreaming of the day someone strong enough arrived."
// =====================================================================
function sceneStillheartOmnigen() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'K' : y < 58 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 58], 19, 4); // cave grain
  // cave masses at the edges
  g.ellipse(4, 10, 15, 17, 'K'); g.ellipse(124, 12, 15, 16, 'K'); g.ellipse(8, 62, 17, 11, 'K'); g.ellipse(122, 64, 16, 11, 'K');
  // the still pool (bottom): mirror-smooth, one sheen line
  g.rect(0, 62, W - 1, H - 1, 'P');
  g.line(16, 68, 112, 68, 'p'); g.line(40, 73, 88, 73, 'p');
  g.speckle({ from: ['P'], to: ['p'] }, [0, 62, 127, 79], 37, 9);
  // the flat stone at the pool's heart
  g.ellipse(64, 61, 15, 3.2, 'd'); g.ellipse(64, 60, 13, 2.6, 'D');
  // ---- OMNIGEN standing in the stillness (centre) ----
  // the long tail curling from behind, down to the pool's edge
  g.line(58, 52, 48, 58, 'v'); g.line(48, 58, 50, 63, 'v'); g.line(50, 63, 58, 64, 'v');
  g.line(58, 52, 48, 58, 'V'); g.set(57, 64, 'V');
  // robe-like body: a tapered, settled column
  g.tri(56, 58, 72, 58, 68, 30, 'V'); g.tri(56, 58, 60, 30, 68, 30, 'V');
  g.ellipse(64, 56, 8.4, 4, 'V'); g.ellipse(64, 40, 7.6, 10, 'V');
  g.ellipse(66, 42, 5.6, 9.4, 'v'); g.ellipse(63, 39, 5.6, 9.4, 'V'); // shade right, lit left
  // arms resting crossed-low (seraph stillness, not a fighter's pose)
  g.line(59, 38, 66, 47, 'v'); g.line(69, 38, 62, 47, 'v');
  g.ellipse(64, 47.4, 3, 2, 'W');
  // head: smooth, eyes CLOSED (two calm ticks) — it dreams
  g.ellipse(64, 25, 6.2, 6.8, 'V'); g.ellipse(65, 26.6, 5, 5.6, 'v'); g.ellipse(63.4, 24, 5, 5.4, 'V');
  g.line(60, 25, 62, 25, 'K'); g.line(66, 25, 68, 25, 'K'); // closed eyes
  // the halo ring behind the head
  g.ring(64, 22, 10.4, 10.4, 'H', 0.10); g.ring(64, 22, 10.4, 10.4, 'h', 0.05);
  // twin orbiting orbs at shoulder height, with faint orbit rings
  for (const [ox, oy] of [[44, 34], [84, 34]]) {
    g.ring(ox, oy, 6.4, 3.4, 'd', 0.08, 0.4);
    g.ellipse(ox, oy, 2.8, 2.8, 'p'); g.ellipse(ox - 0.8, oy - 0.8, 1.2, 1, 'W');
  }
  // faint reflection in the pool: figure smudge + halo glint
  g.ellipse(64, 70, 6, 2.6, 'v'); g.set(64, 66, 'h'); g.set(60, 68, 'h'); g.set(68, 68, 'h');
  // dreaming motes: three slow sparks of thought above the halo
  for (const [mx, my] of [[56, 8], [64, 5], [72, 8]]) g.set(mx, my, 'H');
  g.frame('O');
  return emit('panel-stillheart-omnigen', 'OMNIGEN dreaming at the cave heart (ev_mewtwo)', [
    'panel-stillheart-omnigen 128x80. W10-B T4 cutscene panel (Class',
    'B battle reveal): OMNIGEN at the heart of Tidehaven Cave /',
    'Cerulean Cave (ev_mewtwo). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t4.mjs. Brief = the',
    'species design record (pale violet seraph, halo ring, twin',
    'orbiting orbs, closed eyes) + the event say text ("a stillness',
    'shaped like a person who never asked to exist... It dreams").',
  ], [
    ['O', '#0c0a14', 'frame outline'], ['K', '#171226', 'cave deepest'], ['D', '#241a3a', 'cave dark'],
    ['d', '#372a56', 'cave mid / stone'], ['P', '#1a2f4a', 'pool deep'], ['p', '#3f6ea6', 'pool sheen / orb'],
    ['V', '#b8a8d8', 'seraph violet'], ['v', '#8a76b8', 'violet shade'], ['W', '#efeaf6', 'seraph pale'],
    ['H', '#d9c27a', 'halo gold'], ['h', '#9a843e', 'halo shade'],
  ], g.grid);
}

// =====================================================================
// 5. PRIMARA — ev_movie_climax @ newisland (Exile Isle, the storm)
// design: cosmic — primordial sprite — tiny opal primordial sprite,
//  ribbon tail, floating
// say: "And then — through the rain, small as a soap bubble and twice
//  as unbothered — something pink drifts down and lands on the
//  railing... It is not afraid of any of it. It wants to PLAY."
// =====================================================================
function sceneRainPrimara() {
  const g = canvas('N');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'N' : y < 52 ? 'n' : 'S');
  // the sea below the cliffs, spray-flecked
  g.speckle({ from: ['S'], to: ['s'] }, [0, 52, 127, 63], 7, 3);
  // something enormous turning in the water (far, low-left): a vast
  // dark back + its spray ring — the storm's other guest
  g.ellipse(22, 57, 17, 4.6, 'K'); g.ellipse(22, 55.6, 15, 3.6, 'K');
  g.ring(22, 57, 19, 5.4, 's', 0.14); g.speckle({ from: ['s'], to: ['S'] }, [2, 51, 42, 63], 3, 6);
  // far lightning, top-right (jagged, distant)
  g.line(104, 2, 100, 10, 'Y'); g.line(100, 10, 104, 12, 'Y'); g.line(104, 12, 99, 22, 'Y');
  g.set(105, 6, 'Y'); g.set(98, 16, 'Y');
  // the castle balcony: balustrade across the lower third
  g.rect(0, 64, W - 1, 66, 'c'); g.rect(0, 66, W - 1, 66, 'C'); // the rail
  for (let x = 4; x < W - 2; x += 8) g.rect(x, 67, x + 3, 74, 'C'); // balusters
  g.rect(0, 75, W - 1, H - 1, 'C'); g.rect(0, 75, W - 1, 75, 'c'); // balcony floor band
  g.speckle({ from: ['C'], to: ['c'] }, [0, 64, 127, 79], 8, 12);
  // ---- PRIMARA on the railing (centre): TINY, per the text ----
  // its faint glow first (opal light on wet stone)
  g.ring(64, 58, 9.2, 8, 'p', 0.05); g.ring(64, 58, 7.4, 6.4, 'W', 0.10); g.ellipse(64, 58, 5.2, 4.6, 'p');
  g.ellipse(64, 63, 6, 1.6, 'p'); // glow pooled on the rail
  // the sprite: a soap-bubble body, opal-sheened
  g.ellipse(64, 58, 3.6, 3.4, 'P'); g.ellipse(63, 56.8, 2.2, 1.8, 'W'); // opal crown light
  g.ellipse(65.2, 59.4, 2, 1.8, 'p'); // pink shade low-right
  g.ellipse(63.4, 57.6, 2.4, 2.2, 'P');
  g.set(62.6, 57.8, 'O'); g.set(65.4, 57.8, 'O'); // two unafraid eyes
  // ears: two small points
  g.tri(61.4, 55.6, 62.6, 55.6, 62, 53.8, 'P'); g.tri(65.4, 55.6, 66.6, 55.6, 66, 53.8, 'P');
  // the ribbon tail, curling off the rail
  g.line(67, 60, 71, 61, 'p'); g.line(71, 61, 72.4, 58.6, 'p'); g.line(72.4, 58.6, 70.6, 57.4, 'P');
  // feet on the rail
  g.set(62.6, 61.6, 'p'); g.set(65.4, 61.6, 'p');
  // the rain: diagonal streaks everywhere EXCEPT its calm (drawn last
  // so the storm owns the frame; the sprite's glow ring stays dry)
  for (let i = 0; i < 90; i++) {
    const x = hash(i, 41) % 128, y = hash(i, 43) % 62;
    const dx = x - 64, dy = y - 58;
    if (dx * dx + dy * dy < 64) continue; // the unbothered bubble of calm
    if (['N', 'n', 'S'].includes(g.get(x, y))) { g.set(x, y, 'R'); g.set(x - 1, y + 2, 'R'); }
  }
  g.frame('O');
  return emit('panel-rain-primara', 'PRIMARA lands on the railing in the storm (ev_movie_climax)', [
    'panel-rain-primara 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): PRIMARA drifting down through the rain to the',
    'castle railing on Exile Isle / New Island (ev_movie_climax).',
    'Original in-house art, generated deterministically by',
    'w10b-rig/gen-panels-t4.mjs. Brief = the species design record',
    '(tiny opal primordial sprite, ribbon tail, floating) + the',
    'event say text ("small as a soap bubble and twice as',
    'unbothered... It wants to PLAY") — the sprite is drawn TINY',
    'against the storm, with the vast shape turning in the water',
    'below (the same event, step 2).',
  ], [
    ['O', '#0d1020', 'frame outline'], ['N', '#232c48', 'storm sky'], ['n', '#323e63', 'sky mid'],
    ['R', '#7f96c4', 'rain streak'], ['S', '#16283f', 'sea dark'], ['s', '#5e7ea6', 'spray'],
    ['K', '#0a1420', 'the vast back'], ['C', '#4a4356', 'castle stone'], ['c', '#665e78', 'stone light'],
    ['P', '#f2a8c8', 'sprite pink'], ['p', '#d8709e', 'pink shade'], ['W', '#fdf2f8', 'opal light'],
    ['Y', '#f8ecc0', 'far lightning'],
  ], g.grid);
}

// =====================================================================
// 6. PYREHAWK QUELL — ev_orange_2000_moltres @ fire-cave (Sanctum
//  isles, the fire shrine)
// design: animal — hawk — ember hawk, flame-feathered wings, fierce
//  crest
// say: "The shrine niche is wrapped in bars of hard light, humming —
//  Halloway's cage... the kind fires have gone white and furious,
//  and the heat coming off the altar has a heartbeat."
// venue: fire-cave map trigger (maps5), verified in the SPEC.
// =====================================================================
function sceneCagefirePyrehawk() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 40 ? 'K' : y < 62 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 62], 21, 7);
  // the shrine niche: an arch of old stone, centre-back
  g.rect(40, 10, 88, 58, 'D'); g.rect(40, 10, 88, 13, 'd'); g.rect(40, 10, 43, 58, 'd'); g.rect(85, 10, 88, 58, 'd');
  g.rect(44, 14, 84, 58, 'K'); // niche interior dark
  // the altar block + the kind fires, gone WHITE at the core
  g.rect(52, 48, 76, 58, 'd'); g.rect(52, 48, 76, 49, 'D');
  const flame = (cx, base, hgt) => {
    g.tri(cx - 4, base, cx + 4, base, cx, base - hgt, 'F');
    g.tri(cx - 2.4, base, cx + 2.4, base, cx, base - hgt * 0.72, 'm');
    g.tri(cx - 1.2, base, cx + 1.2, base, cx, base - hgt * 0.44, 'M');
  };
  flame(55, 48, 16); flame(64, 48, 10); flame(73, 48, 15);
  g.ellipse(64, 53, 10, 2, 'm'); g.ellipse(64, 53, 6, 1.4, 'M'); // altar-front glow
  // ---- PYREHAWK behind the bars, wings half-raised, answering ----
  // wings up behind the fires (ember, flame-ticked edges)
  g.tri(62, 30, 46, 16, 52, 36, 'R'); g.tri(66, 30, 82, 16, 76, 36, 'R');
  for (let i = 0; i < 4; i++) { g.set(50 + i * 2, 22 + i * 2, 'F'); g.set(78 - i * 2, 22 + i * 2, 'F'); }
  // body low over the altar, between the flames
  g.ellipse(64, 40, 7.4, 8.4, 'R'); g.ellipse(64, 42, 6.2, 6.8, 'r'); g.ellipse(63.4, 38.6, 6, 6.6, 'R');
  // head high, fierce crest, beak open on the answer
  g.ellipse(64, 29, 4.8, 4.2, 'R'); g.ellipse(64.4, 30.2, 3.8, 3.2, 'r'); g.ellipse(63.6, 28.2, 3.8, 3, 'R');
  for (let i = 0; i < 3; i++) g.tri(61 + i * 2.4, 25.4, 63 + i * 2.4, 25.4, 62 + i * 2.4, 19.4 + (i === 1 ? -2 : 0), 'F');
  g.tri(67, 28.4, 72, 29.6, 67, 31, 'Y'); g.tri(67, 31, 71, 32.6, 67, 32.8, 'Y'); // open beak
  g.set(65, 28.6, 'M'); // white-hot eye
  // ---- the cage: bars of HARD LIGHT across the niche front ----
  for (const bx of [46, 54, 62, 70, 78]) {
    g.rect(bx, 12, bx + 1, 58, 'L'); g.set(bx + 2, 12, 'l');
    for (let y = 14; y < 58; y += 6) g.set(bx + 2, y, 'l');
  }
  g.rect(42, 12, 86, 13, 'L'); g.rect(42, 56, 86, 57, 'L'); // cage rails
  // one bar CRACKED (the cage answering the noise): the x=62 bar,
  // broken at y~36 with light shards fallen to the floor
  g.rect(62, 34, 63, 39, 'K'); g.line(62, 34, 64, 36, 'L'); g.line(64, 36, 62, 39, 'L');
  g.tri(58, 62, 62, 62, 60, 59, 'L'); g.set(66, 61, 'L'); g.set(55, 63, 'l'); // fallen shards
  // heat flecks escaping through the bars
  for (let i = 0; i < 10; i++) {
    const x = 30 + hash(i, 47) % 68, y = 16 + hash(i, 53) % 40;
    if (['K', 'D'].includes(g.get(x, y))) g.set(x, y, 'm');
  }
  g.frame('O');
  return emit('panel-cagefire-pyrehawk', 'PYREHAWK caged in the Fire Shrine (ev_orange_2000_moltres)', [
    'panel-cagefire-pyrehawk 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): PYREHAWK in Halloway\'s light-cage at the Fire',
    'Shrine, Fire Cave (ev_orange_2000_moltres). Original in-house',
    'art, generated deterministically by w10b-rig/gen-panels-t4.mjs.',
    'Brief = the species design record (ember hawk, flame-feathered',
    'wings, fierce crest) + the event say text ("bars of hard light,',
    'humming — Halloway\'s cage... the kind fires have gone white',
    'and furious") — one cage bar is already cracking.',
  ], [
    ['O', '#120806', 'frame outline'], ['K', '#22100a', 'cave deepest'], ['D', '#3a2012', 'shrine stone'],
    ['d', '#59331c', 'stone shade'], ['L', '#cfe8f2', 'hard light'], ['l', '#7fa8bc', 'light dim'],
    ['M', '#fff3d8', 'white fire core'], ['m', '#f2a03c', 'fire bright'], ['F', '#e8641e', 'flame'],
    ['R', '#8a3a20', 'hawk ember'], ['r', '#5e2413', 'hawk shade'], ['Y', '#f8e58a', 'beak'],
  ], g.grid);
}

// =====================================================================
// 7. FULMINIS QUELL — ev_orange_2000_zapdos @ lightning-cave (the
//  lightning shrine)
// design: animal — eagle — great brown eagle, navy flight feathers,
//  sparking wingtips
// say: "Copper offerings have fused into the cage bars, and the
//  whole shrine rings at a pitch just below hearing... What rises
//  out of the shrine is not angry the way fire is angry. It is angry
//  the way weather is angry: personally, and at everything."
// venue: lightning-cave map trigger (maps5), verified in the SPEC.
// =====================================================================
function sceneCagestormFulminis() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 40 ? 'K' : y < 62 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 62], 15, 3);
  // storm light shaft falling behind the shrine (weather, indoors)
  for (let y = 0; y < 56; y++) for (let x = 0; x < W; x++) {
    if (Math.abs(x - 64) < 6 + y * 0.36 && g.get(x, y) === 'K') g.set(x, y, 'D');
  }
  g.speckle({ from: ['D'], to: ['d'] }, [30, 0, 98, 40], 11, 21);
  // the shrine: stone niche + altar (the storm register of the set)
  g.rect(40, 12, 88, 58, 'D'); g.rect(40, 12, 88, 15, 'd'); g.rect(40, 12, 43, 58, 'd'); g.rect(85, 12, 88, 58, 'd');
  g.rect(44, 16, 84, 58, 'K');
  g.rect(52, 50, 76, 58, 'd'); g.rect(52, 50, 76, 51, 'D');
  // copper offerings fused at the cage base: bowls melted into slag
  for (const bx of [48, 58, 70, 80]) { g.ellipse(bx, 57, 3.6, 1.8, 'C'); g.ellipse(bx, 58, 3, 1.2, 'c'); }
  g.line(46, 58, 82, 58, 'c');
  // ---- FULMINIS RISING out of the shrine ----
  // wings high-spread (navy over brown), tips past the niche arch
  g.tri(62, 34, 34, 14, 50, 40, 'N'); g.tri(66, 34, 94, 14, 78, 40, 'N');
  g.tri(62, 36, 42, 22, 52, 42, 'B'); g.tri(66, 36, 86, 22, 76, 42, 'B');
  for (let i = 0; i < 4; i++) { g.line(52 - i * 4, 26 + i * 3, 46 - i * 4, 32 + i * 3, 'n'); g.line(76 + i * 4, 26 + i * 3, 82 + i * 4, 32 + i * 3, 'n'); }
  // body rising, breast lit by the shaft
  g.ellipse(64, 42, 9.4, 10, 'B'); g.ellipse(64, 44.4, 8, 8, 'b'); g.ellipse(63.4, 40.4, 7.8, 8.2, 'B');
  g.ellipse(64, 37.6, 5, 3.8, 'W'); // storm-lit breast
  // tail fanned below, navy
  g.tri(60, 50, 68, 50, 64, 58, 'N'); g.tri(61, 50, 67, 50, 64, 56, 'n');
  // head high, beak open on the thunderclap-sentence
  g.ellipse(64, 28, 5.4, 4.6, 'B'); g.ellipse(64.4, 29.4, 4.4, 3.6, 'b'); g.ellipse(63.6, 27.2, 4.4, 3.4, 'B');
  g.tri(68, 27, 74, 28.2, 68, 29.6, 'Y'); g.tri(68, 29.6, 73, 31.4, 68, 31.2, 'Y');
  g.set(65, 27.6, 'Y'); // furious amber eye
  // spark showers off both wingtips
  for (const [ox, dir] of [[36, -1], [92, 1]]) {
    for (let i = 0; i < 7; i++) {
      const x = ox + dir * (hash(i, ox) % 5), y = 18 + i * 5 + (hash(i, 59) % 3);
      g.set(x, y, 'Y'); if (i % 2) g.set(x + dir, y + 2, 'W');
    }
  }
  // ---- the cage: bars of hard light, ONE DOWN ----
  for (const bx of [46, 54, 70, 78]) { g.rect(bx, 14, bx + 1, 58, 'L'); g.set(bx + 2, 20, 'l'); }
  g.rect(42, 14, 86, 15, 'L'); g.rect(42, 56, 86, 57, 'L');
  // the fallen bar: diagonal across the floor, still lit
  g.line(52, 62, 76, 70, 'L', 1); g.line(53, 61, 77, 69, 'l');
  g.set(64, 65, 'W');
  g.frame('O');
  return emit('panel-cagestorm-fulminis', 'FULMINIS rises out of the Lightning Shrine (ev_orange_2000_zapdos)', [
    'panel-cagestorm-fulminis 128x80. W10-B T4 cutscene panel (Class',
    'B battle reveal): FULMINIS rising out of the Lightning Shrine,',
    'Lightning Cave (ev_orange_2000_zapdos). Original in-house art,',
    'generated deterministically by w10b-rig/gen-panels-t4.mjs.',
    'Brief = the species design record (great brown eagle, navy',
    'flight feathers, sparking wingtips) + the event say text',
    '("Copper offerings have fused into the cage bars... angry the',
    'way weather is angry") — one bar is down, the eagle is rising.',
  ], [
    ['O', '#0c0e16', 'frame outline'], ['K', '#1a1c26', 'cave deepest'], ['D', '#2c2f3d', 'shrine stone'],
    ['d', '#454a5e', 'stone shade / shaft'], ['L', '#cfe8f2', 'hard light'], ['l', '#7fa8bc', 'light dim'],
    ['C', '#b87333', 'copper offering'], ['c', '#7e4c1e', 'copper shade'], ['B', '#7a5230', 'eagle brown'],
    ['b', '#54371e', 'brown shade'], ['N', '#2c3a5e', 'navy feather'], ['n', '#1f2c4a', 'navy shade'],
    ['Y', '#f2c230', 'spark / eye'], ['W', '#efe6cc', 'storm-lit breast'],
  ], g.grid);
}

// =====================================================================
// 8. GLACIERNE QUELL — ev_orange_2000_articuno @ ice-cave (the ice
//  shrine)
// design: animal — sea eagle — great ice sea-eagle, frost crest,
//  glacier-blue wings
// say: "The cage bars are rimes of black ice over hard light, and
//  the shrine's frozen offerings hang mid-gesture inside it...
//  GLACIERNE unfolds from the shrine the way winter unfolds from a
//  mountain: slowly, beautifully."
// venue: ice-cave map trigger (maps5), verified in the SPEC.
// =====================================================================
function sceneCageiceGlacierne() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 40 ? 'K' : y < 62 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 62], 13, 5);
  // the shrine: ice-stone niche + altar
  g.rect(40, 12, 88, 58, 'D'); g.rect(40, 12, 88, 15, 'd'); g.rect(40, 12, 43, 58, 'd'); g.rect(85, 12, 88, 58, 'd');
  g.rect(44, 16, 84, 58, 'K');
  g.rect(52, 50, 76, 58, 'd'); g.rect(52, 50, 76, 51, 'D');
  // frozen offerings: shapes suspended mid-gesture in ice blocks,
  // hanging either side of the niche
  for (const [ox, oy] of [[30, 26], [98, 26], [30, 42], [98, 42]]) {
    g.rect(ox - 4, oy - 5, ox + 4, oy + 5, 'P'); g.rect(ox - 4, oy - 5, ox + 4, oy - 5, 'W');
    g.ellipse(ox, oy, 2.2, 3, 'd'); g.set(ox, oy - 6, 'l'); // its hanging thread of rime
  }
  // ---- GLACIERNE UNFOLDING from the shrine ----
  // the opening wing (right): wide, glacier-blue, mid-unfold
  g.tri(70, 34, 100, 22, 84, 46, 'G'); g.tri(70, 36, 94, 27, 82, 46, 'g');
  for (let i = 0; i < 4; i++) g.line(78 + i * 4, 30 + i * 2, 84 + i * 4, 36 + i * 2, 'W');
  // the still-folded wing (left): a smooth closed blade
  g.ellipse(56, 38, 5.4, 9, 'g', 0.5); g.ellipse(55, 37, 4.4, 8, 'G', 0.5);
  // body rising from the altar, white breast
  g.ellipse(64, 42, 8.6, 9.4, 'G'); g.ellipse(64, 44.4, 7.4, 7.4, 'g'); g.ellipse(63.4, 40.4, 7.2, 7.4, 'G');
  g.ellipse(64, 39, 6.2, 5.4, 'W');
  // tail plumes over the altar edge
  g.tri(60, 50, 52, 57, 62, 54, 'G'); g.tri(63, 50, 58, 58, 65, 54, 'g');
  // head: frost crest, the slow beautiful indifference
  g.ellipse(64, 29, 5.2, 4.4, 'W'); g.ellipse(64.5, 30.2, 4.2, 3.4, 'P'); g.ellipse(63.5, 28.2, 4.2, 3.2, 'W');
  for (let i = 0; i < 4; i++) g.tri(60 + i * 2.4, 25.4, 62 + i * 2.4, 25.4, 61 + i * 2.4, 19.6 + (i === 1 ? -1.6 : 0), 'W');
  g.tri(68, 28.4, 73, 29.8, 68, 31.2, 'Y');
  g.set(65, 28.8, 'O'); // the calm eye (contrast: the fire/storm fury)
  // ---- the cage: bars of BLACK ICE over hard light ----
  for (const bx of [46, 54, 62, 70, 78]) {
    g.rect(bx, 14, bx + 2, 58, 'B'); g.set(bx, 14, 'L'); // rimed cap
    for (let y = 18; y < 58; y += 7) g.set(bx + 1, y, 'L'); // light seams through the rime
  }
  g.rect(42, 14, 86, 15, 'B'); g.rect(42, 56, 86, 57, 'B');
  // the shattering: a ring of snow bursting outward at the base
  g.ring(64, 56, 26, 5.4, 'W', 0.16);
  for (let i = 0; i < 26; i++) {
    const t = (hash(i, 61) % 628) / 100, x = Math.round(64 + 30 * Math.cos(t)), y = Math.round(54 + 8 * Math.sin(t));
    if (x > 2 && x < 126 && y > 2 && y < 77) g.set(x, y, 'W');
  }
  g.speckle({ from: ['K'], to: ['W'] }, [8, 58, 120, 70], 23, 11); // settled snow drift
  g.frame('O');
  return emit('panel-cageice-glacierne', 'GLACIERNE unfolds from the Ice Shrine (ev_orange_2000_articuno)', [
    'panel-cageice-glacierne 128x80. W10-B T4 cutscene panel (Class',
    'B battle reveal): GLACIERNE unfolding from the Ice Shrine, Ice',
    'Cave (ev_orange_2000_articuno). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t4.mjs. Brief = the',
    'species design record (great ice sea-eagle, frost crest,',
    'glacier-blue wings) + the event say text ("cage bars are rimes',
    'of black ice over hard light... unfolds the way winter unfolds',
    'from a mountain: slowly, beautifully") — one wing still folded.',
  ], [
    ['O', '#081018', 'frame outline'], ['K', '#101e2c', 'cave deepest'], ['D', '#1d3a52', 'ice stone'],
    ['d', '#2c587e', 'stone shade'], ['L', '#d8f0fa', 'hard light'], ['l', '#8fc0d8', 'rime thread'],
    ['B', '#0e1620', 'black ice bar'], ['W', '#f2f8fc', 'snow / breast'], ['G', '#4a90c2', 'glacier wing'],
    ['g', '#2c6494', 'glacier shade'], ['P', '#bfe2f2', 'frozen offering ice'], ['Y', '#d8b85e', 'beak'],
  ], g.grid);
}

// =====================================================================
// 9. ABYSSORN CLIMAX — ev_orange_2000_climax @ shamouti-deep (the
//  deep chamber)
// design: class — sea bird — white leviathan sea-bird, wing fins,
//  crest plume
// say (step 6): "It rises the way the tide rises: not fast, not
//  slow — inevitably. Wings like white headlands. Eyes that have
//  watched ten thousand festivals... The guardian of the sea does
//  not rage. It MEASURES."
// =====================================================================
function sceneDeepAbyssorn() {
  const g = canvas('D');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 26 ? 'D' : y < 48 ? 'd' : 'O');
  // light shafts from the broken surface above
  for (const [sx, sw] of [[30, 7], [62, 9], [94, 6]]) {
    for (let y = 0; y < 50; y++) for (let x = sx - sw / 2 - y * 0.14; x < sx + sw / 2 - y * 0.14; x++) {
      if (x >= 0 && x < W && ['D', 'd'].includes(g.get(Math.round(x), y))) g.set(Math.round(x), y, 'L');
    }
  }
  g.speckle({ from: ['L'], to: ['l'] }, [0, 0, 127, 50], 8, 13);
  // the deep water (lower half), its surface line at y=48
  g.rect(0, 48, W - 1, H - 1, 'O');
  g.line(0, 48, W - 1, 48, 'l');
  g.speckle({ from: ['O'], to: ['d'] }, [0, 50, 127, 79], 15, 17);
  // the sealed altar, low left, waiting its part
  g.rect(10, 58, 30, 66, 'A'); g.rect(10, 58, 30, 59, 'a'); g.line(13, 62, 27, 62, 'a');
  // ---- ABYSSORN RISING from the deep (centre-right) ----
  // wings like white headlands: broad fin-wings spread, ray-finned
  g.tri(58, 40, 16, 26, 40, 48, 'W'); g.tri(76, 40, 118, 24, 94, 48, 'W');
  g.tri(58, 42, 24, 32, 42, 48, 'w'); g.tri(76, 42, 110, 30, 92, 48, 'w');
  for (let i = 0; i < 4; i++) { g.line(52 - i * 7, 38 - i, 44 - i * 7, 44 - i, 'B'); g.line(82 + i * 7, 38 - i, 90 + i * 7, 44 - i, 'B'); } // fin rays
  // the great body breasting the surface
  g.ellipse(67, 47, 15, 9, 'W'); g.ellipse(67, 50, 14, 7, 'w'); g.ellipse(66, 45.4, 13.4, 7, 'W');
  // neck rising, head high — measuring, not raging
  g.ellipse(67, 34, 6, 9, 'W', 0.1); g.ellipse(68.4, 35, 4.6, 8.4, 'w', 0.1); g.ellipse(66.2, 33.4, 4.6, 8.4, 'W', 0.1);
  g.ellipse(67, 24, 6.4, 4.6, 'W', -0.1); g.ellipse(67.6, 25.4, 5.4, 3.6, 'w', -0.1); g.ellipse(66.4, 23.2, 5.4, 3.4, 'W', -0.1);
  // crest plume swept back + the beak, level
  g.tri(62, 21, 52, 16, 61, 24, 'W'); g.tri(61, 22.4, 54, 19, 60, 25, 'w');
  g.tri(72, 23, 79, 24.2, 72, 26, 'Y');
  g.set(65, 23.4, 'O'); g.set(69, 23.4, 'O'); // eyes that have watched ten thousand festivals
  // foam ring + spray where the body meets the water
  g.ring(67, 51, 20, 4.6, 'l', 0.2); g.ring(67, 51, 24, 5.6, 'W', 0.08);
  for (let i = 0; i < 18; i++) {
    const x = 44 + hash(i, 67) % 48, y = 44 + hash(i, 71) % 8;
    if (g.get(x, y) === 'O' || g.get(x, y) === 'l') g.set(x, y, 'W');
  }
  // bubbles rising through the shafts
  for (const [bx, by] of [[36, 36], [40, 26], [92, 32], [97, 20], [58, 14]]) g.ring(bx, by, 1.5, 1.5, 'l', 0.4);
  g.frame('O');
  return emit('panel-deep-abyssorn', 'ABYSSORN rises in the deep chamber (ev_orange_2000_climax)', [
    'panel-deep-abyssorn 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): ABYSSORN rising in the deep chamber of Shamouti',
    'Deep (ev_orange_2000_climax). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t4.mjs. Brief = the',
    'species design record (white leviathan sea-bird, wing fins,',
    'crest plume) + the event say text ("It rises the way the tide',
    'rises... Wings like white headlands... It MEASURES").',
  ], [
    ['O', '#06121c', 'frame outline / deep'], ['D', '#0a2438', 'water gloom'], ['d', '#11405e', 'water mid'],
    ['L', '#7fc4de', 'shaft light'], ['l', '#bfe8f4', 'shaft pale / foam'], ['W', '#f4f9fc', 'guardian white'],
    ['w', '#b9d2de', 'guardian shade'], ['B', '#3a7ca8', 'fin ray blue'], ['A', '#2c4a5e', 'altar stone'],
    ['a', '#1d3444', 'altar shade'], ['Y', '#e8c86a', 'beak'],
  ], g.grid);
}

// =====================================================================
// 10. ABYSSORN AT THE ALTAR — ev_orange_2000_lugia @ shamouti-deep
//  (the return visit)
// design: class — sea bird — white leviathan sea-bird, wing fins,
//  crest plume
// say: "The deep chamber is still as held breath. In the water-light
//  at the altar, immense and patient, the guardian waits — not
//  sleeping, not wary. Waiting the way the sea waits: because it
//  can, and because you came back."
// =====================================================================
function sceneAltarAbyssorn() {
  const g = canvas('D');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 26 ? 'D' : y < 48 ? 'd' : 'O');
  // ONE soft shaft, centre — the held-breath register of the chamber
  for (let y = 0; y < 52; y++) for (let x = 0; x < W; x++) {
    if (Math.abs(x - 58) < 5 + y * 0.16 && ['D', 'd'].includes(g.get(x, y))) g.set(x, y, 'L');
  }
  g.speckle({ from: ['L'], to: ['l'] }, [30, 0, 86, 50], 9, 23);
  // glassy water (lower half): one long sheen, no spray anywhere
  g.rect(0, 50, W - 1, H - 1, 'O');
  g.line(8, 50, 120, 50, 'l'); g.line(30, 56, 96, 56, 'd');
  g.speckle({ from: ['O'], to: ['d'] }, [0, 58, 127, 79], 20, 29);
  // the altar CENTRED, its water-light pooled above it
  g.ellipse(58, 47, 13, 3.4, 'l'); g.ellipse(58, 47, 9, 2.4, 'W');
  g.rect(48, 52, 68, 62, 'A'); g.rect(48, 52, 68, 53, 'a');
  g.line(52, 57, 64, 57, 'a'); g.set(58, 59, 'l'); // the altar's lit seam
  // ---- the guardian AT REST behind-right of the altar ----
  // folded wings: a smooth hull of a back, low in the still water
  g.ellipse(88, 52, 19, 7.4, 'W'); g.ellipse(88, 54.4, 18, 5.6, 'w'); g.ellipse(87, 50.8, 17, 5.6, 'W');
  g.line(74, 49, 100, 48, 'w'); // the folded wing's seam
  // neck up from the hull, head high and patient
  g.ellipse(76, 42, 5, 8.4, 'W', 0.35); g.ellipse(77.4, 43, 3.8, 7.8, 'w', 0.35); g.ellipse(75.2, 41.4, 3.8, 7.8, 'W', 0.35);
  g.ellipse(73, 32, 5.8, 4.2, 'W', -0.15); g.ellipse(73.6, 33.2, 4.8, 3.2, 'w', -0.15); g.ellipse(72.4, 31.2, 4.8, 3, 'W', -0.15);
  g.tri(68, 29.4, 60, 25, 67, 32, 'W'); g.tri(67.4, 30.4, 62, 27.4, 66.8, 32.2, 'w'); // crest plume
  g.tri(77, 31, 83, 32.2, 77, 33.6, 'Y'); // beak, level, at rest
  g.set(74, 31.4, 'O'); // one patient eye (near side)
  // the faintest ring where the hull meets the water — stillness
  g.ring(88, 55, 21, 3.8, 'l', 0.07);
  // motes drifting down through the shaft, slow
  for (let i = 0; i < 12; i++) {
    const x = 44 + hash(i, 73) % 30, y = 6 + hash(i, 79) % 40;
    if (['L', 'D', 'd'].includes(g.get(x, y))) g.set(x, y, 'l');
  }
  g.frame('O');
  return emit('panel-altar-abyssorn', 'ABYSSORN waiting at the altar (ev_orange_2000_lugia)', [
    'panel-altar-abyssorn 128x80. W10-B T4 cutscene panel (Class B',
    'battle reveal): ABYSSORN waiting at the altar in the deep',
    'chamber of Shamouti Deep, the return visit',
    '(ev_orange_2000_lugia). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t4.mjs. Brief = the',
    'species design record (white leviathan sea-bird, wing fins,',
    'crest plume) + the event say text ("still as held breath...',
    'immense and patient, the guardian waits") — the held-breath',
    'register of the climax panel\'s chamber: wings folded, altar',
    'centred, no spray.',
  ], [
    ['O', '#050e16', 'frame outline / deep'], ['D', '#081c2c', 'water gloom'], ['d', '#0e324c', 'water mid'],
    ['L', '#5ea8c4', 'shaft light'], ['l', '#9fd4e8', 'shaft pale / sheen'], ['W', '#e8f2f6', 'guardian white'],
    ['w', '#9fbecb', 'guardian shade'], ['A', '#24404f', 'altar stone'],
    ['a', '#162a38', 'altar shade'], ['Y', '#d8b85e', 'beak'],
  ], g.grid);
}

const SCENES = {
  'panel-plant-fulminis': scenePlantFulminis,
  'panel-crownroad-pyrehawk': sceneCrownroadPyrehawk,
  'panel-seafoam-glacierne': sceneSeafoamGlacierne,
  'panel-stillheart-omnigen': sceneStillheartOmnigen,
  'panel-rain-primara': sceneRainPrimara,
  'panel-cagefire-pyrehawk': sceneCagefirePyrehawk,
  'panel-cagestorm-fulminis': sceneCagestormFulminis,
  'panel-cageice-glacierne': sceneCageiceGlacierne,
  'panel-deep-abyssorn': sceneDeepAbyssorn,
  'panel-altar-abyssorn': sceneAltarAbyssorn,
};
const want = process.argv.slice(2);
for (const [id, fn] of Object.entries(SCENES)) if (!want.length || want.includes(id)) fn();
