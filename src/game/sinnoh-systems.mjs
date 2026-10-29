// sinnoh-systems.mjs — Arc 4 Stage S4: the pure Sinnoh systems core.
//
// FORME-SWITCH (coordinator decision 6): rides the Deoxys mechanic
// EXACTLY (overworld-systems switchDeoxysForme, Stage H6): a speciesId
// exchange in the evolution idiom — level, XP, nickname, held item,
// keepsake, IVs/EVs, status and the move set are the individual's own
// and are NOT touched; maxHp/stats recompute from the new forme's base
// stats with HP carried by the max-delta rule. This module is that
// same swap, generalised over the three Sinnoh families; the Deoxys
// path itself is untouched. MOVE DELTA (recorded): canon swaps
// Rotom's appliance move per forme; here every forme family's
// learnsets draw from one shared pool (species5 data — the Deoxys
// design), so moves stay legal in every forme untouched, and no
// appliance move is auto-taught or auto-forgotten.
import { statValue, hpValue } from '../engine/formulas.mjs';

export const FORME_FAMILIES = {
  giratina: ['giratina', 'giratinaorigin'],
  shaymin: ['shaymin', 'shayminsky'],
  rotom: ['rotom', 'rotomheat', 'rotomwash', 'rotomfrost', 'rotomfan', 'rotommow'],
};
export const FORME_OF = {};
for (const [base, formes] of Object.entries(FORME_FAMILIES)) {
  for (const id of formes) FORME_OF[id] = base;
}
// Rotom's appliances (Old Chateau, S4): forme id -> the room's object.
export const ROTOM_APPLIANCES = {
  rotomheat: 'the oven', rotomwash: 'the washing machine',
  rotomfrost: 'the refrigerator', rotomfan: 'the electric fan',
  rotommow: 'the lawn mower',
};

// The Deoxys swap, generalised. Returns true on a real switch.
export function switchForme(mon, formeId, speciesTable) {
  if (!mon || !FORME_OF[mon.speciesId] || !FORME_OF[formeId]) return false;
  if (FORME_OF[mon.speciesId] !== FORME_OF[formeId]) return false;
  if (mon.speciesId === formeId) return false;
  const to = speciesTable[formeId];
  if (!to) return false;
  const ivs = mon.ivs || {};
  const oldMax = mon.maxHp;
  mon.speciesId = formeId;
  mon.maxHp = hpValue(to.base.hp, mon.level, ivs.hp);
  if (mon.hp > 0) mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
  mon.stats = {
    atk: statValue(to.base.atk, mon.level, ivs.atk), def: statValue(to.base.def, mon.level, ivs.def),
    spa: statValue(to.base.spa, mon.level, ivs.spa), spd: statValue(to.base.spd, mon.level, ivs.spd),
    spe: statValue(to.base.spe, mon.level, ivs.spe),
  };
  return true;
}

// A party member's field-move knowledge, in the shipped HM
// representation: a battle move slot (partyKnows) OR the hmMoves
// field-craft list (the Dive representation).
export function partyKnowsFieldMove(party, moveId) {
  return (party || []).some((m) => m && ((m.moves || []).some((mv) => mv.id === moveId)
    || (m.hmMoves || []).includes(moveId)));
}

// The badge gate for a Sinnoh field move, read generically off the
// save's badge case: the gate badge must sit in SOME badge set (the
// prefix law minted it into badges.sinnoh; the read names no region).
export function badgeHeld(state, badgeId) {
  const sets = (state && state.badges) || {};
  return Object.values(sets).some((v) => Array.isArray(v) && v.includes(badgeId));
}

// Shaymin's sky reversion, simplified (recorded in the register):
// canon reverts sky -> land at nightfall or when frozen; here the
// sky forme persists until the player uses the Gracidea again or
// Shaymin faints (hp reaches 0 — checked by the caller on the field
// and after battles through this helper).
export function shayminReverted(mon) {
  return !!mon && mon.speciesId === 'shayminsky' && mon.hp <= 0;
}
