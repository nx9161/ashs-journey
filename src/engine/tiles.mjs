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
// Wave W17-F (Route Build Program, Yamato Tranche 1): the first road —
// Routes 29, 30, 31, 32 and Junction Cave, each its own kit under the
// NO-SAME-KIT law. All five are defined once in maps6.mjs (no dual
// copies in Yamato, so no registry re-pins arise). Routes convert 1:1
// off the generic grassground/path/tree vocabulary by KIND (maps6
// trees stand on both '#' and 'T' chars — the W17-B lesson);
// Junction Cave converts the generic cave base — char 'L' (cavefloor)
// to its own floor kind, char 'G' (cavewall) to its own wall kind —
// art layer only: encounter tables, warps (incl. Route 32's cave
// mouths and the cave's door cells), NPC posts, sign records, items
// and every shipped dressing kind (maple, rock cliff band, pools,
// cavecrystal, cavelantern, caveboulder, waterglow) byte-identical,
// and the shipped cave-encounter trigger chars ('.'/'R',
// overworld-systems sysEncounterStep) occur in none of these grids
// before or after. Route 29 "Lakewind Slope" (idx 1168-1171),
// Route 30 "Berry Climb" (1172-1175), Route 31 "Tower-Shadow Valley"
// (1176-1179), Route 32 "Cliff Shore Road" (1180-1183), Junction Cave
// "Junction Deep" (1184-1185). Ground kinds deliberately do NOT end
// in 'floor' (the desire-path audit counts '*floor' as street tier;
// grounds must never masquerade as street); path kinds DO end in
// 'floor' so they register as the route's path tier per route
// (checklist point 3). Cave floor kinds end in 'floor' exactly as
// cavefloor does, keeping their audit classification. Indices
// 1168-1185 per the Director's index ruling: Arden took 1092-1110,
// 1112-1131, 1132-1151, 1152-1165 and 1166-1167 (W17-E, landing in
// parallel); 1111 and every earlier documented gap stay empty. Kind
// names verified unclaimed against origin/main. Chars U+1E00+1168..
// (Register: WAVE-W17-YAMATO-ROUTE-PROGRAM-PLAN.md.)
export const W17F_KIND_DEFS = [
  ['windturf', 'floor'],
  ['windfloor', 'floor'],
  ['podnut', 'wall'],
  ['lakecairn', 'prop'],
  ['berryturf', 'floor'],
  ['climbfloor', 'floor'],
  ['berrytree', 'wall'],
  ['berrycrate', 'prop'],
  ['shadowturf', 'floor'],
  ['valleyfloor', 'floor'],
  ['shadowoak', 'wall'],
  ['towerstone', 'prop'],
  ['cliffturf', 'floor'],
  ['clifffloor', 'floor'],
  ['cliffpine', 'wall'],
  ['flagcairn', 'prop'],
  ['junctionfloor', 'floor'],
  ['junctionwall', 'wall'],
];
export const W17F_KIND_CHARS = {};
W17F_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1168 + i);
  W17F_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17F_PROP_KINDS = W17F_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17F_WALL_KINDS = W17F_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17F_FLOOR_KINDS = W17F_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-G (Route Build Program, Yamato Tranche 2): the wet west
// arc — Route 33, Holly Forest, Route 34, Route 35 and the National
// Park, each its own kit under the NO-SAME-KIT law. All five are
// defined once in maps6.mjs (no dual copies in Yamato, so no
// registry re-pins arise). Routes convert 1:1 off the generic
// grassground/path/tree vocabulary by KIND (maps6 trees stand on
// both '#' and 'T' chars — the W17-B lesson); art layer only:
// encounter tables, warps, NPC posts, sign records, items and every
// shipped dressing kind (apricorn trees on Route 33; the forest's
// jshrine and 19 maple; Route 34's Day-Care house stamp; the park's
// tc-/td-goldenrod carpet, leaguefountain, lamps, benches) stay
// byte-identical. Route 33 "Rain Road" (idx 1186-1189), Holly
// Forest "Holly Deep" (1190-1193), Route 34 "Day-Care Coast"
// (1194-1197), Route 35 "Park Road" (1198-1201), National Park
// "The Front Garden" (1202-1204 — no tree cells ship in the park,
// so its kit is ground + path + prop only). Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit counts
// '*floor' as street tier; grounds must never masquerade as
// street); path kinds DO end in 'floor' so they register as the
// route's path tier per route (checklist point 3). Indices
// 1186-1204 per the program plan (WAVE-W17-YAMATO-ROUTE-PROGRAM-
// PLAN.md): W17-F took 1168-1185 on its parallel branch; 1111 and
// every earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main. Chars U+1E00+1186..
export const W17G_KIND_DEFS = [
  ['rainturf', 'floor'],
  ['rainfloor', 'floor'],
  ['driptree', 'wall'],
  ['puddlepool', 'prop'],
  ['hollyturf', 'floor'],
  ['hollyfloor', 'floor'],
  ['hollytree', 'wall'],
  ['logstack', 'prop'],
  ['coastturf', 'floor'],
  ['coastfloor', 'floor'],
  ['coastelm', 'wall'],
  ['carefence', 'prop'],
  ['parkturf', 'floor'],
  ['parkfloor', 'floor'],
  ['parkelm', 'wall'],
  ['parkpost', 'prop'],
  ['frontlawn', 'floor'],
  ['frontfloor', 'floor'],
  ['lawnbed', 'prop'],
];
export const W17G_KIND_CHARS = {};
W17G_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1186 + i);
  W17G_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17G_PROP_KINDS = W17G_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17G_WALL_KINDS = W17G_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17G_FLOOR_KINDS = W17G_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-H (Route Build Program, Yamato Tranche 3): crossroads ->
// farm country -> the harbour lanes — Route 36, Route 37, Route 38,
// Route 39 and Route 40, each its own kit under the NO-SAME-KIT law.
// All five are defined once in maps6.mjs (no dual copies in Yamato,
// so no registry re-pins arise). Routes convert 1:1 off the generic
// grassground/path/tree vocabulary by KIND (maps6 trees stand on
// both '#' and 'T' chars — the W17-B lesson); art layer only:
// encounter tables, warps, NPC posts, sign records, items and every
// shipped dressing kind (Route 36's maple and fence; Route 37's 2
// apricorn dressing trees; Route 38's fenced pastures; Route 39's
// fences and maples; Route 40's 394 water cells entire) stay
// byte-identical. Route 36 "Crossroads Meadow" (idx 1205-1208),
// Route 37 "Podnut Road" (1209-1212), Route 38 "Farm Road"
// (1213-1216), Route 39 "Harbour Hill" (1217-1220), Route 40
// "Harbour Lane" (1221-1222 — a surf lane with NO path/ground/tree
// vocabulary: only its 5 shore grassground cells and 16 rock cells
// convert; the rock conversion is gated on the trigger census —
// r40's encounter config has enc.cave=false and an EMPTY land
// table, its surf branch fires only on '~'/'W' water chars, and
// the grid holds no '.' or ',' cells, so no encounter trigger can
// move; the spec-presence exception for path/tree is recorded in
// the program plan in advance). Ground kinds deliberately do NOT
// end in 'floor' (the desire-path audit counts '*floor' as street
// tier; grounds must never masquerade as street); path kinds DO
// end in 'floor' so they register as the route's path tier per
// route (checklist point 3). Indices 1205-1222 per the program
// plan (WAVE-W17-YAMATO-ROUTE-PROGRAM-PLAN.md): W17-F took
// 1168-1185 and W17-G takes 1186-1204 on its parallel branch; 1111
// and every earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main. Chars U+1E00+1205..
export const W17H_KIND_DEFS = [
  ['crossturf', 'floor'],
  ['crossfloor', 'floor'],
  ['crossoak', 'wall'],
  ['forkpost', 'prop'],
  ['podturf', 'floor'],
  ['podfloor', 'floor'],
  ['oldpodnut', 'wall'],
  ['bellpost', 'prop'],
  ['farmturf', 'floor'],
  ['farmfloor', 'floor'],
  ['farmoak', 'wall'],
  ['haybale', 'prop'],
  ['hillturf', 'floor'],
  ['hillfloor', 'floor'],
  ['hillpine', 'wall'],
  ['hillcairn', 'prop'],
  ['harbourturf', 'floor'],
  ['harbourrock', 'wall'],
];
export const W17H_KIND_CHARS = {};
W17H_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1205 + i);
  W17H_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17H_PROP_KINDS = W17H_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17H_WALL_KINDS = W17H_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17H_FLOOR_KINDS = W17H_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-I (Route Build Program, Yamato Tranche 4): the whirlpool
// sea -> the mountain road -> the falls halls -> the crater gate —
// Route 41, Route 42, Mt. Millstone Lower + Upper Halls and Route
// 43, each its own kit under the NO-SAME-KIT law. All five are
// defined once in maps6.mjs (no dual copies in Yamato, so no
// registry re-pins arise). Route 41 "Maelstrom Sea" (idx
// 1223-1224 — a surf lane whose land table is EMPTY as shipped:
// only its 10 islet-top grassground cells and 21 rock cells
// convert; the rock conversion is gated on the trigger census —
// r41's encounter config has enc.cave=false and an EMPTY land
// table, its surf branch fires only on '~' water chars, the grid
// holds no '.' or ',' cells, and its single cavefloor warp-mouth
// cell stays byte-identical, so no encounter trigger can move).
// Route 42 "Millstone Road" (1225-1228) converts grassground/
// path/tree by KIND (maps6 trees stand on both '#' and 'T' chars
// — the W17-B lesson); its 4 cavefloor mouth cells stay
// byte-identical. The Millstone halls convert by the cave method
// (art layer only: cavefloor -> own floor, cavewall -> own wall;
// the trigger census '.'/'R' is 0 -> 0 on both halls, and their
// falls water, caveboulders and cavecrystals stay byte-identical):
// Lower "Millstone Wet" (1229-1230, dark wet flags) and Upper
// "Millstone Spray" (1231-1232, spray-bright, one value up — the
// value split is the twin discipline for the halls' near-identical
// grids, the Lunestone 1F/B1F precedent). Route 43 "Crater Gate
// Road" (1233-1236) converts by KIND the same way; its shipped
// rock cell and fences stay byte-identical. Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit counts
// '*floor' as street tier; grounds must never masquerade as
// street); path kinds DO end in 'floor' so they register as the
// route's path tier per route (checklist point 3). Indices
// 1223-1236 per the program plan
// (WAVE-W17-YAMATO-ROUTE-PROGRAM-PLAN.md): W17-F took 1168-1185,
// W17-G 1186-1204 and W17-H takes 1205-1222 on its parallel
// branch; 1111 and every earlier documented gap stay empty. Kind
// names verified unclaimed against origin/main. Chars U+1E00+1223..
export const W17I_KIND_DEFS = [
  ['isleturf', 'floor'],
  ['stackrock', 'wall'],
  ['millturf', 'floor'],
  ['millroadfloor', 'floor'],
  ['millpine', 'wall'],
  ['millcairn', 'prop'],
  ['wetmillfloor', 'floor'],
  ['wetmillwall', 'wall'],
  ['sprayfloor', 'floor'],
  ['spraywall', 'wall'],
  ['craterturf', 'floor'],
  ['tollfloor', 'floor'],
  ['craterpine', 'wall'],
  ['tollpost', 'prop'],
];
export const W17I_KIND_CHARS = {};
W17I_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1223 + i);
  W17I_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17I_PROP_KINDS = W17I_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17I_WALL_KINDS = W17I_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17I_FLOOR_KINDS = W17I_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-J (Route Build Program, Yamato Tranche 5): the cold
// shoulder -> the Frost Path -> falling road -> high road — Route
// 44, the Frost Path West + East Halls, Route 45 and Route 46,
// each its own kit under the NO-SAME-KIT law. All five are defined
// once in maps6.mjs (no dual copies in Yamato, so no registry
// re-pins arise). Route 44 "Cold Shoulder" (idx 1237-1240)
// converts grassground/path/tree by KIND (maps6 trees stand on
// both '#' and 'T' chars — the W17-B lesson); its 2 cavefloor
// mouth cells and pond water stay byte-identical. The Frost Path
// halls are the program's floor-exception: their floors ALREADY
// ship as signature kinds (icefloor 280/284 + frostfloor 24 per
// hall — the halls' own biome, byte-preserved by spec, slide
// mechanics untouched), so only the generic cavewall converts —
// West "Frost West" (1241, dark ice-cave wall, icicle points in
// its own face) and East "Frost East" (1242, thaw wall —
// meltwater threads in the stone, brighter value; the twin split
// is by value + the threads, the Lunestone/Millstone discipline).
// Their meltwater/pool water, caveboulders, cavecrystals and step
// cells stay byte-identical, and the trigger census '.'/'R'/',' is
// 0 -> 0 on both halls. Route 45 "Falling Road" (1243-1246) and
// Route 46 "High Road" (1247-1250) convert by KIND the same way;
// both routes' cavefloor Gloom mouths, rock and fences stay
// byte-identical. Ground kinds deliberately do NOT end in 'floor'
// (the desire-path audit counts '*floor' as street tier; grounds
// must never masquerade as street); path kinds DO end in 'floor'
// so they register as the route's path tier per route (checklist
// point 3). Indices 1237-1250 per the program plan
// (WAVE-W17-YAMATO-ROUTE-PROGRAM-PLAN.md): W17-F took 1168-1185,
// W17-G 1186-1204, W17-H 1205-1222 and W17-I takes 1223-1236 on
// its parallel branch; 1111 and every earlier documented gap stay
// empty. Kind names verified unclaimed against origin/main.
// Chars U+1E00+1237..
export const W17J_KIND_DEFS = [
  ['coldturf', 'floor'],
  ['coldfloor', 'floor'],
  ['frostpine', 'wall'],
  ['snowdrift', 'prop'],
  ['frostwall', 'wall'],
  ['thawwall', 'wall'],
  ['fallturf', 'floor'],
  ['fallfloor', 'floor'],
  ['fallpine', 'wall'],
  ['scrubthorn', 'prop'],
  ['highturf', 'floor'],
  ['highfloor', 'floor'],
  ['highpine', 'wall'],
  ['ridgepost', 'prop'],
];
export const W17J_KIND_CHARS = {};
W17J_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1237 + i);
  W17J_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17J_PROP_KINDS = W17J_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17J_WALL_KINDS = W17J_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17J_FLOOR_KINDS = W17J_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-K (Route Build Program, Yamato Tranche 6 — the Yamato
// finale): the Gloom gut + the Conference road, the program's
// endgame pair. Both are defined once in maps6.mjs (no dual copies
// in Yamato, so no registry re-pins arise). Gloom Cave "Gloom Deep"
// (idx 1251-1252) converts by the cave method (art layer only:
// cavefloor -> own floor, cavewall -> own wall; the trigger census
// '.'/'R'/',' is 0 -> 0, and its warm pools, caveboulders,
// cavecrystals and sign stay byte-identical; NO props are placed —
// cave discipline): gloomfloor is near-black WARM earth flags,
// split from Junction Deep's lit warm-grey road flags by value and
// hue and from the Crown Road's violet-charcoal ceremonial flags
// by hue; gloomwall is near-black torch-warmed bands, split from
// Junction's banded warm grey by value. Lastlight Pass "the
// Conference road" (1253-1256) converts grassground/path/tree by
// KIND (maps6 trees stand on both '#' and 'T' chars — the W17-B
// lesson); its encounter grass, flowers, fences, rocks, maple and
// sign stay byte-identical, and VETERAN HALD's post stands
// untouched: passturf is thin pale high-pass grass (paler and
// thinner than Route 46's wind-combed ridge grass), passfloor is
// Conference-road stone-sand — light and worn, split from the
// Crown Road's dark crownfloor by value and register — passpine
// is a stern grey-green tiered pine, and memorialstone is the
// design's memorial cairn, placed x2 at the road's bends. Ground
// kinds deliberately do NOT end in 'floor' (the desire-path audit
// counts '*floor' as street tier; grounds must never masquerade
// as street); path kinds DO end in 'floor' so they register as
// the route's path tier per route (checklist point 3). Indices
// 1251-1256 per the program plan
// (WAVE-W17-YAMATO-ROUTE-PROGRAM-PLAN.md): W17-F took 1168-1185,
// W17-G 1186-1204, W17-H 1205-1222, W17-I 1223-1236 and W17-J
// takes 1237-1250 on its parallel branch; 1111 and every earlier
// documented gap stay empty. Kind names verified unclaimed
// against origin/main. Chars U+1E00+1251..
export const W17K_KIND_DEFS = [
  ['gloomfloor', 'floor'],
  ['gloomwall', 'wall'],
  ['passturf', 'floor'],
  ['passfloor', 'floor'],
  ['passpine', 'wall'],
  ['memorialstone', 'prop'],
];
export const W17K_KIND_CHARS = {};
W17K_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1251 + i);
  W17K_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17K_PROP_KINDS = W17K_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17K_WALL_KINDS = W17K_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17K_FLOOR_KINDS = W17K_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-L (Route Build Program, Maris Tranche 1 — the first
// roads): Rootlet -> Eldergrove -> Meadowbrook + the Woods, the
// program's opening walk. All five maps are defined once in
// maps7.mjs (no dual copies in Maris, so no registry re-pins
// arise). Conversions are char-for-char kind swaps on
// grassground/path/tree only (maps7 trees stand on the 'T' char);
// encounter cells/tables, warps, NPC posts, sign records/texts and
// every shipped dressing kind stay byte-identical. Route 101
// "First Road" (1257-1260): campturf is a young camp-meadow green
// with seed-head flecks, firstfloor the first road's pale sand
// (design-authorised), campelm a young camp elm, fieldkit Birch's
// field kit (specimen crate + jar box) x2 off the west grass.
// Route 102 "Pond Road" (1261-1264): stillturf a deep calm
// still-pond meadow, stillfloor pond-threaded pale sand,
// pondalder a leaning-crown pond alder, netstand the bug catcher's
// net stand + bucket x2 by the east path; the five ponds stay
// byte-identical. Route 103 "Wade Shore" (1265-1268): wadeturf a
// salt-flecked bluff-shore turf, wadefloor the wade sand the path
// itself runs on through the shallows (design-authorised),
// wadepine a shore pine, wadepost wade marker posts x2 on the two
// shores; the 192 water cells and the shipped beach family
// (sand/beach-n/beach-ew/psand-w) stay byte-identical entire.
// Route 104 "Flower Road" (1269-1272): bedturf a bloom-flecked
// flower-bed meadow, bedfloor petal pale sand, bedelm a flower-road
// elm, bloombox planter bloom boxes x2 flanking the Pretty Petal
// shop sign; the shop dressing, the boatman's boardwalk and the
// surf warps stay byte-identical. Meadowbrook Woods "Silk Shade"
// (1273-1276): shadeturf a deep shade green with coin-light flecks,
// shadefloor canopy forest sand, silkoak a silk oak with a
// cascoon-hung crown drawn in the tree art, silkstrand a fallen
// silk-strung log section x2 on verified ground cells (the design's
// strung silk lines are creature-layer dressing — no shipped silk
// kind, nothing strung). Ground kinds deliberately do NOT end in
// 'floor' (the desire-path audit counts '*floor' as street tier;
// grounds must never masquerade as street); path kinds DO end in
// 'floor' so they register as the route's path tier per route
// (checklist point 3). Indices 1257-1276 per the program plan
// (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): the Yamato allocation
// ended at 1256; 1111 and every earlier documented gap stay empty.
// Kind names verified unclaimed against origin/main. Chars
// U+1E00+1257..
export const W17L_KIND_DEFS = [
  ['campturf', 'floor'],
  ['firstfloor', 'floor'],
  ['campelm', 'wall'],
  ['fieldkit', 'prop'],
  ['stillturf', 'floor'],
  ['stillfloor', 'floor'],
  ['pondalder', 'wall'],
  ['netstand', 'prop'],
  ['wadeturf', 'floor'],
  ['wadefloor', 'floor'],
  ['wadepine', 'wall'],
  ['wadepost', 'prop'],
  ['bedturf', 'floor'],
  ['bedfloor', 'floor'],
  ['bedelm', 'wall'],
  ['bloombox', 'prop'],
  ['shadeturf', 'floor'],
  ['shadefloor', 'floor'],
  ['silkoak', 'wall'],
  ['silkstrand', 'prop'],
];
export const W17L_KIND_CHARS = {};
W17L_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1257 + i);
  W17L_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17L_PROP_KINDS = W17L_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17L_WALL_KINDS = W17L_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17L_FLOOR_KINDS = W17L_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-M (Route Build Program, Maris Tranche 2 — the Mistford
// surf arc): five sea lanes west and east of Mistford, each its
// own shore register under the NO-SAME-KIT law. All five maps are
// defined once in maps7.mjs (no dual copies in Maris, so no
// registry re-pins arise). Sea-lane discipline (the R40/R41
// precedent): the water is byte-preserved entire — conversions
// are sand -> own sand + rock -> own rock only, after the
// trigger-char census ('R' counts equal the shipped rock counts
// exactly on all five lanes: 14/13/5/22/5; enc.cave=false
// everywhere, so no encounter trigger can move). Route 105 "Sea
// Tomb Lane" (1277-1278): tombsand a stone-pale tomb-shore sand,
// tombrock the drowned colonnade rock with column-joint drawing;
// its 2 'L' Sea Tomb mouth cells are warp cells standing on
// cavefloor — byte-preserved, never converted. Route 106 "Last
// Shallows" (1279-1280): cairnsand a bright town-shore sand,
// cairnrock the dark crag rock — the cave-dark register against
// the bright little town it guards. Route 107 "Open Swell"
// (1281-1282): swellsand swell-shore sand flecks, nearly awash,
// swellrock a reef-shadow rock barely breaking the surface; the
// lane is open swell (5+5 convertible cells — the spec-presence
// exception is pre-recorded in the program plan, R40 precedent).
// Route 108 "Wreck Water" (1283-1284): wrecksand a foam-combed
// wreck sand, wreckrock the rib-reef rock with a long rib-joint
// drawing — the wreck herself is design dressing over the reef
// (no shipped hull kind; the rock conversion carries her).
// Route 109 "Fairhaven Beach" (1285-1286): baysand the warm bay
// beach sand of the great curved beach, swimmer-bright, bayrock
// the harbour-mouth rock; the harbour pier is Fairhaven's own
// town-side dressing, byte-preserved. Sand kinds are 'floor'
// class (the shipped sand char was walkable; the swaps are 1:1),
// rock kinds 'wall' class (the shipped 'R' rock char was never
// walkable). Indices 1277-1286 per the program plan
// (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L took 1257-1276
// on its parallel branch; 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against origin/main.
// Chars U+1E00+1277..
export const W17M_KIND_DEFS = [
  ['tombsand', 'floor'],
  ['tombrock', 'wall'],
  ['cairnsand', 'floor'],
  ['cairnrock', 'wall'],
  ['swellsand', 'floor'],
  ['swellrock', 'wall'],
  ['wrecksand', 'floor'],
  ['wreckrock', 'wall'],
  ['baysand', 'floor'],
  ['bayrock', 'wall'],
];
export const W17M_KIND_CHARS = {};
W17M_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1277 + i);
  W17M_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17M_PROP_KINDS = W17M_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17M_WALL_KINDS = W17M_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17M_FLOOR_KINDS = W17M_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-N (Route Build Program, Maris Tranche 3 — two roads,
// the desert, the chimney): Lilac -> desert -> Smokestack. All
// five maps are defined once in maps7.mjs (no dual copies in
// Maris, so no registry re-pins arise). Conversions are
// char-for-char kind swaps on grassground/path/tree (land
// routes) or cavefloor/volcrock (Scorch Path); encounter
// cells/tables, warps, NPC posts, sign records/texts and every
// shipped biome/dressing kind stay byte-identical. Route 110
// "Two Roads" (1287-1290): underturf is under-way meadow with
// pillar-shadow flecks (the elevated cycleway crosses as shipped
// boardwalk dressing, byte-preserved entire), underfloor the
// walking road's pale sand (design-authorised), underelm a
// two-roads elm, spurpost spur marker posts x2 at the Trick
// House shore turning. Route 111 "Desert Road" (1291-1294):
// duneturf is failing grass with sand-creep flecks toward the
// dune line, dunewayfloor the desert track — worn pale sand over
// stone (design-authorised), dunethorn a sparse pale desert
// thorn tree (honest sparse crown, by design), dunepost track
// marker posts x2 where the grass gives up; the shipped
// desertsand (82 cells) is the route's signature biome kind —
// byte-preserved by spec (the Frost Path precedent) — and the 2
// 'L' Dune Tomb mouth cells are warp cells, byte-preserved.
// Route 112 "Chimney Road" (1295-1298): fumeturf is warm slope
// grass with ash-dust flecks, fumefloor chimney-road sand
// (design-authorised), fumepine a warm-slope pine, gondolapost
// cable-car post bases x2 (the design's wires are dressing — no
// shipped wire kind, nothing strung); volcrock dressing and both
// Scorch Path mouth pairs stay byte-identical. Scorch Path
// "Scorch Heart" (1299-1300) converts by the adapted cave
// method: scorchfloor takes the generic cavefloor (warm tiled
// through-road flags, the design's glowing fissures drawn as
// fissure-lit flecks in the floor's own art, art layer only) and
// scorchrock takes the volcrock WALL register (heat-darkened
// banded rock) — on this map volcrock is the wall, not dressing;
// lavaglow, waterglow, caveboulders and the sign stay
// byte-identical, the trigger census is taken before/after, and
// NO props are placed (cave discipline). Twin: Copperbore
// Tunnel — Scorch is the hot lit heart, Copperbore the tidy cool
// bore. Mt. Smokestack "Smokestack Summit" (1301-1303): NO tree
// cells ship on the summit, so the kit is ground + path + prop
// only (the National Park precedent): smoketurf is ash-dusted
// summit grass with grey creep at the edges, smokefloor the
// summit road's pale ash-sand (design-authorised), camppost the
// ash researchers' logger posts x2 beside their camp; volcrock
// (118), ashground (11) and ashshrub (2) stay byte-identical by
// spec. Ground kinds deliberately do NOT end in 'floor' (the
// desire-path audit counts '*floor' as street tier; grounds must
// never masquerade as street); path kinds DO end in 'floor' so
// they register as the route's path tier per route (checklist
// point 3). Indices 1287-1303 per the program plan
// (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L took 1257-1276
// and W17-M takes 1277-1286 on its parallel branch; 1111 and
// every earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main. Chars U+1E00+1287..
export const W17N_KIND_DEFS = [
  ['underturf', 'floor'],
  ['underfloor', 'floor'],
  ['underelm', 'wall'],
  ['spurpost', 'prop'],
  ['duneturf', 'floor'],
  ['dunewayfloor', 'floor'],
  ['dunethorn', 'wall'],
  ['dunepost', 'prop'],
  ['fumeturf', 'floor'],
  ['fumefloor', 'floor'],
  ['fumepine', 'wall'],
  ['gondolapost', 'prop'],
  ['scorchfloor', 'floor'],
  ['scorchrock', 'wall'],
  ['smoketurf', 'floor'],
  ['smokefloor', 'floor'],
  ['camppost', 'prop'],
];
export const W17N_KIND_CHARS = {};
W17N_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1287 + i);
  W17N_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17N_PROP_KINDS = W17N_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17N_WALL_KINDS = W17N_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17N_FLOOR_KINDS = W17N_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-O (Route Build Program, Maris Tranche 4 — the broken
// stair, the ash road, the crater road, the fallen sky): Ragged
// Pass -> Route 113 -> Route 114 -> Comet Falls -> Route 115.
// All five maps are defined once in maps7.mjs (no dual copies in
// Maris, so no registry re-pins arise). Conversions are
// char-for-char kind swaps on grassground/path/tree (land
// routes) or cavefloor/cavewall (Comet Falls); encounter
// cells/tables, warps, NPC posts, sign records/texts and every
// shipped biome/dressing kind stay byte-identical. Ragged Pass
// "the broken stair" (1304-1307): stairturf is ledge grass with
// worn-lip stone-dust flecks, stairfloor broken-stair sand —
// the design's cut stair flights drawn as stepped lip edges in
// the path kind's own art (the fallfloor discipline) —
// stairpine a compact ledge pine, springpost spring-terrace
// marker posts x2 on the lower steps; volcrock dressing (5)
// stays byte-identical. Route 113 "Ash Road" (1308-1311):
// sweepturf is ash-dulled grass with swept-clean patches,
// sweepfloor the swept pale road with broom streaks drawn in
// the kind, sweeppine an ash-pale pine, ashdrift banked ash
// drifts x2 on the road's verge (the shipped map carries no
// fence kind, so the drifts bank against the ashground
// patches — recorded in the checklist); the shipped ashground
// (26) + ashshrub (7) are the route's permanent ash biome —
// byte-preserved by spec (Director ruling #3, the Frost Path
// precedent). Route 114 "Crater Road" (1312-1315): impacturf
// is crater-field grass with stone-dust flecks, impactfloor
// crater-road sand with fallen stone chips in the tread,
// impactpine a sturdy crater pine, hunterpost fossil hunters'
// marker posts x2 among the craters; meteorstone (3) and the
// 2 'L' falls-mouth warp cells stay byte-identical. Comet
// Falls "Comet Deep" (1316-1317) converts by the cave method:
// cometfloor takes the generic cavefloor (star-stone cave
// flags, the design's fallen-sky fragments drawn as star
// flecks in the floor's own art, art layer only) and
// cometwall takes the cavewall (breached cavern wall, the
// broken sky-roof drawn as a pale star-stone seam band);
// falls water (59), meteorstone (3), cavecrystal (3) and
// caveboulder (1) stay byte-identical, the trigger census is
// taken before/after, and NO props are placed (cave
// discipline). Twin: Scorch Path — Comet is the wet
// fallen-sky cave, Scorch the hot heart. Route 115 "Falls
// Shore" (1318-1321): mistturf is spray-fresh shore grass,
// mistfloor falls-foot pale sand (design-authorised),
// mistpine a spray-fresh shore pine, swimpost swimmer's
// marker posts x2 at the falls' foot pool; shore water (60),
// the rock falls-foot boulders (30 — falls dressing, NOT a
// lane conversion) and the 2 'L' north-mouth warp cells stay
// byte-identical. Ground kinds deliberately do NOT end in
// 'floor' (the desire-path audit counts '*floor' as street
// tier; grounds must never masquerade as street); path kinds
// DO end in 'floor' so they register as the route's path tier
// per route (checklist point 3). Indices 1304-1321 per the
// program plan (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L
// took 1257-1276, W17-M 1277-1286, and W17-N takes 1287-1303
// on its parallel branch; 1111 and every earlier documented
// gap stay empty. Kind names verified unclaimed against
// origin/main. Chars U+1E00+1304..
export const W17O_KIND_DEFS = [
  ['stairturf', 'floor'],
  ['stairfloor', 'floor'],
  ['stairpine', 'wall'],
  ['springpost', 'prop'],
  ['sweepturf', 'floor'],
  ['sweepfloor', 'floor'],
  ['sweeppine', 'wall'],
  ['ashdrift', 'prop'],
  ['impacturf', 'floor'],
  ['impactfloor', 'floor'],
  ['impactpine', 'wall'],
  ['hunterpost', 'prop'],
  ['cometfloor', 'floor'],
  ['cometwall', 'wall'],
  ['mistturf', 'floor'],
  ['mistfloor', 'floor'],
  ['mistpine', 'wall'],
  ['swimpost', 'prop'],
];
export const W17O_KIND_CHARS = {};
W17O_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1304 + i);
  W17O_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17O_PROP_KINDS = W17O_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17O_WALL_KINDS = W17O_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17O_FLOOR_KINDS = W17O_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-P (Route Build Program, Maris Tranche 5 — tunnel
// hill, flower fields, the river road, the rain begins):
// Route 116 -> Copperbore Tunnel -> Route 117 -> Route 118 ->
// Route 119. All five maps are defined once in maps7.mjs (no
// dual copies in Maris, so no registry re-pins arise).
// Conversions are char-for-char kind swaps on grassground/
// path/tree (land routes) or cavefloor/cavewall (Copperbore,
// cave method); encounter cells/tables, warps, NPC posts,
// sign records/texts and every shipped biome/dressing kind
// stay byte-identical. Route 116 "Tunnel Hill" (1322-1325):
// echoturf is quiet hill grass with hushed pale flecks,
// echofloor tunnel-hill sand (design-authorised), echopine a
// thickening hill pine, echopost echo marker posts x2 at the
// tunnel mouth approach; pond water (15), rock dressing (18)
// and the 2 'L' tunnel-mouth warp cells standing on cavefloor
// stay byte-identical. Twin: Route 117 — R116 is the quiet
// hill, R117 the loud flower fields. Copperbore Tunnel
// "Copperbore" (1326-1327) converts by the cave method:
// borefloor takes the generic cavefloor (tidy dug-bore flags,
// tool-marked) and borewall takes the cavewall (chalk-X
// inspection wall, the design's lamps/X-marks drawn in the
// wall kind's art, art layer only); water (15), cavecrystal
// (7) and caveboulder (5) stay byte-identical, the trigger
// census is taken before/after, and NO props are placed
// (cave discipline). Twin: Scorch Path — Copperbore is the
// tidy cool bore, Scorch the hot lit heart. Route 117
// "Flower Fields" (1328-1331): dayturf is field green under
// the flower beds, dayfloor flower-road pale sand
// (design-authorised), dayelm a broad field elm, faelamp
// ROSEFAE lantern posts x2 (slow green lamp heads); the
// shipped flower beds (62) are the route's dressing —
// byte-preserved entire, the ground converts around them —
// and the Day-Care fence (3) + haycarts (2) stay
// byte-identical. Route 118 "River Road" (1332-1335):
// fordturf is river-bank turf with wet-edge flecks,
// fordfloor bank-road sand (design-authorised), fordwillow
// the fleet's only willow (drooping crown drawn in the tree
// art), fordpost ford-end depth-gauge posts x2 flanking the
// plank crossing; river water (48) and the ford planks
// themselves — the shipped boardwalk kind (8) — stay
// byte-identical BY SPEC (Director ruling #3: the planks are
// older than the road and prouder; the route's own path kind
// runs the banks). Route 119 "Rain Road (Maris)"
// (1336-1339): gaugeturf is rain-soaked deep green with
// mushroom-pale flecks, gaugefloor rain-road sand — darker,
// puddle-polished (split from Yamato's rainfloor by the gorge
// register + gauge dressing), gaugepine a drip-crowned rain
// pine, gaugebox Weather Institute rain-gauge boxes x2;
// river gorge water (96), boardwalk (8) and leafplanters (3)
// stay byte-identical; weather: rain (permanent). Twin:
// Route 120 — R119 climbs in rain, R120 holds the long-rain
// secrets. Ground kinds deliberately do NOT end in 'floor'
// (the desire-path audit counts '*floor' as street tier;
// grounds must never masquerade as street); path kinds DO
// end in 'floor' so they register as the route's path tier
// per route (checklist point 3). Indices 1322-1339 per the
// program plan (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L
// took 1257-1276, W17-M 1277-1286, W17-N 1287-1303, and
// W17-O takes 1304-1321 on its parallel branch; 1111 and
// every earlier documented gap stay empty. Kind names
// verified unclaimed against origin/main. Chars U+1E00+1322..
export const W17P_KIND_DEFS = [
  ['echoturf', 'floor'],
  ['echofloor', 'floor'],
  ['echopine', 'wall'],
  ['echopost', 'prop'],
  ['borefloor', 'floor'],
  ['borewall', 'wall'],
  ['dayturf', 'floor'],
  ['dayfloor', 'floor'],
  ['dayelm', 'wall'],
  ['faelamp', 'prop'],
  ['fordturf', 'floor'],
  ['fordfloor', 'floor'],
  ['fordwillow', 'wall'],
  ['fordpost', 'prop'],
  ['gaugeturf', 'floor'],
  ['gaugefloor', 'floor'],
  ['gaugepine', 'wall'],
  ['gaugebox', 'prop'],
];
export const W17P_KIND_CHARS = {};
W17P_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1322 + i);
  W17P_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17P_PROP_KINDS = W17P_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17P_WALL_KINDS = W17P_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17P_FLOOR_KINDS = W17P_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-Q (Route Build Program, Maris Tranche 6 — the long
// rain, the Pyre shore, the Pyre water, the berry road, the
// trench crossing): Route 120 -> Route 121 -> Route 122 ->
// Route 123 -> Route 124. All five maps are defined once in
// maps7.mjs (no dual copies in Maris, so no registry re-pins
// arise). Conversions are char-for-char kind swaps on
// grassground/path/tree (land routes) or sand/rock (sea
// lanes); encounter cells/tables, warps, NPC posts, sign
// records/texts and every shipped biome/dressing kind stay
// byte-identical. Route 120 "Long Rain" (1340-1343):
// ledgerturf is long-rain grass — cool blue-green with wet
// flecks and rain-slick sheen (split from Route 119's deep
// warm gorge green by temperature and from Yamato's rain turf
// by value), ledgerfloor long-rain road sand (design-
// authorised; grey-cool, puddle-polished in ruled sheen
// pairs), ledgerpine a cold wet tiered pine, rainbarrel
// Weather Institute rain barrels x2 (the Institute logs this
// route's rain by the barrel); lake water (40), flower (35),
// fence (8), rock (5), leafplanters (2) and the 4 'L'
// tomb/slab-mouth warp cells standing on cavefloor stay
// byte-identical (the tombs are out-of-program dungeons).
// Weather: rain. Twin: Route 119 — R119 climbs in the gorge
// rain, R120 holds the long-rain secrets by the lake.
// Route 121 "Pyre Road" (1344-1347): wardenturf is warden-
// patrolled road grass with bramble flecks, wardenfloor
// cove-road sand (design-authorised; warm, drying out of the
// rain), wardenpine a warm shoulder pine, standstone
// pilgrim-track standing stones x2; shore water (29), fence
// (14), leafplanters (4) and flower (29) stay byte-identical;
// weather: rain (the Pyre shoulder keeps the rain country's
// edge). Twin: Route 123 — both Requiem roads; R121 is the
// warden's shore road, R123 the berry bend. Route 122 "Pyre
// Water" (1348-1349) is a sea lane: pyresand is grave-shore
// sand (ash-pale, grey-quiet) and pyrerock Requiem shoulder
// rock (red-banded drawing — the fleet's only red-banded
// rock); water (381) + waterglow (8) stay byte-identical
// entire, the island's encounter grass (6), beach-family
// dressing (13), coral (2) and the 2 'L' Pyre-mouth warp
// cells standing on cavefloor stay byte-identical; only the
// island shore's sand (27) and rock (7) convert, after the
// trigger census (the R40/R41 discipline). Twin: Route 124 —
// both island lanes; R122 is the dark respectful water, R124
// the cheerful trench crossing. Route 123 "Berry Road
// (Maris)" (1350-1353): masterturf is ordered-field green —
// row lines drawn in the kind, the fleet's only row-drawn
// ground — masterfloor berry-bend sand (design-authorised),
// masterelm a tended field elm, berryrow berry-row end
// markers x2 (split from Yamato's berrytree/berrycrate by
// register: tended field rows vs wild climb); the shipped
// flower beds (62) are the Berry Master's fields — byte-
// preserved entire, the ground converts around them — and
// shore water (15), rock (3) and fence (2) stay byte-
// identical. Twin: Route 121. Route 124 "Trench Crossing"
// (1354-1355) is a sea lane: trenchsand is crossing sand over
// the dark water (grey-wet, dark depth flecks) and trenchrock
// trench-rim rock (dark blue-grey, sheer rim block — the
// darkest rock in Maris); water (410) + waterglow (18) stay
// byte-identical entire, coral (3) stays byte-identical, and
// the 2 dive tiles standing on 'W' cells (13,7),(14,7) plus
// their diveSpots records are MECHANIC data — byte-preserved,
// censused before/after on BOTH maps of the pair (the trench
// map itself, r124-underwater, is Tranche 7's map and is NOT
// touched by this wave; Director ruling #1). Only shore sand
// (6) and rock (10) convert. Twin: Route 122. Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit
// counts '*floor' as street tier; grounds must never
// masquerade as street); path kinds DO end in 'floor' so
// they register as the route's path tier per route
// (checklist point 3). Indices 1340-1355 per the program
// plan (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L took
// 1257-1276, W17-M 1277-1286, W17-N 1287-1303, W17-O
// 1304-1321, and W17-P takes 1322-1339 on its parallel
// branch; 1111 and every earlier documented gap stay empty.
// Kind names verified unclaimed against origin/main. Chars
// U+1E00+1340..
export const W17Q_KIND_DEFS = [
  ['ledgerturf', 'floor'],
  ['ledgerfloor', 'floor'],
  ['ledgerpine', 'wall'],
  ['rainbarrel', 'prop'],
  ['wardenturf', 'floor'],
  ['wardenfloor', 'floor'],
  ['wardenpine', 'wall'],
  ['standstone', 'prop'],
  ['pyresand', 'floor'],
  ['pyrerock', 'wall'],
  ['masterturf', 'floor'],
  ['masterfloor', 'floor'],
  ['masterelm', 'wall'],
  ['berryrow', 'prop'],
  ['trenchsand', 'floor'],
  ['trenchrock', 'wall'],
];
export const W17Q_KIND_CHARS = {};
W17Q_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1340 + i);
  W17Q_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17Q_PROP_KINDS = W17Q_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17Q_WALL_KINDS = W17Q_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17Q_FLOOR_KINDS = W17Q_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-R (Route Build Program, Maris Tranche 7 — under the
// trench crossing, the north bay, the Craterlake water, under
// the crater): the program's first full dive-pair tranche. All
// four maps are defined once in maps7.mjs (no dual copies in
// Maris, so no registry re-pins arise). UNDERWATER METHOD
// (Director ruling #1): the two trench maps convert by the
// cave-method analogue — seasand -> own floor kind, uwrock ->
// own wall kind, art layer only, NO props; the dive-pair
// mechanic tiles are byte-preserved and censused on BOTH maps
// of each pair (surface 'W' dive tiles + diveSpots records;
// trench waterglow return tiles + surfaceSpots records).
// Route 124 Trench "Lit Shafts" (1356-1357): shaftfloor a
// bright pale light-shaft sand (the lit pools drawn in the
// floor's own art where the surface doors land), shaftwall a
// blue-grey jointed shaft rock. Route 125 "North Bay"
// (1358-1359): ebbsand a tide-banded bay sand (the tide lines
// drawn in the kind, per the design), ebbrock an ice-fringed
// cave-isle rock (pale frost edges per the design's glinting
// ice falls); water 383 + waterglow 17 byte-preserved entire,
// the 2 'L' Ebbtide mouth cells standing on cavefloor are
// warp cells — byte-preserved, never converted; coral 5
// byte-preserved. Route 126 "Craterlake Water" (1360-1361):
// cratersand a grey-warm crater-bay sand, craterrock a
// crater-wall rock with massive joint drawing (split from
// Craterlake town's craterfloor street by register: wild wall
// vs city floor); water 398 + waterglow 21 byte-preserved
// entire, lifering 3 + coral 1 byte-preserved; its 2 dive
// tiles on 'W' cells + diveSpots records are mechanic data —
// byte-preserved, censused (Craterlake sootopolis also
// dive-pairs into the same trench; its pair records stand on
// the town map, byte-preserved entire, the town not touched).
// Route 126 Trench "Crater Door" (1362-1363): doorfloor a
// volcanic-grey trench sand with runway-lit flecks (the
// design's LUMIFIN rows drawn in the floor art, art layer
// only), doorwall an arched crater rock, darker than 124's
// shaft rock. Each trench is twin-split from its pair-sibling
// by value/hue (the Lunestone 1F/B1F discipline): 124 is the
// bright lit crossing, 126 the volcanic drowned doorway.
// Shipped trench dressing (kelpbed, moonmoss, cerpool,
// uwcoral, kelp, crystalcluster, starrock, cavelantern, plain
// sand patches and every other non-seasand/uwrock kind)
// stands byte-preserved inside the new registers; encounter
// tables (0.13, clamperl set) and the maps' underwater flags
// are byte-identical. Sand kinds are 'floor' class (the
// shipped sand char was walkable; the swaps are 1:1), trench
// floor kinds 'floor' class (swapped 1:1 from the walkable
// seasand), rock/wall kinds 'wall' class (never walkable).
// Indices 1356-1363 per the program plan
// (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L took
// 1257-1276, W17-M 1277-1286, W17-N 1287-1303, W17-O
// 1304-1321, W17-P 1322-1339, and W17-Q takes 1340-1355 on
// its parallel branch; 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against
// origin/main. Chars U+1E00+1356..
export const W17R_KIND_DEFS = [
  ['shaftfloor', 'floor'],
  ['shaftwall', 'wall'],
  ['ebbsand', 'floor'],
  ['ebbrock', 'wall'],
  ['cratersand', 'floor'],
  ['craterrock', 'wall'],
  ['doorfloor', 'floor'],
  ['doorwall', 'wall'],
];
export const W17R_KIND_CHARS = {};
W17R_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1356 + i);
  W17R_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17R_PROP_KINDS = W17R_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17R_WALL_KINDS = W17R_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17R_FLOOR_KINDS = W17R_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-S (Route Build Program, Maris Tranche 8 — the
// unmapped country, the Perennial approach, the south-running
// sea): the program's second dive-pair tranche. All five maps
// are defined once in maps7.mjs (no dual copies in Maris, so
// no registry re-pins arise). UNDERWATER METHOD (Director
// ruling #1): the two trench maps convert by the cave-method
// analogue — seasand -> own floor kind, uwrock -> own wall
// kind, art layer only, NO props; the dive-pair mechanic
// tiles are byte-preserved and censused on BOTH maps of each
// pair (surface 'W' dive tiles + diveSpots records; trench
// waterglow return tiles + surfaceSpots records). Both pairs
// are internal to this tranche: each lane is its own trench's
// surface partner and converts in the same wave. Route 127
// "Kelp Sea" (1364-1365): kelpsand a kelp-shadowed shore
// sand (green-shaded flecks — the forest's shadow standing in
// the shallows), kelprock a frond-hung rock; water 395 +
// waterglow 26 byte-preserved entire, coral 6 + lifering 1
// byte-preserved; its 2 dive tiles on 'W' cells (13,7),(14,7)
// + diveSpots records are mechanic data — byte-preserved,
// censused. Only shore sand (8) and rock (11) convert.
// Route 127 Trench "Kelp Floor" (1366-1367): kelpfloor a
// golden sand swim-path (lit patches drawn in the floor's own
// art per the design — the way back up stands lit through the
// forest), kelpwall a forest-edge rock, green-dark; the
// shipped dressing family stands byte-preserved inside the
// new register — kelpbed 52 (the forest itself), moonmoss
// 28, cerpool 12, plain sand 10, waterglow 9, cavelantern 7,
// crystalcluster 5, uwcoral 5, kelp 5, cavecrystal 4, rock 4,
// starrock 3. Route 128 "Perennial Approach" (1368-1369):
// sunksand a deep-channel sand (sparse flecks in deep water
// — spec presence is thin by nature, the plan's pre-recorded
// R40-class exception: only sand 2 + rock 10 convert),
// sunkrock a cavern-ring rock with warm-breathing joint
// drawing (the drowned cavern's warmth read from above);
// water 406 + waterglow 22 byte-preserved entire, coral 6 +
// lifering 1 byte-preserved; dive tiles + records
// byte-preserved, censused. Route 128 Trench "Breathing
// Dark" (1370-1371): breathfloor a warm-niched trench sand
// (ember-warm flecks standing in the tread), breathwall a
// breathing cavern rock with warm seams; its 2 warp cells
// (22,5),(23,5) -> seafloor-cavern stand on cavefloor — the
// Sunken Cavern's walking mouth is byte-preserved entire
// (cavefloor is neither seasand nor uwrock and never
// converts); dressing byte-preserved: kelpbed 56, moonmoss
// 27, cerpool 12, plain sand 10, waterglow 6, uwcoral 4,
// cavelantern 3, starrock 3, cavecrystal 2, crystalcluster
// 2, kelp 2, rock 1. Route 129 "Lee Water" (1372-1373):
// leesand a lee-shore sand (calm flecks), leerock a
// crater-lee rock with shadow-side drawing; water 403 +
// waterglow 24 byte-preserved entire, coral 4 + lifering 2
// byte-preserved; only sand 5 + rock 9 convert. The two
// trenches are twin-split by register (the Lunestone 1F/B1F
// discipline): 127 is the golden kelp floor under a green
// forest edge, 128 the warm breathing dark; the three lanes
// split by shore register: kelp-shadowed, deep-channel,
// lee-calm. Encounter tables (0.10 surf set on the lanes,
// 0.13 clamperl set in the trenches) and the trenches'
// underwater flags are byte-identical. Sand kinds are
// 'floor' class (the shipped sand char was walkable; the
// swaps are 1:1), trench floor kinds 'floor' class (swapped
// 1:1 from the walkable seasand), rock/wall kinds 'wall'
// class (never walkable). Indices 1364-1373 per the program
// plan (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md): W17-L took
// 1257-1276, W17-M 1277-1286, W17-N 1287-1303, W17-O
// 1304-1321, W17-P 1322-1339, W17-Q 1340-1355, and W17-R
// takes 1356-1363 on its parallel branch; 1111 and every
// earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main. Chars U+1E00+1364..
export const W17S_KIND_DEFS = [
  ['kelpsand', 'floor'],
  ['kelprock', 'wall'],
  ['kelpfloor', 'floor'],
  ['kelpwall', 'wall'],
  ['sunksand', 'floor'],
  ['sunkrock', 'wall'],
  ['breathfloor', 'floor'],
  ['breathwall', 'wall'],
  ['leesand', 'floor'],
  ['leerock', 'wall'],
];
export const W17S_KIND_CHARS = {};
W17S_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1364 + i);
  W17S_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17S_PROP_KINDS = W17S_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17S_WALL_KINDS = W17S_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17S_FLOOR_KINDS = W17S_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-T (Route Build Program, Maris Tranche 9 — the last
// quiet water, the Driftlog corridor, the current roads home):
// the Maris finale. All five maps are defined once in
// maps7.mjs (no dual copies in Maris, so no registry re-pins
// arise). All five are SEA LANES: sand -> own shore sand, rock
// -> own rock ONLY (the R40/R41 discipline), NO props; every
// water cell, landing and waterglow stands byte-preserved.
// Route 130 "Quiet Water" (1374-1375): quietsand a
// glass-clear shallows sand (garden flecks — the CORALET
// gardens show through the water in the design, water
// dressing, nothing planted), quietrock a confluence rock;
// water 404 + waterglow 21 byte-preserved entire, coral 5 +
// lifering 1 byte-preserved; only sand 7 + rock 9 convert.
// Route 131 "Driftlog Corridor" (1376-1377): moorsand a
// mooring-shore sand (rope-worn flecks), moorrock a tower-isle
// rock; water 390 + waterglow 19 byte-preserved entire, coral
// 1 byte-preserved; the 2 Tempest Tower mouth cells stand on
// cavefloor ('L' char) + ancientpillar 2 — the tower isle's
// shipped dressing, byte-preserved, never converted; only
// sand 24 + rock 8 convert. Route 132 "First Current"
// (1378-1379): streamsand a current-edge sand (foam-streak
// flecks), streamrock a channel-edge rock; water 329 +
// waterglow 16 byte-preserved entire and the CURRENT BANDS
// (82 cells) byte-identical entire — `current` is a movement
// mechanic, the Frost Path slide-floor precedent in water
// (Director ruling #3); coral 7 byte-preserved; only sand 9 +
// rock 4 convert. Route 133 "Middle Current" (1380-1381):
// rapidsand a rapid-edge sand (harder foam flecks),
// rapidrock a rapid channel rock (longer joints); water 328 +
// waterglow 19 + current 77 byte-identical entire; coral 5 +
// lifering 1 byte-preserved; only sand 6 + rock 11 convert.
// Route 134 "Last Current" (1382-1383): gatesand a
// delivery-channel sand, gaterock a gate rock at the falls'
// foot register (Perennial's falls are the town-side frame,
// byte-preserved); water 327 + waterglow 20 + current 75
// byte-identical entire; coral 5 + lifering 1 byte-preserved;
// only sand 7 + rock 12 convert. The three current roads
// split by shore register + speed read (the plan's twin
// discipline): 132 first (foam-streaked, gentle), 133 fiercer
// (harder foam, longer joints), 134 converging (the delivery
// channel at the falls' foot); R130 is the last quiet water
// and R131 the moored corridor — five lanes, five registers,
// none a twin of any of the 82 prior route kits. Encounter
// tables (0.10 surf set) are byte-identical. Sand kinds are
// 'floor' class (the shipped sand char was walkable; the
// swaps are 1:1), rock kinds 'wall' class (never walkable).
// Indices 1374-1383 per the program plan
// (WAVE-W17-MARIS-ROUTE-PROGRAM-PLAN.md) — the Maris
// allocation closes at 1383 (program total 127 kinds,
// 1257-1383): W17-L took 1257-1276, W17-M 1277-1286, W17-N
// 1287-1303, W17-O 1304-1321, W17-P 1322-1339, W17-Q
// 1340-1355, W17-R 1356-1363, and W17-S takes 1364-1373 on
// its parallel branch; 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against
// origin/main. Chars U+1E00+1374..
export const W17T_KIND_DEFS = [
  ['quietsand', 'floor'],
  ['quietrock', 'wall'],
  ['moorsand', 'floor'],
  ['moorrock', 'wall'],
  ['streamsand', 'floor'],
  ['streamrock', 'wall'],
  ['rapidsand', 'floor'],
  ['rapidrock', 'wall'],
  ['gatesand', 'floor'],
  ['gaterock', 'wall'],
];
export const W17T_KIND_CHARS = {};
W17T_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1374 + i);
  W17T_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17T_PROP_KINDS = W17T_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17T_WALL_KINDS = W17T_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17T_FLOOR_KINDS = W17T_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-U (Route Build Program, Borea Tranche 1 — the first
// roads: Clover -> Shingle -> Revelry -> Coalseam, the bluff
// road, and the Ruined Path cave): Route 201 -> Route 202 ->
// Route 203 -> Route 204 -> Ruined Path. All five maps are
// defined once in maps9.mjs (no dual copies in Borea, so no
// registry re-pins arise). Conversions are char-for-char kind
// swaps on grassground/path/tree (land routes) or
// cavefloor/cavewall (Ruined Path, cave method); encounter
// cells/tables, warps, NPC posts, sign records/texts and every
// shipped biome/dressing kind stay byte-identical. Route 201
// "First Road (Borea)" (1384-1387): candorturf is lake-shore
// first meadow (fresh green with shore flecks — Lake Candor's
// shore water (15) stays byte-identical on its north side),
// candorfloor first-road pale sand (design-authorised),
// candorelm a young shore elm, milepost mile posts x2 on
// verified grassground cells along the thinking-walk grass;
// flower (16), rock (2), fence (2) and signposts (4) stay
// byte-identical. Twin: Route 101 (Maris) — both are their
// region's first road; R201 is lake-shore green under Candor's
// glint, R101 camp-meadow by the field camp. Route 202 "City
// Approach" (1388-1391): gateturf is approach meadow with
// petal flecks where the city beds thicken (the shipped
// flower dressing (31) stays byte-preserved, the ground
// converts around it), spirefloor city-approach pale sand
// (design-authorised; renamed in-plan — the draft 'gatefloor'
// is a shipped kind), gateoak an approach oak (draft 'gateelm'
// renamed in-plan likewise), citypost city-approach posts x2
// flanking the path where the beds thicken; rock (8) and
// fence (7) stay byte-identical. Twin: Route 201 — R202 is
// the city approach under Revelry's towers, R201 the
// lake-shore first road. Route 203 "Coal Approach"
// (1392-1395): coalturf is grass greying toward coal country
// with stone-dust flecks, coalfloor coal-road pale sand
// (design-authorised), coalpine a mine-country pine with a
// dusted crown, cartpost cart-track marker posts x2 where the
// stone thickens; pond water (15), fence (5) and rock (4)
// stay byte-identical. Twin: Route 207 — both are Coalseam's
// roads; R203 is the flat coal approach, R207 the switchback
// climb. Route 204 "Bluff Road" (1396-1399): bluffturf is
// bluff-foot turf with scree flecks, blufffloor bluff-road
// pale sand (design-authorised), bluffpine a bluff pine,
// screepost scree warning posts x2 under the fallen slope;
// the shipped flowerfield (32) and honeytree (1) are biome
// dressing — byte-preserved by spec (Director ruling #3) —
// and flower (15), rock (2), fence (2) stay byte-identical.
// Twin: Ruined Path — R204 is the open bluff road, the Path
// its collapsed continuation. Ruined Path "Ruined Road"
// (1400-1401) converts by the cave method: oldroadfloor takes
// the generic cavefloor (broken paving flags — the old road's
// slabs, cracked joints drawn in the kind) and ruinwall takes
// the cavewall (rubble-vault wall, fallen-stone seams, the
// design's wall-niche glints drawn in the wall kind's art,
// art layer only); drip water (15), rock (9) and caveboulder
// (3) stay byte-identical, the trigger census is taken
// before/after, and NO props are placed (cave discipline).
// Twin: Copperbore Tunnel (Maris) — Copperbore is the tidy
// dug bore, the Ruined Path is a road that collapsed and kept
// working. Ground kinds deliberately do NOT end in 'floor'
// (the desire-path audit counts '*floor' as street tier;
// grounds must never masquerade as street); path kinds DO
// end in 'floor' so they register as the route's path tier
// per route (checklist point 3). Indices 1384-1401 per the
// program plan (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the
// Maris allocation closed at 1383 (W17-L..W17-T); 1111 and
// every earlier documented gap stay empty. Kind names
// verified unclaimed against origin/main.
export const W17U_KIND_DEFS = [
  ['candorturf', 'floor'],
  ['candorfloor', 'floor'],
  ['candorelm', 'wall'],
  ['milepost', 'prop'],
  ['gateturf', 'floor'],
  ['spirefloor', 'floor'],
  ['gateoak', 'wall'],
  ['citypost', 'prop'],
  ['coalturf', 'floor'],
  ['coalfloor', 'floor'],
  ['coalpine', 'wall'],
  ['cartpost', 'prop'],
  ['bluffturf', 'floor'],
  ['blufffloor', 'floor'],
  ['bluffpine', 'wall'],
  ['screepost', 'prop'],
  ['oldroadfloor', 'floor'],
  ['ruinwall', 'wall'],
];
export const W17U_KIND_CHARS = {};
W17U_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1384 + i);
  W17U_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17U_PROP_KINDS = W17U_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17U_WALL_KINDS = W17U_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17U_FLOOR_KINDS = W17U_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-V (Route Build Program, Borea Tranche 2 — the
// valley, the forest, the road above, the climb: Honeyfield ->
// Heritage -> Mt. Apex's doors): Route 205 -> Heritage Forest
// -> Route 206 -> Route 207 -> Route 208. All five maps are
// defined once in maps9.mjs (no dual copies in Borea, so no
// registry re-pins arise). Conversions are char-for-char kind
// swaps on grassground/path/tree; encounter cells/tables,
// warps, NPC posts, sign records/texts and every shipped
// biome/dressing kind stay byte-identical. Route 205 "Valley
// Road" (1402-1405): galeturf is wind-valley grass with swirl
// flecks, galefloor valley-road pale sand (design-authorised),
// galepine a ridge pine with a wind-bent crown drawn in the
// tree art, hivebox hive-yard boxes x2 on verified grassground
// cells flanking the shipped honeytree in the flower grass;
// the river water (15), the honeytree (1), flower (16), rock
// (9), fence (4) and the Galeworks + Ironworks footprint pieces
// (roofs/walls/doors, windmill 2) standing on this map stay
// byte-identical entire. Twin: Route 206 — R205 is the open
// honey valley, R206 the cycleway's shadow. Heritage Forest
// "Manor Shade" (1406-1409): deepturf is deep shade green with
// coin-light flecks, deepfloor canopy forest sand leaf-flecked,
// manoroak a manor oak with an ancient spread crown, silklog a
// fallen silk-strung log section x2 on verified grassground
// cells (split from Maris's silkstrand by register: Borea's log
// lies in manor shade, Maris's in bright silk shade); the
// honeytrees (3), flower (25) and the Ruined Manor's footprint
// pieces stay byte-identical. Twin: Meadowbrook Woods (Maris)
// — the Woods are bright silk shade, Heritage Forest is dark
// manor shade; in-region twin: Route 205. Route 206 "Pillar
// Road" (1410-1413): pillarturf is pillar-shadow meadow with
// cool flecks, pillarwayfloor the walking road's pale sand
// under the pillars (design-authorised), pillarpine a shadow
// pine, straypost cave-mouth marker posts x2 flanking the Stray
// Cave mouths; the cycleway's pillar stone (rock 20), the two
// 'L' cave-mouth warp cells, flower (28), fence (3) and
// signposts (4) stay byte-identical (the cave itself is out of
// program). Twin: Route 110 (Maris) — the fleet's closest
// concept pair, named honestly: both are roads under a
// cycleway; R206 splits by register — Borea's climbs north on
// stone pillars with a cave in its shadow, Maris's keeps ponds
// and a shore spur under its pillars. Route 207 "Switchback
// Climb" (1414-1417): climbturf is foothill turf with
// ring-glint flecks (the design's RELICT rings scattered in the
// grass), switchfloor switchback sand (design-authorised; the
// zigzag tread is drawn in the kind, the fallfloor discipline),
// climbpine a climb pine, relicpost relic-ring marker posts x2
// at the bends; pond water (12), fence (5) and rock (2) stay
// byte-identical. Twin: Route 208 — R207 is the switchback
// climb from Coalseam, R208 the rest-rock road from Inglenook.
// Route 208 "Rest Road" (1418-1421): restturf is rest-meadow
// turf with warm flecks, restfloor rest-road pale sand
// (design-authorised), restpine a rest pine, reststone foothill
// rest rocks x2 on verified grassground cells where the file of
// travellers stretches; fence (6) and rock (4) stay
// byte-identical. Twin: Route 207. Ground kinds deliberately do
// NOT end in 'floor' (the desire-path audit counts '*floor' as
// street tier; grounds must never masquerade as street); path
// kinds DO end in 'floor' so they register as the route's path
// tier per route (checklist point 3). Indices 1402-1421 per the
// program plan (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the
// Borea allocation opened at 1384 (W17-U); 1111 and every
// earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main.
export const W17V_KIND_DEFS = [
  ['galeturf', 'floor'],
  ['galefloor', 'floor'],
  ['galepine', 'wall'],
  ['hivebox', 'prop'],
  ['deepturf', 'floor'],
  ['deepfloor', 'floor'],
  ['manoroak', 'wall'],
  ['silklog', 'prop'],
  ['pillarturf', 'floor'],
  ['pillarwayfloor', 'floor'],
  ['pillarpine', 'wall'],
  ['straypost', 'prop'],
  ['climbturf', 'floor'],
  ['switchfloor', 'floor'],
  ['climbpine', 'wall'],
  ['relicpost', 'prop'],
  ['restturf', 'floor'],
  ['restfloor', 'floor'],
  ['restpine', 'wall'],
  ['reststone', 'prop'],
];
export const W17V_KIND_CHARS = {};
W17V_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1402 + i);
  W17V_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17V_PROP_KINDS = W17V_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17V_WALL_KINDS = W17V_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17V_FLOOR_KINDS = W17V_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-W (Borea Tranche 3 — the Apex spine + Route 211):
// Mt. Apex's three floors each take their own dressed-stone
// register off the shipped coronet pair — South's step flags /
// step stone (Front Hall: tiered treads, door-jamb banding),
// Central's spine flags / spine stone (The Spine: cruciform
// joints, deeper seam shadow), North's zenith flags / zenith
// stone (Open Sky: the trilogy's brightest floor, frost-rimmed
// joints and frost struck into the east wall's art) — the cave
// method on a dressed-stone register, twin-split floor by
// floor by value + dressing (the Lunestone 1F/B1F discipline).
// The shipped dressing inside each register (water pools,
// cavecrystal, caveboulder, lanternpost, Central's step seam)
// stands byte-preserved; North's 6 climbwall gate tiles are
// MECHANIC data, byte-preserved and censused. NO props stand
// in the mountain (cave discipline). The excluded Summit Road
// and the League exterior keep coronetfloor/coronetrock
// untouched. Route 211 (the west-door road) takes the bluff-
// top register: lotusturf (suffix-free ground, still-air petal
// flecks), lotusfloor (the path tier, *floor per checklist
// point 3), lotuspine (wall class, as every route tree), and
// the lotuspost prop — two meditation-circle marker posts on
// verified grassground at the bluff clearing's approach; the
// circle itself is design dressing, no stones invented beyond
// the posts. Ground kinds deliberately do NOT end in 'floor'
// (the desire-path audit keys its street tier on that suffix;
// grounds must never masquerade as street); the cave/path
// floor kinds DO end in 'floor' exactly as cavefloor/
// coronetfloor do, keeping their audit classification.
// Indices 1422-1431 per the program plan
// (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// takes 1402-1421 on its parallel branch); 1111 and every
// earlier documented gap stay empty. Kind names verified
// unclaimed against origin/main.
export const W17W_KIND_DEFS = [
  ['stepsfloor', 'floor'],
  ['stepsrock', 'wall'],
  ['spinefloor', 'floor'],
  ['spinerock', 'wall'],
  ['zenithfloor', 'floor'],
  ['zenithrock', 'wall'],
  ['lotusturf', 'floor'],
  ['lotusfloor', 'floor'],
  ['lotuspine', 'wall'],
  ['lotuspost', 'prop'],
];
export const W17W_KIND_CHARS = {};
W17W_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1422 + i);
  W17W_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17W_PROP_KINDS = W17W_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17W_WALL_KINDS = W17W_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17W_FLOOR_KINDS = W17W_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-X (Borea Tranche 4 — Inglenook's roads: the tower
// road, the ranch, the fog, the marsh descent): Route 209
// takes the Tower Road register — towerturf (suffix-free
// ground, muted sage with petal-drift flecks), bellfloor
// (the path tier, *floor per checklist point 3), bellpine
// (wall class, as every route tree) and the pilgrimpost prop
// (two pilgrim marker posts where the flower drifts bank the
// fence); the Forsaken Tower's footprint stands on the map
// as shipped dressing, byte-preserved entire. Route 210
// takes the Ranch Road register — ranchturf (the tranche's
// deepest green, hay-gold flecks), ranchfloor, ranchpine and
// the paddockpost prop (two paddock posts flanking the north
// fence, the herd's fence). Route 210 — North takes the Fog
// Road register — fogturf (grey-green murk), fogfloor
// (luminous pale sand; the appearing-and-vanishing is the
// map's permanent fog weather field, not the kind), fogpine
// (frosted crown drawn in the tree) and the waybell prop
// (two bell frames at the fog road's mouths — walk by ear).
// Route 212 — North takes the Drowning Road register —
// poolturf (wet-edge flecks), poolfloor, poolwillow (the
// fleet's second willow, split from Maris's fordwillow by
// register: bog pools vs river ford) and the reedpost prop
// (two reed posts where the path gives up). Route 212 —
// South takes the Bog Road register — bogturf (olive, reed
// flecks), bogfloor (the dry-line sand; the design's
// full-length boardwalk is painting dressing — no boardwalk
// kind ships on this map, per the program plan), bogpine
// and the lilypost prop (two lily-pad posts at the loudest
// pools); the shipped bog biome (marshbog/marshreed) stands
// byte-preserved by spec (Ruling #3). Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit
// keys its street tier on that suffix; grounds must never
// masquerade as street); the path kinds DO end in 'floor'.
// Indices 1432-1451 per the program plan
// (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// 1402-1421, W17-W takes 1422-1431 on its parallel branch);
// 1111 and every earlier documented gap stay empty. Kind
// names verified unclaimed against origin/main.
export const W17X_KIND_DEFS = [
  ['towerturf', 'floor'],
  ['bellfloor', 'floor'],
  ['bellpine', 'wall'],
  ['pilgrimpost', 'prop'],
  ['ranchturf', 'floor'],
  ['ranchfloor', 'floor'],
  ['ranchpine', 'wall'],
  ['paddockpost', 'prop'],
  ['fogturf', 'floor'],
  ['fogfloor', 'floor'],
  ['fogpine', 'wall'],
  ['waybell', 'prop'],
  ['poolturf', 'floor'],
  ['poolfloor', 'floor'],
  ['poolwillow', 'wall'],
  ['reedpost', 'prop'],
  ['bogturf', 'floor'],
  ['bogfloor', 'floor'],
  ['bogpine', 'wall'],
  ['lilypost', 'prop'],
];
export const W17X_KIND_CHARS = {};
W17X_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1432 + i);
  W17X_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17X_PROP_KINDS = W17X_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17X_WALL_KINDS = W17X_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17X_FLOOR_KINDS = W17X_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-Y (Borea Tranche 5 — the Gallant lakefront:
// Fenland to the lake to the Vernal lane): Route 213 takes
// the Lakefront Approach register — saltturf (suffix-free
// ground, dry olive-khaki with pale salt-crust flecks),
// saltfloor (the path tier, *floor per checklist point 3),
// saltpine (wall class, as every route tree) and the
// rackpost prop (two painted-boat rack posts flanking the
// shore water); shore water 18, flower 14, signpost 3 and
// fence 2 stand byte-preserved. Lake Gallant takes its own
// register — gallantturf (bright tended lakefront green,
// embankment flecks), gallantfloor, gallantelm (broad
// lakefront elm) and the lightpost prop (two shore-light
// posts at the lake's north corners — the lake's own
// lights, split from the shipped lanternpost dressing kind
// by register, per the program plan); the lake (water 78),
// rock 26 and the two `L` cavern-mouth warp cells stand
// byte-preserved. Gallant Cavern builds by the cave method
// — keepfloor (warm dressed shore-stone flags) takes
// cavefloor, keepwall (dressed shore stone) takes cavewall;
// pool water 15, caveboulder 3 and cavecrystal 2 stand
// byte-preserved; no props (cave discipline). Route 214
// takes the Meadow Road register — vergeturf (fresh
// yellow-green meadow), vergefloor, vergepine and the
// meteorpost prop (two fallen-shard posts flanking the
// Shardfall road at the north end, where the design's
// crater field begins beyond the fence); lake-shore water
// 15, fence 6 and signpost 4 stand byte-preserved. The
// Vernal Path takes the Vernal Lane register — bloomturf
// (soft olive lane turf, petal flecks), vernalfloor (the
// hushed lane's pale sand; renamed in-plan — the draft
// bloomfloor is a shipped kind), bloomelm (blossom-flecked
// lane elm) and the petalpost prop (two petal-drift posts
// along the banks); the shipped flower banks (flower 16)
// and tall grass (62) stand byte-preserved and the ground
// converts around them (the Maris R117 discipline).
// Ground kinds deliberately do NOT end in 'floor' (the
// desire-path audit keys its street tier on that suffix;
// grounds must never masquerade as street); the path kinds
// DO end in 'floor'. Indices 1452-1469 per the program
// plan (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// 1402-1421, W17-W 1422-1431, W17-X takes 1432-1451 on its
// parallel branch); 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against
// origin/main.
export const W17Y_KIND_DEFS = [
  ['saltturf', 'floor'],
  ['saltfloor', 'floor'],
  ['saltpine', 'wall'],
  ['rackpost', 'prop'],
  ['gallantturf', 'floor'],
  ['gallantfloor', 'floor'],
  ['gallantelm', 'wall'],
  ['lightpost', 'prop'],
  ['keepfloor', 'floor'],
  ['keepwall', 'wall'],
  ['vergeturf', 'floor'],
  ['vergefloor', 'floor'],
  ['vergepine', 'wall'],
  ['meteorpost', 'prop'],
  ['bloomturf', 'floor'],
  ['vernalfloor', 'floor'],
  ['bloomelm', 'wall'],
  ['petalpost', 'prop'],
];
export const W17Y_KIND_CHARS = {};
W17Y_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1452 + i);
  W17Y_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17Y_PROP_KINDS = W17Y_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17Y_WALL_KINDS = W17Y_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17Y_FLOOR_KINDS = W17Y_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-Z (Borea Tranche 6 — the winter tranche: the
// spring, the meteor road, the snow climb): Farewell Spring
// takes its own register — fareturf (suffix-free ground,
// spring-meadow turf with still flecks), farefloor (the
// path tier, *floor per checklist point 3 — the design's
// three paved S-bends drawn in the kind's tread), farepine
// (wall class, as every route tree) and the poolpost prop
// (two still-pool marker posts flanking the spring pool on
// verified grassground cells); the spring pool (water 36),
// the shipped flowerfield dressing (16) and the two `L`
// Reversal mouths stand byte-preserved entire. Route 215
// takes the Shardfall Road register — puddleturf (rain-slick
// turf, puddle-polish flecks), puddlefloor, puddlepine and
// the shardpost prop (two fallen-shard posts flanking the
// Shardfall road's north mouth, where the shards rise);
// weather stays clear (the rain is a story biome in the
// design, not a weather field — no rain register invented).
// THE SNOW METHOD (the program plan's Tranche-6 charter,
// Ruling #1): Borea's snow country ships frostfloor as its
// regional ground; each snow map converts frostfloor to its
// OWN snow ground kind, generic path to its own path, tree
// to its own tree — while icefloor and icepool (the mechanic
// surfaces) and icewall (the shared wall dressing) stand
// byte-identical entire, census-proven. Route 216 takes the
// Snow Bridge register — packturf (packed-snow ground,
// bridge-white, wind-scoured flecks and streaks drawn in the
// kind, split from Route 217's whiteturf by texture: scoured
// pack vs smooth bench snow), bridgefloor (the causeway's
// paved run — packed snow becoming stone bridge, the
// design's stone bridge over the chasm drawn in the kind's
// own art, art layer only), bridgepine (snow pine at the
// road's edges, heavy snow load) and the driftpost prop (two
// drift markers on verified frostfloor cells where the
// drifts carve into waves); icefloor 47 + icewall 25 stand
// byte-preserved. Route 217 takes the Long White Road
// register — whiteturf (long-road snow ground, bench-pale,
// unbroken value), whitefloor (the lakeside path's packed
// sand-snow), whitepine (bench snow pine) and the gearpost
// prop (two climbing-gear marker posts on verified
// frostfloor cells below the climb face — the design's
// picks, ropes and pitons sleeping along the path);
// icefloor 44, icewall 25, the climbwall 7 gate tiles
// (mechanic — the climb face's holds are gate data, never
// converted) and the frozen lake's shore water 15 stand
// byte-preserved. Lake Insight takes the frozen-lake
// register — calmturf (frozen-shore snow turf, honest-white
// flecks, the brightest of the three snow grounds, split
// from Route 217's whiteturf by temperature: lake-calm
// green-white vs bench blue-white), calmfloor (the shore
// path's packed sand-snow), calmpine (bank snow pine — the
// design's SNOWFIR stand in tree register) and the
// wardenpost prop (two warden's marker posts on verified
// frostfloor cells flanking the frozen lake at the
// honest-ice crossing's shore); icepool 78 (the frozen lake
// surface — the warden's footprint tracks cross it in the
// design, drawn on the preserved surface's own art register;
// the cells do not move), icefloor 34, icewall 24, open
// water 18 and the two `L` cavern-mouth warp cells stand
// byte-preserved. Insight Cavern takes the Glint Deep
// register by the adapted cave method (the Scorch Path
// adaptation): glintfloor converts the frostfloor register
// on this map only (frost cavern floor, icicle-glint flecks)
// and glintwall converts the icewall register on this map
// only, where it is the wall — a shipped kind converts where
// it is the wall; the mouth register (cavefloor 12), water 9,
// cavecrystal 3, icecrystal 1, frostrock 1, starrock 1,
// iceboulder 1 and lanternpost 1 stand byte-preserved. Twin
// to Gallant Cavern (W17-Y, warm dressed stone): Insight's
// cavern is frost and glint — the two lakes' caverns must
// not read as twins. Ground kinds deliberately do NOT end
// in 'floor' (the desire-path audit keys its street tier on
// that suffix; grounds must never masquerade as street); the
// path kinds DO end in 'floor'. Snow grounds are graded in
// their own renders: pale, cold, unbroken — a snow ground
// reading as grey-brown mud fails (the tg2 lesson, winter
// form). Indices 1470-1491 per the program plan
// (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// 1402-1421, W17-W 1422-1431, W17-X 1432-1451; W17-Y takes
// 1452-1469 on its parallel branch); 1111 and every earlier
// documented gap stay empty. Kind names verified unclaimed
// against origin/main.
export const W17Z_KIND_DEFS = [
  ['fareturf', 'floor'],
  ['farefloor', 'floor'],
  ['farepine', 'wall'],
  ['poolpost', 'prop'],
  ['puddleturf', 'floor'],
  ['puddlefloor', 'floor'],
  ['puddlepine', 'wall'],
  ['shardpost', 'prop'],
  ['packturf', 'floor'],
  ['bridgefloor', 'floor'],
  ['bridgepine', 'wall'],
  ['driftpost', 'prop'],
  ['whiteturf', 'floor'],
  ['whitefloor', 'floor'],
  ['whitepine', 'wall'],
  ['gearpost', 'prop'],
  ['calmturf', 'floor'],
  ['calmfloor', 'floor'],
  ['calmpine', 'wall'],
  ['wardenpost', 'prop'],
  ['glintfloor', 'floor'],
  ['glintwall', 'wall'],
];
export const W17Z_KIND_CHARS = {};
W17Z_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1470 + i);
  W17Z_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17Z_PROP_KINDS = W17Z_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17Z_WALL_KINDS = W17Z_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17Z_FLOOR_KINDS = W17Z_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-AA (Borea Tranche 7 — the beach road, the
// causeway, the south sea): Route 222 takes the Brightshore
// Beach Road register — solarturf (suffix-free ground,
// beach-road turf with glint flecks), solarfloor (the path
// tier, *floor per checklist point 3 — the straight beach
// road's pale sand), solarpine (wall class, as every route
// tree) and the panelpost prop (two tilted solar-panel posts
// flanking the road on verified grassground cells — the
// design's signature, standing as posts with panel heads
// drawn in the prop art); beach water 18, flower 12, rock 5,
// fence 2 and signpost 1 stand byte-preserved. Route 218
// takes the Bridgeport Causeway register by THE CAUSEWAY
// METHOD (the program plan's Tranche-7 charter, Ruling #4 —
// the one deliberate deviation from the Maris boardwalk
// preservation, Director-approved at plan review): the
// causeway ships boardwalk as its ENTIRE path (52 cells)
// with water on both sides and no land register at all, so
// boardwalk converts to causefloor (lamp-lit plank floor —
// long plank joints, the design's lamps drawn in the kind's
// own art, art layer only), the shore-end trees to causepine
// and the footing rocks to causerock; NO ground register
// ships on this map — recorded, not invented; water 327 and
// coral 3 stand byte-preserved, weather stays rain (the
// map's own field). Route 219 takes the South Sea Road
// register — brightsand (bright turquoise-shallows sand,
// gold flecks) and brightrock (jetty-foot rock); Route 220
// takes the Long Sea register — longsand (open-sea sand
// flecks, sparse) and longrock (swell-shadow rock); both
// lanes' water (365/347), current cells (11/6 — MECHANIC
// DATA, byte-identical counts and positions) and kelpbed /
// uwcoral / coral / kelp dressing stand byte-preserved
// entire, and the lanes' low convertible counts (seasand
// 18+9, rock 11+11) are the pre-recorded R40-class
// spec-presence exception — declared, never fixed by paving
// water (Ruling #5). Route 221 takes the Pal Coast register
// — tideturf (tide-pool coast turf, bog-creep flecks toward
// the north end), tidefloor (the coast path's pale sand),
// tidepine and the ringpost prop (two tide-ring marker posts
// on verified grassground cells at the rock-ringed pools);
// shore water 18, flower 19, rock 4 and fence 3 stand
// byte-preserved. Ground kinds deliberately do NOT end in
// 'floor' (the desire-path audit keys its street tier on
// that suffix; grounds must never masquerade as street); the
// path kinds DO end in 'floor'. Sea-lane sand kinds carry
// the 'floor' class as every Maris lane sand before them
// (swapped 1:1 from the walkable seasand char). Indices
// 1492-1506 per the program plan
// (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// 1402-1421, W17-W 1422-1431, W17-X 1432-1451, W17-Y
// 1452-1469; W17-Z takes 1470-1491 on its parallel branch);
// 1111 and every earlier documented gap stay empty. Kind
// names verified unclaimed against origin/main.
export const W17AA_KIND_DEFS = [
  ['solarturf', 'floor'],
  ['solarfloor', 'floor'],
  ['solarpine', 'wall'],
  ['panelpost', 'prop'],
  ['causefloor', 'floor'],
  ['causepine', 'wall'],
  ['causerock', 'wall'],
  ['brightsand', 'floor'],
  ['brightrock', 'wall'],
  ['longsand', 'floor'],
  ['longrock', 'wall'],
  ['tideturf', 'floor'],
  ['tidefloor', 'floor'],
  ['tidepine', 'wall'],
  ['ringpost', 'prop'],
];
export const W17AA_KIND_CHARS = {};
W17AA_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1492 + i);
  W17AA_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17AA_PROP_KINDS = W17AA_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17AA_WALL_KINDS = W17AA_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17AA_FLOOR_KINDS = W17AA_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-AB (Borea Tranche 8 — the League sea road, the
// stone coast, the Foamline, the hard road): Route 223 takes
// the League Sea Road register — leaguesand (deep-lane sand,
// cliff-shadow flecks) and leaguerock (cliff-foot rock,
// vertical joint drawing); the lane's water 366, current 8
// (MECHANIC DATA, byte-identical counts and positions),
// kelpbed 22, coral 9, kelp 7 and uwcoral 5 stand
// byte-preserved entire, and the lane's low convertible
// count (seasand 8 + rock 6) is the pre-recorded R40-class
// spec-presence exception — declared, never fixed by paving
// water (Ruling #5). Summit Road (victory-road) is EXCLUDED
// from this program — its side of the r223 warp pair is not
// edited. Route 224 takes the Stone Coast register —
// headturf (suffix-free ground, stone-coast turf with flower
// flecks), headfloor (the path tier, *floor per checklist
// point 3 — the champion's road pale sand), headpine (wall
// class, as every route tree) and the headpost prop (two
// headstone marker posts on verified grassground cells —
// the design's white stones standing in the prop register);
// encounter grass 45, flower 17, shore water 15, rock 4,
// signpost 4 and fence 3 stand byte-preserved. Foamline Path
// takes its own register by THE CAUSEWAY METHOD (Ruling #4,
// second use after Route 218): boardwalk converts entire to
// foamfloor (foam-flecked plank floor — bright joints, foam
// flecks drawn in the kind's own art), the shore-end trees
// to foampine and the footing rocks to foamrock; NO ground
// register ships on this map — recorded, not invented;
// water 332 stands byte-preserved, and flower-paradise's
// side of the east warp pair is not edited (out of
// program). Route 225 takes the Hard Road register —
// scorchturf (suffix-free ground, scorched hardpan turf
// with crater-dust flecks), zonefloor (the hard road's worn
// sand), zonepine (wall class — a tough sparse crown that
// still reads as a tree) and the zonepost prop (two
// training-ground marker posts on verified grassground
// cells); encounter grass 46, flower 21, pond water 15,
// rock 6 and signpost 2 stand byte-preserved. Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit
// keys its street tier on that suffix; grounds must never
// masquerade as street); the path kinds DO end in 'floor'.
// Sea-lane sand kinds carry the 'floor' class as every
// Maris lane sand before them (swapped 1:1 from the
// walkable seasand char). Indices 1507-1519 per the program
// plan (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md): the Borea
// allocation runs 1384-1535 (W17-U took 1384-1401, W17-V
// 1402-1421, W17-W 1422-1431, W17-X 1432-1451, W17-Y
// 1452-1469, W17-Z 1470-1491; W17-AA takes 1492-1506 on its
// parallel branch); 1111 and every earlier documented gap
// stay empty. Kind names verified unclaimed against
// origin/main.
export const W17AB_KIND_DEFS = [
  ['leaguesand', 'floor'],
  ['leaguerock', 'wall'],
  ['headturf', 'floor'],
  ['headfloor', 'floor'],
  ['headpine', 'wall'],
  ['headpost', 'prop'],
  ['foamfloor', 'floor'],
  ['foampine', 'wall'],
  ['foamrock', 'wall'],
  ['scorchturf', 'floor'],
  ['zonefloor', 'floor'],
  ['zonepine', 'wall'],
  ['zonepost', 'prop'],
];
export const W17AB_KIND_CHARS = {};
W17AB_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1507 + i);
  W17AB_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17AB_PROP_KINDS = W17AB_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17AB_WALL_KINDS = W17AB_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17AB_FLOOR_KINDS = W17AB_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-AC (Borea Tranche 9 — the island circuit home,
// the Borea finale): Route 226 takes the East Coast Road
// register — eastturf (suffix-free ground, cliff-coast turf
// with sea-spray flecks), eastfloor (the path tier, *floor
// per checklist point 3 — the coast road's pale sand),
// eastpine (wall class, as every route tree) and the
// timberpost prop (two timber-works posts on verified
// grassground cells at the pond's water edge — the design's
// DAMBEAVER works standing in the prop register; the
// design's cliff wall is the map's west water edge itself,
// dressing, nothing built); cliff water 30, encounter grass
// 56, flower 17, fence 3, rock 2 and signpost 1 stand
// byte-preserved. Route 227 takes the Stark Road register —
// starkturf (hot grass under ash, grey creep at the edges),
// starkfloor (the ash road's pale sand), starkpine
// (ash-dusted pine) and the flowpost prop (two cooled-flow
// marker posts on verified grassground cells at the ash
// field's edge — the design's glass ribbons are dressing
// over byte-preserved cells, the posts mark where you do
// not step); ASH DISCIPLINE (Ruling #3, the Maris R113
// precedent in its second region): the shipped ashground
// 28 cells stand byte-identical entire — the kit builds
// AROUND the ash, starkturf converts the generic grass
// register only; encounter grass 44, flower 16, water 15,
// signpost 2, fence 2, rock 1 and Ash Walker Bryn's post
// stand byte-preserved, weather stays ash (the map's own
// field). Split from its twin Route 225 by register entire:
// ash-grey creep on hot grass here, rust-ochre scorched
// hardpan there. Route 228 takes the Sand Country register
// — washturf (dry-wash green, dust flecks — the green
// island the washes wander onto), washfloor (the wash
// road's worn sand), washthorn (cactus-patch thorn tree —
// the design's SCARECACT patch standing in the tree
// register, honest sparse crown) and the stormpost prop
// (two storm-fence marker posts on verified grassground
// cells flanking the road where it gives out into the
// sand); DESERT DISCIPLINE (Ruling #3, the Maris desertsand
// precedent: the sand IS the route's identity): the shipped
// sand family stands byte-identical entire — sand 122 +
// beach-n 13, psand-w 8, psand-e 7, beach-e 6, beach-w 6,
// beach-nsw 2, beach-nse 1, beach-ne 1 + sandcolumn 2 = 168
// cells measured; the storm fence 23, encounter grass 32,
// flower 8, rock 3 and Sand Herder Vey's post stand
// byte-preserved; the map's only warp pair (S to Palmside)
// is untouched and the design's storm-shelter cabin has no
// backend record — omitted, not invented. Route 229 takes
// the South Water register — loopsand (loop-lane sand,
// offshore flecks) and looprock (headland rock); Route 230
// takes the West Coast Water register — palmsand
// (palm-shore sand, warm flecks) and palmrock (harbour-point
// rock); both lanes' water (375/360), current cells (14/10
// — MECHANIC DATA, byte-identical counts and positions) and
// kelpbed / uwcoral / coral / kelp dressing stand
// byte-preserved entire, and the lanes' low convertible
// counts (seasand 5+5, rock 7+11, measured by census — the
// plan's figures; R229 is the thinnest lane in the program)
// are the pre-recorded R40-class spec-presence exception —
// declared, never fixed by paving water (Ruling #5). The
// design's LUMIVEIL runway on R230 is creature layer over
// byte-preserved water — nothing planted. Ground kinds
// deliberately do NOT end in 'floor' (the desire-path audit
// keys its street tier on that suffix; grounds must never
// masquerade as street); the path kinds DO end in 'floor'.
// Sea-lane sand kinds carry the 'floor' class as every Maris
// lane sand before them (swapped 1:1 from the walkable
// seasand char). Indices 1520-1535 per the program plan
// (WAVE-W17-BOREA-ROUTE-PROGRAM-PLAN.md) — the program's
// last: the Borea allocation runs 1384-1535 (W17-U took
// 1384-1401, W17-V 1402-1421, W17-W 1422-1431, W17-X
// 1432-1451, W17-Y 1452-1469, W17-Z 1470-1491 and W17-AA
// 1492-1506 on their parallel branches; W17-AB takes
// 1507-1519 on its own); 1111 and every earlier documented
// gap stay empty. Kind names verified unclaimed against
// origin/main.
export const W17AC_KIND_DEFS = [
  ['eastturf', 'floor'],
  ['eastfloor', 'floor'],
  ['eastpine', 'wall'],
  ['timberpost', 'prop'],
  ['starkturf', 'floor'],
  ['starkfloor', 'floor'],
  ['starkpine', 'wall'],
  ['flowpost', 'prop'],
  ['washturf', 'floor'],
  ['washfloor', 'floor'],
  ['washthorn', 'wall'],
  ['stormpost', 'prop'],
  ['loopsand', 'floor'],
  ['looprock', 'wall'],
  ['palmsand', 'floor'],
  ['palmrock', 'wall'],
];
export const W17AC_KIND_CHARS = {};
W17AC_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1520 + i);
  W17AC_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17AC_PROP_KINDS = W17AC_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17AC_WALL_KINDS = W17AC_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17AC_FLOOR_KINDS = W17AC_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W17-AD (Route Build Program — THE AMBER SEA LANES,
// the program finale): all four lanes are defined once in
// maps5.mjs (no dual copies, no registry re-pins). All four
// are SEA LANES with NO recorded backstory — dressing only,
// nothing invented: sand -> own lane sand, rock -> own lane
// rock ONLY (the R40/R41 discipline); every water cell and
// warp pair stands byte-preserved, and the census proves
// ZERO current cells, ZERO 'L' mouths, ZERO mechanic cells,
// ZERO signs/NPCs/trainers/items/events on any lane; the
// land encounter table is EMPTY and the 8-species surf table
// is byte-identical across the four and byte-preserved.
// Amber Sea — West "First Ferry Water" (1536-1537): wakesand
// a warm gold-green shallows sand carrying the ferry wake as
// pale streak flecks, wakerock a low rounded wake-washed
// boulder; water 435 + coral 10 byte-preserved entire.
// Amber Sea — Central "The Crossing Heart" (1538-1539):
// gardensand a bright garden sand with coral-pink flecks,
// gardenrock a taller bright-faced garden boulder; water
// 434 + coral 11 byte-preserved entire; the only four-way
// lane (four warp pairs). Amber Sea — East "Resort Water"
// (1540-1541): resortsand the fleet's brightest warm harbour
// sand, shell-flecked, resortrock a clean pale worked-face
// boulder; water 435 + coral 10 byte-preserved entire.
// Amber Sea — North "Pilgrim Water" (1542-1543): shrinesand
// the fleet's darkest sand value (deep-channel olive-brown,
// sparse flecks), shrinerock a deep-shadow boulder with a
// lantern-warm glint at its top register (art layer only);
// water 433 + coral 11 byte-preserved entire; the only
// two-pair lane. DIRECTOR RULING #1 (islet variance): the
// three sand islets + palms stood at byte-identical
// coordinates on all four lanes (one shared template) — each
// lane's clusters are repositioned as units (translate /
// vertical flip) under strict parity: per-lane cell-class
// counts identical, warp cells untouched (all stand on
// water), surf tables byte-identical, per-lane dead pockets
// proven identical (25/lane, the islet cells themselves);
// any lane whose pockets would move would have kept the
// template — none did. DIRECTOR RULING #2: the islet
// dressing register (palm 4, tropgrass 3, grass 1, tree 1,
// flower 1 per lane — the archipelago's shared shore
// register) stands byte-preserved entire; only sand + rock
// convert. Twin pairs: West <-> Central (the warm coral
// pair — gold-green wake water vs garden-bright still
// water) and East <-> North (the far-shore pair — the
// brightest resort shallows vs the deep quiet channel).
// Sand kinds are 'floor' class (the shipped sand char was
// walkable; the swaps are 1:1), rock kinds 'wall' class
// (never walkable). Spec-presence is the pre-recorded
// R40-class thin-lane exception (sand 20 + rock 5-6 per
// lane), declared at plan time, never fixed by paving
// water. Indices 1536-1543 per the program plan
// (WAVE-W17-AD-AMBER-LANES-PLAN.md) — THE ROUTE BUILD
// PROGRAM CLOSES at 451 kinds over 1092-1543 (Arden
// 1092-1167, Yamato 1168-1256, Maris 1257-1383, Borea
// 1384-1535, Amber 1536-1543); 1111 and every earlier
// documented gap stay empty. Kind names verified unclaimed
// against origin/main. Chars U+1E00+1536..
export const W17AD_KIND_DEFS = [
  ['wakesand', 'floor'],
  ['wakerock', 'wall'],
  ['gardensand', 'floor'],
  ['gardenrock', 'wall'],
  ['resortsand', 'floor'],
  ['resortrock', 'wall'],
  ['shrinesand', 'floor'],
  ['shrinerock', 'wall'],
];
export const W17AD_KIND_CHARS = {};
W17AD_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1536 + i);
  W17AD_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W17AD_PROP_KINDS = W17AD_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W17AD_WALL_KINDS = W17AD_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W17AD_FLOOR_KINDS = W17AD_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W15-T1 (Kit-Height Landmarks, Arden pair): the two Arden
// landmarks the approved designs promise TALL but the tile builds
// rendered at 32px — Hushmoor Tower (lavender) and the Vantage Co.
// HQ (saffron). New 16x48 cap kinds swap onto each landmark's
// EXISTING roof/top row only, bottom-anchored per Premium+ W6 TX-3
// (overworld.mjs blit: y*T - max(0, h-T)); the 16x16 shaft kinds
// replace the borrowed generic wall (wall-gym / wall-lab) on each
// landmark's non-door wall row. All eight kinds are 'wall' class,
// never in WALKABLE; doors, warps, posts and ground are untouched
// (Hushmoor's door-gym pair stays — warp-coupled, plan §6(d)).
// Dual-defined towns: maps2 + maps3 copies edited identically,
// registry fingerprints re-pinned in the same commit. Indices
// 1544-1551 per WAVE-W15-LANDMARKS-PLAN.md (the route program
// closed at 1543; 1111 stays empty). Chars U+1E00+1544..
export const W15T1_KIND_DEFS = [
  ['hushtowercap-l', 'wall'],
  ['hushtowercap-c', 'wall'],
  ['hushtowercap-r', 'wall'],
  ['hushtowershaft', 'wall'],
  ['vantcap-l', 'wall'],
  ['vantcap-c', 'wall'],
  ['vantcap-r', 'wall'],
  ['vantshaft', 'wall'],
];
export const W15T1_KIND_CHARS = {};
W15T1_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1544 + i);
  W15T1_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W15T1_PROP_KINDS = W15T1_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W15T1_WALL_KINDS = W15T1_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W15T1_FLOOR_KINDS = W15T1_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W15-T2 (Kit-Height Landmarks — Yamato towers): the two
// standing Yamato towers rendered at house height (32px) while
// ordinary houses render ~64px on 16x48 th- art. Each landmark
// gets its own 16x48 cap kinds (Premium+ W6 TX-3 bottom-anchored
// tall art) swapped onto its EXISTING roof row only — doors,
// warps, posts, ground: zero cells touched; the caps are 'wall'
// class and never enter WALKABLE, so placement gates and dead
// pockets cannot move. Newleaf Tower (Iris, idx 1552-1554):
// wooden pagoda tiers in violet slate, the single great pillar
// reading as a post colonnade through the wall bands, lit
// lanterns — drawn in Iris's own register, no other town's kit.
// Chime Tower (Lantern, idx 1556-1558): cedar tiers in Lantern
// City's own cedar register, an open bell chamber with a brass
// bell in each centre tile, the landmark red band on the flanks.
// (Idx 1555 is W15-T3's radiomast-tall claim; the Ashen Tower
// stays a ruin by design — W15 plan §1.6.) Chars U+1E00+1552..
export const W15NL_KIND_DEFS = [
  ['newleafcap-l', 'wall'],
  ['newleafcap-c', 'wall'],
  ['newleafcap-r', 'wall'],
];
export const W15NL_KIND_CHARS = {};
W15NL_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1552 + i);
  W15NL_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W15NL_PROP_KINDS = W15NL_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W15NL_WALL_KINDS = W15NL_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W15NL_FLOOR_KINDS = W15NL_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
export const W15CH_KIND_DEFS = [
  ['chimecap-l', 'wall'],
  ['chimecap-c', 'wall'],
  ['chimecap-r', 'wall'],
];
export const W15CH_KIND_CHARS = {};
W15CH_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1556 + i);
  W15CH_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W15CH_PROP_KINDS = W15CH_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W15CH_WALL_KINDS = W15CH_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W15CH_FLOOR_KINDS = W15CH_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// ---- Wave W15-T3 (the Light Pair): Signal's tall mast + the Gleam
// Lighthouse's tall caps. Indices per WAVE-W15-LANDMARKS-PLAN §2
// (the wave's claims interleave by design: T1 1544-1551, T2
// 1552-1554 + 1556-1558, T3 1555 + 1562-1563, T4 1559-1561).
// 'radiomast-tall' (prop, idx 1555): the Radio Tower's lattice at
// its real height — a 16x48 cross-braced iron mast with side dish
// and red beacon, bottom-anchored (Premium+ W6 TX-3) on the SAME
// compound cell (goldenrod (25,2)) the 16x16 'radiomast' stood on;
// the short kind stays registered for its other cells.
// 'gleamcap-l'/'gleamcap-r' (wall, idx 1562-1563): the Gleam
// Lighthouse's 16x48 lamp-tower caps — olivine stone shaft,
// gallery + wraparound lamp room, harbour-red standing-seam
// skirt — swapped onto the lighthouse's existing roof row only
// (olivine y=2, x=21-24: l,l,r,r, the mirrored pair x2). Doors,
// warps, posts, ground: zero cells touched. Authored art:
// assets/sprites/pix/tiles/tile-prop-radiomast-tall.pix,
// tile-gleamcap-l.pix, tile-gleamcap-r.pix.
export const W15T3_KIND_DEFS = [
  ['radiomast-tall', 'prop'],
  ['gleamcap-l', 'wall'],
  ['gleamcap-r', 'wall'],
];
export const W15T3_KIND_INDEX = { 'radiomast-tall': 1555, 'gleamcap-l': 1562, 'gleamcap-r': 1563 };
export const W15T3_KIND_CHARS = {};
W15T3_KIND_DEFS.forEach(([kind]) => {
  const ch = String.fromCodePoint(0x1E00 + W15T3_KIND_INDEX[kind]);
  W15T3_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W15T3_PROP_KINDS = W15T3_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W15T3_WALL_KINDS = W15T3_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W15T3_FLOOR_KINDS = W15T3_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Wave W15-T4: the Revelry TV tower caps — three 16x48
// bottom-anchored cap kinds (Premium+ W6 TX-3) swapped onto the
// TV station's existing beamroof row in jubilife (maps9) ONLY:
// revtvcap-l (west shoulder pylon, x=15), revtvcap-c (broadcast
// centre — beacon + dish on a mullion mast — worn at x=16 and
// x=17), revtvcap-r (east shoulder pylon, x=18). The building is
// recorded fourfold on main (interior jubilife-tv, the (16,3)
// warp, signs at (24,4) and (2,5)) — the T42 rollout refusal was
// of the earlier unrecorded state and the Director ruled it
// superseded (WAVE-W15-LANDMARKS-PLAN.md §1.7/§6(a)). All three
// are 'wall' class, never in any WALKABLE spread: doors, warps,
// posts, signs and ground are untouched, the swap exchanges
// non-walkable roof cells for non-walkable cap cells. Indices
// 1559-1561 per the W15 plan's per-tranche allocation (T1 claims
// 1544-1551, T2 1552-1558, T3 the mast/lamp pair, T4 1559-1561),
// verified free against origin/main, TILE_CHARS and every map
// row. Authored art: assets/sprites/pix/tiles/
// tile-revtvcap-l.pix, tile-revtvcap-c.pix, tile-revtvcap-r.pix.
export const W15T4_KIND_DEFS = [
  ['revtvcap-l', 'wall'],
  ['revtvcap-c', 'wall'],
  ['revtvcap-r', 'wall'],
];
export const W15T4_KIND_CHARS = {};
W15T4_KIND_DEFS.forEach(([kind], i) => {
  const ch = String.fromCodePoint(0x1E00 + 1559 + i);
  W15T4_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const W15T4_PROP_KINDS = W15T4_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const W15T4_WALL_KINDS = W15T4_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const W15T4_FLOOR_KINDS = W15T4_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
// Gym Identity T1 (Arden): the eight Arden gyms' own floor kinds —
// quarryfloor (Flintridge), lagoonfloor (Tidehaven), deckfloor
// (Arcport), glassfloor (Canopy), astrofloor (Farsight), shadowfloor
// (Bramble), obsidianfloor (Caldera), loamfloor (Fernmere) — indices
// 1564-1571 per WAVE-GYM-IDENTITY-PLAN §8 (next free after W15's
// 1544-1563), verified free against TILE_CHARS and every map row.
// Each is 'floor' class: swapped 1:1 from the walkable '+' gymfloor
// char inside its own gym ONLY, so floor stays floor (the WALKABLE
// spread lands in maps.mjs beside the other waves'). The shared
// 'gymfloor' keeps its other 28 gyms until their tranches land.
// Authored art: assets/sprites/pix/tiles/tile-<kind>.pix, spliced
// into art-data.mjs by entry (generator-faithful, additions-only).
export const GYMID1_KIND_DEFS = [
  ['quarryfloor', 'floor'],
  ['lagoonfloor', 'floor'],
  ['deckfloor', 'floor'],
  ['glassfloor', 'floor'],
  ['astrofloor', 'floor'],
  ['shadowfloor', 'floor'],
  ['obsidianfloor', 'floor'],
  ['loamfloor', 'floor'],
];
export const GYMID1_KIND_INDEX = { quarryfloor: 1564, lagoonfloor: 1565, deckfloor: 1566, glassfloor: 1567, astrofloor: 1568, shadowfloor: 1569, obsidianfloor: 1570, loamfloor: 1571 };
export const GYMID1_KIND_CHARS = {};
GYMID1_KIND_DEFS.forEach(([kind]) => {
  const ch = String.fromCodePoint(0x1E00 + GYMID1_KIND_INDEX[kind]);
  GYMID1_KIND_CHARS[kind] = ch;
  TILE_CHARS[ch] = kind;
});
export const GYMID1_PROP_KINDS = GYMID1_KIND_DEFS.filter(([, c]) => c === 'prop').map(([k]) => k);
export const GYMID1_WALL_KINDS = GYMID1_KIND_DEFS.filter(([, c]) => c === 'wall').map(([k]) => k);
export const GYMID1_FLOOR_KINDS = GYMID1_KIND_DEFS.filter(([, c]) => c === 'floor').map(([k]) => k);
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
