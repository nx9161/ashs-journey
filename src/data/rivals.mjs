// rivals.mjs — rival data + the documented Yellow partner-evolution rule.
// Mechanics reimplemented from documentation (never ROM-derived). The rival
// raises an EEVEE as his partner (Yellow), not a Arden starter; which form it
// takes is decided by the early rivalry record. Species data for Eevee and its
// evolutions lands with the act that first fields them (ADR-006 content tiers).

export const RIVALS = {
  gary: {
    id: 'gary',
    name: 'GARY',
    partner: 'eevee', // Yellow: the rival's starter is an Eevee
    // Team plans per act reference species ids; acts beyond Arden resolve
    // partner -> rivalPartnerEvolution(earlyWins, earlyLosses) at build time.
    acts: {
      kanto: { partner: 'eevee', team: ['pidgey', 'rattata'] },
      orange: { partner: null /* resolved */, team: [] },
      johto: { partner: null /* resolved */, team: [] },
    },
  },
};

// Yellow's documented rule: the rival's Eevee evolves by how the first two
// rivalry battles went — won both -> Vaporeon, split -> Flareon, lost both
// -> Jolteon. Pure function; the act builders call it when scripting the
// evolution beat.
export function rivalPartnerEvolution(earlyWins, earlyLosses) {
  if (earlyWins >= 2 && earlyLosses === 0) return 'vaporeon';
  if (earlyWins === 1 && earlyLosses === 1) return 'flareon';
  return 'jolteon'; // losing record (incl. 0-2) -> Jolteon
}
