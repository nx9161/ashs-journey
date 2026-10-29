// ball-rules.mjs — Stage J6: apricorn-ball catch rules, ONE shared
// evaluation for both battle engines (battle.mjs classic + battle-rt.mjs
// both call ballBonusFor / ballCatchRate — the fixedLevel lesson: the
// catch calc must never be fixed in only one engine).
//
// A BALLS entry may carry a `rule`; the rule is evaluated against the
// LIVE battle at throw time:
//   ctx = { lead, foe, fished }
//     lead   the player's active mon (level + species comparisons)
//     foe    the wild foe mon
//     fished true when the battle began by fishing (BattleScene.fished,
//            set by startFishing in BOTH engines' start path — one
//            constructor, one marker)
// The returned multiplier scales the foe's effective catch rate inside
// the Gen-1 two-roll (gen1Catch), exactly where the shipped balls get
// their ranges — a rule that misses its condition returns exactly 1.
//
// Recorded adaptations (register, Stage J6):
//  - love: canon also requires the opposite gender; the engine has no
//    gender system, so the clause is dropped — same species only.
//  - fast: canon keys on the foe's flee rate, which this engine does
//    not model; the proxy is the foe species' BASE SPEED >= 100.
//  - heavy: canon keys on the foe's weight in kg, which the species
//    data does not carry; the game's own bulk measure — the battler
//    tier (src/data/battler-tiers.mjs) — stands in: S x1, M x1.5,
//    L x2.5, XL x4.
//  - friend: no rate bonus at all (x1 always). Its effect lands on a
//    successful catch: the caught mon's friendship is set high
//    (FRIEND_BALL_FRIENDSHIP), applied in the shared catchSuccess.

import { BALLS } from '../data/items.mjs';
import { SPECIES } from '../data/species.mjs';
import { SPECIES2 } from '../data/species2.mjs';
import { SPECIES_JOHTO } from '../data/species3.mjs';
import { BATTLER_TIERS } from '../data/battler-tiers.mjs';

// Full species table (the bundle's merge.mjs folds these into SPECIES
// at runtime; building the union here keeps this module correct when
// imported standalone, e.g. by the suites).
const BALL_SPECIES_ALL = Object.assign({}, SPECIES, SPECIES2, SPECIES_JOHTO);

export const FRIEND_BALL_FRIENDSHIP = 200;
export const HEAVY_TIER_BONUS = { S: 1, M: 1.5, L: 2.5, XL: 4 };

// Does this species evolve by Moon Stone (its own evo / evos entries)?
export function evolvesByMoonStone(speciesId) {
  const sp = BALL_SPECIES_ALL[speciesId];
  if (!sp) return false;
  const evos = sp.evos || (sp.evo ? [sp.evo] : []);
  return evos.some((e) => e && e.method === 'stone' && e.stone === 'moonstone');
}

export function ballBonusFor(ballId, ctx) {
  const ball = BALLS[ballId];
  if (!ball || !ball.rule) return 1;
  const lead = ctx && ctx.lead, foe = ctx && ctx.foe;
  if (!foe) return 1;
  switch (ball.rule) {
    case 'level': {
      if (!lead || !(foe.level > 0)) return 1;
      const ratio = lead.level / foe.level;
      if (ratio >= 4) return 8;
      if (ratio > 2) return 4;
      if (ratio > 1) return 2;
      return 1;
    }
    case 'lure': return ctx && ctx.fished ? 3 : 1;
    case 'moon': return evolvesByMoonStone(foe.speciesId) ? 4 : 1;
    case 'love': return lead && lead.speciesId === foe.speciesId ? 8 : 1;
    case 'fast': {
      const sp = BALL_SPECIES_ALL[foe.speciesId];
      return sp && sp.base && sp.base.spe >= 100 ? 4 : 1;
    }
    case 'friend': return 1; // the effect is post-catch (see header)
    case 'heavy': {
      const tier = BATTLER_TIERS[foe.speciesId];
      return HEAVY_TIER_BONUS[tier] !== undefined ? HEAVY_TIER_BONUS[tier] : 1;
    }
    default: return 1;
  }
}

// The effective catch rate a throw of ballId works against: the base
// rate (already safari/story adjusted by the calling engine) scaled by
// the rule bonus, clamped to the Gen-1 byte range the two-roll expects.
export function ballCatchRate(baseRate, ballId, ctx) {
  const bonus = ballBonusFor(ballId, ctx);
  return Math.max(3, Math.min(255, Math.round(baseRate * bonus)));
}
