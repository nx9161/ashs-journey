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
