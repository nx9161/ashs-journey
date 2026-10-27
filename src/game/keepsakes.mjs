// keepsakes.mjs — Rejuvenation Phase 3 (ADR-025 §3): Keepsakes (held
// items). ONE helper module shared by both battle engines so they cannot
// drift (the grounds.mjs pattern): damage-shaped effects resolve here
// and are applied by calcDamage (formulas.mjs) ONCE, after the Ground
// factor; trigger-shaped effects (KO save, low-HP Speed) are evaluated
// here and surfaced/applied by the engines' faint checks (battle.mjs
// checkFaint, battle-rt.mjs rtCheckFaints).
//
// Effect law (§3): every effect is conditional — a window, a trigger, or
// a matchup. The KEEPSAKES table (data/items.mjs) declares only `kind`s
// resolved below; there is no shape for a flat always-on stat boost.
//
// Per-battle flags live on a transient wrapper, mon._ks — created lazily
// in battle, deleted by BattleScene.endBattle, NEVER persisted (the
// save shape carries only mon.keepsake). Flags NEVER reset mid-battle:
// in particular the Tortoise Charm flag does not re-arm when the holder
// heals back above half HP (§3 guardrail, explicit).

import { KEEPSAKES } from '../data/items.mjs';

// The keepsake definition a mon holds, or null (unknown ids read as none
// — a tampered/legacy value can never crash a battle).
export function keepsakeOf(mon) {
  if (!mon || typeof mon.keepsake !== 'string') return null;
  return KEEPSAKES[mon.keepsake] || null;
}
export function holds(mon, itemId) {
  return !!mon && mon.keepsake === itemId && !!KEEPSAKES[itemId];
}

// Transient per-battle state for a mon (wrapper flags; see header).
export function ksState(mon) {
  if (!mon._ks) mon._ks = { tortoiseUsed: false, secondWindUsed: false, hitsTaken: 0, announced: {} };
  return mon._ks;
}
export function clearKsState(mon) {
  if (mon) delete mon._ks;
}

// ---- damage-shaped effects (shared formulas.mjs path) ----
// The keepsake damage factor for one hit, resolved from the ATTACKER's
// and the DEFENDER's held pieces. Returns { factor, atkId, defId } — the
// ids of the pieces that actually fired (engines surface first-time
// firings by name; a factor of 1 always carries null ids). `ctx`:
//   defTypes: defender's effective types (matchup window)
//   atkSpe / defSpe: effective Speed stats (Fossil Spur window)
//   wardSpent: resolve as if the first-hit ward were already spent —
//     multi-hit moves resolve hits after the first this way (owner
//     ruling 2026-10-27: Iron Acorn factors only the FIRST HIT of a
//     multi-hit move; every other window is unaffected).
// Applied by the engines via calcDamage's `keepsakeFactor` opt, which
// multiplies it in exactly once, after the Ground factor.
export function keepsakeDamageFactor(atk, def, mv, ctx) {
  const out = { factor: 1, atkId: null, defId: null };
  if (!mv || mv.cat === 'status') return out;
  const c = ctx || {};
  const a = keepsakeOf(atk);
  if (a && atk) {
    if (a.kind === 'underdogDamage' && def && (def.level - atk.level) >= a.levelGap) {
      out.factor *= a.factor; out.atkId = a.id;
    } else if (a.kind === 'matchupDamage' && mv.type === a.moveType
      && Array.isArray(c.defTypes) && c.defTypes.includes(a.vsType)) {
      out.factor *= a.factor; out.atkId = a.id;
    } else if (a.kind === 'lowHpDamage' && mv.type === a.moveType
      && atk.hp <= atk.maxHp * a.hpFrac) {
      out.factor *= a.factor; out.atkId = a.id;
    } else if (a.kind === 'fasterFoeDamage' && mv.type === a.moveType
      && typeof c.defSpe === 'number' && typeof c.atkSpe === 'number' && c.defSpe > c.atkSpe) {
      out.factor *= a.factor; out.atkId = a.id;
    }
  }
  const d = keepsakeOf(def);
  if (d && def) {
    if (d.kind === 'typeWard' && mv.type === d.moveType) {
      out.factor *= d.factor; out.defId = d.id;
    } else if (d.kind === 'firstHitWard' && !c.wardSpent && ksState(def).hitsTaken === 0) {
      out.factor *= d.factor; out.defId = d.id;
    }
  }
  return out;
}

// Record that the holder actually TOOK a hit (damage reached its HP —
// a miss or a Substitute absorption is not a hit taken). Drives the
// Iron Acorn's first-hit window.
export function noteHitTaken(mon) {
  if (mon) ksState(mon).hitsTaken++;
}

// ---- trigger-shaped effects (faint/switch checks) ----
// Evaluated by the engines at their faint checks. `ctx.hpBefore` is the
// holder's HP before the hit being resolved and `ctx.viaAttack` marks
// damage from an opponent's attack: the Tortoise Charm saves only from
// an ATTACK that would KO from above half HP (not from poison ticks,
// recoil, or confusion self-hits). Mutates only flags + (on a save) HP.
// Returns trigger codes; the engines apply the Speed stage (their own
// stage systems) and surface a battle message naming the keepsake.
export function evaluateTriggers(mon, ctx) {
  const out = { tortoise: false, secondWind: false };
  if (!mon) return out;
  const ks = ksState(mon);
  const c = ctx || {};
  // Tortoise Charm: once per battle, attack-KO from above half HP -> 1 HP.
  if (mon.hp <= 0 && holds(mon, 'tortoisecharm') && !ks.tortoiseUsed
    && c.viaAttack === true && typeof c.hpBefore === 'number' && c.hpBefore * 2 > mon.maxHp) {
    ks.tortoiseUsed = true;
    mon.hp = 1;
    out.tortoise = true;
  }
  // Second-Wind Ribbon: once per battle, at <=25% HP (and alive — a
  // Tortoise save at 1 HP qualifies on the same check).
  if (mon.hp > 0 && mon.hp * 4 <= mon.maxHp && holds(mon, 'secondwindribbon') && !ks.secondWindUsed) {
    ks.secondWindUsed = true;
    out.secondWind = true;
  }
  return out;
}

// ---- status-shaped effects ----
// Infliction-chance bonus in percentage POINTS, added only where the
// move can already inflict that status (the Ground-twist law, §1):
// Ember Seed — the holder's Fire moves +10% burn; Gloom Fang — the
// holder's Poison moves +10% poison. Composes additively with the
// Ground twist bonus at the same roll.
export function keepsakeStatusChanceBonus(atk, mv, status) {
  const k = keepsakeOf(atk);
  if (!k || k.kind !== 'statusChance' || !mv) return 0;
  return mv.type === k.moveType && status === k.status ? k.bonus : 0;
}

// Freeze refusal: an Ember Seed holder cannot be frozen — freeze
// infliction on the holder is refused in both engines.
export function refusesStatus(mon, status) {
  return status === 'freeze' && holds(mon, 'embereed');
}

// RT cooldown multiplier (Gloom Fang: the holder's Poison moves cool
// down x0.85 in real-time battles; classic uses the chance bonus above).
export function keepsakeCooldownMult(mon, mv) {
  const k = keepsakeOf(mon);
  if (!k || k.kind !== 'statusChance' || !mv) return 1;
  return mv.type === k.moveType && k.rtCooldown ? k.rtCooldown : 1;
}

// ---- heal / economy ----
// Gardenia Sash: healing moves used ON the holder restore +50%. Scope
// matches the Phase 2 heal twist exactly (the effect.heal path in both
// engines — Recover/Soft-Boiled; drain and Rest are separate paths and
// stay excluded, as they are for the Ground twist).
export function keepsakeHealMult(mon) {
  const k = keepsakeOf(mon);
  return k && k.kind === 'healBoost' ? k.factor : 1;
}

// Champion's Ribbon: the holder gains x1.2 XP (award path; holder-only).
export function keepsakeXpMult(mon) {
  const k = keepsakeOf(mon);
  return k && k.kind === 'xpBoost' ? k.factor : 1;
}

// ---- bag / slot operations ----
// A keepsake is a unique object: the bag holds at most one of each id.
export function bagHasKeepsake(state, itemId) {
  return !!state && !!state.bag && (state.bag[itemId] || 0) > 0;
}
export function ownsKeepsake(state, itemId) {
  if (!state) return false;
  if (bagHasKeepsake(state, itemId)) return true;
  const pools = [...(state.party || []), ...Object.values(state.boxes || {}).flat()];
  return pools.some((m) => m && m.keepsake === itemId);
}
// Grant a keepsake to the bag pocket. Returns false (no grant) when the
// id is not a keepsake or the player already owns that unique piece.
export function grantKeepsake(state, itemId) {
  if (!KEEPSAKES[itemId] || !state || !state.bag) return false;
  if (ownsKeepsake(state, itemId)) return false;
  state.bag[itemId] = 1;
  return true;
}
// Party-menu Give: bag -> mon. Fails cleanly when the mon already holds
// one, the bag has none, or the id is not a keepsake.
export function giveKeepsake(state, mon, itemId) {
  if (!mon || mon.keepsake || !KEEPSAKES[itemId]) return false;
  if (!bagHasKeepsake(state, itemId)) return false;
  state.bag[itemId]--;
  mon.keepsake = itemId;
  return true;
}
// Party-menu Take: mon -> bag.
export function takeKeepsake(state, mon) {
  if (!mon || !mon.keepsake || !KEEPSAKES[mon.keepsake]) return false;
  state.bag[mon.keepsake] = (state.bag[mon.keepsake] || 0) + 1;
  mon.keepsake = null;
  return true;
}
