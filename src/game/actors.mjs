import { QUESTS } from '../data/quests.mjs';
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
// - wally@victory-road-maris: Wally's Crown Road post stands EMPTY until
//   his Meadowbrook departure (the `wally` handler's catch scene is
//   his farewell; its completion shows him here). Before this wave
//   both Wallys stood in both places at once, forever.
export const ACTOR_DEFAULTS = {
  'wally@victory-road-maris': { hidden: true },
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

// ---- Wave ACT: actor lifecycle mixin ----
// B2-R1 frozen-monolith law: overworld-systems.mjs may never grow past
// its 5254-line cap, so the actor primitives + tale watcher + parley
// entry hook live here and are applied to OverworldScene.prototype
// from overworld.mjs. Behavior identical to the overworld-systems
// home they were written in.
export const actorLifecycleMixin = {
  // ---- Wave ACT: actor lifecycle primitives (moved here from overworld-systems.mjs) ----
  // The event vocabulary for moving CHARACTERS (identity +
  // persistence: game/actors.mjs). Every step commits its directive
  // to story.actors FIRST — a save taken mid-walk reloads into the
  // committed end state — then animates in-scene when the actor is
  // fielded here; an actor who lives on another map is committed
  // only, and the loadMap resolver fields the result on next load.
  //   { actorEnter: { who, x, y, face?, path? } }  spawn, then optional walk
  //   { actorMove:  { who, to: [x, y] | { map, x, y }, path? } }
  //   { actorExit:  { who, to?, path? } }          walk off, then hidden
  //   { actorShow:  { who, x?, y? } }              instant, persisted
  //   { actorHide:  { who } }                      instant, persisted
  actorByCid(cid) {
    if (!this.map || !Array.isArray(this.map.npcs)) return null;
    return this.map.npcs.find((n) => n._cid === cid) || null;
  },

  stageActorAt(npc, x, y, face) {
    npc._stage = { x, y, fx: x, fy: y, glide: 0 };
    delete npc._wander;
    if (face) npc._face = face;
  },

  // Field an actor who is not in this scene's roster from the
  // template their saved directive carries (a cross-map arrival
  // walking in). Returns the live npc, or null when no template
  // exists (the committed directive still applies on next load).
  fieldActorFromTemplate(cid, x, y, face) {
    const st = this.game.state;
    const ov = st && st.story && st.story.actors ? st.story.actors[cid] : null;
    if (!ov || !ov.template || !this.map) return null;
    const c = { ...ov.template };
    delete c.map;
    c.x = x; c.y = y;
    c._pk = this.mapId + ':actor:' + cid;
    c._cid = cid;
    c._cloneIx = 0;
    c._phaseMs = 0;
    c._face = face || c.dir || 'down';
    this.stageActorAt(c, x, y, face);
    this.map = { ...this.map, npcs: [...this.map.npcs, c] };
    return c;
  },

  runActorStep(s, next) {
    const g = this.game;
    const st = g.state;
    const kind = s.actorEnter ? 'enter' : s.actorMove ? 'move' : s.actorExit ? 'exit' : s.actorShow ? 'show' : 'hide';
    const spec = s.actorEnter || s.actorMove || s.actorExit || s.actorShow || s.actorHide;
    const who = spec && spec.who;
    if (!who) { next(); return; }
    let npc = this.actorByCid(who);
    const walkThen = (pts, after) => {
      if (npc && pts && pts.length) this.queueActorWalk(npc, pts, after);
      else if (after) after();
    };
    if (kind === 'enter') {
      const x = Number.isInteger(spec.x) ? spec.x : (npc ? npc.x : 0);
      const y = Number.isInteger(spec.y) ? spec.y : (npc ? npc.y : 0);
      const pts = Array.isArray(spec.path) && spec.path.length ? spec.path : null;
      const end = pts ? pts[pts.length - 1] : [x, y];
      setActorOverride(st, who, { map: this.mapId, x: end[0], y: end[1], hidden: false, ...(spec.face ? { face: spec.face } : {}) });
      if (!npc) npc = this.fieldActorFromTemplate(who, x, y, spec.face);
      if (!npc) { next(); return; }
      npc._actorHidden = false;
      this.stageActorAt(npc, x, y, spec.face);
      walkThen(pts, next);
      return;
    }
    if (kind === 'move') {
      const to = spec.to;
      const cross = to && !Array.isArray(to) && typeof to.map === 'string' && to.map !== this.mapId;
      if (cross) {
        // Relocate: commit the destination (with the template that
        // fields them there), then walk the exit path here and hide.
        setActorOverride(st, who, { map: to.map, x: to.x, y: to.y, hidden: false, ...(npc ? { template: actorTemplateOf(npc) } : {}), ...(spec.face ? { face: spec.face } : {}) });
        if (!npc) { next(); return; }
        const pts = Array.isArray(spec.path) && spec.path.length ? spec.path : null;
        walkThen(pts, () => { npc._actorHidden = true; next(); });
        return;
      }
      const dest = Array.isArray(to) ? to : (to && Number.isInteger(to.x) ? [to.x, to.y] : null);
      if (!dest) { next(); return; }
      setActorOverride(st, who, { map: this.mapId, x: dest[0], y: dest[1], hidden: false, ...(spec.face ? { face: spec.face } : {}) });
      if (!npc) { next(); return; }
      npc._actorHidden = false;
      const pts = Array.isArray(spec.path) && spec.path.length ? spec.path : [dest];
      walkThen(pts, next);
      return;
    }
    if (kind === 'exit') {
      setActorOverride(st, who, { hidden: true, ...(npc ? { map: this.mapId } : {}) });
      if (!npc) { next(); return; }
      const pts = Array.isArray(spec.path) && spec.path.length ? spec.path
        : (Array.isArray(spec.to) ? [spec.to] : null);
      walkThen(pts, () => { npc._actorHidden = true; next(); });
      return;
    }
    if (kind === 'show') {
      const hasPost = Number.isInteger(spec.x) && Number.isInteger(spec.y);
      setActorOverride(st, who, { hidden: false, ...(hasPost ? { map: this.mapId, x: spec.x, y: spec.y } : {}) });
      if (npc) {
        npc._actorHidden = false;
        if (hasPost) this.stageActorAt(npc, spec.x, spec.y, spec.face);
      }
      next(); return;
    }
    // hide
    setActorOverride(st, who, { hidden: true });
    if (npc) npc._actorHidden = true;
    next();
  },

  // Wave ACT: tale-completion lifecycle directives. A tale def may
  // carry onComplete steps (the actor vocabulary above). Completions
  // arrive through MANY paths — finishWith, advanceTale's internal
  // completion, one direct completeTale call — so instead of hooking
  // each, update() polls the quest table: the first tick a tale
  // reads 'complete' with its marker unset runs the steps and sets
  // the marker (story flag talefx_<taleId>), so each tale's
  // directives fire exactly once. Saves that completed the tale
  // before this layer existed fire on first load — the world catches
  // up to the story.
  checkTaleCompletions() {
    const st = this.game && this.game.state;
    if (!st || !st.story || !st.story.quests) return;
    const flags = st.story.flags || (st.story.flags = {});
    for (const id of Object.keys(QUESTS)) {
      const t = QUESTS[id];
      if (!t || !Array.isArray(t.onComplete) || !t.onComplete.length) continue;
      if (st.story.quests[id] !== 'complete') continue;
      const mark = 'talefx_' + id;
      if (flags[mark]) continue;
      flags[mark] = true;
      this.runSteps(t.onComplete, 0, null);
      return;
    }
  },
  // Wave ACT (cinematic entry): the Canopy parley pair ARRIVE.
  // While the post-St. Anne window is open and their entry event has
  // not played, the loadMap resolver stages RUE and COLE hidden — this
  // hook plays their walk-in from the Game Corner doors
  // (ev_parley_enter) instead of leaving them pre-placed. The event's
  // own done flag is the once-gate; a stalled chain re-fires on a later
  // entry, the entry-scene idiom.
  maybePlayParleyEnter(g, id, arcCardFired) {
    if (!arcCardFired && !g.ui.dialogueOpen && id === 'celadon'
      && g.state.story.flags.stanne_done && !g.state.story.flags.parley_celadon_done
      && !g.state.story.flags.ev_parley_enter_done) {
      this.runEvent('ev_parley_enter');
    }
  },
};
