// ui.mjs — DOM chrome: D-pad/A/B overlays, dialogue, menus, panels.
// Two backends: browser DOM, and headless (records calls; input-driven).
// Battle command panel: 2x2 grid replacing the D-pad zone (one-thumb rule, gameux §2).
// P0/E8: cmdpanel populated as 2x2 88x64 icon+label buttons, FIGHT top-left.
// P0/E9: move menu as 2x2 grid with type badge pills (icon+text) + PP.
// P0/C3: name-entry A-Z grid keyboard (44px keys, physical-keyboard support).
// P0/B1: Trainer ID Terminal login stub (guest-functional, zero network).

export const TEXT_SPEED_CPS = { slow: 15, normal: 30, fast: 60, instant: 9999 };

import { SFX } from '../engine/audio.mjs';
import { uiIcon } from '../engine/art.mjs';
import { TYPE_COLORS } from '../engine/sprites.mjs';

function stubEl() {
  return {
    children: [], style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, addEventListener() {}, removeEventListener() {},
    set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
    querySelector() { return stubEl(); }, querySelectorAll() { return []; },
    focus() {}, click() {},
  };
}

// Hand-authored 12x12 pixel command icons (original, no emoji — contracts §1.3).
// '1' = ink (#ffe9a8 on dark), '.' = transparent.
const CMD_PIX = {
  fight: [
    '.....1......',
    '.....1......',
    '..1..1..1...',
    '...11111....',
    '....111.....',
    '.111111111..',
    '....111.....',
    '...11111....',
    '..1..1..1...',
    '.....1......',
    '.....1......',
    '............',
  ],
  party: [
    '.11...11....',
    '.11...11....',
    '.11...11....',
    '............',
    '.11...11....',
    '.11...11....',
    '............',
    '.1111111....',
    '.1111111....',
    '............',
    '............',
    '............',
  ],
  run: [
    '....1.......',
    '.....1......',
    '......1.....',
    '.......1....',
    '11111111111.',
    '.......1....',
    '......1.....',
    '.....1......',
    '....1.......',
    '............',
    '............',
    '............',
  ],
};

export function typePill(type) {
  const col = TYPE_COLORS[type] || '#a8a878';
  const abbr = String(type).slice(0, 2).toUpperCase();
  return '<span class="tpill" style="background:' + col + '"><b>' + abbr + '</b>&nbsp;' + type + '</span>';
}

export class UI {
  constructor(game) {
    this.game = game;
    this.headless = (typeof document === 'undefined');
    this.root = null;
    this.dpadEl = null; this.cmdEl = null;
    this.dlg = null;      // { lines, idx, chars, cb, speaker }
    this.menu = null;     // { title, items, idx, cb, battle }
    this.panel = null;    // named panel open (dex/party/bag/save/options)
    this.toastQ = [];
    this.log = [];        // headless: record of UI calls (test assertions)
    this._els = {};
    this.summary = null; // Platinum summary panel state ({ data, tab, cb })
    this.nameEntry = null; // { value, maxLen, cb, ... } while the A-Z grid is open
    this.loginOpen = false;
    this.inBattle = false; // Track B: battle-mode flag (SYNC defers conflict UI out of battle)
    this.hudVisible = true;
    this.dexDot = false;
    this._guestBannerOff = false;
    this.onMoodTap = null;
    this._moodWanted = false;
    // Seat D HUD chips (overworld seat drives these via the setters below).
    this.hudChips = { location: null, objective: null, dex: null };
    this._chipEls = null;   // { wrap, location, locationText, objective, objectiveText, dex, dexText }
    this._hudToastQ = [];   // headless record for hudToast (cap 2, mirrors the DOM cap)
    this.chapterCard = null; // D2: chapter title card overlay while open
    this._ccT = 0;
  }

  init() {
    if (this.headless) return;
    const doc = document;
    this.root = doc.getElementById('ui');
    this.buildControls();
    this.buildDialogue();
    this.buildMenu();
    this.buildSummaryPanel();
    this.buildToasts();
    this.buildHudChips();
    this.buildHudStrip();
    this.buildGuestBanner();
    this.buildMoodPip();
    this.buildHintCard();
  }

  el(tag, cls, parent) {
    if (this.headless) return stubEl();
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- touch controls ----
  buildControls() {
    const g = this.el('div', 'controls', this.root);
    const pad = this.el('div', 'dpad', g);
    this.dpadEl = pad;
    const mk = (action, cls, label) => {
      const b = this.el('button', 'padbtn ' + cls, pad);
      b.textContent = label;
      b.setAttribute('aria-label', action);
      const on = (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); };
      const off = (e) => { e.preventDefault(); this.game.input.release(action); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    mk('up', 'p-up', '▲'); mk('down', 'p-down', '▼');
    mk('left', 'p-left', '◀'); mk('right', 'p-right', '▶');
    const ab = this.el('div', 'ab', g);
    const mkA = (action, cls, label) => {
      const b = this.el('button', 'abtn ' + cls, ab);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      b.addEventListener('pointercancel', (e) => e.preventDefault());
      return b;
    };
    mkA('a', 'a-a', 'A'); mkA('b', 'a-b', 'B');
    // Z-A change order (ADR-021): full emulator pad — X/Y join A/B.
    // X = pageup (bag tabs / dex page / bike), Y = pagedown.
    mkA('pageup', 'a-x', 'X'); mkA('pagedown', 'a-y', 'Y');
    const sys = this.el('div', 'sysbtns', g);
    const mkS = (action, label) => {
      const b = this.el('button', 'sysbtn', sys);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      return b;
    };
    mkS('start', 'START'); mkS('select', 'SELECT');
    // Command panel (battle) — hidden unless battle scene shows it. P0/E8: populated as a 2x2 grid.
    // D3: child of #ui root, NOT .controls — body.desktop hides .controls (touch
    // buttons), which used to hide the battle commands on every laptop too.
    this.cmdEl = this.el('div', 'cmdpanel hidden', this.root);
  }

  // ---- P0/E8: battle command 2x2 grid (replaces the D-pad zone) ----
  // items: [{label, value, disabled, dimmed}] — dimmed = tutorial de-emphasis (still selectable).
  showCommands(items, cb, opts) {
    opts = opts || {};
    this.game.input.consumeAll(); // D3: stale walk edges must not move the battle cursor
    this.menu = {
      title: null, items, idx: opts.initialIdx || 0, cb, battle: true,
      kind: 'commands', grid: true, focus: opts.focus || null,
    };
    this.log.push({ ui: 'commands', items: items.map((i) => i.label) });
    if (!this.headless) this.renderCommands();
  }

  cmdIconCanvas(value) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    c.className = 'cmdicon';
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (value === 'bag') {
      const art = uiIcon(document, 'pokeball');
      if (art) x.drawImage(art, 0, 0);
      return c;
    }
    const pat = CMD_PIX[value];
    if (pat) {
      x.fillStyle = '#ffe9a8';
      for (let r = 0; r < pat.length; r++) {
        for (let q = 0; q < pat[r].length; q++) {
          if (pat[r][q] === '1') x.fillRect(q + 2, r + 2, 1, 1);
        }
      }
    }
    return c;
  }

  renderCommands() {
    if (this.headless) return;
    const m = this.menu;
    if (!m || m.kind !== 'commands') { this.cmdEl.classList.add('hidden'); return; }
    this.cmdEl.classList.remove('hidden');
    this.cmdEl.innerHTML = '';
    m.items.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'cmdf cmdf-' + it.value
        + (i === m.idx ? ' cursor' : '')
        + (it.disabled ? ' disabled' : '')
        + (it.dimmed ? ' dimmed' : '')
        + (m.focus && m.focus === it.value ? ' tut-focus' : '');
      b.appendChild(this.cmdIconCanvas(it.value));
      const lb = document.createElement('span');
      lb.className = 'cmdlabel';
      lb.textContent = it.label;
      b.appendChild(lb);
      b.setAttribute('aria-label', it.label);
      if (!it.disabled) {
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      }
      this.cmdEl.appendChild(b);
    });
  }

  hideCommands() {
    if (!this.headless) this.cmdEl.classList.add('hidden');
  }

  // 2x2 grid navigation (P0/E8): arrows move in the grid with edge wrap,
  // skipping disabled cells. Works for any item count (short last row clamps).
  moveMenuGrid(dir) {
    const m = this.menu;
    if (!m) return;
    const n = m.items.length, cols = 2, rows = Math.ceil(n / cols);
    const step = (idx) => {
      let r = Math.floor(idx / cols), c = idx % cols;
      if (dir === 'left') c = (c + cols - 1) % cols;
      else if (dir === 'right') c = (c + 1) % cols;
      else if (dir === 'up') r = (r + rows - 1) % rows;
      else r = (r + 1) % rows;
      let ni = r * cols + c;
      if (ni >= n) ni = n - 1;
      return ni;
    };
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = step(i);
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) {
      if (m.kind === 'commands') this.renderCommands();
      else this.renderMenu();
    }
  }

  buildDialogue() {
    this.dlgEl = this.el('div', 'dialogue hidden', this.root);
    // WS2/ADR-020: speaker portrait (original art) in the dialogue box.
    this.dlgFace = null;
    if (typeof document !== 'undefined') {
      this.dlgFace = document.createElement('canvas');
      this.dlgFace.width = 48; this.dlgFace.height = 48;
      this.dlgFace.className = 'dlg-face';
      this.dlgFace.style.display = 'none';
      this.dlgEl.appendChild(this.dlgFace);
    }
    this.dlgName = this.el('div', 'dlg-name', this.dlgEl);
    this.dlgText = this.el('div', 'dlg-text', this.dlgEl);
    this.dlgHint = this.el('div', 'dlg-hint', this.dlgEl);
    this.dlgHint.textContent = '▼';
  }

  portraitFor(speaker) {
    if (!speaker || typeof document === 'undefined') return null;
    const words = String(speaker).toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter(Boolean);
    for (let i = words.length - 1; i >= 0; i--) {
      const cv = artCanvas(document, 'portrait-' + words[i], 2, false);
      if (cv) return cv;
    }
    return null;
  }

  say(lines, cb, speaker) {
    this.dlg = { lines: lines.slice(), idx: 0, chars: 0, cb: cb || null, speaker: speaker || null, done: false };
    this.log.push({ ui: 'dialogue', lines });
    if (!this.headless) {
      this.dlgEl.classList.remove('hidden');
      this.dlgName.textContent = this.dlg.speaker || '';
      this.dlgName.style.display = this.dlg.speaker ? 'block' : 'none';
      this.dlgText.textContent = '';
      // Portrait: drawn when the speaker has original art (WS2).
      if (this.dlgFace) {
        const cv = this.portraitFor(this.dlg.speaker);
        if (cv) {
          const ctx = this.dlgFace.getContext('2d');
          ctx.clearRect(0, 0, 48, 48);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(cv, 0, 0);
          this.dlgFace.style.display = 'block';
          this.dlgText.style.marginLeft = '58px';
          this.dlgName.style.marginLeft = '58px';
        } else {
          this.dlgFace.style.display = 'none';
          this.dlgText.style.marginLeft = '';
          this.dlgName.style.marginLeft = '';
        }
      }
    }
  }

  get dialogueOpen() { return !!this.dlg; }

  advanceDialogue() {
    const d = this.dlg;
    if (!d) return false;
    const full = d.lines[d.idx];
    const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
    if (d.chars < full.length && speed < 9999) {
      d.chars = full.length; // first press completes the line
      if (!this.headless) this.dlgText.textContent = full;
      return true;
    }
    d.idx++;
    d.chars = 0;
    if (d.idx >= d.lines.length) {
      this.closeDialogue();
      const cb = d.cb; d.cb = null;
      if (cb) cb();
      return false;
    }
    this.game.audio.playSfx(SFX['dialogue-blip']); // visual twin: the ▾ indicator
    if (!this.headless) this.dlgText.textContent = '';
    return true;
  }

  closeDialogue() {
    this.dlg = null;
    if (!this.headless) this.dlgEl.classList.add('hidden');
  }

  buildMenu() {
    this.menuEl = this.el('div', 'menu hidden', this.root);
    this.menuTitle = this.el('div', 'menu-title', this.menuEl);
    this.menuList = this.el('div', 'menu-list', this.menuEl);
  }

  // opts: { battle, grid, initialIdx, rowHtml(item, i), focusValue }
  showMenu(title, items, cb, opts) {
    opts = opts || {};
    // D3: a menu opening consumes stale input edges — e.g. the direction key a
    // player was holding while walking into a grass encounter must not move the
    // battle cursor the moment the command menu appears.
    this.game.input.consumeAll();
    this.menu = {
      title, items, idx: opts.initialIdx || 0, cb,
      battle: !!(opts && opts.battle), kind: opts.kind || 'menu',
      grid: !!opts.grid, rowHtml: opts.rowHtml || null,
      menuClass: opts.menuClass || '',
      focusValue: opts.focusValue !== undefined ? opts.focusValue : null,
    };
    this.log.push({ ui: 'menu', title, items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  renderMenu() {
    if (this.headless) return;
    const m = this.menu;
    if (!m || m.kind === 'commands') { this.menuEl.classList.add('hidden'); return; }
    this.menuEl.classList.remove('hidden');
    this.menuEl.className = 'menu' + (m.menuClass ? ' ' + m.menuClass : '');
    // Full-takeover windows (party screen, PC box, summary) hide the
    // overworld HUD — Platinum screens own the whole frame.
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('menu-full', /(plate-full|pcbox)/.test(m.menuClass || ''));
    }
    this.menuTitle.textContent = m.title || '';
    this.menuTitle.style.display = m.title ? 'block' : 'none';
    this.menuList.innerHTML = '';
    this.menuList.className = 'menu-list' + (m.grid ? ' menugrid' : '');
    m.items.forEach((it, i) => {
      const r = document.createElement('button');
      r.className = 'menu-row'
        + (i === m.idx ? ' cursor' : '')
        + (it.disabled ? ' disabled' : '')
        + (it.band ? ' bandrow' : '')
        + (it.wide ? ' wide' : '')
        + (it.closeRow ? ' close-row' : '')
        + (it.zeroPp ? ' zeropp' : '')
        + (it.emptySlot ? ' emptyslot' : '')
        + (m.focusValue !== null && m.focusValue === it.value ? ' tut-focus' : '');
      // Seat D row support: an item may carry `icon` (img src / data URL) to
      // render a .picon sprite tile (party + bag rows) when no rowHtml is set;
      // with rowHtml, the caller's markup can use .picon / .emptyslot directly.
      if (m.rowHtml) r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span>' + m.rowHtml(it, i);
      else if (it.icon) r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span><img class="picon" src="' + it.icon + '" alt=""><span>' + it.label + '</span>';
      else r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span><span>' + it.label + '</span>';
      if (!it.disabled) r.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      this.menuList.appendChild(r);
    });
  }

  moveMenu(d) {
    const m = this.menu;
    if (!m) return;
    const n = m.items.length;
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) this.renderMenu();
  }

  chooseMenu(i) {
    const m = this.menu;
    if (!m) return;
    const idx = (i === undefined ? m.idx : i);
    const it = m.items[idx];
    if (!it || it.disabled) return;
    const wasCommands = m.kind === 'commands';
    this.menu = null;
    if (!this.headless) {
      this.menuEl.classList.add('hidden');
      if (typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
      if (wasCommands) this.hideCommands();
    }
    this.game.audio.playSfx(SFX['ui-blip']);
    const cb = m.cb;
    if (cb) cb(it.value, idx);
  }

  cancelMenu() {
    const m = this.menu;
    if (!m) return;
    const wasCommands = m.kind === 'commands';
    this.menu = null;
    if (!this.headless) {
      this.menuEl.classList.add('hidden');
      if (typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
      if (wasCommands) this.hideCommands();
    }
    this.game.audio.playSfx(SFX['ui-back']);
    const cb = m.cb;
    if (cb) cb(null, -1);
  }

  get menuOpen() { return !!this.menu; }

  // ---- Platinum tabbed summary panel (UI v2) ----
  // data: { name, tabs: [{ id, label, bodyHtml }] }. The caller composes each
  // tab's body HTML from real game data (profile / status / moves in the
  // Platinum summary arrangement); this class owns the chrome: tab strip,
  // framed panel, keyboard routing (left/right switch, B/START close).
  buildSummaryPanel() {
    this.sumEl = this.el('div', 'sumpanel hidden', this.root);
    this.sumTabsEl = this.el('div', 'sumtabs', this.sumEl);
    this.sumBodyEl = this.el('div', 'sumbody', this.sumEl);
    const close = this.el('button', 'sumclose', this.sumEl);
    close.textContent = 'Close';
    close.addEventListener('pointerdown', (e) => { e.preventDefault(); this.closeSummary(); });
    this.sumCloseBtn = close;
  }

  showSummary(data, cb) {
    this.summary = { data, tab: 0, cb: cb || null };
    this.log.push({ ui: 'summary', name: data && data.name });
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.add('menu-full');
    if (!this.headless) this.renderSummary();
  }

  renderSummary() {
    if (this.headless || !this.sumEl) return;
    const s = this.summary;
    if (!s) { this.sumEl.classList.add('hidden'); return; }
    this.sumEl.classList.remove('hidden');
    this.sumTabsEl.innerHTML = '';
    s.data.tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'sumtab' + (i === s.tab ? ' sel' : '');
      b.textContent = t.label;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.summary.tab = i;
        this.game.audio.playSfx(SFX['ui-tick']);
        this.renderSummary();
      });
      this.sumTabsEl.appendChild(b);
    });
    this.sumBodyEl.innerHTML = s.data.tabs[s.tab].bodyHtml || '';
  }

  summaryTab(d) {
    const s = this.summary;
    if (!s) return;
    const n = s.data.tabs.length;
    s.tab = (s.tab + d + n) % n;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) this.renderSummary();
  }

  closeSummary() {
    const s = this.summary;
    if (!s) return;
    this.summary = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.sumEl) this.sumEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    if (s.cb) s.cb();
  }

  get summaryOpen() { return !!this.summary; }

  buildToasts() {
    this.toastEl = this.el('div', 'toasts', this.root);
  }

  toast(text) {
    this.toastQ.push({ text, t: 0 });
    if (this.toastQ.length > 3) this.toastQ.shift(); // P1/D9: queue cap 3
    this.log.push({ ui: 'toast', text });
    if (this.headless) return;
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    this.toastEl.appendChild(d);
    while (this.toastEl.children.length > 3) this.toastEl.removeChild(this.toastEl.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2500);
  }

  // ---- Seat D: HUD chips + bottom-edge HUD toast ----
  // DOM (inside #ui, sibling of .hudstrip):
  //   <div class="hudchips">
  //     <div class="hudchip locchip hidden"><span class="locchip-text"></span></div>
  //     <div class="hudchip objchip hidden"><span class="obj-kicker">▸ OBJECTIVE</span><span class="obj-text"></span></div>
  //     <div class="hudchip dexchip hidden"><span class="dexchip-text"></span></div>
  //   </div>
  // Visibility follows the HUD-strip rules exactly: the column is hidden by
  // .nohud (setHudVisible) and .inbattle (setBattleMode) in CSS, same as
  // .hudstrip — menus/dialogues overlay it, they do not hide it.
  buildHudChips() {
    const wrap = this.el('div', 'hudchips', this.root);
    const loc = this.el('div', 'hudchip locchip hidden', wrap);
    const locText = this.el('span', 'locchip-text', loc);
    const obj = this.el('div', 'hudchip objchip hidden', wrap);
    const kick = this.el('span', 'obj-kicker', obj);
    kick.textContent = '▸ OBJECTIVE';
    const objText = this.el('span', 'obj-text', obj);
    const dex = this.el('div', 'hudchip dexchip hidden', wrap);
    const dexText = this.el('span', 'dexchip-text', dex);
    this._chipEls = {
      wrap, location: loc, locationText: locText,
      objective: obj, objectiveText: objText, dex, dexText,
    };
    this._syncChipAnchor();
    // Re-apply any state set before init() ran.
    this._renderChip('location');
    this._renderChip('objective');
    this._renderChip('dex');
  }

  _renderChip(key) {
    if (this.headless || !this._chipEls) return;
    const els = this._chipEls;
    const text = this.hudChips[key];
    const chip = key === 'location' ? els.location : key === 'objective' ? els.objective : els.dex;
    const label = key === 'location' ? els.locationText : key === 'objective' ? els.objectiveText : els.dexText;
    if (text) { label.textContent = text; chip.classList.remove('hidden'); }
    else { label.textContent = ''; chip.classList.add('hidden'); }
  }

  _setChip(key, text, logUi) {
    this.hudChips[key] = text ? String(text) : null;
    this.log.push({ ui: logUi, text: this.hudChips[key] });
    this._renderChip(key);
  }

  // Location name only (e.g. 'Pallet Town'). Null/empty hides the chip.
  setLocationChip(textOrNull) { this._setChip('location', textOrNull, 'locationchip'); }

  // Current objective, up to 2 lines (CSS line-clamp + ellipsis). Null hides.
  setObjectiveChip(textOrNull) { this._setChip('objective', textOrNull, 'objectivechip'); }

  // Compact dex pill — caller formats it (e.g. 'DEX 1/1025'). Null hides.
  setDexChip(textOrNull) { this._setChip('dex', textOrNull, 'dexchip'); }

  // Bottom-edge toast: reuses the .toasts stack (CSS anchors it just above
  // the controls zone, centered, max-width 92vw via .toast), gold-rimmed via
  // .hudtoast, auto-dismisses after ms (default 2600), queue capped at 2.
  hudToast(text, ms) {
    const dur = (typeof ms === 'number' && ms > 0) ? ms : 2600;
    this.log.push({ ui: 'hudtoast', text, ms: dur });
    this._hudToastQ.push({ text, ms: dur });
    if (this._hudToastQ.length > 2) this._hudToastQ.shift();
    if (this.headless || !this.toastEl) return;
    const d = document.createElement('div');
    d.className = 'toast hudtoast';
    d.textContent = text;
    this.toastEl.appendChild(d);
    const live = this.toastEl.querySelectorAll('.hudtoast');
    if (live.length > 2) live[0].remove();
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, dur);
  }

  // ---- P0/B1: Trainer ID Terminal (login stub — Track B dark, zero network) ----
  // Track B: when the auth UI is compiled in (vercel target, AUTH_ENABLED), the
  // terminal shows the full LOG IN / REGISTER / GUEST panel (auth.mjs). In the
  // guest target the stub below is byte-identical to Track A behavior.
  showLogin(cb) {
    if (this.headless) {
      // No DOM to click in the harness: the guest path is the only functional one.
      this.log.push({ ui: 'login-guest-auto' });
      cb('guest');
      return;
    }
    if (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED) {
      AUTH.showLoginPanel(this, this.game, cb);
      return;
    }
    this.loginOpen = true;
    this._loginCb = cb;
    const ov = this.el('div', 'loginover', this.root);
    this._loginOv = ov;
    const card = this.el('div', 'login', ov);
    const h = this.el('div', 'login-head', card);
    h.textContent = 'TRAINER ID TERMINAL';
    const tabs = this.el('div', 'login-tabs', card);
    const panes = this.el('div', 'login-panes', card);
    const mkTab = (name, key) => {
      const b = this.el('button', 'logintab', tabs);
      b.textContent = name;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._loginTab(key); });
      return b;
    };
    this._loginTabs = { login: mkTab('LOG IN', 'login'), register: mkTab('REGISTER', 'register'), guest: mkTab('GUEST', 'guest') };
    this._loginPanes = {};
    const mkPane = (key) => {
      const p = this.el('div', 'loginpane hidden', panes);
      this._loginPanes[key] = p;
      return p;
    };
    // LOG IN pane (disabled — honest stub)
    const lp = mkPane('login');
    lp.innerHTML = '<div class="login-note">Accounts arrive in Track B.<br>Your trainer ID lives on this device for now.</div>'
      + '<label>Trainer name<input class="login-in" disabled aria-label="Trainer name (disabled)"></label>'
      + '<label>Password<input class="login-in" type="password" disabled aria-label="Password (disabled)"></label>'
      + '<button class="login-go" disabled>LOG IN (Track B)</button>';
    // REGISTER pane (disabled — honest stub)
    const rp = mkPane('register');
    rp.innerHTML = '<div class="login-note">Accounts arrive in Track B.<br>No credentials are collected or sent anywhere.</div>'
      + '<label>Trainer name<input class="login-in" disabled aria-label="Trainer name (disabled)"></label>'
      + '<label>Password<input class="login-in" type="password" disabled aria-label="Password (disabled)"></label>'
      + '<button class="login-go" disabled>REGISTER (Track B)</button>';
    // GUEST pane (functional, zero network)
    const gp = mkPane('guest');
    const gnote = this.el('div', 'login-note', gp);
    gnote.textContent = 'Play right now — no account needed. Progress stays on this device until cloud saves arrive in Track B.';
    const go = this.el('button', 'login-go active', gp);
    go.textContent = 'PLAY AS GUEST';
    go.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      this._closeLogin();
      cb('guest');
    });
    this._loginTab('guest');
  }

  _loginTab(key) {
    for (const k of Object.keys(this._loginTabs)) {
      this._loginTabs[k].classList.toggle('sel', k === key);
      this._loginPanes[k].classList.toggle('hidden', k !== key);
    }
    this.game.audio.playSfx(SFX['ui-tick']);
  }

  _closeLogin() {
    this.loginOpen = false;
    if (this._loginOv && this._loginOv.parentNode) this._loginOv.parentNode.removeChild(this._loginOv);
    this._loginOv = null;
  }

  // ---- in-game guest banner (wireframes §4): 28px strip, dismissible per session ----
  buildGuestBanner() {
    const b = this.el('div', 'guestbanner hidden', this.root);
    const t = this.el('span', '', b);
    t.textContent = 'Guest — progress stays on this device · LOG IN';
    const x = this.el('button', 'gbx', b);
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Dismiss');
    x.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._guestBannerOff = true;
      b.classList.add('hidden');
    });
    this._guestBannerEl = b;
    // Track B (vercel): the banner's LOG IN becomes a real button (auth.mjs).
    // Guest target: AUTH.enhanceGuestBanner is a no-op — banner byte-identical.
    if (typeof AUTH !== 'undefined') AUTH.enhanceGuestBanner(this);
  }

  showGuestBanner() {
    if (this.headless || this._guestBannerOff || !this._guestBannerEl) return;
    this._guestBannerEl.classList.remove('hidden');
  }

  hideGuestBanner() {
    if (this.headless || !this._guestBannerEl) return;
    this._guestBannerEl.classList.add('hidden');
  }

  // ---- P0/C3: name-entry A-Z grid keyboard ----
  // DOM: bottom-half grid (portrait) / 480px centered panel (desktop), 44px keys,
  // physical-keyboard support, 8-char max, validation shake on empty.
  showNameEntry(title, initial, maxLen, cb) {
    if (this.headless) {
      // Harness contract: a menu-like state so menuOpen/debugChoose keep working.
      this.menu = {
        title, items: [{ label: initial + ' (default)', value: initial }],
        idx: 0, cb: (v) => cb(v || initial), kind: 'nameentry',
      };
      this.log.push({ ui: 'nameentry', title });
      return;
    }
    this.nameEntry = { value: initial || '', maxLen: maxLen || 8, cb, title };
    const ov = this.el('div', 'nkbover', this.root);
    this._nkbOv = ov;
    const card = this.el('div', 'namekb', ov);
    const h = this.el('div', 'nkb-title', card);
    h.textContent = title;
    const disp = this.el('div', 'nkb-display', card);
    this._nkbDisp = disp;
    this._nkbRender();
    const grid = this.el('div', 'nkb-grid', card);
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (const k of keys) {
      const b = this.el('button', 'nkb-key', grid);
      b.textContent = k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbType(k); });
    }
    const row = this.el('div', 'nkb-row', card);
    const bk = this.el('button', 'nkb-key wide', row);
    bk.textContent = '⌫';
    bk.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbBack(); });
    const dash = this.el('button', 'nkb-key', row);
    dash.textContent = '-';
    dash.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbType('-'); });
    const ok = this.el('button', 'nkb-key wide go', row);
    ok.textContent = 'OK';
    ok.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbOk(); });
    // Physical keyboard: capture at document level so the game's KEYMAP never sees these.
    this._nkbKey = (e) => {
      if (!this.nameEntry) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Backspace') this._nkbBack();
      else if (e.key === 'Enter') this._nkbOk();
      else if (/^[a-zA-Z-]$/.test(e.key)) this._nkbType(e.key.toUpperCase());
    };
    document.addEventListener('keydown', this._nkbKey, true);
  }

  _nkbRender() {
    const ne = this.nameEntry;
    if (!ne || !this._nkbDisp) return;
    this._nkbDisp.textContent = ne.value + '▌';
  }

  _nkbType(ch) {
    const ne = this.nameEntry;
    if (!ne || ne.value.length >= ne.maxLen) return;
    ne.value += ch;
    this.game.audio.playSfx(SFX['ui-tick']);
    this._nkbRender();
  }

  _nkbBack() {
    const ne = this.nameEntry;
    if (!ne) return;
    ne.value = ne.value.slice(0, -1);
    this.game.audio.playSfx(SFX['ui-back']);
    this._nkbRender();
  }

  _nkbOk() {
    const ne = this.nameEntry;
    if (!ne) return;
    if (!ne.value.trim()) {
      // Validation shake on empty (P0/C3).
      this.game.audio.playSfx(SFX['error-buzz']);
      if (this._nkbOv) {
        this._nkbOv.classList.remove('shake');
        void this._nkbOv.offsetWidth;
        this._nkbOv.classList.add('shake');
      }
      this.toast('Give your trainer a name!');
      return;
    }
    const cb = ne.cb, v = ne.value.trim().toUpperCase().slice(0, ne.maxLen);
    this._nkbClose();
    cb(v);
  }

  _nkbClose() {
    if (this._nkbKey) document.removeEventListener('keydown', this._nkbKey, true);
    this._nkbKey = null;
    this.nameEntry = null;
    if (this._nkbOv && this._nkbOv.parentNode) this._nkbOv.parentNode.removeChild(this._nkbOv);
    this._nkbOv = null;
  }

  // ---- P1/D4: persistent HUD quick-strip (one-tap Bag/Party/Dex/Menu) ----
  // Choice documented: portrait = overlaid top-right of canvas (gameux §4.1).
  buildHudStrip() {
    const strip = this.el('div', 'hudstrip', this.root);
    this._hudStrip = strip;
    const defs = [
      ['bag', 'Bag'], ['party', 'Party'], ['dex', 'Dex'], ['menu', 'Menu'],
    ];
    this._hudBtns = {};
    for (const [key, label] of defs) {
      const b = this.el('button', 'hudbtn', strip);
      b.setAttribute('aria-label', label);
      const cv = document.createElement('canvas');
      cv.width = 16; cv.height = 16;
      cv.className = 'hudicon';
      drawHudIcon(cv.getContext('2d'), key);
      b.appendChild(cv);
      const lb = this.el('span', 'hudlabel', b);
      lb.textContent = label;
      if (key === 'dex') {
        const dot = this.el('span', 'dexdot hidden', b);
        this._dexDot = dot;
      }
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.game.audio.unlock();
        const g = this.game;
        if (key === 'bag') g.openBag();
        else if (key === 'party') g.openParty();
        else if (key === 'dex') { this.dexDot = false; this._renderDexDot(); g.openDex(); }
        else if (key === 'menu') {
          const ow = g.scenes.top;
          if (ow && ow.openPauseMenu) ow.openPauseMenu();
        }
      });
      this._hudBtns[key] = b;
    }
  }

  _renderDexDot() {
    if (!this._dexDot) return;
    this._dexDot.classList.toggle('hidden', !this.dexDot);
  }

  setHudVisible(v) {
    this.hudVisible = v;
    if (this.headless || !this.root) return;
    this.root.classList.toggle('nohud', !v); // P1/D4: SELECT toggles the strip
  }

  // ---- P1/D7: partner mood pip (persistent, tappable) ----
  // Seat D: CSS re-homes it into the right rail, directly under the HUD
  // button rail (top:110px/right:8px, 48px round ink button); it is hidden
  // in landscape (body.landscape) where the vertical rail owns the right
  // edge. No longer a floating bottom-right page widget.
  buildMoodPip() {
    const b = this.el('button', 'moodpip hidden', this.root);
    b.setAttribute('aria-label', 'Pikachu');
    const cv = this.headless ? null : document.createElement('canvas');
    if (cv) {
      cv.width = 16; cv.height = 16;
      cv.className = 'moodface';
      b.appendChild(cv);
      this._moodFace = cv;
    }
    const dot = this.el('span', 'mooddot', b);
    this._moodDot = dot;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      if (this.onMoodTap) this.onMoodTap();
    });
    this._moodPip = b;
  }

  showMoodPip(v) {
    if (this.headless || !this._moodPip) return;
    this._moodWanted = v;
    this._moodPip.classList.toggle('hidden', !v);
    if (v) this.updateMoodPip();
  }

  updateMoodPip() {
    if (this.headless || !this._moodPip) return;
    const mood = (this.game.state.pikachu && this.game.state.pikachu.mood) || 'happy';
    const col = mood === 'happy' ? '#58c94f' : mood === 'sleepy' ? '#5a9ae8' : '#e8c832';
    if (this._moodDot) this._moodDot.style.background = col;
    if (this._moodFace && this.game.partnerFrame) {
      const x = this._moodFace.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, 16, 16);
      x.drawImage(this.game.partnerFrame(), 0, 0);
    }
  }
  // ---- P1/K3: desktop keyboard-hint card (dismissible) ----
  buildHintCard() {
    const c = this.el('div', 'hintcard hidden', this.root);
    const t = this.el('div', '', c);
    t.textContent = 'Keyboard: Arrows/WASD move · Z/Space = A · X = B · Enter = START · M = mute · F = fullscreen';
    const x = this.el('button', 'hintcard-x', c);
    x.textContent = 'Got it ✕';
    x.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._hintOff = true;
      c.classList.add('hidden');
    });
    this._hintCard = c;
  }

  showHintCard(v) {
    if (this.headless || !this._hintCard) return;
    this._hintCard.classList.toggle('hidden', !v || this._hintOff);
  }

  // ---- D2: chapter title cards (anime-chronology spine, ADR-015) ----
  // ch: a CHAPTERS entry (src/data/story.mjs). Paper-panel card, Gen 4/5 idiom,
  // tap/A/START dismisses, auto-dismisses after 4s of game time (reduced-motion
  // safe: no animation). All text >= 14px (QA-001).
  showChapterCard(ch) {
    this.log.push({ ui: 'chaptercard', chapter: ch && ch.n, title: ch && ch.title });
    if (this.headless) { this.chapterCard = null; return; }
    this.hideChapterCard(); // one card at a time
    this._ccT = 0;
    const d = this.el('div', 'chaptercard', this.root);
    const kick = this.el('div', 'cc-kicker', d);
    kick.textContent = 'CHAPTER ' + ch.n + ' — ACT ' + ch.act;
    const t = this.el('div', 'cc-title', d);
    t.textContent = ch.title;
    const arc = this.el('div', 'cc-arc', d);
    arc.textContent = ch.arc;
    const an = this.el('div', 'cc-anime', d);
    an.textContent = ch.anime;
    if (ch.movies && ch.movies.length) {
      const mv = this.el('div', 'cc-anime', d);
      mv.textContent = 'Special events: ' + ch.movies.join(' · ');
    }
    const hint = this.el('div', 'cc-hint', d);
    hint.textContent = 'Press A / tap to continue';
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      this.game.input.inject('a');
    });
    this.chapterCard = d;
  }

  hideChapterCard() {
    this.chapterCard = null;
    this._ccT = 0;
    if (this.headless || !this.root) return;
    const old = this.root.querySelector('.chaptercard');
    if (old && old.remove) old.remove();
  }

  // HUD chips anchor to the CANVAS FRAME, not the viewport: the stage
  // centers the canvas, so viewport-anchored chips would float over the
  // page margin on desktop and drift off-frame on phones. Recompute only
  // when the canvas rect actually changes (checked on a throttle).
  _syncChipAnchor() {
    const els = this._chipEls;
    if (!els || !els.wrap || typeof document === 'undefined') return;
    const cv = document.getElementById && document.getElementById('game');
    if (!cv || !cv.getBoundingClientRect) return;
    const r = cv.getBoundingClientRect();
    if (!(r.width > 0)) return;
    const key = Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width);
    if (key === this._chipAnchorKey) return;
    this._chipAnchorKey = key;
    els.wrap.style.left = Math.round(r.left + 10) + 'px';
    els.wrap.style.top = Math.round(r.top + 10) + 'px';
    els.wrap.style.maxWidth = Math.max(150, Math.round(r.width - 292)) + 'px';
  }

  update(dt) {
    this._chipTick = (this._chipTick || 0) + 1;
    if (this._chipTick % 15 === 0) this._syncChipAnchor();
    const input = this.game.input;
    // Summary panel is modal (UI v2): left/right (or X/Y page keys) switch
    // tabs, B / START / ESC closes.
    if (this.summary) {
      if (input.wasPressed('left') || input.wasPressed('pageup')) this.summaryTab(-1);
      else if (input.wasPressed('right') || input.wasPressed('pagedown')) this.summaryTab(1);
      else if (input.wasPressed('b') || input.wasPressed('start') || input.wasPressed('escape')) { this.closeSummary(); }
      return true;
    }
    // Name-entry grid is modal (P0/C3).
    if (this.nameEntry) return true;
    // Login page is modal (P0/B1).
    if (this.loginOpen) return true;
    // Chapter title card is modal (D2: auto-dismisses; A/START/tap dismiss early).
    if (this.chapterCard) {
      this._ccT += dt;
      if (input.wasPressed('a') || input.wasPressed('start') || this._ccT >= 4) {
        this.game.audio.unlock();
        this.hideChapterCard();
      }
      return true;
    }
    // Typewriter advance
    if (this.dlg) {
      const d = this.dlg;
      const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
      if (speed < 9999 && d.chars < d.lines[d.idx].length) {
        d.chars = Math.min(d.lines[d.idx].length, d.chars + speed * dt);
        if (!this.headless) this.dlgText.textContent = d.lines[d.idx].slice(0, Math.floor(d.chars));
      }
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.game.audio.unlock();
        this.advanceDialogue();
        return true;
      }
      if (input.wasPressed('b')) { /* B does not skip story dialogue */ }
      return true; // dialogue modal
    }
    if (this.menu) {
      const grid = !!this.menu.grid;
      if (input.wasPressed('up')) { grid ? this.moveMenuGrid('up') : this.moveMenu(-1); }
      else if (input.wasPressed('down')) { grid ? this.moveMenuGrid('down') : this.moveMenu(1); }
      else if (input.wasPressed('left') && this.menu.battle) { grid ? this.moveMenuGrid('left') : this.moveMenu(-1); }
      else if (input.wasPressed('right') && this.menu.battle) { grid ? this.moveMenuGrid('right') : this.moveMenu(1); }
      else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
      else if (input.wasPressed('b') || input.wasPressed('escape')) { this.cancelMenu(); return true; }
      return true; // menu modal
    }
    return false;
  }

  setBattleMode(on) {
    if (this.headless) { this.inBattle = !!on; return; }
    this.inBattle = !!on; // Track B: SYNC.tick defers the conflict sheet out of battle
    this.dpadEl.classList.toggle('hidden', on);
    this.cmdEl.classList.toggle('hidden', !on);
    if (this.root) this.root.classList.toggle('inbattle', on); // hides the HUD strip in battle
    if (this._moodPip) this._moodPip.classList.toggle('hidden', on || !this._moodWanted);
    if (!on) this.hideCommands();
  }

  // Headless test helper: choose a menu item by index.
  debugChoose(i) { this.chooseMenu(i); }
}

// Original 16x16 HUD icons (pixel data, no emoji — contracts §1.3).
function drawHudIcon(x, key) {
  x.imageSmoothingEnabled = false;
  const P = (px, py, w, h, c) => { x.fillStyle = c; x.fillRect(px, py, w, h); };
  if (key === 'bag') {
    P(3, 4, 10, 9, '#8a5a2a'); P(3, 4, 10, 2, '#a8743a'); // sack
    P(6, 2, 4, 3, '#6a4420'); P(5, 1, 6, 2, '#8a5a2a');  // tied top
    P(2, 3, 12, 1, '#241a20'); P(2, 13, 12, 1, '#241a20');
  } else if (key === 'party') {
    P(2, 2, 4, 4, '#e8c832'); P(10, 2, 4, 4, '#e86a8a'); // two heads
    P(2, 7, 4, 2, '#c8a020'); P(10, 7, 4, 2, '#c04a6a');
    P(2, 10, 4, 4, '#5a9ae8'); P(10, 10, 4, 4, '#58c94f');
    P(2, 10, 4, 1, '#3a7ac0'); P(10, 10, 4, 1, '#3aa83a');
  } else if (key === 'dex') {
    P(3, 1, 10, 14, '#c03028'); P(3, 1, 10, 2, '#e04040'); // dex shell
    P(5, 5, 6, 6, '#bfe8f0'); P(6, 6, 4, 4, '#5a9ae8');   // screen
    P(12, 1, 1, 14, '#7a2020');
  } else if (key === 'menu') {
    P(3, 3, 10, 2, '#f0f0f0'); P(3, 7, 10, 2, '#f0f0f0'); P(3, 11, 10, 2, '#f0f0f0');
  }
}
