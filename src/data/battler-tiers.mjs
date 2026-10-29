// battler-tiers.mjs — Premium+ W8 (SP-1): per-species battler draw-scale
// tier, assigned by BULK in data. This table REPLACES the Wave 0
// uniform-size parity (every battler at 64px): foe and ally read the
// SAME table through speciesBattleArt, so a species is the same size
// on both sides of the field — staged parity, not uniform parity.
//
// Assignment rule (auditable): bulk = base HP + DEF + SPD from the
// species data (the mass proxy the data carries — no height/weight
// fields exist). S (52px) below 160, L (80px) at 245+, M (64px)
// between. Hand overrides, on the record: onix (240 — a 28-ft rock
// serpent reads L whatever its defensive spread says), charizard
// (241 — wingspan frame, the roster's flagship flyer), mew (300 —
// perfect 100s stat spread, but a tiny floating cat; S). A second
// rule rides the table for the SP-2 reframe set only: the PRESENCE
// FLOOR — a reframed species' on-screen ink (fill x tier^2) may not
// fall below its W7 ink (W7 fill x 64^2). Four species needed a
// one-tier bump to hold the floor after reframing (haunter, zubat,
// psyduck, horsea -> M); each is marked in its row.
// Presentation only: draw scale never touches stats, AI, or damage.
export const BATTLER_TIERS = {
  partner: 'S', // bulk 125
  pidgey: 'S', // bulk 115
  rattata: 'S', // bulk 100
  caterpie: 'S', // bulk 100
  weedle: 'S', // bulk 90
  spearow: 'S', // bulk 101
  zubat: 'M', // bulk 115 — SP-2 presence floor override
  geodude: 'M', // bulk 170
  onix: 'L', // bulk 240 — hand override
  bulbasaur: 'S', // bulk 159
  charmander: 'S', // bulk 132
  squirtle: 'M', // bulk 173
  nidoranm: 'S', // bulk 126
  mankey: 'S', // bulk 120
  ivysaur: 'M', // bulk 203
  venusaur: 'L', // bulk 263
  charmeleon: 'M', // bulk 181
  charizard: 'L', // bulk 241 — hand override
  wartortle: 'M', // bulk 219
  blastoise: 'L', // bulk 284
  metapod: 'S', // bulk 130
  butterfree: 'M', // bulk 190
  kakuna: 'S', // bulk 120
  beedrill: 'M', // bulk 185
  pidgeotto: 'M', // bulk 168
  pidgeot: 'M', // bulk 228
  raticate: 'M', // bulk 185
  fearow: 'M', // bulk 191
  ekans: 'S', // bulk 133
  arbok: 'M', // bulk 208
  pikachu: 'S', // bulk 125
  raichu: 'M', // bulk 195
  sandshrew: 'M', // bulk 165
  sandslash: 'M', // bulk 240
  nidoranf: 'S', // bulk 147
  nidorina: 'M', // bulk 192
  nidoqueen: 'L', // bulk 262
  nidorino: 'M', // bulk 173
  nidoking: 'M', // bulk 233
  clefairy: 'M', // bulk 183
  clefable: 'L', // bulk 258
  vulpix: 'S', // bulk 143
  ninetales: 'L', // bulk 248
  jigglypuff: 'M', // bulk 160
  wigglytuff: 'M', // bulk 235
  golbat: 'M', // bulk 220
  oddish: 'M', // bulk 165
  gloom: 'M', // bulk 205
  vileplume: 'L', // bulk 250
  paras: 'S', // bulk 145
  parasect: 'M', // bulk 220
  venonat: 'M', // bulk 165
  venomoth: 'M', // bulk 205
  diglett: 'S', // bulk 80
  dugtrio: 'S', // bulk 155
  meowth: 'S', // bulk 115
  persian: 'M', // bulk 190
  psyduck: 'M', // bulk 148 — SP-2 presence floor override
  golduck: 'M', // bulk 238
  primeape: 'M', // bulk 195
  growlithe: 'S', // bulk 150
  arcanine: 'L', // bulk 250
  poliwag: 'S', // bulk 120
  poliwhirl: 'M', // bulk 180
  poliwrath: 'L', // bulk 275
  abra: 'S', // bulk 95
  kadabra: 'S', // bulk 140
  alakazam: 'M', // bulk 195
  machop: 'S', // bulk 155
  machoke: 'M', // bulk 210
  machamp: 'L', // bulk 255
  bellsprout: 'S', // bulk 115
  weepinbell: 'M', // bulk 160
  victreebel: 'M', // bulk 215
  tentacool: 'M', // bulk 175
  tentacruel: 'L', // bulk 265
  graveler: 'M', // bulk 215
  golem: 'L', // bulk 275
  ponyta: 'M', // bulk 170
  rapidash: 'M', // bulk 215
  slowpoke: 'M', // bulk 195
  slowbro: 'L', // bulk 285
  magnemite: 'S', // bulk 150
  magneton: 'M', // bulk 215
  farfetchd: 'M', // bulk 169
  doduo: 'S', // bulk 115
  dodrio: 'M', // bulk 190
  seel: 'M', // bulk 190
  dewgong: 'L', // bulk 265
  grimer: 'M', // bulk 180
  muk: 'L', // bulk 280
  shellder: 'S', // bulk 155
  cloyster: 'L', // bulk 275
  gastly: 'S', // bulk 95
  haunter: 'M', // bulk 145 — SP-2 presence floor override
  gengar: 'M', // bulk 195
  drowzee: 'M', // bulk 195
  hypno: 'L', // bulk 270
  krabby: 'S', // bulk 145
  kingler: 'M', // bulk 220
  voltorb: 'S', // bulk 145
  electrode: 'M', // bulk 210
  exeggcute: 'M', // bulk 185
  exeggutor: 'L', // bulk 255
  cubone: 'M', // bulk 195
  marowak: 'L', // bulk 250
  hitmonlee: 'M', // bulk 213
  hitmonchan: 'M', // bulk 239
  lickitung: 'M', // bulk 240
  koffing: 'M', // bulk 180
  weezing: 'L', // bulk 255
  rhyhorn: 'M', // bulk 205
  rhydon: 'L', // bulk 270
  chansey: 'L', // bulk 360
  tangela: 'M', // bulk 220
  kangaskhan: 'L', // bulk 265
  horsea: 'M', // bulk 135 — SP-2 presence floor override
  seadra: 'M', // bulk 195
  goldeen: 'S', // bulk 155
  seaking: 'M', // bulk 225
  staryu: 'S', // bulk 140
  starmie: 'M', // bulk 230
  mrmime: 'M', // bulk 225
  scyther: 'M', // bulk 230
  jynx: 'M', // bulk 195
  electabuzz: 'M', // bulk 207
  magmar: 'M', // bulk 207
  pinsir: 'M', // bulk 235
  tauros: 'M', // bulk 240
  magikarp: 'S', // bulk 95
  gyarados: 'L', // bulk 274
  lapras: 'L', // bulk 305
  ditto: 'S', // bulk 144
  eevee: 'M', // bulk 170
  vaporeon: 'L', // bulk 285
  jolteon: 'M', // bulk 220
  flareon: 'M', // bulk 235
  porygon: 'M', // bulk 210
  omanyte: 'M', // bulk 190
  omastar: 'L', // bulk 265
  kabuto: 'M', // bulk 165
  kabutops: 'M', // bulk 235
  aerodactyl: 'M', // bulk 220
  snorlax: 'L', // bulk 335
  articuno: 'L', // bulk 315
  zapdos: 'L', // bulk 265
  moltres: 'L', // bulk 265
  dratini: 'S', // bulk 136
  dragonair: 'M', // bulk 196
  dragonite: 'L', // bulk 286
  mewtwo: 'L', // bulk 286
  mew: 'S', // bulk 300 — hand override
  crystalonix: 'M', // bulk 220
  pinkbutterfree: 'M', // bulk 190
  surfingpikachu: 'S', // bulk 125
  flyingpikachu: 'S', // bulk 125
  giantdragonite: 'L', // bulk 356
  togepi: 'M', // bulk 165
  marill: 'M', // bulk 170
  snubbull: 'S', // bulk 150
  donphan: 'L', // bulk 270
  hooh: 'L', // bulk 350
};
export const TIER_DRAW_SIZES = { S: 52, M: 64, L: 80 };
export function battlerTierFor(speciesId) { return BATTLER_TIERS[speciesId] || 'M'; }
export function battlerDrawSize(speciesId) { return TIER_DRAW_SIZES[battlerTierFor(speciesId)]; }
