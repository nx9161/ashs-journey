// frontier.mjs — Arc 3.5 Stage F2: Battle Frontier facility DATA.
//
// Pure data for the seven facilities (src/game/frontier.mjs is the
// controller). Facility ids ARE the BADGE_SETS.symbols slot order
// (items.mjs): slot i of badges.symbols belongs to facility
// FACILITIES[i]. Everything player-facing here is original writing.
//
// Recorded design calls (F2 register entry):
// - GENERATED pools (random opponents, Factory rentals, Dome fields,
//   Pike/Pyramid wilds) never contain a legendary/mythical species or
//   a form entry — LEGENDARY_IDS below is the closed roster list the
//   suite checks the pools against. BRAIN teams are authored, not
//   generated, and are exempt where canon demands it: Brandon's
//   Regi trio is his identity (the mission names it explicitly).
// - Brain team entries ride the shipped trainer-def format
//   ({ species, level, keepsake? }) — that format has NO moves field
//   (BattleScene builds foes with makeMon from the species learnset),
//   so "authored moves" are not expressible and none are claimed.
// - Arena generated trainers field THREE mons (Stage F3
//   SUPERSESSION of the F2 one-mon note): the judge's Body category
//   reads WHOLE-TEAM HP fractions exactly as Emerald does, so a
//   1-mon foe — its only mon absorbing all the damage while the
//   challenger's bench stayed untouched — conceded Body almost
//   every time and skewed the variant's core mechanic. Brain teams
//   already fielded 3; generated teams now match them.

import { BADGE_SETS } from './items.mjs';

export const FACILITY_IDS = [...BADGE_SETS.symbols]; // [tower, factory, arena, dome, pike, palace, pyramid]

export const LEGENDARY_IDS = [
  'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
  'raikou', 'entei', 'suicune', 'lugia', 'hooh', 'celebi',
  'regirock', 'regice', 'registeel', 'kyogre', 'groudon', 'rayquaza',
  'latias', 'latios', 'jirachi', 'deoxys',
];

// Pike chamber events: the closed category vocabulary. Client +
// server save validators check run.events against exactly this list
// (gen-tables emits it from here — never hand-edit the snapshot).
export const PIKE_EVENT_KINDS = [
  'battle-trainer', 'battle-wild', 'heal-full', 'heal-half',
  'cure-status', 'inflict-status', 'quiet', 'hint',
];
// Weighted draw for the Pike pre-roll (weights sum to 100).
export const PIKE_EVENT_WEIGHTS = [
  ['battle-trainer', 22], ['battle-wild', 22], ['heal-full', 8],
  ['heal-half', 10], ['cure-status', 8], ['inflict-status', 10],
  ['quiet', 10], ['hint', 10],
];
// What a hint truthfully calls each category (original attendant
// phrasing — the hint NAMES the category, never fakes it).
export const PIKE_HINT_PHRASES = {
  'battle-trainer': 'a trainer itching for a fight',
  'battle-wild': 'something wild moving in the walls',
  'heal-full': 'a nurse with a full tray and a kind face',
  'heal-half': 'a nurse with a half tray and an apologetic face',
  'cure-status': 'a nurse with a remedy kit',
  'inflict-status': 'a nurse whose smile you should not trust',
  quiet: 'nothing at all. Suspiciously nothing',
  hint: 'an attendant who loves to talk',
};

// Pyramid run-bag loot (medicine pocket only — the bag's whole law).
export const PYRAMID_LOOT = [
  ['potion', 18], ['superpotion', 16], ['hyperpotion', 12],
  ['fullrestore', 8], ['revive', 10], ['maxrevive', 5],
  ['antidote', 6], ['parlyzheal', 6], ['awakening', 5],
  ['burnheal', 4], ['iceheal', 4], ['fullheal', 6],
];

// Pyramid virtual spots: authored candidate tiles per floor map
// (kind pre-authored; the run seeds a subset per floor entry).
// Coordinates are plain floor tiles ('L') on each maze — the suite
// verifies every one against maps8.
export const PYRAMID_SPOT_CANDIDATES = {
  'frontier-pyramid-a': [
    { x: 2, y: 7, kind: 'trainer' }, { x: 16, y: 9, kind: 'trainer' }, { x: 6, y: 13, kind: 'trainer' },
    { x: 12, y: 7, kind: 'item' }, { x: 3, y: 4, kind: 'item' }, { x: 17, y: 13, kind: 'item' },
  ],
  'frontier-pyramid-b': [
    { x: 3, y: 2, kind: 'trainer' }, { x: 10, y: 7, kind: 'trainer' }, { x: 16, y: 13, kind: 'trainer' },
    { x: 5, y: 13, kind: 'item' }, { x: 13, y: 2, kind: 'item' }, { x: 8, y: 10, kind: 'item' },
  ],
  'frontier-pyramid-c': [
    { x: 4, y: 9, kind: 'trainer' }, { x: 15, y: 12, kind: 'trainer' }, { x: 8, y: 2, kind: 'trainer' },
    { x: 12, y: 12, kind: 'item' }, { x: 5, y: 13, kind: 'item' }, { x: 16, y: 5, kind: 'item' },
  ],
};
export const PYRAMID_SPOTS_PER_FLOOR = 3;
export const PYRAMID_ENCOUNTER_RATE = 0.10;
export const PYRAMID_FLOOR_MAPS = ['frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'];
// The fixed warp cycle (F1 geometry): a -> b -> c -> a.
export const PYRAMID_NEXT_FLOOR = {
  'frontier-pyramid-a': 'frontier-pyramid-b',
  'frontier-pyramid-b': 'frontier-pyramid-c',
  'frontier-pyramid-c': 'frontier-pyramid-a',
};
// Exit warp tile per floor map (Brandon waits near it on floor 7).
export const PYRAMID_EXIT_TILES = {
  'frontier-pyramid-a': { x: 10, y: 0 },
  'frontier-pyramid-b': { x: 18, y: 0 },
  'frontier-pyramid-c': { x: 3, y: 0 },
};
export const BRANDON_TILE = { x: 10, y: 2 }; // floor 7 is always map A (1,4 are A; 7 = A in the cycle)
export const LUCY_TILE = { x: 7, y: 3 };     // the Pike dais chamber, below the podium

// Pike chamber entry landings (F1 geometry): landing y -> chamber
// number; the door index is the landing x's place in [3, 7, 11].
export const PIKE_ENTRY_ROWS = { 71: 1, 62: 2, 53: 3, 44: 4, 35: 5, 26: 6, 17: 7 };
export const PIKE_DOOR_XS = [3, 7, 11];
export const PIKE_DAIS_Y = 8;

// The symbol ITEMS row per facility ('<name>symbol', items.mjs F0).
export const SYMBOL_ITEMS = {
  tower: 'abilitysymbol', factory: 'knowledgesymbol', arena: 'gutssymbol',
  dome: 'tacticssymbol', pike: 'lucksymbol', palace: 'spiritsymbol', pyramid: 'bravesymbol',
};

// Per-facility defs. pools: generated-opponent species (roster only).
// names/titles: generated trainer dressing. brain: the Frontier Brain.
export const FACILITIES = {
  tower: {
    id: 'tower', name: 'Battle Tower', brain: 'Anabel', brainTitle: 'Salon Maiden',
    setSize: 7, healBetween: true,
    intro: 'Seven straight wins make a set at the Tower. No tricks, no mercy rounds — just trainers, one after another. At a set\'s end you may rest and resume later: the streak waits where you left it.',
    pools: ['alakazam', 'gengar', 'snorlax', 'lapras', 'dragonite', 'machamp', 'arcanine', 'gyarados', 'venusaur', 'charizard', 'blastoise', 'jolteon', 'aerodactyl', 'tauros'],
    title: 'Tower Adept',
    names: ['MIRA', 'OSLO', 'PETRA', 'JUNO', 'CASPIAN', 'VERA', 'HUGO', 'LENA', 'ORIN', 'TAMSIN'],
    brainIntro: ['So the streak brings you to me at last. I am Anabel — I read a battle the way you read a letter, all at once, every turn counted before it is taken.', 'Show me the page you are proudest of. I will be reading for the one move you did not plan.'],
    brainLose: ['...Ah. I saw the ending a breath too late. The Ability Symbol is yours — you earned every line of it.'],
  },
  factory: {
    id: 'factory', name: 'Battle Factory', brain: 'Noland', brainTitle: 'Factory Head',
    setSize: 7, healBetween: true,
    intro: 'Nobody fights with their own team at the Factory. You draft three rentals from six, and after every win you may swap one of yours for one of theirs.',
    pools: ['heracross', 'aerodactyl', 'venusaur', 'pinsir', 'scyther', 'kangaskhan', 'starmie', 'electabuzz', 'magmar', 'jynx', 'omastar', 'kabutops', 'ampharos', 'sudowoodo', 'charizard', 'blastoise'],
    title: 'Factory Hand',
    names: ['BRUNO', 'KESTREL', 'MABLE', 'IVO', 'SORREL', 'DUKE', 'PETAL', 'RANCE', 'ODILE', 'FERN'],
    brainIntro: ['Noland. I built half the machines in this building and I still like a fair draft better than any of them.', 'Your rentals against mine, Head to team. Let us see whose homework shows.'],
    brainLose: ['Ha! Out-drafted in my own factory. Take the Knowledge Symbol — you knew my team better than I did.'],
  },
  arena: {
    id: 'arena', name: 'Battle Arena', brain: 'Greta', brainTitle: 'Arena Tycoon',
    setSize: 7, healBetween: true,
    intro: 'Three turns. That is all the Arena gives you. If nobody falls, the judge scores Mind, Skill and Body — and a tie goes against the challenger. The Frontier demands a winner.',
    pools: ['heracross', 'primeape', 'hitmonlee', 'hitmonchan', 'poliwrath', 'machamp', 'breloom', 'medicham', 'hariyama', 'blaziken', 'vigoroth', 'exploud'],
    title: 'Arena Brawler',
    names: ['BRIX', 'TOMA', 'JUNIPER', 'KOBA', 'MARLOWE', 'SABLE', 'REN', 'OTTO', 'VESPER', 'HALCYON'],
    brainIntro: ['Greta. Three turns, challenger — I have ended title hopes in two. Come at me like you mean it.'],
    brainLose: ['Clean. Decisive. Everything the Arena asks for. The Guts Symbol is yours.'],
  },
  dome: {
    id: 'dome', name: 'Battle Dome', brain: 'Tucker', brainTitle: 'Dome Ace',
    setSize: 0, healBetween: true,
    intro: 'Sixteen entrants, one bracket, no second chances. Win four matches and the Dome is yours — the crowd does the rest. The matches you are not in are decided off-screen, and the desk calls every result by name.',
    pools: ['swampert', 'charizard', 'salamence', 'metagross', 'flygon', 'altaria', 'aggron', 'walrein', 'camerupt', 'sceptile', 'blaziken', 'gardevoir', 'milotic', 'kingdra'],
    title: 'Dome Contender',
    names: ['ASHFORD', 'BLAZE', 'COMET', 'DARIO', 'EMBER', 'FLINT', 'GLORIA', 'HAIL', 'IRIS', 'JET', 'KARMA', 'LOTUS', 'MAGNUM', 'NOVA', 'ONYX'],
    brainIntro: ['The crowd saved its loudest for last, and so did I. Tucker — the Dome Ace. Give them a final worth the noise.'],
    brainLose: ['Listen to that crowd — they are cheering for YOU now. The Tactics Symbol, champion. You read the bracket like a book.'],
  },
  pike: {
    id: 'pike', name: 'Battle Pike', brain: 'Lucy', brainTitle: 'Pike Queen',
    setSize: 0, healBetween: false,
    intro: 'Seven chambers, three doors each, and every door already knows what is behind it. Luck is just information you have not earned yet. And there is no free healing inside — only what the doors themselves offer.',
    pools: ['seviper', 'arbok', 'weezing', 'muk', 'crobat', 'tentacruel', 'gengar', 'shuckle', 'dunsparce', 'qwilfish', 'roselia', 'dustox', 'banette', 'ariados'],
    title: 'Pike Delver',
    names: ['MOSS', 'QUILL', 'RUE', 'THISTLE', 'UMBRA', 'VIPER', 'WREN', 'YEW'],
    brainIntro: ['You walked my whole serpent and arrived unbitten. I am Lucy. Let us see if your luck holds against intent.'],
    brainLose: ['...The doors themselves applaud you. Take the Luck Symbol. You make your own luck — I checked.'],
  },
  palace: {
    id: 'palace', name: 'Battle Palace', brain: 'Spencer', brainTitle: 'Palace Maven',
    setSize: 7, healBetween: true,
    intro: 'At the Palace your Pokémon choose their own moves — you are the heart, not the hand. You call nothing; you simply learn what kind of team you really raised.',
    pools: ['crobat', 'slaking', 'lapras', 'arcanine', 'exeggutor', 'slowbro', 'starmie', 'gardevoir', 'altaria', 'tropius', 'grumpig', 'xatu', 'noctowl', 'togetic'],
    title: 'Palace Guest',
    names: ['ALDER', 'BRIAR', 'CEDAR', 'DAPHNE', 'ELDER', 'FENNEL', 'GROVE', 'HAZEL', 'IRVING', 'LAUREL'],
    brainIntro: ['Spencer. Rest a moment in the garden quiet, trainer. Here we both simply watch — the partners decide, as they should, the way a river decides its course. May yours speak well of you.'],
    brainLose: ['Your partners chose beautifully. They trust their own hearts because you trusted them first. The Spirit Symbol is yours.'],
  },
  pyramid: {
    id: 'pyramid', name: 'Battle Pyramid', brain: 'Brandon', brainTitle: 'Pyramid King',
    setSize: 0, healBetween: false,
    intro: 'Seven floors up through the dark. No free healing, no shop, no way back but through — only what the mountain lets you carry in the Pyramid Bag. And the Bag empties when the climb ends, so spend what you find while the mountain lets you.',
    pools: ['golbat', 'graveler', 'onix', 'steelix', 'claydol', 'nosepass', 'solrock', 'lunatone', 'geodude', 'rhyhorn', 'phanpy', 'larvitar', 'aron', 'baltoy'],
    title: 'Pyramid Delver',
    names: ['BASALT', 'CINDER', 'DELTA', 'EMBER', 'FLINT', 'GRANITE', 'OCHRE', 'SLATE'],
    brainIntro: ['Seven floors of dark, and you climbed them all to stand in my light. I am Brandon. The mountain vouches for you — now convince ME.'],
    brainLose: ['HA! The mountain bows, and so do I. The Brave Symbol, climber — carved out of this old hill by your own two hands, near enough.'],
    // F3: spoken instead of brainIntro whenever brandon_possessed_faced
    // is set — the silver re-challenge after the canon loss, and the
    // Gold finale. The first meeting is never repeated.
    brainRematchIntro: ['Your stance is your own again — I can see it from here, climber. Good. The stone sleeps, and so does its king.', 'This time I battle YOU. My Regis, the mountain, and no ghosts between us. Climb into it.'],
  },
};

// Authored Brain teams (species only + the ace's keepsake — see the
// header note on the trainer-def format). Levels come from the run's
// foeLevel at battle time (Open Level, decision #4).
export const BRAIN_TEAMS = {
  tower: {
    silver: [{ species: 'alakazam' }, { species: 'snorlax' }, { species: 'lapras', keepsake: 'tidepearl' }],
    gold: [{ species: 'alakazam' }, { species: 'dragonite' }, { species: 'snorlax', keepsake: 'championsribbon' }],
  },
  factory: {
    silver: [{ species: 'heracross' }, { species: 'aerodactyl' }, { species: 'venusaur', keepsake: 'gardeniasash' }],
    gold: [{ species: 'salamence' }, { species: 'metagross' }, { species: 'venusaur', keepsake: 'gardeniasash' }],
  },
  arena: {
    silver: [{ species: 'heracross' }, { species: 'umbreon' }, { species: 'gengar', keepsake: 'gloomfang' }],
    gold: [{ species: 'breloom' }, { species: 'umbreon' }, { species: 'gengar', keepsake: 'gloomfang' }],
  },
  dome: {
    silver: [{ species: 'swampert' }, { species: 'charizard' }, { species: 'salamence', keepsake: 'thunderheadpin' }],
    gold: [{ species: 'swampert' }, { species: 'charizard' }, { species: 'metagross', keepsake: 'thunderheadpin' }],
  },
  pike: {
    silver: [{ species: 'seviper' }, { species: 'shuckle' }, { species: 'milotic', keepsake: 'tidepearl' }],
    gold: [{ species: 'seviper' }, { species: 'gyarados' }, { species: 'milotic', keepsake: 'tidepearl' }],
  },
  palace: {
    silver: [{ species: 'crobat' }, { species: 'slaking' }, { species: 'lapras', keepsake: 'gardeniasash' }],
    gold: [{ species: 'crobat' }, { species: 'arcanine' }, { species: 'slaking', keepsake: 'secondwindribbon' }],
  },
  // BRANDON — the Pyramid King, and the Brandon mechanism
  // (RECORDED DECISION, Stage F3): the FIRST time the player reaches
  // Brandon with Silver due (slot null, climb 3, floor 7), the plain
  // milestone battle does NOT fire. What fires is the POSSESSED
  // battle, staged in game/frontier.mjs (startPossessedBrandon):
  // the sealed stone of the King of Pokélantis in Brandon's chamber
  // stirs, the spirit takes the player's voice and stance, and
  // Brandon accepts its challenge. The battle is the player's REAL
  // entered team under facility autoAlly — the Palace mechanism, the
  // spirit choosing every move; that is the honest engine truth of
  // the possession, not a rigged outcome (the forced send-out after
  // a faint stays player-chosen, the Palace adaptation) — against
  // this silver Regi trio at foeLevel + 10, a margin Brandon speaks
  // aloud in the pre-scene. Completion is FACED (the Harrison
  // predicate): a LOSS (the canon path) breaks the possession —
  // Brandon and the keeper drive the spirit back into the stone,
  // brandon_possessed_faced is set, NO symbol is awarded, the team
  // is tended inside the scene, the run stays OPEN with Brandon
  // still standing, and the plain player-controlled Silver battle
  // is re-challengeable immediately by talking to him again. An
  // upset WIN sets brandon_possessed_faced AND
  // brandon_possession_broken and awards SILVER through the shared
  // awardSymbol helper. The GOLD battle (and any later audience)
  // is never possessed: with the faced flag set, Brandon's
  // brainRematchIntro plays instead ("This time I battle YOU.").
  pyramid: {
    silver: [{ species: 'regirock' }, { species: 'registeel' }, { species: 'regice', keepsake: 'spectrebell' }],
    gold: [{ species: 'registeel', keepsake: 'ironacorn' }, { species: 'regirock', keepsake: 'fossilspur' }, { species: 'regice', keepsake: 'spectrebell' }],
  },
};

// Brain milestone battle numbers (Emerald structures, mission #5).
// Set facilities: the streak battle number at which the Brain stands.
// dome: the tournament number whose FINAL is the Brain's.
// pike: cumulative banked rooms at which the Brain waits on the dais.
// pyramid: the run number whose floor 7 is the Brain's.
export const BRAIN_MILESTONES = {
  tower: { silver: 35, gold: 70 },
  factory: { silver: 21, gold: 42 },
  arena: { silver: 14, gold: 56 },
  dome: { silver: 5, gold: 10 },
  pike: { silver: 14, gold: 140 },
  palace: { silver: 21, gold: 42 },
  pyramid: { silver: 3, gold: 10 },
};

// The per-facility record shapes (state.frontier.records.<id>) — the
// single source the default state, the client save-fill and (via
// these field names) both validators rebuild against.
export const RECORD_FIELDS = {
  tower: ['bestStreak', 'totalWins'],
  factory: ['bestStreak', 'totalWins'],
  arena: ['bestStreak', 'totalWins'],
  dome: ['tournaments', 'tournamentWins', 'bestFinish'],
  pike: ['bestRun', 'totalRooms'],
  palace: ['bestStreak', 'totalWins'],
  pyramid: ['bestFloor', 'runs'],
};
export function freshRecords() {
  const out = {};
  for (const id of FACILITY_IDS) {
    out[id] = {};
    for (const f of RECORD_FIELDS[id]) out[id][f] = 0;
  }
  return out;
}
export function freshFrontierState() {
  return { records: freshRecords(), run: null, pyramidBag: [] };
}
