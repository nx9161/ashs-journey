// validator.test.mjs — quick unit battery for api/_lib/validator.mjs.
// Run: node tools/api-scripts/validator.test.mjs   (exit 0 = all pass)

import { validateSave, checkNestingDepth, tablesReady, tablesStatus } from '../../api/_lib/validator.mjs';
import { defaultState, SCHEMA_VERSION } from '../../src/game/state.mjs';
import { validateSave as validateSaveClient } from '../../src/save/schema.mjs';
import { xpForLevel } from '../../src/engine/formulas.mjs';
import { xpCeilingFor, ARCS } from '../../src/data/arcs.mjs';

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) { pass++; /* console.log('  ok -', name); */ }
  else { fail++; console.log('  FAIL -', name); }
}

console.log('tables:', JSON.stringify(tablesStatus()).slice(0, 120));
t('tables ready', tablesReady());

// 1. accept: the real default state + a fleshed-out save
const good = defaultState();
good.player.name = 'ASH';
good.player.rivalName = 'GARY';
good.party.push({
  speciesId: 'partner', nickname: null, level: 12, xp: 1000,
  moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }],
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40,
});
good.dex.caught['25'] = true; good.dex.seen['25'] = true;
good.badges.kanto.push('boulderbadge');
good.boxes.box1 = [{ speciesId: 'pidgey', level: 5, xp: 100, nickname: null, moves: [{ id: 'tackle' }], ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 } }];
let r = validateSave(good);
t('accept valid save', r.ok && r.errors.length === 0);
t('dex totals re-derived', r.summary.dexCaught === 1 && r.summary.badgeCount === 1);

// 2. 422 cases
const bad = (mut, code) => {
  const s = JSON.parse(JSON.stringify(good));
  mut(s);
  const rr = validateSave(s);
  return !rr.ok && rr.errors.some((e) => e.startsWith(code));
};
t('reject unknown top-level key', bad((s) => { s.hax = 1; }, 'unknown-key'));
t('reject bad schema version', bad((s) => { s.v = 999; }, 'bad-schema-version'));
t('reject unknown species', bad((s) => { s.party[0].speciesId = 'mewtwo_x'; }, 'bad-species'));
t('reject level 101', bad((s) => { s.party[0].level = 101; }, 'bad-mon-level'));
t('reject level 99.5 (type confusion)', bad((s) => { s.party[0].level = 99.5; }, 'bad-mon-level'));
t('reject level "99" string (type confusion)', bad((s) => { s.party[0].level = '99'; }, 'bad-mon-level'));
t('reject party of 7', bad((s) => { for (let i = 0; i < 6; i++) s.party.push(JSON.parse(JSON.stringify(s.party[0]))); }, 'bad-party'));
t('reject unknown move', bad((s) => { s.party[0].moves[0].id = 'hyperbeam9'; }, 'bad-move'));
t('reject non-null symbol slot (v1 lock)', bad((s) => { s.badges.symbols[0] = 'x'; }, 'bad-symbols'));
t('reject badge order skip', bad((s) => { s.badges.kanto.push('fakesecond'); }, 'bad-badge'));
t('reject duplicate badge', bad((s) => { s.badges.kanto.push('boulderbadge'); }, 'bad-badge-id'));
t('reject script nickname (T12 charset)', bad((s) => { s.party[0].nickname = '<img src=x onerror=1>'; }, 'bad-nickname'));
t('reject oversized bag', bad((s) => { s.bag = Object.fromEntries(Array.from({ length: 65 }, (_, i) => ['k' + i, 1])); }, 'bad-bag'));
t('reject bad dexNo 0', bad((s) => { s.dex.caught['0'] = true; }, 'bad-dexno'));
t('reject bad dexNo 1026', bad((s) => { s.dex.caught['1026'] = true; }, 'bad-dexno'));
t('reject dexNo as non-canonical "025"', bad((s) => { s.dex.caught['025'] = true; }, 'bad-dexno'));

// 3. __proto__ / prototype pollution (T7a)
t('reject __proto__ top-level', (() => {
  const s = JSON.parse('{"v":1,"__proto__":{"x":1}}');
  const rr = validateSave(s);
  return !rr.ok && rr.errors.some((e) => e.includes('dangerous-key'));
})());
t('reject constructor in nested object', (() => {
  const s = JSON.parse(JSON.stringify(good));
  s.player = JSON.parse('{"name":"ASH","constructor":{"x":1},"trainerId":1,"playtimeSec":0,"money":0}');
  const rr = validateSave(s);
  return !rr.ok; // rejected (code 'bad-player' via the dangerous-key gate)
})());
t('no prototype pollution side-effect', (() => {
  validateSave(JSON.parse('{"v":1,"__proto__":{"polluted":true}}'));
  return ({}).polluted !== true;
})());

// 4. anomaly branch (accepted-but-logged)
r = validateSave((() => {
  const s = JSON.parse(JSON.stringify(good));
  s.player.playtimeSec = 0; // zero playtime but has badges/party progress
  return s;
})());
t('anomaly accepted (not 422)', r.ok === true);
t('anomaly flagged', r.anomalies.includes('zero-playtime-with-progress'));

// 5. depth scan (413-shape, pre-parse)
t('depth scan passes normal body', checkNestingDepth(JSON.stringify(good), 32));
t('depth scan rejects 40-deep nesting', !checkNestingDepth('['.repeat(40) + ']'.repeat(40), 32));
t('depth scan ignores brackets in strings', checkNestingDepth(JSON.stringify({ a: '[[[[' }), 32));

// 6. schema version constant agreement (pins the ADR-025 v2 bump)
t('validator tracks client SCHEMA_VERSION', SCHEMA_VERSION === 2);

// 7. ADR-025 (schema v2): difficulty modes, House Rules, meta fields
const okWith = (mut) => { const s = JSON.parse(JSON.stringify(good)); mut(s); return validateSave(s).ok; };
t('accept difficulty story', okWith((s) => { s.story.difficulty = 'story'; }));
t('accept difficulty challenge', okWith((s) => { s.story.difficulty = 'challenge'; }));
t('reject legacy difficulty normal', bad((s) => { s.story.difficulty = 'normal'; }, 'bad-difficulty'));
t('accept houseRules all on', okWith((s) => { for (const k of Object.keys(s.settings.houseRules)) s.settings.houseRules[k] = true; }));
t('reject houseRules unknown toggle', bad((s) => { s.settings.houseRules.luckyCharm = true; }, 'bad-setting:houseRules'));
t('reject houseRules non-boolean', bad((s) => { s.settings.houseRules.fastLearner = 'yes'; }, 'bad-setting:houseRules'));
t('accept xpcandy in bag', okWith((s) => { s.bag.xpcandy = 3; }));
// ADR-025 §3 (Phase 3): mon.keepsake joins the v2 shape.
t('accept party mon keepsake', okWith((s) => { s.party[0].keepsake = 'tortoisecharm'; }));
t('accept box mon keepsake', okWith((s) => { s.boxes.box1[0].keepsake = 'gloomfang'; }));
t('accept keepsake in bag pocket', okWith((s) => { s.bag.tidepearl = 1; }));
t('accept legacy mon without keepsake', okWith((s) => { delete s.party[0].keepsake; }));
t('reject non-keepsake item as keepsake', bad((s) => { s.party[0].keepsake = 'potion'; }, 'bad-keepsake'));
t('reject unknown keepsake id', bad((s) => { s.party[0].keepsake = 'mithrilmail'; }, 'bad-keepsake'));
t('reject numeric keepsake', bad((s) => { s.party[0].keepsake = 7; }, 'bad-keepsake'));
t('reject box mon non-keepsake', bad((s) => { s.boxes.box1[0].keepsake = 'pokeball'; }, 'bad-keepsake'));
t('reject bad meta houseRulesTouched', bad((s) => { s.meta.houseRulesTouched = 'yes'; }, 'bad-meta-house-rules'));
t('reject bad meta ngPlus', bad((s) => { s.meta.ngPlus = -1; }, 'bad-meta-ngplus'));

// 8. ADR-025 §6 (Phase 6 fix): HoF hybrid shape — a canonical team
// entry whose members carry the legacy { species } key. The client's
// normalizeHofEntry maps species -> speciesId; the server must agree.
t('accept hybrid hof member (legacy species key inside canonical team)', okWith((s) => { s.story.hof = [{ team: [{ species: 'pidgeot', level: 55 }], badges: 8 }]; }));
t('accept mixed team (canonical + legacy members) and hybrid priorHof', okWith((s) => {
  s.story.hof = [{ team: [{ speciesId: 'venusaur', level: 63, nickname: null }, { species: 'pidgeot', level: 55 }], badges: 8 }];
  s.story.priorHof = [{ team: [{ species: 'mew', level: 70 }], badges: 8 }];
}));
t('accept pure legacy hof entry', okWith((s) => { s.story.hof = [{ species: 'pidgey', level: 33 }]; }));
t('reject garbage hybrid: unknown species via legacy key', bad((s) => { s.story.hof = [{ team: [{ species: 'notaspecies', level: 55 }], badges: 8 }]; }, 'bad-hof'));
t('reject garbage hybrid: level out of bounds via legacy key', bad((s) => { s.story.hof = [{ team: [{ species: 'pidgeot', level: 101 }], badges: 8 }]; }, 'bad-hof'));
t('reject garbage hybrid: member with no species key at all', bad((s) => { s.story.hof = [{ team: [{ level: 55 }], badges: 8 }]; }, 'bad-hof'));

// 9. Stage J0 (ADR-027 Amendment 2): arc-banded level bounds + the
// paired XP ceiling. The cap is a read of the SAVE's own story.arc:
// Kanto/Orange share band 1-100, Johto is 101-200 (min stays 1 — a
// Lv150 mon is legal in Johto, a Lv5 mon is equally legal there:
// bands cap, they do not floor carried mons).
const arcSave = (arc, mut) => {
  const s = JSON.parse(JSON.stringify(good));
  s.story.arc = arc;
  if (mut) mut(s);
  return s;
};
const okArc = (arc, mut) => validateSave(arcSave(arc, mut)).ok;
const badArc = (arc, mut, code) => {
  const rr = validateSave(arcSave(arc, mut));
  return !rr.ok && rr.errors.some((e) => e.startsWith(code));
};
// (a) Lv150 mon in a Johto-arc save validates clean — party, box, HoF.
t('J0 accept Lv150 party mon in Johto save', okArc('johto', (s) => { s.party[0].level = 150; s.party[0].xp = xpForLevel('mediumfast', 150); }));
t('J0 accept Lv150 box mon in Johto save', okArc('johto', (s) => { s.boxes.box1[0].level = 150; }));
t('J0 accept Lv150 HoF team in Johto save', okArc('johto', (s) => { s.story.hof = [{ team: [{ speciesId: 'pidgeot', level: 150 }], badges: 8 }]; }));
t('J0 accept Lv200 party mon in Johto save (band cap)', okArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpForLevel('mediumfast', 200); }));
t('J0 accept Lv5 party mon in Johto save (min stays 1, no band floor)', okArc('johto', (s) => { s.party[0].level = 5; s.party[0].xp = 100; }));
// (b) Lv150 in a Kanto-arc save -> bad-mon-level (and Orange shares Kanto's band).
t('J0 reject Lv150 party mon in Kanto save', badArc('kanto', (s) => { s.party[0].level = 150; }, 'bad-mon-level'));
t('J0 reject Lv150 box mon in Kanto save', badArc('kanto', (s) => { s.boxes.box1[0].level = 150; }, 'bad-mon-level'));
t('J0 reject Lv150 HoF team in Kanto save', badArc('kanto', (s) => { s.story.hof = [{ team: [{ speciesId: 'pidgeot', level: 150 }], badges: 8 }]; }, 'bad-hof'));
t('J0 reject Lv101 party mon in Orange save (shared Kanto band)', badArc('orange', (s) => { s.party[0].level = 101; }, 'bad-mon-level'));
// (c) Lv250 in a Johto-arc save -> bad-mon-level; Lv201 is the exact boundary.
t('J0 reject Lv250 party mon in Johto save', badArc('johto', (s) => { s.party[0].level = 250; }, 'bad-mon-level'));
t('J0 reject Lv201 party mon in Johto save (cap boundary)', badArc('johto', (s) => { s.party[0].level = 201; }, 'bad-mon-level'));
// (d) Lv200 mon with max-arc XP in a Johto save -> no bad-xp. Max-arc
// XP = the slowest curve's total at the band cap ('slow' at Lv200 =
// 10,000,000 — above mediumfast 8.0M and mediumslow ~9.02M, both of
// which the old flat 2,000,000 ceiling would have wrongly rejected).
t('J0 accept Lv200 mon with slowest-curve XP in Johto save', okArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpForLevel('slow', 200); }));
t('J0 accept Lv200 mon with mediumslow XP in Johto save', okArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpForLevel('mediumslow', 200); }));
t('J0 accept mon at exactly the Johto XP ceiling', okArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpCeilingFor({ story: { arc: 'johto' } }); }));
t('J0 reject mon one XP over the Johto ceiling', badArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpCeilingFor({ story: { arc: 'johto' } }) + 1; }, 'bad-xp'));
// (e) Kanto behaviour unchanged: the Kanto ceiling is the same
// derivation at cap 100 (2 x slow(101) = 2,575,752 — at/above the old
// flat 2,000,000 for every legit Kanto mon, stricter nowhere legit).
t('J0 accept Kanto Lv100 mon at slowest-curve XP', okArc('kanto', (s) => { s.party[0].level = 100; s.party[0].xp = xpForLevel('slow', 100); }));
t('J0 reject Kanto mon one XP over the Kanto ceiling', badArc('kanto', (s) => { s.party[0].level = 100; s.party[0].xp = xpCeilingFor({ story: { arc: 'kanto' } }) + 1; }, 'bad-xp'));
// Anti-cheat heuristic is cap-relative: whole party AT the save-arc's
// cap with <1h playtime flags; a Johto party at 100 (not its cap)
// does not, and the Kanto form of the heuristic is unchanged.
t('J0 anomaly: Johto party all at cap 200, low playtime', (() => {
  const rr = validateSave(arcSave('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpForLevel('mediumfast', 200); s.player.playtimeSec = 100; }));
  return rr.ok && rr.anomalies.includes('maxed-party-low-playtime');
})());
t('J0 no anomaly: Johto party all at 100 (below its cap), low playtime', (() => {
  const rr = validateSave(arcSave('johto', (s) => { s.party[0].level = 100; s.party[0].xp = xpForLevel('mediumfast', 100); s.player.playtimeSec = 100; }));
  return rr.ok && !rr.anomalies.includes('maxed-party-low-playtime');
})());
t('J0 anomaly unchanged: Kanto party all at 100, low playtime', (() => {
  const rr = validateSave(arcSave('kanto', (s) => { s.party[0].level = 100; s.party[0].xp = xpForLevel('mediumfast', 100); s.player.playtimeSec = 100; }));
  return rr.ok && rr.anomalies.includes('maxed-party-low-playtime');
})());
// Matched pair: the CLIENT schema (src/save/schema.mjs) derives the
// same caps from the same registry — the two validators must agree
// on every case above that the client checks (party level/xp, HoF).
const okClientArc = (arc, mut) => validateSaveClient(arcSave(arc, mut)).ok;
const badClientArc = (arc, mut, code) => {
  const rr = validateSaveClient(arcSave(arc, mut));
  return !rr.ok && rr.errors.some((e) => e.startsWith(code));
};
t('J0 client accepts Lv150 party mon in Johto save', okClientArc('johto', (s) => { s.party[0].level = 150; s.party[0].xp = xpForLevel('mediumfast', 150); }));
t('J0 client rejects Lv150 party mon in Kanto save', badClientArc('kanto', (s) => { s.party[0].level = 150; }, 'bad-mon-level'));
t('J0 client rejects Lv250 party mon in Johto save', badClientArc('johto', (s) => { s.party[0].level = 250; }, 'bad-mon-level'));
t('J0 client accepts Lv200 mon with slowest-curve XP in Johto save', okClientArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpForLevel('slow', 200); }));
t('J0 client rejects mon one XP over the Johto ceiling', badClientArc('johto', (s) => { s.party[0].level = 200; s.party[0].xp = xpCeilingFor({ story: { arc: 'johto' } }) + 1; }, 'bad-xp'));
t('J0 client accepts Lv180 HoF team in Johto save', okClientArc('johto', (s) => { s.story.hof = [{ team: [{ speciesId: 'pidgeot', level: 180, nickname: null }], badges: 8 }]; }));
t('J0 client rejects Lv180 HoF team in Kanto save', badClientArc('kanto', (s) => { s.story.hof = [{ team: [{ speciesId: 'pidgeot', level: 180, nickname: null }], badges: 8 }]; }, 'bad-story-hof-entry'));

// 10. Stage H1 (Arc 3): the same registry band machinery re-verified at
// the Hoenn cap — Lv300 validates in a hoenn-arc save, fails
// bad-mon-level in a johto-arc save, and the paired XP ceiling holds at
// Lv300 on the slowest curve (no new code: gen-tables emits the hoenn
// row from the registry, both validators read it).
t('H1 accept Lv300 party mon in Hoenn save (band cap)', okArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpForLevel('mediumfast', 300); }));
t('H1 accept Lv300 box mon in Hoenn save', okArc('hoenn', (s) => { s.boxes.box1[0].level = 300; }));
t('H1 accept Lv300 mon with slowest-curve XP in Hoenn save', okArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpForLevel('slow', 300); }));
t('H1 accept mon at exactly the Hoenn XP ceiling', okArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpCeilingFor({ story: { arc: 'hoenn' } }); }));
t('H1 reject mon one XP over the Hoenn ceiling', badArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpCeilingFor({ story: { arc: 'hoenn' } }) + 1; }, 'bad-xp'));
t('H1 reject Lv300 party mon in Johto save', badArc('johto', (s) => { s.party[0].level = 300; }, 'bad-mon-level'));
t('H1 reject Lv301 party mon in Hoenn save (cap boundary)', badArc('hoenn', (s) => { s.party[0].level = 301; }, 'bad-mon-level'));
t('H1 client accepts Lv300 party mon in Hoenn save', okClientArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpForLevel('mediumfast', 300); }));
t('H1 client rejects Lv300 party mon in Johto save', badClientArc('johto', (s) => { s.party[0].level = 300; }, 'bad-mon-level'));
t('H1 client accepts Lv300 mon with slowest-curve XP in Hoenn save', okClientArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpForLevel('slow', 300); }));
t('H1 client rejects mon one XP over the Hoenn ceiling', badClientArc('hoenn', (s) => { s.party[0].level = 300; s.party[0].xp = xpCeilingFor({ story: { arc: 'hoenn' } }) + 1; }, 'bad-xp'));

// 11. Arc 3.5 Stage F5-fix: the regionsDone vocabulary is the ARCS
// registry's completionKeys (emitted by gen-tables as
// tables.regionsDoneKeys), NOT the hardcoded regions list. The bug
// (caught by the F5a chain drive on one continuous played save,
// D08): the Frontier arc's regionKey is 'kanto' but its
// completionKey is 'frontier' — the first arc whose completionKey
// is not a region name — so every real Frontier-complete save was
// rejected 'bad-regions-done' server-side while the client schema
// accepted it. The story.region check is NOT part of this fix: it
// keeps reading TABLES.regions exactly as at base (proven both
// ways below).
const COMPLETION_KEYS = ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh', 'unova', 'kalos', 'alola', 'journeys', 'horizons'];
t('F5-fix registry completionKeys are the expected regionsDone vocabulary (incl frontier, excl galar/paldea/liko)',
  JSON.stringify(ARCS.map((a) => a.completionKey)) === JSON.stringify(COMPLETION_KEYS));
// The D08 case, played shape: the four earlier arcs done, the
// Frontier done, all seven symbols gold, the current arc frontier —
// and story.region 'kanto', the Frontier arc's regionKey (a real
// Frontier save never carries region 'frontier').
const frontierComplete = (mut) => {
  const s = JSON.parse(JSON.stringify(good));
  s.story.arc = 'frontier';
  s.story.region = 'kanto';
  s.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier'];
  s.story.flags.frontier_complete = true;
  s.badges.symbols = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'gold'];
  if (mut) mut(s);
  return s;
};
t('F5-fix (i) played-shape Frontier-complete save validates server-side with ZERO errors (the D08 case)',
  (() => { const rr = validateSave(frontierComplete()); return rr.ok && rr.errors.length === 0; })());
t('F5-fix (iv) client schema result for the same Frontier-complete save is unchanged (accepted)',
  (() => { const rr = validateSaveClient(frontierComplete()); return rr.ok && rr.errors.length === 0; })());
t('F5-fix (ii) reject bogus regionsDone entry frontier2', bad((s) => { s.story.regionsDone = ['kanto', 'frontier2']; }, 'bad-regions-done'));
t('F5-fix (ii) reject regionsDone entry galar (in the old regions list, not a registry completionKey)',
  (() => { const rr = validateSave(frontierComplete((s) => { s.story.regionsDone = ['kanto', 'galar']; })); return !rr.ok && rr.errors.includes('bad-regions-done'); })());
t('F5-fix (iii) accept regionsDone carrying any other registry completionKey (each singly, and the full 11-key list)',
  COMPLETION_KEYS.every((k) => validateSave(frontierComplete((s) => { s.story.regionsDone = [k]; })).ok)
  && validateSave(frontierComplete((s) => { s.story.regionsDone = [...COMPLETION_KEYS]; })).ok);
t('F5-fix story.region frontier stays rejected bad-region server-side (unchanged from base)',
  (() => { const rr = validateSave(frontierComplete((s) => { s.story.region = 'frontier'; })); return !rr.ok && rr.errors.includes('bad-region'); })());
t('F5-fix story.region kanto (the Frontier regionKey) stays accepted server-side (unchanged from base)',
  validateSave(frontierComplete((s) => { s.story.region = 'kanto'; })).ok);

// 12. Arc 4 Stage S0 (F-1 fix, coordinator ruling): meta.location is
// a snapshot of the game's own map display name, and shipped names
// carry U+2014 EM DASH — the server location check uses a dedicated
// charset (SAFE_TEXT + em dash + en dash) while every other free-text
// check keeps SAFE_TEXT. Before this fix, a real player standing in
// e.g. 'Pewter City — House' got 'bad-meta-location:charset'
// server-side while the client accepted the same save, so they could
// not cloud-save at all.
t('S0 F-1 accept em-dash meta.location (a real shipped map name)', okWith((s) => { s.meta.location = 'Pewter City — House'; }));
t('S0 F-1 accept en-dash meta.location (the dedicated charset carries U+2013 too)', okWith((s) => { s.meta.location = 'Pewter City – House'; }));
t('S0 F-1 reject meta.location with a genuinely unsafe character (<)', bad((s) => { s.meta.location = 'Pewter <City'; }, 'bad-meta-location'));
t('S0 F-1 reject meta.location with a genuinely unsafe character (")', bad((s) => { s.meta.location = 'Pewter "City'; }, 'bad-meta-location'));
t('S0 F-1 reject meta.location with an emoji', bad((s) => { s.meta.location = 'Pewter City 🏠'; }, 'bad-meta-location'));
t('S0 F-1 nothing else widens: an em-dash nickname still rejects (bad-nickname, SAFE_TEXT kept)', bad((s) => { s.party[0].nickname = 'A—B'; }, 'bad-nickname'));
t('S0 F-1 nothing else widens: an em-dash player name still rejects (bad-player-name, SAFE_TEXT kept)', bad((s) => { s.player.name = 'A—B'; }, 'bad-player-name'));
// The played-shape case: a fleshed-out save (party mon, dex, a Kanto
// badge, a box mon — the `good` fixture) whose ONLY unusual field is
// meta.location set to a real em-dash map name validates server-side
// with ZERO errors, and the client result is unchanged (accepted).
t('S0 F-1 played-shape save with meta.location = Vermilion City — House validates server-side with ZERO errors',
  (() => { const rr = validateSave((() => { const s = JSON.parse(JSON.stringify(good)); s.meta.location = 'Vermilion City — House'; return s; })()); return rr.ok && rr.errors.length === 0; })());
t('S0 F-1 client schema result for the same played-shape save is unchanged (accepted)',
  (() => { const s = JSON.parse(JSON.stringify(good)); s.meta.location = 'Vermilion City — House'; return validateSaveClient(s).ok; })());

// 13. Arc 4 Stage S8-fix: the flags-size bound tracks the shipped
// campaign's real flag count. The bug (caught by the S8 chain drive
// on one continuous played save, D08/D09/D10): story.flags is the
// standing open vocabulary and a real full-chain save legitimately
// carries 650 flags at the finale (619 at Sinnoh-complete, 433 at
// Frontier-complete — measured on the chain snapshots), so the
// Track-B-era 500 bound rejected every real full-chain save with
// 'bad-flags-size' server-side while the client schema accepted it.
// The bound stands, raised to 1000 (its purpose — a sanity size —
// is unchanged; the 64 KB route gate still bounds the payload).
const fullChainFlags = (n) => {
  const s = frontierComplete((x) => {
    x.story.arc = 'sinnoh'; x.story.region = 'sinnoh';
    x.story.regionsDone = ['kanto', 'orange', 'johto', 'hoenn', 'frontier', 'sinnoh'];
  });
  s.story.flags = {};
  for (let i = 0; i < n; i++) s.story.flags['flag_' + String(i).padStart(4, '0')] = true;
  s.story.flags.sinnoh_complete = true; s.story.flags.finale_done = true;
  return s;
};
t('S8-fix (i) played-shape full-chain save carrying 650 story flags (the measured finale-complete count) validates server-side with ZERO errors (the D08/D09/D10 case)',
  (() => { const rr = validateSave(fullChainFlags(650)); return rr.ok && rr.errors.length === 0; })());
t('S8-fix (ii) client schema result for the same 650-flag save is unchanged (accepted)',
  (() => { const rr = validateSaveClient(fullChainFlags(650)); return rr.ok && rr.errors.length === 0; })());
t('S8-fix (iii) the bound still stands: 1001 story flags reject bad-flags-size server-side',
  (() => { const rr = validateSave(fullChainFlags(1001)); return !rr.ok && rr.errors.includes('bad-flags-size'); })());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
