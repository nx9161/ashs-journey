// frontier-checks.mjs — Arc 3.5 Stage F0 (Battle Frontier: symbol
// quintet + Frontier arming) proofs. Part A: pure units — the symbol
// quintet (ITEMS rows <-> BADGE_SETS.symbols slot order 1:1, the
// defaultState seed, the client schema pair, the server validator
// pair incl. the no-prefix-check proof and the summary-count call,
// gen-tables), the deriveArcDefaults sealed-homecoming catch-up
// (four fixtures), the registry flip, CAPT FRONTIER's placement +
// Pallet connectivity, and the Cheat Terminal exclusion (pure part).
// Part B: the built bundle in a headless Game — CAPT FRONTIER on
// Pallet's live roster, the ferry gate line with embark_frontier
// deleted and NO warp (the crossing itself is F1's proof —
// frontierhub does not exist yet), and the live Cheat Terminal stock.
// Part A2 (F1): the 11 maps8 maps — hub idioms (shared Center/Mart
// WITH via, dock start, CAPT BREAKWATER + SCOTT), the receptionist
// frontier:<facilityId> markers naming facility + Brain, the Pike
// one-way geometry, the Pyramid dark-floor cycle. Part C (F1): the
// built bundle — THE CROSSING both ways (post-arm outbound; return
// with embark_frontier DELETED still sailing, NO-SOFT-LOCK) and
// walking drives with NO position seeding (dock -> all 7 facility
// doors + Center/Mart -> inside -> exit warp -> hub; the full Pike
// run on foot; the Pyramid floor cycle on foot).
// Part E (F4): the CAPSTONE — a save seeded (B09-style counter
// seeding, the established isolation precedent: earned-state counters
// and slots are seeded directly and named inline, the completion
// itself is then driven TRUE-PATH) at six gold symbols + Pyramid
// silver + the possession faced, driven through the Brandon Gold
// win, the machine's ARC COMPLETE card, the unconditional ferry
// home, Scott's closing beat on Pallet entry, and the Sinnoh
// homecoming at Mom's house (SEALED at F4; Arc 4 Stage S0 superseded
// E09-E12 to the machine's SHIPPED branch — see the E09 comment).
// Run: node tests/frontier-checks.mjs   (exit 1 on any failure)

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
const FACILITY_TO_ITEM = { tower: 'abilitysymbol', factory: 'knowledgesymbol', arena: 'gutssymbol', dome: 'tacticssymbol', pike: 'lucksymbol', palace: 'spiritsymbol', pyramid: 'bravesymbol' };
const SYMBOL_ITEM_IDS = Object.values(FACILITY_TO_ITEM);
const ALL_NULL = [null, null, null, null, null, null, null];

// ================= Part A: pure units =================
const { arcById, arcStateOf } = await import(join(ROOT, 'src/data/arcs.mjs'));
const { ITEMS, BADGE_SETS } = await import(join(ROOT, 'src/data/items.mjs'));
const { TALE_NPCS } = await import(join(ROOT, 'src/data/quests.mjs'));
const { MAPS, WALKABLE } = await import(join(ROOT, 'src/data/maps.mjs'));
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

// -- the quintet: ITEMS <-> BADGE_SETS <-> defaultState --
{
  ok('A01 BADGE_SETS.symbols is the SLOT ORDER [tower, factory, arena, dome, pike, palace, pyramid] (facility ids, slot i = badges.symbols[i])',
    JSON.stringify(BADGE_SETS.symbols) === JSON.stringify(['tower', 'factory', 'arena', 'dome', 'pike', 'palace', 'pyramid']));
  ok('A02 slot order <-> ITEMS rows 1:1 (tower->ability, factory->knowledge, arena->guts, dome->tactics, pike->luck, palace->spirit, pyramid->brave; every row key-pocket, Emerald Symbol name, original flavour text)',
    BADGE_SETS.symbols.every((fac) => { const it = ITEMS[FACILITY_TO_ITEM[fac]]; return it && it.pocket === 'key' && /Symbol$/.test(it.name) && typeof it.desc === 'string' && it.desc.length > 20; })
    && SYMBOL_ITEM_IDS.every((id) => ITEMS[id] && ITEMS[id].id === id)
    && ITEMS.abilitysymbol.name === 'Ability Symbol' && ITEMS.knowledgesymbol.name === 'Knowledge Symbol'
    && ITEMS.gutssymbol.name === 'Guts Symbol' && ITEMS.tacticssymbol.name === 'Tactics Symbol'
    && ITEMS.lucksymbol.name === 'Luck Symbol' && ITEMS.spiritsymbol.name === 'Spirit Symbol'
    && ITEMS.bravesymbol.name === 'Brave Symbol');
  ok('A03 defaultState seed verified (not duplicated): badges.symbols is [null x7]',
    JSON.stringify(defaultState().badges.symbols) === JSON.stringify(ALL_NULL));
  const fr = arcById('frontier');
  ok('A04 registry flip: frontier status shipped; nothing else in the row moved (badgeSet symbols, badgeTotal 7, completionFlag frontier_complete, embark pallet -> frontierhub, hook scott, band null open level)',
    fr.status === 'shipped' && fr.badgeSet === 'symbols' && fr.badgeTotal === 7
    && fr.completionFlag === 'frontier_complete' && fr.embarkPort === 'pallet' && fr.arrivalMap === 'frontierhub'
    && fr.hookGiver === 'scott' && fr.band === null && fr.dexHorizon === 386);
}

// -- the quintet: client schema pair --
{
  const withSym = (sym) => { const s = clone(defaultState()); s.badges.symbols = sym; return s; };
  ok('A05 client schema accepts tier mixes: all-null, a silver/gold mix, and slot-6-gold-only (unordered — no prefix rule)',
    SCH.validateSave(withSym(ALL_NULL)).ok
    && SCH.validateSave(withSym([null, 'silver', 'gold', null, 'gold', 'silver', null])).ok
    && SCH.validateSave(withSym([null, null, null, null, null, null, 'gold'])).ok,
    JSON.stringify(SCH.validateSave(withSym([null, null, null, null, null, null, 'gold'])).errors));
  ok('A06 client schema rejects a bad tier, a wrong length (6 and 8) and a non-array (bad-badges-symbols)',
    SCH.validateSave(withSym([null, 'platinum', null, null, null, null, null])).errors.includes('bad-badges-symbols')
    && SCH.validateSave(withSym([null, null, null, null, null, null])).errors.includes('bad-badges-symbols')
    && SCH.validateSave(withSym([null, null, null, null, null, null, null, null])).errors.includes('bad-badges-symbols')
    && SCH.validateSave(withSym('gold')).errors.includes('bad-badges-symbols')
    && SCH.validateSave(withSym([null, null, null, null, null, null, 7])).errors.includes('bad-badges-symbols'));
  const filled = (sym) => SCH.migrate(withSym(sym)).badges.symbols;
  ok('A07 save-fill PRESERVES earned tiers (a full silver/gold mix round-trips byte-identical through migrate)',
    JSON.stringify(filled(['gold', null, 'silver', null, null, 'gold', 'silver'])) === JSON.stringify(['gold', null, 'silver', null, null, 'gold', 'silver']));
  ok('A08 save-fill repairs shape only: non-array -> all-null; short pads with nulls; long truncates; invalid entries -> null (tiers beside them survive)',
    JSON.stringify(filled('gold')) === JSON.stringify(ALL_NULL)
    && JSON.stringify(filled(['silver'])) === JSON.stringify(['silver', null, null, null, null, null, null])
    && JSON.stringify(filled(['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold'])) === JSON.stringify(['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold'])
    && JSON.stringify(filled(['silver', 'platinum', 7, null, 'gold', {}, 'silver'])) === JSON.stringify(['silver', null, null, null, 'gold', null, 'silver']));
}

// -- the quintet: server validator pair + gen-tables --
{
  const cloud = (mut) => { const s = clone(defaultState()); s.player.name = 'ASH'; s.player.rivalName = 'GARY'; if (mut) mut(s); return s; };
  ok('A09 server validator accepts the same tier mixes incl. slot-6-gold-only with slot 0 null (the no-prefix-check proof: unordered slots validate)',
    VAL.validateSave(cloud((s) => { s.badges.symbols = [null, 'silver', 'gold', null, 'gold', 'silver', null]; })).ok
    && VAL.validateSave(cloud((s) => { s.badges.symbols = [null, null, null, null, null, null, 'gold']; })).ok,
    JSON.stringify(VAL.validateSave(cloud((s) => { s.badges.symbols = [null, null, null, null, null, null, 'gold']; })).errors));
  ok('A10 server validator rejects a bad tier, a wrong length and a non-array (bad-symbols); an ABSENT symbols key is ok',
    VAL.validateSave(cloud((s) => { s.badges.symbols = [null, 'x', null, null, null, null, null]; })).errors.includes('bad-symbols')
    && VAL.validateSave(cloud((s) => { s.badges.symbols = [null, null, null, null, null, null]; })).errors.includes('bad-symbols')
    && VAL.validateSave(cloud((s) => { s.badges.symbols = 'gold'; })).errors.includes('bad-symbols')
    && VAL.validateSave(cloud((s) => { delete s.badges.symbols; })).ok);
  const counted = VAL.validateSave(cloud((s) => { s.badges.kanto = ['boulderbadge']; s.badges.symbols = [null, 'silver', 'gold', null, null, null, 'gold']; }));
  ok('A11 summary-count call (recorded): summary.badgeCount INCLUDES the non-null symbol slots (1 kanto badge + 3 symbol slots = 4)',
    counted.ok && counted.summary.badgeCount === 4, JSON.stringify(counted.summary));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A12 tables.json in sync (gen-tables --check, regenerated via the tool only); items 200 (199 + the Azure Flute, Arc 4 Stage S7 — supersedes the Stage S6 count) and carries all 7 symbol ids; badgeSequences has NO symbols entry and regionBadgeMax no symbols row (no prefix check exists to emit)',
    checkOut.includes('tables.json OK') && t.items.length === 200
    && SYMBOL_ITEM_IDS.every((id) => t.items.includes(id))
    && !('symbols' in t.badgeSequences) && !('symbols' in t.regionBadgeMax), checkOut.trim());
}

// -- arming: the deriveArcDefaults catch-up (four fixtures) --
{
  const frontierSave = (mut) => {
    const s = clone(defaultState());
    s.story.arc = 'hoenn'; s.story.region = 'hoenn';
    s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn'];
    s.badges.hoenn = [...BADGE_SETS.hoenn];
    // Fixture totals at the (would-be) advance: 260 caught / 54321s
    // played, against the Hoenn-era arc-start stamps (151 / 40000)
    // a live save would still be carrying — so the catch-up's
    // re-stamp (or its absence) is observable, not vacuous.
    s.dex.caught = {}; for (let i = 1; i <= 260; i++) s.dex.caught[i] = true;
    s.player.playtimeSec = 54321;
    s.story.arcDexStart = 151; s.story.arcStartPlaytime = 40000;
    if (mut) mut(s);
    return s;
  };
  const consumed = SCH.migrate(frontierSave((s) => { s.story.flags.hook_frontier = true; s.story.flags.homecoming_frontier = true; }));
  ok('A13 derivation (i): a consumed-SEALED Frontier save (hook_frontier + homecoming_frontier, arc still hoenn, Hoenn complete in regionsDone) derives arc frontier + region kanto (frontier\'s regionKey) + embark_frontier + the arc-start snapshots (arcDexStart = the fixture\'s 260 caught, arcStartPlaytime = the fixture\'s 54321s) on load — and is idempotent',
    consumed.story.arc === 'frontier' && consumed.story.region === 'kanto' && consumed.story.flags.embark_frontier === true
    && consumed.story.arcDexStart === 260 && consumed.story.arcStartPlaytime === 54321
    && (() => { const again = SCH.migrate(clone(consumed)); return again.story.arc === 'frontier' && again.story.region === 'kanto' && again.story.flags.embark_frontier === true && again.story.arcDexStart === 260 && again.story.arcStartPlaytime === 54321; })(),
    JSON.stringify({ arc: consumed.story.arc, region: consumed.story.region, emb: consumed.story.flags.embark_frontier, dexStart: consumed.story.arcDexStart, playStart: consumed.story.arcStartPlaytime }));
  const consumedByFlag = SCH.migrate(frontierSave((s) => { s.story.regionsDone = ['kanto', 'orange', 'johto']; s.story.flags.hoenn_complete = true; s.story.flags.hook_frontier = true; s.story.flags.homecoming_frontier = true; }));
  ok('A14 derivation (i, flag form): the previous arc\'s completion met via its completionFlag (hoenn_complete, regionsDone without hoenn) derives the same repair (incl. arcDexStart 260 + arcStartPlaytime 54321)',
    consumedByFlag.story.arc === 'frontier' && consumedByFlag.story.region === 'kanto' && consumedByFlag.story.flags.embark_frontier === true
    && consumedByFlag.story.arcDexStart === 260 && consumedByFlag.story.arcStartPlaytime === 54321);
  const midHoenn = SCH.migrate(frontierSave((s) => { s.story.regionsDone = ['kanto', 'orange', 'johto']; s.story.flags = {}; }));
  ok('A15 derivation (ii): a mid-Hoenn save (no hook, no homecoming) is untouched — arc stays hoenn, region stays hoenn, no embark_frontier, arc-start stamps untouched (151 / 40000)',
    midHoenn.story.arc === 'hoenn' && midHoenn.story.region === 'hoenn' && !midHoenn.story.flags.embark_frontier
    && midHoenn.story.arcDexStart === 151 && midHoenn.story.arcStartPlaytime === 40000);
  const advanced = SCH.migrate(frontierSave((s) => { s.story.arc = 'frontier'; s.story.flags.hook_frontier = true; s.story.flags.homecoming_frontier = true; s.story.flags.embark_frontier = true; }));
  ok('A16 derivation (iii): an already-advanced save (arc frontier, embark already armed by the live homecoming) is untouched — region untouched, arc-start stamps untouched (151 / 40000)',
    advanced.story.arc === 'frontier' && advanced.story.region === 'hoenn' && advanced.story.flags.embark_frontier === true
    && advanced.story.arcDexStart === 151 && advanced.story.arcStartPlaytime === 40000);
  const pending = SCH.migrate(frontierSave((s) => { s.story.arc_directive = 'frontier'; s.story.flags.hook_frontier = true; }));
  const hookless = SCH.migrate(frontierSave((s) => { s.story.flags.homecoming_frontier = true; }));
  ok('A17 derivation (iv): a pending homecoming (directive set + hook delivered, NO homecoming flag) is untouched; and homecoming without the hook is untouched',
    pending.story.arc === 'hoenn' && !pending.story.flags.embark_frontier
    && hookless.story.arc === 'hoenn' && !hookless.story.flags.embark_frontier);
  ok('A18 arcStateOf: the repaired save reads frontier as current and hoenn as complete',
    arcStateOf(consumed, 'frontier') === 'current' && arcStateOf(consumed, 'hoenn') === 'complete');
}

// -- CAPT FRONTIER placement + Pallet connectivity (pure, sweep-style) --
// W1 resync: A20/A21 must probe the SHIPPED Dawnwick. The raw MAPS import
// above is maps.mjs's stale 16x11 pallet copy; the game folds MAPS2/MAPS3
// over it (src/data/merge.mjs, module-order), so maps3's 20x14 pallet is
// the merge winner the bundle actually ships.
const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
{
  const capt = TALE_NPCS.find((n) => n.name === 'CAPT FRONTIER');
  const johto = TALE_NPCS.find((n) => n.name === 'CAPT YAMATO');
  // W1 resync: the T1 Dawnwick rebuild (20x14) re-seated both captains to the
  // shore/dock row — CAPT FRONTIER (10,11), CAPT YAMATO (6,11) in
  // src/data/quests.mjs TALE_NPCS; the (11,9)/(14,9) stances are pre-rebuild.
  ok('A19 CAPT FRONTIER appended via the TALE_NPCS idiom on pallet (10,11) — ferry frontierhub + ferryArc frontier, sailor art, no tale/role; CAPT YAMATO at (6,11) on the dock head since the T1 Dawnwick rebuild re-seated both captains to the shore row',
    !!capt && capt.map === 'pallet' && capt.x === 10 && capt.y === 11 && capt.ferry === 'frontierhub' && capt.ferryArc === 'frontier'
    && capt.art === 'sailor' && !capt.tale && Array.isArray(capt.dialogue) && capt.dialogue.length === 2
    && !!johto && johto.x === 6 && johto.y === 11);
  const p = MAPS3.pallet; // shipped Dawnwick (merge winner), not the maps.mjs copy
  ok('A20 the stance tile seals nothing by position: (10,11) is a walkable ground tile, not a warp tile, not a door, and no base pallet NPC stands there',
    WALKABLE.has(p.rows[11][10]) && !(p.warps || []).some((w) => w.x === 10 && w.y === 11)
    && !(p.npcs || []).some((n) => n.x === 10 && n.y === 11));
  const blocked = (x, y) => (p.npcs || []).some((n) => n.x === x && n.y === y)
    || TALE_NPCS.some((n) => n.map === 'pallet' && n.x === x && n.y === y);
  const walkable = (x, y) => y >= 0 && y < p.rows.length && x >= 0 && x < p.rows[y].length && WALKABLE.has(p.rows[y][x]) && !blocked(x, y);
  const seenAll = new Set(); const comps = [];
  for (let y = 0; y < p.rows.length; y++) for (let x = 0; x < p.rows[y].length; x++) {
    if (!walkable(x, y) || seenAll.has(x + ',' + y)) continue;
    const comp = []; const q = [[x, y]]; seenAll.add(x + ',' + y);
    while (q.length) { const [a, b] = q.shift(); comp.push(a + ',' + b);
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = a + dx, ny = b + dy, k = nx + ',' + ny;
        if (!seenAll.has(k) && walkable(nx, ny)) { seenAll.add(k); q.push([nx, ny]); } } }
    comps.push(comp);
  }
  const main = comps.reduce((a, b) => (b.length > a.length ? b : a), []);
  const others = comps.filter((c) => c !== main);
  // W1 resync: on the shipped 20x14 Dawnwick the graph is one functional
  // fragment (every warp in it or beside it; both captains stand embedded
  // in it, sealing nothing) plus exactly one known sealed cell: (14,10),
  // a step-off tile whose only walkable neighbour is the MART CLERK's post
  // (14,9) — a pre-existing dead-pocket cell of the T1 rebuild, counted by
  // the reachability audit. Any NEW fragment fails this check by name.
  ok('A21 Pallet\'s walkable graph: one functional fragment with the captains standing (every warp tile in it or beside it); the only other fragment is the clerk-sealed cell (14,10)',
    (p.warps || []).every((w) => main.includes(w.x + ',' + w.y)
      || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => main.includes((w.x + dx) + ',' + (w.y + dy))))
    && others.length === 1 && others[0].length === 1 && others[0][0] === '14,10'
    && [[capt.x, capt.y], [johto.x, johto.y]].every(([cx, cy]) =>
      [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => main.includes((cx + dx) + ',' + (cy + dy)))),
    'components=' + comps.map((c) => c.length).join(','));
}

// ================= Part A2: F1 maps (pure) =================
const { MAPS8 } = await import(join(ROOT, 'src/data/maps8.mjs'));
const F1_IDS = ['frontierhub', 'frontier-tower', 'frontier-factory', 'frontier-arena', 'frontier-dome', 'frontier-pike', 'frontier-palace', 'frontier-pyramid', 'frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'];
const BRAIN = { tower: 'Esme', factory: 'Faber', arena: 'Veda', dome: 'Dorian', pike: 'Selene', palace: 'Ambrose', pyramid: 'Titus' };
const FAC_NAME = { tower: 'Trial Tower', factory: 'Trial Factory', arena: 'Trial Arena', dome: 'Trial Dome', pike: 'Trial Pike', palace: 'Trial Palace', pyramid: 'Trial Pyramid' };
{
  ok('A22 MAPS8 exports exactly the 11 F1 maps; merge.mjs folds MAPS8 into MAPS and module-order.json loads maps8.mjs after maps7.mjs (the bundle-side merge is proven live in Part C)',
    JSON.stringify(Object.keys(MAPS8)) === JSON.stringify(F1_IDS)
    && readFileSync(join(ROOT, 'src/data/merge.mjs'), 'utf8').includes('MAPS7, MAPS8')
    && (() => { const order = JSON.parse(readFileSync(join(ROOT, 'scripts/module-order.json'), 'utf8')); return order.indexOf('src/data/maps8.mjs') === order.indexOf('src/data/maps7.mjs') + 1; })());
  const hub = MAPS8.frontierhub;
  ok('A23 hub: 40x24 outdoor, weather clear, NO wild encounters, start (18,21) on the dock pier (boardwalk); CAPT BREAKWATER (ferry pallet, ferryArc frontier) and SUTTER stand on it',
    hub.rows.length === 24 && hub.rows[0].length === 40 && hub.weather === 'clear' && hub.encounters === null
    && hub.start.x === 18 && hub.start.y === 21
    && hub.npcs.some((n) => n.name === 'CAPT BREAKWATER' && n.ferry === 'pallet' && n.ferryArc === 'frontier')
    && hub.npcs.some((n) => n.name === 'SUTTER' && Array.isArray(n.dialogue) && n.dialogue.length >= 2));
  const doorTo = (mid) => hub.warps.filter((w) => w.to.map === mid);
  ok('A24 hub Center/Mart doors ride the shared interiors WITH via (decision #9): center warps -> center (4,4) via the hub front tiles; mart warps -> mart (5,5) via the hub front tiles',
    doorTo('center').length === 2 && doorTo('center').every((w) => w.to.x === 4 && w.to.y === 4 && w.via && w.via.map === 'frontierhub' && w.via.x === w.x && w.via.y === w.y + 1)
    && doorTo('mart').length === 2 && doorTo('mart').every((w) => w.to.x === 5 && w.to.y === 5 && w.via && w.via.map === 'frontierhub' && w.via.x === w.x && w.via.y === w.y + 1));
  ok('A25 every facility door warp lands exactly on its interior start tile',
    ['frontier-tower', 'frontier-factory', 'frontier-arena', 'frontier-dome', 'frontier-pike', 'frontier-palace', 'frontier-pyramid']
      .every((mid) => doorTo(mid).length >= 1 && doorTo(mid).every((w) => w.to.x === MAPS8[mid].start.x && w.to.y === MAPS8[mid].start.y)));
  let recepOk = true, recepDetail = '';
  for (const fac of Object.keys(BRAIN)) {
    const m = MAPS8['frontier-' + fac];
    const clerks = (m.npcs || []).filter((n) => n.frontier === fac);
    if (clerks.length !== 1) { recepOk = false; recepDetail = fac + ' clerks=' + clerks.length; break; }
    const text = clerks[0].dialogue.join(' ');
    if (!text.includes(FAC_NAME[fac]) || !text.includes(BRAIN[fac])) { recepOk = false; recepDetail = fac + ' dialogue missing facility/Brain'; break; }
    if ((m.npcs || []).length !== 1) { recepOk = false; recepDetail = fac + ' has extra NPCs (Brain dais must be EMPTY)'; break; }
    if (!m.rows.some((r) => r.includes('λ'))) { recepOk = false; recepDetail = fac + ' has no podium dais'; break; }
    if (m.encounters !== null) { recepOk = false; recepDetail = fac + ' encounters not null'; break; }
  }
  ok('A26 each facility interior: exactly ONE receptionist carrying frontier:<facilityId>, greeting dialogue naming the facility and its Brain, an EMPTY podium dais (no other NPCs), no encounters', recepOk, recepDetail);
  const pike = MAPS8['frontier-pike'];
  let pikeOk = pike.warps.length === 27;
  for (let i = 1; i <= 7 && pikeOk; i++) {
    const top = 10 + (7 - i) * 9, nxt = i === 7 ? 8 : (10 + (6 - i) * 9) + 7;
    for (const dx of [3, 7, 11]) {
      const w = pike.warps.find((x) => x.x === dx && x.y === top);
      if (!w || w.to.map !== 'frontier-pike' || w.to.x !== dx || w.to.y !== nxt) pikeOk = false;
    }
  }
  ok('A27 pike geometry: 27 warps; each chamber\'s 3 north doors (x=3/7/11) warp to the NEXT chamber\'s entry row at the same spread x (chamber 7 -> the dais entry row y=8); dais exits (7,0)/(8,0) warp to the hall (7,81); hall exits warp to the hub',
    pikeOk && [7, 8].every((x) => { const w = pike.warps.find((v) => v.x === x && v.y === 0); return w && w.to.map === 'frontier-pike' && w.to.x === 7 && w.to.y === 81; })
    && [7, 8].every((x) => { const w = pike.warps.find((v) => v.x === x && v.y === 82); return w && w.to.map === 'frontierhub'; }));
  const cyc = { 'frontier-pyramid-a': 'frontier-pyramid-b', 'frontier-pyramid-b': 'frontier-pyramid-c', 'frontier-pyramid-c': 'frontier-pyramid-a' };
  ok('A28 pyramid floors: dark + indoor (the shipped cave-light field), exit warp cycles a->b->c->a onto the next floor\'s start, 3 static item balls each with real item ids; the entrance hall\'s inner doors warp to floor A\'s start',
    Object.entries(cyc).every(([id, nxt]) => { const m = MAPS8[id];
      return m.dark === true && m.indoor === true && m.items.length === 3 && m.items.every((it) => ITEMS[it.item])
        && m.warps.length === 1 && m.warps[0].to.map === nxt && m.warps[0].to.x === MAPS8[nxt].start.x && m.warps[0].to.y === MAPS8[nxt].start.y; })
    && MAPS8['frontier-pyramid'].warps.filter((w) => w.to.map === 'frontier-pyramid-a')
      .every((w) => w.to.x === MAPS8['frontier-pyramid-a'].start.x && w.to.y === MAPS8['frontier-pyramid-a'].start.y));
  ok('A29 music mirrors shipped interiors: hub trial-town-theme (W12-T3 charter); the seven facility interiors gym-theme; the dark floors trial-route-theme (existing theme ids only)',
    hub.music === 'trial-town-theme'
    && ['frontier-tower', 'frontier-factory', 'frontier-arena', 'frontier-dome', 'frontier-pike', 'frontier-palace', 'frontier-pyramid'].every((id) => MAPS8[id].music === 'gym-theme')
    && ['frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'].every((id) => MAPS8[id].music === 'trial-route-theme'));
}

// ================= Part A3: F2 pure units (defs, run-state persistence, judge) =================
// Fixture seeding note (arc-foundation B09 isolation precedent): the
// bundle drives in Part D seed records/counters directly to reach
// milestone battles; every such seed is named in its check.
const FD = await import(join(ROOT, 'src/data/frontier.mjs'));
// NOTE: src/game/frontier.mjs is NOT imported here — the game layer
// only exists as the concatenated bundle (battle.mjs's module graph
// does not resolve standalone), so the controller's pure helpers
// (judgeArena, genTrainer, teamPower) are unit-checked inside the
// Part D bundle driver, where they live.
const { makeMon: mkMonPure } = await import(join(ROOT, 'src/game/state.mjs'));
const SP_ALL = Object.assign({},
  (await import(join(ROOT, 'src/data/species.mjs'))).SPECIES,
  (await import(join(ROOT, 'src/data/species2.mjs'))).SPECIES2,
  (await import(join(ROOT, 'src/data/species3.mjs'))).SPECIES_JOHTO,
  (await import(join(ROOT, 'src/data/species4.mjs'))).SPECIES_HOENN);
const MV_ALL = Object.assign({},
  (await import(join(ROOT, 'src/data/moves.mjs'))).MOVES,
  (await import(join(ROOT, 'src/data/moves2.mjs'))).MOVES2);
{
  const BRAIN_NAMES = { tower: 'Esme', factory: 'Faber', arena: 'Veda', dome: 'Dorian', pike: 'Selene', palace: 'Ambrose', pyramid: 'Titus' };
  ok('A30 F2 facility defs <-> BADGE_SETS.symbols 1:1: FACILITY_IDS is the slot order, every def carries its Brain (Esme/Faber/Veda/Dorian/Selene/Ambrose/Titus), a symbol item, and authored silver+gold Brain teams of 3 roster species',
    JSON.stringify(FD.FACILITY_IDS) === JSON.stringify(BADGE_SETS.symbols)
    && FD.FACILITY_IDS.every((id) => FD.FACILITIES[id] && FD.FACILITIES[id].brain === BRAIN_NAMES[id] && ITEMS[FD.SYMBOL_ITEMS[id]])
    && FD.FACILITY_IDS.every((id) => ['silver', 'gold'].every((tier) => FD.BRAIN_TEAMS[id][tier].length === 3
      && FD.BRAIN_TEAMS[id][tier].every((e) => SP_ALL[e.species] && (!e.keepsake || ITEMS[e.keepsake])))));
  ok('A31 generated pools are roster-only and legendary-free: every pool non-empty, every species in the merged 395 roster, no form entries, no LEGENDARY_IDS member',
    FD.FACILITY_IDS.every((id) => FD.FACILITIES[id].pools.length >= 8
      && FD.FACILITIES[id].pools.every((sp) => SP_ALL[sp] && !SP_ALL[sp].form && !FD.LEGENDARY_IDS.includes(sp))));
  ok('A32 defaultState carries the F2 run state: frontier.records for all 7 facilities (closed field lists, zeroed), run null, pyramidBag []',
    (() => { const f = defaultState().frontier; return f && f.run === null && Array.isArray(f.pyramidBag) && f.pyramidBag.length === 0
      && FD.FACILITY_IDS.every((id) => f.records[id] && JSON.stringify(Object.keys(f.records[id]).sort()) === JSON.stringify([...FD.RECORD_FIELDS[id]].sort())
        && Object.values(f.records[id]).every((v) => v === 0)); })());
  const midRun = () => {
    const s = clone(defaultState());
    const rental = mkMonPure('snorlax', 50, SP_ALL, MV_ALL);
    s.frontier = {
      records: Object.fromEntries(FD.FACILITY_IDS.map((id) => [id, Object.fromEntries(FD.RECORD_FIELDS[id].map((f) => [f, 0]))])),
      pyramidBag: ['potion', 'revive'],
      run: {
        facility: 'factory', foeLevel: 50, enteredTeam: [], streak: 20,
        rentals: [rental], bracket: { entrants: [{ name: 'YOU', species: ['snorlax'], power: 100 }], round: 0, alive: [0], results: [] },
        tournamentNo: 0, events: null, rooms: 0, lastChamber: 0, banked: false,
        floor: 1, runNo: 0, spots: [], spotsFloor: null, lucyFaced: false, brandonFaced: false,
      },
    };
    return s;
  };
  ok('A33 client schema accepts a mid-run save (factory run: rentals + bracket + pyramid bag ride along) and rejects a bad run facility (bad-frontier-run), an unknown record field (bad-frontier-records) and a non-medicine bag item (bad-frontier-bag)',
    SCH.validateSave(midRun()).ok
    && (() => { const s = midRun(); s.frontier.run.facility = 'nowhere'; return SCH.validateSave(s).errors.includes('bad-frontier-run'); })()
    && (() => { const s = midRun(); s.frontier.records.tower.cheats = 1; return SCH.validateSave(s).errors.includes('bad-frontier-records'); })()
    && (() => { const s = midRun(); s.frontier.pyramidBag = ['pokeball']; return SCH.validateSave(s).errors.includes('bad-frontier-bag'); })(),
    JSON.stringify(SCH.validateSave(midRun()).errors));
  ok('A34 save-fill round-trips: a pre-F2 save (no frontier key) migrates to fresh records/null run; a corrupt run drops to null while records survive; a valid mid-run save survives migrate intact (streak + rental species)',
    (() => { const s = clone(defaultState()); delete s.frontier; const m = SCH.migrate(s); return m.frontier && m.frontier.run === null && m.frontier.records.pyramid.runs === 0; })()
    && (() => { const s = midRun(); s.frontier.run.facility = 'nowhere'; s.frontier.records.tower.bestStreak = 12; const m = SCH.migrate(s); return m.frontier.run === null && m.frontier.records.tower.bestStreak === 12; })()
    && (() => { const m = SCH.migrate(midRun()); return m.frontier.run && m.frontier.run.streak === 20 && m.frontier.run.rentals[0].speciesId === 'snorlax' && m.frontier.pyramidBag.length === 2; })());
  ok('A35 server validator (tables-driven facility list from BADGE_SETS.symbols) accepts the same mid-run save and rejects the bad-facility run (bad-frontier-run) + a rental with an unknown species',
    VAL.validateSave(clone(midRun())).ok
    && (() => { const s = midRun(); s.frontier.run.facility = 'nowhere'; return VAL.validateSave(s).errors.includes('bad-frontier-run'); })()
    && (() => { const s = midRun(); s.frontier.run.rentals[0].speciesId = 'missingno'; return !VAL.validateSave(s).ok; })(),
    JSON.stringify(VAL.validateSave(clone(midRun())).errors));
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
    if (!cond) { Q.failures++; console.error('FR-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('fr-pass ' + name);
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
  function pick(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
  }
  var SYM_IDS = ['abilitysymbol', 'knowledgesymbol', 'gutssymbol', 'tacticssymbol', 'lucksymbol', 'spiritsymbol', 'bravesymbol'];
  var FAC_IDS = ['tower', 'factory', 'arena', 'dome', 'pike', 'palace', 'pyramid'];

  var g = mkGame(701); boot(g);
  var st = g.state;
  var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
  var capt = ow.map.npcs.find(function (n) { return n.name === 'CAPT FRONTIER'; });
  ok('B01 CAPT FRONTIER stands on Pallet\\'s live roster at (10,11) (ferry frontierhub, ferryArc frontier), with CAPT YAMATO on the dock head at (6,11)', // W1 resync: T1 rebuild stances, as A19
    !!capt && capt.x === 10 && capt.y === 11 && capt.ferry === 'frontierhub' && capt.ferryArc === 'frontier'
    && !!ow.map.npcs.find(function (n) { return n.name === 'CAPT YAMATO' && n.x === 6 && n.y === 11; }));

  // The gate: embark_frontier deleted (a fresh state never had it) —
  // talking yields the ferry gate line and NO warp, NO sail menu.
  // (The crossing itself is NOT tested here: frontierhub does not
  // exist until F1; the crossing proof belongs to F1.)
  delete st.story.flags.embark_frontier;
  ow.sysNpc(capt); tk(g, 3);
  // The ferry handler plays the captain's own dialogue first, then
  // the ferryArc gate fires in its callback — collect every line the
  // whole interaction shows, and watch for a sail menu throughout.
  var seenLines = []; var menuSeen = false; var guardB = 0;
  while (guardB++ < 80) {
    if (g.ui.dlg && g.ui.dlg.lines) g.ui.dlg.lines.forEach(function (l) { if (!seenLines.includes(l)) seenLines.push(l); });
    if (g.ui.menuOpen) { menuSeen = true; break; }
    if (!g.ui.dialogueOpen) break;
    pA(g);
  }
  drain(g);
  ok('B02 with embark_frontier deleted, CAPT FRONTIER yields the ferry gate line and NO warp (still on pallet, no sail menu offered)',
    seenLines.some(function (l) { return l.indexOf('No sailing to Trial Grounds yet') === 0; }) && menuSeen === false && !g.ui.menuOpen
    && st.story.position.map === 'pallet' && ow.mapId === 'pallet',
    'lines=' + seenLines.join(' | ').slice(0, 200) + ' pos=' + st.story.position.map);

  // The Cheat Terminal: symbols are not stock, in any section.
  ow.openCheatShop(); pick(g, 'items'); pick(g, 'badges');
  var badgeVals = g.ui.menu.items.map(function (i) { return i.value; });
  var badgeLabels = g.ui.menu.items.map(function (i) { return i.label; }).join(' | ');
  ok('B03 Cheat Terminal badge stock carries NO symbol (36 real badge rows + Back — 28 + the 8 Sinnoh badges, Arc 4 Stage S0 supersedes the row count; no symbol item id, no facility id, no Symbol label)',
    badgeVals.length === 37 && SYM_IDS.every(function (id) { return !badgeVals.includes(id); })
    && FAC_IDS.every(function (id) { return !badgeVals.includes(id); }) && badgeLabels.indexOf('Symbol') < 0,
    'rows=' + badgeVals.length);
  pick(g, null); pick(g, 'key');
  var keyVals = g.ui.menu.items.map(function (i) { return i.value; });
  ok('B04 Cheat Terminal Key Items stock carries NO symbol either (the pocket leak is closed)',
    SYM_IDS.every(function (id) { return !keyVals.includes(id); }), keyVals.join(','));
  pick(g, null); pick(g, null);
  ok('B05 the claim path refuses symbols directly: cheatClaimBadge(tower) and cheatClaimBadge(abilitysymbol) both fail, badges.symbols stays [null x7], the bag holds no symbol',
    ow.cheatClaimBadge('tower') === false && ow.cheatClaimBadge('abilitysymbol') === false
    && JSON.stringify(st.badges.symbols) === JSON.stringify([null, null, null, null, null, null, null])
    && SYM_IDS.every(function (id) { return !(id in st.bag); }));

  globalThis.__FRQ__ = Q;
})();
`;
let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__FRQ__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) ok('B ' + r.name, r.pass);
  ok('B00 driver completed with no internal failures', QB.failures === 0, QB.failures + ' failures');
}

// ================= Part C: F1 bundle — THE CROSSING + walking drives =================
const driverC = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('FR-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('fr-pass ' + name);
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
  function pick(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
  }
  function advanceToMenu(g) {
    var n = 0;
    while (!g.ui.menuOpen && n++ < 200) {
      if (g.ui.dialogueOpen) { pA(g); } else { tk(g, 2); }
    }
    return g.ui.menuOpen;
  }
  // ---- walking (no position seeding): BFS over the live map, then
  // real D-pad steps, one tile at a time ----
  function bfsDirs(ow, tx, ty) {
    var m = ow.map;
    var blocked = {};
    (m.npcs || []).forEach(function (n) { blocked[n.x + ',' + n.y] = 1; });
    var sx = ow.player.tx, sy = ow.player.ty;
    var prev = {}; prev[sx + ',' + sy] = null;
    var q = [[sx, sy]];
    while (q.length) {
      var cur = q.shift(), x = cur[0], y = cur[1];
      if (x === tx && y === ty) break;
      var DIRS = [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];
      for (var di = 0; di < 4; di++) {
        var nx = x + DIRS[di][0], ny = y + DIRS[di][1], k = nx + ',' + ny;
        if (k in prev) continue;
        if (ny < 0 || ny >= m.rows.length || nx < 0 || nx >= m.rows[ny].length) continue;
        var ch = m.rows[ny][nx];
        if (!WALKABLE.has(ch) && ch !== '~' && ch !== 'W') continue;
        if (blocked[k] && !(nx === tx && ny === ty)) continue;
        prev[k] = { from: x + ',' + y, dir: DIRS[di][2] };
        q.push([nx, ny]);
      }
    }
    if (!((tx + ',' + ty) in prev)) return null;
    var dirs = [], k = tx + ',' + ty;
    while (prev[k]) { dirs.unshift(prev[k].dir); k = prev[k].from; }
    return dirs;
  }
  function stepDir(g, dir) {
    var ow = g.scenes.top;
    var px = ow.player.tx, py = ow.player.ty, pm = g.state.story.position.map;
    g.input.inject(dir);
    var n = 0;
    while (n++ < 80) {
      g.loop.stepTicks(1);
      var now = g.scenes.top;
      if (!now || !now.player) break;
      if (now.player.tx !== px || now.player.ty !== py || g.state.story.position.map !== pm) break;
    }
    g.input.release(dir); tk(g, 1);
  }
  function walkTo(g, tx, ty) {
    var ow = g.scenes.top;
    var dirs = bfsDirs(ow, tx, ty);
    if (!dirs) return false;
    var onWarp = (ow.map.warps || []).some(function (w) { return w.x === tx && w.y === ty; });
    var startTuple = pos(g).map + ',' + pos(g).x + ',' + pos(g).y;
    for (var i = 0; i < dirs.length; i++) stepDir(g, dirs[i]);
    if (onWarp) {
      // the warp fires only once the step onto the tile settles —
      // wait for the position tuple to change (the warp landing)
      var n = 0;
      while (n++ < 100 && (pos(g).map + ',' + pos(g).x + ',' + pos(g).y) === startTuple) tk(g, 1);
    }
    tk(g, 3);
    return true;
  }
  function pos(g) { return g.state.story.position; }

  var g = mkGame(702); boot(g);
  var st = g.state;

  // ---- THE CROSSING (outbound, post-arm fixture) ----
  st.story.flags.embark_frontier = true;
  var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
  var capt = ow.map.npcs.find(function (n) { return n.name === 'CAPT FRONTIER'; });
  ow.sysNpc(capt); tk(g, 3);
  var menuOk = advanceToMenu(g);
  ok('C01 THE CROSSING (outbound): with embark_frontier armed, CAPT FRONTIER offers the sail menu',
    menuOk === true, 'menuOpen=' + g.ui.menuOpen);
  pick(g, 'yes'); drain(g); tk(g, 4);
  ok('C02 the crossing lands on frontierhub\\'s dock start (18,21) after the en-route card, with reachedarc_frontier set',
    pos(g).map === 'frontierhub' && pos(g).x === 18 && pos(g).y === 21 && st.story.flags.reachedarc_frontier === true,
    'pos=' + JSON.stringify(pos(g)) + ' reached=' + st.story.flags.reachedarc_frontier);

  // ---- walking drives: dock -> each facility door -> inside -> exit -> hub ----
  var DRIVES = [
    ['frontier-tower', 4, 3, 9, 14], ['frontier-factory', 11, 3, 9, 13],
    ['frontier-arena', 18, 3, 8, 12], ['frontier-dome', 26, 3, 11, 16],
    ['frontier-palace', 12, 12, 9, 13], ['frontier-pyramid', 18, 12, 8, 11],
    ['center', 34, 3, 4, 5], ['mart', 25, 12, 5, 6],
  ];
  DRIVES.forEach(function (d, idx) {
    var mid = d[0];
    var walked = walkTo(g, d[1], d[2]);
    ok('C1' + idx + ' walk dock/plaza -> ' + mid + ' door and step inside (live bundle, no seeding)',
      walked && pos(g).map === mid, 'walked=' + walked + ' pos=' + JSON.stringify(pos(g)));
    var back = walkTo(g, d[3], d[4]);
    ok('C2' + idx + ' ' + mid + ': exit warp walked -> back on frontierhub',
      back && pos(g).map === 'frontierhub', 'walked=' + back + ' pos=' + JSON.stringify(pos(g)));
  });

  // ---- pike: door -> hall -> the full one-way run -> dais exit -> hub ----
  walkTo(g, 4, 12);
  ok('C30 walk -> Battle Pike door, inside the entrance hall at (7,81)',
    pos(g).map === 'frontier-pike' && pos(g).x === 7 && pos(g).y === 81, 'pos=' + JSON.stringify(pos(g)));
  walkTo(g, 7, 73);
  ok('C31 hall run doors -> chamber 1 entry row (7,71)', pos(g).map === 'frontier-pike' && pos(g).x === 7 && pos(g).y === 71, 'pos=' + JSON.stringify(pos(g)));
  var tops = [64, 55, 46, 37, 28, 19, 10];
  var runOk = true, runDetail = '';
  for (var ci = 0; ci < 7; ci++) {
    if (!walkTo(g, 3, tops[ci])) { runOk = false; runDetail = 'no path in chamber ' + (ci + 1); break; }
    var want = ci === 6 ? [3, 8] : [3, tops[ci + 1] + 7]; // entry row of next chamber / dais entry row
    if (pos(g).x !== want[0] || pos(g).y !== want[1]) { runOk = false; runDetail = 'after chamber ' + (ci + 1) + ' door pos=' + JSON.stringify(pos(g)) + ' want ' + want.join(','); break; }
  }
  ok('C32 the Pike run walked end-to-end: left door of every chamber -> next chamber entry (x=3), chamber 7 -> the dais entry row (3,8)', runOk, runDetail);
  walkTo(g, 7, 0);
  ok('C33 dais exit door -> back in the entrance hall (7,81)', pos(g).map === 'frontier-pike' && pos(g).x === 7 && pos(g).y === 81, 'pos=' + JSON.stringify(pos(g)));
  walkTo(g, 7, 82);
  ok('C34 hall exit warp -> back on frontierhub', pos(g).map === 'frontierhub', 'pos=' + JSON.stringify(pos(g)));

  // ---- pyramid floor cycle, walked ----
  // F2 SUPERSESSION (recorded in the F2c register entry): F1 walked
  // these floors freely; F2's run gate bars floor entry without an
  // active climb, so the geometry drive now seeds an active run
  // fixture first (B09 precedent). The fixture is TEAMLESS —
  // frontierOnStep fields no battles for it — so the walk stays the
  // pure geometry proof it was; the guard itself is proven in D24.
  st.frontier.run = { facility: 'pyramid', foeLevel: 50, enteredTeam: [], streak: 0, rentals: null, bracket: null, tournamentNo: 0, events: null, rooms: 0, lastChamber: 0, banked: false, floor: 1, runNo: 1, spots: [], spotsFloor: null, lucyFaced: false, brandonFaced: false };
  walkTo(g, 18, 12); walkTo(g, 8, 0);
  ok('C40 Pyramid inner doors -> floor A entry (10,14)', pos(g).map === 'frontier-pyramid-a' && pos(g).x === 10 && pos(g).y === 14, 'pos=' + JSON.stringify(pos(g)));
  walkTo(g, 10, 0);
  ok('C41 floor A exit (lit doorway) -> floor B entry (3,14)', pos(g).map === 'frontier-pyramid-b' && pos(g).x === 3 && pos(g).y === 14, 'pos=' + JSON.stringify(pos(g)));
  walkTo(g, 18, 0);
  ok('C42 floor B exit -> floor C entry (18,14)', pos(g).map === 'frontier-pyramid-c' && pos(g).x === 18 && pos(g).y === 14, 'pos=' + JSON.stringify(pos(g)));
  walkTo(g, 3, 0);
  ok('C43 floor C exit -> floor A entry (10,14): the a->b->c->a cycle closes on foot', pos(g).map === 'frontier-pyramid-a' && pos(g).x === 10 && pos(g).y === 14, 'pos=' + JSON.stringify(pos(g)));

  // ---- THE CROSSING (return): embark deleted, still sails (NO-SOFT-LOCK) ----
  ow = gotoMap(g, 'frontierhub', 18, 20); drain(g);
  var captB = ow.map.npcs.find(function (n) { return n.name === 'CAPT BREAKWATER'; });
  ok('C50 CAPT BREAKWATER stands on the hub pier roster (ferry pallet, ferryArc frontier)',
    !!captB && captB.ferry === 'pallet' && captB.ferryArc === 'frontier');
  delete st.story.flags.embark_frontier;
  ow.sysNpc(captB); tk(g, 3);
  var menuOkB = advanceToMenu(g);
  ok('C51 return leg: with embark_frontier DELETED, CAPT BREAKWATER still offers the sail menu (reachedarc_frontier carries it — unconditional return)',
    menuOkB === true && !st.story.flags.embark_frontier, 'menuOpen=' + g.ui.menuOpen);
  pick(g, 'yes'); drain(g); tk(g, 4);
  ok('C52 the return crossing lands back on Pallet', pos(g).map === 'pallet', 'pos=' + JSON.stringify(pos(g)));

  globalThis.__FRC__ = Q;
})();
`;
let QC = null;
try {
  const runnerC = new Function(gameJs + driverC + '\n;return globalThis.__FRC__;');
  QC = runnerC();
} catch (e) {
  console.log('FAIL  Part C bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QC) {
  for (const r of QC.results) ok('C ' + r.name, r.pass);
  ok('C00 driver completed with no internal failures', QC.failures === 0, QC.failures + ' failures');
}

// ================= Part D: F2 bundle — facility seams + Tower/Factory true-path drives (F3: Arena 3-mon re-proofs + D18B, Brandon two-stage D32/D33, Scott D34, quest log D35) =================
// Fixture seeding (B09 precedent): milestone drives seed run.streak
// (and, for gold, the slot) directly so the milestone battle itself
// is reached by the shipped launch path; every seed is named inline.
const driverD = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('FR-FAIL ' + name + (extra ? ' \\u2014 ' + extra : '')); }
    else console.log('fr-pass ' + name);
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
  function mkM(g, id, level, moves) {
    var m = makeMon(id, level, SPECIES, MOVES);
    m.moves = moves.map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; });
    return m;
  }
  function strongParty(g, level) {
    // No Hyper Beam anywhere: its recharge turn is a free hit for the
    // foe, and three entered mons must survive seven straight battles'
    // worth of chip between heals (dbg-proven: HB kits wipe at Lv100).
    g.state.party = [
      mkM(g, 'mewtwo', level, ['psychic', 'thunderbolt', 'icebeam', 'flamethrower']),
      mkM(g, 'dragonite', level, ['earthquake', 'thunderbolt', 'icebeam', 'flamethrower']),
      mkM(g, 'snorlax', level, ['bodyslam', 'earthquake', 'surf', 'icebeam']),
      mkM(g, 'partner', level, ['thunderbolt', 'quickattack', 'slam', 'thunderwave']),
    ];
  }
  function driveBattle(g, onScene) {
    // ONE scene per call: the next battle launches synchronously in
    // onEnd, and a drain() can swallow an entire autoAlly battle —
    // so this driver returns the moment the top scene is a NEW
    // BattleScene, and every caller loops. onScene fires once, for
    // the scene this call actually drove.
    var guard = 0, firstScene = null;
    // Scene-bounded drain: the plain drain() is scene-blind — a
    // battle launched mid-drain (onEnd) chains straight into it and
    // an autoAlly battle can be swallowed whole. This variant stops
    // the moment the top scene changes.
    function drainHere() {
      var sc = g.scenes.top; var n = 0;
      while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && g.scenes.top === sc && n < 500) { pA(g); n++; }
    }
    while ((g.scenes.top instanceof BattleScene) && guard++ < 3000) {
      // Hook BEFORE any drain: a drain can swallow an entire
      // autoAlly battle, so the scene must be sampled on sight.
      var b = g.scenes.top;
      if (!firstScene) { firstScene = b; if (onScene) onScene(b); }
      else if (b !== firstScene) break;
      drainHere();
      if (!(g.scenes.top instanceof BattleScene)) break;
      if (g.scenes.top !== b) continue; // scene changed mid-drain: the firstScene test above ends this call
      b = g.scenes.top;
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (m.kind === 'commands') {
          var ci = m.items.findIndex(function (it) { return !it.disabled && it.value === 'fight'; });
          g.ui.debugChoose(ci >= 0 ? ci : 0); tk(g, 3);
        } else if (m.title === 'Choose a move') {
          var best = 0, bs = -1;
          var foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
          m.items.forEach(function (it, i) { if (it.disabled) return; var slot = b.ally.moves[i]; if (!slot) return; var md = MOVES[slot.id]; var sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
          g.ui.debugChoose(best); tk(g, 3);
        } else if (m.title === 'Choose next Kin' || m.title === 'Party') {
          var pi = m.items.findIndex(function (it) { return !it.disabled && it.value !== -1 && it.value !== null; });
          g.ui.debugChoose(pi >= 0 ? pi : 0); tk(g, 3);
        } else {
          var bi = m.items.findIndex(function (it) { return it.value === null || it.value === -1; });
          g.ui.debugChoose(bi >= 0 ? bi : m.items.length - 1); tk(g, 3);
        }
      } else { pA(g); tk(g, 3); }
    }
    // Trailing drain ONLY when no fresh battle is waiting: if this
    // call ended on a scene change, the new battle is the caller's
    // business — draining here would swallow an autoAlly battle.
    if (!(g.scenes.top instanceof BattleScene)) drain(g);
  }
  // The master pump: dialogues drain, battles drive, menus go through
  // the chooser (default: the Frontier-savvy order below).
  function frontierChoose(menu) {
    var items = menu.items; var i;
    i = items.findIndex(function (it) { return !it.disabled && it.label && it.label.indexOf('Take their') === 0; }); if (i >= 0) return i;
    i = items.findIndex(function (it) { return !it.disabled && it.label && it.label.indexOf('Give up') === 0; }); if (i >= 0) return i;
    i = items.findIndex(function (it) { return !it.disabled && it.value === 'continue'; }); if (i >= 0) return i;
    i = items.findIndex(function (it) { return !it.disabled && it.value !== null && it.value !== undefined && it.value !== -1; }); if (i >= 0) return i;
    i = items.findIndex(function (it) { return !it.disabled; }); return i >= 0 ? i : 0;
  }
  function pump(g, cap, choose) {
    var guard = 0;
    while (guard++ < (cap || 4000)) {
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { drain(g); continue; }
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.menuOpen) { var idx = (choose || frontierChoose)(g.ui.menu); if (idx === null || idx === undefined || idx < 0) return; g.ui.debugChoose(idx); tk(g, 3); continue; }
      return;
    }
  }
  function talkFrontier(g, ow, facId) {
    var npc = ow.map.npcs.find(function (n) { return n.frontier === facId; });
    if (!npc) return null;
    ow.sysNpc(npc); tk(g, 3);
    return npc;
  }
  // Entry stepper: talk -> intro -> picks/draft -> run created, ONE
  // press at a time. A full drain() here is a trap: the moment the
  // first battle launches, its msgOpen chain lets a drain swallow
  // whole autoAlly battles (Palace) before the caller ever sees them.
  function enterRun(g, choose) {
    var st = g.state; var guard = 0;
    while (guard++ < 600) {
      if (st.frontier.run) return true;
      if (g.ui.menuOpen) { g.ui.debugChoose((choose || frontierChoose)(g.ui.menu)); tk(g, 3); continue; }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { pA(g); continue; }
      tk(g, 3);
    }
    return !!st.frontier.run;
  }
  var FAC_IDS = ['tower', 'factory', 'arena', 'dome', 'pike', 'palace', 'pyramid'];
  function slotOf(g, facId) { return g.state.badges.symbols[FAC_IDS.indexOf(facId)]; }

  // ---------- D00x: the controller's pure helpers (bundle scope) ----------
  {
    var a1 = { movesUsed: ['x', 'y'], landed: 3, hpFrac: 0.5 }; var f1 = { movesUsed: ['x'], landed: 2, hpFrac: 1 };
    var v1 = judgeArena(a1, f1);
    var a2 = { movesUsed: ['a', 'b', 'c', 'd', 'e', 'f'], landed: 9, hpFrac: 0 }; var f2 = { movesUsed: [], landed: 0, hpFrac: 0 };
    var v2 = judgeArena(a2, f2);
    var a3 = { movesUsed: ['x'], landed: 1, hpFrac: 0.5 }; var f3 = { movesUsed: ['y'], landed: 1, hpFrac: 0.5 };
    var v3 = judgeArena(a3, f3);
    ok('D0A judge formula (data-authored): Mind = distinct moves (cap 4), Skill = landed (cap 6), Body = round(3 x HP fraction); higher total wins, TIE is a challenger loss',
      v1 === 'win' && a1.total === 7 && f1.total === 6 && v2 === 'win' && a2.total === 10 && v3 === 'loss');
    var fakeG = { rng: makeRngStreams(42) };
    var t1 = genTrainer(fakeG, 'tower', 3, 57); var t2 = genTrainer(fakeG, 'tower', 3, 57);
    ok('D0B generation: genTrainer fields a full team AT foeLevel (the entered top — Open Level), reward 0, NO badge field, unique ids across calls',
      t1.team.length === 3 && t1.team.every(function (e) { return e.level === 57; }) && t1.reward === 0 && !('badge' in t1) && t1.id !== t2.id);
    ok('D0C Dome sim power: teamPower sums real level-scaled stat totals (Snorlax out-powers Rattata at equal level; level scales power up)',
      teamPower(['snorlax'], 50) > teamPower(['rattata'], 50) && teamPower(['snorlax'], 60) > teamPower(['snorlax'], 50));
  }

  // ---------- D01-D04: the BattleScene facility seams, driven directly ----------
  {
    var g = mkGame(7201); boot(g); strongParty(g, 50);
    var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
    var st = g.state; st.player.money = 4321;
    var team = [st.party[0], st.party[1], st.party[2]];
    var xp0 = team.map(function (m) { return m.xp; });
    var flags0 = Object.keys(st.story.flags).length;
    var tr = { id: 'frontier-seam-1', name: 'SEAM', title: 'Tester', reward: 900, team: [{ species: 'rattata', level: 5 }], intro: [' seam.'], lose: ['Seam beaten.'] };
    var b = new BattleScene({ kind: 'trainer', trainer: tr, returnTo: ow, rt: false, facility: { id: 'tower', partyOverride: team } });
    g.scenes.push(b); b.enter(); drain(g);
    // Bag refusal: choose BAG at the command menu. (Battle lines are
    // read from ui.log — BattleScene.say logs every battle message.)
    var bagMenuOpened = false, guard = 0;
    while (guard++ < 60) {
      if (g.ui.menuOpen && g.ui.menu.kind === 'commands') {
        var bi = g.ui.menu.items.findIndex(function (it) { return it.value === 'bag'; });
        g.ui.debugChoose(bi); tk(g, 3); break;
      }
      if (g.ui.menuOpen && g.ui.menu.title === 'Bag') bagMenuOpened = true;
      pA(g); tk(g, 2);
    }
    drain(g);
    var bagLine = g.ui.log.some(function (e) { return e.text && e.text.indexOf('bag stays closed') >= 0; });
    ok('D01 facility bag law: BAG at the command phase is refused with the Frontier line (no bag menu ever opens)',
      bagLine && !bagMenuOpened);
    driveBattle(g);
    ok('D02 facility payout law: a facility trainer win pays NO prize (reward 900 suppressed), writes NO beat_ flag, and awards NO XP',
      st.player.money === 4321 && Object.keys(st.story.flags).length === flags0 && !st.story.flags['beat_frontier-seam-1']
      && JSON.stringify(team.map(function (m) { return m.xp; })) === JSON.stringify(xp0));
    // Defeat takes the friendly branch: no halving, no Center warp.
    var b2 = new BattleScene({ kind: 'trainer', trainer: { id: 'frontier-seam-2', name: 'SEAM', title: 'Tester', reward: 0, team: [{ species: 'mewtwo', level: 100 }], intro: [' seam.'], lose: ['x'] }, returnTo: ow, rt: false, facility: { id: 'tower', partyOverride: [mkM(g, 'rattata', 5, ['tackle'])] } });
    g.scenes.push(b2); b2.enter(); drain(g);
    driveBattle(g);
    ok('D03 facility defeat is the friendly branch: money untouched, no Center warp (still on the overworld at pallet)',
      st.player.money === 4321 && g.scenes.top === ow && st.story.position.map === 'pallet');
    // Balls at a facility wild: beginCatch refuses, ball unspent.
    st.bag.pokeball = 3;
    var bw = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 5, SPECIES, MOVES), returnTo: ow, rt: false, facility: { id: 'pike', partyOverride: team }, uncatchable: true });
    g.scenes.push(bw); bw.enter(); drain(g);
    bw.beginCatch('pokeball'); tk(g, 3);
    drain(g);
    var ballLine = g.ui.log.some(function (e) { return e.text && e.text.indexOf('Frontier grounds') >= 0; });
    ok('D04 facility wild ball law: throwing at a Pike/Pyramid wild is refused with the Frontier line and the ball is NOT spent',
      ballLine && st.bag.pokeball === 3);
    g.scenes.pop(); drain(g);
  }

  // ---------- D05-D07: the Arena judge at the seam level ----------
  {
    var g = mkGame(7202); boot(g); strongParty(g, 50);
    var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
    var st = g.state;
    function stallBattle(judgeImpl, allyMoves, foeMoves) {
      var ally = mkM(g, 'snorlax', 50, allyMoves); var foe = mkM(g, 'snorlax', 50, foeMoves);
      var tr = { id: 'frontier-judge-x', name: 'JUDGEBOX', title: 'Tester', reward: 0, team: [{ species: 'snorlax', level: 50 }], intro: [' j.'], lose: ['Judged.'] };
      var bb = new BattleScene({ kind: 'trainer', trainer: tr, returnTo: ow, rt: false, facility: { id: 'arena', partyOverride: [ally], maxTurns: 3, judge: judgeImpl } });
      g.scenes.push(bb); bb.enter();
      bb.foe.moves = foe.moves; // fixture: the foe stalls with the given kit
      return bb;
    }
    // Judged WIN: three stall turns pass, the judge fires once, the
    // battle ends through the win path.
    var calls = [];
    var bw = stallBattle(function (a, f) { calls.push({ a: a, f: f }); return 'win'; }, ['splash'], ['splash']);
    driveBattle(g);
    ok('D05 judge fires exactly once when the cap passes unresolved (3 stall turns): fed live counters (ally attempted >= 3) + HP fractions, win verdict ends via winTrainer',
      calls.length === 1 && calls[0].a.attempted >= 3 && calls[0].a.hpFrac === 1 && !(g.scenes.top instanceof BattleScene));
    // Judged LOSS: same stall, loss verdict, friendly defeat branch.
    st.player.money = 777;
    var bl = stallBattle(function () { return 'loss'; }, ['splash'], ['splash']);
    driveBattle(g);
    ok('D06 judged loss ends via the friendly defeat branch (battle over, money intact, no warp)',
      !(g.scenes.top instanceof BattleScene) && st.player.money === 777 && st.story.position.map === 'pallet');
    // KO before the cap: the judge never fires.
    var calls3 = 0;
    var bk = stallBattle(function () { calls3++; return 'loss'; }, ['hyperbeam'], ['splash']);
    bk.foe.hp = 10; bk.foe.maxHp = 200;
    driveBattle(g);
    ok('D07 a KO before the cap never reaches the judge (spy uncalled, battle over by knockout)',
      calls3 === 0 && !(g.scenes.top instanceof BattleScene));
  }

  // ---------- D08-D10: Tower — honest set, Anabel silver, Anabel gold ----------
  {
    var g = mkGame(7210); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-tower', 10, 5); drain(g);
    var st = g.state; st.player.money = 5000;
    var xp0 = st.party.map(function (m) { return m.xp; });
    talkFrontier(g, ow, 'tower');
    pump(g, 6000, function (menu) {
      if (menu.title && menu.title.indexOf('Streak 7') === 0) { var ri = menu.items.findIndex(function (it) { return it.value === 'rest'; }); return ri; }
      return frontierChoose(menu);
    });
    var run = st.frontier.run;
    ok('D08 Tower honest set: one full set of 7 from zero through the receptionist (party pick of 3, foeLevel = entered top 100), records written, NO prize money, NO XP, run rests open',
      !!run && run.facility === 'tower' && run.streak === 7 && run.foeLevel === 100 && run.enteredTeam.length === 3
      && st.frontier.records.tower.bestStreak === 7 && st.frontier.records.tower.totalWins === 7
      && st.player.money === 5000 && JSON.stringify(st.party.map(function (m) { return m.xp; })) === JSON.stringify(xp0)
      && slotOf(g, 'tower') === null);
    // Retire through the desk (Resume/Retire menu).
    talkFrontier(g, ow, 'tower'); pump(g, 300, function (menu) { var ri = menu.items.findIndex(function (it) { return it.value === 'retire'; }); return ri >= 0 ? ri : frontierChoose(menu); });
    ok('D09 Tower retire: the desk closes the rested run (records kept)', st.frontier.run === null && st.frontier.records.tower.bestStreak === 7);
  }
  // The milestone drive: enter, seed the streak as battle 1 opens
  // (B09 precedent — the milestone battle itself is then launched by
  // the shipped path), drive until the milestone win lands.
  function milestoneDrive(seed, facMap, facId, seedStreak, seedSlot, wantStreak, wantSlot) {
    var g = mkGame(seed); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, facMap, 10, 5); drain(g);
    var st = g.state;
    if (seedSlot) st.badges.symbols[FAC_IDS.indexOf(facId)] = seedSlot;
    talkFrontier(g, ow, facId);
    // Factory milestone drives draft by base-stat total and buff the
    // rentals' moves afterwards: drafted rentals fight at parity and
    // can honestly lose, and the milestone assertions are about the
    // Brain battle + award, not rental luck (the honest draft itself
    // is proven in D12). All other facilities use the plain chooser.
    var entryChoose = function (menu) {
      if (facId === 'factory' && menu.title && menu.title.indexOf('Draft rental') === 0) {
        var bi = 0, bst = -1;
        menu.items.forEach(function (it, i) { if (it.disabled) return; var nm = it.label.split(' Lv')[0]; var sp = Object.values(SPECIES).find(function (s) { return s.name === nm; }); if (!sp) return; var t = sp.base.hp + sp.base.atk + sp.base.def + sp.base.spa + sp.base.spd + sp.base.spe; if (t > bst) { bst = t; bi = i; } });
        return bi;
      }
      return frontierChoose(menu);
    };
    enterRun(g, entryChoose);
    if (!st.frontier.run) return { g: g, st: st, brainName: null };
    if (facId === 'factory' && st.frontier.run.rentals) {
      var kits = [['psychic', 'thunderbolt', 'icebeam', 'flamethrower'], ['earthquake', 'thunderbolt', 'icebeam', 'flamethrower'], ['bodyslam', 'earthquake', 'surf', 'icebeam']];
      st.frontier.run.rentals.forEach(function (m, i) { m.moves = kits[i % 3].map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; }); });
    }
    st.frontier.run.streak = seedStreak;
    var brainName = null;
    var guard = 0;
    while (guard++ < 400) {
      if (slotOf(g, facId) === wantSlot && !(g.scenes.top instanceof BattleScene)) break; // the award lands in onEnd, before any boundary menu
      if (st.frontier.run && st.frontier.run.streak >= wantStreak && !(g.scenes.top instanceof BattleScene) && !g.ui.menuOpen) break;
      // Battle BEFORE dialogue: a freshly launched battle's intro is
      // msgOpen, and draining here would swallow a whole autoAlly
      // battle (Palace) before the sampler could see its trainer.
      if (g.scenes.top instanceof BattleScene) {
        driveBattle(g, function (b) { if (st.frontier.run && st.frontier.run.streak === wantStreak - 1) brainName = b.trainer.name; });
        continue;
      }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { drain(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      break;
    }
    drain(g);
    return { g: g, st: st, brainName: brainName };
  }
  {
    var r = milestoneDrive(7211, 'frontier-tower', 'tower', 33, null, 35, 'silver');
    ok('D10 Esme at 35 (streak seeded 33, battles 34-35 driven): battle 35 is Esme, the win strikes slot SILVER, the OTHER slots stay null, and the streak CONTINUES (run open at 35)',
      r.brainName === 'Esme' && slotOf(r.g, 'tower') === 'silver' && !!r.st.frontier.run && r.st.frontier.run.streak === 35
      && FAC_IDS.every(function (id) { return id === 'tower' || slotOf(r.g, id) === null; }),
      'brain=' + r.brainName + ' slot=' + slotOf(r.g, 'tower'));
  }
  {
    var r = milestoneDrive(7212, 'frontier-tower', 'tower', 68, 'silver', 70, 'gold');
    ok('D11 Esme at 70 (slot seeded silver, streak seeded 68): the Gold team rematch strikes slot GOLD and the streak continues at 70',
      r.brainName === 'Esme' && slotOf(r.g, 'tower') === 'gold' && !!r.st.frontier.run && r.st.frontier.run.streak === 70,
      'brain=' + r.brainName + ' slot=' + slotOf(r.g, 'tower'));
  }

  // ---------- D12-D14: Factory — draft, swap, party byte-identity, Noland ----------
  {
    var g = mkGame(7213); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-factory', 9, 5); drain(g);
    var st = g.state;
    var partyJson0 = JSON.stringify(st.party);
    talkFrontier(g, ow, 'factory');
    enterRun(g);
    var run = st.frontier.run;
    ok('D12 Factory draft: 3 rentals drafted into RUN STATE ONLY (run.rentals, level = party top 100), enteredTeam empty, state.party untouched so far',
      !!run && run.facility === 'factory' && run.rentals.length === 3 && run.rentals.every(function (m) { return m.level === 100; })
      && run.enteredTeam.length === 0 && JSON.stringify(st.party) === partyJson0);
    // Drive battle 1 and take the swap offer (chooser takes theirs).
    var rentalsBefore = run.rentals.map(function (m) { return m.speciesId; });
    pump(g, 400, function (menu) {
      if (menu.title === 'Swap a rental?' || menu.title === 'Exchange which rental?') return frontierChoose(menu);
      return null; // stop at anything else (next battle launch leaves a battle on top; pump returns on battle anyway)
    });
    // pump returns when a battle is on top OR a non-swap menu appears; drive until the swap has landed or battle 2 starts:
    var guard2 = 0;
    while (guard2++ < 60) {
      var changed = run.rentals.map(function (m) { return m.speciesId; }).join() !== rentalsBefore.join();
      if (changed) break;
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      break;
    }
    ok('D13 Factory swap: after the first win the swap offer replaced one rental with a species from the beaten team (run state only)',
      run.rentals.map(function (m) { return m.speciesId; }).join() !== rentalsBefore.join()
      && JSON.stringify(st.party) === partyJson0,
      'before=' + rentalsBefore + ' after=' + run.rentals.map(function (m) { return m.speciesId; }));
    // Retire the run at the next set boundary is far away; retire by
    // losing on purpose is slow — instead close via the desk after
    // resting is unavailable mid-set, so assert identity NOW and let
    // the run die with the game instance (fresh mkGame per block).
    ok('D14 Factory party law: state.party is BYTE-IDENTICAL after draft + battle + swap (rentals never touched it)',
      JSON.stringify(st.party) === partyJson0);
  }
  {
    // Seed 7216 chosen deliberately: drafted rentals fight generated
    // teams at exact parity, so the two driven battles are honestly
    // losable on some seeds (~1 in 4 sampled); the suite's seeds are
    // fixed constants, so a winning seed is deterministic forever.
    var r = milestoneDrive(7216, 'frontier-factory', 'factory', 19, null, 21, 'silver');
    ok('D15 Faber at 21 (streak seeded 19, battles 20-21 driven): battle 21 is Faber, slot strikes SILVER, streak continues at 21',
      r.brainName === 'Faber' && slotOf(r.g, 'factory') === 'silver' && !!r.st.frontier.run && r.st.frontier.run.streak === 21,
      'brain=' + r.brainName + ' slot=' + slotOf(r.g, 'factory'));
  }

  // ---------- D16-D18: Arena — judged set, constructed judged loss, Greta ----------
  {
    var g = mkGame(7220); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-arena', 10, 5); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'arena');
    enterRun(g);
    // Battle 1, the STALL: fixture both kits — the ally alternates
    // Tail Whip / Splash (2 distinct status moves), the foe only
    // Splashes. Nobody can be KO'd; the turn-4 command gate must
    // reach the judge, and the card must favour the challenger
    // (Mind 2 vs 1, Skill 3-3, Body 3-3 -> 8 to 7).
    var stallScene = null, realMoves = null;
    var guard1 = 0, movePick = 0;
    while (guard1++ < 2000) {
      if (g.scenes.top instanceof BattleScene && stallScene && g.scenes.top !== stallScene) break; // battle 1 done — the set continues in the pump below
      if (g.scenes.top instanceof BattleScene) {
        var b = g.scenes.top;
        if (b !== stallScene) {
          stallScene = b;
          // Fixture BOTH kits for the stall — and snapshot the lead's
          // real kit: the fixture writes the mon object itself, so
          // without a restore the set's later battles fight unarmed.
          realMoves = b.ally.moves;
          b.ally.moves = ['tailwhip', 'splash'].map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; });
          b.foe.moves = [{ id: 'splash', pp: 99, maxPp: 99 }];
        }
        drain(g);
        if (!(g.scenes.top instanceof BattleScene)) break;
        if (g.ui.menuOpen) {
          var m = g.ui.menu;
          if (m.kind === 'commands') { var ci = m.items.findIndex(function (it) { return !it.disabled && it.value === 'fight'; }); g.ui.debugChoose(ci >= 0 ? ci : 0); tk(g, 3); }
          else if (m.title === 'Choose a move') { g.ui.debugChoose(movePick++ % 2); tk(g, 3); }
          else { var bi = m.items.findIndex(function (it) { return it.value === null || it.value === -1; }); g.ui.debugChoose(bi >= 0 ? bi : m.items.length - 1); tk(g, 3); }
        } else { pA(g); tk(g, 3); }
        continue;
      }
      break;
    }
    if (stallScene && realMoves) stallScene.ally.moves = realMoves; // restore the lead's real kit for battles 2-7
    drain(g);
    var judged = g.ui.log.some(function (e) { return e.text && e.text.indexOf('Arena judge steps in') >= 0; });
    ok('D16 Arena stall battle reaches the judge at the turn cap and the judged WIN lands (2 distinct status moves beat 1 on Mind): streak 1, run open, and the generated foe fields THREE mons (F3 shape)',
      judged && !!st.frontier.run && st.frontier.run.streak === 1 && !!stallScene && stallScene.trainer.team.length === 3,
      'judged=' + judged + ' streak=' + (st.frontier.run && st.frontier.run.streak));
    // Battles 2-7 honestly, then rest at the boundary.
    pump(g, 6000, function (menu) {
      if (menu.title && menu.title.indexOf('Streak 7') === 0) { var ri = menu.items.findIndex(function (it) { return it.value === 'rest'; }); return ri; }
      return frontierChoose(menu);
    });
    ok('D17 Arena honest set completes (7 straight, records written, slot still null — Veda waits at 14)',
      !!st.frontier.run && st.frontier.run.streak === 7 && st.frontier.records.arena.bestStreak === 7 && slotOf(g, 'arena') === null);
  }
  {
    // Constructed judged LOSS (rebuilt for the F3 3-mon shape): EVERY
    // entered ally mon only Splashes (a lead faint cannot hand the
    // bout to a real kit) while the foe's lead lands Body Slams —
    // Mind 1-1, Body reads the whole teams, and the decision goes
    // against the challenger; the run closes.
    var g = mkGame(7221); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-arena', 10, 5); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'arena');
    enterRun(g);
    var lossScene = null;
    var guard2 = 0;
    while (guard2++ < 2000) {
      if (g.scenes.top instanceof BattleScene) {
        var b2 = g.scenes.top;
        if (b2 !== lossScene) {
          lossScene = b2;
          b2.facility.partyOverride.forEach(function (m) { m.moves = [{ id: 'splash', pp: 99, maxPp: 99 }]; });
          b2.foe.moves = [{ id: 'bodyslam', pp: 99, maxPp: 99 }];
        }
        driveBattle(g);
        continue;
      }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      break;
    }
    drain(g);
    var judgedLoss = g.ui.log.some(function (e) { return e.text && e.text.indexOf('decision goes to') >= 0; });
    ok('D18 constructed judged LOSS (3-mon foes): the judge decides against the stalling challenger, the run closes at streak 0, no symbol, no wins recorded',
      judgedLoss && st.frontier.run === null && slotOf(g, 'arena') === null && st.frontier.records.arena.totalWins === 0
      && !!lossScene && lossScene.trainer.team.length === 3,
      'judged=' + judgedLoss + ' run=' + JSON.stringify(st.frontier.run));
  }
  {
    // F3 Body-category flip case (seam drive, D05 idiom): the foe's
    // ACTIVE mon is worn to 30% while its two bench mons stand full.
    // Emerald's whole-team reading gives the foe Body = round(3 x
    // (0.3+1+1)/3) = 2; the superseded 1-mon shape would have read
    // the same battle as round(3 x 0.3) = 1 — the point FLIPS, which
    // is exactly the skew the fix removes. Both sides Splash-stall
    // to the cap so nothing else moves the fractions.
    var g = mkGame(7227); boot(g); strongParty(g, 50);
    var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
    var st = g.state;
    var team = [st.party[0], st.party[1], st.party[2]];
    team.forEach(function (m) { m.moves = [{ id: 'splash', pp: 99, maxPp: 99 }]; });
    var cap = null;
    var tr = { id: 'frontier-judge-body', name: 'BODYBOX', title: 'Tester', reward: 0,
      team: [{ species: 'rattata', level: 50 }, { species: 'pidgey', level: 50 }, { species: 'caterpie', level: 50 }], intro: [' b.'], lose: ['Judged.'] };
    var bb = new BattleScene({ kind: 'trainer', trainer: tr, returnTo: ow, rt: false,
      facility: { id: 'arena', partyOverride: team, maxTurns: 3, judge: function (a, f) { var v = judgeArena(a, f); cap = { a: a, f: f, v: v }; return v; } } });
    g.scenes.push(bb); bb.enter();
    bb.foe.moves = [{ id: 'splash', pp: 99, maxPp: 99 }];
    bb.foe.hp = Math.floor(bb.foe.maxHp * 0.3); // fixture: the active foe is worn; the bench is untouched
    driveBattle(g);
    ok('D18B Body reads WHOLE-TEAM fractions (F3): a foe worn to 30% with a full bench scores Body 2 (hpFrac ~0.767) — the old 1-mon reading of the same battle scores 1; the card goes to the challenger 7-6',
      !!cap && Math.abs(cap.f.hpFrac - (0.3 + 1 + 1) / 3) < 0.02 && cap.f.parts.body === 2 && Math.round(3 * 0.3) === 1
      && cap.a.parts.body === 3 && cap.v === 'win' && !(g.scenes.top instanceof BattleScene),
      cap ? 'hpFrac=' + cap.f.hpFrac + ' foeBody=' + cap.f.parts.body + ' totals=' + cap.a.total + '-' + cap.f.total : 'judge never fired');
  }
  {
    var r = milestoneDrive(7222, 'frontier-arena', 'arena', 12, null, 14, 'silver');
    ok('D19 Veda at 14 (streak seeded 12, battles 13-14 driven): battle 14 is Veda, slot strikes SILVER, streak continues at 14',
      r.brainName === 'Veda' && slotOf(r.g, 'arena') === 'silver' && !!r.st.frontier.run && r.st.frontier.run.streak === 14,
      'brain=' + r.brainName + ' slot=' + slotOf(r.g, 'arena'));
  }

  // ---------- D20-D21: Dome — a full tournament, Tucker final ----------
  function domeDrive(seed, seedTournaments) {
    var g = mkGame(seed); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-dome', 12, 5); drain(g);
    var st = g.state;
    if (seedTournaments) st.frontier.records.dome.tournaments = seedTournaments;
    talkFrontier(g, ow, 'dome');
    var finalFoe = null, maxResults = 0, guard = 0;
    while (guard++ < 500) {
      if (st.frontier.run && st.frontier.run.bracket) {
        maxResults = Math.max(maxResults, st.frontier.run.bracket.results.length);
        if (st.frontier.run.bracket.round === 3 && g.scenes.top instanceof BattleScene) finalFoe = g.scenes.top.trainer.name;
      }
      if (!st.frontier.run && st.frontier.records.dome.tournamentWins > 0) break;
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { drain(g); continue; }
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      if (!st.frontier.run) break;
      tk(g, 3);
    }
    drain(g);
    return { g: g, st: st, finalFoe: finalFoe, maxResults: maxResults };
  }
  {
    var r = domeDrive(7223, 0);
    ok('D20 Dome honest tournament: 16 entrants, four player wins, ALL 11 non-player matches simulated into the bracket record, tournament + win recorded, run closed',
      r.st.frontier.records.dome.tournaments === 1 && r.st.frontier.records.dome.tournamentWins === 1
      && r.maxResults === 11 && r.st.frontier.run === null && r.finalFoe !== 'Dorian',
      'results=' + r.maxResults + ' finalFoe=' + r.finalFoe);
  }
  {
    var r = domeDrive(7224, 4);
    ok('D21 Dorian final (tournaments seeded 4 -> this is tournament 5): the FINAL opponent is Dorian himself, the win strikes slot SILVER',
      r.finalFoe === 'Dorian' && slotOf(r.g, 'dome') === 'silver' && r.st.frontier.records.dome.tournamentWins === 1,
      'finalFoe=' + r.finalFoe + ' slot=' + slotOf(r.g, 'dome'));
  }

  // ---------- D22-D23: Palace — zero-input battles, Spencer ----------
  {
    var g = mkGame(7225); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-palace', 10, 5); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'palace');
    enterRun(g);
    // ZERO command input from here: only dialogue presses and, when
    // the lead is fixture-fainted, the forced send-out choice (which
    // the register records as player-chosen by design).
    var commandMenuSeen = false, faintMenuSeen = false, scene0 = null, guard = 0;
    while (guard++ < 4000) {
      if (g.ui.menuOpen && g.ui.menu.kind === 'commands') commandMenuSeen = true;
      if (g.scenes.top instanceof BattleScene && scene0 && g.scenes.top !== scene0) break; // battle 1 done
      if (g.scenes.top instanceof BattleScene) {
        var b = g.scenes.top;
        if (!scene0) { scene0 = b; b.ally.hp = 1; } // fixture (battle 1 only): the lead faints to the first real hit
        if (g.ui.menuOpen) {
          var m = g.ui.menu;
          if (m.title === 'Choose next Kin') {
            faintMenuSeen = true;
            var pi = m.items.findIndex(function (it) { return !it.disabled && it.value !== -1 && it.value !== null; });
            g.ui.debugChoose(pi >= 0 ? pi : 0); tk(g, 3);
          } else if (m.kind === 'commands' || m.title === 'Choose a move') {
            commandMenuSeen = true; tk(g, 3); // never choose: if autoAlly failed, the battle stalls and the guard fails the check
          } else { tk(g, 3); }
        } else { pA(g); tk(g, 3); }
        continue;
      }
      break;
    }
    // NO trailing drain here: it would drive the rest of the set
    // (autoAlly battles chain through msgOpen) and inflate the streak.
    ok('D22 Palace autoAlly: a full battle completes with ZERO command input (no command/move menu ever opens), and the fixture faint still prompts the PLAYER send-out choice',
      !commandMenuSeen && faintMenuSeen && !!st.frontier.run && st.frontier.run.streak === 1,
      'cmdMenu=' + commandMenuSeen + ' faintMenu=' + faintMenuSeen + ' streak=' + (st.frontier.run && st.frontier.run.streak));
  }
  {
    var r = milestoneDrive(7226, 'frontier-palace', 'palace', 19, null, 21, 'silver');
    ok('D23 Ambrose at 21 (streak seeded 19, battles 20-21 driven under autoAlly): battle 21 is Ambrose, slot strikes SILVER, streak continues at 21',
      r.brainName === 'Ambrose' && slotOf(r.g, 'palace') === 'silver' && !!r.st.frontier.run && r.st.frontier.run.streak === 21,
      'brain=' + r.brainName + ' slot=' + slotOf(r.g, 'palace'));
  }

  // ---------- D24-D26: Pyramid — the run gate, spots + bag, floor law, Brandon ----------
  function pyrWarp(g, ow, toMap, x, y) {
    ow.doWarp({ map: toMap, x: x, y: y }, {}); tk(g, 3);
    // The between-floors bag prompt may be open: press on.
    var guard = 0;
    while (g.ui.menuOpen && guard++ < 10) {
      var oi = g.ui.menu.items.findIndex(function (it) { return it.value === 'on'; });
      if (oi < 0) break;
      g.ui.debugChoose(oi); tk(g, 3);
    }
    drain(g);
  }
  {
    var g = mkGame(7240); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    // No run booked: the inner doors must bounce the walker to the hall.
    ow.doWarp({ map: 'frontier-pyramid-a', x: 10, y: 14 }, {}); tk(g, 3);
    var keeperLine = false;
    var guardK = 0;
    while (guardK++ < 40) {
      if (g.ui.dlg && g.ui.dlg.lines && g.ui.dlg.lines.join(' ').indexOf('no booking, no floors') >= 0) keeperLine = true;
      if (!g.ui.dialogueOpen) break;
      pA(g);
    }
    ok('D24 Pyramid run gate: entering a floor map with NO active climb bounces the player to the entrance hall (8,10) with the keeper law spoken',
      ow.mapId === 'frontier-pyramid' && ow.player.tx === 8 && ow.player.ty === 10 && keeperLine && st.frontier.run === null,
      'map=' + ow.mapId + ' pos=' + ow.player.tx + ',' + ow.player.ty + ' line=' + keeperLine);
  }
  {
    var g = mkGame(7241); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var run = st.frontier.run;
    ok('D25a Pyramid entry: the desk books climb 1 (records.runs = 1), foeLevel = entered top, bag emptied',
      !!run && run.facility === 'pyramid' && run.runNo === 1 && st.frontier.records.pyramid.runs === 1 && run.foeLevel === 100 && st.frontier.pyramidBag.length === 0);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    ok('D25b floor 1 begins on A with 3 seeded spots for the floor', run.floor === 1 && run.spotsFloor === 'frontier-pyramid-a' && run.spots.length === 3,
      'floor=' + run.floor + ' spots=' + run.spots.length);
    // Item spot -> bag grows.
    var itemSpot = run.spots.find(function (s) { return s.kind === 'item'; });
    var trainerSpot = run.spots.find(function (s) { return s.kind === 'trainer'; });
    if (itemSpot) {
      ow.player.tx = itemSpot.x; ow.player.ty = itemSpot.y;
      ow.sysOnStep(itemSpot.x, itemSpot.y); tk(g, 3); drain(g);
    }
    ok('D25c item spot fires on the step: the loot lands in the Pyramid Bag (and the spot is consumed)',
      !!itemSpot && st.frontier.pyramidBag.length === 1 && st.frontier.pyramidBag[0] === itemSpot.item && !run.spots.includes(itemSpot),
      'bag=' + JSON.stringify(st.frontier.pyramidBag));
    // Trainer spot -> battle; inside it, use the run bag (consumed).
    var bagUsedInBattle = false;
    if (trainerSpot) {
      ow.player.tx = trainerSpot.x; ow.player.ty = trainerSpot.y;
      ow.sysOnStep(trainerSpot.x, trainerSpot.y); tk(g, 3); drain(g);
      if (g.scenes.top instanceof BattleScene) {
        g.scenes.top.ally.hp = 100; // wound the battler so the medicine row is enabled
        var guardB = 0;
        while ((g.scenes.top instanceof BattleScene) && guardB++ < 300) {
          if (g.ui.menuOpen) {
            var m = g.ui.menu;
            if (m.kind === 'commands' && st.frontier.pyramidBag.length) {
              var ci = m.items.findIndex(function (it) { return !it.disabled && it.value === 'bag'; });
              g.ui.debugChoose(ci); tk(g, 3); continue;
            }
            if (m.title === 'Pyramid Bag') { g.ui.debugChoose(0); tk(g, 3); continue; }
            if (m.title && m.title.indexOf('Use ') === 0) {
              var ti = m.items.findIndex(function (it) { return !it.disabled && it.value !== -1; });
              g.ui.debugChoose(ti); tk(g, 3); bagUsedInBattle = st.frontier.pyramidBag.length === 0; continue;
            }
            break;
          }
          pA(g); tk(g, 3);
        }
        driveBattle(g);
      }
    }
    ok('D25d trainer spot fires a facility battle, and the Pyramid Bag is usable inside it (the item is consumed from the run bag)',
      !!trainerSpot && bagUsedInBattle && !(g.scenes.top instanceof BattleScene),
      'bagUsed=' + bagUsedInBattle);
    // Floor law: advance the cycle, then seed floor 7 and exit -> complete.
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    var floorAfterB = run.floor;
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    run.floor = 7; // fixture: the seventh floor is C's next landing (A)
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    ok('D25e floor counting advances over the cycle (1 -> 2 -> 3), and the floor-7 exit routes to the entrance hall: climb COMPLETE, bestFloor 7, run closed, bag surrendered',
      floorAfterB === 2 && st.frontier.run === null && st.frontier.records.pyramid.bestFloor === 7 && st.frontier.pyramidBag.length === 0 && ow.mapId === 'frontier-pyramid',
      'floorB=' + floorAfterB + ' best=' + st.frontier.records.pyramid.bestFloor);
  }
  {
    var g = mkGame(7242); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    st.frontier.records.pyramid.runs = 2; // seeded: this entry is climb 3 (Silver due)
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var run = st.frontier.run;
    // Climb the cycle to floor 7 (map A again): 1A 2B 3C 4A 5B 6C 7A.
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    var brandon = ow.map.npcs.find(function (n) { return n.frontierBrain === 'pyramid'; });
    ok('D26a Titus waits on floor 7 of climb 3 (Silver due): appended near the exit by the loadMap idiom',
      run.floor === 7 && !!brandon && brandon.name === 'TITUS', 'floor=' + run.floor + ' brandon=' + !!brandon);
    if (brandon) { ow.sysNpc(brandon); tk(g, 3); drain(g); }
    var brainName = null;
    var guardB = 0;
    while (guardB++ < 100) {
      if (g.scenes.top instanceof BattleScene) { brainName = g.scenes.top.trainer.name; driveBattle(g); continue; }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      break;
    }
    drain(g);
    ok('D26b Titus battle (the authored Regi trio): the win strikes slot SILVER, the other slots stay null, the climb closes in triumph',
      brainName === 'Titus' && slotOf(g, 'pyramid') === 'silver' && st.frontier.run === null
      && FAC_IDS.every(function (id) { return id === 'pyramid' || slotOf(g, id) === null; }),
      'brain=' + brainName + ' slot=' + slotOf(g, 'pyramid'));
  }

  // ---------- D27-D28: Pike — a full run against its own pre-roll, Lucy ----------
  var PIKE_ENTRY_Y = { 1: 71, 2: 62, 3: 53, 4: 44, 5: 35, 6: 26, 7: 17 };
  function resolveFrontierMoment(g, ow) {
    // Whatever a chamber entry fired: a battle (drive it) or lines.
    var guard = 0;
    while (guard++ < 60) {
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { drain(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      break;
    }
    drain(g);
  }
  {
    var g = mkGame(7243); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pike', 7, 76); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'pike'); enterRun(g);
    var run = st.frontier.run;
    var tableOk = !!run && Array.isArray(run.events) && run.events.length === 7 && run.events.every(function (r) { return r.length === 3; });
    var team = st.party.slice(0, 3);
    var firedOk = tableOk, firedDetail = '';
    for (var chamber = 1; chamber <= 7 && firedOk; chamber++) {
      var cat = run.events[chamber - 1][0]; // left door (x=3) every time
      // Observable preconditions per category.
      if (cat === 'heal-full' || cat === 'heal-half') team[0].hp = 10;
      if (cat === 'cure-status') { team[0].status = 'poison'; }
      if (cat === 'inflict-status') { team.forEach(function (m) { m.status = null; }); }
      var hpBefore = team[0].hp;
      ow.doWarp({ map: 'frontier-pike', x: 3, y: PIKE_ENTRY_Y[chamber] }, {}); tk(g, 3);
      var sawBattle = g.scenes.top instanceof BattleScene ? g.scenes.top.kind : null;
      resolveFrontierMoment(g, ow);
      if (cat === 'battle-trainer' && sawBattle !== 'trainer') { firedOk = false; firedDetail = 'ch' + chamber + ' wanted trainer battle, saw ' + sawBattle; }
      else if (cat === 'battle-wild' && sawBattle !== 'wild') { firedOk = false; firedDetail = 'ch' + chamber + ' wanted wild battle, saw ' + sawBattle; }
      else if (cat === 'heal-full' && !(team[0].hp === team[0].maxHp)) { firedOk = false; firedDetail = 'ch' + chamber + ' heal-full left hp ' + team[0].hp; }
      else if (cat === 'heal-half' && !(team[0].hp === Math.min(team[0].maxHp, 10 + Math.floor(team[0].maxHp / 2)))) { firedOk = false; firedDetail = 'ch' + chamber + ' heal-half hp ' + team[0].hp; }
      else if (cat === 'cure-status' && team[0].status !== null) { firedOk = false; firedDetail = 'ch' + chamber + ' cure left status ' + team[0].status; }
      else if (cat === 'inflict-status' && !team.some(function (m) { return m.status === 'poison'; })) { firedOk = false; firedDetail = 'ch' + chamber + ' inflict poisoned nobody'; }
      else if ((cat === 'quiet' || cat === 'hint') && sawBattle) { firedOk = false; firedDetail = 'ch' + chamber + ' ' + cat + ' fired a battle'; }
      if (!st.frontier.run) { firedOk = false; firedDetail = 'run closed early at ch' + chamber + ' (' + cat + ')'; }
    }
    ok('D27 Pike full run: the pre-roll table (7x3) is booked at entry, and the LEFT-door event of every chamber fires exactly its pre-rolled category (battles by kind, heals/cures/poison by effect)',
      firedOk && run.rooms === 7, firedDetail + ' rooms=' + (run && run.rooms));
    ow.doWarp({ map: 'frontier-pike', x: 3, y: 8 }, {}); tk(g, 3); drain(g);
    var banked = st.frontier.records.pike.totalRooms === 7 && st.frontier.records.pike.bestRun === 7;
    ow.doWarp({ map: 'frontier-pike', x: 7, y: 81 }, {}); tk(g, 3);
    ow.doWarp({ map: 'frontierhub', x: 18, y: 13 }, {}); tk(g, 3); drain(g);
    ok('D28 Pike banking: the dais banks the run (totalRooms 7, bestRun 7), and leaving the building closes the run',
      banked && st.frontier.run === null, 'total=' + st.frontier.records.pike.totalRooms);
  }
  {
    var g = mkGame(7244); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pike', 7, 76); drain(g);
    var st = g.state;
    st.frontier.records.pike.totalRooms = 7; // seeded banked: this run's 7 chambers reach 14 (Silver due)
    talkFrontier(g, ow, 'pike'); enterRun(g);
    for (var chamber = 1; chamber <= 7; chamber++) {
      ow.doWarp({ map: 'frontier-pike', x: 7, y: PIKE_ENTRY_Y[chamber] }, {}); tk(g, 3);
      resolveFrontierMoment(g, ow);
      if (!st.frontier.run) break;
    }
    ow.doWarp({ map: 'frontier-pike', x: 7, y: 8 }, {}); tk(g, 3); drain(g);
    var lucy = ow.map.npcs.find(function (n) { return n.frontierBrain === 'pike'; });
    ok('D29a Selene waits on the dais when the cumulative rooms reach 14 (7 banked + 7 this run): appended by the loadMap idiom',
      !!lucy && lucy.name === 'SELENE', 'lucy=' + !!lucy);
    if (lucy) { ow.sysNpc(lucy); tk(g, 3); drain(g); }
    var brainName = null; var guardB = 0;
    while (guardB++ < 100) {
      if (g.scenes.top instanceof BattleScene) { brainName = g.scenes.top.trainer.name; driveBattle(g); continue; }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      break;
    }
    drain(g);
    ok('D29b Selene battle: the win strikes slot SILVER, other slots untouched, run closed',
      brainName === 'Selene' && slotOf(g, 'pike') === 'silver' && st.frontier.run === null
      && FAC_IDS.every(function (id) { return id === 'pike' || slotOf(g, id) === null; }),
      'brain=' + brainName + ' slot=' + slotOf(g, 'pike'));
  }

  // ---------- D30-D31: the seventh gold, cross-facility honesty ----------
  {
    var g = mkGame(7245); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    FAC_IDS.forEach(function (id, i) { st.badges.symbols[i] = id === 'pyramid' ? 'silver' : 'gold'; });
    st.frontier.records.pyramid.runs = 9; // seeded: this entry is climb 10 (Gold due)
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    var brandon = ow.map.npcs.find(function (n) { return n.frontierBrain === 'pyramid'; });
    if (brandon) { ow.sysNpc(brandon); tk(g, 3); drain(g); }
    var guardB = 0;
    while (guardB++ < 100) {
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      break;
    }
    drain(g);
    ok('D30 the seventh GOLD: the Titus gold team on climb 10 turns the last slot gold — and story.flags.frontier_complete is SET by the award helper (the machine fires the card from the flag alone)',
      slotOf(g, 'pyramid') === 'gold' && st.badges.symbols.every(function (s) { return s === 'gold'; }) && st.story.flags.frontier_complete === true,
      'slot=' + slotOf(g, 'pyramid') + ' flag=' + st.story.flags.frontier_complete);
  }
  {
    var g = mkGame(7246); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pike', 7, 76); drain(g);
    var st = g.state;
    talkFrontier(g, ow, 'pike'); enterRun(g);
    var pikeRunOpen = !!st.frontier.run && st.frontier.run.facility === 'pike';
    ow = gotoMap(g, 'frontier-tower', 10, 5); drain(g);
    talkFrontier(g, ow, 'tower');
    // The desk warns, we confirm the close, the Tower entry proceeds.
    var guard = 0, warned = false;
    while (guard++ < 300) {
      if (g.ui.dlg && g.ui.dlg.lines && g.ui.dlg.lines.join(' ').indexOf('closes it where it stands') >= 0) warned = true;
      if (st.frontier.run && st.frontier.run.facility === 'tower') break;
      if (g.ui.dialogueOpen) { drain(g); continue; }
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      if (g.scenes.top instanceof BattleScene) break;
      tk(g, 3);
    }
    ok('D31 cross-facility honesty: with a Pike run open, the Tower desk WARNS that starting closes it (records kept), and on confirmation the Tower run replaces it',
      pikeRunOpen && warned && !!st.frontier.run && st.frontier.run.facility === 'tower',
      'warned=' + warned + ' run=' + (st.frontier.run && st.frontier.run.facility));
  }

  // ---------- D32-D33: Brandon two-stage (F3) — possessed loss + re-challenge, the upset ----------
  // Zero-input battle drive for an autoAlly battle (the D22 idiom):
  // dialogue presses + the forced send-out choice ONLY; returns
  // { scene, cmdMenu } for the battle this call drove.
  function driveAutoAlly(g) {
    var scene = null, cmdMenu = false, guard = 0;
    while (guard++ < 30000) {
      if (g.scenes.top instanceof BattleScene) {
        var b = g.scenes.top;
        if (!scene) scene = b;
        if (g.ui.menuOpen) {
          var m = g.ui.menu;
          if (m.kind === 'commands' || m.title === 'Choose a move') { cmdMenu = true; tk(g, 3); }
          else if (m.title === 'Choose next Kin') {
            var pi = m.items.findIndex(function (it) { return !it.disabled && it.value !== -1 && it.value !== null; });
            g.ui.debugChoose(pi >= 0 ? pi : 0); tk(g, 3);
          } else { tk(g, 3); }
        } else { pA(g); tk(g, 3); }
        continue;
      }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { pA(g); continue; }
      break;
    }
    return { scene: scene, cmdMenu: cmdMenu };
  }
  function climbToBrandon(g, ow) {
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    return ow.map.npcs.find(function (n) { return n.frontierBrain === 'pyramid'; });
  }
  {
    var g = mkGame(7247); boot(g);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    // Fixture for a guaranteed canon LOSS: the entered team is three
    // frail Abra whose ONLY move is Explosion. Under autoAlly the
    // spirit immolates them one by one against the Regis' walls
    // (an Abra's Explosion dents a Regi for ~20-40 HP) — the team
    // wipes with all three Regis standing, no foe cooperation
    // needed. (A merely-passive team does NOT lose this battle:
    // the Regis carry Explosion in their own kits and suicide
    // against anything bulky enough to survive the blast.)
    st.party = [
      mkM(g, 'abra', 100, ['explosion']),
      mkM(g, 'abra', 100, ['explosion']),
      mkM(g, 'abra', 100, ['explosion']),
      mkM(g, 'partner', 100, ['thunderbolt', 'quickattack', 'slam', 'thunderwave']),
    ];
    st.frontier.records.pyramid.runs = 2; // seeded: this entry is climb 3 (Silver due)
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var run = st.frontier.run;
    var team = st.party.slice(0, 3);
    var brandon = climbToBrandon(g, ow);
    ow.sysNpc(brandon); tk(g, 3);
    var pv = driveAutoAlly(g);
    drain(g);
    ok('D32a the POSSESSED battle launches first at due-Silver: autoAlly facility battle (zero command input — no command/move menu ever opens), Titus\\'s Regi trio at foeLevel + 10 (110), possessed trainer id',
      !!pv.scene && pv.scene.facility.autoAlly === true && pv.cmdMenu === false
      && pv.scene.trainer.id === 'frontier-brain-pyramid-possessed'
      && pv.scene.trainer.team.every(function (t) { return t.level === 110; }),
      'scene=' + (pv.scene && pv.scene.trainer.id) + ' cmdMenu=' + pv.cmdMenu);
    ok('D32b canon LOSS branch: brandon_possessed_faced set, possession_broken NOT set, NO symbol, the run stays OPEN with Titus still standing, and the team is tended back to full (the scene\\'s heal)',
      st.story.flags.brandon_possessed_faced === true && !st.story.flags.brandon_possession_broken
      && slotOf(g, 'pyramid') === null && !!st.frontier.run && st.frontier.run.facility === 'pyramid'
      && team.every(function (m) { return m.hp === m.maxHp; })
      && !!ow.map.npcs.find(function (n) { return n.frontierBrain === 'pyramid'; }));
  }
  {
    // The re-challenge after the canon loss (fresh game; the faced
    // flag is fixture-seeded exactly as D32b leaves it — the same
    // seeding idiom as records.runs): Brandon must greet the player
    // with the rematch voice and fight the PLAIN F2 battle.
    var g = mkGame(7246); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    st.story.flags.brandon_possessed_faced = true; // D32b's outcome, seeded
    st.frontier.records.pyramid.runs = 2; // seeded: this entry is climb 3 (Silver due)
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var brandon = climbToBrandon(g, ow);
    ow.sysNpc(brandon); tk(g, 3);
    var reLines = [], guardR = 0, plainScene = null;
    while (guardR++ < 400) {
      if (g.ui.dlg && g.ui.dlg.lines) g.ui.dlg.lines.forEach(function (l) { if (!reLines.includes(l)) reLines.push(l); });
      if (g.scenes.top instanceof BattleScene) { plainScene = g.scenes.top; break; }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { pA(g); continue; }
      break;
    }
    var plainAuto = plainScene && plainScene.facility.autoAlly;
    var plainLevels = plainScene && plainScene.trainer.team.map(function (t) { return t.level; }).join(',');
    if (plainScene) driveBattle(g);
    drain(g);
    ok('D32c the re-challenge is the PLAIN F2 battle, available immediately: rematch voice ("This time I battle YOU."), NOT autoAlly, Regis at foeLevel (100) — and the win awards SILVER through the shared helper, run closed',
      reLines.some(function (l) { return l.indexOf('This time I battle YOU.') >= 0; })
      && !!plainScene && !plainAuto && plainLevels === '100,100,100'
      && slotOf(g, 'pyramid') === 'silver' && st.frontier.run === null && !st.story.flags.brandon_possession_broken,
      'levels=' + plainLevels + ' slot=' + slotOf(g, 'pyramid'));
  }
  {
    // The upset, TRUE-PATH (seed 7305): the entered team is built
    // from typed counters with authored moves — Seismic Toss (fixed
    // level damage through the Regis' walls) + Earthquake / Fire
    // coverage — and the game's OWN autoAlly (uniform-random move
    // choice, the non-smart aiActionFor path) wins at +10 with zero
    // command input. No margin change, no AI change: in development
    // this construction won on 24/24 sampled seeds.
    var g = mkGame(7305); boot(g);
    var st = g.state;
    st.party = [
      mkM(g, 'machamp', 100, ['seismictoss', 'earthquake', 'submission', 'karatechop']),
      mkM(g, 'dragonite', 100, ['earthquake', 'fireblast', 'seismictoss', 'flamethrower']),
      mkM(g, 'mewtwo', 100, ['psychic', 'fireblast', 'seismictoss', 'earthquake']),
      mkM(g, 'partner', 100, ['thunderbolt', 'quickattack', 'slam', 'thunderwave']),
    ];
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    st.frontier.records.pyramid.runs = 2; // seeded: climb 3 (Silver due)
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var brandon = climbToBrandon(g, ow);
    ow.sysNpc(brandon); tk(g, 3);
    var pv = driveAutoAlly(g);
    drain(g);
    ok('D33 the UPSET win (true-path): the spirit\\'s battle is autoAlly at +10 with zero command input — and the bond breaks it: brandon_possessed_faced AND brandon_possession_broken set, SILVER awarded via the shared helper, other slots null, run closed in triumph',
      !!pv.scene && pv.scene.facility.autoAlly === true && pv.cmdMenu === false
      && st.story.flags.brandon_possessed_faced === true && st.story.flags.brandon_possession_broken === true
      && slotOf(g, 'pyramid') === 'silver' && st.frontier.run === null
      && FAC_IDS.every(function (id) { return id === 'pyramid' || slotOf(g, id) === null; }),
      'slot=' + slotOf(g, 'pyramid') + ' broken=' + st.story.flags.brandon_possession_broken);
  }

  // ---------- D34-D35: Scott states + the quest-log Frontier section (F3) ----------
  {
    var g = mkGame(7248); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontierhub', 18, 20); drain(g);
    var st = g.state;
    var scott = ow.map.npcs.find(function (n) { return n.name === 'SUTTER'; });
    function talkScott() {
      var lines = [], guard = 0;
      ow.sysNpc(scott); tk(g, 3);
      while (guard++ < 80) {
        if (g.ui.dlg && g.ui.dlg.lines) g.ui.dlg.lines.forEach(function (l) { if (!lines.includes(l)) lines.push(l); });
        if (!g.ui.dialogueOpen) break;
        pA(g);
      }
      drain(g);
      return lines.join(' | ');
    }
    var sA = talkScott();
    st.badges.symbols = ['silver', 'silver', null, null, null, null, null];
    var sB = talkScott();
    st.badges.symbols = ['silver', 'silver', 'silver', 'silver', 'silver', 'silver', 'silver'];
    var sC = talkScott();
    st.badges.symbols = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold'];
    st.story.flags.frontier_complete = true;
    var sD = talkScott();
    ok('D34 Sutter, deepened: four symbol-state talks give four state-correct voices — (a) first arrival (seven facilities, seven Brains), (b) some silver/no gold (names the count 2 of seven, pushes the Gold standard), (c) all seven silver (the Gold push, Titus named the last word), (d) frontier_complete (the salute)',
      sA.indexOf('Seven facilities, seven Frontier Brains') >= 0
      && sB.indexOf('2 of seven Symbols') >= 0 && sB.indexOf('gold, trainer, is the standard') >= 0
      && sC.indexOf('Seven Symbols.') >= 0 && sC.indexOf('Titus is the last word') >= 0
      && sD.indexOf('all of them gold') >= 0 && sD.indexOf('The Frontier salutes you') >= 0,
      'A=' + sA.slice(0, 60) + ' B=' + sB.slice(0, 60) + ' C=' + sC.slice(0, 60) + ' D=' + sD.slice(0, 60));
  }
  {
    var g = mkGame(7249); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
    var st = g.state;
    st.badges.symbols = ['gold', 'silver', null, null, null, null, null];
    st.story.flags.hook_frontier = true;
    g.openQuestLog(); tk(g, 2);
    var labels = g.ui.menu.items.map(function (i) { return i.label; });
    var joined = labels.join(' | ');
    var ci = g.ui.menu.items.findIndex(function (it) { return it.value === 'close'; });
    if (ci >= 0) { g.ui.debugChoose(ci); tk(g, 2); }
    st.badges.symbols = [null, null, null, null, null, null, null];
    delete st.story.flags.hook_frontier;
    g.openQuestLog(); tk(g, 2);
    var labels2 = g.ui.menu.items.map(function (i) { return i.label; }).join(' | ');
    ok('D35 quest log Frontier section: with the Frontier reached, the section renders one informational row per facility from badges.symbols — Tower/GOLD, Factory/SILVER, the unearned rows at — (Arena Veda, Pyramid Titus by name); with no hook, no crossing and no symbols it does not render',
      joined.indexOf('— TRIAL GROUNDS —') >= 0
      && joined.indexOf('Trial Tower — Esme — GOLD') >= 0
      && joined.indexOf('Trial Factory — Faber — SILVER') >= 0
      && joined.indexOf('Trial Arena — Veda — —') >= 0
      && joined.indexOf('Trial Pyramid — Titus — —') >= 0
      && labels2.indexOf('TRIAL GROUNDS') < 0,
      joined.slice(0, 200));
  }

  globalThis.__FRD__ = Q;
})();
`;
let QD = null;
try {
  const runnerD = new Function(gameJs + driverD + '\n;return globalThis.__FRD__;');
  QD = runnerD();
} catch (e) {
  console.log('FAIL  Part D bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QD) {
  for (const r of QD.results) ok('D ' + r.name, r.pass);
  ok('D00 driver completed with no internal failures', QD.failures === 0, QD.failures + ' failures');
}

// ================= Part E: F4 bundle — the CAPSTONE drive =================
// Seeding note (B09-style counter seeding is the established
// isolation precedent — see arc-foundation B09 and Part A3/D above):
// the earned state a full Frontier campaign would have produced
// (six gold slots, the Pyramid slot at silver, the possession faced,
// the pyramid run counter at 9 so this entry is climb 10 = Gold due,
// the crossing flags a real save carries) is seeded directly and
// named inline below; everything from the Brandon Gold battle onward
// is TRUE-PATH — the shipped award helper, the shipped arc machine,
// the shipped ferry, the shipped homecoming.
const driverE = `
;(function () {
  var Q = { results: [], failures: 0 };
  function ok(name, cond, extra) {
    Q.results.push({ name: name, pass: !!cond });
    if (!cond) { Q.failures++; console.error('FR-FAIL ' + name + (extra ? ' \\u2014 ' + extra : '')); }
    else console.log('fr-pass ' + name);
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
  function pick(g, value) {
    var i = g.ui.menu.items.findIndex(function (it) { return it.value === value; });
    if (i < 0) return false;
    g.ui.debugChoose(i); tk(g, 3);
    return true;
  }
  function mkM(g, id, level, moves) {
    var m = makeMon(id, level, SPECIES, MOVES);
    m.moves = moves.map(function (x) { return { id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp }; });
    return m;
  }
  function strongParty(g, level) {
    g.state.party = [
      mkM(g, 'mewtwo', level, ['psychic', 'thunderbolt', 'icebeam', 'flamethrower']),
      mkM(g, 'dragonite', level, ['earthquake', 'thunderbolt', 'icebeam', 'flamethrower']),
      mkM(g, 'snorlax', level, ['bodyslam', 'earthquake', 'surf', 'icebeam']),
      mkM(g, 'partner', level, ['thunderbolt', 'quickattack', 'slam', 'thunderwave']),
    ];
  }
  function driveBattle(g, onScene) {
    var guard = 0, firstScene = null;
    function drainHere() {
      var sc = g.scenes.top; var n = 0;
      while ((g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) && g.scenes.top === sc && n < 500) { pA(g); n++; }
    }
    while ((g.scenes.top instanceof BattleScene) && guard++ < 3000) {
      var b = g.scenes.top;
      if (!firstScene) { firstScene = b; if (onScene) onScene(b); }
      else if (b !== firstScene) break;
      drainHere();
      if (!(g.scenes.top instanceof BattleScene)) break;
      if (g.scenes.top !== b) continue;
      b = g.scenes.top;
      if (g.ui.menuOpen) {
        var m = g.ui.menu;
        if (m.kind === 'commands') {
          var ci = m.items.findIndex(function (it) { return !it.disabled && it.value === 'fight'; });
          g.ui.debugChoose(ci >= 0 ? ci : 0); tk(g, 3);
        } else if (m.title === 'Choose a move') {
          var best = 0, bs = -1;
          var foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
          m.items.forEach(function (it, i) { if (it.disabled) return; var slot = b.ally.moves[i]; if (!slot) return; var md = MOVES[slot.id]; var sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
          g.ui.debugChoose(best); tk(g, 3);
        } else if (m.title === 'Choose next Kin' || m.title === 'Party') {
          var pi = m.items.findIndex(function (it) { return !it.disabled && it.value !== -1 && it.value !== null; });
          g.ui.debugChoose(pi >= 0 ? pi : 0); tk(g, 3);
        } else {
          var bi = m.items.findIndex(function (it) { return it.value === null || it.value === -1; });
          g.ui.debugChoose(bi >= 0 ? bi : m.items.length - 1); tk(g, 3);
        }
      } else { pA(g); tk(g, 3); }
    }
    if (!(g.scenes.top instanceof BattleScene)) drain(g);
  }
  function frontierChoose(menu) {
    var items = menu.items; var i;
    i = items.findIndex(function (it) { return !it.disabled && it.value !== null && it.value !== undefined && it.value !== -1; }); if (i >= 0) return i;
    i = items.findIndex(function (it) { return !it.disabled; }); return i >= 0 ? i : 0;
  }
  function talkFrontier(g, ow, facId) {
    var npc = ow.map.npcs.find(function (n) { return n.frontier === facId; });
    if (!npc) return null;
    ow.sysNpc(npc); tk(g, 3);
    return npc;
  }
  function enterRun(g) {
    var st = g.state; var guard = 0;
    while (guard++ < 600) {
      if (st.frontier.run) return true;
      if (g.ui.menuOpen) { g.ui.debugChoose(frontierChoose(g.ui.menu)); tk(g, 3); continue; }
      if (g.ui.dialogueOpen || (g.scenes.top && g.scenes.top.msgOpen)) { pA(g); continue; }
      tk(g, 3);
    }
    return !!st.frontier.run;
  }
  function pyrWarp(g, ow, toMap, x, y) {
    ow.doWarp({ map: toMap, x: x, y: y }, {}); tk(g, 3);
    var guard = 0;
    while (g.ui.menuOpen && guard++ < 10) {
      var oi = g.ui.menu.items.findIndex(function (it) { return it.value === 'on'; });
      if (oi < 0) break;
      g.ui.debugChoose(oi); tk(g, 3);
    }
    drain(g);
  }
  function climbToBrandon(g, ow) {
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    pyrWarp(g, ow, 'frontier-pyramid-b', 3, 14);
    pyrWarp(g, ow, 'frontier-pyramid-c', 18, 14);
    pyrWarp(g, ow, 'frontier-pyramid-a', 10, 14);
    return ow.map.npcs.find(function (n) { return n.frontierBrain === 'pyramid'; });
  }
  var FAC_IDS = ['tower', 'factory', 'arena', 'dome', 'pike', 'palace', 'pyramid'];
  function slotOf(g, facId) { return g.state.badges.symbols[FAC_IDS.indexOf(facId)]; }
  function scottLogCount(g) {
    return g.ui.log.filter(function (e) { return e.lines && e.lines.some(function (l) { return l.indexOf('salutes its conqueror') >= 0; }); }).length;
  }

  // ---------- E01-E02: the Brandon Gold win (TRUE-PATH from the seed) ----------
  {
    var g = mkGame(7245); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'frontier-pyramid', 8, 6); drain(g);
    var st = g.state;
    // THE SEED (B09-style counter seeding, named): a Frontier-campaign
    // save at the last door — current arc frontier, the four earlier
    // regions done, six slots GOLD with the Pyramid at silver, the
    // possession already faced (so the Gold audience is the plain
    // rematch), the pyramid run counter at 9 (this entry books climb
    // 10, the Gold milestone), and the crossing flags a real save
    // carries from its Frontier homecoming + outbound sailing.
    st.story.arc = 'frontier'; st.story.region = 'kanto';
    st.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn'];
    st.badges.symbols = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'silver'];
    st.story.flags.brandon_possessed_faced = true;
    st.story.flags.embark_frontier = true;
    st.story.flags.reachedarc_frontier = true;
    st.frontier.records.pyramid.runs = 9;
    talkFrontier(g, ow, 'pyramid'); enterRun(g);
    var brandon = climbToBrandon(g, ow);
    ok('E00 capstone setup: climb 10 booked (Gold due) and Titus waits on floor 7',
      !!st.frontier.run && st.frontier.run.runNo === 10 && !!brandon,
      'runNo=' + (st.frontier.run && st.frontier.run.runNo) + ' brandon=' + !!brandon);
    if (brandon) { ow.sysNpc(brandon); tk(g, 3); drain(g); }
    var guardB = 0;
    while (guardB++ < 100) {
      if (g.scenes.top instanceof BattleScene) { driveBattle(g); continue; }
      if (g.ui.dialogueOpen) { drain(g); continue; }
      break;
    }
    drain(g);
    ok('E01 TRUE-PATH Titus GOLD win: the last slot turns gold, all seven slots gold, and story.flags.frontier_complete is SET by the shared award helper (run closed in triumph)',
      slotOf(g, 'pyramid') === 'gold' && st.badges.symbols.every(function (s) { return s === 'gold'; })
      && st.story.flags.frontier_complete === true && st.frontier.run === null,
      'slot=' + slotOf(g, 'pyramid') + ' flag=' + st.story.flags.frontier_complete);
    ok('E02 pre-card state: the flag alone has armed the machine — regionsDone does NOT yet carry frontier, no arc_card_frontier flag, no directive pinned yet',
      !st.story.regionsDone.includes('frontier') && !st.story.flags.arc_card_frontier && st.story.arc_directive == null,
      'done=' + JSON.stringify(st.story.regionsDone) + ' dir=' + st.story.arc_directive);

    // ---------- E03-E05: the next map load fires the machine ----------
    ow = gotoMap(g, 'frontierhub', 18, 20);
    var cardLines = (g.ui.dlg && g.ui.dlg.lines) ? g.ui.dlg.lines.slice() : [];
    var frontierArc = arcById('frontier');
    var sum = arcCompleteSummary(st, frontierArc);
    ok('E03 next map load fires checkArcCompletion: the ARC COMPLETE card plays — its title names the Battle Frontier, badgeLine reads Badges: 7/7, the registry frontier summaryLines are present verbatim, and the summary forwardLine names Borea and Vale',
      cardLines.length > 0 && cardLines[0] === sum.title && sum.title.indexOf('TRIAL GROUNDS') >= 0
      && sum.badgeLine === 'Badges: 7/7' && cardLines.includes('Badges: 7/7')
      && frontierArc.summaryLines.every(function (l) { return cardLines.includes(l); })
      && sum.forwardLine.indexOf('Borea') >= 0 && sum.forwardLine.indexOf('Vale') >= 0,
      'card=' + cardLines.join(' | ').slice(0, 200));
    drain(g);
    ok('E04 the machine recorded the card: regionsDone gains frontier EXACTLY once, arc_card_frontier set, the directive is pinned on sinnoh — and Sutter has NOT fired on the hub (his beat is Pallet-only)',
      st.story.regionsDone.filter(function (x) { return x === 'frontier'; }).length === 1
      && st.story.flags.arc_card_frontier === true && st.story.arc_directive === 'sinnoh'
      && !st.story.flags.scott_closing_done,
      'done=' + JSON.stringify(st.story.regionsDone) + ' dir=' + st.story.arc_directive);
    ow = gotoMap(g, 'frontierhub', 18, 20); tk(g, 4);
    ok('E05 the ARC COMPLETE card does NOT fire twice on later loads (quiet load, frontier still exactly once in regionsDone, directive unchanged)',
      !g.ui.dialogueOpen && st.story.regionsDone.filter(function (x) { return x === 'frontier'; }).length === 1
      && st.story.arc_directive === 'sinnoh');

    // ---------- E06-E08: the ferry home (embark deleted) + Scott ----------
    var captB = ow.map.npcs.find(function (n) { return n.name === 'CAPT BREAKWATER'; });
    delete st.story.flags.embark_frontier; // the unconditional return: deleted outright, reachedarc carries the leg
    ow.sysNpc(captB); tk(g, 3);
    var seen = [], menuSeen = false, guardF = 0;
    while (guardF++ < 400) {
      if (g.ui.dlg && g.ui.dlg.lines) g.ui.dlg.lines.forEach(function (l) { if (!seen.includes(l)) seen.push(l); });
      if (g.ui.menuOpen) { menuSeen = true; pick(g, 'yes'); continue; }
      if (st.story.position.map === 'pallet' && !g.ui.dialogueOpen) break;
      if (g.ui.dialogueOpen) { pA(g); continue; }
      tk(g, 2);
    }
    ok('E06 hub ferry return with embark_frontier DELETED still sails (unconditional — the sail menu was offered and the crossing lands on Pallet)',
      menuSeen === true && st.story.position.map === 'pallet' && !st.story.flags.embark_frontier,
      'pos=' + JSON.stringify(st.story.position) + ' menu=' + menuSeen);
    ok('E07 Sutter closing beat fires on the Pallet entry: scott_closing_done set, and his spoken lines salute the conqueror, followed the whole campaign, and point at Hawthorn lab + Vale back from Borea with an VOLTYETI and stories, home first',
      st.story.flags.scott_closing_done === true
      && seen.some(function (l) { return l.indexOf('salutes its conqueror') >= 0; })
      && seen.some(function (l) { return l.indexOf('followed the whole campaign') >= 0; })
      && seen.some(function (l) { return l.indexOf('Hawthorn') >= 0 && l.indexOf('Vale') >= 0 && l.indexOf('Borea') >= 0 && l.indexOf('VOLTYETI') >= 0; })
      && seen.some(function (l) { return l.indexOf('Home first') >= 0; }),
      'seen=' + seen.join(' | ').slice(0, 240));
    ow = gotoMap(g, 'viridian', 10, 10); drain(g);
    ow = gotoMap(g, 'pallet', 7, 9); tk(g, 4);
    ok('E08 leave + re-enter Pallet: Sutter does NOT re-fire (quiet load, exactly one closing scene in the UI log)',
      !g.ui.dialogueOpen && scottLogCount(g) === 1 && st.story.flags.scott_closing_done === true,
      'logScenes=' + scottLogCount(g));

    // ---------- E09-E10: the Sinnoh homecoming (machine, untouched) ----------
    // SUPERSEDED at Arc 4 Stage S0: the Sinnoh registry row flipped
    // 'sealed' -> 'shipped' (the arming), so this homecoming now takes
    // the SHIPPED branch of the same machine (the sealed branch's last
    // live proof was this test at F4). E09's hook-delivered and
    // directive-cleared assertions are unchanged; E10 now observes the
    // shipped advance.
    var regionsBefore = st.story.regionsDone.slice();
    ow = gotoMap(g, 'house-pallet-ash', 4, 4);
    drain(g);
    var hookSeen = g.ui.log.some(function (e) { return e.lines && e.lines.some(function (l) { return l.indexOf('VOLTYETI') >= 0 && l.indexOf('Borea') >= 0; }); });
    ok('E09 the Sinnoh homecoming completes at Mom house: the machine delivers Gary hook lines itself (the VOLTYETI line), hook_sinnoh + homecoming_sinnoh set, the directive is cleared',
      hookSeen && st.story.flags.hook_sinnoh === true && st.story.flags.homecoming_sinnoh === true
      && st.story.arc_directive === null,
      'hook=' + st.story.flags.hook_sinnoh + ' dir=' + st.story.arc_directive);
    ok('E10 shipped law holds end-to-end (Stage S0 supersedes the sealed-branch assertion): story.arc ADVANCES to sinnoh, story.region is sinnoh, embark_sinnoh IS armed, regionsDone is unchanged by the homecoming',
      st.story.arc === 'sinnoh' && st.story.region === 'sinnoh' && st.story.flags.embark_sinnoh === true
      && JSON.stringify(st.story.regionsDone) === JSON.stringify(regionsBefore),
      'arc=' + st.story.arc + ' done=' + JSON.stringify(st.story.regionsDone));

    // ---------- E11-E12: Regions / Journey surfaces ----------
    g.openJourney(); tk(g, 2);
    var jLabels = g.ui.menu.items.map(function (i) { return i.label; });
    pick(g, 'close'); tk(g, 2);
    g.openRegions(); tk(g, 2);
    var rLabels = g.ui.menu.items.map(function (i) { return i.label; });
    pick(g, 'close'); tk(g, 2);
    ok('E11 Journey surface: the arc headers read ARC 3.5 BATTLE FRONTIER COMPLETE and ARC 4 SINNOH CURRENT (Stage S0 supersedes the sealed reading: arcStateOf agrees — frontier complete, sinnoh current after its shipped homecoming)',
      arcStateOf(st, 'frontier') === 'complete' && arcStateOf(st, 'sinnoh') === 'current'
      && jLabels.some(function (l) { return l.indexOf('TRIAL GROUNDS') >= 0 && l.indexOf('COMPLETE') >= 0; })
      && jLabels.some(function (l) { return l.indexOf('BOREA') >= 0 && l.indexOf('CURRENT') >= 0; }),
      jLabels.join(' / ').slice(0, 300));
    ok('E12 Regions surface: the Sinnoh row reads current — you are here (Stage S0 supersedes the sealed reading; not done, not sealed)',
      rLabels.some(function (l) { return l.indexOf('Borea') >= 0 && l.indexOf('you are here') >= 0; })
      && !rLabels.some(function (l) { return l.indexOf('Borea') >= 0 && l.indexOf('sealed') >= 0; }),
      rLabels.join(' / ').slice(0, 300));
  }

  // ---------- E13-E14: Scott negatives + the seam unit ----------
  {
    var g = mkGame(7252); boot(g); strongParty(g, 100);
    var ow = gotoMap(g, 'pallet', 7, 9); drain(g);
    ok('E13 Sutter negative: a Pallet entry WITHOUT frontier_complete is quiet — no scott_closing_done, no dialogue (the chain drive earlier Pallet visits stay clean)',
      !g.state.story.flags.scott_closing_done && !g.ui.dialogueOpen);
    var f1 = tryScottClosing(g, 'viridian');
    var quiet1 = !g.ui.dialogueOpen && !g.state.story.flags.scott_closing_done;
    g.state.story.flags.frontier_complete = true;
    var f2 = tryScottClosing(g, 'viridian');
    var quiet2 = !g.ui.dialogueOpen && !g.state.story.flags.scott_closing_done;
    var f3 = tryScottClosing(g, 'pallet');
    var speaker = g.ui.dlg ? g.ui.dlg.speaker : null;
    drain(g);
    var f4 = tryScottClosing(g, 'pallet');
    ok('E14 seam unit: tryScottClosing fires only on Pallet with frontier_complete set (viridian no-fire with and without the flag), fires ONCE on Pallet with speaker SUTTER (flag set at scene start), and never twice',
      f1 === false && quiet1 && f2 === false && quiet2 && f3 === true && speaker === 'SUTTER'
      && g.state.story.flags.scott_closing_done === true && f4 === false && !g.ui.dialogueOpen,
      'f=' + [f1, f2, f3, f4].join(',') + ' speaker=' + speaker);
  }

  globalThis.__FRE__ = Q;
})();
`;
let QE = null;
try {
  const runnerE = new Function(gameJs + driverE + '\n;return globalThis.__FRE__;');
  QE = runnerE();
} catch (e) {
  console.log('FAIL  Part E bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QE) {
  for (const r of QE.results) ok('E ' + r.name, r.pass);
  ok('E00 driver completed with no internal failures', QE.failures === 0, QE.failures + ' failures');
}

console.log('\nFRONTIER TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
