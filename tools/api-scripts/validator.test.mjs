// validator.test.mjs — quick unit battery for api/_lib/validator.mjs.
// Run: node tools/api-scripts/validator.test.mjs   (exit 0 = all pass)

import { validateSave, checkNestingDepth, tablesReady, tablesStatus } from '../../api/_lib/validator.mjs';
import { defaultState, SCHEMA_VERSION } from '../../src/game/state.mjs';
import { validateSave as validateSaveClient } from '../../src/save/schema.mjs';
import { xpForLevel } from '../../src/engine/formulas.mjs';
import { xpCeilingFor } from '../../src/data/arcs.mjs';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
