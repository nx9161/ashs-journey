// quests.mjs — Rejuvenation Phase 4 (ADR-025 §5): Town Tales.
//
// QUESTS is the tales table the spec names: { id: { town, giver, title,
// stages: [...], reward, bondNpc } }, reusing the LEGENDARY_ARCS stage
// pattern (a quest is a stage machine, not a boolean). Tales live in the
// SAME state slot as the legendary arcs — story.quests[id] — with the
// widened value set (§7): 'active' (accepted, 0 stages done) -> stage
// numbers (N stages done) -> 'complete'. No second quest system exists.
//
// The helpers in this file are PURE over the game state (the
// grounds/keepsakes pattern): the scene wiring (dialogue, menus,
// battles) lives in game/overworld-systems.mjs (runTaleNpc /
// taleSpotInteract); the rewards, bond records and stage transitions
// resolve here so both the game and the headless suites drive the
// identical machine.
//
// Shape law (§5): <=3 stages, <=1 required battle (never a boss),
// always completable when offered, reward stated up front in the Quest
// Log once accepted, and every tale ends with a lore REVELATION
// (def.revelation — town past, character history, or a legendary hook).
//
// Bond sources (§5 -> Phase 5): completing a tale records its bond
// interaction into story.bonds — STRUCTURAL ONLY. No tiers, no dialogue
// variants, no consumers are built here; Phase 5 reads this shape.
// recordBond clamps to the §2 range (-10..+10) and every source is
// one-shot (completion is one-shot), so nothing here is grindable.

import { grantKeepsakeFromSource } from '../game/keepsakes.mjs';

export const QUESTS = {
  tale_pallet: {
    id: 'tale_pallet', town: 'Pallet Town', giver: 'MOM', title: "Mom's Care Package",
    stages: [
      "Deliver Mom's package to the Viridian shopkeeper",
      'Bring the receipt back to Mom in Pallet Town',
    ],
    reward: { items: { potion: 3 } }, rewardText: '3 Potions',
    bondNpc: 'mom', bondDelta: 2,
    revelation: 'Mom drew the first street maps of Pallet Town as a girl, chalk on a barn door. The Viridian shopkeeper still sells copies — half the trainers in Kanto navigate by her hand.',
  },
  tale_viridian: {
    id: 'tale_viridian', town: 'Viridian City', giver: 'ACE MARLOW', title: 'The Retired Ace',
    stages: [
      'Find the lost keepsake in the Viridian Forest (search the Route 2 grass)',
      'Choose: return the keepsake to Ace Marlow, or keep it',
    ],
    reward: { keepsake: 'tortoisecharm' }, rewardText: 'Tortoise Charm',
    bondNpc: 'retiredace', bondDelta: 0, // the return choice itself is the bond record (+2, applied by the wiring)
    revelation: 'Marlow was the first trainer ever to challenge the Viridian Gym — before there was a League to record it. His tortoise outlived three gyms, two badges designs, and every one of his rivals.',
  },
  tale_pewter: {
    id: 'tale_pewter', town: 'Pewter City', giver: 'CURATOR', title: "Brock's Day Off",
    stages: [
      'Cover the museum desk: answer 3 visitor questions from the exhibits',
      "Spar Brock's Geodude, off-duty, here in Pewter City",
    ],
    reward: { keepsake: 'ironacorn' }, rewardText: 'Iron Acorn',
    bondNpc: 'brock', bondDelta: 2,
    revelation: "The museum came first. Pewter's gym was built afterwards, out of the museum's own stone — the city's leaders have been part-time curators ever since. Brock still pays the fossil lab out of his gym winnings.",
  },
  tale_cerulean: {
    id: 'tale_cerulean', town: 'Cerulean City', giver: 'TESS', title: 'The Stolen Bike Bell',
    stages: [
      'Ask the 3 witnesses around Cerulean City about the bell',
      'Confront the culprit at the cape, in the north of Cerulean — talk, or battle',
    ],
    reward: { items: { tm11: 1 } }, rewardText: 'TM11 (BubbleBeam)',
    bondNpc: 'misty', bondDelta: 1,
    revelation: "The bell is older than the gym: it rang on the first bicycle ever ridden over Nugget Bridge, back when Cerulean's gym was a bike shop with a pool out back. Misty still keeps the shop's old ledger.",
  },
  tale_vermilion: {
    id: 'tale_vermilion', town: 'Vermilion City', giver: 'CHAIRMAN', title: 'Fan Club Founder',
    stages: [
      "Recover the founder's notes at the S.S. Anne dock in Vermilion (after the Anne departs, ask the Harbormaster)",
      'Return the notes to the Fan Club Chairman',
    ],
    reward: { keepsake: 'tidepearl' }, rewardText: 'Tide Pearl',
    bondNpc: 'surge', bondDelta: 1,
    revelation: "The founder charted Vermilion's tides before there was a harbor — the Fan Club began as three sailors arguing over his tide tables. Even Lt. Surge learned to read the bay from those notes.",
  },
  tale_lavender: {
    id: 'tale_lavender', town: 'Lavender Town', giver: 'VOLUNTEER', title: 'Names on the Wall',
    stages: [
      'Record the unnamed graves in Pokemon Tower (the west gravestones)',
      'Meet Elder Bram in Lavender Town, who remembers the Marowak',
    ],
    reward: { keepsake: 'spectrebell' }, rewardText: 'Spectre Bell',
    bondNpc: 'fuji', bondDelta: 2,
    revelation: "Elder Bram remembers a mother Marowak who guarded the tower stairs so her child could escape — the channelers say a mother's love does not leave a place just because her body did. (A rumor, offered gently: nothing here is needed for the climb.)",
  },
  tale_celadon: {
    id: 'tale_celadon', town: 'Celadon City', giver: 'GARDENER', title: 'Roof Garden',
    stages: [
      'Water the Game Corner roof garden plants (visit 1 of 3)',
      'Water the plants again once you hold 4 badges (visit 2 of 3)',
      'Water the plants once more at 6 badges, and chase off the wild Meowth (visit 3 of 3)',
    ],
    reward: { keepsake: 'gardeniasash' }, rewardText: 'Gardenia Sash',
    bondNpc: 'erika', bondDelta: 2,
    revelation: "The roof garden grows over Celadon's first gym — a wooden hall that stood where the Game Corner now glitters. Erika's grandmother planted the first bed so the city's green would always be taller than its neon.",
  },
  tale_saffron: {
    id: 'tale_saffron', town: 'Saffron City', giver: 'MASTER KO', title: 'Two Gyms, One City',
    stages: [
      "Carry the Dojo's message to Sabrina in Saffron Gym",
      "Witness the old rivalry — then choose: the Dojo spar (XP), or Sabrina's keepsake IOU",
      'Finish it: win the Dojo spar, or redeem the IOU with Sabrina after winning her Marsh Badge',
    ],
    reward: { choice: true }, rewardText: 'Dojo spar (XP) or a keepsake IOU',
    bondNpc: 'sabrina', bondDelta: 1,
    revelation: "The Dojo and the Gym were one school once. Sabrina's father and Master Ko trained side by side — until the day they disagreed about what strength is FOR, and split the hall, the students, and Saffron itself down the middle.",
  },
  tale_fuchsia: {
    id: 'tale_fuchsia', town: 'Fuchsia City', giver: 'SAFARI WARDEN', title: "The Warden's Teeth",
    // Original spin (§5): the warden lost his FISHING LURE, not dentures.
    stages: [
      'Search the Safari Zone entrance marsh for the lost fishing lure',
      'Return the lure to the Safari Warden in Fuchsia City',
    ],
    reward: { items: { safariball: 10 } }, rewardText: '10 Safari Balls',
    bondNpc: 'koga', bondDelta: 1, // via his daughter Janine's thanks, at completion
    revelation: "The lure is older than the Safari Zone: the Warden carved it the year the marsh fed all of Fuchsia, before there were fences, gates, or tickets. Koga's grandfather taught him to fish with it.",
  },
  tale_cinnabar: {
    id: 'tale_cinnabar', town: 'Cinnabar Island', giver: 'LAB TECH', title: 'Lab Notes',
    stages: [
      'Recover the burned notes from the Mansion library (the west and east shelves)',
      'Deliver the notes to the lab tech in Cinnabar',
    ],
    reward: { keepsake: 'embereed' }, rewardText: 'Ember Seed',
    bondNpc: 'blaine', bondDelta: 1,
    revelation: 'One surviving page describes a jungle expedition that followed a mirage no instrument could record — the team came home with a single curled eyelash in a specimen jar, and a leader, Blaine among them, who never once called it a failure. What slept in that jungle, the page does not say.',
  },
};

// ---------- tale NPCs (injected into town maps at loadMap) ----------
// The shared MAPS definitions are never mutated (the Candy Coach
// pattern in overworld.mjs loadMap): the scene works on a copy whose
// npc list gains these actors and the TALE_NPC_PATCHES below. Every
// actor carries `tale` + `role`; game/overworld-systems.mjs runTaleNpc
// is their brain. `dialogue` is the fallback line set the base NPC
// flow would show if the tale handler ever declines.
const APPEAR = {
  mom: { skin: '#f0c8a0', shirt: '#c05a7a', pants: '#4a3a5a', hair: '#5a3a2a' },
  shop: { skin: '#e8b888', shirt: '#3a7a4a', pants: '#2a2a3a', hair: '#2a1a0a' },
  ace: { skin: '#d8a878', shirt: '#6a5a3a', pants: '#3a3a4a', hair: '#c0c0c0' },
  brock: { skin: '#c89878', shirt: '#7a9a4a', pants: '#4a4a3a', hair: '#3a2a1a' },
  kid: { skin: '#f0c8a0', shirt: '#e8b832', pants: '#2a4a6a', hair: '#7a1a1a' },
  harbor: { skin: '#d8a878', shirt: '#2a4a6a', pants: '#2a2a3a', hair: '#4a4a5a' },
  elder: { skin: '#e8b888', shirt: '#5a4a6a', pants: '#3a3a4a', hair: '#e8e8e8' },
  gardener: { skin: '#c89878', shirt: '#4a8a5a', pants: '#5a4a3a', hair: '#2a4a2a' },
  janine: { skin: '#f0c8a0', shirt: '#7a3a6a', pants: '#2a2a3a', hair: '#2a1a3a' },
  tech: { skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#3a6ac0' },
};
export const TALE_NPCS = [
  { map: 'pallet', x: 3, y: 4, name: 'MOM', art: 'mom', ...APPEAR.mom, tale: 'tale_pallet', role: 'giver',
    dialogue: ['Mind the grass on Route 1, love. And eat something that is not a Potion.'] },
  { map: 'viridian', x: 2, y: 7, name: 'SHOPKEEPER', art: 'clerk', ...APPEAR.shop, tale: 'tale_pallet', role: 'stage',
    dialogue: ['Viridian sundries! Maps, string, and strong opinions about both.'] },
  { map: 'viridian', x: 14, y: 4, name: 'ACE MARLOW', art: 'elder', ...APPEAR.ace, tale: 'tale_viridian', role: 'giver',
    dialogue: ['Sixty years I walked that forest. It kept one thing of mine. Fair trade, I suppose.'] },
  { map: 'pewter', x: 5, y: 4, name: 'BROCK', art: 'brock', ...APPEAR.brock, tale: 'tale_pewter', role: 'stage',
    dialogue: ['Off duty, I read to the museum fossils. They never heckle.'] },
  { map: 'cerulean', x: 16, y: 1, name: 'PIP', art: 'kid', ...APPEAR.kid, tale: 'tale_cerulean', role: 'culprit',
    dialogue: ['The cape is mine. The view is mine. The bell is — also around here somewhere.'] },
  { map: 'vermilion', x: 16, y: 11, name: 'HARBORMASTER', art: 'sailor', ...APPEAR.harbor, tale: 'tale_vermilion', role: 'stage',
    dialogue: ['Every crate, every rope, every lost page — the harbor keeps what the sea gives back.'] },
  { map: 'lavender', x: 16, y: 5, name: 'ELDER BRAM', art: 'elder', ...APPEAR.elder, tale: 'tale_lavender', role: 'stage',
    dialogue: ['I remember every name the tower forgot. Sit; an old man likes an audience.'] },
  { map: 'celadon', x: 16, y: 9, name: 'GARDENER', art: 'worker', ...APPEAR.gardener, tale: 'tale_celadon', role: 'giver',
    dialogue: ["Erika's roof garden. Three waterings a season, or the vines file a complaint."] },
  { map: 'fuchsia', x: 5, y: 11, name: 'JANINE', art: 'lass', ...APPEAR.janine, tale: 'tale_fuchsia', role: 'flavor',
    dialogue: ["Father says a ninja's patience is a pond: still on top, deep below. I am working on the still part."] },
  { map: 'cinnabar', x: 10, y: 9, name: 'LAB TECH', art: 'scientist', ...APPEAR.tech, tale: 'tale_cinnabar', role: 'giver',
    dialogue: ['The mansion library burned, but paper is stubborn. So are we.'] },
];

// Existing townsfolk who carry tale roles (patched onto the scene's
// map copy by name, in loadMap — their base definitions stay intact).
export const TALE_NPC_PATCHES = [
  { map: 'pewter', name: 'CURATOR', tale: 'tale_pewter', role: 'giver' },
  { map: 'cerulean', name: 'TESS', tale: 'tale_cerulean', role: 'giver' },
  { map: 'cerulean', name: 'WREN', tale: 'tale_cerulean', role: 'witness', witness: 1 },
  { map: 'cerulean', name: 'ORIN', tale: 'tale_cerulean', role: 'witness', witness: 2 },
  { map: 'cerulean', name: 'FAN', tale: 'tale_cerulean', role: 'witness', witness: 3 },
  { map: 'vermilion', name: 'CHAIRMAN', tale: 'tale_vermilion', role: 'giver' },
  { map: 'lavender', name: 'VOLUNTEER', tale: 'tale_lavender', role: 'giver' },
  { map: 'dojo', name: 'MASTER KO', tale: 'tale_saffron', role: 'giver' },
  { map: 'gym-saffron', name: 'SABRINA', tale: 'tale_saffron', role: 'stage' },
  { map: 'fuchsia', name: 'SAFARI WARDEN', tale: 'tale_fuchsia', role: 'giver' },
];

// ---------- tale spots (faced-tile searches, sysInteract hook) ----------
// A spot is searched by facing its tile and pressing A, exactly like a
// hidden item. The wiring (taleSpotInteract) declines (returns false)
// whenever the tale is not at the stage that needs the spot, so base
// handlers (signs, fishing) keep their behavior the rest of the time.
export const TALE_SPOTS = [
  { map: 'route2', x: 12, y: 3, tale: 'tale_viridian', kind: 'keepsake' },
  { map: 'vermilion', x: 5, y: 11, tale: 'tale_vermilion', kind: 'notes' },
  { map: 'tower1', x: 4, y: 2, tale: 'tale_lavender', kind: 'graves' },
  { map: 'safari', x: 3, y: 6, tale: 'tale_fuchsia', kind: 'lure' },
  { map: 'mansion', x: 3, y: 2, tale: 'tale_cinnabar', kind: 'notesWest' },
  { map: 'mansion', x: 15, y: 2, tale: 'tale_cinnabar', kind: 'notesEast' },
];
export function taleSpotAt(mapId, x, y) {
  return TALE_SPOTS.find((s) => s.map === mapId && s.x === x && s.y === y) || null;
}

// ---------- the stage machine (pure) ----------
// stageOf: -1 not accepted · 0..stages.length-1 in progress (the value
// is the count of completed stages) · stages.length complete.
export function taleStageOf(state, id) {
  const tale = QUESTS[id];
  if (!tale || !state || !state.story) return -1;
  const v = (state.story.quests || {})[id];
  if (v === undefined) return -1;
  if (v === 'complete') return tale.stages.length;
  if (v === 'active') return 0;
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0) return Math.min(v, tale.stages.length);
  return -1;
}
export function taleStatus(state, id) {
  const s = taleStageOf(state, id);
  if (s < 0) return 'none';
  if (s >= (QUESTS[id] ? QUESTS[id].stages.length : 0)) return 'complete';
  return 'active';
}
// The Quest Log's stage line for a tale, in any state.
export function taleStageText(state, tale) {
  const s = taleStageOf(state, tale.id);
  if (s < 0) return 'Ask ' + tale.giver + ' in ' + tale.town + '.';
  if (s >= tale.stages.length) return 'Complete. ' + tale.revelation;
  let text = tale.stages[s];
  // Saffron's final stage reads differently per branch (the choice is a
  // story flag, since flags are the save's boolean scratch space).
  if (tale.id === 'tale_saffron' && s === 2 && state.story.flags && state.story.flags.tale_saffron_iou) {
    text = 'Redeem the keepsake IOU with Sabrina (needs the Marsh Badge, if not yet won)';
  }
  // Celadon tells the player exactly which badge count unlocks a visit.
  return text;
}

export function acceptTale(state, id) {
  if (!QUESTS[id] || !state || !state.story) return false;
  const q = state.story.quests || (state.story.quests = {});
  if (q[id] !== undefined) return false;
  q[id] = 'active';
  return true;
}

// Advance one stage. Returns the new stage count, or -1 if the tale is
// not in progress. The final advance completes the tale (and pays out —
// see completeTale, which the wiring calls through this function).
export function advanceTale(state, id, opts) {
  const tale = QUESTS[id];
  if (!tale) return -1;
  const s = taleStageOf(state, id);
  if (s < 0 || s >= tale.stages.length) return -1;
  if (s + 1 >= tale.stages.length) { completeTale(state, id, opts); return tale.stages.length; }
  state.story.quests[id] = s + 1;
  return s + 1;
}

// Bonds (structural, Phase 5 reads this): story.bonds[npcId] is a hidden
// integer in the §2 range. One-shot authored sources only.
export function recordBond(state, npcId, delta) {
  if (!state || !state.story || !npcId || !delta) return 0;
  const bonds = state.story.bonds || (state.story.bonds = {});
  const next = Math.max(-10, Math.min(10, (bonds[npcId] || 0) + delta));
  bonds[npcId] = next;
  return next;
}

// Completion payout — idempotent by construction (a 'complete' tale
// never pays twice). Items land in the bag; a keepsake lands via the
// Phase 3 grant (unique-object rule: if the player somehow already owns
// the piece, the tale still completes — the object is the same one).
// opts.bondDelta overrides the def's delta (Viridian's return choice).
// opts.keepsake overrides the def's keepsake (Saffron's IOU redemption
// grants the redeemed piece, resolved by the wiring).
export function completeTale(state, id, opts) {
  const tale = QUESTS[id];
  if (!tale || !state || !state.story) return false;
  const q = state.story.quests || (state.story.quests = {});
  if (q[id] === 'complete') return false;
  q[id] = 'complete';
  const o = opts || {};
  const reward = tale.reward || {};
  const items = o.items || reward.items || {};
  for (const item of Object.keys(items)) {
    state.bag[item] = (state.bag[item] || 0) + items[item];
  }
  const ks = o.keepsake !== undefined ? o.keepsake : reward.keepsake;
  // ADR-025 §6: tale rewards ride the central source grant — a piece
  // the player already owns converts to $2,000 cash (the wiring
  // surfaces the line; see finishWith in overworld-systems).
  if (ks) grantKeepsakeFromSource(state, ks);
  const delta = o.bondDelta !== undefined ? o.bondDelta : (tale.bondDelta || 0);
  if (delta && tale.bondNpc) recordBond(state, tale.bondNpc, delta);
  return true;
}

// The Saffron IOU redemption pick: the first keepsake (tale pieces
// first, then the rest of the set) the player does not yet own — an IOU
// for "a keepsake" that can never duplicate a unique object. Resolved
// in data order; if the collection is somehow complete, the IOU pays
// XP Candy instead (the wiring states this in dialogue). Exported for
// the headless audit.
export const IOU_PRIORITY = [
  'tortoisecharm', 'ironacorn', 'tidepearl', 'spectrebell', 'gardeniasash', 'embereed',
  'sparrowfeather', 'fossilspur', 'gloomfang', 'thunderheadpin', 'secondwindribbon', 'championsribbon',
];
