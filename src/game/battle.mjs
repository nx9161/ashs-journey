// battle.mjs — turn-based battle state machine (architecture §2.2).
// States: intro | command | moves | bag | party | catchseq | resolve | faint |
//          xp | victory | defeat | run. Transitions are data-ish, no spaghetti.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { BALLS, ITEMS } from '../data/items.mjs';
import {
  effectiveness, calcDamage, stageMultiplier, accStageMultiplier, STAB_MULT,
  gen1Random, critChance, gen1Catch,
  xpYield, xpForLevel, statValue, hpValue,
} from '../engine/formulas.mjs';
import { roll, intIn } from '../engine/rng.mjs';
import { TILE, BATTLER_DRAW_SIZE, PT_FRAME, PT_FRAME2, PT_PAPER } from '../engine/render.mjs';
import { dexRegister, displayName, makeMon } from './state.mjs';
import { ballCatchRate, FRIEND_BALL_FRIENDSHIP } from './ball-rules.mjs';
import { levelCapFor } from '../data/arcs.mjs';
import {
  trainerLevelFor, tuneFoeMon, effectiveAiFor, damageRandomFor,
  xpMultFor, moneyMultFor, catchRateMultFor, difficultyOf, foeKeepsakeFor,
} from './rules.mjs';
import {
  KEEPSAKES, keepsakeDamageFactor, noteHitTaken, evaluateTriggers,
  ksState, clearKsState, keepsakeStatusChanceBonus, refusesStatus,
  keepsakeHealMult, keepsakeXpMult,
} from './keepsakes.mjs';
import {
  resolveField, resolveFieldForGround, groundHealMult, groundStatusChanceBonus,
  groundClassicAccuracy, groundCritBonus, groundMireSpeedMult,
} from '../data/grounds.mjs';
import { SFX } from '../engine/audio.mjs';
import { trainerBattleArt, playerBattleBackArt, ballBattleArt, trainerPoseArt, playerPoseArt } from '../engine/art.mjs';
import { IDLE_CLASS_PARAMS, idleClassOf, idlePhaseOf } from '../data/idle-classes.mjs';
import { fxPlanForMove, FX_DEFS } from '../engine/fx.mjs';
import { SLICE_CAPSTONE } from '../data/dialogue.mjs';
import { typePill } from './ui.mjs';

const HP_DRAIN_PER_SEC = 90; // ADR-004 feel budget

// Arc 4 Stage S6 RIDER: authored foe move sets. A trainer team entry
// may carry `moves: [moveId...]`; when it does, the foe mon's
// learnset-derived set is replaced by the authored one, in order, at
// full PP. Entries without the field keep the shipped learnset
// behaviour byte-for-byte — a no-op for every def that predates it.
function authoredMoves(mon, entry) {
  if (entry && Array.isArray(entry.moves) && entry.moves.length) {
    const set = entry.moves.filter((id) => MOVES[id]).slice(0, 4)
      .map((id) => ({ id, pp: MOVES[id].pp, maxPp: MOVES[id].pp }));
    if (set.length) mon.moves = set;
  }
  return mon;
}

// ---- Premium+ W1 (FX-1/FX-2/FX-4/FX-5/FX-6): battle impact layer ----
// All W1 presentation is VISUAL ONLY: it never calls g.rng, never
// changes a timing the battle-model mission shipped (hitstop 70ms,
// trauma tiers, 600ms drain cap, 450ms faint beat all stand verbatim),
// and collapses to nothing when battleAnims is off or reducedMotion is
// on (battles then play exactly as at the W0 base). Particles are a
// fixed pool of 60 plain objects allocated once per battle — no
// per-frame allocation in the hot path; all drawing is rects (the
// engine idiom: no shadowBlur, no gradient APIs).
const FX_POOL_MAX = 60;
// Per-ball procedural palettes — the same colours as the authored
// pix/ui/ball-*.pix sprites; used when no canvas art is available
// (headless) and to tint catch bursts. [top, highlight, bottom, shade]
const BALL_PALETTES = {
  pokeball: ['#c47b3a', '#eda964', '#f2e3c2', '#d9bd8f'],
  greatball: ['#3a6ea8', '#7fb0dd', '#f2e3c2', '#d9bd8f'],
  ultraball: ['#33333c', '#6a6a76', '#f2e3c2', '#d9bd8f'],
  masterball: ['#6a3a9e', '#b48ae0', '#f2e3c2', '#d9bd8f'],
  safariball: ['#5d8a3c', '#9cc46e', '#f2e3c2', '#d9bd8f'],
  gsball: ['#d8a018', '#ffe898', '#c8ccd8', '#9098a8'],
};
const LEGENDARY_SPECIES = new Set(['mewtwo', 'articuno', 'zapdos', 'moltres', 'mew']);
const BOSS_TRAINER_IDS = new Set(['brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni',
  'lorelei', 'bruno', 'agatha', 'lance', 'gary', 'gary_champion', 'rue', 'cole']);
// Deterministic 0..1 hash for FX placement (hash-driven, never RNG).
function fxHash(n) {
  let x = (Math.imul((n | 0) + 1, 374761393) + 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

// UI v2 (Platinum standard): status chips for the databox — a solid DS-toned
// rect with the white bold 3-letter code as TEXT on it (never color alone).
// NOTE: burn keeps the legacy 'BUR' code — verify-slice's QA plate check
// asserts that exact text for a burned mon, so the DS 'BRN' abbreviation is
// the one deliberate deviation from Platinum spelling in this table.
// WP3 Ground legibility: player-facing text for each Ground twist
// (mirrors the twist semantics in src/data/grounds.mjs + rulesEffects;
// wording is presentation, the numbers are the shipped ones).
const GROUND_TWIST_TEXT = {
  heal: 'Healing moves restore +50% more HP.',
  storm: 'Electric moves are 5 points more accurate (and cool down faster in real-time).',
  mire: 'Mons not native to this Ground are slowed.',
  status: 'Status moves are 10 points less accurate.',
  burn: 'Fire moves that can burn do so +10 points more often.',
  frost: 'Accuracy x0.95 for both sides (real-time dodges gain +40ms of i-frames).',
  tide: 'Special moves crit more often (and fly faster in real-time).',
  rubble: 'Physical moves are 5 points more accurate (and lunge faster in real-time).',
  poison: 'Poison moves that can poison do so +10 points more often.',
};

const STATUS_CHIPS = {
  burn: ['BUR', '#c84028'],
  poison: ['PSN', '#9848a8'],
  badlyPoisoned: ['PSN', '#7038a0'],
  paralysis: ['PAR', '#b8860b'],
  sleep: ['SLP', '#68707e'],
  freeze: ['FRZ', '#2f88b8'],
};

// Fraction of the current level's XP bar filled (gameux §4.2).
function xpFracOf(mon, add) {
  const sp = SPECIES[mon.speciesId];
  const lo = xpForLevel(sp.growth, mon.level);
  const hi = xpForLevel(sp.growth, mon.level + 1);
  if (hi <= lo) return 1;
  return Math.max(0, Math.min(1, (mon.xp + (add || 0) - lo) / (hi - lo)));
}

// UI v2.3 (defect 4): deterministic 2D hash for arena texture work —
// the same (x, y) always yields the same value, so dither/speckle patterns
// are stable frame to frame (no shimmer) without any stored state.
function arenaHash(x, y) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// World Art Wave 6c: per-Ground arena art. Every Ground (all 15 in
// grounds.mjs) owns a palette set + horizon motif + ground texture,
// composed at draw time from rects/strips through arenaHash — no raster
// assets, so the whole table + painters cost ~0.5 KB of code per Ground.
// drawArena (shared by the classic and RT engines) reads the treatment
// from battle.field, exactly as resolved at battle start; no field
// logic lives here. Aliases that share rules (volt/storm, marsh/bloom,
// pyre/ember, spirit/mire) still carry DISTINCT treatments.
const ARENA_ART = {
  open: { sky: ['#5f9fe6', '#6fabec', '#7fb7f1', '#8fc3f5', '#9fcdf8', '#b0d7fa'], ground: ['#a5dc82', '#9bd578', '#91ce6f', '#87c766', '#7dc05d', '#73b954'], dark: '#4f9440', light: '#c8ef9f', accent: '#5d8f66', motif: 'trees', tex: 'tuft', haze: true },
  bloom: { sky: ['#6fb98a', '#7cc496', '#89cfa1', '#97d9ac', '#a5e3b6', '#b3ecc0'], ground: ['#8fe07a', '#85d670', '#7bcc66', '#71c25c', '#67b852', '#5dae48'], dark: '#3f7d33', light: '#e6ffb0', accent: '#f2a7c3', motif: 'flowers', tex: 'petal', haze: true },
  storm: { sky: ['#4a4a68', '#565672', '#625f7c', '#6e6886', '#7a7290', '#867c9a'], ground: ['#7a8a72', '#71816a', '#687862', '#5f6f5a', '#566652', '#4d5d4a'], dark: '#333d33', light: '#f8e98a', accent: '#e8c832', motif: 'storm', tex: 'spark' },
  mire: { sky: ['#7a7a5a', '#857f5e', '#908462', '#9a8966', '#a48e6a', '#ae936e'], ground: ['#9a7c52', '#8f714b', '#846644', '#795b3d', '#6e5036', '#63452f'], dark: '#4a3520', light: '#d8c9a0', accent: '#7a9a4a', motif: 'reeds', tex: 'chunk' },
  grave: { sky: ['#4e4468', '#584e74', '#625880', '#6c628c', '#766c98', '#8076a4'], ground: ['#6a6284', '#625a7a', '#5a5270', '#524a66', '#4a425c', '#423a52'], dark: '#2e2844', light: '#cfc4ea', accent: '#9a8ac2', motif: 'tombs', tex: 'fleck' },
  ember: { sky: ['#6e4a3a', '#7a5040', '#865646', '#925c4c', '#9e6252', '#aa6858'], ground: ['#5c4034', '#543a30', '#4c342c', '#44302a', '#3c2c26', '#342822'], dark: '#241a16', light: '#ffb37a', accent: '#f07818', motif: 'flames', tex: 'chunk' },
  frost: { sky: ['#a8d4ec', '#b2dcf2', '#bce4f6', '#c6ecfa', '#d0f2fc', '#daf8fe'], ground: ['#eef8fc', '#e4f2fa', '#daeaf6', '#d0e2f2', '#c6daee', '#bcd2ea'], dark: '#7aa8cc', light: '#ffffff', accent: '#9ad4f0', motif: 'snow', tex: 'spark', haze: true },
  tide: { sky: ['#4f97dd', '#61a6e6', '#73b4ee', '#85c1f4', '#97cdf8', '#aad8fa'], ground: ['#4d8fd8', '#4787ce', '#417fc4', '#3b77ba', '#356fb0', '#2f67a6'], dark: '#27609e', light: '#eaf7ff', accent: '#7ad0e8', motif: 'waves', tex: 'foam', haze: true },
  rubble: { sky: ['#8aa4bc', '#96b0c6', '#a2bcd0', '#aec8da', '#bacfe2', '#c6dbea'], ground: ['#c2a172', '#b99a6c', '#b09366', '#a78c60', '#9e855a', '#957e54'], dark: '#7d6742', light: '#e8dcc0', accent: '#a8895a', motif: 'rocks', tex: 'chunk' },
  mind: { sky: ['#a86a9e', '#b476aa', '#c082b6', '#cc8ec2', '#d89ace', '#e4a6da'], ground: ['#9a6a94', '#8f628a', '#846080', '#795672', '#6e4e66', '#63465c'], dark: '#4a2e44', light: '#ffd8f4', accent: '#f2a7e8', motif: 'runes', tex: 'spark' },
  venom: { sky: ['#5e6a4a', '#687453', '#727e5c', '#7c8865', '#86926e', '#909c77'], ground: ['#5f4a72', '#57446a', '#4f3e62', '#47385a', '#3f3252', '#372c4a'], dark: '#2c2138', light: '#b8e89a', accent: '#a8d85a', motif: 'shrooms', tex: 'bubble' },
  volt: { sky: ['#3a3a5e', '#46466e', '#524f7d', '#5e588c', '#6a619b', '#766aaa'], ground: ['#8a8a62', '#81815a', '#787852', '#6f6f4a', '#666642', '#5d5d3a'], dark: '#3d3d28', light: '#fdf08a', accent: '#f8d030', motif: 'storm', tex: 'spark', pylon: true },
  marsh: { sky: ['#7ab08a', '#83ba94', '#8cc49e', '#95cea8', '#9ed8b2', '#a7e2bc'], ground: ['#93a85c', '#8a9e56', '#819450', '#788a4a', '#6f8044', '#66763e'], dark: '#33512c', light: '#d8f4b0', accent: '#e8a7d0', motif: 'reeds', tex: 'petal', haze: true },
  pyre: { sky: ['#5e3230', '#6a3834', '#76403a', '#82483f', '#8e5045', '#9a584b'], ground: ['#4a3436', '#433033', '#3c2c2e', '#352829', '#2e2426', '#272023'], dark: '#1c1416', light: '#ffd28a', accent: '#f84818', motif: 'flames', tex: 'spark' },
  spirit: { sky: ['#8a86a8', '#948fb4', '#9e98c0', '#a8a1cc', '#b2aad8', '#bcb3e4'], ground: ['#8a7f74', '#7f746a', '#746960', '#695e56', '#5e534c', '#534842'], dark: '#3a332e', light: '#f4f1ff', accent: '#c9bfff', motif: 'tombs', tex: 'fleck' },
};

// Premium+ W2 (AR-2): per-Ground ambient life. One shared drift engine
// in drawArenaAmbient(); this table only picks the element kind, count
// and speed per Ground — elements are native to the field (embers rise
// on the fire grounds, petals drift on the flower grounds, rain falls
// on Storm, snow on Frost, motes hang on the spirit grounds, bubbles
// rise on Venom, sparks blink on Volt/Rubble/Mind). Motion is a pure
// function of the theater clock + arenaHash (phase-varied per element,
// deterministic — never RNG), and collapses to a static scatter when
// battleAnims is off or reducedMotion is on.
const ARENA_AMBIENT = {
  open:   { kind: 'mote',  n: 10, speed: 5 },
  bloom:  { kind: 'petal', n: 14, speed: 9 },
  storm:  { kind: 'rain',  n: 18, speed: 130 },
  mire:   { kind: 'mote',  n: 10, speed: 4 },
  grave:  { kind: 'mote',  n: 12, speed: 5 },
  ember:  { kind: 'ember', n: 14, speed: 16 },
  frost:  { kind: 'snow',  n: 16, speed: 11 },
  tide:   { kind: 'mote',  n: 10, speed: 6 },
  rubble: { kind: 'spark', n: 10, speed: 0 },
  mind:   { kind: 'spark', n: 12, speed: 0 },
  venom:  { kind: 'bubble', n: 12, speed: 10 },
  volt:   { kind: 'spark', n: 14, speed: 0 },
  marsh:  { kind: 'petal', n: 12, speed: 8 },
  pyre:   { kind: 'ember', n: 16, speed: 20 },
  spirit: { kind: 'mote',  n: 12, speed: 5 },
};

// Gym Identity wave (NO-SAME-KIT fix #6), T0: per-gym arena treatments,
// keyed by GYM MAP ID (Director ruling: map id, not leader — every battle
// fought in the gym, leader and gym trainers alike, reads as the gym).
// An entry carries the ARENA_ART shape (sky/ground bands, dark/light/
// accent, motif, tex, optional haze/pylon) PLUS its own `amb` (the
// ARENA_AMBIENT shape: kind/n/speed), and layers over the gym's existing
// Ground: Ground rules, name, banner and tint are NOT in this table and
// never change — identity here is art only (the two Open gyms, Signal
// and Meadowbrook, take art over Open rules exactly this way). The
// table ships EMPTY at T0: the mechanism + the gym-identity guard land
// first, tranches T1–T5 fill one region at a time under the guard's
// ratchet (tests/gym-identity-checks.mjs). With no entry for a map,
// gymArenaFor returns null and every read site falls back to the
// Ground's ARENA_ART / ARENA_AMBIENT treatment, byte-identical to the
// pre-wave render.
const GYM_ARENA_ART = {
};

function gymArenaFor(field) {
  if (!field || !field.mapId) return null;
  return GYM_ARENA_ART[field.mapId] || null;
}

// Darken/lighten a #rrggbb hex by a factor (arena layer palette steps).
function arenaShade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// F2: the SHARED move-choice AI — extracted verbatim from
// BattleScene.chooseFoeAction so the foe and the Palace's autoAlly
// ally run the SAME decision code (mission: reuse, don't fork).
// opts.smart enables the leader line-picking; opts.openerSetup
// enables the turn-1 self-buff opener. A non-smart actor picks
// near-randomly, exactly as ordinary trainer foes always have.
export function aiActionFor(g, mon, target, opts) {
  const usable = mon.moves.map((m, i) => i).filter((i) => mon.moves[i].pp > 0
    && !(mon.disableT > 0 && mon.disabledMove === i));
  if (!usable.length) return { type: 'move', idx: 0, struggle: true };
  if (opts && opts.openerSetup) {
    const setup = usable.find((i) => {
      const mv = MOVES[mon.moves[i].id];
      return mv.cat === 'status' && mv.effect && mv.effect.target === 'self';
    });
    if (setup !== undefined) return { type: 'move', idx: setup };
  }
  if (!opts || !opts.smart) {
    return { type: 'move', idx: usable[Math.floor(g.rng.battle() * usable.length)] };
  }
  const targetTypes = SPECIES[target.speciesId].types;
  let best = usable[0], bestScore = -1;
  for (const i of usable) {
    const mv = MOVES[mon.moves[i].id];
    if (mv.cat === 'status') continue;
    const e = effectiveness(mv.type, targetTypes);
    const score = e * (0.5 + g.rng.battle());
    if (score > bestScore) { bestScore = score; best = i; }
  }
  if (g.rng.battle() < 0.25) best = usable[Math.floor(g.rng.battle() * usable.length)];
  return { type: 'move', idx: best };
}

export class BattleScene {
  constructor(opts) {
    this.kind = opts.kind; // 'wild' | 'trainer'
    this.foeMon = opts.foe;
    this.trainer = opts.trainer || null;
    this.safari = !!opts.safari; // Bramble Preserve: no ally actions, BALL/BAIT/ROCK/RUN
    this.safariRockLabel = opts.safariRock || 'ROCK'; // S4: the zone's own word for the rock throw (the Great Mire throws MUD) — data, from the session (the boolean below stays the thrown state)
    this.onEnd = opts.onEnd || null; // story-event continuation callback
    this.uncatchable = !!opts.uncatchable; // scripted presences (the Tower ghost)
    this.friendly = !!opts.friendly; // no-stakes battle (Candy Coach spar): defeat costs nothing
    // Arc 3.5 Stage F2: the FACILITY seam (game/frontier.mjs) — null
    // for every ordinary battle; when set, the battle obeys Frontier
    // law (mission decision #3): defeat takes the friendly branch
    // (no money halving, no Center warp), no XP is awarded, no prize
    // is paid, the bag stays closed (except the Pyramid run-bag
    // mode), balls are refused at facility wilds, the ally team is
    // read through facility.partyOverride when given, and the
    // optional Arena judge (maxTurns + judge) / Palace autoAlly
    // laws apply. Call sites pass rt: false (classic engine only).
    this.facility = opts.facility || null;
    if (this.facility) this.friendly = true;
    this.foeAi = null; // ADR-025: effective foe AI class, resolved in enter() via rules.mjs
    this.onSafariAction = opts.onSafariAction || null; // overworld spends a step per action
    this.safariBait = false;
    this.safariRock = false;
    // ADR-026 (owner ruling 2026-10-28): the classic turn-based engine is
    // THE main battle; real-time (ADR-020) survives as an optional legacy
    // mode the player selects in Settings (opts.rt === true). The tutorial
    // and Safari command battles always stay on the classic engine.
    this.rtMode = !opts.tutorial && !opts.safari && opts.rt !== false;
    this.rt = null;
    this.tutorial = !!opts.tutorial; // GD: scripted first-catch gate — certainty, not luck
    this.returnTo = opts.returnTo;
    this.arena = opts.arena || null; // UI v2.3: explicit backdrop variant (fishing = 'water'); else derived in arenaKind()
    // Stage J6: the fishing marker — set ONCE by startFishing (the
    // rod's battle start, shared by BOTH engines since BattleScene is
    // the one class) and read by the Lure Ball rule at throw time.
    this.fished = !!opts.fished;
    this._lastBallId = null; // Stage J6: the Friend Ball's post-catch effect reads it in catchSuccess
    this.groundPin = opts.ground || opts.groundId || null; // ADR-025 §1: scripted events may pin a Ground id explicitly
    this.field = null;      // ADR-025 §1: battle.field — resolved ONCE in enter() from the battle's map
    this.fieldBanner = null; // the Ground announcement line (null on Open Ground)
    this.trainerIdx = 0;
  }

  enter() {
    const g = this.game;
    g.ui.setBattleMode(true);
    this.state = 'intro';
    // Wave 3b: intro presentation art, resolved once here (never in the
    // render loop). The foe trainer's battle sprite + Ash's battle back
    // stand on the platforms while state==='intro'; either may be null
    // (trainer without a battle sprite / headless) and the intro then
    // keeps that side's battler, exactly as before. Presentation only.
    this._introFoeArt = null;
    this._introAllyArt = null;
    // Premium+ W2 (TR-2/TR-4): pose variants of the intro figures —
    // the throw pose shown while each side's first send-out ball is in
    // flight, and the foe trainer's defeat pose for the victory beat.
    this._introFoeThrow = null;
    this._introAllyThrow = null;
    this._defeatFoeArt = null;
    if (typeof document !== 'undefined') {
      try {
        this._introFoeArt = trainerBattleArt(document, this.trainer);
        this._introAllyArt = playerBattleBackArt(document);
        this._introFoeThrow = trainerPoseArt(document, this.trainer, 'throw');
        this._introAllyThrow = playerPoseArt(document, 'throw');
        this._defeatFoeArt = trainerPoseArt(document, this.trainer, 'defeat') || this._introFoeArt;
      } catch (e) { this._introFoeArt = null; this._introAllyArt = null; }
    }
    this.t = 0;
    this.msg = '';
    // W12-T4 ceremony themes: the entryVariant the constructor already
    // computed picks the battle's music class — boss-class trainers
    // (badge holders + boss ids) get the leader theme, legendary/uncatchable
    // presences get the legendary theme; ordinary trainer and wild battles
    // keep their themes (verify-audio [8] pins this selection).
    const battleTheme = this.entryVariant === 'boss' ? 'battle-leader-theme'
      : this.entryVariant === 'legendary' ? 'battle-legendary-theme'
      : this.kind === 'trainer' ? 'battle-trainer-theme' : 'battle-wild-theme';
    g.audio.playMusic(battleTheme, { area: false });
    if (this.kind === 'trainer') {
      const t0 = this.trainer.team[0];
      // ADR-025 §4: difficulty levers land at instantiation — trainer team
      // levels (rules.trainerLevelFor) and foe IV treatment (tuneFoeMon).
      this.foeMon = authoredMoves(makeMon(t0.species, trainerLevelFor(g.state, this.trainer, t0.level), SPECIES, MOVES), t0);
      if (t0.nickname) this.foeMon.nickname = t0.nickname; // e.g. the duo's named mons
    }
    tuneFoeMon(this.foeMon, g.state);
    // ADR-025 §3 (Phase 3): foe keepsake lever (rules.foeKeepsakeFor) —
    // Story none, Classic leader aces only, Challenge all leader teams;
    // wild foes (no trainer) never hold one.
    const ks0 = foeKeepsakeFor(g.state, this.trainer, 0, this.trainer ? this.trainer.team.length : 0);
    if (ks0) this.foeMon.keepsake = ks0;
    this.foeAi = effectiveAiFor(g.state, this.trainer);
    // ADR-025 §1 (Grounds): resolve the Ground ONCE, from the map the
    // battle starts in (returnTo is the overworld scene, whose mapId is
    // the current map — indoors overrides outdoors by construction);
    // story.position is the fallback for battles built without an
    // overworld. R2 Story halving/twist-off is folded into the field by
    // resolveField, so the engines never re-check difficulty.
    const battleMapId = (this.returnTo && this.returnTo.mapId)
      || (g.state.story && g.state.story.position && g.state.story.position.map) || null;
    this.field = this.groundPin
      ? resolveFieldForGround(this.groundPin, difficultyOf(g.state))
      : resolveField(battleMapId, difficultyOf(g.state));
    this.fieldBanner = this.field.banner;
    this.ally = this.firstAble(g);
    this.foe = this.foeMon;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    this.allyStages = this.ally.stages;
    if (this.allyStages.acc === undefined) { this.allyStages.acc = 0; this.allyStages.eva = 0; }
    // Fidelity pack (ADR-018): XP is split among participants — mons that
    // were active against THIS foe. Reset per foe in afterFaintFoe.
    this.participants = new Set([this.ally]);
    this.runAttempts = 0;
    this.turn = 1;
    // F2: per-side judge counters, tracked ONLY under facility (the
    // Arena's Mind/Skill inputs; Body is read live from team HP).
    // foeMaxTrail records each foe's maxHp as it enters so Body's
    // foe fraction stays exact even after tuneFoeMon's IV rescale.
    this.facilityStats = this.facility ? {
      ally: { moves: new Set(), attempted: 0, landed: 0 },
      foe: { moves: new Set(), attempted: 0, landed: 0 },
    } : null;
    this._judged = false;
    this.foeMaxTrail = this.foe ? [this.foe.maxHp] : [];
    this.actions = [];
    this.animQ = [];
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.xpAnim = 0;
    this.shakeT = 0;
    // WP3 (ADR-026 elevation pass, research §1.5): trauma-based shake
    // replaces the binary shakeT magnitudes for classic battles —
    // offset = 12px x trauma^2, one value, decayed in update(); shakeT
    // remains only as the legacy timer other paths poke. Message
    // holds (hitstop / faint beat) live in _msgHoldUntil/_nextMsgHold
    // — see say() and the msgOpen branch in update().
    this.trauma = 0;
    this.flashT = 0;
    this.fadeT = 0;      // P0/E11: reduced-motion substitute for shake/flash (100ms fade)
    this.atkFx = null;   // { side, t } — README attack transform: 1.2x for 3 frames then back
    this.impactFx = null; // { side, t } — README impact: white palette-swap 2 frames + shake
    this.faintFx = null;  // { side, spr, t } — README faint: sink 8px + fade to 0 over 20 frames
    this.xpBarAnim = null; // [{ mon, from, to }] — P0/E3 XP bar ease-out over 600ms
    this.xpFlashT = 0;    // level-up flash on the XP bar
    this._lastMoveIdx = 0; // P0/E9: cursor memory (last-used move pre-selected)
    this._lowHpPulseT = 0; // P1/E7: plate pulse on first red crossing (skipped under reduced motion)
    this._tutFightDone = false; // P0/C7: guided first-catch tutorial stage flags
    this._tutStage = null;
    this.catchFx = null; // P1/E10: success starburst after the catch click
    // W1 FX state (see the W1 header block): pooled particles, the one
    // active effect sequence, knockback/recoil displacement, send-out /
    // recall entries, and the FX-6 entry variant. All preallocated or
    // plain scalars — nothing here allocates per frame.
    this.fxPool = [];
    for (let i = 0; i < FX_POOL_MAX; i++) this.fxPool.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 1, sz: 2, col: '#fff', grav: 0 });
    this.fxSeq = null;   // { def, plan, t, dur, atkSide, defSide, seed, burstAt, bursts, dull }
    this.fxKb = { ally: { t: 1e9, dist: 0 }, foe: { t: 1e9, dist: 0 } }; // knockback clock/dist per side
    this.fxRecoil = { ally: { t: 1e9 }, foe: { t: 1e9 } };
    this._fxLastMove = { ally: null, foe: null }; // consecutive-repeat truncation tracking
    this.entryFx = { ally: null, foe: null };     // { t, ballId } send-out in flight
    this.recallFx = null;                          // { side, spr, t } switch-out shrink
    this._ballArtCache = {};
    this.entryVariant = this.kind === 'trainer'
      ? ((this.trainer && (this.trainer.badge || BOSS_TRAINER_IDS.has(String(this.trainer.id || '').toLowerCase()))) ? 'boss' : 'trainer')
      : (LEGENDARY_SPECIES.has(this.foeMon && this.foeMon.speciesId) || this.uncatchable ? 'legendary' : 'wild');
    this.entryT = 0; // FX-6 transition clock (ms since enter)
    this._exitStartT = -1;
    this.catchState = null;
    this.fled = false;
    this.critCap = false;
    this.log = [];
    g.ui.log.push({ ui: 'battle', kind: this.kind, foe: this.foe.speciesId });
    const foeName = displayName(this.foe, SPECIES);
    g.audio.playCry(this.foe.speciesId);   // synthesized cry, never sampled
    g.audio.playCry(this.ally.speciesId);
    // W1 FX-5: every battle opens with both send-outs (ball arc ->
    // burst -> materialize, <=500ms). The cries above land with the
    // appearance lines; the materialize burst is timed to the same
    // opening beat. RT runs its own arena entry and is untouched.
    if (!this.rtMode) { this.fxStartEntry('foe', 'pokeball'); this.fxStartEntry('ally', 'pokeball'); }
    if (this.tutorial) {
      // Scripted first-catch gate: the tips teach the loop (weaken -> throw),
      // the engine guarantees the outcome (endure + weakened auto-catch).
      this.say('Wild ' + foeName + ' appeared!', () => {
        this.say("AIDE (via KinGear): There's your first catch! One Thunder Shock to weaken it —", () => {
          this.say('— then open the BAG and throw a Capture Orb while its HP is yellow!', () => this.announceGround(() => this.toCommand()));
        });
      });
    } else if (this.kind === 'trainer') {
      // GB-era flow idiom: challenge line, then the lead's send-out, then
      // the Ground announcement before the first command (ADR-025 §1).
      this.say('Trainer ' + this.trainer.name + ' wants to battle!', () => {
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => this.announceGround(() => this.toCommand()));
      });
    } else {
      this.say('Wild ' + foeName + ' appeared!', () => this.announceGround(() => this.toCommand()));
    }
  }

  // ADR-025 §1: the Ground announcement — one line before the first
  // command, shared by both engines (RT battles pass through the same
  // enter() chain before rtInit). Open Ground shows nothing: no rules,
  // no banner — the system teaches by contrast.
  announceGround(cb) {
    if (this.fieldBanner) this.say(this.fieldBanner, cb);
    else if (cb) cb();
  }

  // WP3 Ground legibility: the on-demand readout behind SELECT at the
  // classic command grid — the current Ground with its EXACT effects
  // (the live factors, Story-halving included, read off the field
  // object itself) plus both sides' active stat-stage changes.
  // Presentation only: reads state, changes nothing.
  showGroundReadout() {
    const g = this.game;
    const f = this.field;
    const lines = [];
    if (!f || !f.boostType) {
      lines.push('Open Ground — no field effects. Every move lands exactly as authored.');
    } else {
      lines.push(f.name + ': ' + f.boostType + ' moves hit x' + f.boostFactor + ', ' + f.dampenType + ' moves hit x' + f.dampenFactor + '.');
      lines.push('Twist: ' + (f.twist ? (GROUND_TWIST_TEXT[f.twist] || 'None.') : 'None on this difficulty.'));
    }
    const stageLine = (label, st) => {
      const parts = [];
      for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) if (st && st[k]) parts.push(k.toUpperCase() + (st[k] > 0 ? '+' : '') + st[k]);
      return label + ': ' + (parts.length ? parts.join(', ') : 'no stage changes');
    };
    lines.push(stageLine(displayName(this.ally, SPECIES), this.allyStages));
    lines.push(stageLine(displayName(this.foe, SPECIES), this.foeStages));
    g.ui.say(lines, () => this.toCommand(), '');
  }

  safariFleeCheck() {
    // Safari flee model (ADR-019 simplification, documented): base 10%,
    // rock +15%, bait -8%, skittish species (catch rate <= 45) +5%.
    const g = this.game;
    const rate = SPECIES[this.foe.speciesId].catchRate;
    let p = 0.10 + (this.safariRock ? 0.15 : 0) - (this.safariBait ? 0.08 : 0) + (rate <= 45 ? 0.05 : 0);
    if (roll(Math.max(0.02, p), g.rng.battle)) {
      this.say('Wild ' + displayName(this.foe, SPECIES) + ' fled!', () => { this.fled = true; this.endBattle(true); });
      return true;
    }
    return false;
  }

  // F2: the ally team source — the facility override array when the
  // battle carries one (the entered/rental team objects; state.party
  // is never swapped), else the real party. Every battle-relevant
  // state.party read routes through here (the register lists the
  // routed reads and the deliberately-left cosmetic ones).
  allyTeam(g) {
    return (this.facility && this.facility.partyOverride) || g.state.party;
  }

  firstAble(g) {
    // Stage J6: an Egg can never be the battle lead — the first able
    // NON-EGG mon leads; the all-egg fallback keeps the historical
    // party[0] shape (an all-egg party is unreachable: the deposit
    // guards refuse to create one).
    const team = this.allyTeam(g);
    for (const m of team) if (m.hp > 0 && !m.egg) return m;
    return team.find((m) => !m.egg) || team[0];
  }

  say(text, cb) {
    this.msg = text;
    this.msgCb = cb || null;
    this.msgOpen = true;
    // WP3: a caller may arm a dismissal hold for THIS message
    // (hitstop on the damage line, the faint beat on the faint line)
    // via this._nextMsgHold just before calling say().
    this._msgHoldUntil = this._nextMsgHold ? (this._clockMs || 0) + this._nextMsgHold : 0;
    this._nextMsgHold = 0;
    this._msgEarlyPress = false;
    this.game.ui.log.push({ ui: 'battle-msg', text });
  }

  update(dt) {
    const g = this.game;
    const input = g.input;
    const st = g.state.settings;
    // WP3 battle clock: advances only on real frames (update ticks) —
    // the message-hold math below reads it; callback-driven harness
    // drains never advance it and bypass holds entirely by invoking
    // message callbacks directly, exactly as they always have.
    this._clockMs = (this._clockMs || 0) + dt * 1000;
    // Screen shake / flash decay — P0/E11: gated on the Screen-shake option +
    // reduced motion (assignment is gated at the source; decay is unconditional).
    // Trauma shake (WP3): offset = 12px x trauma^2 so small hits stay
    // subtle and big ones kick; decays ~2.2/s (a 0.55 hit settles in
    // ~250ms — inside the message beat); one value = one shake at a
    // time, strongest event wins by max(). Settings gates unchanged:
    // reduced motion or shake-off or anims-off = no offset (the
    // reduced-motion flash substitute lives at the call sites).
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
      if (!g.state.settings.reducedMotion && g.state.settings.shake && g.state.settings.battleAnims !== false) {
        const amp = this.trauma * this.trauma * 12;
        g.renderer.shakeX = (Math.random() - 0.5) * 2 * amp;
        g.renderer.shakeY = (Math.random() - 0.5) * 2 * amp;
      } else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    } else if (this.shakeT > 0) { this.shakeT -= dt * 1000; g.renderer.shakeX = (Math.random() - 0.5) * 8; g.renderer.shakeY = (Math.random() - 0.5) * 8; }
    else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    if (this.flashT > 0) { this.flashT -= dt * 1000; g.renderer.flashA = Math.max(0, this.flashT / 60) * 0.8; }
    // P0/E11: reduced-motion substitute — a gentle 100ms fade instead of shake/flash.
    if (this.fadeT > 0) {
      this.fadeT -= dt * 1000;
      g.renderer.fadeA = Math.max(0, this.fadeT / 100) * 0.35;
      g.renderer.fadeColor = '#ffffff';
      if (this.fadeT <= 0) g.renderer.fadeA = 0;
    }
    // README runtime transforms.
    if (this.atkFx) { this.atkFx.t += dt * 1000; if (this.atkFx.t > 100) this.atkFx = null; } // 3 frames @30Hz
    if (this.impactFx) { this.impactFx.t += dt * 1000; if (this.impactFx.t > (this.impactFx.dur || 66)) this.impactFx = null; } // W1 FX-2: tiered white-swap (66ms ordinary / 110ms SE-crit); default stays 66
    if (this.faintFx) { this.faintFx.t += dt * 1000; if (this.faintFx.t > 660) this.faintFx = null; } // 20 frames
    if (this.catchFx) { this.catchFx.t += dt * 1000; if (this.catchFx.t > 500) this.catchFx = null; } // P1/E10 starburst
    // W1 FX clocks (visual only; particle integration lives here so
    // render() stays a pure draw).
    this.entryT += dt * 1000;
    this.fxTick(dt * 1000);
    for (const sd of ['ally', 'foe']) {
      this.fxKb[sd].t += dt * 1000;
      this.fxRecoil[sd].t += dt * 1000;
      if (this.entryFx[sd]) { this.entryFx[sd].t += dt * 1000; if (this.entryFx[sd].t > 500) this.entryFx[sd] = null; }
    }
    if (this.recallFx) { this.recallFx.t += dt * 1000; if (this.recallFx.t > 250) this.recallFx = null; }
    if (this.xpFlashT > 0) this.xpFlashT -= dt * 1000;
    if (this._lowHpPulseT > 0) this._lowHpPulseT -= dt * 1000;

    // Animated HP drain (90 HP/s) — P0/E5: reduced motion snaps instantly.
    this.drainHp(dt);

    // UI v2.3: RT cooldown clocks tick even while a battle menu/dialogue
    // freezes the arena — the unified FIGHT window displays live cooldowns,
    // and a cooling move must be able to come back while the player is
    // deciding (previously the clocks only ran inside updateRt, which the
    // modal UI starves, so a move picked from the window could deadlock
    // on its own cooldown). updateRt ticks the same clocks when unfrozen;
    // the two paths are mutually exclusive per frame.
    if (this.rtMode && this.rt && this.state === 'rt' && typeof this.rtTickClocks === 'function' && this.rtFrozen()) this.rtTickClocks(dt * 1000);

    // Ground legibility (WP3): SELECT at the classic command grid opens
    // the on-demand Ground + stat-stage readout. The grid stays exactly
    // four commands (verify-live counts them); SELECT is consumed here
    // before the UI layer, and the readout is a plain dialogue that
    // returns to the command grid.
    if (!this.rtMode && this.state === 'command' && input.wasPressed('select')) { this.showGroundReadout(); return; }

    if (g.ui.update(dt)) return;
    if (this.msgOpen) {
      // WP3 message holds (hitstop / faint beat): a held message cannot
      // be dismissed until its hold expires — but a press during the
      // hold is REMEMBERED and dismisses it the moment the hold ends.
      // Input is never eaten; the say() chain itself is never delayed,
      // so resolution order/RNG are untouched.
      const pressed = input.wasPressed('a') || input.wasPressed('start');
      if (this._msgHoldUntil && this._clockMs < this._msgHoldUntil) {
        if (pressed) this._msgEarlyPress = true;
      } else if (pressed || this._msgEarlyPress) {
        this._msgEarlyPress = false;
        this._msgHoldUntil = 0;
        this.msgOpen = false;
        const cb = this.msgCb; this.msgCb = null;
        if (cb) cb();
        else this.afterMsg();
      }
      return;
    }
    switch (this.state) {
      case 'intro': break; // driven by msg cb
      case 'rt': this.updateRt(dt); break;
      case 'command': this.updateCommand(input); break;
      case 'resolve': this.updateResolve(dt); break;
      case 'catchseq': this.updateCatch(dt); break;
      case 'xp': this.updateXp(dt); break;
      case 'victory': case 'defeat': break;
    }
  }

  afterMsg() {
    const s = this.state;
    if (s === 'intro') this.toCommand();
    else if (s === 'resolve') this.nextAction();
    else if (s === 'victory') this.finishVictory();
    else if (s === 'defeat') this.finishDefeat();
    else if (s === 'faintfoe') this.afterFaintFoe();
  }

  toCommand() {
    this.state = 'command';
    // F2 facility laws at the command-phase gate (this is the one
    // place every turn funnels through): the Arena judge resolves
    // BEFORE a new command opens when the turn cap has passed with
    // the battle unresolved; the Palace never opens a command at
    // all — the ally acts on the shared AI (autoAlly).
    if (this.facility && !this._judged && this.foe && this.foe.hp > 0 && this.ally && this.ally.hp > 0) {
      if (this.facility.maxTurns && this.facility.judge && this.turn > this.facility.maxTurns) { this.resolveJudge(); return; }
      if (this.facility.autoAlly) {
        this.playerAction = aiActionFor(this.game, this.ally, this.foe, {});
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
        return;
      }
    }
    if (this.rtMode) {
      // ADR-020: real-time flow replaces the command menu. First call enters
      // the arena; a NEW foe (trainer sent out the next mon) resets it;
      // anything else (party-menu return) just resumes.
      if (!this.rt) this.rtInit();
      else if (this.foe !== this._rtLastFoe) this.rtResetFoe();
      else this.state = 'rt';
      return;
    }
    if (this.safari) {
      const balls = this.game.state.bag.safariball || 0;
      const items = [
        { label: 'SAFARI BALL x' + balls, value: 'safariball', disabled: balls <= 0 },
        { label: 'BAIT', value: 'bait' },
        { label: this.safariRockLabel, value: 'rock' },
        { label: 'RUN', value: 'safarirun' },
      ];
      this.game.ui.showCommands(items, (value) => this.onCommand(value), { stickyCancel: true });
      return;
    }
    // P0/C7: guided first-catch tutorial — FIGHT highlighted first (others dimmed),
    // then BAG highlighted once the foe is weakened. Dimmed = de-emphasized, still usable.
    const tut = this.tutorial;
    const items = [
      { label: 'FIGHT', value: 'fight', dimmed: tut && this._tutStage === 'bag' },
      { label: 'BAG', value: 'bag', dimmed: tut && this._tutStage !== 'bag' },
      { label: 'PARTY', value: 'party', dimmed: tut },
      // GD: no running from the scripted tutorial — it's a lesson, not a gamble.
      // F2: no running from a facility battle either — a Frontier
      // contest is finished or forfeited at the desk, never fled.
      { label: this.kind === 'wild' ? 'RUN' : 'RUN', value: 'run', disabled: this.kind !== 'wild' || tut || !!this.facility },
    ];
    let focus = null;
    if (tut && !this._tutFightDone) focus = 'fight';
    else if (tut && this._tutStage === 'bag') focus = 'bag';
    this.game.ui.showCommands(items, (value) => this.onCommand(value), { focus, stickyCancel: true });
  }

  updateCommand() { /* menu modal drives via ui */ }

  // Resolution is message-driven: every resolve beat opens a say() whose
  // callback advances the queue, so there is no per-frame work here.
  // This method must EXIST — update()'s state switch has called it since
  // the engine's first version without a definition ever landing, and
  // any frame that reached state 'resolve' with no message open would
  // have thrown (P0 hardening, 2026-10-28; no driven flow reaches it —
  // every resolve entry opens a message synchronously).
  updateResolve() {}

  onCommand(value) {
    const g = this.game;
    if (value === null) { this.toCommand(); return; } // cancelled -> back
    if (this.safari) {
      if (this.onSafariAction) this.onSafariAction();
      if (value === 'safarirun') { this.fled = true; this.endBattle(true); return; }
      if (value === 'safariball') { this.beginCatch('safariball'); return; }
      if (value === 'bait' || value === 'rock') {
        if (value === 'bait') { this.safariBait = true; this.safariRock = false; }
        else { this.safariRock = true; this.safariBait = false; }
        const name = displayName(this.foe, SPECIES);
        this.say(value === 'bait' ? 'You threw bait! ' + name + ' is eating...' : 'You threw ' + (this.safariRockLabel === 'ROCK' ? 'a rock' : this.safariRockLabel.toLowerCase()) + '! ' + name + ' is angry!', () => {
          if (this.safariFleeCheck()) return;
          this.toCommand();
        });
        return;
      }
    }
    if (value === 'fight') {
      // P0/E9: 2x2 move grid — name + type badge pill (icon+text) + PP + power/acc;
      // 0-PP rows grayed with a slash; cursor memory pre-selects the last-used move.
      const ally = this.ally;
      const items = ally.moves.map((m, i) => {
        const mv = MOVES[m.id];
        const disabledMove = ally.disableT > 0 && ally.disabledMove === i;
        return {
          label: mv.name + ' (' + mv.type + ') ' + m.pp + '/' + m.maxPp,
          value: i, disabled: m.pp <= 0 || disabledMove, zeroPp: m.pp <= 0, move: m,
        };
      });
      items.push({ label: 'Back', value: -1, wide: true });
      this.state = 'moves';
      const rowHtml = (it) => {
        if (it.value === -1) return '<span>' + it.label + '</span>';
        const mv = MOVES[it.move.id];
        return '<span class="mvcell"><span class="mvname">' + mv.name + '</span>'
          + typePill(mv.type)
          + '<span class="mvpp">' + it.move.pp + '/' + it.move.maxPp + ' PP</span>'
          + '<span class="mvpow">' + (mv.power || '—') + ' pw / ' + (mv.acc || '—') + ' ac</span></span>';
      };
      g.ui.showMenu('Choose a move', items, (v) => {
        if (v === null || v === -1) { this.toCommand(); return; }
        this._lastMoveIdx = v; // P0/E9 cursor memory
        this.playerAction = { type: 'move', idx: v };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      }, { battle: true, grid: true, initialIdx: Math.min(this._lastMoveIdx, items.length - 1), rowHtml, menuClass: 'battlewin' });
    } else if (value === 'bag') {
      // F2: the Frontier supplies the contest — the player's own bag
      // stays closed, EXCEPT the Pyramid run bag (pyramidBag mode),
      // whose menu lists ONLY the run-bag items.
      if (this.facility && !this.facility.pyramidBag) {
        this.say('The Frontier supplies the contest — your bag stays closed.', () => this.toCommand());
        return;
      }
      if (this.facility && this.facility.pyramidBag) { this.openPyramidBag(); return; }
      this.state = 'bag';
      const items = [];
      for (const bid of Object.keys(BALLS)) {
        const n = g.state.bag[bid] || 0;
        items.push({ label: BALLS[bid].name + ' x' + n, value: bid, disabled: n <= 0 || this.kind !== 'wild', pocket: 'balls' });
      }
      // AUDIT FIX (S-14): the battle bag used to stock ONLY plain Potion —
      // every other medicine the player owned was unreachable in battle.
      // It now carries the full battle-usable medicine pocket (heals,
      // cures, revives, PP — data/items.mjs semantics, field-identical).
      const meds = this.battleMedicineIds();
      for (const mid of meds) {
        items.push({ label: ITEMS[mid].name + ' x' + g.state.bag[mid], value: mid, pocket: 'medicine' });
      }
      items.push({ label: 'Back', value: null });
      // P0/C7: in the guided tutorial, the Capture Orb row is highlighted once the foe is weakened.
      const focusBall = this.tutorial && this._tutStage === 'bag';
      g.ui.showMenu('Bag', items, (v) => {
        if (v === null) { this.toCommand(); return; }
        // Balls live in ITEMS too (pocket 'balls') — BALLS membership is
        // the dispatch test, medicine is everything else.
        if (!BALLS[v] && ITEMS[v]) { this.useBattleItem(v); return; }
        this.playerAction = { type: 'ball', ball: v };
        this.foeAction = null; // throwing a ball: foe still acts? DS: ball replaces your move; foe moves first if faster. Simplify: foe acts after throw fails only.
        this.beginCatch(v);
      }, { focusValue: focusBall ? 'pokeball' : null, menuClass: 'battlewin bagwin', bagTabs: meds.length ? ['balls', 'medicine'] : ['balls'] });
    } else if (value === 'party') {
      this.openPartyMenu(false);
    } else if (value === 'run') {
      if (this.kind === 'wild') {
        // Gen-1 escape formula (ADR-018): F = allySpe*128/foeSpe + 30*attempts;
        // escape iff F > 255 or a 0-255 roll lands under F. Failure costs the
        // turn — the foe acts.
        this.runAttempts++;
        const allySpe = Math.max(1, this.ally.stats.spe);
        const foeSpe = Math.max(1, this.foe.stats.spe);
        const F = Math.floor((allySpe * 128) / foeSpe) + 30 * this.runAttempts;
        if (F > 255 || Math.floor(g.rng.battle() * 256) < F) {
          g.audio.playSfx('battle-run');
          this.say('Got away safely!', () => { this.fled = true; this.endBattle(true); });
        } else {
          this.say("Can't escape!", () => {
            this.playerAction = { type: 'ran' };
            this.foeAction = this.chooseFoeAction();
            this.state = 'resolve';
            const mkFoe = (action) => {
              const mon = this.foe;
              const stats = this.effStats(mon, this.foeStages);
              const move = action.type === 'move' ? MOVES[mon.moves[action.idx].id] : null;
              return { side: 'foe', action, mon, stats, priority: move ? (move.priority || 0) : 0, move };
            };
            this.actions = [mkFoe(this.foeAction)];
            this.nextAction();
          });
        }
      } else {
        this.say("Can't escape a trainer battle!", () => this.toCommand());
      }
    }
  }

  openPartyMenu(inFaint) {
    const g = this.game;
    const items = this.allyTeam(g).map((m, i) => {
      const sp = SPECIES[m.speciesId];
      const tag = m === this.ally ? ' (active)' : '';
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + ' ' + m.hp + '/' + m.maxHp + tag, value: i, disabled: m.hp <= 0 || m === this.ally || !!m.egg }; // J6: eggs can't be sent out
    });
    // AUDIT FIX (S-12, blocker): a forced faint switch has NO way out in
    // Platinum — offering Back (or honouring B/Esc) consumed the menu and
    // stranded the battle with no command state. No Back row in faint
    // mode, and a cancel simply re-opens the forced choice.
    if (!inFaint) items.push({ label: 'Back', value: -1 });
    g.ui.showMenu(inFaint ? 'Choose next Kin' : 'Party', items, (v) => {
      if (v === null || v === -1) { if (inFaint) this.openPartyMenu(true); else this.toCommand(); return; }
      const old = this.ally;
      this.ally = this.allyTeam(g)[v];
      this.allyStages = this.ally.stages;
      if (this.allyStages.acc === undefined) { this.allyStages.acc = 0; this.allyStages.eva = 0; }
      this.participants.add(this.ally); // switched-in mons share this foe's XP
      this.hpAnim.ally = this.ally.hp;
      // ADR-025 §3: trigger-shaped keepsakes are also evaluated at the
      // switch check — an incoming holder already at <=25% HP catches
      // its Second Wind as it takes the field (no attack context, so
      // the Tortoise Charm can never fire here).
      const ksLines = this.ksApplyTriggers('ally', {});
      const proceedSwitch = () => {
        // W1 FX-5: switch-out recall (old mon shrinks to its ball)
        // layered under the incoming mon's send-out arc.
        if (!inFaint && !this.rtMode) {
          const oldArt = g.spriteCache[old.speciesId] || g.spriteCache.partner;
          if (oldArt) this.fxStartRecall('ally', oldArt.back);
        }
        if (!this.rtMode) this.fxStartEntry('ally', 'pokeball');
        // ADR-026 WP3 (presentation only, classic theater): the incoming
        // mon's cry lands WITH its "Go!" line — switch-ins were the one
        // send-out in the classic flow with no cry at all. RT keeps its
        // own soundscape untouched.
        if (!this.rtMode) g.audio.playCry(this.ally.speciesId);
        if (inFaint) {
          this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this.toCommand());
        } else if (this.rtMode) {
          // ADR-020: live switching — no turn is spent; the incoming mon is
          // briefly vulnerable (no dodge i-frames) as the switch cost.
          this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
            if (this.rt) { this.rt.switchVulnT = 1000; this.rt.iframes = 0; this.state = 'rt'; }
            else this.toCommand();
          });
        } else {
          this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
            this.playerAction = { type: 'switch', from: old };
            this.foeAction = this.chooseFoeAction();
            this.beginTurn();
          });
        }
      };
      if (ksLines.length) this.say(ksLines.join(' '), proceedSwitch);
      else proceedSwitch();
    });
  }

  // ---- AUDIT FIX (S-14): full battle medicine (shared with RT) ----
  // Battle-usable = medicine pocket minus level-ups (Rare Candy's
  // mid-battle evolution flow doesn't exist; honest exclusion, register).
  battleMedicineIds() {
    const g = this.game;
    return Object.keys(ITEMS).filter((id) => {
      const it = ITEMS[id];
      return it.pocket === 'medicine' && !it.levelUp && (g.state.bag[id] || 0) > 0;
    });
  }

  // Same applicability rules as the field bag (main-systems.mjs), with one
  // Platinum correction: a heal that also cures status works at full HP
  // when the target is statused.
  medicineDisabledFor(it, m) {
    if (it.revive) return m.hp > 0;
    if (it.cure) return m.hp <= 0 || (it.cure !== 'all' && m.status !== it.cure) || (it.cure === 'all' && !m.status);
    if (it.heal) return m.hp <= 0 || (m.hp >= m.maxHp && !(it.cureStatus && m.status));
    if (it.ppRestore || it.ppRestoreAll) return m.hp <= 0;
    return true;
  }

  // Applies the item's effect to mon m; moveIdx only for ppRestore.
  // Returns the result line. Caller owns the bag decrement + turn flow.
  applyMedicineTo(itemId, m, moveIdx) {
    const it = ITEMS[itemId];
    const name = displayName(m, SPECIES);
    if (it.revive) { m.hp = Math.floor(m.maxHp * it.revive); m.status = null; return name + ' was revived!'; }
    if (it.heal) {
      const before = m.hp;
      const hadStatus = m.status;
      m.hp = Math.min(m.maxHp, m.hp + it.heal);
      if (it.cureStatus) m.status = null;
      const gained = m.hp - before;
      if (gained > 0) return name + ' recovered ' + gained + ' HP!';
      if (it.cureStatus && hadStatus) return name + ' was cured of its status!';
      return name + ' recovered HP!';
    }
    if (it.cure) { m.status = null; m.confused = false; return name + ' was cured of its status!'; }
    if (it.ppRestore && moveIdx !== null && moveIdx !== undefined) {
      const mv = m.moves[moveIdx];
      mv.pp = Math.min(mv.maxPp, mv.pp + it.ppRestore);
      return MOVES[mv.id].name + "'s PP was restored!";
    }
    if (it.ppRestoreAll) { for (const mv of m.moves) mv.pp = Math.min(mv.maxPp, mv.pp + it.ppRestoreAll); return name + "'s PP was restored!"; }
    return it.name + ' used.';
  }

  useBattleItem(itemId) {
    const g = this.game;
    const it = ITEMS[itemId];
    const team = this.allyTeam(g);
    const targets = team.map((m, i) => ({
      label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp + (m.status ? ' [' + m.status + ']' : ''),
      value: i, disabled: this.medicineDisabledFor(it, m),
    }));
    targets.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Use ' + it.name + ' on...', targets, (v) => {
      // AUDIT FIX (S-37b): Back returns to the battle Bag it came from,
      // not all the way to the command grid.
      if (v === null || v === -1) { this.onCommand('bag'); return; }
      const m = team[v];
      const finishUse = (line) => {
        // F2: under the Pyramid run bag the item is consumed from
        // state.frontier.pyramidBag, never from the player's bag.
        if (this.facility && this.facility.pyramidBag) {
          const arr = g.state.frontier.pyramidBag;
          const ix = arr.indexOf(itemId);
          if (ix >= 0) arr.splice(ix, 1);
        } else g.state.bag[itemId]--;
        if (m === this.ally) this.hpAnim.ally = m.hp; // snap if active
        g.audio.playSfx('heal');
        this.say(line, () => {
          this.playerAction = { type: 'item' };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      };
      if (it.ppRestore) {
        const mvItems = m.moves.map((mv, mi) => ({
          label: MOVES[mv.id].name + ' ' + mv.pp + '/' + mv.maxPp, value: mi, disabled: mv.pp >= mv.maxPp,
        }));
        mvItems.push({ label: 'Back', value: -1 });
        g.ui.showMenu('Restore which move?', mvItems, (mi) => {
          if (mi === null || mi === -1) { this.useBattleItem(itemId); return; }
          finishUse(this.applyMedicineTo(itemId, m, mi));
        }, { menuClass: 'battlewin' });
        return;
      }
      finishUse(this.applyMedicineTo(itemId, m, null));
    }, { menuClass: 'battlewin' });
  }

  // F2: the Pyramid run-bag menu — lists ONLY the items the mountain
  // let the player find (state.frontier.pyramidBag), one row per
  // distinct usable medicine with its run-bag count. Using one flows
  // through useBattleItem, whose consumption reads the run bag.
  openPyramidBag() {
    const g = this.game;
    this.state = 'bag';
    const counts = {};
    for (const id of g.state.frontier.pyramidBag) counts[id] = (counts[id] || 0) + 1;
    const items = Object.keys(counts)
      .filter((id) => ITEMS[id] && !ITEMS[id].levelUp)
      .map((id) => ({ label: ITEMS[id].name + ' x' + counts[id], value: id, pocket: 'medicine' }));
    items.push({ label: 'Back', value: null });
    if (items.length === 1) {
      this.say('The Pyramid Bag is empty. The mountain provides — eventually.', () => this.toCommand());
      return;
    }
    g.ui.showMenu('Pyramid Bag', items, (v) => {
      if (v === null) { this.toCommand(); return; }
      this.useBattleItem(v);
    }, { menuClass: 'battlewin bagwin' });
  }

  // F2 (Arena): the live judge inputs for one side — the tracked
  // counters plus Body read live from team HP (ally: the override
  // team's fractions; foe: fainted foes count 0, the current foe its
  // live fraction, unfielded foes full — via foeMaxTrail).
  // F3 fix: the foe index is trainerIdx — this once read a foeIndex
  // field that never existed, so the active foe (and fainted foes)
  // always counted at FULL HP and the foe's Body never moved.
  facilityTeamStats(side) {
    const g = this.game;
    const c = this.facilityStats[side];
    let total = 0, rem = 0;
    if (side === 'ally') {
      for (const m of this.allyTeam(g)) { total += m.maxHp; rem += Math.max(0, m.hp); }
    } else if (this.kind === 'trainer' && this.trainer) {
      this.trainer.team.forEach((t, i) => {
        const mh = this.foeMaxTrail[i] !== undefined ? this.foeMaxTrail[i]
          : hpValue(SPECIES[t.species].base.hp, t.level, 31);
        total += mh;
        if (i < this.trainerIdx) { /* fainted: 0 remaining */ }
        else if (i === this.trainerIdx) rem += Math.max(0, this.foe.hp);
        else rem += mh;
      });
    } else if (this.foe) { total = this.foe.maxHp; rem = Math.max(0, this.foe.hp); }
    return {
      movesUsed: [...c.moves], attempted: c.attempted, landed: c.landed,
      hpFrac: total > 0 ? rem / total : 0,
    };
  }

  // F2 (Arena): the turn cap passed unresolved — the judge decides.
  // The controller's judge (game/frontier.mjs judgeArena) may stamp
  // .total/.parts onto each stats object for the spoken card. The
  // battle then ends through the NORMAL win/defeat paths (which
  // under facility pay no prize, award no XP and cost nothing).
  resolveJudge() {
    this._judged = true;
    this.state = 'resolve';
    const allyStats = this.facilityTeamStats('ally');
    const foeStats = this.facilityTeamStats('foe');
    const verdict = this.facility.judge(allyStats, foeStats) === 'win' ? 'win' : 'loss';
    const card = (allyStats.total !== undefined && foeStats.total !== undefined)
      ? ' The card reads ' + allyStats.total + ' to ' + foeStats.total + '.' : '';
    const foeName = this.trainer ? this.trainer.name : 'the wild side';
    this.say('Time! Three turns are spent — the Arena judge steps in.' + card, () => {
      if (verdict === 'win') {
        this.say('The decision goes to the challenger!', () => { this.state = 'victory'; this.winTrainer(); });
      } else {
        this.say('The decision goes to ' + foeName + '. The Frontier demands a winner.', () => { this.state = 'defeat'; this.finishDefeat(); });
      }
    });
  }

  chooseFoeAction() {
    // F2: the decision itself lives in aiActionFor (above) so the
    // Palace's autoAlly runs the identical code. Behaviour is
    // unchanged: the GD leader opener fires on turn 1 for
    // 'opener-setup' classes; smart classes line-pick; everyone
    // else picks near-randomly (ADR-018/ADR-025).
    return aiActionFor(this.game, this.foe, this.ally, {
      smart: !!(this.trainer && (this.foeAi === 'smart' || this.foeAi === 'opener-setup')),
      openerSetup: !!(this.trainer && this.foeAi === 'opener-setup' && this.turn === 1),
    });
  }

  effStats(mon, stages) {
    const sp = SPECIES[mon.speciesId];
    return {
      atk: Math.floor(mon.stats.atk * stageMultiplier(stages.atk)),
      def: Math.floor(mon.stats.def * stageMultiplier(stages.def)),
      spa: Math.floor(mon.stats.spa * stageMultiplier(stages.spa)),
      spd: Math.floor(mon.stats.spd * stageMultiplier(stages.spd)),
      spe: Math.floor(mon.stats.spe * stageMultiplier(stages.spe)),
    };
  }

  beginTurn() {
    this.state = 'resolve';
    if (this.ally) this.ally.tookPhysicalThisTurn = 0;
    if (this.foe) this.foe.tookPhysicalThisTurn = 0;
    const pa = this.playerAction, fa = this.foeAction;
    const mk = (side, action) => {
      const mon = side === 'ally' ? this.ally : this.foe;
      const stages = side === 'ally' ? this.allyStages : this.foeStages;
      const stats = this.effStats(mon, stages);
      // ADR-025 §1 Mire (classic): Speed stat -10% for mons not
      // Water/Grass/Ground-typed — applied to the turn-order stat
      // resolution (beginTurn is the classic engine's stat entry point,
      // so the RT engine's movement keeps its own -15% arena hook and
      // the two never stack).
      if (this.field && this.field.twist === 'mire') {
        const types = mon.tempTypes || (mon.transformed ? mon.transformed.types : SPECIES[mon.speciesId].types);
        stats.spe = Math.max(1, Math.floor(stats.spe * groundMireSpeedMult(this.field, types)));
      }
      let priority = 0, move = null;
      if (action && action.type === 'move') {
        move = action.struggle ? { name: 'Struggle', type: 'normal', cat: 'physical', power: 50, acc: 100 } : MOVES[mon.moves[action.idx].id];
        priority = move.priority || 0;
      }
      return { side, action, mon, stats, priority, move };
    };
    const order = [];
    if (pa && pa.type !== 'switch' && pa.type !== 'item' && pa.type !== 'ball') order.push(mk('ally', pa));
    if (fa) order.push(mk('foe', fa));
    if (pa && (pa.type === 'switch' || pa.type === 'item' || pa.type === 'ball')) {
      // non-attack actions happen first, then foe acts
      this.actions = fa ? [mk('foe', fa)] : [];
      if (pa.type === 'switch' || pa.type === 'item') { /* already applied */ }
      this.state = 'resolve';
      this.nextAction();
      return;
    }
    // sort by priority -> Speed (paralysis quarters Speed) -> random tiebreak
    const cmp = (x, y) => {
      if (x.priority !== y.priority) return y.priority - x.priority;
      const sx = x.mon.status === 'paralysis' ? Math.floor(x.stats.spe / 4) : x.stats.spe;
      const sy = y.mon.status === 'paralysis' ? Math.floor(y.stats.spe / 4) : y.stats.spe;
      if (sx !== sy) return sy - sx;
      return this.game.rng.battle() < 0.5 ? -1 : 1;
    };
    this.actions = order.slice().sort(cmp);
    this.nextAction();
  }

  nextAction() {
    if (this.state !== 'resolve') return;
    const next = this.actions.shift();
    if (!next) { this.endTurnStatus(); return; }
    if (next.mon.hp <= 0) { this.nextAction(); return; } // fainted mid-turn
    this.execMove(next);
  }

  execMove(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);

    // Status gates — Generation-I semantics (ADR-018).
    if (atk.flinched) {
      atk.flinched = false;
      this.say(atkName + ' flinched and couldn\'t move!', () => this.nextAction());
      return;
    }
    if (atk.mustRecharge) {
      atk.mustRecharge = false;
      this.say(atkName + ' must recharge!', () => this.nextAction());
      return;
    }
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      this.say(atkName + ' is paralyzed! It can\'t move!', () => this.nextAction());
      return;
    }
    if (atk.status === 'sleep') {
      // Gen 1: sleep lasts 1-7 turns, and the turn you wake up is lost.
      if (atk.sleepTurns === undefined || atk.sleepTurns === null) atk.sleepTurns = 1 + Math.floor(g.rng.battle() * 7);
      atk.sleepTurns--;
      if (atk.sleepTurns > 0) { this.say(atkName + ' is fast asleep.', () => this.nextAction()); return; }
      atk.status = null; atk.sleepTurns = null;
      this.say(atkName + ' woke up!', () => this.nextAction());
      return;
    }
    if (atk.status === 'freeze') {
      // Gen 1: no random thaw — only a Fire-type hit thaws (in damage code).
      this.say(atkName + ' is frozen solid!', () => this.nextAction());
      return;
    }
    if (atk.confused) {
      if (atk.confusedTurns === undefined || atk.confusedTurns === null) atk.confusedTurns = 2 + Math.floor(g.rng.battle() * 4);
      atk.confusedTurns--;
      if (atk.confusedTurns <= 0) {
        atk.confused = false; atk.confusedTurns = null;
        this.say(atkName + ' snapped out of confusion!', () => this.execMoveContinue(entry));
        return;
      }
      if (roll(0.5, g.rng.battle)) {
        // Gen 1: 50% self-hit at full typeless 40-power formula (no halving).
        const dmg = Math.max(1, calcDamage(atk.level, 40, entry.stats.atk, entry.stats.def, {}));
        atk.hp = Math.max(0, atk.hp - dmg);
        this.say(atkName + ' hurt itself in confusion!', () => this.checkFaint(entry.side, () => this.nextAction()));
        return;
      }
    }
    this.execMoveContinue(entry);
  }

  execMoveContinue(entry) {
    const g = this.game;
    const atk = entry.mon;
    let mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);
    const defName = displayName(def, SPECIES);

    // Lock-in moves (Wrap/Petal Dance family): the mon keeps using the move
    // until the lock expires; Petal Dance confuses the user afterwards.
    if (atk.lockMove && entry.action && entry.action.type === 'move') {
      entry.action.idx = atk.lockMove.idx;
      mv = MOVES[atk.moves[atk.lockMove.idx].id] || mv;
    }

    // Two-turn charge moves (Solar Beam / Dig / Fly family): first use
    // charges (no PP cost), the locked follow-up executes.
    if (mv.charge && !atk.chargedFor) {
      atk.chargedFor = mv.id;
      atk.lockMove = entry.action && entry.action.type === 'move' ? { idx: entry.action.idx, left: 1, after: null } : null;
      this.say(atkName + ' used ' + mv.name + '!', () => {
        this.say(atkName + ' is charging up!', () => this.nextAction());
      });
      return;
    }
    if (atk.chargedFor === mv.id) atk.chargedFor = null;

    // PP
    if (entry.action && !entry.action.struggle && entry.action.type === 'move') {
      const slot = atk.moves[entry.action.idx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
      atk.lastMoveIdx = entry.action.idx;
    }

    // Bide: accumulate for 2 turns, then release double the damage taken.
    if (mv.effect && mv.effect.bide) {
      if (!atk.bideT) { atk.bideT = 2; atk.bideDmg = 0; this.say(atkName + ' used Bide!', () => this.nextAction()); return; }
      const bd = atk.bideDmg * 2; atk.bideT = 0; atk.bideDmg = 0;
      if (bd <= 0) { this.say(atkName + ' used Bide! But it failed!', () => this.nextAction()); return; }
      this._ksHit = { side: foeSide, hpBefore: def.hp }; noteHitTaken(def);
      def.hp = Math.max(0, def.hp - bd);
      this.say(atkName + ' unleashed energy!', () => this.checkFaint(foeSide, () => this.nextAction()));
      return;
    }
    if (atk.bideT) atk.bideT--;

    // Metronome: become a random other move.
    if (mv.effect && mv.effect.metronome) {
      const pool = Object.keys(MOVES).filter((k) => !['metronome', 'mimic', 'transform', 'bide'].includes(k));
      const pick = pool[Math.floor(g.rng.battle() * pool.length)];
      entry.metronomeMove = MOVES[pick];
      this.say(atkName + ' used Metronome!', () => { entry.move = MOVES[pick]; this.execMoveContinue(entry); });
      return;
    }

    // Accuracy — Gen 1 (ADR-018): move acc x acc/eva stage multiplier;
    // even 100%-acc moves miss 1/256 of the time; neverMiss skips all rolls.
    // OHKO moves use their own Gen-1 rule: hit chance (userLv - targetLv
    // + 30) / 256 — they cannot touch a sufficiently higher-level target.
    const atkStages = entry.side === 'ally' ? this.allyStages : this.foeStages;
    if ((mv.effect && mv.effect.ohko) || mv.ohko) {
      const pOhko = Math.max(0, Math.min(255, atk.level - def.level + 30)) / 256;
      if (!roll(pOhko, g.rng.battle)) {
        this.say(atkName + ' used ' + mv.name + '!', () => {
          this.fxWhiff(foeSide); // W1 FX-2: defender sidestep on a miss
          this.say('But it missed!', () => this.nextAction());
        });
        return;
      }
    } else if (!mv.neverMiss) {
      const stageDelta = (atkStages.acc || 0) - (defStages.eva || 0);
      let p = ((mv.acc || 100) / 100) * accStageMultiplier(Math.max(-6, Math.min(6, stageDelta)));
      // ADR-025 §1 classic twists at the accuracy hook: Storm/Volt
      // Electric +5, Rubble physical +5, Grave/Mind status -10, Frost
      // x0.95 (defender dodge). Applied before the 255/256 cap.
      p = Math.max(0, groundClassicAccuracy(this.field, mv, p));
      if (p >= 1) p = 255 / 256;
      if (!roll(p, g.rng.battle)) {
        this.say(atkName + ' used ' + mv.name + '!', () => {
          this.fxWhiff(foeSide); // W1 FX-2: defender sidestep on a miss
          this.say('But it missed!', () => this.nextAction());
        });
        return;
      }
    }

    // F2 judge counters (facility only): a move that passed its
    // accuracy gate counts as ATTEMPTED, and its id joins the side's
    // distinct-move set (the Arena's Mind input). Landed is stamped
    // where damage/status actually applies (below / applyStatusMove).
    if (this.facilityStats) {
      const c = this.facilityStats[entry.side];
      c.attempted++;
      if (entry.action && entry.action.type === 'move' && atk.moves[entry.action.idx]) c.moves.add(atk.moves[entry.action.idx].id);
    }

    this.say(atkName + ' used ' + mv.name + '!', () => {
      if (mv.cat === 'status') { this.applyStatusMove(entry, mv); return; }
      const efx = mv.effect || {};
      const atkTypes = atk.tempTypes || (atk.transformed ? atk.transformed.types : SPECIES[atk.speciesId].types);
      const defTypes = def.tempTypes || (def.transformed ? def.transformed.types : SPECIES[def.speciesId].types);
      const eff = effectiveness(mv.type, defTypes);
      const stab = atkTypes.includes(mv.type);
      if (eff === 0) {
        this.fxDullHit(foeSide); // W1 FX-2: dull grey puff for immune hits (no flash/trauma)
        this.fxStartMove(mv, entry.side, foeSide, { immune: true, dmg: 0 });
        this.say('It doesn\'t affect ' + defName + '...', () => this.nextAction());
        return;
      }
      // Dream Eater only works on a sleeping target.
      if (efx.requiresSleep && def.status !== 'sleep') {
        this.say('But it failed! The target is not asleep!', () => this.nextAction());
        return;
      }
      // Counter: succeeds only if the user took physical damage this turn.
      if (efx.counter) {
        const taken = atk.tookPhysicalThisTurn || 0;
        if (taken <= 0) { this.say('But it failed!', () => this.nextAction()); return; }
        this._ksHit = { side: foeSide, hpBefore: def.hp }; noteHitTaken(def);
        def.hp = Math.max(0, def.hp - taken * 2);
        this.say(defName + ' took ' + (taken * 2) + ' damage!', () => this.checkFaint(foeSide, () => this.nextAction()));
        return;
      }
      const baseSpe = (atk.transformed ? atk.transformed.baseSpe : SPECIES[atk.speciesId].base.spe);
      const crit = roll(critChance(baseSpe, { highCrit: !!mv.highcrit, focus: !!atk.focused, bonus: groundCritBonus(this.field, mv, baseSpe) }), g.rng.battle);
      // Gen 1 crits ignore ALL stat stages (raw stats both sides).
      const atkStat = mv.cat === 'physical'
        ? (crit ? atk.stats.atk : entry.stats.atk)
        : (crit ? atk.stats.spa : entry.stats.spa);
      const defStat = mv.cat === 'physical'
        ? (crit ? def.stats.def : Math.floor(def.stats.def * stageMultiplier(defStages.def)))
        : (crit ? def.stats.spd : Math.floor(def.stats.spd * stageMultiplier(defStages.spd)));
      const burn = atk.status === 'burn';
      if (entry.side === 'ally' && atk.speciesId === 'partner' && (crit || eff > 1)) {
        g.state.pikachu.mood = 'happy';
      }
      // Damage amount: fixed / level-scaled / OHKO / standard formula.
      // ADR-025 §3 (Phase 3): the keepsake factor is resolved ONCE here
      // (attacker + defender windows, game/keepsakes.mjs) and applied by
      // calcDamage after the Ground factor — only on the standard
      // formula path, exactly like the Ground factor (fixed/level/OHKO
      // damage is untouched by both systems).
      const defHpBefore = def.hp;
      const ksCtx = {
        defTypes,
        atkSpe: entry.stats.spe,
        defSpe: Math.floor(def.stats.spe * stageMultiplier(defStages.spe)),
      };
      const ksInfo = keepsakeDamageFactor(atk, def, mv, ksCtx);
      let dmg;
      if (mv.ohko || efx.ohko) dmg = def.hp;
      else if (efx.fixed) dmg = efx.fixed;
      else if (efx.fixedLevel || mv.fixedLevel) dmg = atk.level; // P0 fix: Seismic Toss / Night Shade declare fixedLevel at move top level (like ohko/charge) — reading only efx made them deal power-0 damage (~2) instead of level damage
      else if (efx.psywave) dmg = Math.max(1, Math.floor(atk.level * (0.5 + g.rng.battle())));
      else {
        const hits = efx.hits ? (efx.hits[0] + Math.floor(g.rng.battle() * (efx.hits[1] - efx.hits[0] + 1))) : 1;
        this._fxHits = hits; // W1 FX-2: per-hit bursts for multi-hit moves
        dmg = 0;
        // ADR-025 §3 owner ruling (2026-10-27): Iron Acorn factors only
        // the FIRST HIT of a multi-hit move — hits after the first
        // resolve with the ward spent (all other windows unchanged).
        const ksLateFactor = hits > 1
          ? keepsakeDamageFactor(atk, def, mv, { ...ksCtx, wardSpent: true }).factor
          : ksInfo.factor;
        for (let hi = 0; hi < hits; hi++) {
          dmg += calcDamage(atk.level, mv.power, atkStat, defStat,
            { stab, effectiveness: eff, crit, random: damageRandomFor(g.state, g.rng.battle), burn, physical: mv.cat === 'physical', field: this.field, moveType: mv.type, keepsakeFactor: hi === 0 ? ksInfo.factor : ksLateFactor });
        }
        if (hits > 1) this._hitCount = hits;
      }
      // Reflect / Light Screen halve the matching category while active.
      if (mv.cat === 'physical' && def.reflectT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
      if (mv.cat === 'special' && def.lightT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
      // Substitute absorbs the hit.
      let subBroke = false;
      if (def.subHp > 0) {
        def.subHp -= dmg;
        if (def.subHp <= 0) { def.subHp = 0; subBroke = true; }
        dmg = 0;
      }
      if (dmg > 0) {
        if (this.facilityStats) this.facilityStats[entry.side].landed++; // F2 judge Skill input
        def.hp = Math.max(0, def.hp - dmg);
        noteHitTaken(def); // ADR-025 §3: the holder took a hit (Iron Acorn window)
        this._ksHit = { side: foeSide, hpBefore: defHpBefore }; // attack context for checkFaint's Tortoise gate
        if (mv.cat === 'physical') def.tookPhysicalThisTurn = (def.tookPhysicalThisTurn || 0) + dmg;
        if (def.bideT) def.bideDmg = (def.bideDmg || 0) + dmg;
        // Gen 1: a Fire-type hit thaws a frozen defender.
        if (def.status === 'freeze' && mv.type === 'fire') def.status = null;
      }
      // GD tutorial: the lesson mon endures at 1 HP — the gate teaches
      // catching, so the only exit is a (guaranteed, once weakened) catch.
      // P0 fix (owner report 2026-10-28): the catch hint used to show only
      // on the FIRST endured KO (_endureShown) — every later lethal hit
      // silently clamped to 1 HP again, so a player who kept choosing
      // FIGHT faced an apparently immortal foe that kept attacking and
      // could win by attrition, with no explanation on screen. The hint
      // now repeats on EVERY endured KO; the endure itself (the lesson's
      // design) is unchanged.
      let hungOn = false;
      if (this.tutorial && foeSide === 'foe' && def.hp <= 0) {
        def.hp = 1;
        hungOn = true;
        this._endureShown = true;
      }
      if (hungOn) this._tutStage = 'bag'; // P0/C7: foe weakened -> BAG highlight next
      // P0/C7: the tutorial's first damaging move retires the FIGHT highlight.
      if (this.tutorial && entry.side === 'ally' && mv.cat !== 'status') this._tutFightDone = true;
      // README attack transform: the attacker's sprite scales 1.2x for 3 frames.
      // P1/E12: Battle animations OFF skips the lunge/impact anims entirely.
      const animsOn = g.state.settings.battleAnims !== false;
      if (animsOn) this.atkFx = { side: entry.side, t: 0 };
      // Impact theater — P0/E11: shake/flash gated on the Screen-shake option
      // and reduced motion; reduced motion gets a 100ms fade instead.
      const canShake = animsOn && !g.state.settings.reducedMotion && g.state.settings.shake;
      if (canShake) {
        // Trauma adds (WP3, research §1.5): super-effective kicks
        // hardest, resisted hits stay dull, crits stack a little more.
        // update() turns the value into amplitude (12px x trauma^2)
        // and a decay-derived duration; one value = one shake at a
        // time. Flash unchanged.
        if (eff > 1) { this.trauma = Math.max(this.trauma, 0.55); this.flashT = 60; }
        else if (eff < 1) { this.trauma = Math.max(this.trauma, 0.28); }
        else { this.trauma = Math.max(this.trauma, 0.35); }
        if (crit) { this.trauma = Math.min(1, this.trauma + 0.25); this.flashT = 90; }
        // README impact: white palette-swap on the defender for 2 frames + shake.
        // ADR-026 WP3 (presentation only): EVERY damaging hit flashes the
        // defender — neutral-effectiveness hits used to land with no
        // impact feedback at all while super/not-very-effective hits
        // flashed, which read as inconsistent hit confirmation.
        if (eff !== 1 || crit || dmg > 0) this.impactFx = { side: foeSide, t: 0 };
        // P1/I5: haptic tick on super-effective (guarded; mobile only).
        if (eff > 1 && g.state.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(30); } catch (e) { /* no haptics */ }
        }
      } else if (animsOn && g.state.settings.reducedMotion && (eff !== 1 || crit)) {
        this.fadeT = 100;
      }
      g.audio.hitFeedback(eff); // sound picks the effectiveness tier (visual twin: shake/flash)
      // W1 FX-1/FX-2: the shared effect player + tiered knockback/
      // recoil, driven by the shipped tiers above (visual only).
      if (this.impactFx && this.impactFx.side === foeSide) this.impactFx.dur = (eff > 1 || crit) ? 110 : 66;
      this.fxStartMove(mv, entry.side, foeSide, { eff, crit, dmg, ko: def.hp <= 0 && dmg > 0, hits: this._fxHits || 1 });
      this._fxHits = 0;
      let extra = '';
      if (crit) extra = ' A critical hit!';
      if (eff > 1) extra += " It's super effective!";
      else if (eff < 1) extra += " It's not very effective...";
      const after = () => {
        // Secondary effects, then the damage line.
        let msg2 = hungOn
          ? defName + ' hung on with 1 HP! Now — open the BAG and throw a Capture Orb!'
          : (subBroke ? 'The substitute broke!' : defName + ' took ' + dmg + ' damage!');
        if (this._hitCount) { msg2 += ' Hit ' + this._hitCount + ' times!'; this._hitCount = 0; }
        if (mv.ohko || efx.ohko) msg2 = 'One-hit KO!';
        // ADR-025 §3: first firing of a damage keepsake is announced by
        // name on the damage line (never silent; once per battle each).
        if (dmg > 0 && !subBroke) {
          if (ksInfo.atkId) { const l = this.ksAnnounceLine(atk, ksInfo.atkId, atkName, false); if (l) msg2 += ' ' + l; }
          if (ksInfo.defId) { const l = this.ksAnnounceLine(def, ksInfo.defId, defName, true); if (l) msg2 += ' ' + l; }
        }
        // Status infliction (single status or Tri Attack's random pick).
        let statusRoll = efx.status;
        if (efx.statusAny) statusRoll = efx.statusAny[Math.floor(g.rng.battle() * efx.statusAny.length)];
        // ADR-025 §1: Ember/Pyre (burn) and Venom (poison) twists add +10
        // points to the infliction roll — only where the move can already
        // inflict that status (no chance on the move = guaranteed, no roll).
        // ADR-025 §3: Ember Seed / DROOPETAL Fang add their +10 at the same
        // roll, composing additively with the Ground twist.
        const statusChancePct = (efx.chance || 0) + groundStatusChanceBonus(this.field, statusRoll)
          + keepsakeStatusChanceBonus(atk, mv, statusRoll);
        if (statusRoll && def.hp > 0 && (!efx.chance || roll(Math.min(100, statusChancePct) / 100, g.rng.battle))) {
          if (statusRoll === 'confusion') {
            if (!def.confused) { def.confused = true; def.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); msg2 = defName + ' became confused!'; }
          } else if (!def.status) {
            // ADR-025 §3: an Ember Seed holder cannot be frozen.
            if (refusesStatus(def, statusRoll)) {
              msg2 = defName + "'s Ember Seed glows warm — it cannot be frozen!";
              this.ksRecord(def, 'embereed');
            } else {
              def.status = statusRoll;
              if (statusRoll === 'sleep') def.sleepTurns = null;
              msg2 = defName + this.statusText(statusRoll);
            }
          }
        }
        // Stage changes riding on a damaging move (Bubble Beam family).
        for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
          if (efx[k] && def.hp > 0 && (!efx.stageChance || roll(efx.stageChance / 100, g.rng.battle))) {
            if (!(def.mistT > 0 && efx[k] < 0)) {
              defStages[k] = Math.max(-6, Math.min(6, (defStages[k] || 0) + efx[k]));
            }
          }
        }
        if (efx.flinch && def.hp > 0 && roll(efx.flinch / 100, g.rng.battle)) def.flinched = true;
        if (efx.seed && def.hp > 0) def.seeded = true;
        if (efx.drain && dmg > 0) {
          atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * efx.drain));
        }
        if (efx.payday) g.state.player.money += atk.level * 2;
        if (mv.recharge) atk.mustRecharge = true;
        // Lock bookkeeping for Wrap / thrash-family moves.
        if (efx.multi || efx.multiTurn) {
          if (!atk.lockMove && entry.action && entry.action.type === 'move') {
            atk.lockMove = { idx: entry.action.idx, left: 1 + Math.floor(g.rng.battle() * 2), after: efx.multiTurn ? 'confuse' : null };
          }
        }
        if (atk.lockMove && entry.action && entry.action.type === 'move' && entry.action.idx === atk.lockMove.idx) {
          atk.lockMove.left--;
          if (atk.lockMove.left <= 0) {
            const afterLock = atk.lockMove.after;
            atk.lockMove = null;
            if (afterLock === 'confuse' && atk.hp > 0) { atk.confused = true; atk.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); }
          }
        }
        const finishMove = () => {
          if (efx.selfFaint && atk.hp > 0) {
            atk.hp = 0;
            this.checkFaint(entry.side, () => this.nextAction());
            return;
          }
          if (efx.recoil && dmg > 0 && atk.hp > 0) {
            atk.hp = Math.max(0, atk.hp - Math.max(1, Math.floor(dmg * efx.recoil)));
            this.checkFaint(entry.side, () => this.nextAction());
            return;
          }
          this.nextAction();
        };
        // HITSTOP: the damage line carries a 70ms dismissal hold on
        // damaging impacts (see the note at the say(extra) dispatch).
        if ((dmg > 0 || subBroke) && animsOn && !g.state.settings.reducedMotion) this._nextMsgHold = 70;
        this.say(msg2, () => {
          this.checkFaint(foeSide, finishMove);
        });
      };
      // HITSTOP (WP3, research §1.5 — the single biggest move-weight
      // lever): on a damaging impact the damage LINE gets a 70ms
      // dismissal hold (armed inside after() where the line is said):
      // the flash/shake/drain play over a line the player cannot blow
      // past instantly, and a press during the hold is remembered and
      // dismisses it at expiry — input is never disabled, never
      // eaten, and the say() chain is never deferred (resolution
      // order and RNG untouched). Off under reduced motion/anims off.
      if (extra.trim()) this.say(extra.trim(), after);
      else after();
    });
  }

  statusText(s) {
    return { burn: ' was burned!', poison: ' was poisoned!', paralysis: ' was paralyzed!', sleep: ' fell asleep!', freeze: ' was frozen solid!', confusion: ' became confused!' }[s] || ' was afflicted!';
  }

  applyStatusMove(entry, mv) {
    const g = this.game;
    const ef = mv.effect || {};
    const atk = entry.mon;
    const selfSide = entry.side;
    const foeSide = selfSide === 'ally' ? 'foe' : 'ally';
    const foeMon = foeSide === 'ally' ? this.ally : this.foe;
    const target = ef.target === 'self' ? atk : foeMon;
    const stages = ef.target === 'self' ? (selfSide === 'ally' ? this.allyStages : this.foeStages) : (foeSide === 'ally' ? this.allyStages : this.foeStages);
    const tName = displayName(target, SPECIES);
    const aName = displayName(atk, SPECIES);
    // W1 FX-1: every status move presents through its vis.* definition.
    this.fxStartMove(mv, selfSide, target === atk ? selfSide : foeSide, { status: true, dmg: 0 });
    // F2 judge Skill input: a status move that reached application
    // (accuracy already passed) counts as landed.
    if (this.facilityStats) this.facilityStats[selfSide].landed++;
    const done = (msg) => this.say(msg, () => this.nextAction());
    // Teleport: flee a wild battle; fails against trainers.
    if (ef.flee) {
      if (this.kind === 'wild') { this.say(aName + ' teleported away!', () => { this.fled = true; this.endBattle(true); }); return; }
      done('But it failed!'); return;
    }
    if (ef.haze) {
      for (const s of [this.allyStages, this.foeStages]) for (const k of Object.keys(s)) s[k] = 0;
      if (foeMon.status) foeMon.status = null;
      foeMon.confused = false;
      done('All stat changes were eliminated!');
      return;
    }
    if (ef.heal) {
      if (target.hp >= target.maxHp) { done('But it failed!'); return; }
      // ADR-025 §1 Bloom/Marsh twist: healing moves restore +50%.
      // ADR-025 §3 Gardenia Sash: healing moves ON a holder restore a
      // further +50% — same effect.heal scope as the Ground twist
      // (drain and Rest are separate paths, excluded for both).
      target.hp = Math.min(target.maxHp, target.hp + Math.floor(target.maxHp * ef.heal * groundHealMult(this.field) * keepsakeHealMult(target)));
      done(tName + ' regained health!');
      return;
    }
    if (ef.rest) {
      target.hp = target.maxHp;
      target.status = 'sleep';
      target.sleepTurns = 3; // Gen 1 Rest: exactly 2 full turns asleep
      done(tName + ' slept and became healthy!');
      return;
    }
    if (ef.substitute) {
      const cost = Math.floor(target.maxHp / 4);
      if (target.subHp > 0 || target.hp <= cost) { done('But it failed!'); return; }
      target.hp -= cost;
      target.subHp = cost;
      done(tName + ' made a substitute!');
      return;
    }
    if (ef.screen) {
      if (ef.screen === 'physical') atk.reflectT = 5; else atk.lightT = 5;
      done(ef.screen === 'physical' ? 'A wall of light weakened physical attacks!' : 'A wall of light weakened special attacks!');
      return;
    }
    if (ef.mist) { atk.mistT = 5; done(aName + ' is shrouded in mist!'); return; }
    if (ef.focus) { atk.focused = true; done(aName + ' is getting pumped!'); return; }
    if (ef.seed) {
      if (foeMon.seeded) { done('But it failed!'); return; }
      foeMon.seeded = true;
      done('Seeds were planted on ' + tName + '!');
      return;
    }
    if (ef.disable) {
      if (foeMon.lastMoveIdx === undefined || foeMon.lastMoveIdx === null || foeMon.disableT > 0) { done('But it failed!'); return; }
      foeMon.disabledMove = foeMon.lastMoveIdx;
      foeMon.disableT = 1 + Math.floor(g.rng.battle() * 7);
      done(tName + "'s " + MOVES[foeMon.moves[foeMon.disabledMove].id].name + ' was disabled!');
      return;
    }
    if (ef.transform) {
      atk._preTransform = { speciesId: atk.speciesId, stats: { ...atk.stats }, moves: atk.moves };
      atk.transformed = { types: [...(foeMon.tempTypes || SPECIES[foeMon.speciesId].types)], baseSpe: SPECIES[foeMon.speciesId].base.spe };
      atk.speciesId = foeMon.speciesId;
      atk.stats = { ...foeMon.stats };
      atk.moves = foeMon.moves.map((m) => ({ id: m.id, pp: 5, maxPp: 5 }));
      done(aName + ' transformed into ' + tName + '!');
      return;
    }
    if (ef.conversion) {
      const first = atk.moves[0] && MOVES[atk.moves[0].id];
      atk.tempTypes = [first ? first.type : 'normal'];
      done(aName + ' became ' + atk.tempTypes[0] + ' type!');
      return;
    }
    if (ef.mimic) {
      const foeMoves = foeMon.moves.filter((m) => MOVES[m.id]);
      if (!foeMoves.length || !entry.action) { done('But it failed!'); return; }
      const pick = foeMoves[Math.floor(g.rng.battle() * foeMoves.length)];
      atk._mimicRestore = atk.moves[entry.action.idx];
      atk.moves[entry.action.idx] = { id: pick.id, pp: MOVES[pick.id].pp, maxPp: MOVES[pick.id].pp };
      done(aName + ' learned ' + MOVES[pick.id].name + '!');
      return;
    }
    let msg = '';
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
      if (ef[k]) {
        if (target.mistT > 0 && ef[k] < 0 && target !== atk) { msg = tName + ' is protected by mist!'; continue; }
        stages[k] = Math.max(-6, Math.min(6, (stages[k] || 0) + ef[k]));
        msg = tName + "'s " + k.toUpperCase() + (ef[k] > 0 ? ' rose!' : ' fell!');
      }
    }
    if (ef.status === 'confusion') {
      if (!target.confused) { target.confused = true; target.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); msg = tName + ' became confused!'; }
      else msg = 'But it failed!';
    } else if (ef.status) {
      if (!target.status) {
        // ADR-025 §3: an Ember Seed holder cannot be frozen.
        if (refusesStatus(target, ef.status)) {
          msg = tName + "'s Ember Seed glows warm — it cannot be frozen!";
          this.ksRecord(target, 'embereed');
        } else {
          target.status = ef.status;
          if (ef.status === 'sleep') target.sleepTurns = null;
          msg = tName + this.statusText(ef.status);
        }
      } else msg = 'But it failed!';
    }
    this.say(msg || 'Nothing happened.', () => this.nextAction());
  }

  // ADR-025 §3 (Phase 3): shared keepsake trigger evaluation at the
  // faint/switch checks. evaluateTriggers (game/keepsakes.mjs) owns the
  // conditions + once-per-battle flags; this applies the Speed stage to
  // the side's stage system and returns battle lines NAMING the piece
  // (effects never fire silently). ctx.hpBefore/viaAttack come from
  // this._ksHit, recorded by the damage paths for attack damage only —
  // so the Tortoise Charm cannot save from poison ticks or recoil.
  ksApplyTriggers(side, ctx) {
    const mon = side === 'ally' ? this.ally : this.foe;
    if (!mon) return [];
    const trig = evaluateTriggers(mon, ctx || {});
    const lines = [];
    const name = displayName(mon, SPECIES);
    if (trig.tortoise) {
      lines.push(name + "'s Tortoise Charm flared! It hung on with 1 HP!");
      this.ksRecord(mon, 'tortoisecharm');
    }
    if (trig.secondWind) {
      const st = side === 'ally' ? this.allyStages : this.foeStages;
      st.spe = Math.min(6, (st.spe || 0) + 1);
      lines.push(name + "'s Second-Wind Ribbon caught the wind! Its Speed rose!");
      this.ksRecord(mon, 'secondwindribbon');
    }
    return lines;
  }

  ksRecord(mon, id) {
    (this._ksTriggered = this._ksTriggered || []).push({ mon, id });
  }

  // First-firing announcement for a damage-shaped keepsake (once per
  // battle per holder — the factor itself applies on every qualifying
  // hit). Returns the line, or null when already announced.
  ksAnnounceLine(mon, id, holderName, isDefender) {
    const ks = ksState(mon);
    if (ks.announced[id]) return null;
    ks.announced[id] = true;
    this.ksRecord(mon, id);
    return holderName + "'s " + KEEPSAKES[id].name + (isDefender ? ' blunted the blow!' : ' flared!');
  }

  checkFaint(side, cb) {
    const mon = side === 'ally' ? this.ally : this.foe;
    const hit = (this._ksHit && this._ksHit.side === side) ? this._ksHit : null;
    if (hit) this._ksHit = null;
    // WP3: remember whether THIS faint check was caused by an attack
    // hit (vs a status/DoT tick) so checkFaintContinue can apply the
    // KO shake on attack KOs only.
    this._faintByAttack = hit ? side : null;
    const lines = this.ksApplyTriggers(side, hit ? { hpBefore: hit.hpBefore, viaAttack: true } : {});
    if (lines.length) {
      this.say(lines.join(' '), () => this.checkFaintContinue(side, cb));
      return;
    }
    this.checkFaintContinue(side, cb);
  }

  checkFaintContinue(side, cb) {
    const g = this.game;
    const mon = side === 'ally' ? this.ally : this.foe;
    if (mon.hp > 0) { this._faintByAttack = null; cb(); return; }
    // KO trauma (WP3): a killing blow kicks ~1.35x a normal hit's
    // shake (0.35 -> ~0.47 base, more after big hits). Ignition rule:
    // only when an attack's hit context is still unconsumed for this
    // side — checkFaint consumes _ksHit before delegating here, so
    // attack KOs arrive with it set on _faintByAttack; status/DoT tick
    // faints never set it and stay shake-free.
    if (this._faintByAttack === side && !this.rtMode) {
      const st = g.state.settings;
      if (st.battleAnims !== false && !st.reducedMotion && st.shake) this.trauma = Math.min(1, Math.max(this.trauma + 0.12, 0.47));
    }
    this._faintByAttack = null;
    // Yellow homage: the partner takes its own faint personally.
    if (side === 'ally' && mon.speciesId === 'partner') g.state.pikachu.mood = 'sad';
    const name = displayName(mon, SPECIES);
    g.audio.playSfx('battle-faint');
    // README faint transform: the sprite sinks 8px + fades to 0 over 20 frames
    // while the message plays (visual-only; the flow is unchanged).
    const art = g.spriteCache[mon.speciesId] || g.spriteCache.partner;
    this.faintFx = { side, spr: side === 'ally' ? art.back : art.front, t: 0 };
    // SET/SHIFT faint beat (WP3, WP2 pacing spec): in classic battles
    // the faint LINE carries a 450ms dismissal hold — the KO lands
    // for a beat before the send-out / XP / victory text can replace
    // it. Zero prompts in Set; in Shift the beat precedes the prompt.
    // A press during the hold is remembered, not eaten (see the
    // msgOpen branch in update()). No hold under reduced motion.
    // RT faints route through rtCheckFaints and never reach here.
    if (!this.rtMode && !g.state.settings.reducedMotion) this._nextMsgHold = 450;
    this.say(name + ' fainted!', () => {
      if (side === 'foe') {
        this.state = 'faintfoe';
        this.afterFaintFoe();
      } else {
        const g = this.game;
        const anyLeft = this.allyTeam(g).some((m) => m.hp > 0); // F2: routed (facility override team)
        if (!anyLeft) {
          this.state = 'defeat';
          this.say('You have no Kin left!', () => this.afterMsg());
        } else {
          this.openPartyMenu(true);
        }
      }
    });
  }

  afterFaintFoe() {
    const g = this.game;
    // ADR-026 Shift exactly-once guard: while a Shift sequence for this
    // KO is in progress, any re-entry into afterFaintFoe (the
    // state==='faintfoe' lanes in afterMsg/nextAfterStatus) is a no-op —
    // the prompt can never fire twice for one KO.
    if (this._shiftInProgress) return;
    if (this.kind === 'trainer') {
      // ADR-026 Shift/Set: in Shift mode (classic engine only) the KO'd
      // foe's XP is awarded BEFORE the "about to send out" prompt. Set
      // mode — and every RT battle — runs the flow below verbatim.
      if (this._shiftApplies()) { this._beginShift(); return; }
      this.trainerIdx++;
      if (this.trainerIdx < this.trainer.team.length) {
        const t = this.trainer.team[this.trainerIdx];
        this.foe = tuneFoeMon(authoredMoves(makeMon(t.species, trainerLevelFor(g.state, this.trainer, t.level), SPECIES, MOVES), t), g.state);
        if (t.nickname) this.foe.nickname = t.nickname;
        const ksN = foeKeepsakeFor(g.state, this.trainer, this.trainerIdx, this.trainer.team.length);
        if (ksN) this.foe.keepsake = ksN;
        this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
        this.foeMaxTrail[this.trainerIdx] = this.foe.maxHp; // F2 judge Body bookkeeping
        this.participants = new Set([this.ally]); // XP pool resets per foe
        this.hpAnim.foe = this.foe.hp;
        const foeName = displayName(this.foe, SPECIES);
        // ADR-026 WP3 (presentation only): the incoming mon's cry lands
        // WITH the send-out line, not after the player dismisses it.
        g.audio.playCry(t.species);
        this.fxStartEntry('foe', 'pokeball'); // W1 FX-5: send-out on trainer next-mon
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => {
          this.state = 'resolve';
          this.awardXp(() => this.toCommand());
        });
        return;
      }
      this.awardXp(() => this.winTrainer());
    } else {
      this.awardXp(() => {
        this.state = 'victory';
        if (this._exitStartT < 0) this._exitStartT = this.t; // W1 FX-6
        g.audio.playSfx('victory'); // wild-win sting (visual twin: the "defeated" message)
        this.say('Wild ' + displayName(this.foe, SPECIES) + ' was defeated!', () => this.afterMsg());
      });
    }
  }

  // ---- ADR-026: Shift/Set (settings.switchMode, classic engine only) ----
  // SET (default): afterFaintFoe above, exactly as shipped — no prompt,
  // ever, on a foe KO. SHIFT: the genre prompt. The gate is deliberately
  // narrow: classic engine only (RT's flow is unchanged), trainer battles
  // only, never the scripted tutorial, never a friendly spar, never the
  // trainer's last mon (straight to winTrainer), and only when a legal
  // switch target exists (another healthy party mon) — asking with
  // nothing to switch to would be a pointless interruption.
  _shiftApplies() {
    if (this.rtMode) return false;
    if (this.tutorial || this.friendly) return false;
    if (this.kind !== 'trainer' || !this.trainer) return false;
    const g = this.game;
    if (!g.state.settings || g.state.settings.switchMode !== 'shift') return false;
    if (this._shiftInProgress) return false;
    if (this.trainerIdx + 1 >= this.trainer.team.length) return false;
    return g.state.party.some((m) => m.hp > 0 && m !== this.ally);
  }

  _beginShift() {
    const g = this.game;
    this._shiftInProgress = true;
    const koFoe = this.foe;
    const koParts = this.participants;
    // Genre order: the KO'd foe's XP goes only to the mons that
    // participated against IT — awarded BEFORE the prompt, so a mon
    // that switches in for the incoming foe can never share it.
    this.awardXpFor(koFoe, koParts, () => {
      // Build the incoming foe now: the prompt must name it. It takes
      // the field only in _shiftSendOut, after the player's decision.
      this.trainerIdx++;
      const t = this.trainer.team[this.trainerIdx];
      const incoming = tuneFoeMon(authoredMoves(makeMon(t.species, trainerLevelFor(g.state, this.trainer, t.level), SPECIES, MOVES), t), g.state);
      if (t.nickname) incoming.nickname = t.nickname;
      const ksN = foeKeepsakeFor(g.state, this.trainer, this.trainerIdx, this.trainer.team.length);
      if (ksN) incoming.keepsake = ksN;
      this._shiftIncoming = incoming;
      this._askShift();
    });
  }

  _askShift() {
    const nextName = displayName(this._shiftIncoming, SPECIES);
    this.state = 'shiftprompt';
    this.say(this.trainer.name + ' is about to send out ' + nextName + '! Will you change Kin?', () => this._showShiftMenu());
  }

  _showShiftMenu() {
    const g = this.game;
    this.state = 'shiftprompt';
    g.ui.showMenu('Will you change Kin?', [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ], (v) => {
      if (v === 'yes') { this._openShiftParty(); return; }
      // No — or the menu was cancelled: the battle must never strand
      // on the prompt, so a cancel takes the No path.
      this._shiftSendOut();
    }, { menuClass: 'battlewin' });
  }

  // The Shift switch is NOT a turn: no foe action, no beginTurn — the
  // incoming ally simply takes the field before the trainer's send-out.
  // Backing out re-asks the prompt; it can never strand the battle.
  _openShiftParty() {
    const g = this.game;
    const items = g.state.party.map((m, i) => ({
      label: displayName(m, SPECIES) + ' Lv' + m.level + ' ' + m.hp + '/' + m.maxHp + (m === this.ally ? ' (active)' : ''),
      value: i, disabled: m.hp <= 0 || m === this.ally,
    }));
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Choose a Kin', items, (v) => {
      if (v === null || v === -1) { this._showShiftMenu(); return; }
      this.ally = g.state.party[v];
      this.allyStages = this.ally.stages;
      if (this.allyStages.acc === undefined) { this.allyStages.acc = 0; this.allyStages.eva = 0; }
      this.hpAnim.ally = this.ally.hp;
      // Switch-in keepsake triggers evaluate exactly as a command-phase
      // switch-in does (openPartyMenu parity — presentation + stages).
      const ksLines = this.ksApplyTriggers('ally', {});
      const go = () => {
        g.audio.playCry(this.ally.speciesId);
        this.fxStartEntry('ally', 'pokeball'); // W1 FX-5
        this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this._shiftSendOut());
      };
      if (ksLines.length) this.say(ksLines.join(' '), go);
      else go();
    }, { menuClass: 'battlewin' });
  }

  _shiftSendOut() {
    const g = this.game;
    const incoming = this._shiftIncoming;
    this._shiftIncoming = null;
    this.foe = incoming;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    // The incoming foe's XP pool starts with whoever NOW faces it —
    // the ally who stayed, or the mon just switched in.
    this.participants = new Set([this.ally]);
    this.hpAnim.foe = this.foe.hp;
    const foeName = displayName(this.foe, SPECIES);
    g.audio.playCry(this.foe.speciesId); // WP3: cry with the line, as Set
    this.fxStartEntry('foe', 'pokeball'); // W1 FX-5
    this.say(this.trainer.name + ' sent out ' + foeName + '!', () => {
      this._shiftInProgress = false;
      this.toCommand();
    });
  }

  awardXp(cb) { this.awardXpFor(this.foe, this.participants, cb); }

  awardXpFor(foeMon, partsSet, cb) {
    const g = this.game;
    // F2: no XP under facility law (Open Level — the entered team's
    // levels are the contest; growth would unbalance the streak).
    if (this.facility) { cb(); return; }
    const base = SPECIES[foeMon.speciesId].baseXp;
    // ADR-025 §4: mode + Fast Learner XP multipliers scale the pool before
    // the participant split (x1.25 Story; x1.5 Fast Learner; they compose).
    const total = Math.max(1, Math.floor(xpYield(base, foeMon.level, this.kind === 'wild') * xpMultFor(g.state)));
    // Fidelity pack (ADR-018): XP splits among the participants who faced
    // THIS foe and are still standing — never the whole party for free.
    const parts = [...partsSet].filter((m) => m.hp > 0);
    const share = parts.length ? Math.max(1, Math.floor(total / parts.length)) : 0;
    // ADR-025 §3: Champion's Ribbon — the HOLDER's share gains x1.2,
    // composing multiplicatively with the mode/House-Rule factors that
    // built the pool (rules.xpMultFor(state, mon) is the same product).
    this.xpShares = new Map(parts.map((m) => [m, Math.max(1, Math.floor(share * keepsakeXpMult(m)))]));
    this.xpBarAnim = parts.map((m) => ({
      mon: m, from: xpFracOf(m, 0), to: xpFracOf(m, this.xpShares.get(m)),
    }));
    this.xpCb = cb;
    this.state = 'xp';
    this.xpT = 0;
  }

  // Fraction of the current level's XP progress (for the XP bar).
  xpShownFrac(mon) {
    let frac = xpFracOf(mon, 0);
    if (this.state === 'xp' && this.xpBarAnim) {
      const rec = this.xpBarAnim.find((r) => r.mon === mon);
      if (rec) {
        const k = this.game.state.settings.reducedMotion
          ? 1
          : 1 - Math.pow(1 - Math.min(1, this.xpT / 600), 3); // ease-out cubic
        frac = rec.from + (rec.to - rec.from) * k;
      }
    }
    return frac;
  }

  updateXp(dt) {
    const g = this.game;
    // XP bar ease-out over 600ms (gameux §4.2), then level-ups
    this.xpT += dt * 1000;
    if (this.xpT < 600) return;
    if (!this.xpApplied) {
      this.xpApplied = true;
      const msgs = [];
      for (const [m, share] of (this.xpShares || new Map())) {
        if (m.hp <= 0 || share <= 0) continue;
        m.xp += share;
        let leveled = false;
        while (m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1) && m.level < levelCapFor(g.state)) {
          m.level++;
          leveled = true;
          const sp = SPECIES[m.speciesId];
          const oldMax = m.maxHp;
          m.maxHp = hpValue(sp.base.hp, m.level, m.ivs ? m.ivs.hp : undefined);
          // WS7/WS9: level-up evolutions queue for the post-battle ceremony.
          if (sp.evo && sp.evo.method === 'level' && m.level >= sp.evo.level) {
            const q = g.state.session.evolveQueue || (g.state.session.evolveQueue = []);
            if (!q.some((e) => e.monId === m.monId)) q.push({ monId: m.monId });
          }
          m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax));
          m.stats = {
            atk: statValue(sp.base.atk, m.level, m.ivs ? m.ivs.atk : undefined), def: statValue(sp.base.def, m.level, m.ivs ? m.ivs.def : undefined),
            spa: statValue(sp.base.spa, m.level, m.ivs ? m.ivs.spa : undefined), spd: statValue(sp.base.spd, m.level, m.ivs ? m.ivs.spd : undefined),
            spe: statValue(sp.base.spe, m.level, m.ivs ? m.ivs.spe : undefined),
          };
          // Learn new moves: free slot learns instantly; a full set queues a
          // proper learn/forget prompt after the battle (WS9 — no silent
          // overwrite, HM moves are protected there).
          const newMoves = Array.isArray(sp.learnset)
            ? sp.learnset.filter((e) => e.level === m.level).map((e) => e.move)
            : (sp.learnset[m.level] || []);
          for (const mid of newMoves) {
            if (m.moves.some((x) => x.id === mid)) continue;
            if (m.moves.length < 4) m.moves.push({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp });
            else (g.state.session.learnQueue = g.state.session.learnQueue || []).push({ monId: m.monId, moveId: mid });
          }
        }
        if (leveled) msgs.push(displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!');
      }
      this.xpShares = null;
      g.audio.playSfx('dex-register');
      this.xpApplied = false;
      this.xpFlashT = 250; // P0/E3: level-up flash on the XP bar + fanfare below
      const cb = this.xpCb; this.xpCb = null;
      if (msgs.length) { g.audio.playSfx('levelup'); this.say(msgs.join(' '), () => { this.state = 'resolve'; if (cb) cb(); }); }
      else { this.state = 'resolve'; if (cb) cb(); }
    }
  }

  endTurnStatus() {
    // Burn/poison tick (1/16 max HP), badly-poisoned escalates (1/16 x turns),
    // Leech Seed drains 1/16 to the other side; then timers tick down.
    const tick = (mon, stages, side, done) => {
      if (mon.hp <= 0) { done(); return; }
      const other = side === 'ally' ? this.foe : this.ally;
      if (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'badlyPoisoned') {
        let mult = 1;
        if (mon.status === 'badlyPoisoned') { mon.bpTurns = (mon.bpTurns || 0) + 1; mult = mon.bpTurns; }
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16) * mult);
        mon.hp = Math.max(0, mon.hp - dmg);
        this.say(displayName(mon, SPECIES) + ' is hurt by ' + mon.status + '!', () => {
          this.checkFaint(side, done);
        });
        return;
      }
      if (mon.seeded && other && other.hp > 0) {
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - dmg);
        other.hp = Math.min(other.maxHp, other.hp + dmg);
        this.say(displayName(mon, SPECIES) + "'s health was sapped by Leech Seed!", () => {
          this.checkFaint(side, done);
        });
        return;
      }
      done();
    };
    for (const m of [this.ally, this.foe]) {
      if (!m) continue;
      if (m.reflectT > 0) m.reflectT--;
      if (m.lightT > 0) m.lightT--;
      if (m.mistT > 0) m.mistT--;
      if (m.disableT > 0) { m.disableT--; if (m.disableT <= 0) m.disabledMove = null; }
    }
    tick(this.ally, this.allyStages, 'ally', () => {
      if (this.state === 'defeat' || !this.ally || this.ally.hp <= 0) { this.nextAfterStatus(); return; }
      tick(this.foe, this.foeStages, 'foe', () => this.nextAfterStatus());
    });
  }

  nextAfterStatus() {
    if (this.state === 'defeat') { this.afterMsg(); return; }
    if (this.state === 'faintfoe') { this.afterFaintFoe(); return; }
    this.turn++;
    this.toCommand();
  }

  // ---- Catch sequence: the theater (gameux §4.2) ----
  beginCatch(ballId) {
    const g = this.game;
    if (this.facility && this.kind === 'wild') {
      // F2: facility wilds (Pike/Pyramid) are the Frontier's own —
      // never catchable, and the ball is NOT spent (the refusal
      // happens at the throw, before any decrement below).
      this.say('The attendant shakes her head — Frontier grounds. Nothing here can be taken home.', () => this.toCommand());
      return;
    }
    if (this.uncatchable && this.friendly) {
      // Candy Coach spar (ADR-025): the Coach bats the ball away — the
      // ball is NOT spent and the spar simply continues at command.
      this.say('The Coach bats the ball away! "Hey — sparring partners are not for catching."', () => this.toCommand());
      return;
    }
    if (this.uncatchable) {
      // Scripted presence: balls are deflected — the story must resolve it.
      g.state.bag[ballId]--;
      this.say('The ball passed right through it! This presence cannot be caught.', () => {
        this.foeAction = this.chooseFoeAction();
        this.state = 'resolve';
        const mon = this.foe;
        const stats = this.effStats(mon, this.foeStages);
        const move = MOVES[mon.moves[this.foeAction.idx].id];
        this.actions = [{ side: 'foe', action: this.foeAction, mon, stats, priority: move.priority || 0, move }];
        this.nextAction();
      });
      return;
    }
    g.state.bag[ballId]--;
    this._lastBallId = ballId;
    const ball = BALLS[ballId];
    this.state = 'catchseq';
    this.catchState = { ball, ballId, phase: 'throw', t: 0, shakes: 0, need: 0, a: 0 };
    g.audio.playSfx('catch-throw');
    this.msg = 'You threw a ' + ball.name + '!'; // throw plays immediately, no modal
    this.msgOpen = false;
    const foe = this.foe;
    // Gen-1 two-roll catch (ADR-018): no critical captures, no approximations.
    // Safari throws adjust the effective rate: rock doubles it, bait halves it.
    let rate = SPECIES[foe.speciesId].catchRate;
    if (this.safari) rate = Math.max(3, Math.min(255, Math.round(rate * (this.safariRock ? 2 : this.safariBait ? 0.5 : 1))));
    // ADR-025 §4: Story's ball bonus (x1.1) scales the effective rate.
    rate = Math.max(3, Math.min(255, Math.round(rate * catchRateMultFor(g.state))));
    // Stage J6: an apricorn ball's rule scales the rate against the
    // LIVE battle (shared ball-rules.mjs — the RT engine calls the
    // same helper, so the two catch calcs can never drift).
    rate = ballCatchRate(rate, ballId, { lead: this.ally, foe, fished: this.fished });
    const res = gen1Catch(foe.maxHp, foe.hp, rate, ballId, foe.status, g.rng.battle);
    this.catchState.willCatch = res.caught;
    this.catchState.need = res.caught ? 3 : res.shakes;
    if (this.tutorial && foe.hp <= foe.maxHp * 0.5) {
      // GD tutorial: weakened in the lesson battle = guaranteed catch.
      // The teaching is in the weaken step; the outcome is never luck.
      this.catchState.willCatch = true;
      this.catchState.need = 3;
    }
  }

  updateCatch(dt) {
    const g = this.game;
    const c = this.catchState;
    c.t += dt * 1000;
    // throw 26f (~430ms) -> absorb (W1 FX-5 recall shrink) -> ball
    // settle (<=2 bounces, 260ms) -> 3x800ms shakes -> click
    if (c.phase === 'throw' && c.t >= 430) {
      c.phase = 'settle'; c.t = 0;
      // P1/E10: absorb flash (the mon is drawn into the ball) — white-swap 2 frames.
      const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
      if (foeArt.frontWhite && !g.state.settings.reducedMotion) this.impactFx = { side: 'foe', t: 0 };
      // W1 FX-5: catch absorb is a recall — the foe shrinks into the ball.
      if (foeArt.front) this.fxStartRecall('foe', foeArt.front);
      c.absorbed = true;
    }
    else if (c.phase === 'settle' && c.t >= 260) { c.phase = 'shakes'; c.t = 0; }
    else if (c.phase === 'shakes') {
      const want = c.need;
      const doneShakes = Math.floor(c.t / 800);
      if (c.shakes < doneShakes && c.shakes < want) {
        c.shakes++;
        g.audio.playSfx('catch-rattle'); // visual twin: ball wiggle
      }
      if (c.shakes >= want && c.t >= want * 800 + 200) {
        if (c.willCatch) this.catchSuccess();
        else this.catchBreak(c.shakes);
      }
    }
  }

  catchSuccess() {
    const g = this.game;
    g.audio.playSfx('catch-click'); // visual twin: starburst
    g.audio.playSfx('catch-gotcha');
    this.catchFx = { t: 0 }; // P1/E10: success starburst radiates from the ball
    const foe = this.foe;
    const name = displayName(foe, SPECIES);
    // Stage J6: the Friend Ball's whole effect — a mon caught in one
    // starts out trusting its trainer (friendship set high). Shared
    // by both engines: RT catches land here too.
    if (this._lastBallId === 'friendball') foe.friendship = FRIEND_BALL_FRIENDSHIP;
    dexRegister(g.state.dex, 'caught', SPECIES[foe.speciesId].dexNo);
    let dest = 'party';
    if (g.state.party.length >= 6) {
      // Full party: the catch goes to the current PC box as a complete mon.
      const boxId = g.state.currentBox || 'box1';
      const box = g.state.boxes[boxId] || (g.state.boxes[boxId] = []);
      foe.hp = foe.maxHp;
      foe.status = null; foe.confused = false;
      box.push(foe);
      dest = 'the PC (' + boxId.replace('box', 'Box ') + ')';
    } else {
      foe.hp = foe.maxHp; // caught fresh
      g.state.party.push(foe);
    }
    g.audio.playSfx('dex-register'); // visual twin: dex toast + badge dot
    g.ui.dexDot = true; // P1/D4: badge dot on the HUD strip's Dex button
    if (g.ui._renderDexDot) g.ui._renderDexDot();
    this.say('Gotcha! ' + name + ' was caught! (' + dest + ')', () => {
      g.ui.toast(name + ' registered in the Dex!');
      this.endBattle(true);
    });
  }

  catchBreak(shakesDone) {
    const g = this.game;
    const name = displayName(this.foe, SPECIES);
    if (this.safari) {
      g.audio.catchBreakout();
      this.say('Oh no! ' + name + ' broke free!', () => {
        if (this.safariFleeCheck()) return;
        this.toCommand();
      });
      return;
    }
    g.audio.catchBreakout(); // visual twin: break-out burst
    // W1 FX-5: break-out bursts the ball open (ball-coloured burst).
    this.breakFx = { t: 0, ballId: (this.catchState && this.catchState.ballId) || 'pokeball' };
    if (this.catchState) this.catchState.absorbed = false;
    // P0/E11: break-out flash gated like battle flashes; reduced motion -> fade.
    if (!g.state.settings.reducedMotion && g.state.settings.shake) g.renderer.flashA = 0.8;
    else if (g.state.settings.reducedMotion) { g.renderer.fadeA = 0.35; g.renderer.fadeColor = '#ffffff'; }
    this.say('Oh no! ' + name + ' broke free after ' + shakesDone + ' shake' + (shakesDone === 1 ? '' : 's') + '!', () => {
      g.renderer.flashA = 0;
      g.renderer.fadeA = 0;
      // Break-out mood: it may attack immediately (foe gets a free move)
      this.playerAction = { type: 'ballthrown' };
      this.foeAction = this.chooseFoeAction();
      this.state = 'resolve';
      const mk = (side, action) => {
        const mon = side === 'ally' ? this.ally : this.foe;
        const stages = side === 'ally' ? this.allyStages : this.foeStages;
        const stats = this.effStats(mon, stages);
        let move = null, priority = 0;
        if (action.type === 'move') {
          move = MOVES[mon.moves[action.idx].id];
          priority = move.priority || 0;
        }
        return { side, action, mon, stats, priority, move };
      };
      this.actions = [mk('foe', this.foeAction)];
      this.nextAction();
    });
  }

  winTrainer() {
    const g = this.game;
    const t = this.trainer;
    this.state = 'victory';
    if (this._exitStartT < 0) this._exitStartT = this.t; // W1 FX-6: exit mirror wipe
    // W6 (audit D2): the composed trainer-win fanfare (SCORE.md: 'fanfare
    // (trainer win)') finally plays — ordinary trainer wins only; badge
    // wins already get the 'badge' fanfare at the award below.
    if (!t.badge) g.audio.playSfx('fanfare');
    // ADR-025 §4: Generous World scales prize money (x1.5).
    // F2: under facility law there is NO prize (generated trainers
    // also carry reward: 0 — the flag is the second lock) and NO
    // beat_<id> flag (run-battle ids are unique per battle; writing
    // them would burn the validator's 500-flag budget on noise).
    const prize = this.facility ? 0 : Math.floor(t.reward * moneyMultFor(g.state));
    g.state.player.money += prize;
    if (!this.facility) g.state.story.flags['beat_' + t.id] = true;
    // Yellow homage: winning with the partner conscious leaves it buzzing.
    if (g.state.party.some((m) => m.speciesId === 'partner' && m.hp > 0)) {
      g.state.pikachu.mood = 'excited';
    }
    // No battle-message here: the capstone dialogue below ends the battle exactly once.
    // F2: the facility victory line names no money (there is none).
    this.msg = this.facility
      ? 'You defeated ' + t.title + ' ' + t.name + '!'
      : 'You defeated ' + t.title + ' ' + t.name + '! Got $' + prize + '.';
    this.msgOpen = false;
    if (t.badge) {
      // Badge award (Arden representation, generalized Stage O2): the
      // trainer def names its set (badgeSet, default 'kanto'); the id
      // lands in badges.<set> and the badge_<root> flag fires — the
      // exact two writes Arden shipped, now set-driven.
      const setId = t.badgeSet || 'kanto';
      const setArr = g.state.badges[setId] || (g.state.badges[setId] = []);
      if (!setArr.includes(t.badge)) setArr.push(t.badge);
      g.state.story.flags['badge_' + t.badge.replace(/badge$/, '')] = true; // quest chain (WS6)
      if (setId === 'orange' && setArr.length >= 4) g.state.story.flags.orange_crew_done = true;
      g.audio.playSfx('badge'); // badge fanfare (visual twin: badge-case shine animation)
      if (t.id === 'brock') {
        // The slice capstone lines are Brock's scene specifically.
        const lines = SLICE_CAPSTONE.map((l) => l.replace('{player}', g.state.player.name));
        g.ui.say(lines, () => this.endBattle(true), '');
      } else {
        g.ui.say(t.lose, () => this.endBattle(true), t.name);
      }
    } else {
      g.ui.say(t.lose, () => this.endBattle(true), t.name);
    }
  }

  finishVictory() {
    this.endBattle(true);
  }

  finishDefeat() {
    const g = this.game;
    // Friendly battles (Candy Coach spar, ADR-025): a loss costs nothing —
    // no money halving, no Center warp. onEnd still fires with won=false.
    if (this.friendly) { this.endBattle(false); return; }
    // Defeat: fade -> Center (overworld, healed, money halved) — architecture §2.2
    g.state.pikachu.mood = 'sad'; // Yellow homage: the partner hates losing
    g.state.player.money = Math.floor(g.state.player.money / 2);
    this.endBattle(false);
    g.ui.say(['You hurried to the Center...'], () => {
      const ow = this.returnTo;
      // P1: same blackout anchor as the overworld path — the defeat
      // warp loads 'center' directly, so the exit ticket must be set
      // from the last-Center lineage first (see overworld.centerExit).
      if (typeof ow.centerExit === 'function') ow.centerReturn = ow.centerExit();
      ow.loadMap('center');
      ow.player.tx = 4; ow.player.ty = 3; ow.player.px = 4 * TILE; ow.player.py = 3 * TILE;
      ow.player.fx = 4; ow.player.fy = 3;
      ow.trail = [];
      ow.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 4, dir: 'down' };
      g.ui.toast('Your Kin were healed. (Lost half your money.)');
    });
  }

  endBattle(won) {
    const g = this.game;
    g.ui.setBattleMode(false);
    if (g.ui.hideCommands) g.ui.hideCommands(); // RT touch move pad retires with the battle
    g.audio.restoreAreaMusic(); // back to the overworld's track
    g.renderer.shakeX = 0; g.renderer.shakeY = 0; g.renderer.flashA = 0;
    // Reset battle temp state on party mons (incl. Transform restoration).
    // F2: under a partyOverride, reset ONLY the mons that actually
    // battled (the override team + this battle's participants) —
    // never the whole party: Factory rentals must leave state.party
    // byte-identical, and unentered party mons have no battle-temp
    // state to shed. (For entered-team facilities the override team
    // IS the battler set; participants/ally are belt-and-braces.)
    const resetTeam = (this.facility && this.facility.partyOverride)
      ? [...new Set([...this.facility.partyOverride, ...(this.participants || []), this.ally].filter(Boolean))] : g.state.party;
    for (const m of resetTeam) {
      if (m._preTransform) {
        m.speciesId = m._preTransform.speciesId;
        m.stats = m._preTransform.stats;
        m.moves = m._preTransform.moves;
        m._preTransform = null; m.transformed = null;
      }
      if (m._mimicRestore) m._mimicRestore = null;
      m.confused = false; m.confusedTurns = null; m.statusTurns = 0; m.sleepTurns = null;
      m.seeded = false; m.subHp = 0; m.reflectT = 0; m.lightT = 0; m.mistT = 0;
      m.lockMove = null; m.chargedFor = null; m.focused = false; m.tempTypes = null;
      m.flinched = false; m.bpTurns = 0; m.mustRecharge = false; m.bideT = 0; m.bideDmg = 0;
      m.disabledMove = null; m.disableT = 0; m.tookPhysicalThisTurn = 0;
      clearKsState(m); // ADR-025 §3: per-battle keepsake flags never persist
      const st = m.stages; if (st) { st.atk = 0; st.def = 0; st.spa = 0; st.spd = 0; st.spe = 0; st.acc = 0; st.eva = 0; }
    }
    g.scenes.pop();
    g.autosave('battle');
    // Story-event continuation (WS6): scripted battles resume their script
    // only on victory — a loss leaves the event unconsumed for a retry.
    // ADR-025 QA D1: escape paths (RUN / Teleport / Safari run / foe fled)
    // end the battle with won=true but set this.fled first — consumers
    // that pay a WIN prize (the Candy Coach spar) must check the second
    // argument; a flee is neither a win nor a loss.
    if (this.onEnd) { const f = this.onEnd; this.onEnd = null; f(won, this.fled === true); }
  }

  // ================= Premium+ W1: effect player + presentation =================
  // fxAnimsOn is THE settings gate for every W1 system: battleAnims off
  // or reducedMotion on => no sequence, no particles, no knockback, no
  // entry/send-out motion (send-outs become the base instant swap).
  fxAnimsOn() {
    const st = this.game && this.game.state && this.game.state.settings;
    return !!st && st.battleAnims !== false && !st.reducedMotion;
  }

  fxAnchor(side) {
    const v = this._fxView || { w: 384, h: 216 };
    return side === 'foe'
      ? { x: v.w * 0.62 + 24, y: v.h * 0.12 + 24 }
      : { x: v.w * 0.14 + 24, y: v.h * 0.52 + 24 };
  }

  fxSpawn(x, y, vx, vy, life, sz, col, grav) {
    for (let i = 0; i < FX_POOL_MAX; i++) {
      const p = this.fxPool[i];
      if (!p.on) { p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.sz = sz; p.col = col; p.grav = grav || 0; return; }
    }
  }

  // Start the ONE active move-effect sequence (a new sequence replaces
  // the old — one shake at a time has its visual twin: one effect at a
  // time). Truncation: a consecutive repeat of the same move by the
  // same side plays the sequence cut at its marked truncateMs.
  fxStartMove(move, atkSide, defSide, opts) {
    if (!this.fxPool || !this._fxLastMove || !this.fxKb || !this.fxRecoil) return; // QA minimal-this stub
    if (this.rtMode || !move || !this.fxAnimsOn()) return;
    const plan = fxPlanForMove(move);
    if (!plan || !plan.primary) return;
    let def = FX_DEFS[plan.primary];
    if (!def || !(def.durationMs > 0)) def = FX_DEFS[plan.kit]; // condition primaries ride their kit for the hit itself
    if (!def) return;
    const repeat = this._fxLastMove[atkSide] === move.id;
    this._fxLastMove[atkSide] = move.id;
    const dur = repeat ? def.truncateMs : def.durationMs;
    this.fxSeq = {
      def, plan, t: 0, dur: Math.max(120, dur), atkSide, defSide,
      seed: (move.id.charCodeAt(0) * 131 + move.id.length * 17) | 0,
      burstAt: Math.max(80, dur * 0.55), bursts: Math.max(1, Math.min(4, (opts && opts.hits) || 1)),
      spawnAcc: 0, dull: !!(opts && opts.immune),
    };
    // FX-2 displacement, parameterised by the shipped feedback tiers:
    // knockback 4px ordinary / 8px super-effective-or-crit / 12px KO,
    // ease-out return in the render (<=200ms); contact recoil 2px.
    if (opts && opts.dmg > 0) {
      const dist = opts.ko ? 12 : ((opts.eff > 1 || opts.crit) ? 8 : 4);
      this.fxKb[defSide] = { t: 0, dist };
      if (move.cat === 'physical') this.fxRecoil[atkSide] = { t: 0 };
    }
  }

  // FX-2 dull feedback for immune / blocked hits: a flat grey puff and
  // a 2px nudge — visibly LESS than any real hit (no flash, no trauma).
  fxDullHit(defSide) {
    if (!this.fxPool || !this.fxKb) return; // QA minimal-this stub
    if (this.rtMode || !this.fxAnimsOn()) return;
    const a = this.fxAnchor(defSide);
    for (let i = 0; i < 6; i++) {
      const h1 = fxHash(i * 31 + 7), h2 = fxHash(i * 57 + 3);
      this.fxSpawn(a.x + (h1 - 0.5) * 30, a.y + (h2 - 0.5) * 30, (h1 - 0.5) * 22, -8 - h2 * 14, 260, 3, i % 2 ? '#9a9aa8' : '#c8c8d4', 30);
    }
    this.fxKb[defSide] = { t: 0, dist: 2 };
  }

  // FX-2 miss feedback: the defender sidesteps (4px lateral ease) and
  // the travel element passes through — spawned by the caller via
  // fxStartMove on the NEXT damaging attempt; the sidestep is here.
  fxWhiff(defSide) {
    if (!this.fxKb) return; // QA minimal-this stub
    if (this.rtMode || !this.fxAnimsOn()) return;
    this.fxKb[defSide] = { t: 0, dist: 4 };
  }

  fxTick(dtms) {
    const seq = this.fxSeq;
    if (seq) {
      seq.t += dtms;
      const def = seq.def;
      const atkA = this.fxAnchor(seq.atkSide), defA = this.fxAnchor(seq.defSide);
      const isStatus = def.kind === 'status';
      const origin = isStatus ? defA : atkA;
      const target = defA;
      // Travel/ambient spawning (pooled; spawn budget from the def).
      const total = def.maxParticles || 16;
      seq.spawnAcc += (total * dtms) / Math.max(1, seq.dur);
      while (seq.spawnAcc >= 1) {
        seq.spawnAcc -= 1;
        const i = (seq.seed + Math.floor(seq.t) + Math.floor(fxHash(seq.seed + seq.t) * 997)) | 0;
        const h1 = fxHash(i * 13 + 1), h2 = fxHash(i * 29 + 5), h3 = fxHash(i * 43 + 9);
        const shape = def.shape || '';
        let vx = (target.x - origin.x) * 2.2, vy = (target.y - origin.y) * 2.2;
        let grav = 0, spread = 16;
        if (shape.includes('flame') || shape.includes('ember')) { vy = -30 - h2 * 30; vx = (h1 - 0.5) * 26; grav = -18; spread = 20; }
        else if (shape.includes('bubble')) { vy = -16 - h2 * 18; vx = (h1 - 0.5) * 14; spread = 18; }
        else if (shape.includes('leaf') || shape.includes('petal')) { vx = (target.x - origin.x) * 1.6 + (h1 - 0.5) * 30; vy = 12 + h2 * 16; grav = 22; spread = 22; }
        else if (shape.includes('bolt') || shape.includes('spark') || shape.includes('needle') || shape.includes('shard')) { spread = 6; vx *= 1.5; vy *= 1.5; }
        else if (shape.includes('aura') || shape.includes('sparkle') || shape.includes('rising')) { vx = (h1 - 0.5) * 10; vy = -26 - h2 * 22; spread = 24; }
        const sx = origin.x + (h2 - 0.5) * spread, sy = origin.y + (h3 - 0.5) * spread;
        const col = seq.dull ? '#b0b0bc' : def.colors[Math.floor(h1 * def.colors.length) % def.colors.length];
        this.fxSpawn(sx, sy, vx, vy, 190 + h3 * 160, 2 + Math.floor(h2 * 2), col, grav);
      }
      // Impact bursts (multi-hit moves burst once per hit).
      if (seq.t >= seq.burstAt && seq.bursts > 0) {
        seq.bursts--;
        seq.burstAt += 130;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + fxHash(seq.seed + i) * 0.5;
          const sp = 34 + fxHash(i * 7 + seq.seed) * 30;
          const col = seq.dull ? '#b0b0bc' : def.colors[i % def.colors.length];
          this.fxSpawn(defA.x, defA.y, Math.cos(ang) * sp, Math.sin(ang) * sp, 240, 2, col, 26);
        }
      }
      if (seq.t > seq.dur && seq.bursts <= 0) this.fxSeq = null;
      else if (seq.t > seq.dur + 400) this.fxSeq = null;
    }
    for (let i = 0; i < FX_POOL_MAX; i++) {
      const p = this.fxPool[i];
      if (!p.on) continue;
      p.t += dtms;
      if (p.t >= p.life) { p.on = false; continue; }
      const dt = dtms / 1000;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
    }
    if (this.breakFx) { this.breakFx.t += dtms; if (this.breakFx.t > 320) this.breakFx = null; }
  }

  // Knockback offset for a side at render time: fast out (40ms), then
  // an ease-out return completing by 200ms. Direction: away from the
  // attacker (foe knocked right/up-field, ally knocked left).
  fxKbOffset(side) {
    const kb = this.fxKb[side];
    if (!kb || kb.t > 200 || !kb.dist) return 0;
    const dir = side === 'foe' ? 1 : -1;
    const t = kb.t;
    const k = t < 40 ? (t / 40) : Math.pow(1 - (t - 40) / 160, 2); // out in 40ms, ease-out return by 200ms
    return dir * kb.dist * k;
  }

  fxRecoilOffset(side) {
    const rc = this.fxRecoil[side];
    if (!rc || rc.t > 160) return 0;
    const dir = side === 'foe' ? 1 : -1; // recoil pushes the attacker back, away from its target
    const k = Math.pow(1 - rc.t / 160, 2);
    return dir * 2 * k;
  }

  fxStartEntry(side, ballId) {
    if (this.rtMode || !this.fxAnimsOn()) { this.entryFx[side] = null; return; }
    this.entryFx[side] = { t: 0, ballId: ballId || 'pokeball' };
  }

  fxStartRecall(side, spr) {
    if (this.rtMode || !this.fxAnimsOn() || !spr) { this.recallFx = null; return; }
    this.recallFx = { side, spr, t: 0 };
  }

  ballArtFor(ballId) {
    if (!this._ballArtCache) this._ballArtCache = {};
    if (typeof document === 'undefined') return null;
    if (!(ballId in this._ballArtCache)) {
      try { this._ballArtCache[ballId] = ballBattleArt(document, ballId); } catch (e) { this._ballArtCache[ballId] = null; }
    }
    return this._ballArtCache[ballId];
  }

  // Draw one ball: the authored sprite when a canvas exists, else a
  // procedural rect ball in the SAME palette (rows of rects forming
  // the circle: top colour, dark band, button, bottom colour).
  drawBall(r, ballId, cx, cy, size, open) {
    const g = this.game;
    const cv = this.ballArtFor(ballId);
    if (cv && r.blitS) {
      if (open) {
        // Break-out: top hemisphere lifted and split from the bottom.
        const hw = size, hh = size / 2;
        r.blitS(cv, cx - size / 2 - 3, cy - size / 2 - 4, hw, size);
        return;
      }
      r.blitS(cv, cx - size / 2, cy - size / 2, size, size);
      return;
    }
    const pal = BALL_PALETTES[ballId] || BALL_PALETTES.pokeball;
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    const rad = size / 2;
    const rows = 8;
    for (let i = 0; i < rows; i++) {
      const yy = cy - rad + (i * size) / rows;
      const dy = Math.abs((i + 0.5) / rows - 0.5) * 2;
      const half = rad * Math.sqrt(Math.max(0.05, 1 - dy * dy));
      const col = i < 3 ? pal[0] : i === 3 ? '#202028' : i < 6 ? pal[2] : pal[3];
      F(col, cx - half, yy, half * 2, size / rows + 1);
    }
    F(pal[1], cx - rad * 0.45, cy - rad * 0.72, rad * 0.5, 2);
    F('#202028', cx - 2, cy - 2, 4, 4);
    F('#ffffff', cx - 1, cy - 1, 2, 2);
    if (open) F('#ffffff', cx - rad, cy - rad - 3, size, 2);
  }

  // Persistent condition overlay (FX-4) for one battler, drawn from
  // rects only, phase-driven by this.t (deterministic, no RNG).
  drawConditionOverlay(r, mon, cx, bottom, size) {
    if (!mon) return;
    const g = this.game;
    if (!this.fxAnimsOn()) return;
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    const step = Math.floor(this.t / 150);
    const top = bottom - size;
    const cond = mon.status === 'burn' ? 'cond.burn'
      : mon.status === 'poison' || mon.status === 'badlyPoisoned' ? 'cond.poison'
      : mon.status === 'paralysis' ? 'cond.paralysis'
      : mon.status === 'sleep' ? 'cond.sleep'
      : mon.status === 'freeze' ? 'cond.freeze' : null;
    const drawZ = (x, y, s, col) => { F(col, x, y, s, 2); F(col, x + s - 3, y + 2, 2, 2); F(col, x + s - 5, y + 4, 2, 2); F(col, x, y + 6, s, 2); };
    if (cond === 'cond.burn') {
      for (let i = 0; i < 5; i++) {
        const hx = fxHash(i * 17 + step * 3), rise = (step * 7 + i * 19) % 44;
        F(i % 2 ? '#f8d050' : '#f08030', cx + (hx - 0.5) * size * 0.7, bottom - 6 - rise, 3, 3);
      }
    } else if (cond === 'cond.poison') {
      for (let i = 0; i < 4; i++) {
        const hx = fxHash(i * 23 + step * 2), rise = (step * 5 + i * 23) % 40;
        F(i % 2 ? '#e0a8f0' : '#b058c8', cx + (hx - 0.5) * size * 0.6, bottom - 8 - rise, i % 2 ? 3 : 4, i % 2 ? 3 : 4);
      }
    } else if (cond === 'cond.paralysis') {
      for (let i = 0; i < 3; i++) {
        const hx = fxHash(i * 41 + step * 7), hy = fxHash(i * 13 + step * 5);
        const x = cx + (hx - 0.5) * size * 0.8, y = top + hy * size * 0.7;
        F('#f8e038', x, y, 2, 5); F('#f8e038', x + 2, y + 4, 2, 4); F('#e8a818', x + 1, y + 2, 2, 2);
      }
    } else if (cond === 'cond.sleep') {
      const rise = (step % 4) * 4;
      drawZ(cx + size * 0.28, top - 10 - rise, 8, '#a8b8e8');
      drawZ(cx + size * 0.42, top - 18 - rise, 11, '#6878b8');
    } else if (cond === 'cond.freeze') {
      const c = r.ctx;
      if (c) { c.save(); c.globalAlpha = 0.38; c.fillStyle = '#a8e4f8'; c.fillRect(cx - size / 2 + 4, top + 4, size - 8, size - 8); c.restore(); }
      F('#e8fbff', cx - size / 2 + 4, top + 4, size - 8, 2); F('#e8fbff', cx - size / 2 + 4, bottom - 6, size - 8, 2);
      F('#78d8e8', cx - size / 2 + 4, top + 4, 2, size - 8); F('#78d8e8', cx + size / 2 - 6, top + 4, 2, size - 8);
    }
    if (mon.confused) {
      for (let i = 0; i < 3; i++) {
        const a = step * 0.9 + i * 2.1;
        const x = cx + Math.cos(a) * size * 0.42, y = top - 2 + Math.sin(a) * 3;
        F('#f8d030', x - 1, y - 3, 2, 6); F('#f8d030', x - 3, y - 1, 6, 2);
      }
    }
    if (mon.seeded) {
      F('#2e7a28', cx - size * 0.4, bottom - 3, size * 0.8, 2);
      for (let i = 0; i < 4; i++) {
        const x = cx - size * 0.4 + i * size * 0.22;
        F('#58b838', x, bottom - 6 - (i % 2) * 2, 2, 4); F('#b8e888', x + 2, bottom - 7 - (i % 2) * 2, 3, 2);
      }
    }
  }

  // FX-6 entry wipe (variant by battle context) + exit mirror.
  drawEntryWipe(r, w, h) {
    const g = this.game;
    const st = g.state.settings || {};
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    if (st.reducedMotion) {
      if (this.entryT >= 200) return;
      const c = r.ctx; if (!c) return;
      c.save(); c.globalAlpha = (1 - this.entryT / 200) * 0.6; c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.restore();
      return;
    }
    if (!this.fxAnimsOn()) return;
    const dur = this.entryVariant === 'boss' ? 900 : this.entryVariant === 'legendary' ? 800 : this.entryVariant === 'trainer' ? 600 : 500;
    if (this.entryT >= dur) return;
    const k = this.entryT / dur, open = 1 - Math.pow(1 - k, 2); // ease-out reveal
    const kind = this.arenaKind ? this.arenaKind() : 'grass';
    if (this.entryVariant === 'boss') {
      if (this.entryT < 110) { const c = r.ctx; if (c) { c.save(); c.globalAlpha = 0.85 * (1 - this.entryT / 110); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.restore(); } }
      // Chevron bands sweep in from alternating edges and clear.
      for (let i = 0; i < 5; i++) {
        const y = (i * h) / 5, rem = (1 - open) * w;
        F(i % 2 ? '#c8a03a' : '#14141c', i % 2 ? w - rem : 0, y, rem, h / 5 + 1);
      }
      // VS beat: a gold divider sweeps the middle while the boss wipe runs.
      if (k > 0.25 && k < 0.95) F('#c8a03a', 0, h / 2 - 2, w * Math.min(1, (k - 0.25) * 2), 4);
    } else if (this.entryVariant === 'legendary') {
      const c = r.ctx; if (c) { c.save(); c.globalAlpha = (1 - k) * 0.45; c.fillStyle = '#483878'; c.fillRect(0, 0, w, h); c.restore(); }
      for (let ring = 0; ring < 3; ring++) {
        const inset = (ring * 14 + open * 60) % 70;
        F('#8878c8', inset, inset, w - inset * 2, 2); F('#8878c8', inset, h - inset - 2, w - inset * 2, 2);
        F('#8878c8', inset, inset, 2, h - inset * 2); F('#8878c8', w - inset - 2, inset, 2, h - inset * 2);
      }
    } else if (this.entryVariant === 'trainer') {
      const slats = 8, sh = h / slats;
      for (let i = 0; i < slats; i++) {
        const rem = (1 - open) * (w / 2);
        F('#20242e', 0, i * sh, rem, sh + 1); F('#20242e', w - rem, i * sh, rem, sh + 1);
      }
    } else { // wild — shutter tinted by terrain flavour
      const tint = kind === 'water' ? '#2050c8' : kind === 'cave' ? '#241d2e' : kind === 'gym' ? '#5a3a52' : '#2e7a28';
      const bands = 6, bh = h / bands;
      for (let i = 0; i < bands; i++) {
        const rem = (1 - open) * w * (i % 2 ? 0.9 : 0.7);
        F(tint, i % 2 ? w - rem : 0, i * bh, rem, bh + 1);
      }
    }
  }

  drawExitWipe(r, w, h) {
    if (this._exitStartT < 0 || !this.fxAnimsOn()) return;
    const k = Math.min(1, (this.t - this._exitStartT) / 300);
    if (k <= 0) return;
    const g = this.game;
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    const bands = 6, bh = h / bands;
    for (let i = 0; i < bands; i++) F('#101018', i % 2 ? w - w * k * 0.6 : 0, i * bh, w * k * 0.6, bh + 1);
  }

  drainHp(dt) {
    const g = this.game;
    // P0/E5: reduced motion -> HP drain snaps instantly (no 90 HP/s animation).
    if (g.state.settings.reducedMotion) {
      this.hpAnim.ally = this.ally.hp;
      this.hpAnim.foe = this.foe.hp;
    } else {
      // WP3 drain-duration cap: the classic 90 HP/s rate is kept for
      // ordinary hits, but a huge hit no longer leaves the bar crawling
      // for seconds after the text has moved on — when a side's target
      // changes, its drain rate for that episode is set so the bar
      // lands within 600ms however large the gap (visual catch-up
      // only; hpAnim converges to the same final values, sooner).
      if (!this._drainRate) this._drainRate = { ally: HP_DRAIN_PER_SEC, foe: HP_DRAIN_PER_SEC };
      if (!this._drainTarget) this._drainTarget = { ally: this.ally.hp, foe: this.foe.hp };
      for (const side of ['ally', 'foe']) {
        const mon = side === 'ally' ? this.ally : this.foe;
        if (mon.hp !== this._drainTarget[side]) {
          this._drainTarget[side] = mon.hp;
          this._drainRate[side] = Math.max(HP_DRAIN_PER_SEC, Math.abs(mon.hp - this.hpAnim[side]) / 0.6);
        }
      }
      if (this.hpAnim.ally !== this.ally.hp) {
        const d = this.ally.hp - this.hpAnim.ally;
        this.hpAnim.ally += Math.sign(d) * Math.min(Math.abs(d), this._drainRate.ally * dt);
        if (Math.abs(this.ally.hp - this.hpAnim.ally) < 1) this.hpAnim.ally = this.ally.hp;
      }
      if (this.hpAnim.foe !== this.foe.hp) {
        const d = this.foe.hp - this.hpAnim.foe;
        this.hpAnim.foe += Math.sign(d) * Math.min(Math.abs(d), this._drainRate.foe * dt);
        if (Math.abs(this.foe.hp - this.hpAnim.foe) < 1) this.hpAnim.foe = this.foe.hp;
      }
    }
    // Low-HP warning jingle at first crossing into red (<25%), once per ally
    // (gameux §4.2). Visual twin: the HP plate's red pulse + '!' pip.
    if (this._lowHpAlly !== this.ally) { this._lowHpAlly = this.ally; this._lowHpWarned = false; }
    const ratio = this.ally.maxHp > 0 ? this.ally.hp / this.ally.maxHp : 1;
    if (ratio > 0.25) this._lowHpWarned = false;
    else if (!this._lowHpWarned && this.ally.hp > 0) {
      this._lowHpWarned = true;
      g.audio.playSfx('lowhp'); // P0-5: wired (was dead code before the Wave-2 audio merge)
      // P1/E7: pulse the ally plate twice on first red crossing (not under reduced motion).
      if (!g.state.settings.reducedMotion) this._lowHpPulseT = 400;
    }
  }

  // UI v2 (Platinum standard): stepped circular battle platform, rects only
  // (5 horizontal bands, widest at the middle — a pixel disc, no arc/ellipse
  // calls): light rim on top, pale fill, darker shade band at the bottom.
  ptDisc(r, cx, cy, rx, ry) {
    const c = r.ctx;
    const steps = 5;
    // Premium+ W2 (AR-5): the disc is tinted by the battle's Ground —
    // rim/accent from the field's own palette (light top, ground steps,
    // dark base, accent rim line) instead of one beige disc on all 15
    // Grounds. Legacy no-field battles keep the shipped beige disc.
    const gid = this.field ? (this.field.id || this.field.groundId) : null;
    const ga = gymArenaFor(this.field) || (gid ? (ARENA_ART[gid] || null) : null);
    const cols = ga
      ? [ga.light, ga.ground[1], ga.ground[3], ga.ground[4], ga.dark]
      : ['#f2ecd8', '#ddd2ac', '#ddd2ac', '#ddd2ac', '#b3a586'];
    for (let i = 0; i < steps; i++) {
      const t = (i / (steps - 1)) * 2 - 1; // -1 (top) .. 1 (bottom)
      const half = Math.max(4, Math.round(rx * Math.sqrt(Math.max(0.12, 1 - t * t))));
      const y0 = Math.round(cy + t * ry - ry / steps);
      const hh = Math.ceil((2 * ry) / steps) + 1;
      c.fillStyle = cols[i];
      c.fillRect(Math.round(cx - half), y0, half * 2, hh);
    }
    if (ga) { // accent rim: a 1px field-accent line on the disc's top edge
      c.fillStyle = ga.accent;
      c.fillRect(Math.round(cx - rx * 0.62), Math.round(cy - ry), Math.round(rx * 1.24), 1);
    }
  }

  // Premium+ W2 (AN-1d / AR-5): the battler's contact shadow — a soft
  // dark pool ON the disc, distinct from the disc itself, that tracks
  // the battler's idle motion: as the battler rises (dy < 0) the shadow
  // narrows and fades; as it settles (dy > 0) it widens and deepens.
  // Rects only, pooled state (none — pure function of the idle offset).
  contactShadow(r, cx, cy, baseRx, dy) {
    const c = r.ctx;
    if (!c) return;
    const lift = Math.max(-4, Math.min(3, dy || 0)); // idle dy range
    const rx = Math.max(8, Math.round(baseRx * (1 + lift * 0.045)));
    const a = 0.30 + lift * 0.03;
    c.save();
    c.fillStyle = '#101018';
    c.globalAlpha = Math.max(0.12, a - 0.12);
    c.fillRect(Math.round(cx - rx), Math.round(cy) - 1, rx * 2, 3);
    c.globalAlpha = Math.max(0.16, a);
    c.fillRect(Math.round(cx - rx * 0.72), Math.round(cy), Math.round(rx * 1.44), 2);
    c.restore();
  }

  // Premium+ W2 (AN-1): idle motion for one battler — the procedural
  // class mechanism rendered over the authored frames. Returns the
  // shared per-side scratch { dx, dy, frame } (frame: 'base' | 'bob' |
  // 'accent'); writes into preallocated scratch, never allocates.
  // Gated 100% by the W1 settings gate: battleAnims off or
  // reducedMotion on => the shipped static pose, exactly as at base.
  idleMotion(side, speciesId) {
    if (!this._idleScratch) this._idleScratch = { foe: { dx: 0, dy: 0, frame: 'base' }, ally: { dx: 0, dy: 0, frame: 'base' } };
    const out = this._idleScratch[side];
    out.dx = 0; out.dy = 0; out.frame = 'base';
    if (!this.fxAnimsOn()) return out;
    const P = IDLE_CLASS_PARAMS[idleClassOf(speciesId)] || IDLE_CLASS_PARAMS.grounded;
    const t = this.t + idlePhaseOf(speciesId) * 4000 + (side === 'ally' ? 1300 : 0);
    const w2 = Math.PI * 2;
    out.dy = Math.round(Math.sin(t * w2 / P.periodY) * P.ampY * 10) / 10;
    out.dx = P.ampX ? Math.round(Math.sin(t * w2 / P.periodX) * P.ampX * 10) / 10 : 0;
    const ac = t % P.accentEvery;
    if (ac < 230) out.frame = 'accent';
    else if (P.bobRate < P.periodY) out.frame = ((t % P.bobRate) / P.bobRate) < 0.5 ? 'bob' : 'base'; // hover/serpentine flap-flow
    else if (idleClassOf(speciesId) === 'inert') out.frame = 'base'; // inert life is the accent window + breath pulse
    else out.frame = Math.sin(t * w2 / P.periodY) > 0.25 ? 'bob' : 'base'; // grounded breathe
    return out;
  }

  // Premium+ W2 (AR-2): the animated ambient layer — ARENA_AMBIENT
  // picks the element per Ground; positions are a pure function of
  // the theater clock and arenaHash (phase-varied, deterministic).
  // With the motion gate off (battleAnims off / reducedMotion) the
  // same elements render as a static scatter at their phase positions.
  drawArenaAmbient(r, ga, gid, w, h, horizon) {
    if (!ga || !gid) return;
    const amb = (ga && ga.amb) || ARENA_AMBIENT[gid];
    if (!amb) return;
    const g = this.game;
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    const motion = this.fxAnimsOn();
    const t = motion ? this.t : 0;
    const fieldH = Math.max(8, h - horizon - 6);
    for (let i = 0; i < amb.n; i++) {
      const h1 = arenaHash(i, 211), h2 = arenaHash(i, 223), h3 = arenaHash(i, 227);
      const drift = (t * amb.speed / 1000) * (0.6 + h3 * 0.7);
      let x, y;
      if (amb.kind === 'rain') {
        x = Math.floor(h1 * w + drift * 2.2) % w;
        y = horizon + Math.floor((h2 * fieldH + drift * 6) % fieldH);
        F(ga.light, x, y, 1, 4);
      } else if (amb.kind === 'ember' || amb.kind === 'bubble') {
        x = Math.floor(h1 * w + Math.sin((t / 700) + h3 * 6.28) * 3 + w) % w;
        y = horizon + Math.floor(((h2 * fieldH - drift * 2.4) % fieldH + fieldH) % fieldH);
        F(i % 3 ? ga.accent : ga.light, x, y, 2, 2);
      } else if (amb.kind === 'spark') {
        // sparks blink in place: position is hash-fixed, visibility is
        // phase — at least half the set is lit at any sampled instant.
        x = Math.floor(h1 * w); y = horizon + Math.floor(h2 * fieldH);
        const lit = !motion || Math.sin(t / 300 + h3 * 12.56) > -0.2;
        if (lit) F(i % 2 ? ga.accent : ga.light, x, y, 2, 2);
      } else if (amb.kind === 'petal' || amb.kind === 'snow') {
        x = Math.floor((h1 * w + drift * 3 + Math.sin(t / 500 + h3 * 6.28) * 4 + w * 2) % w);
        y = horizon + Math.floor((h2 * fieldH + drift * 1.7) % fieldH);
        F(i % 3 ? ga.light : ga.accent, x, y, 2, amb.kind === 'snow' ? 2 : 1);
      } else { // mote: slow dust/spirit motes wandering the field
        x = Math.floor((h1 * w + Math.sin(t / 900 + h3 * 6.28) * 6 + w) % w);
        y = horizon + Math.floor((h2 * fieldH + Math.cos(t / 1100 + h1 * 6.28) * 4 + fieldH) % fieldH);
        F(i % 2 ? ga.light : ga.accent, x, y, 2, 1);
      }
    }
  }

  // UI v2.3 (defect 4): which arena backdrop this battle gets. Explicit
  // opts.arena wins (fishing passes 'water'); otherwise derive from the
  // overworld the battle returns to: surfing = water, gym interiors =
  // gym, cave/tunnel maps = cave, everything else = grass route.
  arenaKind() {
    if (this.arena) return this.arena;
    const ow = this.returnTo;
    if (ow && ow.surfing) return 'water';
    const id = (ow && ow.mapId) || '';
    const nm = (ow && ow.map && ow.map.name) || '';
    if (/gym/i.test(id) || /gym/i.test(nm)) return 'gym';
    if (/cave|tunnel|mtmoon|victory|diglett/i.test(id)) return 'cave';
    return 'grass';
  }

  // UI v2.3 (defect 4): the battlefield backdrop, rects only, drawn INSIDE
  // begin()/end(). v2 drew flat color bands; the Platinum standard is a
  // TEXTURED field, so every surface here is worked: ordered-dither sky
  // (checker mixes at band boundaries, DS-style), detailed horizon
  // (tree line / wave crests / rock teeth / gym trim), and a ground of
  // perspective rows — heights grow toward the viewer — with per-variant
  // speckle (grass tufts, foam dashes, rock chunks, floor seams). All
  // texture placement runs through arenaHash, so the field is identical
  // every frame. Variants: grass route, cave, water, gym (arenaKind()).
  // Platforms/plates are unchanged (ptDisc + plate()).
  drawArena(r, horizonFrac) {
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    const horizon = Math.round(h * horizonFrac);
    const kind = this.arenaKind();
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);
    // Wave 6c: the per-Ground treatment for battle.field (null when a
    // minimal/legacy caller has no field — the legacy kind backdrop
    // below then serves unchanged).
    // Gym Identity T0: a gym map's own treatment (GYM_ARENA_ART) wins
    // over its Ground's when one exists; empty at T0, so this reduces
    // to the Wave 6c read for every battle.
    const gid = this.field ? (this.field.id || this.field.groundId) : null;
    const ga = gymArenaFor(this.field) || (gid ? (ARENA_ART[gid] || null) : null);

    // ---- upper field: per-Ground bands, else sky (grass/water) or wall (cave/gym) ----
    if (ga) {
      const sb = Math.ceil(horizon / ga.sky.length) || 1;
      for (let i = 0; i < ga.sky.length; i++) F(ga.sky[i], 0, i * sb, w, sb + 1);
      for (let i = 0; i < ga.sky.length - 1; i++) {
        const yBase = (i + 1) * sb;
        for (let dy = 2; dy >= 1; dy--) {
          const y = yBase - dy;
          if (y < 0 || y >= horizon) continue;
          for (let x = 0; x < w; x += 3) {
            if ((((x / 3) | 0) + y) % 2 === 0 && (dy === 1 || ((x / 3) | 0) % 2 === 0)) F(ga.sky[i + 1], x, y, 3, 1);
          }
        }
      }
      if (ga.haze) for (let i = 0; i < 5; i++) {
        const cx = Math.floor(arenaHash(i, 71) * (w - 40)) + 4;
        const cy = 3 + Math.floor(arenaHash(i, 83) * Math.max(4, horizon * 0.45));
        F(ga.light, cx, cy, 16, 3); F(ga.light, cx + 4, cy - 2, 9, 2); F(ga.dark, cx + 2, cy + 3, 12, 2);
      }
      if (ga.motif === 'tombs' || ga.motif === 'runes' || ga.motif === 'rocks') {
        // Premium+ W2 (AR-4): the speckle is confined to its layer
        // band — a 12px strip just above the horizon (weathering on
        // the far silhouette), NEVER scattered over the sky region:
        // 0 non-sky pixels in the sky for these motifs.
        for (let i = 0; i < Math.floor(w / 3); i++) {
          const sx = Math.floor(arenaHash(i, 11) * w), sy = horizon - 6 - Math.floor(arenaHash(i, 23) * 12);
          F(arenaHash(i, 37) > 0.5 ? ga.dark : ga.accent, sx, sy, 2, 2);
        }
      }
    } else if (kind === 'cave') {
      const wall = ['#241d2e', '#2b2338', '#332a42', '#3b314c', '#433856', '#4b4060'];
      const wb = Math.ceil(horizon / wall.length) || 1;
      for (let i = 0; i < wall.length; i++) F(wall[i], 0, i * wb, w, wb + 1);
      // Rock speckle across the wall face.
      for (let i = 0; i < Math.floor(w / 3); i++) {
        const sx = Math.floor(arenaHash(i, 11) * w), sy = Math.floor(arenaHash(i, 23) * Math.max(1, horizon - 4));
        F(arenaHash(i, 37) > 0.5 ? '#1a1424' : '#5a4c74', sx, sy, 2, 2);
      }
      // Stalactites: stepped teeth hanging from the ceiling line.
      for (let x = 2, i = 0; x < w - 6; x += 13, i++) {
        const len = 4 + Math.floor(arenaHash(i, 5) * 9);
        F('#1a1424', x, 0, 5, Math.max(2, len - 3));
        F('#1a1424', x + 1, 0, 3, len);
        F('#120d1a', x + 2, 0, 1, len + 2);
      }
    } else if (kind === 'gym') {
      // Indoor wall: deep two-tone panels, vertical seams, a banner band.
      F('#5a3a52', 0, 0, w, Math.max(2, horizon - 14));
      F('#6b4660', 0, Math.max(0, horizon - 14), w, 12);
      for (let x = 0; x < w; x += 32) F('#452c40', x, 0, 2, Math.max(2, horizon - 2));
      for (let x = 16, i = 0; x < w - 10; x += 48, i++) {
        F(i % 2 ? '#c8a03a' : '#b03a48', x, 4, 12, 8); // hanging banners
        F('#2b3040', x, 12, 12, 1);
      }
      F('#2b3040', 0, horizon - 3, w, 3); // baseboard trim
    } else {
      const sky = kind === 'water'
        ? ['#4f97dd', '#61a6e6', '#73b4ee', '#85c1f4', '#97cdf8', '#aad8fa']
        : ['#5f9fe6', '#6fabec', '#7fb7f1', '#8fc3f5', '#9fcdf8', '#b0d7fa'];
      const sb = Math.ceil(horizon / sky.length) || 1;
      for (let i = 0; i < sky.length; i++) F(sky[i], 0, i * sb, w, sb + 1);
      // Ordered dither: the last two rows of each band checker-mix the
      // next band's color, denser on the final row (DS sky softening).
      for (let i = 0; i < sky.length - 1; i++) {
        const yBase = (i + 1) * sb;
        for (let dy = 2; dy >= 1; dy--) {
          const y = yBase - dy;
          if (y < 0 || y >= horizon) continue;
          for (let x = 0; x < w; x += 3) {
            if ((((x / 3) | 0) + y) % 2 === 0 && (dy === 1 || ((x / 3) | 0) % 2 === 0)) F(sky[i + 1], x, y, 3, 1);
          }
        }
      }
      // Pixel clouds: soft rect clusters at hashed anchor points.
      for (let i = 0; i < 5; i++) {
        const cx = Math.floor(arenaHash(i, 71) * (w - 40)) + 4;
        const cy = 3 + Math.floor(arenaHash(i, 83) * Math.max(4, horizon * 0.45));
        F('#eaf5ff', cx, cy, 16, 3); F('#eaf5ff', cx + 4, cy - 2, 9, 2); F('#dcefff', cx + 2, cy + 3, 12, 2);
      }
    }

    // ---- horizon detail: per-Ground motif, else the legacy kind detail ----
    if (ga) {
      // Premium+ W2 (AR-1): the FAR SILHOUETTE BAND — a fifth layer
      // between sky and horizon motif, in its own palette step (the
      // sky's deepest tone, darkened): a broken ridge of far shapes
      // whose rhythm is hashed per Ground, so each field has depth
      // behind its motif row. Drawn before the motif so the motif
      // row stands in front of it.
      const farCol = arenaShade(ga.sky[ga.sky.length - 1], 0.66);
      for (let x = -6, i = 0; x < w + 6; x += 15, i++) {
        const fh = 10 + Math.floor(arenaHash(i, 97) * 13);
        const fw = 9 + Math.floor(arenaHash(i, 103) * 8);
        F(farCol, x, horizon - fh, fw, fh);
        if (arenaHash(i, 109) > 0.55) F(farCol, x + 3, horizon - fh - 3, Math.max(3, fw - 6), 3);
      }
      const M = ga.motif, A = ga.accent, D = ga.dark, L = ga.light;
      if (M === 'trees' || M === 'flowers' || M === 'reeds') {
        F(D, 0, horizon - 8, w, 8);
        for (let x = 4, i = 0; x < w - 8; x += 18, i++) {
          const bh = 8 + Math.floor(arenaHash(i, 3) * 8);
          F(D, x, horizon - bh, 10, bh); F(A, x + 2, horizon - bh + 2, 2, 2); F(L, x + 6, horizon - bh + 3, 2, 2);
          if (M === 'reeds') F(A, x + 12, horizon - 12, 2, 12);
          if (M === 'flowers') { F(A, x + 3, horizon - 3, 2, 2); F(L, x + 9, horizon - 2, 2, 2); }
        }
        F(A, 0, horizon - 3, w, 3); F(D, 0, horizon, w, 2);
      } else if (M === 'waves') {
        for (let x = 2, i = 0; x < w - 6; x += 11, i++) {
          if (arenaHash(i, 17) > 0.3) F(L, x, horizon - 2, 5, 1);
          if (arenaHash(i, 29) > 0.55) F(A, x + 3, horizon - 4, 4, 1);
          if (i % 3 === 0) F(D, x, horizon - 6, 6, 3);
        }
        F(D, 0, horizon, w, 2);
      } else if (M === 'rocks' || M === 'tombs' || M === 'spires') {
        for (let x = 0, i = 0; x < w - 4; x += 9, i++) {
          const th = 3 + Math.floor(arenaHash(i, 41) * 7);
          F(D, x, horizon - th, 6, th);
          if (M === 'tombs' && i % 2 === 0) F(A, x + 1, horizon - th - 4, 4, 4);
          if (M === 'spires') F(L, x + 2, horizon - th - 2, 2, 2);
        }
        F(D, 0, horizon, w, 2);
      } else if (M === 'flames') {
        for (let x = 2, i = 0; x < w - 6; x += 13, i++) {
          const fh = 5 + Math.floor(arenaHash(i, 51) * 8);
          F(A, x, horizon - fh, 6, fh); F(L, x + 2, horizon - Math.max(2, fh - 3), 2, Math.max(2, fh - 3)); F(D, x - 1, horizon - 2, 8, 2);
        }
        F(D, 0, horizon, w, 2);
      } else if (M === 'storm') {
        for (let x = 6, i = 0; x < w - 10; x += 34, i++) {
          F(D, x, horizon - 14, 14, 5); F(D, x + 3, horizon - 17, 8, 3);
          if (i % 2 === 0) { F(L, x + 6, horizon - 9, 2, 4); F(L, x + 4, horizon - 5, 2, 3); F(L, x + 6, horizon - 2, 2, 2); }
          if (ga.pylon) { F(D, x + 16, horizon - 16, 2, 16); F(D, x + 12, horizon - 16, 10, 2); }
        }
        F(D, 0, horizon, w, 2);
      } else if (M === 'shrooms') {
        for (let x = 4, i = 0; x < w - 8; x += 20, i++) {
          const mh = 6 + Math.floor(arenaHash(i, 61) * 6);
          F(L, x + 4, horizon - mh, 3, mh); F(A, x, horizon - mh - 3, 11, 4); F(L, x + 2, horizon - mh - 2, 2, 1);
        }
        F(D, 0, horizon, w, 2);
      } else if (M === 'runes') {
        for (let x = 8, i = 0; x < w - 8; x += 26, i++) {
          const fh = 6 + Math.floor(arenaHash(i, 67) * 10);
          F(A, x, horizon - fh, 3, fh); F(L, x + 1, horizon - fh, 1, 3); F(A, x - 2, horizon - fh + 3, 7, 2);
          F(L, x + 1, horizon - fh - 3, 2, 3);
        }
        F(D, 0, horizon, w, 2);
      } else { // snow
        for (let x = 0, i = 0; x < w - 6; x += 12, i++) {
          const sh = 3 + Math.floor(arenaHash(i, 73) * 5);
          F(L, x, horizon - sh, 9, sh); if (i % 2) F(A, x + 3, horizon - sh - 3, 2, 3);
        }
        F(A, 0, horizon, w, 2);
      }
    } else if (kind === 'grass') {
      F('#5d8f66', 0, horizon - 8, w, 8);
      for (let x = 4, i = 0; x < w - 8; x += 18, i++) {
        const bh = 8 + Math.floor(arenaHash(i, 3) * 8);
        F('#3f6d4a', x, horizon - bh, 10, bh);
        F('#2f5739', x + 2, horizon - bh + 2, 2, 2);
        F('#527f5c', x + 6, horizon - bh + 3, 2, 2);
      }
      F('#4c7a56', 0, horizon - 3, w, 3);
      F('#33513c', 0, horizon, w, 2);
    } else if (kind === 'water') {
      // Distant wave crests breaking along the horizon.
      for (let x = 2, i = 0; x < w - 6; x += 11, i++) {
        if (arenaHash(i, 17) > 0.35) F('#eaf7ff', x, horizon - 2, 5, 1);
        if (arenaHash(i, 29) > 0.6) F('#cfeaff', x + 3, horizon - 4, 4, 1);
      }
      F('#2d68b0', 0, horizon, w, 2);
    } else if (kind === 'cave') {
      // Rock teeth silhouettes rising to meet the wall.
      for (let x = 0, i = 0; x < w - 4; x += 9, i++) {
        const th = 3 + Math.floor(arenaHash(i, 41) * 7);
        F('#1a1424', x, horizon - th, 6, th);
      }
      F('#120d1a', 0, horizon, w, 2);
    } else { // gym
      F('#2b3040', 0, horizon, w, 2);
    }

    // ---- ground: perspective rows with per-variant texture ----
    // Wave 6c: the Ground's own ground palette wins, except the Open
    // trainer field, which keeps its legacy sandy tournament floor.
    const useGa = ga && !(gid === 'open' && this.kind === 'trainer');
    const pal = useGa ? ga.ground : kind === 'cave'
      ? ['#57456a', '#514163', '#4b3d5c', '#453955', '#3f354e', '#392f47']
      : kind === 'water'
        ? ['#4d8fd8', '#4787ce', '#417fc4', '#3b77ba', '#356fb0', '#2f67a6']
        : kind === 'gym'
          ? ['#c2a172', '#b99a6c', '#b09366', '#a78c60', '#9e855a', '#957e54']
          : this.kind === 'trainer'
            ? ['#cfc2a4', '#c4b696', '#b9aa89', '#ae9e7d', '#a39271', '#988665']
            : ['#a5dc82', '#9bd578', '#91ce6f', '#87c766', '#7dc05d', '#73b954'];
    const dark = useGa ? ga.dark : kind === 'cave' ? '#2a2138' : kind === 'water' ? '#27609e' : kind === 'gym' ? '#7d6742' : this.kind === 'trainer' ? '#7d6c4c' : '#4f9440';
    const light = useGa ? ga.light : kind === 'cave' ? '#6c587f' : kind === 'water' ? '#eaf7ff' : kind === 'gym' ? '#d9bf92' : this.kind === 'trainer' ? '#e6dcc2' : '#c8ef9f';
    let y = horizon + 2, rh = 2, row = 0;
    const groundH = Math.max(1, h - horizon - 2);
    while (y < h) {
      const t = Math.min(1, (y - horizon) / groundH);
      F(pal[Math.min(pal.length - 1, Math.floor(t * pal.length))], 0, y, w, rh + 1);
      const n = Math.floor(w / 9);
      for (let i = 0; i < n; i++) {
        const sx = Math.floor(arenaHash(i * 3 + row * 57, row * 131) * (w - 5));
        const sy = y + Math.floor(arenaHash(i, row * 7 + 1) * Math.max(1, rh - 1));
        const tone = arenaHash(i + row * 3, 999) > 0.45 ? dark : light;
        if (useGa) {
          // Wave 6c ground textures: foam dashes on water grounds, rock
          // chunks on hard grounds, sparks/petals/bubbles as accents,
          // tuft-family flecks everywhere else.
          if (ga.tex === 'foam') { if (tone === light) F(tone, sx, sy, 4, 1); }
          else if (ga.tex === 'chunk') F(tone, sx, sy, 3, 2);
          else if (ga.tex === 'spark') { if (tone === light) F(tone, sx, sy, 2, 2); else F(tone, sx, sy, 2, 1); }
          else if (ga.tex === 'petal') F(arenaHash(i, row * 7) > 0.6 ? ga.accent : tone, sx, sy, 2, 1);
          else if (ga.tex === 'bubble') { if (tone === light) { F(tone, sx, sy, 2, 1); F(tone, sx, sy + 1, 1, 1); } }
          else F(tone, sx, sy, 1, Math.min(3, rh));
        }
        else if (kind === 'grass' && this.kind !== 'trainer') F(tone, sx, sy, 1, Math.min(3, rh)); // grass tufts
        else if (kind === 'water') { if (tone === light) F(tone, sx, sy, 4, 1); } // foam dashes
        else if (kind === 'cave') F(tone, sx, sy, 3, 2); // rock chunks
        else if (kind === 'gym') { if (arenaHash(i, row * 13) > 0.72) F(dark, sx, y, 1, rh); } // floor seams splay per row
        else F(tone, sx, sy, 2, 1); // stone flecks (trainer field)
      }
      y += rh;
      rh = Math.min(15, Math.ceil(rh * 1.45));
      row++;
    }
    // Premium+ W2 (AR-1): FOREGROUND OVERLAY — the fifth layer: a
    // bottom-edge fringe in the field's dark tone (grass blades, ash,
    // rubble, foam — read from the motif family) that the battlers
    // stand BEHIND, closing the flat backdrop-card read.
    if (ga) {
      for (let x = 2, i = 0; x < w - 2; x += 9, i++) {
        const fh = 2 + Math.floor(arenaHash(i, 131) * 5);
        F(ga.dark, x, h - fh, 3, fh);
        if (i % 3 === 0) F(ga.accent, x + 1, h - fh - 1, 1, 1);
      }
      F(ga.dark, 0, h - 2, w, 2);
    }
    // Premium+ W2 (AR-2): animated ambient layer (phase-varied drift).
    this.drawArenaAmbient(r, ga, gid, w, h, horizon);
    // ADR-025 §1: the arena backdrop tint shifts toward the Ground — a
    // flat palette shift of the EXISTING per-area backdrop (no new
    // scenes, no gradients): one translucent flat wash in the Ground's
    // tint over the drawn field. Guarded for the QA minimal-this call.
    // Wave 6c: when the per-Ground arena art above is on screen it
    // already carries the field's identity, so the wash drops to 0.05
    // (kept, not removed — the hue shift and the GROUND chip/banner
    // information are unchanged); legacy no-field battles keep 0.13.
    if (this.field && this.field.tint && r.ctx) {
      const c = r.ctx;
      c.save();
      c.globalAlpha = ga ? 0.05 : 0.13;
      c.fillStyle = this.field.tint;
      c.fillRect(0, 0, w, h);
      c.restore();
    }
  }

  render(r) {
    const g = this.game;
    if (this.rtMode && this.rt && (this.state === 'rt' || this.state === 'xp')) { this.renderRt(r); return; }
    const w = r.viewW, h = r.viewH;
    this._fxView = { w, h }; // W1: FX anchors track the live view
    // Transform discipline (title/intro pattern): pin the camera to the
    // origin for the screen-space theater, restore it after end().
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    this.drawArena(r, 0.42);
    // Platforms: foe upper-right, ally lower-left (wireframes §5.1 — the Uix
    // ruling: gameux §4.2's "upper-left" was the spec's error; the build is correct).
    const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allyArt = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    // Premium+ W2 (AN-1): idle life is per-species class motion over
    // the authored frames — grounded breathe / hover flap / serpentine
    // flow / inert accent (src/data/idle-classes.mjs) — replacing the
    // one shared sine both battlers used to ride. Frame picks: the
    // authored accent delta inside its window, else the bob frame
    // (fronts: build-derived since Wave 6; backs: W2 shift-delta
    // parity, all 163), else the base pose. With the motion gate off
    // idleMotion returns the static base pose (shipped behaviour).
    const foeIdle = this.idleMotion('foe', this.foe.speciesId);
    const allyIdle = this.idleMotion('ally', this.ally.speciesId);
    const foePos = { x: w * 0.62 + foeIdle.dx, y: h * 0.12 + foeIdle.dy };
    const allyPos = { x: w * 0.14 + allyIdle.dx, y: h * 0.52 + allyIdle.dy };
    let foeSpr = foeIdle.frame === 'accent' && foeArt.frontAccent ? foeArt.frontAccent
      : (foeIdle.frame === 'bob' && foeArt.frontBob) ? foeArt.frontBob : foeArt.front;
    let allySpr = allyIdle.frame === 'accent' && allyArt.backAccent ? allyArt.backAccent
      : (allyIdle.frame === 'bob' && allyArt.backBob) ? allyArt.backBob : allyArt.back;
    // README impact transform: white palette-swap on the defender for 2 frames.
    if (this.impactFx) {
      if (this.impactFx.side === 'foe' && foeArt.frontWhite) foeSpr = foeArt.frontWhite;
      if (this.impactFx.side === 'ally' && allyArt.backWhite) allySpr = allyArt.backWhite;
    }
    // Wave 0 battler size standard: ONE draw size for both sides,
    // derived from each side's art entry (`size` = BATTLER_DRAW_SIZE,
    // 64 logical px — legacy 32px art upscales x2, 64px art draws 1:1).
    // pos keeps its legacy meaning (top-left of the old 48px frame):
    // the battler is anchored on the frame's center-x and bottom edge,
    // so the platforms below and the plates do not move — only the
    // sprite's extent grows, identically for foe and ally (parity).
    const drawBattler = (spr, pos, side, art) => {
      if (this.faintFx && this.faintFx.side === side) return; // faint anim draws it
      if (this.recallFx && this.recallFx.side === side) return; // W1: recall shrink draws it
      if (side === 'foe' && this.state === 'catchseq' && this.catchState && this.catchState.absorbed) return; // W1: absorbed into the ball
      const efx = this.entryFx[side];
      if (efx && efx.t < 250) return; // W1 FX-5: ball still in flight, battler not yet materialized
      let size = (art && art.size) || BATTLER_DRAW_SIZE;
      if (efx && efx.t < 450) { // materialize: ease-out scale-in over 200ms
        const k = (efx.t - 250) / 200, e = 1 - Math.pow(1 - k, 2);
        size = Math.max(8, Math.round(size * (0.3 + 0.7 * e)));
      }
      // W1 FX-2: knockback + recoil displacement ride the same anchor.
      const cx = pos.x + 24 + this.fxKbOffset(side) + this.fxRecoilOffset(side), bottom = pos.y + 48;
      // README attack transform: 1.2x scale for 3 frames, then back
      // (size derived from the same standard, centered on the battler).
      if (this.atkFx && this.atkFx.side === side) {
        const atk = Math.round(size * 1.2);
        r.blitS(spr, cx - atk / 2, bottom - size / 2 - atk / 2, atk, atk);
      } else r.blitS(spr, cx - size / 2, bottom - size, size, size);
    };
    // Platinum battle platforms: stepped discs under each battler (the far
    // foe disc is smaller — perspective), drawn before the sprites.
    this.ptDisc(r, foePos.x + 24, foePos.y + 44, 34, 8);
    this.ptDisc(r, allyPos.x + 24, allyPos.y + 44, 38, 9);
    // Premium+ W2 (AN-1d): contact shadows ride ON the discs and track
    // each battler's idle offset — a battler never floats.
    this.contactShadow(r, foePos.x + 24, foePos.y + 45, Math.round(26 * ((foeArt && foeArt.size) || BATTLER_DRAW_SIZE) / 64), foeIdle.dy);
    this.contactShadow(r, allyPos.x + 24, allyPos.y + 45, Math.round(30 * ((allyArt && allyArt.size) || BATTLER_DRAW_SIZE) / 64), allyIdle.dy);
    // Wave 3b: during the intro chain (state 'intro' — challenge and
    // send-out messages), the authored trainer figures stand on the
    // platforms instead of the battlers: Ash's battle back on the ally
    // platform, the foe trainer's battle sprite on the foe platform
    // when one exists. A side without intro art keeps its battler
    // (graceful degrade). The battlers take over untouched the moment
    // the intro hands off — no state, timing, or message changes.
    // Premium+ W2 (TR-2): intro figures SLIDE in with the plates —
    // 380ms ease-out from their screen edge (foe from the right, Ash
    // from the left) — and THROW: while a side's send-out ball is in
    // flight during the intro, that side's figure shows its throw
    // pose (the FX-5 ball arc below originates from its hand).
    // Motion gate off => figures stand at rest, exactly as shipped.
    const introFigure = (cv, pos, side) => {
      if (!cv || !cv.width || !cv.height) return false;
      let useCv = cv;
      const efx = this.entryFx && this.entryFx[side];
      if (efx && efx.t < 250 && this.state === 'intro') {
        const throwCv = side === 'foe' ? this._introFoeThrow : this._introAllyThrow;
        if (throwCv && throwCv.width) useCv = throwCv;
      }
      const hh = 64, ww = Math.round(useCv.width * (hh / useCv.height));
      let ox = 0;
      if (this.fxAnimsOn()) {
        const p = Math.max(0, Math.min(1, this.t / 380));
        const e = 1 - Math.pow(1 - p, 3);
        ox = (1 - e) * (side === 'foe' ? 90 : -90);
      }
      r.blitS(useCv, pos.x + 24 - ww / 2 + ox, pos.y + 48 - hh, ww, hh);
      return true;
    };
    const inIntro = this.state === 'intro';
    // Premium+ W2 (TR-4): on victory the foe TRAINER returns — in its
    // defeat pose — for the lose dialogue, instead of the dialogue
    // playing over the battlers.
    const inVictory = this.state === 'victory' && !!this.trainer;
    let foeFigureDrawn = false;
    if (inIntro) foeFigureDrawn = introFigure(this._introFoeArt, foePos, 'foe');
    else if (inVictory && this._defeatFoeArt && this._defeatFoeArt.width) {
      const cv = this._defeatFoeArt, hh = 64, ww = Math.round(cv.width * (hh / cv.height));
      r.blitS(cv, foePos.x + 24 - ww / 2, foePos.y + 48 - hh + 3, ww, hh); // +3: the slump
      foeFigureDrawn = true;
    }
    if (!foeFigureDrawn) drawBattler(foeSpr, foePos, 'foe', foeArt);
    if (!(inIntro && introFigure(this._introAllyArt, allyPos, 'ally'))) drawBattler(allySpr, allyPos, 'ally', allyArt);
    // README faint transform: sink 8px + fade to 0 alpha over 20 frames.
    if (this.faintFx) {
      const k = Math.min(1, this.faintFx.t / 660);
      const c = r.ctx;
      c.save();
      c.globalAlpha = 1 - k;
      const pos = this.faintFx.side === 'foe' ? foePos : allyPos;
      const art = this.faintFx.side === 'foe' ? foeArt : allyArt;
      const size = (art && art.size) || BATTLER_DRAW_SIZE;
      r.blitS(this.faintFx.spr, pos.x + 24 - size / 2, pos.y + 48 - size + 8 * k, size, size);
      c.restore();
    }
    // W1 FX-5: recall shrink (switch-out / catch absorb) — the old
    // battler beams down toward its ball point over 250ms.
    if (this.recallFx) {
      const rf = this.recallFx, k = Math.min(1, rf.t / 250);
      const pos = rf.side === 'foe' ? foePos : allyPos;
      const art2 = rf.side === 'foe' ? foeArt : allyArt;
      const size0 = (art2 && art2.size) || BATTLER_DRAW_SIZE;
      const sz = Math.max(6, Math.round(size0 * (1 - k * 0.85)));
      const cx = pos.x + 24, bottom = pos.y + 48 - k * 12;
      const c = r.ctx; c.save(); c.globalAlpha = 1 - k * 0.55;
      r.blitS(rf.spr, cx - sz / 2, bottom - sz, sz, sz);
      c.restore();
      g.ctx2dfill('#ffffff', cx - 1, bottom - sz - 7, 2, 7); // recall beam
    }
    // W1 FX-5: send-out ball arcs + release bursts.
    for (const side of ['foe', 'ally']) {
      const efx = this.entryFx[side];
      if (!efx) continue;
      const pos = side === 'foe' ? foePos : allyPos;
      const tx = pos.x + 24, ty = pos.y + 40;
      if (efx.t < 250) {
        const k = efx.t / 250;
        let ox = side === 'foe' ? w * 0.94 : w * 0.04, oy = side === 'foe' ? h * 0.08 : h * 0.66;
        // Premium+ W2 (TR-2): during the intro the arc originates
        // from the throwing figure's hand — the foe trainer's hand
        // on their platform, Ash's hand on his.
        if (this.state === 'intro') {
          if (side === 'foe' && this._introFoeArt) { ox = foePos.x + 24 + 15; oy = foePos.y + 20; }
          if (side === 'ally' && this._introAllyArt) { ox = allyPos.x + 24 - 15; oy = allyPos.y + 20; }
        }
        this.drawBall(r, efx.ballId, ox + (tx - ox) * k, oy + (ty - oy) * k - Math.sin(k * Math.PI) * 26, 13, false);
      } else if (efx.t < 360) {
        const rr = (efx.t - 250) * 0.35, col = side === 'foe' ? '#ffffff' : '#ffe9a8';
        g.ctx2dfill(col, tx - rr, ty - 1, rr * 2, 2); g.ctx2dfill(col, tx - 1, ty - rr * 0.6, 2, rr * 1.2);
      }
    }
    // W1 FX-1: effect-sequence elements (impact ring, wall panel,
    // substitute doll) + the pooled particles themselves.
    if (this.fxSeq) {
      const seq = this.fxSeq, defA = this.fxAnchor(seq.defSide);
      if (seq.t >= seq.dur * 0.55) {
        const rr = Math.min(26, (seq.t - seq.dur * 0.55) * 0.22), col = seq.def.colors[0];
        g.ctx2dfill(col, defA.x - rr, defA.y - 1, rr * 2, 2); g.ctx2dfill(col, defA.x - 1, defA.y - rr * 0.7, 2, rr * 1.4);
      }
      if (seq.plan && seq.plan.primary === 'vis.wall-screen') {
        const c = r.ctx; c.save(); c.globalAlpha = 0.3; c.fillStyle = '#7ac8f8'; c.fillRect(defA.x - 30, defA.y - 30, 60, 62); c.restore();
      }
      if (seq.plan && seq.plan.primary === 'vis.substitute-doll') {
        g.ctx2dfill('#58a838', defA.x - 6, defA.y + 18, 12, 10); g.ctx2dfill('#f0e8d0', defA.x - 4, defA.y + 10, 8, 8);
      }
    }
    for (let i = 0; i < FX_POOL_MAX; i++) {
      const p = this.fxPool[i];
      if (p.on) g.ctx2dfill(p.col, p.x, p.y, p.sz, p.sz);
    }
    // W1 FX-4: persistent condition overlays on both battlers.
    this.drawConditionOverlay(r, this.foe, foePos.x + 24 + this.fxKbOffset('foe'), foePos.y + 48, (foeArt && foeArt.size) || BATTLER_DRAW_SIZE);
    this.drawConditionOverlay(r, this.ally, allyPos.x + 24 + this.fxKbOffset('ally'), allyPos.y + 48, (allyArt && allyArt.size) || BATTLER_DRAW_SIZE);
    // Catch ball (W1 FX-5): the thrown ball is the actual ball-type
    // sprite; after the absorb it drops and settles (<=2 bounces)
    // BEFORE the shakes, wobbling on its ground contact point.
    if (this.state === 'catchseq' && this.catchState.phase === 'throw') {
      const k = Math.min(1, this.catchState.t / 430);
      const bx = w * 0.2 + (w * 0.5) * k;
      const by = h * 0.6 - Math.sin(k * Math.PI) * h * 0.35;
      this.drawBall(r, this.catchState.ballId, bx, by, 13, false);
    }
    if (this.state === 'catchseq' && (this.catchState.phase === 'settle' || this.catchState.phase === 'shakes')) {
      const cs = this.catchState, gx = w * 0.7, gy = foePos.y + 46;
      let bx = gx, by = gy;
      if (cs.phase === 'settle') { const k = Math.min(1, cs.t / 260); by = gy - (1 - k) * 14 - Math.abs(Math.sin(k * Math.PI * 2)) * 9 * (1 - k); }
      else bx = gx + Math.sin(cs.t * 0.05) * 3;
      this.drawBall(r, cs.ballId, bx, by, 13, false);
    }
    // W1 FX-5: break-out — the ball bursts open in its own colours.
    if (this.breakFx) {
      const bf = this.breakFx, pal = BALL_PALETTES[bf.ballId] || BALL_PALETTES.pokeball;
      const gx = w * 0.7, gy = foePos.y + 46;
      this.drawBall(r, bf.ballId, gx, gy, 13, true);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, rr = 6 + bf.t * 0.09;
        g.ctx2dfill(pal[i % 2], gx + Math.cos(a) * rr, gy + Math.sin(a) * rr, 3, 3);
      }
    }
    // P1/E10: success starburst — 8 gold rays radiating from the ball, fading.
    if (this.catchFx) {
      const k = this.catchFx.t / 500;
      const c = r.ctx;
      c.save();
      c.strokeStyle = 'rgba(232,200,50,' + (1 - k).toFixed(3) + ')';
      c.lineWidth = 2;
      const bx = w * 0.7, by = h * 0.3, r0 = 8 + k * 26;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        c.beginPath();
        c.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0);
        c.lineTo(bx + Math.cos(a) * (r0 + 8), by + Math.sin(a) * (r0 + 8));
        c.stroke();
      }
      c.restore();
    }
    // Premium+ W2 (TR-3): the ceremony tier — boss battles (gym
    // leaders, Elite Four, Champion, rival) open on a VS beat: dark
    // letterbox bands, a gold divider, and both figures facing off
    // large, held ~1.15s across the intro (the ≥800ms beat), a
    // treatment route trainers never get. Text half is drawn after
    // end() alongside the plates. Motion gate off => no beat.
    const vsActive = this.entryVariant === 'boss' && this.state === 'intro'
      && this.fxAnimsOn() && this.t < 1150 && !!this._introFoeArt;
    this._vsActive = vsActive;
    if (vsActive) {
      const c = r.ctx;
      const bandH = Math.round(h * 0.17);
      c.fillStyle = '#12101c'; c.fillRect(0, 0, w, bandH); c.fillRect(0, h - bandH, w, bandH);
      c.fillStyle = '#f0c81e'; c.fillRect(0, bandH, w, 2); c.fillRect(0, h - bandH - 2, w, 2);
      const fig = (cv, cx) => {
        if (!cv || !cv.width) return;
        const hh = 92, ww = Math.round(cv.width * (hh / cv.height));
        r.blitS(cv, cx - ww / 2, h * 0.52 - hh, ww, hh);
      };
      fig(this._introAllyArt, w * 0.30);
      fig(this._introFoeArt, w * 0.70);
      c.fillStyle = '#f0c81e'; c.fillRect(Math.round(w / 2) - 1, bandH + 8, 2, h - bandH * 2 - 16);
    }
    // W1 FX-6: entry wipe + exit mirror over the arena (under plates).
    this.drawEntryWipe(r, w, h);
    this.drawExitWipe(r, w, h);
    r.end();
    if (vsActive && this.trainer) {
      r.text('VS', w / 2, h * 0.40, { size: 22, bold: true, color: '#f0c81e', shadow: false, align: 'center' });
      r.text(String(this.trainer.name || '').toUpperCase(), w * 0.70, h * 0.56, { size: 14, bold: true, color: '#ffffff', shadow: false, align: 'center' });
      r.text(String(this.trainer.title || ''), w * 0.70, h * 0.56 + 17, { size: 14, color: '#cfc4ea', shadow: false, align: 'center' });
    }
    r.camX = pcx; r.camY = pcy;
    // HP plates (Platinum databoxes, original art) — P1/A5: all plate text >= 14px.
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 146, h - 124, this.ally, this.hpAnim.ally, true);
    // Message box (Platinum frame via r.panel/ptFrame)
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 52, w - 8, 48, PT_PAPER, PT_FRAME);
      // UI v2.3 (defect 1): measured word-wrap with the render font itself
      // (r.wrapText) — the old fixed 30-char slices cut words in half
      // ('y/our first catch') whenever a word straddled the boundary.
      const lines = r.wrapText(this.msg, 14, w - 20, { maxLines: 2 });
      if (lines[0]) r.text(lines[0], 10, h - 46, { size: 14, color: '#202028', shadow: false });
      if (lines[1]) r.text(lines[1], 10, h - 28, { size: 14, color: '#202028', shadow: false });
      // UI v2: red advance cue at the box's bottom-right while waiting for input.
      if (this.msgOpen) r.text('▼', w - 20, h - 24, { size: 14, bold: true, color: '#e03c31', shadow: false });
    }
    this.t += 16;
  }

  // UI v2 (Platinum standard): a true Platinum databox on r.ptPlate.
  // Canvas ops used here are fillRect / fillText / strokeRect ONLY (via
  // r.ptPlate, r.hpBar, r.xpBar, r.text and one direct fillRect for the
  // status chip / XP flash) — the QA recording-ctx plate test implements
  // just those. Every instance field is guarded: the QA minimal-this call
  // (only game.state.settings present) must yield zero slide/pulse offsets.
  plate(r, x, y, mon, hpShown, isAlly) {
    const settings = (this.game && this.game.state && this.game.state.settings) || {};
    const w = 140, h = isAlly ? 70 : 48;
    // Platinum plate entrance: foe slides in from the left, ally from the
    // right, ease-out over the battle's opening 450ms of theater time
    // (this.t, reset in enter()). A missing/non-finite timer (the QA
    // minimal-this call) means "entrance finished" — offset 0. Reduced
    // motion skips the slide entirely.
    let slide = 0;
    if (typeof this.t === 'number' && isFinite(this.t) && !settings.reducedMotion) {
      const p = Math.max(0, Math.min(1, this.t / 450));
      const e = 1 - (1 - p) * (1 - p);
      slide = (1 - e) * (w + 16);
    }
    let px = isAlly ? x + slide : x - slide;
    // P1/E7: low-HP pulse — the ally plate nudges twice on first red crossing
    // (never under reduced motion; the pulse timer is only set when motion is on).
    if (isAlly && this._lowHpPulseT > 0) px += Math.sin(this._lowHpPulseT * 0.05) * 2;
    r.ptPlate(px, y, w, h, isAlly);
    const ink = '#20242e';
    const name = displayName(mon, SPECIES).slice(0, 10);
    r.text(name, px + 6, y + 5, { size: 14, bold: true, color: ink, shadow: false });
    // Gender: mons/species carry no gender data anywhere in the game, so
    // the databox is gender-neutral — no symbol is drawn (UI v2 ruling).
    // 'Lv' + level, right-aligned inside the frame (a 10-char name at
    // px + 6 still clears the 'Lv100' block ending at px + w - 6).
    // Wave G M1.1: level DIGITS render in the display stack (Galmuri lining
    // figures) — PtPixel's figures are decorative and uneven at plate size
    // (owner catch on the M1 proof zoom). The 'Lv' letters keep the plate
    // face, set immediately left of the digits; the block still ends at
    // px + w - 6. Numbers stay plain weight per the owner's battle rule.
    const lvNum = String(mon.level);
    const lvEnd = px + w - 6;
    r.text(lvNum, lvEnd, y + 5, { size: 14, color: ink, shadow: false, align: 'right', display: true });
    r.text('Lv', lvEnd - r.measure(lvNum, { size: 14, display: true }) - 1, y + 5, { size: 14, color: ink, shadow: false, align: 'right' });
    // HP row: gold 'HP' tag + the Platinum hpBar; the status chip slot is
    // reserved at the row's right end (the bar shortens when a chip shows).
    const fracRaw = hpShown / mon.maxHp;
    const frac = isFinite(fracRaw) ? Math.max(0, Math.min(1, fracRaw)) : 0;
    const chip = mon.status
      ? (STATUS_CHIPS[mon.status] || [String(mon.status).toUpperCase().slice(0, 3), '#5a6478'])
      : null;
    r.text('HP', px + 6, y + 23, { size: 14, bold: true, color: '#a87818', shadow: false });
    r.hpBar(px + 26, y + 27, chip ? w - 66 : w - 32, 7, frac);
    if (chip) {
      const c = r.ctx;
      c.fillStyle = chip[1];
      c.fillRect(px + w - 36, y + 22, 30, 16);
      r.text(chip[0], px + w - 33, y + 23, { size: 14, bold: true, color: '#ffffff', shadow: false });
    } else if (!isAlly && frac < 0.25 && mon.hp > 0) {
      // P0/E6: foe low-HP text cue in the empty chip slot (never color
      // alone; the hpBar's white stripe overlay is the always-on cue).
      // The ally plate carries its own '!' on the HP-numbers row below.
      r.text('!', px + w - 26, y + 23, { size: 14, bold: true, color: '#c02818', shadow: false });
    }
    if (isAlly) {
      // HP numbers row: low-HP '!' cue at the left, cur/max right-aligned.
      if (frac < 0.25 && mon.hp > 0) {
        r.text('!', px + 6, y + 40, { size: 14, bold: true, color: '#c02818', shadow: false });
      }
      // M1.1: HP fraction figures in the display stack too (see 'Lv' note).
      r.text(Math.ceil(hpShown) + '/' + mon.maxHp, px + w - 6, y + 40, { size: 14, color: ink, shadow: false, align: 'right', display: true });
      // EXP row: blue 'EXP' tag + the Platinum-blue xpBar (P0/E3: 600ms
      // ease-out via xpShownFrac; instant under reduced motion).
      r.text('EXP', px + 6, y + 54, { size: 14, bold: true, color: '#2f68b8', shadow: false });
      // xpShownFrac lives on the battle instance; the QA minimal-this plate
      // test calls plate() without it — fall back to the static fraction.
      const xfRaw = (typeof this.xpShownFrac === 'function') ? this.xpShownFrac(mon) : xpFracOf(mon, 0);
      const xf = isFinite(xfRaw) ? xfRaw : 0;
      r.xpBar(px + 34, y + 58, w - 40, 5, xf);
      if (this.xpFlashT > 0) {
        const c = r.ctx;
        c.fillStyle = 'rgba(255,255,255,' + (this.xpFlashT / 250 * 0.8).toFixed(3) + ')';
        c.fillRect(px + 34, y + 58, w - 40, 5);
      }
    }
  }
}
