// config.test.mjs — config assertions for api/lib/auth.mjs (AppSec C1/C3/C4/C7).
// Run: node api/scripts/config.test.mjs   (exit 0 = all pass)
// Uses a DUMMY DATABASE_URL: better-auth builds lazily (no connection at
// build time), so option inspection + hook unit tests need no live DB.

process.env.DATABASE_URL = 'postgres://app_role:fake@localhost:6543/postgres';
process.env.BETTER_AUTH_URL = 'https://ashs-journey-game.vercel.app';
process.env.BETTER_AUTH_SECRET = 'test-secret-not-used-for-crypto-assertions';

const { getAuth, normalizeUsername, usernameValidator, ARGON2_OPTS } = await import('../lib/auth.mjs');
const { hash, verify } = await import('@node-rs/argon2');

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) pass++; else { fail++; console.log('  FAIL -', name); }
}

const auth = getAuth();
t('auth builds with dummy URL', !!auth);
const o = auth.options;

// C1: argon2id hasher with OWASP params
t('argon2 params named', ARGON2_OPTS.memoryCost === 65536 && ARGON2_OPTS.timeCost === 3 && ARGON2_OPTS.parallelism === 4);
const h = await o.emailAndPassword.password.hash('config-fixture-password');
t('stored hash identifies argon2id', h.startsWith('$argon2id$'));
t('verify true via configured hook', await o.emailAndPassword.password.verify({ hash: h, password: 'config-fixture-password' }));
t('verify false via configured hook', !(await o.emailAndPassword.password.verify({ hash: h, password: 'wrong' })));

// C3: session lifetimes 7d/1d (OQ-19 defaults)
t('session expiresIn = 7d', o.session.expiresIn === 60 * 60 * 24 * 7);
t('session updateAge = 1d', o.session.updateAge === 60 * 60 * 24);

// C4: cookie flags + prefix
t('cookie prefix ashsjourney', o.advanced.cookiePrefix === 'ashsjourney');
const sattr = o.advanced.cookies.session_token.attributes;
t('cookie httpOnly', sattr.httpOnly === true);
t('cookie secure', sattr.secure === true);
t('cookie sameSite lax', sattr.sameSite === 'lax');

// C2: username plugin config
const uplug = o.plugins.find((p) => p.id === 'username');
t('username plugin present', !!uplug);

// usernameValidator: blocklists + charset
t('accept normal username', usernameValidator('ash_trainer9'));
t('accept 3-char min', usernameValidator('abc'));
t('accept 16-char max', usernameValidator('a'.repeat(16)));
t('reject 2-char', !usernameValidator('ab'));
t('reject 17-char', !usernameValidator('a'.repeat(17)));
t('uppercase normalized internally (accepted as lowercase)', usernameValidator('ASH'));
t('reject reserved admin', !usernameValidator('admin'));
t('reject reserved prefix support_x', !usernameValidator('support_x'));
t('reject reserved nintendo', !usernameValidator('nintendo'));
t('exact-match profanity policy (no substring false-positives)', usernameValidator('shithead') === true);
t('reject exact profanity', !usernameValidator('fuck'));
t('reject leet profanity', !usernameValidator('sh1t'));
t('normalize NFKC+lower', normalizeUsername('Ａsh_01') === 'ash_01');

// Synthetic-only database hook: direct /sign-up/email with arbitrary email dies
const before = o.databaseHooks.user.create.before;
let threw = false;
try { await before({ email: 'real@gmail.com', username: 'ash01' }, null); } catch { threw = true; }
t('hook rejects arbitrary email', threw);
threw = false;
try { await before({ email: 'ash01@game.local', username: 'ash01' }, null); } catch { threw = true; }
t('hook accepts synthetic email', !threw);
threw = false;
try { await before({ email: 'ash01@game.local', username: 'other' }, null); } catch { threw = true; }
t('hook rejects email/username mismatch', threw);

// C7: rate-limit storage + custom rules
t('rateLimit enabled', o.rateLimit.enabled === true);
t('rateLimit storage database', o.rateLimit.storage === 'database');
t('customRule /sign-in/username 10/min', o.rateLimit.customRules['/sign-in/username'].window === 60 && o.rateLimit.customRules['/sign-in/username'].max === 10);
t('customRule /sign-up/email 5/min', o.rateLimit.customRules['/sign-up/email'].window === 60 && o.rateLimit.customRules['/sign-up/email'].max === 5);

// G5: trusted IP header pinned for better-auth's own limiter
t('ipAddressHeaders pinned to x-vercel-forwarded-for',
  JSON.stringify(o.advanced.ipAddress.ipAddressHeaders) === JSON.stringify(['x-vercel-forwarded-for']));

// C2: availability oracle disabled
t('/is-username-available disabled', (o.disabledPaths || []).includes('/is-username-available'));

// trustedOrigins pinned (C4)
t('trustedOrigins pinned to BETTER_AUTH_URL',
  JSON.stringify(o.trustedOrigins) === JSON.stringify(['https://ashs-journey-game.vercel.app']));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
