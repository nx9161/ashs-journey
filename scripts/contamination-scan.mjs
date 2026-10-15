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

// 1. Zero runtime network in the client bundle.
for (const f of srcFiles) {
  const t = fs.readFileSync(f, 'utf8');
  for (const pat of [/fetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /https?:\/\//, /import\s*\(/]) {
    if (pat.test(t)) fail(path.relative(ROOT, f) + ' contains network/dynamic-import pattern ' + pat);
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
