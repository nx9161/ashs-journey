// build.mjs — zero-dependency build (Node stdlib only: fs/path/crypto).
// One source tree -> two shipped targets from the same concatenated game JS:
//   Bundle A (guest, CANONICAL): dist/standalone.html — single self-contained file, offline.
//   Bundle B (personal):         personal/index.html + personal/game.js — static client.
// Build targets:
//   --target=guest    : dist/standalone.html (guest single-file, auth UI compiled OUT)
//   --target=personal : personal/game.js + personal/index.html (ADR-012 "Naman's edition")
//   (default: both)
//
// VERCEL TARGET RETIRED (2026-11-12, infra/retire-vercel): the former Bundle B
// (public/ static client, auth UI compiled IN) is no longer built. The game is
// canonical on GitHub Pages (the guest edition above); the Vercel deployment
// only ever served a stale copy, and its 12 MB static budget had 61 bytes of
// headroom left. The auth code itself stays in src/ behind its markers — it is
// compile-time stripped from EVERY shipped bundle now. buildGameJs({auth:true})
// still assembles the unstripped build IN MEMORY ONLY, as the proof oracle for
// drift-gate.mjs / verify-slice.mjs (guest === that build minus auth sections);
// it is not a target and is never written to disk.
//
// Auth code paths are compile-time feature-flagged:
//   * lines between `// __AUTH_BEGIN__` and `// __AUTH_END__` are STRIPPED from
//     both shipped targets (block strip, build fails on unbalanced markers);
//   * the token `/*__AUTH_ENABLED__*/` is replaced with `false` (guest, personal)
//     — `true` only in the in-memory auth reference build;
//   * the token `/*__EDITION_MARKER__*/` is replaced with `''` (guest) or
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
//   * Output uses the multi-file layout (index.html + game.js) for
//     static serving. NO api/ functions ship with this target — access
//     control lives at the hosting layer (a separate Vercel project with Vercel
//     Authentication, Standard Protection).
//   * GC-verbatim disclaimers and credits are byte-identical across both targets.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assertBasicLatin } from './font-gate.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ROOT, 'src');

// ---- UI v2.1 (defect 1): Platinum typefaces are SELF-HOSTED font files ----
// The v2 build embedded hand-subsetted base64 blobs inline in SHELL_CSS;
// the subsets silently lacked glyphs the UI uses (the menu cursor, the
// name-entry cursor, gender marks), and nobody could audit what the blobs
// were. The fonts now live as real files in assets/fonts/ (see its
// README.md for provenance + subset ranges) and are embedded from disk at
// build time, byte-identical in both shipped targets. Galmuri + Pixelify
// Sans are SIL OFL 1.1 (THIRD-PARTY-NOTICES.md; OFL text in assets/fonts/).
// UI v2.2 (defect 1): the 400 face is Galmuri11 Regular — the true sibling
// of the Galmuri11 Bold headings. Galmuri14 (the v2/v2.1 400 face) loads
// fine but its hairline outline construction renders as a wispy, unrelated
// face next to the Bold, which is how "fonts verified loaded" shipped with
// body text visibly NOT in the family. One family, two weights, both
// bitmap-sturdy — the DP/Pt single-family look.
// UI v2.4 (defect 1, third attempt): the BODY face is now Pixelify Sans
// (family 'PtPixel', 400+700), replacing DotGothic16. DotGothic's shipped
// bytes were never broken — full Latin, loaded, provably applied (see the
// v2.4 root-cause in docs/ui-v24-root-cause.md) — but its Latin is a
// half-width dot-matrix whose single-dot strokes dissolve under Chromium's
// antialiasing at the game's 13–16px body sizes and read as handwriting.
// Pixelify Sans has solid filled pixel letterforms that survive those
// sizes. It ships as WOFF (not woff2) so scripts/font-gate.mjs can decode
// the cmap of the EXACT shipped bytes in pure Node (zlib inflate + cmap
// parse) and fail the build if basic Latin coverage is ever absent.
function fontFaceCss() {
  const dir = path.join(ROOT, 'assets', 'fonts');
  const b64 = (f) => fs.readFileSync(path.join(dir, f)).toString('base64');
  // UI v2.4 HARD GATE: the body face's exact shipped bytes must carry
  // full basic Latin (scripts/font-gate.mjs) — the build dies here rather
  // than shipping another silently-wrong body font (v2.1–v2.3 lesson).
  for (const f of ['PtPixel.woff', 'PtPixel-Bold.woff']) {
    const r = assertBasicLatin(fs.readFileSync(path.join(dir, f)), f);
    if (!r.ok) {
      throw new Error('font-gate: ' + f + ' is missing ' + r.missing.length
        + ' basic Latin codepoints (U+0020–U+007E) — refusing to build');
    }
  }
  const face = (family, weight, file, fmt) =>
    "@font-face{font-family:'" + family + "';src:url(data:font/" + fmt + ";base64," + b64(file) +
    ") format('" + fmt + "');font-weight:" + weight + ";font-style:normal;font-display:swap}";
  return face('PtGalmuri', 400, 'Galmuri11.woff2', 'woff2')
    + face('PtGalmuri', 700, 'Galmuri11-Bold.woff2', 'woff2')
    + face('PtPixel', 400, 'PtPixel.woff', 'woff')
    + face('PtPixel', 700, 'PtPixel-Bold.woff', 'woff');
}
const FONT_FACE_CSS = fontFaceCss();

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

// stripAuthBlocks: the same guest-target auth removal, applied to the
// in-memory auth reference build (buildGameJs({ auth: true })). Used by
// drift-gate.mjs + verify-slice.mjs to prove the guest bundle is EXACTLY the
// full source build minus the auth sections (no drift). The reference build
// replaced the retired vercel bundle as the strip oracle — same proof, and
// the reference is now guaranteed current because it is rebuilt from src on
// every gate run instead of read from a committed artifact.
// Also normalizes the AUTH_ENABLED compile flag (true in the reference
// build, false in guest) so the comparison isolates the block strip.
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
  const edition = opts.edition || null;
  // Shipped editions: 'guest' (canonical) and 'personal' — BOTH compile the
  // auth UI out, and main() always names one explicitly. With NO edition
  // named (the historical default, kept deliberately), the UNSTRIPPED full
  // source build is assembled instead: auth in, marker ''. Since the vercel
  // target was retired that build is never shipped and never written to disk
  // as a bundle — it survives as (a) the strip-proof oracle for
  // drift-gate.mjs / verify-slice.mjs (call it as buildGameJs({ auth: true })
  // for readability) and (b) the superset build the headless test suites
  // eval. Do not "fix" the default to guest: ~24 suites call buildGameJs()
  // bare and were written against the full build.
  const auth = !edition;
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
  // true only in the in-memory auth reference build, false in both shipped
  // bundles (guest and personal).
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
    const { ARCS } = await import(path.join(SRC, 'data', 'arcs.mjs'));
    // Stage J0 touchpoint fix: authored trainer levels are bounded by
    // the widest FINITE band in the ARCS registry (trainer data is
    // authored content spanning every arc, not one save's band) —
    // a registry read, not the old hard-coded 100 that would have
    // failed the build the day a Johto trainer (Lv 101-200) landed.
    const MAX_AUTHORED_LEVEL = Math.max(...ARCS.filter((a) => a.band).map((a) => a.band.max));

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
        if (mon.level < 1 || mon.level > MAX_AUTHORED_LEVEL) fail('trainer ' + id + ': bad level');
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
:root{--ink:#232838;--paper:#f6f8fc;--gold:#e8b832;--frame:#2b3040;--frame2:#8d9bbf;--navy:#2e4a8f;--sky:#bcd2f5;--red:#e03c31;--sys1:#4a7dd0;--sys2:#2a4d9c;--lcd:#a9c08a;--lcdink:#26331f;--font:'PtPixel','PtGalmuri',system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--font-display:'PtGalmuri','PtPixel',system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--rivets:radial-gradient(circle at 9px 9px,#6d7ba3 2px,rgba(0,0,0,0) 2.6px),radial-gradient(circle at calc(100% - 9px) 9px,#6d7ba3 2px,rgba(0,0,0,0) 2.6px),radial-gradient(circle at 9px calc(100% - 9px),#6d7ba3 2px,rgba(0,0,0,0) 2.6px),radial-gradient(circle at calc(100% - 9px) calc(100% - 9px),#6d7ba3 2px,rgba(0,0,0,0) 2.6px)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden;background:#070a16;touch-action:none;overscroll-behavior:none}
body{font-family:var(--font);-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
#stage{position:fixed;inset:0;height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse 90% 60% at 50% 38%,rgba(46,74,143,.32),rgba(7,10,22,0) 62%),repeating-linear-gradient(45deg,rgba(188,210,245,.03) 0 2px,transparent 2px 14px),#070a16}
/* UI v2.5 (mobile controls fix): the stage is two regions — #screenwrap
   (flexes, letterboxes the canvas) and #ctlband (the reserved control
   band in flow below it). The touch pad lives in the band, never as a
   viewport overlay, so control boxes and the canvas box are disjoint by
   layout at every size. Landscape dissolves the band into grid flanks. */
#screenwrap{flex:1 1 auto;width:100%;min-height:0;min-width:0;display:flex;align-items:center;justify-content:center}
#ctlband{width:100%;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px))}
/* UI v2.6 (Wave CAM): #hudband — the reserved in-flow HUD band above
   #screenwrap. The HUD chips column, quick-strip and mood pip mount here
   (ui.mjs), in page flow, so no HUD element can ever overlap the 16x16
   canvas — the same structural trick v2.5 used for the touch pad below.
   On desktop ui.mjs width-syncs the band to the canvas box. */
#hudband{width:100%;flex:0 0 auto;display:flex;align-items:flex-start;gap:8px;padding:8px 10px 2px}
body.desktop #ctlband{display:none}
body.desktop.showtouch #ctlband{display:block}
@media (pointer:coarse){body.desktop #ctlband{display:block}}
body.landscape #stage{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto 1fr auto;align-items:stretch;justify-content:stretch;column-gap:20px;padding-left:max(10px,env(safe-area-inset-left,0px));padding-right:max(10px,env(safe-area-inset-right,0px));padding-top:env(safe-area-inset-top,0px)}
body.landscape #hudband{grid-column:1/4;grid-row:1;width:auto}
body.landscape #screenwrap{grid-column:2;grid-row:2/4;width:auto}
body.landscape #ctlband{display:contents}
#game{image-rendering:pixelated;background:#000;outline:2px solid #8d9bbf;box-shadow:0 4px 18px rgba(0,0,0,.35)}
#ui{position:fixed;inset:0;pointer-events:none}
/* UI v2.1 frame layer: box synced to the canvas rect by UI._syncChipAnchor.
   Every in-game DOM surface (dialogue, menus, battle commands, HUD, toasts)
   is a child of this layer, so frame-relative positioning is structural —
   game chrome cannot render outside the frame on any viewport. */
.frameui{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:6}
.hidden{display:none!important}
/* Platinum window system (UI v2): cool-white interior, navy outer line,
   silver-blue inner line (via inset outline), corner rivets in the frame
   tone. The one house drop shadow is unchanged (QA gate: exactly one
   box-shadow style bundle-wide, so depth never comes from shadows). */
.dialogue{position:absolute;left:2.5%;right:2.5%;bottom:2.5%;min-height:96px;background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:14px 16px 20px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.dlg-name{display:block;font-family:var(--font-display);font-size:15px;font-weight:bold;letter-spacing:.5px;color:var(--navy);margin-bottom:2px}
/* UI v2.4.1 (prose weight pass): copy the player reads as prose — dialogue
   body, objective, terminal notes, hints — renders in the body face's BOLD
   weight at +2px. Pixelify 400 at 13-16px has ~1px stems and read thin and
   small next to the chunky Galmuri-bold name line on the parent's live
   grade of v2.4, even though the face itself measured solid at 24px.
   Bold alone still measured airy (Pixelify's letterforms have large
   counters), so prose also carries the classic game-text treatment — a
   hairline stroke in the text's own color plus a whisper of tight
   tracking — tuned by screenshot measurement until the dialogue body's
   ink density reached the name line's (the verify-live screenshot-ink
   gate now enforces body >= 90% of name on rendered pixels). Dense
   list rows stay 400 with a +1px rise (.menu-row, .mvpp, .sumrow, ...). */
.dlg-text{font-size:18px;font-weight:700;line-height:1.5;color:var(--ink);min-height:64px;white-space:pre-wrap;-webkit-text-stroke:1px currentColor;letter-spacing:-.3px}
.dlg-hint{position:absolute;right:12px;bottom:4px;color:var(--red);font-weight:bold;animation:blink 1s infinite;font-size:14px}
@keyframes blink{50%{opacity:0}}
/* menus — Platinum windows: light interior, silver-blue title band, pale
   blue selection with a navy inset ring and a red cursor glyph. */
.menu{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:min(240px,94%);max-width:94%;max-height:92%;overflow:auto;background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35)}
/* Elevation C1: menu open transition — a 90ms flat plate-settle
   (translateY 4px -> 0 + opacity, steps() easing for the pixel feel).
   Flat only: no gradients, no new shadow. The .menu-open class is added
   by UI.renderMenu only on a fresh open; Reduced Motion kills it. */
@keyframes menuopen{from{opacity:0;transform:translate(-50%,calc(-50% + 4px))}to{opacity:1;transform:translate(-50%,-50%)}}
.menu.menu-open{animation:menuopen 90ms steps(3) 1}
body.reduced-motion .menu.menu-open{animation:none}
.menu-title{font-family:var(--font-display);background:#d7e1f2;color:var(--ink);font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:10px 12px;border-bottom:2px solid var(--frame)}
.menu-list{padding:6px}
.menu-row{display:flex;width:100%;gap:8px;align-items:center;background:none;border:0;border-left:4px solid transparent;border-bottom:1px solid #ccd6ea;font:inherit;font-size:16px;line-height:1.35;color:var(--ink);text-align:left;padding:10px;border-radius:4px;min-height:48px;cursor:pointer}
.menu-row .cur{width:18px;flex:none;color:var(--red);font-weight:bold}
.menu-row.cursor{background:var(--sky);outline:2px solid var(--navy);outline-offset:-2px;border-left-color:var(--navy)}
.menu-row.disabled{color:#8a93a8;font-style:italic;cursor:default}
.menu-row.emptyslot{border:2px dashed #9aa7c4;background:rgba(46,74,143,.05);color:#8a93a8;font-style:italic}
.picon{width:28px;height:28px;flex:none;object-fit:contain;image-rendering:pixelated;background:#fff;border:2px solid var(--frame);border-radius:4px}
/* Elevation C2: Quest Log section headers wear the flat silver-blue
   section band (the menu-title band treatment), not muted italic. */
.menu-row.band{background:#d7e1f2;border-bottom:2px solid var(--frame);font-family:var(--font-display);font-weight:bold;font-style:normal;letter-spacing:1px;justify-content:center;text-align:center;min-height:38px;padding:6px 10px;color:var(--ink)}
.menu-row.band .cur{display:none}
/* blue system windows (Save / Options / confirms): Platinum's system style */
.menu.syswin{background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff}
.menu.syswin .menu-title{background:linear-gradient(#33549c,#223c78);color:#fff;border-bottom:2px solid #dfe7f5}
.menu.syswin .menu-row{color:#fff;border-bottom:1px solid rgba(223,231,245,.35)}
.menu.syswin .menu-row .cur{color:#ffe9a8}
.menu.syswin .menu-row.cursor{background:rgba(255,255,255,.28);outline:2px solid #fff;border-left-color:#fff}
.menu.syswin .menu-row.disabled{color:rgba(255,255,255,.55)}
/* party screen (Platinum layout): full-frame blue field, 2-col slot plates */
.menu.plate-full{left:0;right:0;top:0;bottom:0;transform:none;width:auto;max-width:none;max-height:none;border:0;border-radius:0;outline:0;background-color:#46689f;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.06) 0 12px,rgba(0,0,0,.05) 12px 24px),repeating-linear-gradient(-45deg,rgba(255,255,255,.06) 0 12px,rgba(0,0,0,.05) 12px 24px)}
.menu.plate-full .menu-title{background:linear-gradient(#33549c,#223c78);color:#fff;border-bottom:2px solid #dfe7f5}
.menu.plate-full .menu-list{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;padding:10px;align-content:start}
.menu.plate-full .menu-row{background:var(--paper);border:2px solid var(--frame);border-radius:3px;border-bottom:2px solid var(--frame);min-height:76px;padding:8px 10px;min-width:0;overflow:hidden}
.menu.plate-full .phpbar{width:48px}
.menu.plate-full .picon{width:44px;height:44px;background:rgba(255,255,255,.7)}
.menu.plate-full .pball{width:22px;height:22px;flex:none;image-rendering:pixelated}
.menu.plate-full .menu-row.disabled{background:#aebadd;border:2px solid var(--frame);border-radius:3px;color:#4a5878;font-style:normal}
.menu.plate-full .menu-row.disabled .pball{opacity:.45}
.menu.plate-full .emptyslot{font-style:normal;letter-spacing:.5px}
.menu.plate-full .menu-row.cursor{background:var(--sky)}
.menu.plate-full .menu-row.close-row{grid-column:1/-1;justify-content:center;font-weight:bold}
@media (max-width:560px){.menu.plate-full .menu-list{grid-template-columns:1fr;gap:5px;padding:6px}
.menu.plate-full .menu-row{min-height:54px;padding:4px 8px}
.menu.plate-full .picon{width:36px;height:36px}
.menu.plate-full .pball{width:18px;height:18px}
.menu.plate-full .menu-row.close-row{min-height:40px}}
/* bag window (UI v2.4, defect 3): ONE bag component for pause + battle —
   a framed Platinum window whose pockets are a real TAB STRIP (.bagtab
   row rendered by UI.renderMenu when menu.bagTabs is set), never the old
   full-width gradient section bars (the v2.3 bandrow, removed). Only the
   active pocket's rows show; item rows are flat framed plates with icons. */
.menu.bagwin{background-color:var(--paper);background-image:var(--rivets)}
.menu.bagwin .menu-row{border:2px solid var(--frame);border-radius:3px;background:#fff;margin-bottom:4px}
.menu.bagwin .menu-row.cursor{background:var(--sky)}
.menu.bagwin .menu-row.disabled{border-color:#9aa7c4;background:#e8edf6}
.menu.bagwin .menu-row.baghidden{display:none}
.bagtab{display:flex;gap:4px;padding:8px 8px 0}
.bagtab-btn{flex:1;font-family:var(--font);font-size:14px;font-weight:bold;letter-spacing:.5px;padding:8px 2px;min-height:40px;background:#d7e1f2;color:#4a5878;border:2px solid var(--frame);border-bottom:0;border-radius:6px 6px 0 0;cursor:pointer;text-transform:capitalize}
.bagtab-btn.sel{background:#fff;color:var(--ink);border-top:3px solid var(--gold)}
/* PC box (Platinum): wallpaper-striped window, sprite-cell grid */
.menu.pcbox{background-color:#cfdcf5;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 16px,rgba(46,74,143,.07) 16px 32px),repeating-linear-gradient(-45deg,rgba(255,255,255,.22) 0 16px,rgba(46,74,143,.05) 16px 32px)}
.menu.pcbox .menu-list{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.menu.pcbox .menu-row{flex-direction:column;justify-content:center;text-align:center;background:rgba(246,248,252,.94);border:2px solid var(--frame);border-radius:3px;outline:1px solid var(--frame2);outline-offset:-4px}
.menu.pcbox .menu-row.wide{grid-column:1/-1;flex-direction:row}
@media (max-width:560px){.menu.pcbox .menu-list{grid-template-columns:repeat(2,1fr)}}
/* PC box panel (UI v2.4, defect 4): the box as a real screen — wallpaper
   checker field, a 6x5 slot GRID that renders even when empty, the party
   strip alongside, and a framed info window. Replaces the list-modal PC
   flow (the .menu.pcbox rules above now serve only the Link Transfer menu). */
.pcpanel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,96%);max-height:94%;overflow:auto;background-color:#cfdcf5;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 16px,rgba(46,74,143,.07) 16px 32px),repeating-linear-gradient(-45deg,rgba(255,255,255,.22) 0 16px,rgba(46,74,143,.05) 16px 32px);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35);z-index:26;padding:10px}
.pchead{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.pctitle{flex:1;text-align:center;font-family:var(--font-display);font-size:15px;font-weight:bold;letter-spacing:1px;color:var(--ink);background:var(--paper);border:2px solid var(--frame);border-radius:3px;padding:7px 6px}
.pcnav{width:44px;min-height:40px;font-family:var(--font);font-size:14px;font-weight:bold;background:#fff;color:var(--ink);border:2px solid var(--frame);border-radius:3px;cursor:pointer}
.pcmain{display:flex;gap:10px}
.pcgrid{flex:1;display:grid;grid-template-columns:repeat(6,1fr);gap:5px;align-content:start}
.pccell{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:52px;padding:3px 1px;background:rgba(246,248,252,.94);border:2px solid var(--frame);border-radius:3px;cursor:pointer;font-family:var(--font)}
.pccell.empty{background:rgba(246,248,252,.45);border-color:#7c8db1}
.pccell.cursor{outline:3px solid var(--navy);outline-offset:-3px;background:#fff}
.pccell.heldsrc{opacity:.45}
.pccell img{width:30px;height:30px;object-fit:contain;image-rendering:pixelated}
.pclv{font-size:15px;font-weight:bold;color:#3c4a6a;line-height:1}
.pcside{width:176px;flex:none;display:flex;flex-direction:column;gap:6px}
.pcpartyhd{font-family:var(--font-display);font-size:14px;font-weight:bold;letter-spacing:2px;color:var(--ink)}
.pcparty{display:flex;flex-direction:column;gap:4px}
.pcpslot{display:flex;align-items:center;gap:6px;min-height:34px;padding:2px 6px;background:rgba(246,248,252,.94);border:2px solid var(--frame);border-radius:3px;cursor:pointer;font-family:var(--font);font-size:15px;font-weight:bold;color:var(--ink);text-align:left}
.pcpslot.empty{background:rgba(246,248,252,.45);border-color:#7c8db1;color:#5a6a8f}
.pcpslot.cursor{outline:3px solid var(--navy);outline-offset:-3px;background:#fff}
.pcpslot.heldsrc{opacity:.45}
.pcpslot img{width:24px;height:24px;object-fit:contain;image-rendering:pixelated}
.pcinfo{min-height:64px;background:var(--paper);border:2px solid var(--frame);border-radius:3px;padding:7px 8px;font-size:16px;font-weight:700;line-height:1.45;color:var(--ink);-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.pclink{font-family:var(--font);font-size:14px;font-weight:bold;padding:9px 6px;min-height:42px;background:#fff;color:var(--ink);border:2px solid var(--frame);border-radius:3px;cursor:pointer}
.pcfoot{margin-top:8px;font-size:15px;color:#3c4a6a;text-align:center}
@media (max-width:560px){.pcmain{flex-direction:column}.pcside{width:auto}.pcparty{flex-direction:row;flex-wrap:wrap}.pcpslot{flex:1 1 30%}.pccell{min-height:44px}.pccell img{width:24px;height:24px}}
/* summary panel (Platinum tabbed summary: INFO / STATUS / MOVES) */
.sumpanel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94%);max-height:92%;overflow:auto;background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35);z-index:26}
.sumtabs{display:flex;gap:6px;padding:10px 10px 0}
.sumtab{flex:1;font-family:inherit;font-size:14px;font-weight:bold;letter-spacing:1px;padding:10px 4px;min-height:48px;background:linear-gradient(#e3ebfa,#b9c9e8);color:var(--ink);border:2px solid var(--frame);border-radius:6px;cursor:pointer}
.sumtab.sel{background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff}
.sumbody{padding:12px 14px 14px}
.sumhead{display:flex;gap:12px;align-items:center;margin-bottom:8px}
.sumsprite{width:96px;height:96px;flex:none;object-fit:contain;image-rendering:pixelated;background:#dfe7f5;border:2px solid var(--frame);border-radius:6px}
.sumname{font-family:var(--font-display);font-size:18px;font-weight:bold;color:var(--ink)}
.sumsub{font-size:15px;color:#4a5878;margin-top:2px}
.sumrow{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #ccd6ea;padding:7px 2px;font-size:16px;color:var(--ink)}
.sumrow b{font-weight:bold}
.sumflavor{font-size:16px;font-weight:700;line-height:1.5;color:#3c4a6a;padding:8px 2px;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.sum-move{display:flex;flex-direction:column;gap:2px;border:2px solid #ccd6ea;border-radius:6px;padding:8px 10px;margin-bottom:6px;background:#fff}
.sum-mvname{font-weight:bold;font-size:15px;color:var(--ink)}
.sum-mvmeta{font-size:15px;color:#4a5878}
.sumclose{width:100%;font-family:inherit;font-size:15px;font-weight:bold;padding:12px;min-height:48px;margin-top:8px;background:linear-gradient(#e3ebfa,#b9c9e8);color:var(--ink);border:2px solid var(--frame);border-radius:6px;cursor:pointer}
/* dex entry panel (Elevation B5): the summary plate's sibling — one
   entry, paged in place with ◀ ▶ in its silver-blue head band. */
.entrypanel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94%);max-height:92%;overflow:auto;background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35);z-index:26}
.entryhead{font-family:var(--font-display);background:#d7e1f2;color:var(--ink);font-size:15px;font-weight:bold;letter-spacing:1px;padding:10px 12px;border-bottom:2px solid var(--frame);text-align:center;cursor:pointer}
.entrybody{padding:12px 14px 14px}
/* KinDex list plates (W14-T1): species rows are plate-full — the sprite
   sits on its own framed plate at exactly 64x64, the native battle-art
   canvas at 1x (B2-G5 integer scale; the entry panel's 96px/1.5x is not
   repeated here). Hub rows keep the plain renderer and take the
   silver-blue band treatment in place. No dex element is positioned:
   the list stays inside the centered .menu overlay geometry. */
.menu.dexlist .menu-row.disabled{background:#d7e1f2;border-bottom:2px solid var(--frame);font-style:normal;color:var(--ink)}
.menu.dexlist .menu-row:has(.dexplate){padding-top:8px;padding-bottom:8px}
.dexplate{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.dexcell{width:64px;height:64px;flex:none;display:flex;align-items:center;justify-content:center;background:#dfe7f5;border:2px solid var(--frame);border-radius:3px;overflow:hidden}
.dexsprite{width:64px;height:64px;object-fit:contain;image-rendering:pixelated}
.dexcell-empty{background:#e8edf6;border-color:#9aa7c4;color:#8a93a8;font-weight:bold;letter-spacing:1px}
.dexmain{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.dexl1{display:flex;gap:8px;align-items:baseline}
.dexno{font-family:var(--font-display);font-size:15px;color:#4a5878}
.dexname{font-family:var(--font-display);font-size:16px;font-weight:bold;color:var(--ink);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dexl2{font-size:15px;color:#4a5878;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dexstate{flex:none;font-size:14px;font-weight:bold;letter-spacing:1px;padding:3px 8px;background:#fff;color:#4a5878;border:2px solid var(--frame);border-radius:3px}
.dexstate.is-caught{background:var(--lcd);color:var(--lcdink);border-color:#46543a}
.dexstate.is-unseen{background:#e8edf6;color:#8a93a8;border-color:#9aa7c4}
/* Narrow menu boxes (the shell's own 560px breakpoint, as
   .menu.plate-full — plus short landscape viewports, whose letterboxed
   view box is just as narrow): the plate row reflows to a grid — the
   plate still spans exactly 64x64 at 1x; name/types take the first row
   beside it and the state chip drops to a second row under them, so
   nothing overlaps or truncates at 390/360px or 844x390. */
@media (max-width:560px),(max-height:500px){.dexplate{display:grid;grid-template-columns:64px minmax(0,1fr);grid-template-rows:auto auto;column-gap:10px;row-gap:2px}
.dexcell{grid-row:1/3}
.dexmain{grid-column:2;grid-row:1}
.dexstate{grid-column:2;grid-row:2;justify-self:start}}
/* Hall of Fame + Diploma ceremony plates (Elevation B2): flat paper
   plates with a gold trim — no gradients. */
.hofplate{border:3px solid var(--gold);background:#fdfdff;border-radius:3px;padding:12px}
.hoftitle{font-family:var(--font-display);font-size:18px;font-weight:bold;letter-spacing:2px;text-align:center;color:var(--ink);margin-bottom:10px}
.hofentry{border-top:2px solid var(--frame);padding:8px 0 2px;margin-top:8px}
.hofhead2{font-size:15px;font-weight:bold;color:#4a5878;margin-bottom:6px}
.hofteam{display:flex;flex-wrap:wrap;gap:8px}
.hofmon{display:flex;flex-direction:column;align-items:center;width:88px;text-align:center}
.hofsprite{width:44px;height:44px}
.hofname{font-size:15px;font-weight:bold;color:var(--ink);line-height:1.2;word-break:break-word}
.hofsub{font-size:15px;color:#4a5878;line-height:1.2}
.diploma{border:3px solid var(--gold);background:#fdfdff;border-radius:3px;padding:20px 14px;text-align:center}
.diplomatitle{font-family:var(--font-display);font-size:18px;font-weight:bold;letter-spacing:2px;color:var(--ink);margin-bottom:12px}
.diplomabody{font-size:16px;font-weight:700;line-height:1.5;color:#3c4a6a;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px;margin-bottom:8px}
/* graphical Town Map panel (Elevation B1): a Platinum window hosting
   the canvas map, its DOM narration plate and a hint footer. */
.mappanel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94%);max-height:94%;overflow:auto;background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35);z-index:26;padding:10px}
.maptitle{font-family:var(--font-display);font-size:15px;font-weight:bold;letter-spacing:1px;color:var(--ink);background:#d7e1f2;border:2px solid var(--frame);border-radius:3px;padding:7px 6px;text-align:center;margin-bottom:8px}
.mapcanvas{display:block;width:100%;height:auto;image-rendering:pixelated;border:2px solid var(--frame);border-radius:3px;background:#5a9ae8;cursor:pointer}
.mapnarr{margin-top:8px;background:#fff;border:2px solid var(--frame);border-radius:3px;padding:7px 8px;font-size:16px;font-weight:700;line-height:1.45;color:var(--ink);-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.mapfoot{margin-top:6px;font-size:15px;color:#3c4a6a;text-align:center}
.mappanel .sumclose{margin-top:8px}
/* RT touch move pad (Elevation B7): four flat chips in the canvas
   chips' own zone, shown only where the touch controls show. */
.rtmoves{position:absolute;left:2.5%;right:2.5%;bottom:2.5%;display:flex;gap:6px;pointer-events:auto;opacity:var(--ctlop,1)}
.rtmove{flex:1;min-height:44px;padding:6px 4px;background:#2b3040;color:#f6f8fc;border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;font-family:var(--font);font-size:14px;font-weight:bold;letter-spacing:.5px;cursor:pointer;touch-action:none}
.rtmove.cooling{color:#8d9bbf;background:rgba(43,48,64,.6)}
body.desktop .rtmoves{display:none}
body.desktop.showtouch .rtmoves{display:flex}
@media (pointer:coarse){body.desktop .rtmoves{display:flex}}
/* toasts — Platinum mini-frames; HUD toasts in system blue */
.toasts{position:absolute;left:0;right:0;bottom:12px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;pointer-events:none}
.toast{background:var(--paper);color:var(--ink);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;font-size:16px;font-weight:700;line-height:1.4;padding:10px 16px;border-radius:3px;pointer-events:none;max-width:min(520px,92%);text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.35);-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px;animation:toastin .18s steps(3)}
@keyframes toastin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
/* W-UI boot veil: the link's first frame. Covers the bundle's font swap
   (the legal card used to flash in a fallback face) behind the game's own
   window; the shell script hides it once fonts are ready, and this CSS
   animation is a no-JS failsafe that retires it at ~4.2s regardless. */
#bootveil{position:fixed;inset:0;z-index:200;background:#141821;display:flex;align-items:center;justify-content:center;animation:veilhide .5s steps(5) 4.2s forwards}
#bootveil.hide{opacity:0;visibility:hidden;transition:opacity .45s steps(6),visibility 0s linear .45s}
@keyframes veilhide{to{opacity:0;visibility:hidden}}
.veil-plate{background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:26px 38px 20px;text-align:center}
.veil-title{font-family:var(--font-display);font-size:28px;font-weight:bold;letter-spacing:1px;color:var(--navy)}
.veil-rule{height:3px;background:var(--gold);margin:10px 6px 12px}
.veil-sub{font-size:14px;font-weight:bold;letter-spacing:4px;color:var(--lcdink);background:var(--lcd);border:2px solid #46543a;border-radius:2px;padding:3px 10px 3px 14px;display:inline-block}
/* W-UI: thin frame-coloured scrollbars — long menus (main menu, KinDex)
   used to scroll with no visible affordance at all. */
.menu,.sumcols,.pcpanel{scrollbar-width:thin;scrollbar-color:var(--frame2) transparent}
.menu::-webkit-scrollbar,.sumcols::-webkit-scrollbar,.pcpanel::-webkit-scrollbar{width:8px;height:8px}
.menu::-webkit-scrollbar-thumb,.sumcols::-webkit-scrollbar-thumb,.pcpanel::-webkit-scrollbar-thumb{background:var(--frame2);border-radius:4px}
.menu::-webkit-scrollbar-track,.sumcols::-webkit-scrollbar-track,.pcpanel::-webkit-scrollbar-track{background:transparent}
.hudtoast{background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;font-weight:bold}
/* controls — emulator pad in deep navy/silver to sit under the Pt chrome.
   UI v2.5: the pad renders INSIDE #ctlband (page flow), not as a viewport
   overlay. Portrait band = flex rows: [D-pad | ABXY diamond] over a
   centered START/SELECT row; if the row ever gets too narrow the diamond
   wraps whole below the D-pad (still in flow, still disjoint).
   Geometry law: the D-pad is one cross driven by a single 48px unit; the
   ABXY diamond is an ellipse arrangement 3 units wide x 2 units tall
   (56px unit, 11px gutters) whose four boxes are pairwise disjoint by
   construction — X/B separate from A/Y on the horizontal axis, X from B
   on the vertical axis. Landscape: .controls dissolves (display:contents)
   and the clusters become grid items flanking #screenwrap. */
.controls{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:8px 12px;pointer-events:none;opacity:var(--ctlop,1)}
body.flip .controls{flex-direction:row-reverse}
.dpad{position:relative;width:144px;height:144px;flex:none;pointer-events:auto}
.padbtn{position:absolute;width:48px;height:48px;background:#26304d;color:#dfe7f5;border:2px solid #8d9bbf;border-radius:8px;font-family:var(--font);font-size:16px;pointer-events:auto;touch-action:none}
.p-up{left:48px;top:0}.p-down{left:48px;bottom:0}.p-left{left:0;top:48px}.p-right{right:0;top:48px}
.padbtn:active{background:#3c4f7d}
.ab{position:relative;width:178px;height:122px;flex:none;pointer-events:auto}
.abtn{position:absolute;width:56px;height:56px;border-radius:50%;background:#26304d;color:#fff;border:2px solid #8d9bbf;font-family:var(--font);font-size:20px;font-weight:bold;pointer-events:auto;touch-action:none}
.a-x{left:50%;top:0;transform:translateX(-50%)}
.a-a{right:0;top:50%;transform:translateY(-50%)}
.a-b{left:50%;bottom:0;transform:translateX(-50%)}
.a-y{left:0;top:50%;transform:translateY(-50%)}
.abtn:active{background:#c03028}
.sysbtns{position:relative;width:100%;display:flex;gap:8px;justify-content:center;pointer-events:auto}
.sysbtn{background:#26304d;color:#dfe7f5;border:2px solid #8d9bbf;border-radius:14px;font-family:var(--font);font-size:14px;padding:10px 14px;min-height:48px;pointer-events:auto}
body.landscape .controls{display:contents;opacity:1}
body.landscape .dpad{grid-column:1;grid-row:2/4;align-self:center;opacity:var(--ctlop,1)}
body.landscape .ab{grid-column:3;grid-row:2;align-self:center;opacity:var(--ctlop,1)}
body.landscape .sysbtns{grid-column:3;grid-row:3;width:auto;align-self:start;opacity:var(--ctlop,1)}
body.flip.landscape .dpad{grid-column:3}
body.flip.landscape .ab{grid-column:1}
body.flip.landscape .sysbtns{grid-column:1}
/* battle commands — UI v2.2 (defect 3): Platinum's touch-screen layout as a
   framed window in the message-box zone (bottom strip, where the canvas
   message box lives), NOT four free-floating gradient bars. Each command is
   a framed Platinum button: navy frame, ink label, ink icon.
   UI v2.4 (defect 2): the plate interior is FLAT — no gradient anywhere in
   the battle UI (production read the v2.2/v2.3 plate-gradient + full-height
   colour stripe as "wide gradient bars"). Command colour now rides on a
   small square chip at the left, Platinum's flat command plates. */
.cmdpanel{position:absolute;left:2.5%;right:2.5%;bottom:2.5%;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:7px;background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.cmdf{position:relative;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:6px 10px 6px 18px;background-color:#fdfdff;color:var(--ink);border:2px solid var(--frame);border-radius:3px;font-family:var(--font);font-size:15px;font-weight:bold;letter-spacing:1px;cursor:pointer;touch-action:none}
.cmdf::before{content:'';position:absolute;left:7px;top:50%;transform:translateY(-50%);width:10px;height:10px;background:var(--cmdcol,#8d9bbf);border:2px solid var(--frame);border-radius:2px}
.cmdf-fight{--cmdcol:#c93327}
.cmdf-bag{--cmdcol:#dd8a26}
.cmdf-party{--cmdcol:#3d9240}
.cmdf-run{--cmdcol:#3863b4}
.cmdf.cursor{background:var(--sky);outline:2px solid var(--navy);outline-offset:-4px}
.cmdf.disabled{background:#c9d2e4;color:#6a7799}
.cmdf.dimmed{background:#e8edf6;color:#4a5878}
.cmdf.tut-focus{outline:3px solid #58c94f;outline-offset:-3px;animation:cmdfocus 1s infinite}
@keyframes cmdfocus{50%{outline-color:#e8b832}}
.cmdicon{width:24px;height:24px;image-rendering:pixelated}
.cmdlabel{line-height:1;font-weight:700}
@media (max-width:560px){.cmdf{min-height:34px;font-size:14px;padding-left:16px}.cmdicon{width:20px;height:20px}.cmdpanel{gap:4px;padding:5px}}
/* battle menus — UI v2.2 (defect 3): in battle, list menus (moves, bag,
   ball picker) live in the message-box zone as a Platinum window, the way
   Platinum's touch screen hosts them — never a centered floating card over
   the databoxes. The window is bottom-anchored like .dialogue/.cmdpanel,
   capped so it cannot reach the ally databox (ally plate bottom edge sits
   54/192 logical px above the frame bottom; 26% cap keeps clear air). */
.menu.battlewin{left:2.5%;right:2.5%;top:auto;bottom:2.5%;transform:none;width:auto;min-width:0;max-height:25%;background-image:var(--rivets)}
.menu.battlewin .menu-title{display:none}
.menu.battlewin .menu-list{max-height:100%}
/* move menu — Platinum move buttons: framed plate cells in a 2x2 grid,
   name + type pill on the top line, PP + power/acc on the second line */
.menugrid{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px}
.menugrid .menu-row{flex-direction:column;align-items:stretch;min-height:44px;background-color:#fdfdff;border:2px solid var(--frame);border-radius:3px;position:relative;padding:4px 8px}
.menugrid .menu-row.cursor{background:var(--sky);outline:2px solid var(--navy);outline-offset:-2px;border-left-color:var(--frame)}
.menugrid .menu-row.wide{grid-column:1/-1;min-height:28px;flex-direction:row;align-items:center;justify-content:center}
.menugrid .menu-row .cur{display:none}
.mvcell{display:grid;grid-template-columns:1fr auto;align-items:center;column-gap:8px;width:100%;line-height:1.15}
.mvname{font-weight:bold;font-size:14px;grid-column:1}
.mvpp{font-size:15px;color:#4a5878;grid-column:1}
.mvpow{font-size:15px;color:#6a7799;grid-column:2;justify-self:end}
.mvcell .tpill{grid-column:2;grid-row:1;justify-self:end;margin:0}
@media (max-width:560px){.menugrid{gap:3px;padding:2px}.menugrid .menu-row{min-height:32px;padding:1px 6px}.mvpow{display:none}.mvcell{line-height:1.05;column-gap:4px}.menu.battlewin{bottom:1%;left:1%;right:1%;max-height:20%}.menu.battlewin .menu-row{min-height:42px}.mvname{grid-column:1/-1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mvcell .tpill{grid-column:1;grid-row:2;justify-self:start;padding:0 5px}.mvpp{grid-column:2;grid-row:2;white-space:nowrap}}
.tpill{display:inline-block;font-size:14px;font-weight:bold;color:#fff;border:1px solid #232838;border-radius:3px;padding:1px 8px;margin:2px 0;text-shadow:1px 1px 0 rgba(0,0,0,.4)}
.tpill b{font-weight:bold}
.menu-row.zeropp{color:#a0a0a0}
.menu-row.zeropp::after{content:'';position:absolute;left:6px;right:6px;top:50%;height:3px;background:#c03028;transform:rotate(-8deg);border-radius:2px}
.menu-row.tut-focus{outline:3px solid #58c94f;outline-offset:-3px;animation:cmdfocus 1s infinite}
/* name entry — Platinum frames, LCD display inset, key-depth borders */
.nkbover{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;background:rgba(7,10,22,.5);z-index:30}
@media(min-width:700px){.nkbover{align-items:center}}
.namekb{background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:14px;width:100%;max-width:480px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.nkb-title{font-family:var(--font-display);font-size:14px;font-weight:bold;color:var(--ink);margin-bottom:8px}
.nkb-display{font-size:20px;font-weight:bold;color:var(--lcdink);background:#e8efd9;border:2px solid var(--frame);border-radius:6px;padding:8px 10px;margin-bottom:10px;min-height:44px;letter-spacing:2px}
.nkb-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.nkb-key{min-width:44px;min-height:44px;font-family:inherit;font-size:16px;font-weight:bold;background:#eef2fb;color:var(--ink);border:2px solid var(--frame);border-bottom:4px solid var(--frame);border-radius:6px;cursor:pointer;touch-action:none}
.nkb-key:active{background:#d7e2f7}
.nkb-key.sel{background:var(--sky);outline:2px solid var(--navy);outline-offset:-2px}
.nkb-row{display:flex;gap:6px;margin-top:6px}
.nkb-key.wide{flex:1;font-size:14px}
.nkb-key.go{background:linear-gradient(#6cc46a,#3d9240);color:#fff}
.shake{animation:nkbshake .3s}
@keyframes nkbshake{25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-4px)}}
/* Trainer ID Terminal — Platinum frame card, system-blue head */
.loginover{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;background:rgba(7,10,22,.82);z-index:40}
.login{background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:0;width:min(420px,92vw);box-shadow:0 4px 18px rgba(0,0,0,.35);overflow:hidden}
.login-head{font-family:var(--font-display);background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;font-size:15px;font-weight:bold;padding:10px 14px;letter-spacing:1px}
.login-tabs{display:flex}
.logintab{flex:1;font-family:inherit;font-size:14px;font-weight:bold;padding:12px 4px;min-height:48px;background:linear-gradient(#e3ebfa,#b9c9e8);color:#4a5878;border:0;border-bottom:3px solid transparent;cursor:pointer}
.logintab.sel{background:var(--paper);color:var(--ink);border-bottom-color:var(--navy)}
.loginpane{padding:16px 14px;display:flex;flex-direction:column;gap:10px}
.login-note{font-size:16px;font-weight:700;line-height:1.5;color:#3c4a6a;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.loginpane label{font-size:15px;color:#4a5878;display:flex;flex-direction:column;gap:4px}
.login-in{font-family:inherit;font-size:15px;padding:10px;background:#eef2fb;color:#6a7799;border:2px solid var(--frame);border-radius:6px}
.login-go{font-family:inherit;font-size:15px;font-weight:bold;padding:12px;min-height:48px;border-radius:6px;border:2px solid var(--frame);background:#ccd6ea;color:#6a7799;cursor:not-allowed}
.login-go.active{background:linear-gradient(#6cc46a,#3d9240);border-color:var(--frame);color:#fff;cursor:pointer}
/* guest banner — RETIRED in UI v2.1 (defect 2): the element is built for
   API compatibility (AUTH.enhanceGuestBanner) but never unhidden; the
   guest notice lives in the Trainer ID Terminal's guest pane. */
.guestbanner{position:absolute;top:0;left:0;right:0;min-height:32px;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;font-size:14px;pointer-events:auto;z-index:20;border-bottom:3px solid var(--gold)}
.gbx{background:none;border:0;color:#ffe9a8;font-family:inherit;font-size:14px;min-width:48px;min-height:32px;cursor:pointer}
/* HUD — Platinum restraint: one small framed location window, a quiet
   objective frame, and the dex count as a Poketch-style LCD readout. */
.hudchips{position:absolute;top:8px;left:8px;display:flex;flex-direction:column;gap:6px;z-index:14;pointer-events:none;max-width:calc(100% - 296px)}
.hudchip{pointer-events:none}
.locchip{align-self:flex-start;max-width:100%;background-color:var(--paper);background-image:var(--rivets);color:var(--ink);font-size:14px;font-weight:bold;letter-spacing:.4px;padding:6px 12px;border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.objchip{background-color:var(--paper);background-image:var(--rivets);color:var(--ink);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:7px 12px;max-width:min(300px,100%)}
.obj-kicker{display:block;font-family:var(--font-display);font-size:14px;font-weight:bold;letter-spacing:2px;color:var(--navy);margin-bottom:2px;white-space:nowrap}
.obj-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:16px;font-weight:700;line-height:1.4;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.dexchip{align-self:flex-start;background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:4px}
.dexchip-text{display:block;background:var(--lcd);color:var(--lcdink);font-size:14px;font-weight:bold;letter-spacing:1px;padding:2px 8px;border:2px solid #46543a;border-radius:2px;white-space:nowrap}
.nohud .hudchips{display:none}
.nohud .moodpip,.nohud .hintcard{display:none}
body.menu-full .hudchips,body.menu-full .hudstrip,body.menu-full .moodpip,body.menu-full .syncdot{display:none}
.inbattle .hudchips{display:none}
@media (max-width:560px){.hudchips{top:84px;max-width:calc(100% - 72px)}.objchip{max-width:min(300px,100%)}}
/* HUD quick-strip — one light Platinum frame rail with the 4 buttons.
   UI v2.5 QA D-1: the strip is width-capped to the frame and its buttons
   may flex-shrink, so when a very short viewport snaps the canvas down
   to 256px the strip compresses inside the frame instead of overhanging
   its left edge. No-op at normal frame sizes (strip is 272px natural). */
.hudstrip{position:absolute;top:8px;right:8px;display:flex;gap:0;max-width:calc(100% - 16px);pointer-events:auto;z-index:15;background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:4px 6px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
.nohud .hudstrip{display:none}
.inbattle .hudstrip{display:none}
.inbattle .hintcard{display:none}
.hudbtn{position:relative;width:64px;min-width:0;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:transparent;border:0;border-left:1px solid #ccd6ea;border-radius:0;cursor:pointer;touch-action:none;font-family:var(--font)}
.hudbtn:first-child{border-left:0}
.hudbtn:active{background:var(--sky)}
.hudicon{width:24px;height:24px;image-rendering:pixelated}
.hudlabel{font-size:14px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--ink);font-family:var(--font)}
.dexdot{position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#e84040;border:1px solid #fff}
/* partner mood pip — framed round button in the right rail */
.moodpip{position:absolute;right:8px;top:88px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--paper);border:2px solid var(--frame);border-radius:50%;cursor:pointer;pointer-events:auto;z-index:15;touch-action:none}
body.landscape .moodpip{display:none}
.moodface{width:24px;height:24px;image-rendering:pixelated}
.mooddot{position:absolute;bottom:2px;right:2px;width:10px;height:10px;border-radius:50%;background:#58c94f;border:1px solid #fff}
/* party row HP mini-bars + status chips + partner badge */
.phpbar{display:inline-block;width:64px;height:8px;background:#2b3040;border-radius:3px;vertical-align:middle;margin:0 6px;overflow:hidden}
.phpbar i{display:block;height:100%}
.pstat{font-size:14px;font-weight:bold;color:#a040a0;margin-left:6px}
.pbadge{display:inline-block;background:var(--gold);color:var(--ink);font-size:14px;font-weight:bold;letter-spacing:1px;padding:1px 8px;border:2px solid var(--frame);border-radius:4px;margin-left:6px;vertical-align:middle}
.hudstrip{transform:scale(var(--hudscale,1));transform-origin:top right}
/* UI v2.5: the landscape right-edge rail is retired — it rendered ON the
   canvas. Landscape now uses the portrait form (in-frame, top-right,
   horizontal), inside the frame bounds and clear of the dialogue zone. */
/* UI v2.6 (Wave CAM): band context — inside #hudband the chips column,
   quick-strip and mood pip are in-flow flex items, not frame overlays,
   so their base top/left/right anchors are inert. The chips column
   pushes the strip + pip to the band's right edge via margin-right:auto.
   .nohud/.inbattle live on the #ui root (not a band ancestor), so
   ui.mjs mirrors both classes onto the band and these rules hide the
   HUD in the band exactly as the frame rules hide it in-frame. */
/* W-UI: the chips column used to shrink-wrap to the location chip, so the
   OBJECTIVE kicker (~130px) spilled past the objective chip's border on
   desktop and the chip collapsed to an unreadable sliver at portrait.
   A floor under the column + a full-width objective chip fixes both. */
#hudband .hudchips{position:static;max-width:44%;min-width:184px;margin-right:auto}
#hudband .objchip{max-width:300px}
#hudband .hudstrip{position:static}
#hudband .moodpip{position:static;flex:0 0 auto}
/* UI v2.7 (Wave W8-F1): landscape band geometry. The chips COLUMN is
   ~183px tall (loc + 2-line objective + dex); at 844x390 the stage grid
   then leaves #screenwrap ~197px for a 256px canvas, which overflows
   the wrap symmetrically — up into the column's last chip (the dexchip
   overlap) and ~29px below the fold. So in landscape the band spans
   the stage's full top row (both control flanks start below it, rows
   2/4) and the chips lay out in a ROW: band height becomes the tallest
   chip (~the objective) instead of the stack, the wrap gets >=256px,
   and the canvas sits wholly inside the viewport. The pre-CAM
   landscape hide of the mood pip (it lived on the canvas rail then)
   is lifted in band context — the pip takes its in-flow band seat
   like every other size. */
body.landscape #hudband .hudchips{flex-direction:row;max-width:none}
body.landscape #hudband .locchip,body.landscape #hudband .dexchip{flex:none}
body.landscape #hudband .objchip{flex:0 1 auto;min-width:0}
body.landscape #hudband .moodpip{display:flex}
#hudband.nohud .hudchips,#hudband.nohud .hudstrip,#hudband.nohud .moodpip{display:none}
#hudband.inbattle .hudchips,#hudband.inbattle .hudstrip{display:none}
/* desktop keyboard-hint card — Platinum mini-frame */
.hintcard{position:absolute;left:50%;transform:translateX(-50%);bottom:8px;display:flex;align-items:center;gap:10px;background-color:var(--paper);background-image:var(--rivets);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;color:var(--ink);font-family:var(--font);font-size:16px;font-weight:700;padding:8px 8px 8px 16px;pointer-events:auto;z-index:25;max-width:92vw;box-shadow:0 4px 18px rgba(0,0,0,.35);-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.hintcard-x{background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;border:2px solid var(--frame);border-radius:6px;font-size:14px;font-weight:bold;font-family:inherit;padding:8px 12px;min-height:48px;cursor:pointer;white-space:nowrap}
body.desktop .controls{display:none}
/* chapter title card — Platinum frame, navy kicker, red continue hint */
.chaptercard{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(440px,92%);background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;box-shadow:0 4px 18px rgba(0,0,0,.35);padding:18px 16px 14px;text-align:center;pointer-events:auto;z-index:35}
.cc-kicker{font-family:var(--font-display);font-size:14px;font-weight:bold;letter-spacing:3px;color:var(--navy);margin-bottom:8px}
.cc-title{font-family:var(--font-display);font-size:22px;font-weight:bold;color:var(--ink);margin-bottom:8px;line-height:1.2}
.cc-arc{font-size:17px;font-weight:700;color:#3c4a6a;margin-bottom:6px;line-height:1.4;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.cc-anime{font-size:16px;font-weight:700;color:#6a7799;line-height:1.4;margin-bottom:4px;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.cc-hint{font-size:16px;font-weight:700;color:var(--red);margin-top:10px;animation:blink 1s infinite;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
/* W10 cutscene panel — the chapter card's frame idiom carrying art:
   128x80 panel rasterized at 2x integer scale, letterboxed on paper */
.panelcard{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,92%);background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;box-shadow:0 4px 18px rgba(0,0,0,.35);padding:10px;text-align:center;pointer-events:auto;z-index:36}
.panelcard canvas{display:block;width:100%;height:auto;image-rendering:pixelated}
.panel-hint{font-size:16px;font-weight:700;color:var(--red);margin-top:8px;animation:blink 1s infinite;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
body.desktop.showtouch .controls{display:flex}
@media (pointer:coarse){body.desktop .controls{display:flex}}
/* Track B auth — Platinum frame card, system-blue head, silver tabs.
   Structure and behavior untouched; presentation only. */
.authcard{background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-5px;border-radius:3px;padding:0;width:min(440px,94vw);max-height:92dvh;display:flex;flex-direction:column;box-shadow:0 4px 18px rgba(0,0,0,.35);overflow:hidden}
.authhead{font-family:var(--font-display);background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;font-size:16px;font-weight:bold;padding:10px 14px;letter-spacing:1px;display:flex;align-items:center;justify-content:space-between}
.authx{background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.65);color:#fff;border-radius:4px;font:inherit;font-size:14px;line-height:1;padding:5px 9px;cursor:pointer}
.authx:hover{background:rgba(255,255,255,.3)}
.authsub{font-size:16px;font-weight:700;color:#3c4a6a;padding:8px 14px 0;line-height:1.45;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.authtabs{display:flex;border-bottom:2px solid var(--frame)}
.authtab{flex:1;font-family:inherit;font-size:15px;font-weight:bold;padding:12px 4px;min-height:48px;background:linear-gradient(#e3ebfa,#b9c9e8);color:#4a5878;border:0;border-right:2px solid var(--frame);cursor:pointer}
.authtab:last-child{border-right:0}
.authtab.sel{background:var(--paper);color:var(--ink);border-top:3px solid var(--gold);padding-top:9px}
.authtab:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.authpane{padding:14px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.authfield{display:flex;flex-direction:column;gap:4px;font-size:15px;font-weight:bold;color:var(--ink)}
.authin{font-family:inherit;font-size:16px;padding:10px;min-height:48px;background:#fff;color:var(--ink);border:2px solid var(--frame);border-radius:6px}
.authin:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.authin:disabled{background:#e6ebf6;color:#8a93a8}
.authrow{display:flex;gap:8px;align-items:stretch}
.authshow{min-width:48px;min-height:48px;font-family:inherit;font-size:14px;font-weight:bold;background:#e3ebfa;color:var(--ink);border:2px solid var(--frame);border-radius:6px;cursor:pointer}
.authgo{font-family:inherit;font-size:16px;font-weight:bold;padding:12px;min-height:52px;border-radius:6px;border:2px solid var(--frame);background:linear-gradient(#6cc46a,#3d9240);color:#fff;cursor:pointer}
.authgo:disabled{background:#b9c2d4;color:#6a7799;cursor:not-allowed}
.authgo.sec{background:linear-gradient(#4a7dd0,#2a4d9c)}
.authgo.ghost{background:var(--paper);color:var(--ink)}
.authgo:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.autherr{background:#fdecea;border:2px solid #C0392B;color:#C0392B;font-size:15px;font-weight:bold;padding:8px 10px;border-radius:6px;line-height:1.4}
.authhint{font-size:16px;font-weight:700;color:#4a5878;line-height:1.4;-webkit-text-stroke:.8px currentColor;letter-spacing:-.3px}
.authhint.ok{color:#1e7a38;font-weight:bold}
.authcheck{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:var(--ink);line-height:1.4;cursor:pointer}
.authcheck input{width:24px;height:24px;min-width:24px;margin-top:2px;accent-color:#2B6CB0}
.authlink{background:none;border:0;color:#2B6CB0;font-size:15px;font-weight:bold;text-decoration:underline;cursor:pointer;min-height:48px;text-align:left;font-family:inherit;padding:0}
.authlink:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.authcodes{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#232838;border-radius:8px;padding:12px}
.authcode{font-family:'PtPixel',monospace;font-size:18px;font-weight:bold;color:#FFD23F;text-align:center;padding:8px 4px;border:2px dashed #5a6a8f;border-radius:6px;letter-spacing:1px}
.authwarn{background:#FFF3CD;border:2px solid #D99A26;color:#7a4d00;font-size:15px;font-weight:bold;padding:8px 10px;border-radius:6px;line-height:1.4}
.authscroll{background:#fff;border:2px solid var(--frame);border-radius:6px;padding:10px 12px;font-size:15px;line-height:1.5;color:var(--ink);max-height:220px;overflow-y:auto;white-space:pre-wrap}
.authscroll h4{font-size:15px;margin:8px 0 4px}
.authdraft{background:#232838;color:#FFD23F;font-size:14px;font-weight:bold;padding:6px 10px;border-radius:6px}
.confcols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.confcol{background:#fff;border:2px solid var(--frame);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;font-size:15px;color:var(--ink)}
.confcol h4{font-size:15px;margin:0}
.confcol .pick{margin-top:4px}
.syncdot{position:absolute;top:34px;left:8px;z-index:15;display:flex;align-items:center;gap:6px;background:var(--paper);border:2px solid var(--frame);outline:2px solid var(--frame2);outline-offset:-4px;border-radius:3px;color:var(--ink);font-size:14px;font-family:inherit;padding:6px 10px;pointer-events:none}
.syncdot .sdot{width:10px;height:10px;border-radius:50%;background:#2FA84F}
.syncdot.pending .sdot{background:#D99A26}
.syncdot.offline .sdot{background:#8a93a8}
.banner503{position:absolute;top:0;left:0;right:0;z-index:45;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(#4a7dd0,#2a4d9c);color:#fff;font-size:15px;font-weight:700;padding:10px 12px;border-bottom:3px solid var(--gold);pointer-events:auto;text-align:center}
.banner503 button{background:var(--paper);color:var(--ink);border:2px solid var(--frame);border-radius:6px;font-size:14px;font-family:inherit;padding:8px 12px;min-height:48px;cursor:pointer}
.pwmeter{display:flex;gap:6px;align-items:center;font-size:14px;font-weight:bold;color:#4a5878}
.pwmeter .bar{flex:1;height:10px;background:#e3ebfa;border:2px solid var(--frame);border-radius:5px;overflow:hidden}
.pwmeter .fill{display:block;height:100%;width:0;background:#C0392B}
.pwmeter.fair .fill{width:55%;background:#D99A26}
.pwmeter.strong .fill{width:100%;background:#2FA84F}
@media (prefers-reduced-motion: reduce){
  .loginover *,.authcard *,.banner503 *,.syncdot *,.chaptercard *,.panelcard *,.dialogue *,.hudchips *,.toasts *{animation:none!important;transition:none!important}
}
`;


function shellHtml({ gameJs, inline }) {
  const scriptTag = inline
    ? '<script>\n' + gameJs + '\n</script>'
    : '<script src="game.js"></script>';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
    '<title>KIAN\'S JOURNEY — An Original Kin-Taming Adventure</title>\n' +
    '<meta name="description" content="Kian\'s Journey — an original creature-catching web game. Original code, audio, and creature art; world tiles by Gassasin (CC-BY 3.0), credited in-game.">\n' +
    '<style>' + FONT_FACE_CSS + SHELL_CSS + '</style>\n</head>\n<body>\n' +
    '<div id="bootveil"><div class="veil-plate"><div class="veil-title">KIAN\'S JOURNEY</div><div class="veil-rule"></div><div class="veil-sub">LOADING</div></div></div>\n' +
    '<script>(function(){var v=document.getElementById("bootveil");if(!v)return;var done=false;function hide(){if(done)return;done=true;v.classList.add("hide");setTimeout(function(){if(v.parentNode)v.parentNode.removeChild(v);},700);}function arm(){var t=setTimeout(hide,2500);if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){clearTimeout(t);setTimeout(hide,350);});}}if(document.readyState==="complete")arm();else addEventListener("load",arm);})();</script>\n' +
    '<div id="stage"><div id="hudband"></div><div id="screenwrap"><canvas id="game"></canvas></div><div id="ctlband"></div></div>\n<div id="ui"></div>\n' +
    scriptTag + '\n</body>\n</html>\n';
}

// Command Deck (ADR-023): the owner dashboard page + client, generated for
// the personal target only (the guest standalone stays a single zero-network
// file; the vercel target, which also carried a deck build, was retired
// 2026-11-12). Source lives in src/admin/; the build injects the shared
// @font-face CSS into the page and the edition into the client.
function buildAdminFiles(edition) {
  const dir = path.join(ROOT, 'src', 'admin');
  const html = fs.readFileSync(path.join(dir, 'admin.html'), 'utf8')
    .replace('/*__FONT_FACE_CSS__*/', FONT_FACE_CSS);
  const js = fs.readFileSync(path.join(dir, 'admin.js'), 'utf8')
    .replace("/*__EDITION__*/ 'vercel'", `'${edition}'`);
  return { html, js };
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
  const TARGETS = ['guest', 'personal'];
  const explicit = TARGETS.filter((t) => process.argv.includes('--target=' + t));
  const want = (t) => explicit.length === 0 || explicit.includes(t);
  await validateData();

  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'personal'), { recursive: true });

  let guestJs = null, personalJs = null;

  if (want('guest')) {
    // Bundle A: guest single-file (auth UI compile-time stripped, offline).
    guestJs = buildGameJs({ edition: 'guest' });
    zeroNetworkGate(guestJs, 'guest');
    const ghash = crypto.createHash('sha256').update(guestJs).digest('hex');
    console.log('game.js (guest, auth stripped): ' + guestJs.length + ' bytes, contentHash ' + ghash.slice(0, 16) + '...');
    const standalone = shellHtml({ gameJs: guestJs, inline: true })
      .replace('</body>', '<!-- contentHash:' + ghash + ' -->\n</body>');
    fs.writeFileSync(path.join(ROOT, 'dist', 'standalone.html'), standalone);
    console.log('dist/standalone.html: ' + standalone.length + ' bytes (zero-network gate: PASS)');
  }

  if (want('personal')) {
    // Bundle B (ADR-012): personal edition — the guest auth-strip path, plus
    // the EDITION_MARKER title ribbon. Multi-file layout (index.html + game.js)
    // for static serving. No api/ functions.
    personalJs = buildGameJs({ edition: 'personal' });
    zeroNetworkGate(personalJs, 'personal');
    const phash = crypto.createHash('sha256').update(personalJs).digest('hex');
    console.log('game.js (personal, auth stripped + marker): ' + personalJs.length + ' bytes, contentHash ' + phash.slice(0, 16) + '...');
    fs.writeFileSync(path.join(ROOT, 'personal', 'game.js'), personalJs);
    const personalHtml = shellHtml({ gameJs: null, inline: false })
      .replace('</body>', '<!-- contentHash:' + phash + ' -->\n</body>');
    fs.writeFileSync(path.join(ROOT, 'personal', 'index.html'), personalHtml);
    console.log('personal/game.js + index.html: ' + (personalJs.length + personalHtml.length) + ' bytes (zero-network gate: PASS)');
    const deckP = buildAdminFiles('personal');
    fs.writeFileSync(path.join(ROOT, 'personal', 'admin.html'), deckP.html);
    fs.writeFileSync(path.join(ROOT, 'personal', 'admin.js'), deckP.js);
    console.log('personal/admin.html + admin.js: ' + (deckP.html.length + deckP.js.length) + ' bytes (Command Deck, static)');
  }

  fs.writeFileSync(path.join(ROOT, 'dist', 'content-hash.txt'),
    (guestJs ? 'guest:' + crypto.createHash('sha256').update(guestJs).digest('hex') + '\n' : '') +
    (personalJs ? 'personal:' + crypto.createHash('sha256').update(personalJs).digest('hex') + '\n' : ''));
  console.log('build OK');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error('BUILD FAIL: ' + e.message); process.exit(1); });
