// render.mjs — Canvas 2D renderer with the ADR-007 perf budgets.
// DPR auto-tier: cap 2; tier to 1 on <=2GB RAM or software rasterizer.
// Viewport culling: only tiles/entities intersecting the camera rect are drawn.
// Hot-path rules: no shadowBlur, no per-frame gradients, imageSmoothingEnabled=false.

export const TILE = 16;

// UI v2 (Platinum standard): the UI typefaces are the two self-hosted OFL
// bitmap faces — Galmuri (display) and DotGothic16 (body). Canvas text uses
// the same stacks as the shell CSS tokens.
// UI v2.3 (defect 1): BODY text renders in DotGothic16 — the sturdy,
// even-stroke bitmap grotesque. Galmuri's hand-style letterforms read thin
// and handwritten for running text on the live build; it is kept for
// DISPLAY only (title screen, headings — see UI_DISPLAY_FONT_STACK and the
// --font-display CSS token). UI_FONT_STACK is the BODY stack: canvas body
// text (battle messages, databoxes, prompts) draws with it, and wrapText()
// measures with the identical string, so measure and render can never
// diverge again (the v2.2 mid-word clip: 'y/our first catch').
export const UI_FONT_STACK = "'PtGothic', 'PtGalmuri', system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";
// Display stack (headings / title / accents): Galmuri first.
export const UI_DISPLAY_FONT_STACK = "'PtGalmuri', 'PtGothic', system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";
// Platinum frame tones (canvas twins of the shell CSS tokens).
export const PT_FRAME = '#2b3040';
export const PT_FRAME2 = '#8d9bbf';
export const PT_PAPER = '#f6f8fc';
export const PT_PAPER2 = '#dfe6f2';
export const PT_RIVET = '#6d7ba3';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.scaleX = 1; this.scaleY = 1; // backing-store px per logical px
    this.viewW = 0; this.viewH = 0;   // logical px
    this.camX = 0; this.camY = 0;     // camera top-left in world px
    this.shakeX = 0; this.shakeY = 0; // screen-shake offset (px, logical)
    this.flashA = 0;                  // white flash overlay alpha
    this.fadeA = 0; this.fadeColor = '#000';
    this.autoTier();
  }

  autoTier() {
    let dpr = 1;
    try {
      const w = typeof window !== 'undefined' ? window : {};
      dpr = Math.min(2, w.devicePixelRatio || 1);
      const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
      if (mem <= 2) dpr = 1; // ADR-007: auto-tier to 1 on <=2GB RAM
    } catch (e) { dpr = 1; }
    this.dpr = dpr;
  }

  // Logical viewport (game px). Internal res capped by design (gameux §2).
  // Crisp-text fix: the backing store must match the on-screen CSS size
  // (cssW x cssH) times DPR — NOT logical x DPR. Scaling the backing store
  // from the logical size made the browser upscale the finished bitmap to
  // the (much larger) CSS box, smearing all canvas text. The world
  // transform therefore becomes backing/logical (scaleX/scaleY), so
  // drawing still happens in logical units at full display resolution.
  resize(logicalW, logicalH, cssW, cssH) {
    this.viewW = logicalW; this.viewH = logicalH;
    const bw = Math.round((cssW != null ? cssW : logicalW) * this.dpr);
    const bh = Math.round((cssH != null ? cssH : logicalH) * this.dpr);
    this.canvas.width = bw;
    this.canvas.height = bh;
    this.scaleX = logicalW ? bw / logicalW : this.dpr;
    this.scaleY = logicalH ? bh / logicalH : this.dpr;
    if (this.canvas.style) {
      this.canvas.style.width = (cssW != null ? cssW : logicalW) + 'px';
      this.canvas.style.height = (cssH != null ? cssH : logicalH) + 'px';
    }
  }

  begin() {
    const c = this.ctx;
    c.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, this.viewW, this.viewH);
    c.save();
    c.translate(-Math.round(this.camX) + this.shakeX, -Math.round(this.camY) + this.shakeY);
  }

  end() {
    const c = this.ctx;
    c.restore();
    if (this.flashA > 0) {
      c.fillStyle = 'rgba(255,255,255,' + this.flashA.toFixed(3) + ')';
      c.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.fadeA > 0) {
      c.globalAlpha = Math.min(1, this.fadeA);
      c.fillStyle = this.fadeColor;
      c.fillRect(0, 0, this.viewW, this.viewH);
      c.globalAlpha = 1;
    }
  }

  // Camera centers on a world point, clamped to map bounds.
  centerOn(wx, wy, mapWpx, mapHpx) {
    this.camX = Math.max(0, Math.min(mapWpx - this.viewW, wx - this.viewW / 2));
    this.camY = Math.max(0, Math.min(mapHpx - this.viewH, wy - this.viewH / 2));
    if (mapWpx <= this.viewW) this.camX = (mapWpx - this.viewW) / 2;
    if (mapHpx <= this.viewH) this.camY = (mapHpx - this.viewH) / 2;
  }

  // Viewport rect in world px — for culling.
  viewRect() {
    return {
      x0: this.camX - TILE, y0: this.camY - TILE,
      x1: this.camX + this.viewW + TILE, y1: this.camY + this.viewH + TILE,
    };
  }

  // Blit a pre-rendered offscreen sprite (zero per-frame allocation).
  blit(sprite, dx, dy) {
    const c = this.ctx;
    const w = sprite.width, h = sprite.height;
    // Cull against viewport
    if (dx + w < this.camX - TILE || dy + h < this.camY - TILE ||
        dx > this.camX + this.viewW + TILE || dy > this.camY + this.viewH + TILE) return;
    c.drawImage(sprite, Math.round(dx), Math.round(dy));
  }

  // Scaled blit for authored battlers (32px art -> 48px draw size).
  // imageSmoothingEnabled=false is set in begin(): crisp pixel scaling.
  blitS(sprite, dx, dy, w, h) {
    const c = this.ctx;
    if (dx + w < this.camX - TILE || dy + h < this.camY - TILE ||
        dx > this.camX + this.viewW + TILE || dy > this.camY + this.viewH + TILE) return;
    c.drawImage(sprite, Math.round(dx), Math.round(dy), Math.round(w), Math.round(h));
  }

  text(str, x, y, opts) {
    const o = opts || {};
    const c = this.ctx;
    c.font = (o.bold ? '700 ' : '400 ') + (o.size || 8) + 'px ' + (o.display ? UI_DISPLAY_FONT_STACK : UI_FONT_STACK);
    c.textBaseline = 'top';
    if (o.align) c.textAlign = o.align;
    if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.55)';
      c.fillText(str, x + 1, y + 1);
    }
    c.fillStyle = o.color || '#fff';
    c.fillText(str, x, y);
    if (o.align) c.textAlign = 'left';
  }

  // UI v2.3 (defect 1): word-wrap measured with the EXACT font string text()
  // renders with (same stack, size, weight) — breaks fall only on spaces,
  // so no line ever ends mid-word. A single word longer than maxW is the
  // one unavoidable exception: it is hard-split so the text still fits.
  // Returns an array of line strings (at most maxLines when given).
  wrapText(str, size, maxW, opts) {
    const o = opts || {};
    const c = this.ctx;
    c.font = (o.bold ? '700 ' : '400 ') + (size || 8) + 'px ' + (o.display ? UI_DISPLAY_FONT_STACK : UI_FONT_STACK);
    const words = String(str == null ? '' : str).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    const fits = (s) => c.measureText(s).width <= maxW;
    for (const word of words) {
      const trial = line ? line + ' ' + word : word;
      if (fits(trial)) { line = trial; continue; }
      if (line) { lines.push(line); line = ''; }
      if (fits(word)) { line = word; continue; }
      // Over-long single word: hard-split by characters (only case where a
      // break can fall inside a word — the word alone exceeds the line).
      let rest = word;
      while (rest && !fits(rest)) {
        let n = rest.length;
        while (n > 1 && !fits(rest.slice(0, n))) n--;
        lines.push(rest.slice(0, n));
        rest = rest.slice(n);
      }
      line = rest;
    }
    if (line) lines.push(line);
    const maxLines = o.maxLines || 0;
    return maxLines > 0 ? lines.slice(0, maxLines) : lines;
  }

  panel(x, y, w, h, fill, border) {
    // UI v2: every canvas panel is a Platinum window (see ptFrame). The
    // legacy (fill, border) signature is preserved for all callers; the
    // border argument is accepted for compatibility — the frame tones are
    // the Platinum standard on every surface.
    this.ptFrame(x, y, w, h, fill);
  }

  // Platinum window frame, rect-only (fillRect/strokeRect — the QA recording
  // ctx implements nothing else): interior fill, navy outer line, white
  // hairline, silver-blue inner line, corner rivets. `fill` may be any CSS
  // color (dark interiors keep light text readable — frame tones hold).
  ptFrame(x, y, w, h, fill) {
    const c = this.ctx;
    c.fillStyle = fill || PT_PAPER;
    c.fillRect(x, y, w, h);
    c.strokeStyle = PT_FRAME;
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1;
    c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    c.strokeStyle = PT_FRAME2;
    c.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
    c.fillStyle = PT_RIVET;
    const rx = [x + 8, x + w - 10], ry = [y + 8, y + h - 10];
    for (const px of rx) for (const py of ry) c.fillRect(px, py, 2, 2);
  }

  // Platinum databox (battle HP plate): stepped two-tone interior (light
  // top, cooler bottom — DS shading without gradient APIs), navy frame,
  // and the tag tail stepping toward the battler (bottom-left for the foe,
  // bottom-right for the ally). Rect-only, like ptFrame.
  ptPlate(x, y, w, h, isAlly) {
    const c = this.ctx;
    // drop shade (offset silhouette rect, not a shadow API)
    c.fillStyle = 'rgba(10,14,28,0.30)';
    c.fillRect(x + 2, y + 3, w, h);
    c.fillStyle = PT_PAPER;
    c.fillRect(x, y, w, h);
    c.fillStyle = PT_PAPER2;
    c.fillRect(x + 2, y + Math.floor(h / 2), w - 4, h - Math.floor(h / 2) - 2);
    c.strokeStyle = PT_FRAME;
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
    c.strokeStyle = PT_FRAME2;
    c.lineWidth = 1;
    c.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    // tag tail: two steps descending toward the battler
    const tx = isAlly ? x + w - 14 : x + 4;
    c.fillStyle = PT_PAPER2;
    c.fillRect(tx, y + h, 10, 3);
    c.fillRect(isAlly ? tx + 3 : tx, y + h + 3, 7, 3);
    c.fillStyle = PT_FRAME;
    c.fillRect(tx, y + h + 2, 10, 1);
  }

  // HP bar with colorblind-safe stripe overlay under 25% (gameux §7).
  // The stripes are STATIC (not motion) — they always draw; they are the
  // colorblind cue, never gated on reduced motion (Uix sign-off E6 fix).
  // UI v2: Platinum dress — navy-framed recessed track, bright DS fills,
  // 1px segment ticks like the DS bar's stepped rendering.
  hpBar(x, y, w, h, frac) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#2b3040';
    c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = '#484860';
    c.fillRect(x, y, w, h);
    const col = f > 0.5 ? '#48c848' : (f > 0.25 ? '#f8c830' : '#f84838');
    c.fillStyle = col;
    const fw = Math.floor((w - 2) * f);
    c.fillRect(x + 1, y + 1, fw, h - 2);
    c.fillStyle = 'rgba(43,48,64,0.35)';
    for (let sx = x + 5; sx < x + 1 + fw; sx += 4) c.fillRect(sx, y + 1, 1, h - 2);
    if (f <= 0.25 && f > 0) {
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let sx = x + 2; sx < x + w - 2; sx += 4) {
        c.fillRect(sx, y + 1, 1, h - 2);
      }
    }
  }

  // XP bar: Platinum blue, same recessed track as the HP bar. frac eases
  // out over 600ms in battle.
  xpBar(x, y, w, h, frac) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#2b3040';
    c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = '#484860';
    c.fillRect(x, y, w, h);
    c.fillStyle = '#3898f8';
    c.fillRect(x + 1, y + 1, Math.floor((w - 2) * f), h - 2);
  }
}
