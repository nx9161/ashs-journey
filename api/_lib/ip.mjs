// ip.mjs — trusted client-IP resolution (Pen G5 / AppSec C7).
//
// The ONLY trusted source is `x-vercel-forwarded-for`: a single-value header
// set by the Vercel edge itself (not client-spoofable). We NEVER honor
// `x-real-ip`, and we NEVER trust the first entry of the raw `x-forwarded-for`
// chain (attacker-controlled on Vercel — the edge appends the real IP at the
// END of a client-supplied chain).
//
// Returns a normalized IP string, or null when no trustworthy value exists
// (caller then uses a shared stricter bucket — fail closed, never open).

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-fA-F:]{2,45}$/; // loose pre-check; tightened below

function normalizeIPv4(ip) {
  return ip;
}
function expandIPv6(ip) {
  // Minimal canonicalization for bucketing: lowercase + collapse ::ffff: mapped.
  const lower = ip.toLowerCase();
  const m = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return m[1];
  return lower;
}
function validIP(ip) {
  if (IPV4.test(ip)) return normalizeIPv4(ip);
  if (ip.includes(':') && IPV6.test(ip)) {
    try {
      // Reject garbage via URL parser round-trip.
      const u = new URL(`http://[${ip}]/`);
      if (u.hostname === ip.toLowerCase().replace(/^\[|\]$/g, '')) return expandIPv6(ip);
    } catch { /* fall through */ }
  }
  return null;
}

export function trustedClientIP(req) {
  const headers = req.headers;
  const get = (n) => {
    const v = headers.get(n);
    return typeof v === 'string' ? v.trim() : null;
  };
  // 1. Platform-provided, single value. Preferred.
  const vv = get('x-vercel-forwarded-for');
  if (vv) {
    const first = vv.split(',')[0].trim();
    const ok = validIP(first);
    if (ok) return ok;
  }
  // 2. No trustworthy header -> null (caller applies the shared bucket).
  //    Deliberately: x-real-ip and raw x-forwarded-for are NEVER honored.
  return null;
}
