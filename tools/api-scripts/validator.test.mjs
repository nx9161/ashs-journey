// validator.test.mjs — quick unit battery for api/_lib/validator.mjs.
// Run: node tools/api-scripts/validator.test.mjs   (exit 0 = all pass)

import { validateSave, checkNestingDepth, tablesReady, tablesStatus } from '../../api/_lib/validator.mjs';
import { defaultState, SCHEMA_VERSION } from '../../src/game/state.mjs';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
