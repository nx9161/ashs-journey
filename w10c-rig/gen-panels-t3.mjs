// gen-panels-t3.mjs — W10-C T3 FINALE + INTRO panel generators
// (deterministic). Authors the wave's last 2 panels (128x80, the W10
// panel canvas standard) as .pix sources under
// assets/sprites/pix/keyart/. Surface attach (T0 seams): finale-road
// is named by the FINALE_PANEL const in src/data/arcs.mjs and plays
// AFTER the finale credits say at all three credits sites;
// intro-partner is named by INTRO_SCRIPT.starterPanel and plays after
// the starterMoment say, before grantPartner(). Compositions are
// drawn ONLY from the shipped records (FINALE_CREDITS_OPEN /
// FINALE_END_CARD; the starterMoment lines + the partner species
// record — mint hamster, copper battery cap, cream belly, big ears).
// Original in-house art; same code -> byte-identical .pix.
// Run: node w10c-rig/gen-panels-t3.mjs [id ...]
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
// F8 finale-road — the finale homecoming's closing image (data:
// FINALE_PANEL in src/data/arcs.mjs; plays after the credits).
// Recorded content ONLY: FINALE_CREDITS_OPEN ("— THE LONG ROAD,
// REMEMBERED —") + FINALE_END_CARD ("Six journeys. Five leagues
// and a frontier. One road, walked whole." / "...ready, rested,
// and already lacing your shoes."). Composition: the standpoint
// is home (where the finale plays) — one pale road winds from the
// viewer's feet back through all six journeys in bands to a dawn
// horizon: Arden's home fields + the house in the near foreground,
// then the Amber shore, Yamato's tower ridge, the Frontier's arena
// isle, Maris' storm sea, and Borea's snow peaks under the sun.
// =====================================================================
function sceneFinaleRoad() {
  const g = canvas('S');
  g.rect(0, 6, W - 1, 13, 's'); // dawn band under the sun
  g.ellipse(64, 9, 6, 5, 'Y'); // the risen sun
  g.ring(64, 9, 10, 8, 'Y', 0.10);
  // --- Borea: snow peaks (y 14-25) ---
  g.rect(0, 23, W - 1, 25, 'W'); // the snowfield
  const peak = (cx, hgt, hw) => {
    g.tri(cx - hw, 24, cx + hw, 24, cx, 24 - hgt, 'P');
    const capH = Math.round(hgt * 0.4), capW = Math.round(hw * 0.4);
    g.tri(cx - capW, 24 - hgt + capH, cx + capW, 24 - hgt + capH, cx, 24 - hgt, 'W');
  };
  peak(8, 9, 10); peak(27, 12, 12); peak(46, 9, 10); peak(64, 13, 12); peak(84, 10, 11); peak(103, 12, 12); peak(121, 9, 10);
  // --- Maris: the arguing sea (y 26-35) ---
  g.rect(0, 26, W - 1, 35, 'B');
  g.speckle({ from: ['B'], to: ['b'] }, [0, 27, 127, 34], 17, 5); // whitecaps
  for (const rx of [4, 118]) for (let i = 0; i < 4; i++) g.line(rx + i * 3, 27, rx + i * 3 - 1, 31, 'b'); // rain at the edges
  // --- the Frontier: arena isle on a calm strip (y 36-43) ---
  g.rect(0, 36, W - 1, 39, 'b'); // calm water
  g.ellipse(40, 41, 31, 4, 'A'); // the island (left of the road)
  g.ellipse(40, 36, 9, 5, 'P'); // the great dome
  g.ring(40, 36, 9, 5, 'T', 0.14);
  g.set(40, 30, 'Y'); // the dome's beacon
  g.rect(52, 38, 58, 42, 'P'); // a flanking arena block
  g.line(52, 38, 58, 38, 'T');
  // --- Yamato: the tower ridge (y 44-51) ---
  g.rect(0, 46, W - 1, 51, 'g'); // the ridge
  const tower = (x, base, top) => {
    // three shrinking tiers + roof: a tower, not a house
    let wdt = 11;
    for (let y = base; y > top + 5; y -= 5) { g.rect(x - (wdt >> 1), y - 4, x + (wdt >> 1), y, 'T'); wdt -= 3; }
    g.tri(x - 6, top + 5, x + 6, top + 5, x, top, 'T'); // the tiered roof
    g.set(x, top - 1, 'T');
  };
  tower(24, 46, 29); tower(104, 46, 27);
  g.speckle({ from: ['g'], to: ['G'] }, [0, 47, 127, 51], 23, 2);
  // --- Amber Isles: the southern shore (y 52-58) ---
  g.rect(0, 52, W - 1, 58, 'A');
  const palm = (x) => {
    g.line(x, 57, x + 1, 51, 'g');
    g.line(x + 1, 51, x - 3, 49, 'g'); g.line(x + 1, 51, x + 5, 49, 'g'); g.line(x + 1, 51, x + 1, 53, 'g');
  };
  palm(14); palm(110);
  g.speckle({ from: ['A'], to: ['r'] }, [0, 53, 127, 58], 29, 7); // sand shade
  // --- Arden: home fields (y 59-79) ---
  g.rect(0, 59, W - 1, 79, 'G');
  g.speckle({ from: ['G'], to: ['g'] }, [0, 60, 127, 79], 19, 3);
  // --- the one road, walked whole: from the horizon to the viewer ---
  for (let y = 15; y < H; y++) {
    const cx = 64 + Math.round(9 * Math.sin((y - 15) * 0.11));
    const hw = 1 + Math.floor((y - 15) / 10);
    g.set(cx - hw - 1, y, 'r'); g.set(cx + hw + 1, y, 'r');
    for (let x = cx - hw; x <= cx + hw; x++) g.set(x, y, 'R');
  }
  // --- home: the house the road comes back to (lower left) ---
  g.rect(9, 65, 27, 77, 'F'); // walls
  g.tri(6, 65, 30, 65, 18, 57, 'T'); // the slate roof
  g.rect(23, 59, 25, 63, 'T'); // chimney
  g.rect(16, 70, 20, 77, 'T'); // the door
  g.rect(11, 68, 14, 71, 'Y'); g.rect(22, 68, 25, 71, 'Y'); // lit windows
  g.frame('O');
  return g.grid;
}

// =====================================================================
// E2 intro-partner — VOLTIK's first appearance (data:
// INTRO_SCRIPT.starterPanel in src/data/dialogue.mjs; plays after
// the starterMoment say, before grantPartner()). Recorded content
// ONLY: the starterMoment lines ("Go on — say hello. Careful
// now..." / "...It shocked you too! Ha! That means it likes you.
// Mostly." / "this one will never stay inside a Capture Orb. It
// walks beside you, or not at all.") + PARTNER_REFUSAL ("VOLTIK
// turned away!") + the partner species record (design: mint
// hamster, copper battery cap, cream belly, big ears; flavor: "A
// spirited partner who refused the easy path."). Composition:
// Hawthorn's lab (the intro scene's own recorded props — glass-
// dome machine, bottle cabinet, potted plant, floor boards) with
// VOLTIK front and centre, cheeks sparking from the shock, and
// the refused Capture Orb set down apart on the boards.
// =====================================================================
function sceneIntroPartner() {
  const g = canvas('L');
  g.rect(0, 48, W - 1, 50, 'b'); // baseboard
  g.rect(0, 51, W - 1, 79, 'F'); // floor boards
  for (const y of [59, 67, 75]) g.line(0, y, W - 1, y, 'f');
  g.line(30, 51, 30, 58, 'f'); g.line(88, 60, 88, 66, 'f'); g.line(52, 68, 52, 74, 'f'); // board joints
  // the glass-dome lab machine (left)
  g.rect(8, 44, 36, 50, 'b'); // its base
  g.ellipse(22, 32, 13, 12, 'G'); // the dome
  g.ring(22, 32, 13, 12, 'b', 0.10);
  g.ellipse(22, 37, 7, 5, 'm'); // something resting inside
  g.set(22, 29, 'Y'); // a charge spark, caught in the glass
  // the bottle cabinet (right)
  g.rect(98, 12, 126, 48, 'f');
  g.line(98, 24, 126, 24, 'b'); g.line(98, 36, 126, 36, 'b'); // shelves
  const bottle = (x, y, c) => { g.rect(x, y - 6, x + 3, y, c); g.set(x + 1, y - 7, c); };
  bottle(102, 23, 'G'); bottle(109, 23, 'm'); bottle(117, 23, 'r');
  bottle(103, 35, 'B'); bottle(112, 35, 'G'); bottle(120, 35, 'm');
  bottle(105, 47, 'r'); bottle(117, 47, 'B');
  // the potted plant (far left edge)
  g.rect(2, 44, 9, 50, 'B');
  g.line(5, 44, 1, 36, 'D'); g.line(5, 44, 5, 34, 'D'); g.line(5, 44, 10, 37, 'D');
  g.ellipse(1, 35, 2, 3, 'm'); g.ellipse(5, 33, 2, 3, 'm'); g.ellipse(10, 36, 2, 3, 'm');
  // VOLTIK's floor shadow
  g.ellipse(60, 74, 17, 2, 'f');
  // ---- VOLTIK (centre) ----
  g.ellipse(51, 71, 5, 2, 'D'); g.ellipse(69, 71, 5, 2, 'D'); // feet
  g.ellipse(60, 60, 14, 11, 'M'); // body
  g.ellipse(60, 63, 8, 6, 'C'); // cream belly
  g.line(73, 62, 79, 56, 'b'); g.line(79, 56, 76, 53, 'b'); g.set(80, 55, 'B'); // the tail, copper-tipped
  // big ears (behind the head)
  g.ellipse(51, 30, 3.6, 9, 'M', 0.25); g.ellipse(69, 30, 3.6, 9, 'M', -0.25);
  g.ellipse(51, 31, 1.8, 6, 'R', 0.25); g.ellipse(69, 31, 1.8, 6, 'R', -0.25);
  g.ellipse(60, 43, 11, 9, 'M'); // head
  g.ellipse(60, 37, 9, 4, 'B'); // the copper battery cap
  g.ellipse(60, 33, 2.4, 2, 'b'); g.set(60, 30, 'Y'); // cap terminal + its spark
  // the face: stubborn, mid-refusal
  g.line(54, 40, 57, 39, 'O'); g.line(66, 40, 63, 39, 'O'); // angled brows
  g.rect(55, 42, 56, 44, 'O'); g.rect(63, 42, 64, 44, 'O'); // eyes
  g.set(56, 42, 'W'); g.set(64, 42, 'W'); // glints
  g.set(60, 46, 'R'); // nose
  g.line(58, 49, 62, 49, 'O'); // the flat, unimpressed mouth
  g.ellipse(48, 47, 3, 2, 'R'); g.ellipse(72, 47, 3, 2, 'R'); // cheek pouches
  // the shock: spark crosses at the cheeks + flecks in the air
  const spark = (x, y) => {
    g.set(x, y, 'Y'); g.set(x - 2, y, 'Y'); g.set(x + 2, y, 'Y'); g.set(x, y - 2, 'Y'); g.set(x, y + 2, 'Y');
    g.set(x - 1, y - 1, 'Y'); g.set(x + 1, y + 1, 'Y');
  };
  spark(41, 44); spark(79, 44);
  for (const [fx, fy] of [[47, 26], [86, 30], [36, 56], [88, 58], [70, 22]]) g.set(fx, fy, 'Y');
  // the refused Capture Orb, set down apart on the boards (right)
  g.ellipse(101, 69, 8, 6, 'r'); // the red dome of it
  g.ellipse(101, 71, 8, 4, 'C'); // its pale base
  g.rect(93, 68, 109, 69, 'O'); // the band
  g.ellipse(101, 68, 2, 2, 'C'); g.set(101, 68, 'O'); // the button
  g.frame('O');
  return g.grid;
}

const SCENES = {
  'panel-finale-road': () => emit('panel-finale-road', 'The long road, remembered (finale)', [
    'panel-finale-road 128x80. W10-C T3 cutscene panel (Class F8',
    'finale): named by the FINALE_PANEL const in src/data/arcs.mjs,',
    'played by the T0 afterCredits seam after the full finale',
    'credits at all three credits sites — the game\'s closing',
    'image. Original in-house art, generated deterministically by',
    'w10c-rig/gen-panels-t3.mjs. Brief = the shipped finale record',
    'ONLY: FINALE_CREDITS_OPEN ("— THE LONG ROAD, REMEMBERED —")',
    '+ FINALE_END_CARD ("Six journeys. Five leagues and a',
    'frontier. One road, walked whole." / "...ready, rested, and',
    'already lacing your shoes."). The standpoint is home, where',
    'the finale plays: one pale road winds from the viewer back',
    'through the six journeys in bands — Arden fields + the house,',
    'the Amber shore, Yamato\'s towers, the Frontier\'s arena isle,',
    'Maris\' storm sea, Borea\'s snow peaks — to a dawn horizon.',
  ], [
    ['O', '#1c1410', 'outline'], ['S', '#f7e3ac', 'dawn sky'], ['s', '#f2c063', 'dawn band'],
    ['Y', '#ffd76a', 'sun gold'], ['W', '#f4f8fc', 'snow'], ['P', '#6e8299', 'peak rock'],
    ['B', '#2e5a7d', 'sea deep'], ['b', '#7fa8bf', 'sea light'], ['A', '#e8cf9a', 'sand'],
    ['G', '#7fae5a', 'field light'], ['g', '#4a7d3a', 'field dark'], ['R', '#efe3c2', 'road'],
    ['r', '#c9b083', 'road shade'], ['F', '#7a4a2e', 'house wood'], ['T', '#2e3a46', 'tower dark'],
  ], sceneFinaleRoad()),
  'panel-intro-partner': () => emit('panel-intro-partner', 'VOLTIK, who walks beside you (intro)', [
    'panel-intro-partner 128x80. W10-C T3 cutscene panel (Class',
    'E2 intro): named by INTRO_SCRIPT.starterPanel in src/data/',
    'dialogue.mjs, played by the T0 intro seam after the',
    'starterMoment say, before grantPartner() — VOLTIK\'s first',
    'appearance, the intro\'s one visual gap (E1, the professor,',
    'is already served by IntroScene\'s portrait and stays',
    'panel-less). Original in-house art, generated',
    'deterministically by w10c-rig/gen-panels-t3.mjs. Brief =',
    'the starterMoment lines + PARTNER_REFUSAL + the partner',
    'species record ONLY: a mint hamster with a copper battery',
    'cap, cream belly and big ears, cheeks sparking from the',
    'shock, in Hawthorn\'s lab (dome machine, bottle cabinet,',
    'plant, floor boards — the intro scene\'s recorded props);',
    'the refused Capture Orb sits apart on the boards.',
  ], [
    ['O', '#2a1800', 'outline'], ['L', '#e9dcbc', 'lab wall'], ['F', '#a8724a', 'floor light'],
    ['f', '#7a4a2e', 'floor dark'], ['M', '#b1d8ba', 'mint light'], ['m', '#8dcaaa', 'mint'],
    ['D', '#548571', 'mint deep'], ['C', '#feefce', 'cream'], ['B', '#bf6b41', 'copper'],
    ['b', '#694635', 'copper dark'], ['R', '#e88a9a', 'pink'], ['Y', '#f2c230', 'spark gold'],
    ['G', '#cfe4ea', 'glass'], ['r', '#c4503c', 'orb red'], ['W', '#ffffff', 'glint'],
  ], sceneIntroPartner()),
};

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(SCENES);
for (const id of ids) {
  if (!SCENES[id]) { console.error('gen-panels-t3: unknown panel ' + id); process.exit(1); }
  SCENES[id]();
}
console.log('gen-panels-t3: done');
