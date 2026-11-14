// orange-story-checks.mjs — Arc 1.5 Stage O2 (Orange story) proofs.
// Part A: pure units — quest chain shape, badge data + validator
// plumbing (client schema + server validator + gen-tables round-trip),
// trainer defs vs the mission's teams, legacy save-fill, grounds, and
// leader placement / walk-to-leader connectivity per gym.
// Part B: the built bundle in a headless Game — Ivy's GS Ball grant
// (once + the Cheat-owners variant), Lapras (party + box delivery,
// once, pod reunion), each Crew badge through the real NPC + battle
// path, Luana's two-stage carry, Drake's 3-badge refusal, and Drake's
// victory wiring the Stage F transition machine (card + directive).
// Run: node tests/orange-story-checks.mjs   (exit 1 on any failure)

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
const { ORANGE_QUESTS, ORANGE_TRAINERS, ORANGE_EVENTS } = await import(join(ROOT, 'src/data/story-orange.mjs'));
const { ITEMS, BADGE_SETS } = await import(join(ROOT, 'src/data/items.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2);
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const MOVES = Object.assign({}, MV1, MOVES2);
const ORANGE_ORDER = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];

{
  ok('A01 ORANGE_QUESTS: the O2 chain (gsball -> crew -> league) in the MAIN_QUESTS idiom, crew stage counts badges, league flag is orange_champion; the O3 storm stage APPENDS at the seam (4th, titanCount, flag orange_2000_storm_stilled — never a gym blocker)',
    ORANGE_QUESTS.length === 4
    && ORANGE_QUESTS.every((q) => q.id && q.flag && q.text && q.hint)
    && ORANGE_QUESTS[0].flag === 'orange_gsball' && ORANGE_QUESTS[1].flag === 'orange_crew_done'
    && ORANGE_QUESTS[1].badgeCount === true && ORANGE_QUESTS[2].flag === 'orange_champion'
    && ORANGE_QUESTS[3].id === 'q_orange_storm' && ORANGE_QUESTS[3].flag === 'orange_2000_storm_stilled' && ORANGE_QUESTS[3].titanCount === true);
  ok('A02 BADGE_SETS.orange is the canonical earn order; every badge + the trophy is a real ITEMS row (badges key-pocket, trophy collectible)',
    JSON.stringify(BADGE_SETS.orange) === JSON.stringify(ORANGE_ORDER)
    && ORANGE_ORDER.every((id) => ITEMS[id] && ITEMS[id].pocket === 'key')
    && ITEMS.winnerstrophy && ITEMS.winnerstrophy.collectible === true);
  ok('A03 the Sealed Orb story item is the Cheat Shop collectible (one id: gsball, collectible-flagged)',
    ITEMS.gsball && ITEMS.gsball.collectible === true && ORANGE_EVENTS.ev_orange_ivy.some((s) => s.gsBall));
  const team = (id) => ORANGE_TRAINERS[id].team.map((m) => m.species + ':' + m.level).join(',');
  ok('A04 Crew teams match the mission (Sela 38/40, Oren 41/42/44, Renzo 44/45/47)',
    team('cissy') === 'seadra:38,starmie:40'
    && team('danny') === 'nidoqueen:41,machoke:42,scyther:44'
    && team('rudy') === 'electabuzz:44,exeggutor:45,starmie:47');
  ok('A05 Alba adaptation: two defs, Alakazam pair first (48) then Marowak pair (50), badge ONLY on stage B',
    team('luana_a') === 'alakazam:48,hypno:46' && team('luana_b') === 'marowak:50,gengar:48'
    && !ORANGE_TRAINERS.luana_a.badge && ORANGE_TRAINERS.luana_b.badge === 'jadestarbadge');
  ok('A06 Barrow: 6v6 in order, Dragonite Lv58 ace, no badge on the def (the trophy path awards it)',
    team('drake') === 'ditto:52,onix:53,gengar:54,venusaur:55,electabuzz:56,dragonite:58' && !ORANGE_TRAINERS.drake.badge);
  ok('A07 every Crew def carries badgeSet orange + its badge; every team species exists',
    ['cissy', 'danny', 'rudy', 'luana_b'].every((id) => ORANGE_TRAINERS[id].badgeSet === 'orange' && ORANGE_ORDER.includes(ORANGE_TRAINERS[id].badge))
    && Object.values(ORANGE_TRAINERS).every((t) => t.team.every((m) => SPECIES[m.species] && MOVES)));
  ok('A08 Lapras events: gift is cap-safe Lv30 with the joined flag AFTER the gift step; pod event is flag-only (no removal step exists)',
    (() => { const ev = ORANGE_EVENTS.ev_orange_lapras; const gi = ev.findIndex((s) => s.giftCapSafe); const fi = ev.findIndex((s) => s.flag === 'orange_lapras_joined');
      return gi >= 0 && ev[gi].giftCapSafe.species === 'lapras' && ev[gi].giftCapSafe.level === 30 && fi > gi; })()
    && ORANGE_EVENTS.ev_orange_lapras_pod.every((s) => !s.giftCapSafe && !s.giveMon)
    && ORANGE_EVENTS.ev_orange_lapras_pod.some((s) => s.flag === 'orange_lapras_pod'));
}

// -- badge plumbing: default state, legacy fill, client + server validators --
{
  const fresh = defaultState();
  ok('A09 default state carries badges.orange = [] alongside kanto',
    Array.isArray(fresh.badges.orange) && fresh.badges.orange.length === 0 && Array.isArray(fresh.badges.kanto));
  const legacy = clone(defaultState());
  delete legacy.badges.orange;
  legacy.badges.kanto = ['boulderbadge'];
  legacy.player.name = 'ASH'; legacy.player.rivalName = 'VALE';
  const filled = SCH.migrate(legacy);
  ok('A10 legacy save (no badges.orange) fills to [] with zero loss (kanto badge + name intact) and validates client-side',
    Array.isArray(filled.badges.orange) && filled.badges.orange.length === 0
    && JSON.stringify(filled.badges.kanto) === JSON.stringify(['boulderbadge'])
    && SCH.validateSave(filled).ok, JSON.stringify(SCH.validateSave(filled).errors));
  const nonPrefix = clone(defaultState()); nonPrefix.badges.orange = ['searubybadge'];
  const reversed = clone(defaultState()); reversed.badges.orange = ['jadestarbadge', 'coraleyebadge'];
  const full = clone(defaultState()); full.badges.orange = [...ORANGE_ORDER];
  ok('A11 client schema: full prefix accepted; a lone 2nd badge and a reversed order both rejected (bad-badges-orange)',
    SCH.validateSave(full).ok
    && SCH.validateSave(nonPrefix).errors.includes('bad-badges-orange')
    && SCH.validateSave(reversed).errors.includes('bad-badges-orange'));
  // The cloud round-trip: 4 orange badges + trophy + orange_champion.
  const cloud = clone(defaultState());
  cloud.player.name = 'ASH'; cloud.player.rivalName = 'VALE';
  cloud.story.arc = 'orange'; cloud.story.region = 'orange';
  cloud.badges.orange = [...ORANGE_ORDER];
  cloud.badges.kanto = [...BADGE_SETS.kanto];
  cloud.bag.winnerstrophy = 1; cloud.bag.gsball = 1;
  cloud.story.flags.orange_champion = true; cloud.story.flags.orange_gsball = true;
  cloud.story.regionsDone = ['kanto', 'orange'];
  cloud.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }], badges: 4 }];
  cloud.party = [makeMon('venusaur', 63, SPECIES, MOVES)];
  const rv = VAL.validateSave(clone(cloud));
  ok('A12 server validator accepts the completed Orange save (4 badges + trophy + gsball + orange_champion + HoF entry)',
    rv.ok && rv.errors.length === 0, JSON.stringify(rv.errors));
  const badCloud = clone(cloud); badCloud.badges.orange = ['coraleyebadge', 'spikeshellbadge'];
  ok('A13 server validator rejects a non-prefix orange set (bad-badge-order)',
    VAL.validateSave(badCloud).errors.includes('bad-badge-order'), JSON.stringify(VAL.validateSave(badCloud).errors));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A14 tables.json in sync; badgeSequences.orange is the earn order and the quests table carries the orange ids',
    checkOut.includes('tables.json OK')
    && JSON.stringify(t.badgeSequences.orange) === JSON.stringify(ORANGE_ORDER)
    && ORANGE_QUESTS.every((q) => t.quests.includes(q.id)), checkOut.trim());
}

// -- grounds + placement / connectivity --
{
  const { MAP_GROUND, groundForMap } = await import(join(ROOT, 'src/data/grounds.mjs'));
  ok('A15 Orange gym/stadium Grounds assigned from the existing 15 (tide/frost/rubble/mind/open/open)',
    MAP_GROUND['mikan-gym'] === 'tide' && MAP_GROUND['navel-gym'] === 'frost'
    && MAP_GROUND['trovita-gym'] === 'rubble' && MAP_GROUND['kumquat-gym'] === 'mind'
    && MAP_GROUND['pummelo-stadium'] === 'open' && MAP_GROUND['ivy-lab'] === 'open'
    && groundForMap('mikan-gym').id === 'tide');
  const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
  const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
  const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
  const { MAPS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
  const { MAPS5 } = await import(join(ROOT, 'src/data/maps5.mjs'));
  const ALL = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4, MAPS5);
  const { WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));
  const expect = { 'ivy-lab': 'ivy', 'mikan-gym': 'cissy', 'navel-gym': 'danny', 'trovita-gym': 'rudy', 'kumquat-gym': 'luana', 'pummelo-stadium': 'drake' };
  ok('A16 Orange actors placed in O1 maps (Isla + 4 leaders + Barrow + stadium official)',
    Object.entries(expect).every(([mid, kind]) => (ALL[mid].npcs || []).some((n) => n.orange === kind))
    && (ALL['pummelo-stadium'].npcs || []).some((n) => n.orange === 'stadium-official'));
  // Walk-to-leader: BFS from each gym's entry warp tiles to a tile
  // ADJACENT to the leader (leader tile itself is NPC-blocked, exactly
  // as the connectivity sweep treats NPCs).
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
  let allReach = true; const detail = [];
  for (const [mid, kind] of Object.entries(expect)) {
    if (mid === 'ivy-lab') continue; // Ivy is met by the entry scene, not a walk-up
    const m = ALL[mid];
    const leader = m.npcs.find((n) => n.orange === kind);
    const entries = (m.warps || []).map((w) => [w.x, w.y]);
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (leader.x + dx) + ',' + (leader.y + dy));
    const reached = entries.some(([ex, ey]) => { const s = bfs(m, ex, ey); return adj.some((a) => s.has(a)); });
    if (!reached) { allReach = false; detail.push(mid); }
  }
  ok('A17 walk-to-leader: every gym/stadium entry reaches a tile beside its leader (leaders block nothing)', allReach, detail.join(','));
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
    if (!cond) { Q.failures++; console.error('OS-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('os-pass ' + name);
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
  function drain(g) { var n = 0; while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && n < 500) { noteLines(g); if (g.scenes.top instanceof BattleScene) noteBattle(g, g.scenes.top); pA(g); n++; } }
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
  function pickVal(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
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
  function driveBattle(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 1200) {
      guard++;
      drain(g);
      if (!(g.scenes.top instanceof BattleScene)) break;
      var b = g.scenes.top;
      noteBattle(g, b);
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
        } else if (m.title === 'Choose next Kin' || m.title === 'Party') {
          var idx2 = g.state.party.findIndex(function (mm) { return mm.hp > 0 && mm !== b.ally; });
          g.ui.debugChoose(idx2 >= 0 ? idx2 : m.items.length - 1); tk(g, 3);
        } else { g.ui.debugChoose(m.items.length - 1); tk(g, 3); }
      } else { pA(g); tk(g, 3); }
    }
    drain(g);
  }
  var seenLines = [];
  function noteLines(g) {
    if (g.ui.dlg && g.ui.dlg.lines) for (var i = 0; i < g.ui.dlg.lines.length; i++) if (!seenLines.includes(g.ui.dlg.lines[i])) seenLines.push(g.ui.dlg.lines[i]);
  }
  // Luana stage-B capture: stage B's BattleScene can be constructed
  // and driven INSIDE one driveBattle/drain chain (stage A's onEnd
  // chains straight into it), so the carry must be recorded from
  // inside the battle loop, at stage B's first sight.
  var stageBCapture = { hp: null };
  function noteBattle(g, b) {
    if (b && b.trainer && b.trainer.id === 'luana_b' && stageBCapture.hp === null) {
      stageBCapture.hp = g.state.party.map(function (m) { return m.hp + '/' + m.maxHp; }).join(',');
    }
  }
  // Generic flow pump: dialogues drained, menus answered (yes first,
  // else the first enabled row), battles driven to completion.
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
  function talk(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    ow.sysNpc(npc);
    return npc;
  }

  // ---- B1/B2: Ivy — GS Ball grant once + the cheat-owned variant ----
  var g1 = mkGame(301); boot(g1);
  seenLines = [];
  var ow1 = gotoMap(g1, 'ivy-lab', 8, 10);
  var ivyIntroOpen = g1.ui.dialogueOpen === true;
  pump(g1);
  var ivyIntro = seenLines.join(' | ');
  ok('B01 first entry to ivy-lab fires Isla intro; Sealed Orb granted (bag gsball = 1) and orange_gsball flag set',
    ivyIntroOpen && ivyIntro.includes('Professor Isla') && g1.state.bag.gsball === 1 && g1.state.story.flags.orange_gsball === true,
    ivyIntro.slice(0, 120) + ' bag=' + g1.state.bag.gsball);
  var ow1b = gotoMap(g1, 'ivy-lab', 8, 10);
  ok('B02 Isla intro fires once: re-entry is quiet, no second grant',
    !g1.ui.dialogueOpen && g1.state.bag.gsball === 1);

  var g2 = mkGame(302); boot(g2);
  g2.state.bag.gsball = 5; // Cheat Terminal stock, pre-owned
  seenLines = [];
  var ow2 = gotoMap(g2, 'ivy-lab', 8, 10);
  pump(g2);
  var variantSeen = seenLines.some(function (l) { return l.includes('already carrying one'); });
  ok('B03 cheat-owned Sealed Orb: scene still plays with the variant line, NO duplicate grant (still 5), flag set',
    variantSeen && g2.state.bag.gsball === 5 && g2.state.story.flags.orange_gsball === true,
    'bag=' + g2.state.bag.gsball + ' variant=' + variantSeen);

  // ---- B3-B6: Lapras (party + box delivery, once, pod reunion) ----
  var g3 = mkGame(303); boot(g3); strongTeam(g3, 60);
  g3.state.party = g3.state.party.slice(0, 2);
  g3.state.badges.orange = ['coraleyebadge'];
  gotoMap(g3, 'valencia', 14, 15);
  pump(g3);
  var lap = g3.state.party.find(function (m) { return m.speciesId === 'lapras'; });
  ok('B04 Lapras: after the first Orange badge the Valencia shore scene gifts a Lv30 Lapras to the party + dex',
    !!lap && lap.level === 30 && g3.state.story.flags.orange_lapras_joined === true && g3.state.dex.caught[131] === true,
    lap ? 'lv' + lap.level : 'no lapras');
  gotoMap(g3, 'valencia', 14, 15);
  ok('B05 Lapras gift fires once: re-entry is quiet', !g3.ui.dialogueOpen
    && g3.state.party.filter(function (m) { return m.speciesId === 'lapras'; }).length === 1);

  var g4 = mkGame(304); boot(g4); strongTeam(g4, 60); // full party of 6
  g4.state.badges.orange = ['coraleyebadge'];
  gotoMap(g4, 'valencia', 14, 15);
  pump(g4);
  var boxedLap = (g4.state.boxes.box1 || []).find(function (m) { return m.speciesId === 'lapras'; });
  var boxToast = g4.ui.log.some(function (e) { return e.ui === 'toast' && /Box 1/.test(e.text || ''); });
  ok('B06 Lapras box path: full party delivers to the first PC box with space, toast names Box 1, party untouched',
    !!boxedLap && boxedLap.level === 30 && boxToast && g4.state.party.length === 6
    && !g4.state.party.some(function (m) { return m.speciesId === 'lapras'; }),
    'boxed=' + !!boxedLap + ' toast=' + boxToast);

  g3.state.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  gotoMap(g3, 'pummelo', 15, 15);
  pump(g3);
  ok('B07 pod reunion (4 badges, first Pummelo entry): flag set, Lapras visits and CHOOSES to stay — still in the party, never removed',
    g3.state.story.flags.orange_lapras_pod === true
    && g3.state.party.some(function (m) { return m.speciesId === 'lapras'; }));

  // ---- B8-B11: the Orange Crew through the real NPC + battle path ----
  function crewRun(seed, map, npcName, badgeId, flagRoot) {
    var g = mkGame(seed); boot(g); strongTeam(g, 75);
    var ow = gotoMap(g, map, 7, 8);
    talk(g, ow, npcName);
    pump(g);
    return g;
  }
  var gc = crewRun(305, 'mikan-gym', 'SELA', 'coraleyebadge', 'coraleye');
  ok('B08 Sela: target challenge -> battle -> Coral-Eye Badge in badges.orange + badge_coraleye flag + beat flag',
    gc.state.badges.orange.includes('coraleyebadge') && gc.state.story.flags.badge_coraleye === true && gc.state.story.flags.beat_cissy === true,
    JSON.stringify(gc.state.badges.orange));
  var owc = gotoMap(gc, 'mikan-gym', 7, 8);
  talk(gc, owc, 'SELA'); var postC = gc.ui.dlg ? gc.ui.dlg.lines.join(' ') : ''; drain(gc);
  ok('B09 beaten leader talks post-badge dialogue (no re-battle)', postC.includes('Coral-Eye holder') && !(gc.scenes.top instanceof BattleScene), postC.slice(0, 80));

  var gd = crewRun(306, 'navel-gym', 'OREN', 'searubybadge', 'searuby');
  ok('B10 Oren: summit battle -> Sea Ruby Badge (sled ceremony follows the win)',
    gd.state.badges.orange.includes('searubybadge') && gd.state.story.flags.badge_searuby === true
    && seenLines.some(function (l) { return l.includes('ceremony'); }),
    JSON.stringify(gd.state.badges.orange));

  var gr = crewRun(307, 'trovita-gym', 'RENZO', 'spikeshellbadge', 'spikeshell');
  ok('B11 Renzo: type drill -> battle -> Spike Shell Badge',
    gr.state.badges.orange.includes('spikeshellbadge') && gr.state.story.flags.badge_spikeshell === true,
    JSON.stringify(gr.state.badges.orange));

  // ---- B12: Luana two-stage carry ----
  var g5 = mkGame(308); boot(g5); strongTeam(g5, 75);
  g5.state.party.forEach(function (m) { m.hp = Math.floor(m.maxHp * 0.6); }); // pre-damaged: any heal between stages would top this up
  var ow5 = gotoMap(g5, 'kumquat-gym', 7, 8);
  stageBCapture.hp = null;
  talk(g5, ow5, 'ALBA');
  pump(g5, 400);
  var stageBHp = stageBCapture.hp;
  var stageBCarried = stageBHp !== null && stageBHp.split(',').every(function (s) { var p = s.split('/'); return Number(p[0]) < Number(p[1]); });
  ok('B12 Alba: stage B (luana_b) was reached and party damage CARRIED into it (every mon below full at stage-B start — no heal)',
    stageBHp !== null && stageBCarried, 'stageB=' + stageBHp);
  ok('B13 Alba: clearing both stages awards the Jade Star Badge once (badges.orange) + crew-complete flag NOT yet implied by one badge',
    g5.state.badges.orange.filter(function (b) { return b === 'jadestarbadge'; }).length === 1
    && g5.state.story.flags.badge_jadestar === true && g5.state.story.flags.beat_luana_b === true,
    JSON.stringify(g5.state.badges.orange));

  // ---- B14: Drake gate at 3 badges (official + Drake himself) ----
  var g6 = mkGame(309); boot(g6); strongTeam(g6, 80);
  g6.state.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge'];
  var ow6 = gotoMap(g6, 'pummelo-stadium', 11, 12);
  talk(g6, ow6, 'LEAGUE OFFICIAL');
  var offLines = g6.ui.dlg ? g6.ui.dlg.lines.join(' | ') : ''; drain(g6);
  talk(g6, ow6, 'BARROW');
  var drakeRefusal = g6.ui.dlg ? g6.ui.dlg.lines.join(' | ') : ''; drain(g6);
  ok('B14 Barrow gate refuses at 3 badges: official AND Barrow name the count held (3 of the 4), no battle starts',
    offLines.includes('3 of the 4') && drakeRefusal.includes('3 of the 4')
    && !(g6.scenes.top instanceof BattleScene) && !g6.state.story.flags.orange_champion,
    offLines.slice(0, 90) + ' // ' + drakeRefusal.slice(0, 90));

  // ---- B15: Drake victory -> trophy + HoF + machine card/directive ----
  var g7 = mkGame(310); boot(g7); strongTeam(g7, 80);
  var st7 = g7.state;
  st7.story.arc = 'orange'; st7.story.region = 'orange';
  st7.story.regionsDone = ['kanto'];
  st7.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  st7.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  st7.story.flags.orange_crew_done = true;
  var hofBefore = st7.story.hof.length;
  seenLines = [];
  var ow7 = gotoMap(g7, 'pummelo-stadium', 11, 12);
  talk(g7, ow7, 'BARROW');
  pump(g7, 500);
  var lastHof = st7.story.hof[st7.story.hof.length - 1];
  ok('B15 Barrow victory: orange_champion set, Winner Trophy granted once, HoF entry recorded with the winning team snapshot',
    st7.story.flags.orange_champion === true && st7.bag.winnerstrophy === 1
    && st7.story.hof.length === hofBefore + 1 && !!lastHof && lastHof.badges === 4
    && lastHof.team.length === 6 && lastHof.team[0].speciesId === 'partner',
    JSON.stringify({ champ: st7.story.flags.orange_champion, trophy: st7.bag.winnerstrophy, hof: st7.story.hof.length }));
  var cardSeen = seenLines.some(function (l) { return l.includes('ARC 1.5') && l.includes('COMPLETE'); });
  ok('B16 the transition MACHINE fired (not a hand-rolled ending): arc_card_orange stamped, regionsDone carries orange, directive pinned on Johto',
    st7.story.flags.arc_card_orange === true && st7.story.regionsDone.includes('orange')
    && st7.story.arc_directive === 'johto' && cardSeen,
    JSON.stringify({ card: st7.story.flags.arc_card_orange, done: st7.story.regionsDone, dir: st7.story.arc_directive, seen: cardSeen }));
  globalThis.__ORANGESAVE__ = JSON.parse(JSON.stringify(st7));

  // ---- B17: Quest Log Orange section ----
  var g8 = mkGame(311); boot(g8);
  g8.state.story.flags.hook_orange = true;
  g8.state.badges.orange = ['coraleyebadge', 'searubybadge'];
  g8.openQuestLog();
  var labels8 = g8.ui.menu.items.map(function (i) { return i.label; });
  var crewRow = labels8.find(function (l) { return l.includes('Amber Crew badges'); });
  ok('B17 Quest Log renders the ORANGE ISLANDS section once reached; crew stage tracks 2/4 badges',
    labels8.some(function (l) { return l.includes('AMBER ISLES'); }) && !!crewRow && crewRow.includes('2/4 badges'),
    labels8.join(' / ').slice(0, 260));

  // ---- B18: Cheat Terminal orange badge claims (prefix per set, independent) ----
  var g9 = mkGame(312); var ow9 = boot(g9);
  var claimed = ow9.cheatClaimBadge('spikeshellbadge');
  ok('B18 cheat claim of Spike Shell prefix-completes the ORANGE set only (kanto untouched)',
    claimed === true && JSON.stringify(g9.state.badges.orange) === JSON.stringify(['coraleyebadge','searubybadge','spikeshellbadge'])
    && g9.state.badges.kanto.length === 0 && g9.state.story.flags.badge_spikeshell === true,
    JSON.stringify(g9.state.badges));
  ow9.cheatClaimBadge('jadestarbadge');
  ok('B19 cheat claim of Jade Star completes the Crew (orange_crew_done) — sets stay independent',
    g9.state.badges.orange.length === 4 && g9.state.story.flags.orange_crew_done === true && g9.state.badges.kanto.length === 0);

  globalThis.__OSQ__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__OSQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

// The Drake-victory save from the real bundle -> both validators.
{
  const s = globalThis.__ORANGESAVE__;
  const rv = VAL.validateSave(clone(s));
  const cv = SCH.validateSave(clone(s));
  ok('B20 Barrow-victory bundle save validates SERVER-side and client-side (round-trip)',
    !!s && rv.ok && cv.ok, JSON.stringify({ server: rv.errors, client: cv.errors }));
}

console.log('\nORANGE STORY TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
