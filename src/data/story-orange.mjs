// story-orange.mjs — Arc 1.5 (Orange Islands) campaign data: the quest
// chain, the Orange Crew + Drake trainer defs, and the scripted story
// events (Ivy / the GS Ball, Lapras, the pod reunion). Anime is primary
// canon (ADR-015); ALL dialogue/copy is original writing in the anime's
// spirit — no quoted or closely-paraphrased anime/game lines.
//
// Structured for O3 to APPEND: the Lugia / Pokemon 2000 stages join
// ORANGE_QUESTS and ORANGE_EVENTS below the marked seam — nothing here
// needs reshaping when they land.
//
// New event-step kinds consumed by runSteps (overworld-systems.mjs):
//   { gsBall }       — the Ivy grant beat: grants the GS Ball item, or
//                      plays the already-own-one variant (Cheat
//                      Terminal owners) with NO duplicate grant.
//   { giftCapSafe }  — cap-safe gift delivery (cheatDeliverMon idiom):
//                      party if room, else the first PC box with
//                      space, with a toast naming the box. On total
//                      refusal the chain STALLS (no flag, no done) so
//                      the beat can be re-run — never a soft-fail.

// ---------------------------------------------------------------------------
// ORANGE_QUESTS — the Orange main-story objective chain, in the
// MAIN_QUESTS idiom (id / flag / text / hint). `flag` is the story flag
// that completes the objective; the badge stage additionally carries a
// dynamic count (the Quest Log renders "n/4" from badges.orange while
// the stage is active — see main-systems openQuestLog).
// ---------------------------------------------------------------------------
export const ORANGE_QUESTS = [
  { id: 'q_orange_gsball', flag: 'orange_gsball', text: 'Fetch the GS Ball from Prof. Ivy on Valencia Island', hint: 'Professor Ivy\'s lab stands at the north edge of Valencia. The ball on her pedestal has defeated every machine she owns.' },
  { id: 'q_orange_crew', flag: 'orange_crew_done', text: 'Win the four Orange Crew badges', hint: 'Cissy on Mikan, Danny on Navel, Rudy on Trovita, Luana on Kumquat. Each leader tests something before the battle — that is the Orange way.', badgeCount: true },
  { id: 'q_orange_league', flag: 'orange_champion', text: 'Challenge Drake at Pummelo Stadium and win the Orange League', hint: 'Four island badges open the stadium doors. Drake, the Orange League champion, waits inside with six partners and no intention of moving.' },
  // --- O3 APPEND SEAM: the Lugia / 2000 stages join here. ---
];

// ---------------------------------------------------------------------------
// ORANGE_TRAINERS — merged into TRAINERS by merge.mjs. Leader shape is
// the Kanto gym idiom exactly (intro / lose / team / reward / badge),
// plus badgeSet: 'orange' so winTrainer's award path writes
// badges.orange + the badge_<root> flag (the Kanto representation).
// Teams carry species + level only: foe movesets resolve from the
// learnset idiom in makeMon, exactly as Kanto's leaders do.
// ---------------------------------------------------------------------------
export const ORANGE_TRAINERS = {
  cissy: {
    id: 'cissy', name: 'Cissy', title: 'Mikan Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['Range rules are range rules — you passed the targets, so now you get the real thing. My water team does not miss, challenger. Neither do I.'],
    lose: ['Beaten on my own lagoon... clean and fair.', 'The Coral-Eye Badge is yours. Aim true out there — the sea rewards it.'],
    team: [
      { species: 'seadra', level: 38 },
      { species: 'starmie', level: 40 },
    ],
    reward: 4000, badge: 'coraleyebadge',
  },
  danny: {
    id: 'danny', name: 'Danny', title: 'Navel Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['You climbed my mountain, so you already know half my philosophy: the hard way up is the honest way. Now the other half — battle.'],
    lose: ['Winded, beaten, and grinning. That is a summit day.', 'The Sea Ruby Badge, earned at altitude. Mind the sled on your way down — ceremony rules.'],
    team: [
      { species: 'nidoqueen', level: 41 },
      { species: 'machoke', level: 42 },
      { species: 'scyther', level: 44 },
    ],
    reward: 4400, badge: 'searubybadge',
  },
  rudy: {
    id: 'rudy', name: 'Rudy', title: 'Trovita Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['You showed me your team\'s types with an open hand. I respect that. Now show me their rhythm — Trovita battles are danced as much as fought.'],
    lose: ['What a number. What a finish. I am applauding and I do not even mind.', 'The Spike Shell Badge is yours. Dance on, champion-to-be.'],
    team: [
      { species: 'electabuzz', level: 44 },
      { species: 'exeggutor', level: 45 },
      { species: 'starmie', level: 47 },
    ],
    reward: 4700, badge: 'spikeshellbadge',
  },
  // Luana's double battle, honestly adapted to the singles engine as a
  // TWO-STAGE match (deliberate, disclosed deviation — see the audit
  // register): stage A leads with Alakazam, stage B with Marowak, party
  // state carries between stages with NO heal. Only stage B carries
  // the badge, so the award fires once, on clearing both.
  luana_a: {
    id: 'luana_a', name: 'Luana', title: 'Kumquat Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['Pair one. Alakazam takes the floor — mind the spoons, dear, they bend toward trouble.'],
    lose: ['Pair one, down! No resting — that is the whole point. Pair two, straight away!'],
    team: [
      { species: 'alakazam', level: 48 },
      { species: 'hypno', level: 46 },
    ],
    reward: 0,
  },
  luana_b: {
    id: 'luana_b', name: 'Luana', title: 'Kumquat Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['Pair two. Marowak, darling — show them the ground remembers every step.'],
    lose: ['Both pairs. Both! Oh, that was a match to frame.', 'The Jade Star Badge is yours, with the resort\'s compliments — and mine, which are rarer.'],
    team: [
      { species: 'marowak', level: 50 },
      { species: 'gengar', level: 48 },
    ],
    reward: 5000, badge: 'jadestarbadge',
  },
  drake: {
    id: 'drake', name: 'Drake', title: 'Orange League Champion', ai: 'smart',
    intro: ['Four badges, and every one of them earned the island way. Good. I have waited all season for a final worth the stadium. Give me a battle the sea can hear.'],
    lose: ['...Listen to that crowd. They know. I know.', 'Champion of the Orange League — the title is yours, and so is the Winner\'s Trophy. Hold it high. You carried a strange ball across my whole sea to earn it.'],
    team: [
      { species: 'ditto', level: 52 },
      { species: 'onix', level: 53 },
      { species: 'gengar', level: 54 },
      { species: 'venusaur', level: 55 },
      { species: 'electabuzz', level: 56 },
      { species: 'dragonite', level: 58 },
    ],
    reward: 8000,
  },
};

// ---------------------------------------------------------------------------
// ORANGE_EVENTS — merged into EVENTS by merge.mjs. Map-entry scenes
// (sysLoadMap fires them once, flag-gated): Ivy's intro on first entry
// to ivy-lab, Lapras on Valencia after the first Orange badge, and the
// pod reunion pre-League. Leader / Drake scenes live in
// overworld-systems (runOrangeLeader / runOrangeDrake) because their
// challenges are menu-driven, not step-driven.
// ---------------------------------------------------------------------------
export const ORANGE_EVENTS = {
  ev_orange_ivy: [
    { say: ['The lab smells of salt, paper, and hot electronics. On a pedestal at its heart, under a glass hood: a Poke Ball banded in gold and silver, humming very faintly, like a kettle thinking about it.'], who: 'NARRATOR' },
    { say: ['You must be Professor Hawthorn\'s runner. I am Professor Ivy — welcome to Valencia.', 'Forgive the mess. Marine research is ninety percent waiting for the sea to finish a sentence.'], who: 'PROF. IVY' },
    { say: ['That is the famous ball. It turned up in these waters, and in three months it has beaten every opener, scanner, and polite request this lab owns. No machine can open it. I have stopped taking that personally. Mostly.'], who: 'PROF. IVY' },
    { gsBall: true },
    { say: ['Carry it carefully. Whatever is inside has waited this long — it can wait for the one pair of hands in the world that works the old way. Hawthorn will know whose those are.', 'And since you are here — the Orange Crew are taking challengers this season. Four islands, four badges, and a champion at Pummelo who has forgotten how to lose. The sea would love to watch you try.'], who: 'PROF. IVY' },
    { flag: 'orange_gsball' },
    { toast: 'The Orange Crew quest is open!' },
  ],

  ev_orange_lapras: [
    { say: ['Down at the waterline, something is wrong. A young Lapras lies in the shallows, breathing hard — one flipper scraped raw, its song coming out thin and lost. Its pod\'s voices answer from far out at sea, farther every minute.'], who: 'NARRATOR' },
    { say: ['Laa... laaa...'], who: 'LAPRAS' },
    { say: ['You work the way the Center nurses taught you: clean water, pressure, patience. The bleeding slows. The breathing steadies. Big dark eyes follow your hands the whole time — frightened, and deciding not to be.'], who: 'NARRATOR' },
    { say: ['By dusk it can swim again — slow circles, close to shore, never far from you. The pod is a day gone. This Lapras has made a decision about that, and it is looking at you when it makes it.'], who: 'NARRATOR' },
    { giftCapSafe: { species: 'lapras', level: 30 } },
    { flag: 'orange_lapras_joined' },
    { say: ['Lapras joined you! It sings once from the shallows — steadier already — and falls in beside you like it was always going to.'], who: 'NARRATOR' },
  ],

  ev_orange_lapras_pod: [
    { say: ['A sound rolls over the water — many voices, one song, the harmony Lapras answers in its sleep. Out beyond the surf line, backs are breaking the surface in a slow, travelling line. The pod. Passing, at last, on its old road.'], who: 'NARRATOR' },
    { say: ['Lapras goes very still. Then it sings — the thin, lost note from the Valencia shallows, grown strong. An older voice answers from the line, and for a while the two songs braid around each other: news, and grief, and pride, all in the family key.'], who: 'NARRATOR' },
    { say: ['It swims out. It rides a long circle with its own kind, touching flippers, learning the road it missed. The stadium lights behind you can wait. Some things a trainer simply stands back for.'], who: 'NARRATOR' },
    { say: ['Then — a turn. A choice, made the way it made the first one: with its whole heart, in the open. Lapras cuts back through the surf and beaches itself at your feet, singing fit to burst. It visited home. It is choosing its other home. Yours.'], who: 'NARRATOR' },
    { flag: 'orange_lapras_pod' },
    { toast: 'Lapras chose to stay with you.' },
  ],
};
