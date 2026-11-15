// maps.mjs — Arden opening slice: Dawnwick -> Route 1 -> Fernmere -> Route 2 -> Flintridge (+ interiors).
// Tile legend: # tree | . path | , grass | ~ water | H house | D door | S sign |
//              G gymwall | E gymdoor | C centerdoor | F flower | R rock | ' ' void
// Warps fire on step. Doors are step-warps; edge exits are listed per tile.

function rows(list) { return list; }

export const MAPS = {
  pallet: {
    id: 'pallet', name: 'Dawnwick', music: 'pallet-theme',
    rows: rows([
      'ËËËËËËËËËËËËËËËË',
      'ËẆẈÀıııÀÀÀÀÀıÀẈË',
      'ËẊāìāııÀÀıāāāÀÀË',
      'ËẌęsęıÀÀÀÀęsęÀÀË',
      'ËıÀÀÀıÀÀÀoÀÀıÖÀË',
      'ËıÀÀıÀÀËËııÀÀııË',
      'ËÀÀÀÀıÀËËÀıÀıÀıË',
      'ËÀÖ÷÷ıııÀıı÷÷ÀẆË',
      'ËÀÀıııoÀÀoÀıÀıÀË',
      'ËÀÀıııÀ,,ııÀÀÀÀË',
      'ËËËËËËıÀııËËËËËË',
    ]),
    warps: [
      { x: 6, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 7, y: 10, to: { map: 'route1', x: 7, y: 14 } },
      { x: 8, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 9, y: 10, to: { map: 'route1', x: 7, y: 14 } },
    ],
    signs: [
      { x: 6, y: 3, text: "PROF. HAWTHORN'S LAB — Kin research. The professor is out on Route 1 today." },
      { x: 7, y: 3, text: "PROF. HAWTHORN'S LAB — Kin research. The professor is out on Route 1 today." },
    ],
    npcs: [
      { x: 10, y: 4, name: 'VALE', art: 'gary', skin: '#f0c8a0', shirt: '#3a5a9a', pants: '#2a2a3a', hair: '#6a4a2a',
        // Yellow homage (original lines): the rival's partner is a PRISMKIT.
        dialogue: ["Yo, {player}! The professor gave me a PRISMKIT — fluffy, clever, and all mine!", "He says it'll evolve to match how I battle. Just watch — we'll be champions!"] },
      // UI v2.3 (defect 5): the lab's storage terminal, standing at the lab
      // entrance — Dawnwick's lab has no interior map, so the terminal lives
      // here (and in every Center) rather than nowhere.
      { x: 5, y: 4, name: 'PC TERMINAL', art: 'pc', skin: '#c0c0c0', shirt: '#3a3a4a', pants: '#2a2a2a', hair: '#3a6ac0', pc: true,
        dialogue: ["Lab PC — Kin Storage System. The professor keeps a terminal by the door for trainers passing through. Access your boxes here."] },
    ],
    encounters: null,
    start: { x: 7, y: 7, dir: 'down' },
  },

  route1: {
    id: 'route1', name: 'Route 1', music: 'route1-theme',
    rows: rows([
      '≆≆≆≆≆≅≅≅≅≆≆≆≆≆',
      '≆,,,,≅≅≅≅,,,,≆',
      '≆,,,,Ẕ≄≅≅,,,,≆',
      '≆,,,,≅≅≅≅,,,,≆',
      '≆,,≇≅≅≅≅≅,,,,≆',
      '≆,,Ẅ≅≅≅≅≅,,≅≅≆',
      '≆,,≅≅SS≅≅,,≅≅≆',
      '≆,,≇≅≅≅≅≅,,≅ẋ≆',
      '≆,,,,≅Ẅ≅≅,,,,≆',
      '≆,,,,ẑ≅≅≅,,,,≆',
      '≆,,≅≅ẇ≅≅≅,,,,≆',
      '≆,,≅≅F≅≅≅,,≅ẅ≆',
      '≆,,,,≅≅≅≅,,,,≆',
      '≆,,,,≅ẕ≅≅,,,,≆',
      '≆,,,,≅≅≅≅,,,,≆',
      '≆≆≆≆≆≅≅≅≅≆≆≆≆≆',
    ]),
    warps: [
      { x: 5, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 6, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 7, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 8, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 5, y: 15, to: { map: 'pallet', x: 8, y: 10 } },
      { x: 6, y: 15, to: { map: 'pallet', x: 8, y: 10 } },
      { x: 7, y: 15, to: { map: 'pallet', x: 9, y: 10 } },
      { x: 8, y: 15, to: { map: 'pallet', x: 9, y: 10 } },
    ],
    signs: [
      { x: 5, y: 6, text: 'ROUTE 1 — Dawnwick to Fernmere City. Tall grass rustles with wild Kin.' },
    ],
    npcs: [
      { x: 9, y: 5, name: 'AIDE', art: 'aide', skin: '#f0c8a0', shirt: '#5d3fa5', pants: '#3a3a4a', hair: '#1a1a1a',
        dialogue: ["Wild Kin live in the tall grass! Walk through it and keep your eyes open.", "Weaken them first, then throw a Capture Orb. The professor gave you ten to start."] },
      { x: 6, y: 4, name: 'CAL', art: 'youngster', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#c0a03a',
        trainer: 'r1_cal',
        sight: { dir: 'left', range: 3 }, // Yellow-style: spots you, "!", walks up (down is blocked by the sign)
        dialogue: ["Heh! Nobody gets past me without a battle!", "Whoa... you're tougher than you look."] },
      { x: 7, y: 11, name: 'LISA', art: 'lass', skin: '#f0c8a0', shirt: '#c03a7a', pants: '#3a3a4a', hair: '#7a4a1a',
        trainer: 'r1_lisa',
        sight: { dir: 'up', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["DUNPLUME and I train here every morning! Care to spar?", "We'll be back stronger tomorrow, won't we, DUNPLUME?"] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'pidgey', min: 2, max: 4, weight: 45 },
        { species: 'rattata', min: 2, max: 4, weight: 45 },
        { species: 'spearow', min: 3, max: 5, weight: 10 },
      ],
    },
    start: null,
  },

  viridian: {
    id: 'viridian', name: 'Fernmere City', music: 'viridian-theme',
    rows: rows([
      'ÌÌÌÌÌÌÁÁĲÁÌÌÌÌÌÌ',
      'ÌĲ×ĲÁĲĲÌÌÁÁÁĲ×ĲÌ',
      'ÌÁăqăĲĲÌÌĲăăăÁÁÌ',
      'ÌÁěsěĲÁĲÁÁěsěĲÁÌ',
      'ÌÁÁÁÁĲââââÁÁĲĲÁÌ',
      'ÌĲÁÁĲÁAJKAĲÁÁĲĲÌ',
      'ÌÁÁ××ĲoÁĲoĲ××ÁĲÌ',
      'ÌĲÁĲĲĲĲĲÁĲĲĲÁÁÁÌ',
      'ÌÁ×FFĲÁÁÁĲÁFF×ÁÌ',
      'ÌÁÁÁĲĲÁ,,ĲĲÁÁÁÁÌ',
      'ÌÌÌÌÌÌĲÁĲĲÌÌÌÌÌÌ',
    ]),
    warps: [
      { x: 7, y: 5, to: { map: 'center', x: 4, y: 4 } },
      { x: 8, y: 5, to: { map: 'center', x: 5, y: 4 } },
      { x: 6, y: 0, to: { map: 'route2', x: 6, y: 12 } },
      { x: 7, y: 0, to: { map: 'route2', x: 7, y: 12 } },
      { x: 8, y: 0, to: { map: 'route2', x: 6, y: 12 } },
      { x: 9, y: 0, to: { map: 'route2', x: 7, y: 12 } },
      { x: 6, y: 10, to: { map: 'route1', x: 6, y: 1 } },
      { x: 7, y: 10, to: { map: 'route1', x: 7, y: 1 } },
      { x: 8, y: 10, to: { map: 'route1', x: 6, y: 1 } },
      { x: 9, y: 10, to: { map: 'route1', x: 7, y: 1 } },
    ],
    signs: [
      { x: 3, y: 6, text: 'FERNMERE CITY — The city of evergreen. The Center heals your team for free.' },
    ],
    npcs: [
      { x: 11, y: 7, name: 'HIKER', art: 'hiker', skin: '#d8a878', shirt: '#50368e', pants: '#4a4a5a', hair: '#3a2a1a',
        dialogue: ["Heading north? Route 2's grass is thicker — I saw a FUSSAPE up there yesterday.", "Fighting-types crack rock wide open. A FUSSAPE that knows Low Kick will humble Garran's PEBBLET."] },
    ],
    encounters: null,
    start: null,
  },

  center: {
    id: 'center', name: 'Center', music: 'center-theme', indoor: true,
    rows: rows([
      'ṗṘ::::::::',
      ':θḈḉḖβṢθγ:',
      ':ḋ!!!ζ!!ṣ:',
      ':ḝ!!αα!!!:',
      ':ω!!!!!!ζ:',
      ':ḊṢ!DD!ṣḊ:',
      '::::::::::',
    ]),
    warps: [
      { x: 4, y: 5, to: { map: 'viridian', x: 7, y: 6 } },
      { x: 5, y: 5, to: { map: 'viridian', x: 8, y: 6 } },
    ],
    signs: [],
    npcs: [
      { x: 4, y: 2, name: 'NURSE', art: 'nurse', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#f0a0b0', hair: '#e86a5a',
        dialogue: ["Welcome to the Center! Let me heal your team..."], heal: true,
        afterHeal: ["All better! Your Kin are fighting fit. Come back any time."] },
      // ADR-025 §4: Sparring Coach (Candy Coach House Rule) — present in
      // every Center's data; the scene only fields him while the rule is
      // on (loadMap gate in overworld.mjs).
      { x: 2, y: 2, name: 'SPARRING COACH', art: 'sparcoach', skin: '#c88a5a', shirt: '#c05a3a', pants: '#3a3a4a', hair: '#2a1a0a',
        sparCoach: true, sparSpecies: 'machop',
        dialogue: ["Name's Coach — I run sparring drills out of this Center.", "Beat my partner and you earn an XP Candy. Lose, and all it costs you is sweat. We can go as many rounds as you like."] },
    ],
    encounters: null,
    start: null,
  },

  route2: {
    id: 'route2', name: 'Route 2', music: 'route1-theme',
    rows: rows([
      '≊≊≊≊≊≉≉≉≉≊≊≊≊≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊,,,,≉≉ẖ≉,,,,≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊,,≉≉≉≉≉≉,,,,≊',
      '≊,,≉≉RR≉≉,,≉ẇ≊',
      '≊,,≉≉≉≉≉≉,,≉Ẋ≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊,,,,≉≉ẉ≉,,,,≊',
      '≊,,,,≉≉ẗ≉,,,,≊',
      '≊,,,,≉≉≉≉,,,,≊',
      '≊≊≊≊≊≉≉≉≉≊≊≊≊≊',
    ]),
    warps: [
      { x: 5, y: 0, to: { map: 'pewter', x: 7, y: 9 } },
      { x: 6, y: 0, to: { map: 'pewter', x: 7, y: 9 } },
      { x: 7, y: 0, to: { map: 'pewter', x: 8, y: 9 } },
      { x: 8, y: 0, to: { map: 'pewter', x: 8, y: 9 } },
      { x: 5, y: 13, to: { map: 'viridian', x: 5, y: 1 } },
      { x: 6, y: 13, to: { map: 'viridian', x: 6, y: 1 } },
      { x: 7, y: 13, to: { map: 'viridian', x: 9, y: 1 } },
      { x: 8, y: 13, to: { map: 'viridian', x: 10, y: 1 } },
    ],
    signs: [],
    npcs: [
      { x: 6, y: 3, name: 'RICK', art: 'youngster', skin: '#e8b888', shirt: '#a03a5f', pants: '#2a304a', hair: '#2a1a0a',
        trainer: 'r2_bug',
        sight: { dir: 'down', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["My bugs are gonna cocoon you! En garde!", "S-squashed... like a GRUBLET under a boot."] },
      { x: 7, y: 5, name: 'BEA', art: 'lass', skin: '#f0c8a0', shirt: '#e08a3a', pants: '#2c3049', hair: '#a05a2a',
        trainer: 'r2_camper',
        sight: { dir: 'down', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["I picnic here every day — battle me before you sit down!", "Not even a snack break slows you down!"] },
      { x: 7, y: 8, name: 'NIA', art: 'lass', skin: '#d8a878', shirt: '#3a9ac0', pants: '#2a3a4a', hair: '#1a1a1a',
        trainer: 'r2_jr',
        sight: { dir: 'up', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["Route 2 is MY training ground! Prove you belong here!", "You're stronger than the rumors said..."] },
      { x: 5, y: 10, name: 'ROB', art: 'camper', skin: '#c89878', shirt: '#9a603a', pants: '#3a3a3a', hair: '#4a3a2a',
        trainer: 'r2_hiker',
        sight: { dir: 'up', range: 4 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["These boulders are my training weights! Let's see your form!", "Rock-solid... defeat. Heh. Good scrap."] },
      // Yellow homage: the anime-trio ambush, reimagined with original
      // characters (no motto quotes, no trademarked team name — GC C4).
      // The duo flank the path; either one spotting you pulls BOTH in.
      { x: 3, y: 7, name: 'RUE', art: 'rue', skin: '#e8b888', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#3a2a1a',
        trainer: 'r2_duo', duoPartner: 'COLE',
        sight: { dir: 'right', range: 4 },
        dialogue: ["Hold it right there, kid.", "Beaten... by a kid?!"] },
      { x: 10, y: 7, name: 'COLE', art: 'cole', skin: '#d8a878', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#7a1a1a',
        trainer: 'r2_duo', duoPartner: 'RUE',
        sight: { dir: 'left', range: 4 },
        dialogue: ["Two of us, one of you.", "Retreat! Regroup! We'll be back with a better plan!"] },
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'caterpie', min: 3, max: 6, weight: 28 },
        { species: 'weedle', min: 3, max: 6, weight: 28 },
        { species: 'pidgey', min: 4, max: 6, weight: 22 },
        { species: 'nidoranm', min: 4, max: 7, weight: 10 },
        { species: 'mankey', min: 4, max: 7, weight: 14 },
      ],
    },
    items: [],
    hidden: [
      // ADR-025 §3 (Phase 3) source: Sparrow Feather — Route 2 hidden item.
      { x: 1, y: 12, item: 'sparrowfeather', n: 1 },
    ],
    start: null,
  },

  pewter: {
    id: 'pewter', name: 'Flintridge City', music: 'pewter-theme',
    rows: rows([
      'ÍÍÍÍÍÍÍÍÍÍÍÍÍÍÍÍ',
      'ÍĵĵĵÂoąîąąoÂĵÂĵÍ',
      'ÍÂąąąĵḁḁḁḁÂąąąÂÍ',
      'ÍÂğyğĵḁVYḁĵğyğÂÍ',
      'ÍÂØÂØĵÂ99ÂÂÂĵØÂÍ',
      'ÍĵÂÂĵÂÂÍÍĵĵÂÂĵĵÍ',
      'ÍÂÂØØĵoÂĵoĵØØÂĵÍ',
      'ÍĵÂĵĵĵĵĵÂĵĵĵÂÂÂÍ',
      'ÍÂÂFFĵÂÂÂĵÂFFØÂÍ',
      'ÍÂÂÂĵĵÂ,,ĵĵÂÂÂÂÍ',
      'ÍÍÍÍÍÍĵÂĵĵÍÍÍÍÍÍ',
    ]),
    warps: [
      { x: 7, y: 3, to: { map: 'gym', x: 5, y: 7 } },
      { x: 8, y: 3, to: { map: 'gym', x: 6, y: 7 } },
      { x: 6, y: 10, to: { map: 'route2', x: 6, y: 1 } },
      { x: 7, y: 10, to: { map: 'route2', x: 7, y: 1 } },
      { x: 8, y: 10, to: { map: 'route2', x: 6, y: 1 } },
      { x: 9, y: 10, to: { map: 'route2', x: 7, y: 1 } },
    ],
    signs: [
      { x: 3, y: 6, text: 'FLINTRIDGE CITY — A stone-gray city nestled between mountains.' },
      { x: 11, y: 6, text: 'FLINTRIDGE GYM — Leader: Garran. The rock-solid Kin trainer!' },
    ],
    npcs: [
      { x: 10, y: 4, name: 'COACH', art: 'coach', skin: '#d8a878', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        dialogue: ["Garran's rock-types shrug off electric attacks — your partner's sparks won't cut it in there.", "Catch a FUSSAPE on Route 2 — fighting beats rock, and they learn Low Kick young. Water or grass would work too, but you won't find those this side of the forest.", "You've got heart, kid. Take these Capture Orbs — on the house."],
        give: { flag: 'coach_balls', items: { pokeball: 3 }, text: '3 Capture Orbs' } },
    ],
    encounters: null,
    start: null,
  },

  gym: {
    id: 'gym', name: 'Flintridge Gym', music: 'gym-theme', indoor: true,
    rows: rows([
      'Ṛ===========',
      '=νḿṀλṁλ++Ḙθ=',
      '=ḙμṢ+++++μḗ=',
      '=++++++++++=',
      '=++++//++++=',
      '=++++//++++=',
      '=++++//++++=',
      '=+++)++)+++=',
      '=====DD=====',
    ]),
    warps: [
      { x: 5, y: 8, to: { map: 'pewter', x: 6, y: 4 } },
      { x: 6, y: 8, to: { map: 'pewter', x: 9, y: 4 } },
    ],
    signs: [],
    npcs: [
      { x: 5, y: 2, name: 'GARRAN', art: 'brock', skin: '#c89878', shirt: '#c8782a', pants: '#3a405a', hair: '#1a1a1a',
        trainer: 'brock',
        dialogue: ["I'm Garran! I'm Flintridge's Gym Leader! My rock-hard willpower is evident even in my Kin!", "Stone may endure for ages, but your resolve struck harder today. The Boulder Badge is yours."] },
    ],
    encounters: null,
    start: null,
  },
};

export const MAP_LIST = Object.keys(MAPS);

// Tile passability: walkable kinds.
// Wave 2: the composable door halves (center J/K, mart 1/2, gym V/Y,
// lab 4/5, wood 7/8) and entrance steps (9) are step-warp / threshold
// tiles exactly like the legacy D/E/C doors — warps remain
// coordinate-keyed in each map's warps[] list.
export const WALKABLE = new Set(['.', ',', 'D', 'E', 'C', 'F', 'J', 'K', '1', '2', 'V', 'Y', '4', '5', '7', '8', '9',
  // Premium+ W0: '_' grassground is walkable ground (grass texture, no
  // encounters — the encounter branches never test for '_').
  '_',
  // Wave 5b: the single-tile house doors (s house, w wood, y brick)
  // become step-warp thresholds now that the houses are enterable.
  // The chars occur ONLY as the 15 town house doors (13 warped, the 2
  // known decorative doors stay enclosed by roof/facade/border tiles).
  's', 'w', 'y',
  // Wave 4 dungeon floors: cave L, Tower Q, Vantage %, Plant & — each was
  // swapped 1:1 from the walkable '.' floor char, so floor stays floor.
  'L', 'Q', '%', '&',
  // Wave 5a interior floors (center !, mart $, house *, gym +, lab -)
  // swapped 1:1 from the walkable '.' floor char, plus the two walkable
  // dressings: ')' rug and '/' battle mat.
  '!', '$', '*', '+', '-', ')', '/',
  // Premium+ W5 (TX-2): town ground chars (U+00C0..U+00CA) are walkable
  // ground swapped 1:1 from '.'/'_' in the 11 settlements; the six
  // signature flora chars and the LD-4 waterglow floor char likewise.
  'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê',
  '÷', 'ø', 'ù', 'ú', 'û', 'ü', 'Ā',
  // Premium+ W5 round 2: town ground II chars (U+0131..U+0144 subset).
  'ı', 'Ĳ', 'ĵ', 'ķ', 'ĸ', 'ĺ', 'ļ', 'ľ', 'ŀ', 'ł', 'ń',
  // Premium+ W6 (TX-4/TX-5): the walkable W6 kinds — rug patterns
  // (rug2/rug3/redcarpet, W6_KIND_DEFS idx 98-100) and the dungeon
  // floor families (icefloor/frostfloor/icepool idx 103-105, moonmoss
  // 109, stratafloor 115, crackedfloor 118, cerfloor/cerpool 123-124,
  // gratefloor/cablefloor 130-131), chars U+1E00+idx (tiles.mjs). Each
  // was swapped 1:1 from a walkable floor char, so floor stays floor.
  ...[98, 99, 100, 103, 104, 105, 109, 115, 118, 123, 124, 130, 131]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 1.5 Stage O1: the Amber floor kinds (sand / tropgrass /
  // shrinefloor / stadiumfloor — O1_KIND_DEFS idx 6,7,8,10 at
  // U+1E00+152, tiles.mjs) are walkable ground, swapped from walkable
  // ground chars, so floor stays floor.
  ...[158, 159, 160, 162]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 2 Stage J3a: the Yamato floor kinds (cityfloor / woodfloor —
  // J3_KIND_DEFS idx 5,6 at U+1E00+164, tiles.mjs) and the six Yamato
  // settlements' town-ground chars (tg at idx 173+i*8, tg2 at +1,
  // tiles.mjs JOHTO_TOWN_CHARS) are walkable ground, swapped from
  // walkable ground chars, so floor stays floor.
  ...[169, 170]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .flatMap((i) => [173 + i * 8, 174 + i * 8])
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 3 Stage H3a: the Maris floor kinds (ashground / desertsand /
  // boardwalk — H3_KIND_DEFS idx 0,1,2 at U+1E00+261, tiles.mjs) and
  // the eleven Maris settlements' town-ground chars (tg at idx
  // 268+i*8, tg2 at +1, tiles.mjs HOENN_TOWN_CHARS) are walkable
  // ground, swapped from walkable ground chars, so floor stays floor.
  ...[261, 262, 263]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .flatMap((i) => [268 + i * 8, 269 + i * 8])
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 3 Stage H3b: the five east-Maris settlements' town-ground
  // chars (tg at idx 356+i*8, tg2 at +1, tiles.mjs HOENN_TOWN_CHARS
  // towns 11..15) and the H3b floor kinds (seasand / kelpbed /
  // current — H3B_KIND_DEFS idx 0,1,2 at U+1E00+396, tiles.mjs) are
  // walkable ground, swapped from walkable ground chars.
  ...[0, 1, 2, 3, 4]
    .flatMap((i) => [356 + i * 8, 357 + i * 8])
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  ...[396, 397, 398]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 4 Stage S3a: the ten west/central-Borea settlements' town-
  // ground chars (tg at idx 412+i*8, tg2 at +1, tiles.mjs
  // SINNOH_TOWN_CHARS towns 0..9) and the S3 floor kinds
  // (flowerfield / harbourstone / coronetfloor — S3_KIND_DEFS idx
  // 0,1,2 at U+1E00+404, tiles.mjs) are walkable ground, swapped
  // from walkable ground chars, so floor stays floor. (S3b appends
  // the four east towns' ground chars at idx 492+i*8.)
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .flatMap((i) => [412 + i * 8, 413 + i * 8])
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  ...[404, 405, 406]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Arc 4 Stage S3b: the four east-Borea settlements' town-ground
  // chars (tg at idx 492+i*8, tg2 at +1, tiles.mjs SINNOH_TOWN_CHARS
  // towns 10..13) and the S3B floor kinds (marshbog / distortfloor /
  // distortfalls — S3B_KIND_DEFS idx 0,1,2 at U+1E00+524, tiles.mjs)
  // are walkable ground, swapped from walkable ground chars.
  ...[0, 1, 2, 3]
    .flatMap((i) => [492 + i * 8, 493 + i * 8])
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  ...[524, 525, 526]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Perfection Pass Stage 2 Gate 0 (G0-4): the facade-panel char
  // (U+1E00+532, tiles.mjs G0_KIND_DEFS) is walkable — it replaces
  // walkable false-door chars 1:1 ('s'/'w'/'D' at cells with no warp),
  // so walkable stays walkable.
  ...[532]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Perfection Pass Stage 2 Gate 2 (G2): the beach transition chars
  // (block idx 533..562, tiles.mjs G2_KIND_DEFS) are walkable floor,
  // swapped 1:1 from walkable tropgrass/path cells in the Amber
  // Islands, so floor stays floor.
  ...[533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548,
    549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T6: the tidechart rug char (U+1E00+566, tiles.mjs
  // T6_KIND_DEFS) is walkable — a ground decal on the Fan Club
  // porch, swapped 1:1 from a walkable boardwalk cell.
  ...[566]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF: the kit-identity street floors (settfloor /
  // marblefloor — WD_KIND_DEFS idx 577,578 at U+1E00+577, tiles.mjs)
  // are walkable street material, swapped 1:1 from the walkable '.'
  // path char in Cragmoor / Lastlight, so floor stays floor.
  // Wave W-DIFF2: the second pair's street floors (avenuefloor /
  // wornfloor — idx 581,582) join on the same terms for Farsight /
  // Lantern City.
  ...[577, 578, 581, 582]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T24: the clockbed char (U+1E00+587, tiles.mjs T24_KIND_DEFS;
  // authored at 583, re-indexed to 587 at the T24 merge) is walkable
  // ground — the Flower Clock's petal-soil bed in Eldergrove, swapped
  // 1:1 from walkable 'F' flower cells, so floor stays floor.
  ...[587]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T25: the reedbank char (U+1E00+591, tiles.mjs T25_KIND_DEFS)
  // is walkable ground — Meadowbrook's dressed pond banks, swapped
  // 1:1 from walkable 'F' flower cells, so floor stays floor.
  ...[591]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF3: the violetfloor char (U+1E00+592, tiles.mjs
  // WD3_KIND_DEFS; re-indexed from 588 — T25 took 588-591) is
  // walkable street material, swapped 1:1 from the walkable '.'
  // path char in Iris City, so floor stays floor.
  ...[592]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF4: the brickfloor char (U+1E00+594, tiles.mjs
  // WD4_KIND_DEFS) is walkable street material, swapped 1:1 from
  // the walkable '.' path char in Cinder Town, and the
  // gravelfloor char (U+1E00+596) likewise in Redwood Town, so
  // floor stays floor in both.
  ...[594, 596]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T26: the cutstonefloor char (U+1E00+599, tiles.mjs
  // T26_KIND_DEFS) is walkable street material — Copperton's
  // avenue stone, swapped onto the town's street cells (which
  // shipped as walkable tg2 mud), so floor stays floor. The
  // gardenfloor char (U+1E00+601) is walkable ground — the HQ
  // forecourt's formal beds, swapped 1:1 from walkable tg2,
  // so floor stays floor (T24 clockbed precedent). (Indices
  // 598-601 per the Director's index ruling: W-DIFF4 holds
  // 594-597.)
  ...[599, 601]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF5: the marshfloor char (U+1E00+602, tiles.mjs
  // WD5_KIND_DEFS) is walkable street material, swapped 1:1
  // from the walkable '.' path char in Bramble City, and the
  // driftfloor char (U+1E00+604) likewise in Tidewall City,
  // so floor stays floor in both.
  ...[602, 604]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T27: the plankfloor char (U+1E00+609, tiles.mjs
  // T27_KIND_DEFS) is walkable street material — Mistford's
  // boardwalk, swapped onto the town's street cells (which
  // shipped as walkable tg2 mud), so floor stays floor.
  ...[609]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF6: the slatefloor char (U+1E00+613, tiles.mjs
  // WD6_KIND_DEFS) is walkable street material, swapped 1:1
  // from the walkable '.' path char in Fernmere City, and the
  // promfloor char (U+1E00+615) likewise in Canopy City,
  // so floor stays floor in both.
  ...[613, 615]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T28: the quayfloor char (U+1E00+618, tiles.mjs
  // T28_KIND_DEFS) is walkable street material — Fairhaven's
  // running-bond quay stone, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud), so floor stays
  // floor. (Indices 617-621 per the Director's index ruling:
  // W-DIFF6 holds 613-616.)
  ...[618]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF7: the pierfloor char (U+1E00+622, tiles.mjs
  // WD7_KIND_DEFS) is walkable street material — Tidehaven's
  // pier planks, swapped 1:1 from the walkable '.' path char
  // (and the walkable boardwalk dock cells) in Tidehaven City,
  // so floor stays floor.
  ...[622]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T29: the gridfloor char (U+1E00+626, tiles.mjs
  // T29_KIND_DEFS) is walkable street material — Lilac City's
  // bronze sett grid, swapped onto the town's street cells
  // (which shipped as walkable tg2 mud), so floor stays
  // floor. (Indices 625-628 after the Director's re-index
  // ruling: W-DIFF7 holds 622-624; 606-607 stay empty.)
  ...[626]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF8: the shinglefloor char (U+1E00+629, tiles.mjs
  // WD8_KIND_DEFS) is walkable street material — Hushmoor's
  // dark gravel, swapped 1:1 from the walkable '.' path char
  // in Hushmoor Town, and the inlayfloor char (U+1E00+631)
  // likewise in Blossom City, so floor stays floor in both.
  ...[629, 631]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T30: the petalfloor char (U+1E00+634, tiles.mjs
  // T30_KIND_DEFS) is walkable street material — Wildflower
  // Town's petal-flecked garden lane, swapped onto the town's
  // street cells (which shipped as walkable tg2 mud), so
  // floor stays floor. (Indices 633-636 after the Director's
  // re-index ruling: W-DIFF8 holds 629-632; 606-607 stay empty.)
  ...[634]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T31: the harbourfloor char (U+1E00+646, tiles.mjs
  // T31_KIND_DEFS) is walkable street material — Beacon City's
  // harbour plank decking, swapped onto the town's street cells
  // (shipped as walkable tg2 mud / tg), and the jettyfloor char
  // (U+1E00+647) likewise at the Route 40 landfall jetty
  // (swapped from water at the crossing seam — the jetty is the
  // crossing's landing, so floor replaces surf there), so floor
  // stays floor. (Indices 645-648 per the Director's ruling:
  // W-DIFF8 holds 629-632; T30 claims from 633 in parallel;
  // 606-607 stay empty.)
  ...[646, 647]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T32: the ashfloor char (U+1E00+661, tiles.mjs
  // T32_KIND_DEFS) is walkable street material — Ashfall
  // Town's swept-ash lane, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud), so floor
  // stays floor. (Indices 660-662: main's ceiling was 636;
  // 637-659 left clear for the parallel T31 Beacon claim.)
  ...[661]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T33: the steamfloor char (U+1E00+673, tiles.mjs
  // T33_KIND_DEFS) is walkable street material — Steamspring
  // Town's rust flagstone, swapped onto the town's street cells
  // (which shipped as walkable tg2 mud), and the terracefloor
  // char (U+1E00+674) likewise on the hot spring's terrace
  // ring, so floor stays floor. (Indices 672-675 per the
  // Director's ruling: main's kinds run 594-636 + 645-648;
  // T32 Ashfall holds 660-662; 606-607 stay empty.)
  ...[673, 674]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T34: the canopyfloor char (U+1E00+685, tiles.mjs
  // T34_KIND_DEFS) is walkable street material — Highbranch
  // City's lashed-plank walkway, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud), so floor stays
  // floor. (Indices 684-687, above T33's parallel 672-675 claim;
  // 606-607 stay empty.)
  ...[685]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T35: the cobblefloor char (U+1E00+697, tiles.mjs
  // T35_KIND_DEFS) is walkable street material — Lotus Cove
  // City's round-cobble harbour stone, swapped onto the town's
  // street cells (which shipped as walkable tg2 mud, walkable
  // ground and — at the Route 124 surf exits — open water, the
  // jetty-head swap of the T31 Beacon precedent), so floor
  // stays floor. (Indices 696-699 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675; the parallel T34 claim holds 684-687; 606-607
  // stay empty.)
  ...[697]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T36: the starfloor char (U+1E00+709, tiles.mjs
  // T36_KIND_DEFS) is walkable street material — Starfall
  // City's star-sand lane, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud), and the
  // dockfloor char (U+1E00+710) likewise on the town's three
  // surf-seam piers and its E bridge (all cells that shipped
  // as walkable water), so floor stays floor. (Indices
  // 708-711 per the Director's index ruling: main's kinds run
  // 594-636 + 645-648 + 660-662 + 672-675 + 684-687; 606-607
  // stay empty, 688-707 left clear.)
  ...[709, 710]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T37: the craterfloor char (U+1E00+721, tiles.mjs
  // T37_KIND_DEFS) is walkable street material — Craterlake
  // City's white crater sett, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud and walkable
  // ground), so floor stays floor. (Indices 720-724 per the
  // Director's index ruling: main's kinds run 594-636 +
  // 645-648 + 660-662 + 672-675 + 684-687 + 696-699; the
  // parallel T36 claim holds 708-711; 712-719 stay empty.)
  ...[721]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T38: the raftfloor char (U+1E00+732, tiles.mjs
  // T38_KIND_DEFS) is walkable street material — Driftlog
  // Town's lashed-log street, swapped onto the town's avenue
  // cells (which shipped as walkable boardwalk) and onto the
  // two r131 exit cells at the landfall nose (which shipped as
  // open water — the jetty-head swap of the T31 Beacon
  // precedent), so floor stays floor; and the coraldoor char
  // (U+1E00+734) likewise — Driftlog's coral door face, swapped
  // onto the three boat-houses' facade-panel cells, which
  // shipped walkable as facade-panel, so the doors stay
  // walkable. (Indices 732-736 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724; the gaps
  // stay empty.)
  ...[732, 734]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T39: the plateaufloor char (U+1E00+744, tiles.mjs
  // T39_KIND_DEFS) is walkable street material — Perennial
  // City's parade marble, swapped onto the town's street cells
  // (which shipped as walkable tg2 mud, walkable ground and two
  // water exit cells), so floor stays floor. (Indices 744-748
  // per the Director's index ruling: main's kinds run 594-636 +
  // 645-648 + 660-662 + 672-675 + 684-687 + 696-699 + 708-711 +
  // 720-724; the parallel T38 claim holds 732-736; gaps stay
  // empty.)
  ...[744]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T40: the cloverfloor char (U+1E00+756, tiles.mjs
  // T40_KIND_DEFS) is walkable street material — Clover
  // Town's clover-flecked packed-earth lane, swapped onto
  // the town's tg2 street cells (the front street, the
  // through road, the main lane — all shipped walkable as
  // tg2), so floor stays floor. (Indices 756-759 per the
  // Director's index ruling: main's kinds run 594-636 +
  // 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
  // 708-711 + 720-724 + 732-736 + 744-748 (T39); the gaps
  // stay empty.)
  ...[756]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T41: the shellfloor char (U+1E00+768, tiles.mjs
  // T41_KIND_DEFS) is walkable street material — Shingle
  // Town's raked shell-sand, swapped onto the town's street
  // cells (which shipped as walkable tg2 mud or walkable
  // ground), so floor stays floor. (Indices 768-771 per the
  // Director's index ruling: main's kinds run 594-636 +
  // 645-648 + 660-662 + 672-675 + 684-687 + 696-699 + 708-711 +
  // 720-724 + 732-736 + 744-748; the parallel T40 claim holds
  // 756-759; gaps stay empty.)
  ...[768]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T42: the beamfloor char (U+1E00+780, tiles.mjs
  // T42_KIND_DEFS) is walkable street material — Revelry
  // City's steel signal slab, swapped onto the town's tg2
  // street cells (the front street, the east-west avenue, the
  // gate avenues — all shipped walkable as tg2), so floor
  // stays floor. (Indices 780-783 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 (T39) + 756-759 (T40); the parallel
  // T41 claim holds 768-771; gaps stay empty.)
  ...[780]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T43: the clinkerfloor char (U+1E00+792, tiles.mjs
  // T43_KIND_DEFS) is walkable street material — Coalseam
  // City's packed clinker-ash cartway, swapped onto the
  // town's street cells (which shipped as walkable tg2 mud),
  // so floor stays floor. (Indices 792-795 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771; the parallel T42 claim holds
  // 780-783; gaps stay empty.)
  ...[792]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T44: the honeyfloor char (U+1E00+804, tiles.mjs
  // T44_KIND_DEFS) is walkable street material — Honeyfield
  // Town's honeycomb lane, swapped onto the town's tg2 street
  // cells (the front street, the through road, the Ruined Path
  // avenue — all shipped walkable as tg2), so floor stays
  // floor. (Indices 804-807 per the Director's index ruling:
  // main's kinds run 594-636 + 645-648 + 660-662 + 672-675 +
  // 684-687 + 696-699 + 708-711 + 720-724 + 732-736 + 744-748
  // (T39) + 756-759 (T40) + 768-771 (T41) + 780-783 (T42); the
  // parallel T43 claim holds 792-795; gaps stay empty.)
  ...[804]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T45: the heritagefloor char (U+1E00+816, tiles.mjs
  // T45_KIND_DEFS) is walkable street material — Heritage
  // City's worn flagstone street, swapped onto the town's
  // street cells (which shipped as walkable tg2 mud), so floor
  // stays floor. (Indices 816-819 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771 + 780-783 + 792-795; the
  // parallel T44 claim holds 804-807; gaps stay empty.)
  ...[816]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T46: the giltfloor char (U+1E00+828, tiles.mjs
  // T46_KIND_DEFS) is walkable street material — Inglenook
  // City's warm gilt setts, swapped onto the town's tg2 street
  // cells (the front street, the avenues, the west road — all
  // shipped walkable as tg2), so floor stays floor. (Indices
  // 828-831 per the Director's index ruling: main's kinds run
  // 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
  // 708-711 + 720-724 + 732-736 + 744-748 + 756-759 + 768-771 +
  // 780-783 + 792-795 + 804-807; the parallel T45 claim holds
  // 816-819; gaps stay empty.)
  ...[828]
    .map((i) => String.fromCodePoint(0x1E00 + i)),  // Wave T47: the pebblefloor char (U+1E00+840, tiles.mjs
  // T47_KIND_DEFS) is walkable street material — Repose
  // Town's river-pebble cobble, swapped onto the town's tg2
  // street cells (the front street, the north/south avenues,
  // the ruins approach — all shipped walkable as tg2), so
  // floor stays floor. (Indices 840-843 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 +
  // 660-662 + 672-675 + 684-687 + 696-699 + 708-711 +
  // 720-724 + 732-736 + 744-748 + 756-759 + 768-771 +
  // 780-783 + 792-795 + 804-807 + 816-819; the parallel
  // T46 claim holds 828-831; gaps stay empty.)
  ...[840]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T48: the shardfloor char (U+1E00+852, tiles.mjs
  // T48_KIND_DEFS) is walkable street material — Shardfall
  // City's cracked meteor-slate flags, swapped onto the town's
  // tg2 street cells (the front street, the two south avenues,
  // the row-13 boulevard — all shipped walkable as tg2), so
  // floor stays floor. (Indices 852-855 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771 + 780-783 + 792-795 + 804-807 +
  // 816-819 + 828-831; the parallel T47 claim holds 840-843;
  // gaps stay empty.)
  ...[852]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T49: the ringfloor char (U+1E00+864, tiles.mjs
  // T49_KIND_DEFS) is walkable street material — Bridgeport
  // City's ring-inset quay flags, swapped onto the town's tg2
  // street cells (the front street, the library lane, the
  // bridge avenue — all shipped walkable as tg2), so floor
  // stays floor. (Indices 864-868 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 + 756-759 + 768-771 + 780-783 +
  // 792-795 + 804-807 + 816-819 + 828-831 + 840-843; the
  // parallel T48 claim holds 852-855; gaps stay empty.)
  ...[864]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T49: the trussfloor char (U+1E00+868, tiles.mjs
  // T49_KIND_DEFS) is walkable street material — the iron
  // truss deck of Bridgeport's one bridge, swapped onto the
  // shipped span's four boardwalk cells at rows 8-9.
  ...[868]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T50: the walkfloor char (U+1E00+876, tiles.mjs
  // T50_KIND_DEFS) is walkable street material — Fenland
  // City's marsh boardwalk, swapped onto the town's tg2
  // street cells (the front street, the avenues, the marsh
  // road, the south road — all shipped walkable as tg2), so
  // floor stays floor. (Indices 876-879 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771 + 780-783 + 792-795 + 804-807 +
  // 816-819 + 828-831 + 840-843 + 852-855; the parallel
  // T49 claim holds 864-868; gaps stay empty.)
  ...[876]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T51: the moonfloor char (U+1E00+888, tiles.mjs
  // T51_KIND_DEFS) is walkable street material — Astral
  // Town's pale moonstone flags, swapped onto the town's tg2
  // street cells (the front street, the south road, the east
  // arm and the avenues — all shipped walkable as tg2), so
  // floor stays floor. (Indices 888-891 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 + 756-759 + 768-771 + 780-783 +
  // 792-795 + 804-807 + 816-819 + 828-831 + 840-843 +
  // 852-855 + 864-868; the parallel T50 claim holds 876-879;
  // gaps stay empty.)
  ...[888]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T52: the rimefloor char (U+1E00+900, tiles.mjs
  // T52_KIND_DEFS) is walkable street material — Rimefall
  // City's packed-snow street, swapped onto the town's tg2
  // street cells (the front street, the lake road, the
  // temple / Mart / harbour avenues, the SOLVI lane and the
  // lake exit cells — all shipped walkable as tg2), so floor
  // stays floor. (Indices 900-903 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 + 756-759 + 768-771 + 780-783 + 792-795 +
  // 804-807 + 816-819 + 828-831 + 840-843 + 852-855 + 864-868 +
  // 876-879 + 888-891 (T51); 892-899 stay empty.)
  ...[900]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T53: the panelfloor char (U+1E00+912, tiles.mjs
  // T53_KIND_DEFS) is walkable street material — Brightshore
  // City's golden solar-panel grid, swapped onto the town's
  // tg2 street cells (the front street, the north road, the
  // central avenue, the main street, the shore connector +
  // shore road, the lighthouse lane and the exit/landing
  // cells — all shipped walkable as tg2), so floor stays
  // floor. (Indices 912-915 per the Director's index ruling:
  // main's kinds run 594-636 + 645-648 + 660-662 + 672-675 +
  // 684-687 + 696-699 + 708-711 + 720-724 + 732-736 + 744-748 +
  // 756-759 + 768-771 + 780-783 + 792-795 + 804-807 + 816-819 +
  // 828-831 + 840-843 + 852-855 + 864-868 + 876-879 + 888-891;
  // the parallel T52 claim holds 900-903; 904-911 stay empty.)
  ...[912]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T54: the basaltfloor char (U+1E00+924, tiles.mjs
  // T54_KIND_DEFS) is walkable street material — Clashfield's
  // fitted basalt-slab street, swapped onto the town's tg2
  // street cells (the front street, the main street / hard
  // road, the harbour lane, the west + registrar arms and the
  // r225 / r230 exit cells — all shipped walkable as tg2), so
  // floor stays floor. (Indices 924-927 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 + 756-759 + 768-771 + 780-783 + 792-795 +
  // 804-807 + 816-819 + 828-831 + 840-843 + 852-855 + 864-868 +
  // 876-879 + 888-891 + 900-903 (T52); the parallel T53 claim
  // holds 912-915; 904-911 + 916-923 stay empty.)
  ...[924]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T55: the hardpanfloor char (U+1E00+936, tiles.mjs
  // T55_KIND_DEFS) is walkable street material — Wildreach's
  // hard-packed sand-and-gravel, swapped onto the town's tg2
  // street cells (the front street, the hard road, the Palmside
  // road, the cook's lane, Wren's spur, the cottage step-offs
  // and the exit/landing cells — all shipped walkable as tg2),
  // so floor stays floor. (Indices 936-939 per the Director's
  // index ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771 + 780-783 + 792-795 + 804-807 +
  // 816-819 + 828-831 + 840-843 + 852-855 + 864-868 + 876-879 +
  // 888-891 + 900-903 + 912-915; the parallel T54 claim holds
  // 924-927; 928-935 stay empty.)
  ...[936]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T56: the coralfloor char (U+1E00+948, tiles.mjs
  // T56_KIND_DEFS) is walkable street material — Palmside's
  // fitted coral-flag street, swapped onto the town's tg2
  // street cells (the north lane, the front street, the west /
  // centre / east lanes, the great road, the south lanes +
  // street and the r226 / r227 / r228 / r229 exit cells — all
  // shipped walkable as tg2), so floor stays floor. (Indices
  // 948-951 per the Director's index ruling: main's kinds run
  // 594-636 + 645-648 + 660-662 + 672-675 + 684-687 + 696-699 +
  // 708-711 + 720-724 + 732-736 + 744-748 + 756-759 + 768-771 +
  // 780-783 + 792-795 + 804-807 + 816-819 + 828-831 + 840-843 +
  // 852-855 + 864-868 + 876-879 + 888-891 + 900-903 (T52) +
  // 912-915 (T53) + 924-927 (T54); the parallel T55 claim holds
  // 936-939; 940-947 stay empty.)
  ...[948]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T57: the dunefloor char (U+1E00+960, tiles.mjs
  // T57_KIND_DEFS) is walkable street material — Marisol's
  // wind-rippled coral sand, swapped onto the island's whole
  // shipped street blob (authored as the generic `path` sand)
  // plus the surf-exit jetty head at the east edge, so floor
  // stays floor. (Indices 960-963 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 + 732-736 +
  // 744-748 + 756-759 + 768-771 + 780-783 + 792-795 + 804-807 +
  // 816-819 + 828-831 + 840-843 + 852-855 + 864-868 + 876-879 +
  // 888-891 + 900-903 + 912-915 + 924-927 + 936-939; the
  // parallel T56 claim holds 948-951; 940-947 + 952-959 stay
  // empty.)
  ...[960]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T58: the grovefloor char (U+1E00+972, tiles.mjs
  // T58_KIND_DEFS) is walkable street material — Tangelo's
  // furrowed grove-earth street, swapped onto the town's path
  // street cells + the SW surf jetty head, so floor stays floor.
  // (Indices 972-976 per the Director's index ruling: main's
  // kinds run through 948-951 (T56) + 960-963 (the parallel T57
  // claim); 952-959 + 964-971 stay empty.)
  ...[972]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T59: the screefloor char (U+1E00+984, tiles.mjs
  // T59_KIND_DEFS) is walkable street material — Pomelo's
  // crushed-granite scree, swapped onto the island's whole
  // shipped street blob (authored as the generic `path`
  // sand) plus BOTH surf-exit jetty heads, so floor stays
  // floor. (Indices 984-987 per the Director's index
  // ruling: main's kinds run 594-636 + 645-648 + 660-662 +
  // 672-675 + 684-687 + 696-699 + 708-711 + 720-724 +
  // 732-736 + 744-748 + 756-759 + 768-771 + 780-783 +
  // 792-795 + 804-807 + 816-819 + 828-831 + 840-843 +
  // 852-855 + 864-868 + 876-879 + 888-891 + 900-903 +
  // 912-915 + 924-927 + 936-939 + 948-951 (T56) + 960-963
  // (T57); the parallel T58 claim holds 972-976; 964-971 +
  // 977-983 stay empty.)
  ...[984]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T60: the ruinfloor char (U+1E00+996, tiles.mjs
  // T60_KIND_DEFS) is walkable street material — Bergamot's
  // ruin-flag street, swapped onto the island's whole shipped
  // street blob (authored as the generic `path` dirt track)
  // plus the north surf-exit jetty head, so floor stays
  // floor. (Indices 996-999 per the Director's index ruling:
  // main's kinds run 594-636 + 645-648 + 660-662 + 672-675 +
  // 684-687 + 696-699 + 708-711 + 720-724 + 732-736 + 744-748 +
  // 756-759 + 768-771 + 780-783 + 792-795 + 804-807 + 816-819 +
  // 828-831 + 840-843 + 852-855 + 864-868 + 876-879 + 888-891 +
  // 900-903 + 912-915 + 924-927 + 936-939 + 948-951 (T56) +
  // 960-963 (T57) + 972-976 (T58); the parallel T59 claim
  // holds 984-987; 964-971 + 977-983 + 988-995 stay empty.)
  ...[996]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T61: the reeffloor char (U+1E00+1008, tiles.mjs
  // T61_KIND_DEFS) is walkable street material — Reefside's
  // pink shell sand, swapped onto the island's whole shipped
  // street blob (authored as the generic `path` sand) plus the
  // north surf-exit jetty head, so floor stays floor.
  // (Indices 1008-1011 per the Director's index ruling: main's
  // kinds run …948-951 + 960-963 + 972-976 + 984-987; the
  // parallel T60 claim holds 996-999; 988-995 + 1000-1007
  // stay empty.)
  ...[1008]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T62: the mosaicfloor char (U+1E00+1020, tiles.mjs
  // T62_KIND_DEFS) is walkable street material — Calamondin's
  // pool-mosaic street, swapped onto the island's whole shipped
  // street graph (authored as the generic `path` dirt track)
  // plus the SW surf-exit jetty root, so floor stays floor.
  // (Indices 1020-1023 per the Director's index ruling: main's
  // kinds run …996-999 (T60); the parallel T61 claim holds
  // 1008-1011; 1000-1007 + 1012-1019 stay empty.)
  ...[1020]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T63: the leaguefloor char (U+1E00+1032, tiles.mjs
  // T63_KIND_DEFS) is walkable street material — Grapefruit's
  // herringbone clay pavers, swapped onto the island's whole
  // shipped street graph (authored as the generic `path` dirt
  // track) plus the west surf-exit jetty head, so floor stays
  // floor. (Indices 1032-1035 per the Director's index ruling:
  // main's kinds run …996-999 + 1008-1011 on this base; the
  // parallel T62 claim holds 1020-1023; 1012-1019 + 1024-1031
  // stay empty.)
  ...[1032]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T64: the stepfloor char (U+1E00+1044, tiles.mjs
  // T64_KIND_DEFS) is walkable street material — Sanctum's
  // festival-stepping street, swapped onto the island's whole
  // shipped street graph (authored as the generic `path` dirt
  // track) plus the four surf-exit jetty heads + necks, so
  // floor stays floor.
  // (Indices 1044-1047 per the Director's index ruling: main's
  // kinds run …1020-1023 (T62); the parallel T63 claim holds
  // 1032-1035; 1036-1043 stay empty.)
  ...[1044]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave T65: the trialfloor char (U+1E00+1056, tiles.mjs
  // T65_KIND_DEFS) is walkable street material — the Trial
  // Grounds' flecked sandstone flags, swapped onto the hub's
  // whole shipped street graph (authored as the generic `path`
  // dirt track), so floor stays floor. (Indices 1056-1059 per
  // the Director's index ruling: main's kinds run …1032-1035
  // on this base; the parallel T64 claim holds 1044-1047;
  // 1036-1043 + 1048-1055 stay empty.)
  ...[1056]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF9: the strandfloor char (U+1E00+1068, tiles.mjs
  // WD9_KIND_DEFS) is walkable street material — Dawnwick's
  // swept shore-strand bands, swapped 1:1 from the walkable
  // '.' path char in Dawnwick, and the tramfloor char
  // (U+1E00+1070) likewise in Signal City, so floor stays
  // floor in both. (Indices 1068-1072 per the Director's
  // index ruling: main's kinds run through T65's 1056-1059;
  // 1048-1055 + 1060-1067 stay empty.)
  ...[1068, 1070]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W-DIFF10: the flagfloor char (U+1E00+1080, tiles.mjs
  // WD10_KIND_DEFS) is walkable street material — Flintridge's
  // cut-stone flags, swapped 1:1 from the walkable '.' path
  // char in Flintridge, and the veinfloor char (U+1E00+1083)
  // likewise in Crownspire and the lakefloor char
  // (U+1E00+1085) likewise in Galefield, so floor stays floor
  // in all three. (Indices 1080-1086 per the Director's index
  // ruling: main's kinds run through T65's 1056-1059 and
  // W-DIFF9's 1068-1072 on its parallel branch; 1048-1055 +
  // 1060-1067 + 1073-1079 stay empty.)
  ...[1080, 1083, 1085]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-A: the Arden tranche-1 route ground/path chars
  // (U+1E00+1092.., tiles.mjs W17A_KIND_DEFS) are walkable —
  // chalkturf/chalkfloor (Route 1), needleturf/needlefloor
  // (Route 2), screegrit/shelffloor (Route 3), terraceturf/
  // ledgefloor (Route 4), gardenmeadow/bloomfloor (Route 5),
  // each swapped 1:1 from the walkable '_' ground / '.' path
  // chars on its own route, so floor stays floor. (Indices
  // 1092-1110 per the Director's index ruling: main's kinds
  // run through W-DIFF10's 1080-1086; 1087-1091 stay empty.)
  ...[1092, 1093, 1096, 1097, 1099, 1100, 1103, 1104, 1107, 1108]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-B: the Arden tranche-2 route ground/path chars
  // (U+1E00+1112.., tiles.mjs W17B_KIND_DEFS) are walkable —
  // pondturf/lilyfloor (Route 6), fenceturf/gatefloor
  // (Route 7), perfumeturf/perfumefloor (Route 8), boulderturf/
  // boulderfloor (Route 9), conductturf/conductfloor
  // (Route 10), each swapped 1:1 from the walkable '_' ground /
  // '.' path chars on its own route, so floor stays floor.
  // (Indices 1112-1131 per the Director's index ruling: W17-A
  // took 1092-1110 on its parallel branch; 1111 stays empty.)
  ...[1112, 1113, 1116, 1117, 1120, 1121, 1124, 1125, 1128, 1129]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-C: the Arden tranche-3 route ground/path chars
  // (U+1E00+1132.., tiles.mjs W17C_KIND_DEFS) are walkable —
  // hollowturf/trenchfloor (Route 11), reedturf/reedfloor
  // (Route 12), copyturf/copyfloor (Route 15), slopeturf/
  // asphaltfloor (Route 16), beachturf/shorefloor (Route 19),
  // each swapped 1:1 from the walkable '_' ground / '.' path
  // chars on its own route, so floor stays floor. (Indices
  // 1132-1151 per the Director's index ruling: W17-A took
  // 1092-1110, W17-B takes 1112-1131 on its parallel branch;
  // 1111 stays empty.)
  ...[1132, 1133, 1136, 1137, 1140, 1141, 1144, 1145, 1148, 1149]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-D: the Arden tranche-4 ground/path/floor chars
  // (U+1E00+1152.., tiles.mjs W17D_KIND_DEFS) are walkable —
  // rimeshore/surfloor (Route 20), leagueturf/leaguewayfloor
  // (Route 22), each swapped 1:1 from the walkable '_' ground /
  // '.' path chars on its own route, and the cave floors
  // lunefloor (Lunestone 1F), darklunefloor (Lunestone B1F),
  // stratadeepfloor (Stonebore), each swapped 1:1 from the
  // walkable 'L' cavefloor char in its own cave, so floor stays
  // floor. The cave wall chars (1161, 1163, 1165) are NOT here:
  // they swap from 'G' cavewall, which was never walkable.
  // (Indices 1152-1165 per the Director's index ruling: W17-A
  // took 1092-1110, W17-B 1112-1131, W17-C 1132-1151 on its
  // parallel branch; 1111 stays empty.)
  ...[1152, 1153, 1156, 1157, 1160, 1162, 1164]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-E: the Crown Road's cave floor char (U+1E00+1166,
  // tiles.mjs W17E_KIND_DEFS) is walkable — crownfloor
  // (victoryroad), swapped 1:1 from the walkable 'L' cavefloor
  // char in both copies of the road, so floor stays floor. The
  // crownwall char (1167) is NOT here: walls stay walls, like
  // 'G'. (Indices 1166-1167 per the Director's index ruling:
  // Tranches 1-3 took 1092-1110, 1112-1131 and 1132-1151;
  // W17-D takes 1152-1165 on its parallel branch; 1111 stays
  // empty.)
  ...[1166]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-F: the Yamato tranche-1 ground/path/floor chars
  // (U+1E00+1168.., tiles.mjs W17F_KIND_DEFS) are walkable —
  // windturf/windfloor (Route 29), berryturf/climbfloor
  // (Route 30), shadowturf/valleyfloor (Route 31),
  // cliffturf/clifffloor (Route 32), each swapped 1:1 from the
  // walkable '_' ground / '.' path chars on its own route, and
  // the cave floor junctionfloor (Junction Cave), swapped 1:1
  // from the walkable 'L' cavefloor char in its own cave, so
  // floor stays floor. The tree chars (1170, 1174, 1178, 1182),
  // prop chars (1171, 1175, 1179, 1183) and the cave wall char
  // (1185) are NOT here: trees/props were never walkable, and
  // the wall swaps from 'G' cavewall, which was never walkable.
  // (Indices 1168-1185 per the Director's index ruling: Arden
  // took 1092-1110, 1112-1131, 1132-1151, 1152-1165 and
  // 1166-1167 on its parallel branch; 1111 stays empty.)
  ...[1168, 1169, 1172, 1173, 1176, 1177, 1180, 1181, 1184]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-G: the Yamato tranche-2 ground/path chars
  // (U+1E00+1186.., tiles.mjs W17G_KIND_DEFS) are walkable —
  // rainturf/rainfloor (Route 33), hollyturf/hollyfloor (Holly
  // Forest), coastturf/coastfloor (Route 34), parkturf/parkfloor
  // (Route 35), frontlawn/frontfloor (National Park), each
  // swapped 1:1 from the walkable '_' ground / '.' path chars on
  // its own map, so ground stays ground and path stays path. The
  // tree chars (1188, 1192, 1196, 1200) and prop chars (1189,
  // 1193, 1197, 1201, 1204) are NOT here: trees/props were never
  // walkable. (Indices 1186-1204 per the program plan: W17-F
  // took 1168-1185 on its parallel branch; 1111 stays empty.)
  ...[1186, 1187, 1190, 1191, 1194, 1195, 1198, 1199, 1202, 1203]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-H: the Yamato tranche-3 ground/path chars
  // (U+1E00+1205.., tiles.mjs W17H_KIND_DEFS) are walkable —
  // crossturf/crossfloor (Route 36), podturf/podfloor (Route 37),
  // farmturf/farmfloor (Route 38), hillturf/hillfloor (Route 39),
  // each swapped 1:1 from the walkable '_' ground / '.' path chars
  // on its own route, and harbourturf (Route 40), swapped 1:1 from
  // the walkable '_' shore cells of the surf lane, so ground stays
  // ground and path stays path. The tree chars (1207, 1211, 1215,
  // 1219), prop chars (1208, 1212, 1216, 1220) and the harbour
  // rock char (1222) are NOT here: trees/props were never walkable,
  // and harbourrock swaps from 'R' rock, which was never walkable.
  // (Indices 1205-1222 per the program plan: W17-F took 1168-1185
  // and W17-G takes 1186-1204 on its parallel branch; 1111 stays
  // empty.)
  ...[1205, 1206, 1209, 1210, 1213, 1214, 1217, 1218, 1221]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-I: the Yamato tranche-4 ground/path/cave-floor chars
  // (U+1E00+1223.., tiles.mjs W17I_KIND_DEFS) are walkable —
  // isleturf (Route 41), millturf/millroadfloor (Route 42),
  // wetmillfloor (Millstone Lower), sprayfloor (Millstone Upper),
  // craterturf/tollfloor (Route 43), each swapped 1:1 from the
  // walkable '_' ground / '.' path / 'L' cavefloor chars on its
  // own map, so ground stays ground, path stays path and cave
  // floor stays cave floor. The rock char (1224), tree chars
  // (1227, 1235), prop chars (1228, 1236) and cave wall chars
  // (1230, 1232) are NOT here: rocks/trees/props/walls were never
  // walkable, and stackrock swaps from 'R' rock, which was never
  // walkable. (Indices 1223-1236 per the program plan: W17-F took
  // 1168-1185, W17-G 1186-1204 and W17-H takes 1205-1222 on its
  // parallel branch; 1111 stays empty.)
  ...[1223, 1225, 1226, 1229, 1231, 1233, 1234]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-J: the Yamato tranche-5 ground/path chars
  // (U+1E00+1237.., tiles.mjs W17J_KIND_DEFS) are walkable —
  // coldturf/coldfloor (Route 44), fallturf/fallfloor (Route 45),
  // highturf/highfloor (Route 46), each swapped 1:1 from the
  // walkable '_' ground / '.' path chars on its own route, so
  // ground stays ground and path stays path. The Frost Path
  // halls add NO walkable char: their floors are the shipped
  // icefloor/frostfloor (byte-preserved, already walkable) and
  // their new wall chars (1241, 1242) swap from 'G' cavewall,
  // which was never walkable. The tree chars (1239, 1245, 1249)
  // and prop chars (1240, 1246, 1250) are NOT here either:
  // trees/props were never walkable. (Indices 1237-1250 per the
  // program plan: W17-F took 1168-1185, W17-G 1186-1204, W17-H
  // 1205-1222 and W17-I takes 1223-1236 on its parallel branch;
  // 1111 stays empty.)
  ...[1237, 1238, 1243, 1244, 1247, 1248]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-K: the Yamato tranche-6 ground/path/cave-floor chars
  // (U+1E00+1251.., tiles.mjs W17K_KIND_DEFS) are walkable —
  // gloomfloor (Gloom Cave), swapped 1:1 from the walkable 'L'
  // cavefloor char in its own cave, so floor stays floor, and
  // passturf/passfloor (Lastlight Pass), swapped 1:1 from the
  // walkable '_' ground / '.' path chars on its own route, so
  // ground stays ground and path stays path. The cave wall char
  // (1252), tree char (1255) and prop char (1256) are NOT here:
  // the wall swaps from 'G' cavewall, which was never walkable,
  // and trees/props were never walkable. (Indices 1251-1256 per
  // the program plan: W17-F took 1168-1185, W17-G 1186-1204,
  // W17-H 1205-1222, W17-I 1223-1236 and W17-J takes 1237-1250
  // on its parallel branch; 1111 stays empty.)
  ...[1251, 1253, 1254]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-L: the Maris tranche-1 ground/path chars
  // (U+1E00+1257.., tiles.mjs W17L_KIND_DEFS) are walkable —
  // campturf/firstfloor (Route 101), stillturf/stillfloor
  // (Route 102), wadeturf/wadefloor (Route 103), bedturf/bedfloor
  // (Route 104) and shadeturf/shadefloor (Meadowbrook Woods),
  // each swapped 1:1 from the walkable '_' ground / '.' path
  // chars on its own route, so ground stays ground and path
  // stays path. The tree chars (1259, 1263, 1267, 1271, 1275)
  // and prop chars (1260, 1264, 1268, 1272, 1276) are NOT here:
  // trees and props were never walkable. (Indices 1257-1276 per
  // the Maris program plan; the Yamato allocation ended at
  // 1256; 1111 stays empty.)
  ...[1257, 1258, 1261, 1262, 1265, 1266, 1269, 1270, 1273, 1274]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-M: the Maris tranche-2 sea-lane sand chars
  // (U+1E00+1277.., tiles.mjs W17M_KIND_DEFS) are walkable —
  // tombsand (Route 105), cairnsand (Route 106), swellsand
  // (Route 107), wrecksand (Route 108) and baysand (Route 109),
  // each swapped 1:1 from the walkable sand char on its own
  // lane, so shore stays shore. The rock chars (1278, 1280,
  // 1282, 1284, 1286) are NOT here: they swap from the 'R'
  // rock char, which was never walkable. (Indices 1277-1286
  // per the Maris program plan; W17-L takes 1257-1276 on its
  // parallel branch; 1111 stays empty.)
  ...[1277, 1279, 1281, 1283, 1285]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-N: the Maris tranche-3 ground/path chars
  // (U+1E00+1287.., tiles.mjs W17N_KIND_DEFS) are walkable —
  // underturf/underfloor (Route 110), duneturf/dunewayfloor
  // (Route 111), fumeturf/fumefloor (Route 112), scorchfloor
  // (Scorch Path, swapped 1:1 from the walkable 'L' cavefloor)
  // and smoketurf/smokefloor (Mt. Smokestack), each swapped 1:1
  // from the walkable '_' ground / '.' path chars on its own
  // route, so ground stays ground and path stays path. The tree
  // chars (1289, 1293, 1297), prop chars (1290, 1294, 1298,
  // 1303) and the scorchrock wall char (1300, swapped from the
  // volcrock wall register, never walkable) are NOT here: trees,
  // props and walls were never walkable. (Indices 1287-1303 per
  // the Maris program plan; W17-L took 1257-1276 and W17-M takes
  // 1277-1286 on its parallel branch; 1111 stays empty.)
  ...[1287, 1288, 1291, 1292, 1295, 1296, 1299, 1301, 1302]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-O: the Maris tranche-4 ground/path chars
  // (U+1E00+1304.., tiles.mjs W17O_KIND_DEFS) are walkable —
  // stairturf/stairfloor (Ragged Pass), sweepturf/sweepfloor
  // (Route 113), impacturf/impactfloor (Route 114), cometfloor
  // (Comet Falls, swapped 1:1 from the walkable 'L' cavefloor)
  // and mistturf/mistfloor (Route 115), each swapped 1:1 from
  // the walkable '_' ground / '.' path chars on its own route,
  // so ground stays ground and path stays path. The tree chars
  // (1306, 1310, 1314, 1320), prop chars (1307, 1311, 1315,
  // 1321) and the cometwall wall char (1317, swapped from the
  // 'G' cavewall, never walkable) are NOT here: trees, props
  // and walls were never walkable. (Indices 1304-1321 per the
  // Maris program plan; W17-L took 1257-1276, W17-M 1277-1286
  // and W17-N takes 1287-1303 on its parallel branch; 1111
  // stays empty.)
  ...[1304, 1305, 1308, 1309, 1312, 1313, 1316, 1318, 1319]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-P: the Maris tranche-5 ground/path chars
  // (U+1E00+1322.., tiles.mjs W17P_KIND_DEFS) are walkable —
  // echoturf/echofloor (Route 116), borefloor (Copperbore
  // Tunnel, swapped 1:1 from the walkable 'L' cavefloor),
  // dayturf/dayfloor (Route 117), fordturf/fordfloor
  // (Route 118) and gaugeturf/gaugefloor (Route 119), each
  // swapped 1:1 from the walkable '_' ground / '.' path chars
  // on its own route, so ground stays ground and path stays
  // path. The tree chars (1324, 1330, 1334, 1338), prop chars
  // (1325, 1331, 1335, 1339) and the borewall wall char (1327,
  // swapped from the 'G' cavewall, never walkable) are NOT
  // here: trees, props and walls were never walkable.
  // (Indices 1322-1339 per the Maris program plan; W17-L took
  // 1257-1276, W17-M 1277-1286, W17-N 1287-1303 and W17-O
  // takes 1304-1321 on its parallel branch; 1111 stays empty.)
  ...[1322, 1323, 1326, 1328, 1329, 1332, 1333, 1336, 1337]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-Q: the Maris tranche-6 ground/path/shore chars
  // (U+1E00+1340.., tiles.mjs W17Q_KIND_DEFS) are walkable —
  // ledgerturf/ledgerfloor (Route 120), wardenturf/wardenfloor
  // (Route 121), pyresand (Route 122's island shore),
  // masterturf/masterfloor (Route 123) and trenchsand (Route
  // 124's crossing shore), each swapped 1:1 from the walkable
  // '_' ground / '.' path / shore-sand chars on its own route,
  // so ground stays ground, path stays path and shore stays
  // shore. The tree chars (1342, 1346, 1352), prop chars
  // (1343, 1347, 1353) and the lane rock chars (1349, 1355,
  // swapped from the 'R' rock char, never walkable) are NOT
  // here: trees, props and rocks were never walkable.
  // (Indices 1340-1355 per the Maris program plan; W17-L took
  // 1257-1276, W17-M 1277-1286, W17-N 1287-1303, W17-O
  // 1304-1321 and W17-P takes 1322-1339 on its parallel
  // branch; 1111 stays empty.)
  ...[1340, 1341, 1344, 1345, 1348, 1350, 1351, 1354]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-R: the Maris tranche-7 floor chars (U+1E00+1356..,
  // tiles.mjs W17R_KIND_DEFS) are walkable — shaftfloor (Route
  // 124 Trench, swapped 1:1 from the walkable seasand swim
  // surface), ebbsand (Route 125) and cratersand (Route 126),
  // each swapped 1:1 from the walkable shipped sand char, and
  // doorfloor (Route 126 Trench, swapped 1:1 from seasand), so
  // floor stays floor. The wall chars (1357 shaftwall, 1363
  // doorwall, swapped from the 'uwrock' wall char) and the rock
  // chars (1359 ebbrock, 1361 craterrock, swapped from the 'R'
  // rock char) are NOT here: walls and rocks were never
  // walkable. (Indices 1356-1363 per the Maris program plan;
  // W17-L took 1257-1276, W17-M 1277-1286, W17-N 1287-1303,
  // W17-O 1304-1321, W17-P 1322-1339 and W17-Q takes 1340-1355
  // on its parallel branch; 1111 stays empty.)
  ...[1356, 1358, 1360, 1362]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-S: the Maris tranche-8 floor chars (U+1E00+1364..,
  // tiles.mjs W17S_KIND_DEFS) are walkable — kelpsand (Route
  // 127) and sunksand (Route 128) and leesand (Route 129),
  // each swapped 1:1 from the walkable shipped sand char, and
  // kelpfloor (Route 127 Trench) and breathfloor (Route 128
  // Trench), each swapped 1:1 from the walkable seasand swim
  // surface, so floor stays floor. The wall chars (1367
  // kelpwall, 1371 breathwall, swapped from the 'uwrock' wall
  // char) and the rock chars (1365 kelprock, 1369 sunkrock,
  // 1373 leerock, swapped from the 'R' rock char) are NOT
  // here: walls and rocks were never walkable. (Indices
  // 1364-1373 per the Maris program plan; W17-L took
  // 1257-1276, W17-M 1277-1286, W17-N 1287-1303, W17-O
  // 1304-1321, W17-P 1322-1339, W17-Q 1340-1355 and W17-R
  // takes 1356-1363 on its parallel branch; 1111 stays empty.)
  ...[1364, 1366, 1368, 1370, 1372]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-T: the Maris tranche-9 shore chars (U+1E00+1374..,
  // tiles.mjs W17T_KIND_DEFS) are walkable — quietsand (Route
  // 130), moorsand (Route 131), streamsand (Route 132),
  // rapidsand (Route 133) and gatesand (Route 134), each
  // swapped 1:1 from the walkable shipped sand char, so shore
  // stays shore. The rock chars (1375 quietrock, 1377
  // moorrock, 1379 streamrock, 1381 rapidrock, 1383 gaterock,
  // swapped from the 'R' rock char) are NOT here: rocks were
  // never walkable. The current bands on Routes 132-134 are
  // the shipped `current` kind — mechanic data, byte-identical,
  // untouched by this wave. (Indices 1374-1383 per the Maris
  // program plan — the Maris allocation closes at 1383;
  // W17-L took 1257-1276, W17-M 1277-1286, W17-N 1287-1303,
  // W17-O 1304-1321, W17-P 1322-1339, W17-Q 1340-1355, W17-R
  // 1356-1363 and W17-S takes 1364-1373 on its parallel
  // branch; 1111 stays empty.)
  ...[1374, 1376, 1378, 1380, 1382]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-U: the Borea tranche-1 ground/path chars
  // (U+1E00+1384.., tiles.mjs W17U_KIND_DEFS) are walkable —
  // candorturf/candorfloor (Route 201), gateturf/spirefloor
  // (Route 202), coalturf/coalfloor (Route 203),
  // bluffturf/blufffloor (Route 204) and oldroadfloor (Ruined
  // Path, swapped 1:1 from the walkable 'L' cavefloor), each
  // swapped 1:1 from the walkable '_' ground / '.' path chars
  // on its own route, so ground stays ground and path stays
  // path. The tree chars (1386, 1390, 1394, 1398), prop chars
  // (1387, 1391, 1395, 1399) and the ruinwall wall char (1401,
  // swapped from the 'G' cavewall, never walkable) are NOT
  // here: trees, props and walls were never walkable.
  // (Indices 1384-1401 per the Borea program plan; the Maris
  // allocation closed at 1383 (W17-L..W17-T); 1111 stays
  // empty.)
  ...[1384, 1385, 1388, 1389, 1392, 1393, 1396, 1397, 1400]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-V: the Borea tranche-2 ground/path chars
  // (U+1E00+1402.., tiles.mjs W17V_KIND_DEFS) are walkable —
  // galeturf/galefloor (Route 205), deepturf/deepfloor
  // (Heritage Forest), pillarturf/pillarwayfloor (Route 206),
  // climbturf/switchfloor (Route 207) and restturf/restfloor
  // (Route 208), each swapped 1:1 from the walkable '_'
  // ground / '.' path chars on its own route, so ground stays
  // ground and path stays path. The tree chars (1404, 1408,
  // 1412, 1416, 1420) and prop chars (1405, 1409, 1413, 1417,
  // 1421) are NOT here: trees and props were never walkable.
  // (Indices 1402-1421 per the Borea program plan; the Borea
  // allocation opened at 1384 (W17-U takes 1384-1401 on its
  // parallel branch); 1111 stays empty.)
  ...[1402, 1403, 1406, 1407, 1410, 1411, 1414, 1415, 1418, 1419]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-W: the Borea tranche-3 floor chars (U+1E00+1422..,
  // tiles.mjs W17W_KIND_DEFS) are walkable — stepsfloor (Mt.
  // Apex — South), spinefloor (Mt. Apex — Central) and
  // zenithfloor (Mt. Apex — North), each swapped 1:1 from the
  // walkable coronetfloor char in its own hall, and lotusturf/
  // lotusfloor (Route 211), swapped 1:1 from the walkable '_'
  // ground / '.' path chars, so floor stays floor and path
  // stays path. The wall chars (1423, 1425, 1427, swapped from
  // coronetrock, never walkable), the lotuspine tree char
  // (1430) and the lotuspost prop char (1431) are NOT here:
  // walls, trees and props were never walkable. (Indices
  // 1422-1431 per the Borea program plan; W17-V takes
  // 1402-1421 on its parallel branch; 1111 stays empty.)
  ...[1422, 1424, 1426, 1428, 1429]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-X: the Borea tranche-4 ground/path chars
  // (U+1E00+1432.., tiles.mjs W17X_KIND_DEFS) are walkable —
  // towerturf/bellfloor (Route 209), ranchturf/ranchfloor
  // (Route 210), fogturf/fogfloor (Route 210 — North),
  // poolturf/poolfloor (Route 212 — North) and
  // bogturf/bogfloor (Route 212 — South), each swapped 1:1
  // from the walkable '_' ground / '.' path chars on its own
  // route, so ground stays ground and path stays path. The
  // tree chars (1434, 1438, 1442, 1446, 1450) and prop chars
  // (1435, 1439, 1443, 1447, 1451) are NOT here: trees and
  // props were never walkable. (Indices 1432-1451 per the
  // Borea program plan; the Borea allocation opened at 1384
  // (W17-U takes 1384-1401, W17-V 1402-1421 and W17-W
  // 1422-1431 on their parallel branches); 1111 stays
  // empty.)
  ...[1432, 1433, 1436, 1437, 1440, 1441, 1444, 1445, 1448, 1449]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-Y: the Borea tranche-5 ground/path chars
  // (U+1E00+1452.., tiles.mjs W17Y_KIND_DEFS) are walkable —
  // saltturf/saltfloor (Route 213), gallantturf/gallantfloor
  // (Lake Gallant), keepfloor (Gallant Cavern, swapped 1:1
  // from the walkable cavefloor char), vergeturf/vergefloor
  // (Route 214) and bloomturf/vernalfloor (Vernal Path),
  // each swapped 1:1 from the walkable '_' ground / '.'
  // path chars on its own route, so ground stays ground and
  // path stays path. The tree chars (1454, 1458, 1464,
  // 1468), prop chars (1455, 1459, 1465, 1469) and the
  // keepwall char (1461, swapped from cavewall) are NOT
  // here: trees, props and walls were never walkable.
  // (Indices 1452-1469 per the Borea program plan; the
  // Borea allocation opened at 1384 (W17-U takes 1384-1401,
  // W17-V 1402-1421, W17-W 1422-1431 and W17-X 1432-1451 on
  // their parallel branches); 1111 stays empty.)
  ...[1452, 1453, 1456, 1457, 1460, 1462, 1463, 1466, 1467]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-Z: the Borea tranche-6 ground/path/floor chars
  // (U+1E00+1470.., tiles.mjs W17Z_KIND_DEFS) are walkable —
  // fareturf/farefloor (Farewell Spring), puddleturf/
  // puddlefloor (Route 215), packturf/bridgefloor (Route
  // 216) and whiteturf/whitefloor (Route 217), each swapped
  // 1:1 from the walkable '_' ground / '.' path chars on its
  // own route (the snow routes from the walkable frostfloor
  // ground char), calmturf/calmfloor (Lake Insight), and
  // glintfloor (Insight Cavern), swapped 1:1 from the
  // walkable frostfloor char in the cavern, so ground stays
  // ground and floor stays floor. The tree chars (1472,
  // 1476, 1480, 1484, 1488), the prop chars (1473, 1477,
  // 1481, 1485, 1489) and the glintwall wall char (1491,
  // swapped from icewall, never walkable) are NOT here:
  // trees, props and walls were never walkable. The mechanic
  // chars (icefloor, icepool, climbwall) are untouched by
  // this wave entire. (Indices 1470-1491 per the Borea
  // program plan; the Borea allocation opened at 1384
  // (W17-U takes 1384-1401, W17-V 1402-1421, W17-W
  // 1422-1431, W17-X 1432-1451 and W17-Y 1452-1469 on their
  // parallel branches); 1111 stays empty.)
  ...[1470, 1471, 1474, 1475, 1478, 1479, 1482, 1483, 1486, 1487, 1490]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-AA: the Borea tranche-7 ground/path/sand chars
  // (U+1E00+1492.., tiles.mjs W17AA_KIND_DEFS) are walkable —
  // solarturf/solarfloor (Route 222) and tideturf/tidefloor
  // (Route 221), each swapped 1:1 from the walkable '_'
  // ground / '.' path chars on its own route; causefloor
  // (Route 218), swapped 1:1 from the walkable boardwalk
  // char by the causeway method; brightsand (Route 219) and
  // longsand (Route 220), each swapped 1:1 from the walkable
  // seasand char in its own lane, so ground stays ground and
  // floor stays floor. The tree chars (1494, 1497, 1505),
  // the prop chars (1495, 1506) and the rock chars (1498,
  // 1500, 1502, swapped from rock, never walkable) are NOT
  // here: trees, props and rocks were never walkable. The
  // mechanic current chars are untouched by this wave
  // entire. (Indices 1492-1506 per the Borea program plan;
  // the Borea allocation opened at 1384 (W17-U takes
  // 1384-1401, W17-V 1402-1421, W17-W 1422-1431, W17-X
  // 1432-1451, W17-Y 1452-1469 and W17-Z 1470-1491 on their
  // parallel branches); 1111 stays empty.)
  ...[1492, 1493, 1496, 1499, 1501, 1503, 1504]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-AB: the Borea tranche-8 ground/path/sand chars
  // (U+1E00+1507.., tiles.mjs W17AB_KIND_DEFS) are walkable —
  // leaguesand (Route 223), swapped 1:1 from the walkable
  // seasand char in its own lane; headturf/headfloor (Route
  // 224) and scorchturf/zonefloor (Route 225), each swapped
  // 1:1 from the walkable '_' ground / '.' path chars on its
  // own route; foamfloor (Foamline Path), swapped 1:1 from
  // the walkable boardwalk char by the causeway method, so
  // ground stays ground and floor stays floor. The tree
  // chars (1511, 1514, 1518), the prop chars (1512, 1519)
  // and the rock chars (1508, 1515, swapped from rock, never
  // walkable) are NOT here: trees, props and rocks were never
  // walkable. The mechanic current chars are untouched by
  // this wave entire. (Indices 1507-1519 per the Borea
  // program plan; the Borea allocation opened at 1384
  // (W17-U takes 1384-1401, W17-V 1402-1421, W17-W
  // 1422-1431, W17-X 1432-1451, W17-Y 1452-1469, W17-Z
  // 1470-1491 and W17-AA 1492-1506 on their parallel
  // branches); 1111 stays empty.)
  ...[1507, 1509, 1510, 1513, 1516, 1517]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-AC: the Borea tranche-9 ground/path/sand chars
  // (U+1E00+1520.., tiles.mjs W17AC_KIND_DEFS) are walkable —
  // eastturf/eastfloor (Route 226), starkturf/starkfloor
  // (Route 227) and washturf/washfloor (Route 228), each
  // swapped 1:1 from the walkable '_' ground / '.' path chars
  // on its own route; loopsand (Route 229) and palmsand
  // (Route 230), each swapped 1:1 from the walkable seasand
  // char in its own lane, so ground stays ground and floor
  // stays floor. The tree chars (1522, 1526, 1530), the prop
  // chars (1523, 1527, 1531) and the rock chars (1533, 1535,
  // swapped from rock, never walkable) are NOT here: trees,
  // props and rocks were never walkable. The preserved
  // registers are untouched by this wave entire — Route
  // 227's ashground biome, Route 228's shipped sand family
  // and both lanes' mechanic current chars keep the exact
  // walkability they shipped with. (Indices 1520-1535 per
  // the Borea program plan — the program's last; the Borea
  // allocation opened at 1384 (W17-U takes 1384-1401, W17-V
  // 1402-1421, W17-W 1422-1431, W17-X 1432-1451, W17-Y
  // 1452-1469, W17-Z 1470-1491 and W17-AA 1492-1506 on their
  // parallel branches; W17-AB takes 1507-1519 on its own);
  // 1111 stays empty.)
  ...[1520, 1521, 1524, 1525, 1528, 1529, 1532, 1534]
    .map((i) => String.fromCodePoint(0x1E00 + i)),
  // Wave W17-AD: the Amber Sea lane sand chars (U+1E00+1536..,
  // tiles.mjs W17AD_KIND_DEFS) are walkable — wakesand (West),
  // gardensand (Central), resortsand (East) and shrinesand
  // (North), each swapped 1:1 from the walkable shipped sand
  // char on its own lane, so shore stays shore. The rock chars
  // (1537, 1539, 1541, 1543, swapped from the 'R' rock char)
  // are NOT here: rocks were never walkable. The islet
  // dressing register (palm/tropgrass/grass/tree/flower) and
  // coral stand byte-preserved entire (Director Ruling #2);
  // the Ruling #1 islet repositioning moved sand cells as
  // clusters with per-lane class counts identical, so this
  // set's membership — and the lanes' dead-pocket census —
  // cannot move. (Indices 1536-1543 per the Amber lanes
  // program plan, WAVE-W17-AD-AMBER-LANES-PLAN.md — the
  // route program's last allocation: the program closes at
  // 451 kinds over 1092-1543; 1111 stays empty.)
  ...[1536, 1538, 1540, 1542]
    .map((i) => String.fromCodePoint(0x1E00 + i))]);

// Trainer definitions for the slice.
// ai: 'opener-setup' = gym-leader flavor: open with a self-buff setup move if known
// (classic Brock Defense Curl), then fight on effectiveness like everyone else.
export const TRAINERS = {
  r1_cal: {
    id: 'r1_cal', name: 'Cal', title: 'Youngster',
    intro: ["Hey! My SCURRAT's the toughest on Route 1! Battle me!"],
    lose: ["Toughest... except against you, huh."],
    team: [
      { species: 'rattata', level: 3 },
      { species: 'pidgey', level: 4 },
    ],
    reward: 140,
  },
  r1_lisa: {
    id: 'r1_lisa', name: 'Lisa', title: 'Lass',
    intro: ["DUNPLUME and I do our morning laps here. Spar with us?"],
    lose: ["We still have a lot of laps to run..."],
    team: [
      { species: 'pidgey', level: 3 },
      { species: 'rattata', level: 4 },
    ],
    reward: 150,
  },
  r2_bug: {
    id: 'r2_bug', name: 'Rick', title: 'Bug Catcher',
    intro: ["My bugs are gonna cocoon you! En garde!"],
    lose: ["S-squashed..."],
    team: [
      { species: 'caterpie', level: 5 },
      { species: 'weedle', level: 5 },
    ],
    reward: 160,
  },
  r2_camper: {
    id: 'r2_camper', name: 'Bea', title: 'Camper',
    intro: ["I picnic here every day — battle me before you sit down!"],
    lose: ["Not even a snack break slows you down!"],
    team: [
      { species: 'nidoranm', level: 7 },
      { species: 'mankey', level: 7 },
    ],
    reward: 230,
  },
  r2_jr: {
    id: 'r2_jr', name: 'Nia', title: 'Jr. Trainer',
    intro: ["Route 2 is MY training ground! Prove you belong here!"],
    lose: ["You're stronger than the rumors said..."],
    team: [
      { species: 'pidgey', level: 7 },
      { species: 'rattata', level: 7 },
    ],
    reward: 220,
  },
  r2_hiker: {
    id: 'r2_hiker', name: 'Rob', title: 'Hiker',
    intro: ["These boulders are my training weights! Show me your form!"],
    lose: ["Rock-solid... defeat. Heh. Good scrap."],
    team: [
      { species: 'geodude', level: 8 },
      { species: 'geodude', level: 9 },
    ],
    reward: 300,
  },
  // Yellow homage: the anime-trio ambush as a sequential 2-mon duo battle
  // (Gen 1 had no double battles — the trio fought back-to-back, as here).
  // Original characters, original banter; nicknamed mons for personality.
  r2_duo: {
    id: 'r2_duo', name: 'Rue & Cole', title: 'Uniformed Duo',
    intro: [
      "RUE: Well, well. A little trainer marching up OUR route.",
      "COLE: And carrying a VOLTIK that walks free? That's a rare one.",
      "RUE: Hand over your Kin, kid — or we'll take them the fun way!",
      "COLE: Two of us, one of you. The math is delicious.",
    ],
    lose: [
      "RUE: Beaten... by a kid?!",
      "COLE: Retreat! Regroup! We'll be back with a better plan!",
    ],
    team: [
      { species: 'weedle', level: 5, nickname: 'Sting' },
      { species: 'zubat', level: 6, nickname: 'Echo' },
    ],
    reward: 200,
  },
  brock: {
    id: 'brock', name: 'Garran', title: 'Flintridge Gym Leader',
    ai: 'opener-setup',
    intro: ["My rock-type Kin will crush you! Show me what you've got!"],
    lose: ["I took you for granted... You're stronger than I thought.", "Take the Boulder Badge — you earned it."],
    team: [
      // ADR-025 §3 (Phase 3): authored foe keepsakes (rules.foeKeepsakeFor
      // decides per difficulty — Challenge: all; Classic: the ace only).
      { species: 'geodude', level: 12, keepsake: 'ironacorn' },
      { species: 'onix', level: 14, keepsake: 'tortoisecharm' },
    ],
    reward: 900,
    badge: 'boulderbadge',
  },
};
