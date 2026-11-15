// attach-panels-t3.mjs — W10-B T3 {panel} step insertion.
// Inserts exactly one panel step per chartered event at the plan's
// Appendix-A insertion point (uniform rule: after the final build-up
// say, before the battle step; darkrai_inn after step 2). Textual,
// anchored inside each event's own block; asserts the loaded step
// structure BEFORE editing and the diff shape AFTER. Insertions only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const JOBS = [
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_uxie', panel: 'insight-loracle', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_azelf', panel: 'gallant-volitar', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_mesprit', panel: 'candor-empathis', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_cresselia', panel: 'crescent-lunacygn', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_heatran', panel: 'crater-magmarch', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_regigigas', panel: 'temple-colossor', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_shaymin', panel: 'paradise-grathog', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_spiritomb', panel: 'keystone-centwisp', mode: 'afterStep0' },
  { file: 'src/data/story-sinnoh.mjs', mod: 'story-sinnoh.mjs', key: 'SINNOH_EVENTS', event: 'ev_sinnoh_darkrai_inn', panel: 'inn-noctarch', mode: 'inn' },
  { file: 'src/data/story-hoenn.mjs', mod: 'story-hoenn.mjs', key: 'HOENN_EVENTS', event: 'ev_hoenn_jirachi', panel: 'meteor-astraeon', mode: 'afterStep0' },
  { file: 'src/data/story-hoenn.mjs', mod: 'story-hoenn.mjs', key: 'HOENN_EVENTS', event: 'ev_hoenn_deoxys', panel: 'crater-xenogene', mode: 'afterStep0' },
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
    if (j.mode === 'afterStep0') {
      if (!(ev[0].say && ev[1].arc && ev[2].wildBattleCatch)) throw new Error(j.event + ': unexpected shape ' + ev.map((s) => Object.keys(s)[0]).join(','));
    } else {
      if (!(ev[2].say && ev[3].warp && ev[5].wildBattleCatch)) throw new Error(j.event + ': unexpected inn shape ' + ev.map((s) => Object.keys(s)[0]).join(','));
    }
  }
  let text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const j of jobs) {
    const start = text.indexOf(`\n  ${j.event}: [`);
    if (start < 0) throw new Error('block not found: ' + j.event);
    const end = text.indexOf('\n  ],', start);
    const anchor = j.mode === 'inn' ? '\n    { warp:' : '\n    { arc:';
    const at = text.indexOf(anchor, start);
    if (at < 0 || at > end) throw new Error('anchor not found in block: ' + j.event);
    text = text.slice(0, at + 1) + `    { panel: '${j.panel}' },\n` + text.slice(at + 1);
    console.log(`attach: ${j.event} -> { panel: '${j.panel}' } (${j.mode})`);
  }
  fs.writeFileSync(path.join(ROOT, file), text);
}
console.log('attach-panels-t3: done — insertions only');
