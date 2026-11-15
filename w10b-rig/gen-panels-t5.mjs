// gen-panels-t5.mjs — W10-B T5 glimpses + set-pieces panel generators
// (deterministic). Authors the 5 T5 panels (128x80, the W10 panel
// canvas standard) as .pix sources under assets/sprites/pix/keyart/.
// Class C glimpses + Class D set-pieces only — Class H embark was
// censused OUT of this tranche (no data-level hook exists at the
// en-route card's single engine call site; see the T5 SPEC).
// Each composition is drawn ONLY from its moment's recorded data:
// the event's own say text + the venue record (+ the Kin's W13
// design field where a Kin appears). Glimpse discipline (Director
// ruling, W10-B OQ8): a glimpse panel shows NO MORE than its text
// shows. Original compositions — battle art is reference only; no
// battle frame is traced, enlarged, or reused (Director ruling 4).
// Same code -> byte-identical .pix.
// Run: node w10b-rig/gen-panels-t5.mjs [panel-id ...]
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
  console.log(`gen-panels-t5: ${id} (${title}) 128x80, ${used.size} palette chars -> ${out} (${text.length} B source)`);
  return out;
}

// =====================================================================
// 1. LORACLE glimpse — ev_sinnoh_acuity_glimpse @ Lake Insight
// Class C glimpse. Text shows NO figure: "grey boats on the ice,
// grey figures measuring the lake" + "Under the ice at the lake's
// heart, something small and gold turns in its sleep — one slow
// revolution... It does not surface." Design field (grey sprite,
// gold helmet, red brow gem) is present only as the gold turn and
// one red fleck, seen THROUGH the ice. Nothing more is shown.
// =====================================================================
function sceneUnderice() {
  const g = canvas('I');
  // far shore band + ice edge
  g.rect(0, 0, W - 1, 11, 'K');
  g.rect(0, 12, W - 1, 13, 'i');
  // grey boats hauled on the ice, far shore
  for (const bx of [12, 88]) {
    g.rect(bx, 8, bx + 15, 11, 'G');
    g.tri(bx + 15, 8, bx + 19, 11, bx + 15, 11, 'G');
    g.rect(bx + 4, 5, bx + 9, 7, 'g');
  }
  // grey figures measuring — small, distant, backs turned
  for (const fx of [24, 30, 98]) {
    g.rect(fx, 5, fx + 1, 10, 'g');
    g.set(fx, 4, 'g'); g.set(fx + 1, 4, 'g');
  }
  g.line(24, 11, 44, 11, 'g'); // a measuring line along the ice
  // the ice field
  for (let y = 14; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 34 ? 'I' : y < 56 ? 'i' : 'B');
  g.speckle({ from: ['I', 'i', 'B'], to: ['W', 'I', 'i'] }, [0, 14, 127, 79], 23, 5);
  // the deep patch under thinner ice at the lake's heart
  g.ellipse(64, 50, 30, 20, 'b');
  g.ellipse(64, 50, 22, 14, 'D');
  // the gold turn — a slow ring, half-dissolved by the deep
  g.ring(64, 50, 12, 7, 'y', 0.34);
  g.ring(64, 50, 16, 10, 'y', 0.1);
  for (let a = 0; a < 40; a++) { // bright arc on the ring's upper-left, mid-turn
    const t = Math.PI * (0.85 + a / 40 * 0.55);
    const x = Math.round(64 + 12 * Math.cos(t)), y = Math.round(50 + 7 * Math.sin(t));
    if (a % 3 !== 2) g.set(x, y, 'Y');
  }
  g.set(64, 43, 'R'); // the brow gem, one red fleck at the ring's crown
  g.set(63, 44, 'y'); g.set(65, 44, 'y');
  // seen THROUGH ice: sheen and speckle laid back over the deep patch
  g.speckle({ from: ['b', 'D', 'y'], to: ['B', 'i'] }, [34, 30, 94, 70], 4, 9);
  g.speckle({ from: ['Y'], to: ['y'] }, [40, 38, 88, 60], 3, 4);
  // cracks walking out from the heart
  g.line(40, 42, 18, 34, 'B'); g.line(20, 36, 8, 36, 'B');
  g.line(88, 44, 108, 36, 'B'); g.line(84, 60, 104, 68, 'B'); g.line(44, 62, 26, 72, 'B');
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 2. EMPATHIS glimpse — ev_sinnoh_verity_pressure @ Lake Candor
// Class C glimpse. Design: pink sprite, magenta helmet, red chest
// gem, ribbon tails. Say: "Grey hulls quarter the water in a slow
// grid... EMPATHIS rises a hand's breadth above the surface, looks
// at the boats, looks at you, and chooses... to be elsewhere."
// The Kin IS shown by this text — small, at the shore, mid-rise.
// =====================================================================
function sceneSurfaced() {
  const g = canvas('S');
  g.rect(0, 0, W - 1, 15, 'S');
  g.speckle({ from: ['S'], to: ['W'] }, [0, 0, 127, 15], 29, 2);
  g.rect(0, 16, W - 1, 16, 'W');
  // pines at both shores
  for (const [px, ph] of [[2, 34], [8, 26], [114, 30], [121, 38]]) {
    g.tri(px - 6, 44, px + 6, 44, px, 44 - ph, 'T');
    g.tri(px - 4, 36, px + 4, 36, px, 44 - ph - 4, 't');
  }
  // water bands
  for (let y = 17; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 31 ? 's' : y < 56 ? 'B' : 'b');
  g.speckle({ from: ['s', 'B', 'b'], to: ['W', 's'] }, [0, 18, 127, 79], 31, 7);
  // the Combine grid: three grey hulls + dashed survey lines
  for (const [hx, hy, hw] of [[16, 24, 17], [58, 20, 13], [98, 26, 15]]) {
    g.rect(hx, hy, hx + hw, hy + 3, 'G');
    g.tri(hx + hw, hy, hx + hw + 3, hy + 3, hx + hw, hy + 3, 'G');
    g.rect(hx + 3, hy - 3, hx + 7, hy - 1, 'g');
  }
  for (const gy of [38, 48]) for (let x = 4; x < 124; x++) if (x % 5 < 2) g.set(x, gy, 's');
  // EMPATHIS, risen a hand's breadth above the surface at the shore
  g.ellipse(64, 67, 7, 3, 'p'); // reflection, broken by the water
  g.speckle({ from: ['p'], to: ['b', 'B'] }, [56, 64, 72, 70], 2, 3);
  g.set(64, 63, 'M');
  g.ellipse(64, 54, 5, 6, 'P'); // body
  g.ellipse(66, 56, 3, 4, 'p'); // shade side
  g.ellipse(64, 46, 4, 4, 'P'); // head
  g.ellipse(64, 44, 4, 2, 'M'); // magenta helmet crown
  g.set(64, 41, 'M');
  g.set(64, 52, 'R'); // red chest gem
  g.line(60, 58, 53, 64, 'p'); g.line(61, 59, 56, 65, 'p'); // ribbon tails
  g.line(68, 58, 75, 63, 'p'); g.line(67, 59, 72, 65, 'p');
  g.ring(64, 61, 10, 2, 's', 0.5); // the ring where she hangs above the water
  g.set(58, 61, 'W'); g.set(70, 61, 'W');
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 3. GRATHOG glimpse — ev_sinnoh_gracidea @ Honeyfield
// Class C glimpse. Design: cream hedgehog, grassy back, pink blooms.
// Say: "the Gracidea have opened — all of them, a whole field
// standing in pink-white bloom... the bloom at the field's heart
// moves against the wind, and a small green shape with a flower on
// either ear lifts its head out of the blossom, considers you with
// total unafraid calm... and settles back down into the flowers."
// =====================================================================
function sceneGracidea() {
  const g = canvas('F');
  g.rect(0, 0, W - 1, 13, 'S');
  g.rect(0, 14, W - 1, 15, 's');
  for (let y = 16; y < H; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 32 ? 'F' : y < 56 ? 'f' : 'd');
  g.speckle({ from: ['F', 'f', 'd'], to: ['f', 'F', 'G'] }, [0, 16, 127, 79], 17, 6);
  // the opened Gracidea — a whole field in pink-white bloom
  const bloom = (x, y, big) => {
    g.set(x, y, 'M');
    g.set(x - 1, y, 'P'); g.set(x + 1, y, 'P'); g.set(x, y - 1, 'W'); g.set(x, y + 1, 'p');
    if (big) { g.set(x - 2, y, 'P'); g.set(x + 2, y, 'P'); g.set(x, y - 2, 'W'); }
  };
  for (let i = 0; i < 90; i++) {
    const x = 3 + (hash(i, 11) % 122), y = 19 + (hash(7, i) % 58);
    if (Math.abs(x - 64) < 15 && Math.abs(y - 51) < 11) continue; // the heart stays for the shape
    bloom(x, y, false);
  }
  // the bloom at the field's heart, denser, ringing the shape
  for (let a = 0; a < 14; a++) {
    const t = a / 14 * Math.PI * 2;
    bloom(Math.round(64 + 17 * Math.cos(t)), Math.round(52 + 10 * Math.sin(t)), true);
  }
  // the small green shape lifting its head out of the blossom
  g.ellipse(64, 51, 12, 8, 'G'); // grassy back dome
  g.ellipse(64, 54, 10, 5, 'f'); // shade under the dome
  g.ellipse(64, 55, 5, 4, 'C'); // cream face, lifted, considering you
  g.set(62, 54, 'O'); // one calm eye
  g.set(66, 56, 'p'); // nose blush
  bloom(53, 44, true); // a flower on either ear
  bloom(75, 44, true);
  // foreground stalks
  for (const sx of [6, 20, 106, 120]) { g.line(sx, 79, sx, 70, 'd'); bloom(sx, 69, false); }
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 4. The storm over Sanctum — ev_orange_2000_storm @ Sanctum
// Class D set-piece, environment-led (no figures). Say: "festival
// banners snap like sails, the plaza lanterns swing wild... the
// sky is the colour of a bruise — three storm cells, turning
// slowly around an empty centre" + the dock, the sea throwing
// crates back, the shrine isles.
// =====================================================================
function sceneStorm() {
  const g = canvas('K');
  for (let y = 0; y < 43; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 11 ? 'K' : y < 27 ? 'V' : 'v');
  g.speckle({ from: ['K', 'V', 'v'], to: ['G', 'v'] }, [0, 0, 127, 42], 19, 8);
  // three storm cells turning around an empty centre
  for (const [cx, cy] of [[28, 15], [66, 9], [102, 15]]) {
    for (const r of [4, 7, 10]) {
      g.ring(cx, cy, r, Math.max(2, r * 0.62), 'v', 0.2);
      g.ring(cx, cy, r, Math.max(2, r * 0.62), 'G', 0.08);
    }
    g.speckle({ from: ['v', 'G'], to: ['V', 'K'] }, [cx - 11, Math.max(0, cy - 8), cx + 11, cy + 8], 3, cx);
  }
  g.ellipse(64, 24, 7, 4, 'S'); // the empty centre, kept empty
  g.speckle({ from: ['S'], to: ['v'] }, [56, 19, 72, 29], 5, 1);
  // shrine isles on the horizon
  g.ellipse(16, 45, 17, 5, 'K');
  g.ellipse(112, 45, 15, 5, 'K');
  g.rect(107, 37, 117, 44, 'K'); g.tri(106, 37, 118, 37, 112, 33, 'K'); // a shrine silhouette
  // the sea, throwing crates back
  for (let y = 46; y < 64; y++) for (let x = 0; x < W; x++) g.set(x, y, y < 54 ? 'b' : 'B');
  g.speckle({ from: ['b', 'B'], to: ['W', 'b'] }, [0, 46, 127, 63], 13, 12);
  for (const [cx, cy] of [[28, 57], [92, 54]]) {
    g.rect(cx, cy, cx + 7, cy + 5, 'g');
    g.line(cx, cy, cx + 7, cy + 5, 'K'); g.line(cx + 7, cy, cx, cy + 5, 'K');
  }
  // the dock foreground, banners snapping, lanterns swinging wild
  g.rect(0, 64, W - 1, 79, 'D');
  for (const y of [68, 72, 76]) g.line(0, y, W - 1, y, 'K');
  for (const [px, bc, dir] of [[12, 'R', 1], [116, 'T', -1]]) {
    g.rect(px, 56, px + 1, 79, 'g');
    g.tri(px, 58, px + dir * 14, 61, px, 66, bc); // banner, snapped sideways by the wind
    g.line(px, 59, px + dir * 16, 65, 'g'); // lantern string, swung out
    g.ellipse(px + dir * 17, 67, 2, 2, 'Y');
    g.set(px + dir * 17, 65, 'g');
  }
  g.frame('O');
  return g.grid;
}

// =====================================================================
// 5. The Canopy parley — ev_parley_enter @ Canopy City (celadon)
// Class D set-piece, place-led. The panel sits after the opening
// says, BEFORE the actorEnter steps: "The Game Corner doors spill
// light across the plaza — and two figures cross to the corner
// post, unhurried, like they hold the lease on it." / "RUE and
// COLE. The parley, in person." Figures small, at the thresholds,
// silhouetted in the spilled light; planters flank the crossing
// (the event's own staging note: south around the planters).
// =====================================================================
function sceneParley() {
  const g = canvas('N');
  // the Game Corner facade
  g.rect(0, 0, W - 1, 30, 'F');
  g.rect(0, 4, W - 1, 9, 'f');
  g.speckle({ from: ['f'], to: ['L'] }, [0, 4, 127, 9], 9, 15); // marquee bulbs
  g.line(0, 30, W - 1, 30, 'O');
  // two door pairs, open
  for (const dx of [38, 76]) {
    g.rect(dx, 12, dx + 14, 34, 'D');
    g.line(dx + 7, 12, dx + 7, 34, 'K');
    g.rect(dx, 12, dx + 14, 13, 'f');
    g.set(dx + 3, 22, 'l'); g.set(dx + 11, 22, 'l');
  }
  // light spilling across the plaza
  g.tri(38, 34, 52, 34, 60, 58, 'l'); g.tri(52, 34, 38, 34, 30, 58, 'l');
  g.tri(76, 34, 90, 34, 98, 58, 'l'); g.tri(90, 34, 76, 34, 68, 58, 'l');
  g.tri(41, 34, 49, 34, 52, 50, 'L'); g.tri(79, 34, 87, 34, 76, 50, 'L');
  // plaza paving
  g.rect(0, 59, W - 1, 79, 'N');
  g.speckle({ from: ['N'], to: ['n'] }, [0, 35, 127, 79], 11, 21);
  g.ellipse(45, 57, 13, 3, 'l'); g.ellipse(83, 57, 13, 3, 'l'); // light pools
  // planters flanking the crossing
  for (const px of [14, 100]) {
    g.rect(px, 50, px + 14, 58, 'P');
    g.speckle({ from: ['P'], to: ['p'] }, [px, 48, px + 14, 53], 3, px);
    g.line(px, 50, px + 14, 50, 'O');
  }
  // the corner post, centre — the post the parley holds
  g.rect(63, 56, 65, 65, 'W');
  g.rect(62, 54, 66, 56, 'W');
  g.ellipse(64, 68, 6, 2, 'K');
  // two figures at the thresholds, crossing — small silhouettes
  const figure = (fx, trim) => {
    g.ellipse(fx, 39, 2, 2, 'K'); // head
    g.rect(fx - 2, 41, fx + 2, 48, 'K'); // body, mid-stride
    g.line(fx - 1, 48, fx - 3, 52, 'K'); g.line(fx + 1, 48, fx + 3, 51, 'K');
    g.set(fx, 44, trim); // one thread of colour each — RUE's red, COLE's teal
  };
  figure(45, 'R');
  figure(83, 'T');
  g.frame('O');
  return g.grid;
}

const SCENES = {
  'panel-underice-loracle': () => emit('panel-underice-loracle', 'LORACLE glimpse, Lake Insight', [
    'panel-underice-loracle 128x80. W10-B T5 cutscene panel (Class C',
    'glimpse): ev_sinnoh_acuity_glimpse, Lake Insight. Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t5.mjs. Brief = the event say text ONLY: grey boats',
    'and figures on the ice; under the ice at the lake\'s heart,',
    'something small and gold turns in its sleep and does NOT',
    'surface. The glimpse discipline: no more is shown than the',
    'text shows — no figure, no face, only the gold turn.',
  ], [
    ['O', '#0b0e14', 'outline'], ['K', '#16202e', 'far shore dark'], ['G', '#5a6672', 'boat grey'],
    ['g', '#39424c', 'grey dark'], ['W', '#eaf4f8', 'ice white'], ['I', '#cfe6ee', 'pale ice'],
    ['i', '#a8ccdd', 'ice mid'], ['B', '#6fa8bf', 'ice blue'], ['b', '#3d6a86', 'under-ice water'],
    ['D', '#274b61', 'deep water'], ['Y', '#e8c85a', 'gold'], ['y', '#b8933a', 'dim gold'],
    ['R', '#c03a3a', 'gem red'],
  ], sceneUnderice()),
  'panel-surfaced-empathis': () => emit('panel-surfaced-empathis', 'EMPATHIS glimpse, Lake Candor', [
    'panel-surfaced-empathis 128x80. W10-B T5 cutscene panel',
    '(Class C glimpse): ev_sinnoh_verity_pressure, Lake Candor.',
    'Original in-house art, generated deterministically by',
    'w10b-rig/gen-panels-t5.mjs. Brief = the species design record',
    '(pink sprite, magenta helmet, red chest gem, ribbon tails) +',
    'the event say text: grey hulls quarter the water in a slow',
    'grid; EMPATHIS rises a hand\'s breadth above the surface at',
    'the shore, looks at the boats, looks at you, and is gone.',
  ], [
    ['O', '#0b0e14', 'outline'], ['W', '#e6eef0', 'sky pale'], ['S', '#9db8c4', 'sky mid'],
    ['s', '#6d8fa1', 'water light'], ['B', '#46687c', 'water mid'], ['b', '#2c4a5c', 'water deep'],
    ['G', '#55606a', 'hull grey'], ['g', '#333d45', 'hull dark'], ['P', '#f2a7c3', 'pink'],
    ['p', '#e2739d', 'pink shade'], ['M', '#c23a78', 'magenta'], ['R', '#d42a3a', 'gem red'],
    ['T', '#2e4638', 'pine dark'], ['t', '#476b52', 'pine light'],
  ], sceneSurfaced()),
  'panel-gracidea-grathog': () => emit('panel-gracidea-grathog', 'GRATHOG glimpse, Honeyfield', [
    'panel-gracidea-grathog 128x80. W10-B T5 cutscene panel',
    '(Class C glimpse): ev_sinnoh_gracidea, Honeyfield. Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t5.mjs. Brief = the species design record (cream',
    'hedgehog, grassy back, pink blooms) + the event say text: the',
    'Gracidea have opened all at once; at the field\'s heart a',
    'small green shape with a flower on either ear lifts its head',
    'out of the blossom, considers you, and settles back down.',
  ], [
    ['O', '#101408', 'outline'], ['S', '#bcd8e8', 'sky'], ['s', '#e8f2e0', 'horizon pale'],
    ['F', '#7fae56', 'field light'], ['f', '#5d8a3e', 'field mid'], ['d', '#44682c', 'field deep'],
    ['W', '#fdf6ee', 'flower white'], ['P', '#f7c8d8', 'flower pink light'], ['p', '#ee9db8', 'flower pink'],
    ['M', '#d96a94', 'flower deep'], ['C', '#f5ead2', 'cream'], ['G', '#86c25e', 'grass back'],
  ], sceneGracidea()),
  'panel-storm-sanctum': () => emit('panel-storm-sanctum', 'The storm over Sanctum', [
    'panel-storm-sanctum 128x80. W10-B T5 cutscene panel (Class D',
    'set-piece, environment-led): ev_orange_2000_storm, Sanctum.',
    'Original in-house art, generated deterministically by',
    'w10b-rig/gen-panels-t5.mjs. Brief = the event say text ONLY:',
    'festival banners snap like sails, plaza lanterns swing wild,',
    'the sky the colour of a bruise — three storm cells turning',
    'slowly around an empty centre, past the shrine isles; the',
    'sea throwing crates back at the dock. No figures: the text',
    'stages weather and place, so the panel does the same.',
  ], [
    ['O', '#0d0a14', 'outline'], ['K', '#1c1626', 'bruise dark'], ['V', '#4a3560', 'bruise violet'],
    ['v', '#6d548a', 'bruise light'], ['G', '#8b93a0', 'storm grey'], ['g', '#5d6570', 'grey dark'],
    ['S', '#c8ccd4', 'pale centre'], ['B', '#2c4a66', 'sea deep'], ['b', '#476b8a', 'sea light'],
    ['W', '#e8ecf0', 'foam'], ['Y', '#e8b84a', 'lantern gold'], ['R', '#c03a4a', 'banner red'],
    ['T', '#3a8a7a', 'banner teal'], ['D', '#241a30', 'dock dark'],
  ], sceneStorm()),
  'panel-parley-plaza': () => emit('panel-parley-plaza', 'The Canopy parley', [
    'panel-parley-plaza 128x80. W10-B T5 cutscene panel (Class D',
    'set-piece, place-led): ev_parley_enter, Canopy City. Original',
    'in-house art, generated deterministically by w10b-rig/',
    'gen-panels-t5.mjs. Brief = the event say text + its staging',
    'record: the Game Corner doors spill light across the plaza;',
    'two figures (RUE, west door; COLE, east door) cross south',
    'around the planters to the corner post. The panel sits BEFORE',
    'the entrances — figures small at the thresholds, mid-crossing.',
  ], [
    ['O', '#0b0e14', 'outline'], ['K', '#141020', 'night'], ['N', '#241c33', 'plaza'],
    ['n', '#372c4c', 'paving light'], ['F', '#4a3560', 'facade'], ['f', '#5d4680', 'facade light'],
    ['D', '#0e0a16', 'door dark'], ['L', '#f2d98c', 'spilled light'], ['l', '#c9a959', 'light dim'],
    ['R', '#b84a5a', 'rue trim'], ['T', '#3a7a8c', 'cole trim'], ['P', '#3f6b3a', 'planter'],
    ['p', '#5d8a4a', 'planter light'], ['W', '#e8e2d2', 'post stone'],
  ], sceneParley()),
};

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(SCENES);
for (const id of ids) {
  if (!SCENES[id]) { console.error('gen-panels-t5: unknown panel ' + id); process.exit(1); }
  SCENES[id]();
}
console.log('gen-panels-t5: done');
