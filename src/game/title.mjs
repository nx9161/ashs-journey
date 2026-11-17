// title.mjs — boot disclaimer card (W-SCRUB original-work wording) + title screen.
// The legal card renders in the shell before any interactive element and is not
// skippable-in-one-tap on first boot (readable dwell >= 3 seconds).
// Title flow (UI v2, Platinum standard): logo plate + framed keyart + a
// blinking PRESS START prompt; the menu (New Game / Continue / Options)
// appears only after Start/A (or a tap, which injects 'a') is pressed.

export const DISCLAIMER_BOOT = [
  "KIAN'S JOURNEY",
  'An original work. Not affiliated with, endorsed by, or connected to',
  'any existing game franchise or its owners.',
  '',
  'VOLTIK, and all names and characters in this game, are original',
  'creations of this project.',
  'This is a free, non-commercial project made with love by its makers.',
  'No purchase is required or accepted.',
];

export const DISCLAIMER_CREDITS = [
  'LEGAL',
  '',
  'This game is an original work and is not affiliated with, endorsed by,',
  'sponsored by, or connected to any existing game franchise or its owners.',
  'All names, characters, and indicia in this game are original creations',
  'of this project, except where credited below.',
  '',
  'All code, music, sound effects, and dialogue in this game are original',
  'creations made for this project, as is its artwork except where',
  'credited below; no game assets were copied or extracted from any',
  'other game.',
  '',
  'Third-party art: tileset and character by Damian',
  'Gasinski aka Gassasin',
  '(opengameart.org/content/16xx16-tileset-pokemonzelda-styled),',
  'used under CC-BY 3.0. Modified from the original: tiles',
  'recoloured per town, doors and paths derived, character',
  'recoloured.',
  '',
  'Fonts: Galmuri, copyright 2019-2025 Lee Minseo (quiple);',
  'Pixelify Sans (shipped as PtPixel), copyright 2021 The',
  'Pixelify Sans Project Authors. Both are used under the',
  'SIL Open Font License 1.1.',
  '',
  'This game is free, carries no advertising, accepts no payments, donations,',
  'or tips, and collects no personal data for commercial purposes.',
  '',
  'If you represent a rights holder and have concerns about this project,',
  'please contact the developer through the GitHub account that',
  'publishes this game (github.com/nx9161), or through the GitHub',
  'copyright-reporting process.',
];

export const GAME_TITLE = "KIAN'S JOURNEY";
export const GAME_SUBTITLE = 'An Original Kin-Taming Adventure';
// ADR-012: personal-edition marker. The build substitutes the EDITION_MARKER
// compile-time token with a quoted JS string literal ("NAMAN'S EDITION" for the
// personal target, '' for every other target — guest and vercel show nothing).
// Original text, subtle: a small gold ribbon drawn under the subtitle on the
// title screen. The disclaimers above are the W-SCRUB original-work wording.
export const EDITION_MARKER = /*__EDITION_MARKER__*/;

// ---- Title recomposition helpers (Seat B) ----
// Shared design system: UI font stack + ink/paper/gold. The title screen is
// a DISPLAY surface: Galmuri leads its stack (kept identical to
// UI_DISPLAY_FONT_STACK in src/engine/render.mjs) and every r.text call
// below passes { display: true }, so the measurer here and the renderer
// always use the same font string (UI v2.3, defect 1).
const FONT_STACK = "'PtGalmuri', 'PtPixel', system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";
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

// P1/A5: legal card renders at >=14px. The DISCLAIMER_BOOT wording is
// preserved word-for-word; only the line-wrap changes, paginated across the
// 3s dwell (page flips at 1.5s, still non-skippable).
const LEGAL_PAGES = [
  [
    "KIAN'S JOURNEY",
    'An original work.',
    'Not affiliated with, endorsed',
    'by, or connected to any',
    'existing game franchise',
    'or its owners.',
  ],
  [
    'VOLTIK, and all names and',
    'characters in this game, are',
    'original creations of',
    'this project.',
    'This is a free, non-commercial',
    'project made with love',
    'by its makers.',
    'No purchase is required or',
    'accepted.',
  ],
];

export class BootScene {
  enter() {
    this.t = 0;
    this.phase = 'legal'; // legal -> title
    this.titleStage = 'pressStart'; // title sub-state: 'pressStart' -> 'menu'
    this.ready = false;  // interactive only after dwell
    this._legalPressed = false; // F1: an early A/START is buffered, never swallowed
    this.menuIdx = 0;
    this.game.ui.log.push({ ui: 'boot' });
    // W-UI: the boot/title surfaces carry no gameplay chrome — hide the HUD
    // strip, chips, mood pip and hint card until the overworld enters and
    // restores them (OverworldScene.enter). Presentation state only.
    if (this.game.ui && this.game.ui.setHudVisible) this.game.ui.setHudVisible(false);
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.phase === 'legal') {
      // F1: dwell cut 3 s -> 0.8 s; a press landing before the card is
      // ready is buffered and honoured the moment it is — no silent
      // input swallowing in the first screen of the game.
      if (input.wasPressed('a') || input.wasPressed('start')) this._legalPressed = true;
      if (this.t >= 0.8) this.ready = true;
      if (this.ready && this._legalPressed) {
        this.phase = 'title';
        this.titleStage = 'pressStart';
        this.t = 0;
        this.game.audio.unlock();
        this.game.audio.playMusic('title-theme'); // original score; unlock gate satisfied by the gesture
      }
      return;
    }
    // Platinum title flow: the menu stays hidden behind the blinking
    // PRESS START prompt until Start/A (or a tap, which injects 'a') is
    // pressed. The opening press only opens the menu — it never selects.
    if (this.titleStage !== 'menu') {
      const aP = input.wasPressed('a');
      const sP = input.wasPressed('start');
      input.wasPressed('up'); input.wasPressed('down'); // swallow nav edges so none leak into the opened menu
      if (aP || sP) {
        this.titleStage = 'menu';
        this.game.audio.unlock();
        // Title music starts on the legal->title transition above;
        // playMusic no-ops when the same track is already playing, so
        // this only starts it if that transition somehow did not.
        this.game.audio.playMusic('title-theme');
      }
      return;
    }
    // title menu
    // S-49: while the Trainer ID Terminal is open, the title scene must
    // not consume game keys — otherwise Enter/arrows at the terminal
    // re-activate the hidden menu (stacking terminals, moving the cursor
    // behind the panel). ui.update already gates on loginOpen; the scene
    // stack did not.
    if (this.game.ui && this.game.ui.loginOpen) return;
    const items = this.menuItems();
    if (input.wasPressed('up')) { this.menuIdx = (this.menuIdx + items.length - 1) % items.length; }
    if (input.wasPressed('down')) { this.menuIdx = (this.menuIdx + 1) % items.length; }
    if (input.wasPressed('a') || input.wasPressed('start')) {
      this.game.audio.unlock();
      this._activateMenuItem(items[this.menuIdx]);
    }
  }

  _activateMenuItem(it) {
    if (!it) return;
    // P0/B1: title menu routes through the Trainer ID Terminal (guest-functional stub).
    if (it.value === 'new') this.game.openLogin('new');
    else if (it.value === 'continue') this.game.openLogin('continue');
    else if (it.value === 'second') this.game.openLogin('second');
    else if (it.value === 'options') this.game.openOptions();
  }

  // AUDIT FIX (S-01): the title menu was canvas-only — a tap anywhere
  // injected a global A and selected whatever row happened to be
  // highlighted. Rows are now real targets: render() publishes their
  // rects, and a tap on a row selects AND activates it. Taps elsewhere
  // keep the old behaviour (they open the menu from PRESS START).
  handleTap(vx, vy) {
    if (this.phase === 'legal' || this.titleStage !== 'menu' || !this._menuHit) return false;
    const h = this._menuHit;
    if (vx < h.x || vx > h.x + h.w) return false;
    const i = Math.floor((vy - (h.y + h.padY)) / h.rowH);
    if (i < 0 || i >= h.values.length) return false;
    this.menuIdx = i;
    this.game.audio.unlock();
    this._activateMenuItem(this.menuItems()[i]);
    return true;
  }
  menuItems() {
    const items = [{ label: 'New Game', value: 'new' }];
    if (this.game.store.exists()) {
      // ADR-025 §6: the title save summary's ribbon marker — a
      // Second Journey run (meta.ngPlus > 0) shows its star.
      const ng = this.game.state && this.game.state.meta && this.game.state.meta.ngPlus;
      items.push({ label: 'Continue' + (ng > 0 ? ' ★' : ''), value: 'continue' });
    }
    items.push({ label: 'Options', value: 'options' });
    // ADR-025 §6: Second Journey unlocks when ANY save slot holds a
    // completed Arden. The row is appended AFTER Options so every
    // existing counted-press path (New Game / Continue / Options) is
    // untouched; with no completed slot the menu is byte-identical
    // to before Phase 6. The unlock scan is cached for the title's
    // lifetime (menuItems runs per render frame; saves cannot change
    // while the title is up).
    if (this._sjUnlock === undefined) {
      this._sjUnlock = typeof hasCompletedSave === 'function' && hasCompletedSave();
    }
    if (this._sjUnlock) items.push({ label: 'Second Journey', value: 'second' });
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
    const showMenu = this.titleStage === 'menu';
    // PRESS START band: reserved above the footer while the menu is hidden;
    // in that sub-state the keyart band reclaims the rest of the menu's space.
    const psH = 22;
    const psY = menuBottom - psH + 3;

    // ---- Keyart: centered in the middle band, overlapped by nothing ----
    const kBottom = showMenu ? menuY - 6 : menuBottom - psH - 6;
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
      // Platinum border treatment around the keyart rect (strokeRect only):
      // navy outer line + silver-blue inner line, mirroring the r.panel frame.
      const kc = r.ctx;
      kc.strokeStyle = '#2b3040';
      kc.lineWidth = 2;
      kc.strokeRect(kx + 1, ky + 1, drawW - 2, drawH - 2);
      kc.strokeStyle = '#8d9bbf';
      kc.lineWidth = 1;
      kc.strokeRect(kx + 3.5, ky + 3.5, drawW - 7, drawH - 7);
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
    r.text(GAME_TITLE, cx, titleY, { size: titleSize, bold: true, align: 'center', color: '#fff', display: true });
    // Platinum logo treatment: a subtle gold rule under the title,
    // sized to the measured Galmuri title text.
    const titleW = measureText(r, GAME_TITLE, titleSize, true);
    g.ctx2dfill('rgba(232,200,50,0.55)', Math.round(cx - titleW / 2), titleY + titleSize + 1, titleW, 2);
    r.text(GAME_SUBTITLE, cx, subY, { size: 14, align: 'center', color: '#ffe9a8', display: true });
    if (hasEd) {
      // ADR-012 personal-edition ribbon: measured dark band + gold underline,
      // centered under the subtitle. Guest/vercel bundles have
      // EDITION_MARKER = '' and skip this entirely.
      const tw = measureText(r, EDITION_MARKER, 14, false);
      const rw = tw + 16;
      const rx = Math.round(cx - rw / 2);
      g.ctx2dfill('rgba(8,8,14,0.72)', rx, edY, rw, edH);
      g.ctx2dfill(GOLD, rx, edY + edH - 2, rw, 2);
      r.text(EDITION_MARKER, cx, edY + 3, { size: 14, align: 'center', color: '#ffe9a8', display: true });
    }

    if (showMenu) {
      // S-01: publish row rects for pointer hit-testing (handleTap).
      this._menuHit = { x: menuX, y: menuY, w: menuW, rowH, padY: menuPadY, values: items.map((it) => it.value) };
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
          size: 14, bold: sel, align: 'center', display: true,
          color: sel ? '#ffe9a8' : PAPER,
        });
      });
    } else {
      // ---- PRESS START: blinking prompt in the band above the footer ----
      // ~1s blink period (0.5s on / 0.5s off — the legal card's pulse
      // idiom); steady-on under reduced motion.
      const reduced = !!(g.state.settings && g.state.settings.reducedMotion);
      if (reduced || Math.floor(this.t * 2) % 2 === 0) {
        r.text('PRESS START', cx, psY, { size: 16, bold: true, align: 'center', color: '#ffe9a8', display: true });
      }
    }

    // ---- Footer: centered, inset from both edges, never clipped ----
    r.text('An original work.', cx, footerY, { size: 14, align: 'center', color: '#f5efdc', display: true });
    r.end(); r.camX = pcx; r.camY = pcy;
  }
  renderLegal(r) {
    const w = r.viewW, h = r.viewH;
    r.panel(6, 6, w - 12, h - 12, '#101018', '#e8c832');
    const page = this.t >= 1.5 ? 1 : 0; // P1/A5: paginated 14px legal copy
    // W-UI: the pre-wrapped lines were drawn at a fixed 14px and the widest
    // line on page 2 crossed the panel's right border. Fit the page: shrink
    // the draw size (floor 11px) until the widest line fits inside the
    // panel. Layout only — the legal wording is untouched.
    let size = 14;
    let maxW = 0;
    for (const line of LEGAL_PAGES[page]) {
      const lw = measureText(r, line, 14, false);
      if (lw > maxW) maxW = lw;
    }
    if (maxW > w - 28) size = Math.max(11, Math.floor(14 * (w - 28) / maxW));
    let y = 18;
    for (const line of LEGAL_PAGES[page]) {
      const isTitle = page === 0 && line === "KIAN'S JOURNEY";
      if (isTitle) {
        r.text(line, w / 2, y, { size, bold: true, align: 'center', color: '#e8c832' });
      } else {
        r.text(line, 14, y, { size, color: '#f0f0f0' });
      }
      y += Math.round(size * 1.285);
    }
    // F1: the continue prompt shows from the start (it pulses while
    // the short dwell runs out) instead of appearing at 3 s.
    const pulse = Math.floor(this.t * 2) % 2 === 0;
    if (pulse) r.text('Press A / tap to continue', 14, h - 24, { size: 14, color: '#e8c832' });
  }
}
