// rejuv-phase4-checks.mjs — Rejuvenation Phase 4 (ADR-025 §5) proofs:
// Town Tales. Part A: pure units over the tales table + stage machine
// (data/quests.mjs), bond records, save schema + cloud validator
// widening (§7), the all-12-keepsakes obtainability audit with the
// Phase 3 stubs gone, and legendary-arc regression at the data level.
// Part B: the built bundle in a headless Game — every tale driven
// end-to-end through the REAL NPC/spot wiring (dialogue, menus, quiz,
// spars, the kid battle, badge-paced visits), the Quest Log's third
// section, late/post-League completion (harbormaster fallback, IOU
// redemption, keep-choice), and the Saffron spar branch.
// Part C: damage-free real-browser smoke (bundle boots, log sections).
// Run: node tests/rejuv-phase4-checks.mjs   (exit 1 on any failure)
// Part C reads public/index.html + public/game.js — build first.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const Q = await import(join(ROOT, 'src/data/quests.mjs'));
const { QUESTS: TALES } = Q;
const { ITEMS, KEEPSAKES } = await import(join(ROOT, 'src/data/items.mjs'));
const K = await import(join(ROOT, 'src/game/keepsakes.mjs'));
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { MAIN_QUESTS, LEGENDARY_ARCS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3, TRAINERS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4, TRAINERS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const ALL_MAPS = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4);
const ALL_TRAINERS = Object.assign({}, TRAINERS3, TRAINERS4);

// -- the table: shape law + the spec's Kanto set --
{
  const ids = Object.keys(TALES).sort();
  ok('A01 exactly the 10 specced tales', JSON.stringify(ids) === JSON.stringify([
    'tale_celadon', 'tale_cerulean', 'tale_cinnabar', 'tale_fuchsia', 'tale_lavender',
    'tale_pallet', 'tale_pewter', 'tale_saffron', 'tale_vermilion', 'tale_viridian',
  ]), ids.join(','));
  ok('A02 shape law: every tale has town/giver/title, 1..3 stages, a reward, a bondNpc, and a lore REVELATION',
    Object.values(TALES).every((t) => t.town && t.giver && t.title
      && Array.isArray(t.stages) && t.stages.length >= 1 && t.stages.length <= 3
      && t.reward && typeof t.rewardText === 'string' && t.rewardText.length > 0
      && typeof t.bondNpc === 'string' && typeof t.revelation === 'string' && t.revelation.length > 40));
  const SPEC = {
    tale_pallet: ['Dawnwick', "Mom's Care Package", 'mom', 2],
    tale_viridian: ['Fernmere City', 'The Retired Ace', 'retiredace', 0],
    tale_pewter: ['Flintridge City', "Brock's Day Off", 'brock', 2],
    tale_cerulean: ['Tidehaven City', 'The Stolen Bike Bell', 'misty', 1],
    tale_vermilion: ['Arcport City', 'Fan Club Founder', 'surge', 1],
    tale_lavender: ['Hushmoor Town', 'Names on the Wall', 'fuji', 2],
    tale_celadon: ['Canopy City', 'Roof Garden', 'erika', 2],
    tale_saffron: ['Farsight City', 'Two Gyms, One City', 'sabrina', 1],
    tale_fuchsia: ['Bramble City', "The Warden's Teeth", 'koga', 1],
    tale_cinnabar: ['Caldera Town', 'Lab Notes', 'blaine', 1],
  };
  ok('A03 spec table: town, title, bond NPC and bond delta per tale (Viridian delta is the choice, applied by the wiring)',
    Object.entries(SPEC).every(([id, [town, title, npc, d]]) =>
      TALES[id].town === town && TALES[id].title === title && TALES[id].bondNpc === npc && TALES[id].bondDelta === d));
  ok('A04 spec rewards: 3 Potions / Tortoise / Iron Acorn / TM11 / Tide Pearl / Spectre Bell / Gardenia / choice / 10 Safari Balls / Ember Seed',
    TALES.tale_pallet.reward.items.potion === 3
    && TALES.tale_viridian.reward.keepsake === 'tortoisecharm'
    && TALES.tale_pewter.reward.keepsake === 'ironacorn'
    && TALES.tale_cerulean.reward.items.tm11 === 1 && ITEMS.tm11 && ITEMS.tm11.move === 'bubblebeam'
    && TALES.tale_vermilion.reward.keepsake === 'tidepearl'
    && TALES.tale_lavender.reward.keepsake === 'spectrebell'
    && TALES.tale_celadon.reward.keepsake === 'gardeniasash'
    && TALES.tale_saffron.reward.choice === true
    && TALES.tale_fuchsia.reward.items.safariball === 10
    && TALES.tale_cinnabar.reward.keepsake === 'embereed');
}

// -- the stage machine --
{
  const s = defaultState();
  const t = TALES.tale_celadon; // the 3-stage tale
  ok('A05 stage machine: -1 none -> accept writes \'active\' (stage 0) -> numbers -> \'complete\'',
    Q.taleStageOf(s, t.id) === -1 && Q.taleStatus(s, t.id) === 'none'
    && Q.acceptTale(s, t.id) === true && s.story.quests[t.id] === 'active' && Q.taleStageOf(s, t.id) === 0
    && Q.acceptTale(s, t.id) === false // never re-accepts
    && Q.advanceTale(s, t.id) === 1 && s.story.quests[t.id] === 1
    && Q.advanceTale(s, t.id) === 2 && s.story.quests[t.id] === 2
    && Q.advanceTale(s, t.id) === 3 && s.story.quests[t.id] === 'complete' && Q.taleStatus(s, t.id) === 'complete'
    && Q.advanceTale(s, t.id) === -1);
  ok('A06 stage text: unaccepted points at the giver; active shows the CURRENT stage; complete carries the revelation',
    Q.taleStageText(defaultState(), t).includes('GARDENER') && Q.taleStageText(defaultState(), t).includes('Canopy')
    && (() => { const s2 = defaultState(); Q.acceptTale(s2, t.id); Q.advanceTale(s2, t.id); return Q.taleStageText(s2, t) === t.stages[1]; })()
    && (() => { const s3 = defaultState(); Q.completeTale(s3, t.id); return Q.taleStageText(s3, t).includes('Complete') && Q.taleStageText(s3, t).includes(t.revelation); })());
  ok('A07 Saffron stage-3 text follows the IOU flag (spar text otherwise)',
    (() => { const s4 = defaultState(); Q.acceptTale(s4, 'tale_saffron'); Q.advanceTale(s4, 'tale_saffron'); Q.advanceTale(s4, 'tale_saffron');
      const spar = Q.taleStageText(s4, TALES.tale_saffron);
      s4.story.flags.tale_saffron_iou = true;
      const iou = Q.taleStageText(s4, TALES.tale_saffron);
      return spar.includes('Dojo spar') && iou.includes('IOU') && spar !== iou; })());
}

// -- completion payout + bonds (structural only) --
{
  const s = defaultState();
  Q.acceptTale(s, 'tale_pallet');
  const p0 = s.bag.potion || 0;
  const c1 = Q.completeTale(s, 'tale_pallet');
  const c2 = Q.completeTale(s, 'tale_pallet'); // must be a no-op
  ok('A08 completion pays ONCE: items land, bond records, second completion is a no-op',
    c1 === true && c2 === false && (s.bag.potion || 0) === p0 + 3 && s.story.bonds.mom === 2);
  const s2 = defaultState();
  Q.completeTale(s2, 'tale_pewter');
  ok('A09 keepsake completion: the piece lands in the bag pocket via the Phase 3 grant; bond +2',
    s2.bag.ironacorn === 1 && s2.story.bonds.brock === 2 && K.ownsKeepsake(s2, 'ironacorn'));
  const s3 = defaultState();
  Q.recordBond(s3, 'mom', 9); Q.recordBond(s3, 'mom', 9); Q.recordBond(s3, 'mom', -25);
  ok('A10 recordBond clamps to the §2 range (-10..+10)',
    s3.story.bonds.mom === -10, JSON.stringify(s3.story.bonds));
  ok('A11 Viridian choice semantics: return completes with bondDelta 2; keep completes with 0 — charm either way',
    (() => { const a = defaultState(); Q.acceptTale(a, 'tale_viridian'); Q.advanceTale(a, 'tale_viridian'); Q.completeTale(a, 'tale_viridian', { bondDelta: 2 });
      const b = defaultState(); Q.acceptTale(b, 'tale_viridian'); Q.advanceTale(b, 'tale_viridian'); Q.completeTale(b, 'tale_viridian', { bondDelta: 0 });
      return a.story.bonds.retiredace === 2 && a.bag.tortoisecharm === 1
        && (b.story.bonds.retiredace || 0) === 0 && b.bag.tortoisecharm === 1; })());
  ok('A12 IOU pick: first unowned piece in priority order; undefined when the collection is complete',
    (() => { const s4 = defaultState();
      const pick0 = Q.IOU_PRIORITY.find((k) => !K.ownsKeepsake(s4, k));
      for (const k of ['tortoisecharm', 'ironacorn', 'tidepearl', 'spectrebell', 'gardeniasash']) K.grantKeepsake(s4, k);
      const pick1 = Q.IOU_PRIORITY.find((k) => !K.ownsKeepsake(s4, k));
      for (const k of Q.IOU_PRIORITY) K.grantKeepsake(s4, k);
      const pickAll = Q.IOU_PRIORITY.find((k) => !K.ownsKeepsake(s4, k));
      return pick0 === 'tortoisecharm' && pick1 === 'embereed' && pickAll === undefined; })());
}

// -- wiring data integrity (merged world) --
{
  const npcAt = (mapId, name) => (ALL_MAPS[mapId].npcs || []).find((n) => n.name === name);
  ok('A13 patches name REAL townsfolk in the merged maps',
    Q.TALE_NPC_PATCHES.every((p) => ALL_MAPS[p.map] && !!npcAt(p.map, p.name) && !!TALES[p.tale]),
    JSON.stringify(Q.TALE_NPC_PATCHES.filter((p) => !npcAt(p.map, p.name))));
  ok('A14 tale NPC placements: walkable floor tiles, no collisions with base NPCs / warps / signs / spots',
    Q.TALE_NPCS.every((n) => {
      const m = ALL_MAPS[n.map]; if (!m) return false;
      const ch = m.rows[n.y] && m.rows[n.y][n.x];
      // Wave 5b: '$' (Mart floor) joins the walkable-floor whitelist —
      // the SHOPKEEPER tale actor now stands in the shared Mart scene.
      // Premium+ W5: the 11 settlements' town-ground chars (TG
      // U+00C0..U+00CA + TG2 U+0131..U+0144) are walkable floor by
      // engine law (src/data/maps.mjs WALKABLE) — tale actors standing
      // on redressed town ground are on walkable floor tiles.
      if (!['.', ',', '$'].includes(ch)
        && !(ch >= 'À' && ch <= 'Ê')
        && !(ch >= 'ı' && ch <= 'ń')) return false;
      if ((m.npcs || []).some((b) => b.x === n.x && b.y === n.y)) return false;
      if ((m.warps || []).some((w) => w.x === n.x && w.y === n.y)) return false;
      if ((m.signs || []).some((s2) => s2.x === n.x && s2.y === n.y)) return false;
      return true;
    }));
  ok('A15 tale spots: real maps, and no spot tile hides an item ball / hidden item',
    Q.TALE_SPOTS.every((s) => {
      const m = ALL_MAPS[s.map]; if (!m) return false;
      if (!(m.rows[s.y] && m.rows[s.y][s.x])) return false;
      if ((m.items || []).some((b) => b.x === s.x && b.y === s.y)) return false;
      if ((m.hidden || []).some((b) => b.x === s.x && b.y === s.y)) return false;
      return !!TALES[s.tale];
    }));
  ok('A16 the Cerulean kid is a real, gentle trainer (1 mon, errand level, no badge)',
    !!ALL_TRAINERS.tale_kid && ALL_TRAINERS.tale_kid.team.length === 1
    && ALL_TRAINERS.tale_kid.team[0].level <= 15 && !ALL_TRAINERS.tale_kid.badge);
}

// -- stub audit + all-12 obtainability --
{
  const srcFiles = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.mjs')) srcFiles.push(p); } };
  walk(join(ROOT, 'src'));
  const stubHits = srcFiles.filter((f) => readFileSync(f, 'utf8').includes('KEEPSAKE STUB SOURCE'));
  ok('A17 zero KEEPSAKE STUB SOURCE markers remain in src/', stubHits.length === 0, stubHits.join(','));
  const hiddenHas = (mapId, item) => ((ALL_MAPS[mapId] || {}).hidden || []).some((h) => h.item === item);
  const celadonClerk = (ALL_MAPS.celadon.npcs || []).find((n) => n.mart);
  const owSys = readFileSync(join(ROOT, 'src/game/overworld-systems.mjs'), 'utf8');
  // Arc 4 Stage S5a: the Sinnoh tales live in their own module (the
  // merge fold is a bundle artifact; this suite imports data directly).
  const { SINNOH_TALES: STALES } = await import(join(ROOT, 'src/data/story-sinnoh.mjs'));
  const sources = {
    sparrowfeather: hiddenHas('route2', 'sparrowfeather'),
    fossilspur: hiddenHas('moon1', 'fossilspur'),
    gloomfang: hiddenHas('safari', 'gloomfang'),
    thunderheadpin: hiddenHas('powerplant', 'thunderheadpin'),
    secondwindribbon: !!celadonClerk && celadonClerk.mart.stock.includes('secondwindribbon'),
    championsribbon: owSys.includes("grantKeepsake(g.state, 'championsribbon')"),
    tortoisecharm: TALES.tale_viridian.reward.keepsake === 'tortoisecharm',
    ironacorn: TALES.tale_pewter.reward.keepsake === 'ironacorn',
    tidepearl: TALES.tale_vermilion.reward.keepsake === 'tidepearl',
    spectrebell: TALES.tale_lavender.reward.keepsake === 'spectrebell',
    gardeniasash: TALES.tale_celadon.reward.keepsake === 'gardeniasash',
    embereed: TALES.tale_cinnabar.reward.keepsake === 'embereed',
    dawnribbon: STALES.tale_sinnoh_twinleaf.reward.keepsake === 'dawnribbon',
    starshard: STALES.tale_sinnoh_sandgem.reward.keepsake === 'starshard',
    coalseamcharm: STALES.tale_sinnoh_oreburgh.reward.keepsake === 'coalseamcharm',
    meadowcord: STALES.tale_sinnoh_eterna.reward.keepsake === 'meadowcord',
    ribbonclasp: STALES.tale_sinnoh_hearthome.reward.keepsake === 'ribbonclasp',
    ruinbell: STALES.tale_sinnoh_solaceon.reward.keepsake === 'ruinbell',
    fencharm: STALES.tale_sinnoh_pastoria.reward.keepsake === 'fencharm',
    shrinebell: STALES.tale_sinnoh_celestic.reward.keepsake === 'shrinebell',
    frostpetal: STALES.tale_sinnoh_snowpoint.reward.keepsake === 'frostpetal',
    beaconcoil: STALES.tale_sinnoh_sunnyshore.reward.keepsake === 'beaconcoil',
  };
  ok('A18 all 22 keepsakes obtainable end-to-end: 4 hidden + shop + HoF gift + 6 Kanto tale rewards + 10 Sinnoh tale rewards (Arc 4 Stage S5b — supersedes the S5a 18-piece count)',
    Object.keys(KEEPSAKES).length === 22 && Object.entries(sources).every(([k, v]) => v === true && !!KEEPSAKES[k]),
    JSON.stringify(sources));
  ok('A19 the six ex-stub pieces are NOT hidden items anywhere in the merged world anymore',
    Object.values(ALL_MAPS).every((m) => !(m.hidden || []).some((h) =>
      ['tortoisecharm', 'ironacorn', 'tidepearl', 'gardeniasash', 'spectrebell', 'embereed'].includes(h.item))));
}

// -- legendary-arc regression (data level) --
{
  ok('A20 legendary arcs untouched: the 5 playable Kanto arcs keep ids/steps/lairs; tale helpers refuse arc ids',
    ['arc_zapdos', 'arc_moltres', 'arc_articuno', 'arc_mewtwo', 'arc_mew']
      .every((id) => LEGENDARY_ARCS[id] && !LEGENDARY_ARCS[id].designedOnly && Array.isArray(LEGENDARY_ARCS[id].steps))
    && (() => { const s = defaultState(); return Q.acceptTale(s, 'arc_zapdos') === false && Q.advanceTale(s, 'arc_zapdos') === -1 && s.story.quests.arc_zapdos === undefined; })());
  ok('A21 main story chain intact: 24 MAIN_QUESTS with flags (the rename moved nothing)',
    MAIN_QUESTS.length === 24 && MAIN_QUESTS[0].id === 'q_partner' && MAIN_QUESTS.every((q) => q.id && q.text && q.hint));
}

// -- client schema: widening + bonds + legacy loads --
{
  const base = () => { const s = defaultState(); s.player.name = 'ASH'; return s; };
  const val = (mut) => { const s = base(); mut(s); return SCH.validateSave(JSON.parse(JSON.stringify(s))); };
  ok('A22 client schema accepts the widened quest values (active / 0 / 1 / 2 / complete / arc discovered) + bonds',
    val((s) => { s.story.quests = { tale_pallet: 'active', tale_celadon: 2, tale_saffron: 1, arc_zapdos: 'discovered', q_bill: 'complete' }; s.story.bonds = { mom: 2, sabrina: -3 }; }).ok === true);
  ok('A23 client schema rejects out-of-shape quest values and bond values',
    ['bogus', 1.5, -1, 100, null, {}, []].every((v) => val((s) => { s.story.quests = { tale_pallet: v }; }).ok === false)
    && [11, -11, 1.5, 'x', null].every((v) => val((s) => { s.story.bonds = { mom: v }; }).ok === false));
  const legacy1 = base(); legacy1.v = 1; delete legacy1.story.bonds;
  legacy1.story.quests = { arc_zapdos: 'active' };
  const mig1 = SCH.migrate(JSON.parse(JSON.stringify(legacy1)));
  const p3era = base(); delete p3era.story.bonds; p3era.story.quests = { arc_mew: 'discovered', tale_pallet: 1 };
  const mig2 = SCH.migrate(JSON.parse(JSON.stringify(p3era)));
  ok('A24 legacy saves load clean: v1 + Phase-3-era v2 migrate with bonds={} and quest values byte-identical',
    mig1.v === 2 && JSON.stringify(mig1.story.bonds) === '{}' && mig1.story.quests.arc_zapdos === 'active'
    && mig2.story.quests.arc_mew === 'discovered' && mig2.story.quests.tale_pallet === 1
    && SCH.validateSave(JSON.parse(JSON.stringify(mig2))).ok === true);
}

// -- cloud validator --
{
  ok('A25 validator tables ready (tale ids emitted by gen-tables)', VAL.tablesReady() === true);
  const good = defaultState();
  good.player.name = 'ASH'; good.player.rivalName = 'GARY';
  good.story.quests = { tale_pallet: 'active', tale_celadon: 2, tale_saffron: 'complete', arc_zapdos: 'discovered' };
  good.story.bonds = { mom: 2, retiredace: 2, koga: 1 };
  const r1 = VAL.validateSave(JSON.parse(JSON.stringify(good)));
  const badQ = JSON.parse(JSON.stringify(good)); badQ.story.quests.tale_pallet = 2.5;
  const badQ2 = JSON.parse(JSON.stringify(good)); badQ2.story.quests.tale_pallet = 'started';
  const badQ3 = JSON.parse(JSON.stringify(good)); badQ3.story.quests.tale_nope = 'active';
  const badB = JSON.parse(JSON.stringify(good)); badB.story.bonds.mom = 11;
  const badB2 = JSON.parse(JSON.stringify(good)); badB2.story.bonds = { 'Bad Key!': 1 };
  ok('A26 cloud validator: accepts widened tale stages + bonds; rejects fractional/other-string stages, unknown tale ids, out-of-range bonds, bad bond keys',
    r1.ok === true
    && VAL.validateSave(badQ).ok === false && VAL.validateSave(badQ2).ok === false
    && VAL.validateSave(badQ3).ok === false && VAL.validateSave(badB).ok === false && VAL.validateSave(badB2).ok === false,
    JSON.stringify(r1.errors));
  const legacy = JSON.parse(JSON.stringify(good)); delete legacy.story.bonds; legacy.story.quests = { arc_zapdos: 'active' };
  ok('A27 cloud validator still accepts a pre-Phase-4 save (no bonds field, string-only quests)',
    VAL.validateSave(legacy).ok === true);
  const chk = spawnSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' });
  ok('A28 gen-tables --check: committed tables match the source data', chk.status === 0, String(chk.stderr || '').slice(0, 200));
}

// ================= Part B: headless bundle — tales end-to-end =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 777;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const BADGES8 = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];
  function makeDriver(game) {
    const ui = game.ui, st = game.state, input = game.input;
    const tick = (n) => game.loop.stepTicks(n || 2);
    const pressA = () => { input.inject('a'); tick(2); input.release('a'); };
    function drain(max) { let n = 0; while ((ui.dialogueOpen || (game.scenes.top && game.scenes.top.msgOpen)) && n < (max || 400)) { pressA(); n++; } }
    function gotoMap(map, x, y) {
      st.story.position = { map, x: x || 7, y: y || 7, dir: 'down' };
      const ow = new OverworldScene();
      game.scenes.replace(ow); ow.enter(); tick(4);
      return ow;
    }
    function driveBattle() {
      let guard = 0;
      while ((game.scenes.top instanceof BattleScene) && guard < 900) {
        guard++;
        drain(60);
        if (!(game.scenes.top instanceof BattleScene)) break;
        const b = game.scenes.top;
        if (ui.menuOpen) {
          const m = ui.menu;
          if (m.kind === 'commands') {
            const idx = m.items.findIndex((it) => !it.disabled && it.value === 'fight');
            ui.debugChoose(idx >= 0 ? idx : 0); tick(3);
          } else if (m.title === 'Choose a move') {
            let best = 0, bs = -1;
            const foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
            m.items.forEach((it, i) => { if (it.disabled) return; const slot = b.ally.moves[i]; if (!slot) return; const md = MOVES[slot.id]; const sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
            ui.debugChoose(best); tick(3);
          } else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
            const idx = st.party.findIndex((mm) => mm.hp > 0 && mm !== b.ally);
            ui.debugChoose(idx >= 0 ? idx : m.items.length - 1); tick(3);
          } else { ui.debugChoose(m.items.length - 1); tick(3); }
        } else { pressA(); tick(3); }
      }
      drain(120);
    }
    function talkTo(ow, name) {
      const npc = ow.map.npcs.find((n) => n.name === name);
      if (!npc) return false;
      ow.partner.px = -32; ow.partner.py = -32; // the partner lerps onto faced tiles during drains and would eat the interact (pet check first)
      ow.player.tx = npc.x; ow.player.ty = npc.y + 1;
      ow.player.px = npc.x * 16; ow.player.py = (npc.y + 1) * 16;
      ow.player.dir = 'up';
      ow.tryInteract();
      drain(160);
      if (game.scenes.top instanceof BattleScene) driveBattle();
      drain(80);
      return true;
    }
    function faceSpot(ow, x, y, px, py, dir) {
      ow.partner.px = -32; ow.partner.py = -32;
      ow.player.tx = px; ow.player.ty = py; ow.player.px = px * 16; ow.player.py = py * 16;
      ow.player.dir = dir;
      ow.tryInteract();
      drain(160);
      if (game.scenes.top instanceof BattleScene) driveBattle();
      drain(60);
    }
    function chooseLabel(frag) {
      const items = ui.menu ? ui.menu.items : [];
      const i = items.findIndex((it) => it.label && it.label.includes(frag));
      if (i < 0) return false;
      ui.debugChoose(i); tick(3); drain(120);
      if (game.scenes.top instanceof BattleScene) driveBattle();
      drain(60);
      return true;
    }
    function team() {
      const mk = (id, moves) => { const m = makeMon(id, 75, SPECIES, MOVES); m.moves = moves.map((x) => ({ id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp })); return m; };
      st.party = [
        mk('partner', ['thunderbolt', 'quickattack', 'thunderwave', 'slam']),
        mk('venusaur', ['razorleaf', 'bodyslam', 'sleeppowder', 'cut']),
        mk('charizard', ['flamethrower', 'slash', 'fly', 'firespin']),
        mk('blastoise', ['surf', 'icebeam', 'bodyslam', 'bite']),
        mk('gengar', ['psychic', 'hypnosis', 'nightshade', 'thunderbolt']),
        mk('snorlax', ['bodyslam', 'hyperbeam', 'rest', 'earthquake']),
      ];
    }
    return { ui, st, gotoMap, talkTo, faceSpot, chooseLabel, drain, driveBattle, team };
  }

  // ================= GAME 1: the natural run =================
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const D = makeDriver(game);
  const ui = D.ui, st = D.st;
  st.settings.battleStyle = 'classic';
  D.team();
  const Q = (id) => st.story.quests[id];
  const bond = (n) => st.story.bonds[n] || 0;

  // Legendary-arc regression: the arc stage steps advance through the
  // SAME runSteps machinery, untouched by the tales generalization.
  {
    const ow0 = D.gotoMap('pallet', 7, 7);
    ow0.runSteps([{ arc: 'arc_zapdos', stage: 'discovered' }, { arc: 'arc_zapdos', stage: 'active' }], 0, () => {});
    out.arcStage = Q('arc_zapdos');
  }

  // ---- NPC injection + no shared-data mutation ----
  {
    const ow = D.gotoMap('pallet', 7, 7);
    out.momInjected = ow.map.npcs.some((n) => n.name === 'MOM' && n.tale === 'tale_pallet');
    out.sharedPalletClean = !MAPS.pallet.npcs.some((n) => n.name === 'MOM');
    const owP = D.gotoMap('pewter', 7, 7);
    const cur = owP.map.npcs.find((n) => n.name === 'CURATOR');
    out.curatorPatched = !!cur && cur.tale === 'tale_pewter' && cur.role === 'giver';
    out.sharedCuratorClean = !(MAPS.pewter.npcs.find((n) => n.name === 'CURATOR') || {}).tale;
  }

  // ---- Pallet ----
  {
    const ow = D.gotoMap('pallet', 7, 7);
    const potions0 = st.bag.potion || 0;
    D.talkTo(ow, 'MOM');
    out.palletAccepted = Q('tale_pallet');
    const owV = D.gotoMap('mart', 5, 5); // Wave 5b: SHOPKEEPER is indoors (Viridian Mart scene)
    D.talkTo(owV, 'SHOPKEEPER');
    out.palletStage1 = Q('tale_pallet');
    const ow2 = D.gotoMap('pallet', 7, 7);
    D.talkTo(ow2, 'MOM');
    out.palletDone = Q('tale_pallet');
    out.palletPotions = (st.bag.potion || 0) - potions0;
    out.palletBond = bond('mom');
  }

  // ---- Viridian (return path) ----
  {
    const ow = D.gotoMap('viridian', 7, 7);
    D.talkTo(ow, 'ACE MARLOW');
    out.viridianAccepted = Q('tale_viridian');
    const owF = D.gotoMap('route2', 6, 6);
    D.faceSpot(owF, 12, 3, 12, 4, 'up');
    out.viridianStage1 = Q('tale_viridian');
    const ow2 = D.gotoMap('viridian', 7, 7);
    D.talkTo(ow2, 'ACE MARLOW');
    out.viridianMenu = D.chooseLabel('Return it');
    out.viridianDone = Q('tale_viridian');
    out.viridianCharm = st.bag.tortoisecharm || 0;
    out.viridianBond = bond('retiredace');
    out.viridianReturnedFlag = st.story.flags.tale_viridian_returned === true;
  }

  // ---- Pewter (quiz with a deliberate wrong answer, then the spar) ----
  {
    const ow = D.gotoMap('pewter', 7, 7);
    D.talkTo(ow, 'CURATOR');
    out.pewterAccepted = Q('tale_pewter');
    D.talkTo(ow, 'CURATOR'); // opens the quiz
    out.quizWrongFirst = D.chooseLabel('A tiny lighthouse'); // wrong: correction + re-ask
    out.quizQ1 = D.chooseLabel('Ancient DNA');
    out.quizQ2 = D.chooseLabel('Helix Fossil');
    out.quizQ3 = D.chooseLabel('The mountain itself');
    out.pewterStage1 = Q('tale_pewter');
    D.talkTo(ow, 'BROCK');
    out.pewterSparMenu = D.chooseLabel('Spar');
    out.pewterDone = Q('tale_pewter');
    out.pewterAcorn = st.bag.ironacorn || 0;
    out.pewterBond = bond('brock');
  }

  // ---- Cerulean (talk path) ----
  {
    const ow = D.gotoMap('cerulean', 8, 8);
    D.talkTo(ow, 'TESS');
    D.talkTo(ow, 'WREN'); D.talkTo(ow, 'ORIN'); D.talkTo(ow, 'FAN');
    out.ceruleanStage1 = Q('tale_cerulean');
    D.talkTo(ow, 'PIP');
    out.ceruleanTalkChoice = D.chooseLabel('Talk it out');
    out.ceruleanDone = Q('tale_cerulean');
    out.ceruleanTm = st.bag.tm11 || 0;
    out.ceruleanBond = bond('misty');
  }

  // ---- Vermilion (pre-departure dock spot) ----
  {
    const ow = D.gotoMap('vermilion', 8, 8);
    D.talkTo(ow, 'CHAIRMAN');
    D.faceSpot(ow, 5, 11, 4, 11, 'right');
    out.vermilionStage1 = Q('tale_vermilion');
    D.talkTo(ow, 'CHAIRMAN');
    out.vermilionDone = Q('tale_vermilion');
    out.vermilionPearl = st.bag.tidepearl || 0;
    out.vermilionBond = bond('surge');
  }

  // ---- Lavender ----
  {
    const ow = D.gotoMap('lavender', 8, 8);
    D.talkTo(ow, 'VOLUNTEER');
    const owT = D.gotoMap('tower1', 4, 5);
    D.faceSpot(owT, 4, 2, 4, 3, 'up');
    out.lavenderStage1 = Q('tale_lavender');
    const ow2 = D.gotoMap('lavender', 8, 8);
    D.talkTo(ow2, 'ELDER BRAM');
    out.lavenderDone = Q('tale_lavender');
    out.lavenderBell = st.bag.spectrebell || 0;
    out.lavenderBond = bond('fuji');
  }

  // ---- Celadon (badge-paced visits) ----
  {
    const ow = D.gotoMap('celadon', 8, 8);
    st.badges.kanto = [];
    D.talkTo(ow, 'GARDENER'); // accept
    D.talkTo(ow, 'GARDENER'); // watering 1
    out.celadonStage1 = Q('tale_celadon');
    D.talkTo(ow, 'GARDENER'); // locked: 0 badges < 4
    out.celadonLockedAt0 = Q('tale_celadon');
    st.badges.kanto = BADGES8.slice(0, 4);
    D.talkTo(ow, 'GARDENER'); // watering 2
    out.celadonStage2 = Q('tale_celadon');
    D.talkTo(ow, 'GARDENER'); // locked: 4 badges < 6
    out.celadonLockedAt4 = Q('tale_celadon');
    st.badges.kanto = BADGES8.slice(0, 6);
    D.talkTo(ow, 'GARDENER'); // watering 3 + Meowth chase (battle driven by talkTo/choose helpers)
    out.celadonDone = Q('tale_celadon');
    out.celadonSash = st.bag.gardeniasash || 0;
    out.celadonBond = bond('erika');
  }

  // ---- Cinnabar (two mansion shelves, either order proof: east first) ----
  {
    const ow = D.gotoMap('cinnabar', 8, 8);
    D.talkTo(ow, 'LAB TECH');
    const owM = D.gotoMap('mansion', 8, 8);
    D.faceSpot(owM, 15, 2, 15, 3, 'up');
    out.cinnabarEastFirst = Q('tale_cinnabar') + ':' + !!st.story.flags.tale_cinnabar_east;
    D.faceSpot(owM, 3, 2, 3, 3, 'up');
    out.cinnabarStage1 = Q('tale_cinnabar');
    const ow2 = D.gotoMap('cinnabar', 8, 8);
    D.talkTo(ow2, 'LAB TECH');
    out.cinnabarDone = Q('tale_cinnabar');
    out.cinnabarSeed = st.bag.embereed || 0;
    out.cinnabarBond = bond('blaine');
  }

  // ---- Saffron (IOU branch, redeemed with the Marsh Badge in hand) ----
  {
    const owD = D.gotoMap('dojo', 7, 3);
    D.talkTo(owD, 'MASTER KO');
    out.saffronAccepted = Q('tale_saffron');
    const owG = D.gotoMap('gym-saffron', 7, 5);
    D.talkTo(owG, 'SABRINA'); // delivery -> stage 1
    out.saffronStage1 = Q('tale_saffron');
    D.talkTo(owG, 'SABRINA'); // witness + choice menu
    out.saffronIouChoice = D.chooseLabel('keepsake IOU');
    out.saffronStage2 = Q('tale_saffron');
    out.saffronIouFlag = st.story.flags.tale_saffron_iou === true;
    D.talkTo(owG, 'SABRINA'); // redeem (marshbadge held from the Celadon setup)
    out.saffronDone = Q('tale_saffron');
    out.saffronIouGranted = st.bag.sparrowfeather || 0; // first unowned piece at this point
    out.saffronBond = bond('sabrina');
  }

  // ---- Fuchsia ----
  {
    const balls0 = st.bag.safariball || 0;
    const ow = D.gotoMap('fuchsia', 8, 8);
    D.talkTo(ow, 'PRESERVE WARDEN');
    const owS = D.gotoMap('safari', 10, 11);
    D.faceSpot(owS, 3, 6, 3, 7, 'up');
    out.fuchsiaStage1 = Q('tale_fuchsia');
    const ow2 = D.gotoMap('fuchsia', 8, 8);
    D.talkTo(ow2, 'PRESERVE WARDEN');
    out.fuchsiaDone = Q('tale_fuchsia');
    out.fuchsiaBalls = (st.bag.safariball || 0) - balls0;
    out.fuchsiaBond = bond('koga');
  }

  // ---- arc survived the whole run byte-identically ----
  out.arcStageAfter = Q('arc_zapdos');

  // ---- Quest Log: three sections + tale detail ----
  {
    const sayLines = [];
    const origSay = ui.say.bind(ui);
    ui.say = (lines, cb, who) => { sayLines.push(lines.join(' | ')); return origSay(lines, cb, who); };
    game.openQuestLog();
    const labels = (ui.menu ? ui.menu.items : []).map((it) => it.label);
    out.logSections = labels.filter((l) => l.startsWith('—'));
    out.logTaleRows = labels.filter((l) => l.includes('(Canopy City)') || l.includes('(Dawnwick)'));
    const items = ui.menu ? ui.menu.items : [];
    const ri = items.findIndex((it) => it.label && it.label.includes('Roof Garden'));
    if (ri >= 0) ui.debugChoose(ri);
    D.drain(60);
    out.logTaleDetail = sayLines.join(' || ');
    ui.say = origSay;
  }

  // ================= GAME 2: post-League save, everything late =================
  const game2 = new Game(null);
  game2.ui.init(); game2.input.bindKeyboard(); game2.buildSprites(); game2.applyLayout();
  const E = makeDriver(game2);
  const st2 = E.st;
  st2.settings.battleStyle = 'classic';
  E.team();
  st2.badges.kanto = BADGES8.slice();
  st2.story.flags.champion = true;
  st2.story.flags.stanne_done = true; // the Anne has departed
  st2.story.quests.arc_mewtwo = 'complete';
  const Q2 = (id) => st2.story.quests[id];
  const bond2 = (n) => st2.story.bonds[n] || 0;
  {
    let ow = E.gotoMap('pallet', 7, 7);
    E.talkTo(ow, 'MOM');
    ow = E.gotoMap('mart', 5, 5); // Wave 5b: SHOPKEEPER is indoors (Viridian Mart scene)
    E.talkTo(ow, 'SHOPKEEPER');
    ow = E.gotoMap('pallet', 7, 7);
    E.talkTo(ow, 'MOM');
    out.latePallet = Q2('tale_pallet') + ':' + bond2('mom');
    // Viridian KEEP path
    ow = E.gotoMap('viridian', 7, 7);
    E.talkTo(ow, 'ACE MARLOW');
    ow = E.gotoMap('route2', 6, 6);
    E.faceSpot(ow, 12, 3, 12, 4, 'up');
    ow = E.gotoMap('viridian', 7, 7);
    E.talkTo(ow, 'ACE MARLOW');
    out.lateViridianChoice = E.chooseLabel('Keep it');
    out.lateViridian = Q2('tale_viridian') + ':' + (st2.bag.tortoisecharm || 0) + ':' + bond2('retiredace') + ':' + !!st2.story.flags.tale_viridian_returned;
    // Pewter late
    ow = E.gotoMap('pewter', 7, 7);
    E.talkTo(ow, 'CURATOR'); E.talkTo(ow, 'CURATOR');
    E.chooseLabel('Ancient DNA'); E.chooseLabel('Helix Fossil'); E.chooseLabel('The mountain itself');
    E.talkTo(ow, 'BROCK'); E.chooseLabel('Spar');
    out.latePewter = Q2('tale_pewter') + ':' + (st2.bag.ironacorn || 0);
    // Cerulean BATTLE path
    ow = E.gotoMap('cerulean', 8, 8);
    E.talkTo(ow, 'TESS'); E.talkTo(ow, 'WREN'); E.talkTo(ow, 'ORIN'); E.talkTo(ow, 'FAN');
    E.talkTo(ow, 'PIP');
    out.lateCeruleanChoice = E.chooseLabel('Battle for it');
    out.lateCerulean = Q2('tale_cerulean') + ':' + (st2.bag.tm11 || 0) + ':' + bond2('misty');
    // Vermilion via the HARBORMASTER fallback (Anne departed)
    ow = E.gotoMap('vermilion', 8, 8);
    E.talkTo(ow, 'CHAIRMAN');
    E.talkTo(ow, 'HARBORMASTER');
    out.lateVermilionStage = Q2('tale_vermilion');
    E.talkTo(ow, 'CHAIRMAN');
    out.lateVermilion = Q2('tale_vermilion') + ':' + (st2.bag.tidepearl || 0) + ':' + bond2('surge');
    // Lavender late
    ow = E.gotoMap('lavender', 8, 8);
    E.talkTo(ow, 'VOLUNTEER');
    ow = E.gotoMap('tower1', 4, 5);
    E.faceSpot(ow, 4, 2, 4, 3, 'up');
    ow = E.gotoMap('lavender', 8, 8);
    E.talkTo(ow, 'ELDER BRAM');
    out.lateLavender = Q2('tale_lavender') + ':' + (st2.bag.spectrebell || 0);
    // Celadon with all badges: three visits back-to-back (never missable)
    ow = E.gotoMap('celadon', 8, 8);
    E.talkTo(ow, 'GARDENER'); E.talkTo(ow, 'GARDENER'); E.talkTo(ow, 'GARDENER'); E.talkTo(ow, 'GARDENER');
    out.lateCeladon = Q2('tale_celadon') + ':' + (st2.bag.gardeniasash || 0) + ':' + bond2('erika');
    // Saffron IOU redeemed post-badge (badge already held)
    ow = E.gotoMap('dojo', 7, 3);
    E.talkTo(ow, 'MASTER KO');
    ow = E.gotoMap('gym-saffron', 7, 5);
    E.talkTo(ow, 'SABRINA'); E.talkTo(ow, 'SABRINA');
    E.chooseLabel('keepsake IOU');
    E.talkTo(ow, 'SABRINA');
    out.lateSaffron = Q2('tale_saffron') + ':' + bond2('sabrina') + ':' + ((st2.bag.tortoisecharm || 0) + (st2.bag.sparrowfeather || 0));
    // Fuchsia late
    ow = E.gotoMap('fuchsia', 8, 8);
    E.talkTo(ow, 'PRESERVE WARDEN');
    ow = E.gotoMap('safari', 10, 11);
    E.faceSpot(ow, 3, 6, 3, 7, 'up');
    ow = E.gotoMap('fuchsia', 8, 8);
    E.talkTo(ow, 'PRESERVE WARDEN');
    out.lateFuchsia = Q2('tale_fuchsia') + ':' + (st2.bag.safariball || 0);
    // Cinnabar late
    ow = E.gotoMap('cinnabar', 8, 8);
    E.talkTo(ow, 'LAB TECH');
    ow = E.gotoMap('mansion', 8, 8);
    E.faceSpot(ow, 3, 2, 3, 3, 'up'); E.faceSpot(ow, 15, 2, 15, 3, 'up');
    ow = E.gotoMap('cinnabar', 8, 8);
    E.talkTo(ow, 'LAB TECH');
    out.lateCinnabar = Q2('tale_cinnabar') + ':' + (st2.bag.embereed || 0) + ':' + bond2('blaine');
    out.lateArcUntouched = Q2('arc_mewtwo');
  }

  // ================= GAME 3: Saffron SPAR branch + the IOU badge gate =================
  const game3 = new Game(null);
  game3.ui.init(); game3.input.bindKeyboard(); game3.buildSprites(); game3.applyLayout();
  const F = makeDriver(game3);
  const st3 = F.st;
  st3.settings.battleStyle = 'classic';
  F.team();
  const Q3 = (id) => st3.story.quests[id];
  {
    let ow = F.gotoMap('dojo', 7, 3);
    F.talkTo(ow, 'MASTER KO');
    ow = F.gotoMap('gym-saffron', 7, 5);
    F.talkTo(ow, 'SABRINA');
    F.talkTo(ow, 'SABRINA');
    out.g3IouChoice = F.chooseLabel('keepsake IOU');
    // Without the Marsh Badge the tale handler DECLINES Sabrina, so her
    // ordinary gym flow (the battle) owns the talk — the tale cannot
    // strand or gate the badge.
    const sab = ow.map.npcs.find((n) => n.name === 'SABRINA');
    out.g3SabrinaDeclinesPreBadge = ow.sysNpc(sab) === false && Q3('tale_saffron') === 2;
    // Spar branch on a second run of the choice: rewind the choice flag
    // is not a game feature — instead prove the spar branch in a fresh
    // state below (game4 mini-driver would cost a fourth boot; the spar
    // branch shares taleSpar with Pewter/Celadon, proven there, and its
    // Saffron-specific half is driven in game4).
  }
  const game4 = new Game(null);
  game4.ui.init(); game4.input.bindKeyboard(); game4.buildSprites(); game4.applyLayout();
  const G = makeDriver(game4);
  const st4 = G.st;
  st4.settings.battleStyle = 'classic';
  G.team();
  const Q4 = (id) => st4.story.quests[id];
  {
    let ow = G.gotoMap('dojo', 7, 3);
    G.talkTo(ow, 'MASTER KO');
    ow = G.gotoMap('gym-saffron', 7, 5);
    G.talkTo(ow, 'SABRINA'); G.talkTo(ow, 'SABRINA');
    out.g4SparChoice = G.chooseLabel('Dojo spar (XP)');
    out.g4Stage2 = Q4('tale_saffron');
    ow = G.gotoMap('dojo', 7, 3);
    G.talkTo(ow, 'MASTER KO');
    out.g4SparMenu = G.chooseLabel('Spar');
    out.g4Done = Q4('tale_saffron');
    out.g4Bond = st4.story.bonds.sabrina || 0;
  }

  console.log('REJUV4-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('REJUV4-RESULT')) || 'REJUV4-RESULT {}').slice(14));
const J = JSON.stringify(res);

ok('B01 arc regression in the bundle: runSteps arc stages write discovered->active through the untouched machinery',
  res.arcStage === 'active', J.slice(0, 400));
ok('B02 tale NPCs are injected into the scene map copy; shared MAPS data is never mutated (coach-pattern)',
  res.momInjected === true && res.sharedPalletClean === true && res.curatorPatched === true && res.sharedCuratorClean === true, J.slice(0, 400));
ok('B03 Pallet end-to-end: accept at Mom -> deliver to Viridian shopkeeper (stage 1) -> receipt home = complete, +3 Potions, Mom bond +2',
  res.palletAccepted === 'active' && res.palletStage1 === 1 && res.palletDone === 'complete' && res.palletPotions === 3 && res.palletBond === 2, J);
ok('B04 Viridian end-to-end (return): forest spot advances, Return choice completes — Tortoise Charm granted, retiredace bond +2, returned flag set',
  res.viridianAccepted === 'active' && res.viridianStage1 === 1 && res.viridianMenu === true && res.viridianDone === 'complete'
  && res.viridianCharm === 1 && res.viridianBond === 2 && res.viridianReturnedFlag === true, J);
ok('B05 Pewter end-to-end: quiz survives a wrong answer (correction + re-ask), 3 correct answers advance, Geodude spar completes — Iron Acorn, Brock bond +2',
  res.pewterAccepted === 'active' && res.quizWrongFirst === true && res.quizQ1 === true && res.quizQ2 === true && res.quizQ3 === true
  && res.pewterStage1 === 1 && res.pewterDone === 'complete' && res.pewterAcorn === 1 && res.pewterBond === 2, J);
ok('B06 Cerulean end-to-end (talk path): 3 witnesses advance to the cape, Talk-it-out completes — TM11 lands, Misty bond +1',
  res.ceruleanStage1 === 1 && res.ceruleanTalkChoice === true && res.ceruleanDone === 'complete' && res.ceruleanTm === 1 && res.ceruleanBond === 1, J);
ok('B07 Vermilion end-to-end (pre-departure): dock spot advances, Chairman completes — Tide Pearl, Surge bond +1',
  res.vermilionStage1 === 1 && res.vermilionDone === 'complete' && res.vermilionPearl === 1 && res.vermilionBond === 1, J);
ok('B08 Lavender end-to-end: tower graves spot advances, Elder Bram completes — Spectre Bell, Mr. Fuji bond +2',
  res.lavenderStage1 === 1 && res.lavenderDone === 'complete' && res.lavenderBell === 1 && res.lavenderBond === 2, J);
ok('B09 Celadon badge pacing: visit 2 locked at 0 badges, visit 3 locked at 4, completes at 6 with the Meowth chase — Gardenia Sash, Erika bond +2',
  res.celadonStage1 === 1 && res.celadonLockedAt0 === 1 && res.celadonStage2 === 2 && res.celadonLockedAt4 === 2
  && res.celadonDone === 'complete' && res.celadonSash === 1 && res.celadonBond === 2, J);
ok('B10 Cinnabar end-to-end: mansion shelves in EAST-first order still complete the pair — Ember Seed, Blaine bond +1',
  res.cinnabarEastFirst === 'active:true' && res.cinnabarStage1 === 1 && res.cinnabarDone === 'complete' && res.cinnabarSeed === 1 && res.cinnabarBond === 1, J);
ok('B11 Saffron end-to-end (IOU branch): message -> witness choice sets the IOU flag -> redeemed post-badge for the first unowned keepsake (Sparrow Feather here), Sabrina bond +1',
  res.saffronAccepted === 'active' && res.saffronStage1 === 1 && res.saffronIouChoice === true && res.saffronStage2 === 2
  && res.saffronIouFlag === true && res.saffronDone === 'complete' && res.saffronIouGranted === 1 && res.saffronBond === 1, J);
ok('B12 Fuchsia end-to-end: safari marsh spot advances, Warden + Janine complete it — +10 Safari Balls, Koga bond +1',
  res.fuchsiaStage1 === 1 && res.fuchsiaDone === 'complete' && res.fuchsiaBalls === 10 && res.fuchsiaBond === 1, J);
ok('B13 arc value byte-identical after all 10 tales ran in the same save',
  res.arcStageAfter === 'active', J.slice(0, 200));
ok('B14 Quest Log renders three sections (Main Story / Legendary Arcs / Town Tales) with tale rows',
  Array.isArray(res.logSections) && res.logSections.some((l) => l.includes('MAIN STORY'))
  && res.logSections.some((l) => l.includes('LEGENDARY ARCS')) && res.logSections.some((l) => l.includes('TOWN TALES'))
  && (res.logTaleRows || []).length >= 2, J);
ok('B15 Quest Log tale detail: stage text + stated reward + revelation for a completed tale',
  typeof res.logTaleDetail === 'string' && res.logTaleDetail.includes('Reward: Gardenia Sash')
  && res.logTaleDetail.includes('Complete.') && res.logTaleDetail.includes('first gym'), String(res.logTaleDetail).slice(0, 300));
ok('B16 post-League missability: Pallet completes late (bond +2); Viridian KEEP path completes — charm owned, NO bond, no returned flag',
  res.latePallet === 'complete:2' && res.lateViridianChoice === true && res.lateViridian === 'complete:1:0:false', J);
ok('B17 post-League: Pewter completes late; Cerulean BATTLE path completes (real trainer battle vs the kid) — TM11 + Misty bond',
  res.latePewter === 'complete:1' && res.lateCeruleanChoice === true && res.lateCerulean === 'complete:1:1', J);
ok('B18 post-League: Vermilion completes via the HARBORMASTER fallback after the Anne departed — Tide Pearl + Surge bond',
  res.lateVermilionStage === 1 && res.lateVermilion === 'complete:1:1', J);
ok('B19 post-League: Lavender, Celadon (all badges — 3 visits back-to-back, never missable), Fuchsia, Cinnabar all complete late',
  res.lateLavender === 'complete:1' && res.lateCeladon === 'complete:1:2' && res.lateFuchsia === 'complete:10' && res.lateCinnabar === 'complete:1:1', J);
ok('B20 post-League: Saffron IOU redeemed with the badge already held; the completed arc in the same save is untouched',
  typeof res.lateSaffron === 'string' && res.lateSaffron.startsWith('complete:1:') && res.lateArcUntouched === 'complete', J);
ok('B21 Saffron gate honesty: at IOU stage without the Marsh Badge, Sabrina\'s tale handler DECLINES (sysNpc false) so the gym battle owns the talk — stage stays 2, never stranded',
  res.g3IouChoice === true && res.g3SabrinaDeclinesPreBadge === true, J);
ok('B22 Saffron SPAR branch resolves completely: choice -> Dojo spar won -> tale complete, Sabrina bond +1',
  res.g4SparChoice === true && res.g4Stage2 === 2 && res.g4SparMenu === true && res.g4Done === 'complete' && res.g4Bond === 1, J);

// ================= Part C: real headless Chromium =================
{
  const pubHtml = join(ROOT, 'public', 'index.html');
  const pubJs = join(ROOT, 'public', 'game.js');
  if (!existsSync(pubHtml) || !existsSync(pubJs) || !existsSync('/opt/meta-chromium/chrome')) {
    ok('C01 real-browser smoke (skipped: built bundle or chromium missing)', false, 'build first: node scripts/build.mjs');
  } else {
    const CSP = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers
      .find((h) => h.key === 'Content-Security-Policy').value;
    const HTML_B64 = readFileSync(pubHtml).toString('base64');
    const GAME_B64 = readFileSync(pubJs).toString('base64');
    const cport = 9800 + (process.pid % 150);
    const chrome = spawn('/opt/meta-chromium/chrome', [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/rejuv4-chrome-' + cport,
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
      for (let i = 0; i < 100 && !canvasOk; i++) { canvasOk = await evl("typeof Game === 'function' && typeof QUESTS === 'object' && !!document.querySelector('canvas')"); if (!canvasOk) await sleep(150); }
      ok('C00 chromium boots the built bundle (Game + tales table live)', canvasOk === true);
      const browserDriver = `(() => {
        const out = {};
        try {
          out.taleCount = Object.keys(QUESTS).length;
          const game = new Game(null);
          game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
          game.state.story.quests.arc_zapdos = 'active'; // mid-game state: an arc in progress, as in Part B
          game.openQuestLog();
          const labels = (game.ui.menu ? game.ui.menu.items : []).map((it) => it.label);
          out.sections = labels.filter((l) => l.startsWith('—'));
          out.taleRows = labels.filter((l) => l.includes('( Town)') === false && /\\((Dawnwick|Fernmere City|Flintridge City|Tidehaven City|Arcport City|Hushmoor Town|Canopy City|Farsight City|Bramble City|Caldera Town)\\)/.test(l)).length;
          const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
          out.momThere = ow.map.npcs.some((n) => n.name === 'MOM');
        } catch (e) { out.error = String((e && e.stack) || e); }
        return out;
      })()`;
      const br = await evl(browserDriver);
      ok('C01 real-browser: 10 tales in the shipped bundle; Quest Log shows all three section headers and all 10 tale rows',
        !!br && br.taleCount === 10 && Array.isArray(br.sections) && br.sections.length === 3 && br.taleRows === 10,
        JSON.stringify(br));
      ok('C02 real-browser: tale NPC injection live in the shipped bundle (MOM stands in Pallet)',
        !!br && br.momThere === true, JSON.stringify(br));
      ws.close();
    } catch (e) {
      ok('C01 real-browser smoke (chromium harness)', false, String(e).slice(0, 300));
    } finally {
      try { chrome.kill(); } catch (e) { /* already gone */ }
    }
  }
}

console.log('rejuv-phase4-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
