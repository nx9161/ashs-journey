// story-orange.mjs — Arc 1.5 (Orange Islands) campaign data: the quest
// chain, the Orange Crew + Drake trainer defs, and the scripted story
// events (Ivy / the GS Orb, KELPSAIL, the pod reunion). Anime is primary
// canon (ADR-015); ALL dialogue/copy is original writing in the anime's
// spirit — no quoted or closely-paraphrased anime/game lines.
//
// Structured for O3 to APPEND: the Lugia / Pokemon 2000 stages join
// ORANGE_QUESTS and ORANGE_EVENTS below the marked seam — nothing here
// needs reshaping when they land.
//
// New event-step kinds consumed by runSteps (overworld-systems.mjs):
//   { gsBall }       — the Ivy grant beat: grants the GS Orb item, or
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
  { id: 'q_orange_gsball', flag: 'orange_gsball', text: 'Fetch the GS Orb from Prof. Ivy on Valencia Island', hint: 'Professor Ivy\'s lab stands at the north edge of Valencia. The ball on her pedestal has defeated every machine she owns.' },
  { id: 'q_orange_crew', flag: 'orange_crew_done', text: 'Win the four Orange Crew badges', hint: 'Cissy on Mikan, Danny on Navel, Rudy on Trovita, Luana on Kumquat. Each leader tests something before the battle — that is the Orange way.', badgeCount: true },
  { id: 'q_orange_league', flag: 'orange_champion', text: 'Challenge Drake at Pummelo Stadium and win the Orange League', hint: 'Four island badges open the stadium doors. Drake, the Orange League champion, waits inside with six partners and no intention of moving.' },
  // --- O3 APPEND SEAM: the Lugia / 2000 stages join here. ---
  // The storm chain is chronology-true mid-arc content (it unlocks at
  // 2 Orange badges — see the sysLoadMap gate in overworld-systems)
  // but APPENDS after the League stage: it is never a gym blocker,
  // and the League completion flow is untouched by it. Its stage text
  // tracks titans calmed n/3 (titanCount — the Quest Log and the HUD
  // objective count the orange_2000_<bird> flags, the badgeCount
  // idiom carried to flags).
  { id: 'q_orange_storm', flag: 'orange_2000_storm_stilled', titanCount: true, text: 'The Storm over Shamouti — calm the three titans and still the guardian\'s storm', hint: 'Unlocks once the Sea Ruby Badge is held. A sky-collector named Vance Halloway has caged the shrines of Fire, Lightning and Ice Isle, and the currents are tearing themselves apart. Free and calm Moltres, FULMINIS and Articuno at their shrine caves (any order), then return to Shamouti Shrine — Slowking counsels from its rock on Shamouti\'s west shore.' },
];

// ---------------------------------------------------------------------------
// ORANGE_TRAINERS — merged into TRAINERS by merge.mjs. Leader shape is
// the Arden gym idiom exactly (intro / lose / team / reward / badge),
// plus badgeSet: 'orange' so winTrainer's award path writes
// badges.orange + the badge_<root> flag (the Arden representation).
// Teams carry species + level only: foe movesets resolve from the
// learnset idiom in makeMon, exactly as Arden's leaders do.
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
  // register): stage A leads with MENTARCH, stage B with FOSSILORD, party
  // state carries between stages with NO heal. Only stage B carries
  // the badge, so the award fires once, on clearing both.
  luana_a: {
    id: 'luana_a', name: 'Luana', title: 'Kumquat Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['Pair one. MENTARCH takes the floor — mind the spoons, dear, they bend toward trouble.'],
    lose: ['Pair one, down! No resting — that is the whole point. Pair two, straight away!'],
    team: [
      { species: 'alakazam', level: 48 },
      { species: 'hypno', level: 46 },
    ],
    reward: 0,
  },
  luana_b: {
    id: 'luana_b', name: 'Luana', title: 'Kumquat Gym Leader', ai: 'smart', badgeSet: 'orange',
    intro: ['Pair two. FOSSILORD, darling — show them the ground remembers every step.'],
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
// to ivy-lab, KELPSAIL on Valencia after the first Orange badge, and the
// pod reunion pre-League. Leader / Drake scenes live in
// overworld-systems (runOrangeLeader / runOrangeDrake) because their
// challenges are menu-driven, not step-driven.
// ---------------------------------------------------------------------------
export const ORANGE_EVENTS = {
  ev_orange_ivy: [
    { say: ['The lab smells of salt, paper, and hot electronics. On a pedestal at its heart, under a glass hood: a Capture Orb banded in gold and silver, humming very faintly, like a kettle thinking about it.'], who: 'NARRATOR' },
    { say: ['You must be Professor Hawthorn\'s runner. I am Professor Ivy — welcome to Valencia.', 'Forgive the mess. Marine research is ninety percent waiting for the sea to finish a sentence.'], who: 'PROF. IVY' },
    { say: ['That is the famous ball. It turned up in these waters, and in three months it has beaten every opener, scanner, and polite request this lab owns. No machine can open it. I have stopped taking that personally. Mostly.'], who: 'PROF. IVY' },
    { gsBall: true },
    { say: ['Carry it carefully. Whatever is inside has waited this long — it can wait for the one pair of hands in the world that works the old way. Hawthorn will know whose those are.', 'And since you are here — the Orange Crew are taking challengers this season. Four islands, four badges, and a champion at Pummelo who has forgotten how to lose. The sea would love to watch you try.'], who: 'PROF. IVY' },
    { flag: 'orange_gsball' },
    { toast: 'The Orange Crew quest is open!' },
  ],

  ev_orange_lapras: [
    { say: ['Down at the waterline, something is wrong. A young KELPSAIL lies in the shallows, breathing hard — one flipper scraped raw, its song coming out thin and lost. Its pod\'s voices answer from far out at sea, farther every minute.'], who: 'NARRATOR' },
    { say: ['Laa... laaa...'], who: 'KELPSAIL' },
    { say: ['You work the way the Center nurses taught you: clean water, pressure, patience. The bleeding slows. The breathing steadies. Big dark eyes follow your hands the whole time — frightened, and deciding not to be.'], who: 'NARRATOR' },
    { say: ['By dusk it can swim again — slow circles, close to shore, never far from you. The pod is a day gone. This KELPSAIL has made a decision about that, and it is looking at you when it makes it.'], who: 'NARRATOR' },
    { giftCapSafe: { species: 'lapras', level: 30 } },
    { flag: 'orange_lapras_joined' },
    { say: ['KELPSAIL joined you! It sings once from the shallows — steadier already — and falls in beside you like it was always going to.'], who: 'NARRATOR' },
  ],

  ev_orange_lapras_pod: [
    { say: ['A sound rolls over the water — many voices, one song, the harmony KELPSAIL answers in its sleep. Out beyond the surf line, backs are breaking the surface in a slow, travelling line. The pod. Passing, at last, on its old road.'], who: 'NARRATOR' },
    { say: ['KELPSAIL goes very still. Then it sings — the thin, lost note from the Valencia shallows, grown strong. An older voice answers from the line, and for a while the two songs braid around each other: news, and grief, and pride, all in the family key.'], who: 'NARRATOR' },
    { say: ['It swims out. It rides a long circle with its own kind, touching flippers, learning the road it missed. The stadium lights behind you can wait. Some things a trainer simply stands back for.'], who: 'NARRATOR' },
    { say: ['Then — a turn. A choice, made the way it made the first one: with its whole heart, in the open. KELPSAIL cuts back through the surf and beaches itself at your feet, singing fit to burst. It visited home. It is choosing its other home. Yours.'], who: 'NARRATOR' },
    { flag: 'orange_lapras_pod' },
    { toast: 'KELPSAIL chose to stay with you.' },
  ],

  // =====================================================================
  // Stage O3 — Pokemon 2000: the Shamouti climax + the Lugia arc.
  // The antagonist is an ORIGINAL character: Vance Halloway, a wealthy
  // sky-collector who cages wonders for a frozen menagerie he calls
  // the Still Sky Collection. He is not a renamed film character and
  // no line here is borrowed from any film or episode.
  //
  // Battle law (the shipped event idiom, story-kanto's ghost/movie
  // pattern): every quell battle and the climax are event wildBattles
  // with uncatchable: true — balls are refused in-battle exactly as
  // the Tower ghost refuses them. The runSteps wildBattle guard
  // (ADR-025 QA D1) advances the chain only on (won && !fled), so
  // fleeing completes NOTHING: the event's done flag stays unwritten
  // and the scene re-fires (cave altar tiles / shrine & deep entry).
  // Losing blacks out to the nearest Center per shipped rules and
  // likewise leaves the chain unstalled-but-unfinished — re-entry
  // re-fires. These event birds are NOT the Arden legendary-arc
  // birds: no arc_zapdos / arc_moltres / arc_articuno flag or quest
  // entry is read or written anywhere below.
  // =====================================================================

  // -- The storm trigger (first Shamouti arrival with the Sea Ruby held;
  //    sysLoadMap gate: >= 2 Orange badges, no storm flag yet) ----------
  ev_orange_2000_storm: [
    { say: ['The ferry rope is singing in the wind before the dock is even under your feet. Shamouti\'s festival banners snap like sails, the plaza lanterns swing wild, and out past the shrine isles the sky is the colour of a bruise — three storm cells, turning slowly around an empty centre, like something enormous is being wound up.'], who: 'NARRATOR' },
    { say: ['Trainer! Off the dock, quickly — mind the crates, the sea keeps throwing them back. You have come for the festival, poor soul. So had we all.'], who: 'FEST ELDER MIRA' },
    { say: ['Three nights ago a sky-barge came over the shrine isles — all glass and brass and quiet engines. Since then: cages of light on the shrines, the currents running wrong, and the birds — oh, the birds. When the three titans rage, the whole sky argues with itself.'], who: 'FEST ELDER MIRA' },
    { say: ['A pleasure to be introduced by my weather. Vance Halloway, collector — the Still Sky Collection, soon to be the wonder of every port that matters. Three titans, stilled forever in glass and frost-light. No more storms. No more moods. Perfection, kept.'], who: 'VANCE HALLOWAY' },
    { say: ['You mistake me for a villain, child. I am a curator. The sea cannot be trusted with its own treasures — look at it! I am simply... tidying the sky.'], who: 'VANCE HALLOWAY' },
    { say: ['The barge lifts away toward Fire Isle, unhurried as snowfall. On the west shore, unmoving on its rock through all of it, the island\'s oldest resident watches you approach — and, for the first time in living memory, the Slowking speaks first.'], who: 'NARRATOR' },
    { say: ['Slow... king. King. Slowking slow, king — slow.'], who: 'SLOWKING' },
    { say: ['It turns its great head toward the three isles, one by one. Fire. Lightning. Ice. Then toward the shrine above the plaza, and down — deep down — with a patience like the bottom of the sea. The meaning arrives the way its speech does: slowly, and all at once. Free the shrines. Calm the titans. Then the guardian will decide what the sea does next.'], who: 'NARRATOR' },
    { flag: 'orange_2000_active' },
    { toast: 'The Storm over Shamouti has begun!' },
  ],

  // -- The three titan quells (shrine-cave altar tiles; any order) -----
  ev_orange_2000_moltres: [
    { say: ['The shrine niche is wrapped in bars of hard light, humming — Halloway\'s cage, sunk into the old stone like a fence into a grave. Behind it, the kind fires have gone white and furious, and the heat coming off the altar has a heartbeat.'], who: 'NARRATOR' },
    { say: ['You work the cage the only way cages understand. Stone chips. Light cracks — and the shrine\'s tenant answers the noise the way it has answered everything for a thousand years: all at once, and on fire.'], who: 'NARRATOR' },
    { wildBattle: { species: 'moltres', level: 50, uncatchable: true } },
    { say: ['The great wings fold. The white rage banks down to ember, to glow, to the warm breathing dark the cave remembers. Moltres regards you for a long moment — then the cave roof is sky, and it is gone into the clearing south wind, free and unhurried.'], who: 'NARRATOR' },
    { flag: 'orange_2000_moltres' },
    { toast: 'Moltres is calmed. The southern storm cell breaks.' },
  ],

  ev_orange_2000_zapdos: [
    { say: ['Copper offerings have fused into the cage bars, and the whole shrine rings at a pitch just below hearing. Halloway\'s light-cage is drinking the storm out of the stone — and the stone\'s owner has noticed the theft, and the thief\'s timing, and you.'], who: 'NARRATOR' },
    { say: ['The bars come down in a smell of hot rain. What rises out of the shrine is not angry the way fire is angry. It is angry the way weather is angry: personally, and at everything, all at once.'], who: 'NARRATOR' },
    { wildBattle: { species: 'zapdos', level: 50, uncatchable: true } },
    { say: ['One last thunderclap — closer to a sentence than a sound — and FULMINIS shakes the cage-light off its wings like rain. It circles the cave once, sparks settling, then takes the east wind out over a sky that is suddenly, noticeably quieter.'], who: 'NARRATOR' },
    { flag: 'orange_2000_zapdos' },
    { toast: 'FULMINIS is calmed. The eastern storm cell breaks.' },
  ],

  ev_orange_2000_articuno: [
    { say: ['The cage bars are rimes of black ice over hard light, and the shrine\'s frozen offerings hang mid-gesture inside it, preserved like flies in amber. Halloway would call that a preview. The cold coming through the bars has an opinion of its own.'], who: 'NARRATOR' },
    { say: ['The cage shatters outward in a ring of snow that never touches you. Articuno unfolds from the shrine the way winter unfolds from a mountain: slowly, beautifully, and with complete indifference to your plans.'], who: 'NARRATOR' },
    { wildBattle: { species: 'articuno', level: 50, uncatchable: true } },
    { say: ['The vast wings settle. Frost flowers close like eyes. Articuno bows its head — a fraction, no more than courtesy owes — and lifts away north over water that has stopped arguing with itself. One storm remains, and it is the one in the middle.'], who: 'NARRATOR' },
    { flag: 'orange_2000_articuno' },
    { toast: 'Articuno is calmed. The northern storm cell breaks.' },
  ],

  // -- The Lugia climax (Shamouti Shrine entry at 3/3 titans calmed;
  //    sysLoadMap gate. The proving is a straight win — the shipped
  //    event idiom — fought UNcatchable at the deep altar.) ------------
  ev_orange_2000_climax: [
    { say: ['The shrine is too quiet. Three candles burn straight up in windless air, and the keeper\'s hands are folded the way hands fold at sickbeds and weddings. Slowking stands in the doorway — it has climbed from its rock, which no living islander has seen it do.'], who: 'NARRATOR' },
    { say: ['Slow... king.'], who: 'SLOWKING' },
    { say: ['It means: now. Above the plaza, glass and brass descend through the breaking cloud — Halloway\'s barge, every light it owns burning, one enormous empty cage swinging beneath it like a bell.'], who: 'NARRATOR' },
    { say: ['Three titans, loose — my collection, scattered by a child with a ferry pass! No matter. No matter! The centre of the storm is still empty, curator\'s law: empty centres are filled by whoever arrives with a cage big enough. Guardian! I have come to tidy YOU.'], who: 'VANCE HALLOWAY' },
    { say: ['Slowking walks — unhurried, absolute — to the back passage, and down toward the deep chamber. It does not look back. It does not need to. You follow it into the cold, deep water-light, where the sealed altar waits... and the sea, at last, answers.'], who: 'NARRATOR' },
    { warp: { map: 'shamouti-deep', x: 7, y: 10 } },
    { say: ['It rises the way the tide rises: not fast, not slow — inevitably. Wings like white headlands. Eyes that have watched ten thousand festivals and every storm since the first one. The guardian of the sea does not rage. It MEASURES. The one who calmed the titans will be tested the way the sea tests everything: completely.'], who: 'NARRATOR' },
    { wildBattle: { species: 'lugia', level: 55, uncatchable: true } },
    { say: ['Lugia folds its wings. The proving is over — and somewhere far above, audible even here, the storm simply... stops. Rain first, then wind, then the long grinding argument of the currents, settling one by one into their old, kind roads.'], who: 'NARRATOR' },
    { say: ['Halloway\'s barge comes down in the harbour like a tired bird — cage swinging empty, lights drowned, engines full of seawater and second thoughts. Its owner stands on Shamouti\'s dock in the returning sunlight, holding his hat, looking at the calm he tried to steal and somehow helped to save.'], who: 'NARRATOR' },
    { say: ['...Stilled. All of it. And not one piece of it mine. Do you know, I believe that is the first honest thing the sea has ever said to me. Keep your guardian, island. Keep your storms. A collection, it turns out, is a poor substitute for a sky.'], who: 'VANCE HALLOWAY' },
    { flag: 'orange_2000_storm_stilled' },
    { arc: 'arc_lugia_shamouti', stage: 'discovered' },
    { questDone: 'q_orange_storm' },
    { toast: 'The storm is stilled. The festival can begin again.' },
    { warp: { map: 'shamouti', x: 14, y: 14 } },
  ],

  // -- The catch: Lugia waits at the deep altar (Shamouti Deep entry
  //    once the storm is stilled; sysLoadMap gate). Standard legendary
  //    pattern — Lv 55, CATCHABLE, and flee-safe per the Arden arc
  //    idiom: the runSteps guard completes the arc only on a clean
  //    win, so a flee (or a loss) leaves Lugia waiting and the event
  //    re-fires on the next descent. -------------------------------
  ev_orange_2000_lugia: [
    { say: ['The deep chamber is still as held breath. In the water-light at the altar, immense and patient, the guardian waits — not sleeping, not wary. Waiting the way the sea waits: because it can, and because you came back.'], who: 'NARRATOR' },
    { arc: 'arc_lugia_shamouti', stage: 'active' },
    { wildBattle: { species: 'lugia', level: 55, legendary: true } },
    { arc: 'arc_lugia_shamouti', stage: 'complete' },
    { flag: 'orange_2000_lugia_done' },
    { toast: 'The guardian of the sea has given its answer.' },
  ],
};

// ---------------------------------------------------------------------------
// ORANGE_LEGENDARY_ARCS — merged into LEGENDARY_ARCS by merge.mjs and
// into the validator's quest table by gen-tables (the Arden table's
// presentation: hook + requirement steps spelled out in the Quest
// Log's LEGENDARY ARCS section). This is the Orange Lugia — a
// DIFFERENT arc from the designed Yamato arc_lugia stub in
// story-kanto (that arc's prereqs and lair are untouched).
// ---------------------------------------------------------------------------
export const ORANGE_LEGENDARY_ARCS = {
  arc_lugia_shamouti: {
    id: 'arc_lugia_shamouti', title: 'The Guardian of the Sea', species: 'lugia', region: 'Orange Islands',
    hook: 'When the three titans raged over Shamouti, the sea\'s guardian rose to measure the one who calmed them — and having measured, it waits now in still water for the meeting to be finished properly.',
    steps: [
      { text: 'Hold the Sea Ruby Badge and come to Shamouti as the storm breaks', flag: 'orange_2000_active' },
      { text: 'Calm Moltres at the Fire Isle shrine cave', flag: 'orange_2000_moltres' },
      { text: 'Calm FULMINIS at the Lightning Isle shrine cave', flag: 'orange_2000_zapdos' },
      { text: 'Calm Articuno at the Ice Isle shrine cave', flag: 'orange_2000_articuno' },
      { text: 'Face the guardian\'s proving at the deep altar (it cannot be caught there)', flag: 'orange_2000_storm_stilled' },
      { text: 'Return to the altar in Shamouti Deep, where Lugia waits in still water', catch: 'lugia' },
    ],
    lair: 'shamouti-deep',
  },
};
