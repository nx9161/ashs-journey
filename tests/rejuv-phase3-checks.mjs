// rejuv-phase3-checks.mjs — Rejuvenation Phase 3 (ADR-025 §3) proofs:
// Keepsakes (held items). Part A: pure units over the keepsakes table,
// the shared helper (game/keepsakes.mjs), the foe lever (rules.mjs),
// save schema + cloud validator. Part B: the built bundle in a headless
// Game — real BattleScenes in BOTH engines (damage parity, Tortoise
// save + non-reset, Second-Wind stages, freeze refusal, heal scope,
// Gloom Fang paths, Champion XP), foe lever in real trainer battles,
// Give/Take menus, save/load round-trip, PC preserve, Celadon shop
// purchase + badge gate, Hall of Fame gift, hidden-item sources.
// Part C: damage parity in real headless Chromium.
// Extended by the rulings patch (2026-10-27): A25 (wardSpent
// resolution) + A26 (client schema keepsake id set) + B33/B34 (Iron
// Acorn literal first hit vs a multi-hit move, both engines).
// Run: node tests/rejuv-phase3-checks.mjs   (exit 1 on any failure)
// Part C reads public/index.html + public/game.js — build first.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const { ITEMS, POCKETS, KEEPSAKES } = await import(join(ROOT, 'src/data/items.mjs'));
const K = await import(join(ROOT, 'src/game/keepsakes.mjs'));
const R = await import(join(ROOT, 'src/game/rules.mjs'));
const { calcDamage } = await import(join(ROOT, 'src/engine/formulas.mjs'));
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2);
const MOVES = Object.assign({}, MV1, MOVES2);
const { makeMon, defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3, TRAINERS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4, TRAINERS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const { TRAINERS } = await import(join(ROOT, 'src/data/maps.mjs'));
const ALL_MAPS = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4);
const ALL_TRAINERS = Object.assign({}, TRAINERS, TRAINERS3, TRAINERS4);

const mon = (speciesId, level, keepsake) => {
  const m = makeMon(speciesId, level, SPECIES, MOVES);
  if (keepsake) m.keepsake = keepsake;
  return m;
};
const MV = (type, cat) => ({ type, cat: cat || 'physical', power: 40 });

// -- the set, the pocket, the shape law --
{
  const ids = Object.keys(KEEPSAKES).sort();
  ok('A01 the keepsake set: the 12 specced pieces + 6 Sinnoh pieces (Arc 4 Stage S5a — supersedes the Phase 3 closed set; the 12 keep their ids/shapes)', JSON.stringify(ids) === JSON.stringify([
    'championsribbon', 'coalseamcharm', 'dawnribbon', 'embereed', 'fossilspur', 'gardeniasash', 'gloomfang',
    'ironacorn', 'meadowcord', 'ribbonclasp', 'ruinbell', 'secondwindribbon', 'sparrowfeather', 'spectrebell',
    'starshard', 'thunderheadpin', 'tidepearl', 'tortoisecharm',
  ]), ids.join(','));
  ok('A02 every piece is a bag item in the keepsakes pocket; pocket exists; only the ribbon has a price',
    ids.every((id) => ITEMS[id] && ITEMS[id].pocket === 'keepsakes')
    && POCKETS.includes('keepsakes')
    && ids.every((id) => id === 'secondwindribbon' || !ITEMS[id].price)
    && ITEMS.secondwindribbon.price === 3000 && ITEMS.secondwindribbon.minBadges === 7);
  const KINDS = ['underdogDamage', 'koSave', 'lowHpSpeed', 'statusChance', 'typeWard',
    'firstHitWard', 'matchupDamage', 'healBoost', 'lowHpDamage', 'fasterFoeDamage', 'xpBoost'];
  ok('A03 effect law: every def declares exactly one CONDITIONAL kind — no shape for a flat boost',
    Object.values(KEEPSAKES).every((d) => KINDS.includes(d.kind))
    && Object.values(KEEPSAKES).every((d) => {
      // every factor-bearing kind must carry its window parameters
      if (d.kind === 'underdogDamage') return typeof d.levelGap === 'number';
      if (d.kind === 'matchupDamage') return !!d.moveType && !!d.vsType;
      if (d.kind === 'lowHpDamage') return !!d.moveType && typeof d.hpFrac === 'number';
      if (d.kind === 'lowHpSpeed') return typeof d.hpFrac === 'number';
      if (d.kind === 'fasterFoeDamage' || d.kind === 'typeWard') return !!d.moveType;
      if (d.kind === 'statusChance') return !!d.moveType && !!d.status;
      return true;
    })
    && Object.values(KEEPSAKES).every((d) => typeof d.effect === 'string' && d.effect.length > 0));
  ok('A04 makeMon defaults keepsake to null', makeMon('rattata', 5, SPECIES, MOVES).keepsake === null);
}

// -- per-piece helper windows: ON and OFF conditions (all 12) --
{
  const foe20 = mon('rattata', 20);
  // Sparrow Feather
  ok('A05 sparrow: x1.25 at gap >= 3, x1 at gap 2 (off)',
    K.keepsakeDamageFactor(mon('rattata', 17, 'sparrowfeather'), foe20, MV('normal'), {}).factor === 1.25
    && K.keepsakeDamageFactor(mon('rattata', 18, 'sparrowfeather'), foe20, MV('normal'), {}).factor === 1);
  // Tortoise Charm (+ flag non-reset lives here and in Part B)
  {
    const m = mon('rattata', 20, 'tortoisecharm'); m.hp = 0;
    const t1 = K.evaluateTriggers(m, { hpBefore: m.maxHp, viaAttack: true });
    const saved = t1.tortoise === true && m.hp === 1;
    m.hp = m.maxHp; m.hp = 0; // healed fully, hit again — flag must NOT re-arm
    const t2 = K.evaluateTriggers(m, { hpBefore: m.maxHp, viaAttack: true });
    const m2 = mon('rattata', 20, 'tortoisecharm'); m2.hp = 0;
    const half = K.evaluateTriggers(m2, { hpBefore: m2.maxHp / 2, viaAttack: true }); // at half = NOT above half
    const m3 = mon('rattata', 20, 'tortoisecharm'); m3.hp = 0;
    const tick = K.evaluateTriggers(m3, { hpBefore: m3.maxHp, viaAttack: false }); // poison tick: no save
    ok('A06 tortoise: saves from above half via attack; NOT at half, NOT via tick, NEVER re-arms after heal',
      saved && t2.tortoise === false && m.hp === 0 && half.tortoise === false && tick.tortoise === false);
  }
  // Second-Wind Ribbon
  {
    const m = mon('rattata', 20, 'secondwindribbon'); m.hp = Math.floor(m.maxHp * 0.25);
    const on = K.evaluateTriggers(m, {}).secondWind === true;
    const again = K.evaluateTriggers(m, {}).secondWind === false;
    const m2 = mon('rattata', 20, 'secondwindribbon'); m2.hp = Math.floor(m.maxHp * 0.25) + 1;
    ok('A07 second-wind: fires at <=25% HP once; not above 25% (off), not twice',
      on && again && K.evaluateTriggers(m2, {}).secondWind === false);
  }
  // Ember Seed
  ok('A08 ember seed: +10 burn on Fire moves only; freeze refused, other statuses not',
    K.keepsakeStatusChanceBonus(mon('rattata', 5, 'embereed'), MV('fire', 'special'), 'burn') === 10
    && K.keepsakeStatusChanceBonus(mon('rattata', 5, 'embereed'), MV('fire', 'special'), 'poison') === 0
    && K.keepsakeStatusChanceBonus(mon('rattata', 5, 'embereed'), MV('water', 'special'), 'burn') === 0
    && K.refusesStatus(mon('rattata', 5, 'embereed'), 'freeze') === true
    && K.refusesStatus(mon('rattata', 5, 'embereed'), 'burn') === false
    && K.refusesStatus(mon('rattata', 5), 'freeze') === false);
  // Tide Pearl
  ok('A09 tide pearl: x0.8 vs Electric only (off: other types, no piece)',
    K.keepsakeDamageFactor(mon('rattata', 5), mon('rattata', 5, 'tidepearl'), MV('electric', 'special'), {}).factor === 0.8
    && K.keepsakeDamageFactor(mon('rattata', 5), mon('rattata', 5, 'tidepearl'), MV('water', 'special'), {}).factor === 1);
  // Gloom Fang
  ok('A10 gloom fang: +10 poison chance on Poison moves; RT cooldown x0.85; off-types x1',
    K.keepsakeStatusChanceBonus(mon('weedle', 5, 'gloomfang'), MV('poison'), 'poison') === 10
    && K.keepsakeStatusChanceBonus(mon('weedle', 5, 'gloomfang'), MV('bug'), 'poison') === 0
    && K.keepsakeCooldownMult(mon('weedle', 5, 'gloomfang'), MV('poison')) === 0.85
    && K.keepsakeCooldownMult(mon('weedle', 5, 'gloomfang'), MV('bug')) === 1);
  // Iron Acorn
  {
    const def = mon('rattata', 5, 'ironacorn');
    const first = K.keepsakeDamageFactor(mon('rattata', 5), def, MV('normal'), {}).factor;
    K.noteHitTaken(def);
    const second = K.keepsakeDamageFactor(mon('rattata', 5), def, MV('normal'), {}).factor;
    ok('A11 iron acorn: x0.85 on the first hit taken, x1 after (off)', first === 0.85 && second === 1);
  }
  // Spectre Bell
  ok('A12 spectre bell: Ghost x1.2 vs Psychic-types only (off: other foe types, other move types)',
    K.keepsakeDamageFactor(mon('gastly', 5, 'spectrebell'), foe20, MV('ghost'), { defTypes: ['psychic'] }).factor === 1.2
    && K.keepsakeDamageFactor(mon('gastly', 5, 'spectrebell'), foe20, MV('ghost'), { defTypes: ['normal'] }).factor === 1
    && K.keepsakeDamageFactor(mon('gastly', 5, 'spectrebell'), foe20, MV('dark'), { defTypes: ['psychic'] }).factor === 1);
  // Gardenia Sash
  ok('A13 gardenia sash: heal mult 1.5 for the holder, 1 otherwise',
    K.keepsakeHealMult(mon('chansey', 5, 'gardeniasash')) === 1.5 && K.keepsakeHealMult(mon('chansey', 5)) === 1);
  // Thunderhead Pin
  {
    const m = mon('pikachu', 5, 'thunderheadpin'); m.hp = Math.floor(m.maxHp / 2);
    const on = K.keepsakeDamageFactor(m, foe20, MV('electric', 'special'), {}).factor;
    m.hp = Math.floor(m.maxHp / 2) + 1;
    const off = K.keepsakeDamageFactor(m, foe20, MV('electric', 'special'), {}).factor;
    ok('A14 thunderhead: Electric x1.15 at <=50% HP; x1 above half (off) and for other types',
      on === 1.15 && off === 1
      && K.keepsakeDamageFactor(m, foe20, MV('fire', 'special'), {}).factor === 1);
  }
  // Fossil Spur
  ok('A15 fossil spur: Rock x1.15 vs a faster foe only (off: slower/equal foe, other types)',
    K.keepsakeDamageFactor(mon('geodude', 5, 'fossilspur'), foe20, MV('rock'), { atkSpe: 40, defSpe: 60 }).factor === 1.15
    && K.keepsakeDamageFactor(mon('geodude', 5, 'fossilspur'), foe20, MV('rock'), { atkSpe: 60, defSpe: 60 }).factor === 1
    && K.keepsakeDamageFactor(mon('geodude', 5, 'fossilspur'), foe20, MV('ground'), { atkSpe: 40, defSpe: 60 }).factor === 1);
  // Champion's Ribbon + composition with Phase 1 factors
  {
    const stStory = defaultState(); stStory.story.difficulty = 'story'; stStory.settings.houseRules.fastLearner = true;
    ok("A16 champion's ribbon: x1.2 holder-only; composes Story x1.25 * Fast Learner x1.5 * Ribbon x1.2 = x2.25",
      K.keepsakeXpMult(mon('rattata', 5, 'championsribbon')) === 1.2 && K.keepsakeXpMult(mon('rattata', 5)) === 1
      && Math.abs(R.xpMultFor(stStory, mon('rattata', 5, 'championsribbon')) - 2.25) < 1e-9
      && Math.abs(R.xpMultFor(stStory, mon('rattata', 5)) - 1.875) < 1e-9
      && Math.abs(R.xpMultFor(stStory) - 1.875) < 1e-9);
  }
  // Factor applied ONCE, after Ground, in the shared path
  {
    const raw = calcDamage(50, 100, 100, 100, { random: 1 }); // 46 exactly
    const stacked = calcDamage(50, 100, 100, 100, { random: 1, groundFactor: 1.2, keepsakeFactor: 1.25 });
    const groundOnly = calcDamage(50, 100, 100, 100, { random: 1, groundFactor: 1.2 });
    const ksOnly = calcDamage(50, 100, 100, 100, { random: 1, keepsakeFactor: 1.25 });
    ok('A17 calcDamage: keepsake factor multiplies the Ground-factored hit exactly once (46 -> 69)',
      raw === 46 && stacked === Math.floor(46 * 1.2 * 1.25) && stacked === 69 && groundOnly === 55 && ksOnly === 57,
      'raw=' + raw + ' stacked=' + stacked);
  }
}

// -- foe lever (rules.foeKeepsakeFor) --
{
  const st = (mode) => { const s = defaultState(); s.story.difficulty = mode; return s; };
  const brock = ALL_TRAINERS.brock;
  const r1 = ALL_TRAINERS.r1_cal;
  ok('A18 foe lever matrix: story none / classic ace-only / challenge all leader / non-leader + wild never',
    R.foeKeepsakeFor(st('story'), brock, 1, 2) === null
    && R.foeKeepsakeFor(st('classic'), brock, 0, 2) === null
    && R.foeKeepsakeFor(st('classic'), brock, 1, 2) === 'tortoisecharm'
    && R.foeKeepsakeFor(st('challenge'), brock, 0, 2) === 'ironacorn'
    && R.foeKeepsakeFor(st('challenge'), brock, 1, 2) === 'tortoisecharm'
    && R.foeKeepsakeFor(st('challenge'), r1, 0, (r1.team || []).length) === null
    && R.foeKeepsakeFor(st('challenge'), null, 0, 1) === null);
  const leaders = Object.values(ALL_TRAINERS).filter((t) => R.isLeaderTrainer(t));
  ok('A19 every leader team member carries an authored keepsake (13 leaders)',
    leaders.length === 13 && leaders.every((t) => t.team.every((e) => !!KEEPSAKES[e.keepsake])),
    'leaders=' + leaders.length);
}

// -- bag / slot operations --
{
  const s = defaultState();
  const m = mon('rattata', 5);
  s.party = [m];
  const g1 = K.grantKeepsake(s, 'tidepearl');
  const g2 = K.grantKeepsake(s, 'tidepearl'); // unique: refused
  const give = K.giveKeepsake(s, m, 'tidepearl');
  const heldAfterGive = m.keepsake;
  const bagAfterGive = s.bag.tidepearl || 0;
  const giveAgain = K.giveKeepsake(s, mon('pidgey', 5), 'tidepearl'); // bag empty now
  const ownedWhileHeld = K.ownsKeepsake(s, 'tidepearl');
  const take = K.takeKeepsake(s, m);
  ok('A20 grant/give/take: unique ownership across bag + holders',
    g1 === true && g2 === false && give === true && heldAfterGive === 'tidepearl' && bagAfterGive === 0
    && giveAgain === false && ownedWhileHeld === true && take === true && m.keepsake === null && s.bag.tidepearl === 1);
}

// -- sources in the merged world data --
{
  const hiddenHas = (mapId, item) => (ALL_MAPS[mapId].hidden || []).some((h) => h.item === item);
  const celadon = ALL_MAPS.celadon;
  const clerk = (celadon.npcs || []).find((n) => n.mart);
  // Phase 4 superseded the stub half of this check by design: the six
  // Town-Tale pieces left their marked STUB hidden placements and are
  // now granted by their tales (the full 12-source obtainability audit
  // lives in tests/rejuv-phase4-checks.mjs). What remains here: the
  // direct placements + the ribbon shop row, and proof the stubs are
  // GONE from the world data.
  ok('A21 direct sources placed + ribbon shop; the 6 Phase-3 stub placements are gone (Phase 4 tale sources)',
    hiddenHas('route2', 'sparrowfeather') && hiddenHas('moon1', 'fossilspur')
    && hiddenHas('safari', 'gloomfang') && hiddenHas('powerplant', 'thunderheadpin')
    && !hiddenHas('viridian', 'tortoisecharm') && !hiddenHas('pewter', 'ironacorn')
    && !hiddenHas('vermilion', 'tidepearl') && !hiddenHas('celadon', 'gardeniasash')
    && !hiddenHas('lavender', 'spectrebell') && !hiddenHas('cinnabar', 'embereed')
    && !!clerk && clerk.mart.stock.includes('secondwindribbon'));
}

// -- save schema: client migrate/validate --
{
  const legacy1 = defaultState(); legacy1.v = 1;
  legacy1.party = [mon('rattata', 5)]; delete legacy1.party[0].keepsake;
  legacy1.boxes.box1 = [mon('pidgey', 3)]; delete legacy1.boxes.box1[0].keepsake;
  const mig1 = SCH.migrate(JSON.parse(JSON.stringify(legacy1)));
  const v2bare = defaultState(); v2bare.party = [mon('rattata', 5)]; delete v2bare.party[0].keepsake;
  const mig2 = SCH.migrate(JSON.parse(JSON.stringify(v2bare)));
  const withKs = defaultState(); withKs.party = [mon('rattata', 5, 'tidepearl')];
  const valOk = SCH.validateSave(JSON.parse(JSON.stringify(withKs)));
  const badKs = defaultState(); badKs.party = [mon('rattata', 5)]; badKs.party[0].keepsake = 42;
  const valBad = SCH.validateSave(JSON.parse(JSON.stringify(badKs)));
  ok('A22 client schema: v1 + bare v2 saves migrate to keepsake=null (party + box); keepsake payload validates; numeric keepsake rejected',
    mig1.party[0].keepsake === null && mig1.boxes.box1[0].keepsake === null
    && mig2.party[0].keepsake === null && valOk.ok === true && valBad.ok === false);
}

// -- cloud validator --
{
  ok('A23 validator tables ready (keepsakes emitted)', VAL.tablesReady() === true);
  const good = defaultState();
  good.player.name = 'ASH'; good.player.rivalName = 'GARY';
  good.party.push({
    speciesId: 'partner', nickname: null, level: 12, xp: 1000,
    moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }],
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40, keepsake: 'thunderheadpin',
  });
  good.boxes.box1 = [{ speciesId: 'pidgey', level: 5, xp: 100, nickname: null, keepsake: 'gloomfang', moves: [{ id: 'tackle' }], ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 } }];
  good.bag.tidepearl = 1;
  const r1 = VAL.validateSave(JSON.parse(JSON.stringify(good)));
  const legacy = JSON.parse(JSON.stringify(good));
  delete legacy.party[0].keepsake; delete legacy.boxes.box1[0].keepsake; delete legacy.bag.tidepearl;
  const r2 = VAL.validateSave(legacy);
  const wrong = JSON.parse(JSON.stringify(good)); wrong.party[0].keepsake = 'potion';
  const r3 = VAL.validateSave(wrong);
  const unknown = JSON.parse(JSON.stringify(good)); unknown.party[0].keepsake = 'notathing';
  const r4 = VAL.validateSave(unknown);
  ok('A24 cloud validator: accepts keepsake payloads (party + box + bag pocket), accepts legacy without the field, rejects non-keepsake/unknown ids',
    r1.ok === true && r2.ok === true && r3.ok === false && r4.ok === false,
    JSON.stringify({ r1: r1.errors, r3: r3.errors, r4: r4.errors }));
}

// -- rulings patch (2026-10-27): wardSpent + client schema id set --
{
  const def = mon('rattata', 5, 'ironacorn');
  const armed = K.keepsakeDamageFactor(mon('rattata', 5), def, MV('normal'), {}).factor;
  const spent = K.keepsakeDamageFactor(mon('rattata', 5), def, MV('normal'), { wardSpent: true }).factor;
  const pearlSpent = K.keepsakeDamageFactor(mon('rattata', 5), mon('rattata', 5, 'tidepearl'), MV('electric', 'special'), { wardSpent: true }).factor;
  ok('A25 iron acorn wardSpent: ward does not fire for later hits; unrelated windows (Tide Pearl) unaffected',
    armed === 0.85 && spent === 1 && pearlSpent === 0.8);
}
{
  const bogus = defaultState(); bogus.party = [mon('rattata', 5)]; bogus.party[0].keepsake = 'notakeepsake';
  const valBogus = SCH.validateSave(JSON.parse(JSON.stringify(bogus)));
  const migBogus = SCH.migrate(JSON.parse(JSON.stringify(bogus)));
  const nonKs = defaultState(); nonKs.party = [mon('rattata', 5)]; nonKs.party[0].keepsake = 'potion';
  const valNonKs = SCH.validateSave(JSON.parse(JSON.stringify(nonKs)));
  const boxedBogus = defaultState(); boxedBogus.boxes.box1 = [mon('pidgey', 3)]; boxedBogus.boxes.box1[0].keepsake = 'notakeepsake';
  const migBoxed = SCH.migrate(JSON.parse(JSON.stringify(boxedBogus)));
  ok('A26 client schema (rulings patch): bogus/non-keepsake keepsake ids rejected by validateSave; migrate coerces them to null (party + box) and the result validates',
    valBogus.ok === false && valBogus.errors.includes('bad-mon-keepsake')
    && valNonKs.ok === false
    && migBogus.party[0].keepsake === null && SCH.validateSave(migBogus).ok === true
    && migBoxed.boxes.box1[0].keepsake === null);
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 5150;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const ui = game.ui, st = game.state;
  st.settings.battleStyle = 'classic';
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const drain = (b) => { let n = 0; while (b.msgOpen && n++ < 20) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } };
  const chooseLabel = (frag) => {
    const items = ui.menu ? ui.menu.items : [];
    const i = items.findIndex((it) => it.label && it.label.includes(frag));
    if (i < 0) return false;
    ui.debugChoose(i);
    return true;
  };
  const rowOf = (frag) => (ui.menu ? ui.menu.items.find((it) => it.label && it.label.includes(frag)) : null);
  const rat = (lv, ks) => { const m = makeMon('rattata', lv, SPECIES, MOVES); if (ks) m.keepsake = ks; return m; };
  const entry = (b, side, move) => ({ side, mon: side === 'ally' ? b.ally : b.foe, stats: b.effStats(side === 'ally' ? b.ally : b.foe, side === 'ally' ? b.allyStages : b.foeStages), move, action: { type: 'move', idx: 0 } });
  const trigIds = (b) => (b._ksTriggered || []).map((t) => t.id);
  ow.loadMap('route1'); // Open Ground everywhere below unless noted
  game.rng.battle = () => 0.5;

  // ---- B: Sparrow Feather damage, classic (ON: gap 3 / OFF: gap 2) ----
  {
    st.party = [rat(17, 'sparrowfeather')];
    const b = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    const hp0 = b.foe.hp;
    b.execMoveContinue(entry(b, 'ally', MOVES.tackle)); drain(b);
    out.sparrowDmg = hp0 - b.foe.hp;
    out.sparrowExpected = calcDamage(17, 40, b.ally.stats.atk, b.foe.stats.def,
      { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: b.field, moveType: 'normal', keepsakeFactor: 1.25 });
    out.sparrowAnnounced = trigIds(b).includes('sparrowfeather');
    game.scenes.pop();
    st.party = [rat(18, 'sparrowfeather')];
    const b2 = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b2); b2.enter(); drain(b2);
    const hp02 = b2.foe.hp;
    b2.execMoveContinue(entry(b2, 'ally', MOVES.tackle)); drain(b2);
    out.sparrowOffDmg = hp02 - b2.foe.hp;
    out.sparrowOffExpected = calcDamage(18, 40, b2.ally.stats.atk, b2.foe.stats.def,
      { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: b2.field, moveType: 'normal' });
    game.scenes.pop();
  }

  // ---- B: Tide Pearl defensive factor, classic ----
  {
    const ally = rat(20, 'tidepearl'); st.party = [ally];
    const pika = makeMon('pikachu', 20, SPECIES, MOVES);
    pika.moves = [{ id: 'thundershock', pp: 30, maxPp: 30 }];
    const b = new BattleScene({ kind: 'wild', foe: pika, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    const hp0 = ally.hp;
    b.execMoveContinue(entry(b, 'foe', MOVES.thundershock)); drain(b);
    out.tideDmg = hp0 - ally.hp;
    out.tideExpected = calcDamage(20, 40, pika.stats.spa, ally.stats.spd,
      { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: b.field, moveType: 'electric', keepsakeFactor: 0.8 });
    game.scenes.pop();
  }

  // ---- B: Tortoise Charm save + non-reset after heal, classic ----
  {
    const ally = rat(20, 'tortoisecharm'); st.party = [ally];
    const geo = () => { const m = makeMon('geodude', 45, SPECIES, MOVES); m.moves = [{ id: 'rockthrow', pp: 15, maxPp: 15 }]; return m; };
    const b = new BattleScene({ kind: 'wild', foe: geo(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    b.execMoveContinue(entry(b, 'foe', MOVES.rockthrow)); drain(b);
    out.tortoiseHpAfterSave = ally.hp;
    out.tortoiseFired = trigIds(b).filter((id) => id === 'tortoisecharm').length;
    ally.hp = ally.maxHp; // heal back to full — the flag must NOT re-arm
    b.execMoveContinue(entry(b, 'foe', MOVES.rockthrow)); drain(b);
    out.tortoiseHpAfterHealHit = ally.hp;
    out.tortoiseFiredTotal = trigIds(b).filter((id) => id === 'tortoisecharm').length;
    game.scenes.pop();
  }

  // ---- B: Second-Wind stage in a real classic battle ----
  {
    const ally = rat(20, 'secondwindribbon'); st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe: rat(5), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    ally.hp = Math.floor(ally.maxHp * 0.22);
    b.execMoveContinue(entry(b, 'foe', MOVES.tackle)); drain(b);
    out.secondWindStage = b.allyStages.spe;
    out.secondWindFired = trigIds(b).includes('secondwindribbon');
    b.execMoveContinue(entry(b, 'foe', MOVES.tackle)); drain(b);
    out.secondWindStageAfter2nd = b.allyStages.spe;
    game.scenes.pop();
  }

  // ---- B: Ember Seed freeze refusal, classic (ON holder / OFF plain) ----
  {
    game.rng.battle = () => 0.05;
    const ally = rat(20, 'embereed'); st.party = [ally];
    const foe = rat(8); foe.moves = [{ id: 'icebeam', pp: 10, maxPp: 10 }];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    b.execMoveContinue(entry(b, 'foe', MOVES.icebeam)); drain(b);
    out.emberStatus = ally.status;
    out.emberRefused = trigIds(b).includes('embereed');
    game.scenes.pop();
    const ally2 = rat(20); st.party = [ally2];
    const foe2 = rat(8); foe2.moves = [{ id: 'icebeam', pp: 10, maxPp: 10 }];
    const b2 = new BattleScene({ kind: 'wild', foe: foe2, returnTo: ow, rt: false });
    game.scenes.push(b2); b2.enter(); drain(b2);
    b2.execMoveContinue(entry(b2, 'foe', MOVES.icebeam)); drain(b2);
    out.emberOffStatus = ally2.status;
    game.scenes.pop();
    game.rng.battle = () => 0.5;
  }

  // ---- B: Gloom Fang classic poison chance (ON 40% / OFF 30%, roll 0.35) ----
  {
    game.rng.battle = () => 0.35;
    const weed = () => { const m = makeMon('weedle', 20, SPECIES, MOVES); m.moves = [{ id: 'poisonsting', pp: 35, maxPp: 35 }]; return m; };
    st.party = [Object.assign(weed(), { keepsake: 'gloomfang' })];
    const b = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    b.execMoveContinue(entry(b, 'ally', MOVES.poisonsting)); drain(b);
    out.gloomStatus = b.foe.status;
    game.scenes.pop();
    st.party = [weed()];
    const b2 = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b2); b2.enter(); drain(b2);
    b2.execMoveContinue(entry(b2, 'ally', MOVES.poisonsting)); drain(b2);
    out.gloomOffStatus = b2.foe.status;
    game.scenes.pop();
    game.rng.battle = () => 0.5;
  }

  // ---- B: Gardenia Sash heal scope, classic (effect.heal only) ----
  {
    const chan = (ks) => { const m = makeMon('chansey', 20, SPECIES, MOVES); m.moves = [{ id: 'recover', pp: 20, maxPp: 20 }]; if (ks) m.keepsake = ks; m.hp = 10; return m; };
    st.party = [chan('gardeniasash')];
    const b = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    b.applyStatusMove({ side: 'ally', mon: b.ally, action: { type: 'move', idx: 0 } }, MOVES.recover); drain(b);
    out.gardeniaHp = b.ally.hp;
    out.gardeniaExpected = 10 + Math.floor(b.ally.maxHp * 0.5 * 1.5);
    game.scenes.pop();
    st.party = [chan(null)];
    const b2 = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
    game.scenes.push(b2); b2.enter(); drain(b2);
    b2.applyStatusMove({ side: 'ally', mon: b2.ally, action: { type: 'move', idx: 0 } }, MOVES.recover); drain(b2);
    out.gardeniaOffHp = b2.ally.hp;
    out.gardeniaOffExpected = 10 + Math.floor(b2.ally.maxHp * 0.5);
    game.scenes.pop();
  }

  // ---- B: Champion's Ribbon XP share, classic ----
  {
    const run = (ks) => {
      st.party = [rat(20, ks)];
      const b = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
      game.scenes.push(b); b.enter(); drain(b);
      b.participants = new Set([b.ally]);
      b.awardXp(() => {}); drain(b);
      const share = b.xpShares.get(b.ally);
      game.scenes.pop();
      return share;
    };
    out.xpSharePlain = run(null);
    out.xpShareRibbon = run('championsribbon');
  }

  // ---- B: RT engine parity + triggers ----
  {
    st.party = [rat(17, 'sparrowfeather')];
    const br = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: true });
    game.scenes.push(br); br.enter(); drain(br);
    const hp0 = br.foe.hp;
    br.rtApplyDamage('ally', MOVES.tackle);
    out.rtSparrowDmg = hp0 - br.foe.hp;
    game.scenes.pop();

    const allyT = rat(20, 'tortoisecharm'); st.party = [allyT];
    const geo = makeMon('geodude', 45, SPECIES, MOVES);
    const br2 = new BattleScene({ kind: 'wild', foe: geo, returnTo: ow, rt: true });
    game.scenes.push(br2); br2.enter(); drain(br2);
    br2.rtApplyDamage('foe', MOVES.rockthrow);
    out.rtTortoiseHp = allyT.hp;
    out.rtTortoiseFired = trigIds(br2).includes('tortoisecharm');
    game.scenes.pop();

    const allyW = rat(20, 'secondwindribbon'); st.party = [allyW];
    const br3 = new BattleScene({ kind: 'wild', foe: rat(5), returnTo: ow, rt: true });
    game.scenes.push(br3); br3.enter(); drain(br3);
    allyW.hp = Math.floor(allyW.maxHp * 0.22);
    br3.rtApplyDamage('foe', MOVES.tackle);
    out.rtSecondWindStage = br3.allyStages.spe;
    game.scenes.pop();

    game.rng.battle = () => 0.05;
    const allyE = rat(20, 'embereed'); st.party = [allyE];
    const foeE = rat(8); foeE.moves = [{ id: 'icebeam', pp: 10, maxPp: 10 }];
    const br4 = new BattleScene({ kind: 'wild', foe: foeE, returnTo: ow, rt: true });
    game.scenes.push(br4); br4.enter(); drain(br4);
    br4.rtApplyDamage('foe', MOVES.icebeam);
    out.rtEmberStatus = allyE.status;
    out.rtEmberLogged = ui.log.some((l) => l.text && l.text.includes('Ember Seed'));
    game.scenes.pop();
    game.rng.battle = () => 0.5;

    const chan = makeMon('chansey', 20, SPECIES, MOVES); chan.keepsake = 'gardeniasash'; chan.hp = 10;
    st.party = [chan];
    const br5 = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: true });
    game.scenes.push(br5); br5.enter(); drain(br5);
    br5.rtApplyEffect('ally', MOVES.recover);
    out.rtGardeniaHp = chan.hp;
    out.rtGardeniaExpected = 10 + Math.floor(chan.maxHp * 0.5 * 1.5);
    game.scenes.pop();

    const weedF = makeMon('weedle', 20, SPECIES, MOVES); weedF.keepsake = 'gloomfang';
    out.rtGloomCd = cooldownMs(MOVES.poisonsting, 50, 50, resolveField('route1', 'classic'), weedF);
    out.rtPlainCd = cooldownMs(MOVES.poisonsting, 50, 50, resolveField('route1', 'classic'));
  }

  // ---- B: Iron Acorn vs a multi-hit move (rulings patch 2026-10-27) ----
  {
    const slapFoe = () => { const m = rat(20); m.moves = [{ id: 'doubleslap', pp: 10, maxPp: 10 }]; return m; };
    const chanAcorn = () => { const m = makeMon('chansey', 20, SPECIES, MOVES); m.keepsake = 'ironacorn'; return m; };
    // Fixed hit count under the deterministic RNG (() => 0.5): the
    // engine's own roll over effect.hits [2,5] lands on 4 hits.
    const hitsRolled = MOVES.doubleslap.effect.hits[0]
      + Math.floor(0.5 * (MOVES.doubleslap.effect.hits[1] - MOVES.doubleslap.effect.hits[0] + 1));
    const perHit = (b, atk, def, f) => calcDamage(20, MOVES.doubleslap.power, atk.stats.atk, def.stats.def,
      { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: b.field, moveType: 'normal', keepsakeFactor: f });
    // classic: foe Rattata Double Slaps the Acorn-holding Chansey
    const allyC = chanAcorn(); st.party = [allyC];
    const bc = new BattleScene({ kind: 'wild', foe: slapFoe(), returnTo: ow, rt: false });
    game.scenes.push(bc); bc.enter(); drain(bc);
    const hpC0 = allyC.hp;
    bc.execMoveContinue(entry(bc, 'foe', MOVES.doubleslap)); drain(bc);
    out.acornSlapDmgClassic = hpC0 - allyC.hp;
    out.acornSlapExpected = perHit(bc, bc.foe, allyC, 0.85) + perHit(bc, bc.foe, allyC, 1) * (hitsRolled - 1);
    out.acornSlapAllWarded = perHit(bc, bc.foe, allyC, 0.85) * hitsRolled;
    out.acornSlapHits = hitsRolled;
    game.scenes.pop();
    // RT: identical setup — parity total expected
    const allyR = chanAcorn(); st.party = [allyR];
    const br = new BattleScene({ kind: 'wild', foe: slapFoe(), returnTo: ow, rt: true });
    game.scenes.push(br); br.enter(); drain(br);
    const hpR0 = allyR.hp;
    br.rtApplyDamage('foe', MOVES.doubleslap);
    out.acornSlapDmgRt = hpR0 - allyR.hp;
    game.scenes.pop();
  }

  // ---- B: foe lever in real trainer battles ----
  {
    const foeOf = (mode, trainer) => {
      st.story.difficulty = mode;
      st.party = [rat(30)];
      const b = new BattleScene({ kind: 'trainer', trainer, returnTo: ow, rt: false });
      game.scenes.push(b); b.enter(); drain(b);
      const first = b.foe.keepsake;
      b.foe.hp = 0; b.checkFaint('foe', () => {}); drain(b);
      const second = b.foe && b.foe.speciesId === 'onix' ? b.foe.keepsake : '(none)';
      game.scenes.pop();
      return { first, second };
    };
    out.leverClassic = foeOf('classic', TRAINERS.brock);
    out.leverChallenge = foeOf('challenge', TRAINERS.brock);
    out.leverStory = foeOf('story', TRAINERS.brock);
    st.story.difficulty = 'challenge';
    st.party = [rat(30)];
    const bw = new BattleScene({ kind: 'wild', foe: rat(10), returnTo: ow, rt: false });
    game.scenes.push(bw); bw.enter(); drain(bw);
    out.wildKeepsakeChallenge = bw.foe.keepsake;
    game.scenes.pop();
    st.story.difficulty = 'classic';
  }

  // ---- B: Give/Take through the real party menu + partner may hold ----
  {
    const partner = makeMon('partner', 12, SPECIES, MOVES);
    st.party = [partner, rat(10)];
    st.bag.sparrowfeather = 1;
    game.openParty();
    out.giveRowSeen = chooseLabel('Pikachu') || chooseLabel('Partner') || !!rowOf('Lv12');
    out.giveMenuSeen = chooseLabel('Give keepsake');
    out.giveItemSeen = chooseLabel('Sparrow Feather');
    out.partnerKeepsake = partner.keepsake;
    out.bagAfterGive = st.bag.sparrowfeather || 0;
    game.openParty();
    chooseLabel('Pikachu') || chooseLabel('Partner') || chooseLabel('Lv12');
    out.takeRowSeen = chooseLabel('Take Sparrow Feather');
    out.partnerKeepsakeAfterTake = partner.keepsake;
    out.bagAfterTake = st.bag.sparrowfeather || 0;
    // Bag-use give flow
    game.useBagItem('sparrowfeather');
    out.bagGiveSeen = chooseLabel('Rattata');
    out.ratKeepsake = st.party[1].keepsake;
  }

  // ---- B: save/load round-trip + legacy migration through the bundle ----
  {
    const holder = rat(9, 'tidepearl');
    const boxed = rat(4, 'gloomfang');
    st.party = [holder]; st.boxes.box1 = [boxed];
    const snap = JSON.parse(JSON.stringify(st));
    out.rtPartyKs = snap.party[0].keepsake;
    out.rtBoxKs = snap.boxes.box1[0].keepsake;
    const mig = migrate(JSON.parse(JSON.stringify(st)));
    out.migPartyKs = mig.party[0].keepsake;
    out.migBoxKs = mig.boxes.box1[0].keepsake;
    const legacy = JSON.parse(JSON.stringify(st));
    legacy.v = 1; delete legacy.party[0].keepsake; delete legacy.boxes.box1[0].keepsake;
    const migL = migrate(legacy);
    out.legacyPartyKs = migL.party[0].keepsake;
    out.legacyBoxKs = migL.boxes.box1[0].keepsake;
    out.legacyValid = validateSave(migL).ok;
  }

  // ---- B: PC deposit/withdraw preserves the slot (real panel callbacks) ----
  {
    const holder = rat(9, 'ironacorn');
    const other = rat(7);
    st.party = [holder, other]; st.boxes.box1 = []; st.currentBox = 'box1';
    ow.openPc();
    out.pcOpen = ui.pcOpen === true;
    ui.pcPanel.cb('click', { act: 'party', idx: 0 });
    ui.pcPanel.cb('click', { act: 'cell', idx: 0 });
    out.pcPartyAfterDeposit = st.party.length;
    out.pcBoxKeepsake = st.boxes.box1[0] && st.boxes.box1[0].keepsake;
    out.pcSameObject = st.boxes.box1[0] === holder;
    ui.pcPanel.cb('click', { act: 'cell', idx: 0 });
    ui.pcPanel.cb('click', { act: 'party', idx: 0 });
    out.pcPartyKeepsakeBack = st.party[0] && st.party[0].keepsake;
    out.pcHolderBack = st.party[0] === holder;
    try { ui.pcPanel.cb('click', { act: 'off', idx: -1 }); } catch (e) { /* panel close path */ }
  }

  // ---- B: Celadon shop — badge gate, purchase, sell exclusion ----
  {
    st.player.money = 10000;
    st.badges.kanto = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge'];
    const stock = ['greatball', 'ultraball', 'superpotion', 'hyperpotion', 'secondwindribbon'];
    ow.openMart(stock);
    chooseLabel('Buy');
    const ribbonRow = rowOf('Second-Wind Ribbon');
    out.shopRibbonRowLate = !!ribbonRow && ribbonRow.disabled !== true;
    out.shopBought = chooseLabel('Second-Wind Ribbon');
    out.bagRibbon = st.bag.secondwindribbon || 0;
    out.moneyAfterBuy = st.player.money;
    chooseLabel('Leave');
    // Sell list must exclude keepsakes even though the ribbon has a price.
    st.bag.potion = 2;
    ow.openMart(stock);
    chooseLabel('Sell');
    out.sellHasRibbon = !!rowOf('Second-Wind Ribbon');
    out.sellHasPotion = !!rowOf('Potion');
    chooseLabel('Back'); chooseLabel('Leave');
    // Early game: the ribbon row is hidden entirely (minBadges gate).
    st.badges.kanto = [];
    delete st.bag.secondwindribbon;
    ow.openMart(stock);
    chooseLabel('Buy');
    out.shopRibbonRowEarly = !!rowOf('Second-Wind Ribbon');
    chooseLabel('Back'); chooseLabel('Leave');
  }

  // ---- B: Hall of Fame gift (Champion's Ribbon), once ----
  {
    delete st.bag.championsribbon;
    st.party = [rat(50)];
    let n = 0;
    ow.runEnding(() => {});
    while (ui.dlg && n++ < 80) { game.input.inject('a'); game.loop.stepTicks(2); game.input.release('a'); game.loop.stepTicks(2); }
    out.hofRibbon = st.bag.championsribbon || 0;
    ow.runEnding(() => {});
    n = 0;
    while (ui.dlg && n++ < 80) { game.input.inject('a'); game.loop.stepTicks(2); game.input.release('a'); game.loop.stepTicks(2); }
    out.hofRibbonAfterSecond = st.bag.championsribbon || 0;
  }

  // ---- B: hidden-item source pickup (Route 2 Sparrow Feather) ----
  {
    ow.loadMap('route2');
    const before = st.bag.sparrowfeather || 0;
    ow.sysInteract(1, 12); // face the hidden tile directly
    out.hiddenSparrow = (st.bag.sparrowfeather || 0) - before;
    out.hiddenFlag = !!st.story.flags['hidden_route2_1_12'];
  }

  console.log('REJUV3-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('REJUV3-RESULT')) || 'REJUV3-RESULT {}').slice(14));

ok('B01 classic Sparrow Feather: damage equals shared-path expectation with x1.25 (gap 3), announced by name',
  res.sparrowDmg > 0 && res.sparrowDmg === res.sparrowExpected && res.sparrowAnnounced === true, JSON.stringify(res));
ok('B02 classic Sparrow Feather OFF (gap 2): plain damage, no factor',
  res.sparrowOffDmg > 0 && res.sparrowOffDmg === res.sparrowOffExpected, JSON.stringify(res));
ok('B03 classic Tide Pearl: Electric hit reduced exactly by the x0.8 shared-path factor',
  res.tideDmg > 0 && res.tideDmg === res.tideExpected, 'dmg=' + res.tideDmg + ' exp=' + res.tideExpected);
ok('B04 classic Tortoise Charm: lethal hit from full HP leaves 1 HP, fired once',
  res.tortoiseHpAfterSave === 1 && res.tortoiseFired === 1, JSON.stringify(res));
ok('B05 classic Tortoise Charm: after healing to full, the next lethal hit KOs — flag never re-arms',
  res.tortoiseHpAfterHealHit === 0 && res.tortoiseFiredTotal === 1, JSON.stringify(res));
ok('B06 classic Second-Wind Ribbon: Speed +1 stage at <=25% HP, once only',
  res.secondWindFired === true && res.secondWindStage === 1 && res.secondWindStageAfter2nd === 1, JSON.stringify(res));
ok('B07 classic Ember Seed: freeze infliction refused on the holder; a plain mon freezes (off)',
  res.emberStatus !== 'freeze' && res.emberRefused === true && res.emberOffStatus === 'freeze', JSON.stringify(res));
ok('B08 classic Gloom Fang: 35% roll poisons with the fang (+10 -> 40%), fails without (30%)',
  res.gloomStatus === 'poison' && res.gloomOffStatus !== 'poison', JSON.stringify(res));
ok('B09 classic Gardenia Sash: Recover on the holder heals x1.5; without, x1',
  res.gardeniaHp === res.gardeniaExpected && res.gardeniaOffHp === res.gardeniaOffExpected
  && res.gardeniaExpected > res.gardeniaOffExpected, JSON.stringify(res));
ok("B10 classic Champion's Ribbon: holder XP share = floor(plain share x 1.2), and larger",
  res.xpSharePlain > 0 && res.xpShareRibbon === Math.floor(res.xpSharePlain * 1.2) && res.xpShareRibbon > res.xpSharePlain,
  JSON.stringify(res));
ok('B11 RT parity: Sparrow Feather damage identical across engines',
  res.rtSparrowDmg > 0 && res.rtSparrowDmg === res.sparrowDmg, 'rt=' + res.rtSparrowDmg + ' classic=' + res.sparrowDmg);
ok('B12 RT Tortoise Charm: lethal RT hit leaves 1 HP via rtCheckFaints',
  res.rtTortoiseHp === 1 && res.rtTortoiseFired === true, JSON.stringify(res));
ok('B13 RT Second-Wind Ribbon: Speed stage +1 in the RT stage system',
  res.rtSecondWindStage === 1, JSON.stringify(res));
ok('B14 RT Ember Seed: freeze refused in RT and surfaced in the battle log',
  res.rtEmberStatus !== 'freeze' && res.rtEmberLogged === true, JSON.stringify(res));
ok('B15 RT Gardenia Sash: RT heal path applies the same x1.5 scope',
  res.rtGardeniaHp === res.rtGardeniaExpected, JSON.stringify(res));
ok('B16 RT Gloom Fang: Poison-move cooldown x0.85 (935 -> 795), plain unchanged',
  res.rtGloomCd === 795 && res.rtPlainCd === 935, JSON.stringify(res));
ok('B17 foe lever in real battles: Classic — lead holds none, ace (Onix) holds Tortoise Charm',
  !!res.leverClassic && res.leverClassic.first === null && res.leverClassic.second === 'tortoisecharm', JSON.stringify(res.leverClassic));
ok('B18 foe lever in real battles: Challenge — every leader member holds its authored piece',
  !!res.leverChallenge && res.leverChallenge.first === 'ironacorn' && res.leverChallenge.second === 'tortoisecharm', JSON.stringify(res.leverChallenge));
ok('B19 foe lever in real battles: Story — no foe holds one, ace included',
  !!res.leverStory && res.leverStory.first === null && res.leverStory.second === null, JSON.stringify(res.leverStory));
ok('B20 wild foes never hold a keepsake, even on Challenge',
  res.wildKeepsakeChallenge === null, JSON.stringify(res));
ok('B21 party-menu Give: partner Pikachu may hold a keepsake (bag -> partner)',
  res.giveMenuSeen === true && res.giveItemSeen === true && res.partnerKeepsake === 'sparrowfeather' && res.bagAfterGive === 0, JSON.stringify(res));
ok('B22 party-menu Take: keepsake returns to the bag pocket',
  res.takeRowSeen === true && res.partnerKeepsakeAfterTake === null && res.bagAfterTake === 1, JSON.stringify(res));
ok('B23 bag-use Give flow equips the chosen party member',
  res.bagGiveSeen === true && res.ratKeepsake === 'sparrowfeather', JSON.stringify(res));
ok('B24 save/load round-trip: keepsake survives JSON + migrate (party + box)',
  res.rtPartyKs === 'tidepearl' && res.rtBoxKs === 'gloomfang' && res.migPartyKs === 'tidepearl' && res.migBoxKs === 'gloomfang', JSON.stringify(res));
ok('B25 legacy v1 save through the bundle: keepsake fills to null and the save validates',
  res.legacyPartyKs === null && res.legacyBoxKs === null && res.legacyValid === true, JSON.stringify(res));
ok('B26 PC: panel opens; deposit moves the SAME mon object with its keepsake into the box',
  res.pcOpen === true && res.pcPartyAfterDeposit === 1 && res.pcBoxKeepsake === 'ironacorn' && res.pcSameObject === true, JSON.stringify(res));
ok('B27 PC: withdraw returns the holder to the party with the slot intact',
  res.pcPartyKeepsakeBack === 'ironacorn' && res.pcHolderBack === true, JSON.stringify(res));
ok('B28 Celadon shop: with 7 badges the Second-Wind Ribbon row is live and purchasable ($3000)',
  res.shopRibbonRowLate === true && res.shopBought === true && res.bagRibbon === 1 && res.moneyAfterBuy === 7000, JSON.stringify(res));
ok('B29 mart sell list excludes keepsakes (non-sellable) but keeps normal items',
  res.sellHasRibbon === false && res.sellHasPotion === true, JSON.stringify(res));
ok('B30 Celadon shop: with 0 badges the ribbon row is hidden (late gate)',
  res.shopRibbonRowEarly === false, JSON.stringify(res));
ok("B31 Hall of Fame gift: Champion's Ribbon granted at registration, never duplicated",
  res.hofRibbon === 1 && res.hofRibbonAfterSecond === 1, JSON.stringify(res));
ok('B32 hidden source: facing the Route 2 hidden tile grants the Sparrow Feather',
  res.hiddenSparrow === 1 && res.hiddenFlag === true, JSON.stringify(res));
ok('B33 classic Iron Acorn (rulings patch): Double Slap at fixed RNG (4 hits) totals first-hit x0.85 + remaining hits full — NOT the whole move warded',
  res.acornSlapHits > 1 && res.acornSlapDmgClassic > 0
  && res.acornSlapDmgClassic === res.acornSlapExpected
  && res.acornSlapDmgClassic !== res.acornSlapAllWarded, JSON.stringify(res));
ok('B34 RT Iron Acorn (rulings patch): identical multi-hit total in the RT engine (parity with classic)',
  res.acornSlapDmgRt > 0 && res.acornSlapDmgRt === res.acornSlapDmgClassic, JSON.stringify(res));

// ================= Part C: real headless Chromium =================
{
  const pubHtml = join(ROOT, 'public', 'index.html');
  const pubJs = join(ROOT, 'public', 'game.js');
  if (!existsSync(pubHtml) || !existsSync(pubJs) || !existsSync('/opt/meta-chromium/chrome')) {
    ok('C01 real-browser parity (skipped: built bundle or chromium missing)', false, 'build first: node scripts/build.mjs');
  } else {
    const CSP = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers
      .find((h) => h.key === 'Content-Security-Policy').value;
    const HTML_B64 = readFileSync(pubHtml).toString('base64');
    const GAME_B64 = readFileSync(pubJs).toString('base64');
    const cport = 9700 + (process.pid % 200);
    const chrome = spawn('/opt/meta-chromium/chrome', [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/rejuv3-chrome-' + cport,
      '--window-size=1280,800', 'about:blank',
    ], { stdio: 'ignore' });
    try {
      let ws;
      for (let i = 0; i < 50 && !ws; i++) {
        try {
          const v = await (await fetch('http://127.0.0.1:' + cport + '/json/version')).json();
          ws = new WebSocket(v.webSocketDebuggerUrl);
          await new Promise((res2, rej) => { ws.onopen = res2; ws.onerror = rej; });
        } catch (e) { await new Promise((r) => setTimeout(r, 200)); }
      }
      if (!ws) throw new Error('chromium did not start');
      let msgId = 0;
      const pending = new Map();
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
        if (d.method === 'Fetch.requestPaused') { void fulfillC(d.params, d.sessionId); }
      };
      const sendAny = (method, params, sessionId) => new Promise((resolve) => {
        const id = ++msgId; pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      });
      async function fulfillC(p, sessionId) {
        const url = p.request.url;
        try {
          if (url.includes('/api/')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"ok":true}').toString('base64') }, sessionId);
          } else if (url.endsWith('/game.js')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: GAME_B64 }, sessionId);
          } else {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: HTML_B64 }, sessionId);
          }
        } catch (e) { /* session gone */ }
      }
      const targets = await sendAny('Target.getTargets');
      const page = targets.result.targetInfos.find((t) => t.type === 'page');
      const session = await sendAny('Target.attachToTarget', { targetId: page.targetId, flatten: true });
      const SID = session.result.sessionId;
      const snd = (method, params) => sendAny(method, params, SID);
      await snd('Page.enable'); await snd('Runtime.enable');
      await snd('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      const evl = async (expr) => {
        const r = await snd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
        return r.result.result.value;
      };
      await snd('Page.navigate', { url: 'http://127.0.0.1:8931/' });
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let canvasOk = false;
      for (let i = 0; i < 100 && !canvasOk; i++) { canvasOk = await evl("typeof Game === 'function' && typeof BattleScene === 'function' && !!document.querySelector('canvas')"); if (!canvasOk) await sleep(150); }
      ok('C00 chromium boots the built bundle (Game + BattleScene live)', canvasOk === true);
      const browserDriver = `(() => {
        const out = {};
        try {
          const game = new Game(null);
          game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
          const st = game.state;
          st.settings.battleStyle = 'classic';
          const ow = new OverworldScene(); game.scenes.push(ow); ow.enter(); ow.loadMap('route1');
          const drain = (b) => { let n = 0; while (b.msgOpen && n++ < 20) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } };
          const entry = (b, side, move) => ({ side, mon: side === 'ally' ? b.ally : b.foe, stats: b.effStats(side === 'ally' ? b.ally : b.foe, side === 'ally' ? b.allyStages : b.foeStages), move, action: { type: 'move', idx: 0 } });
          const rat = (lv, ks) => { const m = makeMon('rattata', lv, SPECIES, MOVES); if (ks) m.keepsake = ks; return m; };
          game.rng.battle = () => 0.5;
          st.party = [rat(17, 'sparrowfeather')];
          const bc = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: false });
          game.scenes.push(bc); bc.enter(); drain(bc);
          const hpC0 = bc.foe.hp;
          bc.execMoveContinue(entry(bc, 'ally', MOVES.tackle)); drain(bc);
          out.dmgClassic = hpC0 - bc.foe.hp;
          out.expected = calcDamage(17, 40, bc.ally.stats.atk, bc.foe.stats.def, { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: bc.field, moveType: 'normal', keepsakeFactor: 1.25 });
          out.announced = game.ui.log.some((l) => l.text && l.text.includes('Sparrow Feather')) || (bc._ksTriggered || []).some((t) => t.id === 'sparrowfeather');
          game.scenes.pop();
          st.party = [rat(17, 'sparrowfeather')];
          const br = new BattleScene({ kind: 'wild', foe: rat(20), returnTo: ow, rt: true });
          game.scenes.push(br); br.enter(); drain(br);
          out.stateRt = br.state;
          const hpR0 = br.foe.hp;
          br.rtApplyDamage('ally', MOVES.tackle);
          out.dmgRt = hpR0 - br.foe.hp;
          game.scenes.pop();
          const allyT = rat(20, 'tortoisecharm'); st.party = [allyT];
          const geo = makeMon('geodude', 45, SPECIES, MOVES);
          const bt = new BattleScene({ kind: 'wild', foe: geo, returnTo: ow, rt: false });
          game.scenes.push(bt); bt.enter(); drain(bt);
          bt.execMoveContinue(entry(bt, 'foe', MOVES.rockthrow)); drain(bt);
          out.tortoiseHp = allyT.hp;
          game.scenes.pop();
        } catch (e) { out.error = String((e && e.stack) || e); }
        return out;
      })()`;
      const br2 = await evl(browserDriver);
      ok('C01 real-browser: Sparrow Feather damage matches the shared-path expectation and is announced',
        !!br2 && br2.dmgClassic > 0 && br2.dmgClassic === br2.expected && br2.announced === true,
        JSON.stringify(br2));
      ok('C02 real-browser: RT and classic deal the SAME Sparrow Feather damage; Tortoise Charm saves at 1 HP',
        !!br2 && br2.stateRt === 'rt' && br2.dmgRt === br2.dmgClassic && br2.tortoiseHp === 1,
        JSON.stringify(br2));
      ws.close();
    } catch (e) {
      ok('C01 real-browser parity (chromium harness)', false, String(e).slice(0, 300));
    } finally {
      try { chrome.kill(); } catch (e) { /* already gone */ }
    }
  }
}

console.log('rejuv-phase3-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
