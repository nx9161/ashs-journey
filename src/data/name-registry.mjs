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
// No name may echo a protected franchise name's sound or structure
// closely enough to read as a respelling (General Counsel gate).
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
    // -- Wave G Kanto Completion, Tranche 1 (coordinator-named) --
    caterpie:  { name: 'FRONLET', status: 'named', wave: 'G-KT1', design: 'fronlet' },
    metapod:   { name: 'COCOVEL', status: 'named', wave: 'G-KT1', design: 'cocovel' },
    butterfree: { name: 'PRISMWING', status: 'named', wave: 'G-KT1', design: 'prismwing' },
    pinkbutterfree: { name: 'Pink PRISMWING', status: 'named', wave: 'G-KT1', design: 'prismwing-pink' },
    weedle:    { name: 'THORNIB', status: 'named', wave: 'G-KT1', design: 'thornib' },
    kakuna:    { name: 'SPIKOON', status: 'named', wave: 'G-KT1', design: 'spikoon' },
    beedrill:  { name: 'LANCEWASP', status: 'named', wave: 'G-KT1', design: 'lancewasp' },
    pidgey:    { name: 'DUNPLUME', status: 'named', wave: 'G-KT1', design: 'dunplume' },
    pidgeotto: { name: 'GUSTPLUME', status: 'named', wave: 'G-KT1', design: 'gustplume' },
    pidgeot:   { name: 'AERARCH', status: 'named', wave: 'G-KT1', design: 'aerarch' },
    rattata:   { name: 'SCURRAT', status: 'named', wave: 'G-KT1', design: 'scurrat' },
    raticate:  { name: 'GNAWBRUTE', status: 'named', wave: 'G-KT1', design: 'gnawbrute' },
    spearow:   { name: 'KEENBEAK', status: 'named', wave: 'G-KT1', design: 'keenbeak' },
    fearow:    { name: 'GLAREHAWK', status: 'named', wave: 'G-KT1', design: 'glarehawk' },
    ekans:     { name: 'VIPLET', status: 'named', wave: 'G-KT1', design: 'viplet' },
    arbok:     { name: 'DREADHOOD', status: 'named', wave: 'G-KT1', design: 'dreadhood' },
    // -- Wave G Kanto Completion, Tranche 2 (coordinator-named) --
    raichu:    { name: 'GALVANIK', status: 'named', wave: 'G-KT2', design: 'galvanik' },
    sandshrew: { name: 'ARMADUNE', status: 'named', wave: 'G-KT2', design: 'armadune' },
    sandslash: { name: 'QUILLDUNE', status: 'named', wave: 'G-KT2', design: 'quilldune' },
    nidoranf:  { name: 'TOXIKIT', status: 'named', wave: 'G-KT2', design: 'toxikit' },
    nidorina:  { name: 'VENOBELLE', status: 'named', wave: 'G-KT2', design: 'venobelle' },
    nidoqueen: { name: 'REGITOXA', status: 'named', wave: 'G-KT2', design: 'regitoxa' },
    nidoranm:  { name: 'TOXIBUCK', status: 'named', wave: 'G-KT2', design: 'toxibuck' },
    nidorino:  { name: 'THORNBUCK', status: 'named', wave: 'G-KT2', design: 'thornbuck' },
    nidoking:  { name: 'REGITHORN', status: 'named', wave: 'G-KT2', design: 'regithorn' },
    clefairy:  { name: 'MOONLET', status: 'named', wave: 'G-KT2', design: 'moonlet' },
    clefable:  { name: 'LUNAVEIL', status: 'named', wave: 'G-KT2', design: 'lunaveil' },
    ninetales: { name: 'PYCANIS', status: 'named', wave: 'G-KT2', design: 'pycanis' },
    jigglypuff: { name: 'PUFFUNE', status: 'named', wave: 'G-KT2', design: 'puffune' },
    wigglytuff: { name: 'ARIABLOOM', status: 'named', wave: 'G-KT2', design: 'ariabloom' },
    farfetchd: { name: 'POSTDUCK', status: 'named', wave: 'G-KT2', design: 'postduck' },
    // -- Wave G Kanto Completion, Tranche 3 (coordinator-named) --
    // zubat line: chain continues to crobat (Johto) — lines entry
    // waits for the Johto wave so `lines` only lists complete chains.
    zubat:     { name: 'SKREEP', status: 'named', wave: 'G-KT3', design: 'skreep' },
    golbat:    { name: 'GLOOMBITE', status: 'named', wave: 'G-KT3', design: 'gloombite' },
    oddish:    { name: 'NIGHTBUD', status: 'named', wave: 'G-KT3', design: 'nightbud' },
    gloom:     { name: 'DROOPETAL', status: 'named', wave: 'G-KT3', design: 'droopetal' },
    vileplume: { name: 'BLOOMROT', status: 'named', wave: 'G-KT3', design: 'bloomrot' },
    paras:     { name: 'FUNGLING', status: 'named', wave: 'G-KT3', design: 'fungling' },
    parasect:  { name: 'MYCELORD', status: 'named', wave: 'G-KT3', design: 'mycelord' },
    venonat:   { name: 'FUZZMITE', status: 'named', wave: 'G-KT3', design: 'fuzzmite' },
    venomoth:  { name: 'DUSTVEIL', status: 'named', wave: 'G-KT3', design: 'dustveil' },
    diglett:   { name: 'MOLING', status: 'named', wave: 'G-KT3', design: 'moling' },
    dugtrio:   { name: 'TRIMOLE', status: 'named', wave: 'G-KT3', design: 'trimole' },
    meowth:    { name: 'TINKLETOM', status: 'named', wave: 'G-KT3', design: 'tinkletom' },
    persian:   { name: 'MAJESTOM', status: 'named', wave: 'G-KT3', design: 'majestom' },
    psyduck:   { name: 'DIZDUCK', status: 'named', wave: 'G-KT3', design: 'dizduck' },
    golduck:   { name: 'TORRIDUCK', status: 'named', wave: 'G-KT3', design: 'torriduck' },
    // -- Wave G Kanto Completion, Tranche 4 (coordinator-named) --
    mankey:    { name: 'FUSSAPE', status: 'named', wave: 'G-KT4', design: 'fussape' },
    primeape:  { name: 'WRATHAPE', status: 'named', wave: 'G-KT4', design: 'wrathape' },
    growlithe: { name: 'CINDERPUP', status: 'named', wave: 'G-KT4', design: 'cinderpup' },
    arcanine:  { name: 'EMBERMANE', status: 'named', wave: 'G-KT4', design: 'embermane' },
    poliwag:   { name: 'TADLET', status: 'named', wave: 'G-KT4', design: 'tadlet' },
    poliwhirl: { name: 'WHIRLBOG', status: 'named', wave: 'G-KT4', design: 'whirlbog' },
    poliwrath: { name: 'BRAWLTOAD', status: 'named', wave: 'G-KT4', design: 'brawltoad' },
    abra:      { name: 'NAPSEER', status: 'named', wave: 'G-KT4', design: 'napseer' },
    kadabra:   { name: 'ORAKIN', status: 'named', wave: 'G-KT4', design: 'orakin' },
    alakazam:  { name: 'MENTARCH', status: 'named', wave: 'G-KT4', design: 'mentarch' },
    machop:    { name: 'MUSCLING', status: 'named', wave: 'G-KT4', design: 'muscling' },
    machoke:   { name: 'HEFTOR', status: 'named', wave: 'G-KT4', design: 'heftor' },
    machamp:   { name: 'QUADRAX', status: 'named', wave: 'G-KT4', design: 'quadrax' },
    tentacool: { name: 'STINGEL', status: 'named', wave: 'G-KT4', design: 'stingel' },
    tentacruel: { name: 'ABYSSGEL', status: 'named', wave: 'G-KT4', design: 'abyssgel' },
    // -- Wave G Kanto Completion, Tranche 5 (coordinator-named) --
    bellsprout: { name: 'PITCHLET', status: 'named', wave: 'G-KT5', design: 'pitchlet' },
    weepinbell: { name: 'HANGCUP', status: 'named', wave: 'G-KT5', design: 'hangcup' },
    victreebel: { name: 'PITCHLORD', status: 'named', wave: 'G-KT5', design: 'pitchlord' },
    geodude:   { name: 'RUMBLING', status: 'named', wave: 'G-KT5', design: 'rumbling' },
    graveler:  { name: 'CRAGBRUTE', status: 'named', wave: 'G-KT5', design: 'cragbrute' },
    golem:     { name: 'TECTON', status: 'named', wave: 'G-KT5', design: 'tecton' },
    ponyta:    { name: 'EMBERFOAL', status: 'named', wave: 'G-KT5', design: 'emberfoal' },
    rapidash:  { name: 'PYROGALOP', status: 'named', wave: 'G-KT5', design: 'pyrogalop' },
    slowpoke:  { name: 'DOZELING', status: 'named', wave: 'G-KT5', design: 'dozeling' },
    slowbro:   { name: 'DOZEHIDE', status: 'named', wave: 'G-KT5', design: 'dozehide' },
    magnemite: { name: 'COILORB', status: 'named', wave: 'G-KT5', design: 'coilorb' },
    magneton:  { name: 'TRICOIL', status: 'named', wave: 'G-KT5', design: 'tricoil' },
    doduo:     { name: 'TWINBEAK', status: 'named', wave: 'G-KT5', design: 'twinbeak' },
    dodrio:    { name: 'TRIBEAK', status: 'named', wave: 'G-KT5', design: 'tribeak' },
    // -- Wave G Kanto Completion, Tranche 6 (coordinator-named) --
    seel:      { name: 'FLOPLET', status: 'named', wave: 'G-KT6', design: 'floplet' },
    dewgong:   { name: 'FROSTINE', status: 'named', wave: 'G-KT6', design: 'frostine' },
    grimer:    { name: 'SLUDGLING', status: 'named', wave: 'G-KT6', design: 'sludgling' },
    muk:       { name: 'MIREMASS', status: 'named', wave: 'G-KT6', design: 'miremass' },
    shellder:  { name: 'CLAMLET', status: 'named', wave: 'G-KT6', design: 'clamlet' },
    cloyster:  { name: 'SPIKSHELL', status: 'named', wave: 'G-KT6', design: 'spikshell' },
    gastly:    { name: 'VAPLUME', status: 'named', wave: 'G-KT6', design: 'vaplume' },
    haunter:   { name: 'VAPHAUNT', status: 'named', wave: 'G-KT6', design: 'vaphaunt' },
    gengar:    { name: 'GRIMSHADE', status: 'named', wave: 'G-KT6', design: 'grimshade' },
    onix:      { name: 'STRATON', status: 'named', wave: 'G-KT6', design: 'straton' },
    crystalonix: { name: 'Crystal STRATON', status: 'named', wave: 'G-KT6', design: 'straton-crystal' },
    drowzee:   { name: 'DREAMPIR', status: 'named', wave: 'G-KT6', design: 'dreampir' },
    hypno:     { name: 'SOMNOLORD', status: 'named', wave: 'G-KT6', design: 'somnolord' },
    krabby:    { name: 'CLAWLET', status: 'named', wave: 'G-KT6', design: 'clawlet' },
    kingler:   { name: 'PINCHARCH', status: 'named', wave: 'G-KT6', design: 'pincharch' },
    // -- Wave G Kanto Completion, Tranche 7 (coordinator-named) --
    voltorb:   { name: 'CELLORB', status: 'named', wave: 'G-KT7', design: 'cellorb' },
    electrode: { name: 'MEGACELL', status: 'named', wave: 'G-KT7', design: 'megacell' },
    exeggcute: { name: 'PODCLUMP', status: 'named', wave: 'G-KT7', design: 'podclump' },
    exeggutor: { name: 'GOURDTREE', status: 'named', wave: 'G-KT7', design: 'gourdtree' },
    cubone:    { name: 'FOSSLET', status: 'named', wave: 'G-KT7', design: 'fosslet' },
    marowak:   { name: 'FOSSILORD', status: 'named', wave: 'G-KT7', design: 'fossilord' },
    hitmonlee: { name: 'SPRINGLEG', status: 'named', wave: 'G-KT7', design: 'springleg' },
    hitmonchan: { name: 'PUNCHBOX', status: 'named', wave: 'G-KT7', design: 'punchbox' },
    lickitung: { name: 'SLURPARD', status: 'named', wave: 'G-KT7', design: 'slurpard' },
    koffing:   { name: 'FUMORB', status: 'named', wave: 'G-KT7', design: 'fumorb' },
    weezing:   { name: 'TWINSMOG', status: 'named', wave: 'G-KT7', design: 'twinsmog' },
    rhyhorn:   { name: 'PLATLET', status: 'named', wave: 'G-KT7', design: 'platlet' },
    rhydon:    { name: 'PLATOR', status: 'named', wave: 'G-KT7', design: 'plator' },
    chansey:   { name: 'NURSELING', status: 'named', wave: 'G-KT7', design: 'nurseling' },
  },

  // Evolution lines fully renamed so far (slot ids, in order).
  lines: {
    buddin: ['bulbasaur', 'ivysaur', 'venusaur'],
    embry: ['charmander', 'charmeleon', 'charizard'],
    bublet: ['squirtle', 'wartortle', 'blastoise'],
    fronlet: ['caterpie', 'metapod', 'butterfree'],
    thornib: ['weedle', 'kakuna', 'beedrill'],
    dunplume: ['pidgey', 'pidgeotto', 'pidgeot'],
    scurrat: ['rattata', 'raticate'],
    keenbeak: ['spearow', 'fearow'],
    viplet: ['ekans', 'arbok'],
    voltik: ['pikachu', 'raichu'],
    armadune: ['sandshrew', 'sandslash'],
    toxikit: ['nidoranf', 'nidorina', 'nidoqueen'],
    toxibuck: ['nidoranm', 'nidorino', 'nidoking'],
    moonlet: ['clefairy', 'clefable'],
    vulcanis: ['vulpix', 'ninetales'],
    puffune: ['jigglypuff', 'wigglytuff'],
    nightbud: ['oddish', 'gloom', 'vileplume'],
    fungling: ['paras', 'parasect'],
    fuzzmite: ['venonat', 'venomoth'],
    moling: ['diglett', 'dugtrio'],
    tinkletom: ['meowth', 'persian'],
    dizduck: ['psyduck', 'golduck'],
    fussape: ['mankey', 'primeape'],
    cinderpup: ['growlithe', 'arcanine'],
    tadlet: ['poliwag', 'poliwhirl', 'poliwrath'],
    napseer: ['abra', 'kadabra', 'alakazam'],
    muscling: ['machop', 'machoke', 'machamp'],
    stingel: ['tentacool', 'tentacruel'],
    pitchlet: ['bellsprout', 'weepinbell', 'victreebel'],
    rumbling: ['geodude', 'graveler', 'golem'],
    emberfoal: ['ponyta', 'rapidash'],
    dozeling: ['slowpoke', 'slowbro'],
    coilorb: ['magnemite', 'magneton'],
    twinbeak: ['doduo', 'dodrio'],
    floplet: ['seel', 'dewgong'],
    sludgling: ['grimer', 'muk'],
    clamlet: ['shellder', 'cloyster'],
    vaplume: ['gastly', 'haunter', 'gengar'],
    dreampir: ['drowzee', 'hypno'],
    clawlet: ['krabby', 'kingler'],
    cellorb: ['voltorb', 'electrode'],
    podclump: ['exeggcute', 'exeggutor'],
    fosslet: ['cubone', 'marowak'],
    fumorb: ['koffing', 'weezing'],
    platlet: ['rhyhorn', 'rhydon'],
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
