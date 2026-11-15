// gen-panels-t3.mjs — W10-B T3 Borea + rest panel generators
// (deterministic). Authors the 11 T3 panels (128x80, the W10 panel
// canvas standard) as .pix sources under assets/sprites/pix/keyart/.
// Each composition is drawn ONLY from its moment's recorded data: the
// Kin's W13 design field + the event's own build-up say text + the
// venue record (quoted per scene below). Original compositions —
// battle art is reference only; no battle frame is traced, enlarged,
// or reused (Director ruling 4). Same code -> byte-identical .pix.
// Run: node w10b-rig/gen-panels-t3.mjs [panel-id ...]
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
  console.log(`gen-panels-t3: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// 1. LORACLE — ev_sinnoh_uxie @ lake-acuity-cave (Insight Cavern)
// design: cosmic — sprite — grey sprite, gold helmet, red brow gem,
//  closed eyes
// say: "Insight Cavern is colder inside than the lake above it, and
//  quieter than either — a held thought of a room... LORACLE rises
//  out of the stillness with its eyes closed"
// =====================================================================
function sceneLoracle() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 26 ? 'K' : y < 52 ? 'D' : 'd');
  g.speckle({ from: ['K', 'D'], to: ['d'] }, [0, 0, 127, 52], 19, 3); // cavern grain
  // hanging icicles (top, uneven lengths)
  for (const [ix, len] of [[8, 9], [20, 13], [34, 7], [48, 11], [86, 8], [98, 12], [110, 7], [120, 10]]) {
    g.tri(ix - 2, 0, ix + 2, 0, ix, len, 'd'); g.line(ix, 2, ix, len - 2, 'I');
  }
  // rock masses closing the sides
  g.ellipse(4, 40, 12, 22, 'K'); g.ellipse(124, 38, 12, 24, 'K');
  // the ice sheet floor: pale, cracked, holding the room's light
  g.rect(0, 58, W - 1, H - 1, 'I');
  g.rect(0, 58, W - 1, 59, 'i');
  g.line(10, 66, 38, 63, 'd'); g.line(38, 63, 52, 67, 'd'); g.line(84, 65, 108, 62, 'd'); g.line(96, 70, 118, 69, 'd');
  g.speckle({ from: ['I'], to: ['i', 'W'] }, [0, 60, 127, 79], 11, 7);
  // a held stillness: faint glow gathered at the centre of the ice
  g.ellipse(64, 46, 20, 12, 'd'); g.ellipse(64, 46, 15, 9, 'D');
  g.ring(64, 44, 13, 10, 'i', 0.10);
  // ---- LORACLE rising out of the stillness (centre, eyes closed) ----
  // twin ribbon tails drifting down-out from the body
  g.line(58, 48, 46, 60, 's', 1); g.line(70, 48, 82, 60, 's', 1);
  g.line(58, 48, 48, 58, 'S'); g.line(70, 48, 80, 58, 'S');
  g.ellipse(45, 61, 3, 1.8, 'S'); g.ellipse(83, 61, 3, 1.8, 'S'); // tail tips
  // body: small, grey, unhurried
  g.ellipse(64, 42, 8, 9, 'S');
  g.ellipse(66, 44, 6.4, 7.4, 's'); g.ellipse(63, 40, 6.6, 7.6, 'S');
  // arms resting at the sides
  g.ellipse(55, 44, 2.6, 4.4, 'S', 0.4); g.ellipse(73, 44, 2.6, 4.4, 's', -0.4);
  // head + the gold helmet (a smooth cap, banded)
  g.ellipse(64, 30, 7.4, 6.4, 'S');
  g.ellipse(64, 27.4, 7.6, 4.6, 'G'); // helmet dome
  g.rect(57, 29, 71, 30, 'g'); // helmet band
  g.ellipse(64, 25.6, 5.4, 3, 'G'); // dome lit top
  // the red brow gem, centred on the band
  g.ellipse(64, 29.4, 1.9, 1.9, 'R'); g.set(64, 29, 'W');
  // eyes CLOSED: two calm downward ticks (the record's whole point)
  g.line(59, 33, 61, 34, 'K'); g.line(67, 34, 69, 33, 'K');
  // snow motes, very sparse — the room is still, not busy
  for (let i = 0; i < 14; i++) {
    const x = 12 + hash(i, 13) % 104, y = 8 + hash(i, 17) % 44;
    if (['K', 'D', 'd'].includes(g.get(x, y))) g.set(x, y, 'i');
  }
  g.frame('O');
  return emit('panel-insight-loracle', 'LORACLE in Insight Cavern (ev_sinnoh_uxie)', [
    'panel-insight-loracle 128x80. W10-B T3 cutscene panel: LORACLE in',
    'Insight Cavern / Lake Acuity Cave (ev_sinnoh_uxie). Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (grey sprite,',
    'gold helmet, red brow gem, closed eyes) + the event say text',
    '("Insight Cavern is colder inside than the lake above it, and',
    'quieter than either — a held thought of a room... LORACLE rises',
    'out of the stillness with its eyes closed").',
  ], [
    ['O', '#0a1420', 'frame outline'], ['K', '#10222e', 'cavern deepest'], ['D', '#1b3a4a', 'ice dark'],
    ['d', '#2e5a72', 'ice mid'], ['I', '#7fb8cc', 'ice pale'], ['i', '#a8d4e2', 'ice light'],
    ['W', '#eef7fa', 'snow white'], ['S', '#8a97a3', 'sprite grey'], ['s', '#5d6b76', 'sprite shade'],
    ['G', '#d9a92c', 'helmet gold'], ['g', '#8a6d14', 'gold shade'], ['R', '#c22e3a', 'brow gem'],
  ], g.grid);
}

// =====================================================================
// 2. VOLITAR — ev_sinnoh_azelf @ lake-valor-cave (Gallant Cavern)
// design: cosmic — sprite — blue sprite, angular helmet, raised
//  fists, ribbon tails
// say: "Gallant Cavern still smells faintly of hot stone from the
//  day the lake was blown half skyward... VOLITAR... hovering over
//  the scarred water with its chin up"
// venue: Gallant Cavern's kit is warm dressed stone (W17 record)
// =====================================================================
function sceneVolitar() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 54 ? 'D' : 'd');
  g.speckle({ from: ['D', 'd'], to: ['S'] }, [0, 0, 127, 54], 23, 5); // dressed-stone grain
  // blast cracks in the walls, a few still holding the day's heat
  const crack = (pts, glow) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'K');
      if (glow) g.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, 'E');
    }
  };
  crack([[6, 8], [16, 18], [13, 30], [22, 40]], true);
  crack([[118, 6], [108, 16], [114, 28], [104, 38]], false);
  crack([[40, 2], [44, 12], [40, 20]], false);
  crack([[88, 4], [84, 14], [90, 22]], true);
  // rubble at the wall feet
  for (const [cx, cy, rx] of [[14, 56, 12], [112, 57, 13], [34, 58, 8], [94, 58, 8]]) g.ellipse(cx, cy, rx, 3, 'd');
  g.speckle({ from: ['d'], to: ['S', 'K'] }, [0, 52, 127, 60], 6, 9);
  // the scarred water: a decision-coloured pool across the floor
  g.rect(0, 60, W - 1, H - 1, 'T');
  g.line(8, 64, 44, 64, 't'); g.line(70, 67, 112, 67, 't'); g.line(30, 72, 66, 72, 't'); g.line(88, 75, 120, 75, 't');
  g.speckle({ from: ['T'], to: ['t'] }, [0, 60, 127, 79], 29, 11);
  g.ellipse(64, 63, 10, 1.8, 't'); // the hover's ring on the water
  // ---- VOLITAR hovering chin-up over the water (centre) ----
  // ribbon tails trailing behind and down
  g.line(59, 46, 48, 56, 'b', 1); g.line(69, 46, 80, 56, 'b', 1);
  g.line(59, 46, 50, 54, 'B'); g.line(69, 46, 78, 54, 'B');
  g.ellipse(47, 57, 3, 1.8, 'B'); g.ellipse(81, 57, 3, 1.8, 'B');
  // body
  g.ellipse(64, 42, 8, 9, 'B');
  g.ellipse(66, 44, 6.4, 7.4, 'b'); g.ellipse(63, 40, 6.6, 7.6, 'B');
  // RAISED FISTS: both arms up at the shoulders, defiant
  g.line(57, 40, 52, 33, 'B', 1); g.line(71, 40, 76, 33, 'B', 1);
  g.ellipse(51, 31, 3, 3, 'B'); g.ellipse(77, 31, 3, 3, 'B'); // the fists
  g.ellipse(50, 30, 1.6, 1.6, 'W'); g.ellipse(76, 30, 1.6, 1.6, 'W'); // knuckle light
  // head high, chin UP: head set high on the body, jaw wedge under
  g.ellipse(64, 28, 7.2, 6.2, 'B');
  g.tri(60, 32, 68, 32, 64, 36, 'B'); // the raised chin
  // the angular helmet: a faceted crest, two hard points
  g.tri(57, 25, 64, 17, 71, 25, 'b');
  g.tri(58, 25, 64, 19, 70, 25, 'B');
  g.tri(57, 25, 54, 20, 60, 23, 'B'); g.tri(71, 25, 74, 20, 68, 23, 'B'); // side points
  // eyes: open, level, unafraid (contrast with LORACLE's closed)
  g.set(61, 28, 'K'); g.set(62, 28, 'K'); g.set(66, 28, 'K'); g.set(67, 28, 'K');
  g.set(61, 27, 'W'); g.set(66, 27, 'W');
  // a faint warm updraft from the scarred water
  for (let i = 0; i < 10; i++) {
    const x = 30 + hash(i, 23) % 68, y = 48 + hash(i, 29) % 12;
    if (['D', 'd'].includes(g.get(x, y))) g.set(x, y, 'e');
  }
  g.frame('O');
  return emit('panel-gallant-volitar', 'VOLITAR in Gallant Cavern (ev_sinnoh_azelf)', [
    'panel-gallant-volitar 128x80. W10-B T3 cutscene panel: VOLITAR in',
    'Gallant Cavern / Lake Valor Cave (ev_sinnoh_azelf). Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (blue sprite,',
    'angular helmet, raised fists, ribbon tails) + the event say text',
    '("Gallant Cavern still smells faintly of hot stone... VOLITAR,',
    'hovering over the scarred water with its chin up") + the venue',
    'record (Gallant Cavern: warm dressed stone).',
  ], [
    ['O', '#170f08', 'frame outline'], ['K', '#2a1a10', 'cavern deepest'], ['D', '#4a2e1a', 'warm stone'],
    ['d', '#6e4a2c', 'stone mid'], ['S', '#8a6a44', 'stone light'], ['T', '#14424a', 'pool deep'],
    ['t', '#2a7a86', 'pool light'], ['E', '#e8641e', 'scar ember'], ['e', '#f2a03c', 'ember bright'],
    ['B', '#4a86d8', 'sprite blue'], ['b', '#2c5aa0', 'sprite shade'], ['W', '#eef4f8', 'glint'],
  ], g.grid);
}

// =====================================================================
// 3. EMPATHIS — ev_sinnoh_mesprit @ sinnoh-routes (the roamer reveal;
//  Lake Candor's Kin, met on the road)
// design: cosmic — sprite — pink sprite, magenta helmet, red chest
//  gem, ribbon tails
// say: "The light here has a pink edge it did not have a moment
//  ago — and then the air simply admits she is in it: EMPATHIS,
//  hanging a wingspan away, considering you with the unafraid calm"
// =====================================================================
function sceneEmpathis() {
  const g = canvas('A');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'A' : y < 46 ? 'a' : 'G');
  // a distant lake band on the horizon (Candor's water, far off)
  g.rect(0, 42, W - 1, 45, 'L');
  g.line(10, 43, 40, 43, 'W'); g.line(84, 44, 116, 44, 'W');
  // soft clouds
  for (const [cx, cy, rx] of [[22, 12, 13], [58, 8, 10], [102, 14, 14]]) { g.ellipse(cx, cy, rx, 3, 'W'); g.ellipse(cx, cy + 2, rx, 2.6, 'a'); g.ellipse(cx, cy, rx - 2, 2.4, 'W'); }
  // grass: combed calm, path lightening at the centre
  g.speckle({ from: ['G'], to: ['g'] }, [0, 46, 127, 79], 7, 3);
  for (let i = 0; i < 16; i++) { const x = hash(i, 31) % 128, y = 50 + hash(i, 37) % 28; g.set(x, y, 'g'); g.set(x, y - 1, 'G'); }
  g.ellipse(64, 74, 20, 5, 'g'); g.ellipse(64, 74, 17, 4, 'G'); // the waited-in clearing
  // THE PINK EDGE: the light itself blushes at the frame's edges
  for (let y = 2; y < H - 2; y++) for (const x of [2, 3, 4, W - 5, W - 4, W - 3]) {
    const cur = g.get(x, y);
    if (cur === 'A' || cur === 'a') g.set(x, y, 'E');
  }
  for (let x = 2; x < W - 2; x++) for (const y of [2, 3]) if (g.get(x, y) === 'A') g.set(x, y, 'E');
  g.speckle({ from: ['E'], to: ['a'] }, [0, 0, 127, 79], 3, 13);
  // ---- EMPATHIS hanging in the air a wingspan away (centre) ----
  // ribbon tails flowing wide, unhurried
  g.line(58, 47, 42, 54, 'p', 1); g.line(70, 47, 86, 54, 'p', 1);
  g.line(58, 47, 44, 52, 'P'); g.line(70, 47, 84, 52, 'P');
  g.ellipse(41, 55, 3.2, 1.8, 'P'); g.ellipse(87, 55, 3.2, 1.8, 'P');
  // body: small, pink, at ease
  g.ellipse(64, 41, 8, 9, 'P');
  g.ellipse(66, 43, 6.4, 7.4, 'p'); g.ellipse(63, 39, 6.6, 7.6, 'P');
  // arms open a little, palms out — the offered hand of the say text
  g.ellipse(54, 42, 2.8, 4, 'P', 0.5); g.ellipse(74, 42, 2.8, 4, 'p', -0.5);
  // the red chest gem
  g.ellipse(64, 43, 2, 2.4, 'R'); g.set(64, 42, 'W');
  // head + the magenta helmet (two soft points, a jewel brow)
  g.ellipse(64, 29, 7.4, 6.4, 'P');
  g.ellipse(64, 26.6, 7.6, 4.4, 'M'); // helmet dome
  g.tri(58, 25, 55, 19, 62, 23, 'M'); g.tri(70, 25, 73, 19, 66, 23, 'M'); // helmet points
  g.ellipse(64, 28.6, 1.6, 1.6, 'R'); // brow jewel
  // eyes: open, calm, considering — long soft lashes of the register
  g.set(61, 30, 'O'); g.set(62, 30, 'O'); g.set(66, 30, 'O'); g.set(67, 30, 'O');
  g.set(61, 29, 'W'); g.set(66, 29, 'W');
  // drifting petals / motes in the pinkened light
  for (let i = 0; i < 16; i++) {
    const x = 14 + hash(i, 41) % 100, y = 10 + hash(i, 43) % 40;
    if (['A', 'a', 'G'].includes(g.get(x, y))) g.set(x, y, hash(i, 47) % 2 ? 'E' : 'P');
  }
  g.frame('O');
  return emit('panel-candor-empathis', 'EMPATHIS admitted by the light (ev_sinnoh_mesprit)', [
    'panel-candor-empathis 128x80. W10-B T3 cutscene panel: EMPATHIS,',
    'the roamer reveal on the Sinnoh routes (ev_sinnoh_mesprit).',
    'Original in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (pink sprite,',
    'magenta helmet, red chest gem, ribbon tails) + the event say text',
    '("The light here has a pink edge it did not have a moment ago —',
    'and then the air simply admits she is in it: EMPATHIS, hanging a',
    'wingspan away, considering you with the unafraid calm").',
  ], [
    ['O', '#2a1420', 'frame outline / eye'], ['A', '#f8ecd9', 'sky cream'], ['a', '#f2d3c2', 'sky blush'],
    ['E', '#e8a8bc', 'pink edge light'], ['L', '#a8cfe0', 'distant lake'], ['G', '#7ab85e', 'grass'],
    ['g', '#4e8a3e', 'grass shade'], ['P', '#f0a0be', 'sprite pink'], ['p', '#cf6f96', 'sprite shade'],
    ['M', '#c22e7a', 'helmet magenta'], ['R', '#d8242e', 'chest gem'], ['W', '#fdf8ee', 'cloud / glint'],
  ], g.grid);
}

// =====================================================================
// 4. LUNACYGN — ev_sinnoh_cresselia @ sinnoh-routes (the roamer
//  reveal, on a night road)
// design: animal — swan — midnight swan, gold moon-marked wings,
//  crescent crown
// say: "The light here goes crescent at the edges — and then she is
//  simply in it, the way moonrise is in a clear sky: LUNACYGN,
//  hanging above the road with her ribbons moving in a wind that
//  is entirely hers"
// =====================================================================
function sceneLunacygn() {
  const g = canvas('N');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 44 ? 'N' : y < 58 ? 'n' : 'R');
  // stars
  for (let i = 0; i < 34; i++) {
    const x = hash(i, 53) % 128, y = hash(i, 59) % 40;
    if (g.get(x, y) === 'N') g.set(x, y, hash(i, 61) % 3 ? 'S' : 'Y');
  }
  // the crescent moon, high left
  g.ring(20, 12, 6, 6, 'L', 0.46); g.ellipse(22.6, 11, 5, 5, 'N');
  // the road running away under her (perspective wedge)
  g.tri(52, 58, 76, 58, 88, 79, 'r'); g.tri(52, 58, 40, 79, 88, 79, 'r');
  g.tri(58, 58, 70, 58, 76, 79, 'R'); g.tri(58, 58, 52, 79, 76, 79, 'R');
  g.speckle({ from: ['r'], to: ['R', 'n'] }, [30, 58, 98, 79], 8, 7);
  // dark tree masses at the road's edges
  g.ellipse(8, 52, 13, 14, 'N'); g.ellipse(120, 50, 13, 15, 'N'); g.ellipse(14, 62, 10, 10, 'n'); g.ellipse(114, 63, 10, 10, 'n');
  // THE CRESCENT EDGES: the light itself goes crescent at the frame —
  // two vast pale arcs centred far off-frame, only their rims entering,
  // dissolved hard so they read as light, never as drawn rings
  for (const sgn of [-1, 1]) {
    const cx = 64 + sgn * 88;
    g.ring(cx, 40, 38, 33, 'L', 0.03);
  }
  g.speckle({ from: ['L'], to: ['N'] }, [0, 24, 16, 79], 2, 17);
  g.speckle({ from: ['L'], to: ['N'] }, [112, 24, 127, 79], 2, 23);
  // ---- LUNACYGN hanging above the road (centre) ----
  // ribbons moving in her own wind (pale, flowing both ways low)
  g.line(52, 52, 34, 58, 'S'); g.line(52, 54, 38, 62, 'S');
  g.line(76, 52, 94, 58, 'S'); g.line(76, 54, 90, 62, 'S');
  g.speckle({ from: ['S'], to: ['n'] }, [30, 50, 98, 64], 3, 19);
  // tail fan low behind the body
  g.tri(56, 50, 72, 50, 64, 60, 'b'); g.tri(59, 50, 69, 50, 64, 57, 'B');
  // body: midnight, moonlit along the back
  g.ellipse(64, 44, 11, 7.4, 'B');
  g.ellipse(64, 46.4, 10, 5.6, 'b'); g.ellipse(63, 42, 9.6, 5.6, 'B');
  g.line(56, 39, 72, 39, 'L'); // moonlit back rim
  // wings spread wide, gold moon-marks on each
  g.tri(54, 42, 26, 30, 40, 48, 'B'); g.tri(52, 42, 32, 34, 42, 46, 'b');
  g.tri(74, 42, 102, 30, 88, 48, 'B'); g.tri(76, 42, 96, 34, 86, 46, 'b');
  for (const [mx, my] of [[38, 36], [90, 36]]) { // gold crescent marks
    g.ring(mx, my, 3.4, 3.4, 'G', 0.4); g.ellipse(mx + 1.2, my - 0.4, 2.8, 2.8, 'B');
  }
  // the long neck rising in an S to the crowned head
  g.ellipse(72, 34, 4, 7, 'B', -0.4); g.ellipse(73.4, 34, 3, 6.4, 'b', -0.4); g.ellipse(71.4, 33.4, 3, 6.4, 'B', -0.4);
  g.ellipse(76, 26, 5, 3.6, 'B', -0.3); g.ellipse(77, 27, 4.2, 2.8, 'b', -0.3); g.ellipse(75.4, 25.2, 4.2, 2.8, 'B', -0.3);
  g.tri(80, 24, 86, 26, 80, 28, 'G'); // the beak, gold
  // the crescent crown
  g.ring(75, 20, 4, 4, 'G', 0.4); g.ellipse(76.4, 19.2, 3.2, 3.2, 'N');
  g.set(74, 25, 'Y'); // eye, a calm gold point
  g.frame('O');
  return emit('panel-crescent-lunacygn', 'LUNACYGN above the night road (ev_sinnoh_cresselia)', [
    'panel-crescent-lunacygn 128x80. W10-B T3 cutscene panel: LUNACYGN,',
    'the roamer reveal above a Sinnoh road (ev_sinnoh_cresselia).',
    'Original in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (midnight',
    'swan, gold moon-marked wings, crescent crown) + the event say',
    'text ("The light here goes crescent at the edges — and then she',
    'is simply in it, the way moonrise is in a clear sky: LUNACYGN,',
    'hanging above the road with her ribbons moving").',
  ], [
    ['O', '#0a0e1c', 'frame outline'], ['N', '#141e38', 'night sky'], ['n', '#22304f', 'night mid'],
    ['R', '#4a3a26', 'road dark'], ['r', '#6e5a3a', 'road'], ['B', '#46598a', 'swan body'],
    ['b', '#2c3c66', 'swan shade'], ['L', '#f2d98a', 'moon gold pale'], ['G', '#d9a92c', 'gold'],
    ['g', '#8a6d14', 'gold shade'], ['S', '#cdd8ee', 'ribbon pale'], ['Y', '#fdf3c0', 'star / eye'],
  ], g.grid);
}

// =====================================================================
// 5. MAGMARCH — ev_sinnoh_heatran @ stark-interior (the Crater Hall)
// design: construct — furnace tortoise — iron furnace tortoise,
//  lava-seamed shell, cross mask
// say: "The Crater Hall is hotter than you left it — honestly
//  hotter, the way a forge is honest. The stone glows at the edges
//  like a coal that has remembered something. And the lava floor
//  at the hall's heart is not a floor anymore. It is a back. Rising."
// =====================================================================
function sceneMagmarch() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 28 ? 'K' : y < 52 ? 'D' : 'd');
  g.speckle({ from: ['D', 'd'], to: ['K'] }, [0, 0, 127, 56], 13, 3);
  // hall pillars at the sides, their edges remembering the coal-glow
  for (const px of [8, 112]) {
    g.rect(px, 10, px + 8, 58, 'K'); g.rect(px, 10, px + 8, 12, 'D');
    g.line(px + (px < 60 ? 8 : 0), 14, px + (px < 60 ? 8 : 0), 54, 'E'); // glowing edge
    g.speckle({ from: ['E'], to: ['m'] }, [px, 10, px + 8, 58], 4, px);
  }
  // cracked back wall, seams lit from below
  g.line(30, 8, 44, 20, 'K'); g.line(44, 20, 40, 30, 'K'); g.line(92, 6, 82, 18, 'K'); g.line(82, 18, 88, 28, 'K');
  g.line(31, 9, 44, 20, 'E'); g.line(91, 7, 83, 18, 'E');
  // the lava floor — the hall's heart, not a floor anymore
  g.rect(0, 58, W - 1, H - 1, 'M');
  g.ellipse(64, 71, 42, 7, 'm'); g.ellipse(64, 72, 27, 5, 'Y');
  for (const [cx, cy, rx] of [[14, 66, 9], [36, 70, 7], [98, 67, 10], [116, 71, 7]]) g.ellipse(cx, cy, rx, 2.2, 'd');
  g.speckle({ from: ['M'], to: ['Y', 'm'] }, [0, 58, 127, 79], 9, 5);
  // heat flecks rising off the floor
  for (let i = 0; i < 16; i++) {
    const x = 22 + hash(i, 67) % 84, y = 34 + hash(i, 71) % 22;
    if (['D', 'd'].includes(g.get(x, y))) g.set(x, y, 'm');
  }
  // ---- MAGMARCH: the floor, rising as a back (centre) ----
  // stub legs / claws planted at the shell's rim, iron on lava
  for (const [lx, sgn] of [[36, 1], [46, 1], [80, -1], [90, -1]]) {
    g.rect(lx, 50, lx + 5, 62, 'I'); g.rect(lx, 50, lx + 5, 52, 'i');
    for (let c = 0; c < 3; c++) g.tri(lx + c * 2, 62, lx + c * 2 + 1, 62, lx + c * 2 + sgn, 65, 'i'); // claws
  }
  // the shell: a great iron dome of plates, lava in every seam
  g.ellipse(64, 48, 27, 17, 'I');
  g.ellipse(64, 50, 26, 15.4, 'i'); g.ellipse(63, 46, 25, 15.4, 'I'); // plate light from above-left
  // plate seams (arcs + radials), drawn dark then lit with lava
  for (const r of [10, 17, 23]) { g.ring(64, 48, r, r * 0.62, 'K', 0.07); g.ring(64, 48, r, r * 0.62, 'E', 0.028); }
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
    const x2 = Math.round(64 + 25 * Math.sin(a)), y2 = Math.round(48 + 15 * Math.cos(a) * 0.9);
    g.line(64, 40, x2, Math.max(y2, 52), 'K'); g.line(64, 41, x2, Math.max(y2, 52), 'E');
  }
  g.speckle({ from: ['I'], to: ['i'] }, [38, 32, 90, 62], 9, 11); // worn plate grain
  // the head pushing out low at the front, cross mask foremost
  g.ellipse(64, 56, 10, 7, 'I'); g.ellipse(64, 57.4, 9, 5.8, 'i'); g.ellipse(63.4, 55, 8.6, 5.8, 'I');
  g.rect(59, 51, 69, 61, 'i'); g.rect(59, 51, 69, 61, 'I'); // mask plate
  g.rect(60, 52, 68, 60, 'i');
  // THE CROSS: ember burning through a cross-shaped slit
  g.rect(63, 52, 65, 60, 'E'); g.rect(60, 55, 68, 57, 'E');
  g.rect(63, 53, 65, 59, 'Y'); g.rect(61, 55, 67, 56, 'Y'); // the cross's hot heart
  g.rect(59, 51, 69, 52, 'K'); g.rect(59, 60, 69, 61, 'K'); // mask rim shadow
  // lava drips off the shell's rim where it leaves the floor
  for (const dx of [-20, -8, 10, 21]) { g.line(64 + dx, 58, 64 + dx, 62, 'M'); g.set(64 + dx, 63, 'm'); }
  g.ellipse(40, 63, 7, 1.8, 'Y'); g.ellipse(88, 63, 7, 1.8, 'Y');
  g.frame('O');
  return emit('panel-crater-magmarch', 'MAGMARCH rising in the Crater Hall (ev_sinnoh_heatran)', [
    'panel-crater-magmarch 128x80. W10-B T3 cutscene panel: MAGMARCH',
    'in the Crater Hall / Stark Interior (ev_sinnoh_heatran). Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (iron furnace',
    'tortoise, lava-seamed shell, cross mask) + the event say text',
    '("The stone glows at the edges like a coal that has remembered',
    'something. And the lava floor at the hall\'s heart is not a floor',
    'anymore. It is a back. Rising.").',
  ], [
    ['O', '#120806', 'frame outline'], ['K', '#1d100a', 'hall deepest'], ['D', '#33200f', 'hall stone'],
    ['d', '#54341a', 'stone mid / crust'], ['I', '#434a54', 'iron shell'], ['i', '#6a7482', 'iron light'],
    ['M', '#e8641e', 'lava'], ['m', '#f2a03c', 'lava bright'], ['Y', '#f8e58a', 'lava core'],
    ['E', '#ff7a26', 'seam glow'], ['W', '#e8e2d4', 'ash highlight'],
  ], g.grid);
}

// =====================================================================
// 6. COLOSSOR — ev_sinnoh_regigigas @ snowpoint-temple-depths (the
//  deep room of Rimefall Temple)
// design: construct — colossus — white stone colossus, moss-grown
//  cracks, gold crown
// say: "The deep room of Rimefall Temple has waited since the lake
//  froze the first time — and today it does not wait alone. Three
//  small giants stand in your party's light... The statue is not a
//  statue. It never was. COLOSSOR unfolds out of ten thousand years
//  of stillness joint by joint"
// =====================================================================
function sceneColossor() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 56 ? 'D' : 'K');
  g.speckle({ from: ['D'], to: ['K', 'S'] }, [0, 0, 127, 56], 17, 3);
  // temple columns, snow drifted at their feet
  for (const px of [6, 114]) {
    g.rect(px, 6, px + 7, 58, 'D'); g.rect(px, 6, px + 7, 8, 'S'); g.rect(px + 6, 6, px + 7, 58, 'K');
    g.ellipse(px + 3, 59, 8, 2.6, 'S');
  }
  // the floor: old stone, snow blown in at the edges
  g.rect(0, 58, W - 1, H - 1, 'D');
  for (const [dx, dr] of [[8, 15], [120, 15], [24, 9], [104, 9]]) g.ellipse(dx, 74, dr, 5, 'S'); // snow drifts blown in
  g.speckle({ from: ['S'], to: ['D'] }, [0, 64, 127, 79], 4, 5); // drift tops breaking back to stone
  g.speckle({ from: ['D'], to: ['K'] }, [0, 58, 127, 79], 9, 13);
  // the dais at the room's heart
  g.rect(38, 52, 90, 58, 'S'); g.rect(38, 52, 90, 53, 'W'); g.rect(42, 47, 86, 52, 'S'); g.rect(42, 47, 86, 48, 'W');
  // your party's light: a warm pool low at the front
  g.ellipse(64, 70, 30, 7, 'Y'); g.speckle({ from: ['Y'], to: ['D'] }, [30, 62, 98, 78], 2, 21);
  // THREE SMALL GIANTS in that light (silhouettes; amber/blue/red lights)
  const giant = (cx, gem) => {
    g.ellipse(cx, 66, 4.4, 5.4, 'K'); g.ellipse(cx, 61.4, 3.2, 2.8, 'K');
    g.rect(cx - 5, 64, cx - 3, 70, 'K'); g.rect(cx + 3, 64, cx + 5, 70, 'K'); // slab arms
    g.set(cx - 1, 60, gem); g.set(cx + 1, 60, gem); g.set(cx, 62, gem); // face lights
  };
  giant(48, 'A'); giant(64, 'B'); giant(80, 'R');
  // ---- COLOSSOR unfolding on the dais (vast, white, joint by joint) ----
  // legs: two segmented stone columns, one knee still bent from sitting
  g.rect(52, 34, 59, 47, 'W'); g.rect(52, 34, 59, 47, 'W'); g.rect(57, 34, 59, 47, 'w'); g.rect(52, 40, 59, 41, 'w'); // joint line
  g.rect(69, 36, 76, 47, 'W'); g.rect(74, 36, 76, 47, 'w'); g.rect(69, 41, 76, 42, 'w');
  g.rect(50, 46, 61, 48, 'w'); g.rect(67, 46, 78, 48, 'w'); // feet on the dais step
  // torso: a white stone mass, cracked, the cracks gone green with moss
  g.ellipse(64, 27, 15, 11, 'W');
  g.ellipse(66, 29.4, 13.4, 9.4, 'w'); g.ellipse(63, 25, 13.4, 9.4, 'W');
  const mossCrack = (pts) => { for (let i = 0; i + 1 < pts.length; i++) { g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 'w'); g.line(pts[i][0], pts[i][1] + 1, pts[i + 1][0], pts[i + 1][1] + 1, 'M'); } };
  mossCrack([[54, 20], [58, 26], [55, 32]]); mossCrack([[72, 19], [70, 25], [74, 31]]); mossCrack([[62, 30], [66, 34], [64, 37]]);
  g.speckle({ from: ['W'], to: ['m'] }, [50, 18, 78, 36], 23, 27); // moss freckles in the stone
  // arms: the left still folded from the long sitting; the right mid-unfold
  g.ellipse(47, 30, 4.4, 9, 'W', 0.3); g.ellipse(48.4, 30, 3.4, 8, 'w', 0.3); g.ellipse(46.4, 29, 3.4, 8.4, 'W', 0.3);
  g.ellipse(45, 39, 4, 3.4, 'w'); // folded fist
  g.ellipse(82, 28, 4.4, 8, 'W', -0.5); g.ellipse(83.4, 28, 3.4, 7.4, 'w', -0.5); g.ellipse(81.4, 27, 3.4, 7.4, 'W', -0.5);
  g.ellipse(87, 21, 3.8, 3.2, 'W'); g.line(86, 23, 86, 27, 'w'); g.line(89, 23, 89, 26, 'w'); // opening fingers
  // head: low, broad, crowned in gold; two small lights waking
  g.ellipse(64, 14, 8.4, 5.6, 'W'); g.ellipse(64, 15.6, 7.6, 4.6, 'w'); g.ellipse(63.4, 13, 7.4, 4.4, 'W');
  g.rect(57, 9, 71, 11, 'G'); g.rect(57, 11, 71, 11, 'g'); // the gold crown band
  for (const sx of [58, 62, 66, 70]) g.tri(sx - 1, 9, sx + 1, 9, sx, 6, 'G');
  g.set(61, 14, 'Y'); g.set(67, 14, 'Y'); // eyes, ten thousand years late
  // snow sifting down through the dark, sparse
  for (let i = 0; i < 16; i++) {
    const x = 10 + hash(i, 73) % 108, y = 4 + hash(i, 79) % 44;
    if (['K', 'D'].includes(g.get(x, y))) g.set(x, y, 'S');
  }
  g.frame('O');
  return emit('panel-temple-colossor', 'COLOSSOR unfolding in Rimefall Temple (ev_sinnoh_regigigas)', [
    'panel-temple-colossor 128x80. W10-B T3 cutscene panel: COLOSSOR in',
    'the deep room of Rimefall Temple / Snowpoint Temple Depths',
    '(ev_sinnoh_regigigas). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t3.mjs. Brief = the',
    'species design record (white stone colossus, moss-grown cracks,',
    'gold crown) + the event say text ("Three small giants stand in',
    'your party\'s light... The statue is not a statue. It never was.',
    'COLOSSOR unfolds out of ten thousand years of stillness").',
  ], [
    ['O', '#101820', 'frame outline'], ['K', '#1c2836', 'room deepest'], ['D', '#33465c', 'temple stone'],
    ['W', '#eef2f0', 'colossus white'], ['w', '#c3ced2', 'stone shade'], ['S', '#8fa3ad', 'snow shadow'],
    ['M', '#5e8a4e', 'moss'], ['m', '#3e6e32', 'moss deep'], ['G', '#d9a92c', 'crown gold'],
    ['g', '#8a6d14', 'gold shade'], ['Y', '#f8e58a', 'party light / eyes'], ['A', '#f2b04a', 'giant amber light'],
    ['B', '#7fb8e8', 'giant blue light'], ['R', '#e86a5a', 'giant red light'],
  ], g.grid);
}

// =====================================================================
// 7. GRATHOG — ev_sinnoh_shaymin @ flower-paradise (Petal Paradise)
// design: animal — hedgehog — cream hedgehog, grassy back, pink blooms
// say: "Petal Paradise lives past its billing the way shrines do:
//  quietly, and completely — a meadow at the end of the sea road,
//  in bloom past all reason... At the meadow's heart the bloom
//  moves against the wind — and a small green shape with a flower
//  on either ear lifts its head out of the bloom"
// =====================================================================
function sceneGrathog() {
  const g = canvas('A');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 14 ? 'A' : y < 20 ? 'S' : 'G');
  // the sea at the end of the sea road: a glinting band, sun struck
  g.speckle({ from: ['S'], to: ['A'] }, [0, 14, 127, 19], 5, 3);
  g.line(16, 16, 44, 16, 'A'); g.line(70, 17, 104, 17, 'A');
  // meadow base texture
  g.speckle({ from: ['G'], to: ['g'] }, [0, 20, 127, 79], 6, 5);
  // flower bands in bloom past all reason (pink / white / gold / lavender)
  const band = (y0, y1, cols, mod, seed) => {
    for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
      if (hash(x + seed, y) % mod === 0) { g.set(x, y, cols[hash(x, y + seed) % cols.length]); if (hash(x, y) % 3) g.set(x, y + 1, cols[hash(x, y + seed) % cols.length]); }
    }
  };
  band(24, 36, ['P', 'F'], 6, 11);
  band(38, 50, ['Y', 'F', 'L'], 6, 17);
  band(52, 64, ['P', 'F', 'Y', 'L'], 7, 23);
  band(66, 78, ['P', 'Y', 'L', 'F'], 5, 29);
  // grass tufts leaning WITH the wind (all one way: right)
  for (let i = 0; i < 22; i++) {
    const x = hash(i, 83) % 124, y = 24 + hash(i, 89) % 52;
    if (g.get(x, y) === 'G') { g.set(x + 1, y - 1, 'g'); g.set(x + 2, y - 1, 'G'); }
  }
  // petals drifting AGAINST the wind (left) — the bloom moving wrong
  for (let i = 0; i < 18; i++) {
    const x = 10 + hash(i, 97) % 108, y = 22 + hash(i, 101) % 30;
    if (['G', 'g'].includes(g.get(x, y))) g.set(x, y, hash(i, 103) % 2 ? 'P' : 'F');
  }
  // the heart of the meadow: a denser bloom mound, moving against it all
  g.ellipse(64, 56, 17, 9, 'G'); g.ellipse(64, 54, 15, 7.6, 'G');
  band(48, 62, ['P', 'F', 'p'], 3, 37);
  g.ellipse(64, 57, 16, 8, 'G'); // re-seat the mound under the figure
  band(50, 60, ['P', 'F'], 4, 41);
  // ---- GRATHOG lifting its head out of the bloom (centre) ----
  // the grassy back: a green dome of grass, blooms caught in it
  g.ellipse(64, 50, 10, 6.4, 'g'); g.ellipse(64, 48.6, 9, 5.4, 'G');
  for (let i = 0; i < 12; i++) { const x = 56 + hash(i, 107) % 16, y = 45 + hash(i, 109) % 6; g.set(x, y - 1, 'G'); g.set(x, y, 'g'); } // grass blades up
  g.set(59, 47, 'P'); g.set(68, 46, 'P'); g.set(63, 49, 'F'); // caught blooms
  // the cream face lifting out, turned a little to the light
  g.ellipse(64, 53, 6.4, 4.8, 'C');
  g.ellipse(65, 54.4, 5.4, 3.8, 'c'); g.ellipse(63.2, 52, 5.4, 3.8, 'C');
  // a flower on EITHER ear (the record's signature)
  for (const ex of [58, 70]) {
    g.ellipse(ex, 49, 2.6, 2.2, 'P'); g.ellipse(ex, 49, 1.4, 1.2, 'p'); g.set(ex, 49, 'Y');
    g.ellipse(ex + (ex < 64 ? -1 : 1), 51, 1.6, 1.4, 'P');
  }
  // eyes + nose: small, dark, just-opened
  g.set(61, 52, 'B'); g.set(67, 52, 'B');
  g.ellipse(64, 54.6, 1.4, 1, 'B');
  // tiny front paws at the mound's lip
  g.ellipse(58, 57, 2.2, 1.4, 'C'); g.ellipse(70, 57, 2.2, 1.4, 'C');
  g.frame('O');
  return emit('panel-paradise-grathog', 'GRATHOG in Petal Paradise (ev_sinnoh_shaymin)', [
    'panel-paradise-grathog 128x80. W10-B T3 cutscene panel: GRATHOG at',
    'Petal Paradise / Flower Paradise (ev_sinnoh_shaymin). Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t3.mjs. Brief = the species design record (cream',
    'hedgehog, grassy back, pink blooms) + the event say text',
    '("a meadow at the end of the sea road, in bloom past all reason...',
    'At the meadow\'s heart the bloom moves against the wind — and a',
    'small green shape with a flower on either ear lifts its head").',
  ], [
    ['O', '#1c2a14', 'frame outline'], ['A', '#cfe8f2', 'sky'], ['S', '#7fc4de', 'sea glint'],
    ['G', '#5da24a', 'meadow green'], ['g', '#3e7a32', 'green shade'], ['F', '#f2f5e6', 'flower white'],
    ['P', '#f0a0c0', 'flower pink'], ['p', '#d8709c', 'pink deep'], ['Y', '#f2d84a', 'flower yellow'],
    ['L', '#b89ae0', 'flower lavender'], ['C', '#f6ead2', 'hedgehog cream'], ['c', '#d9c9a4', 'cream shade'],
    ['B', '#3a2c1c', 'eye / nose'],
  ], g.grid);
}

// =====================================================================
// 8. CENTWISP — ev_sinnoh_spiritomb @ r209 (the Weathered Tower /
//  Hallowed Tower)
// design: cosmic — wraith — violet spirit vortex, faces in the
//  smoke, chained keystone
// say: "The Sealed Keystone leaves your hands... and seats itself
//  into the Weathered Tower's stones like it was always the mortar.
//  The tower... clears its throat. A sound with far too many voices
//  in it... One hundred and eight grudges, pressed into one cracked
//  stone"
// =====================================================================
function sceneCentwisp() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 56 ? 'D' : 'K');
  // stars gone wrong: very sparse, dim
  for (let i = 0; i < 10; i++) { const x = hash(i, 113) % 128, y = hash(i, 127) % 22; if (g.get(x, y) === 'K') g.set(x, y, 'M'); }
  // THE WEATHERED TOWER (right): broken stone, a gap where its top was
  g.rect(96, 18, 118, 62, 's'); g.rect(96, 18, 118, 62, 's'); g.rect(97, 18, 116, 62, 'S');
  g.rect(94, 30, 120, 33, 'S'); g.rect(94, 33, 120, 33, 's'); // a surviving course band
  for (let i = 0; i < 6; i++) g.set(97 + hash(i, 131) % 18, 17 - (hash(i, 137) % 3), 'S'); // jagged broken top
  g.rect(104, 40, 109, 50, 'K'); // a dark window slit
  g.speckle({ from: ['S'], to: ['s'] }, [96, 18, 118, 62], 6, 139);
  g.line(100, 36, 106, 44, 's'); g.line(112, 24, 110, 32, 's'); // cracks
  // fallen stones across the ground
  g.rect(0, 62, W - 1, H - 1, 'D');
  for (const [cx, cy, rx] of [[16, 64, 9], [36, 68, 7], [84, 66, 8], [110, 68, 10], [58, 70, 6]]) g.ellipse(cx, cy, rx, 2.6, 's');
  g.speckle({ from: ['D'], to: ['M', 'K'] }, [0, 62, 127, 79], 8, 149);
  // ground mist, low and slow
  g.ellipse(30, 60, 24, 3, 'M'); g.ellipse(88, 61, 26, 3, 'M');
  g.speckle({ from: ['M'], to: ['D'] }, [0, 56, 127, 64], 3, 151);
  // ---- THE KEYSTONE, seated in the stones at the tower's foot ----
  g.ellipse(64, 57, 9, 7, 'S'); g.ellipse(64, 55.6, 8, 5.8, 'S');
  g.ellipse(63, 54, 7, 4.8, 'I'); // its worn top catching what light there is
  // its cracks (the record: one CRACKED stone)
  g.line(60, 51, 63, 56, 'K'); g.line(63, 56, 61, 60, 'K'); g.line(68, 52, 66, 57, 'K'); g.line(66, 57, 69, 61, 'K');
  // the chain: draped links over and off the stone
  for (let i = 0; i < 7; i++) {
    const x = 56 + i * 2.6, y = 53 + Math.round(Math.sin(i * 0.9) * 1.6);
    g.ring(Math.round(x), Math.round(y), 1.5, 1.5, 'I', 0.45);
  }
  g.line(74, 55, 82, 60, 'I'); g.line(82, 60, 84, 64, 'I'); // chain tail into the stones
  // ---- THE VORTEX: violet smoke rising out of the stone ----
  // spiral bands winding up and widening
  for (let t = 0; t < 40; t++) {
    const y = 52 - t * 0.95, r = 3 + t * 0.42;
    const x = Math.round(64 + r * Math.sin(t * 0.55));
    g.ellipse(x, Math.round(y), 3.4, 2.2, t % 3 ? 'V' : 'v');
  }
  g.ellipse(64, 30, 20, 9, 'V'); g.ellipse(64, 22, 15, 7, 'V'); // the smoke's crown mass
  g.ellipse(64, 26, 16, 8, 'v'); g.ellipse(60, 20, 10, 5, 'v');
  g.dissolve('V', ['V', 'v'], 3, 157); g.dissolve('v', ['v', 'V'], 4, 163);
  // FACES IN THE SMOKE: pale, half-formed, far too many implied
  const face = (fx, fy, s) => {
    g.ellipse(fx, fy, 2.6 * s, 3.2 * s, 'F');
    g.set(fx - Math.round(s), fy, 'K'); g.set(fx + Math.round(s), fy, 'K'); // eyes
    g.set(fx, fy + Math.round(1.6 * s), 'K'); // a mouth, undecided
  };
  face(56, 24, 1); face(72, 19, 0.9); face(63, 33, 0.8); face(50, 30, 0.7); face(78, 27, 0.75);
  g.speckle({ from: ['F'], to: ['v'] }, [40, 12, 90, 40], 3, 167); // faces half-dissolving back
  // loose wisps curling off the vortex
  for (const [wx, wy] of [[40, 16], [90, 14], [34, 26], [96, 24]]) g.ellipse(wx, wy, 3, 1.6, 'v');
  g.frame('O');
  return emit('panel-keystone-centwisp', 'CENTWISP at the Weathered Tower (ev_sinnoh_spiritomb)', [
    'panel-keystone-centwisp 128x80. W10-B T3 cutscene panel: CENTWISP',
    'at the Weathered Tower / Hallowed Tower, Route 209',
    '(ev_sinnoh_spiritomb). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t3.mjs. Brief = the',
    'species design record (violet spirit vortex, faces in the smoke,',
    'chained keystone) + the event say text ("The Sealed Keystone...',
    'seats itself into the Weathered Tower\'s stones like it was',
    'always the mortar... One hundred and eight grudges, pressed into',
    'one cracked stone").',
  ], [
    ['O', '#0e0a16', 'frame outline'], ['K', '#1a1426', 'dusk deepest'], ['D', '#2e2440', 'dusk mid'],
    ['S', '#6a7080', 'tower stone'], ['s', '#454b58', 'stone shade'], ['I', '#9aa4ae', 'chain iron / worn top'],
    ['V', '#6a3a9e', 'vortex violet'], ['v', '#9a6ad0', 'vortex light'], ['F', '#d8cfe8', 'face pale'],
    ['M', '#3a2c55', 'mist'], ['W', '#efeaf6', 'glint'],
  ], g.grid);
}

// =====================================================================
// 9. NOCTARCH, THE INN DREAM — ev_sinnoh_darkrai_inn @ newmoon-island
//  (insert after step 2, the dream-shoreline say; catch @5)
// design: cosmic — shade — black smoke shade, one blue eye, red
//  crystal collar
// say (step 2): "The dream has a shoreline. Black water, a pond
//  that reflects nothing the sky admits to, and trees that grow
//  toward the water as if listening. You know this island... And
//  at its heart the dark shape that stood over a sailor's boy's
//  bed for a month stands over its own — patient as debt"
// register: the DREAM of the island T1 drew awake — pale, washed,
//  seen from across the water; the shape distant at the shore's heart
// =====================================================================
function sceneInnNoctarch() {
  const g = canvas('A');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 26 ? 'A' : y < 38 ? 'a' : 'W');
  // a dream sky: washed, wrong-pale, its stars showing through morning
  for (let i = 0; i < 18; i++) {
    const x = hash(i, 173) % 128, y = hash(i, 179) % 22;
    if (['A', 'a'].includes(g.get(x, y))) g.set(x, y, 'Y');
  }
  g.speckle({ from: ['A'], to: ['a'] }, [0, 0, 127, 26], 8, 181);
  // a moon that should not be out, pale and undecided (top right)
  g.ring(106, 10, 5, 5, 'Y', 0.3); g.ellipse(108, 9, 4.2, 4.2, 'A');
  g.speckle({ from: ['Y'], to: ['a'] }, [98, 2, 114, 18], 3, 191);
  // mist bands lying on the far shore
  g.ellipse(30, 33, 26, 2.6, 'M'); g.ellipse(92, 35, 28, 2.6, 'M');
  g.speckle({ from: ['M'], to: ['a', 'W'] }, [0, 30, 127, 38], 3, 193);
  // THE FAR SHORELINE: a dark band, trees growing toward the water
  g.rect(0, 36, W - 1, 39, 'T');
  const dtree = (bx, lean) => {
    g.rect(bx, 28, bx + 1, 37, 'T');
    const tx = bx + lean;
    g.ellipse(tx, 25, 6, 5, 't'); g.ellipse(tx, 22, 4.4, 3.4, 'T');
  };
  dtree(12, 2); dtree(26, 1); dtree(98, -1); dtree(112, -2); dtree(44, 1); dtree(84, -1);
  // the black water: near-black, sheen edges only — it reflects nothing
  g.speckle({ from: ['W'], to: ['w'] }, [0, 40, 127, 79], 47, 197);
  g.line(8, 48, 38, 48, 'w'); g.line(86, 54, 118, 54, 'w'); g.line(24, 64, 58, 64, 'w'); g.line(70, 72, 104, 72, 'w');
  // ---- THE SHAPE at the shore's heart: distant, standing over its own ----
  // a small smoke column at centre-shore, seen across the water
  g.ellipse(64, 35, 3.4, 2, 'S'); // pooled smoke at its feet
  g.ellipse(64, 29, 3, 6.4, 'S'); // the column
  g.ellipse(64, 27, 3.8, 3.4, 'S'); // shoulders
  g.ellipse(61, 30, 2.4, 1.4, 'S', 0.5); g.ellipse(67, 30, 2.4, 1.4, 'S', -0.5); // trailing arms
  g.ellipse(64, 21.6, 2.4, 2.4, 'S'); // head
  g.set(64, 21, 'B'); // THE ONE EYE, glinting across the whole pond
  g.set(63, 30, 'R'); g.set(65, 30, 'R'); // the collar, two red points at this distance
  g.set(62, 18, 'S'); g.set(66, 17, 'S'); // wisp horns, barely there
  // its non-reflection: a darkening in the water under it, no image
  g.ellipse(64, 44, 5, 2, 'S'); g.speckle({ from: ['S'], to: ['W'] }, [58, 41, 70, 47], 2, 199);
  // dream motes drifting the wrong way (up)
  for (let i = 0; i < 12; i++) {
    const x = 16 + hash(i, 211) % 96, y = 8 + hash(i, 223) % 30;
    if (['A', 'a'].includes(g.get(x, y))) g.set(x, y, 'M');
  }
  g.frame('O');
  return emit('panel-inn-noctarch', 'NOCTARCH in the inn dream (ev_sinnoh_darkrai_inn)', [
    'panel-inn-noctarch 128x80. W10-B T3 cutscene panel: NOCTARCH in',
    'the Bridgeport inn dream of Darkmoon Island',
    '(ev_sinnoh_darkrai_inn; panel after step 2, the dream-shoreline',
    'say). Original in-house art, generated deterministically by',
    'w10b-rig/gen-panels-t3.mjs. Brief = the species design record',
    '(black smoke shade, one blue eye, red crystal collar) + the',
    'event say text ("The dream has a shoreline. Black water, a pond',
    'that reflects nothing the sky admits to, and trees that grow',
    'toward the water as if listening... the dark shape... stands',
    'over its own — patient as debt"). The dream register of the',
    'island T1 drew awake: pale, washed, seen from across the water.',
  ], [
    ['O', '#0a0a12', 'frame outline'], ['A', '#cfc4d8', 'dream sky pale'], ['a', '#b3a4c2', 'dream sky shade'],
    ['M', '#8a7a9e', 'mist'], ['W', '#04060a', 'black water'], ['w', '#232c3e', 'water sheen'],
    ['T', '#141c16', 'far shore / trees'], ['t', '#1f2f24', 'tree shade'], ['S', '#07070e', 'the shape'],
    ['B', '#5fb8e8', 'the one eye'], ['R', '#d8402e', 'collar glint'], ['Y', '#e8e2f0', 'dream glint'],
  ], g.grid);
}

// =====================================================================
// 10. ASTRAEON — ev_hoenn_jirachi @ meteor-falls (Comet Falls)
// design: cosmic — star sprite — cream star sprite, gold star crest,
//  ribbon arms
// say: "The meteorstone is warm. Curled against it, no bigger than
//  a secret, is a small yellow shape with streamers like ribbons on
//  a parcel — asleep on its feet, swaying, humming a note you feel
//  in your teeth... One eye opens. Then the other. Then the third
//  one — the true one, in its belly"
// =====================================================================
function sceneAstraeon() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'K' : y < 58 ? 'D' : 'K');
  g.speckle({ from: ['K', 'D'], to: ['D'] }, [0, 0, 127, 60], 21, 227);
  // the falls: pale falling streaks at the left, light with no source
  for (const fx of [8, 13, 19, 25]) {
    for (let y = 2; y < 56; y++) { g.set(fx, y, (y + fx) % 5 ? 'F' : 'f'); }
  }
  g.ellipse(16, 58, 14, 3, 'F'); g.speckle({ from: ['F'], to: ['f', 'D'] }, [0, 54, 32, 62], 3, 229); // foam foot
  // cave rock teeth at the right + floor
  g.ellipse(122, 20, 13, 20, 'K'); g.ellipse(118, 62, 15, 12, 'K');
  g.rect(0, 60, W - 1, H - 1, 'D'); g.speckle({ from: ['D'], to: ['K', 'F'] }, [0, 60, 127, 79], 10, 233);
  // THE METEORSTONE: a warm rounded mass, amber light in its cracks
  g.ellipse(78, 48, 24, 15, 'M');
  g.ellipse(76, 45, 22, 13, 'm'); g.ellipse(79, 50, 20, 11.4, 'M'); // shaded low-right
  g.ellipse(74, 42, 16, 8, 'm'); // lit crown
  g.line(62, 40, 72, 46, 'R'); g.line(72, 46, 70, 54, 'R'); g.line(84, 38, 88, 46, 'R'); g.line(88, 46, 96, 50, 'R'); // warm cracks
  g.speckle({ from: ['R'], to: ['Y'] }, [56, 34, 100, 60], 3, 239);
  g.ring(78, 48, 27, 18, 'R', 0.03); // the warmth's halo on the cave air
  g.speckle({ from: ['R'], to: ['D'] }, [48, 28, 108, 68], 2, 241);
  // ---- ASTRAEON curled against the stone (small, asleep, swaying) ----
  // ribbon arms / streamers curled round the body like parcel ribbon
  g.line(52, 52, 44, 58, 'c', 1); g.line(52, 54, 46, 62, 'c', 1);
  g.ellipse(43, 59, 3, 1.8, 'c'); g.ellipse(45, 63, 2.6, 1.6, 'c');
  g.line(60, 54, 66, 60, 'c', 1); g.ellipse(67, 61, 2.8, 1.6, 'c');
  // body: a small cream teardrop, leaning on the stone, feet asleep
  g.ellipse(56, 48, 7, 8.4, 'C');
  g.ellipse(58, 50, 5.6, 6.8, 'c'); g.ellipse(55, 46, 5.6, 6.8, 'C');
  g.ellipse(52, 56, 2.6, 1.6, 'C'); g.ellipse(60, 56, 2.6, 1.6, 'C'); // feet
  // THE TRUE EYE in the belly: shut, but its seam already glows
  g.ring(56, 49, 3, 3.8, 'G', 0.22);
  g.line(54, 49, 58, 49, 'R'); // the seam of light along the shut eye
  // head: round, tipped in sleep; the GOLD STAR CREST standing on it
  g.ellipse(56, 37, 7, 6.2, 'C'); g.ellipse(57, 38.6, 5.8, 4.8, 'c'); g.ellipse(55.2, 35.8, 5.8, 4.8, 'C');
  // star crest: a five-point star worn like a crown (points up/out)
  g.tri(56, 24, 52.6, 32, 59.4, 32, 'G'); // top point + shoulders
  g.tri(50, 29, 56, 32, 49, 36, 'G'); // left point
  g.tri(62, 29, 56, 32, 63, 36, 'G'); // right point
  g.ellipse(56, 31, 3.4, 2.8, 'G'); g.ellipse(56, 30.4, 2.4, 1.9, 'Y'); // crest heart, lit
  // eyes shut in sleep: two soft curves; a hum made visible (faint rings)
  g.line(52, 38, 54, 39, 'c'); g.line(58, 39, 60, 38, 'c');
  g.ring(56, 44, 12, 5, 'f', 0.03); g.speckle({ from: ['f'], to: ['D'] }, [40, 36, 72, 52], 2, 251);
  // warm motes rising off the stone
  for (let i = 0; i < 12; i++) {
    const x = 56 + hash(i, 257) % 44, y = 26 + hash(i, 263) % 30;
    if (['K', 'D'].includes(g.get(x, y))) g.set(x, y, 'Y');
  }
  g.frame('O');
  return emit('panel-meteor-astraeon', 'ASTRAEON asleep on the meteorstone (ev_hoenn_jirachi)', [
    'panel-meteor-astraeon 128x80. W10-B T3 cutscene panel: ASTRAEON',
    'curled asleep against the meteorstone at Comet Falls / Meteor',
    'Falls (ev_hoenn_jirachi). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t3.mjs. Brief = the',
    'species design record (cream star sprite, gold star crest, ribbon',
    'arms) + the event say text ("The meteorstone is warm. Curled',
    'against it, no bigger than a secret, is a small yellow shape with',
    'streamers like ribbons on a parcel — asleep on its feet, swaying,',
    'humming... Then the third one — the true one, in its belly").',
  ], [
    ['O', '#0c1218', 'frame outline'], ['K', '#14202a', 'cave deepest'], ['D', '#22384a', 'cave mid'],
    ['F', '#7fc4de', 'falls glint'], ['f', '#b8e2f2', 'falls pale'], ['M', '#8a5a2c', 'meteorstone'],
    ['m', '#c98a3e', 'stone warm'], ['Y', '#f8d84a', 'glow gold'], ['C', '#f8f0d0', 'sprite cream'],
    ['c', '#e0d0a0', 'cream shade'], ['G', '#e8a81e', 'star gold'], ['R', '#c25a1e', 'core ember'],
  ], g.grid);
}

// =====================================================================
// 11. XENOGENE — ev_hoenn_deoxys @ meteor-falls (the crater)
// design: cosmic — alien — violet alien, tentacle limbs, glowing
//  core heart
// say: "The crater meteorite is not warm the way sun-warmed stone
//  is warm. It is warm the way a held hand is warm — recently, and
//  on purpose. As you reach it, the stone's heart answers with
//  light: a core of orange fire, unfolding out of the rock in limbs
//  that cannot decide what shape honesty requires"
// =====================================================================
function sceneXenogene() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 30 ? 'K' : y < 54 ? 'D' : 'd');
  g.speckle({ from: ['D', 'd'], to: ['S'] }, [0, 0, 127, 60], 19, 269);
  // the crater bowl: rim arcs rising at both sides
  g.ring(64, 96, 74, 44, 'S', 0.10); g.ring(64, 96, 74, 44, 'd', 0.05);
  g.speckle({ from: ['S'], to: ['d'] }, [0, 40, 127, 79], 7, 271);
  // scattered crater rock
  for (const [cx, cy, rx] of [[14, 62, 9], [30, 68, 6], [100, 64, 8], [114, 70, 9]]) g.ellipse(cx, cy, rx, 3, 'd');
  // THE SPLIT METEORITE (centre): two rock shoulders, light between
  g.ellipse(52, 52, 13, 11, 'M'); g.ellipse(50, 49, 11, 9, 'M');
  g.ellipse(76, 52, 13, 11, 'M'); g.ellipse(78, 49, 11, 9, 'M');
  g.speckle({ from: ['M'], to: ['d'] }, [38, 40, 90, 62], 8, 277);
  // the stone's heart answering: a wedge of orange fire in the split
  g.tri(60, 38, 68, 38, 64, 58, 'E');
  g.tri(61.6, 42, 66.4, 42, 64, 55, 'Y');
  g.ellipse(64, 40, 6, 3, 'Y');
  // ---- XENOGENE unfolding out of the rock (centre, above the split) ----
  // tentacle limbs that cannot decide their shape:
  //  left — one reaching arm-like limb, ending almost in fingers
  g.line(54, 34, 42, 26, 'v', 1); g.line(54, 34, 44, 27, 'V');
  g.line(42, 26, 36, 27, 'V'); g.line(42, 26, 38, 22, 'V'); g.line(42, 26, 40, 30, 'V'); // undecided fingers
  //  right — one flat ribbon limb, still a banner of itself
  g.tri(74, 32, 92, 24, 90, 32, 'V'); g.tri(74, 34, 90, 32, 88, 37, 'v');
  //  low — two curled tentacles, mid-decision
  g.ring(50, 46, 4.4, 4.4, 'V', 0.3); g.ellipse(51.6, 44.6, 3.4, 3.4, 'D');
  g.ring(78, 46, 4.4, 4.4, 'v', 0.3); g.ellipse(79.6, 44.6, 3.4, 3.4, 'D');
  // body: a violet teardrop column rising out of the light
  g.ellipse(64, 32, 8, 11, 'V');
  g.ellipse(66, 34, 6.4, 9.4, 'v'); g.ellipse(63, 30, 6.4, 9.4, 'V');
  g.tri(58, 40, 70, 40, 64, 48, 'V'); // body rooting into the split's light
  // THE CORE HEART in its chest, answering the stone's
  g.ellipse(64, 31, 3.2, 3.8, 'E'); g.ellipse(64, 31, 2, 2.4, 'Y'); g.set(64, 30, 'W');
  g.ring(64, 31, 5.6, 6.4, 'E', 0.08);
  // head: long, smooth, a pale eye band that watches without blinking
  g.ellipse(64, 16, 5.4, 7.4, 'V'); g.ellipse(65.4, 17.4, 4.4, 6.2, 'v'); g.ellipse(63.4, 15, 4.4, 6.2, 'V');
  g.rect(60, 15, 68, 16, 'P'); g.rect(61, 15, 67, 15, 'W'); // the eye band
  g.tri(61, 9, 64, 4, 67, 9, 'V'); // the head's high point
  // shed rock dust + core sparks around the unfolding
  for (let i = 0; i < 18; i++) {
    const x = 36 + hash(i, 281) % 56, y = 14 + hash(i, 283) % 40;
    if (['K', 'D'].includes(g.get(x, y))) g.set(x, y, hash(i, 293) % 3 ? 'S' : 'E');
  }
  g.frame('O');
  return emit('panel-crater-xenogene', 'XENOGENE unfolding from the meteorite (ev_hoenn_deoxys)', [
    'panel-crater-xenogene 128x80. W10-B T3 cutscene panel: XENOGENE',
    'unfolding out of the crater meteorite at Comet Falls / Meteor',
    'Falls (ev_hoenn_deoxys). Original in-house art, generated',
    'deterministically by w10b-rig/gen-panels-t3.mjs. Brief = the',
    'species design record (violet alien, tentacle limbs, glowing core',
    'heart) + the event say text ("the stone\'s heart answers with',
    'light: a core of orange fire, unfolding out of the rock in limbs',
    'that cannot decide what shape honesty requires").',
  ], [
    ['O', '#0a0c12', 'frame outline'], ['K', '#161a22', 'crater deepest'], ['D', '#2c3442', 'crater rock'],
    ['d', '#4a5468', 'rock mid'], ['S', '#78849a', 'rock light'], ['M', '#8a5a2c', 'meteorite brown'],
    ['E', '#ff7a26', 'core glow'], ['Y', '#ffd84a', 'core heart'], ['V', '#8a5ab0', 'alien violet'],
    ['v', '#5e3a78', 'alien shade'], ['P', '#d8c8f0', 'alien pale'], ['W', '#f2ecfa', 'eye band'],
  ], g.grid);
}

const SCENES = {
  'panel-insight-loracle': sceneLoracle,
  'panel-gallant-volitar': sceneVolitar,
  'panel-candor-empathis': sceneEmpathis,
  'panel-crescent-lunacygn': sceneLunacygn,
  'panel-crater-magmarch': sceneMagmarch,
  'panel-temple-colossor': sceneColossor,
  'panel-paradise-grathog': sceneGrathog,
  'panel-keystone-centwisp': sceneCentwisp,
  'panel-inn-noctarch': sceneInnNoctarch,
  'panel-meteor-astraeon': sceneAstraeon,
  'panel-crater-xenogene': sceneXenogene,
};
const want = process.argv.slice(2);
for (const [id, fn] of Object.entries(SCENES)) if (!want.length || want.includes(id)) fn();
