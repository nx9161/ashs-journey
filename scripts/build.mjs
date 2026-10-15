// build.mjs — zero-dependency build (Node stdlib only: fs/path/crypto).
// One source tree -> two bundles from the same concatenated game JS:
//   Bundle A (guest): dist/standalone.html — single self-contained file, offline.
//   Bundle B (vercel): public/index.html + public/game.js — static client.
// Auth code paths are compile-time feature-flagged OFF (ADR-008 Track B).
// Validates data tables (schema + cross-refs); fails the build on bad data.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');

function transform(src, file) {
  const lines = src.split('\n');
  const out = [];
  let inImport = false;
  for (const line of lines) {
    if (line.includes('__DEBUG__')) continue; // compile-time feature strip
    if (inImport) {
      if (line.includes(';')) inImport = false;
      continue;
    }
    if (/^\s*import\s/.test(line)) {
      if (!line.includes(';')) inImport = true;
      continue;
    }
    if (/^\s*export\s*\{[^}]*\}\s*;?\s*$/.test(line)) {
      throw new Error('re-export syntax not supported in zero-dep build: ' + file + ': ' + line.trim());
    }
    out.push(line.replace(/^(\s*)export\s+(?=(const|let|var|function|class|async\s+function))/, '$1'));
  }
  if (inImport) throw new Error('unterminated import in ' + file);
  return out.join('\n');
}

export function buildGameJs() {
  const order = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'module-order.json'), 'utf8'));
  const parts = [];
  for (const rel of order) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) throw new Error('missing module in module-order: ' + rel);
    parts.push('\n// ---- ' + rel + ' ----\n' + transform(fs.readFileSync(abs, 'utf8'), rel));
  }
  const js = parts.join('\n');
  // Guard: no unresolved module syntax survived the transform.
  for (const line of js.split('\n')) {
    const t = line.trim();
    if (t.startsWith('import ') && t.includes(' from ')) throw new Error('unresolved import survived: ' + t);
    if (/^export\s/.test(t)) throw new Error('unresolved export survived: ' + t);
  }
  if (js.includes('</script>')) throw new Error('game JS contains literal </script> — would break the single-file bundle');
  return js;
}

// ---- data validation (architecture §5: schema + cross-ref checks fail the build) ----
function fail(msg) { console.error('BUILD FAIL: ' + msg); process.exit(1); }

export function validateData() {
  // Import the raw modules directly (node ESM) for validation.
  return import(path.join(SRC, 'data', 'maps.mjs')).then(async ({ MAPS, TRAINERS, WALKABLE }) => {
    const { SPECIES } = await import(path.join(SRC, 'data', 'species.mjs'));
    const { MOVES } = await import(path.join(SRC, 'data', 'moves.mjs'));
    const { ITEMS } = await import(path.join(SRC, 'data', 'items.mjs'));

    // Map row lengths consistent
    for (const [id, m] of Object.entries(MAPS)) {
      const w = m.rows[0].length;
      for (const r of m.rows) if (r.length !== w) fail('map ' + id + ': ragged rows');
      // warp targets exist and land on walkable tiles
      for (const wp of m.warps) {
        const to = MAPS[wp.to.map];
        if (!to) fail('map ' + id + ': warp to unknown map ' + wp.to.map);
        const ch = to.rows[wp.to.y] && to.rows[wp.to.y][wp.to.x];
        if (!WALKABLE.has(ch)) fail('map ' + id + ': warp lands on non-walkable tile ' + ch + ' in ' + wp.to.map);
      }
      // encounter species exist
      if (m.encounters) {
        for (const e of m.encounters.table) {
          if (!SPECIES[e.species]) fail('map ' + id + ': unknown encounter species ' + e.species);
          if (e.min > e.max || e.min < 1) fail('map ' + id + ': bad level range for ' + e.species);
        }
      }
      // npc trainer refs exist
      for (const n of m.npcs) {
        if (n.trainer && !TRAINERS[n.trainer]) fail('map ' + id + ': unknown trainer ' + n.trainer);
      }
    }
    // Trainer teams reference real species
    for (const [id, t] of Object.entries(TRAINERS)) {
      for (const mon of t.team) {
        if (!SPECIES[mon.species]) fail('trainer ' + id + ': unknown species ' + mon.species);
        if (mon.level < 1 || mon.level > 100) fail('trainer ' + id + ': bad level');
      }
      if (t.badge && !ITEMS[t.badge]) fail('trainer ' + id + ': unknown badge item ' + t.badge);
    }
    // Species learnsets reference real moves
    for (const [id, sp] of Object.entries(SPECIES)) {
      for (const lv of Object.keys(sp.learnset)) {
        for (const mid of sp.learnset[lv]) {
          if (!MOVES[mid]) fail('species ' + id + ': unknown move ' + mid);
        }
      }
      if (sp.catchRate < 3 || sp.catchRate > 255) fail('species ' + id + ': catchRate out of range');
    }
    console.log('data validation: OK (' + Object.keys(MAPS).length + ' maps, ' +
      Object.keys(SPECIES).length + ' species, ' + Object.keys(MOVES).length + ' moves)');
  });
}

const SHELL_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:#0a0a12;touch-action:none;overscroll-behavior:none}
body{font-family:monospace;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#stage{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center}
#game{image-rendering:pixelated;background:#000}
#ui{position:fixed;inset:0;pointer-events:none}
.hidden{display:none!important}
/* dialogue */
.dialogue{position:absolute;left:4%;right:4%;bottom:34%;min-height:96px;background:#f8f8f0;border:3px solid #202028;border-radius:6px;padding:10px 12px 18px;pointer-events:auto;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.dlg-name{position:absolute;top:-16px;left:10px;background:#202028;color:#ffe9a8;font-size:14px;font-weight:bold;padding:2px 10px;border-radius:4px}
.dlg-text{font-size:16px;line-height:1.5;color:#202028;min-height:64px;white-space:pre-wrap}
.dlg-hint{position:absolute;right:12px;bottom:4px;color:#202028;animation:blink 1s infinite;font-size:14px}
@keyframes blink{50%{opacity:0}}
/* menus */
.menu{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);min-width:220px;max-width:92vw;max-height:60vh;overflow:auto;background:#f8f8f0;border:3px solid #202028;border-radius:6px;pointer-events:auto;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.menu-title{background:#202028;color:#ffe9a8;font-size:14px;font-weight:bold;padding:6px 10px}
.menu-row{display:flex;width:100%;gap:8px;align-items:center;background:none;border:0;border-bottom:1px solid #d8d8cc;font:inherit;font-size:14px;color:#202028;text-align:left;padding:10px;min-height:44px;cursor:pointer}
.menu-row .cur{width:18px;color:#c03028;font-weight:bold}
.menu-row.cursor{background:#e8e0c8}
.menu-row.disabled{color:#a0a0a0}
/* toasts */
.toasts{position:absolute;left:0;right:0;bottom:24%;display:flex;flex-direction:column;align-items:center;gap:6px}
.toast{background:#202028;color:#ffe9a8;font-size:14px;padding:8px 14px;border-radius:16px;pointer-events:none}
/* controls */
.controls{position:absolute;inset:0;pointer-events:none}
.dpad{position:absolute;left:24px;bottom:24px;width:132px;height:132px;pointer-events:auto}
body.flip .dpad{left:auto;right:24px}
.padbtn{position:absolute;width:44px;height:44px;background:#2a2a34;color:#fff;border:2px solid #55555f;border-radius:8px;font-size:16px;pointer-events:auto;touch-action:none}
.p-up{left:44px;top:0}.p-down{left:44px;bottom:0}.p-left{left:0;top:44px}.p-right{right:0;top:44px}
.padbtn:active{background:#4a4a58}
.ab{position:absolute;right:24px;bottom:24px;width:160px;height:110px;pointer-events:auto}
body.flip .ab{right:auto;left:24px}
.abtn{position:absolute;width:72px;height:72px;border-radius:50%;background:#2a2a34;color:#fff;border:2px solid #55555f;font-size:20px;font-weight:bold;pointer-events:auto;touch-action:none}
.a-a{right:0;bottom:0}.a-b{left:0;bottom:0}
.abtn:active{background:#c03028}
.sysbtns{position:absolute;left:50%;transform:translateX(-50%);bottom:24px;display:flex;gap:8px;pointer-events:auto}
.sysbtn{background:#2a2a34;color:#ccc;border:2px solid #55555f;border-radius:14px;font-size:14px;padding:10px 14px;min-height:44px;pointer-events:auto}
/* P0/E8: battle command 2x2 grid (replaces the D-pad zone) */
.cmdpanel{position:absolute;left:24px;bottom:24px;right:24px;display:grid;grid-template-columns:1fr 1fr;gap:8px;pointer-events:auto}
.cmdf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:88px;min-height:64px;background:#2a2a34;color:#ffe9a8;border:3px solid #55555f;border-radius:10px;font-family:inherit;font-size:14px;font-weight:bold;cursor:pointer;touch-action:none}
.cmdf.cursor{border-color:#e8c832;background:#3a3a48}
.cmdf.disabled{opacity:.35}
.cmdf.dimmed{opacity:.45}
.cmdf.tut-focus{border-color:#58c94f;animation:cmdfocus 1s infinite}
@keyframes cmdfocus{50%{border-color:#e8c832}}
.cmdicon{width:24px;height:24px;image-rendering:pixelated}
.cmdlabel{line-height:1}
/* P0/E9: move menu 2x2 grid + type badge pills (icon+text, never color-alone) */
.menugrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px}
.menugrid .menu-row{flex-direction:column;align-items:flex-start;min-height:72px;border:2px solid #d8d8cc;border-radius:8px;position:relative}
.menugrid .menu-row.cursor{border-color:#c03028;background:#e8e0c8}
.mvcell{display:flex;flex-direction:column;gap:2px;width:100%}
.mvname{font-weight:bold;font-size:14px}
.mvpp{font-size:14px;color:#555}
.mvpow{font-size:14px;color:#777}
.tpill{display:inline-block;font-size:14px;font-weight:bold;color:#fff;border:1px solid #202028;border-radius:8px;padding:1px 8px;margin:2px 0;text-shadow:1px 1px 0 rgba(0,0,0,.4)}
.tpill b{font-weight:bold}
.menu-row.zeropp{color:#a0a0a0}
.menu-row.zeropp::after{content:'';position:absolute;left:6px;right:6px;top:50%;height:3px;background:#c03028;transform:rotate(-8deg);border-radius:2px}
.menu-row.tut-focus{border-color:#58c94f;animation:cmdfocus 1s infinite}
/* P0/C3: name-entry A-Z grid (44px keys) */
.nkbover{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;background:rgba(0,0,0,.45);z-index:30}
@media(min-width:700px){.nkbover{align-items:center}}
.namekb{background:#f8f8f0;border:3px solid #202028;border-radius:10px;padding:12px;width:100%;max-width:480px;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.nkb-title{font-size:14px;font-weight:bold;color:#202028;margin-bottom:8px}
.nkb-display{font-size:20px;font-weight:bold;color:#202028;background:#fff;border:2px solid #202028;border-radius:6px;padding:8px 10px;margin-bottom:10px;min-height:44px;letter-spacing:2px}
.nkb-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.nkb-key{min-width:44px;min-height:44px;font-family:inherit;font-size:16px;font-weight:bold;background:#e8e0c8;color:#202028;border:2px solid #202028;border-radius:8px;cursor:pointer;touch-action:none}
.nkb-key:active{background:#d8d0b8}
.nkb-row{display:flex;gap:6px;margin-top:6px}
.nkb-key.wide{flex:1}
.nkb-key.go{background:#58c94f;color:#102010}
.shake{animation:nkbshake .3s}
@keyframes nkbshake{25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-4px)}}
/* P0/B1: Trainer ID Terminal (login stub — Track B dark, zero network) */
.loginover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;background:rgba(10,10,18,.82);z-index:40}
.login{background:#14141c;border:3px solid #e8c832;border-radius:10px;padding:0;width:min(420px,92vw);box-shadow:2px 2px 0 rgba(0,0,0,.25);overflow:hidden}
.login-head{background:#e8c832;color:#14141c;font-size:15px;font-weight:bold;padding:10px 14px;letter-spacing:1px}
.login-tabs{display:flex}
.logintab{flex:1;font-family:inherit;font-size:14px;font-weight:bold;padding:12px 4px;min-height:44px;background:#2a2a34;color:#999;border:0;border-bottom:3px solid transparent;cursor:pointer}
.logintab.sel{background:#14141c;color:#ffe9a8;border-bottom-color:#e8c832}
.loginpane{padding:16px 14px;display:flex;flex-direction:column;gap:10px}
.login-note{font-size:14px;line-height:1.5;color:#ccc}
.loginpane label{font-size:14px;color:#999;display:flex;flex-direction:column;gap:4px}
.login-in{font-family:inherit;font-size:14px;padding:10px;background:#0a0a12;color:#666;border:2px solid #333;border-radius:6px}
.login-go{font-family:inherit;font-size:15px;font-weight:bold;padding:12px;min-height:48px;border-radius:8px;border:2px solid #555;background:#2a2a34;color:#777;cursor:not-allowed}
.login-go.active{background:#58c94f;border-color:#3a7a3a;color:#102010;cursor:pointer}
/* P0/B1: in-game guest banner (28px strip, dismissible per session) */
.guestbanner{position:absolute;top:0;left:0;right:0;min-height:28px;display:flex;align-items:center;justify-content:center;gap:10px;background:#202028;color:#ffe9a8;font-size:14px;pointer-events:auto;z-index:20;border-bottom:2px solid #e8c832}
.gbx{background:none;border:0;color:#ffe9a8;font-size:14px;min-width:44px;min-height:28px;cursor:pointer}
/* P1/D4: HUD quick-strip (portrait: overlaid top-right of canvas) */
.hudstrip{position:absolute;top:34px;right:8px;display:flex;gap:6px;pointer-events:auto;z-index:15}
.nohud .hudstrip{display:none}
.inbattle .hudstrip{display:none}
.hudbtn{position:relative;width:48px;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(32,32,40,.92);border:2px solid #55555f;border-radius:10px;cursor:pointer;touch-action:none}
.hudicon{width:20px;height:20px;image-rendering:pixelated}
.hudlabel{font-size:14px;color:#ccc;font-family:inherit}
.dexdot{position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#e84040;border:1px solid #fff}
/* P1/D7: partner mood pip (tappable) */
.moodpip{position:absolute;right:8px;bottom:150px;width:44px;height:44px;background:rgba(32,32,40,.92);border:2px solid #55555f;border-radius:50%;cursor:pointer;pointer-events:auto;z-index:15;touch-action:none}
.moodface{width:24px;height:24px;image-rendering:pixelated}
.mooddot{position:absolute;bottom:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#58c94f;border:1px solid #fff}
/* P1/G1: party row HP mini-bars + status chips + partner badge */
.phpbar{display:inline-block;width:64px;height:8px;background:#28182c;border-radius:3px;vertical-align:middle;margin:0 6px;overflow:hidden}
.phpbar i{display:block;height:100%}
.pstat{font-size:14px;font-weight:bold;color:#a040a0;margin-left:6px}
.pbadge{color:#c89010;font-weight:bold;margin-left:6px}
/* P1/I2: HUD scale (setting existed with no UI row) */
.hudstrip{transform:scale(var(--hudscale,1));transform-origin:top right}
body.landscape .hudstrip{transform:translateY(-50%) scale(var(--hudscale,1))}
/* P1/K2: landscape — the HUD strip re-rails to the right edge */
body.landscape .hudstrip{top:50%;flex-direction:column}
/* P1/K3: desktop keyboard-hint card */
.hintcard{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;display:flex;align-items:center;gap:10px;background:rgba(32,32,40,.95);border:2px solid #55555f;border-radius:10px;color:#ccc;font-size:14px;padding:8px 12px;pointer-events:auto;z-index:25;max-width:92vw}
.hintcard-x{background:#2a2a34;color:#ffe9a8;border:2px solid #55555f;border-radius:8px;font-size:14px;font-family:inherit;padding:8px 12px;min-height:44px;cursor:pointer;white-space:nowrap}
body.desktop .controls{display:none}
body.desktop.showtouch .controls{display:block}
@media (pointer:coarse){body.desktop .controls{display:block}}
`;

function shellHtml({ gameJs, inline }) {
  const scriptTag = inline
    ? '<script>\n' + gameJs + '\n</script>'
    : '<script src="game.js"></script>';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
    '<title>ASH\'S JOURNEY — An Unofficial Fan Homage</title>\n' +
    '<meta name="description" content="Ash\'s Journey — an unofficial fan-homage creature-catching web game. 100% original code, art, and audio.">\n' +
    '<style>' + SHELL_CSS + '</style>\n</head>\n<body>\n' +
    '<div id="stage"><canvas id="game"></canvas></div>\n<div id="ui"></div>\n' +
    scriptTag + '\n</body>\n</html>\n';
}

async function main() {
  const target = process.argv.includes('--target=vercel') ? 'vercel' : 'all';
  await validateData();
  const gameJs = buildGameJs();
  const hash = crypto.createHash('sha256').update(gameJs).digest('hex');
  console.log('game.js: ' + gameJs.length + ' bytes, contentHash ' + hash.slice(0, 16) + '...');

  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });

  // Bundle A: guest single-file (offline)
  const standalone = shellHtml({ gameJs, inline: true })
    .replace('</body>', '<!-- contentHash:' + hash + ' -->\n</body>');
  fs.writeFileSync(path.join(ROOT, 'dist', 'standalone.html'), standalone);
  console.log('dist/standalone.html: ' + standalone.length + ' bytes');

  // Bundle B: vercel static client
  fs.writeFileSync(path.join(ROOT, 'public', 'game.js'), gameJs);
  const indexHtml = shellHtml({ gameJs: null, inline: false })
    .replace('</body>', '<!-- contentHash:' + hash + ' -->\n</body>');
  fs.writeFileSync(path.join(ROOT, 'public', 'index.html'), indexHtml);
  console.log('public/game.js + index.html: ' + (gameJs.length + indexHtml.length) + ' bytes');

  fs.writeFileSync(path.join(ROOT, 'dist', 'content-hash.txt'), hash + '\n');
  console.log('build OK');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error('BUILD FAIL: ' + e.message); process.exit(1); });
