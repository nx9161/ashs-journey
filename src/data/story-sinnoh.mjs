// story-sinnoh.mjs — Arc 4 Stage S5a: the Sinnoh story, FIRST HALF
// (arrival -> gyms 1-4 -> Veilstone). Platinum governs; the anime is
// the primary canon (ADR-015); every line below is original writing —
// no borrowed dialogue. The second half (Lake Valor onward, the lakes,
// Coronet, Spear Pillar, gyms 5-8, the League) is Stage S5b's, and it
// APPENDS to this file's chain the way H4b appended to H4a's.
//
// Shape notes (the H4a idiom, mirrored):
//  - SINNOH_QUESTS: the arc chain in the MAIN_QUESTS idiom. Each row's
//    flag is the flag its beat SETS on completion; the Quest Log's
//    Sinnoh section and the HUD objective read the first unset flag.
//  - The registry row (data/arcs.mjs) already carries the embark /
//    arrival / en-route text; the homecoming machine consumed it at
//    S0. This file writes the story that happens AFTER the landing:
//    no new-starter fiction, no team reset — the player is Ash, an
//    established champion-tier trainer travelling at full strength
//    (Amendment 1), and Rowan registers a veteran, not a beginner.
//  - The badge-prefix leader law is the GENERIC path: the leaders'
//    trainer defs carry badgeSet:'sinnoh' + badge, so winTrainer
//    awards badges.sinnoh in BADGE_SETS order, and the overworld
//    refusal in runSinnohNpc reads badges.sinnoh (the Johto/Hoenn
//    generic path).
//  - PAUL is the rival spine: an intro battle at the lab (~312), a
//    cold assessment at Eterna, the Chimchar beat at Hearthome, and a
//    harder battle on his home turf at Veilstone (~348). BARRY is the
//    secondary rival — frantic, fine-obsessed, original writing.
//  - Team Galactic, first half: a glimpse at Lake Verity, pressure in
//    Jubilife, Mars at the Valley Windworks, Jupiter in the Eterna
//    building, Saturn holding the Veilstone HQ's door. PACING CALL
//    (recorded in the register): the full Veilstone HQ raid is S5b's
//    — the anime spreads the HQ across the arc, and S5a's Saturn is
//    presence + a locked door, not a raid.
//  - TMs: H4a added NO Gen-3 TM rows (TM_MOVES is still the Gen-1 50),
//    so S5a adds NO Gen-4 TM rows either — mirrored exactly, named
//    here so S5b inherits the same answer.

export const SINNOH_QUESTS = [
  { id: 'q_sinnoh_arrival', text: 'Sail to Sinnoh — land at Sandgem Town', hint: 'The ferry from Vermilion docks at Sandgem, under the mountain. A new region, an old cold, and a professor who measures trainers the way winter measures roofs.', flag: 'sinnoh_arrival' },
  { id: 'q_sinnoh_lab', text: "Report to Professor Rowan's lab in Sandgem", hint: 'Rowan studies how Pokemon change and grow. He has questions for a trainer of your record — and, it turns out, another visitor with questions of his own.', flag: 'rowan_registered' },
  { id: 'q_sinnoh_paul1', text: "The cold-eyed trainer: take Paul's measure at the lab", hint: 'Paul battles the way an auditor reads a ledger: everything counted, nothing forgiven. Whatever the result, he will file you under a number. Prove the number wrong later.', flag: 'paul1_done' },
  { id: 'q_sinnoh_verity', text: 'Lake Verity — something moved on the water', hint: 'West of Twinleaf, the lake sits still as glass. Old stories say a spirit of emotion sleeps beneath it. Stand on the shore a while. Watch.', flag: 'verity_glimpse' },
  { id: 'q_sinnoh_roark', text: 'Oreburgh Gym — challenge Roark for the Coal Badge', hint: 'East through the mines to Oreburgh. Roark digs up fossils and challengers with the same care, and his Cranidos has opinions about both.', flag: 'badge_coal' },
  { id: 'q_sinnoh_windworks', text: 'Valley Windworks — break the lock-in', hint: 'North of Floaroma, the wind turbines have stopped answering their keeper. A red-suited crew calling itself Galactic is holding the works — and a hostage.', flag: 'windworks_cleared' },
  { id: 'q_sinnoh_gardenia', text: 'Eterna Gym — challenge Gardenia for the Forest Badge', hint: 'Through Eterna Forest to the city of old stones. Gardenia grows her gym like a garden and fights like weather over one.', flag: 'badge_forest' },
  { id: 'q_sinnoh_galactic', text: 'Eterna City — look into the Galactic building', hint: 'The tower with the meteor logo, the hushed lobby, the guards who smile like locks. Whatever Team Galactic is counting in there, it is worth counting out loud.', flag: 'galactic_eterna_done' },
  { id: 'q_sinnoh_fantina', text: 'Hearthome Gym — challenge Fantina for the Relic Badge', hint: 'South to Hearthome, the city of contests and ghosts. Fantina judges a battle the way she judges an appeal: grace first, then everything else at once.', flag: 'badge_relic' },
  { id: 'q_sinnoh_dawn', text: "Hearthome's Super Contest Hall — Dawn's first stage", hint: 'Dawn has been rehearsing in her head since Twinleaf. Her first Super Contest is at Hearthome. Be in the seats. Bring your loudest polite applause.', flag: 'dawn_hearthome_done' },
  { id: 'q_sinnoh_chimchar', text: 'The little fire Paul left behind', hint: 'Paul discards what does not win. In Hearthome, what he discarded is standing in the road with its flame lit, waiting to see whose road it is now.', flag: 'chimchar_beat_done' },
  { id: 'q_sinnoh_defog', text: 'Solaceon Ruins — claim the mist-clearing HM', hint: 'East of Hearthome, the fog roads begin. Deep in the Solaceon Ruins sleeps the old HM the League entrusted to the stones: Defog. The chamber keeps it still.', flag: 'defog_received' },
  { id: 'q_sinnoh_maylene', text: 'Veilstone Gym — challenge Maylene for the Cobble Badge', hint: 'Veilstone: department stores, meteor craters, and a gym leader who trains before dawn and apologizes to no one. Maylene fights bare-knuckle honest.', flag: 'badge_cobble' },
  { id: 'q_sinnoh_paul2', text: "Veilstone — Paul's home turf: settle the measure again", hint: 'Paul is from Veilstone. Here, the ledger he keeps on you gets audited — by him, at full strength, in front of his own streets. Bring everything the first four badges taught you.', flag: 'paul_veilstone_done' },
];

export const SINNOH_TRAINERS = {
  // ---- the four leaders (badgeSet 'sinnoh': the generic award) ----
  roark: {
    id: 'roark', name: 'ROARK', title: 'Oreburgh Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Welcome to Oreburgh Gym. I am Roark — I dig fossils out of this mountain and challengers out of their overconfidence, and I am careful with both.', 'Your record says you have crossed four regions. Records are strata, trainer: impressive, and entirely in the past. Show me the present tense.'],
    lose: ['Struck clean through. No — do not apologize to the rock. The rock respects it.', 'The Coal Badge is yours. Wear it like a seam of something valuable: under everything, holding the rest up.'],
    team: [
      { species: 'geodude', level: 308 },
      { species: 'onix', level: 310 },
      { species: 'cranidos', level: 312, keepsake: 'coalseamcharm' },
    ],
    reward: 1800, badge: 'coalbadge',
  },
  gardenia: {
    id: 'gardenia', name: 'GARDENIA', title: 'Eterna Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['You came through my forest — I can smell the green on you. I am Gardenia. Everything in this gym grows, challenger, including the difficulty.', 'Grass does not hurry, and it does not stop. That is the whole strategy. Try to keep up with something that patient.'],
    lose: ['Pruned — cleanly, and by an expert hand. I almost enjoyed that. Almost.', 'The Forest Badge, then. It suits a trainer who walks through green places carefully. The road east is older than this city, and stranger. Mind the tower with the meteor on it.'],
    team: [
      { species: 'cherubi', level: 318 },
      { species: 'turtwig', level: 320 },
      { species: 'roserade', level: 322, keepsake: 'meadowcord' },
    ],
    reward: 2200, badge: 'forestbadge',
  },
  fantina: {
    id: 'fantina', name: 'FANTINA', title: 'Hearthome Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Oh-ho! A challenger with a famous silhouette. I am Fantina — I judge contests, I raise ghosts, and I adore an entrance.', 'A battle is an appeal performed at speed, darling. Show me your grace. Then show me everything underneath it.'],
    lose: ['Breathtaking! Defeated, and applauding — a judge knows a winning performance when it sweeps her own stage.', 'The Relic Badge is yours. Somewhere east, the fog is sitting on the road like a critic. The ruins at Solaceon keep the remedy, if the stones are feeling generous.'],
    team: [
      { species: 'duskull', level: 328 },
      { species: 'haunter', level: 330 },
      { species: 'mismagius', level: 332, keepsake: 'spectrebell' },
    ],
    reward: 2600, badge: 'relicbadge',
  },
  maylene: {
    id: 'maylene', name: 'MAYLENE', title: 'Veilstone Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['I am Maylene. I trained at dawn, I will train at dusk, and in between I take challengers apart to see how they are built.', 'No speeches in this gym. Your team\'s stance says everything about you already. Let me read it properly — with my fists.'],
    lose: ['...Read, and answered. You fight like your whole team shares one heartbeat. That is not technique. That is trust, trained.', 'The Cobble Badge. Earned in the open, no shortcuts — the only way this gym gives anything. The lakes are next on every road out of here, trainer. Watch the water. Something in this region is counting it.'],
    team: [
      { species: 'meditite', level: 340 },
      { species: 'machoke', level: 342 },
      { species: 'lucario', level: 345, keepsake: 'thunderheadpin' },
    ],
    reward: 3000, badge: 'cobblebadge',
  },

  // ---- gym rosters (two talk-to trainers per gym, rising) ----
  roark_miner1: {
    id: 'roark_miner1', name: 'MINER COLE', title: 'Oreburgh Gym Trainer', ai: 'smart',
    intro: ['Roark lets us spar challengers first — says it warms the rock up. Mind the little ones; the mountain breeds them stubborn.'],
    lose: ['Stubborn met stubborn, and mine blinked first. Roark is at the back, past the seam. Mind Cranidos — it headbutts greetings.'],
    team: [{ species: 'geodude', level: 304 }, { species: 'onix', level: 306 }], reward: 500,
  },
  roark_miner2: {
    id: 'roark_miner2', name: 'MINER FENN', title: 'Oreburgh Gym Trainer', ai: 'smart',
    intro: ['Every fossil in the museum upstairs slept a million years to be looked at. My team slept in a mine. Similar attitudes.'],
    lose: ['A million years of practice, beaten by a Tuesday. The leader is yours to face, trainer.'],
    team: [{ species: 'geodude', level: 305 }, { species: 'graveler', level: 307 }], reward: 550,
  },
  gardenia_adept1: {
    id: 'gardenia_adept1', name: 'AROMA ADEPT LIA', title: 'Eterna Gym Trainer', ai: 'smart',
    intro: ['Gardenia waters us twice a day and challengers once. You are just in time for your watering.'],
    lose: ['Watered, weeded, and beaten. The greenhouse door at the back is hers. Bring sun.'],
    team: [{ species: 'cherubi', level: 316 }, { species: 'budew', level: 317 }], reward: 600,
  },
  gardenia_adept2: {
    id: 'gardenia_adept2', name: 'AROMA ADEPT ROSALIE', title: 'Eterna Gym Trainer', ai: 'smart',
    intro: ['Everything here blooms on schedule. Challengers are the only weeds we tolerate, and only briefly.'],
    lose: ['Brief, was it? I shall compost that opinion. Gardenia waits among the tall flowers.'],
    team: [{ species: 'roselia', level: 319 }, { species: 'turtwig', level: 318 }], reward: 650,
  },
  fantina_ace1: {
    id: 'fantina_ace1', name: 'ACE TRAINER VERE', title: 'Hearthome Gym Trainer', ai: 'smart',
    intro: ['Madame Fantina insists we rehearse challengers before the performance. I am the rehearsal. The ghosts are the easy part.'],
    lose: ['Rehearsal concluded — to the challenger. The performance is through the curtain. She has been watching, by the way. She always watches.'],
    team: [{ species: 'drifloon', level: 326 }, { species: 'gastly', level: 327 }], reward: 700,
  },
  fantina_ace2: {
    id: 'fantina_ace2', name: 'ACE TRAINER MIRA', title: 'Hearthome Gym Trainer', ai: 'smart',
    intro: ['In this gym we bow before we battle. It is the last polite thing that happens.'],
    lose: ['And — scene. Take your bow, challenger. Hers is the stage at the back, and she does not share it.'],
    team: [{ species: 'haunter', level: 329 }, { species: 'misdreavus', level: 330 }], reward: 750,
  },
  maylene_belt1: {
    id: 'maylene_belt1', name: 'BLACK BELT JON', title: 'Veilstone Gym Trainer', ai: 'smart',
    intro: ['Maylene\'s rule: nobody reaches her untested, and nobody tests you gently. Stance up.'],
    lose: ['Tested, and passed. She is at the back, doing one-armed push-ups and paperwork. Both can wait. Yours cannot.'],
    team: [{ species: 'machop', level: 336 }, { species: 'meditite', level: 338 }], reward: 800,
  },
  maylene_belt2: {
    id: 'maylene_belt2', name: 'BLACK BELT RUE', title: 'Veilstone Gym Trainer', ai: 'smart',
    intro: ['I have sparred Maylene every morning for two years. She has never once gone easy. Neither, in her honor, do I.'],
    lose: ['Two years of mornings, and you read me in minutes. Go on, then. Her Lucario has been listening to this whole conversation.'],
    team: [{ species: 'croagunk', level: 339 }, { species: 'machoke', level: 341 }], reward: 850,
  },

  // ---- PAUL, the rival spine (all battles friendly-measure) ----
  paul_sandgem: {
    id: 'paul_sandgem', name: 'PAUL', title: 'Trainer from Veilstone', ai: 'smart',
    intro: ['So you are the famous one. Four regions of reputation, and it all fits in one doorway.', 'I do not battle for introductions. I battle for data. Show me what the record is actually made of — I will be counting what it costs you.'],
    lose: ['...Noted. The record undersells you in one column and oversells you in another. I will correct both by Veilstone.'],
    team: [
      { species: 'starly', level: 308 },
      { species: 'chimchar', level: 310 },
      { species: 'elekid', level: 312, keepsake: 'starshard' },
    ],
    reward: 1500,
  },
  paul_veilstone: {
    id: 'paul_veilstone', name: 'PAUL', title: 'Trainer from Veilstone', ai: 'smart',
    intro: ['Veilstone. My streets, my weather, my terms. Four badges since the lab — I have kept the ledger, {player}. Every entry.', 'This is not a rematch. It is an audit. Stand still for it.'],
    lose: ['...The audit says what it says. You are ahead of my projections in every column that matters, and I do not say that to anyone.', 'The lakes are next, for both of us. Whatever is coming for this region, it will not wait for either of us to be ready. Be ready anyway.'],
    team: [
      { species: 'magmar', level: 342 },
      { species: 'electabuzz', level: 344 },
      { species: 'honchkrow', level: 346 },
      { species: 'torterra', level: 348, keepsake: 'starshard' },
    ],
    reward: 3200,
  },

  // ---- Team Galactic, first half (must-win battles) ----
  mars_windworks: {
    id: 'mars_windworks', name: 'COMMANDER MARS', title: 'Team Galactic Commander', ai: 'smart',
    intro: ['Oh, a rescuer. How theatrical. I am Mars, and this facility is ours until the turbines finish their little song.', 'The keeper\'s key, the keeper\'s house, the keeper\'s silence — all purchased, darling. You are the only unpaid thing here. Let me fix that.'],
    lose: ['Tch. Fine. FINE. Take the rusty building and the grateful little man — the energy was already counted, and you cannot un-count a number.', 'Galactic keeps what matters. Remember that when the lakes come up in conversation.'],
    team: [
      { species: 'zubat', level: 314 },
      { species: 'purugly', level: 318 },
    ],
    reward: 1600,
  },
  jupiter_eterna: {
    id: 'jupiter_eterna', name: 'COMMANDER JUPITER', title: 'Team Galactic Commander', ai: 'smart',
    intro: ['A child with badges, in my building. I am Jupiter. Everything counted in these rooms belongs to a future you are not dressed for.', 'The statue, the archives, the energy ledgers — Galactic is simply tidying the region\'s past into its future. Step aside, or be tidied.'],
    lose: ['Counted wrong. I do not say that often, and I will not say it twice.', 'Take the building, then. Stone and paper. What we needed from Eterna left before you arrived — ask your professor what his oldest books are missing. The lakes, child. Watch the lakes.'],
    team: [
      { species: 'zubat', level: 326 },
      { species: 'skuntank', level: 330 },
    ],
    reward: 2400,
  },
};

export const SINNOH_EVENTS = {
  // The landing. Fires on first Sandgem entry of the Sinnoh arc (the
  // ferry + en-route card are the registry's; this is the shore).
  ev_sinnoh_arrival: [
    { chapterCard: 7 },
    { say: ['Sandgem Town. The ferry lets go of the horizon behind you, and Sinnoh takes hold in front: pine-dark hills, a wind with edges, and snow standing on the peaks like the region is thinking about winter permanently.', 'No send-off committee, no starter ceremony, no beginner\'s kit. You are not beginning anything here. You are continuing — and the mountain ahead has been continuing a great deal longer.'], who: '' },
    { say: ['Professor Rowan\'s lab stands at the north end of town — the tall windows, the taller reputation. He studies how Pokemon grow and change, and word of your crossing reached him before your ship did.', 'Twinleaf Town lies west, past Route 201 — a small town under the trees, and beyond it, a lake the old stories refuse to leave alone.'], who: '' },
    { flag: 'sinnoh_arrival' },
    { toast: 'Landed in Sinnoh — Sandgem Town.' },
  ],
  // The lab: Rowan registers a veteran; Paul takes his first measure.
  ev_sinnoh_lab: [
    { say: ['The lab is quiet the way libraries are quiet — by enforcement. PROF. ROWAN looks up from a fossil ledger, and his eyebrows conduct a brief, severe census of you.', '"Hm. The Kanto champion. The Orange voyager. The Johto and Hoenn name my colleagues keep attaching to weather events."'], who: 'PROF. ROWAN' },
    { say: ['"Understand me: I do not register beginners in this room, and I am not registering one now. Your Pokedex is a working instrument, not a schoolbook. Sinnoh\'s pages are open to it — all of them, from the lake spirits to the things the mountain keeps."', '"Walk my region carefully, trainer. It is older than the League, and it keeps its evidence in stone."'], who: 'PROF. ROWAN' },
    { flag: 'rowan_registered' },
    { say: ['The door opens on the cold. A trainer your age stands in it — cap low, hands in pockets, a gaze that has already finished measuring the room and moved on to you.', '"Paul." The professor\'s tone files the name under weather warnings. "You were told to wait outside." — "I waited. Then I came in."'], who: '' },
    { say: ['So you are the famous one. Four regions of reputation, and it all fits in one doorway.', 'I do not battle for introductions. I battle for data. Show me what the record is actually made of — I will be counting what it costs you.'], who: 'PAUL' },
    { battleAny: { trainer: 'paul_sandgem', winFlag: 'paul1_won', loseFlag: 'paul1_lost' } },
    { flag: 'paul1_done' },
    { say: ['Paul recalls his last Pokemon without a flicker, writes nothing down — you understand, watching him, that he does not need to — and walks out into the cold.', '"Veilstone," Rowan says to the closing door, the way other men say avalanche season. "His home. You will cross him again, trainer. Trainers like that are not weather. They are climate."'], who: '' },
    { toast: 'Registered with Prof. Rowan — and measured by Paul.' },
  ],
  // Lake Verity: the glimpse (no catch — S6 owns the lake trio).
  ev_sinnoh_verity: [
    { say: ['Lake Verity holds still the way held breath holds still. The water gives back the sky, the pines, your own face — and then, slow as a thought deciding to surface, a shape crosses the reflection that is in none of those things.', 'Small. Crowned. Gone. The lake is only a lake again, and your heart is doing something it has not done since a tower in Johto caught fire in the stories.', 'Whatever sleeps here felt you arrive. It did not wake. Remember that it could have.'], who: '' },
    { flag: 'verity_glimpse' },
    { toast: 'Something moved on Lake Verity...' },
  ],
  // Valley Windworks: Mars holds the keeper (must-win).
  ev_sinnoh_windworks: [
    { say: ['The Windworks floor is too quiet — turbines turning somewhere above, and not one of them answering the keeper\'s console. A small voice from the back room, first: "Papa? Is the wind back?"', 'Then the other voice, amused as a drawn blade: "The keeper is indisposed. The keeper\'s KEY is indisposed. Team Galactic is borrowing the wind, trainer — and we charge interest."'], who: '' },
    { battle: 'mars_windworks' },
    { flag: 'windworks_cleared' },
    { say: ['The locks come off the back room in a clatter of keys. The keeper hugs his daughter hard enough to lift her clean off the floor, and the turbines, one by one, remember their jobs.', '"They kept asking the console about STORMS," the keeper says, bewildered. "Schedules. Seasons. What does a wind farm know about the sky that they needed it so badly?" The road east — Eterna Forest, and Eterna City — is open, and humming.'], who: '' },
    { toast: 'The Valley Windworks are free — Mars driven off.' },
  ],
  // The Eterna building: Jupiter (must-win).
  ev_sinnoh_galactic: [
    { say: ['Inside, the Galactic building is all hush and carpet — researchers who do not look up, guards who do not blink, and on the top floor, a woman in the uniform\'s sharpest cut, reading the city\'s oldest survey charts like a menu.', '"A child with badges, in my building." She closes the chart the way a door closes. "I am Jupiter."'], who: '' },
    { battle: 'jupiter_eterna' },
    { flag: 'galactic_eterna_done' },
    { say: ['The building empties the way water leaves a tipped glass — fast, silent, and entirely rehearsed. On Jupiter\'s desk, one page stays behind: an inventory of things taken from Eterna\'s archives.', 'Statue rubbings. Meteor counts. And three words, underlined twice, in a hand that was not hurried at all: THE LAKES — FIRST. Hearthome lies south, and its ghost gym with it. The road is calling louder than the mystery, for now.'], who: '' },
    { toast: 'The Eterna building is cleared — Jupiter driven off.' },
  ],
  // Solaceon Ruins: the Defog grant (S4's HM_GRANTS hook), Platinum's
  // placement — the carved chamber keeps the HM.
  ev_sinnoh_defog: [
    { say: ['The carved chamber at the ruin\'s heart is older than the town above it, and it has been waiting with the patience of cut stone. On the altar slab, where the fog-light falls: a disc, League-sealed, humming faintly with a field craft.', 'The inscription beneath it is short, and entirely without mystery: FOR THE ROADS THAT HIDE THEMSELVES.'], who: '' },
    { giveHM: 'defog' },
    { flag: 'defog_received' },
    { say: ['Defog — the art of beating a white wall into weather. The Fen Badge, from Pastoria in the marsh country, is what licenses it on the fog roads; the ruins keep the knowledge itself.', 'Veilstone lies north-east, past the lost tower and the long grass. The fog will be waiting there to be argued with.'], who: '' },
    { toast: 'Claimed HM06 — Defog — from the Solaceon Ruins.' },
  ],
};

// ---- Town Tales (ADR-025 §5): one per first-half settlement, in the
// JOHTO_TALES/HOENN_TALES data-driven idiom (offerLines / stageLines /
// finishLines + reward). Six of the nine pay this half's new keepsakes.
function sinnohTale(id, title, town, giver, stages, reward, rewardText, offerLines, stageLines, finishLines) {
  return { id, title, town, giver, stages, reward, rewardText, sinnohTale: true, offerLines, stageLines, finishLines };
}
export const SINNOH_TALES = {
  tale_sinnoh_twinleaf: sinnohTale('tale_sinnoh_twinleaf', 'The Ribbon in the Drawer', 'Twinleaf Town', 'MOM’S NEIGHBOR ASHA',
    ['Ask young Tam by the pond about the ribbon box', 'Carry the word back to Asha'],
    { keepsake: 'dawnribbon' }, 'Dawn Ribbon',
    ['You have Dawn\'s look about you — no, her ROAD. She left this town with a ribbon case and a head full of stages, and her mother keeps the drawer she grew out of.', 'Her first ribbon box is still in it, and young Tam has been asking what a beginning looks like. Tell him, would you? Describe a first stage to a boy who has only seen the pond. Then come and tell me what he said.'],
    ['A ribbon box? From before DAWN? ...Beginnings look small, don\'t they. Hers did too, once. That is — that is actually the whole secret, isn\'t it. Thank you. Tell Asha the pond approves.'],
    ['"The pond approves." Ha! That boy has been ready for a road for a year; he only needed the size of a beginning confirmed.', 'Take this — the Dawn Ribbon, from her very first case. She sent it home with instructions: give it to someone whose road is still teaching them things. That is you, I think, champion or not.']),
  tale_sinnoh_sandgem: sinnohTale('tale_sinnoh_sandgem', 'Notes for the Professor', 'Sandgem Town', 'LAB AIDE FERN',
    ['Ask Ana on the beach about the washed-up notebook', 'Return the word to Fern at the lab door'],
    { keepsake: 'starshard' }, 'Star Shard',
    ['One of the Professor\'s field notebooks went overboard on the Jubilife crossing, and Ana the beachcomber swears the tide returned SOMETHING with writing in it.', 'Ask her what the water gave back. If it is his, the Professor will never admit he wants it. He has asked about the tide tables four times today.'],
    ['Oh, the tide gives back everything eventually — it is a gossip. A notebook, yes: swollen, sealed in a fisherman\'s oilskin, and inside — star charts. Hand-drawn. Somebody on that boat studies the sky the way sailors study weather: like it owes them money. Not the Professor\'s, love. Older hand than his.'],
    ['Star charts, in an older hand... Then it is from the Professor\'s own teacher\'s generation — the lab keeps a shelf for exactly this and admits it to no one.', 'For the errand: a Star Shard, out of the lab\'s specimen drawer. It fell before either of us was born and it still cuts starlight. The Professor pretends not to keep treasures. He keeps them in drawers, like everyone.']),
  tale_sinnoh_jubilife: sinnohTale('tale_sinnoh_jubilife', 'The Intern\'s Scoop', 'Jubilife City', 'BROADCAST INTERN VESK',
    ['Ask Moss in the plaza what the cameras missed', 'Bring the quote back to Vesk'],
    { items: { superpotion: 2 } }, '2 Super Potions',
    ['I am THIS close to a staff job, and my segment is "the city, unscripted" — except the city keeps scripting itself whenever my camera is off.', 'Moss in the plaza saw the thing with the meteor-logo people and the TV station steps. Get me the quote, trainer. A real one. My editor can smell invented quotes through walls.'],
    ['The logo people? Sure, I saw them. Polite as bankers, asking the station about BROADCAST RANGES and old signal towers, then photographing the skyline like they were measuring it for a frame. Weirdest part? They bowed to the building when they left. Like it was already theirs. Quote me exactly, I dare you.'],
    ['"Like it was already theirs." — that is a quote with TEETH. The segment leads with it, and the staff job has my name in pencil by Friday.', 'Two Super Potions from the station\'s first-aid sponsorship. Off the record: watch the sky with those people, trainer. Nobody measures a skyline they do not intend to keep.']),
  tale_sinnoh_oreburgh: sinnohTale('tale_sinnoh_oreburgh', 'The Miner\'s Lunchbox', 'Oreburgh City', 'MINER BRAM',
    ['Ask Sol at the museum about the sealed seam', 'Carry the word back to Bram at the pit gate'],
    { keepsake: 'coalseamcharm' }, 'Coal Seam Charm',
    ['Thirty years I have dug this mountain, and last week the seam gave us a lunchbox. Sealed in coal dust since before the gym was built, with a name scratched on it none of the old crew can read.', 'Sol at the museum reads old hands for a living. Ask her whose lunchbox the mountain kept. A man should know whose shift he is finishing.'],
    ['The name? Oh, I can read it — it is in the old pit shorthand, where every miner signed with his seam-mark. This one belonged to the FIRST foreman of Oreburgh, the man who sank the original shaft. The box held a charm, trainer, for the man who would one day dig deepest. He left it as a wager with the mountain.'],
    ['The first foreman. Then the mountain has been holding a wager for a hundred years, and last week it paid out to MY shift.', 'The charm is yours — the Coal Seam Charm, by the foreman\'s own wager: it belongs to whoever digs deepest, and today that is a trainer who dug up the truth of it. Wear it low, where the seams run.']),
  tale_sinnoh_eterna: sinnohTale('tale_sinnoh_eterna', 'The Statue\'s Shadow', 'Eterna City', 'HISTORIAN ILSE',
    ['Ask the statue keeper what the shadow points at', 'Return the reading to Ilse'],
    { keepsake: 'meadowcord' }, 'Meadow Cord',
    ['The great statue in our square is older than the city, and at noon its shadow points at something the plaza stones were cut to hide. I have measured it for years. I am too old to go prying at paving.', 'The keeper knows the hour and the mark. Ask him what the shadow touches, trainer, and I will finally finish a footnote I have been writing for a decade.'],
    ['At noon? The shadow\'s hand rests on the third stone from the fountain — the one with the cord-marks, where the festival dancers used to tie the meadow cords. My grandfather swore the statue was built as a sundial for a festival nobody remembers. The mark is real, scholar\'s honor. I sweep around it.'],
    ['A sundial for a forgotten festival — the footnote is finished, and it is a chapter. Eterna was celebrating this valley before it was ever a city.', 'The Meadow Cord is yours — the keeper\'s family has held the festival cords for six generations, and this one, he says, wants a road instead of a drawer. It smells of grass. Everything true here does.']),
  tale_sinnoh_hearthome: sinnohTale('tale_sinnoh_hearthome', 'Auntie\'s Poffin Tin', 'Hearthome City', 'CONTEST AUNTIE ROSA',
    ['Ask Masa at the poffin house about the lost tin', 'Bring the word back to Rosa by the hall'],
    { keepsake: 'ribbonclasp' }, 'Ribbon Clasp',
    ['Forty years my poffins have fed this city\'s contestants, and my GRANDMOTHER\'S tin — the one with the clasp like a ribbon — has walked out of my kitchen.', 'Masa at the poffin house was the last to borrow it. Ask her where my tin has gone, and do not accept "the oven ate it." Ovens in Hearthome are professionals.'],
    ['The tin? Oh, stars, I have been carrying it in my apron for a WEEK, meaning to return it and fearing the scolding more each day. It is safe, it is polished, and the delay is entirely cowardice. Tell her... tell her the poffins this week were her recipe, and the hall noticed.'],
    ['A week in an apron, and my recipe carrying the hall. That girl is my successor and my punishment in one apron.', 'The Ribbon Clasp, then — off my own first contest case. You have ferried one cook\'s courage today, trainer. The clasp goes to a road that still has stages on it.']),
  tale_sinnoh_solaceon: sinnohTale('tale_sinnoh_solaceon', 'The Day-Care Egg Ledger', 'Solaceon Town', 'DAY CARE LADY UNA',
    ['Ask Ossa the ruin delver about the ledger stone', 'Return the reading to Una'],
    { keepsake: 'ruinbell' }, 'Ruin Bell',
    ['Our day-care keeps an egg ledger older than the town — every egg, every family, in my grandmother\'s hand. The first page refers to a "ledger stone" in the ruins, and I have never dared the dark to read it.', 'Ossa delves those halls weekly and fears nothing with a roof on it. Ask her what the stone says. A ledger should know its own first page.'],
    ['The ledger stone? Read it years ago, in torchlight, with the Unown watching like examiners. It says the ruins were a day-care FIRST — a place where the old people raised young Pokemon among the stones, and the bells they used to call them home are still down there. One hangs by the carved chamber. It rings for whoever the ruins approve of.'],
    ['A day-care, before it was a ruin. Then my grandmother\'s ledger is a thousand pages long and most of them are stone. I shall copy that into the front, in my best hand.', 'And the bell approves of errands, it seems — the Ruin Bell is yours. Ossa brought it up this morning without a word, which from Ossa is a speech. It rings quiet. The ruins prefer it so.']),
  tale_sinnoh_veilstone: sinnohTale('tale_sinnoh_veilstone', 'The Clerk\'s Meteor', 'Veilstone City', 'DEPT CLERK VEE',
    ['Ask the meteor watcher about the fallen stone', 'Bring the word back to Vee at the store'],
    { items: { hyperpotion: 1 } }, 'Hyper Potion',
    ['Everyone shops here for the meteor story, nobody for the truth of it: a stone fell east of the city in my grandfather\'s time, and a watcher still keeps its crater like a garden.', 'Ask him what the stone actually is. My break is in ten minutes and I have wondered for six years. Six years, trainer. Put a price on THAT.'],
    ['What is it? A stone that fell out of a clear sky in my grandfather\'s spring, hit soft, and has been faintly WARM ever since — and things that orbit it in the stories are only stories. The truth is better: it dreams, trainer. Instruments hear it. A slow beat, like a heart that has not decided to wake. I keep the grass off it. That is the whole priesthood.'],
    ['"A heart that has not decided to wake." Six years of wondering, and the answer was worth every shift of it.', 'A Hyper Potion, from the store\'s own shelf, charged to my curiosity account. If that stone ever does decide, trainer — I hope it decides on a day you are in Veilstone.']),
  tale_sinnoh_floaroma: sinnohTale('tale_sinnoh_floaroma', 'Honey for the Road', 'Floaroma Town', 'FLORIST WREN',
    ['Ask Orin the beekeeper about the meadow\'s slow spring', 'Carry the word back to Wren'],
    { items: { fullheal: 2 } }, '2 Full Heals',
    ['The meadow is late this year — the flowers are holding their breath, and a florist notices breath. My beds are fine. It is the WILD meadow that is slow.', 'Orin\'s bees read the meadow better than any instrument in Jubilife. Ask him what the bees are waiting for. If it is the wind-works\' trouble, I want to know before the wind does.'],
    ['The bees are waiting on the wind, love — the works went quiet for days and the whole valley\'s air forgot its directions. Bees navigate by a map written in moving air. It is redrawn now, and the meadow will open within the week. Tell Wren the spring was delayed, not cancelled. Bees are never wrong about spring. Only early, or honest.'],
    ['Delayed, not cancelled. I shall put that on the shop sign and charge the season for the wisdom.', 'Two Full Heals, from the shop\'s road-stock — Floaroma pays its messengers in remedies and flowers, and the flowers, as established, are late.']),
};

export const SINNOH_NPCS = [
  // Rowan, in his lab (his event is the entry scene; this is the man).
  { map: 'rowan-lab', name: 'PROF. ROWAN', x: 8, y: 3, dir: 'down', art: 'scientist', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#c0c0c0', sinnoh: 'rowan', dialogue: ['Walk my region carefully, trainer. It is older than the League, and it keeps its evidence in stone.'] },
  // Dawn, at home in Twinleaf.
  { map: 'twinleaf', name: 'DAWN', x: 12, y: 10, dir: 'down', art: 'lass', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', sinnoh: 'dawn_twinleaf', dialogue: ['Twinleaf is home — the pond, the pines, Mom\'s cooking in the evening. Every road I have starts here.'] },
  // Barry, in Jubilife, at speed.
  { map: 'jubilife', name: 'BARRY', x: 13, y: 10, dir: 'left', art: 'kid', skin: '#f0c8a0', shirt: '#e8a818', pants: '#4a3a2a', hair: '#2a1a0a', sinnoh: 'barry', dialogue: ['No time! No time at all! The gym road is THAT way and I am already behind myself!'] },
  // The commanders, holding their floors (their battles are events).
  { map: 'valley-windworks', name: 'COMMANDER MARS', x: 8, y: 3, dir: 'down', art: 'rocket', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a2a3a', hair: '#8a2a4a', sinnoh: 'mars', dialogue: ['The wind is ours until it finishes singing, darling.'] },
  { map: 'galactic-eterna', name: 'COMMANDER JUPITER', x: 8, y: 3, dir: 'down', art: 'rocket', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a2a3a', hair: '#8a2a4a', sinnoh: 'jupiter', dialogue: ['Everything in these rooms is already counted, child. Including you.'] },
  { map: 'galactic-hq', name: 'COMMANDER SATURN', x: 9, y: 3, dir: 'down', art: 'rocket', skin: '#e8b888', shirt: '#3a3a4a', pants: '#2a2a3a', hair: '#2a2a4a', sinnoh: 'saturn', dialogue: ['This facility is not a destination, trainer. It is a door, and doors here open inward only.'] },
  // Paul, distributed on the spine.
  { map: 'eterna', name: 'PAUL', x: 19, y: 10, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_eterna', dialogue: ['Still walking. Noted.'] },
  { map: 'hearthome', name: 'PAUL', x: 20, y: 9, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_hearthome', dialogue: ['...'] },
  { map: 'veilstone', name: 'PAUL', x: 21, y: 9, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_veilstone', dialogue: ['Veilstone. My streets. You know why you are here.'] },
  // Reggie, the Veilstone breeder (an original analogue, not the anime's).
  { map: 'veilstone', name: 'REGGIE', x: 24, y: 13, dir: 'down', art: 'gent', skin: '#e8b888', shirt: '#4a5a4a', pants: '#2a2a3a', hair: '#6a6a6a', sinnoh: 'reggie', dialogue: ['I raise Pokemon the slow way, trainer — the way that takes the whole of a life and calls it quick.'] },
  // Dawn again, at her first Super Contest (the hall is NPC-free S3a;
  // she is this stage's one authored addition there).
  { map: 'contest-hearthome', name: 'DAWN', x: 5, y: 7, dir: 'right', art: 'lass', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', sinnoh: 'dawn_contest', dialogue: ['Deep breath. Stage lights. Okay. OKAY. Watch me, {player}.'] },
  // The leaders, at their gyms' hearts (Hoenn's (7,2) idiom).
  { map: 'gym-oreburgh', name: 'ROARK', x: 7, y: 2, dir: 'down', art: 'gym1', skin: '#e8b888', shirt: '#8a6a3a', pants: '#2a2a3a', hair: '#5a3a2a', sinnoh: 'roark', dialogue: ['Welcome to Oreburgh Gym. Records are strata, trainer — show me the present tense.'] },
  { map: 'gym-eterna', name: 'GARDENIA', x: 7, y: 2, dir: 'down', art: 'gym2', skin: '#f0c8a0', shirt: '#3a7a4a', pants: '#2a2a3a', hair: '#2a4a2a', sinnoh: 'gardenia', dialogue: ['Everything in this gym grows, challenger, including the difficulty.'] },
  { map: 'gym-hearthome', name: 'FANTINA', x: 7, y: 2, dir: 'down', art: 'gym3', skin: '#f0c8a0', shirt: '#6a3a8a', pants: '#2a2a3a', hair: '#c0a0d8', sinnoh: 'fantina', dialogue: ['A battle is an appeal performed at speed, darling. Show me your grace.'] },
  { map: 'gym-veilstone', name: 'MAYLENE', x: 7, y: 2, dir: 'down', art: 'gym4', skin: '#f0c8a0', shirt: '#c85a3a', pants: '#2a2a3a', hair: '#8a3a5a', sinnoh: 'maylene', dialogue: ['No speeches in this gym. Stance up.'] },
  // Gym rosters (base trainer path: `trainer:` + beaten-flag dialogue).
  { map: 'gym-oreburgh', name: 'MINER COLE', x: 4, y: 5, dir: 'right', art: 'hiker', skin: '#e8b888', shirt: '#7a5a3a', pants: '#4a3a2a', hair: '#3a2a1a', trainer: 'roark_miner1', dialogue: ['Stubborn met stubborn. Roark is at the back, past the seam.'] },
  { map: 'gym-oreburgh', name: 'MINER FENN', x: 11, y: 5, dir: 'left', art: 'hiker', skin: '#e8b888', shirt: '#7a5a3a', pants: '#4a3a2a', hair: '#3a2a1a', trainer: 'roark_miner2', dialogue: ['The museum upstairs sells my fossils now. Fame is a drafty thing.'] },
  { map: 'gym-eterna', name: 'AROMA ADEPT LIA', x: 4, y: 5, dir: 'right', art: 'lass', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', trainer: 'gardenia_adept1', dialogue: ['Watered, weeded, and beaten. The greenhouse door at the back is hers.'] },
  { map: 'gym-eterna', name: 'AROMA ADEPT ROSALIE', x: 11, y: 5, dir: 'left', art: 'lady', skin: '#f0c8a0', shirt: '#c83a7a', pants: '#2a2a3a', hair: '#8a2a1a', trainer: 'gardenia_adept2', dialogue: ['Everything blooms on schedule here. Even rematches. Ask another day.'] },
  { map: 'gym-hearthome', name: 'ACE TRAINER VERE', x: 4, y: 5, dir: 'right', art: 'acetrainer', skin: '#f0c8a0', shirt: '#3a3a6a', pants: '#2a2a3a', hair: '#4a2a3a', trainer: 'fantina_ace1', dialogue: ['Rehearsal concluded. The performance is through the curtain.'] },
  { map: 'gym-hearthome', name: 'ACE TRAINER MIRA', x: 11, y: 5, dir: 'left', art: 'acetrainer', skin: '#f0c8a0', shirt: '#3a3a6a', pants: '#2a2a3a', hair: '#4a2a3a', trainer: 'fantina_ace2', dialogue: ['And — scene. Hers is the stage at the back.'] },
  { map: 'gym-veilstone', name: 'BLACK BELT JON', x: 4, y: 5, dir: 'right', art: 'blackbelt', skin: '#e8b888', shirt: '#e8e8e8', pants: '#2a2a3a', hair: '#1a1a1a', trainer: 'maylene_belt1', dialogue: ['Tested, and passed. She is at the back. Yours cannot wait.'] },
  { map: 'gym-veilstone', name: 'BLACK BELT RUE', x: 11, y: 5, dir: 'left', art: 'blackbelt', skin: '#e8b888', shirt: '#e8e8e8', pants: '#2a2a3a', hair: '#1a1a1a', trainer: 'maylene_belt2', dialogue: ['Two years of mornings. Her Lucario has been listening. It always is.'] },
];

// Tale actors among the maps9 townsfolk (giver/stage roles keyed by
// the NPC's map + name, the HOENN_NPC_PATCHES idiom).
export const SINNOH_NPC_PATCHES = {
  twinleaf: {
    'MOM’S NEIGHBOR ASHA': { tale: 'tale_sinnoh_twinleaf', role: 'giver' },
    'YOUNGSTER TAM': { tale: 'tale_sinnoh_twinleaf', role: 'stage' },
  },
  sandgem: {
    'LAB AIDE FERN': { tale: 'tale_sinnoh_sandgem', role: 'giver' },
    'BEACHCOMBER ANA': { tale: 'tale_sinnoh_sandgem', role: 'stage' },
  },
  jubilife: {
    'BROADCAST INTERN VESK': { tale: 'tale_sinnoh_jubilife', role: 'giver' },
    'CITY KID MOSS': { tale: 'tale_sinnoh_jubilife', role: 'stage' },
  },
  oreburgh: {
    'MINER BRAM': { tale: 'tale_sinnoh_oreburgh', role: 'giver' },
    'MUSEUM GUIDE SOL': { tale: 'tale_sinnoh_oreburgh', role: 'stage' },
  },
  floaroma: {
    'FLORIST WREN': { tale: 'tale_sinnoh_floaroma', role: 'giver' },
    'BEEKEEPER ORIN': { tale: 'tale_sinnoh_floaroma', role: 'stage' },
  },
  eterna: {
    'HISTORIAN ILSE': { tale: 'tale_sinnoh_eterna', role: 'giver' },
    'STATUE KEEPER SOL': { tale: 'tale_sinnoh_eterna', role: 'stage' },
  },
  hearthome: {
    'CONTEST AUNTIE ROSA': { tale: 'tale_sinnoh_hearthome', role: 'giver' },
    'POFFIN COOK MASA': { tale: 'tale_sinnoh_hearthome', role: 'stage' },
  },
  solaceon: {
    'DAY CARE LADY UNA': { tale: 'tale_sinnoh_solaceon', role: 'giver' },
    'RUIN DELVER OSSA': { tale: 'tale_sinnoh_solaceon', role: 'stage' },
  },
  veilstone: {
    'DEPT CLERK VEE': { tale: 'tale_sinnoh_veilstone', role: 'giver' },
    'METEOR WATCHER SOL': { tale: 'tale_sinnoh_veilstone', role: 'stage' },
  },
};
