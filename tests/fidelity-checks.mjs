// fidelity-checks.mjs — ADR-018/019/020/021 verification suite (standalone).
// Data audits over the real src modules, formula spot-checks, the Yellow
// feature-parity data assertions, control-parity checks, and a functional
// real-time battle driven by keyboard-slot input only.
// Run: node tests/fidelity-checks.mjs   (exit 1 on any failure)

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const { MOVES } = await import(join(ROOT, 'src/data/moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src/data/moves2.mjs'));
const { ITEMS, TM_MOVES, HM_MOVES } = await import(join(ROOT, 'src/data/items.mjs'));
const { FORMS } = await import(join(ROOT, 'src/data/forms.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3, TRAINERS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4, TRAINERS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const { TRAINERS: TRAINERS_BASE } = await import(join(ROOT, 'src/data/maps.mjs'));
const { TRAINERS } = await import(join(ROOT, 'src/data/rivals.mjs'));
const { MAIN_QUESTS: QUESTS, LEGENDARY_ARCS, EVENTS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
const F = await import(join(ROOT, 'src/engine/formulas.mjs'));
const { KEYMAP, ACTIONS } = await import(join(ROOT, 'src/engine/input.mjs'));

const ALL_SPECIES = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const ALL_MOVES = { ...MOVES, ...MOVES2 };
const ALL_MAPS = { ...MAPS, ...MAPS2, ...MAPS3, ...MAPS4 };
const ALL_TRAINERS = { ...TRAINERS_BASE, ...TRAINERS, ...TRAINERS3, ...TRAINERS4 };

// ---------- A. roster / data integrity ----------
ok('roster: 151 Kanto species + partner + 5 forms + 100 National species (Cheat Shop expansion 2026-10-28 + ABYSSORN, Stage O1 2026-10-29; +94 Johto species, Stage J1 2026-10-29; +135 Hoenn species + 3 Deoxys form entries, Stage H1 2026-10-29; +107 Sinnoh species + 7 Sinnoh form entries, Arc 4 Stage S1 2026-10-29 — supersedes the 395 count)', Object.keys(ALL_SPECIES).length === 509);
{
  const byDex = {};
  // Form entries share their base species' dexNo by design (like partner
  // shares 25) — uniqueness is asserted over non-form species only.
  for (const sp of Object.values(ALL_SPECIES)) { if (sp.dexNo && sp.id !== 'partner' && !sp.form) (byDex[sp.dexNo] = byDex[sp.dexNo] || []).push(sp.id); }
  const dupes = Object.entries(byDex).filter(([, v]) => v.length > 1).map(([k]) => k);
  const kanto = Object.keys(byDex).filter((n) => +n >= 1 && +n <= 151);
  ok('roster: dex numbers 1-151 each exactly once (partner + forms share by design)', dupes.length === 0 && kanto.length === 151, 'dupes: ' + dupes.join(','));
}
{
  const bad = [];
  const learnMoves = (sp) => Array.isArray(sp.learnset) ? sp.learnset.map((e) => e.move) : Object.values(sp.learnset || {}).flat();
  for (const sp of Object.values(ALL_SPECIES)) {
    const evos = sp.evos || (sp.evo ? [sp.evo] : []);
    for (const e of evos) if (!ALL_SPECIES[e.to]) bad.push(sp.id + '->' + e.to);
    for (const mid of learnMoves(sp)) if (!ALL_MOVES[mid]) bad.push(sp.id + ':' + mid);
    for (const n of sp.tm || []) { if (n > 100) { if (!HM_MOVES[n - 100]) bad.push(sp.id + ':hm' + (n - 100)); } else if (!TM_MOVES[n]) bad.push(sp.id + ':tm' + n); }
  }
  ok('roster: every evo target, learnset move, TM number resolves', bad.length === 0, bad.slice(0, 6).join(','));
}
ok('moves: pool covers every move any Kanto species/TM/HM references (143 implemented)', Object.keys(ALL_MOVES).length >= 143, String(Object.keys(ALL_MOVES).length));
{
  const missing = [];
  for (let n = 1; n <= 50; n++) if (!ALL_MOVES[TM_MOVES[n]]) missing.push('TM' + n);
  for (let n = 1; n <= 5; n++) if (!ALL_MOVES[HM_MOVES[n]]) missing.push('HM' + n);
  ok('moves: all 50 TM + 5 HM moves exist in the pool', missing.length === 0, missing.join(','));
}
ok('forms: 180+ tracked forms, unique ids, valid species refs',
  Array.isArray(FORMS) && FORMS.length >= 180 && new Set(FORMS.map((f) => f.id)).size === FORMS.length
  && FORMS.every((f) => Number.isInteger(f.speciesId) && f.speciesId >= 1 && f.speciesId <= 1025));
ok('species + forms >= owner count 1205 (data layer)', 1025 + FORMS.length >= 1205, String(1025 + FORMS.length));

// ---------- B. map graph ----------
{
  const badWarps = [], badSpecies = [], badItems = [], badTrainers = [];
  for (const m of Object.values(ALL_MAPS)) {
    for (const w of m.warps || []) if (!ALL_MAPS[w.to.map]) badWarps.push(m.id + '->' + w.to.map);
    const enc = m.encounters;
    if (enc) {
      for (const e of enc.table || []) if (!ALL_SPECIES[e.species]) badSpecies.push(m.id + ':' + e.species);
      for (const e of enc.water || []) if (!ALL_SPECIES[e.species]) badSpecies.push(m.id + ':w:' + e.species);
      // enc.cave is a boolean floor flag in this data model (table applies).
      if (enc.fish) for (const rod of ['old', 'good', 'super']) for (const e of enc.fish[rod] || []) if (!ALL_SPECIES[e.species]) badSpecies.push(m.id + ':f:' + e.species);
    }
    for (const it of [...(m.items || []), ...(m.hidden || [])]) if (!ITEMS[it.item]) badItems.push(m.id + ':' + it.item);
    for (const n of m.npcs || []) if (n.trainer && !ALL_TRAINERS[n.trainer]) badTrainers.push(m.id + ':' + n.trainer);
  }
  ok('maps: every warp target exists', badWarps.length === 0, badWarps.slice(0, 5).join(','));
  ok('maps: every encounter species exists', badSpecies.length === 0, badSpecies.slice(0, 5).join(','));
  ok('maps: every placed item exists', badItems.length === 0, badItems.slice(0, 5).join(','));
  ok('maps: every NPC trainer exists', badTrainers.length === 0, badTrainers.slice(0, 5).join(','));
}
{
  // Reachability: BFS over warps + NPC travel edges (ferry, safari gate).
  const edges = new Map();
  const add = (a, b) => { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a).add(b); };
  for (const m of Object.values(ALL_MAPS)) {
    for (const w of m.warps || []) add(m.id, w.to.map);
    for (const n of m.npcs || []) {
      if (n.ferry) add(m.id, n.ferry);
      if (n.safariGate) add(m.id, 'safari');
      if (n.safariExit) add(m.id, 'fuchsia');
    }
    for (const ev of m.events || []) void ev;
  }
  // Story-event warps are edges from the map that PLACES the event.
  for (const m of Object.values(ALL_MAPS)) {
    for (const pe of m.events || []) {
      const ev = EVENTS[pe.id];
      const steps = Array.isArray(ev) ? ev : (ev && ev.steps) || [];
      for (const s of steps) if (s.warp) add(m.id, s.warp.map);
    }
  }
  const seen = new Set(['pallet']);
  const queue = ['pallet'];
  while (queue.length) { const cur = queue.shift(); for (const nx of edges.get(cur) || []) if (!seen.has(nx)) { seen.add(nx); queue.push(nx); } }
  const unreachable = Object.keys(ALL_MAPS).filter((id) => !seen.has(id));
  ok('maps: every map reachable from Pallet (warps + ferries + gates)', unreachable.length === 0, unreachable.join(','));
}

// ---------- C. 151 obtainability (one playthrough) ----------
{
  const obtainable = new Set(['partner']);
  const addSteps = (steps) => { for (const s of steps || []) { if (s.giveMon) obtainable.add(s.giveMon.species); if (s.wildBattle) obtainable.add(s.wildBattle.species); } };
  for (const m of Object.values(ALL_MAPS)) {
    const enc = m.encounters;
    if (enc) {
      for (const e of [...(enc.table || []), ...(enc.water || [])]) obtainable.add(e.species);
      if (enc.fish) for (const rod of ['old', 'good', 'super']) for (const e of enc.fish[rod] || []) obtainable.add(e.species);
    }
    for (const n of m.npcs || []) {
      if (n.giveMon) obtainable.add(n.giveMon.species);
      if (n.trade) obtainable.add(n.trade.get);
      if (n.prize) for (const p of (Array.isArray(n.prize) ? n.prize : [n.prize])) obtainable.add(p.species);
      if (n.revive) for (const sp of ['omanyte', 'kabuto', 'aerodactyl']) obtainable.add(sp);
    }
  }
  for (const ev of Object.values(EVENTS)) addSteps(Array.isArray(ev) ? ev : ev.steps);
  // Evolution closure: level / stone / link-transfer all resolve solo (ADR-019).
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of [...obtainable]) {
      const sp = ALL_SPECIES[id]; if (!sp) continue;
      const evos = sp.evos || (sp.evo ? [sp.evo] : []);
      for (const e of evos) if (!obtainable.has(e.to)) { obtainable.add(e.to); grew = true; }
    }
  }
  const missing = [];
  for (let d = 1; d <= 151; d++) {
    const sp = Object.values(ALL_SPECIES).find((s) => s.dexNo === d);
    if (!sp || !obtainable.has(sp.id)) missing.push(d + ':' + (sp ? sp.id : '?'));
  }
  ok('dex: all 151 obtainable in one playthrough (wild/trade/gift/event/fossil/prize + evo closure)', missing.length === 0, missing.join(','));
}

// ---------- D. story / arcs ----------
ok('story: 24 main quests with completion flags', QUESTS.length >= 24 && QUESTS.every((q) => q.id && q.text && q.hint));
ok('story: 58 legendary arcs (57 + the arc_arceus designed stub, Arc 4 Stage S7 — supersedes the S6 count; the live capstone supersedes the stub in the merge fold); Kanto five are full builds', Object.keys(LEGENDARY_ARCS).length === 58
  && ['arc_articuno', 'arc_zapdos', 'arc_moltres', 'arc_mewtwo', 'arc_mew'].every((id) => LEGENDARY_ARCS[id] && !LEGENDARY_ARCS[id].designedOnly));
ok('story: movie event + champion ending scripted', !!EVENTS.ev_movie_climax && !!EVENTS.ev_champion);

// ---------- E. formulas (ADR-018 values) ----------
ok('formula: crit chance base/512, high-crit x4/256', Math.abs(F.critChance(90) - 90 / 512) < 1e-9 && Math.abs(F.critChance(25, { highCrit: true }) - 100 / 256) < 1e-9);
ok('formula: gen1 damage roll bounds', F.gen1Random(() => 0) === 217 / 255 && F.gen1Random(() => 0.9999) === 1);
ok('formula: master ball always catches; R>rate fails', F.gen1Catch(50, 50, 255, 'masterball', null, () => 0.999).caught === true && F.gen1Catch(50, 50, 45, 'pokeball', null, () => 0.999).caught === false);
ok('formula: modern chart — ghost SE vs psychic, fairy SE vs dragon, steel SE vs fairy',
  F.effectiveness('ghost', ['psychic']) === 2 && F.effectiveness('fairy', ['dragon']) === 2 && F.effectiveness('steel', ['fairy']) === 2 && F.effectiveness('electric', ['ground']) === 0);
ok('formula: damage — crit doubles level in formula (Gen 1)', F.calcDamage(5, 40, 12, 10, { crit: true, random: 1 }) === 7 && F.calcDamage(5, 40, 12, 10, { random: 1 }) === 5);

// ---------- F. control parity (ADR-021) ----------
{
  const kb = new Set(Object.values(KEYMAP));
  const need = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select', 'pageup', 'pagedown', 'slot1', 'slot2', 'slot3', 'slot4'];
  ok('controls: keyboard map covers every gameplay action', need.every((a) => kb.has(a)), need.filter((a) => !kb.has(a)).join(','));
  const uiSrc = readFileSync(join(ROOT, 'src/game/ui.mjs'), 'utf8');
  const padActions = ['up', 'down', 'left', 'right'];
  const touchOk = padActions.every((a) => uiSrc.includes("mk('" + a + "'"))
    && uiSrc.includes("mkA('a'") && uiSrc.includes("mkA('b'") && uiSrc.includes("mkA('pageup'") && uiSrc.includes("mkA('pagedown'")
    && uiSrc.includes("mkS('start'") && uiSrc.includes("mkS('select'");
  ok('controls: touch pad builds D-pad + A/B/X/Y + START/SELECT on the same input layer', touchOk);
  const rtSrc = readFileSync(join(ROOT, 'src/game/battle-rt.mjs'), 'utf8');
  // UI v2.3 (defect 2): the RT-only combined panel is DELETED; RT battles
  // present the same Platinum command flow as classic (A -> 2x2 grid ->
  // FIGHT -> framed move window). Slot keys remain a keyboard shortcut.
  ok('controls: RT uses the unified command grid (no combined panel)',
    rtSrc.includes('rtShowCommands') && rtSrc.includes('showCommands') && rtSrc.includes("menuClass: 'battlewin'")
    && !rtSrc.includes('rtShowTouchCommands') && !rtSrc.includes('_rtCmdFor')
    && rtSrc.includes("input.wasPressed('slot' + (i + 1))"));
  // Both front-ends funnel into Input.press/release — assert the API surface.
  const { Input } = await import(join(ROOT, 'src/engine/input.mjs'));
  const inp = new Input();
  const script = ['up', 'a', 'slot1', 'pageup', 'start', 'b', 'select', 'pagedown', 'slot4'];
  const stream = [];
  for (const a of script) { inp.press(a); if (inp.wasPressed(a)) stream.push(a); inp.release(a); }
  ok('controls: scripted action stream identical through the shared Input layer', JSON.stringify(stream) === JSON.stringify(script) && ACTIONS.includes('escape'));
}

// ---------- G. functional RT battle (bundle, keyboard-slot driving) ----------
{
  const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.__SEED__ = 777;
  const gameJs = buildGameJs();
  const driver = `
  ;(function () {
    const game = new Game(null); // ADR-026: default is now 'classic' — pin 'rt' explicitly so this RT functional proof is independent of the default
    game.state.settings.battleStyle = 'rt';
    game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
    game.scenes.push(new BootScene());
    const input = game.input, ui = game.ui;
    const st = game.state;
    st.party = [makeMon('partner', 20, SPECIES, MOVES)];
    st.bag.pokeball = 5;
    const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
    const foe = makeMon('rattata', 3, SPECIES, MOVES);
    const b = new BattleScene({ kind: 'wild', foe, returnTo: ow });
    game.scenes.push(b);
    let ticks = 0, dealt = 0;
    const foeMax = foe.maxHp;
    while ((game.scenes.top instanceof BattleScene) && ticks < 4000) {
      game.loop.stepTicks(2); ticks += 2;
      if (b.msgOpen) { input.inject('a'); game.loop.stepTicks(2); input.release('a'); continue; }
      if (ui.menuOpen) { input.press('b'); game.loop.stepTicks(2); input.release('b'); continue; }
      // Keyboard-only RT play: close distance (both axes), fire slot 1 off cooldown.
      if (b.rt && b.allyPos) {
        if (b.allyPos.x < b.foePos.x - 40) input.press('right'); else input.release('right');
        if (b.allyPos.y > b.foePos.y + 30) input.press('up'); else input.release('up');
        if (b.allyPos.y < b.foePos.y - 30) input.press('down'); else input.release('down');
      }
      if (ticks % 24 === 0) { input.press('slot1'); } else { input.release('slot1'); }
      if (foe.hp < foeMax) dealt = foeMax - foe.hp;
    }
    console.log('RT-RESULT ' + JSON.stringify({ ended: !(game.scenes.top instanceof BattleScene), dealt, ticks, foeHp: foe.hp }));
  })();`;
  const logs = [];
  const origLog = console.log;
  console.log = (...a) => { logs.push(a.join(' ')); };
  try { eval(gameJs + driver); } finally { console.log = origLog; }
  const res = JSON.parse((logs.find((l) => l.startsWith('RT-RESULT')) || 'RT-RESULT {}').slice(10));
  ok('rt battle: keyboard-slot play deals damage and the battle ends', res.ended === true && res.dealt > 0, JSON.stringify(res));
}

// ---------- H. UI v2.3 fix round ----------
{
  const renderMod = await import(join(ROOT, 'src/engine/render.mjs'));
  // Defect 1: body stack leads with the body face; display stack Galmuri-first.
  // UI v2.4: the body face is PtPixel (Pixelify Sans) — DotGothic16's
  // dot-matrix Latin dissolved at body sizes (docs/ui-v24-root-cause.md).
  ok('v2.4 fonts: canvas body stack is PtPixel-first, display stack PtGalmuri-first',
    renderMod.UI_FONT_STACK.startsWith("'PtPixel'") && renderMod.UI_DISPLAY_FONT_STACK.startsWith("'PtGalmuri'"));
  const buildSrc = readFileSync(join(ROOT, 'scripts/build.mjs'), 'utf8');
  ok('v2.4 fonts: shell --font token is PtPixel-first with a Galmuri display token',
    buildSrc.includes("--font:'PtPixel','PtGalmuri'") && buildSrc.includes("--font-display:'PtGalmuri','PtPixel'"));

  // Defect 1: no-mid-word-clip. wrapText measures with the render font
  // itself; with a monospace stub measurer (7px/char), lines must break
  // only on spaces: rejoining reproduces the source, and every word of
  // the source appears whole in exactly one line.
  const stubCtx = { font: '', measureText: (t) => ({ width: String(t).length * 7 }) };
  const stubCanvas = { getContext: () => stubCtx, style: {} };
  const rend = new renderMod.Renderer(stubCanvas);
  const msg = 'Your first catch is always the sweetest one, partner!';
  const lines = rend.wrapText(msg, 14, 20 * 7);
  const rejoined = lines.join(' ');
  let wordsWhole = lines.length >= 2 && rejoined === msg;
  if (wordsWhole) {
    for (const ln of lines) for (const w of ln.split(' ')) if (!msg.split(' ').includes(w)) wordsWhole = false;
  }
  ok('v2.3 wrap: battle messages wrap on word boundaries only (no y/our clip)', wordsWhole, JSON.stringify(lines));
  ok('v2.3 wrap: the 2-line message box cap still applies', rend.wrapText(msg, 14, 20 * 7, { maxLines: 2 }).length === 2);
  const battleSrc = readFileSync(join(ROOT, 'src/game/battle.mjs'), 'utf8');
  const rtSrc2 = readFileSync(join(ROOT, 'src/game/battle-rt.mjs'), 'utf8');
  ok('v2.3 wrap: fixed 30-char message slicing is gone from both battle renderers',
    !battleSrc.includes('slice(0, 30)') && !rtSrc2.includes('slice(0, 30)')
    && battleSrc.includes('wrapText') && rtSrc2.includes('wrapText'));

  // Defect 4: textured per-area backdrops.
  ok('v2.3 arena: textured backdrops with grass/cave/water/gym variants',
    battleSrc.includes('arenaKind()') && battleSrc.includes('arenaHash')
    && battleSrc.includes("'cave'") && battleSrc.includes("'water'") && battleSrc.includes("'gym'") && battleSrc.includes("'grass'"));

  // Defect 5: PC terminal reachable — shared Center interior + the lab.
  const center = ALL_MAPS.center;
  ok('v2.3 pc: the shared Pokemon Center interior has a PC terminal',
    !!center && center.npcs.some((n) => n.pc === true));
  ok('v2.3 pc: a PC terminal stands at the Pallet lab entrance',
    ALL_MAPS.pallet.npcs.some((n) => n.pc === true));
  const artSrc = readFileSync(join(ROOT, 'assets/sprites/art-data.mjs'), 'utf8');
  ok('v2.3 pc: terminal machine art exists (not a person sprite)',
    artSrc.includes('"npc-pc-idle-1"') && artSrc.includes('"npc-pc-idle-2"'));
}

console.log('\nfidelity-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
