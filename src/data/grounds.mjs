// grounds.mjs — Rejuvenation Phase 2 (ADR-025 §1): Grounds (field effects).
// Every battlefield has a Ground, derived at battle start from the map the
// battle starts in (indoors overrides outdoors by construction). A Ground
// is exactly three rules: one type at x1.2 damage, one type at x0.8, and
// one twist. Hard caps (owner law): never stronger than x1.2 / x0.8, never
// creates or removes an immunity, NO chip damage anywhere. Modifiers are
// symmetric — the same factors apply to player and foe; there is no side
// flag in this data shape, so none can be added silently.
//
// R2 (owner ruling, §9): on Story difficulty resolveField() halves the
// type modifiers (x1.1 / x0.9) and disables twists entirely — the field
// object handed to the engines already reflects that, so no engine ever
// re-checks difficulty.
//
// Aliases (Volt/Marsh/Pyre/Spirit) share the RULES object of their parent
// Ground by reference and keep only their own display name / banner /
// tint, exactly as the spec's gym table decides.

function rules(boostType, dampenType, twist) {
  return { boostType, dampenType, twist };
}
const OPEN_RULES = rules(null, null, null);
const BLOOM_RULES = rules('grass', 'fire', 'heal');
const STORM_RULES = rules('electric', 'ground', 'storm');
const MIRE_RULES = rules('ground', 'electric', 'mire');
const GRAVE_RULES = rules('ghost', 'psychic', 'status');
const EMBER_RULES = rules('fire', 'water', 'burn');
const FROST_RULES = rules('ice', 'fire', 'frost');
const TIDE_RULES = rules('water', 'electric', 'tide');
const RUBBLE_RULES = rules('rock', 'grass', 'rubble');
const MIND_RULES = rules('psychic', 'ghost', 'status');
const VENOM_RULES = rules('poison', 'psychic', 'poison');

function ground(id, name, r, banner, tint) {
  return {
    id, name, rules: r,
    boostType: r.boostType, dampenType: r.dampenType, twist: r.twist,
    banner, tint,
  };
}

export const GROUNDS = {
  open: ground('open', 'Open Ground', OPEN_RULES, null, null),
  bloom: ground('bloom', 'Bloom Ground', BLOOM_RULES,
    'The arena is a Bloom Ground — Grass moves hit harder here, and healing blooms fuller.', '#58c94f'),
  storm: ground('storm', 'Storm Ground', STORM_RULES,
    'The arena is a Storm Ground — Electric moves hit harder here, and strike swift and true.', '#e8c832'),
  mire: ground('mire', 'Mire Ground', MIRE_RULES,
    'The arena is a Mire Ground — Ground moves hit harder here, and the mud drags at the unadapted.', '#8a6a42'),
  grave: ground('grave', 'Grave Ground', GRAVE_RULES,
    'The arena is a Grave Ground — Ghost moves hit harder here, and status rites falter.', '#7a5aa0'),
  ember: ground('ember', 'Ember Ground', EMBER_RULES,
    'The arena is an Ember Ground — Fire moves hit harder here, and burns catch more easily.', '#e06828'),
  frost: ground('frost', 'Frost Ground', FROST_RULES,
    'The arena is a Frost Ground — Ice moves hit harder here, and footing turns treacherous.', '#7ac2e8'),
  tide: ground('tide', 'Tide Ground', TIDE_RULES,
    'The arena is a Tide Ground — Water moves hit harder here, and special moves ride the current.', '#3a7ad0'),
  rubble: ground('rubble', 'Rubble Ground', RUBBLE_RULES,
    'The arena is a Rubble Ground — Rock moves hit harder here, and physical moves land true.', '#a8895a'),
  mind: ground('mind', 'Mind Ground', MIND_RULES,
    'The arena is a Mind Ground — Psychic moves hit harder here, and status rites falter.', '#c85a9a'),
  venom: ground('venom', 'Venom Ground', VENOM_RULES,
    'The arena is a Venom Ground — Poison moves hit harder here, and venom seeps in more easily.', '#9848a8'),
  volt: ground('volt', 'Volt Ground', STORM_RULES,
    'The arena is a Volt Ground — Electric moves hit harder here, and strike swift and true.', '#e8c832'),
  marsh: ground('marsh', 'Marsh Ground', BLOOM_RULES,
    'The arena is a Marsh Ground — Grass moves hit harder here, and healing blooms fuller.', '#58c94f'),
  pyre: ground('pyre', 'Pyre Ground', EMBER_RULES,
    'The arena is a Pyre Ground — Fire moves hit harder here, and burns catch more easily.', '#e06828'),
  spirit: ground('spirit', 'Spirit Ground', MIRE_RULES,
    'The arena is a Spirit Ground — Ground moves hit harder here, and the earth drags at the unadapted.', '#8a6a42'),
};

// map id -> groundId. Every Arden map in the merged MAPS table is assigned
// explicitly (70 unique ids across maps.mjs/maps2/maps3/maps4 — interiors
// that are shared, 'center'/'mart', resolve Open). Unmapped ids fall back
// to Open in groundForMap(), so a future map can never crash a battle.
export const MAP_GROUND = {
  pallet: 'open',
  route1: 'open',
  viridian: 'open',
  center: 'open',
  mart: 'open', // World Art Wave 5b: the shared Mart interior
  route2: 'bloom', // Route 2 carries the Fernmere Forest corridor in this build
  pewter: 'open',
  gym: 'rubble', // Flintridge Gym — Brock
  route3: 'bloom',
  moon1: 'rubble',
  moon2: 'rubble',
  route4: 'bloom',
  cerulean: 'open',
  'gym-cerulean': 'tide', // Tidehaven Gym — Misty
  route5: 'bloom',
  route6: 'bloom',
  vermilion: 'open',
  'gym-vermilion': 'volt', // Arcport Gym — Lt. Surge
  stanne: 'tide',
  route11: 'bloom',
  route7: 'bloom',
  celadon: 'open',
  'gym-celadon': 'marsh', // Canopy Gym — Erika
  gamecorner: 'open',
  hideout: 'open',
  route8: 'bloom',
  saffron: 'open',
  'gym-saffron': 'mind', // Farsight Gym — Sabrina
  dojo: 'open',
  silph1: 'open',
  silph2: 'open',
  route9: 'rubble',
  route10: 'rubble',
  powerplant: 'storm',
  rocktunnel: 'rubble',
  lavender: 'open',
  tower1: 'grave',
  tower2: 'grave',
  route12: 'tide',
  route15: 'bloom',
  fuchsia: 'open',
  'gym-fuchsia': 'venom', // Bramble Gym — Koga
  safari: 'mire',
  route16: 'bloom',
  route19: 'tide',
  route20: 'tide',
  seafoam: 'frost',
  cinnabar: 'ember',
  'gym-cinnabar': 'pyre', // Caldera Gym — Blaine
  mansion: 'ember',
  'gym-viridian': 'spirit', // Fernmere Gym — Giovanni
  route22: 'open',
  victoryroad: 'rubble',
  indigo: 'open',
  league: 'open',
  ceruleancave: 'rubble',
  newisland: 'tide',
  // Stage O2: Amber gym/stadium signature Grounds (existing 15 only —
  // no new Grounds this stage): Cissy's lagoon range rides the Tide,
  // Danny's summit gym the Frost, Rudy's spike-stone arena the Rubble,
  // Luana's resort arena the Mind (her MENTARCH's home turf); the
  // stadium and Ivy's lab take Open, as the Crown League floor does.
  'ivy-lab': 'open',
  'mikan-gym': 'tide',
  'navel-gym': 'frost',
  'trovita-gym': 'rubble',
  'kumquat-gym': 'mind',
  'pummelo-stadium': 'open',
  // Stage J4a: Yamato west gym signature Grounds (existing 15 only —
  // no new Grounds this stage): Falkner's sky gym rides the Storm,
  // Bugsy's forest gym the Bloom, Whitney's the Open (the Plain Badge
  // is plain all the way down, by her own cheerful admission), and
  // Morty's the Grave. West landmark interiors follow their feel:
  // Newleaf Tower blooms, the DOZPOTAM Well runs Tide-wet, the Burned
  // Tower is Grave ground, and the lab / Kurt's house stay Open.
  'gym-violet': 'storm', // Iris Gym — Falkner
  'gym-azalea': 'bloom', // Cinder Gym — Bugsy
  'gym-goldenrod': 'open', // Signal Gym — Whitney
  'gym-ecruteak': 'grave', // Lantern Gym — Morty
  'sprout-tower-1': 'bloom',
  'sprout-tower-2': 'bloom',
  'slowpoke-well': 'tide',
  'burned-tower-1': 'grave',
  'burned-tower-2': 'grave',
  'elm-lab': 'open',
  'kurt-house': 'open',
  // Stage J4b: Yamato east gym signature Grounds (existing 15 only —
  // no new Grounds this stage): Chuck's shore gym rides the Rubble
  // (physical moves land true where the waves hit), Jasmine's harbor
  // gym the Tide, Pryce's the Frost, Clair's the Ember (the den's
  // lava-hearted dark). Landmarks follow their feel: the lighthouse
  // and the Wrathmere Lake run Tide, the Radio Tower hums Storm, the
  // Drake's Den keeps Grave reverence, the Lastlight Stadium takes
  // Open (the league-floor precedent), and Mt. Lastlight's summit cave
  // is Frost ground.
  'gym-cianwood': 'rubble', // Tidewall Gym — Chuck
  'gym-olivine': 'tide', // Beacon Gym — Jasmine
  'gym-mahogany': 'frost', // Redwood Gym — Pryce
  'gym-blackthorn': 'ember', // Cragmoor Gym — Clair
  'lighthouse-1': 'tide',
  'lighthouse-2': 'tide',
  'lake-of-rage': 'tide',
  'radio-tower-1': 'storm',
  'radio-tower-2': 'storm',
  'radio-tower-3': 'storm',
  'dragons-den': 'grave',
  // Stage J5: the Hideout interior — a transmitter base hums,
  // so its battles ride the Storm ground.
  'rocket-hideout': 'storm',
  'silver-stadium': 'open',
  // Stage H4a: Maris west gym signature Grounds (existing 15 only —
  // no new Grounds this stage): Roxanne's quarry gym rides the Rubble,
  // Brawly's shore gym the Rubble too (physical moves land true where
  // the surf hits — the Chuck precedent), Wattson's the Volt, and
  // Flannery's the Pyre. Landmarks follow their feel: Comet Falls is
  // Rubble-dark, Mt. Smokestack's crater rim is Ember ground.
  'gym-rustboro': 'rubble', // Copperton Gym — Roxanne
  'gym-dewford': 'rubble', // Mistford Gym — Brawly
  'gym-mauville': 'volt', // Lilac Gym — Wattson
  'gym-lavaridge': 'pyre', // Steamspring Gym — Flannery
  'meteor-falls': 'rubble',
  'mt-chimney': 'ember',
  // Stage H4b: Maris east gym signature Grounds (existing 15 only):
  // Norman's honest weight rides the Open, Winona's canopy the
  // Storm, the twins' shared mind the Mind, Juan's conducted water
  // the Tide. Landmarks follow their feel likewise.
  'gym-petalburg': 'open', // Meadowbrook Gym — Norman
  'gym-fortree': 'storm', // Highbranch Gym — Winona
  'gym-mossdeep': 'mind', // Starfall Gym — Tate & Liza
  'gym-sootopolis': 'tide', // Craterlake Gym — Juan
  'mt-pyre': 'grave',
  'seafloor-cavern': 'tide',
  'cave-of-origin': 'spirit',
  'sky-pillar': 'storm',
  'mt-silver-cave': 'frost',
  // Arc 4 Stage S5a: Borea first-half gym signature Grounds (existing
  // 15 only — no new Grounds this stage): Roark's quarry gym rides the
  // Rubble, Gardenia's greenhouse the Bloom, Fantina's theatre of the
  // unseen the Grave, Maylene's bare-knuckle hall the Mind (a fighter's
  // focus). Landmarks follow their feel: the Windworks ride the Storm,
  // the Galactic tower hums Volt, Lake Candor keeps the Tide, and the
  // Repose Ruins rest on Grave ground.
  'gym-oreburgh': 'rubble', // Coalseam Gym — Roark
  'gym-eterna': 'bloom', // Heritage Gym — Gardenia
  'gym-hearthome': 'grave', // Inglenook Gym — Fantina
  'gym-veilstone': 'mind', // Shardfall Gym — Maylene
  'valley-windworks': 'storm',
  'galactic-eterna': 'volt',
  'lake-verity': 'tide',
  'solaceon-ruins': 'grave',
  // Arc 4 Stage S5b (the same 15 Grounds — no new Grounds): Wake's
  // marsh gym rides the Tide, Byron's steel gym the Rubble of the
  // mine, Candice's the Frost, Volkner's the Volt. Landmarks: the
  // HQ hums Volt like Heritage's tower, Lake Gallant keeps the Tide,
  // Lake Insight the Frost, Zenith Spire stands on Spirit ground
  // (the old earth of the first argument), and the Distortion
  // World — a grave turned inside out — rides the Grave on all
  // six of its floors.
  'gym-pastoria': 'tide', // Fenland Gym — Crasher Wake
  'gym-canalave': 'rubble', // Bridgeport Gym — Byron
  'gym-snowpoint': 'frost', // Rimefall Gym — Candice
  'gym-sunnyshore': 'volt', // Brightshore Gym — Volkner
  'galactic-hq': 'volt',
  'lake-valor': 'tide',
  'lake-acuity': 'frost',
  'spear-pillar': 'spirit',
  'distortion-entrance': 'grave',
  'distortion-depths': 'grave',
  'distortion-isles': 'grave',
  'distortion-falls': 'grave',
  'distortion-abyss': 'grave',
  'distortion-platform': 'grave',
  // World Art Wave 5b: house interiors (shared template family).
  'house-pallet-ash': 'open',
  'house-pallet-gary': 'open',
  'house-viridian': 'open',
  'house-pewter-w': 'open',
  'house-pewter-e': 'open',
  'house-cerulean': 'open',
  'house-vermilion': 'open',
  'house-celadon-w': 'open',
  'house-celadon-e': 'open',
  'house-lavender': 'open',
  'house-fuchsia': 'open',
  'house-cinnabar': 'open',
  'house-indigo': 'open',
  // War Room W-BG (No-Same-Kit fix #3): Amber Isles completion —
  // every maps5 map now assigned explicitly (existing 15 only). The
  // three shrine isles and their caves take their birds' elements
  // (Ember Isle / Rime Isle / Storm Isle), the Sanctum shrines ride
  // the Spirit with the deep shrine on the Tide below it, the four
  // Amber Sea lanes are open water, and the island towns + houses
  // take Open (the Arden town/house precedent).
  'fire-isle': 'ember',
  'fire-cave': 'ember',
  'ice-isle': 'frost',
  'ice-cave': 'frost',
  'lightning-isle': 'storm',
  'lightning-cave': 'storm',
  'shamouti-shrine': 'spirit',
  'shamouti-deep': 'tide',
  'orange-sea-north': 'tide',
  'orange-sea-east': 'tide',
  'orange-sea-west': 'tide',
  'orange-sea-central': 'tide',
  valencia: 'open',
  mikan: 'open',
  navel: 'open',
  moro: 'open',
  kumquat: 'open',
  trovita: 'open',
  shamouti: 'open',
  pummelo: 'open',
  'house-valencia': 'open',
  'house-mikan': 'open',
  'house-kumquat': 'open',
  'house-shamouti': 'open',
  // War Room W-BG: Yamato completion — every maps6 map assigned
  // explicitly (existing 15 only). The grass route chain blooms
  // (the Arden route precedent), the two sea routes ride the Tide,
  // caves and the Signal Underground are Rubble, the Frost Path
  // halls are Frost, the Maelstrom caves ride their sea, Holly
  // Forest and the National Park bloom, Chime Tower stands on
  // Spirit ground (its sister tower the Grave, its sprout tower
  // the Bloom), and the towns + houses take Open except blossom
  // Cinder/Blossom, whose flower-and-forest identity blooms.
  r29: 'bloom',
  r30: 'bloom',
  r31: 'bloom',
  r32: 'bloom',
  r33: 'bloom',
  r34: 'bloom',
  r35: 'bloom',
  r36: 'bloom',
  r37: 'bloom',
  r38: 'bloom',
  r39: 'bloom',
  r40: 'tide',
  r41: 'tide',
  r42: 'bloom',
  r43: 'bloom',
  r44: 'bloom',
  r45: 'bloom',
  r46: 'bloom',
  'route-silver': 'bloom',
  'ilex-forest': 'bloom',
  'national-park': 'bloom',
  'union-cave': 'rubble',
  'dark-cave': 'rubble',
  'mt-mortar-1': 'rubble',
  'mt-mortar-2': 'rubble',
  'goldenrod-underground-1': 'rubble',
  'goldenrod-underground-2': 'rubble',
  'mt-silver': 'rubble',
  'ice-path-1': 'frost',
  'ice-path-2': 'frost',
  'whirl-islands-1': 'tide',
  'whirl-islands-2': 'tide',
  'bell-tower-1': 'spirit',
  'bell-tower-2': 'spirit',
  newbark: 'open',
  violet: 'open',
  ecruteak: 'open',
  goldenrod: 'open',
  olivine: 'open',
  cianwood: 'open',
  mahogany: 'open',
  blackthorn: 'open',
  silvertown: 'open',
  azalea: 'bloom',
  cherrygrove: 'bloom',
  'dance-theater': 'open',
  daycare: 'open',
  'house-newbark': 'open',
  'house-violet': 'open',
  'house-azalea': 'open',
  'house-goldenrod': 'open',
  'house-ecruteak': 'open',
  'house-olivine': 'open',
  'house-cianwood': 'open',
  'house-mahogany': 'open',
  'house-blackthorn': 'open',
  'house-cherrygrove': 'open',
  'house-silvertown': 'open',
  // War Room W-BG: Maris completion — every maps7 map assigned
  // explicitly (existing 15 only). The sea routes and trenches
  // ride the Tide; the grass chain blooms; the desert (r111) and
  // the ash fields (r113, the Ragged Pass, Ashfall Town) stand on
  // Mire earth; the wet jungle of r119 is Marsh; the Regi tombs
  // stand on Spirit (the Sea Tomb on Frost, its ice floor); the
  // volcanic interiors burn Ember; caves and the Crown Road are
  // Rubble; Steamspring Town takes Ember (the Caldera precedent)
  // and Craterlake + Driftlog ride their water; towns, houses,
  // contest halls and the League floor take Open by precedent.
  r101: 'bloom',
  r102: 'bloom',
  r103: 'tide',
  r104: 'bloom',
  r105: 'tide',
  r106: 'tide',
  r107: 'tide',
  r108: 'tide',
  r109: 'tide',
  r110: 'bloom',
  r111: 'mire',
  r112: 'bloom',
  r113: 'mire',
  r114: 'bloom',
  r115: 'bloom',
  r116: 'bloom',
  r117: 'bloom',
  r118: 'bloom',
  r119: 'marsh',
  r120: 'bloom',
  r121: 'bloom',
  r122: 'tide',
  r123: 'bloom',
  r124: 'tide',
  'r124-underwater': 'tide',
  r125: 'tide',
  r126: 'tide',
  'r126-underwater': 'tide',
  r127: 'tide',
  'r127-underwater': 'tide',
  r128: 'tide',
  'r128-underwater': 'tide',
  r129: 'tide',
  r130: 'tide',
  r131: 'tide',
  r132: 'tide',
  r133: 'tide',
  r134: 'tide',
  'petalburg-woods': 'bloom',
  'jagged-pass': 'mire',
  fallarbor: 'mire',
  evergrande: 'bloom',
  fortree: 'bloom',
  verdanturf: 'bloom',
  sootopolis: 'tide',
  pacifidlog: 'tide',
  lavaridge: 'ember',
  'fiery-path': 'ember',
  'magma-hideout': 'ember',
  'scorched-slab': 'ember',
  'aqua-hideout': 'tide',
  'ancient-tomb': 'spirit',
  'desert-ruins': 'spirit',
  'island-cave': 'frost',
  'shoal-cave': 'frost',
  'granite-cave': 'rubble',
  'rusturf-tunnel': 'rubble',
  'victory-road-maris': 'rubble',
  littleroot: 'open',
  oldale: 'open',
  petalburg: 'open',
  rustboro: 'open',
  dewford: 'open',
  slateport: 'open',
  mauville: 'open',
  lilycove: 'open',
  mossdeep: 'open',
  'birch-lab': 'open',
  'league-evergrande': 'open',
  'contest-verdanturf': 'open',
  'contest-slateport': 'open',
  'contest-fallarbor': 'open',
  'contest-lilycove': 'open',
  'house-littleroot': 'open',
  'house-littleroot-rival': 'open',
  'house-oldale': 'open',
  'house-petalburg': 'open',
  'house-rustboro': 'open',
  'house-dewford': 'open',
  'house-slateport': 'open',
  'house-mauville': 'open',
  'house-verdanturf': 'open',
  'house-fallarbor': 'open',
  'house-lavaridge': 'open',
  'house-fortree': 'open',
  // War Room W-BG: Borea completion — every maps9 map assigned
  // explicitly (existing 15 only). The grass chain blooms; the
  // snow routes and Rimefall stand on Frost; the sea routes ride
  // the Tide; the desert r228 is Mire earth; the Great Mire is
  // Marsh at last and Fenland City with it; Astral Town, its
  // shrine and the Hall of Dawning stand on Spirit; the lunar
  // isles split Mind (Brightmoon's waking dream) and Grave
  // (Darkmoon's); the haunted places — Forsaken Tower, the
  // Ruined Manor, Farewell Spring, Reversal Cave — are Grave;
  // Grim Mountain and the Blaze Ironworks burn Ember; Mt. Apex,
  // the mines and Summit Road are Rubble; Revelry TV hums Volt;
  // the lake caverns ride their lakes (Candor/Gallant the Tide,
  // Insight the Frost); the Brightshore lighthouse rides the
  // Tide (the Beacon precedent); towns, houses and the League
  // chambers take Open (the league-floor precedent).
  r201: 'bloom',
  r202: 'bloom',
  r203: 'bloom',
  r204: 'bloom',
  r205: 'bloom',
  r206: 'bloom',
  r207: 'bloom',
  r208: 'bloom',
  r209: 'bloom',
  r210: 'bloom',
  'r210-north': 'bloom',
  r211: 'bloom',
  'r212-north': 'bloom',
  'r212-south': 'bloom',
  r213: 'bloom',
  r214: 'bloom',
  r215: 'bloom',
  r216: 'frost',
  r217: 'frost',
  r218: 'tide',
  r219: 'tide',
  r220: 'tide',
  r221: 'bloom',
  r222: 'bloom',
  r223: 'tide',
  r224: 'bloom',
  r225: 'bloom',
  r226: 'bloom',
  r227: 'bloom',
  r228: 'mire',
  r229: 'tide',
  r230: 'tide',
  'spring-path': 'bloom',
  'seabreak-path': 'tide',
  'eterna-forest': 'bloom',
  'amity-square': 'bloom',
  floaroma: 'bloom',
  'flower-paradise': 'bloom',
  'great-marsh-east': 'marsh',
  'great-marsh-north': 'marsh',
  'great-marsh-west': 'marsh',
  pastoria: 'marsh',
  snowpoint: 'frost',
  'snowpoint-temple': 'frost',
  'snowpoint-temple-depths': 'frost',
  'lake-acuity-cave': 'frost',
  celestic: 'spirit',
  'celestic-shrine': 'spirit',
  'hall-of-origin': 'spirit',
  'fullmoon-island': 'mind',
  'newmoon-island': 'grave',
  'lost-tower': 'grave',
  'old-chateau': 'grave',
  'sendoff-spring': 'grave',
  'turnback-cave': 'grave',
  'stark-mountain': 'ember',
  'stark-interior': 'ember',
  'fuego-ironworks': 'ember',
  'iron-island': 'rubble',
  'iron-island-mine': 'rubble',
  'oreburgh-mine': 'rubble',
  'mt-coronet-central': 'rubble',
  'mt-coronet-north': 'rubble',
  'mt-coronet-south': 'rubble',
  'ravaged-path': 'rubble',
  'victory-road': 'rubble',
  'wayward-cave': 'rubble',
  'lake-verity-cave': 'tide',
  'lake-valor-cave': 'tide',
  'sunnyshore-lighthouse': 'tide',
  'jubilife-tv': 'volt',
  twinleaf: 'open',
  sandgem: 'open',
  jubilife: 'open',
  oreburgh: 'open',
  eterna: 'open',
  hearthome: 'open',
  solaceon: 'open',
  canalave: 'open',
  veilstone: 'open',
  sunnyshore: 'open',
  'fight-area': 'open',
  'survival-area': 'open',
  'resort-area': 'open',
  'pokemon-league': 'open',
  'league-lobby': 'open',
  'league-chamber-1': 'open',
  'league-chamber-2': 'open',
  'league-chamber-3': 'open',
  'league-chamber-4': 'open',
  'league-champion': 'open',
  'rowan-lab': 'open',
  'canalave-library': 'open',
  'great-marsh-gate': 'open',
  'contest-hearthome': 'open',
  'house-twinleaf': 'open',
  'house-twinleaf-rival': 'open',
  'house-sandgem': 'open',
  'house-jubilife': 'open',
  'house-jubilife-condo': 'open',
  'house-oreburgh': 'open',
  'house-eterna': 'open',
  'house-hearthome': 'open',
  'house-hearthome-poffin': 'open',
  'house-solaceon': 'open',
  'house-solaceon-daycare': 'open',
  'house-celestic': 'open',
  'house-canalave': 'open',
  'house-pastoria': 'open',
  'house-snowpoint': 'open',
  'house-sunnyshore': 'open',
  'house-floaroma': 'open',
  'house-fight': 'open',
  'house-survival': 'open',
  'house-resort': 'open',
  'house-resort-villa': 'open',
};

export function groundForMap(mapId) {
  const id = mapId ? MAP_GROUND[mapId] : null;
  return GROUNDS[id] || GROUNDS.open;
}

// The field object both engines share (battle.field). Resolved ONCE at
// battle start. Carries EFFECTIVE factors: Story halving and twist-off are
// folded in here (R2), so engines read factors/twist and nothing else.
export function resolveField(mapId, difficulty) {
  return fieldFromGround(groundForMap(mapId), difficulty, mapId || null);
}

// Explicit pin (scripted events may name a Ground directly, §1 guardrails).
export function resolveFieldForGround(groundId, difficulty) {
  return fieldFromGround(GROUNDS[groundId] || GROUNDS.open, difficulty, null);
}

function fieldFromGround(g, difficulty, mapId) {
  const story = difficulty === 'story';
  return {
    id: g.id,
    groundId: g.id,
    name: g.name,
    mapId,
    boostType: g.boostType,
    dampenType: g.dampenType,
    boostFactor: g.boostType ? (story ? 1.1 : 1.2) : 1,
    dampenFactor: g.dampenType ? (story ? 0.9 : 0.8) : 1,
    twist: story ? null : g.twist,
    banner: g.banner,
    tint: g.tint,
  };
}

// Damage factor for a move type under a field (1 when the field is null,
// Open, or the type is neither boosted nor dampened). calcDamage() in
// formulas.mjs is the single consumer that applies this in the damage path.
export function groundFactorFor(field, moveType) {
  if (!field || !moveType) return 1;
  if (field.boostType && moveType === field.boostType) return field.boostFactor !== undefined ? field.boostFactor : 1.2;
  if (field.dampenType && moveType === field.dampenType) return field.dampenFactor !== undefined ? field.dampenFactor : 0.8;
  return 1;
}

// Healing moves (Bloom/Marsh twist): +50% restored, both engines.
export function groundHealMult(field) {
  return field && field.twist === 'heal' ? 1.5 : 1;
}

// Burn / poison infliction chance bonus in percentage POINTS, added only
// where a move can already inflict that status (Ember/Pyre: burn;
// Venom: poison). Never creates an infliction a move does not have.
export function groundStatusChanceBonus(field, status) {
  if (!field) return 0;
  if (field.twist === 'burn' && status === 'burn') return 10;
  if (field.twist === 'poison' && status === 'poison') return 10;
  return 0;
}

// Classic accuracy adjustment (probability in, probability out):
// Storm/Volt: Electric moves +5 points. Rubble: physical moves +5 points.
// Grave/Mind: status moves -10 points. Frost: every move x0.95 (the
// defender's dodge — evasion +1 stage-equivalent, dodge only, no damage).
export function groundClassicAccuracy(field, mv, p) {
  if (!field || !field.twist || !mv) return p;
  let out = p;
  if (field.twist === 'storm' && mv.type === 'electric') out += 0.05;
  else if (field.twist === 'rubble' && mv.cat === 'physical') out += 0.05;
  else if (field.twist === 'status' && mv.cat === 'status') out -= 0.10;
  if (field.twist === 'frost') out *= 0.95;
  return out;
}

// Tide classic crit bonus: for special moves, add base Speed/256 to the
// crit chance (threshold +1 stage-equivalent). Consumed via
// critChance(..., { bonus }) in formulas.mjs.
export function groundCritBonus(field, mv, baseSpeed) {
  if (!field || field.twist !== 'tide' || !mv || mv.cat !== 'special') return 0;
  return (baseSpeed || 0) / 256;
}

// Mire: mons NOT Water/Grass/Ground-typed are slowed. Classic: Speed stat
// -10% (applied at turn-order stat resolution). RT: movement -15%
// (applied at the arena movement step for the moving mon).
export const MIRE_ADAPTED_TYPES = ['water', 'grass', 'ground'];
export function mireSlows(field, types) {
  if (!field || field.twist !== 'mire' || !Array.isArray(types)) return false;
  return !types.some((t) => MIRE_ADAPTED_TYPES.includes(t));
}
export function groundMireSpeedMult(field, types) {
  return mireSlows(field, types) ? 0.9 : 1;
}
export function groundMireMoveMult(field, types) {
  return mireSlows(field, types) ? 0.85 : 1;
}

// RT cooldown multiplier for a move under the field twist:
// Storm/Volt: Electric moves x0.85. Grave/Mind: status moves x1.25.
export function groundCooldownMult(field, mv) {
  if (!field || !field.twist || !mv) return 1;
  if (field.twist === 'storm' && mv.type === 'electric') return 0.85;
  if (field.twist === 'status' && mv.cat === 'status') return 1.25;
  return 1;
}

// RT special-move projectile speed multiplier (Tide: +15%).
export function groundProjectileMult(field, mv) {
  if (!field || field.twist !== 'tide' || !mv || mv.cat !== 'special') return 1;
  return 1.15;
}

// RT physical-move lunge speed multiplier (Rubble: +15%). The lunge dash
// step in battle-rt scales by this; duration is unchanged.
export function groundLungeMult(field, mv) {
  if (!field || field.twist !== 'rubble' || !mv || mv.cat !== 'physical') return 1;
  return 1.15;
}

// Frost RT: dodge i-frames +40ms.
export function groundDodgeIframesBonus(field) {
  return field && field.twist === 'frost' ? 40 : 0;
}
