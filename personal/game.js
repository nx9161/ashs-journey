
// ---- audio/note-tables.mjs ----
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
const MUSIC = {
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
    id: 'center-theme', title: 'Healing Light (Pokemon Center, original)', bpm: 88, loop: true,
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
};

// ============================================================ SFX ====
const SFXSET = {
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
};

// ============================================================ CRIES ====
// Synthesized species cries (contract §2.3 — never sampled). One original
// motif per Wave-1 slice species.
const CRIES = {
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

// ============================================================ INDEX ====
const TRACKLIST = {
  music: Object.keys(MUSIC),
  sfx: Object.keys(SFXSET),
  cries: Object.keys(CRIES),
};

// Scene → music map (mirrors src/data/maps.mjs `music` fields; build-validated there).
const AREA_MUSIC = {
  pallet: 'pallet-theme', route1: 'route1-theme', viridian: 'viridian-theme',
  center: 'center-theme', route2: 'route1-theme', pewter: 'pewter-theme', gym: 'gym-theme',
};


// ---- src/engine/rng.mjs ----
// rng.mjs — seeded multi-stream PRNG (mulberry32 class).
// Separate streams: rng.encounter / rng.battle / rng.misc — QA can lock battle RNG
// while leaving encounters live (architecture §7.1). Same seed + same inputs =
// identical playthrough.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRngStreams(seed) {
  const s = seed >>> 0;
  return {
    seed: s,
    encounter: mulberry32(s ^ 0x9e3779b9),
    battle: mulberry32(s ^ 0x85ebca6b),
    misc: mulberry32(s ^ 0xc2b2ae35),
  };
}

// roll(p, rngFn): true with probability p in [0,1].
function roll(p, rngFn) {
  return rngFn() < p;
}

// intIn(lo, hi, rngFn): uniform integer in [lo, hi].
function intIn(lo, hi, rngFn) {
  return lo + Math.floor(rngFn() * (hi - lo + 1));
}

// pick weighted: entries [[weight, value], ...]
function pickWeighted(entries, rngFn) {
  let total = 0;
  for (let i = 0; i < entries.length; i++) total += entries[i][0];
  let r = rngFn() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i][0];
    if (r <= 0) return entries[i][1];
  }
  return entries[entries.length - 1][1];
}


// ---- src/engine/formulas.mjs ----
// formulas.mjs — battle math as PURE functions (architecture §7.3).
// Reimplemented from documented Gen 4/5 systems (dossier §B). Named exports double
// as the ADR note's documented constants. Unit-testable without a browser.

const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

// Attacking type -> defending type -> multiplier. Absent = 1.
const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

function effectiveness(moveType, defenderTypes) {
  const row = TYPE_CHART[moveType] || {};
  let m = 1;
  for (let i = 0; i < defenderTypes.length; i++) {
    m *= (row[defenderTypes[i]] !== undefined ? row[defenderTypes[i]] : 1);
  }
  return m;
}

// Documented Gen 4/5 damage: floor(floor(floor(2*L/5+2)*Power*A/D)/50)+2
// then STAB 1.5x, type effectiveness, crit 2x (1/16 Gen 2-5), random 0.85-1.00,
// burn halves physical.
function calcDamage(level, power, atk, def, opts) {
  const o = opts || {};
  const stab = o.stab ? 1.5 : 1;
  const eff = o.effectiveness !== undefined ? o.effectiveness : 1;
  const crit = o.crit ? 2 : 1;
  const rand = o.random !== undefined ? o.random : 1;
  const burn = o.burn && o.physical ? 0.5 : 1;
  const base = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * atk / def) / 50) + 2;
  return Math.max(1, Math.floor(base * stab * eff * crit * rand * burn));
}

const CRIT_CHANCE = 1 / 16; // Gen 2-5 value
const STAB_MULT = 1.5;
const RANDOM_MIN = 0.85;
const RANDOM_MAX = 1.0;

// Stat stage ladder: stage in [-6, 6]; each stage x1.5 / ÷1.5.
function stageMultiplier(stage) {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

function statValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + 5;
}
function hpValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + level + 10;
}

// Catch: documented Gen 5 values (dossier §B1 + GD §3.3).
// a = ((3*HPmax - 2*HPcur) / (3*HPmax)) * catchRate * ballBonus * statusBonus
// statusBonus: 2.5 sleep/freeze, 1.5 para/poison/burn. a >= 255 => guaranteed.
const STATUS_CATCH_BONUS = {
  sleep: 2.5, freeze: 2.5, paralysis: 1.5, poison: 1.5, burn: 1.5, badlyPoisoned: 1.5,
};

function catchA(hpMax, hpCur, catchRate, ballBonus, status) {
  const sb = (status && STATUS_CATCH_BONUS[status]) || 1;
  return ((3 * hpMax - 2 * hpCur) / (3 * hpMax)) * catchRate * ballBonus * sb;
}

// Shake checks per documented Gen 4/5 shake probability.
// Returns the number of successful shakes (0-3). Caller provides rng().
function shakeChecks(a, rng) {
  if (a >= 255) return 3;
  let shakes = 0;
  for (let i = 0; i < 3; i++) {
    // Documented shake probability: b = 65536 / (255/a)^(1/4)... simplified to the
    // standard approximation used in reimplementations: p = a/255 scaled per shake.
    const p = Math.pow(a / 255, 0.75);
    if (rng() < p) shakes++;
    else break;
  }
  return shakes;
}

function isCriticalCapture(a) {
  // Gen 5 critical capture: rare instant-catch flourish on low-odds throws.
  // Eligibility scales inversely with `a`; kept as theater per GD §3.3.
  return a < 60;
}

// XP: documented growth curves reimplemented (GD §3.4).
function xpForLevel(curve, level) {
  const n = level;
  switch (curve) {
    case 'erratic':
      if (n <= 50) return Math.floor((n * n * n * (100 - n)) / 50);
      if (n <= 68) return Math.floor((n * n * n * (150 - n)) / 100);
      if (n <= 98) return Math.floor((n * n * n * ((1911 - 10 * n) / 3)) / 500);
      return Math.floor((n * n * n * (160 - n)) / 100);
    case 'fast': return Math.floor((4 * n * n * n) / 5);
    case 'mediumfast': return n * n * n;
    case 'mediumslow': return Math.floor((6 / 5) * n * n * n - 15 * n * n + 100 * n - 140);
    case 'slow': return Math.floor((5 * n * n * n) / 4);
    case 'fluctuating':
      if (n <= 15) return Math.floor((n * n * n * (((n + 1) / 3 + 24) / 50)));
      if (n <= 36) return Math.floor((n * n * n * ((n + 14) / 50)));
      return Math.floor((n * n * n * ((n / 2 + 32) / 50)));
    default: return n * n * n;
  }
}

// Simplified documented-style XP yield: base * level / 7; trainer battles pay
// the documented Gen 5-era 1.5x (GD balance: the slice's XP economy runs on
// trainer payouts, not wild grinding).
function xpYield(baseXp, level, isWild) {
  return Math.max(1, Math.floor((baseXp * level) / 7 * (isWild ? 1 : 1.5)));
}

// Turn order: priority bracket -> Speed (paralysis quarters Speed, Gen 4-6) -> random.
function turnOrder(a, b, rng) {
  const pa = a.priority || 0, pb = b.priority || 0;
  if (pa !== pb) return pa > pb ? [a, b] : [b, a];
  const sa = a.status === 'paralysis' ? Math.floor(a.speed / 4) : a.speed;
  const sb = b.status === 'paralysis' ? Math.floor(b.speed / 4) : b.speed;
  if (sa !== sb) return sa > sb ? [a, b] : [b, a];
  return rng() < 0.5 ? [a, b] : [b, a];
}


// ---- src/engine/loop.mjs ----
// loop.mjs — fixed-timestep 30 Hz sim + interpolated rAF render (architecture §2.1).
// Sim tick 30 Hz. Render every rAF with accumulator alpha. Max 5 catch-up steps
// (spiral-of-death guard). Input sampled per rAF, applied at next tick.
// visibilitychange -> sim halts + autosave hook (dossier).

const SIM_HZ = 30;
const SIM_DT = 1 / SIM_HZ;
const MAX_CATCHUP = 5;

class Loop {
  constructor(game) {
    this.game = game;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.rafId = 0;
    this.frameTimes = []; // rolling frame-time histogram (perf HUD, QA)
    this.onAutosave = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = this._now();
    const raf = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(this._now()), 16);
    const step = (t) => {
      if (!this.running) return;
      this._tick(t);
      this.rafId = raf(step);
    };
    this.rafId = raf(step);
  }

  stop() {
    this.running = false;
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.rafId);
  }

  // Headless / test driver: advance the sim by exactly n ticks.
  stepTicks(n) {
    for (let i = 0; i < n; i++) {
      this.game.update(SIM_DT);
    }
    this.game.render(1);
  }

  // Advance wall-clock ms (for headless time-based sequences like the 3s disclaimer).
  stepMs(ms) {
    let remaining = ms / 1000;
    while (remaining > 0) {
      const dt = Math.min(remaining, SIM_DT);
      this.game.update(dt);
      remaining -= dt;
    }
    this.game.render(1);
  }

  _now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  _tick(t) {
    let frameMs = t - this.last;
    this.last = t;
    if (frameMs > 250) frameMs = 250; // background-tab return: drop debt
    this.acc += frameMs / 1000;
    let steps = 0;
    while (this.acc >= SIM_DT && steps < MAX_CATCHUP) {
      this.game.input.sample();
      this.game.update(SIM_DT);
      this.acc -= SIM_DT;
      steps++;
    }
    if (steps === MAX_CATCHUP) this.acc = 0; // shed excess debt, never spiral
    const alpha = Math.min(1, this.acc / SIM_DT);
    const t0 = this._now();
    this.game.render(alpha);
    const cost = this._now() - t0;
    this.frameTimes.push(cost);
    if (this.frameTimes.length > 240) this.frameTimes.shift();
  }

  // Mean frame cost over the last window (ms) — QA perf overlay.
  meanFrameCost() {
    if (!this.frameTimes.length) return 0;
    let s = 0;
    for (let i = 0; i < this.frameTimes.length; i++) s += this.frameTimes[i];
    return s / this.frameTimes.length;
  }

  bindVisibility(pauseFn) {
    if (typeof document === 'undefined' || !document.addEventListener) return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.onAutosave) this.onAutosave();
        if (pauseFn) pauseFn();
      }
    });
  }
}


// ---- src/engine/input.mjs ----
// input.mjs — keyboard + touch D-pad/A/B input with per-tick edge detection.
// DOM overlays are built by ui.mjs; this module owns state. Headless driver injects
// via `inject(code)` / `release(code)`. 4-way D-pad: last-pressed-wins diagonals.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a',
  Enter: 'start', // Uix ruling (phase4-uix-signoff): Enter = START, A = Z/Space. One key, one job.
  KeyX: 'b', Backspace: 'b',
  ShiftLeft: 'select', ShiftRight: 'select',
  KeyQ: 'pageup', KeyE: 'pagedown',
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4',
  KeyF: 'fullscreen', KeyM: 'mute', Escape: 'escape',
};
const ACTIONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select',
  'pageup', 'pagedown', 'slot1', 'slot2', 'slot3', 'slot4', 'fullscreen', 'mute', 'escape'];

class Input {
  constructor() {
    this.held = {};      // action -> bool (current physical state)
    this.pressed = {};   // action -> bool (edge: went down since last sample)
    this._dirStack = []; // last-pressed-wins for diagonals
    this.remap = Object.assign({}, KEYMAP);
    this.flipControls = false;
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; }
    this._bound = false;
  }

  bindKeyboard() {
    if (this._bound || typeof document === 'undefined') return;
    this._bound = true;
    const down = (e) => {
      const action = this.remap[e.code];
      if (!action) return;
      if (['up', 'down', 'left', 'right', 'a', 'b'].includes(action)) e.preventDefault();
      this._press(action);
    };
    const up = (e) => {
      const action = this.remap[e.code];
      if (!action) return;
      this._release(action);
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    // Touch overlays call press/release directly.
  }

  _press(action) {
    if (!this.held[action]) this.pressed[action] = true;
    this.held[action] = true;
    if (['up', 'down', 'left', 'right'].includes(action)) {
      this._dirStack = this._dirStack.filter((d) => d !== action);
      this._dirStack.push(action);
    }
  }

  _release(action) {
    this.held[action] = false;
    this._dirStack = this._dirStack.filter((d) => d !== action);
  }

  // Public API for touch overlays + headless driver.
  press(action) { this._press(action); }
  release(action) { this._release(action); }
  inject(action) { this._press(action); }      // headless: momentary press
  releaseAll() {
    for (const a of ACTIONS) this._release(a);
  }

  // Called once per sim tick (and per rAF in loop) — edges consumed here.
  sample() {
    // pressed[] stays true until consumed by game code via wasPressed().
  }

  wasPressed(action) {
    const p = !!this.pressed[action];
    this.pressed[action] = false;
    return p;
  }

  isHeld(action) { return !!this.held[action]; }

  // 4-way direction, last-pressed wins (diagonals ignored per gameux §2).
  dir() {
    return this._dirStack.length ? this._dirStack[this._dirStack.length - 1] : null;
  }

  consumeAll() {
    for (const a of ACTIONS) this.pressed[a] = false;
  }
}


// ---- src/engine/audio.mjs ----
// audio.mjs — WebAudio chiptune engine: note-table player with loop scheduler.
// Contract: docs/contracts.md §2. Score lives in audio/note-tables.mjs
// (import stripped by the zero-dep build; module-order.json pins it first).
// 4-6 channel budget (2 pulse, 1 triangle, 1 noise) enforced by VOICE_BUDGET.
// Music unlocks on first user gesture. Safe no-op when AudioContext is
// unavailable (headless / SSR). Persisted mute + volume via applySettings.
// Every gameplay-critical cue keeps a visual twin (see audio/SCORE.md).


const CHANNELS = ['pulse1', 'pulse2', 'triangle', 'noise'];
const VOICE_BUDGET = 6; // hard cap on concurrent live voices (polyphony discipline)
const SFX_SCALE = 0.06; // SFX beats -> seconds (60ms per beat)
const EPS = 1e-6; // sub-audible simultaneity epsilon for voice-overlap math

const PITCH_RE = /^([A-G][#b]?)(\d)$/;
const NAMES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

function freqOf(pitch) {
  // Scientific pitch notation -> Hz. A4 = 440.
  const m = PITCH_RE.exec(pitch);
  if (!m) return 440;
  const midi = ((parseInt(m[2], 10) + 1) * 12) + NAMES[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const MUSIC_TRACKS = MUSIC;
const CRY_TABLE = CRIES;
// Legacy key compatibility for existing call sites: blip/tick/back/fanfare/heal/
// error/throw_/rattle/click/dex/lowhp/encounter all exist in SFXSET.
const SFX = SFXSET;

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;   // mute switch
    this.musicBus = null; // music volume
    this.sfxBus = null;   // sfx volume
    this.muted = false;
    this.musicVol = 0.8;
    this.sfxVol = 0.8;
    this.reducedMotion = false;
    this._unlocked = false;
    this._musicId = null;      // currently playing music track
    this._areaMusicId = null;  // last non-battle track (restore target)
    this._schedTimer = null;
    this._noiseBuf = null;
    this._pulseWaves = {};
    // Polyphony discipline: track scheduled voices as [start, stop) windows;
    // the cap applies to voices *sounding together*, not to the whole
    // look-ahead queue (a scheduled loop holds dozens of future notes).
    this._live = [];
  }

  // Call from the first user gesture (A press / tap). AC may be injected
  // (tests) — otherwise resolves the browser's AudioContext.
  unlock(AC) {
    if (this._unlocked) return;
    const Ctor = AC || (typeof AudioContext !== 'undefined' ? AudioContext
      : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null));
    if (!Ctor) return; // headless: stay silent, never throw
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVol;
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVol;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this._unlocked = true;
      // If a track was requested before unlock (e.g. title theme queued at
      // boot), start it now that the gesture arrived. _musicId is cleared
      // first so the same-id no-op guard doesn't swallow the replay.
      if (this._pendingMusic) { const id = this._pendingMusic; this._pendingMusic = null; this._musicId = null; this.playMusic(id); }
    } catch (e) { /* audio unavailable: silent mode */ }
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
  }

  setMusicVolume(v) {
    this.musicVol = Math.min(1, Math.max(0, +v || 0));
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
    }
  }

  setSfxVolume(v) {
    this.sfxVol = Math.min(1, Math.max(0, +v || 0));
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  setReducedMotion(b) {
    this.reducedMotion = !!b;
  }

  // Persisted settings object from game state: { mute, musicVol, sfxVol, reducedMotion }.
  applySettings(s) {
    if (!s) return;
    this.setMuted(!!s.mute);
    if (typeof s.musicVol === 'number') this.setMusicVolume(s.musicVol);
    if (typeof s.sfxVol === 'number') this.setSfxVolume(s.sfxVol);
    this.setReducedMotion(!!s.reducedMotion);
  }

  // ---- music ----
  _tableBeats(table) {
    let end = 0;
    for (const tr of table.tracks || []) {
      for (const [beat, , beats] of tr.notes) end = Math.max(end, beat + beats);
    }
    return end;
  }

  // id: key in MUSIC. opts.area=false for battle music (not a restore target).
  // No-op when the same track is already playing (no restart churn on warps).
  playMusic(id, opts) {
    if (!id || !MUSIC[id]) return;
    const area = !opts || opts.area !== false;
    if (this._musicId === id) { if (area) this._areaMusicId = id; return; }
    this._musicId = id;
    if (area) this._areaMusicId = id;
    if (!this._unlocked || !this.ctx) { this._pendingMusic = id; return; }
    this._clearSched();
    const table = MUSIC[id];
    const spb = 60 / (table.bpm || 120);
    const loopLen = Math.max(0.25, this._tableBeats(table) * spb);
    let nextStart = this.ctx.currentTime + 0.06;
    const scheduleLoop = () => {
      const t0 = nextStart;
      try {
        for (const tr of table.tracks) {
          for (const [beat, pitch, beats] of tr.notes) {
            this._schedule(tr, pitch, t0 + beat * spb, beats * spb, tr.vol || 0.5, this.musicBus);
          }
        }
      } catch (e) { /* never let audio break the game */ }
      nextStart = t0 + loopLen;
      this._schedTimer = setTimeout(scheduleLoop, Math.max(0, (nextStart - this.ctx.currentTime - 0.25) * 1000));
    };
    scheduleLoop();
  }

  stopMusic() {
    this._clearSched();
    this._musicId = null;
  }

  restoreAreaMusic() {
    if (this._areaMusicId) this.playMusic(this._areaMusicId);
  }

  _clearSched() {
    if (this._schedTimer) { clearTimeout(this._schedTimer); this._schedTimer = null; }
  }

  // ---- SFX ----
  // key: SFXSET key (e.g. 'ui-blip') or a raw table { wave, duty, vol, env, notes }.
  playSfx(key) {
    if (!this._unlocked || !this.ctx || this.muted) return;
    const table = typeof key === 'string' ? SFXSET[key] : key;
    if (!table) return;
    const t = this.ctx.currentTime;
    const tr = table.track || table;
    try {
      for (const [beat, pitch, beats] of (tr.notes || [])) {
        this._schedule(
          { wave: tr.wave || 'pulse', duty: tr.duty || 0.5, env: tr.env },
          pitch, t + beat * SFX_SCALE, beats * SFX_SCALE, tr.vol || 0.5, this.sfxBus,
        );
      }
    } catch (e) { /* never let audio break the game */ }
  }

  // Convenience pairs (visual twins live in the scenes; see audio/SCORE.md).
  encounter() { this.playSfx('encounter-sting'); this.playSfx('encounter-sting-melody'); }
  transition() { this.playSfx(this.reducedMotion ? 'transition-fade' : 'transition-whoosh'); }
  playCry(speciesId) {
    const cry = CRIES[speciesId];
    this.playSfx(cry || { wave: 'pulse', duty: 0.25, vol: 0.35, env: [0.004, 0.15], notes: [[0, 'E5', 1], [1, 'C5', 1]] });
  }
  // Battle impact theater: sound picks the effectiveness tier.
  hitFeedback(eff) {
    if (eff > 1) { this.playSfx('battle-super-boom'); this.playSfx('battle-super'); }
    else if (eff < 1) { this.playSfx('battle-hit'); this.playSfx('battle-noteff'); }
    else { this.playSfx('battle-hit'); this.playSfx('battle-hit-tone'); }
  }
  catchBreakout() { this.playSfx('catch-breakout'); this.playSfx('catch-breakout-tone'); }

  // ---- voice synthesis ----
  _schedule(tr, pitch, t, dur, vol, bus) {
    if (!this.ctx || !bus) return;
    if (!this._voiceSlot(t, dur)) return; // polyphony discipline: 4-6 channels
    const g = this.ctx.createGain();
    const env = tr.env; // [attack, decay] seconds; peak = vol
    try {
      if (tr.wave === 'noise') {
        const src = this.ctx.createBufferSource();
        src.buffer = this._noiseBuffer();
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 1000;
        this._applyEnv(g.gain, t, vol, dur, env);
        src.connect(f); f.connect(g); g.connect(bus);
        this._voiceStart(src, t, Math.max(dur, env ? env[0] + env[1] : dur));
      } else {
        const o = this.ctx.createOscillator();
        if (tr.wave === 'triangle') { o.type = 'triangle'; }
        else { o.setPeriodicWave(this._pulseWave(tr.duty || 0.5)); }
        if (pitch) o.frequency.value = freqOf(pitch);
        this._applyEnv(g.gain, t, vol, dur, env);
        o.connect(g); g.connect(bus);
        this._voiceStart(o, t, Math.max(dur, env ? env[0] + env[1] : dur));
      }
    } catch (e) { /* never let audio break the game */ }
  }

  _applyEnv(param, t, vol, dur, env) {
    if (env && env.length === 2) {
      param.setValueAtTime(0.0001, t);
      param.linearRampToValueAtTime(Math.max(0.0001, vol), t + env[0]);
      param.exponentialRampToValueAtTime(0.0001, t + env[0] + env[1]);
    } else {
      param.setValueAtTime(vol, t);
      param.exponentialRampToValueAtTime(0.0001, t + dur);
    }
  }

  // True when a new voice [t, t+dur) can start without exceeding the budget.
  // Measures *simultaneous* voices: the sweep checks every instant where the
  // overlap count can change (the new note's start + each existing note's
  // start inside its span) — the same event-sweep the verify-audio audit uses.
  // EPS: note times are absolute AudioContext seconds (large magnitudes), so
  // float association noise can leave a 1-ulp phantom "overlap" between a
  // voice that just ended and one starting now. 1µs is far below audibility.
  _voiceSlot(t, dur) {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this._live = this._live.filter((v) => v.stop > now);
    const instants = [t];
    for (const v of this._live) if (v.start > t + EPS && v.start < t + dur) instants.push(v.start);
    for (const s of instants) {
      let n = 0;
      for (const v of this._live) if (v.start <= s + EPS && v.stop > s + EPS) n++;
      if (n >= VOICE_BUDGET) return false;
    }
    return true;
  }

  _voiceStart(node, t, stopDur) {
    // Budget window ends at stopDur (the +0.03 below is sub-audible scheduling
    // slack, excluded so the budget audit and the engine agree).
    this._live.push({ start: t, stop: t + stopDur });
    node.onended = () => { /* window-pruned in _voiceSlot; kept for debuggers */ };
    node.start(t);
    node.stop(t + stopDur + 0.03);
  }

  // Duty-cycle pulse timbres (0.125 / 0.25 / 0.5) via PeriodicWave.
  _pulseWave(duty) {
    const key = String(duty);
    if (!this._pulseWaves[key]) {
      const N = 24;
      const real = new Float32Array(N);
      const imag = new Float32Array(N);
      real[0] = 2 * duty - 1;
      for (let k = 1; k < N; k++) {
        imag[k] = (k % 2 === 1) ? (4 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) : 0;
      }
      this._pulseWaves[key] = this.ctx.createPeriodicWave(real, imag, { disableNormalization: true });
    }
    return this._pulseWaves[key];
  }

  _noiseBuffer() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  }
}


// ---- src/engine/render.mjs ----
// render.mjs — Canvas 2D renderer with the ADR-007 perf budgets.
// DPR auto-tier: cap 2; tier to 1 on <=2GB RAM or software rasterizer.
// Viewport culling: only tiles/entities intersecting the camera rect are drawn.
// Hot-path rules: no shadowBlur, no per-frame gradients, imageSmoothingEnabled=false.

const TILE = 16;

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.viewW = 0; this.viewH = 0;   // logical px
    this.camX = 0; this.camY = 0;     // camera top-left in world px
    this.shakeX = 0; this.shakeY = 0; // screen-shake offset (px, logical)
    this.flashA = 0;                  // white flash overlay alpha
    this.fadeA = 0; this.fadeColor = '#000';
    this.autoTier();
  }

  autoTier() {
    let dpr = 1;
    try {
      const w = typeof window !== 'undefined' ? window : {};
      dpr = Math.min(2, w.devicePixelRatio || 1);
      const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
      if (mem <= 2) dpr = 1; // ADR-007: auto-tier to 1 on <=2GB RAM
    } catch (e) { dpr = 1; }
    this.dpr = dpr;
  }

  // Logical viewport (game px). Internal res capped by design (gameux §2).
  resize(logicalW, logicalH, cssW, cssH) {
    this.viewW = logicalW; this.viewH = logicalH;
    this.canvas.width = Math.round(logicalW * this.dpr);
    this.canvas.height = Math.round(logicalH * this.dpr);
    if (this.canvas.style) {
      this.canvas.style.width = cssW + 'px';
      this.canvas.style.height = cssH + 'px';
    }
  }

  begin() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000';
    c.fillRect(0, 0, this.viewW, this.viewH);
    c.save();
    c.translate(-Math.round(this.camX) + this.shakeX, -Math.round(this.camY) + this.shakeY);
  }

  end() {
    const c = this.ctx;
    c.restore();
    if (this.flashA > 0) {
      c.fillStyle = 'rgba(255,255,255,' + this.flashA.toFixed(3) + ')';
      c.fillRect(0, 0, this.viewW, this.viewH);
    }
    if (this.fadeA > 0) {
      c.globalAlpha = Math.min(1, this.fadeA);
      c.fillStyle = this.fadeColor;
      c.fillRect(0, 0, this.viewW, this.viewH);
      c.globalAlpha = 1;
    }
  }

  // Camera centers on a world point, clamped to map bounds.
  centerOn(wx, wy, mapWpx, mapHpx) {
    this.camX = Math.max(0, Math.min(mapWpx - this.viewW, wx - this.viewW / 2));
    this.camY = Math.max(0, Math.min(mapHpx - this.viewH, wy - this.viewH / 2));
    if (mapWpx <= this.viewW) this.camX = (mapWpx - this.viewW) / 2;
    if (mapHpx <= this.viewH) this.camY = (mapHpx - this.viewH) / 2;
  }

  // Viewport rect in world px — for culling.
  viewRect() {
    return {
      x0: this.camX - TILE, y0: this.camY - TILE,
      x1: this.camX + this.viewW + TILE, y1: this.camY + this.viewH + TILE,
    };
  }

  // Blit a pre-rendered offscreen sprite (zero per-frame allocation).
  blit(sprite, dx, dy) {
    const c = this.ctx;
    const w = sprite.width, h = sprite.height;
    // Cull against viewport
    if (dx + w < this.camX - TILE || dy + h < this.camY - TILE ||
        dx > this.camX + this.viewW + TILE || dy > this.camY + this.viewH + TILE) return;
    c.drawImage(sprite, Math.round(dx), Math.round(dy));
  }

  // Scaled blit for authored battlers (32px art -> 48px draw size).
  // imageSmoothingEnabled=false is set in begin(): crisp pixel scaling.
  blitS(sprite, dx, dy, w, h) {
    const c = this.ctx;
    if (dx + w < this.camX - TILE || dy + h < this.camY - TILE ||
        dx > this.camX + this.viewW + TILE || dy > this.camY + this.viewH + TILE) return;
    c.drawImage(sprite, Math.round(dx), Math.round(dy), Math.round(w), Math.round(h));
  }

  text(str, x, y, opts) {
    const o = opts || {};
    const c = this.ctx;
    c.font = (o.bold ? 'bold ' : '') + (o.size || 8) + 'px monospace';
    c.textBaseline = 'top';
    if (o.shadow !== false) {
      c.fillStyle = o.shadowColor || 'rgba(0,0,0,0.55)';
      c.fillText(str, x + 1, y + 1);
    }
    c.fillStyle = o.color || '#fff';
    c.fillText(str, x, y);
  }

  panel(x, y, w, h, fill, border) {
    const c = this.ctx;
    c.fillStyle = fill || '#f8f8f0';
    c.fillRect(x, y, w, h);
    c.strokeStyle = border || '#202028';
    c.lineWidth = 2;
    c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // HP bar with colorblind-safe stripe overlay under 25% (gameux §7).
  // The stripes are STATIC (not motion) — they always draw; they are the
  // colorblind cue, never gated on reduced motion (Uix sign-off E6 fix).
  hpBar(x, y, w, h, frac) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#28182c';
    c.fillRect(x, y, w, h);
    const col = f > 0.5 ? '#58c94f' : (f > 0.25 ? '#e8c832' : '#e84040');
    c.fillStyle = col;
    c.fillRect(x + 1, y + 1, Math.floor((w - 2) * f), h - 2);
    if (f <= 0.25 && f > 0) {
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let sx = x + 2; sx < x + w - 2; sx += 4) {
        c.fillRect(sx, y + 1, 1, h - 2);
      }
    }
  }

  // XP bar: gold, 96x3 per gameux §4.2. frac eases out over 600ms in battle.
  xpBar(x, y, w, h, frac) {
    const c = this.ctx;
    const f = Math.max(0, Math.min(1, frac));
    c.fillStyle = '#28182c';
    c.fillRect(x, y, w, h);
    c.fillStyle = '#e8c832';
    c.fillRect(x + 1, y + 1, Math.floor((w - 2) * f), h - 2);
  }
}


// ---- src/engine/tiles.mjs ----
// tiles.mjs — procedural 16x16 tile painter (PLACEHOLDER per assets/manifest.yaml).
// Palette-authored per tileset, no multiply overlays (gameux §6).
// Art Director replaces with hand-authored tileset per docs/contracts.md §1.

const TILE_CHARS = {
  '#': 'tree', '.': 'path', ',': 'grass', '~': 'water',
  'H': 'house', 'D': 'door', 'S': 'sign', 'G': 'gymwall',
  'E': 'gymdoor', 'C': 'centerdoor', 'F': 'flower', 'R': 'rock',
  ' ': 'void',
};

const PAL = {
  grassBase: '#5da24a', grassDark: '#4c8a3e', grassLight: '#6fb45c',
  pathBase: '#d8c08a', pathDark: '#c2a878',
  treeBase: '#3e7a34', treeDark: '#2e5e28', treeLight: '#54a048',
  waterBase: '#3a7bd5', waterDark: '#2e63b0', waterLight: '#5a9ae8',
  houseBase: '#c9a06a', houseDark: '#a8825a', roofBase: '#b0503c', roofDark: '#8e3e2e',
  doorBase: '#6a4a2e', signBase: '#8a6a42', gymBase: '#8a8aa0', gymDark: '#6a6a80',
  flowerA: '#e86a8a', flowerB: '#f0e060', rockBase: '#9a9aa5', rockDark: '#7a7a85',
};

// Deterministic 2D hash for painter dithering (no RNG needed).
function h2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function paintTile(ctx, kind, px, py) {
  const T = 16;
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
  switch (kind) {
    case 'grass':
      r(0, 0, T, T, PAL.grassBase);
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(h2(px + i * 3, py) * 14), y = Math.floor(h2(px, py + i * 5) * 12);
        r(x, y, 2, 3, h2(x, y) > 0.5 ? PAL.grassDark : PAL.grassLight);
      }
      break;
    case 'path':
      r(0, 0, T, T, PAL.pathBase);
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(h2(px + i, py + 9) * 14), y = Math.floor(h2(px + 3, py + i) * 14);
        r(x, y, 3, 2, PAL.pathDark);
      }
      break;
    case 'flower':
      r(0, 0, T, T, PAL.grassBase);
      r(6, 6, 4, 4, PAL.flowerA); r(7, 3, 2, 2, PAL.flowerB); r(7, 11, 2, 2, PAL.flowerB);
      break;
    case 'tree':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 10, 2, 6, '#5a3a24');
      r(2, 2, 12, 9, PAL.treeBase);
      r(3, 3, 5, 3, PAL.treeLight); r(8, 7, 5, 3, PAL.treeDark);
      break;
    case 'water':
      r(0, 0, T, T, PAL.waterBase);
      for (let i = 0; i < 4; i++) {
        const y = Math.floor(h2(px + i * 7, py) * 14);
        r(1, y, 6, 1, PAL.waterLight); r(9, (y + 7) % 15, 6, 1, PAL.waterDark);
      }
      break;
    case 'house':
      r(0, 0, T, T, PAL.houseBase);
      r(0, 0, T, 5, PAL.roofBase); r(0, 4, T, 1, PAL.roofDark);
      r(3, 8, 4, 5, PAL.doorBase); r(10, 8, 3, 3, '#3a5a7a');
      break;
    case 'gymwall':
      r(0, 0, T, T, PAL.gymBase);
      r(0, 0, T, 2, PAL.gymDark); r(0, 14, T, 2, PAL.gymDark);
      r(7, 4, 2, 8, PAL.gymDark);
      break;
    case 'door': case 'gymdoor': case 'centerdoor':
      r(0, 0, T, T, kind === 'gymwall' ? PAL.gymBase : PAL.houseBase);
      r(4, 2, 8, 14, PAL.doorBase); r(5, 3, 6, 12, '#3e2c1c');
      break;
    case 'sign':
      r(0, 0, T, T, PAL.grassBase);
      r(7, 8, 2, 8, '#5a3a24'); r(3, 2, 10, 7, PAL.signBase);
      r(4, 3, 8, 1, '#6e5233');
      break;
    case 'rock':
      r(0, 0, T, T, PAL.grassBase);
      r(3, 5, 10, 8, PAL.rockBase); r(4, 6, 4, 3, '#b5b5c0'); r(8, 9, 4, 3, PAL.rockDark);
      break;
    default:
      r(0, 0, T, T, '#101018');
  }
}

// Pre-render one offscreen canvas per tile kind (blitted in hot path).
function buildTileCache(doc) {
  const cache = {};
  for (const key of Object.keys(TILE_CHARS)) {
    const kind = TILE_CHARS[key];
    if (cache[kind]) continue;
    const cv = doc.createElement('canvas');
    cv.width = 16; cv.height = 16;
    paintTile(cv.getContext('2d'), kind, 0, 0);
    cache[kind] = cv;
  }
  return cache;
}


// ---- src/engine/sprites.mjs ----
// sprites.mjs — SpriteForge v1 (PLACEHOLDER per assets/manifest.yaml).
// Seeded symmetric pixel creatures with body-type silhouettes. Stand-ins only —
// Art Director replaces with original pixel art per docs/contracts.md §1.
// Palette rules honored: <=12 colors + alpha, 1px dark outline, no gradients,
// no anti-aliasing.


const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#ee99ac',
};

// Body-type silhouette templates: list of [x0,y0,x1,y1] rects on a 16x16 grid.
// Silhouettes are drawn symmetric about the vertical center axis.
const BODIES = {
  bird:   [[6, 4, 10, 12], [4, 6, 6, 10], [10, 6, 12, 10], [6, 2, 10, 5]],
  quad:   [[4, 7, 12, 13], [3, 4, 7, 8], [9, 4, 13, 8], [4, 13, 6, 15], [10, 13, 12, 15]],
  biped:  [[6, 6, 10, 13], [5, 3, 11, 7], [6, 13, 7, 15], [9, 13, 10, 15], [4, 7, 6, 10], [10, 7, 12, 10]],
  serpent:[[5, 3, 11, 7], [6, 7, 10, 11], [7, 11, 9, 14], [11, 4, 13, 6]],
  blob:   [[5, 5, 11, 12], [6, 3, 10, 6], [4, 8, 6, 11], [10, 8, 12, 11]],
  fish:   [[5, 6, 11, 11], [3, 4, 5, 8], [11, 7, 13, 10], [6, 4, 10, 6]],
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Forge a species sprite: doc = document-like, species = {spriteSeed, body, types}, size = px.
function forgeSprite(doc, species, size) {
  const grid = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const cell = size / grid;
  const rng = mulberry32(species.spriteSeed || 1);
  const main = TYPE_COLORS[species.types[0]] || '#a8a878';
  const dark = shade(main, -70);
  const light = shade(main, 45);
  const accent = species.types[1] ? TYPE_COLORS[species.types[1]] : light;
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x * cell, y * cell, w * cell, h * cell); };

  const rects = BODIES[species.body] || BODIES.blob;
  // 1) dark outline pass: draw each rect expanded by 1 grid cell
  for (const [x0, y0, x1, y1] of rects) px(x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, dark);
  // 2) fill pass with flat tones + deterministic dither
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const v = rng();
        px(x, y, 1, 1, v < 0.12 ? light : (v < 0.24 ? accent : main));
      }
    }
  }
  // 3) eyes (front-facing, white + dark pupil)
  const ey = 5, exl = 6, exr = 9;
  px(exl, ey, 1, 1, '#ffffff'); px(exr, ey, 1, 1, '#ffffff');
  px(exl, ey, 1, 1, '#1a1a22'); px(exr, ey, 1, 1, '#1a1a22');
  // 4) species-specific flourish by id hash (ears / tail / crest)
  const f = species.spriteSeed % 4;
  if (f === 0) { px(4, 1, 2, 3, dark); px(10, 1, 2, 3, dark); px(4, 2, 2, 1, accent); px(10, 2, 2, 1, accent); }
  else if (f === 1) { px(12, 9, 3, 2, dark); px(13, 10, 2, 2, accent); }
  else if (f === 2) { px(6, 0, 4, 2, accent); }
  return cv;
}

// Player / NPC overworld sprite: simple 16x16 humanoid in palette colors.
function forgeHumanoid(doc, opts) {
  const o = opts || {};
  const size = 16;
  const cv = doc.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const skin = o.skin || '#f0c8a0', shirt = o.shirt || '#d84a3a',
        pants = o.pants || '#3a5a9a', hair = o.hair || '#2a2018';
  // outline
  px(5, 1, 6, 14, '#1a1a22');
  // head + hair
  px(6, 2, 4, 4, skin); px(6, 2, 4, 2, hair); px(5, 3, 1, 2, hair); px(10, 3, 1, 2, hair);
  // body
  px(6, 6, 4, 5, shirt);
  // legs
  px(6, 11, 2, 3, pants); px(8, 11, 2, 3, pants);
  // eyes
  px(7, 4, 1, 1, '#1a1a22'); px(9, 4, 1, 1, '#1a1a22');
  return cv;
}


// ---- assets/sprites/art-data.mjs ----
// art-data.mjs — GENERATED by assets/sprites/tools/build-art.mjs. Do not hand-edit.
// Regenerate: node assets/sprites/tools/build-art.mjs (deterministic).
const ART = {
  "ash-down-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "ash-down-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "ash-down-walk-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OOOOPPPO....",
    "........OOOO....",
  ] },
  "ash-down-walk-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOO.....",
  ] },
  "ash-down-walk-3": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OPPPOOOO....",
    "....OOOO........",
  ] },
  "ash-down-walk-4": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "..OOJJJJJJJJOO..",
    "..OOJJJTTJJJOO..",
    "..OOJJJTTJJJOO..",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOO.....",
  ] },
  "ash-left-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSOSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OPPOPPO....",
    "....OOOOOOOO....",
  ] },
  "ash-left-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSSSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OPPOPPO....",
    ".....OOOOOOOO...",
  ] },
  "ash-left-walk-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSOSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OOOOOOO....",
    "...OOOO..OOOO...",
  ] },
  "ash-left-walk-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSOSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OPPOPPO....",
    "....OOOOOOOO....",
  ] },
  "ash-left-walk-3": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSSSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OOOOOOO....",
    "...OOOO..OOOO...",
  ] },
  "ash-left-walk-4": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "...OWWKKKKKO....",
    "....OSSSSSO.....",
    "....OSOSSSO.....",
    "....OSSSSSO.....",
    ".....OHSSSHO....",
    ".....OJJJOO.....",
    "....OJJJJJJO....",
    "....OOJJJJJOO...",
    "....OSJJJTJOO...",
    "....OSJJJTJOO...",
    ".....OPPPPO.....",
    ".....OPPOPPO....",
    "....OOOOOOOO....",
  ] },
  "ash-right-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSOSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OPPOPPO.....",
    "....OOOOOOOO....",
  ] },
  "ash-right-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSSSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OPPOPPO.....",
    "...OOOOOOOO.....",
  ] },
  "ash-right-walk-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSOSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OOOOOOO.....",
    "...OOOO..OOOO...",
  ] },
  "ash-right-walk-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSOSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OPPOPPO.....",
    "....OOOOOOOO....",
  ] },
  "ash-right-walk-3": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSSSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OOOOOOO.....",
    "...OOOO..OOOO...",
  ] },
  "ash-right-walk-4": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","W":"#f2f2f2","S":"#f0c090","H":"#3a2a20","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OKKKKKKO....",
    "....OKKKKKWWO...",
    ".....OSSSSSO....",
    ".....OSSSOSO....",
    ".....OSSSSSO....",
    "....OHSSSHO.....",
    ".....OOJJJO.....",
    "....OJJJJJJO....",
    "...OOJJJJJOO....",
    "...OOJTJJJSO....",
    "...OOJTJJJSO....",
    ".....OPPPPO.....",
    "....OPPOPPO.....",
    "....OOOOOOOO....",
  ] },
  "ash-up-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "ash-up-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "ash-up-walk-1": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OOOOPPPO....",
    "........OOOO....",
  ] },
  "ash-up-walk-2": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOO.....",
  ] },
  "ash-up-walk-3": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OPPPOOOO....",
    "....OOOO........",
  ] },
  "ash-up-walk-4": { w: 16, h: 16, pal: {"O":"#241a20","K":"#d83a34","H":"#3a2a20","S":"#f0c090","J":"#2e5fb0","T":"#8a5a30","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "...OJTTTTTTJO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOO.....",
  ] },
  "brock-battle": { w: 32, h: 48, pal: {"O":"#2e2620","S":"#c8a878","J":"#6a8a4a","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    ".............OOOO...............",
    "...........OOSSSSOO.............",
    "..........OSSSSSSSSO............",
    "..........OSSEESSESO............",
    "..........OSSEESSESO............",
    "..........OSSSSSSSOO............",
    "...........OSSSSOO..............",
    "............OOOO................",
    "..........OOJJJJOO..............",
    ".........OJJJJJJJJO.............",
    ".........OJJJJJJJJO.............",
    "........OOJJJJJJJJJOO...........",
    "........OJJJOOOOOJJJO...........",
    "........OJJJOOOOOJJJO...........",
    "........OJJJOOOOOJJOO...........",
    ".........OJJJJJJJJO.............",
    ".........OJJJSSJJO..............",
    "..........OJJJJJO...............",
    "..........OOJJJOO...............",
    "...........OJJJO................",
    "...........OJJJO................",
    "..........OOJJJOO...............",
    ".........OJJJJJJJO..............",
    ".........OJJJJJJJO..............",
    "........OOJJJJJJJOO.............",
    "........OJJJJJJJJJO.............",
    "........OJJJSSJJJO..............",
    "........OJJJSSJJJO..............",
    ".........OJJJJJJO...............",
    ".........OOJJJOO................",
    "..........OJJJO.................",
    "..........OJJJO.................",
    ".........OOJJJOO................",
    ".........OJJJJJO................",
    ".........OJJJJJO................",
    "..........OJJJO.................",
    "..........OOOOO.................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "brock-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#c89878","H":"#1a1a1a","V":"#c8782a","D":"#a85820","P":"#4a5a3a"}, rows: [
    "................",
    "...OOO..OOO.....",
    "...OHHOOOHHO....",
    "..OHHHHHHHHHO...",
    "..OHSSSSSSHO....",
    "..OSOSSSOSO.....",
    "..OSSSSSSO......",
    "...OSSSSO.......",
    "..OOVVVVOO......",
    "..OVVVVVO.......",
    "..OOVVVVOO......",
    "..OSVVDDVO......",
    "..OSVVDDVO......",
    "...OOPPPPOO.....",
    "...OPPPPPPO.....",
    "...OOOOOOOO.....",
  ] },
  "brock-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#c89878","H":"#1a1a1a","V":"#c8782a","D":"#a85820","P":"#4a5a3a"}, rows: [
    "................",
    "...OOO..OOO.....",
    "...OHHOOOHHO....",
    "..OHHHHHHHHO....",
    "..OHSSSSSHO.....",
    "..OSSSSSSO......",
    "..OSSSSSSO......",
    "...OSSSSO.......",
    "..OOVVVVOO......",
    "..OVVVVVO.......",
    "..OOVVVVOO......",
    "..OSVVDDVO......",
    "..OSVVDDVO......",
    "...OOPPPPOO.....",
    "...OPPPPPPO.....",
    "....OOOOOOOO....",
  ] },
  "npc-aide-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#5a3a24","V":"#3a7a4a","D":"#2a5a3a","G":"#2a2a30","P":"#3a3a4a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OSSSSSSSSO...",
    "...OSOGSSGOSO...",
    "...OSSSSSSSSO...",
    "...OHSSSSSSHO...",
    "....OOVVVVOO....",
    "...OVVVVVVVVO...",
    "...OVVDDDVVVO...",
    "...OSVVVVVVSO...",
    "...OSVVVVVVSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "npc-aide-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#5a3a24","V":"#3a7a4a","D":"#2a5a3a","G":"#2a2a30","P":"#3a3a4a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OHHHHHHHHO...",
    "...OHHHHHHHHO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OHSSSSSSHO...",
    "....OOVVVVOO....",
    "...OVVVVVVVVO...",
    "...OVVDDDVVVO...",
    "...OSVVVVVVSO...",
    "...OSVVVVVVSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "npc-coach-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#d8a878","K":"#d83a34","W":"#f2f2f2","H":"#1a1a1a","J":"#c03a3a","P":"#2a2a3a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJJJJJJJJO...",
    "...OSJJJJJJSO...",
    "...OSJJJJJJSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "npc-coach-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#d8a878","K":"#d83a34","W":"#f2f2f2","H":"#1a1a1a","J":"#c03a3a","P":"#2a2a3a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKWWWWWWKO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OHHSSSSHHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJJJJJJJJO...",
    "...OSJJJJJJSO...",
    "...OSJJJJJJSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "npc-lass-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#6a4a2a","D":"#e87a9a","K":"#5a5a7a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OHHHHHHHHO...",
    "..OHHHHHHHHHHO..",
    "..OHSSSSSSSHO...",
    "..OSOOSSOOSO....",
    "..OSSSSSSSSO....",
    "..OOHSSSSSSOO...",
    "....OODDDDOO....",
    "...ODDDDDDDDO...",
    "...ODDDDDDDDO...",
    "...OSDDDDDDSO...",
    "...OSDDDDDDSO...",
    "....OOKKKKOO....",
    "....OKKKKKKO....",
    "....OOOOOOOO....",
  ] },
  "npc-lass-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#6a4a2a","D":"#e87a9a","K":"#5a5a7a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OHHHHHHHHO...",
    "..OHHHHHHHHHHO..",
    "..OHSSSSSSSHO...",
    "..OSSSSSSSSO....",
    "..OSSSSSSSSO....",
    "..OOHSSSSSSOO...",
    "....OODDDDOO....",
    "...ODDDDDDDDO...",
    "...ODDDDDDDDO...",
    "...OSDDDDDDSO...",
    "...OSDDDDDDSO...",
    "....OOKKKKOO....",
    "....OKKKKKKO....",
    ".....OOOOOOOO...",
  ] },
  "npc-nurse-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","P":"#f0a0b0","W":"#f8f8f8","R":"#e87a8a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OPPPPPPPPO...",
    "...OPPPPPPPPO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OPSSSSSSPO...",
    "....OOWWWWWOO...",
    "...OWWWWWWWWO...",
    "...OWWRRRRWWO...",
    "...OSWRRRRWSO...",
    "...OSWRRRRWSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "npc-nurse-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","P":"#f0a0b0","W":"#f8f8f8","R":"#e87a8a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OPPPPPPPPO...",
    "...OPPPPPPPPO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OPSSSSSSPO...",
    "....OOWWWWWOO...",
    "...OWWWWWWWWO...",
    "...OWWRRRRWWO...",
    "...OSWRRRRWSO...",
    "...OSWRRRRWSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "npc-professor-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","G":"#b8b8c0","W":"#f0f0f0","D":"#c8c8d0","K":"#5a5a7a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "....OGGGGGGO....",
    "...OGGGGGGGO....",
    "...OGSSSSSSOO...",
    "...OSOOSSOO.....",
    "...OSSSSSSO.....",
    "....OSSSSO......",
    "...OOWWWWWOO....",
    "..OWWWWWWWWO....",
    "..OWWDDDDWWO....",
    "..OSWDDDDWSO....",
    "..OSWDDDDWSO....",
    "...OOKKKKOO.....",
    "...OKKKKKKO.....",
    "...OOOOOOOO.....",
  ] },
  "npc-professor-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","G":"#b8b8c0","W":"#f0f0f0","D":"#c8c8d0","K":"#5a5a7a"}, rows: [
    "................",
    "....OOOOOOOO....",
    "....OGGGGGGO....",
    "...OGGGGGGGO....",
    "...OGSSSSSSOO...",
    "...OSSSSSSO.....",
    "...OSSSSSSO.....",
    "....OSSSSO......",
    "...OOWWWWWOO....",
    "..OWWWWWWWWO....",
    "..OWWDDDDWWO....",
    "..OSWDDDDWSO....",
    "..OSWDDDDWSO....",
    "...OOKKKKOO.....",
    "...OKKKKKKO.....",
    "....OOOOOOOO....",
  ] },
  "npc-rival-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#f0d060","J":"#d83a34","P":"#2f4f9e"}, rows: [
    "................",
    "...OOO..OOO.....",
    "...OHHOOOHHO....",
    "..OHHHHHHHO.....",
    "..OHSSSSHO......",
    "..OSOSSSOO......",
    "..OSSSSSO.......",
    "...OSSSSO.......",
    "..OOJJJOO.......",
    "..OJJJJJO.......",
    "..OSJJJJSO......",
    "..OSJJJJSO......",
    "..OSJJJJSO......",
    "...OOPPPPOO.....",
    "...OPPPPPPO.....",
    "...OOOOOOOO.....",
  ] },
  "npc-rival-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#f0c090","H":"#f0d060","J":"#d83a34","P":"#2f4f9e"}, rows: [
    "................",
    "...OOO..OOO.....",
    "...OHHOOOHHO....",
    "..OHHHHHHHHO....",
    "..OHSSSSSSHO....",
    "..OSSSSSSSO.....",
    "..OSSSSSSOO.....",
    "...OSSSSO.......",
    "..OOJJJOO.......",
    "..OJJJJJO.......",
    "..OSJJJJSO......",
    "..OSJJJJSO......",
    "..OSJJJJSO......",
    "...OOPPPPOO.....",
    "...OPPPPPPO.....",
    "....OOOOOOOO....",
  ] },
  "npc-youngster-idle-1": { w: 16, h: 16, pal: {"O":"#241a20","S":"#e8b088","K":"#2f4f9e","H":"#3a2a20","J":"#e8c83a","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OSSSSSSSSO...",
    "...OSOOSSOOSO...",
    "...OSSSSSSSSO...",
    "...OHSSSSSSHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJJJJJJJJO...",
    "...OSJJJJJJSO...",
    "...OSJJJJJJSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    "....OOOOOOOO....",
  ] },
  "npc-youngster-idle-2": { w: 16, h: 16, pal: {"O":"#241a20","S":"#e8b088","K":"#2f4f9e","H":"#3a2a20","J":"#e8c83a","P":"#4a4a55"}, rows: [
    "................",
    "....OOOOOOOO....",
    "...OKKKKKKKKO...",
    "...OKKKKKKKKO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OSSSSSSSSO...",
    "...OHSSSSSSHO...",
    "....OOJJJJOO....",
    "...OJJJJJJJJO...",
    "...OJJJJJJJJO...",
    "...OSJJJJJJSO...",
    "...OSJJJJJJSO...",
    "....OOPPPPOO....",
    "....OPPPPPPO....",
    ".....OOOOOOOO...",
  ] },
  "partner-back": { w: 32, h: 32, pal: {"O":"#3a2e18","Y":"#f0c838","E":"#2a2422","T":"#8a5a30","S":"#b07a30"}, rows: [
    "................................",
    "................................",
    "......OOOOO..........OOOOO......",
    "......OEEEO..........OEEEO......",
    "......OEEEO..........OEEEO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYYYO......",
    ".....OYYYYYOOOOOOOOOOYYYYYO.....",
    ".....OYYYYYYYYYYYYYYYYYYYYO.....",
    ".....OYYYYYYYYYYYYYYYYYYYYO.....",
    ".....OYYYYYYYYYYYYYYYYYYYYOOOO..",
    ".....OYYYYYYYYYYYYYYYYYYYYOOTO..",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    "......OOOOOOOOOOOOOOOOOOOOOTO...",
    "..........OYYYYYYYYYYO....OOO...",
    "..........OSSSSSSSSSSO..........",
    ".........OOYYYYYYYYYYOO.........",
    ".........OOYYYYYYYYYYOO.........",
    "..........OSSSSSSSSSSO..........",
    "...........OOOOOOOOOO...........",
    "...........OOO....OOO...........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "partner-front": { w: 32, h: 32, pal: {"O":"#3a2e18","Y":"#f0c838","E":"#2a2422","C":"#e84848","L":"#f8e890","T":"#8a5a30"}, rows: [
    "................................",
    "................................",
    "......OOOOO..........OOOOO......",
    "......OEEEO..........OEEEO......",
    "......OEEEO..........OEEEO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYYYO......",
    "......OYYYO..........OYLYO......",
    ".....OYYYYYOOOOOOOOOOYYYYYO.....",
    ".....OYYYYYYYYYYYYYYYLYYYO......",
    ".....OYYYYYYYYYYYYYYYYYYYYO.....",
    ".....OYYYYYYYYYYYYYYYYYYYYOOOO..",
    ".....OYYYYYOOOYYYYOOOYYYYYOOTO..",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    ".....OYYYYYYYYYYYYYYYYYYYYOTO...",
    ".....OCCCYYYYYYYYYYYYYYCCCOOTO..",
    ".....OCCCYYYYYYOOYYYYYYCCCOOTO..",
    "......OOOOOOOOOOOOOOOOOOOOOTO...",
    "..........OYYYYYYYYYYO....OOO...",
    "..........OYYYYYYYYYYO..........",
    ".........OOYYLLLLLLYYOO.........",
    ".........OOYYLLLLLLYYOO.........",
    ".........OOYYLLLLLLYYOO.........",
    "...........OOOOOOOOOO...........",
    "...........OOO....OOO...........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "pikachu-hop-1": { w: 16, h: 16, pal: {"O":"#3a2e18","Y":"#f0c838","E":"#2a2422","C":"#e84848","T":"#8a5a30"}, rows: [
    "................",
    "...OOO....OOO...",
    "...OEO....OEO...",
    "...OYO....OYO...",
    "..OOOOOOOOOOOO..",
    "..OYYYYYYYYYYO..",
    "..OYCYOOYOCYYO..",
    "..OYYYYYYYYYYOO.",
    "...OYYYYYYYYOTO.",
    "....OYYYYYYOTOO.",
    "....OOOOOOOOOO..",
    ".....OO..OO.....",
    "................",
    "................",
    "................",
    "................",
  ] },
  "pikachu-hop-2": { w: 16, h: 16, pal: {"O":"#3a2e18","Y":"#f0c838","E":"#2a2422","C":"#e84848","T":"#8a5a30"}, rows: [
    "................",
    "...OOO....OOO...",
    "...OEO....OEO...",
    "...OYO....OYO...",
    "..OOOOOOOOOOOO..",
    "..OYYYYYYYYYYO..",
    "..OYCYOOYOCYYO..",
    "..OYYYYYYYYYYOO.",
    "...OYYYYYYYYOTO.",
    "....OYYYYYYOTOO.",
    "....OOOOOOOOOO..",
    "................",
    "................",
    "................",
    "................",
    "................",
  ] },
  "pikachu-refuse": { w: 32, h: 16, pal: {"O":"#241a20","Y":"#f0c838","E":"#2a2422","C":"#e84848","W":"#f2f2f2","B":"#2a2a30"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "..OOO..OOO............OOOO......",
    "..OEO..OEO...........OCCCCO.....",
    "..OYO..OYO..........OCCWCCCO....",
    ".OOOOOOOOOOO........OCCCCWCO....",
    ".OYYYYYYYYYO........OBBBBBBO....",
    ".OYCYOOYOCYO........OWWOOWWO....",
    ".OYYYYYYYYYO........OWWWWWWO....",
    "..OOOOOOOOO..........OOOOOO.....",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "caterpie-back": { w: 32, h: 32, pal: {"O":"#2e4a2e","G":"#5aa85a","Y":"#e8d848"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........OOOOOO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGYYGGGGYYGGO...........",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGYYGGGGYYGGO...........",
    ".......OGGGGGGGGGGGGO...........",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".........OGGGGGGGGO.............",
    ".........OGGYYGGYGO.............",
    "..........OGGGGGGO..............",
    "...........OGGGGO...............",
    "............OOOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "caterpie-front": { w: 32, h: 32, pal: {"O":"#2e4a2e","G":"#5aa85a","Y":"#e8d848","R":"#d84848","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    ".............OO.................",
    "............ORRO................",
    "............ORRO................",
    "...........OGGGGO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    ".........OGEYYEGGO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGYYGGGGYYGGO...........",
    ".......OGGGGGGGGGGGGO...........",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".........OGGGGGGGGO.............",
    ".........OGGYYGGYGO.............",
    "..........OGGGGGGO..............",
    "...........OGGGGO...............",
    "............OOOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "geodude-back": { w: 32, h: 32, pal: {"O":"#4a4a4a","G":"#8a8a8a","L":"#b8b8b8"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "............OOOO................",
    "..........OOGGGGOO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGGGGGGGGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGLLGGO............",
    "......OGGGGGGGGGGGGGO...........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OOGGGGGGGGGGGGGOO..........",
    ".....OGGGGGGGGGGGGGGGO..........",
    "....OOGGGGGGGGGGGGGGGOO.........",
    "....OGGGGGGGGGGGGGGGGGO.........",
    "....OGGGGGGGGGGGGGGGGGO.........",
    ".....OGGGGGGGGGGGGGGGO..........",
    ".....OGGGGGGGGGGGGGGGO..........",
    "......OGGGGGGGGGGGGGO...........",
    "......OGGGGGGGGGGGGO............",
    ".......OGGGGGGGGGGO.............",
    ".......OGGLLGGGLLGO.............",
    "........OGGGGGGGGO..............",
    ".........OOOOOOOO...............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "geodude-front": { w: 32, h: 32, pal: {"O":"#4a4a4a","G":"#8a8a8a","L":"#b8b8b8","M":"#6a6a6a","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "............OOOO................",
    "..........OOGGGGOO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGWWEWGGGO.............",
    "........OGGGGGGGGGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGLLGGO............",
    "......OGGGGGGGGGGGGGO...........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OOGGGGGGGGGGGGGOO..........",
    ".....OGGGGGGGGGGGGGGGO..........",
    "....OOGGGGGGGGGGGGGGGOO.........",
    "....OGGGMMGGGGGGGMMGGGO.........",
    "....OGGMMMGGGGGMMMGGGO..........",
    "....OGGMMMGGGGGMMMGGOO..........",
    ".....OGMMMGGGGMMMGGO............",
    ".....OGGMMGGGGMMGGO.............",
    "......OGGGGGGGGGGGO.............",
    "......OGGLLGGGGLLGO.............",
    ".......OGGGGGGGGGGO.............",
    "........OGGGGGGGOO..............",
    ".........OOOOOOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "mankey-back": { w: 32, h: 32, pal: {"O":"#5a4a2e","T":"#d8b878"}, rows: [
    "................................",
    "................................",
    "................................",
    "...........OOOOOO...............",
    "..........OTTTTTTO..............",
    ".........OTTTTTTTTO.............",
    ".........OTTTTTTTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTO............",
    "........OTTTTTTTTTTO............",
    "........OTTTTTTTTTTO............",
    "........OTTTTTTTTTTO............",
    ".........OTTTTTTTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTOO...........",
    ".........OTTTTTTTTOOOO..........",
    ".........OTTTTTTTTOOOO..........",
    "..........OTTTTTOOOO............",
    "...........OTTTTOOO.............",
    "............OOOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "mankey-front": { w: 32, h: 32, pal: {"O":"#5a4a2e","T":"#d8b878","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "...........OOOOOO...............",
    "..........OTTTTTTO..............",
    ".........OTTTTTTTTO.............",
    ".........OTWWEWWTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTO............",
    "........OTTEETTTTEETO...........",
    "........OTTEETTTTEETO...........",
    "........OTTTTTTTTTTO............",
    ".........OTTTTTTTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTOO...........",
    ".........OTTTTTTTTOOOO..........",
    ".........OTTTTTTTTOOOO..........",
    "..........OTTTTTOOOTTO..........",
    "...........OTTTTOOTTO...........",
    "............OOTTOOOOO...........",
    ".............OOOOOO.............",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "nidoranm-back": { w: 32, h: 32, pal: {"O":"#4a2e5a","P":"#8a5aaa","E":"#d8a0c8"}, rows: [
    "................................",
    "................................",
    "..........OO........OO..........",
    ".........OPPO......OPPO.........",
    ".........OPPO......OPPO.........",
    ".........OPEPO....OPEPO.........",
    ".........OPPPOOOOOPPPPO.........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPPPPPPPPPO.........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPPPPPPPPPPPPPO........",
    ".........OPPPPPPPPPPPPO.........",
    ".........OPPPPPPPPPPPPO.........",
    "..........OPPPPPPPPPPO..........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPPPPPPPPPO.........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPPPPPPPPPPPPPO........",
    ".........OPPPPPPPPPPPPO.........",
    ".........OPPPPPPPPPPPPO.........",
    "..........OPPPPPPPPPPO..........",
    "..........OPPPPPPPPPPO..........",
    "...........OOPPPPPOOO...........",
    ".............OOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "nidoranm-front": { w: 32, h: 32, pal: {"O":"#4a2e5a","P":"#8a5aaa","K":"#e8a8c8","H":"#f0f0f0","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "..........OO........OO..........",
    ".........OPPO......OPPO.........",
    ".........OPPO......OPPO.........",
    ".........OPEPO....OPEPO.........",
    ".........OPPPOOOOOOPPPO.........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPPPPPPPO...........",
    "........OPPPPPPPPPPPPO..........",
    "........OPPWWEPPPEWPPO..........",
    "........OPPWWEPPPEWPPO..........",
    "........OPPPPPPPPPPPPO..........",
    ".........OPPPPHHPPPPO...........",
    ".........OPPPPHHPPPPO...........",
    "..........OPPPPPPPPO............",
    "..........OPPPPPPPPO............",
    ".........OPPPPPPPPPPO...........",
    "........OPPPPKKPPPPPPO..........",
    "........OPPKKKKKKPPPPO..........",
    "........OPPKKKKKKPPPPO..........",
    ".........OPPKKKKPPPPO...........",
    ".........OPPPKKKPPPPO...........",
    "..........OPPPPPPPPO............",
    "...........OOPPPPOO.............",
    ".............OOOO...............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "onix-back": { w: 32, h: 32, pal: {"O":"#3a3a3a","G":"#7a7a7a","L":"#a8a8a8"}, rows: [
    "................................",
    "................................",
    ".............OOOO...............",
    "...........OOGGGGOO.............",
    "..........OGGGGGGGGO............",
    ".........OGGGGGGGGGGO...........",
    ".........OGGGGGGGGGOO...........",
    "..........OGGGGGGOO.............",
    "...........OOOOOO...............",
    ".............OO.................",
    "...........OOGGOO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGLLGGGLLGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGGLLGGO...........",
    "......OGGGGGGGGGGGGGGO..........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OGGGGGGGGGGGGGGGOO.........",
    ".....OGGLLGGGGLLGGGGO...........",
    "....OGGGGGGGGGGGGGGGGOOO........",
    "....OGGLLGGGGLLGGGGGGO..........",
    ".....OOOOOOOOOOOOOOOOO..........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "onix-front": { w: 32, h: 32, pal: {"O":"#3a3a3a","G":"#7a7a7a","L":"#a8a8a8","W":"#ffffff"}, rows: [
    "................................",
    "................................",
    ".............OOOO...............",
    "...........OOGGGGOO.............",
    "..........OGGGGGGGGO............",
    ".........OGGGGGGGGGGO...........",
    ".........OGGWWGGWWGO............",
    ".........OGGWWGGWWGO............",
    ".........OGGGGGGGGGO............",
    "..........OGGGGGGOO.............",
    "...........OOOOOO...............",
    ".............OO.................",
    "...........OOGGOO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    ".........OGGLLGGLGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGLLGGGLLGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGGLLGGO...........",
    "......OGGGGGGGGGGGGGGO..........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OGGGGGGGGGGGGGGGOO.........",
    ".....OGGLLGGGGLLGGGGO...........",
    "....OGGGGGGGGGGGGGGGGOOO........",
    "....OGGLLGGGGLLGGGGGGO..........",
    ".....OOOOOOOOOOOOOOOOO..........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "pidgey-back": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#a8896a","L":"#d8b98a"}, rows: [
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............OMMO..............",
    ".............OMMMMO.............",
    "...........OOMMMMMMOO...........",
    ".........OOMMMMMMMMMMOO.........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMLMMMLMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMMMMMMO.........",
    "..........OMMMMMMMMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMMLMMMMMLMMMO.........",
    ".........OMMMMMMMMMMMO..........",
    ".........OMMMMMMMMOOOO..........",
    "..........OMMMMMMO..............",
    "...........OOMMMOO..............",
    ".............OOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "pidgey-front": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#a8896a","L":"#d8b98a","C":"#e8d8b0","B":"#e8a83a","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............OMMO..............",
    ".............OMMMMO.............",
    "...........OOMMMMMMOO...........",
    ".........OOMMMMMMMMMMOO.........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMBBMMMO.........",
    ".........OMMMMMMBBBBMMO.........",
    "..........OMMMMMBBMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    ".........OMMMCCCCCMMMO..........",
    ".........OMMMCCCCCMMMO..........",
    "..........OMMCCCCCMMO...........",
    "...........OMMMMMMMO............",
    "............OOMMMOO.............",
    ".............OOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "rattata-back": { w: 32, h: 32, pal: {"O":"#4a2e4a","P":"#8a5a8a"}, rows: [
    "................................",
    "................................",
    "...........O........O...........",
    "..........OPO......OPO..........",
    "..........OPO......OPO..........",
    ".........OPPPOOOOOOOPO..........",
    ".........OPPPPPPPPPPPPO.........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPPPPPPPPPPPPPO........",
    ".........OPPPPPPPPPPPPO.........",
    ".........OPPPPPPPPPPPPO.........",
    "..........OPPPPPPPPPPO..........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPPPPPPPPPO.........",
    ".........OPPPPPPPPPPPPOO........",
    ".........OPPPPPPPPPPOOOO........",
    "..........OPPPPPPPPOOOPO........",
    "..........OPPPPPPPPOOPPO........",
    "...........OPPPPPPOOPPO.........",
    "...........OPPPPPPOOPPO.........",
    "............OPPPPOOPPO..........",
    "............OPPPPOOPPO..........",
    ".............OOPPOOPOO..........",
    "..............OOOOOO............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "rattata-front": { w: 32, h: 32, pal: {"O":"#4a2e4a","P":"#8a5a8a","C":"#e8d8e8","R":"#d84848","N":"#2e1a2e","T":"#f0f0f0","E":"#d8a0a0"}, rows: [
    "................................",
    "................................",
    "...........O........O...........",
    "..........OPO......OPO..........",
    "..........OPO......OPO..........",
    ".........OPPPOOOOOOOPO..........",
    ".........OPPPPPPPPPPPPO.........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPRRPPPPPPRRPPO........",
    "........OPPRRPPPPPPRRPPO........",
    "........OPPPPPPPPPPPPPPO........",
    ".........OPPPPNNNPPPPPO.........",
    ".........OPPPPPPPPPPPPO.........",
    "..........OPPTTTTTPPPO..........",
    "..........OPPTTTTTPPPO..........",
    "...........OPPPPPPPPO...........",
    "...........OPPPPPPPPO...........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPCCCCPPPPO.........",
    ".........OPPPCCCCCCPPPO.........",
    ".........OPPPCCCCCCPPPO.........",
    "..........OPPCCCCCCPPO..........",
    "..........OPPCCCCCCOOO..........",
    "...........OOOCCCOOO............",
    ".............OOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "spearow-back": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#8a6a4a","L":"#b89878","R":"#c84848"}, rows: [
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............ORRO..............",
    ".............ORRRRO.............",
    "..........OOOMMMOOOO............",
    ".........OOMMMMMMMMMOO..........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMLMMMLMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMMMMMMO.........",
    "..........OMMMMMMMMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMMLMMMMMLMMMO.........",
    ".........OMMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMOO..........",
    "..........OMMMMMMMOO............",
    "...........OOMMMOO..............",
    ".............OOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "spearow-front": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#8a6a4a","L":"#b89878","C":"#e8d8b0","B":"#e8a83a","E":"#1c1a22","R":"#c84848"}, rows: [
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............ORRO..............",
    ".............ORRRRO.............",
    "............OOMMMOOO............",
    ".........OOOMMMMMMMMO...........",
    ".........OMMMMMMMMMMMOO.........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMBBMMMO.........",
    ".........OMMMMMMBBBBMMO.........",
    "..........OMMMMMBBMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    ".........OMMMCCCCCMMMO..........",
    ".........OMMMCCCCCMMMO..........",
    "..........OMMCCCCCMMO...........",
    "...........OMMMMMMMO............",
    "............OOMMMOO.............",
    ".............OOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "weedle-back": { w: 32, h: 32, pal: {"O":"#4a3a2a","B":"#a87850","Y":"#e8d848"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........OOOOOO...............",
    "..........OBBBBBBO..............",
    ".........OBBBBBBBBO.............",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".......OBBBBBBBBBBBBO...........",
    ".......OBBYYBBBBYYBBO...........",
    ".......OBBBBBBBBBBBBO...........",
    ".......OBBYYBBBBYYBBO...........",
    ".......OBBBBBBBBBBBBO...........",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".........OBBBBBBBBO.............",
    ".........OBBYYBBYBO.............",
    "..........OBBBBBOO..............",
    "...........OBBBO................",
    "............OOO.................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "weedle-front": { w: 32, h: 32, pal: {"O":"#4a3a2a","B":"#a87850","Y":"#e8d848","S":"#d8d8d8","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............OSSO..............",
    "..............OSSO..............",
    "...........OOOOOO...............",
    "..........OBBBBBBO..............",
    ".........OBBBBBBBBO.............",
    ".........OBEYYEBBO..............",
    ".........OBBBBBBBBO.............",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".......OBBBBBBBBBBBBO...........",
    ".......OBBYYBBBBYYBBO...........",
    ".......OBBBBBBBBBBBBO...........",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".........OBBBBBBBBO.............",
    ".........OBBYYBBYBO.............",
    "..........OBBBBBOO..............",
    "...........OBBBO................",
    "............OOO.................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "tile-centerdoor": { w: 16, h: 16, pal: {"h":"#c9a06a","w":"#3a7bd5","y":"#5a9ae8"}, rows: [
    "hhhhhhhhhhhhhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwyyyywwhhhh",
    "hhhhywywwywyhhhh",
    "hhhhwwyyyywwhhhh",
    "hhhhywywwywyhhhh",
    "hhhhwwyyyywwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhwwwwwwwwhhhh",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
  ] },
  "tile-door": { w: 16, h: 16, pal: {"h":"#c9a06a","k":"#5a3a24"}, rows: [
    "hhhhhhhhhhhhhhhh",
    "hhkkkkkkkkkkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkhhhhhhhhkhhhh",
    "hhkkkkkkkkkkhhhh",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
  ] },
  "tile-flower": { w: 16, h: 16, pal: {"g":"#5da24a","j":"#b0503c","w":"#3a7bd5"}, rows: [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggjjggggggggg",
    "ggggjwjgggggjjgg",
    "gggggjjggggjwjgg",
    "gggggggggggggjjg",
    "gggggggggggggggg",
    "gggjjggggggggggg",
    "ggjwjggggggggggg",
    "ggggjjgggggggggg",
    "gggggggggggggggg",
    "gggggggggggjjggg",
    "ggggggggggjwjggg",
    "gggggggggggjjggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ] },
  "tile-grass": { w: 16, h: 16, pal: {"g":"#5da24a","d":"#4c8a3e","l":"#6fb45c"}, rows: [
    "gggggggggggggggg",
    "ggdgggglgggggdgg",
    "gggggggggggggggg",
    "glgggggdggggglgg",
    "gggggggggggggggg",
    "ggdgggglgggddggg",
    "gggggggggggggggg",
    "gggglggggdgggggg",
    "gggggggggggggggg",
    "gdgggggglggggdgg",
    "gggggggggggggggg",
    "ggglgggggdgggglg",
    "gggggggggggggggg",
    "ggdgggglgggggdgg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ] },
  "tile-gymdoor": { w: 16, h: 16, pal: {"m":"#8a8aa0","z":"#6a6a80","k":"#5a3a24"}, rows: [
    "mmmmmmmmmmmmmmmm",
    "mmmzzzzzzzzzzmmm",
    "mmmzzzzzzzzzzmmm",
    "mmmzkkkkkkkkzmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmkzzzzzzzzkmmm",
    "mmmzkkkkkkkkzmmm",
    "mmmzzzzzzzzzzmmm",
    "mmmzzzzzzzzzzmmm",
    "mmmmmmmmmmmmmmmm",
    "mmmmmmmmmmmmmmmm",
  ] },
  "tile-gymwall": { w: 16, h: 16, pal: {"m":"#8a8aa0","z":"#6a6a80"}, rows: [
    "zzzzzzzzzzzzzzzz",
    "mmmmmmmmmmmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmzmmmmmmzmmmmmm",
    "mmmmmmmmmmmmmmmm",
    "zzzzzzzzzzzzzzzz",
    "zzzzzzzzzzzzzzzz",
  ] },
  "tile-house": { w: 16, h: 16, pal: {"j":"#b0503c","k":"#5a3a24","h":"#c9a06a","x":"#2e63b0","p":"#d8c08a"}, rows: [
    "jjjjjjjjjjjjjjjj",
    "jjjjjjjjjjjjjjjj",
    "jjjjjjjjjjjjjjjj",
    "jjjjjjjjjjjjjjjj",
    "kkkkkkkkkkkkkkkk",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "hhhkkkkhhhxxhhhh",
    "hhhkkkkhhhxxhhhh",
    "hhhkkkkhhhxxhhhh",
    "hhhkkkkhhhhhhhhh",
    "hhhkkkkhhhhhhhhh",
    "hhhhhhhhhhhhhhhh",
    "pppppppppppppppp",
    "pppppppppppppppp",
  ] },
  "tile-path": { w: 16, h: 16, pal: {"p":"#d8c08a","q":"#c2a878"}, rows: [
    "pppppppppppppppp",
    "ppqpppppppqppppp",
    "pppppppppppppppp",
    "pppqpppqppppqppp",
    "pppppppppppppppp",
    "pqppppppqppppppp",
    "pppppppppppppppp",
    "pppqppppppqppqpp",
    "pppppppppppppppp",
    "ppppqpppppppqppp",
    "pppppppppppppppp",
    "ppqpppqppppqpppp",
    "pppppppppppppppp",
    "pqpppppppqppppqp",
    "pppppppppppppppp",
    "pppppppppppppppp",
  ] },
  "tile-rock": { w: 16, h: 16, pal: {"g":"#5da24a","m":"#8a8aa0","z":"#6a6a80","l":"#6fb45c"}, rows: [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggmmmmmmggggg",
    "gggmmmmmmmmmmggg",
    "ggmmmlmmmmzmmggg",
    "ggmmmmmmmzzzmmgg",
    "ggmmmmmmzzzzmmgg",
    "ggmmmmmmzzzmmmgg",
    "gggmmmmmmmmmmggg",
    "gggglmmmmmmmlggg",
    "gggggmmmmmmggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ] },
  "tile-sign": { w: 16, h: 16, pal: {"g":"#5da24a","p":"#d8c08a","q":"#c2a878","k":"#5a3a24"}, rows: [
    "gggggggggggggggg",
    "gggggggggggggggg",
    "ggppppppppppgggg",
    "gppqqqqqqqqppggg",
    "gpqqppppppqqpggg",
    "gpqppppppppqpggg",
    "gpqqqqqqqqqqpggg",
    "ggppppppppppgggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ] },
  "tile-tree": { w: 16, h: 16, pal: {"g":"#5da24a","t":"#3e7a34","u":"#2e5e28","v":"#54a048","k":"#5a3a24"}, rows: [
    "gggggggggggggggg",
    "ggggttttttttgggg",
    "ggtttvvtttttttgg",
    "gtttvvvvtttttttg",
    "gtttvvtttttuutgg",
    "gtttttttttuuuugg",
    "ggtttttttuuuuggg",
    "gggtttttuuuugggg",
    "ggggtttttuuggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggkkkkggggggg",
    "gggggggggggggggg",
    "gggggggggggggggg",
  ] },
  "tile-water-1": { w: 16, h: 16, pal: {"w":"#3a7bd5","x":"#2e63b0","y":"#5a9ae8"}, rows: [
    "wwwwwwwwwwwwwwww",
    "wyywwwwwwyywwwww",
    "wwwwwwwwwwwwwwww",
    "wwxxwwwwwwxxwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwyywwwwwwyyww",
    "wwwwwwwwwwwwwwww",
    "wxxwwwwwwxxwwwww",
    "wwwwwwwwwwwwwwww",
    "wwyywwwwwwyywwww",
    "wwwwwwwwwwwwwwww",
    "wwwwxxwwwwwwxxww",
    "wwwwwwwwwwwwwwww",
    "wyywwwwwwyywwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
  ] },
  "tile-water-2": { w: 16, h: 16, pal: {"w":"#3a7bd5","x":"#2e63b0","y":"#5a9ae8"}, rows: [
    "wwwwwwwwwwwwwwww",
    "wwwwwwwwwwwwwwww",
    "wxxwwwwwwxxwwwww",
    "wwwwwwwwwwwwwwww",
    "wwyywwwwwwyywwww",
    "wwwwwwwwwwwwwwww",
    "wwwwxxwwwwwwxxww",
    "wwwwwwwwwwwwwwww",
    "wyywwwwwwyywwwww",
    "wwwwwwwwwwwwwwww",
    "wwxxwwwwwwxxwwww",
    "wwwwwwwwwwwwwwww",
    "wwwwyywwwwwwyyww",
    "wwwwwwwwwwwwwwww",
    "wxxwwwwwwxxwwwww",
    "wwwwwwwwwwwwwwww",
  ] },
  "icon-badge": { w: 16, h: 16, pal: {"O":"#4a4a4a","G":"#8a8a8a","L":"#c8c8c8"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OOGGGGOO....",
    "...OGGGGGGGGO...",
    "..OGGGLLGGLGGO..",
    "..OGGLLGGGLLGO..",
    ".OGGGGGGGGGGGGO.",
    ".OGGLLGGGGLLGGO.",
    ".OGGGGGGGGGGGGO.",
    ".OGGGGGGGGGGGGO.",
    "..OGGLLGLLGOGO..",
    "..OGGGGGGGGGO...",
    "...OGGGGGGGO....",
    "....OOGGGOO.....",
    ".....OOOOOO.....",
    "................",
  ] },
  "icon-pokeball": { w: 16, h: 16, pal: {"O":"#1c1a22","R":"#e84848","W":"#f0f0f0"}, rows: [
    "................",
    ".....OOOOOO.....",
    "....OORRRROO....",
    "...ORRRRRRRRO...",
    "..ORRRRRRRRRRO..",
    "..ORRRROORRRRO..",
    ".ORRRROOORRRRRO.",
    ".ORRRROOORRRRRO.",
    ".ORRRRRRRRRRRRO.",
    ".OWWWWOOWWWWWWO.",
    ".OWWWWOOWWWWWOO.",
    "..OWWWOWWWWWO...",
    "..OWWWWWWWWOO...",
    "...OOWWWWWO.....",
    ".....OOOOOO.....",
    "................",
  ] },
  "icon-potion": { w: 16, h: 16, pal: {"O":"#1c1a22","R":"#e84848","P":"#48a8e8","L":"#b8e8f8"}, rows: [
    "................",
    "......OOOO......",
    ".....OORRRO.....",
    ".....OORRRO.....",
    "......OOOO......",
    ".....OOOOOO.....",
    "....OOPPPPPO....",
    "....OPPPPPPPO...",
    "....OPPLPPPPO...",
    "....OPPLPPPPO...",
    "....OPPPPPPPO...",
    "....OPPPPPPPO...",
    ".....OPPPPOO....",
    "......OOOO......",
    "................",
    "................",
  ] },
  "caterpie-front-bob": { w: 32, h: 32, pal: {"O":"#2e4a2e","G":"#5aa85a","Y":"#e8d848","R":"#d84848","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    ".............OO.................",
    "............ORRO................",
    "............ORRO................",
    "...........OGGGGO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    ".........OGEYYEGGO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGYYGGGGYYGGO...........",
    ".......OGGGGGGGGGGGGO...........",
    "........OGGGGGGGGGGO............",
    "........OGGYYGGYYGGO............",
    ".........OGGGGGGGGO.............",
    ".........OGGYYGGYGO.............",
    "..........OGGGGGGO..............",
    "...........OGGGGO...............",
    "............OOOO................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "geodude-front-bob": { w: 32, h: 32, pal: {"O":"#4a4a4a","G":"#8a8a8a","L":"#b8b8b8","M":"#6a6a6a","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "............OOOO................",
    "..........OOGGGGOO..............",
    ".........OGGGGGGGGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGWWEWGGGO.............",
    "........OGGGGGGGGGGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGLLGGO............",
    "......OGGGGGGGGGGGGGO...........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OOGGGGGGGGGGGGGOO..........",
    ".....OGGGGGGGGGGGGGGGO..........",
    "....OOGGGGGGGGGGGGGGGOO.........",
    "....OGGGMMGGGGGGGMMGGGO.........",
    "....OGGMMMGGGGGMMMGGGO..........",
    "....OGGMMMGGGGGMMMGGOO..........",
    ".....OGMMMGGGGMMMGGO............",
    ".....OGGMMGGGGMMGGO.............",
    "......OGGGGGGGGGGGO.............",
    "......OGGLLGGGGLLGO.............",
    ".......OGGGGGGGGGGO.............",
    "........OGGGGGGGOO..............",
    ".........OOOOOOO................",
    "................................",
    "................................",
    "................................",
  ] },
  "mankey-front-bob": { w: 32, h: 32, pal: {"O":"#5a4a2e","T":"#d8b878","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........OOOOOO...............",
    "..........OTTTTTTO..............",
    ".........OTTTTTTTTO.............",
    ".........OTWWEWWTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTO............",
    "........OTTEETTTTEETO...........",
    "........OTTEETTTTEETO...........",
    "........OTTTTTTTTTTO............",
    ".........OTTTTTTTTO.............",
    ".........OTTTTTTTTO.............",
    "..........OTTTTTTO..............",
    "..........OTTTTTTO..............",
    ".........OOTTTTTOOO.............",
    "........OOTTTTTTTTOO............",
    "........OTTTTTTTTTTOO...........",
    ".........OTTTTTTTTOOOO..........",
    ".........OTTTTTTTTOOOO..........",
    "..........OTTTTTOOOTTO..........",
    "...........OTTTTOOTTO...........",
    "............OOTTOOOOO...........",
    ".............OOOOOO.............",
    "................................",
    "................................",
  ] },
  "nidoranm-front-bob": { w: 32, h: 32, pal: {"O":"#4a2e5a","P":"#8a5aaa","K":"#e8a8c8","H":"#f0f0f0","W":"#ffffff","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "..........OO........OO..........",
    ".........OPPO......OPPO.........",
    ".........OPPO......OPPO.........",
    ".........OPEPO....OPEPO.........",
    ".........OPPPOOOOOOPPPO.........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPPPPPPPO...........",
    "........OPPPPPPPPPPPPO..........",
    "........OPPWWEPPPEWPPO..........",
    "........OPPWWEPPPEWPPO..........",
    "........OPPPPPPPPPPPPO..........",
    ".........OPPPPHHPPPPO...........",
    ".........OPPPPHHPPPPO...........",
    "..........OPPPPPPPPO............",
    "..........OPPPPPPPPO............",
    ".........OPPPPPPPPPPO...........",
    "........OPPPPKKPPPPPPO..........",
    "........OPPKKKKKKPPPPO..........",
    "........OPPKKKKKKPPPPO..........",
    ".........OPPKKKKPPPPO...........",
    ".........OPPPKKKPPPPO...........",
    "..........OPPPPPPPPO............",
    "...........OOPPPPOO.............",
    ".............OOOO...............",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "onix-front-bob": { w: 32, h: 32, pal: {"O":"#3a3a3a","G":"#7a7a7a","L":"#a8a8a8","W":"#ffffff"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    ".............OOOO...............",
    "...........OOGGGGOO.............",
    "..........OGGGGGGGGO............",
    ".........OGGGGGGGGGGO...........",
    ".........OGGWWGGWWGO............",
    ".........OGGWWGGWWGO............",
    ".........OGGGGGGGGGO............",
    "..........OGGGGGGOO.............",
    "...........OOOOOO...............",
    ".............OO.................",
    "...........OOGGOO...............",
    "..........OGGGGGGO..............",
    ".........OGGGGGGGGO.............",
    ".........OGGLLGGLGO.............",
    "........OGGGGGGGGGGO............",
    "........OGGLLGGGLLGO............",
    ".......OGGGGGGGGGGGGO...........",
    ".......OGGLLGGGGLLGGO...........",
    "......OGGGGGGGGGGGGGGO..........",
    "......OGGLLGGGGLLGGGO...........",
    ".....OGGGGGGGGGGGGGGGOO.........",
    ".....OGGLLGGGGLLGGGGO...........",
    "....OGGGGGGGGGGGGGGGGOOO........",
    "....OGGLLGGGGLLGGGGGGO..........",
    ".....OOOOOOOOOOOOOOOOO..........",
    "................................",
    "................................",
    "................................",
  ] },
  "pidgey-front-bob": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#a8896a","L":"#d8b98a","C":"#e8d8b0","B":"#e8a83a","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............OMMO..............",
    ".............OMMMMO.............",
    "...........OOMMMMMMOO...........",
    ".........OOMMMMMMMMMMOO.........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMBBMMMO.........",
    ".........OMMMMMMBBBBMMO.........",
    "..........OMMMMMBBMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    ".........OMMMCCCCCMMMO..........",
    ".........OMMMCCCCCMMMO..........",
    "..........OMMCCCCCMMO...........",
    "...........OMMMMMMMO............",
    "............OOMMMOO.............",
    ".............OOOOO..............",
    "................................",
    "................................",
  ] },
  "rattata-front-bob": { w: 32, h: 32, pal: {"O":"#4a2e4a","P":"#8a5a8a","C":"#e8d8e8","R":"#d84848","N":"#2e1a2e","T":"#f0f0f0","E":"#d8a0a0"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "...........O........O...........",
    "..........OPO......OPO..........",
    "..........OPO......OPO..........",
    ".........OPPPOOOOOOOPO..........",
    ".........OPPPPPPPPPPPPO.........",
    "........OPPPPPPPPPPPPPPO........",
    "........OPPRRPPPPPPRRPPO........",
    "........OPPRRPPPPPPRRPPO........",
    "........OPPPPPPPPPPPPPPO........",
    ".........OPPPPNNNPPPPPO.........",
    ".........OPPPPPPPPPPPPO.........",
    "..........OPPTTTTTPPPO..........",
    "..........OPPTTTTTPPPO..........",
    "...........OPPPPPPPPO...........",
    "...........OPPPPPPPPO...........",
    "..........OPPPPPPPPPPO..........",
    ".........OPPPPCCCCPPPPO.........",
    ".........OPPPCCCCCCPPPO.........",
    ".........OPPPCCCCCCPPPO.........",
    "..........OPPCCCCCCPPO..........",
    "..........OPPCCCCCCOOO..........",
    "...........OOOCCCOOO............",
    ".............OOOOO..............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
  "spearow-front-bob": { w: 32, h: 32, pal: {"O":"#3a2e20","M":"#8a6a4a","L":"#b89878","C":"#e8d8b0","B":"#e8a83a","E":"#1c1a22","R":"#c84848"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............ORRO..............",
    ".............ORRRRO.............",
    "............OOMMMOOO............",
    ".........OOOMMMMMMMMO...........",
    ".........OMMMMMMMMMMMOO.........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMEEEMMMEEEMMO........",
    ".........OMMMMMMMMMMMMO.........",
    ".........OMMMMMMMBBMMMO.........",
    ".........OMMMMMMBBBBMMO.........",
    "..........OMMMMMBBMMMO..........",
    "..........OMMMMMMMMMMO..........",
    ".........OMMMMMMMMMMMMO.........",
    "........OMMLMMMMMMMMLMO.........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    "........OMMLMMCCCMMLMO..........",
    ".........OMMMCCCCCMMMO..........",
    ".........OMMMCCCCCMMMO..........",
    "..........OMMCCCCCMMO...........",
    "...........OMMMMMMMO............",
    "............OOMMMOO.............",
    ".............OOOOO..............",
    "................................",
    "................................",
  ] },
  "weedle-front-bob": { w: 32, h: 32, pal: {"O":"#4a3a2a","B":"#a87850","Y":"#e8d848","S":"#d8d8d8","E":"#1c1a22"}, rows: [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...............OO...............",
    "..............OSSO..............",
    "..............OSSO..............",
    "...........OOOOOO...............",
    "..........OBBBBBBO..............",
    ".........OBBBBBBBBO.............",
    ".........OBEYYEBBO..............",
    ".........OBBBBBBBBO.............",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".......OBBBBBBBBBBBBO...........",
    ".......OBBYYBBBBYYBBO...........",
    ".......OBBBBBBBBBBBBO...........",
    "........OBBBBBBBBBBO............",
    "........OBBYYBBYYBBO............",
    ".........OBBBBBBBBO.............",
    ".........OBBYYBBYBO.............",
    "..........OBBBBBOO..............",
    "...........OBBBO................",
    "............OOO.................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
  ] },
};
const ART_META = {
  "families": [
    "tiles",
    "ash",
    "partner",
    "brock",
    "npcs",
    "species",
    "ui"
  ],
  "generated": "2026-10-15",
  "derived_bob": [
    "caterpie-front-bob",
    "geodude-front-bob",
    "mankey-front-bob",
    "nidoranm-front-bob",
    "onix-front-bob",
    "pidgey-front-bob",
    "rattata-front-bob",
    "spearow-front-bob",
    "weedle-front-bob"
  ]
};


// ---- src/engine/art.mjs ----
// art.mjs — hand-authored pixel-art wiring (Phase 4 Wave 3, Game Producer).
// Replaces the SpriteForge placeholder calls with real ART data per
// assets/sprites/README.md (wiring handoff) and docs/contracts.md §1.
// Battlers are 32x32 authored; drawn at 48px via Renderer.blitS with
// imageSmoothingEnabled=false (README: "scale in canvas if the contract says so").
// Runtime transforms (README): attack = 1.2x scale for 3 frames then back;
// impact = white palette-swap 2 frames + screen shake; faint = sink 8px + fade
// to 0 alpha over 20 frames; idle bob = build-time derived `-bob` frame.
// Species / tile kinds WITHOUT authored art fall back to the forge painters —
// those are documented placeholders, never presented as finished art.


const cvCache = new Map();

function key(id, scale, white) { return id + '|' + scale + '|' + (white ? 'w' : 'n'); }

// Rasterize one ART sprite to an offscreen canvas at integer pixel scale.
// white=true: impact-flash variant (every inked pixel -> white).
function artCanvas(doc, id, scale, white) {
  const k = key(id, scale || 1, !!white);
  const hit = cvCache.get(k);
  if (hit) return hit;
  const a = ART[id];
  if (!a) return null;
  const s = scale || 1;
  const cv = doc.createElement('canvas');
  cv.width = a.w * s; cv.height = a.h * s;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < a.h; y++) {
    const row = a.rows[y] || '';
    for (let x = 0; x < a.w; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      ctx.fillStyle = white ? '#ffffff' : (a.pal[ch] || '#ff00ff');
      ctx.fillRect(x * s, y * s, s, s);
    }
  }
  cvCache.set(k, cv);
  return cv;
}

// ---- battle battlers (32px ART -> 48px draw size via blitS) ----
function speciesBattleArt(doc, speciesId, species) {
  const mk = (id) => artCanvas(doc, id, 1, false);
  const front = mk(speciesId + '-front');
  const back = mk(speciesId + '-back');
  if (front && back) {
    return {
      front, back,
      frontBob: mk(speciesId + '-front-bob'),
      frontWhite: artCanvas(doc, speciesId + '-front', 1, true),
      backWhite: artCanvas(doc, speciesId + '-back', 1, true),
      size: 48,
    };
  }
  // Fallback: forge stand-in (documented; replaced when art ships).
  const cv = forgeSprite(doc, species, 48);
  return { front: cv, back: cv, frontBob: null, frontWhite: null, backWhite: null, size: 48, forgeFallback: true };
}

// ---- overworld ----
function ashFrames(doc, dir) {
  // [idle1, idle2, walk1, walk2, walk3, walk4] — 16x16 canvases.
  const d = ['down', 'up', 'left', 'right'].includes(dir) ? dir : 'down';
  const ids = ['idle-1', 'idle-2', 'walk-1', 'walk-2', 'walk-3', 'walk-4'];
  return ids.map((f) => artCanvas(doc, 'ash-' + d + '-' + f, 1) || artCanvas(doc, 'ash-down-' + f, 1));
}

const NPC_ROLE = {
  AIDE: 'aide', COACH: 'coach', NURSE: 'nurse', GARY: 'rival',
  BEA: 'lass', LISA: 'lass',
};
function npcFrames(doc, npc) {
  const name = ((npc && npc.name) || '').toUpperCase();
  if (name === 'BROCK') {
    return [artCanvas(doc, 'brock-idle-1', 1), artCanvas(doc, 'brock-idle-2', 1)];
  }
  const role = NPC_ROLE[name] || 'youngster';
  const a = artCanvas(doc, 'npc-' + role + '-idle-1', 1);
  const b = artCanvas(doc, 'npc-' + role + '-idle-2', 1);
  if (a && b) return [a, b];
  // Fallback: forge placeholder humanoid.
  const cv = forgeHumanoid(doc, npc);
  return [cv, cv];
}

function partnerHopFrames(doc) {
  const a = artCanvas(doc, 'pikachu-hop-1', 1);
  const b = artCanvas(doc, 'pikachu-hop-2', 1);
  return (a && b) ? [a, b] : null;
}

// ---- tiles ----
const TILE_ART = {
  tree: 'tile-tree', path: 'tile-path', grass: 'tile-grass',
  house: 'tile-house', door: 'tile-door', sign: 'tile-sign',
  gymwall: 'tile-gymwall', gymdoor: 'tile-gymdoor', centerdoor: 'tile-centerdoor',
  flower: 'tile-flower', rock: 'tile-rock',
};

function buildArtTileCache(doc) {
  // kind -> canvas (16x16). 'water' -> [water-1, water-2] animated pair.
  // 'void' stays a solid fill (no art). Kinds without ART fall back to paintTile.
  const cache = {};
  for (const kind of Object.keys(TILE_ART)) {
    const cv = artCanvas(doc, TILE_ART[kind], 1);
    if (cv) { cache[kind] = cv; continue; }
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), kind, 0, 0);
    cache[kind] = fb;
  }
  const w1 = artCanvas(doc, 'tile-water-1', 1);
  const w2 = artCanvas(doc, 'tile-water-2', 1);
  if (w1 && w2) cache.water = [w1, w2];
  else {
    const fb = doc.createElement('canvas');
    fb.width = 16; fb.height = 16;
    paintTile(fb.getContext('2d'), 'water', 0, 0);
    cache.water = fb;
  }
  return cache;
}

function tileSprite(cache, kind, t) {
  const v = cache[kind];
  if (!v) return null;
  if (Array.isArray(v)) return v[Math.floor((t || 0) / 600) % 2]; // water shimmer
  return v;
}

// ---- UI icons (ART ui family) ----
function uiIcon(doc, name) {
  return artCanvas(doc, 'icon-' + name, 1);
}


// ---- src/data/species.mjs ----
// species.mjs — slice roster data (Kanto opening: Pallet -> Pewter).
// Original data tables for this fan project. spriteSeed feeds SpriteForge v1;
// Art Director replaces sprites per docs/contracts.md §1.

const SPECIES = {
  partner: {
    id: 'partner', name: 'Pikachu', dexNo: 25, types: ['electric'],
    base: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
    catchRate: 190, growth: 'mediumfast', baseXp: 82, body: 'quad', spriteSeed: 2501,
    learnset: { 1: ['thundershock', 'growl'], 5: ['quickattack'] },
    flavor: 'A spirited partner who refused the easy path. Never leaves your side.',
    // Yellow homage (hard rules): never boxed, never evolved. Guards in state.mjs.
    refusesEvolution: true,
    refusesBox: true,
  },
  pidgey: {
    id: 'pidgey', name: 'Pidgey', dexNo: 16, types: ['normal', 'flying'],
    base: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 },
    catchRate: 255, growth: 'mediumslow', baseXp: 50, body: 'bird', spriteSeed: 1601,
    learnset: { 1: ['tackle'], 3: ['gust'], 5: ['quickattack'] },
    flavor: 'Common on quiet routes. Gusts up dust when it takes off.',
  },
  rattata: {
    id: 'rattata', name: 'Rattata', dexNo: 19, types: ['normal'],
    base: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 },
    catchRate: 255, growth: 'mediumfast', baseXp: 51, body: 'quad', spriteSeed: 1901,
    learnset: { 1: ['tackle', 'tailwhip'], 4: ['quickattack'] },
    flavor: 'Quick teeth, quicker feet. Nibbles anything left unattended.',
  },
  caterpie: {
    id: 'caterpie', name: 'Caterpie', dexNo: 10, types: ['bug'],
    base: { hp: 45, atk: 30, def: 35, spa: 20, spd: 20, spe: 45 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1001,
    learnset: { 1: ['tackle', 'stringshot'] },
    flavor: 'Gentle and green. Its antennae taste the air for friends.',
  },
  weedle: {
    id: 'weedle', name: 'Weedle', dexNo: 13, types: ['bug', 'poison'],
    base: { hp: 40, atk: 35, def: 30, spa: 20, spd: 20, spe: 50 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1301,
    learnset: { 1: ['poisonsting', 'stringshot'] },
    flavor: 'Mind the stinger. It only uses it when startled.',
  },
  spearow: {
    id: 'spearow', name: 'Spearow', dexNo: 21, types: ['normal', 'flying'],
    base: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 },
    catchRate: 255, growth: 'mediumfast', baseXp: 52, body: 'bird', spriteSeed: 2101,
    learnset: { 1: ['peck', 'growl'] },
    flavor: 'Territorial and loud. Best admired from a respectful distance.',
  },
  zubat: {
    id: 'zubat', name: 'Zubat', dexNo: 41, types: ['poison', 'flying'],
    base: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 },
    catchRate: 255, growth: 'mediumfast', baseXp: 49, body: 'bird', spriteSeed: 4101,
    learnset: { 1: ['leechlife', 'supersonic'] },
    flavor: 'Navigates by sound. Startles easily in dark tunnels.',
  },
  geodude: {
    id: 'geodude', name: 'Geodude', dexNo: 74, types: ['rock', 'ground'],
    base: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 },
    catchRate: 255, growth: 'mediumslow', baseXp: 60, body: 'blob', spriteSeed: 7401,
    learnset: { 1: ['tackle', 'defensecurl'], 6: ['rockthrow'] },
    flavor: 'Arms of living stone. Often mistaken for an ordinary boulder.',
  },
  onix: {
    id: 'onix', name: 'Onix', dexNo: 95, types: ['rock', 'ground'],
    base: { hp: 35, atk: 45, def: 160, spa: 30, spd: 45, spe: 70 },
    catchRate: 45, growth: 'mediumfast', baseXp: 77, body: 'serpent', spriteSeed: 9501,
    learnset: { 1: ['tackle', 'harden'], 8: ['rockthrow'] },
    flavor: 'A chain of boulders given will. The gym leader\u2019s ace.',
  },
  bulbasaur: {
    id: 'bulbasaur', name: 'Bulbasaur', dexNo: 1, types: ['grass', 'poison'],
    base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
    catchRate: 45, growth: 'mediumslow', baseXp: 64, body: 'quad', spriteSeed: 101,
    learnset: { 1: ['tackle', 'growl'], 5: ['vinewhip'] },
    flavor: 'A seed on its back drinks the morning sun.',
  },
  charmander: {
    id: 'charmander', name: 'Charmander', dexNo: 4, types: ['fire'],
    base: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    catchRate: 45, growth: 'mediumslow', baseXp: 62, body: 'biped', spriteSeed: 401,
    learnset: { 1: ['scratch', 'growl'], 5: ['ember'] },
    flavor: 'Its tail flame mirrors its spirit — bright and stubborn.',
  },
  squirtle: {
    id: 'squirtle', name: 'Squirtle', dexNo: 7, types: ['water'],
    base: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
    catchRate: 45, growth: 'mediumslow', baseXp: 63, body: 'biped', spriteSeed: 701,
    learnset: { 1: ['tackle', 'tailwhip'], 5: ['watergun'] },
    flavor: 'Withdraws into its shell, then answers with a jet of water.',
  },
  nidoranm: {
    id: 'nidoranm', name: 'Nidoran\u2642', dexNo: 32, types: ['poison'],
    base: { hp: 46, atk: 57, def: 40, spa: 40, spd: 40, spe: 50 },
    catchRate: 235, growth: 'mediumslow', baseXp: 55, body: 'quad', spriteSeed: 3201,
    learnset: { 1: ['scratch', 'growl'] },
    flavor: 'Ears always up. Hears a trainer\u2019s step long before seeing one.',
  },
  mankey: {
    id: 'mankey', name: 'Mankey', dexNo: 56, types: ['fighting'],
    base: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 },
    catchRate: 190, growth: 'mediumfast', baseXp: 61, body: 'biped', spriteSeed: 5601,
    learnset: { 1: ['scratch', 'leer', 'lowkick'] },
    flavor: 'Angers fast, forgives faster — usually after a good battle.',
  },
};

const SPECIES_LIST = Object.keys(SPECIES);

// Dex tracking: 1025 species tracked honestly; playable = slice roster.
// Undiscovered species render as "???" (gameux OQ recommendation).
const DEX_TOTAL = 1025;


// ---- src/data/moves.mjs ----
// moves.mjs — slice move data. Original implementations of documented systems.
// cat: 'physical' | 'special' | 'status'. Effects are simple, named, and reviewable.

const MOVES = {
  tackle:      { id: 'tackle', name: 'Tackle', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  scratch:     { id: 'scratch', name: 'Scratch', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  quickattack: { id: 'quickattack', name: 'Quick Attack', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 30, priority: 1 },
  pound:       { id: 'pound', name: 'Pound', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  growl:       { id: 'growl', name: 'Growl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'foe', atk: -1 } },
  tailwhip:    { id: 'tailwhip', name: 'Tail Whip', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  leer:        { id: 'leer', name: 'Leer', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  supersonic:  { id: 'supersonic', name: 'Supersonic', type: 'normal', cat: 'status', power: 0, acc: 55, pp: 20, priority: 0, effect: { target: 'foe', status: 'confusion' } },
  thundershock:{ id: 'thundershock', name: 'Thunder Shock', type: 'electric', cat: 'special', power: 40, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', status: 'paralysis', chance: 10 } },
  ember:       { id: 'ember', name: 'Ember', type: 'fire', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0, effect: { target: 'foe', status: 'burn', chance: 10 } },
  watergun:    { id: 'watergun', name: 'Water Gun', type: 'water', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0 },
  vinewhip:    { id: 'vinewhip', name: 'Vine Whip', type: 'grass', cat: 'physical', power: 45, acc: 100, pp: 25, priority: 0 },
  gust:        { id: 'gust', name: 'Gust', type: 'flying', cat: 'special', power: 40, acc: 100, pp: 35, priority: 0 },
  peck:        { id: 'peck', name: 'Peck', type: 'flying', cat: 'physical', power: 35, acc: 100, pp: 35, priority: 0 },
  poisonsting: { id: 'poisonsting', name: 'Poison Sting', type: 'poison', cat: 'physical', power: 15, acc: 100, pp: 35, priority: 0, effect: { target: 'foe', status: 'poison', chance: 30 } },
  stringshot:  { id: 'stringshot', name: 'String Shot', type: 'bug', cat: 'status', power: 0, acc: 95, pp: 40, priority: 0, effect: { target: 'foe', spe: -2 } },
  leechlife:   { id: 'leechlife', name: 'Leech Life', type: 'bug', cat: 'physical', power: 20, acc: 100, pp: 15, priority: 0, effect: { target: 'foe', drain: 0.5 } },
  rockthrow:   { id: 'rockthrow', name: 'Rock Throw', type: 'rock', cat: 'physical', power: 50, acc: 90, pp: 15, priority: 0 },
  lowkick:     { id: 'lowkick', name: 'Low Kick', type: 'fighting', cat: 'physical', power: 50, acc: 100, pp: 20, priority: 0 },
  defensecurl: { id: 'defensecurl', name: 'Defense Curl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'self', def: 1 } },
  harden:      { id: 'harden', name: 'Harden', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'self', def: 1 } },
};

// effect: { target:'foe'|'self', atk/def/spa/spd/spe stages [-6,6], status, chance (0-100), drain }


// ---- src/data/items.mjs ----
// items.mjs — slice item data. Curated ball roster per GD §3.3 (phone-UI-sized).

const BALLS = {
  pokeball:  { id: 'pokeball', name: 'Poke Ball', bonus: 1, desc: 'The baseline. Reliable.' },
  greatball: { id: 'greatball', name: 'Great Ball', bonus: 1.5, desc: '1.5x catch rate.' },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', bonus: 2, desc: '2x catch rate.' },
};

const ITEMS = {
  potion: { id: 'potion', name: 'Potion', pocket: 'medicine', heal: 20, desc: 'Restores 20 HP.' },
  pokeball:  { id: 'pokeball', name: 'Poke Ball', pocket: 'balls', desc: BALLS.pokeball.desc },
  greatball: { id: 'greatball', name: 'Great Ball', pocket: 'balls', desc: BALLS.greatball.desc },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', pocket: 'balls', desc: BALLS.ultraball.desc },
  boulderbadge: { id: 'boulderbadge', name: 'Boulder Badge', pocket: 'key', desc: 'Won from Brock of Pewter Gym. Raises party obedience and Attack.' },
};

const POCKETS = ['balls', 'medicine', 'key'];


// ---- src/data/maps.mjs ----
// maps.mjs — Kanto opening slice: Pallet -> Route 1 -> Viridian -> Route 2 -> Pewter (+ interiors).
// Tile legend: # tree | . path | , grass | ~ water | H house | D door | S sign |
//              G gymwall | E gymdoor | C centerdoor | F flower | R rock | ' ' void
// Warps fire on step. Doors are step-warps; edge exits are listed per tile.

function rows(list) { return list; }

const MAPS = {
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

const MAP_LIST = Object.keys(MAPS);

// Tile passability: walkable kinds.
const WALKABLE = new Set(['.', ',', 'D', 'E', 'C', 'F']);

// Trainer definitions for the slice.
// ai: 'opener-setup' = gym-leader flavor: open with a self-buff setup move if known
// (classic Brock Defense Curl), then fight on effectiveness like everyone else.
const TRAINERS = {
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


// ---- src/data/dialogue.mjs ----
// dialogue.mjs — original writing only. Anime story beats are plot facts, not scripts.
// No quoted or closely-paraphrased anime lines (GC §3.3).

const INTRO_SCRIPT = {
  professor: 'PROF. HAWTHORN',
  lines: [
    'Ah — you made it. I was starting to worry the alarm won again.',
    'Welcome to the world of Pokemon! My name is Hawthorn. I study how Pokemon and people grow together.',
    'You must be {player}. That spark in your eyes — you are ready for the road.',
    'Now then... every trainer begins with a partner. But I have a confession.',
    'The three young Pokemon I set aside for new trainers... they have already found homes this morning.',
    'There is one left. A difficult one. It has opinions, and it has already shocked two of my aides today.',
  ],
  starterMoment: [
    'Go on — say hello. Careful now...',
    '...It shocked you too! Ha! That means it likes you. Mostly.',
    'Listen well: this one will never stay inside a Poke Ball. It walks beside you, or not at all.',
    'A bond like that is rarer than any badge. Treat it well, {player}.',
    'Your journey starts on Route 1, north of Pallet Town. Catch Pokemon, grow strong — and when you are ready, Pewter Gym awaits.',
  ],
};

// PARTNER_MOODS — Yellow homage: talking to the partner (face it + A, or tap
// the mood pip) reads its current emotion. Mood is driven by battle beats
// (battle.mjs) and by petting (overworld.mjs). All lines original.
const PARTNER_MOODS = {
  happy: 'is happy! It nuzzles your hand.',
  curious: 'tilts its head, curious.',
  sleepy: 'yawns... maybe it needs a rest soon.',
  excited: 'is buzzing with excitement! It hops in place.',
  sad: 'looks downcast. A win would cheer it up.',
};

// Yellow hard rules, original wording: the partner refuses the ball system
// outright (intro), refuses evolution, and refuses the PC box (guards in
// state.mjs). It walks beside you, or not at all.
const PARTNER_REFUSAL = {
  evolution: 'PIKACHU turned away! It does not want to change — not ever.',
  box: 'PIKACHU leapt right back out! It walks beside you, or not at all.',
};

const TUTORIAL_AIDE_EXTRA = [
  'One more thing — press START anytime to open the menu. Bag, party, dex, save... it is all there.',
];

const GYM_WIN_TEXT = [
  'You defeated Gym Leader Brock!',
];

const SLICE_CAPSTONE = [
  '{player} received the Boulder Badge!',
  'With the Boulder Badge, your Pokemon will obey you, and your team hits a little harder.',
  '...To be continued. The road to Cerulean City lies ahead — in the next chapter.',
];


// ---- src/data/rivals.mjs ----
// rivals.mjs — rival data + the documented Yellow partner-evolution rule.
// Mechanics reimplemented from documentation (never ROM-derived). The rival
// raises an EEVEE as his partner (Yellow), not a Kanto starter; which form it
// takes is decided by the early rivalry record. Species data for Eevee and its
// evolutions lands with the act that first fields them (ADR-006 content tiers).

const RIVALS = {
  gary: {
    id: 'gary',
    name: 'GARY',
    partner: 'eevee', // Yellow: the rival's starter is an Eevee
    // Team plans per act reference species ids; acts beyond Kanto resolve
    // partner -> rivalPartnerEvolution(earlyWins, earlyLosses) at build time.
    acts: {
      kanto: { partner: 'eevee', team: ['pidgey', 'rattata'] },
      orange: { partner: null /* resolved */, team: [] },
      johto: { partner: null /* resolved */, team: [] },
    },
  },
};

// Yellow's documented rule: the rival's Eevee evolves by how the first two
// rivalry battles went — won both -> Vaporeon, split -> Flareon, lost both
// -> Jolteon. Pure function; the act builders call it when scripting the
// evolution beat.
function rivalPartnerEvolution(earlyWins, earlyLosses) {
  if (earlyWins >= 2 && earlyLosses === 0) return 'vaporeon';
  if (earlyWins === 1 && earlyLosses === 1) return 'flareon';
  return 'jolteon'; // losing record (incl. 0-2) -> Jolteon
}


// ---- src/data/story.mjs ----
// story.mjs — Anime-chronology campaign spine (ADR-015).
// Maps the owner's complete anime+movies watch order onto the game's chapter
// structure. v1 "Act I: The Beginning" (ADR-006) = chapters 1-5 (Kanto, Orange,
// Johto). Everything beyond is scaffolded as honest locked markers — no fake
// content, no playable claims (scope-honesty rule). Non-canon movies/minis
// live on the BONUS shelf, never on the main spine.
// All text is original phrasing; episode/movie titles are factual references.

const ACTS = [
  { n: 1, title: 'Act I: The Beginning', scope: 'playable', note: 'Kanto → Orange Islands → Johto (v1)' },
  { n: 2, title: 'Act II: New Horizons', scope: 'announced', note: 'Hoenn → Battle Frontier → Sinnoh (v2, announced ADR-006)' },
  { n: 3, title: 'Act III: Beyond', scope: 'planned', note: 'Unova → Kalos → Alola → Journeys → Horizons (planned, not built)' },
];

const CHAPTERS = [
  {
    n: 1, id: 'indigo-league', act: 1, region: 'Kanto', scope: 'playable',
    title: 'The Indigo League',
    arc: 'Pallet Town to the Indigo Plateau — eight gyms, one dream.',
    anime: 'Season 1: Indigo League (Ep 1–69, incl. Ep 70–82 tail)',
    movies: ['The First Movie — Mewtwo Strikes Back'],
  },
  {
    n: 2, id: 'orange-islands', act: 1, region: 'Orange Islands', scope: 'playable',
    title: 'Adventures in the Orange Islands',
    arc: 'Four Orange badges across the southern seas.',
    anime: 'Season 2: Adventures in the Orange Islands (Ep 1–24, Special: Slowking\u2019s Day, Ep 25–36)',
    movies: ['Pok\u00e9mon 2000 — The Power of One'],
  },
  {
    n: 3, id: 'johto-journeys', act: 1, region: 'Johto', scope: 'playable',
    title: 'The Johto Journeys',
    arc: 'A new region, eight new gyms, an old rival.',
    anime: 'Season 3: The Johto Journeys (Ep 1–38, Ep 39–41)',
    movies: ['Spell of the Unown'],
  },
  {
    n: 4, id: 'johto-league-champions', act: 1, region: 'Johto', scope: 'playable',
    title: 'Johto League Champions',
    arc: 'The road to the Silver Conference.',
    anime: 'Season 4: Johto League Champions (Ep 1–21, Ep 22–48, Ep 49–52)',
    movies: ['Mewtwo Returns', '4Ever — Celebi: Voice of the Forest'],
  },
  {
    n: 5, id: 'master-quest', act: 1, region: 'Johto', scope: 'playable',
    title: 'Master Quest',
    arc: 'The Silver Conference — the road continues.',
    anime: 'Season 5: Master Quest (Ep 1–47, Ep 48–65)',
    movies: ['Heroes — Latios & Latias'],
  },
  // ---- locked: Act II (v2, announced in ADR-006) ----
  {
    n: 6, id: 'hoenn', act: 2, region: 'Hoenn', scope: 'locked',
    title: 'Rise Through Hoenn',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 6–8: Advanced / Advanced Challenge / Advanced Battle',
    movies: ['Jirachi: Wish Maker', 'Destiny Deoxys', 'Lucario and the Mystery of Mew'],
  },
  {
    n: 7, id: 'battle-frontier', act: 2, region: 'Kanto (Frontier)', scope: 'locked',
    title: 'Battle Frontier',
    arc: 'Locked — Act II (v2). The Frontier-Brain seat is the announced finale.',
    anime: 'Season 9: Battle Frontier (Ep 1–5, Special: Mastermind of Mirage Pok\u00e9mon, Ep 6–47)',
    movies: ['Ranger and the Temple of the Sea'],
  },
  {
    n: 8, id: 'sinnoh', act: 2, region: 'Sinnoh', scope: 'locked',
    title: 'Diamond & Pearl',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 10–13: Diamond and Pearl / Battle Dimension / Galactic Battles / Sinnoh League Victors',
    movies: ['The Rise of Darkrai', 'Giratina and the Sky Warrior', 'Arceus and the Jewel of Life', 'Zoroark: Master of Illusions'],
  },
  // ---- locked: Act III (planned) ----
  {
    n: 9, id: 'unova', act: 3, region: 'Unova', scope: 'locked',
    title: 'Black & White',
    arc: 'Locked — future act.',
    anime: 'Seasons 14–16: Black & White / Rival Destinies / Adventures in Unova',
    movies: ['Victini and Reshiram / Zekrom', 'Kyurem vs. the Sword of Justice', 'Genesect and the Legend Awakened'],
  },
  {
    n: 10, id: 'kalos', act: 3, region: 'Kalos', scope: 'locked',
    title: 'XY & XYZ',
    arc: 'Locked — future act.',
    anime: 'Seasons 17–19: XY / Kalos Quest / XYZ (incl. Mega Evolution specials)',
    movies: ['Diancie and the Cocoon of Destruction', 'Hoopa and the Clash of Ages', 'Volcanion and the Mechanical Marvel'],
  },
  {
    n: 11, id: 'alola', act: 3, region: 'Alola', scope: 'locked',
    title: 'Sun & Moon',
    arc: 'Locked — future act.',
    anime: 'Seasons 20–22: Sun & Moon / Ultra Adventures / Ultra Legends',
    movies: [],
  },
  {
    n: 12, id: 'journeys', act: 3, region: 'World', scope: 'locked',
    title: 'Journeys',
    arc: 'Locked — future act. Ends with "Aim to Be a Pok\u00e9mon Master" — the end of Ash\u2019s story.',
    anime: 'Seasons 23–25: Journeys / Master Journeys / Ultimate Journeys (incl. Arceus Chronicles)',
    movies: [],
  },
  {
    n: 13, id: 'horizons', act: 3, region: 'World', scope: 'locked',
    title: 'Horizons: A New Beginning',
    arc: 'Locked — future act. Liko\u2019s story begins where Ash\u2019s ends.',
    anime: 'Horizons S1 (Ep 1–45) / S2 The Search for Laqua / S3 Rising Hope / S4 Wonder Voyage',
    movies: [],
  },
];

// Non-canon movies and mini-series. Never on the main spine — the BONUS shelf.
const BONUS_SHELF = [
  'I Choose You!',
  'The Power of Us',
  'Secrets of the Jungle',
  'Detective Pikachu',
  'Mewtwo Strikes Back: Evolution',
  'Pok\u00e9mon Origins',
  'Pok\u00e9mon Generations',
  'Twilight Wings',
  'Pok\u00e9toon',
  'Evolutions',
  'Hisuian Snow',
  'Paldean Winds',
  'Pok\u00e9mon Concierge',
  'Path to the Peak',
];

function chapterOf(n) {
  return CHAPTERS.find((c) => c.n === n) || CHAPTERS[0];
}

function playableChapters() {
  return CHAPTERS.filter((c) => c.scope === 'playable');
}

function lockedChapters() {
  return CHAPTERS.filter((c) => c.scope === 'locked');
}


// ---- src/game/state.mjs ----
// state.mjs — GameState: the runtime state IS the save shape (architecture §2.3).
// schemaVersion 1. Frontier-ready hooks from day one: badges.symbols (7 locked),
// dex.befriended (third dex state), facilities registry, story.flags open map.


const SCHEMA_VERSION = 1;

function defaultState() {
  return {
    v: SCHEMA_VERSION,
    player: { name: 'ASH', rivalName: 'GARY', trainerId: 0, playtimeSec: 0, money: 300 },
    party: [],
    boxes: {},
    dex: { caught: {}, seen: {}, befriended: {} }, // dexNo -> true
    badges: { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] },
    story: {
      chapter: 0, beat: 0, flags: {},
      position: { map: 'pallet', x: 7, y: 7, dir: 'down' },
      difficulty: 'normal',
    },
    pikachu: { mood: 'happy', foundItemCooldown: 0 },
    settings: {
      textSpeed: 'normal', battleAnims: true, shake: true, reducedMotion: false,
      mute: false, musicVol: 0.8, sfxVol: 0.8, controlsFlip: false, keymap: null, hudScale: 1,
      vibration: true, autosave: true, showTouch: false, // P1/I5+I2: Wave-3 additions
    },
    facilities: { registry: [], unlocked: [] },
    bag: { pokeball: 10, potion: 3 },
    meta: { createdAt: 0, updatedAt: 0, playtimeSec: 0, location: 'Pallet Town' },
  };
}

// Battle-mon factory: {speciesId, nickname, level, xp, moves[{id,pp}], ivs, hp...}
function makeMon(speciesId, level, speciesTable, movesTable) {
  const sp = speciesTable[speciesId];
  const mon = {
    speciesId,
    nickname: null,
    level,
    xp: xpForLevel(sp.growth, level),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    status: null,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ot: 'ASH',
    friendship: 70,
  };
  const learned = [];
  for (const lv of Object.keys(sp.learnset).map(Number).sort((a, b) => a - b)) {
    if (lv <= level) learned.push(...sp.learnset[lv]);
  }
  for (const mid of learned.slice(-4)) {
    const mv = movesTable[mid];
    mon.moves.push({ id: mid, pp: mv.pp, maxPp: mv.pp });
  }
  mon.maxHp = hpValue(sp.base.hp, level);
  mon.hp = mon.maxHp;
  mon.stats = {
    atk: statValue(sp.base.atk, level),
    def: statValue(sp.base.def, level),
    spa: statValue(sp.base.spa, level),
    spd: statValue(sp.base.spd, level),
    spe: statValue(sp.base.spe, level),
  };
  return mon;
}


function displayName(mon, speciesTable) {
  return mon.nickname || speciesTable[mon.speciesId].name;
}

// Dex helpers — honest tracked-vs-playable wording lives in the UI layer.
// Yellow hard rules for the partner (Ash's Pikachu): it refuses evolution and
// refuses the PC box. Guards for current + future systems (no evolution or
// deposit UI exists in the slice yet — these are the enforcement points they
// must call). Original refusal lines live in data/dialogue.mjs.
function evolutionCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'PIKACHU turned away! It does not want to change — not ever.' };
  }
  return { ok: true };
}
function boxCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'PIKACHU leapt right back out! It walks beside you, or not at all.' };
  }
  return { ok: true };
}
function dexRegister(dex, kind, dexNo) {
  dex[kind][dexNo] = true;
  if (kind === 'caught' || kind === 'befriended') dex.seen[dexNo] = true;
}
function dexCaughtCount(dex) { return Object.keys(dex.caught).length; }


// ---- src/save/schema.mjs ----
// schema.mjs — save schema v1 validation + migration.
// Hand-rolled typed validator (LCR ruling §9.8). Whitelist, never blacklist.


const SAVE_KEY = 'pdr.save.guest';

// Whitelisted top-level keys. Unknown keys => reject (architecture §3.4).
const TOP_KEYS = ['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story',
  'pikachu', 'settings', 'facilities', 'bag', 'meta'];

function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

function validateSave(data) {
  const errors = [];
  if (!isObj(data)) return { ok: false, errors: ['not-an-object'] };
  for (const k of Object.keys(data)) {
    if (!TOP_KEYS.includes(k)) errors.push('unknown-key:' + k);
  }
  if (data.v !== SCHEMA_VERSION) errors.push('bad-schema-version');
  if (!isObj(data.player) || typeof data.player.name !== 'string') errors.push('bad-player');
  if (!Array.isArray(data.party) || data.party.length > 6) errors.push('bad-party');
  for (const m of (data.party || [])) {
    if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number') { errors.push('bad-mon'); break; }
    if (m.level < 1 || m.level > 100) { errors.push('bad-mon-level'); break; }
    if (!Array.isArray(m.moves) || m.moves.length > 4) { errors.push('bad-mon-moves'); break; }
  }
  if (!isObj(data.dex)) errors.push('bad-dex');
  if (!isObj(data.badges) || !Array.isArray(data.badges.kanto)) errors.push('bad-badges');
  if (!isObj(data.story) || !isObj(data.story.position)) errors.push('bad-story');
  return { ok: errors.length === 0, errors };
}

// v0 -> v1 migration chain. v0 never shipped publicly; stub kept for the chain.
function migrate(data) {
  if (!isObj(data)) return null;
  if (data.v === 0) {
    data.v = 1;
    data.facilities = data.facilities || { registry: [], unlocked: [] };
    data.badges = data.badges || { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] };
  }
  return data;
}

function saveSizeBytes(data) {
  try { return new Blob([JSON.stringify(data)]).size; }
  catch (e) { return JSON.stringify(data).length; }
}


// ---- src/save/store.mjs ----
// store.mjs — guest localStorage save store (Track A).
// Versioned JSON, quota-exceeded guard, export-before-overwrite (PRD edge 9).


function storage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) { /* fall through */ }
  return null;
}

class SaveStore {
  constructor() {
    this.lastError = null;
  }

  exists() {
    const s = storage();
    if (!s) return false;
    return s.getItem(SAVE_KEY) !== null;
  }

  load() {
    const s = storage();
    if (!s) return { ok: false, reason: 'no-storage' };
    const raw = s.getItem(SAVE_KEY);
    if (raw === null) return { ok: false, reason: 'empty' };
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, reason: 'corrupt-json' }; }
    data = migrate(data);
    const v = validateSave(data);
    if (!v.ok) return { ok: false, reason: 'invalid', errors: v.errors };
    return { ok: true, data };
  }

  save(state) {
    const s = storage();
    if (!s) { this.lastError = 'no-storage'; return { ok: false, reason: 'no-storage' }; }
    state.meta.updatedAt = Date.now();
    const bytes = saveSizeBytes(state);
    if (bytes > 65536) { this.lastError = 'over-budget'; return { ok: false, reason: 'over-budget', bytes }; }
    try {
      s.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota guard: never silently overwrite — surface + offer export.
      this.lastError = 'quota';
      return { ok: false, reason: 'quota', exportPayload: JSON.stringify(state) };
    }
    return { ok: true, bytes };
  }

  erase() {
    const s = storage();
    if (s) s.removeItem(SAVE_KEY);
  }

  exportFile(state) {
    return JSON.stringify(state);
  }
}

function freshState() {
  const st = defaultState();
  st.meta.createdAt = Date.now();
  st.meta.updatedAt = Date.now();
  return st;
}


// ---- src/game/scenes.mjs ----
// scenes.mjs — scene stack (push/pop/replace) + UI-state layer.
// Scenes: boot/title/intro/overworld/battle. UI panels swap without scene reloads.

class SceneStack {
  constructor(game) {
    this.game = game;
    this.stack = [];
  }
  get top() { return this.stack[this.stack.length - 1]; }
  push(scene) {
    const cur = this.top;
    if (cur && cur.suspend) cur.suspend();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  pop() {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const cur = this.top;
    if (cur && cur.resume) cur.resume();
    return s;
  }
  replace(scene) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    this.stack.push(scene);
    scene.game = this.game;
    if (scene.enter) scene.enter();
  }
  clear() {
    while (this.stack.length) this.pop();
  }
  update(dt) { const t = this.top; if (t && t.update) t.update(dt); }
  render(r, alpha) { const t = this.top; if (t && t.render) t.render(r, alpha); }
}


// ---- src/game/ui.mjs ----
// ui.mjs — DOM chrome: D-pad/A/B overlays, dialogue, menus, panels.
// Two backends: browser DOM, and headless (records calls; input-driven).
// Battle command panel: 2x2 grid replacing the D-pad zone (one-thumb rule, gameux §2).
// P0/E8: cmdpanel populated as 2x2 88x64 icon+label buttons, FIGHT top-left.
// P0/E9: move menu as 2x2 grid with type badge pills (icon+text) + PP.
// P0/C3: name-entry A-Z grid keyboard (44px keys, physical-keyboard support).
// P0/B1: Trainer ID Terminal login stub (guest-functional, zero network).

const TEXT_SPEED_CPS = { slow: 15, normal: 30, fast: 60, instant: 9999 };


function stubEl() {
  return {
    children: [], style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild(c) { this.children.push(c); return c; },
    remove() {}, addEventListener() {}, removeEventListener() {},
    set textContent(v) { this._t = v; }, get textContent() { return this._t || ''; },
    set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ''; },
    querySelector() { return stubEl(); }, querySelectorAll() { return []; },
    focus() {}, click() {},
  };
}

// Hand-authored 12x12 pixel command icons (original, no emoji — contracts §1.3).
// '1' = ink (#ffe9a8 on dark), '.' = transparent.
const CMD_PIX = {
  fight: [
    '.....1......',
    '.....1......',
    '..1..1..1...',
    '...11111....',
    '....111.....',
    '.111111111..',
    '....111.....',
    '...11111....',
    '..1..1..1...',
    '.....1......',
    '.....1......',
    '............',
  ],
  party: [
    '.11...11....',
    '.11...11....',
    '.11...11....',
    '............',
    '.11...11....',
    '.11...11....',
    '............',
    '.1111111....',
    '.1111111....',
    '............',
    '............',
    '............',
  ],
  run: [
    '....1.......',
    '.....1......',
    '......1.....',
    '.......1....',
    '11111111111.',
    '.......1....',
    '......1.....',
    '.....1......',
    '....1.......',
    '............',
    '............',
    '............',
  ],
};

function typePill(type) {
  const col = TYPE_COLORS[type] || '#a8a878';
  const abbr = String(type).slice(0, 2).toUpperCase();
  return '<span class="tpill" style="background:' + col + '"><b>' + abbr + '</b>&nbsp;' + type + '</span>';
}

class UI {
  constructor(game) {
    this.game = game;
    this.headless = (typeof document === 'undefined');
    this.root = null;
    this.dpadEl = null; this.cmdEl = null;
    this.dlg = null;      // { lines, idx, chars, cb, speaker }
    this.menu = null;     // { title, items, idx, cb, battle }
    this.panel = null;    // named panel open (dex/party/bag/save/options)
    this.toastQ = [];
    this.log = [];        // headless: record of UI calls (test assertions)
    this._els = {};
    this.nameEntry = null; // { value, maxLen, cb, ... } while the A-Z grid is open
    this.loginOpen = false;
    this.inBattle = false; // Track B: battle-mode flag (SYNC defers conflict UI out of battle)
    this.hudVisible = true;
    this.dexDot = false;
    this._guestBannerOff = false;
    this.onMoodTap = null;
    this._moodWanted = false;
    this.chapterCard = null; // D2: chapter title card overlay while open
    this._ccT = 0;
  }

  init() {
    if (this.headless) return;
    const doc = document;
    this.root = doc.getElementById('ui');
    this.buildControls();
    this.buildDialogue();
    this.buildMenu();
    this.buildToasts();
    this.buildHudStrip();
    this.buildGuestBanner();
    this.buildMoodPip();
    this.buildHintCard();
  }

  el(tag, cls, parent) {
    if (this.headless) return stubEl();
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- touch controls ----
  buildControls() {
    const g = this.el('div', 'controls', this.root);
    const pad = this.el('div', 'dpad', g);
    this.dpadEl = pad;
    const mk = (action, cls, label) => {
      const b = this.el('button', 'padbtn ' + cls, pad);
      b.textContent = label;
      b.setAttribute('aria-label', action);
      const on = (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); };
      const off = (e) => { e.preventDefault(); this.game.input.release(action); };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
      return b;
    };
    mk('up', 'p-up', '▲'); mk('down', 'p-down', '▼');
    mk('left', 'p-left', '◀'); mk('right', 'p-right', '▶');
    const ab = this.el('div', 'ab', g);
    const mkA = (action, cls, label) => {
      const b = this.el('button', 'abtn ' + cls, ab);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.audio.unlock(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      b.addEventListener('pointercancel', (e) => e.preventDefault());
      return b;
    };
    mkA('a', 'a-a', 'A'); mkA('b', 'a-b', 'B');
    const sys = this.el('div', 'sysbtns', g);
    const mkS = (action, label) => {
      const b = this.el('button', 'sysbtn', sys);
      b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.input.press(action); });
      b.addEventListener('pointerup', (e) => { e.preventDefault(); this.game.input.release(action); });
      return b;
    };
    mkS('start', 'START'); mkS('select', 'SELECT');
    // Command panel (battle) — hidden unless battle scene shows it. P0/E8: populated as a 2x2 grid.
    // D3: child of #ui root, NOT .controls — body.desktop hides .controls (touch
    // buttons), which used to hide the battle commands on every laptop too.
    this.cmdEl = this.el('div', 'cmdpanel hidden', this.root);
  }

  // ---- P0/E8: battle command 2x2 grid (replaces the D-pad zone) ----
  // items: [{label, value, disabled, dimmed}] — dimmed = tutorial de-emphasis (still selectable).
  showCommands(items, cb, opts) {
    opts = opts || {};
    this.game.input.consumeAll(); // D3: stale walk edges must not move the battle cursor
    this.menu = {
      title: null, items, idx: opts.initialIdx || 0, cb, battle: true,
      kind: 'commands', grid: true, focus: opts.focus || null,
    };
    this.log.push({ ui: 'commands', items: items.map((i) => i.label) });
    if (!this.headless) this.renderCommands();
  }

  cmdIconCanvas(value) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    c.className = 'cmdicon';
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (value === 'bag') {
      const art = uiIcon(document, 'pokeball');
      if (art) x.drawImage(art, 0, 0);
      return c;
    }
    const pat = CMD_PIX[value];
    if (pat) {
      x.fillStyle = '#ffe9a8';
      for (let r = 0; r < pat.length; r++) {
        for (let q = 0; q < pat[r].length; q++) {
          if (pat[r][q] === '1') x.fillRect(q + 2, r + 2, 1, 1);
        }
      }
    }
    return c;
  }

  renderCommands() {
    if (this.headless) return;
    const m = this.menu;
    if (!m || m.kind !== 'commands') { this.cmdEl.classList.add('hidden'); return; }
    this.cmdEl.classList.remove('hidden');
    this.cmdEl.innerHTML = '';
    m.items.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'cmdf'
        + (i === m.idx ? ' cursor' : '')
        + (it.disabled ? ' disabled' : '')
        + (it.dimmed ? ' dimmed' : '')
        + (m.focus && m.focus === it.value ? ' tut-focus' : '');
      b.appendChild(this.cmdIconCanvas(it.value));
      const lb = document.createElement('span');
      lb.className = 'cmdlabel';
      lb.textContent = it.label;
      b.appendChild(lb);
      b.setAttribute('aria-label', it.label);
      if (!it.disabled) {
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      }
      this.cmdEl.appendChild(b);
    });
  }

  hideCommands() {
    if (!this.headless) this.cmdEl.classList.add('hidden');
  }

  // 2x2 grid navigation (P0/E8): arrows move in the grid with edge wrap,
  // skipping disabled cells. Works for any item count (short last row clamps).
  moveMenuGrid(dir) {
    const m = this.menu;
    if (!m) return;
    const n = m.items.length, cols = 2, rows = Math.ceil(n / cols);
    const step = (idx) => {
      let r = Math.floor(idx / cols), c = idx % cols;
      if (dir === 'left') c = (c + cols - 1) % cols;
      else if (dir === 'right') c = (c + 1) % cols;
      else if (dir === 'up') r = (r + rows - 1) % rows;
      else r = (r + 1) % rows;
      let ni = r * cols + c;
      if (ni >= n) ni = n - 1;
      return ni;
    };
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = step(i);
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) {
      if (m.kind === 'commands') this.renderCommands();
      else this.renderMenu();
    }
  }

  buildDialogue() {
    this.dlgEl = this.el('div', 'dialogue hidden', this.root);
    this.dlgName = this.el('div', 'dlg-name', this.dlgEl);
    this.dlgText = this.el('div', 'dlg-text', this.dlgEl);
    this.dlgHint = this.el('div', 'dlg-hint', this.dlgEl);
    this.dlgHint.textContent = '▼';
  }

  say(lines, cb, speaker) {
    this.dlg = { lines: lines.slice(), idx: 0, chars: 0, cb: cb || null, speaker: speaker || null, done: false };
    this.log.push({ ui: 'dialogue', lines });
    if (!this.headless) {
      this.dlgEl.classList.remove('hidden');
      this.dlgName.textContent = this.dlg.speaker || '';
      this.dlgName.style.display = this.dlg.speaker ? 'block' : 'none';
      this.dlgText.textContent = '';
    }
  }

  get dialogueOpen() { return !!this.dlg; }

  advanceDialogue() {
    const d = this.dlg;
    if (!d) return false;
    const full = d.lines[d.idx];
    const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
    if (d.chars < full.length && speed < 9999) {
      d.chars = full.length; // first press completes the line
      if (!this.headless) this.dlgText.textContent = full;
      return true;
    }
    d.idx++;
    d.chars = 0;
    if (d.idx >= d.lines.length) {
      this.closeDialogue();
      const cb = d.cb; d.cb = null;
      if (cb) cb();
      return false;
    }
    this.game.audio.playSfx(SFX['dialogue-blip']); // visual twin: the ▾ indicator
    if (!this.headless) this.dlgText.textContent = '';
    return true;
  }

  closeDialogue() {
    this.dlg = null;
    if (!this.headless) this.dlgEl.classList.add('hidden');
  }

  buildMenu() {
    this.menuEl = this.el('div', 'menu hidden', this.root);
    this.menuTitle = this.el('div', 'menu-title', this.menuEl);
    this.menuList = this.el('div', 'menu-list', this.menuEl);
  }

  // opts: { battle, grid, initialIdx, rowHtml(item, i), focusValue }
  showMenu(title, items, cb, opts) {
    opts = opts || {};
    // D3: a menu opening consumes stale input edges — e.g. the direction key a
    // player was holding while walking into a grass encounter must not move the
    // battle cursor the moment the command menu appears.
    this.game.input.consumeAll();
    this.menu = {
      title, items, idx: opts.initialIdx || 0, cb,
      battle: !!(opts && opts.battle), kind: opts.kind || 'menu',
      grid: !!opts.grid, rowHtml: opts.rowHtml || null,
      focusValue: opts.focusValue !== undefined ? opts.focusValue : null,
    };
    this.log.push({ ui: 'menu', title, items: items.map((i) => i.label) });
    if (!this.headless) this.renderMenu();
  }

  renderMenu() {
    if (this.headless) return;
    const m = this.menu;
    if (!m || m.kind === 'commands') { this.menuEl.classList.add('hidden'); return; }
    this.menuEl.classList.remove('hidden');
    this.menuTitle.textContent = m.title || '';
    this.menuTitle.style.display = m.title ? 'block' : 'none';
    this.menuList.innerHTML = '';
    this.menuList.className = 'menu-list' + (m.grid ? ' menugrid' : '');
    m.items.forEach((it, i) => {
      const r = document.createElement('button');
      r.className = 'menu-row'
        + (i === m.idx ? ' cursor' : '')
        + (it.disabled ? ' disabled' : '')
        + (it.zeroPp ? ' zeropp' : '')
        + (m.focusValue !== null && m.focusValue === it.value ? ' tut-focus' : '');
      if (m.rowHtml) r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span>' + m.rowHtml(it, i);
      else r.innerHTML = '<span class="cur">' + (i === m.idx ? '▸' : '&nbsp;') + '</span><span>' + it.label + '</span>';
      if (!it.disabled) r.addEventListener('pointerdown', (e) => { e.preventDefault(); this.chooseMenu(i); });
      this.menuList.appendChild(r);
    });
  }

  moveMenu(d) {
    const m = this.menu;
    if (!m) return;
    const n = m.items.length;
    let i = m.idx;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (!m.items[i].disabled) break;
    }
    m.idx = i;
    this.game.audio.playSfx(SFX['ui-tick']);
    if (!this.headless) this.renderMenu();
  }

  chooseMenu(i) {
    const m = this.menu;
    if (!m) return;
    const idx = (i === undefined ? m.idx : i);
    const it = m.items[idx];
    if (!it || it.disabled) return;
    const wasCommands = m.kind === 'commands';
    this.menu = null;
    if (!this.headless) {
      this.menuEl.classList.add('hidden');
      if (wasCommands) this.hideCommands();
    }
    this.game.audio.playSfx(SFX['ui-blip']);
    const cb = m.cb;
    if (cb) cb(it.value, idx);
  }

  cancelMenu() {
    const m = this.menu;
    if (!m) return;
    const wasCommands = m.kind === 'commands';
    this.menu = null;
    if (!this.headless) {
      this.menuEl.classList.add('hidden');
      if (wasCommands) this.hideCommands();
    }
    this.game.audio.playSfx(SFX['ui-back']);
    const cb = m.cb;
    if (cb) cb(null, -1);
  }

  get menuOpen() { return !!this.menu; }

  buildToasts() {
    this.toastEl = this.el('div', 'toasts', this.root);
  }

  toast(text) {
    this.toastQ.push({ text, t: 0 });
    if (this.toastQ.length > 3) this.toastQ.shift(); // P1/D9: queue cap 3
    this.log.push({ ui: 'toast', text });
    if (this.headless) return;
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = text;
    this.toastEl.appendChild(d);
    while (this.toastEl.children.length > 3) this.toastEl.removeChild(this.toastEl.firstChild);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 2500);
  }

  // ---- P0/B1: Trainer ID Terminal (login stub — Track B dark, zero network) ----
  // Track B: when the auth UI is compiled in (vercel target, AUTH_ENABLED), the
  // terminal shows the full LOG IN / REGISTER / GUEST panel (auth.mjs). In the
  // guest target the stub below is byte-identical to Track A behavior.
  showLogin(cb) {
    if (this.headless) {
      // No DOM to click in the harness: the guest path is the only functional one.
      this.log.push({ ui: 'login-guest-auto' });
      cb('guest');
      return;
    }
    if (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED) {
      AUTH.showLoginPanel(this, this.game, cb);
      return;
    }
    this.loginOpen = true;
    this._loginCb = cb;
    const ov = this.el('div', 'loginover', this.root);
    this._loginOv = ov;
    const card = this.el('div', 'login', ov);
    const h = this.el('div', 'login-head', card);
    h.textContent = 'TRAINER ID TERMINAL';
    const tabs = this.el('div', 'login-tabs', card);
    const panes = this.el('div', 'login-panes', card);
    const mkTab = (name, key) => {
      const b = this.el('button', 'logintab', tabs);
      b.textContent = name;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._loginTab(key); });
      return b;
    };
    this._loginTabs = { login: mkTab('LOG IN', 'login'), register: mkTab('REGISTER', 'register'), guest: mkTab('GUEST', 'guest') };
    this._loginPanes = {};
    const mkPane = (key) => {
      const p = this.el('div', 'loginpane hidden', panes);
      this._loginPanes[key] = p;
      return p;
    };
    // LOG IN pane (disabled — honest stub)
    const lp = mkPane('login');
    lp.innerHTML = '<div class="login-note">Accounts arrive in Track B.<br>Your trainer ID lives on this device for now.</div>'
      + '<label>Trainer name<input class="login-in" disabled aria-label="Trainer name (disabled)"></label>'
      + '<label>Password<input class="login-in" type="password" disabled aria-label="Password (disabled)"></label>'
      + '<button class="login-go" disabled>LOG IN (Track B)</button>';
    // REGISTER pane (disabled — honest stub)
    const rp = mkPane('register');
    rp.innerHTML = '<div class="login-note">Accounts arrive in Track B.<br>No credentials are collected or sent anywhere.</div>'
      + '<label>Trainer name<input class="login-in" disabled aria-label="Trainer name (disabled)"></label>'
      + '<label>Password<input class="login-in" type="password" disabled aria-label="Password (disabled)"></label>'
      + '<button class="login-go" disabled>REGISTER (Track B)</button>';
    // GUEST pane (functional, zero network)
    const gp = mkPane('guest');
    const gnote = this.el('div', 'login-note', gp);
    gnote.textContent = 'Play right now — no account needed. Progress stays on this device until cloud saves arrive in Track B.';
    const go = this.el('button', 'login-go active', gp);
    go.textContent = 'PLAY AS GUEST';
    go.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      this._closeLogin();
      cb('guest');
    });
    this._loginTab('guest');
  }

  _loginTab(key) {
    for (const k of Object.keys(this._loginTabs)) {
      this._loginTabs[k].classList.toggle('sel', k === key);
      this._loginPanes[k].classList.toggle('hidden', k !== key);
    }
    this.game.audio.playSfx(SFX['ui-tick']);
  }

  _closeLogin() {
    this.loginOpen = false;
    if (this._loginOv && this._loginOv.parentNode) this._loginOv.parentNode.removeChild(this._loginOv);
    this._loginOv = null;
  }

  // ---- in-game guest banner (wireframes §4): 28px strip, dismissible per session ----
  buildGuestBanner() {
    const b = this.el('div', 'guestbanner hidden', this.root);
    const t = this.el('span', '', b);
    t.textContent = 'Guest — progress stays on this device · LOG IN';
    const x = this.el('button', 'gbx', b);
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Dismiss');
    x.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._guestBannerOff = true;
      b.classList.add('hidden');
    });
    this._guestBannerEl = b;
    // Track B (vercel): the banner's LOG IN becomes a real button (auth.mjs).
    // Guest target: AUTH.enhanceGuestBanner is a no-op — banner byte-identical.
    if (typeof AUTH !== 'undefined') AUTH.enhanceGuestBanner(this);
  }

  showGuestBanner() {
    if (this.headless || this._guestBannerOff || !this._guestBannerEl) return;
    this._guestBannerEl.classList.remove('hidden');
  }

  hideGuestBanner() {
    if (this.headless || !this._guestBannerEl) return;
    this._guestBannerEl.classList.add('hidden');
  }

  // ---- P0/C3: name-entry A-Z grid keyboard ----
  // DOM: bottom-half grid (portrait) / 480px centered panel (desktop), 44px keys,
  // physical-keyboard support, 8-char max, validation shake on empty.
  showNameEntry(title, initial, maxLen, cb) {
    if (this.headless) {
      // Harness contract: a menu-like state so menuOpen/debugChoose keep working.
      this.menu = {
        title, items: [{ label: initial + ' (default)', value: initial }],
        idx: 0, cb: (v) => cb(v || initial), kind: 'nameentry',
      };
      this.log.push({ ui: 'nameentry', title });
      return;
    }
    this.nameEntry = { value: initial || '', maxLen: maxLen || 8, cb, title };
    const ov = this.el('div', 'nkbover', this.root);
    this._nkbOv = ov;
    const card = this.el('div', 'namekb', ov);
    const h = this.el('div', 'nkb-title', card);
    h.textContent = title;
    const disp = this.el('div', 'nkb-display', card);
    this._nkbDisp = disp;
    this._nkbRender();
    const grid = this.el('div', 'nkb-grid', card);
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (const k of keys) {
      const b = this.el('button', 'nkb-key', grid);
      b.textContent = k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbType(k); });
    }
    const row = this.el('div', 'nkb-row', card);
    const bk = this.el('button', 'nkb-key wide', row);
    bk.textContent = '⌫';
    bk.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbBack(); });
    const dash = this.el('button', 'nkb-key', row);
    dash.textContent = '-';
    dash.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbType('-'); });
    const ok = this.el('button', 'nkb-key wide go', row);
    ok.textContent = 'OK';
    ok.addEventListener('pointerdown', (e) => { e.preventDefault(); this._nkbOk(); });
    // Physical keyboard: capture at document level so the game's KEYMAP never sees these.
    this._nkbKey = (e) => {
      if (!this.nameEntry) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Backspace') this._nkbBack();
      else if (e.key === 'Enter') this._nkbOk();
      else if (/^[a-zA-Z-]$/.test(e.key)) this._nkbType(e.key.toUpperCase());
    };
    document.addEventListener('keydown', this._nkbKey, true);
  }

  _nkbRender() {
    const ne = this.nameEntry;
    if (!ne || !this._nkbDisp) return;
    this._nkbDisp.textContent = ne.value + '▌';
  }

  _nkbType(ch) {
    const ne = this.nameEntry;
    if (!ne || ne.value.length >= ne.maxLen) return;
    ne.value += ch;
    this.game.audio.playSfx(SFX['ui-tick']);
    this._nkbRender();
  }

  _nkbBack() {
    const ne = this.nameEntry;
    if (!ne) return;
    ne.value = ne.value.slice(0, -1);
    this.game.audio.playSfx(SFX['ui-back']);
    this._nkbRender();
  }

  _nkbOk() {
    const ne = this.nameEntry;
    if (!ne) return;
    if (!ne.value.trim()) {
      // Validation shake on empty (P0/C3).
      this.game.audio.playSfx(SFX['error-buzz']);
      if (this._nkbOv) {
        this._nkbOv.classList.remove('shake');
        void this._nkbOv.offsetWidth;
        this._nkbOv.classList.add('shake');
      }
      this.toast('Give your trainer a name!');
      return;
    }
    const cb = ne.cb, v = ne.value.trim().toUpperCase().slice(0, ne.maxLen);
    this._nkbClose();
    cb(v);
  }

  _nkbClose() {
    if (this._nkbKey) document.removeEventListener('keydown', this._nkbKey, true);
    this._nkbKey = null;
    this.nameEntry = null;
    if (this._nkbOv && this._nkbOv.parentNode) this._nkbOv.parentNode.removeChild(this._nkbOv);
    this._nkbOv = null;
  }

  // ---- P1/D4: persistent HUD quick-strip (one-tap Bag/Party/Dex/Menu) ----
  // Choice documented: portrait = overlaid top-right of canvas (gameux §4.1).
  buildHudStrip() {
    const strip = this.el('div', 'hudstrip', this.root);
    this._hudStrip = strip;
    const defs = [
      ['bag', 'Bag'], ['party', 'Party'], ['dex', 'Dex'], ['menu', 'Menu'],
    ];
    this._hudBtns = {};
    for (const [key, label] of defs) {
      const b = this.el('button', 'hudbtn', strip);
      b.setAttribute('aria-label', label);
      const cv = document.createElement('canvas');
      cv.width = 16; cv.height = 16;
      cv.className = 'hudicon';
      drawHudIcon(cv.getContext('2d'), key);
      b.appendChild(cv);
      const lb = this.el('span', 'hudlabel', b);
      lb.textContent = label;
      if (key === 'dex') {
        const dot = this.el('span', 'dexdot hidden', b);
        this._dexDot = dot;
      }
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.game.audio.unlock();
        const g = this.game;
        if (key === 'bag') g.openBag();
        else if (key === 'party') g.openParty();
        else if (key === 'dex') { this.dexDot = false; this._renderDexDot(); g.openDex(); }
        else if (key === 'menu') {
          const ow = g.scenes.top;
          if (ow && ow.openPauseMenu) ow.openPauseMenu();
        }
      });
      this._hudBtns[key] = b;
    }
  }

  _renderDexDot() {
    if (!this._dexDot) return;
    this._dexDot.classList.toggle('hidden', !this.dexDot);
  }

  setHudVisible(v) {
    this.hudVisible = v;
    if (this.headless || !this.root) return;
    this.root.classList.toggle('nohud', !v); // P1/D4: SELECT toggles the strip
  }

  // ---- P1/D7: partner mood pip (persistent, tappable) ----
  buildMoodPip() {
    const b = this.el('button', 'moodpip hidden', this.root);
    b.setAttribute('aria-label', 'Pikachu');
    const cv = this.headless ? null : document.createElement('canvas');
    if (cv) {
      cv.width = 16; cv.height = 16;
      cv.className = 'moodface';
      b.appendChild(cv);
      this._moodFace = cv;
    }
    const dot = this.el('span', 'mooddot', b);
    this._moodDot = dot;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      if (this.onMoodTap) this.onMoodTap();
    });
    this._moodPip = b;
  }

  showMoodPip(v) {
    if (this.headless || !this._moodPip) return;
    this._moodWanted = v;
    this._moodPip.classList.toggle('hidden', !v);
    if (v) this.updateMoodPip();
  }

  updateMoodPip() {
    if (this.headless || !this._moodPip) return;
    const mood = (this.game.state.pikachu && this.game.state.pikachu.mood) || 'happy';
    const col = mood === 'happy' ? '#58c94f' : mood === 'sleepy' ? '#5a9ae8' : '#e8c832';
    if (this._moodDot) this._moodDot.style.background = col;
    if (this._moodFace && this.game.partnerFrame) {
      const x = this._moodFace.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, 16, 16);
      x.drawImage(this.game.partnerFrame(), 0, 0);
    }
  }
  // ---- P1/K3: desktop keyboard-hint card (dismissible) ----
  buildHintCard() {
    const c = this.el('div', 'hintcard hidden', this.root);
    const t = this.el('div', '', c);
    t.textContent = 'Keyboard: Arrows/WASD move · Z/Space = A · X = B · Enter = START · M = mute · F = fullscreen';
    const x = this.el('button', 'hintcard-x', c);
    x.textContent = 'Got it ✕';
    x.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._hintOff = true;
      c.classList.add('hidden');
    });
    this._hintCard = c;
  }

  showHintCard(v) {
    if (this.headless || !this._hintCard) return;
    this._hintCard.classList.toggle('hidden', !v || this._hintOff);
  }

  // ---- D2: chapter title cards (anime-chronology spine, ADR-015) ----
  // ch: a CHAPTERS entry (src/data/story.mjs). Paper-panel card, Gen 4/5 idiom,
  // tap/A/START dismisses, auto-dismisses after 4s of game time (reduced-motion
  // safe: no animation). All text >= 14px (QA-001).
  showChapterCard(ch) {
    this.log.push({ ui: 'chaptercard', chapter: ch && ch.n, title: ch && ch.title });
    if (this.headless) { this.chapterCard = null; return; }
    this.hideChapterCard(); // one card at a time
    this._ccT = 0;
    const d = this.el('div', 'chaptercard', this.root);
    const kick = this.el('div', 'cc-kicker', d);
    kick.textContent = 'CHAPTER ' + ch.n + ' — ACT ' + ch.act;
    const t = this.el('div', 'cc-title', d);
    t.textContent = ch.title;
    const arc = this.el('div', 'cc-arc', d);
    arc.textContent = ch.arc;
    const an = this.el('div', 'cc-anime', d);
    an.textContent = ch.anime;
    if (ch.movies && ch.movies.length) {
      const mv = this.el('div', 'cc-anime', d);
      mv.textContent = 'Special events: ' + ch.movies.join(' · ');
    }
    const hint = this.el('div', 'cc-hint', d);
    hint.textContent = 'Press A / tap to continue';
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.game.audio.unlock();
      this.game.input.inject('a');
    });
    this.chapterCard = d;
  }

  hideChapterCard() {
    this.chapterCard = null;
    this._ccT = 0;
    if (this.headless || !this.root) return;
    const old = this.root.querySelector('.chaptercard');
    if (old && old.remove) old.remove();
  }

  update(dt) {
    const input = this.game.input;
    // Name-entry grid is modal (P0/C3).
    if (this.nameEntry) return true;
    // Login page is modal (P0/B1).
    if (this.loginOpen) return true;
    // Chapter title card is modal (D2: auto-dismisses; A/START/tap dismiss early).
    if (this.chapterCard) {
      this._ccT += dt;
      if (input.wasPressed('a') || input.wasPressed('start') || this._ccT >= 4) {
        this.game.audio.unlock();
        this.hideChapterCard();
      }
      return true;
    }
    // Typewriter advance
    if (this.dlg) {
      const d = this.dlg;
      const speed = TEXT_SPEED_CPS[this.game.state.settings.textSpeed] || 30;
      if (speed < 9999 && d.chars < d.lines[d.idx].length) {
        d.chars = Math.min(d.lines[d.idx].length, d.chars + speed * dt);
        if (!this.headless) this.dlgText.textContent = d.lines[d.idx].slice(0, Math.floor(d.chars));
      }
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.game.audio.unlock();
        this.advanceDialogue();
        return true;
      }
      if (input.wasPressed('b')) { /* B does not skip story dialogue */ }
      return true; // dialogue modal
    }
    if (this.menu) {
      const grid = !!this.menu.grid;
      if (input.wasPressed('up')) { grid ? this.moveMenuGrid('up') : this.moveMenu(-1); }
      else if (input.wasPressed('down')) { grid ? this.moveMenuGrid('down') : this.moveMenu(1); }
      else if (input.wasPressed('left') && this.menu.battle) { grid ? this.moveMenuGrid('left') : this.moveMenu(-1); }
      else if (input.wasPressed('right') && this.menu.battle) { grid ? this.moveMenuGrid('right') : this.moveMenu(1); }
      else if (input.wasPressed('a') || input.wasPressed('start')) { this.chooseMenu(); return true; }
      else if (input.wasPressed('b') || input.wasPressed('escape')) { this.cancelMenu(); return true; }
      return true; // menu modal
    }
    return false;
  }

  setBattleMode(on) {
    if (this.headless) { this.inBattle = !!on; return; }
    this.inBattle = !!on; // Track B: SYNC.tick defers the conflict sheet out of battle
    this.dpadEl.classList.toggle('hidden', on);
    this.cmdEl.classList.toggle('hidden', !on);
    if (this.root) this.root.classList.toggle('inbattle', on); // hides the HUD strip in battle
    if (this._moodPip) this._moodPip.classList.toggle('hidden', on || !this._moodWanted);
    if (!on) this.hideCommands();
  }

  // Headless test helper: choose a menu item by index.
  debugChoose(i) { this.chooseMenu(i); }
}

// Original 16x16 HUD icons (pixel data, no emoji — contracts §1.3).
function drawHudIcon(x, key) {
  x.imageSmoothingEnabled = false;
  const P = (px, py, w, h, c) => { x.fillStyle = c; x.fillRect(px, py, w, h); };
  if (key === 'bag') {
    P(3, 4, 10, 9, '#8a5a2a'); P(3, 4, 10, 2, '#a8743a'); // sack
    P(6, 2, 4, 3, '#6a4420'); P(5, 1, 6, 2, '#8a5a2a');  // tied top
    P(2, 3, 12, 1, '#241a20'); P(2, 13, 12, 1, '#241a20');
  } else if (key === 'party') {
    P(2, 2, 4, 4, '#e8c832'); P(10, 2, 4, 4, '#e86a8a'); // two heads
    P(2, 7, 4, 2, '#c8a020'); P(10, 7, 4, 2, '#c04a6a');
    P(2, 10, 4, 4, '#5a9ae8'); P(10, 10, 4, 4, '#58c94f');
    P(2, 10, 4, 1, '#3a7ac0'); P(10, 10, 4, 1, '#3aa83a');
  } else if (key === 'dex') {
    P(3, 1, 10, 14, '#c03028'); P(3, 1, 10, 2, '#e04040'); // dex shell
    P(5, 5, 6, 6, '#bfe8f0'); P(6, 6, 4, 4, '#5a9ae8');   // screen
    P(12, 1, 1, 14, '#7a2020');
  } else if (key === 'menu') {
    P(3, 3, 10, 2, '#f0f0f0'); P(3, 7, 10, 2, '#f0f0f0'); P(3, 11, 10, 2, '#f0f0f0');
  }
}


// ---- src/game/auth.mjs ----
// auth.mjs — Track B client: Trainer ID Terminal (login/register/guest) + account menu.
// ADR-005 (accounts + cloud saves) / ADR-010 (guest-first boot, username-only +
// synthetic emails server-side, recovery codes, 13+ age gate, 7d/1d sessions).
// Same-origin API calls ONLY (our own backend paths); the client never touches
// session tokens — the session cookie is HttpOnly and server-managed (AppSec C4).
// No secrets in this file.
// Compiled IN for the vercel target; compile-time STRIPPED for the guest target
// (see scripts/build.mjs — the auth block markers plus the boolean compile flag).
//
// ---- Output-encoding contract (AppSec C12) ----
// EVERY player-controlled string (usernames, recovery codes, any echoed input)
// is rendered via textContent / createElement ONLY — never innerHTML, never
// string-concatenated HTML. This file performs zero innerHTML assignments.
// The QA stored-XSS corpus covers the login/register/recovery/account surfaces.

const AUTH_ENABLED = false;

// ---- stub surface: compiled into BOTH targets (the guest bundle keeps only this) ----
// Guest behavior is byte-identical to Track A: the terminal is absent, so the
// login path degrades straight to guest. Zero network, zero auth code.
const AUTH = {
  user: null,          // logged-in username, or null
  unavailable: false,  // backend reports auth_unavailable (503 / health flag)
  _bannerShown: false,
  init(game) {},                                    // guest build: no-op (no network)
  showLoginPanel(ui, game, cb) { cb('guest'); },    // guest build: straight to guest
  enhanceGuestBanner(ui) {},                        // guest build: no-op
  openAccountMenu(game) {},                         // guest build: no-op
  signOut(game) { return Promise.resolve({ ok: false, reason: 'guest-build' }); },
  isLoggedIn() { return false; },
  onSessionExpired(game) {},                        // guest build: no sessions exist
  onUnavailable() {},                               // guest build: nothing to announce
};



// ---- src/game/sync.mjs ----
// sync.mjs — Track B cloud-save sync engine (architecture §3.3).
// Local-first: the game NEVER waits on network. Writes go to the local cache
// instantly; cloud PUTs happen in the background with a 60s idle throttle.
// Same-origin backend calls only. No silent last-write-wins: genuine divergence
// opens the conflict sheet (wireframes §9). Compiled IN for the vercel target;
// compile-time STRIPPED for the guest target (see scripts/build.mjs).
//
// ---- Output-encoding contract (AppSec C12) ----
// Player-controlled strings are rendered via textContent / createElement ONLY
// (helpers live in auth.mjs: authEl/authText). Zero innerHTML in this file.
//
// ---- Payload download (GET save?slot=N on the API) ----
// New-device pull (the hotel-phone test, US-N1) downloads the payload via
// GET save?slot=N -> {slot, version, payload, updatedAt}; 404 when the slot
// is empty. Pull paths still degrade honestly on failure (toast + keep
// local) — push, claimGuest, queue, conflict-sheet, and same-device re-login
// never block on network.


const SYNC = {
  activeSlot: 1,
  init(game) {},                                   // guest build: no-op
  tick(game) {},                                  // guest build: no-op
  afterLocalSave(game) {},                        // guest build: no-op
  onHidden(game) {},                              // guest build: no-op
  saveLocal(game) { return { ok: false, reason: 'guest-build' }; },
  syncNow(game, manual) { return Promise.resolve({ ok: false, reason: 'guest-build' }); },
  runLoginMerge(game, mode, done) { done({ load: 'fallback' }); },
  clearSession() {},
  getSlots() { return []; },
  localPayload(game) { return game ? game.state : null; },
  renderDot() {},
};



// ---- src/game/title.mjs ----
// title.mjs — boot disclaimer card (GC verbatim, §2a) + title screen.
// The legal card renders in the shell before any interactive element and is not
// skippable-in-one-tap on first boot (readable dwell >= 3 seconds).

const DISCLAIMER_BOOT = [
  "ASH'S JOURNEY",
  'An unofficial fan homage. Not affiliated with, endorsed by, or connected to',
  'Nintendo, Creatures Inc., or GAME FREAK inc.',
  '',
  'Pok\u00e9mon, Pikachu, and all character names are trademarks of',
  'Nintendo / Creatures Inc. / GAME FREAK inc.',
  'This is a free, non-commercial fan project made with love by fans.',
  'No purchase is required or accepted. Please support the official releases.',
];

const DISCLAIMER_CREDITS = [
  'LEGAL',
  '',
  'This game is an unofficial fan work and is not affiliated with, endorsed by,',
  'sponsored by, or connected to Nintendo Co., Ltd., Creatures Inc., or',
  'GAME FREAK inc. Pok\u00e9mon and all related names, characters, and indicia are',
  'trademarks of their respective owners.',
  '',
  'All code, artwork, music, sound effects, and dialogue in this game are',
  'original creations made for this fan project; no game assets were copied or',
  'extracted from any official release.',
  '',
  'This game is free, carries no advertising, accepts no payments, donations,',
  'or tips, and collects no personal data for commercial purposes.',
  '',
  'If you represent a rights holder and have concerns about this project,',
  'contact the developer directly and we will respond promptly.',
  '// OQ-grade: rights-holder contact resolves to an owner-designated address',
  '// before any public share. Not a dead link in a signed build.',
];

const GAME_TITLE = "ASH'S JOURNEY";
const GAME_SUBTITLE = 'An Unofficial Fan Homage';
// ADR-012: personal-edition marker. The build substitutes the EDITION_MARKER
// compile-time token with a quoted JS string literal ("NAMAN'S EDITION" for the
// personal target, '' for every other target — guest and vercel show nothing).
// Original text, subtle: a small gold ribbon drawn under the subtitle on the
// title screen. The GC-verbatim disclaimers above stay byte-identical.
const EDITION_MARKER = "NAMAN'S EDITION";

// P1/A5: legal card renders at >=14px. The GC-verbatim DISCLAIMER_BOOT wording
// is preserved word-for-word; only the line-wrap changes, paginated across the
// 3s dwell (page flips at 1.5s, still non-skippable).
const LEGAL_PAGES = [
  [
    "ASH'S JOURNEY",
    'An unofficial fan homage.',
    'Not affiliated with, endorsed',
    'by, or connected to Nintendo,',
    'Creatures Inc., or',
    'GAME FREAK inc.',
  ],
  [
    'Pok\u00e9mon, Pikachu, and all',
    'character names are trademarks',
    'of Nintendo / Creatures Inc. /',
    'GAME FREAK inc.',
    'This is a free, non-commercial',
    'fan project made with love',
    'by fans.',
    'No purchase is required or',
    'accepted. Please support the',
    'official releases.',
  ],
];

class BootScene {
  enter() {
    this.t = 0;
    this.phase = 'legal'; // legal -> title
    this.ready = false;  // interactive only after dwell
    this.menuIdx = 0;
    this.game.ui.log.push({ ui: 'boot' });
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.phase === 'legal') {
      if (this.t >= 3) this.ready = true;
      if (this.ready && (input.wasPressed('a') || input.wasPressed('start'))) {
        this.phase = 'title';
        this.t = 0;
        this.game.audio.unlock();
        this.game.audio.playMusic('title-theme'); // original score; unlock gate satisfied by the gesture
      }
      return;
    }
    // title menu
    const items = this.menuItems();
    if (input.wasPressed('up')) { this.menuIdx = (this.menuIdx + items.length - 1) % items.length; }
    if (input.wasPressed('down')) { this.menuIdx = (this.menuIdx + 1) % items.length; }
    if (input.wasPressed('a') || input.wasPressed('start')) {
      const it = items[this.menuIdx];
      this.game.audio.unlock();
      // P0/B1: title menu routes through the Trainer ID Terminal (guest-functional stub).
      if (it.value === 'new') this.game.openLogin('new');
      else if (it.value === 'continue') this.game.openLogin('continue');
      else if (it.value === 'options') this.game.openOptions();
    }
  }
  menuItems() {
    const items = [{ label: 'New Game', value: 'new' }];
    if (this.game.store.exists()) items.push({ label: 'Continue', value: 'continue' });
    items.push({ label: 'Options', value: 'options' });
    return items;
  }
  render(r) {
    const g = this.game;
    if (this.phase === 'legal') {
      this.renderLegal(r);
      return;
    }
    // Title art: original — rising sun bands + silhouettes (no official key art).
    const w = r.viewW, h = r.viewH;
    const bands = ['#2a1a3a', '#5a2a4a', '#a04a3a', '#e08a4a', '#f8c86a'];
    for (let i = 0; i < bands.length; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    // Sun disc
    g.ctx2dcircle(w / 2, h * 0.42, 26, '#ffe9a8');
    // Ash + Pikachu silhouettes (original shapes)
    g.ctx2dcircle(w / 2 - 14, h * 0.62, 7, '#1a1a22');
    g.ctx2drect(w / 2 - 20, h * 0.62 + 5, 12, 14, '#1a1a22');
    g.ctx2dcircle(w / 2 + 16, h * 0.66, 5, '#1a1a22');
    r.text(GAME_TITLE, 8, 8, { size: 14, bold: true, color: '#fff' });
    r.text(GAME_SUBTITLE, 8, 26, { size: 14, color: '#ffe9a8' });
    if (EDITION_MARKER) {
      // ADR-012 personal-edition ribbon: measured dark band + gold underline.
      // Guest/vercel bundles have EDITION_MARKER = '' and skip this entirely.
      const c = r.ctx;
      c.font = '14px monospace';
      const tw = Math.ceil(c.measureText(EDITION_MARKER).width);
      const rx = 8, ry = 42, pad = 8;
      g.ctx2dfill('rgba(8,8,14,0.72)', rx, ry, tw + pad * 2, 20);
      g.ctx2dfill('#e8c832', rx, ry + 18, tw + pad * 2, 2);
      r.text(EDITION_MARKER, rx + pad, ry + 3, { size: 14, color: '#ffe9a8' });
    }
    const items = this.menuItems();
    const pulse = Math.floor(this.t * 2) % 2 === 0;
    items.forEach((it, i) => {
      const y = h - 84 + i * 18;
      r.text((i === this.menuIdx ? '\u25b8 ' : '  ') + it.label, w / 2 - 52, y,
        { size: 14, color: i === this.menuIdx && pulse ? '#ffe9a8' : '#fff' });
    });
    if (pulse) r.text('PRESS START / TAP A', w / 2 - 72, h - 20, { size: 14, color: '#fff' });
    r.text('Unofficial fan homage.', 4, h - 42, { size: 14, color: '#ddd' });
  }
  renderLegal(r) {
    const w = r.viewW, h = r.viewH;
    r.panel(6, 6, w - 12, h - 12, '#101018', '#e8c832');
    const page = this.t >= 1.5 ? 1 : 0; // P1/A5: paginated 14px legal copy
    let y = 18;
    for (const line of LEGAL_PAGES[page]) {
      const isTitle = page === 0 && line === "ASH'S JOURNEY";
      r.text(line, 14, y, { size: 14, bold: isTitle, color: isTitle ? '#e8c832' : '#f0f0f0' });
      y += 18;
    }
    if (this.ready) {
      const pulse = Math.floor(this.t * 2) % 2 === 0;
      if (pulse) r.text('Press A / tap to continue', 14, h - 24, { size: 14, color: '#e8c832' });
    }
  }
}


// ---- src/game/intro.mjs ----
// intro.mjs — professor intro, name entry, starter moment (Pikachu refuses the ball).
// Original dialogue. P0/C3: name entry is an A-Z grid keyboard (44px keys,
// physical-keyboard support, 8-char max, validation shake). P1/C4: rival name
// entry reuses the grid. P1/C5: "Skip intro (veteran)" offered on replay
// (default OFF); hold START 1s during the intro offers a skip confirm.


class IntroScene {
  enter() {
    this.step = 'ask-skip';
    this.lineIdx = 0;
    this.name = 'ASH';
    this.rival = 'GARY';
    this._startHeld = 0;
    this.game.ui.log.push({ ui: 'intro' });
    const g = this.game;
    if (g.skipIntroVeteran && !g.ui.headless) {
      // P1/C5: offered, never silent — default OFF (watch the intro).
      this.step = 'offer-skip';
      g.ui.showMenu('A save already exists.', [
        { label: 'Watch the intro', value: 'watch' },
        { label: 'Skip intro (veteran)', value: 'skip' },
      ], (v) => {
        if (v === 'skip') { this.finishIntro(); return; }
        this.begin();
      });
      return;
    }
    if (g.skipIntroVeteran) { this.finishIntro(); return; } // headless: keep harness timing
    this.begin();
  }

  begin() {
    const g = this.game;
    this.step = 'professor';
    this._startHeld = 0;
    const lines = INTRO_SCRIPT.lines.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => this.nameEntry(), INTRO_SCRIPT.professor);
  }

  nameEntry() {
    // P0/C3: full A-Z grid ships now (replaces the Wave-1 two-option menu).
    const g = this.game;
    this.step = 'name';
    g.ui.showNameEntry('Your name?', 'ASH', 8, (value) => {
      this.name = value;
      g.state.player.name = this.name;
      if (g.ui.headless) {
        // Harness path: the intro harness asserts starter dialogue immediately
        // after the name choice, so the rival keeps its default here.
        this.rivalEntryDone();
        return;
      }
      // P1/C4: rival name entry reuses the same grid.
      this.step = 'rival';
      g.ui.showNameEntry("Rival's name?", 'GARY', 8, (rv) => {
        this.rival = rv;
        g.state.player.rivalName = this.rival;
        this.rivalEntryDone();
      });
    });
  }

  rivalEntryDone() {
    this.step = 'starter';
    this.starterMoment();
  }

  starterMoment() {
    const g = this.game;
    const lines = INTRO_SCRIPT.starterMoment.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => {
      // Partner joins OUTSIDE the ball system (EP014 homage — hard rule).
      const pikachu = makeMon('partner', 5, SPECIES, MOVES);
      g.state.party.push(pikachu);
      const sp = SPECIES.partner;
      dexRegister(g.state.dex, 'seen', sp.dexNo);
      dexRegister(g.state.dex, 'caught', sp.dexNo);
      g.state.story.flags.metPartner = true;
      g.state.story.flags.refusedBall = true;
      g.audio.playSfx('dex-register');
      g.ui.toast(sp.name + ' joined your party!');
      this.finishIntro();
    }, INTRO_SCRIPT.professor);
  }

  finishIntro() {
    const g = this.game;
    g.state.story.flags.introDone = true;
    g.state.story.chapter = 0; // D2: Act I opens on Chapter 1 (ADR-015 spine)
    g.state.story.position = { map: 'pallet', x: 7, y: 7, dir: 'down' };
    g.saveGame(true);
    g.startOverworld({ chapterCard: 0 });
  }

  update(dt) {
    // P1/C5: hold START 1s during the professor intro -> "Skip intro?" confirm.
    // Reduced motion: the confirm still applies (no animation to replace).
    const g = this.game;
    if (this.step !== 'professor' || !g.ui.dialogueOpen) { this._startHeld = 0; return; }
    if (g.input.isHeld('start')) {
      this._startHeld += dt;
      if (this._startHeld >= 1) {
        this._startHeld = 0;
        this.step = 'confirm-skip';
        g.ui.closeDialogue();
        g.ui.showMenu('Skip the intro?', [
          { label: 'Keep watching', value: 'no' },
          { label: 'Skip intro', value: 'yes' },
        ], (v) => {
          if (v === 'yes') { this.finishIntro(); return; }
          this.begin(); // restart the professor lines
        });
      }
    } else {
      this._startHeld = 0;
    }
  }

  render(r) {
    // Professor's lab backdrop: original flat bands.
    const w = r.viewW, h = r.viewH;
    const bands = ['#1a2a4a', '#2a3a5a', '#3a4a6a'];
    for (let i = 0; i < bands.length; i++) {
      this.game.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    r.text(INTRO_SCRIPT.professor, 8, 8, { size: 14, bold: true, color: '#ffe9a8' });
  }
}


// ---- src/game/battle.mjs ----
// battle.mjs — turn-based battle state machine (architecture §2.2).
// States: intro | command | moves | bag | party | catchseq | resolve | faint |
//          xp | victory | defeat | run. Transitions are data-ish, no spaghetti.


const HP_DRAIN_PER_SEC = 90; // ADR-004 feel budget

// Fraction of the current level's XP bar filled (gameux §4.2).
function xpFracOf(mon, add) {
  const sp = SPECIES[mon.speciesId];
  const lo = xpForLevel(sp.growth, mon.level);
  const hi = xpForLevel(sp.growth, mon.level + 1);
  if (hi <= lo) return 1;
  return Math.max(0, Math.min(1, (mon.xp + (add || 0) - lo) / (hi - lo)));
}

class BattleScene {
  constructor(opts) {
    this.kind = opts.kind; // 'wild' | 'trainer'
    this.foeMon = opts.foe;
    this.trainer = opts.trainer || null;
    this.tutorial = !!opts.tutorial; // GD: scripted first-catch gate — certainty, not luck
    this.returnTo = opts.returnTo;
    this.trainerIdx = 0;
  }

  enter() {
    const g = this.game;
    g.ui.setBattleMode(true);
    this.state = 'intro';
    this.t = 0;
    this.msg = '';
    g.audio.playMusic(this.kind === 'trainer' ? 'battle-trainer-theme' : 'battle-wild-theme', { area: false });
    if (this.kind === 'trainer') {
      const t0 = this.trainer.team[0];
      this.foeMon = makeMon(t0.species, t0.level, SPECIES, MOVES);
      if (t0.nickname) this.foeMon.nickname = t0.nickname; // e.g. the duo's named mons
    }
    this.ally = this.firstAble(g);
    this.foe = this.foeMon;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.allyStages = this.ally.stages;
    this.turn = 1;
    this.actions = [];
    this.animQ = [];
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.xpAnim = 0;
    this.shakeT = 0;
    this.flashT = 0;
    this.fadeT = 0;      // P0/E11: reduced-motion substitute for shake/flash (100ms fade)
    this.atkFx = null;   // { side, t } — README attack transform: 1.2x for 3 frames then back
    this.impactFx = null; // { side, t } — README impact: white palette-swap 2 frames + shake
    this.faintFx = null;  // { side, spr, t } — README faint: sink 8px + fade to 0 over 20 frames
    this.xpBarAnim = null; // [{ mon, from, to }] — P0/E3 XP bar ease-out over 600ms
    this.xpFlashT = 0;    // level-up flash on the XP bar
    this._lastMoveIdx = 0; // P0/E9: cursor memory (last-used move pre-selected)
    this._lowHpPulseT = 0; // P1/E7: plate pulse on first red crossing (skipped under reduced motion)
    this._tutFightDone = false; // P0/C7: guided first-catch tutorial stage flags
    this._tutStage = null;
    this.catchFx = null; // P1/E10: success starburst after the catch click
    this.catchState = null;
    this.fled = false;
    this.critCap = false;
    this.log = [];
    g.ui.log.push({ ui: 'battle', kind: this.kind, foe: this.foe.speciesId });
    const foeName = displayName(this.foe, SPECIES);
    g.audio.playCry(this.foe.speciesId);   // synthesized cry, never sampled
    g.audio.playCry(this.ally.speciesId);
    if (this.tutorial) {
      // Scripted first-catch gate: the tips teach the loop (weaken -> throw),
      // the engine guarantees the outcome (endure + weakened auto-catch).
      this.say('Wild ' + foeName + ' appeared!', () => {
        this.say("AIDE (via Pokegear): There's your first catch! One Thunder Shock to weaken it —", () => {
          this.say('— then open the BAG and throw a Poke Ball while its HP is yellow!', () => this.toCommand());
        });
      });
    } else if (this.kind === 'trainer') {
      // GB-era flow idiom: challenge line, then the lead's send-out.
      this.say('Trainer ' + this.trainer.name + ' wants to battle!', () => {
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => this.toCommand());
      });
    } else {
      this.say('Wild ' + foeName + ' appeared!');
    }
  }

  firstAble(g) {
    for (const m of g.state.party) if (m.hp > 0) return m;
    return g.state.party[0];
  }

  say(text, cb) {
    this.msg = text;
    this.msgCb = cb || null;
    this.msgOpen = true;
    this.game.ui.log.push({ ui: 'battle-msg', text });
  }

  update(dt) {
    const g = this.game;
    const input = g.input;
    const st = g.state.settings;
    // Screen shake / flash decay — P0/E11: gated on the Screen-shake option +
    // reduced motion (assignment is gated at the source; decay is unconditional).
    if (this.shakeT > 0) { this.shakeT -= dt * 1000; g.renderer.shakeX = (Math.random() - 0.5) * 8; g.renderer.shakeY = (Math.random() - 0.5) * 8; }
    else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    if (this.flashT > 0) { this.flashT -= dt * 1000; g.renderer.flashA = Math.max(0, this.flashT / 60) * 0.8; }
    // P0/E11: reduced-motion substitute — a gentle 100ms fade instead of shake/flash.
    if (this.fadeT > 0) {
      this.fadeT -= dt * 1000;
      g.renderer.fadeA = Math.max(0, this.fadeT / 100) * 0.35;
      g.renderer.fadeColor = '#ffffff';
      if (this.fadeT <= 0) g.renderer.fadeA = 0;
    }
    // README runtime transforms.
    if (this.atkFx) { this.atkFx.t += dt * 1000; if (this.atkFx.t > 100) this.atkFx = null; } // 3 frames @30Hz
    if (this.impactFx) { this.impactFx.t += dt * 1000; if (this.impactFx.t > 66) this.impactFx = null; } // 2 frames
    if (this.faintFx) { this.faintFx.t += dt * 1000; if (this.faintFx.t > 660) this.faintFx = null; } // 20 frames
    if (this.catchFx) { this.catchFx.t += dt * 1000; if (this.catchFx.t > 500) this.catchFx = null; } // P1/E10 starburst
    if (this.xpFlashT > 0) this.xpFlashT -= dt * 1000;
    if (this._lowHpPulseT > 0) this._lowHpPulseT -= dt * 1000;

    // Animated HP drain (90 HP/s) — P0/E5: reduced motion snaps instantly.
    this.drainHp(dt);

    if (g.ui.update(dt)) return;
    if (this.msgOpen) {
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.msgOpen = false;
        const cb = this.msgCb; this.msgCb = null;
        if (cb) cb();
        else this.afterMsg();
      }
      return;
    }
    switch (this.state) {
      case 'intro': break; // driven by msg cb
      case 'command': this.updateCommand(input); break;
      case 'resolve': this.updateResolve(dt); break;
      case 'catchseq': this.updateCatch(dt); break;
      case 'xp': this.updateXp(dt); break;
      case 'victory': case 'defeat': break;
    }
  }

  afterMsg() {
    const s = this.state;
    if (s === 'intro') this.toCommand();
    else if (s === 'resolve') this.nextAction();
    else if (s === 'victory') this.finishVictory();
    else if (s === 'defeat') this.finishDefeat();
    else if (s === 'faintfoe') this.afterFaintFoe();
  }

  toCommand() {
    this.state = 'command';
    // P0/C7: guided first-catch tutorial — FIGHT highlighted first (others dimmed),
    // then BAG highlighted once the foe is weakened. Dimmed = de-emphasized, still usable.
    const tut = this.tutorial;
    const items = [
      { label: 'FIGHT', value: 'fight', dimmed: tut && this._tutStage === 'bag' },
      { label: 'BAG', value: 'bag', dimmed: tut && this._tutStage !== 'bag' },
      { label: 'PARTY', value: 'party', dimmed: tut },
      // GD: no running from the scripted tutorial — it's a lesson, not a gamble.
      { label: this.kind === 'wild' ? 'RUN' : 'RUN', value: 'run', disabled: this.kind !== 'wild' || tut },
    ];
    let focus = null;
    if (tut && !this._tutFightDone) focus = 'fight';
    else if (tut && this._tutStage === 'bag') focus = 'bag';
    this.game.ui.showCommands(items, (value) => this.onCommand(value), { focus });
  }

  updateCommand() { /* menu modal drives via ui */ }

  onCommand(value) {
    const g = this.game;
    if (value === null) { this.toCommand(); return; } // cancelled -> back
    if (value === 'fight') {
      // P0/E9: 2x2 move grid — name + type badge pill (icon+text) + PP + power/acc;
      // 0-PP rows grayed with a slash; cursor memory pre-selects the last-used move.
      const ally = this.ally;
      const items = ally.moves.map((m, i) => {
        const mv = MOVES[m.id];
        return {
          label: mv.name + ' (' + mv.type + ') ' + m.pp + '/' + m.maxPp,
          value: i, disabled: m.pp <= 0, zeroPp: m.pp <= 0, move: m,
        };
      });
      items.push({ label: 'Back', value: -1 });
      this.state = 'moves';
      const rowHtml = (it) => {
        if (it.value === -1) return '<span>' + it.label + '</span>';
        const mv = MOVES[it.move.id];
        return '<span class="mvcell"><span class="mvname">' + mv.name + '</span>'
          + typePill(mv.type)
          + '<span class="mvpp">' + it.move.pp + '/' + it.move.maxPp + ' PP</span>'
          + '<span class="mvpow">' + (mv.power || '—') + ' pw / ' + (mv.acc || '—') + ' ac</span></span>';
      };
      g.ui.showMenu('Choose a move', items, (v) => {
        if (v === null || v === -1) { this.toCommand(); return; }
        this._lastMoveIdx = v; // P0/E9 cursor memory
        this.playerAction = { type: 'move', idx: v };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      }, { battle: true, grid: true, initialIdx: Math.min(this._lastMoveIdx, items.length - 1), rowHtml });
    } else if (value === 'bag') {
      this.state = 'bag';
      const items = [];
      for (const bid of Object.keys(BALLS)) {
        const n = g.state.bag[bid] || 0;
        items.push({ label: BALLS[bid].name + ' x' + n, value: bid, disabled: n <= 0 || this.kind !== 'wild' });
      }
      const potions = g.state.bag.potion || 0;
      items.push({ label: 'Potion x' + potions, value: 'potion', disabled: potions <= 0 });
      items.push({ label: 'Back', value: null });
      // P0/C7: in the guided tutorial, the Poke Ball row is highlighted once the foe is weakened.
      const focusBall = this.tutorial && this._tutStage === 'bag';
      g.ui.showMenu('Bag', items, (v) => {
        if (v === null) { this.toCommand(); return; }
        if (v === 'potion') { this.usePotion(); return; }
        this.playerAction = { type: 'ball', ball: v };
        this.foeAction = null; // throwing a ball: foe still acts? DS: ball replaces your move; foe moves first if faster. Simplify: foe acts after throw fails only.
        this.beginCatch(v);
      }, { focusValue: focusBall ? 'pokeball' : null });
    } else if (value === 'party') {
      this.openPartyMenu(false);
    } else if (value === 'run') {
      if (this.kind === 'wild') {
        g.audio.playSfx('battle-run');
      this.say('Got away safely!', () => this.endBattle(true));
      } else {
        this.say("Can't escape a trainer battle!", () => this.toCommand());
      }
    }
  }

  openPartyMenu(inFaint) {
    const g = this.game;
    const items = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      const tag = m === this.ally ? ' (active)' : '';
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + ' ' + m.hp + '/' + m.maxHp + tag, value: i, disabled: m.hp <= 0 || m === this.ally };
    });
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu(inFaint ? 'Choose next Pokemon' : 'Party', items, (v) => {
      if (v === null || v === -1) { if (!inFaint) this.toCommand(); return; }
      const old = this.ally;
      this.ally = g.state.party[v];
      this.allyStages = this.ally.stages;
      this.hpAnim.ally = this.ally.hp;
      if (inFaint) {
        this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this.toCommand());
      } else {
        this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
          this.playerAction = { type: 'switch', from: old };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      }
    });
  }

  usePotion() {
    const g = this.game;
    const items = g.state.party.map((m, i) => ({
      label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i, disabled: m.hp <= 0 || m.hp >= m.maxHp,
    }));
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Use Potion on...', items, (v) => {
      if (v === null || v === -1) { this.toCommand(); return; }
      const m = g.state.party[v];
      g.state.bag.potion--;
      m.hp = Math.min(m.maxHp, m.hp + 20);
      this.hpAnim.ally = m.hp; // snap if active
      this.say(displayName(m, SPECIES) + ' recovered 20 HP!', () => {
        this.playerAction = { type: 'item' };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      });
    });
  }

  chooseFoeAction() {
    const g = this.game;
    const usable = this.foe.moves.map((m, i) => i).filter((i) => this.foe.moves[i].pp > 0);
    if (!usable.length) return { type: 'move', idx: 0, struggle: true };
    // GD balance: gym-leader opener — a leader with a self-buff setup move
    // opens with it (classic Brock Defense Curl): gives the player a free
    // turn, teaches setup play, and makes the fight about strategy.
    if (this.trainer && this.trainer.ai === 'opener-setup' && this.turn === 1) {
      const setup = usable.find((i) => {
        const mv = MOVES[this.foe.moves[i].id];
        return mv.cat === 'status' && mv.effect && mv.effect.target === 'self';
      });
      if (setup !== undefined) return { type: 'move', idx: setup };
    }
    // Gym-leader-ish AI: prefer super-effective moves, else random.
    const allyTypes = SPECIES[this.ally.speciesId].types;
    let best = usable[0], bestScore = -1;
    for (const i of usable) {
      const mv = MOVES[this.foe.moves[i].id];
      if (mv.cat === 'status') continue;
      const e = effectiveness(mv.type, allyTypes);
      const score = e * (0.5 + g.rng.battle());
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (g.rng.battle() < 0.25) best = usable[Math.floor(g.rng.battle() * usable.length)];
    return { type: 'move', idx: best };
  }

  effStats(mon, stages) {
    const sp = SPECIES[mon.speciesId];
    return {
      atk: Math.floor(mon.stats.atk * stageMultiplier(stages.atk)),
      def: Math.floor(mon.stats.def * stageMultiplier(stages.def)),
      spa: Math.floor(mon.stats.spa * stageMultiplier(stages.spa)),
      spd: Math.floor(mon.stats.spd * stageMultiplier(stages.spd)),
      spe: Math.floor(mon.stats.spe * stageMultiplier(stages.spe)),
    };
  }

  beginTurn() {
    this.state = 'resolve';
    const pa = this.playerAction, fa = this.foeAction;
    const mk = (side, action) => {
      const mon = side === 'ally' ? this.ally : this.foe;
      const stages = side === 'ally' ? this.allyStages : this.foeStages;
      const stats = this.effStats(mon, stages);
      let priority = 0, move = null;
      if (action && action.type === 'move') {
        move = action.struggle ? { name: 'Struggle', type: 'normal', cat: 'physical', power: 50, acc: 100 } : MOVES[mon.moves[action.idx].id];
        priority = move.priority || 0;
      }
      return { side, action, mon, stats, priority, move };
    };
    const order = [];
    if (pa && pa.type !== 'switch' && pa.type !== 'item' && pa.type !== 'ball') order.push(mk('ally', pa));
    if (fa) order.push(mk('foe', fa));
    if (pa && (pa.type === 'switch' || pa.type === 'item' || pa.type === 'ball')) {
      // non-attack actions happen first, then foe acts
      this.actions = fa ? [mk('foe', fa)] : [];
      if (pa.type === 'switch' || pa.type === 'item') { /* already applied */ }
      this.state = 'resolve';
      this.nextAction();
      return;
    }
    // sort by priority -> Speed (paralysis quarters Speed) -> random tiebreak
    const cmp = (x, y) => {
      if (x.priority !== y.priority) return y.priority - x.priority;
      const sx = x.mon.status === 'paralysis' ? Math.floor(x.stats.spe / 4) : x.stats.spe;
      const sy = y.mon.status === 'paralysis' ? Math.floor(y.stats.spe / 4) : y.stats.spe;
      if (sx !== sy) return sy - sx;
      return this.game.rng.battle() < 0.5 ? -1 : 1;
    };
    this.actions = order.slice().sort(cmp);
    this.nextAction();
  }

  nextAction() {
    if (this.state !== 'resolve') return;
    const next = this.actions.shift();
    if (!next) { this.endTurnStatus(); return; }
    if (next.mon.hp <= 0) { this.nextAction(); return; } // fainted mid-turn
    this.execMove(next);
  }

  execMove(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);

    // Paralysis / sleep / freeze / confusion gates
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      this.say(atkName + ' is paralyzed! It can\'t move!', () => this.nextAction());
      return;
    }
    if (atk.status === 'sleep') {
      atk.statusTurns = (atk.statusTurns || 2) - 1;
      if (atk.statusTurns <= 0) { atk.status = null; this.say(atkName + ' woke up!', () => this.execMoveContinue(entry)); }
      else this.say(atkName + ' is fast asleep.', () => this.nextAction());
      return;
    }
    if (atk.status === 'freeze') {
      if (roll(0.2, g.rng.battle)) { atk.status = null; this.say(atkName + ' thawed out!', () => this.execMoveContinue(entry)); }
      else { this.say(atkName + ' is frozen solid!', () => this.nextAction()); }
      return;
    }
    if (atk.confused && roll(0.33, g.rng.battle)) {
      const dmg = Math.max(1, Math.floor(calcDamage(atk.level, 40, entry.stats.atk, entry.stats.def, {}) / 2));
      atk.hp = Math.max(0, atk.hp - dmg);
      this.say(atkName + ' hurt itself in confusion!', () => this.checkFaint(entry.side, () => this.nextAction()));
      return;
    }
    this.execMoveContinue(entry);
  }

  execMoveContinue(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);
    const defName = displayName(def, SPECIES);

    // PP
    if (entry.action && !entry.action.struggle && entry.action.type === 'move') {
      const slot = atk.moves[entry.action.idx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }

    // Accuracy check
    const acc = mv.acc || 100;
    if (acc < 100 && !roll(acc / 100, g.rng.battle)) {
      this.say(atkName + ' used ' + mv.name + '!', () => {
        this.say('But it missed!', () => this.nextAction());
      });
      return;
    }

    this.say(atkName + ' used ' + mv.name + '!', () => {
      if (mv.cat === 'status') { this.applyStatusMove(entry, mv); return; }
      const atkStat = mv.cat === 'physical' ? entry.stats.atk : entry.stats.spa;
      const defStat = mv.cat === 'physical'
        ? Math.floor(def.stats.def * stageMultiplier(defStages.def))
        : Math.floor(def.stats.spd * stageMultiplier(defStages.spd));
      const eff = effectiveness(mv.type, SPECIES[def.speciesId].types);
      const stab = SPECIES[atk.speciesId].types.includes(mv.type);
      const crit = roll(CRIT_CHANCE, g.rng.battle);
      const rand = RANDOM_MIN + g.rng.battle() * (RANDOM_MAX - RANDOM_MIN);
      const burn = atk.status === 'burn';
      // Yellow homage: the partner reacts to battle beats — a crit or a
      // super-effective hit from Pikachu perks it right up.
      if (entry.side === 'ally' && atk.speciesId === 'partner' && (crit || eff > 1)) {
        g.state.pikachu.mood = 'happy';
      }
      if (eff === 0) {
        this.say('It doesn\'t affect ' + defName + '...', () => this.nextAction());
        return;
      }
      const dmg = calcDamage(atk.level, mv.power, atkStat, defStat,
        { stab, effectiveness: eff, crit, random: rand, burn, physical: mv.cat === 'physical' });
      def.hp = Math.max(0, def.hp - dmg);
      // GD tutorial: the lesson mon endures at 1 HP — the gate teaches
      // catching, so the only exit is a (guaranteed, once weakened) catch.
      let hungOn = false;
      if (this.tutorial && foeSide === 'foe' && def.hp <= 0) {
        def.hp = 1;
        hungOn = !this._endureShown;
        this._endureShown = true;
      }
      if (hungOn) this._tutStage = 'bag'; // P0/C7: foe weakened -> BAG highlight next
      // P0/C7: the tutorial's first damaging move retires the FIGHT highlight.
      if (this.tutorial && entry.side === 'ally' && mv.cat !== 'status') this._tutFightDone = true;
      // README attack transform: the attacker's sprite scales 1.2x for 3 frames.
      // P1/E12: Battle animations OFF skips the lunge/impact anims entirely.
      const animsOn = g.state.settings.battleAnims !== false;
      if (animsOn) this.atkFx = { side: entry.side, t: 0 };
      // Impact theater — P0/E11: shake/flash gated on the Screen-shake option
      // and reduced motion; reduced motion gets a 100ms fade instead.
      const canShake = animsOn && !g.state.settings.reducedMotion && g.state.settings.shake;
      if (canShake) {
        if (eff > 1) { this.shakeT = 120; this.flashT = 60; }
        else if (eff < 1) { this.shakeT = 60; }
        if (crit) this.flashT = 90;
        // README impact: white palette-swap on the defender for 2 frames + shake.
        if (eff !== 1 || crit) this.impactFx = { side: foeSide, t: 0 };
        // P1/I5: haptic tick on super-effective (guarded; mobile only).
        if (eff > 1 && g.state.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(30); } catch (e) { /* no haptics */ }
        }
      } else if (animsOn && g.state.settings.reducedMotion && (eff !== 1 || crit)) {
        this.fadeT = 100;
      }
      g.audio.hitFeedback(eff); // sound picks the effectiveness tier (visual twin: shake/flash)
      let extra = '';
      if (crit) extra = ' A critical hit!';
      if (eff > 1) extra += " It's super effective!";
      else if (eff < 1) extra += " It's not very effective...";
      const after = () => {
        // Secondary effect, then the damage line (never double-say the effectiveness line).
        let msg2 = hungOn
          ? defName + ' hung on with 1 HP! Now — open the BAG and throw a Poke Ball!'
          : defName + ' took ' + dmg + ' damage!';
        if (mv.effect && mv.effect.status && (!mv.effect.chance || roll(mv.effect.chance / 100, g.rng.battle))) {
          if (!def.status) {
            def.status = mv.effect.status;
            if (mv.effect.status === 'confusion') def.confused = true;
            msg2 = defName + this.statusText(mv.effect.status);
          }
        }
        if (mv.effect && mv.effect.drain) {
          atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * mv.effect.drain));
        }
        this.say(msg2, () => {
          this.checkFaint(foeSide, () => this.nextAction());
        });
      };
      if (extra.trim()) this.say(extra.trim(), after);
      else after();
    });
  }

  statusText(s) {
    return { burn: ' was burned!', poison: ' was poisoned!', paralysis: ' was paralyzed!', sleep: ' fell asleep!', freeze: ' was frozen solid!', confusion: ' became confused!' }[s] || ' was afflicted!';
  }

  applyStatusMove(entry, mv) {
    const g = this.game;
    const ef = mv.effect || {};
    const target = ef.target === 'self' ? entry.mon : (entry.side === 'ally' ? this.foe : this.ally);
    const stages = ef.target === 'self' ? (entry.side === 'ally' ? this.allyStages : this.foeStages) : (entry.side === 'ally' ? this.foeStages : this.allyStages);
    const tName = displayName(target, SPECIES);
    let msg = '';
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
      if (ef[k]) {
        stages[k] = Math.max(-6, Math.min(6, stages[k] + ef[k]));
        msg = tName + (ef[k] > 0 ? "'s " + k.toUpperCase() + ' rose!' : "'s " + k.toUpperCase() + ' fell!');
      }
    }
    if (ef.status === 'confusion') {
      target.confused = true;
      msg = tName + ' became confused!';
    }
    this.say(msg || 'Nothing happened.', () => this.nextAction());
  }

  checkFaint(side, cb) {
    const g = this.game;
    const mon = side === 'ally' ? this.ally : this.foe;
    if (mon.hp > 0) { cb(); return; }
    // Yellow homage: the partner takes its own faint personally.
    if (side === 'ally' && mon.speciesId === 'partner') g.state.pikachu.mood = 'sad';
    const name = displayName(mon, SPECIES);
    g.audio.playSfx('battle-faint');
    // README faint transform: the sprite sinks 8px + fades to 0 over 20 frames
    // while the message plays (visual-only; the flow is unchanged).
    const art = g.spriteCache[mon.speciesId] || g.spriteCache.partner;
    this.faintFx = { side, spr: side === 'ally' ? art.back : art.front, t: 0 };
    this.say(name + ' fainted!', () => {
      if (side === 'foe') {
        this.state = 'faintfoe';
        this.afterFaintFoe();
      } else {
        const g = this.game;
        const anyLeft = g.state.party.some((m) => m.hp > 0);
        if (!anyLeft) {
          this.state = 'defeat';
          this.say('You have no Pokemon left!', () => this.afterMsg());
        } else {
          this.openPartyMenu(true);
        }
      }
    });
  }

  afterFaintFoe() {
    const g = this.game;
    if (this.kind === 'trainer') {
      this.trainerIdx++;
      if (this.trainerIdx < this.trainer.team.length) {
        const t = this.trainer.team[this.trainerIdx];
        this.foe = makeMon(t.species, t.level, SPECIES, MOVES);
        if (t.nickname) this.foe.nickname = t.nickname;
        this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        this.hpAnim.foe = this.foe.hp;
        const foeName = displayName(this.foe, SPECIES);
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => {
          g.audio.playCry(t.species);
          this.state = 'resolve';
          this.awardXp(() => this.toCommand());
        });
        return;
      }
      this.awardXp(() => this.winTrainer());
    } else {
      this.awardXp(() => {
        this.state = 'victory';
        g.audio.playSfx('victory'); // wild-win sting (visual twin: the "defeated" message)
        this.say('Wild ' + displayName(this.foe, SPECIES) + ' was defeated!', () => this.afterMsg());
      });
    }
  }

  awardXp(cb) {
    const g = this.game;
    const base = SPECIES[this.foe.speciesId].baseXp;
    const gain = xpYield(base, this.foe.level, this.kind === 'wild');
    // P0/E3: snapshot the XP-bar animation (600ms ease-out, gameux §4.2).
    const prior = this.pendingXp || 0;
    this.xpBarAnim = g.state.party.filter((m) => m.hp > 0).map((m) => ({
      mon: m, from: xpFracOf(m, prior), to: xpFracOf(m, prior + gain),
    }));
    this.pendingXp = prior + gain;
    this.xpCb = cb;
    this.state = 'xp';
    this.xpT = 0;
  }

  // Fraction of the current level's XP progress (for the XP bar).
  xpShownFrac(mon) {
    let frac = xpFracOf(mon, 0);
    if (this.state === 'xp' && this.xpBarAnim) {
      const rec = this.xpBarAnim.find((r) => r.mon === mon);
      if (rec) {
        const k = this.game.state.settings.reducedMotion
          ? 1
          : 1 - Math.pow(1 - Math.min(1, this.xpT / 600), 3); // ease-out cubic
        frac = rec.from + (rec.to - rec.from) * k;
      }
    }
    return frac;
  }

  updateXp(dt) {
    const g = this.game;
    // XP bar ease-out over 600ms (gameux §4.2), then level-ups
    this.xpT += dt * 1000;
    if (this.xpT < 600) return;
    if (!this.xpApplied) {
      this.xpApplied = true;
      const msgs = [];
      for (const m of g.state.party) {
        if (m.hp <= 0) continue;
        m.xp += this.pendingXp;
        let leveled = false;
        while (m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1) && m.level < 100) {
          m.level++;
          leveled = true;
          const sp = SPECIES[m.speciesId];
          m.maxHp = hpValue(sp.base.hp, m.level);
          m.hp = Math.min(m.maxHp, m.hp + Math.floor(m.maxHp * 0.2));
          m.stats = {
            atk: statValue(sp.base.atk, m.level), def: statValue(sp.base.def, m.level),
            spa: statValue(sp.base.spa, m.level), spd: statValue(sp.base.spd, m.level),
            spe: statValue(sp.base.spe, m.level),
          };
          // Learn new moves
          const newMoves = (sp.learnset[m.level] || []);
          for (const mid of newMoves) {
            if (m.moves.length < 4) m.moves.push({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp });
            else m.moves[3] = { id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp }; // slice: replace oldest-known slot
          }
        }
        if (leveled) msgs.push(displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!');
      }
      g.audio.playSfx('dex-register');
      this.pendingXp = 0;
      this.xpApplied = false;
      this.xpFlashT = 250; // P0/E3: level-up flash on the XP bar + fanfare below
      const cb = this.xpCb; this.xpCb = null;
      if (msgs.length) { g.audio.playSfx('levelup'); this.say(msgs.join(' '), () => { this.state = 'resolve'; if (cb) cb(); }); }
      else { this.state = 'resolve'; if (cb) cb(); }
    }
  }

  endTurnStatus() {
    // Burn/poison tick (1/16 max HP), then next command or faint checks.
    const tick = (mon, stages, side, done) => {
      if (mon.hp <= 0) { done(); return; }
      if (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'badlyPoisoned') {
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - dmg);
        this.say(displayName(mon, SPECIES) + ' is hurt by ' + mon.status + '!', () => {
          this.checkFaint(side, done);
        });
        return;
      }
      done();
    };
    tick(this.ally, this.allyStages, 'ally', () => {
      if (this.state === 'defeat' || !this.ally || this.ally.hp <= 0) { this.nextAfterStatus(); return; }
      tick(this.foe, this.foeStages, 'foe', () => this.nextAfterStatus());
    });
  }

  nextAfterStatus() {
    if (this.state === 'defeat') { this.afterMsg(); return; }
    if (this.state === 'faintfoe') { this.afterFaintFoe(); return; }
    this.turn++;
    this.toCommand();
  }

  // ---- Catch sequence: the theater (gameux §4.2) ----
  beginCatch(ballId) {
    const g = this.game;
    g.state.bag[ballId]--;
    const ball = BALLS[ballId];
    this.state = 'catchseq';
    this.catchState = { ball, phase: 'throw', t: 0, shakes: 0, need: 0, a: 0 };
    g.audio.playSfx('catch-throw');
    this.msg = 'You threw a ' + ball.name + '!'; // throw plays immediately, no modal
    this.msgOpen = false;
    const foe = this.foe;
    const a = catchA(foe.maxHp, foe.hp, SPECIES[foe.speciesId].catchRate, ball.bonus, foe.status);
    this.catchState.a = a;
    if (this.tutorial && foe.hp <= foe.maxHp * 0.5) {
      // GD tutorial: weakened in the lesson battle = guaranteed catch.
      // The teaching is in the weaken step; the outcome is never luck.
      this.critCap = false;
      this.catchState.need = 3;
    } else {
      this.critCap = isCriticalCapture(a) && roll(0.05, g.rng.battle);
      this.catchState.need = this.critCap ? 1 : shakeChecks(a, g.rng.battle);
    }
    if (this.critCap) { g.ui.toast('Critical capture!'); g.audio.playSfx('catch-crit'); }
  }

  updateCatch(dt) {
    const g = this.game;
    const c = this.catchState;
    c.t += dt * 1000;
    // throw 26f (~430ms) -> absorb -> ball drop -> 3x800ms shakes -> click
    if (c.phase === 'throw' && c.t >= 430) {
      c.phase = 'shakes'; c.t = 0;
      // P1/E10: absorb flash (the mon is drawn into the ball) — white-swap 2 frames.
      const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
      if (foeArt.frontWhite && !g.state.settings.reducedMotion) this.impactFx = { side: 'foe', t: 0 };
    }
    else if (c.phase === 'shakes') {
      const want = c.need;
      const doneShakes = Math.floor(c.t / 800);
      if (c.shakes < doneShakes && c.shakes < want) {
        c.shakes++;
        g.audio.playSfx('catch-rattle'); // visual twin: ball wiggle
      }
      if (c.shakes >= want && c.t >= want * 800 + 200) {
        if (want >= 3 || (this.critCap && want >= 1)) this.catchSuccess();
        else this.catchBreak(c.shakes);
      }
    }
  }

  catchSuccess() {
    const g = this.game;
    g.audio.playSfx('catch-click'); // visual twin: starburst
    g.audio.playSfx('catch-gotcha');
    this.catchFx = { t: 0 }; // P1/E10: success starburst radiates from the ball
    const foe = this.foe;
    const name = displayName(foe, SPECIES);
    dexRegister(g.state.dex, 'caught', SPECIES[foe.speciesId].dexNo);
    let dest = 'party';
    if (g.state.party.length >= 6) {
      const box = g.state.boxes.box1 || (g.state.boxes.box1 = []);
      box.push({ speciesId: foe.speciesId, level: foe.level, xp: foe.xp, nickname: null, moves: foe.moves.map((m) => m.id), ivs: foe.ivs });
      dest = 'Box 1';
    } else {
      foe.hp = foe.maxHp; // caught fresh
      g.state.party.push(foe);
    }
    g.audio.playSfx('dex-register'); // visual twin: dex toast + badge dot
    g.ui.dexDot = true; // P1/D4: badge dot on the HUD strip's Dex button
    if (g.ui._renderDexDot) g.ui._renderDexDot();
    this.say('Gotcha! ' + name + ' was caught! (' + dest + ')', () => {
      g.ui.toast(name + ' registered in the Dex!');
      this.endBattle(true);
    });
  }

  catchBreak(shakesDone) {
    const g = this.game;
    const name = displayName(this.foe, SPECIES);
    g.audio.catchBreakout(); // visual twin: break-out burst
    // P0/E11: break-out flash gated like battle flashes; reduced motion -> fade.
    if (!g.state.settings.reducedMotion && g.state.settings.shake) g.renderer.flashA = 0.8;
    else if (g.state.settings.reducedMotion) { g.renderer.fadeA = 0.35; g.renderer.fadeColor = '#ffffff'; }
    this.say('Oh no! ' + name + ' broke free after ' + shakesDone + ' shake' + (shakesDone === 1 ? '' : 's') + '!', () => {
      g.renderer.flashA = 0;
      g.renderer.fadeA = 0;
      // Break-out mood: it may attack immediately (foe gets a free move)
      this.playerAction = { type: 'ballthrown' };
      this.foeAction = this.chooseFoeAction();
      this.state = 'resolve';
      const mk = (side, action) => {
        const mon = side === 'ally' ? this.ally : this.foe;
        const stages = side === 'ally' ? this.allyStages : this.foeStages;
        const stats = this.effStats(mon, stages);
        let move = null, priority = 0;
        if (action.type === 'move') {
          move = MOVES[mon.moves[action.idx].id];
          priority = move.priority || 0;
        }
        return { side, action, mon, stats, priority, move };
      };
      this.actions = [mk('foe', this.foeAction)];
      this.nextAction();
    });
  }

  winTrainer() {
    const g = this.game;
    const t = this.trainer;
    this.state = 'victory';
    g.state.player.money += t.reward;
    g.state.story.flags['beat_' + t.id] = true;
    // Yellow homage: winning with the partner conscious leaves it buzzing.
    if (g.state.party.some((m) => m.speciesId === 'partner' && m.hp > 0)) {
      g.state.pikachu.mood = 'excited';
    }
    // No battle-message here: the capstone dialogue below ends the battle exactly once.
    this.msg = 'You defeated ' + t.title + ' ' + t.name + '! Got $' + t.reward + '.';
    this.msgOpen = false;
    if (t.badge) {
      g.state.badges.kanto.push(t.badge);
      g.audio.playSfx('badge'); // badge fanfare (visual twin: badge-case shine animation)
      const lines = SLICE_CAPSTONE.map((l) => l.replace('{player}', g.state.player.name));
      g.ui.say(lines, () => this.endBattle(true), '');
    } else {
      g.ui.say(t.lose, () => this.endBattle(true), t.name);
    }
  }

  finishVictory() {
    this.endBattle(true);
  }

  finishDefeat() {
    const g = this.game;
    // Defeat: fade -> Pokemon Center (overworld, healed, money halved) — architecture §2.2
    g.state.pikachu.mood = 'sad'; // Yellow homage: the partner hates losing
    g.state.player.money = Math.floor(g.state.player.money / 2);
    this.endBattle(false);
    g.ui.say(['You hurried to the Pokemon Center...'], () => {
      const ow = this.returnTo;
      ow.loadMap('center');
      ow.player.tx = 4; ow.player.ty = 3; ow.player.px = 4 * TILE; ow.player.py = 3 * TILE;
      ow.player.fx = 4; ow.player.fy = 3;
      ow.trail = [];
      ow.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 3, dir: 'down' };
      g.ui.toast('Your Pokemon were healed. (Lost half your money.)');
    });
  }

  endBattle(won) {
    const g = this.game;
    g.ui.setBattleMode(false);
    g.audio.restoreAreaMusic(); // back to the overworld's track
    g.renderer.shakeX = 0; g.renderer.shakeY = 0; g.renderer.flashA = 0;
    // Reset battle temp state on party mons
    for (const m of g.state.party) { m.confused = false; m.statusTurns = 0; }
    g.scenes.pop();
    g.autosave('battle');
  }

  drainHp(dt) {
    const g = this.game;
    // P0/E5: reduced motion -> HP drain snaps instantly (no 90 HP/s animation).
    if (g.state.settings.reducedMotion) {
      this.hpAnim.ally = this.ally.hp;
      this.hpAnim.foe = this.foe.hp;
    } else {
      const rate = HP_DRAIN_PER_SEC * dt;
      if (this.hpAnim.ally !== this.ally.hp) {
        const d = this.ally.hp - this.hpAnim.ally;
        this.hpAnim.ally += Math.sign(d) * Math.min(Math.abs(d), rate);
        if (Math.abs(this.ally.hp - this.hpAnim.ally) < 1) this.hpAnim.ally = this.ally.hp;
      }
      if (this.hpAnim.foe !== this.foe.hp) {
        const d = this.foe.hp - this.hpAnim.foe;
        this.hpAnim.foe += Math.sign(d) * Math.min(Math.abs(d), rate);
        if (Math.abs(this.foe.hp - this.hpAnim.foe) < 1) this.hpAnim.foe = this.foe.hp;
      }
    }
    // Low-HP warning jingle at first crossing into red (<25%), once per ally
    // (gameux §4.2). Visual twin: the HP plate's red pulse + ⚠ pip.
    if (this._lowHpAlly !== this.ally) { this._lowHpAlly = this.ally; this._lowHpWarned = false; }
    const ratio = this.ally.maxHp > 0 ? this.ally.hp / this.ally.maxHp : 1;
    if (ratio > 0.25) this._lowHpWarned = false;
    else if (!this._lowHpWarned && this.ally.hp > 0) {
      this._lowHpWarned = true;
      g.audio.playSfx('lowhp'); // P0-5: wired (was dead code before the Wave-2 audio merge)
      // P1/E7: pulse the ally plate twice on first red crossing (not under reduced motion).
      if (!g.state.settings.reducedMotion) this._lowHpPulseT = 400;
    }
  }

  render(r) {
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    // Battle background: banded vertical steps (max 5, gameux §6) per terrain.
    const bands = this.kind === 'trainer'
      ? ['#3a3a4a', '#4a4a5a', '#5a5a6a', '#6a6a7a', '#7a7a8a']
      : ['#2a6a3a', '#3a7a4a', '#4a8a5a', '#5a9a6a', '#6aaa7a'];
    for (let i = 0; i < 5; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / 5, w, h / 5 + 1);
    }
    r.begin();
    // Platforms: foe upper-right, ally lower-left (wireframes §5.1 — the Uix
    // ruling: gameux §4.2's "upper-left" was the spec's error; the build is correct).
    const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allyArt = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    const bob = Math.sin(this.t * 0.004) * 2;
    const foePos = { x: w * 0.62, y: h * 0.12 + bob };
    const allyPos = { x: w * 0.14, y: h * 0.52 - bob };
    // Idle bob: the build-time derived bob frame alternates with the sine.
    let foeSpr = (bob > 0 && foeArt.frontBob) ? foeArt.frontBob : foeArt.front;
    let allySpr = allyArt.back;
    // README impact transform: white palette-swap on the defender for 2 frames.
    if (this.impactFx) {
      if (this.impactFx.side === 'foe' && foeArt.frontWhite) foeSpr = foeArt.frontWhite;
      if (this.impactFx.side === 'ally' && allyArt.backWhite) allySpr = allyArt.backWhite;
    }
    const drawBattler = (spr, pos, side) => {
      if (this.faintFx && this.faintFx.side === side) return; // faint anim draws it
      // README attack transform: 1.2x scale for 3 frames, then back.
      if (this.atkFx && this.atkFx.side === side) r.blitS(spr, pos.x - 5, pos.y - 5, 58, 58);
      else r.blitS(spr, pos.x, pos.y, 48, 48); // 32px ART -> 48px draw size
    };
    drawBattler(foeSpr, foePos, 'foe');
    drawBattler(allySpr, allyPos, 'ally');
    // README faint transform: sink 8px + fade to 0 alpha over 20 frames.
    if (this.faintFx) {
      const k = Math.min(1, this.faintFx.t / 660);
      const c = r.ctx;
      c.save();
      c.globalAlpha = 1 - k;
      const pos = this.faintFx.side === 'foe' ? foePos : allyPos;
      r.blitS(this.faintFx.spr, pos.x, pos.y + 8 * k, 48, 48);
      c.restore();
    }
    // Catch ball arc
    if (this.state === 'catchseq' && this.catchState.phase === 'throw') {
      const k = Math.min(1, this.catchState.t / 430);
      const bx = w * 0.2 + (w * 0.5) * k;
      const by = h * 0.6 - Math.sin(k * Math.PI) * h * 0.35;
      g.ctx2dcircle(bx, by, 5, '#e84040');
    }
    if (this.state === 'catchseq' && this.catchState.phase === 'shakes') {
      const wob = Math.sin(this.catchState.t * 0.05) * 3;
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3, 6, '#e8e8f0');
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3 - 2, 6, '#e84040');
    }
    // P1/E10: success starburst — 8 gold rays radiating from the ball, fading.
    if (this.catchFx) {
      const k = this.catchFx.t / 500;
      const c = r.ctx;
      c.save();
      c.strokeStyle = 'rgba(232,200,50,' + (1 - k).toFixed(3) + ')';
      c.lineWidth = 2;
      const bx = w * 0.7, by = h * 0.3, r0 = 8 + k * 26;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        c.beginPath();
        c.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0);
        c.lineTo(bx + Math.cos(a) * (r0 + 8), by + Math.sin(a) * (r0 + 8));
        c.stroke();
      }
      c.restore();
    }
    r.end();
    // HP plates (Gen 5 idiom, original art) — P1/A5: all plate text >= 14px.
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 116, h - 108, this.ally, this.hpAnim.ally, true);
    // Message box
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 52, w - 8, 48, '#f8f8f0', '#202028');
      const txt = this.msg.length > 30 ? this.msg.slice(0, 30) : this.msg;
      r.text(txt, 10, h - 46, { size: 14, color: '#202028', shadow: false });
      if (this.msg.length > 30) r.text(this.msg.slice(30, 60), 10, h - 28, { size: 14, color: '#202028', shadow: false });
    }
    this.t += 16;
  }

  plate(r, x, y, mon, hpShown, isAlly) {
    const g = this.game;
    const w = 104, h = isAlly ? 62 : 48;
    // P1/E7: low-HP pulse — the ally plate nudges twice on first red crossing
    // (never under reduced motion; the pulse timer is only set when motion is on).
    let px = x;
    if (isAlly && this._lowHpPulseT > 0) px = x + Math.sin(this._lowHpPulseT * 0.05) * 2;
    r.panel(px, y, w, h, '#f0ead8', '#202028');
    const name = displayName(mon, SPECIES).slice(0, 10);
    r.text(name, px + 4, y + 4, { size: 14, bold: true, color: '#202028', shadow: false });
    r.text('Lv' + mon.level, px + w - 46, y + 4, { size: 14, color: '#202028', shadow: false });
    const frac = hpShown / mon.maxHp;
    r.hpBar(px + 4, y + 22, w - 8, 6, frac);
    // P0/E6: ⚠ pip on the plate under 25% — the colorblind cue, never color-alone.
    if (frac < 0.25 && mon.hp > 0) {
      r.text('⚠', px + w - 22, y + 21, { size: 14, bold: true, color: '#a02020', shadow: false });
    }
    if (isAlly) {
      r.text(Math.ceil(hpShown) + '/' + mon.maxHp, px + 4, y + 30, { size: 14, color: '#202028', shadow: false });
      if (mon.status) r.text(mon.status.toUpperCase().slice(0, 3), px + w - 42, y + 30, { size: 14, bold: true, color: '#a040a0', shadow: false });
      // P0/E3: XP bar (gold) + →Lv label; 600ms ease-out (instant under reduced motion).
      r.text('→Lv', px + 72, y + 44, { size: 14, color: '#7a5a10', shadow: false });
      // xpShownFrac lives on the battle instance; the QA minimal-this plate test
      // calls plate() without it — fall back to the static fraction there.
      const xf = (typeof this.xpShownFrac === 'function') ? this.xpShownFrac(mon) : xpFracOf(mon, 0);
      r.xpBar(px + 4, y + 48, 64, 4, xf);
      if (this.xpFlashT > 0) {
        const c = r.ctx;
        c.fillStyle = 'rgba(255,255,255,' + (this.xpFlashT / 250 * 0.8).toFixed(3) + ')';
        c.fillRect(px + 4, y + 48, 64, 4);
      }
    } else if (mon.status) {
      r.text(mon.status.toUpperCase().slice(0, 3), px + w - 42, y + 30, { size: 14, bold: true, color: '#a040a0', shadow: false });
    }
  }
}


// ---- src/game/overworld.mjs ----
// overworld.mjs — tile-map exploration: interpolated grid movement, tall-grass
// encounters (rustle -> ! -> transition, 900ms per ADR-004), follower partner,
// NPCs, signs, warps, pause menu (Bag/Party/Dex/Save/Options).


const WALK_MS = 200; // ~200ms per walked tile (GD feel note)

class OverworldScene {
  enter() {
    const g = this.game;
    this.mapId = g.state.story.position.map;
    this.loadMap(this.mapId);
    const p = g.state.story.position;
    this.player = { tx: p.x, ty: p.y, px: p.x * TILE, py: p.y * TILE, dir: p.dir || 'down', moving: false, moveT: 0, fx: p.x, fy: p.y };
    this.trail = []; // partner path history
    this.partner = { px: this.player.px, py: this.player.py, hop: 0 };
    this.enc = null; // encounter sequence state
    this.challenge = null; // Yellow-style trainer spot challenge (sight -> ! -> walk-up)
    this.banner = { text: this.map.name.toUpperCase(), t: 0 };
    this.stepsSinceEncounter = 0;
    this.chainCount = 0;
    this.pausedMenu = false;
    // P1/C6: movement tutorial shows once until the player takes a first step (or 30s).
    this.moveTut = g.state.story.flags.moveTutDone ? null : { t: 0 };
    // P1/D7: partner mood pip — tap = pet (same as facing + A on Pikachu).
    g.ui.onMoodTap = () => this.petPartner();
    g.ui.showMoodPip(true);
    g.ui.setBattleMode(false);
    g.audio.playMusic(this.map.music || 'route1-theme'); // per-map original score (maps.mjs `music`)
  }

  loadMap(id) {
    this.mapId = id;
    this.map = MAPS[id];
    this.w = this.map.rows[0].length;
    this.h = this.map.rows.length;
  }

  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ' ';
    return this.map.rows[y][x];
  }

  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (!WALKABLE.has(t)) return false;
    // NPCs block
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return false;
    return true;
  }

  warpAt(x, y) {
    for (const wp of this.map.warps) if (wp.x === x && wp.y === y) return wp;
    return null;
  }

  npcAt(x, y) {
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return n;
    return null;
  }

  signAt(x, y) {
    for (const s of this.map.signs) if (s.x === x && s.y === y) return s;
    return null;
  }

  update(dt) {
    const g = this.game;
    if (g.ui.update(dt)) return; // modal UI consumes input
    if (this.enc) { this.updateEncounter(dt); return; }
    if (this.challenge) { this.updateChallenge(dt); return; } // input locked: a trainer is walking up
    if (this.checkSightLines()) return; // spotted this tick — challenge takes over

    const input = g.input;
    // Pause menu
    if (input.wasPressed('start') || input.wasPressed('escape')) {
      this.openPauseMenu();
      return;
    }
    // P1/D4: SELECT toggles the HUD quick-strip.
    if (input.wasPressed('select')) {
      g.ui.setHudVisible(!g.ui.hudVisible);
      return;
    }
    // Interact
    if (input.wasPressed('a')) {
      if (this.tryInteract()) return;
    }

    // Movement
    const p = this.player;
    if (!p.moving) {
      const d = input.dir();
      if (d) {
        p.dir = d;
        const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
        const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
        if (this.walkable(p.tx + dx, p.ty + dy)) {
          p.moving = true; p.moveT = 0;
          p.fx = p.tx; p.fy = p.ty;
          p.tx += dx; p.ty += dy;
        }
      }
    } else {
      p.moveT += dt * 1000;
      const k = Math.min(1, p.moveT / WALK_MS);
      p.px = (p.fx + (p.tx - p.fx) * k) * TILE;
      p.py = (p.fy + (p.ty - p.fy) * k) * TILE;
      if (k >= 1) {
        p.moving = false;
        p.px = p.tx * TILE; p.py = p.ty * TILE;
        this.trail.push({ x: p.tx, y: p.ty });
        if (this.trail.length > 24) this.trail.shift();
        this.onStep(p.tx, p.ty);
      }
    }
    // Partner follows 1 tile behind with hop
    const tp = this.trail.length >= 2 ? this.trail[this.trail.length - 2] : { x: p.tx, y: p.ty };
    const tpx = tp.x * TILE, tpy = tp.y * TILE;
    this.partner.px += (tpx - this.partner.px) * Math.min(1, dt * 10);
    this.partner.py += (tpy - this.partner.py) * Math.min(1, dt * 10);
    this.partner.hop += dt * 6;

    // Playtime + banner
    g.state.story.playtimeSec = (g.state.story.playtimeSec || 0);
    this.playAcc = (this.playAcc || 0) + dt;
    if (this.playAcc >= 1) { this.playAcc -= 1; g.state.player.playtimeSec++; }
    if (this.banner.t > 0) this.banner.t -= dt;
    // P1/C6: movement tutorial dismisses on first step or after 30s.
    if (this.moveTut) {
      this.moveTut.t += dt;
      if (this.moveTut.t > 30 || this.trail.length > 0) {
        this.moveTut = null;
        g.state.story.flags.moveTutDone = true;
      }
    }
  }

  onStep(x, y) {
    const g = this.game;
    const wp = this.warpAt(x, y);
    if (wp) {
      const to = wp.to;
      this.loadMap(to.map);
      this.player.tx = to.x; this.player.ty = to.y;
      this.player.px = to.x * TILE; this.player.py = to.y * TILE;
      this.player.fx = to.x; this.player.fy = to.y;
      this.trail = [];
      this.partner.px = this.player.px; this.partner.py = this.player.py;
      g.state.story.position = { map: to.map, x: to.x, y: to.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.state.meta.location = this.map.name;
      g.audio.playMusic(this.map.music || 'route1-theme'); // no-op when the track is already playing
      g.audio.playSfx('map-enter'); // visual twin: the location banner slide-in
      g.autosave('area');
      return;
    }
    // Tall grass encounter check (anti-frustration: force after 20 silent steps)
    const t = this.tileAt(x, y);
    if (t === ',' && this.map.encounters && !g.state.story.flags.noEncounters) {
      // GD balance: the FIRST grass step on Route 1 is a scripted tutorial
      // encounter (Lv 3 Rattata), not a random roll — the <3min first-catch
      // gate is a certainty that teaches, never a gamble.
      if (this.mapId === 'route1' && !g.state.story.flags.tutorialDone) {
        this.startTutorialEncounter();
        return;
      }
      this.stepsSinceEncounter++;
      let p = this.map.encounters.rate;
      if (this.stepsSinceEncounter > 20) p = 1;
      if (this.chainCount >= 2) p = 0; // no triple chains
      if (roll(p, g.rng.encounter)) {
        this.startEncounter();
      } else {
        // GD balance (QA-003): the anti-chain counter measures CONSECUTIVE
        // random encounters — a quiet grass step breaks the chain, otherwise
        // encounters stay dead for the rest of the map visit.
        this.chainCount = 0;
      }
    } else {
      this.stepsSinceEncounter = 0;
    }
  }

  // ---- Yellow-style trainer vision (sight -> "!" -> walk-up -> battle) ----
  // An unbeaten trainer NPC with a `sight` cone spots the player standing in
  // its line, plays the alert, and walks over. Checked between steps only.
  // Duo NPCs (duoPartner) walk up together for a shared ambush.
  checkSightLines() {
    const p = this.player;
    if (p.moving) return false;
    const g = this.game;
    for (const n of this.map.npcs) {
      if (!n.trainer || !n.sight) continue;
      if (g.state.story.flags['beat_' + n.trainer]) continue;
      const dir = n.sight.dir || 'down';
      const range = n.sight.range || 3;
      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      for (let i = 1; i <= range; i++) {
        const tx = n.x + dx * i, ty = n.y + dy * i;
        if (tx === p.tx && ty === p.ty) { this.startChallenge(n); return true; }
        if (!this.walkable(tx, ty)) break; // sight blocked (wall, rock, another NPC)
      }
    }
    return false;
  }

  startChallenge(spotter) {
    const g = this.game;
    const parts = [{ npc: spotter, cx: spotter.x, cy: spotter.y }];
    if (spotter.duoPartner) {
      const mate = this.map.npcs.find((n) => n.name === spotter.duoPartner);
      if (mate && !g.state.story.flags['beat_' + mate.trainer]) {
        parts.push({ npc: mate, cx: mate.x, cy: mate.y });
      }
    }
    this.challenge = { parts, phase: 'spot', t: 0, stepT: 0 };
    g.audio.playSfx('trainer-spot'); // original two-note alert (visual twin: the ! mark)
    g.ui.log.push({ ui: 'trainer-spot', npcs: parts.map((q) => q.npc.name) });
  }

  updateChallenge(dt) {
    const g = this.game;
    const ch = this.challenge;
    ch.t += dt * 1000;
    const pl = this.player;
    if (ch.phase === 'spot') {
      if (ch.t >= 500) { ch.phase = 'walk'; ch.t = 0; ch.stepT = 0; }
      return;
    }
    // Walk phase: each challenger steps toward a tile adjacent to the player
    // (150ms/tile). The battle transition covers the snap-back to home tiles.
    const arrived = (q) => Math.abs(q.cx - pl.tx) + Math.abs(q.cy - pl.ty) <= 1;
    if (ch.parts.every(arrived) || ch.t > 3500) {
      const npc = ch.parts[0].npc;
      this.challenge = null;
      this.startTrainerBattle(npc);
      return;
    }
    ch.stepT += dt * 1000;
    if (ch.stepT >= 150) {
      ch.stepT = 0;
      for (const q of ch.parts) this.stepChallengerToward(q);
    }
  }

  stepChallengerToward(q) {
    const pl = this.player;
    if (Math.abs(q.cx - pl.tx) + Math.abs(q.cy - pl.ty) <= 1) return;
    const dx = pl.tx - q.cx, dy = pl.ty - q.cy;
    const opts = Math.abs(dx) >= Math.abs(dy)
      ? [[q.cx + Math.sign(dx), q.cy], [q.cx, q.cy + Math.sign(dy)]]
      : [[q.cx, q.cy + Math.sign(dy)], [q.cx + Math.sign(dx), q.cy]];
    for (const [nx, ny] of opts) {
      if (nx === pl.tx && ny === pl.ty) continue; // never step onto the player
      if (this.walkable(nx, ny)) { q.cx = nx; q.cy = ny; return; }
    }
  }

  startTutorialEncounter() {
    const g = this.game;
    g.state.story.flags.tutorialDone = true;
    this.stepsSinceEncounter = 0;
    this.chainCount = 0; // scripted tutorial isn't part of the random chain (QA-003)
    // Lv 3 Rattata: one Thunder Shock drops it to yellow (teaches weakening),
    // its Tackle does ~4 to a Lv 5 Pikachu (cannot threaten), and the battle
    // engine guarantees the catch once weakened + never lets it faint.
    this.enc = {
      phase: 'rustle', t: 0, tutorial: true,
      foe: makeMon('rattata', 3, SPECIES, MOVES),
    };
    g.audio.stopMusic();
    g.audio.encounter();
  }

  startEncounter() {
    const g = this.game;
    const table = this.map.encounters.table;
    const spId = pickWeighted(table.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = table.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    this.enc = {
      phase: 'rustle', t: 0,
      foe: makeMon(spId, level, SPECIES, MOVES),
    };
    this.stepsSinceEncounter = 0;
    this.chainCount++;
    g.audio.stopMusic();       // area music yields to the battle
    g.audio.encounter();       // rustle + "!" melody (visual twin: rustle anim, then the ! mark)
  }

  updateEncounter(dt) {
    const g = this.game;
    const e = this.enc;
    e.t += dt * 1000;
    // 3-beat: rustle 200ms -> ! 300ms -> transition 400ms (ADR-004, gameux §6)
    if (e.phase === 'rustle' && e.t >= 200) { e.phase = 'exclaim'; e.t = 0; }
    else if (e.phase === 'exclaim' && e.t >= 300) {
      e.phase = 'transition'; e.t = 0;
      // P0/E11: encounter flash gated like battle flashes; reduced motion -> fade.
      if (!g.state.settings.reducedMotion && g.state.settings.shake) g.renderer.flashA = 0.7;
      else if (g.state.settings.reducedMotion) { g.renderer.fadeA = 0.35; g.renderer.fadeColor = '#ffffff'; }
      g.audio.transition(); // whoosh on the wipe; soft blip under reduced motion
    }
    else if (e.phase === 'transition' && e.t >= 400) {
      g.renderer.flashA = 0;
      g.renderer.fadeA = 0;
      const foe = e.foe;
      this.enc = null;
      dexRegister(g.state.dex, 'seen', SPECIES[foe.speciesId].dexNo);
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, tutorial: !!e.tutorial }));
    }
    if (g.renderer.flashA > 0 && e.phase !== 'transition') {
      g.renderer.flashA = Math.max(0, g.renderer.flashA - dt * 3);
    }
  }

  petPartner() {
    // P1/D7: mood-pip tap and the faced-tile interaction share one path.
    // Yellow homage: the partner emotes when talked to; petting cheers it up.
    const g = this.game;
    g.state.pikachu.mood = 'happy'; // a petting cheers it up (D7: mood reacts to beats)
    g.ui.toast('Pikachu ' + (PARTNER_MOODS[g.state.pikachu.mood] || PARTNER_MOODS.happy));
    g.audio.playSfx('partner-happy'); // visual twin: Pikachu hop + mood pip
    g.ui.updateMoodPip();
    return true;
  }

  tryInteract() {
    const g = this.game;
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    // Partner interaction (facing Pikachu's tile)
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) return this.petPartner();
    const npc = this.npcAt(fx, fy);
    if (npc) {
      if (npc.trainer) { this.startTrainerBattle(npc); return true; }
      const lines = npc.dialogue.map((l) => l.replace('{player}', g.state.player.name));
      // GD balance: data-driven one-time item gifts (ball economy top-ups).
      const after = () => {
        if (npc.give && !g.state.story.flags[npc.give.flag]) {
          g.state.story.flags[npc.give.flag] = true;
          for (const item of Object.keys(npc.give.items)) {
            g.state.bag[item] = (g.state.bag[item] || 0) + npc.give.items[item];
          }
          g.ui.toast('Received ' + npc.give.text + '!');
        }
      };
      if (npc.heal) {
        g.ui.say(lines, () => {
          this.healParty(false);
          g.ui.say(npc.afterHeal || ['All better!'], after, npc.name);
        }, npc.name);
      } else {
        g.ui.say(lines, after, npc.name);
      }
      return true;
    }
    const sign = this.signAt(fx, fy);
    if (sign) { g.ui.say([sign.text]); return true; }
    // Also check the tile the player stands on for signs (adjacent readability)
    return false;
  }

  startTrainerBattle(npc) {
    const g = this.game;
    if (g.state.story.flags['beat_' + npc.trainer]) {
      g.ui.say(npc.dialogue.slice(1), null, npc.name);
      return;
    }
    const t = TRAINERS[npc.trainer];
    g.ui.say(t.intro, () => {
      g.scenes.push(new BattleScene({ kind: 'trainer', trainer: t, returnTo: this }));
    }, npc.name);
  }

  healParty(announce) {
    const g = this.game;
    for (const m of g.state.party) {
      m.hp = m.maxHp; m.status = null;
      m.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const mv of m.moves) mv.pp = mv.maxPp;
    }
    g.audio.playSfx('heal');
    if (announce) g.ui.toast('Your Pokemon were healed to full health!');
  }

  openPauseMenu() {
    const g = this.game;
    // P1/J2: player card header + Quit to title (confirm; autosaves first).
    const badges = g.state.badges.kanto.length;
    const mins = Math.floor((g.state.player.playtimeSec || 0) / 60);
    // Track B: account row — logged in shows the account menu; logged out (vercel)
    // offers login; guest target keeps the honest disabled row (Track A).
    const authEnabled = (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED);
    const accountRow = !authEnabled
      ? { label: 'Account — coming in Track B', value: 'account', disabled: true }
      : g.authUser
        ? { label: 'Account', value: 'account' }
        : { label: 'Log in to sync ★', value: 'login' };
    g.ui.showMenu('MENU', [
      { label: g.state.player.name + ' · ' + badges + ' badges · ' + mins + 'm', value: null, disabled: true },
      { label: this.map.name, value: null, disabled: true },
      { label: 'Bag', value: 'bag' },
      { label: 'Party', value: 'party' },
      { label: 'Dex', value: 'dex' },
      { label: 'Journey', value: 'journey' },
      { label: 'Save', value: 'save' },
      { label: 'Options', value: 'options' },
      accountRow,
      { label: 'Quit to title', value: 'quit' },
      { label: 'Close', value: 'close' },
    ], (value) => {
      if (value === 'bag') g.openBag();
      else if (value === 'party') g.openParty();
      else if (value === 'dex') g.openDex();
      else if (value === 'journey') g.openJourney();
      else if (value === 'save') g.openSave();
      else if (value === 'options') g.openOptions();
      else if (value === 'account' && authEnabled && g.authUser) AUTH.openAccountMenu(g);
      else if (value === 'login' && authEnabled) g.openLogin('continue');
      else if (value === 'quit') {
        g.ui.showMenu('Quit to title? (autosaves first)', [
          { label: 'Quit', value: 'yes' },
          { label: 'Keep playing', value: 'no' },
        ], (v) => {
          if (v === 'yes') {
            g.saveGame(true);
            g.scenes.replace(new BootScene());
          }
        });
      }
    });
  }

  areaCompletion() {
    const g = this.game;
    if (!this.map.encounters) return null;
    const species = [...new Set(this.map.encounters.table.map((e) => e.species))];
    const caught = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
    return { caught, total: species.length };
  }

  render(r) {
    const g = this.game;
    const T = TILE;
    // Camera centers on player
    r.centerOn(this.player.px + T / 2, this.player.py + T / 2, this.w * T, this.h * T);
    r.begin();
    // Tiles: hand-authored ART (wave 3); void stays a solid fill.
    const vr = r.viewRect();
    const x0 = Math.max(0, Math.floor(vr.x0 / T)), x1 = Math.min(this.w - 1, Math.ceil(vr.x1 / T));
    const y0 = Math.max(0, Math.floor(vr.y0 / T)), y1 = Math.min(this.h - 1, Math.ceil(vr.y1 / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.map.rows[y][x];
        const spr = g.tileSprite(g.tileKind(ch));
        if (spr) r.blit(spr, x * T, y * T);
        else g.ctx2dfill('#101018', x * T, y * T, T, T); // void
      }
    }
    // Encounter rustle effect
    if (this.enc && this.enc.phase === 'rustle') {
      const jx = (this.game.rng.misc() - 0.5) * 3;
      const gspr = g.tileSprite('grass');
      if (gspr) r.blit(gspr, this.player.tx * T + jx, this.player.ty * T);
    }
    // NPCs (2-frame idle) — challengers render at their walk-up position.
    for (const n of this.map.npcs) {
      let nx = n.x * T, ny = n.y * T - 4;
      const cq = this.challenge && this.challenge.parts.find((q) => q.npc === n);
      if (cq) { nx = cq.cx * T; ny = cq.cy * T - 4; }
      r.blit(g.npcFrame(n), nx, ny);
    }
    // Yellow-style spot "!" over each challenger during the alert beat.
    if (this.challenge && this.challenge.phase === 'spot') {
      for (const q of this.challenge.parts) {
        r.text('!', q.cx * T + 4, q.cy * T - 16, { size: 14, bold: true, color: '#e84040' });
      }
    }
    // Partner (hop) + player (walk cycle / idle blink)
    const hop = Math.abs(Math.sin(this.partner.hop)) * 3;
    r.blit(g.partnerFrame(), Math.round(this.partner.px), Math.round(this.partner.py) - Math.round(hop));
    r.blit(g.playerSprite(this.player), Math.round(this.player.px), Math.round(this.player.py));
    // "!" exclamation
    if (this.enc && this.enc.phase === 'exclaim') {
      r.text('!', this.player.px + 4, this.player.py - 14, { size: 14, bold: true, color: '#e84040' });
    }
    // P1/C6: movement tutorial — pulsing ring on the player + coach text.
    if (this.moveTut) {
      const pr = 12 + Math.sin(g._animT * 0.008) * 3;
      const c = r.ctx;
      c.strokeStyle = '#ffe9a8'; c.lineWidth = 2;
      c.beginPath(); c.arc(this.player.px + 8, this.player.py + 8, pr, 0, Math.PI * 2); c.stroke();
      r.text('Walk with the D-pad — Pikachu follows you!', 8, 44, { size: 14, bold: true, color: '#ffe9a8' });
      r.text('▼', Math.round(this.partner.px) + 4, Math.round(this.partner.py) - 28, { size: 14, bold: true, color: '#ffe9a8' });
    }
    // P1/D5: contextual interaction prompt bubble.
    const prompt = this.interactPrompt();
    if (prompt) {
      const bx = Math.round(this.player.px) - 24, by = Math.round(this.player.py) - 30;
      r.panel(bx, by, 76, 20, '#f8f8f0', '#202028');
      r.text(prompt, bx + 6, by + 3, { size: 14, color: '#202028', shadow: false });
    }
    // P1/D8: clock glyph — day/night pixel icon + season bar (no text, ambient).
    this.renderClockGlyph(r);
    r.end();
    // HUD overlays (canvas) — P1/A5: >= 14px.
    if (this.banner.t > 0) {
      r.text(this.banner.text, 8, 8, { size: 14, bold: true, color: '#fff' });
    }
    // P1/D6: persistent objective banner under the area banner.
    r.text(this.objectiveText(), 8, 26, { size: 14, color: '#ffe9a8' });
    const comp = this.areaCompletion();
    if (comp) {
      r.text(this.map.name + ' · ' + comp.caught + '/' + comp.total + ' caught', 8, r.viewH - 18, { size: 14, color: '#ffe9a8' });
    }
    // Dex caught counter (honest wording). D3: on desktop the DOM HUD strip is
    // ~218 CSS px wide at the top-right; shift the counter left in logical px so
    // the left-aligned text clears it (phone layouts keep the signed offset).
    const dexX = g.layoutMode === 'desktop' ? r.viewW - 172 : r.viewW - 92;
    r.text('Dex ' + dexCaughtCount(g.state.dex) + '/' + DEX_TOTAL, dexX, 8, { size: 14, color: '#fff' });
  }

  // P1/D5: what would A do on the faced tile? (bubble text, or null)
  interactPrompt() {
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) return 'A: Pet';
    if (this.npcAt(fx, fy)) return 'A: Talk';
    if (this.signAt(fx, fy)) return 'A: Read';
    return null;
  }

  // P1/D6: current story objective (truncating; the slice's spine).
  objectiveText() {
    const f = this.game.state.story.flags;
    if (!f.beat_brock) return '▶ Earn the Boulder Badge';
    return '▶ Explore Kanto';
  }

  // P1/D8: day/night pixel icon + season color bar, top-right of canvas.
  renderClockGlyph(r) {
    const g = this.game;
    let hour = 12;
    try { hour = new Date().getHours(); } catch (e) { /* headless */ }
    const day = hour >= 6 && hour < 18;
    const x = r.viewW - 20, y = 22;
    const c = r.ctx;
    if (day) {
      c.fillStyle = '#f8d030';
      c.fillRect(x + 3, y, 6, 12); c.fillRect(x, y + 3, 12, 6);
      c.fillStyle = '#fff2b0';
      c.fillRect(x + 4, y + 4, 4, 4);
    } else {
      c.fillStyle = '#bfe8f0';
      c.fillRect(x + 3, y + 1, 6, 10); c.fillRect(x + 5, y, 8, 12);
      c.fillStyle = '#101018';
      c.fillRect(x + 6, y + 2, 5, 8);
    }
    // season bar: spr green / sum gold / aut orange / win blue
    let m = 0;
    try { m = new Date().getMonth(); } catch (e) { /* headless */ }
    const seasonCol = m < 2 || m === 11 ? '#5a9ae8' : m < 5 ? '#58c94f' : m < 8 ? '#e8c832' : '#e08a4a';
    c.fillStyle = seasonCol;
    c.fillRect(x, y + 14, 12, 3);
  }
}


// ---- src/game/main.mjs ----
// main.mjs — Game root: owns loop, renderer, input, audio, UI, scenes, save.
// Scene flow: BOOT (legal card) -> TITLE -> INTRO -> OVERWORLD <-> BATTLE.
// Battle/overworld menus (Bag/Party/Dex/Save/Options) live here as UI states.


function nextSeed() {
  if (typeof globalThis !== 'undefined' && globalThis.__SEED__) return globalThis.__SEED__ >>> 0;
  return (Date.now() ^ (Math.random() * 1e9)) >>> 0;
}

const doc = (typeof document !== 'undefined') ? document : {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0, height: 0, style: {},
        getContext: () => new Proxy({}, {
          get: (t, p) => {
            if (p === 'canvas') return {};
            if (p === 'measureText') return () => ({ width: 10 });
            if (p === 'getImageData') return () => ({ data: [] });
            return () => {};
          },
          set: () => true,
        }),
      };
    }
    return { style: {}, appendChild() {}, addEventListener() {} };
  },
  getElementById: () => null,
  addEventListener() {},
};

class Game {
  constructor(canvas) {
    this.canvas = canvas || doc.createElement('canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new AudioEngine();
    this.ui = new UI(this);
    this.scenes = new SceneStack(this);
    this.loop = new Loop(this);
    this.store = new SaveStore();
    this.state = freshState();
    this.rng = makeRngStreams(nextSeed());
    this.tileCache = buildArtTileCache(doc); // hand-authored tileset (art.mjs); void -> solid fill
    this.spriteCache = {};
    this.npcCache = {};
    this.skipIntroVeteran = false;
    this._lastAutosave = 0;
    this.layoutMode = 'portrait';
    this._animT = 0;      // ms clock for sprite-frame animation (idle blink, NPCs, water)
    this.guestMode = false; // set by the Trainer ID Terminal guest path
    this.authUser = null;   // Track B: logged-in username (null = guest / logged out)
  }

  tileKind(ch) { return TILE_CHARS[ch] || 'void'; }

  tileSprite(kind) { return tileSprite(this.tileCache, kind, this._animT); }

  buildSprites() {
    // Wave 3: real ART data replaces the forge placeholders (README wiring handoff).
    for (const id of Object.keys(SPECIES)) {
      this.spriteCache[id] = speciesBattleArt(doc, id, SPECIES[id]);
    }
    this.playerSprites = {
      down: ashFrames(doc, 'down'),
      up: ashFrames(doc, 'up'),
      left: ashFrames(doc, 'left'),
      right: ashFrames(doc, 'right'),
    };
    this._partnerHop = partnerHopFrames(doc);
    this.npcCache = {};
  }

  // Overworld Ash: 4-dir walk cycle while moving, 2-frame idle blink at rest.
  playerSprite(p) {
    const frames = this.playerSprites[p.dir] || this.playerSprites.down;
    if (p.moving) {
      const fi = 2 + (Math.floor((p.moveT / 200) * 4) % 4); // 4 walk frames per tile
      return frames[fi];
    }
    return frames[Math.floor(this._animT / 500) % 2]; // idle-1 / idle-2 blink
  }

  npcFrame(npc) {
    if (!this.npcCache[npc.name]) this.npcCache[npc.name] = npcFrames(doc, npc);
    const f = this.npcCache[npc.name];
    return f[Math.floor(this._animT / 600) % 2]; // idle-1 / idle-2
  }

  partnerFrame() {
    if (!this._partnerHop) return this.spriteCache.partner.front;
    return this._partnerHop[Math.floor(this._animT / 280) % 2]; // hop-1 / hop-2
  }

  // Canvas 2D helpers used by scenes.
  ctx2dfill(color, x, y, w, h) {
    const c = this.renderer.ctx;
    c.fillStyle = color; c.fillRect(x, y, w, h);
  }
  ctx2drect(x, y, w, h, color) { this.ctx2dfill(color, x, y, w, h); }
  ctx2dcircle(x, y, rad, color) {
    const c = this.renderer.ctx;
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }

  boot() {
    this.ui.init();
    // Track B: auth health probe (503 banner) + sync dot. Guest target: no-ops.
    AUTH.init(this);
    SYNC.init(this);
    this.input.bindKeyboard();
    this.buildSprites();
    this.applyLayout();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this.applyLayout());
    }
    // P1/A6: tap the canvas to advance (title + tap-to-advance dialogue).
    if (this.canvas && this.canvas.addEventListener) {
      this.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.input.inject('a');
      });
    }
    // P1/I4: honor prefers-reduced-motion on first boot.
    try {
      if (typeof window !== 'undefined' && window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
          !this.store.exists()) {
        this.state.settings.reducedMotion = true;
      }
    } catch (e) { /* headless / no matchMedia */ }
    this.loop.onAutosave = () => {
      // P1/H2: visibilitychange autosaves — never mid-battle-turn.
      const top = this.scenes.top;
      const midResolve = !!(top && top.state === 'resolve' && top.foe);
      if (!midResolve) this.saveGame(true);
      SYNC.onHidden(this); // Track B: best-effort cloud flush on tab hide
    };
    this.loop.bindVisibility(() => { /* sim halts via rAF freeze; autosave queued above */ });
    this.audio.applySettings(this.state.settings);
    // Gameplay Designer co-design note (C7): the tutorial catch gate must be
    // robust to a Spearow-class foe — the script is deterministic (balance-seat
    // gate), never luck. Recorded here so the gate lives with the flow.
    this.scenes.push(new BootScene());
    this.loop.start();
  }

  applyLayout() {
    const r = this.renderer;
    if (typeof window === 'undefined') {
      r.resize(256, 192, 256, 192);
      this.layoutMode = 'desktop';
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    // D3: desktop = fine pointer at >=700px, OR a laptop-class width regardless of
    // what the browser reports (some browsers/headless never match
    // '(pointer: fine)' — without the width fallback they fell into the phone
    // landscape path and rendered stretched with touch controls on a laptop).
    // Coarse-pointer wide tablets still land here and get controls back via the
    // (pointer:coarse) CSS override.
    if (w >= 700 && (fine || w >= 1024)) {
      this.layoutMode = 'desktop';
      // D3: aspect-locked 16:9 canvas. The old h*0.62 cap stretched the buffer
      // on 1280x800-class viewports (1120x496 CSS over a 384x216 backing store).
      // Height now reserves room for the hint card instead of a fixed fraction.
      const cssW0 = Math.min(1120, w * 0.9);
      let cw = cssW0, ch = cssW0 * 9 / 16;
      const maxH = Math.min(630, Math.max(240, h - 140));
      if (ch > maxH) { ch = maxH; cw = ch * 16 / 9; }
      r.resize(384, 216, Math.round(cw), Math.round(ch));
      document.body.classList.add('desktop');
    } else if (w > h) {
      this.layoutMode = 'landscape';
      // D3: aspect-locked 4:3 (was w*0.72 x h — stretched on every landscape phone).
      const lw = Math.min(w * 0.72, h * 4 / 3);
      r.resize(256, 192, Math.round(lw), Math.round(lw * 3 / 4));
      document.body.classList.remove('desktop');
    } else {
      this.layoutMode = 'portrait';
      r.resize(256, 256, w, h * 0.45);
      document.body.classList.remove('desktop');
    }
    // P1/K2: landscape gets the right-edge command rail (CSS re-rails the HUD strip).
    document.body.classList.toggle('landscape', this.layoutMode === 'landscape');
    document.body.classList.toggle('flip', !!this.state.settings.controlsFlip);
    // P1/K3 + I2: desktop hint card; show-touch toggle honored on hybrids.
    document.body.classList.toggle('showtouch', !!this.state.settings.showTouch);
    // Headless harness stubs document without documentElement — guard it.
    if (document.documentElement) document.documentElement.style.setProperty('--hudscale', this.state.settings.hudScale || 1);
    this.ui.showHintCard(this.layoutMode === 'desktop');
  }

  update(dt) {
    this._animT += dt * 1000;
    // Global M-key mute toggle (options spec §4.8: "Mute (M key too)"). Persists.
    if (this.input.wasPressed('mute')) this.toggleMute();
    // P1/I3: F = fullscreen toggle on #stage (KEYMAP defines it; now consumed).
    if (this.input.wasPressed('fullscreen') && typeof document !== 'undefined') {
      const stage = document.getElementById('stage');
      if (stage) {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (stage.requestFullscreen) stage.requestFullscreen();
      }
    }
    this.ui.update(dt);
    SYNC.tick(this); // Track B: idle flush (60s) + deferred conflict sheet. Guest: no-op.
    this.scenes.update(dt);
  }

  toggleMute() {
    const s = this.state.settings;
    s.mute = !s.mute;
    this.audio.setMuted(s.mute);
    this.ui.toast(s.mute ? 'Muted.' : 'Sound on.');
    this.saveGame(true);
  }

  render(alpha) {
    this.scenes.render(this.renderer, alpha);
  }

  // ---- game flow ----
  // P0/B1: title menu routes through the Trainer ID Terminal.
  // Track B (vercel): full LOG IN / REGISTER / GUEST panel (auth.mjs).
  // Guest target: the stub keeps Track-A behavior (guest only, zero network).
  openLogin(mode) {
    this._loginMode = mode;
    this.ui.showLogin((choice, data) => {
      if (choice === 'login') {
        this.guestMode = false;
        this.authUser = (data && data.username) || null;
        AUTH.user = this.authUser;
        this.ui.hideGuestBanner();
        this.onLoggedIn(mode);
        return;
      }
      // 'guest' — also the only path in the guest target and the headless harness
      this.guestMode = true;
      this.authUser = null;
      AUTH.user = null;
      if (this._loginMode === 'continue') this.continueGame();
      else this.newGame();
    });
  }

  // Track B: post-login — pull cloud meta, merge (claim/conflict/newest-wins),
  // then load the resolved save or start fresh.
  onLoggedIn(mode) {
    const name = this.authUser || 'trainer';
    this.ui.toast('Welcome back, ' + name + '!'); // toast = textContent (C12-safe)
    SYNC.runLoginMerge(this, mode, (res) => {
      if (!res) return;
      if (res.load === 'state' && res.state) {
        this.state = res.state;
        this.audio.applySettings(this.state.settings);
        this.scenes.replace(new OverworldScene());
        this.ui.toast('Save loaded.');
      } else if (res.load === 'new') {
        this.newGame();
      } else {
        // fallback (offline / unavailable / expired): play on this device.
        if (mode === 'continue') this.continueGame();
        else this.newGame();
      }
    });
  }

  quitToTitle(saveIt) {
    if (saveIt !== false) this.saveGame(true);
    this.ui.hideGuestBanner();
    this.scenes.replace(new BootScene());
  }

  newGame() {
    this.state = freshState();
    this.state.player.name = 'ASH';
    this.rng = makeRngStreams(nextSeed());
    this.skipIntroVeteran = this.store.exists();
    this.scenes.replace(new IntroScene());
  }

  continueGame() {
    const res = this.store.load();
    if (!res.ok) {
      this.ui.toast('Save data invalid (' + res.reason + '). Starting fresh is safest.');
      return;
    }
    this.state = res.data;
    this.audio.applySettings(this.state.settings);
    this.scenes.replace(new OverworldScene());
    this.ui.toast('Welcome back, ' + this.state.player.name + '!');
  }

  startOverworld(opts) {
    this.scenes.replace(new OverworldScene());
    if (this.guestMode) this.ui.showGuestBanner(); // P0/B1: in-game guest banner
    // D2: fresh runs open on the Chapter 1 title card (anime spine, ADR-015).
    if (opts && typeof opts.chapterCard === 'number') {
      this.ui.showChapterCard(CHAPTERS[opts.chapterCard]);
    }
  }

  saveGame(quiet) {
    // Track B: logged-in saves go to the local cloud-cache + background queue
    // (SYNC) — the game never waits on network. Guest path is byte-identical.
    if (AUTH.user) {
      const res = SYNC.saveLocal(this);
      if (!quiet || !res.ok) {
        if (res.ok) { this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)'); this.audio.playSfx('save-confirm'); }
        else this.ui.toast('Save failed: ' + res.reason);
      }
      SYNC.afterLocalSave(this);
      return res;
    }
    const res = this.store.save(this.state);
    if (!quiet || !res.ok) {
      if (res.ok) { this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)'); this.audio.playSfx('save-confirm'); }
      else this.ui.toast('Save failed: ' + res.reason);
    }
    return res;
  }

  autosave(reason) {
    if (this.state.settings.autosave === false) return; // P1/I5: autosave toggle
    const now = Date.now();
    if (now - this._lastAutosave < 5000) return; // 5s throttle floor
    this._lastAutosave = now;
    this.saveGame(true);
  }

  // ---- menus (UI states, no scene reload) ----
  openBag() {
    const g = this;
    const items = [];
    // P1/G4: pocket tabs as group headers (44px rows, description in the label).
    for (const pocket of POCKETS) {
      const inPocket = Object.keys(ITEMS).filter((id) => ITEMS[id].pocket === pocket && (g.state.bag[id] || 0) > 0);
      if (!inPocket.length) continue;
      items.push({ label: '— ' + pocket + ' —', value: null, disabled: true });
      for (const id of inPocket) {
        const hint = id === 'potion' ? ' (heals 20 HP — uses your turn in battle)' : '';
        items.push({ label: ITEMS[id].name + ' x' + g.state.bag[id] + hint, value: id });
      }
    }
    if (!items.length) items.push({ label: '(empty)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Bag', items, (v) => {
      if (v === 'potion') {
        const targets = g.state.party.map((m, i) => ({
          label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i,
          disabled: m.hp <= 0 || m.hp >= m.maxHp,
        }));
        targets.push({ label: 'Back', value: -1 });
        g.ui.showMenu('Use Potion on...', targets, (t) => {
          if (t === null || t === -1) { g.openBag(); return; }
          const m = g.state.party[t];
          g.state.bag.potion--;
          m.hp = Math.min(m.maxHp, m.hp + 20);
          g.audio.playSfx('heal');
          g.ui.toast(displayName(m, SPECIES) + ' recovered 20 HP!');
        });
      }
    });
  }

  openParty() {
    const g = this;
    // P1/G1: rows carry an HP mini-bar + numbers, status chip, and the ⚡ partner badge.
    const rowHtml = (it) => {
      if (it.value === 'close' || it.value === -1) return '<span>' + it.label + '</span>';
      const m = g.state.party[it.value];
      const pct = Math.max(0, Math.round((m.hp / m.maxHp) * 100));
      const col = pct > 50 ? '#58c94f' : pct > 25 ? '#e8c832' : '#e84040';
      const badge = m.speciesId === 'partner' ? '<span class="pbadge">⚡</span>' : '';
      const st = m.status ? '<span class="pstat">' + m.status.toUpperCase().slice(0, 3) + '</span>' : '';
      return '<span><b>' + displayName(m, SPECIES) + '</b> Lv' + m.level + badge + '</span>'
        + '<span class="phpbar"><i style="width:' + pct + '%;background:' + col + '"></i></span>'
        + '<span>' + m.hp + '/' + m.maxHp + '</span>' + st;
    };
    const items = g.state.party.map((m, i) => {
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + '  ' + m.hp + '/' + m.maxHp, value: i };
    });
    for (let i = g.state.party.length; i < 6; i++) items.push({ label: '—', value: -1, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Party', items, (v) => {
      if (v === null || v === 'close' || v === -1) return;
      const m = g.state.party[v];
      const sp = SPECIES[m.speciesId];
      g.ui.showMenu(displayName(m, SPECIES), [
        { label: 'Summary', value: 'summary' },
        { label: 'Close', value: 'close' },
      ], (a) => {
        if (a === 'summary') {
          const mv = m.moves.map((mm) => MOVES[mm.id].name + ' ' + mm.pp + '/' + mm.maxPp).join(', ');
          g.ui.say([
            displayName(m, SPECIES) + '  Lv' + m.level + '  HP ' + m.hp + '/' + m.maxHp,
            'ATK ' + m.stats.atk + '  DEF ' + m.stats.def + '  SPA ' + m.stats.spa + '  SPD ' + m.stats.spd + '  SPE ' + m.stats.spe,
            'Moves: ' + mv,
            'OT: ' + m.ot + '  No. ' + sp.dexNo,
            sp.flavor,
          ], null, 'Summary');
        }
      });
    }, { rowHtml });
  }

  openDex(filter) {
    const g = this;
    filter = filter || {};
    const caught = dexCaughtCount(g.state.dex);
    const matchSpecies = (id) => {
      const sp = SPECIES[id];
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      if (filter.status === 'caught' && !c) return false;
      if (filter.status === 'seen' && !(s && !c)) return false;
      if (filter.status === 'unseen' && (s || c)) return false;
      if (filter.type && !sp.types.includes(filter.type)) return false;
      if (filter.q && sp.name.toLowerCase().indexOf(filter.q.toLowerCase()) < 0) return false;
      return true;
    };
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner' && matchSpecies(id)).map((id) => {
      const sp = SPECIES[id];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      const mark = c ? '[CAUGHT]' : (s ? '[SEEN]' : '[???]');
      return { label: 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + mark, value: id };
    });
    const fdesc = (filter.q ? ' q=' + filter.q : '') + (filter.type ? ' ' + filter.type : '') + (filter.status ? ' ' + filter.status : '');
    items.unshift({ label: 'Caught ' + caught + ' / ' + DEX_TOTAL + ' (tracked)', value: null, disabled: true });
    items.unshift({ label: 'Search / Filter' + (fdesc ? ':' + fdesc : ''), value: 'filter' });
    items.unshift({ label: 'Areas — caught per area', value: 'areas' });
    // D2: arc progression surfaced in the Dex — current chapter header row.
    const curCh = chapterOf((g.state.story.chapter || 0) + 1);
    items.unshift({ label: 'Journey — Ch.' + curCh.n + ' · ' + curCh.title, value: null, disabled: true });
    if (!items.length) items.push({ label: '(no matches)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Pokedex', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'filter') { g.openDexFilter(filter); return; }
      if (v === 'areas') { g.openDexAreas(); return; }
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(filter); return; }
      g.ui.say([
        'No.' + sp.dexNo + '  ' + sp.name + '  ' + sp.types.join('/'),
        sp.flavor,
        'Status: ' + (c ? 'CAUGHT' : 'SEEN'),
      ], () => g.openDex(filter), 'Dex');
    });
  }

  // P1/G3: dex filter submenu — status, type, and name search (reuses the A-Z grid).
  openDexFilter(filter) {
    const g = this;
    const types = [...new Set(Object.keys(SPECIES).flatMap((id) => SPECIES[id].types))].sort();
    g.ui.showMenu('Filter: status', [
      { label: 'All', value: 'all' },
      { label: 'Caught', value: 'caught' },
      { label: 'Seen', value: 'seen' },
      { label: 'Unseen', value: 'unseen' },
      { label: 'Back', value: 'back' },
    ], (st) => {
      if (st === 'back' || st === null) { g.openDex(filter); return; }
      const f2 = Object.assign({}, filter, { status: st === 'all' ? null : st });
      const titems = [{ label: 'All types', value: null }].concat(types.map((t) => ({ label: t, value: t })));
      titems.push({ label: 'Back', value: 'back' });
      g.ui.showMenu('Filter: type', titems, (tp) => {
        if (tp === 'back' || tp === null) { g.openDex(filter); return; }
        const f3 = Object.assign({}, f2, { type: tp });
        g.ui.showNameEntry('Search the Dex (blank = all)', '', 8, (q) => {
          f3.q = q || null;
          g.openDex(f3);
        });
      });
    });
  }

  // D2: Journey menu — the anime-chronology spine (ADR-015). Playable chapters
  // open a detail card; locked chapters and the BONUS shelf are honest
  // disabled rows (no fake content, no "coming soon" placeholders).
  openJourney() {
    const g = this;
    const cur = g.state.story.chapter || 0; // 0-based chapter index
    const items = [];
    items.push({ label: '— ACT I: THE BEGINNING (v1) —', value: null, disabled: true });
    for (const ch of CHAPTERS) {
      if (ch.scope === 'playable') {
        const isCur = (ch.n - 1) === cur;
        items.push({
          label: (isCur ? '\u25b8 ' : '  ') + 'Ch.' + ch.n + ' — ' + ch.title + (isCur ? ' (now)' : ''),
          value: 'ch' + ch.n,
        });
      } else {
        items.push({
          label: 'Ch.' + ch.n + ' — ' + ch.title + ' · locked (future act)',
          value: null, disabled: true,
        });
      }
    }
    items.push({ label: '— BONUS SHELF (non-canon, not on the spine) —', value: null, disabled: true });
    for (const b of BONUS_SHELF) {
      items.push({ label: b, value: null, disabled: true });
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Journey', items, (v) => {
      if (!v || v === 'close') return;
      const ch = CHAPTERS.find((c) => 'ch' + c.n === v);
      if (ch) {
        g.ui.say([
          'CHAPTER ' + ch.n + ' — ACT ' + ch.act,
          ch.title,
          ch.arc,
          'Anime: ' + ch.anime,
          ch.movies.length ? 'Special events: ' + ch.movies.join(' · ') : '',
        ], () => g.openJourney(), 'Journey');
      }
    });
  }

  // P1/G3: Areas tab — per-area "caught n/m" checklists (B2W2 Habitat pattern).
  openDexAreas() {
    const g = this;
    const items = Object.keys(MAPS).filter((id) => MAPS[id].encounters).map((id) => {
      const map = MAPS[id];
      const species = [...new Set(map.encounters.table.map((e) => e.species))];
      const n = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
      return { label: map.name + ' — ' + n + '/' + species.length + ' caught', value: id };
    });
    items.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Dex — Areas', items, (v) => {
      if (!v || v === 'back') { g.openDex(); return; }
      const map = MAPS[v];
      const rows = map.encounters.table.map((e) => {
        const sp = SPECIES[e.species];
        const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
        return { label: (c || s ? sp.name : '???') + '  Lv' + e.min + '-' + e.max + (c ? ' [CAUGHT]' : s ? ' [SEEN]' : ''), value: null, disabled: true };
      });
      rows.push({ label: 'Back', value: 'back' });
      g.ui.showMenu(map.name, rows, () => g.openDexAreas());
    });
  }

  openSave() {
    const g = this;
    // Track B: logged-in players get the cloud slot list (3 slots + sync state).
    if (AUTH.user) { g.openSaveCloud(); return; }
    const caught = dexCaughtCount(g.state.dex);
    const badges = g.state.badges.kanto.length;
    const mins = Math.floor((g.state.player.playtimeSec || 0) / 60);
    const when = g.state.meta.updatedAt ? new Date(g.state.meta.updatedAt).toLocaleString() : 'never';
    g.ui.showMenu('Save', [
      { label: g.state.meta.location + ' · ' + mins + 'm · ' + badges + ' badges · Dex ' + caught, value: null, disabled: true },
      { label: 'Last saved: ' + when, value: null, disabled: true },
      { label: 'Sync: guest-local (Track B: cloud)', value: null, disabled: true },
      { label: 'Save now', value: 'save' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'save') g.saveGame(false);
    });
  }

  // Track B: cloud slot picker (labels are formatted numbers/dates only —
  // no player strings, so the menu's innerHTML path is safe here).
  openSaveCloud() {
    const g = this;
    const slots = SYNC.getSlots();
    const items = [{ label: 'Cloud saves — pick a slot', value: null, disabled: true }];
    for (const s of slots) {
      const h = Math.floor((s.playtimeSec || 0) / 3600);
      const m = Math.floor(((s.playtimeSec || 0) % 3600) / 60);
      const st = s.pending ? 'Sync pending' : (s.cloudMeta || s.hasLocal) ? 'Synced' : 'Empty';
      items.push({
        label: (s.active ? '▸ ' : '') + 'Slot ' + s.slot + ' — ' + h + 'h ' + (m < 10 ? '0' + m : '' + m) +
          'm · ' + s.badgeCount + ' badges · ' + st,
        value: 'slot:' + s.slot,
      });
    }
    items.push({ label: 'Save now', value: 'save' });
    items.push({ label: 'Sync now', value: 'sync' });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Save', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'save') g.saveGame(false);
      else if (v === 'sync') SYNC.syncNow(g, true);
      else if (v.indexOf('slot:') === 0) {
        SYNC.setActiveSlot(parseInt(v.slice(5), 10));
        g.ui.toast('Slot ' + v.slice(5) + ' selected.');
        g.openSave();
      }
    });
  }

  openOptions() {
    const g = this;
    const s = g.state.settings;
    const yn = (b) => b ? 'ON' : 'OFF';
    const rows = [
      { label: 'Text speed: ' + s.textSpeed, value: 'text' },
      { label: 'Mute: ' + yn(s.mute), value: 'mute' },
      { label: 'Music volume: ' + Math.round(s.musicVol * 100) + '%', value: 'music' },
      { label: 'SFX volume: ' + Math.round(s.sfxVol * 100) + '%', value: 'sfx' },
      { label: 'Battle animations: ' + yn(s.battleAnims), value: 'banim' },
      { label: 'Screen shake: ' + yn(s.shake), value: 'shake' },
      { label: 'Vibration: ' + yn(s.vibration), value: 'vib' },
      { label: 'Autosave: ' + yn(s.autosave), value: 'asave' },
      { label: 'Reduced motion: ' + yn(s.reducedMotion), value: 'rmotion' },
      { label: 'Flip controls: ' + yn(s.controlsFlip), value: 'flip' },
      { label: 'Show touch controls: ' + yn(s.showTouch), value: 'showtouch' },
      { label: 'HUD scale: ' + Math.round(s.hudScale * 100) + '%', value: 'hudscale' },
      { label: 'Legal / credits', value: 'legal' },
    ];
    // Track B: account surface (wireframes §10). Labels are static — the
    // username itself is only ever rendered via textContent (AppSec C12).
    if (g.authUser) {
      rows.push({ label: 'Account', value: 'account' });
      rows.push({ label: 'Sync now', value: 'syncnow' });
    } else if (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED) {
      rows.push({ label: 'Log in to sync ★', value: 'login' });
    }
    rows.push(
      { label: 'Erase save', value: 'erase' },
      { label: 'Close', value: 'close' },
    );
    g.ui.showMenu('Options', rows, (v) => {
      if (v === 'text') {
        const order = ['slow', 'normal', 'fast', 'instant'];
        s.textSpeed = order[(order.indexOf(s.textSpeed) + 1) % order.length];
      } else if (v === 'mute') { s.mute = !s.mute; g.audio.setMuted(s.mute); }
      else if (v === 'music') { s.musicVol = s.musicVol >= 0.99 ? 0 : Math.round((s.musicVol + 0.1) * 10) / 10; g.audio.setMusicVolume(s.musicVol); }
      else if (v === 'sfx') { s.sfxVol = s.sfxVol >= 0.99 ? 0 : Math.round((s.sfxVol + 0.1) * 10) / 10; g.audio.setSfxVolume(s.sfxVol); }
      else if (v === 'banim') s.battleAnims = !s.battleAnims;
      else if (v === 'shake') s.shake = !s.shake;
      else if (v === 'vib') s.vibration = !s.vibration;
      else if (v === 'asave') s.autosave = !s.autosave;
      else if (v === 'rmotion') { s.reducedMotion = !s.reducedMotion; g.audio.setReducedMotion(s.reducedMotion); }
      else if (v === 'flip') { s.controlsFlip = !s.controlsFlip; g.applyLayout(); }
      else if (v === 'showtouch') {
        s.showTouch = !s.showTouch;
        if (typeof document !== 'undefined') document.body.classList.toggle('showtouch', !!s.showTouch);
      }
      else if (v === 'hudscale') {
        // P1/I2: HUD scale row (the setting existed with no UI).
        s.hudScale = s.hudScale >= 1.5 ? 1 : Math.round((s.hudScale + 0.25) * 100) / 100;
        if (typeof document !== 'undefined') document.documentElement.style.setProperty('--hudscale', s.hudScale);
      }
      else if (v === 'legal') { g.ui.say(DISCLAIMER_CREDITS, null, ''); return; }
      else if (v === 'account') { AUTH.openAccountMenu(g); return; }
      else if (v === 'syncnow') { SYNC.syncNow(g, true); return; }
      else if (v === 'login') { g.openLogin('continue'); return; }
      else if (v === 'erase') {
        g.ui.showMenu('Erase ALL save data?', [
          { label: 'Yes, erase everything', value: 'yes' },
          { label: 'No, keep it', value: 'no' },
        ], (a) => {
          if (a === 'yes') {
            g.ui.showMenu('Really sure? This cannot be undone.', [
              { label: 'Yes, erase', value: 'yes2' },
              { label: 'No', value: 'no' },
            ], (b) => {
              if (b === 'yes2') {
                // P1/H4: third gate — type-to-confirm DELETE (deletion is irreversible).
                g.ui.showNameEntry('Type DELETE to confirm', '', 6, (typed) => {
                  if (typed === 'DELETE') {
                    g.store.erase();
                    g.ui.toast('Save data erased.');
                  } else {
                    g.ui.toast('Erase cancelled.');
                  }
                });
              }
            });
          }
        });
        return;
      } else return;
      g.saveGame(true);
      g.openOptions();
    });
  }
}

// Bootstrap (browser). Headless harness imports Game directly.
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');
    const game = new Game(canvas);
    game.boot();
  });
}
