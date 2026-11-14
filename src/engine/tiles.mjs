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
