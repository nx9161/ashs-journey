// run.mjs — Track B TEST GATE integration runner.
// Usage: cd tests && node --import ./register.mjs run.mjs
// (npm test does this via package.json.)
//
// Environment: DATABASE_URL is a dummy — the pg-stub replaces pg.Pool with a
// PGlite-backed facade. BETTER_AUTH_URL pins the origin checks; the secret is
// a fresh 256-bit CSPRNG value per run (never persisted).

import { randomBytes } from 'node:crypto';

process.env.DATABASE_URL = 'postgres://app_role:unused@localhost:5432/ashs_journey_qa';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString('hex');

const { runMigration } = await import('./migrate.mjs');
const { report } = await import('./harness.mjs');

console.log('== Track B integration gate (PGlite) ==');
const migOut = await runMigration();
console.log('migration applied verbatim;', JSON.stringify(migOut));

const suites = [
  ['01-migration-rls', './suites/01-migration-rls.mjs'],
  ['02-auth-flows', './suites/02-auth-flows.mjs'],
  ['03-save-route', './suites/03-save-route.mjs'],
  ['04-recover', './suites/04-recover.mjs'],
  ['05-delete', './suites/05-delete.mjs'],
  ['06-rate-limit', './suites/06-rate-limit.mjs'],
];

for (const [name, path] of suites) {
  console.log('\n-- ' + name + ' --');
  const mod = await import(path);
  await mod.run();
}

const { pass, fail } = report();
console.log(`\nINTEGRATION: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
