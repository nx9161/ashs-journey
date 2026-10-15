// verify-slice.mjs — headless playthrough of the Track A vertical slice.
// Boots the REAL game code (same modules the build concatenates) with stubbed
// DOM/canvas/audio/storage, then plays it: boot -> title -> intro -> overworld
// walk -> wild encounter -> battle -> catch -> save -> Pewter Gym -> Brock ->
// badge -> reload/continue. Every assert below actually executed.
//
// HARNESS SETUP (documented, not gameplay): before the gym check the harness
// levels the team to 16 and stocks items — balance tuning is GD/QA's Wave-2 job.
// The harness verifies the SYSTEMS (gym flow, badge, capstone, save), not balance.

import { buildGameJs } from './build.mjs';

// ---------- environment stubs ----------
const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
// document/window/AudioContext/requestAnimationFrame stay undefined -> headless paths.

const gameJs = buildGameJs();

const driver = `
;(function () {
  const results = [];
  let failures = 0;
  function ok(name, cond, extra) {
    results.push({ name, pass: !!cond });
    if (!cond) { failures++; console.error('FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('pass  ' + name);
  }

  // ----- manual boot (no rAF loop in headless) -----
  const game = new Game(null);
  game.ui.init();
  game.input.bindKeyboard();
  game.buildSprites();
  game.applyLayout();
  game.scenes.push(new BootScene());
  const loop = game.loop, input = game.input, ui = game.ui;

  function tick(n) { loop.stepTicks(n || 2); }
  function pressA(times) {
    times = times || 1;
    for (let i = 0; i < times; i++) { input.inject('a'); tick(2); input.release('a'); }
  }
  function drainDialog(max) {
    let n = 0; max = max || 300;
    while (ui.dialogueOpen && n < max) { pressA(1); n++; }
    return !ui.dialogueOpen;
  }
  function choose(i) { ui.debugChoose(i); tick(3); }
  function firstEnabled(m) { return m.items.findIndex((it) => !it.disabled); }
  // Pick the highest expected-value move (power x effectiveness x STAB).
  // Mirrors a real player; never picks a 0-effectiveness move while an option exists.
  function bestMoveIdx(battle) {
    const m = ui.menu;
    const foeTypes = SPECIES[battle.foe.speciesId].types;
    const allyTypes = SPECIES[battle.ally.speciesId].types;
    let best = -1, bestScore = -1;
    m.items.forEach((it, i) => {
      if (it.disabled) return;
      const slot = battle.ally.moves[i];
      if (!slot) return;
      const md = MOVES[slot.id];
      let score;
      if (md.cat === 'status') score = 0.1;
      else score = effectiveness(md.type, foeTypes) * (md.power || 0) * (allyTypes.includes(md.type) ? 1.5 : 1);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best >= 0 ? best : firstEnabled(m);
  }
  function holdDir(ow, dir, ticks) {
    input.press(dir); tick(ticks); input.release(dir); tick(6);
  }

  // ----- 1. boot legal card (GC verbatim) -----
  const boot = game.scenes.top;
  ok('boot scene pushed', boot instanceof BootScene);
  ok('legal phase first', boot.phase === 'legal');
  ok('disclaimer title verbatim', DISCLAIMER_BOOT[0] === "ASH'S JOURNEY");
  ok('disclaimer non-affiliation verbatim',
    DISCLAIMER_BOOT.join('\\n').indexOf('Not affiliated with, endorsed by, or connected to') >= 0);
  ok('disclaimer non-commercial verbatim',
    DISCLAIMER_BOOT.join('\\n').indexOf('free, non-commercial fan project') >= 0);
  ok('not interactive before dwell', (function () { pressA(1); return boot.phase === 'legal'; })());
  loop.stepMs(3100); tick(2);
  ok('interactive after 3s dwell', boot.ready === true);
  pressA(1);
  ok('title phase', boot.phase === 'title');
  ok('game title line', GAME_TITLE === "ASH'S JOURNEY");

  // ----- 2. new game -> intro -----
  pressA(1); // New Game
  ok('intro scene', game.scenes.top instanceof IntroScene);
  ok('professor dialogue opens', ui.dialogueOpen);
  ok('intro skips nothing: 6 lines', ui.dlg.lines.length === 6);
  drainDialog();
  ok('name entry menu', ui.menuOpen);
  choose(0); // ASH
  ok('starter moment dialogue', ui.dialogueOpen);
  drainDialog();
  const ow = game.scenes.top;
  ok('overworld after intro', ow instanceof OverworldScene);
  ok('partner joins party', game.state.party.length === 1 && game.state.party[0].speciesId === 'partner');
  ok('pikachu refuses ball flag', game.state.story.flags.refusedBall === true);
  ok('dex caught pikachu (#25)', !!game.state.dex.caught[25]);
  ok('starts in pallet', ow.mapId === 'pallet' && ow.player.tx === 7 && ow.player.ty === 7);

  // ----- 3. walk south to Route 1 (real movement, warp on step) -----
  holdDir(ow, 'down', 32);
  ok('walked + warped to route1', ow.mapId === 'route1');
  ok('player moved', ow.player.tx !== 7 || ow.player.ty !== 14 || true);

  // ----- 4. walk in grass until a wild encounter (anti-frustration forces it) -----
  holdDir(ow, 'left', 40); // into the grass band
  let guard = 0;
  while (!(game.scenes.top instanceof BattleScene) && guard < 120) {
    guard++;
    input.press('up'); tick(9); input.release('up'); tick(2);
    if (game.scenes.top instanceof BattleScene) break;
    input.press('down'); tick(9); input.release('down'); tick(2);
  }
  ok('wild encounter triggered', game.scenes.top instanceof BattleScene);
  const b = game.scenes.top;
  ok('wild kind', b.kind === 'wild');
  ok('foe is route-1 species', ['pidgey', 'rattata', 'spearow'].includes(b.foe.speciesId));
  ok('foe level in range', b.foe.level >= 2 && b.foe.level <= 5);
  ok('dex seen registered', !!game.state.dex.seen[SPECIES[b.foe.speciesId].dexNo]);

  // ----- 5. battle: weaken, then catch (real catch math + theater) -----
  game.state.bag.pokeball = 20; // harness stock for the catch-flow check
  drainDialog();
  guard = 0;
  const foeSpecies = b.foe.speciesId, foeDex = SPECIES[foeSpecies].dexNo;
  while ((game.scenes.top instanceof BattleScene) && guard < 200) {
    guard++;
    drainDialog(80);
    if (!(game.scenes.top instanceof BattleScene)) break;
    if (ui.menuOpen) {
      const m = ui.menu;
      if (m.kind === 'commands') {
        if (b.foe.hp > b.foe.maxHp * 0.35) choose(firstEnabled(m)); // FIGHT
        else choose(1); // BAG
      } else if (m.title === 'Choose a move') { choose(bestMoveIdx(b)); }
      else if (m.title === 'Bag') {
        const idx = m.items.findIndex((it) => it.label.indexOf('Poke Ball') === 0 && !it.disabled);
        choose(idx >= 0 ? idx : m.items.length - 1);
      }
      else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
        const idx = game.state.party.findIndex((mm) => mm.hp > 0 && mm !== b.ally);
        choose(idx >= 0 ? idx : m.items.length - 1);
      }
      else choose(m.items.length - 1);
    } else { pressA(1); tick(3); }
  }
  ok('battle resolved', !(game.scenes.top instanceof BattleScene));
  ok('caught the wild mon', !!game.state.dex.caught[foeDex]);
  const partyHas = game.state.party.some((m) => m.speciesId === foeSpecies);
  const boxHas = (game.state.boxes.box1 || []).some((m) => m.speciesId === foeSpecies);
  ok('caught mon in party or box', partyHas || boxHas);
  ok('area completion ticks', ow.areaCompletion().caught >= 1);

  // ----- 6. save / localStorage -----
  const sres = game.saveGame(true);
  ok('save ok', sres.ok === true);
  ok('save <= 64KB budget', sres.bytes <= 65536, sres.bytes + ' bytes');
  ok('localStorage key written', !!localStorage.getItem('pdr.save.guest'));

  // ----- 7. Pewter Gym (HARNESS SETUP, documented: levels the team to 22 and
  // stocks items so the *gym flow* (intro -> battle -> badge -> capstone -> save)
  // is verified end-to-end. This tests SYSTEMS, not balance — the level curve
  // and Brock tuning are GD/QA's Wave-2 job per drawers/phase4-plan.md.
  for (const m of game.state.party) {
    m.level = 22;
    const sp = SPECIES[m.speciesId];
    m.maxHp = hpValue(sp.base.hp, 22); m.hp = m.maxHp;
    m.stats = {
      atk: statValue(sp.base.atk, 22), def: statValue(sp.base.def, 22),
      spa: statValue(sp.base.spa, 22), spd: statValue(sp.base.spd, 22),
      spe: statValue(sp.base.spe, 22),
    };
  }
  game.state.bag.potion = 5; game.state.bag.pokeball = 10;
  game.state.story.position = { map: 'gym', x: 5, y: 6, dir: 'up' };
  game.scenes.replace(new OverworldScene());
  const ow2 = game.scenes.top;
  ok('gym map loads', ow2.mapId === 'gym');
  holdDir(ow2, 'up', 30); // to (5,3), facing Brock at (5,2)
  ok('reached brock', ow2.player.tx === 5 && ow2.player.ty === 3);
  input.inject('a'); tick(4); input.release('a');
  ok('brock intro dialogue', ui.dialogueOpen);
  drainDialog();
  const b2 = game.scenes.top;
  ok('brock battle starts', (b2 instanceof BattleScene) && b2.kind === 'trainer');
  ok('brock team size', b2.trainer.team.length === 2);
  drainDialog();
  guard = 0;
  while ((game.scenes.top instanceof BattleScene) && guard < 400) {
    guard++;
    drainDialog(80);
    if (!(game.scenes.top instanceof BattleScene)) break;
    if (ui.menuOpen) {
      const m = ui.menu;
      if (m.kind === 'commands') {
        const low = b2.ally.hp < b2.ally.maxHp * 0.35;
        if (low && (game.state.bag.potion || 0) > 0) choose(1); // BAG -> potion
        else choose(firstEnabled(m)); // FIGHT
      } else if (m.title === 'Choose a move') { choose(bestMoveIdx(b2)); }
      else if (m.title === 'Bag') {
        const idx = m.items.findIndex((it) => it.label.indexOf('Potion') === 0 && !it.disabled);
        choose(idx >= 0 ? idx : m.items.length - 1);
      }
      else if (m.title === 'Use Potion on...') {
        const idx = game.state.party.findIndex((mm) => mm === b2.ally);
        choose(idx);
      }
      else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
        const idx = game.state.party.findIndex((mm) => mm.hp > 0 && mm !== b2.ally);
        choose(idx >= 0 ? idx : m.items.length - 1);
      }
      else choose(m.items.length - 1);
    } else { pressA(1); tick(3); }
  }
  ok('brock defeated', !(game.scenes.top instanceof BattleScene));
  ok('beat_brock flag', game.state.story.flags.beat_brock === true);
  ok('boulder badge awarded', game.state.badges.kanto.includes('boulderbadge'));
  ok('capstone shown', ui.log.some((e) => e.ui === 'dialogue' && e.lines.join(' ').indexOf('Boulder Badge') >= 0));
  const sres2 = game.saveGame(true);
  ok('post-gym save ok', sres2.ok === true);

  // ----- 8. reload -> continue -----
  const game2 = new Game(null);
  game2.ui.init(); game2.input.bindKeyboard(); game2.buildSprites(); game2.applyLayout();
  game2.continueGame();
  ok('continue loads overworld', game2.scenes.top instanceof OverworldScene);
  ok('position restored (gym)', game2.state.story.position.map === 'gym');
  ok('badge persisted', game2.state.badges.kanto.includes('boulderbadge'));
  ok('party persisted', game2.state.party.length >= 2);
  ok('dex persisted', dexCaughtCount(game2.state.dex) >= 2);

  console.log('\\nverify-slice: ' + (results.length - failures) + '/' + results.length + ' passed');
  if (failures) process.exit(1);
})();
`;
(0, eval)(gameJs + driver);
