// hibp.mjs — breached-password screening via HIBP k-anonymity (AppSec C8).
//
// Only the first 5 chars of the SHA-1 hash leave the server (k-anonymity);
// the full hash and the password never leave. 3s timeout. On network failure
// the check FAILS OPEN (registration is not blocked by a third-party outage)
// and the caller writes an anomaly-log row (C8/C10).

import { createHash } from 'node:crypto';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const TIMEOUT_MS = 3000;

export async function isPasswordBreached(password) {
  const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(HIBP_RANGE_URL + prefix, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'ashs-journey-game/1.0 (breach-check)' },
    });
    if (!res.ok) return { breached: false, unavailable: true };
    const text = await res.text();
    for (const line of text.split('\n')) {
      const [hashSuffix] = line.trim().split(':');
      if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
        return { breached: true, unavailable: false };
      }
    }
    return { breached: false, unavailable: false };
  } catch {
    return { breached: false, unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}
