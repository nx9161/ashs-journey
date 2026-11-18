// run-checks.mjs — the checks-fleet runner (War Room E2E Phase 2, Wave W2).
// Runs every CI-wired suite/audit group and prints one verdict line per
// entry (name · exit · the suite's own count line). The full census —
// what is wired, what runs non-blocking, what is excluded and why — lives
// in .github/workflows/checks.yml; this file is its executable half.
//
// Usage:
//   node tests/run-checks.mjs              # hard gate: suites + audits
//   node tests/run-checks.mjs suites       # the tests/ game suites
//   node tests/run-checks.mjs audits       # scripts/ verify + world audits
//   node tests/run-checks.mjs track-b      # Track B integration gate
//                                          # (needs: npm ci at root AND in tests/)
//   node tests/run-checks.mjs triage       # known-red queue: runs, prints
//                                          # counts, NEVER fails (exit 0)
//
// Hard groups exit 1 if any entry fails. A suite graduates from triage to
// the hard gate by being green on main — move its line, per checks.yml.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = (f) => ['tests/' + f, join(ROOT, 'tests', f), ROOT];
const S = (f) => ['scripts/' + f, join(ROOT, 'scripts', f), ROOT];

const GROUPS = {
  suites: [
    T('actor-lifecycle-checks.mjs'), T('arc-foundation-checks.mjs'),
    T('battle-model-checks.mjs'), T('battle-ground-checks.mjs'),
    T('branding-checks.mjs'),
    T('char-design-checks.mjs'), T('cheat-shop-checks.mjs'),
    T('cutscene-panel-checks.mjs'),
    T('design-depth-checks.mjs'), T('fidelity-checks.mjs'),
    T('frontier-checks.mjs'), T('gym-identity-checks.mjs'),
    T('hoenn-contest-checks.mjs'),
    T('hoenn-legendary-checks.mjs'), T('hoenn-story-checks.mjs'),
    T('input-checks.mjs'), T('interior-variety-checks.mjs'),
    T('johto-story-checks.mjs'),
    T('johto-systems-checks.mjs'), T('kindex-checks.mjs'),
    T('leader-cast-checks.mjs'),
    T('legal-screen-checks.mjs'),
    T('map-id-registry-checks.mjs'),
    T('name-registry-checks.mjs'),
    T('narrative-db-checks.mjs'), T('orange-climax-checks.mjs'),
    T('orange-story-checks.mjs'), T('partner-guarantee-checks.mjs'),
    T('placement-gates-checks.mjs'),
    T('quest-integrity-checks.mjs'),
    T('rejuv-phase1-checks.mjs'), T('rejuv-phase2-checks.mjs'),
    T('rejuv-phase3-checks.mjs'), T('rejuv-phase4-checks.mjs'),
    T('rejuv-phase5-checks.mjs'), T('rejuv-phase6-checks.mjs'),
    T('qa-changed-flows.mjs'), T('seasons-checks.mjs'),
    T('sinnoh-checks.mjs'), T('sinnoh-legendary-checks.mjs'),
    T('sinnoh-story-checks.mjs'), T('title-guard-checks.mjs'),
    T('viewport-matrix-checks.mjs'),
    T('campaign-smoke.mjs'), T('audit-headless.mjs'),
  ],
  audits: [
    S('verify-audio.mjs'), S('audit-towns.mjs'), S('audit-reachability.mjs'),
    S('audit-placement.mjs'), S('audit-desire-paths.mjs'), S('audit-battle-art.mjs'),
    S('audit-start-positions.mjs'), S('audit-warp-tiles.mjs'),
  ],
  // Known-red at the W2 baseline (counts in checks.yml). They RUN on every
  // push so their state is never silent again, but they do not block.
  // EMPTY since the parked-suite repair wave: all seven former triage
  // suites (rejuv-phase1..6 + qa-changed-flows) were repaired test-side
  // and PROMOTED to the hard gate above.
  triage: [],
};

function summaryOf(out) {
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/TOTAL|passed|pass,|pass ·|ALL PASS|all PASS|SMOKE/.test(lines[i])) return lines[i].slice(0, 120);
  }
  return (lines[lines.length - 1] || '(no output)').slice(0, 120);
}

function runEntry([label, file, cwd], args = []) {
  const r = spawnSync('node', [...args, file], {
    cwd, encoding: 'utf8', timeout: 900_000, maxBuffer: 64 * 1024 * 1024,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const exit = r.status === null ? 'TIMEOUT/ERR' : r.status;
  console.log(`${exit === 0 ? 'PASS' : 'FAIL'}  ${label}  [exit ${exit}]  ${summaryOf(out)}`);
  return r.status === 0;
}

function runTrackB() {
  const label = 'tests/suites/01-06 (Track B integration gate)';
  const pglite = join(ROOT, 'tests', 'node_modules', '@electric-sql', 'pglite');
  const rootDeps = join(ROOT, 'node_modules', 'better-auth');
  if (!existsSync(pglite) || !existsSync(rootDeps)) {
    console.log(`FAIL  ${label}  [setup]  needs: npm ci (repo root) AND npm ci (tests/) first`);
    return false;
  }
  // The documented invocation (tests/run.mjs header): the register hook
  // redirects 'pg' to the PGlite stub. tests/package.json's test script
  // runs exactly this.
  return runEntry([label, 'run.mjs', join(ROOT, 'tests')], ['--import', './register.mjs']);
}

const asked = process.argv.slice(2);
const groups = asked.length ? asked : ['suites', 'audits'];
let failed = 0;
for (const g of groups) {
  if (g === 'track-b') {
    console.log('\n== track-b ==');
    if (!runTrackB()) failed++;
    continue;
  }
  const entries = GROUPS[g];
  if (!entries) {
    console.error(`unknown group '${g}' — expected one of: ${[...Object.keys(GROUPS), 'track-b'].join(', ')}`);
    process.exit(2);
  }
  console.log(`\n== ${g} ==`);
  for (const e of entries) {
    const okRun = runEntry(e);
    if (!okRun && g !== 'triage') failed++;
  }
  if (g === 'triage') console.log('triage group: non-blocking by design (see checks.yml) — failures above are the known-red queue, printed so they can never rot silently again.');
}
console.log(failed ? `\nrun-checks: ${failed} hard-gate entr${failed === 1 ? 'y' : 'ies'} FAILED` : '\nrun-checks: all hard-gate entries PASS');
process.exit(failed ? 1 : 0);
