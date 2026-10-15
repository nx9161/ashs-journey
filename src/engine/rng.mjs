// rng.mjs — seeded multi-stream PRNG (mulberry32 class).
// Separate streams: rng.encounter / rng.battle / rng.misc — QA can lock battle RNG
// while leaving encounters live (architecture §7.1). Same seed + same inputs =
// identical playthrough.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRngStreams(seed) {
  const s = seed >>> 0;
  return {
    seed: s,
    encounter: mulberry32(s ^ 0x9e3779b9),
    battle: mulberry32(s ^ 0x85ebca6b),
    misc: mulberry32(s ^ 0xc2b2ae35),
  };
}

// roll(p, rngFn): true with probability p in [0,1].
export function roll(p, rngFn) {
  return rngFn() < p;
}

// intIn(lo, hi, rngFn): uniform integer in [lo, hi].
export function intIn(lo, hi, rngFn) {
  return lo + Math.floor(rngFn() * (hi - lo + 1));
}

// pick weighted: entries [[weight, value], ...]
export function pickWeighted(entries, rngFn) {
  let total = 0;
  for (let i = 0; i < entries.length; i++) total += entries[i][0];
  let r = rngFn() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i][0];
    if (r <= 0) return entries[i][1];
  }
  return entries[entries.length - 1][1];
}
