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
