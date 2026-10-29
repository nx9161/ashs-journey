// sinnoh-checks.mjs — Arc 4 Stage S0 (Sinnoh: badge quintet +
// Sinnoh arming + the F-1 validator fix) proofs. Part A: pure units —
// the badge quintet (ITEMS rows <-> BADGE_SETS.sinnoh 1:1 in Platinum
// order, the defaultState seed, the client schema pair, the server
// validator pair incl. the prefix law and the summary-count read,
// gen-tables, the bag-cap track), the registry flip, the generic
// deriveArcDefaults sealed-homecoming catch-up applied to a
// Frontier-close-shaped save (five fixtures, the F0 A13-A17 idiom),
// CAPT SINNOH's placement + Vermilion connectivity, and the F-1 fix
// (the dedicated meta.location charset: em/en dash accepted, unsafe
// text still rejected, NOTHING else widened, the played-shape save,
// and the shipped em-dash map-name census the register records).
// Part B: the built bundle in a headless Game — CAPT SINNOH on
// Vermilion's live roster, the ferry gate line with embark_sinnoh
// deleted and NO warp, an on-foot walk (dock approach -> the open
// passage tile -> the gym door warp firing, no position seeding
// beyond the standard gotoMap spawn), the live Cheat Terminal
// carrying the Sinnoh badges as data-driven stock with prefix-safe
// claims, and the ARC COMPLETE summary reading Badges: 8/8 for
// Sinnoh through the registry (badgeCountFor).
// Run: node --import ./register.mjs sinnoh-checks.mjs (from tests/)

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
const SINNOH_ORDER = ['coalbadge', 'forestbadge', 'relicbadge', 'cobblebadge', 'fenbadge', 'minebadge', 'iciclebadge', 'beaconbadge'];
const SINNOH_NAMES = ['Coal Badge', 'Forest Badge', 'Relic Badge', 'Cobble Badge', 'Fen Badge', 'Mine Badge', 'Icicle Badge', 'Beacon Badge'];

// ================= Part A: pure units =================
const { arcById, arcStateOf, badgeCountFor } = await import(join(ROOT, 'src/data/arcs.mjs'));
const { ITEMS, BADGE_SETS } = await import(join(ROOT, 'src/data/items.mjs'));
const { TALE_NPCS } = await import(join(ROOT, 'src/data/quests.mjs'));
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
  (await import(join(ROOT, 'src/data/maps8.mjs'))).MAPS8);
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));

// -- the quintet: ITEMS <-> BADGE_SETS <-> defaultState <-> registry --
{
  ok('A01 BADGE_SETS.sinnoh is the Platinum earn order [coal, forest, relic, cobble, fen, mine, icicle, beacon]',
    JSON.stringify(BADGE_SETS.sinnoh) === JSON.stringify(SINNOH_ORDER));
  ok('A02 order <-> ITEMS rows 1:1 (every row key-pocket, Platinum badge name, original flavour text naming its leader + town)',
    SINNOH_ORDER.every((id, i) => { const it = ITEMS[id]; return it && it.id === id && it.pocket === 'key' && it.name === SINNOH_NAMES[i] && typeof it.desc === 'string' && it.desc.length > 20; }));
  ok('A03 defaultState seed: badges.sinnoh is [] (the other sets untouched)',
    JSON.stringify(defaultState().badges.sinnoh) === '[]'
    && JSON.stringify(defaultState().badges.symbols) === JSON.stringify([null, null, null, null, null, null, null]));
  const sn = arcById('sinnoh');
  ok('A04 registry flip: sinnoh status shipped; nothing else in the row moved (badgeSet sinnoh, badgeTotal 8, completionKey/Flag sinnoh(_complete), embark vermilion -> sandgem, hook gary, band 301-400, horizon 493, regionKey sinnoh)',
    sn.status === 'shipped' && sn.badgeSet === 'sinnoh' && sn.badgeTotal === 8
    && sn.completionKey === 'sinnoh' && sn.completionFlag === 'sinnoh_complete'
    && sn.embarkPort === 'vermilion' && sn.arrivalMap === 'sandgem'
    && sn.hookGiver === 'gary' && sn.band.min === 301 && sn.band.max === 400
    && sn.dexHorizon === 493 && sn.regionKey === 'sinnoh');
}

// -- the quintet: client schema pair --
{
  const withSn = (arr) => { const s = clone(defaultState()); s.badges.sinnoh = arr; return s; };
  ok('A05 client schema accepts prefixes: [], the first two, and the full eight',
    SCH.validateSave(withSn([])).ok
    && SCH.validateSave(withSn(SINNOH_ORDER.slice(0, 2))).ok
    && SCH.validateSave(withSn([...SINNOH_ORDER])).ok,
    JSON.stringify(SCH.validateSave(withSn([...SINNOH_ORDER])).errors));
  ok('A06 client schema rejects a skip (forest first), a swap (forest before coal), a duplicate/overlong array and a non-array (bad-badges-sinnoh)',
    SCH.validateSave(withSn(['forestbadge'])).errors.includes('bad-badges-sinnoh')
    && SCH.validateSave(withSn(['forestbadge', 'coalbadge'])).errors.includes('bad-badges-sinnoh')
    && SCH.validateSave(withSn([...SINNOH_ORDER, 'coalbadge'])).errors.includes('bad-badges-sinnoh')
    && SCH.validateSave(withSn('coalbadge')).errors.includes('bad-badges-sinnoh'));
  ok('A07 save-fill PRESERVES earned badges on old saves: a present prefix round-trips byte-identical through migrate; an absent sinnoh key fills to []; a non-array fills to []',
    JSON.stringify(SCH.migrate(withSn(SINNOH_ORDER.slice(0, 3))).badges.sinnoh) === JSON.stringify(SINNOH_ORDER.slice(0, 3))
    && (() => { const s = clone(defaultState()); delete s.badges.sinnoh; return JSON.stringify(SCH.migrate(s).badges.sinnoh) === '[]'; })()
    && JSON.stringify(SCH.migrate(withSn('coalbadge')).badges.sinnoh) === '[]');
}

// -- the quintet: server validator pair + gen-tables + bag cap --
{
  const cloud = (mut) => { const s = clone(defaultState()); s.player.name = 'ASH'; s.player.rivalName = 'GARY'; if (mut) mut(s); return s; };
  ok('A08 server validator accepts the same prefixes ([], first two, full eight)',
    VAL.validateSave(cloud((s) => { s.badges.sinnoh = []; })).ok
    && VAL.validateSave(cloud((s) => { s.badges.sinnoh = SINNOH_ORDER.slice(0, 2); })).ok
    && VAL.validateSave(cloud((s) => { s.badges.sinnoh = [...SINNOH_ORDER]; })).ok,
    JSON.stringify(VAL.validateSave(cloud((s) => { s.badges.sinnoh = [...SINNOH_ORDER]; })).errors));
  ok('A09 server validator rejects a skip and a swap (bad-badge-order, the shared prefix code), an overlong array (bad-badges-sinnoh) and a duplicate (bad-badge-id)',
    VAL.validateSave(cloud((s) => { s.badges.sinnoh = ['forestbadge']; })).errors.includes('bad-badge-order')
    && VAL.validateSave(cloud((s) => { s.badges.sinnoh = ['forestbadge', 'coalbadge']; })).errors.includes('bad-badge-order')
    && VAL.validateSave(cloud((s) => { s.badges.sinnoh = [...SINNOH_ORDER, 'coalbadge']; })).errors.includes('bad-badges-sinnoh')
    && VAL.validateSave(cloud((s) => { s.badges.sinnoh = ['coalbadge', 'coalbadge']; })).errors.includes('bad-badge-id'));
  const counted = VAL.validateSave(cloud((s) => { s.badges.kanto = ['boulderbadge']; s.badges.sinnoh = SINNOH_ORDER.slice(0, 2); s.badges.symbols = ['silver', null, 'gold', null, null, null, 'gold']; }));
  ok('A10 summary badgeCount INCLUDES the sinnoh badges (1 kanto + 2 sinnoh + 3 symbol slots = 6, the F0 total-honors read)',
    counted.ok && counted.summary.badgeCount === 6, JSON.stringify(counted.summary));
  let checkOut = '';
  try { checkOut = execFileSync('node', [join(ROOT, 'tools/api-scripts/gen-tables.mjs'), '--check'], { encoding: 'utf8' }); }
  catch (e) { checkOut = 'STALE: ' + (e.stdout || '') + (e.stderr || ''); }
  const t = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('A11 tables.json in sync (gen-tables --check, regenerated via the tool only); items 183 carries all 8 sinnoh ids; badgeSequences.sinnoh is the Platinum order and regionBadgeMax.sinnoh is 8',
    checkOut.includes('tables.json OK') && t.items.length === 183
    && SINNOH_ORDER.every((id) => t.items.includes(id))
    && JSON.stringify(t.badgeSequences.sinnoh) === JSON.stringify(SINNOH_ORDER)
    && t.regionBadgeMax.sinnoh === 8, checkOut.trim());
  const maximal = cloud((s) => { for (const id of Object.keys(ITEMS)) s.bag[id] = 999; });
  ok('A12 bag cap tracks the ITEMS table: a maximal bag (all 183 items @999) validates server-side',
    Object.keys(ITEMS).length === 183 && VAL.validateSave(maximal).ok,
    JSON.stringify(VAL.validateSave(maximal).errors));
  ok('A13 registry-driven display read: badgeCountFor counts badges.sinnoh through the arc row (3 earned -> 3; absent array -> 0)',
    badgeCountFor({ badges: { sinnoh: SINNOH_ORDER.slice(0, 3) } }, arcById('sinnoh')) === 3
    && badgeCountFor({ badges: {} }, arcById('sinnoh')) === 0);
}

// -- arming: the deriveArcDefaults catch-up on a Frontier-close save --
{
  const frontierCloseSave = (mut) => {
    const s = clone(defaultState());
    s.story.arc = 'frontier'; s.story.region = 'kanto';
    s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier'];
    s.badges.symbols = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold'];
    // Fixture totals at the (would-be) advance: 395 caught / 54321s
    // played, against the Frontier-era arc-start stamps (386 / 40000)
    // a live save would still be carrying — so the catch-up's
    // re-stamp (or its absence) is observable, not vacuous.
    s.dex.caught = {}; for (let i = 1; i <= 395; i++) s.dex.caught[i] = true;
    s.player.playtimeSec = 54321;
    s.story.arcDexStart = 386; s.story.arcStartPlaytime = 40000;
    if (mut) mut(s);
    return s;
  };
  const consumed = SCH.migrate(frontierCloseSave((s) => { s.story.flags.hook_sinnoh = true; s.story.flags.homecoming_sinnoh = true; }));
  ok('A14 derivation (i): a consumed-SEALED Sinnoh save (hook_sinnoh + homecoming_sinnoh, arc still frontier, Frontier complete in regionsDone) derives arc sinnoh + region sinnoh + embark_sinnoh + the arc-start snapshots (arcDexStart = the fixture\'s 395 caught, arcStartPlaytime = the fixture\'s 54321s) on load — the UNCHANGED generic F0 catch-up covers Sinnoh, and it is idempotent',
    consumed.story.arc === 'sinnoh' && consumed.story.region === 'sinnoh' && consumed.story.flags.embark_sinnoh === true
    && consumed.story.arcDexStart === 395 && consumed.story.arcStartPlaytime === 54321
    && (() => { const again = SCH.migrate(clone(consumed)); return again.story.arc === 'sinnoh' && again.story.region === 'sinnoh' && again.story.flags.embark_sinnoh === true && again.story.arcDexStart === 395 && again.story.arcStartPlaytime === 54321; })(),
    JSON.stringify({ arc: consumed.story.arc, region: consumed.story.region, emb: consumed.story.flags.embark_sinnoh, dexStart: consumed.story.arcDexStart, playStart: consumed.story.arcStartPlaytime }));
  const consumedByFlag = SCH.migrate(frontierCloseSave((s) => { s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn']; s.story.flags.frontier_complete = true; s.story.flags.hook_sinnoh = true; s.story.flags.homecoming_sinnoh = true; }));
  ok('A15 derivation (i, flag form): the previous arc\'s completion met via its completionFlag (frontier_complete, regionsDone without frontier) derives the same repair (incl. arcDexStart 395 + arcStartPlaytime 54321)',
    consumedByFlag.story.arc === 'sinnoh' && consumedByFlag.story.region === 'sinnoh' && consumedByFlag.story.flags.embark_sinnoh === true
    && consumedByFlag.story.arcDexStart === 395 && consumedByFlag.story.arcStartPlaytime === 54321);
  const midFrontier = SCH.migrate(frontierCloseSave((s) => { s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn']; s.story.flags = {}; }));
  ok('A16 derivation (ii): a mid-Frontier save (no hook, no homecoming) is untouched — arc stays frontier, region stays kanto, no embark_sinnoh, arc-start stamps untouched (386 / 40000)',
    midFrontier.story.arc === 'frontier' && midFrontier.story.region === 'kanto' && !midFrontier.story.flags.embark_sinnoh
    && midFrontier.story.arcDexStart === 386 && midFrontier.story.arcStartPlaytime === 40000);
  const advanced = SCH.migrate(frontierCloseSave((s) => { s.story.arc = 'sinnoh'; s.story.flags.hook_sinnoh = true; s.story.flags.homecoming_sinnoh = true; s.story.flags.embark_sinnoh = true; }));
  ok('A17 derivation (iii): an already-advanced save (arc sinnoh, embark already armed by the live homecoming) is untouched — region untouched, arc-start stamps untouched (386 / 40000)',
    advanced.story.arc === 'sinnoh' && advanced.story.region === 'kanto' && advanced.story.flags.embark_sinnoh === true
    && advanced.story.arcDexStart === 386 && advanced.story.arcStartPlaytime === 40000);
  const pending = SCH.migrate(frontierCloseSave((s) => { s.story.arc_directive = 'sinnoh'; s.story.flags.hook_sinnoh = true; }));
  const hookless = SCH.migrate(frontierCloseSave((s) => { s.story.flags.homecoming_sinnoh = true; }));
  ok('A18 derivation (iv): a pending homecoming (directive set + hook delivered, NO homecoming flag) is untouched; and homecoming without the hook is untouched',
    pending.story.arc === 'frontier' && !pending.story.flags.embark_sinnoh
    && hookless.story.arc === 'frontier' && !hookless.story.flags.embark_sinnoh);
  ok('A19 arcStateOf: the repaired save reads sinnoh as current and frontier as complete',
    arcStateOf(consumed, 'sinnoh') === 'current' && arcStateOf(consumed, 'frontier') === 'complete');
}

// -- CAPT SINNOH placement + Vermilion connectivity (pure, sweep-style) --
{
  const capt = TALE_NPCS.find((n) => n.name === 'CAPT SINNOH');
  const hoenn = TALE_NPCS.find((n) => n.name === 'CAPT HOENN');
  const harbor = TALE_NPCS.find((n) => n.name === 'HARBORMASTER');
  ok('A20 CAPT SINNOH appended via the TALE_NPCS idiom on vermilion (14,10) — ferry sandgem + ferryArc sinnoh, sailor art, no tale/role; CAPT HOENN unmoved at (16,10), HARBORMASTER unmoved at (16,11)',
    !!capt && capt.map === 'vermilion' && capt.x === 14 && capt.y === 10 && capt.ferry === 'sandgem' && capt.ferryArc === 'sinnoh'
    && capt.art === 'sailor' && !capt.tale && Array.isArray(capt.dialogue) && capt.dialogue.length === 2
    && !!hoenn && hoenn.x === 16 && hoenn.y === 10
    && !!harbor && harbor.x === 16 && harbor.y === 11);
  const v = ALL_MAPS.vermilion;
  ok('A21 the stance tile seals nothing by position: (14,10) is a walkable ground tile, not a warp tile, not a sign/event tile, and no base vermilion NPC stands there',
    WALKABLE.has(v.rows[10][14]) && !(v.warps || []).some((w) => w.x === 14 && w.y === 10)
    && !(v.signs || []).some((sg) => sg.x === 14 && sg.y === 10)
    && !(v.events || []).some((e) => e.x === 14 && e.y === 10)
    && !(v.npcs || []).some((n) => n.x === 14 && n.y === 10));
  const graph = (withCapt) => {
    const blocked = (x, y) => (v.npcs || []).some((n) => n.x === x && n.y === y)
      || TALE_NPCS.some((n) => n.map === 'vermilion' && n.x === x && n.y === y && (withCapt || n.name !== 'CAPT SINNOH'));
    const walkable = (x, y) => y >= 0 && y < v.rows.length && x >= 0 && x < v.rows[y].length && WALKABLE.has(v.rows[y][x]) && !blocked(x, y);
    const seenAll = new Set(); const comps = [];
    for (let y = 0; y < v.rows.length; y++) for (let x = 0; x < v.rows[y].length; x++) {
      if (!walkable(x, y) || seenAll.has(x + ',' + y)) continue;
      const comp = []; const q = [[x, y]]; seenAll.add(x + ',' + y);
      while (q.length) { const [a, b] = q.shift(); comp.push(a + ',' + b);
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = a + dx, ny = b + dy, k = nx + ',' + ny;
          if (!seenAll.has(k) && walkable(nx, ny)) { seenAll.add(k); q.push([nx, ny]); } } }
      comps.push(comp);
    }
    return comps.sort((a, b) => b.length - a.length);
  };
  const before = graph(false); const after = graph(true);
  ok('A22 Vermilion\'s walkable graph keeps its exact base shape with the captain standing: base [main 119, the pre-existing isolated tile (5,11)] -> [main 118, (5,11)] — the main fragment loses ONLY the captain\'s own tile, no new fragment, and every warp tile is in the main fragment or beside it',
    before.length === 2 && before[0].length === 119 && JSON.stringify(before[1]) === JSON.stringify(['5,11'])
    && after.length === 2 && after[0].length === 118 && JSON.stringify(after[1]) === JSON.stringify(['5,11'])
    && (v.warps || []).every((w) => after[0].includes(w.x + ',' + w.y)
      || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => after[0].includes((w.x + dx) + ',' + (w.y + dy)))),
    'before=' + before.map((c) => c.length).join(',') + ' after=' + after.map((c) => c.length).join(','));
}

// -- F-1: the dedicated meta.location charset (server validator) --
{
  const cloud = (mut) => { const s = clone(defaultState()); s.player.name = 'ASH'; s.player.rivalName = 'GARY'; if (mut) mut(s); return s; };
  ok('A23 F-1: an em-dash meta.location validates server-side with ZERO errors, and an en-dash location validates too (the dedicated charset = SAFE_TEXT + U+2014 + U+2013)',
    (() => { const rr = VAL.validateSave(cloud((s) => { s.meta.location = 'Pewter City — House'; })); return rr.ok && rr.errors.length === 0; })()
    && VAL.validateSave(cloud((s) => { s.meta.location = 'Pewter City – House'; })).ok);
  ok('A24 F-1: a location with genuinely unsafe characters still rejects (bad-meta-location:charset) — <, double-quote, and emoji forms',
    VAL.validateSave(cloud((s) => { s.meta.location = 'Pewter <City'; })).errors.includes('bad-meta-location:charset')
    && VAL.validateSave(cloud((s) => { s.meta.location = 'Pewter "City'; })).errors.includes('bad-meta-location:charset')
    && VAL.validateSave(cloud((s) => { s.meta.location = 'Pewter City 🏠'; })).errors.includes('bad-meta-location:charset'));
  ok('A25 F-1: NOTHING else widens — an em-dash player name still rejects (bad-player-name:charset) and an em-dash rival name still rejects (bad-rival-name:charset); SAFE_TEXT is kept for both',
    VAL.validateSave(cloud((s) => { s.player.name = 'A—B'; })).errors.includes('bad-player-name:charset')
    && VAL.validateSave(cloud((s) => { s.player.rivalName = 'A—B'; })).errors.includes('bad-rival-name:charset'));
  const played = cloud((s) => {
    s.party.push({
      speciesId: 'partner', nickname: null, level: 312, xp: 1000,
      moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }],
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40,
    });
    s.story.arc = 'sinnoh'; s.story.region = 'sinnoh';
    s.dex.caught['25'] = true; s.dex.seen['25'] = true;
    s.badges.kanto.push('boulderbadge');
    s.badges.sinnoh = SINNOH_ORDER.slice(0, 2);
    s.meta.location = 'Pewter City — House';
  });
  ok('A26 F-1 played-shape fixture: a fleshed save (Lv312 party mon in a sinnoh-arc save, dex, kanto + sinnoh badges) whose meta.location is a real em-dash map name validates with ZERO errors server-side — and the client accepts the same save',
    (() => { const rr = VAL.validateSave(clone(played)); return rr.ok && rr.errors.length === 0; })()
    && SCH.validateSave(clone(played)).ok,
    JSON.stringify(VAL.validateSave(clone(played)).errors));
  const emNames = Object.values(ALL_MAPS).map((m) => m.name).filter((n) => typeof n === 'string' && n.includes('—'));
  const SAFE = /^[A-Za-z0-9 _.'\-]$/;
  const offending = new Set();
  for (const m of Object.values(ALL_MAPS)) {
    if (typeof m.name !== 'string') continue;
    for (const ch of m.name.normalize('NFKC')) if (!SAFE.test(ch)) offending.add(ch);
  }
  ok('A27 F-1 census (the register count): the shipped maps*.mjs name fields hold 38 map entries whose display name contains the em-dash, 36 unique names — and U+2014 is the ONLY character in any shipped map display name outside the SAFE_TEXT set',
    emNames.length === 38 && new Set(emNames).size === 36
    && offending.size === 1 && offending.has('—'),
    'entries=' + emNames.length + ' unique=' + new Set(emNames).size + ' offending=' + [...offending].join(','));
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
    if (!cond) { Q.failures++; console.error('SN-FAIL ' + name + (extra ? ' — ' + extra : '')); }
    else console.log('sn-pass ' + name);
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
  function pos(g) { return g.state.story.position; }
  // ---- walking (no position seeding): BFS over the live map, then
  // real D-pad steps, one tile at a time (frontier Part C idiom) ----
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
      var n = 0;
      while (n++ < 100 && (pos(g).map + ',' + pos(g).x + ',' + pos(g).y) === startTuple) tk(g, 1);
    }
    tk(g, 3);
    return true;
  }

  var SN_IDS = ['coalbadge', 'forestbadge', 'relicbadge', 'cobblebadge', 'fenbadge', 'minebadge', 'iciclebadge', 'beaconbadge'];
  var g = mkGame(801); boot(g);
  var st = g.state;
  var ow = gotoMap(g, 'vermilion', 13, 9); drain(g);
  var capt = ow.map.npcs.find(function (n) { return n.name === 'CAPT SINNOH'; });
  ok('B01 CAPT SINNOH stands on Vermilion\\'s live roster at (14,10) (ferry sandgem, ferryArc sinnoh), beside CAPT HOENN (16,10)',
    !!capt && capt.x === 14 && capt.y === 10 && capt.ferry === 'sandgem' && capt.ferryArc === 'sinnoh'
    && !!ow.map.npcs.find(function (n) { return n.name === 'CAPT HOENN' && n.x === 16 && n.y === 10; }));

  // The gate: embark_sinnoh deleted (a fresh state never had it) —
  // talking yields the ferry gate line and NO warp, NO sail menu.
  // (The crossing itself is NOT proven here: sandgem does not exist
  // until S3; the crossing proof belongs to S3, the F0/F1 split.)
  delete st.story.flags.embark_sinnoh;
  ow.sysNpc(capt); tk(g, 3);
  var seenLines = []; var menuSeen = false; var guardB = 0;
  while (guardB++ < 80) {
    if (g.ui.dlg && g.ui.dlg.lines) g.ui.dlg.lines.forEach(function (l) { if (!seenLines.includes(l)) seenLines.push(l); });
    if (g.ui.menuOpen) { menuSeen = true; break; }
    if (!g.ui.dialogueOpen) break;
    pA(g);
  }
  drain(g);
  ok('B02 with embark_sinnoh deleted, CAPT SINNOH yields the ferry gate line and NO warp (still on vermilion, no sail menu offered)',
    seenLines.some(function (l) { return l.indexOf('No sailing to Sinnoh yet') === 0; }) && menuSeen === false && !g.ui.menuOpen
    && st.story.position.map === 'vermilion' && ow.mapId === 'vermilion',
    'lines=' + seenLines.join(' | ').slice(0, 200) + ' pos=' + st.story.position.map);

  // The walk: spawn at the Route 6 landing, then ON FOOT to (15,10)
  // — the open passage tile between CAPT SINNOH (14,10) and CAPT
  // HOENN (16,10), and the ONLY free tile adjacent to either captain
  // (north of SINNOH is HANK's stance, south is the dock edge, west
  // is CAPT ORANGE) — then west along the dock street, and onto the
  // gym door warp: reachability + non-interference.
  ow = gotoMap(g, 'vermilion', 8, 1); drain(g);
  // NOTE: story.position only re-stamps on map load/warp — the LIVE
  // player tile during a walk is scenes.top.player (the frontier
  // Part C drives read warp landings; these two read the live tile).
  var live = function () { var sc = g.scenes.top; return { map: sc.mapId, x: sc.player.tx, y: sc.player.ty }; };
  var w1 = walkTo(g, 15, 10);
  ok('B03 walk on foot from the Route 6 landing (8,1) to (15,10), the open tile directly east of CAPT SINNOH — the captain is reachable and talkable from his own dock (no position seeding)',
    w1 && live().map === 'vermilion' && live().x === 15 && live().y === 10
    && capt.x === live().x - 1 && capt.y === live().y,
    'walked=' + w1 + ' live=' + JSON.stringify(live()));
  var w2 = walkTo(g, 10, 9);
  ok('B04 walk west along the dock street from (15,10) to (10,9), past every captain on the row — the stance seals no route on the dock',
    w2 && live().map === 'vermilion' && live().x === 10 && live().y === 9,
    'walked=' + w2 + ' live=' + JSON.stringify(live()));
  var w3 = walkTo(g, 11, 4);
  ok('B05 walk to the Vermilion Gym door (11,4) and the warp FIRES (lands inside gym-vermilion) — no warp/door interference from the captain\\'s stance',
    w3 && pos(g).map === 'gym-vermilion',
    'walked=' + w3 + ' pos=' + JSON.stringify(pos(g)));

  // The Cheat Terminal: Sinnoh badges are data-driven stock.
  ow = g.scenes.top;
  ow.openCheatShop(); pick(g, 'items'); pick(g, 'badges');
  var badgeVals = g.ui.menu.items.map(function (i) { return i.value; });
  ok('B06 Cheat Terminal badge stock is BADGE_SETS-driven: all 8 Sinnoh badge ids are stock (36 real badge rows + Back = 37)',
    badgeVals.length === 37 && SN_IDS.every(function (id) { return badgeVals.includes(id); }),
    'rows=' + badgeVals.length + ' vals=' + badgeVals.join(','));
  pick(g, null); pick(g, 'key');
  var keyVals = g.ui.menu.items.map(function (i) { return i.value; });
  ok('B07 Cheat Terminal Key Items stock carries NO badge id (badges never leak in through the key pocket — the stockOf BADGE_IDS exclusion is set-driven)',
    SN_IDS.every(function (id) { return !keyVals.includes(id); }), keyVals.join(','));
  pick(g, null); pick(g, null);
  ok('B08 the claim path resolves Sinnoh generically: cheatClaimBadge(fenbadge) prefix-completes badges.sinnoh to the first five with badge_<root> flags; cheatClaimBadge(beaconbadge) completes the set',
    ow.cheatClaimBadge('fenbadge') === true
    && JSON.stringify(st.badges.sinnoh) === JSON.stringify(SN_IDS.slice(0, 5))
    && ['coal', 'forest', 'relic', 'cobble', 'fen'].every(function (r) { return st.story.flags['badge_' + r] === true; })
    && ow.cheatClaimBadge('beaconbadge') === true
    && JSON.stringify(st.badges.sinnoh) === JSON.stringify(SN_IDS),
    'sinnoh=' + JSON.stringify(st.badges.sinnoh));

  // The registry-driven summary: Sinnoh reads 8/8 with no special case.
  var sum = arcCompleteSummary(st, arcById('sinnoh'));
  ok('B09 ARC COMPLETE summary for Sinnoh reads Badges: 8/8 through badgeCountFor (the registry badgeSet read — the Journal/dex display path picks Sinnoh up with no special-casing)',
    sum.badgeLine === 'Badges: 8/8' && sum.arcId === 'sinnoh',
    'badgeLine=' + sum.badgeLine);

  globalThis.__SNQ__ = Q;
})();
`;
let QB = null;
try {
  const runner = new Function(gameJs + driver + '\n;return globalThis.__SNQ__;');
  QB = runner();
} catch (e) {
  console.log('FAIL  Part B bundle evaluation threw: ' + (e && e.stack || e));
  fail++;
}
if (QB) {
  for (const r of QB.results) ok('B ' + r.name, r.pass);
  ok('B00 driver completed with no internal failures', QB.failures === 0, QB.failures + ' failures');
}

console.log('\nSINNOH TOTAL: ' + pass + '/' + (pass + fail) + ' passed');
if (fail) process.exit(1);
