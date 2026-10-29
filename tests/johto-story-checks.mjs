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
const { JOHTO_QUESTS, JOHTO_TRAINERS, JOHTO_EVENTS, JOHTO_TALES, JOHTO_NPCS, JOHTO_NPC_PATCHES, JOHTO_LEGENDARY_ARCS } = await import(join(ROOT, 'src/data/story-johto.mjs'));
const { LEGENDARY_ARCS: KANTO_FILE_ARCS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
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
  ok('A02 JOHTO_QUESTS: the full chain in the MAIN_QUESTS idiom (west arrival->fog, then J4b east: potion -> storm -> mineral -> redgyarados -> hideout -> glacier -> radio -> rising -> conference -> gary -> harrison/completion -> red)',
    JOHTO_QUESTS.length === 22
    && JOHTO_QUESTS.every((q) => q.id.startsWith('q_johto_') && q.flag && q.text && q.hint)
    && JOHTO_QUESTS.map((q) => q.flag).join(',') === 'johto_arrival,silver_reported,sprout_tower_done,badge_zephyr,johto_well_cleared,gsball_delivered,badge_hive,badge_plain,beasts_awakened,badge_fog,amphy_healed,badge_storm,badge_mineral,red_gyarados_done,johto_hideout_cleared,badge_glacier,radio_tower_cleared,badge_rising,conference_registered,beat_gary_johto,johto_complete,red_defeated');
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
  ok('A11 ten Town Tales (6 west + 4 east: olivine/cianwood/mahogany/blackthorn) in the shipped shape law (<=3 stages, reward + rewardText, revelation, data lines, johtoTale key, giver matches a patch)',
    Object.keys(JOHTO_TALES).length === 10
    && ['tale_olivine', 'tale_cianwood', 'tale_mahogany', 'tale_blackthorn'].every((id) => !!JOHTO_TALES[id])
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
  ok('A15 tables.json in sync; badgeSequences.johto is the earn order, items count 146 (145 + the Clear Bell key item, Stage J5 — supersedes the Stage J4b count), quests table carries every q_johto_* + johto tale id',
    checkOut.includes('tables.json OK')
    && JSON.stringify(t.badgeSequences.johto) === JSON.stringify(JOHTO_ORDER)
    && t.items.length === 146
    && t.items.includes('secretpotion')
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
  ok('A18 patch table: 24 patches (10 tale givers + 10 stage actors + 4 functional johto stamps: pharmacist/den elder/pass veteran/conference official), every patched name exists in its maps6 roster',
    JOHTO_NPC_PATCHES.length === 24
    && JOHTO_NPC_PATCHES.filter((p) => p.tale).length === 20
    && JOHTO_NPC_PATCHES.filter((p) => p.johto).map((p) => p.johto).join(',') === 'pharmacist,den_elder,silver_gate,conference'
    && JOHTO_NPC_PATCHES.every((p) => (MAPS6[p.map].npcs || []).some((n) => n.name === p.name)));
}

// ================= Part A2: J4b east units =================
{
  const team = (id) => JOHTO_TRAINERS[id].team.map((m) => m.species + ':' + m.level + (m.keepsake ? '+' + m.keepsake : '')).join(',');
  ok('A19 east leader teams in the band (Chuck 148/151/154 secondwindribbon stormbadge, Jasmine 154/157/160 fossilspur mineralbadge, Pryce 162/165/168 tortoisecharm glacierbadge); all badgeSet johto',
    team('chuck') === 'primeape:148,poliwrath:151,machamp:154+secondwindribbon'
    && team('jasmine') === 'magnemite:154,magneton:157,steelix:160+fossilspur'
    && team('pryce') === 'seel:162,dewgong:165,piloswine:168+tortoisecharm'
    && ['chuck', 'jasmine', 'pryce'].every((id) => JOHTO_TRAINERS[id].badgeSet === 'johto' && JOHTO_ORDER.includes(JOHTO_TRAINERS[id].badge)));
  ok('A20 Clair carries NO badge (the Rising Badge is the den\'s to give): team 172/174/175/178 tidepearl, and the shrine keeper battles at ~176 (dragonair 174, kingdra 177)',
    !JOHTO_TRAINERS.clair.badge && JOHTO_TRAINERS.clair.badgeSet === 'johto'
    && team('clair') === 'dragonair:172,dragonair:174,gyarados:175,kingdra:178+tidepearl'
    && team('den_shrine') === 'dragonair:174,kingdra:177');
  ok('A21 Secret Potion is a key-pocket ITEMS row; the Card Key is the shipped cardkey row (one representation, Silph -> Radio Tower)',
    ITEMS.secretpotion && ITEMS.secretpotion.pocket === 'key' && ITEMS.cardkey && ITEMS.cardkey.pocket === 'key');
  ok('A22 Silver east teams: ilex 128-134 with the stolen starter grown (golbat/sneasel/croconaw), route 178-184 fully evolved (crobat/sneasel/magneton/feraligatr); neither is a leader',
    team('silver_ilex') === 'golbat:128,sneasel:131,croconaw:134'
    && team('silver_route') === 'crobat:178,sneasel:180,magneton:182,feraligatr:184'
    && !JOHTO_TRAINERS.silver_ilex.badge && !JOHTO_TRAINERS.silver_route.badge);
  ok('A23 Red Gyarados event: a CATCHABLE wildBattle (gyarados 162, no uncatchable flag) and red_gyarados_done is set only AFTER the battle step (flee stalls the chain — nothing completes)',
    (() => { const ev = JOHTO_EVENTS.ev_johto_redgyarados; const bi = ev.findIndex((s) => s.wildBattle); const fi = ev.findIndex((s) => s.flag === 'red_gyarados_done');
      return bi >= 0 && ev[bi].wildBattle.species === 'gyarados' && ev[bi].wildBattle.level === 162 && !ev[bi].wildBattle.uncatchable && fi > bi
        && ev.some((s) => s.flag === 'lance_met'); })());
  ok('A24 hideout gauntlet order: grunt -> grunt -> Electrode power core (wildBattle 166, uncatchable) -> Executive Vey -> johto_hideout_cleared at the very end',
    (() => { const ev = JOHTO_EVENTS.ev_johto_hideout;
      const seq = ev.map((s) => s.battle || (s.wildBattle ? 'wild:' + s.wildBattle.species : null)).filter(Boolean);
      return JSON.stringify(seq) === JSON.stringify(['rocket_hideout_1', 'rocket_hideout_2', 'wild:electrode', 'rocket_hideout_exec'])
        && ev[ev.findIndex((s) => s.wildBattle)].wildBattle.uncatchable === true
        && ev[ev.length - 2].flag === 'johto_hideout_cleared'; })());
  ok('A25 Radio Tower staging (post-hideout order in data): takeover battle + radio_f1_cleared; the locked scene has NO battle; the Director rescue gives the cardkey; the top floor sets radio_tower_cleared',
    JOHTO_EVENTS.ev_johto_radio_takeover.some((s) => s.battle === 'rocket_radio_1')
    && JOHTO_EVENTS.ev_johto_radio_takeover.some((s) => s.flag === 'radio_f1_cleared')
    && JOHTO_EVENTS.ev_johto_radio_locked.every((s) => !s.battle && !s.wildBattle)
    && JOHTO_EVENTS.ev_johto_director.some((s) => s.battle === 'rocket_underground')
    && JOHTO_EVENTS.ev_johto_director.some((s) => s.give && s.give.items && s.give.items.cardkey === 1)
    && JOHTO_EVENTS.ev_johto_director.some((s) => s.flag === 'radio_director_rescued')
    && JOHTO_EVENTS.ev_johto_radio_top.some((s) => s.battle === 'rocket_director_fake')
    && JOHTO_EVENTS.ev_johto_radio_top.some((s) => s.flag === 'radio_tower_cleared'));
  ok('A26 Gary centrepiece team (Blastoise-anchored 186-193, tidepearl ace, smart AI, NO badge — a league battle, not a gym) + Harrison (192-198, sneasel/hypno/steelix/miltank/houndoom core) + qualifiers 180-186',
    team('gary_johto') === 'pidgeot:186,alakazam:188,arcanine:189,gengar:190,umbreon:191,blastoise:193+tidepearl'
    && JOHTO_TRAINERS.gary_johto.ai === 'smart' && !JOHTO_TRAINERS.gary_johto.badge
    && team('harrison') === 'sneasel:192,xatu:193,hypno:194,steelix:195,miltank:196,houndoom:198'
    && JOHTO_TRAINERS.conference_q1.team.every((m) => m.level >= 180 && m.level <= 184)
    && JOHTO_TRAINERS.conference_q2.team.every((m) => m.level >= 183 && m.level <= 186));
  ok('A27 Red at the band ceiling, canon team (espeon 195, snorlax 196, venusaur 197, charizard 198, blastoise 198, pikachu 200)',
    team('red') === 'espeon:195,snorlax:196,venusaur:197,charizard:198,blastoise:198,pikachu:200');
  ok('A28 east Grounds from the existing 15 (cianwood rubble, olivine tide, mahogany frost, blackthorn ember, den grave, radio storm, stadium open, mt-silver-cave frost)',
    MAP_GROUND['gym-cianwood'] === 'rubble' && MAP_GROUND['gym-olivine'] === 'tide'
    && MAP_GROUND['gym-mahogany'] === 'frost' && MAP_GROUND['gym-blackthorn'] === 'ember'
    && MAP_GROUND['dragons-den'] === 'grave' && MAP_GROUND['radio-tower-3'] === 'storm'
    && MAP_GROUND['silver-stadium'] === 'open' && MAP_GROUND['mt-silver-cave'] === 'frost'
    && MAP_GROUND['lake-of-rage'] === 'tide' && MAP_GROUND['lighthouse-2'] === 'tide');
  ok('A29 route-silver gate event: dialogue + a warp back to Blackthorn\'s east edge (28,8) — turned back, never stuck; the third Silver clash rides battleAny with branch flags and closes on silver_route_done',
    (() => { const g8 = JOHTO_EVENTS.ev_johto_silver_gate; const w = g8[g8.length - 1].warp;
      const ev = JOHTO_EVENTS.ev_johto_silver_route; const bi = ev.findIndex((s) => s.battleAny);
      return w && w.map === 'blackthorn' && w.x === 28 && w.y === 8
        && bi >= 0 && ev[bi].battleAny.trainer === 'silver_route' && ev[bi].battleAny.winFlag === 'silver_route_won' && ev[bi].battleAny.loseFlag === 'silver_route_lost'
        && ev.some((s) => s.flag === 'silver_route_done'); })()
    && (() => { const won = JOHTO_EVENTS.ev_johto_silver_ilex_won, lost = JOHTO_EVENTS.ev_johto_silver_ilex_lost;
      return won.some((s) => s.battleAny && s.battleAny.trainer === 'silver_ilex') && lost.some((s) => s.battleAny && s.battleAny.trainer === 'silver_ilex')
        && JSON.stringify(won) !== JSON.stringify(lost); })());
}

// -- Stage J5: legendary arcs + badge gate + hideout map (pure units) --
{
  ok('A30 JOHTO_LEGENDARY_ARCS: the beasts + Celebi, prereq beasts_awakened, lairs authored (national-park / mt-mortar-2 / bell-tower / ilex-forest), every step carrying its flag or its catch',
    JSON.stringify(Object.keys(JOHTO_LEGENDARY_ARCS).sort()) === JSON.stringify(['arc_celebi', 'arc_entei', 'arc_raikou', 'arc_suicune'])
    && JOHTO_LEGENDARY_ARCS.arc_raikou.lair === 'national-park' && JOHTO_LEGENDARY_ARCS.arc_entei.lair === 'mt-mortar-2'
    && JOHTO_LEGENDARY_ARCS.arc_suicune.lair === 'bell-tower' && JOHTO_LEGENDARY_ARCS.arc_celebi.lair === 'ilex-forest'
    && Object.values(JOHTO_LEGENDARY_ARCS).every((a) => a.prereq === 'beasts_awakened' && a.steps.length === 3
      && a.steps.slice(0, 2).every((s) => typeof s.flag === 'string') && a.steps[2].catch === a.species)
    && JOHTO_LEGENDARY_ARCS.arc_raikou.steps[0].flag === 'arc_raikou_sign1' && JOHTO_LEGENDARY_ARCS.arc_raikou.steps[1].flag === 'arc_raikou_sign2'
    && JOHTO_LEGENDARY_ARCS.arc_suicune.steps[2].text.includes('Raikou and Entei'));
  ok('A31 arc_hooh ACTIVATED in place: no designedOnly, lair bell-tower (supersedes tintower), the four designed steps with flags, the face written at level 182 (ruling 3 supersedes the designed 70)',
    !KANTO_FILE_ARCS.arc_hooh.designedOnly && KANTO_FILE_ARCS.arc_hooh.lair === 'bell-tower'
    && KANTO_FILE_ARCS.arc_hooh.steps.length === 4
    && KANTO_FILE_ARCS.arc_hooh.steps[0].flag === 'hooh_history' && KANTO_FILE_ARCS.arc_hooh.steps[1].flag === 'hooh_bell_received'
    && KANTO_FILE_ARCS.arc_hooh.steps[2].flag === 'hooh_summit' && KANTO_FILE_ARCS.arc_hooh.steps[3].catch === 'hooh'
    && KANTO_FILE_ARCS.arc_hooh.steps[3].text.includes('182'));
  ok('A32 Clear Bell is a key-pocket ITEMS row; the GS Ball stays an ordinary bag item (its post-arc memento state needs no data change)',
    ITEMS.clearbell && ITEMS.clearbell.pocket === 'key' && ITEMS.gsball && ITEMS.gsball.pocket === 'items');
  const faceShape = (evId, species, level, doneFlag) => {
    const ev = JOHTO_EVENTS[evId];
    const bi = ev.findIndex((s) => s.wildBattleCatch);
    return bi >= 0 && ev[bi].wildBattleCatch.species === species && ev[bi].wildBattleCatch.level === level && ev[bi].wildBattleCatch.legendary === true
      && ev.every((s) => !s.wildBattle)
      && ev.findIndex((s) => s.arc && s.stage === 'complete') > bi
      && ev.findIndex((s) => s.flag === doneFlag) > bi;
  };
  ok('A33 J5 face events ride the catch-only chain: raikou 178 / entei 180 / suicune 184 / celebi 170 / hooh 182, arc-complete + done flags strictly AFTER the battle step, no plain wildBattle anywhere in them; the glimpse is dialogue-only; the Burned Tower event now writes the three beast arcs discovered',
    faceShape('ev_johto_raikou', 'raikou', 178, 'arc_raikou_done')
    && faceShape('ev_johto_entei', 'entei', 180, 'arc_entei_done')
    && faceShape('ev_johto_suicune', 'suicune', 184, 'arc_suicune_done')
    && faceShape('ev_johto_celebi', 'celebi', 170, 'arc_celebi_done')
    && faceShape('ev_johto_hooh', 'hooh', 182, 'arc_hooh_done')
    && JOHTO_EVENTS.ev_johto_hooh_glimpse.every((s) => !s.wildBattle && !s.wildBattleCatch && !s.battle && !s.battleAny)
    && JOHTO_EVENTS.ev_johto_hooh_glimpse.some((s) => s.flag === 'hooh_glimpsed')
    && ['arc_raikou', 'arc_entei', 'arc_suicune'].every((a) => JOHTO_EVENTS.ev_johto_burned.some((s) => s.arc === a && s.stage === 'discovered')));
  const t5 = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A34 tables.json carries the five live arc ids + the clearbell item (validator quest/id plumbing for J5 saves)',
    ['arc_raikou', 'arc_entei', 'arc_suicune', 'arc_celebi', 'arc_hooh'].every((id) => t5.quests.includes(id))
    && t5.items.includes('clearbell'));
  ok('A35 rocket-hideout is a shipped interior map: 26x16, indoor, start (12,14), both stair doors warp back to Mahogany (18,8), Storm ground',
    !!MAPS6['rocket-hideout'] && MAPS6['rocket-hideout'].indoor === true
    && MAPS6['rocket-hideout'].rows.length === 16 && MAPS6['rocket-hideout'].rows[0].length === 26
    && MAPS6['rocket-hideout'].start.x === 12 && MAPS6['rocket-hideout'].start.y === 14
    && MAPS6['rocket-hideout'].warps.length === 2
    && MAPS6['rocket-hideout'].warps.every((w) => w.to.map === 'mahogany' && w.to.x === 18 && w.to.y === 8)
    && MAP_GROUND['rocket-hideout'] === 'storm');
  ok('A36 the J5 actors are placed by the append idiom: six beast witnesses (ordered sign kinds), the Ecruteak elder, the Kimono sister, and the Mahogany shopkeeper carrying the hideout stair warp',
    ['beast_sign_raikou_1', 'beast_sign_raikou_2', 'beast_sign_entei_1', 'beast_sign_entei_2', 'beast_sign_suicune_1', 'beast_sign_suicune_2', 'hooh_elder', 'kimono_bell', 'hideout_stairs']
      .every((k) => JOHTO_NPCS.some((n) => n.johto === k))
    && JOHTO_NPCS.find((n) => n.johto === 'hideout_stairs').hideoutWarp === 'rocket-hideout');
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
  // J4b helpers (the orange-climax idiom): drain dialogue until a
  // battle is on top, throw one named ball, or run from a wild battle.
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
        break;
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
  function westComplete(g) {
    var st = g.state;
    st.story.arc = 'johto'; st.story.region = 'johto';
    st.story.regionsDone = ['kanto', 'orange'];
    st.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
    st.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
    st.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge'];
    st.story.flags.johto_arrival = true; st.story.flags.elm_registered = true;
    st.story.flags.silver_reported = true; st.story.flags.silver_r30_won = true;
    st.story.flags.sprout_tower_done = true; st.story.flags.johto_well_cleared = true;
    st.story.flags.gsball_delivered = true; st.story.flags.kurt_has_ball = true; st.story.flags.gsball_at_kurt_house = true;
    st.story.flags.beasts_awakened = true;
    st.story.flags.badge_zephyr = true; st.story.flags.badge_hive = true;
    st.story.flags.badge_plain = true; st.story.flags.badge_fog = true;
    return st;
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

  // ================= J4b: THE EAST TRUE PATH =================
  // One continuous save, west-complete, driven through the whole
  // east chain on the real handlers / events / battle paths.
  var gE = mkGame(405); boot(gE); strongTeam(gE, 165);
  var stE = westComplete(gE);

  gotoMap(gE, 'ilex-forest', 26, 9); pump(gE);
  ok('E01 Silver, second clash (Ilex Forest, won-branch staging after the Route 30 win): battleAny advances win-or-lose, the branch flag records the outcome, silver_ilex_done set',
    stE.story.flags.silver_ilex_done === true
    && (!!stE.story.flags.silver_ilex_won !== !!stE.story.flags.silver_ilex_lost),
    JSON.stringify({ won: stE.story.flags.silver_ilex_won, lost: stE.story.flags.silver_ilex_lost }));

  var owLH = gotoMap(gE, 'lighthouse-2', 13, 9);
  talkKind(gE, owLH, 'jasmine_light'); pump(gE);
  ok('E02 the errand opens: Jasmine at Amphy’s side asks for the Cianwood Secret Potion (jasmine_asked) — she will not battle yet',
    stE.story.flags.jasmine_asked === true && !stE.story.flags.amphy_healed);
  var owJG = gotoMap(gE, 'gym-olivine', 7, 8);
  talkKind(gE, owJG, 'jasmine'); pump(gE);
  ok('E03 Jasmine’s BATTLE is gated on the potion delivery and nothing else: no battle, no Mineral Badge before it',
    !stE.badges.johto.includes('mineralbadge') && !(gE.scenes.top instanceof BattleScene));

  var owPH = gotoMap(gE, 'house-cianwood', 6, 8);
  talkKind(gE, owPH, 'pharmacist'); pump(gE);
  ok('E04 the Cianwood pharmacy hands over the Secret Potion (key item in the bag)',
    (stE.bag.secretpotion || 0) === 1 && stE.story.flags.secret_potion_got === true);
  var owC = gotoMap(gE, 'gym-cianwood', 7, 8);
  talkKind(gE, owC, 'chuck'); pump(gE);
  ok('E05 Chuck through the real leader runner: Storm Badge — badges.johto prefix grows to 5',
    JSON.stringify(stE.badges.johto) === JSON.stringify(['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge'])
    && stE.story.flags.badge_storm === true, JSON.stringify(stE.badges.johto));

  var owLH2 = gotoMap(gE, 'lighthouse-2', 13, 9);
  talkKind(gE, owLH2, 'jasmine_light'); pump(gE);
  ok('E06 the delivery: the potion leaves the bag, Amphy heals and the light comes back on (amphy_healed)',
    stE.story.flags.amphy_healed === true && !(stE.bag.secretpotion > 0));
  var owJG2 = gotoMap(gE, 'gym-olivine', 7, 8);
  talkKind(gE, owJG2, 'jasmine'); pump(gE);
  ok('E07 Jasmine through the real leader runner after the delivery: Mineral Badge — 6/8 in earn order',
    stE.badges.johto.includes('mineralbadge') && stE.story.flags.badge_mineral === true && stE.badges.johto.length === 6,
    JSON.stringify(stE.badges.johto));

  // ---- Red Gyarados: flee -> re-fire -> catch ----
  stE.bag.masterball = 2;
  gotoMap(gE, 'lake-of-rage', 13, 16);
  var inBattle1 = drainToBattle(gE);
  var fled = inBattle1 && driveFlee(gE);
  ok('E08 Red Gyarados fires on the lake; FLEEING completes nothing (no red_gyarados_done, no lance_met)',
    inBattle1 && fled && !stE.story.flags.red_gyarados_done && !stE.story.flags.lance_met,
    JSON.stringify({ inBattle: inBattle1, fled: fled }));
  gotoMap(gE, 'lake-of-rage', 13, 16);
  var inBattle2 = drainToBattle(gE);
  var threw = inBattle2 && attemptBall(gE, 'masterball');
  pump(gE);
  ok('E09 the encounter RE-FIRES after the flee, and the catch resolves it once: caught in the dex, red_gyarados_done + lance_met from the aftermath',
    inBattle2 && threw && stE.story.flags.red_gyarados_done === true && stE.story.flags.lance_met === true
    && !!stE.dex.caught[SPECIES.gyarados.dexNo],
    JSON.stringify({ threw: threw, done: stE.story.flags.red_gyarados_done }));
  gotoMap(gE, 'lake-of-rage', 13, 16);
  ok('E10 after resolution the lake is quiet: the Red Gyarados never re-fires',
    !gE.ui.dialogueOpen && !(gE.scenes.top instanceof BattleScene));

  // ---- Hideout -> Pryce ----
  strongTeam(gE, 178);
  var owLM = gotoMap(gE, 'mahogany', 14, 10);
  talkKind(gE, owLM, 'lance_mahogany'); pump(gE, 600);
  ok('E11 the Rocket Hideout gauntlet (grunts + Electrode core + Executive Vey) clears from Lance’s descent: johto_hideout_cleared',
    stE.story.flags.johto_hideout_cleared === true
    && stE.story.flags.beat_rocket_hideout_1 === true && stE.story.flags.beat_rocket_hideout_exec === true,
    JSON.stringify({ cleared: stE.story.flags.johto_hideout_cleared }));
  var owP = gotoMap(gE, 'gym-mahogany', 7, 8);
  talkKind(gE, owP, 'pryce'); pump(gE);
  ok('E12 Pryce through the real leader runner once the occupation ends: Glacier Badge — 7/8',
    stE.badges.johto.includes('glacierbadge') && stE.story.flags.badge_glacier === true && stE.badges.johto.length === 7,
    JSON.stringify(stE.badges.johto));

  // ---- Radio Tower (staged after the hideout) ----
  strongTeam(gE, 190);
  gotoMap(gE, 'radio-tower-1', 8, 10); pump(gE);
  ok('E13 the takeover fires on the tower AFTER the hideout: floor 1 cleared, broadcast seized (radio_takeover_active)',
    stE.story.flags.radio_f1_cleared === true && stE.story.flags.radio_takeover_active === true);
  gotoMap(gE, 'radio-tower-2', 15, 9); pump(gE);
  ok('E14 the locked floor stops the climb and points underground (radio_locked_seen; no f2 clear, no key yet)',
    stE.story.flags.radio_locked_seen === true && !stE.story.flags.radio_f2_cleared && !stE.story.flags.radio_director_rescued);
  gotoMap(gE, 'goldenrod-underground-2', 19, 9); pump(gE);
  ok('E15 the real Director is rescued in the Underground and hands over the Card Key',
    stE.story.flags.radio_director_rescued === true && (stE.bag.cardkey || 0) >= 1);
  gotoMap(gE, 'radio-tower-2', 15, 9); pump(gE);
  ok('E16 with the key, floor 2’s gauntlet runs and clears (radio_f2_cleared)',
    stE.story.flags.radio_f2_cleared === true);
  gotoMap(gE, 'radio-tower-3', 2, 9); pump(gE);
  ok('E17 the fake Director falls on the top floor: Rocket leaves Johto (radio_tower_cleared)',
    stE.story.flags.radio_tower_cleared === true && stE.story.flags.beat_rocket_director_fake === true);

  // ---- Clair + the Den: 7 after the gym, 8 after the den ----
  var owCL = gotoMap(gE, 'gym-blackthorn', 7, 8);
  talkKind(gE, owCL, 'clair'); pump(gE);
  var afterGym = stE.badges.johto.length;
  ok('E18 Clair beaten in the gym — and the badge count is STILL 7 (clair_beaten set, badge_rising NOT set, no risingbadge held)',
    stE.story.flags.clair_beaten === true && afterGym === 7 && !stE.story.flags.badge_rising && !stE.badges.johto.includes('risingbadge'),
    JSON.stringify({ afterGym: afterGym }));
  var owDE = gotoMap(gE, 'dragons-den', 9, 12);
  talkKind(gE, owDE, 'den_elder'); pump(gE, 600);
  ok('E19 the Dragon’s Den test (the elder’s questions + the shrine battle) awards the Rising Badge AT THE DEN: 8/8 in earn order',
    stE.badges.johto.length === 8 && stE.badges.johto[7] === 'risingbadge' && stE.story.flags.badge_rising === true
    && stE.story.flags.den_test_done === true,
    JSON.stringify(stE.badges.johto));

  // ---- the road north: Silver's third clash ----
  strongTeam(gE, 198);
  gotoMap(gE, 'route-silver', 1, 8); pump(gE, 600);
  ok('E20 Silver, third clash, past the (now-open) badge gate: the rivalry closes — silver_route_done with an honest branch flag',
    stE.story.flags.silver_route_done === true
    && (!!stE.story.flags.silver_route_won !== !!stE.story.flags.silver_route_lost),
    JSON.stringify({ won: stE.story.flags.silver_route_won, lost: stE.story.flags.silver_route_lost }));

  // ---- an east Town Tale on the same save ----
  var owO = gotoMap(gE, 'olivine', 16, 15);
  talk(gE, owO, 'LIGHTKEEPER ADA'); pump(gE);
  var taleAcc = stE.story.quests.tale_olivine === 'active';
  talk(gE, owO, 'SAILOR JOSS'); pump(gE);
  talk(gE, owO, 'LIGHTKEEPER ADA'); pump(gE);
  ok('E21 Town Tale (Olivine): accept -> stage -> finish completes tale_olivine through the shipped tale machine',
    taleAcc && stE.story.quests.tale_olivine === 'complete',
    JSON.stringify({ acc: taleAcc, q: stE.story.quests.tale_olivine }));

  // ---- THE SILVER CONFERENCE ----
  var owS1 = gotoMap(gE, 'silver-stadium', 11, 14);
  talkKind(gE, owS1, 'conference'); pump(gE);
  var registered = stE.story.flags.conference_registered === true;
  talkKind(gE, owS1, 'conference'); pump(gE);
  var q1 = stE.story.flags.beat_conference_q1 === true;
  talkKind(gE, owS1, 'conference'); pump(gE);
  ok('E22 the Conference: registration, then both qualifiers on the real battle path',
    registered && q1 && stE.story.flags.beat_conference_q2 === true,
    JSON.stringify({ reg: registered, q1: q1, q2: stE.story.flags.beat_conference_q2 }));
  strongTeam(gE, 200);
  talkKind(gE, owS1, 'gary_stadium'); pump(gE, 800);
  ok('E23 THE GARY BATTLE: won on the real battle path — beat_gary_johto (Blastoise faced and beaten)',
    stE.story.flags.beat_gary_johto === true,
    JSON.stringify({ beat: stE.story.flags.beat_gary_johto }));
  talkKind(gE, owS1, 'harrison'); pump(gE, 800);
  ok('E24 the Harrison quarter-final is FACED and decided (branch flag recorded), and johto_complete is set',
    stE.story.flags.harrison_faced === true && stE.story.flags.johto_complete === true
    && (!!stE.story.flags.harrison_won !== !!stE.story.flags.harrison_lost),
    JSON.stringify({ won: stE.story.flags.harrison_won, lost: stE.story.flags.harrison_lost }));
  ok('E25 the Foundation machine fired on ITS OWN flow: ARC COMPLETE card played, regionsDone gained johto from the machine, the Hoenn directive is pinned (arc_directive hoenn), arc itself unadvanced until the homecoming',
    stE.story.flags.arc_card_johto === true && stE.story.regionsDone.includes('johto')
    && stE.story.arc_directive === 'hoenn' && stE.story.arc === 'johto',
    JSON.stringify({ card: stE.story.flags.arc_card_johto, done: stE.story.regionsDone, dir: stE.story.arc_directive }));

  gotoMap(gE, 'house-pallet-ash', 4, 6); pump(gE);
  ok('E26 Homecoming #3: Hawthorn’s Hoenn hook is delivered by the ritual, the directive clears, Arc 3 stays SEALED (arc stays johto, no embark flag) and no state dangles',
    stE.story.flags.hook_hoenn === true && stE.story.arc_directive === null
    && stE.story.arc === 'johto' && !stE.story.flags.embark_hoenn,
    JSON.stringify({ hook: stE.story.flags.hook_hoenn, arc: stE.story.arc }));

  // ---- Red, post-completion ----
  var redTries = 0;
  while (!stE.story.flags.red_defeated && redTries < 3) {
    redTries++;
    strongTeam(gE, 200);
    var owR = gotoMap(gE, 'mt-silver-cave', 8, 10);
    talkKind(gE, owR, 'red'); pump(gE, 900);
  }
  ok('E27 Red on the Mt. Silver dais: beaten post-completion (red_defeated) — an honours row, a gate on nothing',
    stE.story.flags.red_defeated === true, 'tries=' + redTries);
  gE.openQuestLog();
  var eLabels = gE.ui.menu.items.map(function (i) { return i.label; });
  var redRow = eLabels.find(function (l) { return l.includes('silent trainer'); });
  ok('E28 Quest Log renders the Johto east rows; the Red row reads complete after the dais',
    eLabels.some(function (l) { return l.includes('JOHTO'); }) && !!redRow && redRow.indexOf('★') === 0,
    eLabels.filter(function (l) { return l.includes('Badge') || l.includes('JOHTO'); }).length + ' rows');
  globalThis.__J4EASTSAVE__ = JSON.parse(JSON.stringify(stE));

  // ================= J4b branch drives =================
  // Cianwood-first order: potion + Storm BEFORE ever asking Jasmine.
  var g5 = mkGame(406); boot(g5); strongTeam(g5, 170);
  var st5 = westComplete(g5);
  var ow5a = gotoMap(g5, 'house-cianwood', 6, 8);
  talkKind(g5, ow5a, 'pharmacist'); pump(g5);
  var ow5b = gotoMap(g5, 'gym-cianwood', 7, 8);
  talkKind(g5, ow5b, 'chuck'); pump(g5);
  var ow5c = gotoMap(g5, 'lighthouse-2', 13, 9);
  talkKind(g5, ow5c, 'jasmine_light'); pump(g5);
  var ow5d = gotoMap(g5, 'gym-olivine', 7, 8);
  talkKind(g5, ow5d, 'jasmine'); pump(g5);
  ok('E29 either-order proof (Cianwood first): the pharmacy serves a trainer who never asked Jasmine, Storm lands 5th, the delivery still heals Amphy, and Jasmine battles on the delivery alone — Mineral 6th, prefix intact',
    st5.story.flags.badge_storm === true && st5.story.flags.amphy_healed === true && !st5.story.flags.jasmine_asked
    && JSON.stringify(st5.badges.johto) === JSON.stringify(['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge']),
    JSON.stringify(st5.badges.johto));

  // The badge gate turns a 7-badge player back to Blackthorn.
  var g6 = mkGame(407); boot(g6); strongTeam(g6, 170);
  var st6 = westComplete(g6);
  st6.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge', 'glacierbadge'];
  var ow6 = gotoMap(g6, 'route-silver', 1, 8); pump(g6);
  ok('E30 the route-silver badge gate: a 7-badge player is turned back to Blackthorn with directions (never stuck, no silver clash, pass re-enterable later)',
    ow6.mapId === 'blackthorn' && !st6.story.flags.silver_route_done,
    'map=' + ow6.mapId);

  // Gary must-win: losing leaves him unbeaten and re-challengeable.
  var g7 = mkGame(408); boot(g7);
  var st7 = westComplete(g7);
  st7.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge', 'glacierbadge', 'risingbadge'];
  st7.story.flags.conference_registered = true;
  st7.story.flags.beat_conference_q1 = true; st7.story.flags.beat_conference_q2 = true;
  g7.state.party = [makeMon('rattata', 5, SPECIES, MOVES)];
  var ow7a = gotoMap(g7, 'silver-stadium', 11, 14);
  talkKind(g7, ow7a, 'gary_stadium'); pump(g7, 800);
  var garyUnbeaten = st7.story.flags.beat_gary_johto !== true;
  strongTeam(g7, 200);
  var ow7b = gotoMap(g7, 'silver-stadium', 11, 14);
  talkKind(g7, ow7b, 'gary_stadium'); pump(g7, 800);
  ok('E31 Gary is a REAL must-win: a loss leaves beat_gary_johto unset (blackout, no advance), and the re-challenge after healing wins it — no soft-lock',
    garyUnbeaten && st7.story.flags.beat_gary_johto === true,
    JSON.stringify({ unbeaten: garyUnbeaten, beat: st7.story.flags.beat_gary_johto }));

  // Harrison LOSS branch: the canon quarter-final loss still
  // completes the arc, with honours (FACED is the predicate).
  var g8 = mkGame(409); boot(g8);
  var st8 = westComplete(g8);
  st8.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge', 'glacierbadge', 'risingbadge'];
  st8.story.flags.conference_registered = true; st8.story.flags.beat_gary_johto = true;
  g8.state.party = [makeMon('rattata', 5, SPECIES, MOVES)];
  var ow8 = gotoMap(g8, 'silver-stadium', 11, 14);
  talkKind(g8, ow8, 'harrison'); pump(g8, 800);
  ok('E32 Harrison LOSS branch: harrison_lost (not won), the loss stands with honours, and the machine still completes Johto (johto_complete + regionsDone + hoenn directive, no blackout — the player is still in the stadium)',
    st8.story.flags.harrison_lost === true && !st8.story.flags.harrison_won
    && st8.story.flags.johto_complete === true && st8.story.regionsDone.includes('johto')
    && st8.story.arc_directive === 'hoenn' && ow8.mapId === 'silver-stadium',
    JSON.stringify({ lost: st8.story.flags.harrison_lost, done: st8.story.regionsDone }));

  // Red is gated on johto_complete: before it, silence and no battle.
  var g9 = mkGame(410); boot(g9); strongTeam(g9, 200);
  var st9 = westComplete(g9);
  var ow9 = gotoMap(g9, 'mt-silver-cave', 8, 10);
  seenLines = [];
  talkKind(g9, ow9, 'red'); pump(g9);
  ok('E33 Red’s gate: without johto_complete he offers only "..." — no battle starts, nothing is set',
    !(g9.scenes.top instanceof BattleScene) && !st9.story.flags.red_defeated && seenLines.join(' ').includes('...'),
    seenLines.join(' | ').slice(0, 60));

  // Silver Ilex, LOST-branch staging (Route 30 was a loss in J4a's save).
  var g10 = mkGame(411); boot(g10); strongTeam(g10, 165);
  var st10 = westComplete(g10);
  st10.story.flags.silver_r30_won = false; st10.story.flags.silver_r30_lost = true;
  seenLines = [];
  gotoMap(g10, 'ilex-forest', 26, 9); pump(g10);
  ok('E34 Silver Ilex branches on the J4a flag: with silver_r30_lost the LOST staging plays (his "practice partner" lines) and the clash still completes',
    seenLines.join(' | ').includes('practice partner') && st10.story.flags.silver_ilex_done === true,
    seenLines.join(' | ').slice(0, 120));

  // Pryce is gated on the hideout (canon order).
  var g11 = mkGame(412); boot(g11); strongTeam(g11, 190);
  var st11 = westComplete(g11);
  var ow11 = gotoMap(g11, 'gym-mahogany', 7, 8);
  talkKind(g11, ow11, 'pryce'); pump(g11);
  ok('E35 Pryce’s gate: before the hideout clears he sends the challenger to Lance and the lake — no battle, no Glacier Badge',
    !st11.badges.johto.includes('glacierbadge') && !(g11.scenes.top instanceof BattleScene));

  // The Radio Tower is quiet before the hideout (staging order).
  var g12 = mkGame(413); boot(g12); strongTeam(g12, 190);
  var st12 = westComplete(g12);
  gotoMap(g12, 'radio-tower-1', 8, 10); pump(g12);
  ok('E36 staging order: with the hideout uncleared, the Radio Tower is QUIET — no takeover, no battle (the takeover is post-hideout only)',
    !st12.story.flags.radio_takeover_active && !g12.ui.dialogueOpen && !(g12.scenes.top instanceof BattleScene));

  // ================= Stage J5: legendary arcs + badge gate + hideout =================
  function legendGame(seed) {
    var gg = mkGame(seed); boot(gg); strongTeam(gg, 200);
    var ss = westComplete(gg);
    ss.bag.masterball = 99;
    return [gg, ss];
  }
  function catchWithBall(g) {
    var n = 0;
    while ((g.scenes.top instanceof BattleScene) && n++ < 4) { attemptBall(g, 'masterball'); }
    pump(g);
    return !(g.scenes.top instanceof BattleScene);
  }
  function healParty(g) { g.state.party.forEach(function (m) { m.hp = m.maxHp; m.status = null; }); }

  // F01: the glimpse fires once on r29 (johto arc active, pre-history).
  {
    var [gF1, stF1] = legendGame(501);
    seenLines = [];
    gotoMap(gF1, 'r29', 12, 8); pump(gF1);
    var glimpsedOnce = stF1.story.flags.hooh_glimpsed === true && stF1.story.quests.arc_hooh === 'discovered'
      && seenLines.join(' ').includes('crosses the sun');
    seenLines = [];
    gotoMap(gF1, 'r29', 12, 8); pump(gF1);
    ok('F01 the Ho-Oh glimpse: fires on first r29 entry in the Johto arc (dialogue-only, sets hooh_glimpsed + arc discovered) and NEVER twice',
      glimpsedOnce && !seenLines.join(' ').includes('crosses the sun') && !(gF1.scenes.top instanceof BattleScene),
      seenLines.join(' | ').slice(0, 80));
  }

  // F02: beasts stay dormant before the awakening / before the signs.
  {
    var [gF2, stF2] = legendGame(502);
    stF2.story.flags.beasts_awakened = false;
    var owF2 = gotoMap(gF2, 'r35', 15, 8); pump(gF2);
    talkKind(gF2, owF2, 'beast_sign_raikou_1'); pump(gF2);
    var dormantOk = !stF2.story.flags.arc_raikou_sign1;
    stF2.story.flags.beasts_awakened = true;
    gotoMap(gF2, 'national-park', 15, 14); pump(gF2);
    ok('F02 beast arcs arm only after beasts_awakened and only after the chase: the witness files no report before the awakening, and the park holds no face before the signs',
      dormantOk && !(gF2.scenes.top instanceof BattleScene) && !stF2.story.flags.arc_raikou_done);
  }

  // F03+F04: Raikou's chase order, then flee / KO re-fire, catch completes.
  {
    var [gF3, stF3] = legendGame(503);
    stF3.story.quests.arc_raikou = 'discovered'; // the Burned Tower staging (J4a event writes this)
    var owF3a = gotoMap(gF3, 'r36', 20, 8); pump(gF3);
    talkKind(gF3, owF3a, 'beast_sign_raikou_2'); pump(gF3);
    var outOfOrder = !stF3.story.flags.arc_raikou_sign2;
    var owF3b = gotoMap(gF3, 'r35', 15, 8); pump(gF3);
    talkKind(gF3, owF3b, 'beast_sign_raikou_1'); pump(gF3);
    var owF3c = gotoMap(gF3, 'r36', 20, 8); pump(gF3);
    talkKind(gF3, owF3c, 'beast_sign_raikou_2'); pump(gF3);
    ok('F03 Raikou chase order: the second witness points you back to the first (no flag out of order); the signs set in order and the arc goes active',
      outOfOrder && stF3.story.flags.arc_raikou_sign1 === true && stF3.story.flags.arc_raikou_sign2 === true
      && stF3.story.quests.arc_raikou === 'active');
    gotoMap(gF3, 'national-park', 15, 14);
    var met1 = drainToBattle(gF3);
    var foeOk = met1 && gF3.scenes.top.foe && gF3.scenes.top.foe.speciesId === 'raikou' && gF3.scenes.top.foe.level === 178;
    driveFlee(gF3); pump(gF3);
    var fledOk = foeOk && !stF3.story.flags.arc_raikou_done && stF3.story.quests.arc_raikou !== 'complete' && !stF3.dex.caught[SPECIES.raikou.dexNo];
    healParty(gF3);
    gotoMap(gF3, 'national-park', 15, 14);
    var met2 = drainToBattle(gF3);
    driveBattle(gF3); pump(gF3); // a KO, not a catch
    var koOk = met2 && !stF3.story.flags.arc_raikou_done && !stF3.story.flags.ev_johto_raikou_done && !stF3.dex.caught[SPECIES.raikou.dexNo];
    healParty(gF3);
    gotoMap(gF3, 'national-park', 15, 14);
    var met3 = drainToBattle(gF3);
    catchWithBall(gF3);
    ok('F04 Raikou face (Lv 178, National Park storm field): flee re-fires, KO re-fires (a one-of-one never dex-locks), the CATCH completes the arc + quest state',
      fledOk && koOk && met3 && stF3.story.flags.arc_raikou_done === true && stF3.story.quests.arc_raikou === 'complete'
      && !!stF3.dex.caught[SPECIES.raikou.dexNo]);
  }

  // F05: Entei's chase + face (flee, then catch) in Mt. Mortar's deep chamber.
  {
    var [gF5, stF5] = legendGame(505);
    stF5.story.quests.arc_entei = 'discovered';
    var owF5a = gotoMap(gF5, 'burned-tower-1', 5, 10); pump(gF5);
    talkKind(gF5, owF5a, 'beast_sign_entei_1'); pump(gF5);
    var owF5b = gotoMap(gF5, 'mt-mortar-1', 15, 7); pump(gF5);
    talkKind(gF5, owF5b, 'beast_sign_entei_2'); pump(gF5);
    gotoMap(gF5, 'mt-mortar-2', 17, 11);
    var metE = drainToBattle(gF5);
    var foeE = metE && gF5.scenes.top.foe && gF5.scenes.top.foe.speciesId === 'entei' && gF5.scenes.top.foe.level === 180;
    driveFlee(gF5); pump(gF5);
    var fledE = foeE && !stF5.story.flags.arc_entei_done;
    healParty(gF5);
    gotoMap(gF5, 'mt-mortar-2', 17, 11);
    var metE2 = drainToBattle(gF5);
    catchWithBall(gF5);
    ok('F05 Entei face (Lv 180, Mt. Mortar deep chamber): signs in order arm it, flee re-fires, the catch completes the arc',
      stF5.story.flags.arc_entei_sign1 === true && stF5.story.flags.arc_entei_sign2 === true && fledE && metE2
      && stF5.story.flags.arc_entei_done === true && stF5.story.quests.arc_entei === 'complete');
  }

  // F06: Suicune waits for its kin.
  {
    var [gF6, stF6] = legendGame(506);
    stF6.story.quests.arc_suicune = 'discovered';
    var owF6a = gotoMap(gF6, 'ecruteak', 22, 8); pump(gF6);
    talkKind(gF6, owF6a, 'beast_sign_suicune_1'); pump(gF6);
    var owF6b = gotoMap(gF6, 'cianwood', 22, 7); pump(gF6);
    talkKind(gF6, owF6b, 'beast_sign_suicune_2'); pump(gF6);
    gotoMap(gF6, 'bell-tower-1', 8, 10); pump(gF6);
    var tooSoon = !(gF6.scenes.top instanceof BattleScene) && !stF6.story.flags.arc_suicune_done;
    stF6.story.flags.arc_raikou_done = true; stF6.story.flags.arc_entei_done = true; // F04/F05 prove the catches; the gate reads the flags
    gotoMap(gF6, 'bell-tower-1', 8, 10);
    var metS = drainToBattle(gF6);
    var foeS = metS && gF6.scenes.top.foe && gF6.scenes.top.foe.speciesId === 'suicune' && gF6.scenes.top.foe.level === 184;
    catchWithBall(gF6);
    ok('F06 Suicune face (Lv 184, the Bell Tower foot): signs through Ecruteak + Cianwood north shore, but NO face while Raikou/Entei are unquieted — then the catch completes',
      stF6.story.flags.arc_suicune_sign1 === true && stF6.story.flags.arc_suicune_sign2 === true && tooSoon && foeS
      && stF6.story.flags.arc_suicune_done === true && stF6.story.quests.arc_suicune === 'complete');
  }

  // F07: Ho-Oh's lock chain: history -> (beasts) -> bell -> summit.
  {
    var [gF7, stF7] = legendGame(507);
    var owF7a = gotoMap(gF7, 'dance-theater', 9, 10); pump(gF7);
    talkKind(gF7, owF7a, 'kimono_bell'); pump(gF7);
    var noBellEarly = !stF7.bag.clearbell && !stF7.story.flags.hooh_bell_received;
    var owF7b = gotoMap(gF7, 'ecruteak', 18, 7); pump(gF7);
    talkKind(gF7, owF7b, 'hooh_elder'); pump(gF7);
    var histOk = stF7.story.flags.hooh_history === true;
    gotoMap(gF7, 'bell-tower-2', 8, 9); pump(gF7);
    var summitQuiet = !(gF7.scenes.top instanceof BattleScene);
    talkKind(gF7, owF7a, 'kimono_bell'); pump(gF7);
    var noBellBeasts = !stF7.bag.clearbell;
    stF7.story.flags.arc_raikou_done = true; stF7.story.flags.arc_entei_done = true; stF7.story.flags.arc_suicune_done = true;
    var owF7c = gotoMap(gF7, 'dance-theater', 9, 10); pump(gF7);
    talkKind(gF7, owF7c, 'kimono_bell'); pump(gF7);
    var bellOk = (stF7.bag.clearbell || 0) >= 1 && stF7.story.flags.hooh_bell_received === true && stF7.story.quests.arc_hooh === 'active';
    gotoMap(gF7, 'bell-tower-2', 8, 9);
    var metH = drainToBattle(gF7);
    var foeH = metH && gF7.scenes.top.foe && gF7.scenes.top.foe.speciesId === 'hooh' && gF7.scenes.top.foe.level === 182;
    driveFlee(gF7); pump(gF7);
    var fledH = foeH && !stF7.story.flags.arc_hooh_done;
    healParty(gF7);
    gotoMap(gF7, 'bell-tower-2', 8, 9);
    var metH2 = drainToBattle(gF7);
    catchWithBall(gF7);
    ok('F07 Ho-Oh lock chain: no bell before the history, no bell before the beasts are quiet, no summit face without the bell — then flee re-fires and the catch (Lv 182) completes the arc',
      noBellEarly && histOk && summitQuiet && noBellBeasts && bellOk && fledH && metH2
      && stF7.story.flags.arc_hooh_done === true && stF7.story.quests.arc_hooh === 'complete' && stF7.story.flags.hooh_summit === true);
  }

  // F08: Celebi — locked until Kurt's return; the shrine; the memento.
  {
    var [gF8, stF8] = legendGame(508);
    stF8.story.flags.silver_ilex_done = true; // the forest's other appointment, kept elsewhere (E34)
    var owF8a = gotoMap(gF8, 'ilex-forest', 14, 5); pump(gF8);
    owF8a.player.tx = 14; owF8a.player.ty = 4; owF8a.player.dir = 'up';
    owF8a.tryInteract(); pump(gF8);
    var shrineLocked = !stF8.story.flags.celebi_shrine_opened && !(gF8.scenes.top instanceof BattleScene);
    var owF8b = gotoMap(gF8, 'kurt-house', 4, 6); pump(gF8);
    talkKind(gF8, owF8b, 'kurt'); pump(gF8);
    var returned = (stF8.bag.gsball || 0) === 1 && stF8.story.flags.gsball_back_with_player === true
      && !stF8.story.flags.kurt_has_ball && !stF8.story.flags.gsball_at_kurt_house && stF8.story.flags.gsball_delivered === true
      && stF8.story.quests.arc_celebi === 'discovered';
    var owF8c = gotoMap(gF8, 'ilex-forest', 14, 5); pump(gF8);
    owF8c.player.tx = 14; owF8c.player.ty = 4; owF8c.player.dir = 'up';
    owF8c.tryInteract();
    var metC = drainToBattle(gF8);
    var foeC = metC && gF8.scenes.top.foe && gF8.scenes.top.foe.speciesId === 'celebi' && gF8.scenes.top.foe.level === 170;
    driveFlee(gF8); pump(gF8);
    var fledC = foeC && !stF8.story.flags.arc_celebi_done;
    healParty(gF8);
    owF8c.player.tx = 14; owF8c.player.ty = 4; owF8c.player.dir = 'up';
    owF8c.tryInteract();
    var metC2 = drainToBattle(gF8);
    catchWithBall(gF8);
    ok('F08 Celebi: the shrine is inert until Kurt RETURNS the ball (whereabouts chain exact: delivered stands, kurt_has_ball / at_kurt_house clear, back_with_player set) — then the ball opens, flee re-fires, the catch (Lv 170) completes and the empty GS Ball stays in the bag',
      shrineLocked && returned && fledC && metC2 && stF8.story.flags.arc_celebi_done === true
      && stF8.story.quests.arc_celebi === 'complete' && (stF8.bag.gsball || 0) === 1 && stF8.story.flags.celebi_shrine_opened === true);
  }

  // F09: the Quest Log's own data join lists the live arcs.
  {
    var [gF9, stF9] = legendGame(509);
    stF9.story.flags.arc_raikou_done = true;
    stF9.story.quests.arc_raikou = 'complete'; stF9.story.quests.arc_hooh = 'active'; stF9.story.quests.arc_celebi = 'discovered';
    var logJoin = Object.keys(stF9.story.quests).filter(function (qid) { return qid.startsWith('arc_'); })
      .every(function (qid) { var a = LEGENDARY_ARCS[qid]; return a && a.title && Array.isArray(a.steps) && a.steps.length >= 3 && a.steps.every(function (s) { return typeof s.text === 'string'; }); });
    var allFive = ['arc_raikou', 'arc_entei', 'arc_suicune', 'arc_celebi', 'arc_hooh'].every(function (id) { return LEGENDARY_ARCS[id] && !LEGENDARY_ARCS[id].designedOnly; });
    gotoMap(gF9, 'newbark', 8, 8); pump(gF9);
    var logOpens = true;
    try { gF9.openQuestLog(); drain(gF9); } catch (e) { logOpens = false; }
    ok('F09 Quest Log listing (the shipped path: story.quests x merged LEGENDARY_ARCS): every started arc resolves to a live entry with actionable steps, all five Johto arcs are live in the merged table, and the log opens on the bundle',
      logJoin && allFive && logOpens);
  }

  // F10: the badge-order gate.
  {
    var [gG1, stG1] = legendGame(510);
    stG1.badges.johto = ['zephyrbadge', 'hivebadge'];
    var owG1 = gotoMap(gG1, 'gym-ecruteak', 7, 8); pump(gG1);
    seenLines = [];
    talkKind(gG1, owG1, 'morty'); pump(gG1);
    var mortyRefuses = !stG1.badges.johto.includes('fogbadge') && !(gG1.scenes.top instanceof BattleScene)
      && seenLines.join(' ').includes('Goldenrod City');
    stG1.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge'];
    talkKind(gG1, owG1, 'morty'); drain(gG1);
    var mortyMenu = gG1.ui.menuOpen === true;
    if (mortyMenu) { gG1.ui.debugChoose(0); }
    var metM = drainToBattle(gG1);
    driveBattle(gG1); pump(gG1);
    ok('F10a badge-order gate: Morty REFUSES at 2 badges, naming the missing road (Whitney, Goldenrod City) with no battle — and at 3 badges the challenge opens and the Fog Badge is earned',
      mortyRefuses && mortyMenu && metM && stG1.badges.johto.includes('fogbadge'));
  }
  {
    var [gG2, stG2] = legendGame(511);
    // westComplete holds 4 badges (through fog); Amphy is unhealed here.
    var owG2 = gotoMap(gG2, 'gym-olivine', 7, 8); pump(gG2);
    seenLines = [];
    talkKind(gG2, owG2, 'jasmine'); pump(gG2);
    var jasmineRefuses = !stG2.badges.johto.includes('mineralbadge') && !(gG2.scenes.top instanceof BattleScene)
      && seenLines.join(' ').includes('Cianwood City');
    stG2.badges.johto.push('stormbadge'); stG2.story.flags.badge_storm = true; stG2.story.flags.amphy_healed = true;
    talkKind(gG2, owG2, 'jasmine'); drain(gG2);
    var jasmineMenu = gG2.ui.menuOpen === true;
    if (jasmineMenu) { gG2.ui.debugChoose(0); }
    var metJ = drainToBattle(gG2);
    driveBattle(gG2); pump(gG2);
    ok('F10b badge-order gate: Jasmine refuses before Chuck (her line sends you to Cianwood’s gym) even though her errand gates are story-side — after the Storm Badge + Amphy healed, the Mineral Badge battle opens and is won',
      jasmineRefuses && jasmineMenu && metJ && stG2.badges.johto.includes('mineralbadge'));
  }
  {
    var [gG3, stG3] = legendGame(512);
    stG3.badges.johto = [];
    var owG3 = gotoMap(gG3, 'gym-violet', 7, 8); pump(gG3);
    talkKind(gG3, owG3, 'falkner'); drain(gG3);
    var falknerOpen = gG3.ui.menuOpen === true;
    if (falknerOpen) { gG3.ui.debugChoose(gG3.ui.menu.items.length - 1); drain(gG3); }
    stG3.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge'];
    var owG3b = gotoMap(gG3, 'gym-blackthorn', 7, 8); pump(gG3);
    seenLines = [];
    talkKind(gG3, owG3b, 'clair'); pump(gG3);
    var clairRefuses = !stG3.story.flags.clair_beaten && !(gG3.scenes.top instanceof BattleScene)
      && seenLines.join(' ').includes('Mahogany Town');
    stG3.badges.johto.push('glacierbadge'); stG3.story.flags.badge_glacier = true;
    talkKind(gG3, owG3b, 'clair'); drain(gG3);
    var clairMenu = gG3.ui.menuOpen === true;
    if (clairMenu) { gG3.ui.debugChoose(gG3.ui.menu.items.length - 1); drain(gG3); }
    ok('F10c badge-order gate: Falkner is open at 0 badges; Clair refuses at 6 (missing Glacier — Pryce, Mahogany Town) and offers her challenge at 7',
      falknerOpen && clairRefuses && clairMenu);
  }

  // F11: the hideout re-home — in through the shop stairs, cleared ON the map.
  {
    var [gH1, stH1] = legendGame(513);
    stH1.story.flags.red_gyarados_done = true;
    stH1.badges.johto = ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge'];
    var owH1 = gotoMap(gH1, 'mahogany', 18, 10); pump(gH1);
    talkKind(gH1, owH1, 'hideout_stairs'); pump(gH1, 900);
    ok('F11 hideout re-home: the Mahogany shop stairs (Shopkeeper Pell) take you down, the J4b gauntlet plays ON the rocket-hideout map, and johto_hideout_cleared lands exactly as before',
      stH1.story.position.map === 'rocket-hideout' && stH1.story.flags.johto_hideout_cleared === true
      && stH1.story.flags.ev_johto_hideout_done === true,
      'map=' + stH1.story.position.map + ' cleared=' + stH1.story.flags.johto_hideout_cleared);
  }

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

// The J4b east true-path save (8 badges, johto_complete, Red beaten)
// -> both validators, with the FULL Johto prefix (validator prefix
// order proof through the server validator).
{
  const s = globalThis.__J4EASTSAVE__;
  const rv = VAL.validateSave(clone(s));
  const cv = SCH.validateSave(clone(s));
  ok('B23 east true-path bundle save validates SERVER-side and client-side (full 8-badge Johto prefix + johto_complete + regionsDone johto)',
    !!s && rv.ok && cv.ok && JSON.stringify(s.badges.johto) === JSON.stringify(JOHTO_ORDER),
    JSON.stringify({ server: rv.errors, client: cv.errors }));
  const badEast = clone(s); badEast.badges.johto = ['zephyrbadge', 'risingbadge'];
  ok('B24 server validator rejects a non-prefix east set (rising without the middle) with bad-badge-order',
    VAL.validateSave(badEast).errors.includes('bad-badge-order'),
    JSON.stringify(VAL.validateSave(badEast).errors));
}

console.log('\nJOHTO STORY (J4a+J4b+J5) TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
