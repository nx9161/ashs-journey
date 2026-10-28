// battle-model-checks.mjs — ADR-026 (owner ruling 2026-10-28) proofs:
// turn-based classic is THE main battle (default flip), real-time stays
// as a selectable optional legacy mode, and the Shift/Set switchMode
// (default Set) behaves per spec in the classic engine.
// Part A: pure units (defaults, save fill, server validator).
// Part B: the built bundle in a headless Game — full classic wild +
// trainer battles in Set and Shift, and an RT regression battle.
// Run: node tests/battle-model-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const { migrate } = await import(join(ROOT, 'src/save/schema.mjs'));
const { validateSave: serverValidate } = await import(join(ROOT, 'api/_lib/validator.mjs'));

// (1) defaults
{
  const d = defaultState();
  ok('A01 default battleStyle is classic (ADR-026)', d.settings.battleStyle === 'classic');
  ok('A02 default switchMode is set (ADR-026)', d.settings.switchMode === 'set');
}

// (2) save fill: a stored battleStyle is never rewritten; switchMode fills
{
  const rtSave = JSON.parse(JSON.stringify(defaultState()));
  rtSave.settings.battleStyle = 'rt';
  delete rtSave.settings.switchMode; // pre-ADR-026 save shape
  const m1 = migrate(rtSave);
  ok('A03 stored rt survives load intact', m1.settings.battleStyle === 'rt');
  ok('A04 missing switchMode fills to set', m1.settings.switchMode === 'set');
  const shiftSave = JSON.parse(JSON.stringify(defaultState()));
  shiftSave.settings.switchMode = 'shift';
  const m2 = migrate(shiftSave);
  ok('A05 stored shift survives load', m2.settings.switchMode === 'shift' && m2.settings.battleStyle === 'classic');
  const junkSave = JSON.parse(JSON.stringify(defaultState()));
  junkSave.settings.switchMode = 'bogus';
  ok('A06 invalid switchMode coerces to set on load', migrate(junkSave).settings.switchMode === 'set');
}

// (3) server validator: switchMode mirrors battleStyle
{
  const base = () => {
    const s = defaultState();
    s.player.name = 'ASH'; s.player.rivalName = 'GARY';
    s.party.push({
      speciesId: 'partner', nickname: null, level: 12, xp: 1000,
      moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }],
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40,
    });
    return s;
  };
  const withSet = (mut) => { const s = base(); mut(s.settings); return serverValidate(s); };
  ok('A07 validator accepts switchMode set', withSet((s) => { s.switchMode = 'set'; }).ok === true);
  ok('A08 validator accepts switchMode shift', withSet((s) => { s.switchMode = 'shift'; }).ok === true);
  const badSwitch = withSet((s) => { s.switchMode = 'sometimes'; });
  ok('A09 validator rejects garbage switchMode', badSwitch.ok === false && badSwitch.errors.includes('bad-setting:switchMode'), JSON.stringify(badSwitch.errors));
  ok('A10 validator still accepts battleStyle rt + classic',
    withSet((s) => { s.battleStyle = 'rt'; }).ok === true && withSet((s) => { s.battleStyle = 'classic'; }).ok === true);
  const badStyle = withSet((s) => { s.battleStyle = 'turbo'; });
  ok('A11 validator still rejects garbage battleStyle', badStyle.ok === false && badStyle.errors.includes('bad-setting:battleStyle'), JSON.stringify(badStyle.errors));
}

// ================= Part B: headless bundle battles =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 777;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const input = game.input, ui = game.ui, st = game.state;
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  out.defaultStyleInBundle = st.settings.battleStyle;
  out.defaultSwitchInBundle = st.settings.switchMode;

  const pressA = () => { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(2); };
  const promptsInLog = () => ui.log.filter((l) => l.ui === 'battle-msg' && typeof l.text === 'string' && l.text.includes('is about to send out')).length;

  // Generic classic-battle driver: FIGHT -> first enabled move, answers
  // the Shift prompt per opts.shift ('no' | 'yes'), picks the reserve on
  // a Shift switch or a forced faint switch. Returns when the scene pops.
  function driveClassic(b, opts) {
    opts = opts || {};
    let n = 0, snapped = false;
    while (game.scenes.top === b && n++ < 5000) {
      game.loop.stepTicks(2);
      if (ui.dlg) { pressA(); continue; }
      if (b.msgOpen) { pressA(); continue; }
      if (opts.afterPrompt && !snapped && b.state === 'command' && promptsInLog() > 0) { snapped = true; opts.afterPrompt(b); }
      if (ui.menuOpen && ui.menu) {
        const m = ui.menu;
        if (m.title === 'Will you change Pokemon?') {
          const idx = m.items.findIndex((it) => it.value === (opts.shift === 'yes' ? 'yes' : 'no'));
          ui.debugChoose(idx >= 0 ? idx : 0); game.loop.stepTicks(2); continue;
        }
        if (m.title === 'Choose a Pokemon') { // Shift voluntary party menu
          const idx = m.items.findIndex((it) => !it.disabled && typeof it.value === 'number' && it.value >= 0);
          ui.debugChoose(idx); game.loop.stepTicks(2); continue;
        }
        if (m.kind === 'commands') {
          const idx = m.items.findIndex((it) => it.value === 'fight');
          ui.debugChoose(idx >= 0 ? idx : 0); game.loop.stepTicks(2); continue;
        }
        if (m.title === 'Choose a move') {
          const idx = m.items.findIndex((it) => !it.disabled && typeof it.value === 'number' && it.value >= 0);
          ui.debugChoose(idx >= 0 ? idx : 0); game.loop.stepTicks(2); continue;
        }
        if (m.title === 'Choose next Pokemon') {
          const idx = m.items.findIndex((it) => !it.disabled);
          ui.debugChoose(idx); game.loop.stepTicks(2); continue;
        }
        // Any other menu: back out.
        input.press('b'); game.loop.stepTicks(2); input.release('b');
      }
    }
    // Drain any post-battle dialogue (winTrainer lose lines etc.).
    let d = 0; while (ui.dlg && d++ < 80) pressA();
    return game.scenes.top !== b;
  }

  const TRAINER = () => ({ id: 'bm_tester', name: 'BM Tester', title: 'Trainer', reward: 100,
    team: [{ species: 'rattata', level: 3 }, { species: 'pidgey', level: 3 }],
    intro: ['Battle model check.'], lose: ['You win.'] });
  const team = () => [makeMon('partner', 30, SPECIES, MOVES), makeMon('pidgey', 20, SPECIES, MOVES)];

  // (4) headless classic wild battle completes (default settings = classic/set)
  {
    st.party = team();
    const b = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 3, SPECIES, MOVES), returnTo: ow, rt: st.settings.battleStyle !== 'classic' });
    game.scenes.push(b); b.enter();
    out.wildRtMode = b.rtMode;
    out.wildCompleted = driveClassic(b);
    out.wildPrompts = promptsInLog();
  }

  // (5) SET: multi-mon trainer battle — zero prompts, completes
  {
    ui.log.length = 0;
    st.party = team();
    const b = new BattleScene({ kind: 'trainer', trainer: TRAINER(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter();
    out.setCompleted = driveClassic(b);
    out.setPrompts = promptsInLog();
  }

  // (6a) SHIFT + No: prompt exactly once per KO (2-mon team => 1), completes
  {
    ui.log.length = 0;
    st.settings.switchMode = 'shift';
    st.party = team();
    const lead = st.party[0];
    const b = new BattleScene({ kind: 'trainer', trainer: TRAINER(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter();
    let allyAtCommand = null;
    out.shiftNoCompleted = driveClassic(b, { shift: 'no', afterPrompt: (bb) => { allyAtCommand = bb.ally; } });
    out.shiftNoPrompts = promptsInLog();
    out.shiftNoAllyKept = allyAtCommand === lead;
  }

  // (6b) SHIFT + Yes: switch completes, participants/XP correct at send-out
  {
    ui.log.length = 0;
    st.party = team();
    const lead = st.party[0], reserve = st.party[1];
    const leadXp0 = lead.xp, reserveXp0 = reserve.xp;
    const b = new BattleScene({ kind: 'trainer', trainer: TRAINER(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter();
    let snap = null;
    out.shiftYesCompleted = driveClassic(b, { shift: 'yes', afterPrompt: (bb) => {
      snap = { allyIsReserve: bb.ally === reserve,
        partsHasReserve: bb.participants.has(reserve), partsHasLead: bb.participants.has(lead),
        leadXp: lead.xp, reserveXp: reserve.xp };
    } });
    out.shiftYesPrompts = promptsInLog();
    out.shiftYesSnap = snap;
    out.shiftYesLeadXp0 = leadXp0; out.shiftYesReserveXp0 = reserveXp0;
  }
  st.settings.switchMode = 'set';

  // (7a) RT still selectable: an RT battle boots and completes headlessly
  {
    st.settings.battleStyle = 'rt';
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 3, SPECIES, MOVES), returnTo: ow, rt: st.settings.battleStyle !== 'classic' });
    game.scenes.push(b); b.enter();
    let n = 0;
    while (game.scenes.top === b && n++ < 6000) {
      game.loop.stepTicks(2);
      if (b.msgOpen) { pressA(); continue; }
      if (ui.dlg) { pressA(); continue; }
      if (ui.menuOpen) { input.press('b'); game.loop.stepTicks(2); input.release('b'); continue; }
      if (b.rt) { b.rt.ax = b.rt.fx - 30; b.rt.ay = b.rt.fy; } // stay in range (foe beelines anyway)
      if (n % 12 === 0) { input.press('slot1'); } else { input.release('slot1'); }
    }
    let d = 0; while (ui.dlg && d++ < 80) pressA();
    out.rtBooted = b.rtMode === true;
    out.rtCompleted = game.scenes.top !== b;
    out.rtTicks = n;
  }

  // (7b) RT freeze-fix regression: forced-switch menu opens on an enabled row
  {
    st.party = [makeMon('partner', 20, SPECIES, MOVES), makeMon('pidgey', 20, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 3, SPECIES, MOVES), returnTo: ow, rt: true });
    game.scenes.push(b); b.enter();
    let n = 0; while (!b.rt && n++ < 600) { game.loop.stepTicks(2); if (b.msgOpen) pressA(); }
    b.ally.hp = 0;
    b.rtCheckFaints();
    out.rtForcedMenuOpen = ui.menuOpen === true && ui.menu && ui.menu.title === 'Choose next Pokemon';
    out.rtForcedRowEnabled = !!(ui.menu && ui.menu.items[ui.menu.idx] && !ui.menu.items[ui.menu.idx].disabled);
    if (ui.menuOpen) ui.cancelMenu();
    game.scenes.pop();
  }
  st.settings.battleStyle = 'classic';

  console.log('BM-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('BM-RESULT')) || 'BM-RESULT {}').slice(10));

ok('B01 bundle default settings are classic + set', res.defaultStyleInBundle === 'classic' && res.defaultSwitchInBundle === 'set', JSON.stringify(res));
ok('B02 classic wild battle boots turn-based and completes', res.wildRtMode === false && res.wildCompleted === true && res.wildPrompts === 0, JSON.stringify(res));
ok('B03 SET trainer battle: zero switch prompts, completes', res.setCompleted === true && res.setPrompts === 0, JSON.stringify(res));
ok('B04 SHIFT+No: prompt fires exactly once for the one non-final KO, ally kept, completes',
  res.shiftNoCompleted === true && res.shiftNoPrompts === 1 && res.shiftNoAllyKept === true, JSON.stringify(res));
ok('B05 SHIFT+Yes: prompt once, switch lands, participants = incoming-foe pool (reserve only)',
  res.shiftYesCompleted === true && res.shiftYesPrompts === 1 && !!res.shiftYesSnap
  && res.shiftYesSnap.allyIsReserve === true && res.shiftYesSnap.partsHasReserve === true && res.shiftYesSnap.partsHasLead === false,
  JSON.stringify(res.shiftYesSnap));
ok('B06 SHIFT XP: KO\'d foe XP went to the lead who faced it; the switched-in reserve got none of it',
  !!res.shiftYesSnap && res.shiftYesSnap.leadXp > res.shiftYesLeadXp0 && res.shiftYesSnap.reserveXp === res.shiftYesReserveXp0,
  JSON.stringify(res.shiftYesSnap) + ' lead0=' + res.shiftYesLeadXp0 + ' res0=' + res.shiftYesReserveXp0);
ok('B07 RT selectable: RT battle boots (rtMode) and completes', res.rtBooted === true && res.rtCompleted === true, JSON.stringify(res));
ok('B08 RT forced-switch menu opens on an enabled row (freeze-fix regression)',
  res.rtForcedMenuOpen === true && res.rtForcedRowEnabled === true, JSON.stringify(res));

// ================= Part C: P0 stuck-HP regressions (owner report 2026-10-28) =================
// "Foe at 30 HP, my damage is 20, I attack twice and it gets stuck at
// 10 HP and never loses more health." The hunt (full trace in
// docs/audit-register.md): the standard damage paths in both engines
// were proven clean; the defects below each reproduce a member of the
// reported family and are pinned here.
const p0Driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const input = game.input, ui = game.ui, st = game.state;
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const pressA = () => { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(2); };
  const drain = (b) => { let n = 0; while (b.msgOpen && n++ < 30) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } };
  game.rng.battle = () => 0.5; // deterministic: acc/crit/random all mid

  // (C1/C2) Fixed-20 in BOTH engines: Lv20 Seismic Toss (fixedLevel)
  // vs a 30-maxHP foe — hit 1 -> 10 HP, hit 2 -> faint.
  {
    const ally = makeMon('machop', 20, SPECIES, MOVES);
    ally.moves = [{ id: 'seismictoss', pp: 99, maxPp: 99 }];
    const foe = makeMon('rattata', 12, SPECIES, MOVES); foe.maxHp = 30; foe.hp = 30;
    st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    const hit = () => { const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.seismictoss, action: { type: 'move', idx: 0 } }; b.execMoveContinue(e); drain(b); };
    hit(); out.cClassicAfter1 = foe.hp;
    hit(); out.cClassicAfter2 = foe.hp; out.cClassicState = b.state;
    game.scenes.pop();
  }
  {
    const ally = makeMon('machop', 20, SPECIES, MOVES);
    ally.moves = [{ id: 'seismictoss', pp: 99, maxPp: 99 }];
    const foe = makeMon('rattata', 12, SPECIES, MOVES); foe.maxHp = 30; foe.hp = 30;
    st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: true });
    game.scenes.push(b); b.enter(); drain(b);
    b.rtApplyDamage('ally', MOVES.seismictoss); out.cRtAfter1 = foe.hp;
    b.rtApplyDamage('ally', MOVES.seismictoss); out.cRtAfter2 = foe.hp;
    game.scenes.pop();
  }

  // (C3) Standard path trace: repeated Quick Attacks strictly reduce HP to a faint.
  {
    const ally = makeMon('partner', 20, SPECIES, MOVES);
    ally.moves = [{ id: 'quickattack', pp: 99, maxPp: 99 }];
    const foe = makeMon('rattata', 12, SPECIES, MOVES); foe.maxHp = 30; foe.hp = 30;
    st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    const trace = [foe.hp];
    for (let i = 0; i < 6 && foe.hp > 0; i++) {
      const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.quickattack, action: { type: 'move', idx: 0 } };
      b.execMoveContinue(e); drain(b); trace.push(foe.hp);
    }
    out.cStdTrace = trace;
    game.scenes.pop();
  }

  // (C4) Tutorial endure: foe clamps at 1 HP on EVERY lethal hit AND the
  // catch hint repeats every time (pre-fix the hint showed only once).
  {
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const foe = makeMon('rattata', 3, SPECIES, MOVES);
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false, tutorial: true });
    game.scenes.push(b); b.enter();
    const hints = [];
    const origSay = b.say.bind(b);
    b.say = (t, cb) => { if (typeof t === 'string' && t.includes('hung on with 1 HP')) hints.push(t); origSay(t, cb); };
    drain(b);
    const ally = b.ally;
    for (let i = 0; i < 2; i++) {
      foe.hp = 5; // weakened, one hit from KO each time
      const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.thundershock, action: { type: 'move', idx: 0 } };
      b.execMoveContinue(e); drain(b);
    }
    b.say = origSay;
    out.cTutFoeHp = foe.hp; out.cTutHints = hints.length;
    game.scenes.pop();
  }

  // (C5) RT lunge whiff: physical move fired from 200px with the foe
  // pinned away — the lunge ends with NO damage (geometry, unchanged)
  // but the player is now TOLD (pre-fix: total silence).
  {
    const runner = makeMon('partner', 20, SPECIES, MOVES);
    runner.moves = [{ id: 'tackle', pp: 99, maxPp: 99 }]; // physical: the lunge path
    st.party = [runner];
    const foe = makeMon('rattata', 12, SPECIES, MOVES); foe.maxHp = 30; foe.hp = 30;
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: true });
    game.scenes.push(b); b.enter();
    let n = 0; while (!b.rt && n++ < 600) { game.loop.stepTicks(2); if (b.msgOpen) pressA(); }
    b.rt.ax = 60; b.rt.ay = 200; b.rt.fx = 260; b.rt.fy = 200;
    b.rtFloatText = null;
    b.rtUseMove('ally', 0); // slot 1: Tackle (physical lunge)
    for (let i = 0; i < 8 && b.rt.lunge; i++) { b.rt.fx = 260; b.rt.fy = 200; b.rtUpdateLunge(40); }
    out.cWhiffFloat = b.rtFloatText; out.cWhiffFoeHp = foe.hp;
    game.scenes.pop();
  }

  console.log('P0-RESULT ' + JSON.stringify(out));
})();`;
{
  const logs2 = [];
  const origLog2 = console.log;
  console.log = (...a) => { logs2.push(a.join(' ')); };
  try { eval(gameJs + p0Driver); } finally { console.log = origLog2; }
  const r = JSON.parse((logs2.find((l) => l.startsWith('P0-RESULT')) || 'P0-RESULT {}').slice(10));
  ok('C01 P0 classic fixed-20: hit 1 leaves the 30-HP foe at exactly 10', r.cClassicAfter1 === 10, JSON.stringify(r));
  ok('C02 P0 classic fixed-20: hit 2 faints the foe (no stuck-at-10)', r.cClassicAfter2 === 0 && (r.cClassicState === 'xp' || r.cClassicState === 'victory'), JSON.stringify(r));
  ok('C03 P0 RT fixed-20: 30 -> 10 -> faint, same as classic', r.cRtAfter1 === 10 && r.cRtAfter2 === 0, JSON.stringify(r));
  ok('C04 P0 standard path: HP strictly decreases every hit until the faint',
    Array.isArray(r.cStdTrace) && r.cStdTrace[r.cStdTrace.length - 1] === 0
    && r.cStdTrace.every((v, i) => i === 0 || v < r.cStdTrace[i - 1]), JSON.stringify(r.cStdTrace));
  ok('C05 P0 tutorial endure: foe holds at 1 HP and the catch hint repeats on every endured KO',
    r.cTutFoeHp === 1 && r.cTutHints === 2, JSON.stringify(r));
  ok('C06 P0 RT lunge whiff from range: no damage, but the player is told "Too far away!"',
    r.cWhiffFoeHp === 30 && r.cWhiffFloat === 'Too far away!', JSON.stringify(r));
}

console.log('battle-model-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
