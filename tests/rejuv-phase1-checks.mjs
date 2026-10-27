// rejuv-phase1-checks.mjs — Rejuvenation Phase 1 (ADR-025 §4) proofs:
// difficulty modes + House Rules. Part A: pure units over rules.mjs /
// schema migration / formulas composition. Part B: the built bundle in a
// headless Game (audit-headless pattern) — Options menus + lock rule,
// battle instantiation levers, Candy Coach gating + spar award, XP Candy.
// Run: node tests/rejuv-phase1-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const { defaultState, SCHEMA_VERSION, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const { migrate, validateSave } = await import(join(ROOT, 'src/save/schema.mjs'));
const R = await import(join(ROOT, 'src/game/rules.mjs'));
const { statValue, hpValue, gen1Random } = await import(join(ROOT, 'src/engine/formulas.mjs'));
const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { MOVES } = await import(join(ROOT, 'src/data/moves.mjs'));

const st = (mut) => { const s = defaultState(); if (mut) mut(s); return s; };

// -- defaults (schema v2 shape) --
{
  const d = defaultState();
  ok('A01 SCHEMA_VERSION is 2', SCHEMA_VERSION === 2 && d.v === 2);
  ok('A02 default difficulty is classic', d.story.difficulty === 'classic');
  ok('A03 houseRules default: six toggles, all off',
    ['steadyDamage', 'mercifulFoes', 'fastLearner', 'generousWorld', 'candyCoach', 'skipIntro']
      .every((k) => d.settings.houseRules[k] === false));
  ok('A04 meta defaults: untouched + ngPlus 0', d.meta.houseRulesTouched === false && d.meta.ngPlus === 0);
}

// -- v1 -> v2 migration --
{
  const v1 = JSON.parse(JSON.stringify(defaultState()));
  v1.v = 1; v1.story.difficulty = 'normal';
  delete v1.settings.houseRules; delete v1.meta.houseRulesTouched; delete v1.meta.ngPlus;
  const m = migrate(v1);
  ok('A05 v1 save migrates to v2', m.v === 2);
  ok('A06 difficulty normal -> classic', m.story.difficulty === 'classic');
  ok('A07 migrated defaults filled', m.settings.houseRules.fastLearner === false && m.meta.houseRulesTouched === false && m.meta.ngPlus === 0);
  ok('A08 migrated save passes client validateSave', validateSave(m).ok === true);
  const hard = JSON.parse(JSON.stringify(defaultState())); hard.v = 1; hard.story.difficulty = 'hard'; delete hard.settings.houseRules;
  ok('A09 difficulty hard -> challenge', migrate(hard).story.difficulty === 'challenge');
  const easy = JSON.parse(JSON.stringify(defaultState())); easy.v = 1; easy.story.difficulty = 'easy'; delete easy.settings.houseRules;
  ok('A10 difficulty easy -> story', migrate(easy).story.difficulty === 'story');
}

// -- mode resolution + trainer levels --
{
  ok('A11 difficultyOf falls back to classic', R.difficultyOf({ story: { difficulty: 'weird' } }) === 'classic'
    && R.difficultyOf(null) === 'classic' && R.difficultyOf(st()) === 'classic');
  const plain = { id: 't', team: [] };
  const leader = { id: 'l', team: [], badge: 'boulderbadge', ai: 'opener-setup' };
  ok('A12 story: trainer levels -2, floor 1',
    R.trainerLevelFor(st((s) => { s.story.difficulty = 'story'; }), plain, 10) === 8
    && R.trainerLevelFor(st((s) => { s.story.difficulty = 'story'; }), plain, 2) === 1);
  ok('A13 classic: levels as authored',
    R.trainerLevelFor(st(), plain, 10) === 10 && R.trainerLevelFor(st(), leader, 10) === 10);
  ok('A14 challenge: leaders +2 (cap 100), plain trainers unchanged',
    R.trainerLevelFor(st((s) => { s.story.difficulty = 'challenge'; }), leader, 10) === 12
    && R.trainerLevelFor(st((s) => { s.story.difficulty = 'challenge'; }), leader, 100) === 100
    && R.trainerLevelFor(st((s) => { s.story.difficulty = 'challenge'; }), plain, 10) === 10);
  ok('A15 isLeaderTrainer: badge or smart/opener AI',
    R.isLeaderTrainer(leader) === true && R.isLeaderTrainer({ ai: 'smart' }) === true && R.isLeaderTrainer(plain) === false);
}

// -- foe IVs + tuning --
{
  ok('A16 foeIvFor matrix',
    R.foeIvFor(st()) === 31
    && R.foeIvFor(st((s) => { s.story.difficulty = 'story'; })) === 16
    && R.foeIvFor(st((s) => { s.settings.houseRules.mercifulFoes = true; })) === 16
    && R.foeIvFor(st((s) => { s.story.difficulty = 'challenge'; s.settings.houseRules.mercifulFoes = true; })) === 16);
  const mon = makeMon('rattata', 10, SPECIES, MOVES);
  ok('A17 makeMon baseline is IV 31 stats', mon.ivs.hp === 31 && mon.stats.atk === statValue(SPECIES.rattata.base.atk, 10, 31));
  R.tuneFoeMon(mon, st((s) => { s.story.difficulty = 'story'; }));
  ok('A18 tuneFoeMon rewrites IVs + stats + HP at 16',
    mon.ivs.hp === 16 && mon.ivs.spe === 16
    && mon.stats.atk === statValue(SPECIES.rattata.base.atk, 10, 16)
    && mon.maxHp === hpValue(SPECIES.rattata.base.hp, 10, 16) && mon.hp === mon.maxHp);
  const mon2 = makeMon('pidgey', 8, SPECIES, MOVES);
  R.tuneFoeMon(mon2, st());
  ok('A19 tuneFoeMon is a no-op in classic', mon2.ivs.hp === 31 && mon2.maxHp === hpValue(SPECIES.pidgey.base.hp, 8, 31));
}

// -- effective AI --
{
  const smart = { ai: 'smart' };
  const opener = { ai: 'opener-setup', badge: 'boulderbadge' };
  const plain = {};
  ok('A20 effectiveAiFor matrix',
    R.effectiveAiFor(st((s) => { s.story.difficulty = 'story'; }), smart) === null
    && R.effectiveAiFor(st(), smart) === 'smart'
    && R.effectiveAiFor(st((s) => { s.story.difficulty = 'challenge'; }), opener) === 'smart'
    && R.effectiveAiFor(st((s) => { s.story.difficulty = 'challenge'; }), plain) === null
    && R.effectiveAiFor(st(), plain) === null
    && R.effectiveAiFor(st(), null) === null);
}

// -- damage roll / economy multipliers / cooldowns / catch --
{
  const rng = () => 0; // worst roll
  ok('A21 steady damage fixes the roll at 255/255 for any rng',
    R.damageRandomFor(st((s) => { s.settings.houseRules.steadyDamage = true; }), rng) === 1);
  ok('A22 without the rule the roll is the Gen-1 roll', R.damageRandomFor(st(), rng) === gen1Random(rng));
  ok('A23 xp multipliers compose (story 1.25 x fastLearner 1.5)',
    R.xpMultFor(st()) === 1
    && R.xpMultFor(st((s) => { s.story.difficulty = 'story'; })) === 1.25
    && R.xpMultFor(st((s) => { s.settings.houseRules.fastLearner = true; })) === 1.5
    && R.xpMultFor(st((s) => { s.story.difficulty = 'story'; s.settings.houseRules.fastLearner = true; })) === 1.875);
  ok('A24 money + catch + RT cooldown multipliers',
    R.moneyMultFor(st()) === 1 && R.moneyMultFor(st((s) => { s.settings.houseRules.generousWorld = true; })) === 1.5
    && R.catchRateMultFor(st()) === 1 && R.catchRateMultFor(st((s) => { s.story.difficulty = 'story'; })) === 1.1
    && R.rtFoeCooldownMultFor(st()) === 1
    && R.rtFoeCooldownMultFor(st((s) => { s.story.difficulty = 'story'; })) === 1.1
    && R.rtFoeCooldownMultFor(st((s) => { s.story.difficulty = 'challenge'; })) === 0.9);
  ok('A25 sparLevelFor: highest - 2, floor 1, empty party 0',
    R.sparLevelFor(st((s) => { s.party = [{ level: 5 }, { level: 12 }]; })) === 10
    && R.sparLevelFor(st((s) => { s.party = [{ level: 2 }]; })) === 1
    && R.sparLevelFor(st()) === 0);
  ok('A26 activeHouseRules lists labels in menu order',
    JSON.stringify(R.activeHouseRules(st((s) => { s.settings.houseRules.candyCoach = true; s.settings.houseRules.fastLearner = true; })))
      === JSON.stringify(['Fast Learner', 'Candy Coach']));
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 777;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const ui = game.ui, st = game.state;
  const chooseLabel = (frag) => {
    const items = ui.menu ? ui.menu.items : [];
    const i = items.findIndex((it) => it.label && it.label.includes(frag));
    if (i < 0) return false;
    ui.debugChoose(i);
    return true;
  };
  const rowOf = (frag) => (ui.menu ? ui.menu.items.find((it) => it.label && it.label.includes(frag)) : null);

  // ---------- Options: Difficulty + House Rules rows ----------
  game.openOptions();
  out.optionsHasDifficulty = !!rowOf('Difficulty: CLASSIC');
  out.optionsHasHouseRules = !!rowOf('House Rules');
  chooseLabel('Difficulty:');
  out.diffMenuRows = ui.menu ? ui.menu.items.map((it) => it.label) : [];
  chooseLabel('CHALLENGE');
  out.modeAfterPick = st.story.difficulty; // no badges yet: raising is free
  // Lock rule: with a badge, raising is disabled, lowering stays open.
  st.badges.kanto.push('boulderbadge');
  st.story.difficulty = 'story';
  game.openDifficultyMenu();
  out.lockClassicDisabled = (rowOf('CLASSIC') || {}).disabled === true;
  out.lockChallengeDisabled = (rowOf('CHALLENGE') || {}).disabled === true;
  out.lockStoryEnabled = (rowOf('STORY') || {}).disabled !== true;
  st.story.difficulty = 'challenge';
  game.openDifficultyMenu();
  out.lowerStoryEnabled = (rowOf('STORY') || {}).disabled !== true;
  st.badges.kanto.length = 0;
  st.story.difficulty = 'classic';

  // ---------- House Rules submenu: toggle + touched latch ----------
  game.openHouseRulesMenu();
  out.hrRows = ui.menu ? ui.menu.items.length : 0; // 6 toggles + Back
  chooseLabel('Fast Learner');
  out.fastLearnerOn = st.settings.houseRules.fastLearner === true;
  out.touchedAfterEnable = st.meta.houseRulesTouched === true;
  chooseLabel('Fast Learner'); // toggle back off (submenu reopened itself)
  out.fastLearnerOffAgain = st.settings.houseRules.fastLearner === false;
  out.touchedStaysLatched = st.meta.houseRulesTouched === true;
  st.meta.houseRulesTouched = false;

  // ---------- Battle instantiation levers ----------
  st.party = [makeMon('partner', 20, SPECIES, MOVES), makeMon('pidgey', 10, SPECIES, MOVES)];
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  st.story.difficulty = 'story';
  const bStory = new BattleScene({ kind: 'trainer', trainer: TRAINERS.r1_cal, returnTo: ow, rt: false });
  game.scenes.push(bStory); bStory.enter();
  out.storyFoeLevel = bStory.foeMon.level;   // rattata 3 -> 1
  out.storyFoeIv = bStory.foeMon.ivs.hp;     // 16
  game.scenes.pop();
  st.story.difficulty = 'challenge';
  const bChal = new BattleScene({ kind: 'trainer', trainer: TRAINERS.brock, returnTo: ow, rt: false });
  game.scenes.push(bChal); bChal.enter();
  out.challengeLeaderLevel = bChal.foeMon.level; // authored + 2
  out.challengeLeaderAi = bChal.foeAi;           // promoted to smart
  out.brockAuthoredLevel = TRAINERS.brock.team[0].level;
  game.scenes.pop();
  st.story.difficulty = 'classic';
  const bWild = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 7, SPECIES, MOVES), returnTo: ow, rt: false });
  game.scenes.push(bWild); bWild.enter();
  out.classicWildUntouched = bWild.foeMon.level === 7 && bWild.foeMon.ivs.hp === 31;
  game.scenes.pop();

  // ---------- Candy Coach: map gate ----------
  ow.loadMap('center');
  out.coachHiddenWhenOff = !ow.map.npcs.some((n) => n.sparCoach);
  st.settings.houseRules.candyCoach = true;
  ow.loadMap('center');
  const coach = ow.map.npcs.find((n) => n.sparCoach);
  out.coachPresentWhenOn = !!coach && coach.name === 'SPARRING COACH';

  // ---------- Spar: win pays a candy, loss costs nothing ----------
  st.party = [makeMon('partner', 10, SPECIES, MOVES)];
  const moneyBefore = st.player.money;
  ow.startSpar(coach);
  // drain the coach dialogue to reach the offer menu
  let guard = 0;
  while (guard++ < 80) {
    if (ui.menuOpen && ui.menu.items.some((it) => it.value === 'yes')) break;
    if (ui.dlg) { game.input.inject('a'); game.loop.stepTicks(2); game.input.release('a'); game.loop.stepTicks(2); }
    else game.loop.stepTicks(2);
  }
  out.sparOfferShown = !!(ui.menuOpen && ui.menu.items.some((it) => it.value === 'yes'));
  chooseLabel('Spar');
  const bSpar = game.scenes.top;
  out.sparSceneFriendly = !!bSpar && bSpar.friendly === true && bSpar.uncatchable === true;
  out.sparFoe = bSpar ? { sp: bSpar.foeMon.speciesId, lv: bSpar.foeMon.level } : null; // machop @ 10-2=8
  if (bSpar) bSpar.endBattle(true);
  out.candyAfterWin = st.bag.xpcandy || 0;
  // loss path: friendly defeat — no halving, no warp
  ow.startSpar(coach);
  guard = 0;
  while (guard++ < 80) {
    if (ui.menuOpen && ui.menu.items.some((it) => it.value === 'yes')) break;
    if (ui.dlg) { game.input.inject('a'); game.loop.stepTicks(2); game.input.release('a'); game.loop.stepTicks(2); }
    else game.loop.stepTicks(2);
  }
  chooseLabel('Spar');
  const bSpar2 = game.scenes.top;
  if (bSpar2 && bSpar2 !== bSpar) { bSpar2.finishDefeat(); }
  out.moneyAfterSparLoss = st.player.money;
  out.candyAfterLoss = st.bag.xpcandy || 0;
  out.moneyIntact = out.moneyAfterSparLoss === moneyBefore;

  // ---------- XP Candy from the bag ----------
  const mon = makeMon('pidgey', 5, SPECIES, MOVES);
  st.party = [mon];
  const xpBefore = mon.xp;
  game.useBagItem('xpcandy');
  chooseLabel('Pidgey');
  out.candyXpGain = mon.xp - xpBefore;
  out.candyBagAfter = st.bag.xpcandy || 0;
  out.candyLevelConsistent = mon.xp >= xpForLevel(SPECIES.pidgey.growth, mon.level)
    && (mon.level >= 100 || mon.xp < xpForLevel(SPECIES.pidgey.growth, mon.level + 1));

  // ---------- Skip Intro house rule (headless auto-path) ----------
  st.settings.houseRules.skipIntro = true;
  game.skipIntroVeteran = false;
  const intro = new IntroScene(); game.scenes.push(intro); intro.enter();
  out.skipIntroSkips = st.story.flags.introDone === true && st.party.some((m) => m.speciesId === 'partner');
  game.scenes.pop();
  st.settings.houseRules.skipIntro = false;
  st.story.flags.introDone = false;
  const intro2 = new IntroScene(); game.scenes.push(intro2); intro2.enter();
  out.noSkipWithoutRule = intro2.step === 'professor';
  game.scenes.pop();

  // ---------- New Game carries the picked mode ----------
  st.story.difficulty = 'story';
  st.settings.houseRules.generousWorld = true;
  game.newGame();
  out.newGameKeepsDifficulty = game.state.story.difficulty === 'story';
  out.newGameStartsTouched = game.state.meta.houseRulesTouched === true;

  console.log('REJUV-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('REJUV-RESULT')) || 'REJUV-RESULT {}').slice(13));

ok('B01 Options carries Difficulty + House Rules rows', res.optionsHasDifficulty === true && res.optionsHasHouseRules === true, JSON.stringify(res));
ok('B02 difficulty submenu lists the three modes', Array.isArray(res.diffMenuRows) && res.diffMenuRows.some((l) => l.includes('STORY')) && res.diffMenuRows.some((l) => l.includes('CHALLENGE')), JSON.stringify(res.diffMenuRows));
ok('B03 mode pick applies (pre-badge raise is free)', res.modeAfterPick === 'challenge');
ok('B04 badge lock disables raises, keeps lowering open', res.lockClassicDisabled === true && res.lockChallengeDisabled === true && res.lockStoryEnabled === true && res.lowerStoryEnabled === true, JSON.stringify(res));
ok('B05 House Rules submenu has six toggles + Back', res.hrRows === 7, String(res.hrRows));
ok('B06 toggling a rule on latches houseRulesTouched (and it stays)', res.fastLearnerOn === true && res.touchedAfterEnable === true && res.fastLearnerOffAgain === true && res.touchedStaysLatched === true);
ok('B07 story battle: foe level -2 and IV 16', res.storyFoeLevel === 1 && res.storyFoeIv === 16, JSON.stringify(res));
ok('B08 challenge battle: leader +2 and AI promoted to smart', res.challengeLeaderLevel === res.brockAuthoredLevel + 2 && res.challengeLeaderAi === 'smart', JSON.stringify(res));
ok('B09 classic wild battle untouched', res.classicWildUntouched === true);
ok('B10 coach absent with rule off, present with rule on', res.coachHiddenWhenOff === true && res.coachPresentWhenOn === true);
ok('B11 spar offer shows; scene is friendly + uncatchable, foe is Machop at highest-2', res.sparOfferShown === true && res.sparSceneFriendly === true && res.sparFoe && res.sparFoe.sp === 'machop' && res.sparFoe.lv === 8, JSON.stringify(res));
ok('B12 spar win awards exactly one XP Candy', res.candyAfterWin === 1, String(res.candyAfterWin));
ok('B13 spar loss: no candy, money intact', res.candyAfterLoss === 1 && res.moneyIntact === true, JSON.stringify(res));
ok('B14 XP Candy grants exactly 800 XP and consumes the item', res.candyXpGain === 800 && res.candyBagAfter === 0 && res.candyLevelConsistent === true, JSON.stringify(res));
ok('B15 Skip Intro rule skips to a converged state; without it the intro plays', res.skipIntroSkips === true && res.noSkipWithoutRule === true, JSON.stringify(res));
ok('B16 New Game carries difficulty; a carried rule starts the run touched', res.newGameKeepsDifficulty === true && res.newGameStartsTouched === true);

console.log('rejuv-phase1-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
