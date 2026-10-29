// frontier.mjs — Arc 3.5 Stage F2: the Battle Frontier controller.
//
// Systems layer in the contest.mjs shape: pure helpers + the
// receptionist entry (startFrontier, dispatched from the overworld
// NPC handler for NPCs carrying frontier: '<id>'), the seven
// facility drivers, and the shared Brain award. All battles ride the
// BattleScene FACILITY seam (battle.mjs): rt:false, no XP, no prize,
// friendly defeat, the entered/rental team via partyOverride —
// state.party is NEVER swapped for a Frontier contest.
//
// Run state lives in state.frontier (J6 persistence treatment —
// defaultState + client schema + server validator + gen-tables).
// ONE run is active across all facilities: starting facility B
// while a run is open in facility A closes A's run (records kept),
// and the receptionist says so before it happens.

import { SPECIES } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS } from '../data/items.mjs';
import {
  FACILITIES, FACILITY_IDS, BRAIN_TEAMS, BRAIN_MILESTONES, SYMBOL_ITEMS,
  PIKE_EVENT_WEIGHTS, PIKE_HINT_PHRASES, PYRAMID_LOOT, PYRAMID_SPOT_CANDIDATES,
  PYRAMID_SPOTS_PER_FLOOR, PYRAMID_FLOOR_MAPS, PYRAMID_NEXT_FLOOR, BRANDON_TILE, LUCY_TILE,
  PIKE_ENTRY_ROWS, PIKE_DOOR_XS, PIKE_DAIS_Y, freshRecords,
} from '../data/frontier.mjs';
import { makeMon } from './state.mjs';
import { BattleScene } from './battle.mjs';

// ------------------------------------------------------------------
// State helpers
// ------------------------------------------------------------------

// Runtime shape-repair in the ensureJohtoSystems idiom — the save
// layer (schema fill) is the real repair path; this covers live
// states built before F2 in this session.
export function ensureFrontier(state) {
  if (!state.frontier || typeof state.frontier !== 'object') {
    state.frontier = { records: freshRecords(), run: null, pyramidBag: [] };
  }
  const F = state.frontier;
  if (!F.records || typeof F.records !== 'object') F.records = freshRecords();
  for (const id of FACILITY_IDS) {
    if (!F.records[id] || typeof F.records[id] !== 'object') F.records[id] = freshRecords()[id];
  }
  if (!Array.isArray(F.pyramidBag)) F.pyramidBag = [];
  if (F.run === undefined) F.run = null;
  return F;
}

export function symbolSlot(state, facilityId) {
  return state.badges.symbols[FACILITY_IDS.indexOf(facilityId)];
}

export function healTeam(team) {
  for (const m of team) {
    if (!m) continue;
    m.hp = m.maxHp;
    m.status = null; m.confused = false; m.confusedTurns = null; m.sleepTurns = null;
    for (const mv of m.moves) mv.pp = mv.maxPp;
  }
}

// The team a run fights with: Factory rentals (serialized mons in
// the run itself) or the entered party mons, resolved by monId —
// the party array itself is never reordered or swapped.
export function activeTeam(state, run) {
  if (!run) return [];
  if (run.facility === 'factory') return (run.rentals || []).filter(Boolean);
  return (run.enteredTeam || [])
    .map((id) => state.party.find((m) => m && m.monId === id))
    .filter(Boolean);
}

function newRun(facility, foeLevel, enteredTeam) {
  return {
    facility, foeLevel, enteredTeam: enteredTeam || [],
    streak: 0, rentals: null, bracket: null, tournamentNo: 0,
    events: null, rooms: 0, lastChamber: 0, banked: false,
    floor: 1, runNo: 0, spots: [], spotsFloor: null,
    lucyFaced: false, brandonFaced: false,
  };
}

function closeRun(state) { state.frontier.run = null; }

// ------------------------------------------------------------------
// Opponents (generated + Brains)
// ------------------------------------------------------------------

function pickSpecies(g, pool, n, used) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const sp = pool[Math.floor(g.rng.misc() * pool.length)];
    if (used && used.has(sp)) continue;
    if (out.includes(sp)) continue;
    out.push(sp);
  }
  return out;
}

// A generated Frontier trainer. id is unique per run battle (rng
// suffix) so nothing keyed on trainer id can collide across runs.
// teamSize: 3 for the set/dome facilities, 1 for the Arena's judged
// single-battler bouts (see judgeArena) — Pike chamber trainers use 2.
export function genTrainer(g, facilityId, battleNo, foeLevel, teamSize) {
  const fac = FACILITIES[facilityId];
  const size = teamSize || 3;
  const species = pickSpecies(g, fac.pools, size, null);
  const name = fac.names[Math.floor(g.rng.misc() * fac.names.length)];
  const late = battleNo >= 14; // late sets sharpen (mission: ai 'smart' for late sets)
  return {
    id: 'frontier-' + facilityId + '-' + battleNo + '-' + Math.floor(g.rng.misc() * 1e9).toString(36),
    name, title: fac.title, reward: 0,
    ai: late ? 'smart' : undefined,
    team: species.map((sp) => ({ species: sp, level: foeLevel })),
    intro: [fac.name + ', battle ' + battleNo + '. ' + name + ' steps up — no prizes here, only the streak.'],
    lose: ['Cleanly done. The ' + fac.name + ' keeps your streak honest — onward.'],
  };
}

export function brainTrainer(facilityId, tier, foeLevel) {
  const fac = FACILITIES[facilityId];
  return {
    id: 'frontier-brain-' + facilityId + '-' + tier,
    name: fac.brain, title: fac.brainTitle, reward: 0, ai: 'smart',
    team: BRAIN_TEAMS[facilityId][tier].map((e) => ({ ...e, level: foeLevel })),
    intro: fac.brainIntro,
    lose: fac.brainLose,
  };
}

// Which Brain tier (if any) stands at this set-facility battle
// number: slot null -> Silver milestone, slot 'silver' -> Gold
// milestone, slot 'gold' -> the Brain no longer appears.
function setMilestone(state, facilityId, battleNo) {
  const slot = symbolSlot(state, facilityId);
  const M = BRAIN_MILESTONES[facilityId];
  if (slot === null && battleNo === M.silver) return 'silver';
  if (slot === 'silver' && battleNo === M.gold) return 'gold';
  return null;
}

// ------------------------------------------------------------------
// The shared Brain award
// ------------------------------------------------------------------

// On a Brain win: the slot takes the tier, the badge fanfare plays,
// and the symbol lines are spoken. When the seventh slot turns gold
// the registry completion flag is set — the Foundation machine
// fires the Frontier ARC COMPLETE card from the flag alone on the
// next map load; this helper never calls the card itself.
export function awardSymbol(g, facilityId, tier, cb) {
  const state = g.state;
  const idx = FACILITY_IDS.indexOf(facilityId);
  state.badges.symbols[idx] = tier;
  g.audio.playSfx('badge');
  const item = ITEMS[SYMBOL_ITEMS[facilityId]];
  const fac = FACILITIES[facilityId];
  const lines = [
    'Received the ' + item.name + ' — struck in ' + tier.toUpperCase() + '!',
    '(' + fac.brain + ' of the ' + fac.name + ' has acknowledged your team. One symbol closer to the Frontier\'s heart.)',
  ];
  if (state.badges.symbols.every((s) => s === 'gold')) {
    state.story.flags.frontier_complete = true;
    lines.push('(Every symbol now shines gold. Something on this island has been waiting for exactly that...)');
  }
  g.ui.say(lines, cb || (() => {}), '');
}

// ------------------------------------------------------------------
// Receptionist entry
// ------------------------------------------------------------------

export function startFrontier(g, facilityId, ow) {
  const state = g.state;
  const F = ensureFrontier(state);
  const fac = FACILITIES[facilityId];
  const say = (lines, cb) => g.ui.say(lines, cb || (() => {}), fac.name.toUpperCase() + ' DESK');
  if (F.run && F.run.facility !== facilityId) {
    const other = FACILITIES[F.run.facility];
    say(['You still hold an open run at the ' + other.name + ' — starting here closes it where it stands.',
      'Its records stay written; the run itself ends. Shall I close it and book you into the ' + fac.name + '?'], () => {
      g.ui.showMenu('Close the ' + other.name + ' run?', [
        { label: 'Close it — book me in here', value: 'yes' },
        { label: 'Not yet', value: 'no' },
      ], (v) => {
        if (v !== 'yes') return;
        closeRun(state);
        startFrontier(g, facilityId, ow);
      });
    });
    return;
  }
  if (F.run && F.run.facility === facilityId) {
    const run = F.run;
    const progress = runProgressLine(facilityId, run);
    say(['Your ' + fac.name + ' run is still open — ' + progress + '.', 'Shall we pick it back up?'], () => {
      g.ui.showMenu(fac.name + ' run', [
        { label: 'Resume the run', value: 'resume' },
        { label: 'Retire the run', value: 'retire' },
        { label: 'Just looking', value: 'leave' },
      ], (v) => {
        if (v === 'resume') resumeRun(g, facilityId, ow);
        else if (v === 'retire') { closeRun(state); say(['Retired and recorded. The ' + fac.name + ' will be here when the streak calls again.']); }
      });
    });
    return;
  }
  say([fac.intro], () => beginEntry(g, facilityId, ow));
}

function runProgressLine(facilityId, run) {
  if (facilityId === 'dome') return 'tournament ' + run.tournamentNo + ', round ' + ((run.bracket && run.bracket.round + 1) || 1) + ' of 4';
  if (facilityId === 'pike') return run.rooms + ' chambers cleared this run';
  if (facilityId === 'pyramid') return 'floor ' + run.floor + ' of 7, climb ' + run.runNo;
  return 'streak ' + run.streak;
}

function resumeRun(g, facilityId, ow) {
  const run = g.state.frontier.run;
  if (!run) return;
  if (facilityId === 'dome') { domeNextMatch(g, ow); return; }
  if (facilityId === 'pike' || facilityId === 'pyramid') {
    g.ui.say(['Your run stands where you left it. The doors remember you.'], () => {}, FACILITIES[facilityId].name.toUpperCase() + ' DESK');
    return;
  }
  launchSetBattle(g, ow);
}

// Party pick of exactly 3 able non-egg mons (the contest idiom):
// sequential menus over the able list, no repeats. cb(teamMons).
function partyPick3(g, fac, cb) {
  const able = g.state.party.filter((m) => m && !m.egg && m.hp > 0);
  if (able.length < 3) {
    g.ui.say(['The ' + fac.name + ' books teams of three able partners — you have ' + able.length + '.',
      'Heal up at the island Center and come back with three ready to fight.'], () => {}, fac.name.toUpperCase() + ' DESK');
    return;
  }
  const picked = [];
  const step = () => {
    if (picked.length === 3) { cb(picked); return; }
    const rest = able.filter((m) => !picked.includes(m));
    g.ui.showMenu('Enter partner ' + (picked.length + 1) + ' of 3', rest.map((m) => ({
      label: m.nickname || SPECIES[m.speciesId].name + ' Lv' + m.level, value: m.monId,
    })), (v) => {
      if (v === null || v === undefined) return; // desk cancel: entry simply does not start
      picked.push(able.find((m) => m.monId === v));
      step();
    });
  };
  step();
}

function beginEntry(g, facilityId, ow) {
  const state = g.state;
  const fac = FACILITIES[facilityId];
  if (facilityId === 'factory') { factoryDraft(g, ow); return; }
  partyPick3(g, fac, (team) => {
    const foeLevel = Math.max(...team.map((m) => m.level));
    healTeam(team); // the desk books a fresh team (canon); Pike/Pyramid take run damage from here
    const run = newRun(facilityId, foeLevel, team.map((m) => m.monId));
    if (facilityId === 'dome') {
      run.tournamentNo = state.frontier.records.dome.tournaments + 1;
      state.frontier.records.dome.tournaments = run.tournamentNo;
      run.bracket = buildBracket(g, team);
      state.frontier.run = run;
      g.ui.say(['The bracket is drawn — sixteen names, one Dome. Your first match is ready when you are.'],
        () => domeNextMatch(g, ow), 'BATTLE DOME DESK');
      return;
    }
    if (facilityId === 'pike') {
      run.events = preRollPike(g);
      state.frontier.run = run;
      g.ui.say(['Your Pike run is booked. Every door ahead already knows its secret — walk the hall and choose.',
        'Seven chambers. Behind the dais, the way out. Good luck — you will need a little.'], () => {}, 'BATTLE PIKE DESK');
      return;
    }
    if (facilityId === 'pyramid') {
      run.runNo = state.frontier.records.pyramid.runs + 1;
      state.frontier.records.pyramid.runs = run.runNo;
      state.frontier.pyramidBag = [];
      state.frontier.run = run;
      g.ui.say(['Climb ' + run.runNo + ' is booked, and the Pyramid Bag hangs empty at your hip.',
        'The inner doors will open for you now. Seven floors, no free healing — take what the mountain offers.'], () => {}, 'BATTLE PYRAMID DESK');
      return;
    }
    state.frontier.run = run;
    launchSetBattle(g, ow);
  });
}

// ------------------------------------------------------------------
// Set facilities: Tower / Arena / Palace (+ Factory battles)
// ------------------------------------------------------------------

function facilityOpts(run, team, extra) {
  return Object.assign({
    id: run.facility,
    partyOverride: team,
    pyramidBag: run.facility === 'pyramid',
  }, extra || {});
}

function launchSetBattle(g, ow) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run) return;
  const facId = run.facility;
  const battleNo = run.streak + 1;
  const tier = setMilestone(state, facId, battleNo);
  const trainer = tier ? brainTrainer(facId, tier, run.foeLevel)
    : genTrainer(g, facId, battleNo, run.foeLevel, facId === 'arena' ? 1 : 3);
  const team = activeTeam(state, run);
  const extra = {};
  if (facId === 'arena') { extra.maxTurns = 3; extra.judge = judgeArena; }
  if (facId === 'palace') { extra.autoAlly = true; }
  const b = new BattleScene({
    kind: 'trainer', trainer, returnTo: ow, rt: false,
    facility: facilityOpts(run, team, extra),
  });
  b.onEnd = (won, fled) => {
    if (!won || fled) {
      const closedAt = run.streak;
      closeRun(state);
      g.ui.say(['The streak closes at ' + closedAt + '. The desk writes it down — bests are kept, and the ' + FACILITIES[facId].name + ' will test you again whenever you ask.'], () => {}, FACILITIES[facId].name.toUpperCase() + ' DESK');
      return;
    }
    run.streak++;
    const rec = state.frontier.records[facId];
    rec.totalWins++;
    if (run.streak > rec.bestStreak) rec.bestStreak = run.streak;
    if (FACILITIES[facId].healBetween) healTeam(team);
    const after = () => {
      if (facId === 'factory') factorySwapOffer(g, ow, trainer, () => setBoundary(g, ow));
      else setBoundary(g, ow);
    };
    if (tier) awardSymbol(g, facId, tier, after);
    else after();
  };
  g.scenes.push(b);
  b.enter();
}

// After each battle: inside a set, the next battle launches at once;
// at a set boundary the player chooses Continue / Rest / Retire.
function setBoundary(g, ow) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run) return;
  const fac = FACILITIES[run.facility];
  if (run.streak % fac.setSize !== 0) { launchSetBattle(g, ow); return; }
  g.ui.say(['Set complete — ' + run.streak + ' straight. The desk offers the honest three choices.'], () => {
    g.ui.showMenu('Streak ' + run.streak + ' at the ' + fac.name, [
      { label: 'Continue the streak', value: 'continue' },
      { label: 'Rest (run saved)', value: 'rest' },
      { label: 'Retire the run', value: 'retire' },
    ], (v) => {
      if (v === 'continue') launchSetBattle(g, ow);
      else if (v === 'rest') g.ui.say(['Rested and recorded at ' + run.streak + '. The desk will resume this run the moment you ask.'], () => {}, fac.name.toUpperCase() + ' DESK');
      else if (v === 'retire') { closeRun(state); g.ui.say(['Retired at ' + run.streak + '. A clean sheet for next time.'], () => {}, fac.name.toUpperCase() + ' DESK'); }
    });
  }, fac.name.toUpperCase() + ' DESK');
}

// ------------------------------------------------------------------
// Arena judge (data-authored scoring; the battle feeds the inputs)
// ------------------------------------------------------------------

// Mind = distinct moves used (cap 4) · Skill = attacks landed
// (cap 6) · Body = round(3 x team's remaining HP fraction).
// Higher total wins; a TIE resolves as challenger loss (recorded
// adaptation — the Frontier demands a winner). Stamps totals on the
// stat objects so the battle can speak the card.
export function arenaScore(s) {
  return {
    mind: Math.min(4, (s.movesUsed || []).length),
    skill: Math.min(6, s.landed || 0),
    body: Math.round(3 * (s.hpFrac || 0)),
  };
}
export function judgeArena(allyStats, foeStats) {
  const a = arenaScore(allyStats); const f = arenaScore(foeStats);
  allyStats.parts = a; foeStats.parts = f;
  allyStats.total = a.mind + a.skill + a.body;
  foeStats.total = f.mind + f.skill + f.body;
  return allyStats.total > foeStats.total ? 'win' : 'loss';
}

// ------------------------------------------------------------------
// Factory: draft + swap
// ------------------------------------------------------------------

// foeLevel for the Factory is the top level among the player's ABLE
// party (no team is entered — that is the Factory's whole point).
function factoryDraft(g, ow) {
  const state = g.state;
  const able = state.party.filter((m) => m && !m.egg && m.hp > 0);
  if (!able.length) {
    g.ui.say(['Even borrowed partners need a trainer standing upright. Come back with at least one able partner in your party.'], () => {}, 'BATTLE FACTORY DESK');
    return;
  }
  const foeLevel = Math.max(...able.map((m) => m.level));
  const pool = [...FACILITIES.factory.pools];
  const candidates = [];
  while (candidates.length < 6) {
    const sp = pool.splice(Math.floor(g.rng.misc() * pool.length), 1)[0];
    candidates.push(makeMon(sp, foeLevel, SPECIES, MOVES));
  }
  const partyJson = JSON.stringify(state.party); // the byte-identity proof rides the run (tests assert it)
  const picked = [];
  const step = () => {
    if (picked.length === 3) {
      const run = newRun('factory', foeLevel, []);
      run.rentals = picked;
      run.realPartyNote = partyJson;
      state.frontier.run = run;
      healTeam(picked);
      g.ui.say(['Drafted and stamped. Those three are yours until the streak says otherwise — your own partners rest, untouched.'],
        () => launchSetBattle(g, ow), 'BATTLE FACTORY DESK');
      return;
    }
    const rest = candidates.filter((m) => !picked.includes(m));
    g.ui.showMenu('Draft rental ' + (picked.length + 1) + ' of 3 (of 6)', rest.map((m) => ({
      label: SPECIES[m.speciesId].name + ' Lv' + m.level, value: m.monId,
    })), (v) => {
      if (v === null || v === undefined) return;
      picked.push(candidates.find((m) => m.monId === v));
      step();
    });
  };
  g.ui.say(['Six rentals on the table, all stamped Lv' + foeLevel + ' to match your best. Pick three — choose like you mean it.'], step, 'BATTLE FACTORY DESK');
}

// After a Factory WIN: the swap offer — one of the foe's team for
// one of the player's rentals, or decline. The received rental is a
// fresh Factory stamp of the species faced (the Factory re-issues
// rentals between rounds; recorded in the register).
function factorySwapOffer(g, ow, foeTrainer, cb) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run || !run.rentals) { cb(); return; }
  g.ui.say(['Factory rules: you may trade one of your rentals for one of the team you just beat — or keep your three.'], () => {
    const items = foeTrainer.team.map((t, i) => ({ label: 'Take their ' + SPECIES[t.species].name, value: i }));
    items.push({ label: 'Keep my team', value: -1 });
    g.ui.showMenu('Swap a rental?', items, (v) => {
      if (v === null || v === undefined || v === -1) { cb(); return; }
      const taken = foeTrainer.team[v];
      const mine = run.rentals.map((m, i) => ({ label: 'Give up my ' + SPECIES[m.speciesId].name, value: i }));
      g.ui.showMenu('Exchange which rental?', mine, (w) => {
        if (w === null || w === undefined) { cb(); return; }
        run.rentals[w] = makeMon(taken.species, run.foeLevel, SPECIES, MOVES);
        healTeam(run.rentals);
        g.ui.say(['Stamped and swapped. The ' + SPECIES[taken.species].name + ' fights for you now.'], cb, 'BATTLE FACTORY DESK');
      });
    });
  }, 'BATTLE FACTORY DESK');
}

// ------------------------------------------------------------------
// Dome: the 16-entrant tournament
// ------------------------------------------------------------------

// Team power for the simulated matches: the sum of the entrants'
// level-scaled stat totals (built from real mons at foeLevel).
export function teamPower(speciesIds, level) {
  let total = 0;
  for (const id of speciesIds) {
    const m = makeMon(id, level, SPECIES, MOVES);
    total += m.maxHp + m.stats.atk + m.stats.def + m.stats.spa + m.stats.spd + m.stats.spe;
  }
  return total;
}

function buildBracket(g, playerTeam) {
  const fac = FACILITIES.dome;
  const foeLevel = Math.max(...playerTeam.map((m) => m.level));
  const entrants = [{ name: 'YOU', species: playerTeam.map((m) => m.speciesId), power: teamPower(playerTeam.map((m) => m.speciesId), foeLevel) }];
  const usedNames = new Set();
  for (let i = 0; i < 15; i++) {
    let name = fac.names[Math.floor(g.rng.misc() * fac.names.length)];
    let guard = 0;
    while (usedNames.has(name) && guard++ < 50) name = fac.names[Math.floor(g.rng.misc() * fac.names.length)];
    usedNames.add(name);
    const species = pickSpecies(g, fac.pools, 3, null);
    entrants.push({ name, species, power: teamPower(species, foeLevel) });
  }
  // Seed the player at slot 0; shuffle the rest.
  const rest = entrants.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(g.rng.misc() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const all = [entrants[0], ...rest];
  return { entrants: all, round: 0, alive: all.map((_, i) => i), results: [] };
}

const DOME_ROUNDS = ['the round of 16', 'the quarter-final', 'the semi-final', 'the FINAL'];

// Simulate every non-player match of the current round; returns the
// narration lines. Winners advance; the player's pairing is skipped
// (it is a real battle).
function simRound(g, run) {
  const b = run.bracket;
  const lines = [];
  const nextAlive = [];
  for (let i = 0; i < b.alive.length; i += 2) {
    const a = b.alive[i], c = b.alive[i + 1];
    if (a === 0 || c === 0) { nextAlive.push(0); continue; } // player's pairing resolved by the real battle
    const ea = b.entrants[a], ec = b.entrants[c];
    const upset = g.rng.misc();
    let winner;
    if (ea.power === ec.power) winner = upset < 0.5 ? a : c;
    else {
      const fav = ea.power > ec.power ? a : c;
      const dog = fav === a ? c : a;
      winner = upset < 0.22 ? dog : fav; // the Dome loves an upset, but power usually tells
    }
    b.results.push({ round: b.round, a, c, winner });
    lines.push(b.entrants[winner].name + ' def. ' + b.entrants[winner === a ? c : a].name + ' (' + DOME_ROUNDS[b.round] + ').');
    nextAlive.push(winner);
  }
  b.alive = nextAlive;
  return lines;
}

function domePlayerFoeIdx(run) {
  const alive = run.bracket.alive;
  const pos = alive.indexOf(0);
  return alive[pos % 2 === 0 ? pos + 1 : pos - 1];
}

function domeNextMatch(g, ow) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run || run.facility !== 'dome' || !run.bracket) return;
  const b = run.bracket;
  const isFinal = b.round === 3;
  const foeIdx = domePlayerFoeIdx(run);
  const foeEntrant = b.entrants[foeIdx];
  const tier = isFinal ? domeMilestone(state, run.tournamentNo) : null;
  const trainer = tier ? brainTrainer('dome', tier, run.foeLevel)
    : {
      id: 'frontier-dome-' + run.tournamentNo + '-' + b.round + '-' + Math.floor(g.rng.misc() * 1e9).toString(36),
      name: foeEntrant.name, title: FACILITIES.dome.title, reward: 0,
      ai: b.round >= 2 ? 'smart' : undefined,
      team: foeEntrant.species.map((sp) => ({ species: sp, level: run.foeLevel })),
      intro: ['Dome ' + DOME_ROUNDS[b.round] + '. The crowd is already chanting somebody\'s name — make it yours.'],
      lose: ['The Dome roars for the winner. Onward, contender.'],
    };
  const team = activeTeam(state, run);
  const battle = new BattleScene({
    kind: 'trainer', trainer, returnTo: ow, rt: false,
    facility: facilityOpts(run, team),
  });
  battle.onEnd = (won, fled) => {
    if (!won || fled) {
      const finish = ['R16 exit', 'quarter-finalist', 'semi-finalist', 'finalist'][b.round] || 'entrant';
      const rec = state.frontier.records.dome;
      if (b.round > (rec.bestFinish || 0)) rec.bestFinish = b.round;
      closeRun(state);
      g.ui.say(['Out in ' + DOME_ROUNDS[b.round] + ' — a ' + finish + ' finish, written into the Dome book. The bracket plays on without you.'], () => {}, 'BATTLE DOME DESK');
      return;
    }
    healTeam(team);
    const narration = simRound(g, run);
    b.round++;
    const advance = () => {
      if (b.round > 3) {
        state.frontier.records.dome.tournamentWins++;
        if (state.frontier.records.dome.bestFinish < 4) state.frontier.records.dome.bestFinish = 4;
        closeRun(state);
        const done = () => g.ui.say(['CHAMPION OF THE DOME! Sixteen names went up; yours is the one still lit.'], () => {}, 'BATTLE DOME DESK');
        if (tier) awardSymbol(g, 'dome', tier, done); else done();
        return;
      }
      // The desk calls the next match itself (the narration line
      // promises exactly that): the bracket flows match to match
      // without a desk re-talk in between.
      g.ui.say(['You advance! Elsewhere in ' + DOME_ROUNDS[b.round - 1] + ':', ...narration, 'Next match: ' + DOME_ROUNDS[b.round] + '. The desk calls your name —'],
        () => domeNextMatch(g, ow), 'BATTLE DOME DESK');
    };
    advance();
  };
  g.scenes.push(battle);
  battle.enter();
}

function domeMilestone(state, tournamentNo) {
  const slot = symbolSlot(state, 'dome');
  const M = BRAIN_MILESTONES.dome;
  if (slot === null && tournamentNo === M.silver) return 'silver';
  if (slot === 'silver' && tournamentNo === M.gold) return 'gold';
  return null;
}

// ------------------------------------------------------------------
// Pike: pre-roll, chamber events, dais, Lucy
// ------------------------------------------------------------------

// The whole run's door table, rolled ONCE at entry from the game
// rng: events[chamber-1][door] for chambers 1..7, doors 0..2.
export function preRollPike(g) {
  const rows = [];
  for (let c = 0; c < 7; c++) {
    const row = [];
    for (let d = 0; d < 3; d++) {
      let roll = g.rng.misc() * 100;
      let kind = 'quiet';
      for (const [k, w] of PIKE_EVENT_WEIGHTS) { if (roll < w) { kind = k; break; } roll -= w; }
      row.push(kind);
    }
    rows.push(row);
  }
  return rows;
}

// Brandon waits on floor 7 of a qualifying climb: run number 3
// with the slot empty (Silver due), run number 10 with the slot
// silver (Gold due). One audience per run (brandonFaced).
export function brandonDue(state) {
  const run = state.frontier && state.frontier.run;
  if (!run || run.facility !== 'pyramid' || run.brandonFaced || run.floor !== 7) return null;
  const slot = symbolSlot(state, 'pyramid');
  const M = BRAIN_MILESTONES.pyramid;
  if (slot === null && run.runNo === M.silver) return 'silver';
  if (slot === 'silver' && run.runNo === M.gold) return 'gold';
  return null;
}

// The appended-Brain audience (Lucy / Brandon): talk -> the Brain's
// own intro -> the milestone battle -> award or the run's end.
// ==== F3 HOOK (Stage F3, Brandon possession staging) ====
// Brandon's battle here is the PLAIN milestone battle the F2 brief
// commissions. F3's two-stage possession staging attaches at THIS
// function: when F3 lands, startBrainAudience('pyramid') gains the
// pre-battle possession scene and the second-stage battle before
// falling through to launchBrainBattle below — the award, the
// brandonFaced marking and the run closing all stay shared.
export function startBrainAudience(g, facilityId, ow) {
  const state = g.state;
  const run = state.frontier && state.frontier.run;
  if (!run || run.facility !== facilityId) return;
  const tier = facilityId === 'pike' ? lucyDue(state) : brandonDue(state);
  if (!tier) return;
  const fac = FACILITIES[facilityId];
  g.ui.say(fac.brainIntro, () => launchBrainBattle(g, ow, facilityId, tier), fac.brain.toUpperCase());
}

function launchBrainBattle(g, ow, facilityId, tier) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run) return;
  if (facilityId === 'pike') run.lucyFaced = true;
  if (facilityId === 'pyramid') run.brandonFaced = true;
  const team = activeTeam(state, run);
  const trainer = brainTrainer(facilityId, tier, run.foeLevel);
  const b = new BattleScene({
    kind: 'trainer', trainer, returnTo: ow, rt: false,
    facility: facilityOpts(run, team),
  });
  b.onEnd = (won, fled) => {
    if (!won || fled) {
      closeRun(state);
      g.ui.say(['The Brain keeps the symbol — and the run closes here. The desk has written it all down.'], () => {}, FACILITIES[facilityId].name.toUpperCase() + ' DESK');
      return;
    }
    awardSymbol(g, facilityId, tier, () => {
      closeRun(state);
      g.ui.say(['The run closes in triumph — the desk strikes it in ' + tier + ' ink.'], () => {}, FACILITIES[facilityId].name.toUpperCase() + ' DESK');
    });
  };
  g.scenes.push(b);
  b.enter();
}

// ------------------------------------------------------------------
// Pike: chamber events (fired from the warp-landing hook)
// ------------------------------------------------------------------

const DOOR_NAMES = ['the left door', 'the center door', 'the right door'];

function bankPikeRooms(state) {
  const run = state.frontier.run;
  if (!run || run.facility !== 'pike' || run.banked) return;
  run.banked = true;
  const rec = state.frontier.records.pike;
  rec.totalRooms += run.rooms;
  if (run.rooms > rec.bestRun) rec.bestRun = run.rooms;
}

// Fire the pre-rolled event for (chamber, door). Chambers count as
// cleared when their event resolves (battle events: on a win or a
// clean escape; a battle loss closes the run by facility law).
export function pikeChamberEvent(g, ow, chamber, door) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run || run.facility !== 'pike' || !run.events) return;
  const kind = run.events[chamber - 1][door];
  const team = activeTeam(state, run);
  const say = (lines, cb) => g.ui.say(lines, cb || (() => {}), 'BATTLE PIKE');
  const cleared = () => { run.rooms++; };
  if (kind === 'battle-trainer' || kind === 'battle-wild') {
    const facility = { id: 'pike', partyOverride: team };
    const b = kind === 'battle-trainer'
      ? new BattleScene({ kind: 'trainer', trainer: genTrainer(g, 'pike', chamber, run.foeLevel, 2), returnTo: ow, rt: false, facility })
      : new BattleScene({ kind: 'wild', foe: makeMon(pickSpecies(g, FACILITIES.pike.pools, 1, null)[0], run.foeLevel, SPECIES, MOVES), returnTo: ow, rt: false, facility, uncatchable: true });
    b.onEnd = (won, fled) => {
      if (won) { cleared(); say(['Chamber ' + chamber + ' cleared. The serpent offers its next three doors.']); }
      else { closeRun(state); say(['The Pike closes this run here. The desk has the record — and the doors will shuffle for next time.']); }
    };
    g.scenes.push(b);
    b.enter();
    return;
  }
  cleared();
  if (kind === 'heal-full') { healTeam(team); say(['A nurse with a full tray! Your entered team is restored completely.']); }
  else if (kind === 'heal-half') {
    for (const m of team) if (m.hp > 0) m.hp = Math.min(m.maxHp, m.hp + Math.floor(m.maxHp / 2));
    say(['A nurse with a half tray — better than nothing. Your team recovers half its strength.']);
  } else if (kind === 'cure-status') {
    for (const m of team) { m.status = null; m.confused = false; }
    say(['A nurse with a remedy kit! Every status is lifted from your team.']);
  } else if (kind === 'inflict-status') {
    const target = team.find((m) => m.hp > 0 && !m.status);
    if (target) { target.status = 'poison'; say(['The nurse\'s smile was a warning unheeded — ' + (target.nickname || 'your partner') + ' was poisoned by a doctored draught!']); }
    else say(['A nurse whose smile you should not trust — but there is nothing healthy left for her to spoil.']);
  } else if (kind === 'hint') {
    if (chamber >= 7) say(['An attendant whispers: "Beyond the next doors lies the dais. Whatever waits there has been expecting you."']);
    else {
      const d = Math.floor(g.rng.misc() * 3);
      const next = run.events[chamber][d];
      say(['An attendant who loves to talk whispers: "Next chamber — behind ' + DOOR_NAMES[d] + ' waits ' + PIKE_HINT_PHRASES[next] + '."', '(The Pike\'s attendants never lie. It is the one rule of the house.)']);
    }
  } else {
    say(['Silence. Dust. Three doors onward, and nothing behind this one but the quiet.', '(Chamber ' + chamber + ' cleared.)']);
  }
}

// ------------------------------------------------------------------
// Pyramid: spots, step encounters, the bag prompt, climb end
// ------------------------------------------------------------------

function rollPyramidLoot(g) {
  let roll = g.rng.misc() * 100;
  for (const [id, w] of PYRAMID_LOOT) { if (roll < w) return id; roll -= w; }
  return 'potion';
}

export function seedPyramidSpots(g, run, mapId) {
  const cands = [...(PYRAMID_SPOT_CANDIDATES[mapId] || [])];
  const chosen = [];
  while (chosen.length < Math.min(PYRAMID_SPOTS_PER_FLOOR, cands.length)) {
    chosen.push(cands.splice(Math.floor(g.rng.misc() * cands.length), 1)[0]);
  }
  run.spots = chosen.map((c) => ({ map: mapId, x: c.x, y: c.y, kind: c.kind, item: c.kind === 'item' ? rollPyramidLoot(g) : undefined }));
  run.spotsFloor = mapId;
}

function endPyramidClimb(g, ow, line) {
  const state = g.state;
  const run = state.frontier.run;
  if (run && run.facility === 'pyramid') {
    if (run.floor > state.frontier.records.pyramid.bestFloor) state.frontier.records.pyramid.bestFloor = run.floor;
  }
  closeRun(state);
  state.frontier.pyramidBag = [];
  ow.loadMap('frontier-pyramid');
  ow.player.tx = 8; ow.player.ty = 10; ow.player.px = 8 * 16; ow.player.py = 10 * 16;
  ow.player.fx = 8; ow.player.fy = 10; ow.player.dir = 'down';
  state.story.position = { map: 'frontier-pyramid', x: 8, y: 10, dir: 'down' };
  g.ui.say([line], () => {}, 'PYRAMID KEEPER');
}

function pyramidBattle(g, ow, makeBattle) {
  const state = g.state;
  const run = state.frontier.run;
  const team = activeTeam(state, run);
  const b = makeBattle(team);
  b.onEnd = (won, fled) => {
    if (!won) endPyramidClimb(g, ow, 'The mountain gives you back. The climb is over — the keeper strikes the attempt.');
  };
  g.scenes.push(b);
  b.enter();
}

// The step hook (sysOnStep): spots first, then the floor's wilds.
// Returns true when it consumed the step (a battle started).
export function frontierOnStep(g, ow, x, y) {
  const state = g.state;
  const run = state.frontier && state.frontier.run;
  if (!run || run.facility !== 'pyramid') return false;
  const mapId = ow.mapId;
  if (!PYRAMID_FLOOR_MAPS.includes(mapId)) return false;
  const team = activeTeam(state, run);
  if (!team.length) return false; // a teamless fixture state (the F1 geometry walks) — no battles
  if (run.spotsFloor === mapId) {
    const ix = run.spots.findIndex((s) => s.x === x && s.y === y);
    if (ix >= 0) {
      const spot = run.spots[ix];
      run.spots.splice(ix, 1);
      if (spot.kind === 'item') {
        state.frontier.pyramidBag.push(spot.item);
        g.audio.playSfx('dex-register');
        g.ui.say(['Found ' + ITEMS[spot.item].name + '! It goes into the Pyramid Bag.'], () => {}, '');
        return false; // no battle — the step itself is not consumed
      }
      pyramidBattle(g, ow, (t) => new BattleScene({
        kind: 'trainer', trainer: genTrainer(g, 'pyramid', run.floor, run.foeLevel, 2), returnTo: ow, rt: false,
        facility: { id: 'pyramid', partyOverride: t, pyramidBag: true },
      }));
      return true;
    }
  }
  const tile = ow.map.rows[y] && ow.map.rows[y][x];
  if (tile === 'L' && g.rng.encounter() < PYRAMID_ENCOUNTER_RATE) {
    const sp = pickSpecies(g, FACILITIES.pyramid.pools, 1, null)[0];
    pyramidBattle(g, ow, (t) => new BattleScene({
      kind: 'wild', foe: makeMon(sp, run.foeLevel, SPECIES, MOVES), returnTo: ow, rt: false,
      facility: { id: 'pyramid', partyOverride: t, pyramidBag: true }, uncatchable: true,
    }));
    return true;
  }
  return false;
}

// The between-floors Pyramid Bag prompt: use a run-bag medicine on
// an entered mon in the field, or press on.
export function pyramidBagPrompt(g, ow, cb) {
  const state = g.state;
  const run = state.frontier.run;
  if (!run || run.facility !== 'pyramid') { cb(); return; }
  const bag = state.frontier.pyramidBag;
  const usable = [...new Set(bag)].filter((id) => ITEMS[id] && !ITEMS[id].levelUp);
  if (!usable.length) { cb(); return; }
  const team = activeTeam(state, run);
  g.ui.showMenu('Pyramid Bag — floor ' + run.floor + ' reached', [
    ...usable.map((id) => ({ label: ITEMS[id].name + ' x' + bag.filter((x) => x === id).length, value: id })),
    { label: 'Press on', value: 'on' },
  ], (v) => {
    if (v === null || v === undefined || v === 'on') { cb(); return; }
    const itemId = v;
    const it = ITEMS[itemId];
    g.ui.showMenu('Use ' + it.name + ' on...', [
      ...team.map((m, i) => ({ label: (m.nickname || 'Partner') + ' ' + m.hp + '/' + m.maxHp, value: i })),
      { label: 'Back', value: -1 },
    ], (w) => {
      if (w === null || w === undefined || w === -1) { pyramidBagPrompt(g, ow, cb); return; }
      const m = team[w];
      const consume = () => {
        const ix = bag.indexOf(itemId);
        if (ix >= 0) bag.splice(ix, 1);
      };
      // Medicine semantics ride the shipped battle applier (its
      // `this` is unused for these paths).
      if (it.ppRestore && !it.ppRestoreAll) {
        g.ui.showMenu('Restore which move?', [
          ...m.moves.map((mv, mi) => ({ label: mv.id + ' ' + mv.pp + '/' + mv.maxPp, value: mi })),
          { label: 'Back', value: -1 },
        ], (mi) => {
          if (mi === null || mi === undefined || mi === -1) { pyramidBagPrompt(g, ow, cb); return; }
          const line = BattleScene.prototype.applyMedicineTo.call({}, itemId, m, mi);
          consume();
          g.ui.say([line], () => pyramidBagPrompt(g, ow, cb), '');
        });
        return;
      }
      const line = BattleScene.prototype.applyMedicineTo.call({}, itemId, m, null);
      consume();
      g.audio.playSfx('heal');
      g.ui.say([line], () => pyramidBagPrompt(g, ow, cb), '');
    });
  });
}

// ------------------------------------------------------------------
// Warp landings + Brain appends (the overworld seams)
// ------------------------------------------------------------------

// Called from loadMap's append phase (overworld.mjs): the Brain
// audiences, appended under exactly their milestone conditions.
export function frontierBrainNpcs(state, mapId) {
  const F = state.frontier;
  if (!F || !F.run) return [];
  if (mapId === 'frontier-pike' && F.run.facility === 'pike' && lucyDue(state)) {
    return [{
      name: 'LUCY', x: LUCY_TILE.x, y: LUCY_TILE.y, art: 'lady', dir: 'down', frontierBrain: 'pike',
      skin: '#f0c8a0', shirt: '#5a2a6a', pants: '#2a2a3a', hair: '#3a2a1a',
      dialog: ['So the serpent delivers you to me at last.'],
    }];
  }
  if (mapId === 'frontier-pyramid-a' && F.run.facility === 'pyramid' && brandonDue(state)) {
    return [{
      name: 'BRANDON', x: BRANDON_TILE.x, y: BRANDON_TILE.y, art: 'hiker', dir: 'down', frontierBrain: 'pyramid',
      skin: '#e8b888', shirt: '#7a4a22', pants: '#3a3a2a', hair: '#1a1a1a',
      dialog: ['You climbed into my light, climber.'],
    }];
  }
  return [];
}

// The warp-landing funnel (doWarp -> sysWarpLanding -> here). Pike
// chamber entries key on the landing tile (F1 geometry); the
// Pyramid floor law (guard, floor counting, completion) keys on
// (from, to) map ids.
export function frontierOnWarpLanding(g, ow, to, from) {
  const state = g.state;
  const F = state.frontier;
  if (!F) return;
  const run = F.run;
  // Leaving the Pike building ends an unbanked run (banked at dais).
  if (to === 'frontierhub' && from === 'frontier-pike' && run && run.facility === 'pike') {
    bankPikeRooms(state);
    closeRun(state);
    return;
  }
  // Leaving the Pyramid hall with a climb open ends the climb.
  if (to === 'frontierhub' && from === 'frontier-pyramid' && run && run.facility === 'pyramid') {
    if (run.floor > F.records.pyramid.bestFloor) F.records.pyramid.bestFloor = run.floor;
    closeRun(state);
    F.pyramidBag = [];
    return;
  }
  if (run && run.facility === 'pike' && to === 'frontier-pike') {
    const x = ow.player.tx, y = ow.player.ty;
    if (y === PIKE_DAIS_Y) {
      bankPikeRooms(state);
      return;
    }
    const chamber = PIKE_ENTRY_ROWS[y];
    const door = PIKE_DOOR_XS.indexOf(x);
    if (chamber && door >= 0 && chamber === run.lastChamber + 1) {
      run.lastChamber = chamber;
      pikeChamberEvent(g, ow, chamber, door);
    }
    return;
  }
  if (PYRAMID_FLOOR_MAPS.includes(to)) {
    // The run gate: no active climb, no floors. The keeper returns
    // the walker to the entrance hall with the law stated plainly.
    if (!run || run.facility !== 'pyramid') {
      ow.loadMap('frontier-pyramid');
      ow.player.tx = 8; ow.player.ty = 10; ow.player.px = 8 * 16; ow.player.py = 10 * 16;
      ow.player.fx = 8; ow.player.fy = 10; ow.player.dir = 'down';
      state.story.position = { map: 'frontier-pyramid', x: 8, y: 10, dir: 'down' };
      g.ui.say(['The inner doors are barred to you. The Pyramid books climbs at the desk — no booking, no floors. That is the law of this house.'], () => {}, 'PYRAMID KEEPER');
      return;
    }
    if (from === 'frontier-pyramid') {
      run.floor = 1;
      seedPyramidSpots(g, run, to);
      return;
    }
    if (PYRAMID_FLOOR_MAPS.includes(from)) {
      if (run.floor === 7) {
        if (7 > F.records.pyramid.bestFloor) F.records.pyramid.bestFloor = 7;
        closeRun(state);
        F.pyramidBag = [];
        ow.loadMap('frontier-pyramid');
        ow.player.tx = 8; ow.player.ty = 10; ow.player.px = 8 * 16; ow.player.py = 10 * 16;
        ow.player.fx = 8; ow.player.fy = 10; ow.player.dir = 'down';
        state.story.position = { map: 'frontier-pyramid', x: 8, y: 10, dir: 'down' };
        g.ui.say(['Seven floors. The mountain bows — the climb is COMPLETE, and the keeper writes your name in the stone book.'], () => {}, 'PYRAMID KEEPER');
        return;
      }
      run.floor++;
      seedPyramidSpots(g, run, to);
      // Floor 7's Brandon: the loadMap append phase ran BEFORE this
      // hook counted the floor (doWarp loads the map, then lands),
      // so a Brandon who becomes due exactly on this landing is
      // appended to the already-loaded map here (minimal loadMap
      // stamps replicated). A save reloaded ON floor 7 catches him
      // through the loadMap append instead — both doors, one Brain.
      if (brandonDue(state)) {
        const npc = frontierBrainNpcs(state, to)[0];
        if (npc && !ow.map.npcs.some((n) => n.frontierBrain === 'pyramid')) {
          const c = { ...npc, _pk: to + ':frontier-brain', _phaseMs: 0, _face: 'down' };
          ow.map = { ...ow.map, npcs: [...ow.map.npcs, c] };
        }
      }
      pyramidBagPrompt(g, ow, () => {});
    }
  }
}

// Lucy waits on the dais when the cumulative banked rooms plus this
// run's rooms reach the next milestone AND she has not been faced
// this run (one audience per run — the run closes after her battle
// either way: a loss ends it by facility law, a win retires it in
// triumph at the desk).
export function lucyDue(state) {
  const run = state.frontier && state.frontier.run;
  if (!run || run.facility !== 'pike' || run.lucyFaced) return null;
  const total = state.frontier.records.pike.totalRooms + (run.banked ? 0 : run.rooms);
  const slot = symbolSlot(state, 'pike');
  const M = BRAIN_MILESTONES.pike;
  if (slot === null && total >= M.silver) return 'silver';
  if (slot === 'silver' && total >= M.gold) return 'gold';
  return null;
}
