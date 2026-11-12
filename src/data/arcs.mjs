// arcs.mjs — the ARCS registry (ADR-027, Stage F foundation): the SINGLE
// data source for the arc chain. One arc = one edition-generation of the
// story (roadmap §1); chapters (src/data/story.mjs, ADR-015) remain the
// narrative layer inside arcs. The transition machine (src/game/arcs.mjs),
// the summary card, the homecoming, the ferry network, the dex/HUD horizon
// and the per-arc level bands (ADR-027 Amendment 2) ALL read this table —
// none of them names a region in logic. Adding a future arc = one row here
// + that region's content, never a redesign (roadmap §2.5).
//
// Owner overrules carried in this table (palace ADR-027 amendments):
//  - Amendment 1: NO Oak Arrangement. Party / levels / items / money / dex
//    / honors carry across arcs UNCONDITIONALLY — no deposit, no partner
//    reset, no obedience cap, no compensating scaling. Nothing in the
//    transition machine touches the team.
//  - Amendment 2: per-arc LEVEL BANDS — cap = 100 x bandIndex (Arden
//    1-100, Yamato 101-200, Maris 201-300, Borea 301-400). Orange SHARES
//    Arden's band (it continues Arden's power curve). The Trial Grounds
//    is OPEN LEVEL (band: null — its facilities match the entrant).
//
// Row fields:
//   id             machine id (story.arc / arc_directive values)
//   n              arc number as displayed (1, 1.5, 2, 3, 3.5, 4, 5...)
//   label          'Arc 1', 'Arc 1.5', ...
//   region         display name of the region
//   regionKey      the story.region value while this arc is current
//   edition        the governing edition era (Platinum governs Borea)
//   chapters       ADR-015 chapter numbers inside this arc
//   dexHorizon     cumulative national-dex horizon at this arc
//   band           { min, max, bandIndex } or null (open level)
//   badgeSet       key into state.badges ('symbols' counts non-null slots)
//   badgeTotal     badges/symbols that complete the set
//   completionKey  the story.regionsDone value for this arc
//   completionFlag story.flags name whose presence proves completion —
//                  the registry completion-test hook: each arc's build
//                  stage registers its own flag here (Arden's is the
//                  shipped 'champion'; later flags are named now so the
//                  machine never changes shape)
//   status         'shipped' (playable in this build) | 'next' (the road
//                  ahead: homecoming arms its embark) | 'sealed' (drawn
//                  on the map, not yet walkable — honest, never faked)
//   future         true for the sealed post-Platinum rows (ch 9-13)
//   hookGiver      who delivers this arc's hook at the homecoming
//                  (a BOND_NPC_IDS-style id; display names below)
//   embarkPort     map id of the port the embark sails from (null: origin
//                  arc, or not yet charted for sealed rows)
//   arrivalMap     map id the embark lands on (null likewise)
//   home           the homecoming town map id (Dawnwick for every arc —
//                  roadmap §2.1: one anchor, one ritual)
//   summaryLines   league-result wording for the ARC COMPLETE card
//                  (original writing, anime-true outcomes)
//   hookLines      the homecoming hook dialogue FOR this arc, spoken by
//                  hookGiver (original writing; sealed rows carry one
//                  honest future-tense line — no playable claims)
//   enRouteLines   the embark crossing card text (original writing)

import { xpCeilingForCap } from '../engine/formulas.mjs';

export const HOME_TOWN_MAP_ID = 'pallet';
export const HOME_MAP_ID = 'house-pallet-ash'; // Mom's house interior (maps4.mjs)

export const ARC_GIVER_NAMES = {
  hawthorn: 'Prof. Hawthorn',
  scott: 'Scott',
  gary: 'Gary',
};

export const ARCS = [
  {
    id: 'kanto', n: 1, label: 'Arc 1', region: 'Arden', regionKey: 'kanto',
    edition: 'Yellow', chapters: [1], dexHorizon: 151,
    band: { min: 1, max: 100, bandIndex: 1 },
    badgeSet: 'kanto', badgeTotal: 8,
    completionKey: 'kanto', completionFlag: 'champion',
    status: 'shipped', future: false,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: [
      'Crown League — CHAMPION.',
      'Eight badges, one storm over Exile Isle, and a final against the rival who started it all. The Plateau wrote your team into its light.',
    ],
    hookLines: [],
    enRouteLines: [],
  },
  {
    id: 'orange', n: 1.5, label: 'Arc 1.5', region: 'Orange Islands', regionKey: 'orange',
    edition: 'Anime-original', chapters: [2], dexHorizon: 151,
    band: { min: 1, max: 100, bandIndex: 1 }, // shares Arden's band (Amendment 2)
    badgeSet: 'orange', badgeTotal: 4,
    completionKey: 'orange', completionFlag: 'orange_champion',
    status: 'next', future: false,
    hookGiver: 'hawthorn', embarkPort: 'vermilion', arrivalMap: 'valencia', home: 'pallet',
    summaryLines: [
      'Orange League — WINNER.',
      'Four island badges and a champion\'s battle under southern stars. The Winner\'s Trophy is yours — and so is the strange ball that started the voyage.',
    ],
    hookLines: [
      'A colleague of mine — Professor Ivy, on Valencia Island in the Orange Archipelago — is holding a Capture Orb that no machine can open.',
      'They call it the GS Orb. Fetch it for me, would you? The ferry for Valencia leaves from Arcport City.',
      'Mind the sea air down there. It changes trainers — usually for the better.',
    ],
    enRouteLines: [
      '— days at sea —',
      'The water turns the colour of warm glass. Somewhere ahead: Valencia Island, and a ball that will not open.',
    ],
  },
  {
    id: 'johto', n: 2, label: 'Arc 2', region: 'Yamato', regionKey: 'johto',
    edition: 'Gold / Silver / Crystal', chapters: [3, 4, 5], dexHorizon: 251,
    band: { min: 101, max: 200, bandIndex: 2 },
    badgeSet: 'johto', badgeTotal: 8,
    completionKey: 'johto', completionFlag: 'johto_complete',
    status: 'shipped', future: false,
    hookGiver: 'hawthorn', embarkPort: 'pallet', arrivalMap: 'newbark', home: 'pallet',
    summaryLines: [
      'Lastlight Conference — HONOURS.',
      'Eight badges, the beasts woken and quieted, and the rivalry settled at last in the conference fire. The road home feels shorter than the road out.',
    ],
    hookLines: [
      'That GS Orb you carried across the Orange Islands — there is a man in Cinder Town named Kurt who still works Capture Orbs by hand, the old way.',
      'If anyone alive can open it, it is him. And Yamato itself is calling: new towers, new legends, and a rival who will not wait forever.',
      'The boat for Yamato leaves from Dawnwick\'s own dock. Come home first. You always come home first.',
    ],
    enRouteLines: [
      '— days at sea —',
      'Gulls first, then a coastline of old towers. Yamato.',
    ],
  },
  {
    id: 'hoenn', n: 3, label: 'Arc 3', region: 'Maris', regionKey: 'hoenn',
    edition: 'Ruby / Sapphire / Emerald', chapters: [6], dexHorizon: 386,
    band: { min: 201, max: 300, bandIndex: 3 },
    badgeSet: 'hoenn', badgeTotal: 8,
    completionKey: 'hoenn', completionFlag: 'hoenn_complete',
    status: 'shipped', future: false,
    hookGiver: 'hawthorn', embarkPort: 'vermilion', arrivalMap: 'littleroot', home: 'pallet',
    summaryLines: [
      'Perennial Conference — HONOURS.',
      'Two storms called and answered, eight badges earned, and a conference run that ended narrow and proud. The sea air follows you home.',
    ],
    hookLines: [
      'Word travels fast on the sea roads: a whole region across the water is in a strange mood — its land and ocean arguing through two old teams.',
      'Maris, they call it. New Pokemon, new gyms, contests in every port — and a certain evolved friend of Gary\'s waiting to prove a point.',
      'The Arcport ferry runs that way. Pack for rain AND for drought; Maris cannot decide either.',
    ],
    enRouteLines: [
      '— days at sea —',
      'The rain arrives before the land does. Maris, arguing with its own ocean.',
    ],
  },
  {
    id: 'frontier', n: 3.5, label: 'Arc 3.5', region: 'Trial Grounds', regionKey: 'kanto',
    edition: 'Emerald', chapters: [7], dexHorizon: 386,
    band: null, // open level (Amendment 2): facilities match the entrant
    badgeSet: 'symbols', badgeTotal: 7,
    completionKey: 'frontier', completionFlag: 'frontier_complete',
    status: 'shipped', future: false,
    hookGiver: 'scott', embarkPort: 'pallet', arrivalMap: 'frontierhub', home: 'pallet',
    summaryLines: [
      'Trial Grounds — CONQUERED.',
      'Seven Symbols at the Gold standard, and a rematch years in the making finally won. The Frontier salutes you.',
    ],
    hookLines: [
      'A man named Scott has been watching your battles — he scouts for a place called the Trial Grounds, seven facilities run by trainers called Frontier Brains.',
      'He left an invitation with your name on it and one instruction: bring the team you trust most. The Frontier does not care where you have been — only how you fight.',
      'It stands on an island off Arden. The boat leaves from Dawnwick. Scott will be waiting at the dock, smiling like he already knows the result.',
    ],
    enRouteLines: [
      '— a short crossing —',
      'An island of arenas rises out of the haze. The Frontier.',
    ],
  },
  {
    id: 'sinnoh', n: 4, label: 'Arc 4', region: 'Borea', regionKey: 'sinnoh',
    edition: 'Platinum', chapters: [8], dexHorizon: 493,
    band: { min: 301, max: 400, bandIndex: 4 },
    badgeSet: 'sinnoh', badgeTotal: 8,
    completionKey: 'sinnoh', completionFlag: 'sinnoh_complete',
    status: 'shipped', future: false,
    hookGiver: 'gary', embarkPort: 'vermilion', arrivalMap: 'sandgem', home: 'pallet',
    summaryLines: [
      'Lily of the Valley Conference — HONOURS.',
      'Eight badges, a god unchained and answered, and the only victory anyone took from the conference\'s darkest trainer. History will remember the attempt — and the Darkrai that fell.',
    ],
    hookLines: [
      'Gary came by the lab while you were away — back from a northern region called Borea, with an Electivire at his side and stories that sound half like weather reports, half like scripture.',
      'Mountains that touch the sky, lakes older than kingdoms, and something sleeping at the top of the world. He said one more thing: "Tell Ash the north is not finished with trainers like us."',
      'The Shingle-bound ship sails from Arcport. Go and see what Gary saw.',
    ],
    enRouteLines: [
      '— days at sea —',
      'The air sharpens mile by mile. Ahead: snow on the peaks, and Borea.',
    ],
  },
  // ---- Sealed future arcs (post-Platinum; ADR-027 Decision 2) ----
  // Designed skeleton per ADR-015 ch 9-13: rows exist so the Journey menu,
  // the dex frame and the finale's forward line can point at them honestly.
  // Unbuilt, undeleted. Bands continue the Amendment-2 pattern as data.
  {
    id: 'unova', n: 5, label: 'Arc 5', region: 'Unova', regionKey: 'unova',
    edition: 'Black & White', chapters: [9], dexHorizon: 1025,
    band: { min: 401, max: 500, bandIndex: 5 },
    badgeSet: 'unova', badgeTotal: 8,
    completionKey: 'unova', completionFlag: 'unova_complete',
    status: 'sealed', future: true,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: ['A future arc — sealed.', 'This road is drawn on the map but not yet walked.'],
    hookLines: ['Far across the ocean there is a region of bridges and bright cities — Unova. Its road is drawn, but this journey has not reached it yet.'],
    enRouteLines: [],
  },
  {
    id: 'kalos', n: 6, label: 'Arc 6', region: 'Kalos', regionKey: 'kalos',
    edition: 'XY & XYZ', chapters: [10], dexHorizon: 1025,
    band: { min: 501, max: 600, bandIndex: 6 },
    badgeSet: 'kalos', badgeTotal: 8,
    completionKey: 'kalos', completionFlag: 'kalos_complete',
    status: 'sealed', future: true,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: ['A future arc — sealed.', 'This road is drawn on the map but not yet walked.'],
    hookLines: ['Beyond Unova, a region that treats beauty as a discipline — Kalos. A future arc, when this journey is ready for it.'],
    enRouteLines: [],
  },
  {
    id: 'alola', n: 7, label: 'Arc 7', region: 'Alola', regionKey: 'alola',
    edition: 'Sun & Moon', chapters: [11], dexHorizon: 1025,
    band: { min: 601, max: 700, bandIndex: 7 },
    badgeSet: 'alola', badgeTotal: 0, // the island challenge awards no badges
    completionKey: 'alola', completionFlag: 'alola_complete',
    status: 'sealed', future: true,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: ['A future arc — sealed.', 'This road is drawn on the map but not yet walked.'],
    hookLines: ['South past every charted sea: islands under twin lights — Alola. A future arc.'],
    enRouteLines: [],
  },
  {
    id: 'journeys', n: 8, label: 'Arc 8', region: 'World', regionKey: 'journeys',
    edition: 'Journeys', chapters: [12], dexHorizon: 1025,
    band: { min: 701, max: 800, bandIndex: 8 },
    badgeSet: 'journeys', badgeTotal: 0,
    completionKey: 'journeys', completionFlag: 'journeys_complete',
    status: 'sealed', future: true,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: ['A future arc — sealed.', 'This road is drawn on the map but not yet walked.'],
    hookLines: ['One day the road stops being a line of regions and becomes the whole world at once. A future arc — the widest one.'],
    enRouteLines: [],
  },
  {
    id: 'horizons', n: 9, label: 'Arc 9', region: 'World', regionKey: 'horizons',
    edition: 'Horizons', chapters: [13], dexHorizon: 1025,
    band: { min: 801, max: 900, bandIndex: 9 },
    badgeSet: 'horizons', badgeTotal: 0,
    completionKey: 'horizons', completionFlag: 'horizons_complete',
    status: 'sealed', future: true,
    hookGiver: null, embarkPort: null, arrivalMap: null, home: 'pallet',
    summaryLines: ['A future arc — sealed.', 'This road is drawn on the map but not yet walked.'],
    hookLines: ['And after the last page of one traveler\'s story, another traveler picks up the map. A future arc — a new beginning.'],
    enRouteLines: [],
  },
];

// ---------------------------------------------------------------------------
// THE FINALE (Arc 4 Stage S7, mission decision 10) — DATA, not machine.
// When a completed arc's registry successor is NOT playable (a sealed
// future row), the arc machine plays the FINALE VARIANT of the
// homecoming instead of the standard ritual. Everything finale-
// specific lives here as data; the machine (src/game/arcs.mjs) reads
// it generically and names no region, no item and no flag of its own:
//   FINALE_GRANT_ITEM_ID  the key item the Professor entrusts at the
//                         finale homecoming (an ITEMS row id).
//   FINALE_UNLOCK_FLAG    the story flag the finale — and ONLY the
//                         finale — sets (arc completion alone never
//                         sets it; the capstone quest keys on it).
//   ARC_FINALE_ECHOES     one short bond-echo line per arc, keyed by
//                         arc id; the machine iterates the save's
//                         regionsDone and reads the line for each.
//   FINALE_CREDITS_OPEN / FINALE_CREDITS_CLOSE
//                         the full credits' frame lines; the arc
//                         listing between them is built from the
//                         registry rows of regionsDone, never typed.
//   FINALE_END_CARD       the end card the credits close on
//                         (coordinator-approved line, S7).
// ---------------------------------------------------------------------------
export const FINALE_GRANT_ITEM_ID = 'azureflute';
export const FINALE_UNLOCK_FLAG = 'arceus_unlocked';

export const ARC_FINALE_ECHOES = {
  kanto: 'Arden first: a borrowed bike voucher, a storm over Exile Isle, and a rival who turned out to be a measuring stick all along. You came home with eight badges and every friend you started with, plus several dozen more.',
  orange: 'Then the southern sea: four island badges, a ball that would not open, and a trophy heavy as an anchor. The Orange water taught the team to win on strange ground, under stranger stars.',
  johto: 'Yamato asked older questions — towers, bells, beasts woken out of legend — and the rivalry that started in a Dawnwick lane finally burned itself honest at the Lastlight Conference.',
  hoenn: 'Maris argued with its own weather, and the team answered both sides of it: drought and deluge, two old teams, and a conference run that ended narrow and proud.',
  frontier: 'The Frontier cared nothing for any of that. Seven doors, seven Brains, one standard — gold. It is the only place that ever graded the team purely on how they fight, and they know it.',
  sinnoh: 'And Borea: a god in red chains, a world behind the world, and a Darkrai that finally fell. The north is finished with trainers like us, Gary said. It was not wrong. It is finished — because it is complete.',
};

export const FINALE_CREDITS_OPEN = [
  '— THE LONG ROAD, REMEMBERED —',
  'Every journey in this book was walked, not wished. Here is the whole of it, in the order the road gave it:',
];

export const FINALE_CREDITS_CLOSE = [
  'Teams changed. Towns blurred. The one constant was the walking — and the ones who walked beside you, in Capture Orbs and out of them.',
  'This is not a goodbye. Roads like this one do not end; they just go quiet for a while, the way a held note does before the music remembers it.',
];

export const FINALE_END_CARD = [
  '— THE END —',
  'Six journeys. Five leagues and a frontier. One road, walked whole.',
  'Thank you for walking it. When the next road opens — and roads always open — it will find you exactly where this one left you: ready, rested, and already lacing your shoes.',
];

// The committed national horizon: Platinum (ADR-027 Decision 5). Derived
// from the Borea row so a registry edit moves every presentation at once.
export const PLATINUM_DEX_HORIZON = (ARCS.find((a) => a.id === 'sinnoh') || { dexHorizon: 493 }).dexHorizon;

export function arcById(id) {
  return ARCS.find((a) => a.id === id) || null;
}

export function arcForChapter(n) {
  return ARCS.find((a) => a.chapters.includes(n)) || null;
}

export function nextArcOf(arcId) {
  const i = ARCS.findIndex((a) => a.id === arcId);
  return i >= 0 && i + 1 < ARCS.length ? ARCS[i + 1] : null;
}

// The arc the run is currently inside. story.arc is authoritative (the
// save-fill path guarantees it); the fallback is Arc 1 — a state with no
// arc field is a Arden state by definition (pre-foundation shape).
export function currentArcOf(state) {
  const id = state && state.story ? state.story.arc : null;
  return arcById(id) || ARCS[0];
}

// ADR-027 Amendment 2: the level cap is a registry read. Convention:
// an open-level arc (band: null — the Trial Grounds) returns Infinity,
// so every comparison keeps working unchanged (m.level < Infinity is
// always true; Math.min(Infinity, x) is x; m.level >= Infinity never
// disables a target).
export function levelCapFor(state) {
  const arc = currentArcOf(state);
  return arc.band ? arc.band.max : Infinity;
}

// Stage J0: the save-validation XP ceiling paired with levelCapFor —
// the same derivation the server validator enforces via the tables
// gen-tables emits from this registry (one derivation, both sides).
export function xpCeilingFor(state) {
  return xpCeilingForCap(levelCapFor(state));
}

export function dexHorizonFor(state) {
  return currentArcOf(state).dexHorizon;
}

// The regional dex span of an arc: (previous distinct horizon, horizon].
// Orange shares Arden's 1-151 set (no delta); the Frontier shares Maris's.
export function arcDexSpan(arc) {
  if (!arc) return { lo: 1, hi: ARCS[0].dexHorizon };
  let prev = 0;
  for (const a of ARCS) {
    if (a === arc) break;
    if (a.dexHorizon < arc.dexHorizon && a.dexHorizon > prev) prev = a.dexHorizon;
  }
  return { lo: prev + 1, hi: arc.dexHorizon };
}

// Badges earned toward an arc's set. 'symbols' counts the non-null slots
// of badges.symbols; every other set is a plain array (absent = 0, so the
// Maris/Borea sets read honestly before their badge arrays exist).
export function badgeCountFor(state, arc) {
  if (!state || !arc) return 0;
  const badges = state.badges || {};
  if (arc.badgeSet === 'symbols') {
    return (badges.symbols || []).filter((s) => s !== null && s !== undefined).length;
  }
  const arr = badges[arc.badgeSet];
  return Array.isArray(arr) ? arr.length : 0;
}

// The completion predicate: regionsDone already carries the arc (the
// machine's own write), OR the arc's registered completion flag is set
// (the shipped HoF path sets 'champion'; later stages set theirs).
export function arcCompletionMet(state, arc) {
  if (!state || !arc || !state.story) return false;
  const done = state.story.regionsDone;
  if (Array.isArray(done) && done.includes(arc.completionKey)) return true;
  const flags = state.story.flags || {};
  return !!(arc.completionFlag && flags[arc.completionFlag] === true);
}

// 'complete' | 'current' | 'locked-next' | 'sealed', derived from
// story.regionsDone + story.arc (+ the directive), never stored.
export function arcStateOf(state, arcId) {
  const arc = arcById(arcId);
  if (!arc || !state || !state.story) return 'sealed';
  const done = state.story.regionsDone;
  if (Array.isArray(done) && done.includes(arc.completionKey)) return 'complete';
  if (state.story.arc === arcId) return 'current';
  if (arc.status === 'sealed') return 'sealed';
  if (state.story.arc_directive === arcId) return 'locked-next';
  const cur = currentArcOf(state);
  const next = nextArcOf(cur.id);
  if (next && next.id === arcId && arcCompletionMet(state, cur)) return 'locked-next';
  return 'sealed';
}

// Save-fill derivation (schema.mjs fillV2Defaults calls this on EVERY
// load, so legacy saves open unchanged in shape): fills story.arc,
// story.arc_directive, story.arcDexStart, story.arcStartPlaytime with
// derived defaults and NEVER overwrites a valid stored value.
//  - A mid-Arden save derives arc 'kanto', no directive.
//  - A Arden-complete save (regionsDone carries 'kanto', OR a Hall of
//    Fame entry exists, OR the shipped 'champion' flag is set — the
//    three forms the shipped game writes) derives arc 'kanto' with the
//    directive PENDING on the next arc ('orange'): the transition is
//    the player's to walk (directive -> homecoming), exactly as for a
//    save that completed Arden after this foundation shipped.
//  - Arc-start snapshots default truthfully for Arc 1 (the journey
//    began at 0 caught / 0 seconds); for any later arc they default to
//    the current totals (the arc's gains count from load).
export function deriveArcDefaults(story, caughtCount, playtimeSec) {
  if (!story || typeof story !== 'object') return story;
  const ids = new Set(ARCS.map((a) => a.id));
  if (!ids.has(story.arc)) story.arc = 'kanto';
  if (story.arc_directive !== null && !ids.has(story.arc_directive)) story.arc_directive = null;
  const flags = story.flags && typeof story.flags === 'object' ? story.flags : {};
  const done = Array.isArray(story.regionsDone) ? story.regionsDone : [];
  const kantoDone = done.includes('kanto')
    || (Array.isArray(story.hof) && story.hof.length > 0)
    || flags.champion === true;
  if (story.arc_directive === null && story.arc === 'kanto' && kantoDone && !flags.hook_orange) {
    const next = nextArcOf('kanto');
    if (next) story.arc_directive = next.id;
  }
  // A directive whose homecoming already happened is spent.
  if (story.arc_directive && flags['hook_' + story.arc_directive]) story.arc_directive = null;
  // Stage F0 catch-up (GENERIC — names no region): a save that
  // consumed a SEALED homecoming in an earlier build set hook_<id> +
  // homecoming_<id> but, by the sealed law, never advanced story.arc
  // and never got an embark. If that arc is NOW 'shipped' or 'next',
  // the save is repaired on load: story.arc advances to it and its
  // embark arms — exactly what the homecoming would have done had
  // the arc been shipped when it fired. Fires only while story.arc
  // is still the PREVIOUS arc and that arc's completion is met
  // (regionsDone or its completionFlag, via arcCompletionMet); it
  // cannot fire while a homecoming is still pending (no homecoming
  // flag) or once story.arc has already advanced, and it is
  // idempotent (after the repair, story.arc IS the arc, so the
  // previous-arc test fails on every later load). The loop runs in
  // registry order and does not break, so a save that consumed more
  // than one sealed homecoming catches up through each in turn.
  for (let i = 1; i < ARCS.length; i++) {
    const a = ARCS[i];
    if (a.status !== 'shipped' && a.status !== 'next') continue;
    const prev = ARCS[i - 1];
    if (story.arc !== prev.id) continue;
    const fl = story.flags && typeof story.flags === 'object' ? story.flags : {};
    if (!fl['hook_' + a.id] || !fl['homecoming_' + a.id]) continue;
    if (!arcCompletionMet({ story }, prev)) continue;
    story.arc = a.id;
    story.region = a.regionKey;
    story.arcDexStart = Math.max(0, Math.trunc(caughtCount || 0));
    story.arcStartPlaytime = Math.max(0, Math.trunc(playtimeSec || 0));
    if (!story.flags || typeof story.flags !== 'object') story.flags = {};
    story.flags['embark_' + a.id] = true;
  }
  if (typeof story.arcDexStart !== 'number' || !Number.isFinite(story.arcDexStart) || story.arcDexStart < 0) {
    story.arcDexStart = story.arc === 'kanto' ? 0 : (caughtCount || 0);
  }
  if (typeof story.arcStartPlaytime !== 'number' || !Number.isFinite(story.arcStartPlaytime) || story.arcStartPlaytime < 0) {
    story.arcStartPlaytime = story.arc === 'kanto' ? 0 : (playtimeSec || 0);
  }
  story.arcDexStart = Math.trunc(story.arcDexStart);
  story.arcStartPlaytime = Math.trunc(story.arcStartPlaytime);
  return story;
}
