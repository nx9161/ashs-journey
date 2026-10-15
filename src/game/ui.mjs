// ui.mjs — DOM chrome: D-pad/A/B overlays, dialogue, menus, panels.
// Two backends: browser DOM, and headless (records calls; input-driven).
// Battle command panel replaces the D-pad zone (one-thumb rule, gameux §2).

export const TEXT_SPEED_CPS = { slow: 15, normal: 30, fast: 60, instant: 9999 };

import { SFX } from '../engine/audio.mjs';

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
  }

  init() {
    if (this.headless) return;
    const doc = document;
    this.root = doc.getElementById('ui');
    this.buildControls();
    this.buildDialogue();
    this.buildMenu();
    this.buildToasts();
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
    const sys = this.el('div', 'sysbtns', g);
    const mkS = (action, label) => {
      const b = this.el('button', 'sysbtn', sys);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      return b;
    };
    mkS('start', 'START'); mkS('select', 'SELECT');
    // Command panel (battle) — hidden unless battle scene shows it.
    this.cmdEl = this.el('div', 'cmdpanel hidden', g);
  }

  // Battle command panel: 2x2 grid replacing the D-pad zone (gameux §4.2).
  showCommands(items, cb) {
    // items: [{label, icon, value, disabled}]
    this.menu = { title: null, items, idx: 0, cb, battle: true, kind: 'commands' };
    this.log.push({ ui: 'commands', items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  buildDialogue() {
    this.dlgEl = this.el('div', 'dialogue hidden', this.root);
    this.dlgName = this.el('div', 'dlg-name', this.dlgEl);
    this.dlgText = this.el('div', 'dlg-text', this.dlgEl);
    this.dlgHint = this.el('div', 'dlg-hint', this.dlgEl);
    this.dlgHint.textContent = '▼';
  }

  say(lines, cb, speaker) {
    this.dlg = { lines: lines.slice(), idx: 0, chars: 0, cb: cb || null, speaker: speaker || null, done: false };
    this.log.push({ ui: 'dialogue', lines });
    if (!this.headless) {
      this.dlgEl.classList.remove('hidden');
      this.dlgName.textContent = this.dlg.speaker || '';
      this.dlgName.style.display = this.dlg.speaker ? 'block' : 'none';
      this.dlgText.textContent = '';
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

  showMenu(title, items, cb, opts) {
    this.menu = { title, items, idx: 0, cb, battle: !!(opts && opts.battle), kind: 'menu' };
    this.log.push({ ui: 'menu', title, items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  renderMenu() {
    if (this.headless) return;
    const m = this.menu;
    if (!m) { this.menuEl.classList.add('hidden'); return; }
    this.menuEl.classList.remove('hidden');
    this.menuTitle.textContent = m.title || '';
    this.menuTitle.style.display = m.title ? 'block' : 'none';
    this.menuList.innerHTML = '';
    m.items.forEach((it, i) => {
      const r = document.createElement('button');
      r.className = 'menu-row' + (i === m.idx ? ' cursor' : '') + (it.disabled ? ' disabled' : '');
      r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span><span>' + it.label + '</span>';
      r.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
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
    this.menu = null;
    if (!this.headless) this.menuEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-blip']);
    const cb = m.cb;
    if (cb) cb(it.value, idx);
  }

  cancelMenu() {
    const m = this.menu;
    if (!m) return;
    this.menu = null;
    if (!this.headless) this.menuEl.classList.add('hidden');
    this.game.audio.playSfx(SFX['ui-back']);
    const cb = m.cb;
    if (cb) cb(null, -1);
  }

  get menuOpen() { return !!this.menu; }

  buildToasts() {
    this.toastEl = this.el('div', 'toasts', this.root);
  }

  toast(text) {
    this.toastQ.push({ text, t: 0 });
    this.log.push({ ui: 'toast', text });
    if (this.headless) return;
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    this.toastEl.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2500);
  }

  // Per-tick UI input handling. Returns true if UI consumed input.
  update(dt) {
    const input = this.game.input;
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
      if (input.wasPressed('up')) this.moveMenu(-1);
      else if (input.wasPressed('down')) this.moveMenu(1);
      else if (input.wasPressed('left') && this.menu.battle) this.moveMenu(-1);
      else if (input.wasPressed('right') && this.menu.battle) this.moveMenu(1);
      else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
      else if (input.wasPressed('b') || input.wasPressed('escape')) { this.cancelMenu(); return true; }
      return true; // menu modal
    }
    return false;
  }

  setBattleMode(on) {
    if (this.headless) return;
    this.dpadEl.classList.toggle('hidden', on);
    this.cmdEl.classList.toggle('hidden', !on);
  }

  setHudVisible(v) {
    if (this.headless) return;
    this.root.classList.toggle('nohud', !v);
  }

  // Headless test helper: choose a menu item by index.
  debugChoose(i) { this.chooseMenu(i); }
}
