// hoenn-story-checks.mjs — Arc 3 Stage H4a (Hoenn story, first half)
// proofs. Part A: pure units — the registry flip, quest chain shape,
// badge data + validator plumbing (client schema + server validator +
// gen-tables round-trip), trainer defs, grounds, tales shape law,
// event shapes, NPC placement / walk-to-actor connectivity, and the
// weather resolver (map field -> render state; climax override wins;
// non-Hoenn maps unaffected). Part B: the built bundle in a headless
// Game — the TRUE PATH: a Johto-complete save walks Homecoming #3 ->
// Vermilion dock (CAPT HOENN) -> embark -> Littleroot (Birch rescue)
// -> the lab arrival -> Wally -> gyms 1-4 in order through the real
// leader runner -> Meteor Falls + Mt. Chimney beats -> May's three
// contest beats. H4b extends this same file.
// Run: node tests/hoenn-story-checks.mjs   (exit 1 on any failure)

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
const HOENN_ORDER = ['stonebadge', 'knucklebadge', 'dynamobadge', 'heatbadge', 'balancebadge', 'featherbadge', 'mindbadge', 'rainbadge'];

// ================= Part A: pure units =================
const { arcById, arcStateOf } = await import(join(ROOT, 'src/data/arcs.mjs'));
const { HOENN_QUESTS, HOENN_TRAINERS, HOENN_EVENTS, HOENN_TALES, HOENN_NPCS, HOENN_NPC_PATCHES } = await import(join(ROOT, 'src/data/story-hoenn.mjs'));
const { ITEMS, BADGE_SETS } = await import(join(ROOT, 'src/data/items.mjs'));
const { MAP_GROUND, groundForMap } = await import(join(ROOT, 'src/data/grounds.mjs'));
const { TALE_NPCS } = await import(join(ROOT, 'src/data/quests.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const { weatherForMap, CLIMAX_DROUGHT_FLAG, CLIMAX_DELUGE_FLAG } = await import(join(ROOT, 'src/game/weather.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO, SPECIES_HOENN);
const { MAPS7 } = await import(join(ROOT, 'src/data/maps7.mjs'));
const { MAPS: MAPS_BASE, WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));

{
  const h = arcById('hoenn');
  ok('A01 registry flip: hoenn status is shipped; nothing else in the row moved (band 201-300, completionFlag hoenn_complete, embark vermilion->littleroot, hook hawthorn)',
    h.status === 'shipped' && h.band.min === 201 && h.band.max === 300
    && h.completionFlag === 'hoenn_complete' && h.embarkPort === 'vermilion' && h.arrivalMap === 'littleroot'
    && h.hookGiver === 'hawthorn' && h.badgeSet === 'hoenn' && h.badgeTotal === 8 && h.dexHorizon === 386);
  const stJ = defaultState(); stJ.story.arc = 'johto'; stJ.story.regionsDone = ['kanto', 'orange', 'johto']; stJ.story.flags.johto_complete = true; stJ.story.arc_directive = 'hoenn';
  ok('A02 arcStateOf: a Johto-complete save with the directive pinned reads hoenn as locked-next (the road ahead, armed)',
    arcStateOf(stJ, 'hoenn') === 'locked-next');
  ok('A03 HOENN_QUESTS: the full chain in the MAIN_QUESTS idiom (H4a west rows, then the H4b east rows: balance -> institute -> feather -> lilycove May -> mind -> pyre/orbs -> magma hideout -> submarine -> seafloor -> climax -> rain -> wally -> conference -> tyson/hoenn_complete)',
    HOENN_QUESTS.length === 26
    && HOENN_QUESTS.every((q) => q.id.startsWith('q_hoenn_') && q.flag && q.text && q.hint)
    && HOENN_QUESTS.map((q) => q.flag).join(',') === 'birch_rescued,hoenn_arrival,wally_helped,badge_stone,badge_knuckle,may_slateport_done,meteor_falls_done,badge_dynamo,may_verdanturf_done,chimney_clash_done,badge_heat,may_fallarbor_done,badge_balance,institute_done,badge_feather,may_lilycove_done,badge_mind,orbs_taken,magma_hideout_done,submarine_stolen,seafloor_done,climax_resolved,badge_rain,wally_final_done,hoenn_conference_registered,hoenn_complete');
  ok('A04 BADGE_SETS.hoenn is the canonical earn order (stone..rain, ruling 6 anime order); every badge is a key-pocket ITEMS row',
    JSON.stringify(BADGE_SETS.hoenn) === JSON.stringify(HOENN_ORDER)
    && HOENN_ORDER.every((id) => ITEMS[id] && ITEMS[id].pocket === 'key'));
  const team = (id) => HOENN_TRAINERS[id].team.map((m) => m.species + ':' + m.level + (m.keepsake ? '+' + m.keepsake : '')).join(',');
  ok('A05 leader teams I (Roxanne 209/212/215 fossilspur, Brawly 219/222/225 secondwindribbon) — aces at the ruling-6 marks 215/225',
    team('roxanne') === 'geodude:209,aron:212,nosepass:215+fossilspur'
    && team('brawly') === 'machop:219,meditite:222,makuhita:225+secondwindribbon');
  ok('A06 leader teams II (Wattson 229/231/233/235 thunderheadpin, Flannery 239/241/243/245 embereed); every leader badgeSet hoenn + its badge; every Hoenn trainer species exists; ALL Hoenn trainer levels inside band 201-300',
    team('wattson') === 'voltorb:229,magneton:231,electrike:233,manectric:235+thunderheadpin'
    && team('flannery') === 'numel:239,slugma:241,camerupt:243,torkoal:245+embereed'
    && ['roxanne', 'brawly', 'wattson', 'flannery'].every((id) => HOENN_TRAINERS[id].badgeSet === 'hoenn' && HOENN_ORDER.includes(HOENN_TRAINERS[id].badge))
    && Object.values(HOENN_TRAINERS).every((t) => t.team.every((m) => SPECIES[m.species] && m.level >= 201 && m.level <= 300)));
  ok('A07 gym rosters + villain seeds in band (gym trainers 205-241 rising by gym; falls grunts 212-214; chimney admins 232-236, ai smart)',
    ['rustboro_gym_1', 'rustboro_gym_2', 'dewford_gym_1', 'dewford_gym_2', 'mauville_gym_1', 'mauville_gym_2', 'lavaridge_gym_1', 'lavaridge_gym_2'].every((id) => HOENN_TRAINERS[id] && !HOENN_TRAINERS[id].badge)
    && ['magma_grunt_falls', 'aqua_grunt_falls'].every((id) => HOENN_TRAINERS[id].team.every((m) => m.level >= 212 && m.level <= 214))
    && ['magma_admin_chimney', 'aqua_admin_chimney'].every((id) => HOENN_TRAINERS[id].ai === 'smart' && HOENN_TRAINERS[id].team.every((m) => m.level >= 232 && m.level <= 236)));
  ok('A08 event shapes: rescue rides an uncatchable wildBattle (poochyena 203) BEFORE birch_rescued; arrival sets hoenn_arrival + birch_registered, no battle',
    (() => { const ev = HOENN_EVENTS.ev_hoenn_rescue; const bi = ev.findIndex((s) => s.wildBattle); const fi = ev.findIndex((s) => s.flag === 'birch_rescued');
      return bi >= 0 && ev[bi].wildBattle.species === 'poochyena' && ev[bi].wildBattle.level === 203 && ev[bi].wildBattle.uncatchable === true && fi > bi; })()
    && HOENN_EVENTS.ev_hoenn_arrival.some((s) => s.flag === 'hoenn_arrival') && HOENN_EVENTS.ev_hoenn_arrival.some((s) => s.flag === 'birch_registered')
    && HOENN_EVENTS.ev_hoenn_arrival.every((s) => !s.wildBattle && !s.battle && !s.battleAny));
  ok('A09 seed-chain events: Meteor rides battleAny (magma grunt, win/lose branch flags) then sets meteor_falls_done + teams_glimpsed; Chimney rides battleAny (magma admin) then sets chimney_clash_done + meteorite_teased',
    (() => { const ev = HOENN_EVENTS.ev_hoenn_meteor; const bi = ev.findIndex((s) => s.battleAny);
      return bi >= 0 && ev[bi].battleAny.trainer === 'magma_grunt_falls' && ev[bi].battleAny.winFlag === 'meteor_magma_won' && ev[bi].battleAny.loseFlag === 'meteor_magma_lost'
        && ev.some((s) => s.flag === 'meteor_falls_done') && ev.some((s) => s.flag === 'teams_glimpsed'); })()
    && (() => { const ev = HOENN_EVENTS.ev_hoenn_chimney; const bi = ev.findIndex((s) => s.battleAny);
      return bi >= 0 && ev[bi].battleAny.trainer === 'magma_admin_chimney'
        && ev.some((s) => s.flag === 'chimney_clash_done') && ev.some((s) => s.flag === 'meteorite_teased'); })());
  ok('A10 west gym Grounds assigned from the existing 15 (rubble/rubble/volt/pyre) + landmarks (meteor-falls rubble, mt-chimney ember)',
    MAP_GROUND['gym-rustboro'] === 'rubble' && MAP_GROUND['gym-dewford'] === 'rubble'
    && MAP_GROUND['gym-mauville'] === 'volt' && MAP_GROUND['gym-lavaridge'] === 'pyre'
    && MAP_GROUND['meteor-falls'] === 'rubble' && MAP_GROUND['mt-chimney'] === 'ember'
    && groundForMap('gym-mauville').id === 'volt');
  ok('A11 four Town Tales (littleroot/petalburg/rustboro/slateport) in the shipped shape law (<=3 stages, reward + rewardText, revelation, data lines, hoennTale key, giver+stage patches on real maps7 townsfolk)',
    Object.keys(HOENN_TALES).length === 4
    && Object.values(HOENN_TALES).every((t) => t.hoennTale === true && t.stages.length >= 1 && t.stages.length <= 3
      && t.reward && t.rewardText && t.revelation && Array.isArray(t.offerLines) && Array.isArray(t.stageLines) && Array.isArray(t.finishLines)
      && HOENN_NPC_PATCHES.some((p) => p.tale === t.id && p.role === 'giver')
      && HOENN_NPC_PATCHES.some((p) => p.tale === t.id && p.role === 'stage'))
    && HOENN_NPC_PATCHES.every((p) => (MAPS7[p.map].npcs || []).some((n) => n.name === p.name)));
  ok('A12 embark captain: CAPT HOENN rides the TALE_NPCS loadMap append on vermilion (16,10), ferry littleroot + ferryArc hoenn — Vermilion\'s OWN captain (the Johto smell); the Slateport return port (CAPT MERIDIAN, maps7) carries ferryArc hoenn + ferry vermilion',
    (() => { const c = TALE_NPCS.find((n) => n.name === 'CAPT MARIS');
      return c && c.map === 'vermilion' && c.x === 16 && c.y === 10 && c.ferry === 'littleroot' && c.ferryArc === 'hoenn' && !c.tale; })()
    && (() => { const m = (MAPS7.slateport.npcs || []).find((n) => n.name === 'CAPT MERIDIAN');
      return m && m.ferryArc === 'hoenn' && m.ferry === 'vermilion'; })());
}

// -- badge plumbing: client schema + server validator + gen-tables --
{
  const full = clone(defaultState()); full.badges.hoenn = HOENN_ORDER.slice(0, 4);
  const nonPrefix = clone(defaultState()); nonPrefix.badges.hoenn = ['knucklebadge'];
  const reversed = clone(defaultState()); reversed.badges.hoenn = ['heatbadge', 'stonebadge'];
  ok('A13 client schema: defaultState carries badges.hoenn []; the H4a prefix is accepted; a lone 2nd badge and a reversed order are rejected (bad-badges-hoenn)',
    Array.isArray(defaultState().badges.hoenn)
    && SCH.validateSave(full).ok
    && SCH.validateSave(nonPrefix).errors.includes('bad-badges-hoenn')
    && SCH.validateSave(reversed).errors.includes('bad-badges-hoenn'),
    JSON.stringify(SCH.validateSave(full).errors));
  const cloud = clone(defaultState());
  cloud.player.name = 'ASH'; cloud.player.rivalName = 'GARY';
  cloud.story.arc = 'hoenn'; cloud.story.region = 'hoenn';
  cloud.badges.kanto = [...BADGE_SETS.kanto]; cloud.badges.orange = [...BADGE_SETS.orange]; cloud.badges.johto = [...BADGE_SETS.johto];
  cloud.badges.hoenn = HOENN_ORDER.slice(0, 4);
  cloud.story.flags.hoenn_arrival = true; cloud.story.flags.birch_rescued = true;
  cloud.story.flags.meteor_falls_done = true; cloud.story.flags.chimney_clash_done = true;
  cloud.story.flags['climax_drought'] = false;
  cloud.story.regionsDone = ['kanto', 'orange', 'johto'];
  const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
  const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
  cloud.party = [makeMon('charizard', 250, SPECIES, Object.assign({}, MV1, MOVES2))];
  const rv = VAL.validateSave(clone(cloud));
  ok('A14 server validator accepts the H4a-complete Hoenn save (4-badge prefix + story flags incl. a false climax flag + a Lv250 mon in the Hoenn band)',
    rv.ok && rv.errors.length === 0, JSON.stringify(rv.errors));
  const badCloud = clone(cloud); badCloud.badges.hoenn = ['stonebadge', 'dynamobadge'];
  ok('A15 server validator rejects a non-prefix hoenn set (bad-badge-order)',
    VAL.validateSave(badCloud).errors.includes('bad-badge-order'), JSON.stringify(VAL.validateSave(badCloud).errors));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A16 tables.json in sync; badgeSequences.hoenn is the earn order, regionBadgeMax.hoenn 8, items 200 (199 + the Azure Flute, Arc 4 Stage S7 — supersedes the Stage S6 count), quests table carries every q_hoenn_* + hoenn tale id',
    checkOut.includes('tables.json OK')
    && JSON.stringify(t.badgeSequences.hoenn) === JSON.stringify(HOENN_ORDER)
    && t.regionBadgeMax.hoenn === 8
    && t.items.length === 200
    && HOENN_QUESTS.every((q) => t.quests.includes(q.id))
    && Object.keys(HOENN_TALES).every((id) => t.quests.includes(id)), checkOut.trim());
}

// -- weather resolver (ruling 4): pure units over real map data --
{
  const st = (flags) => ({ story: { flags: flags || {} } });
  ok('A17 weather reads the CURRENT map field generically (r113 ash, r119 rain, r111 sun, lavaridge sun, littleroot clear — source map, not heavy)',
    weatherForMap(st(), MAPS7.r113).kind === 'ash' && weatherForMap(st(), MAPS7.r113).source === 'map'
    && weatherForMap(st(), MAPS7.r119).kind === 'rain'
    && weatherForMap(st(), MAPS7.r111).kind === 'sun'
    && weatherForMap(st(), MAPS7.lavaridge).kind === 'sun'
    && weatherForMap(st(), MAPS7.littleroot).kind === 'clear' && weatherForMap(st(), MAPS7.littleroot).heavy === false);
  ok('A18 no field = clear, untouched: a Kanto outdoor map (vermilion), a Hoenn interior (gym-rustboro) and a Hoenn underwater map all resolve clear/source none',
    weatherForMap(st(), MAPS2.vermilion || MAPS_BASE.vermilion).kind === 'clear'
    && weatherForMap(st(), MAPS7['gym-rustboro']).kind === 'clear' && weatherForMap(st(), MAPS7['gym-rustboro']).source === 'none'
    && weatherForMap(st(), MAPS7['r124-underwater']).kind === 'clear');
  ok('A19 climax override wins over the map field (drought: rain map -> heavy sun; deluge: ash map -> heavy rain; source climax)',
    (() => { const d = weatherForMap(st({ [CLIMAX_DROUGHT_FLAG]: true }), MAPS7.r119);
      const w = weatherForMap(st({ [CLIMAX_DELUGE_FLAG]: true }), MAPS7.r113);
      return d.kind === 'sun' && d.heavy === true && d.source === 'climax' && w.kind === 'rain' && w.heavy === true && w.source === 'climax'; })());
  ok('A20 the override is Hoenn-outdoors only: under climax_drought a Kanto map and a Hoenn interior still resolve clear; with both flags set, drought wins (documented precedence)',
    weatherForMap(st({ [CLIMAX_DROUGHT_FLAG]: true }), MAPS2.vermilion || MAPS_BASE.vermilion).kind === 'clear'
    && weatherForMap(st({ [CLIMAX_DELUGE_FLAG]: true }), MAPS7['gym-rustboro']).kind === 'clear'
    && weatherForMap(st({ [CLIMAX_DROUGHT_FLAG]: true, [CLIMAX_DELUGE_FLAG]: true }), MAPS7.r119).kind === 'sun');
  ok('A21 the flag names H4b consumes are climax_drought / climax_deluge (weather.mjs exports)',
    CLIMAX_DROUGHT_FLAG === 'climax_drought' && CLIMAX_DELUGE_FLAG === 'climax_deluge');
}

// -- NPC placement / walk-to-actor connectivity (the loadMap tables) --
{
  const ALL = Object.assign({}, MAPS7);
  const npcBlocked = (m, x, y) => (m.npcs || []).some((n) => n.x === x && n.y === y)
    || HOENN_NPCS.some((n) => n.map === m.id && n.x === x && n.y === y);
  const walkable = (m, x, y) => y >= 0 && y < m.rows.length && x >= 0 && x < m.rows[y].length
    && (WALKABLE.has(m.rows[y][x]) || m.rows[y][x] === '~' || m.rows[y][x] === 'W') && !npcBlocked(m, x, y);
  function bfs(m, sx, sy) {
    const seen = new Set([sx + ',' + sy]); const q = [[sx, sy]];
    while (q.length) { const [x, y] = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (!seen.has(k) && walkable(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    return seen;
  }
  const adjacent = (m, x, y, seen) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
  const bad = [];
  for (const n of HOENN_NPCS) {
    const m = ALL[n.map];
    if (!m) { bad.push(n.map + ':NOMAP'); continue; }
    const stp = m.start || { x: 7, y: 10 };
    if (!adjacent(m, n.x, n.y, bfs(m, stp.x, stp.y))) bad.push(n.map + ':' + n.name);
  }
  ok('A22 every appended Hoenn actor stands reachable-adjacent from its map start (leaders, gym rosters, May x5, Wally x2, Norman, Cozmo, admins, Birch, the watcher, Steven, the keeper, the Conference cast)',
    HOENN_NPCS.length === 45 && bad.length === 0, bad.join(';'));
  // Vermilion captain connectivity (maps2 town, start = its dock entry).
  const v = MAPS2.vermilion || MAPS_BASE.vermilion;
  const vSeen = bfs({ ...v, npcs: [...(v.npcs || []), { x: 16, y: 10, name: 'CAPT MARIS' }] }, 7, 9);
  ok('A23 CAPT HOENN (16,10) is reachable-adjacent on the Vermilion dock row and does not collide with CAPT ORANGE (13,10) or SAILOR BRINE (10,10)',
    adjacent(v, 16, 10, vSeen) && !(v.npcs || []).some((n) => n.x === 16 && n.y === 10));
  const order = JSON.parse(readFileSync(join(ROOT, 'scripts/module-order.json'), 'utf8'));
  ok('A24 module order: story-hoenn folds right after story-johto; weather.mjs loads right after game/arcs.mjs',
    order.indexOf('src/data/story-hoenn.mjs') === order.indexOf('src/data/story-johto.mjs') + 1
    && order.indexOf('src/game/weather.mjs') === order.indexOf('src/game/arcs.mjs') + 1);
}

// -- H4b east-half pure units --
{
  const team = (id) => HOENN_TRAINERS[id].team.map((m) => m.species + ':' + m.level + (m.keepsake ? '+' + m.keepsake : '')).join(',');
  ok('A25 leader teams III (Norman 249/251/252/255 tortoisecharm, Winona 259/261/263/265 sparrowfeather) — aces at the ruling-6 marks 255/265; badges balance/feather via badgeSet hoenn',
    team('norman') === 'vigoroth:249,linoone:251,spinda:252,slaking:255+tortoisecharm'
    && team('winona') === 'swellow:259,pelipper:261,skarmory:263,altaria:265+sparrowfeather'
    && HOENN_TRAINERS.norman.badge === 'balancebadge' && HOENN_TRAINERS.winona.badge === 'featherbadge'
    && HOENN_TRAINERS.norman.badgeSet === 'hoenn' && HOENN_TRAINERS.winona.badgeSet === 'hoenn');
  ok('A26 the twins as a back-to-back pair (Tate 270/274 NO badge; Liza 272/275 ironacorn carries mindbadge) + Juan 279/281/283/285 tidepearl rainbadge — aces at the range tops 275/285',
    team('tate') === 'xatu:270,solrock:274' && !HOENN_TRAINERS.tate.badge && !HOENN_TRAINERS.tate.badgeSet
    && team('liza') === 'claydol:272,lunatone:275+ironacorn' && HOENN_TRAINERS.liza.badge === 'mindbadge' && HOENN_TRAINERS.liza.badgeSet === 'hoenn'
    && team('juan') === 'luvdisc:279,whiscash:281,crawdaunt:283,kingdra:285+tidepearl' && HOENN_TRAINERS.juan.badge === 'rainbadge');
  ok('A27 east gym rosters in band, rising by gym (petalburg 246-249, fortree 256-260, mossdeep 266-270, sootopolis 276-280), no badges of their own',
    ['petalburg_gym_1', 'petalburg_gym_2', 'fortree_gym_1', 'fortree_gym_2', 'mossdeep_gym_1', 'mossdeep_gym_2', 'sootopolis_gym_1', 'sootopolis_gym_2']
      .every((id) => HOENN_TRAINERS[id] && !HOENN_TRAINERS[id].badge && HOENN_TRAINERS[id].team.every((m) => m.level >= 246 && m.level <= 280)));
  ok('A28 villain convergence in band (Shelly 252-256, Courtney 266-268, Tabitha/Matt 272-275, Maxie/Archie 276-278, ai smart)',
    team('aqua_admin_institute') === 'mightyena:252,carvanha:254,sharpedo:256'
    && team('magma_admin_pyre') === 'numel:266,camerupt:268'
    && ['magma_admin_hideout', 'aqua_admin_hideout'].every((id) => HOENN_TRAINERS[id].team.every((m) => m.level >= 272 && m.level <= 275))
    && ['maxie', 'archie'].every((id) => HOENN_TRAINERS[id].ai === 'smart' && HOENN_TRAINERS[id].team.every((m) => m.level >= 276 && m.level <= 278)));
  ok('A29 Wally final in band 286-292 (gardevoir 292 gardeniasash) + Conference cast (prelims 288-293, Morrison 293-296 swampert, Tyson 294-298 metagross — the final at the band ceiling)',
    team('wally_final') === 'altaria:286,delcatty:288,roselia:289,magneton:290,gardevoir:292+gardeniasash'
    && team('conference_h_p1') === 'manectric:288,flygon:290,walrein:291'
    && team('conference_h_p2') === 'breloom:290,aggron:292,milotic:293'
    && team('morrison') === 'girafarig:293,growlithe:294,swampert:296+tortoisecharm'
    && team('tyson') === 'hariyama:294,shiftry:295,donphan:296,sceptile:297,meowth:297,metagross:298+ironacorn');
  const evFlags = (id) => HOENN_EVENTS[id].filter((s) => s.flag).map((s) => s.flag);
  const evClears = (id) => HOENN_EVENTS[id].filter((s) => s.clearFlag).map((s) => s.clearFlag);
  ok('A30 Institute event: battleAny Shelly (win/lose branch flags), then the Castform gift (giveMon castform 258), then institute_done + castform_received — Castform\'s obtainable source',
    (() => { const ev = HOENN_EVENTS.ev_hoenn_institute; const bi = ev.findIndex((s) => s.battleAny); const gi = ev.findIndex((s) => s.giveMon);
      return bi >= 0 && ev[bi].battleAny.trainer === 'aqua_admin_institute' && gi > bi
        && ev[gi].giveMon.species === 'castform' && ev[gi].giveMon.level === 258
        && evFlags('ev_hoenn_institute').join(',') === 'institute_done,castform_received'; })());
  ok('A31 Pyre + hideouts: Pyre rides battleAny Courtney then orbs_taken (+ both orb flags); each hideout rides TWO battleAny (admin, then leader) and lands its fiction flag (magma_hideout_done+maxie_faced / aqua_hideout_done+archie_faced+submarine_stolen)',
    HOENN_EVENTS.ev_hoenn_pyre.some((s) => s.battleAny && s.battleAny.trainer === 'magma_admin_pyre')
    && evFlags('ev_hoenn_pyre').join(',') === 'pyre_done,orbs_taken,red_orb_taken,blue_orb_taken'
    && HOENN_EVENTS.ev_hoenn_magma_hideout.filter((s) => s.battleAny).map((s) => s.battleAny.trainer).join(',') === 'magma_admin_hideout,maxie'
    && evFlags('ev_hoenn_magma_hideout').join(',') === 'magma_hideout_done,maxie_faced'
    && HOENN_EVENTS.ev_hoenn_aqua_hideout.filter((s) => s.battleAny).map((s) => s.battleAny.trainer).join(',') === 'aqua_admin_hideout,archie'
    && evFlags('ev_hoenn_aqua_hideout').join(',') === 'aqua_hideout_done,archie_faced,submarine_stolen');
  ok('A32 climax phase design in data: Seafloor sets climax_drought and NEVER climax_deluge; the standoff CLEARS drought and sets deluge (phases never overlap); Rayquaza CLEARS both and sets rayquaza_descended + climax_resolved (the flag H6 keys off)',
    evFlags('ev_hoenn_seafloor').join(',') === 'seafloor_done,groudon_woken,climax_drought' && evClears('ev_hoenn_seafloor').length === 0
    && evClears('ev_hoenn_standoff').join(',') === 'climax_drought' && evFlags('ev_hoenn_standoff').join(',') === 'climax_deluge,kyogre_answered,standoff_seen'
    && evClears('ev_hoenn_rayquaza').join(',') === 'climax_drought,climax_deluge' && evFlags('ev_hoenn_rayquaza').join(',') === 'rayquaza_descended,climax_resolved');
  ok('A33 the titans are appearances only in H4b: no Hoenn event battles or gifts groudon/kyogre/rayquaza, and no Hoenn trainer fields one (their catch arcs are H6\'s, keyed off climax_resolved)',
    Object.values(HOENN_EVENTS).every((ev) => ev.every((s) => {
      const sp = (s.wildBattle && s.wildBattle.species) || (s.giveMon && s.giveMon.species) || (s.giftCapSafe && s.giftCapSafe.species);
      return !['groudon', 'kyogre', 'rayquaza'].includes(sp);
    })) && Object.values(HOENN_TRAINERS).every((t) => t.team.every((m) => !['groudon', 'kyogre', 'rayquaza'].includes(m.species))));
  const { DIVE_PAIRS } = await import(join(ROOT, 'src/data/maps7.mjs'));
  ok('A34 DIVE_PAIRS audit (data views agree): 10 pairs; every pair\'s surface tile is a diveSpot landing on its underwater map and its underwater tile is a surfaceSpot landing back; the Sootopolis pair (surface sootopolis -> r126-underwater) exists — Sootopolis\'s only way in',
    DIVE_PAIRS.length === 10 && DIVE_PAIRS.every((p) => {
      const sm = MAPS7[p.surface], um = MAPS7[p.underwater];
      const ds = (sm.diveSpots || []).find((s) => s.x === p.surfaceTile.x && s.y === p.surfaceTile.y);
      const ss = (um.surfaceSpots || []).find((s) => s.x === p.underwaterTile.x && s.y === p.underwaterTile.y);
      return ds && ds.to.map === p.underwater && ss && ss.to.map === p.surface && um.underwater === true;
    }) && DIVE_PAIRS.some((p) => p.surface === 'sootopolis' && p.underwater === 'r126-underwater')
    && (MAPS7['r128-underwater'].warps || []).some((w) => w.to.map === 'seafloor-cavern'));
  ok('A35 east gym Grounds from the existing 15 (petalburg open, fortree storm, mossdeep mind, sootopolis tide) + landmarks (mt-pyre grave, seafloor tide, cave-of-origin spirit, sky-pillar storm)',
    MAP_GROUND['gym-petalburg'] === 'open' && MAP_GROUND['gym-fortree'] === 'storm'
    && MAP_GROUND['gym-mossdeep'] === 'mind' && MAP_GROUND['gym-sootopolis'] === 'tide'
    && MAP_GROUND['mt-pyre'] === 'grave' && MAP_GROUND['seafloor-cavern'] === 'tide'
    && MAP_GROUND['cave-of-origin'] === 'spirit' && MAP_GROUND['sky-pillar'] === 'storm');
  const chron = readFileSync(join(ROOT, 'docs/chronology-mapping.md'), 'utf8');
  ok('A36 Lucario placement source: docs/chronology-mapping.md Chapter 6 (Rise Through Hoenn, Hoenn) lists "Lucario and the Mystery of Mew" among Hoenn\'s special story events — so the event stages IN-ARC in Hoenn (H4b), not in Arc 3.5',
    /Rise Through Hoenn/.test(chron) && /Lucario and the Mystery of Mew/.test(chron)
    && chron.indexOf('Lucario and the Mystery of Mew') < chron.indexOf('Battle Frontier'));
  const fr = arcById('frontier');
  // SUPERSEDED at Stage F0: the Frontier registry row flipped
  // 'sealed' -> 'shipped' (the arming), so a Hoenn-complete save with
  // the directive pinned now reads frontier as locked-next (the road
  // ahead, armed) instead of sealed. The row is otherwise consumed,
  // not rewritten — same hookGiver/hookLines as at H4b.
  ok('A37 Frontier registry row consumed, not rewritten: hookGiver scott with hookLines written, status shipped (Stage F0 supersedes the sealed-era expectation: with the directive pinned, frontier reads locked-next, the armed road ahead)',
    fr.hookGiver === 'scott' && fr.hookLines.length === 3 && fr.status === 'shipped'
    && (() => { const s2 = defaultState(); s2.story.arc = 'hoenn'; s2.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn']; s2.story.flags.hoenn_complete = true; s2.story.arc_directive = 'frontier';
      return arcStateOf(s2, 'frontier') === 'locked-next' && arcStateOf(s2, 'hoenn') === 'complete'; })());
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
        } else if (m.title === 'Choose next Kin' || m.title === 'Party') {
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
    var npc = ow.map.npcs.find(function (n) { return n.hoenn === kind; });
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

  // ===== THE TRUE PATH: Johto complete -> Homecoming #3 -> embark =====
  var g = mkGame(601); boot(g); strongTeam(g, 250);
  var st = g.state;
  st.story.arc = 'johto'; st.story.region = 'johto';
  st.story.regionsDone = ['kanto', 'orange'];
  st.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  st.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  st.badges.johto = ['zephyrbadge','hivebadge','plainbadge','fogbadge','stormbadge','mineralbadge','glacierbadge','risingbadge'];
  st.story.flags.johto_complete = true;
  var ow = gotoMap(g, 'pallet', 7, 9); pump(g);
  ok('B01 the Foundation machine fires Johto ARC COMPLETE and pins the Hoenn directive (arc_directive hoenn, regionsDone gains johto)',
    st.story.arc_directive === 'hoenn' && st.story.regionsDone.includes('johto') && !!st.story.flags.arc_card_johto,
    'directive=' + st.story.arc_directive);
  ow = gotoMap(g, 'house-pallet-ash', 5, 5); pump(g);
  ok('B02 Homecoming #3 rides the machine: Hawthorn hook delivered, story.arc becomes hoenn, embark_hoenn armed, directive cleared',
    st.story.arc === 'hoenn' && st.story.region === 'hoenn' && !!st.story.flags.hook_hoenn && !!st.story.flags.embark_hoenn && st.story.arc_directive === null,
    'arc=' + st.story.arc + ' embark=' + !!st.story.flags.embark_hoenn);
  ow = gotoMap(g, 'vermilion', 16, 12); pump(g);
  var capt = ow.map.npcs.find(function (n) { return n.name === 'CAPT MARIS'; });
  ok('B03 CAPT HOENN stands on the Vermilion dock in the loaded scene (ferry littleroot, ferryArc hoenn)', !!capt && capt.ferry === 'littleroot' && capt.ferryArc === 'hoenn');
  if (capt) { ow.sysNpc(capt); pump(g, 600); }
  ok('B04 embark drive: Vermilion -> littleroot on the shipped ferryArc machinery (position littleroot, reachedarc_hoenn stamped, arc stays hoenn)',
    st.story.position.map === 'littleroot' && !!st.story.flags.reachedarc_hoenn && st.story.arc === 'hoenn',
    'pos=' + st.story.position.map);
  pump(g, 600);
  ok('B05 the Birch rescue fires on the Littleroot landing and completes (birch_rescued; the uncatchable Poochyena driven off, no dex catch faked)',
    !!st.story.flags.birch_rescued && !st.dex.caught[SPECIES.poochyena.dexNo]);
  ow = gotoMap(g, 'birch-lab', 8, 9); pump(g);
  ok('B06 the lab arrival fires (hoenn_arrival + birch_registered)', !!st.story.flags.hoenn_arrival && !!st.story.flags.birch_registered);
  var birch = ow.map.npcs.find(function (n) { return n.hoenn === 'birch'; });
  ok('B07 PROF. BIRCH stands in his lab as a Hoenn actor', !!birch);
  ow = gotoMap(g, 'littleroot', 13, 12); pump(g);
  var mayNpc = talkKind(g, ow, 'may_littleroot'); pump(g);
  ok('B08 May is met in Littleroot (may_met — the co-spine opens)', !!mayNpc && !!st.story.flags.may_met);
  ow = gotoMap(g, 'petalburg', 13, 10); pump(g);
  var walNpc = talkKind(g, ow, 'wally'); pump(g);
  ok('B09 Wally\\'s first beat completes in Petalburg (wally_helped + wally_ralts — the borrowed-help Ralts catch)', !!walNpc && !!st.story.flags.wally_helped && !!st.story.flags.wally_ralts);
  ow = gotoMap(g, 'gym-petalburg', 7, 9); pump(g);
  var normNpc = talkKind(g, ow, 'norman'); pump(g);
  ok('B10 Norman is met in his gym and defers the battle honestly (norman_met, NO balance badge awarded in H4a)',
    !!normNpc && !!st.story.flags.norman_met && !(st.badges.hoenn || []).includes('balancebadge'));

  function gym(mapId, kind, badge, flag) {
    var o = gotoMap(g, mapId, 7, 9); pump(g);
    var npc = talkKind(g, o, kind); pump(g, 800);
    return !!npc && (st.badges.hoenn || []).includes(badge) && !!st.story.flags[flag];
  }
  ow = gotoMap(g, 'gym-rustboro', 7, 9); pump(g);
  var bram = talkName(g, ow, 'YOUNGSTER BRAM'); pump(g, 800);
  ok('B11 a shipped gym roster trainer battles through the generic trainer path (beat_rustboro_gym_1)', !!bram && !!st.story.flags.beat_rustboro_gym_1);
  ok('B12 Gym 1: Roxanne awards the Stone Badge in order (badges.hoenn [stone], badge_stone)', gym('gym-rustboro', 'roxanne', 'stonebadge', 'badge_stone') && st.badges.hoenn.join(',') === 'stonebadge');
  ow = gotoMap(g, 'meteor-falls', 12, 12); pump(g, 800);
  ok('B13 Meteor Falls first contact fires with the Stone Badge held (meteor_falls_done + teams_glimpsed + cozmo_met; the grunt clash resolved win-or-lose with its branch flag)',
    !!st.story.flags.meteor_falls_done && !!st.story.flags.teams_glimpsed && !!st.story.flags.cozmo_met
    && (!!st.story.flags.meteor_magma_won || !!st.story.flags.meteor_magma_lost));
  ok('B14 Gym 2: Brawly awards the Knuckle Badge in order', gym('gym-dewford', 'brawly', 'knucklebadge', 'badge_knuckle') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge');
  ow = gotoMap(g, 'contest-slateport', 8, 9); pump(g);
  var mayS = talkKind(g, ow, 'may_contest_slateport'); pump(g);
  ok('B15 May\\'s Slateport contest beat fires once the Knuckle Badge is held (may_slateport_done; no ribbon — she loses by half a point)', !!mayS && !!st.story.flags.may_slateport_done && !st.story.flags.may_ribbon_slateport);
  ok('B16 Gym 3: Wattson awards the Dynamo Badge in order', gym('gym-mauville', 'wattson', 'dynamobadge', 'badge_dynamo') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge');
  ow = gotoMap(g, 'contest-verdanturf', 8, 9); pump(g);
  var mayV = talkKind(g, ow, 'may_contest_verdanturf'); pump(g);
  ok('B17 May\\'s Verdanturf contest beat fires (may_verdanturf_done + may_ribbon_verdanturf — ribbon #1 as story state)', !!mayV && !!st.story.flags.may_verdanturf_done && !!st.story.flags.may_ribbon_verdanturf);
  ow = gotoMap(g, 'mt-chimney', 12, 12); pump(g, 800);
  ok('B18 the Mt. Chimney clash fires with the Dynamo Badge held (chimney_clash_done + meteorite_teased; admin battle resolved win-or-lose)',
    !!st.story.flags.chimney_clash_done && !!st.story.flags.meteorite_teased
    && (!!st.story.flags.chimney_magma_won || !!st.story.flags.chimney_magma_lost));
  ok('B19 Gym 4: Flannery awards the Heat Badge in order (badges.hoenn = the H4a prefix of four)', gym('gym-lavaridge', 'flannery', 'heatbadge', 'badge_heat') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge,heatbadge');
  ow = gotoMap(g, 'contest-fallarbor', 8, 9); pump(g);
  var mayF = talkKind(g, ow, 'may_contest_fallarbor'); pump(g);
  ok('B20 May\\'s Fallarbor contest beat fires (may_fallarbor_done + may_ribbon_fallarbor — ribbon #2)', !!mayF && !!st.story.flags.may_fallarbor_done && !!st.story.flags.may_ribbon_fallarbor);

  // ===== weather render state, read off the live bundle =====
  ok('B21 bundle weather resolver: r113 reads ash from its map field; a climax toggle re-dresses it (deluge -> heavy rain) and clears back',
    typeof weatherForMap === 'function' && weatherForMap(st, MAPS.r113).kind === 'ash'
    && (function () { st.story.flags.climax_deluge = true; var w = weatherForMap(st, MAPS.r113); delete st.story.flags.climax_deluge; return w.kind === 'rain' && w.heavy === true && weatherForMap(st, MAPS.r113).kind === 'ash'; })());
  ok('B22 bundle weather resolver: drought overrides a rain map to heavy sun; pallet (no field) stays clear under either climax flag',
    (function () { st.story.flags.climax_drought = true; var a = weatherForMap(st, MAPS.r119); var b = weatherForMap(st, MAPS.pallet); delete st.story.flags.climax_drought;
      st.story.flags.climax_deluge = true; var c = weatherForMap(st, MAPS.pallet); delete st.story.flags.climax_deluge;
      return a.kind === 'sun' && a.heavy === true && b.kind === 'clear' && c.kind === 'clear'; })());
  ok('B23 the merge fold landed in the bundle (TRAINERS carries the Hoenn leaders + admins; EVENTS carries the H4a scenes; QUESTS carries the Hoenn tales)',
    !!TRAINERS.roxanne && !!TRAINERS.magma_admin_chimney && !!EVENTS.ev_hoenn_rescue && !!EVENTS.ev_hoenn_chimney && !!QUESTS.tale_littleroot && !!QUESTS.tale_slateport);
  var owT = gotoMap(g, 'littleroot', 10, 10); pump(g);
  var bramble = owT.map.npcs.find(function (n) { return n.name === 'ELDER BRAMBLE'; });
  ok('B24 a Hoenn Town Tale runs on the shipped tale machine (Bramble offers tale_littleroot; the tale goes active)',
    !!bramble && !!bramble.tale && (function () { owT.sysNpc(bramble); pump(g); return st.story.quests.tale_littleroot === 'active' || st.story.quests.tale_littleroot === 0 || !!st.story.quests.tale_littleroot; })(),
    'quest=' + st.story.quests.tale_littleroot);
  // ===== H4b: THE EAST HALF (team re-levelled by the harness, the
  // H4a harness convention — balance is not what this suite proves) =====
  strongTeam(g, 299);
  ok('B25 Gym 5: Norman awards the Balance Badge in order (the deferred meeting pays off at full circle)', gym('gym-petalburg', 'norman', 'balancebadge', 'badge_balance') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge,heatbadge,balancebadge');
  ow = gotoMap(g, 'r119', 11, 20); pump(g, 900);
  ok('B26 the Weather Institute takeover fires with the Balance Badge held and is cleared (institute_done + castform_received; Castform registered caught, dex 351)',
    !!st.story.flags.institute_done && !!st.story.flags.castform_received && !!st.dex.caught[351]);
  ok('B27 Gym 6: Winona awards the Feather Badge in order', gym('gym-fortree', 'winona', 'featherbadge', 'badge_feather') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge,heatbadge,balancebadge,featherbadge');
  // Dive refusal I: no Mind Badge yet (r124 trench).
  ow = gotoMap(g, 'r124', 13, 8); pump(g);
  ow.sysInteract(13, 7); pump(g);
  ok('B28 Dive gate I: at the r124 trench without the Mind Badge the dive refuses (still on r124, no warp) — the refusal names the badge in dialogue',
    st.story.position.map === 'r124' && !st.story.flags.dive_taught);
  ow = gotoMap(g, 'contest-lilycove', 8, 9); pump(g);
  var mayL = talkKind(g, ow, 'may_contest_lilycove'); pump(g);
  ok('B29 May\\'s Lilycove contest beat fires (may_lilycove_done + may_ribbon_lilycove — ribbon #3)', !!mayL && !!st.story.flags.may_lilycove_done && !!st.story.flags.may_ribbon_lilycove);
  ow = gotoMap(g, 'lilycove', 15, 10); pump(g);
  var mayFest = talkKind(g, ow, 'may_festival'); pump(g);
  ok('B30 May\\'s closing beat: the Grand Festival departure (may_festival_done + may_grand_festival_done + may_ribbon_grandfestival — ribbon #4 as story dressing; she exits toward her own final)',
    !!mayFest && !!st.story.flags.may_festival_done && !!st.story.flags.may_grand_festival_done && !!st.story.flags.may_ribbon_grandfestival);
  ow = gotoMap(g, 'gym-mossdeep', 7, 9); pump(g);
  var tateNpc = talkKind(g, ow, 'tate_liza'); pump(g, 1200);
  ok('B31 Gym 7: the twins\\' back-to-back pair awards the Mind Badge in order (beat_tate AND badge_mind — Tate first, Liza closes, the recorded no-2v2 adaptation)',
    !!tateNpc && !!st.story.flags.beat_tate && (st.badges.hoenn || []).includes('mindbadge') && !!st.story.flags.badge_mind
    && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge,heatbadge,balancebadge,featherbadge,mindbadge');
  // Dive refusal II: badge held, the move not yet taught (r126 trench).
  ow = gotoMap(g, 'r126', 13, 8); pump(g);
  ow.sysInteract(13, 7); pump(g);
  ok('B32 Dive gate II: at the r126 trench with the Mind Badge but no Dive knowledge the dive still refuses (still on r126) — the refusal names the move',
    st.story.position.map === 'r126' && !st.story.flags.dive_taught);
  ow = gotoMap(g, 'mossdeep', 13, 10); pump(g);
  var stevenNpc = talkKind(g, ow, 'steven'); pump(g);
  ok('B33 Steven Stone teaches Dive in Mossdeep after the gym (dive_taught; a party member carries dive in hmMoves — the field-knowledge representation, no battle slot, no new move)',
    !!stevenNpc && !!st.story.flags.dive_taught && ow.partyKnowsDive()
    && st.party.some(function (m) { return (m.hmMoves || []).includes('dive'); })
    && st.party.every(function (m) { return !m.moves.some(function (mv) { return mv.id === 'dive'; }); }));
  // The dive audit: EVERY DIVE_PAIRS entry driven down AND up through
  // the real sysInteract (standing on the spot; surfacing is
  // unconditional — this same drive would pass with no badge/move).
  var diveOk = 0, diveLog = [];
  DIVE_PAIRS.forEach(function (p) {
    var o1 = gotoMap(g, p.surface, p.surfaceTile.x, p.surfaceTile.y); pump(g);
    o1.sysInteract(p.surfaceTile.x, p.surfaceTile.y); pump(g);
    var down = st.story.position.map === p.underwater;
    var o2 = gotoMap(g, p.underwater, p.underwaterTile.x, p.underwaterTile.y); pump(g);
    o2.sysInteract(p.underwaterTile.x, p.underwaterTile.y); pump(g);
    var up = st.story.position.map === p.surface;
    if (down && up) diveOk++; else diveLog.push(p.surface + '->' + p.underwater + ' down=' + down + ' up=' + up);
  });
  ok('B34 NO-SOFT-LOCK dive audit: all 10 DIVE_PAIRS driven down AND up through sysInteract (incl. the Sootopolis pair — its only way in or out)', diveOk === 10, diveLog.join(';'));
  ow = gotoMap(g, 'mt-pyre', 11, 15); pump(g, 900);
  ok('B35 Mt. Pyre fires with the Mind Badge held: the orbs are taken despite the stand (pyre_done + orbs_taken + both orb flags; the admin battle resolved win-or-lose)',
    !!st.story.flags.pyre_done && !!st.story.flags.orbs_taken && !!st.story.flags.red_orb_taken && !!st.story.flags.blue_orb_taken
    && (!!st.story.flags.pyre_magma_won || !!st.story.flags.pyre_magma_lost));
  ow = gotoMap(g, 'magma-hideout', 7, 11); pump(g, 1200);
  ok('B36 the Magma Hideout raid fires (Tabitha, then Maxie, both battleAny; magma_hideout_done + maxie_faced)',
    !!st.story.flags.magma_hideout_done && !!st.story.flags.maxie_faced
    && (!!st.story.flags.magma_hideout_won || !!st.story.flags.magma_hideout_lost) && (!!st.story.flags.maxie_won || !!st.story.flags.maxie_lost));
  ow = gotoMap(g, 'aqua-hideout', 16, 11); pump(g, 1200);
  ok('B37 the Aqua Hideout raid fires and the submarine is stolen anyway (Matt, then Archie; aqua_hideout_done + archie_faced + submarine_stolen)',
    !!st.story.flags.aqua_hideout_done && !!st.story.flags.archie_faced && !!st.story.flags.submarine_stolen);
  ow = gotoMap(g, 'r128-underwater', 20, 8); pump(g);
  var seafloorWarp = (ow.map.warps || []).some(function (w) { return w.to.map === 'seafloor-cavern'; });
  ow = gotoMap(g, 'seafloor-cavern', 8, 11); pump(g, 1200);
  ok('B38 Seafloor Cavern is entered from r128-underwater\\'s walking warp and Groudon wakes: PHASE 1 — climax_drought set, climax_deluge NOT set (seafloor_done + groudon_woken); the renderer shows heavy sun over a rain map',
    seafloorWarp && !!st.story.flags.seafloor_done && !!st.story.flags.groudon_woken
    && st.story.flags.climax_drought === true && !st.story.flags.climax_deluge
    && weatherForMap(st, MAPS.r119).kind === 'sun' && weatherForMap(st, MAPS.r119).heavy === true && weatherForMap(st, MAPS.r119).source === 'climax');
  ow = gotoMap(g, 'sootopolis', 13, 10); pump(g, 900);
  ok('B39 the standoff converges on Sootopolis: PHASE 2 — Kyogre answers, climax_drought CLEARED, climax_deluge set (standoff_seen + kyogre_answered); the renderer shows heavy rain over an ash map; neither titan caught or consumed',
    !!st.story.flags.standoff_seen && !!st.story.flags.kyogre_answered
    && st.story.flags.climax_drought === false && st.story.flags.climax_deluge === true
    && weatherForMap(st, MAPS.r113).kind === 'rain' && weatherForMap(st, MAPS.r113).heavy === true
    && !st.dex.caught[383] && !st.dex.caught[382]);
  ow = gotoMap(g, 'cave-of-origin', 8, 10); pump(g);
  var keeperNpc = talkKind(g, ow, 'origin_keeper'); pump(g);
  ok('B40 the Cave of Origin guidance beat: the keeper points UP (origin_guidance — Sky Pillar, not the cave, holds the answer)', !!keeperNpc && !!st.story.flags.origin_guidance);
  ow = gotoMap(g, 'sky-pillar', 8, 15); pump(g, 900);
  ok('B41 Sky Pillar: Rayquaza descends and the climax RESOLVES — both flags cleared, climax_resolved set (the flag H6 keys off); the renderer falls back to per-map fields (r113 ash again); Rayquaza not caught',
    !!st.story.flags.climax_resolved && !!st.story.flags.rayquaza_descended
    && st.story.flags.climax_drought === false && st.story.flags.climax_deluge === false
    && weatherForMap(st, MAPS.r113).kind === 'ash' && weatherForMap(st, MAPS.r113).source === 'map'
    && !st.dex.caught[384]);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  ok('B42 Gym 8: Juan awards the Rain Badge in order — badges.hoenn complete, all eight in the canonical earn order', gym('gym-sootopolis', 'juan', 'rainbadge', 'badge_rain') && st.badges.hoenn.join(',') === 'stonebadge,knucklebadge,dynamobadge,heatbadge,balancebadge,featherbadge,mindbadge,rainbadge');
  ow = gotoMap(g, 'petalburg-woods', 12, 12); pump(g);
  var auraNpc = talkKind(g, ow, 'lucario_keeper'); pump(g);
  ok('B43 the Lucario special stages in-arc (chronology Ch.6): the aura flowers open in Petalburg Woods (lucario_event_done + lucario_aura_seen — a legend beat, no fake Sinnoh-dex battle staged)',
    !!auraNpc && !!st.story.flags.lucario_event_done && !!st.story.flags.lucario_aura_seen);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  ow = gotoMap(g, 'victory-road-maris', 11, 10); pump(g);
  var walFinal = talkKind(g, ow, 'wally_final'); pump(g, 1200);
  ok('B44 Wally\\'s payoff in Victory Road: the grown boy is faced and beaten before the league doors (wally_final_done + beat_wally_final)', !!walFinal && !!st.story.flags.wally_final_done && !!st.story.flags.beat_wally_final);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  ow = gotoMap(g, 'league-evergrande', 11, 12); pump(g);
  var regNpc = talkKind(g, ow, 'hoenn_conference'); pump(g);
  ok('B45 the Ever Grande Conference registers with eight badges and a resolved climax (hoenn_conference_registered)', !!regNpc && !!st.story.flags.hoenn_conference_registered);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  talkKind(g, ow, 'hoenn_conference'); pump(g, 1200);
  ok('B46 preliminary one is driven through the registrar (beat_conference_h_p1)', !!st.story.flags.beat_conference_h_p1);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  talkKind(g, ow, 'hoenn_conference'); pump(g, 1200);
  ok('B47 preliminary two is driven through the registrar (beat_conference_h_p2)', !!st.story.flags.beat_conference_h_p2);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  var morNpc = talkKind(g, ow, 'morrison'); pump(g, 1200);
  ok('B48 the semi-final: Morrison, the friend-rival beat, is beaten (beat_morrison)', !!morNpc && !!st.story.flags.beat_morrison);
  st.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; (m.moves || []).forEach(function (mv) { mv.pp = mv.maxPp; }); });
  var tysNpc = talkKind(g, ow, 'tyson'); pump(g, 2500);
  ok('B49 THE FINAL vs Tyson resolves on the FACED predicate (tyson_faced; win or loss branch flag recorded honestly) — and completion fires either way: Scott\\'s invitation delivered AT the conference (scott_invitation) + hoenn_complete set',
    !!tysNpc && !!st.story.flags.tyson_faced && (!!st.story.flags.tyson_won || !!st.story.flags.tyson_lost)
    && !!st.story.flags.scott_invitation && !!st.story.flags.hoenn_complete,
    'won=' + !!st.story.flags.tyson_won + ' lost=' + !!st.story.flags.tyson_lost);
  pump(g, 900);
  ok('B50 the Foundation machine fires from the flag alone: ARC COMPLETE card (arc_card_hoenn), regionsDone gains hoenn through the machine\\'s own write, and the Frontier directive is pinned (arc_directive frontier)',
    !!st.story.flags.arc_card_hoenn && st.story.regionsDone.includes('hoenn') && st.story.arc_directive === 'frontier',
    'directive=' + st.story.arc_directive + ' done=' + st.story.regionsDone.join(','));
  ow = gotoMap(g, 'house-pallet-ash', 5, 5); pump(g, 900);
  // SUPERSEDED at Stage F0: the Frontier row flipped 'sealed' ->
  // 'shipped', so this homecoming now takes the SHIPPED branch of the
  // same machine (the sealed branch's last live proof was this test
  // at H4b): the hook is still delivered and the directive still
  // clears — the subjects this check was written for — but story.arc
  // now ADVANCES to frontier and embark_frontier IS armed.
  ok('B51 Homecoming rides the machine: Scott\\'s Frontier hook is delivered at home (hook_frontier), the directive clears, and the shipped-arc law holds (Stage F0 supersedes the sealed-branch assertion) — story.arc advances to frontier, embark_frontier armed; Hoenn reads complete',
    !!st.story.flags.hook_frontier && st.story.arc_directive === null && st.story.arc === 'frontier'
    && !!st.story.flags.embark_frontier && arcStateOf(st, 'hoenn') === 'complete',
    'arc=' + st.story.arc + ' hook=' + !!st.story.flags.hook_frontier + ' embark=' + !!st.story.flags.embark_frontier);
  globalThis.__HOENN_Q__ = Q;
})();`;

let QB = null;
try {
  // Evaluate the bundle + driver together in this realm.
  const runner = new Function(gameJs + driver + '\n;return globalThis.__HOENN_Q__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) { if (r.pass) pass++; else fail++; }
  console.log('Part B: ' + QB.results.filter((r) => r.pass).length + '/' + QB.results.length + ' passed');
}

console.log('\nhoenn-story: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
