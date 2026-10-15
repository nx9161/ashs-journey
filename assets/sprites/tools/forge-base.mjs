// forge-base.mjs — procedural seeded BASE-DRAFT generator (Art Director pipeline v1).
// Produces .pix DRAFTS into pix/drafts/ — starting points only. Nothing from
// drafts/ is packed into atlases or shipped; every shipped sprite is a
// hand-finished .pix in pix/<family>/. The seed is recorded in manifest.yaml
// provenance wherever a draft informed the hand finish.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draft: 16x16 tile texture draft (base tone + deterministic noise + edge shade).
// palette keys: O outline, B base, D dark, L light.
export function draftTile(id, seed, tones) {
  const rng = mulberry32(seed);
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const v = rng();
      let ch = 'B';
      if (x === 0 || y === 0 || x === 15 || y === 15) ch = v < 0.5 ? 'D' : 'B';
      else if (v < 0.14) ch = 'D';
      else if (v > 0.9) ch = 'L';
      row += ch;
    }
    rows.push(row);
  }
  const pal = [
    ['O', tones.outline, 'outline'],
    ['B', tones.base, 'base'],
    ['D', tones.dark, 'dark'],
    ['L', tones.light, 'light'],
  ];
  return toPix(`${id}-draft`, 16, 16, rows, pal, seed);
}

// Draft: symmetric creature silhouette draft on a 48x48 grid.
// palette keys: O outline, M main, D dark shade, L light shade, A accent, W white, E eye-dark.
export function draftCreature(id, seed, main, accent) {
  const rng = mulberry32(seed);
  const W = 48, H = 48;
  const grid = Array.from({ length: H }, () => Array(W).fill('.'));
  const cx = W / 2;
  // blobby symmetric body: radius varies with height via seeded walk
  let r = 10 + rng() * 4;
  for (let y = 8; y < 40; y++) {
    r += (rng() - 0.5) * 3;
    r = Math.max(6, Math.min(16, r));
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - cx);
      if (dx <= r) grid[y][x] = rng() < 0.2 ? 'D' : (rng() < 0.12 ? 'L' : 'M');
    }
  }
  // head bump
  const hy = 8, hr = 7 + rng() * 3;
  for (let y = Math.max(1, hy - hr); y < hy + hr; y++) {
    for (let x = 0; x < W; x++) {
      if (Math.abs(x - cx) <= hr * (1 - Math.abs(y - hy) / (hr + 1))) grid[y][x] = grid[y][x] === '.' ? 'M' : grid[y][x];
    }
  }
  // accent patches
  for (let k = 0; k < 40; k++) {
    const x = Math.floor(rng() * W), y = Math.floor(rng() * H);
    if (grid[y][x] !== '.') grid[y][x] = 'A';
  }
  // eyes (front-facing pair)
  const ey = 12;
  for (const ex of [Math.floor(cx) - 5, Math.floor(cx) + 4]) {
    grid[ey][ex] = 'W'; grid[ey][ex + 1] = 'W';
    grid[ey + 1][ex] = 'E'; grid[ey + 1][ex + 1] = 'E';
  }
  // 1px outline pass: any painted cell adjacent to transparent becomes O
  const painted = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y][x] !== '.';
  const out = grid.map((row) => row.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!painted(x, y)) continue;
    let edge = false;
    for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!painted(x + dx, y + dy)) { edge = true; break; }
    }
    if (edge) out[y][x] = 'O';
  }
  const pal = [
    ['O', '#23202a', 'outline'],
    ['M', main, 'main'],
    ['D', shade(main, -46), 'dark'],
    ['L', shade(main, 40), 'light'],
    ['A', accent, 'accent'],
    ['W', '#ffffff', 'white'],
    ['E', '#1c1a22', 'eye'],
  ];
  return toPix(`${id}-draft`, W, H, out.map((r) => r.join('')), pal, seed);
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export function toPix(id, w, h, rows, pal, seed) {
  let s = `# DRAFT — seed ${seed}. Not shipped; hand-finish into pix/<family>/${id.replace(/-draft$/, '')}.pix\n`;
  s += `PIX ${id} ${w} ${h}\n`;
  s += rows.join('\n') + '\nPAL\n';
  for (const [ch, hex, name] of pal) s += `${ch} ${hex} ${name}\n`;
  return s;
}

// CLI: node forge-base.mjs — regenerates pix/drafts/ (deterministic).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const drafts = path.join(ROOT, 'pix', 'drafts');
  fs.rmSync(drafts, { recursive: true, force: true });
  fs.mkdirSync(path.join(drafts, 'tiles'), { recursive: true });
  fs.mkdirSync(path.join(drafts, 'species'), { recursive: true });
  const tileTones = {
    grass: { base: '#5da24a', dark: '#4c8a3e', light: '#6fb45c', outline: '#2e5e28' },
    path: { base: '#d8c08a', dark: '#c2a878', light: '#e8d49a', outline: '#8a6a42' },
    water: { base: '#3a7bd5', dark: '#2e63b0', light: '#5a9ae8', outline: '#1e3e70' },
  };
  let seed = 1001;
  for (const [kind, tones] of Object.entries(tileTones)) {
    fs.writeFileSync(path.join(drafts, 'tiles', `${kind}.pix`), draftTile(kind, seed, tones));
    seed += 77;
  }
  const speciesTones = {
    pidgey: ['#a8896a', '#e8d8b0'], rattata: ['#9a7ab0', '#e8c8d8'], caterpie: ['#6ab04a', '#e8f0a0'],
    weedle: ['#b07a3a', '#e8a0c0'], spearow: ['#b08a5a', '#e8d0a0'], zubat: ['#5a6ab0', '#a0b0e8'],
    geodude: ['#9a9aa5', '#c8c8d0'], onix: ['#8a8a95', '#b5b5c0'], bulbasaur: ['#5aa86a', '#a8e8b0'],
    charmander: ['#e08a3a', '#f8d080'], squirtle: ['#5a9ad0', '#b0d8f0'], nidoranm: ['#b06a9a', '#e8a0c8'],
    mankey: ['#d0b08a', '#f0e0c0'], partner: ['#f0c838', '#f8e890'],
  };
  for (const [id, [main, accent]] of Object.entries(speciesTones)) {
    fs.writeFileSync(path.join(drafts, 'species', `${id}.pix`), draftCreature(id, seed, main, accent));
    seed += 131;
  }
  console.log(`drafts written to ${drafts} (not shipped)`);
}
