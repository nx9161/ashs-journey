// note-tables.mjs — the full original score for Kian's Journey.
// Seat 24 (Voice Designer), Wave 2. Contract: docs/contracts.md §2.
// VIRAL AUDIO PASS (2026-11-17): every music loop and SFX below (except the
// evolution sting, owned by the Evolution Ceremony build, and the species
// cries, out of scope) was recomposed for trending-feed energy — hook-first
// leads, build-and-drop drum structures, four-on-the-floor drive, meme
// effect CLASSES (boom, scratch-stop, orchestra-hit, alarm) synthesized
// from scratch. 100% original compositions: no sampled audio, no audio
// files (zero-audio-file rule), no melody or recording borrowed from any
// existing track, viral or otherwise. The style is the brief; every note
// is new work.
//
// FORMAT (contract §2.1):
//   Music:  { id, title, bpm, loop:true, tracks:[{ wave:'pulse'|'triangle'|'noise',
//             duty:0.125|0.25|0.5 (pulse only), vol:0..1, notes:[[beat,pitch,beats]...] }] }
//   SFX:    { id, wave, duty, vol, env:[attack,decay] (s), notes:[...] }
// Pitches are scientific notation (A4=440); null pitch on noise = unpitched hit.
// SFX beats are engine-scaled at 0.06 s/beat; music beats are real beats at bpm.

// --- tiny deterministic builders (still static note tables; no runtime randomness) ---
const HATS = (from, to, step, beats) => {
  const n = [];
  for (let b = from; b < to - 1e-9; b += step) n.push([+b.toFixed(3), null, beats]);
  return n;
};
const KICKS = (beatsArr) => beatsArr.map((b) => [b, null, 0.25]);
const CLAPS = (beatsArr) => beatsArr.map((b) => [b, null, 0.5]); // noise burst = clap class
const PUMP = (from, to, lo, hi) => {
  const n = [];
  for (let b = from; b < to - 1e-9; b += 0.5) n.push([+b.toFixed(3), (Math.round(b * 2) % 2 === 0 ? lo : hi), 0.5]);
  return n;
};
// mel('E5 G5x1.5 R A5x2', step) — compact melody notation: space-separated
// tokens; each is a pitch with an optional x<beats> duration (default =
// step, itself 0.5); 'R' is a rest (advances the cursor, emits no note).
// Returns contract note tuples [beat, pitch, beats].
const mel = (s, step = 0.5) => {
  const out = []; let b = 0;
  for (const tok of s.trim().split(/\s+/)) {
    const m = /^([A-G][#b]?\d|R)(?:x(\d*\.?\d+))?$/.exec(tok);
    const d = m[2] ? parseFloat(m[2]) : step;
    if (m[1] !== 'R') out.push([+b.toFixed(3), m[1], d]);
    b += d;
  }
  return out;
};
// ARP(['C4','E4','G4'], 0, 16, 1) — cycle pitches every `step` beats.
const ARP = (pitches, from, to, step = 1) => {
  const n = []; let i = 0;
  for (let b = from; b < to - 1e-9; b += step) n.push([+b.toFixed(3), pitches[i++ % pitches.length], step]);
  return n;
};
// Drum kits (noise stems; kick = short burst, clap = long burst, hat = tick).
const DRIVE = () => KICKS([0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15]).concat(CLAPS([2, 6, 10, 14])).concat(HATS(0.5, 16, 1, 0.125));
const HALF = () => KICKS([0, 4, 8, 9, 11, 12, 13, 15]).concat(CLAPS([10, 14]))
  .concat(HATS(0.5, 8, 1, 0.125)).concat(HATS(8.5, 16, 0.5, 0.125)); // build 8, drop 8
const STONE = () => KICKS([0, 8]).concat(CLAPS([4, 12])).concat(HATS(0.5, 16, 1, 0.125));

// ============================================================ MUSIC ====
// The viral-pass idiom: hook-first lead (tracks[0]), chord arp or pads,
// octave-pump or walking bass, and a kit with a build half and a drop half.
// Every lead carries its own interval fingerprint (verify-audio [9]).
export const MUSIC = {
  'title-theme': {
    id: 'title-theme', title: 'Curtain Up (title, original)', bpm: 120, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.42, notes: mel('E5 G5 A5x1 G5 E5 D5 E5 G5 A5x1 G5 E5 D5x1 R E5 G5 A5 C6x1 B5 A5 G5 A5x1 G5 E5 D5x1 C5x1') },
      { wave: 'pulse', duty: 0.5, vol: 0.18, notes: mel('C4x2 G3x2 A3x2 G3x2 F3x2 G3x2 C4x2 G3x2', 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('C2 G2 C2 G2 F2 C3 F2 C3 C2 G2 C2 G2 F2 G2 C2x2', 1) },
      { wave: 'noise', vol: 0.3, notes: HALF() },
    ],
  },

  'battle-wild-theme': {
    id: 'battle-wild-theme', title: 'Ambush Anthem (wild battle, original)', bpm: 160, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.48, notes: mel('A4 A4 C5 E5 A5x1 G5 E5 D5 E5 G5x1 E5 D5 C5 A4 A4 A4 C5 E5 A5x1 C6x1 B5x1 G5 E5 D5x1 A4x1') },
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: ARP(['A3', 'C4', 'E4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.6, notes: PUMP(0, 4, 'A1', 'A2').concat(PUMP(4, 8, 'F1', 'F2')).concat(PUMP(8, 12, 'G1', 'G2')).concat(PUMP(12, 16, 'E1', 'E2')) },
      { wave: 'noise', vol: 0.38, notes: DRIVE() },
    ],
  },

  'battle-trainer-theme': {
    id: 'battle-trainer-theme', title: 'Called Out (trainer battle, original)', bpm: 168, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.48, notes: mel('E5 E5 G5 B5x1 A5 G5 E5 F#5 G5 A5x1 B5x1 A5 G5 E5 E5 G5 B5x1 D6x1 C6 B5x1 A5 G5 F#5x1 E5x1') },
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: ARP(['E4', 'G4', 'B4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.6, notes: PUMP(0, 4, 'E1', 'E2').concat(PUMP(4, 8, 'C1', 'C2')).concat(PUMP(8, 12, 'D1', 'D2')).concat(PUMP(12, 16, 'B1', 'B2')) },
      { wave: 'noise', vol: 0.38, notes: DRIVE() },
    ],
  },

  'route1-theme': {
    id: 'route1-theme', title: 'Road Out, Loud (Arden route, original)', bpm: 138, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.44, notes: mel('D5 F#5 A5x1 D6 C#6 B5x1 A5 F#5 G5 A5x1 F#5 D5x1 A5 G5 F#5 E5 D5x1.5 F#5 G5 A5 B5 A5 G5x1 F#5x1') },
      { wave: 'pulse', duty: 0.25, vol: 0.14, notes: ARP(['F#4', 'A4', 'D5'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('D2 A2 B2 G2 D2 A2 G2 A2 D2 A2 B2 G2 E2 A2 D2x2', 1) },
      { wave: 'noise', vol: 0.26, notes: HALF() },
    ],
  },

  'pallet-theme': {
    id: 'pallet-theme', title: 'Hometown Morning Groove (Dawnwick, original)', bpm: 100, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: mel('G4 A4 B4x1 C5 B4 A4x1 G4 A4 B4x1.5 A4 G4x1 A4 B4 C5x1 D5 C5 B4x1 A4x1 G4 A4 B4 G4x1.5') },
      { wave: 'pulse', duty: 0.25, vol: 0.14, notes: ARP(['B3', 'D4', 'G4'], 0, 16, 2) },
      { wave: 'triangle', vol: 0.5, notes: mel('G2x2 C3x2 D3x2 G2x2 E3x2 C3x2 D3x2 G2x2', 1) },
      { wave: 'noise', vol: 0.15, notes: KICKS([0, 8]).concat(HATS(4, 16, 4, 0.125)) },
    ],
  },

  'viridian-theme': {
    id: 'viridian-theme', title: 'Crossroads Pop (Fernmere register, original)', bpm: 124, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.44, notes: mel('E5 G5 A5x1 G5 E5 D5x1 E5x1 C5 D5 E5x1 G5x1 F5 A5 G5x1 E5 D5 C5x1 D5 E5 G5x1 C6x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.15, notes: ARP(['E4', 'G4', 'C5'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('C2 E2 F2 G2 A2 G2 F2 E2 F2 A2 G2 E2 D2 G2 C2x2', 1) },
      { wave: 'noise', vol: 0.26, notes: HALF() },
    ],
  },

  'center-theme': {
    id: 'center-theme', title: 'Soft Reset (Center, original)', bpm: 92, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.3, notes: mel('F5 A5 C6x2 A5 G5 F5x2 E5 G5 Bb5x2 A5 G5 F5x1 E5x1 D5x1 F5x3') },
      { wave: 'pulse', duty: 0.5, vol: 0.14, notes: mel('F3x4 C3x4 Bb2x4 F3x4', 1) },
      { wave: 'triangle', vol: 0.5, notes: mel('F2x2 C3x2 F2x2 C3x2 Bb2x2 F2x2 C3x2 F2x2', 1) },
    ],
  },

  'pewter-theme': {
    id: 'pewter-theme', title: 'Stone & Swagger (Flintridge register, original)', bpm: 110, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.44, notes: mel('E5x1 G5 A5 B5x1 C6x1 B5 A5 G5x1 A5 B5 Rx1 G5x1 A5 B5 C6x1 B5x1 A5 G5 E5x2.5 R') },
      { wave: 'pulse', duty: 0.25, vol: 0.13, notes: ARP(['E4', 'G4', 'B4'], 0, 16, 2) },
      { wave: 'triangle', vol: 0.55, notes: mel('E2x2 G2x2 A2x2 B2x2 C3x2 B2x2 A2x2 E2x2', 1) },
      { wave: 'noise', vol: 0.3, notes: STONE() },
    ],
  },

  'gym-theme': {
    id: 'gym-theme', title: 'Full House (gym, original)', bpm: 150, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.48, notes: mel('B4 D5 F#5x1 B5 A5 G5x1 F#5 E5 D5x1 E5 F#5 Rx1 B4 D5 E5 F#5 G5x1 F#5 R E5x1 D5 B4x2 R') },
      { wave: 'pulse', duty: 0.5, vol: 0.17, notes: mel('B3 F#4 B3 F#4 G3 E4 G3 E4 A3 F#4 A3 F#4 B3x2 F#4x2', 1) },
      { wave: 'triangle', vol: 0.6, notes: PUMP(0, 4, 'B1', 'B2').concat(PUMP(4, 8, 'G1', 'G2')).concat(PUMP(8, 12, 'A1', 'A2')).concat(PUMP(12, 16, 'F#1', 'F#2')) },
      { wave: 'noise', vol: 0.38, notes: DRIVE() },
    ],
  },

  // ---- ceremony loops: one theme per ceremony (leader / legendary /
  // contest / the shared Mart) — viral-pass recompositions, each with its
  // own interval fingerprint (verify-audio [9]); wiring pinned by [8c]. ----
  'battle-leader-theme': {
    id: 'battle-leader-theme', title: 'Standard of the House (leader battle, original)', bpm: 176, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.48, notes: mel('D5x.75 F5x.25 A5 D6 C6x1 A5 F5 F5x.75 A5x.25 D6 C6 Bb5x1 A5 G5 E5x.75 F5x.25 G5 A5 Bb5x1 A5 G5 A5x.75 C6x.25 F6 E6 D6x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.17, notes: mel('D4x2 F4x2 Bb3x2 A3x2 C4x2 E4x2 F4x2 D4x2', 1) },
      { wave: 'triangle', vol: 0.58, notes: PUMP(0, 4, 'D2', 'D3').concat(PUMP(4, 8, 'Bb1', 'Bb2')).concat(PUMP(8, 12, 'C2', 'C3')).concat(PUMP(12, 16, 'A1', 'A2')) },
      { wave: 'noise', vol: 0.34, notes: DRIVE() },
    ],
  },

  'battle-legendary-theme': {
    id: 'battle-legendary-theme', title: 'Sovereign Weather (legendary battle, original)', bpm: 126, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.46, notes: mel('A4x2 E5x2 C6x3 B5x1 A5x2 G5x1 E5x1 F5x2 E5x2') },
      { wave: 'pulse', duty: 0.125, vol: 0.18, notes: mel('A3x4 F3x4 C3x4 E3x4', 1) },
      { wave: 'triangle', vol: 0.6, notes: mel('A2x4 F2x4 C3x4 E2x4', 1) },
      { wave: 'noise', vol: 0.25, notes: KICKS([0, 4, 8, 12]).concat(CLAPS([6, 14])).concat(HATS(0, 16, 2, 0.125)) },
    ],
  },

  'contest-theme': {
    id: 'contest-theme', title: 'Center Stage (contest, original)', bpm: 140, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.44, notes: mel('E5 G5 C6x1 B5 G5 A5x1 G5 E5 F5 A5 G5x1 E5 R F5 A5 D6x1 C6 A5 G5x1 A5 F5 E5 G5 C6x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.15, notes: ARP(['E4', 'G4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('C2 G2 C2 G2 F2 C3 G2 B2 F2 C3 D2 A2 F2 C3 G2x2', 1) },
      { wave: 'noise', vol: 0.24, notes: HALF() },
    ],
  },

  'mart-theme': {
    id: 'mart-theme', title: 'Checkout Groove (Mart, original)', bpm: 104, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.34, notes: mel('A4 C5 F5x1.5 E5 D5 C5 A4x1 Bb4 C5x1 A4 G4x1 A4 C5 D5x1 C5 A4 G4x1 G4x1 A4 F4x2 R') },
      { wave: 'pulse', duty: 0.125, vol: 0.14, notes: ARP(['F4', 'A4', 'C5'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.52, notes: PUMP(0, 4, 'F1', 'F2').concat(PUMP(4, 8, 'Bb1', 'Bb2')).concat(PUMP(8, 12, 'C2', 'C3')).concat(PUMP(12, 16, 'F1', 'F2')) },
      { wave: 'noise', vol: 0.22, notes: KICKS([0, 8]).concat(CLAPS([4, 12])).concat(HATS(0.5, 16, 0.5, 0.125)) },
    ],
  },

  // ---- region pairs: one town+route identity per region (NO-SAME-KIT
  // audio charter), recomposed in the viral idiom. ----
  'amber-town-theme': {
    id: 'amber-town-theme', title: 'Salt Air Pop (Amber town, original)', bpm: 108, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.42, notes: mel('G4 C5 E5x1.5 D5 C5 A4 G4x1 A4 C5x1 G4 E4x1 A4 C5 D5x1.5 E5 G5 E5 E5 D5 C5x2.5 R') },
      { wave: 'pulse', duty: 0.5, vol: 0.15, notes: ARP(['E4', 'G4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.5, notes: mel('C3x2 G2x2 A2x2 E2x2 F2x2 C3x2 G2x2 C3x2', 1) },
      { wave: 'noise', vol: 0.18, notes: KICKS([0, 8]).concat(CLAPS([8])).concat(HATS(0.5, 16, 1, 0.125)) },
    ],
  },

  'amber-route-theme': {
    id: 'amber-route-theme', title: 'Trade Wind Sprint (Amber route, original)', bpm: 128, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.45, notes: mel('A4 C#5 E5x.75 A5x.75 G5x1 E5 D5 E5x1 C#5 A4x1 Rx1 D5 E5 G5x.75 E5x.75 A5x1 G5 E5x1 D5 A4x2 R') },
      { wave: 'pulse', duty: 0.5, vol: 0.14, notes: ARP(['E4', 'A4', 'C#5'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: PUMP(0, 4, 'A1', 'A2').concat(PUMP(4, 8, 'G1', 'G2')).concat(PUMP(8, 12, 'F1', 'F2')).concat(PUMP(12, 16, 'E1', 'E2')) },
      { wave: 'noise', vol: 0.26, notes: HALF() },
    ],
  },

  'yamato-town-theme': {
    id: 'yamato-town-theme', title: 'Temple Bell Dusk (Yamato town, original)', bpm: 96, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: mel('A4x1.5 D5x1.5 F5 E5 D5x2 C5 A4 D5x1 F5x1.5 A5x1.5 G5 F5 E5x1.5 D5x1.5 C5 D5') },
      { wave: 'pulse', duty: 0.25, vol: 0.14, notes: mel('F4 Rx3 A4 Rx3 F4 Rx3 E4 Rx3', 1) },
      { wave: 'triangle', vol: 0.5, notes: mel('D3x4 G2x4 D3x4 A2x4', 1) },
      { wave: 'noise', vol: 0.12, notes: [[0, null, 0.5], [8, null, 0.5]].concat(HATS(3.5, 16, 4, 0.125)) },
    ],
  },

  'yamato-route-theme': {
    id: 'yamato-route-theme', title: 'Pilgrim Sprint (Yamato route, original)', bpm: 136, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.45, notes: mel('E5 B4 E5 G5 A5x1 G5 E5 E5 D5 B4 D5 E5x2 G5 A5 B5x1 A5 G5 E5x1 D5 E5 G5 A5 B5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.13, notes: ARP(['B3', 'E4', 'G4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: PUMP(0, 4, 'E1', 'E2').concat(PUMP(4, 8, 'G1', 'G2')).concat(PUMP(8, 12, 'A1', 'A2')).concat(PUMP(12, 16, 'B1', 'B2')) },
      { wave: 'noise', vol: 0.26, notes: HALF() },
    ],
  },

  'maris-town-theme': {
    id: 'maris-town-theme', title: 'Harbour Bounce (Maris town, original)', bpm: 120, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.44, notes: mel('F5 A5x1 G5 F5 E5 F5x1 C5x1.5 D5 E5 F5 Rx1 A5 G5x1 F5 E5 D5x1 C5 D5 C5 D5x1 F5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.14, notes: ARP(['C4', 'F4', 'A4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('F2 C3 F2 C3 Bb1 F2 C2 G2 F2 C3 D2 A2 Bb1 F2 C2x2', 1) },
      { wave: 'noise', vol: 0.2, notes: HALF() },
    ],
  },

  'maris-route-theme': {
    id: 'maris-route-theme', title: 'Open Water Sprint (Maris route, original)', bpm: 144, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: mel('D5 D5 G5 A5 B5x1 A5 G5 G5 F#5 E5 D5 E5x1 F#5 R G5 G5 B5 D6 B5x1 A5 G5 B5 A5 G5 F#5 G5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.13, notes: ARP(['B3', 'D4', 'G4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: PUMP(0, 4, 'G1', 'G2').concat(PUMP(4, 8, 'E1', 'E2')).concat(PUMP(8, 12, 'D1', 'D2')).concat(PUMP(12, 16, 'G1', 'G2')) },
      { wave: 'noise', vol: 0.32, notes: DRIVE() },
    ],
  },

  'borea-town-theme': {
    id: 'borea-town-theme', title: 'Snowfall Slow Jam (Borea town, original)', bpm: 88, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.5, vol: 0.4, notes: mel('E5x2 A5x1.5 G5 E5x2 D5 C5 A4x1 A4x2 B4 D5 E5x1 E5x1.5 G5x.5 A5x2') },
      { wave: 'pulse', duty: 0.25, vol: 0.13, notes: mel('A3x2 C4x2 F3x2 A3x2 D3x2 F3x2 E3x2 A3x2', 1) },
      { wave: 'triangle', vol: 0.5, notes: mel('A2x4 F2x4 D2x4 E2x4', 1) },
      { wave: 'noise', vol: 0.07, notes: HATS(0, 16, 4, 0.125).concat([[15.5, null, 0.25]]) },
    ],
  },

  'borea-route-theme': {
    id: 'borea-route-theme', title: 'Whiteout Run (Borea route, original)', bpm: 152, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: mel('A5 F5 D5 F5 A5x1 G5 F5 E5 F5 G5 A5 D6x1 C6 R A5 G5 F5 E5 F5x1 D5 R E5 F5 G5 A5 F5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.12, notes: ARP(['F4', 'A4', 'D5'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: PUMP(0, 4, 'D1', 'D2').concat(PUMP(4, 8, 'Bb1', 'Bb2')).concat(PUMP(8, 12, 'F1', 'F2')).concat(PUMP(12, 16, 'A1', 'A2')) },
      { wave: 'noise', vol: 0.3, notes: DRIVE() },
    ],
  },

  'trial-town-theme': {
    id: 'trial-town-theme', title: 'Banner Day (Trial hub, original)', bpm: 104, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.125, vol: 0.44, notes: mel('C5 E5 G5 C6 B5x1.5 G5 A5x1 G5 E5x1 F5 D5x1 E5 F5 A5 G5x1 E5 D5x1 E5x1.5 D5x.5 C5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.16, notes: mel('G3x2 E3x2 D3x2 B3x2 C4x2 F3x2 G3x2 E3x2', 1) },
      { wave: 'triangle', vol: 0.55, notes: mel('C3x2 G2x2 C3x2 G2x2 F2x2 A2x2 G2x2 C3x2', 1) },
      { wave: 'noise', vol: 0.26, notes: KICKS([0, 4, 8, 12]).concat(CLAPS([2, 6, 10, 14, 15])).concat(HATS(0, 16, 1, 0.125)) },
    ],
  },

  'trial-route-theme': {
    id: 'trial-route-theme', title: 'Trial by Tempo (Trial island, original)', bpm: 132, loop: true,
    tracks: [
      { wave: 'pulse', duty: 0.25, vol: 0.46, notes: mel('G5 D5 G5 Bb5 A5x1 G5 F5 D5x1 F5 G5 D5x1.5 R Eb5 D5 C5 D5 Bb4x1 D5 R F5 G5 A5 Bb5 G5x2') },
      { wave: 'pulse', duty: 0.5, vol: 0.13, notes: ARP(['Bb3', 'D4', 'G4'], 0, 16, 1) },
      { wave: 'triangle', vol: 0.55, notes: PUMP(0, 4, 'G1', 'G2').concat(PUMP(4, 8, 'Eb1', 'Eb2')).concat(PUMP(8, 12, 'F1', 'F2')).concat(PUMP(12, 16, 'D1', 'D2')) },
      { wave: 'noise', vol: 0.28, notes: HALF() },
    ],
  },
};

// ============================================================ SFX ====
// Priority classes (mixing law — the engine ducks BGM under ALERT/STING):
// ALERT = lowhp / error / spot / encounter; STING = fanfares & ceremonies;
// everything else is MOMENT (short, never ducks, never competes).
export const SFXSET = {
  // --- UI set (contract §2.2 item 3) ---
  // ui-blip is pinned by verify-audio [5c]: one E6 note at vol 0.35 — the
  // refresh is timbral only (duty 0.25 + tighter envelope = crisper pop).
  'ui-blip':   { id:'ui-blip',   wave:'pulse', duty:0.25, vol:0.35, env:[0.001,0.07], notes:[[0,'E6',1]] },
  'ui-tick':   { id:'ui-tick',   wave:'pulse', duty:0.25, vol:0.18, env:[0.001,0.045], notes:[[0,'C6',0.5]] },
  'ui-back':   { id:'ui-back',   wave:'pulse', duty:0.25, vol:0.3, env:[0.002,0.09], notes:[[0,'E5',0.8],[0.8,'B4',1.2]] },
  'dialogue-blip': { id:'dialogue-blip', wave:'pulse', duty:0.125, vol:0.15, env:[0.001,0.025], notes:[[0,'A6',0.5]] },
  'error-buzz': { id:'error-buzz', wave:'pulse', duty:0.5, vol:0.3, env:[0.004,0.12], notes:[[0,'D3',1.5],[1.5,'C#3',2]] },

  // --- encounter + transitions (gameux §6 three-beat rule: rustle beats at
  // 0/0.9/1.8 and the melody entering at 2.8 are choreography — kept exact;
  // the melody's pitches and drive are the viral pass's). ---
  'encounter-sting': { id:'encounter-sting', wave:'noise', vol:0.45, env:[0.005,0.25], notes:[
    [0,null,1],[0.9,null,1],[1.8,null,1],           // grass rustle x3 (visual twin: rustle anim)
  ]},
  'encounter-sting-melody': { id:'encounter-sting-melody', wave:'pulse', duty:0.125, vol:0.48, env:[0.004,0.2], notes:[
    [2.8,'E4',0.7],[3.5,'G4',0.7],[4.2,'C5',0.7],[4.9,'E5',2.5],   // the "!" beat (visual twin: ! mark)
  ]},
  'transition-whoosh': { id:'transition-whoosh', wave:'noise', vol:0.32, env:[0.008,0.22], notes:[[0,null,4]] },
  'transition-fade':   { id:'transition-fade',   wave:'triangle', vol:0.2, env:[0.02,0.15], notes:[[0,'C5',2]] },
  // The trainer-spot alert — a sharp two-note "!" ping (visual twin: the
  // "!" mark over the challenger). ALERT class.
  'trainer-spot': { id:'trainer-spot', wave:'pulse', duty:0.125, vol:0.45, env:[0.002,0.12], notes:[[0,'A5',0.7],[0.7,'E6',1.8]] },
  // The Fly teleport's own cue — a falling sparkle.
  'warp': { id:'warp', wave:'pulse', duty:0.125, vol:0.33, env:[0.002,0.16], notes:[[0,'E6',0.5],[0.5,'C6',0.5],[1,'G5',0.5],[1.5,'E5',1.5]] },

  // --- battle beats ---
  'battle-hit':   { id:'battle-hit',   wave:'noise', vol:0.5,  env:[0.002,0.12], notes:[[0,null,2]] },
  'battle-hit-tone': { id:'battle-hit-tone', wave:'triangle', vol:0.45, env:[0.002,0.12], notes:[[0,'C2',1.5]] },
  'battle-super': { id:'battle-super', wave:'pulse', duty:0.125, vol:0.48, env:[0.003,0.16], notes:[[0,'G5',0.6],[0.6,'C6',0.6],[1.2,'E6',0.6],[1.8,'G6',1.8]] },
  'battle-super-boom': { id:'battle-super-boom', wave:'noise', vol:0.52, env:[0.002,0.15], notes:[[0,null,2.5]] },
  'battle-noteff': { id:'battle-noteff', wave:'pulse', duty:0.5, vol:0.28, env:[0.005,0.16], notes:[[0,'A2',2]] },
  'battle-faint':  { id:'battle-faint',  wave:'pulse', duty:0.25, vol:0.42, env:[0.004,0.2], notes:[[0,'A4',1],[1,'F4',1],[2,'D4',1],[3,'A3',2.5]] },
  'battle-run':   { id:'battle-run',   wave:'pulse', duty:0.5, vol:0.38, env:[0.002,0.08], notes:[[0,'E5',0.45],[0.45,'G5',0.45],[0.9,'A5',0.45],[1.35,'C6',0.45],[1.8,'E6',1.4]] },

  // --- catch theater (contract §2.2 item 2; rattle timing is choreography
  // for the ball wiggles — kept; click+gotcha are one designed pair) ---
  'catch-throw': { id:'catch-throw', wave:'noise', vol:0.38, env:[0.005,0.18], notes:[[0,null,3]] },
  'catch-rattle': { id:'catch-rattle', wave:'noise', vol:0.48, env:[0.002,0.08], notes:[[0,null,1.2],[2.5,null,1.2],[5,null,1.2]] },
  'catch-click': { id:'catch-click', wave:'pulse', duty:0.125, vol:0.55, env:[0.001,0.1], notes:[[0,'E6',0.7],[0.7,'A6',1.8]] },
  'catch-breakout': { id:'catch-breakout', wave:'noise', vol:0.48, env:[0.002,0.2], notes:[[0,null,2]] },
  'catch-breakout-tone': { id:'catch-breakout-tone', wave:'pulse', duty:0.25, vol:0.38, env:[0.003,0.16], notes:[[0,'C5',0.8],[0.8,'G4',1.4]] },
  'catch-crit':  { id:'catch-crit',  wave:'triangle', vol:0.5, env:[0.002,0.15], notes:[[0,'E6',0.8],[0.8,'G6',0.8],[1.6,'B6',0.8],[2.4,'E7',2]] },
  'catch-gotcha': { id:'catch-gotcha', wave:'pulse', duty:0.125, vol:0.52, env:[0.003,0.2], notes:[[0,'C6',0.8],[0.8,'E6',0.8],[1.6,'G6',0.8],[2.4,'C7',2.4]] },
  'dex-register': { id:'dex-register', wave:'pulse', duty:0.25, vol:0.48, env:[0.003,0.22], notes:[[0,'A5',1],[1,'C6',1],[2,'E6',1],[3,'A6',2.5]] },

  // --- progression fanfares (STING class: BGM ducks under each) ---
  'victory':  { id:'victory',  wave:'pulse', duty:0.125, vol:0.5, env:[0.003,0.2], notes:[[0,'C6',0.7],[0.7,'E6',0.7],[1.4,'G6',0.7],[2.1,'C7',2.2]] },
  'fanfare':  { id:'fanfare',  wave:'pulse', duty:0.125, vol:0.52, env:[0.003,0.25], notes:[[0,'C5',1],[1,'E5',1],[2,'G5',1],[3,'C6',1.5],[4.5,'B5',0.5],[5,'C6',2.5]] },
  'levelup':  { id:'levelup',  wave:'pulse', duty:0.25, vol:0.5, env:[0.003,0.2], notes:[[0,'E5',0.7],[0.7,'G5',0.7],[1.4,'C6',0.7],[2.1,'E6',0.7],[2.8,'G6',2.2]] },
  // The evolution ceremony's own sting — OWNED BY THE EVOLUTION CEREMONY
  // BUILD; carried over byte-identical from the W12 table by its ruling.
  'evolution-fanfare': { id:'evolution-fanfare', wave:'pulse', duty:0.125, vol:0.5, env:[0.004,0.5], notes:[[0,'E5',1],[1,'G5',1],[2,'C6',1],[3,'E6',1],[4,'G6',2],[6,'C7',3]] },
  'badge':    { id:'badge',    wave:'pulse', duty:0.25, vol:0.52, env:[0.003,0.3], notes:[[0,'G4',0.8],[0.8,'C5',0.8],[1.6,'E5',0.8],[2.4,'G5',0.8],[3.2,'C6',1.6],[4.8,'G5',0.8],[5.6,'C6',2.4]] },
  'heal':     { id:'heal',     wave:'triangle', vol:0.45, env:[0.01,0.35], notes:[[0,'C5',1.2],[1.2,'E5',1.2],[2.4,'G5',1.2],[3.6,'C6',2.4]] },
  'save-confirm': { id:'save-confirm', wave:'pulse', duty:0.5, vol:0.38, env:[0.002,0.12], notes:[[0,'G5',0.8],[0.8,'C6',1.6]] },
  'lowhp':    { id:'lowhp',    wave:'pulse', duty:0.25, vol:0.42, env:[0.002,0.1], notes:[[0,'B4',1.1],[1.6,'B4',1.1],[3.2,'B4',1.6]] },
  'item-fanfare': { id:'item-fanfare', wave:'pulse', duty:0.5, vol:0.45, env:[0.002,0.15], notes:[[0,'G5',0.7],[0.7,'C6',0.7],[1.4,'E6',1.8]] },
  'partner-happy': { id:'partner-happy', wave:'pulse', duty:0.125, vol:0.4, env:[0.001,0.06], notes:[[0,'C6',0.5],[0.7,'E6',0.75],[1.7,'C6',0.5],[2.4,'E6',1]] },
  'map-enter': { id:'map-enter', wave:'triangle', vol:0.3, env:[0.01,0.25], notes:[[0,'E5',1],[1,'A5',1.8]] },

  // --- legacy call-site aliases (same tables as their primaries) ---
  'blip':      { id:'blip',      wave:'pulse', duty:0.25, vol:0.35, env:[0.001,0.07], notes:[[0,'E6',1]] },
  'tick':      { id:'tick',      wave:'pulse', duty:0.25, vol:0.18, env:[0.001,0.045], notes:[[0,'C6',0.5]] },
  'back':      { id:'back',      wave:'pulse', duty:0.25, vol:0.3, env:[0.002,0.09], notes:[[0,'E5',0.8],[0.8,'B4',1.2]] },
  'throw_':    { id:'throw_',    wave:'noise', vol:0.38, env:[0.005,0.18], notes:[[0,null,3]] },
  'rattle':    { id:'rattle',    wave:'noise', vol:0.48, env:[0.002,0.08], notes:[[0,null,1.2],[2.5,null,1.2],[5,null,1.2]] },
  'click':     { id:'click',     wave:'pulse', duty:0.125, vol:0.55, env:[0.001,0.1], notes:[[0,'E6',0.7],[0.7,'A6',1.8]] },
  'dex':       { id:'dex',       wave:'pulse', duty:0.25, vol:0.48, env:[0.003,0.22], notes:[[0,'A5',1],[1,'C6',1],[2,'E6',1],[3,'A6',2.5]] },
  'lowhp_legacy': { id:'lowhp_legacy', wave:'pulse', duty:0.25, vol:0.42, env:[0.002,0.1], notes:[[0,'B4',1.1],[1.6,'B4',1.1],[3.2,'B4',1.6]] },
  'encounter': { id:'encounter', wave:'pulse', duty:0.125, vol:0.48, env:[0.004,0.2], notes:[[0,'E4',0.7],[0.7,'G4',0.7],[1.4,'C5',0.7],[2.1,'E5',2.5]] },

  // --- W6 (audit D1): live call-site keys, tabled + played. ---
  'menu-move': { id:'menu-move', wave:'pulse', duty:0.25, vol:0.18, env:[0.001,0.045], notes:[[0,'C6',0.5]] },
  'item-get':  { id:'item-get',  wave:'pulse', duty:0.5, vol:0.45, env:[0.002,0.15], notes:[[0,'G5',0.7],[0.7,'C6',0.7],[1.4,'E6',1.8]] },
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

// W12-T4: the stale AREA_MUSIC slice mirror was deleted — it described the
// 7-map Wave-1 world, not the 432-map one. The map `music` fields are the
// single source of truth; verify-audio [8] reads them directly.
