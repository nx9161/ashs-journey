// maps.mjs — Kanto opening slice: Pallet -> Route 1 -> Viridian -> Route 2 -> Pewter (+ interiors).
// Tile legend: # tree | . path | , grass | ~ water | H house | D door | S sign |
//              G gymwall | E gymdoor | C centerdoor | F flower | R rock | ' ' void
// Warps fire on step. Doors are step-warps; edge exits are listed per tile.

function rows(list) { return list; }

export const MAPS = {
  pallet: {
    id: 'pallet', name: 'Pallet Town', music: 'pallet-theme',
    rows: rows([
      '################',
      '#..............#',
      '#..HH......HH..#',
      '#..HH..SS..HH..#',
      '#..............#',
      '#......##......#',
      '#......##......#',
      '#..FF......FF..#',
      '#..............#',
      '#......,,......#',
      '######....######',
    ]),
    warps: [
      { x: 6, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 7, y: 10, to: { map: 'route1', x: 7, y: 14 } },
      { x: 8, y: 10, to: { map: 'route1', x: 6, y: 14 } },
      { x: 9, y: 10, to: { map: 'route1', x: 7, y: 14 } },
    ],
    signs: [
      { x: 6, y: 3, text: "PROF. HAWTHORN'S LAB — Pokemon research. The professor is out on Route 1 today." },
      { x: 7, y: 3, text: "PROF. HAWTHORN'S LAB — Pokemon research. The professor is out on Route 1 today." },
    ],
    npcs: [
      { x: 10, y: 4, name: 'GARY', skin: '#f0c8a0', shirt: '#3a5a9a', pants: '#2a2a3a', hair: '#6a4a2a',
        // Yellow homage (original lines): the rival's partner is an Eevee.
        dialogue: ["Yo, {player}! The professor gave me an EEVEE — fluffy, clever, and all mine!", "He says it'll evolve to match how I battle. Just watch — we'll be champions!"] },
    ],
    encounters: null,
    start: { x: 7, y: 7, dir: 'down' },
  },

  route1: {
    id: 'route1', name: 'Route 1', music: 'route1-theme',
    rows: rows([
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,......,,..#',
      '#,,..SS..,,..#',
      '#,,......,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,..FF..,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#####....#####',
    ]),
    warps: [
      { x: 5, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 6, y: 0, to: { map: 'viridian', x: 7, y: 9 } },
      { x: 7, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 8, y: 0, to: { map: 'viridian', x: 8, y: 9 } },
      { x: 5, y: 15, to: { map: 'pallet', x: 7, y: 9 } },
      { x: 6, y: 15, to: { map: 'pallet', x: 7, y: 9 } },
      { x: 7, y: 15, to: { map: 'pallet', x: 8, y: 9 } },
      { x: 8, y: 15, to: { map: 'pallet', x: 8, y: 9 } },
    ],
    signs: [
      { x: 5, y: 6, text: 'ROUTE 1 — Pallet Town to Viridian City. Tall grass rustles with wild Pokemon.' },
    ],
    npcs: [
      { x: 9, y: 5, name: 'AIDE', skin: '#f0c8a0', shirt: '#4a9a4a', pants: '#3a3a4a', hair: '#1a1a1a',
        dialogue: ["Wild Pokemon live in the tall grass! Walk through it and keep your eyes open.", "Weaken them first, then throw a Poke Ball. The professor gave you ten to start."] },
      { x: 6, y: 4, name: 'CAL', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#c0a03a',
        trainer: 'r1_cal',
        sight: { dir: 'left', range: 3 }, // Yellow-style: spots you, "!", walks up (down is blocked by the sign)
        dialogue: ["Heh! Nobody gets past me without a battle!", "Whoa... you're tougher than you look."] },
      { x: 7, y: 11, name: 'LISA', skin: '#f0c8a0', shirt: '#c03a7a', pants: '#3a3a4a', hair: '#7a4a1a',
        trainer: 'r1_lisa',
        sight: { dir: 'up', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["Pidgey and I train here every morning! Care to spar?", "We'll be back stronger tomorrow, won't we, Pidgey?"] },
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
    id: 'viridian', name: 'Viridian City', music: 'viridian-theme',
    rows: rows([
      '######....######',
      '#......##......#',
      '#..HH..##..HH..#',
      '#..HH......HH..#',
      '#......CC......#',
      '#......CC......#',
      '#..SS......SS..#',
      '#..............#',
      '#..FF......FF..#',
      '#......,,......#',
      '######....######',
    ]),
    warps: [
      { x: 7, y: 4, to: { map: 'center', x: 4, y: 4 } },
      { x: 8, y: 4, to: { map: 'center', x: 5, y: 4 } },
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
      { x: 3, y: 6, text: 'VIRIDIAN CITY — The city of evergreen. The Pokemon Center heals your team for free.' },
    ],
    npcs: [
      { x: 11, y: 7, name: 'HIKER', skin: '#d8a878', shirt: '#8a6a3a', pants: '#4a4a5a', hair: '#3a2a1a',
        dialogue: ["Heading north? Route 2's grass is thicker — I saw a Mankey up there yesterday.", "Fighting-types crack rock wide open. A Mankey that knows Low Kick will humble Brock's Geodude."] },
    ],
    encounters: null,
    start: null,
  },

  center: {
    id: 'center', name: 'Pokemon Center', music: 'center-theme', indoor: true,
    rows: rows([
      '##########',
      '#........#',
      '#........#',
      '#........#',
      '#........#',
      '#...DD...#',
      '##########',
    ]),
    warps: [
      { x: 4, y: 5, to: { map: 'viridian', x: 7, y: 6 } },
      { x: 5, y: 5, to: { map: 'viridian', x: 8, y: 6 } },
    ],
    signs: [],
    npcs: [
      { x: 4, y: 2, name: 'NURSE', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#f0a0b0', hair: '#e86a5a',
        dialogue: ["Welcome to the Pokemon Center! Let me heal your team..."], heal: true,
        afterHeal: ["All better! Your Pokemon are fighting fit. Come back any time."] },
    ],
    encounters: null,
    start: null,
  },

  route2: {
    id: 'route2', name: 'Route 2', music: 'route1-theme',
    rows: rows([
      '#####....#####',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,......,,,,#',
      '#,,..RR..,,..#',
      '#,,......,,..#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
      '#,,,,....,,,,#',
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
      { x: 6, y: 3, name: 'RICK', skin: '#e8b888', shirt: '#6aa03a', pants: '#3a4a2a', hair: '#2a1a0a',
        trainer: 'r2_bug',
        sight: { dir: 'down', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["My bugs are gonna cocoon you! En garde!", "S-squashed... like a Caterpie under a boot."] },
      { x: 7, y: 5, name: 'BEA', skin: '#f0c8a0', shirt: '#e08a3a', pants: '#4a3a2a', hair: '#a05a2a',
        trainer: 'r2_camper',
        sight: { dir: 'down', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["I picnic here every day — battle me before you sit down!", "Not even a snack break slows you down!"] },
      { x: 7, y: 8, name: 'NIA', skin: '#d8a878', shirt: '#3a9ac0', pants: '#2a3a4a', hair: '#1a1a1a',
        trainer: 'r2_jr',
        sight: { dir: 'up', range: 3 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["Route 2 is MY training ground! Prove you belong here!", "You're stronger than the rumors said..."] },
      { x: 5, y: 10, name: 'ROB', skin: '#c89878', shirt: '#7a6a5a', pants: '#3a3a3a', hair: '#4a3a2a',
        trainer: 'r2_hiker',
        sight: { dir: 'up', range: 4 }, // Yellow-style: spots you, "!", walks up
        dialogue: ["These boulders are my training weights! Let's see your form!", "Rock-solid... defeat. Heh. Good scrap."] },
      // Yellow homage: the anime-trio ambush, reimagined with original
      // characters (no motto quotes, no trademarked team name — GC C4).
      // The duo flank the path; either one spotting you pulls BOTH in.
      { x: 3, y: 7, name: 'RUE', skin: '#e8b888', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#3a2a1a',
        trainer: 'r2_duo', duoPartner: 'COLE',
        sight: { dir: 'right', range: 4 },
        dialogue: ["Hold it right there, kid.", "Beaten... by a kid?!"] },
      { x: 10, y: 7, name: 'COLE', skin: '#d8a878', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#7a1a1a',
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
    start: null,
  },

  pewter: {
    id: 'pewter', name: 'Pewter City', music: 'pewter-theme',
    rows: rows([
      '################',
      '#......GG......#',
      '#..HH..GG..HH..#',
      '#..HH..EE..HH..#',
      '#......GG......#',
      '#......##......#',
      '#..SS......SS..#',
      '#..............#',
      '#..FF......FF..#',
      '#......,,......#',
      '######....######',
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
      { x: 3, y: 6, text: 'PEWTER CITY — A stone-gray city nestled between mountains.' },
      { x: 11, y: 6, text: 'PEWTER GYM — Leader: Brock. The rock-solid Pokemon trainer!' },
    ],
    npcs: [
      { x: 10, y: 4, name: 'COACH', skin: '#d8a878', shirt: '#c03a3a', pants: '#2a2a3a', hair: '#1a1a1a',
        dialogue: ["Brock's rock-types shrug off electric attacks — your partner's sparks won't cut it in there.", "Catch a Mankey on Route 2 — fighting beats rock, and they learn Low Kick young. Water or grass would work too, but you won't find those this side of the forest.", "You've got heart, kid. Take these Poke Balls — on the house."],
        give: { flag: 'coach_balls', items: { pokeball: 3 }, text: '3 Poke Balls' } },
    ],
    encounters: null,
    start: null,
  },

  gym: {
    id: 'gym', name: 'Pewter Gym', music: 'gym-theme', indoor: true,
    rows: rows([
      '############',
      '#..........#',
      '#.R......R.#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#..........#',
      '#####..#####',
    ]),
    warps: [
      { x: 5, y: 8, to: { map: 'pewter', x: 6, y: 4 } },
      { x: 6, y: 8, to: { map: 'pewter', x: 9, y: 4 } },
    ],
    signs: [],
    npcs: [
      { x: 5, y: 2, name: 'BROCK', skin: '#c89878', shirt: '#c8782a', pants: '#4a5a3a', hair: '#1a1a1a',
        trainer: 'brock',
        dialogue: ["I'm Brock! I'm Pewter's Gym Leader! My rock-hard willpower is evident even in my Pokemon!", "Stone may endure for ages, but your resolve struck harder today. The Boulder Badge is yours."] },
    ],
    encounters: null,
    start: null,
  },
};

export const MAP_LIST = Object.keys(MAPS);

// Tile passability: walkable kinds.
export const WALKABLE = new Set(['.', ',', 'D', 'E', 'C', 'F']);

// Trainer definitions for the slice.
// ai: 'opener-setup' = gym-leader flavor: open with a self-buff setup move if known
// (classic Brock Defense Curl), then fight on effectiveness like everyone else.
export const TRAINERS = {
  r1_cal: {
    id: 'r1_cal', name: 'Cal', title: 'Youngster',
    intro: ["Hey! My Rattata's the toughest on Route 1! Battle me!"],
    lose: ["Toughest... except against you, huh."],
    team: [
      { species: 'rattata', level: 3 },
      { species: 'pidgey', level: 4 },
    ],
    reward: 140,
  },
  r1_lisa: {
    id: 'r1_lisa', name: 'Lisa', title: 'Lass',
    intro: ["Pidgey and I do our morning laps here. Spar with us?"],
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
      "COLE: And carrying a Pikachu that walks free? That's a rare one.",
      "RUE: Hand over your Pokemon, kid — or we'll take them the fun way!",
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
    id: 'brock', name: 'Brock', title: 'Pewter Gym Leader',
    ai: 'opener-setup',
    intro: ["My rock-type Pokemon will crush you! Show me what you've got!"],
    lose: ["I took you for granted... You're stronger than I thought.", "Take the Boulder Badge — you earned it."],
    team: [
      { species: 'geodude', level: 12 },
      { species: 'onix', level: 14 },
    ],
    reward: 900,
    badge: 'boulderbadge',
  },
};
