// rejuv-phase5-checks.mjs — Rejuvenation Phase 5 (ADR-025 §2) proofs:
// Bonds. Part A: pure units over the tier model (src/game/bonds.mjs) —
// derived tier edges, the swing/range clamps, one-shot sources, the
// rival ledger feeding BOTH bonds and the ADR-016 Eevee rule, tier
// dialogue resolution, the R3 structural proof (battle code carries no
// bond references; the rival def variant differs only in text), Phase
// 4 tale deltas landing in the live tier model, legacy saves.
// Part B: the built bundle in a headless Game — the choice primitive
// end-to-end (menu -> bond -> nameplate pip), Gary's tier-variant
// battle text + ledger outcome from a real NPC battle, the Celadon
// parley at Warm (talk path: ribbon + reduced XP) and at Wary (ambush
// stays an ambush), the lower-of-pair parley gate, gym-leader Warm
// gift + rematch banter, a -10-everyone save completing a tale AND a
// gym (progression independence), the champion sayVar, Hawthorn's
// rating/diploma bonds, Mom's tier send-offs, arc beats, and the
// Quest Log PEOPLE review surface (tiers shown, numbers never).
// Part C: damage-free real-browser smoke.
// Run: node tests/rejuv-phase5-checks.mjs   (exit 1 on any failure)

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ================= Part A: pure units =================
const B = await import(join(ROOT, 'src/game/bonds.mjs'));
const { BOND_DIALOGUE } = await import(join(ROOT, 'src/data/dialogue.mjs'));
const Q = await import(join(ROOT, 'src/data/quests.mjs'));
const { EVENTS } = await import(join(ROOT, 'src/data/story-kanto.mjs'));
const { defaultState } = await import(join(ROOT, 'src/game/state.mjs'));
const SCH = await import(join(ROOT, 'src/save/schema.mjs'));
const VAL = await import(join(ROOT, 'api/_lib/validator.mjs'));
const { MAPS } = await import(join(ROOT, 'src/data/maps.mjs'));
const { MAPS2 } = await import(join(ROOT, 'src/data/maps2.mjs'));
const { MAPS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));
const { MAPS4 } = await import(join(ROOT, 'src/data/maps4.mjs'));
const ALL_MAPS = Object.assign({}, MAPS, MAPS2, MAPS3, MAPS4);
const { TRAINERS3 } = await import(join(ROOT, 'src/data/maps3.mjs'));

// -- tiers: derived, never stored; edges as decided in bonds.mjs --
{
  const t = B.bondTier;
  ok('A01 tier edges: Cold <= -4, Wary -3..+1, Warm +2..+6, Close >= +7 (spec fixes Close >= +7; Warm at +2 matches Phase 4 shipped fiction)',
    t(-10) === 'Cold' && t(-4) === 'Cold' && t(-3) === 'Wary' && t(0) === 'Wary' && t(1) === 'Wary'
    && t(2) === 'Warm' && t(6) === 'Warm' && t(7) === 'Close' && t(10) === 'Close');
  const s = defaultState();
  ok('A02 a stranger (no record) reads 0 / Wary — tiers derive from the score on every read, nothing stored',
    B.bondOf(s, 'gary') === 0 && B.tierOf(s, 'gary') === 'Wary' && !('gary' in (s.story.bonds || {})));
  ok('A03 no single choice can hard-lock below Wary: worst single swing from neutral (-2) still reads Wary',
    (() => { const s2 = defaultState(); const r = B.applyBond(s2, 'misty', -2); return r.after === -2 && B.tierOf(s2, 'misty') === 'Wary'; })());
}

// -- writing: swing clamp + range clamp + one-shot guard --
{
  const s = defaultState();
  const r1 = B.applyBond(s, 'gary', 9);
  const r2 = B.applyBond(s, 'gary', -9);
  ok('A04 applyBond swing-clamps every single change to <= 2 (spec guardrail, structural — not authoring discipline)',
    r1.delta === 2 && r1.after === 2 && r2.delta === -2 && r2.after === 0, JSON.stringify([r1, r2]));
  const s2 = defaultState();
  for (let i = 0; i < 8; i++) B.applyBond(s2, 'mom', 2);
  const hi = s2.story.bonds.mom;
  for (let i = 0; i < 12; i++) B.applyBond(s2, 'mom', -2);
  ok('A05 applyBond range-clamps to the §2 span (-10..+10) under sustained pressure both ways',
    hi === 10 && s2.story.bonds.mom === -10);
  const s3 = defaultState();
  const a = B.applyBondOnce(s3, 'bondsrc_test', 'brock', 1);
  const b2 = B.applyBondOnce(s3, 'bondsrc_test', 'brock', 1);
  ok('A06 applyBondOnce is one-shot: first firing applies + sets the flag, second is a no-op (no grindable source)',
    a && a.after === 1 && b2 === null && s3.story.bonds.brock === 1 && s3.story.flags.bondsrc_test === true);
  ok('A07 applyBond reports direction for the nameplate pip (dir -1/0/+1, tier transition fields)',
    (() => { const s4 = defaultState(); const up = B.applyBond(s4, 'erika', 2); const flat = B.applyBond(s4, 'erika', 0);
      const dn = B.applyBond(s4, 'erika', -2); return up.dir === 1 && up.tierAfter === 'Warm' && flat.dir === 0 && dn.dir === -1; })());
}

// -- the cast + review surface data --
{
  ok('A08 the cast: 14 bond characters (mom, professor, rival, duo, retired ace, 7 tale leaders, Mr. Fuji) with nameplate + number-free note',
    B.BOND_CHARACTERS.length === 14
    && ['mom', 'hawthorn', 'gary', 'rue', 'cole', 'retiredace', 'brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'fuji']
      .every((id) => { const c = B.bondCharacter(id); return c && c.name && c.plate && c.note && !/\d/.test(c.note); }));
  const s = defaultState();
  s.story.bonds = { gary: -5, mom: 2 };
  ok('A09 bondedCharacters lists exactly the recorded characters, in cast order (the PEOPLE section source)',
    JSON.stringify(B.bondedCharacters(s).map((c) => c.id)) === JSON.stringify(['mom', 'gary'])
    && B.bondedCharacters(defaultState()).length === 0);
}

// -- the rival ledger: one record, two readers (bonds + ADR-016) --
{
  const s = defaultState();
  const w = B.recordRivalOutcome(s, 'gary_cerulean', true);
  const again = B.recordRivalOutcome(s, 'gary_cerulean', false);
  const l = B.recordRivalOutcome(s, 'gary_stanne', false);
  const led = B.rivalLedger(s);
  ok('A10 rival outcomes move Gary\'s bond (+1 win / -1 loss) and the FIRST outcome per battle is the only one recorded',
    w && w.delta === 1 && again === null && l && l.delta === -1 && s.story.bonds.gary === 0
    && led.wins === 1 && led.losses === 1 && led.earlyWins === 1 && led.earlyLosses === 1, JSON.stringify(led));
  const mk = (recs) => { const x = defaultState(); for (const [id, won] of recs) B.recordRivalOutcome(x, id, won); return x; };
  ok('A11 bonds READ the ADR-016 ledger: the same records feed rivalPartnerEvolution (2-0 Vaporeon / 1-1 Flareon / 0-2 Jolteon)',
    B.rivalEvolutionFromLedger(mk([['gary_cerulean', true], ['gary_stanne', true]])) === 'vaporeon'
    && B.rivalEvolutionFromLedger(mk([['gary_cerulean', true], ['gary_stanne', false]])) === 'flareon'
    && B.rivalEvolutionFromLedger(mk([['gary_cerulean', false], ['gary_stanne', false]])) === 'jolteon'
    && B.rivalEvolutionFromLedger(defaultState()) === 'jolteon');
  const s2 = defaultState();
  const fled = B.recordBattleBond(s2, 'gary_cerulean', true, true);
  ok('A12 a FLED battle is neither win nor loss: no ledger record, no bond movement',
    fled === null && (s2.story.bonds.gary || 0) === 0 && !s2.story.flags.rivalwin_gary_cerulean && !s2.story.flags.rivalloss_gary_cerulean);
  const s3 = defaultState();
  B.recordDuoOutcome(s3, 'r2_duo', true);
  B.recordDuoOutcome(s3, 'r2_duo', false); // no-op: first outcome only
  B.recordDuoOutcome(s3, 'duo2_vermilion', false);
  ok('A13 duo outcomes move Rue AND Cole together, first outcome per battle only',
    s3.story.bonds.rue === 0 && s3.story.bonds.cole === 0 && s3.story.flags.duowin_r2_duo === true && s3.story.flags.duoloss_duo2_vermilion === true);
  ok('A14 Gary attainability audit: 6 rival battles + authored choice points offer >= +7 (Close reachable, not default)',
    (() => { let offered = B.RIVAL_BATTLES.length; // +1 per battle win
      for (const steps of Object.values(EVENTS)) for (const st of steps) {
        if (st.choice && (st.choice.npc === 'gary')) offered += Math.max(...st.choice.options.map((o) => o.delta || 0));
      }
      return offered >= 7; })());
}

// -- tier-variant dialogue --
{
  const at = (id, v) => { const s = defaultState(); s.story.bonds[id] = v; return s; };
  ok('A15 tier boundaries flip Gary\'s battle lines: cold/wary/warm/close sets are four distinct authored sets',
    (() => { const sets = [-10, 0, 3, 9].map((v) => (B.bondSceneLines(at('gary', v), 'gary', 'battle') || []).join('|'));
      return new Set(sets).size === 4 && sets.every((x) => x.length > 10); })());
  ok('A16 the champion scene GAINS its mutual-respect lines only at Close (null at Cold/Wary/Warm — the standard scene is untouched)',
    B.bondSceneLines(at('gary', 9), 'gary', 'championAfter') !== null
    && B.bondSceneLines(at('gary', 3), 'gary', 'championAfter') === null
    && B.bondSceneLines(at('gary', 0), 'gary', 'championAfter') === null
    && B.bondSceneLines(at('gary', -9), 'gary', 'championAfter') === null);
  ok('A17 Warm+ unlocks backstory, Cold unlocks guarded variants of the same beats (leader banter sets exist at all four tiers)',
    ['brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine'].every((id) =>
      [-9, 0, 3, 9].every((v) => { const l = B.bondSceneLines(at(id, v), id, 'banter'); return Array.isArray(l) && l.length >= 1; })));
  ok('A18 dialogue table coverage: >= 10 characters carry tier-variant scenes; every set is non-empty original lines',
    Object.keys(BOND_DIALOGUE).length >= 10
    && Object.values(BOND_DIALOGUE).every((scenes) => Object.values(scenes).every((set) =>
      Object.values(set).every((lines) => Array.isArray(lines) && lines.length >= 1 && lines.every((l) => typeof l === 'string' && l.length > 3)))));
  ok('A19 unknown scene / character resolves null (callers keep their default lines — variants can never strand a beat)',
    B.bondSceneLines(at('gary', 5), 'gary', 'nope') === null && B.bondSceneLines(at('gary', 5), 'nobody', 'battle') === null);
}

// -- authored choice points in the event data --
{
  const choices = [];
  for (const [ev, steps] of Object.entries(EVENTS)) for (const st of steps) if (st.choice) choices.push([ev, st.choice]);
  ok('A20 choice-point audit: >= 6 authored event choice points, each with >= 2 unlabelled options and every |delta| <= 2',
    choices.length >= 6 && choices.every(([, c]) => Array.isArray(c.options) && c.options.length >= 2
      && c.options.every((o) => typeof o.label === 'string' && Math.abs(o.delta || 0) <= 2 && !/good|bad/i.test(o.label))),
    'found ' + choices.length);
  ok('A21 choice points never gate the beat: every option carries its own continuation lines or none (the handler advances on any pick)',
    choices.every(([, c]) => c.options.every((o) => o.say === undefined || Array.isArray(o.say))));
}

// -- Phase 4 tale deltas land in the LIVE tier model --
{
  const run = (id, opts) => { const s = defaultState(); Q.completeTale(s, id, opts); return s; };
  ok('A22 tale completions resolve to tiers with Phase 4 amounts byte-identical (mom +2 Warm, brock +2 Warm, fuji +2 Warm, erika +2 Warm)',
    B.bondOf(run('tale_pallet'), 'mom') === 2 && B.tierOf(run('tale_pallet'), 'mom') === 'Warm'
    && B.bondOf(run('tale_pewter'), 'brock') === 2 && B.tierOf(run('tale_pewter'), 'brock') === 'Warm'
    && B.bondOf(run('tale_lavender'), 'fuji') === 2 && B.tierOf(run('tale_lavender'), 'fuji') === 'Warm'
    && B.bondOf(run('tale_celadon'), 'erika') === 2 && B.tierOf(run('tale_celadon'), 'erika') === 'Warm');
  ok('A23 the +1 tales land Wary (misty/surge/sabrina/koga/blaine) — Warm for them is earned by one more authored beat, per the leader-talk design',
    [['tale_cerulean', 'misty'], ['tale_vermilion', 'surge'], ['tale_saffron', 'sabrina'], ['tale_fuchsia', 'koga'], ['tale_cinnabar', 'blaine']]
      .every(([id, npc]) => B.bondOf(run(id), npc) === 1 && B.tierOf(run(id), npc) === 'Wary'));
  ok('A24 Viridian semantics kept exactly: return = +2 (Warm — the shipped fiction names it), keep = 0 (no record movement)',
    B.bondOf(run('tale_viridian', { bondDelta: 2 }), 'retiredace') === 2 && B.tierOf(run('tale_viridian', { bondDelta: 2 }), 'retiredace') === 'Warm'
    && (run('tale_viridian', { bondDelta: 0 }).story.bonds.retiredace || 0) === 0);
}

// -- R3: structural enforcement --
{
  const banned = ['story.bonds', 'applyBond', 'bondOf', 'tierOf', 'BOND_DIALOGUE', 'recordBattleBond', 'bondTrainerVariant'];
  const files = ['src/game/battle.mjs', 'src/game/battle-rt.mjs', 'src/engine/formulas.mjs'];
  ok('A25 R3 structural: the battle engines + shared damage path contain NO bond references at all (bonds cannot move a stat, an AI pick, or a team)',
    files.every((f) => { const src = readFileSync(join(ROOT, f), 'utf8'); return banned.every((tok) => !src.includes(tok)); }),
    files.filter((f) => banned.some((tok) => readFileSync(join(ROOT, f), 'utf8').includes(tok))).join(','));
  const def = TRAINERS3.gary_champion;
  const cold = B.bondTrainerVariant((() => { const s = defaultState(); s.story.bonds.gary = -10; return s; })(), def);
  const close = B.bondTrainerVariant((() => { const s = defaultState(); s.story.bonds.gary = 10; return s; })(), def);
  const mech = (t) => JSON.stringify({ team: t.team, ai: t.ai, reward: t.reward, badge: t.badge || null });
  ok('A26 R3 at construction: Gary\'s def at bond -10 vs +10 — team/AI/reward byte-identical, ONLY intro/lose text differs',
    !!def && mech(cold) === mech(def) && mech(close) === mech(def) && mech(cold) === mech(close)
    && JSON.stringify(cold.intro) !== JSON.stringify(def.intro) && JSON.stringify(close.intro) !== JSON.stringify(cold.intro),
    def ? mech(def).slice(0, 120) : 'def missing');
  ok('A27 bondTrainerVariant never mutates the shared def and passes non-rival defs through by identity',
    (() => { const before = JSON.stringify(def.intro); const s = defaultState(); s.story.bonds.gary = 10;
      B.bondTrainerVariant(s, def); const other = { id: 'r1_cal', intro: ['x'], team: [] };
      return JSON.stringify(def.intro) === before && B.bondTrainerVariant(s, other) === other; })());
}

// -- parley data + gate --
{
  ok('A28 parley pair: two Celadon actors on walkable floor tiles, clear of base NPCs/warps/signs',
    B.PARLEY_NPCS.length === 2 && B.PARLEY_NPCS.every((n) => {
      const m = ALL_MAPS[n.map]; if (!m) return false;
      const ch = m.rows[n.y] && m.rows[n.y][n.x];
      // Premium+ W5: Celadon's town-ground chars are walkable floor
      // (see rejuv-phase4 A14) — the parley pair stands on town ground.
      return (['.', ','].includes(ch) || (ch >= 'À' && ch <= 'Ê') || (ch >= 'ı' && ch <= 'ń'))
        && !(m.npcs || []).some((b) => b.x === n.x && b.y === n.y)
        && !(m.warps || []).some((w) => w.x === n.x && w.y === n.y) && !(m.signs || []).some((sg) => sg.x === n.x && sg.y === n.y);
    }));
  const s = defaultState();
  const v1 = B.parleyVisible(s);
  s.story.flags.stanne_done = true;
  const v2 = B.parleyVisible(s);
  s.story.flags.parley_celadon_done = true;
  ok('A29 parley visibility window: hidden before the Anne sails, present after, gone once resolved',
    v1 === false && v2 === true && B.parleyVisible(s) === false);
  ok('A30 the ribbon\'s second source is intact (Celadon atelier clerk still stocks it behind the 7-badge gate)',
    (() => { const clerk = (ALL_MAPS.celadon.npcs || []).find((n) => n.mart); return !!clerk && clerk.mart.stock.includes('secondwindribbon'); })());
}

// -- saves: legacy loads + validator --
{
  const base = () => { const s = defaultState(); s.player.name = 'ASH'; s.player.rivalName = 'GARY'; return s; };
  const legacy1 = base(); legacy1.v = 1; delete legacy1.story.bonds;
  const mig1 = SCH.migrate(JSON.parse(JSON.stringify(legacy1)));
  const p4era = base(); p4era.story.bonds = { mom: 2, brock: 2 };
  const mig2 = SCH.migrate(JSON.parse(JSON.stringify(p4era)));
  ok('A31 legacy saves load: v1 (no bonds field) migrates to bonds={} and every character reads Wary; Phase-4-era bonds survive migration byte-identical',
    mig1.v === 2 && JSON.stringify(mig1.story.bonds) === '{}' && B.tierOf(mig1, 'gary') === 'Wary'
    && mig2.story.bonds.mom === 2 && mig2.story.bonds.brock === 2 && SCH.validateSave(JSON.parse(JSON.stringify(mig2))).ok === true);
  const full = base();
  for (const c of B.BOND_CHARACTERS) full.story.bonds[c.id] = c.id === 'gary' ? -10 : 10;
  ok('A32 cloud validator accepts the full cast at both extremes (all Phase 5 bond keys are legal save shape)',
    VAL.validateSave(JSON.parse(JSON.stringify(full))).ok === true);
}

// ================= Part B: headless bundle =================
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 4242;
const gameJs = buildGameJs();

const driver = `
;(function () {
  const out = {};
  function makeDriver(game) {
    const ui = game.ui, st = game.state, input = game.input;
    const tick = (n) => game.loop.stepTicks(n || 2);
    const pressA = () => { input.inject('a'); tick(2); input.release('a'); };
    function drain(max) { let n = 0; while ((ui.dialogueOpen || (game.scenes.top && game.scenes.top.msgOpen)) && n < (max || 400)) { pressA(); n++; } }
    function gotoMap(map, x, y) {
      st.story.position = { map, x: x || 7, y: y || 7, dir: 'down' };
      const ow = new OverworldScene();
      game.scenes.replace(ow); ow.enter(); tick(4);
      return ow;
    }
    function driveBattle() {
      let guard = 0;
      while ((game.scenes.top instanceof BattleScene) && guard < 900) {
        guard++;
        drain(60);
        if (!(game.scenes.top instanceof BattleScene)) break;
        const b = game.scenes.top;
        if (ui.menuOpen) {
          const m = ui.menu;
          if (m.kind === 'commands') {
            const idx = m.items.findIndex((it) => !it.disabled && it.value === 'fight');
            ui.debugChoose(idx >= 0 ? idx : 0); tick(3);
          } else if (m.title === 'Choose a move') {
            let best = 0, bs = -1;
            const foeTypes = SPECIES[b.foe.speciesId].types, allyTypes = SPECIES[b.ally.speciesId].types;
            m.items.forEach((it, i) => { if (it.disabled) return; const slot = b.ally.moves[i]; if (!slot) return; const md = MOVES[slot.id]; const sc = md.cat === 'status' ? 0.05 : (md.power || 0) * effectiveness(md.type, foeTypes) * (allyTypes.includes(md.type) ? 1.5 : 1); if (sc > bs) { bs = sc; best = i; } });
            ui.debugChoose(best); tick(3);
          } else if (m.title === 'Choose next Pokemon' || m.title === 'Party') {
            const idx = st.party.findIndex((mm) => mm.hp > 0 && mm !== b.ally);
            ui.debugChoose(idx >= 0 ? idx : m.items.length - 1); tick(3);
          } else { ui.debugChoose(m.items.length - 1); tick(3); }
        } else { pressA(); tick(3); }
      }
      drain(120);
    }
    function talkTo(ow, name) {
      const npc = ow.map.npcs.find((n) => n.name === name);
      if (!npc) return false;
      ow.partner.px = -32; ow.partner.py = -32;
      ow.player.tx = npc.x; ow.player.ty = npc.y + 1;
      ow.player.px = npc.x * 16; ow.player.py = (npc.y + 1) * 16;
      ow.player.dir = 'up';
      ow.tryInteract();
      drain(160);
      if (game.scenes.top instanceof BattleScene) driveBattle();
      drain(80);
      return true;
    }
    function chooseLabel(frag) {
      const items = ui.menu ? ui.menu.items : [];
      const i = items.findIndex((it) => it.label && it.label.includes(frag));
      if (i < 0) return false;
      ui.debugChoose(i); tick(3); drain(120);
      if (game.scenes.top instanceof BattleScene) driveBattle();
      drain(60);
      return true;
    }
    function lastDialogue() {
      const logs = ui.log.filter((e) => e.ui === 'dialogue');
      return logs.length ? logs[logs.length - 1].lines.join(' | ') : '';
    }
    function team() {
      const mk = (id, moves) => { const m = makeMon(id, 75, SPECIES, MOVES); m.moves = moves.map((x) => ({ id: x, pp: MOVES[x].pp, maxPp: MOVES[x].pp })); return m; };
      st.party = [
        mk('partner', ['thunderbolt', 'quickattack', 'thunderwave', 'slam']),
        mk('venusaur', ['razorleaf', 'bodyslam', 'sleeppowder', 'cut']),
        mk('charizard', ['flamethrower', 'slash', 'fly', 'firespin']),
        mk('blastoise', ['surf', 'icebeam', 'bodyslam', 'bite']),
        mk('gengar', ['psychic', 'hypnosis', 'nightshade', 'thunderbolt']),
        mk('snorlax', ['bodyslam', 'hyperbeam', 'rest', 'earthquake']),
      ];
    }
    return { ui, st, gotoMap, talkTo, chooseLabel, drain, driveBattle, team, lastDialogue, tick };
  }
  const boot = () => { const game = new Game(null); game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout(); const D = makeDriver(game); D.team(); D.st.settings.battleStyle = 'classic'; return { game, D }; };

  // ================= GAME 1: primitives + rating + PEOPLE =================
  {
    const { game, D } = boot();
    const st = D.st, ui = D.ui;
    const ow = D.gotoMap('pallet', 7, 7);
    // Choice primitive: an authored delta of +9 must land as +2 (swing clamp).
    ow.runSteps([{ choice: { npc: 'gary', who: 'GARY', prompt: 'Pick.', options: [
      { label: 'Huge warmth', delta: 9, say: ['After the choice.'] },
      { label: 'Small cold', delta: -1, say: ['After the cold.'] },
    ] } }], 0, () => { out.choiceDone = true; });
    out.choiceMenuOpen = !!ui.menu;
    const items = ui.menu ? ui.menu.items : [];
    const hi = items.findIndex((it) => it.label === 'Huge warmth');
    ui.debugChoose(hi); D.tick(3);
    out.choiceBond = st.story.bonds.gary || 0;
    out.choicePip = ui.dlg ? ui.dlg.pip : null;
    out.choiceSay = ui.dlg ? ui.dlg.lines.join(' | ') : '';
    D.drain(60);
    // A cold option on a second beat: -1 lands, pip cools.
    ow.runSteps([{ choice: { npc: 'gary', who: 'GARY', prompt: 'Pick.', options: [
      { label: 'Small cold', delta: -1, say: ['After the cold.'] },
    ] } }], 0, () => {});
    const ci = (ui.menu ? ui.menu.items : []).findIndex((it) => it.label === 'Small cold');
    ui.debugChoose(ci); D.tick(3);
    out.choiceBond2 = st.story.bonds.gary || 0;
    out.choicePip2 = ui.dlg ? ui.dlg.pip : null;
    D.drain(60);
    // sayVar: Close gains the champion lines; Warm stays silent.
    st.story.bonds.gary = 8;
    ow.runSteps([{ sayVar: { npc: 'gary', scene: 'championAfter', who: 'GARY' } }], 0, () => {});
    out.sayVarClose = ui.dlg ? ui.dlg.lines.join(' | ') : '';
    D.drain(60);
    st.story.bonds.gary = 3;
    let varDone = false;
    ow.runSteps([{ sayVar: { npc: 'gary', scene: 'championAfter', who: 'GARY' } }], 0, () => { varDone = true; });
    out.sayVarWarmSilent = varDone === true && !ui.dlg;
    // Arc beats: mewtwo completion warms Blaine once, and only once.
    ow.runSteps([{ arc: 'arc_mewtwo', stage: 'complete' }], 0, () => {});
    ow.runSteps([{ arc: 'arc_mewtwo', stage: 'complete' }], 0, () => {});
    out.arcBlaine = st.story.bonds.blaine || 0;
    // Hawthorn: first rating is a one-shot +1; framing follows the tier.
    const r0 = game.oakRating();
    out.ratingBondAfterFirst = st.story.bonds.hawthorn || 0;
    game.oakRating();
    out.ratingBondAfterSecond = st.story.bonds.hawthorn || 0;
    out.ratingWary = r0;
    st.story.bonds.hawthorn = 9;
    out.ratingClose = game.oakRating();
    st.story.bonds.hawthorn = -8;
    out.ratingCold = game.oakRating();
    // Diploma: +2 once (inside checkDiploma's own guard).
    st.story.bonds.hawthorn = 0;
    for (const sp of Object.values(SPECIES)) if (sp.dexNo >= 1 && sp.dexNo <= 151) st.dex.caught[sp.dexNo] = true;
    game.checkDiploma(); D.drain(40);
    out.diplomaBond = st.story.bonds.hawthorn || 0;
    game.checkDiploma();
    out.diplomaBondAgain = st.story.bonds.hawthorn || 0;
    // PEOPLE review surface.
    st.story.bonds = { mom: 2, gary: -5 };
    game.openQuestLog();
    const labels = (ui.menu ? ui.menu.items : []).map((it) => it.label);
    out.peopleSection = labels.some((l) => l.includes('PEOPLE'));
    out.peopleRows = labels.filter((l) => l.includes(' — '));
    ui.debugChoose((ui.menu.items || []).length - 1); D.tick(2);
  }

  // ================= GAME 2: Gary NPC battle — text by tier, ledger =================
  for (const preset of [-10, 10]) {
    const { D } = boot();
    const st = D.st;
    st.story.bonds.gary = preset;
    const ow = D.gotoMap('stanne', 7, 7);
    const logAt = D.ui.log.length;
    D.talkTo(ow, 'GARY');
    const intro = D.ui.log.slice(logAt).filter((e) => e.ui === 'dialogue').map((e) => e.lines.join(' | ')).join(' || ');
    if (preset === -10) { out.garyColdIntro = intro; out.garyColdBondAfterWin = st.story.bonds.gary; out.garyColdLedger = !!st.story.flags.rivalwin_gary_stanne; }
    else { out.garyCloseIntro = intro; out.garyCloseBondAfterWin = st.story.bonds.gary; }
  }

  // ================= GAME 3: parley at Warm — the talk path =================
  {
    const { D } = boot();
    const st = D.st;
    st.story.flags.stanne_done = true;
    st.story.bonds.rue = 3; st.story.bonds.cole = 3;
    const ow = D.gotoMap('celadon', 7, 7);
    out.parleyPresent = ow.map.npcs.some((n) => n.name === 'RUE' && n.parley) && ow.map.npcs.some((n) => n.name === 'COLE' && n.parley);
    out.sharedCeladonClean = !MAPS.celadon.npcs.some((n) => n.parley);
    D.talkTo(ow, 'RUE');
    out.parleyMenu = D.chooseLabel('Talk them down');
    out.parleyRibbon = st.bag.secondwindribbon || 0;
    out.parleyCandy = st.bag.xpcandy || 0;
    out.parleyBonds = (st.story.bonds.rue || 0) + '/' + (st.story.bonds.cole || 0);
    out.parleyDone = st.story.flags.parley_celadon_done === true;
    const ow2 = D.gotoMap('celadon', 7, 7);
    out.parleyGoneAfter = !ow2.map.npcs.some((n) => n.parley);
  }

  // ================= GAME 4: parley at Wary — ambush stays an ambush =================
  {
    const { D } = boot();
    const st = D.st;
    st.story.flags.stanne_done = true;
    const ow = D.gotoMap('celadon', 7, 7);
    D.talkTo(ow, 'COLE');
    out.ambushDone = st.story.flags.parley_celadon_done === true;
    out.ambushRibbon = st.bag.secondwindribbon || 0;
    out.ambushBonds = (st.story.bonds.rue || 0) + '/' + (st.story.bonds.cole || 0);
    out.ambushBeatFlag = st.story.flags.beat_duo3_celadon === true;
  }

  // ================= GAME 5: parley gate reads the LOWER of the pair =================
  {
    const { D } = boot();
    const st = D.st;
    st.story.flags.stanne_done = true;
    st.story.bonds.rue = 6; st.story.bonds.cole = 0; // one Warm, one Wary -> no parley
    const ow = D.gotoMap('celadon', 7, 7);
    D.talkTo(ow, 'RUE');
    out.lowerGateAmbush = st.story.flags.parley_celadon_done === true && (st.bag.secondwindribbon || 0) === 0;
  }

  // ================= GAME 6: leader talks — Warm gift + banter; Cold gets neither gift nor warmth =================
  {
    const { D } = boot();
    const st = D.st;
    st.story.flags.beat_brock = true;
    st.story.quests.tale_pewter = 'complete';
    st.story.bonds.brock = 2; // tale's +2 already landed (Warm)
    const ow = D.gotoMap('gym', 5, 5);
    const candy0 = st.bag.xpcandy || 0;
    D.talkTo(ow, 'BROCK');
    out.leaderWarmTalk = D.lastDialogue();
    out.leaderGiftCandy = (st.bag.xpcandy || 0) - candy0;
    out.leaderThanksBond = st.story.bonds.brock;
    D.talkTo(ow, 'BROCK');
    out.leaderGiftOnce = (st.bag.xpcandy || 0) - candy0;
    out.leaderBondStable = st.story.bonds.brock;
    // Cold leader: guarded banter, no gift.
    const g2 = boot(); const st2 = g2.D.st;
    st2.story.flags.beat_brock = true;
    st2.story.quests.tale_pewter = 'complete';
    st2.story.bonds.brock = -10;
    const ow2 = g2.D.gotoMap('gym', 5, 5);
    g2.D.talkTo(ow2, 'BROCK');
    out.leaderColdTalk = g2.D.lastDialogue();
    out.leaderColdCandy = st2.bag.xpcandy || 0;
    out.leaderColdBond = st2.story.bonds.brock;
  }

  // ================= GAME 7: -10 everyone — tale + gym complete identically =================
  {
    const { D } = boot();
    const st = D.st;
    for (const id of ['mom', 'hawthorn', 'gary', 'rue', 'cole', 'retiredace', 'brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'fuji']) st.story.bonds[id] = -10;
    let ow = D.gotoMap('pallet', 7, 7);
    D.talkTo(ow, 'MOM');
    ow = D.gotoMap('mart', 5, 5); // Wave 5b: SHOPKEEPER is indoors (Viridian Mart scene)
    D.talkTo(ow, 'SHOPKEEPER');
    ow = D.gotoMap('pallet', 7, 7);
    D.talkTo(ow, 'MOM');
    out.coldTaleDone = st.story.quests.tale_pallet;
    out.coldMomBond = st.story.bonds.mom;
    ow = D.gotoMap('gym', 5, 5);
    D.talkTo(ow, 'BROCK');
    out.coldBadge = st.badges.kanto.includes('boulderbadge');
    out.coldBrockBond = st.story.bonds.brock;
    // Mom's Cold send-off on a later talk.
    ow = D.gotoMap('pallet', 7, 7);
    D.talkTo(ow, 'MOM');
    out.coldMomTalk = D.lastDialogue();
  }

  console.log('REJUV5-RESULT ' + JSON.stringify(out));
})();`;

const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const res = JSON.parse((logs.find((l) => l.startsWith('REJUV5-RESULT')) || 'REJUV5-RESULT {}').slice(14));
const J = JSON.stringify(res);

ok('B01 choice primitive end-to-end: menu opens on the beat, the pick applies the bond with the SWING CLAMP (+9 authored -> +2 landed)',
  res.choiceMenuOpen === true && res.choiceBond === 2, J.slice(0, 300));
ok('B02 heart pip: the consequence dialogue after a warming choice wears pip +1 on its nameplate record',
  res.choicePip === 1 && typeof res.choiceSay === 'string' && res.choiceSay.includes('After the choice'), J.slice(0, 300));
ok('B03 cold option: -1 lands (2 -> 1) and the pip cools (-1)',
  res.choiceBond2 === 1 && res.choicePip2 === -1, J.slice(0, 300));
ok('B04 sayVar: at Close the champion scene gains the mutual-respect lines; at Warm the beat is silent and the script flows on',
  typeof res.sayVarClose === 'string' && res.sayVarClose.includes('concession speech') && res.sayVarWarmSilent === true, J.slice(0, 400));
ok('B05 legendary-arc beat: Mewtwo completion warms Blaine +1, once only (second firing is a no-op)',
  res.arcBlaine === 1, J.slice(0, 300));
ok('B06 Hawthorn rating: first ask is a one-shot +1 source; repeats do not farm',
  res.ratingBondAfterFirst === 1 && res.ratingBondAfterSecond === 1, J.slice(0, 300));
ok('B07 Hawthorn rating temperature follows the tier (Close framing at +9, Cold framing at -8, canonical thresholds at Wary)',
  typeof res.ratingClose === 'string' && res.ratingClose.includes('check first in the morning')
  && typeof res.ratingCold === 'string' && res.ratingCold.includes('The data is the data')
  && typeof res.ratingWary === 'string' && res.ratingWary.includes('caught'), J.slice(0, 400));
ok('B08 diploma: completing the dex warms Hawthorn +2, once (his own one-shot guard)',
  res.diplomaBond === 2 && res.diplomaBondAgain === 2, J.slice(0, 300));
ok('B09 Quest Log PEOPLE: section + rows show tier labels only (Mom — Warm, Gary — Cold), never a raw score',
  res.peopleSection === true && (res.peopleRows || []).some((l) => l.includes('Mom — Warm')) && (res.peopleRows || []).some((l) => l.includes('Gary — Cold'))
  && !(res.peopleRows || []).some((l) => /—\s*-?\d/.test(l)), J.slice(0, 500));
ok('B10 Gary NPC battle at Cold: his intro text is the Cold set, and winning still records the ledger (+1 respect: -10 -> -9)',
  typeof res.garyColdIntro === 'string' && res.garyColdIntro.includes('Do not slow me down') && res.garyColdBondAfterWin === -9 && res.garyColdLedger === true, J.slice(0, 500));
ok('B11 Gary NPC battle at Close: his intro text is the Close set (same battle, warmer words — text only)',
  typeof res.garyCloseIntro === 'string' && res.garyCloseIntro.includes('saving my best') && res.garyCloseBondAfterWin === 10, J.slice(0, 500));
ok('B12 parley appears post-Anne in the scene copy only (shared MAPS data never mutated)',
  res.parleyPresent === true && res.sharedCeladonClean === true, J.slice(0, 300));
ok('B13 parley TALK path at Warm: Second-Wind Ribbon granted (first source lives), reduced XP as an XP Candy, +1 bond each, scene resolved and pair gone',
  res.parleyMenu === true && res.parleyRibbon === 1 && res.parleyCandy >= 1 && res.parleyBonds === '4/4' && res.parleyDone === true && res.parleyGoneAfter === true, J);
ok('B14 parley at Wary: the ambush stays an ambush — a real duo battle, won for the beat flag, NO ribbon, duo ledger +1 each',
  res.ambushDone === true && res.ambushBeatFlag === true && res.ambushRibbon === 0 && res.ambushBonds === '1/1', J);
ok('B15 parley gate reads the pair\'s LOWER tier: Rue Warm + Cole Wary still opens as an ambush',
  res.lowerGateAmbush === true, J.slice(0, 300));
ok('B16 leader talk at Warm: thanks (+1: 2 -> 3), the Warm gift (2 XP Candies) lands ONCE, rematch banter carries the backstory beat',
  res.leaderThanksBond === 3 && res.leaderGiftCandy === 2 && res.leaderGiftOnce === 2 && res.leaderBondStable === 3
  && typeof res.leaderWarmTalk === 'string' && res.leaderWarmTalk.length > 10, J.slice(0, 600));
ok('B17 leader talk at Cold: guarded banter variant, thanks still +1 (-10 -> -9), NO gift (the gift is Warm-gated; nothing else is)',
  res.leaderColdCandy === 0 && res.leaderColdBond === -9 && typeof res.leaderColdTalk === 'string' && res.leaderColdTalk.includes('Gym hours are posted'), J.slice(0, 600));
ok('B18 progression independence: a -10-everyone save completes the Pallet tale (bond lands at -8, structure identical)',
  res.coldTaleDone === 'complete' && res.coldMomBond === -8, J.slice(0, 400));
ok('B19 progression independence: the same -10 save beats Brock and earns the Boulder Badge (battles never read bonds)',
  res.coldBadge === true && res.coldBrockBond === -10, J.slice(0, 400));
ok('B20 Mom\'s send-off at Cold is the guarded variant of the same beat',
  typeof res.coldMomTalk === 'string' && res.coldMomTalk.includes('Oh. It is you.'), J.slice(0, 500));

// ================= Part C: real headless Chromium =================
{
  const pubHtml = join(ROOT, 'public', 'index.html');
  const pubJs = join(ROOT, 'public', 'game.js');
  if (!existsSync(pubHtml) || !existsSync(pubJs) || !existsSync('/opt/meta-chromium/chrome')) {
    ok('C01 real-browser smoke (skipped: built bundle or chromium missing)', false, 'build first: node scripts/build.mjs');
  } else {
    const CSP = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[0].headers
      .find((h) => h.key === 'Content-Security-Policy').value;
    const HTML_B64 = readFileSync(pubHtml).toString('base64');
    const GAME_B64 = readFileSync(pubJs).toString('base64');
    const cport = 9850 + (process.pid % 140);
    const chrome = spawn('/opt/meta-chromium/chrome', [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--remote-debugging-port=' + cport, '--user-data-dir=/tmp/rejuv5-chrome-' + cport,
      '--window-size=1280,800', 'about:blank',
    ], { stdio: 'ignore' });
    try {
      let ws;
      for (let i = 0; i < 50 && !ws; i++) {
        try {
          const v = await (await fetch('http://127.0.0.1:' + cport + '/json/version')).json();
          ws = new WebSocket(v.webSocketDebuggerUrl);
          await new Promise((res2, rej) => { ws.onopen = res2; ws.onerror = rej; });
        } catch (e) { await new Promise((r) => setTimeout(r, 200)); }
      }
      if (!ws) throw new Error('chromium did not start');
      let msgId = 0;
      const pending = new Map();
      ws.onmessage = (m) => {
        const d = JSON.parse(m.data);
        if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
        if (d.method === 'Fetch.requestPaused') { void fulfillC(d.params, d.sessionId); }
      };
      const sendAny = (method, params, sessionId) => new Promise((resolve) => {
        const id = ++msgId; pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params: params || {}, sessionId }));
      });
      async function fulfillC(p, sessionId) {
        const url = p.request.url;
        try {
          if (url.includes('/api/')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{"ok":true}').toString('base64') }, sessionId);
          } else if (url.endsWith('/game.js')) {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: GAME_B64 }, sessionId);
          } else {
            await sendAny('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }, { name: 'Content-Security-Policy', value: CSP }], body: HTML_B64 }, sessionId);
          }
        } catch (e) { /* session gone */ }
      }
      const targets = await sendAny('Target.getTargets');
      const page = targets.result.targetInfos.find((t) => t.type === 'page');
      const session = await sendAny('Target.attachToTarget', { targetId: page.targetId, flatten: true });
      const SID = session.result.sessionId;
      const snd = (method, params) => sendAny(method, params, SID);
      await snd('Page.enable'); await snd('Runtime.enable');
      await snd('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
      const evl = async (expr) => {
        const r = await snd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
        return r.result.result.value;
      };
      await snd('Page.navigate', { url: 'http://127.0.0.1:8931/' });
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let canvasOk = false;
      for (let i = 0; i < 100 && !canvasOk; i++) { canvasOk = await evl("typeof Game === 'function' && typeof BOND_CHARACTERS === 'object' && !!document.querySelector('canvas')"); if (!canvasOk) await sleep(150); }
      ok('C00 chromium boots the built bundle (Game + bond cast live)', canvasOk === true);
      const browserDriver = `(() => {
        const out = {};
        try {
          out.castCount = BOND_CHARACTERS.length;
          const game = new Game(null);
          game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
          game.state.story.bonds = { mom: 2, gary: 8 };
          game.openQuestLog();
          const labels = (game.ui.menu ? game.ui.menu.items : []).map((it) => it.label);
          out.peopleRows = labels.filter((l) => l.includes(' — '));
          game.state.story.flags.stanne_done = true;
          const ow = new OverworldScene(); game.scenes.push(ow); ow.enter();
          game.state.story.position = { map: 'celadon', x: 7, y: 7, dir: 'down' };
          ow.loadMap('celadon');
          out.parleyThere = ow.map.npcs.some((n) => n.parley);
          out.tierCheck = bondTier(-4) + '/' + bondTier(2) + '/' + bondTier(7);
        } catch (e) { out.error = String((e && e.stack) || e); }
        return out;
      })()`;
      const br = await evl(browserDriver);
      ok('C01 real-browser: 14-character cast shipped; Quest Log PEOPLE rows render tier labels in the real bundle',
        !!br && br.castCount === 14 && Array.isArray(br.peopleRows) && br.peopleRows.some((l) => l.includes('Mom — Warm')) && br.peopleRows.some((l) => l.includes('Gary — Close')),
        JSON.stringify(br));
      ok('C02 real-browser: parley pair injected in Celadon post-Anne; tier edges live in the shipped bundle',
        !!br && br.parleyThere === true && br.tierCheck === 'Cold/Warm/Close', JSON.stringify(br));
      ws.close();
    } catch (e) {
      ok('C01 real-browser smoke (chromium harness)', false, String(e).slice(0, 300));
    } finally {
      try { chrome.kill(); } catch (e) { /* already gone */ }
    }
  }
}

console.log('rejuv-phase5-checks: ' + pass + '/' + (pass + fail) + ' passed');
process.exit(fail ? 1 : 0);
