// load-test.mjs — "sprites load in the game" verification (Art Director, Wave 2).
// Replays the game's own sprite-consumption path (buildTileCache / buildSprites /
// npcSprite equivalents) against a stub canvas that records fillRect into a
// real pixel buffer, using the GENERATED art-data.mjs. Asserts every sprite the
// game requests rasterizes to a non-empty canvas of the expected size.
// The wiring seat swaps the game's forge* calls for ART; this proves the payload
// is loadable through the same code path before that swap lands.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Stub canvas implementing the exact 2D calls the rasterizer uses.
function makeCtx(w, h) {
  const buf = new Uint8ClampedArray(w * h * 4);
  return {
    buf, w, h,
    set fillStyle(v) { this._fs = v; },
    get fillStyle() { return this._fs; },
    fillRect(x, y, ww, hh) {
      const [r, g, b] = hexRgb(this._fs);
      for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
        const o = ((y + j) * w + (x + i)) * 4;
        if (o < 0 || o + 3 >= buf.length) throw new Error(`fillRect out of bounds ${x},${y} ${ww}x${hh} on ${w}x${h}`);
        buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
      }
    },
    painted() { let n = 0; for (let i = 3; i < buf.length; i += 4) if (buf[i]) n++; return n; },
  };
}
const stubDoc = {
  createElement: () => {
    let ctx = null;
    const cv = {
      width: 0, height: 0,
      getContext: () => (ctx = ctx || makeCtx(cv.width || 16, cv.height || 16)),
      _ctx() { return ctx; },
    };
    return cv;
  },
};

// Mirror of the game's raster path: paint ART sprite rows as 1px fillRects.
function blitArtSprite(doc, art) {
  const cv = doc.createElement('canvas');
  cv.width = art.w; cv.height = art.h;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < art.h; y++) {
    for (let x = 0; x < art.w; x++) {
      const ch = art.rows[y][x];
      if (ch === '.') continue;
      ctx.fillStyle = art.pal[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return { cv, painted: ctx.painted() };
}

async function main() {
  const mod = await import(path.join(ROOT, 'art-data.mjs'));
  const ART = mod.ART;
  const ids = Object.keys(ART);
  let fails = 0;
  const byFamily = {};
  for (const id of ids) {
    const art = ART[id];
    try {
      const { painted } = blitArtSprite(stubDoc, art);
      if (painted === 0) { console.error(`FAIL ${id}: rasterized empty`); fails++; continue; }
      const fam = id.split('-')[0];
      byFamily[fam] = (byFamily[fam] || 0) + 1;
    } catch (e) {
      console.error(`FAIL ${id}: ${e.message}`); fails++;
    }
  }
  // game-consumption surface checks (what buildSprites/npcSprite/tileCache request)
  // NOTE: battlers are authored 64x64 since the Wave 0 size standard
  // (drawn at BATTLER_DRAW_SIZE 64, both sides); Wave 6a redrew the
  // always-on-screen set (partner + 28 species) to that standard.
  // Legacy 32x32 battlers upscale x2 through the same draw path.
  const need = {
    'ash-down-idle-1': [16, 16], 'ash-up-walk-4': [16, 16],
    'voltik-hop-1': [16, 20], 'partner-front': [64, 64], 'partner-back': [64, 64],
    'onix-front': [64, 64], 'geodude-front': [64, 64], 'brock-battle': [48, 64],
    'npc-professor-idle-1': [16, 16], 'tile-grass': [16, 16], 'icon-pokeball': [16, 16],
  };
  for (const [id, [w, h]] of Object.entries(need)) {
    const art = ART[id];
    if (!art) { console.error(`FAIL surface: missing ${id}`); fails++; continue; }
    if (art.w !== w || art.h !== h) { console.error(`FAIL surface: ${id} is ${art.w}x${art.h}, want ${w}x${h}`); fails++; }
  }
  // fix/voltik-follower: the follower set is VOLTIK. All 20 directional
  // frames + the refuse frame exist under voltik-* ids; the retired
  // pikachu-* follower ids are gone; and the front frame's palette is the
  // VOLTIK palette (mint + copper present, the old yellows absent).
  const followerIds = [], retiredIds = [];
  for (const p of ['voltik', 'voltik-up', 'voltik-left', 'voltik-right'])
    for (const a of ['idle-1', 'idle-2', 'hop-1', 'hop-2']) followerIds.push(`${p}-${a}`);
  followerIds.push('voltik-sleep-1', 'voltik-sleep-2', 'voltik-look-1', 'voltik-look-2', 'voltik-refuse');
  for (const p of ['pikachu', 'pikachu-up', 'pikachu-left', 'pikachu-right'])
    for (const a of ['idle-1', 'idle-2', 'hop-1', 'hop-2']) retiredIds.push(`${p}-${a}`);
  retiredIds.push('pikachu-sleep-1', 'pikachu-sleep-2', 'pikachu-look-1', 'pikachu-look-2', 'pikachu-refuse');
  for (const id of followerIds) if (!ART[id]) { console.error(`FAIL surface: missing ${id}`); fails++; }
  for (const id of retiredIds) if (ART[id]) { console.error(`FAIL surface: retired follower id still present: ${id}`); fails++; }
  const vpal = Object.values((ART['voltik-idle-1'] || {}).pal || {});
  if (!vpal.includes('#8dcaaa') || !vpal.includes('#bf6b41')) { console.error('FAIL surface: voltik-idle-1 palette lacks VOLTIK mint/copper'); fails++; }
  if (vpal.includes('#f5c93c') || vpal.includes('#ffdf6b')) { console.error('FAIL surface: voltik-idle-1 palette still paints the old yellows'); fails++; }
  console.log(`load-test: ${ids.length - fails}/${ids.length} sprites rasterize through the game path`);
  if (fails) { console.error(`LOAD-TEST FAIL: ${fails}`); process.exit(1); }
  console.log('LOAD-TEST PASS');
}

main();
