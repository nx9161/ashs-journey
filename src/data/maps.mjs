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
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,Ẕ_..,,,,#',
      '#,,,,....,,,,#',
      '#,,_.....,,,,#',
      '#,,Ẅ.....,,..#',
      '#,,..SS..,,..#',
      '#,,_.....,,.ẋ#',
      '#,,,,.Ẅ..,,,,#',
      '#,,,,ẑ...,,,,#',
      '#,,..ẇ...,,,,#',
      '#,,..F...,,.ẅ#',
      '#,,,,....,,,,#',
      '#,,,,.ẕ..,,,,#',
      '#,,,,....,,,,#',
      '#####....#####',
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
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,..ẖ.,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,..RR..,,.ẇ#',
      '#,,......,,.Ẋ#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,..ẉ.,,,,#',
      '#,,,,..ẗ.,,,,#',
      '#,,,,....,,,,#',
      '#####....#####',
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
