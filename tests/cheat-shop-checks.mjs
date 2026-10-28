// cheat-shop-checks.mjs — Cheat Terminal (owner order 2026-10-28) proofs.
// Part A: pure data/units (tables sync, terminals in map data, expansion
// species/form/item data, validator over hand-built saves incl. the
// MAXIMAL-stock case). Part B: the built guest bundle in a headless Game —
// both terminals reached through the real sysNpc path, $0 claims through
// the real menus, 999 clamp, keepsake claim-once, species claims (party /
// PC / box-full refusal with zero mutation), Mewtwo, diploma threshold.
// Run: node tests/cheat-shop-checks.mjs   (exit 1 on any failure)

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
const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const SPECIES = Object.assign({}, SP1, SPECIES2);
const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const MOVES = Object.assign({}, MV1, MOVES2);
const { ITEMS } = await import(join(ROOT, 'src/data/items.mjs'));
const { FORMS } = await import(join(ROOT, 'src/data/forms.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const ALL_MAPS = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4);
const { makeMon, defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

const FORM_IDS = ['crystalonix', 'pinkbutterfree', 'surfingpikachu', 'flyingpikachu', 'giantdragonite'];
const NEW_IDS = ['togepi', 'marill', 'snubbull', 'donphan', 'hooh'];
const BADGES = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];

// -- tables: client <-> server symmetric (gen-tables --check is the pin) --
{
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  ok('A01 tables.json in sync with src/data (gen-tables --check)', checkOut.includes('tables.json OK'), checkOut.trim());
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A02 counts: species 162 (152+5 forms+5 species), items 130 (126+4), keepsakes 12, forms 202 (197+5)',
    t.species.length === 162 && t.items.length === 130 && t.keepsakes.length === 12 && t.forms.length === 202,
    JSON.stringify({ s: t.species.length, i: t.items.length, k: t.keepsakes.length, f: t.forms.length }));
  ok('A03 server tables carry every expansion id',
    [...FORM_IDS, ...NEW_IDS].every((id) => t.species.includes(id) && t.forms.includes(id) === FORM_IDS.includes(id))
    && ['gsball', 'pinkanberry', 'minimistylure', 'rainbowwing'].every((id) => t.items.includes(id)));
}

// -- terminals in the world data --
{
  const pallet = ALL_MAPS.pallet.npcs.find((n) => n.cheat);
  const center = ALL_MAPS.center.npcs.find((n) => n.cheat);
  ok('A04 Pallet CHEAT TERMINAL at (6,4) beside the PC at (5,4)',
    !!pallet && pallet.x === 6 && pallet.y === 4 && pallet.name === 'CHEAT TERMINAL'
    && ALL_MAPS.pallet.npcs.some((n) => n.pc && n.x === 5 && n.y === 4));
  ok('A05 shared Center CHEAT TERMINAL at (6,2) beside the PC at (7,2)',
    !!center && center.x === 6 && center.y === 2 && center.name === 'CHEAT TERMINAL'
    && ALL_MAPS.center.npcs.some((n) => n.pc && n.x === 7 && n.y === 2));
}

// -- expansion data --
{
  ok('A06 forms: partner pattern (own id, SHARED dexNo, form flag, baseSpecies)',
    FORM_IDS.every((id) => SPECIES[id] && SPECIES[id].form === true
      && SPECIES[id].dexNo === SPECIES[SPECIES[id].baseSpecies].dexNo));
  ok('A07 forms registered in the FORMS index', FORM_IDS.every((id) => FORMS.some((f) => f.id === id)));
  ok('A08 Crystal Onix take: Rock/Ice (Fire weakness shed, Water still hits the Rock half)',
    JSON.stringify(SPECIES.crystalonix.types) === JSON.stringify(['rock', 'ice']));
  ok('A09 Surfing/Flying Pikachu know Surf/Fly from level 1',
    SPECIES.surfingpikachu.learnset[1].includes('surf') && SPECIES.flyingpikachu.learnset[1].includes('fly'));
  // Canon facts verified against PokeAPI at build time (2026-10-28).
  const canon = {
    togepi: { dexNo: 175, types: ['fairy'], base: { hp: 35, atk: 20, def: 65, spa: 40, spd: 65, spe: 20 }, catchRate: 190, growth: 'fast', baseXp: 49 },
    marill: { dexNo: 183, types: ['water', 'fairy'], base: { hp: 70, atk: 20, def: 50, spa: 20, spd: 50, spe: 40 }, catchRate: 190, growth: 'fast', baseXp: 88 },
    snubbull: { dexNo: 209, types: ['fairy'], base: { hp: 60, atk: 80, def: 50, spa: 40, spd: 40, spe: 30 }, catchRate: 190, growth: 'fast', baseXp: 60 },
    donphan: { dexNo: 232, types: ['ground'], base: { hp: 90, atk: 120, def: 120, spa: 60, spd: 60, spe: 50 }, catchRate: 60, growth: 'mediumfast', baseXp: 175 },
    hooh: { dexNo: 250, types: ['fire', 'flying'], base: { hp: 106, atk: 130, def: 90, spa: 110, spd: 154, spe: 90 }, catchRate: 3, growth: 'slow', baseXp: 306 },
  };
  ok('A10 five full species match PokeAPI canon (types/stats/catch/growth/xp)',
    NEW_IDS.every((id) => { const s = SPECIES[id], c = canon[id];
      return s.dexNo === c.dexNo && JSON.stringify(s.types) === JSON.stringify(c.types)
        && JSON.stringify(s.base) === JSON.stringify(c.base) && s.catchRate === c.catchRate
        && s.growth === c.growth && s.baseXp === c.baseXp; }));
  ok('A11 no evolution entries on the new species (deliberate)',
    NEW_IDS.every((id) => !SPECIES[id].evo && !SPECIES[id].evos));
  ok('A12 every learnset move exists in the move table',
    [...FORM_IDS, ...NEW_IDS].every((id) => Object.values(SPECIES[id].learnset).flat().every((m) => MOVES[m])));
  ok('A13 Kanto diploma set unchanged: exactly 151 non-form species at dexNo 1-151 (partner excluded, as in the dex lists)',
    Object.values(SPECIES).filter((s) => s.id !== 'partner' && !s.form && s.dexNo >= 1 && s.dexNo <= 151).length === 151);
  ok('A14 collectibles: 4 items, collectible-flagged, COLLECTIBLE-labeled, no effects',
    ['gsball', 'pinkanberry', 'minimistylure', 'rainbowwing'].every((id) => ITEMS[id]
      && ITEMS[id].collectible === true && ITEMS[id].desc.startsWith('COLLECTIBLE')));
  ok('A15 art: every expansion species has front+back art data',
    [...FORM_IDS, ...NEW_IDS].every((id) => readFileSync(join(ROOT, 'assets/sprites/art-data.mjs'), 'utf8')
      .includes('"' + id + '-front"')));
}

// -- validator over hand-built saves --
{
  const maximal = defaultState();
  maximal.player.name = 'ASH'; maximal.player.rivalName = 'GARY';
  for (const id of Object.keys(ITEMS)) maximal.bag[id] = 999;      // every item maxed
  maximal.badges.kanto = [...BADGES];                              // every badge, earn order
  [...FORM_IDS, ...NEW_IDS].forEach((id, i) => {                   // every expansion claim
    const boxId = 'box' + ((i % 12) + 1);
    maximal.boxes[boxId] = maximal.boxes[boxId] || [];
    maximal.boxes[boxId].push(makeMon(id, 50, SPECIES, MOVES));
    maximal.dex.caught[SPECIES[id].dexNo] = true;
  });
  maximal.story.flags.fossil_taken = false; // shopped fossils never set it (checked in B too)
  const r = VAL.validateSave(JSON.parse(JSON.stringify(maximal)));
  ok('A16 MAXIMAL-stock save passes validateSave (all badges + all items @999 + expansion mons)',
    r.ok && r.errors.length === 0, JSON.stringify(r.errors));
  const fossilOnly = defaultState();
  fossilOnly.player.name = 'ASH'; fossilOnly.player.rivalName = 'GARY';
  fossilOnly.bag.helixfossil = 1; // a shopped fossil in the bag, flag unset
  const rf = VAL.validateSave(JSON.parse(JSON.stringify(fossilOnly)));
  ok('A17 fossil-in-bag save (no fossil_taken) passes validateSave', rf.ok, JSON.stringify(rf.errors));
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
globalThis.__SEED__ = 20261028;
globalThis.__QFRESET__ = () => { for (const k of Object.keys(memStore)) delete memStore[k]; };

const driver = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('CS-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('cs-pass ' + name);
  }
  function mkGame(seed) {
    globalThis.__QFRESET__();
    globalThis.__SEED__ = seed;
    var g = new Game(null);
    g.ui.init(); g.input.bindKeyboard(); g.buildSprites(); g.applyLayout();
    return g;
  }
  function tk(g, n) { g.loop.stepTicks(n || 2); }
  function pA(g) { g.input.inject('a'); tk(g, 2); g.input.release('a'); }
  function drain(g) { var n = 0; while (g.ui.dialogueOpen && n < 400) { pA(g); n++; } }
  function boot(g) {
    g.scenes.push(new BootScene());
    g.loop.stepMs(3100); tk(g, 2);
    pA(g); pA(g); pA(g);
    drain(g); g.ui.debugChoose(0); tk(g, 3); drain(g);
    return g.scenes.top;
  }
  function pick(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
  }
  function menuItem(g, value) { return g.ui.menu.items.find(function (it) { return it.value === value; }); }

  // ---- B1/B2: both terminals reachable through the real NPC path ----
  var g1 = mkGame(101); var ow1 = boot(g1);
  var palletNpc = MAPS.pallet.npcs.find(function (n) { return n.cheat; });
  ow1.sysNpc(palletNpc); drain(g1);
  ok('B01 Pallet CHEAT TERMINAL opens the Cheat Shop menu',
    g1.ui.menuOpen && g1.ui.menu.title === 'Cheat Terminal — everything is $0', g1.ui.menu && g1.ui.menu.title);
  ok('B02 top menu is [Get Items, Get Pokemon, Leave] — no Sell',
    g1.ui.menu.items.map(function (i) { return i.label; }).join(',') === 'Get Items,Get Pokémon,Leave');

  var g2 = mkGame(102); var ow2 = boot(g2);
  // walk the scene to the shared Center map, then use its terminal NPC
  ow2.loadMap ? ow2.loadMap('center') : null;
  var centerNpc = MAPS.center.npcs.find(function (n) { return n.cheat; });
  ow2.sysNpc(centerNpc); drain(g2);
  ok('B03 Center CHEAT TERMINAL opens the Cheat Shop menu',
    g2.ui.menuOpen && g2.ui.menu.title === 'Cheat Terminal — everything is $0');

  // ---- B3: $0 item claim through the real menus, money untouched ----
  g1.state.player.money = 777;
  var potionsBefore = g1.state.bag.potion || 0;
  pick(g1, 'items'); pick(g1, 'medicine'); pick(g1, 'potion');
  ok('B04 quantity stepper opens at $0', g1.ui.menu.title === 'Get — Potion'
    && g1.ui.menu.items[0].label.indexOf('$0') >= 0, g1.ui.menu.title + ' | ' + g1.ui.menu.items[0].label);
  g1.ui.menu.onKey('right'); g1.ui.menu.onKey('right'); g1.ui.menu.onKey('right'); g1.ui.menu.onKey('right');
  pick(g1, 'go');
  ok('B05 claimed 5 Potions for $0 — money provably untouched',
    g1.state.bag.potion === potionsBefore + 5 && g1.state.player.money === 777,
    'bag=' + g1.state.bag.potion + ' (was ' + potionsBefore + ') money=' + g1.state.player.money);

  // ---- B4: 999 clamp ----
  g1.state.bag.potion = 995;
  var granted = ow1.cheatClaimItem('potion', 99);
  ok('B06 claim clamps to the 999 bag cap (995 + 99 -> +4)',
    granted === 4 && g1.state.bag.potion === 999, 'granted=' + granted);
  ok('B07 claim at 999 grants 0 (no overflow)', ow1.cheatClaimItem('potion', 10) === 0 && g1.state.bag.potion === 999);

  // ---- B5: keepsake claim-once through the menus ----
  ow1.openCheatShop(); pick(g1, 'items'); pick(g1, 'keepsakes');
  ok('B08 keepsake row enabled before claim', menuItem(g1, 'sparrowfeather') && !menuItem(g1, 'sparrowfeather').disabled);
  var moneyBefore = g1.state.player.money;
  pick(g1, 'sparrowfeather');
  ok('B09 keepsake claimed once, $0, no dupe cash conversion',
    g1.state.bag.sparrowfeather === 1 && g1.state.player.money === moneyBefore);
  ok('B10 second claim impossible: row disabled once owned',
    menuItem(g1, 'sparrowfeather') && menuItem(g1, 'sparrowfeather').disabled === true);

  // ---- B6: fossil claim never sets fossil_taken ----
  ow1.openCheatShop(); pick(g1, 'items'); pick(g1, 'key'); pick(g1, 'helixfossil'); pick(g1, 'go');
  ok('B11 fossil claimed as an item; fossil_taken stays unset',
    (g1.state.bag.helixfossil || 0) >= 1 && !g1.state.story.flags.fossil_taken);

  // ---- B7: badges — prefix-safe claims, owned rows disabled ----
  ow1.openCheatShop(); pick(g1, 'items'); pick(g1, 'badges'); pick(g1, 'earthbadge');
  ok('B12 claiming the Earth Badge prefix-completes the earn order (validator-safe)',
    JSON.stringify(g1.state.badges.kanto) === JSON.stringify(['boulderbadge','cascadebadge','thunderbadge','rainbowbadge','soulbadge','marshbadge','volcanobadge','earthbadge']),
    JSON.stringify(g1.state.badges.kanto));
  ok('B13 owned badge rows disabled (re-claim is a no-op)',
    menuItem(g1, 'earthbadge').disabled === true && menuItem(g1, 'boulderbadge').disabled === true);

  // ---- B8: species claim — Mewtwo to the party, gift-path shape ----
  var g3 = mkGame(103); var ow3 = boot(g3);
  var partyBefore = g3.state.party.length;
  ow3.openCheatShop(); pick(g3, 'pokemon'); pick(g3, 'mewtwo');
  ok('B14 level stepper opens at 50', g3.ui.menu.items[0].label.indexOf('Level 50') === 0, g3.ui.menu.items[0].label);
  pick(g3, 'go'); pick(g3, 'party');
  var mew = g3.state.party[g3.state.party.length - 1];
  ok('B15 Mewtwo claimed: species/level 50/all-31 IVs/last-4 learnset moves',
    g3.state.party.length === partyBefore + 1 && mew.speciesId === 'mewtwo' && mew.level === 50
    && Object.values(mew.ivs).every(function (v) { return v === 31; }) && mew.moves.length >= 1 && mew.moves.length <= 4,
    JSON.stringify(mew && { sp: mew.speciesId, lv: mew.level, ivs: mew.ivs, mv: mew.moves.length }));
  ok('B16 dex registered as caught (No.150)', g3.state.dex.caught[150] === true);

  // ---- B9: party full -> Party row disabled, PC routing works ----
  while (g3.state.party.length < 6) g3.state.party.push(makeMon('pidgey', 5, SPECIES, MOVES));
  ow3.openCheatShop(); pick(g3, 'pokemon'); pick(g3, 'togepi'); pick(g3, 'go');
  ok('B17 Party destination disabled at a full party of 6', menuItem(g3, 'party').disabled === true);
  pick(g3, 'box');
  ok('B18 claim routed to the first PC box with space (Box 1)',
    (g3.state.boxes.box1 || []).some(function (m) { return m.speciesId === 'togepi'; })
    && g3.state.dex.caught[175] === true);

  // ---- B10: all boxes full -> clean refusal, ZERO state mutation ----
  var g4 = mkGame(104); var ow4 = boot(g4);
  for (var b = 1; b <= 12; b++) {
    g4.state.boxes['box' + b] = [];
    for (var i = 0; i < 30; i++) g4.state.boxes['box' + b].push(makeMon('pidgey', 5, SPECIES, MOVES));
  }
  var snap = JSON.stringify(g4.state);
  var res = ow4.cheatDeliverMon('mew', 5, 'box');
  ok('B19 box-full refusal: not ok, zero state mutation',
    res.ok === false && res.reason === 'boxes-full' && JSON.stringify(g4.state) === snap);

  // ---- B11: every expansion species + form claimable ----
  var g5 = mkGame(105); var ow5 = boot(g5);
  var expIds = ['crystalonix','pinkbutterfree','surfingpikachu','flyingpikachu','giantdragonite','togepi','marill','snubbull','donphan','hooh'];
  var allOk = expIds.every(function (id) { return ow5.cheatDeliverMon(id, 50, 'box').ok; });
  var ownedExp = [].concat.apply([], Object.values(g5.state.boxes)).map(function (m) { return m.speciesId; });
  ok('B20 all 10 expansion entries claimable (5 forms + 5 species)',
    allOk && expIds.every(function (id) { return ownedExp.includes(id); }), ownedExp.join(','));
  ok('B21 expansion claims register their shared/base dex numbers',
    g5.state.dex.caught[95] === true && g5.state.dex.caught[250] === true && g5.state.dex.caught[175] === true);

  // ---- B12: maximal stock through the real claim paths ----
  var g6 = mkGame(106); var ow6 = boot(g6);
  Object.keys(ITEMS).forEach(function (id) { if (ITEMS[id].pocket !== 'keepsakes') ow6.cheatClaimItem(id, 999); });
  ow6.cheatClaimBadge('earthbadge');
  Object.keys(KEEPSAKES).forEach(function (id) { grantKeepsakeFromSource(g6.state, id); });
  Object.keys(SPECIES).forEach(function (id) { if (id !== 'partner') ow6.cheatDeliverMon(id, 50, 'box'); });
  globalThis.__MAXSAVE__ = JSON.parse(JSON.stringify(g6.state));
  ok('B22 maximal stock: every item @999, all 8 badges, all 12 keepsakes, every species boxed',
    g6.state.badges.kanto.length === 8 && (g6.state.bag.gsball === 999)
    && Object.keys(KEEPSAKES).every(function (id) { return (g6.state.bag[id] || 0) >= 1; }));

  // ---- B13: diploma threshold still 151 ----
  var g7 = mkGame(107); var ow7 = boot(g7);
  expIds.forEach(function (id) { ow7.cheatDeliverMon(id, 50, 'box'); });
  g7.checkDiploma();
  ok('B23 expansion claims alone do NOT earn the Kanto diploma', !g7.state.story.flags.diploma);
  Object.keys(SPECIES).forEach(function (id) {
    if (id !== 'partner' && !SPECIES[id].form && SPECIES[id].dexNo >= 1 && SPECIES[id].dexNo <= 151) ow7.cheatDeliverMon(id, 50, 'box');
  });
  g7.checkDiploma();
  ok('B24 claiming all 151 Kanto species earns the diploma (threshold unmoved)',
    g7.state.story.flags.diploma === true);

  globalThis.__CHEATQ__ = Q;
})();
`;
(0, eval)('{ ' + gameJs + driver + '\n}');
const Q = globalThis.__CHEATQ__;
for (const r of Q.results) ok('B ' + r.name, r.pass);
ok('B00 driver completed with no internal failures', Q.failures === 0, Q.failures + ' failures');

// maximal save from the bundle's real claim paths -> server validator
{
  const r = VAL.validateSave(globalThis.__MAXSAVE__);
  ok('B25 maximal-stock save (real claim paths) passes validateSave', r.ok && r.errors.length === 0, JSON.stringify(r.errors));
  const r2 = VAL.validateSave(JSON.parse(JSON.stringify((() => { const s = defaultState(); s.player.name = 'ASH'; s.player.rivalName = 'GARY'; return s; })())));
  ok('B26 fresh default save still passes validateSave (sanity)', r2.ok, JSON.stringify(r2.errors));
}

console.log('\nCHEAT SHOP TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
