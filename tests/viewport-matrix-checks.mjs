// viewport-matrix-checks.mjs — Wave CAM permanent guard (owner law,
// 2026-11-12): the player's visibility is 16x16 tiles in EVERY
// presentation. Runs the real layout code (Game.applyLayout over the
// built guest bundle, headless eval pattern as in verify-slice) across
// the standard viewport matrix and asserts renderer view == 256x256
// (16 tiles x TILE 16) in every mode, plus the shell structure that
// keeps the HUD off the field (#hudband ahead of #screenwrap, band
// context CSS) in both built shells.
//
// Run: node tests/viewport-matrix-checks.mjs   (exit 1 on any failure)

import { buildGameJs } from '../scripts/build.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ---------- static shell guards (both built targets) ----------
for (const rel of ['dist/standalone.html', 'personal/index.html']) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const bandAt = html.indexOf('id="hudband"'), wrapAt = html.indexOf('id="screenwrap"');
  ok(rel + ': #hudband present ahead of #screenwrap', bandAt >= 0 && wrapAt > bandAt);
  ok(rel + ': band-context CSS (chips/strip/pip in-flow, battle/nohud band hiding)',
    html.includes('#hudband .hudchips{position:static') &&
    html.includes('#hudband .hudstrip{position:static') &&
    html.includes('#hudband.nohud .hudchips') &&
    html.includes('#hudband.inbattle .hudchips'));
}
// Source tripwire: no pre-CAM viewport request may return to the layout code.
const mainSrc = fs.readFileSync(path.join(ROOT, 'src/game/main.mjs'), 'utf8');
ok('src/game/main.mjs: no 384x216 / 256x192 viewport request remains',
  !/resize\(\s*384\s*,\s*216/.test(mainSrc) && !/resize\(\s*256\s*,\s*192/.test(mainSrc));

// ---------- layout matrix over the built bundle ----------
const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
globalThis.__SEED__ = 20261112;

const gameJs = buildGameJs(); // guest bundle — the merged tree as built
const driver = `
;(function () {
  var V = { cases: [] };
  function setViewport(w, h, fine, noMM) {
    globalThis.window = { innerWidth: w, innerHeight: h, addEventListener: function() {} };
    if (!noMM) globalThis.window.matchMedia = function() { return { matches: !!fine }; };
    globalThis.document = {
      body: { classList: { add: function() {}, remove: function() {}, toggle: function() {} } },
      getElementById: function() { return null; },
      addEventListener: function() {}
    };
  }
  function clearViewport() { delete globalThis.window; delete globalThis.document; }
  var g = new Game(null);
  g.ui.init(); g.input.bindKeyboard(); g.buildSprites();
  // headless (no window at all): the test-rig presentation
  clearViewport(); g.applyLayout();
  V.cases.push({ name: 'headless rig', mode: g.layoutMode, vw: g.renderer.viewW, vh: g.renderer.viewH });
  var matrix = [
    ['desktop 1920x1080 fine', 1920, 1080, true, false, 'desktop'],
    ['desktop 1440x900 fine', 1440, 900, true, false, 'desktop'],
    ['desktop 1280x800 no-matchmedia', 1280, 800, false, true, 'desktop'],
    ['tablet 1180x820 coarse-wide', 1180, 820, false, false, 'desktop'],
    ['landscape 844x390 coarse', 844, 390, false, false, 'landscape'],
    ['portrait 390x844 coarse', 390, 844, false, false, 'portrait'],
    ['portrait 320x568 coarse', 320, 568, false, false, 'portrait']
  ];
  for (var i = 0; i < matrix.length; i++) {
    var c = matrix[i];
    setViewport(c[1], c[2], c[3], c[4]);
    g.applyLayout();
    var st = g.renderer.canvas.style;
    V.cases.push({ name: c[0], mode: g.layoutMode, wantMode: c[5],
      vw: g.renderer.viewW, vh: g.renderer.viewH,
      cw: parseFloat(st.width), ch: parseFloat(st.height) });
  }
  clearViewport();
  globalThis.__VM__ = V;
})();
`;
(0, eval)('{ ' + gameJs + '\n' + driver + '\n}');
const V = globalThis.__VM__;
for (const c of V.cases) {
  ok('matrix ' + c.name + ': view == 256x256 (16x16 tiles)',
    c.vw === 256 && c.vh === 256, 'view=' + c.vw + 'x' + c.vh + ' mode=' + c.mode);
  if (c.wantMode) ok('matrix ' + c.name + ': mode == ' + c.wantMode, c.mode === c.wantMode, 'mode=' + c.mode);
  if (c.cw !== undefined) ok('matrix ' + c.name + ': canvas CSS box is square', Math.abs(c.cw - c.ch) < 0.01, c.cw + 'x' + c.ch);
}

console.log('\nviewport-matrix: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
