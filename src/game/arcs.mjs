// arcs.mjs — the arc transition machine (ADR-027 Decision 3, roadmap
// §2.2, Stage F foundation). One generic state machine serves every arc
// boundary: finale -> ARC COMPLETE summary card + pinned directive
// ("Go home — return to Pallet Town") -> the playable journey home (the
// ferry network, §2.4) -> the Homecoming at Mom's house -> the Embark.
// Everything arc-specific is registry data (src/data/arcs.mjs); this
// module names NO region in its logic.
//
// Amendment 1 (owner overrule): the transition NEVER touches the party,
// levels, items, money, dex or honors — the team carries at full
// strength, unconditionally. The machine moves flags and story.arc only.

import {
  ARCS, arcById, nextArcOf, currentArcOf, arcCompletionMet, badgeCountFor,
  ARC_GIVER_NAMES, HOME_MAP_ID,
} from '../data/arcs.mjs';
import { dexCaughtCount } from './state.mjs';
import { SPECIES } from '../data/species.mjs';

function giverName(arc) {
  if (!arc || !arc.hookGiver) return 'Professor Hawthorn';
  return ARC_GIVER_NAMES[arc.hookGiver] || 'Professor Hawthorn';
}

function fmtPlaytime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}

// The ARC COMPLETE summary as DATA (the card's fields, roadmap §2.3) —
// presentation consumes this; tests assert on it directly.
export function arcCompleteSummary(state, arc) {
  const story = state.story || {};
  const caught = dexCaughtCount(state.dex || { caught: {} });
  const gained = Math.max(0, caught - (story.arcDexStart || 0));
  const badges = badgeCountFor(state, arc);
  const playSec = Math.max(0, (state.player && state.player.playtimeSec || 0) - (story.arcStartPlaytime || 0));
  const hof = Array.isArray(story.hof) ? story.hof : [];
  const team = hof.length
    ? hof[hof.length - 1].team
    : (state.party || []).map((m) => ({ speciesId: m.speciesId, level: m.level, nickname: m.nickname }));
  const next = nextArcOf(arc.id);
  return {
    arcId: arc.id,
    title: arc.label.toUpperCase() + ' — ' + arc.region.toUpperCase() + ' · COMPLETE',
    badgeLine: 'Badges: ' + badges + '/' + arc.badgeTotal,
    leagueLines: arc.summaryLines.slice(),
    dexLine: 'Pokedex gained this arc: ' + gained + ' · National: ' + caught + '/' + arc.dexHorizon,
    dexGained: gained,
    dexCaught: caught,
    team,
    teamLine: team.length
      ? 'Hall of Fame team: ' + team.map((m) => {
        const sp = SPECIES[m.speciesId];
        return (m.nickname || (sp ? sp.name : m.speciesId)) + ' Lv' + m.level;
      }).join(' · ')
      : '',
    playtimeLine: 'Playtime this arc: ' + fmtPlaytime(playSec),
    forwardLine: next
      ? 'Next: ' + next.label + ' · ' + next.region + ' — go home first. ' + giverName(next) + ' is waiting at Pallet Town.'
      : 'The road ahead is unwritten — future arcs wait beyond the horizon.',
    nextArcId: next ? next.id : null,
  };
}

// The card itself, in the game's ending idiom (a dialogue card — the
// same surface CREDITS_LINES play on — so every headless drive that can
// drain the credits can drain this; the portrait plate lives in the
// Hall of Fame viewer, which reads the same story.hof the card cites).
export function showArcCompleteCard(g, arc, done) {
  const s = arcCompleteSummary(g.state, arc);
  const lines = [s.title, s.badgeLine, ...s.leagueLines, s.dexLine];
  if (s.teamLine) lines.push(s.teamLine);
  lines.push(s.playtimeLine, s.forwardLine);
  g.ui.say(lines, () => { if (done) done(); }, '');
}

// The finale check (roadmap §2.2 steps 1-2). When the current arc's
// completion predicate holds and its card has not fired, this fires
// ONCE (flag arc_card_<id>): records the arc in story.regionsDone,
// shows the ARC COMPLETE card, and pins the directive on the next arc.
// Returns true iff the card fired. Call sites: runEnding (the shipped
// HoF path) and sysLoadMap (so a legacy save that completed Kanto
// before this foundation shipped gets its card on first entry).
export function checkArcCompletion(g, done) {
  if (!g || !g.state || !g.state.story) return false;
  const story = g.state.story;
  const arc = currentArcOf(g.state);
  if (!arc) return false;
  if (!story.flags || typeof story.flags !== 'object') story.flags = {};
  if (story.flags['arc_card_' + arc.id]) return false;
  if (!arcCompletionMet(g.state, arc)) return false;
  // Commit BEFORE presenting: the card fires once even if the scene is
  // interrupted, and the directive is already pinned behind it.
  story.flags['arc_card_' + arc.id] = true;
  if (!Array.isArray(story.regionsDone)) story.regionsDone = [];
  if (!story.regionsDone.includes(arc.completionKey)) story.regionsDone.push(arc.completionKey);
  const next = nextArcOf(arc.id);
  if (next && story.arc_directive == null && !story.flags['hook_' + next.id]) {
    story.arc_directive = next.id;
  }
  showArcCompleteCard(g, arc, done);
  return true;
}

// The pinned directive's own text (Quest Log selection): the next arc's
// name + who waits at home, in the roadmap's sample voice.
export function arcDirectiveLines(state) {
  const next = state && state.story ? arcById(state.story.arc_directive) : null;
  if (!next) return ['Go home — return to Pallet Town.'];
  return [
    'Go home — return to Pallet Town.',
    'Next: ' + next.label + ' · ' + next.region + '.',
    giverName(next) + ' is waiting at home with the next leg of the journey.',
    'The way home is yours to walk — and every ferry you have ever taken still runs, both ways, free. It always will.',
  ];
}

// The Homecoming (roadmap §2.2 step 4): with the directive active,
// entering Mom's house fires once — Mom's welcome, the arc summary in
// fiction (the Professor's dex rating, relayed), then the next arc's
// hook delivered in person from registry data. Completing it clears
// the directive, sets story.arc to the next arc, stamps the arc-start
// snapshots, and sets hook_<next> + embark_<next>.
// SEALED next arc (registry status 'sealed'): the ritual still
// completes honestly — hook delivered, hook_<next> set, directive
// cleared — but story.arc does NOT advance and NO embark flag is set:
// the Journey menu shows that arc as the road ahead (sealed), and
// there is no dangling directive and no fake embark.
// Returns true iff the homecoming fired.
export function tryHomecoming(g) {
  if (!g || !g.state || !g.state.story) return false;
  const story = g.state.story;
  const nextId = story.arc_directive;
  if (!nextId) return false;
  const next = arcById(nextId);
  if (!next) { story.arc_directive = null; return false; }
  if (story.flags['homecoming_' + nextId]) return false;
  story.flags['homecoming_' + nextId] = true; // fire-once, set up front
  const caught = dexCaughtCount(g.state.dex || { caught: {} });
  const momLines = [
    'There\'s my champion. Sit. Eat. Tell me everything — and do not skip the parts where you were in danger. I can tell anyway.',
    'Your room is just as you left it. Some roads change a trainer. Home is not one of them — home is where the changing gets measured.',
  ];
  const ratingLines = [
    'Professor Hawthorn rang while you were on the road: "Tell them the Pokedex stands at ' + caught
      + ' — and tell them I said the next page is always the best one."',
  ];
  const finish = () => {
    story.flags['hook_' + next.id] = true;
    story.arc_directive = null;
    if (next.status !== 'sealed') {
      story.arc = next.id;
      story.region = next.regionKey;
      story.arcDexStart = caught;
      story.arcStartPlaytime = (g.state.player && g.state.player.playtimeSec) || 0;
      story.flags['embark_' + next.id] = true;
    }
  };
  g.ui.say(momLines, () => {
    g.ui.say(ratingLines, () => {
      if (next.hookLines && next.hookLines.length) {
        g.ui.say(next.hookLines.slice(), () => {
          finish();
          if (next.status === 'sealed') {
            g.ui.say(['That road is drawn on the map, but it is not built yet — it waits, sealed, with your name on it. Rest first. Home will keep, and so will the sea.'], null, 'MOM');
          }
        }, giverName(next));
      } else {
        finish();
      }
    }, 'MOM');
  }, 'MOM');
  return true;
}

// The ferry-network rule (roadmap §2.4), as one pure decision the NPC
// handler consults: an NPC carrying ferryArc: '<arcId>' offers travel
// only when the crossing has been unlocked — the embark is armed
// (embark_<id>, set by the homecoming) OR the destination arc has been
// reached before (reachedarc_<id>, set by any completed crossing, or
// the arrival map's reached_<map> flag from any arrival). Returns are
// therefore unconditional once a region is reached — the NO-SOFT-LOCK
// LAW — while a gated outbound stays gated until the embark.
export function arcFerryAllowed(state, npc) {
  if (!npc || !npc.ferryArc) return { allowed: true, arc: null };
  const arc = arcById(npc.ferryArc);
  if (!arc) return { allowed: false, arc: null };
  const flags = (state && state.story && state.story.flags) || {};
  if (flags['embark_' + arc.id]) return { allowed: true, arc };
  if (flags['reachedarc_' + arc.id]) return { allowed: true, arc };
  if (arc.arrivalMap && flags['reached_' + arc.arrivalMap]) return { allowed: true, arc };
  return { allowed: false, arc };
}

export function arcFerryGateLine(arc) {
  if (!arc) return 'That crossing is not running yet.';
  return 'No sailing to ' + arc.region + ' yet — that crossing opens from home. Professor Hawthorn is waiting in Pallet Town.';
}
