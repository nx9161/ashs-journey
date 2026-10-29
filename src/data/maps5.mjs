// maps5.mjs — Arc 1.5 Stage O1: the Orange Islands (maps, world art data,
// wild tables, ferry network). 30 new maps: 11 island exteriors, 4 sea
// lanes, 15 interiors. Every exterior/sea map is >=24x14 (viewport-
// filling from the first tile, roadmap §5 note). Travel law: the
// Vermilion<->Valencia crossing is the Stage F ferryArc network port
// (embark-gated outbound, unconditional return); every island dock
// fields plain two-way ferry legs to its neighbours (the island-hopper
// graph is connected by construction); sea lanes are surfable and
// stitch island<->lane<->island by edge warps. The shared 'center' and
// 'mart' interiors serve every island via the shipped via{} tickets —
// no per-island centers/marts are authored. Gym interiors are layouts
// only (leaders/battles: Stage O2); the Lugia story is Stage O3.
import { MAPS4 } from './maps4.mjs';

export const MAPS5 = {
  "valencia": {
    "id": "valencia",
    "name": "Valencia Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞdeeeefẞẞjklm.ẞdeefẞẞabc~~",
      "~~ẞZZ45ZZ_ẞAJKA._P12Pẟẞrst~~",
      "~~ẞ.....Sẟ_....._....__...~~",
      "~~........................~~",
      "~~ẞ_ẞẞ___n_F_ẞ..ẟẟ______ẘẞ~~",
      "~~ẞ_ẟẟẞ______ẘ..ẟ_ẞ_ẞ__oẅẞ~~",
      "~~ẞẞ,,,ẞ_ṃ_ẟ__..__ẟ__ẟ__ẟẟ~~",
      "~~ẞẞ,,,ẟẟẞ____..ẟẟẞẞ_ẟ_nẟẞ~~",
      "~~ẞo__ẅ_______..______ẅRẞẟ~~",
      "~~ẞẞṃ_ẟ___ẘ__ẟ..ẞẞẟ___ẟ_ẟẞ~~",
      "~~ẞ_,,,__ẞ_ẞẞ_.._ẞẟ__,,,_ẅ~~",
      "~~ẞẟ,,,_ẟ_ẞẟẟF..ẟoẞ__,,,ẞẞ~~",
      "~~ẞẟ__ẅ__ṃ___ẞ.._ẘ___ẟẟẟẟẞ~~",
      "~~ẞẞẞẞẞẞoẞRẞẞẞ..ẞSẞẞẅẞẞ#ẞẞ~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "ivy-lab",
          "x": 8,
          "y": 10
        }
      },
      {
        "x": 6,
        "y": 3,
        "to": {
          "map": "ivy-lab",
          "x": 9,
          "y": 10
        }
      },
      {
        "x": 12,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "valencia",
          "x": 12,
          "y": 4
        }
      },
      {
        "x": 13,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "valencia",
          "x": 13,
          "y": 4
        }
      },
      {
        "x": 18,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 5,
          "y": 5
        },
        "via": {
          "map": "valencia",
          "x": 18,
          "y": 4
        }
      },
      {
        "x": 19,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 6,
          "y": 5
        },
        "via": {
          "map": "valencia",
          "x": 19,
          "y": 4
        }
      },
      {
        "x": 24,
        "y": 3,
        "to": {
          "map": "house-valencia",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 27,
        "y": 8,
        "to": {
          "map": "orange-sea-west",
          "x": 1,
          "y": 8
        }
      },
      {
        "x": 27,
        "y": 9,
        "to": {
          "map": "orange-sea-west",
          "x": 1,
          "y": 9
        }
      }
    ],
    "signs": [
      {
        "x": 17,
        "y": 15,
        "text": "Valencia Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      },
      {
        "x": 8,
        "y": 4,
        "text": "PROF. IVY'S LAB — Marine Pokemon research. A certain unopenable Poke Ball rests inside."
      }
    ],
    "npcs": [
      {
        "x": 6,
        "y": 15,
        "name": "CAPT PICO-VERM",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Vermilion City boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "vermilion",
        "ferryArc": "orange"
      },
      {
        "x": 8,
        "y": 15,
        "name": "SAILOR BRUNO-MIKA",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Mikan Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "mikan"
      },
      {
        "x": 10,
        "y": 15,
        "name": "CAPT DUNE-NAVE",
        "art": "sailor",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "The Navel Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "navel"
      },
      {
        "x": 14,
        "y": 13,
        "name": "MARA",
        "art": "lady",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "Valencia grows oranges sweet enough to make a Snorlax sit up.",
          "Professor Ivy studies the sea's odd Poke Balls in the lab up the street."
        ]
      },
      {
        "x": 15,
        "y": 13,
        "name": "THEO",
        "art": "kid",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "A Lapras pod sang past the pier this morning!",
          "When I grow up I'm sailing every island. Every single one."
        ]
      },
      {
        "x": 3,
        "y": 5,
        "name": "MART CLERK",
        "art": "clerk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Island Mart — balls, potions, and ferry-day essentials. Stock up before you sail!"
        ],
        "mart": {
          "stock": [
            "pokeball",
            "greatball",
            "superpotion",
            "hyperpotion",
            "revive",
            "antidote"
          ]
        }
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 14,
      "y": 15
    }
  },
  "mikan": {
    "id": "mikan",
    "name": "Mikan Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞdeefẞẞjklm..deefẞẞabc~~",
      "~~ẞUVYU_ẟAJKA..P12P__rst~~",
      "~~ẞ...S__..........ẞ_...~~",
      "~~......................~~",
      "~~oẟ___ẟ_ẞ_ẞ_..ẟ_ẟ____ẞẞ~~",
      "~~ẞẞ__ẟ_ẞ_ẞ_ẟ..ẞẞẞ__ẟ__ẞ~~",
      "~~ẞ_,,,_Ẇẟ___..ẟẞ_ẟ___#ẞ~~",
      "~~ẞẞ,,,ẟ___ẟẞ.._ẟ_ẟẟ___ẞ~~",
      "~~ẟ_,,,___ẟ__..____,,,_ẞ~~",
      "~~ẞ_,,,ẟẞ___ṃ..__n_,,,_ẞ~~",
      "~~ẟẞ_ẞẞẟ_ẟẞ__..__ẟẟẞ_ẟ_ẞ~~",
      "~~ẞẞẞẞẞẞẞẞẞẞẞ..ẞSẈẘẞẞẞẞẞ~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "mikan-gym",
          "x": 7,
          "y": 8
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "mikan-gym",
          "x": 8,
          "y": 8
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "mikan",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "mikan",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 16,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 5,
          "y": 5
        },
        "via": {
          "map": "mikan",
          "x": 16,
          "y": 4
        }
      },
      {
        "x": 17,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 6,
          "y": 5
        },
        "via": {
          "map": "mikan",
          "x": 17,
          "y": 4
        }
      },
      {
        "x": 22,
        "y": 3,
        "to": {
          "map": "house-mikan",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 2,
        "y": 15,
        "to": {
          "map": "orange-sea-west",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 15,
        "to": {
          "map": "orange-sea-west",
          "x": 3,
          "y": 1
        }
      }
    ],
    "signs": [
      {
        "x": 16,
        "y": 13,
        "text": "Mikan Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      },
      {
        "x": 6,
        "y": 4,
        "text": "MIKAN GYM — The Coral-Eye challenge waits inside. (Stage O2: the gym battle ships with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 7,
        "y": 13,
        "name": "CAPT REGAL-VALE",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Valencia Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "valencia"
      },
      {
        "x": 9,
        "y": 13,
        "name": "SAILOR LILO-NAVE",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Navel Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "navel"
      },
      {
        "x": 13,
        "y": 11,
        "name": "CISSY-FAN REN",
        "art": "youngster",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Mikan's gym stands over the water — the range out back floats on pontoons.",
          "Target practice at dawn. The whole island wakes to it."
        ]
      },
      {
        "x": 14,
        "y": 11,
        "name": "ULA",
        "art": "swimmer",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "The lagoon is warm as soup. Mind the Corsola— er, the coral.",
          "I race the ferry to Navel on calm days. I have never won."
        ]
      },
      {
        "x": 3,
        "y": 5,
        "name": "MART CLERK",
        "art": "clerk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Island Mart — balls, potions, and ferry-day essentials. Stock up before you sail!"
        ],
        "mart": {
          "stock": [
            "pokeball",
            "greatball",
            "superpotion",
            "antidote",
            "awakening"
          ]
        }
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 13,
      "y": 13
    }
  },
  "navel": {
    "id": "navel",
    "name": "Navel Island",
    "music": "pewter-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẟdeefẞFjklm..RRRẈRRRRR~~",
      "~~ẞUVYUF_AJKA..RẘRRR...S~~",
      "~~ẞ...Sẟ_......RRR...RRR~~",
      "~~......................~~",
      "~~ẞẟ_n___ẞ_ẟẟ..R.RRRRRRR~~",
      "~~ẞ____n_ẞ_ẟẞ....ṃRRRRRR~~",
      "~~ẟ_,,,ẞ___ẟẞ.._______ẞẞ~~",
      "~~ẞẟ,,,ẟ_____..______ẟẄẞ~~",
      "~~ẞ____ẟẞ_ẅẘ_.._ẈẟẟẞẈ_ẟẞ~~",
      "~~ẞ__ẟ_Ẇ_____..Ẅ__ẟẟ_ẟ_ẞ~~",
      "~~Ẅẞ,,,ẞo___ẟ..__n_,,,ẟẞ~~",
      "~~ẞẟ,,,ẞẟẈ_ẟ_..___ẟ,,,_ẞ~~",
      "~~ẟ__ẟ_____ẟ_.._ẟ_____ẟẞ~~",
      "~~ẞẞẞẞẞẞẞẞẞẞẞ..ẞSẞẞẞẞẞẞẞ~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "navel-gym",
          "x": 7,
          "y": 8
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "navel-gym",
          "x": 8,
          "y": 8
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "navel",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "navel",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 2,
        "y": 17,
        "to": {
          "map": "orange-sea-central",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 17,
        "to": {
          "map": "orange-sea-central",
          "x": 3,
          "y": 1
        }
      },
      {
        "x": 12,
        "y": 0,
        "to": {
          "map": "orange-sea-north",
          "x": 12,
          "y": 14
        }
      },
      {
        "x": 13,
        "y": 0,
        "to": {
          "map": "orange-sea-north",
          "x": 13,
          "y": 14
        }
      }
    ],
    "signs": [
      {
        "x": 23,
        "y": 3,
        "text": "NAVEL PEAK — The island wears its mountain like a crown. Climbers leave a stone; the mountain keeps them all."
      },
      {
        "x": 16,
        "y": 15,
        "text": "Navel Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      },
      {
        "x": 6,
        "y": 4,
        "text": "NAVEL GYM — The Sea Ruby challenge waits inside, up where the slope begins."
      }
    ],
    "npcs": [
      {
        "x": 5,
        "y": 15,
        "name": "CAPT FESTUS-VALE",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Valencia Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "valencia"
      },
      {
        "x": 7,
        "y": 15,
        "name": "SAILOR LILO-MIKA",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Mikan Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "mikan"
      },
      {
        "x": 9,
        "y": 15,
        "name": "CAPT MARINA-MORO",
        "art": "sailor",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "The Moro Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "moro"
      },
      {
        "x": 13,
        "y": 13,
        "name": "BOULDER BEN",
        "art": "hiker",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "One stone per climber at the summit. Mine's the handsome one.",
          "The peak path switchbacks — take it slow, the view pays you back."
        ]
      },
      {
        "x": 14,
        "y": 13,
        "name": "IDA",
        "art": "elder",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "Navel's gym bakes its slope into the challenge itself, they say.",
          "Mountain weather turns fast. Pack a jumper, dear."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "geodude",
          "min": 28,
          "max": 36,
          "weight": 40
        },
        {
          "species": "onix",
          "min": 30,
          "max": 38,
          "weight": 25
        },
        {
          "species": "graveler",
          "min": 32,
          "max": 40,
          "weight": 15
        },
        {
          "species": "rhyhorn",
          "min": 28,
          "max": 36,
          "weight": 20
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 13,
      "y": 15
    }
  },
  "moro": {
    "id": "moro",
    "name": "Moro Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẟjklmẟẞẞẄẞẘ..ẞẞẞẞẞẞẞẞẞ~~",
      "~~ẞAJKAẈ__ẟ__..__ẟẟ__ẞẟẞ~~",
      "~~ẟ....ẟ__ẟ__..ẟ__ẟẞ__ẟẞ~~",
      "~~......................~~",
      "~~ẞẞẞẞẟ___ẞạạ..ạạ_____ẟẞ~~",
      "~~ẞ__ẟ___ẟ_ạẞ.._ạ____Ẅ_ẞ~~",
      "~~ẞẞ,,,ẟ__ẞ_ẞṿ.ẟẟo_ẞ_ẞ_ẞ~~",
      "~~ẞ_,,,______.ṿẘẟ___Fẞ_ẞ~~",
      "~~ẞẞ,,,_ẟ__ạ#.._ạẟ_,,,ṿẞ~~",
      "~~ẞ_,,,ẄFẟ_ẟạ..ạ__Ẇ,,,_ẞ~~",
      "~~ẞ___ẟ_ẟẟẞẟ_..___ẞẟ__ẟẟ~~",
      "~~ẞẞẞẞẞẞẞẞẞẞẞ..ẞSẞẞẟoẞẞẞ~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "moro",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "moro",
          "x": 5,
          "y": 4
        }
      },
      {
        "x": 12,
        "y": 0,
        "to": {
          "map": "orange-sea-central",
          "x": 12,
          "y": 14
        }
      },
      {
        "x": 13,
        "y": 0,
        "to": {
          "map": "orange-sea-central",
          "x": 13,
          "y": 14
        }
      }
    ],
    "signs": [
      {
        "x": 13,
        "y": 7,
        "text": "OLD RUINS — A harbour town stood here once, say the Moro elders. The sea took the streets and left the stones."
      },
      {
        "x": 16,
        "y": 13,
        "text": "Moro Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      }
    ],
    "npcs": [
      {
        "x": 7,
        "y": 13,
        "name": "CAPT BRUNO-NAVE",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Navel Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "navel"
      },
      {
        "x": 9,
        "y": 13,
        "name": "SAILOR BRUNO-TROV",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Trovita Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "trovita"
      },
      {
        "x": 13,
        "y": 11,
        "name": "WREN SR",
        "art": "elder",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Quiet Moro. The ruins were old when my grandmother was a girl.",
          "A ship went down in the cove long ago. On still nights you can hear her bell."
        ]
      },
      {
        "x": 14,
        "y": 11,
        "name": "PIP",
        "art": "kid",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "I found a barnacle shaped exactly like a Poke Ball!",
          "The ghost ship isn't real. Probably. I don't go at night."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 13,
      "y": 13
    }
  },
  "trovita": {
    "id": "trovita",
    "name": "Trovita Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞdeefẞẞjklm..deefẞẞFẞẟ~~",
      "~~ẞUVYU__AJKA..P12Pn_ẟ_ẞ~~",
      "~~ẞ...Sẟẟ..........____ẞ~~",
      "~~......................~~",
      "~~ẞẞ_ẞẆẟẟ___ẟ..___ẞẟẟẞ_ẞ~~",
      "~~ẞ_F___ẟ____..___ẞ___ẟ#~~",
      "~~ẞ_,,,Ẇ___ẞẞ..__ẟẟ__#ẟẟ~~",
      "~~ẞẘ,,,_ẟ_ẟ__..ẞ_ẟ____ẅẞ~~",
      "~~ẞẞ,,,____ẞ_..___R,,,ẘẟ~~",
      "~~ẞẟ,,,__ẞẘẟ_..ẟẞẟẟ,,,_ẞ~~",
      "~~ẞ____ẟ_ẟẞẟ_.._ẟẟẘẟR__ẞ~~",
      "~~ẞẞẞẟẞẆẟẞẞẞẞ..ẞSẟẞẞẞẞẞẞ~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~",
      "~~~~~~~~~~~~~..~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "trovita-gym",
          "x": 7,
          "y": 8
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "trovita-gym",
          "x": 8,
          "y": 8
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "trovita",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "trovita",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 16,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 5,
          "y": 5
        },
        "via": {
          "map": "trovita",
          "x": 16,
          "y": 4
        }
      },
      {
        "x": 17,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 6,
          "y": 5
        },
        "via": {
          "map": "trovita",
          "x": 17,
          "y": 4
        }
      },
      {
        "x": 12,
        "y": 0,
        "to": {
          "map": "orange-sea-east",
          "x": 12,
          "y": 14
        }
      },
      {
        "x": 13,
        "y": 0,
        "to": {
          "map": "orange-sea-east",
          "x": 13,
          "y": 14
        }
      }
    ],
    "signs": [
      {
        "x": 16,
        "y": 13,
        "text": "Trovita Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      },
      {
        "x": 6,
        "y": 4,
        "text": "TROVITA GYM — The Spike Shell challenge waits inside, among the rock spikes."
      }
    ],
    "npcs": [
      {
        "x": 5,
        "y": 13,
        "name": "CAPT DUNE-MORO",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Moro Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "moro"
      },
      {
        "x": 7,
        "y": 13,
        "name": "SAILOR DUNE-KUMQ",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Kumquat Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "kumquat"
      },
      {
        "x": 9,
        "y": 13,
        "name": "CAPT DUNE-PUMM",
        "art": "sailor",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "The Pummelo Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "pummelo"
      },
      {
        "x": 13,
        "y": 11,
        "name": "SPIKE FAN SORA",
        "art": "youngster",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "Trovita's rock spikes grew around the gym like it was always meant to stand there.",
          "Trainers come off the ferry already arguing strategy."
        ]
      },
      {
        "x": 14,
        "y": 11,
        "name": "MARE",
        "art": "fisher",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "I fish the spike shadows. Big ones lurk where the rock meets the sea.",
          "Mind the spray on the east shore — it soaks clean through."
        ]
      },
      {
        "x": 3,
        "y": 5,
        "name": "MART CLERK",
        "art": "clerk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Island Mart — balls, potions, and ferry-day essentials. Stock up before you sail!"
        ],
        "mart": {
          "stock": [
            "greatball",
            "superpotion",
            "hyperpotion",
            "antidote",
            "parlyzheal"
          ]
        }
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 13,
      "y": 13
    }
  },
  "kumquat": {
    "id": "kumquat",
    "name": "Kumquat Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞdeefẞẞjklmẞ.deefẞẞabcẞẞ~~",
      "~~ẘUVYUẟ_AJKAẞ.P12Pẟẘrst_ẞ~~",
      "~~ẞ...S_ẟ....ẟ....._ẞ..._ẞ~~",
      "~~........................~~",
      "~~ẞ_ẟ__ẟ_ẟẞ___..__ẞ_ẟ_ẞ__R~~",
      "~~ẞ_ẞ_ẟẟn__ẞẞẟ..____ẟ_ẞ__ẞ~~",
      "~~ẞ_,,,ẟ__ẞ___.._ẞ__ẟ_ẟ__ẞ~~",
      "~~ẞ_,,,_ẚẟẞẟẟ_.._ẞ______ẟẞ~~",
      "~~ẞ_,,,_ẞẛ___ẞ..ẞ__ẛ_,,,_ẞ~~",
      "~~ẟ_,,,__ẄẟẞẟẈ..ẟẟẛẟ_,,,ẟẞ~~",
      "~~ẞẞ____ẟẟ___ẚ.._ẞ___#_Ẇnẞ~~",
      "~~ẞẞẞoẞẘẞẟẞẚẞẞ..ẞSẞẞẞẞẟẞẛẞ~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "kumquat-gym",
          "x": 7,
          "y": 8
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "kumquat-gym",
          "x": 8,
          "y": 8
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "kumquat",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "kumquat",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 16,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 5,
          "y": 5
        },
        "via": {
          "map": "kumquat",
          "x": 16,
          "y": 4
        }
      },
      {
        "x": 17,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 6,
          "y": 5
        },
        "via": {
          "map": "kumquat",
          "x": 17,
          "y": 4
        }
      },
      {
        "x": 22,
        "y": 3,
        "to": {
          "map": "house-kumquat",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 2,
        "y": 15,
        "to": {
          "map": "orange-sea-east",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 15,
        "to": {
          "map": "orange-sea-east",
          "x": 3,
          "y": 1
        }
      }
    ],
    "signs": [
      {
        "x": 17,
        "y": 13,
        "text": "Kumquat Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      },
      {
        "x": 6,
        "y": 4,
        "text": "KUMQUAT GYM — The Jade Star challenge waits inside the resort arena."
      }
    ],
    "npcs": [
      {
        "x": 8,
        "y": 13,
        "name": "CAPT FESTUS-TROV",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Trovita Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "trovita"
      },
      {
        "x": 10,
        "y": 13,
        "name": "SAILOR BRUNO-PUMM",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Pummelo Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "pummelo"
      },
      {
        "x": 14,
        "y": 11,
        "name": "LILO SR",
        "art": "lady",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Kumquat is the archipelago's holiday — resort, gym, and the best juice bar on any island.",
          "Book the sunset ferry. Trust me."
        ]
      },
      {
        "x": 15,
        "y": 11,
        "name": "SOL",
        "art": "camper",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "I came for a weekend in spring. That was three springs ago.",
          "The resort gym's arena smells of sunscreen and ambition."
        ]
      },
      {
        "x": 3,
        "y": 5,
        "name": "MART CLERK",
        "art": "clerk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Island Mart — balls, potions, and ferry-day essentials. Stock up before you sail!"
        ],
        "mart": {
          "stock": [
            "greatball",
            "ultraball",
            "hyperpotion",
            "fullheal",
            "revive"
          ]
        }
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 14,
      "y": 13
    }
  },
  "pummelo": {
    "id": "pummelo",
    "name": "Pummelo Island",
    "music": "viridian-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~FjklmẟẞdeefẞảảảảảẝẝảảảảảẞR~~",
      "~~ẞAJKARẞP12P_eeeeeeeeeeee_ẞ~~",
      "~~ẞ....__....ẟUUUUUVYUUUUU_ẞ~~",
      "~~..........................~~",
      "~~ẞ_ẞ_ẟẟ__ẟẞẞ__.._R____ẟo_ẟẞ~~",
      "~~ẞ___ẟẞ__ẞẟ_ẟ_.._o__ẟẟn__ẟẈ~~",
      "~~ẞ_,,,_ẞẟ__ẞ__..ẟ__ẞ___ẟ_ẟẞ~~",
      "~~ẞ_,,,_ẟ__ẟẟ__..___ẞ______ẞ~~",
      "~~ẞ_ẟẞ_ẘ_ẞRẟ___..___ẟẟẟẞẟ_ẞẞ~~",
      "~~ẟẟ_ẞẈ_ẟ___ẞẟ_..ẞ_ẞ__ẞ_ẞẞ_ẞ~~",
      "~~ẅ_,,,ẘẞ___ẞẞ_..___ṃ__,,,_ẞ~~",
      "~~ẞẞ,,,_____ẞ__..ẟ___ẟ_,,,_ẞ~~",
      "~~ẞ___ẟ__ẟ_ẟẟ_ẟ..ẘẟẟ___ẟ__ẟẘ~~",
      "~~#ẟẞẞẟẞẅẞẞṃẞẄẞ..ẞSẟẆẞẟ#ẞẞẞẞ~~",
      "~~~~~~~~~~~~~~~..~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~..~~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "pummelo",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "pummelo",
          "x": 5,
          "y": 4
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 5,
          "y": 5
        },
        "via": {
          "map": "pummelo",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "mart",
          "x": 6,
          "y": 5
        },
        "via": {
          "map": "pummelo",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 19,
        "y": 4,
        "to": {
          "map": "pummelo-stadium",
          "x": 11,
          "y": 12
        }
      },
      {
        "x": 20,
        "y": 4,
        "to": {
          "map": "pummelo-stadium",
          "x": 12,
          "y": 12
        }
      },
      {
        "x": 0,
        "y": 8,
        "to": {
          "map": "orange-sea-east",
          "x": 28,
          "y": 8
        }
      },
      {
        "x": 0,
        "y": 9,
        "to": {
          "map": "orange-sea-east",
          "x": 28,
          "y": 9
        }
      }
    ],
    "signs": [
      {
        "x": 16,
        "y": 5,
        "text": "PUMMELO STADIUM — Home of the Orange League. The doors open for trainers carrying four island badges."
      },
      {
        "x": 18,
        "y": 15,
        "text": "Pummelo Island DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      }
    ],
    "npcs": [
      {
        "x": 7,
        "y": 15,
        "name": "CAPT REGAL-TROV",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Trovita Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "trovita"
      },
      {
        "x": 9,
        "y": 15,
        "name": "SAILOR PICO-KUMQ",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Kumquat Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "kumquat"
      },
      {
        "x": 11,
        "y": 15,
        "name": "CAPT DUNE-SHAM",
        "art": "sailor",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "The Shamouti Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "shamouti"
      },
      {
        "x": 15,
        "y": 13,
        "name": "REGAL FAN ANA",
        "art": "lady",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "Pummelo! The League island! I get goosebumps at the dock, every time.",
          "Four badges open the stadium doors. The whole island counts them with you."
        ]
      },
      {
        "x": 16,
        "y": 13,
        "name": "TOMAS",
        "art": "gent",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "I have watched forty years of Orange League finals from that stadium.",
          "The trophy ceremony at dusk — there is nothing like it on any sea."
        ]
      },
      {
        "x": 3,
        "y": 5,
        "name": "MART CLERK",
        "art": "clerk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Island Mart — balls, potions, and ferry-day essentials. Stock up before you sail!"
        ],
        "mart": {
          "stock": [
            "ultraball",
            "hyperpotion",
            "maxpotion",
            "fullrestore",
            "revive"
          ]
        }
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 15,
      "y": 15
    }
  },
  "shamouti": {
    "id": "shamouti",
    "name": "Shamouti Island",
    "music": "pewter-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞghhiẞẆjklmẟ.abcẞẞFẞẞẞẛẞ~~",
      "~~ẞxyzx__AJKA_.rstẞ___ẟ_ẟẞ~~",
      "~~ẞ....ẞ_....ẟ....___ẟ_ẞ_ẞ~~",
      "~~........................~~",
      "~~ẞ____ẟo__ẟẞ_.._____ẞẟẞ#ẞ~~",
      "~~ẞẟ__#ẟ__ẞẚẞẚẚ._ẟ_ẟ__ẘ_ẞẞ~~",
      "~~ẞ_,,,_ẟẞẠẛẠẠẠẠẛẠẟẟ_ẟ__ẟẞ~~",
      "~~ẞ_,,,ẟẈẟẠẠẠẠẠẠẠẠ_ẟ__Ẉẛẘẞ~~",
      "~~ẞ___ẟ___ẠẠẠẠẠẠẠẠ__ẞ__ẟẟẞ~~",
      "~~ẞ_ẞ_ẛ_#ẞẠẠẠẠẠẠẠẠẞ___ẟ_ẞẞ~~",
      "~~ẈẟRR,_ẟ_ẟẞẞ_.._ẞ_ṃẟ,,,ẟẞ~~",
      "~~ẞ_R,,ẞẟ_ẟẟẞẟ..ẞ____,,,ẟẞ~~",
      "~~ẟẟ_ẚ__ẟ___ẞ_..ẟẞẟ_ẞẞẟẞṃẟ~~",
      "~~ẞẞẞẈẟẞẞẞẞẞẄẞ..ẞoṃẞẞẞẞẟẘẞ~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~..~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 4,
        "y": 3,
        "to": {
          "map": "shamouti-shrine",
          "x": 7,
          "y": 10
        }
      },
      {
        "x": 10,
        "y": 3,
        "to": {
          "map": "center",
          "x": 4,
          "y": 4
        },
        "via": {
          "map": "shamouti",
          "x": 10,
          "y": 4
        }
      },
      {
        "x": 11,
        "y": 3,
        "to": {
          "map": "center",
          "x": 5,
          "y": 4
        },
        "via": {
          "map": "shamouti",
          "x": 11,
          "y": 4
        }
      },
      {
        "x": 2,
        "y": 17,
        "to": {
          "map": "orange-sea-north",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 17,
        "to": {
          "map": "orange-sea-north",
          "x": 3,
          "y": 1
        }
      },
      {
        "x": 0,
        "y": 8,
        "to": {
          "map": "fire-isle",
          "x": 22,
          "y": 8
        }
      },
      {
        "x": 0,
        "y": 9,
        "to": {
          "map": "fire-isle",
          "x": 22,
          "y": 9
        }
      },
      {
        "x": 27,
        "y": 8,
        "to": {
          "map": "lightning-isle",
          "x": 1,
          "y": 8
        }
      },
      {
        "x": 27,
        "y": 9,
        "to": {
          "map": "lightning-isle",
          "x": 1,
          "y": 9
        }
      },
      {
        "x": 13,
        "y": 0,
        "to": {
          "map": "ice-isle",
          "x": 10,
          "y": 12
        }
      },
      {
        "x": 14,
        "y": 0,
        "to": {
          "map": "ice-isle",
          "x": 11,
          "y": 12
        }
      },
      {
        "x": 16,
        "y": 3,
        "to": {
          "map": "house-shamouti",
          "x": 4,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 13,
        "y": 9,
        "text": "SHAMOUTI SHRINE PLAZA — Festival of the sea, kept since anyone can remember. Mind the Slowking rock by the shore."
      }
    ],
    "npcs": [
      {
        "x": 4,
        "y": 15,
        "name": "CAPT MARINA-PUMM",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Pummelo Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "pummelo"
      },
      {
        "x": 6,
        "y": 15,
        "name": "SAILOR LILO-FIRE",
        "art": "sailor",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Fire Isle boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "fire-isle"
      },
      {
        "x": 8,
        "y": 15,
        "name": "CAPT MARINA-ICE-",
        "art": "sailor",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "The Ice Isle boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "ice-isle"
      },
      {
        "x": 10,
        "y": 15,
        "name": "SAILOR MARINA-LIGH",
        "art": "sailor",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "The Lightning Isle boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "lightning-isle"
      },
      {
        "x": 14,
        "y": 13,
        "name": "FEST ELDER MIRA",
        "art": "elder",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "Shamouti keeps the old festival: three isles, three shrines, one guardian of the sea.",
          "When the birds quarrel, the whole sky argues. The shrine keeps the peace."
        ]
      },
      {
        "x": 15,
        "y": 13,
        "name": "KAI",
        "art": "youngster",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The Slowking by the rock has seen EVERYTHING. Ask it anything. It won't answer, but still.",
          "Festival week, the plaza never sleeps. Neither do I."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pidgey",
          "min": 25,
          "max": 32,
          "weight": 30
        },
        {
          "species": "rattata",
          "min": 25,
          "max": 32,
          "weight": 25
        },
        {
          "species": "oddish",
          "min": 26,
          "max": 34,
          "weight": 18
        },
        {
          "species": "meowth",
          "min": 27,
          "max": 35,
          "weight": 12
        },
        {
          "species": "spearow",
          "min": 28,
          "max": 36,
          "weight": 10
        },
        {
          "species": "pidgeotto",
          "min": 30,
          "max": 38,
          "weight": 5
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 14,
      "y": 15
    }
  },
  "fire-isle": {
    "id": "fire-isle",
    "name": "Fire Isle",
    "music": "pewter-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẘẞẟẞẈẘẞẞẞGGGẞẞẞẘẞẞẞẞ~~",
      "~~ẞ_______ẆGDG__ẟẞ___R~~",
      "~~ẞẟ_ẞẞẞẞ___.._____ẞ_ẞ~~",
      "~~....................~~",
      "~~ẞẟẟ_ẟ__ẞẈ_..ẟẅẞẞ___ẞ~~",
      "~~ẟẞẟ_#___ẟ_..ẞ__ẘ_ẟ_ẞ~~",
      "~~#_,,,___ẞ_..__ẟ,,,ẟẞ~~",
      "~~ẞẟ,,,ẟẞR__..___,,,ẟẞ~~",
      "~~ẞẟ___ẟẞẞ__..__ẟoẞẟ_ẞ~~",
      "~~ẞẞẞẞẟẞẞẞẞẞ..ẞSẞẞẞẟẞẞ~~",
      "~~~~~~~~~~~~..~~~~~~~~~~",
      "~~~~~~~~~~~~..~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 12,
        "y": 3,
        "to": {
          "map": "fire-cave",
          "x": 6,
          "y": 8
        }
      },
      {
        "x": 23,
        "y": 6,
        "to": {
          "map": "shamouti",
          "x": 1,
          "y": 6
        }
      },
      {
        "x": 23,
        "y": 7,
        "to": {
          "map": "shamouti",
          "x": 1,
          "y": 7
        }
      }
    ],
    "signs": [
      {
        "x": 14,
        "y": 4,
        "text": "FIRE ISLE — A shrine cave in the old rock. The air smells of warm ash."
      },
      {
        "x": 15,
        "y": 11,
        "text": "Fire Isle DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      }
    ],
    "npcs": [
      {
        "x": 8,
        "y": 11,
        "name": "SAILOR EMBER",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Shamouti Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "shamouti"
      },
      {
        "x": 12,
        "y": 9,
        "name": "EMBER KEEPER",
        "art": "monk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Fire Isle shrine. I sweep the ash and mind the flame.",
          "The cave breathes warm. Step soft."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "vulpix",
          "min": 30,
          "max": 36,
          "weight": 50
        },
        {
          "species": "growlithe",
          "min": 30,
          "max": 38,
          "weight": 50
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 12,
      "y": 11
    }
  },
  "ice-isle": {
    "id": "ice-isle",
    "name": "Ice Isle",
    "music": "pewter-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞẞẞẞẞẞẞẞẞGGGẞẞẞẞẟẟẞẞ~~",
      "~~ẞ___ẘ_ẟ_ẞGDGẟṃẟ__ẟẞẞ~~",
      "~~ẞ_ẟ_ẟẟ__ẟ_..ẟ____ẟẟẞ~~",
      "~~....................~~",
      "~~ẅ__ẟẞ_ẞ_ẟẟ..ẟẟ___ẟẟẟ~~",
      "~~ẞẞ____F_ẟẞ.._ẘẞ_ẟ__ẟ~~",
      "~~ẅ_,,,ẟ__ẞẞ..ẟẟ_,,,_ẞ~~",
      "~~ẞ_,,,___ẟ_..ẅ_ẅ,,,_ẞ~~",
      "~~ẟ__F__ẟẆ__..__ẟ_ẟ_ẞẞ~~",
      "~~ẞẞẞẞẞẞẞẞẞẞ..ẞSẟẞẞẞẞẟ~~",
      "~~~~~~~~~~~~..~~~~~~~~~~",
      "~~~~~~~~~~~~..~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 12,
        "y": 3,
        "to": {
          "map": "ice-cave",
          "x": 6,
          "y": 8
        }
      },
      {
        "x": 2,
        "y": 13,
        "to": {
          "map": "shamouti",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 13,
        "to": {
          "map": "shamouti",
          "x": 3,
          "y": 1
        }
      }
    ],
    "signs": [
      {
        "x": 14,
        "y": 4,
        "text": "ICE ISLE — A shrine cave in the old rock. Breath fogs; the stone sings faintly."
      },
      {
        "x": 15,
        "y": 11,
        "text": "Ice Isle DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      }
    ],
    "npcs": [
      {
        "x": 8,
        "y": 11,
        "name": "SAILOR FROST",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Shamouti Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "shamouti"
      },
      {
        "x": 12,
        "y": 9,
        "name": "FROST KEEPER",
        "art": "monk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Ice Isle shrine. Mind your footing — the floor remembers every slip.",
          "Cold keeps the old carvings sharp."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "seel",
          "min": 30,
          "max": 38,
          "weight": 60
        },
        {
          "species": "shellder",
          "min": 30,
          "max": 36,
          "weight": 40
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 12,
      "y": 11
    }
  },
  "lightning-isle": {
    "id": "lightning-isle",
    "name": "Lightning Isle",
    "music": "pewter-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~ẞẘẞẟẞẞẞẞẞGGGẞẞẞẞẞẞẞẞ~~",
      "~~ẞẞ__ẞRẟ__GDG_ẞ____ẟẞ~~",
      "~~ẞ_ẟ____ẞẞẞ..ẞ____ẞ_ẞ~~",
      "~~....................~~",
      "~~ẟṃ___ẟ_ẟ__.._ẞẟnẟẟ_ẞ~~",
      "~~ẞ___ẟ_ẞ_oẅ..Ẇẞ_ẅẟẟ_ẞ~~",
      "~~F_,,,ẟ____..ẟ__,,,ẘẞ~~",
      "~~ẞ_,,,ẞẟ_ẟ_..__ẟ,,,ẞẞ~~",
      "~~ẞẟ___ẞẞẄ__.._R__Fẞ_ẞ~~",
      "~~ẟẞẞẞẞẞẞẞẟẞ..ẞSẞẞẞẞẞẞ~~",
      "~~~~~~~~~~~~..~~~~~~~~~~",
      "~~~~~~~~~~~~..~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 12,
        "y": 3,
        "to": {
          "map": "lightning-cave",
          "x": 6,
          "y": 8
        }
      },
      {
        "x": 0,
        "y": 6,
        "to": {
          "map": "shamouti",
          "x": 26,
          "y": 6
        }
      },
      {
        "x": 0,
        "y": 7,
        "to": {
          "map": "shamouti",
          "x": 26,
          "y": 7
        }
      }
    ],
    "signs": [
      {
        "x": 14,
        "y": 4,
        "text": "LIGHTNING ISLE — A shrine cave in the old rock. Loose hair stands on end here."
      },
      {
        "x": 15,
        "y": 11,
        "text": "Lightning Isle DOCK — Ferries run both ways, every day. The sea lanes are surfable for trainers with the Soul Badge and Surf."
      }
    ],
    "npcs": [
      {
        "x": 8,
        "y": 11,
        "name": "SAILOR VOLTA",
        "art": "sailor",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "The Shamouti Island boat ties up at this dock — I run her both ways, fair weather or foul.",
          "Step aboard when you're ready. The Orange sea keeps no one waiting who knows her moods."
        ],
        "ferry": "shamouti"
      },
      {
        "x": 12,
        "y": 9,
        "name": "VOLTA KEEPER",
        "art": "monk",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "Lightning Isle shrine. Storms queue politely here. Mostly.",
          "The cave hums before thunder. Count the seconds."
        ]
      }
    ],
    "encounters": {
      "rate": 0.12,
      "table": [
        {
          "species": "pikachu",
          "min": 30,
          "max": 36,
          "weight": 40
        },
        {
          "species": "magnemite",
          "min": 30,
          "max": 38,
          "weight": 35
        },
        {
          "species": "voltorb",
          "min": 30,
          "max": 38,
          "weight": 25
        }
      ],
      "water": [
        {
          "species": "tentacool",
          "min": 25,
          "max": 38,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 35,
          "weight": 20
        },
        {
          "species": "poliwag",
          "min": 26,
          "max": 36,
          "weight": 12
        },
        {
          "species": "goldeen",
          "min": 27,
          "max": 38,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 27,
          "max": 38,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 28,
          "max": 40,
          "weight": 8
        },
        {
          "species": "staryu",
          "min": 28,
          "max": 40,
          "weight": 5
        },
        {
          "species": "shellder",
          "min": 28,
          "max": 38,
          "weight": 3
        }
      ],
      "waterRate": 0.08
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": {
      "x": 12,
      "y": 11
    }
  },
  "orange-sea-west": {
    "id": "orange-sea-west",
    "name": "Orange Sea — West",
    "music": "route1-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~ẙ~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~ẞẘẞ~~~",
      "~~~~~~~ẞẘẞR~~~~~~~~~~~~~ẞẞẞ~~~",
      "~~~~~~~ẞẞẞ~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~ẙ~~~~R~~~~~~~~~~",
      "~~~ẙ~ẙ~~R~~~~~R~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~ẙ~~~~~",
      "~~~~~~~~~~~~ẙ~~~~~~~~~~~~~~~~~",
      "~~~~~F__~~~~~~~~~~~~~~ẞẘẞ~~~~~",
      "~~~~~_,#~~~~~ẙẞẘẞ~~~~~ẞẞẞ~~~~~",
      "~~ẙ~~~ẙ~~~~~~~ẞẞẞ~ẙ~~~~~~~R~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 0,
        "y": 7,
        "to": {
          "map": "valencia",
          "x": 26,
          "y": 7
        }
      },
      {
        "x": 0,
        "y": 8,
        "to": {
          "map": "valencia",
          "x": 26,
          "y": 8
        }
      },
      {
        "x": 29,
        "y": 7,
        "to": {
          "map": "orange-sea-central",
          "x": 1,
          "y": 7
        }
      },
      {
        "x": 29,
        "y": 8,
        "to": {
          "map": "orange-sea-central",
          "x": 1,
          "y": 8
        }
      },
      {
        "x": 14,
        "y": 0,
        "to": {
          "map": "mikan",
          "x": 12,
          "y": 14
        }
      },
      {
        "x": 15,
        "y": 0,
        "to": {
          "map": "mikan",
          "x": 13,
          "y": 14
        }
      }
    ],
    "signs": [],
    "npcs": [],
    "encounters": {
      "rate": 0.1,
      "table": [],
      "water": [
        {
          "species": "tentacool",
          "min": 30,
          "max": 45,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 40,
          "weight": 18
        },
        {
          "species": "goldeen",
          "min": 30,
          "max": 42,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 30,
          "max": 42,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 30,
          "max": 44,
          "weight": 10
        },
        {
          "species": "staryu",
          "min": 30,
          "max": 44,
          "weight": 8
        },
        {
          "species": "shellder",
          "min": 30,
          "max": 42,
          "weight": 6
        },
        {
          "species": "tentacruel",
          "min": 35,
          "max": 45,
          "weight": 6
        }
      ],
      "waterRate": 0.09
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "orange-sea-central": {
    "id": "orange-sea-central",
    "name": "Orange Sea — Central",
    "music": "route1-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~ẙ~~~ẙ~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~R~R~~~~~~~~~~~~~~ẞẘẞ~~~",
      "~~~~~~~ẞẘẞẙ~~~~~ẙ~~~~~~~ẞẞẞ~~~",
      "~~~~~~~ẞẞẞ~~~~ẙ~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~R~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~ẙ~~~~~~~~~~~~~~~~~~",
      "~~~~~~F__~~~~~~~~~~~~~~~~~~ẙ~~",
      "~~~~~R_,#~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~R~~~~~~~~ẙ~~~~~~~ẞẘẞ~~~~~",
      "~~ẙẙ~~~~~~~~~~ẞẘẞ~~~~~ẞẞẞ~~~~~",
      "~~~~~~~~~ẙ~~~~ẞẞẞ~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 0,
        "y": 7,
        "to": {
          "map": "orange-sea-west",
          "x": 28,
          "y": 7
        }
      },
      {
        "x": 0,
        "y": 8,
        "to": {
          "map": "orange-sea-west",
          "x": 28,
          "y": 8
        }
      },
      {
        "x": 29,
        "y": 7,
        "to": {
          "map": "orange-sea-east",
          "x": 1,
          "y": 7
        }
      },
      {
        "x": 29,
        "y": 8,
        "to": {
          "map": "orange-sea-east",
          "x": 1,
          "y": 8
        }
      },
      {
        "x": 14,
        "y": 0,
        "to": {
          "map": "navel",
          "x": 12,
          "y": 16
        }
      },
      {
        "x": 15,
        "y": 0,
        "to": {
          "map": "navel",
          "x": 13,
          "y": 16
        }
      },
      {
        "x": 2,
        "y": 15,
        "to": {
          "map": "moro",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 15,
        "to": {
          "map": "moro",
          "x": 3,
          "y": 1
        }
      }
    ],
    "signs": [],
    "npcs": [],
    "encounters": {
      "rate": 0.1,
      "table": [],
      "water": [
        {
          "species": "tentacool",
          "min": 30,
          "max": 45,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 40,
          "weight": 18
        },
        {
          "species": "goldeen",
          "min": 30,
          "max": 42,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 30,
          "max": 42,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 30,
          "max": 44,
          "weight": 10
        },
        {
          "species": "staryu",
          "min": 30,
          "max": 44,
          "weight": 8
        },
        {
          "species": "shellder",
          "min": 30,
          "max": 42,
          "weight": 6
        },
        {
          "species": "tentacruel",
          "min": 35,
          "max": 45,
          "weight": 6
        }
      ],
      "waterRate": 0.09
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "orange-sea-east": {
    "id": "orange-sea-east",
    "name": "Orange Sea — East",
    "music": "route1-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~ẞẘẞ~~~",
      "~~~~~~~ẞẘẞR~~~~~~~~~~~~~ẞẞẞ~~~",
      "~~~~~~~ẞẞẞR~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~R~~~ẙ~~~~ẙ~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~F__~~~~~~~~~~~~~~~~~ẙ~ẙ~~~",
      "~~~~_,#~~~~R~~~~ẙR~ẙ~~~~~~~~~~",
      "~~~ẙ~~~~~~~~~~~~~~~~~~ẞẘẞ~~~~~",
      "~~~~~~~~~~~~~~ẞẘẞ~ẙ~~~ẞẞẞ~~~~~",
      "~~~~~~~~~~~~~ẙẞẞẞ~~~~~ẙ~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 0,
        "y": 7,
        "to": {
          "map": "orange-sea-central",
          "x": 28,
          "y": 7
        }
      },
      {
        "x": 0,
        "y": 8,
        "to": {
          "map": "orange-sea-central",
          "x": 28,
          "y": 8
        }
      },
      {
        "x": 29,
        "y": 7,
        "to": {
          "map": "pummelo",
          "x": 1,
          "y": 7
        }
      },
      {
        "x": 29,
        "y": 8,
        "to": {
          "map": "pummelo",
          "x": 1,
          "y": 8
        }
      },
      {
        "x": 14,
        "y": 0,
        "to": {
          "map": "kumquat",
          "x": 13,
          "y": 14
        }
      },
      {
        "x": 15,
        "y": 0,
        "to": {
          "map": "kumquat",
          "x": 14,
          "y": 14
        }
      },
      {
        "x": 2,
        "y": 15,
        "to": {
          "map": "trovita",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 15,
        "to": {
          "map": "trovita",
          "x": 3,
          "y": 1
        }
      }
    ],
    "signs": [],
    "npcs": [],
    "encounters": {
      "rate": 0.1,
      "table": [],
      "water": [
        {
          "species": "tentacool",
          "min": 30,
          "max": 45,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 40,
          "weight": 18
        },
        {
          "species": "goldeen",
          "min": 30,
          "max": 42,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 30,
          "max": 42,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 30,
          "max": 44,
          "weight": 10
        },
        {
          "species": "staryu",
          "min": 30,
          "max": 44,
          "weight": 8
        },
        {
          "species": "shellder",
          "min": 30,
          "max": 42,
          "weight": 6
        },
        {
          "species": "tentacruel",
          "min": 35,
          "max": 45,
          "weight": 6
        }
      ],
      "waterRate": 0.09
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "orange-sea-north": {
    "id": "orange-sea-north",
    "name": "Orange Sea — North",
    "music": "route1-theme",
    "rows": [
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~R~~~~~~~~~~ẙ~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~ẞẘẞ~~~",
      "~~~~~~~ẞẘẞ~~~~~~R~~~~~~ẙẞẞẞ~~~",
      "~~~~~~~ẞẞẞ~~~~~~~~~ẙ~ẙ~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~ẙ~ẙ~ẙ~~~~~ẙ~~~~~~~~~~",
      "~~~~~~~~~~~~~ẙ~~ẙ~~~~~~~~~~~~~",
      "~~R~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~F__~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~_,#~~~~~~~~~~~~~~~ẞẘẞ~~~~~",
      "~~~R~~~~~~~ẙ~~ẞẘẞ~~~~~ẞẞẞ~R~~~",
      "~~~~~~~~~~~~~~ẞẞẞ~~~~~~~~~~R~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
      "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    ],
    "warps": [
      {
        "x": 2,
        "y": 15,
        "to": {
          "map": "navel",
          "x": 2,
          "y": 1
        }
      },
      {
        "x": 3,
        "y": 15,
        "to": {
          "map": "navel",
          "x": 3,
          "y": 1
        }
      },
      {
        "x": 14,
        "y": 0,
        "to": {
          "map": "shamouti",
          "x": 13,
          "y": 16
        }
      },
      {
        "x": 15,
        "y": 0,
        "to": {
          "map": "shamouti",
          "x": 14,
          "y": 16
        }
      }
    ],
    "signs": [],
    "npcs": [],
    "encounters": {
      "rate": 0.1,
      "table": [],
      "water": [
        {
          "species": "tentacool",
          "min": 30,
          "max": 45,
          "weight": 30
        },
        {
          "species": "magikarp",
          "min": 25,
          "max": 40,
          "weight": 18
        },
        {
          "species": "goldeen",
          "min": 30,
          "max": 42,
          "weight": 12
        },
        {
          "species": "krabby",
          "min": 30,
          "max": 42,
          "weight": 10
        },
        {
          "species": "horsea",
          "min": 30,
          "max": 44,
          "weight": 10
        },
        {
          "species": "staryu",
          "min": 30,
          "max": 44,
          "weight": 8
        },
        {
          "species": "shellder",
          "min": 30,
          "max": 42,
          "weight": 6
        },
        {
          "species": "tentacruel",
          "min": 35,
          "max": 45,
          "weight": 6
        }
      ],
      "waterRate": 0.09
    },
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "ivy-lab": {
    "id": "ivy-lab",
    "name": "Prof. Ivy's Lab",
    "music": "viridian-theme",
    "indoor": true,
    "rows": [
      ">>>>>>>>>>>>>>>>>>",
      ">-ξο-πη----ηξ-οπ->",
      ">-------ẜẜ------->",
      ">---------------->",
      ">--π----------ξ-->",
      ">---------------->",
      ">-------ζζ------->",
      ">---ο--------π--->",
      ">---------------->",
      ">---------------->",
      ">---------------->",
      ">>>>>>>>-->>>>>>>>"
    ],
    "warps": [
      {
        "x": 8,
        "y": 11,
        "to": {
          "map": "valencia",
          "x": 5,
          "y": 4
        }
      },
      {
        "x": 9,
        "y": 11,
        "to": {
          "map": "valencia",
          "x": 6,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 8,
        "y": 2,
        "text": "The GS Ball rests on its pedestal — gold, banded, and sealed tighter than any lock. No machine in the lab can open it."
      },
      {
        "x": 2,
        "y": 1,
        "text": "Reef survey terminal: the Valencia transect logged 214 species passes this season."
      }
    ],
    "npcs": [
      {
        "x": 5,
        "y": 8,
        "name": "AIDE SOLA",
        "art": "scientist",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Professor Ivy is out on the reef transect — she studies how the sea changes Pokemon.",
          "That ball on the pedestal? Every scanner we own just shrugs at it."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "mikan-gym": {
    "id": "mikan-gym",
    "name": "Mikan Gym",
    "music": "gym-theme",
    "indoor": true,
    "rows": [
      "================",
      "=+ṃ++++++++++ṃ+=",
      "=+ṼṼṼṼ+++++++++=",
      "=+ṼṼṼṄ++++Ṅ++++=",
      "=+ṼṼṼṼ+++++++++=",
      "=+++++////+++++=",
      "=+++++////+++++=",
      "=++++++++++++++=",
      "=+++)++++++)+++=",
      "=======++======="
    ],
    "warps": [
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "mikan",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 8,
        "y": 9,
        "to": {
          "map": "mikan",
          "x": 5,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 2,
        "y": 1,
        "text": "MIKAN GYM — A floating range over the lagoon: ring targets, water lanes, and a very smug stopwatch. The Coral-Eye challenge is staged here. (Battles arrive with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 3,
        "y": 7,
        "name": "GYM ATTENDANT",
        "art": "ranger",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The arena is dressed and ready — the Leader's challenge opens with the Orange story stage.",
          "Trainers are welcome to walk the floor and plan. Planning is half the badge."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "navel-gym": {
    "id": "navel-gym",
    "name": "Navel Gym",
    "music": "gym-theme",
    "indoor": true,
    "rows": [
      "================",
      "=+Ṫ++++++++++Ṫ+=",
      "=+++++++++ṧṧṧṧ+=",
      "=++++ṫ++++ṫṧṧṧ+=",
      "=++++++++++++++=",
      "=+++++////+++++=",
      "=+++++////+++++=",
      "=++++++++++++++=",
      "=+++)++++++)+++=",
      "=======++======="
    ],
    "warps": [
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "navel",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 8,
        "y": 9,
        "to": {
          "map": "navel",
          "x": 5,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 2,
        "y": 1,
        "text": "NAVEL GYM — The floor tilts like the mountain outside; frost slicks the high lane. The Sea Ruby challenge is staged here. (Battles arrive with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 3,
        "y": 7,
        "name": "GYM ATTENDANT",
        "art": "ranger",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The arena is dressed and ready — the Leader's challenge opens with the Orange story stage.",
          "Trainers are welcome to walk the floor and plan. Planning is half the badge."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "trovita-gym": {
    "id": "trovita-gym",
    "name": "Trovita Gym",
    "music": "gym-theme",
    "indoor": true,
    "rows": [
      "================",
      "=+ḿ++++++++++ḿ+=",
      "=+ṳṳṳṳ+++++++++=",
      "=+ṳṳṳṀ++++Ṁ++++=",
      "=++++++++++++++=",
      "=+++++////+++++=",
      "=+++++////+++++=",
      "=++++++++++++++=",
      "=+++)++++++)+++=",
      "=======++======="
    ],
    "warps": [
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "trovita",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 8,
        "y": 9,
        "to": {
          "map": "trovita",
          "x": 5,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 2,
        "y": 1,
        "text": "TROVITA GYM — A rocky arena ringed with carved spike stone. The Spike Shell challenge is staged here. (Battles arrive with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 3,
        "y": 7,
        "name": "GYM ATTENDANT",
        "art": "ranger",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The arena is dressed and ready — the Leader's challenge opens with the Orange story stage.",
          "Trainers are welcome to walk the floor and plan. Planning is half the badge."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "kumquat-gym": {
    "id": "kumquat-gym",
    "name": "Kumquat Gym",
    "music": "gym-theme",
    "indoor": true,
    "rows": [
      "================",
      "=+ḷ++++++++++ḷ+=",
      "=++++++++++++++=",
      "=++++Ṉ++++Ṉ++++=",
      "=++++++++++++++=",
      "=+θ+++////+++θ+=",
      "=+θ+++////+++θ+=",
      "=++++++++++++++=",
      "=+++)++++++)+++=",
      "=======++======="
    ],
    "warps": [
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "kumquat",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 8,
        "y": 9,
        "to": {
          "map": "kumquat",
          "x": 5,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 2,
        "y": 1,
        "text": "KUMQUAT GYM — A resort arena: palm shade, polished stone, doubles under the sun. The Jade Star challenge is staged here. (Battles arrive with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 3,
        "y": 7,
        "name": "GYM ATTENDANT",
        "art": "ranger",
        "skin": "#e8b888",
        "shirt": "#3a9ac0",
        "pants": "#2a3a4a",
        "hair": "#1a1a1a",
        "dialogue": [
          "The arena is dressed and ready — the Leader's challenge opens with the Orange story stage.",
          "Trainers are welcome to walk the floor and plan. Planning is half the badge."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "pummelo-stadium": {
    "id": "pummelo-stadium",
    "name": "Pummelo Stadium",
    "music": "gym-theme",
    "indoor": true,
    "rows": [
      "ảảảảṚảṸảảảảẝẝảảảảṸảṚảảảả",
      "ảẢẢμẢẢẢẢμẢẢẢẢẢẢμẢẢẢẢμẢẢả",
      "ảẢẢảảảảảảảảḣẢảảảảảảảảẢẢả",
      "ảẢẢṤṤṤṤṤṤṤṤẢẢṤṤṤṤṤṤṤṤẢẢả",
      "ảẢẢṢṣṢṣṢṣṢṣẢẢṢṣṢṣṢṣṢṣẢẢả",
      "ảẢẢẢẢḙẢẢ+ẢẢṤṤẢẢ+ẢẢḙẢẢẢẢả",
      "ảẢẢẢẢẢẢẢẢ//ṤṤ//ẢẢẢẢẢẢẢẢả",
      "ảẢḊẢẢẢẢẢẢ//ṤṤ//ẢẢẢẢẢẢḋẢả",
      "ảẢẢẢẢḚẢẢẢ//ṤṤ//ẢẢẢḚẢẢẢẢả",
      "ảẢẢẢẢẢẢẢẢ//ṤṤ//ẢẢẢẢẢẢẢẢả",
      "ảẢẢḚẢẢθẢ+ẢẢṤṤẢẢ+ẢθẢẢḚẢẢả",
      "ảẢẢẢẢẢẢẢẢẢẢṤṤẢẢẢẢẢẢẢẢẢẢả",
      "ảẢẢẢẢẢẢẢẢẢẢṤṤẢẢẢẢẢẢẢẢẢẢả",
      "ảảảảảảảảảảảẢẢảảảảảảảảảảả"
    ],
    "warps": [
      {
        "x": 11,
        "y": 13,
        "to": {
          "map": "pummelo",
          "x": 19,
          "y": 5
        }
      },
      {
        "x": 12,
        "y": 13,
        "to": {
          "map": "pummelo",
          "x": 20,
          "y": 5
        }
      }
    ],
    "signs": [
      {
        "x": 5,
        "y": 5,
        "text": "The Winner's Trophy case. Forty seasons of Orange League champions gleam behind the glass."
      },
      {
        "x": 11,
        "y": 5,
        "text": "PUMMELO STADIUM — The Orange League arena. The champion's battle is staged here. (It arrives with the Orange story stage.)"
      }
    ],
    "npcs": [
      {
        "x": 8,
        "y": 11,
        "name": "STADIUM USHER",
        "art": "gent",
        "skin": "#f0c8a0",
        "shirt": "#c05a3a",
        "pants": "#2a2a3a",
        "hair": "#c0c0c0",
        "dialogue": [
          "Grandest floor in the archipelago, and I sweep it. Mind the carpet — it's older than the League.",
          "Finals night, this whole bowl roars loud enough to scare the Wingull off the roof."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "shamouti-shrine": {
    "id": "shamouti-shrine",
    "name": "Shamouti Shrine",
    "music": "pewter-theme",
    "indoor": true,
    "rows": [
      "ạạạạạạạạạạạạạạạạ",
      "ạẠẠḠẠḟẠẠẠẠḟẠχẠẠạ",
      "ạẠQQẠẠḡẠẠḡẠẠQQẠạ",
      "ạẠẠẠẠẠḢẠẠḢẠẠẠẠẠạ",
      "ạẠẠẠẠẠẠṤṤẠẠẠẠẠẠạ",
      "ạẠẠẚẠẠẠṤṤẠẠẠẚẠẠạ",
      "ạẠẠẠẠẠẠṤṤẠẠẠẠẠẠạ",
      "ạẠẠẠẠẠẠṤṤẠẠẠẠẠẠạ",
      "ạẠẠẠẠẠẠṤṤẠẠẠẠẠẠạ",
      "ạẠQẠẠẠẠṤṤẠẠẠẠQẠạ",
      "ạẠẠẠθẠẠṤṤẠẠθẠẠẠạ",
      "ạạạạạạạẠẠạạạạạạạ"
    ],
    "warps": [
      {
        "x": 7,
        "y": 1,
        "to": {
          "map": "shamouti-deep",
          "x": 7,
          "y": 10
        }
      },
      {
        "x": 8,
        "y": 1,
        "to": {
          "map": "shamouti-deep",
          "x": 8,
          "y": 10
        }
      },
      {
        "x": 7,
        "y": 11,
        "to": {
          "map": "shamouti",
          "x": 4,
          "y": 4
        }
      },
      {
        "x": 8,
        "y": 11,
        "to": {
          "map": "shamouti",
          "x": 4,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 6,
        "y": 2,
        "text": "The shrine of the sea guardian. Three treasures, three isles — the festival song names them all."
      },
      {
        "x": 7,
        "y": 1,
        "text": "The back passage breathes cold, deep water. (The deep chamber waits beyond — its story arrives with the 2000 stage.)"
      }
    ],
    "npcs": [
      {
        "x": 4,
        "y": 8,
        "name": "SHRINE KEEPER ANO",
        "art": "monk",
        "skin": "#d8a878",
        "shirt": "#3a6ac0",
        "pants": "#2a2a3a",
        "hair": "#4a3a2a",
        "dialogue": [
          "I keep the candles and the quiet. Both take daily work.",
          "On festival night the song is sung from this floor. The sea listens. It always has."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "shamouti-deep": {
    "id": "shamouti-deep",
    "name": "Shamouti Deep Shrine",
    "music": "pewter-theme",
    "indoor": true,
    "rows": [
      "ṺṺṺṺṺṺṺṺṺṺṺṺṺṺṺṺ",
      "ṺṻṻṻṽṻḟφμḟṻṽṻṻṻṺ",
      "ṺṻṻṻṻλĀṼṼĀλṻṻṻṻṺ",
      "ṺṻṻLṻṻṻṻṻṻṻṻLṻṻṺ",
      "ṺṻṻṻẠẠṼṻṻṼẠẠṻṻṻṺ",
      "ṺṻṻḉṻṰṻṻṻṻṱṻḉṻṻṺ",
      "ṺṻṻṾṻṻṍṻṻṌṻṻṾṻṻṺ",
      "ṺṻṻṻṭṭṻṻṻṻṭṭṻṻṻṺ",
      "ṺṻṻṻQṩṻṻṻṻṩQṻṻṻṺ",
      "ṺṻṻṮṻṽṻṻṻṻṽṻṮṻṻṺ",
      "ṺṻṻṻθṻṻṻṻṻṻθṻṻṻṺ",
      "ṺṺṺṺṺṺṺṻṻṺṺṺṺṺṺṺ"
    ],
    "warps": [
      {
        "x": 7,
        "y": 11,
        "to": {
          "map": "shamouti-shrine",
          "x": 7,
          "y": 2
        }
      },
      {
        "x": 8,
        "y": 11,
        "to": {
          "map": "shamouti-shrine",
          "x": 8,
          "y": 2
        }
      }
    ],
    "signs": [
      {
        "x": 7,
        "y": 1,
        "text": "A still altar under deep water-light. Something immense once rested here — the stone still holds the shape of its calm."
      }
    ],
    "npcs": [],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "fire-cave": {
    "id": "fire-cave",
    "name": "Fire Isle Shrine Cave",
    "music": "pewter-theme",
    "indoor": true,
    "rows": [
      "GGGGÿGGGGÿGGGG",
      "GLLLṑLḡḡLṒLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GGGGGGLLGGGGGG"
    ],
    "warps": [
      {
        "x": 6,
        "y": 9,
        "to": {
          "map": "fire-isle",
          "x": 12,
          "y": 4
        }
      },
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "fire-isle",
          "x": 12,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 6,
        "y": 1,
        "text": "A shrine blackened by kind fires. Offerings of charcoal line the niche."
      }
    ],
    "npcs": [],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "ice-cave": {
    "id": "ice-cave",
    "name": "Ice Isle Shrine Cave",
    "music": "pewter-theme",
    "indoor": true,
    "rows": [
      "GGGGGGGGGGGGGG",
      "GLLLṬLḡḡLṫLLLG",
      "GLLLLLLLLLLLLG",
      "GLLṧṧṧLLLLLLLG",
      "GLLṧṧṧLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GGGGGGLLGGGGGG"
    ],
    "warps": [
      {
        "x": 6,
        "y": 9,
        "to": {
          "map": "ice-isle",
          "x": 12,
          "y": 4
        }
      },
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "ice-isle",
          "x": 12,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 6,
        "y": 1,
        "text": "A shrine glazed in old ice. Offerings sparkle, frozen mid-gesture."
      }
    ],
    "npcs": [],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "lightning-cave": {
    "id": "lightning-cave",
    "name": "Lightning Isle Shrine Cave",
    "music": "pewter-theme",
    "indoor": true,
    "rows": [
      "GGGGGGGGGGGGGG",
      "GLLLṅLḡḡLṆLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GLLLLLLLLLLLLG",
      "GGGGGGLLGGGGGG"
    ],
    "warps": [
      {
        "x": 6,
        "y": 9,
        "to": {
          "map": "lightning-isle",
          "x": 12,
          "y": 4
        }
      },
      {
        "x": 7,
        "y": 9,
        "to": {
          "map": "lightning-isle",
          "x": 12,
          "y": 4
        }
      }
    ],
    "signs": [
      {
        "x": 6,
        "y": 1,
        "text": "A shrine humming with stored storms. Offerings of copper wire coil the niche."
      }
    ],
    "npcs": [],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "house-valencia": {
    "id": "house-valencia",
    "name": "Valencia Island — House",
    "music": "viridian-theme",
    "indoor": true,
    "rows": [
      "ṡ<<<<<<<<<",
      "<ηḏḩθḐḢṢη<",
      "<δḪ******<",
      "<*(*εζ***<",
      "<*****))*<",
      "<***DD**ζ<",
      "<<<<<<<<<<"
    ],
    "warps": [
      {
        "x": 4,
        "y": 5,
        "to": {
          "map": "valencia",
          "x": 24,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 5,
        "to": {
          "map": "valencia",
          "x": 24,
          "y": 4
        }
      }
    ],
    "signs": [],
    "npcs": [
      {
        "x": 6,
        "y": 2,
        "name": "RESIDENT MARA-VAL",
        "art": "lady",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Ferry days, the whole street smells of orange peel and rope tar.",
          "Valencia oranges travel further than most trainers. Half the Kanto shops stock them."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "house-mikan": {
    "id": "house-mikan",
    "name": "Mikan Island — House",
    "music": "viridian-theme",
    "indoor": true,
    "rows": [
      "Ṟ<<<<<<<<<",
      "<θḳḴηḢṢṣḏ<",
      "<*******δ<",
      "<ω**εζ***<",
      "<*))*****<",
      "<***DD***<",
      "<<<<<<<<<<"
    ],
    "warps": [
      {
        "x": 4,
        "y": 5,
        "to": {
          "map": "mikan",
          "x": 22,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 5,
        "to": {
          "map": "mikan",
          "x": 22,
          "y": 4
        }
      }
    ],
    "signs": [],
    "npcs": [
      {
        "x": 6,
        "y": 2,
        "name": "RESIDENT ULA-MAE",
        "art": "lady",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Lagoon light gets in everywhere here. Even the spoons shine.",
          "Mikan rule: never challenge the gym on an empty stomach."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "house-kumquat": {
    "id": "house-kumquat",
    "name": "Kumquat Island — House",
    "music": "viridian-theme",
    "indoor": true,
    "rows": [
      "ṙ<<<<<<<<<",
      "<ηḏḷθḑḒḓη<",
      "<δḸ******<",
      "<*(*εζ***<",
      "<*****))*<",
      "<***DD**ζ<",
      "<<<<<<<<<<"
    ],
    "warps": [
      {
        "x": 4,
        "y": 5,
        "to": {
          "map": "kumquat",
          "x": 22,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 5,
        "to": {
          "map": "kumquat",
          "x": 22,
          "y": 4
        }
      }
    ],
    "signs": [],
    "npcs": [
      {
        "x": 6,
        "y": 2,
        "name": "RESIDENT SOLANGE",
        "art": "lady",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "I rent this room out during League season. Booked solid, darling, booked solid.",
          "Kumquat sunsets should be illegal. They'd still happen anyway."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  },
  "house-shamouti": {
    "id": "house-shamouti",
    "name": "Shamouti Island — House",
    "music": "viridian-theme",
    "indoor": true,
    "rows": [
      "ṡ<<<<<<<<<",
      "<θḹḓηḔḕ*ḏ<",
      "<Ḻ******δ<",
      "<ω**εζ***<",
      "<*))*****<",
      "<***DD***<",
      "<<<<<<<<<<"
    ],
    "warps": [
      {
        "x": 4,
        "y": 5,
        "to": {
          "map": "shamouti",
          "x": 16,
          "y": 4
        }
      },
      {
        "x": 5,
        "y": 5,
        "to": {
          "map": "shamouti",
          "x": 16,
          "y": 4
        }
      }
    ],
    "signs": [],
    "npcs": [
      {
        "x": 6,
        "y": 2,
        "name": "FEST KEEPER WREN",
        "art": "lady",
        "skin": "#c89878",
        "shirt": "#2a7a6a",
        "pants": "#3a3a4a",
        "hair": "#7a4a1a",
        "dialogue": [
          "Festival week, this house feeds half the plaza. The other half feeds itself at the stalls.",
          "Three isles, three shrines, one song. You'll hear it in your sleep by week's end."
        ]
      }
    ],
    "encounters": null,
    "items": [],
    "hidden": [],
    "events": [],
    "start": null
  }
};

// ---- Vermilion dock: the Orange crossing ferryman (Stage O1) ----
// Rides on MAPS4's travel-graph-repaired Vermilion (which already
// carries SAILOR BRINE + the movie events), adding ONE npc: the
// Valencia ferryman, gated by the Stage F ferryArc handler — before
// the embark is armed he stands at the dock with flavour dialogue and
// the handler speaks the gate line; after the homecoming (or once
// Valencia has ever been reached) the crossing runs both ways.
MAPS5.vermilion = {
  ...MAPS4.vermilion,
  npcs: [
    ...MAPS4.vermilion.npcs,
    { x: 13, y: 10, name: 'CAPT ORANGE', art: 'sailor', skin: '#c89878', shirt: '#c05a3a', pants: '#2a2a3a', hair: '#3a2a1a',
      ferry: 'valencia', ferryArc: 'orange',
      dialogue: ['The Valencia run is the long southern crossing — Orange Islands water, warm as bathwater and twice as blue.',
                 "Professor Hawthorn's office books that passage. No booking, no boarding — captain's orders, trainer."] },
  ],
};
