// gen-panels.mjs — W10-B T1 sovereign panel generators (deterministic).
// Authors the 8 T1 panels (128x80, the W10 panel canvas standard) as
// .pix sources under assets/sprites/pix/keyart/. Each composition is
// drawn ONLY from its moment's recorded data: the Kin's W13 design
// field + the event's own build-up say text + the venue record
// (quoted per scene below). Original compositions — battle art is
// reference only; no battle frame is traced, enlarged, or reused
// (Director ruling 4). Same code -> byte-identical .pix. Run:
//   node w10b-rig/gen-panels.mjs [panel-id ...]
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
  console.log(`gen-panels: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// 1. PRIMARCH — ev_sinnoh_arceus @ hall-of-origin (Hall of Dawning)
// design: animal — horse — white horse, flowing mane, golden armillary ring
// say: "a floor of pale light above all the weather there is, and at
//  its centre, the shape every creation story starts with"
// =====================================================================
function scenePrimarch() {
  const g = canvas('B');
  // dawn sky gradient
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    g.set(x, y, y < 16 ? 'A' : y < 34 ? 'B' : y < 50 ? 'C' : 'D');
  }
  // the floor of pale light (below horizon y=52): brighter, streaked
  g.rect(0, 52, W - 1, H - 1, 'E');
  for (let y = 53; y < H; y++) for (let x = 0; x < W; x++) {
    if (hash(x, y) % 7 === 0) g.set(x, y, 'D');
    if (hash(x, y) % 29 === 0) g.set(x, y, 'A');
  }
  // weather far below: soft cloud wisps along the bottom edge
  for (const [cx, cy, rx] of [[16, 76, 18], [52, 78, 22], [90, 77, 20], [118, 78, 14]]) g.ellipse(cx, cy, rx, 3.4, 'N');
  g.speckle({ from: ['N'], to: ['E'] }, [0, 72, 127, 79], 3, 5);
  // light rays fanning from behind the figure
  for (const dx of [-38, -22, -8, 8, 22, 38]) g.line(64, 30, 64 + dx, 4, 'A');
  g.speckle({ from: ['B', 'C'], to: ['A'] }, [10, 2, 118, 30], 9, 3);
  // ---- PRIMARCH (centre 64; body y~34; legs to the light-floor) ----
  // armillary ring BEHIND the body first (drawn round the torso)
  g.ring(64, 36, 23, 23, 'g', 0.10);
  g.ring(64, 36, 23, 23, 'G', 0.055);
  g.ring(64, 36, 21, 8.5, 'g', 0.14, 0.5); // tilted inner band
  g.ring(64, 36, 21, 8.5, 'G', 0.07, 0.5);
  // legs (white, gold-shod)
  for (const lx of [52, 59, 69, 76]) { g.rect(lx, 42, lx + 2, 55, 'W'); g.rect(lx, 42, lx, 55, 'w'); g.rect(lx, 54, lx + 2, 55, 'G'); }
  // body
  g.ellipse(64, 36, 17, 8, 'W');
  g.ellipse(66, 39, 15, 6, 'w'); // shade low-right
  g.ellipse(63, 34, 15, 6.6, 'W'); // restore lit back
  // neck + head (up-right, regardful)
  g.ellipse(79, 27, 7.5, 5, 'W', 0.7);
  g.ellipse(86, 21, 6.4, 3.6, 'W', 0.45);
  g.ellipse(87, 22.6, 5.4, 2.8, 'w', 0.45);
  g.ellipse(85.4, 20.6, 5.6, 3, 'W', 0.45);
  g.tri(82, 16, 85, 10, 87, 17, 'W'); // ear
  g.set(89, 20, 'O'); // eye
  // flowing mane (pale gold, streaming left off the neck)
  g.ellipse(74, 20, 8, 3.4, 'C', -0.5); g.ellipse(68, 17, 7, 2.8, 'B', -0.4);
  g.ellipse(72, 24, 7, 2.6, 'C', -0.7); g.ellipse(64, 15, 5, 2, 'B', -0.3);
  g.speckle({ from: ['C'], to: ['B', 'A'] }, [54, 10, 84, 28], 4, 9);
  // tail, flowing the same way
  g.ellipse(46, 33, 7, 3, 'C', 0.5); g.ellipse(41, 36, 5, 2.2, 'B', 0.6);
  // the ring's front arc crosses the torso (armillary band in front)
  g.ring(64, 36, 23, 23, 'G', 0.05);
  for (let a = 0; a < 6; a++) { // ring studs
    const t = a * Math.PI / 3 + 0.4, x = Math.round(64 + 23 * Math.cos(t)), y = Math.round(36 + 23 * Math.sin(t));
    g.set(x, y, 'Y'); g.set(x, y, 'Y');
  }
  // glow motes
  for (let i = 0; i < 26; i++) {
    const x = 14 + hash(i, 3) % 100, y = 6 + hash(i, 11) % 44;
    if (['A', 'B', 'C'].includes(g.get(x, y))) g.set(x, y, 'Y');
  }
  g.frame('O');
  return emit('panel-hall-primarch', 'PRIMARCH at the Hall of Dawning (ev_sinnoh_arceus)', [
    'panel-hall-primarch 128x80. W10-B T1 cutscene panel: PRIMARCH at the',
    'Hall of Dawning (ev_sinnoh_arceus). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels.mjs. Brief = the species',
    'design record (white horse, flowing mane, golden armillary ring) +',
    'the event say text ("a floor of pale light above all the weather',
    'there is... the shape every creation story starts with").',
  ], [
    ['O', '#2a2418', 'frame outline'], ['A', '#f6ecd2', 'dawn white'], ['B', '#efe0b8', 'pale gold sky'],
    ['C', '#e3cd96', 'light gold'], ['D', '#d9bd7f', 'floor light mid'], ['E', '#c8a75e', 'floor light deep'],
    ['N', '#b9c4c9', 'far weather'], ['W', '#fbf7ec', 'primarch white'], ['w', '#ddd3ba', 'primarch shade'],
    ['G', '#d9a92c', 'armillary gold'], ['g', '#a87c14', 'gold shade'], ['Y', '#fdf3c0', 'glow mote'],
  ], g.grid);
}

// =====================================================================
// 2. CHRONARCH — ev_sinnoh_dialga @ spear-pillar (Zenith Spire)
// design: construct — clockwork dragon — gear dial halo, glowing diamond core
// say: "the broken pillars, the whole sky... Blue steel. A crest like
//  a sundial made of decisions."
// =====================================================================
function sceneChronarch() {
  const g = canvas('n');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 20 ? 'N' : y < 44 ? 'n' : 'L');
  g.speckle({ from: ['N', 'n'], to: ['L'] }, [0, 0, 127, 40], 61, 2); // high cloud flecks
  // broken pillars (left + right, jagged tops) on a stone platform
  const pillar = (x0, top) => {
    g.rect(x0, top, x0 + 9, 68, 'S'); g.rect(x0 + 7, top, x0 + 9, 68, 's');
    g.rect(x0 - 1, top + 6, x0 + 10, top + 8, 'S'); g.rect(x0 - 1, top + 8, x0 + 10, top + 8, 's');
    for (let i = 0; i < 5; i++) if (hash(x0, i) % 2) g.set(x0 + 1 + hash(i, x0) % 7, top - 1 - (hash(i, 7) % 3), 'S');
    g.speckle({ from: ['S'], to: ['s'] }, [x0, top, x0 + 9, 68], 6, x0);
  };
  pillar(6, 34); pillar(112, 40);
  g.rect(0, 68, W - 1, H - 1, 's'); g.rect(0, 68, W - 1, 69, 'S');
  g.speckle({ from: ['s'], to: ['S'] }, [0, 70, 127, 79], 5, 4);
  g.line(20, 68, 44, 62, 's'); g.line(108, 68, 86, 63, 's'); // rubble slopes
  // ---- CHRONARCH (centre; dial halo behind the head) ----
  // tail + hindquarters low right, body mass centre
  g.ellipse(88, 56, 13, 7, 'b'); g.ellipse(88, 54, 12, 6, 'B');
  g.ellipse(66, 52, 17, 9, 'b'); g.ellipse(65, 50, 16, 8, 'B');
  // legs
  for (const lx of [54, 62, 74, 82]) { g.rect(lx, 56, lx + 3, 67, 'b'); g.rect(lx, 56, lx + 3, 58, 'B'); }
  // neck rising to the head at (46,26)
  g.ellipse(50, 40, 8, 12, 'B', 0.5); g.ellipse(52, 40, 6.4, 11, 'b', 0.5); g.ellipse(49, 39, 6, 10, 'B', 0.5);
  // the dial halo: gear ring behind the head
  g.ring(44, 24, 15, 15, 'g', 0.13); g.ring(44, 24, 15, 15, 'G', 0.07);
  for (let a = 0; a < 12; a++) { // gear teeth / sundial decisions
    const t = a * Math.PI / 6, x = Math.round(44 + 16.6 * Math.cos(t)), y = Math.round(24 + 16.6 * Math.sin(t));
    g.set(x, y, 'G'); g.set(x + (Math.cos(t) > 0 ? 1 : -1), y, 'g');
  }
  g.ring(44, 24, 10.5, 10.5, 'G', 0.05);
  // head: steel wedge + crest fan
  g.ellipse(44, 24, 7, 4.6, 'B', 0.15); g.ellipse(45, 25.6, 6, 3.6, 'b', 0.15); g.ellipse(43.4, 23.2, 6, 3.8, 'B', 0.15);
  g.tri(38, 20, 30, 24, 39, 26, 'B'); // snout
  for (let i = 0; i < 4; i++) g.line(48 + i * 2, 18, 52 + i * 3, 10 + i, 'G'); // crest blades
  g.set(40, 23, 'Y'); // eye glint
  // the diamond core, glowing at the chest
  g.tri(64, 44, 70, 51, 64, 58, 'D'); g.tri(64, 44, 58, 51, 64, 58, 'D');
  g.tri(64, 47, 67, 51, 64, 55, 'Y'); g.tri(64, 47, 61, 51, 64, 55, 'Y');
  g.ring(64, 51, 10, 10, 'D', 0.05);
  // steel seams
  g.line(58, 46, 74, 46, 'b'); g.line(56, 52, 76, 54, 'b');
  g.frame('O');
  return emit('panel-spire-chronarch', 'CHRONARCH at Zenith Spire (ev_sinnoh_dialga)', [
    'panel-spire-chronarch 128x80. W10-B T1 cutscene panel: CHRONARCH at',
    'Zenith Spire / Spear Pillar (ev_sinnoh_dialga). Original in-house',
    'art, generated deterministically by w10b-rig/gen-panels.mjs. Brief',
    '= the species design record (clockwork dragon, gear dial halo,',
    'glowing diamond core) + the event say text ("the broken pillars,',
    'the whole sky... Blue steel. A crest like a sundial").',
  ], [
    ['O', '#14161c', 'frame outline'], ['N', '#2c3e5e', 'dusk blue'], ['n', '#47638c', 'sky mid'],
    ['L', '#8fb0d8', 'pale sky'], ['S', '#9aa189', 'stone light'], ['s', '#5f6355', 'stone shade'],
    ['B', '#7fa8c9', 'blue steel'], ['b', '#4a6f96', 'steel shade'], ['D', '#cfe4f7', 'diamond glow'],
    ['Y', '#f8eec2', 'core glow'], ['G', '#c9a227', 'dial gold'], ['g', '#8a6d14', 'gold shade'],
  ], g.grid);
}

// =====================================================================
// 3. COSMARCH — ev_sinnoh_palkia @ spear-pillar (Zenith Spire)
// design: cosmic — dragon — pearl dragon, fin wings, twin water orbs
// say: "the second appointment makes the sky feel... roomy. Space
//  takes a breath and steps aside... pearl-bright, patient, enormous"
// =====================================================================
function sceneCosmarch() {
  const g = canvas('V');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 26 ? 'V' : y < 52 ? 'v' : 'P');
  // stars
  for (let i = 0; i < 40; i++) {
    const x = hash(i, 21) % 128, y = hash(i, 33) % 46;
    if (['V', 'v'].includes(g.get(x, y))) g.set(x, y, hash(i, 5) % 3 ? 'P' : 'Y');
  }
  // space bending aside: faint concentric arcs around the centre
  for (const r of [30, 38, 46]) g.ring(64, 40, r, r * 0.62, 'v', 0.03);
  g.speckle({ from: ['v'], to: ['V'] }, [0, 0, 127, 79], 2, 6); // soften arcs
  // broken pillar silhouettes (the same spire, night register)
  g.rect(4, 46, 13, 70, 's'); g.rect(4, 46, 13, 48, 'S'); g.rect(114, 50, 123, 70, 's'); g.rect(114, 50, 123, 52, 'S');
  g.rect(0, 70, W - 1, H - 1, 's'); g.rect(0, 70, W - 1, 71, 'S');
  // ---- COSMARCH (centre; serpentine, fin-winged) ----
  // coiled lower body
  g.ellipse(64, 58, 19, 8, 'w'); g.ellipse(64, 56, 18, 7, 'W');
  g.ellipse(80, 62, 12, 5, 'w'); g.ellipse(80, 61, 11, 4, 'W');
  // rising torso + neck
  g.ellipse(58, 42, 9, 13, 'W', -0.25); g.ellipse(60, 42, 7, 12, 'w', -0.25); g.ellipse(57, 41, 7, 12, 'W', -0.25);
  // fin wings at the shoulders (translucent pearl blades)
  g.tri(52, 34, 30, 18, 44, 44, 'P'); g.tri(64, 32, 88, 16, 72, 42, 'P');
  g.tri(52, 34, 36, 24, 45, 40, 'w'); g.tri(64, 32, 82, 22, 71, 38, 'w');
  // head (high, patient)
  g.ellipse(54, 22, 7.4, 4.8, 'W', -0.2); g.ellipse(55, 23.6, 6.2, 3.8, 'w', -0.2); g.ellipse(53.2, 21, 6.4, 3.8, 'W', -0.2);
  g.tri(48, 19, 40, 22, 49, 26, 'W'); // snout
  g.line(57, 17, 59, 12, 'P'); g.line(60, 17, 63, 12, 'P'); // crest fins
  g.set(50, 21, 'O'); // eye
  // twin water orbs at the shoulders
  for (const [ox, oy] of [[38, 40], [76, 38]]) {
    g.ellipse(ox, oy, 5.4, 5.4, 'b'); g.ellipse(ox, oy, 4.6, 4.6, 'B');
    g.ellipse(ox - 1.4, oy - 1.6, 1.8, 1.4, 'W');
    g.ring(ox, oy, 7.6, 7.6, 'P', 0.05); // held-space halo
  }
  // pearl sheen flecks on the body (sparse — a sheen, not a texture)
  g.speckle({ from: ['W'], to: ['P'] }, [38, 14, 92, 66], 19, 12);
  g.frame('O');
  return emit('panel-spire-cosmarch', 'COSMARCH at Zenith Spire (ev_sinnoh_palkia)', [
    'panel-spire-cosmarch 128x80. W10-B T1 cutscene panel: COSMARCH at',
    'Zenith Spire / Spear Pillar (ev_sinnoh_palkia). Original in-house',
    'art, generated deterministically by w10b-rig/gen-panels.mjs. Brief',
    '= the species design record (pearl dragon, fin wings, twin water',
    'orbs at shoulders) + the event say text ("the sky feel... roomy...',
    'pearl-bright, patient, enormous").',
  ], [
    ['O', '#191423', 'frame outline'], ['V', '#3a2c55', 'deep space violet'], ['v', '#5d4a86', 'space violet'],
    ['P', '#cbb8e8', 'pearl lavender'], ['W', '#f7f2fa', 'pearl white'], ['w', '#c9b8dd', 'pearl shade'],
    ['B', '#6fc3e8', 'orb water'], ['b', '#3a7ca8', 'orb shade'], ['S', '#8d84a0', 'stone light'],
    ['s', '#5b5470', 'stone shade'], ['Y', '#fdf6d8', 'star glow'],
  ], g.grid);
}

// =====================================================================
// 4. VOIDARCH — ev_sinnoh_giratina @ turnback-cave (Reversal Cave)
// design: cosmic — dragon — shadow dragon, gold crown helm, wings of
//  black smoke
// say: "where the floor is not entirely floor, the dark stands up in
//  gold and smoke and six-legged patience"
// =====================================================================
function sceneVoidarch() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 54 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 54], 17, 1); // cave grain
  // cave mouths / rock masses at the edges
  g.ellipse(6, 12, 14, 16, 'K'); g.ellipse(122, 10, 14, 15, 'K'); g.ellipse(10, 66, 16, 12, 'K'); g.ellipse(120, 68, 15, 12, 'K');
  // the floor that is not entirely floor: a mirror-dark sheet
  g.rect(0, 58, W - 1, H - 1, 'M');
  g.line(18, 66, 52, 66, 'm'); g.line(72, 70, 108, 70, 'm'); g.line(40, 74, 84, 74, 'm');
  g.speckle({ from: ['M'], to: ['d'] }, [0, 58, 127, 79], 23, 8);
  // ---- VOIDARCH (centre; smoke first, then the shape in it) ----
  // wings of black smoke (large soft masses, rims dissolved)
  g.ellipse(34, 26, 17, 10, 'S', -0.4); g.ellipse(94, 26, 17, 10, 'S', 0.4);
  g.ellipse(28, 36, 12, 8, 'S', -0.3); g.ellipse(100, 36, 12, 8, 'S', 0.3);
  g.dissolve('S', ['S', 's'], 3, 4);
  for (const [wx, wy] of [[22, 20], [106, 20], [18, 32], [110, 32]]) g.ellipse(wx, wy, 2, 1.4, 's'); // smoke edge wisps
  // six legs (three pairs; the far pair dimmer)
  for (const [lx, c] of [[46, 's'], [58, 'S'], [70, 'S'], [80, 's']]) { g.rect(lx, 48, lx + 3, 60, c); }
  g.rect(52, 50, 55, 60, 'S'); g.rect(74, 50, 77, 60, 'S');
  // body: a standing dark, gold-banded
  g.ellipse(64, 40, 15, 12, 'S');
  g.ellipse(64, 38, 13, 10, 'S');
  for (const yy of [34, 40, 46]) g.line(52, yy, 76, yy + 1, 'g'); // gold bands in the dark
  g.line(52, 34, 76, 35, 'G');
  // neck + crowned head
  g.ellipse(64, 24, 7, 9, 'S');
  g.ellipse(64, 17, 6.4, 5, 'S');
  // the gold crown helm: band + spikes
  g.rect(58, 13, 70, 15, 'G'); g.rect(58, 15, 70, 15, 'g');
  for (const sx of [58, 61, 64, 67, 70]) g.tri(sx - 1, 13, sx + 1, 13, sx, 7 - (sx === 64 ? 2 : 0), 'G');
  g.set(61, 18, 'W'); g.set(67, 18, 'W'); // pale eye glints in the dark
  // reflection hint in the not-floor (smoke smudge + crown glint)
  g.ellipse(64, 68, 12, 3.4, 's'); g.set(64, 65, 'g'); g.set(60, 67, 'g'); g.set(68, 67, 'g');
  // drifting smoke motes
  for (let i = 0; i < 20; i++) {
    const x = 8 + hash(i, 17) % 112, y = 6 + hash(i, 23) % 46;
    if (['K', 'D', 'd'].includes(g.get(x, y))) g.set(x, y, 's');
  }
  g.frame('O');
  return emit('panel-reversal-voidarch', 'VOIDARCH in Reversal Cave (ev_sinnoh_giratina)', [
    'panel-reversal-voidarch 128x80. W10-B T1 cutscene panel: VOIDARCH',
    'in Reversal Cave / Turnback Cave (ev_sinnoh_giratina). Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels.mjs. Brief = the species design record (shadow dragon,',
    'gold crown helm, wings of black smoke) + the event say text',
    '("where the floor is not entirely floor, the dark stands up in',
    'gold and smoke and six-legged patience").',
  ], [
    ['O', '#0c0a10', 'frame outline'], ['K', '#17131f', 'cave deepest'], ['D', '#241c30', 'cave dark'],
    ['d', '#37294a', 'cave mid'], ['M', '#4a3560', 'mirror floor'], ['m', '#6a4d8a', 'mirror sheen'],
    ['S', '#0a0810', 'smoke black'], ['s', '#2e2440', 'smoke edge'], ['G', '#d9a92c', 'crown gold'],
    ['g', '#8a6d14', 'gold shade'], ['W', '#e8e4da', 'eye glint'],
  ], g.grid);
}

// =====================================================================
// 5. STRATOWYRM — ev_hoenn_rayquaza_face @ sky-pillar
// design: class — wyrm — green sky wyrm, gold mane, long coiling
//  serpent body
// say: "At the summit the ring of old stone is empty for exactly one
//  heartbeat. Then the sky folds, green as deep water seen from
//  above, and STRATOWYRM is coiled in its ring again"
// =====================================================================
function sceneStratowyrm() {
  const g = canvas('A');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 24 ? 'A' : y < 48 ? 'a' : 'A');
  // wind streaks (long, calm, horizontal)
  for (let i = 0; i < 22; i++) {
    const y = 4 + hash(i, 31) % 40, x = hash(i, 37) % 110, len = 6 + hash(i, 41) % 14;
    g.line(x, y, x + len, y, hash(i, 43) % 2 ? 'W' : 'a');
  }
  // cloud floor far below
  for (const [cx, cy, rx] of [[14, 78, 20], [50, 80, 26], [92, 79, 24], [120, 80, 14]]) g.ellipse(cx, cy, rx, 4, 'W');
  // the summit ring of old stone (perspective ellipse, broken blocks)
  g.ring(64, 62, 34, 10, 's', 0.30);
  g.ring(64, 62, 34, 10, 'S', 0.16);
  for (let i = 0; i < 9; i++) { // block joints
    const t = i * Math.PI * 2 / 9 + 0.2, x = Math.round(64 + 34 * Math.cos(t)), y = Math.round(62 + 10 * Math.sin(t));
    g.set(x, y, 's'); g.set(x, y + 1, 's');
  }
  g.ellipse(64, 63, 30, 7, 's'); g.ellipse(64, 62, 29, 6.4, 'S'); // ring inner floor shade
  // ---- STRATOWYRM, coiled in its ring ----
  // outer coil (low, wide) then a rising inner coil
  g.ellipse(64, 58, 24, 7.4, 'g'); g.ellipse(64, 56.4, 23, 6.6, 'G');
  g.ellipse(64, 52, 17, 6, 'g'); g.ellipse(64, 50.6, 16, 5.4, 'G');
  // belly light bands on the coils
  g.ring(64, 57, 22, 6.4, 'L', 0.10); g.ring(64, 51, 15, 5, 'L', 0.10);
  // gold segment marks along the coils
  for (let i = 0; i < 7; i++) { const x = 44 + i * 6.4; g.set(Math.round(x), 53, 'Y'); g.set(Math.round(x) + 1, 54, 'Y'); }
  // neck rising from the coil's right, head high
  g.ellipse(80, 42, 6.4, 10, 'G', -0.35); g.ellipse(82, 42, 5, 9.4, 'g', -0.35); g.ellipse(79, 41, 5, 9.4, 'G', -0.35);
  g.ellipse(84, 30, 7.4, 4.4, 'G', -0.3); g.ellipse(85, 31.4, 6.4, 3.6, 'g', -0.3); g.ellipse(83.4, 29.2, 6.4, 3.6, 'G', -0.3);
  g.tri(90, 27, 98, 30, 90, 33, 'G'); // snout
  // gold mane: a crest of blades down the neck + head fins
  for (let i = 0; i < 5; i++) g.line(76 - i, 34 + i * 3.4, 68 - i, 30 + i * 3.4, 'Y', 1);
  g.tri(80, 25, 74, 18, 84, 22, 'Y'); g.tri(88, 25, 90, 17, 93, 24, 'Y');
  g.set(88, 29, 'O'); // eye
  g.line(92, 32, 97, 33, 'O'); // jaw line
  // tail tip rising at the left, tipped gold
  g.ellipse(38, 50, 4.6, 8, 'G', 0.4); g.ellipse(36, 43, 3.4, 5, 'G', 0.4);
  g.tri(33, 39, 39, 39, 36, 33, 'Y');
  // small arms tucked at the neck base (the record: a wyrm, kept spare)
  g.line(76, 48, 70, 52, 'g'); g.line(86, 47, 91, 51, 'g');
  g.frame('O');
  return emit('panel-pillar-stratowyrm', 'STRATOWYRM at Sky Pillar (ev_hoenn_rayquaza_face)', [
    'panel-pillar-stratowyrm 128x80. W10-B T1 cutscene panel:',
    'STRATOWYRM coiled in the summit ring at Sky Pillar',
    '(ev_hoenn_rayquaza_face). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels.mjs. Brief = the species',
    'design record (green sky wyrm, gold mane, long coiling serpent',
    'body) + the event say text ("the ring of old stone... Then the',
    'sky folds, green as deep water seen from above").',
  ], [
    ['O', '#12201a', 'frame outline'], ['A', '#bfe0d8', 'sky deep-water pale'], ['a', '#7fb8a4', 'sky green mid'],
    ['W', '#eefaf0', 'cloud white'], ['S', '#9aa189', 'stone light'], ['s', '#5f6355', 'stone shade'],
    ['G', '#2f9e46', 'wyrm green'], ['g', '#1d6e30', 'wyrm shade'], ['L', '#8ecf78', 'belly light'],
    ['Y', '#f2c230', 'mane gold'],
  ], g.grid);
}

// =====================================================================
// 6. TERRATITAN — ev_hoenn_groudon @ magma-hideout
// design: construct — rock titan — crimson rock titan, jagged shard
//  armour, ember eyes
// say: "The pool stands up in red-black armour, and the whole
//  mountain remembers whose house this actually is."
// =====================================================================
function sceneTerratitan() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 56 ? 'D' : 'd');
  // foundry chamber: jagged rock walls closing at the sides
  for (let x = 0; x < 22; x++) for (let y = 0; y < 62; y++) if (x < 20 - Math.abs(y - 30) * 0.22 + (hash(x, y) % 3)) g.set(x, y, 'K');
  for (let x = 106; x < W; x++) for (let y = 0; y < 62; y++) if (x > 108 + Math.abs(y - 30) * 0.22 - (hash(x, y) % 3)) g.set(x, y, 'K');
  g.speckle({ from: ['D', 'd'], to: ['K'] }, [0, 0, 127, 60], 13, 7);
  // heat shimmer flecks rising
  for (let i = 0; i < 18; i++) {
    const x = 24 + hash(i, 47) % 80, y = 20 + hash(i, 53) % 34;
    if (['D', 'd'].includes(g.get(x, y))) g.set(x, y, 'm');
  }
  // the magma pool (bottom band, bright heart, dark crust rafts)
  g.rect(0, 62, W - 1, H - 1, 'M');
  g.ellipse(64, 72, 40, 7, 'm'); g.ellipse(64, 73, 26, 5, 'Y');
  for (const [cx, cy, rx] of [[16, 66, 9], [38, 70, 7], [96, 67, 10], [114, 71, 7], [70, 66, 6]]) g.ellipse(cx, cy, rx, 2.2, 'd');
  g.speckle({ from: ['M'], to: ['Y', 'm'] }, [0, 62, 127, 79], 9, 11);
  // ---- TERRATITAN rising from the pool (centre) ----
  // slab arms going down into the magma
  g.rect(34, 38, 42, 66, 'B'); g.rect(34, 38, 42, 66, 'B'); g.rect(35, 38, 35, 66, 'b'); g.rect(40, 44, 42, 66, 'r');
  g.rect(86, 38, 94, 66, 'B'); g.rect(92, 38, 92, 66, 'b'); g.rect(86, 44, 88, 66, 'r');
  for (const [sx, sy] of [[33, 36], [43, 34], [85, 34], [95, 36]]) g.tri(sx - 3, sy + 8, sx + 4, sy + 8, sx, sy - 4, 'B'); // shoulder shards
  // torso: red-black armour, jagged shard plates
  g.ellipse(64, 44, 21, 15, 'r'); g.ellipse(64, 42, 20, 14, 'R');
  g.tri(48, 34, 56, 34, 50, 24, 'R'); g.tri(58, 32, 66, 32, 60, 20, 'B'); g.tri(68, 32, 78, 34, 74, 23, 'R'); // back shards
  g.tri(52, 48, 60, 48, 55, 58, 'B'); g.tri(66, 48, 76, 48, 71, 59, 'r'); // waist plates
  g.line(46, 42, 82, 42, 'B'); g.line(48, 50, 80, 50, 'B'); // plate seams
  g.speckle({ from: ['R'], to: ['B', 'r'] }, [44, 28, 84, 56], 7, 13);
  // head: heavy brow, ember eyes
  g.ellipse(64, 26, 9.4, 6.4, 'R'); g.ellipse(64, 28, 8.6, 5.4, 'r'); g.ellipse(63.4, 24.6, 8.4, 5.2, 'R');
  g.rect(56, 22, 72, 24, 'B'); // brow slab
  g.tri(58, 20, 62, 20, 60, 14, 'B'); g.tri(66, 20, 70, 20, 68, 13, 'R'); // crown shards
  g.set(60, 26, 'Y'); g.set(61, 26, 'Y'); g.set(67, 26, 'Y'); g.set(68, 26, 'Y'); // ember eyes
  // magma drips + splash where the arms meet the pool
  for (const dx of [-24, -14, 16, 26]) { g.line(64 + dx, 60, 64 + dx, 64, 'M'); g.set(64 + dx, 65, 'm'); }
  g.ellipse(38, 63, 8, 2, 'Y'); g.ellipse(90, 63, 8, 2, 'Y');
  g.frame('O');
  return emit('panel-magma-terratitan', 'TERRATITAN rising in Magma Hideout (ev_hoenn_groudon)', [
    'panel-magma-terratitan 128x80. W10-B T1 cutscene panel: TERRATITAN',
    'rising from the magma pool in the deep chamber of Magma Hideout',
    '(ev_hoenn_groudon). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels.mjs. Brief = the species',
    'design record (crimson rock titan, jagged shard armour, ember',
    'eyes) + the event say text ("The pool stands up in red-black',
    'armour, and the whole mountain remembers whose house this is").',
  ], [
    ['O', '#160b06', 'frame outline'], ['K', '#241209', 'chamber deepest'], ['D', '#3a1c0d', 'chamber rock'],
    ['d', '#59301a', 'rock mid'], ['M', '#e8641e', 'magma'], ['m', '#f2a03c', 'magma bright'],
    ['Y', '#f8e58a', 'magma core / ember'], ['R', '#a8232a', 'titan crimson'], ['r', '#6e1420', 'titan shade'],
    ['B', '#2b2320', 'black armour'], ['b', '#4a3a30', 'armour edge'],
  ], g.grid);
}

// =====================================================================
// 7. ABYSSORCA — ev_hoenn_kyogre @ r127-underwater (the trench)
// design: animal — orca — black orca, red circuit markings, white
//  underside
// say: "it is holding a shape. A vast shape. The shape opens one eye
//  the size of a porthole in the blue dark"
// =====================================================================
function sceneAbyssorca() {
  const g = canvas('D');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 22 ? 'd' : y < 48 ? 'D' : 'O');
  // the dive light: a pale cone from the surface, centre-top; its rim
  // dissolves in a structured checker dither (never a random mesh)
  for (let y = 0; y < 58; y++) for (let x = 0; x < W; x++) {
    const half = 4 + y * 0.42, adx = Math.abs(x - 64);
    if (adx < half && g.get(x, y) !== 'O') {
      if (adx > half - 3 && (x + y) % 2 === 0) continue; // dithered rim
      g.set(x, y, adx < half * 0.45 ? 'l' : 'L');
    }
  }
  // a faint backlight bloom behind the shape, so the black reads
  g.ellipse(58, 46, 40, 15, 'd'); g.ellipse(58, 46, 36, 13, 'D');
  // trench walls: dark rock teeth at the bottom corners
  for (let x = 0; x < 30; x++) for (let y = 56; y < H; y++) if (y > 74 - x * 0.6 + (hash(x, y) % 3)) g.set(x, y, 'O');
  for (let x = 98; x < W; x++) for (let y = 56; y < H; y++) if (y > 56 + (x - 98) * 0.6 + (hash(x, y) % 3)) g.set(x, y, 'O');
  // marine snow
  for (let i = 0; i < 34; i++) {
    const x = hash(i, 59) % 128, y = hash(i, 61) % 74;
    if (['D', 'd', 'L'].includes(g.get(x, y))) g.set(x, y, 'l');
  }
  // ---- ABYSSORCA (vast, horizontal, head right) ----
  // tail fluke (left)
  g.tri(14, 44, 26, 38, 27, 46, 'B'); g.tri(14, 52, 27, 48, 26, 56, 'B');
  g.ellipse(24, 47, 6, 4.4, 'B');
  // body
  g.ellipse(58, 46, 34, 11, 'B');
  g.ellipse(58, 49.4, 32, 8.6, 'B');
  // white underside band
  g.ellipse(60, 52, 29, 5.4, 'W'); g.ellipse(60, 50.4, 29, 4.6, 'W');
  g.ellipse(59, 47, 31, 8.4, 'B'); // restore the black back over the band
  // dorsal fin + pectoral fin
  g.tri(52, 37, 62, 36, 56, 29, 'B');
  g.tri(72, 54, 82, 53, 78, 61, 'B');
  // head mass (right), blunt
  g.ellipse(88, 46, 11, 9, 'B');
  g.ellipse(90, 50, 9, 6, 'W'); g.ellipse(89, 47.4, 9.6, 7, 'B'); // jaw white, restored top
  // the eye the size of a porthole: white patch + dark pupil + glint
  g.ellipse(90, 43, 3.4, 3, 'W');
  g.ellipse(90.6, 43.4, 1.7, 1.6, 'O'); g.set(90, 42, 'W');
  // red circuit markings along the flank (thin, branching)
  g.line(34, 42, 52, 40, 'R'); g.line(52, 40, 66, 41, 'R'); g.line(66, 41, 80, 40, 'R');
  g.line(40, 45, 54, 44, 'R'); g.line(54, 44, 70, 45, 'R');
  g.line(46, 40, 44, 36, 'R'); g.line(62, 41, 62, 37, 'R'); g.line(74, 40, 76, 36, 'R'); // circuit branches up
  g.set(30, 43, 'R'); g.set(84, 42, 'R');
  // a few bubbles rising past the light
  for (const [bx, by] of [[102, 30], [106, 22], [100, 14], [24, 20], [20, 12]]) { g.ring(bx, by, 1.6, 1.6, 'l', 0.4); }
  g.frame('O');
  return emit('panel-trench-abyssorca', 'ABYSSORCA in the trench (ev_hoenn_kyogre)', [
    'panel-trench-abyssorca 128x80. W10-B T1 cutscene panel: ABYSSORCA',
    'holding its shape in the trench below the dive light',
    '(ev_hoenn_kyogre, r127-underwater). Original in-house art,',
    'generated deterministically by w10b-rig/gen-panels.mjs. Brief =',
    'the species design record (black orca, red circuit markings,',
    'white underside) + the event say text ("it is holding a shape.',
    'A vast shape... one eye the size of a porthole in the blue dark").',
  ], [
    ['O', '#06121e', 'frame outline / trench deep'], ['D', '#0a2a44', 'water deep'], ['d', '#11456e', 'water mid'],
    ['L', '#2a6ea8', 'water light'], ['l', '#7fb8d8', 'dive light pale'], ['B', '#0c1420', 'orca black'],
    ['W', '#eef4f8', 'orca white'], ['R', '#d8402e', 'circuit red'],
  ], g.grid);
}

// =====================================================================
// 8. NOCTARCH — ev_sinnoh_darkrai @ newmoon-island (Darkmoon Island)
// design: cosmic — shade — black smoke shade, one blue eye, red
//  crystal collar
// say: "The pond that reflects nothing has company... NOCTARCH
//  unfolds out of the island's own dark"
// venue: the dream shoreline — black water, trees that grow toward
//  the water as if listening
// =====================================================================
function sceneNoctarch() {
  const g = canvas('N');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'N' : y < 52 ? 'n' : 'N');
  // stars + a thin crescent moon (top right)
  for (let i = 0; i < 30; i++) {
    const x = hash(i, 67) % 128, y = hash(i, 71) % 30;
    if (g.get(x, y) === 'N') g.set(x, y, 'n');
  }
  g.ring(108, 10, 5, 5, 'W', 0.3); g.ellipse(110, 9, 4.4, 4.4, 'N'); // crescent bite
  // trees leaning toward the water (both sides)
  const tree = (bx, lean, sgn) => {
    for (let y = 30; y < 58; y++) g.rect(bx + Math.round((58 - y) * lean * sgn), y, bx + Math.round((58 - y) * lean * sgn) + 3, y, 'T');
    const tx = bx + Math.round(28 * lean * sgn);
    g.ellipse(tx + 2, 26, 11, 9, 't'); g.ellipse(tx + 2, 21, 8, 6, 'T');
    g.speckle({ from: ['t'], to: ['N'] }, [tx - 9, 14, tx + 13, 34], 5, bx);
  };
  tree(10, 0.32, 1); tree(30, 0.2, 1); tree(112, 0.32, -1); tree(94, 0.18, -1);
  // shoreline + the pond that reflects nothing (bottom)
  g.rect(0, 56, W - 1, 58, 'T');
  g.rect(0, 59, W - 1, H - 1, 'P');
  g.line(8, 62, 40, 62, 'p'); g.line(84, 66, 118, 66, 'p'); g.line(30, 72, 62, 72, 'p'); // faint sheen edges only
  g.speckle({ from: ['P'], to: ['p'] }, [0, 59, 127, 79], 41, 19);
  // ---- NOCTARCH unfolding out of the island's dark (centre) ----
  // smoke base pooling on the pond
  g.ellipse(64, 58, 17, 5, 'S'); g.ellipse(64, 57, 15, 4.4, 'S');
  g.dissolve('S', ['S', 's'], 3, 21);
  // trailing smoke arms
  g.ellipse(42, 44, 10, 4.4, 'S', 0.5); g.ellipse(86, 44, 10, 4.4, 'S', -0.5);
  g.dissolve('S', ['S', 's'], 3, 27);
  // the shade's column + shoulders
  g.ellipse(64, 44, 10, 13, 'S');
  g.ellipse(64, 34, 12, 7, 'S');
  g.ellipse(64, 42, 8.6, 12, 'S');
  // head: a pale-less dark with ONE blue eye
  g.ellipse(64, 24, 6.8, 6, 'S');
  g.ellipse(62, 20, 4, 2.6, 's'); // smoke crown wisp
  g.tri(58, 20, 61, 20, 59, 14, 's'); g.tri(66, 19, 69, 19, 68, 13, 's'); // wisp horns
  g.ellipse(64, 24, 2.2, 1.9, 'B'); g.set(63, 23, 'W'); // the one eye + glint
  // the red crystal collar (a jagged ring at the neck)
  for (let i = 0; i < 7; i++) {
    const x = 57 + i * 2.3, y = 30 + Math.round(Math.sin(i * 1.1) * 1.2);
    g.tri(Math.round(x) - 1, y, Math.round(x) + 1, y, Math.round(x), y + 3, i % 2 ? 'r' : 'R');
  }
  g.line(57, 30, 71, 30, 'r');
  // smoke motes drifting off the figure
  for (let i = 0; i < 16; i++) {
    const x = 34 + hash(i, 73) % 60, y = 12 + hash(i, 79) % 40;
    if (['N', 'n'].includes(g.get(x, y))) g.set(x, y, 's');
  }
  g.frame('O');
  return emit('panel-darkmoon-noctarch', 'NOCTARCH at Darkmoon Island (ev_sinnoh_darkrai)', [
    'panel-darkmoon-noctarch 128x80. W10-B T1 cutscene panel: NOCTARCH',
    'unfolding out of the dark at Darkmoon Island / Newmoon Island',
    '(ev_sinnoh_darkrai). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels.mjs. Brief = the species',
    'design record (black smoke shade, one blue eye, red crystal',
    'collar) + the event say text ("The pond that reflects nothing',
    'has company... NOCTARCH unfolds out of the island\'s own dark")',
    '+ the venue record (trees that grow toward the water, listening).',
  ], [
    ['O', '#05060a', 'frame outline'], ['N', '#0d1220', 'night sky'], ['n', '#1a2438', 'night mid'],
    ['T', '#101a14', 'tree trunk'], ['t', '#1e3325', 'tree foliage'], ['P', '#04070c', 'pond black'],
    ['p', '#233246', 'pond sheen'], ['S', '#0a0a12', 'shade body'], ['s', '#2c2c3e', 'smoke edge'],
    ['B', '#5fb8e8', 'the one eye'], ['W', '#eaf6ff', 'moon / glint'], ['R', '#d8402e', 'collar crystal'],
    ['r', '#8a1f16', 'collar shade'],
  ], g.grid);
}

const SCENES = {
  'panel-hall-primarch': scenePrimarch,
  'panel-spire-chronarch': sceneChronarch,
  'panel-spire-cosmarch': sceneCosmarch,
  'panel-reversal-voidarch': sceneVoidarch,
  'panel-pillar-stratowyrm': sceneStratowyrm,
  'panel-magma-terratitan': sceneTerratitan,
  'panel-trench-abyssorca': sceneAbyssorca,
  'panel-darkmoon-noctarch': sceneNoctarch,
};
const want = process.argv.slice(2);
for (const [id, fn] of Object.entries(SCENES)) if (!want.length || want.includes(id)) fn();
