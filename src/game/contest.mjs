// contest.mjs — Arc 3 Stage H5: Contest-lite (coordinator ruling 7).
//
// THE ENGINE (pure, deterministic): a contest is 4 entrants x 4 rounds
// of APPEAL performances on the shipped battle presentation. No damage,
// no fainting, no levels — a mon performs one of its real moves, the
// crowd scores appeal (src/data/contest.mjs: appealJamFor) plus a small
// presentation variance (0..2, drawn from the caller's rng stream —
// seeded in tests, g.rng.misc live), and a move with JAM cuts the
// current ROUND leader's round score: the leader *so far this round*
// (an entrant who has already performed), never the performer. Playing
// a jam move while behind is the comeback lever; playing it while
// leading fizzles (you cannot jam yourself). Performance order rotates
// each round (round r opens with entrant r-1), the classic rotation.
// Standings sort by total, then by final-round gain, then by entrant
// order — fully deterministic, no coin flips.
//
// THE SCENE: ContestScene extends BattleScene and INHERITS its render
// whole — the arena, the stepped platforms, the battler plates, the
// idle life — with the battle flow replaced: this.foe tracks the
// current performer, narration rides ui.say, move picks ride a
// 'Choose a move' menu over the entered mon's real moveset (the same
// harness seams the battle drivers use). BattleScene itself is not
// modified by this stage (battle-model-checks 45/45 is the hard gate).
// What the presentation had to LEARN: nothing — every field render()
// touches is plain scene state this class initializes in enter()
// (fxPool/entryFx/fxKb/fxRecoil/entryT/_exitStartT/hpAnim/msg), the
// same set BattleScene.enter() initializes for itself.

import { BattleScene } from './battle.mjs';
import { SPECIES } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { makeMon, displayName } from './state.mjs';
import { intIn } from '../engine/rng.mjs';
import {
  CONTEST_HALLS, CONTEST_RIBBONS, RIBBON_NAMES, CONTEST_NPCS, CONTEST_ROUNDS, appealJamFor,
} from '../data/contest.mjs';

const NPC_LEVEL = 250; // dressing only — contests are not level fights

function npcMon(def) {
  const mon = makeMon(def.species, NPC_LEVEL, SPECIES, MOVES);
  mon.moves = def.script.map((id) => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp }));
  return mon;
}

// createContest({ hall, playerMon, playerName }) -> state.
// Entrant 0 is always the player; 1..3 are the hall's NPC field.
export function createContest(opts) {
  const hall = opts.hall;
  const entrants = [{
    key: 'player', name: opts.playerName || 'KIAN', mon: opts.playerMon,
    script: null, total: 0, roundGain: 0, lastGain: 0, performed: false,
  }];
  for (const def of CONTEST_NPCS[hall] || []) {
    entrants.push({
      key: 'npc:' + def.name, name: def.name, mon: npcMon(def),
      script: def.script, total: 0, roundGain: 0, lastGain: 0, performed: false,
    });
  }
  return { hall, round: 1, entrants, events: [] };
}

// One performance. Mutates the entrant + any jammed leader; returns the
// event record (also appended to state.events): the suite's scoring
// proof reads these, the scene's narration renders them.
export function resolvePerformance(state, entrant, moveId, rng) {
  const aj = appealJamFor(moveId);
  const variance = intIn(0, 2, rng);
  const gained = aj.appeal + variance;
  entrant.roundGain += gained;
  entrant.total += gained;
  entrant.lastGain = gained;
  entrant.performed = true;
  const ev = {
    round: state.round, entrant: entrant.key, name: entrant.name,
    speciesId: entrant.mon.speciesId, moveId, appeal: aj.appeal,
    variance, gained, jam: aj.jam, jamTarget: null, jammed: 0,
  };
  if (aj.jam > 0) {
    // The round leader so far: highest roundGain among entrants who
    // have ALREADY performed this round, excluding the performer.
    let leader = null;
    for (const e of state.entrants) {
      if (e === entrant || !e.performed) continue;
      if (!leader || e.roundGain > leader.roundGain
        || (e.roundGain === leader.roundGain && e.total > leader.total)) leader = e;
    }
    if (leader && leader.roundGain > 0) {
      const cut = Math.min(aj.jam, leader.roundGain);
      leader.roundGain -= cut;
      leader.total -= cut;
      ev.jamTarget = leader.key;
      ev.jammed = cut;
    }
  }
  state.events.push(ev);
  return ev;
}

// A full round: the player performs playerMoveId, NPCs perform their
// scripted move for the round, in the rotated order. Returns the
// round's events in performance order.
export function performRound(state, playerMoveId, rng) {
  const r = state.round;
  for (const e of state.entrants) { e.roundGain = 0; e.performed = false; }
  const start = (r - 1) % state.entrants.length;
  const out = [];
  for (let i = 0; i < state.entrants.length; i++) {
    const e = state.entrants[(start + i) % state.entrants.length];
    const moveId = e.script ? e.script[r - 1] : playerMoveId;
    out.push(resolvePerformance(state, e, moveId, rng));
  }
  state.round = r + 1;
  return out;
}

// Standings: total desc, final-round gain desc, entrant order asc.
export function standingsOf(state) {
  return state.entrants.map((e, i) => ({ e, i }))
    .sort((a, b) => (b.e.total - a.e.total) || (b.e.lastGain - a.e.lastGain) || (a.i - b.i))
    .map((x) => x.e);
}
export function placementOf(state) {
  return standingsOf(state).findIndex((e) => e.key === 'player') + 1;
}
export function contestFinished(state) { return state.round > CONTEST_ROUNDS; }

// Ribbon persistence: state.contest.ribbons is the closed hall-id set
// (see the quintet in schema.mjs / api validator / gen-tables). Award
// is idempotent — a replayed win never duplicates the ribbon.
export function awardContestRibbon(gameState, hall) {
  if (!CONTEST_RIBBONS.includes(hall)) return false;
  if (!gameState.contest || !Array.isArray(gameState.contest.ribbons)) {
    gameState.contest = { ribbons: [] };
  }
  if (gameState.contest.ribbons.includes(hall)) return false;
  gameState.contest.ribbons.push(hall);
  return true;
}
export function hasRibbon(gameState, hall) {
  return !!gameState.contest && Array.isArray(gameState.contest.ribbons)
    && gameState.contest.ribbons.includes(hall);
}

// ---------------- the scene ----------------

export class ContestScene extends BattleScene {
  constructor(opts) {
    // The battle constructor only stores fields; its enter() (the
    // battle flow) is fully overridden below and never runs.
    super({ kind: 'trainer', foe: opts.mon, rt: false, returnTo: opts.returnTo || null });
    this.hall = opts.hall;
    this.playerMon = opts.mon;
    this.onEnd = opts.onEnd || null;
    this.contest = null;
  }

  enter() {
    const g = this.game;
    g.ui.setBattleMode(true);
    // The render-field set BattleScene.enter() initializes for itself
    // (see the header note) — render() reads these unconditionally.
    this.t = 0;
    this.state = 'contest';
    this.msg = '';
    this.msgOpen = false;
    this.ally = this.playerMon;
    this.contest = createContest({
      hall: this.hall, playerMon: this.playerMon, playerName: g.state.player.name,
    });
    this.foe = this.contest.entrants[1].mon;
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.fxPool = [];
    for (let i = 0; i < 60; i++) this.fxPool.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, sz: 2, col: '#fff', grav: 0 });
    this.entryFx = { ally: null, foe: null };
    this.fxKb = { ally: { t: 1e9, dist: 0 }, foe: { t: 1e9, dist: 0 } };
    this.fxRecoil = { ally: { t: 1e9, dist: 0 }, foe: { t: 1e9, dist: 0 } };
    this.entryT = 1e9;
    this._exitStartT = -1;
    this.atkFx = null; this.impactFx = null; this.faintFx = null;
    this.recallFx = null; this.catchFx = null; this.breakFx = null; this.fxSeq = null;
    this.trauma = 0; this.shakeT = 0; this.flashT = 0; this.fadeT = 0;
    this.xpFlashT = 0; this._lowHpPulseT = 0;
    g.audio.playMusic('contest-theme', { area: false }); // W12-T4: contests have their own theme (no longer borrowed from trainer battles)
    const hallName = (this.returnTo && this.returnTo.map && this.returnTo.map.name) || 'Contest Hall';
    const field = this.contest.entrants.map((e) => e.name + ' & ' + displayName(e.mon, SPECIES)).join(', ');
    g.ui.say([
      'Welcome to the ' + hallName + '!',
      'Four entrants take the stage: ' + field + '.',
      'Four rounds of appeal. No battling — just showmanship. The crowd\'s favourite takes the ' + RIBBON_NAMES[this.hall] + '!',
    ], () => this.roundPrompt());
  }

  update(dt) {
    // Presentation clocks only; the flow is callback-driven (ui.say /
    // ui.showMenu), exactly like the overworld's event chains.
    this.entryT += dt * 1000;
  }

  exit() {
    this.game.ui.setBattleMode(false);
  }

  roundPrompt() {
    const g = this.game;
    if (contestFinished(this.contest)) { this.finish(); return; }
    const round = this.contest.round;
    const items = this.playerMon.moves.map((slot, i) => {
      const mv = MOVES[slot.id];
      const aj = appealJamFor(slot.id);
      return {
        label: (mv ? mv.name : slot.id) + '  ♥' + aj.appeal + (aj.jam ? '  JAM ' + aj.jam : ''),
        value: i, disabled: false,
      };
    });
    g.ui.showMenu('Choose a move', items, (v) => {
      const slot = this.playerMon.moves[v];
      if (!slot) { this.roundPrompt(); return; }
      const events = performRound(this.contest, slot.id, g.rng.misc);
      this.narrateRound(events, 0);
    });
  }

  narrateRound(events, idx) {
    const g = this.game;
    if (idx >= events.length) {
      const st = standingsOf(this.contest);
      const line = 'Round ' + (this.contest.round - 1) + ' standings: '
        + st.map((e) => e.name + ' ' + e.total).join(' · ') + '.';
      g.ui.say([line], () => this.roundPrompt());
      return;
    }
    const ev = events[idx];
    const entrant = this.contest.entrants.find((e) => e.key === ev.entrant);
    if (entrant && ev.entrant !== 'player') { this.foe = entrant.mon; this.hpAnim.foe = this.foe.hp; }
    const lines = [
      ev.name + '\'s ' + displayName(entrant.mon, SPECIES) + ' used ' + MOVES[ev.moveId].name + '!',
      'The crowd roars — +' + ev.gained + ' appeal!',
    ];
    if (ev.jammed > 0) {
      const target = this.contest.entrants.find((e) => e.key === ev.jamTarget);
      lines.push('It JAMS ' + (target ? target.name : 'the leader') + '\'s rhythm — their round score drops by ' + ev.jammed + '!');
    }
    g.ui.say(lines, () => this.narrateRound(events, idx + 1));
  }

  finish() {
    const g = this.game;
    const place = placementOf(this.contest);
    const st = standingsOf(this.contest);
    const lines = [
      'Final standings: ' + st.map((e) => e.name + ' ' + e.total).join(' · ') + '.',
    ];
    let won = false;
    if (place === 1) {
      won = awardContestRibbon(g.state, this.hall);
      lines.push('FIRST PLACE! ' + displayName(this.playerMon, SPECIES) + ' takes the stage!');
      lines.push(won
        ? 'Received the ' + RIBBON_NAMES[this.hall] + '!'
        : 'You already hold the ' + RIBBON_NAMES[this.hall] + ' — the hall applauds the encore all the same.');
      g.audio.playSfx('dex-register');
    } else {
      lines.push('You placed ' + place + (place === 2 ? 'nd' : place === 3 ? 'rd' : 'th')
        + '. No ribbon this time — the hall keeps its ribbon for a first-place finish.');
    }
    const result = { place, won, standings: st.map((e) => ({ key: e.key, name: e.name, total: e.total })) };
    g.ui.say(lines, () => {
      g.ui.setBattleMode(false);
      g.scenes.pop();
      if (this.onEnd) this.onEnd(result);
    });
  }
}
