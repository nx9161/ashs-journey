// ui-panels.mjs — the two read-only information panels of the UI:
// the Dex entry panel (Elevation B5) + the graphical Town Map panel
// (Elevation B1), extracted verbatim from ui.mjs by War Room W7
// (Cap Relief): the B2-R1 frozen cap is relieved by extraction into
// registered sibling modules, never by raising the cap. Attached to
// UI.prototype on the battle-rt/main-systems pattern; every caller
// reaches these through the UI instance, exactly as before.

import { SFX } from '../engine/audio.mjs';
import { UI } from './ui.mjs';

Object.assign(UI.prototype, {
  // ---- Dex entry panel (Elevation B5) ----
  // A single-plate panel in the summary family: the caller composes the
  // entry body per species; this class owns the chrome and the paging
  // keys (routed in update()). cb receives ('page', -1|1) and ('close').
  buildEntryPanel() {
    this.entryEl = this.el('div', 'entrypanel hidden', this.frame);
    this.entryHead = this.el('div', 'entryhead', this.entryEl);
    this.entryBody = this.el('div', 'entrybody', this.entryEl);
    const close = this.el('button', 'sumclose', this.entryEl);
    close.textContent = 'Close';
    close.addEventListener('pointerdown', (e) => { e.preventDefault(); this.closeEntryPanel(); });
    // Pointer paging: tap the header's edge arrows (rendered in the title).
    this.entryHead.addEventListener('pointerdown', (e) => {
      if (!this.entryPanel) return;
      e.preventDefault();
      const r = this.entryHead.getBoundingClientRect();
      if (!r || !r.width) return;
      const frac = (e.clientX - r.left) / r.width;
      if (frac < 0.18) this.entryPanel.cb('page', -1);
      else if (frac > 0.82) this.entryPanel.cb('page', 1);
    });
  },

  showEntryPanel(data, cb) {
    this.entryPanel = { data, cb: cb || null };
    this.log.push({ ui: 'dexentry', title: data && data.title });
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.add('menu-full');
    if (!this.headless) this.renderEntryPanel();
  },

  renderEntryPanel() {
    if (this.headless || !this.entryEl) return;
    const p = this.entryPanel;
    if (!p) { this.entryEl.classList.add('hidden'); return; }
    this.entryEl.classList.remove('hidden');
    this.entryHead.textContent = p.data.title || '';
    this.entryBody.innerHTML = p.data.bodyHtml || '';
  },

  updateEntryPanel(data) {
    if (!this.entryPanel) return;
    this.entryPanel.data = data;
    if (!this.headless) this.renderEntryPanel();
  },

  closeEntryPanel() {
    const p = this.entryPanel;
    if (!p) return;
    this.entryPanel = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.entryEl) this.entryEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    if (p.cb) p.cb('close');
  },

  get entryOpen() { return !!this.entryPanel; },

  // ---- Graphical Town Map panel (Elevation B1) ----
  // A canvas map in a Platinum window, PC-panel pattern: the caller
  // (Game.openTownMap) supplies the reached-gated node list + link pairs
  // on a hand-authored layout; this class owns the chrome, the cursor,
  // the canvas drawing (flat plates only) and a DOM narration element
  // whose text names the map + the place under the cursor, so the map
  // is verifiable without reading pixels (the sign-narration pattern).
  buildMapPanel() {
    this.mapEl = this.el('div', 'mappanel hidden', this.frame);
    const head = this.el('div', 'maptitle', this.mapEl);
    head.textContent = 'TOWN MAP — ARDEN';
    this.mapCanvas = this.el('canvas', 'mapcanvas', this.mapEl);
    if (this.mapCanvas) { this.mapCanvas.width = 480; this.mapCanvas.height = 300; }
    this.mapNarr = this.el('div', 'mapnarr', this.mapEl);
    const foot = this.el('div', 'mapfoot', this.mapEl);
    foot.textContent = 'Arrows: move · B: close';
    const close = this.el('button', 'sumclose', this.mapEl);
    close.textContent = 'Close';
    close.addEventListener('pointerdown', (e) => { e.preventDefault(); this.closeMapPanel(); });
    if (this.mapCanvas && this.mapCanvas.addEventListener) {
      this.mapCanvas.addEventListener('pointerdown', (e) => {
        if (!this.mapPanel) return;
        e.preventDefault();
        const r = this.mapCanvas.getBoundingClientRect();
        if (!r || !r.width) return;
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        let best = -1, bd = 0.02;
        this.mapPanel.data.nodes.forEach((n, i) => {
          const d = (n.x - nx) * (n.x - nx) + (n.y - ny) * (n.y - ny);
          if (d < bd) { bd = d; best = i; }
        });
        if (best >= 0) { this.mapPanel.cursor = best; this.game.audio.playSfx(SFX['ui-tick']); this.renderMapCanvas(); this._mapNarrate(); }
      });
    }
  },

  // data: { nodes: [{id, name, x, y, town, current}], links: [[i, j], ...] }
  showMapPanel(data, cb) {
    let cursor = data.nodes.findIndex((n) => n.current);
    if (cursor < 0) cursor = 0;
    this.mapPanel = { data, cursor, cb: cb || null };
    this.log.push({ ui: 'townmap', nodes: data.nodes.map((n) => n.name), current: data.nodes[cursor] ? data.nodes[cursor].name : null });
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.add('menu-full');
    if (!this.headless) {
      this.mapEl.classList.remove('hidden');
      this.renderMapCanvas();
      this._mapNarrate();
    }
  },

  _mapNarrate() {
    if (this.headless || !this.mapNarr || !this.mapPanel) return;
    const n = this.mapPanel.data.nodes[this.mapPanel.cursor];
    this.mapNarr.textContent = 'Town Map — Arden · ' + (n ? n.name + (n.current ? ' (you are here)' : '') : 'Nowhere yet');
  },

  mapMove(dir) {
    const p = this.mapPanel;
    if (!p || p.data.nodes.length < 2) return;
    const cur = p.data.nodes[p.cursor];
    let best = -1, bestScore = Infinity;
    p.data.nodes.forEach((n, i) => {
      if (i === p.cursor) return;
      const dx = n.x - cur.x, dy = n.y - cur.y;
      let primary, perp;
      if (dir === 'left') { primary = -dx; perp = Math.abs(dy); }
      else if (dir === 'right') { primary = dx; perp = Math.abs(dy); }
      else if (dir === 'up') { primary = -dy; perp = Math.abs(dx); }
      else { primary = dy; perp = Math.abs(dx); }
      if (primary <= 0.005) return;
      const score = primary + perp * 2.2;
      if (score < bestScore) { bestScore = score; best = i; }
    });
    if (best >= 0) {
      p.cursor = best;
      this.game.audio.playSfx(SFX['ui-tick']);
      this.renderMapCanvas();
      this._mapNarrate();
    }
  },

  renderMapCanvas() {
    if (this.headless || !this.mapCanvas || !this.mapPanel) return;
    const x = this.mapCanvas.getContext('2d');
    if (!x) return;
    const W = 480, H = 300;
    const p = this.mapPanel;
    const nodes = p.data.nodes;
    const px = (n) => Math.round(n.x * (W - 48)) + 24;
    const py = (n) => Math.round(n.y * (H - 48)) + 24;
    // Sea + landmass: flat plates only (Platinum law — no gradients).
    x.fillStyle = '#5a9ae8'; x.fillRect(0, 0, W, H); // sea: the HUD dex-screen blue
    x.fillStyle = '#a9c08a'; // land: the LCD plate green (--lcd)
    x.beginPath();
    const land = [[0.03, 0.30], [0.10, 0.13], [0.30, 0.05], [0.55, 0.04], [0.78, 0.08], [0.92, 0.22], [0.94, 0.45], [0.86, 0.66], [0.78, 0.88], [0.58, 0.99], [0.30, 0.97], [0.13, 0.86], [0.10, 0.62], [0.04, 0.48]];
    land.forEach(([lx, ly], i) => { const X = lx * W, Y = ly * H; if (i === 0) x.moveTo(X, Y); else x.lineTo(X, Y); });
    x.closePath(); x.fill();
    x.strokeStyle = '#46543a'; x.lineWidth = 2; x.stroke(); // the LCD plate border green
    // Caldera is an island off the SW coast.
    x.fillStyle = '#a9c08a'; // land: the LCD plate green (--lcd)
    x.fillRect(Math.round(0.10 * W), Math.round(0.86 * H), 52, 26);
    x.strokeRect(Math.round(0.10 * W), Math.round(0.86 * H), 52, 26);
    // Route links between visited places.
    x.strokeStyle = '#f6f8fc'; x.lineWidth = 2;
    for (const [a, b] of p.data.links) {
      if (!nodes[a] || !nodes[b]) continue;
      x.beginPath(); x.moveTo(px(nodes[a]), py(nodes[a])); x.lineTo(px(nodes[b]), py(nodes[b])); x.stroke();
    }
    // Nodes: towns are framed plates, routes are dots.
    const pulse = Math.floor(Date.now() / 500) % 2 === 0;
    nodes.forEach((n, i) => {
      const X = px(n), Y = py(n);
      if (n.town) {
        x.fillStyle = n.current ? '#e8b832' : '#f6f8fc';
        x.fillRect(X - 6, Y - 6, 12, 12);
        x.strokeStyle = '#2b3040'; x.lineWidth = 2; x.strokeRect(X - 6, Y - 6, 12, 12);
        x.fillStyle = '#c03028'; x.fillRect(X - 3, Y - 6, 6, 3);
      } else {
        x.fillStyle = '#f6f8fc';
        x.beginPath(); x.arc(X, Y, 3.5, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#2b3040'; x.lineWidth = 1.5; x.stroke();
      }
      if (n.current && pulse) {
        x.strokeStyle = '#e03c31'; x.lineWidth = 2;
        x.beginPath(); x.arc(X, Y, 11, 0, Math.PI * 2); x.stroke();
      }
      if (i === p.cursor) {
        x.strokeStyle = '#e03c31'; x.lineWidth = 2;
        x.strokeRect(X - 10, Y - 10, 20, 20);
      }
    });
    // Selected place name plate (canvas twin of the DOM narration).
    const cur = nodes[p.cursor];
    if (cur) {
      const label = cur.name + (cur.current ? ' — you are here' : '');
      x.font = 'bold 14px sans-serif';
      const tw = Math.min(W - 16, x.measureText(label).width + 16);
      x.fillStyle = '#f6f8fc'; x.fillRect(8, H - 30, tw, 22);
      x.strokeStyle = '#2b3040'; x.lineWidth = 2; x.strokeRect(8, H - 30, tw, 22);
      x.fillStyle = '#232838'; x.fillText(label, 16, H - 14);
    }
  },

  closeMapPanel() {
    const p = this.mapPanel;
    if (!p) return;
    this.mapPanel = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.mapEl) this.mapEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    if (p.cb) p.cb('close');
  },

  get mapOpen() { return !!this.mapPanel; },
});
