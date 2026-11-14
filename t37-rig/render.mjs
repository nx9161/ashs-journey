// T1 proof renderer (rebuilt 2026-11-12): rasterizes SHIPPED map data with
// the game's OWN art pipeline (buildArtTileCache + resolveTileLayers +
// foregroundFor from src/engine/art.mjs) in Node, over a pixel-buffer fake
// document. Fixed look (authored palette — no season swap, the post-SZ
// standard). Day phase, animation frame 0. No NPCs/player/HUD — MAP renders.
// Usage: node render.mjs <mapId> <out.ppm>
// P6 PPM is written to <out.ppm>; convert with PIL to PNG.
import { writeFileSync } from 'node:fs';

// ---- pin spring before any game module loads (fixed look) ----
const RealDate = Date;
const SPRING = new RealDate('2026-05-15T12:00:00').getTime();
class FakeDate extends RealDate {
  constructor(...a) { super(...(a.length ? a : [SPRING])); }
  static now() { return SPRING; }
}
globalThis.Date = FakeDate;

const REPO = '/home/hatch/workspace/ashs-journey-t37';
const { buildArtTileCache, resolveTileLayers, foregroundFor } = await import(REPO + '/src/engine/art.mjs');
const { TILE_CHARS } = await import(REPO + '/src/engine/tiles.mjs');
const { MAPS } = await import(REPO + '/src/data/maps.mjs');
const { MAPS2 } = await import(REPO + '/src/data/maps2.mjs');
const { MAPS3 } = await import(REPO + '/src/data/maps3.mjs');
const { MAPS4 } = await import(REPO + '/src/data/maps4.mjs');
const { MAPS5 } = await import(REPO + '/src/data/maps5.mjs');
const { MAPS6 } = await import(REPO + '/src/data/maps6.mjs');
const { MAPS7 } = await import(REPO + '/src/data/maps7.mjs');
const { MAPS8 } = await import(REPO + '/src/data/maps8.mjs');
const { MAPS9 } = await import(REPO + '/src/data/maps9.mjs');
const ALL = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);

// ---- pixel-buffer fake document (only ops the art pipeline uses) ----
function parseColor(s) {
  if (typeof s !== 'string') return [0, 0, 0, 255];
  s = s.trim();
  if (s[0] === '#') {
    if (s.length === 4) return [parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), parseInt(s[3] + s[3], 16), 255];
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map((v) => parseFloat(v));
    return [p[0] | 0, p[1] | 0, p[2] | 0, p.length > 3 ? Math.round(p[3] * 255) : 255];
  }
  return [255, 0, 255, 255];
}

class FakeCanvas {
  constructor() { this._w = 0; this._h = 0; this._px = new Uint8ClampedArray(0); }
  get width() { return this._w; }
  set width(v) { this._w = v | 0; this._alloc(); }
  get height() { return this._h; }
  set height(v) { this._h = v | 0; this._alloc(); }
  _alloc() { this._px = new Uint8ClampedArray(Math.max(0, this._w * this._h * 4)); }
  getContext() {
    const cv = this;
    let fill = '#000000';
    let alpha = 1;
    const blend = (ti, r, g, b, a) => {
      const sa = (a / 255) * alpha;
      if (sa <= 0) return;
      if (sa >= 1) { cv._px[ti] = r; cv._px[ti + 1] = g; cv._px[ti + 2] = b; cv._px[ti + 3] = 255; return; }
      cv._px[ti] = Math.round(r * sa + cv._px[ti] * (1 - sa));
      cv._px[ti + 1] = Math.round(g * sa + cv._px[ti + 1] * (1 - sa));
      cv._px[ti + 2] = Math.round(b * sa + cv._px[ti + 2] * (1 - sa));
      cv._px[ti + 3] = 255;
    };
    return {
      get fillStyle() { return fill; },
      set fillStyle(v) { fill = v; },
      get globalAlpha() { return alpha; },
      set globalAlpha(v) { alpha = v; },
      imageSmoothingEnabled: false,
      save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
      clearRect() {},
      fillRect(x, y, w, h) {
        const [r, g, b, a] = parseColor(fill);
        const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
        const x1 = Math.min(cv._w, Math.ceil(x + w)), y1 = Math.min(cv._h, Math.ceil(y + h));
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) blend((yy * cv._w + xx) * 4, r, g, b, a);
      },
      drawImage(src, ...args) {
        let sx = 0, sy = 0, sw = src.width, sh = src.height, dx, dy, dw, dh;
        if (args.length === 2) { [dx, dy] = args; dw = sw; dh = sh; }
        else if (args.length === 4) { [dx, dy, dw, dh] = args; }
        else if (args.length === 8) { [sx, sy, sw, sh, dx, dy, dw, dh] = args; }
        else return;
        const spx = src._px;
        for (let yy = 0; yy < dh; yy++) {
          const ty = Math.floor(dy) + yy;
          if (ty < 0 || ty >= cv._h) continue;
          const syy = Math.min(sh - 1, Math.floor(sy + (yy / dh) * sh));
          for (let xx = 0; xx < dw; xx++) {
            const tx = Math.floor(dx) + xx;
            if (tx < 0 || tx >= cv._w) continue;
            const sxx = Math.min(sw - 1, Math.floor(sx + (xx / dw) * sw));
            const si = (syy * src.width + sxx) * 4;
            blend((ty * cv._w + tx) * 4, spx[si], spx[si + 1], spx[si + 2], spx[si + 3]);
          }
        }
      },
    };
  }
}
const doc = { createElement: (tag) => { if (tag === 'canvas') return new FakeCanvas(); throw new Error('unsupported element ' + tag); } };

// ---- render ----
const mapId = process.argv[2];
const outPath = process.argv[3];
if (!mapId || !outPath) { console.error('usage: node render.mjs <mapId> <out.ppm>'); process.exit(2); }
const map = ALL[mapId];
if (!map) { console.error('no such map: ' + mapId); process.exit(2); }

const cache = buildArtTileCache(doc, null, null); // authored palette, no season swap
const rows = map.rows;
const W = Math.max(...rows.map((r) => r.length));
const H = rows.length;
const T = 16, SCALE = 2, MARGIN = 16; // 1-tile top margin for tall-art overhang
const out = doc.createElement('canvas');
out.width = W * T * SCALE;
out.height = (H * T + MARGIN) * SCALE;
const octx = out.getContext('2d');
octx.fillStyle = '#101018';
octx.fillRect(0, 0, out.width, out.height);

const kindAt = (tx, ty) => (ty < 0 || ty >= rows.length || tx < 0 || tx >= rows[ty].length)
  ? null : (TILE_CHARS[rows[ty][tx]] || 'void');
const blit = (spr, lx, ly) => {
  // lx, ly in logical px (top-left of the sprite's bottom-anchored cell slot)
  octx.drawImage(spr, lx * SCALE, ly * SCALE, spr.width * SCALE, spr.height * SCALE);
};
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const ch = rows[y][x];
    const kind = TILE_CHARS[ch] || 'void';
    const layers = resolveTileLayers(cache, kind, x, y, kindAt, 0, 'day', mapId);
    if (!layers || !layers.length) {
      octx.fillStyle = '#101018';
      octx.fillRect(x * T * SCALE, (MARGIN + y * T) * SCALE, T * SCALE, T * SCALE);
      continue;
    }
    for (const spr of layers) {
      blit(spr, x * T, MARGIN + y * T - Math.max(0, spr.height - T));
    }
  }
}
// Foreground pass (canopy/eaves), drawn last like the game's sysRenderForeground.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const kind = TILE_CHARS[rows[y][x]] || 'void';
    const fg = foregroundFor(cache, kind, x, y, kindAt, mapId);
    if (fg) blit(fg, x * T - 8, MARGIN + y * T - 16);
  }
}

// ---- emit P6 PPM ----
const header = Buffer.from(`P6\n${out.width} ${out.height}\n255\n`, 'ascii');
const rgb = Buffer.alloc(out.width * out.height * 3);
for (let i = 0, j = 0; i < out._px.length; i += 4, j += 3) {
  rgb[j] = out._px[i]; rgb[j + 1] = out._px[i + 1]; rgb[j + 2] = out._px[i + 2];
}
writeFileSync(outPath, Buffer.concat([header, rgb]));
console.log(`rendered ${mapId} ${map.name || ''} ${W}x${H} -> ${out.width}x${out.height} ${outPath}`);
