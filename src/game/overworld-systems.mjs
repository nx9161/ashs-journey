// overworld-systems.mjs — the campaign + parity systems layer (WS6/WS9):
// story event interpreter + quest log state, item balls + hidden items,
// field moves (Cut/Surf/Strength/Flash/Fly), fishing, poison walk damage,
// Safari Zone session, Game Corner slots + prizes, PC boxes, marts, NPC
// trades/gifts/revival/ferry, evolution execution, blackout handling.
// Attached to OverworldScene.prototype; overworld.mjs calls the sys* hooks.

import { MAPS, TRAINERS, WALKABLE } from '../data/maps.mjs';
import { TILE_CHARS } from '../engine/tiles.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS, BADGE_SETS } from '../data/items.mjs';
import { grantKeepsake, grantKeepsakeFromSource, dupeKeepsakeLine, DUPE_KEEPSAKE_CASH, ownsKeepsake } from './keepsakes.mjs';
import { hasTravelersMemory } from './state.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, evolutionCheck, boxCheck } from './state.mjs';
import { sparLevelFor } from './rules.mjs';
import { BattleScene } from './battle.mjs';
import { ContestScene, hasRibbon } from './contest.mjs';
import { RIBBON_NAMES } from '../data/contest.mjs';
import { EVENTS, MAIN_QUESTS, LEGENDARY_ARCS, CREDITS_LINES } from '../data/story-kanto.mjs';
import { ORANGE_QUESTS } from '../data/story-orange.mjs';
import { JOHTO_QUESTS } from '../data/story-johto.mjs';
import { HOENN_QUESTS } from '../data/story-hoenn.mjs';
import { DIVE_PAIRS } from '../data/maps7.mjs';
import { QUESTS, taleSpotAt, taleStageOf, taleStatus, acceptTale, advanceTale, completeTale, IOU_PRIORITY } from '../data/quests.mjs';
import { applyBond, applyBondOnce, bondOf, bondSceneLines, bondTrainerVariant, recordBattleBond, tierAtLeast, takeEchoGreeting, ECHO_LINE, BOND_NPC_IDS } from './bonds.mjs';
import { CHAPTERS } from '../data/story.mjs';
import { statValue, hpValue } from '../engine/formulas.mjs';
import { levelCapFor, HOME_MAP_ID, currentArcOf } from '../data/arcs.mjs';
import { checkArcCompletion, tryHomecoming, arcFerryAllowed, arcFerryGateLine } from './arcs.mjs';
import {
  ensureJohtoSystems, johtoStepTick, apricornTreeAt, pickApricorn, tradeEvolutionsOf,
  depositToDaycare, withdrawFromDaycare, collectDaycareEgg, giveStoryEgg, pairCompatible,
  APRICORN_IDS, APRICORN_TO_BALL, kurtOrderStatus, kurtPlaceOrder, kurtCollect,
} from './johto-systems.mjs';

const BOX_COUNT = 12;
const BOX_CAP = 30; // UI v2.4: Platinum's 30 — matches the save validator's limit (was 20)
const FOSSIL_OF = { helixfossil: 'omanyte', domefossil: 'kabuto', oldamber: 'aerodactyl' };

function key(x, y) { return x + ',' + y; }
function rtOf(game) { return game.state.settings.battleStyle !== 'classic'; }

Object.assign(OverworldScene.prototype, {
  // ---------- map lifecycle ----------
  sysLoadMap(id) {
    const g = this.game;
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
      if (this.map.centerCity) g.state.story.flags['visited_' + id] = true;
    }
    if (g.state.story.flags['in_' + id] === undefined) g.state.story.flags['in_' + id] = true;
    g.state.story.flags['reached_' + id] = true; // quest chain producers (WS6)
    // ADR-025 §6 (Traveler's Memory): the Saffron gate, remembered.
    // The shipped game never posted a guard at Saffron's doors (the
    // city is entered freely), so the memory surfaces as the city
    // itself acknowledging the returning traveler — once, on the
    // first arrival of a journey that carries it. Door-keeping only:
    // no beat, battle, or badge is touched.
    if (id === 'saffron' && hasTravelersMemory(g.state, 'saffron-guard')
      && !g.state.story.flags.echo_saffron_guard) {
      g.state.story.flags.echo_saffron_guard = true;
      g.ui.say(['The Saffron gate attendant looks up from his thermos — then waves you straight through, drink and all. "Go on," he says. "City remembers you."']);
    }
    // ADR-025 §6 (Traveler's Memory): the Card Key route, remembered.
    // Like Saffron, the shipped game never actually gates Silph on
    // the Card Key (the warps run either way), so the memory is pure
    // acknowledgment — once, on the first Silph entry of a journey
    // that carries it. No gate is claimed, none is lifted.
    if ((id === 'silph1' || id === 'silph2') && hasTravelersMemory(g.state, 'card-key')
      && !g.state.story.flags.echo_card_key) {
      g.state.story.flags.echo_card_key = true;
      g.ui.say(['The lobby doors part, and your feet are already sure of the way — the key by the plants, the lift, the long climb. You walked Silph once with a Card Key in hand. The building feels smaller when you know its route by heart.']);
    }
    // ADR-027 (Stage F): the arc transition machine's map-entry hooks.
    // The completion check runs first (a legacy save that finished
    // Kanto before this foundation shipped gets its ARC COMPLETE card
    // on first entry, exactly once — the flag guards every later
    // load); the homecoming fires on entering Mom's house with the
    // directive pinned, and only when the card did not just fire.
    const arcCardFired = checkArcCompletion(g);
    if (!arcCardFired && id === HOME_MAP_ID) tryHomecoming(g);
    // Stage O2 (Orange story): map-entry scenes, flag-gated once each.
    // Ivy's intro fires on FIRST entry to her lab; Lapras fires on
    // Valencia once the first Orange badge is held; the pod reunion
    // fires pre-League (4 badges) on Pummelo / the north sea. Each
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
    // Stage O3 (Pokemon 2000): the Shamouti storm chain. The trigger
    // is chronology-true mid-arc — first Shamouti arrival with the
    // Sea Ruby held (>= 2 Orange badges) — and is NEVER a gym
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
    // Stage J4a (Johto story, west): map-entry scenes, flag-gated once
    // each, in the Orange idiom — a scene's own completion flag is its
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
    // Stage J4b (Johto story, east): map-entry scenes, same idiom —
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
        // warp lands on Blackthorn's east edge, facing the road back.
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
    // Stage H4a (Hoenn story, first half): map-entry scenes, same
    // idiom — each scene's own completion flag is its gate, so a fled
    // or stalled beat re-fires on a later entry. The rescue fires on
    // the ferry landing map itself (Littleroot); Meteor Falls waits
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
    // Stage H4b (Hoenn story, second half): map-entry scenes, same
    // idiom and same gate law — each scene's own completion flag is
    // its gate, so a fled or stalled beat re-fires on a later entry.
    // The chain order is the fiction's: Institute (Balance held) ->
    // Pyre (Mind held) -> the two hideouts (orbs taken / Pyre done)
    // -> Seafloor (submarine stolen) -> the Sootopolis standoff
    // (Seafloor done) -> Sky Pillar (standoff seen). The climax
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
      const lines = [];
      for (const m of j6tick.hatched) {
        lines.push('Oh? The Egg is hatching!');
        lines.push(displayName(m, SPECIES) + ' hatched from the Egg!');
      }
      g.audio.playSfx('dex-register');
      g.ui.say(lines);
      return true;
    }
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
    if (saf && this.mapId === 'safari' && t === ',') { table = enc.table; rate = enc.rate; }
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
        kind: 'wild', foe, returnTo: this, safari: true,
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
    // (drought -> deluge -> resolved) are data steps in the Hoenn
    // events, not engine special cases. Setting false (not delete)
    // keeps the save's flag vocabulary stable for the validator.
    if (s.clearFlag) { g.state.story.flags[s.clearFlag] = false; next(); return; }
    if (s.quest) { g.state.story.quests[s.quest] = 'active'; next(); return; }
    if (s.questDone) { g.state.story.quests[s.questDone] = 'complete'; next(); return; }
    if (s.arc) {
      g.state.story.quests[s.arc] = s.stage;
      // ADR-025 §2: legendary-arc beats are a bond source — +1 with the
      // characters the arc involves, recorded once at completion (the
      // Mewtwo arc is Blaine's old expedition; the Mew beat is the one
      // the duo witnessed and stood down for). One-shot by flag.
      if (s.stage === 'complete') {
        if (s.arc === 'arc_mewtwo') applyBondOnce(g.state, 'bondsrc_arc_mewtwo', 'blaine', 1);
        if (s.arc === 'arc_mew') { applyBondOnce(g.state, 'bondsrc_arc_mew_rue', 'rue', 1); applyBondOnce(g.state, 'bondsrc_arc_mew_cole', 'cole', 1); }
      }
      next(); return;
    }
    // ADR-025 §2: the CHOICE POINT primitive. An authored beat offers
    // unlabelled options through the existing ui.showMenu (keyboard /
    // touch parity is the menu's own); the chosen option applies its
    // bond delta (swing-clamped to <=2 inside applyBond), queues the
    // heart pip for the consequence dialogue, then plays its lines.
    // Choices never gate the story: every option advances the beat.
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
    // ADR-025 §2: a tier-variant beat. Emits the scene's lines for the
    // character's CURRENT tier when a variant exists for it (e.g. the
    // champion scene's Close-only mutual-respect lines); otherwise the
    // beat is silent and the authored scene around it plays unchanged.
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
    if (s.giveMon) { this.giftMon(s.giveMon.species, s.giveMon.level, next); return; }
    // Stage O2: the GS Ball grant beat. The story GS Ball IS the Cheat
    // Shop collectible item (one id, one representation): a player who
    // already owns one hears the variant line and is NOT granted a
    // duplicate — the errand beat can never soft-fail on shop stock.
    if (s.gsBall) {
      if ((g.state.bag.gsball || 0) > 0) {
        g.ui.say([
          'Ivy lifts the glass hood — then stops, and laughs. "Wait. You are already carrying one."',
          '"A twin of it, out in the world, in a trainer\'s bag. Then the errand is half done already, and the mystery is twice as big. Keep yours close — no machine can open it, and I have the bruised equipment to prove it."',
        ], next, 'PROF. IVY');
      } else {
        g.state.bag.gsball = 1;
        g.audio.playSfx('dex-register');
        g.ui.say([
          'Ivy lifts the glass hood with both hands, the way you would lift a sleeping bird, and sets the ball in yours. It is heavier than it looks. It is warmer than it should be.',
          'Received the GS Ball!',
          '"There. It is yours to carry now. Study it all you like on the road — I did. It studies back."',
        ], next, 'PROF. IVY');
      }
      return;
    }
    // Stage O2: cap-safe gift delivery (the Cheat Shop stage's
    // cheatDeliverMon, NOT giftMon's blind push): party if room, else
    // the first PC box with space, with a toast naming the box. Total
    // refusal STALLS the chain — no flag, no event-done — so the beat
    // re-fires on a later entry once room exists.
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
    // (Silver on Route 30). Fought friendly — a loss costs nothing and
    // never blacks out — the branch flag records the honest outcome
    // (winFlag / loseFlag), and the chain advances on a win OR a loss.
    // Fleeing stalls the chain (no flag, no event-done), so the scene
    // re-fires on the next entry, exactly like a fled wildBattle.
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
    if (s.ending) { this.runEnding(next); return; }
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
      lines.push('Give it to a Pokemon from the party menu — its holder gains x1.2 XP.');
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
    // Stage J5: the Ilex Forest shrine (the JSHRINE prop at (14,3))
    // is Celebi's door — faced-tile, exactly like a tale spot.
    if (this.mapId === 'ilex-forest' && fx === 14 && fy === 3 && this.johtoShrineInteract()) return true;
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
            g.ui.say(['The apricorn tree is resting. Its next fruit ripens in about ' + res.remaining + ' steps of walking.']);
          }
          return true;
        }
        g.ui.say(['An apricorn tree, bare of ripe fruit.']);
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
          // Mt. Moon fossil pair: taking one seals the other (original beat).
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
            g.ui.say(['The water here goes down like a stairway into dark blue — a dive spot, marked by the old sea-charts.', 'Come back with the Mind Badge in your case — Mossdeep\'s gym, out east. The League does not let trainers down into the trenches without it.']);
            return true;
          }
          if (!this.partyKnowsDive()) {
            g.ui.say(['The water here goes down like a stairway into dark blue — a dive spot, marked by the old sea-charts.', 'You have the Mind Badge, but no partner who knows Dive. Steven Stone, in Mossdeep, teaches the way down — his house stands by the shore.']);
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
      g.ui.showMenu('Enter which Pokemon?', able.map((m, i) => ({
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
  // Pokemon Center (the NPC only exists while the House Rule is on — see
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

  // Stage O3: state-variant dialogue resolution. An NPC may carry
  // dialogueStates: [{ flag?, flagNot?, dialogue }] — the FIRST entry
  // whose conditions match the story flags supplies the lines for
  // this talk; otherwise the base dialogue is used. Only the LINES
  // are swapped: every downstream flow (ferry menus, marts, gifts,
  // the plain-dialogue fallback in overworld.mjs) proceeds exactly
  // as shipped. Both talk paths resolve through this one helper.
  npcDialogueLines(npc) {
    const g = this.game;
    const stateDlg = Array.isArray(npc.dialogueStates)
      ? npc.dialogueStates.find((st) => (!st.flag || g.state.story.flags[st.flag]) && (!st.flagNot || !g.state.story.flags[st.flagNot]))
      : null;
    return (stateDlg ? stateDlg.dialogue : npc.dialogue).map((l) => l.replace('{player}', g.state.player.name));
  },

  sysNpc(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(this.npcDialogueLines(npc), cb, npc.name);
    // ADR-025 §6 (Bond echo): a character who was Close in a previous
    // journey says the line, once, the first time the new journey
    // meets them — then their own scene proceeds. Presentation only.
    const echoId = BOND_NPC_IDS[npc.name];
    if (echoId && takeEchoGreeting(g.state, echoId)) {
      g.ui.say([ECHO_LINE], () => { this.sysNpc(npc); }, npc.name);
      return true;
    }
    if (npc.sparCoach) { this.startSpar(npc); return true; }
    // ADR-025 §2 (Bonds): the Celadon parley pair run their scene.
    if (npc.parley) { if (this.runParleyNpc(npc)) return true; }
    // Stage O2: Orange story actors (Ivy, the four Crew leaders, the
    // stadium official, Drake) run their own scenes — challenges,
    // gates, and the two-stage Kumquat match are menu/battle flows,
    // not plain dialogue or a single trainer battle.
    if (npc.orange) { if (this.runOrangeNpc(npc)) return true; }
    // Stage J4a: Johto story actors (Elm, the west leaders, Kurt, the
    // Sprout Elder, the well Rockets) run their own scenes.
    if (npc.johto) { if (this.runJohtoNpc(npc)) return true; }
    // Stage H4a: Hoenn story actors (Birch, May, Wally, Norman, the
    // west leaders, Cozmo, the two admins) run their own scenes.
    if (npc.hoenn) { if (this.runHoennNpc(npc)) return true; }
    // ADR-025 §2: the Pallet lab Gary is dialogue-only — his lines are
    // tier-variant (the wary set IS his authored dialogue, so a neutral
    // run reads byte-identically to before Phase 5).
    if (npc.name === 'GARY' && !npc.trainer) {
      const lines = bondSceneLines(g.state, 'gary', 'lab');
      if (lines) { g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), null, npc.name); return true; }
    }
    // ADR-025 §5 (Town Tales): tale actors run their stage machine.
    // The handler returns false when the tale is not at a stage this
    // actor serves, and the NPC's normal flow (dialogue, trainer
    // battle, gifts) proceeds untouched — Sabrina's gym battle and the
    // Cerulean witnesses' small talk included.
    if (npc.tale) { if (this.runTaleNpc(npc)) return true; }
    // ADR-025 §2: a beaten gym leader whose Town Tale is complete runs
    // the bond talk (Warm+ gift + tier-variant rematch banter). Placed
    // after the tale hook: Sabrina's tale stages keep first claim on
    // her, and the hook itself declines pre-badge / pre-tale.
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
            if (enRoute.length) g.ui.say(enRoute.slice(), () => landFerry(), '');
            else landFerry();
          });
          return;
        }
        // CINNABAR TRAP FIX (owner report 2026-10-28): a ferry whose def
        // carries ferryGate:'surf' enforces the game's own Surf rule —
        // Soul Badge + a party member that knows Surf, the same pair
        // sysInteract checks at the water's edge. The Pallet FERRYMAN's
        // dialogue always claimed "sea legs — and the badges", but the
        // menu opened for anyone: a fresh player sailed to Cinnabar in
        // the first minutes and had no way home. Return legs carry no
        // gate (CAPT SALT, Cinnabar -> Pallet): NO-SOFT-LOCK LAW —
        // anyone standing on Cinnabar can always sail home.
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
        if (g.state.session.safari) { this.endSafari('You left the Safari Zone.'); return; }
        g.ui.showMenu('Safari Zone: $500 for 500 steps + 30 Safari Balls.', [
          { label: 'Enter ($500)', value: 'yes', disabled: g.state.player.money < 500 },
          { label: 'Not now', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          g.state.player.money -= 500;
          g.state.session.safari = { steps: 500 };
          g.state.bag.safariball = (g.state.bag.safariball || 0) + 30;
          const st = MAPS.safari.start || { x: 10, y: 17 };
          this.loadMap('safari');
          this.player.tx = st.x; this.player.ty = st.y;
          this.player.px = st.x * TILE; this.player.py = st.y * TILE;
          this.player.fx = st.x; this.player.fy = st.y;
          this.trail = [];
          g.state.story.position = { map: 'safari', x: st.x, y: st.y, dir: 'up' };
          this.banner = { text: 'SAFARI ZONE', t: 1.6 };
          g.ui.toast('Safari started: 500 steps, 30 balls!');
        });
      });
      return true;
    }
    if (npc.safariExit) {
      sayLines(() => this.endSafari('You left the Safari Zone.'));
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

  // ---------- Stage O2: Orange story actors ----------
  // One dispatch for every Orange NPC carrying an `orange:` key.
  // Leaders: challenge scene -> real leader battle (the Kanto gym
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
      say(npc.dialogue && npc.dialogue.length ? npc.dialogue : ['The GS Ball is riding with you now. Treat it gently — it has seniority.']);
      return true;
    }

    if (kind === 'stadium-official') {
      if (flags.orange_champion) { say(['Champion. The stadium still talks about that final — walk in like you own the carpet. You do.']); return true; }
      if (oBadges.length < 4) {
        say(['Orange League rules, trainer — the stadium doors open at four island badges.',
          'You hold ' + oBadges.length + ' of the 4. ' + (4 - oBadges.length) + ' to go: the Crew keeps the sea road — Mikan, Navel, Trovita, Kumquat.']);
        return true;
      }
      say(['Four badges. Counted, checked, and gleaming. Drake is waiting on the arena floor, champion — give the islands a final.']);
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
        g.ui.showMenu('Challenge Drake for the Orange League title?', [
          { label: 'Challenge Drake', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startOrangeBattle('drake', (won) => { if (won) this.finishOrangeLeague(); });
        });
      });
      return true;
    }

    // ---- the Orange Crew ----
    const LEADER_BADGE = { cissy: 'coraleyebadge', danny: 'searubybadge', rudy: 'spikeshellbadge', luana: 'jadestarbadge' };
    const POST = {
      cissy: 'The lagoon is calm today. If your aim ever needs a tune-up, my range is your range, Coral-Eye holder.',
      danny: 'The mountain misses you already. It says so in avalanches. Small ones. Friendly ones.',
      rudy: 'Ah, the Spike Shell holder returns! Trovita still hums the rhythm of our battle. My Starmie asks after your team — dancer to dancer.',
      luana: 'Darling! The Jade Star holder, in my resort. Both pairs still talk about that match — Alakazam sulks beautifully about it.',
    };
    if (!LEADER_BADGE[kind]) return false;
    if (oBadges.includes(LEADER_BADGE[kind])) { say([POST[kind]]); return true; }

    if (kind === 'cissy') {
      say(['Welcome to Mikan Gym, challenger. I am Cissy — and on Mikan we do this properly: first my water range, then my team.',
        'Three rings ride the lagoon swell. Call your aim for each one. It is a test of nerve, not a trap — the range is generous, and so am I. Mostly.'], () => {
        g.ui.showMenu('Take Cissy\'s target challenge?', [
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
        'I am Danny. My gym has no door puzzle and no trick floor: the mountain was the challenge, and you are standing on its answer. What is left is the battle — and after it, win or lose, the sled run down is this island\'s oldest ceremony.'], () => {
        g.ui.showMenu('Challenge Danny?', [
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
      say(['Rudy of Trovita. Dancer, romantic, and — ask anyone on this island — a leader who tests before he battles.',
        typeLine], () => {
        const drill = types.length
          ? types.slice(0, 4).map((t) => ({ label: 'Show the ' + t + ' heart of the team', value: t }))
          : [{ label: 'Show your best', value: 'best' }];
        g.ui.showMenu('Rudy\'s type drill — answer his test:', drill, (v) => {
          if (!v) return;
          say(['Yes. That. A type is not a label, it is a promise about how a Pokemon meets the world — and you keep your promises.',
            'Now we dance properly. Battle tempo, challenger — try to keep up with my Starmie. It has never once stood still.'], () => {
            this.startOrangeBattle('rudy', null);
          });
        });
      });
      return true;
    }

    if (kind === 'luana') {
      say(['Luana, of the Kumquat resort gym. My format is famous on four islands, so I will say it plainly, darling:',
        'Mine is a double battle — two pairs, back to back, no rest. Alakazam\'s pair first, then Marowak\'s, with your team carrying every scratch from one into the other. Clear both, and the Jade Star is yours.'], () => {
        g.ui.showMenu('Take Luana\'s two-stage match?', [
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

  // A leader/champion battle in the Kanto gym idiom: the trainer def's
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

  // Drake beaten: the Winner's Trophy (collectible grant), the Orange
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
      'Drake presents the WINNER\'S TROPHY — gold, salt-bright, and heavier than four badges put together. Your team is recorded in the Orange League\'s Hall of Fame.',
      'Orange League — WINNER. The GS Ball rides in your bag, the trophy in your hands, and the whole southern sea behind you.',
    ], () => { checkArcCompletion(g); }, '');
  },

  // ---------- Stage J4a: Johto story actors (west) ----------
  // One dispatch for every NPC carrying a `johto:` key (appended at
  // loadMap from story-johto.mjs JOHTO_NPCS). Leaders ride the shared
  // leader runner (startJohtoBattle = the startOrangeBattle idiom:
  // the trainer def's intro, then a BattleScene whose winTrainer award
  // writes badges.johto + the badge_<root> flag). Elm, Kurt, the
  // Sprout Elder and the well Rockets are state-driven scenes.
  runJohtoNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const jBadges = (st.badges && st.badges.johto) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.johto;
    // Stage J5 badge-order gate (register, J5 addendum): the server
    // validator refuses any save whose badges are not a PREFIX of
    // the earn order (bad-badge-order), but Johto's geography would
    // otherwise let a player earn Fog before Plain, Mineral before
    // Storm, or Glacier before Mineral — a legitimate playthrough
    // producing a save the server rejects. Fixed at the source:
    // every Johto leader's BATTLE (never their scenes or errands)
    // requires the earlier Johto badges. Data-driven from
    // BADGE_SETS.johto — leader index i refuses while the player
    // holds fewer than i Johto badges, naming where the first
    // missing badge's leader waits. Falkner (index 0) is always open.
    const JOHTO_LEADER_WAITS = {
      zephyrbadge: 'Falkner, in Violet City\'s gym',
      hivebadge: 'Bugsy, in Azalea Town\'s gym',
      plainbadge: 'Whitney, in Goldenrod City\'s gym',
      fogbadge: 'Morty, in Ecruteak City\'s gym',
      stormbadge: 'Chuck, in Cianwood City\'s gym',
      mineralbadge: 'Jasmine, in Olivine City\'s gym',
      glacierbadge: 'Pryce, in Mahogany Town\'s gym',
      risingbadge: 'Clair, in Blackthorn City\'s gym',
    };
    const badgeOrderRefusal = (badgeId) => {
      const idx = BADGE_SETS.johto.indexOf(badgeId);
      if (idx <= 0 || jBadges.length >= idx) return null;
      const miss = BADGE_SETS.johto[jBadges.length];
      const missItem = ITEMS[miss];
      return ['The League keeps an order in Johto, challenger, and I keep it with them: the badges are earned in sequence here, first to last.',
        'You are missing the ' + (missItem ? missItem.name : miss) + ' — ' + (JOHTO_LEADER_WAITS[miss] || 'its leader') + ' is where that road goes next. Win that badge first, and I will be here, ready, when you come back.'];
    };

    if (kind === 'daycare') { this.openDaycare(npc); return true; }

    if (kind === 'elm') {
      if (!flags.johto_arrival && !flags.ev_johto_arrival_done) { this.runEvent('ev_johto_arrival'); return true; }
      if (flags.silver_r30_done && !flags.silver_reported) {
        say(['You met him. On Route 30, with the Croconaw — yes. Yes, that is my missing page, walking around with red hair and no intention of apologizing.',
          'A name. You are sure? ...Silver. One of the aides found his practice registration in the hedge by the window — half a card, all the name we need. Silver.',
          'Thank you, {player}. A lab keeps records, and now mine has its page back — the rest of that story is his to write, and I suspect he will write it at you, repeatedly. The road west is yours: Violet first, then Azalea. And when you reach Kurt — remember what you are carrying.'], () => {
          flags.silver_reported = true;
          g.ui.toast('You reported the thief to Elm.');
        });
        return true;
      }
      if (flags.silver_reported) { say(['Silver. The record is complete, and the road is yours, {player}. Violet, Azalea, and Kurt — in that order, the way the wind goes.']); return true; }
      say(['North through Cherrygrove, then Route 30 to Violet, {player}. And eyes open — red hair, no fear. Come back to me with whatever you find.']);
      return true;
    }

    if (kind === 'sprout_elder') {
      if (flags.sprout_tower_done) { say(['The tower sways, and so do we all. Falkner\'s birds are watching the road for you, child.']); return true; }
      say(['You climbed. Slowly, I hope — the tower dislikes being hurried, and so do my knees.',
        'I am Li, keeper of this creaking old prayer. The monks tell me your legs danced on the stairs, and the tower tells me the rest: you bend, traveler. You do not break.',
        'Take these, and an old man\'s ruling with them: Falkner of the Violet Gym now owes you his proper challenge. Tell him the tower said so. It usually sways him.'], () => {
        st.bag.superpotion = (st.bag.superpotion || 0) + 2;
        flags.sprout_tower_done = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Got 2 Super Potions!');
      });
      return true;
    }

    if (kind === 'kurt') {
      // Stage J6: apricorn crafting rides AHEAD of Kurt's story chain
      // (a pending order reports/collects first; a carried apricorn
      // offers the craft menu, whose "Just talk" re-enters this
      // handler with a one-shot session pass so the GS Ball chain
      // below runs byte-identically).
      st.session = st.session || { learnQueue: [] };
      const kStatus = kurtOrderStatus(st);
      if (kStatus.busy) {
        if (kStatus.ready) {
          say(['It is done, {player}. Smell that — fresh shell, warm as bread. One ball at a time, made properly.'], () => {
            const res = kurtCollect(st);
            if (res.ok) { g.audio.playSfx('dex-register'); g.ui.toast('Got the ' + ITEMS[res.ball].name + '!'); }
          });
          return true;
        }
        say(['The ball is on the bench, and the bench does not hurry. Walk about ' + kStatus.remaining + ' more steps out there — the work settles at walking pace, like everything true in this town.']);
        return true;
      }
      if (st.session.kurtTalkOnce) {
        delete st.session.kurtTalkOnce;
      } else {
        const ownedApricorns = APRICORN_IDS.filter((id) => (st.bag[id] || 0) > 0);
        if (ownedApricorns.length) {
          say(['Forty years I have worked Poke Balls by hand, trainer — and my eyes still catch an apricorn in a bag before the bag is even open. You are carrying ripe ones.',
            'One ball at a time — that is the workbench law — and it settles over 250 steps of your walking. Shall I work one for you?'], () => {
            const items = ownedApricorns.map((id) => ({ label: 'Craft: ' + ITEMS[id].name + ' -> ' + ITEMS[APRICORN_TO_BALL[id]].name, value: id }));
            items.push({ label: 'Just talk', value: '__talk' });
            items.push({ label: 'Leave', value: null });
            g.ui.showMenu('Hand Kurt an apricorn?', items, (v) => {
              if (v === '__talk') { st.session.kurtTalkOnce = true; this.runJohtoNpc(npc); return; }
              if (!v) return;
              const res = kurtPlaceOrder(st, v);
              if (res.ok) say(['He takes the ' + ITEMS[v].name + ' in both hands, the way you would take a sleeping bird.', 'Come back after 250 steps of walking, {player}. The ball will be on the bench, and so will I.']);
              else say(['The workbench is busy, trainer. One ball at a time.']);
            });
          });
          return true;
        }
      }
      if (!flags.johto_well_cleared) {
        if (flags.kurt_well_plea) { say(['Still sitting, still useless, still proud — the back has union rules, apparently. The well, trainer. Three Rockets, and Slowpoke who deserve better. My house will keep.']); return true; }
        say(['Mind the well on your way past, trainer. Something down there smells like a market that should not exist. If you find an old man investigating it badly — that will be me, shortly.']); return true; }
      if (!flags.gsball_delivered) {
        if ((st.bag.gsball || 0) > 0) {
          say(['The well is quiet, the Slowpoke are whole, and Azalea can hear itself think again. You did in an hour what my back would not let me do all day, {player}.',
            '...Wait. Wait wait wait. That — in your bag. Gold and silver bands, warm as a held hand. Let me see it. LET me see it.',
            'Forty years I have worked Poke Balls by hand. Forty years, and I have never — feel that? It is not locked. It is not broken. It is WAITING, and no tool I own speaks its language. Even I cannot open this ball, trainer.',
            'But listen. ...There. It hums. It has hummed twice since I took it — both times when the wind came through Ilex Forest, from the old shrine in the trees. Whatever this ball is waiting for, it is waiting THERE. Keep it with me a while. Let an old man study it properly, and when the forest calls, we will both know.'], () => {
            st.bag.gsball = (st.bag.gsball || 0) - 1;
            if (st.bag.gsball <= 0) delete st.bag.gsball;
            flags.gsball_delivered = true;
            flags.kurt_has_ball = true;
            // The ball's whereabouts, recorded precisely in the
            // boolean flag vocabulary (the validator's flag law):
            // the GS Ball is IN KURT'S HOUSE, in his study, until
            // J5's shrine scene moves it.
            flags.gsball_at_kurt_house = true;
            g.audio.playSfx('dex-register');
            g.ui.toast('Kurt is studying the GS Ball.');
          });
          return true;
        }
        say(['The well is quiet, the Slowpoke are whole, and Azalea can hear itself think again. You did in an hour what my back would not let me do all day, {player}.',
          'Hawthorn wrote that you carry a ball no machine can open. Bring it to this house when you can — an old pair of hands would like its turn at being defeated by it.']);
        return true;
      }
      // Stage J5: the ball stirs. Once the tower has woken
      // (beasts_awakened), Kurt's study scene resolves: he returns
      // the ball to the bag and the whereabouts chain moves exactly —
      // kurt_has_ball / gsball_at_kurt_house clear, the ball is back
      // with the player, and the historical gsball_delivered stands.
      if (flags.beasts_awakened && !flags.gsball_back_with_player) {
        say(['You have come at the right hour, {player}. Sit — no. Stand. You will want to be standing for this.',
          'The night the tower woke — and do not ask me how an old man in Azalea knows which night that was, the BALL told me — it began to hum. Not at the Ilex wind, the way it used to. Through it. Like something far away had finally answered, and the answer was a place, and the place was a shrine.',
          'Forty years of craft, and the conclusion of all my study is this: it was never mine to keep, and it is done being studied. Here. Take it back, trainer. Whatever it has been waiting for is awake now — and it is waiting in Ilex Forest, at the old shrine, for the hands that carried it here.'], () => {
          st.bag.gsball = (st.bag.gsball || 0) + 1;
          flags.kurt_has_ball = false;
          flags.gsball_at_kurt_house = false;
          flags.gsball_back_with_player = true;
          if (!st.story.quests.arc_celebi) st.story.quests.arc_celebi = 'discovered';
          g.audio.playSfx('dex-register');
          g.ui.toast('Kurt returned the GS Ball.');
        });
        return true;
      }
      if (flags.gsball_back_with_player && !flags.arc_celebi_done) {
        say(['It is yours again, and louder than ever, I\'ll wager. The shrine in Ilex, {player} — through the forest gate, in the old clearing. Go and let the ball finish its one errand.']);
        return true;
      }
      if (flags.arc_celebi_done) {
        say(['An open ball, an answered forest, and news that walked here faster than you did. Keep the ball, {player}. Some tools a craftsman makes once in a lifetime. That one, nobody made — and now it is a souvenir of the day time itself said hello to Azalea.']);
        return true;
      }
      say(['The ball sits in my study and hums at the Ilex wind. Patience, trainer. Some locks are not picked. They are answered.']);
      return true;
    }

    if (kind === 'rocket_well_1' || kind === 'rocket_well_2' || kind === 'rocket_well_3') {
      const tid = kind;
      if (flags['beat_' + tid]) { say(['...We are leaving. We were ALWAYS leaving. This never happened.']); return true; }
      if (!flags.kurt_well_plea) { say(['Work site, trainer. Authorized personnel, tail division. Come back when you have a uniform — or do not come back at all.']); return true; }
      say([TRAINERS[tid] ? TRAINERS[tid].intro[0] : 'For the boss!'], () => {
        this.startJohtoBattle(tid, (won) => {
          if (!won) return;
          if (flags.beat_rocket_well_1 && flags.beat_rocket_well_2 && flags.beat_rocket_well_3 && !flags.johto_well_cleared) {
            flags.johto_well_cleared = true;
            say(['The last Rocket scrambles up the ladder and does not look back. Below, in the wet dark, the Slowpoke lift their heads one by one — slow, unhurried, already forgetting, which is the kindest thing about them.', 'Somewhere above, a bent old man is about to hear the best news of his year. Kurt\'s house, trainer. And bring what you are carrying — he has waited long enough.'], null, 'NARRATOR');
          }
        });
      }, npc.name);
      return true;
    }

    // ================= Stage J4b: the east actors =================
    if (kind === 'pharmacist') {
      if (flags.amphy_healed) { say(['Amphy\'s light is back over the water — the whole island saw it come on at dusk. That is the best review this pharmacy has ever had, trainer.']); return true; }
      if ((st.bag.secretpotion || 0) > 0) { say(['That potion in your bag is the real article — my own mix, both hands, no shortcuts. Get it across the water to the lighthouse, and do not drop it. Amphy is counting on a steady hand.']); return true; }
      say(['You have the look of an errand that matters. Let me guess — no. Let me KNOW: it is Amphy, isn\'t it. The lighthouse Pokemon, sick these past weeks, and Olivine out of its depth.',
        'This is the Secret Potion. My family\'s recipe, the strong one — we make it for exactly one patient at a time, and today the patient is a lighthouse. Carry it carefully, trainer. Half of Johto\'s ships steer by that light.'], () => {
        st.bag.secretpotion = (st.bag.secretpotion || 0) + 1;
        flags.secret_potion_got = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Got the Secret Potion!');
      });
      return true;
    }

    if (kind === 'jasmine_light') {
      if (flags.amphy_healed) { say(['Look at her. Look at that light — steady, warm, all the way to the horizon. Amphy is well, trainer, and every ship between here and Cianwood knows it tonight because of you.', 'And now I owe you the other thing I promised myself I would give properly: a battle, with nothing held back and nothing weighing on it. My gym, when you are ready. I will be there. So will Steelix.']); return true; }
      if ((st.bag.secretpotion || 0) > 0) {
        say(['That smell — honey and iron and something green. The Cianwood mix. You actually crossed the sea for her. Trainer... thank you. Hold her steady for me. Amphy, love — medicine. The good kind, from across the water.'], () => {
          st.bag.secretpotion = (st.bag.secretpotion || 0) - 1;
          if (st.bag.secretpotion <= 0) delete st.bag.secretpotion;
          flags.amphy_healed = true;
          g.audio.playSfx('heal');
          say(['She drinks. A long, shuddering breath — and then the lamp room does what it has done every dusk for a hundred years, all at once, like a held note finally sounded: the light comes on. Slowly. Then completely. Out past the harbor mouth, three ships sound their horns in answer.', 'Amphy is well. And I... I am free to be a gym leader again, with my whole heart in it. My gym is across the plaza, trainer. Come and take your battle — you have more than earned the queue jumping.'], null, 'JASMINE');
        });
        return true;
      }
      if (!flags.jasmine_asked) {
        say(['Oh — a trainer. Forgive me, I — my name is Jasmine. I keep Olivine\'s gym, most days. These days I keep this room.',
          'This is Amphy. Her light has guided Olivine\'s ships since before I was born, and she is sick — a fever no medicine in this city touches. The pharmacy in Cianwood, across Route 40, makes one thing that might: their Secret Potion. I cannot leave her. The ships cannot wait much longer. Trainer... would you go? For a lighthouse?'], () => { flags.jasmine_asked = true; });
        return true;
      }
      say(['Amphy is holding on. The Cianwood pharmacy, trainer — across the sea road, Route 40. Their Secret Potion is her best hope, and you are its fastest ship.']);
      return true;
    }

    if (kind === 'lance_lake') {
      if (flags.red_gyarados_done) { say(['The lake is quiet — listen to it being quiet. That is our work, trainer. Mahogany next: whatever made this lake scream is buried under that town, and I mean to dig. Meet me there.']); return true; }
      say(['Careful at the water\'s edge, trainer. Something in that lake is in pain, and pain that size does not stay in the lake for long. Whatever you came here to do — do it gently, or do it fast. Ideally both.']);
      return true;
    }

    if (kind === 'lance_mahogany') {
      if (flags.johto_hideout_cleared) { say(['The signal is dead and the lake is calm — I checked from the air at dawn. Team Rocket\'s Johto operation ended in that basement, trainer. What remains is the honest work: Pryce, Blackthorn, and a Conference with your name rising up its bracket.']); return true; }
      if (!flags.red_gyarados_done) { say(['You have the look of a trainer between errands, so let me lend you one: the Lake of Rage, north of here. Something red is tearing it apart, and I do not believe in coincidences with scales. Look into it. Then come back and tell me what the water said.']); return true; }
      say(['You saw the lake. You heard the signal in its screaming. The source is here, {player} — under the souvenir shop, behind the postcards: a transmitter, a power core, and the whole Johto operation of a team that should have stayed beaten.', 'Dragonite and I take the front, through the shop\'s stair. You take everything that moves behind us. Are you ready to go down?'], () => {
        g.ui.showMenu('Enter the Rocket Hideout with Lance?', [
          { label: 'Descend', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
      });
      return true;
    }

    if (kind === 'clair') {
      if (jBadges.includes('risingbadge')) { say(['The Rising Badge sits well on you, {player}. The den chose, the shrine approved, and I — I concur, which the clan will tell you is the rarest of the three. The Conference road is yours. Do not waste it.']); return true; }
      if (flags.clair_beaten) { say(['The gym is settled between us — the DEN is not. North of the town, through the cliff mouth: the Dragon\'s Den, the elder, the old questions, the shrine. The badge waits there, {player}. It has only ever waited there.']); return true; }
      // Stage J5: Clair's battle gates at index 7 like every other
      // leader's (the den award path beyond it is unchanged).
      const clairRefusal = badgeOrderRefusal('risingbadge');
      if (clairRefusal) { say(clairRefusal); return true; }
      const ct = TRAINERS.clair;
      say([ct.intro[0]], () => {
        g.ui.showMenu('Challenge Clair?', [
          { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startJohtoBattle('clair', (won) => {
            if (!won) return;
            flags.clair_beaten = true;
            say(['North, then. The cliff behind this town, the water that runs black and patient — the Dragon\'s Den. The elder will ask you the old questions, and the shrine will ask its own. Pass, and the Rising Badge is yours by the clan\'s law. Fail... and you may try again. Dragons respect persistence almost as much as strength.'], null, 'CLAIR');
          });
        });
      });
      return true;
    }

    if (kind === 'den_elder') {
      if (jBadges.includes('risingbadge')) { say(['The badge rose, the shrine is quiet, and the dragons have a new name to respect, {player}. Walk the Conference road the way you walked this den: like you belong on it. You do.']); return true; }
      if (!flags.clair_beaten) { say(['I am the elder of this den, and this is a place of judgment, not tourism. The test is for those Clair has faced and failed to dismiss — win her gym first, trainer, and then come and be weighed properly.']); return true; }
      // The elder's test: three questions (every answer is heard —
      // the choice law — and the elder's verdict names what the
      // answers showed), then the shrine battle. Win the battle and
      // the Rising Badge is awarded HERE, by the exact leader-award
      // representation (badges.johto push + badge_rising flag) —
      // the badge-count proof: 7 after the gym, 8 after the den.
      say(['So. Clair faced you and could not dismiss you. Then the den will weigh what the gym could not. Three questions, trainer, the old ones. Answer as yourself — the shrine can hear varnish crack.', 'First: a young dragon in your care loses, badly, in front of the whole clan. What do you do?'], () => {
        let honest = 0;
        const ask2 = () => {
          g.ui.showMenu('Second: what makes a dragon strong?', [
            { label: 'A heart that trusts its trainer', value: 'honest' },
            { label: 'Breeding and bloodline', value: 'proud' },
            { label: 'Fear. Theirs, of me', value: 'cruel' },
          ], (v2) => {
            if (v2 === 'honest') honest++;
            say(['Last: your rival stands where you are standing, asking for the badge you came for. What do you hope for them?'], () => {
              g.ui.showMenu('The elder waits.', [
                { label: 'That they pass, and meet me at the top', value: 'honest' },
                { label: 'Nothing. The den decides', value: 'proud' },
                { label: 'That they fail where I did not', value: 'cruel' },
              ], (v3) => {
                if (v3 === 'honest') honest++;
                flags.den_test_done = true;
                const verdict = honest >= 2
                  ? 'Your answers have the shape of the thing itself, trainer. The clan has a word for trainers like you, and it is not a small one.'
                  : 'Your answers are... armored. But armor can be learned out of a person, and the shrine\'s question is the honest one. Let us see which of you shows up to it.';
                say([verdict, 'Now the shrine asks its question. Keeper Sora — the floor is yours.'], () => {
                  this.startJohtoBattle('den_shrine', (won) => {
                    if (!won) return;
                    if (!st.badges.johto.includes('risingbadge')) st.badges.johto.push('risingbadge');
                    flags.badge_rising = true;
                    g.audio.playSfx('badge');
                    say(['It is decided, then — by gym, by word, and by battle, the full measure of the old law.', 'The RISING BADGE is yours, {player}. Eight badges. The whole of Johto, answered. Clair will hear of this before you reach the town — the den has its own ways of telling her. The road north is open now: Route Silver, Silver Town, and the Conference that has been waiting for you since New Bark.'], null, 'DEN ELDER');
                  });
                });
              });
            });
          });
        };
        g.ui.showMenu('The elder waits.', [
          { label: 'Kneel. It lost with me, not for me', value: 'honest' },
          { label: 'Train it harder before dusk', value: 'proud' },
          { label: 'Trade it for a stronger one', value: 'cruel' },
        ], (v1) => { if (v1 === 'honest') honest++; say(['Second question comes the way weather does, trainer — whether you are ready or not.'], ask2, 'DEN ELDER'); });
      });
      return true;
    }

    if (kind === 'silver_gate') {
      if (jBadges.length >= 8) { say(['Eight badges, counted with my own eyes — the pass is yours, Conference trainer. Hald, veteran of this road, at your service. Silver, when you are ready, is in the stadium. So is the young man with the red hair\'s opposite number. Make it a good one.']); return true; }
      say(['Pass Officer Hald — the League keeps me at this end of the road to count, so let me count for you, trainer: ' + jBadges.length + ' of 8 Johto badges in that case.', 'The rule is the rule, and it turns nobody away forever: earn the eight — Blackthorn and the Dragon\'s Den hold the last of it for most — and this road opens like it was built for you. Because by then, trainer, it will have been.']);
      return true;
    }

    if (kind === 'conference') {
      if (flags.johto_complete) { say(['The bracket is archived, the confetti is swept, and your name is in the Conference book in the good ink, trainer. Whatever mountain is next — and there is always a next one — Silver Town was glad to host this chapter.']); return true; }
      if (jBadges.length < 8) { say(['Conference registration, trainer — and I can see by your case that the road is not finished with you yet. Eight Johto badges open this bracket. You hold ' + jBadges.length + '. Blackthorn is the usual last stop. I will keep your page open.']); return true; }
      if (!flags.conference_registered) {
        say(['Eight badges. Counted, verified, and — if I may — well carried, trainer. Let me write your name into the Silver Conference properly... There. Registered.', 'The bracket: two qualifying battles, here in this stadium, then the names you already know are waiting deeper in. Gary is on the far side of the draw. He asked me to tell you the bracket was "finally interesting." His words. Begin when you are ready — speak to me for each qualifier.'], () => {
          flags.conference_registered = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('Registered for the Silver Conference!');
        });
        return true;
      }
      if (!flags.beat_conference_q1) {
        say(['Qualifier one, trainer. Brenna, of the western road — a clean battler with a cleaner record. The floor is yours when you call it.'], () => {
          g.ui.showMenu('Begin qualifier one?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('conference_q1', null); });
        });
        return true;
      }
      if (!flags.beat_conference_q2) {
        say(['One down. Qualifier two: Cato, who has been telling the stands all morning that the draw did him a favour. Correct him, would you?'], () => {
          g.ui.showMenu('Begin qualifier two?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('conference_q2', null); });
        });
        return true;
      }
      if (!flags.beat_gary_johto) { say(['The qualifiers are behind you, and the whole stadium knows what is next. Gary is on the pitch, pretending not to warm up. Go and give these people the match they came for.']); return true; }
      if (!flags.harrison_faced) { say(['Gary is beaten, and the bracket has one name left on your side of it: Harrison, in the quarter-final. He is standing by the pitch with his Houndoom and his good manners. End this Conference properly, trainer.']); return true; }
      say(['The Conference is decided, and decided honestly. The book has it. So does everyone who was here.']);
      return true;
    }

    if (kind === 'gary_stadium') {
      if (flags.johto_complete) { say(['Still here? The Conference is over and you are still the story of it — even Harrison\'s people are telling it your way. Go home, {player}. Pallet first. It is what the road is FOR. Smell ya later — and I mean that warmer than it sounds.']); return true; }
      if (flags.beat_gary_johto) { say(['Beaten, and — fine, I will say it in the open where it costs me: beaten FAIR, by the best version of you there has ever been. Harrison is next, {player}. He is better than his bracket manners suggest. Do not lose to him after beating me. I would never recover, and neither would you.']); return true; }
      if (!flags.conference_registered) { say(['Registration first, {player}. Even I had to sign the book — the official, by the bracket board. Then qualifiers. THEN you may lose to me properly, in order, like tradition demands.']); return true; }
      if (!flags.beat_conference_q2) { say(['Qualifiers first. Brenna, then Cato — the bracket is the bracket, even for the main event. I will be right here, being patient at a professional standard.']); return true; }
      const gt = TRAINERS.gary_johto;
      say(gt.intro.map((l) => l.replace('{player}', st.player.name)), () => {
        g.ui.showMenu('Face Gary — the Silver Conference centrepiece?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.startJohtoBattle('gary_johto', null); });
      }, 'GARY');
      return true;
    }

    if (kind === 'harrison') {
      if (flags.johto_complete) { say(['The Conference book is closed and your name is in it in the good ink, trainer. Whatever either of us does next, this stadium saw the real thing. Travel well. Houndoom and I will be telling this one for years.']); return true; }
      if (!flags.beat_gary_johto) { say(['Harrison, from Littleroot Town. We are on a collision course, you and I — but Gary is your road to me, and the bracket does not bend. Beat him first. I will be here, and I will be ready either way.']); return true; }
      // The quarter-final (mechanism recorded at his trainer def):
      // a real full-strength battle, fought FRIENDLY — the predicate
      // is FACED, not won. Win or lose, the branch-true honours play,
      // johto_complete is set, and the Foundation machine itself
      // fires (checkArcCompletion — ARC COMPLETE card, regionsDone,
      // the pinned Hoenn directive; nothing here writes regionsDone).
      say(['So it is us. Gary is beaten — I watched it from the tunnel, and I will carry that match with me whatever happens here.', 'Quarter-final rules, trainer, and Conference stakes. Give me everything you gave him. Houndoom and I did not cross the bracket for less.'], () => {
        g.ui.showMenu('The quarter-final — face Harrison?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const ht = bondTrainerVariant(g.state, TRAINERS.harrison);
          g.scenes.push(new BattleScene({
            kind: 'trainer', trainer: ht, returnTo: this, rt: rtOf(g), friendly: true,
            onEnd: (won, fled) => {
              if (fled) return;
              recordBattleBond(g.state, ht.id, won, fled);
              flags.harrison_faced = true;
              if (won) flags.harrison_won = true; else flags.harrison_lost = true;
              const lines = won ? [
                '...Well. WELL. The card says your name, trainer — the judges did not even deliberate. An upset, the papers will call it. It was not an upset. I was there. It was a better team, on a bigger day.',
                'Take the semi-final road with my respect — you have beaten the two best trainers in this bracket back to back, and one of them is standing here applauding. The Conference is yours in every way that history checks.',
              ] : [
                '...It is decided. The final exchange — Houndoom endures, the crowd comes up off its seats like a tide, and the judges\' card, when it turns, says Harrison.',
                'Do not hang your head. DO NOT. You beat Gary Oak in this stadium, you carried eight badges across a region that tests everything, and you took me to the last Pokemon I own. The loss stands — that is sport. So does everything you did to get here — that is history.',
                'Gary is in the tunnel, trainer. Even he is applauding. Especially him, though he will deny the especially.',
              ];
              say(lines, () => {
                flags.johto_complete = true;
                g.audio.playSfx('badge');
                say(['Silver Conference — the run ends in honours, and Johto ends with it: eight badges, a rivalry settled, a lake calmed, a tower retaken, and a Conference that will be argued about in Silver Town for a decade. The road home is waiting, trainer. It always was.'], () => { checkArcCompletion(g); }, 'NARRATOR');
              }, 'HARRISON');
            },
          }));
        });
      });
      return true;
    }

    if (kind === 'red') {
      if (!flags.johto_complete) { say(['...'], null, 'RED'); return true; }
      if (flags.red_defeated) {
        say(['...!', '...'], () => {
          g.ui.showMenu('Battle Red again?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('red', null); });
        }, 'RED');
        return true;
      }
      say(['...'], () => {
        this.startJohtoBattle('red', (won) => {
          if (!won) return;
          flags.red_defeated = true;
          say(['...!!', 'He tips his cap — once, the way a mountain might bow — and turns back to the snow and the silence, satisfied in a way that has nothing to do with winning. Some names are not beaten, exactly. They are answered. His was.'], null, 'RED');
        });
      }, 'RED');
      return true;
    }

    // ---- Stage J5: legendary witnesses, elders, and the stairs ----
    // The beast chases' sign-steps. Each beast has TWO witnesses in
    // order: the first reports the passing and points to the second;
    // the second points to the lair. A witness only files their
    // report after beasts_awakened, and the second only after the
    // first (a trail reads from the beginning) — the flags they set
    // are the arc steps' flags.
    const BEAST_SIGNS = {
      beast_sign_raikou_1: { arc: 'arc_raikou', sign: 'arc_raikou_sign1', prev: null, toast: 'Raikou\'s trail: a storm-split pine on Route 35. It went east.',
        dormant: ['Storms I can read. That one last week, I could not. It came out of a clear sky, struck the old pine twice — and here is the part my report left out: the second bolt had already happened when the first one\'s thunder arrived. Backwards weather. I have stopped writing that down where supervisors can see it.'],
        lines: ['There — see the pine? Black on the east side, and the grass around it combed FLAT, all one way, like something enormous stood here letting the storm off its back in waves.',
          'I was up the pole when it happened, trainer. The lightning came twice, and between the flashes something stood in the road looking at the tree — four legs, a mane like a storm deciding to be hair, and fast the way ideas are fast. It did not flee. It departed. There is a difference, and my hands knew it before I did.',
          'It went east, toward the park road. Thunder that hunts, hunts open ground — if you are following it, the National Park is where I would stand and wait to be found.'],
        again: ['The pine is still black, the grass still combed. East, trainer — the National Park\'s open ground, when the air starts standing up on your arms.'],
        after: ['They say the park\'s storm has a keeper now, and the keeper has a trainer. My reports have gone back to being very dull, and I have never been happier to file one.'] },
      beast_sign_raikou_2: { arc: 'arc_raikou', sign: 'arc_raikou_sign2', prev: 'arc_raikou_sign1', toast: 'Raikou\'s trail ends at the National Park\'s storm field.',
        tooEarly: ['The meadow stones, you mean? Scorch marks shaped almost like writing. Something passed here, certainly — but if you want the start of the trail it is west: Route 35, the storm-split pine, and a watcher named Iben who saw more of it than I did. Trails, like sentences, read best from the beginning.'],
        lines: ['Look at the stones — no. LOOK at them. Scorch in spirals, and at the centre of every spiral, a print. A pawprint, trainer, burned into meadow stone like a signature pressed into sealing wax.',
          'Whatever signed this meadow was not passing through. It was announcing. East of here the land opens out — the National Park, all that flat green under all that sky. A creature made of storm does not hide in woods and alleys. It waits in the open, daring the weather to argue.'],
        again: ['The stones keep their signature. The park, trainer — open ground, when your hair starts to rise.'],
        after: ['I heard the thunder over the park stop all at once, like a sentence finishing. Rangers talk, trainer. Congratulations — the meadow stones make sense now: it was practising its autograph.'] },
      beast_sign_entei_1: { arc: 'arc_entei', sign: 'arc_entei_sign1', prev: null, toast: 'Entei\'s trail: warm pawprints in the Burned Tower\'s ash. It went toward heat.',
        dormant: ['One hundred and fifty years of ash, and my whole duty is to keep it unstepped-in. Something died in this tower, trainer, and something else has been keeping the grief warm ever since. I sweep around the prints. That is all I will say while the basement sleeps.'],
        lines: ['You have been below — I can tell; everyone who has wears the same quiet for a day. Then look, and do not step: the ash by the north wall. Prints. Enormous, fresh, and warm to the back of the hand, in a tower that has been cold since before my grandfather\'s grandfather.',
          'The monks\' old books say the fire-beast walks out of this ash when it walks at all, and goes where the earth itself is hot. Mortar, trainer. The mountain east of us has a furnace in it that no one dug. Whatever was reborn in fire will go home to heat eventually.'],
        again: ['Prints in the ash, pointing east. Mt. Mortar, trainer — follow the warmth.'],
        after: ['The ash is cold this morning — truly cold, for the first time in my tenure. The tower feels... finished with something. Whatever you did on that mountain, monk\'s honour: the old tower thanks you.'] },
      beast_sign_entei_2: { arc: 'arc_entei', sign: 'arc_entei_sign2', prev: 'arc_entei_sign1', toast: 'Entei\'s trail ends in Mt. Mortar\'s deep chamber.',
        tooEarly: ['You feel it too? The warm draught from the upper halls. Master says it is geology. Master also says I imagine the smell of woodsmoke. Start where the prints are, trainer — the Burned Tower in Ecruteak keeps an ashkeeper who reads ash the way you read a map.'],
        lines: ['Shh — feel the floor. There. Again. The mountain has a heartbeat, and it is not mine. It started the week the tower in Ecruteak woke; Master doubled our training and tripled his pretending not to notice.',
          'Twice now I have seen the steam burst UP the chimney vents with nothing cooking below, and once — once — I heard a sound come down the shafts like a furnace clearing its throat. Whatever is using the deep chamber has a volcano\'s manners. Go carefully, trainer. The upper halls, and mind the heat.'],
        again: ['The heartbeat is still there, under the floor. The deep chamber, trainer — upper halls, and mind the heat.'],
        after: ['The mountain is quiet. Not cold — quiet, the way a dojo is quiet after the last bow. Master has started admitting he noticed things. Progress on every front, then.'] },
      beast_sign_suicune_1: { arc: 'arc_suicune', sign: 'arc_suicune_sign1', prev: null, toast: 'Suicune was seen at the Bell Tower\'s foot. The wardens say it comes for the last time when its kin are quiet.',
        dormant: ['I wind the tower bells and polish what the wind leaves. On certain mornings the big bell is wet — WET, trainer — though the night was dry as paper. The last keeper wrote it in the log for forty years and never once explained it. Keepers do not explain. We record.'],
        lines: ['Then you are the one the logbook has been waiting for, because I am recording it now: three mornings since the tower woke, I have come at dawn and found it standing at the Bell Tower\'s foot. Still as a held breath. Ribbons moving in a wind that was not blowing anything else.',
          'It did not run from me. It does not run, the old texts say — it arrives, when the water of the world needs carrying somewhere. The texts also say it will not come to the tower for the last time until its kin are quiet. The thunder and the fire first, trainer. Then, the tower\'s foot, at dawn.'],
        again: ['Dawn, the tower\'s foot — but only when the others are quiet. It keeps its own order, that one.'],
        after: ['This morning the big bell was dry, and the tower felt ordinary, and ordinary has never felt so much like a gift. The logbook has your name in it now, trainer. Keepers record. That is the highest honour we have.'] },
      beast_sign_suicune_2: { arc: 'arc_suicune', sign: 'arc_suicune_sign2', prev: 'arc_suicune_sign1', toast: 'Suicune\'s route ends at the Bell Tower\'s foot.',
        tooEarly: ['Fishers notice water, trainer — it is most of the job. If it is the clear-running water you are asking after, start in Ecruteak. The bell wardens keep a log of strange mornings, and lately every morning in it is strange.'],
        lines: ['You see this shore? The northernmost rocks of Cianwood, where the inlet runs muddy nine days in ten. Last week it ran CLEAR — clear as a poured glass, all the way out to the second buoy — and a shape went along the waterline faster than the current, not swimming, not flying. Walking on the skin of the sea like it was a road it owned.',
          'My grandmother had a word for water that cleans itself as it goes, and the word was a name, and I am not saying it out loud where the gulls can steal it. But the Ecruteak wardens will. It was travelling, trainer, settling its route. Where it ends, they say, is a tower — when the time is right.'],
        again: ['The inlet has gone back to muddy, which almost disappoints me. The tower in Ecruteak, trainer — its foot, at dawn, when the others are quiet.'],
        after: ['The harbourmaster asked me why the fish have been calm all week. I told him the water signed a treaty. He laughed. Let him — you and I know what walked the shoreline.'] },
    };
    const BS = BEAST_SIGNS[kind];
    if (BS) {
      if (!flags.beasts_awakened) { say(BS.dormant); return true; }
      if (flags[BS.arc + '_done']) { say(BS.after); return true; }
      if (flags[BS.sign]) { say(BS.again); return true; }
      if (BS.prev && !flags[BS.prev]) { say(BS.tooEarly); return true; }
      say(BS.lines, () => {
        flags[BS.sign] = true;
        if (BS.prev && st.story.quests[BS.arc] !== 'complete') st.story.quests[BS.arc] = 'active';
        g.ui.toast(BS.toast);
      });
      return true;
    }

    if (kind === 'hooh_elder') {
      if (flags.hooh_history) {
        if (flags.hooh_bell_received) { say(['The bell, the summit, the dawn. Go, trainer — the sky has waited a hundred and fifty years for somebody specific, and my money is on the shape of your shadow.']); return true; }
        if (flags.arc_raikou_done && flags.arc_entei_done && flags.arc_suicune_done) { say(['The beasts are quiet and the sisters are waiting, {player}. The dance theatre, across town — ask for the eldest dance, and mind your manners: they are older than they look, and so is their gift.']); return true; }
        say(['The history you have; the bell you have not, and the bell waits on the beasts. Quiet the thunder, the fire, and the north wind first, {player} — then the sisters. The tower keeps its order, and so do I.']);
        return true;
      }
      say(['You ask an old man about towers, in Ecruteak, in this year of all years. Walk with me — my knees teach better than my chair does.',
        'A hundred and fifty years ago this town kept two towers, so that whichever way the great bird came over the hills there would be bells beneath it. The bells were never alarms, child. They were doorbells. Then lightning — ordinary, stupid, indifferent lightning — took the western tower, and three Pokemon who slept in its basement died in a fire no one could outrun.',
        'And the bird came back. That is the part the histories whisper: it came down through the smoke and it CALLED — and the three who died stood up out of the ash and ran, remade: one into thunder, one into the mountain\'s fire, one into the north wind itself. Then it circled the new tower once, and it has been waiting ever since — not for worship. For a heart it could trust with what it protects.',
        'You saw it, didn\'t you. On the road, in the morning, most likely — it likes to look at candidates before candidates know there is a test. The sisters at the dance theatre keep its bell. When the three it raised are quiet, ask them. And climb at dawn. Everything about that bird happens at dawn.'], () => {
        flags.hooh_history = true;
        if (!st.story.quests.arc_hooh) st.story.quests.arc_hooh = 'discovered';
        g.ui.toast('Elder Gensai told you the tower\'s history.');
      });
      return true;
    }

    if (kind === 'kimono_bell') {
      if (flags.hooh_bell_received) { say(['The bell is lighter than it looks, isn\'t it. Crystal should be heavy. It is not, because it was never really ours — we were only ever its shelf. The summit, trainer. At dawn. Dance attendance is not required, but it is tradition to bow to the sky.']); return true; }
      if (!flags.hooh_history) { say(['You have come about the bell — do not look surprised; the theatre hears everything the tower hears, and the tower hears the town think. But the order of things matters here, trainer: the history first. Elder Gensai walks the east street by the towers most days. Let him tell you about the fire, and the three, and the waiting. Then we will talk about what we keep.']); return true; }
      if (!(flags.arc_raikou_done && flags.arc_entei_done && flags.arc_suicune_done)) { say(['We know about the waking — the theatre\'s floor hummed the night it happened, and three of our dances have been restless ever since. The bell we keep is for the bird, trainer, and the bird will not be called while the three it raised are still abroad and unsettled. Quiet Raikou. Quiet Entei. Let Suicune finish its errand last, the way it likes. Then come back to us, and bring your best listening.']); return true; }
      say(['Then it is time. Sisters — the eldest dance. The one we perform when the tower\'s guest is finally expected.',
        'They dance it without music, and the silence is the music: five women becoming weather, becoming wings, becoming a tower standing and a tower remembered — and at the dance\'s still centre, Moeko lifts a box of pale cedar and opens it on a bell of clear crystal, cold as well-water, older than the theatre, older than the town\'s second skyline.',
        'The Clear Bell. It has been rung exactly never, trainer. Bells like this are not rung — they are ANSWERED. Take it to the summit at dawn, and hold it where the sky can see it. If the heart is right, the sky will do the rest. It usually does, with hearts like yours.'], () => {
        st.bag.clearbell = (st.bag.clearbell || 0) + 1;
        flags.hooh_bell_received = true;
        if (st.story.quests.arc_hooh !== 'complete') st.story.quests.arc_hooh = 'active';
        g.audio.playSfx('dex-register');
        g.ui.toast('Received the Clear Bell!');
      });
      return true;
    }

    if (kind === 'hideout_stairs') {
      if (!flags.red_gyarados_done) { say(['Storage, trainer — postcards, keyrings, forty cases of commemorative spoons. Nothing down those stairs but stock and spiders, and the spiders pay no rent. Move along and browse the mugs.']); return true; }
      if (flags.johto_hideout_cleared) {
        say(['The basement is quiet again — stock, spiders, and a fine set of empty cages we keep as a warning to future inventory. Have a look if you like; you have earned the tour.'], () => {
          g.ui.showMenu('Take the shop stairs down?', [
            { label: 'Go down', value: 'yes' }, { label: 'Stay up here', value: 'no' },
          ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
        });
        return true;
      }
      say(['You are with the dragon man? Then you already know what my "storage" really is. The stairs are behind the counter, trainer, and whatever is making my stock vibrate is at the bottom of them. Go — and come back with my shop quiet again.'], () => {
        g.ui.showMenu('Take the shop stairs down?', [
          { label: 'Go down', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
      });
      return true;
    }

    // ---- the west leaders ----
    const LEADERS = {
      falkner: { badge: 'zephyrbadge', gate: 'sprout_tower_done',
        gateLines: ['Not yet, challenger. On this side of Johto we do it in order: Sprout Tower first — the climb, the monks, the Elder\'s blessing. My gym is the second half of the test, and I will not rob you of the first.'],
        post: 'The tower sways, the gulls turn, and Violet is quiet below us. Any time your team wants the sky again, challenger, my gym is its address.' },
      bugsy: { badge: 'hivebadge', gate: null, gateLines: [],
        post: 'The webs are re-strung and the forest is humming again. You are welcome under these trees any time, Hive Badge holder.' },
      whitney: { badge: 'plainbadge', gate: null, gateLines: [],
        post: 'No crying this time — I practiced! Come back for a rematch whenever, Plain Badge holder. Miltank asks about your team by name now. By NAME.' },
      morty: { badge: 'fogbadge', gate: null, gateLines: [],
        post: 'The fog keeps its counsel and so do I. Walk carefully in it, Fog Badge holder — it has decided you are interesting.' },
      // Stage J4b east leaders on the same runner: Jasmine's battle
      // story-gate is the potion delivery (amphy_healed), and Pryce's
      // is the hideout (canon order — the occupation ends first).
      // Stage J5 adds the badge-order gate ahead of both (see
      // badgeOrderRefusal): Storm (4) must precede Mineral (5) and
      // Glacier (6) may not precede either — the J4b note's
      // either-order freedom survives only where the prefix law
      // allows it (Chuck before Jasmine was already prefix-true).
      chuck: { badge: 'stormbadge', gate: null, gateLines: [],
        post: 'Any time the sea brings you back, Storm Badge holder, my gym is its loudest address. Bring your hands — and your appetite. My wife insists on feeding challengers who survive me.' },
      jasmine: { badge: 'mineralbadge', gate: 'amphy_healed',
        gateLines: ['I am sorry — truly. I cannot battle while Amphy is sick. A leader who fights with her heart in a lighthouse lamp room is no leader at all, and my Steelix deserves better from me. The light first, trainer. Please. The light first.'],
        post: 'Amphy\'s light and your Mineral Badge, trainer — Olivine shines twice tonight. Come back for a rematch whenever the harbor looks quiet. It so rarely is, and I so rarely mind.' },
      pryce: { badge: 'glacierbadge', gate: 'johto_hideout_cleared',
        gateLines: ['Not yet, challenger. My town is sitting on a Rocket nest, my lake is screaming, and an old man does not hand out badges over an occupation. Clear what is under the souvenir shop — Lance is in town, and the lake road is north. Then come back, and winter will receive you properly.'],
        post: 'The lake is calm, the town is ours, and the Glacier Badge is where it belongs — with the warm-hearted. Winter remembers you kindly, trainer. That is rarer than the badge.' },
    };
    const L = LEADERS[kind];
    if (!L) return false;
    if (jBadges.includes(L.badge)) {
      if (kind === 'morty' && flags.beasts_awakened) {
        say(['So. You have seen the empty plinths too, and the one who watched you from the lamplight\'s edge. Hear the names the tower-keepers use, {player}: Raikou, the thunder that walks. Entei, the mountain that burns. And Suicune, the north wind made visible — the one whose eyes you met.',
          'They slept as statues for a hundred and fifty years, under a promise nobody wrote down. Promises end. What woke them, I cannot tell you — but they will cross your road again, all three, and when they do, remember: they are not angry. They are AWAKE. There is a difference, and it matters.']);
        return true;
      }
      say([L.post]); return true;
    }
    // Stage J5: the badge-order gate composes ahead of each leader's
    // own story gate (the League's order is the outer law; Sprout
    // Tower / Amphy / the hideout keep their inner gates untouched).
    const orderRefusal = badgeOrderRefusal(L.badge);
    if (orderRefusal) { say(orderRefusal); return true; }
    if (L.gate && !flags[L.gate]) { say(L.gateLines); return true; }
    if (kind === 'morty' && !flags.beasts_awakened) {
      say(['Morty of Ecruteak. Before we battle, a keeper\'s courtesy: the Burned Tower stands open in the west of town, and its basement has been... restless. Look into it, trainer. A leader likes to know what his challengers have seen. Then come back, and we will see each other clearly.']);
      return true;
    }
    if (kind === 'morty' && flags.beasts_awakened) {
      say(['You have been below the tower. I can see the ash on you — not on your clothes, {player}. On the way you hold still.',
        'Then you know what I know: the statues are gone, and something with eyes like deep water is abroad in Johto. We will speak of it properly after. First — the Fog Badge has been waiting for a challenger the fog respects.'], () => {
        g.ui.showMenu('Challenge Morty?', [
          { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.startJohtoBattle('morty', null); });
      });
      return true;
    }
    const t0 = TRAINERS[kind];
    say([t0.intro[0]], () => {
      g.ui.showMenu('Challenge ' + t0.name + '?', [
        { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
      ], (v) => { if (v === 'yes') this.startJohtoBattle(kind, null); });
    });
    return true;
  },

  // The shared leader runner, Johto seat (startOrangeBattle's idiom):
  // the def's intro has already played in the handler above for the
  // menu leaders, so this goes straight to the BattleScene; winTrainer
  // writes the badge itself. onWin(won) fires from the battle's onEnd.
  startJohtoBattle(trainerId, onWin) {
    const g = this.game;
    const t0 = TRAINERS[trainerId];
    if (!t0) { if (onWin) onWin(false); return; }
    const t = bondTrainerVariant(g.state, t0);
    g.scenes.push(new BattleScene({
      kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
      onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (onWin) onWin(!!won && !fled); },
    }));
  },

  // ---------- Stage H4a: Hoenn story actors ----------
  // One dispatch for every NPC carrying a `hoenn:` key (appended at
  // loadMap from story-hoenn.mjs HOENN_NPCS). Leaders ride the shared
  // leader runner (startHoennBattle = the startJohtoBattle idiom:
  // winTrainer's award writes badges.hoenn + the badge_<root> flag),
  // behind the same badge-order gate Johto's leaders carry (the
  // validator's prefix law, data-driven from BADGE_SETS.hoenn).
  // Birch, May, Wally, Norman, Cozmo and the admins are state-driven
  // scenes. H4b extends this dispatch at the marked seam.
  runHoennNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const hBadges = (st.badges && st.badges.hoenn) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.hoenn;
    const HOENN_LEADER_WAITS = {
      stonebadge: 'Roxanne, in Rustboro City\'s gym',
      knucklebadge: 'Brawly, in Dewford Town\'s gym',
      dynamobadge: 'Wattson, in Mauville City\'s gym',
      heatbadge: 'Flannery, in Lavaridge Town\'s gym',
      balancebadge: 'Norman, in Petalburg City\'s gym',
      featherbadge: 'Winona, in Fortree City\'s gym',
      mindbadge: 'Tate and Liza, in Mossdeep City\'s gym',
      rainbadge: 'Juan, in Sootopolis City\'s gym',
    };
    const badgeOrderRefusal = (badgeId) => {
      const idx = BADGE_SETS.hoenn.indexOf(badgeId);
      if (idx <= 0 || hBadges.length >= idx) return null;
      const miss = BADGE_SETS.hoenn[hBadges.length];
      const missItem = ITEMS[miss];
      return ['The League keeps an order in Hoenn, challenger, and I keep it with them: the badges are earned in sequence here, west to east.',
        'You are missing the ' + (missItem ? missItem.name : miss) + ' — ' + (HOENN_LEADER_WAITS[miss] || 'its leader') + ' is where that road goes next. Win that badge first, and I will be here, ready, when you come back.'];
    };

    if (kind === 'birch') {
      if (!flags.hoenn_arrival && !flags.ev_hoenn_arrival_done) { this.runEvent('ev_hoenn_arrival'); return true; }
      if (flags.chimney_clash_done) { say(['Star-stone fed to a crater, and the sky argued about it in two colors. My instruments have been restless ever since, {player}. Whatever those teams are waking, it is older than both of them — and the Weather Institute up Route 119 reads this region\'s sky for a living. If anyone can name what is coming, they can.']); return true; }
      if (flags.meteor_falls_done) { say(['Cozmo wrote me a letter with shaking handwriting, {player}. A stolen meteorite and two teams with flags — that is not fieldwork anymore, that is a forecast. Keep your eyes on the sky as much as the road. Hoenn\'s weather has opinions this year.']); return true; }
      say(['Registered, welcomed, and only slightly mauled by the local wildlife — a complete Hoenn arrival, {player}. Petalburg first, then Rustboro. And if a Poochyena ever corners me again, I am retiring to study sedimentary rock. Indoors.']);
      return true;
    }

    if (kind === 'may_littleroot') {
      if (!flags.may_met) {
        say(['You are the trainer who rescued Dad? He tells it with sound effects now. I am May — I live two doors down and I am going to win a contest ribbon before you win a badge, so... no pressure on either of us.', 'Gyms are your road. Halls are mine. But roads cross, {player} — Slateport has a hall, and so do Verdanturf and Fallarbor. Come and sit in my world sometime. I will sit in yours at Rustboro and try not to grade your footwork. Much.'], () => { flags.may_met = true; });
        return true;
      }
      say(['Slateport, Verdanturf, Fallarbor — that is my road, in order. Yours has more volcanoes. I checked. See you in a hall, {player} — bring your loudest polite applause.']);
      return true;
    }

    const mayContest = (hall, gateBadge, doneFlag, ribbonFlag, preLines, beatLines, postLines) => {
      if (flags[doneFlag]) { say(postLines); return true; }
      if (!hBadges.includes(gateBadge)) { say(preLines); return true; }
      say(beatLines, () => {
        flags[doneFlag] = true;
        if (ribbonFlag) flags[ribbonFlag] = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('May\'s contest: ' + hall + ' — noted in your Quest Log.');
      });
      return true;
    };
    if (kind === 'may_contest_slateport') {
      return mayContest('Slateport', 'knucklebadge', 'may_slateport_done', null,
        ['Too early, {player} — the hall wants a coordinator with sea legs, and I want one more badge\'s worth of road behind me before I face that crowd. Dewford first. Then watch me.'],
        ['You came. You actually — okay. Okay! Watch this, then. From the top, just like practice.', '...The hall lights are a different country, {player}. My appeal landed, my timing held, and the Slateport judges still gave the ribbon to a coordinator with six years on me — by half a point. HALF. I am not crying about it. I am taking notes about it. There is a difference, and the difference is Verdanturf.'],
        ['Half a point, {player}. I have replayed it so many times the judges have started appearing in my dreams to apologize. Verdanturf is next, and I am not losing that one in the last round. I have decided.']);
    }
    if (kind === 'may_contest_verdanturf') {
      return mayContest('Verdanturf', 'dynamobadge', 'may_verdanturf_done', 'may_ribbon_verdanturf',
        ['Verdanturf is the serious hall, {player} — small room, sharp judges. I am not stepping in there until Mauville is behind you and my new appeal is behind ME. Wattson first. Then this.'],
        ['Small room. Sharp judges. New appeal. Deep breath... and — YES. Yes! Did you see the last round? The whole hall stood up, {player}, the whole hall!', 'My first ribbon. Verdanturf. It is going on the case exactly like this, dust and all, so I remember what earning one feels like. Your road taught me something, you know: you do not wait to feel ready. You enter, and readiness catches up. Fallarbor next. Their crowd is harsher. So am I, now.'],
        ['Verdanturf, {player}. First ribbon. I still take it out of the case sometimes just to check it is real. It is. Fallarbor is next — ash, hard judges, harder applause. Perfect.']);
    }
    if (kind === 'may_contest_fallarbor') {
      return mayContest('Fallarbor', 'heatbadge', 'may_fallarbor_done', 'may_ribbon_fallarbor',
        ['Fallarbor judges have seen everything twice and applauded once, {player}. I picked this hall on purpose — but not before Lavaridge. Flannery first. A coordinator keeps her order too.'],
        ['Ash on the windows, silence like a held breath — and then the last appeal landed and the whole room came up out of its seats like startled birds. FALLARBOR, {player}! They applauded. THIS crowd applauded!', 'Two ribbons. Slateport taught me the half point, Verdanturf taught me the entry, and Fallarbor — Fallarbor taught me the room is mine if I walk in like it is. Lilycove is the last hall on my road. When your road bends east, come and see how this story ends.'],
        ['Two ribbons, {player}, and the hardest room in Hoenn stood up for the second one. Lilycove remains — the last hall, out east where your gym road is going anyway. See you there.']);
    }

    if (kind === 'wally') {
      if (!flags.wally_helped) {
        say(['Oh — excuse me. You are a trainer, aren\'t you? I can tell. Everyone here can always tell, and I — I am Wally. I am moving away soon, to Verdanturf, for my health. The air, the doctors say.', 'I asked my family for a Pokemon of my own before we go, and they said yes, if — if I could catch one. Me. The pond grass past the gym has Ralts in it sometimes. I have a ball, and a borrowed Zigzagoon from my neighbor, and hands that shake at exactly the wrong moments. Would you... walk with me? Just to the grass. Just so the shaking is not the loudest thing there.'], () => {
          say(['The grass shivers. A Ralts — small, horned, already turning away — and the borrowed Zigzagoon looks back once, waiting to be believed in.', 'You did it. YOU DID IT — no, wait. WE did it. Ralts, I — thank you. Thank you for not running. I will take care of you. I will learn how, I promise, I will learn everything.', 'I have a Pokemon. I HAVE a Pokemon, {player}. When I am stronger — when we are both stronger — our road is going to cross yours again, and I am not going to be the boy who needed help standing in the grass. Remember my name for then. Wally. Remember it kindly.'], () => {
            flags.wally_helped = true;
            flags.wally_ralts = true;
            g.audio.playSfx('dex-register');
            g.ui.toast('Wally caught a Ralts!');
          }, 'WALLY');
        });
        return true;
      }
      say(['Ralts is learning my moods faster than my doctors ever did, {player}. Verdanturf soon — the air there, and my uncle\'s house, and a whole new road. When it crosses yours again, I will not be hard to recognize. I will be the one who is ready.']);
      return true;
    }

    if (kind === 'norman') {
      if (!flags.norman_met) {
        say(['Norman. I keep this gym, and the road to it: four badges stand between a challenger and my door, by the League\'s order and by my own judgment.', 'You have the look of a road that ends here eventually, {player}. Walk it honestly. When you stand in this room with four badges, I will not be a formality — I will be the wall the first half of Hoenn was building toward. Go and earn the meeting.'], () => { flags.norman_met = true; });
        return true;
      }
      if (hBadges.includes('balancebadge')) { say(['Balance, held — by the trainer I deferred in this room, which remains my favourite sentence of the year. East now, {player}: the rain road, the sea, the deep. Keep standing honestly.']); return true; }
      if (hBadges.length < 4) {
        say(['The road is counting, {player}: ' + hBadges.length + ' of the four badges my door asks for. Rustboro, Dewford, Mauville, Lavaridge — in that order, earned honestly. I will be here. Balance keeps.']);
        return true;
      }
      // H4b: four badges held — the deferred meeting pays off.
      // Norman falls through to the shared leader runner below
      // (LEADERS.norman carries his entry).
    }

    if (kind === 'cozmo') {
      if (!flags.meteor_falls_done) { say(['Mind the spray, mind the ledges, and mind any scarves — red OR blue — that you meet in my cave, trainer. The meteorites here fell before there were teams to want them. I intend them to outlast the wanting.']); return true; }
      say(['Gone to a crater, my finest stone, and the mountain spat the plan back out — for now. Teams like that do not retire, {player}; they relocate. A weather station, a shrine, a cavern under the sea. Hoenn is old machinery all the way down, and both crews are collectors.']);
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
      return mayContest('Lilycove', 'featherbadge', 'may_lilycove_done', 'may_ribbon_lilycove',
        ['Lilycove is the last hall, {player} — and the biggest. I am not walking into it until the Feather Badge is yours and the sea road is behind us both. Winona first. Then watch me finish this.'],
        ['Harbour lights, a full house, and my whole road in one appeal set... and the last card turned MY way, {player}. LILYCOVE. Three ribbons. Slateport\'s half point is IN this one — I spent it here, on the biggest floor in Hoenn, and it was worth every fraction.', 'One thing remains, and it is not in a hall like the others. The Grand Festival. Coordinators from the whole region, one stage, invitations earned in ribbon cases like mine. Mine just qualified. When your road lets you, harbourside — I will tell you the rest where the boats can hear it.'],
        ['Three ribbons, {player}, and a Festival invitation with my name spelled right. Harbourside, when you are ready — the ending of my road is a boat ride and a promise.']);
    }
    if (kind === 'may_festival') {
      if (flags.may_festival_done) { say(['The Festival is behind me and the whole sea road is ahead, {player}. Whatever hall is next — and there is always a next one — it gets the coordinator Lilycove made. Wish your road the same: endings that are also doors.']); return true; }
      if (!flags.may_lilycove_done) { say(['You found me rehearsing, {player}. The Lilycove hall first — a coordinator keeps her order too. Three ribbons, then this conversation, in that sequence.']); return true; }
      say(['Here it is, then — the end of my road, said out loud where the boats can hear it. The Grand Festival committee read my case this morning: Slateport\'s schooling, Verdanturf, Fallarbor, Lilycove. The invitation is real, {player}. I am sailing for the Festival at the next tide.', 'You sat in my world at every hall on this coast. So hear the last of it as my guest, not my audience: whatever the Festival decides, this road was mine, I walked it at full stretch, and I am not afraid of its ending. That is what your gyms taught me, by the way. Do not tell the judges.', 'Four ribbons ride in my case now — the Festival\'s own commendation makes the set, whatever the big stage decides. Go and finish YOUR road, {player}. Ever Grande is lit. I will be cheering loud enough to grade the echo.'], () => {
        flags.may_festival_done = true;
        flags.may_grand_festival_done = true;
        flags.may_ribbon_grandfestival = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('May departed for the Grand Festival — four ribbons in her case.');
      });
      return true;
    }

    if (kind === 'steven') {
      if (!hBadges.includes('mindbadge')) { say(['Steven Stone. I collect rare stones, rarer battles, and — lately — weather reports I do not enjoy. The twins keep this city\'s gym, trainer. What I teach is for Mind Badge holders only: the deep road is not a shortcut, and it does not forgive tourists.']); return true; }
      if (flags.dive_taught || this.partyKnowsDive()) { say(['The trenches are open to you now, {player}. Remember what the deep is: not a place that hates you — a place that has never once needed you. Surface whenever you choose; the way up asks nothing. That is the whole ethic of diving, and of most worthwhile roads.']); return true; }
      say(['Steven Stone — and you hold the Mind Badge, which makes this your lesson to claim. Dive: the field craft of descending at the dark-water spots the old charts mark, trenches off Routes 124, 126, 127, 128, and one very private lake in Sootopolis. It is knowledge, not a battle move — it will ride in your partner\'s field craft, the way the old HM teachings are kept, and it will never take a battle slot.', 'Choose the partner who learns it. Choose a strong swimmer at heart; the deep can tell.'], () => {
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
          g.ui.say([displayName(mon, SPECIES) + ' learned Dive!', 'Mind the gate the League keeps on it: badge and knowledge, both, or the trench refuses you — by name, so you always know what is missing. The way UP asks nothing. Ever. Surface spots are doors that only open outward.'], null, 'STEVEN');
        });
      });
      return true;
    }

    if (kind === 'liza_flavor') {
      if (hBadges.includes('mindbadge')) { say(['Two minds, one gym, one badge — given. Tate is replaying your second battle in his head and losing it more slowly each time. That is his way of applauding.']); return true; }
      if (flags.beat_tate) { say(['My half is next, challenger. Tate was the introduction. I am the argument. Speak to him when you are ready to begin again — we keep our order, even mid-lesson.']); return true; }
      say(['Tate opens, I close, and the gym is the conversation between us. He is waiting, challenger — left half first.']);
      return true;
    }
    if (kind === 'tate_liza') {
      if (hBadges.includes('mindbadge')) { say(['The Mind Badge, held — the pair\'s whole lesson, learned. The deep road is yours now, challenger. Steven\'s house, by the shore. Tell him the twins sent their best student.']); return true; }
      const orderRefusal = badgeOrderRefusal('mindbadge');
      if (orderRefusal) { say(orderRefusal); return true; }
      // The pair, staged back to back (the recorded adaptation at
      // their trainer defs): Tate's battle, then — on a win only —
      // Liza's, which carries the badge. Losing to Liza leaves
      // beat_tate standing; the pair re-runs in order.
      const challengeLiza = () => {
        const lt = TRAINERS.liza;
        say([lt.intro[0]], () => {
          g.ui.showMenu('Face Liza — the second half?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startHoennBattle('liza', null); });
        }, 'LIZA');
      };
      if (flags.beat_tate) { challengeLiza(); return true; }
      const tt = TRAINERS.tate;
      say([tt.intro[0]], () => {
        g.ui.showMenu('Face Tate — the first half?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startHoennBattle('tate', (won) => { if (won) challengeLiza(); });
        });
      }, 'TATE');
      return true;
    }

    if (kind === 'wally_final') {
      if (flags.wally_final_done) { say(['Right behind you, forever, one road back and closing, {player}. That was always the promise. The doors are yours — walk through them like the whole of Hoenn is watching. It is. I checked. I am some of it.']); return true; }
      if (!hBadges.includes('rainbadge')) { say(['You — here? No. Not yet, {player}. Not before Sootopolis, not before the last badge. I waited a whole region for this battle to mean the whole region. Earn the full road first. Then find me where the victories are kept. I will be standing in it.']); return true; }
      const wt = TRAINERS.wally_final;
      say([wt.intro[0].replace('{player}', st.player.name)], () => {
        g.ui.showMenu('Face Wally — Victory Road?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startHoennBattle('wally_final', (won) => { if (won) flags.wally_final_done = true; });
        });
      }, 'WALLY');
      return true;
    }

    if (kind === 'lucario_keeper') {
      // The Lucario special (chronology-mapping.md, Chapter 6 —
      // "Rise Through Hoenn": Lucario and the Mystery of Mew is
      // listed among Hoenn's special story events, so it stages
      // IN-ARC, here). Original writing; the Tree of Beginning beat
      // is abstracted to our fiction — a great-tree root chamber in
      // Petalburg Woods and an aura that walked like a friend.
      // Honest limit, recorded: Lucario is a Sinnoh-dex species
      // (Arc 4's horizon), so no Lucario battle or catch is staged
      // or faked here; the event is the aura-legend beat itself.
      if (flags.lucario_event_done) { say(['The tree keeps its counsel and its flowers, {player}. Some meetings are not battles, and some friends are not caught. They are recognised. Walk well — something in the wood is walking well because you stopped here.']); return true; }
      say(['You feel it too, then. Everyone with a kind team does, eventually, in this part of the wood. Sit a moment, trainer. The old tree is telling its story again, and it tells it in aura, not words — I only translate.', 'Long ago — the keepers\' count says before the gyms, before the League — a guardian walked these woods whose aura burned the blue of deep water. No ball ever held it. No trainer ever commanded it. It came when the tree was threatened, it fought like weather, and it stayed, afterward, the way a friend stays: without being asked twice.', 'The time-flowers still open along the roots when a worthy aura passes. Look — along the north root. Opening. For YOUR team, trainer, the way the stories say they opened for the guardian\'s friend, all those centuries ago. Whatever road that aura walked next... the flowers think yours rhymes with it.', 'Take that with you. Not a badge, not a ribbon — a recognition. The wood remembers a lucario-hearted guardian, and today it decided your team walks in the same light. Somewhere far north, in a region of mountains and snow, that story has a second half. But its first half happened HERE, in Hoenn\'s green dark, and now you are in it.'], () => {
        flags.lucario_event_done = true;
        flags.lucario_aura_seen = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('The aura flowers opened — the Lucario legend, witnessed in Hoenn.');
      });
      return true;
    }

    if (kind === 'origin_keeper') {
      if (flags.climax_resolved) { say(['The cave is quiet, the lake is a lake again, and the sky over my city has gone back to arguing in private, the way weather should. You pointed UP, trainer, when pointing was the hardest work in the world. Sootopolis remembers.']); return true; }
      if (flags.standoff_seen) {
        say(['You have seen them, then — the two old answers, glaring across my city\'s water. The cave behind me is where their argument was first carved, and carving is all it can do now. The ANSWER is not down here, trainer. It never was.', 'It is UP. East of Pacifidlog, where the charts go polite and vague, a pillar stands that the sky built for its own guardian. Climb it. Wake what sleeps at its top. And when the green light comes down — be somewhere the whole region can see you standing. It matters that someone stood.'], () => { flags.origin_guidance = true; });
        return true;
      }
      if (flags.climax_drought || flags.climax_deluge) { say(['The cave mouth is weeping steam, trainer, and the old carvings are too hot — or too drowned — to read. Whatever has woken, the answer to it is not in this cave. It is ABOVE. Remember that when the city needs it: above.']); return true; }
      say(['I keep the Cave of Origin — the first argument, carved in stone, between the land that rose and the sea that covered it. The carvings are quiet today, trainer. Keep them that way, if the road ever gives you the choice.']);
      return true;
    }

    if (kind === 'hoenn_conference') {
      if (flags.hoenn_complete) { say(['The bracket is archived, the confetti is swept, and your name is in the Ever Grande book in the good ink, trainer. A man named Scott has been asking after you by name, which at a Conference means exactly what you hope it means.']); return true; }
      if (hBadges.length < 8) { say(['Conference registration, trainer — and your case is not finished yet. Eight Hoenn badges open this bracket; you hold ' + hBadges.length + '. Sootopolis is the usual last stop, and it is reached from below. I will keep your page open.']); return true; }
      if (!flags.climax_resolved) { say(['Eight badges — counted, verified, well carried. And yet I cannot open the bracket while the sky itself is undecided, trainer. Finish the region\'s weather first. The Conference will be here; it has waited through worse than a titan or two. Well. Comparable.']); return true; }
      if (!flags.hoenn_conference_registered) {
        say(['Eight badges, a quiet sky, and a name the harbour has been carrying for weeks. Let me write you into the Ever Grande Conference properly... There. Registered.', 'The bracket: two preliminary battles, here in this hall — then Morrison, who has been telling the stands you are his favourite problem — then the final. Tyson waits at the end of it, with a Meowth that has never smiled at anyone. Begin when you are ready: speak to me for each preliminary.'], () => {
          flags.hoenn_conference_registered = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('Registered for the Ever Grande Conference!');
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
      if (flags.hoenn_complete) { say(['Front row, finals, my best friend in one and my favourite defeat in the other. Best week of my life, {player}, and I came SECOND-to-last in it. Imagine how the rest of my year feels. Go — Scott has been pacing the harbour steps with an envelope and a grin.']); return true; }
      if (flags.beat_morrison) { say(['Beaten, fairly, in a semi-final I will be dining out on for years. Tyson, {player}. The final. His Meowth has never smiled at ANYONE. Make it the second-most interesting thing about your day.']); return true; }
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
      if (flags.hoenn_complete) { say(['The book is closed and your name is in it in the good ink, trainer. Whatever either of us does next, this hall saw the real thing. Travel well. Meowth and I will be telling this one for years — Meowth is already telling it, to the harbour, at volume.']); return true; }
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
      say(['So it is us. Morrison is beaten — I watched it from the tunnel, front-row ticket courtesy of my friend\'s enormous heart, and I will carry that match whatever happens here.', 'Final rules, trainer, and Conference stakes. Give me everything you gave him. Meowth and I did not cross this bracket for less.'], () => {
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
                '...Well. WELL. The card may argue with the papers, trainer, but I was ON the floor: you out-played me, exchange for exchange, in a final. An upset, they will call it in the harbour. It was not an upset. I was there. It was a better team on the biggest day Hoenn has.',
                'Take the honours road with my respect — you beat everyone this bracket owns, back to back, and the last of them is standing here applauding. Whatever the book says, this hall knows what it saw.',
              ] : [
                '...It is decided. The final exchange — Meowth endures by a whisker and a promise, the crowd comes up off its seats like a tide, and the judges\' card, when it turns, says Tyson. By the narrowest margin this hall has ever recorded.',
                'Do not hang your head. DO NOT. You carried eight badges across a region that was ending its own weather, you calmed two titans and a sky, and you took me to the last Pokemon I own. The loss stands — that is sport. So does everything you did to get here — that is history. Morrison is on his feet. The whole hall is. Look at them, trainer. That sound is yours.',
              ];
              say(lines, () => {
                say(['Trainer. TYSON\'s trainer — and everyone still standing. My name is Scott. I scout battle the way other men scout weather, and I have watched every match you fought in this hall with an envelope in my pocket getting heavier by the round.', 'Inside it: an invitation. Seven facilities, seven Frontier Brains, one island off Kanto where battle is the whole civilisation. The Battle Frontier, trainer. When you have rested — when HOME has had you back a while — that envelope is your next horizon. Bring the team you trust most. The Frontier does not care where you have been. Only how you fight.'], () => {
                  flags.scott_invitation = true;
                  flags.hoenn_complete = true;
                  g.audio.playSfx('badge');
                  say(['Ever Grande Conference — the run ends in honours, and Hoenn ends with it: eight badges, two titans calmed, a sky handed back its weather, and a final that will be argued about in Lilycove harbour for a decade. The road home is waiting, trainer. It always was.'], () => { checkArcCompletion(g); }, 'NARRATOR');
                }, 'SCOTT');
              }, 'TYSON');
            },
          }));
        });
      });
      return true;
    }

    if (kind === 'scott') {
      if (flags.hoenn_complete) { say(['The envelope is delivered and the scouting is done — my favourite kind of day. Home first, trainer: Pallet Town, your mother\'s cooking, a professor with questions. The Frontier keeps. It has waited this long; it can wait for you to be rested. That, too, is strategy.']); return true; }
      say(['Scott. I scout battle — facilities, frontiers, trainers worth an envelope. I am not saying you are carrying one of my envelopes in your future, trainer. I am saying I bought the envelope. Finish your Conference. We will talk at the end of it.']);
      return true;
    }

    // ---- the west leaders ----
    const LEADERS = {
      roxanne: { badge: 'stonebadge', gate: null, gateLines: [],
        post: 'The quarry road north runs past Meteor Falls, challenger. The stone up there fell out of the sky — Roxanne\'s professional opinion is that it should be admired, not argued over. Mind who else admires it.' },
      brawly: { badge: 'knucklebadge', gate: null, gateLines: [],
        post: 'The boatman runs Dewford to Slateport whenever the tide allows, Knuckle Badge holder. May\'s world is showing in the hall there — a surf man recommends the seats. The view is all footwork.' },
      wattson: { badge: 'dynamobadge', gate: null, gateLines: [],
        post: 'Wahahaha! Still sparking, Dynamo Badge holder! The Verdanturf hall is west through the tunnel road, and the volcano road is north — an old electrician recommends the volcano second and the hall first. Order matters in wiring AND journeys!' },
      flannery: { badge: 'heatbadge', gate: null, gateLines: [],
        post: 'The springs are that way, Heat Badge holder, and you have earned every degree of them. Fallarbor lies past the ash fields north — take a breath before you go in. The air up there is half mountain already.' },
      norman: { badge: 'balancebadge', gate: null, gateLines: [],
        post: 'Balance, held. East now, Balance Badge holder: the rain road to Fortree, then the sea itself. The Institute on Route 119 has gone quiet on the radio, they say. Nothing in Hoenn stays quiet for long this year.' },
      winona: { badge: 'featherbadge', gate: null, gateLines: [],
        post: 'The Feather Badge suits you, challenger — light, and earned at altitude. Lilycove is east: a harbour, a hall, and a mountain of the dead beyond it. The sky sends its regards to all three.' },
      juan: { badge: 'rainbadge', gate: 'climax_resolved', gateLines: ['Ah — the challenger who surfaced in my lake. I know your road, and I know the sky above it is not finished arguing. My gym is the last QUIET water in Hoenn, challenger, and I will not conduct its final while the region\'s weather is still deciding the score. End the titans\' argument first. Then come and take the Rain Badge from a finished world.'],
        post: 'Eight badges, Rain Badge holder, and a region breathing evenly again. Ever Grande, challenger. The Conference is lit, and I shall be in the stands with the whole of Sootopolis, conducting nothing at all. A holiday.' },
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

  // The shared leader runner, Hoenn seat (startJohtoBattle's idiom).
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
  // --- H4b: runHoennNpc east actors + the climax/Institute/Pyre/
  // hideout/Seafloor scenes extend the dispatch above ---

  endSafari(msg) {
    const g = this.game;
    g.state.session.safari = null;
    // AUDIT FIX (C241): unspent Safari Balls used to vanish silently —
    // the exit text now says what happened to them.
    const left = g.state.bag.safariball || 0;
    g.state.bag.safariball = 0;
    g.ui.say(left > 0 ? [msg, '(The park keeps the ' + left + ' unused Safari Balls.)'] : [msg], () => {
      const st = MAPS.fuchsia.start || { x: 10, y: 10 };
      this.loadMap('fuchsia');
      this.player.tx = st.x; this.player.ty = st.y;
      this.player.px = st.x * TILE; this.player.py = st.y * TILE;
      this.player.fx = st.x; this.player.fy = st.y;
      this.trail = [];
      g.state.story.position = { map: 'fuchsia', x: st.x, y: st.y, dir: 'down' };
      this.banner = { text: 'FUCHSIA CITY', t: 1.6 };
      g.audio.playMusic(this.map.music || 'route1-theme');
    });
  },

  // ---------- Town Tales (ADR-025 §5) ----------
  // The stage machine + payouts are pure (data/quests.mjs); everything
  // below is presentation: dialogue, menus, and the tales' one battle
  // each at most. Battles are friendly spars / wild chases with no
  // stakes (the Cerulean kid is the exception — a real trainer battle
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

    // ---- Stage J4a: Johto tales (data-driven lines) ----
    // The six west tales carry their dialogue in their defs
    // (story-johto.mjs JOHTO_TALES: offerLines / stageLines /
    // finishLines), so one generic branch serves them all through the
    // shipped stage machine: giver accepts -> stage actor advances ->
    // giver finishes (finishWith pays the def's reward + bond).
    {
      const jt = QUESTS[id];
      if (jt && (jt.johtoTale || jt.hoennTale)) {
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

    // ---- Pallet: Mom's Care Package ----
    if (id === 'tale_pallet') {
      if (npc.name === 'MOM') {
        if (stage < 0) { say(['Oh! Before you run off again — a favor, love.', 'I have a package for the Viridian shopkeeper: maps, tea, and a letter too long for any Pidgey. Carry it north for me?', 'The Quest Log has it now. Reward? Three Potions and a mother\'s undying smugness.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The shopkeeper is in Viridian City, love — south end of town, green apron, strong opinions.']); return true; }
        if (stage === 1) { finishWith(['A receipt! With her handwriting and everything.', 'You know, I drew the first street maps of this town as a girl — chalk on a barn door, because paper cost money.', 'She still sells copies in that shop. Half the trainers in Kanto are navigating by my handwriting, and not one of them knows it.', 'Three Potions, as promised. Come home sometimes, {player}.']); return true; }
        // ADR-025 §2: Mom's send-offs warm up by tier; milestone talks
        // are one-shot bond sources (a mother's pride, authored beats).
        let pipDir = 0;
        if (st.badges.kanto.length >= 4) { const r = applyBondOnce(st, 'bondsrc_mom_badges', 'mom', 1); if (r && r.dir) pipDir = r.dir; }
        if (st.story.flags.champion) { const r = applyBondOnce(st, 'bondsrc_mom_champion', 'mom', 1); if (r && r.dir) pipDir = r.dir; }
        if (pipDir) g.ui.queueBondPip(pipDir);
        say(bondSceneLines(st, 'mom', 'sendoff') || ['My maps, her shop, your road. That is how a town stays stitched together, love.']); return true;
      }
      if (npc.name === 'SHOPKEEPER') {
        if (stage === 0) { say(['A package from Pallet? Let me see — maps, tea, and a letter the size of a phone book.', 'That is her handwriting on the maps, you know. Still the best-drawn charts on my shelf.', 'Here — a stamped receipt. Take it back to her, and tell her the tea shelf misses her.'], () => advanceTale(st, id)); return true; }
        if (stage === 1) { say(['Receipt is yours already, trainer. Pallet is straight south — mind the grass.']); return true; }
        return false;
      }
    }

    // ---- Viridian: The Retired Ace ----
    if (id === 'tale_viridian') {
      if (stage < 0) { say(['You walk like a trainer. Good. An old man can use one.', 'Sixty years ago I lost a keepsake in the Viridian Forest — a tortoise charm, carved by my late wife. The grass on Route 2 keeps it still, I think.', 'Find it, and choose honestly: bring it back to me, or keep it. Either way it ends with a trainer. That is all a charm wants.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Route 2, the deep grass. Face a likely patch and search it, the way we did before itemfinders.']); return true; }
      if (stage === 1) {
        say(['You have her look about you. Show me your hands, trainer.'], () => {
          g.ui.showMenu('The Tortoise Charm. What do you do?', [
            { label: 'Return it to Ace Marlow', value: 'return' },
            { label: 'Keep it', value: 'keep' },
          ], (v) => {
            if (v === 'return') {
              st.story.flags.tale_viridian_returned = true;
              finishWith(['...You found it. You actually— ha. HA! Look at that carving. Sixty years, and the grass kept it gentle.', 'No — do not argue. It goes with you. A charm that is found twice has chosen twice.', 'I was the first trainer ever to challenge the Viridian Gym, before there was a League to write it down. My tortoise outlived three gyms and every rival I had.', 'Let it outlive a few of yours, too. That is a Warm feeling, trainer. Warm.'], { bondDelta: 2 });
            } else {
              finishWith(['Keeping it, then. Ha! Sixty years in the grass and it picks a bold one.', 'I was the first trainer ever to challenge the Viridian Gym, you know. My tortoise outlived three gyms and every rival I had.', 'A charm chooses its trainer, in the end. It seems it has. Walk tall, keeper.'], { bondDelta: 0 });
            }
          });
        });
        return true;
      }
      say([st.story.flags.tale_viridian_returned ? 'The charm rides with you, and my thanks with it. Warm travels, trainer.' : 'Bold heart, soft hands. The charm chose well enough.']); return true;
    }

    // ---- Pewter: Brock's Day Off ----
    if (id === 'tale_pewter') {
      if (npc.name === 'CURATOR') {
        if (stage < 0) { say(['Psst — trainer. Brock has not had a day off since the museum roof leaked, and that was two winters ago.', 'Cover my desk quiz for the visitors — three questions, all from the exhibits — then spar his Geodude so he can call it exercise and clock out.', 'The Iron Acorn is yours if you pull it off. It has been our paperweight for a decade; it deserves adventure.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { this.taleQuizPewter(npc); return true; }
        if (stage === 1) { say(['Quiz covered! Brock is in the square, pretending not to be off duty. His Geodude is already judging you.']); return true; }
        say(['The museum hums along, and Brock actually smiled at a fossil today. Miracles, catalogued.']); return true;
      }
      if (npc.name === 'BROCK') {
        if (stage === 1) {
          say(['Day off. Allegedly. The Curator says you are my exercise plan.', 'One Geodude, no badges on the line, no crowd. Just rock and honest work.'], () => {
            g.ui.showMenu('Spar with Brock\'s Geodude (Lv 12)?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              this.taleSpar('geodude', 12, () => {
                finishWith(['Solid. You read a Rock type like a book you have already finished.', 'Here — the Iron Acorn. The museum\'s oldest paperweight, and harder than my whole team\'s heads.', 'Secret, trainer to trainer: this city\'s gym was built out of the museum\'s own stone. The museum came first. Leaders here have been part-time curators ever since — I pay the fossil lab out of gym winnings, and I would do it on my day off, too.']);
              }, () => say(['Geodude takes the round. He is smug about it in three languages of rock.', 'Shake it off — a day off has room for a rematch.']));
            });
          });
          return true;
        }
        return false; // Brock's own lines (off-duty color) otherwise
      }
    }

    // ---- Cerulean: The Stolen Bike Bell ----
    if (id === 'tale_cerulean') {
      if (npc.name === 'TESS') {
        if (stage < 0) { say(['My bike bell is GONE. Brass, loud, and older than the gym — somebody lifted it right off my handlebars.', 'Three people saw something: Wren by the grass, Orin east, and the Fan near the gym. Ask them. Please.', 'The bell is Cerulean history. And my TM11 is yours if it comes home — BubbleBeam, the real one.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          const n = [1, 2, 3].filter((w) => st.story.flags['tale_cerulean_w' + w]).length;
          say(['Witnesses heard from: ' + n + ' of 3. Wren, Orin, the Fan — Cerulean is small; somebody saw that bell.']); return true;
        }
        if (stage === 1) { say(['The cape, north end of town. Whoever has my bell is done running.']); return true; }
        say(['It rings again! Half of Cerulean heard it and pretended not to be emotional.']); return true;
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
              this.taleSay(['Three stories, one direction: the cape, at the north end of Cerulean. The culprit is cornered — go and be kind, or be quick.'], 'TESS');
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
              const earn = () => finishWith(['...My little brother\'s bike has no bell. Cars do not hear him. I just wanted him LOUD, you know?', 'Take it. Take it back to Tess. Tell her — tell her the cape kid is sorry, and her bell is the loudest good thing in Cerulean.', 'It rang first on the first bike ever ridden over Nugget Bridge, she told the whole street once. Gym was a bike shop then. I stole a piece of history to fix a Tuesday.', 'Misty will hear the whole story by supper. Everybody tells Misty everything. That is somehow worse than losing.']);
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

    // ---- Vermilion: Fan Club Founder ----
    if (id === 'tale_vermilion') {
      if (npc.name === 'CHAIRMAN') {
        if (stage < 0) { say(['You have the look of a listener, and I am a man with a LOSS to describe at length.', 'Our founder\'s notebooks — fifty years of tides, teams, and terrible puns — were left at the S.S. Anne dock. The Anne has them, or the harbor does.', 'Bring them home and the Tide Pearl is yours. The founder kept it for "a trainer who fetches paper in a storm of small talk."'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say([st.story.flags.stanne_done ? 'The Anne has sailed — but nothing leaves this harbor unrecorded. Ask the Harbormaster, east end of the dock.' : 'The dock, trainer! South edge of town, where the gulls hold their own fan club.']); return true; }
        if (stage === 1) { finishWith(['THE NOTEBOOKS. Intact! Slightly gull-kissed, but intact!', 'Listen to this, from the first page: "Vermilion had no harbor when I charted these tides. Three sailors and a dream. The Fan Club is just those sailors, arguing forever."', 'Even Lt. Surge learned this bay from these pages. He respects the founder like weather — you do not argue, you dress for it.', 'The Tide Pearl, as promised. It has heard fifty years of harbor stories and tells none of them.']); return true; }
        say(['The notebooks rest in the clubhouse, and the club endures. My Rapidash, meanwhile — did I tell you about its coat?']); return true;
      }
      if (npc.name === 'HARBORMASTER') {
        if (stage === 0 && st.story.flags.stanne_done) { say(['Lost property? Aye — when the Anne cast off, a oilskin bundle came off her dock cart. Notebooks. Tide tables. Puns.', 'Harbor keeps what the sea gives back. Take them to the Chairman, and tell him the harbor charges one (1) thank-you.'], () => advanceTale(st, id)); return true; }
        return false;
      }
    }

    // ---- Lavender: Names on the Wall ----
    if (id === 'tale_lavender') {
      if (npc.name === 'VOLUNTEER') {
        if (stage < 0) { say(['Oh — a trainer with gentle hands, I hope. The tower\'s west stones are losing their names.', 'Take my ledger into Pokemon Tower and record the unnamed graves before the carving goes smooth. Then find Elder Bram — he remembers what the stones cannot.', 'Mr. Fuji keeps a Spectre Bell for whoever tends the tower\'s forgotten. It should be carried by someone kind.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The west gravestones, in the tower. Read them aloud as you write — the tower likes to hear its names.']); return true; }
        if (stage === 1) { say(['The ledger is filling in beautifully. Elder Bram waits in the east of town — ask him about the Marowak.']); return true; }
        say(['Every name on that wall is a door somebody can knock on again. Thank you.']); return true;
      }
      if (npc.name === 'ELDER BRAM') {
        if (stage === 1) {
          finishWith(['So. The ledger-keeper comes to hear about the Marowak.', 'She was no legend, child. She was a mother, in a tower full of thieves, and she put herself between them and her baby with her whole heart. The little one got away. She did not.', 'The channelers say a mother\'s love does not leave a place just because her body did. If the tower is restless on your climb — well. You did not hear a strategy from me. There is none in this. Only a story.', 'Take the Spectre Bell. Mr. Fuji will want to know the names are written down — that man has carried this town\'s grief longer than I have carried mine.']);
          return true;
        }
        return false;
      }
    }

    // ---- Celadon: Roof Garden ----
    if (id === 'tale_celadon') {
      const badges = st.badges.kanto.length;
      if (stage < 0) { say(['You are looking at Celadon\'s best-kept height: the Game Corner roof garden, Erika\'s own.', 'It wants three waterings this season — and the garden keeps gym hours, in its way: the second visit wants a trainer with 4 badges, the third, 6. Plants respect a journey.', 'Finish the season and the Gardenia Sash is yours. Erika sewed it herself, so water like you mean it.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Watering one — there you go. Slow circles, no splashing the marigolds; they hold grudges.', 'One bed drinks for the whole roof when a journey is young. Come back at 4 badges for the second round.'], () => advanceTale(st, id)); return true; }
      if (stage === 1) {
        if (badges >= 4) { say(['Four badges! The vines noticed before I did. Watering two — mind the hanging bed, it drinks like a Snorlax.', 'One more round, at 6 badges, and the season is yours.'], () => advanceTale(st, id)); return true; }
        say(['The garden is still sipping its first watering, trainer. Second round opens at 4 badges — you hold ' + badges + '. The plants are patient. Be like the plants.']); return true;
      }
      if (stage === 2) {
        if (badges < 6) { say(['Last watering waits for a 6-badge trainer — you hold ' + badges + '. The roof is not going anywhere, and neither is the view.']); return true; }
        say(['Six badges — the whole roof stands up straighter. Final watering, and then—', '—MEOWTH! That is the third time this week, you little toll collector! Chase it off, trainer!'], () => {
          this.taleSpar('meowth', 18, () => {
            finishWith(['Gone! Over the parapet like it pays rent elsewhere. The garden is safe, the season is COMPLETE, and somewhere a Meowth is telling this story very differently.', 'The Gardenia Sash — Erika\'s own stitching. Wear it knowing this: this garden grows over Celadon\'s first gym, a wooden hall where the Game Corner now glitters.', 'Erika\'s grandmother planted the first bed so the city\'s green would always stand taller than its neon. You have kept it standing, trainer.']);
          }, () => say(['It slipped past you — all tail and opinions. The plants are unharmed; come back and chase it properly.']));
        });
        return true;
      }
      say(['The roof blooms on, season after season. Erika asks after you — gardeners notice who waters.']); return true;
    }

    // ---- Saffron: Two Gyms, One City ----
    if (id === 'tale_saffron') {
      if (npc.name === 'MASTER KO') {
        if (stage < 0) { say(['You stand in the Fighting Dojo, and we have a problem older than you.', 'Once a year this hall sends one message across the street, and once a year SHE sends one back. This year the messenger is... you. Take our word to Sabrina.', 'No fighting required, unless pride gets involved. Pride always gets involved.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['Sabrina, in her gym across the street. Deliver it standing straight — she respects posture and punctuality, in that order.']); return true; }
        if (stage === 1) { say(['You carry our word still. Deliver it; then choose your thanks with open eyes.']); return true; }
        if (stage === 2 && !st.story.flags.tale_saffron_iou) {
          say(['So the Dojo\'s thanks it is. One spar, my best student\'s partner, honest rules. XP is the prize and pride is the tax.'], () => {
            g.ui.showMenu('Spar at the Dojo?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              const lvl = Math.max(12, sparLevelFor(st));
              this.taleSpar('machop', lvl, () => {
                finishWith(['Enough! The hall remembers that one.', 'Tell Sabrina her school\'s strength is still only half the story — and hear the rest from her, since a message deserves an answer.', 'One school, this was. Her father and I split it over what strength is FOR. You have carried messages between us longer in a day than we managed in twenty years.']);
              }, () => say(['The student takes it. The Dojo does not mock a loss — it schedules the rematch. Come again.']));
            });
          });
          return true;
        }
        if (stage === 2) { say(['Your thanks waits across the street, written in Sabrina\'s hand. Collect it after her badge — her rules, and for once, I agree with them.']); return true; }
        say(['The hall is quieter this year. Messages do that.']); return true;
      }
      if (npc.name === 'SABRINA') {
        if (stage === 0) {
          say(['A message from across the street. I knew its words before you climbed my stairs — that is not why I let you carry it.', 'It says: "The hall stands." Every year, the same two words. Every year, I answer: "So does the Gym." That is the whole war, trainer. Two buildings, refusing to fall down first.'], () => {
            advanceTale(st, id);
            this.taleSay(['Now choose your thanks, messenger — in my hall, choices are also messages.'], 'SABRINA');
          });
          return true;
        }
        if (stage === 1) {
          say(['The rivalry is witnessed. Choose, messenger.'], () => {
            g.ui.showMenu('Your thanks?', [
              { label: 'The Dojo spar (XP)', value: 'spar' },
              { label: 'Sabrina\'s keepsake IOU (after her badge)', value: 'iou' },
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
            finishWith(['The badge suits you. And an IOU in my hand is a door opening.', 'Your keepsake, messenger — chosen by the only rule that matters: the one you did not already carry. May it arrive exactly when it is needed. It usually does, with me.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon. Thank you for not dropping it.'], { keepsake: pick });
          } else {
            finishWith(['Every keepsake in Kanto already rides with you — there is nothing left in my keeping you lack. The IOU pays in candy, then: three XP Candies, and my genuine surprise.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon.'], { items: { xpcandy: 3 } });
          }
          return true;
        }
        return false; // Sabrina's gym flow (battle / post-badge lines) otherwise
      }
    }

    // ---- Fuchsia: The Warden's Teeth ----
    if (id === 'tale_fuchsia') {
      if (npc.name === 'SAFARI WARDEN') {
        if (stage < 0) { say(['Mind the marsh on your way in, trainer — it took something of mine.', 'Not my teeth, before you grin. My FISHING LURE. Carved it the year I arrived; the entrance marsh swallowed it this morning, right inside the gate.', 'Fetch it home and there are ten Safari Balls in it for you. A lure that old deserves a story with a trainer in it.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          // The marsh is INSIDE the Safari Zone, and this same NPC is
          // the gate: decline so his safariGate flow opens the park
          // (his own dialogue line there points at the entrance marsh).
          return false;
        }
        if (stage === 1) {
          say(['That shine — that is IT. That is the lure!', 'Feel the weight of it. Carved the year the marsh fed all of Fuchsia, before fences, gates, or tickets. Koga\'s grandfather taught me to fish with this very piece of wood.'], () => {
            this.taleSay(['Uncle Warden! You found it — Father will want to hear the marsh gave it back. Thank you, trainer. From both of us.'], 'JANINE', () => {
              const beforeK = bondOf(st, 'koga');
              completeTale(st, id);
              const dK = Math.sign(bondOf(st, 'koga') - beforeK);
              if (dK) g.ui.queueBondPip(dK);
              this.taleSay(['Ten Safari Balls, as promised — and Janine\'s thanks, which in this family is legal tender. Go on, then. The marsh is behaving today.'], 'SAFARI WARDEN');
            });
          });
          return true;
        }
        // Complete: decline — the Warden is the Safari gate, and his
        // gate (and his own lost-teeth business) must own his talks
        // again. The lure hangs by his door either way.
        return false;
      }
      if (npc.name === 'JANINE') {
        if (done) { say(['Father heard the whole lure story by supper — Koga hears everything in Fuchsia eventually. Thank you again, trainer.']); return true; }
        return false;
      }
    }

    // ---- Cinnabar: Lab Notes ----
    if (id === 'tale_cinnabar') {
      if (stage < 0) { say(['Careful — ash still falls in the mansion library, twenty years on.', 'Our team\'s burned research notes are in there: two halves, west shelves and east shelves. The fire took the middle pages and left the edges legible. Typical.', 'Bring both halves back and the Ember Seed is yours — and Blaine will hear whose hands carried his science home.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) {
        const w = !!st.story.flags.tale_cinnabar_west, e = !!st.story.flags.tale_cinnabar_east;
        say(['Halves recovered: ' + (w ? 'west ' : '') + (e ? 'east ' : '') + (!w && !e ? 'none yet' : '') + '. The mansion library, both shelf-runs. Mind the journals — everybody reads them, nobody shelves them.']); return true;
      }
      if (stage === 1) {
        finishWith(['Both halves. Both! Let me lay them together... yes. Yes, the burn line matches. Twenty years, and the argument still reads clean.', 'This page, though. A jungle expedition, before the fire — they followed a mirage no instrument could record, and came home with one curled eyelash in a specimen jar.', 'Blaine was on that team. He has never once called it a failure. What slept in that jungle, the page refuses to say — and I have stopped asking paper to gossip.', 'The Ember Seed, earned. And Blaine will hear your name from me before the week turns.']);
        return true;
      }
      say(['The notes are re-shelved, the argument restored, the ash — mostly — forgiven.']); return true;
    }

    return false;
  },

  // ---------- Bonds: the Celadon parley (ADR-025 §2 + §3) ----------
  // Rue & Cole's Celadon appearance. Wary or below: the ambush stays an
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
    const fight = () => {
      const def = TRAINERS.duo3_celadon;
      if (!def) { resolve(); return; }
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
            this.taleSay(['They flee toward the Game Corner, arguing about whose idea Celadon was.', 'Some things even a long road cannot fix. Their next ambush, wherever it is, will still be an ambush — but maybe a shorter one.'], '');
          }
        },
      }));
    };
    if (tierAtLeast(st, 'rue', 'Warm') && tierAtLeast(st, 'cole', 'Warm')) {
      say(['...You. Of ALL the street corners in all of Kanto—', 'Wait. Wait wait wait. Before the fun way starts — Cole. Cole, look at them. That is not a mark anymore. That is... the road. The whole road, walking next to us.', 'New plan. No plan. You and us, we are doing something else now: we are TALKING.'], () => {
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
            'Nobody reaches for a Poke Ball. Cole laughs once, surprised at himself. Rue pretends she was never scared of you, badly.',
            gotRibbon
              ? 'On the way out, Rue presses something into your hand — a ribbon, road-worn and carefully mended. "Second-Wind," she says. "For the one who keeps getting up. Do NOT make it a thing." It is absolutely a thing.'
              : dupeRibbon
                ? 'On the way out, Rue presses something into your hand — then stops. "You already carry a Second-Wind," she says, flat. "One of a kind. Fine." She counts out $2,000 instead, like it personally offends her. "Do NOT make it a thing." It is absolutely a thing.'
                : 'On the way out, Rue presses two XP Candies into your hand. "For the road," she says. "Do NOT make it a thing." It is absolutely a thing.',
            'They walk off arguing about lunch. Not running. Walking. (Received an XP Candy for the road — less than a prize fight pays, and worth more.)',
          ], '');
        });
      });
      return true;
    }
    say(['Hold it right there— oh. OH NO. It is the kid. IT IS THE KID, COLE.', 'No disguises this time, no soup course, no dignity: the Game Corner score is OURS and the Pikachu is a bonus!', 'Rue. The kid is doing the stance. The BATTLE stance. I hate the stance.'], () => fight());
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
      misty: 'The whole street heard that bell come home. Cerulean does not forget a sound like that — or who carried it back.',
      surge: 'The Chairman framed your tide-table delivery receipt. FRAMED it. In the clubhouse. You are harbor legend now, soldier.',
      erika: 'The roof garden is in full season, thanks to your three waterings. Erika — I — wanted that said out loud.',
      koga: 'Janine has told the lure story at three family dinners. You are, whether you planned it or not, part of this family\'s archive.',
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

  // The Pewter museum desk quiz: 3 questions, all from the exhibit
  // lines read aloud first. A wrong answer corrects and re-asks the
  // same question — the desk is never failed, only finished.
  taleQuizPewter(npc) {
    const g = this.game;
    const st = g.state;
    const QS = [
      { q: 'Exhibit one: "Old Amber holds something ancient inside." What does amber hold?', opts: ['Ancient DNA', 'A tiny lighthouse', 'Fossilized soup'], a: 0, fix: 'The card says it plainly: amber holds ancient DNA. Again —' },
      { q: 'Exhibit two: "Two fossils sleep in Mt. Moon." Which one is the SPIRAL shell?', opts: ['Dome Fossil', 'Helix Fossil', 'Old Amber'], a: 1, fix: 'Helix — think of a snail shell, a spiral staircase. Again —' },
      { q: 'Exhibit three: "Pewter stone remembers." The museum was built from what?', opts: ['Imported marble', 'The mountain itself', 'Recycled badges'], a: 1, fix: 'The mountain itself — this whole city is one polite quarry. Again —' },
    ];
    const ask = (i) => {
      if (i >= QS.length) {
        this.taleSay(['Three for three! The desk is covered, the visitors are dazzled, and Brock owes us both a day off.', 'He is in the square with his Geodude. Go and collect your spar.'], npc.name, () => advanceTale(st, 'tale_pewter'));
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
  // Stage J5: the Ilex shrine. With the returned GS Ball in the bag
  // and Celebi uncaught, facing the shrine runs the opening scene
  // (the catch-only event — a flee or KO leaves the shrine ready to
  // try again). Otherwise it is a shrine: flavour, and after the
  // catch, a memento line. Always handled (the prop is a set piece).
  johtoShrineInteract() {
    const g = this.game;
    const f = g.state.story.flags;
    if (f.arc_celebi_done) {
      g.ui.say(['The shrine is quiet, and the forest is its own age again — all of its ages, really, but polite about it. The empty GS Ball in your bag weighs nothing at all, which for a souvenir is exactly right.']);
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

  // Stage J5: descend into the Rocket Hideout — the Mahogany shop's
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
    if (spot.kind === 'keepsake') { // Viridian Forest, Route 2 grass
      say(['Something glints under the grass — a carved wooden tortoise, worn smooth as river stone.', 'THE TORTOISE CHARM. Sixty years of weather, and the carving still smiles.', 'Take it back to Ace Marlow in Viridian — or keep it. The choice is the tale.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notes') { // Vermilion dock, pre-departure
      if (st.story.flags.stanne_done) { say(['The dock is bare — the Anne has sailed, and whatever she left behind went through the harbor office. The Harbormaster keeps lost property.']); return true; }
      say(['Under a dock crate, oilskin-wrapped against the spray: notebooks! Tide tables, team notes, and puns of a truly maritime vintage.', 'THE FOUNDER\'S NOTES. The Chairman in Vermilion will want these yesterday.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'graves') { // Pokemon Tower, west stones
      say(['You read the west stones aloud, one by one, and write what the carving still holds.', 'Three have no names at all — only dates, and the careful marks of whoever visits. The ledger takes them as "beloved, unnamed," which is better than forgotten.', 'Elder Bram, in Lavender Town, remembers the rest. Go gently.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'lure') { // Safari Zone entrance marsh
      say(['The marsh reeds lean over something shining — you wade two steps and close your hand on carved, water-dark wood.', 'THE WARDEN\'S LURE. Older than the fence around it, and heavier than it looks: a lot of mornings live in this wood.', 'Return it to the Safari Warden in Fuchsia City.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notesWest' || spot.kind === 'notesEast') { // Mansion library
      const flag = spot.kind === 'notesWest' ? 'tale_cinnabar_west' : 'tale_cinnabar_east';
      if (st.story.flags[flag]) { say(['Ash and empty shelf. This half is already recovered.']); return true; }
      st.story.flags[flag] = true;
      const both = st.story.flags.tale_cinnabar_west && st.story.flags.tale_cinnabar_east;
      say([spot.kind === 'notesWest'
        ? 'Behind the west shelves: a tin box the fire only kissed. Inside — half of the lab\'s burned notes, edges crisped, argument intact.'
        : 'Under the east shelves, where the journals fell like leaves: the other half of the burned notes, smelling of smoke and stubbornness.',
      both ? 'BOTH HALVES. The lab tech in Cinnabar is about to have a very good day.' : 'One half recovered. The other shelf-run still waits.'], () => { if (both) advanceTale(st, id); });
      return true;
    }
    return false;
  },

  // ---------- PC boxes ----------
  // ---------- Stage J6: the Day-Care (Route 34) ----------
  // Both keepers (the maps6 keeper, johto-patched, and his wife,
  // appended in JOHTO_NPCS) run this one flow. All state moves ride
  // the pure johto-systems functions; this layer is menus + lines.
  openDaycare(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    ensureJohtoSystems(st);
    const say = (lines, cb) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, npc.name);
    const destLine = (res, what) => res.dest === 'box'
      ? what + ' was sent to ' + String(res.boxId).replace('box', 'Box ') + ' — no room in the party, but safe and warm there.'
      : what + ' is in your party. Walk with it.';
    const menu = () => {
      const items = [];
      if (st.daycareEgg) items.push({ label: 'Collect the Egg we found', value: 'egg' });
      items.push({ label: 'Leave a Pokemon with us', value: 'dep', disabled: st.daycare.length >= 2 });
      items.push({ label: 'Take a Pokemon back', value: 'wd', disabled: !st.daycare.length });
      items.push({ label: 'How are my Pokemon?', value: 'status' });
      items.push({ label: 'Leave', value: null });
      g.ui.showMenu('Pokemon Day-Care — we raise them with patient hands.', items, (v) => {
        if (v === 'egg') {
          const res = collectDaycareEgg(st);
          if (!res.ok) { say(['There is no room anywhere — party full and every PC box full. Make room, and the Egg will still be here, warm in the straw.'], () => menu()); return; }
          g.audio.playSfx('dex-register');
          say(['Here it is, still warm. We do not know how it got here — your two guests are not telling.', destLine(res, 'The Egg')], () => menu());
          return;
        }
        if (v === 'dep') {
          const rows = st.party.map((m, i) => ({
            label: displayName(m, SPECIES) + ' Lv' + m.level + (m.egg ? ' (Egg)' : ''), value: i, disabled: !!m.egg,
          }));
          rows.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Leave which Pokemon?', rows, (iv) => {
            if (iv === null || iv === -1) { menu(); return; }
            const mon = st.party[iv];
            const res = depositToDaycare(st, iv);
            if (res.ok) {
              say(['We will take good care of ' + displayName(mon, SPECIES) + '. Walk the routes, trainer — eggs and friendships both happen at walking pace.'], () => menu());
            } else if (res.reason === 'partner') say([res.line], () => menu());
            else if (res.reason === 'last-non-egg') say(['Not your last travelling partner, dear. An Egg cannot walk the roads alone — someone has to carry it, and battle for it. Leave us a Pokemon when another able one walks with you.'], () => menu());
            else if (res.reason === 'is-egg') say(['An Egg needs its trainer\'s own walking to hatch. Keep it in your party, dear.'], () => menu());
            else say(['We are full up just now — two guests is our honest limit.'], () => menu());
          });
          return;
        }
        if (v === 'wd') {
          const rows = st.daycare.map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i }));
          rows.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Take back which Pokemon?', rows, (iv) => {
            if (iv === null || iv === -1) { menu(); return; }
            const mon = st.daycare[iv];
            const res = withdrawFromDaycare(st, iv);
            if (res.ok) say([displayName(mon, SPECIES) + ' is glad to see you. They always are, whatever they pretend.'], () => menu());
            else say(['Your party is full, dear. Make room first — ' + displayName(mon, SPECIES) + ' can wait a little longer.'], () => menu());
          });
          return;
        }
        if (v === 'status') {
          const lines = [];
          if (!st.daycare.length) lines.push('No guests just now. The garden is quiet, the naps are ahead of schedule.');
          else {
            for (const m of st.daycare) lines.push(displayName(m, SPECIES) + ' (Lv' + m.level + ') is resting well — fed, brushed, and sung to at noon.');
            if (st.daycare.length === 2) {
              if (st.daycareEgg) lines.push('And — we found an Egg with them! It is waiting for you, warm in the straw.');
              else if (pairCompatible(st.daycare[0], st.daycare[1])) {
                const left = st.daycareEggAt !== null ? Math.max(0, st.daycareEggAt - st.stepsTotal) : 0;
                lines.push('Those two get along famously. Walk about ' + left + ' more steps with them in our care, and check back — these things keep their own hours.');
              } else lines.push('Those two prefer their own corners, truth be told. No egg will come of this pairing — different kinds keep different company.');
            }
          }
          say(lines, () => menu());
          return;
        }
      });
    };
    // The story egg: the couple's one-time gift, offered on the first
    // visit, so every player meets the system. A full-everywhere
    // refusal sets NO flag — the offer stands on the next visit.
    if (!flags.daycare_story_egg) {
      say(['Welcome to our little house, trainer. Forty years we have raised other folks\' Pokemon here, one nap at a time.',
        'Before anything else — a gift. Travellers leave us all sorts here, and this was left with a note: "for a trainer who walks." It is a Pokemon Egg, and we would like you to walk with it.'], () => {
        const res = giveStoryEgg(st, () => g.rng.misc());
        if (!res.ok) {
          say(['Ah — no room anywhere, party and boxes both full. Make a little room, dear, and come back. The Egg will keep.']);
          return;
        }
        flags.daycare_story_egg = true;
        g.audio.playSfx('dex-register');
        say(['Received a Pokemon Egg!', destLine(res, 'The Egg'), 'Walk with it in your party. When it is ready, it will not ask permission — eggs never do.'], () => menu());
      });
      return true;
    }
    if (st.daycareEgg) {
      say(['You came at the right moment, {player} — we found an Egg with your two guests! We do not know how it got there. They are not telling.'], () => menu());
      return true;
    }
    say(['Eggs and friendships both happen at walking pace, trainer. What can this house do for you?'], () => menu());
    return true;
  },

  // UI v2.4 (defect 4): a real box SCREEN (ui.showPcPanel) instead of the
  // list-modal flow — wallpaper field, a 30-slot grid that renders even
  // when empty, the party strip alongside, a framed info window, and box
  // switching as framed nav (Q/E or the ◀ ▶ buttons). Pick-up/place
  // semantics: A lifts a mon — it stays in its array, dimmed, until
  // placed, so B / log-off with full hands can never lose a mon — and A
  // again places it: empty target = deposit / withdraw / move, occupied
  // target = swap. Boxes stay DENSE arrays under the grid (placing on an
  // empty cell inserts at that index): the save format stores lists, and
  // the validator rejects sparse/null slots. Deposit keeps the house
  // rules: boxCheck (the partner never boxes) + at least one Pokemon
  // stays with you; depositing clears status, as before.
  // Link Transfer (Bill's system) keeps its menu, from the side button.
  openPc() {
    const g = this.game;
    const boxes = g.state.boxes;
    for (let i = 1; i <= BOX_COUNT; i++) if (!Array.isArray(boxes['box' + i])) boxes['box' + i] = [];
    const COLS = 6;
    const st = {
      box: Math.max(1, Math.min(BOX_COUNT, parseInt(String(g.state.currentBox || 'box1').slice(3), 10) || 1)),
      zone: 'grid', idx: 0,
      held: null, // { mon, from: 'grid'|'party', idx, box }
    };
    const boxArr = () => boxes['box' + st.box];
    const sprite = (mon) => (typeof g.spriteDataUrl === 'function') ? g.spriteDataUrl(mon.speciesId) : '';

    const openLink = () => {
      // Bill's Link Transfer: trade-evolution species evolve here —
      // the honest single-player resolution (WS7 design call, ADR-019).
      // Stage J6 widening: the candidate scan reads `evos` branch
      // entries too (tradeEvolutionsOf), so poliwhirl->politoed and
      // slowpoke->slowking — whose `evo` slots carry their primary
      // branches — are reachable; each trade branch is its own row,
      // and the evolution runs the CHOSEN branch (evolveMon's
      // forcedEvo), never the slot default.
      const cand = [];
      for (const m of g.state.party) {
        if (m.egg) continue; // J6: an Egg can't be sent out, traded, or evolved
        for (const evo of tradeEvolutionsOf(m.speciesId)) cand.push({ mon: m, evo });
      }
      // AUDIT FIX (S-10): the link flow used to close the PC first and
      // never come back — checking (or backing out) cost the whole PC
      // session. The panel now stays open underneath (menus and dialogue
      // route above it) and every exit path returns to it.
      if (!cand.length) { g.ui.say(['No Pokemon here is waiting on a trade evolution.'], () => render()); return; }
      const items = cand.map((c, i) => ({ label: displayName(c.mon, SPECIES) + ' -> ' + SPECIES[c.evo.to].name, value: i }));
      items.push({ label: 'Back', value: null, wide: true });
      const linkRowHtml = (it) => {
        const c = cand[it.value] || null;
        if (!c) return '<span>' + it.label + '</span>';
        return '<img class="picon" src="' + sprite(c.mon) + '" alt=""><span>' + it.label + '</span>';
      };
      g.ui.showMenu('Link Transfer which?', items, (iv) => {
        const c = cand[iv];
        if (c) this.evolveMon(c.mon, null, () => render(), c.evo);
        else render();
      }, { menuClass: 'pcbox', rowHtml: linkRowHtml });
    };

    const infoFor = () => {
      if (st.held) return 'Holding <b>' + displayName(st.held.mon, SPECIES) + ' Lv' + st.held.mon.level + '</b>.<br>Choose where to place it — a box slot or a party slot. B puts it back.';
      if (st.zone === 'grid') {
        const mon = boxArr()[st.idx];
        if (mon) return '<b>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</b><br>HP ' + mon.hp + '/' + mon.maxHp + (mon.status ? ' · ' + String(mon.status).toUpperCase() : '') + '<br>A: pick up.';
        return 'Empty box slot.<br>Pick up a party member, then place it here to deposit.';
      }
      const mon = g.state.party[st.idx];
      if (mon) return '<b>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</b><br>HP ' + mon.hp + '/' + mon.maxHp + '<br>A: pick up.';
      return 'Empty party slot.<br>Place a box Pokemon here to withdraw it.';
    };

    const render = () => {
      const arr = boxArr();
      let cells = '';
      for (let i = 0; i < BOX_CAP; i++) {
        const mon = arr[i];
        const cls = 'pccell' + (mon ? '' : ' empty')
          + (st.zone === 'grid' && st.idx === i ? ' cursor' : '')
          + (st.held && st.held.from === 'grid' && st.held.box === st.box && st.held.idx === i ? ' heldsrc' : '');
        cells += '<button class="' + cls + '" data-pcact="cell" data-idx="' + i + '">'
          + (mon ? '<img src="' + sprite(mon) + '" alt=""><span class="pclv">Lv' + mon.level + '</span>' : '')
          + '</button>';
      }
      let party = '';
      for (let i = 0; i < 6; i++) {
        const mon = g.state.party[i];
        const cls = 'pcpslot' + (mon ? '' : ' empty')
          + (st.zone === 'party' && st.idx === i ? ' cursor' : '')
          + (st.held && st.held.from === 'party' && st.held.idx === i ? ' heldsrc' : '');
        party += '<button class="' + cls + '" data-pcact="party" data-idx="' + i + '">'
          + (mon ? '<img src="' + sprite(mon) + '" alt=""><span>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</span>' : '<span>—</span>')
          + '</button>';
      }
      const bodyHtml = '<div class="pcmain"><div class="pcgrid">' + cells + '</div>'
        + '<div class="pcside"><div class="pcpartyhd">PARTY</div><div class="pcparty">' + party + '</div>'
        + '<div class="pcinfo">' + infoFor() + '</div>'
        + '<button class="pclink" data-pcact="link">Link Transfer (Bill\'s system) — Shift</button>'
        + '<button class="pclink" data-pcact="off">Log off</button></div></div>';
      const data = {
        title: 'SOMEONE\'S PC — BOX ' + st.box + ' (' + arr.length + '/' + BOX_CAP + ')'
          + (st.held ? ' · HOLDING ' + displayName(st.held.mon, SPECIES) : ''),
        bodyHtml,
      };
      if (g.ui.pcOpen) g.ui.updatePcPanel(data); else g.ui.showPcPanel(data, cb);
    };

    const place = (zone, idx) => {
      const held = st.held;
      if (!held) {
        const mon = zone === 'grid' ? boxArr()[idx] : g.state.party[idx];
        if (!mon) return;
        st.held = { mon, from: zone, idx, box: st.box };
        g.audio.playSfx('ui-blip');
        render();
        return;
      }
      // Placing back on the origin slot just puts it down again.
      if (held.from === zone && held.idx === idx && (zone === 'party' || held.box === st.box)) {
        st.held = null; render(); return;
      }
      if (zone === 'grid') {
        const arr = boxArr();
        const occ = arr[idx];
        if (held.from === 'party') {
          if (g.state.party.length <= 1) { g.ui.say(['You need at least one Pokemon with you!']); return; }
          // Stage J6: the all-egg guard (the deposit-your-last-mon
          // precedent, sharpened) — a move whose RESULTING party
          // holds only Eggs (or nothing able) is refused.
          const simParty = g.state.party.filter((_, i2) => i2 !== held.idx);
          if (occ) simParty.splice(held.idx, 0, occ);
          if (!simParty.some((m) => m && !m.egg)) { g.ui.say(['An Egg can\'t travel alone! Keep at least one hatched Pokemon with you.']); return; }
          const chk = boxCheck(held.mon);
          if (!chk.ok) { g.ui.say([chk.line]); return; }
          g.state.party.splice(held.idx, 1);
          if (occ) { arr[idx] = held.mon; g.state.party.splice(held.idx, 0, occ); }
          else arr.splice(Math.min(idx, arr.length), 0, held.mon);
          held.mon.status = null;
          g.ui.toast('Deposited ' + displayName(held.mon, SPECIES) + '.');
        } else {
          const src = boxes['box' + held.box];
          if (occ) { src[held.idx] = occ; arr[idx] = held.mon; }
          else { src.splice(held.idx, 1); arr.splice(Math.min(idx, arr.length), 0, held.mon); }
        }
      } else {
        const occ = g.state.party[idx];
        if (held.from === 'grid') {
          const src = boxes['box' + held.box];
          if (occ) {
            const chk = boxCheck(occ);
            if (!chk.ok) { g.ui.say([chk.line]); return; }
            // Stage J6: the same all-egg guard on the swap direction.
            const simParty = g.state.party.slice(); simParty[idx] = held.mon;
            if (!simParty.some((m) => m && !m.egg)) { g.ui.say(['An Egg can\'t travel alone! Keep at least one hatched Pokemon with you.']); return; }
            src[held.idx] = occ; g.state.party[idx] = held.mon;
          } else {
            src.splice(held.idx, 1); g.state.party.push(held.mon);
          }
          g.ui.toast('Withdrew ' + displayName(held.mon, SPECIES) + '.');
        } else if (occ) {
          g.state.party[held.idx] = occ; g.state.party[idx] = held.mon;
        }
      }
      st.held = null;
      st.zone = zone; st.idx = idx;
      g.audio.playSfx('ui-blip');
      render();
    };

    const move = (dir) => {
      if (st.zone === 'grid') {
        if (dir === 'left') st.idx = Math.max(0, st.idx - 1);
        else if (dir === 'right') st.idx = Math.min(BOX_CAP - 1, st.idx + 1);
        else if (dir === 'up') { if (st.idx >= COLS) st.idx -= COLS; }
        else if (dir === 'down') {
          if (st.idx + COLS < BOX_CAP) st.idx += COLS;
          else { st.zone = 'party'; st.idx = Math.min(5, st.idx % COLS); }
        }
      } else {
        if (dir === 'left') st.idx = Math.max(0, st.idx - 1);
        else if (dir === 'right') st.idx = Math.min(5, st.idx + 1);
        else if (dir === 'up') { st.zone = 'grid'; st.idx = (BOX_CAP - COLS) + Math.min(COLS - 1, st.idx); }
      }
      g.audio.playSfx('ui-tick');
      render();
    };

    const cb = (action, arg) => {
      if (action === 'move') move(arg);
      else if (action === 'box') {
        st.box = ((st.box - 1 + arg + BOX_COUNT) % BOX_COUNT) + 1;
        g.state.currentBox = 'box' + st.box;
        g.audio.playSfx('ui-tick');
        render();
      } else if (action === 'confirm') place(st.zone, st.idx);
      else if (action === 'cancel') {
        if (st.held) { st.held = null; render(); }
        else g.ui.closePcPanel();
      } else if (action === 'link') {
        openLink(); // AUDIT FIX (S-09): Shift key — the keyboard path to Link Transfer
      } else if (action === 'click') {
        if (arg.act === 'cell') { st.zone = 'grid'; st.idx = arg.idx; place('grid', arg.idx); }
        else if (arg.act === 'party') { st.zone = 'party'; st.idx = arg.idx; place('party', arg.idx); }
        else if (arg.act === 'link') { openLink(); }
        else if (arg.act === 'off') { g.ui.closePcPanel(); }
      }
    };

    render();
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
      // badgesAtLeast gating idiom — this is how the Celadon shop's
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
  // item table by pocket, all 8 Kanto badges, every keepsake, and every
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
    // O2: the prefix rule extends across sets independently — Kanto
    // claims never touch badges.orange and vice versa); a claim can
    // therefore never produce an invalid save.
    const g = this.game;
    const setId = Object.keys(BADGE_SETS).find((k) => BADGE_SETS[k].includes(badgeId));
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
    // Kanto eight plus the Orange four, each set claimed under its
    // own prefix rule (cheatClaimBadge resolves the set from the id).
    const BADGE_IDS = Object.values(BADGE_SETS).flat();
    const badgeOwned = (id) => Object.values(g.state.badges || {}).some((arr) => Array.isArray(arr) && arr.includes(id));
    const SECTIONS = [
      { label: 'Balls', value: 'balls' }, { label: 'Medicine', value: 'medicine' },
      { label: 'Items', value: 'items' }, { label: 'TMs', value: 'tm' }, { label: 'HMs', value: 'hm' },
      { label: 'Key Items', value: 'key' }, { label: 'Badges', value: 'badges' },
      { label: 'Keepsakes', value: 'keepsakes' }, { label: 'Collectibles', value: 'collectibles' },
    ];
    const stockOf = (section) => Object.keys(ITEMS).filter((id) => {
      const it = ITEMS[id];
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
        // fossil_taken is NEVER set by the shop (the Mt. Moon choice
        // event owns that flag; the Cinnabar revive reads the bag).
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
      g.ui.showMenu('Get Pokemon — everything $0', rows, (sid) => {
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
      { label: 'Get Pokémon', value: 'pokemon' },
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
    g.audio.playSfx('levelup');
    g.ui.say(['What? ' + fromName + ' is evolving!', fromName + ' evolved into ' + to.name + '!'], onDone || undefined);
    return true;
  },

  // ---------- blackout ----------
  blackout() {
    const g = this.game;
    g.state.player.money = Math.floor(g.state.player.money / 2);
    g.ui.say(['You scurried to a Pokemon Center, protecting your exhausted team...'], () => {
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
      g.ui.toast('Your Pokemon were healed. (Lost half your money.)');
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
        const fg = g.foregroundFor(g.tileKind(this.map.rows[y][x]), x, y, kindAt);
        if (fg) r.blit(fg, x * T - 8, y * T - 16);
      }
    }
  },

  // ---------- objective (quest-driven HUD line) ----------
  sysObjective() {
    const g = this.game;
    // Stage O2: while the Orange arc is current, its chain leads the
    // HUD objective (the badge stage counts n/4, as in the Quest Log).
    if (currentArcOf(g.state).id === 'orange') {
      // Stage O3: while the storm is live it leads the objective,
      // wherever the badge chain stands (the chain is never a gym
      // blocker, but the sky is hard to ignore).
      const f = g.state.story.flags;
      if (f.orange_2000_active && !f.orange_2000_storm_stilled) {
        const n = (f.orange_2000_moltres ? 1 : 0) + (f.orange_2000_zapdos ? 1 : 0) + (f.orange_2000_articuno ? 1 : 0);
        return n >= 3
          ? '▶ The Storm over Shamouti — return to Shamouti Shrine: the guardian rises'
          : '▶ The Storm over Shamouti — calm the three titans (' + n + '/3)';
      }
      const oq = ORANGE_QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
      if (oq) return '▶ ' + oq.text + (oq.badgeCount ? ' (' + ((g.state.badges.orange || []).length) + '/4)' : '') + (oq.titanCount ? ' (' + ((f.orange_2000_moltres ? 1 : 0) + (f.orange_2000_zapdos ? 1 : 0) + (f.orange_2000_articuno ? 1 : 0)) + '/3 titans calmed)' : '');
    }
    // Stage J4a: while the Johto arc is current, its chain leads the
    // HUD objective (the west rows in J4a; J4b's appended rows join
    // the same find, in chain order).
    if (currentArcOf(g.state).id === 'johto') {
      const jq = JOHTO_QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
      if (jq) return '▶ ' + jq.text;
    }
    // Stage H4a: while the Hoenn arc is current, its chain leads the
    // HUD objective (the first-half rows; H4b's appended rows join
    // the same find, in chain order).
    if (currentArcOf(g.state).id === 'hoenn') {
      const hq = HOENN_QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
      if (hq) return '▶ ' + hq.text;
    }
    const q = MAIN_QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
    if (q) return '▶ ' + q.text;
    const active = Object.keys(g.state.story.quests).find((k) => g.state.story.quests[k] === 'active');
    if (active && LEGENDARY_ARCS[active]) return '▶ Arc: ' + LEGENDARY_ARCS[active].title;
    return '▶ Explore Kanto';
  },
});
