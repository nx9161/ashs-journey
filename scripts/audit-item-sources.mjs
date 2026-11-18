// audit-item-sources.mjs — item obtainability census (Wire-the-dead-items
// wave, 2026-11-18). The unwired-objects audit found 66 cheat-only items
// and 3 dead ones in a game whose Cheat Terminal stocks the whole table
// at $0: from a legitimate player's seat, an item with no non-terminal
// source does not exist. This audit pins the fix so the class cannot
// recur silently.
//
// Method: every id in ITEMS must show at least one LEGITIMATE source
// among the data channels a normal player reaches —
//   starting bag · Mart clerk stocks · map item balls + hidden items ·
//   npc.give gifts · story EVENTS give/giveHM steps · town-tale rewards ·
//   trainer badge awards
// — or appear in SYSTEM_GRANTS (systems whose grants live in game code:
// slots, the Preserve gate, Kurt crafting, code story beats; each entry
// names its code home) or in EXEMPTIONS (documented, deliberate
// exceptions — each with its reason; an exemption that GAINS a data
// source fails as stale, forcing re-review instead of silent drift).
// The Cheat Terminal is never a source. Frontier Pyramid run loot is
// never a source (its bag is wiped per run and never merges).
// Any id referenced by a scanned channel that does not exist in ITEMS
// fails as a dangling reference.
import { ITEMS, HM_GRANTS } from '../src/data/items.mjs';
import { MAPS, TRAINERS } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3, TRAINERS3 } from '../src/data/maps3.mjs';
import { MAPS4, TRAINERS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
import { QUESTS, TALE_NPCS } from '../src/data/quests.mjs';
import { EVENTS } from '../src/data/story-kanto.mjs';
import { JOHTO_EVENTS, JOHTO_TALES, JOHTO_NPCS, JOHTO_TRAINERS } from '../src/data/story-johto.mjs';
import { HOENN_EVENTS, HOENN_TALES, HOENN_NPCS, HOENN_TRAINERS } from '../src/data/story-hoenn.mjs';
import { ORANGE_EVENTS, ORANGE_TRAINERS } from '../src/data/story-orange.mjs';
import { SINNOH_EVENTS, SINNOH_TALES, SINNOH_NPCS, SINNOH_TRAINERS } from '../src/data/story-sinnoh.mjs';
import { defaultState } from '../src/game/state.mjs';

Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
Object.assign(TRAINERS, TRAINERS3, TRAINERS4, ORANGE_TRAINERS, JOHTO_TRAINERS, HOENN_TRAINERS, SINNOH_TRAINERS);

// Systems whose grants are written by game code, not data. Each label
// names the code home so a reviewer can verify the grant still exists.
const SYSTEM_GRANTS = {
  coin: 'Game Corner slots economy (bag.coin, overworld-systems openSlots)',
  safariball: 'Preserve gate issue per session (overworld-systems safariGate)',
  coincase: 'Game Corner desk — first coin purchase (overworld-systems openSlots) + NG+ handover (state.mjs)',
  oaksletter: "Oak's Letter story beat (overworld-systems, flags.oaks_letter_received)",
  gsball: 'Johto shrine event grant/consume (johto-actors)',
  secretpotion: 'Cianwood pharmacy beat (johto-actors)',
  clearbell: 'Johto story beat (johto-actors)',
  oddkeystone: 'Route 209 traveller beat (overworld-systems)',
  azureflute: 'Finale grant (arcs FINALE_GRANT_ITEM_ID)',
  winnerstrophy: 'Amber League award (overworld-systems)',
  championsribbon: 'Hall of Fame gift (overworld-systems grantKeepsake)',
  xpcandy: 'Spar rewards + tale code payouts (overworld-systems)',
  risingbadge: 'Cragmoor elder-test script award (johto-actors)',
  redball: null, // placeholder removed below if absent
};
delete SYSTEM_GRANTS.redball;
for (const a of ['redapricorn', 'blueapricorn', 'yellowapricorn', 'greenapricorn', 'pinkapricorn', 'whiteapricorn', 'blackapricorn']) {
  SYSTEM_GRANTS[a] = 'Apricorn trees across Yamato (johto-systems APRICORN_TREES)';
}
for (const b of ['levelball', 'lureball', 'moonball', 'loveball', 'fastball', 'friendball', 'heavyball']) {
  SYSTEM_GRANTS[b] = 'Kurt crafting, one ball per podnut (johto-systems kurtCollect)';
}

// Documented exceptions: no legitimate source, deliberately. Reasons
// live in ~/workspace/your_files/wire-dead-items/SPEC.md ("Left unwired")
// and the unwired-objects audit. An id here that gains a data source
// FAILS this audit as a stale exemption.
const EXEMPTIONS = {
  townmap: 'WAVE DEPENDENCY — the grant is owned by the nearest-center wave (in flight ahead of this one in the merge queue); the stale-exemption check below fails the moment that grant lands, forcing removal of this line',
  bikevoucher: 'no honest flow exists — its named shop (Tidehaven) was converted into the gym in the shipped fiction; the working Signal bike shop lends directly',
  hm01: 'vestigial parity row — Cut runs on learnsets + badge gates; no teach moment exists in story data',
  hm02: 'vestigial parity row — Fly runs on learnsets + badge gates; no teach moment exists in story data',
  hm03: 'vestigial parity row — Surf runs on learnsets + badge gates; no teach moment exists in story data',
  hm04: 'vestigial parity row — Strength runs on learnsets + badge gates; no teach moment exists in story data',
  hm05: 'vestigial parity row — Flash runs on learnsets + badge gates; no teach moment exists in story data',
  pinkanberry: 'intentional Cheat-Shop collectible (owner order 2026-10-28, labelled in items.mjs)',
  minimistylure: 'intentional Cheat-Shop collectible (owner order 2026-10-28, labelled in items.mjs)',
  rainbowwing: 'intentional Cheat-Shop collectible (owner order 2026-10-28, labelled in items.mjs)',
  abilitysymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  knowledgesymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  gutssymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  tacticssymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  lucksymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  spiritsymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
  bravesymbol: 'Frontier Symbol slot-state record (badges.symbols), earned-only by design; never a bag grant',
};

const sources = new Map(); // id -> Set(labels)
const dangling = [];
function add(id, label) {
  if (!id) return;
  if (!ITEMS[id]) { dangling.push(id + ' (via ' + label + ')'); return; }
  if (!sources.has(id)) sources.set(id, new Set());
  sources.get(id).add(label);
}
function scanNpc(npc, where) {
  if (!npc) return;
  if (npc.mart && Array.isArray(npc.mart.stock)) for (const id of npc.mart.stock) add(id, 'mart stock (' + where + ')');
  if (npc.give && npc.give.items) for (const id of Object.keys(npc.give.items)) add(id, 'npc gift (' + where + ')');
}
function scanSteps(steps, where) {
  if (!Array.isArray(steps)) return;
  for (const s of steps) {
    if (!s || typeof s !== 'object') continue;
    if (s.give && s.give.items) for (const id of Object.keys(s.give.items)) add(id, 'story grant (' + where + ')');
    if (s.giveHM && HM_GRANTS[s.giveHM]) add(HM_GRANTS[s.giveHM].item, 'story HM grant (' + where + ')');
    if (s.gsBall) add('gsball', 'story grant (' + where + ')');
    for (const v of Object.values(s)) if (Array.isArray(v)) scanSteps(v, where);
  }
}

// 1. starting bag
for (const id of Object.keys(defaultState().bag || {})) add(id, 'starting bag');
// 2. maps: clerks, gifts, balls, hidden
for (const [mapId, m] of Object.entries(MAPS)) {
  for (const npc of (m.npcs || [])) scanNpc(npc, mapId);
  for (const b of (m.items || [])) add(b.item, 'map pickup (' + mapId + ')');
  for (const h of (m.hidden || [])) add(h.item, 'hidden item (' + mapId + ')');
}
// 3. appended NPC lists (tales + regional story actors)
for (const npc of TALE_NPCS) scanNpc(npc, 'tale-npcs');
for (const npc of JOHTO_NPCS) scanNpc(npc, 'johto-npcs');
for (const npc of HOENN_NPCS) scanNpc(npc, 'hoenn-npcs');
for (const npc of SINNOH_NPCS) scanNpc(npc, 'sinnoh-npcs');
// 4. story events
for (const [ev, steps] of Object.entries(EVENTS)) scanSteps(steps, ev);
for (const [ev, steps] of Object.entries(JOHTO_EVENTS)) scanSteps(steps, ev);
for (const [ev, steps] of Object.entries(HOENN_EVENTS)) scanSteps(steps, ev);
for (const [ev, steps] of Object.entries(ORANGE_EVENTS)) scanSteps(steps, ev);
for (const [ev, steps] of Object.entries(SINNOH_EVENTS)) scanSteps(steps, ev);
// 5. tale rewards
for (const tales of [QUESTS, JOHTO_TALES, HOENN_TALES, SINNOH_TALES]) {
  for (const [tid, def] of Object.entries(tales)) {
    if (!def || !def.reward) continue;
    if (def.reward.items) for (const id of Object.keys(def.reward.items)) add(id, 'tale reward (' + tid + ')');
    if (def.reward.keepsake) add(def.reward.keepsake, 'tale reward (' + tid + ')');
  }
}
// 6. trainer badge awards
for (const def of Object.values(TRAINERS)) if (def && def.badge) add(def.badge, 'leader award');

// 7. Slots-flow reachability: coin/coincase ride on SYSTEM_GRANTS whose
// only mint is openSlots, and openSlots opens only through an NPC
// carrying `slots: true` (the sysNpc desk branch). The flow shipped
// with NO such NPC — the whole Corner economy was unreachable and the
// original audit's "system-granted" label for coin/coincase was void.
// The Wire wave hangs the hook on the Corner's HOSTESS (Celadon, at the
// Corner door). If that hook is ever lost, the system grants below are
// void again — fail loudly instead of re-shipping a dead economy.
let slotsHosts = 0;
const countSlots = (npc) => { if (npc && npc.slots) slotsHosts++; };
for (const m of Object.values(MAPS)) for (const npc of (m.npcs || [])) countSlots(npc);
for (const npc of [...TALE_NPCS, ...JOHTO_NPCS, ...HOENN_NPCS, ...SINNOH_NPCS]) countSlots(npc);

const failures = [];
const fail = (msg) => failures.push(msg);
if (slotsHosts === 0) fail('slots flow UNREACHABLE: no NPC carries slots:true — the coin/coincase system grants are void');
for (const d of dangling) fail('dangling reference: ' + d);
for (const id of Object.keys(SYSTEM_GRANTS)) {
  if (!ITEMS[id]) fail('stale SYSTEM_GRANTS entry (not in ITEMS): ' + id);
}
for (const id of Object.keys(EXEMPTIONS)) {
  if (!ITEMS[id]) fail('stale EXEMPTIONS entry (not in ITEMS): ' + id);
  else if (sources.has(id)) fail('stale exemption: ' + id + ' now has a data source (' + [...sources.get(id)].join('; ') + ') — remove it from EXEMPTIONS');
}
let covered = 0, systemCovered = 0, exempt = 0;
const dead = [];
for (const id of Object.keys(ITEMS)) {
  if (sources.has(id)) { covered++; continue; }
  if (SYSTEM_GRANTS[id]) { systemCovered++; continue; }
  if (EXEMPTIONS[id]) { exempt++; continue; }
  dead.push(id);
}
for (const id of dead) fail('DEAD item (no legitimate source): ' + id);

console.log('audit-item-sources: ' + Object.keys(ITEMS).length + ' items · ' + covered + ' with data sources · ' +
  systemCovered + ' system-granted · ' + exempt + ' documented exemptions · ' + dead.length + ' dead');
if (failures.length) {
  for (const f of failures) console.log('  FAIL -', f);
  console.log('audit-item-sources: FAIL (' + failures.length + ')');
  process.exit(1);
}
console.log('audit-item-sources: ALL PASS');
