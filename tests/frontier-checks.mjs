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
  ok('A12 tables.json in sync (gen-tables --check, regenerated via the tool only); items 175 carries all 7 symbol ids; badgeSequences has NO symbols entry and regionBadgeMax no symbols row (no prefix check exists to emit)',
    checkOut.includes('tables.json OK') && t.items.length === 175
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
{
  const capt = TALE_NPCS.find((n) => n.name === 'CAPT FRONTIER');
  const johto = TALE_NPCS.find((n) => n.name === 'CAPT JOHTO');
  ok('A19 CAPT FRONTIER appended via the TALE_NPCS idiom on pallet (11,9) — ferry frontierhub + ferryArc frontier, sailor art, no tale/role; CAPT JOHTO unmoved at (11,8)',
    !!capt && capt.map === 'pallet' && capt.x === 11 && capt.y === 9 && capt.ferry === 'frontierhub' && capt.ferryArc === 'frontier'
    && capt.art === 'sailor' && !capt.tale && Array.isArray(capt.dialogue) && capt.dialogue.length === 2
    && !!johto && johto.x === 11 && johto.y === 8);
  const p = MAPS.pallet;
  ok('A20 the stance tile seals nothing by position: (11,9) is a walkable ground tile, not a warp tile, not a door, and no base pallet NPC stands there',
    WALKABLE.has(p.rows[9][11]) && !(p.warps || []).some((w) => w.x === 11 && w.y === 9)
    && !(p.npcs || []).some((n) => n.x === 11 && n.y === 9));
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
  const main = comps[0] || [];
  ok('A21 Pallet\'s walkable graph stays ONE fragment with the captain standing (and every warp tile is in it or beside it)',
    comps.length === 1 && (p.warps || []).every((w) => main.includes(w.x + ',' + w.y)
      || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => main.includes((w.x + dx) + ',' + (w.y + dy)))),
    'components=' + comps.map((c) => c.length).join(','));
}

// ================= Part A2: F1 maps (pure) =================
const { MAPS8 } = await import(join(ROOT, 'src/data/maps8.mjs'));
const F1_IDS = ['frontierhub', 'frontier-tower', 'frontier-factory', 'frontier-arena', 'frontier-dome', 'frontier-pike', 'frontier-palace', 'frontier-pyramid', 'frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'];
const BRAIN = { tower: 'Anabel', factory: 'Noland', arena: 'Greta', dome: 'Tucker', pike: 'Lucy', palace: 'Spencer', pyramid: 'Brandon' };
const FAC_NAME = { tower: 'Battle Tower', factory: 'Battle Factory', arena: 'Battle Arena', dome: 'Battle Dome', pike: 'Battle Pike', palace: 'Battle Palace', pyramid: 'Battle Pyramid' };
{
  ok('A22 MAPS8 exports exactly the 11 F1 maps; merge.mjs folds MAPS8 into MAPS and module-order.json loads maps8.mjs after maps7.mjs (the bundle-side merge is proven live in Part C)',
    JSON.stringify(Object.keys(MAPS8)) === JSON.stringify(F1_IDS)
    && readFileSync(join(ROOT, 'src/data/merge.mjs'), 'utf8').includes('MAPS7, MAPS8')
    && (() => { const order = JSON.parse(readFileSync(join(ROOT, 'scripts/module-order.json'), 'utf8')); return order.indexOf('src/data/maps8.mjs') === order.indexOf('src/data/maps7.mjs') + 1; })());
  const hub = MAPS8.frontierhub;
  ok('A23 hub: 40x24 outdoor, weather clear, NO wild encounters, start (18,21) on the dock pier (boardwalk); CAPT BREAKWATER (ferry pallet, ferryArc frontier) and SCOTT stand on it',
    hub.rows.length === 24 && hub.rows[0].length === 40 && hub.weather === 'clear' && hub.encounters === null
    && hub.start.x === 18 && hub.start.y === 21
    && hub.npcs.some((n) => n.name === 'CAPT BREAKWATER' && n.ferry === 'pallet' && n.ferryArc === 'frontier')
    && hub.npcs.some((n) => n.name === 'SCOTT' && Array.isArray(n.dialogue) && n.dialogue.length >= 2));
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
  ok('A29 music mirrors shipped interiors: hub pallet-theme; the seven facility interiors gym-theme; the dark floors pewter-theme (existing theme ids only)',
    hub.music === 'pallet-theme'
    && ['frontier-tower', 'frontier-factory', 'frontier-arena', 'frontier-dome', 'frontier-pike', 'frontier-palace', 'frontier-pyramid'].every((id) => MAPS8[id].music === 'gym-theme')
    && ['frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'].every((id) => MAPS8[id].music === 'pewter-theme'));
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
  ok('B01 CAPT FRONTIER stands on Pallet\\'s live roster at (11,9) (ferry frontierhub, ferryArc frontier), beside CAPT JOHTO (11,8)',
    !!capt && capt.x === 11 && capt.y === 9 && capt.ferry === 'frontierhub' && capt.ferryArc === 'frontier'
    && !!ow.map.npcs.find(function (n) { return n.name === 'CAPT JOHTO' && n.x === 11 && n.y === 8; }));

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
    seenLines.some(function (l) { return l.indexOf('No sailing to Battle Frontier yet') === 0; }) && menuSeen === false && !g.ui.menuOpen
    && st.story.position.map === 'pallet' && ow.mapId === 'pallet',
    'lines=' + seenLines.join(' | ').slice(0, 200) + ' pos=' + st.story.position.map);

  // The Cheat Terminal: symbols are not stock, in any section.
  ow.openCheatShop(); pick(g, 'items'); pick(g, 'badges');
  var badgeVals = g.ui.menu.items.map(function (i) { return i.value; });
  var badgeLabels = g.ui.menu.items.map(function (i) { return i.label; }).join(' | ');
  ok('B03 Cheat Terminal badge stock carries NO symbol (28 real badge rows + Back; no symbol item id, no facility id, no Symbol label)',
    badgeVals.length === 29 && SYM_IDS.every(function (id) { return !badgeVals.includes(id); })
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

console.log('\nFRONTIER (F0+F1) TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
