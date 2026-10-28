// grounds.mjs — Rejuvenation Phase 2 (ADR-025 §1): Grounds (field effects).
// Every battlefield has a Ground, derived at battle start from the map the
// battle starts in (indoors overrides outdoors by construction). A Ground
// is exactly three rules: one type at x1.2 damage, one type at x0.8, and
// one twist. Hard caps (owner law): never stronger than x1.2 / x0.8, never
// creates or removes an immunity, NO chip damage anywhere. Modifiers are
// symmetric — the same factors apply to player and foe; there is no side
// flag in this data shape, so none can be added silently.
//
// R2 (owner ruling, §9): on Story difficulty resolveField() halves the
// type modifiers (x1.1 / x0.9) and disables twists entirely — the field
// object handed to the engines already reflects that, so no engine ever
// re-checks difficulty.
//
// Aliases (Volt/Marsh/Pyre/Spirit) share the RULES object of their parent
// Ground by reference and keep only their own display name / banner /
// tint, exactly as the spec's gym table decides.

function rules(boostType, dampenType, twist) {
  return { boostType, dampenType, twist };
}
const OPEN_RULES = rules(null, null, null);
const BLOOM_RULES = rules('grass', 'fire', 'heal');
const STORM_RULES = rules('electric', 'ground', 'storm');
const MIRE_RULES = rules('ground', 'electric', 'mire');
const GRAVE_RULES = rules('ghost', 'psychic', 'status');
const EMBER_RULES = rules('fire', 'water', 'burn');
const FROST_RULES = rules('ice', 'fire', 'frost');
const TIDE_RULES = rules('water', 'electric', 'tide');
const RUBBLE_RULES = rules('rock', 'grass', 'rubble');
const MIND_RULES = rules('psychic', 'ghost', 'status');
const VENOM_RULES = rules('poison', 'psychic', 'poison');

function ground(id, name, r, banner, tint) {
  return {
    id, name, rules: r,
    boostType: r.boostType, dampenType: r.dampenType, twist: r.twist,
    banner, tint,
  };
}

export const GROUNDS = {
  open: ground('open', 'Open Ground', OPEN_RULES, null, null),
  bloom: ground('bloom', 'Bloom Ground', BLOOM_RULES,
    'The arena is a Bloom Ground — Grass moves hit harder here, and healing blooms fuller.', '#58c94f'),
  storm: ground('storm', 'Storm Ground', STORM_RULES,
    'The arena is a Storm Ground — Electric moves hit harder here, and strike swift and true.', '#e8c832'),
  mire: ground('mire', 'Mire Ground', MIRE_RULES,
    'The arena is a Mire Ground — Ground moves hit harder here, and the mud drags at the unadapted.', '#8a6a42'),
  grave: ground('grave', 'Grave Ground', GRAVE_RULES,
    'The arena is a Grave Ground — Ghost moves hit harder here, and status rites falter.', '#7a5aa0'),
  ember: ground('ember', 'Ember Ground', EMBER_RULES,
    'The arena is an Ember Ground — Fire moves hit harder here, and burns catch more easily.', '#e06828'),
  frost: ground('frost', 'Frost Ground', FROST_RULES,
    'The arena is a Frost Ground — Ice moves hit harder here, and footing turns treacherous.', '#7ac2e8'),
  tide: ground('tide', 'Tide Ground', TIDE_RULES,
    'The arena is a Tide Ground — Water moves hit harder here, and special moves ride the current.', '#3a7ad0'),
  rubble: ground('rubble', 'Rubble Ground', RUBBLE_RULES,
    'The arena is a Rubble Ground — Rock moves hit harder here, and physical moves land true.', '#a8895a'),
  mind: ground('mind', 'Mind Ground', MIND_RULES,
    'The arena is a Mind Ground — Psychic moves hit harder here, and status rites falter.', '#c85a9a'),
  venom: ground('venom', 'Venom Ground', VENOM_RULES,
    'The arena is a Venom Ground — Poison moves hit harder here, and venom seeps in more easily.', '#9848a8'),
  volt: ground('volt', 'Volt Ground', STORM_RULES,
    'The arena is a Volt Ground — Electric moves hit harder here, and strike swift and true.', '#e8c832'),
  marsh: ground('marsh', 'Marsh Ground', BLOOM_RULES,
    'The arena is a Marsh Ground — Grass moves hit harder here, and healing blooms fuller.', '#58c94f'),
  pyre: ground('pyre', 'Pyre Ground', EMBER_RULES,
    'The arena is a Pyre Ground — Fire moves hit harder here, and burns catch more easily.', '#e06828'),
  spirit: ground('spirit', 'Spirit Ground', MIRE_RULES,
    'The arena is a Spirit Ground — Ground moves hit harder here, and the earth drags at the unadapted.', '#8a6a42'),
};

// map id -> groundId. Every Kanto map in the merged MAPS table is assigned
// explicitly (70 unique ids across maps.mjs/maps2/maps3/maps4 — interiors
// that are shared, 'center'/'mart', resolve Open). Unmapped ids fall back
// to Open in groundForMap(), so a future map can never crash a battle.
export const MAP_GROUND = {
  pallet: 'open',
  route1: 'open',
  viridian: 'open',
  center: 'open',
  mart: 'open', // World Art Wave 5b: the shared Mart interior
  route2: 'bloom', // Route 2 carries the Viridian Forest corridor in this build
  pewter: 'open',
  gym: 'rubble', // Pewter Gym — Brock
  route3: 'bloom',
  moon1: 'rubble',
  moon2: 'rubble',
  route4: 'bloom',
  cerulean: 'open',
  'gym-cerulean': 'tide', // Cerulean Gym — Misty
  route5: 'bloom',
  route6: 'bloom',
  vermilion: 'open',
  'gym-vermilion': 'volt', // Vermilion Gym — Lt. Surge
  stanne: 'tide',
  route11: 'bloom',
  route7: 'bloom',
  celadon: 'open',
  'gym-celadon': 'marsh', // Celadon Gym — Erika
  gamecorner: 'open',
  hideout: 'open',
  route8: 'bloom',
  saffron: 'open',
  'gym-saffron': 'mind', // Saffron Gym — Sabrina
  dojo: 'open',
  silph1: 'open',
  silph2: 'open',
  route9: 'rubble',
  route10: 'rubble',
  powerplant: 'storm',
  rocktunnel: 'rubble',
  lavender: 'open',
  tower1: 'grave',
  tower2: 'grave',
  route12: 'tide',
  route15: 'bloom',
  fuchsia: 'open',
  'gym-fuchsia': 'venom', // Fuchsia Gym — Koga
  safari: 'mire',
  route16: 'bloom',
  route19: 'tide',
  route20: 'tide',
  seafoam: 'frost',
  cinnabar: 'ember',
  'gym-cinnabar': 'pyre', // Cinnabar Gym — Blaine
  mansion: 'ember',
  'gym-viridian': 'spirit', // Viridian Gym — Giovanni
  route22: 'open',
  victoryroad: 'rubble',
  indigo: 'open',
  league: 'open',
  ceruleancave: 'rubble',
  newisland: 'tide',
  // World Art Wave 5b: house interiors (shared template family).
  'house-pallet-ash': 'open',
  'house-pallet-gary': 'open',
  'house-viridian': 'open',
  'house-pewter-w': 'open',
  'house-pewter-e': 'open',
  'house-cerulean': 'open',
  'house-vermilion': 'open',
  'house-celadon-w': 'open',
  'house-celadon-e': 'open',
  'house-lavender': 'open',
  'house-fuchsia': 'open',
  'house-cinnabar': 'open',
  'house-indigo': 'open',
};

export function groundForMap(mapId) {
  const id = mapId ? MAP_GROUND[mapId] : null;
  return GROUNDS[id] || GROUNDS.open;
}

// The field object both engines share (battle.field). Resolved ONCE at
// battle start. Carries EFFECTIVE factors: Story halving and twist-off are
// folded in here (R2), so engines read factors/twist and nothing else.
export function resolveField(mapId, difficulty) {
  return fieldFromGround(groundForMap(mapId), difficulty, mapId || null);
}

// Explicit pin (scripted events may name a Ground directly, §1 guardrails).
export function resolveFieldForGround(groundId, difficulty) {
  return fieldFromGround(GROUNDS[groundId] || GROUNDS.open, difficulty, null);
}

function fieldFromGround(g, difficulty, mapId) {
  const story = difficulty === 'story';
  return {
    id: g.id,
    groundId: g.id,
    name: g.name,
    mapId,
    boostType: g.boostType,
    dampenType: g.dampenType,
    boostFactor: g.boostType ? (story ? 1.1 : 1.2) : 1,
    dampenFactor: g.dampenType ? (story ? 0.9 : 0.8) : 1,
    twist: story ? null : g.twist,
    banner: g.banner,
    tint: g.tint,
  };
}

// Damage factor for a move type under a field (1 when the field is null,
// Open, or the type is neither boosted nor dampened). calcDamage() in
// formulas.mjs is the single consumer that applies this in the damage path.
export function groundFactorFor(field, moveType) {
  if (!field || !moveType) return 1;
  if (field.boostType && moveType === field.boostType) return field.boostFactor !== undefined ? field.boostFactor : 1.2;
  if (field.dampenType && moveType === field.dampenType) return field.dampenFactor !== undefined ? field.dampenFactor : 0.8;
  return 1;
}

// Healing moves (Bloom/Marsh twist): +50% restored, both engines.
export function groundHealMult(field) {
  return field && field.twist === 'heal' ? 1.5 : 1;
}

// Burn / poison infliction chance bonus in percentage POINTS, added only
// where a move can already inflict that status (Ember/Pyre: burn;
// Venom: poison). Never creates an infliction a move does not have.
export function groundStatusChanceBonus(field, status) {
  if (!field) return 0;
  if (field.twist === 'burn' && status === 'burn') return 10;
  if (field.twist === 'poison' && status === 'poison') return 10;
  return 0;
}

// Classic accuracy adjustment (probability in, probability out):
// Storm/Volt: Electric moves +5 points. Rubble: physical moves +5 points.
// Grave/Mind: status moves -10 points. Frost: every move x0.95 (the
// defender's dodge — evasion +1 stage-equivalent, dodge only, no damage).
export function groundClassicAccuracy(field, mv, p) {
  if (!field || !field.twist || !mv) return p;
  let out = p;
  if (field.twist === 'storm' && mv.type === 'electric') out += 0.05;
  else if (field.twist === 'rubble' && mv.cat === 'physical') out += 0.05;
  else if (field.twist === 'status' && mv.cat === 'status') out -= 0.10;
  if (field.twist === 'frost') out *= 0.95;
  return out;
}

// Tide classic crit bonus: for special moves, add base Speed/256 to the
// crit chance (threshold +1 stage-equivalent). Consumed via
// critChance(..., { bonus }) in formulas.mjs.
export function groundCritBonus(field, mv, baseSpeed) {
  if (!field || field.twist !== 'tide' || !mv || mv.cat !== 'special') return 0;
  return (baseSpeed || 0) / 256;
}

// Mire: mons NOT Water/Grass/Ground-typed are slowed. Classic: Speed stat
// -10% (applied at turn-order stat resolution). RT: movement -15%
// (applied at the arena movement step for the moving mon).
export const MIRE_ADAPTED_TYPES = ['water', 'grass', 'ground'];
export function mireSlows(field, types) {
  if (!field || field.twist !== 'mire' || !Array.isArray(types)) return false;
  return !types.some((t) => MIRE_ADAPTED_TYPES.includes(t));
}
export function groundMireSpeedMult(field, types) {
  return mireSlows(field, types) ? 0.9 : 1;
}
export function groundMireMoveMult(field, types) {
  return mireSlows(field, types) ? 0.85 : 1;
}

// RT cooldown multiplier for a move under the field twist:
// Storm/Volt: Electric moves x0.85. Grave/Mind: status moves x1.25.
export function groundCooldownMult(field, mv) {
  if (!field || !field.twist || !mv) return 1;
  if (field.twist === 'storm' && mv.type === 'electric') return 0.85;
  if (field.twist === 'status' && mv.cat === 'status') return 1.25;
  return 1;
}

// RT special-move projectile speed multiplier (Tide: +15%).
export function groundProjectileMult(field, mv) {
  if (!field || field.twist !== 'tide' || !mv || mv.cat !== 'special') return 1;
  return 1.15;
}

// RT physical-move lunge speed multiplier (Rubble: +15%). The lunge dash
// step in battle-rt scales by this; duration is unchanged.
export function groundLungeMult(field, mv) {
  if (!field || field.twist !== 'rubble' || !mv || mv.cat !== 'physical') return 1;
  return 1.15;
}

// Frost RT: dodge i-frames +40ms.
export function groundDodgeIframesBonus(field) {
  return field && field.twist === 'frost' ? 40 : 0;
}
