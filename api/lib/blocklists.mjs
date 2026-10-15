// blocklists.mjs — username policy lists for the better-auth usernameValidator.
// Reserved names (impersonation / support-scam / brand surface) + a profanity
// list. Checked against the NFKC-lowercased username. Case-insensitive by
// construction (the plugin lowercases before validating).

// Exact-match reserved handles.
export const RESERVED_EXACT = new Set([
  'admin', 'administrator', 'administrador',
  'support', 'help', 'helpdesk', 'info', 'contact', 'service',
  'official', 'staff', 'team', 'mod', 'moderator', 'moderators',
  'owner', 'dev', 'developer', 'developerteam',
  'system', 'root', 'superuser', 'null', 'undefined', 'true', 'false',
  'anonymous', 'guest', 'player', 'user', 'test', 'testing', 'demo',
  'nintendo', 'gamefreak', 'creatures', 'pokemon',
  'naman', 'sloane', 'ashsjourney', 'ashs-journey',
  'security', 'abuse', 'legal', 'privacy', 'billing',
]);

// Prefix-match reserved stems (admin*, support*, …). Catches "admin2", "support_official".
export const RESERVED_PREFIXES = [
  'admin', 'support', 'official', 'moderator', 'nintendo', 'pokemon',
  'gamefreak', 'naman', 'sloane', 'system', 'security',
];

// Leet-speak fold applied before profanity matching. '1' is ambiguous (i/l),
// so both variants are tried.
const LEET_I = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', '$': 's', '!': 'i', '+': 't' };
const LEET_L = { ...LEET_I, 1: 'l' };
function foldLeet(s, map) {
  return s.split('').map((c) => map[c] || c).join('');
}

// Common English profanities/slurs (exact-token match after leet-fold).
// Kept as a server-side list; never rendered to clients.
export const PROFANITY = new Set([
  'fuck', 'fucker', 'fucking', 'shit', 'shitty', 'bitch', 'bitches',
  'asshole', 'dick', 'dickhead', 'pussy', 'cunt', 'whore', 'slut',
  'bastard', 'motherfucker', 'cock', 'tits', 'boobs', 'porn', 'porno',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'chink',
  'spic', 'kike', 'dyke', 'tranny', 'hitler', 'nazi',
  'rape', 'rapist', 'pedo', 'pedophile', 'incest', 'bestiality',
  'kill', 'killer', 'suicide', 'terrorist',
]);

export function isReserved(username) {
  if (RESERVED_EXACT.has(username)) return true;
  for (const p of RESERVED_PREFIXES) {
    if (username.startsWith(p) && username.length > p.length) return true;
  }
  return false;
}

export function isProfane(username) {
  return PROFANITY.has(foldLeet(username, LEET_I)) || PROFANITY.has(foldLeet(username, LEET_L));
}
