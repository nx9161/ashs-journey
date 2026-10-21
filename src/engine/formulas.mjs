// formulas.mjs — battle math as PURE functions (architecture §7.3).
// Reimplemented from documented Gen 4/5 systems (dossier §B). Named exports double
// as the ADR note's documented constants. Unit-testable without a browser.

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

// Attacking type -> defending type -> multiplier. Absent = 1.
export const TYPE_CHART = {
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

export function effectiveness(moveType, defenderTypes) {
  const row = TYPE_CHART[moveType] || {};
  let m = 1;
  for (let i = 0; i < defenderTypes.length; i++) {
    m *= (row[defenderTypes[i]] !== undefined ? row[defenderTypes[i]] : 1);
  }
  return m;
}

// Damage: classic formula floor(floor(floor(2*L/5+2)*Power*A/D)/50)+2 with
// Generation-I critical-hit semantics (ADR-018): on a crit the LEVEL is
// doubled inside the formula (no separate 2x multiplier), the attacker's
// negative and defender's positive stat stages are ignored (the caller
// passes raw stats), and burn does not halve. Random factor is the classic
// integer roll 217-255 / 255 (see gen1Random). STAB 1.5x. Type chart is the
// complete modern 18-type chart per the WS8 ruling (ADR-018): fidelity
// governs feel, pacing and presentation in Kanto — not chart bugs.
export function calcDamage(level, power, atk, def, opts) {
  const o = opts || {};
  const stab = o.stab ? 1.5 : 1;
  const eff = o.effectiveness !== undefined ? o.effectiveness : 1;
  const rand = o.random !== undefined ? o.random : 1;
  const effLevel = o.crit ? level * 2 : level;
  // Gen 1: burn halves the physical Attack STAT before the formula (and a
  // critical hit ignores the halving, like it ignores stat stages).
  const a = (o.burn && o.physical && !o.crit) ? Math.floor(atk / 2) : atk;
  const base = Math.floor(Math.floor(Math.floor((2 * effLevel) / 5 + 2) * power * a / def) / 50) + 2;
  return Math.max(1, Math.floor(base * stab * eff * rand));
}

export function gen1Random(rng) { return (217 + Math.floor(rng() * 39)) / 255; }

// Generation-I critical-hit rate, exact form: normal T = base Speed,
// P = T/512; high-crit moves (Slash, Razor Leaf, Karate Chop, Crabhammer)
// T = min(255, base Speed x 4), P = T/256. Focus Energy multiplies the rate
// by 4 (the original divided by 4 — a bug; not reproduced, ADR-018 D4).
export function critChance(baseSpeed, opts) {
  const o = opts || {};
  let c = o.highCrit ? Math.min(255, baseSpeed * 4) / 256 : baseSpeed / 512;
  if (o.focus) c *= 4;
  return Math.min(1, c);
}
export const STAB_MULT = 1.5;

// Stat stage ladder: stage in [-6, 6]; each stage x1.5 / ÷1.5.
export function stageMultiplier(stage) {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

// Accuracy/evasion stage ladder (classic table): (3+s)/3 up, 3/(3-s) down.
export function accStageMultiplier(stage) {
  if (stage >= 0) return (3 + stage) / 3;
  return 3 / (3 - stage);
}

export function statValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + 5;
}
export function hpValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + level + 10;
}

// Catch: Generation-I two-roll system (ADR-018). Roll R uniformly in the
// ball's range (poke 0-255, great 0-200, ultra 0-150, master = automatic).
// Status shifts R down (sleep/freeze -25, poison/burn/paralysis -12).
// R < 0 => caught; R > catchRate => immediate fail; otherwise the HP factor
// f = (HPmax * 255 * 4) / (HPcur * divisor) (divisor 8 for Great Ball, else
// 12, f capped at 255) and a second roll R2 in 0-255 catches iff R2 <= f.
// Wobble count for animation comes from how far R fell under the rate.
export const BALL_RANGES = { pokeball: 255, greatball: 200, ultraball: 150, masterball: 0, safariball: 255 };
export function gen1Catch(hpMax, hpCur, catchRate, ballId, status, rng) {
  if (ballId === 'masterball') return { caught: true, shakes: 3 };
  const range = BALL_RANGES[ballId] !== undefined ? BALL_RANGES[ballId] : 255;
  let r = Math.floor(rng() * (range + 1));
  if (status === 'sleep' || status === 'freeze') r -= 25;
  else if (status === 'poison' || status === 'burn' || status === 'paralysis' || status === 'badlyPoisoned') r -= 12;
  if (r < 0) return { caught: true, shakes: 3 };
  if (r > catchRate) return { caught: false, shakes: 0 };
  const divisor = ballId === 'greatball' ? 8 : 12;
  let f = Math.floor((hpMax * 255 * 4) / (Math.max(1, hpCur) * divisor));
  if (f > 255) f = 255;
  const r2 = Math.floor(rng() * 256);
  if (r2 <= f) return { caught: true, shakes: 3 };
  const shakes = r < catchRate / 3 ? 1 : (r < (2 * catchRate) / 3 ? 2 : 2);
  return { caught: false, shakes };
}

// XP: documented growth curves reimplemented (GD §3.4).
export function xpForLevel(curve, level) {
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
export function xpYield(baseXp, level, isWild) {
  return Math.max(1, Math.floor((baseXp * level) / 7 * (isWild ? 1 : 1.5)));
}

// Turn order: priority bracket -> Speed (paralysis quarters Speed, Gen 4-6) -> random.
export function turnOrder(a, b, rng) {
  const pa = a.priority || 0, pb = b.priority || 0;
  if (pa !== pb) return pa > pb ? [a, b] : [b, a];
  const sa = a.status === 'paralysis' ? Math.floor(a.speed / 4) : a.speed;
  const sb = b.status === 'paralysis' ? Math.floor(b.speed / 4) : b.speed;
  if (sa !== sb) return sa > sb ? [a, b] : [b, a];
  return rng() < 0.5 ? [a, b] : [b, a];
}
