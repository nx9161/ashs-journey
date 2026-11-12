// orange-climax-checks.mjs — Arc 1.5 Stage O3 (Pokemon 2000: the
// Shamouti climax + the ABYSSORN legendary arc) proofs.
// Part A: pure units — the appended quest stage, the event/battle
// data law (uncatchable quells + climax, catchable deep ABYSSORN, no
// Kanto arc flags touched), the ABYSSORN legendary-arc entry, map
// placements (DOZECROWN's rock, cave altar tiles, NPC state variants),
// walkability of the whole Shamouti cluster, legacy save-fill.
// Part B: the built bundle in a headless Game — trigger gating
// (1 badge quiet / 2 badges storm), the three quells (ball refusal,
// flee -> re-fire, win -> flag), the climax at 3/3 only (ABYSSORN
// uncatchable), post-storm NPC variants, the deep catch (dex 249),
// order independence (League -> homecoming -> return -> chain
// completes; storm-first -> gyms unaffected), scenes fire once.
// Run: node tests/orange-climax-checks.mjs   (exit 1 on any failure)

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
const { ORANGE_QUESTS, ORANGE_EVENTS, ORANGE_LEGENDARY_ARCS } = await import(join(ROOT, 'src/data/story-orange.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2);
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const MOVES = Object.assign({}, MV1, MOVES2);
const O3_EVENTS = ['ev_orange_2000_storm', 'ev_orange_2000_moltres', 'ev_orange_2000_zapdos', 'ev_orange_2000_articuno', 'ev_orange_2000_climax', 'ev_orange_2000_lugia'];

{
  const q = ORANGE_QUESTS.find((x) => x.id === 'q_orange_storm');
  ok('A01 storm quest appended at the seam: id/flag/titanCount, completion flag is orange_2000_storm_stilled, hint names the Sea Ruby unlock + the collector',
    !!q && q.flag === 'orange_2000_storm_stilled' && q.titanCount === true
    && /Sea Ruby/.test(q.hint) && /Halloway/.test(q.hint)
    && ORANGE_QUESTS.indexOf(q) === ORANGE_QUESTS.length - 1);
  ok('A02 all six O3 events exist; the trigger sets orange_2000_active and introduces the ORIGINAL collector (Vance Halloway) + DOZECROWN counsel',
    O3_EVENTS.every((id) => Array.isArray(ORANGE_EVENTS[id]))
    && ORANGE_EVENTS.ev_orange_2000_storm.some((s) => s.flag === 'orange_2000_active')
    && JSON.stringify(ORANGE_EVENTS.ev_orange_2000_storm).includes('Vance Halloway')
    && JSON.stringify(ORANGE_EVENTS.ev_orange_2000_storm).includes('DOZECROWN'));
  const wb = (id) => ORANGE_EVENTS[id].find((s) => s.wildBattle).wildBattle;
  ok('A03 quell battles: PYREHAWK/Zapdos/GLACIERNE Lv50, ALL uncatchable event versions',
    wb('ev_orange_2000_moltres').species === 'moltres' && wb('ev_orange_2000_moltres').level === 50 && wb('ev_orange_2000_moltres').uncatchable === true
    && wb('ev_orange_2000_zapdos').species === 'zapdos' && wb('ev_orange_2000_zapdos').uncatchable === true
    && wb('ev_orange_2000_articuno').species === 'articuno' && wb('ev_orange_2000_articuno').uncatchable === true);
  ok('A04 each quell sets ONLY its orange_2000_<bird> flag, AFTER its battle step',
    ['moltres', 'zapdos', 'articuno'].every((b) => {
      const ev = ORANGE_EVENTS['ev_orange_2000_' + b];
      const bi = ev.findIndex((s) => s.wildBattle); const fi = ev.findIndex((s) => s.flag === 'orange_2000_' + b);
      return bi >= 0 && fi > bi;
    }));
  ok('A05 climax: ABYSSORN Lv55 UNcatchable (the proving), storm_stilled + arc discovered + questDone AFTER the battle, collector retreats humbled in original lines',
    wb('ev_orange_2000_climax').species === 'lugia' && wb('ev_orange_2000_climax').level === 55 && wb('ev_orange_2000_climax').uncatchable === true
    && (() => { const ev = ORANGE_EVENTS.ev_orange_2000_climax; const bi = ev.findIndex((s) => s.wildBattle);
      return ev.findIndex((s) => s.flag === 'orange_2000_storm_stilled') > bi
        && ev.some((s) => s.arc === 'arc_lugia_shamouti' && s.stage === 'discovered')
        && ev.some((s) => s.questDone === 'q_orange_storm')
        && JSON.stringify(ev).includes('poor substitute for a sky'); })());
  ok('A06 the catch: deep ABYSSORN Lv55 legendary and NOT uncatchable; arc active -> battle -> arc complete -> orange_2000_lugia_done, in that order',
    wb('ev_orange_2000_lugia').species === 'lugia' && wb('ev_orange_2000_lugia').level === 55
    && wb('ev_orange_2000_lugia').legendary === true && !wb('ev_orange_2000_lugia').uncatchable
    && (() => { const ev = ORANGE_EVENTS.ev_orange_2000_lugia;
      const ai = ev.findIndex((s) => s.arc === 'arc_lugia_shamouti' && s.stage === 'active');
      const bi = ev.findIndex((s) => s.wildBattle);
      const ci = ev.findIndex((s) => s.arc === 'arc_lugia_shamouti' && s.stage === 'complete');
      const fi = ev.findIndex((s) => s.flag === 'orange_2000_lugia_done');
      return ai >= 0 && ai < bi && ci > bi && fi > ci; })());
  const allSteps = O3_EVENTS.flatMap((id) => ORANGE_EVENTS[id]);
  ok('A07 no Kanto legendary arc is read or written: the only arc steps name arc_lugia_shamouti; no arc_zapdos/arc_moltres/arc_articuno flag appears anywhere in the O3 events',
    allSteps.every((s) => !s.arc || s.arc === 'arc_lugia_shamouti')
    && !JSON.stringify(ORANGE_EVENTS).match(/arc_(zapdos|moltres|articuno)/)
    && allSteps.every((s) => !s.flag || s.flag.startsWith('orange_2000_')));
  const arc = ORANGE_LEGENDARY_ARCS.arc_lugia_shamouti;
  ok('A08 ABYSSORN legendary arc entry (quest-log presentation mirrors Kanto): title The Guardian of the Sea, species lugia, lair shamouti-deep, 6 requirement steps spelled out, last step is the catch',
    !!arc && arc.title === 'The Guardian of the Sea' && arc.species === 'lugia' && arc.lair === 'shamouti-deep'
    && arc.steps.length === 6 && arc.steps[5].catch === 'lugia'
    && arc.steps.slice(0, 5).every((s) => s.flag && s.flag.startsWith('orange_2000_')));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A09 tables.json in sync and carries q_orange_storm + arc_lugia_shamouti (server validator vocabulary)',
    checkOut.includes('tables.json OK') && t.quests.includes('q_orange_storm') && t.quests.includes('arc_lugia_shamouti'), checkOut.trim());
}

// -- legacy save-fill: O3 state is story flags + story.quests only --
{
  const mid = clone(defaultState());
  mid.player.name = 'ASH'; mid.player.rivalName = 'GARY';
  mid.badges.orange = ['coraleyebadge', 'searubybadge'];
  mid.story.flags.orange_gsball = true;
  const filled = SCH.migrate(clone(mid));
  ok('A10 legacy mid-Orange save (pre-O3, 2 badges) migrates + validates client-side with zero loss — O3 needs NO schema change (flags only)',
    SCH.validateSave(filled).ok && JSON.stringify(filled.badges.orange) === JSON.stringify(['coraleyebadge', 'searubybadge'])
    && filled.story.flags.orange_gsball === true, JSON.stringify(SCH.validateSave(filled).errors));
  const done = clone(defaultState());
  done.player.name = 'ASH'; done.player.rivalName = 'GARY';
  done.story.arc = 'orange'; done.story.region = 'orange';
  done.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  done.badges.kanto = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];
  for (const f of ['orange_2000_active', 'orange_2000_moltres', 'orange_2000_zapdos', 'orange_2000_articuno', 'orange_2000_storm_stilled', 'orange_2000_lugia_done', 'orange_champion']) done.story.flags[f] = true;
  done.story.quests.q_orange_storm = 'complete';
  done.story.quests.arc_lugia_shamouti = 'complete';
  done.dex.caught[249] = true; done.dex.seen[249] = true;
  done.party = [makeMon('lugia', 55, SPECIES, MOVES)];
  const rv = VAL.validateSave(clone(done)); const cv = SCH.validateSave(clone(done));
  ok('A11 a fully O3-completed save (all orange_2000_* flags + q_orange_storm/arc_lugia_shamouti complete + ABYSSORN caught) validates SERVER-side and client-side',
    rv.ok && cv.ok, JSON.stringify({ server: rv.errors, client: cv.errors }));
}

// -- placements + walkability (the Orange sweep for the Shamouti cluster) --
{
  const { MAPS5 } = await import(join(ROOT, 'src/data/maps5.mjs'));
  const { WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));
  ok('A12 MAPS5 holds the 30 Orange maps + the vermilion ferry-port re-declaration (31 keys, unchanged census)', Object.keys(MAPS5).length === 31 && !!MAPS5.vermilion && !!MAPS5.shamouti && !!MAPS5['shamouti-deep'], Object.keys(MAPS5).length + '');
  const sham = MAPS5.shamouti;
  const sk = sham.npcs.find((n) => n.name === 'DOZECROWN');
  ok('A13 DOZECROWN NPC placed at DOZECROWN\'s rock — (6,12), beside the west-shore rock tiles — with base + storm + post-storm dialogue states',
    !!sk && sk.x === 6 && sk.y === 12 && Array.isArray(sk.dialogueStates) && sk.dialogueStates.length === 2
    && sk.dialogueStates[0].flag === 'orange_2000_storm_stilled' && sk.dialogueStates[1].flag === 'orange_2000_active'
    && sham.rows[12][5] === 'R' && sham.rows[12][4] === 'R');
  const variants = [
    ['shamouti', 'FEST ELDER MIRA'], ['shamouti', 'CAPT MARINA-PUMM'], ['shamouti-shrine', 'SHRINE KEEPER ANO'],
  ];
  ok('A14 post-storm dialogue variants on the key NPCs (festival elder, dock ferryman, shrine keeper): each carries storm + post-storm states, post-storm first',
    variants.every(([mid, name]) => {
      const n = (MAPS5[mid].npcs || []).find((x) => x.name === name);
      return n && Array.isArray(n.dialogueStates) && n.dialogueStates.length === 2
        && n.dialogueStates[0].flag === 'orange_2000_storm_stilled' && n.dialogueStates[1].flag === 'orange_2000_active';
    }));
  const caveEv = { 'fire-cave': 'ev_orange_2000_moltres', 'ice-cave': 'ev_orange_2000_articuno', 'lightning-cave': 'ev_orange_2000_zapdos' };
  ok('A15 shrine-cave altar tiles: each cave steps its quell event at (6,2)+(7,2), gated flag orange_2000_active + flagNot its own calm flag (dormant + inert before the storm)',
    Object.entries(caveEv).every(([mid, eid]) => {
      const evs = MAPS5[mid].events || [];
      return evs.length === 2 && evs.every((e) => e.id === eid && e.y === 2 && (e.x === 6 || e.x === 7)
        && e.when.flag === 'orange_2000_active' && e.when.flagNot === 'orange_2000_' + eid.split('_').pop());
    }));
  // BFS walkability, the connectivity-sweep idiom (NPC tiles blocked).
  const npcBlocked = (m, x, y) => (m.npcs || []).some((n) => n.x === x && n.y === y);
  const walkable = (m, x, y) => y >= 0 && y < m.rows.length && x >= 0 && x < m.rows[y].length
    && (WALKABLE.has(m.rows[y][x]) || m.rows[y][x] === '~' || m.rows[y][x] === 'W') && !npcBlocked(m, x, y);
  function bfs(m, sx, sy) {
    const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]];
    while (q.length) { const [x, y] = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (!seen.has(k) && walkable(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    return seen;
  }
  const adj = (seen, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
  const shamSeen = bfs(sham, sham.start.x, sham.start.y);
  const shrine = MAPS5['shamouti-shrine'], deep = MAPS5['shamouti-deep'];
  const shrineSeen = bfs(shrine, 7, 11), deepSeen = bfs(deep, 7, 10);
  let cavesOk = true; const caveDetail = [];
  for (const mid of Object.keys(caveEv)) {
    const m = MAPS5[mid]; const s = bfs(m, 6, 9);
    if (!(s.has('6,2') && s.has('7,2'))) { cavesOk = false; caveDetail.push(mid); }
  }
  ok('A16 Shamouti cluster walkability: dock start reaches DOZECROWN-adjacent + the shrine door; shrine entry reaches the deep passage; deep entry reaches the altar; every cave entry reaches BOTH altar tiles (new NPCs block nothing)',
    adj(shamSeen, 6, 12) && shamSeen.has('4,4')
    && shrineSeen.has('7,2') && adj(deepSeen, 7, 1) && cavesOk, caveDetail.join(','));
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
globalThis.__SEED__ = 20261030;
globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };

const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('OC-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('oc-pass ' + name);
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
  var seenLines = [];
  function noteLines(g) {
    if (g.ui.dlg && g.ui.dlg.lines) for (var i = 0; i < g.ui.dlg.lines.length; i++) if (!seenLines.includes(g.ui.dlg.lines[i])) seenLines.push(g.ui.dlg.lines[i]);
  }
  function drain(g) { var n = 0; while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && n < 500) { noteLines(g); pA(g); n++; } noteLines(g); }
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
    g.state.bag.fullrestore = 9; g.state.bag.maxrevive = 9; g.state.bag.masterball = 3; g.state.bag.pokeball = 5;
  }
  function driveBattle(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 1200) {
      guard++;
      drain(g);
      if (!(g.scenes.top instanceof BattleScene)) break;
      var b = g.scenes.top;
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (m.kind === 'commands') {
          var idx = m.items.findIndex(function (it) { return !it.disabled && it.value === 'fight'; });
          g.ui.debugChoose(idx >= 0 ? idx : 0); tk(g, 3);
        } else if (m.title === 'Choose a move') {
          var best = 0, bs = -1;
          var foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
          m.items.forEach(function (it, i) { if (it.disabled) return; var slot = b.ally.moves[i]; if (!slot) return; var md = MOVES[slot.id]; var sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
          g.ui.debugChoose(best); tk(g, 3);
        } else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
          var idx2 = g.state.party.findIndex(function (mm) { return mm.hp > 0 && mm !== b.ally; });
          g.ui.debugChoose(idx2 >= 0 ? idx2 : m.items.length - 1); tk(g, 3);
        } else { g.ui.debugChoose(m.items.length - 1); tk(g, 3); }
      } else { pA(g); tk(g, 3); }
    }
    drain(g);
  }
  function pump(g, cap) {
    var guard = 0;
    while (guard++ < (cap || 300)) {
      noteLines(g);
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
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      break;
    }
    noteLines(g);
    drain(g);
  }
  function drainToBattle(g) {
    var n = 0;
    while (!(g.scenes.top instanceof BattleScene) && n < 400) {
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) break;
      tk(g, 2); n++;
    }
    return g.scenes.top instanceof BattleScene;
  }
  // Throw one ball at the current battle foe, then report what the
  // engine said. Returns once the command menu is back (or battle end).
  function attemptBall(g, ballId) {
    var guard = 0, threw = false;
    while (guard++ < 300) {
      noteLines(g);
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
        break; // ball resolved and the command menu is back
      }
      pA(g); tk(g, 3);
    }
    noteLines(g);
    return threw;
  }
  function driveFlee(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 600) {
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
  function talk(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    // The shipped interact path (overworld.mjs): sysNpc first; plain
    // dialogue NPCs fall through to the npcDialogueLines fallback.
    if (!ow.sysNpc(npc)) g.ui.say(ow.npcDialogueLines(npc), null, npc.name);
    return npc;
  }
  function battleMsgSeen(g, sub, fromIdx) {
    return g.ui.log.slice(fromIdx || 0).some(function (e) { return e.ui === 'battle-msg' && (e.text || '').includes(sub); });
  }
  function talkLines(g, ow, name) {
    seenLines = [];
    talk(g, ow, name);
    drain(g);
    if (g.ui.menuOpen) { // e.g. the ferryman's sail menu — stay ashore
      var ni = g.ui.menu.items.findIndex(function (it) { return it.value === 'no'; });
      if (ni >= 0) { g.ui.debugChoose(ni); tk(g, 3); }
      drain(g);
    }
    return seenLines.join(' | ');
  }
  function quell(g, ow, cave, flag) {
    var o = gotoMap(g, cave, 6, 8);
    o.sysOnStep(6, 2);
    pump(g, 400);
    return g.state.story.flags[flag] === true;
  }

  // ================= Game A: the main chain =================
  var gA = mkGame(401); boot(gA); strongTeam(gA, 80);
  var stA = gA.state;
  stA.story.arc = 'orange'; stA.story.region = 'orange';
  stA.badges.orange = ['coraleyebadge'];
  gotoMap(gA, 'shamouti', 14, 15);
  ok('B01 trigger gating: Shamouti at 1 Orange badge is the peaceful festival island — no storm, no dialogue, no flag',
    !gA.ui.dialogueOpen && !stA.story.flags.orange_2000_active);
  stA.badges.orange = ['coraleyebadge', 'searubybadge'];
  seenLines = [];
  gotoMap(gA, 'shamouti', 14, 15);
  var stormOpen = gA.ui.dialogueOpen === true;
  pump(gA);
  var stormText = seenLines.join(' | ');
  ok('B02 trigger: first Shamouti arrival with the Sea Ruby held fires the storm — Halloway named, DOZECROWN counsels, orange_2000_active set',
    stormOpen && stormText.includes('Vance Halloway') && stormText.includes('DOZECROWN') && stA.story.flags.orange_2000_active === true,
    stormText.slice(0, 140));
  gotoMap(gA, 'shamouti', 14, 15);
  ok('B03 the trigger fires exactly once: re-entry is quiet', !gA.ui.dialogueOpen);
  var owA = gotoMap(gA, 'shamouti', 14, 15);
  var skLines = talkLines(gA, owA, 'DOZECROWN');
  ok('B04 DOZECROWN at its rock gives STORM counsel while the storm is live (state variant, not base lines)',
    skLines.includes('tide table'), skLines.slice(0, 120));

  // -- PYREHAWK: ball refusal, then the win --
  var owF = gotoMap(gA, 'fire-cave', 6, 8);
  owF.sysOnStep(6, 2);
  var inBattle = drainToBattle(gA);
  var bF = gA.scenes.top;
  ok('B05 PYREHAWK quell fires at the fire-cave altar (storm active): event battle vs Lv50 PYREHAWK, flagged uncatchable by the engine',
    inBattle && bF.foe.speciesId === 'moltres' && bF.foe.level === 50 && bF.uncatchable === true,
    inBattle ? bF.foe.speciesId + ' lv' + bF.foe.level + ' unc=' + bF.uncatchable : 'no battle');
  var logAtBall = gA.ui.log.length;
  var threw = attemptBall(gA, 'masterball');
  var refused = battleMsgSeen(gA, 'cannot be caught', logAtBall);
  ok('B06 balls are REFUSED in the event battle (the ghost/movie pattern): Master Ball deflected, PYREHAWK not caught, battle continues',
    threw && refused && (gA.scenes.top instanceof BattleScene) && !stA.dex.caught[146],
    'threw=' + threw + ' refused=' + refused + ' lines=' + seenLines.join(' | ').slice(0, 160));
  driveBattle(gA); pump(gA);
  ok('B07 winning calms PYREHAWK: orange_2000_moltres set — and NO Kanto arc state touched (no arc_moltres quest entry, no Kanto flags)',
    stA.story.flags.orange_2000_moltres === true && !stA.story.quests.arc_moltres
    && !stA.story.flags.arc_moltres_found && !stA.story.flags.arc_moltres_chamber);

  // -- Zapdos: flee -> nothing completes -> re-fire -> win --
  var owL = gotoMap(gA, 'lightning-cave', 6, 8);
  owL.sysOnStep(6, 2);
  var inBattle2 = drainToBattle(gA);
  var fled = inBattle2 && driveFlee(gA);
  ok('B08 fleeing the Zapdos quell completes NOTHING (the fled guard): calm flag unset, event done flag unwritten',
    fled && !stA.story.flags.orange_2000_zapdos && !stA.story.flags.ev_orange_2000_zapdos_done,
    'fled=' + fled);
  owL.sysOnStep(6, 2);
  var refired = drainToBattle(gA);
  ok('B09 after the flee, stepping back to the altar RE-FIRES the Zapdos event', refired && gA.scenes.top.foe.speciesId === 'zapdos');
  driveBattle(gA); pump(gA);
  ok('B10 the re-fired Zapdos quell completes on a clean win', stA.story.flags.orange_2000_zapdos === true);

  // -- Climax gate at 2/3 --
  gotoMap(gA, 'shamouti-shrine', 7, 10);
  ok('B11 climax gate: the shrine is quiet at 2/3 titans calmed (no scene, no battle)',
    !gA.ui.dialogueOpen && !(gA.scenes.top instanceof BattleScene) && !stA.story.flags.orange_2000_storm_stilled);

  // -- GLACIERNE: plain win through the pump --
  ok('B12 GLACIERNE quell completes through the standard step->scene->battle path (3/3 titans)',
    quell(gA, null, 'ice-cave', 'orange_2000_articuno') && stA.story.flags.orange_2000_articuno === true);

  // -- The climax --
  seenLines = [];
  gotoMap(gA, 'shamouti-shrine', 7, 10);
  var climaxBattle = drainToBattle(gA);
  var bC = gA.scenes.top;
  ok('B13 climax fires at 3/3 on shrine entry: the proving is ABYSSORN Lv55, UNcatchable, fought at the deep altar (map is shamouti-deep)',
    climaxBattle && bC.foe.speciesId === 'lugia' && bC.foe.level === 55 && bC.uncatchable === true
    && gA.state.story.position.map === 'shamouti-deep',
    climaxBattle ? bC.foe.speciesId + ' unc=' + bC.uncatchable + ' map=' + gA.state.story.position.map : 'no battle');
  var logAtClimaxBall = gA.ui.log.length;
  attemptBall(gA, 'masterball');
  var lugiaRefused = battleMsgSeen(gA, 'cannot be caught', logAtClimaxBall);
  ok('B14 the guardian cannot be taken at the proving: ball deflected, ABYSSORN not caught, battle continues',
    lugiaRefused && (gA.scenes.top instanceof BattleScene) && !stA.dex.caught[249]);
  driveBattle(gA); pump(gA);
  ok('B15 winning the proving stills the storm: storm_stilled set, storm quest complete, ABYSSORN arc DISCOVERED (not complete), player returned to Shamouti',
    stA.story.flags.orange_2000_storm_stilled === true && stA.story.quests.q_orange_storm === 'complete'
    && stA.story.quests.arc_lugia_shamouti === 'discovered' && !stA.story.flags.orange_2000_lugia_done
    && stA.story.position.map === 'shamouti',
    JSON.stringify({ q: stA.story.quests.q_orange_storm, arc: stA.story.quests.arc_lugia_shamouti, map: stA.story.position.map }));

  // -- Post-storm NPC variants --
  var owA2 = gotoMap(gA, 'shamouti', 14, 15);
  var elderPost = talkLines(gA, owA2, 'FEST ELDER MIRA');
  var ferryPost = talkLines(gA, owA2, 'CAPT MARINA-PUMM');
  var skPost = talkLines(gA, owA2, 'DOZECROWN');
  ok('B16 post-storm variants: elder (festival restored), ferryman (glass sea), DOZECROWN (sun patch) all speak their post-storm lines',
    elderPost.includes('Sixty festivals') && ferryPost.includes('like glass') && skPost.includes('patch of warmth'),
    elderPost.slice(0, 60) + ' // ' + ferryPost.slice(0, 60) + ' // ' + skPost.slice(0, 60));

  // -- The catch --
  gotoMap(gA, 'shamouti-deep', 7, 10);
  var catchBattle = drainToBattle(gA);
  var bD = gA.scenes.top;
  ok('B17 the deep catch encounter fires post-climax: ABYSSORN Lv55 waits, CATCHABLE (no uncatchable flag)',
    catchBattle && bD.foe.speciesId === 'lugia' && bD.foe.level === 55 && bD.uncatchable === false,
    catchBattle ? 'unc=' + bD.uncatchable : 'no battle');
  attemptBall(gA, 'masterball');
  pump(gA);
  var lugiaOwned = stA.party.some(function (m) { return m.speciesId === 'lugia'; })
    || Object.values(stA.boxes).some(function (b) { return b.some(function (m) { return m.speciesId === 'lugia'; }); });
  ok('B18 the catch succeeds: ABYSSORN owned, dex registers 249 CAUGHT, arc COMPLETE, orange_2000_lugia_done set',
    lugiaOwned && stA.dex.caught[249] === true && stA.story.quests.arc_lugia_shamouti === 'complete'
    && stA.story.flags.orange_2000_lugia_done === true,
    JSON.stringify({ owned: lugiaOwned, dex: stA.dex.caught[249], arc: stA.story.quests.arc_lugia_shamouti }));
  gotoMap(gA, 'shamouti-deep', 7, 10);
  ok('B19 scenes fire once, forever: re-entering the deep chamber after the catch is quiet',
    !gA.ui.dialogueOpen && !(gA.scenes.top instanceof BattleScene));
  globalThis.__O3SAVE__ = JSON.parse(JSON.stringify(stA));

  // -- Quest Log: storm row tracks n/3; the arc lists under LEGENDARY ARCS --
  var gQ = mkGame(402); boot(gQ);
  gQ.state.story.flags.hook_orange = true;
  gQ.state.badges.orange = ['coraleyebadge', 'searubybadge'];
  gQ.state.story.flags.orange_2000_active = true;
  gQ.state.story.flags.orange_2000_moltres = true;
  gQ.state.story.quests.arc_lugia_shamouti = 'discovered';
  gQ.openQuestLog();
  var labelsQ = gQ.ui.menu.items.map(function (i) { return i.label; });
  var stormRow = labelsQ.find(function (l) { return l.includes('Storm over Sanctum'); });
  ok('B20 Quest Log: the storm row tracks titans calmed (1/3) and the ABYSSORN arc lists in the LEGENDARY ARCS section',
    !!stormRow && stormRow.includes('1/3 titans calmed') && labelsQ.some(function (l) { return l.includes('LEGENDARY ARCS'); })
    && labelsQ.some(function (l) { return l.includes('The Guardian of the Sea'); }),
    labelsQ.join(' / ').slice(0, 300));

  // ================= Game B: League first, then the storm =================
  var gB = mkGame(403); boot(gB); strongTeam(gB, 80);
  var stB = gB.state;
  stB.story.arc = 'orange'; stB.story.region = 'orange';
  stB.story.regionsDone = ['kanto'];
  stB.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  stB.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  stB.story.flags.orange_crew_done = true;
  var owB = gotoMap(gB, 'pummelo-stadium', 11, 12);
  talk(gB, owB, 'DRAKE'); pump(gB, 500);
  ok('B21 order independence I: League first — Drake victory fires the machine exactly as O2 left it (orange_champion + card + Johto directive), storm untouched',
    stB.story.flags.orange_champion === true && stB.story.flags.arc_card_orange === true
    && stB.story.arc_directive === 'johto' && !stB.story.flags.orange_2000_active,
    JSON.stringify({ champ: stB.story.flags.orange_champion, dir: stB.story.arc_directive }));
  gotoMap(gB, 'house-pallet-ash', 4, 6);
  pump(gB);
  ok('B22 homecoming completes (Johto hook delivered, directive cleared, arc advances to johto + embark armed — Stage J4a supersedes the sealed-arc assertion)',
    stB.story.arc_directive === null && stB.story.flags.hook_johto === true && stB.story.arc === 'johto' && stB.story.flags.embark_johto === true,
    JSON.stringify({ dir: stB.story.arc_directive, hook: stB.story.flags.hook_johto, arc: stB.story.arc }));
  gotoMap(gB, 'shamouti', 14, 15);
  pump(gB);
  var leagueFirstStorm = stB.story.flags.orange_2000_active === true;
  var q1 = quell(gB, null, 'fire-cave', 'orange_2000_moltres');
  var q2 = quell(gB, null, 'lightning-cave', 'orange_2000_zapdos');
  var q3 = quell(gB, null, 'ice-cave', 'orange_2000_articuno');
  gotoMap(gB, 'shamouti-shrine', 7, 10); pump(gB, 400);
  gotoMap(gB, 'shamouti-deep', 7, 10);
  var cbB = drainToBattle(gB);
  if (cbB) { attemptBall(gB, 'masterball'); pump(gB); }
  ok('B23 order independence II: after League + homecoming, the return trip runs the WHOLE chain — trigger, 3 quells, climax, catch (dex 249)',
    leagueFirstStorm && q1 && q2 && q3 && stB.story.flags.orange_2000_storm_stilled === true
    && stB.story.flags.orange_2000_lugia_done === true && stB.dex.caught[249] === true,
    JSON.stringify({ storm: leagueFirstStorm, q: [q1, q2, q3], stilled: stB.story.flags.orange_2000_storm_stilled, lugia: stB.story.flags.orange_2000_lugia_done }));

  // ================= Game C: storm first, gyms unaffected =================
  var gC = mkGame(404); boot(gC); strongTeam(gC, 80);
  var stC = gC.state;
  stC.story.arc = 'orange'; stC.story.region = 'orange';
  stC.badges.orange = ['coraleyebadge', 'searubybadge'];
  gotoMap(gC, 'shamouti', 14, 15); pump(gC);
  quell(gC, null, 'fire-cave', 'orange_2000_moltres');
  quell(gC, null, 'lightning-cave', 'orange_2000_zapdos');
  quell(gC, null, 'ice-cave', 'orange_2000_articuno');
  gotoMap(gC, 'shamouti-shrine', 7, 10); pump(gC, 400);
  var stormDoneEarly = stC.story.flags.orange_2000_storm_stilled === true && stC.badges.orange.length === 2;
  var owC = gotoMap(gC, 'trovita-gym', 7, 8);
  talk(gC, owC, 'RUDY'); pump(gC, 400);
  ok('B24 storm BEFORE badges 3/4: the whole climax completes at 2 badges, and the Rudy gym then plays + awards the Spike Shell Badge normally (never a gym blocker)',
    stormDoneEarly && stC.badges.orange.includes('spikeshellbadge') && stC.story.flags.badge_spikeshell === true,
    JSON.stringify({ early: stormDoneEarly, badges: stC.badges.orange }));

  globalThis.__OCQ__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__OCQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

// The completed-chain save from the real bundle -> both validators.
{
  const s = globalThis.__O3SAVE__;
  const rv = VAL.validateSave(clone(s));
  const cv = SCH.validateSave(clone(s));
  ok('B25 completed-chain bundle save validates SERVER-side and client-side (round-trip)',
    !!s && rv.ok && cv.ok, JSON.stringify({ server: rv.errors, client: cv.errors }));
}

console.log('\nORANGE CLIMAX TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
