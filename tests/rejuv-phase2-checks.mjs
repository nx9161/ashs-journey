// rejuv-phase2-checks.mjs — Rejuvenation Phase 2 (ADR-025 §1) proofs:
// Grounds (field effects). Part A: pure units over grounds.mjs /
// formulas.mjs. Part B: the built bundle in a headless Game — field
// resolution in real battles, banner flow, classic + RT damage parity,
// Mire turn-order speed, Bloom healing. Part C: the same damage parity
// proof in real headless Chromium (audit-laptop transport pattern).
// Run: node tests/rejuv-phase2-checks.mjs   (exit 1 on any failure)
// Part C serves dist/standalone.html (the shipped guest build) in headless Chromium — run
// `node scripts/build.mjs` first.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const G = await import(join(ROOT, 'src/data/grounds.mjs'));
const { calcDamage, critChance, gen1Random } = await import(join(ROOT, 'src/engine/formulas.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const ALL_MAPS = { ...MAPS, ...MAPS2, ...MAPS3, ...MAPS4 };

const F = (mapId, mode) => G.resolveField(mapId, mode || 'classic');

// -- the Ground set and its shape law --
{
  const ids = Object.keys(G.GROUNDS);
  ok('A01 fifteen Grounds (14 named + Open)', ids.length === 15
    && ['open', 'bloom', 'storm', 'mire', 'grave', 'ember', 'frost', 'tide', 'rubble', 'mind', 'venom', 'volt', 'marsh', 'pyre', 'spirit'].every((i) => ids.includes(i)), ids.join(','));
  ok('A02 every non-Open Ground: exactly one boost, one dampen, one twist',
    Object.values(G.GROUNDS).filter((g) => g.id !== 'open').every((g) => g.boostType && g.dampenType && g.twist && g.boostType !== g.dampenType));
  ok('A03 Open Ground has no rules and no banner', (() => { const o = G.GROUNDS.open; return !o.boostType && !o.dampenType && !o.twist && o.banner === null; })());
  ok('A04 hard caps: no field factor ever exceeds x1.2 / below x0.8',
    Object.keys(G.GROUNDS).every((id) => { const f = G.resolveFieldForGround(id, 'classic'); return f.boostFactor <= 1.2 && f.dampenFactor >= 0.8; })
    && !JSON.stringify(G.GROUNDS).includes('chip'));
  ok('A05 aliases share the rules object, keep distinct names',
    G.GROUNDS.volt.rules === G.GROUNDS.storm.rules && G.GROUNDS.marsh.rules === G.GROUNDS.bloom.rules
    && G.GROUNDS.pyre.rules === G.GROUNDS.ember.rules && G.GROUNDS.spirit.rules === G.GROUNDS.mire.rules
    && G.GROUNDS.volt.name !== G.GROUNDS.storm.name && G.GROUNDS.spirit.name !== G.GROUNDS.mire.name);
  ok('A06 Mind twist mirrors Grave (status twist, Psychic/Ghost types)',
    G.GROUNDS.mind.twist === 'status' && G.GROUNDS.grave.twist === 'status'
    && G.GROUNDS.mind.boostType === 'psychic' && G.GROUNDS.mind.dampenType === 'ghost'
    && G.GROUNDS.venom.twist === 'poison' && G.GROUNDS.venom.boostType === 'poison');
}

// -- determination: gym + area mappings, full coverage, fallback --
{
  const gymExpect = { gym: 'rubble', 'gym-cerulean': 'tide', 'gym-vermilion': 'volt', 'gym-celadon': 'marsh', 'gym-fuchsia': 'venom', 'gym-saffron': 'mind', 'gym-cinnabar': 'pyre', 'gym-viridian': 'spirit' };
  ok('A07 all 8 gym map ids resolve to their decided Grounds',
    Object.entries(gymExpect).every(([m, g]) => G.groundForMap(m).id === g),
    JSON.stringify(Object.fromEntries(Object.keys(gymExpect).map((m) => [m, G.groundForMap(m).id]))));
  const areaExpect = { route2: 'bloom', powerplant: 'storm', safari: 'mire', tower1: 'grave', tower2: 'grave', cinnabar: 'ember', seafoam: 'frost', stanne: 'tide', route19: 'tide', route20: 'tide', moon1: 'rubble', moon2: 'rubble', rocktunnel: 'rubble', route1: 'open', pallet: 'open', center: 'open', viridian: 'open' };
  ok('A08 spec area mappings (forest/power plant/safari/tower/volcanic/seafoam/surf/rocky/early)',
    Object.entries(areaExpect).every(([m, g]) => G.groundForMap(m).id === g),
    JSON.stringify(Object.fromEntries(Object.keys(areaExpect).map((m) => [m, G.groundForMap(m).id]))));
  const mapIds = Object.keys(ALL_MAPS);
  ok('A09 every merged Kanto map is explicitly assigned in MAP_GROUND (' + mapIds.length + ' maps)',
    mapIds.every((id) => typeof G.MAP_GROUND[id] === 'string'), // W-BG assigned all 432 maps; the old ===70 total-count equality is retired
    'maps=' + mapIds.length + ' assigned=' + Object.keys(G.MAP_GROUND).length
    + ' missing=' + mapIds.filter((id) => !G.MAP_GROUND[id]).join(','));
  ok('A10 unmapped id falls back to Open (no crash, no rules)',
    G.groundForMap('no-such-map').id === 'open' && G.groundForMap(null).id === 'open'
    && F('no-such-map').twist === null && F('no-such-map').boostFactor === 1);
}

// -- damage path: calcDamage applies the Ground factor (single implementation) --
{
  const base = calcDamage(50, 90, 100, 100, {}); // 41
  const rubble = F('gym');
  ok('A11 calcDamage: boosted type x1.2 through the shared path',
    calcDamage(50, 90, 100, 100, { field: rubble, moveType: 'rock' }) === Math.floor(base * 1.2), 'base=' + base);
  ok('A12 calcDamage: dampened type x0.8 through the shared path',
    calcDamage(50, 90, 100, 100, { field: rubble, moveType: 'grass' }) === Math.floor(base * 0.8));
  ok('A13 calcDamage: unaffected type and typeless (confusion) calls unchanged',
    calcDamage(50, 90, 100, 100, { field: rubble, moveType: 'normal' }) === base
    && calcDamage(50, 40, 100, 100, {}) === calcDamage(50, 40, 100, 100, { field: rubble })
    && calcDamage(50, 90, 100, 100, { field: F('route1'), moveType: 'rock' }) === base);
  ok('A14 groundFactorFor mirrors the calcDamage factors',
    G.groundFactorFor(rubble, 'rock') === 1.2 && G.groundFactorFor(rubble, 'grass') === 0.8 && G.groundFactorFor(rubble, 'fire') === 1 && G.groundFactorFor(null, 'rock') === 1);
}

// -- R2 / Story: halved factors, twists disabled, folded into the field --
{
  const story = F('gym', 'story');
  ok('A15 Story: boost x1.1, dampen x0.9, twist null — in the field object itself',
    story.boostFactor === 1.1 && story.dampenFactor === 0.9 && story.twist === null);
  ok('A16 Story damage through calcDamage uses the halved factor',
    calcDamage(50, 90, 100, 100, { field: story, moveType: 'rock' }) === Math.floor(41 * 1.1)
    && calcDamage(50, 90, 100, 100, { field: story, moveType: 'grass' }) === Math.floor(41 * 0.9));
  ok('A17 Story disables EVERY twist (all 15 Grounds resolve twist null)',
    Object.keys(G.GROUNDS).every((id) => G.resolveFieldForGround(id, 'story').twist === null));
  ok('A18 Challenge keeps full Grounds (x1.2/x0.8 + twist)',
    (() => { const c = F('gym', 'challenge'); return c.boostFactor === 1.2 && c.dampenFactor === 0.8 && c.twist === 'rubble'; })());
}

// -- twist helper units (each twist at its hook's pure core) --
{
  ok('A19 heal twist: Bloom/Marsh x1.5, others x1, Story x1',
    G.groundHealMult(F('route2')) === 1.5 && G.groundHealMult(F('gym-celadon')) === 1.5
    && G.groundHealMult(F('gym')) === 1 && G.groundHealMult(F('route2', 'story')) === 1);
  ok('A20 burn/poison twists: +10 points only for the matching status',
    G.groundStatusChanceBonus(F('cinnabar'), 'burn') === 10 && G.groundStatusChanceBonus(F('cinnabar'), 'poison') === 0
    && G.groundStatusChanceBonus(F('gym-fuchsia'), 'poison') === 10 && G.groundStatusChanceBonus(F('gym-fuchsia'), 'burn') === 0
    && G.groundStatusChanceBonus(F('gym'), 'burn') === 0);
  ok('A21 classic accuracy twists: Storm +5 electric, Rubble +5 physical, Grave/Mind -10 status, Frost x0.95',
    Math.abs(G.groundClassicAccuracy(F('powerplant'), { type: 'electric', cat: 'special' }, 0.7) - 0.75) < 1e-9
    && Math.abs(G.groundClassicAccuracy(F('gym'), { type: 'rock', cat: 'physical' }, 0.9) - 0.95) < 1e-9
    && G.groundClassicAccuracy(F('gym'), { type: 'water', cat: 'special' }, 0.9) === 0.9
    && Math.abs(G.groundClassicAccuracy(F('tower1'), { type: 'normal', cat: 'status' }, 0.85) - 0.75) < 1e-9
    && Math.abs(G.groundClassicAccuracy(F('gym-saffron'), { type: 'psychic', cat: 'status' }, 0.85) - 0.75) < 1e-9
    && Math.abs(G.groundClassicAccuracy(F('seafoam'), { type: 'normal', cat: 'physical' }, 0.8) - 0.76) < 1e-9);
  ok('A22 Tide crit bonus: special moves add base Speed/256 via critChance bonus',
    G.groundCritBonus(F('gym-cerulean'), { cat: 'special' }, 128) === 0.5
    && G.groundCritBonus(F('gym-cerulean'), { cat: 'physical' }, 128) === 0
    && Math.abs(critChance(128, { bonus: 0.5 }) - Math.min(1, 128 / 512 + 0.5)) < 1e-9);
  ok('A23 cooldown twist: Storm/Volt electric x0.85, Grave/Mind status x1.25',
    G.groundCooldownMult(F('powerplant'), { type: 'electric', cat: 'special' }) === 0.85
    && G.groundCooldownMult(F('gym-vermilion'), { type: 'electric', cat: 'physical' }) === 0.85
    && G.groundCooldownMult(F('powerplant'), { type: 'ground', cat: 'physical' }) === 1
    && G.groundCooldownMult(F('tower1'), { type: 'normal', cat: 'status' }) === 1.25
    && G.groundCooldownMult(F('gym-saffron'), { type: 'normal', cat: 'status' }) === 1.25
    && G.groundCooldownMult(F('tower1'), { type: 'ghost', cat: 'special' }) === 1);
  ok('A24 RT speed twists: Tide projectile x1.15 special, Rubble lunge x1.15 physical, Frost dodge +40ms',
    G.groundProjectileMult(F('stanne'), { cat: 'special' }) === 1.15 && G.groundProjectileMult(F('stanne'), { cat: 'physical' }) === 1
    && G.groundLungeMult(F('gym'), { cat: 'physical' }) === 1.15 && G.groundLungeMult(F('gym'), { cat: 'special' }) === 1
    && G.groundDodgeIframesBonus(F('seafoam')) === 40 && G.groundDodgeIframesBonus(F('gym')) === 0);
  ok('A25 Mire set logic: unadapted slowed (classic x0.9 speed, RT x0.85 movement), Water/Grass/Ground exempt',
    G.mireSlows(F('safari'), ['normal', 'flying']) === true && G.mireSlows(F('safari'), ['water']) === false
    && G.mireSlows(F('safari'), ['grass', 'poison']) === false && G.mireSlows(F('safari'), ['rock', 'ground']) === false
    && G.groundMireSpeedMult(F('safari'), ['electric']) === 0.9 && G.groundMireMoveMult(F('safari'), ['electric']) === 0.85
    && G.groundMireSpeedMult(F('safari', 'story'), ['electric']) === 1);
  ok('A26 banners: every non-Open Ground carries a banner naming the Ground; Open is quiet',
    Object.values(G.GROUNDS).filter((g) => g.id !== 'open').every((g) => typeof g.banner === 'string' && g.banner.includes(g.name))
    && G.GROUNDS.open.banner === null);
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 4242;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const st = game.state;
  st.settings.battleStyle = 'classic';
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const drain = (b) => { const texts = []; let n = 0; while (b.msgOpen && n++ < 14) { texts.push(b.msg); const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } return texts; };
  const geodude = () => { const m = makeMon('geodude', 20, SPECIES, MOVES); m.moves = [{ id: 'rockthrow', pp: 15, maxPp: 15 }]; return m; };
  const rattata = () => makeMon('rattata', 20, SPECIES, MOVES);

  // ---- classic battle on Pewter Gym (Rubble): field + banner reach the engine ----
  ow.loadMap('gym');
  st.party = [geodude()];
  const bc = new BattleScene({ kind: 'wild', foe: rattata(), returnTo: ow, rt: false });
  game.scenes.push(bc); bc.enter();
  out.classicField = bc.field && bc.field.id;
  out.classicBoost = bc.field && bc.field.boostFactor;
  out.classicTwist = bc.field && bc.field.twist;
  const introTexts = drain(bc);
  out.classicBannerShown = introTexts.some((x) => x === bc.fieldBanner) && !!bc.fieldBanner && bc.fieldBanner.includes('Rubble Ground');
  out.classicStateAfterIntro = bc.state;
  // ---- classic damage on Rubble (deterministic rng: no crit, mid roll) ----
  game.rng.battle = () => 0.5;
  const foeHp0 = bc.foe.hp;
  const entry = { side: 'ally', mon: bc.ally, stats: bc.effStats(bc.ally, bc.allyStages), move: MOVES.rockthrow, action: { type: 'move', idx: 0 } };
  bc.execMoveContinue(entry); drain(bc);
  out.dmgClassic = foeHp0 - bc.foe.hp;
  out.expectedRubble = calcDamage(20, 50, bc.ally.stats.atk, bc.foe.stats.def,
    { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: bc.field, moveType: 'rock' });
  game.scenes.pop();

  // ---- RT battle on the same Ground, same matchup ----
  const br = new BattleScene({ kind: 'wild', foe: rattata(), returnTo: ow, rt: true });
  st.party = [geodude()];
  game.scenes.push(br); br.enter();
  out.rtField = br.field && br.field.id;
  const rtIntroTexts = drain(br);
  out.rtBannerShown = rtIntroTexts.some((x) => x === br.fieldBanner);
  out.rtState = br.state;
  out.rtTint = br.field && br.field.tint;
  const rtHp0 = br.foe.hp;
  br.rtApplyDamage('ally', MOVES.rockthrow);
  out.dmgRt = rtHp0 - br.foe.hp;
  // render one RT frame (cooldown chips + Ground chip + tinted arena)
  try { game.loop.stepTicks(2); out.rtRenderOk = true; } catch (e) { out.rtRenderOk = String(e); }
  game.scenes.pop();

  // ---- symmetric: foe-side Geodude hits ally Rattata on Rubble (RT) ----
  ow.loadMap('gym');
  st.party = [rattata()];
  const foeGeo = geodude();
  const bs = new BattleScene({ kind: 'wild', foe: foeGeo, returnTo: ow, rt: true });
  game.scenes.push(bs); bs.enter(); drain(bs);
  const allyHp0 = bs.ally.hp;
  bs.rtApplyDamage('foe', MOVES.rockthrow);
  out.dmgRtFoeSide = allyHp0 - bs.ally.hp;
  game.scenes.pop();

  // ---- Open Ground baseline on Route 1 (classic): no banner, no factor ----
  ow.loadMap('route1');
  st.party = [geodude()];
  const bo = new BattleScene({ kind: 'wild', foe: rattata(), returnTo: ow, rt: false });
  game.scenes.push(bo); bo.enter();
  out.openField = bo.field && bo.field.id;
  out.openBanner = bo.fieldBanner;
  const openTexts = drain(bo);
  out.openStateAfterIntro = bo.state;
  const oHp0 = bo.foe.hp;
  const oEntry = { side: 'ally', mon: bo.ally, stats: bo.effStats(bo.ally, bo.allyStages), move: MOVES.rockthrow, action: { type: 'move', idx: 0 } };
  bo.execMoveContinue(oEntry); drain(bo);
  out.dmgOpen = oHp0 - bo.foe.hp;
  game.scenes.pop();

  // ---- Story mode in a real battle: field arrives halved + twistless ----
  st.story.difficulty = 'story';
  ow.loadMap('gym');
  st.party = [geodude()];
  const bst = new BattleScene({ kind: 'wild', foe: rattata(), returnTo: ow, rt: false });
  game.scenes.push(bst); bst.enter();
  out.storyField = bst.field ? { boost: bst.field.boostFactor, dampen: bst.field.dampenFactor, twist: bst.field.twist } : null;
  drain(bst); game.scenes.pop();
  st.story.difficulty = 'classic';

  // ---- Mire classic hook: turn-order stats in beginTurn ----
  ow.loadMap('safari');
  const pid = makeMon('pidgey', 20, SPECIES, MOVES);
  st.party = [pid];
  const bm = new BattleScene({ kind: 'wild', foe: makeMon('squirtle', 24, SPECIES, MOVES), returnTo: ow, rt: false });
  game.scenes.push(bm); bm.enter(); drain(bm);
  out.mireField = bm.field && bm.field.id;
  const seen = [];
  bm.execMove = (e) => { seen.push({ side: e.side, spe: e.stats.spe }); };
  bm.playerAction = { type: 'move', idx: 0 };
  bm.foeAction = { type: 'move', idx: 0 };
  bm.beginTurn();
  out.mireSeen = seen.concat(bm.actions.map((a) => ({ side: a.side, spe: a.stats.spe })));
  out.mireAllyRawSpe = pid.stats.spe;
  out.mireFoeRawSpe = bm.foe.stats.spe;
  game.scenes.pop();

  // ---- Bloom classic hook: Recover heals +50% on Route 2 ----
  ow.loadMap('route2');
  const chan = makeMon('chansey', 20, SPECIES, MOVES);
  chan.moves = [{ id: 'recover', pp: 20, maxPp: 20 }];
  chan.hp = 10;
  st.party = [chan];
  const bh = new BattleScene({ kind: 'wild', foe: rattata(), returnTo: ow, rt: false });
  game.scenes.push(bh); bh.enter(); drain(bh);
  out.bloomField = bh.field && bh.field.id;
  bh.applyStatusMove({ side: 'ally', mon: chan, action: { type: 'move', idx: 0 } }, MOVES.recover);
  drain(bh);
  out.healedTo = chan.hp;
  out.healExpected = 10 + Math.floor(chan.maxHp * 0.5 * 1.5);
  game.scenes.pop();

  // ---- RT cooldown hook values in the bundle ----
  out.cdStormElectric = cooldownMs(MOVES.thunderbolt, 50, 50, resolveField('powerplant', 'classic'));
  out.cdPlainElectric = cooldownMs(MOVES.thunderbolt, 50, 50, resolveField('route1', 'classic'));
  out.cdGraveStatus = cooldownMs(MOVES.growl, 50, 50, resolveField('tower1', 'classic'));
  out.cdPlainStatus = cooldownMs(MOVES.growl, 50, 50, resolveField('route1', 'classic'));
  out.cdStoryStorm = cooldownMs(MOVES.thunderbolt, 50, 50, resolveField('powerplant', 'story'));

  // ---- gym teaching signs in the merged map data ----
  const cities = ['pewter', 'cerulean', 'vermilion', 'celadon', 'fuchsia', 'saffron', 'cinnabar', 'viridian'];
  out.gymSigns = cities.filter((id) => (MAPS[id].signs || []).some((s) => s.text.includes('GROUND')));
  out.gymSignTexts = cities.map((id) => { const s = (MAPS[id].signs || []).find((x) => x.text.includes('GROUND')); return s ? s.text : null; });

  console.log('REJUV2-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('REJUV2-RESULT')) || 'REJUV2-RESULT {}').slice(14));

ok('B01 classic battle on Pewter Gym carries the Rubble field (x1.2, rubble twist)',
  res.classicField === 'rubble' && res.classicBoost === 1.2 && res.classicTwist === 'rubble', JSON.stringify(res));
ok('B02 classic banner is announced before the first command',
  res.classicBannerShown === true && res.classicStateAfterIntro === 'command', JSON.stringify(res));
ok('B03 RT battle on the same map carries the same field + banner, enters RT state',
  res.rtField === 'rubble' && res.rtBannerShown === true && res.rtState === 'rt', JSON.stringify(res));
ok('B04 RT render frame runs with field (chip + tint data present)',
  res.rtRenderOk === true && typeof res.rtTint === 'string', JSON.stringify(res.rtRenderOk));
ok('B05 classic Rubble damage equals the shared-path expectation',
  res.dmgClassic > 0 && res.dmgClassic === res.expectedRubble, 'classic=' + res.dmgClassic + ' expected=' + res.expectedRubble);
ok('B06 RT and classic produce the SAME damage on the same Ground + matchup',
  res.dmgRt > 0 && res.dmgRt === res.dmgClassic, 'rt=' + res.dmgRt + ' classic=' + res.dmgClassic);
ok('B07 symmetric: foe-side hit on Rubble deals the same damage as ally-side',
  res.dmgRtFoeSide > 0 && res.dmgRtFoeSide === res.dmgRt, 'foeSide=' + res.dmgRtFoeSide + ' allySide=' + res.dmgRt);
ok('B08 Open Ground: no banner, command flow intact, damage strictly below Rubble',
  res.openField === 'open' && res.openBanner === null && res.openStateAfterIntro === 'command'
  && res.dmgOpen > 0 && res.dmgOpen < res.dmgClassic, JSON.stringify(res));
ok('B09 Story battle field arrives halved (x1.1/x0.9) with twist null',
  !!res.storyField && res.storyField.boost === 1.1 && res.storyField.dampen === 0.9 && res.storyField.twist === null, JSON.stringify(res.storyField));
ok('B10 Mire classic: unadapted ally Speed x0.9 in turn-order stats, adapted foe untouched',
  res.mireField === 'mire' && Array.isArray(res.mireSeen)
  && res.mireSeen.some((e) => e.side === 'ally' && e.spe === Math.max(1, Math.floor(res.mireAllyRawSpe * 0.9)))
  && res.mireSeen.some((e) => e.side === 'foe' && e.spe === res.mireFoeRawSpe), JSON.stringify(res.mireSeen));
ok('B11 Bloom classic: Recover heals +50% in a real battle',
  res.bloomField === 'bloom' && res.healedTo === Math.min(res.healExpected, 999) && res.healedTo > 10 + Math.floor(0.5 * (res.healExpected - 10) / 1.5) + 10, JSON.stringify(res));
ok('B12 RT cooldown hook: Storm electric x0.85, Grave status x1.25, Story storm unscaled',
  res.cdStormElectric === Math.round(res.cdPlainElectric * 0.85) && res.cdGraveStatus === 1875 && res.cdPlainStatus === 1500
  && res.cdStoryStorm === res.cdPlainElectric, JSON.stringify(res));
ok('B13 all 8 gym exteriors carry a Ground teaching sign',
  Array.isArray(res.gymSigns) && res.gymSigns.length === 8, JSON.stringify(res.gymSigns));

// ================= Part C: real headless Chromium =================
{
  const pubHtml = join(ROOT, 'dist', 'standalone.html'); // shipped guest build — the public/ Vercel target was retired in c7575dc1
  const CHROME_BIN = process.env.CHROME_BIN || ['/opt/meta-chromium/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p));
  if (!existsSync(pubHtml) || !CHROME_BIN) {
    ok('C01 real-browser parity (skipped: built bundle or chromium missing)', false, 'build first: node scripts/build.mjs');
  } else {
    // No CSP header is served with the standalone: GitHub Pages serves
    // the guest build without vercel.json's headers, and its
    // script-src 'self' would block the standalone's inline bundle.
    const HTML_B64 = readFileSync(pubHtml).toString('base64'); // standalone.html is self-contained: no separate game.js
    const cport = 9700 + (process.pid % 200);
    // Sandbox Chromium (Hatch) refuses to start without its WebGL domain
    // policy flags; stock Chromium/Chrome neither needs nor accepts them,
    // so they are added only when the policy file is present.
    const HATCH_WGL = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
    const chromeFlags = existsSync(HATCH_WGL) ? ['--hatch-webgl-allowed-domains-file=' + HATCH_WGL, '--hatch-webgl-allowed-domains-sha256=' + createHash('sha256').update(readFileSync(HATCH_WGL)).digest('hex')] : [];
    const chrome = spawn(CHROME_BIN, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', ...chromeFlags,
      '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/rejuv2-chrome-' + cport,
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
          } else {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }], body: HTML_B64 }, sessionId);
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
      // The canvas element is static HTML — the real boot signal is the
      // bundle's lexical bindings becoming visible (game.js is ~1MB and
      // takes a moment to parse/execute in the fresh profile).
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
          const ow = new OverworldScene(); game.scenes.push(ow); ow.enter(); ow.loadMap('gym');
          const drain = (b) => { const texts = []; let n = 0; while (b.msgOpen && n++ < 14) { texts.push(b.msg); const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } return texts; };
          const geodude = () => { const m = makeMon('geodude', 20, SPECIES, MOVES); m.moves = [{ id: 'rockthrow', pp: 15, maxPp: 15 }]; return m; };
          game.rng.battle = () => 0.5;
          st.party = [geodude()];
          const bc = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 20, SPECIES, MOVES), returnTo: ow, rt: false });
          game.scenes.push(bc); bc.enter();
          out.fieldClassic = bc.field && bc.field.id;
          const textsC = drain(bc);
          out.bannerClassic = textsC.some((x) => x === bc.fieldBanner);
          const hpC0 = bc.foe.hp;
          bc.execMoveContinue({ side: 'ally', mon: bc.ally, stats: bc.effStats(bc.ally, bc.allyStages), move: MOVES.rockthrow, action: { type: 'move', idx: 0 } });
          drain(bc);
          out.dmgClassic = hpC0 - bc.foe.hp;
          out.expected = calcDamage(20, 50, bc.ally.stats.atk, bc.foe.stats.def, { stab: true, effectiveness: 1, crit: false, random: gen1Random(() => 0.5), field: bc.field, moveType: 'rock' });
          game.scenes.pop();
          st.party = [geodude()];
          const br = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 20, SPECIES, MOVES), returnTo: ow, rt: true });
          game.scenes.push(br); br.enter();
          out.fieldRt = br.field && br.field.id;
          const textsR = drain(br);
          out.bannerRt = textsR.some((x) => x === br.fieldBanner);
          out.stateRt = br.state;
          const hpR0 = br.foe.hp;
          br.rtApplyDamage('ally', MOVES.rockthrow);
          out.dmgRt = hpR0 - br.foe.hp;
          game.scenes.pop();
        } catch (e) { out.error = String((e && e.stack) || e); }
        return out;
      })()`;
      const br2 = await evl(browserDriver);
      ok('C01 real-browser: classic + RT battles on Rubble carry the field and banner',
        !!br2 && br2.fieldClassic === 'rubble' && br2.fieldRt === 'rubble' && br2.bannerClassic === true && br2.bannerRt === true && br2.stateRt === 'rt',
        JSON.stringify(br2));
      ok('C02 real-browser: RT and turn-based deal the SAME damage on the same Ground + matchup',
        !!br2 && br2.dmgClassic > 0 && br2.dmgRt === br2.dmgClassic && br2.dmgClassic === br2.expected,
        JSON.stringify(br2));
      ws.close();
    } catch (e) {
      ok('C01 real-browser parity (chromium harness)', false, String(e).slice(0, 300));
    } finally {
      try { chrome.kill(); } catch (e) { /* already gone */ }
    }
  }
}

console.log('rejuv-phase2-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
