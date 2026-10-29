// johto-systems-checks.mjs — Arc 2 Stage J6 (arc systems) proofs.
// Part A: pure units — egg-group data completion (Part A), the
// breeding/egg engine (deposit/compat/production/hatch/guards/
// delivery), apricorn trees + Kurt crafting, the apricorn-ball rules
// against the real Gen-1 catch calc, Link Transfer widening, and the
// save pair (client schema + server validator) round-tripping a
// state that carries every J6 field.
// Part B: the built bundle in a headless Game — the Day-Care couple
// through the real NPC path (story egg once, deposit, production,
// collect, withdraw), a hatch on the real step hook, an apricorn
// tree through the real interact path, Kurt's order through the real
// NPC path, and catch-rule proofs inside BOTH battle engines.
// Run: node tests/johto-systems-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ================= Part A: pure units =================
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2, SPECIES_JOHTO);
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const MOVES = Object.assign({}, MV1, MOVES2);
const { ITEMS, BALLS } = await import(join(ROOT, 'src/data/items.mjs'));
const { MAPS6 } = await import(join(ROOT, 'src/data/maps6.mjs'));
const { J3_KIND_CHARS } = await import(join(ROOT, 'src/engine/tiles.mjs'));
const { gen1Catch } = await import(join(ROOT, 'src/engine/formulas.mjs'));
const { defaultState, makeMon } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const JS = await import(join(ROOT, 'src/game/johto-systems.mjs'));
const BR = await import(join(ROOT, 'src/game/ball-rules.mjs'));
const mon = (id, lv) => makeMon(id, lv || 120, SPECIES, MOVES);

// ---- Part A: egg-group data completion ----
{
  const nonForm = Object.values(SPECIES).filter((s) => !s.form);
  ok('A01 every non-form species (dex 1-251 + partner) now carries eggGroups + hatchCounter',
    nonForm.every((s) => Array.isArray(s.eggGroups) && s.eggGroups.length > 0 && Number.isInteger(s.hatchCounter)),
    nonForm.filter((s) => !s.eggGroups).map((s) => s.id).join(','));
  ok('A02 PokeAPI facts spot-proven: bulbasaur monster/plant 20, ditto [ditto], mew no-eggs 120, articuno no-eggs 80, charmander monster/dragon 20',
    JSON.stringify(SPECIES.bulbasaur.eggGroups) === JSON.stringify(['monster', 'plant']) && SPECIES.bulbasaur.hatchCounter === 20
    && JSON.stringify(SPECIES.ditto.eggGroups) === JSON.stringify(['ditto'])
    && SPECIES.mew.eggGroups.includes('no-eggs') && SPECIES.mew.hatchCounter === 120
    && SPECIES.articuno.eggGroups.includes('no-eggs') && SPECIES.articuno.hatchCounter === 80
    && JSON.stringify(SPECIES.charmander.eggGroups) === JSON.stringify(['monster', 'dragon']));
  ok('A03 the six guests got theirs in species2: togepi baby + no-eggs + hatch 10; lugia/hooh no-eggs (legendary = unbreedable by data); marill water1/fairy',
    SPECIES.togepi.baby === true && SPECIES.togepi.eggGroups.includes('no-eggs') && SPECIES.togepi.hatchCounter === 10
    && SPECIES.lugia.eggGroups.includes('no-eggs') && SPECIES.hooh.eggGroups.includes('no-eggs')
    && JSON.stringify(SPECIES.marill.eggGroups) === JSON.stringify(['water1', 'fairy']));
}

// ---- Part B: breeding rules ----
{
  ok('A04 compat matrix: same-group YES (bulbasaur x ivysaur share monster/plant)',
    JS.pairCompatible(mon('bulbasaur'), mon('ivysaur')) === true);
  ok('A05 compat matrix: Ditto YES with a breedable partner (ditto x eevee), either slot',
    JS.pairCompatible(mon('ditto'), mon('eevee')) === true && JS.pairCompatible(mon('eevee'), mon('ditto')) === true);
  ok('A06 compat matrix: no-eggs NO (mewtwo x ditto), legendary NO (lugia x ditto), baby NO (pichu x ditto, togepi x pikachu)',
    JS.pairCompatible(mon('mewtwo'), mon('ditto')) === false
    && JS.pairCompatible(mon('lugia'), mon('ditto')) === false
    && JS.pairCompatible(mon('pichu'), mon('ditto')) === false
    && JS.pairCompatible(mon('togepi'), mon('pikachu')) === false);
  ok('A07 compat matrix: unrelated groups NO (bulbasaur monster/plant x pikachu ground/fairy); eggs never pair',
    JS.pairCompatible(mon('bulbasaur'), mon('pikachu')) === false
    && JS.pairCompatible(JS.makeEggMon('eevee'), mon('eevee')) === false);
  ok('A08 offspring rule: first-deposited parent line base (venusaur+charizard -> bulbasaur); Ditto yields the OTHER parent (ditto+eevee -> eevee, eevee+ditto -> eevee); branch base walks back (poliwhirl -> poliwag)',
    JS.offspringOf([mon('venusaur'), mon('charizard')]) === 'bulbasaur'
    && JS.offspringOf([mon('ditto'), mon('eevee')]) === 'eevee'
    && JS.offspringOf([mon('eevee'), mon('ditto')]) === 'eevee'
    && JS.baseStageOf('poliwhirl') === 'poliwag' && JS.baseStageOf('politoed') === 'poliwag');
}

// ---- deposit / withdraw / guards ----
{
  const st = defaultState();
  st.party = [mon('charizard', 150), mon('venusaur', 150), mon('eevee', 120)];
  const d1 = JS.depositToDaycare(st, 0);
  ok('A09 deposit moves party -> daycare (status cleared), withdraw returns it',
    d1.ok && st.daycare.length === 1 && st.daycare[0].speciesId === 'charizard' && st.party.length === 2
    && JS.withdrawFromDaycare(st, 0).ok && st.party.length === 3 && st.daycare.length === 0);
  const stP = defaultState();
  stP.party = [mon('partner', 120), mon('pidgey', 120)];
  ok('A10 deposit guards: the partner refuses (boxCheck precedent)',
    JS.depositToDaycare(stP, 0).reason === 'partner' && stP.party.length === 2 && stP.daycare.length === 0);
  const stE = defaultState();
  stE.party = [JS.makeEggMon('eevee'), mon('pidgey', 120)];
  const rEgg = JS.depositToDaycare(stE, 0);
  const rLast = JS.depositToDaycare(stE, 1);
  ok('A11 deposit guards: an Egg cannot be deposited; the last non-egg mon cannot leave an all-egg party',
    rEgg.reason === 'is-egg' && rLast.reason === 'last-non-egg' && stE.party.length === 2 && stE.daycare.length === 0);
  const stF = defaultState();
  stF.party = [mon('eevee', 120), mon('ditto', 120), mon('pidgey', 120), mon('rattata', 120)];
  JS.depositToDaycare(stF, 0); JS.depositToDaycare(stF, 0);
  ok('A12 deposit guards: the Day-Care holds at most 2',
    JS.depositToDaycare(stF, 0).reason === 'daycare-full' && stF.daycare.length === 2);
}

// ---- production on steps + collection ----
{
  const st = defaultState();
  st.story.arc = 'johto';
  st.party = [mon('snorlax', 150)];
  st.daycare = [mon('venusaur', 150), mon('charizard', 150)];
  JS.rescheduleEgg(st);
  const at = st.daycareEggAt;
  let ready = false;
  for (let i = 0; i < JS.EGG_PRODUCTION_STEPS - 1; i++) ready = JS.johtoStepTick(st).eggReady || ready;
  const notYet = !st.daycareEgg && !ready;
  const lastTick = JS.johtoStepTick(st);
  ok('A13 egg production: a compatible pair produces after exactly 200 walked steps (not 199)',
    at === JS.EGG_PRODUCTION_STEPS && notYet && lastTick.eggReady === true
    && st.daycareEgg && st.daycareEgg.speciesId === 'bulbasaur' && st.daycareEgg.eggSteps === 500,
    JSON.stringify({ at, daycareEgg: st.daycareEgg }));
  const col = JS.collectDaycareEgg(st);
  ok('A14 collecting delivers a real egg mon to the party (egg:true, eggSteps from hatchCounter x25) and re-arms production',
    col.ok && col.dest === 'party' && st.daycareEgg === null
    && st.party.some((m) => m.egg === true && m.speciesId === 'bulbasaur' && m.eggSteps === 500)
    && st.daycareEggAt === st.stepsTotal + JS.EGG_PRODUCTION_STEPS);
  const stI = defaultState();
  stI.daycare = [mon('bulbasaur'), mon('pikachu')]; // incompatible
  JS.rescheduleEgg(stI);
  for (let i = 0; i < 300; i++) JS.johtoStepTick(stI);
  ok('A15 an incompatible pair never produces (300 steps, no egg, no schedule)',
    stI.daycareEgg === null && stI.daycareEggAt === null);
}

// ---- story egg + hatch ----
{
  const st = defaultState();
  const g1 = JS.giveStoryEgg(st, () => 0);
  ok('A16 story egg: the pool\'s first pick (rng 0) is pichu, an egg mon with 250 steps (baby hatchCounter 10 x 25)',
    g1.ok && g1.speciesId === 'pichu' && st.party[0].egg === true && st.party[0].eggSteps === 250
    && JS.STORY_EGG_POOL.join(',') === 'pichu,cleffa,igglybuff,togepi,magby,elekid,smoochum,tyrogue'
    && JS.STORY_EGG_POOL.every((id) => SPECIES[id] && SPECIES[id].baby === true));
  const stJ = defaultState(); stJ.story.arc = 'johto';
  const eggJ = JS.makeEggMon('pichu'); eggJ.eggSteps = 2;
  stJ.party = [mon('eevee', 120), eggJ];
  const t1 = JS.johtoStepTick(stJ);
  const stillEgg = eggJ.egg === true && eggJ.eggSteps === 1 && t1.hatched.length === 0;
  const t2 = JS.johtoStepTick(stJ);
  ok('A17 hatch in a Johto state: countdown per step, hatches at the band floor 101, egg fields cleared, dex registers caught',
    stillEgg && t2.hatched.length === 1 && eggJ.level === 101 && eggJ.egg === undefined && eggJ.eggSteps === undefined
    && stJ.dex.caught[172] === true && eggJ.hp === eggJ.maxHp);
  const stK = defaultState(); // kanto arc by default
  const eggK = JS.makeEggMon('togepi'); eggK.eggSteps = 1;
  stK.party = [mon('eevee', 50), eggK];
  JS.johtoStepTick(stK);
  ok('A18 hatch in a Kanto state: band floor is 1',
    eggK.level === 1 && eggK.egg === undefined && stK.dex.caught[175] === true);
}

// ---- delivery refusal (all-full mutates nothing) ----
{
  const st = defaultState();
  st.party = Array.from({ length: 6 }, () => mon('pidgey', 10));
  for (let i = 1; i <= 12; i++) st.boxes['box' + i] = Array.from({ length: 30 }, () => mon('rattata', 10));
  st.daycareEgg = { speciesId: 'eevee', eggSteps: 500 };
  const before = JSON.stringify(st);
  const res = JS.collectDaycareEgg(st);
  ok('A19 all-full delivery refusal mutates NOTHING (party + 12 full boxes; the egg stays waiting)',
    res.ok === false && res.reason === 'all-full' && JSON.stringify(st) === before && st.daycareEgg !== null);
  const stB = defaultState();
  stB.party = Array.from({ length: 6 }, () => mon('pidgey', 10));
  const resB = JS.deliverEggCapSafe(stB, 'eevee');
  ok('A20 party-full delivery falls to the first PC box with room',
    resB.ok && resB.dest === 'box' && resB.boxId === 'box1' && stB.boxes.box1.length === 1 && stB.boxes.box1[0].egg === true);
}

// ---- save pair round-trip ----
{
  const st = defaultState();
  st.story.arc = 'johto'; st.story.region = 'johto';
  st.party = [mon('charizard', 150), JS.makeEggMon('togepi')];
  st.daycare = [mon('ditto', 120), mon('eevee', 121)];
  st.daycareEgg = { speciesId: 'pichu', eggSteps: 250 };
  st.stepsTotal = 4321;
  st.gather = { 'azalea:19,1': 4521, 'r37:20,12': 4000 };
  st.kurtOrder = { ball: 'levelball', readyAt: 4571 };
  const filled = SCH.migrate(clone(st));
  const c = SCH.validateSave(clone(filled));
  const s = VAL.validateSave(clone(filled));
  ok('A21 save round-trip through BOTH validators: daycare pair + party egg + daycareEgg + gather rows + kurt order + stepsTotal',
    c.ok && s.ok, JSON.stringify({ c: c.errors, s: s.errors }));
  const legacy = SCH.migrate(clone(defaultState()));
  ok('A22 a legacy-shaped save (J6 fields deleted) fills defaults and validates on both sides',
    (() => { const l = clone(st); for (const k of ['daycare', 'daycareEgg', 'daycareEggAt', 'stepsTotal', 'gather', 'kurtOrder']) delete l[k];
      const f = SCH.migrate(l); return f.daycare.length === 0 && f.stepsTotal === 0 && f.kurtOrder === null
        && SCH.validateSave(clone(f)).ok && VAL.validateSave(clone(f)).ok; })());
  const badC = clone(filled); badC.daycare = [mon('eevee'), mon('ditto'), mon('pidgey')];
  const badS = clone(filled); badS.gather = { 'not a tree': 5 };
  const badS2 = clone(filled); badS2.kurtOrder = { ball: 'notaball', readyAt: 1 };
  const badS3 = clone(filled); badS3.party[1].egg = 'yes';
  ok('A23 validator pair rejects J6 abuses: 3 daycare guests (client), bad gather key (server), non-ball kurt order (server), non-boolean egg (server)',
    SCH.validateSave(badC).errors.includes('bad-daycare')
    && VAL.validateSave(badS).errors.includes('bad-gather-entry')
    && VAL.validateSave(badS2).errors.includes('bad-kurt-order')
    && VAL.validateSave(badS3).errors.includes('bad-egg'));
  const maximal = defaultState();
  maximal.player.name = 'ASH'; maximal.player.rivalName = 'GARY';
  for (const id of Object.keys(ITEMS)) maximal.bag[id] = 999;
  const rm = VAL.validateSave(clone(maximal));
  ok('A24 cheat maximal stock at 183 items validates server-side (175 + 8 Sinnoh badges, Arc 4 Stage S0 — supersedes the Stage F0 count)',
    Object.keys(ITEMS).length === 183 && rm.ok, JSON.stringify(rm.errors));
}

// ---- apricorn trees ----
{
  const apChar = J3_KIND_CHARS.apricorn;
  let tilesOk = true;
  for (const t of JS.APRICORN_TREES) {
    const m = MAPS6[t.map];
    if (!m || !m.rows[t.y] || m.rows[t.y][t.x] !== apChar) tilesOk = false;
  }
  const perColour = {};
  for (const t of JS.APRICORN_TREES) perColour[t.item] = (perColour[t.item] || 0) + 1;
  ok('A25 APRICORN_TREES: 20 trees, every one on a real apricorn tile in maps6, spread over azalea/kurt-house/r33/r37, all 7 colours present at least twice',
    JS.APRICORN_TREES.length === 20 && tilesOk
    && [...new Set(JS.APRICORN_TREES.map((t) => t.map))].sort().join(',') === 'azalea,kurt-house,r33,r37'
    && JS.APRICORN_IDS.every((id) => perColour[id] >= 2),
    JSON.stringify(perColour));
  const st = defaultState();
  const tree = JS.APRICORN_TREES[0];
  const p1 = JS.pickApricorn(st, tree);
  const bagAfter1 = st.bag[tree.item];
  const p2 = JS.pickApricorn(st, tree);
  st.stepsTotal += JS.APRICORN_REGROW_STEPS - 1;
  const p3 = JS.pickApricorn(st, tree);
  st.stepsTotal += 1;
  const p4 = JS.pickApricorn(st, tree);
  ok('A26 pick + rest + regrow: pick yields the tree\'s apricorn, the tree rests exactly 200 steps (still resting at 199), then fruits again',
    p1.ok && p1.item === tree.item && bagAfter1 === 1
    && !p2.ok && p2.remaining === JS.APRICORN_REGROW_STEPS
    && !p3.ok && p3.remaining === 1 && p4.ok && st.bag[tree.item] === 2);
}

// ---- Kurt ----
{
  ok('A27 Kurt mapping is canon: red->Level, blue->Lure, yellow->Moon, green->Friend, pink->Love, white->Fast, black->Heavy',
    JSON.stringify(JS.APRICORN_TO_BALL) === JSON.stringify({
      redapricorn: 'levelball', blueapricorn: 'lureball', yellowapricorn: 'moonball',
      greenapricorn: 'friendball', pinkapricorn: 'loveball', whiteapricorn: 'fastball', blackapricorn: 'heavyball' }));
  const st = defaultState();
  st.bag.redapricorn = 1; st.bag.blueapricorn = 1;
  const o1 = JS.kurtPlaceOrder(st, 'redapricorn');
  const o2 = JS.kurtPlaceOrder(st, 'blueapricorn');
  const early = JS.kurtCollect(st);
  st.stepsTotal += JS.KURT_CRAFT_STEPS - 1;
  const mid = JS.kurtOrderStatus(st);
  st.stepsTotal += 1;
  const done = JS.kurtCollect(st);
  ok('A28 Kurt order lifecycle: takes the apricorn, ONE order at a time (second refused busy), ready after exactly 250 steps (not 249), collect yields the Level Ball',
    o1.ok && o1.ball === 'levelball' && st.bag.redapricorn === undefined
    && !o2.ok && o2.reason === 'busy' && st.bag.blueapricorn === 1
    && !early.ok && early.remaining === 250 && mid.busy && !mid.ready && mid.remaining === 1
    && done.ok && done.ball === 'levelball' && st.bag.levelball === 1 && st.kurtOrder === null);
  ok('A29 the 7 balls join BALLS + ITEMS (pocket balls, rule-carrying, NO price = never mart stock); the 7 apricorns are pocket items with no price; every desc states its real condition',
    ['levelball', 'lureball', 'moonball', 'loveball', 'fastball', 'friendball', 'heavyball'].every((id) => BALLS[id] && BALLS[id].rule && ITEMS[id] && ITEMS[id].pocket === 'balls' && ITEMS[id].price === undefined)
    && JS.APRICORN_IDS.every((id) => ITEMS[id] && ITEMS[id].pocket === 'items' && ITEMS[id].price === undefined)
    && BALLS.levelball.desc.includes('x8') && BALLS.lureball.desc.includes('fishing')
    && BALLS.moonball.desc.includes('Moon Stone') && BALLS.loveball.desc.includes('same species')
    && BALLS.fastball.desc.includes('Speed') && BALLS.friendball.desc.includes('friendship')
    && BALLS.heavyball.desc.includes('tier'));
}

// ---- ball rules against the real catch calc ----
{
  const foeOf = (id, level) => ({ speciesId: id, level: level || 50 });
  const leadOf = (id, level) => ({ speciesId: id, level: level || 50 });
  ok('A30 level rule: lead/foe ratio >=4 -> 8, >2 -> 4, >1 -> 2, else 1',
    BR.ballBonusFor('levelball', { lead: leadOf('charizard', 200), foe: foeOf('charizard', 50) }) === 8
    && BR.ballBonusFor('levelball', { lead: leadOf('charizard', 150), foe: foeOf('charizard', 50) }) === 4
    && BR.ballBonusFor('levelball', { lead: leadOf('charizard', 75), foe: foeOf('charizard', 50) }) === 2
    && BR.ballBonusFor('levelball', { lead: leadOf('charizard', 50), foe: foeOf('charizard', 50) }) === 1);
  ok('A31 lure rule: x3 only when the battle began by fishing',
    BR.ballBonusFor('lureball', { lead: leadOf('gyarados'), foe: foeOf('gyarados'), fished: true }) === 3
    && BR.ballBonusFor('lureball', { lead: leadOf('gyarados'), foe: foeOf('gyarados'), fished: false }) === 1);
  ok('A32 moon rule: x4 on a Moon-Stone evolver (clefairy, nidorina), x1 otherwise (pidgey)',
    BR.ballBonusFor('moonball', { lead: leadOf('pidgey'), foe: foeOf('clefairy') }) === 4
    && BR.ballBonusFor('moonball', { lead: leadOf('pidgey'), foe: foeOf('nidorina') }) === 4
    && BR.ballBonusFor('moonball', { lead: leadOf('pidgey'), foe: foeOf('pidgey') }) === 1);
  ok('A33 love rule: x8 when foe species == lead species, else 1 (gender clause dropped — no gender system)',
    BR.ballBonusFor('loveball', { lead: leadOf('charizard'), foe: foeOf('charizard') }) === 8
    && BR.ballBonusFor('loveball', { lead: leadOf('venusaur'), foe: foeOf('charizard') }) === 1);
  ok('A34 fast rule: x4 when the foe\'s base Speed >= 100 (jolteon 130, charizard 100), x1 below (pidgey 56)',
    BR.ballBonusFor('fastball', { lead: leadOf('pidgey'), foe: foeOf('jolteon') }) === 4
    && BR.ballBonusFor('fastball', { lead: leadOf('pidgey'), foe: foeOf('charizard') }) === 4
    && BR.ballBonusFor('fastball', { lead: leadOf('pidgey'), foe: foeOf('pidgey') }) === 1);
  ok('A35 heavy rule by battler tier: S x1 (pidgey), M x1.5 (squirtle), L x2.5 (onix, blastoise); mapping carries XL x4',
    BR.ballBonusFor('heavyball', { lead: leadOf('pidgey'), foe: foeOf('pidgey') }) === 1
    && BR.ballBonusFor('heavyball', { lead: leadOf('pidgey'), foe: foeOf('squirtle') }) === 1.5
    && BR.ballBonusFor('heavyball', { lead: leadOf('pidgey'), foe: foeOf('onix') }) === 2.5
    && BR.ballBonusFor('heavyball', { lead: leadOf('pidgey'), foe: foeOf('blastoise') }) === 2.5
    && BR.HEAVY_TIER_BONUS.XL === 4);
  ok('A36 friend rule: flat x1 by design — its effect is the post-catch friendship set (200)',
    BR.ballBonusFor('friendball', { lead: leadOf('pidgey'), foe: foeOf('pidgey') }) === 1
    && BR.FRIEND_BALL_FRIENDSHIP === 200);
  // Each rule, proven INSIDE gen1Catch (the calc both engines call):
  // a stub rng whose first roll lands between the species' raw catch
  // rate and the rule-scaled rate, with the foe at 1 HP (HP factor
  // capped) — the unscaled throw fails the first roll, the scaled
  // throw catches.
  const seqRng = (vals) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)]; };
  const catchCase = (ballId, ctx, foeId, roll) => {
    const sp = SPECIES[foeId];
    const foeMon = { maxHp: 100, hp: 1, status: null };
    const raw = gen1Catch(100, 1, sp.catchRate, ballId, null, seqRng([roll, 0.5]));
    const scaledRate = BR.ballCatchRate(sp.catchRate, ballId, { ...ctx, foe: foeOf(foeId, ctx.foeLevel), lead: leadOf(ctx.leadId, ctx.leadLevel) });
    const scaled = gen1Catch(100, 1, scaledRate, ballId, null, seqRng([roll, 0.5]));
    return { raw, scaled, scaledRate };
  };
  const cLevel = catchCase('levelball', { leadId: 'charizard', leadLevel: 200, foeLevel: 50 }, 'charizard', 0.9);
  const cLure = catchCase('lureball', { leadId: 'pidgey', leadLevel: 50, foeLevel: 50, fished: true }, 'gyarados', 0.4);
  const cMoon = catchCase('moonball', { leadId: 'pidgey', leadLevel: 50, foeLevel: 50 }, 'clefairy', 0.78);
  const cLove = catchCase('loveball', { leadId: 'charizard', leadLevel: 50, foeLevel: 50 }, 'charizard', 0.9);
  const cFast = catchCase('fastball', { leadId: 'pidgey', leadLevel: 50, foeLevel: 50 }, 'jolteon', 0.59);
  const cHeavy = catchCase('heavyball', { leadId: 'pidgey', leadLevel: 50, foeLevel: 50 }, 'onix', 0.4);
  ok('A37 all six rate rules proven inside gen1Catch: unscaled throw fails the first roll, rule-scaled throw catches (level/lure/moon/love/fast/heavy)',
    [cLevel, cLure, cMoon, cLove, cFast, cHeavy].every((c) => c.raw.caught === false && c.scaled.caught === true),
    JSON.stringify([cLevel, cLure, cMoon, cLove, cFast, cHeavy].map((c) => c.scaledRate)));
}

// ---- Part D: Link Transfer widening ----
{
  const lines = {
    kadabra: 'alakazam', machoke: 'machamp', graveler: 'golem', haunter: 'gengar', // Kanto four
    onix: 'steelix', scyther: 'scizor', seadra: 'kingdra', porygon: 'porygon2', // Johto trade lines
    poliwhirl: 'politoed', slowpoke: 'slowking', // the `evos` branch pair
  };
  ok('A38 Link Transfer scan sees all ten trade lines (4 Kanto + 6 Johto incl. the evos-branch pair poliwhirl->politoed, slowpoke->slowking)',
    Object.entries(lines).every(([from, to]) => JS.tradeEvolutionsOf(from).some((e) => e.to === to)),
    Object.keys(lines).filter((f) => !JS.tradeEvolutionsOf(f).length).join(','));
  ok('A39 branch parents keep their primary evo intact (poliwhirl evo is still the water-stone poliwrath; the scan ADDS, never replaces)',
    SPECIES.poliwhirl.evo && SPECIES.poliwhirl.evo.to === 'poliwrath'
    && JS.tradeEvolutionsOf('poliwhirl').length === 1 && JS.tradeEvolutionsOf('eevee').length === 0);
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
    if (!cond) { Q.failures++; console.error('J6-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('j6-pass ' + name);
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
  function choose(g, pred) {
    if (!g.ui.menuOpen) return false;
    var items = g.ui.menu.items;
    var i = items.findIndex(function (it) { return !it.disabled && pred(it); });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3); drain(g);
    return true;
  }
  function leaveMenu(g) { return choose(g, function (it) { return it.value === null || it.value === -1; }); }
  function talkKind(g, ow, kind) {
    var npc = ow.map.npcs.find(function (n) { return n.johto === kind; });
    if (!npc) return null;
    ow.sysNpc(npc);
    drain(g);
    return npc;
  }
  function settleBattle(g, scene) {
    var n = 0;
    while (g.scenes.top === scene && n < 40) { tk(g, 30); drain(g); n++; }
  }

  var g = mkGame(20261029); boot(g);
  var st = g.state;
  st.story.arc = 'johto'; st.story.region = 'johto';
  st.story.flags.johto_well_cleared = true;
  st.party = [makeMon('charizard', 150, SPECIES, MOVES), makeMon('venusaur', 150, SPECIES, MOVES), makeMon('snorlax', 150, SPECIES, MOVES)];

  // ---- B1: Day-Care — story egg on first visit, once ----
  var ow = gotoMap(g, 'daycare', 6, 8);
  var keeper = talkKind(g, ow, 'daycare');
  ok('B01 the Day-Care couple are wired (keeper patched + wife appended, both johto:daycare)',
    !!keeper && ow.map.npcs.filter(function (n) { return n.johto === 'daycare'; }).length === 2);
  ok('B02 first visit gifts the story egg (flag set, egg mon in party from the baby pool)',
    st.story.flags.daycare_story_egg === true
    && st.party.length === 4 && st.party[3].egg === true
    && ['pichu','cleffa','igglybuff','togepi','magby','elekid','smoochum','tyrogue'].includes(st.party[3].speciesId),
    JSON.stringify(st.party.map(function (m) { return m.speciesId; })));
  leaveMenu(g);
  talkKind(g, ow, 'daycare'); leaveMenu(g);
  ok('B03 the story egg is one-time (second visit gifts nothing)',
    st.party.filter(function (m) { return m.egg; }).length === 1 && st.party.length === 4);

  // ---- B2: deposit both, production on the real step hook, collect ----
  talkKind(g, ow, 'daycare');
  choose(g, function (it) { return it.value === 'dep'; });
  choose(g, function (it) { return it.value === 0; }); // charizard
  leaveMenu(g);
  ok('B04 deposit through the real menu: charizard is a Day-Care guest',
    st.daycare.length === 1 && st.daycare[0].speciesId === 'charizard' && st.party.length === 3);
  talkKind(g, ow, 'daycare');
  choose(g, function (it) { return it.value === 'dep'; });
  choose(g, function (it) { return it.value === 0; }); // venusaur (now first)
  leaveMenu(g);
  ok('B05 second deposit arms production (daycareEggAt = stepsTotal + 200)',
    st.daycare.length === 2 && st.daycareEggAt === st.stepsTotal + 200,
    JSON.stringify({ at: st.daycareEggAt, steps: st.stepsTotal }));
  st.stepsTotal = st.daycareEggAt - 1;
  ow.sysOnStep(6, 8); drain(g);
  ok('B06 one real overworld step at the threshold materializes the egg (offspring = first parent charizard -> charmander)',
    !!st.daycareEgg && st.daycareEgg.speciesId === 'charmander');
  talkKind(g, ow, 'daycare');
  choose(g, function (it) { return it.value === 'egg'; });
  leaveMenu(g);
  ok('B07 collecting through the menu delivers the charmander egg to the party',
    st.daycareEgg === null && st.party.some(function (m) { return m.egg && m.speciesId === 'charmander'; }));
  talkKind(g, ow, 'daycare');
  choose(g, function (it) { return it.value === 'wd'; });
  choose(g, function (it) { return it.value === 0; });
  choose(g, function (it) { return it.value === 'wd'; });
  choose(g, function (it) { return it.value === 0; });
  leaveMenu(g);
  ok('B08 withdraw returns both guests to the party',
    st.daycare.length === 0 && st.party.length === 5);

  // ---- B3: hatch on the real step hook at the Johto band floor ----
  var egg = st.party.find(function (m) { return m.egg && m.speciesId === 'charmander'; });
  egg.eggSteps = 1;
  ow.sysOnStep(6, 8); drain(g);
  ok('B09 walking hatches the egg at Lv101 (Johto band floor), dex caught, egg fields gone',
    egg.egg === undefined && egg.level === 101 && st.dex.caught[4] === true);

  // ---- B4: apricorn tree through the real interact path ----
  var owA = gotoMap(g, 'azalea', 19, 2);
  var before = st.bag.redapricorn || 0;
  owA.sysInteract(19, 1); drain(g);
  var after1 = st.bag.redapricorn || 0;
  owA.sysInteract(19, 1); drain(g);
  ok('B10 apricorn tree at azalea (19,1): first face picks the Red Apricorn, second face finds it resting',
    after1 === before + 1 && (st.bag.redapricorn || 0) === after1 && st.gather['azalea:19,1'] === st.stepsTotal + 200);

  // ---- B5: Kurt — order, progress, collect through the real NPC ----
  var owK = gotoMap(g, 'kurt-house', 6, 8);
  talkKind(g, owK, 'kurt');
  choose(g, function (it) { return it.value === 'redapricorn'; });
  drain(g);
  ok('B11 Kurt takes the Red Apricorn and books the Level Ball (readyAt = steps + 250)',
    !!st.kurtOrder && st.kurtOrder.ball === 'levelball' && st.kurtOrder.readyAt === st.stepsTotal + 250
    && (st.bag.redapricorn || 0) === 0, JSON.stringify(st.kurtOrder));
  talkKind(g, owK, 'kurt'); drain(g);
  ok('B12 Kurt reports the order still on the bench (no early collect)',
    !!st.kurtOrder && (st.bag.levelball || 0) === 0);
  st.stepsTotal += 250;
  talkKind(g, owK, 'kurt'); drain(g);
  ok('B13 after 250 steps Kurt hands over the Level Ball',
    st.kurtOrder === null && (st.bag.levelball || 0) === 1);

  // ---- B6: battle guards + classic catch rules in the real engine ----
  var owP = gotoMap(g, 'pallet', 7, 7);
  st.party = [makeEggMonBundle(), makeMon('charizard', 150, SPECIES, MOVES)];
  function makeEggMonBundle() { var m = makeMon('eevee', 1, SPECIES, MOVES); m.egg = true; m.eggSteps = 500; return m; }
  var foe1 = makeMon('clefairy', 120, SPECIES, MOVES); foe1.hp = 1;
  var b1 = new BattleScene({ kind: 'wild', foe: foe1, returnTo: owP, rt: false });
  g.scenes.push(b1); tk(g, 4);
  ok('B14 battle lead guard: firstAble skips the Egg — charizard leads, not the egg',
    b1.ally && b1.ally.speciesId === 'charizard');
  b1.openPartyMenu(false);
  var eggRow = g.ui.menu ? g.ui.menu.items[0] : null;
  ok('B15 party menu guard: the Egg row is disabled (cannot be sent out)',
    !!eggRow && eggRow.disabled === true);
  g.ui.debugChoose(g.ui.menu.items.length - 1); tk(g, 3); drain(g); // Back
  st.bag.moonball = 3; st.bag.pokeball = 3; st.bag.friendball = 3;
  var savedRng = g.rng.battle;
  g.rng.battle = function () { return 0.9; };
  b1.beginCatch('moonball');
  ok('B16 classic engine: Moon Ball catches clefairy on a roll the raw rate refuses (r=230 > 120 raw, <= 255 moon-scaled)',
    b1.catchState && b1.catchState.willCatch === true);
  settleBattle(g, b1);
  var foe2 = makeMon('clefairy', 120, SPECIES, MOVES); foe2.hp = 1;
  var b2 = new BattleScene({ kind: 'wild', foe: foe2, returnTo: owP, rt: false });
  g.scenes.push(b2); tk(g, 4);
  b2.beginCatch('pokeball');
  ok('B17 classic control: the same roll with a plain Poke Ball does NOT catch',
    b2.catchState && b2.catchState.willCatch === false);
  drain(g); tk(g, 30); drain(g);
  // Leave through the real Run command (a synthetic endBattle would
  // strand the shared UI menu open and freeze the next battle).
  if (g.scenes.top === b2 && g.ui.menuOpen) {
    var ri = g.ui.menu.items.findIndex(function (it) { return !it.disabled && it.value === 'run'; });
    if (ri >= 0) { g.ui.debugChoose(ri); tk(g, 3); }
  }
  settleBattle(g, b2); drain(g);
  var foe3 = makeMon('pidgey', 120, SPECIES, MOVES); foe3.hp = 1;
  var b3 = new BattleScene({ kind: 'wild', foe: foe3, returnTo: owP, rt: false });
  g.scenes.push(b3); tk(g, 4);
  g.rng.battle = function () { return 0.1; };
  b3.beginCatch('friendball');
  var willFriend = b3.catchState && b3.catchState.willCatch;
  settleBattle(g, b3);
  var friendMon = st.party.find(function (m) { return m.speciesId === 'pidgey'; })
    || Object.values(st.boxes).flat().find(function (m) { return m.speciesId === 'pidgey'; });
  ok('B18 classic engine: a Friend Ball catch lands with friendship set high (200)',
    willFriend === true && !!friendMon && friendMon.friendship === 200,
    JSON.stringify(friendMon && friendMon.friendship));
  g.rng.battle = savedRng;

  st.bag.rarecandy = 1;
  g.useBagItem('rarecandy');
  ok('B22 bag guard: Rare Candy cannot target an Egg (row disabled; a hatched party member stays targetable)',
    !!g.ui.menu && g.ui.menu.items[0].disabled === true && g.ui.menu.items[1].disabled === false);
  if (g.ui.menuOpen) { g.ui.debugChoose(g.ui.menu.items.length - 1); tk(g, 3); drain(g); }
  if (g.ui.menuOpen) { g.ui.debugChoose(g.ui.menu.items.length - 1); tk(g, 3); drain(g); }

  // ---- B7: RT engine spot proofs (level + heavy) ----
  g.state.settings.battleStyle = 'rt';
  st.bag.levelball = 5; st.bag.heavyball = 5; st.bag.pokeball = 5;
  st.party = [makeMon('venusaur', 150, SPECIES, MOVES)];
  var foeR1 = makeMon('charizard', 30, SPECIES, MOVES); foeR1.hp = 1; foeR1.status = 'sleep';
  var r1 = new BattleScene({ kind: 'wild', foe: foeR1, returnTo: owP, rt: true });
  g.scenes.push(r1); tk(g, 90);
  if (!r1.rt) r1.rtInit();
  if (r1.state !== 'rt') r1.state = 'rt';
  g.rng.battle = function () { return 0.9; };
  r1.rtThrowBall('levelball'); r1.rtUpdateBall(400);
  ok('B19 RT engine: Level Ball rule applies in the RT catch calc (lead 150 vs foe 30 -> x8 -> rate 255; roll 230 catches)',
    !!r1.rt.catchSeq && r1.rt.catchSeq.willCatch === true && r1.fished === false);
  var foeR2 = makeMon('onix', 130, SPECIES, MOVES); foeR2.hp = 1; foeR2.status = 'sleep';
  var r2 = new BattleScene({ kind: 'wild', foe: foeR2, returnTo: owP, rt: true });
  g.scenes.push(r2); tk(g, 90);
  if (!r2.rt) r2.rtInit();
  if (r2.state !== 'rt') r2.state = 'rt';
  g.rng.battle = function () { return 0.3; };
  r2.rtThrowBall('heavyball'); r2.rtUpdateBall(400);
  var heavyWill = !!r2.rt.catchSeq && r2.rt.catchSeq.willCatch === true;
  var foeR3 = makeMon('onix', 130, SPECIES, MOVES); foeR3.hp = 1; foeR3.status = 'sleep';
  var r3 = new BattleScene({ kind: 'wild', foe: foeR3, returnTo: owP, rt: true });
  g.scenes.push(r3); tk(g, 90);
  if (!r3.rt) r3.rtInit();
  if (r3.state !== 'rt') r3.state = 'rt';
  r3.rtThrowBall('pokeball'); r3.rtUpdateBall(400);
  var plainWill = !!r3.rt.catchSeq && r3.rt.catchSeq.willCatch === true;
  ok('B20 RT engine: Heavy Ball rule applies (onix tier L x2.5 -> rate 112 catches on the roll a plain ball refuses)',
    heavyWill === true && plainWill === false);
  r2.rtBagMenu();
  ok('B21 RT bag stocks the apricorn balls from the BALLS table',
    !!g.ui.menu && g.ui.menu.items.some(function (it) { return it.value === 'levelball'; })
    && g.ui.menu.items.some(function (it) { return it.value === 'heavyball'; }));
  g.rng.battle = savedRng;

  globalThis.__J6Q__ = Q;
})();
`;

let driverError = null, Q = null;
try {
  const run = new Function(gameJs + '\n' + driver);
  run();
  Q = globalThis.__J6Q__ || null;
  if (!Q) driverError = new Error('driver produced no result object');
} catch (e) { driverError = e; }
if (driverError) {
  ok('B00 driver completed with no internal failures', false, String(driverError && driverError.stack || driverError).slice(0, 600));
} else if (Q) {
  for (const r of Q.results) ok(r.name, r.pass);
  ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' driver failures');
}

console.log(`\nJOHTO SYSTEMS TOTAL: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
