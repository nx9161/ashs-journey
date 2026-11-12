// name-registry.mjs — Wave G name registry: the SINGLE SOURCE OF TRUTH
// for the original-names program (owner full-production order,
// 2026-11-12 01:02 EST, War Room record). Scope: the roster count,
// evolution chains, type coverage/assignments, ability/move
// mechanics and the story are UNCHANGED — names and forms are
// original everywhere: species, abilities, moves, coined terms,
// places, items. All game text remains the project's own original
// writing (Wave D census: canon 'original').
//
// NAMING STYLE GUIDE (from the owner's picks; binding for bulk
// naming): short punchy portmanteaus, 5-9 letters, trait + form
// fused (VOLTIK, EMBRY, BUBLET, BUDDIN); lines escalate — first
// stage small/cute, final stage grand (INFERNOX, ABYSSAR,
// TERRABLOOM); legendaries in a sovereign register (OMNIGEN).
// No name may echo a Nintendo name's sound or structure closely
// enough to read as a respelling (General Counsel clean-room gate).
//
// Status values: 'locked' = owner-picked or owner-approved canon;
// 'named' = coordinator-named under the style guide (owner can
// overrule on sight); 'pending' = not yet renamed.
// The registry is updated EVERY wave; tests/name-registry-checks.mjs
// proves the shipped data tables cannot drift from it.
//
// Species entries: { name, status, wave, design } — design is the
// archived conversion source in assets/sprites/designs/ (null until
// the slot's generated face lands). Slots keep their ids, types,
// stats, learnsets and story placement (1:1 replacement).

export const NAME_REGISTRY = {
  species: {
    // -- Wave G Milestone 1: headline + pilot (LOCKED canon) --
    // The mascot exists as two records of one creature (the follower
    // 'partner' and the wild species 'pikachu', both dexNo 25); the
    // VOLTIK design and name cover both so the dex never shows two
    // faces for one slot.
    partner:   { name: 'VOLTIK', status: 'locked', wave: 'G-M1', design: 'voltik' },
    pikachu:   { name: 'VOLTIK', status: 'locked', wave: 'G-M1', design: 'voltik' },
    // Kanto starter lines — fully owner-named at every stage.
    bulbasaur: { name: 'BUDDIN', status: 'locked', wave: 'G-M1', design: 'buddin' },
    ivysaur:   { name: 'SAPLINT', status: 'locked', wave: 'G-M1', design: 'saplint' },
    venusaur:  { name: 'TERRABLOOM', status: 'locked', wave: 'G-M1', design: 'terrabloom' },
    charmander: { name: 'EMBRY', status: 'locked', wave: 'G-M1', design: 'embry' },
    charmeleon: { name: 'EMBRION', status: 'locked', wave: 'G-M1', design: 'embrion' },
    charizard: { name: 'INFERNOX', status: 'locked', wave: 'G-M1', design: 'infernox' },
    squirtle:  { name: 'BUBLET', status: 'locked', wave: 'G-M1', design: 'bublet' },
    wartortle: { name: 'WAVLEEN', status: 'locked', wave: 'G-M1', design: 'wavleen' },
    blastoise: { name: 'ABYSSAR', status: 'locked', wave: 'G-M1', design: 'abyssar' },
    // Kanto legendary slot (sovereign register).
    mewtwo:    { name: 'OMNIGEN', status: 'locked', wave: 'G-M1', design: 'omnigen' },
    // Director-named pilot four, owner-approved — type/role-matched
    // slots: ember fox -> the fire fox slot; fin-crowned water
    // serpent -> the elegant water serpent slot; storm hawk -> the
    // electric/flying raptor slot; crystal tortoise -> the
    // continent tortoise slot.
    vulpix:    { name: 'VULCANIS', status: 'locked', wave: 'G-M1', design: 'vulcanis' },
    milotic:   { name: 'UNDINARA', status: 'locked', wave: 'G-M1', design: 'undinara' },
    zapdos:    { name: 'FULMINIS', status: 'locked', wave: 'G-M1', design: 'fulminis' },
    torterra:  { name: 'MOSSAIC', status: 'locked', wave: 'G-M1', design: 'mossaic' },
  },

  // Evolution lines fully renamed so far (slot ids, in order).
  lines: {
    buddin: ['bulbasaur', 'ivysaur', 'venusaur'],
    embry: ['charmander', 'charmeleon', 'charizard'],
    bublet: ['squirtle', 'wartortle', 'blastoise'],
  },

  // -- Places (registry extension, owner order 2026-11-12 00:54) --
  // Display names only: maps, layouts, warps and story are identical.
  // Entries keyed by MAPS id: { name, status, wave }. The places
  // wave populates every settlement (62 at Wave C census) + routes;
  // tests/name-registry-checks.mjs validates each entry against the
  // merged MAPS table and the map's live `name` field.
  places: {},

  // -- Full-production sections (charter 2026-11-12 01:02) --
  // Same entry shape, keyed by the table id of the thing renamed:
  // moves: MOVES id -> { name, status, wave }; abilities likewise
  // (if/when the ability table is introduced); items: ITEMS id;
  // terms: coined vocabulary (balls, leagues, mechanics coinages).
  moves: {},
  abilities: {},
  items: {},
  terms: {},
};

// The 15 owner-locked canon names of the headline round (closed
// 2026-11-12 01:06 EST; further headline batches only on the
// owner's call). VOLTIK appears once though it covers two records.
export const LOCKED_CANON = [
  'VOLTIK', 'EMBRY', 'EMBRION', 'INFERNOX',
  'BUBLET', 'WAVLEEN', 'ABYSSAR',
  'BUDDIN', 'SAPLINT', 'TERRABLOOM',
  'OMNIGEN', 'MOSSAIC', 'VULCANIS', 'UNDINARA', 'FULMINIS',
];
