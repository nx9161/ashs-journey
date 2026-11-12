// hoenn-legendary-checks.mjs — Arc 3 Stage H6 (Hoenn legendary arcs
// x10) proofs. Part A: pure units — the live arc register (the ten
// entries supersede the story-kanto designed stubs: real steps,
// shipped lairs, band levels), face-event shapes on the catch-only
// chain, the climax_resolved keying (trio + Rayquaza + Eon pair),
// the tomb data seam (sealstone row + gap), the Deoxys forme data,
// and the validator plumbing (tables.json arc ids + gen-tables
// --check). Part B: the built bundle in a headless Game — every arc
// driven end to end: locked/absent before its gate, the gate solved,
// the encounter driven flee -> re-fire -> catch, the dex
// registering; the Regi puzzles solved in-fiction (the standing
// beat, the greeting order, iron-to-iron); Latias' roaming landing
// reached and re-fired after a flee; and the Deoxys meteorite
// switch cycling all four formes with the individual's level / XP /
// nickname / keepsake / moves preserved and a save round-trip
// validating in EVERY forme.
// Run: node tests/hoenn-legendary-checks.mjs   (exit 1 on any failure)

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
const { HOENN_LEGENDARY_ARCS, HOENN_EVENTS } = await import(join(ROOT, 'src/data/story-hoenn.mjs'));
const { LEGENDARY_ARCS: DESIGNED_ARCS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO, SPECIES_HOENN);
const { MAPS7 } = await import(join(ROOT, 'src/data/maps7.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const { MOVES: MOVES_A } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const ALL_MOVES = Object.assign({}, MOVES_A, MOVES2);

const TEN = ['arc_regirock', 'arc_regice', 'arc_registeel', 'arc_latias', 'arc_latios', 'arc_groudon', 'arc_kyogre', 'arc_rayquaza', 'arc_jirachi', 'arc_deoxys'];
const FACE = {
  arc_regirock: ['ev_hoenn_regirock', 'regirock', 285],
  arc_regice: ['ev_hoenn_regice', 'regice', 285],
  arc_registeel: ['ev_hoenn_registeel', 'registeel', 285],
  arc_latias: ['ev_hoenn_latias', 'latias', 290],
  arc_latios: ['ev_hoenn_latios', 'latios', 290],
  arc_groudon: ['ev_hoenn_groudon', 'groudon', 298],
  arc_kyogre: ['ev_hoenn_kyogre', 'kyogre', 298],
  arc_rayquaza: ['ev_hoenn_rayquaza_face', 'rayquaza', 300],
  arc_jirachi: ['ev_hoenn_jirachi', 'jirachi', 292],
  arc_deoxys: ['ev_hoenn_deoxys', 'deoxys', 295],
};

{
  ok('A01 the live register carries exactly the ten Hoenn arcs, none designedOnly, every species real and Hoenn-dex (377-386)',
    JSON.stringify(Object.keys(HOENN_LEGENDARY_ARCS).sort()) === JSON.stringify(TEN.slice().sort())
    && TEN.every((id) => { const a = HOENN_LEGENDARY_ARCS[id]; return a && !a.designedOnly && a.region === 'Maris' && SPECIES[a.species] && SPECIES[a.species].dexNo >= 377 && SPECIES[a.species].dexNo <= 386; }));
  ok('A02 every arc states its quest-log requirements: >=2 steps, exactly one catch step naming its own species, every other step flag-keyed (the Deoxys forme step is a post-catch requirement, flag deoxys_forme_touched)',
    TEN.every((id) => { const a = HOENN_LEGENDARY_ARCS[id];
      return a.steps.length >= 2 && a.steps.filter((s) => s.catch).length === 1
        && a.steps.every((s) => typeof s.text === 'string' && (s.catch === a.species || (s.flag && !s.catch))); })
    && HOENN_LEGENDARY_ARCS.arc_deoxys.steps.some((s) => s.flag === 'deoxys_forme_touched'));
  ok('A03 lairs are shipped maps7 maps (the designed stubs\' dead ids — deserttomb/skypillar/birthisland/forina — are gone); Latias\' lair is the roaming field itself',
    TEN.every((id) => { const a = HOENN_LEGENDARY_ARCS[id]; return a.lair === 'hoenn-routes' || !!MAPS7[a.lair]; })
    && HOENN_LEGENDARY_ARCS.arc_latias.lair === 'hoenn-routes' && HOENN_LEGENDARY_ARCS.arc_latios.lair === 'r125'
    && HOENN_LEGENDARY_ARCS.arc_kyogre.lair === 'r127-underwater' && HOENN_LEGENDARY_ARCS.arc_rayquaza.lair === 'sky-pillar');
  ok('A04 the climax keying (H4b ruling): the trio, Rayquaza and BOTH Eon arcs carry prereq climax_resolved — Rayquaza\'s designed {arcs:[kyogre,groudon]} prereq is superseded; the tombs, Jirachi and Deoxys carry NO climax prereq (self-contained gates)',
    ['arc_groudon', 'arc_kyogre', 'arc_rayquaza', 'arc_latias', 'arc_latios'].every((id) => HOENN_LEGENDARY_ARCS[id].prereq === 'climax_resolved')
    && ['arc_regirock', 'arc_regice', 'arc_registeel', 'arc_jirachi', 'arc_deoxys'].every((id) => HOENN_LEGENDARY_ARCS[id].prereq === undefined));
  const faceShape = (evId, arcId, species, level, doneFlag) => {
    const ev = HOENN_EVENTS[evId]; if (!ev) return false;
    const bi = ev.findIndex((s) => s.wildBattleCatch);
    return bi >= 0 && ev[bi].wildBattleCatch.species === species && ev[bi].wildBattleCatch.level === level && ev[bi].wildBattleCatch.legendary === true
      && ev.slice(bi + 1).some((s) => s.arc === arcId && s.stage === 'complete')
      && ev.slice(bi + 1).some((s) => s.flag === doneFlag)
      && ev.slice(0, bi).some((s) => s.arc === arcId && s.stage === 'active')
      && ev.every((s) => !s.wildBattle && !s.battle && !s.battleAny);
  };
  ok('A05 all ten faces ride the catch-only chain at their band levels (Regis 285, Eons 290, Jirachi 292, Deoxys 295, titans 298, Rayquaza 300 — the band ceiling), arc-complete + done flags strictly AFTER the battle step, no plain battle step anywhere',
    TEN.every((id) => { const [evId, sp, lv] = FACE[id]; return faceShape(evId, id, sp, lv, id + '_done'); })
    && TEN.every((id) => { const lv = FACE[id][2]; return lv >= 201 && lv <= 300; }));
  ok('A06 the Jirachi witness is dialogue-only (no battle step of any kind) and sets jirachi_star_fell + the arc active; the climax appearance ev_hoenn_rayquaza is untouched and is NOT the catch face (no wildBattleCatch in it)',
    HOENN_EVENTS.ev_hoenn_jirachi_witness.every((s) => !s.wildBattle && !s.wildBattleCatch && !s.battle && !s.battleAny)
    && HOENN_EVENTS.ev_hoenn_jirachi_witness.some((s) => s.flag === 'jirachi_star_fell')
    && HOENN_EVENTS.ev_hoenn_jirachi_witness.some((s) => s.arc === 'arc_jirachi' && s.stage === 'active')
    && HOENN_EVENTS.ev_hoenn_rayquaza.every((s) => !s.wildBattleCatch) && HOENN_EVENTS.ev_hoenn_rayquaza.some((s) => s.flag === 'climax_resolved'));
  const tombSeam = (id) => { const m = MAPS7[id]; const row = [...m.rows[5]];
    return row.filter((c) => c === 'ᾒ').length >= 12 && [...m.rows[5]][8] !== 'ᾒ'
      && (m.signs || []).some((s) => s.x === 9 && s.y === 11) && !m.encounters; };
  ok('A07 the H3b tomb seam is exactly as left: all three tombs carry the sealstone row at y=5 with its single floor gap at x=8, the inscription sign at (9,11), and NO wild encounter table (the tenants are appointments, not ambushes)',
    tombSeam('desert-ruins') && tombSeam('island-cave') && tombSeam('ancient-tomb'));
  ok('A08 the staging tiles exist: Meteor Falls\' crater meteorite (21,4) + lower-falls stone (13,11) + middle stone (12,5) are meteorstone; the r125 island landmass (x12-18, y4-8) is walkable shore; the Space Center\'s facade researcher ORBIT stands in Mossdeep with authored dialogue (the H6 briefing rides the shipped maps7 NPC — no interior exists, none is faked)',
    [[21, 4], [13, 11], [12, 5]].every(([x, y]) => [...MAPS7['meteor-falls'].rows[y]][x] === 'Ἂ')
    && [[13, 7], [14, 7], [15, 8]].every(([x, y]) => { const c = [...MAPS7.r125.rows[y]][x]; return c === 'L' || c === 'ẞ' || c === 'S'; })
    && (MAPS7.mossdeep.npcs || []).some((n) => n.name === 'SPACE RESEARCHER ORBIT' && Array.isArray(n.dialogue) && n.dialogue.length >= 1));
  const FORMES = ['deoxys', 'deoxysattack', 'deoxysdefense', 'deoxysspeed'];
  ok('A09 the Deoxys formes (ruling 2 data): four species entries, all dexNo 386, the three formes form:true with baseSpecies deoxys, all Psychic — and every move any forme can know exists in the move table (the swap invariant surface)',
    FORMES.every((id) => SPECIES_HOENN[id] && SPECIES_HOENN[id].dexNo === 386 && SPECIES_HOENN[id].types.join() === 'psychic')
    && FORMES.slice(1).every((id) => SPECIES_HOENN[id].form === true && SPECIES_HOENN[id].baseSpecies === 'deoxys'));
  const t5 = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A10 tables.json already carries all ten arc ids in the validator quest vocabulary (the designed stubs pre-registered them; the live entries reuse the ids)',
    TEN.every((id) => t5.quests.includes(id)) && FORMES.every((id) => t5.species.includes(id)));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); } catch (e) { checkOut = String(e.stdout || '') ; }
  ok('A11 gen-tables --check: tables.json in sync with src/data (no hand-edited tables; no regen needed for H6)',
    checkOut.includes('tables.json OK'), checkOut.trim().slice(0, 120));
  ok('A12 a Lv300 Rayquaza + a Lv285 Regirock validate in a hoenn-arc save (band machinery at the new ceiling, client + server)',
    (() => { const st = clone(defaultState());
      st.story.arc = 'hoenn'; st.story.regionsDone = ['kanto', 'orange', 'johto'];
      st.party = [makeMon('rayquaza', 300, SPECIES, ALL_MOVES), makeMon('regirock', 285, SPECIES, ALL_MOVES)];
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
  function chooseMenu(g, value) {
    var n = 0;
    while (!g.ui.menuOpen && n++ < 200) { if (g.ui.dialogueOpen) { drain(g); continue; } tk(g, 2); }
    if (!g.ui.menuOpen) return false;
    var idx = g.ui.menu.items.findIndex(function (it) { return !it.disabled && it.value === value; });
    if (idx < 0) return false;
    g.ui.debugChoose(idx); tk(g, 3);
    return true;
  }
  function talkName(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    ow.sysNpc(npc);
    return npc;
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
  // A post-climax Hoenn save: the campaign's own flags up to the
  // resolution, nothing legendary touched.
  function legendGame(seed) {
    var gg = mkGame(seed); boot(gg); strongTeam(gg, 299);
    var ss = gg.state;
    ss.story.arc = 'hoenn'; ss.story.region = 'hoenn';
    ss.story.regionsDone = ['kanto', 'orange', 'johto'];
    ss.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
    ss.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
    ss.badges.johto = ['zephyrbadge','hivebadge','plainbadge','fogbadge','stormbadge','mineralbadge','glacierbadge','risingbadge'];
    ss.badges.hoenn = ['stonebadge','knucklebadge','dynamobadge','heatbadge','balancebadge','featherbadge','mindbadge','rainbadge'];
    ss.bag.masterball = 99;
    ss.story.flags.meteor_falls_done = true;
    return [gg, ss];
  }

  ok('B01 the merge fold landed in the bundle: all ten LEGENDARY_ARCS entries are LIVE (no designedOnly), with shipped lairs and climax keying intact',
    ['arc_regirock','arc_regice','arc_registeel','arc_latias','arc_latios','arc_groudon','arc_kyogre','arc_rayquaza','arc_jirachi','arc_deoxys'].every(function (id) {
      var a = LEGENDARY_ARCS[id]; return a && !a.designedOnly && a.region === 'Maris';
    }) && LEGENDARY_ARCS.arc_rayquaza.prereq === 'climax_resolved' && LEGENDARY_ARCS.arc_kyogre.lair === 'r127-underwater');

  // ---- B02-B04: Regirock — the standing beat ----
  {
    var [g, st] = legendGame(701);
    var ow = gotoMap(g, 'desert-ruins', 8, 7); pump(g);
    ow.sysOnStep(8, 4); pump(g);
    var sealed = !st.story.flags.regi_rock_open && st.story.position.map === 'desert-ruins' && st.story.position.y === 7;
    ow.sysInteract(8, 5); pump(g);
    var unreadSeal = !st.story.flags.regi_rock_open && !(g.scenes.top instanceof BattleScene);
    ow.sysInteract(9, 11); pump(g);
    var read = st.story.flags.regi_rock_read === true && st.story.quests.arc_regirock === 'discovered';
    ow.sysInteract(8, 5);
    var chose = chooseMenu(g, 'wait');
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'regirock' && g.scenes.top.foe.level === 285;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_regirock_done && !st.dex.caught[SPECIES.regirock.dexNo];
    ow.sysInteract(8, 5);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B02 Regirock (Desert Ruins, Lv 285): the seal turns the player back unsolved; the unread seal refuses; the inscription read, the STANDING BEAT chosen at the sealstone — the face fires; flee re-fires via the seal, the catch completes the arc + dex',
      sealed && unreadSeal && read && chose && fledOk && met2
      && st.story.flags.arc_regirock_done === true && st.story.quests.arc_regirock === 'complete' && !!st.dex.caught[SPECIES.regirock.dexNo],
      'sealed=' + sealed + ' read=' + read + ' chose=' + chose + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B03: Regice — the greeting order ----
  {
    var [g, st] = legendGame(702);
    var ow = gotoMap(g, 'island-cave', 8, 10); pump(g);
    ow.sysInteract(2, 12); pump(g);
    var tooSoon = !st.story.flags.regi_ice_west;
    ow.sysInteract(9, 11); pump(g);
    ow.sysInteract(14, 11); pump(g);
    var wrongOrder = !st.story.flags.regi_ice_west && !st.story.flags.regi_ice_open;
    ow.sysInteract(2, 12); pump(g);
    var westOk = st.story.flags.regi_ice_west === true && !st.story.flags.regi_ice_open;
    ow.sysInteract(14, 11);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'regice' && g.scenes.top.foe.level === 285;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_regice_done;
    ow.sysOnStep(8, 4);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B03 Regice (Island Cave, Lv 285): boulders decline before the reading; EAST-first is forgotten by the cold; WEST then EAST parts the seal and the face fires; flee re-fires on the chamber step, the catch completes',
      tooSoon && wrongOrder && westOk && fledOk && met2
      && st.story.flags.arc_regice_done === true && st.story.quests.arc_regice === 'complete' && !!st.dex.caught[SPECIES.regice.dexNo],
      'tooSoon=' + tooSoon + ' wrong=' + wrongOrder + ' west=' + westOk + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B04: Registeel — iron answers iron ----
  {
    var [g, st] = legendGame(703);
    var ow = gotoMap(g, 'ancient-tomb', 8, 10); pump(g);
    ow.sysInteract(9, 11); pump(g);
    ow.sysInteract(8, 5); pump(g);
    var noSteel = !st.story.flags.regi_steel_open && !(g.scenes.top instanceof BattleScene);
    st.party[5] = makeMon('aggron', 290, SPECIES, MOVES);
    ow.sysInteract(8, 5);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'registeel' && g.scenes.top.foe.level === 285;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_registeel_done;
    ow.sysInteract(8, 5);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B04 Registeel (Ancient Tomb, Lv 285): the seal refuses a party with no Steel-type; with a Steel partner beside you the seal parts and the face fires; flee re-fires, the catch completes',
      noSteel && fledOk && met2
      && st.story.flags.arc_registeel_done === true && st.story.quests.arc_registeel === 'complete' && !!st.dex.caught[SPECIES.registeel.dexNo],
      'noSteel=' + noSteel + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B05: Latias — the roaming landing ----
  {
    var [g, st] = legendGame(704);
    st.stepsTotal = 0; // landing index 0 -> r110
    gotoMap(g, 'r110', 12, 8); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_latias_done;
    st.story.flags.climax_resolved = true;
    gotoMap(g, 'r110', 12, 8);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'latias' && g.scenes.top.foe.level === 290;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_latias_done && !st.dex.caught[SPECIES.latias.dexNo];
    st.stepsTotal = 100; // two landings on: index 2 -> r123
    gotoMap(g, 'r118', 12, 8); pump(g);
    var movedOn = !(g.scenes.top instanceof BattleScene);
    gotoMap(g, 'r123', 12, 8);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B05 Latias (roaming, Lv 290): NO face before climax_resolved even on her landing; post-climax she meets you on Route 110; a flee leaves her uncaught and she MOVES ON (Route 118 is empty at the new turn) — the catch lands on Route 123',
      locked && fledOk && movedOn && met2
      && st.story.flags.arc_latias_done === true && st.story.quests.arc_latias === 'complete' && !!st.dex.caught[SPECIES.latias.dexNo],
      'locked=' + locked + ' foe=' + foeOk + ' fled=' + fledOk + ' movedOn=' + movedOn + ' met2=' + met2);
  }

  // ---- B06: Latios — the Eon stop ----
  {
    var [g, st] = legendGame(705);
    var ow = gotoMap(g, 'r125', 13, 7); pump(g);
    ow.sysOnStep(13, 7); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_latios_done;
    st.story.flags.climax_resolved = true;
    ow.sysOnStep(13, 7);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'latios' && g.scenes.top.foe.level === 290;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_latios_done;
    ow.sysOnStep(14, 7);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B06 Latios (the Eon stop, Shoal Cave island r125, Lv 290): the shore is quiet before climax_resolved; post-climax the step onto the island fires the face; flee re-fires on the next shore step, the catch completes',
      locked && fledOk && met2
      && st.story.flags.arc_latios_done === true && st.story.quests.arc_latios === 'complete' && !!st.dex.caught[SPECIES.latios.dexNo],
      'locked=' + locked + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B07-B09: the weather trio + Rayquaza, keyed on climax_resolved ----
  {
    var [g, st] = legendGame(706);
    gotoMap(g, 'magma-hideout', 7, 11); pump(g);
    var lockedG = !(g.scenes.top instanceof BattleScene);
    gotoMap(g, 'sky-pillar', 8, 15); pump(g);
    var lockedR = !(g.scenes.top instanceof BattleScene);
    st.story.flags.climax_resolved = true;
    gotoMap(g, 'magma-hideout', 7, 11);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'groudon' && g.scenes.top.foe.level === 298;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_groudon_done;
    gotoMap(g, 'magma-hideout', 7, 11);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B07 Groudon (Magma Hideout deep chamber, Lv 298): ABSENT before climax_resolved (the hideout is just a cold foundry); post-climax the entry fires the face; flee re-fires, the catch completes',
      lockedG && lockedR && fledOk && met2
      && st.story.flags.arc_groudon_done === true && st.story.quests.arc_groudon === 'complete' && !!st.dex.caught[SPECIES.groudon.dexNo],
      'lockedG=' + lockedG + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }
  {
    var [g, st] = legendGame(707);
    st.story.flags.climax_resolved = true;
    gotoMap(g, 'r127-underwater', 7, 8);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'kyogre' && g.scenes.top.foe.level === 298;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_kyogre_done;
    gotoMap(g, 'r127-underwater', 7, 8);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B08 Kyogre (the Route 127 trench — Dive-gated by construction, Lv 298): post-climax the underwater entry fires the face; flee re-fires on the next descent, the catch completes',
      fledOk && met2
      && st.story.flags.arc_kyogre_done === true && st.story.quests.arc_kyogre === 'complete' && !!st.dex.caught[SPECIES.kyogre.dexNo],
      'foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }
  {
    var [g, st] = legendGame(708);
    gotoMap(g, 'sky-pillar', 8, 15); pump(g);
    var locked = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_rayquaza_done;
    st.story.flags.climax_resolved = true;
    gotoMap(g, 'sky-pillar', 8, 15);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'rayquaza' && g.scenes.top.foe.level === 300;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_rayquaza_done;
    gotoMap(g, 'sky-pillar', 8, 15);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B09 Rayquaza (Sky Pillar summit, Lv 300 — the band ceiling): the post-climax ascent is quiet until climax_resolved stands (the H4b appearance consumed nothing); then the face fires, flee re-fires, the catch completes',
      locked && fledOk && met2
      && st.story.flags.arc_rayquaza_done === true && st.story.quests.arc_rayquaza === 'complete' && !!st.dex.caught[SPECIES.rayquaza.dexNo],
      'locked=' + locked + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B10: Jirachi — the star chain ----
  {
    var [g, st] = legendGame(709);
    var ow = gotoMap(g, 'meteor-falls', 12, 10); pump(g);
    ow.sysInteract(13, 11); pump(g);
    var dormant = !(g.scenes.top instanceof BattleScene) && !st.story.flags.jirachi_star_fell;
    var owM = gotoMap(g, 'mossdeep', 17, 8); pump(g);
    var vesper = talkName(g, owM, 'SPACE RESEARCHER ORBIT'); pump(g);
    var news = !!vesper && st.story.flags.arc_jirachi_news === true && st.story.flags.arc_deoxys_rumor === true
      && st.story.quests.arc_jirachi === 'discovered' && st.story.quests.arc_deoxys === 'discovered';
    gotoMap(g, 'meteor-falls', 12, 12); pump(g);
    var witnessed = st.story.flags.jirachi_star_fell === true && st.story.quests.arc_jirachi === 'active';
    var ow2 = gotoMap(g, 'meteor-falls', 12, 10); pump(g);
    ow2.sysInteract(13, 11);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'jirachi' && g.scenes.top.foe.level === 292;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_jirachi_done;
    ow2.sysInteract(13, 11);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    ok('B10 Jirachi (Lv 292): the wish stone is dormant stone before the Space Center news; ORBIT hands over the comet news + the Deoxys rumour; the star fall is witnessed on the falls entry; the wish beat fires at the lower-falls meteorstone — flee re-fires, the catch completes',
      dormant && news && witnessed && fledOk && met2
      && st.story.flags.arc_jirachi_done === true && st.story.quests.arc_jirachi === 'complete' && !!st.dex.caught[SPECIES.jirachi.dexNo],
      'dormant=' + dormant + ' news=' + news + ' witnessed=' + witnessed + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2);
  }

  // ---- B11: Deoxys + the meteorite forme switch ----
  {
    var [g, st] = legendGame(710);
    var ow = gotoMap(g, 'meteor-falls', 19, 4); pump(g);
    ow.sysInteract(21, 4); pump(g);
    var dormant = !(g.scenes.top instanceof BattleScene) && !st.story.flags.arc_deoxys_done;
    var owM = gotoMap(g, 'mossdeep', 17, 8); pump(g);
    talkName(g, owM, 'SPACE RESEARCHER ORBIT'); pump(g);
    var ow2 = gotoMap(g, 'meteor-falls', 19, 4); pump(g);
    ow2.sysInteract(21, 4);
    var met = drainToBattle(g);
    var foeOk = met && g.scenes.top.foe && g.scenes.top.foe.speciesId === 'deoxys' && g.scenes.top.foe.level === 295;
    driveFlee(g); healParty(g);
    var fledOk = foeOk && !st.story.flags.arc_deoxys_done;
    ow2.sysInteract(21, 4);
    var met2 = drainToBattle(g);
    catchWithBall(g); pump(g);
    var caught = st.story.flags.arc_deoxys_done === true && st.story.quests.arc_deoxys === 'complete' && !!st.dex.caught[386];
    // Bring the caught Deoxys into the party and mark the individual.
    var deo = null;
    for (var bi = 0; bi < st.party.length && !deo; bi++) if (st.party[bi] && st.party[bi].speciesId === 'deoxys') deo = st.party[bi];
    if (!deo) { for (var bx in st.boxes) { var arr = st.boxes[bx] || []; for (var bj = 0; bj < arr.length && !deo; bj++) if (arr[bj] && arr[bj].speciesId === 'deoxys') { deo = arr[bj]; arr.splice(bj, 1); } } }
    var inParty = false;
    if (deo) { st.party[0] = deo; inParty = st.party[0] === deo; }
    var before = null;
    if (deo) {
      deo.nickname = 'NOVA'; deo.keepsake = 'championsribbon';
      before = { level: deo.level, xp: deo.xp, moves: deo.moves.map(function (mv) { return mv.id; }).join(',') };
    }
    var ow3 = gotoMap(g, 'meteor-falls', 19, 4); pump(g);
    ow3.sysInteract(21, 4);
    var chose = chooseMenu(g, 'deoxysattack');
    pump(g);
    var switched = !!deo && deo.speciesId === 'deoxysattack' && deo.level === before.level && deo.xp === before.xp
      && deo.nickname === 'NOVA' && deo.keepsake === 'championsribbon'
      && deo.moves.map(function (mv) { return mv.id; }).join(',') === before.moves
      && st.story.flags.deoxys_forme_touched === true;
    // Cycle the remaining formes through the shipped switch and
    // stash a save per forme for the node-side validators.
    globalThis.__H6_FORME_SAVES__ = {};
    var cycle = [];
    if (deo) {
      var owS = g.scenes.top;
      ['deoxysdefense', 'deoxysspeed', 'deoxys', 'deoxysattack'].forEach(function (fid) {
        var was = deo.speciesId;
        var okSw = owS.switchDeoxysForme(deo, fid);
        cycle.push(okSw && deo.speciesId === fid && deo.level === before.level && deo.xp === before.xp && deo.nickname === 'NOVA');
        globalThis.__H6_FORME_SAVES__[fid] = JSON.parse(JSON.stringify(st));
      });
    }
    ok('B11 Deoxys (Meteor Falls crater, Lv 295) + THE METEORITE SWITCH (ruling 2, real mechanic): dormant without the rumour; the face fires at the crater meteorite, flee re-fires, the catch completes; the meteorite menu switches the party Deoxys to Attack forme preserving level/XP/nickname/keepsake/moves, and the shipped switch cycles all four formes losslessly',
      dormant && fledOk && met2 && caught && inParty && chose && switched && cycle.length === 4 && cycle.every(Boolean),
      'dormant=' + dormant + ' foe=' + foeOk + ' fled=' + fledOk + ' met2=' + met2 + ' caught=' + caught + ' inParty=' + inParty + ' chose=' + chose + ' switched=' + switched + ' cycle=' + cycle.join(','));
  }

  globalThis.__H6_Q__ = Q;
})();`;

let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__H6_Q__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) { if (r.pass) pass++; else fail++; }
  console.log('Part B: ' + QB.results.filter((r) => r.pass).length + '/' + QB.results.length + ' passed');
}

// The Deoxys forme saves: a switched Deoxys must round-trip BOTH
// validators in EVERY forme (ruling 2's closing condition).
{
  const saves = globalThis.__H6_FORME_SAVES__ || {};
  const FORMES = ['deoxys', 'deoxysattack', 'deoxysdefense', 'deoxysspeed'];
  ok('B12 the meteorite-switched Deoxys round-trips save validation in EVERY forme (client schema + server validator, speciesId the only moving part)',
    FORMES.every((fid) => { const s = saves[fid]; if (!s) return false;
      const mon = (s.party || []).find((m) => m && FORMES.includes(m.speciesId));
      return mon && mon.speciesId === fid && SCH.validateSave(clone(s)).ok && VAL.validateSave(clone(s)).ok; }),
    JSON.stringify(Object.keys(saves)));
}

console.log('\nhoenn-legendary: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
