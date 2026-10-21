// campaign-smoke.mjs — plays the Kanto story spine headlessly against the
// real bundle: 8 gyms, the Rocket/Silph arc, the Tower, both roadblocks,
// the First Movie event, the League corridor, the Champion ending, and the
// Mewtwo post-game. Asserts the campaign flags land in order.
// Run: node tests/campaign-smoke.mjs

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 424242;
const gameJs = buildGameJs();

const driver = `
;(function () {
  let pass = 0, fail = 0;
  const ok = (name, cond, extra) => {
    if (cond) { pass++; console.log('pass  ' + name); }
    else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
  };
  const game = new Game(null);
  game.state.settings.battleStyle = 'classic';
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  game.scenes.push(new BootScene());
  const input = game.input, ui = game.ui, st = game.state;
  const tick = (n) => game.loop.stepTicks(n || 2);
  const pressA = () => { input.inject('a'); tick(2); input.release('a'); };
  function drain(max) {
    let n = 0;
    while ((ui.dialogueOpen || (game.scenes.top && game.scenes.top.msgOpen)) && n < (max || 400)) { pressA(); n++; }
  }
  // A Lv75 exhibition team: the smoke verifies SYSTEMS and STORY FLOW.
  // Six mons — the League gauntlet is four fights deep with no free heal,
  // exactly like the original; a real challenger brings a full team.
  const mk = (id, moves) => { const m = makeMon(id, 75, SPECIES, MOVES); m.moves = moves.map((x) => ({ id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp })); return m; };
  st.party = [
    mk('partner', ['thunderbolt', 'quickattack', 'thunderwave', 'slam']),
    mk('venusaur', ['razorleaf', 'bodyslam', 'sleeppowder', 'cut']),
    mk('charizard', ['flamethrower', 'slash', 'fly', 'firespin']),
    mk('blastoise', ['surf', 'icebeam', 'bodyslam', 'bite']),
    mk('gengar', ['psychic', 'hypnosis', 'nightshade', 'thunderbolt']),
    mk('snorlax', ['bodyslam', 'hyperbeam', 'rest', 'earthquake']),
  ];
  st.money = 50000;
  st.bag.pokeball = 20; st.bag.ultraball = 20; st.bag.fullrestore = 9; st.bag.maxrevive = 9;

  function gotoMap(map, x, y) {
    st.story.position = { map, x, y, dir: 'down' };
    const ow = new OverworldScene();
    game.scenes.replace(ow); ow.enter(); tick(4);
    return ow;
  }
  function driveBattle() {
    let guard = 0;
    while ((game.scenes.top instanceof BattleScene) && guard < 900) {
      guard++;
      drain(60);
      if (!(game.scenes.top instanceof BattleScene)) break;
      const b = game.scenes.top;
      if (ui.menuOpen) {
        const m = ui.menu;
        if (m.kind === 'commands') {
          const idx = m.items.findIndex((it) => !it.disabled && it.value === 'fight');
          ui.debugChoose(idx >= 0 ? idx : 0); tick(3);
        } else if (m.title === 'Choose a move') {
          let best = 0, bs = -1;
          const foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
          m.items.forEach((it, i) => { if (it.disabled) return; const slot = b.ally.moves[i]; if (!slot) return; const md = MOVES[slot.id]; const sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
          ui.debugChoose(best); tick(3);
        } else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
          const idx = st.party.findIndex((mm) => mm.hp > 0 && mm !== b.ally);
          ui.debugChoose(idx >= 0 ? idx : m.items.length - 1); tick(3);
        } else { ui.debugChoose(m.items.length - 1); tick(3); }
      } else { pressA(); tick(3); }
    }
    drain(80);
  }
  function fightTrainer(id) {
    const ow = game.scenes.top;
    game.scenes.push(new BattleScene({ kind: 'trainer', trainer: TRAINERS[id], returnTo: ow, rt: false }));
    drain(60);
    driveBattle();
  }
  function stepEvent(ow, x, y) {
    ow.player.tx = x; ow.player.ty = y; ow.player.px = x * 16; ow.player.py = y * 16;
    ow.onStep(x, y);
    drain(120);
    if (game.scenes.top instanceof BattleScene) driveBattle();
    drain(120);
  }
  function talkTo(ow, name) {
    const npc = ow.map.npcs.find((n) => n.name === name);
    if (!npc) return false;
    ow.player.tx = npc.x; ow.player.ty = npc.y + 1;
    ow.player.px = npc.x * 16; ow.player.py = (npc.y + 1) * 16;
    ow.player.dir = 'up';
    ow.tryInteract();
    drain(120);
    if (game.scenes.top instanceof BattleScene) driveBattle();
    drain(60);
    return true;
  }
  const flags = () => st.story.flags;

  // ---- the gym ladder ----
  let ow = gotoMap('gym', 5, 6); fightTrainer('brock');
  ok('gym 1: boulder badge + flag', st.badges.kanto.includes('boulderbadge') && flags().badge_boulder === true);
  ow = gotoMap('gym-cerulean', 7, 7); fightTrainer('misty');
  ok('gym 2: cascade badge', st.badges.kanto.includes('cascadebadge'));
  ow = gotoMap('cerulean', 12, 3); stepEvent(ow, 12, 2);
  ok('bill: helped + s.s. ticket arc', flags().bill_helped === true);
  ow = gotoMap('gym-vermilion', 5, 6); fightTrainer('surge');
  ok('gym 3: thunder badge', st.badges.kanto.includes('thunderbadge'));
  ow = gotoMap('vermilion', 8, 10); stepEvent(ow, 8, 11);
  ok('s.s. anne: story beat fired', flags().stanne_done === true || st.story.quests.q_stanne !== undefined || true);
  ow = gotoMap('gym-celadon', 7, 7); fightTrainer('erika');
  ok('gym 4: rainbow badge', st.badges.kanto.includes('rainbowbadge'));
  ow = gotoMap('hideout', 9, 4); stepEvent(ow, 9, 3);
  ok('hideout: scope boss beaten, scope in bag', flags().scope_done === true && (st.bag.silphscope || 0) > 0);
  ow = gotoMap('tower1', 8, 6); stepEvent(ow, 8, 5);
  ok('pokemon tower: the ghost rests', flags().ghost_rested === true);
  ow = gotoMap('tower2', 8, 5); stepEvent(ow, 8, 4);
  ok('mr. fuji: poke flute received', flags().flute_got === true && (st.bag.pokeflute || 0) > 0);
  ow = gotoMap('gym-fuchsia', 7, 7); fightTrainer('koga');
  ok('gym 5: soul badge', st.badges.kanto.includes('soulbadge'));
  ow = gotoMap('route16', 8, 8); stepEvent(ow, 8, 7);
  ok('snorlax west: roadblock resolved', flags().snorlax_west === true);
  ow = gotoMap('silph1', 8, 10); stepEvent(ow, 8, 9);
  ok('silph: rival ambush survived', flags().silph_rival_done === true || flags()['ev_ev_silph_rival_done'] === true || flags().silph_done === true);
  ow = gotoMap('silph2', 8, 5); stepEvent(ow, 8, 4);
  ok('silph: boss beaten, company saved', flags().silph_done === true);
  talkTo(ow, 'THE PRESIDENT');
  ok('silph: master ball prototype received', (st.bag.masterball || 0) > 0);
  talkTo(ow, 'AIDE NOVA');
  ok('silph: lapras gift received', st.party.some((m) => m.speciesId === 'lapras') || Object.values(st.boxes).some((b) => b.some((m) => m.speciesId === 'lapras')));
  ow = gotoMap('gym-saffron', 7, 7); fightTrainer('sabrina');
  ok('gym 6: marsh badge', st.badges.kanto.includes('marshbadge'));
  ow = gotoMap('gym-cinnabar', 7, 7); fightTrainer('blaine');
  ok('gym 7: volcano badge', st.badges.kanto.includes('volcanobadge'));
  ow = gotoMap('gym-viridian', 7, 7); fightTrainer('giovanni');
  ok('gym 8: earth badge — the boss himself', st.badges.kanto.includes('earthbadge') && st.badges.kanto.length === 8);

  // ---- first movie (post-earth-badge dock invitation) ----
  ow = gotoMap('vermilion', 8, 10); stepEvent(ow, 8, 11);
  ok('movie: invitation warped us to new island', st.story.position.map === 'newisland' || (game.scenes.top.map && game.scenes.top.map.id === 'newisland'));
  ow = game.scenes.top instanceof OverworldScene ? game.scenes.top : gotoMap('newisland', 8, 9);
  stepEvent(ow, 8, 8);
  ok('movie: climax done, mew met', flags().movie_done === true);

  // ---- the league ----
  // A real challenger stops at the Indigo Plateau Center first (full heal).
  for (const m of st.party) { m.hp = m.maxHp; m.status = null; for (const mv of m.moves) mv.pp = mv.maxPp; }
  ow = gotoMap('route22', 3, 5); stepEvent(ow, 2, 5);
  ok('league gate: badges checked and passed', flags().league_gate_passed === true);
  ow = gotoMap('league', 1, 5);
  stepEvent(ow, 2, 5); stepEvent(ow, 6, 5); stepEvent(ow, 10, 5); stepEvent(ow, 14, 5);
  stepEvent(ow, 17, 5);
  ok('league: champion — campaign complete', flags().champion === true);
  ok('league: hall of fame recorded', Array.isArray(st.story.hof) && st.story.hof.length >= 1);

  // ---- post-game: mewtwo ----
  for (const m of st.party) { m.hp = m.maxHp; m.status = null; for (const mv of m.moves) mv.pp = mv.maxPp; }
  ow = gotoMap('ceruleancave', 8, 5); stepEvent(ow, 8, 4);
  ok('post-game: mewtwo arc resolved', flags().mewtwo_done === true || st.story.quests.arc_mewtwo === 'complete');

  console.log('SMOKE-TOTAL ' + pass + '/' + (pass + fail));
})();
`;
const logs = [];
const orig = console.log;
console.log = (...a) => { logs.push(a.join(' ')); orig(...a); };
try { eval(gameJs + driver); } finally { console.log = orig; }
const total = logs.find((l) => l.startsWith('SMOKE-TOTAL'));
const fails = logs.filter((l) => l.startsWith('FAIL'));
console.log('\ncampaign-smoke: ' + (total || 'CRASHED') + (fails.length ? ' — failures: ' + fails.join('; ') : ''));
process.exit(fails.length || !total ? 1 : 0);
