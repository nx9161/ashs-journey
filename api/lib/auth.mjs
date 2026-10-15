// auth.mjs — better-auth instance for ASH'S JOURNEY (Track B).
//
// Binding resolutions (ADR-010): username-only login with synthetic
// `${username}@game.local` emails behind the scenes (OQ-4a); argon2id via
// @node-rs/argon2 with OWASP params (OQ-18a, AppSec C1a); 7d/1d session
// defaults (OQ-19, AppSec C3); recovery codes instead of email reset (OQ-17c).
//
// Fail-closed: when DATABASE_URL is unset, `auth` is null and every route
// returns 503 {error:"auth_unavailable"} — nothing crashes, nothing leaks.
// better-auth's Postgres access goes through Kysely's PostgresDialect wrapping
// OUR pg Pool (verified from the installed package: createKyselyAdapter
// detects `"connect" in db` and wraps it — kysely is required as adapter
// machinery, MIT, flagged for the LCR allowlist amendment).

import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

import { getPool, isDbConfigured } from './db.mjs';
import { isReserved, isProfane } from './blocklists.mjs';

// OWASP-tier argon2id params (AppSec C1a).
const ARGON2_OPTS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };

const USERNAME_RE = /^[a-z0-9_]{3,16}$/;

function normalizeUsername(u) {
  return String(u).normalize('NFKC').toLowerCase();
}

function usernameValidator(value) {
  const u = normalizeUsername(value);
  if (!USERNAME_RE.test(u)) return false;
  if (isReserved(u)) return false;
  if (isProfane(u)) return false;
  return true;
}

let auth = null;
let authError = null;

function buildAuth() {
  if (!isDbConfigured()) return null;
  const pool = getPool();
  if (!pool) return null;

  const trustedOrigins = [];
  if (process.env.BETTER_AUTH_URL) trustedOrigins.push(process.env.BETTER_AUTH_URL);

  return betterAuth({
    database: pool, // wrapped internally by Kysely PostgresDialect (verified)
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // no email service ($0); synthetic emails only
      password: {
        hash: (pw) => argonHash(pw, ARGON2_OPTS),
        verify: ({ hash, password }) => argonVerify(hash, password),
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 16,
        usernameValidator,
        immutableUsername: true, // kills username squatting/churn (C2)
        displayUsername: false,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7d (OQ-19: accept library default)
      updateAge: 60 * 60 * 24, // 1d rolling
    },
    rateLimit: {
      enabled: true,
      storage: 'database', // Vercel serverless: in-memory would be a no-op (C7)
      customRules: {
        '/sign-in/username': { window: 60, max: 10 },
        '/sign-up/email': { window: 60, max: 5 },
      },
    },
    // Pen G5: pin the platform-provided client-IP header for better-auth's own
    // limiter. `x-vercel-forwarded-for` is set by the Vercel edge (single value,
    // not client-spoofable). Raw x-forwarded-for chains and x-real-ip are never
    // trusted.
    advanced: {
      cookiePrefix: 'ashsjourney',
      ipAddress: {
        ipAddressHeaders: ['x-vercel-forwarded-for'],
      },
      cookies: {
        session_token: {
          attributes: {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
          },
        },
      },
    },
    // Kill the username-availability oracle endpoint (AppSec C2 / Pen T2).
    disabledPaths: ['/is-username-available'],
    databaseHooks: {
      user: {
        create: {
          // Synthetic-only posture: REJECT any email that is not exactly the
          // normalized username at @game.local. This kills direct arbitrary-
          // email signups via /sign-up/email.
          before: async (user) => {
            const email = typeof user.email === 'string' ? user.email.toLowerCase() : '';
            const uname = typeof user.username === 'string' ? normalizeUsername(user.username) : '';
            if (!USERNAME_RE.test(uname) || email !== `${uname}@game.local`) {
              throw new APIError(422, { message: 'Invalid request' });
            }
          },
        },
      },
    },
  });
}

export function getAuth() {
  if (auth || authError) return auth;
  try {
    auth = buildAuth();
  } catch (e) {
    authError = e;
    console.error('[auth] build failed', e && e.message ? e.message : e);
    auth = null;
  }
  return auth;
}

// Eager singleton for route modules: `import { auth } from './auth.mjs'`.
export const authInstance = getAuth();
export { authInstance as auth };
export function authUnavailable() {
  return authInstance === null;
}
export { ARGON2_OPTS, normalizeUsername, usernameValidator, USERNAME_RE };
