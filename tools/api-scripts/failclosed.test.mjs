// failclosed.test.mjs — every route must 503 {error:"auth_unavailable"} when
// DATABASE_URL is unset. Never crash, never leak. Run without DATABASE_URL:
//   env -u DATABASE_URL node api/scripts/failclosed.test.mjs

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) pass++; else { fail++; console.log('  FAIL -', name); }
}

if (process.env.DATABASE_URL) {
  console.log('SKIP: DATABASE_URL is set; this test requires it unset.');
  process.exit(0);
}

const routes = [
  ['../../api/auth/[...all].mjs', 'GET', 'https://x/api/auth/get-session'],
  ['../../api/auth/signup.mjs', 'POST', 'https://x/api/auth/signup'],
  ['../../api/auth/recover.mjs', 'POST', 'https://x/api/auth/recover'],
  ['../../api/save.mjs', 'GET', 'https://x/api/save'],
  ['../../api/save.mjs', 'PUT', 'https://x/api/save'],
  ['../../api/save/meta.mjs', 'GET', 'https://x/api/save/meta'],
  ['../../api/account/data.mjs', 'GET', 'https://x/api/account/data'],
  ['../../api/account/delete.mjs', 'POST', 'https://x/api/account/delete'],
  ['../../api/purge.mjs', 'POST', 'https://x/api/purge'],
];

for (const [mod, method, url] of routes) {
  const { handler: handler } = await import(mod);
  const req = new Request(url, { method, headers: { origin: 'https://x' }, body: method === 'POST' || method === 'PUT' ? '{}' : undefined });
  let res;
  try {
    res = await handler(req);
  } catch (e) {
    t(`${mod} ${method} does not throw`, false);
    continue;
  }
  t(`${mod} ${method} is a Response`, res instanceof Response);
  const body = await res.json().catch(() => ({}));
  t(`${mod} ${method} -> 503 auth_unavailable`, res.status === 503 && body.error === 'auth_unavailable');
}

// health is the exception: it reports authConfigured:false with 200.
const { handler: health } = await import('../../api/health.mjs');
const hres = await health(new Request('https://x/api/health'));
const hbody = await hres.json();
t('health -> 200 with authConfigured:false', hres.status === 200 && hbody.ok === true && hbody.authConfigured === false && hbody.version === 'track-b');

// 405 matrix on save routes
const { handler: save } = await import('../../api/save.mjs');
const del = await save(new Request('https://x/api/save', { method: 'DELETE' }));
t('save DELETE -> 503 (fail-closed precedes 405)', del.status === 503);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
