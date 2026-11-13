// kitacc-data.mjs — Wave F (owner order 2026-11-12): ORIGINAL accessory
// overlays for the kit cast system. Every overworld NPC renders from
// the one Gassasin kit character (CC-BY, docs/THIRD-PARTY-ART.md);
// these overlays — original art drawn for this project in the kit's
// palette/outline family — carry class/character identity on top.
// Hand-authored sparse rows on the 16x32 overworld canvas, grouped by
// shape (one palette per shape); materializeArt() expands them and
// resolves each left entry as the mirror of its right entry. Semantic
// chars (S/H/h/J/j/P) resolve through the wearer's variant swap at
// raster time; C/c/X are per-accessory slots the cast spec fills.
// Every entry <= 16 colors (art-gate census, section d).
const SHAPES = {
  // cap: dome + brim, emblem slot X (officer badge, healer cross)
  cap: { pal: { O: '#241a20', C: '#3a5a9a', c: '#2a406a', X: '#e8c832' },
    down: { 16: '.....OCXXCO.....', 17: '....OCCXXCCO....', 18: '....OCCCCCCO....', 19: '...OccccccccO...' },
    up: { 16: '.....OCCCCO.....', 17: '....OCCCCCCO....', 18: '....OCCCCCCO....', 19: '....OccccccO....' },
    right: { 16: '.....OCCCCO.....', 17: '....OCCCCCCCO...', 18: '....OCCCCCCCO...', 19: '....Oc..OccccO..' } },
  // wide-brim hat: fisher / ranger / hiker / lady (ribbon slot X)
  'hat-wide': { pal: { O: '#241a20', C: '#b8a05a', c: '#8a7640', X: '#c05a7a' },
    down: { 15: '.....OCCCCO.....', 16: '....OCCCCCCO....', 17: '....OCcXXcCO....', 18: '..OCCCCCCCCCCO..', 19: '..OccccccccccO..' },
    up: 'down', right: 'down' },
  // top hat: gent
  'hat-top': { pal: { O: '#241a20', C: '#2a2a33', c: '#101014' },
    down: { 11: '.....OCCCCO.....', 12: '.....OCCCCO.....', 13: '.....OCCCCO.....', 14: '.....OCCCCO.....', 15: '.....OccccO.....', 16: '...OCCCCCCCCO...' },
    up: 'down', right: 'down' },
  // fedora: giovanni
  'hat-fedora': { pal: { O: '#241a20', C: '#3a3230', c: '#241e1c' },
    down: { 13: '.....OCCCCO.....', 14: '.....OCccCO.....', 15: '.....OCCCCO.....', 16: '..OCCCCCCCCCCO..' },
    up: { 13: '.....OCCCCO.....', 14: '.....OCCCCO.....', 15: '.....OccccO.....', 16: '..OCCCCCCCCCCO..' },
    right: 'up' },
  // hard hat: worker
  'hat-hard': { pal: { O: '#241a20', C: '#e8c832', c: '#b8931f' },
    down: { 15: '.....OCCCCO.....', 16: '....OCCCCCCO....', 17: '....OCCCCCCO....', 18: '...OCCCCCCCCO...', 19: '...OccccccccO...' },
    up: 'down',
    right: { 15: '.....OCCCCO.....', 16: '....OCCCCCCCO...', 17: '....OCCCCCCCO...', 18: '...OCCCCCCCCO...', 19: '...OccccccccO...' } },
  // glasses: scientist / professor / lorelei / blaine (no back view)
  glasses: { pal: { O: '#241a20', G: '#3a4a5a' },
    down: { 23: '.....OGOOOGO....' },
    right: { 23: '.......OOOGO....' } },
  // apron: mart clerk
  apron: { pal: { O: '#241a20', A: '#efe6d0', a: '#d8cdb2' },
    down: { 24: '......AAAA......', 25: '......OAAO......', 26: '.....OAAAAO.....', 27: '.....OAAAAO.....', 28: '....OaaaaO......' },
    up: { 25: '.....A....A.....', 26: '.......AA.......', 27: '.....A....A.....' },
    right: { 26: '.........OAO....', 27: '.........OAO....', 28: '.........OaO....' } },
  // skirt: dress classes (C = dress color, S = legs, both via swap)
  skirt: { pal: { O: '#241a20', C: '#e08a3a', c: '#b85f22', S: '#f0c8a0' },
    down: { 27: '....OCCCCCCO....', 28: '....OCCCCCCO....', 29: '...OccccccccO...', 30: '....OSSOOSSO....' },
    up: 'down',
    right: { 27: '....OCCCCCO.....', 28: '....OCCCCCO.....', 29: '....OcccccO.....', 30: '.......S........' } },
  // long hair panels (H/h follow the wearer's hair via swap)
  'hair-long': { pal: { H: '#3b2400', h: '#8d5500' },
    down: { 19: '...H........H...', 20: '...Hh......hH...', 21: '...Hh......HH...', 22: '...H........H...', 23: '...H........H...', 24: '...H........H...', 25: '...H........H...', 26: '...h........h...' },
    up: { 23: '...H........H...', 24: '...HH......HH...', 25: '...HH......HH...', 26: '...HH......HH...', 27: '...H........H...' },
    right: { 19: '...H............', 20: '..HH............', 21: '..HH............', 22: '..HH............', 23: '..HH............', 24: '..HH............', 25: '..Hh............', 26: '..Hh............', 27: '...h............' } },
  // side ponytail: misty (tie T)
  'hair-pony': { pal: { H: '#3b2400', h: '#8d5500', T: '#f0e0c8' },
    down: { 17: '...........T....', 18: '............HH..', 19: '............HHH.', 20: '............HHH.', 21: '...........HHH..', 22: '............HH..', 23: '............H...' },
    up: { 22: '.........T......', 23: '........HHH.....', 24: '........HHH.....', 25: '........HHH.....', 26: '.........HH.....', 27: '.........H......' },
    right: { 17: '....T...........', 18: '..HH............', 19: '..HHH...........', 20: '..HHH...........', 21: '..HH............', 22: '..H.............' } },
  // cape: lance / champion
  cape: { pal: { O: '#241a20', C: '#7a1a3a', c: '#4a0f24' },
    down: { 24: '..C..........C..', 25: '..C..........C..', 26: '..CC........CC..', 27: '..CC........CC..', 28: '..CC........CC..', 29: '..Cc........cC..', 30: '..C..........C..' },
    up: { 23: '....OCCCCCCO....', 24: '...OCCCCCCCCO...', 25: '...OCCCCCCCCO...', 26: '..OCCCCCCCCCCO..', 27: '..OCCCCCCCCCCO..', 28: '..OCCCCCCCCCCO..', 29: '..OccccccccccO..', 30: '..CC........CC..' },
    right: { 24: '..CC............', 25: '..CCC...........', 26: '..CCC...........', 27: '..CCC...........', 28: '..CCC...........', 29: '..CcC...........', 30: '..CC............' } },
  // bald crown: elder (S follows the wearer's skin via swap)
  bald: { pal: { S: '#f0c8a0' },
    down: { 16: '......SSSS......', 17: '.....SSSSS......', 18: '......SSS.......' },
    up: { 16: '......SSSS......', 17: '.....SSSSS......', 18: '......SS........' },
    right: { 16: '......SSSS......', 17: '......SSSSS.....', 18: '......S..S......' } },
  // headband: koga / bruno / cole / ace trainer
  headband: { pal: { C: '#3a5a9a', c: '#2a406a' },
    down: { 17: '.....cccccc.....', 18: '.....CCCCCC.....' },
    up: { 17: '.....cccccc.....', 18: '.....CCCCCC.....', 19: '.......cc.......', 20: '.......c........' },
    right: { 18: '.....CCCCCC.....', 19: '....c...........' } },
  // bandana: biker
  bandana: { pal: { O: '#241a20', C: '#7a1a2a', c: '#4a0f18' },
    down: { 16: '.....OCCCCO.....', 17: '....OCCCCCCO....', 18: '....OCccccCO....', 19: '...c........c...' },
    up: { 16: '.....OCCCCO.....', 17: '....OCCCCCCO....', 18: '....OCccccCO....', 19: '.......CC.......', 20: '.......c........' },
    right: { 16: '.....OCCCCO.....', 17: '....OCCCCCCCO...', 18: '....OCccccCCO...', 19: '...c............', 20: '...c............' } },
  // hair bow: twin
  bow: { pal: { O: '#241a20', C: '#e86a8a', c: '#c04a68' },
    down: { 14: '........C.C.....', 15: '........CcC.....', 16: '.........c......' },
    up: { 15: '.......C.C......', 16: '.......CcC......' },
    right: { 14: '....C.C.........', 15: '....CcC.........', 16: '.....c..........' } },
  // twin hair buns (W-CHAR1: lead-hearthome): H/h follow the wearer's
  // hair via swap; buns sit on the head's top corners (rows 13-16).
  'hair-buns': { pal: { H: '#3b2400', h: '#8d5500' },
    down: { 13: '..HHH......HHH..', 14: '..HhH......HhH..', 15: '...HH......HH...', 16: '...H........H...' },
    up: 'down',
    right: { 13: '...HHH..........', 14: '...HhH..........', 15: '....HH..........', 16: '....H...........' } },
  // luchador mask (W-CHAR1: lead-pastoria): hood over hair and head
  // sides, face window left open; C/c the mask cloth, W the trim stripe.
  'mask-lucha': { pal: { O: '#241a20', C: '#3a6ac8', c: '#274a8f', W: '#f4f4f0' },
    down: { 16: '....OCCCCCCO....', 17: '....OCCWWCCO....', 18: '....OCcWWcCO....', 19: '...OCCCWWCCCO...', 20: '...OC......CO...', 21: '...OC......CO...', 22: '....C......C....', 23: '....Cc....cC....' },
    up: { 16: '....OCCCCCCO....', 17: '....OCCWWCCO....', 18: '....OCcWWcCO....', 19: '...OCCCWWCCCO...', 20: '...OCCCCCCCCO...', 21: '...OCCCCCCCCO...', 22: '....OCCCCCCO....', 23: '....OccccccO....' },
    right: { 16: '....OCCCCCO.....', 17: '....OCCCCCCO....', 18: '....OCcCCcCO....', 19: '....OCCCCCCO....', 20: '....OC....CO....', 21: '....OC....CO....', 22: '.....C....C.....', 23: '.....Cc..cC.....' } },
};
export const KITACC = {};
for (const [shape, s] of Object.entries(SHAPES)) {
  for (const dir of ['down', 'up', 'right']) {
    let rows = s[dir];
    if (typeof rows === 'string') rows = s[rows];
    if (rows) KITACC['kitacc-' + shape + '-' + dir] = { pal: s.pal, rows };
  }
  if (s.right) KITACC['kitacc-' + shape + '-left'] = { mirrorOf: 'kitacc-' + shape + '-right' };
}
