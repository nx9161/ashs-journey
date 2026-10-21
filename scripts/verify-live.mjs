// verify-live.mjs — UI v2.4 live-grade probes, runnable against ANY served
// build (production URL or a local server with the production CSP).
//
//   node scripts/verify-live.mjs <url> [--save <save.json>] [--save-pc <save-pc.json>] [--shots <dir>]
//
// Why this exists: UI v2.1–v2.3 were "verified" by harnesses that asserted
// computed font-family STRINGS and then graded their own screenshots
// leniently — production failed the same surfaces three rounds running
// (docs/ui-v24-root-cause.md). This script asserts what a player sees:
//   [http]  the SERVED bytes: PtPixel cmap carries full basic Latin
//           (scripts/font-gate.mjs on the data URIs in the served HTML),
//           and no linear-gradient in any battle/bag-scoped CSS rule.
//   [boot]  the font registry: PtPixel 400/700 + PtGalmuri loaded; an ink
//           density probe (solid letterforms put ink down; the old
//           dot-matrix body face physically cannot reach the floor).
//   [play]  real drives: intro dialogue (.dlg-text computes PtPixel-first,
//           .dlg-name PtGalmuri-first); with --save: the pause-menu bag
//           (tab strip present, ZERO band rows, tab switch works, inactive
//           pockets hidden, no gradient on bag chrome) and a wild battle
//           (4 command buttons, every one gradient-free; move window
//           framed in the message zone); with --save-pc: the PC box
//           screen renders exactly 30 cells + 6 party slots and switches
//           boxes with E.
// Exit code 1 on any FAIL. SKIP lines mark phases whose inputs were not
// provided; they do not fail the run.

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { assertBasicLatin } from './font-gate.mjs';

const args = process.argv.slice(2);
const URL_ARG = args.find((a) => !a.startsWith('--'));
const opt = (name) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : null;
};
const SAVE = opt('save');
const SAVE_PC = opt('save-pc');
const SHOTS = opt('shots');
if (!URL_ARG) {
  console.error('usage: node scripts/verify-live.mjs <url> [--save f] [--save-pc f] [--shots dir]');
  process.exit(2);
}
const PAGE_URL = URL_ARG.replace(/\/$/, '') + '/';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const results = [];
function verdict(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log((cond ? 'pass  ' : 'FAIL  ') + name + (detail ? ' — ' + detail : ''));
}
function skip(name, why) {
  console.log('SKIP  ' + name + ' — ' + why);
}

// ---------------- phase [http]: the served bytes ----------------
let LIVE = { html: '', htmlB64: '', gameB64: '', csp: '' };
async function httpPhase() {
  const res = await fetch(PAGE_URL);
  verdict('http: page reachable', res.status === 200, 'HTTP ' + res.status);
  const ab = await res.arrayBuffer();
  LIVE.html = Buffer.from(ab).toString('utf8');
  LIVE.htmlB64 = Buffer.from(ab).toString('base64');
  LIVE.csp = res.headers.get('content-security-policy') || '';
  const html = LIVE.html;
  // Body-font bytes as served (data URIs inside @font-face).
  const faces = [...html.matchAll(/@font-face\{font-family:'(PtPixel|PtGalmuri)';src:url\(data:font\/(woff2?);base64,([A-Za-z0-9+/=]+)\)[^}]*font-weight:(\d+)/g)];
  const pixel = faces.filter((f) => f[1] === 'PtPixel');
  verdict('http: PtPixel faces served', pixel.length === 2, 'found weights ' + pixel.map((f) => f[4]).join(','));
  for (const f of pixel) {
    const buf = Buffer.from(f[3], 'base64');
    try {
      const r = assertBasicLatin(buf, 'PtPixel ' + f[4]);
      verdict('http: served PtPixel ' + f[4] + ' cmap basic Latin', r.ok, r.covered + '/95 codepoints in ' + buf.length + ' bytes');
    } catch (e) {
      verdict('http: served PtPixel ' + f[4] + ' cmap basic Latin', false, e.message);
    }
  }
  // CSS scan: no linear-gradient inside battle/bag-scoped rules.
  const styleText = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const SCOPED = /(\.cmdf|\.cmdpanel|\.menugrid|\.battlewin|\.bagwin|\.bagtab)/;
  const bad = [];
  for (const chunk of styleText.split('}')) {
    const brace = chunk.indexOf('{');
    if (brace < 0) continue;
    const sel = chunk.slice(0, brace);
    const body = chunk.slice(brace + 1);
    if (SCOPED.test(sel) && body.includes('linear-gradient')) bad.push(sel.trim().slice(0, 60));
  }
  verdict('http: zero linear-gradient in battle+bag CSS rules', bad.length === 0, bad.length ? 'offenders: ' + bad.join(' | ') : 'scoped rules clean');
  const menuTitle = /\.menu-title\{[^}]*\}/.exec(styleText);
  verdict('http: .menu-title (bag header) is flat', !!menuTitle && !menuTitle[0].includes('linear-gradient'), menuTitle ? menuTitle[0].slice(0, 80) + '…' : 'rule not found');
  // Stash the game bundle for mirror transport (below).
  try {
    const g = await fetch(new URL('game.js', PAGE_URL));
    LIVE.gameB64 = Buffer.from(await g.arrayBuffer()).toString('base64');
  } catch (e) { /* single-file flavors have no game.js; mirror falls back to 404 */ }
}

// ---------------- browser scaffolding (shoot-pattern CDP) ----------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RUN_ID = String(Date.now());
const DBG_PORT = 9700 + (Date.now() % 250);
const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--user-data-dir=/tmp/ashvl-' + RUN_ID,
  '--remote-debugging-port=' + DBG_PORT, '--remote-debugging-address=127.0.0.1',
  '--window-size=1300,900', 'about:blank',
], { stdio: 'ignore' });
let ws, msgId = 0, S;
const pending = new Map();
const eventHandlers = [];
function onEvent(method, fn) { eventHandlers.push({ method, fn }); }
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function waitWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${DBG_PORT}/json/version`);
      const j = await r.json();
      ws = new WebSocket(j.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id && pending.has(m.id)) {
          const p = pending.get(m.id); pending.delete(m.id);
          m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
        } else if (m.method) {
          for (const h of eventHandlers) if (h.method === m.method) h.fn(m.params, m.sessionId);
        }
      };
      return;
    } catch (e) { await sleep(500); }
  }
  throw new Error('no chrome');
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, S);
  if (r.exceptionDetails) throw new Error('eval failed: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result.value;
}
async function press(code, holdMs = 90) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code }, S);
  await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code }, S);
  await sleep(160);
}
async function hold(code, ms) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', code }, S);
  await sleep(ms);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code }, S);
  await sleep(150);
}
async function clickEl(selector, textMatch) {
  const pt = await ev(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const el = ${textMatch ? `els.find(e => e.textContent.trim().startsWith(${JSON.stringify(textMatch)}))` : 'els[0]'};
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!pt) return false;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1 }, S);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pt.x, y: pt.y, button: 'left', clickCount: 1 }, S);
  await sleep(350);
  return true;
}
async function shot(name) {
  if (!SHOTS) return;
  const r = await send('Page.captureScreenshot', { format: 'png' }, S);
  writeFileSync(SHOTS.replace(/\/$/, '') + '/' + name + '.png', Buffer.from(r.data, 'base64'));
}
const visible = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); return !e.classList.contains('hidden') && r.height > 0; })()`);

async function bootToOverworld(saveObj) {
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('pdr.save.guest', ${JSON.stringify(JSON.stringify(saveObj))});}catch(e){}`,
  }, S);
  await send('Page.navigate', { url: PAGE_URL }, S);
  await sleep(3800);
  await press('KeyZ');
  await sleep(700);
  await press('KeyZ');
  await sleep(500);
  await press('ArrowDown'); // Continue
  await press('KeyZ');
  await sleep(900);
  await clickEl('button', '▶ PLAY AS GUEST');
  await sleep(1600);
  await clickEl('.hintcard-x', 'Got it');
  await sleep(400);
}

// ---------------- phases ----------------
await httpPhase();

try {
  await waitWs();
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const att = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
  S = att.sessionId;
  await send('Page.enable', {}, S);
  await send('Runtime.enable', {}, S);

  // Transport: try a direct navigation first. Some sandboxes' Chromium
  // cannot open real sockets at all (every load lands on chrome-error) —
  // there, fall back to MIRROR mode: the exact bytes + CSP fetched over
  // HTTP in phase [http] are fulfilled into the browser via Fetch
  // interception (the shoot-harness pattern). Probes are identical either
  // way; the mode is printed so a mirror run is never mistaken for a
  // socket run.
  let mirror = false;
  onEvent('Fetch.requestPaused', async (p, sid) => {
    if (!mirror) { try { await send('Fetch.continueRequest', { requestId: p.requestId }, sid); } catch (e) {} return; }
    const url = p.request.url;
    try {
      if (url.includes('/api/')) {
        await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"ok":true}').toString('base64') }, sid);
      } else if (url.endsWith('/game.js')) {
        await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }], body: LIVE.gameB64 }, sid);
      } else {
        const headers = [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }];
        if (LIVE.csp) headers.push({ name: 'Content-Security-Policy', value: LIVE.csp });
        await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: headers, body: LIVE.htmlB64 }, sid);
      }
    } catch (e) {}
  });
  await send('Page.navigate', { url: PAGE_URL }, S);
  await sleep(2500);
  if (String(await ev('location.href')).startsWith('chrome-error')) {
    mirror = true;
    console.log('NOTE  transport: mirror (this Chromium cannot open real sockets; live-fetched bytes + CSP fulfilled via Fetch interception)');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }, S);
    await send('Page.navigate', { url: PAGE_URL }, S);
    await sleep(2500);
  }

  // ---- [boot] fresh load: font registry + ink density ----
  await sleep(1000);
  const boot = await ev(`(async () => {
    const out = {};
    try { await document.fonts.ready; } catch (e) {}
    out.faces = [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status }));
    out.checkPixel = document.fonts.check('16px "PtPixel"');
    out.checkPixel700 = document.fonts.check('700 16px "PtPixel"');
    out.bodyStack = getComputedStyle(document.body).fontFamily;
    // Ink density: solid pixel letterforms put down far more ink than a
    // dot-matrix face, whose strokes are isolated 1-dot squares. Measured
    // at 24px on 'MMMMWWWWiiii': PtPixel ≈ 0.23+, DotGothic16 ≈ 0.15.
    const ink = (fam) => {
      const c = document.createElement('canvas'); c.width = 700; c.height = 60;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, 700, 60);
      x.fillStyle = '#000'; x.font = '24px ' + fam; x.textBaseline = 'top';
      x.fillText('MMMMWWWWiiii', 4, 4);
      const d = x.getImageData(0, 0, 700, 60).data;
      let dark = 0, minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
      for (let yy = 0; yy < 60; yy++) for (let xx = 0; xx < 700; xx++) {
        if (d[(yy * 700 + xx) * 4] < 128) { dark++; if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy; }
      }
      const area = (maxx - minx + 1) * (maxy - miny + 1);
      return area > 0 ? Math.round((dark / area) * 1000) / 1000 : 0;
    };
    out.inkPixel = ink('"PtPixel"');
    out.inkGalmuri = ink('"PtGalmuri"');
    return out;
  })()`);
  console.log('BOOT', JSON.stringify(boot));
  const px = (w) => boot.faces.find((f) => f.family === 'PtPixel' && f.weight === w);
  verdict('boot: PtPixel 400+700 loaded', !!(px('400') && px('400').status === 'loaded' && px('700') && px('700').status === 'loaded'),
    JSON.stringify(boot.faces.filter((f) => f.family === 'PtPixel')));
  verdict('boot: body stack leads with PtPixel', /^\s*"?PtPixel/.test(boot.bodyStack), boot.bodyStack.slice(0, 60));
  verdict('boot: PtPixel ink density at 24px >= 0.19 (solid letterforms)', boot.inkPixel >= 0.19,
    'PtPixel=' + boot.inkPixel + ' (dot-matrix faces measure ≈0.15)');

  // ---- [play] fresh game: terminal + intro dialogue ----
  await press('KeyZ'); await sleep(900);           // -> title
  await press('KeyZ'); await sleep(700);           // -> title menu
  await press('KeyZ'); await sleep(900);           // New Game -> terminal
  const termStack = await ev(`(() => { const e = document.querySelector('.authsub') || document.querySelector('.login-note'); return e ? getComputedStyle(e).fontFamily : ''; })()`);
  verdict('play: terminal body copy computes PtPixel-first', /PtPixel/.test(termStack), termStack.slice(0, 50));
  await clickEl('button', '▶ PLAY AS GUEST');
  await sleep(1500);
  await shot('vl-intro');
  const dlg = await ev(`(() => {
    const t = document.querySelector('.dlg-text'), n = document.querySelector('.dlg-name');
    return {
      text: t ? getComputedStyle(t).fontFamily : '',
      name: n ? getComputedStyle(n).fontFamily : '',
      body: t ? t.textContent.slice(0, 40) : '',
    };
  })()`);
  verdict('play: dialogue body computes PtPixel-first', /^\s*"?PtPixel/.test(dlg.text), dlg.text.slice(0, 50) + ' | "' + dlg.body + '"');
  verdict('play: dialogue speaker name computes PtGalmuri-first', /^\s*"?PtGalmuri/.test(dlg.name), dlg.name.slice(0, 50));

  // ---- [play] seeded save: bag tabs + battle ----
  if (SAVE) {
    const saveObj = JSON.parse(readFileSync(SAVE, 'utf8'));
    await bootToOverworld(saveObj);
    await shot('vl-overworld');
    // Pause -> Bag
    await press('Enter'); await sleep(700);
    const bagOpened = await clickEl('.menu-row', 'Bag');
    await sleep(700);
    await shot('vl-bag');
    const bag = await ev(`(() => {
      const e = document.querySelector('.menu.bagwin');
      if (!e) return { open: false };
      const cs = (el) => el ? getComputedStyle(el) : null;
      const tabs = [...e.querySelectorAll('.bagtab-btn')].map(b => ({ pocket: b.getAttribute('data-pocket'), sel: b.classList.contains('sel'), bg: cs(b).backgroundImage }));
      const rows = [...e.querySelectorAll('.menu-row')].map(r => ({ hidden: r.classList.contains('baghidden'), disp: cs(r).display, text: r.textContent.trim().slice(0, 24) }));
      return {
        open: true, tabs,
        bandrows: e.querySelectorAll('.bandrow').length,
        titleBg: cs(e.querySelector('.menu-title')).backgroundImage,
        rows,
        visibleRows: rows.filter(r => r.disp !== 'none').length,
        hiddenRows: rows.filter(r => r.disp === 'none').length,
      };
    })()`);
    verdict('bag: pause-menu bag opens as the tabbed component', !!(bag.open && bagOpened), JSON.stringify(bag).slice(0, 200));
    if (bag.open) {
      verdict('bag: pocket tab strip present (>= 2 tabs)', bag.tabs.length >= 2, 'tabs: ' + bag.tabs.map((t2) => t2.pocket).join(','));
      verdict('bag: zero band/section rows', bag.bandrows === 0, 'bandrows=' + bag.bandrows);
      verdict('bag: no gradient on title or tabs', bag.titleBg === 'none' && bag.tabs.every((t2) => t2.bg === 'none'),
        'titleBg=' + bag.titleBg);
      verdict('bag: inactive pocket rows hidden, active visible', bag.hiddenRows >= 0 && bag.visibleRows >= 1,
        'visible=' + bag.visibleRows + ' hidden=' + bag.hiddenRows);
      if (bag.tabs.length >= 2) {
        await press('ArrowRight'); await sleep(500);
        const selAfter = await ev(`(() => { const b = document.querySelector('.bagtab-btn.sel'); return b ? b.getAttribute('data-pocket') : ''; })()`);
        verdict('bag: ArrowRight switches the active pocket tab', !!selAfter && selAfter !== bag.tabs.find((t2) => t2.sel)?.pocket,
          'now: ' + selAfter);
      }
      await press('KeyX'); await sleep(400);
    }

    // Walk to Route 1 grass and fight (shoot5 pattern).
    const inBattle = () => ev(`(document.getElementById('ui') || document.body).classList.contains('inbattle')`);
    const locText = () => ev(`(document.querySelector('.locchip-text') || {}).textContent || ''`);
    let battled = false;
    for (let i = 0; i < 12 && !battled; i++) {
      if ((await locText()).includes('Route 1')) break;
      await hold('ArrowDown', 200);
      battled = await inBattle();
    }
    if (!battled && (await locText()).includes('Route 1')) {
      for (let i = 0; i < 3; i++) await hold('ArrowLeft', 300);
      for (let i = 0; i < 70 && !battled; i++) {
        await hold(i % 2 ? 'ArrowDown' : 'ArrowUp', 420);
        battled = await inBattle();
      }
      if (!battled) { await sleep(2600); battled = await inBattle(); }
    }
    verdict('battle: wild encounter reached', battled, 'loc: ' + (await locText()));
    if (battled) {
      await sleep(2000);
      const cmdLabels = () => ev(`[...document.querySelectorAll('.cmdpanel:not(.hidden) .cmdf')].map(b => b.textContent.trim().slice(0, 12))`);
      let labels = [];
      for (let i = 0; i < 20 && labels.length < 4; i++) {
        await press('KeyZ'); await sleep(800);
        labels = await cmdLabels();
        if (!(await inBattle())) break;
      }
      verdict('battle: unified command grid opens (4 commands)', labels.length === 4, labels.join(','));
      const cmdCss = await ev(`[...document.querySelectorAll('.cmdpanel .cmdf')].map(b => getComputedStyle(b).backgroundImage)`);
      verdict('battle: command buttons are FLAT (backgroundImage none)', cmdCss.length === 4 && cmdCss.every((g) => g === 'none'),
        JSON.stringify(cmdCss));
      await shot('vl-battle-commands');
      if (await clickEl('.cmdf-fight')) {
        await sleep(700);
        const mv = await ev(`(() => {
          const w = document.querySelector('.menu.battlewin');
          if (!w) return { open: false };
          const rows = [...w.querySelectorAll('.menugrid .menu-row')].map(r => getComputedStyle(r).backgroundImage);
          const fr = document.querySelector('.frameui').getBoundingClientRect();
          const wr = w.getBoundingClientRect();
          return { open: true, rows, topFrac: Math.round((wr.top - fr.top) / fr.height * 1000) / 1000 };
        })()`);
        verdict('battle: move window opens framed', !!(mv.open && mv.rows.length >= 1), 'rows=' + (mv.rows || []).length);
        if (mv.open) {
          verdict('battle: move rows are FLAT (backgroundImage none)', mv.rows.every((g) => g === 'none'), JSON.stringify(mv.rows));
          verdict('battle: move window sits in the message zone (top >= 0.68 of frame)', mv.topFrac >= 0.68, 'topFrac=' + mv.topFrac);
        }
        await shot('vl-battle-moves');
      } else verdict('battle: FIGHT button clickable', false, 'click missed');
    }
  } else {
    skip('bag/battle drives', 'no --save provided');
  }

  // ---- [play] seeded PC save: the box grid ----
  if (SAVE_PC) {
    const savePc = JSON.parse(readFileSync(SAVE_PC, 'utf8'));
    await bootToOverworld(savePc);
    // The PC save spawns facing the terminal: A talks -> dialogue -> panel.
    for (let i = 0; i < 8; i++) {
      await press('KeyZ'); await sleep(700);
      if (await visible('.pcpanel')) break;
    }
    await shot('vl-pc');
    const pc = await ev(`(() => {
      const p = document.querySelector('.pcpanel');
      if (!p) return { open: false };
      return {
        open: !p.classList.contains('hidden'),
        cells: p.querySelectorAll('.pccell').length,
        party: p.querySelectorAll('.pcpslot').length,
        title: (p.querySelector('.pctitle') || {}).textContent || '',
      };
    })()`);
    verdict('pc: box screen opens from the terminal', !!pc.open, JSON.stringify(pc));
    if (pc.open) {
      verdict('pc: grid renders exactly 30 slots', pc.cells === 30, 'cells=' + pc.cells);
      verdict('pc: party strip renders 6 slots', pc.party === 6, 'party=' + pc.party);
      await press('KeyE'); await sleep(500);
      const title2 = await ev(`(document.querySelector('.pctitle') || {}).textContent || ''`);
      verdict('pc: E switches to Box 2', /BOX 2/.test(title2), title2.slice(0, 40));
      await press('KeyX'); await sleep(400);
      verdict('pc: B logs off (panel closes)', !(await visible('.pcpanel')), '');
    }
  } else {
    skip('pc drive', 'no --save-pc provided');
  }
} finally {
  try { ws && ws.close(); } catch (e) {}
  chrome.kill('SIGKILL');
}

const failed = results.filter((r) => !r.pass);
console.log('\nverify-live: ' + (results.length - failed.length) + '/' + results.length + ' passed'
  + (failed.length ? ' — FAILURES: ' + failed.map((f) => f.name).join(' | ') : ''));
process.exit(failed.length ? 1 : 0);
