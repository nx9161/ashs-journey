// arcs.mjs — the arc transition machine (ADR-027 Decision 3, roadmap
// §2.2, Stage F foundation). One generic state machine serves every arc
// boundary: finale -> ARC COMPLETE summary card + pinned directive
// ("Go home — return to Dawnwick") -> the playable journey home (the
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
  ARC_FINALE_ECHOES, FINALE_CREDITS_OPEN, FINALE_CREDITS_CLOSE, FINALE_END_CARD,
  FINALE_GRANT_ITEM_ID, FINALE_UNLOCK_FLAG,
} from '../data/arcs.mjs';
import { dexCaughtCount } from './state.mjs';
import { SPECIES } from '../data/species.mjs';
import { ITEMS } from '../data/items.mjs';

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
    dexLine: 'KinDex gained this arc: ' + gained + ' · National: ' + caught + '/' + arc.dexHorizon,
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
      ? 'Next: ' + next.label + ' · ' + next.region + ' — go home first. ' + giverName(next) + ' is waiting at Dawnwick.'
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
// HoF path) and sysLoadMap (so a legacy save that completed Arden
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
  if (!next) return ['Go home — return to Dawnwick.'];
  return [
    'Go home — return to Dawnwick.',
    'Next: ' + next.label + ' · ' + next.region + '.',
    giverName(next) + ' is waiting at home with the next leg of the journey.',
    'The way home is yours to walk — and every ferry you have ever taken still runs, both ways, free. It always will.',
  ];
}

// ---------------------------------------------------------------------------
// THE FINALE VARIANT (Arc 4 Stage S7, mission decision 10 — registry-
// driven or it doesn't ship). The trigger is a pure registry read: a
// homecoming is the finale when the directive's arc — the completed
// arc's successor — is NOT playable in this build (its registry
// status is neither 'shipped' nor 'next': a sealed future row). The
// machine names no region, no item and no unlock flag anywhere in
// this branch: the echoes, the entrusted item, the unlock flag, the
// credits frame and the end card are ALL data (src/data/arcs.mjs),
// and the credits' arc listing is built from the registry rows of
// the save's own regionsDone. A homecoming whose successor IS
// playable takes the standard ritual below, byte for byte.
// ---------------------------------------------------------------------------

// The full credits as DATA (the finale's listing): the shipped frame
// lines, one registry line per completed arc in regionsDone order
// (label + region + the arc's own league line), the road-so-far
// totals, the shipped closing lines, and the end card as the final
// lines. Presentation plays this on the same dialogue surface as
// every credits sequence in the game (CREDITS_LINES' idiom).
export function finaleCreditsLines(state) {
  const story = (state && state.story) || {};
  const done = Array.isArray(story.regionsDone) ? story.regionsDone : [];
  const lines = FINALE_CREDITS_OPEN.slice();
  let horizon = 0;
  for (const key of done) {
    const arc = arcById(key);
    if (!arc) continue;
    if (arc.dexHorizon > horizon) horizon = arc.dexHorizon;
    lines.push(arc.label + ' · ' + arc.region + ' — ' + (arc.summaryLines[0] || 'COMPLETE.'));
  }
  const caught = dexCaughtCount((state && state.dex) || { caught: {} });
  lines.push('The road so far: ' + done.length + ' journeys complete · National KinDex ' + caught + (horizon ? '/' + horizon : '') + ' · Playtime ' + fmtPlaytime(state && state.player && state.player.playtimeSec) + '.');
  lines.push(...FINALE_CREDITS_CLOSE);
  lines.push(...FINALE_END_CARD);
  return lines;
}

// The finale homecoming's committed effects — everything the finale
// writes, applied up front under the machine's commit-before-present
// law (the homecoming flag convention): the entrusted key item (once,
// never duplicated), the capstone unlock flag (set HERE and nowhere
// else — arc completion alone never sets it), and the Master Hall of
// Fame entry (the shipped story.hof shape + the master flag, team
// snapshot of the party that walked the whole road).
function commitFinale(g, completedArc) {
  const story = g.state.story;
  story.flags.finale_done = true;
  if (!g.state.bag || typeof g.state.bag !== 'object') g.state.bag = {};
  if (!(g.state.bag[FINALE_GRANT_ITEM_ID] > 0)) g.state.bag[FINALE_GRANT_ITEM_ID] = 1;
  story.flags[FINALE_UNLOCK_FLAG] = true;
  const hof = Array.isArray(story.hof) ? story.hof : (story.hof = []);
  if (!hof.some((e) => e && e.master)) {
    hof.push({
      team: (g.state.party || []).map((m) => ({ speciesId: m.speciesId, level: m.level, nickname: m.nickname })),
      badges: completedArc ? badgeCountFor(g.state, completedArc) : 0,
      master: true,
    });
  }
}

function playFinaleHomecoming(g, next, finish) {
  const story = g.state.story;
  const caught = dexCaughtCount(g.state.dex || { caught: {} });
  const done = Array.isArray(story.regionsDone) ? story.regionsDone : [];
  const completedArc = done.length ? arcById(done[done.length - 1]) : null;
  const horizon = completedArc ? completedArc.dexHorizon : 0;
  const itemName = (ITEMS[FINALE_GRANT_ITEM_ID] && ITEMS[FINALE_GRANT_ITEM_ID].name) || 'key item';
  const momLines = [
    'There\'s my champion. Sit. Eat. Tell me everything — and do not skip the parts where you were in danger. I can tell anyway.',
    'Your room is just as you left it. Some roads change a trainer. Home is not one of them — home is where the changing gets measured.',
    'Wait — before the stories. Professor Hawthorn is in the kitchen. He has been here since the ferry was sighted, pretending he was not watching the road. Some things a whole journey cannot change.',
  ];
  // One bond echo per completed arc, read from regionsDone — the
  // machine iterates; the lines themselves are data keyed by arc id.
  const echoLines = [];
  for (const key of done) {
    const line = ARC_FINALE_ECHOES[key];
    if (line) echoLines.push(line);
  }
  const oakLines = [
    'The Professor looks at the KinDex counter the way other people look at tide charts — as if it personally owed him money and had finally paid. "'
      + caught + (horizon ? ' of ' + horizon : '') + '," he says. "The whole horizon. I have rated KinDexes for forty years, and I am telling you plainly: there is nothing left on my chart to measure you against. You ARE the chart now."',
    '"One thing remains in my keeping, and it was never really mine." From a cloth older than the lab he unwraps a flute of clear blue glass. "The ' + itemName + '. It answers at the top of the world, where the first room is. Every other trainer I ever sent out, I sent with a beginning. You are the first I am sending with an ending — go and see what it opens."',
    'Received the ' + itemName.toUpperCase() + '!',
  ];
  g.ui.say(momLines, () => {
    if (echoLines.length) {
      g.ui.say(echoLines, () => {
        g.ui.say(oakLines, () => {
          if (next.hookLines && next.hookLines.length) {
            g.ui.say(next.hookLines.slice(), () => {
              finish();
              g.ui.say(finaleCreditsLines(g.state), null, '');
            }, giverName(next));
          } else {
            finish();
            g.ui.say(finaleCreditsLines(g.state), null, '');
          }
        }, 'PROF. HAWTHORN');
      }, 'MOM');
    } else {
      g.ui.say(oakLines, () => {
        finish();
        g.ui.say(finaleCreditsLines(g.state), null, '');
      }, 'PROF. HAWTHORN');
    }
  }, 'MOM');
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
// FINALE (Stage S7): when the sealed successor is a FUTURE row, the
// homecoming is the end of the whole road, not of one arc — it plays
// the finale variant above instead (bond echoes, the entrusting, the
// full credits, the Master HoF entry), with the same sealed finish.
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
    'Professor Hawthorn rang while you were on the road: "Tell them the KinDex stands at ' + caught
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
  // Stage S7: the finale trigger — a pure registry read on the
  // successor row (playable = 'shipped' or 'next'; anything else is
  // a sealed future the road has not reached). No region is named.
  const successorPlayable = next.status === 'shipped' || next.status === 'next';
  if (!successorPlayable && next.future) {
    const doneKeys = Array.isArray(story.regionsDone) ? story.regionsDone : [];
    commitFinale(g, doneKeys.length ? arcById(doneKeys[doneKeys.length - 1]) : null);
    playFinaleHomecoming(g, next, finish);
    return true;
  }
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
  return 'No sailing to ' + arc.region + ' yet — that crossing opens from home. Professor Hawthorn is waiting in Dawnwick.';
}
