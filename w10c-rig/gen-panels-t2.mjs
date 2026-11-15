// gen-panels-t2.mjs — W10-C T2 endings panel generators (deterministic).
// Authors the 7 T2 panels (128x80, the W10 panel canvas standard) as
// .pix sources under assets/sprites/pix/keyart/: the six ARC COMPLETE
// card panels (Class F2–F7 of the W10-C plan) + the champion-chamber
// seal panel (F1). Each composition is drawn ONLY from its moment's
// recorded data: the arc's own summaryLines (src/data/arcs.mjs) for
// the cards; the HALL_OF_FAME record + Vale's closing say
// (ev_champion, src/data/story-kanto.mjs) for the chamber. Badge /
// Symbol counts in the compositions are the arcs' recorded badge
// totals (8 / 4 / 8 / 8 / 7 / 8). Original compositions — battle art
// is reference only; no battle frame is traced, enlarged, or reused
// (Director ruling 4). Same code -> byte-identical .pix.
// Run: node w10c-rig/gen-panels-t2.mjs [panel-id ...]
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
    diamond(cx, cy, c, core) {
      api.set(cx, cy - 2, c); api.set(cx - 1, cy - 1, c); api.set(cx, cy - 1, c); api.set(cx + 1, cy - 1, c);
      api.set(cx - 2, cy, c); api.set(cx - 1, cy, core || c); api.set(cx, cy, core || c); api.set(cx + 1, cy, core || c); api.set(cx + 2, cy, c);
      api.set(cx - 1, cy + 1, c); api.set(cx, cy + 1, c); api.set(cx + 1, cy + 1, c); api.set(cx, cy + 2, c);
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
  console.log(`gen-panels-t2: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// 1. CARD-KANTO — the ARC COMPLETE card for arc `kanto` (Class F).
// summaryLines: "Crown League — CHAMPION." / "Eight badges, one storm
// over Exile Isle, and a final against the rival who started it all.
// The Plateau wrote your team into its light."
// Composition: dusk over the Plateau — a broad mesa right of centre,
// a pillar of light rising from its top (the Hall of Fame light the
// team was written into); at the left horizon the Exile Isle storm:
// a dark bank with slant rain over a small island. Eight badge
// glints along the foreground ledge = the recorded eight badges.
// =====================================================================
function sceneCardKanto() {
  const g = canvas('N');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 16 ? 'N' : y < 30 ? 'V' : y < 42 ? 'R' : 'A');
  g.speckle({ from: ['N', 'V'], to: ['W'] }, [0, 1, 127, 24], 37, 3); // early stars
  // the Exile Isle storm bank, left
  g.ellipse(20, 30, 24, 9, 'G'); g.ellipse(30, 26, 18, 8, 'G'); g.ellipse(12, 27, 12, 6, 'g');
  for (let i = 0; i < 26; i++) { // slant rain under the bank
    const x = 2 + (hash(i, 7) % 38), y = 38 + (hash(i, 11) % 10);
    g.set(x, y, 'b'); g.set(x - 1, y + 2, 'b');
  }
  g.tri(2, 52, 34, 52, 26, 44, 'K'); g.tri(8, 52, 30, 52, 20, 47, 'K'); // Exile Isle silhouette
  // sea / lowland band
  g.rect(0, 52, W - 1, 57, 's');
  g.speckle({ from: ['s'], to: ['b'] }, [0, 52, 127, 57], 13, 5);
  // the Plateau: broad flat-topped mesa
  g.tri(52, 58, 78, 40, 82, 58, 'S'); g.tri(118, 58, 96, 40, 82, 58, 'S');
  g.rect(78, 40, 96, 58, 'S'); g.rect(78, 40, 96, 43, 'L'); // sun-caught top rim
  g.rect(84, 46, 87, 58, 's'); g.rect(92, 50, 94, 58, 's'); // strata shadow
  // the pillar of light from the plateau top
  for (let y = 4; y < 40; y++) { const wdt = 2 + Math.floor((40 - y) / 14); for (let x = 87 - wdt; x <= 87 + wdt; x++) g.set(x, y, 'L'); }
  for (let y = 8; y < 40; y++) { g.set(87, y, 'W'); g.set(88, y, 'W'); }
  g.ellipse(87, 40, 9, 2, 'W');
  // foreground ledge + the eight badge glints
  g.rect(0, 58, W - 1, 79, 'K');
  g.speckle({ from: ['K'], to: ['s'] }, [0, 60, 127, 78], 29, 8);
  for (let i = 0; i < 8; i++) g.diamond(14 + i * 14, 68, 'A', 'W');
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 2. CARD-ORANGE — the ARC COMPLETE card for arc `orange` (Class F).
// summaryLines: "Amber League — WINNER." / "Four island badges and a
// champion's battle under southern stars. The Winner's Trophy is
// yours — and so is the strange ball that started the voyage."
// Composition: a tropical night shore. Southern stars burn low over
// a warm-glass sea (the crossing's own words); two island silhou-
// ettes on the horizon, palms on the nearer. On the sand spit in
// the foreground: the Winner's Trophy on its plinth (four badge
// glints on the plinth front = the recorded four island badges) and,
// apart at the right, the Sealed Orb — the strange ball that started
// the voyage — seam-banded, unopened, catching the starlight.
// =====================================================================
function sceneCardOrange() {
  const g = canvas('N');
  for (let y = 0; y < 44; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 20 ? 'N' : 'T');
  g.speckle({ from: ['N', 'T'], to: ['W', 'A'] }, [0, 1, 127, 40], 67, 4); // southern stars
  g.speckle({ from: ['N', 'T'], to: ['W'] }, [0, 30, 127, 43], 29, 6); // brighter low band
  // the southern cross, low and bright
  for (const [x, y] of [[100, 30], [104, 35], [97, 38], [107, 27], [101, 33]]) { g.set(x, y, 'W'); g.set(x + 1, y, 'W'); }
  // horizon islands
  g.ellipse(18, 45, 16, 3, 'K'); g.ellipse(112, 45, 12, 2, 'K');
  g.line(112, 43, 112, 36, 'K'); g.line(112, 36, 107, 33, 'K'); g.line(112, 36, 117, 33, 'K'); g.line(112, 36, 112, 31, 'K'); // palm
  // the warm-glass sea
  for (let y = 46; y < 62; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 53 ? 'S' : 's');
  for (let i = 0; i < 22; i++) { const x = 44 + (hash(i, 3) % 40), y = 47 + (hash(i, 9) % 13); g.set(x, y, 'A'); g.set(x + 1, y, 'A'); } // shimmer path
  // sand spit foreground
  g.ellipse(64, 74, 66, 10, 'D'); g.ellipse(64, 71, 60, 8, 'd');
  // the Winner's Trophy on its plinth, left of centre
  g.rect(30, 62, 44, 64, 'K'); g.rect(31, 56, 43, 62, 'K');
  g.rect(33, 46, 41, 56, 'G'); g.tri(33, 46, 41, 46, 37, 51, 'G');
  g.line(33, 48, 28, 45, 'G'); g.line(28, 45, 28, 50, 'G'); g.line(28, 50, 33, 52, 'G'); // west handle
  g.line(41, 48, 46, 45, 'G'); g.line(46, 45, 46, 50, 'G'); g.line(46, 50, 41, 52, 'G'); // east handle
  g.set(37, 44, 'A'); g.set(36, 45, 'A'); g.set(38, 45, 'A'); // rim light
  for (let i = 0; i < 4; i++) g.diamond(33 + i * 3 + (i > 1 ? 1 : 0), 60, 'A', 'W'); // four badge glints on the plinth
  // the Sealed Orb, apart at the right — seam-banded, unopened
  g.ellipse(94, 64, 9, 8, 'R'); g.ellipse(91, 61, 4, 3, 'A'); // starlit shoulder
  g.rect(85, 63, 103, 65, 'K'); g.set(94, 64, 'G'); g.set(93, 64, 'G'); g.set(95, 64, 'G'); // the seam + its unbroken clasp
  g.ellipse(94, 73, 10, 2, 'K'); // its shadow on the sand
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 3. CARD-JOHTO — the ARC COMPLETE card for arc `johto` (Class F).
// summaryLines: "Lastlight Conference — HONOURS." / "Eight badges,
// the beasts woken and quieted, and the rivalry settled at last in
// the conference fire. The road home feels shorter than the road
// out."
// Composition: dusk in Yamato. Two old towers stand quiet — a tall
// tiered tower west, a shorter fire-gutted tower east (the beasts
// woken there are quieted now: no figures, no eyes, calm roofs).
// Between them in the foreground plaza burns the conference fire in
// a great stone brazier; embers rise and thin. Eight badge glints
// are set along the brazier's stone base = the recorded eight.
// =====================================================================
function sceneCardJohto() {
  const g = canvas('P');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 22 ? 'P' : y < 40 ? 'D' : 'E');
  g.speckle({ from: ['P'], to: ['W'] }, [0, 1, 127, 14], 41, 2);
  // the tall tiered tower, west — quiet
  g.rect(16, 34, 30, 62, 'T');
  for (const [ty, tw] of [[32, 12], [24, 10], [16, 8]]) { g.tri(23 - tw, ty + 4, 23 + tw, ty + 4, 23, ty, 't'); g.rect(23 - tw + 2, ty + 4, 23 + tw - 2, ty + 5, 'T'); }
  g.set(23, 12, 't'); g.rect(21, 44, 25, 48, 'D'); // one lit window, low
  // the gutted tower, east — shorter, charred crown, quiet
  g.rect(96, 42, 108, 62, 'T');
  g.tri(94, 44, 110, 44, 102, 36, 'K'); g.set(100, 39, 'K'); g.set(105, 41, 'K'); // broken crown
  g.rect(100, 50, 104, 55, 'K'); // the old scorch hollow, cold now
  // plaza ground + the fire's light pool
  g.rect(0, 62, W - 1, 79, 'g');
  g.ellipse(64, 71, 24, 5, 'E');
  // the conference brazier: stone bowl on a stepped base
  g.rect(48, 66, 80, 68, 'S'); g.rect(52, 68, 76, 72, 'S'); g.rect(56, 72, 72, 75, 'S');
  g.ellipse(64, 65, 17, 4, 'K'); g.ellipse(64, 64, 15, 3, 'R');
  // the flame — layered teardrops
  g.ellipse(64, 55, 8, 10, 'R'); g.ellipse(64, 56, 6, 8, 'E'); g.ellipse(64, 57, 4, 6, 'G'); g.ellipse(64, 58, 2, 4, 'W');
  g.tri(57, 60, 61, 60, 58, 48, 'E'); g.tri(67, 60, 71, 60, 70, 50, 'R'); // side tongues
  for (let i = 0; i < 16; i++) { const x = 52 + (hash(i, 13) % 26), y = 34 + (hash(i, 17) % 14); g.set(x, y, i % 3 ? 'Y' : 'E'); } // rising embers
  for (let i = 0; i < 8; i++) g.diamond(45 + i * 5 + (i > 3 ? 2 : 0), 77, 'G', 'W'); // eight badge glints on the base step
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 4. CARD-HOENN — the ARC COMPLETE card for arc `hoenn` (Class F).
// summaryLines: "Perennial Conference — HONOURS." / "Two storms
// called and answered, eight badges earned, and a conference run
// that ended narrow and proud. The sea air follows you home."
// Composition: Maris arguing with its own ocean, answered. Two
// storm systems flank the frame — west a heavy rain bank over
// churned water, east a waterspout standing off a second bank —
// and between them a NARROW calm channel: clear sky, still water,
// a path of light running to a small home headland on the horizon.
// Eight badge glints along the channel's near shore.
// =====================================================================
function sceneCardHoenn() {
  const g = canvas('K');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'K' : y < 46 ? 's' : 'S');
  // west storm bank + rain
  g.ellipse(18, 14, 26, 10, 'C'); g.ellipse(8, 20, 16, 8, 'C'); g.ellipse(30, 10, 14, 6, 'c');
  for (let i = 0; i < 30; i++) { const x = 1 + (hash(i, 21) % 34), y = 24 + (hash(i, 5) % 20); g.set(x, y, 'R'); g.set(x - 1, y + 2, 'R'); }
  // east storm bank + the waterspout
  g.ellipse(110, 13, 25, 10, 'C'); g.ellipse(120, 19, 15, 7, 'C'); g.ellipse(98, 9, 13, 6, 'c');
  for (let y = 20; y < 46; y++) { const wdt = y < 30 ? 2 : y < 40 ? 1 : 3; for (let x = 108 - wdt; x <= 108 + wdt; x++) g.set(x, y, 'G'); }
  for (let i = 0; i < 18; i++) { const x = 96 + (hash(i, 23) % 30), y = 24 + (hash(i, 27) % 18); g.set(x, y, 'R'); g.set(x - 1, y + 2, 'R'); }
  // the narrow calm channel: clear sky slot + still water + light path
  for (let y = 0; y < 34; y++) for (let x = 52; x <= 76; x++) g.set(x, y, y < 18 ? 'L' : 'l');
  g.speckle({ from: ['L'], to: ['W'] }, [54, 2, 74, 12], 31, 7);
  g.rect(56, 43, 72, 45, 'D'); g.ellipse(64, 43, 8, 2, 'D'); // the home headland, on the horizon at the channel's end
  for (let y = 46; y < 62; y++) { const hw = 6 + Math.floor((y - 46) * 0.55); for (let x = 64 - hw; x <= 64 + hw; x++) g.set(x, y, 'l'); } // the calm channel, widening toward the viewer
  for (let i = 0; i < 14; i++) { const x = 57 + (hash(i, 29) % 15), y = 47 + (hash(i, 31) % 13); g.set(x, y, 'Y'); g.set(x + 1, y, 'Y'); }
  // churn at the storm edges, whitecaps
  g.speckle({ from: ['s', 'S'], to: ['W'] }, [0, 40, 50, 61], 19, 3);
  g.speckle({ from: ['s', 'S'], to: ['W'] }, [78, 40, 127, 61], 19, 9);
  // near shore + eight badge glints along the channel's edge
  g.rect(0, 62, W - 1, 79, 'D');
  g.speckle({ from: ['D'], to: ['s'] }, [0, 64, 127, 78], 23, 12);
  for (let i = 0; i < 8; i++) g.diamond(37 + i * 8, 70, 'Y', 'W');
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 5. CARD-FRONTIER — the ARC COMPLETE card for arc `frontier`.
// summaryLines: "Trial Grounds — CONQUERED." / "Seven Symbols at
// the Gold standard, and a rematch years in the making finally won.
// The Frontier salutes you."
// Composition: dawn over the Trial Grounds island. The sun stands
// just risen and throws a fan of rays — the Frontier's salute —
// while SEVEN gold Symbols hang in an arc above the island (the
// recorded seven, at the Gold standard). Below, the facilities'
// roofs line the shore: a dome, a pyramid, a tower, a hall.
// =====================================================================
function sceneCardFrontier() {
  const g = canvas('B');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 24 ? 'B' : y < 38 ? 'L' : 'Y');
  // the salute: a halo of dawn light around the rising sun, short rays
  g.ellipse(64, 42, 13, 8, 'Y');
  g.ellipse(64, 43, 7, 5, 'G'); g.ellipse(64, 43, 3, 2, 'W');
  for (const [x0, y0, x1, y1] of [[55, 36, 51, 32], [73, 36, 77, 32], [64, 34, 64, 29], [50, 43, 45, 43], [78, 43, 83, 43]]) g.line(x0, y0, x1, y1, 'Y');
  // the seven Symbols at the Gold standard, in an arc
  const arc = [[22, 24], [38, 16], [52, 11], [64, 9], [76, 11], [90, 16], [106, 24]];
  for (const [x, y] of arc) g.diamond(x, y, 'G', 'W');
  // the island + facility roofs along the shore
  g.rect(0, 52, W - 1, 60, 'I');
  g.ellipse(24, 52, 10, 6, 'I'); g.ellipse(24, 51, 7, 4, 'R'); // dome
  g.tri(44, 52, 62, 52, 53, 42, 'I'); g.tri(48, 52, 58, 52, 53, 46, 'R'); // pyramid
  g.rect(72, 40, 78, 52, 'I'); g.rect(70, 38, 80, 41, 'R'); // tower
  g.rect(92, 46, 112, 52, 'I'); g.tri(90, 46, 114, 46, 102, 41, 'R'); // hall
  g.rect(0, 58, W - 1, 60, 'R'); // the shore wall catching first light
  // dawn sea + light path
  for (let y = 61; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, 'S');
  g.speckle({ from: ['S'], to: ['s'] }, [0, 61, 127, 79], 17, 13);
  for (let i = 0; i < 12; i++) { const x = 58 + (hash(i, 37) % 13), y = 62 + (hash(i, 39) % 15); g.set(x, y, 'Y'); g.set(x + 1, y, 'Y'); }
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 6. CARD-SINNOH — the ARC COMPLETE card for arc `sinnoh` (Class F).
// summaryLines: "Lily of the Valley Conference — HONOURS." /
// "Eight badges, a god unchained and answered, and the only victory
// anyone took from the conference's darkest trainer. History will
// remember the attempt — and the NOCTARCH that fell."
// Composition: a Borea night. Aurora ribbons cross over snow peaks;
// below them the valley of lilies lies pale in the dark. One star
// is FALLING — a dark head with a bright tail, dropping toward the
// peaks: the NOCTARCH that fell. Eight ice glints along the ridge
// foot = the recorded eight badges.
// =====================================================================
function sceneCardSinnoh() {
  const g = canvas('N');
  g.speckle({ from: ['N'], to: ['W'] }, [0, 1, 127, 34], 43, 15); // thin stars
  // aurora ribbons
  for (let x = 0; x < W; x++) {
    const y1 = Math.round(9 + 5 * Math.sin(x / 17));
    for (let dy = 0; dy < 4; dy++) g.set(x, y1 + dy, dy === 0 ? 'g' : 'G');
    const y2 = Math.round(19 + 4 * Math.sin(x / 23 + 1));
    for (let dy = 0; dy < 2; dy++) g.set(x, y2 + dy, 'V');
  }
  // the falling star: bright tail up-right, dark head dropping
  g.line(102, 8, 86, 22, 'T', 1); g.line(98, 7, 85, 20, 'T');
  g.ellipse(84, 24, 3, 3, 'K'); g.set(82, 22, 'W'); g.set(83, 21, 'W'); // the NOCTARCH, rim-lit, falling
  // snow peaks
  const peaks = [[8, 34], [30, 26], [54, 31], [76, 24], [100, 30], [120, 35]];
  for (const [px, ph] of peaks) {
    g.tri(px - 17, 58, px + 17, 58, px, 58 - ph, 'R');
    g.tri(px - 4, 58 - ph + 8, px + 4, 58 - ph + 8, px, 58 - ph, 'W'); // snow cap
  }
  g.speckle({ from: ['R'], to: ['W'] }, [0, 40, 127, 57], 29, 17);
  // the valley of lilies
  g.rect(0, 58, W - 1, 79, 'D');
  for (let i = 0; i < 90; i++) { const x = hash(i, 41) % 128, y = 60 + (hash(i, 43) % 18); g.set(x, y, 'L'); if (i % 4 === 0) g.set(x, y - 1, 'L'); }
  // eight ice glints along the ridge foot
  const glints = [[10, 61], [26, 63], [42, 61], [57, 64], [71, 61], [86, 63], [102, 61], [117, 63]];
  for (const [x, y] of glints) g.diamond(x, y, 'I', 'W');
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 7. CHAMPION-CHAMBER — ev_champion's seal panel (Class F1), the
// only step-attach of the wave: index 7, after Vale's sayVar, before
// the flag that seals the ending.
// Recorded content: the HALL_OF_FAME record — "The doors close
// behind you. The chamber is round, quiet, and older than the
// League itself. One by one, your team's names are etched into the
// light." / "Welcome home, Champion."
// Composition: the round chamber seen across its dais. The tall
// double doors stand CLOSED at the back, one seam of light down
// their middle. Concentric rings score the round floor; six lit
// name plates stand on the dais arc (the team's names), each
// sending a thin beam up into the ring of light that hangs over
// the chamber's heart.
// =====================================================================
function sceneChampionChamber() {
  const g = canvas('K');
  // the curved vault: concentric arcs of old stone
  for (const r of [58, 50]) g.ring(64, 92, r, Math.round(r * 0.62), 's', 0.08);
  g.ring(64, 92, 42, Math.round(42 * 0.62), 'S', 0.08);
  g.speckle({ from: ['K'], to: ['H'] }, [0, 1, 127, 50], 29, 19);
  // side columns
  g.rect(6, 10, 12, 60, 'S'); g.rect(5, 8, 13, 11, 's'); g.rect(115, 10, 121, 60, 'S'); g.rect(114, 8, 122, 11, 's');
  // the closed double doors at the back
  g.rect(50, 12, 78, 58, 'D');
  g.rect(53, 16, 62, 54, 'd'); g.rect(66, 16, 75, 54, 'd'); // door leaves
  g.rect(50, 12, 78, 14, 'S'); g.rect(50, 15, 78, 15, 'G'); g.rect(48, 58, 80, 60, 'S'); // lintel, its gold course, threshold
  for (const sx of [56, 60, 68, 72]) for (const sy of [24, 36, 48]) g.set(sx, sy, 'G'); // door studs
  for (let y = 16; y < 58; y++) g.set(64, y, 'L'); // the seam of light, closed over
  g.set(61, 38, 'G'); g.set(67, 38, 'G'); // the ring handles
  // floor surround + the round dais and its scored rings
  g.rect(0, 60, W - 1, 79, 'H');
  g.ellipse(64, 68, 34, 11, 'F'); g.ring(64, 68, 27, 8, 's', 0.3); g.ring(64, 68, 19, 5, 's', 0.3);
  // the ring of light at the dais heart, where the names are etched
  g.ring(64, 68, 12, 3, 'L', 0.5); g.ellipse(64, 68, 5, 1, 'W');
  // six name plates on the dais arc, each etched into a beam of light
  const plates = [[29, 64], [43, 69], [56, 72], [70, 72], [83, 69], [96, 64]];
  for (const [px, py] of plates) {
    for (let y = py - 9; y < py; y++) g.set(px + 3, y, y % 3 === 0 ? 'W' : 'L'); // the beam
    g.rect(px, py, px + 7, py + 2, 'L'); g.rect(px + 1, py + 1, px + 6, py + 1, 'G'); // plate + its etched line
  }
  g.frame('O');
  return g.grid;
}

const SCENES = {
  'panel-card-kanto': {
    title: 'ARC COMPLETE card — Arden', pal: [
      ['O', '#17130f', 'outline ink'], ['N', '#232145', 'dusk indigo'], ['V', '#4a3a6b', 'dusk violet'],
      ['R', '#8a5570', 'dusk rose'], ['A', '#d99a4e', 'amber horizon / badge gold'], ['W', '#fff6dd', 'light core'],
      ['L', '#f5e3b0', 'hall light'], ['G', '#3d3f52', 'storm bank'], ['g', '#565a75', 'storm light'],
      ['b', '#7f95b8', 'rain / sea sparkle'], ['K', '#241f1c', 'dark ground'], ['S', '#6e5a49', 'plateau stone'],
      ['s', '#4c3d31', 'stone shadow / lowland'],
    ],
    brief: ['# panel-card-kanto 128x80. W10-C T2 cutscene panel (Class F', '# card): the ARC COMPLETE card for arc kanto, played before the', '# card text by showArcCompleteCard. Original in-house art,', '# generated deterministically by w10c-rig/gen-panels-t2.mjs.', '# Brief = the arc record (src/data/arcs.mjs): "Crown League —', '# CHAMPION." / "Eight badges, one storm over Exile Isle, and a', '# final against the rival who started it all. The Plateau wrote', '# your team into its light." Dusk over the Plateau: its light', '# pillar rising, the Exile Isle storm at the horizon, eight', '# badge glints on the ledge = the recorded eight badges.'],
    fn: sceneCardKanto,
  },
  'panel-card-orange': {
    title: 'ARC COMPLETE card — Amber Isles', pal: [
      ['O', '#17130f', 'outline ink'], ['N', '#12283d', 'night sky'], ['T', '#175263', 'teal sky'],
      ['W', '#fff6dd', 'starlight'], ['A', '#e0a458', 'warm glass amber'], ['K', '#101d24', 'silhouette'],
      ['S', '#1d6a72', 'sea'], ['s', '#14424e', 'deep sea'], ['D', '#c9a86a', 'sand'], ['d', '#e3c188', 'lit sand'],
      ['G', '#d9a84e', 'trophy gold'], ['R', '#b8523f', 'the sealed orb'],
    ],
    brief: ['# panel-card-orange 128x80. W10-C T2 cutscene panel (Class F', '# card): the ARC COMPLETE card for arc orange. Original', '# in-house art, generated deterministically by w10c-rig/', '# gen-panels-t2.mjs. Brief = the arc record: "Amber League —', '# WINNER." / "Four island badges and a champion\'s battle under', '# southern stars. The Winner\'s Trophy is yours — and so is the', '# strange ball that started the voyage." A night shore: the', '# Trophy on its plinth (four badge glints = the recorded four', '# island badges) and the Sealed Orb apart on the sand, seam', '# unbroken, under the southern stars.'],
    fn: sceneCardOrange,
  },
  'panel-card-johto': {
    title: 'ARC COMPLETE card — Yamato', pal: [
      ['O', '#17130f', 'outline ink'], ['P', '#2e2140', 'dusk plum'], ['D', '#5d3a55', 'dusk band'],
      ['E', '#e07b39', 'ember / flame mid'], ['W', '#fff3d6', 'flame core / stars'], ['T', '#241d2e', 'tower dark'],
      ['t', '#453a55', 'tower roofs'], ['K', '#171219', 'char / bowl'], ['g', '#33241f', 'plaza ground'],
      ['S', '#6b5138', 'brazier stone'], ['R', '#b84a2e', 'flame outer'], ['G', '#f2b64f', 'flame gold / badges'],
      ['Y', '#ffd98a', 'rising embers'],
    ],
    brief: ['# panel-card-johto 128x80. W10-C T2 cutscene panel (Class F', '# card): the ARC COMPLETE card for arc johto. Original', '# in-house art, generated deterministically by w10c-rig/', '# gen-panels-t2.mjs. Brief = the arc record: "Lastlight', '# Conference — HONOURS." / "Eight badges, the beasts woken and', '# quieted, and the rivalry settled at last in the conference', '# fire." Dusk: Yamato\'s two old towers stand quiet — the tall', '# tiered tower, the gutted one — and the conference fire', '# burns between them; eight badge glints on the brazier base', '# = the recorded eight badges.'],
    fn: sceneCardJohto,
  },
  'panel-card-hoenn': {
    title: 'ARC COMPLETE card — Maris', pal: [
      ['O', '#17130f', 'outline ink'], ['K', '#232833', 'storm sky'], ['C', '#454e63', 'storm cloud'],
      ['c', '#5f6b85', 'cloud light'], ['R', '#8fa8c4', 'rain'], ['s', '#2c4a5e', 'upper sea'],
      ['S', '#1e3547', 'sea'], ['G', '#6d7686', 'waterspout'], ['L', '#bcd3de', 'calm sky'],
      ['l', '#7fa8b5', 'calm water'], ['W', '#eef6f2', 'whitecap / star'], ['D', '#3a3f3a', 'shore / headland'],
      ['Y', '#f2d98a', 'light path / badge gold'],
    ],
    brief: ['# panel-card-hoenn 128x80. W10-C T2 cutscene panel (Class F', '# card): the ARC COMPLETE card for arc hoenn. Original', '# in-house art, generated deterministically by w10c-rig/', '# gen-panels-t2.mjs. Brief = the arc record: "Perennial', '# Conference — HONOURS." / "Two storms called and answered,', '# eight badges earned, and a conference run that ended narrow', '# and proud." Two storm systems flank a narrow calm channel:', '# a rain bank west, a waterspout east, and between them still', '# water and a light path to the home headland; eight badge', '# glints on the near shore = the recorded eight badges.'],
    fn: sceneCardHoenn,
  },
  'panel-card-frontier': {
    title: 'ARC COMPLETE card — Trial Grounds', pal: [
      ['O', '#17130f', 'outline ink'], ['B', '#7d9fc4', 'dawn sky'], ['L', '#c8d9e8', 'sky light'],
      ['Y', '#f7e3ac', 'dawn glow / rays'], ['G', '#e8a83e', 'gold — sun and Symbols'], ['W', '#fff8e6', 'sun core'],
      ['I', '#2c3444', 'island silhouette'], ['R', '#a85f3d', 'facility roofs'], ['S', '#3d6a86', 'dawn sea'],
      ['s', '#5d8aa5', 'sea light'],
    ],
    brief: ['# panel-card-frontier 128x80. W10-C T2 cutscene panel', '# (Class F card): the ARC COMPLETE card for arc frontier.', '# Original in-house art, generated deterministically by', '# w10c-rig/gen-panels-t2.mjs. Brief = the arc record: "Trial', '# Grounds — CONQUERED." / "Seven Symbols at the Gold standard,', '# and a rematch years in the making finally won. The Frontier', '# salutes you." Dawn over the island of arenas: the rising', '# sun throws a fan of rays — the salute — and the SEVEN Gold', '# Symbols hang in an arc above the facility roofs.'],
    fn: sceneCardFrontier,
  },
  'panel-card-sinnoh': {
    title: 'ARC COMPLETE card — Borea', pal: [
      ['O', '#17130f', 'outline ink'], ['N', '#131c2e', 'northern night'], ['G', '#4fae7d', 'aurora green'],
      ['g', '#8fd0a8', 'aurora light'], ['V', '#7d6bb5', 'aurora violet'], ['R', '#3c4457', 'peak rock'],
      ['W', '#f2f6fa', 'snow'], ['D', '#1d2735', 'valley floor'], ['L', '#dfe8d8', 'valley lilies'],
      ['K', '#0c0f16', 'the fallen dark'], ['T', '#aebfd4', 'meteor tail'], ['I', '#9fd4e8', 'ice glints'],
    ],
    brief: ['# panel-card-sinnoh 128x80. W10-C T2 cutscene panel (Class', '# F card): the ARC COMPLETE card for arc sinnoh. Original', '# in-house art, generated deterministically by w10c-rig/', '# gen-panels-t2.mjs. Brief = the arc record: "Lily of the', '# Valley Conference — HONOURS." / "Eight badges, a god', '# unchained and answered, and the only victory anyone took', '# from the conference\'s darkest trainer... the NOCTARCH that', '# fell." Aurora over Borea\'s snow peaks, the lily valley', '# pale below, and one dark star falling; eight ice glints at', '# the ridge foot = the recorded eight badges.'],
    fn: sceneCardSinnoh,
  },
  'panel-champion-chamber': {
    title: 'ev_champion seal panel — the Hall of Fame chamber', pal: [
      ['O', '#17130f', 'outline ink'], ['K', '#2a2320', 'old stone dark'], ['H', '#1d1815', 'shadow floor'],
      ['S', '#57493a', 'stone'], ['s', '#7d6a52', 'stone light'], ['F', '#52453a', 'dais floor'],
      ['D', '#54402c', 'door wood'], ['d', '#6e5638', 'door leaf light'], ['G', '#d9a84e', 'etched gold'],
      ['L', '#f7e7bb', 'chamber light'], ['W', '#fff8e6', 'light core'],
    ],
    brief: ['# panel-champion-chamber 128x80. W10-C T2 cutscene panel', '# (Class F1): the seal panel of ev_champion, index 7 — after', '# Vale\'s last words, before the flag that seals the ending.', '# Original in-house art, generated deterministically by', '# w10c-rig/gen-panels-t2.mjs. Brief = the HALL_OF_FAME', '# record: "The doors close behind you. The chamber is round,', '# quiet, and older than the League itself. One by one, your', '# team\'s names are etched into the light." The round chamber:', '# closed doors with their seam of light, the scored dais, six', '# name plates beaming up around the ring of light at its heart.'],
    fn: sceneChampionChamber,
  },
};

const only = process.argv.slice(2);
for (const [id, s] of Object.entries(SCENES)) {
  if (only.length && !only.includes(id)) continue;
  // brief lines already carry their own leading '# ' via emit's head join
  emit(id, s.title, s.brief.map((l) => l.replace(/^# /, '')), s.pal, s.fn());
}
