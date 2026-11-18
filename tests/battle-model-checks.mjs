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
        if (m.title === 'Will you change Kin?') { // W1 resync: SHIFT prompt renamed in the KIN branding sweep (battle.mjs:1834)
          const idx = m.items.findIndex((it) => it.value === (opts.shift === 'yes' ? 'yes' : 'no'));
          ui.debugChoose(idx >= 0 ? idx : 0); game.loop.stepTicks(2); continue;
        }
        if (m.title === 'Choose a Kin') { // Shift voluntary party menu (W1 resync: title renamed, battle.mjs:1855)
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
        if (m.title === 'Choose next Kin') { // W1 resync: faint menu title renamed (battle.mjs:804)
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
    out.rtForcedMenuOpen = ui.menuOpen === true && ui.menu && ui.menu.title === 'Choose next Kin'; // W1 resync: faint menu title renamed (battle.mjs:804)
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
    // settle(): messages drain via callbacks; WP3 presentation beats
    // (hitstop/faint beat) drain via real ticks — real play has both.
    const settle = () => { for (let i = 0; i < 400; i++) { if (b.msgOpen) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } else if (b._beat) game.loop.stepTicks(2); else break; } };
    const hit = () => { const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.seismictoss, action: { type: 'move', idx: 0 } }; b.execMoveContinue(e); settle(); };
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
    const settleT = () => { for (let i = 0; i < 400; i++) { if (b.msgOpen) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } else if (b._beat) game.loop.stepTicks(2); else break; } };
    for (let i = 0; i < 2; i++) {
      foe.hp = 5; // weakened, one hit from KO each time
      const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.thundershock, action: { type: 'move', idx: 0 } };
      b.execMoveContinue(e); settleT();
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

// ================= Part D: WP3 presentation elevations =================
const wp3Driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const input = game.input, ui = game.ui, st = game.state;
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const drain = (b) => { let n = 0; while (b.msgOpen && n++ < 30) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } };
  game.rng.battle = () => 0.5;

  // (D01/D04) Hitstop + trauma on impact: damage applies immediately;
  // the damage LINE opens with a 70ms dismissal hold armed; a press
  // during the hold is remembered (not eaten) and fires at expiry.
  {
    const ally = makeMon('partner', 20, SPECIES, MOVES);
    const foe = makeMon('pidgey', 12, SPECIES, MOVES); foe.maxHp = 60; foe.hp = 60;
    st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    ui.menu = null; // real flow picks the move from the grid, closing it first
    const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.thundershock, action: { type: 'move', idx: 0 } };
    b.execMoveContinue(e); // says "used Thunder Shock!"
    // dismiss the use/effectiveness lines only — stop AT the damage line
    let dn = 0;
    while (b.msgOpen && !(typeof b.msg === 'string' && b.msg.includes('took')) && dn++ < 10) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); }
    out.dDmgLine = b.msg;
    out.dFoeHpAfterHit = foe.hp;
    out.dHoldMs = b._msgHoldUntil - (b._clockMs || 0);
    out.dMsgOpenDuringHold = b.msgOpen; out.dTrauma = b.trauma;
    // press DURING the hold: remembered, line survives the press...
    input.inject('a'); game.loop.stepTicks(2); input.release('a');
    out.dSurvivesEarlyPress = b.msgOpen && b.msg === out.dDmgLine;
    // ...and dismisses on its own once the hold expires (msgOpen is
    // the signal — b.msg retains the last line's text at command).
    for (let i = 0; i < 8 && b.msgOpen; i++) game.loop.stepTicks(2);
    out.dDismissedAfterExpiry = !b.msgOpen;
    game.scenes.pop();
  }

  // (D02) Set faint beat: the faint LINE carries a 450ms dismissal
  // hold; the chain itself is synchronous (afterFaintFoe on dismiss).
  {
    const ally = makeMon('partner', 20, SPECIES, MOVES);
    ally.moves = [{ id: 'quickattack', pp: 99, maxPp: 99 }];
    const foe = makeMon('rattata', 5, SPECIES, MOVES); foe.hp = 1;
    st.party = [ally];
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    const e = { side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.quickattack, action: { type: 'move', idx: 0 } };
    b.execMoveContinue(e);
    // drain until the faint line is the open message, then read its hold
    let n = 0;
    while (b.msgOpen && !(typeof b.msg === 'string' && b.msg.includes('fainted!')) && n++ < 30) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); }
    out.dFaintHoldMs = b._msgHoldUntil - (b._clockMs || 0);
    drain(b); // faint line dismissed -> afterFaintFoe -> XP flow
    out.dAfterFaintState = b.state;
    game.scenes.pop();
  }

  // (D03) Ground readout: SELECT at the command grid on a pinned
  // Storm Ground opens a dialogue naming the Ground + exact factors,
  // and closing it returns to the command grid.
  {
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const foe = makeMon('rattata', 10, SPECIES, MOVES);
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false, ground: 'storm' });
    game.scenes.push(b); b.enter();
    let n = 0;
    while (b.state !== 'command' && n++ < 300) { game.loop.stepTicks(2); if (b.msgOpen) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(2); } }
    out.dReachedCommand = b.state;
    input.inject('select'); game.loop.stepTicks(2); input.release('select'); game.loop.stepTicks(2);
    out.dDlgOpen = !!ui.dlg;
    out.dDlgText = ui.dlg && ui.dlg.lines ? ui.dlg.lines.join(' | ') : '';
    let m = 0;
    while (ui.dlg && m++ < 60) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(3); }
    out.dBackToMenu = !ui.dlg && !!ui.menu && b.state === 'command';
    game.scenes.pop();
  }

  // (D05) HP-drain cap: a 300-point gap converges within ~0.7s of
  // ticks (the uncapped 90 HP/s rate would need ~3.3s).
  {
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const foe = makeMon('rattata', 10, SPECIES, MOVES);
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); drain(b);
    for (let i = 0; i < 5; i++) game.loop.stepTicks(1); // drain bookkeeping initializes at the natural HP
    b.foe.maxHp = 300; b.foe.hp = 0; b.hpAnim.foe = 300; // a 300-point hit lands
    for (let i = 0; i < 45; i++) game.loop.stepTicks(1);
    out.dDrainAfter = b.hpAnim.foe;
    game.scenes.pop();
  }

  console.log('WP3-RESULT ' + JSON.stringify(out));
})();`;
{
  const logs3 = [];
  const origLog3 = console.log;
  console.log = (...a) => { logs3.push(a.join(' ')); };
  try { eval(gameJs + wp3Driver); } finally { console.log = origLog3; }
  const r = JSON.parse((logs3.find((l) => l.startsWith('WP3-RESULT')) || 'WP3-RESULT {}').slice(11));
  ok('D01 WP3 hitstop: damage applies at once; the damage line carries a 70ms hold; an early press is remembered, not eaten',
    typeof r.dDmgLine === 'string' && r.dDmgLine.includes('took') && r.dFoeHpAfterHit < 60 && r.dHoldMs === 70 && r.dMsgOpenDuringHold === true && r.dSurvivesEarlyPress === true && r.dDismissedAfterExpiry === true, JSON.stringify(r));
  ok('D02 WP3 Set faint beat: the faint line carries a 450ms hold; dismissal runs the normal flow',
    r.dFaintHoldMs === 450 && r.dAfterFaintState === 'xp', JSON.stringify(r));
  ok('D03 WP3 trauma: a super-effective hit sets trauma >= 0.5 at impact',
    typeof r.dTrauma === 'number' && r.dTrauma >= 0.5, JSON.stringify(r));
  ok('D04 WP3 Ground readout: SELECT opens the Storm Ground readout, close returns to the grid',
    r.dReachedCommand === 'command' && r.dDlgOpen === true && /Storm Ground/.test(r.dDlgText) && /x1\.2/.test(r.dDlgText) && r.dBackToMenu === true, JSON.stringify(r));
  ok('D05 WP3 drain cap: a 300-point HP gap converges within 45 ticks',
    r.dDrainAfter === 0, JSON.stringify(r));
}

// ================= Part E: P1 Center-exit anchor (owner report 2026-10-28) =================
// "When I got defeated after leaving Pallet Town, I was sent to the
// health center, and when I got OUT I was right where I was defeated."
// Root cause: loadMap('center') overwrote centerReturn with the
// _lastCity load-time snapshot. Fix: warp via owns the anchor, it is
// persisted as story.lastCenter, blackout paths anchor through
// centerExit(), and loadMap never touches the ticket.
// NEAREST-CENTER RESYNC (owner rule, 2026-11-17): a blackout now
// respawns at the NEAREST Center town from the faint map
// (blackoutCenterAnchor — directed warp-graph BFS), not the
// last-visited lineage. E02's expectation changed accordingly (a
// mid-Route-1 faint is nearer Fernmere than Dawnwick); the P1
// invariant it exists to pin — never back at the faint location —
// is unchanged. E05 is preserved by the resolver's tie rule: a
// last-Center town among the nearest keeps its exact anchor.
const p1Driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const input = game.input, ui = game.ui, st = game.state;
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const pressA = () => { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(2); };
  const drainDlg = () => { let n = 0; while (ui.dlg && n++ < 80) pressA(); };
  // J6.5: since Premium+ W7 (TX-6) a stepped warp lands at its fade
  // midpoint, not synchronously — settle the transition before
  // reading the landing (the same hold-to-poll conversion W7 applied
  // to verify-slice; every assertion below is unchanged).
  const settleWarp = (scene) => { let n = 0; while (scene.warpFx && n++ < 20) scene.updateWarpFx(0.05); };
  const stepOn = (scene, x, y) => { scene.player.tx = x; scene.player.ty = y; scene.onStep(x, y); settleWarp(scene); };
  const exitCenter = (scene) => stepOn(scene, 4, 5); // the center's exit warp tile

  // (E1) OWNER SCENARIO: fresh game -> leave Pallet -> battle defeat on
  // Route 1 -> blackout Center -> exit must land at the NEAREST Center
  // town (Fernmere from mid-Route 1), never back on route1.
  {
    ow.loadMap('pallet'); ow.player.tx = 7; ow.player.ty = 7;
    ow.loadMap('route1'); // the old bug's anchor snapshot is now route1
    st.party = [makeMon('partner', 5, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 5, SPECIES, MOVES), returnTo: ow, rt: false });
    game.scenes.push(b);
    b.finishDefeat(); drainDlg();
    out.e1InCenter = ow.mapId;
    exitCenter(ow);
    out.e1Exit = { map: ow.mapId, x: ow.player.tx, y: ow.player.ty };
    game.scenes.pop();
  }

  // (E2) Voluntary Viridian visit round-trips to the door-front (7,8);
  // then a route blackout (systems path) respawns and exits VIRIDIAN.
  // W1 resync: rebuilt Fernmere's Center doors are (6,7)/(7,7) with via
  // (6,8)/(7,8) in maps3 — the pre-rebuild door (7,5) no longer exists.
  {
    ow.loadMap('viridian'); stepOn(ow, 7, 7); // step on the Center door
    out.e2Entered = ow.mapId; out.e2Anchor = st.story.lastCenter;
    exitCenter(ow);
    out.e2VoluntaryExit = { map: ow.mapId, x: ow.player.tx, y: ow.player.ty };
    ow.loadMap('route2');
    ow.blackout(); drainDlg();
    out.e2BlackoutInCenter = ow.mapId;
    exitCenter(ow);
    out.e2BlackoutExit = { map: ow.mapId, x: ow.player.tx, y: ow.player.ty };
  }

  // (E3) Fuchsia + Cinnabar exits re-verified (the register's old
  // roof-tile quirk towns): step on the town's Center door, exit lands
  // on its door-front. W1 resync: Caldera's Center doors moved to
  // (3,10)/(4,10) via (3,11)/(4,11) in the T11 rebuild (maps3 cinnabar);
  // Fuchsia's (7,7) via (7,8) is unchanged.
  for (const [town, dx, dy] of [['fuchsia', 7, 7], ['cinnabar', 3, 10]]) {
    ow.loadMap(town); stepOn(ow, dx, dy);
    const inC = ow.mapId;
    exitCenter(ow);
    out['e3_' + town] = { inC, map: ow.mapId, x: ow.player.tx, y: ow.player.ty };
  }

  // (E4) RELOAD inside a Center: a fresh OverworldScene has NO runtime
  // ticket; the persisted story.lastCenter alone must anchor the exit.
  {
    // A reloaded game: the save says "inside the Center" (that is
    // where a blackout leaves story.position); a brand-new scene has
    // no runtime ticket at all.
    st.story.position = { map: 'center', x: 4, y: 5, dir: 'down' };
    const ow2 = new OverworldScene(); game.scenes.push(ow2); ow2.enter();
    out.e4TicketGone = ow2.centerReturn === undefined || ow2.centerReturn === null;
    stepOn(ow2, 4, 5);
    out.e4ReloadExit = { map: ow2.mapId, x: ow2.player.tx, y: ow2.player.ty };
    game.scenes.pop();
  }

  console.log('P1-RESULT ' + JSON.stringify(out));
})();`;
{
  const logs4 = [];
  const origLog4 = console.log;
  console.log = (...a) => { logs4.push(a.join(' ')); };
  try { eval(gameJs + p1Driver); } finally { console.log = origLog4; }
  const r = JSON.parse((logs4.find((l) => l.startsWith('P1-RESULT')) || 'P1-RESULT {}').slice(10));
  ok('E01 P1 owner scenario: defeat on Route 1 blacks out to the Center', r.e1InCenter === 'center', JSON.stringify(r));
  // W1 resync: E03–E05 expect Fernmere's rebuilt door-front (7,8);
  // E06/E07 expect Caldera's rebuilt door-front (3,11). All values
  // read from maps3 / overworld.mjs, game untouched.
  // NEAREST-CENTER resync (2026-11-17): E02 expects Fernmere (7,8) —
  // from the driver's faint tile (route1, 7,7) Fernmere is the
  // nearest Center town (7 walking steps to its door path vs 8 to
  // Dawnwick's), where the old last-visited/home lineage landed
  // PALLET (6,9).
  ok('E02 P1 owner scenario: exiting lands in FERNMERE (7,8), the nearest Center town — never back on route1',
    r.e1Exit && r.e1Exit.map === 'viridian' && r.e1Exit.x === 7 && r.e1Exit.y === 8, JSON.stringify(r.e1Exit));
  ok('E03 P1 voluntary: Viridian Center door enters the Center and persists the door-front anchor',
    r.e2Entered === 'center' && r.e2Anchor && r.e2Anchor.map === 'viridian' && r.e2Anchor.x === 7 && r.e2Anchor.y === 8, JSON.stringify(r));
  ok('E04 P1 voluntary: exit returns to Viridian door-front (7,8)',
    r.e2VoluntaryExit && r.e2VoluntaryExit.map === 'viridian' && r.e2VoluntaryExit.x === 7 && r.e2VoluntaryExit.y === 8, JSON.stringify(r.e2VoluntaryExit));
  ok('E05 P1 blackout after visiting Viridian: exit lands Viridian door-front, not the route',
    r.e2BlackoutInCenter === 'center' && r.e2BlackoutExit && r.e2BlackoutExit.map === 'viridian' && r.e2BlackoutExit.x === 7 && r.e2BlackoutExit.y === 8, JSON.stringify(r));
  ok('E06 P1 Fuchsia + Cinnabar exits land on their door-fronts (Fuchsia 7,8 · Cinnabar 3,11)',
    r.e3_fuchsia && r.e3_fuchsia.map === 'fuchsia' && r.e3_fuchsia.x === 7 && r.e3_fuchsia.y === 8
    && r.e3_cinnabar && r.e3_cinnabar.map === 'cinnabar' && r.e3_cinnabar.x === 3 && r.e3_cinnabar.y === 11, JSON.stringify(r));
  ok('E07 P1 reload inside a Center: persisted anchor alone exits to the last-visited door-front (Cinnabar 3,11)',
    r.e4TicketGone === true && r.e4ReloadExit && r.e4ReloadExit.map === 'cinnabar' && r.e4ReloadExit.x === 3 && r.e4ReloadExit.y === 11, JSON.stringify(r));
}
// (E08) save-fill + server validator treat story.lastCenter soundly
{
  const s = defaultState();
  s.story.lastCenter = { map: 'viridian', x: 7, y: 6 };
  const m = migrate(JSON.parse(JSON.stringify(s)));
  ok('E08a P1 save-fill keeps a well-formed story.lastCenter', !!m.story.lastCenter && m.story.lastCenter.map === 'viridian' && m.story.lastCenter.x === 7, JSON.stringify(m.story.lastCenter));
  const junk = defaultState();
  junk.story.lastCenter = { map: 42, x: 'west' };
  const m2 = migrate(JSON.parse(JSON.stringify(junk)));
  ok('E08b P1 save-fill drops a malformed story.lastCenter', m2.story.lastCenter === undefined, JSON.stringify(m2.story.lastCenter));
  const payload = () => {
    const p = defaultState();
    p.player.name = 'ASH'; p.player.rivalName = 'GARY';
    p.party.push({ speciesId: 'partner', nickname: null, level: 12, xp: 1000, moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }], ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40 });
    return p;
  };
  const good = payload(); good.story.lastCenter = { map: 'viridian', x: 7, y: 6 };
  ok('E08c P1 validator accepts a well-formed story.lastCenter', serverValidate(good).ok === true, JSON.stringify(serverValidate(good).errors));
  const badP = payload(); badP.story.lastCenter = { map: 'viridian', x: 'west', y: 6 };
  const badRes = serverValidate(badP);
  ok('E08d P1 validator rejects a malformed story.lastCenter', badRes.ok === false && badRes.errors.includes('bad-lastCenter'), JSON.stringify(badRes.errors));
}

// ================= Part F: Shift edge gates =================
const edgeDriver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const input = game.input, ui = game.ui, st = game.state;
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  const pressKey = (k) => { input.inject(k); game.loop.stepTicks(2); input.release(k); game.loop.stepTicks(2); };
  const settle = (b) => { for (let i = 0; i < 500; i++) { if (b.msgOpen) { const cb = b.msgCb; b.msgCb = null; b.msgOpen = false; if (cb) cb(); else b.afterMsg(); } else break; } };
  const prompts = () => ui.log.filter((l) => l.ui === 'battle-msg' && typeof l.text === 'string' && l.text.includes('is about to send out')).length;
  game.rng.battle = () => 0.5;
  const killFoe = (b) => {
    b.foe.hp = 1;
    const ally = b.ally;
    ally.moves = [{ id: 'quickattack', pp: 99, maxPp: 99 }];
    b.execMoveContinue({ side: 'ally', mon: ally, stats: b.effStats(ally, b.allyStages), move: MOVES.quickattack, action: { type: 'move', idx: 0 } });
    settle(b);
  };
  const trainer2 = () => ({ id: 'edge_trainer', name: 'Edge', team: [{ species: 'rattata', level: 10 }, { species: 'pidgey', level: 10 }], reward: 100, intro: ['Edge intro.'], lose: ['Edge lose.'] });

  // (F01) SHIFT + solo party: no legal switch target -> NO prompt.
  {
    st.settings.switchMode = 'shift';
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'trainer', trainer: trainer2(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); settle(b);
    const before = prompts();
    killFoe(b);
    out.f1Prompts = prompts() - before; out.f1State = b.state;
    game.scenes.pop();
  }

  // (F02) SHIFT + Yes -> party menu -> BACK re-asks the prompt exactly
  // once more; answering No then sends the foe out.
  {
    st.settings.switchMode = 'shift';
    const lead = makeMon('partner', 20, SPECIES, MOVES);
    const reserve = makeMon('pidgey', 18, SPECIES, MOVES);
    st.party = [lead, reserve];
    const b = new BattleScene({ kind: 'trainer', trainer: trainer2(), returnTo: ow, rt: false });
    game.scenes.push(b); b.enter(); settle(b);
    ui.menu = null; // the move pick closes the grid in real flow
    const before = prompts();
    killFoe(b); // -> KO'd foe's XP first (animated: needs real ticks)...
    let wn = 0;
    while (wn++ < 600) { game.loop.stepTicks(2); settle(b); if (ui.menu && ui.menu.items.some((it) => it.label === 'Yes')) break; }
    out.f2PromptAfterKO = prompts() - before;
    const menu = ui.menu;
    out.f2MenuIsPrompt = !!menu && menu.items.some((it) => it.label === 'Yes') && menu.items.some((it) => it.label === 'No');
    const yesIdx = menu.items.findIndex((it) => it.label === 'Yes');
    ui.debugChoose(yesIdx); settle(b);
    out.f2PartyMenuOpen = !!ui.menu && ui.menu !== menu;
    pressKey('b'); settle(b); // back out of the party menu
    // Re-ask = the Yes/No menu is presented again; the prompt LINE
    // itself still fired exactly once for this KO (exactly-once rule).
    out.f2PromptsAfterBack = prompts() - before;
    out.f2ReaskMenu = !!ui.menu && ui.menu.items.some((it) => it.label === 'Yes') && ui.menu.items.some((it) => it.label === 'No');
    const menu2 = ui.menu;
    if (menu2 && menu2.items.some((it) => it.label === 'No')) { ui.debugChoose(menu2.items.findIndex((it) => it.label === 'No')); settle(b); }
    out.f2StateAfterNo = b.state;
    game.scenes.pop();
  }

  // (F03) RT + switchMode 'shift': RT flow unchanged — no prompt, the
  // next foe is simply sent (rtSendNextFoe path).
  {
    st.settings.switchMode = 'shift';
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'trainer', trainer: trainer2(), returnTo: ow, rt: true });
    game.scenes.push(b); b.enter(); settle(b);
    const before = prompts();
    b.foe.hp = 1;
    b.rtApplyDamage('ally', MOVES.thundershock); settle(b);
    // RT send-out is clock-driven; tick until the second foe is in.
    let n = 0; while (b.trainerIdx < 1 && n++ < 400) { game.loop.stepTicks(2); if (b.msgOpen) settle(b); }
    out.f3Prompts = prompts() - before; out.f3TrainerIdx = b.trainerIdx;
    game.scenes.pop();
  }

  // (F04) Tutorial + SHIFT settings: the gate stays shut.
  {
    st.settings.switchMode = 'shift';
    st.party = [makeMon('partner', 20, SPECIES, MOVES), makeMon('pidgey', 18, SPECIES, MOVES)];
    const b = new BattleScene({ kind: 'trainer', trainer: trainer2(), returnTo: ow, rt: false, tutorial: true });
    game.scenes.push(b); b.enter(); settle(b);
    out.f4Gate = b._shiftApplies();
    const before = prompts();
    killFoe(b);
    out.f4Prompts = prompts() - before;
    game.scenes.pop();
  }
  st.settings.switchMode = 'set';

  console.log('EDGE-RESULT ' + JSON.stringify(out));
})();`;
{
  const logs5 = [];
  const origLog5 = console.log;
  console.log = (...a) => { logs5.push(a.join(' ')); };
  try { eval(gameJs + edgeDriver); } finally { console.log = origLog5; }
  const r = JSON.parse((logs5.find((l) => l.startsWith('EDGE-RESULT')) || 'EDGE-RESULT {}').slice(12));
  ok('F01 SHIFT edge: solo party gets no prompt (no legal switch target)', r.f1Prompts === 0, JSON.stringify(r));
  ok('F02 SHIFT edge: Yes opens the party menu; Back re-presents the prompt menu (line still exactly once); No sends the foe out',
    r.f2PromptAfterKO === 1 && r.f2MenuIsPrompt === true && r.f2PartyMenuOpen === true && r.f2PromptsAfterBack === 1 && r.f2ReaskMenu === true && r.f2StateAfterNo === 'command', JSON.stringify(r));
  ok('F03 SHIFT edge: RT battles never prompt (flow unchanged)', r.f3Prompts === 0 && r.f3TrainerIdx === 1, JSON.stringify(r));
  ok('F04 SHIFT edge: tutorial battles never prompt', r.f4Gate === false && r.f4Prompts === 0, JSON.stringify(r));
}

console.log('battle-model-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
