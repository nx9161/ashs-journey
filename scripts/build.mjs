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
.dlg-name{position:absolute;top:-14px;left:10px;background:#202028;color:#ffe9a8;font-size:11px;font-weight:bold;padding:2px 10px;border-radius:4px}
.dlg-text{font-size:14px;line-height:1.5;color:#202028;min-height:60px;white-space:pre-wrap}
.dlg-hint{position:absolute;right:12px;bottom:4px;color:#202028;animation:blink 1s infinite;font-size:12px}
@keyframes blink{50%{opacity:0}}
/* menus */
.menu{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);min-width:220px;max-width:92vw;max-height:60vh;overflow:auto;background:#f8f8f0;border:3px solid #202028;border-radius:6px;pointer-events:auto;box-shadow:2px 2px 0 rgba(0,0,0,.25)}
.menu-title{background:#202028;color:#ffe9a8;font-size:12px;font-weight:bold;padding:6px 10px}
.menu-row{display:flex;width:100%;gap:8px;align-items:center;background:none;border:0;border-bottom:1px solid #d8d8cc;font:inherit;font-size:14px;color:#202028;text-align:left;padding:10px;min-height:44px;cursor:pointer}
.menu-row .cur{width:18px;color:#c03028;font-weight:bold}
.menu-row.cursor{background:#e8e0c8}
.menu-row.disabled{color:#a0a0a0}
/* toasts */
.toasts{position:absolute;left:0;right:0;bottom:24%;display:flex;flex-direction:column;align-items:center;gap:6px}
.toast{background:#202028;color:#ffe9a8;font-size:12px;padding:8px 14px;border-radius:16px;pointer-events:none}
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
.sysbtn{background:#2a2a34;color:#ccc;border:2px solid #55555f;border-radius:14px;font-size:10px;padding:10px 14px;min-height:44px;pointer-events:auto}
.cmdpanel{position:absolute;left:24px;bottom:24px;right:24px;display:grid;grid-template-columns:1fr 1fr;gap:8px;pointer-events:auto}
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
