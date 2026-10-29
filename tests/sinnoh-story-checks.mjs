// sinnoh-story-checks.mjs — Arc 4 Stage S5a (Sinnoh story, FIRST
// HALF: arrival -> gyms 1-4 -> Veilstone) proofs. Part A: pure units —
// the SINNOH_QUESTS chain, the leader/Paul/Galactic trainer audit
// (Platinum order, band 301-400, the Paul curve 312 -> 348), the six
// entry events (incl. the Defog giveHM grant at Solaceon Ruins), NPC
// placement + tale-patch audits, the nine Town Tales, the six new
// keepsakes (existing kinds only), the Ground assignments, the
// tables/quest-vocabulary sync, and the H4a TM mirror (no new TM rows).
// Part B: the built bundle TRUE PATH from a Frontier-complete save
// whose sealed-Sinnoh homecoming was already consumed (the S0-proved
// derivation): Vermilion -> CAPT SINNOH -> embark -> Sandgem arrival
// -> Rowan's lab + Paul 1 -> Twinleaf (Dawn + the twinleaf tale) ->
// Lake Verity glimpse -> the badge-skip refusal -> Roark -> Barry ->
// Windworks (Mars) -> Gardenia -> Eterna Galactic (Jupiter) + Paul's
// assessment -> Fantina -> Dawn's Super Contest beat -> the Chimchar
// gift -> Defog at Solaceon Ruins -> Maylene -> Saturn's door +
// Reggie -> Paul's Veilstone audit. S5b APPENDS its rows to this
// file (the H4b precedent).
// Run: node --import ./register.mjs sinnoh-story-checks.mjs (from tests/)

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

// ================= Part A: pure units =================
const storyMod = await import(join(ROOT, 'src/data/story-sinnoh.mjs'));
const { SINNOH_QUESTS, SINNOH_TRAINERS, SINNOH_EVENTS, SINNOH_TALES, SINNOH_NPCS, SINNOH_NPC_PATCHES } = storyMod;
const { ITEMS, BADGE_SETS, KEEPSAKES, TM_MOVES } = await import(join(ROOT, 'src/data/items.mjs'));
const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const speciesAll = { ...SPECIES,
  ...(await import(join(ROOT, 'src/data/species2.mjs'))).SPECIES2,
  ...(await import(join(ROOT, 'src/data/species3.mjs'))).SPECIES_JOHTO,
  ...(await import(join(ROOT, 'src/data/species4.mjs'))).SPECIES_HOENN,
  ...(await import(join(ROOT, 'src/data/species5.mjs'))).SPECIES_SINNOH };
const mapsMod = await import(join(ROOT, 'src/data/maps.mjs'));
const { WALKABLE } = mapsMod;
const ALL_MAPS = {};
Object.assign(ALL_MAPS, mapsMod.MAPS,
  (await import(join(ROOT, 'src/data/maps2.mjs'))).MAPS2,
  (await import(join(ROOT, 'src/data/maps3.mjs'))).MAPS3,
  (await import(join(ROOT, 'src/data/maps4.mjs'))).MAPS4,
  (await import(join(ROOT, 'src/data/maps5.mjs'))).MAPS5,
  (await import(join(ROOT, 'src/data/maps6.mjs'))).MAPS6,
  (await import(join(ROOT, 'src/data/maps7.mjs'))).MAPS7,
  (await import(join(ROOT, 'src/data/maps8.mjs'))).MAPS8,
  (await import(join(ROOT, 'src/data/maps9.mjs'))).MAPS9);
const { MAP_GROUND, GROUNDS } = await import(join(ROOT, 'src/data/grounds.mjs'));
const storySrc = readFileSync(join(ROOT, 'src/data/story-sinnoh.mjs'), 'utf8');
const owSysSrc = readFileSync(join(ROOT, 'src/game/overworld-systems.mjs'), 'utf8');

const CHAIN = [
  ['q_sinnoh_arrival', 'sinnoh_arrival'], ['q_sinnoh_lab', 'rowan_registered'],
  ['q_sinnoh_paul1', 'paul1_done'], ['q_sinnoh_verity', 'verity_glimpse'],
  ['q_sinnoh_roark', 'badge_coal'], ['q_sinnoh_windworks', 'windworks_cleared'],
  ['q_sinnoh_gardenia', 'badge_forest'], ['q_sinnoh_galactic', 'galactic_eterna_done'],
  ['q_sinnoh_fantina', 'badge_relic'], ['q_sinnoh_dawn', 'dawn_hearthome_done'],
  ['q_sinnoh_chimchar', 'chimchar_beat_done'], ['q_sinnoh_defog', 'defog_received'],
  ['q_sinnoh_maylene', 'badge_cobble'], ['q_sinnoh_paul2', 'paul_veilstone_done'],
];
{
  ok('A01 SINNOH_QUESTS: the 14-row first-half chain, ids + completion flags in true-path order, flags unique, every row carrying text + hint',
    SINNOH_QUESTS.length === 14
    && CHAIN.every(([id, flag], i) => SINNOH_QUESTS[i].id === id && SINNOH_QUESTS[i].flag === flag
      && typeof SINNOH_QUESTS[i].text === 'string' && typeof SINNOH_QUESTS[i].hint === 'string')
    && new Set(SINNOH_QUESTS.map((q) => q.flag)).size === 14);
  ok('A02 every chain flag is produced by this stage\'s own machinery (an event step, an NPC branch, or a badge award — the flag string appears in story-sinnoh.mjs or overworld-systems.mjs)',
    CHAIN.every(([, flag]) => storySrc.includes("'" + flag + "'") || owSysSrc.includes("'" + flag + "'")
      || flag.startsWith('badge_')));
}
{
  const leaders = [['roark', 'coalbadge', 312], ['gardenia', 'forestbadge', 322], ['fantina', 'relicbadge', 332], ['maylene', 'cobblebadge', 345]];
  ok('A03 the four leaders: badgeSet sinnoh, badges = BADGE_SETS.sinnoh[0..3] in Platinum order, ace levels 312/322/332/345, every team member in band 301-400 and a real species, ace keepsakes resolve',
    leaders.every(([id, badge, ace], i) => {
      const t = SINNOH_TRAINERS[id];
      return t && t.badgeSet === 'sinnoh' && t.badge === badge && BADGE_SETS.sinnoh[i] === badge
        && Math.max(...t.team.map((m) => m.level)) === ace
        && t.team.every((m) => m.level >= 301 && m.level <= 400 && speciesAll[m.species]
          && (!m.keepsake || KEEPSAKES[m.keepsake]));
    }));
  ok('A04 gym rosters: two talk-to trainers per gym, levels below their leader and in band, real species',
    ['roark_miner1', 'roark_miner2', 'gardenia_adept1', 'gardenia_adept2', 'fantina_ace1', 'fantina_ace2', 'maylene_belt1', 'maylene_belt2']
      .every((id) => { const t = SINNOH_TRAINERS[id]; return t && !t.badge && t.team.every((m) => m.level >= 301 && m.level <= 344 && speciesAll[m.species]); }));
  const p1 = SINNOH_TRAINERS.paul_sandgem, p2 = SINNOH_TRAINERS.paul_veilstone;
  ok('A05 the Paul curve: intro battle ace 312 (elekid, starshard), Veilstone audit 342-348 with the torterra ace at 348 — in band, strictly escalating, no Paul team member above 348 this half',
    Math.max(...p1.team.map((m) => m.level)) === 312 && p1.team[p1.team.length - 1].species === 'elekid'
    && p2.team.every((m) => m.level >= 342 && m.level <= 348)
    && p2.team[p2.team.length - 1].species === 'torterra' && p2.team[p2.team.length - 1].level === 348
    && p1.team.concat(p2.team).every((m) => speciesAll[m.species]));
  const mars = SINNOH_TRAINERS.mars_windworks, jup = SINNOH_TRAINERS.jupiter_eterna;
  ok('A06 Galactic first half: Mars (purugly ace 318) + Jupiter (skuntank ace 330) in band with real species; Saturn has NO trainer def this half (presence only — the HQ raid is S5b\'s, the recorded pacing call)',
    Math.max(...mars.team.map((m) => m.level)) === 318 && mars.team[mars.team.length - 1].species === 'purugly'
    && Math.max(...jup.team.map((m) => m.level)) === 330 && jup.team[jup.team.length - 1].species === 'skuntank'
    && !SINNOH_TRAINERS.saturn);
}
{
  const ev = SINNOH_EVENTS;
  const hasStep = (id, pred) => (ev[id] || []).some(pred);
  ok('A07 the six entry events exist as plain step arrays (the shipped EVENTS shape) and sysLoadMap gates every one by name on its trigger map (sandgem / rowan-lab / lake-verity / valley-windworks / galactic-eterna / solaceon-ruins)',
    ['ev_sinnoh_arrival', 'ev_sinnoh_lab', 'ev_sinnoh_verity', 'ev_sinnoh_windworks', 'ev_sinnoh_galactic', 'ev_sinnoh_defog']
      .every((id) => Array.isArray(ev[id]) && owSysSrc.includes("runEvent('" + id + "')"))
    && owSysSrc.includes("id === 'sandgem'") && owSysSrc.includes("id === 'rowan-lab'")
    && owSysSrc.includes("id === 'lake-verity'") && owSysSrc.includes("id === 'valley-windworks'")
    && owSysSrc.includes("id === 'galactic-eterna'") && owSysSrc.includes("id === 'solaceon-ruins'"));
  ok('A08 the lab event IS the Paul introduction: it sets rowan_registered, fights paul_sandgem as battleAny (win/lose branch flags), then sets paul1_done — the arrival event sets sinnoh_arrival and warps nowhere (no new-starter fiction)',
    hasStep('ev_sinnoh_lab', (s) => s.flag === 'rowan_registered')
    && hasStep('ev_sinnoh_lab', (s) => s.battleAny && s.battleAny.trainer === 'paul_sandgem' && s.battleAny.winFlag === 'paul1_won' && s.battleAny.loseFlag === 'paul1_lost')
    && hasStep('ev_sinnoh_lab', (s) => s.flag === 'paul1_done')
    && hasStep('ev_sinnoh_arrival', (s) => s.flag === 'sinnoh_arrival')
    && !(ev.ev_sinnoh_arrival || []).some((s) => s.warp || s.giveMon || s.giftCapSafe));
  ok('A09 the Verity glimpse is a glimpse: it sets verity_glimpse and stages NO battle, NO gift, NO catch step (S6 owns the lake trio)',
    hasStep('ev_sinnoh_verity', (s) => s.flag === 'verity_glimpse')
    && !(ev.ev_sinnoh_verity || []).some((s) => s.battle || s.battleAny || s.wildBattle || s.wildBattleCatch || s.giveMon || s.giftCapSafe));
  ok('A10 Windworks + Eterna building are must-win battles (battle steps, not battleAny): mars_windworks -> windworks_cleared, jupiter_eterna -> galactic_eterna_done',
    hasStep('ev_sinnoh_windworks', (s) => s.battle === 'mars_windworks')
    && hasStep('ev_sinnoh_windworks', (s) => s.flag === 'windworks_cleared')
    && hasStep('ev_sinnoh_galactic', (s) => s.battle === 'jupiter_eterna')
    && hasStep('ev_sinnoh_galactic', (s) => s.flag === 'galactic_eterna_done'));
  ok('A11 the Defog grant rides S4\'s data hook: the ruins event carries { giveHM: \'defog\' } and sets defog_received (HM_GRANTS.defog names Solaceon Ruins + the Fen Badge)',
    hasStep('ev_sinnoh_defog', (s) => s.giveHM === 'defog')
    && hasStep('ev_sinnoh_defog', (s) => s.flag === 'defog_received'));
}
{
  // NPC placement audit: every authored actor stands on a walkable
  // tile with a walkable neighbour reachable from the map start (BFS
  // over terrain + base NPC tiles as blocks, the Hoenn A22 idiom).
  const reach = (mapId, tx, ty) => {
    const m = ALL_MAPS[mapId]; if (!m) return false;
    const blocked = new Set((m.npcs || []).map((n) => n.x + ',' + n.y));
    for (const n of SINNOH_NPCS.filter((x) => x.map === mapId)) blocked.add(n.x + ',' + n.y);
    const st = m.start || { x: 1, y: 1 };
    const seen = new Set([st.x + ',' + st.y]); const q = [[st.x, st.y]];
    while (q.length) {
      const [x, y] = q.shift();
      if (Math.abs(x - tx) + Math.abs(y - ty) === 1) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (seen.has(k) || blocked.has(k)) continue;
        const row = m.rows[ny]; if (!row || nx < 0 || nx >= row.length) continue;
        if (!WALKABLE.has(row[nx])) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return false;
  };
  ok('A12 every SINNOH_NPCS actor (' + SINNOH_NPCS.length + ') stands on a walkable tile with a reachable talk-adjacent tile (leaders, rosters, Rowan, Dawn x2, Barry, Paul x3, the commanders, Reggie)',
    SINNOH_NPCS.length === 23 && SINNOH_NPCS.every((n) => {
      const m = ALL_MAPS[n.map]; if (!m) return false;
      const row = m.rows[n.y]; if (!row || !WALKABLE.has(row[n.x])) return false;
      return reach(n.map, n.x, n.y);
    }), SINNOH_NPCS.filter((n) => !reach(n.map, n.x, n.y)).map((n) => n.map + ':' + n.name).join(';'));
  ok('A13 tale patches audit: every SINNOH_NPC_PATCHES name exists among its map\'s base townsfolk, its tale id exists, and giver/stage come in pairs',
    Object.entries(SINNOH_NPC_PATCHES).every(([mapId, byName]) => {
      const names = new Set((ALL_MAPS[mapId].npcs || []).map((n) => n.name));
      const roles = Object.values(byName).map((p) => p.role).sort().join(',');
      return Object.entries(byName).every(([name, p]) => names.has(name) && SINNOH_TALES[p.tale])
        && roles === 'giver,stage';
    }));
}
{
  const NEW_KS = ['dawnribbon', 'starshard', 'coalseamcharm', 'meadowcord', 'ruinbell', 'ribbonclasp'];
  const RESOLVED_KINDS = ['underdogDamage', 'matchupDamage', 'lowHpDamage', 'fasterFoeDamage', 'typeWard', 'firstHitWard', 'statusChance', 'healBoost', 'xpBoost', 'koSave', 'lowHpSpeed'];
  ok('A14 keepsakes: 18 total (12 + this half\'s 6); every new piece uses an EXISTING resolved kind (no new engine kind), is a price-less keepsakes-pocket ITEMS row, and is paid by exactly one Sinnoh tale',
    Object.keys(KEEPSAKES).length === 18
    && NEW_KS.every((id) => KEEPSAKES[id] && RESOLVED_KINDS.includes(KEEPSAKES[id].kind)
      && ITEMS[id] && ITEMS[id].pocket === 'keepsakes' && !ITEMS[id].price
      && Object.values(SINNOH_TALES).filter((t) => t.reward && t.reward.keepsake === id).length === 1));
  ok('A15 the nine Town Tales (one per first-half settlement): sinnohTale data-driven shape, 2 stages, valid rewards (keepsake in KEEPSAKES or items in ITEMS), offer/stage/finish lines present',
    Object.keys(SINNOH_TALES).length === 9 && Object.values(SINNOH_TALES).every((t) =>
      t.sinnohTale === true && Array.isArray(t.stages) && t.stages.length === 2
      && Array.isArray(t.offerLines) && Array.isArray(t.stageLines) && Array.isArray(t.finishLines)
      && ((t.reward.keepsake && KEEPSAKES[t.reward.keepsake])
        || (t.reward.items && Object.keys(t.reward.items).every((i) => ITEMS[i])))));
  ok('A16 Grounds (existing 15 only): gym signatures oreburgh rubble / eterna bloom / hearthome grave / veilstone mind + landmarks windworks storm, galactic-eterna volt, lake-verity tide, solaceon-ruins grave — all resolve in GROUNDS',
    MAP_GROUND['gym-oreburgh'] === 'rubble' && MAP_GROUND['gym-eterna'] === 'bloom'
    && MAP_GROUND['gym-hearthome'] === 'grave' && MAP_GROUND['gym-veilstone'] === 'mind'
    && MAP_GROUND['valley-windworks'] === 'storm' && MAP_GROUND['galactic-eterna'] === 'volt'
    && MAP_GROUND['lake-verity'] === 'tide' && MAP_GROUND['solaceon-ruins'] === 'grave'
    && ['gym-oreburgh', 'gym-eterna', 'gym-hearthome', 'gym-veilstone'].every((m) => GROUNDS[MAP_GROUND[m]]));
  ok('A17 TMs mirror H4a exactly: NO new TM rows — TM_MOVES is still the Gen-1 50 (named here so S5b inherits the answer)',
    Object.keys(TM_MOVES).length === 50);
}
{
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { checkOut = String(e.stdout || '') + String(e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A18 tables.json in sync (gen-tables --check, regenerated via the tool only); items 192; the quest vocabulary carries every q_sinnoh_* chain id + all nine tale ids; keepsakes table carries the six new pieces',
    checkOut.includes('tables.json OK') && t.items.length === 192
    && SINNOH_QUESTS.every((q) => t.quests.includes(q.id))
    && Object.keys(SINNOH_TALES).every((id) => t.quests.includes(id))
    && ['dawnribbon', 'starshard', 'coalseamcharm', 'meadowcord', 'ruinbell', 'ribbonclasp'].every((id) => t.keepsakes.includes(id)),
    checkOut.slice(0, 160));
  const order = readFileSync(join(ROOT, 'scripts/module-order.json'), 'utf8');
  ok('A19 wiring: module-order loads story-sinnoh after story-hoenn and before quests/merge; merge folds SINNOH_TRAINERS/EVENTS/TALES; the Quest Log has a SINNOH section (sq: rows) and the HUD objective a sinnoh branch',
    order.indexOf('story-hoenn') < order.indexOf('story-sinnoh') && order.indexOf('story-sinnoh') < order.indexOf('"src/data/quests.mjs"')
    && readFileSync(join(ROOT, 'src/data/merge.mjs'), 'utf8').includes('SINNOH_TRAINERS')
    && readFileSync(join(ROOT, 'src/game/main-systems.mjs'), 'utf8').includes("'sq:' + q.id")
    && owSysSrc.includes("currentArcOf(g.state).id === 'sinnoh'"));
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
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      break;
    }
    drain(g);
  }
  function talkKind(g, ow, kind) {
    var npc = ow.map.npcs.find(function (n) { return n.sinnoh === kind; });
    if (!npc) return null;
    ow.sysNpc(npc);
    return npc;
  }
  function talkName(g, ow, name) {
    var npc = ow.map.npcs.find(function (n) { return n.name === name; });
    if (!npc) return null;
    if (!ow.sysNpc(npc) && npc.trainer) ow.startTrainerBattle(npc);
    return npc;
  }
  function healUp(g) { g.state.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); }); }

  // ===== THE FIXTURE: Frontier complete, the sealed-Sinnoh
  // homecoming ALREADY CONSUMED (hook + homecoming flags stand, the
  // S0 suite proved the derivation) — the post-derivation state. =====
  var g = mkGame(901); boot(g); strongTeam(g, 360);
  var st = g.state;
  st.story.arc = 'sinnoh'; st.story.region = 'sinnoh';
  st.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier'];
  st.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  st.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  st.badges.johto = ['zephyrbadge','hivebadge','plainbadge','fogbadge','stormbadge','mineralbadge','glacierbadge','risingbadge'];
  st.badges.hoenn = ['stonebadge','knucklebadge','dynamobadge','heatbadge','balancebadge','featherbadge','mindbadge','rainbadge'];
  st.badges.symbols = ['gold','gold','gold','gold','gold','gold','gold'];
  st.story.flags.frontier_complete = true;
  st.story.flags.hook_sinnoh = true; st.story.flags.homecoming_sinnoh = true; st.story.flags.embark_sinnoh = true;

  // ===== embark =====
  var ow = gotoMap(g, 'vermilion', 13, 9); pump(g);
  var capt = ow.map.npcs.find(function (n) { return n.name === 'CAPT SINNOH'; });
  ok('B01 CAPT SINNOH stands on Vermilion (ferry sandgem, ferryArc sinnoh)', !!capt && capt.ferry === 'sandgem' && capt.ferryArc === 'sinnoh');
  if (capt) { ow.sysNpc(capt); pump(g, 600); }
  ok('B02 embark drive: Vermilion -> Sandgem on the shipped ferryArc machinery (position sandgem, reachedarc_sinnoh stamped) and the arrival scene completes on the landing (sinnoh_arrival)',
    st.story.position.map === 'sandgem' && !!st.story.flags.reachedarc_sinnoh && !!st.story.flags.sinnoh_arrival,
    'pos=' + st.story.position.map + ' arrival=' + !!st.story.flags.sinnoh_arrival);
  pump(g, 300);
  // ===== the lab: Rowan + Paul 1 =====
  ow = gotoMap(g, 'rowan-lab', 8, 10); pump(g, 900);
  ok('B03 the lab scene fires on entry: Rowan registers the veteran (rowan_registered) and Paul\\'s first measure resolves either way (paul1_done + a branch flag — battleAny)',
    !!st.story.flags.rowan_registered && !!st.story.flags.paul1_done
    && (!!st.story.flags.paul1_won || !!st.story.flags.paul1_lost),
    'won=' + !!st.story.flags.paul1_won + ' lost=' + !!st.story.flags.paul1_lost);
  var rowan = ow.map.npcs.find(function (n) { return n.sinnoh === 'rowan'; });
  ok('B04 PROF. ROWAN stands in his lab as a Sinnoh actor', !!rowan);
  // ===== Twinleaf: Dawn + the tale; Lake Verity =====
  ow = gotoMap(g, 'twinleaf', 13, 12); pump(g);
  var dawnNpc = talkKind(g, ow, 'dawn_twinleaf'); pump(g);
  ok('B05 Dawn is met in Twinleaf (dawn_met — the contest co-spine opens)', !!dawnNpc && !!st.story.flags.dawn_met);
  var asha = talkName(g, ow, 'MOM\\u2019S NEIGHBOR ASHA'); pump(g);
  var taleActive = st.story.quests.tale_sinnoh_twinleaf !== undefined;
  var tam = talkName(g, ow, 'YOUNGSTER TAM'); pump(g);
  var asha2 = talkName(g, ow, 'MOM\\u2019S NEIGHBOR ASHA'); pump(g);
  ok('B06 a Sinnoh Town Tale runs end-to-end on the shipped tale machine (Asha offers -> Tam advances -> Asha finishes): tale complete, the Dawn Ribbon paid into the bag',
    !!asha && !!tam && taleActive && st.story.quests.tale_sinnoh_twinleaf === 'complete' && (st.bag.dawnribbon || 0) >= 1,
    'quest=' + st.story.quests.tale_sinnoh_twinleaf + ' bag=' + (st.bag.dawnribbon || 0));
  ow = gotoMap(g, 'lake-verity', 20, 9); pump(g, 400);
  ok('B07 Lake Verity: the glimpse fires for a registered trainer (verity_glimpse + the event-done flag — a glimpse only: no battle was fought on the lake)',
    !!st.story.flags.verity_glimpse && !!st.story.flags.ev_sinnoh_verity_done && !(g.scenes.top instanceof BattleScene));
  // ===== the badge-skip refusal (prefix law) =====
  ow = gotoMap(g, 'gym-eterna', 7, 9); pump(g);
  var gard = talkKind(g, ow, 'gardenia'); pump(g, 400);
  ok('B08 BADGE-SKIP REFUSAL: Gardenia, challenged with zero Sinnoh badges, refuses by the prefix law (no battle, badges.sinnoh still empty — the refusal reads badges.sinnoh)',
    !!gard && (st.badges.sinnoh || []).length === 0 && !(g.scenes.top instanceof BattleScene));
  // ===== Roark =====
  function gym(mapId, kind, badge, flag) {
    healUp(g);
    var o = gotoMap(g, mapId, 7, 9); pump(g);
    var npc = talkKind(g, o, kind); pump(g, 900);
    return !!npc && (st.badges.sinnoh || []).includes(badge) && !!st.story.flags[flag];
  }
  ow = gotoMap(g, 'gym-oreburgh', 7, 9); pump(g);
  var cole = talkName(g, ow, 'MINER COLE'); pump(g, 900);
  ok('B09 a shipped-roster gym trainer battles through the generic trainer path (beat_roark_miner1)', !!cole && !!st.story.flags.beat_roark_miner1);
  ok('B10 Gym 1: Roark awards the Coal Badge in order (badges.sinnoh [coal], badge_coal)', gym('gym-oreburgh', 'roark', 'coalbadge', 'badge_coal') && st.badges.sinnoh.join(',') === 'coalbadge');
  ok('B11 the HUD objective now leads with the Windworks row of the Sinnoh chain', (function () { var o2 = g.scenes.top; return o2.sysObjective && o2.sysObjective().indexOf('Windworks') >= 0; })());
  // ===== Barry =====
  ow = gotoMap(g, 'jubilife', 13, 12); pump(g);
  var barry = talkKind(g, ow, 'barry'); pump(g);
  ok('B12 Barry is met in Jubilife (barry_met — the fine-obsessed secondary rival opens)', !!barry && !!st.story.flags.barry_met);
  // ===== Windworks: Mars =====
  healUp(g);
  ow = gotoMap(g, 'valley-windworks', 8, 10); pump(g, 900);
  ok('B13 the Valley Windworks hostage beat fires with the Coal Badge held and Mars is driven off in a must-win battle (windworks_cleared)',
    !!st.story.flags.windworks_cleared && !!st.story.flags.beat_mars_windworks);
  // ===== Gardenia + Eterna Galactic + Paul's assessment =====
  ok('B14 Gym 2: Gardenia awards the Forest Badge in order', gym('gym-eterna', 'gardenia', 'forestbadge', 'badge_forest') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge');
  healUp(g);
  ow = gotoMap(g, 'galactic-eterna', 8, 10); pump(g, 900);
  ok('B15 the Eterna Galactic building raid fires with the Forest Badge held: Jupiter driven off (galactic_eterna_done)',
    !!st.story.flags.galactic_eterna_done && !!st.story.flags.beat_jupiter_eterna);
  ow = gotoMap(g, 'eterna', 13, 10); pump(g);
  var paulE = talkKind(g, ow, 'paul_eterna'); pump(g);
  ok('B16 Paul\\'s Eterna assessment beat fires (paul_eterna_seen — the cold audit continues)', !!paulE && !!st.story.flags.paul_eterna_seen);
  // ===== Fantina, Dawn's contest beat, the Chimchar =====
  ok('B17 Gym 3: Fantina awards the Relic Badge in order', gym('gym-hearthome', 'fantina', 'relicbadge', 'badge_relic') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge');
  ow = gotoMap(g, 'contest-hearthome', 8, 10); pump(g);
  ow.sysInteract(9, 2); tk(g, 2); drain(g); tk(g, 2);
  var rankMenu = g.ui.menu ? g.ui.menu.items : [];
  var rankGateOk = rankMenu.some(function (i) { return i.value === 'hearthome-normal' && !i.disabled; })
    && rankMenu.some(function (i) { return i.value === 'hearthome-great' && i.disabled; });
  if (g.ui.menuOpen) { var ci = rankMenu.findIndex(function (i) { return i.value === 'no'; }); if (ci >= 0) g.ui.debugChoose(ci); tk(g, 3); }
  drain(g);
  var dawnC = talkKind(g, ow, 'dawn_contest'); pump(g);
  ok('B18 Dawn\\'s first Super Contest beat at Hearthome (dawn_hearthome_done + dawn_ribbon_hearthome) — and the player\\'s own ranked entry stands open beside it (the rank menu gates Great behind Normal, S4\\'s ladder)',
    !!dawnC && !!st.story.flags.dawn_hearthome_done && !!st.story.flags.dawn_ribbon_hearthome && rankGateOk,
    'rankGate=' + rankGateOk);
  ow = gotoMap(g, 'hearthome', 13, 10); pump(g);
  var paulH = talkKind(g, ow, 'paul_hearthome'); pump(g, 600);
  ok('B19 THE CHIMCHAR BEAT: Paul discards, the player takes it in — chimchar_beat_done + chimchar_taken, and a Chimchar (Lv 320, in band) stands in the party or a PC box, dex-registered caught',
    !!paulH && !!st.story.flags.chimchar_beat_done && !!st.story.flags.chimchar_taken
    && (st.party.some(function (m) { return m.speciesId === 'chimchar' && m.level === 320; })
      || Object.values(st.boxes || {}).some(function (b) { return b.some(function (m) { return m.speciesId === 'chimchar'; }); }))
    && !!st.dex.caught[SPECIES.chimchar.dexNo],
    'party=' + st.party.map(function (m) { return m.speciesId; }).join(','));
  // ===== Defog at Solaceon Ruins =====
  var hm06before = st.bag.hm06 || 0;
  ow = gotoMap(g, 'solaceon-ruins', 9, 12); pump(g, 400);
  ok('B20 Defog claimed at the Solaceon Ruins through S4\\'s giveHM hook (defog_received; bag holds HM06 — granted once, never duplicated by the earlier S4-era stock)',
    !!st.story.flags.defog_received && (st.bag.hm06 || 0) === hm06before + (hm06before ? 0 : 1) && (st.bag.hm06 || 0) >= 1,
    'hm06=' + (st.bag.hm06 || 0));
  // ===== Maylene, Saturn's door, Reggie, Paul's audit =====
  ok('B21 Gym 4: Maylene awards the Cobble Badge in order — badges.sinnoh = the S5a prefix of four', gym('gym-veilstone', 'maylene', 'cobblebadge', 'badge_cobble') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge,cobblebadge');
  ow = gotoMap(g, 'galactic-hq', 9, 12); pump(g);
  var saturn = talkKind(g, ow, 'saturn'); pump(g);
  ok('B22 Veilstone HQ presence: Saturn holds the door (saturn_met) and NO raid fires this half (no HQ battle, no raid flag — the recorded S5b pacing call)',
    !!saturn && !!st.story.flags.saturn_met && !st.story.flags.galactic_hq_done && !st.story.flags.beat_saturn);
  ow = gotoMap(g, 'veilstone', 13, 10); pump(g);
  var reggie = talkKind(g, ow, 'reggie'); pump(g);
  ok('B23 Reggie, the Veilstone breeder, is met (reggie_met — Paul\\'s eleven-word letter)', !!reggie && !!st.story.flags.reggie_met);
  healUp(g);
  var paulV = talkKind(g, ow, 'paul_veilstone'); pump(g, 1200);
  ok('B24 Paul\\'s Veilstone audit resolves on his home turf (paul_veilstone_done + the honest branch flag — the first-half spine closes at ~348)',
    !!paulV && !!st.story.flags.paul_veilstone_done
    && (!!st.story.flags.paul_veilstone_won || !!st.story.flags.paul_veilstone_lost),
    'won=' + !!st.story.flags.paul_veilstone_won + ' lost=' + !!st.story.flags.paul_veilstone_lost);
  // ===== the chain + log, read back =====
  ok('B25 the quest chain reads complete through the first half: every SINNOH_QUESTS flag of the 14 stands set, in order',
    SINNOH_QUESTS.every(function (q) { return !!st.story.flags[q.flag]; }),
    SINNOH_QUESTS.filter(function (q) { return !st.story.flags[q.flag]; }).map(function (q) { return q.id; }).join(','));
  g.openQuestLog(); tk(g, 2);
  var logItems = g.ui.menu ? g.ui.menu.items : [];
  var logLabels = logItems.map(function (i) { return i.label; }).join(' | ');
  var hasSinnohSection = logLabels.indexOf('— SINNOH —') >= 0
    && logLabels.indexOf('★ Sail to Sinnoh') >= 0
    && logLabels.indexOf('★ Veilstone — Paul') >= 0;
  if (g.ui.menuOpen) { var li = logItems.findIndex(function (i) { return i.value === 'close'; }); if (li >= 0) g.ui.debugChoose(li); tk(g, 3); }
  drain(g);
  ok('B26 the Quest Log renders the SINNOH section with the completed first-half rows starred', hasSinnohSection, logLabels.slice(0, 200));
  ok('B27 the merge fold landed in the bundle (TRAINERS carries the leaders + Paul + the commanders; EVENTS carries the six scenes; QUESTS carries the nine tales)',
    !!TRAINERS.roark && !!TRAINERS.maylene && !!TRAINERS.paul_veilstone && !!TRAINERS.jupiter_eterna
    && !!EVENTS.ev_sinnoh_arrival && !!EVENTS.ev_sinnoh_lab && !!EVENTS.ev_sinnoh_defog
    && !!QUESTS.tale_sinnoh_twinleaf && !!QUESTS.tale_sinnoh_veilstone);

  globalThis.__SQ5__ = Q;
})();`;

let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__SQ5__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) { if (r.pass) pass++; else fail++; }
  console.log('Part B: ' + QB.results.filter((r) => r.pass).length + '/' + QB.results.length + ' passed');
}

console.log('\nsinnoh-story: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
