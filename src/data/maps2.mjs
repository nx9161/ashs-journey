// maps2.mjs — ASH'S JOURNEY world extension: Flintridge east through the full
// Yellow-order Arden loop — Mt. Lunestone, Tidehaven, S.S. Tern, Canopy / Game
// Corner / Hideout, Farsight / Vantage, Hushmoor / Hushmoor Tower,
// Bramble / Bramble Preserve, Rime, Caldera / Mansion, Fernmere Gym,
// Crown Road, the League, post-game Tidehaven Cave + Coilworks, and
// Exile Isle (event access only).
// Shapes match maps.mjs EXACTLY. Overrides (pallet / viridian / pewter /
// cerulean) are COMPLETE defs meant to replace the maps.mjs entries when
// merged (MAPS2 wins on key collision).
// Tile legend: # tree/wall | . path/floor | , grass | ~ water (shore) |
//   W deep water | H house | D door | S sign | G gymwall | E gymdoor |
//   C centerdoor | F flower | R rock | T cuttable tree | B boulder | ' ' void
// Encounter extension: { rate, table, waterRate?, water?, cave?, fish? } —
//   cave=true rolls the table on floor tiles (no grass needed).
// Events are step-on story triggers; script bodies live in the story file.
// Centers are NOT authored here: 'C' doors warp to the shared 'center'
// map with a via{} return ticket to the city's door-front tile.

function rows(list) { return list; }

export const MAPS2 = {
  // ---------- FLINTRIDGE override: + east exit to Route 3, hidden Old Amber ----------
  pewter: {
    id: 'pewter', name: 'Flintridge City', music: 'pewter-theme',
    rows: rows([
      'GGØGGGGGGGGGGGGGØGGG',
      'Gãããã∺ããXããÂÂÂ∺∺∺ÂØG',
      'GUṕṝU3ḁḁḁḁḁÂÂÂvsrÂḁG',
      'GᾓyᾓU0UVYUUÂÂÂÂÂÂÂḁG',
      'G∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸G',
      'GÂoÂÂÂÂ∸∸ĵẎÂẄÂÂḁḁoḁG',
      'G∺∺∺ÂÂÂ∸∸î∺∺∺ĵĵ∹∹∹ÂG',
      'GğyğÂÂÂ∸∸ÂrstĵĵxyzÂG',
      'G∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸∸',
      'GÂFÂÂĵÂ∸∸npÂÂÂÂÂÂÂÂG',
      'G∹∹∹Â∸jklmÂ∸∸Â∹∹O∹∹G',
      'GvsuÂ∸AJKAÂ∸∸ÂPṝ12PG',
      'GẐĵ∸ĵ∸∸∸∸∸∸∸∸∸∸∸∸∸BG',
      'GGGØGGG∸∸GGGGGGØGGGG',
    ]),
    warps: [
      { x: 7, y: 3, to: { map: 'gym', x: 5, y: 7 } },
      { x: 8, y: 3, to: { map: 'gym', x: 6, y: 7 } },
      { x: 19, y: 8, to: { map: 'route3', x: 1, y: 5 } },
      { x: 2, y: 7, to: { map: 'house-pewter-w', x: 4, y: 4 } },
      { x: 16, y: 7, to: { map: 'house-pewter-e', x: 4, y: 4 } },
      { x: 7, y: 13, to: { map: 'route2', x: 6, y: 1 } },
      { x: 8, y: 13, to: { map: 'route2', x: 7, y: 1 } },
      { x: 7, y: 11, to: { map: 'center', x: 4, y: 4 }, via: { map: 'pewter', x: 7, y: 12 } },
      { x: 8, y: 11, to: { map: 'center', x: 5, y: 4 }, via: { map: 'pewter', x: 8, y: 12 } },
      { x: 16, y: 11, to: { map: 'mart', x: 5, y: 5 }, via: { map: 'pewter', x: 16, y: 12 } },
      { x: 17, y: 11, to: { map: 'mart', x: 6, y: 5 }, via: { map: 'pewter', x: 17, y: 12 } },
    ],
    signs: [
      { x: 6, y: 9, text: 'FLINTRIDGE CITY — A stone-gray city nestled between mountains.' },
      { x: 12, y: 4, text: 'FLINTRIDGE GYM — Leader: Garran. The rock-solid Kin trainer! Inside lies a RUBBLE GROUND: Rock moves hit harder and physical moves land true — for Garran, and for you.' },
      { x: 13, y: 9, text: 'FLINTRIDGE EAST — Route 3 by the east gate; the Gym and the Museum lie west.' },
      { x: 13, y: 12, text: 'SOUTH STREET — The Mart fronts this row; the Center stands west. Route 2 leaves south.' },
      { x: 6, y: 12, text: 'THE CENTER — Rest your Kin inside. The Museum square lies north; Route 2 south.' },
    ],
    npcs: [
      { x: 13, y: 11, name: 'MART CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#2a1a0a',
        mart: { stock: ['pokeball', 'greatball', 'potion', 'superpotion', 'antidote', 'awakening'] },
        dialogue: ["Flintridge Mart — stone-country stock. The Lunestone road eats potions; plan ahead."] },
      { x: 10, y: 4, name: 'COACH', art: 'coach', skin: '#d8a878', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        dialogue: ["Garran's rock-types shrug off electric attacks — your partner's sparks won't cut it in there.", "Catch a FUSSAPE on Route 2 — fighting beats rock, and they learn Low Kick young. Water or grass would work too, but you won't find those this side of the forest.", "You've got heart, kid. Take these Capture Orbs — on the house."],
        give: { flag: 'coach_balls', items: { pokeball: 3 }, text: '3 Capture Orbs' } },
      { x: 3, y: 4, name: 'CURATOR', art: 'elder', skin: '#e8b888', shirt: '#6a5a8a', pants: '#3a3a4a', hair: '#c0c0c0',
        dialogue: ["Our museum's fossil lab swears a shard of Old Amber washed up right here in town once.", "Amber holds ancient DNA, you know. If you ever find a piece — guard it with your life."] },
    ],
    encounters: null,
    items: [],
    hidden: [
      { x: 5, y: 5, item: 'oldamber', n: 1 },
    ],
    events: [],
    start: null,
  },

  route3: {
    id: 'route3', name: 'Route 3', music: 'route1-theme',
    rows: rows([
      '≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍',
      '≍,,,,≌≌≌Ẍẉ≌≌≌ẋ≌≌≌≍',
      '≍,,,,≌≋RRR≋≋≌≎≌≌≌≍',
      '≍,,,,≌≋RRR≎≌≌≋≌≌≌≍',
      '≍≌≋≋≌≋≋≌≌≌≌≋≌≌≋≋ẕ≍',
      '≌≌≌≌≌≌≌≋≌≋≌≌≌≌≋≋≌≌',
      '≍≌≋≌≌≋≌≋≋≋≋,,,,,,≍',
      '≍Ẕ≌≋≌S≋≋≋≋≋,,,,,,≍',
      '≍ẅ≌≌≌≋≋≌≋≋≌,,,,,,≍',
      '≍ẉ≌≌Ẉ≋≋≌≌≋≋≋Ẓ≌≌ẅẉ≍',
      '≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍≍',
    ]),
    warps: [
      { x: 0, y: 5, to: { map: 'pewter', x: 18, y: 8 } },
      { x: 17, y: 5, to: { map: 'moon1', x: 1, y: 5 } },
    ],
    signs: [
      { x: 5, y: 7, text: 'ROUTE 3 — Flintridge City to Mt. Lunestone. Watch for falling rocks and eager trainers.' },
    ],
    npcs: [
      { x: 12, y: 4, name: 'LASS ANA', art: 'lass', skin: '#f0c8a0', shirt: '#c03a7a', pants: '#3a3a4a', hair: '#7a4a1a',
        trainer: 'r3_lass', sight: { dir: 'left', range: 3 },
        dialogue: ["I just got my first badge — wanna see what it taught me?", "Okay, okay! Your badge energy is real!"] },
      { x: 8, y: 9, name: 'BEX JR', art: 'bugcatcher', skin: '#e8b888', shirt: '#a03a5f', pants: '#2a304a', hair: '#2a1a0a',
        trainer: 'r3_bug', sight: { dir: 'up', range: 3 },
        dialogue: ["My net's full and my bugs are feisty! Battle!", "Net empty, pride emptier..."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'pidgey', min: 6, max: 8, weight: 30 },
        { species: 'spearow', min: 6, max: 8, weight: 25 },
        { species: 'nidoranm', min: 6, max: 8, weight: 15 },
        { species: 'nidoranf', min: 6, max: 8, weight: 15 },
        { species: 'mankey', min: 6, max: 8, weight: 15 },
      ],
    },
    items: [
      { x: 16, y: 1, item: 'potion', n: 1 },
    ],
    hidden: [],
    events: [],
    start: null,
  },

  moon1: {
    id: 'moon1', name: 'Mt. Lunestone — 1F', music: 'pewter-theme', indoor: true, dark: true,
    rows: rows([
      '⊉⊉⊉ý⊉ý⊉⊉ý⊉⊉⊉⊉ý⊉⊉',
      '⊉ṮṮṯṯṰ⊈⊈⊈⊈⊈⊈⊈⊈⊈⊉',
      '⊉ṱ⊈NN⊈⊈⊈⊈NN⊈⊈ṭ⊈⊉',
      '⊉⊈⊈⊈ṭ⊈⊈⊈⊈⊈⊈⊈⊈⊈⊈⊉',
      '⊉⊈⊈⊈⊈NNNN⊈ṭṭ⊈⊈⊈⊉',
      'ṭ⊈ṭ⊈⊈⊈⊈⊈⊈⊈NN⊈⊈⊈⊉',
      '⊉⊈⊈⊈⊈⊈⊈ṭ⊈⊈⊈⊈⊈⊈⊈⊉',
      '⊉⊈⊈NN⊈⊈⊈⊈⊈⊈NN⊈⊈⊉',
      '⊉ṭ⊈⊈⊈⊈⊈⊈⊈⊈⊈⊈⊈⊈⊈⊉',
      '⊉⊈⊈⊈⊈⊈⊈DD⊈ṭ⊈⊈⊈⊈⊉',
      '⊉Ṱ⊈⊈⊈⊈ṭ⊈⊈⊈⊈⊈⊈⊈Ṯ⊉',
      '⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉⊉',
    ]),
    warps: [
      { x: 0, y: 5, to: { map: 'route3', x: 16, y: 5 } },
      { x: 7, y: 9, to: { map: 'moon2', x: 7, y: 2 } },
      { x: 8, y: 9, to: { map: 'moon2', x: 8, y: 2 } },
    ],
    signs: [],
    npcs: [
      { x: 12, y: 6, name: 'HIKER TOMO', art: 'hiker', skin: '#c89878', shirt: '#9a603a', pants: '#3a3a3a', hair: '#4a3a2a',
        dialogue: ["SKREEBAT own the dark in here — they hear you before you see them.", "Somewhere below, the mountain keeps a stone that fell from the sky. Moon Stone, they call it."] },
    ],
    encounters: {
      rate: 0.1, cave: true,
      table: [
        { species: 'zubat', min: 6, max: 9, weight: 45 },
        { species: 'geodude', min: 7, max: 10, weight: 30 },
        { species: 'paras', min: 6, max: 9, weight: 15 },
        { species: 'sandshrew', min: 6, max: 9, weight: 10 },
      ],
    },
    items: [
      { x: 14, y: 1, item: 'potion', n: 1 },
    ],
    hidden: [
      { x: 13, y: 2, item: 'moonstone', n: 1 },
      // ADR-025 §3 (Phase 3) source: Fossil Spur — Mt. Lunestone hidden item.
      { x: 1, y: 10, item: 'fossilspur', n: 1 },
    ],
    events: [],
    start: null,
  },

  moon2: {
    id: 'moon2', name: 'Mt. Lunestone — B1F', music: 'pewter-theme', indoor: true, dark: true,
    rows: rows([
      '⊋ý⊋ý⊋ý⊋⊋⊋⊋⊋⊋⊋ý⊋⊋',
      '⊋ṮṮ⊊⊊⊊⊊DD⊊⊊⊊⊊⊊⊊⊋',
      '⊋Ṱ⊊ṭ⊊⊊⊊⊊⊊⊊⊊⊊⊊ṭ⊊⊋',
      '⊋⊊⊊NN⊊⊊⊊⊊⊊⊊NN⊊⊊⊋',
      '⊋⊊⊊⊊⊊⊊⊊⊊⊊⊊ṭṭ⊊⊊⊊⊋',
      '⊋⊊ṭ⊊⊊NNNNNN⊊⊊⊊⊊⊋',
      '⊋⊊⊊⊊⊊⊊⊊ṭ⊊⊊⊊⊊⊊⊊⊊⊋',
      '⊋⊊⊊NN⊊⊊⊊⊊⊊⊊NN⊊⊊⊋',
      '⊋ṭ⊊⊊⊊⊊⊊⊊⊊⊊⊊⊊⊊⊊⊊⊋',
      '⊋ṯṱ⊊⊊⊊⊊ṭ⊊⊊ṭ⊊⊊⊊⊊⊊',
      '⊋ṯṰ⊊⊊⊊ṭ⊊⊊⊊⊊⊊⊊⊊Ṯ⊋',
      '⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋⊋',
    ]),
    warps: [
      { x: 7, y: 1, to: { map: 'moon1', x: 7, y: 8 } },
      { x: 8, y: 1, to: { map: 'moon1', x: 8, y: 8 } },
      { x: 15, y: 9, to: { map: 'route4', x: 1, y: 5 } },
    ],
    signs: [],
    npcs: [
      { x: 5, y: 8, name: 'GRUNT REX', art: 'grunt', skin: '#d8a878', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#3a2a1a',
        trainer: 'moon_grunt', sight: { dir: 'right', range: 3 },
        dialogue: ["This cave's fossils belong to the Team now, brat. Scram!", "Tch! The boss'll hear about this..."] },
      { x: 10, y: 3, name: 'SCIENTIST', art: 'scientist', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#1a1a1a',
        dialogue: ["Two fossils sleep in this chamber — a helix and a dome, older than the mountain itself.", "Take ONE, trainer, and leave the other for the next dreamer. Science is not greed."] },
    ],
    encounters: {
      rate: 0.1, cave: true,
      table: [
        { species: 'zubat', min: 7, max: 11, weight: 35 },
        { species: 'geodude', min: 8, max: 11, weight: 25 },
        { species: 'paras', min: 7, max: 10, weight: 20 },
        { species: 'sandshrew', min: 7, max: 10, weight: 15 },
        { species: 'clefairy', min: 8, max: 11, weight: 5 },
      ],
    },
    items: [
      { x: 3, y: 9, item: 'helixfossil', n: 1 },
      { x: 12, y: 9, item: 'domefossil', n: 1 },
      { x: 14, y: 2, item: 'escaperope', n: 1 },
    ],
    hidden: [],
    events: [],
    start: null,
  },

  route4: {
    id: 'route4', name: 'Route 4', music: 'route1-theme',
    rows: rows([
      '≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑',
      '≑ẋ≒≏≏≐≐≐ẍ≏≒≐≐ẋ≐≐≐≑',
      '≑≐≏,,,,≏≐≐≏≏≐RR≐≐≑',
      '≑≏≐,,,,≏≐≏≏≐≏≏≏≏≐≑',
      '≑≐≏≏≐≏≏≐≐≐≐≏≏≐≏≏ẗ≑',
      '≐≐≐≐≐≐≐≏≐≏≐≐≐≐≏≏≐≐',
      '≑≐≏≐≐≏≏≏≏≏≏,,,,,,≑',
      '≑ẖ≐≏≐S≏≏≏≏≏,,,,,,≑',
      '≑Ẋ≐≐≐≏≏≐≏≏≐,,,,,,≑',
      '≑≐≐≐≐≏≏≐≐≐≏≏ẇ≐≐ẊẎ≑',
      '≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑≑',
    ]),
    warps: [
      { x: 0, y: 5, to: { map: 'moon2', x: 14, y: 9 } },
      { x: 17, y: 5, to: { map: 'cerulean', x: 1, y: 5 } },
    ],
    signs: [
      { x: 5, y: 7, text: 'ROUTE 4 — Mt. Lunestone to Tidehaven City. The ledges only let you down, never back up.' },
    ],
    npcs: [
      { x: 4, y: 4, name: 'MARCO', art: 'youngster', skin: '#e8b888', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        giveMon: { species: 'charmander', level: 10 },
        dialogue: ["My EMBRY's too much fire for a guy with my temper. We keep setting each other off.", "Take him. Raise that flame right — and when he roars someday, remember old Marco."] },
      { x: 9, y: 9, name: 'LASS RUE2', art: 'lass', skin: '#f0c8a0', shirt: '#e08a3a', pants: '#2c3049', hair: '#a05a2a',
        trainer: 'r4_lass', sight: { dir: 'up', range: 3 },
        dialogue: ["Tidehaven's just ahead — but nobody passes my picnic spot unbattled!", "Fine, FINE. Tidehaven deserves you."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'rattata', min: 8, max: 12, weight: 30 },
        { species: 'spearow', min: 8, max: 12, weight: 25 },
        { species: 'sandshrew', min: 8, max: 12, weight: 20 },
        { species: 'ekans', min: 8, max: 12, weight: 15 },
        { species: 'mankey', min: 9, max: 12, weight: 10 },
      ],
    },
    items: [
      { x: 16, y: 1, item: 'tm04', n: 1 },
    ],
    hidden: [],
    events: [
      { id: 'ev_charmander', x: 4, y: 5, when: { flagNot: 'ev_charmander_done' } },
    ],
    start: null,
  },

  // ---------- TIDEHAVEN override: gym, Bill, trades, cave mouth ----------
  cerulean: {
    id: 'cerulean', name: 'Tidehaven City', music: 'viridian-theme',
    rows: rows([
      'ÎGÙÎ~~~ἇ⁮⁮ἇ~ÃÃÃÃÃÙ~~',
      'Ã⁮⁮ÃÃÃÃÃ⁮⁮ÃÃÃÃÃFÃÃÃ~',
      'Ã⁮ÃÃÃÃÃÃ⁮⁮⁯O⁯⁯ẑÃÃÃÃ~',
      'Ã⁮ÃÃÃÃÃÃ⁮⁮P12PÃÃÃÃÃ~',
      '~ķ⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁯⁯⁯⁯⁯Ã~',
      '⁮⁮⁮⁮⁮⁮⁮⁮⁯⁯X⁯ÃḂḂḂḂḂÃ~',
      '~jklmÃ⁮⁮ḂḂḂḂÃUU—UUķ~',
      'ἇAJKAÃ⁮⁮UVYUṀo⁮⁮⁮⁮⁮~',
      'ἇ⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮~',
      '″nnFÃÃṆÃ⁮⁮⁮⁮⁮⁮~~~~⁮~',
      '~⁯⁯⁯⁯ÃÃø⁮⁮⁯⁯⁯⁮⁮ṃ~~⁮~',
      '~ġġwġÃÃÃ⁮⁮xyz⁮⁯⁯⁯F⁮~',
      '~⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮⁮ġwġF⁮~',
      '~~~~~~~ἇ⁮⁮o~~ἇἇἇἇἇἇ″',
    ]),
    warps: [
      { x: 9, y: 7, to: { map: 'gym-cerulean', x: 5, y: 7 } },
      { x: 10, y: 7, to: { map: 'gym-cerulean', x: 6, y: 7 } },
      { x: 2, y: 7, to: { map: 'center', x: 4, y: 4 }, via: { map: 'cerulean', x: 2, y: 8 } },
      { x: 3, y: 7, to: { map: 'center', x: 5, y: 4 }, via: { map: 'cerulean', x: 3, y: 8 } },
      { x: 0, y: 5, to: { map: 'route4', x: 16, y: 5 } },
      { x: 8, y: 0, to: { map: 'route5', x: 8, y: 1 } },
      { x: 9, y: 0, to: { map: 'route5', x: 9, y: 1 } },
      { x: 8, y: 13, to: { map: 'route5', x: 8, y: 12 } },
      { x: 9, y: 13, to: { map: 'route5', x: 9, y: 12 } },
      { x: 2, y: 1, to: { map: 'ceruleancave', x: 8, y: 10 } },
      { x: 3, y: 11, to: { map: 'house-cerulean', x: 4, y: 4 } },
      { x: 11, y: 3, to: { map: 'mart', x: 5, y: 5 }, via: { map: 'cerulean', x: 11, y: 4 } },
      { x: 12, y: 3, to: { map: 'mart', x: 6, y: 5 }, via: { map: 'cerulean', x: 12, y: 4 } },
    ],
    signs: [
      { x: 6, y: 2, text: 'TIDEHAVEN CITY — A beautiful blue city, forever flowing like water.' },
      { x: 12, y: 6, text: 'TIDEHAVEN GYM — Leader: Marina. The tomboyish mermaid! Inside lies a TIDE GROUND: Water moves hit harder and special moves ride the current — for Marina, and for you.' },
      { x: 12, y: 5, text: 'TIDEHAVEN CITY — West: ROUTE 4 · North: ROUTE 5 · South: ROUTE 5.' },
      { x: 13, y: 1, text: 'TIDEHAVEN MART — Supplies for the bridge road, the river, and everything north of both.' },
    ],
    npcs: [
      { x: 14, y: 3, name: 'MART CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#2a1a0a',
        mart: { stock: ['pokeball', 'greatball', 'superpotion', 'hyperpotion', 'antidote', 'parlyzheal', 'revive'] },
        dialogue: ["Tidehaven Mart — bridge-and-river stock, waterproofed twice over."] },
      { x: 17, y: 1, name: 'ODO', art: 'scientist', skin: '#f0c8a0', shirt: '#5d3fa5', pants: '#3a3a4a', hair: '#a05a2a',
        dialogue: ["Heya! I'm Odo — the PC box whiz. My teleport experiment hiccuped and I woke up dressed as a MOONLET.", "My Sea Cottage lab is shuttered while I fix it, so ask me anything here. Your boxes? I built those. You're welcome."] },
      { x: 5, y: 10, name: 'WREN', art: 'nurse', skin: '#e8b888', shirt: '#e8e0f0', pants: '#5a4a6a', hair: '#3a2a4a',
        giveMon: { species: 'bulbasaur', level: 10 },
        dialogue: ["I nurse hurt Kin back to health here. This BUDDIN came to me half-starved, the poor sprout.", "He's strong now — and he needs a journey, not a garden. Will you take him with you?"] },
      { x: 18, y: 9, name: 'ORIN', art: 'youngster', skin: '#d8a878', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#6a4a2a',
        trade: { give: 'abra', get: 'mrmime', nickname: 'MARCEL' },
        dialogue: ["My NAPSEER teleports out of every conversation. Exhausting at parties.", "Trade you my PANTOMIM, Marcel, for an NAPSEER? At least he'll stay in the room. Mostly."] },
      { x: 5, y: 7, name: 'TESS', art: 'lady', skin: '#f0c8a0', shirt: '#c03a7a', pants: '#3a3a4a', hair: '#c0a03a',
        trade: { give: 'poliwhirl', get: 'jynx', nickname: 'LOLA' },
        dialogue: ["Lola my FROSTELLE sings to the river every dawn. Beautiful. Loud. So loud.", "Swap her for a WHIRLFROG? My ears are begging you."] },
      { x: 10, y: 9, name: 'FAN', art: 'youngster', skin: '#f0c8a0', shirt: '#3a9ac0', pants: '#2a3a4a', hair: '#1a1a1a',
        dialogue: ["Marina's ASTRION once spun a whirlpool that soaked the whole front row. Best day of my life.", "North of here the bridge kids challenge everyone who crosses. Even grandmas. ESPECIALLY grandmas."] },
    ],
    encounters: null,
    items: [],
    hidden: [
      { x: 8, y: 2, item: 'nugget', n: 1 },
    ],
    events: [
      { id: 'ev_rival_bridge', x: 8, y: 1, when: { flagNot: 'ev_rival_bridge_done' } },
      { id: 'ev_bill', x: 17, y: 2, when: { flagNot: 'ev_bill_done' } },
      { id: 'ev_bulbasaur_gift', x: 5, y: 11, when: { flagNot: 'ev_bulbasaur_gift_done' } },
    ],
    start: null,
  },


  route5: {
    id: 'route5', name: 'Route 5', music: 'route1-theme',
    rows: rows([
      '≕≕≕≕≕≕≕≕≔≔≕≕≕≕≕≕',
      '≕≓≓≓≓≓≔≔≔≔≓Ẕ≓≓Ẑ≕',
      '≕≔≓,,,,≓≔≔≓,,,,≕',
      '≕≓≔,,,,≓≔≓≓,,,,≕',
      '≕≔≓,,,,≔≔≔≔,,,,≕',
      '≕≔≔≔≔≔≓≓≔≓≔≓≔≔Ẍ≕',
      '≕≔≓≔≔HH≖≓≓≓≓≖≓≔≕',
      '≕≔≔≓ẆHH≓≓S≔≓≔≔≓≕',
      '≕ẏ≔≔≔≓≔≔≔≔≔≔≔≔≔≕',
      '≕≔≔,,,,≔≔≓≓,,,,≕',
      '≕ẉ≓,,,,≔≓≔≔,,,,≕',
      '≕≔≔,,,,≓≔≔≔,,,,≕',
      '≕≔Ẇ≔ẓ≔Ẑ≓≔≔ẕẏẉ≓ẍ≕',
      '≕≕≕≕≕≕≕≕≔≔≕≕≕≕≕≕',
    ]),
    warps: [
      { x: 8, y: 0, to: { map: 'cerulean', x: 8, y: 12 } },
      { x: 9, y: 0, to: { map: 'cerulean', x: 9, y: 12 } },
      { x: 8, y: 13, to: { map: 'route6', x: 8, y: 1 } },
      { x: 9, y: 13, to: { map: 'route6', x: 9, y: 1 } },
    ],
    signs: [
      { x: 10, y: 7, text: 'KIN DAY CARE — We raise your Kin with love while you travel. — The Day-Care Couple' },
    ],
    npcs: [
      { x: 8, y: 8, name: 'GRAMPS', art: 'elder', skin: '#e8b888', shirt: '#50368e', pants: '#4a4a5a', hair: '#c0c0c0',
        dialogue: ["Sixty years I've raised other folks' Kin on this route. They always come back stronger.", "Leave a partner with us someday, eh? Love and fresh air — that's the whole recipe."] },
      { x: 12, y: 5, name: 'CAMPER JO', art: 'camper', skin: '#f0c8a0', shirt: '#5d3fa5', pants: '#3a3a4a', hair: '#2a1a0a',
        trainer: 'r5_camper', sight: { dir: 'left', range: 3 },
        dialogue: ["Day care's closed to challengers, but I'M not! Battle the camper!", "Camp's all yours, champ. Sheesh."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'pidgey', min: 13, max: 16, weight: 25 },
        { species: 'rattata', min: 13, max: 16, weight: 18 },
        { species: 'oddish', min: 13, max: 16, weight: 20 },
        { species: 'bellsprout', min: 13, max: 16, weight: 20 },
        { species: 'jigglypuff', min: 13, max: 16, weight: 8 },
        { species: 'mankey', min: 13, max: 16, weight: 4 },
        { species: 'abra', min: 13, max: 16, weight: 5 },
      ],
    },
    items: [],
    hidden: [],
    events: [],
    start: null,
  },

  route6: {
    id: 'route6', name: 'Route 6', music: 'route1-theme',
    rows: rows([
      '≚≚≚≚≚≚≚≚≙≙≚≚≚≚≚≚',
      '≚ẏ≘≘≘≙≙≙≙≙≘ẖẎẑ≙≚',
      '≚≙≘,,,,≘≙≙≘,,,,≚',
      '≚≘≙,,,,≘~~≘,,,,≚',
      '≚≙≘≘≙≘≛≙~~≛≘≘≙ẋ≚',
      '≚≙≙,,,,≙≙≘≙,,,,≚',
      '≚≙≘≙≙≘≙≘≘≘≘≙≘≘≙≚',
      '≚≙≙≘≘S≘≘≘≘≘≙≙≙≙≚',
      '≚Ẏ≙,,,,≙≘≘≙,,,,≚',
      '≚≙≙,,,,≙≙≘≘,,,,≚',
      '≚ẋ≘≙≙≙≘≙≙≙≙≙≙≘≙≚',
      '≚≙≙FF≘≙≘≙~~≙≙≘≙≚',
      '≚≙≙≙ẅ≙Ẓẗ≙~~≙Ẉ≘ẏ≚',
      '≚≚≚≚≚≚≚≚≙≙≚≚≚≚≚≚',
    ]),
    warps: [
      { x: 8, y: 0, to: { map: 'route5', x: 8, y: 12 } },
      { x: 9, y: 0, to: { map: 'route5', x: 9, y: 12 } },
      { x: 8, y: 13, to: { map: 'vermilion', x: 8, y: 1 } },
      { x: 9, y: 13, to: { map: 'vermilion', x: 9, y: 1 } },
    ],
    signs: [
      { x: 5, y: 7, text: 'ROUTE 6 — Tidehaven to Arcport. The pond is full of quiet, patient Kin.' },
    ],
    npcs: [
      { x: 3, y: 10, name: 'BUG CATCHER ELI', art: 'bugcatcher', skin: '#e8b888', shirt: '#a03a5f', pants: '#2a304a', hair: '#7a4a1a',
        trainer: 'r6_bug', sight: { dir: 'right', range: 3 },
        dialogue: ["Everyone underestimates a PRISMWING until the Sleep Powder lands!", "Slept on... literally..."] },
    ],
    encounters: {
      rate: 0.12, waterRate: 0.1,
      table: [
        { species: 'pidgey', min: 13, max: 16, weight: 25 },
        { species: 'rattata', min: 13, max: 16, weight: 15 },
        { species: 'oddish', min: 13, max: 16, weight: 20 },
        { species: 'bellsprout', min: 13, max: 16, weight: 20 },
        { species: 'meowth', min: 13, max: 16, weight: 12 },
        { species: 'abra', min: 13, max: 16, weight: 5 },
        { species: 'mankey', min: 13, max: 16, weight: 3 },
      ],
      water: [
        { species: 'poliwag', min: 15, max: 20, weight: 60 },
        { species: 'psyduck', min: 15, max: 20, weight: 40 },
      ],
      fish: {
        old: [
          { species: 'poliwag', min: 10, max: 15, weight: 100 },
        ],
        good: [
          { species: 'poliwag', min: 15, max: 20, weight: 50 },
          { species: 'goldeen', min: 15, max: 20, weight: 50 },
        ],
        super: [
          { species: 'poliwag', min: 20, max: 25, weight: 40 },
          { species: 'goldeen', min: 20, max: 25, weight: 40 },
          { species: 'staryu', min: 20, max: 25, weight: 20 },
        ],
      },
    },
    items: [],
    hidden: [],
    events: [],
    start: null,
  },

  vermilion: {
    id: 'vermilion', name: 'Arcport City', music: 'viridian-theme',
    rows: rows([
      'ÏÏÏÏÏÏÏÏἇἇÏÏÏÏÏÏÏBB~',
      'ĸÄÄÄÄÄÄÄἇἇÄÄÄÄÄÄÄBB~',
      'ĸjjlmÄÄÄĸĸ⁰O⁰⁰ÄÄÄBB~',
      'ĸAJKAÄÄÄĸĸP12PÄååååå',
      'ĸÄἇἇÄoÄÄἇἇÄἇἇÄÄģģ—ģģ',
      'ἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇ',
      'ĸ⁰⁰⁰ÄÄÄÄÄĸÄÄÄÄÄÄÄÄÄ~',
      'ĸģwģÄååååἇ⁰⁰⁰ÄḃḃḃḃÄ‸',
      'ĸĸĸĸÄģģģwἇģ—ģẆḃVYḃἇ~',
      'ĸĸĸĸĸĸĸĸἇἇἇἇἇἇἇἇἇἇἇ~',
      'ĸ⁰⁰⁰ἇἇ‶ἇἇἇἇἇἇἇἇἇἇ‷ἇ~',
      'ĸģwģÄÄÄÄἇἇἇἇἇἇἇἇἇἇἇ~',
      'ἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇἇo~',
      '~~~‸~~~~ἇo~″~~~~~~~~',
    ]),
    warps: [
      { x: 15, y: 8, to: { map: 'gym-vermilion', x: 5, y: 7 } },
      { x: 16, y: 8, to: { map: 'gym-vermilion', x: 6, y: 7 } },
      { x: 2, y: 3, to: { map: 'center', x: 4, y: 4 }, via: { map: 'vermilion', x: 2, y: 4 } },
      { x: 3, y: 3, to: { map: 'center', x: 5, y: 4 }, via: { map: 'vermilion', x: 3, y: 4 } },
      { x: 8, y: 0, to: { map: 'route6', x: 8, y: 12 } },
      { x: 9, y: 0, to: { map: 'route6', x: 9, y: 12 } },
      { x: 0, y: 5, to: { map: 'route7', x: 15, y: 5 } },
      { x: 19, y: 5, to: { map: 'route11', x: 1, y: 5 } },
      { x: 2, y: 7, to: { map: 'house-vermilion', x: 4, y: 4 } },
      { x: 11, y: 3, to: { map: 'mart', x: 5, y: 5 }, via: { map: 'vermilion', x: 11, y: 4 } },
      { x: 12, y: 3, to: { map: 'mart', x: 6, y: 5 }, via: { map: 'vermilion', x: 12, y: 4 } },
    ],
    signs: [
      { x: 7, y: 1, text: 'ARCPORT CITY — The port of the vermilion sunset. Ships from every sea dock here.' },
      { x: 13, y: 9, text: 'ARCPORT GYM — Leader: Lt. Brandt. The Lightning Lieutenant! Inside lies a VOLT GROUND: Electric moves hit harder and strike swift and true — for Brandt, and for you.' },
      { x: 14, y: 4, text: 'ARCPORT MART — Two doors south of the gym row. Harbour stock, ferry-proof prices.' },
      { x: 2, y: 5, text: 'ARCPORT HARBOUR — The docks, the ferries and the Fan Club lie east along the street.' },
      { x: 5, y: 9, text: "KIN FAN CLUB — The founder's tide charts are spread on the porch, just south of here." },
      { x: 18, y: 7, text: "ARCPORT DOCKS — Cranes, crates and the captains' row. Ferries for every sea leave from the dock street." },
    ],
    npcs: [
      { x: 13, y: 4, name: 'MART CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#2a1a0a',
        mart: { stock: ['pokeball', 'greatball', 'superpotion', 'hyperpotion', 'antidote', 'parlyzheal', 'revive'] },
        dialogue: ["Arcport Mart — harbour stock. Everything ferry-proof, gull-proof, and salt-proof."] },
      { x: 3, y: 9, name: 'OFFICER RAE', art: 'officer', skin: '#d8a878', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#1a1a1a',
        giveMon: { species: 'squirtle', level: 10 },
        dialogue: ["This BUBLET leads a whole squad of pranksters — they flooded the pier AGAIN this morning.", "He listens to you, though. Take him, trainer. A squad needs a real leader."] },
      { x: 14, y: 9, name: 'HANK', art: 'fisher', skin: '#c89878', shirt: '#50368e', pants: '#4a4a5a', hair: '#3a2a1a',
        trade: { give: 'spearow', get: 'farfetchd', nickname: 'DUX' },
        dialogue: ["Caught this GALEDUCK — Dux — by the harbor. Clever bird. Keeps outsmarting my dinner plans.", "Swap me a KEENBEAK for him? A sailor needs a scout, not a chef."] },
      { x: 4, y: 10, name: 'CHAIRMAN', art: 'cast-chairman', skin: '#e8b888', shirt: '#6a5a8a', pants: '#3a3a4a', hair: '#c0c0c0',
        dialogue: ["I chair the Kin Fan Club! Did I tell you about my PYROGALOP? Its coat — like spun sunset!", "And my GLAREHAWK? Magnificent. I could talk for hours. I HAVE talked for hours. Ask anyone."] },
    ],
    encounters: null,
    items: [],
    hidden: [
    ],
    events: [
      { id: 'ev_stanne', x: 8, y: 11, when: { flagNot: 'ev_stanne_done' } },
      { id: 'ev_squirtle_squad', x: 4, y: 9, when: { flagNot: 'ev_squirtle_squad_done' } },
    ],
    start: null,
  },


  stanne: {
    id: 'stanne', name: 'S.S. Tern', music: 'viridian-theme', indoor: true,
    rows: rows([
      'ṝṞ??τ????????τ????',
      '?ḓḔ**************?',
      '?**ρσ********σρ**?',
      '?****************?',
      '?****************?',
      '?*****ε**********?',
      '?*****ζ**********?',
      '?**ρθ********θρ**?',
      '?****************?',
      '?*******DD*******?',
      '??????????????????',
    ]),
    warps: [
      { x: 8, y: 9, to: { map: 'vermilion', x: 8, y: 10 } },
      { x: 9, y: 9, to: { map: 'vermilion', x: 9, y: 10 } },
    ],
    signs: [],
    npcs: [
      { x: 9, y: 3, name: 'VALE', art: 'gary', skin: '#f0c8a0', shirt: '#3a5a9a', pants: '#2a2a3a', hair: '#6a4a2a',
        trainer: 'gary_stanne',
        dialogue: ["Fancy meeting you on MY ship, {player}. The captain lets ME cut the ribbon on this tub.", "Hmph! The sea air must've slowed my team down. That's the only explanation."] },
      { x: 4, y: 5, name: 'MARA', art: 'sailor', skin: '#e8b888', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#7a1a3a',
        trainer: 'duo2_vermilion', duoPartner: 'JULES',
        sight: { dir: 'right', range: 3 },
        dialogue: ["A luxury liner, a famous captain... and one very collectible passenger list.", "Jules! Plan B! Plan B!!"] },
      { x: 13, y: 5, name: 'JULES', art: 'sailor', skin: '#d8a878', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#3a6ac0',
        trainer: 'duo2_vermilion', duoPartner: 'MARA',
        sight: { dir: 'left', range: 3 },
        dialogue: ["We dressed as crew. The hats were VERY convincing.", "Abandon ship — the plan, I mean! The plan!"] },
      { x: 15, y: 8, name: 'CAPTAIN', art: 'sailor', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#2a3a4a', hair: '#c0c0c0',
        dialogue: ["Back in '62 I wrestled a storm off the Sevii coast with one hand on the wheel and one on my tea.", "Rub my back when I'm seasick and I might teach your Kin to slice clean through anything."] },
    ],
    encounters: null,
    items: [],
    hidden: [],
    events: [
      { id: 'ev_duo_stanne', x: 9, y: 5, when: { flagNot: 'ev_duo_stanne_done' } },
    ],
    start: null,
  },

  route11: {
    id: 'route11', name: 'Route 11', music: 'route1-theme',
    rows: rows([
      '≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮',
      '≮≬≯≬≬≬≭≭≭≭≬≭≭≬≭≭ẑ≮',
      '≮≭≬,,,,≬≭≭≬ẇ≭≬≭≭≭≮',
      '≮ẍ≭,,,,≬≭≬≬RR≬≭≬ẕ≮',
      '≮Ẕ≬≬≭≬≬≭≭≭≭ẍ≬≭≬≬≬≮',
      '≭≭≭≭≭≭≭≬≭≬≭≭≭≭≬≬≭≭',
      '≮≭≬≭≭≭≬≬≬≬≬,,,,,,≮',
      '≮≭≭≬≭S≬≬≬≬≬,,,,,,≮',
      '≮≭≭≭≭≬≬≭≬≬≭,,,,,,≮',
      '≮≭≭ẄẐ≬≬≭≭≬≬≯≬≭≭≭≭≮',
      '≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮≮',
    ]),
    warps: [
      { x: 0, y: 5, to: { map: 'vermilion', x: 18, y: 5 } },
      { x: 17, y: 5, to: { map: 'route12', x: 1, y: 5 } },
    ],
    signs: [
      { x: 5, y: 7, text: "ROUTE 11 — Arcport's east meadow. Something huge once slept across this road, they say." },
    ],
    npcs: [
      { x: 9, y: 4, name: 'GAMER HUGO', art: 'cast-hugo', skin: '#e8b888', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        trainer: 'r11_gamer', sight: { dir: 'down', range: 3 },
        dialogue: ["Battles are a game of odds, kid — and my MOLING never folds!", "Read me like an open book... rematch after I reshuffle my pride."] },
      { x: 13, y: 9, name: 'ENGINEER', art: 'worker', skin: '#d8a878', shirt: '#e08a3a', pants: '#4a4a5a', hair: '#3a2a1a',
        dialogue: ["We're surveying for a tunnel under Arcport Bay. The MOLING keep redrawing our maps.", "Honestly? Their tunnels are better engineered than ours. Don't print that."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'spearow', min: 13, max: 17, weight: 25 },
        { species: 'drowzee', min: 13, max: 17, weight: 20 },
        { species: 'ekans', min: 13, max: 17, weight: 18 },
        { species: 'sandshrew', min: 13, max: 17, weight: 17 },
        { species: 'diglett', min: 14, max: 17, weight: 15 },
        { species: 'dugtrio', min: 16, max: 18, weight: 5 },
      ],
    },
    items: [
      { x: 16, y: 9, item: 'greatball', n: 1 },
    ],
    hidden: [],
    events: [],
    start: null,
  },

  route7: {
    id: 'route7', name: 'Route 7', music: 'route1-theme',
    rows: rows([
      '≞≞≞≞≞≞≞≞≞≞≞≞≞≞≞≞',
      '≞≝≝≜≜≝≝≝ẒẆ≝≝≝≝≝≞',
      '≞≝≜,,,,≜≝≝≜≜≝≜≝≞',
      '≞≜≝,,,,≜≝≜≜FFẗẌ≞',
      '≞≝≜≜≝≜≟≝≝≝≝≜≜≝≝≞',
      '≝≝≝≝≝≝≝≜≝≜≝≝≝≝≜≝',
      '≞≝≜≝≝≜≟≜≜≜≜,,,,≞',
      '≞ẖ≝≜≝S≜≜≜≜≜,,,,≞',
      '≞≝≝≝≝≜≜≝≜≜≝,,,,≞',
      '≞≝≝≝ẅ≜≜≜≜≜≜≜≜ẉ≜≞',
      '≞≞≞≞≞≞≞≞≞≞≞≞≞≞≞≞',
    ]),
    warps: [
      { x: 0, y: 5, to: { map: 'celadon', x: 18, y: 4 } },
      { x: 15, y: 5, to: { map: 'vermilion', x: 1, y: 5 } },
    ],
    signs: [
      { x: 5, y: 7, text: 'ROUTE 7 — Arcport to Canopy. Short grass, tall stories at the gatehouse.' },
    ],
    npcs: [
      { x: 8, y: 4, name: 'LASS MINA', art: 'lass', skin: '#f0c8a0', shirt: '#c03a7a', pants: '#3a3a4a', hair: '#7a4a1a',
        trainer: 'r7_lass', sight: { dir: 'down', range: 3 },
        dialogue: ["Canopy's perfume shops can wait — battle first, shopping second!", "My wallet thanks you for the delay, at least."] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'pidgey', min: 18, max: 22, weight: 25 },
        { species: 'rattata', min: 18, max: 22, weight: 15 },
        { species: 'oddish', min: 18, max: 22, weight: 20 },
        { species: 'bellsprout', min: 18, max: 22, weight: 20 },
        { species: 'meowth', min: 18, max: 22, weight: 15 },
        { species: 'abra', min: 18, max: 22, weight: 5 },
      ],
    },
    items: [],
    hidden: [],
    events: [],
    start: null,
  },

  celadon: {
    id: 'celadon', name: 'Canopy City', music: 'viridian-theme',
    rows: rows([
      'ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ',
      'ÐÅÅÅÅÅÅÅÅÅÅÅÅÅÅÅÅÅÅÐ',
      'ÐæææÅ⁨⁨⁨ÅḄḄḄḄḄḄÅ⁨⁨⁨Ð',
      'ÐP12oĥsĥÅUVYUUUoĥsĥÐ',
      '⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧',
      'Ð⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧Ð',
      'Ðææææẅp⁧⁧⁧pẅẅpùpùpÅÐ',
      'ÐAJKA⁧ḣ⁧⁧⁧ḣ⁧12ññññÅÐ',
      'Ð⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧ẅÅÐ',
      'Ðo⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧',
      'ÐæææææææÅ⁨⁨⁨⁧⁨⁨⁨⁧ẌÅÐ',
      'Ðñ78ñ—ññoĥsĥ⁧ĥsĥ⁧⁧oÐ',
      'Ð⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧⁧Ð',
      'ÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐÐ',
    ]),
    warps: [
      { x: 10, y: 3, to: { map: 'gym-celadon', x: 5, y: 7 } },
      { x: 11, y: 3, to: { map: 'gym-celadon', x: 6, y: 7 } },
      { x: 2, y: 7, to: { map: 'center', x: 4, y: 4 }, via: { map: 'celadon', x: 2, y: 8 } },
      { x: 3, y: 7, to: { map: 'center', x: 5, y: 4 }, via: { map: 'celadon', x: 3, y: 8 } },
      { x: 12, y: 7, to: { map: 'gamecorner', x: 8, y: 10 } },
      { x: 13, y: 7, to: { map: 'gamecorner', x: 9, y: 10 } },
      { x: 6, y: 3, to: { map: 'house-celadon-w', x: 4, y: 4 } },
      { x: 17, y: 3, to: { map: 'house-celadon-e', x: 4, y: 4 } },
      { x: 2, y: 3, to: { map: 'mart', x: 5, y: 5 }, via: { map: 'celadon', x: 2, y: 4 } },
      { x: 3, y: 3, to: { map: 'mart', x: 6, y: 5 }, via: { map: 'celadon', x: 3, y: 4 } },
      { x: 19, y: 4, to: { map: 'route7', x: 1, y: 5 } },
      { x: 19, y: 9, to: { map: 'route8', x: 1, y: 5 } },
      { x: 0, y: 4, to: { map: 'route16', x: 8, y: 1 } },
    ],
    signs: [
      { x: 13, y: 11, text: 'CANOPY CITY — The rainbow city. Dept. Store, Game Corner, and perfume on every breeze.' },
      { x: 8, y: 4, text: 'CANOPY GYM — Leader: Verna. The nature-loving princess! Inside lies a MARSH GROUND: Grass moves hit harder and healing blooms fuller — for Verna, and for you.' },
      { x: 15, y: 4, text: 'CANOPY CITY — East: ROUTE 7 · West: ROUTE 16.' },
      { x: 1, y: 8, text: 'CANOPY CITY — East: ROUTE 7 · West: ROUTE 16.' },
      { x: 17, y: 9, text: 'CANOPY CITY — East: ROUTE 7 · West: ROUTE 16.' },
    ],
    npcs: [
      { x: 5, y: 12, name: 'ELIAS', art: 'cast-elias', skin: '#e8b888', shirt: '#50368e', pants: '#4a4a5a', hair: '#c0c0c0',
        giveMon: { species: 'eevee', level: 25 },
        dialogue: ["Atop the old condo I kept a PRISMKIT — bright little thing, brimming with possible futures.", "My traveling days are done. Take PRISMKIT, and let it become whatever your journey needs."] },
      { x: 11, y: 8, name: 'HOSTESS', art: 'host-arden', skin: '#f0c8a0', shirt: '#e86a5a', pants: '#2a2a3a', hair: '#1a1a1a',
        dialogue: ["Welcome to the Game Corner, hon! Coins, prizes, and absolutely no funny business by the poster. None. Ever.", "The boss counts the slot tokens twice a night. Paranoid? In THIS city? Ha."] },
      { x: 4, y: 8, name: 'PERFUMER', art: 'lady', skin: '#f0c8a0', shirt: '#5d3fa5', pants: '#3a3a4a', hair: '#a05a2a',
        dialogue: ["Verna's perfume is distilled from her own garden. One whiff and even a SOMNIBEAR sighs.", "Careful — her gym smells sweet right up until the Sleep Powder."] },
      // ADR-025 §3 (Phase 3): Canopy gains a small keepsake atelier —
      // the Second-Wind Ribbon's SECOND source (its first is the Rue &
      // Cole parley, bond-gated to Phase 5). The ribbon's stock is
      // "late": ITEMS.secondwindribbon.minBadges = 7 gates the row in
      // openMart until the player carries seven badges.
      { x: 17, y: 12, name: 'MART CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#1a2a4a',
        mart: { stock: ['greatball', 'ultraball', 'superpotion', 'hyperpotion', 'secondwindribbon'] },
        dialogue: ["Canopy Atelier — ribbons, charms, and the odd heirloom. Our Second-Wind Ribbon? Reserved for proven trainers. Seven badges, hon."] },
    ],
    encounters: null,
    items: [],
    hidden: [
      { x: 8, y: 3, item: 'nugget', n: 1 },
    ],
    events: [],
    start: null,
  },


  gamecorner: {
    id: 'gamecorner', name: 'Canopy Game Corner', music: 'viridian-theme', indoor: true,
    rows: rows([
      'ṗ;;;;;;;;;;;;;;;;;',
      ';θ$$$$$$$$$$$$$$ḋ;',
      ';Ḣ$υ$$υ$$υ$$υ$$$Ḓ;',
      ';$$$$$$$$$$$$$$$κ;',
      ';$$$$$$$$$$$$$$$$;',
      ';$$$$$$$$$$$$$$$$;',
      ';$$$$$$$))$$$$$$$;',
      ';$$$$$$$$$$$$$$$$;',
      ';$$εζ$$$$$$$$$$$$;',
      ';$$$$$$$$$$$$$$$$;',
      ';$$$$$$$DD$$$$$$θ;',
      ';;;;;;;;;;;;;;;;;;',
    ]),
    warps: [
      { x: 8, y: 10, to: { map: 'celadon', x: 12, y: 8 } },
      { x: 9, y: 10, to: { map: 'celadon', x: 13, y: 8 } },
    ],
    signs: [
      { x: 3, y: 2, text: 'SLOT MACHINE — Three CELLORB and the jackpot is yours. The house thanks you for trying.' },
      { x: 6, y: 2, text: 'SLOT MACHINE — A sign reads: NO PEEKING BEHIND THE POSTER. MANAGEMENT.' },
      { x: 9, y: 2, text: 'PRIZE DESK — Rare Kin for rare coin totals. No trades, no haggling, no tears.' },
      { x: 12, y: 2, text: 'SLOT MACHINE — Someone carved tiny letters here: R WAS HERE.' },
    ],
    npcs: [
      { x: 5, y: 3, name: 'PRIZE CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#6a5a8a', pants: '#2a2a3a', hair: '#1a1a1a',
        prize: { species: 'porygon', coins: 6500 },
        dialogue: ["Six thousand five hundred coins buys you the future, friend — a POLYCRANE, fresh from the lab.", "Digital, loyal, and it never eats. Best deal on this floor."] },
      { x: 11, y: 3, name: 'COIN CLERK', art: 'clerk-arden', skin: '#e8b888', shirt: '#6a5a8a', pants: '#2a2a3a', hair: '#4a3a2a',
        prize: { species: 'abra', coins: 180 },
        dialogue: ["One eighty gets you an NAPSEER. It'll teleport from strangers — but you're not a stranger, are you?", "Five hundred, a MOONLET. Sweet as the perfume upstairs, twice as stubborn."] },
      { x: 14, y: 5, name: 'FAIRY CLERK', art: 'clerk-arden', skin: '#f0c8a0', shirt: '#e86a5a', pants: '#3a3a4a', hair: '#c0a03a',
        prize: { species: 'clefairy', coins: 500 },
        dialogue: ["MOONLET, five hundred coins, final offer. It dances on moonlit nights, you know.", "No refunds. The moon doesn't do refunds either."] },
      { x: 2, y: 9, name: 'REGULAR', art: 'gent', skin: '#d8a878', shirt: '#50368e', pants: '#4a4a5a', hair: '#3a2a1a',
        dialogue: ["Twenty years I've fed these slots. The poster behind me rattles some nights, like something's under the floor.", "Bah. Machines settle, that's all. ...Right?"] },
    ],
    encounters: null,
    items: [],
    hidden: [],
    events: [
      { id: 'ev_hideout_entry', x: 16, y: 1, when: { flagNot: 'ev_hideout_entry_done' } },
    ],
    start: null,
  },

  hideout: {
    id: 'hideout', name: 'Canopy Hideout', music: 'gym-theme', indoor: true, dark: true,
    rows: rows([
      'Ṡ>>>>>>>>>>>>>>>>>',
      '>Ḟ--------------->',
      '>--ξξ--------ξξ-->',
      '>---------------->',
      '>------κκκκ----γ->',
      '>---------------->',
      '>--οο--------οο-->',
      '>---------------->',
      '>--------------ψζ>',
      '>-------DD------Ḝ>',
      '>---------------ḝ>',
      '>>>>>>>>>>>>>>>>>>',
    ]),
    warps: [
      { x: 8, y: 9, to: { map: 'gamecorner', x: 16, y: 2 } },
      { x: 9, y: 9, to: { map: 'gamecorner', x: 15, y: 2 } },
    ],
    signs: [],
    npcs: [
      { x: 3, y: 8, name: 'SENTRY SUE', art: 'grunt', skin: '#e8b888', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#7a1a3a',
        dialogue: ["You didn't see a hideout. There's no hideout. The poster is DECORATIVE.", "Wait — how did you even get down here?! Security! SECURITY!"] },
    ],
    encounters: null,
    items: [
      { x: 9, y: 2, item: 'silphscope', n: 1 },
    ],
    hidden: [],
    events: [
      { id: 'ev_scope_boss', x: 9, y: 3, when: { flagNot: 'ev_scope_boss_done' } },
    ],
    start: null,
  },


























  // ---------- DAWNWICK override: complete def + ferry captain & dock ----------

  // ---------- FERNMERE override: gym west side (locked), Route 22 exit ----------







};

