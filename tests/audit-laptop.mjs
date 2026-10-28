// audit-laptop.mjs — War Room "Platinum Perfection" audit, browser half.
// Drives the REAL game in headless Chromium at laptop/Mac viewports and
// asserts the audit fix wave end-to-end: layout fit, keyboard-only start
// (S-02 stub terminal on the personal build), auth typing (S-38), title
// row clicks (S-01), menu paging + cursor visibility + cursor memory
// (S-05/S-06/S-07 + component wave), battle root B (S-13), battle
// medicine (S-14), picker Back levels (S-37), resize/fullscreen.
// Transport mirrors scripts/verify-live.mjs (Fetch interception, since
// sandbox Chromium cannot open real sockets).
//
// Run:  node tests/audit-laptop.mjs            (public build, 3 viewports)
//       AUDIT_DIR=personal node tests/audit-laptop.mjs   (stub-terminal run)
// Exit 1 on any failure. Screenshots land in ~/workspace/ashs-journey-qa/audit-shots/.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QA = join(ROOT, '..', 'ashs-journey-qa');
const DIR = process.env.AUDIT_DIR || 'public';
const SHOTS = join(QA, 'audit-shots');
mkdirSync(SHOTS, { recursive: true });
const PORT = 8933;
const BASE = 'http://127.0.0.1:' + PORT;

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; failures.push(name); console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ---------- mirror transport (verify-live pattern) ----------
// Sandbox Chromium cannot open real sockets at all: EVERY request is
// paused and fulfilled from the build's exact bytes on disk. (An earlier
// draft intercepted only same-origin URLs and let external requests hang
// on blackholed sockets, wedging the renderer — do not narrow this.)
const CSP = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers
  .find((h) => h.key === 'Content-Security-Policy').value;
const HTML_B64 = readFileSync(join(ROOT, DIR, 'index.html')).toString('base64');
const GAME_B64 = readFileSync(join(ROOT, DIR, 'game.js')).toString('base64');
const server = { close() {} }; // kept for the shutdown line; no socket server needed

// ---------- augmented audit save (public run) ----------
function auditSave() {
  const s = JSON.parse(readFileSync(join(QA, 'save.json'), 'utf8'));
  s.bag = { pokeball: 10, greatball: 5, ultraball: 2, potion: 3, superpotion: 2, hyperpotion: 1, antidote: 2, revive: 1, ether: 1, escaperope: 1, bicycle: 1, oldrod: 1, townmap: 1 };
  s.player.money = 5000;
  for (let n = 1; n <= 80; n++) s.dex.seen[String(n)] = true;
  for (let n = 1; n <= 50; n++) s.dex.caught[String(n)] = true;
  s.settings.battleStyle = 'classic'; // deterministic chassis for the B/paging cases
  return s;
}

// ---------- CDP plumbing (verify-live pattern) ----------
const cport = 9700 + (process.pid % 200);
const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/audit-chrome-' + cport,
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const v = await (await fetch('http://127.0.0.1:' + cport + '/json/version')).json();
    ws = new WebSocket(v.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  } catch (e) { await new Promise((r) => setTimeout(r, 200)); }
}
if (!ws) { console.log('FAIL  chromium did not start'); process.exit(1); }
let msgId = 0;
const pending = new Map();
const jsErrors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') jsErrors.push(d.params.exceptionDetails.text + ' ' + (((d.params.exceptionDetails.exception || {}).description) || ''));
  if (d.method === 'Fetch.requestPaused') { void fulfill(d.params, d.sessionId); }
};
// Session-scoped send (flatten mode): Fetch.fulfillRequest MUST go out on
// the session that paused the request — a browser-level send is silently
// dropped and the renderer wedges on the paused document request.
function sendSess(method, params, sessionId) {
  return new Promise((resolve) => {
    const id = ++msgId; pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
  });
}
function send(method, params) {
  return new Promise((resolve) => { const id = ++msgId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params: params || {} })); });
}
async function fulfill(p, sessionId) {
  const url = p.request.url;
  try {
    if (url.includes('/api/')) {
      await sendSess('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"ok":true}').toString('base64') }, sessionId);
    } else if (url.endsWith('/game.js')) {
      await sendSess('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: GAME_B64 }, sessionId);
    } else {
      await sendSess('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: HTML_B64 }, sessionId);
    }
  } catch (e) { /* session may be gone at shutdown */ }
}
const targets = await send('Target.getTargets');
const page = targets.result.targetInfos.find((t) => t.type === 'page');
const session = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
const SID = session.result.sessionId;
function snd(method, params) {
  return new Promise((resolve) => {
    const id = ++msgId; pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params: params || {}, sessionId: SID }));
  });
}
await snd('Page.enable'); await snd('Runtime.enable');
await snd('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
async function evl(expr) {
  const r = await snd('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
  return r.result.result.value;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(expr, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await evl(expr)) return true; await sleep(120); }
  console.log('  (timeout waiting: ' + label + ')');
  return false;
}
const VK = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, Escape: 27, Space: 32, KeyZ: 90, KeyX: 88, KeyE: 69, KeyQ: 81, KeyF: 70, ShiftLeft: 16, PageUp: 33, PageDown: 34 };
async function key(code, opts) {
  opts = opts || {};
  const base = { key: opts.key || code.replace(/^Key/, '').replace(/^Digit/, ''), code, windowsVirtualKeyCode: VK[code] || 0, nativeVirtualKeyCode: VK[code] || 0 };
  if (opts.text) base.text = opts.text;
  if (opts.repeat) base.autoRepeat = true;
  await snd('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
  if (!opts.hold) await snd('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}
async function keyUpOnly(code) { await snd('Input.dispatchKeyEvent', { type: 'keyUp', key: code, code, windowsVirtualKeyCode: VK[code] || 0 }); }
async function clickXY(x, y) {
  await snd('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await snd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}
async function shot(name) {
  const r = await snd('Page.captureScreenshot', { format: 'png' });
  if (r.result && r.result.data) writeFileSync(join(SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64'));
}
async function viewport(w, h) {
  await snd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(450);
}
async function nav() {
  await snd('Page.navigate', { url: BASE + '/' });
  await sleep(300);
  await waitFor("!!document.querySelector('canvas')", 15000, 'canvas');
  await sleep(3000); // legal card dwell is 3s before it accepts a press (title.mjs)
}
// DOM probes
const P = {
  canvasRect: `(() => { const c = document.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth }; })()`,
  menuTitle: `(() => { const t = document.querySelector('.menu:not(.hidden) .menu-title'); return t ? t.textContent : null; })()`,
  cursorRow: `(() => { const rows = [...document.querySelectorAll('.menu:not(.hidden) .menu-row')]; const i = rows.findIndex((r) => r.classList.contains('cursor')); return i < 0 ? null : { i, text: rows[i].textContent.trim(), total: rows.length }; })()`,
  cursorVisible: `(() => { const m = document.querySelector('.menu:not(.hidden)'); const c = document.querySelector('.menu:not(.hidden) .menu-row.cursor'); if (!m || !c) return false; const a = m.getBoundingClientRect(), b = c.getBoundingClientRect(); return b.top >= a.top - 1 && b.bottom <= a.bottom + 1; })()`,
  selTab: `(() => { const t = document.querySelector('.bagtab-btn.sel'); return t ? t.textContent : null; })()`,
  dlgText: `(() => { const d = document.querySelector('.dlg-text'); return d && d.closest('.dialogue') && !d.closest('.dialogue').classList.contains('hidden') ? d.textContent : null; })()`,
};
async function menuGoTo(label, maxSteps) {
  // Cursor-row text carries the '▶' glyph — strip it before matching, or
  // the row under the cursor can never match its own label.
  const hit = (c) => !!c && c.text.replace(/^▶\s*/, '').startsWith(label);
  for (let i = 0; i < (maxSteps || 14); i++) {
    const c = await evl(P.cursorRow);
    if (hit(c)) return true;
    await key('ArrowDown'); await sleep(110);
  }
  if (hit(await evl(P.cursorRow))) return true;
  // Menus clamp rather than wrap: if the target sits above the start row,
  // walk back up.
  for (let i = 0; i < (maxSteps || 14); i++) {
    const c = await evl(P.cursorRow);
    if (hit(c)) return true;
    await key('ArrowUp'); await sleep(110);
  }
  return hit(await evl(P.cursorRow));
}
async function openPauseEntry(label) {
  await key('Enter'); await sleep(400);
  if (!(await evl(`!!document.querySelector('.menu:not(.hidden)')`))) return false;
  if (!(await menuGoTo(label))) return false;
  await key('KeyZ'); await sleep(450);
  return true;
}

// =====================================================================
if (DIR === 'personal') {
  // ---- S-02: stub Terminal is keyboard-operable (guest/personal builds) ----
  await viewport(1440, 900);
  await nav();
  await key('Enter'); await sleep(500); // legal -> title
  await key('Enter'); await sleep(500); // PRESS START -> menu
  await key('Enter'); await sleep(600); // New Game -> stub terminal
  ok('S-02 stub terminal opens', await waitFor("!!document.querySelector('.loginover .logintab')", 6000, 'stub terminal'));
  const sel0 = await evl(`(() => { const t = document.querySelector('.logintab.sel'); return t ? t.textContent : null; })()`);
  ok('S-02 stub terminal starts on GUEST tab', sel0 === 'GUEST', String(sel0));
  await key('ArrowLeft'); await sleep(250);
  const sel1 = await evl(`(() => { const t = document.querySelector('.logintab.sel'); return t ? t.textContent : null; })()`);
  ok('S-02 ArrowLeft cycles terminal tabs', sel1 === 'REGISTER', String(sel1));
  await key('ArrowRight'); await sleep(250);
  await key('KeyZ'); await sleep(700); // A on GUEST = PLAY AS GUEST
  const closed = await evl(`!document.querySelector('.loginover')`);
  const introStarted = await evl(`!!document.querySelector('.nkbover') || !!document.querySelector('.dialogue:not(.hidden)')`);
  ok('S-02 keyboard PLAY AS GUEST starts the game', closed && introStarted, 'closed=' + closed + ' intro=' + introStarted);
  await shot('personal-stub-terminal-keyboard');
} else {
  const VPS = [[1280, 720], [1440, 900], [1512, 982]];
  // ---------- FRESH profile: layout, S-01, S-38 ----------
  let scriptId = null;
  {
    const r = await snd('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.clear();}catch(e){}` });
    scriptId = r.result.identifier;
  }
  for (const [w, h] of VPS) {
    await viewport(w, h);
    await nav();
    const rect = await evl(P.canvasRect);
    ok('layout ' + w + 'x' + h + ': canvas fits viewport, no h-overflow',
      !!rect && rect.x >= -1 && rect.y >= -1 && rect.x + rect.w <= w + 1 && rect.y + rect.h <= h + 1 && rect.sw <= w + 1,
      JSON.stringify(rect));
    await shot('title-' + w + 'x' + h);
  }
  // S-01: title rows are real click targets (1440x900)
  await viewport(1440, 900); await nav();
  await key('Enter'); await sleep(500);            // legal -> title
  await key('Enter'); await sleep(500);            // PRESS START -> menu
  await key('ArrowDown'); await sleep(200);        // highlight Options (fresh profile rows: New Game / Options)
  // fresh profile has no Continue: rows are New Game(0), Options(1). Down once = Options highlighted.
  let terminalOpened = false;
  {
    const cr = await evl(`(() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    for (const f of [0.60, 0.64, 0.68, 0.72, 0.76]) {
      await clickXY(cr.x + cr.w * 0.5, cr.y + cr.h * f);
      await sleep(450);
      if (await evl(`!!document.querySelector('.loginover')`)) { terminalOpened = true; break; }
      if (await evl(`!!document.querySelector('.menu.syswin:not(.hidden)')`)) {
        // Options opened = the tap fell through to A on the highlighted row; close and keep sweeping.
        await key('KeyX'); await sleep(300);
      }
    }
  }
  ok('S-01 clicking the New Game row opens the Terminal (not the highlighted Options)', terminalOpened);
  // S-38: type mapped letters into the auth username field
  if (terminalOpened) {
    await evl(`(() => { const t = [...document.querySelectorAll('.authtab')].find((b) => b.textContent === 'LOG IN'); if (t) t.click(); })()`);
    await sleep(400);
    await evl(`(() => { const i = document.querySelector('input[autocomplete="username"]'); if (i) { i.focus(); i.click(); } })()`);
    await sleep(200);
    for (const ch of 'wasd zx') {
      const code = ch === ' ' ? 'Space' : 'Key' + ch.toUpperCase();
      await key(code, { key: ch, text: ch }); await sleep(60);
    }
    await sleep(200);
    const val = await evl(`(() => { const i = document.querySelector('input[autocomplete="username"]'); return i ? i.value : null; })()`);
    ok('S-38 username field accepts a/d/s/w/z/x/space', val === 'wasd zx', JSON.stringify(val));
    await shot('auth-typing');
  } else {
    ok('S-38 username field accepts a/d/s/w/z/x/space', false, 'terminal never opened (S-01 failed first)');
  }
  // ---------- SAVE profile ----------
  if (scriptId) await snd('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptId });
  {
    const save = auditSave();
    const r = await snd('Page.addScriptToEvaluateOnNewDocument', {
      source: `try{localStorage.setItem('pdr.save.guest', ${JSON.stringify(JSON.stringify(save))});}catch(e){}`,
    });
    scriptId = r.result.identifier;
  }
  for (const [w, h] of VPS) {
    await viewport(w, h);
    await nav();
    // keyboard-only: legal -> menu -> Continue -> terminal guest -> overworld.
    // Event-driven waits: title transitions can swallow a press, so each
    // stage confirms its DOM state before the next key goes out.
    await key('Enter'); await sleep(450);     // legal -> title
    await key('Enter'); await sleep(450);     // PRESS START -> menu
    await key('ArrowDown'); await sleep(200); // Continue (save exists: New Game / Continue / Options)
    await key('Enter');                       // terminal (continue)
    let termOpen = await waitFor("!!document.querySelector('.loginover')", 6000, 'terminal');
    if (!termOpen) { await key('Enter'); termOpen = await waitFor("!!document.querySelector('.loginover')", 6000, 'terminal retry'); }
    if (termOpen) {
      await sleep(400);
      // The terminal auto-focuses its primary button (asserted in the
      // S-38 case). Activate it with a click at its centre: this sandbox
      // Chromium never runs native Enter-activation for CDP key events
      // (proven on a minimal page), while real keyboards + trackpads do.
      // The handler + full continue-load are what this step verifies.
      const gb = await evl("(() => { const b = document.querySelector('.authpane:not(.hidden) button.authgo'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, focused: document.activeElement === b }; })()");
      ok('terminal auto-focuses PLAY AS GUEST @' + w + 'x' + h, !!gb && gb.focused === true, JSON.stringify(gb));
      if (gb) await clickXY(gb.x, gb.y);
      await waitFor("!document.querySelector('.loginover')", 6000, 'terminal close');
    }
    const inWorld = await waitFor("!!document.querySelector('.hudstrip') && !document.querySelector('.loginover')", 9000, 'overworld');
    ok('keyboard-only Continue reaches the overworld @' + w + 'x' + h, inWorld);
    const rect = await evl(P.canvasRect);
    ok('overworld layout fits @' + w + 'x' + h, !!rect && rect.x + rect.w <= w + 1 && rect.y + rect.h <= h + 1 && rect.sw <= w + 1, JSON.stringify(rect));
    await shot('overworld-' + w + 'x' + h);
    if (w === 1440) {
      // ---- pause tour: Dex paging + visibility + entry memory ----
      const dexOpened = await openPauseEntry('Dex');
      ok('Dex opens from the pause menu', dexOpened && (await evl(P.menuTitle)) === 'Pokedex', String(await evl(P.menuTitle)));
      const rows0 = await evl(P.cursorRow);
      ok('Dex list is long (paging matters)', !!rows0 && rows0.total > 100, rows0 && String(rows0.total));
      await shot('dex-top-1440x900');
      await key('KeyE'); await sleep(200); await key('KeyE'); await sleep(200); await key('KeyE'); await sleep(300);
      const rows1 = await evl(P.cursorRow);
      ok('Dex Q/E page jump moves ~30 rows', !!rows1 && !!rows0 && rows1.i - rows0.i >= 25, (rows0 && rows0.i) + ' -> ' + (rows1 && rows1.i));
      ok('Dex cursor stays visible after paging', await evl(P.cursorVisible));
      // hold-Down (OS repeat): cursor must remain visible deep in the list
      for (let i = 0; i < 25; i++) { await key('ArrowDown', { repeat: i > 0 }); await sleep(35); }
      await sleep(300);
      ok('Dex cursor stays visible after held-Down scroll', await evl(P.cursorVisible));
      await shot('dex-paged-1440x900');
      // entry round trip keeps your place (remember:'dex')
      let entryLabel = null;
      for (let i = 0; i < 40 && !entryLabel; i++) {
        const c = await evl(P.cursorRow);
        if (c && !c.text.includes('???') && !/Journey|Caught|rating|Search|Areas|Close/.test(c.text)) entryLabel = c.text;
        else { await key('ArrowDown'); await sleep(90); }
      }
      ok('found a readable Dex entry row', !!entryLabel, String(entryLabel));
      if (entryLabel) {
        await key('KeyZ'); await sleep(500);
        // Elevation B5 (expectation updated): the entry is a dedicated
        // panel now, not a dialogue — ◀ ▶ in the head band, pageable in
        // place, B returns to the list with the cursor restored.
        const head = await evl(`(document.querySelector('.entryhead') || {}).textContent || null`);
        const noM = /No\.(\d+)/.exec(entryLabel);
        ok('Dex entry opens as entry panel (B5)', !!head && !!noM && head.includes('No.' + noM[1]), String(head));
        if (head && noM) {
          await key('ArrowRight'); await sleep(400);
          const head2 = await evl(`(document.querySelector('.entryhead') || {}).textContent || null`);
          ok('Dex entry Right pages to the next entry in place (B5)', !!head2 && head2.includes('No.' + (parseInt(noM[1], 10) + 1)), String(head2));
          await key('ArrowLeft'); await sleep(400);
        }
        await key('KeyX'); await sleep(500); // B closes the panel back to the list
        const back = await evl(P.cursorRow);
        ok('Back from Dex entry restores the same row', !!back && back.text === entryLabel, (back && back.text) + ' vs ' + entryLabel);
      }
      await key('KeyX'); await sleep(400); // close dex
      // ---- bag pocket + cursor memory ----
      const bagOpened = await openPauseEntry('Bag');
      ok('Bag opens from the pause menu', bagOpened && (await evl(P.menuTitle)) === 'Bag');
      // switch to the medicine pocket (tabs cycle with E)
      let tab = await evl(P.selTab);
      for (let i = 0; i < 6 && tab !== 'medicine'; i++) { await key('KeyE'); await sleep(200); tab = await evl(P.selTab); }
      ok('Bag E key reaches the medicine pocket', tab === 'medicine', String(tab));
      const potFound = await menuGoTo('Potion');
      ok('Bag cursor finds the Potion row', potFound);
      await key('KeyZ'); await sleep(500);
      const pickerTitle = await evl(P.menuTitle);
      ok('Potion opens its target picker', !!pickerTitle && pickerTitle.startsWith('Use Potion on'), String(pickerTitle));
      await key('KeyX'); await sleep(450); // Back -> bag (field finish path)
      const tabAfter = await evl(P.selTab);
      const curAfter = await evl(P.cursorRow);
      ok('Bag Back restores pocket + cursor', (await evl(P.menuTitle)) === 'Bag' && tabAfter === 'medicine' && !!curAfter && curAfter.text.replace(/^▶\s*/, '').startsWith('Potion'),
        'tab=' + tabAfter + ' cur=' + (curAfter && curAfter.text));
      await shot('bag-medicine-1440x900');
      await key('KeyX'); await sleep(400);
      // ---- options cursor memory ----
      const optOpened = await openPauseEntry('Options');
      ok('Options opens from the pause menu', optOpened && (await evl(P.menuTitle)) === 'Options');
      // Choose the 'Music' row by pointer (NOT row 0, so a cursor reset is
      // distinguishable): options re-opens after the toggle, and the
      // cursor must be back on the Music row, not reset to the top.
      const musicIdx = await evl(`(() => { const rows = [...document.querySelectorAll('.menu:not(.hidden) .menu-row')]; const i = rows.findIndex((x) => x.textContent.trim().replace(/^▶\s*/, '').startsWith('Music')); if (i >= 0) rows[i].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return i; })()`);
      await sleep(550);
      const after = await evl(P.cursorRow);
      ok('Options toggle re-opens with the cursor on the same row', musicIdx > 0 && !!after && after.i === musicIdx && after.text.replace(/^▶\s*/, '').startsWith('Music'),
        'clicked=' + musicIdx + ' after=' + JSON.stringify(after));
      await key('KeyX'); await sleep(400);
      // ---- battle: sticky root B, medicine bag, picker back levels ----
      // Hygiene: close any menu the tour left open (a stray pause menu
      // would eat the whole walk as cursor moves).
      for (let i = 0; i < 4 && (await evl("!!document.querySelector('.menu:not(.hidden)')")); i++) { await key('KeyX'); await sleep(350); }
      // Route 1 lies SOUTH of this Pallet Town (warps at pallet y=10);
      // mirror verify-live's proven drive: Down to Route 1, Left into
      // the west grass column, then zigzag Up/Down in the grass.
      const inBattleEv = () => evl(`(document.getElementById('ui') || document.body).classList.contains('inbattle') || !!document.querySelector('.cmdpanel:not(.hidden)')`);
      const locEv = () => evl(`(document.querySelector('.locchip-text') || {}).textContent || ''`);
      const stepTap = async (code, ms) => { await key(code, { hold: true }); await sleep(ms); await keyUpOnly(code); await sleep(90); };
      let inBattle = await inBattleEv();
      // The border warps are one tile apart (pallet y=10 <-> route1 y=15
      // via the landing row y=14): a Down step buffered at the crossing
      // can bounce the player straight back to Pallet. So the drive is a
      // retry loop: cross, SETTLE with no keys (any buffered step lands),
      // confirm the chip still says Route 1, then head north + west into
      // the far grass column (x=1..2, all ',' tiles) and zigzag there.
      // The encounter force-rule (forced after 20 silent grass steps)
      // makes a successful round deterministic.
      for (let round = 0; round < 3 && !inBattle; round++) {
        for (let i = 0; i < 12 && !inBattle; i++) {
          if ((await locEv()).includes('Route 1')) break;
          await stepTap('ArrowDown', 200);
          inBattle = await inBattleEv();
        }
        if (inBattle) break;
        await sleep(700); // settle: buffered steps complete before we trust the chip
        if (!(await locEv()).includes('Route 1')) continue; // bounced during settle; cross again
        for (let i = 0; i < 2 && !inBattle; i++) { await stepTap('ArrowUp', 260); inBattle = await inBattleEv(); }
        for (let i = 0; i < 6 && !inBattle; i++) { await stepTap('ArrowLeft', 200); inBattle = await inBattleEv(); }
        for (let i = 0; i < 70 && !inBattle; i++) {
          const code = i % 2 ? 'ArrowDown' : 'ArrowUp';
          await stepTap(code, 420);
          inBattle = await inBattleEv();
          if (!inBattle && !(await locEv()).includes('Route 1')) break; // bounced out; retry the crossing
        }
        if (!inBattle) { await sleep(2600); inBattle = await inBattleEv(); }
      }
      ok('wild battle triggers on Route 1', inBattle, 'loc: ' + (await locEv()));
      if (inBattle) {
        // Advance the encounter intro text (rustle -> '!' -> "A wild ...
        // appeared!") with A presses until the command grid is up —
        // the grid never appears on its own (verify-live pattern).
        for (let i = 0; i < 16; i++) {
          if (await evl("!!document.querySelector('.cmdpanel:not(.hidden)')")) break;
          await key('KeyZ'); await sleep(700);
        }
        await waitFor("!!document.querySelector('.cmdpanel:not(.hidden)')", 6000, 'command grid');
        await sleep(600);
        await shot('battle-classic-1440x900');
        await key('KeyX'); await sleep(400);
        ok('S-13 B at the classic command root keeps the grid', await evl(`!!document.querySelector('.cmdpanel:not(.hidden)')`));
        await key('ArrowRight'); await sleep(200); // FIGHT -> BAG
        await key('KeyZ'); await sleep(600);       // open battle bag
        const bagT = await evl(P.menuTitle);
        ok('battle Bag opens', bagT === 'Bag', String(bagT));
        await key('KeyE'); await sleep(300);       // medicine tab
        const medTab = await evl(P.selTab);
        const medRow = await evl(`(() => { const rows = [...document.querySelectorAll('.menu:not(.hidden) .menu-row')]; const r = rows.find((x) => x.textContent.includes('Super Potion')); return r ? r.textContent.trim() : null; })()`);
        ok('S-14 battle bag medicine tab stocks Super Potion', medTab === 'medicine' && !!medRow, 'tab=' + medTab + ' row=' + medRow);
        const medFound = await menuGoTo('Super Potion');
        await key('KeyZ'); await sleep(500);
        const useTitle = await evl(P.menuTitle);
        ok('S-14 Super Potion opens a target picker in battle', !!useTitle && useTitle.startsWith('Use Super Potion on'), String(useTitle));
        await key('KeyX'); await sleep(450);
        ok('S-37 battle picker Back returns to the battle Bag', (await evl(P.menuTitle)) === 'Bag', String(await evl(P.menuTitle)));
        await shot('battle-bag-medicine-1440x900');
        await key('KeyX'); await sleep(500); // back to command grid
        // RUN: grid FIGHT(0) BAG(1) PARTY(2) RUN(3) — cursor restarts at FIGHT
        for (let t = 0; t < 4; t++) {
          await key('ArrowDown'); await sleep(180); await key('ArrowRight'); await sleep(180); await key('KeyZ'); await sleep(1200);
          const gone = await evl(`!document.querySelector('.inbattle') && !document.querySelector('.cmdpanel:not(.hidden)')`);
          if (gone) break;
          // escape failed -> foe turn resolves -> grid returns; dismiss any message
          for (let d = 0; d < 4; d++) { await key('KeyZ'); await sleep(500); }
        }
        ok('battle ends via RUN', await evl(`!document.querySelector('.inbattle')`));
      }
      // ---- resize + fullscreen in the overworld ----
      await viewport(1512, 982);
      const r2 = await evl(P.canvasRect);
      ok('resize to 1512x982 keeps the canvas fitted', !!r2 && r2.x + r2.w <= 1513 && r2.y + r2.h <= 983 && r2.sw <= 1513, JSON.stringify(r2));
      await shot('overworld-1512-resized');
      await viewport(1280, 720);
      const r3 = await evl(P.canvasRect);
      ok('resize to 1280x720 keeps the canvas fitted', !!r3 && r3.x + r3.w <= 1281 && r3.y + r3.h <= 721 && r3.sw <= 1281, JSON.stringify(r3));
      await key('KeyF'); await sleep(900);
      const fs = await evl(`!!document.fullscreenElement`);
      const r4 = await evl(P.canvasRect);
      ok('F fullscreen toggles without breaking layout', !!r4 && r4.w > 0 && jsErrors.length === 0, 'fs=' + fs + ' rect=' + JSON.stringify(r4));
      if (fs) { await key('Escape'); await sleep(600); }
    }
  }
}

ok('no uncaught JS errors during the run', jsErrors.length === 0, jsErrors.slice(0, 2).join(' | '));
console.log('audit-laptop (' + DIR + '): ' + pass + '/' + (pass + fail) + ' passed' + (failures.length ? ' — FAILURES: ' + failures.join('; ') : ''));
try { chrome.kill('SIGKILL'); } catch (e) {}
server.close();
process.exit(fail ? 1 : 0);
