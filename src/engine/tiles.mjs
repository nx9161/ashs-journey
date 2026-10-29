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
  // dungeon-interior sets (Tower stone, Silph panel, Plant industrial).
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
// ---- Arc 1.5 Stage O1: Orange Islands kinds ----
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
// ---- Arc 2 Stage J3a: Johto kinds ----
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
// ---- Arc 2 Stage J3a: Johto per-town identity kinds (Premium+ W5
// machinery, extended) ----
// The six west-Johto settlements own the same eight signature kinds as
// the Kanto towns (tg ground / tg2 ground II / tc canopy / td dress /
// tr roof / tl landmark facade / th house-roof / tw house-wall). The
// U+00C0.. Latin-1 blocks are exhausted by the eleven Kanto towns, so
// Johto chars continue the Latin Extended Additional block after the
// J3 kinds: town i owns idx 173+i*8 .. 180+i*8 in the order
// [tg, tg2, tc, td, tr, tl, th, tw]. The art.mjs resolver keys on the
// kind-name prefixes (tg-/tc-/td-/tr-/tl-/th-/tw-), so Johto kinds ride
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
// ---- Arc 3 Stage H3a: Hoenn kinds ----
// Chars continue the block at U+1E00+261 (W6 0..131, W7 132..151, O1
// 152..163, J3 kinds 164..172, Johto towns 173..260). Same class
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
// ---- Arc 3 Stage H3a: Hoenn per-town identity kinds (the W5/J3
// machinery, extended a third time) ----
// The eleven west/central-Hoenn settlements own the same eight
// signature kinds as the Kanto/Johto towns. Chars continue the block
// after the H3 kinds: town i owns idx 268+i*8 .. 275+i*8 in the order
// [tg, tg2, tc, td, tr, tl, th, tw]. The art.mjs resolver keys on the
// kind-name prefixes, so Hoenn kinds ride the shipped W5 paths.
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
// ---- Arc 3 Stage H3b: Hoenn east/water kinds ----
// Chars continue the block at U+1E00+396 (H3a kinds 261..267, Hoenn
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
