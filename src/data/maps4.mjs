// maps4.mjs — coordinator patch: the three interiors maps3 could not land
// (Farsight Gym, Caldera Gym, Vantage Co. upper floor) plus travel-graph
// repairs found by the fidelity audit (St. Anne boarding, Game Corner
// poster entrance, Exile Isle arrival/return, hideout entry event).
// City-side warps in maps3 already point at the gyms/silph2.

import { MAPS2 } from './maps2.mjs';
import { MAPS3 } from './maps3.mjs';

export const MAPS4 = {
  'gym-saffron': {
    id: 'gym-saffron', name: 'Farsight Gym', music: 'gym-theme', indoor: true,
    rows: [
      'Ṛ===============',
      '=νṌṍḗλṋSSλḘ␠␠␠Ṍ=',
      '=␠␠␠␠ḙ␠␠␠␠␠␠␠␠Ṣ=',
      '=␠␠␠␠μ␠␠␠␠μ␠␠␠␠=',
      '=␠␠␠␠␠␠␠␠␠␠␠␠␠␠=',
      '=␠␠␠␠␠␠//␠␠␠␠␠␠=',
      '=␠␠␠␠μ␠//␠μ␠␠␠␠=',
      '=␠␠␠␠␠␠␠␠␠␠␠␠␠␠=',
      '=␠␠␠)␠␠␠␠␠␠)␠␠␠=',
      '=======DD=======',
    ],
    warps: [
      { x: 7, y: 9, to: { map: 'saffron', x: 13, y: 8 } },
      { x: 8, y: 9, to: { map: 'saffron', x: 14, y: 8 } },
    ],
    signs: [
      { x: 7, y: 1, text: 'The air in here hums, very faintly, like a held breath.' },
      { x: 8, y: 1, text: 'A small doll sits on a shelf, watching the door. It has always been watching the door.' },
    ],
    npcs: [
      { x: 7, y: 2, name: 'SYBIL', art: 'sabrina', skin: '#f0c8a0', shirt: '#7a2a4a', pants: '#2a2a3a', hair: '#1a2a4a', trainer: 'sabrina',
        dialogue: ['I foresaw your arrival three turns of the moon ago. The future is a door — and I am holding it shut.', 'The door opens a crack. Take the Marsh Badge — and go on surprising me.'] },
      { x: 4, y: 5, name: 'MEDIUM LIA', art: 'monk', skin: '#e8b888', shirt: '#4a3a5a', pants: '#2a2a3a', hair: '#8a8a9a', trainer: 'gym_saffron_1', sight: { dir: 'right', range: 3 },
        dialogue: ['My senses tingle — a challenger with a loud heart approaches!', 'So loud... and so kind. Odd.'] },
    ],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'gym-cinnabar': {
    id: 'gym-cinnabar', name: 'Caldera Gym', music: 'gym-theme', indoor: true,
    rows: [
      'Ṛ===============',
      '=νṒṓḙḗλSSṑλḘ␢␢Ṓ=',
      '=␢␢␢␢Ṣ␢␢␢␢␢␢␢␢␢=',
      '=␢␢␢␢ξ␢␢␢␢ξ␢␢␢␢=',
      '=␢␢␢␢␢␢␢␢␢␢␢␢␢␢=',
      '=␢␢␢␢␢␢//␢␢␢␢␢␢=',
      '=␢␢␢␢ξ␢//␢ξ␢␢␢␢=',
      '=␢␢␢␢␢␢␢␢␢␢␢␢␢␢=',
      '=␢␢␢)␢␢␢␢␢␢)␢␢␢=',
      '=======DD=======',
    ],
    warps: [
      { x: 7, y: 9, to: { map: 'cinnabar', x: 15, y: 7 } },
      { x: 8, y: 9, to: { map: 'cinnabar', x: 16, y: 7 } },
    ],
    signs: [
      { x: 7, y: 1, text: 'QUIZ: A volcano sleeps under this island. True or false? (Ignas grades on attitude.)' },
      { x: 8, y: 1, text: 'QUIZ: What beats Fire every time? Answer at the door, with your whole team.' },
    ],
    npcs: [
      { x: 8, y: 2, name: 'IGNAS', art: 'blaine', skin: '#e8b888', shirt: '#a03a2a', pants: '#3a3a4a', hair: '#e8e4da', trainer: 'blaine',
        dialogue: ['Wahaha! A challenger climbs MY mountain of fire? Riddle me this first: what burns hotter — magma, or regret? Battle me and find out!', 'Scalded but smiling — that is the correct answer. The Volcano Badge, hot off the press!'] },
      { x: 11, y: 5, name: 'BURGLAR OTIS', art: 'biker', skin: '#c89878', shirt: '#51296b', pants: '#2a2a3a', hair: '#3a2a1a', trainer: 'gym_cinnabar_1', sight: { dir: 'left', range: 3 },
        dialogue: ['I only came in to warm my hands, honest! ...Fine. Battle first, alibi later.', 'Hot hands, cold heart. Story of my life.'] },
    ],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  silph2: {
    id: 'silph2', name: 'Vantage Co. — Executive Floor', music: 'pewter-theme', indoor: true,
    rows: [
      'ṛṠIIIIIIIIIIIIIIẀI',
      'Iθḛω%%%(%%%%%%%%θI',
      'IḞ%ẃẃ%%SSSS%%%%%%I',
      'I%%%%%%%%%%%%%%%%I',
      'Ẁ%%%%%ẃ%%%%%%%%%%I',
      'I%%ξḜψζ%ẃ%%%%%ξ%%I',
      'Iẃ%%%%%%ε%%%%%%%%I',
      'I%%%%%%%%%%%%%%%%I',
      'I%%ξ%%%%%%%%γ%ξ%ẃI',
      'I%ẃ%%%%%%%%%%%%%%I',
      'Ẁ%%%%%%ẃ%%%%%%%%ḝẀ',
      'IIIIIIẀIIIIIIẀIIII',
    ],
    warps: [
      { x: 8, y: 3, to: { map: 'silph1', x: 8, y: 6 } },
      { x: 9, y: 3, to: { map: 'silph1', x: 9, y: 6 } },
    ],
    signs: [
      { x: 7, y: 2, text: 'PRESIDENT\'S OFFICE — AUTHORIZED SMILES ONLY BEYOND THIS POINT.' },
      { x: 8, y: 2, text: 'A photo on the desk: a younger president, a beach, and something small and pink at the edge of the frame.' },
      { x: 9, y: 2, text: 'Filing cabinet: Q1..Q4 reports, and one folder labeled only "EXILE ISLE — DO NOT OPEN".' },
      { x: 10, y: 2, text: 'The big chair has been spun around to face the window for some time.' },
    ],
    npcs: [
      { x: 8, y: 1, name: 'THE PRESIDENT', art: 'gent', skin: '#e8c098', shirt: '#3a4a6a', pants: '#2a2a3a', hair: '#c8c8d0',
        dialogue: ['You climbed eleven floors of trouble to reach an old man at a desk. The Scope, the company, my gratitude — and this prototype ball. Take them all.', 'Whatever is on that island, child — it is older than this company and sadder than its board. Go gently.'],
        give: { flag: 'silph_president_gift', items: { masterball: 1 }, text: 'the Master Orb prototype' } },
      { x: 15, y: 3, name: 'AIDE NOVA', art: 'aide', skin: '#f0c8a0', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#5a3a6a',
        dialogue: ['I hid the transport project when they stormed in. KELPSAIL — gentle, strong, and it can carry you across any water. Take it. Please. Get us help, or be the help.', 'KELPSAIL sings when the sea is calm. You will be good for each other.'],
        giveMon: { species: 'lapras', level: 15 } },
    ],
    encounters: null,
    items: [
      { x: 2, y: 10, item: 'cardkey', n: 1 },
    ],
    hidden: [],
    events: [
      { id: 'ev_silph_boss', x: 8, y: 4, when: { flagNot: 'silph_done' } },
      { id: 'ev_silph_boss', x: 9, y: 4, when: { flagNot: 'silph_done' } },
    ],
    start: null,
  },

  // ---- World Art Wave 5b: house interiors + the shared Mart ----
  // One template family (10x7, house tileset, Wave 5a prop library) in
  // four layout variants (A bed-NW / B bed-NE / C bed-W / D bed-E) with
  // per-house prop mixes. Every exit pair lands on the town door's one
  // front tile; every entry lands at (4,4), the exit doors' front row,
  // so no interior can trap. The Mart is ONE shared interior on the
  // Center pattern: town doors carry a via{} return ticket, the exits
  // carry viaExit:true, and loadMap fields the origin town's own clerk
  // (its stock/dialogue definition stays in the town's data) behind
  // the goods counter — Fernmere fields its SHOPKEEPER tale actor
  // instead (data/quests.mjs). Mart base npcs are therefore empty.
  mart: {
    id: 'mart', name: 'Mart', music: 'mart-theme', indoor: true,
    rows: [
      'Ṛṟ;;;;;;;;;;',
      ';ιιιḌ$$$$κκ;',
      ';ḍ$$$$$$$$ḍ;',
      ';ḋ$$ααα$$$θ;',
      ';$$$$$$$$$$;',
      ';$$$$$$$$$$;',
      ';Ḏ$$$DD$$$$;',
      ';;;;;;;;;;;;',
    ],
    warps: [
      { x: 5, y: 6, to: { map: 'viridian', x: 13, y: 8 }, viaExit: true },
      { x: 6, y: 6, to: { map: 'viridian', x: 14, y: 8 }, viaExit: true },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-pallet-ash': {
    id: 'house-pallet-ash', name: 'Your House', music: 'pallet-theme', indoor: true,
    rows: [
      'ṛ<<<<<<<<<',
      '<δḥḦηḑḒθḏ<',
      '<ḓ*******<',
      '<*εζ***(*<',
      '<**)***ω*<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'pallet', x: 2, y: 8 } },
      { x: 5, y: 5, to: { map: 'pallet', x: 2, y: 8 } },
    ],
    signs: [
      { x: 4, y: 1, text: 'A shelf of maps in a careful hand, and a teacup that never quite empties.' },
    ],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-pallet-gary': {
    id: 'house-pallet-gary', name: "Vale's House", music: 'pallet-theme', indoor: true,
    rows: [
      'ṙ<<<<<<<<<',
      '<θḏηḧḔḕḉδ<',
      '<********<',
      '<*γ***εζ*<',
      '<ω***))**<',
      '<Ḩ**DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'pallet', x: 11, y: 4 } },
      { x: 5, y: 5, to: { map: 'pallet', x: 11, y: 4 } },
    ],
    signs: [
      { x: 3, y: 1, text: 'Battle magazines, spine-cracked, sorted by badge season.' },
    ],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-viridian': {
    id: 'house-viridian', name: 'Fernmere City — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṡ<<<<<<<<<',
      '<γḽηṛ***η<',
      '<δ******Ḕ<',
      '<ω(*****ḓ<',
      '<*****))Ḣ<',
      '<*εζDD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'viridian', x: 17, y: 4 } },
      { x: 5, y: 5, to: { map: 'viridian', x: 17, y: 4 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-pewter-w': {
    id: 'house-pewter-w', name: 'Flintridge City — House', music: 'pewter-theme', indoor: true,
    rows: [
      'Ṟ<<<<<<<<<',
      '<θḏηḫṣḑγδ<',
      '<********<',
      '<*(***εζ*<',
      '<ω***))**<',
      '<Ḭ**DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'pewter', x: 2, y: 8 } },
      { x: 5, y: 5, to: { map: 'pewter', x: 2, y: 8 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-pewter-e': {
    id: 'house-pewter-e', name: 'Flintridge City — House', music: 'pewter-theme', indoor: true,
    rows: [
      'ṛ<<<<<<<<<',
      '<θḭḮηγḑḒḏ<',
      '<*******δ<',
      '<ω**εζ***<',
      '<*))*****<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'pewter', x: 16, y: 8 } },
      { x: 5, y: 5, to: { map: 'pewter', x: 16, y: 8 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-cerulean': {
    id: 'house-cerulean', name: 'Tidehaven City — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṙ<<<<<<<<<',
      '<δḯḰηḒḓθḏ<',
      '<Ḕ*******<',
      '<*εζ***(*<',
      '<**)***ω*<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'cerulean', x: 3, y: 12 } },
      { x: 5, y: 5, to: { map: 'cerulean', x: 3, y: 12 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-vermilion': {
    id: 'house-vermilion', name: 'Arcport City — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṡ<<<<<<<<<',
      '<θḏηḱḕḉḐδ<',
      '<********<',
      '<Ḳ(***εζ*<',
      '<ω***))**<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'vermilion', x: 2, y: 8 } },
      { x: 5, y: 5, to: { map: 'vermilion', x: 2, y: 8 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-celadon-w': {
    id: 'house-celadon-w', name: 'Canopy City — House', music: 'viridian-theme', indoor: true,
    rows: [
      'Ṟ<<<<<<<<<',
      '<θḳḴηḢṢṣḏ<',
      '<*******δ<',
      '<ω**εζ***<',
      '<*))*****<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'celadon', x: 6, y: 4 } },
      { x: 5, y: 5, to: { map: 'celadon', x: 6, y: 4 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-celadon-e': {
    id: 'house-celadon-e', name: 'Canopy City — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṛ<<<<<<<<<',
      '<δḵḶηγḑθḏ<',
      '<Ḓ*******<',
      '<*εζ***(*<',
      '<**)***ω*<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'celadon', x: 17, y: 4 } },
      { x: 5, y: 5, to: { map: 'celadon', x: 17, y: 4 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-lavender': {
    id: 'house-lavender', name: 'Hushmoor Town — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṙ<<<<<<<<<',
      '<ηḟḥḟṛḾḓη<',
      '<δḸ*****Ḕ<',
      '<ω******θ<',
      '<Ḣ****))*<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'lavender', x: 2, y: 4 } },
      { x: 5, y: 5, to: { map: 'lavender', x: 2, y: 4 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-fuchsia': {
    id: 'house-fuchsia', name: "Auntie Moss's House", music: 'viridian-theme', indoor: true,
    rows: [
      'ṡ<<<<<<<<<',
      '<θḹḓηḔḕ*ḏ<',
      '<Ḻ******δ<',
      '<ω**εζ***<',
      '<*))*****<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'fuchsia', x: 3, y: 4 } },
      { x: 5, y: 5, to: { map: 'fuchsia', x: 3, y: 4 } },
    ],
    signs: [],
    npcs: [
      // Wave 5b: the one resident whose dialogue names her house ("My
      // house? The warden borrows it half the year...") — same NPC,
      // same lines, now standing inside it (was Bramble (2,5)).
      { x: 6, y: 2, name: 'AUNTIE MOSS', art: 'elder', skin: '#e8b888', shirt: '#50368e', pants: '#4a4a5a', hair: '#c0c0c0',
        dialogue: ["My house? The warden borrows it half the year and leaves it smelling of bait and boot polish.", "If I'd a spare set of teeth I'd trade him for his, just to end the mumbling. Family rates, of course."] },
    ],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-cinnabar': {
    id: 'house-cinnabar', name: 'Caldera Town — House', music: 'viridian-theme', indoor: true,
    rows: [
      'Ṟ<<<<<<<<<',
      '<θḏηḻḉḐḢδ<',
      '<********<',
      '<Ḽ(***εζ*<',
      '<ω***))**<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'cinnabar', x: 3, y: 8 } },
      { x: 5, y: 5, to: { map: 'cinnabar', x: 3, y: 8 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
  'house-indigo': {
    id: 'house-indigo', name: 'Crownspire — House', music: 'viridian-theme', indoor: true,
    rows: [
      'ṛ<<<<<<<<<',
      '<δḽḾηṢṣθḏ<',
      '<γ*******<',
      '<*εζ***(*<',
      '<**)***ω*<',
      '<***DD***<',
      '<<<<<<<<<<',
    ],
    warps: [
      { x: 4, y: 5, to: { map: 'indigo', x: 3, y: 14 } },
      { x: 5, y: 5, to: { map: 'indigo', x: 3, y: 14 } },
    ],
    signs: [],
    npcs: [],
    encounters: null, items: [], hidden: [], events: [], start: null,
  },
};

// ---- travel-graph repairs (fidelity audit, ADR-019) ----
MAPS4.vermilion = {
  ...MAPS2.vermilion,  npcs: [
    ...MAPS2.vermilion.npcs,
    { x: 10, y: 10, name: 'SAILOR BRINE', art: 'sailor', skin: '#d8a878', shirt: '#3a6ac0', pants: '#2a2a3a', hair: '#4a3a2a', ferry: 'stanne',
      dialogue: ['The S.S. Tern is in port, shining like a coin in a fountain. Ticket holders, step lively!', 'Fine sailing, trainer. Mind the gulls — they have seen things.'] },
  ],
  events: [
    ...(MAPS2.vermilion.events || []),
    // The First Movie invitation arrives at the dock once the Earth Badge
    // is earned (owner watch order: after the Fernmere Gym finale).
    { id: 'ev_movie_arrive', x: 8, y: 11, when: { flag: 'badge_earth', flagNot: 'movie_done' } },
    { id: 'ev_movie_arrive', x: 9, y: 11, when: { flag: 'badge_earth', flagNot: 'movie_done' } },
  ],
};
MAPS4.stanne = { ...MAPS2.stanne, start: { x: 8, y: 8 } };
MAPS4.gamecorner = {
  ...MAPS2.gamecorner,
  warps: [
    ...MAPS2.gamecorner.warps,
    // The poster in the corner is not just a poster. (Floor tiles only —
    // the seat's original poster coordinates landed inside a wall.)
    { x: 14, y: 2, to: { map: 'hideout', x: 8, y: 8 } },
    { x: 15, y: 2, to: { map: 'hideout', x: 9, y: 8 } },
  ],
};
MAPS4.hideout = {
  ...MAPS2.hideout,
  warps: (MAPS2.hideout.warps || []).map((w) => ({ ...w, to: { map: 'gamecorner', x: w.x === 8 ? 14 : 15, y: 3 } })),
  events: [
    ...(MAPS2.hideout.events || []),
    { id: 'ev_hideout_entry', x: 8, y: 8, when: { flagNot: 'ev_hideout_entry_done' } },
  ],
};
MAPS4.newisland = {
  ...MAPS3.newisland,
  // The invite event fires on the Arcport dock (above); on the island
  // only the climax remains, and the dock boat goes home again.
  events: (MAPS3.newisland.events || []).filter((e) => e.id !== 'ev_movie_arrive'),
  warps: [
    { x: 8, y: 10, to: { map: 'vermilion', x: 8, y: 10 } },
    { x: 9, y: 10, to: { map: 'vermilion', x: 9, y: 10 } },
  ],
};

// Route trainers referenced by maps2 whose definitions were in the lost
// tail of that file — authored here on the campaign level curve.
export const TRAINERS4 = {
  // ADR-025 §5 (Town Tales): the Tidehaven cape culprit — the one tale
  // battle fought as a real trainer battle (a talk-it-out path exists
  // beside it). One low-level mon: a errand fight, never a boss.
  tale_kid: { id: 'tale_kid', name: 'Pip', title: 'Youngster',
    team: [{ species: 'oddish', level: 13 }], reward: 120,
    intro: ['You want the bell? Then take it off my whole team! (It is one NIGHTBUD. We are both scared.)'],
    lose: ['NIGHTBUD says uncle. I say uncle. UNCLE. The bell is yours — it was always yours.'] },
  r3_lass: { id: 'r3_lass', name: 'Lass Mina', team: [{ species: 'pidgey', level: 11 }, { species: 'nidoranf', level: 12 }], prize: 240,
    intro: ['I practiced all week for a trainer like you!'], lose: ['Practice or not — you were better.'] },
  r3_bug: { id: 'r3_bug', name: 'Bug Catcher Colt', team: [{ species: 'caterpie', level: 11 }, { species: 'weedle', level: 11 }, { species: 'metapod', level: 12 }], prize: 180,
    intro: ['My net, my rules!'], lose: ['My net has a hole in it. So does my strategy.'] },
  moon_grunt: { id: 'moon_grunt', name: 'Vanta Grunt', team: [{ species: 'zubat', level: 13 }, { species: 'sandshrew', level: 13 }], prize: 420,
    intro: ['This cave is ours now. The fossils too.'], lose: ['Tch. The boss will hear about this...'] },
  r4_lass: { id: 'r4_lass', name: 'Lass Robin', team: [{ species: 'oddish', level: 14 }, { species: 'bellsprout', level: 14 }], prize: 280,
    intro: ['Tidehaven is just over the hill — but I am the hill!'], lose: ['Okay. The hill has been climbed.'] },
  r5_camper: { id: 'r5_camper', name: 'Camper Flint', team: [{ species: 'growlithe', level: 16 }, { species: 'diglett', level: 15 }], prize: 320,
    intro: ['Camp rule one: challenge everyone who passes!'], lose: ['Camp rule two: lose gracefully. Sigh.'] },
  r6_bug: { id: 'r6_bug', name: 'Bug Catcher Wes', team: [{ species: 'butterfree', level: 18 }, { species: 'beedrill', level: 18 }], prize: 300,
    intro: ['My bugs grew up. So did I. Mostly.'], lose: ['Growing up is a work in progress.'] },
  r11_gamer: { id: 'r11_gamer', name: 'Gambler Hugo', team: [{ species: 'poliwag', level: 20 }, { species: 'horsea', level: 20 }], prize: 900,
    intro: ['All my money on this battle. Again.'], lose: ['One day the odds will read the script.'] },
  r7_lass: { id: 'r7_lass', name: 'Lass Petra', team: [{ species: 'meowth', level: 24 }, { species: 'vulpix', level: 24 }], prize: 480,
    intro: ['Canopy sparkle meets route grit!'], lose: ['The grit won this round.'] },
};

// Vantage rival ambush placement (was unplaced in maps3's delivery).
MAPS4.silph1 = {
  ...(MAPS3.silph1 || {}),
  events: [
    ...((MAPS3.silph1 && MAPS3.silph1.events) || []),
    { id: 'ev_silph_rival', x: 8, y: 9, when: { flagNot: 'silph_rival_done' } },
    { id: 'ev_silph_rival', x: 9, y: 9, when: { flagNot: 'silph_rival_done' } },
  ],
};
