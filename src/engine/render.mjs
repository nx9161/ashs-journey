// render.mjs — Canvas 2D renderer with the ADR-007 perf budgets.
// DPR auto-tier: cap 2; tier to 1 on <=2GB RAM or software rasterizer.
// Viewport culling: only tiles/entities intersecting the camera rect are drawn.
// Hot-path rules: no shadowBlur, no per-frame gradients, imageSmoothingEnabled=false.

export const TILE = 16;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
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
  resize(logicalW, logicalH, cssW, cssH) {
    this.viewW = logicalW; this.viewH = logicalH;
    this.canvas.width = Math.round(logicalW * this.dpr);
    this.canvas.height = Math.round(logicalH * this.dpr);
    if (this.canvas.style) {
      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
    }
  }

  begin() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
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

  text(str, x, y, opts) {
    const o = opts || {};
    const c = this.ctx;
    c.font = (o.bold ? 'bold ' : '') + (o.size || 8) + 'px monospace';
    c.textBaseline = 'top';
    if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.55)';
      c.fillText(str, x + 1, y + 1);
    }
    c.fillStyle = o.color || '#fff';
    c.fillText(str, x, y);
  }

  panel(x, y, w, h, fill, border) {
    const c = this.ctx;
    c.fillStyle = fill || '#f8f8f0';
    c.fillRect(x, y, w, h);
    c.strokeStyle = border || '#202028';
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // HP bar with colorblind-safe stripe overlay under 25% (gameux §7).
  hpBar(x, y, w, h, frac, reducedMotion) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#28182c';
    c.fillRect(x, y, w, h);
    const col = f > 0.5 ? '#58c94f' : (f > 0.25 ? '#e8c832' : '#e84040');
    c.fillStyle = col;
    c.fillRect(x + 1, y + 1, Math.floor((w - 2) * f), h - 2);
    if (f <= 0.25 && f > 0 && !reducedMotion) {
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let sx = x + 2; sx < x + w - 2; sx += 4) {
        c.fillRect(sx, y + 1, 1, h - 2);
      }
    }
  }
}
