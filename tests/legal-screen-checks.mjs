// legal-screen-checks.mjs — the Legal Screen v2 guard (War Room E2E
// Phase 2, Wave W5; run: node tests/legal-screen-checks.mjs).
//
// The in-game Legal screen (DISCLAIMER_CREDITS in src/game/title.mjs) is
// the only attribution surface that travels with the public bundle, so
// its legally-required content is pinned here against silent regression:
//   1. the CC-BY 3.0 change indication for the Gassasin kit (audit C7 D1),
//   2. the OFL font credits for the faces that actually ship (C7 D2),
//   3. a truthful rights-holder contact — and no rendered internal
//      notes (the old '// OQ-grade' TODO strings were array entries and
//      rendered as player-visible text; that class must never return),
//   4. no "100% original" artwork overclaim in README or in the bundle
//      meta string at its source (C7 D4).
// The mirror doc docs/THIRD-PARTY-ART.md must carry the same change
// indication. The Legal screen is a branding-guard EXEMPT surface (real
// names stay real there); this suite complements branding-checks, it
// does not duplicate it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// title.mjs cannot be imported raw (EDITION_MARKER is a build-time token),
// so the credits array is extracted from source text: the single-quoted
// literals between 'DISCLAIMER_CREDITS = [' and its closing '];'.
const titleSrc = fs.readFileSync(path.join(ROOT, 'src', 'game', 'title.mjs'), 'utf8');
const block = titleSrc.match(/DISCLAIMER_CREDITS = \[([\s\S]*?)\n\];/);
ok('DISCLAIMER_CREDITS block found in src/game/title.mjs', !!block);
const DISCLAIMER_CREDITS = block
  ? [...block[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) =>
      m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/\\'/g, "'"))
  : [];
const credits = DISCLAIMER_CREDITS.join('\n');

// 1 — CC-BY 3.0 attribution + changes made (Gassasin kit).
ok('credit names the author (Damian Gasinski aka Gassasin)',
  /Damian/.test(credits) && /Gasinski aka Gassasin/.test(credits));
ok('credit links the source page',
  credits.includes('(opengameart.org/content/16xx16-tileset-pokemonzelda-styled),'));
ok('credit names CC-BY 3.0', credits.includes('used under CC-BY 3.0.'));
ok('credit covers tileset AND character',
  /tileset and character by Damian/.test(credits));
ok('changes-made indication present',
  credits.includes('Modified from the original:'));
ok('changes-made names the modifications (recolours + derivations)',
  /recoloured per town/.test(credits) && /doors and paths derived/.test(credits)
  && /character\s+recoloured/.test(credits));

// 2 — OFL font credits for exactly the faces build.mjs embeds.
ok('Galmuri credited with its copyright holder',
  credits.includes('Galmuri, copyright 2019-2025 Lee Minseo (quiple)'));
ok('Pixelify Sans credited with its copyright holder',
  credits.includes('Pixelify Sans (shipped as PtPixel), copyright 2021 The')
  && credits.includes('Pixelify Sans Project Authors.'));
ok('SIL Open Font License 1.1 named', credits.includes('SIL Open Font License 1.1'));

// 3 — Truthful contact; no rendered internal notes.
ok('contact names the publishing GitHub account (github.com/nx9161)',
  credits.includes('(github.com/nx9161)'));
ok('retired contact promise is gone',
  !credits.includes('contact the developer directly') && !credits.includes('respond promptly'));
ok('no rendered line is an internal note (//-prefixed string entry)',
  !DISCLAIMER_CREDITS.some((l) => l.trimStart().startsWith('//')),
  DISCLAIMER_CREDITS.filter((l) => l.trimStart().startsWith('//')).join(' | '));

// 4 — Overclaim class: README + bundle meta at source.
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
ok('README carries no "100% original" claim', !readme.includes('100% original'));
ok('README scopes the kit credit to the Legal screen',
  readme.includes('credited in the game\'s Legal screen'));
const buildSrc = fs.readFileSync(path.join(ROOT, 'scripts', 'build.mjs'), 'utf8');
const metaLine = buildSrc.split('\n').find((l) => l.includes('name="description"')) || '';
ok('bundle meta (at source) carries no "100% original" claim',
  metaLine !== '' && !metaLine.includes('100% original'), metaLine.trim().slice(0, 90));

// 6 — Original-work notice (owner ruling, 2026-11-17): the Legal screen
// is an original-work/copyright notice naming the author — not a fan-work
// disclaimer. It must carry the copyright line and the authorship line,
// cover the creatures and the story, and carry no fan framing and no
// non-affiliation disclaimer language.
ok('legal notice carries the copyright line',
  credits.includes('© 2026 Naman Parmar. All rights reserved.'));
ok('legal notice names Naman Parmar as the author',
  credits.includes("Kian's Journey is an original work by Naman Parmar."));
ok('legal notice covers creatures, names, and story',
  /creatures/.test(credits) && /names/.test(credits) && /story/.test(credits));
ok('legal notice carries no fan framing or non-affiliation disclaimer',
  !/fan[-\s]?(game|made|project|work|homage)|not affiliated/i.test(credits));

// 5 — Mirror doc carries the same change indication.
const tpa = fs.readFileSync(path.join(ROOT, 'docs', 'THIRD-PARTY-ART.md'), 'utf8');
ok('THIRD-PARTY-ART.md states the modifications',
  /Modifications/.test(tpa) && /recoloured/.test(tpa));
ok('THIRD-PARTY-ART.md required credit covers tileset and character',
  tpa.includes('Tileset and character by Damian Gasinski aka Gassasin'));

console.log(`\nlegal-screen-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
