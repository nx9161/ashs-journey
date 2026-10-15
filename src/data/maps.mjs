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
        dialogue: ["Yo! Smell ya later, {player}! I'm off to grab my first partner!", "My grandpa's the professor, so I get the good stuff. Try to keep up!"] },
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
        dialogue: ["Wild Pokemon live in the tall grass! Walk through it and keep your eyes open.", "Weaken them first, then throw a Poke Ball. The professor gave you five to start."] },
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
        dialogue: ["Heading north? Route 2's grass is thicker — I saw a Mankey up there yesterday.", "The Pewter Gym is past it. Rock-types! Bring water or grass if you can."] },
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
    npcs: [],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'caterpie', min: 3, max: 5, weight: 30 },
        { species: 'weedle', min: 3, max: 5, weight: 30 },
        { species: 'pidgey', min: 3, max: 5, weight: 25 },
        { species: 'nidoranm', min: 4, max: 6, weight: 10 },
        { species: 'mankey', min: 4, max: 6, weight: 5 },
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
        dialogue: ["Brock's rock-types shrug off electric attacks — your partner's sparks won't cut it.", "Catch something with water or grass on Route 2. Or just outlast him. You've got heart."] },
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
        dialogue: ["I'm Brock! I'm Pewter's Gym Leader! My rock-hard willpower is evident even in my Pokemon!", "My Pokemon are all rock hard, and have true-grit determination!"] },
    ],
    encounters: null,
    start: null,
  },
};

export const MAP_LIST = Object.keys(MAPS);

// Tile passability: walkable kinds.
export const WALKABLE = new Set(['.', ',', 'D', 'E', 'C', 'F']);

// Trainer definitions for the slice.
export const TRAINERS = {
  brock: {
    id: 'brock', name: 'Brock', title: 'Pewter Gym Leader',
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
