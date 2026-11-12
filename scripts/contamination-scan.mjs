// contamination-scan.mjs — client-bundle + repo contamination greps.
// Fails on: runtime network calls, non-relative imports, ripped-content markers,
// Nintendo marks outside the GC-verbatim disclaimer, audio files in assets/.
// (DevOps C11 / LCR supply-chain gaps; AppSec C11.)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let failed = 0;

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, exts, out); }
    else if (exts.some((x) => p.endsWith(x))) out.push(p);
  }
  return out;
}
function fail(msg) { console.error('FAIL ' + msg); failed++; }

const srcFiles = walk(path.join(ROOT, 'src'), ['.mjs']);

// 1. Runtime network policy.
// Both shipped targets (guest + personal) are zero-network — the auth code
// is compile-time stripped from every bundle (asserted by build.mjs +
// budgets-check). At SOURCE level, fetches may be SAME-ORIGIN '/api/' only,
// and only from inside compile-time __AUTH_BEGIN__/__AUTH_END__ blocks (the
// blocks both shipped bundles strip). Everything else — XHR, WebSocket,
// absolute URLs, dynamic import — is forbidden everywhere.
function authBlocks(t) {
  const blocks = [];
  const re = /__AUTH_BEGIN__([\s\S]*?)__AUTH_END__/g;
  let m;
  while ((m = re.exec(t))) blocks.push(m[1]);
  return blocks;
}
function stripAuthBlocksSrc(t) {
  return t.replace(/__AUTH_BEGIN__[\s\S]*?__AUTH_END__/g, '');
}
for (const f of srcFiles) {
  const rel = path.relative(ROOT, f);
  const t = fs.readFileSync(f, 'utf8');
  const stripped = stripAuthBlocksSrc(t);
  // 1a. Outside auth blocks: zero network of any kind (the guest bundle rule).
  for (const pat of [/fetch\s*\(/, /XMLHttpRequest/, /new WebSocket/, /https?:\/\//, /import\s*\(/]) {
    if (pat.test(stripped)) fail(rel + ' contains network/dynamic-import pattern outside auth blocks: ' + pat);
  }
  // 1b. Inside auth blocks: same-origin '/api/' fetches only.
  for (const b of authBlocks(t)) {
    for (const pat of [/XMLHttpRequest/, /new WebSocket/, /https?:\/\//, /import\s*\(/]) {
      if (pat.test(b)) fail(rel + ' auth block contains forbidden pattern ' + pat);
    }
    // Every fetch( must use the literal '/api/' prefix (see auth.mjs api()).
    const fetchRe = /fetch\s*\(/g;
    let fm;
    while ((fm = fetchRe.exec(b))) {
      const after = b.slice(fm.index, fm.index + 40);
      if (!/fetch\s*\(\s*'\/api\//.test(after)) {
        fail(rel + ' auth block has a non-same-origin fetch: ' + after.slice(0, 40));
      }
    }
    // api('...') path args must be relative (no '://', no leading '/').
    const apiRe = /(?<![\w$])api\(\s*'([^']*)'/g;
    let am;
    while ((am = apiRe.exec(b))) {
      if (am[1].startsWith('/') || am[1].includes('://')) {
        fail(rel + ' auth block api() path escapes same-origin: ' + am[1]);
      }
    }
  }
}

// 2. Nintendo marks may appear ONLY in the GC-verbatim disclaimer (src/game/title.mjs)
//    and in the in-game legal/credits copy. SEO/title/meta surfaces are checked
//    separately below. Docs and scripts may discuss the IP posture (compliance context).
const markPat = /nintendo|game\s*freak|creatures\s*inc/i;
const allowedSrc = new Set(['src/game/title.mjs']);
for (const f of srcFiles) {
  const rel = path.relative(ROOT, f);
  if (allowedSrc.has(rel)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (markPat.test(t)) fail(rel + ' contains a Nintendo mark outside the verbatim disclaimer (GC C4)');
}
// 2b. <title> and meta description (SEO surfaces) must carry zero marks — GC C4.
{
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'standalone.html'), 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const meta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (markPat.test(title)) fail('dist/standalone.html <title> carries a Nintendo mark (GC C4)');
  if (markPat.test(meta)) fail('dist/standalone.html meta description carries a Nintendo mark (GC C4)');
}

// 3. Repo/Vercel/URL/SEO surfaces carry zero marks: check filenames.
const badNames = walk(ROOT, ['.mjs', '.md', '.html', '.js', '.json', '.yaml', '.yml'])
  .map((p) => path.relative(ROOT, p))
  .filter((rel) => !rel.startsWith('node_modules') && /pokemon|pikachu/i.test(rel));
if (badNames.length) fail('filenames carry Nintendo marks (GC C4): ' + badNames.join(', '));

// 4. Zero audio files ever (contracts §2).
const audioFiles = walk(path.join(ROOT, 'assets'), ['.wav', '.mp3', '.ogg', '.flac', '.m4a']);
if (audioFiles.length) fail('audio files in assets/ (zero-audio-file rule): ' + audioFiles.join(', '));

// 5. Secret-shaped strings anywhere (gitleaks runs in CI too; this is the fast local gate).
const secretPat = /(supabase[_-]?key|service[_-]?role|better[_-]?auth[_-]?secret|database[_-]?url)\s*[:=]\s*['"][^'"]+['"]/i;
for (const f of [...srcFiles, ...walk(path.join(ROOT, 'scripts'), ['.mjs'])]) {
  if (secretPat.test(fs.readFileSync(f, 'utf8'))) fail(path.relative(ROOT, f) + ' contains a secret-shaped string');
}

if (failed) { console.error('CONTAMINATION: ' + failed + ' finding(s)'); process.exit(1); }
// 6. No dynamic code execution and no checked-in dependencies (LCR Phase 4 final gate).
//    The client is zero-dep by design (budgets-check enforces relative imports only) and the
//    build is a pure string transform — eval / new Function have no legitimate use in this tree.
//    node_modules is additionally a silent blind spot: walk() skips it, so a checked-in copy
//    would evade every check above (third-party code = unknown IP provenance, GC C4).
//    Track B note: api/ has a legitimate gitignored node_modules (server-only deps,
//    pinned + license-audited). The check below therefore looks at TRACKED files
//    (git ls-files), not the working tree — intent preserved, no false positive.
const codeFiles = [...srcFiles, ...walk(path.join(ROOT, 'scripts'), ['.mjs']), ...walk(path.join(ROOT, 'api'), ['.mjs'])];
for (const f of codeFiles) {
  const t = fs.readFileSync(f, 'utf8');
  if (/\beval\s*\(/.test(t)) fail(path.relative(ROOT, f) + ' calls eval — dynamic code execution is banned');
  if (/\bnew\s+Function\s*\(/.test(t)) fail(path.relative(ROOT, f) + ' uses new Function — dynamic code execution is banned');
}
{
  let tracked = '';
  try {
    tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
  } catch { /* not a git checkout; fall back to working-tree check */ }
  const bad = tracked
    ? tracked.split('\n').filter((f) => f.startsWith('node_modules/'))
    : [];
  if (bad.length) fail('node_modules checked into the repo (' + bad.length + ' tracked files) — zero-dep posture broken, GC C4');
}

if (failed) { console.error('CONTAMINATION: ' + failed + ' finding(s)'); process.exit(1); }
console.log('CONTAMINATION: clean');
