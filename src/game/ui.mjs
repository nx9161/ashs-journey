// ui.mjs — DOM chrome: D-pad/A/B overlays, dialogue, menus, panels.
// Two backends: browser DOM, and headless (records calls; input-driven).
// Battle command panel: 2x2 grid replacing the D-pad zone (one-thumb rule, gameux §2).
// P0/E8: cmdpanel populated as 2x2 88x64 icon+label buttons, FIGHT top-left.
// P0/E9: move menu as 2x2 grid with type badge pills (icon+text) + PP.
// P0/C3: name-entry A-Z grid keyboard (44px keys, physical-keyboard support).
// P0/B1: Trainer ID Terminal login stub (guest-functional, zero network).

export const TEXT_SPEED_CPS = { slow: 15, normal: 30, fast: 60, instant: 9999 };

import { SFX } from '../engine/audio.mjs';
import { speakerPortraitCanvas } from '../engine/art.mjs';
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
// Rows joined by '/'; '1' = kit ink #2a1800, '2' = per-icon accent (CMD_ACC),
// '.' = transparent. Wave G M1.1 set: crossed blades, orb cluster, satchel,
// bootprints — replaces the legacy starburst / bars / arrow / ball art.
const CMD_ACC = { fight: '#647d99', party: '#e8b832', bag: '#b07a3f', run: '#8fa4bd' };
const CMD_PIX = {
  fight: '12........21/.12......21./..12....21../...12..21.../....1221..../.....21...../....2112..../...21..12.../..111..111../...1....1.../..1......1../............',
  party: '.....111..../....1.221.../....12221.../....12221.../.....111..../............/.111....111./1.221..1.221/12221..12221/12221..12221/.111....111./............',
  bag: '............/.....11...../....1..1..../..11111111../.1222222221./.1221111221./.1222112221./.1222222221./.1222222221./.1222222221./.1111111111./............',
  run: '........11../.222...1111./222....1111./.......1111./..11....11../.1111......./.1111...11../.1111...11../..11......../............/..11......../..11........',
};
for (const k in CMD_PIX) CMD_PIX[k] = CMD_PIX[k].split('/');

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
    this.frame = null; // UI v2.1: frame-anchored layer (box synced to the canvas rect)
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
    // UI v2.1 (defects 2-5): everything that belongs to the GAME — dialogue,
    // menus, battle commands, HUD chips/strip, toasts, chapter cards — lives
    // in this frame layer, whose box is synced to the canvas rect by
    // _syncChipAnchor(). DOM chrome positioned against the viewport is how
    // v2 shipped dialogue/commands/party OUTSIDE the frame on the live build.
    // Viewport-layer elements stay in #ui: touch controls, login/name-entry
    // overlays (full-screen modal dim), hint card, 503 banner, sync dot.
    this.frame = this.el('div', 'frameui', this.root);
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this._syncChipAnchor());
    }
    this.buildControls();
    this.buildDialogue();
    this.buildMenu();
    this.buildSummaryPanel();
    this.buildEntryPanel();
    this.buildMapPanel();
    this.buildRtMovePad();
    this.buildPcPanel();
    this.buildToasts();
    this.buildHudChips();
    this.buildHudStrip();
    this.buildGuestBanner();
    this.buildMoodPip();
    this.buildHintCard();
    this._syncChipAnchor(); // frame box correct from the first painted frame
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
    this.cmdEl = this.el('div', 'cmdpanel hidden', this.frame);
  }

  // ---- P0/E8: battle command 2x2 grid (replaces the D-pad zone) ----
  // items: [{label, value, disabled, dimmed}] — dimmed = tutorial de-emphasis (still selectable).
  showCommands(items, cb, opts) {
    opts = opts || {};
    this.game.input.consumeAll(); // D3: stale walk edges must not move the battle cursor
    // BATTLE-FREEZE FIX (same trap as showMenu): never open with the
    // cursor on a disabled cell (e.g. the Safari grid with 0 balls left).
    let initIdx = opts.initialIdx || 0;
    for (let k = 0; k < items.length; k++) {
      if (items[initIdx] && !items[initIdx].disabled) break;
      initIdx = (initIdx + 1) % items.length;
    }
    this.menu = {
      title: null, items, idx: initIdx, cb, battle: true,
      kind: 'commands', grid: true, focus: opts.focus || null,
      stickyCancel: !!opts.stickyCancel,
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
    const pat = CMD_PIX[value];
    if (pat) {
      // UI v2.2: command icons are ink on the light Platinum plate interior
      // (the v2 pale-gold '#ffe9a8' was drawn for the old dark gradient bars
      // and vanished on the framed buttons). M1.1: two-tone — kit ink plus
      // one accent per command.
      for (let r = 0; r < pat.length; r++) {
        for (let q = 0; q < pat[r].length; q++) {
          const ch = pat[r][q];
          if (ch === '.') continue;
          x.fillStyle = ch === '1' ? '#2a1800' : (CMD_ACC[value] || '#2a1800');
          x.fillRect(q + 2, r + 2, 1, 1);
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
    const prev = m.idx;
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = step(i);
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) {
      if (m.kind === 'commands') this.renderCommands();
      else this._menuCursorDom(prev);
    }
  }

  buildDialogue() {
    this.dlgEl = this.el('div', 'dialogue hidden', this.frame);
    // UI v2.1 (defect 5): no portrait tab, no name pill — Platinum puts the
    // speaker's name as a plain line in the text flow (see say() + .dlg-name).
    // Wave 3b: the speaker's authored portrait (art.mjs speakerPortrait*)
    // floats at the panel's left when the speaker has one; speakers
    // without a portrait get no face element shown (never a placeholder).
    // Presentation only — dialogue lines, pacing and flow are untouched.
    this.dlgFace = this.el('canvas', 'dlg-face', this.dlgEl);
    this.dlgFace.width = 48; this.dlgFace.height = 48;
    // Inline styles (not shell CSS): the face is a Wave 3b presentation
    // add-on, and inline styling keeps the shell byte-identical across
    // editions (the personal/public index parity gate).
    this.dlgFace.style.cssText = 'display:none;float:left;width:48px;height:48px;'
      + 'margin:2px 10px 4px 0;image-rendering:pixelated;background:#e3dcc4;'
      + 'border:2px solid #2b3040;border-radius:3px';
    this.dlgName = this.el('div', 'dlg-name', this.dlgEl);
    this.dlgText = this.el('div', 'dlg-text', this.dlgEl);
    this.dlgHint = this.el('div', 'dlg-hint', this.dlgEl);
    this.dlgHint.textContent = '▼';
    // AUDIT FIX (S-15): the dialogue box itself is tappable to advance —
    // it has pointer-events:auto but had no listener, so taps on the
    // biggest target on screen were silently swallowed.
    this.dlgEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.dlg) { this.game.audio.unlock(); this.advanceDialogue(); }
    });
  }

  // ADR-025 §2 (Bonds): the heart pip. After any bond change, the wiring
  // queues a direction here; the NEXT dialogue's nameplate wears it
  // (♥▲ warms / ♥▼ cools) — the PARTNER_MOODS idiom extended to people.
  // Consumed by exactly one say(), never sticky, never labelled in
  // advance: choices are not pre-marked good/bad; the pip teaches after.
  queueBondPip(dir) {
    if (dir) this._bondPip = dir > 0 ? 1 : -1;
  }

  say(lines, cb, speaker) {
    this.dlg = { lines: lines.slice(), idx: 0, chars: 0, cb: cb || null, speaker: speaker || null, done: false };
    if (this._bondPip && speaker) { this.dlg.pip = this._bondPip; this._bondPip = 0; }
    this.log.push({ ui: 'dialogue', lines });
    if (!this.headless) {
      this.dlgEl.classList.remove('hidden');
      this.dlgName.textContent = (this.dlg.speaker || '') + (this.dlg.pip ? (this.dlg.pip > 0 ? ' ♥▲' : ' ♥▼') : '');
      this.dlgName.style.display = this.dlg.speaker ? 'block' : 'none';
      this.dlgText.textContent = '';
      this._showDlgFace(this.dlg.speaker);
    }
  }

  // Wave 3b: resolve + paint the speaker's portrait into the dialogue
  // panel's face canvas (24x24 authored art at 2x, smoothing off).
  // No portrait for this speaker -> the canvas hides; the panel layout
  // and text flow are exactly as before in both cases.
  _showDlgFace(speaker) {
    const cv = this.dlgFace;
    if (!cv || typeof cv.getContext !== 'function') return;
    const src = speaker ? speakerPortraitCanvas(document, speaker) : null;
    if (!src) { cv.style.display = 'none'; return; }
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
    cv.style.display = 'block';
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
    this.game.audio.playSfx(SFX['dialogue-blip']); // visual twin: the ▼ indicator
    if (!this.headless) this.dlgText.textContent = '';
    return true;
  }

  closeDialogue() {
    this.dlg = null;
    if (!this.headless) {
      this.dlgEl.classList.add('hidden');
      if (this.dlgFace) this.dlgFace.style.display = 'none';
    }
  }

  buildMenu() {
    this.menuEl = this.el('div', 'menu hidden', this.frame);
    this.menuTitle = this.el('div', 'menu-title', this.menuEl);
    // UI v2.4: bag pocket tab strip (only populated for bag menus).
    this.menuTabs = this.el('div', 'bagtab hidden', this.menuEl);
    this.menuList = this.el('div', 'menu-list', this.menuEl);
  }

  // opts: { battle, grid, initialIdx, rowHtml(item, i), focusValue, remember }
  showMenu(title, items, cb, opts) {
    opts = opts || {};
    // D3: a menu opening consumes stale input edges — e.g. the direction key a
    // player was holding while walking into a grass encounter must not move the
    // battle cursor the moment the command menu appears.
    this.game.input.consumeAll();
    // AUDIT FIX (cursor memory): menus opened with opts.remember restore the
    // cursor row (+ bag pocket) they had when last closed in this session —
    // Platinum keeps your place when you back out of a submenu and return.
    // Explicit initialIdx always wins; restores are clamped + advanced to
    // the next enabled, visible row so a changed list can't strand it.
    let initIdx = opts.initialIdx || 0;
    let initPocket = opts.bagPocket || (opts.bagTabs ? opts.bagTabs[0] : null);
    if (opts.remember && opts.initialIdx === undefined) {
      const mem = (this._menuMem || {})[opts.remember];
      if (mem) {
        initIdx = Math.max(0, Math.min(mem.idx || 0, items.length - 1));
        if (opts.bagTabs && mem.pocket && opts.bagTabs.includes(mem.pocket)) initPocket = mem.pocket;
      }
    }
    // BATTLE-FREEZE FIX: the cursor must never OPEN on a disabled row.
    // chooseMenu() ignores disabled rows, so a menu whose initial row is
    // disabled swallowed every A press in silence while the screen behind
    // it stayed frozen — the forced faint-switch party menu was the trap:
    // row 0 is the fainted active mon (disabled), so the menu opened dead
    // and the battle looked stuck. (This advance used to run only for
    // remember-restored menus.) Advance to the first enabled, visible row.
    for (let k = 0; k < items.length; k++) {
      const it = items[initIdx];
      if (it && !it.disabled && (!opts.bagTabs || !it.pocket || it.pocket === initPocket)) break;
      initIdx = (initIdx + 1) % items.length;
    }
    this.menu = {
      title, items, idx: initIdx, cb,
      rememberKey: opts.remember || null,
      battle: !!(opts && opts.battle), kind: opts.kind || 'menu',
      grid: !!opts.grid, gridNav: !!opts.gridNav, rowHtml: opts.rowHtml || null,
      menuClass: opts.menuClass || '',
      focusValue: opts.focusValue !== undefined ? opts.focusValue : null,
      // UI v2.4 (one-bag): pocket tabs. Items carry `pocket`; rows with no
      // pocket (Close/Back) are always visible. The headless item list is
      // the FULL bag (harness contract); the DOM shows one pocket at a
      // time under the tab strip, Platinum-style.
      bagTabs: opts.bagTabs || null,
      bagPocket: initPocket,
      // Elevation B4: a menu may claim the direction keys itself (the
      // mart quantity stepper adjusts instead of moving a cursor).
      onKey: opts.onKey || null,
    };
    this.log.push({ ui: 'menu', title, items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  renderMenu() {
    if (this.headless) return;
    const m = this.menu;
    if (!m || m.kind === 'commands') { this.menuEl.classList.add('hidden'); return; }
    // Elevation C1: the open transition plays only when the window was
    // actually hidden (a fresh open) — cursor moves and in-place
    // re-renders (bag pockets, the mart stepper) must not replay it.
    const wasHidden = this.menuEl.classList.contains('hidden');
    // className assignment wipes the class list, so it must land BEFORE
    // the menu-open add below (QA Major 2, 2026-10-27: the transition
    // class was being stripped by this very line and never played).
    this.menuEl.className = 'menu' + (m.menuClass ? ' ' + m.menuClass : '');
    if (wasHidden) this.menuEl.classList.add('menu-open');
    // Full-takeover windows (party screen, PC box, summary) hide the
    // overworld HUD — Platinum screens own the whole frame.
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('menu-full', /(plate-full|pcbox)/.test(m.menuClass || ''));
    }
    this.menuTitle.textContent = m.title || '';
    // UI v2.2: battlewin menus (moves/bag/balls in battle) carry no title
    // band — Platinum's battle windows are titleless, and the band would
    // push the window up into the ally databox. (Inline style here beats
    // the stylesheet, so the exception must live in this line.)
    this.menuTitle.style.display = (m.title && m.menuClass !== 'battlewin') ? 'block' : 'none';
    // UI v2.4: bag tab strip — one button per pocket; the active pocket's
    // rows show, the rest carry .baghidden (display:none). Pointer users
    // tap tabs; keyboard switches with left/right (see update()).
    if (this.menuTabs) {
      this.menuTabs.innerHTML = '';
      if (m.bagTabs && m.bagTabs.length > 1) {
        this.menuTabs.classList.remove('hidden');
        m.bagTabs.forEach((p) => {
          const b = document.createElement('button');
          b.className = 'bagtab-btn' + (p === m.bagPocket ? ' sel' : '');
          b.textContent = p;
          b.setAttribute('data-pocket', p);
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.setBagPocket(p); });
          this.menuTabs.appendChild(b);
        });
      } else {
        this.menuTabs.classList.add('hidden');
      }
    }
    this.menuList.innerHTML = '';
    this.menuList.className = 'menu-list' + (m.grid ? ' menugrid' : '');
    m.items.forEach((it, i) => {
      const r = document.createElement('button');
      r.className = 'menu-row'
        + (i === m.idx ? ' cursor' : '')
        + (it.disabled ? ' disabled' : '')
        + (it.band ? ' band' : '')
        + (it.wide ? ' wide' : '')
        + (it.closeRow ? ' close-row' : '')
        + (it.zeroPp ? ' zeropp' : '')
        + (it.emptySlot ? ' emptyslot' : '')
        + (m.bagTabs && it.pocket && it.pocket !== m.bagPocket ? ' baghidden' : '')
        + (m.focusValue !== null && m.focusValue === it.value ? ' tut-focus' : '');
      // Seat D row support: an item may carry `icon` (img src / data URL) to
      // render a .picon sprite tile (party + bag rows) when no rowHtml is set;
      // with rowHtml, the caller's markup can use .picon / .emptyslot directly.
      if (m.rowHtml) r.innerHTML = '<span class="cur">' + (i === m.idx ? '▶' : '&nbsp;') + '</span>' + m.rowHtml(it, i);
      else if (it.icon) r.innerHTML = '<span class="cur">' + (i === m.idx ? '▶' : '&nbsp;') + '</span><img class="picon" src="' + it.icon + '" alt=""><span>' + it.label + '</span>';
      else r.innerHTML = '<span class="cur">' + (i === m.idx ? '▶' : '&nbsp;') + '</span><span>' + it.label + '</span>';
      if (!it.disabled) r.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      this.menuList.appendChild(r);
    });
    // AUDIT FIX: a freshly rendered menu must show its cursor — long lists
    // (dex/bag) overflow the window, and a restored cursor starts off-screen.
    this._scrollCursorIntoView();
  }

  // Keep the cursor row inside the menu's visible window (the .menu box
  // scrolls; Platinum never lets the selection leave the screen).
  _scrollCursorIntoView() {
    if (this.headless || !this.menu || !this.menuList) return;
    const row = this.menuList.children[this.menu.idx];
    if (row && row.scrollIntoView) { try { row.scrollIntoView({ block: 'nearest' }); } catch (e) { /* older engines */ } }
  }

  // AUDIT FIX: light cursor move — moveMenu used to rebuild EVERY row's DOM
  // on each step (a ~1,000-row rebuild per keypress in the full dex, which
  // also reset the scroll box to the top and hid the cursor). Now only the
  // two affected rows update, and the new cursor scrolls into view. Falls
  // back to a full render if the DOM is out of sync with the item list.
  _menuCursorDom(prevIdx) {
    if (this.headless || !this.menu || !this.menuList) return;
    const m = this.menu;
    if (this.menuList.children.length !== m.items.length) { this.renderMenu(); return; }
    const paint = (i, on) => {
      const row = this.menuList.children[i];
      if (!row) return;
      row.classList.toggle('cursor', on);
      const cur = row.querySelector('.cur');
      if (cur) cur.textContent = on ? '▶' : ' ';
    };
    if (prevIdx !== m.idx) paint(prevIdx, false);
    paint(m.idx, true);
    this._scrollCursorIntoView();
  }

  // UI v2.4: is this item reachable from the active bag pocket? Rows with
  // no pocket (Close/Back) always are; pocket rows only in their pocket.
  bagItemVisible(m, it) {
    return !m.bagTabs || !it.pocket || it.pocket === m.bagPocket;
  }

  setBagPocket(p) {
    const m = this.menu;
    if (!m || !m.bagTabs || m.bagPocket === p) return;
    m.bagPocket = p;
    // Cursor lands on the pocket's first enabled row (or stays if none).
    const first = m.items.findIndex((it) => !it.disabled && this.bagItemVisible(m, it) && it.pocket === p);
    if (first >= 0) m.idx = first;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) this.renderMenu();
  }

  bagTabMove(d) {
    const m = this.menu;
    if (!m || !m.bagTabs) return;
    const tabs = m.bagTabs;
    const i = tabs.indexOf(m.bagPocket);
    this.setBagPocket(tabs[(i + d + tabs.length) % tabs.length]);
  }

  moveMenu(d) {
    const m = this.menu;
    if (!m) return;
    const prev = m.idx;
    const n = m.items.length;
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (!m.items[i].disabled && this.bagItemVisible(m, m.items[i])) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) this._menuCursorDom(prev);
  }

  // AUDIT FIX (paging): Q/E / PgUp/PgDn jump a page (10 rows) through long
  // lists, clamped at the ends — the dex runs ~1,000 entries and previously
  // had NO fast travel at all (single steps only, no key repeat).
  moveMenuPage(d) {
    const m = this.menu;
    if (!m) return;
    const prev = m.idx;
    const step = d > 0 ? 1 : -1;
    for (let s = 0; s < 10; s++) {
      let i = m.idx + step;
      let moved = false;
      while (i >= 0 && i < m.items.length) {
        if (!m.items[i].disabled && this.bagItemVisible(m, m.items[i])) { m.idx = i; moved = true; break; }
        i += step;
      }
      if (!moved) break;
    }
    if (m.idx !== prev) {
      this.game.audio.playSfx(SFX['ui-tick']);
      if (!this.headless) this._menuCursorDom(prev);
    }
  }

  // AUDIT FIX: persist cursor (+pocket) for remember-menus on close.
  _storeMenuMem(m, idxOverride) {
    if (!m || !m.rememberKey) return;
    this._menuMem = this._menuMem || {};
    this._menuMem[m.rememberKey] = {
      idx: idxOverride !== undefined ? idxOverride : m.idx,
      pocket: m.bagPocket || null,
    };
  }

  chooseMenu(i) {
    const m = this.menu;
    if (!m) return;
    const idx = (i === undefined ? m.idx : i);
    const it = m.items[idx];
    if (!it) return;
    // BATTLE-FREEZE FIX: a disabled row must never eat the press in
    // silence (the faint-switch trap) — buzz so the player knows the
    // row is not selectable and moves the cursor.
    if (it.disabled) { this.game.audio.playSfx(SFX['error-buzz']); return; }
    this._storeMenuMem(m, idx);
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
    this._storeMenuMem(m);
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
    this.sumEl = this.el('div', 'sumpanel hidden', this.frame);
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
  }

  showEntryPanel(data, cb) {
    this.entryPanel = { data, cb: cb || null };
    this.log.push({ ui: 'dexentry', title: data && data.title });
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.add('menu-full');
    if (!this.headless) this.renderEntryPanel();
  }

  renderEntryPanel() {
    if (this.headless || !this.entryEl) return;
    const p = this.entryPanel;
    if (!p) { this.entryEl.classList.add('hidden'); return; }
    this.entryEl.classList.remove('hidden');
    this.entryHead.textContent = p.data.title || '';
    this.entryBody.innerHTML = p.data.bodyHtml || '';
  }

  updateEntryPanel(data) {
    if (!this.entryPanel) return;
    this.entryPanel.data = data;
    if (!this.headless) this.renderEntryPanel();
  }

  closeEntryPanel() {
    const p = this.entryPanel;
    if (!p) return;
    this.entryPanel = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.entryEl) this.entryEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    if (p.cb) p.cb('close');
  }

  get entryOpen() { return !!this.entryPanel; }

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
    head.textContent = 'TOWN MAP — KANTO';
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
  }

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
  }

  _mapNarrate() {
    if (this.headless || !this.mapNarr || !this.mapPanel) return;
    const n = this.mapPanel.data.nodes[this.mapPanel.cursor];
    this.mapNarr.textContent = 'Town Map — Kanto · ' + (n ? n.name + (n.current ? ' (you are here)' : '') : 'Nowhere yet');
  }

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
  }

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
    // Cinnabar is an island off the SW coast.
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
  }

  closeMapPanel() {
    const p = this.mapPanel;
    if (!p) return;
    this.mapPanel = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.mapEl) this.mapEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    if (p.cb) p.cb('close');
  }

  get mapOpen() { return !!this.mapPanel; }

  // ---- RT touch move pad (Elevation B7) ----
  // Four flat chips mirroring the canvas cooldown chips: one per ally
  // move, labelled with the move name + its slot key number. Tapping
  // fires the SAME path as keys 1-4 (BattleScene.rtTouchMove, which
  // guards exactly like the keyboard branch). Display is gated by the
  // same CSS rule as the touch controls (body.showtouch / coarse
  // pointer); visibility state is refreshed per render by the scene.
  buildRtMovePad() {
    this.rtPadEl = this.el('div', 'rtmoves hidden', this.frame);
    this.rtPadBtns = [];
    for (let i = 0; i < 4; i++) {
      const b = this.el('button', 'rtmove', this.rtPadEl);
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.game.audio.unlock();
        if (this.rtPadScene && this.rtPadScene.rtTouchMove) this.rtPadScene.rtTouchMove(i);
      });
      this.rtPadBtns.push(b);
    }
  }

  showRtMovePad(scene) {
    this.rtPadScene = scene;
    this._rtPadSig = null;
    if (!this.headless && this.rtPadEl) this.rtPadEl.classList.remove('hidden');
    this.refreshRtMovePad();
  }

  hideRtMovePad() {
    this.rtPadScene = null;
    if (!this.headless && this.rtPadEl) this.rtPadEl.classList.add('hidden');
  }

  refreshRtMovePad() {
    if (this.headless || !this.rtPadEl) return;
    const scene = this.rtPadScene;
    if (!scene || !scene.rt || !scene.ally) { this.rtPadEl.classList.add('hidden'); return; }
    // The pad retires under any modal layer, exactly like the canvas
    // chips are covered by the command panel / menus.
    const modal = this.menu || this.dlg || this.summary || this.pcPanel || this.entryPanel || this.mapPanel || this.loginOpen || this.nameEntry;
    if (modal || scene.state !== 'rt') { this.rtPadEl.classList.add('hidden'); return; }
    this.rtPadEl.classList.remove('hidden');
    // The scene composes the chip data (it owns MOVES + the cooldown
    // clocks); the pad is a dumb renderer, like the canvas chips.
    const chips = (typeof scene.rtPadMoves === 'function') ? scene.rtPadMoves() : [];
    const sig = chips.map((c) => c.name + ':' + c.pp + ':' + (c.cd > 0 ? 1 : 0)).join('|');
    if (sig === this._rtPadSig) return;
    this._rtPadSig = sig;
    chips.forEach((c, i) => {
      const b = this.rtPadBtns[i];
      if (!b) return;
      b.textContent = (i + 1) + ' ' + c.name + (c.cd > 0 ? ' CD ' + c.cd + 's' : (c.pp <= 0 ? ' NO PP' : ''));
      b.classList.toggle('cooling', c.cd > 0 || c.pp <= 0);
      b.style.display = '';
    });
    for (let i = chips.length; i < 4; i++) {
      if (this.rtPadBtns[i]) this.rtPadBtns[i].style.display = 'none';
    }
  }

  // ---- PC box panel (UI v2.4, defect 4) ----
  // A real box screen, not list modals: the caller (overworld-systems
  // openPc) owns ALL state (cursor, held mon, current box) and composes
  // bodyHtml (30-cell grid + party strip + info window); this class owns
  // the chrome — framed panel, box nav, key routing, pointer forwarding.
  // Actions delivered to the caller cb:
  //   ('move', 'up'|'down'|'left'|'right') ('box', -1|1) ('confirm')
  //   ('cancel') ('click', {act, idx})   — pointer on [data-pcact] nodes
  buildPcPanel() {
    this.pcEl = this.el('div', 'pcpanel hidden', this.frame);
    const head = this.el('div', 'pchead', this.pcEl);
    this.pcPrev = this.el('button', 'pcnav', head);
    this.pcPrev.textContent = '◀';
    this.pcTitle = this.el('div', 'pctitle', head);
    this.pcNext = this.el('button', 'pcnav', head);
    this.pcNext.textContent = '▶';
    this.pcBody = this.el('div', 'pcbody', this.pcEl);
    const foot = this.el('div', 'pcfoot', this.pcEl);
    foot.textContent = 'Arrows: move · A: pick up / place · Q/E: switch box · B: log off';
    const nav = (d) => (e) => { e.preventDefault(); if (this.pcPanel) this.pcPanel.cb('box', d); };
    this.pcPrev.addEventListener('pointerdown', nav(-1));
    this.pcNext.addEventListener('pointerdown', nav(1));
  }

  showPcPanel(data, cb) {
    this.pcPanel = { data, cb };
    this.log.push({ ui: 'pc', title: data && data.title });
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.add('menu-full');
    if (!this.headless) this.renderPcPanel();
  }

  renderPcPanel() {
    if (this.headless || !this.pcEl) return;
    const p = this.pcPanel;
    if (!p) { this.pcEl.classList.add('hidden'); return; }
    this.pcEl.classList.remove('hidden');
    this.pcTitle.textContent = p.data.title || '';
    this.pcBody.innerHTML = p.data.bodyHtml || '';
    this.pcBody.querySelectorAll('[data-pcact]').forEach((node) => {
      node.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.pcPanel) this.pcPanel.cb('click', { act: node.getAttribute('data-pcact'), idx: parseInt(node.getAttribute('data-idx') || '-1', 10) });
      });
    });
  }

  updatePcPanel(data) {
    if (!this.pcPanel) return;
    this.pcPanel.data = data;
    if (!this.headless) this.renderPcPanel();
  }

  closePcPanel() {
    if (!this.pcPanel) return;
    this.pcPanel = null;
    if (!this.headless && typeof document !== 'undefined' && document.body) document.body.classList.remove('menu-full');
    if (!this.headless && this.pcEl) this.pcEl.classList.add('hidden');
  }

  get pcOpen() { return !!this.pcPanel; }

  buildToasts() {
    this.toastEl = this.el('div', 'toasts', this.frame);
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
  //     <div class="hudchip objchip hidden"><span class="obj-kicker">▶ OBJECTIVE</span><span class="obj-text"></span></div>
  //     <div class="hudchip dexchip hidden"><span class="dexchip-text"></span></div>
  //   </div>
  // Visibility follows the HUD-strip rules exactly: the column is hidden by
  // .nohud (setHudVisible) and .inbattle (setBattleMode) in CSS, same as
  // .hudstrip — menus/dialogues overlay it, they do not hide it.
  buildHudChips() {
    const wrap = this.el('div', 'hudchips', this.frame);
    const loc = this.el('div', 'hudchip locchip hidden', wrap);
    const locText = this.el('span', 'locchip-text', loc);
    const obj = this.el('div', 'hudchip objchip hidden', wrap);
    const kick = this.el('span', 'obj-kicker', obj);
    kick.textContent = '▶ OBJECTIVE';
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
      b.addEventListener('click', () => this._loginTab(key)); // keyboard-activated buttons fire click only
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
    go.addEventListener('pointerdown', (e) => { e.preventDefault(); this._loginGuestGo(); });
    go.addEventListener('click', () => this._loginGuestGo()); // keyboard activation path (see _loginGuestGo)
    this._loginTab('guest');
  }

  _loginTab(key) {
    this._loginTabKey = key;
    for (const k of Object.keys(this._loginTabs)) {
      this._loginTabs[k].classList.toggle('sel', k === key);
      this._loginPanes[k].classList.toggle('hidden', k !== key);
    }
    this.game.audio.playSfx(SFX['ui-tick']);
  }

  // AUDIT FIX (S-02, blocker): the stub Terminal was pointer-only while it
  // swallowed every game key — a keyboard-only player could not start the
  // game in guest/personal builds. One activation path, three entrances:
  // pointer, keyboard (routed in update()), and native button click
  // (Tab-focus + Enter/Space fires click without pointerdown).
  _loginGuestGo() {
    if (!this.loginOpen || !this._loginCb) return;
    const cb = this._loginCb;
    this.game.audio.unlock();
    this._closeLogin();
    cb('guest');
  }

  _loginTabCycle(d) {
    const order = ['login', 'register', 'guest'];
    const i = order.indexOf(this._loginTabKey || 'guest');
    this._loginTab(order[(i + d + order.length) % order.length]);
  }

  _closeLogin() {
    this.loginOpen = false;
    if (this._loginOv && this._loginOv.parentNode) this._loginOv.parentNode.removeChild(this._loginOv);
    this._loginOv = null;
  }

  // ---- guest banner element (RETIRED in UI v2.1 — see showGuestBanner) ----
  buildGuestBanner() {
    const b = this.el('div', 'guestbanner hidden', this.root);
    const t = this.el('span', '', b);
    t.textContent = 'Guest — progress stays on this device · LOG IN';
    const x = this.el('button', 'gbx', b);
    x.textContent = '×';
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
    // UI v2.1 (defect 2): the in-game guest banner is RETIRED. It rendered as
    // a full-width bar across the top of the gameplay frame on the live
    // build. The guest notice now lives only in the flow where it belongs —
    // the Trainer ID Terminal's guest pane, which already reads "Progress
    // stays on this device — log in anytime to sync" (auth.mjs; the stub
    // terminal's guest pane carries the same message) — i.e. before play
    // starts, never over gameplay. This stays as a hiding no-op so the
    // existing call sites (startOverworld / openLogin) remain safe.
    this.hideGuestBanner();
  }

  hideGuestBanner() {
    if (this.headless || !this._guestBannerEl) return;
    this._guestBannerEl.classList.add('hidden');
  }

  // ---- P0/C3: name-entry A-Z grid keyboard ----
  // DOM: bottom-half grid (portrait) / 480px centered panel (desktop), 44px keys,
  // physical-keyboard support, 8-char max, validation shake on empty.
  // opts (AUDIT FIX S-03/S-04/S-20): { allowCancel, allowEmpty, emptyMsg }.
  // Required-name contexts (intro) pass nothing and keep the original
  // behaviour; search/nickname/confirm contexts opt into cancel + empty.
  showNameEntry(title, initial, maxLen, cb, opts) {
    opts = opts || {};
    if (this.headless) {
      // Harness contract: a menu-like state so menuOpen/debugChoose keep working.
      this.menu = {
        title, items: [{ label: initial + ' (default)', value: initial }],
        idx: 0, cb: (v) => cb(v || initial), kind: 'nameentry',
      };
      this.log.push({ ui: 'nameentry', title });
      return;
    }
    this.nameEntry = { value: initial || '', maxLen: maxLen || 8, cb, title, opts, lower: false };
    const ov = this.el('div', 'nkbover', this.root);
    this._nkbOv = ov;
    const card = this.el('div', 'namekb', ov);
    const h = this.el('div', 'nkb-title', card);
    h.textContent = title;
    const disp = this.el('div', 'nkb-display', card);
    this._nkbDisp = disp;
    this._nkbRender();
    const grid = this.el('div', 'nkb-grid', card);
    // AUDIT FIX (S-20): the charset was A-Z + '-' only — no digits, space,
    // period or apostrophe (Platinum's keyboard has all of them).
    // Elevation B6 (S-20 remainder): the aA key toggles letter case; the
    // letter keys re-label in the active case and typed case is kept.
    this._nkbLetterBtns = [];
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    for (const k of keys) {
      const b = this.el('button', 'nkb-key', grid);
      b.textContent = k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbTypeGrid(k); });
      if (/[A-Z]/.test(k)) this._nkbLetterBtns.push({ btn: b, ch: k });
    }
    const row = this.el('div', 'nkb-row', card);
    const bk = this.el('button', 'nkb-key wide', row);
    bk.textContent = '←';
    bk.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbBack(); });
    const sh = this.el('button', 'nkb-key wide', row);
    sh.textContent = 'aA';
    sh.setAttribute('aria-label', 'Toggle letter case');
    this._nkbShiftBtn = sh;
    sh.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbShift(); });
    for (const k of ['-', '.', "'", ' ']) {
      const b = this.el('button', 'nkb-key' + (k === ' ' ? ' wide' : ''), row);
      b.textContent = k === ' ' ? 'SPACE' : k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbType(k); });
    }
    const ok = this.el('button', 'nkb-key wide go', row);
    ok.textContent = 'OK';
    ok.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbOk(); });
    if (opts.allowCancel) {
      const cx = this.el('button', 'nkb-key wide', row);
      cx.textContent = 'CANCEL';
      cx.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbCancel(); });
    }
    // Physical keyboard: capture at document level so the game's KEYMAP never sees these.
    this._nkbKey = (e) => {
      if (!this.nameEntry) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Backspace') this._nkbBack();
      else if (e.key === 'Enter') this._nkbOk();
      else if (e.key === 'Escape' && this.nameEntry.opts && this.nameEntry.opts.allowCancel) this._nkbCancel();
      // Elevation B6: a physical keyboard types its own case (the real
      // Shift key is the toggle there); only the grid uses the aA key.
      else if (/^[a-zA-Z0-9\-'. ]$/.test(e.key)) this._nkbType(e.key);
    };
    document.addEventListener('keydown', this._nkbKey, true);
  }

  _nkbCancel() {
    const ne = this.nameEntry;
    if (!ne) return;
    const cb = ne.cb;
    this.game.audio.playSfx(SFX['ui-back']);
    this._nkbClose();
    cb(null);
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

  // Grid letters pass through the aA case toggle; digits/punct are
  // case-free and go through _nkbType directly.
  _nkbTypeGrid(ch) {
    const ne = this.nameEntry;
    if (!ne) return;
    this._nkbType(ne.lower && /[A-Z]/.test(ch) ? ch.toLowerCase() : ch);
  }

  _nkbShift() {
    const ne = this.nameEntry;
    if (!ne) return;
    ne.lower = !ne.lower;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (this._nkbLetterBtns) {
      for (const { btn, ch } of this._nkbLetterBtns) btn.textContent = ne.lower ? ch.toLowerCase() : ch;
    }
    if (this._nkbShiftBtn) this._nkbShiftBtn.classList.toggle('sel', ne.lower);
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
      // AUDIT FIX (S-04): contexts that promise "blank = all" (Dex search)
      // or clearing (nickname) opt into allowEmpty — the blanket shake
      // made a set Dex filter effectively un-clearable, and showed
      // trainer-name copy inside search/DELETE contexts.
      if (ne.opts && ne.opts.allowEmpty) {
        const cb = ne.cb;
        this._nkbClose();
        cb('');
        return;
      }
      // Validation shake on empty (P0/C3).
      this.game.audio.playSfx(SFX['error-buzz']);
      if (this._nkbOv) {
        this._nkbOv.classList.remove('shake');
        void this._nkbOv.offsetWidth;
        this._nkbOv.classList.add('shake');
      }
      this.toast((ne.opts && ne.opts.emptyMsg) || 'Give your trainer a name!');
      return;
    }
    // Elevation B6 (S-20 remainder): the value keeps the case the player
    // typed — the old blanket toUpperCase() is gone. (The DELETE
    // type-to-confirm compares case-insensitively at its call sites.)
    const cb = ne.cb, v = ne.value.trim().slice(0, ne.maxLen);
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
    const strip = this.el('div', 'hudstrip', this.frame);
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
        // AUDIT FIX (S-17): the strip stays visible under modal layers —
        // a tap during dialogue/a menu must not replace the single menu
        // slot mid-conversation and strand the pending callback.
        if (this.dlg || this.menu || this.summary || this.pcPanel || this.loginOpen || this.nameEntry) return;
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
    const b = this.el('button', 'moodpip hidden', this.frame);
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
      if (this.dlg || this.menu || this.summary || this.pcPanel || this.loginOpen || this.nameEntry) return; // S-17 guard, same as the HUD strip
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
    t.textContent = 'Keyboard: Arrows/WASD move · Z = A · X = B · Enter = menu · Q/E or PgUp/PgDn = page · Shift = select · M = mute · F = fullscreen';
    const x = this.el('button', 'hintcard-x', c);
    x.textContent = 'Got it ×';
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
    const d = this.el('div', 'chaptercard', this.frame);
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

  // UI v2.1: sync the FRAME LAYER's box to the canvas rect. All in-game DOM
  // (dialogue, menus, battle commands, HUD chips/strip, toasts, chapter
  // cards) positions against this layer, so it is geometrically impossible
  // for game chrome to land outside the frame on any viewport. (The v2
  // version of this method only nudged the chips column; the rest of the
  // DOM stayed viewport-anchored — the root cause of defects 2-5.)
  // Recompute only when the canvas rect actually changes (throttled by
  // update(); also called from buildHudChips, init end, window resize and
  // Game.applyLayout).
  _syncChipAnchor() {
    if (!this.frame || typeof document === 'undefined') return;
    const cv = document.getElementById && document.getElementById('game');
    if (!cv || !cv.getBoundingClientRect) return;
    const r = cv.getBoundingClientRect();
    if (!(r.width > 0)) return;
    const key = Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + ',' + Math.round(r.height);
    if (key === this._chipAnchorKey) return;
    this._chipAnchorKey = key;
    const s = this.frame.style;
    s.left = Math.round(r.left) + 'px';
    s.top = Math.round(r.top) + 'px';
    s.width = Math.round(r.width) + 'px';
    s.height = Math.round(r.height) + 'px';
  }

  update(dt) {
    this._chipTick = (this._chipTick || 0) + 1;
    if (this._chipTick % 15 === 0) this._syncChipAnchor();
    const input = this.game.input;
    // AUDIT FIX (S-16): the desktop hint card's dismiss was pointer-only.
    // Any confirm/back keypress dismisses it — peeked, not consumed, so
    // the same press still does its normal job.
    if (!this.headless && this._hintCard && !this._hintOff && !this._hintCard.classList.contains('hidden')) {
      const p = input.pressed || {};
      if (p.a || p.b || p.start || p.escape || p.select) {
        this._hintOff = true;
        this._hintCard.classList.add('hidden');
      }
    }
    // Dex entry panel is modal (Elevation B5): left/right (or Q/E page
    // keys) page between entries, B / START / ESC closes back to the list.
    if (this.entryPanel) {
      if (input.wasPressed('left') || input.wasPressed('pageup')) this.entryPanel.cb('page', -1);
      else if (input.wasPressed('right') || input.wasPressed('pagedown')) this.entryPanel.cb('page', 1);
      else if (input.wasPressed('b') || input.wasPressed('start') || input.wasPressed('escape')) { this.closeEntryPanel(); }
      return true;
    }
    // Town Map panel is modal (Elevation B1): arrows move the cursor
    // between visited places, B / START / ESC closes.
    if (this.mapPanel) {
      if (input.wasPressed('up')) this.mapMove('up');
      else if (input.wasPressed('down')) this.mapMove('down');
      else if (input.wasPressed('left')) this.mapMove('left');
      else if (input.wasPressed('right')) this.mapMove('right');
      else if (input.wasPressed('b') || input.wasPressed('start') || input.wasPressed('escape')) { this.closeMapPanel(); }
      // The "you are here" pulse runs on a slow redraw beat, not per frame.
      this._mapTick = (this._mapTick || 0) + 1;
      if (this._mapTick % 30 === 0) this.renderMapCanvas();
      return true;
    }
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
    // AUDIT FIX (S-02): stub Terminal keyboard routing — ←/→ switch tabs,
    // A/START activates PLAY AS GUEST on the guest tab (the disabled stub
    // tabs have no action). The full-auth panel (auth.mjs) uses native DOM
    // focus instead and never builds _loginTabs, so it is untouched here.
    if (this.loginOpen && this._loginTabs) {
      if (input.wasPressed('left') || input.wasPressed('pageup')) this._loginTabCycle(-1);
      else if (input.wasPressed('right') || input.wasPressed('pagedown')) this._loginTabCycle(1);
      else if ((input.wasPressed('a') || input.wasPressed('start')) && this._loginTabKey === 'guest') this._loginGuestGo();
      return true;
    }
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
      const grid = !!(this.menu.grid || this.menu.gridNav);
      // Elevation B4: an onKey menu (mart quantity stepper) claims the
      // direction + page keys for itself; A confirms, B cancels, exactly
      // like a normal menu otherwise.
      if (this.menu.onKey) {
        if (input.wasPressed('up')) this.menu.onKey('up');
        else if (input.wasPressed('down')) this.menu.onKey('down');
        else if (input.wasPressed('left')) this.menu.onKey('left');
        else if (input.wasPressed('right')) this.menu.onKey('right');
        else if (input.wasPressed('pageup')) this.menu.onKey('pageup');
        else if (input.wasPressed('pagedown')) this.menu.onKey('pagedown');
        else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
        else if (input.wasPressed('b') || input.wasPressed('escape')) {
          if (!this.menu.stickyCancel) this.cancelMenu();
          return true;
        }
        return true;
      }
      if (input.wasPressed('up')) { grid ? this.moveMenuGrid('up') : this.moveMenu(-1); }
      else if (input.wasPressed('down')) { grid ? this.moveMenuGrid('down') : this.moveMenu(1); }
      // AUDIT FIX (S-50): guards must run BEFORE wasPressed — wasPressed
      // consumes the edge even when the branch then fails, so the old
      // order let the bagTabs tests eat every pageup/pagedown edge in
      // non-bag menus (Q/E / PgUp / PgDn paging was dead in the Dex and
      // every other long list) and the grid tests eat battle left/right.
      else if (grid && !this.menu.bagTabs && input.wasPressed('left')) { this.moveMenuGrid('left'); }
      else if (grid && !this.menu.bagTabs && input.wasPressed('right')) { this.moveMenuGrid('right'); }
      else if (this.menu.bagTabs && input.wasPressed('left')) { this.bagTabMove(-1); }
      else if (this.menu.bagTabs && input.wasPressed('right')) { this.bagTabMove(1); }
      else if (this.menu.bagTabs && input.wasPressed('pageup')) { this.bagTabMove(-1); }
      else if (this.menu.bagTabs && input.wasPressed('pagedown')) { this.bagTabMove(1); }
      else if (input.wasPressed('pageup')) { this.moveMenuPage(-1); }
      else if (input.wasPressed('pagedown')) { this.moveMenuPage(1); }
      else if (this.menu.battle && input.wasPressed('left')) { grid ? this.moveMenuGrid('left') : this.moveMenu(-1); }
      else if (this.menu.battle && input.wasPressed('right')) { grid ? this.moveMenuGrid('right') : this.moveMenu(1); }
      else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
      else if (input.wasPressed('b') || input.wasPressed('escape')) {
        // AUDIT FIX (S-13): a sticky root menu (the classic command grid)
        // swallows B — Platinum has nothing beneath it, and cancelling +
        // re-showing was a flicker loop with a back-SFX.
        if (!this.menu.stickyCancel) this.cancelMenu();
        return true;
      }
      return true; // menu modal
    }
    // PC box panel is modal (UI v2.4): routed AFTER dialogue/menus so a
    // ui.say() notice (party full, partner refusal) can overlay it and be
    // advanced with A while the panel waits underneath.
    if (this.pcPanel) {
      const cb = this.pcPanel.cb;
      if (input.wasPressed('up')) cb('move', 'up');
      else if (input.wasPressed('down')) cb('move', 'down');
      else if (input.wasPressed('left')) cb('move', 'left');
      else if (input.wasPressed('right')) cb('move', 'right');
      else if (input.wasPressed('pageup')) cb('box', -1);
      else if (input.wasPressed('pagedown')) cb('box', 1);
      else if (input.wasPressed('select')) cb('link');
      else if (input.wasPressed('a') || input.wasPressed('start')) cb('confirm');
      else if (input.wasPressed('b') || input.wasPressed('escape')) cb('cancel');
      return true;
    }
    return false;
  }

  setBattleMode(on) {
    if (this.headless) { this.inBattle = !!on; return; }
    this.inBattle = !!on; // Track B: SYNC.tick defers the conflict sheet out of battle
    if (!on) this.hideRtMovePad(); // Elevation B7: the RT touch pad retires with the battle
    this.dpadEl.classList.toggle('hidden', on);
    // UI v2.2: do NOT unhide the command panel here — renderCommands() owns
    // its visibility (it unhides only when real commands populate it). The
    // v2.1 toggle was invisible then (transparent zero-height shell); with
    // the framed Platinum window an empty unhidden panel paints as a stray
    // window sliver under the message box during battle messages.
    this.cmdEl.classList.add('hidden');
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
