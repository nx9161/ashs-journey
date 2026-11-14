// tiles.mjs — procedural 16x16 tile painter (PLACEHOLDER per assets/manifest.yaml).
// Palette-authored per tileset, no multiply overlays (gameux §6).
// Art Director replaces with hand-authored tileset per docs/contracts.md §1.

export const TILE_CHARS = {
  '#': 'tree', '.': 'path', ',': 'grass', '~': 'water',
  // Premium+ W0 (TX-1 prerequisite): '_' = grassground — grass texture,
  // no encounters (encounter branches key on ',' / '~' / 'W' / '.' / 'R'
  // only). Walkable ground; W5 re-dresses path cells with it.
  '_': 'grassground',
  'H': 'house', 'D': 'door', 'S': 'sign', 'G': 'gymwall',
  'E': 'gymdoor', 'C': 'centerdoor', 'F': 'flower', 'R': 'rock',
  'T': 'tree', 'B': 'rock', 'W': 'water',
  ' ': 'void',
  // Wave 2 composable architecture (assets/sprites/pix/tiles/tile-*):
  // roofs (top row of every building; one roof spans L/M/R + sign/chimney)
  a: 'roof-terra-l', b: 'roof-terra-m', c: 'roof-terra-r', q: 'roof-terra-chimney',
  d: 'roof-slate-l', e: 'roof-slate-m', f: 'roof-slate-r',
  g: 'roof-teal-l', h: 'roof-teal-m', i: 'roof-teal-r',
  j: 'roof-center-l', k: 'sign-center', l: 'roof-center-m', m: 'roof-center-r',
  X: 'sign-gym', O: 'sign-mart',
  // facades (bottom row: framed windows + exactly one door per building)
  r: 'wall-house-lit', u: 'wall-house-unlit', s: 'door-house', t: 'wall-house-plain',
  v: 'wall-wood-lit', w: 'door-wood-facade',
  x: 'wall-brick-lit', y: 'door-brick', z: 'wall-brick-plain',
  A: 'wall-center', J: 'door-center-l', K: 'door-center-r',
  P: 'wall-mart', 1: 'door-mart-l', 2: 'door-mart-r',
  U: 'wall-gym', V: 'door-gym-l', Y: 'door-gym-r',
  Z: 'wall-lab', 6: 'wall-lab-plain', 3: 'sign-lab', 4: 'door-lab-l', 5: 'door-lab-r', 0: 'door-lab-facade',
  7: 'door-wood-l', 8: 'door-wood-r',
  9: 'step',
  // town dressing (objects on the ground they stand on)
  n: 'fence', o: 'lamp', p: 'flowerbed',
  // Wave 4 nature & dungeons: cave set (wall/floor are new chars so the
  // collision class is carried by the char itself — G/N stay non-walkable
  // wall/boulder class, L joins WALKABLE as floor class) and the three
  // dungeon-interior sets (Tower stone, Vantage panel, Plant industrial).
  G: 'cavewall', L: 'cavefloor', N: 'caveboulder',
  M: 'towerwall', Q: 'towerfloor',
  I: 'silphwall', '%': 'silphfloor',
  '@': 'plantwall', '&': 'plantfloor',
  // Wave 5a interiors: dedicated tilesets per building family. Floor
  // chars are floor class (WALKABLE); wall chars are wall class. Prop
  // chars (Greek letters + '(' stool) are object class — solid except
  // the two walkable dressings ')' rug and '/' battle mat. Each prop
  // kind composites over the floor it stands on (art.mjs resolver).
  '!': 'centerfloor', ':': 'centerwall',
  '$': 'martfloor', ';': 'martwall',
  '*': 'housefloor', '<': 'housewall',
  '+': 'gymfloor', '=': 'gymwallin',
  '-': 'labfloor', '>': 'labwall',
  '?': 'annewall', '^': 'leaguewall',
  '\u03b1': 'counter', '\u03b2': 'healmachine', '\u03b3': 'pcdesk',
  '\u03b4': 'bed', '\u03b5': 'table', '\u03b6': 'chair', '\u03b7': 'shelf',
  '\u03b8': 'plant', '\u03b9': 'martshelf', '\u03ba': 'goods',
  '\u03bb': 'podium', '\u03bc': 'statue', '\u03bd': 'badgecase',
  '\u03be': 'labmachine', '\u03bf': 'labtank', '\u03c0': 'labdesk',
  '\u03c1': 'cabinbed', '\u03c3': 'cabintable', '\u03c4': 'porthole',
  '\u03c5': 'slotmachine', '\u03c6': 'throne', '\u03c7': 'memorial',
  '\u03c8': 'officedesk', '\u03c9': 'sofa', '(': 'stool',
  ')': 'rug', '/': 'battlemat',
};

// ---- Premium+ W5 (TX-2): per-town identity kinds ----
// Every settlement owns five signature kinds, stamped with chars from the
// Latin-1 supplement block (single UTF-16 units, unused by any other
// system): tg = town ground (walkable, the town's street/meadow texture),
// tc = town canopy (solid, town-tinted tree), td = town dress (solid
// planter/signpost), tr = town roof (solid, the town's roof-form family),
// tl = town landmark facade (solid). Six towns also own a flora ground
// (walkable). The chars are assigned by town index in TOWN_ORDER.
export const TOWN_ORDER = ['pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar', 'indigo'];
const TG_CHARS = 'ÀÁÂÃÄÅÆÇÈÉÊ';   // U+00C0..U+00CA town ground
const TC_CHARS = 'ËÌÍÎÏÐÑÒÓÔÕ';   // U+00CB..U+00D5 town canopy
const TD_CHARS = 'Ö×ØÙÚÛÜÝÞßà';   // U+00D6..U+00E0 town dress
const TR_CHARS = 'áâãäåæçèéêë';   // U+00E1..U+00EB town roof
const TL_CHARS = 'ìíîïðñòóôõö';   // U+00EC..U+00F6 town landmark
const FLORA_CHARS = { pallet: '÷', cerulean: 'ø', celadon: 'ù', lavender: 'ú', fuchsia: 'û', cinnabar: 'ü' };
// Per-town DATA table (TX-2 palette swaps + P-4 roof-form families):
// dominant ground hex is the measured anchor of the town's ground tile
// (pairwise hue distance >= 8 deg between every pair — see W5 register).
export const TOWN_STYLE = {
  pallet:    { ground: '#9db356', form: 'hipped terracotta' },
  viridian:  { ground: '#4f9e57', form: 'gabled slate' },
  pewter:    { ground: '#b0a58e', form: 'flat stone parapet' },
  cerulean:  { ground: '#57a8a0', form: 'mansard blue-tile' },
  vermilion: { ground: '#c98d5a', form: 'copper gable' },
  celadon:   { ground: '#4fae7e', form: 'glass dome' },
  saffron:   { ground: '#c2b94e', form: 'gold spire' },
  lavender:  { ground: '#9a86b8', form: 'steep dark shingle' },
  fuchsia:   { ground: '#c47ba4', form: 'safari thatch' },
  cinnabar:  { ground: '#b0525a', form: 'basalt slab' },
  indigo:    { ground: '#6a7ab0', form: 'marble league crest' },
};
TOWN_ORDER.forEach((id, i) => {
  TILE_CHARS[TG_CHARS[i]] = 'tg-' + id;
  TILE_CHARS[TC_CHARS[i]] = 'tc-' + id;
  TILE_CHARS[TD_CHARS[i]] = 'td-' + id;
  TILE_CHARS[TR_CHARS[i]] = 'tr-' + id;
  TILE_CHARS[TL_CHARS[i]] = 'tl-' + id;
});
for (const [id, ch] of Object.entries(FLORA_CHARS)) TILE_CHARS[ch] = 'flora-' + id;
// Premium+ W5 round 2: tg2 (second town ground, walkable), th (town
// house-roof, solid — the P-4 form family on houses), tw (town
// house-wall, solid, lit window). Latin Extended-A chars, one per town.
const TG2_CHARS = 'ıĲĵķĸĺļľŀłń';   // U+0131..U+0144 town ground II
const TH_CHARS = 'āăąĉċčďđēĕė';       // U+0101..U+0117 town house-roof
const TW_CHARS = 'ęěğġģĥħĩīĭį';       // U+0119..U+012F town house-wall
TOWN_ORDER.forEach((id, i) => {
  TILE_CHARS[TG2_CHARS[i]] = 'tg2-' + id;
  TILE_CHARS[TH_CHARS[i]] = 'th-' + id;
  TILE_CHARS[TW_CHARS[i]] = 'tw-' + id;
});
export const TOWN_GROUND2_CHARS = TG2_CHARS;
// Premium+ W5 (LD-4): cave light-source kinds — crystal/lantern/lava are
// wall-class (solid, embedded in cave walls), waterglow is floor-class.
TILE_CHARS['ý'] = 'cavecrystal';
TILE_CHARS['þ'] = 'cavelantern';
TILE_CHARS['ÿ'] = 'lavaglow';
TILE_CHARS['Ā'] = 'waterglow';
// ---- Premium+ W6 (TX-3/TX-4/TX-5): buildings, interiors, dungeons ----
// New kinds are allocated chars from the Latin Extended Additional block
// (U+1E00.., verified unused by every pre-W6 system and map). Classes:
//   wall  = solid, drawn as-is (facades, dungeon walls, wall dressing)
//   prop  = solid object, composited over the floor it stands on
//   dress = solid wall dressing (composited as a wall tile)
//   rug   = WALKABLE dressing, composited over its floor
//   floor = WALKABLE dungeon floor family of its own
export const W6_KIND_DEFS = [
  ['gym-ground', 'wall'], ['gym-rock', 'wall'], ['gym-water', 'wall'], ['gym-volt', 'wall'],
  ['gym-leaf', 'wall'], ['gym-psy', 'wall'], ['gym-poison', 'wall'], ['gym-fire', 'wall'],
  ['medcabinet', 'prop'], ['aquarium', 'prop'], ['waitbench', 'prop'], ['snackmachine', 'prop'],
  ['freezer', 'prop'], ['shelfend', 'prop'], ['basketstack', 'prop'], ['kitchen', 'prop'],
  ['bath', 'prop'], ['tvstand', 'prop'], ['gamestation', 'prop'], ['wardrobe', 'prop'],
  ['tallbooks', 'prop'], ['bigbed', 'prop'], ['counterrun', 'prop'], ['trainingbag', 'prop'],
  ['weightrack', 'prop'], ['trophycase', 'prop'], ['column', 'prop'], ['serverrack', 'prop'],
  ['copier', 'prop'], ['cooler', 'prop'], ['workdesk', 'prop'], ['candle', 'prop'],
  ['urn', 'prop'], ['shrine', 'prop'], ['cushion2', 'prop'], ['leaguefountain', 'prop'], ['plantvat', 'prop'],
  ['piano', 'prop'], ['telescope', 'prop'], ['fireplace', 'prop'], ['sewingtable', 'prop'],
  ['trainset', 'prop'], ['easel', 'prop'], ['cradle', 'prop'], ['drum', 'prop'],
  ['chessboard', 'prop'], ['harp', 'prop'], ['birdcage', 'prop'], ['typewriter', 'prop'],
  ['rockinghorse', 'prop'], ['teacart', 'prop'], ['spicerack', 'prop'], ['quiltframe', 'prop'],
  ['potterswheel', 'prop'], ['starglobe', 'prop'], ['bonsai', 'prop'], ['violin', 'prop'],
  ['boardgames', 'prop'], ['knittingbasket', 'prop'], ['toolbench', 'prop'], ['herbdryer', 'prop'],
  ['mapdesk', 'prop'], ['grandclock', 'prop'],
  ['rockpress', 'prop'], ['stonebell', 'prop'], ['miningcart', 'prop'], ['poolblock', 'prop'],
  ['lifering', 'prop'], ['divingtank', 'prop'], ['coil', 'prop'], ['batterypack', 'prop'],
  ['switchboard', 'prop'], ['leafplanter', 'prop'], ['seedvault', 'prop'], ['vinepost', 'prop'],
  ['psypod', 'prop'], ['crystalball', 'prop'], ['focuslamp', 'prop'], ['venomvat', 'prop'],
  ['thornpost', 'prop'], ['gascanister', 'prop'], ['forge', 'prop'], ['coalscuttle', 'prop'],
  ['firewood', 'prop'], ['sandcrate', 'prop'], ['fossildisplay', 'prop'], ['sandcolumn', 'prop'],
  ['dressposter', 'dress'], ['dressclock', 'dress'], ['dresscurtain', 'dress'], ['dressbanner', 'dress'],
  ['dresspicture', 'dress'], ['dresspicture2', 'dress'], ['dresswindow', 'dress'], ['dressmirror', 'dress'],
  ['dresscalendar', 'dress'], ['dressmap', 'dress'], ['dresswreath', 'dress'],
  ['rug2', 'rug'], ['rug3', 'rug'], ['redcarpet', 'rug'],
  ['icewall', 'wall'], ['iceface', 'wall'], ['icefloor', 'floor'], ['frostfloor', 'floor'],
  ['icepool', 'floor'], ['iceboulder', 'prop'], ['frostrock', 'prop'], ['icecrystal', 'prop'],
  ['moonmoss', 'floor'], ['shroomglow', 'prop'], ['shroomcap', 'prop'], ['crystalcluster', 'prop'], ['starrock', 'prop'],
  ['stratwall', 'wall'], ['stratafloor', 'floor'], ['supportbeam', 'prop'], ['lanternpost', 'prop'],
  ['crackedfloor', 'floor'], ['rubble', 'prop'], ['bannerwall', 'wall'], ['torchpost', 'prop'],
  ['cerwall', 'wall'], ['cerfloor', 'floor'], ['cerpool', 'floor'], ['cercrystal', 'prop'], ['cershard', 'prop'],
  ['tombstone', 'prop'], ['panelwall', 'wall'], ['pipecluster', 'prop'], ['gratefloor', 'floor'], ['cablefloor', 'floor'],
];
export const W6_KIND_CHARS = {};
W6_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + i);
  W6_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W6_PROP_KINDS = W6_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W6_RUG_KINDS = W6_KIND_DEFS.filter(([, c]) => c === 'rug').map(([k]) => k);
export const W6_FLOOR_KINDS = W6_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const W6_WALL_KINDS = W6_KIND_DEFS.filter(([, c]) => c === 'wall' || c === 'dress').map(([k]) => k);
export const W6_WALKABLE_CHARS = W6_KIND_DEFS.filter(([, c]) => c === 'rug' || c === 'floor').map(([k]) => W6_KIND_CHARS[k]);
// ---- Premium+ W7 (TX-6): dressing & gate/arch kinds ----
// Chars continue the W6 block at U+1E00+132 (W6 used idx 0..131).
// Every W7 kind is class 'prop': a SOLID decorative object composited
// over the ground it stands on (art.mjs resolver) — placements replace
// walkable ground cells only and are BFS-gated so no route, door or
// NPC can be sealed (see the W7 register entry). Dressing kinds are
// the decorative scatter set of audit §11; gate kinds mark route exits.
export const W7_DRESS_KINDS = [
  'bench', 'planter', 'crates', 'barrel', 'signpost', 'well', 'postbox',
  'bikestand', 'stall', 'haycart', 'sundial', 'birdbath', 'tub', 'sacks',
  'pottedtree', 'waterpump',
];
export const W7_GATE_KINDS = ['gatepost', 'gatearch', 'routearch', 'vinearch'];
export const W7_KIND_CHARS = {};
[...W7_DRESS_KINDS, ...W7_GATE_KINDS].forEach((kind, i) => {
  const ch = String.fromCodePoint(0x1E00 + 132 + i);
  W7_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W7_PROP_KINDS = [...W7_DRESS_KINDS, ...W7_GATE_KINDS];
// ---- Arc 1.5 Stage O1: Amber Isles kinds ----
// Chars continue the W6/W7 block at U+1E00+152 (W6 idx 0..131, W7
// 132..151). Classes follow the W6 convention: floor = WALKABLE ground
// family of its own, wall = solid, prop = solid object composited over
// the ground it stands on (art.mjs resolver). Authored art:
// assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (Stage O1).
export const O1_KIND_DEFS = [
  ['palm', 'prop'], ['coral', 'prop'], ['shrinegate', 'prop'], ['feststand', 'prop'],
  ['gspedestal', 'prop'], ['stadiumcrest', 'prop'],
  ['sand', 'floor'], ['tropgrass', 'floor'], ['shrinefloor', 'floor'],
  ['shrinewall', 'wall'], ['stadiumfloor', 'floor'], ['stadiumwall', 'wall'],
];
export const O1_KIND_CHARS = {};
O1_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 152 + i);
  O1_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const O1_PROP_KINDS = O1_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const O1_FLOOR_KINDS = O1_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const O1_WALL_KINDS = O1_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const O1_WALKABLE_CHARS = O1_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => O1_KIND_CHARS[k]);
// ---- Arc 2 Stage J3a: Yamato kinds ----
// Chars continue the W6/W7/O1 block at U+1E00+164 (W6 idx 0..131, W7
// 132..151, O1 152..163). Same class convention as O1: floor = WALKABLE
// ground family of its own, wall = solid, prop = solid object composited
// over the ground it stands on (art.mjs resolver). Authored art:
// assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (Stage J3a).
export const J3_KIND_DEFS = [
  ['maple', 'prop'], ['jshrine', 'prop'], ['jwell', 'prop'], ['apricorn', 'prop'], ['jbell', 'prop'],
  ['cityfloor', 'floor'], ['woodfloor', 'floor'],
  ['towerwood', 'wall'], ['citybrick', 'wall'],
];
export const J3_KIND_CHARS = {};
J3_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 164 + i);
  J3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const J3_PROP_KINDS = J3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const J3_FLOOR_KINDS = J3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const J3_WALL_KINDS = J3_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const J3_WALKABLE_CHARS = J3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => J3_KIND_CHARS[k]);
// ---- Arc 2 Stage J3a: Yamato per-town identity kinds (Premium+ W5
// machinery, extended) ----
// The six west-Yamato settlements own the same eight signature kinds as
// the Arden towns (tg ground / tg2 ground II / tc canopy / td dress /
// tr roof / tl landmark facade / th house-roof / tw house-wall). The
// U+00C0.. Latin-1 blocks are exhausted by the eleven Arden towns, so
// Yamato chars continue the Latin Extended Additional block after the
// J3 kinds: town i owns idx 173+i*8 .. 180+i*8 in the order
// [tg, tg2, tc, td, tr, tl, th, tw]. The art.mjs resolver keys on the
// kind-name prefixes (tg-/tc-/td-/tr-/tl-/th-/tw-), so Yamato kinds ride
// the shipped W5 rendering paths unchanged.
export const JOHTO_TOWN_ORDER = ['newbark', 'cherrygrove', 'violet', 'azalea', 'goldenrod', 'ecruteak',
  'olivine', 'cianwood', 'mahogany', 'blackthorn', 'silvertown'];
export const JOHTO_TOWN_STYLE = {
  newbark:    { ground: '#8fb8a8', form: 'lakeside-lab modern' },
  cherrygrove:{ ground: '#a8c686', form: 'coastal flower gable' },
  violet:     { ground: '#9a94a6', form: 'tower-town stone' },
  azalea:     { ground: '#6fae6a', form: 'forest-edge timber' },
  goldenrod:  { ground: '#c2a878', form: 'urban brick slab' },
  ecruteak:   { ground: '#c98a5a', form: 'traditional timber' },
  olivine:    { ground: '#7aa8b8', form: 'port + lighthouse landmark' },
  cianwood:   { ground: '#b8a878', form: 'rustic island stone' },
  mahogany:   { ground: '#8aa888', form: 'quiet lakeside timber' },
  blackthorn: { ground: '#8a8a96', form: 'mountain slate + dragon motifs' },
  silvertown: { ground: '#c8c8d0', form: 'league marble' },
};
const JOHTO_KIND_SUFFIXES = ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'];
export const JOHTO_TOWN_CHARS = {};
JOHTO_TOWN_ORDER.forEach((id, i) => {
  JOHTO_TOWN_CHARS[id] = {};
  JOHTO_KIND_SUFFIXES.forEach((sfx, j) => {
    const ch = String.fromCodePoint(0x1E00 + 173 + i * 8 + j);
    JOHTO_TOWN_CHARS[id][sfx] = ch;
    TILE_CHARS[ch] = sfx + '-' + id;
  });
});
export const JOHTO_TOWN_GROUND_CHARS = JOHTO_TOWN_ORDER.map((id) => JOHTO_TOWN_CHARS[id].tg);
export const JOHTO_TOWN_GROUND2_CHARS = JOHTO_TOWN_ORDER.map((id) => JOHTO_TOWN_CHARS[id].tg2);
// ---- Arc 3 Stage H3a: Maris kinds ----
// Chars continue the block at U+1E00+261 (W6 0..131, W7 132..151, O1
// 152..163, J3 kinds 164..172, Yamato towns 173..260). Same class
// convention: floor = WALKABLE ground family of its own, wall = solid,
// prop = solid object composited over the ground it stands on.
// Authored art: assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (H3a).
export const H3_KIND_DEFS = [
  ['ashground', 'floor'], ['desertsand', 'floor'], ['boardwalk', 'floor'],
  ['volcrock', 'wall'],
  ['ashshrub', 'prop'], ['meteorstone', 'prop'], ['contestarch', 'prop'],
];
export const H3_KIND_CHARS = {};
H3_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 261 + i);
  H3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const H3_PROP_KINDS = H3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const H3_FLOOR_KINDS = H3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const H3_WALL_KINDS = H3_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const H3_WALKABLE_CHARS = H3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => H3_KIND_CHARS[k]);
// ---- Arc 3 Stage H3a: Maris per-town identity kinds (the W5/J3
// machinery, extended a third time) ----
// The eleven west/central-Maris settlements own the same eight
// signature kinds as the Arden/Yamato towns. Chars continue the block
// after the H3 kinds: town i owns idx 268+i*8 .. 275+i*8 in the order
// [tg, tg2, tc, td, tr, tl, th, tw]. The art.mjs resolver keys on the
// kind-name prefixes, so Maris kinds ride the shipped W5 paths.
export const HOENN_TOWN_ORDER = ['littleroot', 'oldale', 'petalburg', 'rustboro', 'dewford',
  'slateport', 'mauville', 'verdanturf', 'fallarbor', 'lavaridge', 'fortree',
  'lilycove', 'mossdeep', 'sootopolis', 'pacifidlog', 'evergrande'];
export const HOENN_TOWN_STYLE = {
  littleroot: { ground: '#a4bd76', form: 'quiet starter-village timber' },
  oldale:     { ground: '#b3a35e', form: 'dry-meadow crossroads gable' },
  petalburg:  { ground: '#79ac8c', form: 'park-pond balanced stone' },
  rustboro:   { ground: '#a39684', form: 'company-city cut stone' },
  dewford:    { ground: '#74aca4', form: 'island surf shack' },
  slateport:  { ground: '#c6ad7d', form: 'harbor market canvas + tile' },
  mauville:   { ground: '#a3a06b', form: 'electric grid slab' },
  verdanturf: { ground: '#8cc877', form: 'contest-garden trellis' },
  fallarbor:  { ground: '#aca292', form: 'ash-country weathered timber' },
  lavaridge:  { ground: '#bd7a48', form: 'hot-spring volcanic stone' },
  fortree:    { ground: '#5d9c66', form: 'canopy treehouse' },
  lilycove:   { ground: '#b8a0c8', form: 'contest-port lavender tile' },
  mossdeep:   { ground: '#8ab8c8', form: 'space-center pale slab' },
  sootopolis: { ground: '#e8e4da', form: 'crater white stone' },
  pacifidlog: { ground: '#c8a878', form: 'raft-timber float' },
  evergrande: { ground: '#a8b8e0', form: 'league marble + gold' },
};
const HOENN_KIND_SUFFIXES = ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'];
export const HOENN_TOWN_CHARS = {};
HOENN_TOWN_ORDER.forEach((id, i) => {
  HOENN_TOWN_CHARS[id] = {};
  HOENN_KIND_SUFFIXES.forEach((sfx, j) => {
    const ch = String.fromCodePoint(0x1E00 + 268 + i * 8 + j);
    HOENN_TOWN_CHARS[id][sfx] = ch;
    TILE_CHARS[ch] = sfx + '-' + id;
  });
});
export const HOENN_TOWN_GROUND_CHARS = HOENN_TOWN_ORDER.map((id) => HOENN_TOWN_CHARS[id].tg);
export const HOENN_TOWN_GROUND2_CHARS = HOENN_TOWN_ORDER.map((id) => HOENN_TOWN_CHARS[id].tg2);
// ---- Arc 3 Stage H3b: Maris east/water kinds ----
// Chars continue the block at U+1E00+396 (H3a kinds 261..267, Maris
// towns 268..395 — the five east settlements own idx 356..395 in
// HOENN_TOWN_CHARS above). Same class convention as H3: floor =
// WALKABLE ground family of its own, wall = solid, prop = solid
// object composited over the ground it stands on. Authored art:
// assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (Stage H3b).
export const H3B_KIND_DEFS = [
  ['seasand', 'floor'], ['kelpbed', 'floor'], ['current', 'floor'],
  ['uwrock', 'wall'],
  ['kelp', 'prop'], ['uwcoral', 'prop'], ['sealstone', 'prop'], ['ancientpillar', 'prop'],
];
export const H3B_KIND_CHARS = {};
H3B_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 396 + i);
  H3B_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const H3B_PROP_KINDS = H3B_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const H3B_FLOOR_KINDS = H3B_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const H3B_WALL_KINDS = H3B_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const H3B_WALKABLE_CHARS = H3B_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => H3B_KIND_CHARS[k]);
// ---- Arc 4 Stage S3a: Borea kinds ----
// Chars continue the block at U+1E00+404 (W6 0..131, W7 132..151, O1
// 152..163, J3 kinds 164..172, Yamato towns 173..260, H3 kinds 261..267,
// Maris towns 268..395, H3b kinds 396..403). Same class convention:
// floor = WALKABLE ground family of its own, wall = solid, prop =
// solid object composited over the ground it stands on. Authored
// art: assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (Stage S3a).
export const S3_KIND_DEFS = [
  ['flowerfield', 'floor'], ['harbourstone', 'floor'], ['coronetfloor', 'floor'],
  ['coronetrock', 'wall'],
  ['honeytree', 'prop'], ['windmill', 'prop'], ['ironarch', 'prop'], ['contestdome', 'prop'],
];
export const S3_KIND_CHARS = {};
S3_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 404 + i);
  S3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const S3_PROP_KINDS = S3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const S3_FLOOR_KINDS = S3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const S3_WALL_KINDS = S3_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const S3_WALKABLE_CHARS = S3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => S3_KIND_CHARS[k]);
// ---- Arc 4 Stage S3a: Borea per-town identity kinds (the W5/J3/H3
// machinery, extended a fourth time) ----
// The fourteen Borea settlements own the same eight signature kinds
// as the Arden/Yamato/Maris towns. Chars continue the block after the
// S3 kinds: town i owns idx 412+i*8 .. 419+i*8 in the order
// [tg, tg2, tc, td, tr, tl, th, tw]. S3a authors the ten west/central
// towns (twinleaf..canalave, idx 412..491); the four east towns
// (pastoria..sunnyshore, idx 492..523) are reserved here exactly as
// Maris reserved its east towns at H3a — S3b authors their tiles.
// The art.mjs resolver keys on the kind-name prefixes, so Borea
// kinds ride the shipped W5 rendering paths unchanged.
export const SINNOH_TOWN_ORDER = ['twinleaf', 'sandgem', 'jubilife', 'oreburgh', 'floaroma',
  'eterna', 'hearthome', 'solaceon', 'veilstone', 'canalave',
  'pastoria', 'celestic', 'snowpoint', 'sunnyshore'];
export const SINNOH_TOWN_STYLE = {
  twinleaf:  { ground: '#7fb069', form: 'two-leaf village timber' },
  sandgem:   { ground: '#d6c98a', form: 'beach-lab research modern' },
  jubilife:  { ground: '#8a94a6', form: 'broadcast-city glass slab' },
  oreburgh:  { ground: '#9c6644', form: 'coal-town industrial iron' },
  floaroma:  { ground: '#e88bb0', form: 'flower-meadow trellis' },
  eterna:    { ground: '#4f772d', form: 'historic forest stone' },
  hearthome: { ground: '#c9a227', form: 'contest-hall gold + violet' },
  solaceon:  { ground: '#a3b18a', form: 'ruin-meadow weathered stone' },
  veilstone: { ground: '#7d8597', form: 'department-store meteor slate' },
  canalave:  { ground: '#468faf', form: 'harbour iron + sailcloth' },
  pastoria:  { ground: '#6a994e', form: 'great-marsh boardwalk reed' },
  celestic:  { ground: '#957fef', form: 'shrine-town ancient timber' },
  snowpoint: { ground: '#caf0f8', form: 'snow-port pale stone' },
  sunnyshore:{ ground: '#ffd166', form: 'solar-panel modern' },
};
const SINNOH_KIND_SUFFIXES = ['tg', 'tg2', 'tc', 'td', 'tr', 'tl', 'th', 'tw'];
export const SINNOH_TOWN_CHARS = {};
SINNOH_TOWN_ORDER.forEach((id, i) => {
  SINNOH_TOWN_CHARS[id] = {};
  SINNOH_KIND_SUFFIXES.forEach((sfx, j) => {
    const ch = String.fromCodePoint(0x1E00 + 412 + i * 8 + j);
    SINNOH_TOWN_CHARS[id][sfx] = ch;
    TILE_CHARS[ch] = sfx + '-' + id;
  });
});
// ---- Arc 4 Stage S3b: Borea east/north kinds ----
// Chars continue the block at U+1E00+524 (S3 kinds 404..411, Borea
// towns 412..523). Same class convention as S3: floor = WALKABLE
// ground family of its own, wall = solid, prop = solid object
// composited over the ground it stands on. Authored art:
// assets/sprites/pix/tiles/tile-{prop-,}<kind>.pix (Stage S3b).
// climbwall is the Rock Climb GATE kind: a solid cliff face whose
// TILE_CHARS kind name is the marker the S4 field-move system reads
// (the Cut-tree idiom — the gate lives in the tile, the move lands
// in S4). distortfalls is the Mirrorworld's waterfall-walking
// floor: a WALKABLE floor family drawn as falling water (the honest
// engine idiom for DW's inverted falls — you walk the falls as
// floor; no new movement system is faked).
export const S3B_KIND_DEFS = [
  ['marshbog', 'floor'], ['distortfloor', 'floor'], ['distortfalls', 'floor'],
  ['climbwall', 'wall'], ['distortrock', 'wall'],
  ['marshreed', 'prop'], ['solarpanel', 'prop'], ['originstone', 'prop'],
];
export const S3B_KIND_CHARS = {};
S3B_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 524 + i);
  S3B_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const S3B_PROP_KINDS = S3B_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const S3B_FLOOR_KINDS = S3B_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const S3B_WALL_KINDS = S3B_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const S3B_WALKABLE_CHARS = S3B_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => S3B_KIND_CHARS[k]);
// ---- Perfection Pass Stage 2 Gate 0 (G0-4): facade-panel ----
// One new kind after the S3B block at U+1E00+532 (S3B ends at 524+7=531;
// 532 verified free in TILE_CHARS and unused by every map row). A closed,
// shuttered facade panel in neutral wall tones — no blue panel, no knob,
// no step surround — that replaces WALKABLE false-door cells (door-kind
// cells carrying no warp). It is walkable class exactly like the chars it
// replaces ('s'/'w'/'D'), is NOT a door kind (the resolver's pushDoorMat
// keys on door kinds, so the ground south of a panel draws no step/mat),
// and renders as-is via TILE_ART like other facade tiles.
export const G0_KIND_DEFS = [['facade-panel', 'facade']];
export const G0_KIND_CHARS = {};
G0_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 532 + i);
  G0_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const G0_WALKABLE_CHARS = G0_KIND_DEFS.filter(([, c]) => c === 'facade').map(([k]) => G0_KIND_CHARS[k]);
// ---- Perfection Pass Stage 2 Gate 2 (G2): beach transition kinds ----
// Thirty new kinds continuing the block at idx 533..562 (G0 ends at
// 532; idx 533..562 = U+2015..U+2032, verified free in TILE_CHARS and
// unused by every map row game-wide). beach-<dir> is a tropgrass cell
// whose <dir> edge(s) feather sand speckle (tile-beach-<dir>), placed
// on tropgrass cells bordering sand; psand-<dir> is the same grammar
// on the path side (tile-psand-<dir>). All are floor class (WALKABLE),
// swapped 1:1 from tropgrass/path cells in the Amber Isles, so
// walkable stays walkable and encounter eligibility is unchanged
// (neither family is ',' / water / cavefloor).
export const G2_KIND_DEFS = [
  ['beach-n', 'floor'], ['beach-s', 'floor'], ['beach-e', 'floor'], ['beach-w', 'floor'],
  ['beach-ne', 'floor'], ['beach-nw', 'floor'], ['beach-se', 'floor'], ['beach-sw', 'floor'],
  ['psand-n', 'floor'], ['psand-s', 'floor'], ['psand-e', 'floor'], ['psand-w', 'floor'],
  ['psand-ne', 'floor'], ['psand-nw', 'floor'], ['psand-se', 'floor'], ['psand-sw', 'floor'],
  // Multi-side completions (idx 549..562, U+2025..U+2032, verified free
  // the same way): 1-wide district strips and islet cells touch sand on
  // opposite / three / four sides — these kinds feather every named
  // side, so no placed beach/psand cell keeps a raw sand edge.
  ['beach-ns', 'floor'], ['beach-ew', 'floor'], ['beach-nse', 'floor'], ['beach-nsw', 'floor'],
  ['beach-new', 'floor'], ['beach-sew', 'floor'], ['beach-nesw', 'floor'],
  ['psand-ns', 'floor'], ['psand-ew', 'floor'], ['psand-nse', 'floor'], ['psand-nsw', 'floor'],
  ['psand-new', 'floor'], ['psand-sew', 'floor'], ['psand-nesw', 'floor'],
];
export const G2_KIND_CHARS = {};
G2_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 533 + i);
  G2_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const G2_KINDS = G2_KIND_DEFS.map(([k]) => k);
export const G2_WALKABLE_CHARS = G2_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => G2_KIND_CHARS[k]);
// ---- Wave T1 (Dawnwick trial build): shore props ----
// Two new kinds continuing the block at idx 563..564 (G2 ends at 562;
// U+2033..U+2034, verified free in TILE_CHARS and unused by every map
// row). Both are class 'prop': solid objects composited over the
// ground they stand on (art.mjs resolver). boat rides on water cells
// at the Dawnwick dock (hull browns only — no green-dominant pixels,
// so the season re-grade leaves it alone); chalkmap is the standing
// board carrying the chalk street-map from Dawnwick's Town Tale,
// planted beside the barn doors. Authored art:
// assets/sprites/pix/tiles/tile-prop-<kind>.pix (Wave T1 register
// items N1/N2 in WAVE-T1-DAWNWICK-PLAN.md).
export const T1_KIND_DEFS = [
  ['boat', 'prop'], ['chalkmap', 'prop'],
];
export const T1_KIND_CHARS = {};
T1_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 563 + i);
  T1_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T1_PROP_KINDS = T1_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T3 (Fernmere build): Marlow's tortoise ----
// One new kind continuing the block at idx 565 (T1 ends at 564;
// U+2035, verified free in TILE_CHARS and unused by every map row).
// Class 'prop': a solid object composited over the ground it stands
// on (art.mjs resolver). The tortoise is tale_viridian made visible —
// the retired ace Marlow's partner, dozing beside his cottage fence
// (BACKSTORY-SYNC-AUDIT build note: in the story, absent from the
// approved design). Authored art:
// assets/sprites/pix/tiles/tile-prop-tortoise.pix (Wave T3 register
// item N1 in WAVE-T3-FERNMERE-PLAN.md).
export const T3_KIND_DEFS = [
  ['tortoise', 'prop'],
];
export const T3_KIND_CHARS = {};
T3_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 565 + i);
  T3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T3_PROP_KINDS = T3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T6 (Arcport build): harbour props ----
// Three new kinds continuing the block at idx 566..568 (T3 ends at
// 565; U+2036..U+2038, verified free in TILE_CHARS and unused by
// every map row). tidechart is class 'rug': a WALKABLE ground decal
// (the founder's tide chart spread on the Fan Club porch — sailors
// stand around and on it). crane and gull are class 'prop': solid
// objects composited over the ground they stand on (crane over the
// dock boardwalk, gull over the water). Authored art:
// assets/sprites/pix/tiles/tile-prop-<kind>.pix (Wave T6 register
// in WAVE-T6-ARCPORT-PLAN.md Part 4).
export const T6_KIND_DEFS = [
  ['tidechart', 'rug'], ['crane', 'prop'], ['gull', 'prop'],
];
export const T6_KIND_CHARS = {};
T6_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 566 + i);
  T6_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T6_PROP_KINDS = T6_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T6_RUG_KINDS = T6_KIND_DEFS.filter(([, c]) => c === 'rug').map(([k]) => k);
export const T6_WALKABLE_CHARS = T6_KIND_DEFS.filter(([, c]) => c === 'rug').map(([k]) => T6_KIND_CHARS[k]);
// ---- Wave T7 (Hushmoor build): memorial wall ----
// One new kind continuing the block at idx 569 (T6 ends at 568;
// U+2039, verified free in TILE_CHARS and unused by every map row).
// Class 'prop': a solid object composited over the ground it stands
// on (art.mjs resolver). The low stone wall of names south of the
// tower garden in Hushmoor — the wall tale_lavender is named for.
// Authored art: assets/sprites/pix/tiles/tile-memorialwall.pix
// (Wave T7 register item in WAVE-T7-HUSHMOOR-PLAN.md Part 4).
export const T7_KIND_DEFS = [
  ['memorialwall', 'prop'],
];
export const T7_KIND_CHARS = {};
T7_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 569 + i);
  T7_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T7_PROP_KINDS = T7_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T9 (Bramble build): the Warden's lure post ----
// One new kind continuing the block at idx 570 (T7 ends at 569;
// U+203A, verified free in TILE_CHARS and unused by every map row).
// Class 'prop': a solid object composited over the ground it stands
// on (art.mjs resolver). The gate post at the Preserve gatehouse's
// east corner, with the carved lure of tale_fuchsia hanging from
// its cross-arm — the BACKSTORY-SYNC-AUDIT row made visible.
// Authored art: assets/sprites/pix/tiles/tile-prop-lurepost.pix
// (Wave T9 register item in WAVE-T9-BRAMBLE-PLAN.md Part 4).
export const T9_KIND_DEFS = [
  ['lurepost', 'prop'],
];
export const T9_KIND_CHARS = {};
T9_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 570 + i);
  T9_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T9_PROP_KINDS = T9_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T14 (Blossom build): the sakura tree ----
// One new kind continuing the block at idx 571 (T9 ends at 570;
// U+203B, verified free in TILE_CHARS and unused by every map row).
// Class 'prop': a solid object composited over the ground it stands
// on (art.mjs resolver). Blossom City's cherry-blossom tree — the
// tc-cherrygrove canopy shape recoloured green->pink; the approved
// design's signature (cherry-pink roofs and blossom trees).
// Authored art: assets/sprites/pix/tiles/tile-prop-sakura.pix
// (Wave T14 register item in WAVE-T14-BLOSSOM-PLAN.md Part 4).
export const T14_KIND_DEFS = [
  ['sakura', 'prop'],
];
export const T14_KIND_CHARS = {};
T14_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 571 + i);
  T14_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T14_PROP_KINDS = T14_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T15 (Cinder build): the charcoal kiln + the well
// lounger ----
// Two new kinds continuing the block at idx 572-573 (T14 ends at
// 571; U+203C/U+203D, verified free in TILE_CHARS and unused by
// every map row). Class 'prop': solid objects composited over the
// ground they stand on (art.mjs resolver). The kiln is Cinder's
// charcoal craft made visible (the design's twin kilns at the west
// edge); the dozpotam is the town well's resident Kin lounging in
// the basin — a decorative Kin-shaped prop in the species' own
// palette (T6 gull precedent; no overworld-Kin system exists).
// Authored art: assets/sprites/pix/tiles/tile-prop-kiln.pix and
// tile-prop-dozpotam.pix (Wave T15 register in
// WAVE-T15-CINDER-PLAN.md Part 4).
export const T15_KIND_DEFS = [
  ['kiln', 'prop'],
  ['dozpotam', 'prop'],
];
export const T15_KIND_CHARS = {};
T15_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 572 + i);
  T15_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T15_PROP_KINDS = T15_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T17 (Signal build): the radio mast ----
// One new kind continuing the block at idx 574 (T15 ends at
// 573; U+203E, verified free in TILE_CHARS and unused by
// every map row). Class 'prop': a solid object composited
// over the ground it stands on (art.mjs resolver). The mast
// is the Radio Tower's lattice made visible — cross-braced
// iron, a side dish and the red beacon — standing in its
// fenced compound east of the broadcast house (the design's
// fenced tower plot). Authored art:
// assets/sprites/pix/tiles/tile-prop-radiomast.pix (Wave
// T17 register in WAVE-T17-SIGNAL-PLAN.md, Prop register).
export const T17_KIND_DEFS = [
  ['radiomast', 'prop'],
];
export const T17_KIND_CHARS = {};
T17_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 574 + i);
  T17_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T17_PROP_KINDS = T17_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave T23 (Rootlet build): the notched fence post ----
// One new kind continuing the block at idx 575 (T17 ends at
// 574; U+203F, verified free in TILE_CHARS and unused by
// every map row). Class 'prop': a solid object composited
// over the ground it stands on (art.mjs resolver). The cedar
// post at the west side of Rootlet's north road, carved with
// a notch for every trainer who ever left — on the side only
// the town can see (the Rootlet tale made visible).
// Authored art: assets/sprites/pix/tiles/tile-prop-notchpost.pix
// (Wave T23 register in WAVE-T23-ROOTLET-PLAN.md, Prop register).
export const T23_KIND_DEFS = [
  ['notchpost', 'prop'],
];
export const T23_KIND_CHARS = {};
T23_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 575 + i);
  T23_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T23_PROP_KINDS = T23_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
// ---- Wave W-DIFF (town distinctiveness pilot): the first two KIT-LEVEL
// identity kinds pairs ----
// Four new kinds continuing the block at idx 577-580 (T17 ends at 574;
// idx 575 is reserved by T23's notchpost on its own branch and 576 is
// held as a merge buffer; U+2041/U+2042/U+2043/U+2044, verified free in
// TILE_CHARS, unused by every map row, trim-stable single code units).
// Owner ruling 2026-11-13: "Every town kit should be different" — these
// kinds are the pilot of the kit-level identity layer specified in
// muse-directive/W-DIFF-AUDIT.md Phase B: Cragmoor (blackthorn) gets the
// Basalt Sett & Drake-Gable kit (settfloor streets, drakeroof house
// roofs), Lastlight (silvertown) gets the Marble Slab & Parapet kit
// (marblefloor streets, parapetroof house roofs). Floors are full-bleed
// walkable street materials (registered per town in the placement
// audit's STREET_REGISTRY, W4 precedent); roofs are solid wall-class
// tiles swapped onto house-stamp roof cells only — footprints, doors
// and warps untouched. Authored art:
// assets/sprites/pix/tiles/tile-settfloor.pix, tile-marblefloor.pix,
// tile-drakeroof.pix, tile-parapetroof.pix.
// ---- Wave W-DIFF2 (identity retrofit #2): the next pair from the same
// audit's ranking — Lantern City (ecruteak) + Farsight City (saffron),
// the closest remaining pair on main (composite 0.0393). Appended at
// idx 581-584 (U+2045-U+2048, verified free in TILE_CHARS, unused by
// every map row, trim-stable single code units); the pilot's idx
// 577-580 assignments are untouched. Farsight gets the Gold Spire &
// Avenue Slab kit (avenuefloor streets, slabroof roofs with gold trim),
// Lantern gets the Cedar & Ashen Stone kit (wornfloor streets,
// cedarroof house roofs). Same rules as the pilot: floors are walkable
// street materials registered per town in STREET_REGISTRY; roofs are
// solid wall-class, swapped onto roof cells only. Authored art:
// assets/sprites/pix/tiles/tile-avenuefloor.pix, tile-wornfloor.pix,
// tile-slabroof.pix, tile-cedarroof.pix.
export const WD_KIND_DEFS = [
  ['settfloor', 'floor'],
  ['marblefloor', 'floor'],
  ['drakeroof', 'wall'],
  ['parapetroof', 'wall'],
  ['avenuefloor', 'floor'],
  ['wornfloor', 'floor'],
  ['slabroof', 'wall'],
  ['cedarroof', 'wall'],
];
export const WD_KIND_CHARS = {};
WD_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 577 + i);
  WD_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD_FLOOR_KINDS = WD_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const WD_WALL_KINDS = WD_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
// ---- Wave T24 (Eldergrove build): the Flower Clock + thatch roof ----
// Three new kinds continuing the block at idx 585-587 (W-DIFF ends
// at 580, W-DIFF2 took 581-584; idx 576 stays the held merge buffer;
// U+2049/U+204A/U+204B, verified free in TILE_CHARS and unused by
// every map row; T24 authored them at 581-583 and the Director
// re-indexed at merge). Owner ruling
// 2026-11-13 (NO-SAME-KIT law): Eldergrove's own kit is dry-meadow
// ground + THATCH-textured straw-gold roofs + the Flower Clock —
// 'flowerclock' is a class 'prop' (solid object composited over
// the ground it stands on, art.mjs resolver): the petal-ring clock
// face at the heart of the town's shipped clock garden, where its
// sign has always stood. 'thatchroof' is a wall-class roof kind
// swapped onto house-stamp roof cells only — footprints, doors
// and warps untouched (W-DIFF drakeroof precedent). Authored art:
// assets/sprites/pix/tiles/tile-prop-flowerclock.pix and
// tile-thatchroof.pix (Wave T24 register in
// WAVE-T24-ELDERGROVE-PLAN.md, Kit register).
export const T24_KIND_DEFS = [
  ['flowerclock', 'prop'],
  ['thatchroof', 'wall'],
  ['clockbed', 'floor'],
];
export const T24_KIND_CHARS = {};
T24_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 585 + i);
  T24_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T24_PROP_KINDS = T24_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T24_WALL_KINDS = T24_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T24_FLOOR_KINDS = T24_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T25 (Meadowbrook build): sage stone roofs + the gym's
// Balance Scales crown + the pond heron + reed banks ----
// Four new kinds continuing the block at idx 588-591 (T24 ends at
// 587; idx 576 stays the held merge buffer; U+204C-U+204F, verified
// free in TILE_CHARS and unused by every map row). Owner ruling
// 2026-11-13 (NO-SAME-KIT law): Meadowbrook's own kit is the
// park-pond balanced-stone form its HOENN_TOWN_STYLE names —
// 'sageroof' is a wall-class roof kind (staggered sage stone
// courses, structurally unlike Eldergrove's thatch bands and
// Rootlet's cedar shingle) swapped onto house-stamp + gym roof
// cells only; 'scales' is a class 'prop' (solid object composited
// over the ground it stands on, art.mjs resolver): the brass
// balance crowning the gym roof's centre cell, its art fully
// opaque with the sageroof shingle baked in (it stands ON the
// roof). 'heron' is a class 'prop': the grey heron standing at
// the east pond's NW bank, a designed resident of the approved
// painting — no NPC record exists and none is invented. 'reedbank'
// is a floor-class bank dressing swapped 1:1 from the ponds'
// walkable 'F' flower-bank cells, so floor stays floor. Authored
// art: assets/sprites/pix/tiles/tile-sageroof.pix,
// tile-prop-scales.pix, tile-prop-heron.pix, tile-reedbank.pix
// (Wave T25 register in WAVE-T25-MEADOWBROOK-PLAN.md, Kit).
export const T25_KIND_DEFS = [
  ['sageroof', 'wall'],
  ['scales', 'prop'],
  ['heron', 'prop'],
  ['reedbank', 'floor'],
];
export const T25_KIND_CHARS = {};
T25_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 588 + i);
  T25_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T25_PROP_KINDS = T25_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T25_WALL_KINDS = T25_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T25_FLOOR_KINDS = T25_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W-DIFF3 (Iris City identity retrofit): Tower Stone &
// Maple ----
// Two new kinds at idx 592-593 (U+2050/U+2051, verified free in
// TILE_CHARS and unused by every map row). The block was authored
// at 588-589 and RE-INDEXED to 592-593 at merge time: Wave T25
// (Meadowbrook) landed first and took 588-591 (sageroof, scales,
// heron, reedbank) — the T24 adaptation pattern, applied by the
// Director's index ruling. Iris City is the last shared-kit member of the
// Yamato endgame cluster (W-DIFF-AUDIT A.3: Cragmoor / Lastlight /
// Iris, the tightest in the game); Cragmoor wears Basalt Sett &
// Drake-Gable and Lastlight Marble Slab & Parapet, so Iris takes
// the audit Phase B row verbatim: street 'settfloor (grey-violet)'
// built as its own kind 'violetfloor' (one kind = one palette, the
// W-DIFF/W-DIFF2 discipline — the sett family in Iris's grey-violet,
// JOHTO_TOWN_STYLE violet ground #9a94a6), house shapes
// 'tower-town stone (th)' built as 'towerroof' (dressed stone-slab
// courses in the KIT_VARIANTS violet roof tones, swapped onto
// house-stamp roof cells only — footprints, doors and warps
// untouched, W-DIFF drakeroof precedent). The table's 'maple ring'
// ground treatment rides the existing J3 'maple' prop kind (already
// fully registered; Iris's shipped maples ring the Newleaf Tower's
// north side and the ring is completed on its flanks). Authored
// art: assets/sprites/pix/tiles/tile-violetfloor.pix and
// tile-towerroof.pix.
export const WD3_KIND_DEFS = [
  ['violetfloor', 'floor'],
  ['towerroof', 'wall'],
];
export const WD3_KIND_CHARS = {};
WD3_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 592 + i);
  WD3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD3_PROP_KINDS = WD3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD3_WALL_KINDS = WD3_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD3_FLOOR_KINDS = WD3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W-DIFF4 (identity retrofit #4): Cinder Town + Redwood
// Town, the closest remaining pair where BOTH towns still wear the
// shared kit (W-DIFF-AUDIT A.3: Cinder ↔ Redwood 0.0517) ----
// Four new kinds at idx 594-597 (U+2052-U+2055, verified free in
// TILE_CHARS and unused by every map row; WD3 ends at 593). The
// audit Phase B rows verbatim: Cinder (azalea) takes the Charcoal
// & Kiln Brick kit — street 'brickfloor' (staggered kiln-brick
// courses in burnt terracotta, the charcoal burners' own
// material), house shapes 'moss timber (th)' built as 'mossroof'
// (moss-grown timber courses in the KIT_VARIANTS azalea roof
// tones), ground 'tg + ash accents at kilns' (the existing H3a
// ashground kind, no new kind owed); Redwood (mahogany) takes
// the Pine & Lake Gravel kit — street 'gravelfloor' (an
// uncoursed Wrathmere-shore pebble field), house shapes 'deep
// pine timber (th)' built as 'pineroof' (sombre pine shingle
// courses in the KIT_VARIANTS mahogany roof tones), ground
// 'tg + meadow/pond' (T20's shipped pond + meadow, byte-kept).
// One kind = one palette, one town (the W-DIFF discipline):
// brickfloor is Cinder's alone (Signal's avenues are a later
// wave's own variant) and gravelfloor is authored here for
// Redwood first. Same rules as the pilots: floors are walkable
// street materials registered per town in the placement audit's
// STREET_REGISTRY; roofs are solid wall-class tiles swapped
// onto house-stamp roof cells only — footprints, doors, warps,
// NPC posts and the souvenir-shop facade at Pell's post
// untouched. Authored art: assets/sprites/pix/tiles/
// tile-brickfloor.pix, tile-mossroof.pix, tile-gravelfloor.pix,
// tile-pineroof.pix.
export const WD4_KIND_DEFS = [
  ['brickfloor', 'floor'],
  ['mossroof', 'wall'],
  ['gravelfloor', 'floor'],
  ['pineroof', 'wall'],
];
export const WD4_KIND_CHARS = {};
WD4_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 594 + i);
  WD4_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD4_PROP_KINDS = WD4_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD4_WALL_KINDS = WD4_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD4_FLOOR_KINDS = WD4_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T26 (Copperton City build): Cut-Stone & Copper ----
// Four new kinds at idx 598-601 (U+2056-U+2059, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597 — brickfloor,
// mossroof, gravelfloor, pineroof for Cinder + Redwood;
// Copperton takes the next block up per the Director's index
// ruling, 2026-11-13). Copperton is Maris's company
// city (HOENN_TOWN_STYLE rustboro: ground #a39684, form
// 'company-city cut stone'); its shipped ground was 46.1%
// tg2 mud — the worst share yet — under a PASS that leaned on
// mud-as-network. Its own kit (NO-SAME-KIT law): 'coproof'
// (wall) — warm-grey cut-stone roof slabs with copper seams
// and verdigris at the joints, in the KIT_VARIANTS rustboro
// roof tones; structurally wide-slab + metal seam, not
// Meadowbrook's small staggered sage shingles, Eldergrove's
// banded thatch or Rootlet's flat cedar shingle. 'cutstonefloor'
// (floor) — big square-cut quarry flags, the town's avenue
// stone and registered street kind (STREET_REGISTRY; the
// fleet's street kinds carry the -floor suffix the desire-
// path tiers key on), swapped onto every street/exit/landing
// cell. 'travstone' (prop) —
// the Trainer School's travelling stone home on its plinth
// (tale_rustboro), fully opaque with the court baked in, at
// (23,11) between the two shipped fossil displays. 'gardenfloor'
// (floor) — the Norwick HQ forecourt's formal beds, dark soil
// + clipped rows + copper edging, on the empty north lot's
// west strip. Authored art: assets/sprites/pix/tiles/
// tile-coproof.pix, tile-cutstonefloor.pix, tile-prop-travstone.pix,
// tile-gardenfloor.pix (register: WAVE-T26-COPPERTON-PLAN.md).
export const T26_KIND_DEFS = [
  ['coproof', 'wall'],
  ['cutstonefloor', 'floor'],
  ['travstone', 'prop'],
  ['gardenfloor', 'floor'],
];
export const T26_KIND_CHARS = {};
T26_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 598 + i);
  T26_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T26_PROP_KINDS = T26_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T26_WALL_KINDS = T26_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T26_FLOOR_KINDS = T26_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W-DIFF5 (identity retrofit): Bramble + Tidewall ----
// Four new kinds at idx 602-605 (U+205A-U+205D, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597, T26 598-601).
// The last closest pair where BOTH towns still wear the
// shared kit (audit A.3 #9, 0.0669; 0.0872 on the current
// tree) gets the identity table's own kits (W-DIFF-AUDIT
// Phase B). Bramble City (TOWN_STYLE fuchsia: ground
// #c47ba4, form 'safari thatch') — 'Thatch & Marsh':
// 'marshfloor' (floor) — weathered marsh-timber boardwalk
// sections, the town's street fabric (STREET_REGISTRY; the
// fleet's street kinds carry the -floor suffix the desire-
// path tiers key on), swapped onto the street cells; the
// marsh-landing shore (south row + exits) stays sand path,
// the table's '+ sand'. 'safariroof' (wall) — bundled
// safari thatch in the KIT_VARIANTS fuchsia roof tones,
// swapped onto the house + Preserve gatehouse roofs; the
// Center/Mart/Gym stamps keep their shipped roofs entire.
// The table's ground treatment (tg + marshbog patches)
// rides the existing S3B floor kind: five tg cells along
// the south pools become marshbog, two marshreed props
// (existing S3B prop kind) stand at the bog's north edge.
// Tidewall City (JOHTO_TOWN_STYLE cianwood: ground
// #b8a878, form 'rustic island stone') — 'Driftwood &
// Surf Stone': 'driftfloor' (floor) — bleached driftwood
// pier planks, the inland street fabric (STREET_REGISTRY),
// swapped onto the street + pier-approach cells; the
// shore promenade (rows 13-14) stays sand path, the
// table's '+ sand'. 'surfroof' (wall) — rustic island
// stone courses in warm grey, swapped onto the house
// roofs (the pharmacy's included, like every house roof);
// the gym's tr- roof + terrace, the Center's roof-center
// and the Mart's roof-slate stamps keep their shipped
// roofs entire. The table's herb gardens are T19's
// shipped fenced flowerbed plots flanking the pharmacy —
// byte-kept. Authored art: assets/sprites/pix/tiles/
// tile-marshfloor.pix, tile-safariroof.pix,
// tile-driftfloor.pix, tile-surfroof.pix
// (register: your_files/w-diff5/GRADE.md).
export const WD5_KIND_DEFS = [
  ['marshfloor', 'floor'],
  ['safariroof', 'wall'],
  ['driftfloor', 'floor'],
  ['surfroof', 'wall'],
];
export const WD5_KIND_CHARS = {};
WD5_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 602 + i);
  WD5_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD5_PROP_KINDS = WD5_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD5_WALL_KINDS = WD5_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD5_FLOOR_KINDS = WD5_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T27 (Mistford Town build): Surf-Teal Island ----
// Five new kinds at idx 608-612 (U+2060-U+2064, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597, T26 598-601,
// W-DIFF5 602-607 — marshfloor, safariroof, driftfloor,
// surfroof, marshbog, marshreed for Bramble + Tidewall.
// Mistford was first registered at 602-606 and RE-INDEXED to
// 608-612 under the Director's index ruling of 2026-11-13
// (W-DIFF5 finished first); the dewford map cells were
// remapped losslessly, 79 cells, counts verified per kind —
// the W-DIFF3/T24 precedent). Mistford is Maris's surf
// island (HOENN_TOWN_STYLE dewford: ground #74aca4, form
// 'island surf shack'); its shipped ground was 36.1% tg2 mud
// (the twenty-first mud town) under a placement-gates FAIL, its
// wet-sand beach kind rendered as brown striping, its MART
// CLERK orphaned again and five direction signs invisible.
// Its own kit (NO-SAME-KIT law): 'shackroof' (wall) — weathered
// surf-teal wood shakes with irregular splits, bleached streaks
// and a driftwood ridge, in the KIT_VARIANTS dewford roof
// tones; structurally shake + ridge, not Meadowbrook's small
// staggered sage stone shingles, Copperton's copper-seamed
// slabs or Eldergrove's thatch. 'plankfloor' (floor) — salt-
// bleached boardwalk planks, the town's street fabric and
// registered street kind (STREET_REGISTRY; the fleet's street
// kinds carry the -floor suffix the desire-path tiers key on),
// swapped onto every street/exit/landing cell. 'barbells'
// (prop) — Enzo's irons outside the gym (the backstory audit's
// prescription), fully opaque with the meadow baked in, at
// (15,5) and (18,5). 'chalkboard' (prop) — the hall's trendy-
// phrase board, chalk marks and NO text (the audit's proposed
// board line was never backend data; the phrase itself is
// TRENDWATCHER IO's dialogue), fully opaque with the meadow
// baked in, at (9,11) beside IO's post. 'barrels' (prop) — the
// approved painting's Mart barrels, fully opaque with the
// meadow baked in, at (8,3) beside the Mart stamp. Authored
// art: assets/sprites/pix/tiles/tile-shackroof.pix,
// tile-plankfloor.pix, tile-prop-barbells.pix,
// tile-prop-chalkboard.pix, tile-prop-barrels.pix (register:
// WAVE-T27-MISTFORD-PLAN.md).
export const T27_KIND_DEFS = [
  ['shackroof', 'wall'],
  ['plankfloor', 'floor'],
  ['barbells', 'prop'],
  ['chalkboard', 'prop'],
  ['barrels', 'prop'],
];
export const T27_KIND_CHARS = {};
T27_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 608 + i);
  T27_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T27_PROP_KINDS = T27_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T27_WALL_KINDS = T27_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T27_FLOOR_KINDS = T27_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W-DIFF6 (identity retrofit): Fernmere + Canopy ----
// Four new kinds at idx 613-616 (U+2065-U+2068, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597, T26 598-601,
// W-DIFF5 602-605, T27 608-612 — 606/607 stand empty). The
// closest remaining pair where BOTH towns still wear the
// shared kit (audit A.3 #10, 0.0739; 0.0639 re-measured on the
// current tree) gets the identity table's own kits (W-DIFF-
// AUDIT Phase B). Fernmere City (TOWN_STYLE viridian: ground
// #4f9e57, form 'gabled slate') — 'Slate Gable & Evergreen':
// 'slatefloor' (floor) — dark slate sett paving, the town's
// street fabric (STREET_REGISTRY; the fleet's street kinds
// carry the -floor suffix the desire-path tiers key on),
// swapped onto every street cell. The table names Redwood's
// gravelfloor here, but gravelfloor is Redwood's built street
// (W-DIFF4) — the W-DIFF5 precedent (the table's shared
// 'boardwalk' became marshfloor/driftfloor) gives Fernmere
// its own slate sett instead of a second helping of gravel.
// 'slateroof' (wall) — a true slate GABLE in the KIT_VARIANTS
// viridian roof tones (ridge band + offset slate courses +
// deep eave foot), swapped onto the four houses' roofs —
// Marlow's house included; the gym's roof-slate band, the
// Center's roof-center and the Mart's tr- stamps keep their
// shipped roofs entire. The table's ground treatment (tg +
// deep tc evergreen frame) and its signature (the heavy
// fence family, 11 runs, with td- posts) are the shipped
// town's own — byte-kept. Viridian is a drifted triple
// definition (map-id registry status D): ONLY the live
// maps3 copy is swapped; the maps/maps2 copies stay frozen
// under the registry ratchet, their reconciliation the
// standing dual-copy backlog wave's business. Canopy City
// (TOWN_STYLE celadon: ground #4fae7e, form 'glass dome') —
// 'Glass Dome & Promenade': 'promfloor' (floor) — pale
// sage-stone promenade slabs, the town's street fabric
// (STREET_REGISTRY), swapped onto every street cell — the
// avenues ARE the promenade. 'glassroof' (wall) — ribbed
// glass-dome roofing (mullion ribs, glass gradient, glints,
// deep frame foot) in the KIT_VARIANTS celadon tones,
// swapped onto the four houses' th- roofs; the Mart's,
// Center's and Dept Store's tr- roofs, the Game Corner +
// Dept Store tl- frontages and the gym-leaf band keep their
// shipped faces entire. The table's ground treatment (tg +
// flowerbed promenades) is T8's shipped flowerbed/planter
// dressing along the Center-Game Corner promenade — byte-
// kept, the Tidewall herb-garden precedent. Authored art:
// assets/sprites/pix/tiles/tile-slatefloor.pix,
// tile-slateroof.pix, tile-promfloor.pix, tile-glassroof.pix
// (register: your_files/w-diff6/GRADE.md).
export const WD6_KIND_DEFS = [
  ['slatefloor', 'floor'],
  ['slateroof', 'wall'],
  ['promfloor', 'floor'],
  ['glassroof', 'wall'],
];
export const WD6_KIND_CHARS = {};
WD6_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 613 + i);
  WD6_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD6_PROP_KINDS = WD6_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD6_WALL_KINDS = WD6_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD6_FLOOR_KINDS = WD6_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T28 (Fairhaven City build): Canvas Market & Quay Stone ----
// Five new kinds at idx 617-621 (U+2069-U+206D, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597, T26 598-601,
// W-DIFF5 602-605, T27 608-612 — and 613-616 belong to
// W-DIFF6 (slatefloor, slateroof, promfloor, glassroof for
// Fernmere + Canopy), which finished first. Fairhaven was
// first planned at 613-617 and RE-INDEXED to 617-621 under
// the Director's index ruling of 2026-11-13 — before any
// registration or map edit existed, so no cells were remapped;
// 606-607 remain reserved-empty). Fairhaven is Maris's harbour
// market city (HOENN_TOWN_STYLE slateport: ground #c6ad7d,
// form 'harbor market canvas + tile'); its shipped ground was
// 47.0% tg2 mud — the worst share yet — under a placement-
// gates FAIL (the boardwalk pier fabric-invisible, conn
// 56/90). Its own kit (NO-SAME-KIT law): 'canvasroof' (wall)
// — stitched cream canvas panels over a tile ridge, in the
// KIT_VARIANTS slateport roof tones; structurally canvas
// sheets + ridge, not Mistford's vertical-split shakes,
// Copperton's copper-seamed slabs or Meadowbrook's staggered
// stone shingles. 'quayfloor' (floor) — running-bond quay
// stone (half-offset long slabs, tar seams), the town's
// street fabric and registered street kind (STREET_REGISTRY;
// the fleet's street kinds carry the -floor suffix the
// desire-path tiers key on), swapped onto every street/exit/
// landing cell. 'marketstall' (prop) — a canvas-awning market
// stall, eight in two rows on the shipped market ground (the
// painting's north-street market transferred to the FAIRHAVEN
// MARKET sign + VESK's post). 'tideboard' (prop) — the quay's
// tide-table board (wave/sun/moon glyphs, no text), at (16,15)
// beside the HARBOR sign. 'shiphull' (prop) — Merrick's ribbed
// hull on its stocks at (27,5) in LIO's shipyard yard. All
// three props fully opaque with the green baked in.
// Authored art: assets/sprites/pix/tiles/tile-canvasroof.pix,
// tile-quayfloor.pix, tile-prop-marketstall.pix,
// tile-prop-tideboard.pix, tile-prop-shiphull.pix (register:
// WAVE-T28-FAIRHAVEN-PLAN.md).
export const T28_KIND_DEFS = [
  ['canvasroof', 'wall'],
  ['quayfloor', 'floor'],
  ['marketstall', 'prop'],
  ['tideboard', 'prop'],
  ['shiphull', 'prop'],
];
export const T28_KIND_CHARS = {};
T28_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 617 + i);
  T28_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T28_PROP_KINDS = T28_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T28_WALL_KINDS = T28_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T28_FLOOR_KINDS = T28_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W-DIFF7 (Tidehaven + Arcport identity retrofit) ----
// Three new kinds at idx 622-624 (U+206E-U+2070, verified free
// in TILE_CHARS and unused by every map row; the block runs
// T23 575, W-DIFF 577-580, W-DIFF2 581-584, T24 585-587,
// T25 588-591, WD3 592-593, W-DIFF4 594-597, T26 598-601,
// W-DIFF5 602-605, T27 608-612, W-DIFF6 613-616, T28 617-621 —
// 606/607 stand empty). The two Arden harbour cities get the
// identity table's own kits (W-DIFF-AUDIT Phase B). Tidehaven
// City (TOWN_STYLE cerulean: ground #57a8a0, form 'mansard
// blue-tile') — 'Boardwalk & Mansard': 'pierfloor' (floor) —
// vertical sea-worn pier planks, the town's street fabric
// (STREET_REGISTRY), swapped onto every sand-path street
// cell. The table names 'boardwalk' as Tidehaven's street,
// but boardwalk is Arcport's registered street material
// (W4) — the W-DIFF5 precedent (the table's shared
// 'boardwalk' became marshfloor/driftfloor) gives Tidehaven
// its own pier timber in the same register instead of a
// second helping of boardwalk. The town's 11 shipped
// boardwalk cells (dock edge, south shore, exit aprons)
// STAY boardwalk — the table's own street/shore split, and
// a gate-driven trim (converting them grew a second, bare
// junction at the exit spine and failed the gate; with the
// split the town's gate tuple is fully identical to its
// pin). 'mansardroof' (wall)
// — a true MANSARD in the KIT_VARIANTS cerulean roof tones
// (cap band + shallow upper slope + steep blue-tile lower
// slope with dormer glints + deep eave foot), swapped onto
// the town's th- roofs entire — houses and the Mart's roof
// row alike (the shipped Mart wears the th- kind, not a
// stamp roof); the Center's roof-center stamp, the gym's
// gym-water pool hall and wall-gym faces, every door and
// sign keep their shipped faces. The table's ground
// treatment (tg + canal water) and signature (stonebell at
// the pool, flower borders) are the shipped town's own —
// byte-kept. Arcport City (TOWN_STYLE vermilion: ground
// #c98d5a, form 'copper gable') — 'Harbour Boardwalk &
// Copper (model town)': the street is boardwalk itself,
// Arcport's registered material since W4 — the retrofit
// completes it: every remaining sand-path street cell is
// swapped to boardwalk, so the whole street network (the
// row-5 avenue, the spines, the dock streets) is the one
// harbour material. 'copperroof' (wall) — a standing-seam
// COPPER gable in the KIT_VARIANTS vermilion roof tones
// (bright ridge + copper courses + verdigris weathering +
// deep eave foot), swapped onto the town's th- roofs entire
// (houses and the Mart's roof row, which wears th- as in
// Tidehaven); the gym's tr- roof row, the Center's
// roof-center stamp, the harbour props (crane, gull,
// tidechart) and the tg2- harbour-turf accents keep their
// shipped faces entire. (Name note: 'coproof' is T26
// Copperton's roof kind — Arcport's copper takes the
// distinct name 'copperroof'.) Vermilion is a drifted
// quadruple definition (map-id registry status D) whose
// maps4/maps5/maps6 copies are spread-overrides of the
// maps2 original: ONLY the maps2 rows are swapped, and all
// four copies' registry fingerprints re-pin in this commit
// per the burn-down rule — the copies' own npcs/events
// layers do not move. Authored art:
// assets/sprites/pix/tiles/tile-pierfloor.pix,
// tile-mansardroof.pix, tile-copperroof.pix (register:
// your_files/w-diff7/GRADE.md).
export const WD7_KIND_DEFS = [
  ['pierfloor', 'floor'],
  ['mansardroof', 'wall'],
  ['copperroof', 'wall'],
];
export const WD7_KIND_CHARS = {};
WD7_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 622 + i);
  WD7_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD7_PROP_KINDS = WD7_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD7_WALL_KINDS = WD7_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD7_FLOOR_KINDS = WD7_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T29: Lilac City's own kit — Bronze Grid & Sunlamp
// (WAVE-T29-LILAC-PLAN.md). Indices 625-628 — RE-INDEXED
// in-branch under the Director's index ruling of 2026-11-13:
// W-DIFF7 (Tidehaven + Arcport) registered pierfloor 622,
// mansardroof 623, copperroof 624 first, so this block moved
// above that ceiling (606-607 stay empty, as always).
// 'bronzroof' (wall) — staggered olive-bronze shingle courses
// on the Gym, the Game Corner and the town's two facade
// cottages. 'gridfloor' (floor) — the fine bronze sett grid,
// the crossroads' registered street kind. 'sunlamp' (prop) —
// the second-sun lamp: a glowing sun-orb on a bronze post; a
// pair flanks the Game Corner's frontage, one stands at the
// great crossing, one on the south avenue. 'lilacbush'
// (prop) — a lilac bush in bloom, the painting's signature
// planting. Both props fully opaque with the green baked in.
export const T29_KIND_DEFS = [
  ['bronzroof', 'wall'],
  ['gridfloor', 'floor'],
  ['sunlamp', 'prop'],
  ['lilacbush', 'prop'],
];
export const T29_KIND_CHARS = {};
T29_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 625 + i);
  T29_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T29_PROP_KINDS = T29_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T29_WALL_KINDS = T29_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T29_FLOOR_KINDS = T29_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W-DIFF8: Hushmoor + Blossom kit-identity retrofit
// (W-DIFF-AUDIT Phase B; pair re-measured 0.2003 on main
// 8066f86 before building, control pair blackthorn <->
// silvertown 0.3109 unmoved). Indices 629-632 — verified free
// in TILE_CHARS and unused by every map row before
// registering (the ledger runs T23 575 ... T29 625-628, with
// 606/607 standing empty). Hushmoor (lavender): 'Violet
// Shingle & Memorial Stone' — 'shinglefloor' (floor), the
// dark violet-grey gravel the table names for its streets,
// and 'shingleroof' (wall), the steep dark shingle of its
// house shapes, violet-black courses. The shipped map's
// flora-lavender patches (the table's ground treatment)
// already stand and are byte-kept, as are the memorialwall
// row and the tower geography entire. Blossom (cherrygrove):
// 'Sakura & Harbour Stone' — the table names harbourstone
// for the street, but harbourstone is Canalave's dressed
// stone (its .pix header says so), sunnyshore wears it as
// decorative inlay speckle, and the STREET_REGISTRY's
// standing note holds it 'not registrable as one [a street]'
// — so per the W-DIFF6 amendment rule Blossom takes a
// distinct variant in the same register: 'inlayfloor'
// (floor), harbour stone cut as large inlay slabs with a
// pale cherry-petal fleck inlaid in the stone. The tide-table
// plaza's shipped harbourstone block keeps the original
// stone, byte-kept, as does every sakura. 'sakuraroof'
// (wall) — the cherry-pink gables of the table's house
// shapes. TILE SWAPS ONLY: warps, doors, footprints, NPC
// posts, signs, encounters byte-kept (register:
// your_files/w-diff8/GRADE.md). Authored art:
// assets/sprites/pix/tiles/tile-shinglefloor.pix,
// tile-shingleroof.pix, tile-inlayfloor.pix,
// tile-sakuraroof.pix.
export const WD8_KIND_DEFS = [
  ['shinglefloor', 'floor'],
  ['shingleroof', 'wall'],
  ['inlayfloor', 'floor'],
  ['sakuraroof', 'wall'],
];
export const WD8_KIND_CHARS = {};
WD8_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 629 + i);
  WD8_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD8_PROP_KINDS = WD8_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD8_WALL_KINDS = WD8_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD8_FLOOR_KINDS = WD8_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T30: Wildflower Town's own kit — Rose Trellis & Petal Lane
// (WAVE-T30-WILDFLOWER-PLAN.md). Indices 633-636 — RE-INDEXED
// in-branch under the Director's index ruling of 2026-11-13:
// W-DIFF8 (Hushmoor + Blossom) registered shinglefloor 629,
// shingleroof 630, inlayfloor 631, sakuraroof 632 first, so this
// block moved above that ceiling (606-607 stay empty, as
// always). 'trellisroof' (wall) — a cream diamond lattice
// over a rose bed, worn by the Contest Hall, the House and the
// town's two facade cottages. 'petalfloor' (floor) — the
// petal-flecked garden lane, the town's registered street kind.
// 'trellis' (prop) — a climbing-rose garden trellis; a pair
// flanks the Contest Hall's front walk. 'rosebush' (prop) — a
// clipped rose bush in bloom at the town's three open corners.
// Both props fully opaque with the green baked in.
export const T30_KIND_DEFS = [
  ['trellisroof', 'wall'],
  ['petalfloor', 'floor'],
  ['trellis', 'prop'],
  ['rosebush', 'prop'],
];
export const T30_KIND_CHARS = {};
T30_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 633 + i);
  T30_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T30_PROP_KINDS = T30_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T30_WALL_KINDS = T30_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T30_FLOOR_KINDS = T30_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T31 (Beacon City): the 'Gleam Lamp & Harbour Plank' kit —
// Beacon's own kit from birth (NO-SAME-KIT law). 'beaconroof'
// (wall) — harbour-red STANDING SEAM metal, worn by the Gleam
// Lighthouse, the House and the facade cottages. 'harbourfloor'
// (floor) — the town's street: bolted harbour plank decking.
// 'jettyfloor' (floor) — tarred cross-batten planks at the
// Route 40 landfall jetty. 'lampglass' (prop) — the lighthouse's
// lit lamp, brass housing + warm glass on the tower's own roof.
// Indices 645-648 per the Director's index ruling (main's kinds
// run to 632; T30 Wildflower claims from 633 in parallel; this
// block registers at 645+, verified free against origin/main,
// TILE_CHARS and every map row; 606-607 stay empty). Authored
// art: assets/sprites/pix/tiles/tile-beaconroof.pix,
// tile-harbourfloor.pix, tile-jettyfloor.pix,
// tile-prop-lampglass.pix. (WAVE-T31-BEACON-PLAN.md.)
export const T31_KIND_DEFS = [
  ['beaconroof', 'wall'],
  ['harbourfloor', 'floor'],
  ['jettyfloor', 'floor'],
  ['lampglass', 'prop'],
];
export const T31_KIND_CHARS = {};
T31_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 645 + i);
  T31_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T31_PROP_KINDS = T31_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T31_WALL_KINDS = T31_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T31_FLOOR_KINDS = T31_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T32: Ashfall Town's own kit kinds (NO-SAME-KIT law;
// WAVE-T32-ASHFALL-PLAN.md). Indices 660-662 — registered above
// main's ceiling of 636 (594-636 all singly owned, 606-607 stay
// empty) with 637-659 left clear for the parallel T31 Beacon
// claim at 645-656; kind names timberroof/ashfloor/railfence
// verified unclaimed.
export const T32_KIND_DEFS = [
  ['timberroof', 'wall'],
  ['ashfloor', 'floor'],
  ['railfence', 'prop'],
];
export const T32_KIND_CHARS = {};
T32_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 660 + i);
  T32_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T32_PROP_KINDS = T32_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T32_WALL_KINDS = T32_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T32_FLOOR_KINDS = T32_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T33 (Steamspring Town): the 'Rustflag & Steam Terrace'
// kit — Steamspring's own kit from birth (NO-SAME-KIT law).
// 'steamroof' (wall) — rust BARREL-TILE: vertical half-round
// clay tile ridges in the town's volcanic rust register, worn
// by the House and the town's two facade cottages. 'steamfloor'
// (floor) — the town's registered street: large irregular rust
// flagstones (the "spring street" of the town sign's own
// words). 'terracefloor' (floor) — pale mineral-crust terrace
// slabs, the hot spring's terrace ring. 'steamvent' (prop) — a
// stone-capped spring vent with its steam cloud, at the pass
// street's shoulder and the spring's NE corner. Indices
// 672-675 per the Director's index ruling (main's kinds run
// 594-636 + 645-648; T32 Ashfall holds 660-662; 606-607,
// 637-644, 649-659, 663-671 stay empty), verified free against
// origin/main, TILE_CHARS and every map row. Authored art:
// assets/sprites/pix/tiles/tile-steamroof.pix,
// tile-steamfloor.pix, tile-terracefloor.pix,
// tile-prop-steamvent.pix. (WAVE-T33-STEAMSPRING-PLAN.md.)
export const T33_KIND_DEFS = [
  ['steamroof', 'wall'],
  ['steamfloor', 'floor'],
  ['terracefloor', 'floor'],
  ['steamvent', 'prop'],
];
export const T33_KIND_CHARS = {};
T33_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 672 + i);
  T33_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T33_PROP_KINDS = T33_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T33_WALL_KINDS = T33_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T33_FLOOR_KINDS = T33_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T34: Highbranch City's own kit — "Leafscale & Lashed Plank"
// (WAVE-T34-HIGHBRANCH-PLAN.md). Indices 684-687 — verified against
// origin/main at registration: in-tree kinds end at 662 (T32);
// 663-683 unclaimed in-tree, with 672-675 held by T33 Steamspring's
// parallel claim per the Director's allocation, so this block
// registers ABOVE that claim (606-607 stay empty, as always; kind
// names leafroof/canopyfloor/camoleon/bunting verified unclaimed).
// 'leafroof' (wall) — overlapping leaf scales in canopy greens,
// worn by the Gym, the House and the town's two facade cottages.
// 'canopyfloor' (floor) — the town's registered street kind:
// sun-bleached vertical planks bound by rope-lashing bands and
// flecked with fallen leaves (the shipped boardwalk decks stay in
// the south as the Long Walkway — registered, not re-paved).
// 'camoleon' (prop) — a CAMOLEON napping on the east deck, where
// the town's own sign and the approved painting both put it; the
// boardwalk it stands on is baked into its tile. 'bunting' (prop)
// — a pennant strand dressing the gym's approach (the painting's
// 'bunting hall'), grass baked in. Both props fully opaque.
export const T34_KIND_DEFS = [
  ['leafroof', 'wall'],
  ['canopyfloor', 'floor'],
  ['camoleon', 'prop'],
  ['bunting', 'prop'],
];
export const T34_KIND_CHARS = {};
T34_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 684 + i);
  T34_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T34_PROP_KINDS = T34_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T34_WALL_KINDS = T34_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T34_FLOOR_KINDS = T34_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T35: Lotus Cove City's own kit kinds (Lavender Tile &
// Cobble Harbour): the scalloped lavender barrel-tile roof on
// its Contest Hall + Department Store stamps and facade
// cottages, the round-cobble harbour street, the chained
// notice-board barrier on its harbour-cave brow, and the
// brinegull mooring post at its pier head. Indices 696-699 per
// the Director's index ruling (main's kinds run 594-636 +
// 645-648 + 660-662 + 672-675; the parallel T34 Highbranch
// claim holds 684-687 on its branch; 676-683 + 688-695 stay
// empty), verified free against origin/main, TILE_CHARS and
// every map row. Authored art:
// assets/sprites/pix/tiles/tile-lotusroof.pix,
// tile-cobblefloor.pix, tile-prop-chainbar.pix,
// tile-prop-gullpost.pix. (WAVE-T35-LOTUSCOVE-PLAN.md.)
export const T35_KIND_DEFS = [
  ['lotusroof', 'wall'],
  ['cobblefloor', 'floor'],
  ['chainbar', 'prop'],
  ['gullpost', 'prop'],
];
export const T35_KIND_CHARS = {};
T35_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 696 + i);
  T35_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T35_PROP_KINDS = T35_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T35_WALL_KINDS = T35_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T35_FLOOR_KINDS = T35_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T36 (WAVE-T36-STARFALL-PLAN.md): Starfall City's own
// four-tile kind set (NO-SAME-KIT law — every town its own kit).
// Kind indices 708-711, verified free against origin/main at
// dispatch (T34's 684-687 are main's ceiling; 688-707 are left
// clear, including 696-699 for the parallel T35 Lotus Cove
// claim). starroof is Starshingle — pale-cyan shingle courses
// with tiny star flecks, worn by the Space Center facade,
// Alban's house and the facade cottage (the Gym keeps its
// banded tr-mossdeep slab — two roof families, one palette);
// starfloor is the town's star-sand lane, its registered street
// kind; dockfloor is the horizontal harbour-board pier kind
// (the second registered street kind, on the r124/r125/r126
// surf seams + the E bridge); chartboard is the meteor-chart
// board the Space Center's own sign names, seated east of the
// Center.
export const T36_KIND_DEFS = [
  ['starroof', 'wall'],
  ['starfloor', 'floor'],
  ['dockfloor', 'floor'],
  ['chartboard', 'prop'],
];
export const T36_KIND_CHARS = {};
T36_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 708 + i);
  T36_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T36_PROP_KINDS = T36_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T36_WALL_KINDS = T36_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T36_FLOOR_KINDS = T36_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T37: Craterlake City's own kit — "Crater Ashlar &
// Ventstone": the craterroof (coursed crater-white ashlar, worn
// by the Gym and the town's two facade cottages), the
// craterfloor (white crater sett with ash-drifted grout — the
// registered street material of the front street, the cave
// avenue, the spokes and the lake ring), the craterwall (the
// cottages' crater-stone wall face), the easel (the painter's
// easel on the lake's east shore, beside CASPIAN FAN RUE's post)
// and the ventstone (a crater boulder pierced by a round vent
// mouth, at the rim ledge's two ends). Indices 720-724 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699; the parallel T36
// Starfall claim holds 708-711 on its branch; 606-607 + 637-644
// + 649-659 + 663-671 + 676-683 + 688-695 + 700-707 + 712-719
// stay empty), verified free against origin/main, TILE_CHARS
// and every map row. Authored art:
// assets/sprites/pix/tiles/tile-craterroof.pix,
// tile-craterfloor.pix, tile-craterwall.pix,
// tile-prop-painteasel.pix, tile-prop-ventstone.pix.
// (WAVE-T37-CRATERLAKE-PLAN.md.)
export const T37_KIND_DEFS = [
  ['craterroof', 'wall'],
  ['craterfloor', 'floor'],
  ['craterwall', 'wall'],
  ['painteasel', 'prop'],
  ['ventstone', 'prop'],
];
export const T37_KIND_CHARS = {};
T37_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 720 + i);
  T37_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T37_PROP_KINDS = T37_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T37_WALL_KINDS = T37_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T37_FLOOR_KINDS = T37_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T38: Driftlog Town's own kit — "Lashed Log & Coral
// Door": the raftfloor (lashed-log street — horizontal log
// courses with staggered end joints and rope lashings, the
// registered street material of the north avenue and the r131
// landfall nose), the raftroof (raft-timber shingles worn by
// the town's three facade boat-houses), the coraldoor (the
// coral door face of the town style table, swapped onto the
// houses' shipped facade-panel cells), the anchor (FLOAT KID
// WREN's anchor fence post) and the pontoon (a lashed log
// bundle still growing off the town's west edge). Indices
// 732-736 per the Director's index ruling (main's kinds run
// 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724; 606-607 + 637-644 + 649-659 + 663-671 +
// 676-683 + 688-695 + 700-707 + 712-719 + 725-731 stay empty),
// verified free against origin/main, TILE_CHARS and every map
// row. The town's ground is its own re-authored tg-pacifidlog
// art (no new index — the kind and char U+1F7C already exist).
// Authored art: assets/sprites/pix/tiles/tile-raftfloor.pix,
// tile-raftroof.pix, tile-coraldoor.pix, tile-prop-anchor.pix,
// tile-prop-pontoon.pix, tile-tg-pacifidlog.pix.
// (WAVE-T38-DRIFTLOG-PLAN.md.)
export const T38_KIND_DEFS = [
  ['raftfloor', 'floor'],
  ['raftroof', 'wall'],
  ['coraldoor', 'wall'],
  ['anchor', 'prop'],
  ['pontoon', 'prop'],
];
export const T38_KIND_CHARS = {};
T38_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 732 + i);
  T38_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T38_PROP_KINDS = T38_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T38_WALL_KINDS = T38_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T38_FLOOR_KINDS = T38_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T39: Perennial City's own kit kinds (the League Marble &
// Banner Gold kit): a parade floor of large ivory-gold-veined
// marble slabs as the town's street; a badge-frieze marble roof
// for the League hall alone; verdigris standing-seam roofs for
// its two facade houses; and two fully-opaque props — a
// bracket-season pennant for the plateau flag fields and the
// falls at the rim's east foot. Director's index ruling (main's
// kinds run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 +
// 696-699 + 708-711 + 720-724; the parallel T38 claim holds
// 732-736 on its branch; 606-607 + 637-644 + 649-659 + 663-671 +
// 676-683 + 688-695 + 700-707 + 712-719 + 725-743 stay empty),
// verified free against origin/main, TILE_CHARS and every map
// row. Authored art: assets/sprites/pix/tiles/tile-plateaufloor.pix,
// tile-badgeroof.pix, tile-verdiroof.pix, tile-prop-pennant.pix,
// tile-prop-falls.pix. (WAVE-T39-PERENNIAL-PLAN.md.)
export const T39_KIND_DEFS = [
  ['plateaufloor', 'floor'],
  ['badgeroof', 'wall'],
  ['verdiroof', 'wall'],
  ['pennant', 'prop'],
  ['falls', 'prop'],
];
export const T39_KIND_CHARS = {};
T39_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 744 + i);
  T39_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T39_PROP_KINDS = T39_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T39_WALL_KINDS = T39_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T39_FLOOR_KINDS = T39_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T40: Clover Town's own kit — "Clover Earth & Batten
// Timber": the cloverfloor (packed-earth lane strewn with
// three-lobe clover marks — the registered street material of
// the front street, the through road, the main lane and the
// south lane), the battenroof (board-and-batten green timber
// worn by the town's two houses and two facade cottages), the
// sapling (a two-leaf sapling in a timber guard ring; a pair
// flanks the Center's frontage) and the cloverbed (a clipped
// clover mound on the town's open corners). Indices 756-759
// per the Director's index ruling (main's kinds run 594-636 +
// 645-648 + 660-662 + 672-675 + 684-687 + 696-699 + 708-711 +
// 720-724 + 732-736 + 744-748 (T39); 606-607 + 637-644 +
// 649-659 + 663-671 + 676-683 + 688-695 + 700-707 + 712-719 +
// 725-731 + 737-743 + 749-755 stay empty), verified free
// against origin/main, TILE_CHARS and every map row.
// Authored art: assets/sprites/pix/tiles/tile-cloverfloor.pix,
// tile-battenroof.pix, tile-prop-sapling.pix,
// tile-prop-cloverbed.pix. (WAVE-T40-CLOVER-PLAN.md.)
export const T40_KIND_DEFS = [
  ['cloverfloor', 'floor'],
  ['battenroof', 'wall'],
  ['sapling', 'prop'],
  ['cloverbed', 'prop'],
];
export const T40_KIND_CHARS = {};
T40_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 756 + i);
  T40_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T40_PROP_KINDS = T40_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T40_WALL_KINDS = T40_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T40_FLOOR_KINDS = T40_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T41: Shingle Town's own kit — "Shell Shingle & Raked
// Shingle-Sand": the shellfloor (raked shell-sand street — pale
// sand combed into fine grooves and strewn with shell chips,
// the registered street material), the shellroof (scalloped
// pale shell-shingle courses worn by the House and the town's
// two facade cottages), the tideslug (the TIDESLUG of Shingle
// Beach beside ANA's post — her dialogue is its caption) and
// the tidelog (a bleached driftwood log on the west beach —
// the beach sign's own driftwood). Indices 768-771 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
// 732-736 + 744-748; the parallel T40 claim holds 756-759 on
// its branch; 606-607 + 637-644 + 649-659 + 663-671 + 676-683 +
// 688-695 + 700-707 + 712-719 + 725-731 + 737-743 + 749-767
// stay empty), verified free against origin/main, TILE_CHARS
// and every map row. The wave also RESTORES the Center stamp's
// missing east half (l/m/K/A — shipped as bare tg2 mud, its
// K-door warp firing from a mud cell; no new index — the stamp
// chars already exist). Authored art:
// assets/sprites/pix/tiles/tile-shellfloor.pix,
// tile-shellroof.pix, tile-prop-tideslug.pix,
// tile-prop-tidelog.pix. (WAVE-T41-SHINGLE-PLAN.md.)
export const T41_KIND_DEFS = [
  ['shellfloor', 'floor'],
  ['shellroof', 'wall'],
  ['tideslug', 'prop'],
  ['tidelog', 'prop'],
];
export const T41_KIND_CHARS = {};
T41_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 768 + i);
  T41_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T41_PROP_KINDS = T41_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T41_WALL_KINDS = T41_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T41_FLOOR_KINDS = T41_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T42: Revelry City's own kit — "Broadcast Steel & Signal
// Slab": the beamfloor (large smooth steel-blue signal slabs with
// riveted corners — the registered street material of the front
// street, the east-west avenue and the gate avenues), the beamroof
// (a horizontal steel-glass beam panel worn only by the TV
// station's roof cells), the condoroof (a lit-window frieze worn
// only by the Condo's roof cells, so the condo stops sharing the
// base house roof) and the screentotem (a standing street screen;
// a pair flanks the front lawn). Indices 780-783 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
// 732-736 + 744-748 + 756-759 (T40) + 768-771 (T41, parallel
// branch); 760-767 + 772-779 stay empty), verified free against
// origin/main, TILE_CHARS and every map row. Authored art:
// assets/sprites/pix/tiles/tile-beamfloor.pix,
// tile-beamroof.pix, tile-condoroof.pix,
// tile-prop-screentotem.pix. (WAVE-T42-REVELRY-PLAN.md.)
export const T42_KIND_DEFS = [
  ['beamfloor', 'floor'],
  ['beamroof', 'wall'],
  ['condoroof', 'wall'],
  ['screentotem', 'prop'],
];
export const T42_KIND_CHARS = {};
T42_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 780 + i);
  T42_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T42_PROP_KINDS = T42_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T42_WALL_KINDS = T42_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T42_FLOOR_KINDS = T42_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T43: Coalseam City's own kit from birth (NO-SAME-KIT
// law): 'Soot Iron & Clinker Ash' — idx 792-795 per the Director's
// index ruling (main's kinds run 594-636 + 645-648 + 660-662 +
// 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
// 744-748 + 756-759 + 768-771; the parallel T42 claim holds
// 780-783; the gaps stay empty). clinkerfloor is the packed
// black-ash street; ironroof is the riveted soot-iron plate worn
// by the Gym's and Museum's roof cells (the two stamps the
// backend left sharing tr-oreburgh); coalcarts stands at the
// mine sign's foot; fossilskull at the Museum's east shoulder.
export const T43_KIND_DEFS = [
  ['clinkerfloor', 'floor'],
  ['ironroof', 'wall'],
  ['coalcarts', 'prop'],
  ['fossilskull', 'prop'],
];
export const T43_KIND_CHARS = {};
T43_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 792 + i);
  T43_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T43_PROP_KINDS = T43_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T43_WALL_KINDS = T43_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T43_FLOOR_KINDS = T43_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);

// Wave T44: Honeyfield Town's own kit — 'Honeycomb & Bloom': the
// honeyfloor (a hexagonal honeycomb lane in pale amber — the
// town's registered street), the bloomroof (magenta petal-scale
// shingles, worn only by the shipped House's th roof cells and
// the two facade cottages, so the house stops sharing the base
// roof) and two props: the beehive (a straw skep seated beside
// the town's honey trees) and the shopsign (the Mart's hanging
// shop board at its east frontage — the Backstory Sync Audit's
// shopfront fix). Indices 804-807 per the Director's index
// ruling (main's kinds run 594-636 + 645-648 + 660-662 +
// 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
// 744-748 + 756-759 (T40) + 768-771 (T41) + 780-783 (T42); the
// parallel T43 claim holds 792-795; 784-803 + 796-803 stay
// empty), verified free against origin/main, TILE_CHARS and
// every map row. Authored art: assets/sprites/pix/tiles/
// tile-honeyfloor.pix, tile-bloomroof.pix,
// tile-prop-beehive.pix, tile-prop-shopsign.pix.
// (WAVE-T44-HONEYFIELD-PLAN.md.)
export const T44_KIND_DEFS = [
  ['honeyfloor', 'floor'],
  ['bloomroof', 'wall'],
  ['beehive', 'prop'],
  ['shopsign', 'prop'],
];
export const T44_KIND_CHARS = {};
T44_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 804 + i);
  T44_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T44_PROP_KINDS = T44_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T44_WALL_KINDS = T44_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T44_FLOOR_KINDS = T44_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T45: Heritage City's own kit from birth (NO-SAME-KIT
// law): 'Historic Stone & Leaf-Shadow' — idx 816-819 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
// 732-736 + 744-748 + 756-759 + 768-771 + 780-783 + 792-795;
// the parallel T44 claim holds 804-807; the gaps stay empty,
// 808-815 included). heritagefloor is the worn teal-green
// flagstone street; heritageroof is the cut-stone teal slate
// worn by the Gym's roof cells (breaking the Gym + Combine
// building tr-eterna share); oldstatue stands in the statue
// garden; flowerurn spills at the town's gates. Art:
// assets/sprites/pix/tiles/tile-heritagefloor.pix,
// tile-heritageroof.pix, tile-prop-oldstatue.pix,
// tile-prop-flowerurn.pix. (WAVE-T45-HERITAGE-PLAN.md.)
export const T45_KIND_DEFS = [
  ['heritagefloor', 'floor'],
  ['heritageroof', 'wall'],
  ['oldstatue', 'prop'],
  ['flowerurn', 'prop'],
];
export const T45_KIND_CHARS = {};
T45_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 816 + i);
  T45_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T45_PROP_KINDS = T45_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T45_WALL_KINDS = T45_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T45_FLOOR_KINDS = T45_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T46: Inglenook City's own kit — 'Violet Slate & Gilt': the
// giltfloor (warm gold-ochre setts in a running offset grid —
// the town's registered street), the domeroof (gold dome
// segments with violet seams, worn only by the shipped Contest
// Hall's tr roof cells, so the town sign's 'Contests under the
// gold dome' becomes true and the Gym + Contest Hall roof share
// breaks) and two props: the poffintin (a poffin tin stack at
// the Poffin House landing and MASA's post — the town tale
// 'Auntie's Poffin Tin' made dressing) and the berrybasket (a
// berry basket at the Mart's and the Contest Hall's frontages).
// Indices 828-831 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) +
// 768-771 (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44);
// the parallel T45 claim holds 816-819; 808-815 + 820-827 stay
// empty), verified free against origin/main, TILE_CHARS and
// every map row. Authored art: assets/sprites/pix/tiles/
// tile-giltfloor.pix, tile-domeroof.pix,
// tile-prop-poffintin.pix, tile-prop-berrybasket.pix.
// (WAVE-T46-INGLENOOK-PLAN.md.)
export const T46_KIND_DEFS = [
  ['giltfloor', 'floor'],
  ['domeroof', 'wall'],
  ['poffintin', 'prop'],
  ['berrybasket', 'prop'],
];
export const T46_KIND_CHARS = {};
T46_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 828 + i);
  T46_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T46_PROP_KINDS = T46_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T46_WALL_KINDS = T46_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T46_FLOOR_KINDS = T46_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);// Wave T47: Repose Town's own kit — 'Olive Shingle & River
// Pebble': the pebblefloor (rounded river pebbles in offset
// rows bedded in pale sand mortar — the town's registered
// street), the oliveroof (olive wood shingle courses, worn
// only by the shipped Daycare stamp's th roof cells, so the
// painting's olive roofs land on the town's namesake building
// and the House + Daycare roof share breaks) and two props:
// the standingstone (a weathered standing stone with cord-mark
// grooves — the tale 'The Day-Care Egg Ledger' register —
// flanking the Route 210 landing) and the eggbasket (a straw
// nest of eggs at the day-care yard and the Daycare frontage).
// Indices 840-843 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) +
// 768-771 (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44) +
// 816-819 (T45); the parallel T46 claim holds 828-831; 808-815 +
// 820-827 + 832-839 stay empty), verified free against
// origin/main, TILE_CHARS and every map row. Authored art:
// assets/sprites/pix/tiles/tile-pebblefloor.pix,
// tile-oliveroof.pix, tile-prop-standingstone.pix,
// tile-prop-eggbasket.pix. (WAVE-T47-REPOSE-PLAN.md.)
export const T47_KIND_DEFS = [
  ['pebblefloor', 'floor'],
  ['oliveroof', 'wall'],
  ['standingstone', 'prop'],
  ['eggbasket', 'prop'],
];
export const T47_KIND_CHARS = {};
T47_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 840 + i);
  T47_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T47_PROP_KINDS = T47_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T47_WALL_KINDS = T47_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T47_FLOOR_KINDS = T47_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T48: Shardfall City's own kit — 'Shard Slate & Star Crate':
// the shardfloor (dark cracked meteor-slate flags with crystal
// shard inlay — the town's registered street), the shardroof
// (checker slate — the gym's checkered puzzle floor spilled onto
// its roof, worn only by the shipped Gym stamp's tr roof cells,
// so the Gym + Dept Store + HQ three-way roof share breaks) and
// two props: the starcrate (a heavy star-marked shipping crate at
// the HQ landing's doorstep and the warehouse hand's shoulder —
// the HQ sign's 'deliveries come and go' made dressing) and the
// meteorcore (the tale's warm fallen shard, in the watcher's
// crater garden east and one transferred seat on the north lawn).
// Indices 852-855 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) +
// 768-771 (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44) +
// 816-819 (T45) + 828-831 (T46); the parallel T47 claim holds
// 840-843; 808-815 + 820-827 + 832-839 + 844-851 stay empty),
// verified free against origin/main, TILE_CHARS and every map
// row. Authored art: assets/sprites/pix/tiles/tile-shardfloor.pix,
// tile-shardroof.pix, tile-prop-starcrate.pix,
// tile-prop-meteorcore.pix. (WAVE-T48-SHARDFALL-PLAN.md.)
export const T48_KIND_DEFS = [
  ['shardfloor', 'floor'],
  ['shardroof', 'wall'],
  ['starcrate', 'prop'],
  ['meteorcore', 'prop'],
];
export const T48_KIND_CHARS = {};
T48_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 852 + i);
  T48_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T48_PROP_KINDS = T48_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T48_WALL_KINDS = T48_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T48_FLOOR_KINDS = T48_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T49: Bridgeport City's own kit from birth — 'Ring Quay &
// Rivet Iron': the ringfloor (large blue-grey harbour flags with
// a dark iron mooring ring inlaid in the flags — the town's
// registered street), the rivetroof (riveted pale iron plate
// courses carrying a bold badge roundel, worn only by the
// shipped Gym stamp's tr roof cells, so the Gym + Library
// tr-roof share breaks and the town's unmarked gym hall — the
// Backstory-Sync-Audit's Bridgeport flag — is marked by its
// roof emblem), the trussfloor (a dark iron truss deck, worn
// only by the shipped canal span's four boardwalk cells at
// rows 8-9: the town sign's 'one iron bridge' made deck; also
// registered street material for canalave), and two props: the
// mooringpost (an iron mooring bollard with a rope coil — the
// canal head and the east shore) and the harbourbell (the brass
// ferry bell on its iron post, at the pier's land side).
// Indices 864-868 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) +
// 768-771 (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44) +
// 816-819 (T45) + 828-831 (T46) + 840-843 (T47); the parallel
// T48 claim holds 852-855; 808-815 + 820-827 + 832-839 +
// 844-851 + 856-863 stay empty), verified free against
// origin/main, TILE_CHARS and every map row. Authored art:
// assets/sprites/pix/tiles/tile-ringfloor.pix,
// tile-rivetroof.pix, tile-trussfloor.pix,
// tile-prop-mooringpost.pix, tile-prop-harbourbell.pix.
// (WAVE-T49-BRIDGEPORT-PLAN.md.)
export const T49_KIND_DEFS = [
  ['ringfloor', 'floor'],
  ['rivetroof', 'wall'],
  ['mooringpost', 'prop'],
  ['harbourbell', 'prop'],
  ['trussfloor', 'floor'],
];
export const T49_KIND_CHARS = {};
T49_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 864 + i);
  T49_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T49_PROP_KINDS = T49_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T49_WALL_KINDS = T49_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T49_FLOOR_KINDS = T49_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T50: Fenland City's own kit — "Marsh Boardwalk & Bog
// Eyes": one street (the marsh boardwalk itself: horizontal
// weathered-olive planks, pegged joints, a pale worn centre),
// one roof (steep vertical board courses, worn by the Gym —
// whose shipped tr-pastoria wash it replaces — and the two
// facade cottages; the Gatehouse keeps tr), and two props:
// the bogeyes (the MUDGILL's eyes and fin at water level in
// the south pool — the GREAT MIRE sign's own words and ODO's
// tenancy, realized as dressing per the Backstory Sync Audit;
// no actor invented) and the lilypad (two pads and the
// BOGNEWT, a tiny frog, beside it). Indices 876-879 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
// 732-736 + 744-748 + 756-759 (T40) + 768-771 (T41) + 780-783
// (T42) + 792-795 (T43) + 804-807 (T44) + 816-819 (T45) +
// 828-831 (T46) + 840-843 (T47) + 852-855 (T48); the parallel
// T49 claim holds 864-868; 808-815 + 820-827 + 832-839 +
// 844-851 + 856-863 + 869-875 stay empty), verified free
// against origin/main, TILE_CHARS and every map row.
// Authored art: assets/sprites/pix/tiles/tile-walkfloor.pix,
// tile-boardroof.pix, tile-prop-bogeyes.pix,
// tile-prop-lilypad.pix. (WAVE-T50-FENLAND-PLAN.md.)
export const T50_KIND_DEFS = [
  ['walkfloor', 'floor'],
  ['boardroof', 'wall'],
  ['bogeyes', 'prop'],
  ['lilypad', 'prop'],
];
export const T50_KIND_CHARS = {};
T50_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 876 + i);
  T50_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T50_PROP_KINDS = T50_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T50_WALL_KINDS = T50_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T50_FLOOR_KINDS = T50_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T51: Astral Town's own kit from birth — 'Moonstone &
// Dusk Timber': the moonfloor (large irregular pale-lavender
// moonstone flags with dark violet grout and a star fleck on
// each flag face — the town's registered street), the duskroof
// (deep violet ancient-timber shingle courses, worn only by
// the shipped Shrine stamp's tr roof cells, so the town's
// landmark wears the town's own register against the houses'
// brown timber), and two props: the muralpanel (a standing
// stone panel with the hand-copied mural glyphs — moon, star,
// leaf — at the OLD SHRINE sign's shoulder and beside the
// mural copyist's post) and the ringstone (a weathered
// standing stone with a carved ring — the pair flanks the
// shrine plaza's north gate). Indices 888-891 per the
// Director's index ruling (main's kinds run 594-636 + 645-648 +
// 660-662 + 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
// 732-736 + 744-748 + 756-759 (T40) + 768-771 (T41) + 780-783
// (T42) + 792-795 (T43) + 804-807 (T44) + 816-819 (T45) +
// 828-831 (T46) + 840-843 (T47) + 852-855 (T48) + 864-868
// (T49); the parallel T50 claim holds 876-879; 880-887 stay
// empty), verified free against origin/main, TILE_CHARS and
// every map row. Authored art: assets/sprites/pix/tiles/
// tile-moonfloor.pix, tile-duskroof.pix,
// tile-prop-muralpanel.pix, tile-prop-ringstone.pix.
// (WAVE-T51-ASTRAL-PLAN.md.)
export const T51_KIND_DEFS = [
  ['moonfloor', 'floor'],
  ['duskroof', 'wall'],
  ['muralpanel', 'prop'],
  ['ringstone', 'prop'],
];
export const T51_KIND_CHARS = {};
T51_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 888 + i);
  T51_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T51_PROP_KINDS = T51_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T51_WALL_KINDS = T51_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T51_FLOOR_KINDS = T51_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T52 — Rimefall City kit 'Packed Snow & Drift Cap': the
// rimefloor (hard-packed snow with two dark sledge-runner
// grooves running the tile's length and sparse ice flecks —
// the snow port's streets are snow itself, pressed flat; a
// grooved packed field, unlike Astral's lavender moonstone
// flags, Fenland's pegged olive planks, Repose's rounded
// pebbles and the fleet's cave/route ice kinds), the
// driftroof (dark slate shingles at the foot under a deep
// snowdrift cap with a scalloped drift edge and an icicle
// fringe — worn by the Gym only, breaking the Gym + Temple
// tr-snowpoint roof share; the Temple keeps tr), the
// ironbollard (a squat dark-iron mooring bollard, rope coil
// at its foot, snow cap — the pier block's shoulder pair;
// distinct from Bridgeport's tall timber mooringpost) and
// the stonelantern (a snow-capped stone lantern with a warm
// window slit — the temple approach pair). Indices 900-903
// per the Director's index ruling (main's kinds run 594-636 +
// 645-648 + 660-662 + 672-675 + 684-687 + 696-699 + 708-711 +
// 720-724 + 732-736 + 744-748 + 756-759 (T40) + 768-771 (T41) +
// 780-783 (T42) + 792-795 (T43) + 804-807 (T44) + 816-819
// (T45) + 828-831 (T46) + 840-843 (T47) + 852-855 (T48) +
// 864-868 (T49) + 876-879 (T50) + 888-891 (T51); 892-899 stay
// empty), verified free against origin/main, TILE_CHARS and
// every map row. Authored art:
// assets/sprites/pix/tiles/tile-rimefloor.pix,
// tile-driftroof.pix, tile-prop-ironbollard.pix,
// tile-prop-stonelantern.pix. (WAVE-T52-RIMEFALL-PLAN.md.)
export const T52_KIND_DEFS = [
  ['rimefloor', 'floor'],
  ['driftroof', 'wall'],
  ['ironbollard', 'prop'],
  ['stonelantern', 'prop'],
];
export const T52_KIND_CHARS = {};
T52_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 900 + i);
  T52_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T52_PROP_KINDS = T52_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T52_WALL_KINDS = T52_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T52_FLOOR_KINDS = T52_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T53 — Brightshore City kit 'Solar Panel & Amber Glint': the
// panelfloor (a strict golden photovoltaic slab grid with dark
// seams, a lit lip, busbar tones and one glint cross per tile —
// the solar city's roads are panels that permit feet; a rigid
// manufactured grid, unlike Revelry's grey steel beamfloor,
// Bridgeport's grey ringed quay stone, Fenland's pegged timber
// planks, Astral's lavender moonstone flags and Rimefall's
// grooved packed snow), the panelroof (offset courses of
// deep-amber panels seamed in solar blue with sparse glint
// flecks — worn by the Gym + the facade cottage, breaking the
// Gym + Lighthouse tr-sunnyshore roof share; the Lighthouse
// keeps tr), the glintpost (a slim post topped with a small
// tilted solar panel catching one glint — the avenue pair) and
// the coilcradle (the tale's spare coil, three copper rings on
// a wooden cradle at the Lighthouse's east shoulder — a
// recorded-beat dressing realization, dressing only).
// Indices 912-915 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) + 768-771
// (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44) + 816-819
// (T45) + 828-831 (T46) + 840-843 (T47) + 852-855 (T48) +
// 864-868 (T49) + 876-879 (T50) + 888-891 (T51) + 900-903 (T52,
// on its branch awaiting merge); 904-911 stay empty), verified
// free against origin/main df3b8d33, TILE_CHARS and every map
// row. Authored art: assets/sprites/pix/tiles/tile-panelfloor.pix,
// tile-panelroof.pix, tile-prop-glintpost.pix,
// tile-prop-coilcradle.pix. (WAVE-T53-BRIGHTSHORE-PLAN.md.)
export const T53_KIND_DEFS = [
  ['panelfloor', 'floor'],
  ['panelroof', 'wall'],
  ['glintpost', 'prop'],
  ['coilcradle', 'prop'],
];
export const T53_KIND_CHARS = {};
T53_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 912 + i);
  T53_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T53_PROP_KINDS = T53_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T53_WALL_KINDS = T53_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T53_FLOOR_KINDS = T53_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T54 — Clashfield kit 'Basalt Slab & Harbour Timber': the
// basaltfloor (large fitted dark basalt slabs, tone-varied faces
// in pale jittered grout with sparse rust-red weather flecks —
// the hard coast's hard road; a fitted-slab field, unlike
// Shardfall's regular shard checker, Coalseam's fine clinker ash,
// Bridgeport's ringed quay stone, Brightshore's rigid golden
// panel grid), the basaltroof (basalt-red shingle courses in the
// town-style palette, horizontal courses with offset joints —
// worn by the shipped House stamp's th cells + the wave's two
// facade cottages, breaking the House out of the sister-town
// sunnyshore family it shipped in), and two props: the listboard
// (the Zone registrar's pinned-list notice board at OKTAVIA's
// shoulder — her recorded lists beat as dressing only) and the
// coilbollard (a timber harbour bollard with an iron cap band
// and a rope coil at its foot — the pair flanks the harbour lane
// beside NORTHSTAR). Indices 924-927 per the Director's index
// ruling (main's kinds run 594-636 + 645-648 + 660-662 +
// 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
// 744-748 + 756-759 (T40) + 768-771 (T41) + 780-783 (T42) +
// 792-795 (T43) + 804-807 (T44) + 816-819 (T45) + 828-831
// (T46) + 840-843 (T47) + 852-855 (T48) + 864-868 (T49) +
// 876-879 (T50) + 888-891 (T51) + 900-903 (T52); the parallel
// T53 claim holds 912-915; 904-911 + 916-923 stay empty),
// verified free against origin/main, TILE_CHARS and every map
// row. Authored art: assets/sprites/pix/tiles/
// tile-basaltfloor.pix, tile-basaltroof.pix,
// tile-prop-listboard.pix, tile-prop-coilbollard.pix.
// (WAVE-T54-CLASHFIELD-PLAN.md.)
export const T54_KIND_DEFS = [
  ['basaltfloor', 'floor'],
  ['basaltroof', 'wall'],
  ['listboard', 'prop'],
  ['coilbollard', 'prop'],
];
export const T54_KIND_CHARS = {};
T54_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 924 + i);
  T54_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T54_PROP_KINDS = T54_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T54_WALL_KINDS = T54_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T54_FLOOR_KINDS = T54_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T55 — Wildreach kit 'Hardpan & Adobe': the hardpanfloor
// (hard-packed sand-and-gravel — pale khaki-tan packed earth with
// fine gravel speckle, sparse pale pebbles and faint wind streaks;
// the painting's pale sand roads. A fine organic packed-earth
// scatter, unlike Fenland's walkfloor pegged timber planks,
// Clashfield's basaltfloor fitted dark slabs, Bridgeport's
// ringfloor ringed quay stone and Brightshore's panelfloor rigid
// golden grid), the adoberoof (large flat sun-baked khaki clay
// slabs with wide dark joints offset per band and bleached top
// edges — worn by the House + both facade cottages; large flat
// slabs, unlike Lilac's bronzroof shingle courses, Fairhaven's
// canvasroof stitched canvas and Fenland's boardroof vertical
// boards), the cookpot (the outpost kitchen's iron pot on a
// tripod over a fire, steam curling — at TRAIL COOK BORIN's west
// shoulder, a recorded-beat dressing realization, dressing only)
// and the chartstand (CARTOGRAPHER WREN's easel chart with its
// coastline, route dashes and compass rose — at her north
// shoulder, dressing only).
// Indices 936-939 per the Director's index ruling (main's kinds
// run 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
// 708-711 + 720-724 + 732-736 + 744-748 + 756-759 (T40) + 768-771
// (T41) + 780-783 (T42) + 792-795 (T43) + 804-807 (T44) + 816-819
// (T45) + 828-831 (T46) + 840-843 (T47) + 852-855 (T48) +
// 864-868 (T49) + 876-879 (T50) + 888-891 (T51) + 900-903 (T52) +
// 912-915 (T53) + 924-927 (T54, on its branch awaiting merge);
// 928-935 stay empty), verified free against origin/main,
// TILE_CHARS and every map row. Kind name note: 'chartboard' is
// already claimed elsewhere in the fleet; the prop is
// 'chartstand'. Authored art:
// assets/sprites/pix/tiles/tile-hardpanfloor.pix,
// tile-adoberoof.pix, tile-prop-cookpot.pix,
// tile-prop-chartstand.pix. (WAVE-T55-WILDREACH-PLAN.md.)
export const T55_KIND_DEFS = [
  ['hardpanfloor', 'floor'],
  ['adoberoof', 'wall'],
  ['cookpot', 'prop'],
  ['chartstand', 'prop'],
];
export const T55_KIND_CHARS = {};
T55_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 936 + i);
  T55_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T55_PROP_KINDS = T55_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T55_WALL_KINDS = T55_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T55_FLOOR_KINDS = T55_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T56 (Palmside kit — Coral Flag & Pearl Stucco): the
// town's own authored street kind (coralfloor — large fitted
// coral-rose flags with cream grout on an offset grid, a paler
// worn sheen at each flag's centre), one authored WALL kind
// (pearlroof — smooth pearl-stucco slabs in the town style's
// own family, roof #e8d9c4/#bfae94/#f7ecdc, worn by both villa
// stamps' th cells + the wave's two facade cottages, breaking
// the villas out of the sister-town sunnyshore family the whole
// town shipped in), and two props: the sunlounger (a coral-
// frame resort lounger with a folded towel — the pair rests on
// PRIA's lawn, the town sign's 'softest beds' beat) and the
// palmshade (a shade palm — the painting's palm shade, the
// town's namesake dressing). Indices 948-951 per the Director's
// index ruling (main's kinds run 594-636 + 645-648 + 660-662 +
// 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
// 744-748 + 756-759 (T40) + 768-771 (T41) + 780-783 (T42) +
// 792-795 (T43) + 804-807 (T44) + 816-819 (T45) + 828-831
// (T46) + 840-843 (T47) + 852-855 (T48) + 864-868 (T49) +
// 876-879 (T50) + 888-891 (T51) + 900-903 (T52) + 912-915
// (T53) + 924-927 (T54); the parallel T55 claim holds 936-939;
// 940-947 stay empty), verified free against origin/main,
// TILE_CHARS and every map row. Authored art:
// assets/sprites/pix/tiles/tile-coralfloor.pix,
// tile-pearlroof.pix, tile-prop-sunlounger.pix,
// tile-prop-palmshade.pix. (WAVE-T56-PALMSIDE-PLAN.md.)
export const T56_KIND_DEFS = [
  ['coralfloor', 'floor'],
  ['pearlroof', 'wall'],
  ['sunlounger', 'prop'],
  ['palmshade', 'prop'],
];
export const T56_KIND_CHARS = {};
T56_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 948 + i);
  T56_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T56_PROP_KINDS = T56_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T56_WALL_KINDS = T56_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T56_FLOOR_KINDS = T56_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T57 (Marisol Island identity, own kit from birth):
// "Dune Ripple & Kelp Glass" — dunefloor (idx 960): wind-rippled
// coral sand, the island's street material (worn by the whole
// shipped street blob + the surf-exit jetty head); kelproof (idx
// 961): kelp-green marine-glass panels with brass seams, the
// painting's domed lab read as a roof — worn by the Lab's six
// roof cells only, breaking the shipped Lab/Mart roof-slate
// share; orangecrate (idx 962): the orange trade's slatted
// shipping crate; coralbranch (idx 963): a staghorn coral on the
// shore sand. (Indices 960-963 per the Director's index ruling:
// main's kinds run …924-927 + 936-939; the parallel T56 claim
// holds 948-951; 940-947 + 952-959 stay empty. Chars U+1E00+960..)
// (Register: WAVE-T57-MARISOL-PLAN.md §5.)
export const T57_KIND_DEFS = [
  ['dunefloor', 'floor'],
  ['kelproof', 'wall'],
  ['orangecrate', 'prop'],
  ['coralbranch', 'prop'],
];
export const T57_KIND_CHARS = {};
T57_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 960 + i);
  T57_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T57_PROP_KINDS = T57_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T57_WALL_KINDS = T57_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T57_FLOOR_KINDS = T57_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T58 (Tangelo Island): the town's own kit kinds (Grove
// Furrow & Coral Tile) — indices 972-976 per the Director's index
// ruling (main's kinds run through T56's 948-951; the parallel
// T57 claim holds 960-963; 964-971 stay empty).
export const T58_KIND_CHARS = {};
export const T58_KIND_DEFS = [
  ['grovefloor', 'floor'],
  ['coralroof', 'wall'],
  ['mikantree', 'prop'],
  ['pickbasket', 'prop'],
  ['coralbanner', 'prop'],
];
T58_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 972 + i);
  T58_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T58_PROP_KINDS = T58_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T58_WALL_KINDS = T58_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T58_FLOOR_KINDS = T58_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave T59 (Pomelo Island identity, own kit from birth):
// "Granite Scree & Peak Slate" — screefloor (idx 984): crushed-
// granite scree, the peak's own stone ground underfoot, the
// island's street material (worn by the whole shipped street
// blob + BOTH surf-exit jetty heads); peakroof (idx 985):
// blue-grey slate in large staggered courses with a granite
// ridge cap and an orange pennant-flecked eave — worn by the
// Gym's four roof cells only, breaking the shipped Gym/Mart
// roof-slate share; cairn (idx 986): the climbers' cairn, a
// graduated granite pile at the slope's foot; slopepine (idx
// 987): a wind-bent slope pine on the tropgrass dirt.
// (Indices 984-987 per the Director's index ruling: main's
// kinds run …912-915 + 924-927 + 936-939 + 948-951 + 960-963;
// the parallel T58 claim holds 972-976; 964-971 + 977-983
// stay empty. Chars U+1E00+984..)
// (Register: WAVE-T59-POMELO-PLAN.md §5.)
export const T59_KIND_DEFS = [
  ['screefloor', 'floor'],
  ['peakroof', 'wall'],
  ['cairn', 'prop'],
  ['slopepine', 'prop'],
];
export const T59_KIND_CHARS = {};
T59_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 984 + i);
  T59_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T59_PROP_KINDS = T59_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T59_WALL_KINDS = T59_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T59_FLOOR_KINDS = T59_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T60 (Bergamot Island): the town's own kit kinds (Ruin
// Flag & Bone Drift) — indices 996-999 per the Director's index
// ruling (main's kinds run through T58's 972-976; the parallel
// T59 claim holds 984-987; 977-983 + 988-995 stay empty).
export const T60_KIND_DEFS = [
  ['ruinfloor', 'floor'],
  ['boneroof', 'wall'],
  ['surfstone', 'prop'],
  ['wreckrib', 'prop'],
];
export const T60_KIND_CHARS = {};
T60_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 996 + i);
  T60_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T60_PROP_KINDS = T60_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T60_WALL_KINDS = T60_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T60_FLOOR_KINDS = T60_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// "Reef Shell & Spike Stone" — reeffloor (idx 1008): pink shell
// sand, a loose shell-grit scatter in three pinks with white
// shell shards (worn by the whole shipped street blob + the
// north surf-exit jetty head); scalloproof (idx 1009): staggered
// courses of scallop-shell shingles — worn by the Gym's four
// roof cells only, breaking the shipped Gym/Mart roof-slate
// share; rockspike (idx 1010): a jagged reef spike on the island
// sand; gullrock (idx 1011): a flat reef rock with a gull
// standing on it, at the ferry shore.
// (Indices 1008-1011 per the Director's index ruling: main's
// kinds run …948-951 + 960-963 + 972-976 + 984-987; the parallel
// T60 claim holds 996-999; 988-995 + 1000-1007 stay empty. Kind
// names verified unclaimed — shellfloor/shellroof/gullpost are
// taken by other towns. Chars U+1E00+1008..)
// (Register: WAVE-T61-REEFSIDE-PLAN.md §5.)
export const T61_KIND_DEFS = [
  ['reeffloor', 'floor'],
  ['scalloproof', 'wall'],
  ['rockspike', 'prop'],
  ['gullrock', 'prop'],
];
export const T61_KIND_CHARS = {};
T61_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1008 + i);
  T61_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T61_PROP_KINDS = T61_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T61_WALL_KINDS = T61_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T61_FLOOR_KINDS = T61_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T62 (Calamondin Island): the town's own kit kinds (Pool
// Mosaic & Aqua Glaze) — indices 1020-1023 per the Director's
// index ruling (main's kinds run through T60's 996-999; the
// parallel T61 claim holds 1008-1011; 1000-1007 + 1012-1019
// stay empty). mosaicfloor (idx 1020): a strict 4px lattice of
// aqua-white pool tiles with aqua grout — the resort isle's
// pool-terrace street; aquaroof (idx 1021): flat staggered
// aqua-glaze slabs, worn by the Gym only, breaking the shipped
// Gym/Mart roof-slate share; jadestar (idx 1022): the jade star
// marker at the arena's flank; sunshade (idx 1023): a striped
// resort sunshade on the dock row. Chars U+1E00+1020..
// (Register: WAVE-T62-CALAMONDIN-PLAN.md §5.)
export const T62_KIND_DEFS = [
  ['mosaicfloor', 'floor'],
  ['aquaroof', 'wall'],
  ['jadestar', 'prop'],
  ['sunshade', 'prop'],
];
export const T62_KIND_CHARS = {};
T62_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1020 + i);
  T62_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T62_PROP_KINDS = T62_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T62_WALL_KINDS = T62_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T62_FLOOR_KINDS = T62_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// "League Herringbone & Crimson Rib" — leaguefloor (idx 1032):
// herringbone clay pavers, rectangular bricks in a 45° bond,
// crimson-tan faces with dark mortar (worn by the whole shipped
// street graph + the west surf-exit jetty head); crimsonroof
// (idx 1033): vertical standing ribs of deep crimson — worn by
// the Stadium's twelve front-band cells only, breaking the
// shipped Stadium/Mart roof-slate share; badgepillar (idx
// 1034): a stone pillar with a crimson-and-gold badge plaque,
// at the Stadium's sand shoulders; bannerpost (idx 1035): a
// timber post flying a crimson-and-gold pennant, at the ferry
// dock.
// (Indices 1032-1035 per the Director's index ruling: main's
// kinds run …996-999 + 1008-1011 on this base; the parallel
// T62 claim holds 1020-1023; 1012-1019 + 1024-1031 stay empty.
// Kind names verified unclaimed — driftroof/standingstone/
// shellfloor/shellroof/gullpost/badgeroof/brickfloor are taken
// by other towns. Chars U+1E00+1032..)
// (Register: WAVE-T63-GRAPEFRUIT-PLAN.md §5.)
export const T63_KIND_DEFS = [
  ['leaguefloor', 'floor'],
  ['crimsonroof', 'wall'],
  ['badgepillar', 'prop'],
  ['bannerpost', 'prop'],
];
export const T63_KIND_CHARS = {};
T63_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1032 + i);
  T63_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T63_PROP_KINDS = T63_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T63_WALL_KINDS = T63_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T63_FLOOR_KINDS = T63_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T64 (Sanctum Island): the town's own kit kinds (Festival
// Stepping & Vermillion) — indices 1044-1047 per the Director's
// index ruling (main's kinds run through T62's 1020-1023; the
// parallel T63 claim holds 1032-1035; 1036-1043 stay empty).
// stepfloor (idx 1044): large soft stepping discs scattered on
// warm festival sand — the festival isle's street; shrineroof
// (idx 1045): horizontal vermillion tile courses with a gold
// ridge cap, worn only by the Sanctum Shrine stamp; festlantern
// (idx 1046): a festival lantern post at the plaza's shoulders;
// fairbanner (idx 1047): a nobori banner pole at the ferry
// landing. Chars U+1E00+1044..
// (Register: WAVE-T64-SANCTUM-PLAN.md §5.)
export const T64_KIND_DEFS = [
  ['stepfloor', 'floor'],
  ['shrineroof', 'wall'],
  ['festlantern', 'prop'],
  ['fairbanner', 'prop'],
];
export const T64_KIND_CHARS = {};
T64_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1044 + i);
  T64_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T64_PROP_KINDS = T64_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T64_WALL_KINDS = T64_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T64_FLOOR_KINDS = T64_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave T65 (Trial Grounds): "Trial Bronze & Flecked Sandstone"
// — trialfloor (idx 1056): flecked pale sandstone flags wearing
// the hub's whole shipped street graph (the generic path kind,
// the T61/T63 template defect) 1:1; trialroof (idx 1057):
// standing-seam bronze, worn by the Tower's roof band only,
// breaking it out of the roof-terra share (Tower/Dome/Palace);
// streakboard (idx 1058): the painting's blank plaza board,
// standing on the town-sign record's own cell; trialbanner
// (idx 1059): a bronze-and-teal pennant standard at the ferry
// pier. (Indices 1056-1059 per the Director's index ruling:
// main's kinds run …1032-1035 on this base; the parallel T64
// claim holds 1044-1047; 1036-1043 + 1048-1055 stay empty.
// Kind names verified unclaimed — driftroof/standingstone/
// shellfloor/shellroof/gullpost are taken by other towns.
// Chars U+1E00+1056..)
// (Register: WAVE-T65-TRIALGROUNDS-PLAN.md §5.)
export const T65_KIND_DEFS = [
  ['trialfloor', 'floor'],
  ['trialroof', 'wall'],
  ['streakboard', 'prop'],
  ['trialbanner', 'prop'],
];
export const T65_KIND_CHARS = {};
T65_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1056 + i);
  T65_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const T65_PROP_KINDS = T65_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const T65_WALL_KINDS = T65_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const T65_FLOOR_KINDS = T65_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W-DIFF9 (identity retrofit, pair 9): Dawnwick (pallet) +
// Signal City (goldenrod) — the closest pair among the five
// remaining shared-kit towns on the W-DIFF census re-run on main
// 3443ca0d (composite 0.1098; plan WAVE-WDIFF9-PLAN.md §1).
// Dawnwick: 'Shore-Sand & Terracotta Hip' (the identity table's
// own entry) realised as NEW kinds — 'strandfloor' (idx 1068):
// shore sand laid as swept strand bands with shell flecks, the
// starting town's street, distinct in texture from the generic
// path sand it replaces and from every registered sand family;
// 'hiproof' (idx 1069): a true hipped terracotta roof slope (hip
// ridge + eave foot) for the town's th- house roofs (TOWN_STYLE
// pallet form literally reads 'hipped terracotta'). The dock's
// boardwalk, the shore sand and the sea — the reference elements
// — stay exactly as shipped, as do the T1 chalkmap barn door and
// every warp/post/sign. Signal City: 'Urban Brick & Mast' — the
// table names brickfloor for the street, but brickfloor is
// Cinder Town's kiln brick (W-DIFF4, registered to azalea), so
// per the W-DIFF6 amendment rule Signal takes a distinct variant
// in the same register: 'tramfloor' (idx 1070): broad avenue
// flags of dark brick-asphalt with a worn pale centre dash;
// 'mastlroof' (idx 1071) / 'mastrroof' (idx 1072): the matched
// left/right pair of flat urban-brick slab roofs with parapet
// lip, worn by the tl-/tr-goldenrod rooflines (Signal's
// buildings carry no th- kind). Indices 1068-1072 per the
// Director's index ruling: main's kinds run through T65's
// 1056-1059; gaps 1048-1055 + 1060-1067 stay empty. Kind names
// verified unclaimed. Chars U+1E00+1068..
export const WD9_KIND_DEFS = [
  ['strandfloor', 'floor'],
  ['hiproof', 'wall'],
  ['tramfloor', 'floor'],
  ['mastlroof', 'wall'],
  ['mastrroof', 'wall'],
];
export const WD9_KIND_CHARS = {};
WD9_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1068 + i);
  WD9_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD9_PROP_KINDS = WD9_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD9_WALL_KINDS = WD9_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD9_FLOOR_KINDS = WD9_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W-DIFF10 (identity retrofit, FINAL wave): Flintridge
// (pewter) + Crownspire (indigo) + Galefield (newbark) — the
// last three shared-kit towns. Census re-run on main 3443ca0d:
// indigo<->newbark 0.1889 (the pair), pewter<->indigo 0.2881,
// pewter<->newbark 0.3037 (plan WAVE-WDIFF10-PLAN.md §1).
// Flintridge: 'Cut-Stone & Parapet' — the table names settfloor
// for the street, but settfloor is Cragmoor's basalt sett
// (registered to blackthorn), so per the W-DIFF6 amendment rule
// Flintridge takes a distinct variant in the same register:
// 'flagfloor' (idx 1080): large cut-stone flags with chiselled
// edges; 'caproof' (idx 1081): flat stone parapet cap for the
// roof-slate house rows (TOWN_STYLE pewter form literally
// reads 'flat stone parapet'); 'tilecap' (idx 1082): warm
// cut-stone cap tiles for the roof-terra rows incl. chimneys.
// Crownspire: 'League Marble & Crest' — the table names
// marblefloor, but marblefloor is Lastlight's (registered to
// silvertown), so the same amendment rule gives 'veinfloor'
// (idx 1083): league marble slabs with deep indigo veins;
// 'crestroof' (idx 1084): white-marble crest roof with an
// indigo crest ridge for the League hall's th-indigo band
// (TOWN_STYLE form 'marble league crest'). League interiors
// untouched (W16 owns them). Galefield: 'Lakeside Sand & Lab
// Modern' — the table's sand street realised as a new kind in
// its own register (the W-DIFF9 Dawnwick precedent):
// 'lakefloor' (idx 1085): swept pale lake sand with pebble
// flecks; 'tealslate' (idx 1086): pale teal slate house roofs
// for the th-newbark houses. The lab's roof-slate rows, the
// lake, the dock and the boat stay exactly as shipped.
// Indices 1080-1086 per the Director's index ruling: main's
// kinds run through T65's 1056-1059 and W-DIFF9's 1068-1072
// (parallel branch); gaps 1048-1055 + 1060-1067 + 1073-1079
// stay empty. Kind names verified unclaimed. Chars
// U+1E00+1080..
export const WD10_KIND_DEFS = [
  ['flagfloor', 'floor'],
  ['caproof', 'wall'],
  ['tilecap', 'wall'],
  ['veinfloor', 'floor'],
  ['crestroof', 'wall'],
  ['lakefloor', 'floor'],
  ['tealslate', 'wall'],
];
export const WD10_KIND_CHARS = {};
WD10_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1080 + i);
  WD10_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const WD10_PROP_KINDS = WD10_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const WD10_WALL_KINDS = WD10_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const WD10_FLOOR_KINDS = WD10_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-A (Route Build Program, Arden Tranche 1): the first
// route kits under the NO-SAME-KIT law — every route its own
// ground/path/vegetation family, converted 1:1 off the generic
// '_'/'.'/'#' vocabulary. Route 1 "Chalk Meadow" (idx 1092-1095),
// Route 2 "Needlewood" (1096-1098 — no signature prop: the route
// ships no '_' cell, every open cell is encounter grass or path),
// Route 3 "Scree Shelf" (1099-1102), Route 4 "Terrace Ledge"
// (1103-1106), Route 5 "Day-Care Garden" (1107-1110). Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit counts
// '*floor' as street tier; grounds must never masquerade as
// street); path kinds DO end in 'floor' so they register as the
// route's path tier per route (checklist point 3). Indices
// 1092-1110 per the Director's index ruling: main's kinds run
// through W-DIFF10's 1080-1086; 1087-1091 stay empty. Kind names
// verified unclaimed ('gardenfloor' is Copperton's, idx 601 —
// Route 5's path kind is 'bloomfloor'). Chars U+1E00+1092..
// (Register: WAVE-W17-ROUTE-PROGRAM-PLAN.md.)
export const W17A_KIND_DEFS = [
  ['chalkturf', 'floor'],
  ['chalkfloor', 'floor'],
  ['meadowoak', 'wall'],
  ['chalkstone', 'prop'],
  ['needleturf', 'floor'],
  ['needlefloor', 'floor'],
  ['needlepine', 'wall'],
  ['screegrit', 'floor'],
  ['shelffloor', 'floor'],
  ['cragpine', 'wall'],
  ['screeboulder', 'prop'],
  ['terraceturf', 'floor'],
  ['ledgefloor', 'floor'],
  ['ledgepine', 'wall'],
  ['ledgecairn', 'prop'],
  ['gardenmeadow', 'floor'],
  ['bloomfloor', 'floor'],
  ['gardenelm', 'wall'],
  ['bloombed', 'prop'],
];
export const W17A_KIND_CHARS = {};
W17A_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1092 + i);
  W17A_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17A_PROP_KINDS = W17A_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17A_WALL_KINDS = W17A_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17A_FLOOR_KINDS = W17A_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-B (Route Build Program, Arden Tranche 2): the second
// route-kit tranche under the NO-SAME-KIT law — Routes 6-10, each
// converted 1:1 off the generic '_'/'.'/'#' vocabulary. Route 6
// "Lily Pond" (idx 1112-1115), Route 7 "Gatehouse Road"
// (1116-1119), Route 8 "Perfume Garden" (1120-1123), Route 9
// "Boulder Field" (1124-1127), Route 10 "Coilworks Road"
// (1128-1131). Ground kinds deliberately do NOT end in 'floor'
// (the desire-path audit counts '*floor' as street tier; grounds
// must never masquerade as street); path kinds DO end in 'floor'
// so they register as the route's path tier per route (checklist
// point 3). Indices 1112-1131 per the Director's index ruling:
// W17-A took 1092-1110; 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against origin/main
// ('lilypad' is Fenland's T50 prop — Route 6's prop is 'pondpad';
// 'gatepost' is a shipped dressing kind — Route 7's prop is
// 'fencepost'). Chars U+1E00+1112.. (Register:
// WAVE-W17-ROUTE-PROGRAM-PLAN.md.)
export const W17B_KIND_DEFS = [
  ['pondturf', 'floor'],
  ['lilyfloor', 'floor'],
  ['pondwillow', 'wall'],
  ['pondpad', 'prop'],
  ['fenceturf', 'floor'],
  ['gatefloor', 'floor'],
  ['gateelm', 'wall'],
  ['fencepost', 'prop'],
  ['perfumeturf', 'floor'],
  ['perfumefloor', 'floor'],
  ['perfumebloom', 'wall'],
  ['perfumehedge', 'prop'],
  ['boulderturf', 'floor'],
  ['boulderfloor', 'floor'],
  ['boulderpine', 'wall'],
  ['fieldboulder', 'prop'],
  ['conductturf', 'floor'],
  ['conductfloor', 'floor'],
  ['conductpine', 'wall'],
  ['pylonbase', 'prop'],
];
export const W17B_KIND_CHARS = {};
W17B_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1112 + i);
  W17B_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17B_PROP_KINDS = W17B_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17B_WALL_KINDS = W17B_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17B_FLOOR_KINDS = W17B_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-C (Route Build Program, Arden Tranche 3): the third
// route-kit tranche under the NO-SAME-KIT law — Routes 11, 12, 15,
// 16, 19, each converted 1:1 off the generic '_'/'.'/'#'
// vocabulary. Route 11 "Sleeper Meadow" (idx 1132-1135), Route 12
// "Reed Boardwalk" (1136-1139), Route 15 "Copycat Grass"
// (1140-1143), Route 16 "Cycling Slope" (1144-1147), Route 19
// "Bramble Beach" (1148-1151). Ground kinds deliberately do NOT
// end in 'floor' (the desire-path audit counts '*floor' as street
// tier; grounds must never masquerade as street); path kinds DO
// end in 'floor' so they register as the route's path tier per
// route (checklist point 3). Indices 1132-1151 per the Director's
// index ruling: W17-A took 1092-1110 and W17-B takes 1112-1131 on
// its parallel branch; 1111 and every earlier documented gap stay
// empty. Kind names verified unclaimed against origin/main
// ('slopepine' is Pomelo's T59 prop, idx 987 — Route 16's tree is
// 'slopefir'). Chars U+1E00+1132.. (Register:
// WAVE-W17-ROUTE-PROGRAM-PLAN.md.)
export const W17C_KIND_DEFS = [
  ['hollowturf', 'floor'],
  ['trenchfloor', 'floor'],
  ['hollowoak', 'wall'],
  ['surveypost', 'prop'],
  ['reedturf', 'floor'],
  ['reedfloor', 'floor'],
  ['reedwillow', 'wall'],
  ['railpost', 'prop'],
  ['copyturf', 'floor'],
  ['copyfloor', 'floor'],
  ['copyelm', 'wall'],
  ['mirrorbloom', 'prop'],
  ['slopeturf', 'floor'],
  ['asphaltfloor', 'floor'],
  ['slopefir', 'wall'],
  ['sloperail', 'prop'],
  ['beachturf', 'floor'],
  ['shorefloor', 'floor'],
  ['beachpalm', 'wall'],
  ['shoredrift', 'prop'],
];
export const W17C_KIND_CHARS = {};
W17C_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1132 + i);
  W17C_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17C_PROP_KINDS = W17C_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17C_WALL_KINDS = W17C_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17C_FLOOR_KINDS = W17C_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-D (Route Build Program, Arden Tranche 4): the surf lane,
// the League road and the cave pair — Routes 20, 22, Mt. Lunestone
// 1F/B1F and Stonebore Tunnel, each its own kit under the NO-SAME-KIT
// law. Routes 20/22 convert 1:1 off the generic '_'/'.'/'#' vocabulary
// like Tranches 1-3; the cave maps convert the generic cave base —
// char 'L' (cavefloor) to the map's own floor kind, char 'G'
// (cavewall) to its own wall kind — art layer only: encounter tables,
// warps (cave mouths + ladder/door cells), NPC posts, sign records,
// items and hidden items byte-identical, and the shipped cave-
// encounter trigger chars ('.'/'R', overworld-systems sysEncounterStep)
// occur in none of these grids before or after. Route 20 "Rime Surf"
// (idx 1152-1155), Route 22 "League Road" (1156-1159), Lunestone 1F
// "Lunestone Deep" (1160-1161), Lunestone B1F "Lunestone Dark"
// (1162-1163), Stonebore "Stonebore Strata" (1164-1165 — a strata-deep
// extension of the tunnel's own shipped stratafloor/stratwall family,
// per-route, not shared). Ground kinds deliberately do NOT end in
// 'floor' (the desire-path audit counts '*floor' as street tier;
// grounds must never masquerade as street); path kinds DO end in
// 'floor' so they register as the route's path tier per route
// (checklist point 3). Cave floor kinds end in 'floor' exactly as
// cavefloor/stratafloor do, keeping their audit classification.
// Indices 1152-1165 per the Director's index ruling: Tranches 1-3
// took 1092-1110, 1112-1131 and 1132-1151 (W17-C lands at merge);
// 1111 and every earlier documented gap stay empty. Kind names
// verified unclaimed against origin/main ('moonfloor' is Hushmoor's
// T7 town floor — Lunestone's floors are 'lunefloor'/'darklunefloor';
// the plan's path name 'leagueway' becomes 'leaguewayfloor' so it
// registers as path tier under point 3, the gardenfloor discipline).
// Chars U+1E00+1152.. (Register: WAVE-W17-ROUTE-PROGRAM-PLAN.md.)
export const W17D_KIND_DEFS = [
  ['rimeshore', 'floor'],
  ['surfloor', 'floor'],
  ['surfpine', 'wall'],
  ['coldspring', 'prop'],
  ['leagueturf', 'floor'],
  ['leaguewayfloor', 'floor'],
  ['leagueoak', 'wall'],
  ['leaguepost', 'prop'],
  ['lunefloor', 'floor'],
  ['lunewall', 'wall'],
  ['darklunefloor', 'floor'],
  ['darklunewall', 'wall'],
  ['stratadeepfloor', 'floor'],
  ['stratadeepwall', 'wall'],
];
export const W17D_KIND_CHARS = {};
W17D_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1152 + i);
  W17D_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17D_PROP_KINDS = W17D_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17D_WALL_KINDS = W17D_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17D_FLOOR_KINDS = W17D_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-E (Route Build Program, Arden Tranche 5 — the finale):
// the Crown Road (victoryroad, maps2 + maps3 DUAL), the last cave
// before the League, its own kit under the NO-SAME-KIT law. Like
// Tranche 4's caves it converts the generic cave base — char 'L'
// (cavefloor) to its own floor kind, char 'G' (cavewall) to its own
// wall kind — art layer only: encounter tables, warps (the Route 22
// gate mouth and the Crownspire exit), NPC posts, items and the
// ev_moltres event record byte-identical in both copies, and the
// shipped cave-encounter trigger chars ('.'/'R',
// overworld-systems sysEncounterStep) occur in neither copy's grid
// before or after. The two copies are registry class D in the
// strongest form — different sizes (maps2 16x14, maps3 18x12) and
// drifted records; maps3 is the live copy (the loader census and
// the W17 plan agree: 18x12, W->route22, E->indigo, the VETERAN at
// his post with the recorded boulder/second-sun dialogue). Each
// copy is converted char-for-char on its own rows; the drift —
// ACE RIN's trainer post and the higher encounter band in the
// stale maps2 copy included — stays byte-preserved, untouched.
// "Crown Road Ceremonial" (idx 1166-1167): crownfloor is LAID
// stone — dark violet-charcoal flags in a running bond, the only
// cave floor in Arden that was built rather than formed — split
// from Lunestone's pale/dark moonstone speckle, Stonebore's warm
// strata speckle, and from Crownspire town's bright veined marble
// (veinfloor, W-DIFF10) by value: the town is the League's white
// plaza in daylight, the road is its dark mountain undercroft.
// crownwall is ashlar masonry — squared block courses with
// staggered joints — against every other cave's natural bands.
// The road's signature dressing (bannerwall, torchpost, lavaglow
// — the second sun — cavelantern, crackedfloor, rubble, the rock
// boulders) already ships in the grid and stands byte-preserved
// inside the new register; no props are placed (a cave floor is
// encounter ground — Tranche 4's cave discipline). Cave floor
// kinds end in 'floor' exactly as cavefloor/stratafloor do,
// keeping their audit classification. Indices 1166-1167 per the
// Director's index ruling: Tranches 1-4 took 1092-1110, 1112-1131,
// 1132-1151 and 1152-1165 (W17-D lands at merge); 1111 and every
// earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main. Chars U+1E00+1166.. (Register:
// WAVE-W17-ROUTE-PROGRAM-PLAN.md.)
export const W17E_KIND_DEFS = [
  ['crownfloor', 'floor'],
  ['crownwall', 'wall'],
];
export const W17E_KIND_CHARS = {};
W17E_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1166 + i);
  W17E_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17E_PROP_KINDS = W17E_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17E_WALL_KINDS = W17E_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17E_FLOOR_KINDS = W17E_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const SINNOH_TOWN_GROUND_CHARS = SINNOH_TOWN_ORDER.map((id) => SINNOH_TOWN_CHARS[id].tg);
export const SINNOH_TOWN_GROUND2_CHARS = SINNOH_TOWN_ORDER.map((id) => SINNOH_TOWN_CHARS[id].tg2);
// TX-3: the 8 gym exteriors by town (original type-accent motifs).
export const GYM_KIND_BY_TOWN = {
  viridian: 'gym-ground', pewter: 'gym-rock', cerulean: 'gym-water', vermilion: 'gym-volt',
  celadon: 'gym-leaf', saffron: 'gym-psy', fuchsia: 'gym-poison', cinnabar: 'gym-fire',
};
export const TOWN_GROUND_CHARS = TG_CHARS;
export const FLORA_CHAR_BY_TOWN = FLORA_CHARS;

const PAL = {
  // Dither tones softened (UI audit: the old dots read dirty/noisy):
  // grassDark/grassLight/pathDark are moved ~halfway toward their base
  // colors, halving the dither contrast while keeping tile silhouettes.
  grassBase: '#5da24a', grassDark: '#559644', grassLight: '#66ab53',
  pathBase: '#d8c08a', pathDark: '#cdb481',
  treeBase: '#3e7a34', treeDark: '#2e5e28', treeLight: '#54a048',
  waterBase: '#3a7bd5', waterDark: '#2e63b0', waterLight: '#5a9ae8',
  houseBase: '#c9a06a', houseDark: '#a8825a', roofBase: '#b0503c', roofDark: '#8e3e2e',
  doorBase: '#6a4a2e', signBase: '#8a6a42', gymBase: '#8a8aa0', gymDark: '#6a6a80',
  flowerA: '#e86a8a', flowerB: '#f0e060', rockBase: '#9a9aa5', rockDark: '#7a7a85',
};

// Deterministic 2D hash for painter dithering (no RNG needed).
function h2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export function paintTile(ctx, kind, px, py) {
  const T = 16;
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
  switch (kind) {
    case 'grass':
      r(0, 0, T, T, PAL.grassBase);
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(h2(px + i * 3, py) * 14), y = Math.floor(h2(px, py + i * 5) * 12);
        r(x, y, 2, 3, h2(x, y) > 0.5 ? PAL.grassDark : PAL.grassLight);
      }
      break;
    case 'grassground':
      // No-art fallback only (the ART path draws tile-grassground):
      // meadow texture in the grass tones, denser speckle than 'grass'.
      r(0, 0, T, T, PAL.grassBase);
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(h2(px + i * 5, py + 2) * 14), y = Math.floor(h2(px + 7, py + i * 3) * 14);
        r(x, y, 2, 2, h2(x + 1, y) > 0.5 ? PAL.grassDark : PAL.grassLight);
      }
      break;
    case 'path':
      r(0, 0, T, T, PAL.pathBase);
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(h2(px + i, py + 9) * 14), y = Math.floor(h2(px + 3, py + i) * 14);
        r(x, y, 3, 2, PAL.pathDark);
      }
      break;
    case 'flower':
      r(0, 0, T, T, PAL.grassBase);
      r(6, 6, 4, 4, PAL.flowerA); r(7, 3, 2, 2, PAL.flowerB); r(7, 11, 2, 2, PAL.flowerB);
      break;
    case 'tree':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 10, 2, 6, '#5a3a24');
      r(2, 2, 12, 9, PAL.treeBase);
      r(3, 3, 5, 3, PAL.treeLight); r(8, 7, 5, 3, PAL.treeDark);
      break;
    case 'water':
      r(0, 0, T, T, PAL.waterBase);
      for (let i = 0; i < 4; i++) {
        const y = Math.floor(h2(px + i * 7, py) * 14);
        r(1, y, 6, 1, PAL.waterLight); r(9, (y + 7) % 15, 6, 1, PAL.waterDark);
      }
      break;
    case 'house':
      r(0, 0, T, T, PAL.houseBase);
      r(0, 0, T, 5, PAL.roofBase); r(0, 4, T, 1, PAL.roofDark);
      r(3, 8, 4, 5, PAL.doorBase); r(10, 8, 3, 3, '#3a5a7a');
      break;
    case 'gymwall':
      r(0, 0, T, T, PAL.gymBase);
      r(0, 0, T, 2, PAL.gymDark); r(0, 14, T, 2, PAL.gymDark);
      r(7, 4, 2, 8, PAL.gymDark);
      break;
    case 'door': case 'gymdoor': case 'centerdoor':
      r(0, 0, T, T, kind === 'gymwall' ? PAL.gymBase : PAL.houseBase);
      r(4, 2, 8, 14, PAL.doorBase); r(5, 3, 6, 12, '#3e2c1c');
      break;
    case 'sign':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 8, 2, 8, '#5a3a24'); r(3, 2, 10, 7, PAL.signBase);
      r(4, 3, 8, 1, '#6e5233');
      break;
    case 'rock': case 'caveboulder':
      // Wave 4: no ground is baked under a rock any more — the fallback
      // paints the boulder alone (the ART path composites the ground).
      r(3, 5, 10, 8, PAL.rockBase); r(4, 6, 4, 3, '#b5b5c0'); r(8, 9, 4, 3, PAL.rockDark);
      break;
    case 'cavewall': case 'towerwall': case 'silphwall': case 'plantwall':
      r(0, 0, T, T, kind === 'cavewall' ? PAL.rockDark : PAL.gymBase);
      r(0, 5, T, 2, PAL.rockDark); r(0, 11, T, 2, '#5a3a24'); r(7, 0, 2, 5, PAL.rockDark);
      break;
    case 'cavefloor':
      r(0, 0, T, T, '#b09468');
      for (let i = 0; i < 5; i++) { const x = Math.floor(h2(px + i * 3, py) * 14), y = Math.floor(h2(px, py + i * 5) * 14); r(x, y, 2, 2, '#a8845c'); }
      break;
    case 'towerfloor': case 'silphfloor': case 'plantfloor':
      r(0, 0, T, T, kind === 'silphfloor' ? '#c2c8d4' : kind === 'towerfloor' ? PAL.rockBase : '#46586e');
      r(0, 7, T, 1, PAL.rockDark); r(7, 0, 1, 7, PAL.rockDark);
      break;
    case 'centerfloor': case 'martfloor': case 'housefloor': case 'gymfloor': case 'labfloor':
      r(0, 0, T, T, kind === 'labfloor' ? '#46586e' : kind === 'centerfloor' ? '#f2ddd5' : kind === 'martfloor' ? '#cfd4c2' : '#c9a06a');
      r(0, 7, T, 1, PAL.rockDark); r(7, 0, 1, 7, PAL.rockDark);
      break;
    case 'centerwall': case 'martwall': case 'housewall': case 'gymwallin': case 'labwall': case 'annewall': case 'leaguewall':
      r(0, 0, T, T, kind === 'martwall' ? '#2e7a6a' : kind === 'centerwall' ? '#e8b4c4' : PAL.gymBase);
      r(0, 0, T, 2, PAL.rockBase); r(0, 13, T, 3, PAL.rockDark);
      break;
    case 'rug': case 'battlemat':
      r(0, 0, T, T, kind === 'rug' ? PAL.roofBase : PAL.gymDark);
      r(3, 3, 10, 10, kind === 'rug' ? PAL.roofDark : PAL.rockBase);
      break;
    default:
      // Wave 5a solid props: a furniture-toned block (the ART path
      // draws the real prop; this is the no-art fallback only).
      if (kind && kind !== 'void') { r(0, 0, T, T, PAL.houseBase); r(2, 2, 12, 10, PAL.doorBase); break; }
      r(0, 0, T, T, '#101018');
  }
}

// Pre-render one offscreen canvas per tile kind (blitted in hot path).
export function buildTileCache(doc) {
  const cache = {};
  for (const key of Object.keys(TILE_CHARS)) {
    const kind = TILE_CHARS[key];
    if (cache[kind]) continue;
    const cv = doc.createElement('canvas');
    cv.width = 16; cv.height = 16;
    paintTile(cv.getContext('2d'), kind, 0, 0);
    cache[kind] = cv;
  }
  return cache;
}
