// build.mjs — zero-dependency build (Node stdlib only: fs/path/crypto).
// One source tree -> three targets from the same concatenated game JS:
//   Bundle A (guest):    dist/standalone.html — single self-contained file, offline.
//   Bundle B (vercel):   public/index.html + public/game.js — static client.
//   Bundle C (personal): personal/index.html + personal/game.js — static client.
// Build targets:
//   --target=vercel   : public/game.js + public/index.html (full client, auth UI compiled IN)
//   --target=guest    : dist/standalone.html (guest single-file, auth UI compiled OUT)
//   --target=personal : personal/game.js + personal/index.html (ADR-012 "Naman's edition")
//   (default: all)
// Auth code paths are compile-time feature-flagged:
//   * lines between `// __AUTH_BEGIN__` and `// __AUTH_END__` are STRIPPED from the
//     guest and personal targets (block strip, build fails on unbalanced markers);
//   * the token `/*__AUTH_ENABLED__*/` is replaced with `true` (vercel) or `false` (guest, personal);
//   * the token `/*__EDITION_MARKER__*/` is replaced with `''` (vercel, guest) or
//     `"NAMAN'S EDITION"` (personal) — see ADR-012 delta note below.
// The guest and personal bundles therefore contain zero auth code and zero `/api/`
// references (asserted as a hard build gate below — PRD AC#1 / Tech Law COPPA cleanliness).
//
// ---- ADR-012 personal-edition delta (2026-10-15) ----
// The personal target REUSES the guest auth-strip machinery exactly — the personal
// bundle is the guest bundle plus ONE difference: the EDITION_MARKER token
// resolves to "NAMAN'S EDITION" (a subtle gold ribbon under the subtitle on the
// title screen; src/game/title.mjs) instead of ''. Consequences, all deliberate:
//   * No login UI of any kind — the Trainer ID Terminal is compile-time stripped
//     (zero auth affordances; the title menu routes straight to New/Continue).
//   * Saves are localStorage-only (identical to the guest path); no /api/* calls,
//     no session code in the bundle.
//   * The hard zero-network gate applies identically to the personal target.
//   * Output mirrors the multi-file public/ layout (index.html + game.js) for
//     static Vercel serving. NO api/ functions ship with this target — access
//     control lives at the hosting layer (a separate Vercel project with Vercel
//     Authentication, Standard Protection).
//   * GC-verbatim disclaimers and credits are byte-identical across all targets.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');

function transform(src, file, opts) {
  opts = opts || {};
  const stripAuth = !opts.auth; // guest target: remove __AUTH__ blocks
  const lines = src.split('\n');
  const out = [];
  let inImport = false;
  let authDepth = 0;
  for (const line of lines) {
    if (line.includes('__DEBUG__')) continue; // compile-time feature strip
    if (line.includes('__AUTH_BEGIN__')) {
      if (!stripAuth) { out.push(line); continue; }
      authDepth++;
      continue;
    }
    if (line.includes('__AUTH_END__')) {
      if (!stripAuth) { out.push(line); continue; }
      authDepth--;
      if (authDepth < 0) throw new Error('unbalanced __AUTH_END__ in ' + file);
      continue;
    }
    if (stripAuth && authDepth > 0) continue; // inside a stripped auth block
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
  if (authDepth !== 0) throw new Error('unbalanced __AUTH_BEGIN__ in ' + file);
  return out.join('\n');
}

// stripAuthBlocks: the same guest-target auth removal, applied to an already-
// built vercel bundle. Used by drift-gate.mjs + verify-slice.mjs to prove the
// guest bundle is EXACTLY the vercel bundle minus the auth sections (no drift).
// Also normalizes the AUTH_ENABLED compile flag (true in vercel, false in guest)
// so the comparison isolates the block strip.
export function stripAuthBlocks(js) {
  const lines = js.split('\n');
  const out = [];
  let depth = 0;
  for (const line of lines) {
    if (line.includes('__AUTH_BEGIN__')) { depth++; continue; }
    if (line.includes('__AUTH_END__')) { depth--; if (depth < 0) throw new Error('unbalanced __AUTH_END__'); continue; }
    if (depth > 0) continue;
    out.push(line);
  }
  if (depth !== 0) throw new Error('unbalanced __AUTH_BEGIN__');
  return out.join('\n').split('const AUTH_ENABLED = true;').join('const AUTH_ENABLED = false;');
}

// EDITION_MARKER literal table (ADR-012). The literal is the JS-source text that
// replaces the `/*__EDITION_MARKER__*/` token in src/game/title.mjs. Exported so
// drift-gate.mjs can assert personal ≡ guest + marker with no duplication.
export const EDITION_MARKER_LITERAL = {
  none: `''`,
  personal: `"NAMAN'S EDITION"`,
};

export function buildGameJs(opts) {
  opts = opts || {};
  const edition = opts.edition || (opts.auth === false ? 'guest' : 'vercel');
  const auth = edition === 'vercel'; // only the public vercel target carries auth UI
  const marker = edition === 'personal' ? EDITION_MARKER_LITERAL.personal : EDITION_MARKER_LITERAL.none;
  const order = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'module-order.json'), 'utf8'));
  const parts = [];
  for (const rel of order) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) throw new Error('missing module in module-order: ' + rel);
    parts.push('\n// ---- ' + rel + ' ----\n' + transform(fs.readFileSync(abs, 'utf8'), rel, { auth }));
  }
  let js = parts.join('\n');
  // Compile-time auth flag: `const AUTH_ENABLED = /*__AUTH_ENABLED__*/;` ->
  // true in the vercel bundle, false in the guest and personal bundles.
  js = js.split('/*__AUTH_ENABLED__*/').join(auth ? 'true' : 'false');
  // Compile-time edition marker: `const EDITION_MARKER = /*__EDITION_MARKER__*/;`
  // -> "NAMAN'S EDITION" in the personal bundle, '' everywhere else.
  js = js.split('/*__EDITION_MARKER__*/').join(marker);
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
:root{--ink:#202028;--paper:#f8f8f0;--gold:#e8c832;--font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:#0a0a12;touch-action:none;overscroll-behavior:none}
body{font-family:var(--font);-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#stage{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse 90% 60% at 50% 38%,rgba(58,74,140,.28),rgba(10,10,18,0) 62%),repeating-linear-gradient(45deg,rgba(248,248,240,.025) 0 2px,transparent 2px 14px),#0a0a12}
#game{image-rendering:pixelated;background:#000;outline:2px solid #3d3d52;box-shadow:0 4px 18px rgba(0,0,0,.35)}
#ui{position:fixed;inset:0;pointer-events:none}
.hidden{display:none!important}
/* dialogue — Z-A pattern: paper panel anchored to the bottom of the frame
   area (clamped so it clears the touch-controls zone on small screens and
   stays a bottom sheet on desktop), ink name plate overlapping the top edge. */
.dialogue{position:absolute;left:4%;right:4%;bottom:clamp(12px,14vh,120px);min-height:96px;background:var(--paper);border:2px solid var(--ink);border-radius:10px;padding:12px 14px 20px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.dlg-name{position:absolute;top:-14px;left:10px;background:var(--ink);color:var(--gold);font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:6px}
.dlg-face{position:absolute;left:10px;top:12px;width:48px;height:48px;image-rendering:pixelated}
.dlg-text{font-size:16px;line-height:1.55;color:var(--ink);min-height:64px;white-space:pre-wrap}
.dlg-hint{position:absolute;right:12px;bottom:4px;color:var(--ink);animation:blink 1s infinite;font-size:14px}
@keyframes blink{50%{opacity:0}}
/* menus — shared panel system: paper, 2px ink border, 10px radius, soft shadow.
   Selection = gold tint + left gold bar + cursor glyph. Disabled = muted italic. */
.menu{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);min-width:240px;max-width:92vw;max-height:62vh;overflow:auto;background:var(--paper);border:2px solid var(--ink);border-radius:10px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.menu-title{background:var(--ink);color:var(--gold);font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:10px 12px}
.menu-list{padding:6px}
.menu-row{display:flex;width:100%;gap:8px;align-items:center;background:none;border:0;border-left:4px solid transparent;border-bottom:1px solid #e2e2d6;font:inherit;font-size:15px;line-height:1.35;color:var(--ink);text-align:left;padding:10px;border-radius:6px;min-height:48px;cursor:pointer}
.menu-row .cur{width:18px;flex:none;color:#9a7b0a;font-weight:bold}
.menu-row.cursor{background:rgba(232,200,50,.22);border-left-color:var(--gold)}
.menu-row.disabled{color:#8f8f96;font-style:italic;cursor:default}
.menu-row.emptyslot{border:2px dashed #b9b9ae;background:rgba(32,32,40,.04);color:#8f8f96;font-style:italic}
.picon{width:28px;height:28px;flex:none;object-fit:contain;image-rendering:pixelated;background:#fff;border:2px solid var(--ink);border-radius:6px}
/* toasts — bottom-edge, centered, just above the controls zone (never mid-map) */
.toasts{position:absolute;left:0;right:0;bottom:clamp(72px,18vh,168px);display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;pointer-events:none}
.toast{background:var(--ink);color:var(--paper);font-size:14px;line-height:1.4;padding:10px 16px;border-radius:999px;pointer-events:none;max-width:min(520px,92vw);text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.hudtoast{border:2px solid var(--gold);font-weight:bold}
/* controls — compact offsets so nothing overflows 360x640-class screens */
.controls{position:absolute;inset:0;pointer-events:none}
.dpad{position:absolute;left:16px;bottom:12px;width:144px;height:144px;pointer-events:auto}
body.flip .dpad{left:auto;right:16px}
.padbtn{position:absolute;width:48px;height:48px;background:#2a2a34;color:#fff;border:2px solid #55555f;border-radius:8px;font-size:16px;pointer-events:auto;touch-action:none}
.p-up{left:48px;top:0}.p-down{left:48px;bottom:0}.p-left{left:0;top:48px}.p-right{right:0;top:48px}
.padbtn:active{background:#4a4a58}
.ab{position:absolute;right:16px;bottom:12px;width:160px;height:110px;pointer-events:auto}
body.flip .ab{right:auto;left:16px}
.abtn{position:absolute;width:72px;height:72px;border-radius:50%;background:#2a2a34;color:#fff;border:2px solid #55555f;font-size:20px;font-weight:bold;pointer-events:auto;touch-action:none}
.a-a{right:0;bottom:0}.a-b{left:0;bottom:0}
.abtn:active{background:#c03028}
.sysbtns{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;display:flex;gap:8px;pointer-events:auto}
.sysbtn{background:#2a2a34;color:#ccc;border:2px solid #55555f;border-radius:14px;font-size:14px;padding:10px 14px;min-height:48px;pointer-events:auto}
/* P0/E8: battle command 2x2 grid (replaces the D-pad zone) */
.cmdpanel{position:absolute;left:16px;bottom:12px;right:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;pointer-events:auto}
.cmdf{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:88px;min-height:64px;background:var(--ink);color:var(--gold);border:2px solid #55555f;border-radius:10px;font-family:var(--font);font-size:14px;font-weight:bold;cursor:pointer;touch-action:none}
.cmdf.cursor{border-color:var(--gold);background:#34343f}
.cmdf.disabled{opacity:.35}
.cmdf.dimmed{opacity:.45}
.cmdf.tut-focus{border-color:#58c94f;animation:cmdfocus 1s infinite}
@keyframes cmdfocus{50%{border-color:#e8c832}}
.cmdicon{width:24px;height:24px;image-rendering:pixelated}
.cmdlabel{line-height:1}
/* P0/E9: move menu 2x2 grid + type badge pills (icon+text, never color-alone) */
.menugrid{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px}
.menugrid .menu-row{flex-direction:column;align-items:flex-start;min-height:72px;border:2px solid #d8d8cc;border-radius:8px;position:relative}
.menugrid .menu-row.cursor{border-color:var(--gold);background:rgba(232,200,50,.22)}
.mvcell{display:flex;flex-direction:column;gap:2px;width:100%}
.mvname{font-weight:bold;font-size:14px}
.mvpp{font-size:14px;color:#555}
.mvpow{font-size:14px;color:#777}
.tpill{display:inline-block;font-size:14px;font-weight:bold;color:#fff;border:1px solid #202028;border-radius:8px;padding:1px 8px;margin:2px 0;text-shadow:1px 1px 0 rgba(0,0,0,.4)}
.tpill b{font-weight:bold}
.menu-row.zeropp{color:#a0a0a0}
.menu-row.zeropp::after{content:'';position:absolute;left:6px;right:6px;top:50%;height:3px;background:#c03028;transform:rotate(-8deg);border-radius:2px}
.menu-row.tut-focus{border-color:#58c94f;animation:cmdfocus 1s infinite}
/* P0/C3: name-entry A-Z grid (44px keys) — font swap + house shadow token only */
.nkbover{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;background:rgba(0,0,0,.45);z-index:30}
@media(min-width:700px){.nkbover{align-items:center}}
.namekb{background:#f8f8f0;border:2px solid #202028;border-radius:10px;padding:12px;width:100%;max-width:480px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
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
.login{background:#14141c;border:3px solid #e8c832;border-radius:10px;padding:0;width:min(420px,92vw);box-shadow:0 4px 18px rgba(0,0,0,.35);overflow:hidden}
.login-head{background:#e8c832;color:#14141c;font-size:15px;font-weight:bold;padding:10px 14px;letter-spacing:1px}
.login-tabs{display:flex}
.logintab{flex:1;font-family:inherit;font-size:14px;font-weight:bold;padding:12px 4px;min-height:48px;background:#2a2a34;color:#999;border:0;border-bottom:3px solid transparent;cursor:pointer}
.logintab.sel{background:#14141c;color:#ffe9a8;border-bottom-color:#e8c832}
.loginpane{padding:16px 14px;display:flex;flex-direction:column;gap:10px}
.login-note{font-size:14px;line-height:1.5;color:#ccc}
.loginpane label{font-size:14px;color:#999;display:flex;flex-direction:column;gap:4px}
.login-in{font-family:inherit;font-size:14px;padding:10px;background:#0a0a12;color:#666;border:2px solid #333;border-radius:6px}
.login-go{font-family:inherit;font-size:15px;font-weight:bold;padding:12px;min-height:48px;border-radius:8px;border:2px solid #555;background:#2a2a34;color:#777;cursor:not-allowed}
.login-go.active{background:#58c94f;border-color:#3a7a3a;color:#102010;cursor:pointer}
/* P0/B1: in-game guest banner — slim ink strip, gold underline, dismissible */
.guestbanner{position:absolute;top:0;left:0;right:0;min-height:32px;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--ink);color:var(--paper);font-size:14px;pointer-events:auto;z-index:20;border-bottom:3px solid var(--gold)}
.gbx{background:none;border:0;color:var(--gold);font-size:14px;min-width:48px;min-height:32px;cursor:pointer}
/* HUD chips (Seat D API: setLocationChip / setObjectiveChip / setDexChip).
   Top-left column inside the frame area. Base top clears the guest banner
   (32px) AND the sync-dot row that shares top:34px/left:8px. On wide screens
   the column's max-width reserves the top-right button rail; on narrow
   phones (max-width:560px) the column drops BELOW the rail instead, so the
   chips never overlap the buttons and keep a usable width at 360px. */
.hudchips{position:absolute;top:72px;left:8px;display:flex;flex-direction:column;gap:6px;z-index:14;pointer-events:none;max-width:calc(100vw - 308px)}
.hudchip{pointer-events:none}
.locchip{align-self:flex-start;max-width:100%;background:var(--ink);color:var(--paper);font-size:14px;font-weight:bold;letter-spacing:.4px;padding:8px 12px;border-radius:999px;border:2px solid rgba(248,248,240,.16);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.objchip{background:rgba(248,248,240,.96);color:var(--ink);border:2px solid var(--ink);border-left:4px solid var(--gold);border-radius:10px;padding:8px 10px;max-width:min(300px,58vw);box-shadow:0 4px 18px rgba(0,0,0,.35)}
.obj-kicker{display:block;font-size:14px;font-weight:bold;letter-spacing:2px;color:#8a6a10;margin-bottom:2px}
.obj-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:14px;line-height:1.4}
.dexchip{align-self:flex-start;background:var(--ink);color:var(--gold);font-size:14px;font-weight:bold;letter-spacing:1px;padding:6px 12px;border-radius:999px;border:2px solid rgba(248,248,240,.16);white-space:nowrap}
.nohud .hudchips{display:none}
.inbattle .hudchips{display:none}
@media (max-width:560px){.hudchips{top:110px;max-width:calc(100vw - 72px)}.objchip{max-width:min(300px,calc(100vw - 72px))}}
/* P1/D4: HUD quick-strip — one framed ink rail containing the 4 buttons */
.hudstrip{position:absolute;top:34px;right:8px;display:flex;gap:4px;pointer-events:auto;z-index:15;background:rgba(32,32,40,.94);border:2px solid rgba(248,248,240,.16);border-radius:14px;padding:4px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.nohud .hudstrip{display:none}
.inbattle .hudstrip{display:none}
/* D3: the battle command panel and the desktop hint card both anchor to the
   viewport bottom — hide the hint card in battle so they never overlap. */
.inbattle .hintcard{display:none}
.hudbtn{position:relative;width:64px;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:transparent;border:0;border-radius:10px;cursor:pointer;touch-action:none;font-family:var(--font)}
.hudbtn:active{background:rgba(232,200,50,.22)}
.hudicon{width:24px;height:24px;image-rendering:pixelated}
.hudlabel{font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--paper);font-family:var(--font)}
.dexdot{position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#e84040;border:1px solid #fff}
/* P1/D7: partner mood pip — no longer a stray bottom-right floater: it lives
   in the right rail, directly under the HUD button rail (48px round ink
   button, partner face + status dot). In landscape the vertical rail owns
   the whole right edge, so the pip hides there (partner stays one tap away
   via the Party rail button / talking to the partner in the overworld). */
.moodpip{position:absolute;right:8px;top:110px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--ink);border:2px solid rgba(248,248,240,.25);border-radius:50%;cursor:pointer;pointer-events:auto;z-index:15;touch-action:none}
body.landscape .moodpip{display:none}
.moodface{width:24px;height:24px;image-rendering:pixelated}
.mooddot{position:absolute;bottom:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#58c94f;border:1px solid #fff}
/* P1/G1: party row HP mini-bars + status chips + partner badge */
.phpbar{display:inline-block;width:64px;height:8px;background:#28182c;border-radius:3px;vertical-align:middle;margin:0 6px;overflow:hidden}
.phpbar i{display:block;height:100%}
.pstat{font-size:14px;font-weight:bold;color:#a040a0;margin-left:6px}
.pbadge{display:inline-block;background:var(--gold);color:var(--ink);font-size:14px;font-weight:bold;letter-spacing:1px;padding:1px 8px;border-radius:999px;margin-left:6px;vertical-align:middle}
/* P1/I2: HUD scale (setting existed with no UI row) */
.hudstrip{transform:scale(var(--hudscale,1));transform-origin:top right}
body.landscape .hudstrip{transform:translateY(-50%) scale(var(--hudscale,1))}
/* P1/K2: landscape — the HUD strip re-rails to the right edge */
body.landscape .hudstrip{top:50%;flex-direction:column}
/* P1/K3: desktop keyboard-hint card — restyled to the chip system (ink pill) */
.hintcard{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;display:flex;align-items:center;gap:10px;background:rgba(32,32,40,.95);border:2px solid rgba(248,248,240,.16);border-radius:999px;color:var(--paper);font-size:14px;padding:8px 8px 8px 16px;pointer-events:auto;z-index:25;max-width:92vw;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.hintcard-x{background:var(--gold);color:var(--ink);border:0;border-radius:999px;font-size:14px;font-weight:bold;font-family:inherit;padding:8px 12px;min-height:48px;cursor:pointer;white-space:nowrap}
body.desktop .controls{display:none}
/* D2: chapter title card (anime-chronology spine, ADR-015). Paper panel, ink
   border, gold kicker — Gen 4/5 idiom, no animation (reduced-motion safe).
   box-shadow reuses the single house value (QA-001). All text >= 14px. */
.chaptercard{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(440px,92vw);background:var(--paper);border:2px solid var(--ink);border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.35);padding:18px 16px 14px;text-align:center;pointer-events:auto;z-index:35}
.cc-kicker{font-size:14px;font-weight:bold;letter-spacing:3px;color:#8a6a10;margin-bottom:8px}
.cc-title{font-size:22px;font-weight:bold;color:#202028;margin-bottom:8px;line-height:1.2}
.cc-arc{font-size:15px;color:#40404a;margin-bottom:6px;line-height:1.4}
.cc-anime{font-size:14px;color:#70707c;line-height:1.4;margin-bottom:4px}
.cc-hint{font-size:14px;color:#8a6a10;margin-top:10px;animation:blink 1s infinite}
body.desktop.showtouch .controls{display:block}
@media (pointer:coarse){body.desktop .controls{display:block}}
/* Track B: full auth UI (vercel target). Font swap only (Seat D): structure,
   colours and borders are untouched; the body font var and the single house
   shadow token are the only system changes that reach these rules. */
.authcard{background:#F7F3E8;border:3px solid #14141A;border-radius:10px;padding:0;width:min(440px,94vw);max-height:92dvh;display:flex;flex-direction:column;box-shadow:0 4px 18px rgba(0,0,0,.35);overflow:hidden}
.authhead{background:#14141A;color:#FFD23F;font-size:16px;font-weight:bold;padding:10px 14px;letter-spacing:1px}
.authsub{font-size:14px;color:#3a3a44;padding:8px 14px 0;line-height:1.45}
.authtabs{display:flex;border-bottom:3px solid #14141A}
.authtab{flex:1;font-family:inherit;font-size:15px;font-weight:bold;padding:12px 4px;min-height:48px;background:#e8e0c8;color:#5a5a66;border:0;border-right:2px solid #14141A;cursor:pointer}
.authtab:last-child{border-right:0}
.authtab.sel{background:#F7F3E8;color:#14141A;border-top:3px solid #FFD23F;padding-top:9px}
.authtab:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}
.authpane{padding:14px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.authfield{display:flex;flex-direction:column;gap:4px;font-size:15px;font-weight:bold;color:#14141A}
.authin{font-family:inherit;font-size:16px;padding:10px;min-height:48px;background:#fff;color:#14141A;border:3px solid #14141A;border-radius:6px}
.authin:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}
.authin:disabled{background:#e8e4d8;color:#8a8a96}
.authrow{display:flex;gap:8px;align-items:stretch}
.authshow{min-width:48px;min-height:48px;font-family:inherit;font-size:14px;font-weight:bold;background:#e8e0c8;color:#14141A;border:3px solid #14141A;border-radius:6px;cursor:pointer}
.authgo{font-family:inherit;font-size:16px;font-weight:bold;padding:12px;min-height:52px;border-radius:8px;border:3px solid #14141A;background:#2FA84F;color:#fff;cursor:pointer}
.authgo:disabled{background:#b9b3a3;color:#6a6a76;cursor:not-allowed}
.authgo.sec{background:#2B6CB0}
.authgo.ghost{background:#F7F3E8;color:#14141A}
.authgo:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}
.autherr{background:#fdecea;border:2px solid #C0392B;color:#C0392B;font-size:15px;font-weight:bold;padding:8px 10px;border-radius:6px;line-height:1.4}
.authhint{font-size:14px;color:#5a5a66;line-height:1.4}
.authhint.ok{color:#1e7a38;font-weight:bold}
.authcheck{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:#14141A;line-height:1.4;cursor:pointer}
.authcheck input{width:24px;height:24px;min-width:24px;margin-top:2px;accent-color:#2B6CB0}
.authlink{background:none;border:0;color:#2B6CB0;font-size:15px;font-weight:bold;text-decoration:underline;cursor:pointer;min-height:48px;text-align:left;font-family:inherit;padding:0}
.authlink:focus-visible{outline:3px solid #FFD23F;outline-offset:2px}
.authcodes{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#14141A;border-radius:8px;padding:12px}
.authcode{font-family:monospace;font-size:18px;font-weight:bold;color:#FFD23F;text-align:center;padding:8px 4px;border:2px dashed #5a5a66;border-radius:6px;letter-spacing:1px}
.authwarn{background:#FFF3CD;border:2px solid #D99A26;color:#7a4d00;font-size:15px;font-weight:bold;padding:8px 10px;border-radius:6px;line-height:1.4}
.authscroll{background:#fff;border:2px solid #14141A;border-radius:6px;padding:10px 12px;font-size:14px;line-height:1.5;color:#14141A;max-height:220px;overflow-y:auto;white-space:pre-wrap}
.authscroll h4{font-size:15px;margin:8px 0 4px}
.authdraft{background:#14141A;color:#FFD23F;font-size:14px;font-weight:bold;padding:6px 10px;border-radius:6px}
.confcols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.confcol{background:#fff;border:3px solid #14141A;border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;font-size:14px;color:#14141A}
.confcol h4{font-size:15px;margin:0}
.confcol .pick{margin-top:4px}
.syncdot{position:absolute;top:34px;left:8px;z-index:15;display:flex;align-items:center;gap:6px;background:var(--ink);border:2px solid rgba(248,248,240,.16);border-radius:999px;color:var(--paper);font-size:14px;font-family:inherit;padding:6px 10px;pointer-events:none}
.syncdot .sdot{width:10px;height:10px;border-radius:50%;background:#2FA84F}
.syncdot.pending .sdot{background:#D99A26}
.syncdot.offline .sdot{background:#8a8a96}
.banner503{position:absolute;top:0;left:0;right:0;z-index:45;display:flex;align-items:center;justify-content:center;gap:10px;background:#202028;color:#ffe9a8;font-size:15px;padding:10px 12px;border-bottom:3px solid #FFD23F;pointer-events:auto;text-align:center}
.banner503 button{background:#2a2a34;color:#ffe9a8;border:2px solid #55555f;border-radius:8px;font-size:14px;font-family:inherit;padding:8px 12px;min-height:48px;cursor:pointer}
.pwmeter{display:flex;gap:6px;align-items:center;font-size:14px;font-weight:bold;color:#5a5a66}
.pwmeter .bar{flex:1;height:10px;background:#e8e0c8;border:2px solid #14141A;border-radius:5px;overflow:hidden}
.pwmeter .fill{display:block;height:100%;width:0;background:#C0392B}
.pwmeter.fair .fill{width:55%;background:#D99A26}
.pwmeter.strong .fill{width:100%;background:#2FA84F}
@media (prefers-reduced-motion: reduce){
  .loginover *,.authcard *,.banner503 *,.syncdot *,.chaptercard *,.dialogue *,.hudchips *,.toasts *{animation:none!important;transition:none!important}
}
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

// HARD GATE (PRD AC#1, Tech Law COPPA cleanliness): a zero-network bundle makes
// zero network calls of any kind — fail the build if any survive the strip.
// Applies identically to the guest and personal targets (ADR-012 §4).
function zeroNetworkGate(js, label) {
  const netHits = [];
  const fetchN = (js.match(/fetch\s*\(/g) || []).length;
  if (fetchN) netHits.push('fetch(:' + fetchN);
  const apiN = (js.match(/\/api\//g) || []).length;
  if (apiN) netHits.push('/api/:' + apiN);
  const beaconN = (js.match(/sendBeacon/g) || []).length;
  if (beaconN) netHits.push('sendBeacon:' + beaconN);
  for (const pat of [/XMLHttpRequest/, /new WebSocket/, /https?:\/\//]) {
    const n = (js.match(pat) || []).length;
    if (n) netHits.push(pat + ':' + n);
  }
  if (netHits.length) fail(label + ' bundle has network references (auth strip leaked): ' + netHits.join(', '));
}

async function main() {
  const TARGETS = ['vercel', 'guest', 'personal'];
  const explicit = TARGETS.filter((t) => process.argv.includes('--target=' + t));
  const want = (t) => explicit.length === 0 || explicit.includes(t);
  await validateData();

  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'personal'), { recursive: true });

  let vercelJs = null, guestJs = null, personalJs = null;

  if (want('vercel')) {
    // Bundle B: vercel static client (full auth UI compiled in).
    vercelJs = buildGameJs({ auth: true });
    const vhash = crypto.createHash('sha256').update(vercelJs).digest('hex');
    console.log('game.js (auth): ' + vercelJs.length + ' bytes, contentHash ' + vhash.slice(0, 16) + '...');
    fs.writeFileSync(path.join(ROOT, 'public', 'game.js'), vercelJs);
    const indexHtml = shellHtml({ gameJs: null, inline: false })
      .replace('</body>', '<!-- contentHash:' + vhash + ' -->\n</body>');
    fs.writeFileSync(path.join(ROOT, 'public', 'index.html'), indexHtml);
    console.log('public/game.js + index.html: ' + (vercelJs.length + indexHtml.length) + ' bytes');
  }

  if (want('guest')) {
    // Bundle A: guest single-file (auth UI compile-time stripped, offline).
    guestJs = buildGameJs({ auth: false });
    zeroNetworkGate(guestJs, 'guest');
    const ghash = crypto.createHash('sha256').update(guestJs).digest('hex');
    console.log('game.js (guest, auth stripped): ' + guestJs.length + ' bytes, contentHash ' + ghash.slice(0, 16) + '...');
    const standalone = shellHtml({ gameJs: guestJs, inline: true })
      .replace('</body>', '<!-- contentHash:' + ghash + ' -->\n</body>');
    fs.writeFileSync(path.join(ROOT, 'dist', 'standalone.html'), standalone);
    console.log('dist/standalone.html: ' + standalone.length + ' bytes (zero-network gate: PASS)');
  }

  if (want('personal')) {
    // Bundle C (ADR-012): personal edition — the guest auth-strip path, plus
    // the EDITION_MARKER title ribbon. Multi-file layout mirroring public/
    // (index.html + game.js) for static Vercel serving. No api/ functions.
    personalJs = buildGameJs({ edition: 'personal' });
    zeroNetworkGate(personalJs, 'personal');
    const phash = crypto.createHash('sha256').update(personalJs).digest('hex');
    console.log('game.js (personal, auth stripped + marker): ' + personalJs.length + ' bytes, contentHash ' + phash.slice(0, 16) + '...');
    fs.writeFileSync(path.join(ROOT, 'personal', 'game.js'), personalJs);
    const personalHtml = shellHtml({ gameJs: null, inline: false })
      .replace('</body>', '<!-- contentHash:' + phash + ' -->\n</body>');
    fs.writeFileSync(path.join(ROOT, 'personal', 'index.html'), personalHtml);
    console.log('personal/game.js + index.html: ' + (personalJs.length + personalHtml.length) + ' bytes (zero-network gate: PASS)');
  }

  fs.writeFileSync(path.join(ROOT, 'dist', 'content-hash.txt'),
    (guestJs ? 'guest:' + crypto.createHash('sha256').update(guestJs).digest('hex') + '\n' : '') +
    (vercelJs ? 'vercel:' + crypto.createHash('sha256').update(vercelJs).digest('hex') + '\n' : '') +
    (personalJs ? 'personal:' + crypto.createHash('sha256').update(personalJs).digest('hex') + '\n' : ''));
  console.log('build OK');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error('BUILD FAIL: ' + e.message); process.exit(1); });
