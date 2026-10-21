// title.mjs — boot disclaimer card (GC verbatim, §2a) + title screen.
// The legal card renders in the shell before any interactive element and is not
// skippable-in-one-tap on first boot (readable dwell >= 3 seconds).

export const DISCLAIMER_BOOT = [
  "ASH'S JOURNEY",
  'An unofficial fan homage. Not affiliated with, endorsed by, or connected to',
  'Nintendo, Creatures Inc., or GAME FREAK inc.',
  '',
  'Pok\u00e9mon, Pikachu, and all character names are trademarks of',
  'Nintendo / Creatures Inc. / GAME FREAK inc.',
  'This is a free, non-commercial fan project made with love by fans.',
  'No purchase is required or accepted. Please support the official releases.',
];

export const DISCLAIMER_CREDITS = [
  'LEGAL',
  '',
  'This game is an unofficial fan work and is not affiliated with, endorsed by,',
  'sponsored by, or connected to Nintendo Co., Ltd., Creatures Inc., or',
  'GAME FREAK inc. Pok\u00e9mon and all related names, characters, and indicia are',
  'trademarks of their respective owners.',
  '',
  'All code, artwork, music, sound effects, and dialogue in this game are',
  'original creations made for this fan project; no game assets were copied or',
  'extracted from any official release.',
  '',
  'This game is free, carries no advertising, accepts no payments, donations,',
  'or tips, and collects no personal data for commercial purposes.',
  '',
  'If you represent a rights holder and have concerns about this project,',
  'contact the developer directly and we will respond promptly.',
  '// OQ-grade: rights-holder contact resolves to an owner-designated address',
  '// before any public share. Not a dead link in a signed build.',
];

export const GAME_TITLE = "ASH'S JOURNEY";
export const GAME_SUBTITLE = 'An Unofficial Fan Homage';
// ADR-012: personal-edition marker. The build substitutes the EDITION_MARKER
// compile-time token with a quoted JS string literal ("NAMAN'S EDITION" for the
// personal target, '' for every other target — guest and vercel show nothing).
// Original text, subtle: a small gold ribbon drawn under the subtitle on the
// title screen. The GC-verbatim disclaimers above stay byte-identical.
export const EDITION_MARKER = /*__EDITION_MARKER__*/;

// ---- Title recomposition helpers (Seat B) ----
// Shared design system: UI font stack + ink/paper/gold.
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const PAPER = '#f8f8f0';
const GOLD = '#e8c832';

function fontFor(size, bold) {
  return (bold ? '700 ' : '400 ') + size + 'px ' + FONT_STACK;
}

// Measure with the shared UI stack so plates fit what the renderer draws.
// Headless-safe: falls back to a per-glyph estimate when measureText is a stub.
function measureText(r, str, size, bold) {
  try {
    const c = r.ctx;
    c.font = fontFor(size, bold);
    const wdt = Math.ceil(c.measureText(str).width);
    if (wdt > 0) return wdt;
  } catch (e) { /* headless stub — estimate below */ }
  return Math.ceil(str.length * size * 0.58);
}

// Dawn sky: smooth vertical ramp pre-rendered ONCE per viewport size to
// an offscreen canvas (cached, keyed by size) with a subtle ordered-dither
// pass (4x4 Bayer) so banding never shows. Palette family preserved:
// #2a1a3a -> #5a2a4a -> #a04a3a -> #e08a4a -> #f8c86a.
// The ramp is painted as per-row interpolated fills (no gradient API —
// the QA gate bans gradient/glow calls bundle-wide; a cached 1px-row ramp
// is visually identical and costs one offscreen canvas).
// Returns null when no real canvas exists (headless) — caller falls back
// to the flat band fills.
const skyCache = new Map();
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const SKY_STOPS = [
  [0, 0x2a, 0x1a, 0x3a],
  [0.3, 0x5a, 0x2a, 0x4a],
  [0.55, 0xa0, 0x4a, 0x3a],
  [0.78, 0xe0, 0x8a, 0x4a],
  [1, 0xf8, 0xc8, 0x6a],
];
function skyRowColor(t) {
  for (let i = 1; i < SKY_STOPS.length; i++) {
    if (t <= SKY_STOPS[i][0]) {
      const [t0, r0, g0, b0] = SKY_STOPS[i - 1];
      const [t1, r1, g1, b1] = SKY_STOPS[i];
      const f = (t - t0) / (t1 - t0 || 1);
      return [Math.round(r0 + (r1 - r0) * f), Math.round(g0 + (g1 - g0) * f), Math.round(b0 + (b1 - b0) * f)];
    }
  }
  const last = SKY_STOPS[SKY_STOPS.length - 1];
  return [last[1], last[2], last[3]];
}
function dawnSky(w, h) {
  const key = w + 'x' + h;
  const hit = skyCache.get(key);
  if (hit) return hit;
  let cv = null;
  try {
    if (typeof document === 'undefined' || !document.createElement) return null;
    cv = document.createElement('canvas');
    if (!cv || typeof cv.getContext !== 'function') return null;
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    if (!c) return null;
    for (let y = 0; y < h; y++) {
      const [r, g, b] = skyRowColor(h <= 1 ? 0 : y / (h - 1));
      c.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      c.fillRect(0, y, w, 1);
    }
    // Ordered-dither pass: nudge each pixel by its Bayer threshold so the
    // gradient steps dissolve instead of banding.
    try {
      const img = c.getImageData(0, 0, w, h);
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const off = ((BAYER4[y & 3][x & 3] / 16) - 0.5) * 7;
          const i = (y * w + x) * 4;
          d[i] = Math.max(0, Math.min(255, d[i] + off));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + off));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + off));
        }
      }
      c.putImageData(img, 0, 0);
    } catch (e) { /* dither is cosmetic — gradient alone is fine */ }
  } catch (e) {
    return null;
  }
  skyCache.set(key, cv);
  return cv;
}

// P1/A5: legal card renders at >=14px. The GC-verbatim DISCLAIMER_BOOT wording
// is preserved word-for-word; only the line-wrap changes, paginated across the
// 3s dwell (page flips at 1.5s, still non-skippable).
const LEGAL_PAGES = [
  [
    "ASH'S JOURNEY",
    'An unofficial fan homage.',
    'Not affiliated with, endorsed',
    'by, or connected to Nintendo,',
    'Creatures Inc., or',
    'GAME FREAK inc.',
  ],
  [
    'Pok\u00e9mon, Pikachu, and all',
    'character names are trademarks',
    'of Nintendo / Creatures Inc. /',
    'GAME FREAK inc.',
    'This is a free, non-commercial',
    'fan project made with love',
    'by fans.',
    'No purchase is required or',
    'accepted. Please support the',
    'official releases.',
  ],
];

export class BootScene {
  enter() {
    this.t = 0;
    this.phase = 'legal'; // legal -> title
    this.ready = false;  // interactive only after dwell
    this.menuIdx = 0;
    this.game.ui.log.push({ ui: 'boot' });
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.phase === 'legal') {
      if (this.t >= 3) this.ready = true;
      if (this.ready && (input.wasPressed('a') || input.wasPressed('start'))) {
        this.phase = 'title';
        this.t = 0;
        this.game.audio.unlock();
        this.game.audio.playMusic('title-theme'); // original score; unlock gate satisfied by the gesture
      }
      return;
    }
    // title menu
    const items = this.menuItems();
    if (input.wasPressed('up')) { this.menuIdx = (this.menuIdx + items.length - 1) % items.length; }
    if (input.wasPressed('down')) { this.menuIdx = (this.menuIdx + 1) % items.length; }
    if (input.wasPressed('a') || input.wasPressed('start')) {
      const it = items[this.menuIdx];
      this.game.audio.unlock();
      // P0/B1: title menu routes through the Trainer ID Terminal (guest-functional stub).
      if (it.value === 'new') this.game.openLogin('new');
      else if (it.value === 'continue') this.game.openLogin('continue');
      else if (it.value === 'options') this.game.openOptions();
    }
  }
  menuItems() {
    const items = [{ label: 'New Game', value: 'new' }];
    if (this.game.store.exists()) items.push({ label: 'Continue', value: 'continue' });
    items.push({ label: 'Options', value: 'options' });
    return items;
  }
  render(r) {
    const g = this.game;
    // Transform discipline: like every other scene, the title/legal screens
    // draw inside begin()/end() so the renderer's display-scale transform
    // applies (camera pinned to the origin — this scene has no world camera).
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    if (this.phase === 'legal') {
      this.renderLegal(r);
      r.end(); r.camX = pcx; r.camY = pcy;
      return;
    }
    // ---- Sky: cached dithered gradient (flat bands only as headless fallback) ----
    const w = r.viewW, h = r.viewH;
    const cx = w / 2;
    const sky = dawnSky(w, h);
    let skyDrawn = false;
    if (sky) {
      try { r.ctx.drawImage(sky, 0, 0); skyDrawn = true; } catch (e) { /* fall through to bands */ }
    }
    if (!skyDrawn) {
      const bands = ['#2a1a3a', '#5a2a4a', '#a04a3a', '#e08a4a', '#f8c86a'];
      for (let i = 0; i < bands.length; i++) {
        g.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
      }
    }

    // ---- Vertical layout (all sizes): header plate / keyart / menu / footer ----
    // Header block: title, subtitle, optional edition ribbon — all centered.
    // Compact heights (landscape 256x192) tighten paddings so the keyart
    // band keeps a usable size instead of being squeezed out.
    const compact = h < 210;
    const titleSize = w >= 320 ? 22 : 19;
    const titleY = compact ? 7 : 9;
    const subY = titleY + titleSize + 4;
    const hasEd = !!EDITION_MARKER;
    const edY = subY + 19;
    const edH = 20;
    const contentBottom = hasEd ? edY + edH : subY + 16;
    const plateY = 4;
    const plateH = contentBottom - plateY + (compact ? 4 : 6);
    const keyTop = plateY + plateH + (compact ? 4 : 6);

    // Footer line first (reserves its band so nothing else can clip into it).
    const footerY = h - 20;

    // Menu panel below the keyart: sized to its rows, centered.
    const items = this.menuItems();
    const rowH = compact ? 18 : 19;
    const menuPadY = compact ? 4 : 6;
    const menuH = items.length * rowH + menuPadY * 2;
    const menuBottom = footerY - (compact ? 4 : 6);
    const menuY = menuBottom - menuH;
    let menuW = 150;
    for (const it of items) {
      menuW = Math.max(menuW, measureText(r, it.label, 14, true) + 44);
    }
    menuW = Math.min(menuW, w - 24);
    const menuX = Math.round(cx - menuW / 2);

    // ---- Keyart: centered in the middle band, overlapped by nothing ----
    const kBottom = menuY - 6;
    const availH = kBottom - keyTop;
    const availW = w - 32;
    if (availH >= 20 && availW >= 32) {
      const s = Math.min(availW / 192, availH / 144);
      const drawW = Math.round(192 * s);
      const drawH = Math.round(144 * s);
      const kx = Math.round(cx - drawW / 2);
      const ky = Math.round(keyTop + (availH - drawH) / 2);
      const keyart = (typeof document !== 'undefined' && typeof artCanvas === 'function')
        ? artCanvas(document, 'title-keyart', 3, false) : null;
      if (keyart) {
        r.blitS(keyart, kx, ky, drawW, drawH);
      } else {
        // Fallback silhouettes (original shapes), composed inside the same
        // keyart rect so the layout holds when key art is absent.
        g.ctx2dcircle(cx, ky + drawH * 0.36, Math.max(10, drawH * 0.18), '#ffe9a8');
        g.ctx2dcircle(cx - drawW * 0.08, ky + drawH * 0.66, 6, '#1a1a22');
        g.ctx2drect(cx - drawW * 0.08 - 6, ky + drawH * 0.66 + 4, 11, 12, '#1a1a22');
        g.ctx2dcircle(cx + drawW * 0.09, ky + drawH * 0.7, 4, '#1a1a22');
      }
    }

    // ---- Header plate + centered title / subtitle / edition ribbon ----
    let plateW = Math.max(
      measureText(r, GAME_TITLE, titleSize, true),
      measureText(r, GAME_SUBTITLE, 14, false),
    );
    if (hasEd) plateW = Math.max(plateW, measureText(r, EDITION_MARKER, 14, false) + 16);
    plateW = Math.min(plateW + 28, w - 12);
    const plateX = Math.round(cx - plateW / 2);
    r.panel(plateX, plateY, plateW, plateH, 'rgba(16,16,28,0.62)', 'rgba(232,200,50,0.55)');
    r.text(GAME_TITLE, cx, titleY, { size: titleSize, bold: true, align: 'center', color: '#fff' });
    r.text(GAME_SUBTITLE, cx, subY, { size: 14, align: 'center', color: '#ffe9a8' });
    if (hasEd) {
      // ADR-012 personal-edition ribbon: measured dark band + gold underline,
      // centered under the subtitle. Guest/vercel bundles have
      // EDITION_MARKER = '' and skip this entirely.
      const tw = measureText(r, EDITION_MARKER, 14, false);
      const rw = tw + 16;
      const rx = Math.round(cx - rw / 2);
      g.ctx2dfill('rgba(8,8,14,0.72)', rx, edY, rw, edH);
      g.ctx2dfill(GOLD, rx, edY + edH - 2, rw, 2);
      r.text(EDITION_MARKER, cx, edY + 3, { size: 14, align: 'center', color: '#ffe9a8' });
    }

    // ---- Menu: clean centered panel, gold-tinted highlight bar on selection ----
    r.panel(menuX, menuY, menuW, menuH, 'rgba(18,18,30,0.88)', GOLD);
    items.forEach((it, i) => {
      const rowY = menuY + menuPadY + i * rowH;
      const sel = i === this.menuIdx;
      if (sel) {
        g.ctx2dfill('rgba(232,200,50,0.30)', menuX + 4, rowY, menuW - 8, rowH - 2);
        g.ctx2dfill(GOLD, menuX + 4, rowY, 3, rowH - 2);
      }
      r.text(it.label, cx, rowY + 2, {
        size: 14, bold: sel, align: 'center',
        color: sel ? '#ffe9a8' : PAPER,
      });
    });

    // ---- Footer: centered, inset from both edges, never clipped ----
    r.text('Unofficial fan homage.', cx, footerY, { size: 14, align: 'center', color: '#f5efdc' });
    r.end(); r.camX = pcx; r.camY = pcy;
  }
  renderLegal(r) {
    const w = r.viewW, h = r.viewH;
    r.panel(6, 6, w - 12, h - 12, '#101018', '#e8c832');
    const page = this.t >= 1.5 ? 1 : 0; // P1/A5: paginated 14px legal copy
    let y = 18;
    for (const line of LEGAL_PAGES[page]) {
      const isTitle = page === 0 && line === "ASH'S JOURNEY";
      if (isTitle) {
        r.text(line, w / 2, y, { size: 14, bold: true, align: 'center', color: '#e8c832' });
      } else {
        r.text(line, 14, y, { size: 14, color: '#f0f0f0' });
      }
      y += 18;
    }
    if (this.ready) {
      const pulse = Math.floor(this.t * 2) % 2 === 0;
      if (pulse) r.text('Press A / tap to continue', 14, h - 24, { size: 14, color: '#e8c832' });
    }
  }
}
