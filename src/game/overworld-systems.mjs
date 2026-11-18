// overworld-systems.mjs — the campaign + parity systems layer (WS6/WS9):
// story event interpreter + quest log state, item balls + hidden items,
// field moves (Cut/Surf/Strength/Flash/Fly), fishing, poison walk damage,
// Bramble Preserve session, Game Corner slots + prizes, PC boxes, marts, NPC
// trades/gifts/revival/ferry, evolution execution, blackout handling.
// Attached to OverworldScene.prototype; overworld.mjs calls the sys* hooks.

import { MAPS, TRAINERS, WALKABLE } from '../data/maps.mjs';
import { TILE_CHARS } from '../engine/tiles.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS, BADGE_SETS, HM_GRANTS } from '../data/items.mjs';
import { grantKeepsake, grantKeepsakeFromSource, dupeKeepsakeLine, DUPE_KEEPSAKE_CASH, ownsKeepsake } from './keepsakes.mjs';
import { hasTravelersMemory } from './state.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, evolutionCheck, boxCheck, grantPartnerMon, hasPartnerMon, currentQuestOf } from './state.mjs';
import { sparLevelFor } from './rules.mjs';
import { BattleScene } from './battle.mjs';
import { resolveStartPos } from './start-pos.mjs';
import { EvolutionScene, HatchScene } from './evolution.mjs';
import { ContestScene, hasRibbon } from './contest.mjs';
import { startFrontier, startBrainAudience, talkFrontierScott, tryScottClosing, frontierOnWarpLanding, frontierOnStep } from './frontier.mjs';
import { PYRAMID_FLOOR_MAPS } from '../data/frontier.mjs';
import { RIBBON_NAMES, CONTEST_RANKS } from '../data/contest.mjs';
import { switchForme, FORME_FAMILIES, FORME_OF, SPARKIMP_APPLIANCES, partyKnowsFieldMove, badgeHeld } from './sinnoh-systems.mjs';
import { EVENTS, MAIN_QUESTS, LEGENDARY_ARCS, CREDITS_LINES } from '../data/story-kanto.mjs';
import { ORANGE_QUESTS } from '../data/story-orange.mjs';
import { JOHTO_QUESTS } from '../data/story-johto.mjs';
import { HOENN_QUESTS } from '../data/story-hoenn.mjs';
import { SINNOH_QUESTS, roamLanding, EMPATHIS_LANDINGS, LUNACYGN_LANDINGS, HALLOWED_TOWER } from '../data/story-sinnoh.mjs';
import { DIVE_PAIRS } from '../data/maps7.mjs';
import { QUESTS, taleSpotAt, taleStageOf, taleStatus, acceptTale, advanceTale, completeTale, IOU_PRIORITY } from '../data/quests.mjs';
import { applyBond, applyBondOnce, bondOf, bondSceneLines, bondTrainerVariant, recordBattleBond, tierAtLeast, takeEchoGreeting, ECHO_LINE, BOND_NPC_IDS } from './bonds.mjs';
import { CHAPTERS } from '../data/story.mjs';
import { PANELS } from '../data/panels.mjs';
import { statValue, hpValue } from '../engine/formulas.mjs';
import { levelCapFor, HOME_MAP_ID, currentArcOf } from '../data/arcs.mjs';
import { checkArcCompletion, tryHomecoming, arcFerryAllowed, arcFerryGateLine, arcEnRoutePanel } from './arcs.mjs';
import {
  ensureJohtoSystems, johtoStepTick, apricornTreeAt, pickApricorn, tradeEvolutionsOf,
  depositToDaycare, withdrawFromDaycare, collectDaycareEgg, giveStoryEgg, pairCompatible, deliverEggCapSafe,
  APRICORN_IDS, APRICORN_TO_BALL, kurtOrderStatus, kurtPlaceOrder, kurtCollect,
} from './johto-systems.mjs';

export const BOX_COUNT = 12;
export const BOX_CAP = 30; // UI v2.4: Platinum's 30 — matches the save validator's limit (was 20)
const FOSSIL_OF = { helixfossil: 'omanyte', domefossil: 'kabuto', oldamber: 'aerodactyl' };

export function key(x, y) { return x + ',' + y; }
export function rtOf(game) { return game.state.settings.battleStyle !== 'classic'; }

Object.assign(OverworldScene.prototype, {
  // ---------- map lifecycle ----------
  // Arc 3.5 Stage F2: the warp-landing seam (overworld.mjs doWarp
  // calls this for EVERY warp) — routes to the Frontier controller
  // (Pike chamber entries, Pyramid floor law).
  sysWarpLanding(to, from) {
    frontierOnWarpLanding(this.game, this, to, from);
    // Arc 4 Stage S4: the Safari session's map law, generic over the
    // session's own data (maps/hub/exit planted by the gate NPC's
    // map-data config — the Arden session carries maps ['safari'] and
    // no hub, and its behaviour is unchanged). Landing in the hub
    // ends the visit (the player walked back to the gatehouse);
    // landing anywhere outside the zone while a session stands ends
    // it too. Landing IN a zoned map with NO session bounces back to
    // the hub: the zone is entered through its gate, never by a warp.
    const g = this.game;
    const saf = g.state.session && g.state.session.safari;
    if (saf) {
      // Zone-style sessions (a hub is planted) end on hub/outside
      // landings, as shipped.
      if (saf.hub && to === saf.hub && from !== saf.hub) { this.endSafari('You left the ' + (saf.name || 'Bramble Preserve') + '.'); return; }
      if (saf.hub && !(saf.maps || []).includes(to) && to !== saf.hub) this.endSafari('You left the ' + (saf.name || 'Bramble Preserve') + '.');
      // REGION-1 FIX WAVE (Bug 3): hub-less sessions (the Arden
      // Preserve) used to keep "exact legacy warp behaviour" — the
      // leak: the Preserve's own door warps land in Bramble with no
      // cleanup, so the session, its step HUD and the Safari Balls
      // followed the player out (completion runs 3/4, observed on
      // Crown Road). A landing outside the zone now ends a hub-less
      // session IN PLACE — the warp already delivered the player to
      // the exit town, so only the session state is wound up.
      if (!saf.hub && !(saf.maps || []).includes(to)) this.endSafariInPlace('You left the ' + (saf.name || 'Bramble Preserve') + '.');
      return;
    }
    const dest = MAPS[to];
    if (dest && dest.safariZone) {
      const hubId = Object.keys(MAPS).find((id) => MAPS[id].safariHub === dest.safariZone);
      const hub = hubId && MAPS[hubId];
      if (hub) {
        const st = resolveStartPos(hub, null);
        this.loadMap(hubId);
        this.player.tx = st.x; this.player.ty = st.y;
        this.player.px = st.x * TILE; this.player.py = st.y * TILE;
        this.player.fx = st.x; this.player.fy = st.y;
        this.trail = [];
        g.state.story.position = { map: hubId, x: st.x, y: st.y, dir: 'down' };
        this.banner = { text: hub.name.toUpperCase(), t: 1.6 };
        g.ui.say(['The gatehouse warden waves you back: "The marsh is entered at the gate, friend — fee, balls, and a fair warning included. No slipping in the back way."']);
      }
    }
  },

  sysLoadMap(id) {
    const g = this.game;
    // Arc 4 Stage S4: Defog's cleared-fog flag is per-visit — loading
    // any other map lets the fog back (canon: the fog returns when
    // you leave the area). The flag lives in story.flags (the map-flag
    // idiom), so a save made mid-visit keeps its cleared sky.
    for (const k of Object.keys(g.state.story.flags)) {
      if (k.startsWith('defogged_') && k !== 'defogged_' + id) delete g.state.story.flags[k];
    }
    this.fxState = {
      cut: new Set(),           // cut trees (regrow on map re-entry, as the original)
      boulders: new Map(),      // 'x,y' -> {x,y} current boulder positions
      strengthOn: false,
      flashLit: false,
    };
    if (this.map) {
      for (let y = 0; y < this.map.rows.length; y++) {
        for (let x = 0; x < this.map.rows[y].length; x++) {
          if (this.map.rows[y][x] === 'B') this.fxState.boulders.set(key(x, y), { x, y });
        }
      }
      // REGION-1 FIX WAVE (Bug 2 — Fly was dead): the visited_<id>
      // writer keyed on a `centerCity` map field that NO map in any
      // region defines, so no town was ever marked visited and Fly's
      // destination list was always empty. The design's own record of
      // "a place the player can fly back to" is the Center door:
      // exactly 64 towns/hubs across all five regions + the Trial
      // Grounds field a warp into the shared 'center' interior (the
      // same 64 that field a Mart door — census in the wave SPEC).
      // Derive the mark from that warp, game-wide, with no data edits;
      // an explicit centerCity field, if ever authored, still counts.
      if (this.map.centerCity || (this.map.warps || []).some((w) => w.to && w.to.map === 'center')) {
        g.state.story.flags['visited_' + id] = true;
      }
    }
    if (g.state.story.flags['in_' + id] === undefined) g.state.story.flags['in_' + id] = true;
    g.state.story.flags['reached_' + id] = true; // quest chain producers (WS6)
    // REGION-1 FIX WAVE (Bug 3): a DIRECT load that lands a hub-less
    // safari session outside its zone — Fly-out, a blackout's Center
    // load, or Continue on a save written mid-leak (the run-4 save
    // carried a live session onto Crown Road) — ends the session in
    // place. Silent wind-up + a toast: loadMap runs inside other
    // flows' dialogue callbacks (the blackout's say), where a nested
    // dialogue would interleave. The door-warp landing performs the
    // spoken version in sysWarpLanding.
    {
      const saf = g.state.session && g.state.session.safari;
      if (saf && !saf.hub && !(saf.maps || []).includes(id)) {
        const left = this.clearSafariSession();
        if (left > 0) g.ui.toast('The park keeps the ' + left + ' unused Safari Balls.');
      }
    }
    // ADR-025 §6 (Traveler's Memory): the Farsight gate, remembered.
    // The shipped game never posted a guard at Farsight's doors (the
    // city is entered freely), so the memory surfaces as the city
    // itself acknowledging the returning traveler — once, on the
    // first arrival of a journey that carries it. Door-keeping only:
    // no beat, battle, or badge is touched.
    if (id === 'saffron' && hasTravelersMemory(g.state, 'saffron-guard')
      && !g.state.story.flags.echo_saffron_guard) {
      g.state.story.flags.echo_saffron_guard = true;
      g.ui.say(['The Farsight gate attendant looks up from his thermos — then waves you straight through, drink and all. "Go on," he says. "City remembers you."']);
    }
    // ADR-025 §6 (Traveler's Memory): the Card Key route, remembered.
    // Like Farsight, the shipped game never actually gates Vantage on
    // the Card Key (the warps run either way), so the memory is pure
    // acknowledgment — once, on the first Vantage entry of a journey
    // that carries it. No gate is claimed, none is lifted.
    if ((id === 'silph1' || id === 'silph2') && hasTravelersMemory(g.state, 'card-key')
      && !g.state.story.flags.echo_card_key) {
      g.state.story.flags.echo_card_key = true;
      g.ui.say(['The lobby doors part, and your feet are already sure of the way — the key by the plants, the lift, the long climb. You walked Vantage once with a Card Key in hand. The building feels smaller when you know its route by heart.']);
    }
    // ADR-027 (Stage F): the arc transition machine's map-entry hooks.
    // The completion check runs first (a legacy save that finished
    // Arden before this foundation shipped gets its ARC COMPLETE card
    // on first entry, exactly once — the flag guards every later
    // load); the homecoming fires on entering Mom's house with the
    // directive pinned, and only when the card did not just fire.
    const arcCardFired = checkArcCompletion(g);
    if (!arcCardFired && id === HOME_MAP_ID) tryHomecoming(g);
    // Stage F4: Scott's closing beat — the Frontier controller's own
    // map-entry check, on this same seam (it gates itself on Dawnwick
    // Town + frontier_complete + its fire-once flag, and yields to
    // the ARC COMPLETE card exactly as the homecoming does).
    if (!arcCardFired) tryScottClosing(g, id); this.maybePlayParleyEnter(g, id, arcCardFired); // Wave ACT: the Canopy parley pair arrive.
    // Stage O2 (Amber story): map-entry scenes, flag-gated once each.
    // Ivy's intro fires on FIRST entry to her lab; KELPSAIL fires on
    // Marisol once the first Amber badge is held; the pod reunion
    // fires pre-League (4 badges) on Grapefruit / the north sea. Each
    // scene's own completion flag is the gate, so a stalled chain
    // (e.g. a gift that found no room) re-fires on a later entry
    // instead of soft-failing.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const of = g.state.story.flags;
      const oBadges = (g.state.badges && g.state.badges.orange) || [];
      if (id === 'ivy-lab' && !of.orange_gsball && !of.ev_orange_ivy_done) {
        this.runEvent('ev_orange_ivy');
      } else if (id === 'valencia' && oBadges.length >= 1 && !of.orange_lapras_joined) {
        this.runEvent('ev_orange_lapras');
      } else if ((id === 'pummelo' || id === 'orange-sea-north') && oBadges.length >= 4
        && of.orange_lapras_joined && !of.orange_lapras_pod) {
        this.runEvent('ev_orange_lapras_pod');
      }
    }
    // Stage O3 (Pokemon 2000): the Sanctum storm chain. The trigger
    // is chronology-true mid-arc — first Sanctum arrival with the
    // Sea Ruby held (>= 2 Amber badges) — and is NEVER a gym
    // blocker: nothing here gates badges 3/4, Drake, or the machine's
    // league flow. Each scene's own flag is its gate, so a chain
    // stalled by a flee or a blackout re-fires on a later entry
    // (the runSteps fled guard leaves the done flag unwritten).
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const of = g.state.story.flags;
      const oBadges = (g.state.badges && g.state.badges.orange) || [];
      const titans = (of.orange_2000_moltres ? 1 : 0) + (of.orange_2000_zapdos ? 1 : 0) + (of.orange_2000_articuno ? 1 : 0);
      if (id === 'shamouti' && oBadges.length >= 2 && !of.orange_2000_active && !of.ev_orange_2000_storm_done) {
        this.runEvent('ev_orange_2000_storm');
      } else if (id === 'shamouti-shrine' && of.orange_2000_active && titans >= 3
        && !of.orange_2000_storm_stilled && !of.ev_orange_2000_climax_done) {
        this.runEvent('ev_orange_2000_climax');
      } else if (id === 'shamouti-deep' && of.orange_2000_storm_stilled
        && !of.orange_2000_lugia_done && !of.ev_orange_2000_lugia_done) {
        this.runEvent('ev_orange_2000_lugia');
      }
    }
    // Stage J5 (legendary arcs + hideout re-home): map-entry scenes,
    // same idiom — every legendary face is gated on its arc's own
    // progress flags (never on the event-done flag alone), and the
    // catch-only chain (wildBattleCatch) leaves everything unwritten
    // on a flee or a KO, so each face re-fires until the catch.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const jf = g.state.story.flags;
      if (id === 'r29' && g.state.story.arc === 'johto' && !jf.hooh_history && !jf.hooh_glimpsed && !jf.ev_johto_hooh_glimpse_done) {
        this.runEvent('ev_johto_hooh_glimpse');
      } else if (id === 'rocket-hideout' && jf.red_gyarados_done && !jf.johto_hideout_cleared && !jf.ev_johto_hideout_done) {
        // The J4b descent, re-homed: the same event, now staged on
        // the hideout map itself (entry via Lance or the shop stairs).
        this.runEvent('ev_johto_hideout');
      } else if (id === 'national-park' && jf.arc_raikou_sign1 && jf.arc_raikou_sign2 && !jf.arc_raikou_done && !jf.ev_johto_raikou_done) {
        this.runEvent('ev_johto_raikou');
      } else if (id === 'mt-mortar-2' && jf.arc_entei_sign1 && jf.arc_entei_sign2 && !jf.arc_entei_done && !jf.ev_johto_entei_done) {
        this.runEvent('ev_johto_entei');
      } else if (id === 'bell-tower-1' && jf.arc_suicune_sign1 && jf.arc_suicune_sign2 && jf.arc_raikou_done && jf.arc_entei_done && !jf.arc_suicune_done && !jf.ev_johto_suicune_done) {
        this.runEvent('ev_johto_suicune');
      } else if (id === 'bell-tower-2' && jf.hooh_bell_received && !jf.arc_hooh_done && !jf.ev_johto_hooh_done) {
        this.runEvent('ev_johto_hooh');
      }
    }
    // Stage J4a (Yamato story, west): map-entry scenes, flag-gated once
    // each, in the Amber idiom — a scene's own completion flag is its
    // gate, so a stalled chain re-fires on a later entry. The Silver
    // clash additionally requires Elm's registration (the arrival
    // scene) so the thief thread can never fire before it is set up.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const jf = g.state.story.flags;
      if (id === 'elm-lab' && !jf.johto_arrival && !jf.ev_johto_arrival_done) {
        this.runEvent('ev_johto_arrival');
      } else if (id === 'r30' && jf.johto_arrival && !jf.silver_r30_done && !jf.ev_johto_silver_r30_done) {
        this.runEvent('ev_johto_silver_r30');
      } else if (id === 'slowpoke-well' && !jf.kurt_well_plea && !jf.ev_johto_well_done) {
        this.runEvent('ev_johto_well');
      } else if (id === 'burned-tower-2' && !jf.beasts_awakened && !jf.ev_johto_burned_done) {
        this.runEvent('ev_johto_burned');
      }
    }
    // Stage J4b (Yamato story, east): map-entry scenes, same idiom —
    // each scene's own completion flag is its gate, so a fled or lost
    // beat re-fires on a later entry and completes nothing early.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const jf = g.state.story.flags;
      const jBadgeN = ((g.state.badges && g.state.badges.johto) || []).length;
      if (id === 'lake-of-rage' && !jf.red_gyarados_done && !jf.ev_johto_redgyarados_done) {
        this.runEvent('ev_johto_redgyarados');
      } else if (id === 'ilex-forest' && jf.silver_reported && jf.badge_fog && !jf.silver_ilex_done && !jf.ev_johto_silver_ilex_won_done && !jf.ev_johto_silver_ilex_lost_done) {
        // Silver's second clash BRANCHES on the Route 30 outcome:
        // the won/lost flag from J4a picks the staging (his lines
        // differ; the battle and its own branch flags are shared).
        this.runEvent(jf.silver_r30_won ? 'ev_johto_silver_ilex_won' : 'ev_johto_silver_ilex_lost');
      } else if (id === 'route-silver' && jBadgeN < 8) {
        // The badge gate: an official's word + the warp home. Fires
        // on every under-badged entry (its own scene flag is never
        // the gate — the badge count is), so it can never be
        // bypassed by having seen it once, and never strands: the
        // warp lands on Cragmoor's east edge, facing the road back.
        this.runEvent('ev_johto_silver_gate');
      } else if (id === 'route-silver' && jBadgeN >= 8 && !jf.silver_route_done && !jf.ev_johto_silver_route_done) {
        this.runEvent('ev_johto_silver_route');
      } else if (id === 'radio-tower-1' && jf.johto_hideout_cleared && !jf.radio_tower_cleared && !jf.radio_f1_cleared && !jf.ev_johto_radio_takeover_done) {
        this.runEvent('ev_johto_radio_takeover');
      } else if (id === 'radio-tower-2' && jf.radio_f1_cleared && !jf.radio_tower_cleared && !jf.radio_f2_cleared) {
        // The locked floor: without the rescue, the locked-door
        // scene (once — its own flag gates it); with the Director
        // rescued, the floor's gauntlet.
        if (jf.radio_director_rescued) this.runEvent('ev_johto_radio_f2');
        else if (!jf.radio_locked_seen && !jf.ev_johto_radio_locked_done) this.runEvent('ev_johto_radio_locked');
      } else if (id === 'goldenrod-underground-2' && jf.radio_f1_cleared && !jf.radio_director_rescued && !jf.ev_johto_director_done) {
        this.runEvent('ev_johto_director');
      } else if (id === 'radio-tower-3' && jf.radio_f2_cleared && !jf.radio_tower_cleared && !jf.ev_johto_radio_top_done) {
        this.runEvent('ev_johto_radio_top');
      }
    }
    // Stage H4a (Maris story, first half): map-entry scenes, same
    // idiom — each scene's own completion flag is its gate, so a fled
    // or stalled beat re-fires on a later entry. The rescue fires on
    // the ferry landing map itself (Rootlet); Comet Falls waits
    // for the Stone Badge and Chimney for the Dynamo Badge (the
    // anime-true order of the seed chain).
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const hf = g.state.story.flags;
      if (id === 'littleroot' && g.state.story.arc === 'hoenn' && !hf.birch_rescued && !hf.ev_hoenn_rescue_done) {
        this.runEvent('ev_hoenn_rescue');
      } else if (id === 'birch-lab' && !hf.hoenn_arrival && !hf.ev_hoenn_arrival_done) {
        this.runEvent('ev_hoenn_arrival');
      } else if (id === 'meteor-falls' && hf.badge_stone && !hf.meteor_falls_done && !hf.ev_hoenn_meteor_done) {
        this.runEvent('ev_hoenn_meteor');
      } else if (id === 'mt-chimney' && hf.badge_dynamo && !hf.chimney_clash_done && !hf.ev_hoenn_chimney_done) {
        this.runEvent('ev_hoenn_chimney');
      }
    }
    // Stage H4b (Maris story, second half): map-entry scenes, same
    // idiom and same gate law — each scene's own completion flag is
    // its gate, so a fled or stalled beat re-fires on a later entry.
    // The chain order is the fiction's: Institute (Balance held) ->
    // Pyre (Mind held) -> the two hideouts (orbs taken / Pyre done)
    // -> Seafloor (submarine stolen) -> the Craterlake standoff
    // (Seafloor done) -> Tempest Tower (standoff seen). The climax
    // phase flags move ONLY inside these scenes' steps.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const hf = g.state.story.flags;
      if (id === 'r119' && hf.badge_balance && !hf.institute_done && !hf.ev_hoenn_institute_done) {
        this.runEvent('ev_hoenn_institute');
      } else if (id === 'mt-pyre' && hf.badge_mind && !hf.orbs_taken && !hf.ev_hoenn_pyre_done) {
        this.runEvent('ev_hoenn_pyre');
      } else if (id === 'magma-hideout' && hf.orbs_taken && !hf.magma_hideout_done && !hf.ev_hoenn_magma_hideout_done) {
        this.runEvent('ev_hoenn_magma_hideout');
      } else if (id === 'aqua-hideout' && hf.pyre_done && !hf.submarine_stolen && !hf.ev_hoenn_aqua_hideout_done) {
        this.runEvent('ev_hoenn_aqua_hideout');
      } else if (id === 'seafloor-cavern' && hf.submarine_stolen && !hf.seafloor_done && !hf.ev_hoenn_seafloor_done) {
        this.runEvent('ev_hoenn_seafloor');
      } else if (id === 'sootopolis' && hf.seafloor_done && !hf.standoff_seen && !hf.ev_hoenn_standoff_done) {
        this.runEvent('ev_hoenn_standoff');
      } else if (id === 'sky-pillar' && hf.standoff_seen && !hf.climax_resolved && !hf.ev_hoenn_rayquaza_done) {
        this.runEvent('ev_hoenn_rayquaza');
      }
    }
    // Arc 4 Stage S5a (Borea story, first half): map-entry scenes,
    // same idiom — each scene's own completion flag is its gate, so a
    // stalled chain (a fled battleAny, a lost must-win) re-fires on a
    // later entry. The chain order is the fiction's: the landing ->
    // the lab (Rowan + Paul's first measure) -> the Candor glimpse
    // (registered trainers only) -> the Windworks (Coal held) -> the
    // Heritage building (Forest held) -> the Defog grant in the ruins.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const sf = g.state.story.flags;
      if (id === 'sandgem' && g.state.story.arc === 'sinnoh' && !sf.sinnoh_arrival && !sf.ev_sinnoh_arrival_done) {
        this.runEvent('ev_sinnoh_arrival');
      } else if (id === 'rowan-lab' && sf.sinnoh_arrival && !sf.paul1_done && !sf.ev_sinnoh_lab_done) {
        this.runEvent('ev_sinnoh_lab');
      } else if (id === 'lake-verity' && sf.rowan_registered && !sf.verity_glimpse && !sf.ev_sinnoh_verity_done) {
        this.runEvent('ev_sinnoh_verity');
      } else if (id === 'valley-windworks' && sf.badge_coal && !sf.windworks_cleared && !sf.ev_sinnoh_windworks_done) {
        this.runEvent('ev_sinnoh_windworks');
      } else if (id === 'galactic-eterna' && sf.badge_forest && !sf.galactic_eterna_done && !sf.ev_sinnoh_galactic_done) {
        this.runEvent('ev_sinnoh_galactic');
      } else if (id === 'solaceon-ruins' && sf.badge_relic && !sf.defog_received && !sf.ev_sinnoh_defog_done) {
        this.runEvent('ev_sinnoh_defog');
      }
    }
    // Arc 4 Stage S5b (Borea story, second half): map-entry scenes,
    // same idiom and gate law (each scene's completion flag is its
    // gate; a stalled chain re-fires on a later entry). Order:
    // Gallant + the HQ raid (Fen) -> Brightmoon (the sailor's plea) ->
    // Insight (Icicle) -> Candor pressure + Astral's illusion (all
    // badges) -> Coronet -> Zenith Spire -> the platform. Gracidea
    // rides Honeyfield from Cobble on; Rock Climb sleeps on r217.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const sf = g.state.story.flags;
      if (id === 'lake-valor' && sf.badge_fen && !sf.valor_glimpse && !sf.ev_sinnoh_valor_done) {
        this.runEvent('ev_sinnoh_valor');
      } else if (id === 'galactic-hq' && sf.badge_fen && !sf.galactic_hq_done && !sf.ev_sinnoh_hq_raid_done) {
        this.runEvent('ev_sinnoh_hq_raid');
      } else if (id === 'fullmoon-island' && sf.darkrai_beat_started && !sf.lunar_wing_received && !sf.ev_sinnoh_fullmoon_done) {
        this.runEvent('ev_sinnoh_fullmoon');
      } else if (id === 'floaroma' && sf.badge_cobble && !sf.gracidea_beat_done && !sf.ev_sinnoh_gracidea_done) {
        this.runEvent('ev_sinnoh_gracidea');
      } else if (id === 'r217' && sf.badge_icicle && !sf.rockclimb_received && !sf.ev_sinnoh_rockclimb_done) {
        this.runEvent('ev_sinnoh_rockclimb');
      } else if (id === 'lake-acuity' && sf.badge_icicle && !sf.uxie_glimpse && !sf.ev_sinnoh_acuity_glimpse_done) {
        this.runEvent('ev_sinnoh_acuity_glimpse');
      } else if (id === 'lake-verity' && sf.badge_beacon && sf.verity_glimpse && !sf.mesprit_glimpse && !sf.ev_sinnoh_verity_pressure_done) {
        this.runEvent('ev_sinnoh_verity_pressure');
      } else if (id === 'celestic' && sf.badge_beacon && !sf.zoroark_special_seen && !sf.ev_sinnoh_zoroark_done) {
        this.runEvent('ev_sinnoh_zoroark');
      } else if (id === 'mt-coronet-north' && sf.badge_beacon && !sf.coronet_climb_done && !sf.ev_sinnoh_coronet_done) {
        this.runEvent('ev_sinnoh_coronet');
      } else if (id === 'spear-pillar' && sf.coronet_climb_done && !sf.spear_pillar_done && !sf.ev_sinnoh_spear_pillar_done) {
        this.runEvent('ev_sinnoh_spear_pillar');
      } else if (id === 'distortion-platform' && sf.spear_pillar_done && !sf.sinnoh_climax_resolved && !sf.ev_sinnoh_distortion_climax_done) {
        this.runEvent('ev_sinnoh_distortion_climax');
      }
    }
    // Stage H6 (Maris legendary arcs): map-entry faces, same idiom —
    // every face is gated on its arc's own progress flags (never on
    // the event-done flag alone), and the catch-only chain
    // (wildBattleCatch) leaves everything unwritten on a flee or a
    // KO, so each face re-fires until the catch.
    //  - The weather trio + STRATOWYRM key off climax_resolved ONLY
    //    (H4b ruling: their climax roles were appearances — no catch
    //    state exists, and NONE of these can fire before it).
    //  - ASTRAEON's star fall is witnessed on Comet Falls entry once
    //    the Space Center's news is in hand and the falls' own story
    //    beat (H4a) is behind the player.
    //  - RUBIAVIS ROAMS: no roaming engine shipped (the Yamato beasts
    //    are fixed lairs), so she rides the lightest honest
    //    equivalent — five staged landing maps whose turn is derived
    //    deterministically from the PERSISTED walked-step counter
    //    (state.stepsTotal: one landing per 50 walked steps, cycling
    //    r110 -> r118 -> r123 -> r127 -> r134). Entering the map she
    //    currently holds fires her face; walking Maris turns her.
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const hf = g.state.story.flags;
      if (id === 'magma-hideout' && hf.climax_resolved && !hf.arc_groudon_done && !hf.ev_hoenn_groudon_done) {
        this.runEvent('ev_hoenn_groudon');
      } else if (id === 'r127-underwater' && hf.climax_resolved && !hf.arc_kyogre_done && !hf.ev_hoenn_kyogre_done) {
        this.runEvent('ev_hoenn_kyogre');
      } else if (id === 'sky-pillar' && hf.climax_resolved && !hf.arc_rayquaza_done && !hf.ev_hoenn_rayquaza_face_done) {
        this.runEvent('ev_hoenn_rayquaza_face');
      } else if (id === 'meteor-falls' && hf.arc_jirachi_news && hf.meteor_falls_done && !hf.jirachi_star_fell && !hf.ev_hoenn_jirachi_witness_done) {
        this.runEvent('ev_hoenn_jirachi_witness');
      } else if (hf.climax_resolved && !hf.arc_latias_done && !hf.ev_hoenn_latias_done) {
        const LATIAS_LANDINGS = ['r110', 'r118', 'r123', 'r127', 'r134'];
        const landing = LATIAS_LANDINGS[Math.floor((g.state.stepsTotal || 0) / 50) % LATIAS_LANDINGS.length];
        if (id === landing) this.runEvent('ev_hoenn_latias');
      }
    }
    // Stage S6 (Borea legendary arcs): discovery, faces, roamers —
    // the H6 idiom (faces gated on their arcs' own progress flags;
    // the catch-only chain leaves flee/KO unwritten, so faces
    // re-fire). The lake trio + CHRONARCH/COSMARCH/VOIDARCH key ONLY on
    // sinnoh_climax_resolved (+ S5b's wake flags; COSMARCH behind
    // CHRONARCH's catch). EMPATHIS + LUNACYGN roam on the Latias
    // precedent, generalised data-side: one pure landing function
    // (roamLanding) over the persisted step counter, two roamers,
    // disjoint landing sets, ZERO new save state. MAGMARCH rides
    // Buck's accompaniment; COLOSSOR reads the party's Regi
    // presence live; NOCTARCH rides the inn event; CLIONARCH's arc
    // completes on the hatch's dex registration (an egg has no face).
    if (!arcCardFired && !g.ui.dialogueOpen) {
      const S6F = g.state.story.flags, S6Q = g.state.story.quests;
      // Arc discovery (the openQuestLog living-section law): an arc
      // whose prereq flag stands joins the Quest Log as 'discovered'.
      const S6_DISCOVER = [
        ['arc_uxie', 'sinnoh_climax_resolved'], ['arc_azelf', 'sinnoh_climax_resolved'],
        ['arc_mesprit', 'sinnoh_climax_resolved'], ['arc_dialga', 'sinnoh_climax_resolved'],
        ['arc_palkia', 'sinnoh_climax_resolved'], ['arc_giratina', 'sinnoh_climax_resolved'],
        ['arc_darkrai', 'darkrai_unlocked'], ['arc_cresselia', 'cresselia_glimpsed'],
        ['arc_shaymin', 'oaks_letter_received'],
        // Arc 4 Stage S7: the capstone joins the Quest Log ONLY on
        // the finale's unlock flag — never on arc completion alone.
        ['arc_arceus', 'arceus_unlocked'],
      ];
      for (const [arcId, flag] of S6_DISCOVER) if (S6F[flag] && S6Q[arcId] === undefined) S6Q[arcId] = 'discovered';
      // CLIONARCH completion sweep: the arc completes on the hatch's
      // dex registration (checked on every map load).
      if (S6F.manaphy_egg_received && !S6F.arc_manaphy_done && g.state.dex.caught[SPECIES.manaphy.dexNo]) {
        S6F.arc_manaphy_done = true; S6Q.arc_manaphy = 'complete';
        g.ui.toast('The blue Egg hatched — CLIONARCH, the Seafaring Kin!');
      }
      if (id === 'spear-pillar' && S6F.arceus_unlocked && !S6F.arceus_stairs_open && !S6F.ev_sinnoh_arceus_stairs_done) {
        // Stage S7: the flute ceremony outranks the pillar's catch
        // faces on the load it opens (a say-only event; the faces
        // keep their own appointments on later entries).
        this.runEvent('ev_sinnoh_arceus_stairs');
      } else if (id === 'hall-of-origin' && S6F.arceus_unlocked && S6F.arceus_stairs_open && !S6F.arc_arceus_done && !S6F.ev_sinnoh_arceus_done) {
        this.runEvent('ev_sinnoh_arceus');
      } else if (id === 'lake-acuity-cave' && S6F.sinnoh_climax_resolved && !S6F.arc_uxie_done && !S6F.ev_sinnoh_uxie_done) {
        this.runEvent('ev_sinnoh_uxie');
      } else if (id === 'lake-valor-cave' && S6F.sinnoh_climax_resolved && !S6F.arc_azelf_done && !S6F.ev_sinnoh_azelf_done) {
        this.runEvent('ev_sinnoh_azelf');
      } else if (id === 'lake-verity-cave' && S6F.sinnoh_climax_resolved && !S6F.mesprit_roaming && !S6F.arc_mesprit_done && !S6F.ev_sinnoh_mesprit_meet_done) {
        this.runEvent('ev_sinnoh_mesprit_meet');
      } else if (id === 'spear-pillar' && S6F.sinnoh_climax_resolved && S6F.dialga_unlocked && !S6F.arc_dialga_done && !S6F.ev_sinnoh_dialga_done) {
        this.runEvent('ev_sinnoh_dialga');
      } else if (id === 'spear-pillar' && S6F.palkia_unlocked && S6F.arc_dialga_done && !S6F.arc_palkia_done && !S6F.ev_sinnoh_palkia_done) {
        this.runEvent('ev_sinnoh_palkia');
      } else if (id === 'turnback-cave' && S6F.giratina_unlocked && !S6F.arc_giratina_done && !S6F.ev_sinnoh_giratina_done) {
        this.runEvent('ev_sinnoh_giratina');
      } else if (id === 'stark-interior' && S6F.sinnoh_climax_resolved && S6F.buck_met && !S6F.magma_stone_returned && !S6F.ev_sinnoh_magma_stone_done) {
        this.runEvent('ev_sinnoh_magma_stone');
      } else if (id === 'stark-interior' && S6F.magma_stone_returned && !S6F.arc_heatran_done && !S6F.ev_sinnoh_heatran_done) {
        this.runEvent('ev_sinnoh_heatran');
      } else if (id === 'snowpoint-temple-depths' && !S6F.arc_regigigas_done && !S6F.ev_sinnoh_regigigas_done) {
        // COLOSSOR: the gate is read live from the party. No trio
        // -> the statue declines, nothing set; all three -> the face.
        S6Q.arc_regigigas = S6Q.arc_regigigas || 'discovered';
        const triad = ['regirock', 'regice', 'registeel'].filter((s) => (g.state.party || []).some((m) => m && m.speciesId === s)).length;
        if (triad >= 3) { S6F.regi_trio_present = true; this.runEvent('ev_sinnoh_regigigas'); }
        else g.ui.say(['The deep room of Rimefall Temple is a held breath of a room: a dais built for a giant, and a statue the size of a small hill keeping it. Cold runs off it in sheets. Nothing moves.', 'A keeper\u2019s note, generations old, is carved where a visitor will find it: HE SLEEPS UNTIL HIS THREE COME TO HIM TOGETHER. BRING THE THREE OF THE TOMBS — ROCK, ICE AND STEEL — IN YOUR OWN COMPANY, OR LET HIM SLEEP. (' + triad + ' of his three stand with you.)']);
      } else if (id === 'fullmoon-island' && S6F.sinnoh_climax_resolved && S6F.cresselia_glimpsed && !S6F.cresselia_roaming && !S6F.arc_cresselia_done && !S6F.ev_sinnoh_cresselia_meet_done) {
        this.runEvent('ev_sinnoh_cresselia_meet');
      } else if (id === 'house-canalave' && S6F.sinnoh_complete && S6F.darkrai_unlocked && !S6F.darkrai_inn_done && !S6F.ev_sinnoh_darkrai_inn_done) {
        this.runEvent('ev_sinnoh_darkrai_inn');
      } else if (id === 'newmoon-island' && S6F.darkrai_inn_done && !S6F.arc_darkrai_done && !S6F.ev_sinnoh_darkrai_done) {
        this.runEvent('ev_sinnoh_darkrai');
      } else if (id === 'flower-paradise' && S6F.oaks_letter_received && !S6F.arc_shaymin_done && !S6F.ev_sinnoh_shaymin_done) {
        this.runEvent('ev_sinnoh_shaymin');
      }
      // The two roamers (after the chain: a lair face outranks a
      // landing on the same load).
      if (S6F.mesprit_roaming && !S6F.arc_mesprit_done && !S6F.ev_sinnoh_mesprit_done && id === roamLanding(g.state.stepsTotal, EMPATHIS_LANDINGS)) {
        this.runEvent('ev_sinnoh_mesprit');
      }
      if (S6F.cresselia_roaming && !S6F.arc_cresselia_done && !S6F.ev_sinnoh_cresselia_done && id === roamLanding(g.state.stepsTotal, LUNACYGN_LANDINGS)) {
        this.runEvent('ev_sinnoh_cresselia');
      }
    }
  },

  boulderAt(x, y) {
    if (!this.fxState) return null;
    for (const b of this.fxState.boulders.values()) if (b.x === x && b.y === y) return b;
    return null;
  },

  sysWalkableExtra(x, y) {
    // Called from walkable(): tiles the base set rejects but systems allow.
    const t = this.tileAt(x, y);
    if (t === 'T' && this.fxState && this.fxState.cut.has(key(x, y))) return true;
    if ((t === '~' || t === 'W') && this.surfing) return true;
    return false;
  },

  moveMs() {
    if (this.surfing) return 170;
    if (this.riding) return 105;
    if (this.running) return 140; // Premium+ W3: run (B held) — own gait art
    return 200;
  },

  // ---------- per-step systems ----------
  sysOnStep(x, y) {
    const g = this.game;
    const t = this.tileAt(x, y);
    // Arc 4 Stage S4: GRATHOG's simplified reversion — a fainted
    // Sky-forme GRATHOG settles back to its land forme (canon's
    // night/freeze reversion, recorded in the register).
    for (const m of g.state.party) {
      if (m && m.speciesId === 'shayminsky' && m.hp <= 0 && switchForme(m, 'shaymin', SPECIES)) {
        g.ui.toast(displayName(m, SPECIES) + ' settled back into its land forme.');
      }
    }
    // Landing on shore ends surfing.
    if (this.surfing && t !== '~' && t !== 'W') this.surfing = false;
    // Safari session step budget.
    const saf = g.state.session.safari;
    if (saf) {
      saf.steps--;
      if (saf.steps <= 0) { this.endSafari('Your safari time is up!'); return true; }
      if (saf.steps === 50) g.ui.toast('Safari: 50 steps left!');
    }
    // Poison walk damage: every 4 steps, 1 HP per poisoned mon (original).
    this.poisonSteps = (this.poisonSteps || 0) + 1;
    if (this.poisonSteps >= 4) {
      this.poisonSteps = 0;
      let anyAlive = false;
      for (const m of g.state.party) {
        if (m.hp > 0 && (m.status === 'poison' || m.status === 'badlyPoisoned')) m.hp = Math.max(1, m.hp - 1);
        if (m.hp > 0) anyAlive = true;
      }
      if (!anyAlive && g.state.party.length) { this.blackout(); return true; }
      const hurt = g.state.party.find((m) => (m.status === 'poison' || m.status === 'badlyPoisoned') && m.hp > 0);
      if (hurt) g.ui.toast(displayName(hurt, SPECIES) + ' is hurt by poison...');
    }
    // Stage J6: the persisted step systems — the walked-step counter,
    // Day-Care egg production, and party-egg countdowns/hatching. A
    // hatch scene claims the step (no encounter rides over it).
    const j6tick = johtoStepTick(g.state);
    if (j6tick.hatched.length) {
      g.audio.playSfx('dex-register');
      // Egg Hatch ceremony (2026-11-17): the data layer has already
      // hatched the mon (hatchMon owns the mutation — suites pin the
      // state, and the state is identical either way); the ceremony is
      // presentation only, chained per hatched mon. Without battle art
      // on hand (bare headless contexts) the original say() lines run.
      const hatched = j6tick.hatched.slice();
      const artReady = g.spriteCache && hatched.every((m) => g.spriteCache[m.speciesId])
        && g.scenes && g.scenes.top === this;
      if (!artReady) {
        const lines = [];
        for (const m of hatched) {
          lines.push('Oh? The Egg is hatching!');
          lines.push(displayName(m, SPECIES) + ' hatched from the Egg!');
        }
        g.ui.say(lines);
        return true;
      }
      const playNext = () => {
        const m = hatched.shift();
        if (!m) return;
        g.scenes.push(new HatchScene({ mon: m, name: displayName(m, SPECIES), onDone: playNext }));
      };
      playNext();
      return true;
    }
    // Stage H6: the Regi tombs' seals + the Eon stop. Both pre-empt
    // random encounters: the seal is a wall that talks, and AZURAVIS
    // is an appointment, not an ambush.
    //  - A tomb's inner chamber is rows 0-4, north of the sealstone
    //    row (row 5, whose single floor gap at x=8 is the door).
    //    Stepping north of the row before the tomb's puzzle is
    //    solved meets the seal: narration + a step back south (the
    //    Lastlight Pass gate idiom — turned back, never stuck). Once
    //    solved, stepping in meets the Regi (the face re-fires on
    //    every entry until the catch — flee/KO consume nothing).
    {
      const H6_TOMBS = {
        'desert-ruins': { open: 'regi_rock_open', done: 'arc_regirock_done', ev: 'ev_hoenn_regirock', evDone: 'ev_hoenn_regirock_done', name: 'PETRAGOLEM' },
        'island-cave': { open: 'regi_ice_open', done: 'arc_regice_done', ev: 'ev_hoenn_regice', evDone: 'ev_hoenn_regice_done', name: 'CRYOGOLEM' },
        'ancient-tomb': { open: 'regi_steel_open', done: 'arc_registeel_done', ev: 'ev_hoenn_registeel', evDone: 'ev_hoenn_registeel_done', name: 'SIDEROGOLEM' },
      };
      const tomb = H6_TOMBS[this.mapId];
      if (tomb && y <= 4) {
        const hf = g.state.story.flags;
        if (!hf[tomb.open]) {
          g.ui.say(['The sealstones grind — not open, not quite shut, but AWAKE — and the chamber\'s old patience pushes you back a step, the way deep water pushes back a hand. The seal is not a wall. It is a question, and it is still waiting for its answer.'], () => {
            this.player.tx = 8; this.player.ty = 7;
            this.player.px = 8 * TILE; this.player.py = 7 * TILE;
            this.player.fx = 8; this.player.fy = 7;
            this.trail = [];
            g.state.story.position = { map: this.mapId, x: 8, y: 7, dir: 'up' };
          });
          return true;
        }
        if (!hf[tomb.done] && !hf[tomb.evDone]) { this.runEvent(tomb.ev); return true; }
      }
      // AZURAVIS, the Eon stop: the Ebbtide Cave island's shore apron
      // (r125, the island landmass x12-18 / y4-8). Post-climax only.
      if (this.mapId === 'r125' && x >= 12 && x <= 18 && y >= 4 && y <= 8) {
        const hf = g.state.story.flags;
        if (hf.climax_resolved && !hf.arc_latios_done && !hf.ev_hoenn_latios_done) {
          this.runEvent('ev_hoenn_latios');
          return true;
        }
      }
    }
    // Arc 3.5 Stage F2: Pyramid floor law during a climb — seeded
    // spots and floor wilds (game/frontier.mjs frontierOnStep).
    if (frontierOnStep(g, this, x, y)) return true;
    // Water + cave encounters (grass handled by the base onStep).
    if (this.sysEncounterStep(x, y, t)) return true;
    // Story event tiles.
    if (this.map.events) {
      for (const ev of this.map.events) {
        if (ev.x === x && ev.y === y && this.eventWhen(ev.when)) {
          this.runEvent(ev.id);
          return true;
        }
      }
    }
    return false;
  },

  sysEncounterStep(x, y, t) {
    const g = this.game;
    const enc = this.map.encounters;
    if (!enc || g.state.story.flags.noEncounters) return false;
    // UI v2.2 defect 4 guard: same no-living-ally rule as the grass branch.
    if (!g.state.party.some((m) => m && m.hp > 0)) return false;
    const saf = g.state.session.safari;
    let table = null, rate = 0;
    // Safari encounters (generic): any map in the session's own map
    // set, on tall grass or on a marshbog floor tile (the zone's
    // encounter terrain, read by tile kind — the engine names no
    // zone). The Arden session's set is ['safari'], as shipped.
    if (saf && (saf.maps || ['safari']).includes(this.mapId) && (t === ',' || TILE_CHARS[t] === 'marshbog')) { table = enc.table; rate = enc.rate; }
    else if (this.surfing && (t === '~' || t === 'W') && enc.water) { table = enc.water; rate = enc.waterRate || 0.08; }
    else if (enc.cave && (t === '.' || t === 'R')) { table = enc.table; rate = enc.rate; }
    if (!table) return false;
    if (!roll(rate, g.rng.encounter)) return false;
    const spId = pickWeighted(table.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = table.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    const foe = makeMon(spId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[spId].dexNo);
    g.audio.stopMusic();
    g.audio.encounter();
    if (saf) {
      g.scenes.push(new BattleScene({
        kind: 'wild', foe, returnTo: this, safari: true, safariRock: saf.rock || 'ROCK',
        onSafariAction: () => { const s = g.state.session.safari; if (s) { s.steps -= 5; } },
      }));
    } else {
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, rt: rtOf(g) }));
    }
    return true;
  },

  // ---------- story events ----------
  eventWhen(when) {
    if (!when) return true;
    const g = this.game;
    const f = g.state.story.flags;
    if (when.flagNot && f[when.flagNot]) return false;
    if (when.flag && !f[when.flag]) return false;
    if (when.flagAny && !when.flagAny.some((k) => f[k])) return false;
    if (when.badgesAtLeast !== undefined && g.state.badges.kanto.length < when.badgesAtLeast) return false;
    if (when.badgesBelow !== undefined && g.state.badges.kanto.length >= when.badgesBelow) return false;
    if (when.bagHas && !(g.state.bag[when.bagHas] > 0)) return false;
    if (when.noBag && g.state.bag[when.noBag] > 0) return false;
    if (when.teach && !this.partyKnows(when.teach)) return false;
    return true;
  },

  partyKnows(moveId) {
    return this.game.state.party.some((m) => m.moves.some((mv) => mv.id === moveId));
  },
  partyHasType(type) {
    return this.game.state.party.some((m) => m.hp > 0 && SPECIES[m.speciesId].types.includes(type));
  },

  runEvent(id) {
    const steps = EVENTS[id];
    if (!steps) return;
    const g = this.game;
    // Completion flag convention (the placements gate on it):
    // ev_e4_1 -> ev_e4_1_done; bare ids -> ev_<id>_done.
    const doneFlag = id.startsWith('ev_') ? id + '_done' : 'ev_' + id + '_done';
    this.runSteps(steps, 0, () => { g.state.story.flags[doneFlag] = true; });
  },

  runSteps(steps, i, done) {
    const g = this.game;
    if (i >= steps.length) { if (done) done(); return; }
    const s = steps[i];
    const next = () => this.runSteps(steps, i + 1, done);
    if (s.say) { g.ui.say(s.say, next, s.who || ''); return; }
    if (s.toast) { g.ui.toast(s.toast); next(); return; }
    if (s.flag) { g.state.story.flags[s.flag] = true; next(); return; }
    // Stage H4b: a flag CLEAR step — the climax's phase transitions
    // (drought -> deluge -> resolved) are data steps in the Maris
    // events, not engine special cases. Setting false (not delete)
    // keeps the save's flag vocabulary stable for the validator.
    if (s.clearFlag) { g.state.story.flags[s.clearFlag] = false; next(); return; }
    if (s.quest) { g.state.story.quests[s.quest] = 'active'; next(); return; }
    if (s.questDone) { g.state.story.quests[s.questDone] = 'complete'; next(); return; }
    if (s.arc) {
      g.state.story.quests[s.arc] = s.stage;
      // ADR-025 §2: legendary-arc beats are a bond source — +1 with the
      // characters the arc involves, recorded once at completion (the
      // OMNIGEN arc is Blaine's old expedition; the PRIMARA beat is the one
      // the duo witnessed and stood down for). One-shot by flag.
      if (s.stage === 'complete') {
        if (s.arc === 'arc_mewtwo') applyBondOnce(g.state, 'bondsrc_arc_mewtwo', 'blaine', 1);
        if (s.arc === 'arc_mew') { applyBondOnce(g.state, 'bondsrc_arc_mew_rue', 'rue', 1); applyBondOnce(g.state, 'bondsrc_arc_mew_cole', 'cole', 1); }
      }
      next(); return;
    }
    // ADR-025 §2: the CHOICE POINT primitive — unlabelled options via
    // ui.showMenu; the pick applies its bond delta (clamped in
    // applyBond) + heart pip, then plays its lines. Never story-gating.
    if (s.choice) {
      const c = s.choice;
      const who = c.who || '';
      g.ui.showMenu(c.prompt, c.options.map((o) => ({ label: o.label, value: o.label })), (v) => {
        const opt = c.options.find((o) => o.label === v) || c.options[0];
        const ids = Array.isArray(c.npc) ? c.npc : [c.npc];
        let dir = 0;
        for (const id of ids) { const r = applyBond(g.state, id, opt.delta || 0); if (r.dir) dir = r.dir; }
        if (dir) g.ui.queueBondPip(dir);
        const lines = (opt.say || []).map((l) => l.replace('{player}', g.state.player.name));
        if (lines.length) g.ui.say(lines, next, who);
        else next();
      });
      return;
    }
    // ADR-025 §2: a tier-variant beat — emits the scene's lines for the
    // character's CURRENT tier when a variant exists; else silent.
    if (s.sayVar) {
      const lines = bondSceneLines(g.state, s.sayVar.npc, s.sayVar.scene);
      if (lines && lines.length) {
        g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), next, s.sayVar.who || '');
        return;
      }
      next(); return;
    }
    if (s.heal) { this.healParty(false); g.ui.toast('The party was healed!'); next(); return; }
    if (s.give) {
      for (const item of Object.keys(s.give.items || {})) {
        g.state.bag[item] = (g.state.bag[item] || 0) + s.give.items[item];
      }
      if (s.give.text) g.ui.toast(s.give.text);
      next(); return;
    }
    // Arc 4 Stage S4: the giveHM step — a story beat grants an HM by
    // move id (data/items.mjs HM_GRANTS is the hook table S5 calls:
    // { giveHM: 'defog' }). Idempotent like the GS Orb grant: a
    // trainer already carrying the HM is never handed a duplicate.
    if (s.giveHM) {
      const grant = HM_GRANTS[s.giveHM];
      if (grant && !(g.state.bag[grant.item] > 0)) {
        g.state.bag[grant.item] = 1;
        g.audio.playSfx('dex-register');
        g.ui.toast('Received ' + ITEMS[grant.item].name + '!');
      }
      next(); return;
    }
    if (s.giveMon) { this.giftMon(s.giveMon.species, s.giveMon.level, next); return; }
    // Stage O2: the GS Orb grant beat — the story GS Orb IS the Cheat
    // Shop item (one id); an owner hears the variant, never a duplicate.
    if (s.gsBall) {
      if ((g.state.bag.gsball || 0) > 0) {
        g.ui.say([
          'Isla lifts the glass hood — then stops, and laughs. "Wait. You are already carrying one."',
          '"A twin of it, out in the world, in a trainer\'s bag. Then the errand is half done already, and the mystery is twice as big. Keep yours close — no machine can open it, and I have the bruised equipment to prove it."',
        ], next, 'PROF. ISLA');
      } else {
        g.state.bag.gsball = 1;
        g.audio.playSfx('dex-register');
        g.ui.say([
          'Isla lifts the glass hood with both hands, the way you would lift a sleeping bird, and sets the ball in yours. It is heavier than it looks. It is warmer than it should be.',
          'Received the Sealed Orb!',
          '"There. It is yours to carry now. Study it all you like on the road — I did. It studies back."',
        ], next, 'PROF. ISLA');
      }
      return;
    }
    // Stage O2: cap-safe gift delivery (cheatDeliverMon, NOT giftMon's
    // blind push): party if room, else first PC box with space. Total
    // refusal STALLS the chain (no flag), so the beat re-fires later.
    if (s.giftCapSafe) {
      const spec = s.giftCapSafe;
      const res = g.state.party.length < 6
        ? this.cheatDeliverMon(spec.species, spec.level, 'party')
        : this.cheatDeliverMon(spec.species, spec.level, 'box');
      if (!res.ok) {
        g.ui.say(['There is no room anywhere — party full and every PC box full. Make room, and come back. Some meetings should not be rushed, and this is one of them.'], null, '');
        return;
      }
      if (res.dest === 'box' && res.boxId) {
        g.ui.toast(SPECIES[spec.species].name + ' was sent to ' + res.boxId.replace('box', 'Box ') + '!');
      } else {
        g.ui.toast('Received ' + SPECIES[spec.species].name + '!');
      }
      next(); return;
    }
    if (s.chapterCard !== undefined) {
      const ch = CHAPTERS[s.chapterCard];
      if (ch && g.ui.showChapterCard) g.ui.showChapterCard(ch);
      next(); return;
    }
    // W10: a cutscene panel — PRESENTATION ONLY. The step names a
    // moment in PANELS (src/data/panels.mjs); the table names the art.
    // showPanel resumes the chain on dismissal (headless: immediately),
    // and the step writes no flags and no state, so an event's outcome
    // is identical with or without it (tests/cutscene-panel-checks.mjs
    // parity drive). An unknown id is a data bug the guard catches;
    // at runtime it degrades to a no-op rather than stalling the chain.
    if (s.panel) {
      const p = PANELS[s.panel];
      if (p && g.ui.showPanel) { g.ui.showPanel(p.art, next); return; }
      next(); return;
    }
    if (s.warp) {
      this.loadMap(s.warp.map);
      this.player.tx = s.warp.x; this.player.ty = s.warp.y;
      this.player.px = s.warp.x * TILE; this.player.py = s.warp.y * TILE;
      this.player.fx = s.warp.x; this.player.fy = s.warp.y;
      this.trail = [];
      g.state.story.position = { map: s.warp.map, x: s.warp.x, y: s.warp.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.audio.playMusic(this.map.music || 'route1-theme');
      next(); return;
    }
    // Stage J4a: a scripted battle the story survives either way
    // (Silver on Route 30) — friendly, the branch flag records the
    // honest outcome, the chain advances on a win OR a loss. Fleeing
    // stalls the chain, so the scene re-fires on the next entry.
    if (s.battleAny) {
      const spec = s.battleAny;
      const t0 = TRAINERS[spec.trainer];
      if (!t0) { next(); return; }
      const t = bondTrainerVariant(g.state, t0);
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g), friendly: true,
        onEnd: (won, fled) => {
          if (fled) return;
          if (won) { if (spec.winFlag) g.state.story.flags[spec.winFlag] = true; }
          else if (spec.loseFlag) { g.state.story.flags[spec.loseFlag] = true; }
          recordBattleBond(g.state, t.id, won, fled);
          next();
        },
      }));
      return;
    }
    if (s.battle) {
      const t0 = TRAINERS[s.battle];
      if (!t0) { next(); return; }
      // ADR-025 §2: Gary's battle TEXT varies by tier (cloned def, text
      // only — R3); the outcome feeds the rival/duo ledger as a source.
      const t = bondTrainerVariant(g.state, t0);
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
        onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (won) next(); },
      }));
      return;
    }
    if (s.wildBattle) {
      const wb = s.wildBattle;
      const foe = makeMon(wb.species, wb.level, SPECIES, MOVES);
      dexRegister(g.state.dex, 'seen', SPECIES[wb.species].dexNo);
      g.scenes.push(new BattleScene({
        kind: 'wild', foe, returnTo: this, rt: rtOf(g),
        uncatchable: !!wb.uncatchable, legendary: !!wb.legendary,
        // ADR-025 QA D1 (Cheat Shop QA, D1): endBattle passes
        // (won, fled) — fleeing (RUN / Teleport / Safari run / foe
        // fled) ends won=true + fled=true, so a flee must NOT
        // advance the event chain into its completion steps.
        // Stalling here leaves ev_<id>_done unwritten (runEvent
        // only writes it when the chain runs off the end), so the
        // event re-fires on re-entry and can be fought properly.
        onEnd: (won, fled) => { if (won && !fled) next(); },
      }));
      return;
    }
    // Stage J5: a one-of-one legendary face. Same battle as
    // wildBattle, but the chain advances ONLY on a catch: a flee OR
    // a KO stalls it with nothing set (the arc step and the
    // event-done flag both stay unwritten), so the encounter
    // re-fires until the species is caught — a one-of-one species
    // must never dex-lock a player who knocked it out.
    if (s.wildBattleCatch) {
      const wb = s.wildBattleCatch;
      const foe = makeMon(wb.species, wb.level, SPECIES, MOVES);
      dexRegister(g.state.dex, 'seen', SPECIES[wb.species].dexNo);
      g.scenes.push(new BattleScene({
        kind: 'wild', foe, returnTo: this, rt: rtOf(g),
        legendary: !!wb.legendary,
        onEnd: (won, fled) => {
          const caught = !!(g.state.dex && g.state.dex.caught && g.state.dex.caught[SPECIES[wb.species].dexNo]);
          if (won && !fled && caught) next();
        },
      }));
      return;
    }
    if (s.actorEnter || s.actorMove || s.actorExit || s.actorShow || s.actorHide) { this.runActorStep(s, next); return; } if (s.ending) { this.runEnding(next); return; }
    next();
  },

  runEnding(done) {
    const g = this.game;
    // Hall of Fame registration: the winning team is recorded forever.
    const hof = g.state.story.hof || (g.state.story.hof = []);
    hof.push({
      team: g.state.party.map((m) => ({ speciesId: m.speciesId, level: m.level, nickname: m.nickname })),
      badges: g.state.badges.kanto.length,
    });
    g.state.story.flags.champion = true;
    // ADR-025 §3 (Phase 3): the Hall of Fame gift — the Champion's
    // Ribbon is presented at League registration, once (a keepsake is
    // a unique object; repeat registrations never duplicate it).
    // ADR-025 §6: when the champion ALREADY carries the Ribbon (a
    // Second Journey), the gift rides the central source grant's
    // duplicate conversion (cash + the line) instead of a 2nd piece.
    const lines = CREDITS_LINES.slice();
    if (grantKeepsake(g.state, 'championsribbon')) {
      lines.push('The League registrar presents you with the CHAMPION\'S RIBBON!');
      lines.push('Give it to a Kin from the party menu — its holder gains x1.2 XP.');
    } else if (ownsKeepsake(g.state, 'championsribbon')) {
      const hofGift = grantKeepsakeFromSource(g.state, 'championsribbon');
      lines.push('The League registrar reaches for the CHAMPION\'S RIBBON — then sees yours, and smiles.');
      if (hofGift.line) lines.push(hofGift.line);
    }
    g.ui.say(lines, () => {
      // ADR-027 (Stage F): the credits hand off to the arc machine —
      // the ARC COMPLETE card + pinned directive REPLACE the retired
      // static 'TO BE CONTINUED' bridge card, so only one ending
      // plays. When the card fires, the event chain resumes after it.
      const fired = checkArcCompletion(g, done);
      if (!fired && done) done();
    }, '');
  },

  giftMon(speciesId, level, next) {
    const g = this.game;
    const mon = makeMon(speciesId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'caught', SPECIES[speciesId].dexNo);
    if (g.state.party.length < 6) g.state.party.push(mon);
    else {
      const boxId = g.state.currentBox || 'box1';
      const box = g.state.boxes[boxId] || (g.state.boxes[boxId] = []);
      box.push(mon);
    }
    g.audio.playSfx('dex-register');
    g.ui.toast('Received ' + SPECIES[speciesId].name + '!');
    if (next) next();
  },

  // ---------- interaction systems ----------
  sysInteract(fx, fy) {
    const g = this.game;
    // ADR-025 §5 (Town Tales): faced-tile tale searches (the lost
    // keepsake, the dock notes, the graves, the lure, the burned notes).
    // The handler declines whenever its tale is not at the needing
    // stage, so base handlers (signs, fishing, hidden items) keep
    // their exact behavior the rest of the time.
    const taleSpot = taleSpotAt(this.mapId, fx, fy);
    if (taleSpot && this.taleSpotInteract(taleSpot)) return true;
    // Stage J5: the Holly Forest shrine (the JSHRINE prop at (14,3))
    // is CHRONOFAE's door — faced-tile, exactly like a tale spot.
    if (this.mapId === 'ilex-forest' && fx === 14 && fy === 3 && this.johtoShrineInteract()) return true;
    // Stage H6: the Regi tombs (inscriptions, seals, puzzle stones)
    // and Comet Falls' meteorstones (the ASTRAEON wish stone; the
    // XENOGENE crater meteorite + its forme switch). Faced-tile, the
    // shrine idiom exactly: each handler declines (returns false)
    // whenever the faced tile is not one of its own.
    if (this.hoennTombInteract(fx, fy)) return true;
    if (this.mapId === 'meteor-falls' && TILE_CHARS[this.tileAt(fx, fy)] === 'meteorstone' && this.hoennMeteorInteract(fx, fy)) return true;
    // Arc 4 Stage S4: the forme-switch objects (the shrine idiom —
    // each handler declines when its partner is not in the party, so
    // the authored sign text speaks exactly as before): the Griseous
    // Orb's chamber sign in Reversal Cave (11,5), the Distortion
    // World's platform dais sign (10,8), and the Ruined Manor's
    // television sign (16,4) — SPARKIMP's room, appliances included.
    if (this.mapId === 'turnback-cave' && fx === 11 && fy === 5 && this.griseousInteract()) return true;
    if (this.mapId === 'distortion-platform' && fx === 10 && fy === 8 && this.griseousInteract()) return true;
    if (this.mapId === 'old-chateau' && fx === 16 && fy === 4 && this.rotomInteract()) return true;
    // Arc 4 Stage S6: the Hallowed Tower on Route 209 (spiritombInteract
    // claims only the tower's own faced tile; everywhere else it
    // declines and the generic sign/tile text speaks as before).
    if (this.spiritombInteract(fx, fy)) return true;
    // Arc 4 Stage S4: Rock Climb — facing a climbwall gate tile (the
    // tile-kind marker S3b authored; the Cut-tree idiom: the gate
    // lives in the tile, the move in the party).
    if (TILE_CHARS[this.tileAt(fx, fy)] === 'climbwall') { this.climbInteract(fx, fy); return true; }
    // Stage J6: apricorn trees (the J3a `apricorn` prop kind). Facing
    // a tree picks its apricorn when it has rested enough walked
    // steps; the rest is counted on the persisted step counter and
    // reported honestly.
    {
      const facedKind = TILE_CHARS[this.tileAt(fx, fy)];
      if (facedKind === 'apricorn') {
        const tree = apricornTreeAt(this.mapId, fx, fy);
        if (tree) {
          const res = pickApricorn(g.state, tree);
          if (res.ok) {
            g.audio.playSfx('dex-register');
            g.ui.say(['Picked the ' + ITEMS[tree.item].name + '!', 'The tree settles back to growing. It will fruit again after a good walk.']);
          } else {
            g.ui.say(['The podnut tree is resting. Its next fruit ripens in about ' + res.remaining + ' steps of walking.']);
          }
          return true;
        }
        g.ui.say(['An podnut tree, bare of ripe fruit.']);
        return true;
      }
    }
    const t = this.tileAt(fx, fy);
    // Item balls.
    if (this.map.items) {
      for (const b of this.map.items) {
        if (b.x === fx && b.y === fy) {
          const flag = 'item_' + this.mapId + '_' + fx + '_' + fy;
          if (g.state.story.flags[flag]) { g.ui.say(['There is nothing here.']); return true; }
          // Mt. Lunestone fossil pair: taking one seals the other (original beat).
          // ADR-025 §6 Traveler's Memory: a traveler who chose before
          // may re-pick freely — the seal never lands for them.
          if ((b.item === 'helixfossil' || b.item === 'domefossil') && g.state.story.flags.fossil_taken
            && !hasTravelersMemory(g.state, 'fossil-choice')) {
            g.ui.say(['Only crumbled stone remains. You chose your fossil already.']);
            return true;
          }
          g.state.story.flags[flag] = true;
          if (b.item === 'helixfossil' || b.item === 'domefossil') g.state.story.flags.fossil_taken = true;
          // ADR-025 §6: keepsake item balls ride the central source grant.
          if (ITEMS[b.item] && ITEMS[b.item].pocket === 'keepsakes') {
            const res = grantKeepsakeFromSource(g.state, b.item);
            g.audio.playSfx('dex-register');
            g.ui.say([res.status === 'granted' ? 'Found ' + ITEMS[b.item].name + '!' : res.line]);
            return true;
          }
          // Arc 3.5 Stage F2: on a Pyramid floor during an active
          // climb, a found medicine goes into the PYRAMID BAG — the
          // mountain's supplies stay the mountain's until the climb
          // ends (recorded in the F2 register).
          if (PYRAMID_FLOOR_MAPS.includes(this.mapId) && g.state.frontier && g.state.frontier.run
            && g.state.frontier.run.facility === 'pyramid' && ITEMS[b.item] && ITEMS[b.item].pocket === 'medicine') {
            g.state.frontier.pyramidBag.push(b.item);
            g.audio.playSfx('dex-register');
            g.ui.say(['Found ' + ITEMS[b.item].name + '! It goes into the Pyramid Bag.']);
            return true;
          }
          g.state.bag[b.item] = (g.state.bag[b.item] || 0) + (b.n || 1);
          g.audio.playSfx('dex-register');
          g.ui.say(['Found ' + (ITEMS[b.item] ? ITEMS[b.item].name : b.item) + '!']);
          return true;
        }
      }
    }
    // Hidden items (face the exact tile).
    if (this.map.hidden) {
      for (const hb of this.map.hidden) {
        if (hb.x === fx && hb.y === fy) {
          const flag = 'hidden_' + this.mapId + '_' + fx + '_' + fy;
          if (!g.state.story.flags[flag]) {
            g.state.story.flags[flag] = true;
            // ADR-025 §6: hidden keepsakes ride the central source grant.
            if (ITEMS[hb.item] && ITEMS[hb.item].pocket === 'keepsakes') {
              const res = grantKeepsakeFromSource(g.state, hb.item);
              g.audio.playSfx('dex-register');
              g.ui.say([res.status === 'granted' ? 'Found a hidden ' + ITEMS[hb.item].name + '!' : res.line]);
              return true;
            }
            g.state.bag[hb.item] = (g.state.bag[hb.item] || 0) + (hb.n || 1);
            g.audio.playSfx('dex-register');
            g.ui.say(['Found a hidden ' + (ITEMS[hb.item] ? ITEMS[hb.item].name : hb.item) + '!']);
            return true;
          }
        }
      }
    }
    // Cut tree.
    if (t === 'T') {
      if (this.fxState.cut.has(key(fx, fy))) return false;
      if (this.partyKnows('cut') && g.state.badges.kanto.includes('cascadebadge')) {
        this.fxState.cut.add(key(fx, fy));
        g.audio.playSfx('map-enter');
        g.ui.say(['The tree was cut down!']);
      } else if (this.partyKnows('cut')) {
        g.ui.say(['A cuttable tree. The Cascade Badge is needed to use CUT out here.']);
      } else {
        g.ui.say(['A small tree blocks the way. It looks cuttable.']);
      }
      return true;
    }
    // Boulder: activate Strength.
    if (this.boulderAt(fx, fy)) {
      if (this.partyKnows('strength') && g.state.badges.kanto.includes('rainbowbadge')) {
        this.fxState.strengthOn = true;
        g.ui.say(['Strength made it possible to move boulders!']);
      } else {
        g.ui.say(['A huge boulder. It would take real STRENGTH to budge it.']);
      }
      return true;
    }
    // Stage H5: Contest-lite entry (coordinator ruling 7). The seam
    // is the map's `contestHall` field (maps7): facing the reception
    // counter (the 'α' counter tile the halls are dressed with — the
    // same tile the Center nurse stands behind) opens entry. Halls
    // are NPC-free floors by design, so the counter itself is the
    // receptionist. One ribbon per hall; replays stay open forever.
    if (this.map.contestHall && t === 'α') {
      this.startContest();
      return true;
    }
    // Stage H4b: scoped Dive (coordinator ruling 5). A dive spot is
    // a DEFINED tile only — the current map's diveSpots (surface) or
    // surfaceSpots (underwater), cross-checked against maps7's
    // DIVE_PAIRS table (the two declarations are two views of the
    // same pairing; a spot that no pair claims is not a dive spot).
    // The player may stand ON the spot (surfing the trench) or face
    // it from an adjacent tile. Descent is gated exactly like the
    // ferry gate idiom: the Mind Badge AND a party member that knows
    // Dive — refusals are dialogue naming the missing piece. The
    // return (surfaceSpots) is UNCONDITIONAL: no badge, no move, no
    // menu toll on the way up — the no-soft-lock law.
    {
      const px = this.player ? this.player.tx : -1, py = this.player ? this.player.ty : -1;
      const onOrFaced = (s) => (s.x === fx && s.y === fy) || (s.x === px && s.y === py);
      const surfSpot = (this.map.surfaceSpots || []).find(onOrFaced);
      if (surfSpot && this.map.underwater) {
        const pair = DIVE_PAIRS.find((p) => p.underwater === this.mapId
          && p.underwaterTile.x === surfSpot.x && p.underwaterTile.y === surfSpot.y);
        if (pair) {
          g.ui.showMenu('The light is up there, bright as a door. Surface?', [
            { label: 'Surface', value: 'yes' }, { label: 'Stay down', value: 'no' },
          ], (v) => { if (v === 'yes') this.diveWarp(surfSpot.to); });
          return true;
        }
      }
      const diveSpot = (this.map.diveSpots || []).find(onOrFaced);
      if (diveSpot) {
        const pair = DIVE_PAIRS.find((p) => p.surface === this.mapId
          && p.surfaceTile.x === diveSpot.x && p.surfaceTile.y === diveSpot.y);
        if (pair) {
          if (!((g.state.badges && g.state.badges.hoenn) || []).includes('mindbadge')) {
            g.ui.say(['The water here goes down like a stairway into dark blue — a dive spot, marked by the old sea-charts.', 'Come back with the Mind Badge in your case — Starfall\'s gym, out east. The League does not let trainers down into the trenches without it.']);
            return true;
          }
          if (!this.partyKnowsDive()) {
            g.ui.say(['The water here goes down like a stairway into dark blue — a dive spot, marked by the old sea-charts.', 'You have the Mind Badge, but no partner who knows Dive. Alban Stone, in Starfall, teaches the way down — his house stands by the shore.']);
            return true;
          }
          g.ui.showMenu('The water darkens straight down. Dive?', [
            { label: 'Dive', value: 'yes' }, { label: 'Not now', value: 'no' },
          ], (v) => { if (v === 'yes') this.diveWarp(diveSpot.to); });
          return true;
        }
      }
    }
    // Water: Surf or fish.
    if (t === '~' || t === 'W') {
      if (!this.surfing) {
        if (this.partyKnows('surf') && g.state.badges.kanto.includes('soulbadge')) {
          g.ui.showMenu('The water is a deep blue... Surf?', [
            { label: 'Surf', value: 'surf' }, { label: 'Fish', value: 'fish' }, { label: 'Not now', value: 'no' },
          ], (v) => {
            if (v === 'surf') this.startSurf(fx, fy);
            else if (v === 'fish') this.startFishing();
          });
          return true;
        }
        this.startFishing();
        return true;
      }
      return false;
    }
    // Arc 4 Stage S4: Defog — on a fog map, an interact that claimed
    // nothing else (no NPC, no sign on the faced tile) offers the
    // field move. The fog is the obstacle; the whole map is its tile.
    if (this.map.weather === 'fog' && !g.state.story.flags['defogged_' + this.mapId]
      && !this.npcAt(fx, fy) && !this.signAt(fx, fy)) {
      this.defogInteract();
      return true;
    }
    // Itemfinder hint on an empty interact.
    if ((g.state.bag.itemfinder || 0) > 0 && this.map.hidden) {
      for (const hb of this.map.hidden) {
        const flag = 'hidden_' + this.mapId + '_' + hb.x + '_' + hb.y;
        if (!g.state.story.flags[flag] && Math.abs(hb.x - fx) + Math.abs(hb.y - fy) <= 2) {
          g.ui.toast('The Itemfinder is reacting...');
          break;
        }
      }
    }
    return false;
  },

  // Stage H5: the contest entry flow — a reception greeting (the
  // ribbon already held is named honestly), a party pick, then the
  // ContestScene takes the stage. The scene owns the contest from
  // there (rounds, scoring, the ribbon award on a 1st place).
  startContest() {
    const g = this.game;
    const hall = this.map.contestHall;
    // Arc 4 Stage S4: a hall with ranks (data/contest.mjs
    // CONTEST_RANKS — Inglenook's Super Contests) picks its rank
    // first: a rank is open when its required ribbon is held (the
    // sequential Platinum ladder), and the chosen rank key then runs
    // the shipped entry flow unchanged as the scene's hall.
    const ranks = CONTEST_RANKS[hall];
    if (ranks) {
      g.ui.say(['The receptionist beams: "Welcome to the Super Contest Hall! Four ranks take this stage — Normal, Great, Ultra and Master — and each rank opens when the last is ribboned."', '"Which rank will you enter?"'], () => {
        g.ui.showMenu('Choose a rank', ranks.map((r) => ({
          label: r.label + (hasRibbon(g.state, r.key) ? ' ★' : ''),
          value: r.key,
          disabled: !!r.requires && !hasRibbon(g.state, r.requires),
        })).concat([{ label: 'Not now', value: 'no' }]), (v) => {
          if (!v || v === 'no') return;
          this.beginContest(v);
        });
      });
      return;
    }
    this.beginContest(hall);
  },

  beginContest(hall) {
    const g = this.game;
    const able = g.state.party.filter((m) => m && !m.egg && m.hp > 0);
    if (!able.length) {
      g.ui.say(['The receptionist smiles apologetically: "Oh — none of your partners is ready to take the stage. Rest them at a Center and come back!"']);
      return;
    }
    const held = hasRibbon(g.state, hall);
    g.ui.say([
      held
        ? 'The receptionist beams: "Welcome back, champion! Your ' + RIBBON_NAMES[hall] + ' is already in the case — but the stage is always open for an encore."'
        : 'The receptionist beams: "Welcome to the Contest Hall! Four entrants, four rounds of appeal — first place takes the ' + RIBBON_NAMES[hall] + '!"',
      '"Who will you enter? Choose the partner who takes the stage."',
    ], () => {
      g.ui.showMenu('Enter which Kin?', able.map((m, i) => ({
        label: displayName(m, SPECIES) + '  Lv' + m.level, value: i,
      })), (v) => {
        const mon = able[v];
        if (!mon) return;
        g.scenes.push(new ContestScene({ hall, mon, returnTo: this }));
      });
    });
  },

  // Stage H4b: Dive knowledge, in Surf's exact representation with
  // one honest difference. Surf is an in-table battle move, so its
  // knowledge IS a move slot (partyKnows reads moves). 'dive' is NOT
  // in this game's move table (no new moves this mission), so there
  // is no battle move to slot: Dive's knowledge is recorded where
  // teachMove records HM-taught field knowledge — the mon's
  // hmMoves list — without occupying a battle slot, and a mon that
  // somehow carries an in-table 'dive' slot also counts. Steven's
  // teaching (runHoennNpc) writes the hmMoves entry directly.
  partyKnowsDive() {
    return this.game.state.party.some((m) => (m.moves || []).some((mv) => mv.id === 'dive')
      || (m.hmMoves || []).includes('dive'));
  },

  // The dive/surface warp: the shipped doWarp path (banner, music,
  // autosave, position) with surfing cleared — underwater maps are
  // walked, not surfed, and the surface landing is dry land's edge.
  diveWarp(to) {
    this.surfing = false;
    this.doWarp(to, {});
    this.game.audio.playSfx('map-enter');
  },

  // ---------- Arc 4 Stage S4: Defog + Rock Climb ----------
  // Both are real HM battle moves (hm06/hm07) taught through the
  // shipped HM-teach path, so knowledge reads exactly like Surf's:
  // a move slot OR the hmMoves field-craft list (partyKnowsFieldMove
  // is partyKnows + the Dive representation). Badge gates are
  // Platinum's (Defog <- Fen Badge, Rock Climb <- Icicle Badge) read
  // generically off the badge case (badgeHeld names no region), and
  // refusals name the missing piece, the Dive idiom. Neither gate
  // exists on any shipped region's tiles: climbwall tiles stand only
  // in Borea, and fog is a maps9-only weather field.
  defogInteract() {
    const g = this.game;
    if (!badgeHeld(g.state, HM_GRANTS.defog.badge)) {
      g.ui.say(['The fog sits on the road like a held breath — too thick to walk by eye.', 'Come back with the Fen Badge in your case — Fenland\'s gym, in the marsh country. The League does not let trainers clear Borea\'s fog roads without it.']);
      return;
    }
    if (!partyKnowsFieldMove(g.state.party, 'defog')) {
      g.ui.say(['The fog sits on the road like a held breath — too thick to walk by eye.', 'You have the Fen Badge, but no partner who knows Defog. The HM waits in the Repose Ruins, east of Inglenook — the old stones keep it.']);
      return;
    }
    g.ui.showMenu('The fog is a white wall. Use Defog?', [
      { label: 'Defog', value: 'yes' }, { label: 'Not now', value: 'no' },
    ], (v) => {
      if (v !== 'yes') return;
      g.state.story.flags['defogged_' + this.mapId] = true;
      g.audio.playSfx('map-enter');
      g.ui.say(['A partner beats the air flat — once, twice — and the fog comes apart like a curtain pulled by its hem. The road stands clear. (It will gather again when you leave; fog keeps its tenancy.)']);
    });
  },

  climbInteract(fx, fy) {
    const g = this.game;
    const p = this.player;
    const dx = fx - p.tx, dy = fy - p.ty;
    const lx = fx + dx, ly = fy + dy;
    if (!this.walkable(lx, ly)) {
      g.ui.say(['A cliff face veined with old handholds — but the far side offers no footing from here. This stretch of wall goes nowhere a trainer can stand.']);
      return;
    }
    if (!badgeHeld(g.state, HM_GRANTS.rockclimb.badge)) {
      g.ui.say(['A cliff face veined with old handholds, worn smooth by weather and other climbers.', 'Come back with the Icicle Badge in your case — Rimefall\'s gym, at the top of the world. The League does not let trainers scale Borea\'s walls without it.']);
      return;
    }
    if (!partyKnowsFieldMove(g.state.party, 'rockclimb')) {
      g.ui.say(['A cliff face veined with old handholds, worn smooth by weather and other climbers.', 'You have the Icicle Badge, but no partner who knows Rock Climb. The HM was lost on Route 217, in the snow country — a hiker there is still apologising for it.']);
      return;
    }
    g.ui.showMenu('The wall is climbable. Rock Climb?', [
      { label: 'Climb', value: 'yes' }, { label: 'Not now', value: 'no' },
    ], (v) => {
      if (v !== 'yes') return;
      p.fx = p.tx; p.fy = p.ty;
      p.tx = lx; p.ty = ly;
      p.px = lx * TILE; p.py = ly * TILE;
      this.trail = [];
      g.state.story.position = { map: this.mapId, x: lx, y: ly, dir: p.dir };
      g.audio.playSfx('map-enter');
      g.ui.toast('Climbed the wall!');
    });
  },

  // ---------- Arc 4 Stage S4: the forme switches ----------
  // The XENOGENE swap generalised (game/sinnoh-systems.mjs): the same
  // evolution-idiom species exchange, preserving the individual.
  switchSinnohForme(mon, formeId) {
    if (!switchForme(mon, formeId, SPECIES)) return false;
    this.game.state.story.flags[FORME_OF[formeId] + '_forme_touched'] = true;
    return true;
  },
  formeInParty(base) {
    return this.game.state.party.find((m) => m && FORME_OF[m.speciesId] === base) || null;
  },
  griseousInteract() {
    const g = this.game;
    const mon = this.formeInParty('giratina');
    if (!mon) return false;
    const name = displayName(mon, SPECIES);
    const other = mon.speciesId === 'giratina' ? 'giratinaorigin' : 'giratina';
    const label = other === 'giratinaorigin' ? 'Origin Forme — the serpent shape of the reversed world' : 'Altered Forme — the shape it wears in this world';
    g.ui.say(['Set into the chamber floor, where no floor should hold it, rests the GRISEOUS ORB — a stone that is heavier from underneath. At ' + name + '\'s nearness it turns, slowly, the way a sleeper turns toward a voice.'], () => {
      g.ui.showMenu('Let the Orb turn ' + name + ' toward another shape:', [
        { label: SPECIES[other].name + ' — ' + label.split(' — ')[1], value: other },
        { label: 'Not now', value: 'no' },
      ], (v) => {
        if (!v || v === 'no') return;
        if (this.switchSinnohForme(mon, v)) {
          g.audio.playSfx('levelup');
          g.ui.say(['The Orb\'s weight shifts — the world tips a degree — and ' + name + ' comes undone and re-knots itself along the grain of the other world. Same partner. Same memories. New edges.', name + ' is now in its ' + SPECIES[v].name.replace('VOIDARCH (', '').replace(')', '') + ' shape.']);
        }
      });
    });
    return true;
  },
  // Arc 4 Stage S6: the Hallowed Tower (CENTWISP's site) — a faced
  // rock object on Route 209 (HALLOWED_TOWER in story-sinnoh.mjs;
  // the object-append idiom: maps9 rows unedited, the (14,6) 'R'
  // tile west of the Forsaken Tower claimed here for this map only).
  spiritombInteract(fx, fy) {
    const g = this.game;
    if (this.mapId !== HALLOWED_TOWER.map) return false;
    if (fx !== HALLOWED_TOWER.x || fy !== HALLOWED_TOWER.y) return false;
    const F = g.state.story.flags;
    if (F.arc_spiritomb_done) {
      g.ui.say(['The Weathered Tower. The keystone sits in its stones like mortar, and the tower keeps a quieter silence than it used to. Nothing in it is counting anymore.']);
      return true;
    }
    if ((g.state.bag.oddkeystone || 0) < 1) {
      g.ui.say(['The Weathered Tower: a mound of weathered stones on the Forsaken Tower road, older than the road, older than the tower. Travellers touch it for luck and then walk a little faster. Something about it suggests a missing piece — a stone that should sit in it, cracked, and cold.']);
      return true;
    }
    this.runEvent('ev_sinnoh_spiritomb');
    return true;
  },
  rotomInteract() {
    const g = this.game;
    const mon = this.formeInParty('rotom');
    if (!mon) return false;
    const name = displayName(mon, SPECIES);
    const items = FORME_FAMILIES.rotom.filter((id) => id !== mon.speciesId).map((id) => ({
      label: SPECIES[id].name + (SPARKIMP_APPLIANCES[id] ? ' — ' + SPARKIMP_APPLIANCES[id] : ' — leave the appliances behind'),
      value: id,
    }));
    items.push({ label: 'Not now', value: 'no' });
    g.ui.say(['The old television hums — and around the little room, the chateau\'s dead appliances hum back: an oven, a washer, a refrigerator, a fan, a lawn mower, all plugged into nothing, all patient. ' + name + ' is watching them the way a hermit crab watches shells.'], () => {
      g.ui.showMenu('Let ' + name + ' try a new housing:', items, (v) => {
        if (!v || v === 'no' || v === mon.speciesId) return;
        if (this.switchSinnohForme(mon, v)) {
          g.audio.playSfx('levelup');
          g.ui.say([name + ' pours itself out of one housing and into another — a spark changing its mind about furniture — and settles, crackling, into its ' + SPECIES[v].name + ' shape. The move set rides along untouched: in this house, the spark keeps its own tricks.']);
        }
      });
    });
    return true;
  },

  startSurf(fx, fy) {
    const p = this.player;
    this.surfing = true;
    p.fx = p.tx; p.fy = p.ty;
    p.tx = fx; p.ty = fy;
    p.moving = true; p.moveT = 0;
    this.game.audio.playSfx('map-enter');
  },

  startFishing() {
    const g = this.game;
    // Premium+ W3 (AN-3): the cast+hold presentation window — the player
    // renders the fishing set (cast <450ms, then hold) while it runs.
    this.fishing = { t: 0 };
    const rod = (g.state.bag.superrod > 0) ? 'super' : (g.state.bag.goodrod > 0) ? 'good' : (g.state.bag.oldrod > 0) ? 'old' : null;
    if (!rod) { g.ui.say(['The water glitters. If only you had a fishing rod...']); return; }
    const fish = this.map.encounters && this.map.encounters.fish && this.map.encounters.fish[rod];
    g.audio.playSfx('menu-move');
    if (!fish || !roll(0.55, g.rng.encounter)) { g.ui.say(['...Not even a nibble.']); return; }
    const spId = pickWeighted(fish.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = fish.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    const foe = makeMon(spId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[spId].dexNo);
    g.ui.say(['Oh! A bite!'], () => {
      g.audio.stopMusic();
      g.audio.encounter();
      // Stage J6: fished:true is the Lure Ball's marker — the rod's
      // battle start for BOTH engines (one BattleScene class; the RT
      // throw path reads this.fished exactly as the classic one does).
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, rt: rtOf(g), arena: 'water', fished: true }));
    });
  },

  sysSelect() {
    const g = this.game;
    if ((g.state.bag.bicycle || 0) > 0 && !this.map.indoor) {
      this.riding = !this.riding;
      g.ui.toast(this.riding ? 'Got on the bicycle!' : 'Got off the bicycle.');
      g.audio.playSfx('menu-move');
      return true;
    }
    return false;
  },

  // ---------- NPC systems ----------
  // ADR-025 §4 (Candy Coach): a repeatable, no-stakes 1v1 spar in every
  // Center (the NPC only exists while the House Rule is on — see
  // loadMap's gate in overworld.mjs). The Coach's partner fights at (your
  // highest level - 2); a win awards one XP Candy. A loss costs nothing
  // (BattleScene friendly flag) and the spar can be re-run immediately.
  startSpar(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(npc.dialogue.map((l) => l.replace('{player}', g.state.player.name)), cb, npc.name);
    const level = sparLevelFor(g.state);
    if (!level) { sayLines(null); return; }
    sayLines(() => {
      g.ui.showMenu('Spar with the Coach? (Partner: Lv ' + level + ' ' + SPECIES[npc.sparSpecies].name + ')', [
        { label: 'Spar', value: 'yes' },
        { label: 'Not now', value: 'no' },
      ], (v) => {
        if (v !== 'yes') return;
        const foe = makeMon(npc.sparSpecies, level, SPECIES, MOVES);
        g.scenes.push(new BattleScene({
          kind: 'wild', foe, returnTo: this, friendly: true, uncatchable: true,
          rt: g.state.settings.battleStyle !== 'classic',
          onEnd: (won, fled) => {
            // QA D1: fleeing (RUN / Teleport) ends the battle with
            // won=true + fled=true — the candy only changes hands on a
            // real win, or the spar becomes an unbounded candy farm.
            if (fled) {
              g.ui.say(['Running off mid-drill? The candy only changes hands on a win. Come back when you mean it.'], null, npc.name);
            } else if (won) {
              g.state.bag.xpcandy = (g.state.bag.xpcandy || 0) + 1;
              g.ui.say(['Clean work — that is a win in my book.', 'Here: one XP Candy. Winners earn one every time. Come back whenever you want more reps.'], null, npc.name);
            } else {
              g.ui.say(['Good reps. The nurse will patch your team up — then come back and we go again.'], null, npc.name);
            }
          },
        }));
      });
    });
  },

  // Stage O3: state-variant dialogue resolution — dialogueStates:
  // [{ flag?, flagNot?, dialogue }]; the FIRST matching entry supplies
  // the talk's lines, else the base dialogue. Only LINES are swapped:
  // every downstream flow proceeds exactly as shipped.
  npcDialogueLines(npc) {
    const g = this.game;
    const stateDlg = Array.isArray(npc.dialogueStates)
      ? npc.dialogueStates.find((st) => (!st.flag || g.state.story.flags[st.flag]) && (!st.flagNot || !g.state.story.flags[st.flagNot]))
      : null;
    return (stateDlg ? stateDlg.dialogue : npc.dialogue).map((l) => l.replace('{player}', g.state.player.name));
  },

  // Partner guarantee (hotfix): the lab handover. Fires ONLY for a
  // player whose intro completed (introDone) yet who walks without the
  // partner — the stranded shape defect 4's skip paths could write.
  // The grant runs through the intro's own idempotent core
  // (grantPartnerMon), so the state written is identical: party member,
  // dex records, metPartner + refusedBall — VOLTIK still refuses the
  // ball, here as everywhere. Everyone else returns false and
  // Hawthorn's ordinary dialogue proceeds untouched.
  talkHawthorn(npc) {
    const g = this.game, st = g.state;
    if (hasPartnerMon(st) || !st.story.flags.introDone) return false;
    const say = (lines, cb) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, npc.name);
    say(['{player}. There you are. I have been watching the road all morning, and something has been missing from it.',
      'VOLTIK is here, trainer — it never left. Whatever tangle the morning made of your first meeting, we will set it right now, properly.',
      'Go on — say hello. Careful now...'], () => {
      if (!grantPartnerMon(st, SPECIES, MOVES)) return;
      g.audio.playSfx('dex-register');
      g.ui.toast(SPECIES.partner.name + ' joined your party!');
      say(['...It shocked you too! Ha! That means it likes you. Mostly.',
        'Listen well: this one will never stay inside a Capture Orb. It walks beside you, or not at all.',
        'A bond like that is rarer than any badge. Treat it well, {player}. Now — the road is waiting.'], null);
    });
    return true;
  },

  sysNpc(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(this.npcDialogueLines(npc), cb, npc.name);
    // ADR-025 §6 (Bond echo): a character who was Close in a previous
    // journey says the line, once, on first meeting. Presentation only.
    const echoId = BOND_NPC_IDS[npc.name];
    if (echoId && takeEchoGreeting(g.state, echoId)) {
      g.ui.say([ECHO_LINE], () => { this.sysNpc(npc); }, npc.name);
      return true;
    }
    if (npc.sparCoach) { this.startSpar(npc); return true; }
    // ADR-025 §2 (Bonds): the Canopy parley pair run their scene.
    if (npc.parley) { if (this.runParleyNpc(npc)) return true; }
    // Stage O2: Amber story actors (Ivy, the four Crew leaders, the
    // stadium official, Drake) run their own scenes — challenges,
    // gates, and the two-stage Calamondin match are menu/battle flows,
    // not plain dialogue or a single trainer battle.
    if (npc.orange) { if (this.runOrangeNpc(npc)) return true; }
    // Stage J4a: Yamato story actors (Elm, the west leaders, Kurt, the
    // Sprout Elder, the well Rockets) run their own scenes.
    if (npc.johto) { if (this.runJohtoNpc(npc)) return true; }
    // Stage H4a: Maris story actors (Birch, May, Wally, Norman, the
    // west leaders, Cozmo, the two admins) run their own scenes.
    if (npc.hoenn) { if (this.runHoennNpc(npc)) return true; }
    // Arc 4 Stage S5a: Borea story actors (Rowan, Dawn, Barry, Paul,
    // the commanders, Reggie, the four leaders) run their own scenes.
    if (npc.sinnoh) { if (this.runSinnohNpc(npc)) return true; }
    // Stage H6: the Mossdeep Space Center's facade researcher carries
    // the two star arcs' briefings (no interior exists, none is faked).
    if (npc.name === 'SPACE RESEARCHER ORBIT') { if (this.runSpaceCenterNpc(npc)) return true; }
    // ADR-025 §2: the Dawnwick lab Gary is dialogue-only — his lines are
    // tier-variant (the wary set IS his authored dialogue, so a neutral
    // run reads byte-identically to before Phase 5).
    if (npc.name === 'VALE' && !npc.trainer) {
      const lines = bondSceneLines(g.state, 'gary', 'lab');
      if (lines) { g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), null, npc.name); return true; }
    }
    // Partner guarantee (hotfix): Hawthorn at his lab door runs the
    // handover for a partner who never arrived (see talkHawthorn).
    if (npc.name === 'PROF. HAWTHORN') { if (this.talkHawthorn(npc)) return true; }
    // ADR-025 §5 (Town Tales): tale actors run their stage machine;
    // a false return lets the NPC's normal flow proceed untouched.
    if (npc.tale) { if (this.runTaleNpc(npc)) return true; }
    // ADR-025 §2: a beaten gym leader whose Town Tale is complete runs
    // the bond talk. Placed after the tale hook (first claim is hers).
    if (npc.trainer) { if (this.leaderBondTalk(npc)) return true; }
    if (npc.event) {
      if (!g.state.story.flags['evdone_' + npc.event]) {
        g.state.story.flags['evdone_' + npc.event] = true;
        this.runEvent(npc.event);
      } else sayLines(null);
      return true;
    }
    if (npc.pc) { sayLines(() => this.openPc()); return true; }
    if (npc.mart) { sayLines(() => this.openMart(npc.mart.stock || [])); return true; }
    if (npc.cheat) { sayLines(() => this.openCheatShop()); return true; }
    // Arc 3.5 Stage F2: Battle Frontier receptionists + Brain audiences
    // — the controller lives in game/frontier.mjs (startFrontier et al).
    if (npc.frontier) { startFrontier(g, npc.frontier, this); return true; }
    if (npc.frontierBrain) { startBrainAudience(g, npc.frontierBrain, this); return true; }
    // Stage F3: frontierhub Scott's lines key on the symbol state,
    // which dialogueStates cannot express — his branch lives in the
    // Frontier controller (name-keyed, SPACE RESEARCHER precedent).
    if (npc.name === 'SUTTER' && this.mapId === 'frontierhub') { talkFrontierScott(g, this); return true; }
    if (npc.slots) { sayLines(() => this.openSlots()); return true; }
    if (npc.prize) {
      sayLines(() => {
        const cost = npc.prize.coins;
        const coins = g.state.bag.coin || 0;
        g.ui.showMenu(SPECIES[npc.prize.species].name + ' — ' + cost + ' coins (you have ' + coins + ')', [
          { label: 'Exchange', value: 'yes', disabled: coins < cost },
          { label: 'Not now', value: 'no' },
        ], (v) => { if (v === 'yes') { g.state.bag.coin -= cost; this.giftMon(npc.prize.species, npc.prize.level || 15, null); } });
      });
      return true;
    }
    if (npc.trade) {
      sayLines(() => {
        const have = g.state.party.find((m) => m.speciesId === npc.trade.give);
        g.ui.showMenu('Trade your ' + SPECIES[npc.trade.give].name + ' for ' + SPECIES[npc.trade.get].name + '?', [
          { label: 'Trade', value: 'yes', disabled: !have },
          { label: 'Not now', value: 'no' },
        ], (v) => {
          if (v !== 'yes' || !have) return;
          const idx = g.state.party.indexOf(have);
          const mon = makeMon(npc.trade.get, have.level, SPECIES, MOVES);
          mon.nickname = npc.trade.nickname || null;
          mon.ot = npc.name;
          mon.tradedFrom = npc.trade.give;
          g.state.party.splice(idx, 1, mon);
          dexRegister(g.state.dex, 'caught', SPECIES[npc.trade.get].dexNo);
          g.audio.playSfx('dex-register');
          g.ui.say(['Trade complete! Take good care of ' + (mon.nickname || SPECIES[mon.speciesId].name) + '.'], null, npc.name);
        });
      });
      return true;
    }
    if (npc.giveMon) {
      const flag = 'gift_' + this.mapId + '_' + npc.name;
      if (g.state.story.flags[flag]) { sayLines(null); return true; }
      sayLines(() => {
        g.state.story.flags[flag] = true;
        this.giftMon(npc.giveMon.species, npc.giveMon.level, null);
      });
      return true;
    }
    if (npc.revive) {
      sayLines(() => {
        const fossils = Object.keys(FOSSIL_OF).filter((f) => (g.state.bag[f] || 0) > 0);
        if (!fossils.length) { g.ui.say(['Bring me a fossil or Old Amber and my machine will do the rest.'], null, npc.name); return; }
        const items = fossils.map((f) => ({ label: 'Revive ' + ITEMS[f].name + ' -> ' + SPECIES[FOSSIL_OF[f]].name, value: f }));
        items.push({ label: 'Not now', value: null });
        g.ui.showMenu('Fossil revival', items, (v) => {
          if (!v) return;
          g.state.bag[v]--;
          this.giftMon(FOSSIL_OF[v], 30, null);
        });
      });
      return true;
    }
    if (npc.ferry) {
      sayLines(() => {
        const landFerry = () => {
          const dest = MAPS[npc.ferry];
          const st = (dest && dest.start) || { x: 7, y: 7 };
          this.loadMap(npc.ferry);
          this.player.tx = st.x; this.player.ty = st.y;
          this.player.px = st.x * TILE; this.player.py = st.y * TILE;
          this.player.fx = st.x; this.player.fy = st.y;
          this.trail = [];
          g.state.story.position = { map: npc.ferry, x: st.x, y: st.y, dir: 'up' };
          this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
          g.audio.playMusic(this.map.music || 'route1-theme');
        };
        // ADR-027 §2.4 (Stage F): the inter-region ferry network. An
        // NPC carrying ferryArc: '<arcId>' is a network port: the
        // outbound crossing offers only once the homecoming armed the
        // embark (embark_<id>), while any return — the destination arc
        // reached before, by any means — is unconditional and forever
        // (the NO-SOFT-LOCK LAW across regions). Riding stamps
        // reachedarc_<id> and plays the registry's en-route card
        // before landing. Plain npc.ferry NPCs (the three shipped
        // ones) never carry ferryArc and keep the exact path below.
        if (npc.ferryArc) {
          const chk = arcFerryAllowed(g.state, npc);
          if (!chk.allowed) {
            g.ui.say([arcFerryGateLine(chk.arc)], null, npc.name);
            return;
          }
          g.ui.showMenu('Sail to ' + npc.ferry + '?', [
            { label: 'Sail', value: 'yes' }, { label: 'Stay', value: 'no' },
          ], (v) => {
            if (v !== 'yes') return;
            if (chk.arc) g.state.story.flags['reachedarc_' + chk.arc.id] = true;
            const enRoute = chk.arc && chk.arc.enRouteLines ? chk.arc.enRouteLines : [];
            // W10-C seam (dormant until T1 sets enRoutePanel fields):
            // the crossing panel plays after the en-route card,
            // before landing; no field = land directly, as shipped.
            const afterCard = () => {
              const p = arcEnRoutePanel(chk.arc);
              if (p && g.ui.showPanel) { g.ui.showPanel(p.art, () => landFerry()); return; }
              landFerry();
            };
            if (enRoute.length) g.ui.say(enRoute.slice(), afterCard, '');
            else afterCard();
          });
          return;
        }
        // CINNABAR TRAP FIX (owner report 2026-10-28): a ferryGate:'surf'
        // ferry enforces the game's own Surf rule (Soul Badge + a party
        // member who knows Surf — sysInteract's pair). The ungated menu
        // once let a fresh player sail to Cinnabar with no way home;
        // return legs carry no gate (NO-SOFT-LOCK LAW).
        if (npc.ferryGate === 'surf' && !(g.state.badges.kanto.includes('soulbadge') && this.partyKnows('surf'))) {
          g.ui.say(['The crossing is no fair-weather hop, trainer.', 'Come back with the Soul Badge in your case and a partner who knows Surf — then we sail.'], null, npc.name);
          return;
        }
        g.ui.showMenu('Sail to ' + npc.ferry + '?', [
          { label: 'Sail', value: 'yes' }, { label: 'Stay', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          landFerry();
        });
      });
      return true;
    }
    if (npc.safariGate) {
      sayLines(() => {
        // Arc 4 Stage S4: the gate is generic — fee/steps/balls, the
        // entry map, the zone's map set, its hub and exit, its name
        // and its rock-word all ride the NPC's map-data config (the
        // Great Mire warden plants them; the Arden warden plants
        // none and reads every default below, byte-identical).
        const fee = npc.safariFee !== undefined ? npc.safariFee : 500;
        const steps = npc.safariSteps !== undefined ? npc.safariSteps : 500;
        const balls = npc.safariBalls !== undefined ? npc.safariBalls : 30;
        const entryMap = npc.safariMap || 'safari';
        const zoneName = npc.safariName || 'Bramble Preserve';
        if (g.state.session.safari) { this.endSafari('You left the ' + (g.state.session.safari.name || 'Bramble Preserve') + '.'); return; }
        g.ui.showMenu(zoneName + ': $' + fee + ' for ' + steps + ' steps + ' + balls + ' Safari Balls.', [
          { label: 'Enter ($' + fee + ')', value: 'yes', disabled: g.state.player.money < fee },
          { label: 'Not now', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          g.state.player.money -= fee;
          g.state.session.safari = {
            steps, maps: npc.safariMaps || [entryMap], hub: npc.safariHub || null,
            name: zoneName, rock: npc.safariRock || 'ROCK', exit: npc.safariExit || null,
          };
          g.state.bag.safariball = (g.state.bag.safariball || 0) + balls;
          const st = resolveStartPos(MAPS[entryMap], null);
          this.loadMap(entryMap);
          this.player.tx = st.x; this.player.ty = st.y;
          this.player.px = st.x * TILE; this.player.py = st.y * TILE;
          this.player.fx = st.x; this.player.fy = st.y;
          this.trail = [];
          g.state.story.position = { map: entryMap, x: st.x, y: st.y, dir: 'up' };
          this.banner = { text: MAPS[entryMap].name.toUpperCase(), t: 1.6 };
          g.ui.toast(zoneName + ' started: ' + steps + ' steps, ' + balls + ' balls!');
        });
      });
      return true;
    }
    if (npc.safariExit) {
      sayLines(() => this.endSafari('You left the Bramble Preserve.'));
      return true;
    }
    if (npc.nameRater) {
      sayLines(() => {
        const items = g.state.party.map((m, i) => ({ label: displayName(m, SPECIES) + ' (Lv' + m.level + ')', value: i }));
        items.push({ label: 'Not now', value: -1 });
        g.ui.showMenu('Whose name shall I rate?', items, (v) => {
          if (v === null || v === -1) return;
          const mon = g.state.party[v];
          g.ui.showNameEntry('Nickname for ' + SPECIES[mon.speciesId].name + '?', mon.nickname || SPECIES[mon.speciesId].name, 12, (name) => {
            if (name === null) return; // cancelled — keep the current name (S-03)
            mon.nickname = name && name.trim() ? name.trim().slice(0, 12) : null; // blank OK clears it (S-04)
            g.ui.say([(mon.nickname || SPECIES[mon.speciesId].name) + '... A fine name!'], null, npc.name);
          }, { allowCancel: true, allowEmpty: true });
        });
      });
      return true;
    }
    return false;
  },

  // ---------- Stage O2: Amber story actors ----------
  // One dispatch for every Amber NPC carrying an `orange:` key.
  // Leaders: challenge scene -> real leader battle (the Arden gym
  // idiom, via BattleScene + TRAINERS defs whose badge award writes
  // badges.orange) -> post-badge dialogue on later talks. Drake: the
  // 4-badge gate, the 6v6, then the trophy / HoF / orange_champion
  // wiring that hands completion to the Stage F transition machine.
  runOrangeNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const oBadges = (st.badges && st.badges.orange) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.orange;

    if (kind === 'ivy') {
      if (!flags.orange_gsball && !flags.ev_orange_ivy_done) { this.runEvent('ev_orange_ivy'); return true; }
      say(npc.dialogue && npc.dialogue.length ? npc.dialogue : ['The Sealed Orb is riding with you now. Treat it gently — it has seniority.']);
      return true;
    }

    if (kind === 'stadium-official') {
      if (flags.orange_champion) { say(['Champion. The stadium still talks about that final — walk in like you own the carpet. You do.']); return true; }
      if (oBadges.length < 4) {
        say(['Amber League rules, trainer — the stadium doors open at four island badges.',
          'You hold ' + oBadges.length + ' of the 4. ' + (4 - oBadges.length) + ' to go: the Crew keeps the sea road — Tangelo, Pomelo, Reefside, Calamondin.']);
        return true;
      }
      say(['Four badges. Counted, checked, and gleaming. Barrow is waiting on the arena floor, champion — give the islands a final.']);
      return true;
    }

    if (kind === 'drake') {
      if (flags.orange_champion) { say(['Still champion. The trophy case by the door has a new centrepiece — go and look at it with my blessing. Then go home, hero. The road is not done with you, but my stadium is.']); return true; }
      if (oBadges.length < 4) {
        say(['I only take finals from trainers the whole Crew has passed, {player}.',
          'You hold ' + oBadges.length + ' of the 4 island badges. Finish the Crew — then come and take my title properly.']);
        return true;
      }
      say(['So. Four badges, a full sea behind you, and my stadium gone quiet. This is the match I keep this floor polished for.'], () => {
        g.ui.showMenu('Challenge Barrow for the Amber League title?', [
          { label: 'Challenge Barrow', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startOrangeBattle('drake', (won) => { if (won) this.finishOrangeLeague(); });
        });
      });
      return true;
    }

    // ---- the Amber Crew ----
    const LEADER_BADGE = { cissy: 'coraleyebadge', danny: 'searubybadge', rudy: 'spikeshellbadge', luana: 'jadestarbadge' };
    const POST = {
      cissy: 'The lagoon is calm today. If your aim ever needs a tune-up, my range is your range, Coral-Eye holder.',
      danny: 'The mountain misses you already. It says so in avalanches. Small ones. Friendly ones.',
      rudy: 'Ah, the Spike Shell holder returns! Reefside still hums the rhythm of our battle. My ASTRION asks after your team — dancer to dancer.',
      luana: 'Darling! The Jade Star holder, in my resort. Both pairs still talk about that match — MENTARCH sulks beautifully about it.',
    };
    if (!LEADER_BADGE[kind]) return false;
    if (oBadges.includes(LEADER_BADGE[kind])) { say([POST[kind]]); return true; }

    if (kind === 'cissy') {
      say(['Welcome to Tangelo Gym, challenger. I am Sela — and on Tangelo we do this properly: first my water range, then my team.',
        'Three rings ride the lagoon swell. Call your aim for each one. It is a test of nerve, not a trap — the range is generous, and so am I. Mostly.'], () => {
        g.ui.showMenu('Take Sela\'s target challenge?', [
          { label: 'Take the range', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const shots = [
            { prompt: 'Ring one bobs left on the swell. You aim —', options: ['Lead it left', 'Dead centre', 'Wait for the dip'] },
            { prompt: 'Ring two rides higher, shining wet. You aim —', options: ['High and early', 'Dead centre', 'Low at the base'] },
            { prompt: 'The last ring spins slow as a coin. You aim —', options: ['At the glint', 'Dead centre', 'Where it will be'] },
          ];
          const fire = (i) => {
            if (i >= shots.length) {
              say(['Three rings, three splashes of light. The stopwatch approves — and so do I.', 'Now the real thing. My team, your team, the whole lagoon watching.'], () => {
                this.startOrangeBattle('cissy', null);
              });
              return;
            }
            g.ui.showMenu(shots[i].prompt, shots[i].options.map((o) => ({ label: o, value: o })), (pick) => {
              const praise = pick === shots[i].options[0]
                ? 'Clean! The ring sings as it flips.'
                : 'A splash at the edge — close enough. The range rewards nerve, not perfection.';
              say([praise], () => fire(i + 1));
            });
          };
          fire(0);
        });
      });
      return true;
    }

    if (kind === 'danny') {
      say(['You made the summit. Sit a second — no, do not sit, the wind steals chairs up here.',
        'I am Oren. My gym has no door puzzle and no trick floor: the mountain was the challenge, and you are standing on its answer. What is left is the battle — and after it, win or lose, the sled run down is this island\'s oldest ceremony.'], () => {
        g.ui.showMenu('Challenge Oren?', [
          { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startOrangeBattle('danny', (won) => {
            if (!won) return;
            say(['And now — ceremony. Two sleds, one groomed run, and the whole mountain holding its breath.',
              'You ride like you climb, champion-in-the-making. The Sea Ruby suits you. Come back any winter — the summit keeps a sled with your name chalked on it.'], null, npc.name);
          });
        });
      });
      return true;
    }

    if (kind === 'rudy') {
      const types = [];
      for (const m of st.party) {
        const sp = SPECIES[m.speciesId];
        if (sp) for (const t of sp.types) if (!types.includes(t)) types.push(t);
      }
      const typeLine = types.length
        ? 'I have been watching your team warm up. ' + types.slice(0, 4).map((t) => t[0].toUpperCase() + t.slice(1)).join(', ') + ' — a bold palette, challenger. My challenge is simple: show me you know what those types are FOR.'
        : 'My challenge is simple: a leader should know a team by its types. Show me yours in battle — that will be introduction enough.';
      say(['Renzo of Reefside. Dancer, romantic, and — ask anyone on this island — a leader who tests before he battles.',
        typeLine], () => {
        const drill = types.length
          ? types.slice(0, 4).map((t) => ({ label: 'Show the ' + t + ' heart of the team', value: t }))
          : [{ label: 'Show your best', value: 'best' }];
        g.ui.showMenu('Renzo\'s type drill — answer his test:', drill, (v) => {
          if (!v) return;
          say(['Yes. That. A type is not a label, it is a promise about how a Kin meets the world — and you keep your promises.',
            'Now we dance properly. Battle tempo, challenger — try to keep up with my ASTRION. It has never once stood still.'], () => {
            this.startOrangeBattle('rudy', null);
          });
        });
      });
      return true;
    }

    if (kind === 'luana') {
      say(['Alba, of the Calamondin resort gym. My format is famous on four islands, so I will say it plainly, darling:',
        'Mine is a double battle — two pairs, back to back, no rest. MENTARCH\'s pair first, then FOSSILORD\'s, with your team carrying every scratch from one into the other. Clear both, and the Jade Star is yours.'], () => {
        g.ui.showMenu('Take Alba\'s two-stage match?', [
          { label: 'Take the match', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startOrangeBattle('luana_a', (wonA) => {
            if (!wonA) return;
            say(['No heal, no pause — pair two, straight onto the floor. Show me the same heart at half strength, darling.'], () => {
              this.startOrangeBattle('luana_b', null);
            }, npc.name);
          });
        });
      });
      return true;
    }
    return false;
  },

  // A leader/champion battle in the Arden gym idiom: the trainer def's
  // intro lines, then a BattleScene whose badge award (winTrainer)
  // writes the badge itself. onWin(won) fires from the battle's onEnd
  // — a loss simply leaves every flag unset, so the talk re-runs.
  startOrangeBattle(trainerId, onWin) {
    const g = this.game;
    const t0 = TRAINERS[trainerId];
    if (!t0) { if (onWin) onWin(false); return; }
    const t = bondTrainerVariant(g.state, t0);
    g.ui.say(t.intro, () => {
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
        onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (onWin) onWin(!!won && !fled); },
      }));
    }, t.name);
  },

  // Drake beaten: the Winner's Trophy (collectible grant), the Amber
  // Hall of Fame entry (the shipped story.hof shape, team snapshot),
  // orange_champion + 'orange' in regionsDone — then the Stage F
  // transition machine itself fires the ARC COMPLETE card and pins
  // the "Go home" directive. No second ending is hand-rolled here.
  finishOrangeLeague() {
    const g = this.game;
    const st = g.state;
    st.story.flags.orange_champion = true;
    if (!Array.isArray(st.story.regionsDone)) st.story.regionsDone = [];
    if (!st.story.regionsDone.includes('orange')) st.story.regionsDone.push('orange');
    if (!(st.bag.winnerstrophy > 0)) st.bag.winnerstrophy = 1;
    const hof = st.story.hof || (st.story.hof = []);
    hof.push({
      team: st.party.map((m) => ({ speciesId: m.speciesId, level: m.level, nickname: m.nickname })),
      badges: ((st.badges && st.badges.orange) || []).length,
    });
    g.audio.playSfx('badge');
    g.ui.say([
      'The stadium erupts. Somewhere above the roar, an announcer is saying your name like it is a place the sea has always known.',
      'Barrow presents the WINNER\'S TROPHY — gold, salt-bright, and heavier than four badges put together. Your team is recorded in the Amber League\'s Hall of Fame.',
      'Amber League — WINNER. The Sealed Orb rides in your bag, the trophy in your hands, and the whole southern sea behind you.',
    ], () => { checkArcCompletion(g); }, '');
  },


  // ---------- Stage H4a: Maris story actors ----------
  // One dispatch for every NPC carrying a `hoenn:` key (appended at
  // loadMap from story-hoenn.mjs HOENN_NPCS). Leaders ride the shared
  // leader runner (startHoennBattle = the startJohtoBattle idiom:
  // winTrainer's award writes badges.hoenn + the badge_<root> flag),
  // behind the same badge-order gate Yamato's leaders carry (the
  // validator's prefix law, data-driven from BADGE_SETS.hoenn).
  // Birch, May, Wally, Norman, Cozmo and the admins are state-driven
  // scenes. H4b extends this dispatch at the marked seam.
  // Stage H6: the Space Center briefing (see the sysNpc dispatch —
  // SPACE RESEARCHER ORBIT, the Starfall Space Center's facade
  // researcher, is the information source for BOTH star arcs: the
  // comet news opens ASTRAEON's chain, and the crater rumour arms
  // XENOGENE. Later talks track the two arcs' states.
  runSpaceCenterNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);

    if (!flags.arc_jirachi_news) {
      say(['You found the one person in Starfall who is paid to look UP. Researcher Orbit, Space Center — the telescopes are mine, the comet is everyone\'s, and the paperwork is forever.', 'The comet, trainer. THE comet — the old one, the one in the Center\'s oldest file, the one that comes over Maris so rarely the file is mostly other centuries\' handwriting. It is crossing NOW. And the file says — every hand in it says — that when it crosses, a Wish Maker wakes under it. A small star that sleeps a thousand years and grants what it is asked. The last note in the file, in the shakiest hand, says where: wherever a piece of the sky has already fallen. Comet Falls, trainer. The falls are FULL of fallen sky.', 'And since you have the look of someone who collects impossible errands, a second one, free: something fell with the old meteor shower in that same cave and never cooled. We track it. It does not move. It does not cool. It just — waits, in the crater in the north chamber, being warm at us through three generations of instruments. If you go to the falls for the comet, {player}, go and be warm back at it. Professionally.'], () => {
        flags.arc_jirachi_news = true;
        flags.arc_deoxys_rumor = true;
        st.story.quests.arc_jirachi = 'discovered';
        st.story.quests.arc_deoxys = 'discovered';
        g.audio.playSfx('dex-register');
        g.ui.toast('Two sky errands, logged: the Wish Maker, and the thing that never cooled.');
      });
      return true;
    }
    if (flags.arc_jirachi_done && flags.arc_deoxys_done) { say(['Both of my sky errands, closed by one trainer. The comet has gone over, the crater stone is cold, and the Center\'s oldest file finally has a last page that ends the story instead of asking about it. I wrote it myself, {player}. In my best hand. It mostly says: told you so.']); return true; }
    if (flags.arc_deoxys_done && !flags.arc_jirachi_done) { say(['The crater stone went cold the day you met its tenant — our instruments noticed before our pride did. The comet is still up there, though, and the Wish Maker with it. Comet Falls, {player}. Wishes do not keep.']); return true; }
    if (flags.jirachi_star_fell && !flags.arc_jirachi_done) { say(['You SAW it come down? At the falls? Then stop standing in my telescope light, trainer — it fell by the lower falls, and a Wish Maker\'s waking is measured in days, not in however long you are about to spend admiring my instruments. Go. Be polite. Earn it.']); return true; }
    if (flags.arc_jirachi_done && !flags.arc_deoxys_done) { say(['A granted wish and a filed report — the Center is calling it the best week since the building went up. One file remains open: the crater stone in Comet Falls\' north chamber, still warm, still waiting. It has waited this long, {player}. It can wait for you to be ready. Barely.']); return true; }
    say(['The comet is up there now, trainer, crossing whether anyone watches or not. Comet Falls is where the sky has already fallen once — the Wish Maker wakes where the falling is familiar. And the crater stone is still warm. It is always, professionally speaking, still warm.']);
    return true;
    return true;
  },

  runHoennNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const hBadges = (st.badges && st.badges.hoenn) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.hoenn;
    const HOENN_LEADER_WAITS = {
      stonebadge: 'Saxa, in Copperton City\'s gym',
      knucklebadge: 'Enzo, in Mistford Town\'s gym',
      dynamobadge: 'Olin, in Lilac City\'s gym',
      heatbadge: 'Sola, in Steamspring Town\'s gym',
      balancebadge: 'Alden, in Meadowbrook City\'s gym',
      featherbadge: 'Aria, in Highbranch City\'s gym',
      mindbadge: 'Theo and Lena, in Starfall City\'s gym',
      rainbadge: 'Julen, in Craterlake City\'s gym',
    };
    const badgeOrderRefusal = (badgeId) => {
      const idx = BADGE_SETS.hoenn.indexOf(badgeId);
      if (idx <= 0 || hBadges.length >= idx) return null;
      const miss = BADGE_SETS.hoenn[hBadges.length];
      const missItem = ITEMS[miss];
      return ['The League keeps an order in Maris, challenger, and I keep it with them: the badges are earned in sequence here, west to east.',
        'You are missing the ' + (missItem ? missItem.name : miss) + ' — ' + (HOENN_LEADER_WAITS[miss] || 'its leader') + ' is where that road goes next. Win that badge first, and I will be here, ready, when you come back.'];
    };

    if (kind === 'birch') {
      if (!flags.hoenn_arrival && !flags.ev_hoenn_arrival_done) { this.runEvent('ev_hoenn_arrival'); return true; }
      if (flags.chimney_clash_done) { say(['Star-stone fed to a crater, and the sky argued about it in two colors. My instruments have been restless ever since, {player}. Whatever those teams are waking, it is older than both of them — and the Weather Institute up Route 119 reads this region\'s sky for a living. If anyone can name what is coming, they can.']); return true; }
      if (flags.meteor_falls_done) { say(['Ando wrote me a letter with shaking handwriting, {player}. A stolen meteorite and two teams with flags — that is not fieldwork anymore, that is a forecast. Keep your eyes on the sky as much as the road. Maris\'s weather has opinions this year.']); return true; }
      say(['Registered, welcomed, and only slightly mauled by the local wildlife — a complete Maris arrival, {player}. Meadowbrook first, then Copperton. And if a UMBHYEN ever corners me again, I am retiring to study sedimentary rock. Indoors.']);
      return true;
    }

    if (kind === 'may_littleroot') {
      if (!flags.may_met) {
        say(['You are the trainer who rescued Dad? He tells it with sound effects now. I am Maia — I live two doors down and I am going to win a contest ribbon before you win a badge, so... no pressure on either of us.', 'Gyms are your road. Halls are mine. But roads cross, {player} — Fairhaven has a hall, and so do Wildflower and Ashfall. Come and sit in my world sometime. I will sit in yours at Copperton and try not to grade your footwork. Much.'], () => { flags.may_met = true; });
        return true;
      }
      say(['Fairhaven, Wildflower, Ashfall — that is my road, in order. Yours has more volcanoes. I checked. See you in a hall, {player} — bring your loudest polite applause.']);
      return true;
    }

    const mayContest = (hall, gateBadge, doneFlag, ribbonFlag, preLines, beatLines, postLines) => {
      if (flags[doneFlag]) { say(postLines); return true; }
      if (!hBadges.includes(gateBadge)) { say(preLines); return true; }
      say(beatLines, () => {
        flags[doneFlag] = true;
        if (ribbonFlag) flags[ribbonFlag] = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Maia\'s contest: ' + hall + ' — noted in your Quest Log.');
      });
      return true;
    };
    if (kind === 'may_contest_slateport') {
      return mayContest('Fairhaven', 'knucklebadge', 'may_slateport_done', null,
        ['Too early, {player} — the hall wants a coordinator with sea legs, and I want one more badge\'s worth of road behind me before I face that crowd. Mistford first. Then watch me.'],
        ['You came. You actually — okay. Okay! Watch this, then. From the top, just like practice.', '...The hall lights are a different country, {player}. My appeal landed, my timing held, and the Fairhaven judges still gave the ribbon to a coordinator with six years on me — by half a point. HALF. I am not crying about it. I am taking notes about it. There is a difference, and the difference is Wildflower.'],
        ['Half a point, {player}. I have replayed it so many times the judges have started appearing in my dreams to apologize. Wildflower is next, and I am not losing that one in the last round. I have decided.']);
    }
    if (kind === 'may_contest_verdanturf') {
      return mayContest('Wildflower', 'dynamobadge', 'may_verdanturf_done', 'may_ribbon_verdanturf',
        ['Wildflower is the serious hall, {player} — small room, sharp judges. I am not stepping in there until Lilac is behind you and my new appeal is behind ME. Olin first. Then this.'],
        ['Small room. Sharp judges. New appeal. Deep breath... and — YES. Yes! Did you see the last round? The whole hall stood up, {player}, the whole hall!', 'My first ribbon. Wildflower. It is going on the case exactly like this, dust and all, so I remember what earning one feels like. Your road taught me something, you know: you do not wait to feel ready. You enter, and readiness catches up. Ashfall next. Their crowd is harsher. So am I, now.'],
        ['Wildflower, {player}. First ribbon. I still take it out of the case sometimes just to check it is real. It is. Ashfall is next — ash, hard judges, harder applause. Perfect.']);
    }
    if (kind === 'may_contest_fallarbor') {
      return mayContest('Ashfall', 'heatbadge', 'may_fallarbor_done', 'may_ribbon_fallarbor',
        ['Ashfall judges have seen everything twice and applauded once, {player}. I picked this hall on purpose — but not before Steamspring. Sola first. A coordinator keeps her order too.'],
        ['Kian on the windows, silence like a held breath — and then the last appeal landed and the whole room came up out of its seats like startled birds. ASHFALL, {player}! They applauded. THIS crowd applauded!', 'Two ribbons. Fairhaven taught me the half point, Wildflower taught me the entry, and Ashfall — Ashfall taught me the room is mine if I walk in like it is. Lotus Cove is the last hall on my road. When your road bends east, come and see how this story ends.'],
        ['Two ribbons, {player}, and the hardest room in Maris stood up for the second one. Lotus Cove remains — the last hall, out east where your gym road is going anyway. See you there.']);
    }

    if (kind === 'wally') {
      if (!flags.wally_helped) {
        say(['Oh — excuse me. You are a trainer, aren\'t you? I can tell. Everyone here can always tell, and I — I am Emil. I am moving away soon, to Wildflower, for my health. The air, the doctors say.', 'I asked my family for a Kin of my own before we go, and they said yes, if — if I could catch one. Me. The pond grass past the gym has PSYLET in it sometimes. I have a ball, and a borrowed FURCOON from my neighbor, and hands that shake at exactly the wrong moments. Would you... walk with me? Just to the grass. Just so the shaking is not the loudest thing there.'], () => {
          say(['The grass shivers. A PSYLET — small, horned, already turning away — and the borrowed FURCOON looks back once, waiting to be believed in.', 'You did it. YOU DID IT — no, wait. WE did it. PSYLET, I — thank you. Thank you for not running. I will take care of you. I will learn how, I promise, I will learn everything.', 'I have a Kin. I HAVE a Kin, {player}. When I am stronger — when we are both stronger — our road is going to cross yours again, and I am not going to be the boy who needed help standing in the grass. Remember my name for then. Emil. Remember it kindly.'], () => {
            flags.wally_helped = true;
            flags.wally_ralts = true;
            g.audio.playSfx('dex-register');
            g.ui.toast('Emil caught a PSYLET!');
            this.runSteps([{ actorExit: { who: 'emil@petalburg', to: [29, 8] } }, { actorShow: { who: 'emil@victory-road-maris' } }], 0, null);
          }, 'EMIL');
        });
        return true;
      }
      say(['PSYLET is learning my moods faster than my doctors ever did, {player}. Wildflower soon — the air there, and my uncle\'s house, and a whole new road. When it crosses yours again, I will not be hard to recognize. I will be the one who is ready.']);
      return true;
    }

    if (kind === 'norman') {
      if (!flags.norman_met) {
        say(['Alden. I keep this gym, and the road to it: four badges stand between a challenger and my door, by the League\'s order and by my own judgment.', 'You have the look of a road that ends here eventually, {player}. Walk it honestly. When you stand in this room with four badges, I will not be a formality — I will be the wall the first half of Maris was building toward. Go and earn the meeting.'], () => { flags.norman_met = true; });
        return true;
      }
      if (hBadges.includes('balancebadge')) { say(['Balance, held — by the trainer I deferred in this room, which remains my favourite sentence of the year. East now, {player}: the rain road, the sea, the deep. Keep standing honestly.']); return true; }
      if (hBadges.length < 4) {
        say(['The road is counting, {player}: ' + hBadges.length + ' of the four badges my door asks for. Copperton, Mistford, Lilac, Steamspring — in that order, earned honestly. I will be here. Balance keeps.']);
        return true;
      }
      // H4b: four badges held — the deferred meeting pays off.
      // Norman falls through to the shared leader runner below
      // (LEADERS.norman carries his entry).
    }

    if (kind === 'cozmo') {
      if (!flags.meteor_falls_done) { say(['Mind the spray, mind the ledges, and mind any scarves — red OR blue — that you meet in my cave, trainer. The meteorites here fell before there were teams to want them. I intend them to outlast the wanting.']); return true; }
      say(['Gone to a crater, my finest stone, and the mountain spat the plan back out — for now. Teams like that do not retire, {player}; they relocate. A weather station, a shrine, a cavern under the sea. Maris is old machinery all the way down, and both crews are collectors.']);
      return true;
    }
    if (kind === 'magma_admin_npc') {
      if (!flags.chimney_clash_done) { say(['Walk away from the crater, trainer. What is bolted into that machine is older than your whole journey, and it is about to remember fire.']); return true; }
      say(['Delayed by a bystander and a tide with legs. The land keeps, {player}. So do we. Next time we choose ground you cannot reach so politely.']);
      return true;
    }
    if (kind === 'aqua_admin_npc') {
      if (!flags.chimney_clash_done) { say(['Blue scarves hold the far slope, trainer. Whatever you think of us — the crater does not get fed today. See to the red ones.']); return true; }
      say(['The crater is quiet and the stone is gone to whichever pocket the sea provided. Watch the sky, {player}. When it starts choosing sides, you will know both crews failed to stop each other.']);
      return true;
    }
    if (kind === 'weather_watcher') {
      say(['I read this valley\'s rain for the Weather Institute, up Route 119 — every gauge, every gust, written down twice. Lately the instruments argue with the sky, {player}, and when instruments argue, wise people recheck the oldest ones.', 'The Institute is stocking field teams this season, did you hear? Red scarves asking about drought records. Blue ones asking about rain. Scientists are flattered right up until they are frightened. I am at the frightened stage, personally.']);
      return true;
    }

    // ---- H4b east actors ----
    if (kind === 'may_contest_lilycove') {
      return mayContest('Lotus Cove', 'featherbadge', 'may_lilycove_done', 'may_ribbon_lilycove',
        ['Lotus Cove is the last hall, {player} — and the biggest. I am not walking into it until the Feather Badge is yours and the sea road is behind us both. Aria first. Then watch me finish this.'],
        ['Harbour lights, a full house, and my whole road in one appeal set... and the last card turned MY way, {player}. LOTUS COVE. Three ribbons. Fairhaven\'s half point is IN this one — I spent it here, on the biggest floor in Maris, and it was worth every fraction.', 'One thing remains, and it is not in a hall like the others. The Grand Festival. Coordinators from the whole region, one stage, invitations earned in ribbon cases like mine. Mine just qualified. When your road lets you, harbourside — I will tell you the rest where the boats can hear it.'],
        ['Three ribbons, {player}, and a Festival invitation with my name spelled right. Harbourside, when you are ready — the ending of my road is a boat ride and a promise.']);
    }
    if (kind === 'may_festival') {
      if (flags.may_festival_done) { say(['The Festival is behind me and the whole sea road is ahead, {player}. Whatever hall is next — and there is always a next one — it gets the coordinator Lotus Cove made. Wish your road the same: endings that are also doors.']); return true; }
      if (!flags.may_lilycove_done) { say(['You found me rehearsing, {player}. The Lotus Cove hall first — a coordinator keeps her order too. Three ribbons, then this conversation, in that sequence.']); return true; }
      say(['Here it is, then — the end of my road, said out loud where the boats can hear it. The Grand Festival committee read my case this morning: Fairhaven\'s schooling, Wildflower, Ashfall, Lotus Cove. The invitation is real, {player}. I am sailing for the Festival at the next tide.', 'You sat in my world at every hall on this coast. So hear the last of it as my guest, not my audience: whatever the Festival decides, this road was mine, I walked it at full stretch, and I am not afraid of its ending. That is what your gyms taught me, by the way. Do not tell the judges.', 'Four ribbons ride in my case now — the Festival\'s own commendation makes the set, whatever the big stage decides. Go and finish YOUR road, {player}. Perennial is lit. I will be cheering loud enough to grade the echo.'], () => {
        flags.may_festival_done = true;
        flags.may_grand_festival_done = true;
        flags.may_ribbon_grandfestival = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Maia departed for the Grand Festival — four ribbons in her case.');
      });
      return true;
    }

    if (kind === 'steven') {
      if (!hBadges.includes('mindbadge')) { say(['Alban Stone. I collect rare stones, rarer battles, and — lately — weather reports I do not enjoy. The twins keep this city\'s gym, trainer. What I teach is for Mind Badge holders only: the deep road is not a shortcut, and it does not forgive tourists.']); return true; }
      if (flags.dive_taught || this.partyKnowsDive()) { say(['The trenches are open to you now, {player}. Remember what the deep is: not a place that hates you — a place that has never once needed you. Surface whenever you choose; the way up asks nothing. That is the whole ethic of diving, and of most worthwhile roads.']); return true; }
      say(['Alban Stone — and you hold the Mind Badge, which makes this your lesson to claim. Dive: the field craft of descending at the dark-water spots the old charts mark, trenches off Routes 124, 126, 127, 128, and one very private lake in Craterlake. It is knowledge, not a battle move — it will ride in your partner\'s field craft, the way the old HM teachings are kept, and it will never take a battle slot.', 'Choose the partner who learns it. Choose a strong swimmer at heart; the deep can tell.'], () => {
        const items = st.party.map((m, i) => ({ label: displayName(m, SPECIES), value: i }));
        items.push({ label: 'Not yet', value: -1 });
        g.ui.showMenu('Who should learn Dive?', items, (v) => {
          if (v === null || v === -1) return;
          const mon = st.party[v];
          if (!mon) return;
          mon.hmMoves = mon.hmMoves || [];
          if (!mon.hmMoves.includes('dive')) mon.hmMoves.push('dive');
          flags.dive_taught = true;
          g.audio.playSfx('dex-register');
          g.ui.say([displayName(mon, SPECIES) + ' learned Dive!', 'Mind the gate the League keeps on it: badge and knowledge, both, or the trench refuses you — by name, so you always know what is missing. The way UP asks nothing. Ever. Surface spots are doors that only open outward.'], null, 'ALBAN');
        });
      });
      return true;
    }

    if (kind === 'liza_flavor') {
      if (hBadges.includes('mindbadge')) { say(['Two minds, one gym, one badge — given. Theo is replaying your second battle in his head and losing it more slowly each time. That is his way of applauding.']); return true; }
      if (flags.beat_tate) { say(['My half is next, challenger. Theo was the introduction. I am the argument. Speak to him when you are ready to begin again — we keep our order, even mid-lesson.']); return true; }
      say(['Theo opens, I close, and the gym is the conversation between us. He is waiting, challenger — left half first.']);
      return true;
    }
    if (kind === 'tate_liza') {
      if (hBadges.includes('mindbadge')) { say(['The Mind Badge, held — the pair\'s whole lesson, learned. The deep road is yours now, challenger. Alban\'s house, by the shore. Tell him the twins sent their best student.']); return true; }
      const orderRefusal = badgeOrderRefusal('mindbadge');
      if (orderRefusal) { say(orderRefusal); return true; }
      // The pair, staged back to back (the recorded adaptation at
      // their trainer defs): Tate's battle, then — on a win only —
      // Liza's, which carries the badge. Losing to Liza leaves
      // beat_tate standing; the pair re-runs in order.
      const challengeLiza = () => {
        const lt = TRAINERS.liza;
        say([lt.intro[0]], () => {
          g.ui.showMenu('Face Lena — the second half?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startHoennBattle('liza', null); });
        }, 'LENA');
      };
      if (flags.beat_tate) { challengeLiza(); return true; }
      const tt = TRAINERS.tate;
      say([tt.intro[0]], () => {
        g.ui.showMenu('Face Theo — the first half?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startHoennBattle('tate', (won) => { if (won) challengeLiza(); });
        });
      }, 'THEO');
      return true;
    }

    if (kind === 'wally_final') {
      if (flags.wally_final_done) { say(['Right behind you, forever, one road back and closing, {player}. That was always the promise. The doors are yours — walk through them like the whole of Maris is watching. It is. I checked. I am some of it.']); return true; }
      if (!hBadges.includes('rainbadge')) { say(['You — here? No. Not yet, {player}. Not before Craterlake, not before the last badge. I waited a whole region for this battle to mean the whole region. Earn the full road first. Then find me where the victories are kept. I will be standing in it.']); return true; }
      const wt = TRAINERS.wally_final;
      say([wt.intro[0].replace('{player}', st.player.name)], () => {
        g.ui.showMenu('Face Emil — Crown Road?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startHoennBattle('wally_final', (won) => { if (won) flags.wally_final_done = true; });
        });
      }, 'EMIL');
      return true;
    }

    if (kind === 'lucario_keeper') {
      // The AURAJACK special (chronology-mapping.md, Chapter 6 —
      // "Rise Through Maris": AURAJACK and the Mystery of PRIMARA is
      // listed among Maris's special story events, so it stages
      // IN-ARC, here). Original writing; the Tree of Beginning beat
      // is abstracted to our fiction — a great-tree root chamber in
      // Meadowbrook Woods and an aura that walked like a friend.
      // Honest limit, recorded: AURAJACK is a Borea-dex species
      // (Arc 4's horizon), so no AURAJACK battle or catch is staged
      // or faked here; the event is the aura-legend beat itself.
      if (flags.lucario_event_done) { say(['The tree keeps its counsel and its flowers, {player}. Some meetings are not battles, and some friends are not caught. They are recognised. Walk well — something in the wood is walking well because you stopped here.']); return true; }
      say(['You feel it too, then. Everyone with a kind team does, eventually, in this part of the wood. Sit a moment, trainer. The old tree is telling its story again, and it tells it in aura, not words — I only translate.', 'Long ago — the keepers\' count says before the gyms, before the League — a guardian walked these woods whose aura burned the blue of deep water. No ball ever held it. No trainer ever commanded it. It came when the tree was threatened, it fought like weather, and it stayed, afterward, the way a friend stays: without being asked twice.', 'The time-flowers still open along the roots when a worthy aura passes. Look — along the north root. Opening. For YOUR team, trainer, the way the stories say they opened for the guardian\'s friend, all those centuries ago. Whatever road that aura walked next... the flowers think yours rhymes with it.', 'Take that with you. Not a badge, not a ribbon — a recognition. The wood remembers a lucario-hearted guardian, and today it decided your team walks in the same light. Somewhere far north, in a region of mountains and snow, that story has a second half. But its first half happened HERE, in Maris\'s green dark, and now you are in it.'], () => {
        flags.lucario_event_done = true;
        flags.lucario_aura_seen = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('The aura flowers opened — the AURAJACK legend, witnessed in Maris.');
      });
      return true;
    }

    if (kind === 'origin_keeper') {
      if (flags.climax_resolved) { say(['The cave is quiet, the lake is a lake again, and the sky over my city has gone back to arguing in private, the way weather should. You pointed UP, trainer, when pointing was the hardest work in the world. Craterlake remembers.']); return true; }
      if (flags.standoff_seen) {
        say(['You have seen them, then — the two old answers, glaring across my city\'s water. The cave behind me is where their argument was first carved, and carving is all it can do now. The ANSWER is not down here, trainer. It never was.', 'It is UP. East of Driftlog, where the charts go polite and vague, a pillar stands that the sky built for its own guardian. Climb it. Wake what sleeps at its top. And when the green light comes down — be somewhere the whole region can see you standing. It matters that someone stood.'], () => { flags.origin_guidance = true; });
        return true;
      }
      if (flags.climax_drought || flags.climax_deluge) { say(['The cave mouth is weeping steam, trainer, and the old carvings are too hot — or too drowned — to read. Whatever has woken, the answer to it is not in this cave. It is ABOVE. Remember that when the city needs it: above.']); return true; }
      say(['I keep the Worldroot Cave — the first argument, carved in stone, between the land that rose and the sea that covered it. The carvings are quiet today, trainer. Keep them that way, if the road ever gives you the choice.']);
      return true;
    }

    if (kind === 'hoenn_conference') {
      if (flags.hoenn_complete) { say(['The bracket is archived, the confetti is swept, and your name is in the Perennial book in the good ink, trainer. A man named Sutter has been asking after you by name, which at a Conference means exactly what you hope it means.']); return true; }
      if (hBadges.length < 8) { say(['Conference registration, trainer — and your case is not finished yet. Eight Maris badges open this bracket; you hold ' + hBadges.length + '. Craterlake is the usual last stop, and it is reached from below. I will keep your page open.']); return true; }
      if (!flags.climax_resolved) { say(['Eight badges — counted, verified, well carried. And yet I cannot open the bracket while the sky itself is undecided, trainer. Finish the region\'s weather first. The Conference will be here; it has waited through worse than a titan or two. Well. Comparable.']); return true; }
      if (!flags.hoenn_conference_registered) {
        say(['Eight badges, a quiet sky, and a name the harbour has been carrying for weeks. Let me write you into the Perennial Conference properly... There. Registered.', 'The bracket: two preliminary battles, here in this hall — then Morrison, who has been telling the stands you are his favourite problem — then the final. Tyson waits at the end of it, with a TINKLETOM that has never smiled at anyone. Begin when you are ready: speak to me for each preliminary.'], () => {
          flags.hoenn_conference_registered = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('Registered for the Perennial Conference!');
        });
        return true;
      }
      if (!flags.beat_conference_h_p1) {
        say(['Preliminary one, trainer. Soren, of the sea roads — a clean battler with a cleaner record. The floor is yours when you call it.'], () => {
          g.ui.showMenu('Begin preliminary one?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startHoennBattle('conference_h_p1', null); });
        });
        return true;
      }
      if (!flags.beat_conference_h_p2) {
        say(['One down. Preliminary two: Priya, who has taken four pages of notes on you and titled the fifth after your defeat. Correct her, would you?'], () => {
          g.ui.showMenu('Begin preliminary two?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startHoennBattle('conference_h_p2', null); });
        });
        return true;
      }
      if (!flags.beat_morrison) { say(['The preliminaries are behind you, and the semi-final has a friend\'s face: Morrison is on the pitch, warming up like the bracket insulted him personally. It did. It put you in his way.']); return true; }
      if (!flags.tyson_faced) { say(['Morrison is beaten — he is in the front row now, cheering for both finalists at professional volume. Tyson is on the pitch. End this Conference properly, trainer.']); return true; }
      say(['The Conference is decided, and decided honestly. The book has it. So does everyone who was here.']);
      return true;
    }

    if (kind === 'morrison') {
      if (flags.hoenn_complete) { say(['Front row, finals, my best friend in one and my favourite defeat in the other. Best week of my life, {player}, and I came SECOND-to-last in it. Imagine how the rest of my year feels. Go — Sutter has been pacing the harbour steps with an envelope and a grin.']); return true; }
      if (flags.beat_morrison) { say(['Beaten, fairly, in a semi-final I will be dining out on for years. Tyson, {player}. The final. His TINKLETOM has never smiled at ANYONE. Make it the second-most interesting thing about your day.']); return true; }
      if (!flags.beat_conference_h_p2) { say(['Morrison! Semi-finalist, optimist, and — between us — the bracket\'s favourite problem. Preliminaries first, friend: Soren, then Priya. THEN you may have my full and undivided defeat.']); return true; }
      const mt = TRAINERS.morrison;
      say([mt.intro[0]], () => {
        g.ui.showMenu('Face Morrison — the semi-final?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.startHoennBattle('morrison', null); });
      }, 'MORRISON');
      return true;
    }

    if (kind === 'tyson') {
      if (flags.hoenn_complete) { say(['The book is closed and your name is in it in the good ink, trainer. Whatever either of us does next, this hall saw the real thing. Travel well. TINKLETOM and I will be telling this one for years — TINKLETOM is already telling it, to the harbour, at volume.']); return true; }
      if (!flags.beat_morrison) { say(['Tyson. We are on a collision course, you and I — but Morrison is your road to me, and the bracket does not bend. Beat my friend first. I will be here, and I will be ready either way.']); return true; }
      // The final (mechanism recorded at his trainer def — the
      // Harrison precedent, mirrored): a real full-strength battle
      // fought FRIENDLY, completion predicate FACED. Win or lose,
      // the branch-true honours play, Scott delivers the Frontier
      // invitation HERE at the Conference, hoenn_complete is set,
      // and the Foundation machine fires itself (checkArcCompletion
      // — ARC COMPLETE card, regionsDone via the machine's own
      // write, the pinned Frontier directive). Nothing here writes
      // regionsDone or an ending by hand.
      say(['So it is us. Morrison is beaten — I watched it from the tunnel, front-row ticket courtesy of my friend\'s enormous heart, and I will carry that match whatever happens here.', 'Final rules, trainer, and Conference stakes. Give me everything you gave him. TINKLETOM and I did not cross this bracket for less.'], () => {
        g.ui.showMenu('The final — face Tyson?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const tt2 = bondTrainerVariant(g.state, TRAINERS.tyson);
          g.scenes.push(new BattleScene({
            kind: 'trainer', trainer: tt2, returnTo: this, rt: rtOf(g), friendly: true,
            onEnd: (won, fled) => {
              if (fled) return;
              recordBattleBond(g.state, tt2.id, won, fled);
              flags.tyson_faced = true;
              if (won) flags.tyson_won = true; else flags.tyson_lost = true;
              const lines = won ? [
                '...Well. WELL. The card may argue with the papers, trainer, but I was ON the floor: you out-played me, exchange for exchange, in a final. An upset, they will call it in the harbour. It was not an upset. I was there. It was a better team on the biggest day Maris has.',
                'Take the honours road with my respect — you beat everyone this bracket owns, back to back, and the last of them is standing here applauding. Whatever the book says, this hall knows what it saw.',
              ] : [
                '...It is decided. The final exchange — TINKLETOM endures by a whisker and a promise, the crowd comes up off its seats like a tide, and the judges\' card, when it turns, says Tyson. By the narrowest margin this hall has ever recorded.',
                'Do not hang your head. DO NOT. You carried eight badges across a region that was ending its own weather, you calmed two titans and a sky, and you took me to the last Kin I own. The loss stands — that is sport. So does everything you did to get here — that is history. Morrison is on his feet. The whole hall is. Look at them, trainer. That sound is yours.',
              ];
              say(lines, () => {
                say(['Trainer. TYSON\'s trainer — and everyone still standing. My name is Sutter. I scout battle the way other men scout weather, and I have watched every match you fought in this hall with an envelope in my pocket getting heavier by the round.', 'Inside it: an invitation. Seven facilities, seven Frontier Brains, one island off Arden where battle is the whole civilisation. The Trial Grounds, trainer. When you have rested — when HOME has had you back a while — that envelope is your next horizon. Bring the team you trust most. The Frontier does not care where you have been. Only how you fight.'], () => {
                  flags.scott_invitation = true;
                  flags.hoenn_complete = true;
                  g.audio.playSfx('badge');
                  say(['Perennial Conference — the run ends in honours, and Maris ends with it: eight badges, two titans calmed, a sky handed back its weather, and a final that will be argued about in Lotus Cove harbour for a decade. The road home is waiting, trainer. It always was.'], () => { checkArcCompletion(g); }, 'NARRATOR');
                }, 'SUTTER');
              }, 'TYSON');
            },
          }));
        });
      });
      return true;
    }

    if (kind === 'scott') {
      if (flags.hoenn_complete) { say(['The envelope is delivered and the scouting is done — my favourite kind of day. Home first, trainer: Dawnwick, your mother\'s cooking, a professor with questions. The Frontier keeps. It has waited this long; it can wait for you to be rested. That, too, is strategy.']); return true; }
      say(['Sutter. I scout battle — facilities, frontiers, trainers worth an envelope. I am not saying you are carrying one of my envelopes in your future, trainer. I am saying I bought the envelope. Finish your Conference. We will talk at the end of it.']);
      return true;
    }

    // ---- the west leaders ----
    const LEADERS = {
      roxanne: { badge: 'stonebadge', gate: null, gateLines: [],
        post: 'The quarry road north runs past Comet Falls, challenger. The stone up there fell out of the sky — Saxa\'s professional opinion is that it should be admired, not argued over. Mind who else admires it.' },
      brawly: { badge: 'knucklebadge', gate: null, gateLines: [],
        post: 'The boatman runs Mistford to Fairhaven whenever the tide allows, Knuckle Badge holder. Maia\'s world is showing in the hall there — a surf man recommends the seats. The view is all footwork.' },
      wattson: { badge: 'dynamobadge', gate: null, gateLines: [],
        post: 'Wahahaha! Still sparking, Dynamo Badge holder! The Wildflower hall is west through the tunnel road, and the volcano road is north — an old electrician recommends the volcano second and the hall first. Order matters in wiring AND journeys!' },
      flannery: { badge: 'heatbadge', gate: null, gateLines: [],
        post: 'The springs are that way, Heat Badge holder, and you have earned every degree of them. Ashfall lies past the ash fields north — take a breath before you go in. The air up there is half mountain already.' },
      norman: { badge: 'balancebadge', gate: null, gateLines: [],
        post: 'Balance, held. East now, Balance Badge holder: the rain road to Highbranch, then the sea itself. The Institute on Route 119 has gone quiet on the radio, they say. Nothing in Maris stays quiet for long this year.' },
      winona: { badge: 'featherbadge', gate: null, gateLines: [],
        post: 'The Feather Badge suits you, challenger — light, and earned at altitude. Lotus Cove is east: a harbour, a hall, and a mountain of the dead beyond it. The sky sends its regards to all three.' },
      juan: { badge: 'rainbadge', gate: 'climax_resolved', gateLines: ['Ah — the challenger who surfaced in my lake. I know your road, and I know the sky above it is not finished arguing. My gym is the last QUIET water in Maris, challenger, and I will not conduct its final while the region\'s weather is still deciding the score. End the titans\' argument first. Then come and take the Rain Badge from a finished world.'],
        post: 'Eight badges, Rain Badge holder, and a region breathing evenly again. Perennial, challenger. The Conference is lit, and I shall be in the stands with the whole of Craterlake, conducting nothing at all. A holiday.' },
    };
    const L = LEADERS[kind];
    if (!L) return false;
    if (hBadges.includes(L.badge)) { say([L.post]); return true; }
    const orderRefusal = badgeOrderRefusal(L.badge);
    if (orderRefusal) { say(orderRefusal); return true; }
    if (L.gate && !flags[L.gate]) { say(L.gateLines); return true; }
    const t0 = TRAINERS[kind];
    say([t0.intro[0]], () => {
      g.ui.showMenu('Challenge ' + t0.name + '?', [
        { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
      ], (v) => { if (v === 'yes') this.startHoennBattle(kind, null); });
    });
    return true;
  },

  // The shared leader runner, Maris seat (startJohtoBattle's idiom).
  startHoennBattle(trainerId, onWin) {
    const g = this.game;
    const t0 = TRAINERS[trainerId];
    if (!t0) { if (onWin) onWin(false); return; }
    const t = bondTrainerVariant(g.state, t0);
    g.scenes.push(new BattleScene({
      kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
      onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (onWin) onWin(!!won && !fled); },
    }));
  },

  // ---------- Arc 4 Stage S5a: Borea story actors ----------
  // One dispatch for every NPC carrying a `sinnoh:` key (the actors
  // loadMap appends from story-sinnoh.mjs SINNOH_NPCS). Leaders ride
  // the shared leader runner; the badge-order refusal reads
  // badges.sinnoh (the generic Yamato/Maris path). Paul's beats are
  // the arc's spine: the lab battle is an entry EVENT (ev_sinnoh_lab);
  // here are his Heritage assessment, the Inglenook SIMMER beat, and
  // the Shardfall audit battle. Dawn's Inglenook beat mirrors May's
  // contest beats (dialogue-only story state on the shipped Super
  // Contest system — the player's own ranked entries are S4's).
  runSinnohNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const sBadges = (st.badges && st.badges.sinnoh) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.sinnoh;
    const SINNOH_LEADER_WAITS = {
      coalbadge: 'Ronan, in Coalseam City\'s gym',
      forestbadge: 'Tansy, in Heritage City\'s gym',
      relicbadge: 'Odile, in Inglenook City\'s gym',
      cobblebadge: 'Maren, in Shardfall City\'s gym',
      fenbadge: 'Breaker Braddock, in Fenland City\'s gym',
      minebadge: 'Doran, in Bridgeport City\'s gym',
      iciclebadge: 'Neve, in Rimefall City\'s gym',
      beaconbadge: 'Rainer, in Brightshore City\'s gym',
    };
    const badgeOrderRefusal = (badgeId) => {
      const idx = BADGE_SETS.sinnoh.indexOf(badgeId);
      if (idx <= 0 || sBadges.length >= idx) return null;
      const miss = BADGE_SETS.sinnoh[sBadges.length];
      const missItem = ITEMS[miss];
      return ['The League keeps an order in Borea, challenger, and I keep it with them: the badges are earned in sequence here, coast to mountain.',
        'You are missing the ' + (missItem ? missItem.name : miss) + ' — ' + (SINNOH_LEADER_WAITS[miss] || 'its leader') + ' is where that road goes next. Win that badge first, and I will be here, ready, when you come back.'];
    };

    if (kind === 'rowan') {
      if (!flags.sinnoh_arrival && !flags.ev_sinnoh_arrival_done) { say(['The lab is at the north end of Shingle, trainer — tall windows, taller reputation.']); return true; }
      // Stage S6: Rowan delivers the two post-Conference gifts (the
      // CLIONARCH Egg, then Oak's Letter) — two talks, fixed order;
      // the egg is refused (nothing set) when there is no room.
      if (flags.sinnoh_complete && !flags.manaphy_egg_received) {
        say(['Ah. {player}. Come here — carefully, mind the warmth lamp. Something has been keeping this lab warmer than my tea since before the Conference, and it has your name on the crate.', 'A Ranger out of Fiore delivered it — by sea, by hand, the whole way, with instructions stricter than my own: the blue Egg goes to the trainer who finished the Lily of the Valley road, and to no one sooner. It hatches at the band floor of whatever road it walks, {player} — here, that means level 301, and it means CLIONARCH. The sea keeps a prince. Walk it gently.'], () => {
          const res = deliverEggCapSafe(st, 'manaphy');
          if (!res || !res.ok) { g.ui.say(['No room, {player} — party full and boxes full. Make space and come back; the Egg is not going anywhere warmer than right here.'.replace('{player}', st.player.name)], null, npc.name); return; }
          flags.manaphy_egg_received = true;
          if (st.story.quests.arc_manaphy === undefined) st.story.quests.arc_manaphy = 'active';
          g.audio.playSfx('item-get');
          g.ui.say([st.player.name + ' received the mysterious blue EGG! (It rests ' + (res.dest === 'party' ? 'in your party' : 'in the PC box') + '. Keep it close, and walk.)'], null, npc.name);
        });
        return true;
      }
      if (flags.sinnoh_complete && !flags.oaks_letter_received) {
        say(['One more trust, while you are standing in my lab, {player}. Samuel Hawthorn was in Borea in the spring. He walked the white-stone road north of the League, stood in a flower field that should not exist, and came back quieter than I have ever seen him.', 'He left this letter in my keeping, sealed, with one instruction: it goes to the trainer who finishes the Conference road — the field only opens for gratitude, he said, and gratitude should be EARNED before it is carried. It is yours. The Foamline Path, {player}. Mind the bloom.'], () => {
          flags.oaks_letter_received = true; st.bag.oaksletter = (st.bag.oaksletter || 0) + 1;
          if (st.story.quests.arc_shaymin === undefined) st.story.quests.arc_shaymin = 'discovered';
          g.audio.playSfx('item-get');
          g.ui.say([st.player.name + " received HAWTHORN'S LETTER!"], null, npc.name);
        });
        return true;
      }
      if (flags.galactic_eterna_done) { say(['Nova left a page behind, I am told. The lakes, underlined. My oldest books are missing their statue rubbings, {player} — and a thief who steals HISTORY is planning to use it. Walk carefully, and watch the water.']); return true; }
      say(['Registered, measured, and only slightly audited by my least diplomatic colleague. Coalseam first, {player}: east through Revelry, then the mine road. Ronan keeps the Coal Badge, and a fossil collection worth the walk on its own.']);
      return true;
    }

    // Stage S6: Buck — meeting him (post-climax) discovers MAGMARCH.
    if (kind === 'buck') {
      if (flags.arc_heatran_done) say(['Caught him proper, did you? Ha! The mountain\u2019s temper and my temper both — settled. You climb like family now, trainer. Mind the stone stays PUT.']);
      else if (flags.magma_stone_returned) say(['Stone\u2019s back, and you can feel the change through your boots, can\u2019t you? He wakes slow. Go up and knock on the crater, trainer — politely. With your whole team.']);
      else if (flags.buck_met) say(['Stone\u2019s still rolled off its seat up there — I can tell by the way the mountain breathes wrong. We\u2019ll set it right together, you and me. The hall at the top, trainer. I\u2019ll keep your pace.']);
      else if (flags.sinnoh_climax_resolved) {
        flags.buck_met = true; if (st.story.quests.arc_heatran === undefined) st.story.quests.arc_heatran = 'discovered';
        say(['Well now. The trainer who mended the sky, walking Grim Mountain\u2019s doorstep like it\u2019s a garden path. Name\u2019s Birk. The mountain\u2019s mine in the way a fence is a farmer\u2019s — I keep it, it keeps me honest.', 'Listen, since you\u2019re here: something\u2019s rolled the mountain\u2019s Magma Stone clean out of its socket up in the Crater Hall. A volcano without its temper-stone is a kettle shopping for a lid. Come up with me and we\u2019ll set it back — two pairs of hands, one careful lift.']);
      }
      else say(['Name\u2019s Birk. Grim Mountain\u2019s the last honest weather in Borea — climb it like you mean it. And if you find a round stone down the crater that doesn\u2019t belong there... it belongs. That\u2019s the whole problem with stones.']);
      return true;
    }
    // Stage S6: the Route 209 traveller — the Odd Keystone's giver.
    if (kind === 'keystone_traveller') {
      if (flags.arc_spiritomb_done) say(['You set it in the tower? And the counting STOPPED? ...Then the road is just a road again. Walk it like one, trainer. Slowly, for the view.']);
      else if (flags.odd_keystone_received) say(['The tower, trainer. Weathered stones, west of the Forsaken Tower, where the grass gives up. Set the stone in and stand honest. Whatever counts itself out of it — it was counted for a reason.']);
      else {
        say(['Travelling light is a discipline, trainer, and I have been carrying a stone that disagrees with it. Cold thing. Heavy in a way that has nothing to do with my knees. Found it by a ruined tower up the road, years back, and it has been COUNTING at me ever since — quiet, patient, in numbers I don\u2019t care to reach.', 'You have the look of someone who finishes counts. Take it. Set it back in its tower, west of the Forsaken Tower, and whatever it\u2019s holding, hold it better than the road did.'], () => {
          flags.odd_keystone_received = true; st.bag.oddkeystone = (st.bag.oddkeystone || 0) + 1;
          if (st.story.quests.arc_spiritomb === undefined) st.story.quests.arc_spiritomb = 'discovered';
          g.audio.playSfx('item-get');
          g.ui.say([st.player.name + ' received the ODD KEYSTONE!'], null, npc.name);
        });
      }
      return true;
    }

    if (kind === 'dawn_twinleaf') {
      if (!flags.dawn_met) {
        say(['Oh — you are HIM. The ferry trainer. Mom said a champion was landing in Shingle and the whole street has been pretending not to look out of its windows since dawn. I am Dara. This is Clover — my town, my pond, my starting line.', 'Everyone assumes a road like yours is all gyms. Mine is contests: appeal rounds, stage lights, a crowd that grades your footwork while your partner performs. Inglenook\'s Super Contest Hall is my first real stage, {player}. When your road bends there — come and sit in my world. I will be the one not breathing until the music starts.'], () => { flags.dawn_met = true; });
        return true;
      }
      say(['Inglenook, {player}. First stage, full lights. I rehearse in the mirror and the mirror has started applauding early, which I choose to take as a good sign.']);
      return true;
    }

    if (kind === 'barry') {
      if (!flags.barry_met) {
        say(['WHAM— oh. Oh no. Did I hit you? I hit you. That is a fine! I am fining MYSELF ten million for the collision and you a hundred million for standing in a doorway shaped exactly like a Barry-corridor— wait. WAIT. You are the ferry champion!', 'Barry. Future greatest trainer in Borea, currently undefeated at running late. You are here for the badges, I am here for the badges, the badges are THEREFORE a race, and I am already winning it. Coalseam! Now! If I am not at Ronan\'s door in ten seconds I am fining myself again!'], () => { flags.barry_met = true; });
        return true;
      }
      say(['Still racing you, {player}! The fine for losing to me is everything you own plus interest! I accept badges as payment! ...What do you mean that is not how fines work—']);
      return true;
    }

    if (kind === 'mars') {
      if (flags.windworks_cleared) { say(['Gone, darling. Long gone. What stays is the count — and you cannot un-count a number.']); return true; }
      say(['The turbines answer to us today, darling. The keeper is indisposed, the keeper\'s key is indisposed — come through the door properly if you want to argue about it.']);
      return true;
    }
    if (kind === 'jupiter') {
      if (flags.galactic_eterna_done) { say(['The building is yours, child — stone and paper. What we needed left before you arrived.']); return true; }
      say(['Everything counted in these rooms belongs to a future you are not dressed for, child. The top floor is not a public floor.']);
      return true;
    }
    if (kind === 'saturn') {
      // S5b: the raid has happened (the entry event above) — Saturn
      // stays with his emptied house, and his flavour turns honest.
      if (flags.galactic_hq_done) { say(['The house is a shell with excellent lighting now, trainer. The count left before you arrived — it always was going to. I keep the door. It is the only duty the new world left me, and I find I do not entirely mind it.']); return true; }
      // PACING CALL (S5a register): before the raid, Saturn is
      // presence and a locked door: the anime spreads the HQ across
      // the arc. His flavour turns colder once Heritage has fallen.
      if (flags.saturn_met) { say(['Still here, trainer? Doors here open inward only — and the building has decided you are weather: noted, and kept outside.']); return true; }
      if (flags.galactic_eterna_done) {
        say(['Sorin. I keep this house for the Astral Combine — its doors, its ledgers, its patience. Heritage was a counting house, trainer; you have annoyed an abacus, nothing more.', 'Whatever you imagine is behind me, it will keep imagining back at you until the Commander-in-Chief calls it forward. Go and win your little badges. History is being scheduled elsewhere.'], () => { flags.saturn_met = true; });
        return true;
      }
      say(['Sorin. I keep this house — its doors, its ledgers, its patience. Tourists mistake it for a destination, trainer. It is a door, and doors here open inward only.', 'You have the look of a storm the building has been briefed about. Noted. Filed. Kept outside.'], () => { flags.saturn_met = true; });
      return true;
    }

    if (kind === 'paul_eterna') {
      if (flags.paul_veilstone_done) { say(['Still ahead of my projections, {player}. The lakes will re-audit us both. Be there.']); return true; }
      if (!flags.paul_eterna_seen) {
        say(['You took Tansy\'s measure. Adequate. The BOUQUADE folded later than my model said it would — I have adjusted the model, not the conclusion.', 'Understand something, {player}: I do not hate weak Kin. I hate WASTED ones — potential spent on trainers who will not do the arithmetic. Your arithmetic interests me. That is not a compliment. It is a warning that I am still counting.'], () => { flags.paul_eterna_seen = true; });
        return true;
      }
      say(['Still counting, {player}. Inglenook next — Odile\'s theatre. Try not to be decorative about it.']);
      return true;
    }

    if (kind === 'paul_hearthome') {
      if (flags.chimchar_beat_done) {
        say(flags.chimchar_taken
          ? ['It follows you now. Of course it does. Sentiment is a strategy I leave to trainers with margins to spare, {player}. Yours, apparently, are spare. We will see what the lakes say about both our methods.']
          : ['Still standing there, last I looked. Some trainer with more patience than ambition will ruin it with kindness. Not my entry to make anymore.']);
        return true;
      }
      if (!sBadges.includes('relicbadge')) {
        say(['A trainer of mine is about to stop being a trainer of mine, in this city. Watch, if your road has the time. Yours usually finds time for strays.', 'Odile first, {player}. Order matters. Even in discarding.']);
        return true;
      }
      // ---- the SIMMER beat ----
      say(['There. Look at it, since you are here. A SIMMER I have raised since the egg — fed it, drilled it, entered it. Three gyms of data, and the data is a wall: it does not win when winning is hard.', 'A trainer\'s resources are finite. So is a Kin\'s ceiling. I do not confuse the two, and I do not keep the ones the arithmetic has finished with. It stays here. Released. As of this sentence, it is no one\'s problem — which, in my experience, means it is about to become yours.'], () => {
        say(['The little fire-type watches Stellan walk away without a sound. Its flame is lit. Its stance, when it turns to you, is a question it has clearly been practicing: not can I win — but will anyone stay long enough to find out?'], () => {
          g.ui.showMenu('Take the SIMMER in?', [
            { label: 'Take it in', value: 'yes' },
            { label: 'Leave it to the road', value: 'no' },
          ], (v) => {
            if (v !== 'yes') {
              flags.chimchar_beat_done = true;
              flags.chimchar_left = true;
              say(['You leave it to the road, and the road — Inglenook is kind, as cities go — will find it a softer arithmetic than Stellan\'s. Its flame stays lit as you go. Some stories in this region are not yours to carry.'], null, '');
              return;
            }
            const res = st.party.length < 6
              ? this.cheatDeliverMon('chimchar', 320, 'party')
              : this.cheatDeliverMon('chimchar', 320, 'box');
            if (!res.ok) {
              g.ui.say(['There is no room anywhere — party full and every PC box full. Make room, and come back. The SIMMER waits; it has had practice at waiting.'], null, '');
              return;
            }
            flags.chimchar_beat_done = true;
            flags.chimchar_taken = true;
            g.audio.playSfx('dex-register');
            if (res.dest === 'box' && res.boxId) g.ui.toast('SIMMER was sent to ' + res.boxId.replace('box', 'Box ') + '!');
            else g.ui.toast('SIMMER joined the party!');
            say(['It does not hesitate. Whatever Stellan\'s ledger said, the SIMMER has done its own arithmetic about you — the whole of it, in one look — and chosen.', 'Train it however you train yours, {player}. If it wins for you where it could not win for him, then one of our ledgers is wrong. I find I am... content to let the lakes decide which.'], null, 'STELLAN');
          });
        }, '');
      });
      return true;
    }

    if (kind === 'reggie') {
      if (!flags.reggie_met) {
        say(['I am Reggie. I breed Kin here in Shardfall — feed them, raise them, teach them the shape of a good life. My little brother Stellan passed your name to me in a letter of exactly eleven words, which for Stellan is a memoir.', '"Trainer from the ferry. Underestimated by everyone counting. Watch him." That is the whole letter. He has never once written watch him about anybody, {player}. Whatever you did at that lab, it is still walking around in his head.'], () => { flags.reggie_met = true; });
        return true;
      }
      say(flags.chimchar_taken
        ? ['A SIMMER with a Stellan-shaped past and a {player}-shaped future. Feed it steady, train it honest, and let it win at its own pace. That is the whole method, and it has never once been the slow one that mattered.']
        : ['Stellan trains the way winter farms — nothing kept that cannot survive the season. I keep everything and feed it twice. Shardfall raised us both, trainer. The city declines to pick a favorite.']);
      return true;
    }

    if (kind === 'dawn_contest') {
      // Dawn's first Super Contest beat (the mayContest idiom: a
      // dialogue-only story state riding the shipped hall — the
      // player's own ranked Super Contest entries are S4's system,
      // entered at the counter, and are not gated by this beat).
      if (flags.dawn_hearthome_done) { say(['My ribbon is in the case and my heart has only just come down out of the lights, {player}. The road east has fog on it, they say. Good. I have decided fog is just stage mist that lost its hall.']); return true; }
      if (!sBadges.includes('relicbadge')) { say(['Not yet — Odile first, {player}. A coordinator keeps her order too: I am not stepping onto this stage until the gym across town has had its performance. Besides — SHE is one of the judges\' favorite stories. I intend to be another.']); return true; }
      say(['You came. Okay. OKAY. From the top, just like the mirror taught me...', '...The last appeal card turned MY way, {player}. The judges stood. The whole hall stood! My first Super Contest — a ribbon, earned in Inglenook, in front of a champion who once crossed four regions to sit in the third row.', 'Mom is going to hear about this from three towns away before I even call her. The road east is yours — Repose, the fog, Shardfall. Mine runs beside it a while longer. Walk it like a stage, {player}. That is what I intend to do.'], () => {
        flags.dawn_hearthome_done = true;
        flags.dawn_ribbon_hearthome = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Dara won her first Super Contest ribbon at Inglenook!');
      });
      return true;
    }

    if (kind === 'paul_veilstone') {
      if (flags.paul_veilstone_done) { say(['The ledger is closed until the lakes, {player}. Whatever is counting this region\'s water, it will want both our numbers. Bring yours current.']); return true; }
      if (!sBadges.includes('cobblebadge')) { say(['Not here. Not yet. Maren first, {player} — I do not audit a trainer my own city\'s gym has not finished examining. Win the Cobble Badge. Then come and be measured on ground that knows my name.']); return true; }
      const t0 = TRAINERS.paul_veilstone;
      say([t0.intro[0], t0.intro[1]], () => {
        g.ui.showMenu('Face Stellan — the Shardfall audit?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const t = bondTrainerVariant(g.state, t0);
          g.scenes.push(new BattleScene({
            kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g), friendly: true,
            onEnd: (won, fled) => {
              if (fled) return;
              recordBattleBond(g.state, t.id, won, fled);
              flags.paul_veilstone_done = true;
              if (won) flags.paul_veilstone_won = true; else flags.paul_veilstone_lost = true;
              say(won ? t0.lose : ['...The audit closes early, then — the numbers went my way this time, and I will not pretend otherwise to spare your feelings. I do not spare anyone\'s. That includes mine.', 'The lakes are next, for both of us. Whatever is coming for this region, it will not wait for either of us to be ready. Be ready anyway.'], null, 'STELLAN');
            },
          }));
        });
      }, 'STELLAN');
      return true;
    }

    if (kind === 'paul_acuity') {
      // THE MIDPOINT (the Brandon pattern): a full 6v6 REAL battle
      // fought friendly, completion predicate FACED — win or lose,
      // the story continues and no gate reads the result. The loss
      // path carries the anime's devastation in original writing.
      if (flags.paul_acuity_done) {
        say(flags.paul_acuity_won
          ? ['The page is written, {player}. The Conference gets the ink. Bring exactly this.']
          : ['The lake remembers, {player}. So do I. The Conference gets the ink — that has not changed. What HAS changed is the handwriting I intend to bring.']);
        return true;
      }
      if (!sBadges.includes('iciclebadge')) { say(['Not yet. Neve first, {player} — I do not spend my best page on a trainer the north has not finished examining. Win the Icicle Badge. Then come out onto my lake.']); return true; }
      const t0 = TRAINERS.paul_acuity;
      say([t0.intro[0], t0.intro[1]], () => {
        g.ui.showMenu('Face Stellan — the full battle at Lake Insight?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const t = bondTrainerVariant(g.state, t0);
          g.scenes.push(new BattleScene({
            kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g), friendly: true,
            onEnd: (won, fled) => {
              if (fled) return;
              recordBattleBond(g.state, t.id, won, fled);
              flags.paul_acuity_done = true;
              if (won) {
                flags.paul_acuity_won = true;
                say(t0.lose, null, 'STELLAN');
              } else {
                flags.paul_acuity_lost = true;
                say(['...Six. All six, {player}. I did not lose a battle on that lake — I performed an autopsy on one, mid-battle, with the whole of my team as the instrument.', 'This is what my arithmetic was FOR, and do you see what it bought? A full page of evidence that the way I have been counting is not the way winning is counted. SIMMER knew. It knew at Inglenook, standing in the road. I have been the last to know everything important in this region.', 'Again at the Conference — if the bracket is honest. I will not be carrying the same ledger. Neither, I suspect, will you.'], null, 'STELLAN');
              }
            },
          }));
        });
      }, 'STELLAN');
      return true;
    }

    if (kind === 'dawn_festival') {
      // Dawn's co-spine concludes: the Grand Festival at Lake Gallant
      // (the anime's placement), a dialogue beat riding the shipped
      // Super Contest ranks — her final is judged at the hall's own
      // highest rank; the player's own contest ladder stays open
      // and ungated by this beat (the S4/S5a law).
      if (flags.dawn_grand_festival_done) { say(['Runner-up of the Grand Festival, {player}. It still sounds like weather happening to somebody else. Zoey keeps the cup — and I keep the tape of that final, and I watch it like a map of a country I am going to live in. The Conference is yours now. Go and stand on your stage the way I stood on mine: all the way.']); return true; }
      if (!sBadges.includes('beaconbadge')) { say(['Not yet — your eighth badge first, {player}. A coordinator keeps her order too: the Festival stage is lit, my rivals are arriving by boat, and I am NOT stepping out there until the Brightshore lights have had their say about you. Besides — I want you in those seats with nothing left to prove but the sitting.']); return true; }
      say(['You came. All the way to Gallant, with the sky mended and eight badges in your case — you came to watch ME. Okay. OKAY. From the top, one last time...', '...The final card turned her way, {player}. Zoey — by a margin so small the judges checked it twice. Runner-up, at the Grand Festival, in my first full season. Mom cried on the phone in the GOOD direction. I did not win the cup. I won everything the cup was standing in front of.', 'My road forks here — home first, then a new region\'s stages, the way yours forked at a ferry dock a winter ago. Walk the Conference like a stage, {player}. I will be in the seats this time, and I do not breathe until the music starts. A promise, not a threat.'], () => {
        flags.dawn_grand_festival_done = true;
        flags.dawn_festival_ribbon = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Dara took runner-up honours at the Grand Festival!');
      });
      return true;
    }

    if (kind === 'sailor_eldric') {
      // The NOCTARCH beat (Bridgeport): a glimpse chain, staged here —
      // the plea (Mine Badge held) -> Brightmoon Island's entry event
      // (LUNACYGN's glimpse + the Lunar Wing) -> the boy wakes.
      // NOCTARCH itself is S6's arc: darkrai_unlocked is its flavour
      // flag, set on the waking, never a catch here.
      if (flags.darkrai_beat_done) { say(['Sleeping like a stone in a river, my boy — deep, ordinary, dreamless sleep, the kind with drool in it. A father could frame that drool. Whatever stood over his bed has gone wherever uninvited things go when a light is lit in the room. The wing did it, trainer. You did it.']); return true; }
      if (flags.lunar_wing_received) {
        say(['That — that feather. It is shining like the moon got caught in it. Hold it over a sleeping boy, the old sailors say, and the dark has to leave by the door it came in...', '...He is awake. HE IS AWAKE, and asking for breakfast like the last month was a story somebody told HIM. The dreams are gone — all of them, even the ordinary bad ones a boy is entitled to. Whatever waits on the dark island across the water, trainer, it has been noticed now. By her. By you. By a boy who sleeps. That is more notice than it is used to.'], () => {
          flags.darkrai_beat_done = true;
          flags.darkrai_unlocked = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('The sailor\'s son is awake — the nightmares are gone.');
        });
        return true;
      }
      if (flags.darkrai_beat_started) { say(['Brightmoon Island, trainer — the boatman runs there from this very pier, and her island is past it, where the moon stands full. Bring back her feather. Bring back my boy\'s mornings.']); return true; }
      if (!sBadges.includes('minebadge')) { say(['Mind the gulls, trainer. Everything in this port is watching something. Mine is a window up there with the curtain drawn, where my boy has been asleep a month — asleep, and dreaming of a dark shape that stands over the bed and will not be argued with. When you have the Mine Badge, come back to me. I will have a favour to ask that I do not ask lightly.']); return true; }
      say(['You have Doran\'s badge — then you are the trainer the harbour says you are, and I can ask it plain. My son, trainer. A month asleep in the house by the pier, and every night the same dream: a dark shape over the bed, patient as debt. The doctors use the word nightmares the way sailors use the word weather — for things they cannot steer.', 'The old cure is not a doctor\'s. On Brightmoon Island, where the moon stands full over a crescent pond, SHE keeps her court — LUNACYGN, whose feathers are made of the light that ends bad dreams. The boatman will take you. Bring me a Lunar Wing, and I will bring you a boy eating breakfast. That is the whole contract.'], () => { flags.darkrai_beat_started = true; });
      return true;
    }

    if (kind === 'sinnoh_conference') {
      // The registrar (the Maris registrar's idiom): registration
      // is gated on eight badges + the climax resolved — the
      // Conference does not open its bracket over an unmended sky.
      if (flags.sinnoh_complete) { say(['The bracket is archived, the confetti is swept, and your name is in the Lily of the Valley book in the good ink, trainer — twice: once for the bracket, and once in the margin next to a NOCTARCH, where the clerks keep the results they still argue about.']); return true; }
      if (sBadges.length < 8) { say(['Conference registration, trainer — and your case is not finished yet. Eight Borea badges open this bracket; you hold ' + sBadges.length + '. Brightshore is the usual last stop. I will keep your page open.']); return true; }
      if (!flags.sinnoh_climax_resolved) { say(['Eight badges — counted, verified, well carried. And yet I cannot open the bracket while the sky over Mt. Apex is still torn, trainer. Finish the region\'s gods first. The Conference will be here; it has waited through worse than a titan or two. Well. Comparable.']); return true; }
      if (!flags.sinnoh_conference_registered) {
        say(['Eight badges, a mended sky, and a name the whole region has been carrying since the mountain. Let me write you into the Lily of the Valley Conference properly... There. Registered.', 'The bracket: one preliminary, here in this hall — then the quarter-final, which the draw has made personal: Stellan, of Shardfall, who has been telling my clerks for a week that the bracket owes him this match. Then the semi-final. I will not describe the semi-final, trainer. Nobody in this hall describes him. Begin when you are ready: speak to me for the preliminary.'], () => {
          flags.sinnoh_conference_registered = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('Registered for the Lily of the Valley Conference!');
        });
        return true;
      }
      if (!flags.beat_conference_s_p1) {
        say(['The preliminary, trainer. Tamsin, of the sea roads — a clean battler with a cleaner record, and APEXSHARK in the back like a held chord. The floor is yours when you call it.'], () => {
          g.ui.showMenu('Begin the preliminary?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startSinnohBattle('conference_s_p1', null); });
        });
        return true;
      }
      if (!flags.paul_conference_done) { say(['The preliminary is behind you, and the quarter-final has a name on it that you know better than my clerks do. Stellan is on the floor, trainer. Settle it the way brackets settle things: completely.']); return true; }
      if (!flags.tobias_darkrai_felled) { say(['Stellan is settled — the clerks are still writing that one up. The semi-final is on the floor, trainer, and the hall has gone the particular quiet it goes for him. Cassian. And his first question.']); return true; }
      say(['The Conference is decided, and decided honestly. The book has it. So does everyone who was here.']);
      return true;
    }

    if (kind === 'paul_conference') {
      // The settlement: must-win-with-rechallenge (the shipped
      // league idiom — a loss is a defeat, the flag stays unset,
      // and Paul will be standing here when you come back). The
      // rivalry resolves with the player's win, as canon has it;
      // the engine never hard-locks.
      if (flags.sinnoh_complete) { say(['The book is closed, {player}, and the last page of the ledger is the one I would not change. Semi-finals and semi-legends — go home a while. Even ledgers rest.']); return true; }
      if (flags.paul_conference_done) { say(['Settled, {player}. In ink. Now go and find out what is standing past me — I have seen his NOCTARCH work from the tunnel, and my arithmetic has opinions it is keeping to itself for once.']); return true; }
      if (!flags.beat_conference_s_p1) { say(['The bracket does not bend, {player} — not even for us. Tamsin first. Then you may have the match this whole region has been a draft of.']); return true; }
      const t0 = TRAINERS.paul_conference;
      say([t0.intro[0], t0.intro[1]], () => {
        g.ui.showMenu('Face Stellan — the Conference quarter-final?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startSinnohBattle('paul_conference', (won) => {
            if (!won) return;
            flags.paul_conference_done = true;
            flags.paul_conference_won = true;
            say(t0.lose, null, 'STELLAN');
          });
        });
      }, 'STELLAN');
      return true;
    }

    if (kind === 'tobias') {
      // THE TOBIAS MECHANISM (the coordinator's S5b ruling, line
      // by line): Act 1 is a REAL battle on the league rechallenge
      // idiom (startSinnohBattle — not friendly, not faced): NOCTARCH
      // ALONE at 390, authored beatable in-band. A win sets
      // tobias_darkrai_felled; a full wipe before that is a defeat
      // and a rematch — nothing concludes, nothing is set. Act 2
      // (only with the felling standing) is AZURAVIS ALONE, fought
      // FRIENDLY on the FACED predicate (Harrison/Brandon): win or
      // lose, the match concludes — both branch texts real, the
      // canon loss carrying the honour — and only then does the
      // conference conclude: sinnoh_complete is set HERE and the
      // machine fires (checkArcCompletion — the registry's card,
      // regionsDone and directive are the machine's own writes).
      // No hand-rolled ending; S7 owns the finale variant.
      if (flags.sinnoh_complete) { say(['The book has it now, trainer: the NOCTARCH that fell, and the match that followed. Trainers will sail to this island for years to argue about that semi-final, and every one of them will get the first line right: you were the one who stood there. Travel well. The road past a Conference is the only undefeated thing left.']); return true; }
      if (!flags.paul_conference_done) { say(['Cassian. I have watched every match in this hall, including yours — your quarter-final is still ahead of you, and I do not stand in front of unfinished brackets. Settle Stellan first, trainer. Then come and ask me the question everyone else has failed.']); return true; }
      if (!flags.tobias_darkrai_felled) {
        const t0 = TRAINERS.tobias_darkrai;
        say([t0.intro[0], t0.intro[1]], () => {
          g.ui.showMenu('Face Cassian — NOCTARCH?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => {
            if (v !== 'yes') return;
            this.startSinnohBattle('tobias_darkrai', (won) => {
              if (!won) return;
              flags.tobias_darkrai_felled = true;
              say(['...Down. It is DOWN. Do you understand what this hall just saw, trainer? No one — no one — has done that in this entire Conference.', 'There is a second question on my team, and it has been patient all week. When you are ready — AZURAVIS. Finish the match. If the match can be finished.'], null, 'CASSIAN');
            });
          });
        }, 'CASSIAN');
        return true;
      }
      if (!flags.tobias_faced) {
        const t0 = TRAINERS.tobias_latios;
        say([t0.intro[0]], () => {
          g.ui.showMenu('Finish the match — face AZURAVIS?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => {
            if (v !== 'yes') return;
            const t = bondTrainerVariant(g.state, t0);
            g.scenes.push(new BattleScene({
              kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g), friendly: true,
              onEnd: (won, fled) => {
                if (fled) return;
                recordBattleBond(g.state, t.id, won, fled);
                flags.tobias_faced = true;
                if (won) flags.tobias_won = true; else flags.tobias_lost = true;
                const lines = won ? [
                  'Finished. Utterly, honestly finished — by the only trainer who ever got this far into my team, and went the rest of the way on merit. The hall is on its feet, trainer, and so — observe the record — am I.',
                  'They will write that the darkest trainer of the Conference fell in the semi-final. Let them. What the book cannot hold is the order of it: NOCTARCH first, by your hand, and then this. History will remember the attempt, they say. It will remember considerably more than that.',
                ] : [
                  '...And there the match ends — AZURAVIS, untouched by everything but the one exchange that mattered, and the judges\' card turning the way every card in this hall has turned all week. The semi-final is his. The loss stands. That is sport, and it is final.',
                  'But look at the hall, trainer. LOOK at it. They are not standing for the result — they are standing for the first line of the story, the one no other trainer in this Conference could write: NOCTARCH FELL. To you. The only victory anyone took from me here — and you took it in front of everyone. The Conference ends, and that is what it ends WITH. Honours, trainer. Full honours.',
                ];
                say(lines, () => {
                  flags.sinnoh_complete = true;
                  g.audio.playSfx('badge');
                  say(['Lily of the Valley Conference — the run ends in honours, and Borea ends with it: eight badges, a god unchained and answered, two rivals settled, and the only victory anyone took from the conference\'s darkest trainer. The road home is waiting, trainer. It always was.'], () => { checkArcCompletion(g); }, 'NARRATOR');
                }, 'CASSIAN');
              },
            }));
          });
        }, 'CASSIAN');
        return true;
      }
      say(['The match is in the book, trainer. Both questions, asked and answered.']);
      return true;
    }

    // ---- the leaders (S5a's four + S5b's four) ----
    const LEADERS = {
      roark: { badge: 'coalbadge', post: 'The road north runs through the mines\' shadow to Revelry, and west past Honeyfield the wind has stopped answering its keeper, they say. Mind the turbines, Coal Badge holder — and mind who else minds them.' },
      gardenia: { badge: 'forestbadge', post: 'The tower with the meteor on it, Forest Badge holder — its lobby is quieter than my forest and twice as watchful. Whatever the Astral Combine counts in there, count yourself in carefully.' },
      fantina: { badge: 'relicbadge', post: 'East now, Relic Badge holder: Repose\'s ruins keep an old remedy for the fog, and Shardfall keeps a gym that apologizes to no one. And the hall, darling — do come back to the hall. The stage remembers its friends.' },
      maylene: { badge: 'cobblebadge', post: 'Four badges. The lakes are next on every road out of my city, Cobble Badge holder — Gallant south, Insight far north, and Candor behind you, already watching. Whatever is counting that water, it has started. Keep your team close and your eyes open.' },
      wake: { badge: 'fenbadge', post: 'FIVE BADGES, and the main event rolls on! The lakes, Fen Badge holder — Gallant is an hour\'s walk and something has gone wrong on its water, I can smell it over the marsh. Whatever is counting this region\'s lakes, it has started spending. Go and be loud about it.' },
      byron: { badge: 'minebadge', post: 'Six badges. My son started you in Coalseam and I have measured you at the face — the family verdict is in, Mine Badge holder, and it is respect. The sailor by the pier has a favour he asks only of trainers he believes in, they say. And the north road is waiting: snow, and my counterpart Neve, who is tougher than her welcome. Everything up there is.' },
      candice: { badge: 'iciclebadge', post: 'Seven badges, Icicle Badge holder — full marks. The climb walls on Route 217 will take the old HM\'s measure now, and Brightshore\'s lights are the last stop before the island. And whatever turned beneath my lake\'s ice — it is still turning. The mountain, trainer. Everything in this region points at the mountain now.' },
      volkner: { badge: 'beaconbadge', post: 'Eight badges, Beacon Badge holder, and a leader awake for the first time in a season. The Conference at Lily of the Valley is lit, and the bracket has both your old scores in it — I checked, out of professional envy. Go and settle them at full voltage. I will be in the stands, conducting nothing at all. A holiday.' },
    };
    const L = LEADERS[kind];
    if (!L) return false;
    if (sBadges.includes(L.badge)) { say([L.post]); return true; }
    const orderRefusal = badgeOrderRefusal(L.badge);
    if (orderRefusal) { say(orderRefusal); return true; }
    const t0 = TRAINERS[kind];
    say([t0.intro[0]], () => {
      g.ui.showMenu('Challenge ' + t0.name + '?', [
        { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
      ], (v) => { if (v === 'yes') this.startSinnohBattle(kind, null); });
    });
    return true;
  },

  // The shared leader runner, Borea seat (startHoennBattle's idiom).
  startSinnohBattle(trainerId, onWin) {
    const g = this.game;
    const t0 = TRAINERS[trainerId];
    if (!t0) { if (onWin) onWin(false); return; }
    const t = bondTrainerVariant(g.state, t0);
    g.scenes.push(new BattleScene({
      kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
      onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (onWin) onWin(!!won && !fled); },
    }));
  },
  // --- H4b: runHoennNpc east actors + the climax/Institute/Pyre/
  // hideout/Seafloor scenes extend the dispatch above ---

  // REGION-1 FIX WAVE (Bug 3): the state wind-up shared by every
  // session end — session cleared, unspent Safari Balls returned to
  // the park. Returns the unspent-ball count for the caller's text.
  clearSafariSession() {
    const g = this.game;
    g.state.session.safari = null;
    const left = g.state.bag.safariball || 0;
    g.state.bag.safariball = 0;
    return left;
  },

  // REGION-1 FIX WAVE (Bug 3): end a hub-less safari session where
  // the player already stands (the Preserve door-warp landing) —
  // endSafari's words and wind-up, without its relocation warp.
  endSafariInPlace(msg) {
    const g = this.game;
    if (!g.state.session.safari) return;
    const left = this.clearSafariSession();
    g.ui.say(left > 0 ? [msg, '(The park keeps the ' + left + ' unused Safari Balls.)'] : [msg]);
  },

  endSafari(msg) {
    const g = this.game;
    // S4: the exit is the session's own data (the Marsh session exits
    // to Fenland's gatehouse door); a session without one exits to
    // Bramble exactly as the Arden original.
    const saf = g.state.session.safari;
    const exit = (saf && saf.exit) || null;
    g.state.session.safari = null;
    // AUDIT FIX (C241): unspent Safari Balls used to vanish silently —
    // the exit text now says what happened to them.
    const left = g.state.bag.safariball || 0;
    g.state.bag.safariball = 0;
    g.ui.say(left > 0 ? [msg, '(The park keeps the ' + left + ' unused Safari Balls.)'] : [msg], () => {
      const destMap = exit ? exit.map : 'fuchsia';
      const st = resolveStartPos(MAPS[destMap], exit ? { x: exit.x, y: exit.y } : null);
      this.loadMap(destMap);
      this.player.tx = st.x; this.player.ty = st.y;
      this.player.px = st.x * TILE; this.player.py = st.y * TILE;
      this.player.fx = st.x; this.player.fy = st.y;
      this.trail = [];
      g.state.story.position = { map: destMap, x: st.x, y: st.y, dir: 'down' };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.audio.playMusic(this.map.music || 'route1-theme');
    });
  },

  // ---------- Town Tales (ADR-025 §5) ----------
  // The stage machine + payouts are pure (data/quests.mjs); everything
  // below is presentation: dialogue, menus, and the tales' one battle
  // each at most. Battles are friendly spars / wild chases with no
  // stakes (the Tidehaven kid is the exception — a real trainer battle
  // with a talk-it-out alternative, per the spec's "talk OR battle").
  // Losing any tale battle leaves the stage untouched: talk again and
  // retry. No tale ever gates main progression.
  taleSay(lines, who, cb) {
    const g = this.game;
    g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), cb, who || '');
  },

  // A no-stakes tale battle: friendly + uncatchable wild spar.
  taleSpar(species, level, onWin, onLose) {
    const g = this.game;
    const foe = makeMon(species, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[species].dexNo);
    g.scenes.push(new BattleScene({
      kind: 'wild', foe, returnTo: this, friendly: true, uncatchable: true, rt: rtOf(g),
      onEnd: (won, fled) => { if (won && !fled) onWin(); else if (onLose) onLose(); },
    }));
  },

  runTaleNpc(npc) {
    const g = this.game;
    const st = g.state;
    const id = npc.tale;
    const stage = taleStageOf(st, id);
    const done = taleStatus(st, id) === 'complete';
    const say = (lines, cb) => this.taleSay(lines, npc.name, cb);
    const finishWith = (lines, opts) => say(lines, () => {
      const tale = QUESTS[id];
      const npcId = tale && tale.bondNpc;
      const before = npcId ? bondOf(st, npcId) : 0;
      // ADR-025 §6: a tale reward riding the central source grant may
      // convert to cash when the piece is already owned — the
      // conversion line follows the tale's own words.
      const moneyBefore = st.player.money;
      completeTale(st, id, opts);
      if (st.player.money === moneyBefore + DUPE_KEEPSAKE_CASH) {
        const ksId = (opts && opts.keepsake !== undefined) ? opts.keepsake
          : (tale && (tale.keepsakeReward || (tale.reward || {}).keepsake));
        const dl = ksId ? dupeKeepsakeLine(ksId) : null;
        if (dl) g.ui.say([dl]);
      }
      // ADR-025 §2: Phase 4's tale deltas now land in a LIVE tier model
      // (their amounts and semantics are unchanged) — the heart pip
      // rides the next dialogue after the change.
      if (npcId) { const d = Math.sign(bondOf(st, npcId) - before); if (d) g.ui.queueBondPip(d); }
    });

    // ---- Stage J4a: Yamato tales (data-driven lines) ----
    // The six west tales carry their dialogue in their defs
    // (story-johto.mjs JOHTO_TALES: offerLines / stageLines /
    // finishLines), so one generic branch serves them all through the
    // shipped stage machine: giver accepts -> stage actor advances ->
    // giver finishes (finishWith pays the def's reward + bond).
    {
      const jt = QUESTS[id];
      if (jt && (jt.johtoTale || jt.hoennTale || jt.sinnohTale)) {
        if (npc.role === 'giver') {
          if (stage < 0) { say(jt.offerLines, () => acceptTale(st, id)); return true; }
          if (stage === 0) { say(['The road remembers an errand, trainer: ' + jt.stages[0] + '.']); return true; }
          if (stage === 1) { finishWith(jt.finishLines); return true; }
          say(['Our town keeps its stories the way it keeps its paths, trainer — walked, and told, and walked again.']); return true;
        }
        if (npc.role === 'stage') {
          if (stage === 0) { say(jt.stageLines, () => advanceTale(st, id)); return true; }
          if (stage === 1) { say(['My part is told, trainer. The giver of that tale is waiting to hear the ending.']); return true; }
          return false;
        }
        return false;
      }
    }

    // ---- Dawnwick: Mom's Care Package ----
    if (id === 'tale_pallet') {
      if (npc.name === 'MOM') {
        if (stage < 0) { say(['Oh! Before you run off again — a favor, love.', 'I have a package for the Fernmere shopkeeper: maps, tea, and a letter too long for any DUNPLUME. Carry it north for me?', 'The Quest Log has it now. Reward? Three Potions and a mother\'s undying smugness.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The shopkeeper is in Fernmere City, love — south end of town, green apron, strong opinions.']); return true; }
        if (stage === 1) { finishWith(['A receipt! With her handwriting and everything.', 'You know, I drew the first street maps of this town as a girl — chalk on a barn door, because paper cost money.', 'She still sells copies in that shop. Half the trainers in Arden are navigating by my handwriting, and not one of them knows it.', 'Three Potions, as promised. Come home sometimes, {player}.']); return true; }
        // ADR-025 §2: Mom's send-offs warm up by tier; milestone talks
        // are one-shot bond sources (a mother's pride, authored beats).
        let pipDir = 0;
        if (st.badges.kanto.length >= 4) { const r = applyBondOnce(st, 'bondsrc_mom_badges', 'mom', 1); if (r && r.dir) pipDir = r.dir; }
        if (st.story.flags.champion) { const r = applyBondOnce(st, 'bondsrc_mom_champion', 'mom', 1); if (r && r.dir) pipDir = r.dir; }
        if (pipDir) g.ui.queueBondPip(pipDir);
        say(bondSceneLines(st, 'mom', 'sendoff') || ['My maps, her shop, your road. That is how a town stays stitched together, love.']); return true;
      }
      if (npc.name === 'SHOPKEEPER') {
        if (stage === 0) { say(['A package from Dawnwick? Let me see — maps, tea, and a letter the size of a phone book.', 'That is her handwriting on the maps, you know. Still the best-drawn charts on my shelf.', 'Here — a stamped receipt. Take it back to her, and tell her the tea shelf misses her.'], () => advanceTale(st, id)); return true; }
        if (stage === 1) { say(['Receipt is yours already, trainer. Dawnwick is straight south — mind the grass.']); return true; }
        return false;
      }
    }

    // ---- Fernmere: The Retired Ace ----
    if (id === 'tale_viridian') {
      if (stage < 0) { say(['You walk like a trainer. Good. An old man can use one.', 'Sixty years ago I lost a keepsake in the Fernmere Forest — a tortoise charm, carved by my late wife. The grass on Route 2 keeps it still, I think.', 'Find it, and choose honestly: bring it back to me, or keep it. Either way it ends with a trainer. That is all a charm wants.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Route 2, the deep grass. Face a likely patch and search it, the way we did before itemfinders.']); return true; }
      if (stage === 1) {
        say(['You have her look about you. Show me your hands, trainer.'], () => {
          g.ui.showMenu('The Tortoise Charm. What do you do?', [
            { label: 'Return it to Ace Marlow', value: 'return' },
            { label: 'Keep it', value: 'keep' },
          ], (v) => {
            if (v === 'return') {
              st.story.flags.tale_viridian_returned = true;
              finishWith(['...You found it. You actually— ha. HA! Look at that carving. Sixty years, and the grass kept it gentle.', 'No — do not argue. It goes with you. A charm that is found twice has chosen twice.', 'I was the first trainer ever to challenge the Fernmere Gym, before there was a League to write it down. My tortoise outlived three gyms and every rival I had.', 'Let it outlive a few of yours, too. That is a Warm feeling, trainer. Warm.'], { bondDelta: 2 });
            } else {
              finishWith(['Keeping it, then. Ha! Sixty years in the grass and it picks a bold one.', 'I was the first trainer ever to challenge the Fernmere Gym, you know. My tortoise outlived three gyms and every rival I had.', 'A charm chooses its trainer, in the end. It seems it has. Walk tall, keeper.'], { bondDelta: 0 });
            }
          });
        });
        return true;
      }
      say([st.story.flags.tale_viridian_returned ? 'The charm rides with you, and my thanks with it. Warm travels, trainer.' : 'Bold heart, soft hands. The charm chose well enough.']); return true;
    }

    // ---- Flintridge: Brock's Day Off ----
    if (id === 'tale_pewter') {
      if (npc.name === 'CURATOR') {
        if (stage < 0) { say(['Psst — trainer. Garran has not had a day off since the museum roof leaked, and that was two winters ago.', 'Cover my desk quiz for the visitors — three questions, all from the exhibits — then spar his PEBBLET so he can call it exercise and clock out.', 'The Iron Acorn is yours if you pull it off. It has been our paperweight for a decade; it deserves adventure.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { this.taleQuizPewter(npc); return true; }
        if (stage === 1) { say(['Quiz covered! Garran is in the square, pretending not to be off duty. His PEBBLET is already judging you.']); return true; }
        say(['The museum hums along, and Garran actually smiled at a fossil today. Miracles, catalogued.']); return true;
      }
      if (npc.name === 'GARRAN') {
        if (stage === 1) {
          say(['Day off. Allegedly. The Curator says you are my exercise plan.', 'One PEBBLET, no badges on the line, no crowd. Just rock and honest work.'], () => {
            g.ui.showMenu('Spar with Garran\'s PEBBLET (Lv 12)?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              this.taleSpar('geodude', 12, () => {
                finishWith(['Solid. You read a Rock type like a book you have already finished.', 'Here — the Iron Acorn. The museum\'s oldest paperweight, and harder than my whole team\'s heads.', 'Secret, trainer to trainer: this city\'s gym was built out of the museum\'s own stone. The museum came first. Leaders here have been part-time curators ever since — I pay the fossil lab out of gym winnings, and I would do it on my day off, too.']);
              }, () => say(['PEBBLET takes the round. He is smug about it in three languages of rock.', 'Shake it off — a day off has room for a rematch.']));
            });
          });
          return true;
        }
        return false; // Brock's own lines (off-duty color) otherwise
      }
    }

    // ---- Tidehaven: The Stolen Bike Bell ----
    if (id === 'tale_cerulean') {
      if (npc.name === 'TESS') {
        if (stage < 0) { say(['My bike bell is GONE. Brass, loud, and older than the gym — somebody lifted it right off my handlebars.', 'Three people saw something: Wren by the grass, Orin east, and the Fan near the gym. Ask them. Please.', 'The bell is Tidehaven history. And my TM11 is yours if it comes home — BubbleBeam, the real one.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          const n = [1, 2, 3].filter((w) => st.story.flags['tale_cerulean_w' + w]).length;
          say(['Witnesses heard from: ' + n + ' of 3. Wren, Orin, the Fan — Tidehaven is small; somebody saw that bell.']); return true;
        }
        if (stage === 1) { say(['The cape, north end of town. Whoever has my bell is done running.']); return true; }
        say(['It rings again! Half of Tidehaven heard it and pretended not to be emotional.']); return true;
      }
      if (npc.role === 'witness') {
        const flag = 'tale_cerulean_w' + npc.witness;
        if (stage === 0 && !st.story.flags[flag]) {
          const clues = {
            1: ['The bell? I heard it — ding ding, getting quieter northward. A kid, red cap, running like the bridge owed him money.'],
            2: ['Saw him clear as day: small, quick, hugging something brass to his chest. Headed for the cape, where the rich trainers sun themselves.'],
            3: ['He nearly ran me down! Kept looking back like the bell might ring on its own and give him away. The cape, trainer. End of the road.'],
          };
          say(clues[npc.witness] || clues[1], () => {
            st.story.flags[flag] = true;
            if ([1, 2, 3].every((w) => st.story.flags['tale_cerulean_w' + w])) {
              advanceTale(st, id);
              this.taleSay(['Three stories, one direction: the cape, at the north end of Tidehaven. The culprit is cornered — go and be kind, or be quick.'], 'TESS');
            }
          });
          return true;
        }
        return false; // their ordinary small talk otherwise
      }
      if (npc.name === 'PIP') {
        if (stage === 1) {
          say(['H-hey. Cape\'s taken. I am... meditating. Loudly. In brass.', '...Fine. It is me. I took the bell. But before you— just hear me out, or don\'t. Battle me for it, if you want it clean.'], () => {
            g.ui.showMenu('The bell, back to Tess. How?', [
              { label: 'Talk it out', value: 'talk' },
              { label: 'Battle for it', value: 'battle' },
            ], (v) => {
              const earn = () => finishWith(['...My little brother\'s bike has no bell. Cars do not hear him. I just wanted him LOUD, you know?', 'Take it. Take it back to Tess. Tell her — tell her the cape kid is sorry, and her bell is the loudest good thing in Tidehaven.', 'It rang first on the first bike ever ridden over Nugget Bridge, she told the whole street once. Gym was a bike shop then. I stole a piece of history to fix a Tuesday.', 'Marina will hear the whole story by supper. Everybody tells Marina everything. That is somehow worse than losing.']);
              if (v === 'talk') { earn(); return; }
              if (v === 'battle') {
                const t = TRAINERS.tale_kid;
                if (!t) { earn(); return; }
                g.ui.say(t.intro, () => {
                  g.scenes.push(new BattleScene({
                    kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
                    onEnd: (won) => { if (won) earn(); else say(['...You are just going to let me keep it? No. NO. That look is worse than losing. Come back when you can take it properly.']); },
                  }));
                }, npc.name);
              }
            });
          });
          return true;
        }
        if (done) { say(['Bell\'s home. Brother got a whistle. It is not the same, and he will not stop saying so.']); return true; }
        return false;
      }
    }

    // ---- Arcport: Fan Club Founder ----
    if (id === 'tale_vermilion') {
      if (npc.name === 'CHAIRMAN') {
        if (stage < 0) { say(['You have the look of a listener, and I am a man with a LOSS to describe at length.', 'Our founder\'s notebooks — fifty years of tides, teams, and terrible puns — were left at the S.S. Tern dock. The Anne has them, or the harbor does.', 'Bring them home and the Tide Pearl is yours. The founder kept it for "a trainer who fetches paper in a storm of small talk."'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say([st.story.flags.stanne_done ? 'The Anne has sailed — but nothing leaves this harbor unrecorded. Ask the Harbormaster, east end of the dock.' : 'The dock, trainer! South edge of town, where the gulls hold their own fan club.']); return true; }
        if (stage === 1) { finishWith(['THE NOTEBOOKS. Intact! Slightly gull-kissed, but intact!', 'Listen to this, from the first page: "Arcport had no harbor when I charted these tides. Three sailors and a dream. The Fan Club is just those sailors, arguing forever."', 'Even Lt. Brandt learned this bay from these pages. He respects the founder like weather — you do not argue, you dress for it.', 'The Tide Pearl, as promised. It has heard fifty years of harbor stories and tells none of them.']); return true; }
        say(['The notebooks rest in the clubhouse, and the club endures. My PYROGALOP, meanwhile — did I tell you about its coat?']); return true;
      }
      if (npc.name === 'HARBORMASTER') {
        if (stage === 0 && st.story.flags.stanne_done) { say(['Lost property? Aye — when the Tern cast off, a oilskin bundle came off her dock cart. Notebooks. Tide tables. Puns.', 'Harbor keeps what the sea gives back. Take them to the Chairman, and tell him the harbor charges one (1) thank-you.'], () => advanceTale(st, id)); return true; }
        return false;
      }
    }

    // ---- Hushmoor: Names on the Wall ----
    if (id === 'tale_lavender') {
      if (npc.name === 'VOLUNTEER') {
        if (stage < 0) { say(['Oh — a trainer with gentle hands, I hope. The tower\'s west stones are losing their names.', 'Take my ledger into Hushmoor Tower and record the unnamed graves before the carving goes smooth. Then find Elder Bram — he remembers what the stones cannot.', 'Mr. Fuji keeps a Spectre Bell for whoever tends the tower\'s forgotten. It should be carried by someone kind.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The west gravestones, in the tower. Read them aloud as you write — the tower likes to hear its names.']); return true; }
        if (stage === 1) { say(['The ledger is filling in beautifully. Elder Bram waits in the east of town — ask him about the FOSSILORD.']); return true; }
        say(['Every name on that wall is a door somebody can knock on again. Thank you.']); return true;
      }
      if (npc.name === 'ELDER BRAM') {
        if (stage === 1) {
          finishWith(['So. The ledger-keeper comes to hear about the FOSSILORD.', 'She was no legend, child. She was a mother, in a tower full of thieves, and she put herself between them and her baby with her whole heart. The little one got away. She did not.', 'The channelers say a mother\'s love does not leave a place just because her body did. If the tower is restless on your climb — well. You did not hear a strategy from me. There is none in this. Only a story.', 'Take the Spectre Bell. Mr. Fuji will want to know the names are written down — that man has carried this town\'s grief longer than I have carried mine.']);
          return true;
        }
        return false;
      }
    }

    // ---- Canopy: Roof Garden ----
    if (id === 'tale_celadon') {
      const badges = st.badges.kanto.length;
      if (stage < 0) { say(['You are looking at Canopy\'s best-kept height: the Game Corner roof garden, Verna\'s own.', 'It wants three waterings this season — and the garden keeps gym hours, in its way: the second visit wants a trainer with 4 badges, the third, 6. Plants respect a journey.', 'Finish the season and the Tansy Sash is yours. Verna sewed it herself, so water like you mean it.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Watering one — there you go. Slow circles, no splashing the marigolds; they hold grudges.', 'One bed drinks for the whole roof when a journey is young. Come back at 4 badges for the second round.'], () => advanceTale(st, id)); return true; }
      if (stage === 1) {
        if (badges >= 4) { say(['Four badges! The vines noticed before I did. Watering two — mind the hanging bed, it drinks like a SOMNIBEAR.', 'One more round, at 6 badges, and the season is yours.'], () => advanceTale(st, id)); return true; }
        say(['The garden is still sipping its first watering, trainer. Second round opens at 4 badges — you hold ' + badges + '. The plants are patient. Be like the plants.']); return true;
      }
      if (stage === 2) {
        if (badges < 6) { say(['Last watering waits for a 6-badge trainer — you hold ' + badges + '. The roof is not going anywhere, and neither is the view.']); return true; }
        say(['Six badges — the whole roof stands up straighter. Final watering, and then—', '—TINKLETOM! That is the third time this week, you little toll collector! Chase it off, trainer!'], () => {
          this.taleSpar('meowth', 18, () => {
            finishWith(['Gone! Over the parapet like it pays rent elsewhere. The garden is safe, the season is COMPLETE, and somewhere a TINKLETOM is telling this story very differently.', 'The Tansy Sash — Verna\'s own stitching. Wear it knowing this: this garden grows over Canopy\'s first gym, a wooden hall where the Game Corner now glitters.', 'Verna\'s grandmother planted the first bed so the city\'s green would always stand taller than its neon. You have kept it standing, trainer.']);
          }, () => say(['It slipped past you — all tail and opinions. The plants are unharmed; come back and chase it properly.']));
        });
        return true;
      }
      say(['The roof blooms on, season after season. Verna asks after you — gardeners notice who waters.']); return true;
    }

    // ---- Farsight: Two Gyms, One City ----
    if (id === 'tale_saffron') {
      if (npc.name === 'MASTER KO') {
        if (stage < 0) { say(['You stand in the Fighting Dojo, and we have a problem older than you.', 'Once a year this hall sends one message across the street, and once a year SHE sends one back. This year the messenger is... you. Take our word to Sybil.', 'No fighting required, unless pride gets involved. Pride always gets involved.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['Sybil, in her gym across the street. Deliver it standing straight — she respects posture and punctuality, in that order.']); return true; }
        if (stage === 1) { say(['You carry our word still. Deliver it; then choose your thanks with open eyes.']); return true; }
        if (stage === 2 && !st.story.flags.tale_saffron_iou) {
          say(['So the Dojo\'s thanks it is. One spar, my best student\'s partner, honest rules. XP is the prize and pride is the tax.'], () => {
            g.ui.showMenu('Spar at the Dojo?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              const lvl = Math.max(12, sparLevelFor(st));
              this.taleSpar('machop', lvl, () => {
                finishWith(['Enough! The hall remembers that one.', 'Tell Sybil her school\'s strength is still only half the story — and hear the rest from her, since a message deserves an answer.', 'One school, this was. Her father and I split it over what strength is FOR. You have carried messages between us longer in a day than we managed in twenty years.']);
              }, () => say(['The student takes it. The Dojo does not mock a loss — it schedules the rematch. Come again.']));
            });
          });
          return true;
        }
        if (stage === 2) { say(['Your thanks waits across the street, written in Sybil\'s hand. Collect it after her badge — her rules, and for once, I agree with them.']); return true; }
        say(['The hall is quieter this year. Messages do that.']); return true;
      }
      if (npc.name === 'SYBIL') {
        if (stage === 0) {
          say(['A message from across the street. I knew its words before you climbed my stairs — that is not why I let you carry it.', 'It says: "The hall stands." Every year, the same two words. Every year, I answer: "So does the Gym." That is the whole war, trainer. Two buildings, refusing to fall down first.'], () => {
            advanceTale(st, id);
            this.taleSay(['Now choose your thanks, messenger — in my hall, choices are also messages.'], 'SYBIL');
          });
          return true;
        }
        if (stage === 1) {
          say(['The rivalry is witnessed. Choose, messenger.'], () => {
            g.ui.showMenu('Your thanks?', [
              { label: 'The Dojo spar (XP)', value: 'spar' },
              { label: 'Sybil\'s keepsake IOU (after her badge)', value: 'iou' },
              { label: 'Not now', value: 'no' },
            ], (v) => {
              if (v === 'spar') { say(['The Dojo, then. Master Ko is already clearing the floor — I foresaw the sawdust.']); advanceTale(st, id); }
              else if (v === 'iou') {
                st.story.flags.tale_saffron_iou = true;
                say(['An IOU, then, in my own hand: one keepsake from my keeping, redeemed when you hold my Marsh Badge.', 'Win it honestly, messenger. I will be watching the battle three turns before it happens.']);
                advanceTale(st, id);
              }
            });
          });
          return true;
        }
        if (stage === 2 && st.story.flags.tale_saffron_iou) {
          if (!st.badges.kanto.includes('marshbadge')) return false; // the gym battle itself is the way through
          const pick = IOU_PRIORITY.find((k) => !ownsKeepsake(st, k));
          if (pick) {
            finishWith(['The badge suits you. And an IOU in my hand is a door opening.', 'Your keepsake, messenger — chosen by the only rule that matters: the one you did not already carry. Maia it arrive exactly when it is needed. It usually does, with me.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon. Thank you for not dropping it.'], { keepsake: pick });
          } else {
            finishWith(['Every keepsake in Arden already rides with you — there is nothing left in my keeping you lack. The IOU pays in candy, then: three XP Candies, and my genuine surprise.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon.'], { items: { xpcandy: 3 } });
          }
          return true;
        }
        return false; // Sabrina's gym flow (battle / post-badge lines) otherwise
      }
    }

    // ---- Bramble: The Warden's Teeth ----
    if (id === 'tale_fuchsia') {
      if (npc.name === 'PRESERVE WARDEN') {
        if (stage < 0) { say(['Mind the marsh on your way in, trainer — it took something of mine.', 'Not my teeth, before you grin. My FISHING LURE. Carved it the year I arrived; the entrance marsh swallowed it this morning, right inside the gate.', 'Fetch it home and there are ten Safari Balls in it for you. A lure that old deserves a story with a trainer in it.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          // The marsh is INSIDE the Bramble Preserve, and this same NPC is
          // the gate: decline so his safariGate flow opens the park
          // (his own dialogue line there points at the entrance marsh).
          return false;
        }
        if (stage === 1) {
          say(['That shine — that is IT. That is the lure!', 'Feel the weight of it. Carved the year the marsh fed all of Bramble, before fences, gates, or tickets. Marek\'s grandfather taught me to fish with this very piece of wood.'], () => {
            this.taleSay(['Uncle Warden! You found it — Father will want to hear the marsh gave it back. Thank you, trainer. From both of us.'], 'JESSA', () => {
              const beforeK = bondOf(st, 'koga');
              completeTale(st, id);
              const dK = Math.sign(bondOf(st, 'koga') - beforeK);
              if (dK) g.ui.queueBondPip(dK);
              this.taleSay(['Ten Safari Balls, as promised — and Jessa\'s thanks, which in this family is legal tender. Go on, then. The marsh is behaving today.'], 'PRESERVE WARDEN');
            });
          });
          return true;
        }
        // Complete: decline — the Warden is the Safari gate, and his
        // gate (and his own lost-teeth business) must own his talks
        // again. The lure hangs by his door either way.
        return false;
      }
      if (npc.name === 'JESSA') {
        if (done) { say(['Father heard the whole lure story by supper — Marek hears everything in Bramble eventually. Thank you again, trainer.']); return true; }
        return false;
      }
    }

    // ---- Caldera: Lab Notes ----
    if (id === 'tale_cinnabar') {
      if (stage < 0) { say(['Careful — ash still falls in the mansion library, twenty years on.', 'Our team\'s burned research notes are in there: two halves, west shelves and east shelves. The fire took the middle pages and left the edges legible. Typical.', 'Bring both halves back and the Ember Seed is yours — and Ignas will hear whose hands carried his science home.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) {
        const w = !!st.story.flags.tale_cinnabar_west, e = !!st.story.flags.tale_cinnabar_east;
        say(['Halves recovered: ' + (w ? 'west ' : '') + (e ? 'east ' : '') + (!w && !e ? 'none yet' : '') + '. The mansion library, both shelf-runs. Mind the journals — everybody reads them, nobody shelves them.']); return true;
      }
      if (stage === 1) {
        finishWith(['Both halves. Both! Let me lay them together... yes. Yes, the burn line matches. Twenty years, and the argument still reads clean.', 'This page, though. A jungle expedition, before the fire — they followed a mirage no instrument could record, and came home with one curled eyelash in a specimen jar.', 'Ignas was on that team. He has never once called it a failure. What slept in that jungle, the page refuses to say — and I have stopped asking paper to gossip.', 'The Ember Seed, earned. And Ignas will hear your name from me before the week turns.']);
        return true;
      }
      say(['The notes are re-shelved, the argument restored, the ash — mostly — forgiven.']); return true;
    }

    return false;
  },

  // ---------- Bonds: the Canopy parley (ADR-025 §2 + §3) ----------
  // Rue & Cole's Canopy appearance. Wary or below: the ambush stays an
  // ambush — a straight fight against the duo3 team. Warm+ (the pair's
  // LOWER tier): the scene opens with a parley choice — fight anyway,
  // or talk them down: no battle, reduced XP (an XP Candy instead of a
  // prize fight), +1 bond each, and the Second-Wind Ribbon — the
  // keepsake's FIRST source (§3), whose second source (the atelier
  // clerk's 7-badge stock) keeps its existence un-gated either way.
  // Both paths mark the scene resolved and reach the same Giovanni
  // payoff downstream; nothing here touches a battle's numbers (R3).
  runParleyNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    if (flags.parley_celadon_done || !flags.stanne_done) return false;
    const say = (lines, cb) => this.taleSay(lines, npc.name, cb);
    const resolve = () => { flags.parley_celadon_done = true; };
    const depart = () => this.runSteps([{ actorExit: { who: 'rue@celadon', path: [[8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [12, 8], [12, 7]] } }, { actorExit: { who: 'cole@celadon', path: [[9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [13, 8], [13, 7]] } }], 0, null);
    const fight = () => {
      const def = TRAINERS.duo3_celadon;
      if (!def) { resolve(); depart(); return; }
      // A clone carrying the pair's own names and lines for THIS scene;
      // team, levels and reward are the authored def's, untouched (R3).
      const t = { ...def, name: 'Rue & Cole',
        intro: ['RUE: Fine. FINE. The fun way it is — like always, like every single time!', 'COLE: For the record, I suggested literally any other city.'],
        lose: ['RUE: Beaten... in our own ambush... the indignity has layers...', 'COLE: Retreat! Again! We are getting uncomfortably good at this part!'] };
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
        onEnd: (won, fled) => {
          recordBattleBond(st, 'duo3_celadon', won, fled);
          if (won && !fled) {
            resolve();
            this.taleSay(['They flee toward the Game Corner, arguing about whose idea Canopy was.', 'Some things even a long road cannot fix. Their next ambush, wherever it is, will still be an ambush — but maybe a shorter one.'], '', () => depart());
          }
        },
      }));
    };
    if (tierAtLeast(st, 'rue', 'Warm') && tierAtLeast(st, 'cole', 'Warm')) {
      say(['...You. Of ALL the street corners in all of Arden—', 'Wait. Wait wait wait. Before the fun way starts — Cole. Cole, look at them. That is not a mark anymore. That is... the road. The whole road, walking next to us.', 'New plan. No plan. You and us, we are doing something else now: we are TALKING.'], () => {
        g.ui.showMenu('The duo is actually holding still. You —', [
          { label: 'Talk them down', value: 'talk' },
          { label: 'Fight them', value: 'fight' },
        ], (v) => {
          if (v === 'fight') { say(['HA! There it is! Some things never change — GOOD. I was getting emotional and I HATED it.'], () => fight()); return; }
          const r1 = applyBond(st, 'rue', 1);
          const r2 = applyBond(st, 'cole', 1);
          if ((r1 && r1.dir) || (r2 && r2.dir)) g.ui.queueBondPip(1);
          // ADR-025 §6: the parley ribbon rides the central source
          // grant — in a Second Journey (ribbon already carried) the
          // duplicate converts to cash, and the candies settle at the
          // talk-down's usual one.
          const ribbonRes = grantKeepsakeFromSource(st, 'secondwindribbon');
          const gotRibbon = ribbonRes.status === 'granted';
          const dupeRibbon = ribbonRes.status === 'duplicate';
          st.bag.xpcandy = (st.bag.xpcandy || 0) + ((gotRibbon || dupeRibbon) ? 1 : 2);
          resolve();
          this.taleSay([
            'You talk. About the ship. The tower. The standing-down on the island that has not even happened yet and somehow already counts.',
            'Nobody reaches for a Capture Orb. Cole laughs once, surprised at himself. Rue pretends she was never scared of you, badly.',
            gotRibbon
              ? 'On the way out, Rue presses something into your hand — a ribbon, road-worn and carefully mended. "Second-Wind," she says. "For the one who keeps getting up. Do NOT make it a thing." It is absolutely a thing.'
              : dupeRibbon
                ? 'On the way out, Rue presses something into your hand — then stops. "You already carry a Second-Wind," she says, flat. "One of a kind. Fine." She counts out $2,000 instead, like it personally offends her. "Do NOT make it a thing." It is absolutely a thing.'
                : 'On the way out, Rue presses two XP Candies into your hand. "For the road," she says. "Do NOT make it a thing." It is absolutely a thing.',
            'They walk off arguing about lunch. Not running. Walking. (Received an XP Candy for the road — less than a prize fight pays, and worth more.)',
          ], '', () => depart());
        });
      });
      return true;
    }
    say(['Hold it right there— oh. OH NO. It is the kid. IT IS THE KID, COLE.', 'No disguises this time, no soup course, no dignity: the Game Corner score is OURS and the VOLTIK is a bonus!', 'Rue. The kid is doing the stance. The BATTLE stance. I hate the stance.'], () => fight());
    return true;
  },

  // ---------- Bonds: gym leader talks (ADR-025 §2) ----------
  // Post-badge, post-tale leader talks. The first such talk carries the
  // leader's thanks (+1, one-shot); at Warm+ the leader also presents
  // their gift (2 XP Candies, one-shot) and the talk itself becomes the
  // tier-variant rematch BANTER (Warm+ = personal backstory, Cold =
  // guarded). Nothing here gates rematch availability or anything
  // else — there is no bond check on any battle, badge, or door (R3 +
  // the never-gates law); a leader whose tale is unfinished simply
  // keeps their ordinary post-badge lines.
  leaderBondTalk(npc) {
    const g = this.game;
    const st = g.state;
    const LEADER_TALE = { brock: 'tale_pewter', misty: 'tale_cerulean', surge: 'tale_vermilion', erika: 'tale_celadon', koga: 'tale_fuchsia', sabrina: 'tale_saffron', blaine: 'tale_cinnabar' };
    const THANKS = {
      brock: 'The Curator still brags about the day you covered the desk. The museum remembers, trainer. So does the gym.',
      misty: 'The whole street heard that bell come home. Tidehaven does not forget a sound like that — or who carried it back.',
      surge: 'The Chairman framed your tide-table delivery receipt. FRAMED it. In the clubhouse. You are harbor legend now, soldier.',
      erika: 'The roof garden is in full season, thanks to your three waterings. Verna — I — wanted that said out loud.',
      koga: 'Jessa has told the lure story at three family dinners. You are, whether you planned it or not, part of this family\'s archive.',
      sabrina: 'Two buildings stood apart for twenty years, and a messenger crossed between them in an afternoon. The city noticed.',
      blaine: 'The lab re-shelved the notes under a new label: "Recovered." Your name is on the shelf card, in the tech\'s best handwriting.',
    };
    const taleId = LEADER_TALE[npc.trainer];
    if (!taleId) return false;
    if (!st.story.flags['beat_' + npc.trainer]) return false;
    if (taleStatus(st, taleId) !== 'complete') return false;
    const id = npc.trainer;
    const lines = [];
    const thanks = applyBondOnce(st, 'bondsrc_leader_' + id, id, 1);
    if (thanks) {
      if (thanks.dir) g.ui.queueBondPip(thanks.dir);
      lines.push(THANKS[id]);
    }
    if (tierAtLeast(st, id, 'Warm') && !st.story.flags['bondgift_' + id]) {
      st.story.flags['bondgift_' + id] = true;
      st.bag.xpcandy = (st.bag.xpcandy || 0) + 2;
      lines.push('And a gift, trainer to trainer — two XP Candies, from my own stores. No receipt. No IOU. You have earned quieter thanks than a speech.');
    }
    const banter = bondSceneLines(st, id, 'banter');
    if (banter) lines.push(...banter);
    if (!lines.length) return false;
    g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), null, npc.name);
    return true;
  },

  // The Flintridge museum desk quiz: 3 questions, all from the exhibit
  // lines read aloud first. A wrong answer corrects and re-asks the
  // same question — the desk is never failed, only finished.
  taleQuizPewter(npc) {
    const g = this.game;
    const st = g.state;
    const QS = [
      { q: 'Exhibit one: "Old Amber holds something ancient inside." What does amber hold?', opts: ['Ancient DNA', 'A tiny lighthouse', 'Fossilized soup'], a: 0, fix: 'The card says it plainly: amber holds ancient DNA. Again —' },
      { q: 'Exhibit two: "Two fossils sleep in Mt. Lunestone." Which one is the SPIRAL shell?', opts: ['Dome Fossil', 'Helix Fossil', 'Old Amber'], a: 1, fix: 'Helix — think of a snail shell, a spiral staircase. Again —' },
      { q: 'Exhibit three: "Flintridge stone remembers." The museum was built from what?', opts: ['Imported marble', 'The mountain itself', 'Recycled badges'], a: 1, fix: 'The mountain itself — this whole city is one polite quarry. Again —' },
    ];
    const ask = (i) => {
      if (i >= QS.length) {
        this.taleSay(['Three for three! The desk is covered, the visitors are dazzled, and Garran owes us both a day off.', 'He is in the square with his PEBBLET. Go and collect your spar.'], npc.name, () => advanceTale(st, 'tale_pewter'));
        return;
      }
      const item = QS[i];
      g.ui.showMenu(item.q, item.opts.map((o, oi) => ({ label: o, value: oi })), (v) => {
        if (v === item.a) { g.audio.playSfx('dex-register'); ask(i + 1); }
        else this.taleSay([item.fix], npc.name, () => ask(i));
      });
    };
    this.taleSay(['The desk, then! The exhibit cards, read slow — every answer is on them, as a fair quiz should be.', 'Card one: amber, and the ancient DNA inside it. Card two: the spiral Helix and the domed Dome. Card three: a museum built from the mountain itself. Ready?'], npc.name, () => ask(0));
  },

  // Faced-tile tale searches (sysInteract hook). Returns true only
  // when the spot did tale business; false lets signs/fishing speak.
  // Stage J5: the Ilex shrine. With the returned GS Orb in the bag
  // and CHRONOFAE uncaught, facing the shrine runs the opening scene
  // (the catch-only event — a flee or KO leaves the shrine ready to
  // try again). Otherwise it is a shrine: flavour, and after the
  // catch, a memento line. Always handled (the prop is a set piece).
  johtoShrineInteract() {
    const g = this.game;
    const f = g.state.story.flags;
    if (f.arc_celebi_done) {
      g.ui.say(['The shrine is quiet, and the forest is its own age again — all of its ages, really, but polite about it. The empty Sealed Orb in your bag weighs nothing at all, which for a souvenir is exactly right.']);
      return true;
    }
    if (f.gsball_back_with_player && (g.state.bag.gsball || 0) > 0) {
      this.runEvent('ev_johto_celebi');
      return true;
    }
    if (f.beasts_awakened) {
      g.ui.say(['A small shrine, moss-bearded and patient. Travellers leave flowers here for whatever keeps the deep forest. Something about the place makes your bag feel one object too light — as if something that belongs to the forest is sleeping somewhere else, in a craftsman\'s study, say.']);
    } else {
      g.ui.say(['A small shrine, moss-bearded and patient. Travellers leave flowers here for whatever keeps the deep forest. The carving is too weathered to read, which the forest clearly considers none of your business yet.']);
    }
    return true;
  },

  // Stage H6: the XENOGENE formes — the meteorite switch (coordinator
  // ruling 2, the REAL mechanic). The four entries share dexNo 386
  // and one in-table Psychic learnset pool (H1's design), so the
  // swap is a speciesId exchange in the evolution idiom: level, XP,
  // nickname, held item, keepsake, IVs/EVs, status and the move set
  // are the individual's own and are NOT touched; maxHp/stats are
  // recomputed from the new forme's base stats exactly as
  // evolveMon does, with HP carried by the max-delta rule. Moves
  // stay legal in every forme because all four learnsets draw from
  // the same pool. A switched XENOGENE round-trips save validation in
  // every forme (asserted in tests/hoenn-legendary-checks.mjs).
  DEOXYS_FORMES: ['deoxys', 'deoxysattack', 'deoxysdefense', 'deoxysspeed'],
  deoxysInParty() {
    return this.game.state.party.find((m) => m && this.DEOXYS_FORMES.includes(m.speciesId)) || null;
  },
  switchDeoxysForme(mon, formeId) {
    const g = this.game;
    if (!mon || !this.DEOXYS_FORMES.includes(mon.speciesId) || !this.DEOXYS_FORMES.includes(formeId)) return false;
    if (mon.speciesId === formeId) return false;
    const to = SPECIES[formeId];
    const ivs = mon.ivs || {};
    const oldMax = mon.maxHp;
    mon.speciesId = formeId;
    mon.maxHp = hpValue(to.base.hp, mon.level, ivs.hp);
    if (mon.hp > 0) mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
    mon.stats = {
      atk: statValue(to.base.atk, mon.level, ivs.atk), def: statValue(to.base.def, mon.level, ivs.def),
      spa: statValue(to.base.spa, mon.level, ivs.spa), spd: statValue(to.base.spd, mon.level, ivs.spd),
      spe: statValue(to.base.spe, mon.level, ivs.spe),
    };
    g.state.story.flags.deoxys_forme_touched = true;
    return true;
  },

  // Stage H6: Comet Falls' meteorstones. Three stones carry H3a's
  // meteorstone dressing; two are H6's set pieces:
  //  - (21,4), the crater meteorite in the north chamber: XENOGENE'
  //    door (the rumour arms it) and, after the catch, the forme
  //    switch — interact with a XENOGENE in the party and pick the
  //    shape; the stone remembers every shape it has ever been.
  //  - (13,11), the lower-falls stone: ASTRAEON's wish stone, live
  //    only once the star has fallen (the witness event).
  //  - (12,5) answers with plain flavour.
  hoennMeteorInteract(fx, fy) {
    const g = this.game;
    const f = g.state.story.flags;
    if (fx === 21 && fy === 4) {
      if (!f.arc_deoxys_done) {
        if (f.arc_deoxys_rumor) { this.runEvent('ev_hoenn_deoxys'); return true; }
        g.ui.say(['A meteorite the size of a cart, glassy and dark — and warm, which stops you mid-thought. Fallen stone should be cold. This one is warm the way a held hand is warm. The researchers at the Starfall Space Center would have opinions about this. Loud ones.']);
        return true;
      }
      const mon = this.deoxysInParty();
      if (!mon) {
        g.ui.say(['The crater meteorite has gone quiet and cold — ordinary fallen stone, its tenant gone. Whatever it remembers, it remembers alone now. (Bring the one who came from the sky, and it may remember out loud.)']);
        return true;
      }
      const name = displayName(mon, SPECIES);
      const labels = {
        deoxys: 'Balanced forme — the shape it fell in',
        deoxysattack: 'Attack forme — all striking whips',
        deoxysdefense: 'Defense forme — broad and braced',
        deoxysspeed: 'Speed forme — a needle that outruns radar',
      };
      g.ui.say(['The crater meteorite wakes at ' + name + '\'s nearness — light moving under its surface like something turning over in its sleep. It remembers every shape its tenant has ever been. Shapes, it turns out, are just memories with edges.'], () => {
        g.ui.showMenu('Let the meteorite remind ' + name + ' of a shape:', this.DEOXYS_FORMES.map((id) => ({
          label: SPECIES[id].name.replace('XENOGENE', 'XENOGENE') + ' — ' + labels[id].split(' — ')[1],
          value: id,
          disabled: mon.speciesId === id,
        })).concat([{ label: 'Not now', value: 'no' }]), (v) => {
          if (!v || v === 'no' || v === mon.speciesId) return;
          if (this.switchDeoxysForme(mon, v)) {
            g.audio.playSfx('levelup');
            g.ui.say(['The light under the stone\'s surface reaches out — not hands, not quite — and ' + name + ' comes apart gently, the way a knot comes undone, and re-knots itself into a new geometry. Same partner. Same memories. New edges.', name + ' is now in its ' + SPECIES[v].name.replace('XENOGENE (', '').replace(')', '') + ' shape.']);
          }
        });
      });
      return true;
    }
    if (fx === 13 && fy === 11) {
      if (f.arc_jirachi_done) {
        g.ui.say(['The meteorstone by the lower falls is cool and ordinary, and the spray on it is lit only by the falls themselves. Whatever woke here has gone back to its long sleep — in your party, this time.']);
        return true;
      }
      if (f.jirachi_star_fell) { this.runEvent('ev_hoenn_jirachi'); return true; }
      if (f.arc_jirachi_news) {
        g.ui.say(['A fallen stone, old and glassy, keeping the lower falls\' spray. The Space Center says a star is coming down somewhere in this cave — but not yet, and not here. The stone is only a stone, for now.']);
        return true;
      }
      g.ui.say(['A fallen stone, old and glassy, keeping the lower falls\' spray. Star-stone, the locals call it. Most of it is only ever a stone.']);
      return true;
    }
    g.ui.say(['A fallen stone, cold as the cave around it. Whatever fell here finished falling a very long time ago.']);
    return true;
  },

  // Stage H6: the Regi tombs. Each tomb is self-contained (there is
  // no Sealed Chamber map in the shipped Maris — no cross-tomb
  // chain): its inscription, read from the stone by the door (the
  // sign tile at (9,11)), is the only key, and its solution is a
  // concrete action performed in the chamber:
  //  - Dune Tomb (PETRAGOLEM): THE STANDING BEAT. Read, then stand
  //    before the sealstone (face the sealstone row) and choose to
  //    wait — the shipped choice idiom carries the beat; the desert
  //    counts six slow breaths and the sealstones part.
  //  - Sea Tomb (CRYOGOLEM): THE GREETING ORDER. Read, then greet
  //    the chamber's two boulders (caveboulder tiles) in the
  //    inscription's order — west (2,12) first, east (14,11)
  //    second. The wrong order is politely forgotten by the cold.
  //  - Iron Tomb (SIDEROGOLEM): IRON ANSWERS IRON. Read, then
  //    press the sealstone with a living Steel-type partner in the
  //    party (partyHasType — the shipped field check).
  // Solving parts the sealstone row (its flag stands; the sysOnStep
  // seal guard reads it) and the Regi's face fires at once; after a
  // flee/KO the face re-fires from the seal or the chamber step.
  hoennTombInteract(fx, fy) {
    const g = this.game;
    const f = g.state.story.flags;
    const kind = TILE_CHARS[this.tileAt(fx, fy)];
    const TOMBS = {
      'desert-ruins': {
        arc: 'arc_regirock', read: 'regi_rock_read', open: 'regi_rock_open', done: 'arc_regirock_done', ev: 'ev_hoenn_regirock',
        inscription: [
          'The stone by the door is covered in raised dots — a writing you read with your fingertips. It translates, slowly, the way old things do:',
          '"THE STONE REMEMBERS WHO WAITS. STAND BEFORE THE SEAL WITH A QUIET HEART, AND LET THE DESERT COUNT SIX SLOW BREATHS. THE IMPATIENT KNOCK FOREVER. THE PATIENT ARE LET IN."',
          'Below the words, smaller dots add: "(Face the sealstones, trainer, and be still. That is the whole key. It always was.)"',
        ],
      },
      'island-cave': {
        arc: 'arc_regice', read: 'regi_ice_read', open: 'regi_ice_open', done: 'arc_regice_done', ev: 'ev_hoenn_regice',
        inscription: [
          'The stone by the door is covered in raised dots, rimed with frost that does not melt under your fingertips. It translates, slowly, the way cold things do:',
          '"THE COLD KEEPS WHAT IT IS GIVEN, IN ORDER. GREET THE WEST STONE FIRST, WHERE THE DOOR\'S WIND FALLS. GREET THE EAST STONE SECOND, WHERE THE LONG ROOM ENDS. REVERSE THE GREETING, AND THE COLD FORGETS YOU."',
          'Two boulders stand in the outer room, west and east. They have the look of stones that have been greeted correctly perhaps once.',
        ],
      },
      'ancient-tomb': {
        arc: 'arc_registeel', read: 'regi_steel_read', open: 'regi_steel_open', done: 'arc_registeel_done', ev: 'ev_hoenn_registeel',
        inscription: [
          'The stone by the door is covered in raised dots, worn smooth as river pebbles. It translates, slowly, the way patient things do:',
          '"IRON OPENS TO IRON. LET A PARTNER OF LIVING STEEL STAND WITH YOU, AND PRESS YOUR HAND TO THE SEAL. THE TOMB KNOWS ITS OWN METAL, AND NO OTHER KEY WAS EVER CUT."',
          'The sealstones across the chamber gleam dully — the colour of old iron, and of one particular kind of partner.',
        ],
      },
    };
    const tomb = TOMBS[this.mapId];
    if (!tomb) return false;
    // The inscription stone (the tomb's sign tile).
    if (fx === 9 && fy === 11) {
      if (!f[tomb.read]) {
        g.ui.say(tomb.inscription, () => {
          f[tomb.read] = true;
          if (!f[tomb.done]) g.state.story.quests[tomb.arc] = 'discovered';
        });
      } else {
        g.ui.say(tomb.inscription);
      }
      return true;
    }
    // CRYOGOLEM's greeting stones.
    if (this.mapId === 'island-cave' && kind === 'caveboulder' && ((fx === 2 && fy === 12) || (fx === 14 && fy === 11))) {
      if (f.regi_ice_open || f.arc_regice_done) {
        g.ui.say(['The boulder is cold and faintly pleased with itself, in the manner of furniture that has been thanked.']);
        return true;
      }
      if (!f.regi_ice_read) {
        g.ui.say(['A boulder, old as the cave. It feels, somehow, like it is waiting to be greeted — but in what order, and as what, the stone by the door would know.']);
        return true;
      }
      if (fx === 2 && fy === 12) {
        if (!f.regi_ice_west) {
          f.regi_ice_west = true;
          g.ui.say(['You greet the west stone, where the door\'s wind falls. Somewhere across the chamber, ice ticks — a small, approving sound, like a clock agreeing with itself. One more. The east stone, where the long room ends.']);
        } else {
          g.ui.say(['The west stone has been greeted. The east stone, where the long room ends, is still waiting its turn.']);
        }
        return true;
      }
      // The east stone.
      if (!f.regi_ice_west) {
        g.ui.say(['You greet the east stone first — and the cold, politely and completely, forgets you. The inscription was specific: west first, where the door\'s wind falls. The chamber resets its patience. So can you.']);
        return true;
      }
      f.regi_ice_open = true;
      g.audio.playSfx('map-enter');
      g.ui.say(['You greet the east stone, second, in the inscription\'s order — and from the north wall comes a sound like a lake turning over in its sleep. The sealstones are GRINDING apart, frost falling from them in sheets.', 'The cold keeps what it is given, in order. You gave it courtesy, in order. It is keeping its side of the bargain.'], () => {
        if (!f.arc_regice_done) this.runEvent(tomb.ev);
      });
      return true;
    }
    // The sealstone row itself (the door at its gap, x=8, reads as
    // floor — the row's stones are the interactable face).
    if (kind === 'sealstone' || (fy === 5 && fx >= 1 && fx <= 16)) {
      if (f[tomb.done]) {
        g.ui.say(['The sealstones stand parted and quiet. The chamber beyond has given up its tenant; what remains is old stone, older silence, and the feeling of a question answered so thoroughly it will never need asking again.']);
        return true;
      }
      if (f[tomb.open]) { this.runEvent(tomb.ev); return true; }
      if (!f[tomb.read]) {
        g.ui.say(['A row of sealstones, each covered in raised dots you cannot read. The stone by the door — south, by the entrance — is covered in them too, and stones by doors are usually the ones doing the explaining.']);
        return true;
      }
      if (this.mapId === 'desert-ruins') {
        g.ui.showMenu('The sealstones wait. The inscription asked for stillness, not force.', [
          { label: 'Stand before the seal and wait, unmoving', value: 'wait' },
          { label: 'Step back', value: 'no' },
        ], (v) => {
          if (v !== 'wait') return;
          f.regi_rock_open = true;
          g.audio.playSfx('map-enter');
          g.ui.say(['You stand before the seal and do the hardest thing the road has ever asked of you: nothing. Breath one. The sand in the seams of the floor stops drifting. Breath two. Somewhere above, the desert goes on being a desert, without you. Breath three. Your partners, unasked, go quiet with you. Breath four. The chamber\'s held century settles around your shoulders like a hand deciding not to strike. Breath five. A single grain of sand falls off the middle sealstone, and it is the loudest sound in Maris. Breath six—', 'The sealstones PART — not broken, not forced: released, the way a held breath is released, grinding aside with the deep patience of stone that was only ever waiting to be waited at.', 'The impatient knock forever. You did not knock. Go and meet what the desert has been keeping.'], () => {
            if (!f.arc_regirock_done) this.runEvent(tomb.ev);
          });
        });
        return true;
      }
      if (this.mapId === 'ancient-tomb') {
        if (this.partyHasType('steel')) {
          f.regi_steel_open = true;
          g.audio.playSfx('map-enter');
          g.ui.say(['You press your palm to the middle sealstone, and beside you, your Steel-type partner leans its weight against the stone as if it had been waiting all its life to be a key. For a moment nothing happens. Then the sealstone warms — no. The sealstone RECOGNIZES. Iron has answered iron, and the whole row shudders, and grinds, and parts.', 'The tomb knows its own metal. It has decided you are carrying some of it honestly. Beyond the stones, something ancient is unfolding.'], () => {
            if (!f.arc_registeel_done) this.runEvent(tomb.ev);
          });
        } else {
          g.ui.say(['You press your palm to the sealstone. It is cold, and faintly, courteously unimpressed. "IRON OPENS TO IRON," said the stone by the door. No Steel-type partner stands with you — and the tomb, which has waited this long, is content to wait for you to come back with the right company.']);
        }
        return true;
      }
      // island-cave's seal, before its greeting is complete.
      g.ui.say(['The sealstones are rimed shut and entirely unbothered. "THE COLD KEEPS WHAT IT IS GIVEN, IN ORDER," said the stone by the door. Two boulders in this room are still waiting to be greeted — in the right order.']);
      return true;
    }
    return false;
  },

  // Stage J5: descend into the Hideout — the Redwood shop's
  // stairs (Lance leads the way, or the shopkeeper lets you down).
  // Landing on the map fires the re-homed descent event through the
  // sysLoadMap gate when its conditions hold; after the clear, the
  // same stairs simply visit the quiet base.
  enterJohtoHideout() {
    const g = this.game;
    this.loadMap('rocket-hideout');
    const m = this.map;
    const sx = m.start ? m.start.x : 12, sy = m.start ? m.start.y : 14;
    this.player.tx = sx; this.player.ty = sy;
    this.player.px = sx * TILE; this.player.py = sy * TILE;
    this.player.fx = sx; this.player.fy = sy; this.player.dir = 'up';
    this.trail = [];
    g.state.story.position = { map: 'rocket-hideout', x: sx, y: sy, dir: 'up' };
  },

  taleSpotInteract(spot) {
    const g = this.game;
    const st = g.state;
    const id = spot.tale;
    const stage = taleStageOf(st, id);
    if (stage !== 0) return false;
    const say = (lines, cb) => this.taleSay(lines, '', cb);
    if (spot.kind === 'keepsake') { // Fernmere Forest, Route 2 grass
      say(['Something glints under the grass — a carved wooden tortoise, worn smooth as river stone.', 'THE TORTOISE CHARM. Sixty years of weather, and the carving still smiles.', 'Take it back to Ace Marlow in Fernmere — or keep it. The choice is the tale.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notes') { // Arcport dock, pre-departure
      if (st.story.flags.stanne_done) { say(['The dock is bare — the Tern has sailed, and whatever she left behind went through the harbor office. The Harbormaster keeps lost property.']); return true; }
      say(['Under a dock crate, oilskin-wrapped against the spray: notebooks! Tide tables, team notes, and puns of a truly maritime vintage.', 'THE FOUNDER\'S NOTES. The Chairman in Arcport will want these yesterday.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'graves') { // Hushmoor Tower, west stones
      say(['You read the west stones aloud, one by one, and write what the carving still holds.', 'Three have no names at all — only dates, and the careful marks of whoever visits. The ledger takes them as "beloved, unnamed," which is better than forgotten.', 'Elder Bram, in Hushmoor Town, remembers the rest. Go gently.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'lure') { // Bramble Preserve entrance marsh
      say(['The marsh reeds lean over something shining — you wade two steps and close your hand on carved, water-dark wood.', 'THE WARDEN\'S LURE. Older than the fence around it, and heavier than it looks: a lot of mornings live in this wood.', 'Return it to the Preserve Warden in Bramble City.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notesWest' || spot.kind === 'notesEast') { // Mansion library
      const flag = spot.kind === 'notesWest' ? 'tale_cinnabar_west' : 'tale_cinnabar_east';
      if (st.story.flags[flag]) { say(['Kian and empty shelf. This half is already recovered.']); return true; }
      st.story.flags[flag] = true;
      const both = st.story.flags.tale_cinnabar_west && st.story.flags.tale_cinnabar_east;
      say([spot.kind === 'notesWest'
        ? 'Behind the west shelves: a tin box the fire only kissed. Inside — half of the lab\'s burned notes, edges crisped, argument intact.'
        : 'Under the east shelves, where the journals fell like leaves: the other half of the burned notes, smelling of smoke and stubbornness.',
      both ? 'BOTH HALVES. The lab tech in Caldera is about to have a very good day.' : 'One half recovered. The other shelf-run still waits.'], () => { if (both) advanceTale(st, id); });
      return true;
    }
    return false;
  },


  // ---------- mart ----------
  // Elevation B4: the shared quantity stepper, extracted from openMart
  // (Cheat Shop, 2026-10-28) so the mart and the Cheat Terminal share
  // ONE stepper. One menu row carries the live count + total; the
  // direction keys adjust (Left/Right ±1, Up/Down ±10) through the
  // menu's onKey hook, A confirms the WHOLE purchase as one transaction,
  // B cancels back to the stock list. openMart's behaviour is unchanged.
  pickQty(verb, itemName, unitPrice, maxQty, onConfirm, onCancel) {
    const g = this.game;
      let qty = 1;
      const render = () => {
        g.ui.showMenu(verb + ' — ' + itemName, [
          { label: verb + ' x' + qty + ' — $' + (qty * unitPrice) + '  (◀ ▶ ±1 · ▲ ▼ ±10)', value: 'go' },
          { label: 'Cancel', value: 'cancel' },
        ], (v) => {
          if (v === 'go') onConfirm(qty);
          else onCancel();
        }, {
          onKey: (dir) => {
            if (dir === 'left') qty = Math.max(1, qty - 1);
            else if (dir === 'right') qty = Math.min(maxQty, qty + 1);
            else if (dir === 'up') qty = Math.min(maxQty, qty + 10);
            else if (dir === 'down') qty = Math.max(1, qty - 10);
            else if (dir === 'pageup') qty = Math.max(1, qty - 10);
            else if (dir === 'pagedown') qty = Math.min(maxQty, qty + 10);
            else return;
            g.audio.playSfx('ui-tick');
            render();
          },
        });
      };
      render();
  },

  openMart(stock) {
    const g = this.game;
    const pickQty = (verb, itemName, unitPrice, maxQty, onConfirm, onCancel) =>
      this.pickQty(verb, itemName, unitPrice, maxQty, onConfirm, onCancel);
    const showBuy = () => {
      // ADR-025 §3 (Phase 3): stock rows carrying minBadges stay hidden
      // until the player has earned that many badges (the codebase's
      // badgesAtLeast gating idiom — this is how the Canopy shop's
      // Second-Wind Ribbon is "late"). Keepsakes are unique objects:
      // once owned (bag or held) the row is disabled.
      const items = stock.filter((id) => ITEMS[id] && ITEMS[id].price > 0
        && (!ITEMS[id].minBadges || g.state.badges.kanto.length >= ITEMS[id].minBadges)).map((id) => ({
        label: ITEMS[id].name + ' — $' + ITEMS[id].price + ' (own ' + (g.state.bag[id] || 0) + ')', value: id,
        disabled: g.state.player.money < ITEMS[id].price
          || (ITEMS[id].pocket === 'keepsakes' && ownsKeepsake(g.state, id)),
      }));
      items.push({ label: 'Back', value: null });
      g.ui.showMenu('Buy what?', items, (iv) => {
        // AUDIT FIX (S-11): Back returns to the Mart top menu, not out
        // of the whole Mart flow onto the street.
        if (!iv) { this.openMart(stock); return; }
        const it = ITEMS[iv];
        const buyNow = (qty) => {
          g.state.player.money -= it.price * qty;
          g.state.bag[iv] = (g.state.bag[iv] || 0) + qty;
          g.audio.playSfx('dex-register');
          g.ui.toast(qty > 1 ? 'Bought ' + qty + ' x ' + it.name + '.' : 'Bought ' + it.name + '.');
          this.openMart(stock);
        };
        // Keepsakes stay qty-1 only: unique objects buy in one press,
        // and the purchase rides the central source grant (the row is
        // already disabled when the piece is owned, so a duplicate
        // here is unreachable — the grant is the guard).
        if (it.pocket === 'keepsakes') {
          const res = grantKeepsakeFromSource(g.state, iv);
          if (res.status === 'granted') {
            g.state.player.money -= it.price;
            g.audio.playSfx('dex-register');
            g.ui.toast('Bought ' + it.name + '.');
          }
          this.openMart(stock);
          return;
        }
        const maxQty = Math.max(1, Math.min(99, Math.floor(g.state.player.money / it.price)));
        pickQty('Buy', it.name, it.price, maxQty, buyNow, showBuy);
      });
    };
    const showSell = () => {
      // ADR-025 §3: keepsakes are non-sellable (pocket excluded).
      const items = Object.keys(g.state.bag).filter((id) => ITEMS[id] && ITEMS[id].pocket !== 'keepsakes' && ITEMS[id].price > 0 && g.state.bag[id] > 0)
        .map((id) => ({ label: ITEMS[id].name + ' x' + g.state.bag[id] + ' — sell $' + Math.floor(ITEMS[id].price / 2), value: id }));
      items.push({ label: 'Back', value: null });
      g.ui.showMenu('Sell what?', items, (iv) => {
        if (!iv) { this.openMart(stock); return; }
        const it = ITEMS[iv];
        const unit = Math.floor(it.price / 2);
        pickQty('Sell', it.name, unit, g.state.bag[iv] || 1, (qty) => {
          g.state.bag[iv] -= qty;
          g.state.player.money += unit * qty;
          g.ui.toast(qty > 1 ? 'Sold ' + qty + ' x ' + it.name + '.' : 'Sold ' + it.name + '.');
          this.openMart(stock);
        }, showSell);
      });
    };
    g.ui.showMenu('Mart — $' + g.state.player.money, [
      { label: 'Buy', value: 'buy' }, { label: 'Sell', value: 'sell' }, { label: 'Leave', value: 'leave' },
    ], (v) => {
      if (v === 'buy') showBuy();
      else if (v === 'sell') showSell();
    });
  },

  // ---------- Cheat Terminal (owner order 2026-10-28) ----------
  // A free shop: no Sell, no money anywhere — every claim is $0 and the
  // player's money is never read or written here. Stock = the whole
  // item table by pocket, all 8 Arden badges, every keepsake, and every
  // species (legendaries included). The server validator's rules are
  // honored on the client: bag entries clamp at 999, boxes cap at 30.
  cheatClaimItem(id, qty) {
    // Returns the quantity actually granted. Clamps to the validator's
    // 999 bag cap; an item already at 999 grants 0 (caller toasts).
    const g = this.game;
    const owned = g.state.bag[id] || 0;
    const grant = Math.max(0, Math.min(qty, 999 - owned));
    if (grant > 0) g.state.bag[id] = owned + grant;
    return grant;
  },

  cheatClaimBadge(badgeId) {
    // OWNER OVERRIDE: badges are stock. The claim writes the exact
    // representation the leader-award path writes (battle.mjs: the id
    // pushed into badges.<set> + the badge_<name> story flag) — no
    // parallel representation. The server validator requires badges to
    // be a PREFIX of the canonical earn order, so claiming badge #N
    // also grants any missing earlier badges OF THE SAME SET (Stage
    // O2: the prefix rule extends across sets independently — Arden
    // claims never touch badges.orange and vice versa); a claim can
    // therefore never produce an invalid save.
    const g = this.game;
    // Stage F0: 'symbols' is excluded from the set search — its list
    // is facility slot order, not claimable badge ids, and its state
    // is the slot-shaped badges.symbols (earned-only; a claim here
    // writes set ARRAYS and would corrupt the slot shape).
    const setId = Object.keys(BADGE_SETS).filter((k) => k !== 'symbols').find((k) => BADGE_SETS[k].includes(badgeId));
    if (!setId) return false;
    const ORDER = BADGE_SETS[setId];
    const arr = g.state.badges[setId] || (g.state.badges[setId] = []);
    const idx = ORDER.indexOf(badgeId);
    if (idx < 0 || arr.includes(badgeId)) return false;
    for (let i = 0; i <= idx; i++) {
      if (!arr.includes(ORDER[i])) {
        arr.push(ORDER[i]);
        g.state.story.flags['badge_' + ORDER[i].replace(/badge$/, '')] = true;
      }
    }
    if (setId === 'orange' && arr.length >= 4) g.state.story.flags.orange_crew_done = true;
    return true;
  },

  cheatDeliverMon(speciesId, level, dest) {
    // Gift-path generation (makeMon: all-31 IVs, last-4 learnset moves)
    // + dexRegister('caught') — but CAP-SAFE, unlike giftMon's blind
    // push into the current box: space is verified BEFORE any state
    // mutation, so a refusal leaves the save byte-identical.
    const g = this.game;
    let boxId = null;
    if (dest === 'party') {
      if (g.state.party.length >= 6) return { ok: false, reason: 'party-full' };
    } else {
      for (let i = 1; i <= BOX_COUNT; i++) {
        const id = 'box' + i;
        if (((g.state.boxes[id] || []).length) < BOX_CAP) { boxId = id; break; }
      }
      if (!boxId) return { ok: false, reason: 'boxes-full' };
    }
    const mon = makeMon(speciesId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'caught', SPECIES[speciesId].dexNo);
    if (dest === 'party') g.state.party.push(mon);
    else (g.state.boxes[boxId] || (g.state.boxes[boxId] = [])).push(mon);
    return { ok: true, dest, boxId, mon };
  },

  openCheatShop() {
    const g = this.game;
    // Badge stock is data-driven from BADGE_SETS (Stage O2): the
    // Arden eight plus the Amber four, each set claimed under its
    // own prefix rule (cheatClaimBadge resolves the set from the id).
    // Stage F0: 'symbols' is excluded EXPLICITLY at this read site.
    // BADGE_SETS.symbols is the Frontier SLOT ORDER (facility ids, not
    // item ids), and Symbols are earned-only, slot-shaped state
    // (badges.symbols tiers) — they must never become claimable badge
    // stock (the claim path writes set arrays), and their ITEMS rows
    // must not leak in through the Key Items pocket either, so the
    // symbol item ids are filtered out of EVERY section below.
    const BADGE_IDS = Object.entries(BADGE_SETS).filter(([setId]) => setId !== 'symbols').flatMap(([, ids]) => ids);
    const SYMBOL_ITEM_IDS = ['abilitysymbol', 'knowledgesymbol', 'gutssymbol', 'tacticssymbol', 'lucksymbol', 'spiritsymbol', 'bravesymbol'];
    const badgeOwned = (id) => Object.values(g.state.badges || {}).some((arr) => Array.isArray(arr) && arr.includes(id));
    const SECTIONS = [
      { label: 'Balls', value: 'balls' }, { label: 'Medicine', value: 'medicine' },
      { label: 'Items', value: 'items' }, { label: 'TMs', value: 'tm' }, { label: 'HMs', value: 'hm' },
      { label: 'Key Items', value: 'key' }, { label: 'Badges', value: 'badges' },
      { label: 'Keepsakes', value: 'keepsakes' }, { label: 'Collectibles', value: 'collectibles' },
    ];
    const stockOf = (section) => Object.keys(ITEMS).filter((id) => {
      const it = ITEMS[id];
      if (SYMBOL_ITEM_IDS.includes(id)) return false; // Stage F0: earned-only, never stock (see above)
      if (section === 'badges') return BADGE_IDS.includes(id);
      if (section === 'collectibles') return !!it.collectible;
      if (section === 'key') return it.pocket === 'key' && !BADGE_IDS.includes(id);
      if (section === 'items') return it.pocket === 'items' && !it.collectible;
      return it.pocket === section;
    });
    const showSection = (section) => {
      const rows = stockOf(section).map((id) => {
        const it = ITEMS[id];
        if (section === 'badges') {
          return { label: it.name + ' — $0', value: id, disabled: badgeOwned(id) };
        }
        if (section === 'keepsakes') {
          return { label: it.name + ' — $0 (own ' + (g.state.bag[id] || 0) + ')', value: id, disabled: ownsKeepsake(g.state, id) };
        }
        return { label: it.name + ' — $0 (own ' + (g.state.bag[id] || 0) + ')', value: id };
      });
      rows.push({ label: 'Back', value: null });
      g.ui.showMenu('Cheat Terminal — free', rows, (iv) => {
        if (!iv) { showItems(); return; }
        const it = ITEMS[iv];
        if (section === 'badges') {
          if (this.cheatClaimBadge(iv)) {
            g.audio.playSfx('badge');
            g.ui.toast('Got the ' + it.name + '!');
          }
          showSection(section);
          return;
        }
        if (section === 'keepsakes') {
          // Claim through the central source grant. The row is disabled
          // once owned, so the duplicate->$2,000 conversion is
          // unreachable from here (guarded again below regardless).
          if (ownsKeepsake(g.state, iv)) { showSection(section); return; }
          const res = grantKeepsakeFromSource(g.state, iv);
          if (res.status === 'granted') {
            g.audio.playSfx('dex-register');
            g.ui.toast('Got ' + it.name + '!');
          }
          showSection(section);
          return;
        }
        const owned = g.state.bag[iv] || 0;
        if (owned >= 999) {
          g.ui.toast(it.name + ' is already maxed at 999.');
          showSection(section);
          return;
        }
        // Fossils land here as ordinary key items: the item is granted,
        // fossil_taken is NEVER set by the shop (the Mt. Lunestone choice
        // event owns that flag; the Caldera revive reads the bag).
        const maxQty = Math.min(99, 999 - owned);
        this.pickQty('Get', it.name, 0, maxQty, (qty) => {
          const granted = this.cheatClaimItem(iv, qty);
          g.audio.playSfx('dex-register');
          g.ui.toast(granted > 1 ? 'Got ' + granted + ' x ' + it.name + '.' : 'Got ' + it.name + '.');
          showSection(section);
        }, () => showSection(section));
      });
    };
    const showItems = () => {
      const rows = SECTIONS.map((s) => ({ label: s.label, value: s.value }));
      rows.push({ label: 'Back', value: null });
      g.ui.showMenu('Get Items — everything $0', rows, (v) => {
        if (!v) { this.openCheatShop(); return; }
        showSection(v);
      });
    };
    const showPokemon = () => {
      // Dex idiom: No. + name, owned marks. Forms group directly under
      // their base species (shared dexNo, form rows second, by name).
      const ownedIds = new Set([...g.state.party, ...Object.values(g.state.boxes || {}).flat()]
        .filter(Boolean).map((m) => m.speciesId));
      const ids = Object.keys(SPECIES).filter((id) => id !== 'partner')
        .sort((a, b) => (SPECIES[a].dexNo - SPECIES[b].dexNo)
          || ((SPECIES[a].form ? 1 : 0) - (SPECIES[b].form ? 1 : 0))
          || SPECIES[a].name.localeCompare(SPECIES[b].name));
      const rows = ids.map((id) => {
        const sp = SPECIES[id];
        const owned = sp.form ? ownedIds.has(id) : !!g.state.dex.caught[sp.dexNo];
        return { label: 'No.' + sp.dexNo + ' ' + sp.name + (owned ? ' ✓' : ''), value: id };
      });
      rows.push({ label: 'Back', value: null });
      g.ui.showMenu('Get Kin — everything $0', rows, (sid) => {
        if (!sid) { this.openCheatShop(); return; }
        const sp = SPECIES[sid];
        // Level stepper, opening at 50 (pickQty idiom, own start);
        // its cap is the current arc's band max (see the onKey below).
        let level = 50;
        const renderLevel = () => {
          g.ui.showMenu(sp.name + ' — choose a level', [
            { label: 'Level ' + level + '  (◀ ▶ ±1 · ▲ ▼ ±10)', value: 'go' },
            { label: 'Cancel', value: 'cancel' },
          ], (v) => {
            if (v !== 'go') { showPokemon(); return; }
            g.ui.showMenu('Send ' + sp.name + ' (Lv' + level + ') where?', [
              { label: 'Party', value: 'party', disabled: g.state.party.length >= 6 },
              { label: 'PC Box', value: 'box' },
              { label: 'Back', value: null },
            ], (dest) => {
              if (!dest) { renderLevel(); return; }
              const res = this.cheatDeliverMon(sid, level, dest);
              if (!res.ok) {
                g.ui.toast(res.reason === 'boxes-full' ? 'All PC boxes are full!' : 'Your party is full!');
                showPokemon();
                return;
              }
              g.audio.playSfx('dex-register');
              g.ui.toast(dest === 'party' ? 'Received ' + sp.name + '!' : 'Received ' + sp.name + '! Sent to ' + res.boxId.replace('box', 'Box ') + '.');
              showPokemon();
            });
          }, {
            onKey: (dir) => {
              // ADR-027 Amendment 2: the stepper caps at the CURRENT
              // arc's band max, read from the registry (Arc 1/1.5: 100,
              // exactly as before; the open-level Frontier reads
              // Infinity and Math.min passes the value through).
              const cap = levelCapFor(g.state);
              if (dir === 'left') level = Math.max(1, level - 1);
              else if (dir === 'right') level = Math.min(cap, level + 1);
              else if (dir === 'up') level = Math.min(cap, level + 10);
              else if (dir === 'down') level = Math.max(1, level - 10);
              else if (dir === 'pageup') level = Math.max(1, level - 10);
              else if (dir === 'pagedown') level = Math.min(cap, level + 10);
              else return;
              g.audio.playSfx('ui-tick');
              renderLevel();
            },
          });
        };
        renderLevel();
      });
    };
    g.ui.showMenu('Cheat Terminal — everything is $0', [
      { label: 'Get Items', value: 'items' },
      { label: 'Get Kin', value: 'pokemon' },
      { label: 'Leave', value: 'leave' },
    ], (v) => {
      if (v === 'items') showItems();
      else if (v === 'pokemon') showPokemon();
    });
  },

  // ---------- Game Corner slots ----------
  openSlots() {
    const g = this.game;
    const coins = g.state.bag.coin || 0;
    g.ui.showMenu('Slots — ' + coins + ' coins (7-7-7 pays 300, three of a kind 50, any pair 8)', [
      { label: 'Spin (1 coin)', value: 'spin', disabled: coins < 1 },
      { label: 'Buy 50 coins ($1000)', value: 'buy', disabled: g.state.player.money < 1000 },
      { label: 'Leave', value: 'leave' },
    ], (v) => {
      if (v === 'buy') {
        g.state.player.money -= 1000;
        g.state.bag.coin = (g.state.bag.coin || 0) + 50;
        // Wire-the-dead-items: the Coin Case's first legitimate mint — the
        // desk hands it over with a first coin purchase (it previously
        // existed only via the NG+ handover, and nothing ever checked it).
        if (!(g.state.bag.coincase > 0)) {
          g.state.bag.coincase = 1;
          g.ui.toast('Received the Coin Case!');
        }
        this.openSlots();
        return;
      }
      if (v !== 'spin') return;
      g.state.bag.coin--;
      const syms = ['7', 'BAR', '♣', '♦', '♥', '♠'];
      const reel = [0, 0, 0].map(() => syms[Math.floor(g.rng.misc() * syms.length)]);
      let win = 0;
      if (reel[0] === '7' && reel[1] === '7' && reel[2] === '7') win = 300;
      else if (reel[0] === reel[1] && reel[1] === reel[2]) win = 50;
      else if (reel[0] === reel[1] || reel[1] === reel[2] || reel[0] === reel[2]) win = 8;
      if (win > 0) g.state.bag.coin += win;
      g.audio.playSfx(win > 0 ? 'dex-register' : 'menu-move');
      g.ui.say(['[ ' + reel.join(' | ') + ' ]' + (win > 0 ? ' — WINNER! +' + win + ' coins!' : ' — no luck this spin.')], () => this.openSlots());
    });
  },

  // ---------- evolution ----------
  evolveMon(mon, stoneId, onDone, forcedEvo) {
    const g = this.game;
    const chk = evolutionCheck(mon);
    if (!chk.ok) { g.ui.say([chk.line], onDone || undefined); return false; }
    if (mon.egg) { g.ui.say(['The Egg is in no state to evolve. It has not even met the world yet.'], onDone || undefined); return false; }
    const sp = SPECIES[mon.speciesId];
    let evo = null;
    if (forcedEvo) {
      // Stage J6: Link Transfer names its branch explicitly (a trade
      // entry from `evos` may not be the species' `evo` slot).
      evo = forcedEvo;
    } else if (stoneId) {
      const evos = sp.evos || (sp.evo ? [sp.evo] : []);
      evo = evos.find((e) => e.method === 'stone' && e.stone === stoneId) || null;
    } else {
      evo = sp.evo || (sp.evos ? sp.evos[0] : null);
    }
    if (!evo) return false;
    const fromName = displayName(mon, SPECIES);
    const to = SPECIES[evo.to];
    if (!to) return false;
    g.audio.playSfx('evolution-fanfare'); // W12-T4: evolution has its own sting (levelup keeps the level-up moment)
    // The data swap, unchanged from the original instant evolution —
    // the Evolution Ceremony scene calls this exactly once, at the
    // transformation's white-hold peak, and never on a B-cancel.
    const applyEvolution = () => {
      const ivs = mon.ivs || {};
      const oldMax = mon.maxHp;
      mon.speciesId = evo.to;
      mon.maxHp = hpValue(to.base.hp, mon.level, ivs.hp);
      if (mon.hp > 0) mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
      mon.stats = {
        atk: statValue(to.base.atk, mon.level, ivs.atk), def: statValue(to.base.def, mon.level, ivs.def),
        spa: statValue(to.base.spa, mon.level, ivs.spa), spd: statValue(to.base.spd, mon.level, ivs.spd),
        spe: statValue(to.base.spe, mon.level, ivs.spe),
      };
      dexRegister(g.state.dex, 'caught', to.dexNo);
    };
    // Evolution Ceremony (2026-11-17): every trigger — post-battle
    // level-up queue, stones, Link Transfer, storage — routes through
    // this one function, so the ceremony fires for all of them. The
    // scene needs both forms' battle art; without it (bare headless
    // contexts) the legacy instant path below runs instead.
    const artReady = g.spriteCache && g.spriteCache[mon.speciesId] && g.spriteCache[evo.to]
      && g.scenes && g.scenes.top === this;
    if (artReady) {
      const scene = new EvolutionScene({
        mon, fromId: mon.speciesId, toId: evo.to,
        fromName, oldName: sp.name, newName: to.name,
        apply: applyEvolution,
        onDone: (completed) => {
          // A cancelled stone evolution refunds the stone (the bag
          // caller already decremented it before this function ran).
          if (!completed && stoneId) g.state.bag[stoneId] = (g.state.bag[stoneId] || 0) + 1;
          if (onDone) onDone(completed);
        },
      });
      g.scenes.push(scene);
      return true;
    }
    applyEvolution();
    g.ui.say(['What? ' + fromName + ' is evolving!', fromName + ' evolved into ' + to.name + '!'], onDone || undefined);
    return true;
  },

  // ---------- blackout ----------
  blackout() {
    const g = this.game;
    g.state.player.money = Math.floor(g.state.player.money / 2);
    g.ui.say(['You scurried to a Center, protecting your exhausted team...'], () => {
      // P1: anchor the exit BEFORE the direct loadMap — a blackout
      // respawns in the last-visited Center, and leaving it must land
      // on that Center's town door-front (centerExit resolves the
      // persisted lineage), never back at the faint location.
      this.centerReturn = this.centerExit();
      this.loadMap('center');
      this.player.tx = 4; this.player.ty = 3;
      this.player.px = 4 * TILE; this.player.py = 3 * TILE;
      this.player.fx = 4; this.player.fy = 3;
      this.trail = [];
      this.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 4, dir: 'down' };
      g.ui.toast('Your Kin were healed. (Lost half your money.)');
    });
  },

  // ---------- world dressing ----------
  // Premium+ W5 (LD-3): boulders are world OBJECTS with a feet line —
  // the scene's y-sorted pass collects them here and draws them in
  // feet order with the characters (a boulder south of the player
  // occludes him; north, it stands behind him). Wave 4 sprite rule is
  // unchanged (position-hashed variant, cave set near cave tiles), and
  // LD-1 gives every boulder a ground shadow blob beneath it.
  sysCollectDrawItems(list) {
    const g = this.game;
    const T = TILE;
    if (!this.fxState) return;
    for (const b of this.fxState.boulders.values()) {
      const rowsNow = this.map.rows;
      const caveNear = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const row = rowsNow[b.y + dy]; const ch = row && row[b.x + dx];
        return ch === 'G' || ch === 'L' || ch === 'N';
      });
      const spr = g.boulderSprite ? g.boulderSprite(b.x, b.y, caveNear) : g.tileSprite('rock');
      if (!spr) continue;
      const bx = b.x, by = b.y;
      list.push({
        y: by * T + T, x: bx * T, footY: by * T + T,
        draw: (r) => {
          const sh = g.tileCache && g.tileCache.shadowBoulder;
          if (sh) r.blit(sh, bx * T, by * T);
          r.blit(spr, bx * T, by * T);
        },
      });
    }
  },

  sysRenderWorld(r) {
    const g = this.game;
    const T = TILE;
    // Cut trees become clearings.
    if (this.fxState) {
      for (const k of this.fxState.cut) {
        const [cx, cy] = k.split(',').map(Number);
        const spr = g.tileSprite('path');
        if (spr) r.blit(spr, cx * T, cy * T);
      }
    }
    // Readability Round 2 (lever 1): data signs get a real board. Before
    // R2 a map's signs were invisible interaction points — nothing at the
    // cell read as "sign" at any zoom. Same authored tile the tile
    // resolver draws for 'S' cells, blitted under the item balls.
    if (this.map.signs) {
      const sspr = g.tileCache && g.tileCache.sign ? g.tileCache.sign
        : (g.tileSprite ? g.tileSprite('sign') : null);
      if (sspr) for (const s of this.map.signs) r.blit(sspr, s.x * T, s.y * T);
    }
    // Item balls: the classic red-and-white sphere on the ground.
    if (this.map.items) {
      for (const b of this.map.items) {
        const flag = 'item_' + this.mapId + '_' + b.x + '_' + b.y;
        if (g.state.story.flags[flag]) continue;
        if ((b.item === 'helixfossil' || b.item === 'domefossil') && g.state.story.flags.fossil_taken
          && !hasTravelersMemory(g.state, 'fossil-choice')) continue;
        // Premium+ W5 (LD-1/TX-7): authored item-ball art with its
        // ground shadow baked in replaces the procedural two-circle
        // placeholder (zero arc call sites remain for item balls).
        const spr = g.tileCache && g.tileCache.itemball ? g.tileCache.itemball
          : (g.tileSprite ? g.tileSprite('itemball') : null);
        if (spr) r.blit(spr, b.x * T, b.y * T);
      }
    }
    // Dark caves: gloom with a glow around the player until FLASH is used.
    // Premium+ W5 (LD-4): the flat fill + hard 34px disc becomes a
    // >=4-step radial falloff (concentric warm discs, alpha rising to
    // the core), and the LD-4 light-source tiles (glow crystal /
    // lantern / lava / water glow) throw their own smaller 3-step
    // pools, breaking the single-disc read.
    if (this.map.dark && !(this.fxState && this.fxState.flashLit)) {
      const c = r.ctx;
      c.save();
      c.fillStyle = 'rgba(6,6,18,0.86)';
      c.fillRect(0, 0, this.w * T, this.h * T);
      const px = this.player.px + 8, py = this.player.py + 8;
      const steps = [[52, 0.05], [42, 0.08], [34, 0.12], [25, 0.17], [16, 0.23], [8, 0.30]];
      for (const [rad, a] of steps) {
        c.fillStyle = 'rgba(255,240,180,' + a + ')';
        c.beginPath(); c.arc(px, py, rad, 0, Math.PI * 2); c.fill();
      }
      const GLOWS = {
        cavecrystal: '138,232,240', cavelantern: '255,216,115',
        lavaglow: '240,120,48', waterglow: '111,176,238',
        // Premium+ W6 (TX-5): the sub-theme light sources throw pools
        // in their own colours around the LD-4 sources W5 placed.
        lanternpost: '255,216,115', torchpost: '240,120,48',
        shroomglow: '95,220,190', crystalcluster: '168,140,220',
        cercrystal: '168,140,220', icecrystal: '138,232,240',
        icepool: '111,176,238', cerpool: '111,176,238',
      };
      for (let ty = 0; ty < this.map.rows.length; ty++) {
        const row = this.map.rows[ty];
        for (let tx = 0; tx < row.length; tx++) {
          const kind = TILE_CHARS[row[tx]];
          const rgb = kind && GLOWS[kind];
          if (!rgb) continue;
          const gx = tx * T + 8, gy = ty * T + 8;
          for (const [rad, a] of [[20, 0.10], [13, 0.16], [7, 0.24]]) {
            c.fillStyle = 'rgba(' + rgb + ',' + a + ')';
            c.beginPath(); c.arc(gx, gy, rad, 0, Math.PI * 2); c.fill();
          }
        }
      }
      c.restore();
    }
  },

  // ---------- Premium+ W7 (TX-7): foreground layer ----------
  // Canopy overhangs + typed-building roof eaves, drawn by the scene
  // AFTER the y-sorted character pass (overworld.mjs render hook), so
  // the player and NPCs pass UNDER them. The per-cell rule is
  // art.foregroundFor — the same function the W7 census measures, so
  // shipped coverage == graded coverage. PL-3: visible-rect loop only,
  // hash-picked pre-rendered canvases, zero per-frame allocation.
  sysRenderForeground(r) {
    const g = this.game;
    if (!g.tileCache || !g.foregroundFor) return;
    const T = TILE;
    const vr = r.viewRect();
    const x0 = Math.max(0, Math.floor(vr.x0 / T)), x1 = Math.min(this.w - 1, Math.ceil(vr.x1 / T));
    const y0 = Math.max(0, Math.floor(vr.y0 / T)), y1 = Math.min(this.h - 1, Math.ceil(vr.y1 / T));
    const kindAt = (tx, ty) => (ty < 0 || ty >= this.map.rows.length || tx < 0 || tx >= this.map.rows[ty].length)
      ? null : g.tileKind(this.map.rows[ty][tx]);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const fg = g.foregroundFor(g.tileKind(this.map.rows[y][x]), x, y, kindAt, this.map && this.map.id);
        if (fg) r.blit(fg, x * T - 8, y * T - 16);
      }
    }
  },

  // ---------- objective (quest-driven HUD line) ----------
  // REGION-1 FIX WAVE (Bug 4): the current row of a quest chain is
  // the first incomplete row AFTER the last completed one — not the
  // first incomplete row overall. Every chain below used to take the
  // first row whose flag was unset, so one skipped step pinned the
  // HUD forever: a player who walked past the Sea Cottage beat (its
  // only trigger is one event tile at the researcher's feet; talking
  // to him from the side never fires it) and finished the campaign
  // still read "Help the researcher at the Sea Cottage" at the
  // League door (completion runs 3 AND 4). When a later row's flag
  // stands, the player is demonstrably beyond the skipped row, and
  // the objective follows their actual arc. In-order play is
  // byte-identical: flags set in order make the two readings agree.
  // The mechanism is shared by all five regional chains, so the fix
  // is game-wide.
  currentQuest(chain, flags) {
    return currentQuestOf(chain, flags);
  },

  sysObjective() {
    const g = this.game;
    // Stage O2: while the Amber arc is current, its chain leads the
    // HUD objective (the badge stage counts n/4, as in the Quest Log).
    if (currentArcOf(g.state).id === 'orange') {
      // Stage O3: while the storm is live it leads the objective,
      // wherever the badge chain stands (the chain is never a gym
      // blocker, but the sky is hard to ignore).
      const f = g.state.story.flags;
      if (f.orange_2000_active && !f.orange_2000_storm_stilled) {
        const n = (f.orange_2000_moltres ? 1 : 0) + (f.orange_2000_zapdos ? 1 : 0) + (f.orange_2000_articuno ? 1 : 0);
        return n >= 3
          ? '▶ The Storm over Sanctum — return to Sanctum Shrine: the guardian rises'
          : '▶ The Storm over Sanctum — calm the three titans (' + n + '/3)';
      }
      const oq = this.currentQuest(ORANGE_QUESTS, g.state.story.flags);
      if (oq) return '▶ ' + oq.text + (oq.badgeCount ? ' (' + ((g.state.badges.orange || []).length) + '/4)' : '') + (oq.titanCount ? ' (' + ((f.orange_2000_moltres ? 1 : 0) + (f.orange_2000_zapdos ? 1 : 0) + (f.orange_2000_articuno ? 1 : 0)) + '/3 titans calmed)' : '');
    }
    // Stage J4a: while the Yamato arc is current, its chain leads the
    // HUD objective (the west rows in J4a; J4b's appended rows join
    // the same find, in chain order).
    if (currentArcOf(g.state).id === 'johto') {
      const jq = this.currentQuest(JOHTO_QUESTS, g.state.story.flags);
      if (jq) return '▶ ' + jq.text;
    }
    // Stage H4a: while the Maris arc is current, its chain leads the
    // HUD objective (the first-half rows; H4b's appended rows join
    // the same find, in chain order).
    if (currentArcOf(g.state).id === 'hoenn') {
      const hq = this.currentQuest(HOENN_QUESTS, g.state.story.flags);
      if (hq) return '▶ ' + hq.text;
    }
    // Stage S5a: while the Borea arc is current, its chain leads the
    // HUD objective (the first-half rows; S5b's appended rows join
    // the same find, in chain order).
    if (currentArcOf(g.state).id === 'sinnoh') {
      const sq = this.currentQuest(SINNOH_QUESTS, g.state.story.flags);
      if (sq) return '▶ ' + sq.text;
    }
    // Game-feel F3: the opening objective names the actual first step —
    // leave Dawnwick by the south road — until the player first sets
    // foot on Route 1; only then does the badge chain lead the HUD.
    const gf = g.state.story.flags;
    if (gf.metPartner && !gf.reached_route1 && !gf.beat_brock) {
      return '▶ Leave Dawnwick — Route 1 lies south';
    }
    const q = this.currentQuest(MAIN_QUESTS, g.state.story.flags);
    if (q) return '▶ ' + q.text;
    const active = Object.keys(g.state.story.quests).find((k) => g.state.story.quests[k] === 'active');
    if (active && LEGENDARY_ARCS[active]) return '▶ Arc: ' + LEGENDARY_ARCS[active].title;
    return '▶ Explore Arden';
  },
});
