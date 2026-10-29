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
// file (the H4b precedent). S7 APPENDS the finale: Part A3 pure
// units (the generic registry trigger by grep + by machine drive,
// the finale data, the credits builder, the Master HoF contract,
// the capstone data) and Part B3/B4 in the bundle — the fixture
// walks home into the FINALE variant (echoes, entrusting, credits,
// Master HoF), rides the capstone to 493/493 + the Platinum
// Diploma, proves post-game integrity + NG+, and a Frontier-close
// CONTROL fixture proves the standard homecoming is untouched.
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
const ALL_MOVES_A = { ...(await import(join(ROOT, 'src/data/moves.mjs'))).MOVES, ...(await import(join(ROOT, 'src/data/moves2.mjs'))).MOVES2 };
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
  // Stage S5b appends the second half (the H4b precedent).
  ['q_sinnoh_wake', 'badge_fen'], ['q_sinnoh_valor', 'valor_glimpse'],
  ['q_sinnoh_hq', 'galactic_hq_done'], ['q_sinnoh_byron', 'badge_mine'],
  ['q_sinnoh_darkrai', 'darkrai_beat_done'], ['q_sinnoh_candice', 'badge_icicle'],
  ['q_sinnoh_acuity', 'paul_acuity_done'], ['q_sinnoh_rockclimb', 'rockclimb_received'],
  ['q_sinnoh_volkner', 'badge_beacon'], ['q_sinnoh_festival', 'dawn_grand_festival_done'],
  ['q_sinnoh_coronet', 'coronet_climb_done'], ['q_sinnoh_spear', 'spear_pillar_done'],
  ['q_sinnoh_distortion', 'sinnoh_climax_resolved'], ['q_sinnoh_conference', 'sinnoh_conference_registered'],
  ['q_sinnoh_paul_final', 'paul_conference_done'], ['q_sinnoh_tobias', 'sinnoh_complete'],
];
{
  ok('A01 SINNOH_QUESTS: the 30-row full chain (14 first-half + 16 appended by S5b — supersedes the S5a 14-row count), ids + completion flags in true-path order, flags unique, every row carrying text + hint',
    SINNOH_QUESTS.length === 30
    && CHAIN.every(([id, flag], i) => SINNOH_QUESTS[i].id === id && SINNOH_QUESTS[i].flag === flag
      && typeof SINNOH_QUESTS[i].text === 'string' && typeof SINNOH_QUESTS[i].hint === 'string')
    && new Set(SINNOH_QUESTS.map((q) => q.flag)).size === 30);
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
  ok('A12 every SINNOH_NPCS actor (' + SINNOH_NPCS.length + ') stands on a walkable tile with a reachable talk-adjacent tile (S5a: leaders, rosters, Rowan, Dawn x2, Barry, Paul x3, the commanders, Reggie; S5b supersedes the count 23 -> 41: +4 leaders, +8 rosters, Paul at Acuity, Dawn at Valor, the Canalave sailor, the Conference registrar + Paul + Tobias; S6 supersedes 41 -> 43: Buck at the Survival Area + Traveller Maren on Route 209)',
    SINNOH_NPCS.length === 43 && SINNOH_NPCS.every((n) => {
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
  const NEW_KS = ['dawnribbon', 'starshard', 'coalseamcharm', 'meadowcord', 'ruinbell', 'ribbonclasp', 'fencharm', 'shrinebell', 'frostpetal', 'beaconcoil'];
  const RESOLVED_KINDS = ['underdogDamage', 'matchupDamage', 'lowHpDamage', 'fasterFoeDamage', 'typeWard', 'firstHitWard', 'statusChance', 'healBoost', 'xpBoost', 'koSave', 'lowHpSpeed'];
  ok('A14 keepsakes: 22 total (12 + S5a\'s 6 + S5b\'s 4 — supersedes the S5a count; the Sinnoh arc total lands at 10); every new piece uses an EXISTING resolved kind (no new engine kind), is a price-less keepsakes-pocket ITEMS row, and is paid by exactly one Sinnoh tale',
    Object.keys(KEEPSAKES).length === 22
    && NEW_KS.every((id) => KEEPSAKES[id] && RESOLVED_KINDS.includes(KEEPSAKES[id].kind)
      && ITEMS[id] && ITEMS[id].pocket === 'keepsakes' && !ITEMS[id].price
      && Object.values(SINNOH_TALES).filter((t) => t.reward && t.reward.keepsake === id).length === 1));
  ok('A15 the thirteen Town Tales (nine first-half + S5b\'s Pastoria/Celestic/Snowpoint/Sunyshore — supersedes the S5a count): sinnohTale data-driven shape, 2 stages, valid rewards (keepsake in KEEPSAKES or items in ITEMS), offer/stage/finish lines present',
    Object.keys(SINNOH_TALES).length === 13 && Object.values(SINNOH_TALES).every((t) =>
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
  ok('A16b Grounds S5b (existing 15 only): gym signatures pastoria tide / canalave rubble / snowpoint frost / sunnyshore volt + landmarks galactic-hq volt, lake-valor tide, lake-acuity frost, spear-pillar spirit, and all six Distortion World floors grave — all resolve in GROUNDS',
    MAP_GROUND['gym-pastoria'] === 'tide' && MAP_GROUND['gym-canalave'] === 'rubble'
    && MAP_GROUND['gym-snowpoint'] === 'frost' && MAP_GROUND['gym-sunnyshore'] === 'volt'
    && MAP_GROUND['galactic-hq'] === 'volt' && MAP_GROUND['lake-valor'] === 'tide'
    && MAP_GROUND['lake-acuity'] === 'frost' && MAP_GROUND['spear-pillar'] === 'spirit'
    && ['distortion-entrance', 'distortion-depths', 'distortion-isles', 'distortion-falls', 'distortion-abyss', 'distortion-platform'].every((m) => MAP_GROUND[m] === 'grave' && GROUNDS[MAP_GROUND[m]])
    && Object.keys(GROUNDS).length === 15);
  ok('A17 TMs mirror H4a exactly: NO new TM rows — TM_MOVES is still the Gen-1 50 (named here so S5b inherits the answer)',
    Object.keys(TM_MOVES).length === 50);
}
{
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { checkOut = String(e.stdout || '') + String(e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A18 tables.json in sync (gen-tables --check, regenerated via the tool only); items 200 (199 + the Azure Flute key item, Arc 4 Stage S7 — supersedes the S6 count); the quest vocabulary carries every q_sinnoh_* chain id (all 30) + all thirteen tale ids; keepsakes table carries the ten Sinnoh pieces; items table carries the Lunar Wing',
    checkOut.includes('tables.json OK') && t.items.length === 200
    && SINNOH_QUESTS.every((q) => t.quests.includes(q.id))
    && Object.keys(SINNOH_TALES).every((id) => t.quests.includes(id))
    && ['dawnribbon', 'starshard', 'coalseamcharm', 'meadowcord', 'ruinbell', 'ribbonclasp', 'fencharm', 'shrinebell', 'frostpetal', 'beaconcoil'].every((id) => t.keepsakes.includes(id))
    && t.items.includes('lunarwing'),
    checkOut.slice(0, 160));
  const order = readFileSync(join(ROOT, 'scripts/module-order.json'), 'utf8');
  ok('A19 wiring: module-order loads story-sinnoh after story-hoenn and before quests/merge; merge folds SINNOH_TRAINERS/EVENTS/TALES; the Quest Log has a SINNOH section (sq: rows) and the HUD objective a sinnoh branch',
    order.indexOf('story-hoenn') < order.indexOf('story-sinnoh') && order.indexOf('story-sinnoh') < order.indexOf('"src/data/quests.mjs"')
    && readFileSync(join(ROOT, 'src/data/merge.mjs'), 'utf8').includes('SINNOH_TRAINERS')
    && readFileSync(join(ROOT, 'src/game/main-systems.mjs'), 'utf8').includes("'sq:' + q.id")
    && owSysSrc.includes("currentArcOf(g.state).id === 'sinnoh'"));
}

// ================= Part A2: S5b pure units =================
{
  const leaders2 = [['wake', 'fenbadge', 355], ['byron', 'minebadge', 363], ['candice', 'iciclebadge', 374], ['volkner', 'beaconbadge', 386]];
  ok('A20 the four second-half leaders: badgeSet sinnoh, badges = BADGE_SETS.sinnoh[4..7] in Platinum order, ace levels 355/363/374/386 (in-band escalation), every team member in band 301-400 and a real species, ace keepsakes resolve',
    leaders2.every(([id, badge, ace], i) => {
      const t = SINNOH_TRAINERS[id];
      return t && t.badgeSet === 'sinnoh' && t.badge === badge && BADGE_SETS.sinnoh[i + 4] === badge
        && Math.max(...t.team.map((m) => m.level)) === ace
        && t.team.every((m) => m.level >= 301 && m.level <= 400 && speciesAll[m.species]
          && (!m.keepsake || KEEPSAKES[m.keepsake]));
    }));
  ok('A21 gym rosters, second half: two talk-to trainers per gym, levels below their leader\'s ace and in band, real species',
    ['wake_fisher1', 'wake_fisher2', 'byron_miner1', 'byron_miner2', 'candice_skier1', 'candice_skier2', 'volkner_tech1', 'volkner_tech2']
      .every((id) => { const t = SINNOH_TRAINERS[id]; return t && !t.badge && t.team.every((m) => m.level >= 301 && m.level <= 385 && speciesAll[m.species]); }));
  const pa = SINNOH_TRAINERS.paul_acuity, pc = SINNOH_TRAINERS.paul_conference;
  ok('A22 the Paul curve completes: the Acuity full battle is a true 6v6 at 378-384 (electivire ace 384, starshard), the Conference settlement a 6v6 at 392-398 with the ace at 398 (band-cap vicinity), strictly escalating over Acuity, no badge/badgeSet on either (rival battles, not leaders)',
    pa.team.length === 6 && pa.team.every((m) => m.level >= 378 && m.level <= 384)
    && pa.team[pa.team.length - 1].species === 'electivire' && pa.team[pa.team.length - 1].level === 384
    && pc.team.length === 6 && pc.team.every((m) => m.level >= 392 && m.level <= 398)
    && pc.team[pc.team.length - 1].species === 'electivire' && pc.team[pc.team.length - 1].level === 398
    && !pa.badge && !pc.badge && !pa.badgeSet && !pc.badgeSet
    && pa.team.concat(pc.team).every((m) => speciesAll[m.species]));
  const td = SINNOH_TRAINERS.tobias_darkrai, tl = SINNOH_TRAINERS.tobias_latios;
  // Stage S6 RIDER (pinned here, in the story suite, per the
  // coordinator allowance): both conference aces carry explicitly
  // authored move sets; every authored move is in its species' legal
  // in-table pool (band learnset ∪ TM list), and each ace carries
  // >= 2 damaging moves — closing the S5b honesty note (Darkrai's
  // learnset-only set had Quick Attack as its only damaging move).
  const poolOf = (sp, lvl) => {
    const e = speciesAll[sp];
    const pool = new Set();
    for (const [l0, ids] of Object.entries(e.learnset)) if (+l0 <= lvl) for (const id of [].concat(ids || [])) pool.add(id);
    for (const t of (e.tm || [])) if (TM_MOVES[t]) pool.add(TM_MOVES[t]);
    return pool;
  };
  const riderOk = (def, sp, lvl) => {
    const mv = def.team[0].moves || [];
    const pool = poolOf(sp, lvl);
    const damaging = mv.filter((id) => ALL_MOVES_A[id] && (ALL_MOVES_A[id].power || 0) > 0).length;
    return mv.length >= 2 && mv.every((id) => !!ALL_MOVES_A[id] && pool.has(id)) && damaging >= 2;
  };
  ok('A23 Tobias, per the coordinator ruling\'s data shape: Act 1 is Darkrai ALONE at 390 (authored beatable in-band); Act 2 is Latios ALONE at 392; neither carries a badge. S6 RIDER (pinned): both aces carry explicitly authored move sets, every move in the species\' legal in-table pool (band learnset + TM list), each with >= 2 damaging moves — Darkrai: hypnosis/dreameater/fireblast/hyperbeam; Latios: psychic/icebeam/thunderbolt/recover',
    td.team.length === 1 && td.team[0].species === 'darkrai' && td.team[0].level === 390 && !td.badge
    && tl.team.length === 1 && tl.team[0].species === 'latios' && tl.team[0].level === 392 && !tl.badge
    && riderOk(td, 'darkrai', 390) && riderOk(tl, 'latios', 392));
  const sat = SINNOH_TRAINERS.saturn_hq, csp = SINNOH_TRAINERS.cyrus_spear, cfi = SINNOH_TRAINERS.cyrus_final;
  ok('A24 Galactic second half + Cyrus: Saturn\'s raid team (toxicroak ace 358), Cyrus at Spear Pillar (weavile ace 388) and at the platform (weavile ace 392) — all in band with real species',
    Math.max(...sat.team.map((m) => m.level)) === 358 && sat.team[sat.team.length - 1].species === 'toxicroak'
    && Math.max(...csp.team.map((m) => m.level)) === 388 && csp.team[csp.team.length - 1].species === 'weavile'
    && Math.max(...cfi.team.map((m) => m.level)) === 392 && cfi.team[cfi.team.length - 1].species === 'weavile'
    && sat.team.concat(csp.team, cfi.team).every((m) => m.level >= 301 && m.level <= 400 && speciesAll[m.species]));
  const ev = SINNOH_EVENTS;
  const hasStep = (id, pred) => (ev[id] || []).some(pred);
  ok('A25 the eleven S5b entry events exist as plain step arrays and sysLoadMap gates every one by name on its trigger map (lake-valor / galactic-hq / fullmoon-island / floaroma / r217 / lake-acuity / lake-verity / celestic / mt-coronet-north / spear-pillar / distortion-platform)',
    ['ev_sinnoh_valor', 'ev_sinnoh_hq_raid', 'ev_sinnoh_fullmoon', 'ev_sinnoh_gracidea', 'ev_sinnoh_rockclimb', 'ev_sinnoh_acuity_glimpse', 'ev_sinnoh_verity_pressure', 'ev_sinnoh_zoroark', 'ev_sinnoh_coronet', 'ev_sinnoh_spear_pillar', 'ev_sinnoh_distortion_climax']
      .every((id) => Array.isArray(ev[id]) && owSysSrc.includes("runEvent('" + id + "')")));
  ok('A26 the HQ raid is a must-win battle step (saturn_hq -> galactic_hq_done); Spear Pillar is FACED (battleAny cyrus_spear with win/lose branch flags), sets spear_pillar_done, and WARPS into distortion-entrance; the platform climax is FACED (battleAny cyrus_final)',
    hasStep('ev_sinnoh_hq_raid', (x) => x.battle === 'saturn_hq')
    && hasStep('ev_sinnoh_hq_raid', (x) => x.flag === 'galactic_hq_done')
    && hasStep('ev_sinnoh_spear_pillar', (x) => x.battleAny && x.battleAny.trainer === 'cyrus_spear' && x.battleAny.winFlag === 'cyrus_spear_won' && x.battleAny.loseFlag === 'cyrus_spear_lost')
    && hasStep('ev_sinnoh_spear_pillar', (x) => x.flag === 'spear_pillar_done')
    && hasStep('ev_sinnoh_spear_pillar', (x) => x.warp && x.warp.map === 'distortion-entrance')
    && hasStep('ev_sinnoh_distortion_climax', (x) => x.battleAny && x.battleAny.trainer === 'cyrus_final'));
  ok('A27 THE CLIMAX FLAG: sinnoh_climax_resolved (this arc\'s climax_resolved-equivalent, the H4b idiom) is set ONLY by the Distortion World platform event — and in the same step block the freed titans\' S6 unlock flags stand (dialga_unlocked / palkia_unlocked / giratina_unlocked) beside cyrus_end_done + distortion_cleared; no other Sinnoh event sets any of them',
    hasStep('ev_sinnoh_distortion_climax', (x) => x.flag === 'sinnoh_climax_resolved')
    && ['dialga_unlocked', 'palkia_unlocked', 'giratina_unlocked', 'cyrus_end_done', 'distortion_cleared']
      .every((f) => hasStep('ev_sinnoh_distortion_climax', (x) => x.flag === f))
    && Object.entries(ev).every(([id, steps]) => id === 'ev_sinnoh_distortion_climax'
      || !steps.some((x) => x.flag === 'sinnoh_climax_resolved' || x.flag === 'dialga_unlocked' || x.flag === 'palkia_unlocked' || x.flag === 'giratina_unlocked')));
  ok('A28 the glimpse law holds across the second half: Valor/Acuity/Verity-pressure/Gracidea/Fullmoon/Zoroark stage NO battle, NO catch, NO gift-mon (Fullmoon\'s only give is the Lunar Wing item) — Azelf/Uxie/Mesprit/Shaymin/Cresselia glimpse flags set, Shaymin\'s + Darkrai\'s S6 flavour unlocks wired (shaymin_unlocked in the Gracidea event; the sailor handler owns darkrai_unlocked)',
    ['ev_sinnoh_valor', 'ev_sinnoh_acuity_glimpse', 'ev_sinnoh_verity_pressure', 'ev_sinnoh_gracidea', 'ev_sinnoh_fullmoon', 'ev_sinnoh_zoroark']
      .every((id) => !(ev[id] || []).some((x) => x.battle || x.battleAny || x.wildBattle || x.wildBattleCatch || x.giveMon || x.giftCapSafe))
    && hasStep('ev_sinnoh_valor', (x) => x.flag === 'azelf_glimpsed')
    && hasStep('ev_sinnoh_acuity_glimpse', (x) => x.flag === 'uxie_glimpse')
    && hasStep('ev_sinnoh_verity_pressure', (x) => x.flag === 'mesprit_glimpse')
    && hasStep('ev_sinnoh_gracidea', (x) => x.flag === 'shaymin_glimpsed') && hasStep('ev_sinnoh_gracidea', (x) => x.flag === 'shaymin_unlocked')
    && hasStep('ev_sinnoh_fullmoon', (x) => x.flag === 'cresselia_glimpsed')
    && hasStep('ev_sinnoh_fullmoon', (x) => x.give && x.give.items && x.give.items.lunarwing === 1)
    && ITEMS.lunarwing && ITEMS.lunarwing.pocket === 'key'
    && owSysSrc.includes('darkrai_unlocked'));
  ok('A29 the Rock Climb grant rides S4\'s data hook exactly like Defog: the Route 217 event carries { giveHM: \'rockclimb\' } and sets rockclimb_received (HM_GRANTS.rockclimb names Route 217 + the Icicle Badge)',
    hasStep('ev_sinnoh_rockclimb', (x) => x.giveHM === 'rockclimb')
    && hasStep('ev_sinnoh_rockclimb', (x) => x.flag === 'rockclimb_received'));
  ok('A30 the Zoroark special is honest about its medium: zorua/zoroark exist in NO shipped species table, and the scene stages no battle, catch, or gift — an illusion, and nothing else',
    !speciesAll.zoroark && !speciesAll.zorua
    && !(ev.ev_sinnoh_zoroark || []).some((x) => x.battle || x.battleAny || x.wildBattle || x.wildBattleCatch || x.give || x.giveMon)
    && hasStep('ev_sinnoh_zoroark', (x) => x.flag === 'zoroark_special_seen'));
  ok('A31 the S5b actor kinds are all present in SINNOH_NPCS (wake / byron / candice / volkner / paul_acuity / dawn_festival / sailor_eldric / sinnoh_conference / paul_conference / tobias) and the Conference floor stands in league-lobby',
    ['wake', 'byron', 'candice', 'volkner', 'paul_acuity', 'dawn_festival', 'sailor_eldric', 'sinnoh_conference', 'paul_conference', 'tobias']
      .every((k) => SINNOH_NPCS.some((n) => n.sinnoh === k))
    && ['sinnoh_conference', 'paul_conference', 'tobias'].every((k) => SINNOH_NPCS.some((n) => n.sinnoh === k && n.map === 'league-lobby')));
  ok('A32 the Tobias handler wiring matches the ruling in the shipped source: Act 1 rides startSinnohBattle(\'tobias_darkrai\') (the rechallenge idiom — not friendly, not faced) and its win callback sets tobias_darkrai_felled; sinnoh_complete is set exactly once in overworld-systems and immediately rides checkArcCompletion(g) (the machine fires — no hand-rolled ending, no regionsDone write in the handler)',
    owSysSrc.includes("startSinnohBattle('tobias_darkrai'")
    && owSysSrc.includes('flags.tobias_darkrai_felled = true')
    && (owSysSrc.match(/flags\.sinnoh_complete = true/g) || []).length === 1
    && owSysSrc.includes('checkArcCompletion(g)')
    && !owSysSrc.includes("regionsDone.push('sinnoh')") && !owSysSrc.includes('regionsDone.push("sinnoh")'));
}

// ================= Part A3: S7 pure units (THE FINALE) =================
const arcsGameSrc = readFileSync(join(ROOT, 'src/game/arcs.mjs'), 'utf8');
const arcsData = await import(join(ROOT, 'src/data/arcs.mjs'));
const { ARC_FINALE_ECHOES, FINALE_CREDITS_OPEN, FINALE_CREDITS_CLOSE, FINALE_END_CARD, FINALE_GRANT_ITEM_ID, FINALE_UNLOCK_FLAG, ARCS: REG_ARCS, arcById: regArcById } = arcsData;
const gameArcs = await import(join(ROOT, 'src/game/arcs.mjs'));
const SCH7 = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL7 = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { normalizeHofList, defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const { SINNOH_LEGENDARY_ARCS } = storyMod;
const { LEGENDARY_ARCS: DESIGNED_ARCS7 } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
{
  ok('A33 THE GENERIC TRIGGER (grep pin): the arc machine names NO region, NO capstone species and NO granted item anywhere in its source — the finale trigger is a pure registry read (successor playable = shipped|next; the finale branch keys on the successor row\u2019s future flag), and the unlock is written ONLY through the data-named flag (flags[FINALE_UNLOCK_FLAG])',
    !/sinnoh/i.test(arcsGameSrc) && !/arceus/i.test(arcsGameSrc) && !/azure/i.test(arcsGameSrc)
    && arcsGameSrc.includes("next.status === 'shipped'") && arcsGameSrc.includes('next.future')
    && arcsGameSrc.includes('story.flags[FINALE_UNLOCK_FLAG] = true')
    && !/flags\.arceus_unlocked\s*=/.test(arcsGameSrc));
  ok('A34 finale DATA completeness: one bond echo per shipped arc (exactly the six registry completion keys, each a real line); the grant names a real key-pocket ITEMS row; the unlock flag is the capstone flag; the end card carries the coordinator-approved line verbatim as its own line',
    JSON.stringify(Object.keys(ARC_FINALE_ECHOES).sort()) === JSON.stringify(['frontier', 'hoenn', 'johto', 'kanto', 'orange', 'sinnoh'])
    && Object.values(ARC_FINALE_ECHOES).every((l) => typeof l === 'string' && l.length > 40)
    && ITEMS[FINALE_GRANT_ITEM_ID] && ITEMS[FINALE_GRANT_ITEM_ID].pocket === 'key' && FINALE_GRANT_ITEM_ID === 'azureflute'
    && FINALE_UNLOCK_FLAG === 'arceus_unlocked'
    && FINALE_END_CARD.includes('Six journeys. Five leagues and a frontier. One road, walked whole.')
    && FINALE_CREDITS_OPEN.length >= 1 && FINALE_CREDITS_CLOSE.length >= 1);
  // finaleCreditsLines as a pure function over a fabricated full-road state.
  const fakeState = {
    story: { regionsDone: ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh'], flags: {} },
    dex: { caught: Object.fromEntries(Array.from({ length: 492 }, (_, i) => [i + 1, true])) },
    player: { playtimeSec: 360000 },
  };
  const creditLines = gameArcs.finaleCreditsLines(fakeState);
  ok('A35 finaleCreditsLines is registry-built: the frame opens it, one listing line per completed arc in regionsDone order (label + region + the arc\u2019s own league line, read from the registry — nothing typed twice), the road-so-far counts 6 journeys + 492/493, and the END CARD closes the sequence (approved line as the penultimate movement)',
    creditLines[0] === FINALE_CREDITS_OPEN[0]
    && ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh'].every((id, i) => {
      const a = regArcById(id);
      return creditLines[FINALE_CREDITS_OPEN.length + i] === a.label + ' · ' + a.region + ' — ' + a.summaryLines[0];
    })
    && creditLines.some((l) => l.includes('6 journeys complete') && l.includes('492/493'))
    && JSON.stringify(creditLines.slice(-FINALE_END_CARD.length)) === JSON.stringify(FINALE_END_CARD),
    creditLines.join(' | ').slice(0, 300));
  // The machine, driven purely with a recording ui: finale variant
  // (sealed-future successor) vs standard variant (shipped successor).
  const driveHomecoming = (mut) => {
    const said = [];
    const st = {
      story: { arc: 'sinnoh', region: 'sinnoh', arc_directive: 'unova', regionsDone: ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh'], flags: { sinnoh_complete: true }, hof: [], arcDexStart: 386, arcStartPlaytime: 0 },
      dex: { caught: Object.fromEntries(Array.from({ length: 492 }, (_, i) => [i + 1, true])) },
      badges: { kanto: [], orange: [], johto: [], hoenn: [], sinnoh: ['coalbadge', 'forestbadge', 'relicbadge', 'cobblebadge', 'fenbadge', 'minebadge', 'iciclebadge', 'beaconbadge'], symbols: [] },
      bag: {}, party: [{ speciesId: 'partner', level: 395, nickname: null }], player: { playtimeSec: 360000, name: 'ASH' },
    };
    if (mut) mut(st);
    const g = { state: st, ui: { say: (lines, cb) => { said.push(...lines); if (cb) cb(); } } };
    const fired = gameArcs.tryHomecoming(g);
    return { st, said, fired };
  };
  const fin = driveHomecoming(null);
  ok('A36 MACHINE (finale variant): a sealed-FUTURE successor plays the finale — echoes presented once per completed arc (6, in regionsDone order), the flute granted once, the unlock set, the Master HoF entry written (master flag, party snapshot), finale_done set, the sealed finish law kept (directive cleared, hook set, arc NOT advanced, NO embark), and the credits close on the end card',
    fin.fired === true
    && ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh'].every((id, i) => fin.said.some((l) => l === ARC_FINALE_ECHOES[id]))
    && fin.said.filter((l) => Object.values(ARC_FINALE_ECHOES).includes(l)).length === 6
    && fin.st.bag.azureflute === 1 && fin.st.story.flags.arceus_unlocked === true && fin.st.story.flags.finale_done === true
    && fin.st.story.hof.length === 1 && fin.st.story.hof[0].master === true && fin.st.story.hof[0].team.length === 1 && fin.st.story.hof[0].badges === 8
    && fin.st.story.arc_directive === null && fin.st.story.flags.hook_unova === true
    && fin.st.story.arc === 'sinnoh' && !fin.st.story.flags.embark_unova
    && fin.said[fin.said.length - 1] === FINALE_END_CARD[FINALE_END_CARD.length - 1]
    && fin.said.includes('Six journeys. Five leagues and a frontier. One road, walked whole.'),
    fin.said.join(' | ').slice(0, 200));
  const ctl = driveHomecoming((st) => {
    st.story.arc = 'frontier'; st.story.region = 'kanto'; st.story.arc_directive = 'sinnoh';
    st.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier'];
    st.story.flags = { frontier_complete: true };
  });
  ok('A37 MACHINE (control): a SHIPPED successor homecoming stays the STANDARD variant byte-for-byte in effect — the registry hook lines are delivered, the arc advances + embark arms + snapshots stamp, and there are NO finale side-effects (no echoes, no credits, no end card, no flute, no unlock, no Master entry, no finale flag)',
    ctl.fired === true
    && regArcById('sinnoh').hookLines.every((l) => ctl.said.includes(l))
    && ctl.st.story.arc === 'sinnoh' && ctl.st.story.region === 'sinnoh' && ctl.st.story.flags.embark_sinnoh === true && ctl.st.story.flags.hook_sinnoh === true
    && ctl.st.story.arc_directive === null && ctl.st.story.arcDexStart === 492
    && !ctl.st.story.flags.finale_done && !ctl.st.story.flags.arceus_unlocked && !(ctl.st.bag.azureflute > 0)
    && ctl.st.story.hof.length === 0
    && !ctl.said.some((l) => Object.values(ARC_FINALE_ECHOES).includes(l))
    && !ctl.said.includes('Six journeys. Five leagues and a frontier. One road, walked whole.'));
  const arc7 = SINNOH_LEGENDARY_ARCS.arc_arceus;
  const evArc = storyMod.SINNOH_EVENTS.ev_sinnoh_arceus, evStairs = storyMod.SINNOH_EVENTS.ev_sinnoh_arceus_stairs;
  const bi7 = (evArc || []).findIndex((s) => s.wildBattleCatch);
  ok('A38 the Arceus capstone data: the live arc\u2019s steps spell the requirements (finale flag -> the flute at Spear Pillar -> the stairs -> the catch), its lair is the shipped Hall of Origin map; the stairs event is dialogue-only and opens the stairs; the face rides the catch-only chain at band cap 400 with arc-complete + done flag strictly after; the story-kanto designed stub pre-registers the id for the validator vocabulary',
    !!arc7 && !arc7.designedOnly && arc7.prereq === 'arceus_unlocked' && arc7.lair === 'hall-of-origin' && !!ALL_MAPS['hall-of-origin']
    && arc7.steps.length === 3 && arc7.steps[0].flag === 'arceus_unlocked' && arc7.steps[1].flag === 'arceus_stairs_open'
    && arc7.steps[2].catch === 'arceus' && /Azure Flute/.test(arc7.steps[1].text) && /Spear Pillar/.test(arc7.steps[1].text) && /Hall of Origin/.test(arc7.steps[2].text)
    && Array.isArray(evStairs) && evStairs.every((s) => !s.wildBattleCatch && !s.battle && !s.battleAny) && evStairs.some((s) => s.flag === 'arceus_stairs_open')
    && bi7 >= 0 && evArc[bi7].wildBattleCatch.species === 'arceus' && evArc[bi7].wildBattleCatch.level === 400 && evArc[bi7].wildBattleCatch.legendary === true
    && evArc.slice(bi7 + 1).some((s) => s.arc === 'arc_arceus' && s.stage === 'complete') && evArc.slice(bi7 + 1).some((s) => s.flag === 'arc_arceus_done')
    && evArc.slice(0, bi7).some((s) => s.arc === 'arc_arceus' && s.stage === 'active')
    && !!DESIGNED_ARCS7.arc_arceus && DESIGNED_ARCS7.arc_arceus.designedOnly === true);
  ok('A39 the Master HoF contract (the full quintet treatment): the finale-driven save itself (flute in bag + the master-flagged HoF entry the machine wrote) validates client AND server; the client normalizer round-trips master: true (and drops a non-true master); a non-boolean master is rejected by BOTH validators',
    normalizeHofList([{ team: [{ speciesId: 'partner', level: 90, nickname: null }], badges: 8, master: true }], 400)[0].master === true
    && normalizeHofList([{ team: [{ speciesId: 'partner', level: 90, nickname: null }], badges: 8, master: 'yes' }], 400)[0].master === undefined
    && (() => { const s = defaultState(); s.story.arc = 'sinnoh'; s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh']; s.bag.azureflute = 1; s.story.hof = [{ team: [{ speciesId: 'partner', level: 395, nickname: null }], badges: 8, master: true }]; const c = JSON.parse(JSON.stringify(s)); return SCH7.validateSave(c).ok && VAL7.validateSave(JSON.parse(JSON.stringify(s))).ok; })()
    && (() => { const s = defaultState(); s.story.arc = 'sinnoh'; s.story.hof = [{ team: [{ speciesId: 'partner', level: 395, nickname: null }], badges: 8, master: 'yes' }]; return !SCH7.validateSave(JSON.parse(JSON.stringify(s))).ok && !VAL7.validateSave(JSON.parse(JSON.stringify(s))).ok; })(),
    'flute+master save must validate on both sides');
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
  ok('B25 the quest chain reads complete through the first half: every SINNOH_QUESTS flag of the first 14 stands set, in order (scoped to the first half — S5b supersedes the S5a all-rows read; the full 30-row read is B60 at the end of the fixture)',
    SINNOH_QUESTS.slice(0, 14).every(function (q) { return !!st.story.flags[q.flag]; }),
    SINNOH_QUESTS.slice(0, 14).filter(function (q) { return !st.story.flags[q.flag]; }).map(function (q) { return q.id; }).join(','));
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

  // ================= Part B2: the S5b true path =================
  // Continues the SAME fixture save (four badges, Paul audited).
  function gym2(mapId, kind, badge) {
    for (var att = 0; att < 4; att++) {
      healUp(g);
      var o = gotoMap(g, mapId, 7, 9); pump(g);
      var npc = talkKind(g, o, kind); pump(g, 1200);
      if ((st.badges.sinnoh || []).includes(badge)) return !!npc;
    }
    return false;
  }
  function runTale(mapId, giverName, stageName) {
    var o = gotoMap(g, mapId, 13, 12); pump(g);
    talkName(g, o, giverName); pump(g);
    talkName(g, o, stageName); pump(g);
    talkName(g, o, giverName); pump(g);
  }
  function weakTeam() {
    // A guaranteed wipe, honestly staged: a lone band-floor Starly
    // whose only move is Growl can never damage Darkrai or Latios
    // at all (Darkrai's band-local learnset would otherwise lose a
    // war of attrition to a healthy weak attacker — measured in
    // development, recorded in the register). The wipe is real:
    // the foe's own moves do all of it.
    var m = makeMon('starly', 301, SPECIES, MOVES);
    m.moves = [{ id: 'growl', pp: 40, maxPp: 40 }];
    st.party = [m];
  }
  // ===== Pastoria: the tale, then Wake =====
  runTale('pastoria', 'MARSH GUIDE SOLENNE', 'BOG KID MIRE');
  ok('B28 the Pastoria Town Tale runs end-to-end on the shipped tale machine: tale complete, the Fen Charm paid into the bag',
    st.story.quests.tale_sinnoh_pastoria === 'complete' && (st.bag.fencharm || 0) >= 1,
    'quest=' + st.story.quests.tale_sinnoh_pastoria + ' bag=' + (st.bag.fencharm || 0));
  ok('B29 Gym 5: Wake awards the Fen Badge in order', gym2('gym-pastoria', 'wake', 'fenbadge') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge,cobblebadge,fenbadge');
  // ===== Lake Valor: the explosion's aftermath =====
  ow = gotoMap(g, 'lake-valor', 20, 9); pump(g, 500);
  ok('B30 Lake Valor: the aftermath fires with the Fen Badge held (valor_glimpse + azelf_glimpsed — a glimpse and a taking: no battle was fought on the lake)',
    !!st.story.flags.valor_glimpse && !!st.story.flags.azelf_glimpsed && !(g.scenes.top instanceof BattleScene));
  // ===== the HQ raid: Saturn's door opens =====
  healUp(g);
  ow = gotoMap(g, 'galactic-hq', 9, 12); pump(g, 1200);
  ok('B31 the Veilstone HQ raid fires on entry with the Fen Badge held: Saturn beaten in a must-win battle (galactic_hq_done + beat_saturn_hq — the S5a door, opened)',
    !!st.story.flags.galactic_hq_done && !!st.story.flags.beat_saturn_hq);
  // ===== Byron =====
  ok('B32 Gym 6: Byron awards the Mine Badge in order', gym2('gym-canalave', 'byron', 'minebadge') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge,cobblebadge,fenbadge,minebadge');
  // ===== the Darkrai beat: plea -> Fullmoon -> the waking =====
  ow = gotoMap(g, 'canalave', 20, 10); pump(g);
  var eldric = talkKind(g, ow, 'sailor_eldric'); pump(g);
  ok('B33 the Darkrai beat opens: the sailor\\'s plea is taken (darkrai_beat_started — no wing yet, no waking)',
    !!eldric && !!st.story.flags.darkrai_beat_started && !st.story.flags.darkrai_beat_done && !st.story.flags.lunar_wing_received);
  ow = gotoMap(g, 'fullmoon-island', 18, 12); pump(g, 500);
  ok('B34 Fullmoon Island: Cresselia\\'s glimpse provides (cresselia_glimpsed + lunar_wing_received; the Lunar Wing rides in the bag\\'s key pocket)',
    !!st.story.flags.cresselia_glimpsed && !!st.story.flags.lunar_wing_received && (st.bag.lunarwing || 0) >= 1);
  ow = gotoMap(g, 'canalave', 20, 10); pump(g);
  talkKind(g, ow, 'sailor_eldric'); pump(g);
  ok('B35 the boy wakes: the beat completes at the sailor (darkrai_beat_done) and Darkrai\\'s S6 flavour unlock stands (darkrai_unlocked — the catch arc itself is S6\\'s, not staged here)',
    !!st.story.flags.darkrai_beat_done && !!st.story.flags.darkrai_unlocked);
  // ===== the Gracidea beat at Floaroma =====
  ow = gotoMap(g, 'floaroma', 13, 12); pump(g, 500);
  ok('B36 the Gracidea beat fires at Floaroma (gracidea_beat_done + shaymin_glimpsed + shaymin_unlocked — a glimpse and a promise: no battle, no catch)',
    !!st.story.flags.gracidea_beat_done && !!st.story.flags.shaymin_glimpsed && !!st.story.flags.shaymin_unlocked && !(g.scenes.top instanceof BattleScene));
  // ===== Candice, the Acuity midpoint, Rock Climb =====
  runTale('snowpoint', 'TEMPLE ACOLYTE REN', 'ICE FISHER SOLVI');
  ok('B37 the Snowpoint Town Tale runs end-to-end: tale complete, the Frost Petal paid',
    st.story.quests.tale_sinnoh_snowpoint === 'complete' && (st.bag.frostpetal || 0) >= 1,
    'quest=' + st.story.quests.tale_sinnoh_snowpoint);
  ok('B38 Gym 7: Candice awards the Icicle Badge in order', gym2('gym-snowpoint', 'candice', 'iciclebadge') && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge,cobblebadge,fenbadge,minebadge,iciclebadge');
  ow = gotoMap(g, 'lake-acuity', 14, 10); pump(g, 500);
  ok('B39 Lake Acuity: Uxie\\'s glimpse fires under Galactic pressure (uxie_glimpse — pressure and a shadow: no battle on the ice)',
    !!st.story.flags.uxie_glimpse && !(g.scenes.top instanceof BattleScene));
  healUp(g);
  var paulA = talkKind(g, ow, 'paul_acuity'); pump(g, 2000);
  ok('B40 THE ACUITY MIDPOINT: Paul\\'s full battle resolves FACED (paul_acuity_done + the honest branch flag — win or lose, the story continues; no progression gate reads the result)',
    !!paulA && !!st.story.flags.paul_acuity_done
    && (!!st.story.flags.paul_acuity_won || !!st.story.flags.paul_acuity_lost),
    'won=' + !!st.story.flags.paul_acuity_won + ' lost=' + !!st.story.flags.paul_acuity_lost);
  var hm07before = st.bag.hm07 || 0;
  ow = gotoMap(g, 'r217', 6, 10); pump(g, 500);
  ok('B41 Rock Climb claimed on Route 217 through S4\\'s giveHM hook (rockclimb_received; bag holds HM07 exactly once)',
    !!st.story.flags.rockclimb_received && (st.bag.hm07 || 0) === hm07before + (hm07before ? 0 : 1) && (st.bag.hm07 || 0) >= 1,
    'hm07=' + (st.bag.hm07 || 0));
  // ===== Volkner at full strength, the Festival, the last glimpses =====
  strongTeam(g, 395);
  runTale('sunnyshore', 'LIGHTHOUSE KEEPER BLY', 'PANEL TECH JUNIPER');
  ok('B42 the Sunyshore Town Tale runs end-to-end: tale complete, the Beacon Coil paid',
    st.story.quests.tale_sinnoh_sunnyshore === 'complete' && (st.bag.beaconcoil || 0) >= 1,
    'quest=' + st.story.quests.tale_sinnoh_sunnyshore);
  ok('B43 Gym 8: Volkner awards the Beacon Badge — badges.sinnoh is the full Platinum eight, in order',
    gym2('gym-sunnyshore', 'volkner', 'beaconbadge')
    && st.badges.sinnoh.join(',') === 'coalbadge,forestbadge,relicbadge,cobblebadge,fenbadge,minebadge,iciclebadge,beaconbadge');
  ow = gotoMap(g, 'lake-valor', 20, 9); pump(g);
  var dawnF = talkKind(g, ow, 'dawn_festival'); pump(g);
  ok('B44 Dawn\\'s co-spine concludes at the Grand Festival on Lake Valor (dawn_grand_festival_done + dawn_festival_ribbon — her arc resolves in the beat; the player\\'s own contest ladder is untouched by it)',
    !!dawnF && !!st.story.flags.dawn_grand_festival_done && !!st.story.flags.dawn_festival_ribbon);
  ow = gotoMap(g, 'lake-verity', 20, 9); pump(g, 500);
  ok('B45 Lake Verity under pressure: Mesprit slips the net (mesprit_glimpse — the third glimpse; the trio\\'s catch arcs remain S6\\'s)',
    !!st.story.flags.mesprit_glimpse && !(g.scenes.top instanceof BattleScene));
  ow = gotoMap(g, 'celestic', 13, 10); pump(g, 500);
  ok('B46 the Zoroark special: a one-scene illusion on Celestic\\'s shrine street (zoroark_special_seen — no battle, no species, no catch)',
    !!st.story.flags.zoroark_special_seen && !(g.scenes.top instanceof BattleScene));
  runTale('celestic', 'SHRINE ELDER UME', 'HISTORIAN BLYTHE');
  ok('B47 the Celestic Town Tale runs end-to-end: tale complete, the Shrine Bell paid',
    st.story.quests.tale_sinnoh_celestic === 'complete' && (st.bag.shrinebell || 0) >= 1,
    'quest=' + st.story.quests.tale_sinnoh_celestic);
  // ===== the Coronet climb + Spear Pillar + the Distortion World =====
  healUp(g);
  ow = gotoMap(g, 'mt-coronet-north', 13, 16); pump(g, 500);
  ok('B48 the Coronet climb beat fires in the north galleries (coronet_climb_done — the rearguard stands aside)',
    !!st.story.flags.coronet_climb_done);
  ow = gotoMap(g, 'spear-pillar', 13, 12); pump(g, 2500);
  ok('B49 SPEAR PILLAR: Cyrus is FACED over the chained gods (spear_pillar_done + the honest branch flag), the sky tears, and the scene warps the player into distortion-entrance',
    !!st.story.flags.spear_pillar_done
    && (!!st.story.flags.cyrus_spear_won || !!st.story.flags.cyrus_spear_lost)
    && st.story.position.map === 'distortion-entrance',
    'pos=' + st.story.position.map + ' won=' + !!st.story.flags.cyrus_spear_won + ' lost=' + !!st.story.flags.cyrus_spear_lost);
  var dwOk = true;
  for (var dwMap of ['distortion-depths', 'distortion-isles', 'distortion-falls', 'distortion-abyss']) {
    ow = gotoMap(g, dwMap, 11, 12); pump(g);
    if (st.story.position.map !== dwMap) dwOk = false;
  }
  ok('B50 the Distortion World traversal walks the S3b six-map chain (entrance -> depths -> isles -> falls -> abyss) with no soft lock', dwOk && st.story.position.map === 'distortion-abyss');
  healUp(g);
  ow = gotoMap(g, 'distortion-platform', 20, 10); pump(g, 2500);
  ok('B51 THE CLIMAX RESOLVES on Giratina\\'s platform: Cyrus FACED + ended (cyrus_end_done + distortion_cleared + a branch flag), sinnoh_climax_resolved stands, and the freed titans\\' S6 unlock flags stand with it (dialga_unlocked / palkia_unlocked / giratina_unlocked)',
    !!st.story.flags.sinnoh_climax_resolved && !!st.story.flags.cyrus_end_done && !!st.story.flags.distortion_cleared
    && !!st.story.flags.dialga_unlocked && !!st.story.flags.palkia_unlocked && !!st.story.flags.giratina_unlocked
    && (!!st.story.flags.cyrus_final_won || !!st.story.flags.cyrus_final_lost));
  // ===== the Conference (Lily of the Valley) =====
  healUp(g);
  ow = gotoMap(g, 'league-lobby', 8, 10); pump(g);
  var reg = talkKind(g, ow, 'sinnoh_conference'); pump(g);
  ok('B52 the registrar registers the player (sinnoh_conference_registered — eight badges + the climax resolved)',
    !!reg && !!st.story.flags.sinnoh_conference_registered);
  talkKind(g, ow, 'sinnoh_conference'); pump(g, 1500);
  ok('B53 the preliminary is won through the registrar (beat_conference_s_p1)', !!st.story.flags.beat_conference_s_p1);
  var paulSettled = false;
  for (var pAtt = 0; pAtt < 5 && !paulSettled; pAtt++) {
    healUp(g);
    ow = gotoMap(g, 'league-lobby', 8, 10); pump(g);
    talkKind(g, ow, 'paul_conference'); pump(g, 2500);
    paulSettled = !!st.story.flags.paul_conference_done;
  }
  ok('B54 THE PAUL SETTLEMENT: the quarter-final is won at full strength (paul_conference_done + paul_conference_won — must-win-with-rechallenge: the rivalry resolves with the win, the engine never hard-locked)',
    paulSettled && !!st.story.flags.paul_conference_won);
  // Tobias proof (i): a full wipe BEFORE the felling is a rematch.
  weakTeam();
  ow = gotoMap(g, 'league-lobby', 8, 10); pump(g);
  talkKind(g, ow, 'tobias'); pump(g, 1500);
  ok('B55 TOBIAS PROOF (i): a full team wipe before Darkrai falls concludes NOTHING — no felling flag, no tobias_faced, no sinnoh_complete, no arc card (a rematch, per the ruling)',
    !st.story.flags.tobias_darkrai_felled && !st.story.flags.tobias_faced
    && !st.story.flags.sinnoh_complete && !st.story.flags.arc_card_sinnoh
    && st.story.regionsDone.filter(function (r) { return r === 'sinnoh'; }).length === 0);
  // Tobias proof (ii): the felling sets the honour flag; Latios then
  // concludes the match win-or-lose (here: the canon loss).
  strongTeam(g, 395); healUp(g);
  ow = gotoMap(g, 'league-lobby', 8, 10); pump(g);
  talkKind(g, ow, 'tobias'); pump(g, 2500);
  ok('B56 TOBIAS PROOF (ii-a): Darkrai FALLS to a full-strength team — tobias_darkrai_felled stands, and the conference has NOT concluded yet (the Latios act is still owed: no tobias_faced, no sinnoh_complete)',
    !!st.story.flags.tobias_darkrai_felled && !st.story.flags.tobias_faced && !st.story.flags.sinnoh_complete);
  weakTeam();
  talkKind(g, ow, 'tobias'); pump(g, 2500);
  ok('B57 TOBIAS PROOF (ii-b): with the felling standing, Latios concludes the match WIN-OR-LOSE — the canon loss path (tobias_faced + tobias_lost) still concludes the Conference with the honour intact (sinnoh_complete set by the handler)',
    !!st.story.flags.tobias_faced && !!st.story.flags.tobias_lost && !!st.story.flags.sinnoh_complete);
  // Tobias proof (iii): the machine fires — exactly once.
  ok('B58 TOBIAS PROOF (iii): the machine fired on sinnoh_complete — arc_card_sinnoh stands, regionsDone gained sinnoh EXACTLY once, and the directive is pinned on the next arc (unova, sealed)',
    !!st.story.flags.arc_card_sinnoh
    && st.story.regionsDone.filter(function (r) { return r === 'sinnoh'; }).length === 1
    && st.story.arc_directive === 'unova',
    'regionsDone=' + st.story.regionsDone.join(',') + ' directive=' + st.story.arc_directive);
  strongTeam(g, 395); healUp(g);
  ow = gotoMap(g, 'sandgem', 10, 10); pump(g, 400);
  ok('B59 the card never re-fires: after further travel, regionsDone still holds sinnoh exactly once and the directive still stands (fire-once machine law)',
    st.story.regionsDone.filter(function (r) { return r === 'sinnoh'; }).length === 1 && !!st.story.flags.arc_card_sinnoh);
  // ===== the whole chain + log, read back =====
  ok('B60 the quest chain reads complete end-to-end: every SINNOH_QUESTS flag of the 30 stands set',
    SINNOH_QUESTS.every(function (q) { return !!st.story.flags[q.flag]; }),
    SINNOH_QUESTS.filter(function (q) { return !st.story.flags[q.flag]; }).map(function (q) { return q.id; }).join(','));
  g.openQuestLog(); tk(g, 2);
  var logItems2 = g.ui.menu ? g.ui.menu.items : [];
  var logLabels2 = logItems2.map(function (i) { return i.label; }).join(' | ');
  var hasFinalRows = logLabels2.indexOf('— SINNOH —') >= 0
    && logLabels2.indexOf('★ The Conference semi-final') >= 0
    && logLabels2.indexOf('★ The Distortion World') >= 0;
  if (g.ui.menuOpen) { var li2 = logItems2.findIndex(function (i) { return i.value === 'close'; }); if (li2 >= 0) g.ui.debugChoose(li2); tk(g, 3); }
  drain(g);
  ok('B61 the Quest Log renders the SINNOH section with the second-half rows starred complete (the Distortion World + the semi-final rows)', hasFinalRows, logLabels2.slice(0, 200));
  ok('B62 the merge fold landed in the bundle (TRAINERS carries Wake/Volkner/Paul\\'s settlement/Tobias\\'s two acts; EVENTS carries the Spear Pillar + platform scenes; QUESTS carries the second-half tales)',
    !!TRAINERS.wake && !!TRAINERS.volkner && !!TRAINERS.paul_conference && !!TRAINERS.tobias_darkrai && !!TRAINERS.tobias_latios
    && !!EVENTS.ev_sinnoh_spear_pillar && !!EVENTS.ev_sinnoh_distortion_climax && !!EVENTS.ev_sinnoh_hq_raid
    && !!QUESTS.tale_sinnoh_pastoria && !!QUESTS.tale_sinnoh_sunnyshore);

  // ================= Part B3: S7 THE FINALE (true path) =================
  // Continues the SAME fixture save: sinnoh_complete stands, the
  // directive is pinned on the sealed successor, the road home is
  // still to walk. Ball/flee helpers ride the S6 legendary idiom.
  var attemptBall7 = function (ballId) {
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
  };
  var catch7 = function () {
    var n = 0;
    while ((g.scenes.top instanceof BattleScene) && n++ < 4) { attemptBall7('masterball'); }
    drain(g);
    return !(g.scenes.top instanceof BattleScene);
  };
  var flee7 = function () {
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
  };
  var toBattle7 = function () {
    var n = 0;
    while (!(g.scenes.top instanceof BattleScene) && n < 400) {
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) break;
      tk(g, 2); n++;
    }
    return g.scenes.top instanceof BattleScene;
  };
  var logLines = function (entries) {
    var out = [];
    entries.forEach(function (e) { if (e.lines) out.push.apply(out, e.lines); });
    return out;
  };

  // ---- C01: the unlock pinning, BEFORE the finale ----
  ok('C01 UNLOCK PINNING (pre-finale): this sinnoh_complete save has NO Azure Flute, NO arceus_unlocked, NO finale flag, NO Master HoF entry, and arc_arceus is absent from its Quest Log state — completion alone unlocks nothing',
    st.story.arc_directive === 'unova' && !!st.story.flags.sinnoh_complete
    && !st.story.flags.arceus_unlocked && !st.story.flags.finale_done
    && !(st.bag.azureflute > 0) && st.story.quests.arc_arceus === undefined
    && !(st.story.hof || []).some(function (e) { return e.master; }));
  ow = gotoMap(g, 'hall-of-origin', 10, 12); pump(g, 200);
  ok('C02 the Hall of Origin stands SILENT before the finale: entering it fires no face, no stairs, no battle (the capstone is finale-gated, not map-gated)',
    !(g.scenes.top instanceof BattleScene) && !st.story.flags.arceus_stairs_open && !st.story.flags.arc_arceus_done && st.story.quests.arc_arceus === undefined);
  // The full-chain save's shelf + book, as a real six-arc save
  // carries them: one HoF entry per completed league/frontier (the
  // shipped entry shape) and a dex missing exactly one species.
  st.story.hof = [
    { team: [{ speciesId: 'partner', level: 88, nickname: null }, { speciesId: 'venusaur', level: 85, nickname: null }], badges: 8 },
    { team: [{ speciesId: 'partner', level: 96, nickname: null }, { speciesId: 'charizard', level: 94, nickname: null }], badges: 4 },
    { team: [{ speciesId: 'partner', level: 186, nickname: null }, { speciesId: 'blastoise', level: 182, nickname: null }], badges: 8 },
    { team: [{ speciesId: 'partner', level: 288, nickname: null }, { speciesId: 'gengar', level: 285, nickname: null }], badges: 8 },
    { team: [{ speciesId: 'partner', level: 340, nickname: null }, { speciesId: 'snorlax', level: 338, nickname: null }], badges: 7 },
    { team: [{ speciesId: 'partner', level: 395, nickname: null }, { speciesId: 'gengar', level: 392, nickname: null }], badges: 8 },
  ];
  Object.values(SPECIES).forEach(function (sp) {
    if (!sp.form && sp.dexNo >= 1 && sp.dexNo <= 493 && sp.id !== 'arceus') { st.dex.caught[sp.dexNo] = true; st.dex.seen[sp.dexNo] = true; }
  });
  st.bag.masterball = 99;
  st.story.flags.scott_closing_done = true; // consumed on an earlier Pallet entry in the real chain (frontier E07 proves the beat itself)
  ok('C03 the fixture now reads as the full-chain save: 492 of 493 caught (only the capstone outstanding), six per-arc HoF entries on the shelf',
    Object.keys(st.dex.caught).length === 492 && !st.dex.caught[493] && st.story.hof.length === 6);

  // ---- C04-C08: sail/walk home -> doorstep -> the finale homecoming ----
  var logMark = g.ui.log.length;
  ow = gotoMap(g, 'pallet', 7, 9); pump(g, 400);
  ow = gotoMap(g, 'house-pallet-ash', 4, 4); pump(g, 1500);
  var finEntries = g.ui.log.slice(logMark);
  var finLines = logLines(finEntries);
  var echoVals = Object.values(ARC_FINALE_ECHOES);
  var presentedEchoes = finLines.filter(function (l) { return echoVals.includes(l); });
  ok('C04 THE FINALE HOMECOMING fires at Mom\\'s house (the sealed-future successor): finale_done + homecoming_unova stand, the directive is COMPLETE (cleared), hook_unova was delivered, and the sealed law holds — story.arc does NOT advance and NO embark is armed',
    !!st.story.flags.finale_done && !!st.story.flags.homecoming_unova
    && st.story.arc_directive === null && !!st.story.flags.hook_unova
    && st.story.arc === 'sinnoh' && !st.story.flags.embark_unova);
  ok('C05 BOND ECHOES: exactly one echo beat per completed arc was presented — echo count == regionsDone count == 6, in regionsDone order, each line the data line keyed by that arc',
    st.story.regionsDone.length === 6 && presentedEchoes.length === 6
    && st.story.regionsDone.every(function (key, i) { return presentedEchoes[i] === ARC_FINALE_ECHOES[key]; }),
    'echoes=' + presentedEchoes.length + ' done=' + st.story.regionsDone.join(','));
  ok('C06 THE ENTRUSTING: Oak\\'s rating beat reads the 493 horizon (492 of 493 at the doorstep) and the finale — not completion — grants the Azure Flute (key pocket, exactly one) and sets arceus_unlocked',
    finLines.some(function (l) { return l.indexOf('492 of 493') >= 0; })
    && finLines.some(function (l) { return l.indexOf('AZURE FLUTE') >= 0; })
    && st.bag.azureflute === 1 && !!st.story.flags.arceus_unlocked);
  ok('C07 MASTER HALL OF FAME: the finale wrote the seventh entry, flagged master, with the walking party as its team (alongside the six per-arc entries, none of them master)',
    st.story.hof.length === 7 && st.story.hof.filter(function (e) { return e.master; }).length === 1
    && st.story.hof[6].master === true && st.story.hof[6].team.length === st.party.length
    && st.story.hof.slice(0, 6).every(function (e) { return !e.master; }));
  var arcTitlesOk = ARCS.filter(function (a) { return !a.future; }).every(function (a) {
    return finLines.some(function (l) { return l.indexOf(a.label + ' · ' + a.region + ' — ') === 0; });
  });
  var lastEntry = finEntries[finEntries.length - 1];
  ok('C08 FULL CREDITS: the finale\\'s last presented scene IS the credits — every completed arc listed by its registry title (six, from regionsDone), the road-so-far counts 6 journeys at 492/493, and the sequence CLOSES on the end card (approved line verbatim, card lines as the tail)',
    arcTitlesOk
    && finLines.some(function (l) { return l.indexOf('The road so far:') === 0 && l.indexOf('6 journeys complete') >= 0 && l.indexOf('492/493') >= 0; })
    && !!lastEntry && Array.isArray(lastEntry.lines)
    && JSON.stringify(lastEntry.lines.slice(-FINALE_END_CARD.length)) === JSON.stringify(FINALE_END_CARD)
    && lastEntry.lines.includes('Six journeys. Five leagues and a frontier. One road, walked whole.'),
    finLines.slice(-4).join(' | '));
  // ---- C09: the Master entry is READABLE in the HoF viewer ----
  g.openHallOfFame(); tk(g, 2);
  var hofHtml = (g.ui.summary && g.ui.summary.data && g.ui.summary.data.tabs[0].bodyHtml) || '';
  if (g.ui.closeSummary) g.ui.closeSummary();
  ok('C09 the HoF viewer surfaces the Master entry ALONGSIDE the per-arc entries: 7 entry plates rendered, the MASTER ENTRY head present, per-arc Entry heads intact',
    (hofHtml.match(/hofentry/g) || []).length === 7 && hofHtml.indexOf('MASTER ENTRY') >= 0
    && hofHtml.indexOf('Entry 6') >= 0 && hofHtml.indexOf('HALL OF FAME') >= 0,
    hofHtml.slice(0, 160));
  // ---- C10: the Quest Log gains the capstone ONLY now ----
  ow = gotoMap(g, 'pallet', 7, 9); pump(g, 200);
  g.openQuestLog(); tk(g, 2);
  var logItems3 = g.ui.menu ? g.ui.menu.items : [];
  var logLabels3 = logItems3.map(function (i) { return i.label; }).join(' | ');
  if (g.ui.menuOpen) { var li3 = logItems3.findIndex(function (i) { return i.value === 'close'; }); if (li3 >= 0) g.ui.debugChoose(li3); tk(g, 3); }
  drain(g);
  ok('C10 THE CAPSTONE APPEARS: after the finale, the Quest Log\\'s Legendary Arcs section lists The Hall of Origin (discovered on the unlock) with its requirement steps spelled out in its card (Azure Flute -> Spear Pillar -> the stairs)',
    st.story.quests.arc_arceus === 'discovered' && logLabels3.indexOf('The Hall of Origin') >= 0,
    logLabels3.slice(0, 240));

  // ---- C11-C13: Spear Pillar -> the stairs -> Arceus at the cap ----
  strongTeam(g, 395); healUp(g);
  ow = gotoMap(g, 'spear-pillar', 13, 12); pump(g, 600);
  ok('C11 THE FLUTE AT SPEAR PILLAR: with the unlock standing, entering the pillar plays the flute ceremony (arceus_stairs_open) — a say-only opening, no battle forced',
    !!st.story.flags.arceus_stairs_open && !(g.scenes.top instanceof BattleScene));
  ow = gotoMap(g, 'hall-of-origin', 10, 12);
  var faced = toBattle7();
  var foe7 = (g.scenes.top instanceof BattleScene) ? g.scenes.top.foe : null;
  ok('C12 THE CAPSTONE FACES: Arceus stands in the Hall of Origin at the band cap, level 400',
    faced && !!foe7 && foe7.speciesId === 'arceus' && foe7.level === 400,
    foe7 ? foe7.speciesId + '@' + foe7.level : 'no battle');
  flee7(); pump(g, 200);
  ok('C13 FLEE RE-FIRES (the catch law, even here): fleeing Arceus completes nothing — no done flag, no dex, the arc stays open',
    !st.story.flags.arc_arceus_done && !st.dex.caught[493] && st.story.quests.arc_arceus !== 'complete');
  healUp(g);
  ow = gotoMap(g, 'hall-of-origin', 10, 12);
  var faced2 = toBattle7();
  catch7(); pump(g, 300);
  ok('C14 THE CATCH COMPLETES THE 493: the re-fired face is caught — arc_arceus_done stands, the Quest Log entry completes, and the dex reads 493/493 at the Platinum horizon',
    faced2 && !!st.story.flags.arc_arceus_done && st.story.quests.arc_arceus === 'complete'
    && !!st.dex.caught[493] && Object.keys(st.dex.caught).length === 493,
    'caught=' + Object.keys(st.dex.caught).length);
  tk(g, 30);
  ok('C15 THE PLATINUM DIPLOMA READS EARNED on the completed dex (the shipped Foundation presentation, keyed to 493 — proven, not rebuilt): platinum_diploma stands after the catch',
    !!st.story.flags.platinum_diploma);
  g.openDiploma(); tk(g, 2);
  var dipHtml = (g.ui.summary && g.ui.summary.data && g.ui.summary.data.tabs[0].bodyHtml) || '';
  if (g.ui.closeSummary) g.ui.closeSummary();
  ok('C16 the Diploma viewer presents the PLATINUM plate (all 493 species of the Platinum horizon)',
    dipHtml.indexOf('PLATINUM DIPLOMA') >= 0 && dipHtml.indexOf('493') >= 0, dipHtml.slice(0, 120));

  // ---- C17-C20: post-game integrity ----
  ow = gotoMap(g, 'house-pallet-ash', 4, 4); pump(g, 300);
  ok('C17 NO DANGLING DIRECTIVE: re-entering home is quiet — the directive stays complete and never re-pins, the finale never re-fires (Master count still exactly one, flute still exactly one)',
    st.story.arc_directive === null && st.story.hof.filter(function (e) { return e.master; }).length === 1 && st.bag.azureflute === 1);
  g.openJourney(); tk(g, 2);
  var jItems = g.ui.menu ? g.ui.menu.items : [];
  var jLabels = jItems.map(function (i) { return i.label; }).join(' | ');
  if (g.ui.menuOpen) { var ji = jItems.findIndex(function (i) { return i.value === 'close'; }); if (ji >= 0) g.ui.debugChoose(ji); tk(g, 3); }
  drain(g);
  ok('C18 the Journey menu reads the finished road: all six arc headers COMPLETE, and the future rows stand as one SEALED silhouette band (nothing fake-playable)',
    ['KANTO — COMPLETE', 'ORANGE ISLANDS — COMPLETE', 'JOHTO — COMPLETE', 'HOENN — COMPLETE', 'BATTLE FRONTIER — COMPLETE', 'SINNOH — COMPLETE']
      .every(function (s) { return jLabels.indexOf(s) >= 0; })
    && jLabels.indexOf('FUTURE ARCS — SEALED') >= 0,
    jLabels.slice(0, 300));
  ow = gotoMap(g, 'vermilion', 13, 9); pump(g);
  var capt7 = ow.map.npcs.find(function (n) { return n.name === 'CAPT SINNOH'; });
  if (capt7) { ow.sysNpc(capt7); pump(g, 600); }
  ok('C19 THE FERRY NETWORK IS WHOLE after the finale + capstone: CAPT SINNOH still sails Vermilion -> Sandgem on the shipped crossing (returns unconditional)',
    !!capt7 && st.story.position.map === 'sandgem', 'pos=' + st.story.position.map);
  g.beginSecondJourney(st); tk(g, 3);
  ok('C20 A SECOND JOURNEY STARTS from the full-chain save (the shipped NG+ path): ngPlus climbs to 1, the new run\\'s own HoF is empty, and the prior-journey shelf carries all seven entries — the Master entry among them, its flag intact through the normalizer',
    g.state.meta.ngPlus === 1 && g.state.story.hof.length === 0
    && g.state.story.priorHof.length === 7 && g.state.story.priorHof.some(function (e) { return e.master === true; }),
    'ngPlus=' + g.state.meta.ngPlus + ' prior=' + (g.state.story.priorHof || []).length);

  // ================= Part B4: CONTROL — the Frontier homecoming =================
  // A Frontier-complete save whose successor IS shipped: its
  // homecoming must remain the standard variant with NO finale
  // side-effects (the frontier suite's E09/E10 drive the same
  // machine from its own fixture; this is the in-suite control).
  var g2 = mkGame(902); boot(g2); strongTeam(g2, 360);
  var s2 = g2.state;
  s2.story.arc = 'frontier'; s2.story.region = 'kanto';
  s2.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier'];
  s2.badges.kanto = ['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge'];
  s2.badges.orange = ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'];
  s2.badges.johto = ['zephyrbadge','hivebadge','plainbadge','fogbadge','stormbadge','mineralbadge','glacierbadge','risingbadge'];
  s2.badges.hoenn = ['stonebadge','knucklebadge','dynamobadge','heatbadge','balancebadge','featherbadge','mindbadge','rainbadge'];
  s2.badges.symbols = ['gold','gold','gold','gold','gold','gold','gold'];
  s2.story.flags.frontier_complete = true; s2.story.flags.arc_card_frontier = true;
  s2.story.arc_directive = 'sinnoh';
  var ow2 = gotoMap(g2, 'house-pallet-ash', 4, 4); pump(g2, 900);
  var ctlLines = logLines(g2.ui.log);
  ok('C21 CONTROL (the Frontier close): the homecoming whose successor is SHIPPED remains the standard variant — hook delivered, directive cleared, arc advances, embark arms — with NO finale side-effects: no finale flag, no flute, no unlock, no Master entry, no echoes, no credits, no end card',
    s2.story.arc === 'sinnoh' && s2.story.flags.hook_sinnoh === true && s2.story.flags.embark_sinnoh === true && s2.story.arc_directive === null
    && !s2.story.flags.finale_done && !s2.story.flags.arceus_unlocked && !(s2.bag.azureflute > 0)
    && !(s2.story.hof || []).some(function (e) { return e.master; })
    && !ctlLines.some(function (l) { return echoVals.includes(l); })
    && !ctlLines.includes('Six journeys. Five leagues and a frontier. One road, walked whole.'),
    'arc=' + s2.story.arc + ' finale=' + !!s2.story.flags.finale_done);

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
