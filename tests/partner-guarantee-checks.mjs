// partner-guarantee-checks.mjs — the PARTNER GUARANTEE hotfix proofs.
// Owner report (live play): "professor gave me no pokemon." Root cause:
// VOLTIK was granted ONLY inside the intro cutscene; UI v2.2 defect 4's
// skip paths once wrote introDone saves with an EMPTY party, no load
// repair existed, and no overworld Hawthorn could hand the partner
// over. The fix has three doors, and each is proven here:
//   A/B: the shared grant core (state.mjs grantPartnerMon) + the
//        save-load repair in fillV2Defaults (schema.mjs, via migrate).
//   C:   every intro path — watched, veteran menu skip, headless skip —
//        still converges on a party holding the partner.
//   D:   the Pallet lab handover in the REAL bundle: Hawthorn hands
//        VOLTIK over only when introDone && partner missing; with the
//        partner present (or pre-intro) he says his ordinary lines.
// Run: node tests/partner-guarantee-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ================= Part A: the grant core =================
const S = await import(join(ROOT, 'src/game/state.mjs'));
const { defaultState, makeMon, grantPartnerMon, hasPartnerMon } = S;
const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { MOVES } = await import(join(ROOT, 'src/data/moves.mjs'));

{
  const st = defaultState();
  ok('A1 fresh state has no partner', hasPartnerMon(st) === false && st.party.length === 0);
  ok('A2 grant lands the partner', grantPartnerMon(st, SPECIES, MOVES) === true
    && st.party.length === 1 && st.party[0].speciesId === 'partner' && st.party[0].level === 5);
  ok('A2 grant writes the intro state (flags + dex)', st.story.flags.metPartner === true
    && st.story.flags.refusedBall === true && st.dex.caught[25] === true && st.dex.seen[25] === true);
  ok('A3 grant is idempotent', grantPartnerMon(st, SPECIES, MOVES) === false && st.party.length === 1);
  const st2 = defaultState();
  st2.party.push(makeMon('bulbasaur', 5, SPECIES, MOVES));
  ok('A4 grant is not blocked by other members (handover semantics)',
    grantPartnerMon(st2, SPECIES, MOVES) === true && st2.party.length === 2 && hasPartnerMon(st2));
}

// ================= Part B: the load repair =================
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const { migrate, validateSave } = SCH;

{
  const stuck = defaultState();
  stuck.story.flags.introDone = true; // defect 4's stranded shape: intro done, party empty
  const healed = migrate(clone(stuck));
  ok('B1 stuck save (introDone, empty party) loads repaired',
    healed.party.length === 1 && healed.party[0].speciesId === 'partner'
    && healed.story.flags.metPartner === true && healed.story.flags.refusedBall === true);
  ok('B1 repaired save passes validation', validateSave(healed).ok === true,
    JSON.stringify(validateSave(healed).errors));
  const twice = migrate(clone(healed));
  ok('B1 repair is idempotent across loads', twice.party.length === 1);

  const progressed = defaultState();
  progressed.story.flags.introDone = true;
  progressed.party.push(makeMon('bulbasaur', 12, SPECIES, MOVES));
  const untouched = migrate(clone(progressed));
  ok('B2 progressed save (other mons, no partner) is NEVER granted a partner',
    untouched.party.length === 1 && untouched.party[0].speciesId === 'bulbasaur' && !hasPartnerMon(untouched));

  const preIntro = defaultState(); // introDone unset, empty party: a brand-new run
  const fresh = migrate(clone(preIntro));
  ok('B3 pre-intro save is not granted anything', fresh.party.length === 0);

  const healthy = defaultState();
  healthy.story.flags.introDone = true;
  grantPartnerMon(healthy, SPECIES, MOVES);
  const again = migrate(clone(healthy));
  ok('B4 healthy save keeps exactly one partner', again.party.length === 1 && hasPartnerMon(again));
}

// ================= Part C: every intro path converges =================
const { IntroScene } = await import(join(ROOT, 'src/game/intro.mjs'));

function stubGame({ headless = true, veteran = false } = {}) {
  const st = defaultState();
  const calls = { started: false, toasts: [] };
  const game = {
    state: st, skipIntroVeteran: veteran,
    ui: {
      headless, log: [], dialogueOpen: false, dlg: null,
      say: (lines, cb) => { if (cb) cb(); },
      showMenu: (prompt, items, cb) => { const skip = items.find((i) => i.value === 'skip'); cb(skip ? 'skip' : items[0].value); },
      showNameEntry: (prompt, dflt, max, cb) => cb(dflt),
      toast: (t) => calls.toasts.push(t), closeDialogue: () => {},
    },
    audio: { playSfx: () => {} },
    input: { isHeld: () => false },
    saveGame: () => {},
    startOverworld: () => { calls.started = true; },
  };
  return { game, st, calls };
}
function runIntro(opts) {
  const { game, st, calls } = stubGame(opts);
  const intro = new IntroScene();
  intro.game = game;
  intro.enter();
  return { st, calls };
}
{
  // The hold-START skip and the veteran offer both converge on
  // finishIntro(); the menu case below drives that exact convergence.
  const watched = runIntro({ headless: true, veteran: false });
  ok('C1 watched intro (headless harness path) ends with the partner',
    watched.st.party.length === 1 && watched.st.party[0].speciesId === 'partner'
    && watched.st.story.flags.introDone === true && watched.calls.started);
  const watchedUi = runIntro({ headless: false, veteran: false });
  ok('C2 watched intro (name + rival entry) ends with the partner',
    watchedUi.st.party.length === 1 && watchedUi.st.party[0].speciesId === 'partner'
    && watchedUi.st.story.flags.introDone === true && watchedUi.calls.started);
  const menuSkip = runIntro({ headless: false, veteran: true });
  ok('C3 veteran menu skip ends with the partner',
    menuSkip.st.party.length === 1 && menuSkip.st.party[0].speciesId === 'partner'
    && menuSkip.st.story.flags.introDone === true && menuSkip.calls.started);
  const headlessSkip = runIntro({ headless: true, veteran: true });
  ok('C4 veteran headless skip ends with the partner',
    headlessSkip.st.party.length === 1 && headlessSkip.st.party[0].speciesId === 'partner'
    && headlessSkip.st.story.flags.introDone === true && headlessSkip.calls.started);
}

// ================= Part D: the lab handover =================
{
  const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
  const hawk = MAPS3.pallet.npcs.find((n) => n.name === 'PROF. HAWTHORN');
  ok('D0 Hawthorn stands at his lab door in the live pallet (maps3)',
    !!hawk && hawk.art === 'hawthorn' && hawk.x === 8 && hawk.y === 4
    && Array.isArray(hawk.dialogue) && hawk.dialogue.length === 2);
  const src = readFileSync(join(ROOT, 'src/data/story-kanto.mjs'), 'utf8');
  const hintLine = src.split('\n').find((l) => l.includes("id: 'q_partner'")) || '';
  ok('D0 q_partner hint tells the truth (start grant + lab fallback)',
    hintLine.includes('start of your journey') && hintLine.includes('lab will set it right')
    && !hintLine.includes('The lab sits at the north edge'));
}

// D1-D3 drive the REAL bundle (verify-slice idiom): boot a Game, install
// a synthetic state, stand below Hawthorn in Pallet, press A, drain.
globalThis.localStorage = (() => {
  const mem = {};
  return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
})();
globalThis.__SEED__ = 20261112;
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
const driver = `
;(function () {
  const R = globalThis.__PG__ = { results: [] };
  function ok(name, cond, extra) { R.results.push({ name, pass: !!cond, extra: extra || '' }); }
  function mkGame(seed) {
    globalThis.__SEED__ = seed;
    var g = new Game(null); g.state.settings.battleStyle = 'classic';
    g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout();
    return g;
  }
  function tk(g, n) { g.loop.stepTicks(n || 2); }
  function pA(g, t) { t = t || 1; for (var i = 0; i < t; i++) { g.input.inject('a'); tk(g, 2); g.input.release('a'); } }
  function talkToHawthorn(g) {
    var ow = g.scenes.top;
    ow.player.tx = 8; ow.player.ty = 5; ow.player.px = 8 * TILE; ow.player.py = 5 * TILE;
    ow.player.fx = 8; ow.player.fy = 5; ow.player.dir = 'up';
    tk(g, 2);
    pA(g, 1);
    var seen = [], n = 0;
    while (g.ui.dialogueOpen && n < 400) {
      if (g.ui.dlg && g.ui.dlg.lines) { var cur = g.ui.dlg.lines[g.ui.dlg.idx]; if (cur && seen[seen.length - 1] !== cur) seen.push(cur); }
      pA(g, 1); n++;
    }
    return seen;
  }
  function palletGame(mutate, seed) {
    var g = mkGame(seed);
    var st = defaultState();
    st.story.position = { map: 'pallet', x: 8, y: 5, dir: 'up' };
    mutate(st);
    g.state = st;
    g.scenes.push(new OverworldScene());
    tk(g, 4);
    return g;
  }
  // D1: the stranded shape — intro done, party empty.
  var g1 = palletGame(function (st) { st.story.flags.introDone = true; }, 9101);
  ok('D1 boots into pallet', g1.scenes.top.mapId === 'pallet');
  var seen1 = talkToHawthorn(g1);
  ok('D1 handover grants the partner', g1.state.party.length === 1 && g1.state.party[0].speciesId === 'partner',
    'party=' + JSON.stringify(g1.state.party.map(function (m) { return m && m.speciesId; })));
  ok('D1 handover plays the mix-up beat', seen1.some(function (l) { return l.indexOf('something has been missing') >= 0; }),
    JSON.stringify(seen1));
  ok('D1 handover writes the intro state', g1.state.story.flags.metPartner === true
    && g1.state.story.flags.refusedBall === true && g1.state.dex.caught[25] === true);
  // D2: partner present — ordinary dialogue, no duplicate.
  var g2 = palletGame(function (st) {
    st.story.flags.introDone = true;
    st.party.push(makeMon('partner', 5, SPECIES, MOVES));
  }, 9102);
  var seen2 = talkToHawthorn(g2);
  ok('D2 with partner: authored dialogue, no handover, no duplicate',
    g2.state.party.length === 1
    && seen2.some(function (l) { return l.indexOf('Out walking the town again') >= 0; })
    && !seen2.some(function (l) { return l.indexOf('something has been missing') >= 0; }),
    JSON.stringify(seen2));
  // D3: pre-intro — no handover either.
  var g3 = palletGame(function (st) {}, 9103);
  var seen3 = talkToHawthorn(g3);
  ok('D3 pre-intro: authored dialogue, party untouched',
    g3.state.party.length === 0
    && seen3.some(function (l) { return l.indexOf('Out walking the town again') >= 0; }),
    JSON.stringify(seen3));
})();
`;
try {
  (0, eval)(buildGameJs() + driver);
  const R = globalThis.__PG__;
  if (!R || !R.results.length) ok('D bundle driver produced results', false, 'no __PG__ results');
  else for (const r of R.results) ok(r.name, r.pass, r.extra);
} catch (e) {
  ok('D bundle driver ran', false, String(e && e.message || e));
}

console.log('\npartner-guarantee: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
