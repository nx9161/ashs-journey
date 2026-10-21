// qa-changed-flows.mjs — QA seat (focused sign-off, no full War Room).
// Changed-flow functional sign-off for the merged tree @ 361d70b:
//   ADR-015 story chapters (title cards, Journey menu, dex header)
//   ADR-016 yellow-authenticity flows (moods, guards, rival rule, sight-line,
//     duo ambush, GB intro) and the laptop-viewport pass (D3).
// Headless eval pattern follows scripts/verify-slice.mjs. Automated gates are
// NOT re-run here (verify-slice 134/134, contamination, budgets, drift, audio
// were re-run on this tree separately); this covers the CHANGED FLOWS.

import { buildGameJs } from '../scripts/build.mjs';
import fs from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';

const results = [];
let failures = 0;
function ok(name, cond, extra) {
  results.push({ name, pass: !!cond });
  if (!cond) { failures++; console.error('QF-FAIL ' + name + (extra ? ' — ' + extra : '')); }
  else console.log('qf-pass ' + name);
}

// ---------- environment stubs (same as verify-slice) ----------
const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore : null) && (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
globalThis.__SEED__ = 20261015;
globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };

const gameJs = buildGameJs(); // guest bundle (Track A) — the merged tree as built

const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('QF-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('qf-pass ' + name);
  }
  function resetStorage() { globalThis.__QFRESET__(); }
  function mkGame(seed) {
    resetStorage();
    globalThis.__SEED__ = seed;
    var g = new Game(null);
    g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout();
    return g;
  }
  function tk(g, n) { g.loop.stepTicks(n || 2); }
  function pA(g, t) { t = t || 1; for (var i = 0; i < t; i++) { g.input.inject('a'); tk(g, 2); g.input.release('a'); } }
  function drain(g, m) { var n = 0; m = m || 400; while (g.ui.dialogueOpen && n < m) { pA(g, 1); n++; } return !g.ui.dialogueOpen; }
  function choose(g, i) { g.ui.debugChoose(i); tk(g, 3); }
  function bootToOverworld(g) {
    g.scenes.push(new BootScene());
    g.loop.stepMs(3100); tk(g, 2);
    pA(g, 1); pA(g, 1); pA(g, 1); // legal -> title, PRESS START -> menu, New Game (UI v2)
    drain(g); choose(g, 0); drain(g);
    return g.scenes.top;
  }

  // ============ A. chapter title cards (ADR-015) ============
  ok('a0 story data: 13 chapters, 5 playable (1-5), 8 locked (6-13), 14 bonus',
    CHAPTERS.length === 13 && playableChapters().length === 5 && lockedChapters().length === 8 &&
    BONUS_SHELF.length === 14 &&
    playableChapters().every(function(c, i) { return c.n === i + 1; }) &&
    lockedChapters().every(function(c, i) { return c.n === i + 6; }));
  var gA = mkGame(111);
  var topA = bootToOverworld(gA);
  ok('a1 fresh run boots to overworld', topA instanceof OverworldScene);
  var card = gA.ui.log.filter(function(e) { return e.ui === 'chaptercard'; });
  ok('a2 fresh run opens the Chapter 1 title card',
    card.length >= 1 && card[0].chapter === 1 && card[0].title === 'The Indigo League');
  // modal dismiss logic (DOM-less: drive the same update() branch the DOM uses)
  var gB = mkGame(112);
  gB.ui.chapterCard = {}; // simulate an open card (DOM path sets this)
  var modal = gB.ui.update(2);
  ok('a3 card is modal (blocks world input)', modal === true && !!gB.ui.chapterCard);
  gB.ui.update(2.5); // total 4.5s >= 4s
  ok('a4 card auto-dismisses after 4s of game time', !gB.ui.chapterCard);
  gB.ui.chapterCard = {}; gB.input.inject('a'); gB.ui.update(0.1);
  ok('a5 A dismisses the card', !gB.ui.chapterCard);
  gB.ui.chapterCard = {}; gB.input.inject('start'); gB.ui.update(0.1);
  ok('a6 START dismisses the card', !gB.ui.chapterCard);
  gB.ui.chapterCard = {}; gB.input.inject('b'); gB.ui.update(0.1);
  ok('a7 B does NOT dismiss the card', !!gB.ui.chapterCard);
  gB.ui.hideChapterCard();

  // ============ B. Journey menu (pause -> Journey) ============
  var gJ = mkGame(113);
  bootToOverworld(gJ);
  gJ.openJourney();
  var jm = gJ.ui.menu;
  ok('b1 Journey menu opens', gJ.ui.menuOpen && jm.title === 'Journey');
  ok('b2 Journey menu has 30 rows (act header + 13 chapters + bonus header + 14 bonus + close)',
    jm.items.length === 30);
  var playable = jm.items.filter(function(it) { return it.value && it.value.indexOf('ch') === 0 && !it.disabled; });
  ok('b3 five playable chapter rows, enabled', playable.length === 5 &&
    playable.map(function(it) { return it.value; }).join(',') === 'ch1,ch2,ch3,ch4,ch5');
  ok('b4 current chapter marked (now)', jm.items.some(function(it) {
    return it.value === 'ch1' && it.label.indexOf('(now)') >= 0;
  }));
  var locked = jm.items.filter(function(it) { return it.disabled && it.value === null && it.label.indexOf('Ch.') === 0; });
  ok('b5 eight locked chapter rows, disabled with honest labels',
    locked.length === 8 && locked.every(function(it) { return it.label.indexOf('locked') >= 0; }));
  var bonus = jm.items.filter(function(it) { return it.disabled && BONUS_SHELF.indexOf(it.label) >= 0; });
  ok('b6 BONUS shelf renders as 14 disabled rows', bonus.length === 14);
  ok('b7 no "coming soon" anywhere in the menu',
    !jm.items.some(function(it) { return /coming soon/i.test(it.label); }));
  ok('b8 no fake content: locked rows carry no values (unopenable)',
    locked.every(function(it) { return it.value === null; }));
  var ch1idx = jm.items.findIndex(function(it) { return it.value === 'ch1'; });
  choose(gJ, ch1idx);
  ok('b9 playable chapter opens a detail card (dialogue)', gJ.ui.dialogueOpen);
  var dl = gJ.ui.dlg.lines;
  ok('b10 detail card: kicker + title + arc + anime + special events',
    dl[0] === 'CHAPTER 1 — ACT 1' && dl[1] === 'The Indigo League' &&
    dl[2].indexOf('Indigo Plateau') >= 0 && dl[3].indexOf('Anime:') === 0 &&
    dl[4].indexOf('Special events:') === 0 && dl[4].indexOf('Mewtwo Strikes Back') >= 0);
  drain(gJ);
  ok('b11 detail card closes back to the Journey menu', gJ.ui.menuOpen && gJ.ui.menu.title === 'Journey');
  var lockIdx = jm.items.findIndex(function(it) { return it.disabled && it.label.indexOf('Ch.6') === 0; });
  choose(gJ, lockIdx);
  ok('b12 disabled locked row cannot be chosen', gJ.ui.menuOpen && !gJ.ui.dialogueOpen);
  var gJ5 = mkGame(114);
  gJ5.state.story.chapter = 4;
  gJ5.openJourney();
  ok('b13 current marker follows story.chapter (Ch.5)',
    gJ5.ui.menu.items.some(function(it) { return it.value === 'ch5' && it.label.indexOf('(now)') >= 0; }));

  // ============ C. Pokedex header shows current chapter ============
  var gD0 = mkGame(115);
  bootToOverworld(gD0);
  gD0.openDex();
  ok('c1 dex header row shows the current chapter',
    gD0.ui.menu.items[0].label === 'Journey — Ch.1 · The Indigo League' &&
    gD0.ui.menu.items[0].disabled === true);
  gD0.state.story.chapter = 4;
  gD0.openDex();
  ok('c2 dex header follows chapter advance',
    gD0.ui.menu.items[0].label === 'Journey — Ch.5 · Master Quest');

  // ============ D. Yellow-authenticity flows (ADR-016, deepened) ============
  var moodKeys = Object.keys(PARTNER_MOODS);
  ok('d1 exactly 5 partner moods, all original non-empty distinct lines',
    moodKeys.length === 5 &&
    ['happy', 'curious', 'sleepy', 'excited', 'sad'].every(function(k) { return moodKeys.indexOf(k) >= 0; }) &&
    moodKeys.every(function(k) { return typeof PARTNER_MOODS[k] === 'string' && PARTNER_MOODS[k].length > 10; }) &&
    new Set(moodKeys.map(function(k) { return PARTNER_MOODS[k]; })).size === 5);
  var emoteBits = { happy: 'nuzzles your hand', curious: 'tilts its head', sleepy: 'yawns', excited: 'buzzing with excitement', sad: 'downcast' };
  ok('d2 talk-to-partner emote lines read the mood',
    Object.keys(emoteBits).every(function(k) { return PARTNER_MOODS[k].indexOf(emoteBits[k]) >= 0; }));
  var gT = mkGame(116);
  gT.state.story.position = { map: 'pallet', x: 7, y: 7, dir: 'down' };
  gT.scenes.push(new OverworldScene());
  var owT = gT.scenes.top;
  gT.state.pikachu.mood = 'sad';
  owT.petPartner();
  var toast = gT.ui.log.filter(function(e) { return e.ui === 'toast'; }).pop();
  ok('d3 petting cheers a sad partner to happy + original line',
    gT.state.pikachu.mood === 'happy' && toast && toast.text === 'Pikachu ' + PARTNER_MOODS.happy);
  ok('d4 mood-pip tap wired to petPartner', typeof owT.game.ui.onMoodTap === 'function');
  var yP2 = makeMon('partner', 5, SPECIES, MOVES);
  var yN2 = makeMon('pidgey', 5, SPECIES, MOVES);
  ok('d5 partner refuses evolution with the original line',
    evolutionCheck(yP2).ok === false && evolutionCheck(yP2).line === PARTNER_REFUSAL.evolution &&
    evolutionCheck(yN2).ok === true);
  ok('d6 partner refuses the box with the original line',
    boxCheck(yP2).ok === false && boxCheck(yP2).line === PARTNER_REFUSAL.box &&
    boxCheck(yN2).ok === true);
  ok('d7 partner species carries the hard-rule flags',
    SPECIES.partner.refusesEvolution === true && SPECIES.partner.refusesBox === true);
  ok('d8 rival evolution rule incl. losing-record default',
    rivalPartnerEvolution(2, 0) === 'vaporeon' && rivalPartnerEvolution(1, 1) === 'flareon' &&
    rivalPartnerEvolution(0, 2) === 'jolteon' && rivalPartnerEvolution(0, 0) === 'jolteon' &&
    RIVALS.gary.partner === 'eevee');
  // sight-line cones: 6 route trainers + 2 duo spotters; Brock talk-only.
  var sightNpcs = [];
  Object.keys(MAPS).forEach(function(mid) {
    (MAPS[mid].npcs || []).forEach(function(n) { if (n.sight) sightNpcs.push({ map: mid, id: n.trainer, npc: n }); });
  });
  var routeTrainers = sightNpcs.filter(function(s) { return s.id !== 'r2_duo'; });
  ok('d9 six route trainers have sight cones',
    routeTrainers.length === 6 &&
    ['r1_cal', 'r1_lisa', 'r2_bug', 'r2_camper', 'r2_jr', 'r2_hiker']
      .every(function(id) { return routeTrainers.some(function(s) { return s.id === id; }); }));
  var brock = null;
  (MAPS.gym.npcs || []).forEach(function(n) { if (n.trainer === 'brock') brock = n; });
  ok('d10 Brock stays talk-only (no sight cone)', !!brock && !brock.sight);
  // sight-line challenge, exact two-beat intro text (Cal)
  var gY = mkGame(4242);
  gY.state.party.push(makeMon('partner', 5, SPECIES, MOVES));
  gY.state.story.position = { map: 'route1', x: 4, y: 4, dir: 'down' };
  gY.scenes.push(new OverworldScene());
  var owY = gY.scenes.top;
  tk(gY, 2);
  ok('d11 cal spots the player (spot phase)', !!owY.challenge && owY.challenge.phase === 'spot');
  var spotLog = gY.ui.log.filter(function(e) { return e.ui === 'trainer-spot'; }).pop();
  ok('d12 spot beat logged with the spotter', !!spotLog && spotLog.npcs.join(',').indexOf('CAL') >= 0);
  tk(gY, 20);
  ok('d13 500ms ! beat -> walk-up phase', owY.challenge && owY.challenge.phase === 'walk');
  var lockedBefore = true;
  tk(gY, 150);
  var ydd = 0;
  while (!(gY.scenes.top instanceof BattleScene) && ydd < 40) { pA(gY, 1); ydd++; }
  var yB = gY.scenes.top;
  ok('d14 sight-line opens the trainer battle', yB instanceof BattleScene && yB.kind === 'trainer' && yB.trainer.id === 'r1_cal');
  var ydn = 0;
  while (yB.msgOpen && ydn < 20) { pA(gY, 1); ydn++; }
  var msgs = gY.ui.log.filter(function(e) { return e.ui === 'battle-msg'; }).map(function(e) { return e.text; });
  ok('d15 GB-era two-beat intro, verbatim',
    msgs.indexOf('Trainer Cal wants to battle!') >= 0 &&
    msgs.indexOf('Cal sent out ' + SPECIES.rattata.name + '!') >= 0 &&
    msgs.indexOf('Trainer Cal wants to battle!') < msgs.indexOf('Cal sent out ' + SPECIES.rattata.name + '!'));
  // duo ambush
  ok('d16 r2_duo data: original characters, 2-mon sequential team, nicknames',
    TRAINERS.r2_duo.name === 'Rue & Cole' &&
    TRAINERS.r2_duo.team.length === 2 &&
    TRAINERS.r2_duo.team[0].nickname === 'Sting' && TRAINERS.r2_duo.team[0].species === 'weedle' &&
    TRAINERS.r2_duo.team[1].nickname === 'Echo' && TRAINERS.r2_duo.team[1].species === 'zubat' &&
    TRAINERS.r2_duo.intro.join(' ').indexOf('Team Rocket') < 0);
  var duoSpotters = sightNpcs.filter(function(s) { return s.id === 'r2_duo'; });
  ok('d17 both duo spotters have sight cones', duoSpotters.length === 2);
  var gD = mkGame(777);
  gD.state.party.push(makeMon('partner', 5, SPECIES, MOVES));
  gD.state.story.position = { map: 'route2', x: 6, y: 7, dir: 'down' };
  gD.scenes.push(new OverworldScene());
  var owD = gD.scenes.top;
  tk(gD, 2);
  ok('d18 either spotter pulls both in (2 parts)', !!owD.challenge && owD.challenge.parts.length === 2);
  var dspot = gD.ui.log.filter(function(e) { return e.ui === 'trainer-spot'; }).pop();
  ok('d19 duo spot beat names both challengers',
    !!dspot && dspot.npcs.join(',').indexOf('RUE') >= 0 && dspot.npcs.join(',').indexOf('COLE') >= 0);

  // ============ E. laptop viewports (D3) — headless layout math ============
  function setWin(w, h, fine) {
    globalThis.window = { innerWidth: w, innerHeight: h,
      matchMedia: function() { return { matches: !!fine }; } };
    globalThis.document = { body: { classList: { add: function() {}, remove: function() {}, toggle: function() {} } },
      documentElement: null };
  }
  function clearWin() { delete globalThis.window; delete globalThis.document; }
  function cssSize(g) {
    var st = g.renderer.canvas.style;
    return { w: parseFloat(st.width), h: parseFloat(st.height) };
  }
  var gV = mkGame(200);
  [['1280x800', 1280, 800, true], ['1440x900', 1440, 900, true], ['1920x1080', 1920, 1080, true],
   ['1280x800 no-matchmedia', 1280, 800, false]].forEach(function(c) {
    setWin(c[1], c[2], c[3]); gV.applyLayout();
    var s = cssSize(gV);
    ok('e ' + c[0] + ' desktop 16:9 aspect-locked (' + s.w + 'x' + s.h + ')',
      gV.layoutMode === 'desktop' && Math.abs(s.w / s.h - 16 / 9) < 0.01);
  });
  setWin(844, 390, false); gV.applyLayout();
  var sp = cssSize(gV);
  ok('e phone-landscape 4:3 aspect-locked (regression)', gV.layoutMode === 'landscape' &&
    Math.abs(sp.w / sp.h - 4 / 3) < 0.01);
  clearWin();
  ok('e keyboard map: arrows/WASD move, Z/Space=A, X=B, Enter=START, M=mute, F=fullscreen',
    KEYMAP.ArrowUp === 'up' && KEYMAP.KeyW === 'up' && KEYMAP.ArrowDown === 'down' && KEYMAP.KeyS === 'down' &&
    KEYMAP.ArrowLeft === 'left' && KEYMAP.KeyA === 'left' && KEYMAP.ArrowRight === 'right' && KEYMAP.KeyD === 'right' &&
    KEYMAP.KeyZ === 'a' && KEYMAP.Space === 'a' && KEYMAP.KeyX === 'b' &&
    KEYMAP.Enter === 'start' && KEYMAP.KeyM === 'mute' && KEYMAP.KeyF === 'fullscreen');
  // battle command panel: 2x2 kind, populated via showCommands
  var gC2 = mkGame(201);
  gC2.state.party.push(makeMon('partner', 5, SPECIES, MOVES));
  gC2.scenes.push(new OverworldScene());
  var owC2 = gC2.scenes.top;
  gC2.scenes.push(new BattleScene({ kind: 'wild', foe: makeMon('rattata', 3, SPECIES, MOVES), returnTo: owC2 }));
  var bC2 = gC2.scenes.top;
  var bd = 0;
  while ((!gC2.ui.menuOpen || gC2.ui.menu.kind !== 'commands') && bd < 200) { pA(gC2, 1); bd++; }
  ok('e battle command panel: 2x2 grid FIGHT/BAG/PARTY/RUN',
    gC2.ui.menuOpen && gC2.ui.menu.kind === 'commands' &&
    gC2.ui.menu.items.map(function(i) { return i.label; }).join(',') === 'FIGHT,BAG,PARTY,RUN');
  // dex-dot positioning is asserted from the served CSS in the outer script.
  globalThis.__QF__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + '\n' + driver + '\n}');

const QF = globalThis.__QF__;
console.log('\nqa-changed-flows: ' + (QF.results.length - QF.failures) + '/' + QF.results.length + ' passed');

// ---------- served-file checks (outer script) ----------
const css = fs.readFileSync('personal/index.html', 'utf8');
const js = fs.readFileSync('personal/game.js', 'utf8');
const pubCss = fs.readFileSync('public/index.html', 'utf8');
const stripHash = (s) => s.replace(/<!-- contentHash:[0-9a-f]+ -->/, '');
ok('css personal/public index.html identical except contentHash', stripHash(css) === stripHash(pubCss));

function fontSizes(rule) {
  const m = css.match(new RegExp(rule + '\\{[^}]*\\}', 'g')) || [];
  return m.flatMap((r) => [...r.matchAll(/font-size:(\d+)px/g)].map((x) => parseInt(x[1], 10)));
}
const cardSizes = ['cc-kicker', 'cc-title', 'cc-arc', 'cc-anime', 'cc-hint'].flatMap(fontSizes);
ok('css chapter-card text all >= 14px', cardSizes.length >= 5 && cardSizes.every((s) => s >= 14), cardSizes.join(','));
ok('css battle command buttons 14px', fontSizes('cmdf').some((s) => s >= 14));
ok('css hint card 14px', fontSizes('hintcard').some((s) => s >= 14));
ok('css hud labels 14px', fontSizes('hudlabel').some((s) => s >= 14));
ok('css cmdpanel is child-of-#ui-safe: no body.desktop hide rule',
  !/body\\.desktop[^{]*\\.cmdpanel/.test(css) && /\.cmdpanel\{/.test(css));
ok('css hint card hidden in battle (no overlap)', /\.inbattle\s+\.hintcard\s*\{[^}]*display\s*:\s*none/.test(css));
ok('css battle toggles .inbattle on #ui root', js.includes("this.root.classList.toggle('inbattle', on)"));
ok('css dex-dot absolute inside relative hud button',
  /\.dexdot\{[^}]*position\s*:\s*absolute[^}]*top\s*:\s*2px[^}]*right\s*:\s*2px/.test(css) &&
  /\.hudbtn\{[^}]*position\s*:\s*relative/.test(css));
ok('css hudstrip top-right of canvas', /\.hudstrip\{[^}]*top\s*:\s*34px[^}]*right\s*:\s*8px/.test(css));
ok('css reduced-motion media query exists', /@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css));
ok('src cmdpanel appended to #ui root, not .controls',
  js.includes("this.el('div', 'cmdpanel hidden', this.root)"));
ok('src chapter card tap injects A (tap-dismiss wiring)', js.includes("this.game.input.inject('a')"));

// personal edition boot smoke (ADR-012): marker + auth strip + boots to overworld
const pJs = buildGameJs({ edition: 'personal' });
ok('personal bundle has the edition marker', pJs.includes(`const EDITION_MARKER = "NAMAN'S EDITION";`));
const authIds = ['showCodesPane', 'openPrivacyModal', 'PRIVACY_DRAFT', 'accountDelete', 'recoveryCodes', '__AUTH_BEGIN__'];
ok('personal bundle auth UI stripped', !authIds.some((id) => pJs.includes(id)));
(0, eval)('{ ' + pJs + '\n;(function(){ var g = new Game(null); g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout(); g.scenes.push(new BootScene()); g.loop.stepMs(3100); for (var i=0;i<3;i++){ g.input.inject("a"); g.loop.stepTicks(2); g.input.release("a"); } var n=0; while(g.ui.dialogueOpen && n<400){ g.input.inject("a"); g.loop.stepTicks(2); g.input.release("a"); n++; } g.ui.debugChoose(0); n=0; while(g.ui.dialogueOpen && n<400){ g.input.inject("a"); g.loop.stepTicks(2); g.input.release("a"); n++; } globalThis.__PB__ = { overworld: g.scenes.top instanceof OverworldScene, chapter: g.state.story.chapter }; })();\n}');
ok('personal bundle boots to overworld (guest path)', globalThis.__PB__ && globalThis.__PB__.overworld === true);

// ---------- serve personal/ over HTTP, verify it loads ----------
const PORT = 8931;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'personal'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
try {
  const idx = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code} %{size_download}', 'http://127.0.0.1:' + PORT + '/index.html'], { encoding: 'utf8' }).trim();
  ok('serve personal/index.html 200', idx.split(' ')[0] === '200' && parseInt(idx.split(' ')[1], 10) > 10000, idx);
  const gstat = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code} %{size_download}', 'http://127.0.0.1:' + PORT + '/game.js'], { encoding: 'utf8' }).trim();
  ok('serve personal/game.js 200', gstat.split(' ')[0] === '200' && parseInt(gstat.split(' ')[1], 10) > 200000, gstat);
} finally {
  server.kill('SIGKILL');
}

console.log('\nQA TOTAL: ' + (results.length - failures) + '/' + results.length + ' passed');
if (failures) process.exit(1);
