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

// Documented Gen 4/5 damage: floor(floor(floor(2*L/5+2)*Power*A/D)/50)+2
// then STAB 1.5x, type effectiveness, crit 2x (1/16 Gen 2-5), random 0.85-1.00,
// burn halves physical.
export function calcDamage(level, power, atk, def, opts) {
  const o = opts || {};
  const stab = o.stab ? 1.5 : 1;
  const eff = o.effectiveness !== undefined ? o.effectiveness : 1;
  const crit = o.crit ? 2 : 1;
  const rand = o.random !== undefined ? o.random : 1;
  const burn = o.burn && o.physical ? 0.5 : 1;
  const base = Math.floor(Math.floor(Math.floor((2 * level) / 5 + 2) * power * atk / def) / 50) + 2;
  return Math.max(1, Math.floor(base * stab * eff * crit * rand * burn));
}

export const CRIT_CHANCE = 1 / 16; // Gen 2-5 value
export const STAB_MULT = 1.5;
export const RANDOM_MIN = 0.85;
export const RANDOM_MAX = 1.0;

// Stat stage ladder: stage in [-6, 6]; each stage x1.5 / ÷1.5.
export function stageMultiplier(stage) {
  if (stage >= 0) return (2 + stage) / 2;
  return 2 / (2 - stage);
}

export function statValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + 5;
}
export function hpValue(base, level, iv) {
  const v = iv === undefined ? 31 : iv;
  return Math.floor(((2 * base + v) * level) / 100) + level + 10;
}

// Catch: documented Gen 5 values (dossier §B1 + GD §3.3).
// a = ((3*HPmax - 2*HPcur) / (3*HPmax)) * catchRate * ballBonus * statusBonus
// statusBonus: 2.5 sleep/freeze, 1.5 para/poison/burn. a >= 255 => guaranteed.
export const STATUS_CATCH_BONUS = {
  sleep: 2.5, freeze: 2.5, paralysis: 1.5, poison: 1.5, burn: 1.5, badlyPoisoned: 1.5,
};

export function catchA(hpMax, hpCur, catchRate, ballBonus, status) {
  const sb = (status && STATUS_CATCH_BONUS[status]) || 1;
  return ((3 * hpMax - 2 * hpCur) / (3 * hpMax)) * catchRate * ballBonus * sb;
}

// Shake checks per documented Gen 4/5 shake probability.
// Returns the number of successful shakes (0-3). Caller provides rng().
export function shakeChecks(a, rng) {
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

export function isCriticalCapture(a) {
  // Gen 5 critical capture: rare instant-catch flourish on low-odds throws.
  // Eligibility scales inversely with `a`; kept as theater per GD §3.3.
  return a < 60;
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
