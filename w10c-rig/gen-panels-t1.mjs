// gen-panels-t1.mjs — W10-C T1 EMBARK panel generators (deterministic).
// Authors the 5 crossing panels (128x80, the W10 panel canvas standard)
// as .pix sources under assets/sprites/pix/keyart/. Class H surface
// attach: each panel is chained by the T0 ferry seam AFTER its arc's
// recorded enRouteLines card, before landFerry() — so each composition
// is drawn ONLY from that arc record's own two lines + the recorded
// destination (arrival map / region). NO-SAME-KIT: five crossings,
// five weathers, five viewpoints (stern / bow / side / bow-quarter /
// bow-close) — no shared base scene. Original in-house art; same code
// -> byte-identical .pix. Run: node w10c-rig/gen-panels-t1.mjs [id ...]
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
  console.log(`gen-panels-t1: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// H1 crossing-orange — Arcport ⇄ Marisol (arc 'orange').
// Recorded lines: "— days at sea —" / "The water turns the colour of
// warm glass. Somewhere ahead: Marisol Island, and a ball that will
// not open." Viewpoint: the ferry's own stern deck — low amber sun,
// glass-calm teal water, the island ahead under palm crowns.
// =====================================================================
function sceneOrange() {
  const g = canvas('S');
  g.rect(0, 14, W - 1, 25, 's'); // pale band toward the horizon
  g.speckle({ from: ['S'], to: ['s'] }, [0, 1, 127, 13], 37, 3); // thin high cloud
  g.ellipse(34, 18, 7, 7, 'U'); // the low sun
  g.ring(34, 18, 10, 10, 'Y', 0.1);
  // the warm-glass sea
  for (let y = 26; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 40 ? 'W' : y < 58 ? 'w' : 'D');
  g.speckle({ from: ['W'], to: ['U', 'Y'] }, [24, 27, 44, 44], 6, 8); // the sun's road on the glass
  g.speckle({ from: ['w', 'D'], to: ['W'] }, [0, 41, 127, 79], 41, 5); // calm flecks, sparse
  // Marisol ahead: a low green island, right of centre
  g.ellipse(93, 28, 21, 5, 'i');
  g.ellipse(91, 26, 14, 4, 'I');
  for (const px of [82, 92, 102]) { // palm crowns on the shore
    g.line(px, 25, px + 1, 17, 'P');
    g.line(px + 1, 17, px - 4, 14, 'P'); g.line(px + 1, 17, px + 6, 14, 'P');
    g.line(px + 1, 17, px - 2, 19, 'P'); g.line(px + 1, 17, px + 5, 19, 'P');
    g.set(px + 1, 16, 'P');
  }
  // the ferry's stern: deck, rail and mast in the near foreground
  g.rect(0, 67, W - 1, 79, 'F');
  for (const y of [71, 75]) g.line(0, y, W - 1, y, 'O'); // deck planks
  g.rect(0, 63, W - 1, 64, 'f'); // the stern rail
  for (let x = 4; x < W; x += 10) g.rect(x, 64, x + 1, 67, 'f'); // rail posts
  g.rect(18, 42, 20, 63, 'f'); // the mast
  g.tri(20, 46, 46, 54, 20, 54, 'R'); // the awning, rigged off the mast
  g.line(20, 46, 46, 54, 'O');
  g.set(19, 40, 'Y'); g.set(18, 41, 'Y'); g.set(20, 41, 'Y'); // the stern lantern
  g.line(19, 42, 19, 42, 'O');
  // the wake, spreading behind the stern
  g.speckle({ from: ['D'], to: ['W', 'U'] }, [48, 60, 80, 66], 5, 12);
  g.frame('O');
  return g.grid;
}

// =====================================================================
// H2 crossing-johto — Dawnwick/Arcport ⇄ Galefield/Beacon (arc
// 'johto'). Recorded lines: "— days at sea —" / "Gulls first, then a
// coastline of old towers. Yamato." Viewpoint: the bow, cutting
// toward a towered shore under a cool morning sky full of gulls.
// =====================================================================
function sceneJohto() {
  const g = canvas('S');
  g.rect(0, 26, W - 1, 37, 's');
  g.speckle({ from: ['S', 's'], to: ['C'] }, [0, 1, 127, 36], 29, 4); // morning cloud
  // gulls first: scattered over the whole sky
  const gull = (x, y, s) => {
    g.line(x - s, y - 1, x, y, 'G'); g.line(x, y, x + s, y - 1, 'G');
    g.set(x, y + 1, 'g');
  };
  for (const [x, y, s] of [[14, 8, 4], [30, 15, 3], [48, 6, 5], [66, 12, 3], [84, 5, 4], [102, 13, 5], [116, 7, 3], [40, 22, 3], [96, 24, 3], [58, 19, 2]]) gull(x, y, s);
  // the coastline of old towers
  g.rect(0, 38, W - 1, 44, 'L');
  const tower = (x, hgt) => {
    let wdt = 10;
    for (let y = 38; y > 38 - hgt; y -= 5) { g.rect(x - (wdt >> 1), y - 4, x + (wdt >> 1), y, 'T'); wdt -= 2; }
    g.tri(x - 6, 38 - hgt - 1, x + 6, 38 - hgt - 1, x, 38 - hgt - 6, 't'); // the tiered roof
    g.set(x, 38 - hgt - 7, 't');
  };
  tower(14, 15); tower(46, 21); tower(80, 17); tower(110, 23);
  g.speckle({ from: ['L'], to: ['t'] }, [0, 38, 127, 44], 17, 9);
  // the sea
  for (let y = 45; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 56 ? 'W' : y < 68 ? 'w' : 'D');
  g.speckle({ from: ['W', 'w'], to: ['C', 's'] }, [0, 45, 127, 70], 31, 6);
  // the bow, cutting in from the bottom centre
  g.tri(44, 79, 84, 79, 64, 57, 'F');
  g.line(44, 79, 64, 57, 'O'); g.line(84, 79, 64, 57, 'O');
  g.rect(52, 71, 76, 73, 'f'); // foredeck
  g.rect(63, 43, 65, 58, 'f'); // the foremast
  g.tri(65, 43, 74, 47, 65, 50, 'R'); // the pennant
  g.line(56, 66, 46, 79, 'C'); g.line(72, 66, 82, 79, 'C'); // the bow wave
  g.speckle({ from: ['D'], to: ['C'] }, [40, 70, 88, 79], 7, 2);
  g.frame('O');
  return g.grid;
}

// =====================================================================
// H3 crossing-hoenn — Arcport ⇄ Fairhaven/Rootlet (arc 'hoenn').
// Recorded lines: "— days at sea —" / "The rain arrives before the
// land does. Maris, arguing with its own ocean." Viewpoint: the
// ferry in profile, pitching on a chopped sea; rain over everything;
// the green shore only a rumour behind the veil.
// =====================================================================
function sceneHoenn() {
  const g = canvas('K');
  g.rect(0, 20, W - 1, 30, 'V'); // the rain veil band
  // the shore, barely there behind the rain
  g.rect(0, 29, W - 1, 34, 's');
  g.speckle({ from: ['s'], to: ['S'] }, [0, 29, 127, 34], 9, 3);
  g.speckle({ from: ['s', 'S'], to: ['V'] }, [0, 28, 127, 35], 3, 7); // veiled over
  // the arguing ocean
  for (let y = 35; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 48 ? 'w' : y < 63 ? 'B' : 'b');
  g.speckle({ from: ['w', 'B', 'b'], to: ['W'] }, [0, 36, 127, 79], 11, 5); // whitecaps, heavy
  for (const [cx, cy] of [[14, 44], [52, 52], [96, 42], [70, 68], [26, 70]]) g.line(cx, cy, cx + 9, cy, 'W'); // crest strokes
  // the ferry in profile, riding a crest amidships
  g.ellipse(62, 61, 30, 4, 'W'); // foam at the waterline
  g.rect(36, 54, 84, 60, 'F'); // hull
  g.tri(84, 54, 93, 60, 84, 60, 'F'); // bow
  g.tri(36, 54, 30, 60, 36, 60, 'f'); // stern
  g.line(36, 54, 93, 54, 'O');
  g.rect(50, 45, 72, 54, 'f'); // cabin
  for (const wx of [54, 60, 66]) g.set(wx, 49, 'Y'); // lit windows
  g.rect(76, 42, 80, 54, 'R'); // funnel
  g.rect(76, 40, 80, 42, 'O'); // funnel cap
  g.line(44, 45, 44, 54, 'O'); // foremast
  g.speckle({ from: ['W'], to: ['w'] }, [86, 57, 96, 63], 3, 1); // bow spray
  // the rain, over everything, last
  for (let i = 0; i < 210; i++) {
    const x = hash(i, 31) % 124 + 2, y = hash(17, i) % 74 + 2;
    g.line(x, y, x - 2, y + 5, hash(i, 7) % 4 === 0 ? 'W' : 'v');
  }
  g.frame('O');
  return g.grid;
}

// =====================================================================
// H4 crossing-frontier — ⇄ Trial Grounds hub (arc 'frontier').
// Recorded lines: "— a short crossing —" / "An island of arenas
// rises out of the haze. The Frontier." Viewpoint: from the port
// quarter — the ferry small in the near foreground, the arena
// island dead ahead in layered haze.
// =====================================================================
function sceneFrontier() {
  const g = canvas('H');
  g.rect(0, 16, W - 1, 21, 'M'); // a haze band
  g.rect(0, 30, W - 1, 34, 'h'); // a lower, denser band
  g.ellipse(102, 9, 9, 5, 'M'); // the sun, a rumour in the haze
  g.speckle({ from: ['H'], to: ['M'] }, [0, 1, 127, 29], 23, 4);
  // the island of arenas, rising out of the haze
  g.ellipse(64, 48, 32, 5, 'a'); // the island's base
  g.rect(70, 35, 95, 47, 'A'); // the colosseum block
  g.rect(70, 33, 95, 35, 'a'); // its rim
  for (const ax of [74, 80, 86, 91]) { g.set(ax, 40, 'a'); g.set(ax, 44, 'a'); } // arch mouths
  g.ellipse(50, 40, 13, 10, 'D'); // the great dome
  g.ring(50, 40, 13, 10, 'd', 0.14);
  g.set(50, 29, 'Y'); // the dome's beacon
  g.rect(33, 37, 39, 47, 'd'); // a flanking tower
  g.tri(32, 37, 40, 37, 36, 33, 'd');
  g.speckle({ from: ['A', 'D', 'a', 'd'], to: ['h', 'M'] }, [28, 28, 100, 48], 8, 6); // haze eating the island
  // the calm water of a short crossing
  for (let y = 49; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 62 ? 'W' : 'w');
  g.rect(0, 51, W - 1, 54, 'M'); // mist lying on the water
  g.speckle({ from: ['W', 'w'], to: ['M'] }, [0, 55, 127, 79], 29, 8);
  // the ferry, small in the near foreground, port quarter view
  g.rect(10, 64, 42, 69, 'F'); // hull
  g.tri(42, 64, 48, 69, 42, 69, 'F'); // bow
  g.rect(18, 58, 32, 64, 'f'); // cabin
  g.set(22, 61, 'Y'); g.set(27, 61, 'Y'); // windows
  g.line(36, 56, 36, 64, 'O'); // mast
  g.tri(36, 56, 43, 58, 36, 60, 'R'); // the flag
  g.line(4, 71, 10, 69, 'M'); g.line(2, 74, 10, 71, 'M'); // the short wake
  g.frame('O');
  return g.grid;
}

// =====================================================================
// H5 crossing-sinnoh — Arcport ⇄ Bridgeport/Shingle (arc 'sinnoh').
// Recorded lines: "— days at sea —" / "The air sharpens mile by
// mile. Ahead: snow on the peaks, and Borea." Viewpoint: close on
// the bow, the peak range dead ahead under a hard, clear sky; the
// first ice flecks in the water.
// =====================================================================
function sceneSinnoh() {
  const g = canvas('S');
  g.rect(0, 12, W - 1, 23, 's');
  g.rect(0, 24, W - 1, 35, 'C'); // hard clear air, banded cold
  g.ellipse(108, 8, 5, 5, 'W'); // the pale winter sun, high and small
  // the peaks of Borea, dead ahead
  const peak = (cx, hgt, hw) => {
    g.tri(cx - hw, 37, cx + hw, 37, cx, 37 - hgt, 'P');
    g.tri(cx - hw, 37, cx, 37, cx, 37 - hgt, 'p'); // the shaded face
    const capH = Math.round(hgt * 0.38), capW = Math.round(hw * 0.38);
    g.tri(cx - capW, 37 - hgt + capH, cx + capW, 37 - hgt + capH, cx, 37 - hgt, 'W'); // the snow cap
    g.set(cx - 2, 37 - hgt + capH + 2, 'W'); g.set(cx + 3, 37 - hgt + capH + 3, 'w'); // snow tongues
  };
  peak(10, 19, 13); peak(32, 27, 16); peak(56, 22, 14); peak(78, 30, 17); peak(102, 24, 15); peak(121, 18, 12);
  g.rect(0, 36, W - 1, 37, 'w'); // the snowline shore
  // the cold sea
  for (let y = 38; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 54 ? 'B' : 'b');
  g.speckle({ from: ['B', 'b'], to: ['I'] }, [0, 40, 127, 60], 47, 3); // first ice, sparse
  g.speckle({ from: ['b'], to: ['I'] }, [0, 61, 40, 79], 13, 9); // ice gathering at the cold edges
  g.speckle({ from: ['b'], to: ['I'] }, [88, 61, 127, 79], 13, 4);
  // the bow, close in the near foreground
  g.tri(82, 79, 127, 79, 101, 55, 'F');
  g.line(82, 79, 101, 55, 'O'); g.line(127, 79, 101, 55, 'O');
  g.rect(94, 62, 112, 66, 'f'); // foredeck housing
  g.set(99, 64, 'Y'); g.set(105, 64, 'Y'); // windows
  g.rect(115, 47, 119, 58, 'R'); // the funnel, aft of the bow
  g.rect(115, 45, 119, 47, 'O');
  g.line(92, 68, 84, 79, 'I'); // the bow wave, already rimed
  g.frame('O');
  return g.grid;
}

const SCENES = {
  'panel-crossing-orange': () => emit('panel-crossing-orange', 'The Amber crossing', [
    'panel-crossing-orange 128x80. W10-C T1 cutscene panel (Class H',
    'embark): arc \'orange\', the Arcport ⇄ Marisol ferry crossing,',
    'attached by the arc record\'s enRoutePanel field — it plays',
    'after the recorded en-route card, before landFerry(). Original',
    'in-house art, generated deterministically by w10c-rig/',
    'gen-panels-t1.mjs. Brief = the arc\'s recorded enRouteLines',
    'ONLY: "The water turns the colour of warm glass. Somewhere',
    'ahead: Marisol Island, and a ball that will not open." Seen',
    'from the ferry\'s stern: warm-glass water, a low sun, the',
    'island ahead under palms. No landmark the record does not',
    'name; the ball is not drawn — the text keeps it shut.',
  ], [
    ['O', '#201408', 'outline'], ['S', '#f2c063', 'amber sky'], ['s', '#f7e3ac', 'sky pale'],
    ['U', '#fdf3d0', 'sun'], ['Y', '#ffd76a', 'lantern gold'], ['W', '#7fc4b5', 'glass water light'],
    ['w', '#4da695', 'glass water mid'], ['D', '#2e7d74', 'glass water deep'], ['I', '#3e7d46', 'island green'],
    ['i', '#2a5a32', 'island dark'], ['P', '#1f4630', 'palm dark'], ['F', '#7a4a2e', 'deck wood'],
    ['f', '#a8724a', 'deck light'], ['R', '#c4503c', 'awning red'],
  ], sceneOrange()),
  'panel-crossing-johto': () => emit('panel-crossing-johto', 'The Yamato crossing', [
    'panel-crossing-johto 128x80. W10-C T1 cutscene panel (Class H',
    'embark): arc \'johto\', the Dawnwick/Arcport ⇄ Galefield/Beacon',
    'ferry crossing, attached by the arc record\'s enRoutePanel',
    'field — after the recorded en-route card, before landFerry().',
    'Original in-house art, generated deterministically by',
    'w10c-rig/gen-panels-t1.mjs. Brief = the arc\'s recorded',
    'enRouteLines ONLY: "Gulls first, then a coastline of old',
    'towers. Yamato." Seen from the bow: gulls over a cool morning',
    'sea, a shore of tiered old towers ahead.',
  ], [
    ['O', '#141c24', 'outline'], ['S', '#b8ccd8', 'morning sky'], ['s', '#dcebf2', 'sky pale'],
    ['C', '#eef6fa', 'cloud white'], ['G', '#5a6672', 'gull grey'], ['g', '#39424c', 'gull dark'],
    ['W', '#7fa8bf', 'sea light'], ['w', '#557f9c', 'sea mid'], ['D', '#38607e', 'sea deep'],
    ['T', '#2e3a46', 'tower dark'], ['t', '#4a5a68', 'tower mid'], ['L', '#8aa5a0', 'shore'],
    ['F', '#6b4a35', 'hull'], ['f', '#97795a', 'deck'], ['R', '#9c4a3a', 'pennant'],
  ], sceneJohto()),
  'panel-crossing-hoenn': () => emit('panel-crossing-hoenn', 'The Maris crossing', [
    'panel-crossing-hoenn 128x80. W10-C T1 cutscene panel (Class H',
    'embark): arc \'hoenn\', the Arcport ⇄ Fairhaven/Rootlet ferry',
    'crossing, attached by the arc record\'s enRoutePanel field —',
    'after the recorded en-route card, before landFerry().',
    'Original in-house art, generated deterministically by',
    'w10c-rig/gen-panels-t1.mjs. Brief = the arc\'s recorded',
    'enRouteLines ONLY: "The rain arrives before the land does.',
    'Maris, arguing with its own ocean." The ferry in profile on a',
    'chopped, whitecapped sea; the green shore veiled by rain.',
  ], [
    ['O', '#10161c', 'outline'], ['K', '#232c34', 'storm sky'], ['V', '#46545f', 'rain veil'],
    ['v', '#5d7180', 'rain light'], ['S', '#3f6b4a', 'shore green'], ['s', '#33573d', 'shore dim'],
    ['W', '#dfe9ec', 'whitecap'], ['w', '#5d7f8c', 'sea light'], ['B', '#3d5a6b', 'sea mid'],
    ['b', '#2a4252', 'sea deep'], ['F', '#54382a', 'hull'], ['f', '#77563c', 'cabin'],
    ['Y', '#e8c85a', 'window gold'], ['R', '#a03a30', 'funnel red'],
  ], sceneHoenn()),
  'panel-crossing-frontier': () => emit('panel-crossing-frontier', 'The Frontier crossing', [
    'panel-crossing-frontier 128x80. W10-C T1 cutscene panel',
    '(Class H embark): arc \'frontier\', the short crossing to the',
    'Trial Grounds hub, attached by the arc record\'s enRoutePanel',
    'field — after the recorded en-route card, before landFerry().',
    'Original in-house art, generated deterministically by',
    'w10c-rig/gen-panels-t1.mjs. Brief = the arc\'s recorded',
    'enRouteLines ONLY: "— a short crossing —" / "An island of',
    'arenas rises out of the haze. The Frontier." The ferry small',
    'in the near foreground; dome and colosseum in layered haze.',
  ], [
    ['O', '#1c1a14', 'outline'], ['H', '#e8e4da', 'haze pale'], ['h', '#cfd4cc', 'haze mid'],
    ['M', '#f4f1e8', 'mist'], ['W', '#b9cdc9', 'water pale'], ['w', '#93b3ae', 'water mid'],
    ['D', '#7a6a8c', 'dome'], ['d', '#5d5170', 'dome dark'], ['A', '#8c8578', 'arena stone'],
    ['a', '#6e675c', 'stone dark'], ['F', '#6e4f38', 'hull'], ['f', '#99805e', 'cabin'],
    ['R', '#b84a5a', 'flag'], ['Y', '#e8c85a', 'beacon gold'],
  ], sceneFrontier()),
  'panel-crossing-sinnoh': () => emit('panel-crossing-sinnoh', 'The Borea crossing', [
    'panel-crossing-sinnoh 128x80. W10-C T1 cutscene panel (Class',
    'H embark): arc \'sinnoh\', the Arcport ⇄ Bridgeport/Shingle',
    'ferry crossing, attached by the arc record\'s enRoutePanel',
    'field — after the recorded en-route card, before landFerry().',
    'Original in-house art, generated deterministically by',
    'w10c-rig/gen-panels-t1.mjs. Brief = the arc\'s recorded',
    'enRouteLines ONLY: "The air sharpens mile by mile. Ahead:',
    'snow on the peaks, and Borea." Close on the bow; the snow-',
    'capped range dead ahead; the first ice in a cold sea.',
  ], [
    ['O', '#0e1620', 'outline'], ['S', '#7fa8cf', 'cold sky'], ['s', '#a9c6e2', 'sky mid'],
    ['C', '#dcebf7', 'sky pale'], ['W', '#f4f8fc', 'snow'], ['w', '#b9c9d9', 'peak light'],
    ['P', '#6e8299', 'peak rock'], ['p', '#4c6076', 'rock dark'], ['B', '#2e5a7d', 'sea'],
    ['b', '#1f4260', 'sea deep'], ['I', '#cfe2ee', 'ice'], ['F', '#5d4030', 'hull'],
    ['f', '#86644a', 'cabin'], ['Y', '#ffd76a', 'window gold'], ['R', '#9c3a30', 'funnel red'],
  ], sceneSinnoh()),
};

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(SCENES);
for (const id of ids) {
  if (!SCENES[id]) { console.error('gen-panels-t1: unknown panel ' + id); process.exit(1); }
  SCENES[id]();
}
console.log('gen-panels-t1: done');
