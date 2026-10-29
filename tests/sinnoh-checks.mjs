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
  (await import(join(ROOT, 'src/data/maps8.mjs'))).MAPS8,
  (await import(join(ROOT, 'src/data/maps9.mjs'))).MAPS9);
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
  ok('A11 tables.json in sync (gen-tables --check, regenerated via the tool only); items 186 (183 + HM06 Defog + HM07 Rock Climb + the Gracidea, Arc 4 Stage S4 — supersedes the Stage S0 count) carries all 8 sinnoh ids; badgeSequences.sinnoh is the Platinum order and regionBadgeMax.sinnoh is 8',
    checkOut.includes('tables.json OK') && t.items.length === 186
    && SINNOH_ORDER.every((id) => t.items.includes(id))
    && JSON.stringify(t.badgeSequences.sinnoh) === JSON.stringify(SINNOH_ORDER)
    && t.regionBadgeMax.sinnoh === 8, checkOut.trim());
  const maximal = cloud((s) => { for (const id of Object.keys(ITEMS)) s.bag[id] = 999; });
  ok('A12 bag cap tracks the ITEMS table: a maximal bag (all 186 items @999) validates server-side',
    Object.keys(ITEMS).length === 186 && VAL.validateSave(maximal).ok,
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
  ok('A27 F-1 census (the register count; S3b supersession — maps9 S3b adds eighteen em-dash names: Route 212 — South, Route 210 — North, Mt. Coronet — North, Great Marsh — West/East/North, Snowpoint Temple — Depths, Stark Mountain — Crater Hall, League Chamber — First/Second/Third/Fourth, Distortion World — Threshold/Depths/Isles/Falls/Abyss/Platform, all covered by the same F-1 charset): the shipped maps*.mjs name fields hold 59 map entries whose display name contains the em-dash, 57 unique names — and U+2014 is the ONLY character in any shipped map display name outside the SAFE_TEXT set',
    emNames.length === 59 && new Set(emNames).size === 57
    && offending.size === 1 && offending.has('—'),
    'entries=' + emNames.length + ' unique=' + new Set(emNames).size + ' offending=' + [...offending].join(','));
}

// ================= Part S1: species data (Arc 4 Stage S1) =================
// +107 Gen-4 species (dex 387-493) in src/data/species5.mjs via the
// facts-only PokeAPI ETL (arc4-etl), band-local learnsets (+300),
// growth substitutions, the 7 mission formes as partner-pattern form
// entries, and the cross-gen parent amendments in species2/3/4.
{
  const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
  const { SPECIES: SP1 } = await import(join(ROOT, 'src/data/species.mjs'));
  const { SPECIES2: SP2 } = await import(join(ROOT, 'src/data/species2.mjs'));
  const { SPECIES_JOHTO: SP3 } = await import(join(ROOT, 'src/data/species3.mjs'));
  const { SPECIES_HOENN: SP4 } = await import(join(ROOT, 'src/data/species4.mjs'));
  const { MOVES: MV1 } = await import(join(ROOT, 'src/data/moves.mjs'));
  const { MOVES2: MV2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
  const ALL = { ...SP1, ...SP2, ...SP3, ...SP4, ...SPECIES_SINNOH };
  const ALL_MOVES = { ...MV1, ...MV2 };
  const SN = Object.values(SPECIES_SINNOH);
  const base = SN.filter((e) => !e.form);
  const formes = SN.filter((e) => e.form);
  ok('S1-01 species5 roster accounting: 114 entries = 107 base species (dex 387-493, each exactly once, file order is dex order) + 7 form entries; merged roster is 509',
    SN.length === 114 && base.length === 107 && formes.length === 7
    && base.every((e, i) => e.dexNo === 387 + i)
    && Object.keys(ALL).length === 509,
    'entries=' + SN.length + ' base=' + base.length + ' formes=' + formes.length + ' merged=' + Object.keys(ALL).length);
  ok('S1-02 National dex complete: the merged non-form roster covers dexNo 1-493 with no gaps; the only shared dexNo among non-form entries is the shipped partner pair at 25 (partner + pikachu, pre-S1 design), so non-form entries total 494',
    (() => { const seen = new Set(); let nonForm = 0; for (const e of Object.values(ALL)) { if (e.form) continue; nonForm++; seen.add(e.dexNo); } return seen.size === 493 && nonForm === 494 && Math.min(...seen) === 1 && Math.max(...seen) === 493; })());
  ok('S1-03 every Sinnoh entry is complete: 1-2 types, six positive base stats, supported growth curve, egg groups + hatch counter, original flavor, resolving TM list',
    SN.every((e) => e.types.length >= 1 && e.types.length <= 2
      && ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].every((k) => e.base[k] > 0)
      && ['fast', 'mediumfast', 'mediumslow', 'slow'].includes(e.growth)
      && Array.isArray(e.eggGroups) && e.eggGroups.length >= 1 && typeof e.hatchCounter === 'number'
      && typeof e.flavor === 'string' && e.flavor.length > 10 && Array.isArray(e.tm))); // tm may be empty — the shipped cocoon precedent (metapod/kakuna/wurmple carry tm: []); kricketot (analogue wurmple) and burmy (analogue shedinja) are the two S1 cases, recorded in the ETL notes
  ok('S1-04 the breeding frame is complete: every entry in the merged 509 roster carries eggGroups (Johto J6 / Hoenn completed 1-386; S1 completes 387-493 + formes)',
    Object.values(ALL).every((e) => Array.isArray(e.eggGroups) && e.eggGroups.length >= 1));
  ok('S1-05 band law: every Sinnoh learnset key is 1 (the Lv1 starter set) or inside the Sinnoh band 301-400 — no exceptions',
    SN.every((e) => Object.keys(e.learnset).every((k) => +k === 1 || (+k >= 301 && +k <= 400))));
  ok('S1-06 no degenerate learnsets: every Sinnoh entry knows at least 4 distinct moves (the ETL top-up rule: type staples, then type-matching canon TM/HM moves, then Normal staples, all placed at level 1)',
    SN.every((e) => new Set(Object.values(e.learnset).flat()).size >= 4));
  ok('S1-07 ETL integrity: every learnset move in species5 exists in the shipped move table (moves + moves2)',
    SN.every((e) => Object.values(e.learnset).flat().every((m) => ALL_MOVES[m])));
  ok('S1-08 evolution integrity: every evo/evos target named by a Sinnoh entry exists in the merged roster, and every level evolution lands inside 301-400',
    SN.every((e) => [...(e.evo ? [e.evo] : []), ...(e.evos || [])].every((v) => ALL[v.to] && (v.method !== 'level' || (v.level >= 301 && v.level <= 400)))));
  ok('S1-09 growth substitutions by name (nearest supported curve by level-100 total; erratic/fluctuating never assigned): cranidos/rampardos/shieldon/bastiodon/finneon/lumineon erratic->fast, drifloon/drifblim fluctuating->slow',
    ['cranidos', 'rampardos', 'shieldon', 'bastiodon', 'finneon', 'lumineon'].every((id) => SPECIES_SINNOH[id].growth === 'fast')
    && ['drifloon', 'drifblim'].every((id) => SPECIES_SINNOH[id].growth === 'slow')
    && SN.every((e) => e.growth !== 'erratic' && e.growth !== 'fluctuating'));
  const FORME_PIN = { rotomheat: [479, 'rotom', 'electric,fire'], rotomwash: [479, 'rotom', 'electric,water'], rotomfrost: [479, 'rotom', 'electric,ice'], rotomfan: [479, 'rotom', 'electric,flying'], rotommow: [479, 'rotom', 'electric,grass'], giratinaorigin: [487, 'giratina', 'ghost,dragon'], shayminsky: [492, 'shaymin', 'grass,flying'] };
  ok('S1-10 the 7 mission formes: partner-pattern entries sharing the base dexNo, form:true + baseSpecies set, canon forme types from their own PokeAPI records',
    Object.entries(FORME_PIN).every(([id, [dex, b, types]]) => { const e = SPECIES_SINNOH[id]; return e && e.form === true && e.baseSpecies === b && e.dexNo === dex && e.types.join() === types; }));
  ok('S1-11 formes are excluded from dex/diploma counts exactly like the shipped forms: 15 form:true entries total (5 shipped + 3 Deoxys + 7 S1), each sharing its dexNo with its base species; apart from the formes and the partner pair, no dexNo repeats',
    (() => { const forms = Object.values(ALL).filter((e) => e.form); if (forms.length !== 15) return false; const byDex = {}; for (const e of Object.values(ALL)) (byDex[e.dexNo] = byDex[e.dexNo] || []).push(e); return Object.entries(byDex).every(([dex, list]) => { const nf = list.filter((e) => !e.form).length; return nf === 1 || (+dex === 25 && nf === 2); }); })());
  ok('S1-12 band-shift pins: turtwig->grotle at 318 (canon 18 +300), starly->staravia 314, gible->gabite 324, gabite->garchomp 348',
    SPECIES_SINNOH.turtwig.evo.level === 318 && SPECIES_SINNOH.starly.evo.level === 314
    && SPECIES_SINNOH.gible.evo.level === 324 && SPECIES_SINNOH.gabite.evo.level === 348);
  ok('S1-13 the condition class (310 = band floor +9, the Hoenn happiness analogue): budew->roselia, chingling->chimecho, buneary->lopunny, riolu->lucario, munchlax->snorlax (happiness); bonsly->sudowoodo, mimejr->mrmime (mimic); happiny->chansey (oval stone); mantyke->mantine (remoraid party) — all level 310',
    [['budew', 'roselia'], ['chingling', 'chimecho'], ['buneary', 'lopunny'], ['riolu', 'lucario'], ['munchlax', 'snorlax'], ['bonsly', 'sudowoodo'], ['mimejr', 'mrmime'], ['happiny', 'chansey'], ['mantyke', 'mantine']]
      .every(([a, b]) => SPECIES_SINNOH[a].evo && SPECIES_SINNOH[a].evo.to === b && SPECIES_SINNOH[a].evo.level === 310));
  ok('S1-14 burmy branch (wurmple precedent): singular evo wormadam at 320 with BOTH branches in evos[]; combee->vespiquen plain level 321 (gender gate inexpressible, recorded)',
    SPECIES_SINNOH.burmy.evo.to === 'wormadam' && SPECIES_SINNOH.burmy.evo.level === 320
    && SPECIES_SINNOH.burmy.evos.length === 2 && SPECIES_SINNOH.burmy.evos[1].to === 'mothim'
    && SPECIES_SINNOH.combee.evo.to === 'vespiquen' && SPECIES_SINNOH.combee.evo.level === 321);
  ok('S1-15 cross-gen parents amended in their shipped files: magneton->magnezone 310, lickitung->lickilicky 310, tangela->tangrowth 310 (condition class); rhydon->rhyperior, electabuzz->electivire, magmar->magmortar, porygon2->porygonz, dusclops->dusknoir (held-item trades -> bare Link Transfer trades)',
    SP2.magneton.evo.to === 'magnezone' && SP2.magneton.evo.level === 310
    && SP2.lickitung.evo.to === 'lickilicky' && SP2.tangela.evo.to === 'tangrowth'
    && SP2.rhydon.evo.method === 'trade' && SP2.rhydon.evo.to === 'rhyperior'
    && SP2.electabuzz.evo.to === 'electivire' && SP2.magmar.evo.to === 'magmortar'
    && SP3.porygon2.evo.to === 'porygonz' && SP4.dusclops.evo.to === 'dusknoir');
  ok('S1-16 shipped-stone fallbacks + remaining parents: roselia->roserade sunstone, togetic->togekiss sunstone, murkrow->honchkrow moonstone, misdreavus->mismagius moonstone; kirlia evos carry the gallade sunstone branch beside gardevoir 230; snorunt evos carry the froslass sunstone branch beside glalie 242; sneasel->weavile / gligar->gliscor / piloswine->mamoswine / yanma->yanmega / aipom->ambipom / nosepass->probopass all level 310',
    SP4.roselia.evo.stone === 'sunstone' && SP3.togetic.evo.stone === 'sunstone'
    && SP3.murkrow.evo.stone === 'moonstone' && SP3.misdreavus.evo.stone === 'moonstone'
    && SP4.kirlia.evos.some((v) => v.to === 'gallade' && v.stone === 'sunstone') && SP4.kirlia.evo.to === 'gardevoir'
    && SP4.snorunt.evos.some((v) => v.to === 'froslass' && v.stone === 'sunstone') && SP4.snorunt.evo.to === 'glalie'
    && [['sneasel', 'weavile'], ['gligar', 'gliscor'], ['piloswine', 'mamoswine'], ['yanma', 'yanmega'], ['aipom', 'ambipom']].every(([a, b]) => SP3[a].evo.to === b && SP3[a].evo.level === 310)
    && SP4.nosepass.evo.to === 'probopass' && SP4.nosepass.evo.level === 310);
  ok('S1-17 eevee branches: the shipped evos[] gains leafeon (leafstone) and glaceon (level 310, Ice Rock class) beside the five shipped branches — seven branches, no singular evo invented',
    SP2.eevee.evo === undefined && SP2.eevee.evos.length === 7
    && SP2.eevee.evos.some((v) => v.to === 'leafeon' && v.stone === 'leafstone')
    && SP2.eevee.evos.some((v) => v.to === 'glaceon' && v.level === 310));
  ok('S1-18 Phione / Manaphy judgment calls ride the data: phione has NO evo and canon egg groups water1+fairy (breed-only obtainability, S6); manaphy has NO evo and keeps its canon water1+fairy egg groups (NOT no-eggs — it breeds Phione in canon and the shipped breeding system reads eggGroups)',
    !SPECIES_SINNOH.phione.evo && !SPECIES_SINNOH.phione.evos && SPECIES_SINNOH.phione.eggGroups.join() === 'water1,fairy'
    && !SPECIES_SINNOH.manaphy.evo && SPECIES_SINNOH.manaphy.eggGroups.join() === 'water1,fairy');
  ok('S1-19 babies flagged: budew, chingling, bonsly, mimejr, happiny, munchlax, riolu, mantyke carry baby:true (PokeAPI is_baby) for the breeding system',
    ['budew', 'chingling', 'bonsly', 'mimejr', 'happiny', 'munchlax', 'riolu', 'mantyke'].every((id) => SPECIES_SINNOH[id].baby === true));
  const tables = JSON.parse(readFileSync(join(ROOT, 'api/_lib/data/tables.json'), 'utf8'));
  ok('S1-20 server tables regenerated through gen-tables only: tables.json carries 509 species incl. all 114 Sinnoh ids (the validator + Cheat Terminal read from data, no dex ceiling)',
    tables.species.length === 509 && Object.keys(SPECIES_SINNOH).every((id) => tables.species.includes(id)));
}

// ================= Part S2a: species art, first half (Arc 4 Stage S2a) ======
// Dex 387-439 hand-authored through the shipped .pix pipeline
// (arc4-etl/gen-s2a-art.mjs -> build-art -> art-data.mjs): front +
// TRUE-REAR back + front/back idle-bobs for all 53, accent deltas for
// the 9 starter-line species (387-395). Census rig:
// arc4-etl/census-s2a.mjs (contact sheets visually inspected).
{
  const { ART } = await import(join(ROOT, 'assets/sprites/art-data.mjs'));
  const { SPECIES_SINNOH: SP5 } = await import(join(ROOT, 'src/data/species5.mjs'));
  const HALF = Object.values(SP5).filter((s) => s.dexNo >= 387 && s.dexNo <= 439).sort((a, b) => a.dexNo - b.dexNo);
  const materialize = (id) => {
    const a = ART[id]; if (!a) return null;
    if (a.rows) return a;
    if (a.shiftY) { const b = materialize(a.base); const rows = Array.from({ length: b.h }, () => '.'.repeat(b.w)); for (let y = 0; y < b.h - a.shiftY; y++) rows[y + a.shiftY] = b.rows[y]; return { ...b, rows }; }
    if (a.deltas) { const b = materialize(a.base); const rows = b.rows.map((r) => r.split('')); for (const [x, y, c] of a.deltas) rows[y][x] = c; return { w: b.w, h: b.h, pal: { ...b.pal, ...a.pal }, rows: rows.map((r) => r.join('')) }; }
    return null;
  };
  const painted = (id) => { const m = materialize(id); if (!m) return 0; let n = 0; for (const r of m.rows) for (const c of r) if (c !== '.') n++; return n; };
  ok('S2a-01 census population: exactly 53 species in dex 387-439 (turtwig 387 -> mimejr 439, dex order)',
    HALF.length === 53 && HALF[0].id === 'turtwig' && HALF[52].id === 'mimejr');
  ok('S2a-02 every one of the 53 resolves AUTHORED front+back from art-data (forge-fallback count for 387-439 = 0): full ART keys with rows, none blank (painted >= 400 each)',
    HALF.every((s) => painted(s.id + '-front') >= 400 && painted(s.id + '-back') >= 400),
    HALF.filter((s) => painted(s.id + '-front') < 400 || painted(s.id + '-back') < 400).map((s) => s.id).join(','));
  ok('S2a-03 backs are TRUE REARS, not mirrors: front row data != back row data for all 53',
    HALF.every((s) => materialize(s.id + '-front').rows.join('\n') !== materialize(s.id + '-back').rows.join('\n')));
  ok('S2a-04 idle-bobs shipped for all 53: front-bob + back-bob ART keys present (build-art derivation, the Johto/Hoenn pattern)',
    HALF.every((s) => ART[s.id + '-front-bob'] && ART[s.id + '-back-bob']));
  const STARTERS9 = ['turtwig', 'grotle', 'torterra', 'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon'];
  ok('S2a-05 starter-line accents (387-395): front-accent + back-accent deltas present for all 9, each a non-empty recolor delta over its base',
    STARTERS9.every((id) => ART[id + '-front-accent'] && ART[id + '-back-accent']
      && ART[id + '-front-accent'].deltas.length > 0 && ART[id + '-back-accent'].deltas.length > 0));
  ok('S2a-06 .pix sources on disk for all 53 pairs (assets/sprites/pix/species/<id>-front.pix + -back.pix) — art flows through the game pipeline, no parallel store',
    HALF.every((s) => { try { readFileSync(join(ROOT, 'assets/sprites/pix/species', s.id + '-front.pix'), 'utf8'); readFileSync(join(ROOT, 'assets/sprites/pix/species', s.id + '-back.pix'), 'utf8'); return true; } catch { return false; } }));
  ok('S2a-07 singular-design law: shellos/gastrodon carry ONE authored set each (no east/west form entries in species5 or ART); burmy/wormadam/mothim one set each',
    !SP5['shellos-east'] && !SP5['shellos-west'] && !ART['shellos-east-front'] && !ART['gastrodon-west-front']
    && painted('shellos-front') >= 400 && painted('gastrodon-front') >= 400
    && ['burmy', 'wormadam', 'mothim'].every((id) => painted(id + '-front') >= 400 && painted(id + '-back') >= 400));
  ok('S2a-08 palette discipline: every new frame paints 5-12 colours (cap 32) — the H2a envelope (5-11) held within one',
    HALF.every((s) => ['-front', '-back'].every((k) => { const m = materialize(s.id + k); const n = Object.keys(m.pal).length; return n >= 5 && n <= 12; })));
}

// ================= Part S2b: species art, second half (Arc 4 Stage S2b) ======
// Dex 440-493 (54 species) + the 7 forme entries (rotom-heat/wash/frost/
// fan/mow, giratina-origin, shaymin-sky) = 61 entries, hand-authored
// through the shipped .pix pipeline (arc4-etl/gen-s2b-art.mjs ->
// build-art -> art-data.mjs): front + TRUE-REAR back + front/back
// idle-bobs for all 61, accent deltas for the 9 marquee legendary
// entries. Census rig: arc4-etl/census-s2b.mjs (contact sheets
// visually inspected; roster-wide census over all 509 entries).
{
  const { ART } = await import(join(ROOT, 'assets/sprites/art-data.mjs'));
  const { SPECIES_SINNOH: SP5 } = await import(join(ROOT, 'src/data/species5.mjs'));
  const HALF = Object.values(SP5).filter((s) => s.dexNo >= 440).sort((a, b) => a.dexNo - b.dexNo || (a.id < b.id ? -1 : 1));
  const materialize = (id) => {
    const a = ART[id]; if (!a) return null;
    if (a.rows) return a;
    if (a.shiftY) { const b = materialize(a.base); const rows = Array.from({ length: b.h }, () => '.'.repeat(b.w)); for (let y = 0; y < b.h - a.shiftY; y++) rows[y + a.shiftY] = b.rows[y]; return { ...b, rows }; }
    if (a.deltas) { const b = materialize(a.base); const rows = b.rows.map((r) => r.split('')); for (const [x, y, c] of a.deltas) rows[y][x] = c; return { w: b.w, h: b.h, pal: { ...b.pal, ...a.pal }, rows: rows.map((r) => r.join('')) }; }
    return null;
  };
  const painted = (id) => { const m = materialize(id); if (!m) return 0; let n = 0; for (const r of m.rows) for (const c of r) if (c !== '.') n++; return n; };
  const cellDiff = (a, b) => { const A = materialize(a).rows, B = materialize(b).rows; let n = 0; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (A[y][x] !== B[y][x]) n++; return n; };
  ok('S2b-01 census population: exactly 61 entries in dex 440-493 + formes (happiny 440 -> arceus 493, incl. 7 forme entries)',
    HALF.length === 61 && HALF[0].id === 'happiny' && HALF.filter((s) => s.form).length === 7
    && ['rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow', 'giratinaorigin', 'shayminsky'].every((id) => HALF.some((s) => s.id === id)));
  ok('S2b-02 every one of the 61 resolves AUTHORED front+back from art-data (forge-fallback count for 440-493 + formes = 0): full ART keys with rows, none blank (painted >= 400 each)',
    HALF.every((s) => painted(s.id + '-front') >= 400 && painted(s.id + '-back') >= 400),
    HALF.filter((s) => painted(s.id + '-front') < 400 || painted(s.id + '-back') < 400).map((s) => s.id).join(','));
  ok('S2b-03 backs are TRUE REARS, not mirrors: front row data != back row data for all 61',
    HALF.every((s) => materialize(s.id + '-front').rows.join('\n') !== materialize(s.id + '-back').rows.join('\n')));
  ok('S2b-04 idle-bobs shipped for all 61: front-bob + back-bob ART keys present (build-art derivation, the Johto/Hoenn pattern)',
    HALF.every((s) => ART[s.id + '-front-bob'] && ART[s.id + '-back-bob']));
  const MARQUEE9 = ['dialga', 'palkia', 'giratina', 'giratinaorigin', 'cresselia', 'darkrai', 'shaymin', 'shayminsky', 'arceus'];
  ok('S2b-05 marquee legendary accents: front-accent + back-accent deltas present for all 9 (dialga, palkia, giratina both formes, cresselia, darkrai, shaymin both formes, arceus), each a non-empty recolor delta over its base',
    MARQUEE9.every((id) => ART[id + '-front-accent'] && ART[id + '-back-accent']
      && ART[id + '-front-accent'].deltas.length > 0 && ART[id + '-back-accent'].deltas.length > 0));
  ok('S2b-06 .pix sources on disk for all 61 pairs (assets/sprites/pix/species/<id>-front.pix + -back.pix) — art flows through the game pipeline, no parallel store',
    HALF.every((s) => { try { readFileSync(join(ROOT, 'assets/sprites/pix/species', s.id + '-front.pix'), 'utf8'); readFileSync(join(ROOT, 'assets/sprites/pix/species', s.id + '-back.pix'), 'utf8'); return true; } catch { return false; } }));
  ok('S2b-07 forme distinctness: giratina-origin is a DIFFERENT drawing from giratina-altered (front cells differ >= 800; serpentine, no legs) and shaymin-sky from shaymin-land (>= 800); the 5 rotom formes pairwise differ (>= 300 cells each pair — shared plasma core, distinct appliance bodies)',
    cellDiff('giratina-front', 'giratinaorigin-front') >= 800 && cellDiff('shaymin-front', 'shayminsky-front') >= 800
    && ['rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow'].every((a, i, arr) => arr.every((b, j) => j <= i || cellDiff(a + '-front', b + '-front') >= 300)));
  ok('S2b-08 palette discipline: every new frame paints 5-12 colours (cap 32) — the S2a envelope held',
    HALF.every((s) => ['-front', '-back'].every((k) => { const m = materialize(s.id + k); const n = Object.keys(m.pal).length; return n >= 5 && n <= 12; })));
  // Roster-wide: every entry in every species module resolves authored art.
  const mods = [];
  for (const f of ['species.mjs', 'species2.mjs', 'species3.mjs', 'species4.mjs', 'species5.mjs']) mods.push(await import(join(ROOT, 'src/data', f)));
  const roster = {};
  for (const mod of mods) for (const v of Object.values(mod)) if (v && typeof v === 'object') for (const [k, e] of Object.entries(v)) if (e && e.id && e.dexNo) roster[e.id] = e;
  const rosterList = Object.values(roster);
  ok('S2b-09 ROSTER-WIDE census: all 509 entries resolve authored front+back (forge-fallback count = 0 across the whole roster; Sinnoh species art complete)',
    rosterList.length === 509 && rosterList.every((s) => painted(s.id + '-front') > 0 && painted(s.id + '-back') > 0),
    rosterList.filter((s) => painted(s.id + '-front') === 0 || painted(s.id + '-back') === 0).map((s) => s.id).join(','));
}

// ================= Part S3a: maps, west/central (Arc 4 Stage S3a) ========
// maps9.mjs (gen: arc4-etl/gen_maps9.py): 62 maps — 10 settlements,
// 14 routes, 13 dungeons/places, 25 interiors. Full walking sweep /
// richness / encounter audit rigs: arc4-etl/sinnoh-{sweep,richness,
// enc-audit}.mjs; this section pins the load-bearing facts in-suite.
{
  const { MAPS9 } = await import(join(ROOT, 'src/data/maps9.mjs'));
  const TOWNS9 = ['twinleaf', 'sandgem', 'jubilife', 'oreburgh', 'floaroma', 'eterna', 'hearthome', 'solaceon', 'veilstone', 'canalave'];
  const ROUTES9 = ['r201', 'r202', 'r203', 'r204', 'r205', 'r206', 'r207', 'r208', 'r209', 'r210', 'r211', 'r212', 'r215', 'r218'];
  const PLACES9 = ['lake-verity', 'lake-verity-cave', 'oreburgh-mine', 'ravaged-path', 'valley-windworks', 'eterna-forest', 'old-chateau', 'wayward-cave', 'mt-coronet-south', 'mt-coronet-central', 'solaceon-ruins', 'lost-tower', 'amity-square'];
  const INTERIORS9 = ['house-twinleaf', 'house-twinleaf-rival', 'house-sandgem', 'house-jubilife', 'house-jubilife-condo', 'house-oreburgh', 'house-floaroma', 'house-eterna', 'house-hearthome', 'house-hearthome-poffin', 'house-solaceon', 'house-solaceon-daycare', 'house-veilstone', 'house-canalave', 'canalave-library', 'rowan-lab', 'jubilife-tv', 'galactic-eterna', 'galactic-hq', 'gym-oreburgh', 'gym-eterna', 'gym-hearthome', 'gym-veilstone', 'gym-canalave', 'contest-hearthome'];
  const ALL9 = [...TOWNS9, ...ROUTES9, ...PLACES9, ...INTERIORS9];
  ok('S3a-01 maps9 accounting (S3b supersession — the total count moved to S3b-01 when maps9 grew to 139; this check now scopes to the S3a set): the 62 S3a maps (10 settlements + 14 routes + 13 dungeons/places + 25 interiors) are all present exactly once, rows rectangular across all of maps9',
    ALL9.length === 62 && ALL9.every((id) => MAPS9[id] && MAPS9[id].id === id)
    && Object.values(MAPS9).every((m) => m.rows.every((r) => r.length === m.rows[0].length)),
    'count=' + Object.keys(MAPS9).length + ' missing=' + ALL9.filter((id) => !MAPS9[id]).join(','));
  ok('S3a-02 viewport law: every settlement outdoor map is authored >= 24 wide x >= 14 tall (the standing new-region viewport-filling law)',
    TOWNS9.every((id) => MAPS9[id].rows[0].length >= 24 && MAPS9[id].rows.length >= 14),
    TOWNS9.filter((id) => MAPS9[id].rows[0].length < 24 || MAPS9[id].rows.length < 14).join(','));
  ok('S3a-03 every settlement fields a Pokemon Center + Mart through the shared interiors WITH via{} tickets (lastCenter lineage, the Johto/Hoenn idiom)',
    TOWNS9.every((id) => ['center', 'mart'].every((t) => (MAPS9[id].warps || []).some((w) => w.to.map === t && w.via && w.via.map === id))));
  ok('S3a-04 story places exist as maps: rowan-lab (Sandgem), gyms for oreburgh/eterna/hearthome/veilstone/canalave, contest-hearthome with contestHall field, galactic-eterna + galactic-hq, canalave-library, jubilife-tv — all indoor, all with a return warp to their town',
    ['rowan-lab', 'gym-oreburgh', 'gym-eterna', 'gym-hearthome', 'gym-veilstone', 'gym-canalave', 'contest-hearthome', 'galactic-eterna', 'galactic-hq', 'canalave-library', 'jubilife-tv']
      .every((id) => MAPS9[id] && MAPS9[id].indoor === true && (MAPS9[id].warps || []).length >= 2)
    && MAPS9['contest-hearthome'].contestHall === 'hearthome');
  ok('S3a-05 warp integrity: every maps9 warp target exists in the merged map set and lands on a walkable (or water) tile — zero bad landings in data',
    Object.values(MAPS9).every((m) => (m.warps || []).every((w) => {
      const d = ALL_MAPS[w.to.map];
      if (!d) return false;
      const ch = d.rows[w.to.y] && d.rows[w.to.y][w.to.x];
      return ch !== undefined && (WALKABLE.has(ch) || ch === '~' || ch === 'W');
    })));
  // map-graph reachability from sandgem (warps + ferry jumps), the
  // in-suite mirror of the arc4-etl walking sweep's graph check
  const adj = {};
  for (const m of Object.values(ALL_MAPS)) {
    adj[m.id] = adj[m.id] || new Set();
    for (const w of m.warps || []) if (w.to && ALL_MAPS[w.to.map]) adj[m.id].add(w.to.map);
    for (const n of m.npcs || []) if (n.ferry && ALL_MAPS[n.ferry]) adj[m.id].add(n.ferry);
  }
  const seen9 = new Set(['sandgem']); const q9 = ['sandgem'];
  while (q9.length) { const c = q9.shift(); for (const nx of adj[c] || []) if (!seen9.has(nx)) { seen9.add(nx); q9.push(nx); } }
  ok('S3a-06 fresh-game reachability: the map graph from sandgem (the registry arrivalMap, present in maps9 with a start tile) reaches all 62 new maps — the whole west/central half is walkable end-to-end from the arrival port',
    !!MAPS9.sandgem && !!MAPS9.sandgem.start && ALL9.every((id) => seen9.has(id)),
    'unreached=' + ALL9.filter((id) => !seen9.has(id)).join(','));
  const roster9 = {};
  for (const f of ['species.mjs', 'species2.mjs', 'species3.mjs', 'species4.mjs', 'species5.mjs']) {
    const mod = await import(join(ROOT, 'src/data', f));
    for (const v of Object.values(mod)) if (v && typeof v === 'object') Object.assign(roster9, v);
  }
  const LEG9 = new Set(['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew', 'raikou', 'entei', 'suicune', 'lugia', 'hooh', 'celebi', 'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys', 'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'giratinaorigin', 'cresselia', 'phione', 'manaphy', 'darkrai', 'shaymin', 'shayminsky', 'arceus', 'rotom', 'rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow', 'spiritomb']);
  const START9 = new Set(['turtwig', 'grotle', 'torterra', 'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon']);
  let encEntries = 0, encLo = 999, encHi = 0, encBad = [];
  for (const m of ALL9.map((id) => MAPS9[id])) {
    if (!m.encounters) continue;
    for (const t of [...(m.encounters.table || []), ...(m.encounters.water || [])]) {
      encEntries++;
      encLo = Math.min(encLo, t.min); encHi = Math.max(encHi, t.max);
      if (!roster9[t.species] || LEG9.has(t.species) || START9.has(t.species) || t.min < 301 || t.max > 400 || t.min > t.max || !(t.weight > 0)) encBad.push(m.id + ':' + t.species);
    }
  }
  ok('S3a-07 encounter audit in-suite (S3b supersession — scoped to the S3a map set; the S3b tables are audited in S3b-07): 289 entries across the S3a maps9 tables — every species exists in the merged roster, every level inside band 301-400, no legendaries, no starter lines, no Rotom, no Spiritomb placed wild',
    encEntries === 289 && encBad.length === 0 && encLo === 301 && encHi <= 345,
    'entries=' + encEntries + ' span=' + encLo + '-' + encHi + ' bad=' + encBad.join(','));
  const tab9 = (id) => (MAPS9[id].encounters && MAPS9[id].encounters.table) || [];
  ok('S3a-08 deferred placements discharged: Mothim is wild in eterna-forest (w6, 320-326) and on r205 (w4) — the honey-tree country; Drifloon rides r205 (the windworks ground); Gible nests in wayward-cave; Spiritomb appears in NO maps9 table (S6 summoning decision)',
    (() => { const f = tab9('eterna-forest').find((t) => t.species === 'mothim'); const r = tab9('r205').find((t) => t.species === 'mothim');
      return f && f.weight === 6 && r && r.weight === 4; })()
    && tab9('r205').some((t) => t.species === 'drifloon')
    && tab9('wayward-cave').some((t) => t.species === 'gible')
    && Object.values(MAPS9).every((m) => !m.encounters || [...(m.encounters.table || []), ...(m.encounters.water || [])].every((t) => t.species !== 'spiritomb')));
  const captW = (MAPS9.canalave.npcs || []).find((n) => n.ferry);
  ok('S3a-09 Canalave ferry port: CAPT WESTWIND stands on canalave with ferry vermilion + ferryArc sinnoh (the Olivine/Slateport port idiom — return unconditional once reached)',
    !!captW && captW.name === 'CAPT WESTWIND' && captW.ferry === 'vermilion' && captW.ferryArc === 'sinnoh');
  ok('S3a-10 Mt. Coronet spine: mt-coronet-south doors to r207 (west), r208 (south) and mt-coronet-central (north); the central cavern doors back south and west to r211, and carries >= 2 internal stair warps (lower hall <-> upper gallery) — the two-storey floor graph S3b extends at the gallery north wall',
    ['r207', 'r208', 'mt-coronet-central'].every((t) => (MAPS9['mt-coronet-south'].warps || []).some((w) => w.to.map === t))
    && ['mt-coronet-south', 'r211'].every((t) => (MAPS9['mt-coronet-central'].warps || []).some((w) => w.to.map === t))
    && (MAPS9['mt-coronet-central'].warps || []).filter((w) => w.to.map === 'mt-coronet-central').length >= 2);
  ok('S3a-11 Old Chateau: the Rotom room exists as a place (the television sign in old-chateau) while Rotom itself is placed nowhere wild (its forme system lands S4)',
    (MAPS9['old-chateau'].signs || []).some((s) => s.text.includes('television')));
  ok('S3a-12 Route 212 (S3b supersession — the S3a fence is OPEN: r212 remains the NORTH segment, its warps now reach hearthome AND r212-south, the Pastoria leg S3a signed as future work; the sign was reworded to say the road runs on)',
    (MAPS9.r212.warps || []).length > 0 && (MAPS9.r212.warps || []).every((w) => ['hearthome', 'r212-south'].includes(w.to.map))
    && (MAPS9.r212.warps || []).some((w) => w.to.map === 'r212-south')
    && (MAPS9.r212.signs || []).some((s) => s.text.includes('212') && s.text.includes('Pastoria')));
  const tiles9 = await import(join(ROOT, 'src/engine/tiles.mjs'));
  ok('S3a-13 Sinnoh tile identity: SINNOH_TOWN_ORDER reserves all 14 settlements; the 10 S3a towns each own 8 distinct signature chars (tg/tg2/tc/td/tr/tl/th/tw at U+1E00 idx 412+i*8) registered in TILE_CHARS, and the tg/tg2 ground chars + the 3 S3 floor kinds are in the engine WALKABLE set',
    tiles9.SINNOH_TOWN_ORDER.length === 14
    && TOWNS9.every((id, i) => ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'].every((sfx, j) =>
      tiles9.SINNOH_TOWN_CHARS[id][sfx] === String.fromCodePoint(0x1E00 + 412 + i * 8 + j)
      && tiles9.TILE_CHARS[tiles9.SINNOH_TOWN_CHARS[id][sfx]] === sfx + '-' + id))
    && TOWNS9.every((id) => WALKABLE.has(tiles9.SINNOH_TOWN_CHARS[id].tg) && WALKABLE.has(tiles9.SINNOH_TOWN_CHARS[id].tg2))
    && tiles9.S3_FLOOR_KINDS.length === 3 && tiles9.S3_FLOOR_KINDS.every((k) => WALKABLE.has(tiles9.S3_KIND_CHARS[k])));
  const { ART: ART9 } = await import(join(ROOT, 'assets/sprites/art-data.mjs'));
  ok('S3a-14 authored tile art resolves for all 10 towns x 8 identity tiles + the 8 S3 kinds (88 .pix tiles through build-art; no forge fallbacks for the Sinnoh kinds)',
    TOWNS9.every((id) => ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'].every((sfx) => ART9['tile-' + sfx + '-' + id] && ART9['tile-' + sfx + '-' + id].rows))
    && ['flowerfield', 'harbourstone', 'coronetfloor', 'coronetrock'].every((k) => ART9['tile-' + k] && ART9['tile-' + k].rows)
    && ['honeytree', 'windmill', 'ironarch', 'contestdome'].every((k) => ART9['tile-prop-' + k] && ART9['tile-prop-' + k].rows));
  ok('S3a-15 weather law: every outdoor maps9 map declares a weather field; every interior maps9 map is indoor:true (and no interior declares weather)',
    [...TOWNS9, ...ROUTES9, 'lake-verity', 'eterna-forest', 'amity-square'].every((id) => typeof MAPS9[id].weather === 'string')
    && INTERIORS9.every((id) => MAPS9[id].indoor === true && MAPS9[id].weather === undefined)
    && PLACES9.filter((id) => !['lake-verity', 'eterna-forest', 'amity-square'].includes(id)).every((id) => MAPS9[id].indoor === true));
}


// ================= Part S3b: maps, east/north + Distortion World ========
// maps9.mjs grows 62 -> 139 (gen: arc4-etl/gen_maps9.py S3b section):
// the 4 remaining settlements + the League, 20 routes, the Battle
// Zone, the remaining lakes/dungeons, and the Distortion World set.
// Full walking sweep / richness / encounter rigs: arc4-etl/sinnoh-
// {sweep,richness,enc-audit}.mjs (scope = all of MAPS9).
{
  const { MAPS9 } = await import(join(ROOT, 'src/data/maps9.mjs'));
  const TOWNS9B = ['pastoria', 'celestic', 'snowpoint', 'sunnyshore'];
  const LITE9B = ['fight-area', 'survival-area', 'resort-area'];
  const ROUTES9B = ['r212-south', 'r210-north', 'r213', 'r214', 'spring-path', 'r216', 'r217', 'r219', 'r220', 'r221', 'r222', 'r223', 'r224', 'seabreak-path', 'r225', 'r226', 'r227', 'r228', 'r229', 'r230'];
  const PLACES9B = ['pokemon-league', 'lake-valor', 'lake-valor-cave', 'lake-acuity', 'lake-acuity-cave', 'sendoff-spring', 'turnback-cave', 'great-marsh-gate', 'great-marsh-west', 'great-marsh-east', 'great-marsh-north', 'mt-coronet-north', 'spear-pillar', 'hall-of-origin', 'iron-island', 'iron-island-mine', 'stark-mountain', 'stark-interior', 'victory-road', 'fuego-ironworks', 'fullmoon-island', 'newmoon-island', 'flower-paradise'];
  const DW9B = ['distortion-entrance', 'distortion-depths', 'distortion-isles', 'distortion-falls', 'distortion-abyss', 'distortion-platform'];
  const INTERIORS9B = ['house-pastoria', 'house-celestic', 'house-snowpoint', 'house-sunnyshore', 'house-fight', 'house-survival', 'house-resort', 'house-resort-villa', 'gym-pastoria', 'gym-snowpoint', 'gym-sunnyshore', 'celestic-shrine', 'snowpoint-temple', 'snowpoint-temple-depths', 'sunnyshore-lighthouse', 'league-lobby', 'league-chamber-1', 'league-chamber-2', 'league-chamber-3', 'league-chamber-4', 'league-champion'];
  const NEW9B = [...TOWNS9B, ...LITE9B, ...ROUTES9B, ...PLACES9B, ...DW9B, ...INTERIORS9B];
  ok('S3b-01 maps9 accounting: exactly 139 maps (62 S3a + 77 S3b: 4 settlements + League + 3 Battle Zone lite areas, 20 routes, 23 dungeons/places, the 6-map Distortion World, 21 interiors), every expected S3b id present exactly once',
    Object.keys(MAPS9).length === 139 && NEW9B.length === 77 && NEW9B.every((id) => MAPS9[id] && MAPS9[id].id === id),
    'count=' + Object.keys(MAPS9).length + ' missing=' + NEW9B.filter((id) => !MAPS9[id]).join(','));
  ok('S3b-02 viewport law: every S3b settlement outdoor map (4 towns + the League exterior + the 3 lite areas) is authored >= 24 wide x >= 14 tall',
    [...TOWNS9B, 'pokemon-league', ...LITE9B].every((id) => MAPS9[id].rows[0].length >= 24 && MAPS9[id].rows.length >= 14),
    [...TOWNS9B, 'pokemon-league', ...LITE9B].filter((id) => MAPS9[id].rows[0].length < 24 || MAPS9[id].rows.length < 14).join(','));
  ok('S3b-03 every S3b settlement + lite area fields a Pokemon Center + Mart through the shared interiors WITH via{} tickets (the Johto/Hoenn idiom, the lite areas included)',
    [...TOWNS9B, ...LITE9B].every((id) => ['center', 'mart'].every((t) => (MAPS9[id].warps || []).some((w) => w.to.map === t && w.via && w.via.map === id))));
  ok('S3b-04 story places exist as maps: gym-pastoria/gym-snowpoint/gym-sunnyshore (layouts only), celestic-shrine, snowpoint-temple + its depths, sunnyshore-lighthouse, the Great Marsh gatehouse — all indoor, all with a return warp',
    ['gym-pastoria', 'gym-snowpoint', 'gym-sunnyshore', 'celestic-shrine', 'snowpoint-temple', 'snowpoint-temple-depths', 'sunnyshore-lighthouse', 'great-marsh-gate']
      .every((id) => MAPS9[id] && MAPS9[id].indoor === true && (MAPS9[id].warps || []).length >= 2));
  ok('S3b-05 warp integrity (S3b maps): every warp target exists in the merged map set and lands on a walkable (or water) tile — zero bad landings in data',
    NEW9B.every((id) => (MAPS9[id].warps || []).every((w) => {
      const d = ALL_MAPS[w.to.map];
      if (!d) return false;
      const ch = d.rows[w.to.y] && d.rows[w.to.y][w.to.x];
      return ch !== undefined && (WALKABLE.has(ch) || ch === '~' || ch === 'W');
    })));
  const adjB = {};
  for (const m of Object.values(ALL_MAPS)) {
    adjB[m.id] = adjB[m.id] || new Set();
    for (const w of m.warps || []) if (w.to && ALL_MAPS[w.to.map]) adjB[m.id].add(w.to.map);
    for (const n of m.npcs || []) if (n.ferry && ALL_MAPS[n.ferry]) adjB[m.id].add(n.ferry);
  }
  const seenB = new Set(['sandgem']); const qB = ['sandgem'];
  while (qB.length) { const c = qB.shift(); for (const nx of adjB[c] || []) if (!seenB.has(nx)) { seenB.add(nx); qB.push(nx); } }
  ok('S3b-06 fresh-game reachability: the map graph from sandgem reaches ALL 139 maps9 maps — Sinnoh is walkable end-to-end (the Coronet seam, the Battle Zone ferry, the Turnback portal included)',
    Object.keys(MAPS9).every((id) => seenB.has(id)),
    'unreached=' + Object.keys(MAPS9).filter((id) => !seenB.has(id)).join(','));
  const rosterB = {};
  for (const f of ['species.mjs', 'species2.mjs', 'species3.mjs', 'species4.mjs', 'species5.mjs']) {
    const mod = await import(join(ROOT, 'src/data', f));
    for (const v of Object.values(mod)) if (v && typeof v === 'object') Object.assign(rosterB, v);
  }
  const LEG9B = new Set(['articuno', 'zapdos', 'moltres', 'mewtwo', 'mew', 'raikou', 'entei', 'suicune', 'lugia', 'hooh', 'celebi', 'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys', 'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'giratinaorigin', 'cresselia', 'phione', 'manaphy', 'darkrai', 'shaymin', 'shayminsky', 'arceus', 'rotom', 'rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow', 'spiritomb']);
  const START9B = new Set(['turtwig', 'grotle', 'torterra', 'chimchar', 'monferno', 'infernape', 'piplup', 'prinplup', 'empoleon']);
  let encB = 0, encBLo = 999, encBHi = 0, encBBad = [];
  for (const id of NEW9B) {
    const m = MAPS9[id];
    if (!m.encounters) continue;
    for (const t of [...(m.encounters.table || []), ...(m.encounters.water || [])]) {
      encB++;
      encBLo = Math.min(encBLo, t.min); encBHi = Math.max(encBHi, t.max);
      if (!rosterB[t.species] || LEG9B.has(t.species) || START9B.has(t.species) || t.min < 301 || t.max > 400 || t.min > t.max || !(t.weight > 0)) encBBad.push(id + ':' + t.species);
    }
  }
  ok('S3b-07 encounter audit in-suite: 484 entries across the S3b tables — every species exists in the merged roster, levels inside band 301-400 scaled to progression (span 336-400: Pastoria country opens the 340s, the Battle Zone + Stark Mountain sit at the 388-400 cap), no legendaries, no starter lines, no Rotom, no Spiritomb, no lake trio placed wild',
    encB === 484 && encBBad.length === 0 && encBLo === 336 && encBHi === 400,
    'entries=' + encB + ' span=' + encBLo + '-' + encBHi + ' bad=' + encBBad.join(','));
  ok('S3b-08 the Coronet seam CONNECTS: mt-coronet-central warps north at its gallery wall (row 0, cols 13-14) to mt-coronet-north; the north cavern warps back south, north to spear-pillar, and east to r216; spear-pillar warps south back and north up to hall-of-origin',
    [13, 14].every((x) => (MAPS9['mt-coronet-central'].warps || []).some((w) => w.x === x && w.y === 0 && w.to.map === 'mt-coronet-north'))
    && ['mt-coronet-central', 'spear-pillar', 'r216'].every((t) => (MAPS9['mt-coronet-north'].warps || []).some((w) => w.to.map === t))
    && (MAPS9['spear-pillar'].warps || []).some((w) => w.to.map === 'hall-of-origin')
    && (MAPS9['hall-of-origin'].warps || []).every((w) => w.to.map === 'spear-pillar'));
  const tilesB = await import(join(ROOT, 'src/engine/tiles.mjs'));
  const climbCh = tilesB.S3B_KIND_CHARS.climbwall;
  ok('S3b-09 fog + climb geography authored (systems land S4): r210-north carries weather fog (the field src/game/weather.mjs reads, the diveSpots precedent); climbwall gate tiles (TILE_CHARS kind climbwall) stand on r217, in victory-road, and in mt-coronet-north — each beside an ungated through-road',
    MAPS9['r210-north'].weather === 'fog' && tilesB.TILE_CHARS[climbCh] === 'climbwall'
    && ['r217', 'victory-road', 'mt-coronet-north'].every((id) => MAPS9[id].rows.some((r) => r.includes(climbCh))));
  const dwSeen = new Set(['distortion-entrance']); const dwQ = ['distortion-entrance'];
  while (dwQ.length) { const c = dwQ.shift(); for (const w of MAPS9[c].warps || []) if (DW9B.includes(w.to.map) && !dwSeen.has(w.to.map)) { dwSeen.add(w.to.map); dwQ.push(w.to.map); } }
  ok('S3b-10 THE DISTORTION WORLD: all 6 maps carry distortion:true (the S5 tint/weather hook) + indoor:true; the warp graph walks entrance -> depths -> isles -> falls -> abyss -> platform; the platform carries the return portal to the entrance; the entrance portals back to turnback-cave (no soft lock: every DW map has a warp out)',
    DW9B.every((id) => MAPS9[id].distortion === true && MAPS9[id].indoor === true && (MAPS9[id].warps || []).length >= 2)
    && dwSeen.size === 6
    && (MAPS9['distortion-platform'].warps || []).some((w) => w.to.map === 'distortion-entrance')
    && (MAPS9['distortion-entrance'].warps || []).some((w) => w.to.map === 'turnback-cave')
    && (MAPS9['turnback-cave'].warps || []).some((w) => w.to.map === 'distortion-entrance'));
  ok('S3b-11 the Great Marsh is a playable place set: great-marsh-gate stands in Pastoria (a warp from pastoria) and chains gate -> west -> east -> north; the three marsh maps are outdoor rain maps with bog tables (the Safari reskin lands S4, the PLACE is S3b)',
    (MAPS9.pastoria.warps || []).some((w) => w.to.map === 'great-marsh-gate')
    && (MAPS9['great-marsh-gate'].warps || []).some((w) => w.to.map === 'great-marsh-west')
    && (MAPS9['great-marsh-west'].warps || []).some((w) => w.to.map === 'great-marsh-east')
    && (MAPS9['great-marsh-east'].warps || []).some((w) => w.to.map === 'great-marsh-north')
    && ['great-marsh-west', 'great-marsh-east', 'great-marsh-north'].every((id) => MAPS9[id].weather === 'rain' && MAPS9[id].encounters));
  const ferryTo = (mid, name) => { const n = (MAPS9[mid].npcs || []).find((x) => x.name === name); return n && n.ferry; };
  ok('S3b-12 the boat web (plain ferry NPCs, the shipped intra-region idiom): Snowpoint CAPT NORTHSTAR <-> Fight Area (ferry fight-area / snowpoint); Canalave SAILOR BRINE -> iron-island and SAILOR LUNA -> fullmoon-island; Iron Island + Fullmoon sailors ferry back to canalave; Fullmoon MOON BOATMAN REED <-> Newmoon',
    ferryTo('snowpoint', 'CAPT NORTHSTAR') === 'fight-area' && ferryTo('fight-area', 'CAPT NORTHSTAR') === 'snowpoint'
    && ferryTo('canalave', 'SAILOR BRINE') === 'iron-island' && ferryTo('canalave', 'SAILOR LUNA') === 'fullmoon-island'
    && ferryTo('iron-island', 'SAILOR BRINE') === 'canalave'
    && ferryTo('fullmoon-island', 'SAILOR LUNA') === 'canalave' && ferryTo('fullmoon-island', 'MOON BOATMAN REED') === 'newmoon-island'
    && ferryTo('newmoon-island', 'MOON BOATMAN REED') === 'fullmoon-island');
  const { ART: ARTB } = await import(join(ROOT, 'assets/sprites/art-data.mjs'));
  ok('S3b-13 east-town tile identity: pastoria/celestic/snowpoint/sunnyshore each own their 8 signature chars at U+1E00 idx 492+i*8 in TILE_CHARS, their tg/tg2 ground chars are in WALKABLE, and all 32 identity tiles + the 8 S3B kinds resolve authored art (no forge fallbacks)',
    TOWNS9B.every((id, k) => ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'].every((sfx, j) =>
      tilesB.SINNOH_TOWN_CHARS[id][sfx] === String.fromCodePoint(0x1E00 + 492 + k * 8 + j)
      && tilesB.TILE_CHARS[tilesB.SINNOH_TOWN_CHARS[id][sfx]] === sfx + '-' + id))
    && TOWNS9B.every((id) => WALKABLE.has(tilesB.SINNOH_TOWN_CHARS[id].tg) && WALKABLE.has(tilesB.SINNOH_TOWN_CHARS[id].tg2))
    && TOWNS9B.every((id) => ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'].every((sfx) => ARTB['tile-' + sfx + '-' + id] && ARTB['tile-' + sfx + '-' + id].rows))
    && ['marshbog', 'distortfloor', 'distortfalls', 'climbwall', 'distortrock'].every((k) => ARTB['tile-' + k] && ARTB['tile-' + k].rows)
    && ['marshreed', 'solarpanel', 'originstone'].every((k) => ARTB['tile-prop-' + k] && ARTB['tile-prop-' + k].rows)
    && tilesB.S3B_FLOOR_KINDS.every((k) => WALKABLE.has(tilesB.S3B_KIND_CHARS[k])));
  ok('S3b-14 weather law (S3b): every outdoor S3b map declares a weather field; every S3b interior is indoor:true with no weather field; the fog segment is the only fog map',
    [...TOWNS9B, ...LITE9B, ...ROUTES9B, ...PLACES9B.filter((id) => MAPS9[id].indoor !== true)].every((id) => typeof MAPS9[id].weather === 'string')
    && INTERIORS9B.every((id) => MAPS9[id].indoor === true && MAPS9[id].weather === undefined)
    && Object.values(MAPS9).filter((m) => m.weather === 'fog').length === 1);
  ok('S3b-15 the League chain + the gated-event places: league-lobby -> chamber-1 -> chamber-2 -> chamber-3 -> chamber-4 -> league-champion warp chain is complete (battles are S5); flower-paradise is walkable from seabreak-path (S6 gates its event); turnback-cave carries the Griseous chamber sign (S4 wires the orb switch)',
    (MAPS9['league-lobby'].warps || []).some((w) => w.to.map === 'league-chamber-1')
    && ['league-chamber-1', 'league-chamber-2', 'league-chamber-3'].every((id, i) => (MAPS9[id].warps || []).some((w) => w.to.map === 'league-chamber-' + (i + 2)))
    && (MAPS9['league-chamber-4'].warps || []).some((w) => w.to.map === 'league-champion')
    && (MAPS9['flower-paradise'].warps || []).some((w) => w.to.map === 'seabreak-path')
    && (MAPS9['turnback-cave'].signs || []).some((s) => s.text.includes('GRISEOUS')));
  ok('S3b-16 the Battle Zone closes: r225 fight-area <-> survival-area, r226 survival -> resort-area, r227 resort -> stark-mountain -> stark-interior, and the r228 desert + r229/r230 coast water complete the island loop back to fight-area',
    (MAPS9['r225'].warps || []).some((w) => w.to.map === 'fight-area') && (MAPS9['r225'].warps || []).some((w) => w.to.map === 'survival-area')
    && (MAPS9['r226'].warps || []).some((w) => w.to.map === 'resort-area')
    && (MAPS9['r227'].warps || []).some((w) => w.to.map === 'stark-mountain')
    && (MAPS9['stark-mountain'].warps || []).some((w) => w.to.map === 'stark-interior')
    && (MAPS9['r228'].warps || []).every((w) => w.to.map === 'resort-area')
    && (MAPS9['r230'].warps || []).some((w) => w.to.map === 'fight-area'));
}

// ================= Part S4: systems (Arc 4 Stage S4) =================
// Defog + Rock Climb HMs, the Great Marsh Safari reskin, Super
// Contests, and the Giratina/Shaymin/Rotom forme switch. Part A:
// pure units (data, weather resolver, gates, safari config, contest
// ranks, the forme swap + both validators over all 7 formes, the
// no-retro-gate scan). Part B (bundle, below): true-path drives.
{
  const { HM_MOVES, HM_GRANTS } = await import(join(ROOT, 'src/data/items.mjs'));
  const { MOVES: MV1B } = await import(join(ROOT, 'src/data/moves.mjs'));
  const { MOVES2: MV2B } = await import(join(ROOT, 'src/data/moves2.mjs'));
  const ALLMV = { ...MV1B, ...MV2B };
  const { weatherForMap, WEATHER_KINDS } = await import(join(ROOT, 'src/game/weather.mjs'));
  const SYS = await import(join(ROOT, 'src/game/sinnoh-systems.mjs'));
  const { makeMon: mkMon } = await import(join(ROOT, 'src/game/state.mjs'));
  const rosterS4 = {};
  for (const f of ['species.mjs', 'species2.mjs', 'species3.mjs', 'species4.mjs', 'species5.mjs']) {
    const mod = await import(join(ROOT, 'src/data', f));
    for (const v of Object.values(mod)) if (v && typeof v === 'object') Object.assign(rosterS4, v);
  }
  ok('S4-01 HM data: HM_MOVES continues the shipped sequence (6 defog, 7 rockclimb); ITEMS hm06/hm07 are hm-pocket rows teaching the moves; both moves are real battle moves (defog flying status eva-1 PP15, rockclimb normal 90/85 PP20 confusion 20%)',
    HM_MOVES[6] === 'defog' && HM_MOVES[7] === 'rockclimb'
    && ITEMS.hm06.pocket === 'hm' && ITEMS.hm06.move === 'defog' && ITEMS.hm07.pocket === 'hm' && ITEMS.hm07.move === 'rockclimb'
    && ALLMV.defog.type === 'flying' && ALLMV.defog.cat === 'status' && ALLMV.defog.effect.eva === -1 && ALLMV.defog.pp === 15
    && ALLMV.rockclimb.power === 90 && ALLMV.rockclimb.acc === 85 && ALLMV.rockclimb.pp === 20 && ALLMV.rockclimb.effect.status === 'confusion');
  ok('S4-02 grant hooks as data (HM_GRANTS, the table S5 calls): defog -> hm06 gated on fenbadge from the Solaceon Ruins (Platinum); rockclimb -> hm07 gated on iciclebadge from Route 217 (Platinum); the Gracidea is a key-pocket item',
    HM_GRANTS.defog.item === 'hm06' && HM_GRANTS.defog.badge === 'fenbadge' && HM_GRANTS.defog.source.includes('Solaceon')
    && HM_GRANTS.rockclimb.item === 'hm07' && HM_GRANTS.rockclimb.badge === 'iciclebadge' && HM_GRANTS.rockclimb.source.includes('217')
    && ITEMS.gracidea.pocket === 'key');
  const fogMap = ALL_MAPS['r210-north'];
  const fogState = (cleared) => { const s = clone(defaultState()); if (cleared) s.story.flags['defogged_r210-north'] = true; return s; };
  ok('S4-03 fog weather: WEATHER_KINDS carries fog; r210-north resolves fog from its map field; with the per-map defogged flag it resolves clear (source defog); a Kanto map under the same flags is untouched (clear/none)',
    WEATHER_KINDS.includes('fog')
    && weatherForMap(fogState(false), fogMap).kind === 'fog'
    && weatherForMap(fogState(true), fogMap).kind === 'clear' && weatherForMap(fogState(true), fogMap).source === 'defog'
    && weatherForMap(fogState(true), ALL_MAPS.pallet).kind === 'clear' && weatherForMap(fogState(true), ALL_MAPS.pallet).source === 'none');
  ok('S4-04 field gates are generic reads: badgeHeld finds a badge in ANY set (a hoenn-set fenbadge-shaped read works — the read names no region); partyKnowsFieldMove reads a move slot OR the hmMoves field-craft list (the Dive representation)',
    SYS.badgeHeld({ badges: { hoenn: ['fenbadge'] } }, 'fenbadge') === true
    && SYS.badgeHeld({ badges: { sinnoh: ['coalbadge'] } }, 'fenbadge') === false
    && SYS.partyKnowsFieldMove([{ moves: [{ id: 'defog' }], hmMoves: [] }], 'defog') === true
    && SYS.partyKnowsFieldMove([{ moves: [], hmMoves: ['rockclimb'] }], 'rockclimb') === true
    && SYS.partyKnowsFieldMove([{ moves: [{ id: 'surf' }], hmMoves: [] }], 'defog') === false);
  const { MAPS9: M9S4 } = await import(join(ROOT, 'src/data/maps9.mjs'));
  const warden = (M9S4['great-marsh-gate'].npcs || []).find((n) => n.name === 'MARSH WARDEN IO');
  ok('S4-05 Marsh reskin is DATA: the three marsh maps carry safariZone great-marsh, the gatehouse carries safariHub, and the warden plants the generic gate config (fee 500, 500 steps, 30 balls, entry great-marsh-west, the 3-map set, hub, Pastoria exit, rock-word MUD) — while the Kanto warden (maps3) plants NONE of it (defaults path, legacy behaviour)',
    ['great-marsh-west', 'great-marsh-east', 'great-marsh-north'].every((id) => M9S4[id].safariZone === 'great-marsh')
    && M9S4['great-marsh-gate'].safariHub === 'great-marsh'
    && !!warden && warden.safariGate === true && warden.safariFee === 500 && warden.safariSteps === 500 && warden.safariBalls === 30
    && warden.safariMap === 'great-marsh-west' && JSON.stringify(warden.safariMaps) === JSON.stringify(['great-marsh-west', 'great-marsh-east', 'great-marsh-north'])
    && warden.safariHub === 'great-marsh-gate' && warden.safariExit.map === 'pastoria' && warden.safariRock === 'MUD'
    && !(Object.values(ALL_MAPS).find((m) => (m.npcs || []).some((n) => n.safariGate && n.safariFee !== undefined && m.id !== 'great-marsh-gate'))));
  const CD = await import(join(ROOT, 'src/data/contest.mjs'));
  ok('S4-06 Super Contest data: CONTEST_RANKS.hearthome is the Platinum ladder (Normal -> Great -> Ultra -> Master, each requiring the previous rank ribbon); CONTEST_RIBBONS = the 4 Hoenn halls + the 4 rank keys; every rank has a 3-entrant NPC field of real species scripting real moves, and a ribbon name',
    CD.CONTEST_RANKS.hearthome.length === 4
    && CD.CONTEST_RANKS.hearthome[0].requires === null
    && CD.CONTEST_RANKS.hearthome.every((r, i) => i === 0 || r.requires === CD.CONTEST_RANKS.hearthome[i - 1].key)
    && JSON.stringify(CD.CONTEST_RIBBONS) === JSON.stringify([...CD.CONTEST_HALLS, ...CD.CONTEST_RANKS.hearthome.map((r) => r.key)])
    && CD.CONTEST_RANKS.hearthome.every((r) => (CD.CONTEST_NPCS[r.key] || []).length === 3
      && CD.CONTEST_NPCS[r.key].every((n) => rosterS4[n.species] && n.script.length === 4 && n.script.every((mv) => ALLMV[mv]))
      && typeof CD.RIBBON_NAMES[r.key] === 'string'));
  // The forme swap, pure (the Deoxys idiom): identity preserved,
  // stats recomputed, cross-family + same-forme rejected.
  const formeProbe = (from, to) => {
    const mon = mkMon(from, 360, rosterS4, ALLMV);
    mon.nickname = 'PROBE'; mon.hp = Math.floor(mon.maxHp / 2);
    const before = { maxHp: mon.maxHp, hp: mon.hp, moves: JSON.stringify(mon.moves), atk: mon.stats.atk };
    const swapped = SYS.switchForme(mon, to, rosterS4);
    return { mon, before, swapped };
  };
  const gp = formeProbe('giratina', 'giratinaorigin');
  ok('S4-07 Giratina swap (pure): altered -> origin succeeds; nickname/level/moves preserved verbatim; stats recompute from the origin base (atk rises: base 100 -> 120); HP carries by the max-delta rule (same base HP 150, so maxHp and hp are unchanged)',
    gp.swapped && gp.mon.speciesId === 'giratinaorigin' && gp.mon.nickname === 'PROBE' && gp.mon.level === 360
    && JSON.stringify(gp.mon.moves) === gp.before.moves && gp.mon.stats.atk > gp.before.atk
    && gp.mon.maxHp === gp.before.maxHp && gp.mon.hp === gp.before.hp);
  const rp = formeProbe('rotom', 'rotomwash');
  const rpTo = rp.mon.speciesId;
  const rpBack = SYS.switchForme(rp.mon, 'rotom', rosterS4);
  ok('S4-08 Rotom + Shaymin swaps (pure): rotom -> wash -> base round-trips; every rotom appliance forme is reachable from base and back; shaymin land -> sky -> land round-trips; cross-family (rotom -> giratinaorigin) and same-forme swaps are refused',
    rp.swapped && rpTo === 'rotomwash' && rpBack && rp.mon.speciesId === 'rotom'
    && ['rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow'].every((f) => { const m = mkMon('rotom', 340, rosterS4, ALLMV); return SYS.switchForme(m, f, rosterS4) && SYS.switchForme(m, 'rotom', rosterS4); })
    && (() => { const m = mkMon('shaymin', 350, rosterS4, ALLMV); return SYS.switchForme(m, 'shayminsky', rosterS4) && SYS.switchForme(m, 'shaymin', rosterS4); })()
    && !SYS.switchForme(mkMon('rotom', 340, rosterS4, ALLMV), 'giratinaorigin', rosterS4)
    && !SYS.switchForme(mkMon('giratina', 360, rosterS4, ALLMV), 'giratina', rosterS4));
  ok('S4-09 Shaymin reversion predicate (the recorded simplification): a fainted sky Shaymin reverts; a healthy sky or a fainted land Shaymin does not',
    SYS.shayminReverted({ speciesId: 'shayminsky', hp: 0 }) === true
    && SYS.shayminReverted({ speciesId: 'shayminsky', hp: 12 }) === false
    && SYS.shayminReverted({ speciesId: 'shaymin', hp: 0 }) === false);
  // Both validators round-trip every forme in a played-shape save.
  const ALL_FORMES = ['giratina', 'giratinaorigin', 'shaymin', 'shayminsky', 'rotom', 'rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow'];
  const formeSave = (fid) => {
    const s = clone(defaultState());
    s.player.name = 'ASH'; s.player.rivalName = 'GARY';
    s.story.arc = 'sinnoh'; s.story.region = 'sinnoh';
    const mon = mkMon(fid, 360, rosterS4, ALLMV);
    mon.nickname = 'FORME';
    s.party.push(mon);
    s.badges.sinnoh = SINNOH_ORDER.slice(0, 5);
    return s;
  };
  ok('S4-10 validator round-trip: a played-shape Sinnoh save carrying EACH of the 10 family formes (7 non-base) validates with ZERO errors server-side AND client-side — a switched forme can never strand a save',
    ALL_FORMES.every((fid) => { const s = formeSave(fid); const v = VAL.validateSave(clone(s)); return v.ok && v.errors.length === 0 && SCH.validateSave(clone(s)).ok; }),
    ALL_FORMES.map((fid) => fid + ':' + VAL.validateSave(formeSave(fid)).errors.join(',')).join(' '));
  const tilesS4 = await import(join(ROOT, 'src/engine/tiles.mjs'));
  const climbCh4 = tilesS4.S3B_KIND_CHARS.climbwall;
  const shippedMaps = Object.entries(ALL_MAPS).filter(([id]) => !M9S4[id]);
  ok('S4-11 no retro-gating: outside maps9, NO shipped map declares fog weather and NO shipped map row contains a climbwall tile — Kanto/Johto/Hoenn saves meet no new gate (the gates exist only where S3b authored them)',
    shippedMaps.every(([, m]) => m.weather !== 'fog' && !(m.rows || []).some((r) => r.includes(climbCh4)))
    && ['r217', 'victory-road', 'mt-coronet-north'].every((id) => M9S4[id].rows.some((r) => r.includes(climbCh4))));
  ok('S4-12 ribbon persistence rides the H5 quintet unchanged: a save holding all four Hearthome rank ribbons validates client + server, and save-fill preserves them (no new persisted state was minted for S4 — fog lives in story.flags, the Marsh in session, formes in speciesId)',
    (() => { const s = clone(defaultState()); s.player.name = 'ASH'; s.player.rivalName = 'GARY';
      s.contest.ribbons = ['hearthome-normal', 'hearthome-great', 'hearthome-ultra', 'hearthome-master'];
      return SCH.validateSave(clone(s)).ok && VAL.validateSave(clone(s)).ok
        && JSON.stringify(SCH.migrate(clone(s)).contest.ribbons) === JSON.stringify(s.contest.ribbons); })());
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

  // ================= S4 bundle drives (Arc 4 Stage S4) =================
  var pickS = function (g, v) { if (g.ui.menuOpen) pick(g, v); };
  var g2 = mkGame(802); boot(g2);
  var st2 = g2.state;
  st2.player.money = 5000;
  st2.badges.sinnoh = SN_IDS.slice(0, 5); // through the Fen Badge
  var star = makeMon('staraptor', 340, SPECIES, MOVES); star.nickname = 'GALE';
  var gar = makeMon('garchomp', 345, SPECIES, MOVES); gar.moves = [{ id: 'hyperbeam', pp: 5, maxPp: 5 }];
  var gir = makeMon('giratina', 360, SPECIES, MOVES); gir.nickname = 'RENE';
  var shay = makeMon('shaymin', 350, SPECIES, MOVES);
  var rot = makeMon('rotom', 340, SPECIES, MOVES);
  st2.party = [gar, star, gir, shay, rot];
  st2.bag.hm06 = 1; st2.bag.hm07 = 1; st2.bag.gracidea = 1;

  // --- teach Defog through the shipped HM-teach path ---
  g2.useBagItem('hm06'); tk(g2, 2);
  var teachMenu = g2.ui.menu ? g2.ui.menu.items : [];
  ok('S4B-01 HM06 teach menu (the shipped teachFromBag path): the Flying-type Staraptor is enabled for Defog, the non-flying party members are not (the S4 type-rule eligibility)',
    teachMenu.length === 6 && teachMenu[1] && !teachMenu[1].disabled
    && teachMenu[0].disabled && teachMenu[2].disabled && teachMenu[4].disabled,
    'menu=' + teachMenu.map(function (i) { return i.label + ':' + (i.disabled ? 'off' : 'on'); }).join('|'));
  pickS(g2, 1); tk(g2, 2);
  if (g2.ui.menuOpen) pickS(g2, 0); // the forget-a-move prompt (Staraptor carries 4)
  drain(g2);
  ok('S4B-02 Defog taught: Staraptor knows Defog as a battle move AND in its hmMoves field craft (the HM representation)',
    star.moves.some(function (m) { return m.id === 'defog'; }) && (star.hmMoves || []).includes('defog'));

  // --- Defog clears the r210-north fog; leaving restores it ---
  var ow2 = gotoMap(g2, 'r210-north', 11, 16); drain(g2);
  var fogBefore = weatherForMap(st2, ow2.map).kind;
  st2.badges.sinnoh = SN_IDS.slice(0, 4); // Fen Badge removed
  ow2.defogInteract(); drain(g2);
  var badgeRefused = !st2.story.flags['defogged_r210-north'];
  st2.badges.sinnoh = SN_IDS.slice(0, 5);
  var savedMoves = star.moves; var savedHm = star.hmMoves;
  star.moves = star.moves.filter(function (m) { return m.id !== 'defog'; });
  star.hmMoves = (star.hmMoves || []).filter(function (m) { return m !== 'defog'; });
  ow2.defogInteract(); drain(g2);
  var knowRefused = !st2.story.flags['defogged_r210-north'];
  star.moves = savedMoves; star.hmMoves = savedHm;
  ow2.defogInteract(); tk(g2, 2); pickS(g2, 'yes'); drain(g2);
  ok('S4B-03 Defog on Route 210 North: the map resolves fog; without the Fen Badge the field use refuses; with the badge but no Defog knowledge it refuses again (both refusals name their gate by leaving the fog standing); with both, the fog clears (weather resolves clear)',
    fogBefore === 'fog' && badgeRefused && knowRefused
    && st2.story.flags['defogged_r210-north'] === true && weatherForMap(st2, ow2.map).kind === 'clear');
  gotoMap(g2, 'celestic', 12, 8); drain(g2);
  var fogRestored = !st2.story.flags['defogged_r210-north'];
  ow2 = gotoMap(g2, 'r210-north', 11, 16); drain(g2);
  ok('S4B-04 fog persistence call: leaving the map clears the defogged flag (the canon return — the fog gathers again on re-entry)',
    fogRestored && weatherForMap(st2, ow2.map).kind === 'fog');

  // --- Rock Climb on the r217 wall ---
  ow2 = gotoMap(g2, 'r217', 13, 14); drain(g2);
  var faceWall = function (ow, x, y, dir) {
    ow.player.tx = x; ow.player.ty = y; ow.player.fx = x; ow.player.fy = y;
    ow.player.px = x * TILE; ow.player.py = y * TILE; ow.player.dir = dir;
  };
  faceWall(ow2, 16, 6, 'up'); ow2.sysInteract(16, 5); drain(g2);
  var climbBadgeRefused = ow2.player.ty === 6;
  st2.badges.sinnoh = SN_IDS.slice(0, 7); // through the Icicle Badge
  faceWall(ow2, 16, 6, 'up'); ow2.sysInteract(16, 5); drain(g2);
  var climbKnowRefused = ow2.player.ty === 6;
  g2.useBagItem('hm07'); tk(g2, 2); if (g2.ui.menuOpen) pickS(g2, 0); drain(g2); // teach Garchomp (ground body; 1-move mon learns directly)
  var garKnows = gar.moves.some(function (m) { return m.id === 'rockclimb'; });
  faceWall(ow2, 16, 6, 'up'); ow2.sysInteract(16, 5); drain(g2); tk(g2, 2); pickS(g2, 'yes'); tk(g2, 3);
  var climbedUp = ow2.player.tx === 16 && ow2.player.ty === 4;
  faceWall(ow2, 16, 4, 'down'); ow2.sysInteract(16, 5); drain(g2); tk(g2, 2); pickS(g2, 'yes'); tk(g2, 3);
  ok('S4B-05 Rock Climb on Route 217: no Icicle Badge refuses; badge without knowledge refuses; HM07 taught to Garchomp through the bag; the climb crosses the climbwall band up (16,6 -> 16,4) and back down — the authored pairing, both directions',
    climbBadgeRefused && climbKnowRefused && garKnows && climbedUp
    && ow2.player.tx === 16 && ow2.player.ty === 6);

  // --- Great Marsh session, end to end ---
  ow2 = gotoMap(g2, 'great-marsh-gate', 8, 10); drain(g2);
  var wardenNpc = ow2.map.npcs.find(function (n) { return n.name === 'MARSH WARDEN IO'; });
  var money0 = st2.player.money;
  ow2.sysNpc(wardenNpc); drain(g2); tk(g2, 3);
  var gateMenuOk = g2.ui.menuOpen && g2.ui.menu.items.some(function (i) { return i.value === 'yes'; });
  pickS(g2, 'yes'); tk(g2, 4); drain(g2);
  var saf = st2.session.safari;
  ok('S4B-06 Marsh entry at the warden (the generic Safari gate): $500 paid, a session stands with the 3-map Marsh set + 500 steps, 30 Safari Balls in the bag, and the player lands in Great Marsh West',
    gateMenuOk && !!saf && saf.maps.length === 3 && saf.steps === 500
    && st2.bag.safariball === 30 && st2.player.money === money0 - 500
    && pos(g2).map === 'great-marsh-west',
    'saf=' + JSON.stringify(saf) + ' pos=' + JSON.stringify(pos(g2)));
  ow2 = g2.scenes.top;
  var bogChar = null;
  for (var chK in TILE_CHARS) if (TILE_CHARS[chK] === 'marshbog') bogChar = chK;
  var bogTile = null;
  for (var by = 0; by < ow2.map.rows.length && !bogTile; by++)
    for (var bx = 0; bx < ow2.map.rows[by].length; bx++)
      if (ow2.map.rows[by][bx] === bogChar) { bogTile = { x: bx, y: by }; break; }
  var inBattle = false;
  for (var ei = 0; ei < 500 && !inBattle; ei++) {
    ow2.sysEncounterStep(bogTile.x, bogTile.y, bogChar);
    if (g2.scenes.top !== ow2) inBattle = true;
  }
  var bat = g2.scenes.top;
  ok('S4B-07 a Marsh encounter fires on a marshbog tile under the session (Safari rules on the Marsh tables)',
    inBattle && bat.safari === true && bat.safariRockLabel === 'MUD');
  var bGuard = 0;
  while (g2.scenes.top === bat && bGuard++ < 400) {
    if (g2.ui.menuOpen) {
      var its = g2.ui.menu.items;
      var bi = its.findIndex(function (it) { return it.value === 'safariball' && !it.disabled; });
      var ri = its.findIndex(function (it) { return it.value === 'safarirun'; });
      g2.ui.debugChoose(bi >= 0 ? bi : ri); tk(g2, 3);
    } else if (g2.ui.dialogueOpen || (bat && bat.msgOpen)) pA(g2);
    else tk(g2, 2);
  }
  ok('S4B-08 the Marsh battle resolves through Safari commands (balls / bait / mud / run — catch, flee or run all end it) and control returns to the Marsh with the session alive: no soft-lock',
    g2.scenes.top === ow2 && !!st2.session.safari);
  st2.session.safari.steps = 1;
  ow2.sysOnStep(ow2.player.tx, ow2.player.ty); drain(g2); tk(g2, 3);
  ok('S4B-09 steps-out ends the Marsh session cleanly: session cleared, unspent Safari Balls reclaimed by the park, and the player exits at Pastoria (the session exit data)',
    st2.session.safari === null && st2.bag.safariball === 0 && pos(g2).map === 'pastoria',
    'pos=' + JSON.stringify(pos(g2)));
  ow2 = g2.scenes.top;
  ow2.sysWarpLanding('great-marsh-west', 'great-marsh-gate'); tk(g2, 2); drain(g2);
  ok('S4B-10 the warp guard: landing in a zoned Marsh map with NO session bounces the player back to the gatehouse with the warden line (the Marsh is entered at its gate only)',
    ow2.mapId === 'great-marsh-gate', 'map=' + ow2.mapId);

  // --- Super Contest: Hearthome Normal Rank ---
  ow2 = gotoMap(g2, 'contest-hearthome', 8, 10); drain(g2);
  ow2.sysInteract(9, 2); tk(g2, 2); drain(g2); tk(g2, 2);
  var rankMenu = g2.ui.menu ? g2.ui.menu.items : [];
  var rankGateOk = rankMenu.some(function (i) { return i.value === 'hearthome-normal' && !i.disabled; })
    && rankMenu.some(function (i) { return i.value === 'hearthome-great' && i.disabled; })
    && rankMenu.some(function (i) { return i.value === 'hearthome-master' && i.disabled; });
  pickS(g2, 'hearthome-normal'); tk(g2, 2); drain(g2); tk(g2, 2);
  var cGuard = 0, sawContest = false, moveMenus = 0;
  while (cGuard++ < 4000) {
    if (g2.scenes.top instanceof ContestScene) sawContest = true;
    if (g2.ui.dialogueOpen) { drain(g2); continue; }
    if (g2.ui.menuOpen) {
      var cm = g2.ui.menu;
      if (cm.title === 'Enter which Pokemon?') { g2.ui.debugChoose(0); tk(g2, 3); continue; }
      if (cm.title === 'Choose a move') { moveMenus++; g2.ui.debugChoose(0); tk(g2, 3); continue; }
      g2.ui.debugChoose(0); tk(g2, 3); continue;
    }
    if (g2.scenes.top instanceof ContestScene) { tk(g2, 2); continue; }
    if (g2.scenes.top instanceof OverworldScene) break;
    tk(g2, 2);
  }
  drain(g2);
  ok('S4B-11 Super Contest (Hearthome): the rank menu gates Great/Master behind their ladder ribbons; the Normal Rank runs end-to-end on the shipped contest engine (4 move menus) with Garchomp headlining Hyper Beam, and FIRST PLACE persists the Hearthome Ribbon (Normal Rank) in state.contest.ribbons — the H5 persistence quintet, no new state',
    rankGateOk && sawContest && moveMenus === 4 && st2.contest.ribbons.includes('hearthome-normal'),
    'gate=' + rankGateOk + ' saw=' + sawContest + ' menus=' + moveMenus + ' ribbons=' + JSON.stringify(st2.contest.ribbons));

  // --- forme switches on their true paths ---
  var ow3 = gotoMap(g2, 'turnback-cave', 11, 14); drain(g2);
  ow3.player.tx = 11; ow3.player.ty = 6; ow3.player.fx = 11; ow3.player.fy = 6;
  ow3.player.px = 11 * TILE; ow3.player.py = 6 * TILE; ow3.player.dir = 'up';
  ow3.tryInteract(); tk(g2, 2); drain(g2); tk(g2, 2);
  pickS(g2, 'giratinaorigin'); drain(g2);
  var girSwitched = gir.speciesId === 'giratinaorigin' && gir.nickname === 'RENE';
  ow3.tryInteract(); tk(g2, 2); drain(g2); tk(g2, 2);
  pickS(g2, 'giratina'); drain(g2);
  ok('S4B-12 Giratina at the Griseous Orb (Turnback Cave chamber sign): altered -> origin -> altered, the individual preserved (nickname RENE rides both ways)',
    girSwitched && gir.speciesId === 'giratina');
  var ow4 = gotoMap(g2, 'old-chateau', 9, 12); drain(g2);
  ow4.player.tx = 16; ow4.player.ty = 5; ow4.player.fx = 16; ow4.player.fy = 5;
  ow4.player.px = 16 * TILE; ow4.player.py = 5 * TILE; ow4.player.dir = 'up';
  ow4.tryInteract(); tk(g2, 2); drain(g2); tk(g2, 2);
  pickS(g2, 'rotomheat'); drain(g2);
  var rotSwitched = rot.speciesId === 'rotomheat';
  ow4.tryInteract(); tk(g2, 2); drain(g2); tk(g2, 2);
  pickS(g2, 'rotom'); drain(g2);
  ok('S4B-13 Rotom at the Old Chateau appliances (the television room): base -> Heat forme via the oven, then back to base by leaving the appliances',
    rotSwitched && rot.speciesId === 'rotom');
  g2.useBagItem('gracidea'); tk(g2, 2); pickS(g2, 3); drain(g2);
  var shaySky = shay.speciesId === 'shayminsky';
  g2.useBagItem('gracidea'); tk(g2, 2); pickS(g2, 3); drain(g2);
  var shayLand = shay.speciesId === 'shaymin';
  g2.useBagItem('gracidea'); tk(g2, 2); pickS(g2, 3); drain(g2);
  shay.hp = 0;
  var ow5 = g2.scenes.top; ow5.sysOnStep(ow5.player.tx, ow5.player.ty); tk(g2, 2);
  ok('S4B-14 Shaymin via the Gracidea (bag use, never consumed): land -> sky -> land by the flower, sky again, and the faint reversion settles a fainted sky Shaymin back to land on the next step',
    shaySky && shayLand && shay.speciesId === 'shaymin' && st2.bag.gracidea === 1);
  st2.bag.hm07 = 0;
  var ow6 = g2.scenes.top;
  ow6.runSteps([{ giveHM: 'rockclimb' }], 0, null); tk(g2, 2);
  var grantOnce = st2.bag.hm07 === 1;
  ow6.runSteps([{ giveHM: 'rockclimb' }], 0, null); tk(g2, 2);
  ok('S4B-15 the giveHM event step (the S5 grant hook): { giveHM: rockclimb } grants HM07 once — a second firing never duplicates it',
    grantOnce && st2.bag.hm07 === 1);

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
