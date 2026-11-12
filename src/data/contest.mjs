// contest.mjs — Arc 3 Stage H5: Contest-lite data (coordinator ruling 7).
//
// APPEAL / JAM for every move in the game's move table, as a PARALLEL
// table keyed by move id (the recorded H5 choice: moves.mjs / moves2.mjs
// stay byte-untouched; the contest engine reads appealJamFor(id), which
// never misses — see the derivation below). Values are contest-only:
// no battle path reads them, no battle number changes.
//
// THE DERIVATION (one place, applied to every move):
//   Damaging moves (power > 0):
//     appeal = 1 + floor(power / 25)          (40->2, 65->3, 95->4, 120->5)
//            + 1 if multi-hit (effect.hits)   (a flurry reads flashy)
//            + 1 if high-crit                 (a flourish)
//            + 1 if charge / recharge         (a spectacle beat)
//            + 1 if it drains                 (an elegant siphon)
//            + 1 if fixed-level / OHKO        (a precision set piece)
//     jam    = 1 if it can also inflict a status (effect.status + chance)
//   Status moves (cat 'status'):
//     appeal = 4 (a clean presentation is the baseline)
//            = 5 for a SELF stage-raise (a showcase buff: Growth, Barrier)
//            = 3 for a foe stage-drop (Leer/Tail Whip — effective, plain)
//     jam    = 2 if it inflicts a status on the foe (Sing, Spore — the
//              startle that breaks the leader's rhythm)
//            = 1 for a foe stage-drop or a seeded snare (Leech Seed)
// Derived appeal clamps to 1..6, jam to 0..3. The hand-tuned NOTABLES
// below override the derivation for signature moves (finales, OHKO
// set pieces, the famous snoozes, and Splash — the joke that scores 1).

import { MOVES } from './moves.mjs';
import { MOVES2 } from './moves2.mjs';

const ALL_MOVES = { ...MOVES, ...MOVES2 };

// The four halls (maps7's `contestHall` field values) and the ribbon
// each awards. Ribbon ids ARE the hall ids — one ribbon per hall, no
// rank ladder (ruling 7). This list is the closed vocabulary the save
// validators check state.contest.ribbons against (emitted into
// tables.json by gen-tables — never hand-edit the generated table).
export const CONTEST_HALLS = ['verdanturf', 'fallarbor', 'slateport', 'lilycove'];
// Arc 4 Stage S4: Super Contests — Inglenook is THE Super Contest
// hall in Platinum: one hall, four ranks (Normal/Great/Ultra/Master),
// implemented as data on the shipped contest engine. Each rank is a
// hall key of its own (its own NPC field below, its own ribbon), and
// ranks unlock in sequence: a rank's `requires` is the previous
// rank's ribbon. CONTEST_RIBBONS (the validators' closed set) is the
// Maris halls PLUS the four rank ribbons — one persistence shape
// (state.contest.ribbons, the H5 quintet) serves both regions.
export const CONTEST_RANKS = {
  hearthome: [
    { key: 'hearthome-normal', label: 'Normal Rank', requires: null },
    { key: 'hearthome-great', label: 'Great Rank', requires: 'hearthome-normal' },
    { key: 'hearthome-ultra', label: 'Ultra Rank', requires: 'hearthome-great' },
    { key: 'hearthome-master', label: 'Master Rank', requires: 'hearthome-ultra' },
  ],
};
export const CONTEST_RIBBONS = [...CONTEST_HALLS,
  ...Object.values(CONTEST_RANKS).flat().map((r) => r.key)];
export const RIBBON_NAMES = {
  verdanturf: 'Wildflower Ribbon',
  fallarbor: 'Ashfall Ribbon',
  slateport: 'Fairhaven Ribbon',
  lilycove: 'Lotus Cove Ribbon',
  'hearthome-normal': 'Inglenook Ribbon (Normal Rank)',
  'hearthome-great': 'Inglenook Ribbon (Great Rank)',
  'hearthome-ultra': 'Inglenook Ribbon (Ultra Rank)',
  'hearthome-master': 'Inglenook Ribbon (Master Rank)',
};
export const CONTEST_ROUNDS = 4;

// Hand-tuned notables (36): id -> [appeal, jam]. Everything not listed
// here takes the derivation above.
export const CONTEST_NOTABLES = {
  hyperbeam: [8, 0],   // THE finale — the biggest number in the hall
  solarbeam: [7, 0],   // the charge-up is the performance
  skyattack: [7, 0],
  explosion: [7, 2],   // a bang that rattles the leader's nerve
  selfdestruct: [6, 2],
  fireblast: [6, 1],
  thunder: [6, 1],
  blizzard: [6, 1],
  hydropump: [6, 0],
  earthquake: [6, 1],  // the floor itself applauds, then wobbles
  psychic: [6, 0],     // bending spoons needs no jam
  petaldance: [6, 0],  // a storm of petals, all grace
  swordsdance: [6, 0], // the blade dance is a headliner, not a buff
  flamethrower: [5, 0],
  icebeam: [5, 0],
  surf: [5, 0],        // a whole wave, ridden
  thunderbolt: [5, 1],
  doubleedge: [5, 0],
  skullbash: [5, 0],
  triattack: [5, 1],   // three elements, three gasps
  fly: [5, 0],
  dig: [5, 0],         // the vanish-and-return bit
  agility: [5, 0],
  amnesia: [5, 0],
  dreameater: [5, 1],
  metronome: [5, 0],   // nobody knows what's coming — that's the act
  sing: [5, 2],        // a lullaby that steals the room
  guillotine: [6, 2],  // OHKO set pieces: precision with menace
  horndrill: [6, 2],
  fissure: [6, 2],
  spore: [4, 3],       // the rudest snooze in Maris
  lovelykiss: [4, 3],
  sleeppowder: [4, 3],
  hypnosis: [4, 2],
  screech: [3, 2],     // ugly to hear, great at breaking a leader
  splash: [1, 0],      // it flops. The crowd is kind. One point.
};

export function deriveAppealJam(mv) {
  if (!mv) return { appeal: 1, jam: 0 };
  const e = mv.effect || {};
  let appeal, jam = 0;
  if (mv.cat === 'status' || !(mv.power > 0)) {
    const stageKeys = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'];
    if (e.target === 'self' && stageKeys.some((k) => typeof e[k] === 'number' && e[k] > 0)) appeal = 5;
    else if (e.target === 'foe' && !e.status && stageKeys.some((k) => typeof e[k] === 'number' && e[k] < 0)) appeal = 3;
    else appeal = 4;
    if (e.status && e.target !== 'self') jam = 2;
    else if (e.seed) jam = 1;
    else if (appeal === 3) jam = 1;
  } else {
    appeal = 1 + Math.floor((mv.power || 0) / 25);
    if (e.hits) appeal += 1;
    if (mv.highcrit) appeal += 1;
    if (mv.charge || mv.recharge) appeal += 1;
    if (e.drain) appeal += 1;
    if (mv.fixedLevel || mv.ohko) appeal += 1;
    if (e.status && typeof e.chance === 'number') jam = 1;
  }
  return {
    appeal: Math.max(1, Math.min(6, appeal)),
    jam: Math.max(0, Math.min(3, jam)),
  };
}

// The parallel table: EVERY move in the game resolves here (derivation
// first, notables override). Built once at load from the move tables.
export const MOVE_APPEAL = {};
for (const id of Object.keys(ALL_MOVES)) {
  const d = deriveAppealJam(ALL_MOVES[id]);
  const n = CONTEST_NOTABLES[id];
  MOVE_APPEAL[id] = n ? { appeal: n[0], jam: n[1] } : d;
}

// The engine's one read path. Unknown ids resolve to the floor values
// rather than throwing — a contest can never crash on a move id.
export function appealJamFor(moveId) {
  return MOVE_APPEAL[moveId] || { appeal: 1, jam: 0 };
}

// The NPC fields. Three original entrants per hall, dressed Maris-era
// species, each with a 4-round script of real move ids. Scripts are
// tuned so a hall is always winnable with headliner play and always
// losable with a flop act: every scripted move scores appeal 4-5, jam
// stays 0 in Wildflower (the suite's proving hall) and <= 1 elsewhere.
export const CONTEST_NPCS = {
  verdanturf: [
    { name: 'FERN', species: 'roselia', script: ['razorleaf', 'growth', 'razorleaf', 'growth'] },
    { name: 'PIOTR', species: 'pelipper', script: ['surf', 'icebeam', 'surf', 'icebeam'] },
    { name: 'MABEL', species: 'altaria', script: ['flamethrower', 'icebeam', 'flamethrower', 'icebeam'] },
  ],
  fallarbor: [
    { name: 'DUSTIN', species: 'sandslash', script: ['slash', 'dig', 'slash', 'dig'] },
    { name: 'VERA', species: 'vibrava', script: ['dig', 'flamethrower', 'dig', 'flamethrower'] },
    { name: 'RUFO', species: 'camerupt', script: ['flamethrower', 'bodyslam', 'flamethrower', 'bodyslam'] },
  ],
  slateport: [
    { name: 'CORAL', species: 'corsola', script: ['surf', 'icebeam', 'surf', 'icebeam'] },
    { name: 'BRINE', species: 'lanturn', script: ['thunderbolt', 'surf', 'thunderbolt', 'surf'] },
    { name: 'PEARL', species: 'milotic', script: ['icebeam', 'surf', 'icebeam', 'surf'] },
  ],
  lilycove: [
    { name: 'OPAL', species: 'gardevoir', script: ['triattack', 'thunderbolt', 'triattack', 'thunderbolt'] },
    { name: 'NOCT', species: 'banette', script: ['slash', 'firepunch', 'slash', 'firepunch'] },
    { name: 'LUMEN', species: 'milotic', script: ['surf', 'icebeam', 'surf', 'icebeam'] },
  ],
  // Arc 4 Stage S4: the Super Contest fields, one per Inglenook rank.
  // Scripts escalate with rank (appeal 4-5 at Normal, headliners and
  // jam at Master) on the same winnable-with-headliner-play tuning
  // law as the Maris fields.
  'hearthome-normal': [
    { name: 'MIMI', species: 'buneary', script: ['razorleaf', 'growth', 'razorleaf', 'growth'] },
    { name: 'VOLT', species: 'pachirisu', script: ['thunderbolt', 'swift', 'thunderbolt', 'swift'] },
    { name: 'PEPPER', species: 'piplup', script: ['bubblebeam', 'icebeam', 'bubblebeam', 'icebeam'] },
  ],
  'hearthome-great': [
    { name: 'SOLENNE', species: 'roserade', script: ['petaldance', 'growth', 'petaldance', 'growth'] },
    { name: 'VOLT', species: 'luxio', script: ['thunderbolt', 'slash', 'thunderbolt', 'slash'] },
    { name: 'MARIS', species: 'floatzel', script: ['surf', 'icebeam', 'surf', 'icebeam'] },
  ],
  'hearthome-ultra': [
    { name: 'SOLENNE', species: 'roserade', script: ['petaldance', 'solarbeam', 'petaldance', 'solarbeam'] },
    { name: 'ORIN', species: 'luxray', script: ['thunder', 'thunderbolt', 'thunder', 'thunderbolt'] },
    { name: 'MARIS', species: 'milotic', script: ['hydropump', 'icebeam', 'hydropump', 'icebeam'] },
  ],
  'hearthome-master': [
    { name: 'FANTINA', species: 'gengar', script: ['psychic', 'hyperbeam', 'psychic', 'hyperbeam'] },
    { name: 'ORIN', species: 'garchomp', script: ['earthquake', 'fireblast', 'earthquake', 'fireblast'] },
    { name: 'SOLENNE', species: 'roserade', script: ['solarbeam', 'petaldance', 'solarbeam', 'petaldance'] },
  ],
};
