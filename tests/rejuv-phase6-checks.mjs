// rejuv-phase6-checks.mjs — Rejuvenation Phase 6 (ADR-025 §6) proofs:
// Second Journey (New Game+). Part A: pure units — the unlock
// predicate, carry exactness (dex records as archive, honors reading
// the run's OWN catches, keepsake pocket == source collection), the
// never-carry list, source immutability, HoF shape reconciliation
// (canonical {team, badges} + legacy {species, level} + hybrid
// members across client schema and server validator), Traveler's Memory derivation from the
// source's own shipped flags, starter-line derivation, the central
// duplicate-keepsake conversion (+$2,000 + line, no second piece), the
// bond echo (early Warm + the one-time line) and its R3 inertness.
// Part B: the built bundle in a headless Game — title gating (menu
// byte-identical without a completed slot; row appended after Options
// with one), creation end-to-end with the source slot's stored bytes
// untouched, the intro reunion, the HoF viewer's prior-journeys
// section, the diploma gate in the real bundle, the fossil re-pick,
// the hidden-keepsake duplicate, the echo greeting at Mom, the
// Saffron memory line, the Silph Card Key memory line. Part C:
// real-browser smoke.
// Run: node tests/rejuv-phase6-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const S = await import(join(ROOT, 'src/game/state.mjs'));
const { defaultState, dexRegister } = S;
const K = await import(join(ROOT, 'src/game/keepsakes.mjs'));
const B = await import(join(ROOT, 'src/game/bonds.mjs'));
const { BOND_DIALOGUE } = await import(join(ROOT, 'src/data/dialogue.mjs'));
const Q = await import(join(ROOT, 'src/data/quests.mjs'));
const { TRAINERS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

// A completed source run, built the way the shipped game writes one.
function makeSource() {
  const src = defaultState();
  src.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }, { speciesId: 'partner', level: 65, nickname: 'SPARKY' }], badges: 8 }];
  src.dex.caught = { 1: true, 3: true, 25: true, 133: true };
  src.dex.seen = { 1: true, 2: true, 3: true, 25: true, 133: true, 134: true };
  src.dex.befriended = { 25: true };
  src.bag.tortoisecharm = 1; src.bag.sparrowfeather = 1; src.bag.coincase = 1;
  src.party = [{ speciesId: 'charizard', level: 61, keepsake: 'tidepearl' }];
  src.boxes = { box1: [{ speciesId: 'snorlax', level: 50, keepsake: null }] };
  src.player.money = 54321;
  src.badges.kanto = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];
  src.story.flags = { silph_done: true, fossil_taken: true, charmander_joined: true };
  src.story.bonds = { gary: 9, mom: 8, brock: 3 };
  src.meta.ngPlus = 0;
  return src;
}

// -- (a) unlock predicate --
{
  ok('A01 unlock predicate: fresh save is not a completion; own HoF entry completes; regionsDone kanto completes',
    S.isCompletedRun(defaultState()) === false
    && S.isCompletedRun(makeSource()) === true
    && (() => { const s = defaultState(); s.story.regionsDone = ['kanto']; return S.isCompletedRun(s); })() === true);
  ok('A02 inherited entries alone NEVER complete: a save holding only priorHof is not a completed run',
    (() => { const s = defaultState(); s.story.priorHof = [{ team: [{ speciesId: 'mew', level: 70, nickname: null }], badges: 8 }]; return S.isCompletedRun(s); })() === false);
}

// -- (b) carry exactness --
{
  const src = makeSource();
  const ng = defaultState(src);
  ok('A03 dex records carry exactly: caught/seen/befriended land as the archive, unchanged',
    JSON.stringify(ng.dex.caught) === JSON.stringify(src.dex.caught)
    && JSON.stringify(ng.dex.seen) === JSON.stringify(src.dex.seen)
    && JSON.stringify(ng.dex.befriended) === JSON.stringify(src.dex.befriended));
  ok('A04 honors read the run\'s OWN catches: archive full of records, ownCaughtMap empty until this run catches',
    !!ng.dex.runCaught && Object.keys(S.ownCaughtMap(ng.dex)).length === 0
    && (() => { dexRegister(ng.dex, 'caught', 25); return S.ownCaughtMap(ng.dex)[25] === true && ng.dex.caught[25] === true; })());
  ok('A05 non-NG+ runs: ownCaughtMap falls back to dex.caught (the archive IS the run record; Phase-5 B08 shape)',
    (() => { const s = defaultState(); s.dex.caught = { 1: true }; return !('runCaught' in s.dex) && S.ownCaughtMap(s.dex) === s.dex.caught; })());
  ok('A06 keepsake pocket == the source collection exactly (bag-held + mon-held), one piece each',
    JSON.stringify(S.keepsakeCollectionOf(ng).sort()) === JSON.stringify(['sparrowfeather', 'tidepearl', 'tortoisecharm'])
    && ng.bag.tortoisecharm === 1 && ng.bag.sparrowfeather === 1 && ng.bag.tidepearl === 1);
  ok('A07 prior HoF teams land in story.priorHof (canonical); this run\'s own story.hof starts empty',
    ng.story.hof.length === 0 && ng.story.priorHof.length === 1
    && ng.story.priorHof[0].team[0].speciesId === 'venusaur' && ng.story.priorHof[0].badges === 8);
  ok('A08 meta: ngPlus = source + 1, and the chain climbs (a completed NG+1 sources NG+2)',
    ng.meta.ngPlus === 1
    && (() => { const c = JSON.parse(JSON.stringify(ng)); c.story.hof = ng.story.priorHof; return defaultState(c).meta.ngPlus === 2; })());
}

// -- (c) never-carry + (d) source immutability --
{
  const src = makeSource();
  const before = JSON.stringify(src);
  const ng = defaultState(src);
  ok('A09 never carries: party/boxes empty, money 300 fresh, badges empty, quests/bonds/flags fresh, chapter 0',
    ng.party.length === 0 && Object.keys(ng.boxes).length === 0 && ng.player.money === 300
    && ng.badges.kanto.length === 0 && Object.keys(ng.story.quests).length === 0
    && Object.keys(ng.story.bonds).length === 0 && Object.keys(ng.story.flags).length === 0
    && ng.story.chapter === 0 && ng.bag.pokeball === 10 && ng.bag.potion === 3);
  ok('A10 the SOURCE object is byte-identical after NG+ creation (read, never written)',
    JSON.stringify(src) === before);
  ok('A11 a NON-completed save fed as inherit is ignored whole (no accidental inheritance)',
    (() => { const s = defaultState(); s.bag.tortoisecharm = 1; s.dex.caught = { 1: true }; const n = defaultState(s);
      return n.meta.ngPlus === 0 && !('runCaught' in n.dex) && !n.bag.tortoisecharm && Object.keys(n.dex.caught).length === 0; })());
}

// -- (e) HoF shape reconciliation --
{
  ok('A12 canonical shape passes through; legacy {species, level} normalizes into it; junk drops',
    JSON.stringify(S.normalizeHofEntry({ team: [{ speciesId: 'mew', level: 70, nickname: 'X' }], badges: 8 }))
      === JSON.stringify({ team: [{ speciesId: 'mew', level: 70, nickname: 'X' }], badges: 8 })
    && JSON.stringify(S.normalizeHofEntry({ species: 'pidgey', level: 33 }))
      === JSON.stringify({ team: [{ speciesId: 'pidgey', level: 33, nickname: null }], badges: 0 })
    && S.normalizeHofEntry({ nope: 1 }) === null && S.normalizeHofEntry('x') === null);
  const legacySave = (() => { const s = defaultState(); s.story.hof = [{ species: 'pidgey', level: 33 }]; delete s.story.priorHof; delete s.story.bondEcho; return JSON.parse(JSON.stringify(s)); })();
  const mig = SCH.migrate(legacySave);
  ok('A13 legacy-shape save loads clean client-side: migrates, hof canonical, new fields defaulted, validates',
    mig.story.hof[0].team[0].speciesId === 'pidgey' && Array.isArray(mig.story.priorHof)
    && Array.isArray(mig.story.bondEcho) && Array.isArray(mig.story.travelersMemory)
    && SCH.validateSave(mig).ok === true);
  const ngSave = JSON.parse(JSON.stringify(defaultState(makeSource())));
  ok('A14 server validator: canonical hof + priorHof + runCaught save passes; legacy-shape hof passes',
    VAL.validateSave(ngSave).ok === true && VAL.validateSave(mig).ok === true);
  const badHof = JSON.parse(JSON.stringify(ngSave)); badHof.story.hof = [{ team: [{ speciesId: 'notaspecies', level: 50, nickname: null }], badges: 8 }];
  const badMem = JSON.parse(JSON.stringify(ngSave)); badMem.story.travelersMemory = ['fly-to-moon'];
  ok('A15 server validator rejects what it must: unknown species in a HoF team, unknown memory gate',
    VAL.validateSave(badHof).ok === false && VAL.validateSave(badMem).ok === false);
  const hybrid = JSON.parse(JSON.stringify(ngSave)); hybrid.story.hof = [{ team: [{ species: 'pidgeot', level: 55 }], badges: 8 }];
  const hybridMixed = JSON.parse(JSON.stringify(ngSave));
  hybridMixed.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }, { species: 'pidgeot', level: 55 }], badges: 8 }];
  hybridMixed.story.priorHof = [{ team: [{ species: 'mew', level: 70 }], badges: 8 }];
  ok('A31 server validator accepts the hybrid shape the client normalizes: legacy member keys inside canonical entries (QA repro), mixed teams, hybrid priorHof',
    VAL.validateSave(hybrid).ok === true && VAL.validateSave(hybridMixed).ok === true
    && S.normalizeHofEntry(hybrid.story.hof[0]).team[0].speciesId === 'pidgeot');
  const hybridBadSpecies = JSON.parse(JSON.stringify(ngSave)); hybridBadSpecies.story.hof = [{ team: [{ species: 'notaspecies', level: 55 }], badges: 8 }];
  const hybridBadLevel = JSON.parse(JSON.stringify(ngSave)); hybridBadLevel.story.hof = [{ team: [{ species: 'pidgeot', level: 101 }], badges: 8 }];
  const hybridNoKey = JSON.parse(JSON.stringify(ngSave)); hybridNoKey.story.hof = [{ team: [{ level: 55 }], badges: 8 }];
  ok('A32 server validator still rejects garbage hybrids: unknown species via the legacy key, out-of-bounds level, member with no species key',
    VAL.validateSave(hybridBadSpecies).ok === false && VAL.validateSave(hybridBadLevel).ok === false
    && VAL.validateSave(hybridNoKey).ok === false);
}

// -- (i) Traveler's Memory derivation --
{
  const src = makeSource();
  ok('A16 memory derives from the source\'s own shipped evidence: silph_done -> saffron-guard + card-key, coincase -> coin-case, fossil_taken -> fossil-choice',
    JSON.stringify(S.travelersMemoryFromSave(src)) === JSON.stringify(['saffron-guard', 'coin-case', 'card-key', 'fossil-choice']));
  const bare = defaultState(); bare.story.hof = [{ team: [{ speciesId: 'mew', level: 70, nickname: null }], badges: 8 }];
  ok('A17 a source that never solved the gates carries NO memory (and the new run gets no coin case)',
    S.travelersMemoryFromSave(bare).length === 0
    && (() => { const n = defaultState(bare); return n.story.travelersMemory.length === 0 && !n.bag.coincase; })());
  ok('A18 the coin-case memory is a handover: the case is in the new run\'s bag from the start',
    defaultState(makeSource()).bag.coincase === 1);
}

// -- (j) starter breadth derivation --
{
  ok('A19 starter lines derive from the source: gift flag (charmander_joined), party line member (charizard), dex record (bulbasaur)',
    JSON.stringify(S.starterLinesFromSave(makeSource())) === JSON.stringify(['bulbasaur', 'charmander'])
    && (() => { const s = defaultState(); s.party = [{ speciesId: 'venusaur', level: 60 }]; return JSON.stringify(S.starterLinesFromSave(s)) === '["bulbasaur"]'; })()
    && (() => { const s = defaultState(); s.dex.caught = { 8: true }; return JSON.stringify(S.starterLinesFromSave(s)) === '["squirtle"]'; })()
    && S.starterLinesFromSave(defaultState()).length === 0);
  ok('A20 the new run carries the source\'s starter lines on story.starterLines',
    JSON.stringify(defaultState(makeSource()).story.starterLines) === '["bulbasaur","charmander"]');
}

// -- (h) duplicate keepsakes: the central source grant --
{
  const s = defaultState(); s.bag.tortoisecharm = 1; s.player.money = 1000;
  const dup = K.grantKeepsakeFromSource(s, 'tortoisecharm');
  ok('A21 duplicate source grant: +$2,000 cash, NO second piece, a dialogue line naming the piece',
    dup.status === 'duplicate' && dup.cash === 2000 && s.player.money === 3000 && s.bag.tortoisecharm === 1
    && typeof dup.line === 'string' && dup.line.includes('$2,000') && dup.line.includes('Tortoise Charm'));
  const s2 = defaultState();
  const gr = K.grantKeepsakeFromSource(s2, 'ironacorn');
  ok('A22 unowned source grant lands the piece itself (no cash)',
    gr.status === 'granted' && s2.bag.ironacorn === 1 && s2.player.money === 300);
  ok('A23 grantKeepsake (the plain path) is unchanged: owned -> false, no cash moves',
    K.grantKeepsake(s, 'tortoisecharm') === false && s.player.money === 3000);
  const s3 = defaultState(); s3.bag.tortoisecharm = 1; s3.player.money = 0;
  Q.completeTale(s3, 'tale_viridian');
  ok('A24 tales ride the central path: completing a tale whose keepsake is owned converts to +$2,000, still one piece',
    s3.player.money === 2000 && s3.bag.tortoisecharm === 1 && s3.story.quests.tale_viridian === 'complete');
}

// -- (f) bond echo: present + battle-inert --
{
  const s = defaultState(); s.story.bondEcho = ['brock'];
  const withEcho = B.bondSceneLines(s, 'brock', 'banter');
  const plain = B.bondSceneLines(defaultState(), 'brock', 'banter');
  ok('A25 echo: a previously-Close character\'s Warm dialogue unlocks one tier earlier (Wary state, Warm set)',
    JSON.stringify(withEcho) === JSON.stringify(BOND_DIALOGUE.brock.banter.warm)
    && JSON.stringify(plain) === JSON.stringify(BOND_DIALOGUE.brock.banter.wary));
  ok('A26 echo never reaches Close-only sets early: championAfter at Wary stays null even with the echo',
    B.bondSceneLines(s, 'gary', 'championAfter') === null);
  ok('A27 the one-time line is exact, and takeEchoGreeting spends it once per character',
    B.ECHO_LINE === 'You seem familiar. Have we met?'
    && B.takeEchoGreeting(s, 'brock') === true && B.takeEchoGreeting(s, 'brock') === false
    && B.takeEchoGreeting(s, 'mom') === false && B.takeEchoGreeting(defaultState(), 'brock') === false);
  const garyDef = TRAINERS3.gary_champion;
  ok('A28 R3 grep proof intact: battle.mjs / battle-rt.mjs / formulas.mjs carry zero bond references',
    ['src/game/battle.mjs', 'src/game/battle-rt.mjs', 'src/engine/formulas.mjs'].every((f) => {
      const src = readFileSync(join(ROOT, f), 'utf8');
      return !['story.bonds', 'applyBond', 'bondOf', 'tierOf', 'BOND_DIALOGUE', 'recordBattleBond', 'bondTrainerVariant', 'bondEcho'].some((tok) => src.includes(tok));
    }));
  ok('A29 Gary\'s battle def is identical with and without the echo (team/levels/reward untouched — text may warm, numbers never)',
    (() => {
      const a = B.bondTrainerVariant(defaultState(), garyDef);
      const b = B.bondTrainerVariant(s, garyDef);
      return JSON.stringify(a.team) === JSON.stringify(b.team) && a.reward === b.reward;
    })());
  ok('A30 echo list derives from the source\'s Close bonds only (>= +7), bonds themselves start at 0',
    JSON.stringify(defaultState(makeSource()).story.bondEcho) === '["gary","mom"]'
    && Object.keys(defaultState(makeSource()).story.bonds).length === 0);
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
const storeMap = new Map();
globalThis.localStorage = {
  getItem: (k) => (storeMap.has(k) ? storeMap.get(k) : null),
  setItem: (k, v) => { storeMap.set(k, String(v)); },
  removeItem: (k) => { storeMap.delete(k); },
};
globalThis.__SEED__ = 4242;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  function makeDriver(game) {
    const ui = game.ui, input = game.input;
    const tick = (n) => game.loop.stepTicks(n || 2);
    const pressA = () => { input.inject('a'); tick(2); input.release('a'); };
    function drain(max) { let n = 0; while ((ui.dialogueOpen || (game.scenes.top && game.scenes.top.msgOpen)) && n < (max || 400)) { pressA(); n++; } }
    function gotoMap(map, x, y) {
      game.state.story.position = { map, x: x || 7, y: y || 7, dir: 'down' };
      const ow = new OverworldScene();
      game.scenes.replace(ow); ow.enter(); tick(4);
      return ow;
    }
    function talkTo(ow, name) {
      const npc = ow.map.npcs.find((n) => n.name === name);
      if (!npc) return false;
      ow.partner.px = -32; ow.partner.py = -32;
      ow.player.tx = npc.x; ow.player.ty = npc.y + 1;
      ow.player.px = npc.x * 16; ow.player.py = (npc.y + 1) * 16;
      ow.player.dir = 'up';
      ow.tryInteract();
      drain(200);
      return true;
    }
    function faceTile(ow, x, y) {
      ow.partner.px = -32; ow.partner.py = -32;
      ow.player.tx = x; ow.player.ty = y + 1;
      ow.player.px = x * 16; ow.player.py = (y + 1) * 16;
      ow.player.dir = 'up';
      ow.tryInteract();
      drain(120);
    }
    function chooseLabel(frag) {
      const items = ui.menu ? ui.menu.items : [];
      const i = items.findIndex((it) => it.label && it.label.includes(frag));
      if (i < 0) return false;
      ui.debugChoose(i); tick(3); drain(120);
      return true;
    }
    function allDialogue() {
      return ui.log.filter((e) => e.ui === 'dialogue').map((e) => (e.lines || []).join(' ')).join(' | ');
    }
    return { ui, gotoMap, talkTo, faceTile, chooseLabel, drain, allDialogue, tick };
  }
  const boot = () => { const game = new Game(null); game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout(); return { game, D: makeDriver(game) }; };

  // A completed source save as the shipped game stores it (bare state).
  const SRC = (() => { const s = defaultState(); return s; })();
  SRC.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }], badges: 8 }];
  SRC.dex.caught = { 1: true, 3: true, 25: true }; SRC.dex.seen = { 1: true, 3: true, 25: true };
  SRC.bag.tortoisecharm = 1; SRC.bag.coincase = 1;
  SRC.story.flags = { silph_done: true, fossil_taken: true, charmander_joined: true };
  SRC.story.bonds = { mom: 9 };
  SRC.player.money = 9999;

  // (a) title gating — a fresh BootScene per state, as every real
  // title visit constructs one (the unlock scan caches per scene).
  {
    localStorage.removeItem('pdr.save.guest'); localStorage.removeItem('pdr.sync.cache');
    const { game } = boot();
    const menu = () => { const b = new BootScene(game); b.game = game; return b.menuItems().map((i) => i.label); };
    out.menuNoSave = menu();
    localStorage.setItem('pdr.save.guest', JSON.stringify(SRC));
    out.menuCompleted = menu();
    const plain = defaultState(); localStorage.setItem('pdr.save.guest', JSON.stringify(plain));
    out.menuPlainSave = menu();
  }

  // creation: (d) the pure discovery+construction path never writes
  // storage; then the full flow end-to-end (headless auto-finishes
  // the intro, as every harness run does — the new run's OWN first
  // save landing in the target slot afterwards is the design, not a
  // source write).
  {
    localStorage.setItem('pdr.save.guest', JSON.stringify(SRC));
    const srcBytes = localStorage.getItem('pdr.save.guest');
    const srcs = completedSources();
    const pure = srcs.length ? freshState(srcs[0].state) : null;
    out.pureCreate = { n: srcs.length, ngPlus: pure ? pure.meta.ngPlus : -1 };
    out.sourceBytesIntact = localStorage.getItem('pdr.save.guest') === srcBytes;
    const { game } = boot();
    out.hasSecondJourneyFn = typeof game.secondJourney === 'function' && typeof hasCompletedSave === 'function' && hasCompletedSave() === true;
    game.secondJourney();
    const st = game.state;
    out.afterCreate = {
      ngPlus: st.meta.ngPlus, money: st.player.money,
      caughtKeys: Object.keys(st.dex.caught).sort(), runCaught: st.dex.runCaught,
      keepsakes: Object.keys(st.bag).filter((k) => st.bag[k] > 0 && ['tortoisecharm'].includes(k)),
      coincase: st.bag.coincase || 0, priorHof: st.story.priorHof.length, ownHof: st.story.hof.length,
      echo: st.story.bondEcho, memory: st.story.travelersMemory, starters: st.story.starterLines,
      introDone: st.story.flags.introDone === true, partySpecies: st.party.map((m) => m.speciesId),
    };
  }

  // (j) the intro reunion: finishIntro's offer, driven directly (the
  // node harness has no DOM for the live menu, so showMenu/toast are
  // captured at the seam — the logic under test is the game's own).
  {
    localStorage.setItem('pdr.save.guest', JSON.stringify(SRC));
    const { game } = boot();
    game.state = freshState(completedSources()[0].state);
    let captured = null;
    game.ui.showMenu = (title, items, cb) => { captured = { title, items, cb }; };
    game.ui.toast = () => {};
    game.ui.headless = false; // the reunion branch is gated on it
    const intro = new IntroScene();
    intro.game = game;
    intro.finishIntro();
    out.reunionMenu = captured ? captured.items.map((i) => i.label) : [];
    game.ui.headless = true; // the offer is captured; completion runs harness-style
    if (captured) captured.cb('charmander');
    out.partyAfterReunion = game.state.party.map((m) => m.speciesId);
    out.runCaughtAfterReunion = game.state.dex.runCaught;
  }

  // (g) HoF viewer: prior journeys render from the new run
  {
    const { game } = boot();
    game.state = migrate(JSON.parse(JSON.stringify(SRC)));
    game.state.story.priorHof = game.state.story.hof; game.state.story.hof = [];
    let captured = null;
    game.ui.showSummary = (spec) => { captured = spec; };
    game.openHallOfFame();
    out.hofHtml = captured && captured.tabs ? captured.tabs[0].bodyHtml : '';
    // (b) diploma gate in the real bundle: full archive, no own catches
    game.state.dex.runCaught = {};
    for (let n = 1; n <= 151; n++) game.state.dex.caught[n] = true;
    game.checkDiploma();
    out.diplomaFromArchive = game.state.story.flags.diploma === true;
    for (let n = 1; n <= 151; n++) game.state.dex.runCaught[n] = true;
    game.checkDiploma();
    out.diplomaFromOwnCatches = game.state.story.flags.diploma === true;
  }

  // (i) fossil re-pick with memory; sealed without it
  {
    const { game, D } = boot();
    game.state.story.travelersMemory = ['fossil-choice'];
    game.state.story.flags.fossil_taken = true; // this run already took one
    const ow = D.gotoMap('moon2', 7, 7);
    D.faceTile(ow, 12, 9); // the dome fossil ball
    out.fossilRepick = { bag: game.state.bag.domefossil || 0, dlg: D.allDialogue().includes('Dome Fossil') };
    const g2 = boot(); const D2 = g2.D;
    g2.game.state.story.flags.fossil_taken = true;
    const ow2 = D2.gotoMap('moon2', 7, 7);
    D2.faceTile(ow2, 12, 9);
    out.fossilSealed = { bag: g2.game.state.bag.domefossil || 0, dlg: D2.allDialogue().includes('crumbled stone') };
  }

  // (h) hidden keepsake duplicate in the world
  {
    const { game, D } = boot();
    game.state.bag.sparrowfeather = 1; game.state.player.money = 500;
    const ow = D.gotoMap('route2', 6, 6);
    D.faceTile(ow, 1, 12);
    out.hiddenDupe = { money: game.state.player.money, feather: game.state.bag.sparrowfeather, dlg: D.allDialogue().includes('$2,000') };
    const g2 = boot(); const D2 = g2.D;
    const ow2 = D2.gotoMap('route2', 6, 6);
    D2.faceTile(ow2, 1, 12);
    out.hiddenGrant = { feather: g2.game.state.bag.sparrowfeather || 0, money: g2.game.state.player.money };
  }

  // (f) echo greeting at Mom + Saffron memory line
  {
    const { game, D } = boot();
    game.state.story.bondEcho = ['mom'];
    const ow = D.gotoMap('pallet', 7, 7);
    D.talkTo(ow, 'MOM');
    out.echoHeard = D.allDialogue().includes('You seem familiar. Have we met?');
    const logLen = D.ui.log.length;
    D.talkTo(ow, 'MOM');
    out.echoOnce = !D.ui.log.slice(logLen).some((e) => e.ui === 'dialogue' && (e.lines || []).join(' ').includes('You seem familiar'));
    const g2 = boot(); const D2 = g2.D;
    g2.game.state.story.travelersMemory = ['saffron-guard'];
    D2.gotoMap('saffron', 10, 10);
    out.saffronLine = D2.allDialogue().includes('City remembers you');
    const g3 = boot(); const D3 = g3.D;
    D3.gotoMap('saffron', 10, 10);
    out.saffronSilent = !D3.allDialogue().includes('City remembers you');
    const g4 = boot(); const D4 = g4.D;
    g4.game.state.story.travelersMemory = ['card-key'];
    D4.gotoMap('silph1', 8, 7);
    out.silphLine = D4.allDialogue().includes('Card Key in hand');
    const logLen4 = D4.ui.log.length;
    D4.gotoMap('silph1', 8, 7);
    out.silphOnce = !D4.ui.log.slice(logLen4).some((e) => e.ui === 'dialogue' && (e.lines || []).join(' ').includes('Card Key in hand'));
    const g5 = boot(); const D5 = g5.D;
    D5.gotoMap('silph1', 8, 7);
    out.silphSilent = !D5.allDialogue().includes('Card Key in hand');
  }
  console.log('REJUV6-RESULT ' + JSON.stringify(out));
})()`;
let B_out = null;
{
  const logs = [];
  const origLog = console.log;
  let evalErr = null;
  console.log = (...a) => { logs.push(a.join(' ')); };
  try { eval(gameJs + driver); } catch (e) { evalErr = e; } finally { console.log = origLog; }
  if (evalErr) ok('B00 bundle driver executed', false, String((evalErr && evalErr.stack) || evalErr).slice(0, 400));
  const line = logs.find((l) => l.startsWith('REJUV6-RESULT'));
  if (line) B_out = JSON.parse(line.slice(14));
}
if (B_out) {
  ok('B01 (a) no completed slot -> title menu byte-identical to pre-Phase-6 (New Game / Continue / Options, no star, no row)',
    JSON.stringify(B_out.menuPlainSave) === '["New Game","Continue","Options"]'
    && JSON.stringify(B_out.menuNoSave) === '["New Game","Options"]', JSON.stringify(B_out));
  ok('B02 (a) completed slot -> Second Journey offered, appended AFTER Options (counted presses never shift)',
    JSON.stringify(B_out.menuCompleted) === '["New Game","Continue","Options","Second Journey"]', JSON.stringify(B_out.menuCompleted));
  ok('B03 creation: ngPlus 1, fresh money, archive carried, own-catch record holds ONLY the new run\'s partner (archive #1/#3 never leak in), keepsake + coin case in pocket, priorHof kept, echo/memory/starters derived, intro converges',
    B_out.hasSecondJourneyFn === true && B_out.afterCreate.ngPlus === 1 && B_out.afterCreate.money === 300
    && JSON.stringify(B_out.afterCreate.caughtKeys) === '["1","25","3"]'
    && JSON.stringify(Object.keys(B_out.afterCreate.runCaught || {})) === '["25"]'
    && B_out.afterCreate.keepsakes.length === 1 && B_out.afterCreate.coincase === 1
    && B_out.afterCreate.priorHof === 1 && B_out.afterCreate.ownHof === 0
    && JSON.stringify(B_out.afterCreate.echo) === '["mom"]'
    && B_out.afterCreate.memory.includes('fossil-choice') && B_out.afterCreate.memory.includes('card-key')
    && JSON.stringify(B_out.afterCreate.starters) === '["bulbasaur","charmander"]'
    && B_out.afterCreate.introDone === true && JSON.stringify(B_out.afterCreate.partySpecies) === '["partner"]',
    JSON.stringify(B_out.afterCreate));
  ok('B04 (d) source discovery + state construction never write storage: the source slot\'s bytes are byte-identical after creation reads them',
    B_out.pureCreate.n === 1 && B_out.pureCreate.ngPlus === 1 && B_out.sourceBytesIntact === true);
  ok('B05 (j) intro reunion offers the carried starter line; choosing it grants the mon as THIS run\'s own catch',
    B_out.reunionMenu.some((l) => l.includes('Charmander'))
    && B_out.partyAfterReunion.includes('charmander') && B_out.partyAfterReunion.includes('partner')
    && B_out.runCaughtAfterReunion[4] === true, JSON.stringify(B_out.reunionMenu) + ' ' + JSON.stringify(B_out.partyAfterReunion));
  ok('B06 (g) prior HoF teams are viewable from the new run (viewer renders the PRIOR JOURNEYS section)',
    typeof B_out.hofHtml === 'string' && B_out.hofHtml.includes('PRIOR JOURNEYS') && B_out.hofHtml.includes('Venusaur'));
  ok('B07 (b) diploma: carried archive alone does NOT grant it; the run\'s own 151 catches do',
    B_out.diplomaFromArchive === false && B_out.diplomaFromOwnCatches === true);
  ok('B08 (i) Traveler\'s Memory: fossil choice re-picks freely; without the memory the seal stands',
    B_out.fossilRepick.bag === 1 && B_out.fossilRepick.dlg === true
    && B_out.fossilSealed.bag === 0 && B_out.fossilSealed.dlg === true, JSON.stringify(B_out.fossilRepick) + ' ' + JSON.stringify(B_out.fossilSealed));
  ok('B09 (h) hidden keepsake source: owned piece converts to +$2,000 with the line; unowned grants the piece',
    B_out.hiddenDupe.money === 2500 && B_out.hiddenDupe.feather === 1 && B_out.hiddenDupe.dlg === true
    && B_out.hiddenGrant.feather === 1 && B_out.hiddenGrant.money === 300, JSON.stringify(B_out.hiddenDupe) + ' ' + JSON.stringify(B_out.hiddenGrant));
  ok('B10 (f) echo greeting: Mom says the line once in the new journey, then never again',
    B_out.echoHeard === true && B_out.echoOnce === true);
  ok('B11 (i) Saffron memory: the gate line plays for a remembering traveler, and stays silent otherwise',
    B_out.saffronLine === true && B_out.saffronSilent === true);
  ok('B12 (i) Card Key memory: the Silph route line plays exactly once for a remembering traveler on Silph entry, and stays silent for everyone else',
    B_out.silphLine === true && B_out.silphOnce === true && B_out.silphSilent === true,
    JSON.stringify({ line: B_out.silphLine, once: B_out.silphOnce, silent: B_out.silphSilent }));
}

// ================= Part C: real headless Chromium =================
{
  const pubHtml = join(ROOT, 'public', 'index.html');
  const pubJs = join(ROOT, 'public', 'game.js');
  if (!existsSync(pubHtml) || !existsSync(pubJs) || !existsSync('/opt/meta-chromium/chrome')) {
    ok('C01 real-browser smoke (skipped: built bundle or chromium missing)', false, 'build first: node scripts/build.mjs');
  } else {
    const CSP = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers
      .find((h) => h.key === 'Content-Security-Policy').value;
    const HTML_B64 = readFileSync(pubHtml).toString('base64');
    const GAME_B64 = readFileSync(pubJs).toString('base64');
    const cport = 9900 + (process.pid % 90);
    const chrome = spawn('/opt/meta-chromium/chrome', [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/rejuv6-chrome-' + cport,
      '--window-size=1280,800', 'about:blank',
    ], { stdio: 'ignore' });
    try {
      let ws;
      for (let i = 0; i < 50 && !ws; i++) {
        try {
          const v = await (await fetch('http://127.0.0.1:' + cport + '/json/version')).json();
          ws = new WebSocket(v.webSocketDebuggerUrl);
          await new Promise((res2, rej) => { ws.onopen = res2; ws.onerror = rej; });
        } catch (e) { await new Promise((r) => setTimeout(r, 200)); }
      }
      if (!ws) throw new Error('chromium did not start');
      let msgId = 0;
      const pending = new Map();
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
        if (d.method === 'Fetch.requestPaused') { void fulfillC(d.params, d.sessionId); }
      };
      const sendAny = (method, params, sessionId) => new Promise((resolve) => {
        const id = ++msgId; pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      });
      async function fulfillC(p, sessionId) {
        const url = p.request.url;
        try {
          if (url.includes('/api/')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"ok":true}').toString('base64') }, sessionId);
          } else if (url.endsWith('/game.js')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: GAME_B64 }, sessionId);
          } else {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: HTML_B64 }, sessionId);
          }
        } catch (e) { /* session gone */ }
      }
      const targets = await sendAny('Target.getTargets');
      const page = targets.result.targetInfos.find((t) => t.type === 'page');
      const session = await sendAny('Target.attachToTarget', { targetId: page.targetId, flatten: true });
      const SID = session.result.sessionId;
      const snd = (method, params) => sendAny(method, params, SID);
      await snd('Page.enable'); await snd('Runtime.enable');
      await snd('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      const evl = async (expr) => {
        const r = await snd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
        return r.result.result.value;
      };
      await snd('Page.navigate', { url: 'http://127.0.0.1:8931/' });
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let canvasOk = false;
      for (let i = 0; i < 100 && !canvasOk; i++) { canvasOk = await evl("typeof Game === 'function' && !!document.querySelector('canvas')"); if (!canvasOk) await sleep(150); }
      ok('C00 chromium boots the built bundle (Game live)', canvasOk === true);
      const browserDriver = `(() => {
        const out = {};
        try {
          const game = new Game(null);
          game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
          const bs1 = new BootScene(game); bs1.game = game; out.menuFresh = bs1.menuItems().map((i) => i.label);
          const src = defaultState();
          src.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }], badges: 8 }];
          src.bag.sparrowfeather = 1;
          localStorage.setItem('pdr.save.guest', JSON.stringify(src));
          const bs2 = new BootScene(game); bs2.game = game; out.menuDone = bs2.menuItems().map((i) => i.label);
          game.secondJourney();
          out.ngPlus = game.state.meta.ngPlus;
          out.feather = game.state.bag.sparrowfeather || 0;
          out.introTop = game.scenes.top instanceof IntroScene;
        } catch (e) { out.error = String((e && e.stack) || e); }
        return out;
      })()`;
      const br = await evl(browserDriver);
      ok('C01 real-browser: title gains the Second Journey row only with a completed save; creation lands in the intro at ngPlus 1 with the keepsake carried',
        !!br && JSON.stringify(br.menuFresh) === '["New Game","Options"]'
        && JSON.stringify(br.menuDone) === '["New Game","Continue","Options","Second Journey"]'
        && br.ngPlus === 1 && br.feather === 1 && br.introTop === true,
        JSON.stringify(br));
      ws.close();
    } catch (e) {
      ok('C01 real-browser smoke (chromium harness)', false, String(e).slice(0, 300));
    } finally {
      try { chrome.kill(); } catch (e) { /* already gone */ }
    }
  }
}

console.log('rejuv-phase6-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
