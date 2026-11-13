// audit-headless.mjs — War Room "Platinum Perfection" audit, headless half.
// Unit-level proofs for the audit fix wave that are impractical to stage in
// a browser: S-12 (forced faint switch), S-13 (sticky command root),
// S-14 (battle medicine), S-43 (RT balls vs trainers).
// Run: node tests/audit-headless.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 4242;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  game.state.settings.battleStyle = 'classic';
  const input = game.input, ui = game.ui, st = game.state;
  st.party = [makeMon('partner', 20, SPECIES, MOVES), makeMon('pidgey', 10, SPECIES, MOVES)];
  const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
  // Battle text runs on the battle's own msgOpen lane (not ui.dlg).
  const drainSay = (b) => { let n = 0; while (((b && b.msgOpen) || ui.dlg) && n++ < 60) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); game.loop.stepTicks(2); } };

  // ---------- S-14: battle medicine applicability ----------
  st.bag.superpotion = 2; st.bag.revive = 1; st.bag.fullrestore = 1;
  const foe1 = makeMon('rattata', 3, SPECIES, MOVES);
  const b1 = new BattleScene({ kind: 'wild', foe: foe1, returnTo: ow, rt: false }); // classic chassis (opts.rt, as the overworld passes it)
  game.scenes.push(b1);
  const meds = b1.battleMedicineIds();
  out.medsHasSuper = meds.includes('superpotion');
  out.medsHasRevive = meds.includes('revive');
  const healthy = makeMon('pidgey', 10, SPECIES, MOVES);
  const fainted = makeMon('pidgey', 10, SPECIES, MOVES); fainted.hp = 0;
  const hurt = makeMon('pidgey', 10, SPECIES, MOVES); hurt.hp = 5;
  const hurtStatused = makeMon('pidgey', 10, SPECIES, MOVES); hurtStatused.hp = hurtStatused.maxHp; hurtStatused.status = 'poison';
  out.reviveOnHealthyDisabled = b1.medicineDisabledFor(ITEMS.revive, healthy) === true;
  out.reviveOnFaintedEnabled = b1.medicineDisabledFor(ITEMS.revive, fainted) === false;
  out.potionOnFaintedDisabled = b1.medicineDisabledFor(ITEMS.potion, healthy) === true && b1.medicineDisabledFor(ITEMS.potion, hurt) === false;
  out.fullRestoreFullHpStatusedEnabled = b1.medicineDisabledFor(ITEMS.fullrestore, hurtStatused) === false;
  const before = hurt.hp;
  const line = b1.applyMedicineTo('superpotion', hurt, null);
  out.superHeals50 = hurt.hp === Math.min(hurt.maxHp, before + 50) && line.includes('recovered');

  // ---------- S-13: B at the classic command root is swallowed ----------
  // Drive to command state (intro dialogue first).
  let guard = 0;
  while (b1.state !== 'command' && guard++ < 600) { game.loop.stepTicks(2); if (b1.msgOpen || ui.dlg) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); } }
  out.reachedCommand = b1.state === 'command' && ui.menuOpen && ui.menu.kind === 'commands';
  out.rootIsSticky = ui.menu && ui.menu.stickyCancel === true;
  input.inject('b'); ui.update(0.016); input.release('b');
  out.bAtRootKeepsGrid = ui.menuOpen && ui.menu.kind === 'commands';

  // ---------- S-12: forced faint switch cannot be backed out of ----------
  st.party = [makeMon('rattata', 3, SPECIES, MOVES), makeMon('pidgey', 10, SPECIES, MOVES)];
  b1.ally = st.party[0];
  b1.openPartyMenu(true);
  out.faintMenuTitle = ui.menu && ui.menu.title;
  out.faintMenuHasNoBack = ui.menu && !ui.menu.items.some((it) => it.label === 'Back');
  ui.cancelMenu(); // what B/Esc does in update()
  out.cancelReopensFaintMenu = ui.menuOpen && ui.menu.title === 'Choose next Kin'; // W1 resync: faint menu title renamed in the KIN branding sweep (battle.mjs:804)
  // Choosing the reserve completes the switch and returns to command.
  ui.debugChoose(1);
  drainSay(b1);
  guard = 0;
  while (b1.state !== 'command' && guard++ < 300) { game.loop.stepTicks(2); if (b1.msgOpen || ui.dlg) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); } }
  out.switchCompleted = b1.ally === st.party[1] && b1.state === 'command';

  // ---------- S-43: RT bag disables balls vs trainers ----------
  const b2 = new BattleScene({ kind: 'wild', foe: makeMon('rattata', 3, SPECIES, MOVES), returnTo: ow });
  game.scenes.push(b2);
  b2.kind = 'trainer';
  b2.rtBagMenu();
  const ballRow = ui.menu && ui.menu.items.find((it) => it.value === 'pokeball');
  out.rtBallDisabledVsTrainer = !!ballRow && ballRow.disabled === true;
  const medRow = ui.menu && ui.menu.items.find((it) => it.value === 'superpotion');
  out.rtBagHasMedicine = !!medRow;
  ui.cancelMenu();
  b2.kind = 'wild';
  b2.rtBagMenu();
  const ballRow2 = ui.menu && ui.menu.items.find((it) => it.value === 'pokeball');
  out.rtBallEnabledVsWild = !!ballRow2 && ballRow2.disabled === false;
  ui.cancelMenu();

  console.log('AUDIT-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('AUDIT-RESULT')) || 'AUDIT-RESULT {}').slice(13));

ok('S-14 battle bag stocks Super Potion when owned', res.medsHasSuper === true);
ok('S-14 battle bag stocks Revive when owned', res.medsHasRevive === true);
ok('S-14 Revive disabled on a healthy mon', res.reviveOnHealthyDisabled === true);
ok('S-14 Revive enabled on a fainted mon', res.reviveOnFaintedEnabled === true);
ok('S-14 Potion disabled at full HP, enabled when hurt', res.potionOnFaintedDisabled === true);
ok('S-14 Full Restore usable at full HP when statused', res.fullRestoreFullHpStatusedEnabled === true);
ok('S-14 Super Potion heals 50 via the shared apply path', res.superHeals50 === true);
ok('S-13 battle reaches the command root', res.reachedCommand === true, JSON.stringify(res));
ok('S-13 classic command root is sticky', res.rootIsSticky === true);
ok('S-13 B at the root keeps the command grid', res.bAtRootKeepsGrid === true);
ok('S-12 faint menu is the forced choice', res.faintMenuTitle === 'Choose next Kin', String(res.faintMenuTitle)); // W1 resync: title renamed (battle.mjs:804)
ok('S-12 faint menu offers no Back row', res.faintMenuHasNoBack === true);
ok('S-12 B/cancel re-opens the forced choice (no strand)', res.cancelReopensFaintMenu === true);
ok('S-12 choosing the reserve completes the switch to command', res.switchCompleted === true);
ok('S-43 RT bag disables balls vs a trainer', res.rtBallDisabledVsTrainer === true);
ok('S-43 RT bag carries medicine', res.rtBagHasMedicine === true);
ok('S-43 RT bag enables balls vs a wild mon', res.rtBallEnabledVsWild === true);

console.log('audit-headless: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
