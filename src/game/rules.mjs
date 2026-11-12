// rules.mjs — Rejuvenation Phase 1 (ADR-025 §4): difficulty modes + House
// Rules, resolved in ONE place so every consumer (both battle engines,
// trainer team instantiation, award paths, Options, the Center coach)
// reads the same numbers. Pure functions over the game state.
//
// Fairness law (owner, standing): levers scale the THREAT or the economy —
// never the player's own combat stats, never telegraph timings, never
// unavoidable damage. 'classic' is the game exactly as shipped and
// sim-verified; every multiplier below returns the neutral value there.
//
// Phase 2 (Grounds) reads difficultyOf(state) for its own levers — R2:
// Story halves Ground type modifiers and disables twists.

import { statValue, hpValue, gen1Random } from '../engine/formulas.mjs';
import { SPECIES } from '../data/species.mjs';
import { levelCapFor } from '../data/arcs.mjs';

export const DIFFICULTY_MODES = ['story', 'classic', 'challenge'];
export const DIFFICULTY_LABELS = { story: 'STORY', classic: 'CLASSIC', challenge: 'CHALLENGE' };
export const DIFFICULTY_RANK = { story: 0, classic: 1, challenge: 2 };

export const HOUSE_RULE_DEFS = [
  { key: 'steadyDamage', label: 'Steady Damage' },
  { key: 'mercifulFoes', label: 'Merciful Foes' },
  { key: 'fastLearner', label: 'Fast Learner' },
  { key: 'generousWorld', label: 'Generous World' },
  { key: 'candyCoach', label: 'Candy Coach' },
  { key: 'skipIntro', label: 'Skip Intro' },
];

export function difficultyOf(state) {
  const d = state && state.story ? state.story.difficulty : null;
  return DIFFICULTY_MODES.includes(d) ? d : 'classic';
}

export function houseRule(state, key) {
  const hr = state && state.settings ? state.settings.houseRules : null;
  return !!(hr && hr[key] === true);
}

// Labels of the rules currently ON, in menu order (save-summary display).
export function activeHouseRules(state) {
  return HOUSE_RULE_DEFS.filter((d) => houseRule(state, d.key)).map((d) => d.label);
}

// Leaders = badge holders and the authored 'smart'/'opener-setup' AI
// classes (gym leaders + Elite Four in the data as shipped).
export function isLeaderTrainer(trainer) {
  if (!trainer) return false;
  return !!trainer.badge || trainer.ai === 'smart' || trainer.ai === 'opener-setup';
}

// Trainer/gym team levels (§4 table): Story softens every trainer by 2
// (floor 1); Challenge pushes LEADERS +2 (capped at the current arc's
// band max — a registry read per ADR-027 Amendment 2; 100 in Arc 1) —
// their authored teams stand in for rematch-grade compositions, which
// do not exist as separate data. Wild and scripted-presence levels are
// never touched.
export function trainerLevelFor(state, trainer, level) {
  const mode = difficultyOf(state);
  if (mode === 'story') return Math.max(1, level - 2);
  if (mode === 'challenge' && isLeaderTrainer(trainer)) return Math.min(levelCapFor(state), level + 2);
  return level;
}

// Foe IVs used in stat calc (§4 table + Merciful Foes): Story treats foe
// IVs as 16; Merciful Foes forces 16 in any mode; otherwise the authored
// 31. Player mons are never affected.
export function foeIvFor(state) {
  if (difficultyOf(state) === 'story') return 16;
  if (houseRule(state, 'mercifulFoes')) return 16;
  return 31;
}

// Apply foeIvFor to a freshly-created foe mon: set its IVs and recompute
// its stats/HP from them (makeMon computes at the default 31). Fresh foes
// are at full HP, so hp tracks the new maxHp. No-op at IV 31.
export function tuneFoeMon(mon, state) {
  if (!mon || !mon.ivs) return mon;
  const iv = foeIvFor(state);
  if (mon.ivs.hp === iv) return mon;
  const sp = SPECIES[mon.speciesId];
  if (!sp) return mon;
  for (const k of Object.keys(mon.ivs)) mon.ivs[k] = iv;
  const oldMax = mon.maxHp;
  mon.maxHp = hpValue(sp.base.hp, mon.level, iv);
  mon.hp = Math.max(1, Math.min(mon.maxHp, Math.round(mon.hp * (mon.maxHp / Math.max(1, oldMax)))));
  mon.stats = {
    atk: statValue(sp.base.atk, mon.level, iv), def: statValue(sp.base.def, mon.level, iv),
    spa: statValue(sp.base.spa, mon.level, iv), spd: statValue(sp.base.spd, mon.level, iv),
    spe: statValue(sp.base.spe, mon.level, iv),
  };
  return mon;
}

// Effective foe AI class (§4 table): Story flattens everyone to the
// standard near-random selection; Challenge gives leaders full 'smart'
// selection; Classic keeps the authored class. Returns null = standard.
export function effectiveAiFor(state, trainer) {
  if (!trainer) return null;
  const mode = difficultyOf(state);
  if (mode === 'story') return null;
  if (mode === 'challenge' && isLeaderTrainer(trainer)) return 'smart';
  return trainer.ai || null;
}

// Steady Damage: the (217-255)/255 roll is fixed at 255/255 for BOTH
// sides — variance removed, difficulty unchanged.
export function damageRandomFor(state, rng) {
  return houseRule(state, 'steadyDamage') ? 1 : gen1Random(rng);
}

// Player XP (§4 table x House Rules): Story pays x1.25; Fast Learner
// x1.5; they compose multiplicatively. Phase 3: a mon holding the
// Champion's Ribbon gains a further x1.2 — holder-only, applied per-mon
// at the award path (battle.mjs awardXp, via keepsakeXpMult, whose
// factor this mirrors).
export function xpMultFor(state, mon) {
  let m = difficultyOf(state) === 'story' ? 1.25 : 1;
  if (houseRule(state, 'fastLearner')) m *= 1.5;
  if (mon && mon.keepsake === 'championsribbon') m *= 1.2;
  return m;
}

// Foe keepsakes (§4 table, Phase 3 — the lever Phase 1 left unwired):
//   Story     = none (no foe ever holds one)
//   Classic   = aces only, late: the LAST team member (the ace) of each
//               leader trainer holds its authored keepsake
//   Challenge = all leader teams: every member holds its authored piece
// "Leader" is Phase 1's shipped definition (isLeaderTrainer: badge or
// smart/opener AI — gym leaders, Elite Four, Champion). Wild foes have
// no trainer and never hold one in ANY mode. Authored pieces live on
// the trainer data (team entry `keepsake`); a leader member with no
// authored piece holds none. READING NOTE (§3 vs §4): §3 says Classic
// aces hold "from the Crown League onward" while §4 says "aces only,
// late" — this implements §4's row over the Phase-1 leader set (no
// gym-leader battle exists at/after the Crown League in this build,
// so the literal §3 reading would make the Classic row dead content);
// "late" is read as the ace's late-battle position, as in §4.
export function foeKeepsakeFor(state, trainer, teamIndex, teamLength) {
  if (!trainer || !isLeaderTrainer(trainer)) return null;
  const mode = difficultyOf(state);
  if (mode === 'story') return null;
  const entry = Array.isArray(trainer.team) ? trainer.team[teamIndex] : null;
  const authored = entry && typeof entry.keepsake === 'string' ? entry.keepsake : null;
  if (!authored) return null;
  if (mode === 'challenge') return authored;
  return teamIndex === teamLength - 1 ? authored : null; // classic: aces only
}

// Prize money: Generous World x1.5. (Defeat halving and Pay Day are not
// prize money and are untouched.)
export function moneyMultFor(state) {
  return houseRule(state, 'generousWorld') ? 1.5 : 1;
}

// Catch: Story's ball bonus x1.1 on the effective catch rate.
export function catchRateMultFor(state) {
  return difficultyOf(state) === 'story' ? 1.1 : 1;
}

// RT foe move cooldowns (§4 table): Story x1.1 (slower threats), Classic
// x1.0, Challenge x0.9. Ally cooldowns are never scaled — the difficulty
// lives in threat speed, per the owner's standing requirement.
export function rtFoeCooldownMultFor(state) {
  const mode = difficultyOf(state);
  if (mode === 'story') return 1.1;
  if (mode === 'challenge') return 0.9;
  return 1;
}

// Candy Coach spar level (§4): your highest party level - 2, floor 1.
// Returns 0 for an empty party (no spar offered).
export function sparLevelFor(state) {
  const party = state && Array.isArray(state.party) ? state.party : [];
  let hi = 0;
  for (const m of party) if (m && typeof m.level === 'number' && m.level > hi) hi = m.level;
  return hi ? Math.max(1, hi - 2) : 0;
}
