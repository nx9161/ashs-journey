// note-tables.mjs — the full original score for Ash's Journey.
// Seat 24 (Voice Designer), Wave 2. Contract: docs/contracts.md §2.
//
// PROVENANCE: 100% original compositions, composed 2026-10-15 for this
// project. No sampled audio, no audio files (zero-audio-file rule),
// no melody borrowed from any official game/anime. Melodies were
// written to generic chiptune harmony and given deliberate rhythmic
// "tells" (odd pickup figures, waltz bass, march snares) so a reviewer
// can hear they are new works, not imitations.
//
// FORMAT (contract §2.1):
//   Music:  { id, title, bpm, loop:true, tracks:[{ wave:'pulse'|'triangle'|'noise',
//             duty:0.125|0.25|0.5 (pulse only), vol:0..1, notes:[[beat,pitch,beats]...] }] }
//   SFX:    { id, wave, duty, vol, env:[attack,decay] (s), notes:[...] }
// Pitches are scientific notation (A4=440); null pitch on noise = unpitched hit.
// SFX beats are engine-scaled at 0.06 s/beat; music beats are real beats at bpm.

// --- tiny deterministic builders (still static note tables; no runtime randomness) ---
const HATS = (from, to, step, beats, vol) => {
  const n = [];
  for (let b = from; b < to - 1e-9; b += step) n.push([+b.toFixed(3), null, beats]);
  return n;
};
const KICKS = (beatsArr, vol) => beatsArr.map((b) => [b, null, 0.25]);
const PUMP = (from, to, lo, hi) => {
  const n = [];
  for (let b = from; b < to - 1e-9; b += 0.5) n.push([+b.toFixed(3), (Math.round(b * 2) % 2 === 0 ? lo : hi), 0.5]);
  return n;
};

// ============================================================ MUSIC ====
export const MUSIC = {
  'title-theme': {
    id: 'title-theme', title: 'First Light (title, original)', bpm: 112, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.45, notes: [
        [0,'D5',0.5],[0.5,'E5',0.5],[1,'F#5',0.5],[1.5,'G5',0.5],[2,'A5',1],[3,'G5',1],
        [4,'F#5',0.5],[4.5,'E5',0.5],[5,'D5',0.5],[5.5,'E5',0.5],[6,'F#5',1.5],[7.5,'E5',0.5],
        [8,'G5',1],[9,'A5',0.5],[9.5,'G5',0.5],[10,'F#5',0.5],[10.5,'E5',0.5],[11,'D5',1],
        [12,'E5',0.5],[12.5,'F#5',0.5],[13,'G5',0.5],[13.5,'A5',0.5],[14,'D6',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.2, notes: [
        [0,'F#4',1],[1,'G4',1],[2,'F#4',1],[3,'E4',1],
        [4,'D4',1],[5,'E4',1],[6,'D4',1],[7,'C#4',1],
        [8,'B4',1],[9,'A4',1],[10,'G4',1],[11,'F#4',1],
        [12,'E4',1],[13,'F#4',1],[14,'G4',1],[15,'A4',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'D3',2],[2,'A2',2],[4,'B2',2],[6,'F#2',2],
        [8,'G2',2],[10,'D3',2],[12,'A2',2],[14,'D3',2],
      ]},
      { wave: 'noise', vol: 0.18, notes: HATS(0, 16, 0.5, 0.125).concat(KICKS([0,4,8,12])) },
    ],
  },

  'battle-wild-theme': {
    id: 'battle-wild-theme', title: 'Tall Grass Gambit (wild battle, original)', bpm: 152, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.5, notes: [
        [0,'A4',0.5],[0.5,'C5',0.5],[1,'E5',0.5],[1.5,'A5',0.5],[2,'G5',1],[3,'E5',0.5],[3.5,'D5',0.5],
        [4,'C5',0.5],[4.5,'E5',0.5],[5,'A5',0.5],[5.5,'G5',0.5],[6,'F5',1],[7,'E5',1],
        [8,'A4',0.5],[8.5,'C5',0.5],[9,'E5',0.5],[9.5,'G5',0.5],[10,'A5',1],[11,'G5',0.5],[11.5,'F5',0.5],
        [12,'E5',0.5],[12.5,'D5',0.5],[13,'C5',0.5],[13.5,'B4',0.5],[14,'A4',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.22, notes: [
        [0,'A3',1],[2,'F3',1],[4,'G3',1],[6,'E3',1],
        [8,'A3',1],[10,'F3',1],[12,'G3',1],[14,'E3',1],
      ]},
      { wave: 'triangle', vol: 0.6, notes:
        PUMP(0,4,'A1','A2').concat(PUMP(4,8,'F1','F2')).concat(PUMP(8,12,'G1','G2')).concat(PUMP(12,16,'E1','E2')) },
      { wave: 'noise', vol: 0.4, notes:
        KICKS([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
          .concat([[2,null,0.25],[6,null,0.25],[10,null,0.25],[14,null,0.25]])
          .concat(HATS(0,16,0.5,0.125)) },
    ],
  },

  'battle-trainer-theme': {
    id: 'battle-trainer-theme', title: "Challenger's Measure (trainer battle, original)", bpm: 164, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.5, notes: [
        [0,'E5',0.5],[0.5,'G5',0.5],[1,'B5',0.5],[1.5,'E6',0.5],[2,'D6',1],[3,'B5',0.5],[3.5,'A5',0.5],
        [4,'G5',0.5],[4.5,'A5',0.5],[5,'B5',0.5],[5.5,'D6',0.5],[6,'C6',1],[7,'A5',1],
        [8,'E5',0.5],[8.5,'G5',0.5],[9,'A5',0.5],[9.5,'B5',0.5],[10,'C6',1],[11,'B5',0.5],[11.5,'A5',0.5],
        [12,'G5',0.5],[12.5,'F#5',0.5],[13,'E5',0.5],[13.5,'D5',0.5],[14,'E5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.22, notes: [
        [0,'E4',0.5],[1,'E4',0.5],[2,'E4',0.5],[3,'E4',0.5],
        [4,'C4',0.5],[5,'C4',0.5],[6,'C4',0.5],[7,'C4',0.5],
        [8,'D4',0.5],[9,'D4',0.5],[10,'D4',0.5],[11,'D4',0.5],
        [12,'B3',0.5],[13,'B3',0.5],[14,'B3',0.5],[15,'B3',0.5],
      ]},
      { wave: 'triangle', vol: 0.6, notes:
        PUMP(0,4,'E1','E2').concat(PUMP(4,8,'C1','C2')).concat(PUMP(8,12,'D1','D2')).concat(PUMP(12,16,'B1','B2')) },
      { wave: 'noise', vol: 0.4, notes:
        KICKS([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
          .concat([[2,null,0.25],[6,null,0.25],[10,null,0.25],[14,null,0.25]])
          .concat(HATS(0,16,0.5,0.125)) },
    ],
  },

  'route1-theme': {
    id: 'route1-theme', title: 'Road Out of Pallet (route, original)', bpm: 132, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.45, notes: [
        [0,'D5',0.5],[0.5,'F#5',0.5],[1,'A5',0.5],[1.5,'D6',0.5],[2,'B5',1],[3,'A5',0.5],[3.5,'G5',0.5],
        [4,'F#5',0.5],[4.5,'A5',0.5],[5,'D5',0.5],[5.5,'F#5',0.5],[6,'G5',1],[7,'E5',1],
        [8,'A5',0.5],[8.5,'G5',0.5],[9,'F#5',0.5],[9.5,'E5',0.5],[10,'D5',1],[11,'F#5',1],
        [12,'G5',0.5],[12.5,'A5',0.5],[13,'B5',0.5],[13.5,'A5',0.5],[14,'G5',1],[15,'F#5',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'D3',1],[1,'A2',1],[2,'B2',1],[3,'G2',1],[4,'D3',1],[5,'A2',1],[6,'G2',1],[7,'A2',1],
        [8,'D3',1],[9,'A2',1],[10,'B2',1],[11,'G2',1],[12,'E3',1],[13,'A2',1],[14,'D3',1],[15,'A2',1],
      ]},
      { wave: 'noise', vol: 0.2, notes: HATS(0,16,0.5,0.125) },
    ],
  },

  'pallet-theme': {
    id: 'pallet-theme', title: 'Hometown Morning (Pallet, original)', bpm: 96, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: [
        [0,'G4',1],[1,'A4',1],[2,'B4',1],[3,'C5',2],[5,'B4',1],
        [6,'A4',1],[7,'G4',1],[8,'A4',1],[9,'G4',2.5],[11.5,'F#4',0.5],
        [12,'G4',1],[13,'A4',1],[14,'B4',1],[15,'D5',2],[17,'C5',1],
        [18,'B4',1],[19,'A4',1],[20,'B4',1],[21,'G4',3],
      ]},
      { wave: 'triangle', vol: 0.5, notes: [
        [0,'G2',3],[3,'C3',3],[6,'D3',3],[9,'G2',3],
        [12,'E3',3],[15,'C3',3],[18,'D3',3],[21,'G2',3],
      ]},
      { wave: 'noise', vol: 0.12, notes: [[2,null,0.25],[5,null,0.25],[8,null,0.25],[11,null,0.25],[14,null,0.25],[17,null,0.25],[20,null,0.25],[23,null,0.25]] },
    ],
  },

  'viridian-theme': {
    id: 'viridian-theme', title: 'Crossroads City (Viridian, original)', bpm: 120, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.45, notes: [
        [0,'E5',0.5],[0.5,'G5',0.5],[1,'A5',1],[2,'G5',0.5],[2.5,'E5',0.5],[3,'D5',1],
        [4,'E5',1],[5,'C5',1],[6,'D5',1],[7,'E5',1],
        [8,'F5',0.5],[8.5,'A5',0.5],[9,'G5',1],[10,'E5',0.5],[10.5,'D5',0.5],[11,'C5',1],
        [12,'D5',1],[13,'E5',1],[14,'G5',1],[15,'C6',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'C3',1],[1,'E3',1],[2,'F3',1],[3,'G3',1],[4,'A3',1],[5,'G3',1],[6,'F3',1],[7,'E3',1],
        [8,'F3',1],[9,'A3',1],[10,'G3',1],[11,'E3',1],[12,'D3',1],[13,'G3',1],[14,'C3',1],[15,'G2',1],
      ]},
      { wave: 'noise', vol: 0.22, notes: HATS(0,16,0.5,0.125).concat(KICKS([0,4,8,12])) },
    ],
  },

  'center-theme': {
    id: 'center-theme', title: 'Healing Light (Center, original)', bpm: 88, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.32, notes: [
        [0,'F5',1],[1,'A5',1],[2,'C6',2],[4,'A5',1],[5,'G5',1],[6,'F5',2],
        [8,'E5',1],[9,'G5',1],[10,'Bb5',2],[12,'A5',1],[13,'G5',1],[14,'F5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: [
        [0,'F3',4],[4,'C3',4],[8,'Bb2',4],[12,'F3',4],
      ]},
      { wave: 'triangle', vol: 0.5, notes: [
        [0,'F2',2],[2,'C3',2],[4,'F2',2],[6,'C3',2],
        [8,'Bb2',2],[10,'F2',2],[12,'C3',2],[14,'F2',2],
      ]},
    ],
  },

  'pewter-theme': {
    id: 'pewter-theme', title: 'Stone & Slate (Pewter, original)', bpm: 104, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.45, notes: [
        [0,'E5',1],[1,'G5',1],[2,'A5',1],[3,'B5',1],[4,'C6',2],[6,'B5',1],[7,'A5',1],
        [8,'G5',1],[9,'A5',1],[10,'B5',2],[12,'A5',1],[13,'G5',1],[14,'E5',2],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'E2',2],[2,'G2',2],[4,'A2',2],[6,'B2',2],
        [8,'C3',2],[10,'B2',2],[12,'A2',2],[14,'E2',2],
      ]},
      { wave: 'noise', vol: 0.25, notes:
        [[2,null,0.25],[6,null,0.25],[10,null,0.25],[14,null,0.25]].concat(HATS(0,16,0.5,0.125)) },
    ],
  },

  'gym-theme': {
    id: 'gym-theme', title: 'House of Badges (gym, original)', bpm: 144, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.5, notes: [
        [0,'B4',0.5],[0.5,'D5',0.5],[1,'F#5',0.5],[1.5,'B5',0.5],[2,'A5',1],[3,'G5',1],
        [4,'F#5',0.5],[4.5,'E5',0.5],[5,'D5',0.5],[5.5,'E5',0.5],[6,'F#5',1],[7,'E5',1],
        [8,'B4',0.5],[8.5,'D5',0.5],[9,'E5',0.5],[9.5,'F#5',0.5],[10,'G5',1],[11,'F#5',1],
        [12,'E5',1],[13,'D5',1],[14,'B4',2],
      ]},
      { wave: 'triangle', vol: 0.6, notes: [
        [0,'B1',1],[1,'B1',1],[2,'G2',1],[3,'G2',1],[4,'A2',1],[5,'A2',1],[6,'F#2',1],[7,'F#2',1],
        [8,'B1',1],[9,'B1',1],[10,'G2',1],[11,'G2',1],[12,'A2',1],[13,'F#2',1],[14,'B1',2],
      ]},
      { wave: 'noise', vol: 0.4, notes:
        KICKS([0,4,8,12]).concat([[4,null,0.25],[12,null,0.25]]).concat(HATS(0,16,0.5,0.125)) },
    ],
  },

  // ---- W12 region pairs I: one town+route identity per region (NO-SAME-KIT
  // audio charter). Original melodies, each with its own interval fingerprint
  // (verify-audio [9] proves no two leads share an interval sequence). ----
  'amber-town-theme': {
    id: 'amber-town-theme', title: 'Salt & Citrus (Amber town, original)', bpm: 104, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.42, notes: [
        [0,'G4',1],[1,'C5',1],[2,'E5',1.5],[3.5,'D5',0.5],
        [4,'C5',1],[5,'A4',1],[6,'G4',2],
        [8,'A4',1],[9,'C5',1],[10,'D5',1.5],[11.5,'E5',0.5],
        [12,'G5',1],[13,'E5',1],[14,'D5',1],[15,'C5',1],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.18, notes: [
        [0,'E4',2],[2,'G4',2],[4,'A4',2],[6,'E4',2],
        [8,'F4',2],[10,'A4',2],[12,'G4',2],[14,'E4',2],
      ]},
      { wave: 'triangle', vol: 0.5, notes: [
        [0,'C3',2],[2,'G2',2],[4,'A2',2],[6,'E2',2],
        [8,'F2',2],[10,'C3',2],[12,'G2',2],[14,'C3',2],
      ]},
      { wave: 'noise', vol: 0.15, notes: HATS(0, 16, 1, 0.125).concat(KICKS([0, 8])) },
    ],
  },

  'amber-route-theme': {
    id: 'amber-route-theme', title: 'Trade Wind Run (Amber route, original)', bpm: 122, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.45, notes: [
        [0,'A4',0.75],[0.75,'C5',0.75],[1.5,'E5',0.75],[2.25,'A5',0.75],[3,'G5',1],
        [4,'E5',1],[5,'D5',0.5],[5.5,'E5',0.5],[6,'C5',2],
        [8,'D5',0.75],[8.75,'E5',0.75],[9.5,'G5',0.75],[10.25,'E5',0.75],[11,'A5',1],
        [12,'G5',1],[13,'E5',1],[14,'A4',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.18, notes: [
        [0,'E4',1],[2,'A4',1],[4,'C5',1],[6,'G4',1],
        [8,'F4',1],[10,'A4',1],[12,'B4',1],[14,'E4',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes:
        PUMP(0,4,'A1','A2').concat(PUMP(4,8,'G1','G2')).concat(PUMP(8,12,'F1','F2')).concat(PUMP(12,16,'E1','E2')) },
      { wave: 'noise', vol: 0.25, notes: HATS(0, 16, 0.5, 0.125).concat(KICKS([0, 4, 8, 12])) },
    ],
  },

  'yamato-town-theme': {
    id: 'yamato-town-theme', title: 'Temple Bell Morning (Yamato town, original)', bpm: 92, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: [
        [0,'A4',1.5],[1.5,'D5',1.5],[3,'F#5',1],[4,'E5',2],[6,'D5',1],[7,'C#5',1],
        [8,'D5',1.5],[9.5,'F#5',1.5],[11,'A5',1],[12,'G5',1.5],[13.5,'F#5',0.5],[14,'E5',1],[15,'D5',1],
      ]},
      { wave: 'pulse', duty: 0.25, vol: 0.15, notes: [
        [0,'F#4',1],[4,'A4',1],[8,'F#4',1],[12,'E4',1],
      ]},
      { wave: 'triangle', vol: 0.5, notes: [
        [0,'D3',4],[4,'G2',4],[8,'D3',4],[12,'A2',4],
      ]},
      { wave: 'noise', vol: 0.1, notes: [[3.5,null,0.25],[7.5,null,0.25],[11.5,null,0.25],[15.5,null,0.25]] },
    ],
  },

  'yamato-route-theme': {
    id: 'yamato-route-theme', title: 'Pilgrim Road (Yamato route, original)', bpm: 132, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.45, notes: [
        [0,'E5',0.5],[0.5,'B4',0.5],[1,'E5',0.5],[1.5,'G5',0.5],[2,'A5',1],[3,'G5',1],
        [4,'E5',0.5],[4.5,'D5',0.5],[5,'B4',0.5],[5.5,'D5',0.5],[6,'E5',2],
        [8,'G5',0.5],[8.5,'A5',0.5],[9,'B5',1],[10,'A5',0.5],[10.5,'G5',0.5],[11,'E5',1],
        [12,'D5',0.5],[12.5,'E5',0.5],[13,'G5',0.5],[13.5,'A5',0.5],[14,'B5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: [
        [0,'B3',1],[2,'G3',1],[4,'C4',1],[6,'D4',1],
        [8,'E4',1],[10,'D4',1],[12,'B3',1],[14,'G3',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes:
        PUMP(0,4,'E1','E2').concat(PUMP(4,8,'G1','G2')).concat(PUMP(8,12,'A1','A2')).concat(PUMP(12,16,'B1','B2')) },
      { wave: 'noise', vol: 0.22, notes: HATS(0, 16, 0.5, 0.125).concat(KICKS([0, 4, 8, 12])) },
    ],
  },

  'maris-town-theme': {
    id: 'maris-town-theme', title: 'Harbour Lights (Maris town, original)', bpm: 118, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.44, notes: [
        [0,'F5',0.5],[0.5,'A5',1],[1.5,'G5',0.5],[2,'F5',1],[3,'E5',0.5],[3.5,'F5',0.5],
        [4,'C5',1.5],[5.5,'D5',0.5],[6,'E5',1],[7,'F5',1],
        [8,'A5',0.5],[8.5,'G5',1],[9.5,'F5',0.5],[10,'E5',1],[11,'D5',1],
        [12,'E5',0.5],[12.5,'C5',0.5],[13,'D5',1],[14,'F5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: [
        [0,'C4',2],[2,'A3',2],[4,'Bb3',2],[6,'C4',2],
        [8,'A3',2],[10,'F3',2],[12,'G3',2],[14,'A3',2],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'F2',1],[1,'C3',1],[2,'F2',1],[3,'C3',1],[4,'Bb1',1],[5,'F2',1],[6,'C2',1],[7,'G2',1],
        [8,'F2',1],[9,'C3',1],[10,'D2',1],[11,'A2',1],[12,'Bb1',1],[13,'F2',1],[14,'C2',2],
      ]},
      { wave: 'noise', vol: 0.2, notes: HATS(0, 16, 0.5, 0.125).concat(KICKS([0, 4, 8, 12])) },
    ],
  },

  'maris-route-theme': {
    id: 'maris-route-theme', title: 'Open Water Road (Maris route, original)', bpm: 140, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: [
        [0,'D5',0.5],[0.5,'D5',0.5],[1,'G5',0.5],[1.5,'A5',0.5],[2,'B5',1],[3,'A5',1],
        [4,'G5',0.5],[4.5,'F#5',0.5],[5,'E5',0.5],[5.5,'D5',0.5],[6,'E5',1],[7,'F#5',1],
        [8,'G5',0.5],[8.5,'G5',0.5],[9,'B5',0.5],[9.5,'D6',0.5],[10,'B5',1],[11,'A5',1],
        [12,'B5',0.5],[12.5,'A5',0.5],[13,'G5',0.5],[13.5,'F#5',0.5],[14,'G5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.15, notes: [
        [0,'B3',1],[1,'D4',1],[2,'G3',1],[3,'D4',1],[4,'E4',1],[5,'B3',1],[6,'A3',1],[7,'D4',1],
        [8,'G3',1],[9,'B3',1],[10,'D4',1],[11,'A3',1],[12,'B3',1],[13,'D4',1],[14,'G3',2],
      ]},
      { wave: 'triangle', vol: 0.55, notes:
        PUMP(0,4,'G1','G2').concat(PUMP(4,8,'E1','E2')).concat(PUMP(8,12,'D1','D2')).concat(PUMP(12,16,'G1','G2')) },
      { wave: 'noise', vol: 0.3, notes: KICKS([0, 2, 4, 6, 8, 10, 12, 14]).concat(HATS(0, 16, 0.5, 0.125)) },
    ],
  },

  // ---- W12 region pairs II: Borea + Trial Grounds complete the charter —
  // after this block every region owns its town+route pair and no region
  // draws from Arden's legacy pool. Original melodies, each with its own
  // interval fingerprint (verify-audio [9]). ----
  'borea-town-theme': {
    id: 'borea-town-theme', title: 'First Snow Hush (Borea town, original)', bpm: 84, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: [
        [0,'E5',2],[2,'A5',1.5],[3.5,'G5',0.5],[4,'E5',2],[6,'D5',1],[7,'C5',1],
        [8,'A4',2],[10,'B4',1],[11,'D5',1],[12,'E5',1.5],[13.5,'G5',0.5],[14,'A5',2],
      ]},
      { wave: 'pulse', duty: 0.25, vol: 0.14, notes: [
        [0,'A4',2],[2,'C5',2],[4,'F4',2],[6,'A4',2],
        [8,'D4',2],[10,'F4',2],[12,'E4',2],[14,'A4',2],
      ]},
      { wave: 'triangle', vol: 0.5, notes: [
        [0,'A2',4],[4,'F2',4],[8,'D2',4],[12,'E2',4],
      ]},
      { wave: 'noise', vol: 0.08, notes: HATS(0, 16, 2, 0.125).concat([[7.5,null,0.25],[15.5,null,0.25]]) },
    ],
  },

  'borea-route-theme': {
    id: 'borea-route-theme', title: 'Long White Road (Borea route, original)', bpm: 148, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: [
        [0,'A5',0.5],[0.5,'F5',0.5],[1,'D5',0.5],[1.5,'F5',0.5],[2,'A5',1],[3,'G5',0.5],[3.5,'F5',0.5],
        [4,'E5',0.5],[4.5,'F5',0.5],[5,'G5',0.5],[5.5,'A5',0.5],[6,'D6',1],[7,'C6',1],
        [8,'A5',0.5],[8.5,'G5',0.5],[9,'F5',0.5],[9.5,'E5',0.5],[10,'F5',1],[11,'D5',1],
        [12,'E5',0.5],[12.5,'F5',0.5],[13,'G5',0.5],[13.5,'A5',0.5],[14,'F5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.15, notes: [
        [0,'F4',1],[2,'D4',1],[4,'Bb3',1],[6,'A3',1],
        [8,'F4',1],[10,'D4',1],[12,'C4',1],[14,'A3',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes:
        PUMP(0,4,'D1','D2').concat(PUMP(4,8,'Bb1','Bb2')).concat(PUMP(8,12,'F1','F2')).concat(PUMP(12,16,'A1','A2')) },
      { wave: 'noise', vol: 0.28, notes: KICKS([0, 2, 4, 6, 8, 10, 12, 14]).concat(HATS(0, 16, 0.5, 0.125)) },
    ],
  },

  'trial-town-theme': {
    id: 'trial-town-theme', title: 'Bronze & Banner (Trial hub, original)', bpm: 100, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.44, notes: [
        [0,'C5',1],[1,'E5',1],[2,'G5',1],[3,'C6',1],[4,'B5',1.5],[5.5,'G5',0.5],[6,'A5',1],[7,'G5',1],
        [8,'E5',1],[9,'F5',1],[10,'A5',1],[11,'G5',1],[12,'E5',1.5],[13.5,'D5',0.5],[14,'C5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.18, notes: [
        [0,'G4',2],[2,'E4',2],[4,'D4',2],[6,'B4',2],
        [8,'C5',2],[10,'F4',2],[12,'G4',2],[14,'E4',2],
      ]},
      { wave: 'triangle', vol: 0.55, notes: [
        [0,'C3',2],[2,'G2',2],[4,'C3',2],[6,'G2',2],
        [8,'F2',2],[10,'A2',2],[12,'G2',2],[14,'C3',2],
      ]},
      { wave: 'noise', vol: 0.3, notes:
        KICKS([0, 4, 8, 12]).concat([[2,null,0.25],[6,null,0.25],[10,null,0.25],[14,null,0.25],[15,null,0.25],[15.5,null,0.25]]) },
    ],
  },

  'trial-route-theme': {
    id: 'trial-route-theme', title: 'The Seven Trials (Trial island, original)', bpm: 128, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: [
        [0,'G5',0.5],[0.5,'D5',0.5],[1,'G5',0.5],[1.5,'Bb5',0.5],[2,'A5',1],[3,'G5',0.5],[3.5,'F5',0.5],
        [4,'D5',1],[5,'F5',0.5],[5.5,'G5',0.5],[6,'D5',2],
        [8,'Eb5',0.5],[8.5,'D5',0.5],[9,'C5',0.5],[9.5,'D5',0.5],[10,'Bb4',1],[11,'D5',1],
        [12,'F5',0.5],[12.5,'G5',0.5],[13,'A5',0.5],[13.5,'Bb5',0.5],[14,'G5',2],
      ]},
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: [
        [0,'Bb3',1],[2,'G3',1],[4,'F3',1],[6,'D4',1],
        [8,'Eb4',1],[10,'C4',1],[12,'D4',1],[14,'G3',1],
      ]},
      { wave: 'triangle', vol: 0.55, notes:
        PUMP(0,4,'G1','G2').concat(PUMP(4,8,'Eb1','Eb2')).concat(PUMP(8,12,'F1','F2')).concat(PUMP(12,16,'D1','D2')) },
      { wave: 'noise', vol: 0.26, notes: KICKS([0, 4, 8, 12]).concat(HATS(0, 16, 0.5, 0.125)) },
    ],
  },
};

// ============================================================ SFX ====
export const SFXSET = {
  // --- UI set (contract §2.2 item 3) ---
  'ui-blip':   { id:'ui-blip',   wave:'pulse', duty:0.5,   vol:0.35, env:[0.002,0.09], notes:[[0,'E6',1]] },
  'ui-tick':   { id:'ui-tick',   wave:'pulse', duty:0.5,   vol:0.22, env:[0.002,0.06], notes:[[0,'A5',1]] },
  'ui-back':   { id:'ui-back',   wave:'pulse', duty:0.5,   vol:0.32, env:[0.002,0.10], notes:[[0,'C5',1],[1,'G4',1.5]] },
  'dialogue-blip': { id:'dialogue-blip', wave:'pulse', duty:0.125, vol:0.18, env:[0.001,0.03], notes:[[0,'G6',0.5]] },
  'error-buzz': { id:'error-buzz', wave:'pulse', duty:0.25, vol:0.35, env:[0.005,0.15], notes:[[0,'A3',2],[2,'G3',2.5]] },

  // --- encounter + transitions (gameux §6 three-beat rule) ---
  'encounter-sting': { id:'encounter-sting', wave:'noise', vol:0.5, env:[0.005,0.25], notes:[
    [0,null,1],[0.9,null,1],[1.8,null,1],           // grass rustle x3 (visual twin: rustle anim)
  ]},
  'encounter-sting-melody': { id:'encounter-sting-melody', wave:'pulse', duty:0.125, vol:0.5, env:[0.004,0.2], notes:[
    [2.8,'G4',1],[3.8,'A4',1],[4.8,'B4',1],[5.8,'C5',3],   // the "!" beat (visual twin: ! mark)
  ]},
  'transition-whoosh': { id:'transition-whoosh', wave:'noise', vol:0.35, env:[0.01,0.2], notes:[[0,null,4]] },
  'transition-fade':   { id:'transition-fade',   wave:'triangle', vol:0.2, env:[0.02,0.15], notes:[[0,'C5',2]] },
  // Yellow homage: the trainer-spot alert — an original ascending two-note
  // sting (visual twin: the "!" mark over the challenger).
  'trainer-spot': { id:'trainer-spot', wave:'pulse', duty:0.125, vol:0.5, env:[0.002,0.12], notes:[[0,'E5',1],[1,'A5',2]] },
  // W6 (audit D1): the Fly teleport's own cue — a falling sparkle, distinct
  // from the screen-transition whoosh/fade the engine plays separately.
  'warp': { id:'warp', wave:'pulse', duty:0.125, vol:0.35, env:[0.002,0.18], notes:[[0,'E6',0.5],[0.5,'C6',0.5],[1,'G5',0.5],[1.5,'E5',1.5]] },

  // --- battle beats ---
  'battle-hit':   { id:'battle-hit',   wave:'noise', vol:0.5,  env:[0.002,0.12], notes:[[0,null,2]] },
  'battle-hit-tone': { id:'battle-hit-tone', wave:'pulse', duty:0.25, vol:0.4, env:[0.002,0.1], notes:[[0,'A2',1.5]] },
  'battle-super': { id:'battle-super', wave:'pulse', duty:0.125, vol:0.5, env:[0.003,0.18], notes:[[0,'E5',1],[1,'G5',1],[2,'B5',2]] },
  'battle-super-boom': { id:'battle-super-boom', wave:'noise', vol:0.55, env:[0.002,0.15], notes:[[0,null,2.5]] },
  'battle-noteff': { id:'battle-noteff', wave:'pulse', duty:0.5, vol:0.3, env:[0.005,0.18], notes:[[0,'D3',2]] },
  'battle-faint':  { id:'battle-faint',  wave:'pulse', duty:0.25, vol:0.45, env:[0.004,0.2], notes:[[0,'G4',1],[1,'E4',1],[2,'C4',1],[3,'A3',2]] },
  'battle-run':   { id:'battle-run',   wave:'pulse', duty:0.5, vol:0.4, env:[0.002,0.08], notes:[[0,'E5',0.5],[0.6,'G5',0.5],[1.2,'A5',0.5],[1.8,'C6',0.5],[2.4,'E6',1.5]] },

  // --- catch theater (contract §2.2 item 2) ---
  'catch-throw': { id:'catch-throw', wave:'noise', vol:0.4, env:[0.005,0.18], notes:[[0,null,3]] },
  'catch-rattle': { id:'catch-rattle', wave:'noise', vol:0.5, env:[0.002,0.08], notes:[[0,null,1.5],[2.5,null,1.5],[5,null,1.5]] },
  'catch-click': { id:'catch-click', wave:'pulse', duty:0.125, vol:0.6, env:[0.001,0.12], notes:[[0,'C6',1],[1,'E6',2]] },
  'catch-breakout': { id:'catch-breakout', wave:'noise', vol:0.5, env:[0.002,0.2], notes:[[0,null,2]] },
  'catch-breakout-tone': { id:'catch-breakout-tone', wave:'pulse', duty:0.25, vol:0.4, env:[0.003,0.18], notes:[[0,'E4',1],[1,'C4',1.5]] },
  'catch-crit':  { id:'catch-crit',  wave:'triangle', vol:0.5, env:[0.002,0.15], notes:[[0,'E6',1],[1,'G6',1],[2,'B6',1],[3,'E7',2]] },
  'catch-gotcha': { id:'catch-gotcha', wave:'pulse', duty:0.125, vol:0.55, env:[0.003,0.2], notes:[[0,'D6',1],[1,'F#6',1],[2,'A6',1],[3,'D7',2.5]] },
  'dex-register': { id:'dex-register', wave:'pulse', duty:0.5, vol:0.5, env:[0.003,0.25], notes:[[0,'E5',1.5],[1.5,'G5',1.5],[3,'B5',1.5],[4.5,'E6',3]] },

  // --- progression fanfares ---
  'victory':  { id:'victory',  wave:'pulse', duty:0.125, vol:0.5, env:[0.003,0.2], notes:[[0,'G5',1],[1,'C6',1],[2,'E6',1],[3,'G6',2]] },
  'fanfare':  { id:'fanfare',  wave:'pulse', duty:0.125, vol:0.55, env:[0.003,0.25], notes:[[0,'C5',1.5],[1.5,'E5',1.5],[3,'G5',1.5],[4.5,'C6',2],[6.5,'G5',1],[7.5,'C6',3]] },
  'levelup':  { id:'levelup',  wave:'pulse', duty:0.25, vol:0.5, env:[0.003,0.2], notes:[[0,'C5',1],[1,'E5',1],[2,'G5',1],[3,'C6',2],[5,'E6',2],[7,'G6',3]] },
  'badge':    { id:'badge',    wave:'pulse', duty:0.125, vol:0.55, env:[0.003,0.3], notes:[[0,'G4',1],[1,'C5',1],[2,'E5',1],[3,'G5',1],[4,'C6',2],[6,'E6',1],[7,'G6',3]] },
  'heal':     { id:'heal',     wave:'triangle', vol:0.5, env:[0.01,0.3], notes:[[0,'G4',1.5],[1.5,'C5',1.5],[3,'E5',1.5],[4.5,'G5',3]] },
  'save-confirm': { id:'save-confirm', wave:'pulse', duty:0.5, vol:0.4, env:[0.002,0.12], notes:[[0,'C5',1],[1,'G5',2]] },
  'lowhp':    { id:'lowhp',    wave:'pulse', duty:0.25, vol:0.5, env:[0.002,0.12], notes:[[0,'A4',1.5],[2,'A4',1.5],[4,'A4',1.5]] },
  'item-fanfare': { id:'item-fanfare', wave:'pulse', duty:0.5, vol:0.45, env:[0.002,0.15], notes:[[0,'A5',1],[1,'D6',1],[2,'F#6',2]] },
  'partner-happy': { id:'partner-happy', wave:'pulse', duty:0.125, vol:0.4, env:[0.001,0.06], notes:[[0,'B5',0.5],[0.7,'E6',0.75],[1.7,'B5',0.5],[2.4,'E6',1]] },
  'map-enter': { id:'map-enter', wave:'triangle', vol:0.32, env:[0.01,0.25], notes:[[0,'C5',1],[1,'E5',1],[2,'G5',2]] },

  // --- legacy call-site aliases (engine's original stub keys; same original melodies, kept working) ---
  'blip':      { id:'blip',      wave:'pulse', duty:0.5, vol:0.35, env:[0.002,0.09], notes:[[0,'E6',1]] },
  'tick':      { id:'tick',      wave:'pulse', duty:0.5, vol:0.22, env:[0.002,0.06], notes:[[0,'A5',1]] },
  'back':      { id:'back',      wave:'pulse', duty:0.5, vol:0.32, env:[0.002,0.10], notes:[[0,'C5',1],[1,'G4',1.5]] },
  'throw_':    { id:'throw_',    wave:'noise', vol:0.4, env:[0.005,0.18], notes:[[0,null,3]] },
  'rattle':    { id:'rattle',    wave:'noise', vol:0.5, env:[0.002,0.08], notes:[[0,null,1.5],[2.5,null,1.5],[5,null,1.5]] },
  'click':     { id:'click',     wave:'pulse', duty:0.125, vol:0.6, env:[0.001,0.12], notes:[[0,'C6',1],[1,'E6',2]] },
  'dex':       { id:'dex',       wave:'pulse', duty:0.5, vol:0.5, env:[0.003,0.25], notes:[[0,'E5',1.5],[1.5,'G5',1.5],[3,'B5',1.5],[4.5,'E6',3]] },
  'lowhp_legacy': { id:'lowhp_legacy', wave:'pulse', duty:0.25, vol:0.5, env:[0.002,0.12], notes:[[0,'A4',1.5],[2,'A4',1.5],[4,'A4',1.5]] },
  'encounter': { id:'encounter', wave:'pulse', duty:0.125, vol:0.5, env:[0.004,0.2], notes:[[0,'G4',1],[1,'A4',1],[2,'B4',1],[3,'C5',3]] },

  // --- W6 (audit D1): live call-site keys that were never tabled — the game
  // played these names for years and heard nothing. The sounds were always
  // the tables below; the keys just never landed in SFXSET. ---
  'menu-move': { id:'menu-move', wave:'pulse', duty:0.5, vol:0.22, env:[0.002,0.06], notes:[[0,'A5',1]] },
  'item-get':  { id:'item-get',  wave:'pulse', duty:0.5, vol:0.45, env:[0.002,0.15], notes:[[0,'A5',1],[1,'D6',1],[2,'F#6',2]] },
};

// ============================================================ CRIES ====
// Synthesized species cries (contract §2.3 — never sampled). One original
// motif per Wave-1 slice species.
export const CRIES = {
  pikachu:    { id:'cry-pikachu',    wave:'pulse', duty:0.125, vol:0.45, env:[0.001,0.08], notes:[[0,'B5',0.5],[0.7,'E6',0.75],[1.7,'B5',0.5],[2.4,'E6',1]] },
  pidgey:     { id:'cry-pidgey',     wave:'pulse', duty:0.25,  vol:0.4,  env:[0.004,0.2],  notes:[[0,'G5',1],[1,'E5',1],[2,'C5',1.5]] },
  rattata:    { id:'cry-rattata',    wave:'pulse', duty:0.5,   vol:0.4,  env:[0.002,0.08], notes:[[0,'A5',0.5],[0.6,'A5',0.5],[1.2,'G5',1]] },
  caterpie:   { id:'cry-caterpie',   wave:'triangle', vol:0.4, env:[0.01,0.25], notes:[[0,'E5',1],[1,'F5',1.2]] },
  weedle:     { id:'cry-weedle',     wave:'pulse', duty:0.25,  vol:0.4,  env:[0.003,0.15], notes:[[0,'F5',1],[1,'E5',1],[2,'D5',1.2]] },
  spearow:    { id:'cry-spearow',    wave:'pulse', duty:0.125, vol:0.45, env:[0.001,0.08], notes:[[0,'C6',0.5],[0.6,'A5',0.5],[1.2,'C6',1]] },
  zubat:      { id:'cry-zubat',      wave:'triangle', vol:0.45, env:[0.001,0.08], notes:[[0,'E6',0.5],[0.6,'D6',0.5],[1.2,'E6',0.5],[1.8,'C6',1]] },
  geodude:    { id:'cry-geodude',    wave:'pulse', duty:0.5,   vol:0.45, env:[0.005,0.2],  notes:[[0,'C4',1],[1,'C4',1],[2,'G3',1.5]] },
  onix:       { id:'cry-onix',       wave:'pulse', duty:0.5,   vol:0.5,  env:[0.01,0.4],   notes:[[0,'G2',2],[2,'C3',2.5]] },
  bulbasaur:  { id:'cry-bulbasaur',  wave:'pulse', duty:0.25,  vol:0.4,  env:[0.004,0.18], notes:[[0,'D5',1],[1,'C5',1],[2,'D5',1.5]] },
  charmander: { id:'cry-charmander', wave:'pulse', duty:0.25,  vol:0.42, env:[0.003,0.12], notes:[[0,'E5',0.75],[0.9,'G5',0.75],[1.8,'A5',1.2]] },
  squirtle:   { id:'cry-squirtle',   wave:'triangle', vol:0.42, env:[0.005,0.2], notes:[[0,'G5',1],[1,'F5',1],[2,'E5',1.5]] },
  nidoranm:   { id:'cry-nidoranm',   wave:'pulse', duty:0.25,  vol:0.4,  env:[0.004,0.15], notes:[[0,'A4',1],[1,'C5',1],[2,'E5',1.2]] },
  mankey:     { id:'cry-mankey',     wave:'pulse', duty:0.125, vol:0.42, env:[0.002,0.08], notes:[[0,'B4',0.5],[0.6,'D5',0.5],[1.2,'F5',0.5],[1.8,'A5',1]] },
};

// ============================================================ CRY DERIVATION ====
// W12-T1 (Audio Identity, plan §3.2): the authored tables above cover the
// 14 Wave-1 slice species; every other species' cry comes from deriveCry()
// — a pure deterministic function of the record alone (zero per-species
// data). Design: mulberry32 stream seeded by spriteSeed (unique on 509/509
// records); primary type -> timbre family + tonic; BST band + body offset +
// baby lift + evo-stage step -> register; note count 2..5 (stage adds
// notes) with the interval walk shaped by the secondary type's archetype
// (rise/fall/arch/valley/wave); catchRate sets the rhythm's base gap
// (rarer = slower); body plan -> envelope. Resolution order lives in the
// engine (audio.mjs resolveCry): authored, alias, forme-base, derived.
function cryRand(seed) { // mulberry32, as src/engine/rng.mjs, cry-mixed
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Primary type -> timbre family: [wave, duty (pulse only), tonic pitch
// class (C=0), envelope-decay multiplier (triangles ring, chirps clip)].
const CRY_TYPE_FAMILIES = {
  normal: ['pulse', 0.5, 0, 1], fire: ['pulse', 0.25, 2, 0.9],
  water: ['triangle', 0, 5, 1.3], electric: ['pulse', 0.125, 4, 0.7],
  grass: ['triangle', 0, 7, 1.2], ice: ['pulse', 0.125, 9, 0.9],
  fighting: ['pulse', 0.5, 2, 0.8], poison: ['pulse', 0.25, 6, 1.1],
  ground: ['pulse', 0.5, 0, 1.1], flying: ['pulse', 0.25, 7, 0.85],
  psychic: ['triangle', 0, 10, 1.4], bug: ['pulse', 0.125, 9, 0.75],
  rock: ['pulse', 0.5, 4, 1], ghost: ['triangle', 0, 3, 1.5],
  dragon: ['pulse', 0.25, 11, 1], dark: ['pulse', 0.5, 6, 0.95],
  steel: ['pulse', 0.125, 2, 0.8], fairy: ['triangle', 0, 0, 1.25],
};
// Body plan -> [[attack, decay] envelope seconds, register offset semis].
const CRY_BODY_ENVS = {
  biped: [[0.003, 0.12], 0], quad: [[0.004, 0.15], -1],
  blob: [[0.010, 0.30], -2], bird: [[0.001, 0.08], 2],
  fish: [[0.005, 0.20], 1], serpent: [[0.006, 0.22], -2],
};
const CRY_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const cryPitchName = (midi) => CRY_NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
const round2 = (x) => Math.round(x * 100) / 100;

// Cry aliases (W12 Ruling 4): the partner is VOLTIK — one creature, one
// voice. 'partner' resolves to the authored pikachu table, never a derived
// cry of its own (its record differs from the wild record: seed 2501).
export const CRY_ALIASES = { partner: 'pikachu' };

// Pure derivation: record + evo stage (chain depth 0/1/2, from the engine)
// -> an SFX-shaped cry table.
export function deriveCry(record, stage = 0) {
  const [fWave, fDuty, fTonic, fDecay] = CRY_TYPE_FAMILIES[record.types[0]] || CRY_TYPE_FAMILIES.normal;
  const [bEnv, bReg] = CRY_BODY_ENVS[record.body] || CRY_BODY_ENVS.biped;
  const rand = cryRand((record.spriteSeed ^ 0x85ebca6b) >>> 0);
  const bst = record.base.hp + record.base.atk + record.base.def
    + record.base.spa + record.base.spd + record.base.spe;
  const band = bst < 300 ? 4 : bst < 400 ? 0 : bst < 500 ? -3 : bst < 580 ? -7 : -12;
  let root = 72 + fTonic + band + bReg + (record.baby ? 3 : 0) + stage * 2;
  root = Math.max(55, Math.min(79, root));
  // Contour archetype: secondary type picks it; single-type draws it.
  const ARCH = ['rise', 'fall', 'arch', 'valley', 'wave'];
  const arch = record.types[1]
    ? ARCH[(record.types[1].charCodeAt(0) * 7 + record.types[1].length) % ARCH.length]
    : ARCH[Math.floor(rand() * ARCH.length)];
  let n = 2 + stage; // note count: +1 per evo stage, stream extras, cap 5
  if (rand() < 0.6) n++;
  if (rand() < 0.3) n++;
  n = Math.min(5, n);
  const UP = [0, 1, 2, 2, 3, 4], DOWN = [0, -1, -2, -2, -3, -4], SWING = [1, 2, 3];
  const midis = [root];
  for (let i = 1; i < n; i++) {
    let step;
    if (arch === 'rise') step = UP[Math.floor(rand() * UP.length)];
    else if (arch === 'fall') step = DOWN[Math.floor(rand() * DOWN.length)];
    else if (arch === 'arch') step = (i <= n / 2 ? UP : DOWN)[Math.floor(rand() * UP.length)];
    else if (arch === 'valley') step = (i <= n / 2 ? DOWN : UP)[Math.floor(rand() * UP.length)];
    else step = (i % 2 === 1 ? 1 : -1) * SWING[Math.floor(rand() * SWING.length)]; // wave
    let next = midis[i - 1] + step;
    if (next > root + 9 || next < root - 7) next = midis[i - 1] - step; // reflect at the contour fence
    midis.push(Math.max(48, Math.min(93, next)));
  }
  const gapBase = 0.55 + (1 - record.catchRate / 255) * 0.45;
  const notes = [];
  let beat = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) beat = round2(beat + gapBase * (0.85 + rand() * 0.3));
    let dur = round2(0.5 + rand() * 0.5);
    if (i === n - 1) dur = round2(dur * 1.4);
    notes.push([beat, cryPitchName(midis[i]), dur]);
  }
  const table = {
    id: 'cry-' + record.id,
    wave: fWave,
    vol: round2(0.4 + rand() * 0.06),
    env: [bEnv[0], Math.round(bEnv[1] * fDecay * 1000) / 1000],
    notes,
  };
  if (fWave === 'pulse') table.duty = fDuty;
  return table;
}

// ============================================================ INDEX ====
export const TRACKLIST = {
  music: Object.keys(MUSIC),
  sfx: Object.keys(SFXSET),
  cries: Object.keys(CRIES),
};

// Scene → music map (mirrors src/data/maps.mjs `music` fields; build-validated there).
export const AREA_MUSIC = {
  pallet: 'pallet-theme', route1: 'route1-theme', viridian: 'viridian-theme',
  center: 'center-theme', route2: 'route1-theme', pewter: 'pewter-theme', gym: 'gym-theme',
};
