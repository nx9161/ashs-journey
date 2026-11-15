// attach-panels-t5.mjs — W10-B T5 {panel} step insertion.
// Inserts exactly one panel step per chartered event at the plan's
// per-class insertion point (Class C glimpses + Class D set-pieces:
// after the final build-up say, before the flag/toast that seals the
// moment; the parley panel interleaves before the actorEnter steps,
// after the opening says). Textual, anchored inside each event's own
// block; asserts the loaded step structure BEFORE editing.
// Insertions only. Class H embark is NOT here: its hook census found
// no data-level hook (see the T5 SPEC) — nothing is attached for it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const JOBS = [
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_acuity_glimpse', panel: 'underice-loracle', mode: 'beforeFlag', flag: 'uxie_glimpse', shape: ['say', 'flag', 'toast'] },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_verity_pressure', panel: 'surfaced-empathis', mode: 'beforeFlag', flag: 'mesprit_glimpse', shape: ['say', 'flag', 'toast'] },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_gracidea', panel: 'gracidea-grathog', mode: 'beforeFlag', flag: 'gracidea_beat_done', shape: ['say', 'say', 'flag', 'flag', 'flag', 'toast'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_storm', panel: 'storm-sanctum', mode: 'beforeFlag', flag: 'orange_2000_active', shape: ['say', 'say', 'say', 'say', 'say', 'say', 'say', 'say', 'flag', 'toast'] },
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_parley_enter', panel: 'parley-plaza', mode: 'beforeActorEnter', shape: ['say', 'say', 'actorEnter', 'actorEnter'] },
];

const byFile = {};
for (const j of JOBS) (byFile[j.file] ||= []).push(j);

for (const [file, jobs] of Object.entries(byFile)) {
  const mod = await import(path.join(ROOT, 'src/data', jobs[0].mod));
  const EVENTS = mod[jobs[0].key];
  // structural assertions on the loaded data, pre-edit
  for (const j of jobs) {
    const ev = EVENTS[j.event];
    if (!ev) throw new Error('missing event ' + j.event);
    if (ev.some((s) => s.panel)) throw new Error(j.event + ' already carries a panel step');
    const shape = ev.map((s) => Object.keys(s)[0]).join(',');
    if (shape !== j.shape.join(',')) throw new Error(j.event + ': unexpected shape ' + shape);
    if (j.flag && ev.find((s) => s.flag) !== ev.find((s) => s.flag === j.flag)) throw new Error(j.event + ': sealing flag mismatch');
  }
  let text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const j of jobs) {
    const start = text.indexOf(`\n  ${j.event}: [`);
    if (start < 0) throw new Error('block not found: ' + j.event);
    const end = text.indexOf('\n  ],', start);
    const anchor = j.mode === 'beforeActorEnter' ? '\n    { actorEnter:' : '\n    { flag:';
    const at = text.indexOf(anchor, start);
    if (at < 0 || at > end) throw new Error('anchor not found in block: ' + j.event);
    text = text.slice(0, at + 1) + `    { panel: '${j.panel}' },\n` + text.slice(at + 1);
    console.log(`attach: ${j.event} -> { panel: '${j.panel}' } (${j.mode})`);
  }
  fs.writeFileSync(path.join(ROOT, file), text);
}
console.log('attach-panels-t5: done — insertions only');
