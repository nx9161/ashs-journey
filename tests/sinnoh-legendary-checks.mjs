// sinnoh-legendary-checks.mjs — Arc 4 Stage S6 (Sinnoh legendary
// arcs x13 + the Tobias rider) proofs. Part A: pure units — the live
// arc register (thirteen entries superseding the story-kanto
// designed stubs, Spiritomb's included), the quest-log step law,
// the catch-only face shapes, the shared roaming function (Mesprit
// + Cresselia, the Latias precedent generalised data-side), the
// rider's authored sets (in sinnoh-story-checks A23 too), the two
// new key items, the Manaphy -> Phione egg data, and the validator
// plumbing. Part B: the built bundle in a headless Game — EVERY arc
// driven end to end: locked before its gate, gate refusal where the
// gate refuses (Regigigas both ways), flee -> re-fire, KO ->
// re-fire, catch -> dex registration + arc completion flag; the
// roamers' landing purity by step count; the Manaphy Egg hatching
// at the band floor through the real step hook and Phione breeding
// out of it; the Gracidea switch on the caught Shaymin; and the
// rider's authored sets READ OFF the live BattleScene foes.
// Run: node tests/sinnoh-legendary-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ================= Part A: pure units =================
const { SINNOH_LEGENDARY_ARCS, SINNOH_EVENTS, SINNOH_TRAINERS, roamLanding, MESPRIT_LANDINGS, CRESSELIA_LANDINGS, HALLOWED_TOWER } = await import(join(ROOT, 'src/data/story-sinnoh.mjs'));
const { LEGENDARY_ARCS: DESIGNED_ARCS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO, SPECIES_HOENN, SPECIES_SINNOH);
const { MAPS9 } = await import(join(ROOT, 'src/data/maps9.mjs'));
const { ITEMS, TM_MOVES } = await import(join(ROOT, 'src/data/items.mjs'));
const { MOVES: MOVES_A } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const ALL_MOVES = Object.assign({}, MOVES_A, MOVES2);
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));

const THIRTEEN = ['arc_uxie', 'arc_mesprit', 'arc_azelf', 'arc_dialga', 'arc_palkia', 'arc_giratina', 'arc_heatran', 'arc_regigigas', 'arc_cresselia', 'arc_darkrai', 'arc_manaphy', 'arc_shaymin', 'arc_spiritomb'];
// Arc 4 Stage S7 supersession: the register gains a FOURTEENTH arc —
// the Arceus capstone (finale-gated, not climax-gated). A01 below is
// re-scoped to the S6 thirteen + the capstone read separately.
const FOURTEEN = THIRTEEN.concat(['arc_arceus']);
const FACE = {
  arc_uxie: ['ev_sinnoh_uxie', 'uxie', 370],
  arc_azelf: ['ev_sinnoh_azelf', 'azelf', 370],
  arc_mesprit: ['ev_sinnoh_mesprit', 'mesprit', 370],
  arc_dialga: ['ev_sinnoh_dialga', 'dialga', 388],
  arc_palkia: ['ev_sinnoh_palkia', 'palkia', 388],
  arc_giratina: ['ev_sinnoh_giratina', 'giratina', 392],
  arc_heatran: ['ev_sinnoh_heatran', 'heatran', 375],
  arc_regigigas: ['ev_sinnoh_regigigas', 'regigigas', 380],
  arc_cresselia: ['ev_sinnoh_cresselia', 'cresselia', 372],
  arc_darkrai: ['ev_sinnoh_darkrai', 'darkrai', 378],
  arc_shaymin: ['ev_sinnoh_shaymin', 'shaymin', 374],
  arc_spiritomb: ['ev_sinnoh_spiritomb', 'spiritomb', 365],
};

{
  ok('A01 the live register carries the thirteen S6 arcs PLUS the S7 Arceus capstone (fourteen, supersedes the S6 exactly-thirteen count), none designedOnly, every species real (dex 442 + 480-488 + 490 + 492 + 493); the designed register in story-kanto carries the arc_spiritomb stub S6 added AND the arc_arceus stub S7 added (the validator-vocabulary pre-registration, Hoenn/Johto precedent)',
    JSON.stringify(Object.keys(SINNOH_LEGENDARY_ARCS).sort()) === JSON.stringify(FOURTEEN.slice().sort())
    && FOURTEEN.every((id) => { const a = SINNOH_LEGENDARY_ARCS[id]; return a && !a.designedOnly && a.region === 'Borea' && SPECIES[a.species]; })
    && JSON.stringify(FOURTEEN.map((id) => SPECIES[SINNOH_LEGENDARY_ARCS[id].species].dexNo).sort((x, y) => x - y)) === JSON.stringify([442, 480, 481, 482, 483, 484, 485, 486, 487, 488, 490, 491, 492, 493])
    && !!DESIGNED_ARCS.arc_spiritomb && DESIGNED_ARCS.arc_spiritomb.designedOnly === true
    && !!DESIGNED_ARCS.arc_arceus && DESIGNED_ARCS.arc_arceus.designedOnly === true);
  ok('A02 every arc states its quest-log requirements: >=2 steps, exactly one catch step naming its own species, every other step flag-keyed and spelled out',
    THIRTEEN.every((id) => { const a = SINNOH_LEGENDARY_ARCS[id];
      return a.steps.length >= 2 && a.steps.filter((s) => s.catch).length === 1
        && a.steps.every((s) => typeof s.text === 'string' && s.text.length > 10 && (s.catch === a.species || (s.flag && !s.catch))); }));
  ok('A03 lairs are shipped maps9 maps (the designed stubs\' dead ids — lunarsummit/seatemple/hallowedtower-as-map — are gone); the two roamers\' lair is the Sinnoh routes field itself',
    THIRTEEN.every((id) => { const a = SINNOH_LEGENDARY_ARCS[id]; return a.lair === 'sinnoh-routes' || !!MAPS9[a.lair]; })
    && SINNOH_LEGENDARY_ARCS.arc_mesprit.lair === 'sinnoh-routes' && SINNOH_LEGENDARY_ARCS.arc_cresselia.lair === 'sinnoh-routes'
    && SINNOH_LEGENDARY_ARCS.arc_giratina.lair === 'turnback-cave' && SINNOH_LEGENDARY_ARCS.arc_regigigas.lair === 'snowpoint-temple-depths'
    && SINNOH_LEGENDARY_ARCS.arc_spiritomb.lair === 'r209' && HALLOWED_TOWER.map === 'r209'
    && [...MAPS9.r209.rows[HALLOWED_TOWER.y]][HALLOWED_TOWER.x] === 'R');
  const faceShape = (evId, arcId, species, level, doneFlag) => {
    const ev = SINNOH_EVENTS[evId]; if (!ev) return false;
    const bi = ev.findIndex((s) => s.wildBattleCatch);
    return bi >= 0 && ev[bi].wildBattleCatch.species === species && ev[bi].wildBattleCatch.level === level && ev[bi].wildBattleCatch.legendary === true
      && ev.slice(bi + 1).some((s) => s.arc === arcId && s.stage === 'complete')
      && ev.slice(bi + 1).some((s) => s.flag === doneFlag)
      && ev.slice(0, bi).some((s) => s.arc === arcId && s.stage === 'active')
      && ev.every((s) => !s.wildBattle && !s.battle && !s.battleAny)
      && level >= 301 && level <= 400;
  };
  ok('A04 the twelve wild faces ride the catch-only chain at their band levels (Spiritomb 365, lake trio 370, Cresselia 372, Shaymin 374, Heatran 375, Darkrai 378, Regigigas 380, Dialga/Palkia 388, Giratina 392), arc-complete + done flags strictly AFTER the battle step; Darkrai\'s inn event carries the same face after its Canalave sleep + the warp to Newmoon Island, with darkrai_inn_done set BEFORE the warp (the re-fire face is ev_sinnoh_darkrai)',
    Object.entries(FACE).every(([id, [evId, sp, lv]]) => faceShape(evId, id, sp, lv, id + '_done'))
    && (() => { const ev = SINNOH_EVENTS.ev_sinnoh_darkrai_inn; if (!ev) return false;
      const wi = ev.findIndex((s) => s.warp && s.warp.map === 'newmoon-island');
      const bi = ev.findIndex((s) => s.wildBattleCatch);
      const fi = ev.findIndex((s) => s.flag === 'darkrai_inn_done');
      return wi > 0 && bi > wi && fi >= 0 && fi < wi && ev[bi].wildBattleCatch.species === 'darkrai' && ev[bi].wildBattleCatch.level === 378; })());
  ok('A05 Manaphy is egg-only: NO event anywhere carries a wildBattleCatch for manaphy (its face is a hatch); its arc step names the egg collection flag, and the two accompaniment events are dialogue-only (the Mesprit/Cresselia meetings set their roaming flags; the Magma Stone event sets magma_stone_returned with NO battle)',
    Object.values(SINNOH_EVENTS).every((ev) => !ev.some((s) => s.wildBattleCatch && s.wildBattleCatch.species === 'manaphy'))
    && SINNOH_LEGENDARY_ARCS.arc_manaphy.steps.some((s) => s.flag === 'manaphy_egg_received')
    && SINNOH_EVENTS.ev_sinnoh_mesprit_meet.every((s) => !s.wildBattleCatch && !s.battle) && SINNOH_EVENTS.ev_sinnoh_mesprit_meet.some((s) => s.flag === 'mesprit_roaming')
    && SINNOH_EVENTS.ev_sinnoh_cresselia_meet.every((s) => !s.wildBattleCatch && !s.battle) && SINNOH_EVENTS.ev_sinnoh_cresselia_meet.some((s) => s.flag === 'cresselia_roaming')
    && SINNOH_EVENTS.ev_sinnoh_magma_stone.every((s) => !s.wildBattleCatch && !s.battle) && SINNOH_EVENTS.ev_sinnoh_magma_stone.some((s) => s.flag === 'magma_stone_returned'));
  ok('A06 the roaming idiom is ONE shared pure function (roamLanding over the persisted step counter): same steps -> same map for both roamers; the two landing sets are disjoint shipped route maps; a full 250-step cycle visits every landing exactly once per roamer',
    [0, 49, 50, 12345].every((n) => roamLanding(n, MESPRIT_LANDINGS) === roamLanding(n, MESPRIT_LANDINGS) && roamLanding(n, CRESSELIA_LANDINGS) === roamLanding(n, CRESSELIA_LANDINGS))
    && MESPRIT_LANDINGS.every((m) => !!MAPS9[m] && !CRESSELIA_LANDINGS.includes(m)) && CRESSELIA_LANDINGS.every((m) => !!MAPS9[m])
    && new Set([0, 50, 100, 150, 200].map((n) => roamLanding(n, MESPRIT_LANDINGS))).size === 5
    && new Set([0, 50, 100, 150, 200].map((n) => roamLanding(n, CRESSELIA_LANDINGS))).size === 5
    && roamLanding(0, MESPRIT_LANDINGS) === 'r201' && roamLanding(100, MESPRIT_LANDINGS) === 'r210' && roamLanding(0, CRESSELIA_LANDINGS) === 'r218');
  const poolOf = (sp, lvl) => {
    const e = SPECIES[sp]; const pool = new Set();
    for (const [l0, ids] of Object.entries(e.learnset)) if (+l0 <= lvl) for (const id of [].concat(ids || [])) pool.add(id);
    for (const t of (e.tm || [])) if (TM_MOVES[t]) pool.add(TM_MOVES[t]);
    return pool;
  };
  const riderOk = (def, sp, lvl) => {
    const mv = (def.team[0] && def.team[0].moves) || [];
    const pool = poolOf(sp, lvl);
    return mv.length >= 2 && mv.every((id) => !!ALL_MOVES[id] && pool.has(id))
      && mv.filter((id) => (ALL_MOVES[id].power || 0) > 0).length >= 2;
  };
  ok('A07 the RIDER, data side: Tobias\'s Darkrai (390) + Latios (392) carry explicitly authored move sets; every authored move is in its species\' legal in-table pool (band learnset + TM list) and each ace carries >= 2 damaging moves (the sinnoh-story A23 pin reads the same law)',
    riderOk(SINNOH_TRAINERS.tobias_darkrai, 'darkrai', 390) && riderOk(SINNOH_TRAINERS.tobias_latios, 'latios', 392)
    && JSON.stringify(SINNOH_TRAINERS.tobias_darkrai.team[0].moves) === JSON.stringify(['hypnosis', 'dreameater', 'fireblast', 'hyperbeam'])
    && JSON.stringify(SINNOH_TRAINERS.tobias_latios.team[0].moves) === JSON.stringify(['psychic', 'icebeam', 'thunderbolt', 'recover']));
  const t6 = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); } catch (e) { checkOut = String(e.stdout || ''); }
  ok('A08 the two new key items exist (oddkeystone + oaksletter, key pocket, never consumed); tables.json in sync via the tool (items 200 — 199 + the Azure Flute, Arc 4 Stage S7; the quest vocabulary carries arc_spiritomb + arc_arceus); NO member-card/magma-stone item was invented for Darkrai/Heatran',
    ITEMS.oddkeystone && ITEMS.oddkeystone.pocket === 'key' && ITEMS.oaksletter && ITEMS.oaksletter.pocket === 'key'
    && Object.keys(ITEMS).length === 200 && t6.items.length === 200 && t6.quests.includes('arc_spiritomb') && t6.quests.includes('arc_arceus') && t6.items.includes('azureflute')
    && checkOut.includes('tables.json OK') && !ITEMS.membercard && !ITEMS.magmastone);
  ok('A09 the Regigigas quest-log step SAYS the gate: it names Regirock, Regice AND Registeel and the words "in your party" (the spelled-out requirement the S6 handler reads live)',
    (() => { const s = SINNOH_LEGENDARY_ARCS.arc_regigigas.steps[0]; return s.flag === 'regi_trio_present' && /Regirock/.test(s.text) && /Regice/.test(s.text) && /Registeel/.test(s.text) && /in your party/i.test(s.text); })());
  ok('A10 the Manaphy -> Phione breeding data (the S1 assumption, corrected by S6): manaphy declares eggSpecies phione (its eggs hatch Phione, canon), phione is a real dex-489 entry, and manaphy is genuinely breedable (egg groups water1/fairy, not no-eggs)',
    SPECIES_SINNOH.manaphy.eggSpecies === 'phione' && SPECIES_SINNOH.phione && SPECIES_SINNOH.phione.dexNo === 489
    && SPECIES_SINNOH.manaphy.dexNo === 490 && !SPECIES_SINNOH.manaphy.eggGroups.includes('no-eggs'));
  ok('A11 a Sinnoh save carrying the new items + an arc_spiritomb quest state + in-band one-of-ones (Giratina 392, Manaphy 301, Phione 301) validates client + server',
    (() => { const st = clone(defaultState());
      st.story.arc = 'sinnoh'; st.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn'];
      st.story.quests.arc_spiritomb = 'active';
      st.bag.oddkeystone = 1; st.bag.oaksletter = 1;
      st.party = [makeMon('giratina', 392, SPECIES, ALL_MOVES), makeMon('manaphy', 301, SPECIES, ALL_MOVES), makeMon('phione', 301, SPECIES, ALL_MOVES)];
      return SCH.validateSave(clone(st)).ok && VAL.validateSave(clone(st)).ok; })());
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
const gameJs = buildGameJs();
const memStore = {};
globalThis.localStorage = {
  getItem: (k) => (k in memStore ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
globalThis.__SEED__ = 20261029;
globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };

const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('JS-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('js-pass ' + name);
  }
  function mkGame(seed) {
    globalThis.__QFRESET__();
    globalThis.__SEED__ = seed;
    var g = new Game(null);
    g.state.settings.battleStyle = 'classic';
    g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout();
    return g;
  }
  function tk(g, n) { g.loop.stepTicks(n || 2); }
  function pA(g) { g.input.inject('a'); tk(g, 2); g.input.release('a'); }
  function drain(g) { var n = 0; while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && n < 500) { pA(g); n++; } }
  function boot(g) {
    g.scenes.push(new BootScene());
    g.loop.stepMs(3100); tk(g, 2);
    pA(g); pA(g); pA(g);
    drain(g); g.ui.debugChoose(0); tk(g, 3); drain(g);
    return g.scenes.top;
  }
  function gotoMap(g, map, x, y) {
    if (x === undefined) { var st0 = MAPS[map].start; x = st0.x; y = st0.y; }
    g.state.story.position = { map: map, x: x, y: y, dir: 'down' };
    var ow = new OverworldScene();
    g.scenes.replace(ow); ow.enter(); tk(g, 4);
    return ow;
  }
  function strongTeam(g, level) {
    var mk = function (id, moves) { var m = makeMon(id, level, SPECIES, MOVES); m.moves = moves.map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; }); return m; };
    g.state.party = [
      mk('partner', ['thunderbolt', 'quickattack', 'thunderwave', 'slam']),
      mk('venusaur', ['razorleaf', 'bodyslam', 'sleeppowder', 'solarbeam']),
      mk('charizard', ['flamethrower', 'slash', 'fly', 'firespin']),
      mk('blastoise', ['surf', 'icebeam', 'bodyslam', 'bite']),
      mk('gengar', ['psychic', 'hypnosis', 'nightshade', 'thunderbolt']),
      mk('snorlax', ['bodyslam', 'hyperbeam', 'rest', 'earthquake']),
    ];
    g.state.bag.fullrestore = 9; g.state.bag.maxrevive = 9;
  }
  function healParty(g) { g.state.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); }); }
  function drainToBattle(g) {
    var n = 0;
    while (!(g.scenes.top instanceof BattleScene) && n < 400) {
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) break;
      tk(g, 2); n++;
    }
    return g.scenes.top instanceof BattleScene;
  }
  function attemptBall(g, ballId) {
    var guard = 0, threw = false;
    while (guard++ < 300) {
      if (!(g.scenes.top instanceof BattleScene)) break;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (!threw) {
          var bi = m.items.findIndex(function (it) { return !it.disabled && it.value === 'bag'; });
          var ti = m.items.findIndex(function (it) { return !it.disabled && it.value === ballId; });
          if (ti >= 0) { g.ui.debugChoose(ti); tk(g, 3); threw = true; continue; }
          if (bi >= 0) { g.ui.debugChoose(bi); tk(g, 3); continue; }
          break;
        }
        break;
      }
      pA(g); tk(g, 3);
    }
    return threw;
  }
  function catchWithBall(g) {
    var n = 0;
    while ((g.scenes.top instanceof BattleScene) && n++ < 4) { attemptBall(g, 'masterball'); }
    drain(g);
    return !(g.scenes.top instanceof BattleScene);
  }
  function driveFlee(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 900) {
      guard++;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        var ri = m.items.findIndex(function (it) { return !it.disabled && it.value === 'run'; });
        if (ri >= 0) { g.ui.debugChoose(ri); tk(g, 3); continue; }
        var fi = m.items.findIndex(function (it) { return !it.disabled && it.value === 'fight'; });
        if (fi >= 0) { break; }
        g.ui.debugChoose(m.items.length - 1); tk(g, 3); continue;
      }
      pA(g); tk(g, 3);
    }
    drain(g);
    return !(g.scenes.top instanceof BattleScene);
  }
  // Drive the current battle to a WIN by fainting the foe (the
  // sinnoh-story idiom): Fight -> the lead's first move, turn after
  // turn, switching the next healthy member in when one faints.
  function driveBattle(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 1200) {
      guard++;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        var pick = -1;
        for (var i = 0; i < m.items.length; i++) if (!m.items[i].disabled && m.items[i].value != null) { pick = i; break; }
        if (pick < 0) break;
        g.ui.debugChoose(pick); tk(g, 3); continue;
      }
      pA(g); tk(g, 3);
    }
    drain(g);
    return !(g.scenes.top instanceof BattleScene);
  }
  function pump(g, cap) {
    var guard = 0;
    while (guard++ < (cap || 300)) {
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) {
        var items = g.ui.menu.items;
        var yi = items.findIndex(function (it) { return !it.disabled && it.value === 'yes'; });
        var fi = items.findIndex(function (it) { return !it.disabled && it.value !== null && it.value !== 'close'; });
        var pick = yi >= 0 ? yi : fi;
        if (pick < 0) break;
        g.ui.debugChoose(pick); tk(g, 3);
        continue;
      }
      break;
    }
    drain(g);
  }
  function talkName(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    ow.sysNpc(npc);
    return npc;
  }
  function foeIs(g, sp, lv) {
    var b = g.scenes.top;
    return (b instanceof BattleScene) && b.foe && b.foe.speciesId === sp && b.foe.level === lv;
  }
  // A Sinnoh-complete save skeleton: the arc machine at Sinnoh, all
  // four regions' badges, a band-ceiling team, Master Balls. Each
  // block opts into exactly the gate flags it exercises.
  function legendGame(seed) {
    var gg = mkGame(seed); boot(gg); strongTeam(gg, 395);
    var ss = gg.state;
    ss.story.arc = 'sinnoh'; ss.story.region = 'sinnoh';
    ss.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn'];
    ss.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
    ss.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
    ss.badges.johto = ['zephyrbadge','hivebadge','plainbadge','fogbadge','stormbadge','mineralbadge','glacierbadge','risingbadge'];
    ss.badges.hoenn = ['stonebadge','knucklebadge','dynamobadge','heatbadge','balancebadge','featherbadge','mindbadge','rainbadge'];
    ss.badges.sinnoh = ['coalbadge','forestbadge','relicbadge','cobblebadge','fenbadge','minebadge','iciclebadge','beaconbadge'];
    ss.bag.masterball = 99;
    ss.story.flags.sinnoh_arrival = true; // a Sinnoh save has long since landed (Rowan's door reads it)
    return [gg, ss];
  }

  ok('B01 the merge fold landed in the bundle: all thirteen LEGENDARY_ARCS entries are LIVE (no designedOnly), the stubs superseded (Giratina lair is the shipped turnback-cave, Regigigas the temple depths, Spiritomb r209)',
    ['arc_uxie','arc_mesprit','arc_azelf','arc_dialga','arc_palkia','arc_giratina','arc_heatran','arc_regigigas','arc_cresselia','arc_darkrai','arc_manaphy','arc_shaymin','arc_spiritomb'].every(function (id) {
      var a = LEGENDARY_ARCS[id]; return a && !a.designedOnly && a.region === 'Borea';
    }) && LEGENDARY_ARCS.arc_giratina.lair === 'turnback-cave' && LEGENDARY_ARCS.arc_regigigas.lair === 'snowpoint-temple-depths' && LEGENDARY_ARCS.arc_spiritomb.lair === 'r209');

  // ---- B02: Uxie — locked, flee, KO, catch ----
  {
    var [g, st] = legendGame(801);
    var ow = gotoMap(g, 'lake-acuity-cave'); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene) && st.story.quests.arc_uxie === undefined && !st.story.flags.arc_uxie_done;
    st.story.flags.sinnoh_climax_resolved = true;
    ow = gotoMap(g, 'lake-acuity-cave');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'uxie', 370);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_uxie_done && !st.dex.caught[SPECIES.uxie.dexNo];
    ow = gotoMap(g, 'lake-acuity-cave');
    var met2 = drainToBattle(g);
    driveBattle(g); healParty(g);
    var koOk = met2 && !st.story.flags.arc_uxie_done && !st.dex.caught[SPECIES.uxie.dexNo];
    ow = gotoMap(g, 'lake-acuity-cave');
    var met3 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B02 Uxie (Acuity Cavern, Lv 370): silent + undiscovered before the climax; the face fires post-climax; FLEE re-fires; KO re-fires (nothing dex-locks); the catch completes the arc + registers the dex + completes the Quest Log entry',
      locked && met && fledOk && koOk && met3
      && st.story.flags.arc_uxie_done === true && st.story.quests.arc_uxie === 'complete' && !!st.dex.caught[SPECIES.uxie.dexNo],
      'locked=' + locked + ' met=' + met + ' foe=' + foeOk + ' fled=' + fledOk + ' ko=' + koOk + ' met3=' + met3);
  }

  // ---- B03: Azelf — flee, catch ----
  {
    var [g, st] = legendGame(802);
    st.story.flags.sinnoh_climax_resolved = true;
    var ow = gotoMap(g, 'lake-valor-cave');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'azelf', 370);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_azelf_done;
    ow = gotoMap(g, 'lake-valor-cave');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B03 Azelf (Valor Cavern, Lv 370): the face fires post-climax; flee re-fires; the catch completes the arc + dex',
      met && fledOk && met2 && st.story.flags.arc_azelf_done === true && st.story.quests.arc_azelf === 'complete' && !!st.dex.caught[SPECIES.azelf.dexNo]);
  }

  // ---- B04: Mesprit — the meeting, then the roaming purity ----
  {
    var [g, st] = legendGame(803);
    st.story.flags.sinnoh_climax_resolved = true;
    st.stepsTotal = 0;
    var ow = gotoMap(g, 'r201'); pump(g);
    var noFaceYet = !(g.scenes.top instanceof BattleScene) && !st.story.flags.mesprit_roaming;
    ow = gotoMap(g, 'lake-verity-cave'); pump(g);
    var met0 = st.story.flags.mesprit_roaming === true && !(g.scenes.top instanceof BattleScene) && st.story.quests.arc_mesprit === 'active';
    ow = gotoMap(g, 'r201');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'mesprit', 370);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_mesprit_done;
    st.stepsTotal = 100; // landing turns to index 2 (r210)
    ow = gotoMap(g, 'r205'); pump(g);
    var wrongLanding = !(g.scenes.top instanceof BattleScene);
    ow = gotoMap(g, 'r210');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B04 Mesprit ROAMS (the Latias precedent): no face anywhere before the Verity Cavern meeting; the meeting sets her roaming (no battle); stepsTotal 0 -> she holds r201; flee; stepsTotal 100 -> r205 is empty and r210 holds her; the catch completes the arc + dex',
      noFaceYet && met0 && met && fledOk && wrongLanding && met2
      && st.story.flags.arc_mesprit_done === true && !!st.dex.caught[SPECIES.mesprit.dexNo],
      'pre=' + noFaceYet + ' meet=' + met0 + ' met=' + met + ' fled=' + fledOk + ' wrong=' + wrongLanding + ' met2=' + met2);
  }

  // ---- B05: Dialga, then Palkia (the pillar's order) ----
  {
    var [g, st] = legendGame(804);
    var ow = gotoMap(g, 'spear-pillar'); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene);
    st.story.flags.sinnoh_climax_resolved = true;
    st.story.flags.dialga_unlocked = true;
    st.story.flags.palkia_unlocked = true;
    st.story.flags.spear_pillar_done = true;
    ow = gotoMap(g, 'spear-pillar');
    var met = drainToBattle(g);
    var firstIsDialga = foeIs(g, 'dialga', 388);
    driveFlee(g); healParty(g);
    ow = gotoMap(g, 'spear-pillar');
    var met2 = drainToBattle(g);
    var stillDialga = foeIs(g, 'dialga', 388);
    catchWithBall(g); pump(g);
    var dialgaDone = st.story.flags.arc_dialga_done === true && !!st.dex.caught[SPECIES.dialga.dexNo];
    ow = gotoMap(g, 'spear-pillar');
    var met3 = drainToBattle(g);
    var thenPalkia = foeIs(g, 'palkia', 388);
    catchWithBall(g); pump(g);
    ok('B05 Dialga + Palkia (Spear Pillar, Lv 388): nothing before the climax flag; Dialga faces first, flee re-fires Dialga (Palkia never jumps the order); after Dialga\\'s catch, Palkia keeps the second appointment; both arcs complete + dex',
      locked && met && firstIsDialga && met2 && stillDialga && dialgaDone && met3 && thenPalkia
      && st.story.flags.arc_palkia_done === true && !!st.dex.caught[SPECIES.palkia.dexNo]);
  }

  // ---- B06: Giratina at Turnback Cave ----
  {
    var [g, st] = legendGame(805);
    st.story.flags.sinnoh_climax_resolved = true;
    var ow = gotoMap(g, 'turnback-cave'); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_giratina_done;
    st.story.flags.giratina_unlocked = true;
    ow = gotoMap(g, 'turnback-cave');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'giratina', 392);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_giratina_done;
    ow = gotoMap(g, 'turnback-cave');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B06 Giratina (Turnback Cave, Lv 392 — the recorded lair call): no face without the climax\\'s giratina_unlocked; the face fires with it; flee re-fires; the catch completes the arc + dex',
      locked && met && fledOk && met2 && st.story.flags.arc_giratina_done === true && !!st.dex.caught[SPECIES.giratina.dexNo]);
  }

  // ---- B07: Heatran — Buck, the stone, the revisit ----
  {
    var [g, st] = legendGame(806);
    var ow = gotoMap(g, 'survival-area'); pump(g);
    talkName(g, ow, 'BUCK'); pump(g);
    var preClimax = !st.story.flags.buck_met;
    st.story.flags.sinnoh_climax_resolved = true;
    ow = gotoMap(g, 'stark-interior'); pump(g);
    var noStoneYet = !st.story.flags.magma_stone_returned && !(g.scenes.top instanceof BattleScene);
    ow = gotoMap(g, 'survival-area'); pump(g);
    talkName(g, ow, 'BUCK'); pump(g);
    var buckOk = st.story.flags.buck_met === true && st.story.quests.arc_heatran === 'discovered';
    ow = gotoMap(g, 'stark-interior'); pump(g);
    var stoneOk = st.story.flags.magma_stone_returned === true && !(g.scenes.top instanceof BattleScene) && st.story.quests.arc_heatran === 'active';
    ow = gotoMap(g, 'survival-area'); pump(g);
    ow = gotoMap(g, 'stark-interior');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'heatran', 375);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_heatran_done;
    ow = gotoMap(g, 'stark-interior');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B07 Heatran (Stark Mountain, Lv 375): Buck is flavour-only pre-climax and the Crater Hall is inert before him; meeting Buck discovers the arc; the first climb RETURNS THE MAGMA STONE with him (dialogue, no battle); the REVISIT wakes Heatran; flee re-fires; the catch completes',
      preClimax && noStoneYet && buckOk && stoneOk && met && fledOk && met2
      && st.story.flags.arc_heatran_done === true && !!st.dex.caught[SPECIES.heatran.dexNo],
      'pre=' + preClimax + ' noStone=' + noStoneYet + ' buck=' + buckOk + ' stone=' + stoneOk + ' met=' + met + ' fled=' + fledOk);
  }

  // ---- B08: Regigigas — the gate, both ways ----
  {
    var [g, st] = legendGame(807);
    var ow = gotoMap(g, 'snowpoint-temple-depths'); pump(g);
    var refused0 = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_regigigas_done && st.story.quests.arc_regigigas === 'discovered';
    var keep = st.party.slice();
    st.party = [makeMon('regirock', 380, SPECIES, MOVES), makeMon('regice', 380, SPECIES, MOVES)].concat(keep.slice(0, 4));
    ow = gotoMap(g, 'snowpoint-temple-depths'); pump(g);
    var refused2 = !(g.scenes.top instanceof BattleScene) && !st.story.flags.regi_trio_present;
    st.party = [makeMon('regirock', 380, SPECIES, MOVES), makeMon('regice', 380, SPECIES, MOVES), makeMon('registeel', 380, SPECIES, MOVES)].concat(keep.slice(0, 3));
    ow = gotoMap(g, 'snowpoint-temple-depths');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'regigigas', 380);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_regigigas_done;
    ow = gotoMap(g, 'snowpoint-temple-depths');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B08 Regigigas (Snowpoint Temple depths, Lv 380): the statue REFUSES with none of the three in the party (the keeper\\'s note names the gate; the arc discovers but nothing fires), refuses again with only two; with Regirock + Regice + Registeel IN THE PARTY the statue wakes; flee re-fires; the catch completes + dex',
      refused0 && refused2 && met && fledOk && met2
      && st.story.flags.arc_regigigas_done === true && !!st.dex.caught[SPECIES.regigigas.dexNo],
      'r0=' + refused0 + ' r2=' + refused2 + ' met=' + met + ' foe=' + foeOk + ' fled=' + fledOk);
  }

  // ---- B09: Cresselia — the meeting, then the crescent trail ----
  {
    var [g, st] = legendGame(808);
    st.story.flags.sinnoh_climax_resolved = true;
    st.story.flags.cresselia_glimpsed = true;
    st.story.flags.darkrai_beat_done = true;
    st.story.flags.lunar_wing_received = true;
    st.stepsTotal = 0;
    var ow = gotoMap(g, 'fullmoon-island'); pump(g);
    var meetOk = st.story.flags.cresselia_roaming === true && !(g.scenes.top instanceof BattleScene);
    ow = gotoMap(g, 'r218');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'cresselia', 372);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_cresselia_done;
    ow = gotoMap(g, 'r218');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B09 Cresselia ROAMS (the recorded call — the shared idiom, second roamer): the Fullmoon meeting (post-climax, S5b\\'s beat behind her) sets her roaming with no battle; stepsTotal 0 -> she holds r218; flee re-fires on the same landing; the catch completes the arc + dex',
      meetOk && met && fledOk && met2 && st.story.flags.arc_cresselia_done === true && !!st.dex.caught[SPECIES.cresselia.dexNo],
      'meet=' + meetOk + ' met=' + met + ' foe=' + foeOk + ' fled=' + fledOk);
  }

  // ---- B10: Darkrai — the inn, the dream, the island ----
  {
    var [g, st] = legendGame(809);
    st.story.flags.darkrai_unlocked = true;
    var ow = gotoMap(g, 'house-canalave'); pump(g);
    var lockedInn = !st.story.flags.darkrai_inn_done && !(g.scenes.top instanceof BattleScene);
    st.story.flags.sinnoh_complete = true;
    ow = gotoMap(g, 'house-canalave'); pump(g); // the ARC COMPLETE card plays out on this entry (the S6 block yields to it)
    ow = gotoMap(g, 'house-canalave');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'darkrai', 378);
    var onNewmoon = st.story.position.map === 'newmoon-island' && st.story.flags.darkrai_inn_done === true;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_darkrai_done;
    ow = gotoMap(g, 'newmoon-island');
    var met2 = drainToBattle(g);
    var foe2 = foeIs(g, 'darkrai', 378);
    driveBattle(g); healParty(g);
    var koOk = met2 && foe2 && !st.story.flags.arc_darkrai_done && !st.dex.caught[SPECIES.darkrai.dexNo];
    ow = gotoMap(g, 'newmoon-island');
    var met3 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B10 Darkrai (Newmoon Island, Lv 378): the Canalave inn stays shut without sinnoh_complete; the sleep event (no distribution item — the unlocked boy + the finished Conference are the key) warps the dreamer to Newmoon and the face fires IN the dream; flee leaves the player on the island and the standalone face re-fires; KO re-fires; the catch completes the arc + dex',
      lockedInn && met && onNewmoon && fledOk && koOk && met3
      && st.story.flags.arc_darkrai_done === true && st.story.quests.arc_darkrai === 'complete' && !!st.dex.caught[SPECIES.darkrai.dexNo],
      'locked=' + lockedInn + ' met=' + met + ' foe=' + foeOk + ' newmoon=' + onNewmoon + ' fled=' + fledOk + ' ko=' + koOk);
  }

  // ---- B11: Manaphy — the Egg, the hatch, and Phione ----
  {
    var [g, st] = legendGame(810);
    st.story.flags.sinnoh_complete = true;
    var ow = gotoMap(g, 'rowan-lab'); pump(g);
    talkName(g, ow, 'PROF. ROWAN'); pump(g);
    var egg = st.party.find(function (m) { return m && m.egg && m.speciesId === 'manaphy'; });
    if (!egg) Object.values(st.boxes || {}).forEach(function (b) { (b || []).forEach(function (m) { if (m && m.egg && m.speciesId === 'manaphy') egg = m; }); });
    var eggOk = !!egg && egg.eggSteps === 250 && st.story.flags.manaphy_egg_received === true && st.story.quests.arc_manaphy === 'active';
    // Carry the Egg in the party for the hatch walk (it rested in
    // the PC box — the party was full when Rowan handed it over).
    if (egg && !st.party.includes(egg)) {
      Object.values(st.boxes || {}).forEach(function (b) { var i = (b || []).indexOf(egg); if (i >= 0) b.splice(i, 1); });
      st.party = st.party.slice(0, 5); st.party.push(egg);
    }
    talkName(g, ow, 'PROF. ROWAN'); pump(g);
    var letterOk = st.story.flags.oaks_letter_received === true && (st.bag.oaksletter || 0) === 1 && st.story.quests.arc_shaymin === 'discovered';
    var ticks = 0;
    while (!st.dex.caught[SPECIES.manaphy.dexNo] && ticks < 400) { johtoStepTick(st); ticks++; }
    var hatched = st.party.find(function (m) { return m && !m.egg && m.speciesId === 'manaphy'; });
    var hatchOk = !!hatched && hatched.level === 301 && !!st.dex.caught[SPECIES.manaphy.dexNo];
    ow = gotoMap(g, 'twinleaf'); pump(g);
    var arcOk = st.story.flags.arc_manaphy_done === true && st.story.quests.arc_manaphy === 'complete';
    // Breed it: Manaphy + Ditto at the Day-Care -> a PHIONE egg.
    var ditto = makeMon('ditto', 350, SPECIES, MOVES);
    var mi = st.party.findIndex(function (m) { return m && m.speciesId === 'manaphy'; });
    st.party.push(ditto);
    var di = st.party.length - 1;
    depositToDaycare(st, mi); depositToDaycare(st, di - 1);
    var bTicks = 0;
    while (!st.daycareEgg && bTicks < 600) { johtoStepTick(st); bTicks++; }
    var phioneEggOk = !!(st.daycareEgg && st.daycareEgg.speciesId === 'phione');
    var got = collectDaycareEgg(st);
    var gotOk = !!got;
    var pTicks = 0;
    while (!st.dex.caught[SPECIES.phione.dexNo] && pTicks < 1200) { johtoStepTick(st); pTicks++; }
    var phione = null;
    st.party.forEach(function (m) { if (m && m.speciesId === 'phione') phione = m; });
    Object.values(st.boxes || {}).forEach(function (b) { (b || []).forEach(function (m) { if (m && m.speciesId === 'phione') phione = m; }); });
    ok('B11 Manaphy (the Egg): Rowan hands over the Ranger-delivered blue Egg post-Conference (party, 250 steps) and Oak\\'s Letter on the second talk; the REAL step hook hatches Manaphy at the band floor 301 (dex 490) and the arc completes on the hatch; Manaphy + Ditto at the Day-Care produce an egg whose species is PHIONE, and it hatches Phione at 301 (dex 489) — the shipped breeding, data-corrected',
      eggOk && letterOk && hatchOk && arcOk && phioneEggOk && gotOk && !!phione && phione.level === 301 && !!st.dex.caught[SPECIES.phione.dexNo],
      'egg=' + eggOk + ' letter=' + letterOk + ' hatch=' + hatchOk + ' arc=' + arcOk + ' phioneEgg=' + phioneEggOk + ' got=' + gotOk);
  }

  // ---- B12: Shaymin — the letter gate + the Gracidea switch ----
  {
    var [g, st] = legendGame(811);
    st.story.flags.sinnoh_complete = true;
    var ow = gotoMap(g, 'flower-paradise'); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene);
    st.story.flags.oaks_letter_received = true; st.bag.oaksletter = 1;
    ow = gotoMap(g, 'flower-paradise');
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'shaymin', 374);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_shaymin_done;
    ow = gotoMap(g, 'flower-paradise');
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    var caughtOk = st.story.flags.arc_shaymin_done === true && !!st.dex.caught[SPECIES.shaymin.dexNo];
    var shay = null;
    st.party.forEach(function (m) { if (m && m.speciesId === 'shaymin') shay = m; });
    Object.values(st.boxes || {}).forEach(function (b) { (b || []).forEach(function (m) { if (m && m.speciesId === 'shaymin') shay = m; }); });
    st.party = [shay].concat(st.party.filter(function (m) { return m !== shay; }).slice(0, 5));
    st.bag.gracidea = 1;
    g.useBagItem('gracidea'); tk(g, 2);
    if (g.ui.menuOpen) { var gi = g.ui.menu.items.findIndex(function (it) { return !it.disabled && it.value === 0; }); if (gi >= 0) g.ui.debugChoose(gi); tk(g, 3); }
    drain(g);
    var skyOk = shay.speciesId === 'shayminsky';
    g.useBagItem('gracidea'); tk(g, 2);
    if (g.ui.menuOpen) { var gj = g.ui.menu.items.findIndex(function (it) { return !it.disabled && it.value === 0; }); if (gj >= 0) g.ui.debugChoose(gj); tk(g, 3); }
    drain(g);
    ok('B12 Shaymin (Flower Paradise, Lv 374): the meadow is inert without Oak\\'s Letter; with it the face fires; flee re-fires; the catch completes the arc + dex — and the S4 Gracidea switch works on the caught Shaymin (land -> sky -> land, flower never consumed)',
      locked && met && fledOk && met2 && caughtOk && skyOk && shay.speciesId === 'shaymin' && st.bag.gracidea === 1,
      'locked=' + locked + ' met=' + met + ' fled=' + fledOk + ' caught=' + caughtOk + ' sky=' + skyOk);
  }

  // ---- B13: Spiritomb — keystone, tower, summoning ----
  {
    var [g, st] = legendGame(812);
    var ow = gotoMap(g, 'r209'); pump(g);
    var faceTower = function () {
      ow.player.tx = 13; ow.player.ty = 6; ow.player.fx = 13; ow.player.fy = 6;
      ow.player.px = 13 * TILE; ow.player.py = 6 * TILE; ow.player.dir = 'right';
      ow.tryInteract(); tk(g, 2); drain(g);
    };
    faceTower();
    var noStone = !(g.scenes.top instanceof BattleScene) && !st.story.flags.odd_keystone_received && (st.bag.oddkeystone || 0) === 0;
    talkName(g, ow, 'TRAVELLER MAREN'); pump(g);
    var giftOk = st.story.flags.odd_keystone_received === true && (st.bag.oddkeystone || 0) === 1 && st.story.quests.arc_spiritomb === 'discovered';
    faceTower();
    var met = drainToBattle(g);
    var foeOk = foeIs(g, 'spiritomb', 365);
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_spiritomb_done;
    faceTower();
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B13 Spiritomb (the Hallowed Tower, Route 209, Lv 365): the tower without the keystone is scenery (a description, no battle); the traveller\\'s gift grants the Odd Keystone + discovers the arc; facing the tower WITH the stone summons the face; flee re-fires at the tower; the catch completes the arc + dex 442',
      noStone && giftOk && met && fledOk && met2
      && st.story.flags.arc_spiritomb_done === true && !!st.dex.caught[SPECIES.spiritomb.dexNo],
      'noStone=' + noStone + ' gift=' + giftOk + ' met=' + met + ' foe=' + foeOk + ' fled=' + fledOk);
  }

  // ---- B14: the Quest Log renders the arcs ----
  {
    var [g, st] = legendGame(813);
    st.story.quests.arc_uxie = 'active';
    st.story.flags.sinnoh_climax_resolved = true;
    g.openQuestLog();
    var items = g.ui.menuOpen ? g.ui.menu.items : [];
    var bandOk = items.some(function (it) { return /LEGENDARY ARCS/.test(it.label); });
    var entryIdx = items.findIndex(function (it) { return it.value === 'arc:arc_uxie'; });
    var lines = [];
    var origSay = g.ui.say.bind(g.ui);
    g.ui.say = function (ls, cb, who) { lines = lines.concat(ls); if (cb) cb(); };
    if (entryIdx >= 0) { g.ui.debugChoose(entryIdx); tk(g, 3); }
    g.ui.say = origSay;
    var joined = lines.join(' ');
    ok('B14 the Quest Log LEGENDARY ARCS section renders a Sinnoh arc and its detail view spells out the requirement steps (The Lake That Knows + the climax step + the catch step)',
      bandOk && entryIdx >= 0 && joined.includes('The Lake That Knows') && joined.includes('Zenith Spire climax') && joined.includes('face Uxie, level 370'),
      'band=' + bandOk + ' entry=' + entryIdx + ' detail=' + joined.slice(0, 120));
  }

  // ---- B15: the rider, read off the live foes ----
  {
    var [g, st] = legendGame(814);
    var ow = gotoMap(g, 'league-lobby'); pump(g);
    var readFoe = function (def) {
      var bs = new BattleScene({ kind: 'trainer', trainer: def, returnTo: ow, rt: false });
      g.scenes.push(bs); tk(g, 4); drain(g);
      var foe = bs.foe || (g.scenes.top && g.scenes.top.foe);
      var moves = foe ? foe.moves.map(function (m) { return m.id; }) : [];
      if (g.scenes.top === bs) g.scenes.pop();
      return moves;
    };
    var dm = readFoe(TRAINERS.tobias_darkrai);
    var lm = readFoe(TRAINERS.tobias_latios);
    ok('B15 the RIDER, live: BattleScene builds Tobias\\'s Darkrai with the AUTHORED set [hypnosis, dreameater, fireblast, hyperbeam] and his Latios with [psychic, icebeam, thunderbolt, recover] — the engine reads the defs\\' moves lists (not the learnset last-4)',
      JSON.stringify(dm) === JSON.stringify(['hypnosis', 'dreameater', 'fireblast', 'hyperbeam'])
      && JSON.stringify(lm) === JSON.stringify(['psychic', 'icebeam', 'thunderbolt', 'recover']),
      'darkrai=' + JSON.stringify(dm) + ' latios=' + JSON.stringify(lm));
  }

  globalThis.__S6Q__ = Q;
})();
`;
let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__S6Q__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) ok('B ' + r.name, r.pass);
  ok('B00 driver completed with no internal failures', QB.failures === 0, QB.failures + ' failures');
}

console.log('\nSINNOH LEGENDARY TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
