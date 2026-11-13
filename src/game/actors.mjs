// actors.mjs — Wave ACT (Actor Lifecycle): stable character identity
// + the saved placement/visibility override store.
//
// The owner's design law (2026-11-12): every character has a
// particular post; cinematic characters ARRIVE via events; quest
// characters wait at their post; when the quest ends or the player
// performs the triggering action, the character MOVES. The engine
// already authored every post (map placements + the append tables),
// so identity is DERIVED from those posts, never re-authored:
//
//   charId = slug(name) + '@' + mapId        e.g. 'mom@pallet'
//   duplicates on one map take '#2', '#3'... e.g. 'paul@eterna'
//   (occurrence order = loadMap assembly order, so ids are stable
//   across loads and saves for the same authored world.)
//
// The lifecycle state lives in story.actors (save schema v2,
// additive — see save/schema.mjs): charId -> directive
//   { map, x, y, face?, hidden?, template? }
// A directive REPLACES the authored post: `map/x/y` say where the
// character currently stands (another map = relocated; the resolver
// fields them there from `template` when their home post is
// elsewhere), `hidden: true` says they are not fielded at all.
// Directives committed by the event primitives (overworld-systems
// actorEnter/actorMove/actorExit/actorShow/actorHide) persist across
// save/load; the loadMap resolver applies them on every load.
//
// ACTOR_DEFAULTS below is the authored RESTING state for posts whose
// story begins away from their post (arrivals). A saved override
// always wins over a default; a default never moves anyone, it only
// holds a post empty (or filled) until the story acts.

export function actorSlug(name) {
  const s = String(name == null ? 'npc' : name).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'npc';
}

export function actorCharId(name, mapId) {
  return actorSlug(name) + '@' + String(mapId);
}

// Resting defaults (Wave ACT proofs):
// - wally@victory-road: Wally's Crown Road post stands EMPTY until
//   his Meadowbrook departure (the `wally` handler's catch scene is
//   his farewell; its completion shows him here). Before this wave
//   both Wallys stood in both places at once, forever.
export const ACTOR_DEFAULTS = {
  'wally@victory-road': { hidden: true },
};

// The character's effective directive: the saved override when one
// exists, else the authored default, else null (stand at the
// authored post, visible). Pure over the save — safe on any state
// shape, including a state with no story.actors yet.
export function actorDirective(state, charId) {
  const saved = state && state.story && state.story.actors
    ? state.story.actors[charId] : undefined;
  if (saved && typeof saved === 'object') return saved;
  return ACTOR_DEFAULTS[charId] || null;
}

// Commit (merge) a directive patch into the saved store. Creates
// story.actors on first use. Returns the stored entry.
export function setActorOverride(state, charId, patch) {
  if (!state || !state.story || !charId || !patch) return null;
  const store = state.story.actors || (state.story.actors = {});
  const cur = store[charId] && typeof store[charId] === 'object' ? store[charId] : {};
  const next = { ...cur, ...patch };
  store[charId] = next;
  return next;
}

// The presentation + handler template a cross-map relocation carries
// so the resolver can field the character on a map that never
// authored them. Presentation fields verbatim; handler props limited
// to the dispatch vocabulary the scene understands.
export function actorTemplateOf(npc) {
  if (!npc || typeof npc !== 'object') return null;
  const t = {};
  for (const k of ['name', 'art', 'skin', 'shirt', 'pants', 'hair', 'dir']) {
    if (typeof npc[k] === 'string') t[k] = npc[k];
  }
  if (Array.isArray(npc.dialogue)) t.dialogue = npc.dialogue.filter((l) => typeof l === 'string').slice(0, 12);
  for (const k of ['tale', 'role', 'johto', 'hoenn', 'sinnoh']) {
    if (typeof npc[k] === 'string') t[k] = npc[k];
  }
  for (const k of ['witness', 'parley', 'mart']) {
    if (npc[k]) t[k] = true;
  }
  if (npc.sight && typeof npc.sight === 'object') t.sight = { ...npc.sight };
  return t;
}
