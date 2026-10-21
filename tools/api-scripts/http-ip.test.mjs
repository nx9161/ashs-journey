// http-ip.test.mjs — unit tests for api/lib/http.mjs + api/lib/ip.mjs.
// Run: node api/scripts/http-ip.test.mjs   (exit 0 = all pass)

import { readBody, assertSameOrigin } from '../../api/lib/http.mjs';
import { trustedClientIP } from '../../api/lib/ip.mjs';

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) pass++; else { fail++; console.log('  FAIL -', name); }
}
const req = (headers = {}, body = '') =>
  new Request('https://x/api/save', { method: 'PUT', headers, body });

// readBody: 413 pre-parse gate
{
  const r = await readBody(req({ 'content-length': '70000' }, 'x'.repeat(10)), 65536);
  t('content-length over cap -> 413', r.response && r.response.status === 413);
}
{
  const big = 'x'.repeat(70000);
  const r = await readBody(req({}, big), 65536);
  t('actual bytes over cap -> 413 (no content-length)', r.response && r.response.status === 413);
}
{
  const r = await readBody(req({ 'content-length': '5' }, 'hello'), 65536);
  t('small body passes through', r.raw === 'hello' && !r.response);
}
{
  const r = await readBody(req({ 'content-length': '-3' }, ''), 65536);
  t('negative content-length -> 400', r.response && r.response.status === 400);
}

// trustedClientIP: platform header only
{
  const r = new Request('https://x/', { headers: { 'x-vercel-forwarded-for': '203.0.113.7' } });
  t('x-vercel-forwarded-for honored', trustedClientIP(r) === '203.0.113.7');
}
{
  // Spoofed client chain: first entry is attacker-controlled -> must NOT be trusted.
  const r = new Request('https://x/', { headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.7' } });
  t('raw x-forwarded-for never honored', trustedClientIP(r) === null);
}
{
  const r = new Request('https://x/', { headers: { 'x-real-ip': '203.0.113.7' } });
  t('x-real-ip never honored', trustedClientIP(r) === null);
}
{
  const r = new Request('https://x/', { headers: { 'x-vercel-forwarded-for': 'not-an-ip' } });
  t('garbage platform header -> null', trustedClientIP(r) === null);
}
{
  const r = new Request('https://x/');
  t('no headers -> null (shared bucket)', trustedClientIP(r) === null);
}

// assertSameOrigin (defense-in-depth CSRF check)
process.env.BETTER_AUTH_URL = 'https://ashs-journey-game.vercel.app';
{
  const r = new Request('https://ashs-journey-game.vercel.app/api/save', { method: 'PUT', headers: { origin: 'https://ashs-journey-game.vercel.app' } });
  t('matching Origin passes', assertSameOrigin(r) === true);
}
{
  const r = new Request('https://ashs-journey-game.vercel.app/api/save', { method: 'PUT', headers: { origin: 'https://evil.example' } });
  t('foreign Origin fails', assertSameOrigin(r) === false);
}
{
  const r = new Request('https://ashs-journey-game.vercel.app/api/save', { method: 'PUT', headers: { referer: 'https://ashs-journey-game.vercel.app/play' } });
  t('matching Referer passes', assertSameOrigin(r) === true);
}
{
  const r = new Request('https://ashs-journey-game.vercel.app/api/save', { method: 'PUT' });
  t('no Origin/Referer fails closed', assertSameOrigin(r) === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
