// attach-panels-t4.mjs — W10-B T4 (Class B battle reveals) {panel}
// step insertion. Class B attaches EXACTLY like Class A (Director
// ruling, W10-B plan Open Question 4): the panel step sits after the
// event's final build-up say and before its battle step. Textual,
// anchored inside each event's own block; asserts the loaded step
// structure BEFORE editing. Insertions only — dialogue, flags,
// battles byte-identical.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// anchor: the step line the panel line is inserted immediately BEFORE.
const JOBS = [
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_zapdos', panel: 'plant-fulminis', insertIdx: 3, anchor: "{ arc: 'arc_zapdos', stage: 'active' }", shape: ['arc', 'say', 'say', 'arc', 'wildBattle', 'arc', 'toast'] },
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_moltres', panel: 'crownroad-pyrehawk', insertIdx: 3, anchor: "{ arc: 'arc_moltres', stage: 'active' }", shape: ['arc', 'say', 'say', 'arc', 'wildBattle', 'arc', 'toast'] },
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_articuno', panel: 'seafoam-glacierne', insertIdx: 3, anchor: "{ arc: 'arc_articuno', stage: 'active' }", shape: ['arc', 'say', 'say', 'arc', 'wildBattle', 'arc', 'toast'] },
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_mewtwo', panel: 'stillheart-omnigen', insertIdx: 3, anchor: "{ arc: 'arc_mewtwo', stage: 'active' }", shape: ['say', 'say', 'say', 'arc', 'wildBattle', 'arc', 'flag', 'questDone', 'toast'] },
  { file: 'src/data/story-kanto.mjs', mod: 'story-kanto.mjs', key: 'EVENTS', event: 'ev_movie_climax', panel: 'rain-primara', insertIdx: 10, anchor: '{ wildBattle:', shape: ['say', 'say', 'say', 'say', 'say', 'say', 'say', 'choice', 'say', 'say', 'wildBattle', 'say', 'arc', 'flag', 'questDone', 'warp', 'toast'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_moltres', panel: 'cagefire-pyrehawk', insertIdx: 2, anchor: '{ wildBattle:', shape: ['say', 'say', 'wildBattle', 'say', 'flag', 'toast'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_zapdos', panel: 'cagestorm-fulminis', insertIdx: 2, anchor: '{ wildBattle:', shape: ['say', 'say', 'wildBattle', 'say', 'flag', 'toast'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_articuno', panel: 'cageice-glacierne', insertIdx: 2, anchor: '{ wildBattle:', shape: ['say', 'say', 'wildBattle', 'say', 'flag', 'toast'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_climax', panel: 'deep-abyssorn', insertIdx: 7, anchor: '{ wildBattle:', shape: ['say', 'say', 'say', 'say', 'say', 'warp', 'say', 'wildBattle', 'say', 'say', 'say', 'flag', 'arc', 'questDone', 'toast', 'warp'] },
  { file: 'src/data/story-orange.mjs', mod: 'story-orange.mjs', key: 'ORANGE_EVENTS', event: 'ev_orange_2000_lugia', panel: 'altar-abyssorn', insertIdx: 1, anchor: "{ arc: 'arc_lugia_shamouti', stage: 'active' }", shape: ['say', 'arc', 'wildBattle', 'arc', 'flag', 'toast'] },
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
    const keys = ev.map((s) => Object.keys(s)[0]);
    if (JSON.stringify(keys) !== JSON.stringify(j.shape)) throw new Error(j.event + ': unexpected shape ' + keys.join(','));
    // the uniform rule: step before insertion is the final build-up say
    // (or, for lugia, the opening say at 0); the step at insertIdx is
    // the battle step or the arc step immediately preceding it.
    if (!ev[j.insertIdx - 1].say) throw new Error(j.event + ': step before insertion is not a say');
  }
  let text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const j of jobs) {
    const start = text.indexOf(`\n  ${j.event}: [`);
    if (start < 0) throw new Error('block not found: ' + j.event);
    const end = text.indexOf('\n  ],', start);
    const at = text.indexOf(j.anchor, start);
    if (at < 0 || at > end) throw new Error('anchor not found in block: ' + j.event);
    const lineStart = text.lastIndexOf('\n', at) + 1;
    text = text.slice(0, lineStart) + `    { panel: '${j.panel}' },\n` + text.slice(lineStart);
    console.log(`attach: ${j.event} -> { panel: '${j.panel}' } (insert @${j.insertIdx})`);
  }
  fs.writeFileSync(path.join(ROOT, file), text);
}
console.log('attach-panels-t4: done — insertions only');
