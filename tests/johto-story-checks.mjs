// johto-story-checks.mjs — Arc 2 Stage J4a (Johto story, west) proofs.
// Part A: pure units — the registry flip, quest chain shape, badge
// data + validator plumbing (client schema + server validator +
// gen-tables round-trip), trainer defs vs the mission's teams,
// grounds, tales shape law, event shapes, and NPC placement /
// walk-to-actor connectivity for every appended Johto actor.
// Part B: the built bundle in a headless Game — the TRUE PATH: a
// post-Orange-complete save walks Homecoming #2 -> Pallet dock
// (CAPT JOHTO) -> embark -> the New Bark arrival scene, then the
// whole west chain on the real path (Silver on Route 30, the report
// to Elm, Sprout Tower, four badges through the real leader runner,
// the Slowpoke Well, the GS Ball delivery, the Burned Tower
// awakening), plus the Falkner gate, the Silver LOSS branch, a Town
// Tale, and the Cheat Terminal's Johto badge prefix claim.
// Run: node tests/johto-story-checks.mjs   (exit 1 on any failure)

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
const JOHTO_ORDER = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge', 'glacierbadge', 'risingbadge'];

// ================= Part A: pure units =================
const { arcById } = await import(join(ROOT, 'src/data/arcs.mjs'));
const { JOHTO_QUESTS, JOHTO_TRAINERS, JOHTO_EVENTS, JOHTO_TALES, JOHTO_NPCS, JOHTO_NPC_PATCHES } = await import(join(ROOT, 'src/data/story-johto.mjs'));
const { ITEMS, BADGE_SETS } = await import(join(ROOT, 'src/data/items.mjs'));
const { MAP_GROUND, groundForMap } = await import(join(ROOT, 'src/data/grounds.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO);
const { MAPS6 } = await import(join(ROOT, 'src/data/maps6.mjs'));
const { WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));

{
  const j = arcById('johto');
  ok('A01 registry flip: johto status is shipped; nothing else in the row moved (band 101-200, completionFlag johto_complete, embark pallet->newbark, hook hawthorn)',
    j.status === 'shipped' && j.band.min === 101 && j.band.max === 200
    && j.completionFlag === 'johto_complete' && j.embarkPort === 'pallet' && j.arrivalMap === 'newbark'
    && j.hookGiver === 'hawthorn' && j.badgeSet === 'johto' && j.badgeTotal === 8);
  ok('A02 JOHTO_QUESTS: the west chain in the MAIN_QUESTS idiom (arrival -> thief -> sprout -> zephyr -> well -> gsball -> hive -> plain -> burned -> fog)',
    JOHTO_QUESTS.length === 10
    && JOHTO_QUESTS.every((q) => q.id.startsWith('q_johto_') && q.flag && q.text && q.hint)
    && JOHTO_QUESTS.map((q) => q.flag).join(',') === 'johto_arrival,silver_reported,sprout_tower_done,badge_zephyr,johto_well_cleared,gsball_delivered,badge_hive,badge_plain,beasts_awakened,badge_fog');
  ok('A03 BADGE_SETS.johto is the canonical earn order (zephyr..rising); every badge is a key-pocket ITEMS row',
    JSON.stringify(BADGE_SETS.johto) === JSON.stringify(JOHTO_ORDER)
    && JOHTO_ORDER.every((id) => ITEMS[id] && ITEMS[id].pocket === 'key'));
  const team = (id) => JOHTO_TRAINERS[id].team.map((m) => m.species + ':' + m.level + (m.keepsake ? '+' + m.keepsake : '')).join(',');
  ok('A04 leader teams in the band, aces keep the Classic keepsake (Falkner 108/111/114 sparrowfeather, Bugsy 120/123/126 ironacorn)',
    team('falkner') === 'pidgeotto:108,noctowl:111,pidgeot:114+sparrowfeather'
    && team('bugsy') === 'ariados:120,heracross:123,scizor:126+ironacorn');
  ok('A05 leader teams II (Whitney 131/134/138 Miltank tortoisecharm, Morty 140/143/145/148 spectrebell); every leader badgeSet johto + its badge; every species exists',
    team('whitney') === 'clefairy:131,snubbull:134,miltank:138+tortoisecharm'
    && team('morty') === 'gastly:140,haunter:143,misdreavus:145,gengar:148+spectrebell'
    && ['falkner', 'bugsy', 'whitney', 'morty'].every((id) => JOHTO_TRAINERS[id].badgeSet === 'johto' && JOHTO_ORDER.includes(JOHTO_TRAINERS[id].badge))
    && Object.values(JOHTO_TRAINERS).every((t) => t.team.every((m) => SPECIES[m.species])));
  ok('A06 Silver r30: NOT a leader (no badge), the stolen starter at band floor + Zubat (zubat 104, croconaw 106)',
    !JOHTO_TRAINERS.silver_r30.badge && team('silver_r30') === 'zubat:104,croconaw:106');
  ok('A07 well Rockets inside the band (118-124 across three defs); Sprout monks at tower levels (106-109)',
    ['rocket_well_1', 'rocket_well_2', 'rocket_well_3'].every((id) => JOHTO_TRAINERS[id].team.every((m) => m.level >= 118 && m.level <= 124))
    && ['sprout_monk_1', 'sprout_monk_2'].every((id) => JOHTO_TRAINERS[id].team.every((m) => m.level >= 106 && m.level <= 109)));
  ok('A08 event shapes: arrival sets johto_arrival; the Silver event rides battleAny (win/lose branch flags) before silver_r30_done; the well event sets kurt_well_plea only',
    JOHTO_EVENTS.ev_johto_arrival.some((s) => s.flag === 'johto_arrival')
    && (() => { const ev = JOHTO_EVENTS.ev_johto_silver_r30; const bi = ev.findIndex((s) => s.battleAny); const fi = ev.findIndex((s) => s.flag === 'silver_r30_done');
      return bi >= 0 && ev[bi].battleAny.trainer === 'silver_r30' && ev[bi].battleAny.winFlag === 'silver_r30_won' && ev[bi].battleAny.loseFlag === 'silver_r30_lost' && fi > bi; })()
    && JOHTO_EVENTS.ev_johto_well.some((s) => s.flag === 'kurt_well_plea') && !JOHTO_EVENTS.ev_johto_well.some((s) => s.battleAny || s.battle));
  ok('A09 Burned Tower event ARMS J5 and nothing more: beasts_awakened + beast_seen_suicune set, NO battle step of any kind (a glimpse, not an encounter)',
    JOHTO_EVENTS.ev_johto_burned.some((s) => s.flag === 'beasts_awakened')
    && JOHTO_EVENTS.ev_johto_burned.some((s) => s.flag === 'beast_seen_suicune')
    && JOHTO_EVENTS.ev_johto_burned.every((s) => !s.wildBattle && !s.battle && !s.battleAny));
  ok('A10 west gym Grounds assigned from the existing 15 (storm/bloom/open/grave) + landmark interiors',
    MAP_GROUND['gym-violet'] === 'storm' && MAP_GROUND['gym-azalea'] === 'bloom'
    && MAP_GROUND['gym-goldenrod'] === 'open' && MAP_GROUND['gym-ecruteak'] === 'grave'
    && MAP_GROUND['sprout-tower-2'] === 'bloom' && MAP_GROUND['slowpoke-well'] === 'tide'
    && MAP_GROUND['burned-tower-2'] === 'grave' && groundForMap('gym-ecruteak').id === 'grave');
  ok('A11 six west Town Tales in the shipped shape law (<=3 stages, reward + rewardText, revelation, data lines, johtoTale key, giver matches a patch)',
    Object.keys(JOHTO_TALES).length === 6
    && Object.values(JOHTO_TALES).every((t) => t.johtoTale === true && t.stages.length >= 1 && t.stages.length <= 3
      && t.reward && t.rewardText && t.revelation && Array.isArray(t.offerLines) && Array.isArray(t.stageLines) && Array.isArray(t.finishLines)
      && JOHTO_NPC_PATCHES.some((p) => p.tale === t.id && p.role === 'giver')
      && JOHTO_NPC_PATCHES.some((p) => p.tale === t.id && p.role === 'stage')));
}

// -- badge plumbing: client schema + server validator + gen-tables --
{
  const full = clone(defaultState()); full.badges.johto = JOHTO_ORDER.slice(0, 4);
  const nonPrefix = clone(defaultState()); nonPrefix.badges.johto = ['hivebadge'];
  const reversed = clone(defaultState()); reversed.badges.johto = ['fogbadge', 'zephyrbadge'];
  ok('A12 client schema: west prefix accepted; a lone 2nd badge and a reversed order both rejected (bad-badges-johto)',
    SCH.validateSave(full).ok
    && SCH.validateSave(nonPrefix).errors.includes('bad-badges-johto')
    && SCH.validateSave(reversed).errors.includes('bad-badges-johto'),
    JSON.stringify(SCH.validateSave(full).errors));
  const cloud = clone(defaultState());
  cloud.player.name = 'ASH'; cloud.player.rivalName = 'GARY';
  cloud.story.arc = 'johto'; cloud.story.region = 'johto';
  cloud.badges.kanto = [...BADGE_SETS.kanto]; cloud.badges.orange = [...BADGE_SETS.orange];
  cloud.badges.johto = JOHTO_ORDER.slice(0, 4);
  cloud.story.flags.johto_arrival = true; cloud.story.flags.gsball_delivered = true;
  cloud.story.flags.kurt_has_ball = true; cloud.story.flags.gsball_at_kurt_house = true;
  cloud.story.flags.beasts_awakened = true; cloud.story.flags.silver_r30_won = true;
  cloud.story.regionsDone = ['kanto', 'orange'];
  const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
  const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
  cloud.party = [makeMon('charizard', 150, SPECIES, Object.assign({}, MV1, MOVES2))];
  const rv = VAL.validateSave(clone(cloud));
  ok('A13 server validator accepts the west-complete Johto save (4 badges prefix + story flags + a Lv150 mon in the Johto band)',
    rv.ok && rv.errors.length === 0, JSON.stringify(rv.errors));
  const badCloud = clone(cloud); badCloud.badges.johto = ['zephyrbadge', 'plainbadge'];
  ok('A14 server validator rejects a non-prefix johto set (bad-badge-order)',
    VAL.validateSave(badCloud).errors.includes('bad-badge-order'), JSON.stringify(VAL.validateSave(badCloud).errors));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A15 tables.json in sync; badgeSequences.johto is the earn order, items count 144, quests table carries every q_johto_* + johto tale id',
    checkOut.includes('tables.json OK')
    && JSON.stringify(t.badgeSequences.johto) === JSON.stringify(JOHTO_ORDER)
    && t.items.length === 144
    && JOHTO_QUESTS.every((q) => t.quests.includes(q.id))
    && Object.keys(JOHTO_TALES).every((id) => t.quests.includes(id)), checkOut.trim());
}

// -- NPC placement / walk-to-actor connectivity (the loadMap tables) --
{
  const npcBlocked = (m, x, y) => (m.npcs || []).some((n) => n.x === x && n.y === y)
    || JOHTO_NPCS.some((n) => n.map === m.id && n.x === x && n.y === y);
  const walkable = (m, x, y) => y >= 0 && y < m.rows.length && x >= 0 && x < m.rows[y].length
    && (WALKABLE.has(m.rows[y][x]) || m.rows[y][x] === '~' || m.rows[y][x] === 'W') && !npcBlocked(m, x, y);
  function bfs(m, sx, sy) {
    const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]];
    while (q.length) { const [x, y] = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (!seen.has(k) && walkable(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    return seen;
  }
  let tilesOk = true; const tileDetail = [];
  for (const n of JOHTO_NPCS) {
    const m = MAPS6[n.map];
    const ch = m && m.rows[n.y] ? m.rows[n.y][n.x] : null;
    const onWarp = m && (m.warps || []).some((w) => w.x === n.x && w.y === n.y);
    if (!m || !(WALKABLE.has(ch) || ch === '~' || ch === 'W') || onWarp) { tilesOk = false; tileDetail.push(n.map + ':' + n.name + '@' + n.x + ',' + n.y + '=' + ch); }
  }
  ok('A16 every appended Johto actor stands on a walkable, non-warp tile of its generated map', tilesOk, tileDetail.join(' '));
  let reachOk = true; const reachDetail = [];
  for (const n of JOHTO_NPCS) {
    const m = MAPS6[n.map];
    const entries = (m.warps || []).map((w) => [w.x, w.y]);
    if (m.start) entries.push([m.start.x, m.start.y]);
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (n.x + dx) + ',' + (n.y + dy));
    const reached = entries.some(([ex, ey]) => { const s = bfs(m, ex, ey); return adj.some((a) => s.has(a)); });
    if (!reached) { reachOk = false; reachDetail.push(n.map + ':' + n.name); }
  }
  ok('A17 walk-to-actor: every map entry reaches a tile beside every appended Johto actor (nobody seals a door)', reachOk, reachDetail.join(' '));
  ok('A18 patch table: 12 patches (6 givers + 6 stage actors), every patched name exists in its maps6 roster',
    JOHTO_NPC_PATCHES.length === 12
    && JOHTO_NPC_PATCHES.every((p) => (MAPS6[p.map].npcs || []).some((n) => n.name === p.name)));
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
  function drain(g) { var n = 0; while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && n < 500) { noteLines(g); pA(g); n++; } }
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
  function driveBattle(g) {
    var guard = 0;
    while ((g.scenes.top instanceof BattleScene) && guard < 1500) {
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
  var seenLines = [];
  function noteLines(g) {
    if (g.ui.dlg && g.ui.dlg.lines) for (var i = 0; i < g.ui.dlg.lines.length; i++) if (!seenLines.includes(g.ui.dlg.lines[i])) seenLines.push(g.ui.dlg.lines[i]);
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
  function talk(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    if (!ow.sysNpc(npc) && npc.trainer) ow.startTrainerBattle(npc);
    return npc;
  }
  function talkKind(g, ow, kind) {
    var npc = ow.map.npcs.find(function (n) { return n.johto === kind; });
    if (!npc) return null;
    ow.sysNpc(npc);
    return npc;
  }

  // ================= THE TRUE PATH =================
  // A post-Orange-complete save (the orange-story B15 end state):
  // Kanto + Orange done, the machine's card played, directive johto.
  var g = mkGame(401); boot(g); strongTeam(g, 155);
  var st = g.state;
  st.story.arc = 'orange'; st.story.region = 'orange';
  st.story.regionsDone = ['kanto', 'orange'];
  st.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  st.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  st.story.flags.orange_champion = true; st.story.flags.orange_crew_done = true;
  st.story.flags.arc_card_orange = true; st.story.flags.orange_gsball = true;
  st.story.arc_directive = 'johto';
  st.bag.gsball = 1; st.bag.winnerstrophy = 1;

  gotoMap(g, 'house-pallet-ash', 4, 6); pump(g);
  ok('B01 Homecoming #2 fires on the true path: hook delivered, directive cleared, arc advances to johto, embark armed',
    st.story.arc === 'johto' && st.story.arc_directive === null
    && st.story.flags.hook_johto === true && st.story.flags.embark_johto === true,
    JSON.stringify({ arc: st.story.arc, hook: st.story.flags.hook_johto, embark: st.story.flags.embark_johto }));

  var owP = gotoMap(g, 'pallet', 7, 9);
  talk(g, owP, 'CAPT JOHTO'); pump(g);
  ok('B02 Pallet dock embark: CAPT JOHTO sails the Foundation leg and lands the player in New Bark (reachedarc stamped)',
    owP.mapId === 'newbark' && st.story.flags.reachedarc_johto === true, 'map=' + owP.mapId);

  seenLines = [];
  var owL = gotoMap(g, 'elm-lab', 8, 10);
  var arrivalOpen = g.ui.dialogueOpen === true;
  pump(g);
  var arrivalText = seenLines.join(' | ');
  ok('B03 New Bark arrival scene fires on first elm-lab entry: Elm registers the journey and tells the stolen-starter incident (johto_arrival + elm_registered)',
    arrivalOpen && arrivalText.includes('Professor Elm') && arrivalText.includes('Totodile')
    && st.story.flags.johto_arrival === true && st.story.flags.elm_registered === true,
    arrivalText.slice(0, 140));
  var owL2 = gotoMap(g, 'elm-lab', 8, 10);
  ok('B04 arrival scene fires once: re-entry is quiet', !g.ui.dialogueOpen);

  gotoMap(g, 'r30', 11, 16); pump(g);
  ok('B05 Route 30: the first Silver clash fires after Elm, the branch flag records the honest outcome, and the story continues (silver_r30_done)',
    st.story.flags.silver_r30_done === true
    && (!!st.story.flags.silver_r30_won !== !!st.story.flags.silver_r30_lost),
    JSON.stringify({ won: st.story.flags.silver_r30_won, lost: st.story.flags.silver_r30_lost }));

  var owL3 = gotoMap(g, 'elm-lab', 8, 10);
  seenLines = [];
  talkKind(g, owL3, 'elm'); pump(g);
  ok('B06 report back: Elm names the thief SILVER from the dropped registration and silver_reported completes the thief quest row',
    st.story.flags.silver_reported === true && seenLines.join(' | ').includes('Silver'),
    seenLines.join(' | ').slice(0, 120));

  // ---- a Town Tale rides the same save (New Bark) ----
  var owN = gotoMap(g, 'newbark', 13, 15);
  talk(g, owN, 'ELDER MARA'); pump(g);
  var taleAccepted = st.story.quests.tale_newbark === 'active';
  var owL4 = gotoMap(g, 'elm-lab', 8, 10);
  talk(g, owL4, 'AIDE LIN'); pump(g);
  var owN2 = gotoMap(g, 'newbark', 13, 15);
  talk(g, owN2, 'ELDER MARA'); pump(g);
  ok('B07 Town Tale (New Bark): accept -> lab stage -> giver finish completes tale_newbark through the shipped tale machine',
    taleAccepted && st.story.quests.tale_newbark === 'complete',
    JSON.stringify({ acc: taleAccepted, q: st.story.quests.tale_newbark }));

  // ---- Sprout Tower -> Falkner ----
  var owT1 = gotoMap(g, 'sprout-tower-1', 7, 10);
  talk(g, owT1, 'MONK JIN'); pump(g);
  var monk1 = st.story.flags.beat_sprout_monk_1 === true;
  var owT2 = gotoMap(g, 'sprout-tower-2', 13, 9);
  talk(g, owT2, 'MONK REI'); pump(g);
  talkKind(g, owT2, 'sprout_elder'); pump(g);
  ok('B08 Sprout Tower gauntlet: both monks beaten on the real trainer path, the Elder grants the blessing (sprout_tower_done + 2 Super Potions)',
    monk1 && st.story.flags.beat_sprout_monk_2 === true && st.story.flags.sprout_tower_done === true && (st.bag.superpotion || 0) >= 2,
    JSON.stringify({ m1: monk1, m2: st.story.flags.beat_sprout_monk_2, done: st.story.flags.sprout_tower_done }));

  var owF = gotoMap(g, 'gym-violet', 7, 8);
  talkKind(g, owF, 'falkner'); pump(g);
  ok('B09 Falkner through the real leader runner: Zephyr Badge in badges.johto + badge_zephyr + beat flags',
    st.badges.johto.includes('zephyrbadge') && st.story.flags.badge_zephyr === true && st.story.flags.beat_falkner === true,
    JSON.stringify(st.badges.johto));

  // ---- Slowpoke Well + Kurt + the GS Ball ----
  var owW = gotoMap(g, 'slowpoke-well', 9, 12);
  var pleaOpen = g.ui.dialogueOpen === true;
  pump(g);
  ok('B10 first well entry fires Kurt plea (hurt back, three Rockets named) — kurt_well_plea set',
    pleaOpen && st.story.flags.kurt_well_plea === true);
  talkKind(g, owW, 'rocket_well_1'); pump(g);
  talkKind(g, owW, 'rocket_well_2'); pump(g);
  talkKind(g, owW, 'rocket_well_3'); pump(g);
  ok('B11 the well cleared on the real battle path: all three Rockets beaten and johto_well_cleared set by the third',
    st.story.flags.beat_rocket_well_1 === true && st.story.flags.beat_rocket_well_2 === true
    && st.story.flags.beat_rocket_well_3 === true && st.story.flags.johto_well_cleared === true,
    JSON.stringify({ c: st.story.flags.johto_well_cleared }));

  var owK = gotoMap(g, 'kurt-house', 6, 8);
  talkKind(g, owK, 'kurt'); pump(g);
  ok('B12 GS Ball delivery at kurt-house: the ball leaves the bag, gsball_delivered + kurt_has_ball + gsball_at_kurt_house record its whereabouts for J5',
    st.story.flags.gsball_delivered === true && st.story.flags.kurt_has_ball === true
    && st.story.flags.gsball_at_kurt_house === true && !(st.bag.gsball > 0),
    JSON.stringify({ bag: st.bag.gsball, d: st.story.flags.gsball_delivered }));

  var owB = gotoMap(g, 'gym-azalea', 7, 8);
  talkKind(g, owB, 'bugsy'); pump(g);
  ok('B13 Bugsy through the real leader runner: Hive Badge (badges.johto prefix grows in earn order)',
    JSON.stringify(st.badges.johto) === JSON.stringify(['zephyrbadge', 'hivebadge']) && st.story.flags.badge_hive === true,
    JSON.stringify(st.badges.johto));

  var owG = gotoMap(g, 'gym-goldenrod', 7, 8);
  talkKind(g, owG, 'whitney'); pump(g);
  ok('B14 Whitney through the real leader runner: Plain Badge (Miltank faced and beaten)',
    st.badges.johto.includes('plainbadge') && st.story.flags.badge_plain === true && st.story.flags.beat_whitney === true,
    JSON.stringify(st.badges.johto));

  // ---- Burned Tower + Morty ----
  gotoMap(g, 'burned-tower-2', 2, 11); pump(g);
  ok('B15 Burned Tower basement: the awakening fires — statues gone, Suicune glimpsed (scene, not a battle), beasts_awakened arms J5',
    st.story.flags.beasts_awakened === true && st.story.flags.beast_seen_suicune === true && st.story.flags.johto_burned_tower === true);

  var owM = gotoMap(g, 'gym-ecruteak', 7, 8);
  talkKind(g, owM, 'morty'); pump(g);
  ok('B16 Morty through the real leader runner: Fog Badge — west set complete in earn order (4/8)',
    JSON.stringify(st.badges.johto) === JSON.stringify(['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge'])
    && st.story.flags.badge_fog === true,
    JSON.stringify(st.badges.johto));
  seenLines = [];
  talkKind(g, owM, 'morty'); pump(g);
  ok('B17 Morty post-badge names what woke (Raikou / Entei / Suicune) — the J5 arming dialogue',
    seenLines.join(' | ').includes('Raikou') && seenLines.join(' | ').includes('Suicune'),
    seenLines.join(' | ').slice(0, 120));

  g.openQuestLog();
  var labels = g.ui.menu.items.map(function (i) { return i.label; });
  var fogRow = labels.find(function (l) { return l.includes('Fog Badge'); });
  ok('B18 Quest Log renders the JOHTO section on the true path; the Fog row reads complete',
    labels.some(function (l) { return l.includes('JOHTO'); }) && !!fogRow && fogRow.indexOf('★') === 0,
    labels.filter(function (l) { return l.includes('Badge') || l.includes('JOHTO'); }).join(' / ').slice(0, 200));
  globalThis.__J4SAVE__ = JSON.parse(JSON.stringify(st));

  // ================= branch drives =================
  // Falkner gate: no Sprout blessing, no battle.
  var g2 = mkGame(402); boot(g2); strongTeam(g2, 155);
  g2.state.story.flags.johto_arrival = true;
  var owF2 = gotoMap(g2, 'gym-violet', 7, 8);
  seenLines = [];
  talkKind(g2, owF2, 'falkner'); pump(g2);
  ok('B19 Falkner gate: without the Sprout blessing he sends the challenger to the tower first — no battle, no badge',
    seenLines.join(' | ').includes('Sprout Tower first') && !(g2.scenes.top instanceof BattleScene) && g2.state.badges.johto.length === 0,
    seenLines.join(' | ').slice(0, 120));

  // Silver LOSS branch: a weak team loses, the story still continues,
  // and the friendly staging means no blackout warp off Route 30.
  var g3 = mkGame(403); boot(g3);
  g3.state.party = [makeMon('rattata', 5, SPECIES, MOVES)];
  g3.state.story.flags.johto_arrival = true;
  var owS = gotoMap(g3, 'r30', 11, 16); pump(g3);
  ok('B20 Silver loss branch: silver_r30_lost (not won) + silver_r30_done, and the player is still standing on Route 30',
    g3.state.story.flags.silver_r30_lost === true && !g3.state.story.flags.silver_r30_won
    && g3.state.story.flags.silver_r30_done === true && owS.mapId === 'r30',
    JSON.stringify({ lost: g3.state.story.flags.silver_r30_lost, map: owS.mapId }));

  // Cheat Terminal: the Johto set stocks and prefix-completes alone.
  var g4 = mkGame(404); var ow4 = boot(g4);
  var claimedJ = ow4.cheatClaimBadge('fogbadge');
  ok('B21 cheat claim of the Fog Badge prefix-completes the JOHTO set only (kanto/orange untouched)',
    claimedJ === true && JSON.stringify(g4.state.badges.johto) === JSON.stringify(['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge'])
    && g4.state.badges.kanto.length === 0 && g4.state.badges.orange.length === 0
    && g4.state.story.flags.badge_fog === true,
    JSON.stringify(g4.state.badges));

  globalThis.__JQ__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__JQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

// The true-path save from the real bundle -> both validators.
{
  const s = globalThis.__J4SAVE__;
  const rv = VAL.validateSave(clone(s));
  const cv = SCH.validateSave(clone(s));
  ok('B22 true-path bundle save validates SERVER-side and client-side (round-trip)',
    !!s && rv.ok && cv.ok, JSON.stringify({ server: rv.errors, client: cv.errors }));
}

console.log('\nJOHTO STORY (J4a) TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
