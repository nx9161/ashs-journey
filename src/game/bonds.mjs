// bonds.mjs — Rejuvenation Phase 5 (ADR-025 §2): Bonds.
//
// Key characters keep a bond score with the player: a HIDDEN integer in
// story.bonds[npcId], -10..+10 (the save shape landed in Phase 4; the
// client schema defaults-fills + clamps it, the cloud validator enforces
// the same). The score is never shown. What the player sees is the TIER,
// derived fresh on every read and never stored:
//
//   Cold  <= -4        Wary  -3..+1        Warm  +2..+6        Close >= +7
//
// Edge rationale (spec §2 fixes only Close >= +7 and the guardrails):
// - Warm opens at +2 because a single Town Tale pays +2 and the shipped
//   Phase 4 fiction already names that feeling ("That is a Warm
//   feeling, trainer. Warm." — Ace Marlow, on the +2 return choice).
// - Wary's floor is -3 so no single choice (swing <= 2, enforced in
//   applyBond) can hard-lock a character below Wary from neutral —
//   reaching Cold takes sustained coldness (two or more cold beats).
// - A full Arden run offers Gary 11 attainable points (6 rival-battle
//   wins + 5 choice points), the duo 7, leaders 3 (tale + talk choice) —
//   Close is reachable for the rival, Warm for everyone, neither is
//   the default.
//
// OWNER RULING R3 (hard law): bonds NEVER alter battle stats, AI, or
// teams — not even a little. Structural enforcement: this module is
// pure over the save state and imports nothing from the battle
// engines; battle.mjs / battle-rt.mjs / formulas.mjs contain no bond
// references at all (the phase-5 suite greps them). The one bridge is
// one-directional: battle OUTCOMES are a bond SOURCE (the rival ledger
// below), recorded by the overworld layers that construct battles —
// the battle code itself never reads a bond value. Bonds also never
// gate main-story progression, badges, dex entries, or keepsake
// existence: every bond-gated keepsake has a second source.
//
// Sources (all one-shot authored content; nothing is grindable):
// authored dialogue CHOICE POINTS (the runSteps { choice } primitive +
// wired NPC choices — deltas authored at <= 2, swing-clamped again
// here), Town Tale completions (Phase 4's recordBond writes, kept
// exactly), legendary-arc beats (+1 with involved characters), rival /
// duo battle outcomes (first outcome per battle only, via the ledger),
// and authored gifts. Feedback: applyBond reports the direction; the
// wiring queues a heart pip (ui.queueBondPip) that the next dialogue
// nameplate wears — ▲ warms / ▼ cools, the PARTNER_MOODS idiom
// (ADR-016) extended to people. Choices are never pre-labelled.

import { rivalPartnerEvolution } from '../data/rivals.mjs';
import { BOND_DIALOGUE } from '../data/dialogue.mjs';

// ---------- tiers ----------
export const BOND_MIN = -10;
export const BOND_MAX = 10;
export const BOND_TIERS = ['Cold', 'Wary', 'Warm', 'Close'];
export function bondTier(score) {
  const s = typeof score === 'number' && Number.isFinite(score) ? score : 0;
  if (s >= 7) return 'Close';
  if (s >= 2) return 'Warm';
  if (s >= -3) return 'Wary';
  return 'Cold';
}
export function bondOf(state, npcId) {
  if (!state || !state.story || !state.story.bonds) return 0;
  const v = state.story.bonds[npcId];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
export function tierOf(state, npcId) {
  return bondTier(bondOf(state, npcId));
}
export function tierAtLeast(state, npcId, tier) {
  return BOND_TIERS.indexOf(tierOf(state, npcId)) >= BOND_TIERS.indexOf(tier);
}

// ---------- the cast ----------
// plate: the dialogue nameplate string this character speaks under.
// note: the Quest Log PEOPLE detail line (no numbers, ever).
export const BOND_CHARACTERS = [
  { id: 'mom', name: 'Mom', plate: 'MOM', note: 'Dawnwick. Drew the first street maps of home, chalk on a barn door.' },
  { id: 'hawthorn', name: 'Prof. Hawthorn', plate: 'Prof. Hawthorn', note: 'The professor who studies how Pokemon and people grow together. He gave you your partner.' },
  { id: 'gary', name: 'Gary', plate: 'GARY', note: 'Your rival since before either of you could reach the lab door. His Eevee is still deciding.' },
  { id: 'rue', name: 'Rue', plate: 'RUE', note: 'Half of a uniformed duo with theatrical ambitions and a drawn-on moustache.' },
  { id: 'cole', name: 'Cole', plate: 'COLE', note: 'The other half. Holds the menu right-side up and the conscience for both of them.' },
  { id: 'retiredace', name: 'Ace Marlow', plate: 'ACE MARLOW', note: 'Fernmere elder. The first trainer ever to challenge the Fernmere Gym, before there was a League to record it.' },
  { id: 'brock', name: 'Brock', plate: 'BROCK', note: 'Flintridge leader and part-time museum curator. The museum came first; the gym is built from its stone.' },
  { id: 'misty', name: 'Misty', plate: 'MISTY', note: 'Tidehaven leader. Keeps the old bike-shop ledger from when her gym had a pool out back.' },
  { id: 'surge', name: 'Lt. Surge', plate: 'LT. SURGE', note: 'Arcport leader. Learned to read the bay from the Fan Club founder\'s tide tables.' },
  { id: 'erika', name: 'Erika', plate: 'ERIKA', note: 'Canopy leader. Her grandmother planted the roof garden so the city\'s green would outgrow its neon.' },
  { id: 'koga', name: 'Koga', plate: 'KOGA', note: 'Bramble leader. His grandfather taught the Preserve Warden to fish with one carved lure.' },
  { id: 'sabrina', name: 'Sabrina', plate: 'SABRINA', note: 'Farsight leader. Her father and Master Ko split one school over what strength is for.' },
  { id: 'blaine', name: 'Blaine', plate: 'BLAINE', note: 'Caldera leader. He was on the jungle expedition that followed a mirage, and never called it a failure.' },
  { id: 'fuji', name: 'Mr. Fuji', plate: 'MR. FUJI', note: 'Hushmoor elder. He has carried his town\'s grief longer than anyone, and keeps a bell for the kind.' },
];
export function bondCharacter(id) {
  return BOND_CHARACTERS.find((c) => c.id === id) || null;
}
// Characters the player has any bond record with, in cast order — the
// Quest Log PEOPLE section lists exactly these.
export function bondedCharacters(state) {
  if (!state || !state.story || !state.story.bonds) return [];
  return BOND_CHARACTERS.filter((c) => state.story.bonds[c.id] !== undefined);
}

// ---------- writing ----------
// The one writer every Phase 5 source goes through. The delta is
// swing-clamped to +/-2 (spec: "single choice swing <= 2" — enforced
// structurally, not just by authoring discipline) and the result is
// range-clamped to -10..+10. Returns the change record the wiring
// turns into nameplate feedback; dir is 0 when nothing moved.
export function applyBond(state, npcId, delta) {
  const out = { id: npcId, delta: 0, before: 0, after: 0, tierBefore: 'Wary', tierAfter: 'Wary', dir: 0 };
  if (!state || !state.story || !npcId || !delta) return out;
  const bonds = state.story.bonds || (state.story.bonds = {});
  const before = bondOf(state, npcId);
  const swing = Math.max(-2, Math.min(2, Math.trunc(delta)));
  const after = Math.max(BOND_MIN, Math.min(BOND_MAX, before + swing));
  bonds[npcId] = after;
  out.before = before; out.after = after; out.delta = after - before;
  out.tierBefore = bondTier(before); out.tierAfter = bondTier(after);
  out.dir = Math.sign(out.delta);
  return out;
}
// One-shot source guard: the first firing writes the flag and applies;
// later firings are no-ops. Every authored source routes through here
// or through an equivalent completion flag, so nothing can be farmed.
export function applyBondOnce(state, flag, npcId, delta) {
  if (!state || !state.story) return null;
  const flags = state.story.flags || (state.story.flags = {});
  if (flags[flag]) return null;
  flags[flag] = true;
  return applyBond(state, npcId, delta);
}

// ---------- the rival ledger (ADR-016, read — never rebuilt) ----------
// Gary's Eevee evolution rule is driven by the early rivalry record:
// the outcomes of the first two rivalry battles. Bonds READ that same
// ledger — each Gary battle's FIRST completed outcome is recorded once
// (story.flags rivalwin_/rivalloss_<battleId>) and both the bond delta
// (+1 win, respect even in rivalry; -1 loss, floored at -10) and the
// ledger counts derive from those records. There is no second system:
// rivalLedger() below is the one record, and rivalEvolutionFromLedger
// feeds it to the documented ADR-016 rule unchanged.
export const RIVAL_BATTLES = ['gary_cerulean', 'gary_stanne', 'gary_tower', 'gary_silph', 'gary_r22_final', 'gary_champion'];
export function recordRivalOutcome(state, battleId, won) {
  if (!state || !state.story || !RIVAL_BATTLES.includes(battleId)) return null;
  const flags = state.story.flags || (state.story.flags = {});
  if (flags['rivalwin_' + battleId] || flags['rivalloss_' + battleId]) return null; // first outcome only
  flags[won ? 'rivalwin_' + battleId : 'rivalloss_' + battleId] = true;
  return applyBond(state, 'gary', won ? 1 : -1);
}
export function rivalLedger(state) {
  const flags = (state && state.story && state.story.flags) || {};
  let wins = 0, losses = 0, earlyWins = 0, earlyLosses = 0, decided = 0;
  for (const id of RIVAL_BATTLES) {
    const w = !!flags['rivalwin_' + id], l = !!flags['rivalloss_' + id];
    if (w) wins++; if (l) losses++;
    if ((w || l) && decided < 2) { if (w) earlyWins++; else earlyLosses++; decided++; }
  }
  return { wins, losses, earlyWins, earlyLosses };
}
export function rivalEvolutionFromLedger(state) {
  const l = rivalLedger(state);
  return rivalPartnerEvolution(l.earlyWins, l.earlyLosses);
}

// Duo battle outcomes feed BOTH members' bonds (they share a fate and
// a ledger of their own): first outcome per battle, +1 / -1 each.
export const DUO_BATTLES = ['r2_duo', 'duo2_vermilion', 'duo3_celadon'];
export function recordDuoOutcome(state, battleId, won) {
  if (!state || !state.story || !DUO_BATTLES.includes(battleId)) return null;
  const flags = state.story.flags || (state.story.flags = {});
  if (flags['duowin_' + battleId] || flags['duoloss_' + battleId]) return null;
  flags[won ? 'duowin_' + battleId : 'duoloss_' + battleId] = true;
  const d = won ? 1 : -1;
  return [applyBond(state, 'rue', d), applyBond(state, 'cole', d)];
}
// Any scripted/NPC trainer battle that is a bond source routes here.
export function recordBattleBond(state, trainerId, won, fled) {
  if (fled) return null; // a flee is neither a win nor a loss
  if (RIVAL_BATTLES.includes(trainerId)) return recordRivalOutcome(state, trainerId, won);
  if (DUO_BATTLES.includes(trainerId)) return recordDuoOutcome(state, trainerId, won);
  return null;
}

// ---------- tier-variant dialogue (ADR-025 §2) ----------
// Line sets keyed by tier for the bond characters, in src/data style:
// the PLOT is identical at every tier — only the temperature differs.
// Warm+ unlocks personal backstory; Cold unlocks guarded/short
// variants of the same beats. Resolution falls back Close -> Warm ->
// Wary, Cold -> Wary; a scene with no set for the resolved tier
// returns null and the caller keeps its default lines.
// ---------- the Canopy parley (Phase 3's deferred first source) ----------
// The Second-Wind Ribbon's FIRST source (§3 table) is the Rue & Cole
// parley; Phase 3 shipped only the second source (the Canopy atelier
// clerk, 7-badge stock gate) and left this one for Phase 5. The duo
// appear in Canopy City — the duo3 beat of their escalation arc —
// once the St. Anne has sailed and until the parley resolves. The
// scene wiring lives in overworld-systems (runParleyNpc); loadMap
// injects these actors into the scene's map copy under parleyVisible,
// the tale-NPC pattern (shared MAPS data is never mutated).
export const PARLEY_NPCS = [
  { map: 'celadon', x: 8, y: 8, name: 'RUE', art: 'rue', skin: '#e8b888', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#3a2a1a', parley: true,
    dialogue: ['You. YOU. Of all the street corners in all of Arden—', 'Do not look at me like that. The moustache was ONE time.'] },
  { map: 'celadon', x: 9, y: 8, name: 'COLE', art: 'cole', skin: '#d8a878', shirt: '#2a2a3a', pants: '#1a1a2a', hair: '#7a1a1a', parley: true,
    dialogue: ['Oh no. Oh no no no. Rue. Rue, it is the kid. It is THE kid.'] },
];
export function parleyVisible(state) {
  if (!state || !state.story || !state.story.flags) return false;
  return !!state.story.flags.stanne_done && !state.story.flags.parley_celadon_done;
}
// ---------- Gary's battle text, by tier (R3: text only) ----------
// At battle construction the overworld layers clone the rival's
// trainer def and swap ONLY its intro/lose lines for the tier set.
// Team, levels, AI, reward — the def's mechanics — are copied by
// reference-identity from the authored def and never recomputed from
// bond values. The battle engines receive a def whose numbers are
// bond-independent by construction.
export function bondTrainerVariant(state, trainer) {
  if (!trainer || !RIVAL_BATTLES.includes(trainer.id)) return trainer;
  const intro = bondSceneLines(state, 'gary', 'battle');
  const lose = bondSceneLines(state, 'gary', 'battleLose');
  if (!intro && !lose) return trainer;
  const clone = { ...trainer };
  if (intro) clone.intro = intro;
  if (lose) clone.lose = lose;
  return clone;
}

// Resolve a scene's lines for the character's CURRENT tier. Fallback:
// close -> warm -> wary, cold -> wary. Returns null when the scene has
// no usable set (callers keep their default lines).
// ADR-025 §6 (Phase 6): the bond echo — for a character who was Close
// in a previous journey (story.bondEcho), the Warm sets unlock one
// tier earlier: at Wary, 'warm' joins the chain ahead of 'wary'.
// Close-only sets still wait for Close. Presentation only, always.
export function bondSceneLines(state, npcId, sceneId) {
  const scenes = BOND_DIALOGUE[npcId];
  const scene = scenes && scenes[sceneId];
  if (!scene) return null;
  const tier = tierOf(state, npcId).toLowerCase();
  const echo = tier === 'wary' && Array.isArray(state && state.story && state.story.bondEcho)
    && state.story.bondEcho.includes(npcId);
  const chain = tier === 'close' ? ['close', 'warm', 'wary']
    : tier === 'warm' ? ['warm', 'wary']
    : tier === 'cold' ? ['cold', 'wary']
    : echo ? ['warm', 'wary'] : ['wary'];
  for (const t of chain) {
    if (Array.isArray(scene[t]) && scene[t].length) return scene[t];
  }
  return null;
}
// ---- ADR-025 §6: the echo greeting ----
// Said once, plainly, the first time a new journey meets a character
// who was Close in the last one. The spending flag lives in
// story.flags like every other one-shot marker.
export const ECHO_LINE = 'You seem familiar. Have we met?';
export function takeEchoGreeting(state, npcId) {
  if (!state || !state.story) return false;
  if (!Array.isArray(state.story.bondEcho) || !state.story.bondEcho.includes(npcId)) return false;
  const flag = 'echo_met_' + npcId;
  if (state.story.flags[flag]) return false;
  state.story.flags[flag] = true;
  return true;
}
// Overworld NPC display name -> bond id, for the echo greeting hook.
export const BOND_NPC_IDS = {
  MOM: 'mom', GARY: 'gary', RUE: 'rue', COLE: 'cole', 'ACE MARLOW': 'retiredace',
  BROCK: 'brock', MISTY: 'misty', 'LT. SURGE': 'surge', ERIKA: 'erika',
  KOGA: 'koga', SABRINA: 'sabrina', BLAINE: 'blaine', 'MR. FUJI': 'fuji',
};
