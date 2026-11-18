// story-sinnoh.mjs — Arc 4 Stage S5a: the Borea story, FIRST HALF
// (arrival -> gyms 1-4 -> Shardfall). Platinum governs; the anime is
// the primary canon (ADR-015); every line below is original writing —
// no borrowed dialogue. The second half (Lake Gallant onward, the lakes,
// Coronet, Zenith Spire, gyms 5-8, the League) is Stage S5b's, and it
// APPENDS to this file's chain the way H4b appended to H4a's.
//
// Shape notes (the H4a idiom, mirrored):
//  - SINNOH_QUESTS: the arc chain in the MAIN_QUESTS idiom. Each row's
//    flag is the flag its beat SETS on completion; the Quest Log's
//    Borea section and the HUD objective read the first unset flag.
//  - The registry row (data/arcs.mjs) already carries the embark /
//    arrival / en-route text; the homecoming machine consumed it at
//    S0. This file writes the story that happens AFTER the landing:
//    no new-starter fiction, no team reset — the player is Ash, an
//    established champion-tier trainer travelling at full strength
//    (Amendment 1), and Rowan registers a veteran, not a beginner.
//  - The badge-prefix leader law is the GENERIC path: the leaders'
//    trainer defs carry badgeSet:'sinnoh' + badge, so winTrainer
//    awards badges.sinnoh in BADGE_SETS order, and the overworld
//    refusal in runSinnohNpc reads badges.sinnoh (the Yamato/Maris
//    generic path).
//  - PAUL is the rival spine: an intro battle at the lab (~312), a
//    cold assessment at Heritage, the SIMMER beat at Inglenook, and a
//    harder battle on his home turf at Shardfall (~348). BARRY is the
//    secondary rival — frantic, fine-obsessed, original writing.
//  - Team Galactic, first half: a glimpse at Lake Candor, pressure in
//    Revelry, Mars at the Valley Galeworks, Jupiter in the Heritage
//    building, Saturn holding the Shardfall HQ's door. PACING CALL
//    (recorded in the register): the full Shardfall HQ raid is S5b's
//    — the anime spreads the HQ across the arc, and S5a's Saturn is
//    presence + a locked door, not a raid.
//  - TMs: H4a added NO Gen-3 TM rows (TM_MOVES is still the Gen-1 50),
//    so S5a adds NO Gen-4 TM rows either — mirrored exactly, named
//    here so S5b inherits the same answer.

export const SINNOH_QUESTS = [
  { id: 'q_sinnoh_arrival', text: 'Sail to Borea — land at Shingle Town', hint: 'The ferry from Arcport docks at Shingle, under the mountain. A new region, an old cold, and a professor who measures trainers the way winter measures roofs.', flag: 'sinnoh_arrival' },
  { id: 'q_sinnoh_lab', text: "Report to Professor Sorrel's lab in Shingle", hint: 'Sorrel studies how Kin change and grow. He has questions for a trainer of your record — and, it turns out, another visitor with questions of his own.', flag: 'rowan_registered' },
  { id: 'q_sinnoh_paul1', text: "The cold-eyed trainer: take Stellan's measure at the lab", hint: 'Stellan battles the way an auditor reads a ledger: everything counted, nothing forgiven. Whatever the result, he will file you under a number. Prove the number wrong later.', flag: 'paul1_done' },
  { id: 'q_sinnoh_verity', text: 'Lake Candor — something moved on the water', hint: 'West of Clover, the lake sits still as glass. Old stories say a spirit of emotion sleeps beneath it. Stand on the shore a while. Watch.', flag: 'verity_glimpse' },
  { id: 'q_sinnoh_roark', text: 'Coalseam Gym — challenge Ronan for the Coal Badge', hint: 'East through the mines to Coalseam. Ronan digs up fossils and challengers with the same care, and his RAMOSAUR has opinions about both.', flag: 'badge_coal' },
  { id: 'q_sinnoh_windworks', text: 'Valley Galeworks — break the lock-in', hint: 'North of Honeyfield, the wind turbines have stopped answering their keeper. A red-suited crew calling itself the Combine is holding the works — and a hostage.', flag: 'windworks_cleared' },
  { id: 'q_sinnoh_gardenia', text: 'Heritage Gym — challenge Tansy for the Forest Badge', hint: 'Through Heritage Forest to the city of old stones. Tansy grows her gym like a garden and fights like weather over one.', flag: 'badge_forest' },
  { id: 'q_sinnoh_galactic', text: 'Heritage City — look into the Combine building', hint: 'The tower with the meteor logo, the hushed lobby, the guards who smile like locks. Whatever the Astral Combine is counting in there, it is worth counting out loud.', flag: 'galactic_eterna_done' },
  { id: 'q_sinnoh_fantina', text: 'Inglenook Gym — challenge Odile for the Relic Badge', hint: 'South to Inglenook, the city of contests and ghosts. Odile judges a battle the way she judges an appeal: grace first, then everything else at once.', flag: 'badge_relic' },
  { id: 'q_sinnoh_dawn', text: "Inglenook's Super Contest Hall — Dara's first stage", hint: 'Dara has been rehearsing in her head since Clover. Her first Super Contest is at Inglenook. Be in the seats. Bring your loudest polite applause.', flag: 'dawn_hearthome_done' },
  { id: 'q_sinnoh_chimchar', text: 'The little fire Stellan left behind', hint: 'Stellan discards what does not win. In Inglenook, what he discarded is standing in the road with its flame lit, waiting to see whose road it is now.', flag: 'chimchar_beat_done' },
  { id: 'q_sinnoh_defog', text: 'Repose Ruins — claim the mist-clearing HM', hint: 'East of Inglenook, the fog roads begin. Deep in the Repose Ruins sleeps the old HM the League entrusted to the stones: Defog. The chamber keeps it still.', flag: 'defog_received' },
  { id: 'q_sinnoh_maylene', text: 'Shardfall Gym — challenge Maren for the Cobble Badge', hint: 'Shardfall: department stores, meteor craters, and a gym leader who trains before dawn and apologizes to no one. Maren fights bare-knuckle honest.', flag: 'badge_cobble' },
  { id: 'q_sinnoh_paul2', text: "Shardfall — Stellan's home turf: settle the measure again", hint: 'Stellan is from Shardfall. Here, the ledger he keeps on you gets audited — by him, at full strength, in front of his own streets. Bring everything the first four badges taught you.', flag: 'paul_veilstone_done' },
  // ---- Stage S5b: the second half (appended the way H4b appended) ----
  { id: 'q_sinnoh_wake', text: 'Fenland Gym — challenge Breaker Braddock for the Fen Badge', hint: 'South through the marsh roads to Fenland. Wake is a showman with a wrestler\'s heart and a TIDESEL that hits like weather.', flag: 'badge_fen' },
  { id: 'q_sinnoh_valor', text: 'Lake Gallant — what the explosion left', hint: 'Something has happened at Lake Gallant — smoke on the water, and the lake sitting wrong in its banks. Go and see it with your own eyes.', flag: 'valor_glimpse' },
  { id: 'q_sinnoh_hq', text: 'Shardfall — raid the Shardfall HQ', hint: 'Sorin\'s door has kept you out long enough. Whatever the Astral Combine counted in Heritage and at the Windworks is counted HERE. Go through the door.', flag: 'galactic_hq_done' },
  { id: 'q_sinnoh_byron', text: 'Bridgeport Gym — challenge Doran for the Mine Badge', hint: 'West across the water to Bridgeport, the port of iron. Doran digs deeper than his son and hits harder than the mountain — a steel gym run like a mine face.', flag: 'badge_mine' },
  { id: 'q_sinnoh_darkrai', text: 'Bridgeport — the sailor\'s son who cannot wake', hint: 'A sailor in Bridgeport has a boy who sleeps and sleeps, dreaming of a dark shape over the bed. Sailors say the cure grows where the moon is always full.', flag: 'darkrai_beat_done' },
  { id: 'q_sinnoh_candice', text: 'Rimefall Gym — challenge Neve for the Icicle Badge', hint: 'Far north, past the snow routes, Rimefall keeps the coldest gym in Borea. Neve teaches there — bright, precise, unbothered by the temperature.', flag: 'badge_icicle' },
  { id: 'q_sinnoh_acuity', text: 'Lake Insight — Stellan, at full strength', hint: 'Stellan is waiting at Lake Insight: a full battle, six against six, on the frozen shore. Whatever it decides, it decides something real.', flag: 'paul_acuity_done' },
  { id: 'q_sinnoh_rockclimb', text: 'Route 217 — the HM in the snow', hint: 'Somewhere on the white road, a traveller lost a League-sealed disc in the drifts: Rock Climb. Look where the drifts pile deepest.', flag: 'rockclimb_received' },
  { id: 'q_sinnoh_volkner', text: 'Brightshore Gym — challenge Rainer for the Beacon Badge', hint: 'The last badge, in the city of sun and panels. Rainer is Borea\'s strongest leader and its most bored — give him a battle worth the lights.', flag: 'badge_beacon' },
  { id: 'q_sinnoh_festival', text: "Lake Gallant — Dara's Grand Festival", hint: 'The Grand Festival is staged on Lake Gallant\'s shore — the biggest stage a coordinator can stand on. Be there when Dara\'s road arrives.', flag: 'dawn_grand_festival_done' },
  { id: 'q_sinnoh_coronet', text: 'Mt. Apex — climb to the summit', hint: 'The Combine is moving on the mountain, all of it at once, toward the pillars at the top of the world. Do not let Severin arrive first.', flag: 'coronet_climb_done' },
  { id: 'q_sinnoh_spear', text: 'Zenith Spire — the chained gods', hint: 'At the summit, the pillars wait where the world was first spoken to. Severin intends to speak back — with CHRONARCH and COSMARCH in red chains. End it there.', flag: 'spear_pillar_done' },
  { id: 'q_sinnoh_distortion', text: 'The Mirrorworld — answer the third god', hint: 'The sky tore, and the tear is a door. Beyond it: a world poured wrong, and the god who was banished to it watching you climb toward its platform. Go and finish what the chains began.', flag: 'sinnoh_climax_resolved' },
  { id: 'q_sinnoh_conference', text: 'Register for the Lily of the Valley Conference', hint: 'Eight badges and a mended sky open the league hall on the island north-east. The registrar keeps the bracket; old scores wait inside it.', flag: 'sinnoh_conference_registered' },
  { id: 'q_sinnoh_paul_final', text: 'The Conference quarter-final — settle it with Stellan', hint: 'The bracket has put Stellan in front of you with everything on the table. Settle the rivalry at full strength, in front of everyone.', flag: 'paul_conference_done' },
  { id: 'q_sinnoh_tobias', flag: 'sinnoh_complete', text: 'The Conference semi-final — the darkest trainer', hint: 'Past Stellan stands a trainer no one has beaten — a man whose NOCTARCH has ended every run it has faced. History is watching this one. So is everyone you have ever beaten. Face him.' },
];

export const SINNOH_TRAINERS = {
  // ---- the four leaders (badgeSet 'sinnoh': the generic award) ----
  roark: {
    id: 'roark', name: 'RONAN', title: 'Coalseam Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Welcome to Coalseam Gym. I am Ronan — I dig fossils out of this mountain and challengers out of their overconfidence, and I am careful with both.', 'Your record says you have crossed four regions. Records are strata, trainer: impressive, and entirely in the past. Show me the present tense.'],
    lose: ['Struck clean through. No — do not apologize to the rock. The rock respects it.', 'The Coal Badge is yours. Wear it like a seam of something valuable: under everything, holding the rest up.'],
    team: [
      { species: 'geodude', level: 308 },
      { species: 'onix', level: 310 },
      { species: 'cranidos', level: 312, keepsake: 'coalseamcharm' },
    ],
    reward: 1800, badge: 'coalbadge',
  },
  gardenia: {
    id: 'gardenia', name: 'TANSY', title: 'Heritage Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['You came through my forest — I can smell the green on you. I am Tansy. Everything in this gym grows, challenger, including the difficulty.', 'Grass does not hurry, and it does not stop. That is the whole strategy. Try to keep up with something that patient.'],
    lose: ['Pruned — cleanly, and by an expert hand. I almost enjoyed that. Almost.', 'The Forest Badge, then. It suits a trainer who walks through green places carefully. The road east is older than this city, and stranger. Mind the tower with the meteor on it.'],
    team: [
      { species: 'cherubi', level: 318 },
      { species: 'turtwig', level: 320 },
      { species: 'roserade', level: 322, keepsake: 'meadowcord' },
    ],
    reward: 2200, badge: 'forestbadge',
  },
  fantina: {
    id: 'fantina', name: 'ODILE', title: 'Inglenook Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Oh-ho! A challenger with a famous silhouette. I am Odile — I judge contests, I raise ghosts, and I adore an entrance.', 'A battle is an appeal performed at speed, darling. Show me your grace. Then show me everything underneath it.'],
    lose: ['Breathtaking! Defeated, and applauding — a judge knows a winning performance when it sweeps her own stage.', 'The Relic Badge is yours. Somewhere east, the fog is sitting on the road like a critic. The ruins at Repose keep the remedy, if the stones are feeling generous.'],
    team: [
      { species: 'duskull', level: 328 },
      { species: 'haunter', level: 330 },
      { species: 'mismagius', level: 332, keepsake: 'spectrebell' },
    ],
    reward: 2600, badge: 'relicbadge',
  },
  maylene: {
    id: 'maylene', name: 'MAREN', title: 'Shardfall Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['I am Maren. I trained at dawn, I will train at dusk, and in between I take challengers apart to see how they are built.', 'No speeches in this gym. Your team\'s stance says everything about you already. Let me read it properly — with my fists.'],
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
    id: 'roark_miner1', name: 'MINER COLE', title: 'Coalseam Gym Trainer', ai: 'smart',
    intro: ['Ronan lets us spar challengers first — says it warms the rock up. Mind the little ones; the mountain breeds them stubborn.'],
    lose: ['Stubborn met stubborn, and mine blinked first. Ronan is at the back, past the seam. Mind RAMOSAUR — it headbutts greetings.'],
    team: [{ species: 'geodude', level: 304 }, { species: 'onix', level: 306 }], reward: 500,
  },
  roark_miner2: {
    id: 'roark_miner2', name: 'MINER FENN', title: 'Coalseam Gym Trainer', ai: 'smart',
    intro: ['Every fossil in the museum upstairs slept a million years to be looked at. My team slept in a mine. Similar attitudes.'],
    lose: ['A million years of practice, beaten by a Tuesday. The leader is yours to face, trainer.'],
    team: [{ species: 'geodude', level: 305 }, { species: 'graveler', level: 307 }], reward: 550,
  },
  gardenia_adept1: {
    id: 'gardenia_adept1', name: 'AROMA ADEPT LIA', title: 'Heritage Gym Trainer', ai: 'smart',
    intro: ['Tansy waters us twice a day and challengers once. You are just in time for your watering.'],
    lose: ['Watered, weeded, and beaten. The greenhouse door at the back is hers. Bring sun.'],
    team: [{ species: 'cherubi', level: 316 }, { species: 'budew', level: 317 }], reward: 600,
  },
  gardenia_adept2: {
    id: 'gardenia_adept2', name: 'AROMA ADEPT ROSALIE', title: 'Heritage Gym Trainer', ai: 'smart',
    intro: ['Everything here blooms on schedule. Challengers are the only weeds we tolerate, and only briefly.'],
    lose: ['Brief, was it? I shall compost that opinion. Tansy waits among the tall flowers.'],
    team: [{ species: 'roselia', level: 319 }, { species: 'turtwig', level: 318 }], reward: 650,
  },
  fantina_ace1: {
    id: 'fantina_ace1', name: 'ACE TRAINER VERE', title: 'Inglenook Gym Trainer', ai: 'smart',
    intro: ['Madame Odile insists we rehearse challengers before the performance. I am the rehearsal. The ghosts are the easy part.'],
    lose: ['Rehearsal concluded — to the challenger. The performance is through the curtain. She has been watching, by the way. She always watches.'],
    team: [{ species: 'drifloon', level: 326 }, { species: 'gastly', level: 327 }], reward: 700,
  },
  fantina_ace2: {
    id: 'fantina_ace2', name: 'ACE TRAINER MIRA', title: 'Inglenook Gym Trainer', ai: 'smart',
    intro: ['In this gym we bow before we battle. It is the last polite thing that happens.'],
    lose: ['And — scene. Take your bow, challenger. Hers is the stage at the back, and she does not share it.'],
    team: [{ species: 'haunter', level: 329 }, { species: 'misdreavus', level: 330 }], reward: 750,
  },
  maylene_belt1: {
    id: 'maylene_belt1', name: 'BLACK BELT JON', title: 'Shardfall Gym Trainer', ai: 'smart',
    intro: ['Maren\'s rule: nobody reaches her untested, and nobody tests you gently. Stance up.'],
    lose: ['Tested, and passed. She is at the back, doing one-armed push-ups and paperwork. Both can wait. Yours cannot.'],
    team: [{ species: 'machop', level: 336 }, { species: 'meditite', level: 338 }], reward: 800,
  },
  maylene_belt2: {
    id: 'maylene_belt2', name: 'BLACK BELT RUE', title: 'Shardfall Gym Trainer', ai: 'smart',
    intro: ['I have sparred Maren every morning for two years. She has never once gone easy. Neither, in her honor, do I.'],
    lose: ['Two years of mornings, and you read me in minutes. Go on, then. Her AURAJACK has been listening to this whole conversation.'],
    team: [{ species: 'croagunk', level: 339 }, { species: 'machoke', level: 341 }], reward: 850,
  },

  // ---- PAUL, the rival spine (all battles friendly-measure) ----
  paul_sandgem: {
    id: 'paul_sandgem', name: 'STELLAN', title: 'Trainer from Shardfall', ai: 'smart',
    intro: ['So you are the famous one. Four regions of reputation, and it all fits in one doorway.', 'I do not battle for introductions. I battle for data. Show me what the record is actually made of — I will be counting what it costs you.'],
    lose: ['...Noted. The record undersells you in one column and oversells you in another. I will correct both by Shardfall.'],
    team: [
      { species: 'starly', level: 308 },
      { species: 'chimchar', level: 310 },
      { species: 'elekid', level: 312, keepsake: 'starshard' },
    ],
    reward: 1500,
  },
  paul_veilstone: {
    id: 'paul_veilstone', name: 'STELLAN', title: 'Trainer from Shardfall', ai: 'smart',
    intro: ['Shardfall. My streets, my weather, my terms. Four badges since the lab — I have kept the ledger, {player}. Every entry.', 'This is not a rematch. It is an audit. Stand still for it.'],
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
    id: 'mars_windworks', name: 'COMMANDER VESPER', title: 'The Astral Combine Commander', ai: 'smart',
    intro: ['Oh, a rescuer. How theatrical. I am Vesper, and this facility is ours until the turbines finish their little song.', 'The keeper\'s key, the keeper\'s house, the keeper\'s silence — all purchased, darling. You are the only unpaid thing here. Let me fix that.'],
    lose: ['Tch. Fine. FINE. Take the rusty building and the grateful little man — the energy was already counted, and you cannot un-count a number.', 'Combine keeps what matters. Remember that when the lakes come up in conversation.'],
    team: [
      { species: 'zubat', level: 314 },
      { species: 'purugly', level: 318 },
    ],
    reward: 1600,
  },
  jupiter_eterna: {
    id: 'jupiter_eterna', name: 'COMMANDER NOVA', title: 'The Astral Combine Commander', ai: 'smart',
    intro: ['A child with badges, in my building. I am Nova. Everything counted in these rooms belongs to a future you are not dressed for.', 'The statue, the archives, the energy ledgers — Combine is simply tidying the region\'s past into its future. Step aside, or be tidied.'],
    lose: ['Counted wrong. I do not say that often, and I will not say it twice.', 'Take the building, then. Stone and paper. What we needed from Heritage left before you arrived — ask your professor what his oldest books are missing. The lakes, child. Watch the lakes.'],
    team: [
      { species: 'zubat', level: 326 },
      { species: 'skuntank', level: 330 },
    ],
    reward: 2400,
  },

  // ================= Stage S5b: the second half =================
  // ---- the four remaining leaders (badgeSet 'sinnoh': generic) ----
  wake: {
    id: 'wake', name: 'BREAKER BRADDOCK', title: 'Fenland Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['BREAKER BRADDOCK! That is the name, and this is the ring — my gym, my marsh, my water! I have heard about you, champion of everywhere. Fenland does not do quiet respect. We do VOLUME.', 'My TIDESEL has been bouncing off the walls waiting for a real tide to swim against. Be a tide, challenger!'],
    lose: ['SPLASHED OUT! Beaten in my own ring, in my own water, and I LOVE IT! That is a main event!', 'The Fen Badge! Take it with both hands — it is heavy with marsh water and main events. The lakes, though... keep an eye on the lakes, champion. Something has been counting them, and it does not applaud.'],
    team: [
      { species: 'gyarados', level: 350 },
      { species: 'quagsire', level: 352 },
      { species: 'floatzel', level: 355, keepsake: 'fencharm' },
    ],
    reward: 3400, badge: 'fenbadge',
  },
  byron: {
    id: 'byron', name: 'DORAN', title: 'Bridgeport Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['I am Doran. I dig, I build, and I do not move for weather, titles, or famous trainers. My son holds the first gym in this region; I hold the standard he is measured against.', 'Steel does not argue, challenger. It simply does not break. Come and try to break it.'],
    lose: ['...Not broken. BENT — and I know good work when it bends mine. Hm. Ronan will hear about this, and so will the mountain.', 'The Mine Badge. Earned at the face, the hard way. My wife says I only respect what costs effort. She is right, and it does.'],
    team: [
      { species: 'bronzong', level: 358 },
      { species: 'steelix', level: 360 },
      { species: 'bastiodon', level: 363, keepsake: 'ironacorn' },
    ],
    reward: 3800, badge: 'minebadge',
  },
  candice: {
    id: 'candice', name: 'NEVE', title: 'Rimefall Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Hi! Neve — Rimefall Gym, coldest room in Borea, warmest welcome. I teach at the school here, and my first lesson is always the same: focus beats temperature.', 'Everyone thinks ice is slow. Ice is PATIENT. There is a difference, and my team is about to mark your work on it.'],
    lose: ['Marked — and full marks, too. You kept your focus at temperatures that scatter most challengers. That is rarer than any badge I give.', 'The Icicle Badge, then. The road south has walls the snow built — the old HM for climbing them sleeps somewhere on Route 217, they say. And trainer? Whatever is happening on my lake — I have felt it through the ice. Be careful up there.'],
    team: [
      { species: 'sneasel', level: 368 },
      { species: 'medicham', level: 370 },
      { species: 'froslass', level: 372 },
      { species: 'abomasnow', level: 374, keepsake: 'frostpetal' },
    ],
    reward: 4200, badge: 'iciclebadge',
  },
  volkner: {
    id: 'volkner', name: 'RAINER', title: 'Brightshore Gym Leader', ai: 'smart', badgeSet: 'sinnoh',
    intro: ['Rainer. You will forgive the yawn — this gym runs on sunlight and I have been... under-challenged. They say you calmed a sky on your way here. Good. Boredom is the only weather I cannot stand.', 'They call me the strongest leader in Borea. It has been a while since the title cost me anything. Make it cost.'],
    lose: ['...There it is. There is the voltage I have been missing. Do you know how long it has been since this room surprised me? Neither do I. I stopped counting out of self-defense.', 'The Beacon Badge — the eighth. The Conference is lit at Lily of the Valley, trainer, and for the first time in a long while, I envy the people who will watch you there. Go and be worth the lights.'],
    team: [
      { species: 'raichu', level: 380 },
      { species: 'ambipom', level: 382 },
      { species: 'luxray', level: 384 },
      { species: 'electivire', level: 386, keepsake: 'beaconcoil' },
    ],
    reward: 4600, badge: 'beaconbadge',
  },

  // ---- gym rosters, second half (two per gym, rising) ----
  wake_fisher1: {
    id: 'wake_fisher1', name: 'FISHER TAMSIN', title: 'Fenland Gym Trainer', ai: 'smart',
    intro: ['Wake warms the crowd up with us marsh hands. The water in here has opinions, trainer. So do the fish.'],
    lose: ['Opinions overruled. The big ring is his, at the back — mind the entrance. He likes an entrance.'],
    team: [{ species: 'tentacruel', level: 346 }, { species: 'pelipper', level: 348 }], reward: 900,
  },
  wake_fisher2: {
    id: 'wake_fisher2', name: 'FISHER BOGUE', title: 'Fenland Gym Trainer', ai: 'smart',
    intro: ['Thirty years I have fished the Great Mire. Everything I know about patience is in this battle. Everything.'],
    lose: ['Patience, beaten by its betters. Wake is waiting, and Wake does not do patience at all.'],
    team: [{ species: 'whiscash', level: 347 }, { species: 'gastrodon', level: 349 }], reward: 950,
  },
  byron_miner1: {
    id: 'byron_miner1', name: 'FOREMAN HOLLIS', title: 'Bridgeport Gym Trainer', ai: 'smart',
    intro: ['Doran\'s rule: a challenger gets inspected like ore. I am the inspection. Nothing personal — everything structural.'],
    lose: ['Structurally sound. Annoyingly sound. The face is his, at the back. Mind WALLTRIKE — it has a foreman\'s temperament.'],
    team: [{ species: 'magneton', level: 354 }, { species: 'magnezone', level: 356 }], reward: 1000,
  },
  byron_miner2: {
    id: 'byron_miner2', name: 'FOREMAN ILD', title: 'Bridgeport Gym Trainer', ai: 'smart',
    intro: ['I have poured steel in this town since before the gym had a roof. You are not harder than the work. Nobody is.'],
    lose: ['...Harder than the work. Noted, and filed where Doran will see it. Go on, then. He respects filings.'],
    team: [{ species: 'bronzong', level: 355 }, { species: 'steelix', level: 357 }], reward: 1050,
  },
  candice_skier1: {
    id: 'candice_skier1', name: 'SKIER WRENNA', title: 'Rimefall Gym Trainer', ai: 'smart',
    intro: ['Miss Neve lets us set the slope for challengers. I set it steep. Hold your line, trainer.'],
    lose: ['Line held — yours. She is at the top of the slope, grading the whole mountain. Go and be graded.'],
    team: [{ species: 'snorunt', level: 364 }, { species: 'spheal', level: 366 }], reward: 1100,
  },
  candice_skier2: {
    id: 'candice_skier2', name: 'SKIER TOMAS', title: 'Rimefall Gym Trainer', ai: 'smart',
    intro: ['Everyone slides their first time in this gym. Everyone. The regulars have a pool on which tile gets you.'],
    lose: ['No slide. The pool owes me money and you owe me nothing. Her YETIFIR has been watching through the frost. It approves slowly.'],
    team: [{ species: 'sneasel', level: 367 }, { species: 'snover', level: 369 }], reward: 1150,
  },
  volkner_tech1: {
    id: 'volkner_tech1', name: 'TECHNICIAN SOLENNE', title: 'Brightshore Gym Trainer', ai: 'smart',
    intro: ['I keep this gym\'s panels bright and its leader awake. Challengers are my second job. You are both today.'],
    lose: ['Bright work. He is at the back, and — was that a smile? That might have been a smile. Historic.'],
    team: [{ species: 'jolteon', level: 376 }, { species: 'pachirisu', level: 378 }], reward: 1200,
  },
  volkner_tech2: {
    id: 'volkner_tech2', name: 'TECHNICIAN VOSS', title: 'Brightshore Gym Trainer', ai: 'smart',
    intro: ['Rainer rebuilt this gym three times because the battles bored him. Do not be a fourth rebuild, trainer.'],
    lose: ['No rebuild needed — that one will be in his report tonight, underlined. Go on. He has already stood up.'],
    team: [{ species: 'luxio', level: 377 }, { species: 'electabuzz', level: 379 }], reward: 1250,
  },

  // ---- Team Galactic, second half ----
  saturn_hq: {
    id: 'saturn_hq', name: 'COMMANDER SORIN', title: 'The Astral Combine Commander', ai: 'smart',
    intro: ['So the door opens after all — inward, as promised. I am Sorin, and you are standing in the counting house of the new world, trainer.', 'Everything taken at the Windworks, in Heritage, at the lakes, is tallied in these rooms. You are not rescuing anything here. You are auditing a god\'s budget. Allow me to dispute the audit.'],
    lose: ['Disputed... and overruled. Take the building, then. Take the ledgers. The count that matters left Shardfall before your boat ever docked — it is already walking up a mountain.', 'Severin does not need this house anymore. Neither, I suspect, do I. That is the first honest thing I have said all year.'],
    team: [
      { species: 'zubat', level: 352 },
      { species: 'bronzong', level: 355 },
      { species: 'toxicroak', level: 358 },
    ],
    reward: 3600,
  },
  cyrus_spear: {
    id: 'cyrus_spear', name: 'SEVERIN', title: 'The Astral Combine Boss', ai: 'smart',
    intro: ['You climbed well. It changes nothing. I am Severin, and I have spent a life removing the flaw from the world — the flaw is spirit: incomplete, striving, suffering spirit.', 'CHRONARCH. COSMARCH. Time and space, held in the red chain, waiting for a voice without a flaw in it. Mine. Stand aside, or be edited out of the draft.'],
    lose: ['Edited — no. INTERRUPTED. The chain holds, trainer. Whatever you have won here, the sky is about to overrule us both...'],
    team: [
      { species: 'honchkrow', level: 383 },
      { species: 'crobat', level: 385 },
      { species: 'gyarados', level: 386 },
      { species: 'weavile', level: 388 },
    ],
    reward: 8000,
  },
  cyrus_final: {
    id: 'cyrus_final', name: 'SEVERIN', title: 'The Astral Combine Boss', ai: 'smart',
    intro: ['This world rejects my order, and the god of it rejects my chains. Very well. If a flawless world will not have me, trainer, I will take my answer out of the one flaw standing on this platform. You.'],
    lose: ['No... no world, then. Not mine, not theirs. Leave me in this one, trainer. It is the only sentence that fits the crime of wanting.'],
    team: [
      { species: 'crobat', level: 388 },
      { species: 'honchkrow', level: 389 },
      { species: 'gyarados', level: 390 },
      { species: 'weavile', level: 392 },
    ],
    reward: 9000,
  },

  // ---- PAUL: the midpoint and the settlement ----
  paul_acuity: {
    id: 'paul_acuity', name: 'STELLAN', title: 'Trainer from Shardfall', ai: 'smart',
    intro: ['Lake Insight. You came. Good — the ledger has one page left in it, and I have been saving it for weather like this.', 'Six against six, {player}. No audits, no measures, no mercy columns. Everything I have raised since Shardfall, against everything you are. This is the battle the whole region has been a draft of.'],
    lose: ['...There it is. The page is written, and it does not say what my arithmetic promised me it would say.', 'Again at the Conference, then — IF the bracket is honest. Bring this. Bring exactly this.'],
    team: [
      { species: 'gliscor', level: 378 },
      { species: 'weavile', level: 379 },
      { species: 'honchkrow', level: 380 },
      { species: 'magmortar', level: 381 },
      { species: 'torterra', level: 382 },
      { species: 'electivire', level: 384, keepsake: 'starshard' },
    ],
    reward: 6000,
  },
  paul_conference: {
    id: 'paul_conference', name: 'STELLAN', title: 'Conference Quarter-Finalist', ai: 'smart',
    intro: ['So the bracket is honest after all. Quarter-final, {player}. Everything the lab started, Insight wrote in pencil — this is the ink.', 'I have rebuilt my team around one question since that lake: what does it take to beat you? Today we both find out what my answer is worth. Everything, trainer. I am holding nothing back, and neither are you. That is the whole rivalry, in one sentence.'],
    lose: ['...Worth everything I spent on it, and it still was not the answer. Hm.', 'Do not — do not soften it. I lost to the better trainer, at full strength, with the whole of Borea watching. It is the first result in my ledger I would not change a digit of. Whatever is waiting in the semi-final, {player} — it has never faced you. Remember that it is also true the other way. Go.'],
    team: [
      { species: 'gliscor', level: 392 },
      { species: 'drapion', level: 393 },
      { species: 'gastrodon', level: 394 },
      { species: 'froslass', level: 395 },
      { species: 'torterra', level: 396 },
      { species: 'electivire', level: 398, keepsake: 'starshard' },
    ],
    reward: 10000,
  },

  // ---- the Conference bracket ----
  conference_s_p1: {
    id: 'conference_s_p1', name: 'TAMSIN', title: 'Conference Trainer', ai: 'smart',
    intro: ['Preliminary round, and the draw hands me the trainer the mountain could not hold. Fine. I did not sail to this island to be a warm-up.'],
    lose: ['Warm-up it is — a thorough one. Climb, trainer. Past me, the bracket stops being polite.'],
    team: [
      { species: 'staraptor', level: 388 },
      { species: 'roserade', level: 389 },
      { species: 'garchomp', level: 390 },
    ],
    reward: 5000,
  },
  // TOBIAS — staged in TWO acts (the mechanism is recorded at his
  // handler in overworld-systems.mjs and in the register, line by
  // line against the coordinator's ruling): Act 1 is his NOCTARCH
  // ALONE, a real battle on the league rechallenge idiom — a full
  // wipe before it falls is a rematch, never a conclusion; winning
  // it sets tobias_darkrai_felled. Act 2 is his AZURAVIS ALONE, fought
  // friendly on the FACED predicate (the Harrison/Brandon pattern):
  // win or lose, the match — and the Conference — concludes.
  tobias_darkrai: {
    id: 'tobias_darkrai', name: 'CASSIAN', title: 'Conference Semi-Finalist', ai: 'smart',
    intro: ['Cassian. You beat Stellan — I watched from the tunnel, and I will not pretend it was anything less than it was.', 'Everyone asks about my team. There is, functionally, one question on it, and it is standing in front of you. No trainer in this Conference has taken NOCTARCH down. The bracket is waiting to see if the record survives you.'],
    lose: ['...Down. It is DOWN. Do you understand what this hall just saw, trainer? No one — no one — has done that in this entire Conference.'],
    team: [
      // Stage S6 RIDER (the S5b honesty note, closed): the set is
      // AUTHORED in the def (the engine reads a team entry's
      // `moves` list — battle.mjs authoredMoves), every move in
      // NOCTARCH's legal in-table pool: Hypnosis + Dream Eater
      // (learnset) are the nightmare engine, Fire Blast (TM38) +
      // Hyper Beam (TM15) its strongest honest TM damage.
      { species: 'darkrai', level: 390, moves: ['hypnosis', 'dreameater', 'fireblast', 'hyperbeam'] },
    ],
    reward: 8000,
  },
  tobias_latios: {
    id: 'tobias_latios', name: 'CASSIAN', title: 'Conference Semi-Finalist', ai: 'smart',
    intro: ['One question answered. There is a second on my team, and it has been patient all Conference. AZURAVIS, trainer. Finish the match — if the match can be finished.'],
    lose: ['Finished. Utterly, honestly finished — by the only trainer who ever got this far into my team. The final is yours, Cassian says, and means it like a door opening.'],
    team: [
      // Stage S6 RIDER: AZURAVIS's set is authored on the same law —
      // Psychic (learnset STAB) + Ice Beam (TM13) + Thunderbolt
      // (TM24), its strongest in-table coverage, + Recover.
      { species: 'latios', level: 392, moves: ['psychic', 'icebeam', 'thunderbolt', 'recover'] },
    ],
    reward: 8000,
  },
};

export const SINNOH_EVENTS = {
  // The landing. Fires on first Shingle entry of the Borea arc (the
  // ferry + en-route card are the registry's; this is the shore).
  ev_sinnoh_arrival: [
    { chapterCard: 7 },
    { say: ['Shingle Town. The ferry lets go of the horizon behind you, and Borea takes hold in front: pine-dark hills, a wind with edges, and snow standing on the peaks like the region is thinking about winter permanently.', 'No send-off committee, no starter ceremony, no beginner\'s kit. You are not beginning anything here. You are continuing — and the mountain ahead has been continuing a great deal longer.'], who: '' },
    { say: ['Professor Sorrel\'s lab stands at the north end of town — the tall windows, the taller reputation. He studies how Kin grow and change, and word of your crossing reached him before your ship did.', 'Clover Town lies west, past Route 201 — a small town under the trees, and beyond it, a lake the old stories refuse to leave alone.'], who: '' },
    { flag: 'sinnoh_arrival' },
    { toast: 'Landed in Borea — Shingle Town.' },
  ],
  // The lab: Rowan registers a veteran; Paul takes his first measure.
  ev_sinnoh_lab: [
    { say: ['The lab is quiet the way libraries are quiet — by enforcement. PROF. SORREL looks up from a fossil ledger, and his eyebrows conduct a brief, severe census of you.', '"Hm. The Arden champion. The Amber voyager. The Yamato and Maris name my colleagues keep attaching to weather events."'], who: 'PROF. SORREL' },
    { say: ['"Understand me: I do not register beginners in this room, and I am not registering one now. Your KinDex is a working instrument, not a schoolbook. Borea\'s pages are open to it — all of them, from the lake spirits to the things the mountain keeps."', '"Walk my region carefully, trainer. It is older than the League, and it keeps its evidence in stone."'], who: 'PROF. SORREL' },
    { flag: 'rowan_registered' },
    { say: ['The door opens on the cold. A trainer your age stands in it — cap low, hands in pockets, a gaze that has already finished measuring the room and moved on to you.', '"Stellan." The professor\'s tone files the name under weather warnings. "You were told to wait outside." — "I waited. Then I came in."'], who: '' },
    { say: ['So you are the famous one. Four regions of reputation, and it all fits in one doorway.', 'I do not battle for introductions. I battle for data. Show me what the record is actually made of — I will be counting what it costs you.'], who: 'STELLAN' },
    { battleAny: { trainer: 'paul_sandgem', winFlag: 'paul1_won', loseFlag: 'paul1_lost' } },
    { flag: 'paul1_done' },
    { say: ['Stellan recalls his last Kin without a flicker, writes nothing down — you understand, watching him, that he does not need to — and walks out into the cold.', '"Shardfall," Sorrel says to the closing door, the way other men say avalanche season. "His home. You will cross him again, trainer. Trainers like that are not weather. They are climate."'], who: '' },
    { toast: 'Registered with Prof. Sorrel — and measured by Stellan.' },
  ],
  // Lake Candor: the glimpse (no catch — S6 owns the lake trio).
  ev_sinnoh_verity: [
    { say: ['Lake Candor holds still the way held breath holds still. The water gives back the sky, the pines, your own face — and then, slow as a thought deciding to surface, a shape crosses the reflection that is in none of those things.', 'Small. Crowned. Gone. The lake is only a lake again, and your heart is doing something it has not done since a tower in Yamato caught fire in the stories.', 'Whatever sleeps here felt you arrive. It did not wake. Remember that it could have.'], who: '' },
    { flag: 'verity_glimpse' },
    { toast: 'Something moved on Lake Candor...' },
  ],
  // Valley Galeworks: Mars holds the keeper (must-win).
  ev_sinnoh_windworks: [
    { say: ['The Windworks floor is too quiet — turbines turning somewhere above, and not one of them answering the keeper\'s console. A small voice from the back room, first: "Papa? Is the wind back?"', 'Then the other voice, amused as a drawn blade: "The keeper is indisposed. The keeper\'s KEY is indisposed. the Astral Combine is borrowing the wind, trainer — and we charge interest."'], who: '' },
    { battle: 'mars_windworks' },
    { flag: 'windworks_cleared' },
    { say: ['The locks come off the back room in a clatter of keys. The keeper hugs his daughter hard enough to lift her clean off the floor, and the turbines, one by one, remember their jobs.', '"They kept asking the console about STORMS," the keeper says, bewildered. "Schedules. Seasons. What does a wind farm know about the sky that they needed it so badly?" The road east — Heritage Forest, and Heritage City — is open, and humming.'], who: '' },
    { toast: 'The Valley Galeworks are free — Vesper driven off.' },
  ],
  // The Heritage building: Jupiter (must-win).
  ev_sinnoh_galactic: [
    { say: ['Inside, the Combine building is all hush and carpet — researchers who do not look up, guards who do not blink, and on the top floor, a woman in the uniform\'s sharpest cut, reading the city\'s oldest survey charts like a menu.', '"A child with badges, in my building." She closes the chart the way a door closes. "I am Nova."'], who: '' },
    { battle: 'jupiter_eterna' },
    { flag: 'galactic_eterna_done' },
    { say: ['The building empties the way water leaves a tipped glass — fast, silent, and entirely rehearsed. On Nova\'s desk, one page stays behind: an inventory of things taken from Heritage\'s archives.', 'Statue rubbings. Meteor counts. And three words, underlined twice, in a hand that was not hurried at all: THE LAKES — FIRST. Inglenook lies south, and its ghost gym with it. The road is calling louder than the mystery, for now.'], who: '' },
    { toast: 'The Heritage building is cleared — Nova driven off.' },
  ],
  // Repose Ruins: the Defog grant (S4's HM_GRANTS hook), Platinum's
  // placement — the carved chamber keeps the HM.
  ev_sinnoh_defog: [
    { say: ['The carved chamber at the ruin\'s heart is older than the town above it, and it has been waiting with the patience of cut stone. On the altar slab, where the fog-light falls: a disc, League-sealed, humming faintly with a field craft.', 'The inscription beneath it is short, and entirely without mystery: FOR THE ROADS THAT HIDE THEMSELVES.'], who: '' },
    { giveHM: 'defog' },
    { flag: 'defog_received' },
    { say: ['Defog — the art of beating a white wall into weather. The Fen Badge, from Fenland in the marsh country, is what licenses it on the fog roads; the ruins keep the knowledge itself.', 'Shardfall lies north-east, past the lost tower and the long grass. The fog will be waiting there to be argued with.'], who: '' },
    { toast: 'Claimed HM06 — Defog — from the Repose Ruins.' },
  ],

  // ================= Stage S5b events =================
  // Lake Gallant, after the Fen Badge: the explosion's aftermath. A
  // glimpse of VOLITAR + Galactic pressure — the trio's CATCH arcs
  // are S6's; this half only ever glimpses.
  ev_sinnoh_valor: [
    { say: ['Lake Gallant is wrong the moment you see it: the water sits low and steaming in its banks, the shore reeds are flattened outward in a ring, and the air smells of hot stone. Something was done here — recently, and with machinery, not malice aforethought. Malice would have been quieter.', 'Half the lake is simply GONE — blown skyward hours ago, the wardens say, by men in grey who came in boats and left in aircraft. And in the churned shallows, for exactly one breath, something small and blue-gold rises out of the steam, looks at the ruin of its home — and is taken, gently, terribly efficiently, by hands that were waiting for it.'], who: '' },
    { say: ['VOLITAR. The being of willpower, the wardens whisper, already carrying the word ASTRAL between their teeth like a stone. The aircraft are specks before the name finishes leaving their mouths.', 'Whatever is being counted at the lakes now has a body count of one lake and one god. The HQ in Shardfall holds the ledgers. It is time the door opened.'], who: '' },
    { flag: 'valor_glimpse' },
    { flag: 'azelf_glimpsed' },
    { toast: 'Lake Gallant was bombed — and VOLITAR was taken.' },
  ],
  // The Shardfall HQ raid: the S5a door opens (Fen-gated entry).
  ev_sinnoh_hq_raid: [
    { say: ['The Shardfall HQ does not resist the way buildings resist. It resists the way paperwork resists — in triplicate, with locks. But the locks were rated for tourists, and you are not one anymore. Past the lobby, past the ledgers, the house\'s keeper is waiting exactly where he always stands: by the door that matters.'], who: '' },
    { battle: 'saturn_hq' },
    { flag: 'galactic_hq_done' },
    { say: ['The building empties the way Heritage\'s did — rehearsed, silent, unhurried — but the ledgers stay, and the ledgers are a confession in columns: energy from the Windworks, history from Heritage, and three lakes, each with a name, a date, and a word in the margin. TAKEN. TAKEN. PENDING.', 'One name is on every page, in a hand the commanders all imitate without knowing it. SEVERIN. And one destination, underlined past the paper\'s patience: THE PILLARS.'], who: '' },
    { toast: 'The Shardfall HQ is raided — the count points at Mt. Apex.' },
  ],
  // Route 217: the Rock Climb grant (S4's HM_GRANTS hook), Platinum's
  // placement — the lost HM in the snow, Icicle-gated entry.
  ev_sinnoh_rockclimb: [
    { say: ['The drifts on Route 217 pile deepest against the old route-marker, where the wind gives up carrying the snow any further. Something in the drift catches the flat northern light — a disc, League-sealed, half-buried where a traveller\'s pack must have split a season ago.', 'The inscription is the League\'s, and it is short: FOR THE WALLS THAT STAND IN THE ROAD.'], who: '' },
    { giveHM: 'rockclimb' },
    { flag: 'rockclimb_received' },
    { say: ['Rock Climb — the art of treating a cliff as a staircase that has not admitted it yet. The Icicle Badge, from Rimefall at the top of the world, is what licenses it on the climb walls; the snow keeps the knowledge itself.', 'Rimefall lies east, across the lake country. The walls will be waiting to be argued with.'], who: '' },
    { toast: 'Claimed HM07 — Rock Climb — from the Route 217 snow.' },
  ],
  // Lake Insight, after the Icicle Badge: LORACLE's glimpse under
  // Galactic pressure (pressure and a shadow — S6 owns the catch).
  ev_sinnoh_acuity_glimpse: [
    { say: ['Lake Insight is frozen hard enough to hold the sky, and the far shore is wrong: grey boats on the ice, grey figures measuring the lake like a room they intend to empty. Combine has come for the north lake — slower here, and warier. The ice is old, and it is watching them.', 'Under the ice at the lake\'s heart, something small and gold turns in its sleep — one slow revolution, like a thought deciding whether to surface. It does not surface. The figures on the far shore pack their instruments with the care of men told, precisely, not to hurry a god.', 'LORACLE. The being of knowledge. It knows they are there. It knows you are here. It is letting both facts ripen.'], who: '' },
    { panel: 'underice-loracle' },
    { flag: 'uxie_glimpse' },
    { toast: 'Something turned beneath Lake Insight\'s ice...' },
  ],
  // Lake Candor revisited, all badges held: EMPATHIS under pressure —
  // the last glimpse before the mountain (S6 owns the catch).
  ev_sinnoh_verity_pressure: [
    { say: ['Lake Candor again — and not as you left it. Grey hulls quarter the water in a slow grid, instruments trailing like fingers feeling for a pulse. The Combine has come back for the first lake last, and it is being thorough.', 'Then the water at the shore simply... changes its mind about being empty. Small. Crowned. Pink as a held breath let go — EMPATHIS rises a hand\'s breadth above the surface, looks at the boats, looks at you, and chooses, with ancient courtesy, to be elsewhere. The grid closes on a reflection.', 'The being of emotion, uncaught and unbothered, gone over the pines. Whatever Severin counts on taking from this lake, he will count without it — for now. The mountain is calling louder. Answer the mountain.'], who: '' },
    { panel: 'surfaced-empathis' },
    { flag: 'mesprit_glimpse' },
    { toast: 'EMPATHIS slipped the net at Lake Candor.' },
  ],
  // Honeyfield, from the Cobble Badge on: the Gracidea beat (the Sky
  // Warrior's flower) — a glimpse chain; S6 owns GRATHOG's catch.
  ev_sinnoh_gracidea: [
    { say: ['Honeyfield\'s meadow has done something the florists will talk about for a decade: overnight, in the wrong season, the Gracidea have opened — all of them, a whole field standing in pink-white bloom like the meadow is holding a celebration it forgot to announce.', 'The beekeepers say the flowers open like this only in gratitude, and only all at once. Gratitude for what, nobody can agree — until the bloom at the field\'s heart moves against the wind, and a small green shape with a flower on either ear lifts its head out of the blossom, considers you with total unafraid calm... and settles back down into the flowers, the way a guest settles into a house that is partly theirs.'], who: '' },
    { say: ['GRATHOG. The Gratitude Kin, in its own flower field, at its own celebration. It is not yours to disturb today, and it knows you know it. Some meetings are appointments. This one is a promise.'], who: '' },
    { panel: 'gracidea-grathog' },
    { give: { items: { gracidea: 1 } } },
    { toast: 'Received the Gracidea!' },
    { flag: 'gracidea_beat_done' },
    { flag: 'shaymin_glimpsed' },
    { flag: 'shaymin_unlocked' },
    { toast: 'The Gracidea bloomed — and something small bloomed with them.' },
  ],
  // Astral, all badges held: the Zoroark special — a one-scene
  // illusion. (No species stands behind it in this region's dex;
  // the scene is honest about that: an illusion, and nothing else.)
  ev_sinnoh_zoroark: [
    { say: ['Astral\'s shrine street, at the blue hour — and the fog comes down off the mountain wrong. It does not roll. It STALKS. Out of it, soundless, enormous, a shape the old shrine murals would recognise: a great beast with a mane like storm cloud, standing in the middle of the street, looking at the shrine the way exiles look at home.', 'The street empties without a sound. The beast turns its head — and the eyes are wrong for a beast: they are grieving, and they are acting. For one held second the whole shape hangs together. Then the fog closes, the street is only a street, and there is nothing — nothing at all — where a legend was standing.'], who: '' },
    { say: ['The shrine elder, when the street refills, is unbothered in the way of people who keep very old doors. "An illusion with a homesick heart," she says. "They walk the old towns some years, wearing the shapes of greater stories. Whatever it was looking for, trainer — it was not looking at us. We were just... in its light."'], who: '' },
    { flag: 'zoroark_special_seen' },
    { toast: 'An illusion walked Astral\'s shrine street...' },
  ],
  // Brightmoon Island, once the sailor's plea is open: LUNACYGN's
  // glimpse and the Lunar Wing (the NOCTARCH beat's middle act).
  ev_sinnoh_fullmoon: [
    { say: ['Brightmoon Island lives up to its billing the way shrines do: quietly, and completely. The moon stands full over the crescent pond at the island\'s heart whether the sky agrees or not, and the water holds its light the way held breath holds a note.', 'Then the pond\'s light stands up. Slow, crescent-winged, trailing ribbons of dawn-pink — LUNACYGN rises off her own reflection, regards you with the deep patience of a lighthouse, and understands the errand before you can shape it. She does not flee. She provides.'], who: '' },
    { say: ['One feather, crescent-curved and shining, comes loose on the still air and settles into your hands like it was always addressed to you. The boy in Bridgeport has been dreaming of a dark shape standing over his bed. This — this is the shape that stands against it.'], who: '' },
    { give: { items: { lunarwing: 1 } } },
    { flag: 'lunar_wing_received' },
    { flag: 'cresselia_glimpsed' },
    { toast: 'Received the Lunar Wing from LUNACYGN\'s island.' },
  ],
  // Mt. Apex north galleries, all badges held: the climb beat.
  ev_sinnoh_coronet: [
    { say: ['The north galleries of Mt. Apex are the mountain\'s throat: cold, vertical, echoing with grey boots somewhere above. The Combine has committed everything — one whole organisation poured up a mountain toward a date with its boss.', 'What is left of their rearguard does not fight you. That is the frightening part. They stand aside at the gallery turns, like staff at a ceremony they are no longer sure they believe in, and let you walk past into the weather at the top of the world.', 'Above: the pillars. Below: all of Borea, holding its breath. Severin is already up there. The sky has started, very slightly, to sound like a held chord.'], who: '' },
    { flag: 'coronet_climb_done' },
    { toast: 'The summit is close — Zenith Spire waits above.' },
  ],
  // ZENITH SPIRE: Cyrus summons CHRONARCH AND COSMARCH chained (Platinum)
  // — a FACED battle (battleAny: the sky overrules the result), then
  // the tear, and the warp down into the Mirrorworld.
  ev_sinnoh_spear_pillar: [
    { say: ['Zenith Spire. The top of the world is a floor of old stone and older pillars, and the sky above it hangs in two colours at once — time on one side, space on the other — and between them, chained in red light that crawls like something alive: CHRONARCH. COSMARCH. The gods of the first stories, held like horses at a post.', 'Severin stands between them with his arms raised, a conductor at the first bar of the only music he has ever wanted to hear: a world remade without spirit, with himself as its silent god. The red chain sings. The mountain holds its breath. Your footsteps are, somehow, the loudest sound in creation.'], who: '' },
    { say: ['You climbed well. It changes nothing. I am Severin, and I have spent a life removing the flaw from the world — the flaw is spirit: incomplete, striving, suffering spirit.', 'CHRONARCH. COSMARCH. Time and space, held in the red chain, waiting for a voice without a flaw in it. Mine. Stand aside, or be edited out of the draft.'], who: 'SEVERIN' },
    { battleAny: { trainer: 'cyrus_spear', winFlag: 'cyrus_spear_won', loseFlag: 'cyrus_spear_lost' } },
    { say: ['Whatever the battle decided, the sky overrules it. The red chain reaches its note — and somewhere beneath the world, something banished before there were words for banishment hears its name in the chord, and answers.', 'The air over Zenith Spire tears. Not opens — TEARS, the way a page tears, and through the rip: a world poured wrong, waterfalls climbing, islands hanging like fruit, and a shadow with six legs and wings of smoke crossing the wound in the sky. VOIDARCH. The third god. The one the first stories were too frightened to finish.'], who: '' },
    { say: ['It takes Severin the way weather takes a flag — no malice, no mercy, just physics from an older universe — and the red chain, masterless, comes apart in light. CHRONARCH and COSMARCH stand unchained for one held second, look at each other, at you, at the tear — and are gone, like candles deciding to be stars instead.', 'The tear stays open. It is, you understand with your whole spine, an invitation — and an accusation. The third god is waiting on the far side of its own wound. Go and answer it.'], who: '' },
    { flag: 'spear_pillar_done' },
    { toast: 'The sky tore over Zenith Spire — the Mirrorworld is open.' },
    { warp: { map: 'distortion-entrance', x: 10, y: 14 } },
  ],
  // THE MIRRORWORLD platform: Cyrus's end + the climax
  // resolution. sinnoh_climax_resolved is THIS arc's
  // climax_resolved-equivalent (the H4b idiom: the one flag the
  // titan catch arcs key on — S6's CHRONARCH/COSMARCH/VOIDARCH arcs read
  // it, and the per-titan unlock flags below are set in the same
  // step block, never earlier).
  ev_sinnoh_distortion_climax: [
    { say: ['The platform at the Mirrorworld\'s heart is the stillest place in either universe: black glass over nothing, and on it, waiting with the patience of the banished, VOIDARCH — vast, gold-crowned, watching you the way the deep watches a diver. It does not attack. It has had eternity to learn the difference between an invader and an answer.', 'And here is Severin, set down on the glass beside his ruined century — unharmed, unchained, face to face with a god his philosophy has no column for. It is not finished with him. Neither, it turns out, are you.'], who: '' },
    { battleAny: { trainer: 'cyrus_final', winFlag: 'cyrus_final_won', loseFlag: 'cyrus_final_lost' } },
    { say: ['It ends the way it was always going to end: not with the battle, but after it. Severin looks at the world he tried to unmake — its wrong waterfalls, its hanging islands, its total refusal to be improved — and something in the flawless voice finally, audibly, cracks.', '"Leave me in this world, trainer. It is the only sentence that fits the crime of wanting." He walks — not dragged, not chased, walking — out across the black glass toward the deep places, and the shadows close behind him. the Astral Combine ends here: not defeated. Finished. A man who wanted a world without spirit, granted a world with nothing else in it.'], who: '' },
    { say: ['VOIDARCH settles — that is the only word — folding its smoke wings like a king concluding an audience. The tear in the sky begins to knit: not sealed, but STILLED, the way a wound stills when the bleeding stops. Below it, two unchained gods are settling back into the deep places of time and space, free, alive, and — in the way of gods who owe a trainer a debt — findable, one day, by the one who broke their chains.', 'The mountain breathes. The lakes calm. Borea\'s sky is a sky again: local, arguable, kind. What is left is a bracket, an island, and two old scores. The Conference is lit, trainer. Go and finish the region properly.'], who: '' },
    { flag: 'distortion_cleared' },
    { flag: 'cyrus_end_done' },
    { flag: 'sinnoh_climax_resolved' },
    { flag: 'dialga_unlocked' },
    { flag: 'palkia_unlocked' },
    { flag: 'giratina_unlocked' },
    { toast: 'VOIDARCH settled. The chains are broken — the sky is mended.' },
  ],

  // ================= Stage S6: the legendary arcs' faces =================
  // Every face rides the catch-only chain (the J5 law): a flee or a
  // KO stalls it with nothing set, so each face re-fires until its
  // one-of-one is caught. Gates: the sysLoadMap S6 block.
  ev_sinnoh_uxie: [
    { say: ['Insight Cavern is colder inside than the lake above it, and quieter than either — a held thought of a room. At its heart the ice simply... decides to have a tenant.', 'LORACLE rises out of the stillness with its eyes closed, the way it has risen for everyone who ever truly needed to know something: unhurried, ungiving, complete. The being of knowledge does not offer answers. It offers a battle — the one examination it has ever set.'], who: '' },
    { panel: 'insight-loracle' },
    { arc: 'arc_uxie', stage: 'active' },
    { wildBattleCatch: { species: 'uxie', level: 370, legendary: true } },
    { arc: 'arc_uxie', stage: 'complete' },
    { flag: 'arc_uxie_done' },
    { toast: 'LORACLE is yours. The cavern keeps what it knows — it just shares the address now.' },
  ],
  ev_sinnoh_azelf: [
    { say: ['Gallant Cavern still smells faintly of hot stone from the day the lake was blown half skyward — and at its heart, where the water runs decision-coloured, something has come home to the ruin of its house and stayed anyway.', 'VOLITAR. The being of willpower, hovering over the scarred water with its chin up in a way that makes the whole cavern feel like a held chin too. It does not forgive the region. It does something harder: it stays, and it tests the hand that mended the sky. Yours.'], who: '' },

    { panel: 'gallant-volitar' },
    { arc: 'arc_azelf', stage: 'active' },
    { wildBattleCatch: { species: 'azelf', level: 370, legendary: true } },
    { arc: 'arc_azelf', stage: 'complete' },
    { flag: 'arc_azelf_done' },
    { toast: 'VOLITAR is yours. The lake, the wardens say, sat a degree straighter in its banks that evening.' },
  ],
  // EMPATHIS I: the meeting at Candor Cavern — she does not stay.
  ev_sinnoh_mesprit_meet: [
    { say: ['Candor Cavern keeps its small heart of sky-less water — and today the water has company. EMPATHIS turns above it in slow circles, crowned, pink as a held breath, watching you the way weather watches a window.', 'You step forward. She steps — elsewhere. Not fleeing: DECLINING, with the ancient courtesy she showed the grey boats, and a look back over one shoulder that is not fear at all. It is an itinerary. The being of emotion does not wait in caves. It visits. Catching up with it is the whole of the test — walk Borea, and be somewhere she lands.'], who: '' },
    { arc: 'arc_mesprit', stage: 'active' },
    { flag: 'mesprit_roaming' },
    { toast: 'EMPATHIS slipped away — she is roaming Borea now.' },
  ],
  // EMPATHIS II: the roaming face (the Latias precedent — her landing
  // is a pure function of the persisted step counter).
  ev_sinnoh_mesprit: [
    { say: ['The light here has a pink edge it did not have a moment ago — and then the air simply admits she is in it: EMPATHIS, hanging a wingspan away, considering you with the unafraid calm of a creature who has never once been anywhere she did not choose to be.', 'She chose this. Remember that: the chase was hers, the landing is hers, and the battle — the battle she is offering like a hand held out. Take it honestly.'], who: '' },
    { panel: 'candor-empathis' },
    { arc: 'arc_mesprit', stage: 'active' },
    { wildBattleCatch: { species: 'mesprit', level: 370, legendary: true } },
    { arc: 'arc_mesprit', stage: 'complete' },
    { flag: 'arc_mesprit_done' },
    { toast: 'EMPATHIS is yours. The lake that feels has a feeling with your name on it now.' },
  ],
  ev_sinnoh_dialga: [
    { say: ['Zenith Spire, after everything: the broken pillars, the whole sky, and a stillness with a heartbeat in it — slow, enormous, older than the mountain it stands on. The heartbeat resolves into a shape. Blue steel. A crest like a sundial made of decisions.', 'CHRONARCH regards you out of the deep places of time it returned to when the chain broke — free, alive, and, in the way of gods who owe a trainer a debt, findable. The debt is not paid by kneeling. It is paid by standing. Stand, then.'], who: '' },
    { panel: 'spire-chronarch' },
    { arc: 'arc_dialga', stage: 'active' },
    { wildBattleCatch: { species: 'dialga', level: 388, legendary: true } },
    { arc: 'arc_dialga', stage: 'complete' },
    { flag: 'arc_dialga_done' },
    { toast: 'CHRONARCH is yours. Somewhere, very faintly, a clock you have never heard decides to keep your time too.' },
  ],
  ev_sinnoh_palkia: [
    { say: ['The pillar keeps its appointments in order, and the second appointment makes the sky feel... roomy. Space takes a breath and steps aside in the middle, and COSMARCH is standing in the space it stepped out of — pearl-bright, patient, enormous in a way that has nothing to do with size.', 'It came back to the pillar the way its twin did: unchained, unhurried, curious about the one pair of hands that broke red light. The examination is the same. The examiner is not. Answer it.'], who: '' },
    { panel: 'spire-cosmarch' },
    { arc: 'arc_palkia', stage: 'active' },
    { wildBattleCatch: { species: 'palkia', level: 388, legendary: true } },
    { arc: 'arc_palkia', stage: 'complete' },
    { flag: 'arc_palkia_done' },
    { toast: 'COSMARCH is yours. The summit air feels wider on the way down, as if it is making room for you out of respect.' },
  ],
  // VOIDARCH: the post-game lair is REVERSAL CAVE (the recorded S6
  // call — the Griseous Orb's chamber lives there, and Platinum's
  // post-game tenant is Turnback's; the Mirrorworld platform
  // is NOT a second trigger for the same one-of-one).
  ev_sinnoh_giratina: [
    { say: ['Reversal Cave leans its silence toward you harder than it ever has — because today the silence has a shape in it. Beyond the Griseous chamber, where the floor is not entirely floor, the dark stands up in gold and smoke and six-legged patience.', 'VOIDARCH did not forget the platform, trainer. Gods of banished places keep excellent ledgers, and yours is the only name in this one written in anything but grievance. It settles, and waits to see whether the answer you gave Severin was the whole of you. Show it the rest.'], who: '' },
    { panel: 'reversal-voidarch' },
    { arc: 'arc_giratina', stage: 'active' },
    { wildBattleCatch: { species: 'giratina', level: 392, legendary: true } },
    { arc: 'arc_giratina', stage: 'complete' },
    { flag: 'arc_giratina_done' },
    { toast: 'VOIDARCH is yours. Reversal Cave exhales, slow as a held note allowed to end.' },
  ],
  // MAGMARCH I: the accompaniment — Buck, the stone, the socket.
  ev_sinnoh_magma_stone: [
    { say: ['Birk keeps pace up the crater hall like a man walking a fence line he owns: unhurried, proprietary, pointing with his chin. "There. You can feel it through your boots first. The socket."', 'At the hall\u2019s heart the lava floor is wrong in one place: a round scar, stone-dust pale, and beside it — rolled half a room away by whatever hands thought a volcano was a cupboard — the Magma Stone. It is warm. It has never not been warm. Between you, you lift it the way you would lift a sleeping animal: carefully, and with respect for the teeth.'], who: 'BIRK' },
    { say: ['It goes back into its socket with a sound like a held chord resolving. The hall seems to... unclench. "That\u2019s the mountain\u2019s temper back where it belongs," Birk says, deeply satisfied. "Mind you — a stone returned is a bell rung, down where HE sleeps. He\u2019ll want to see who rang it. Come back up, trainer. Not today. He wakes slow, like everything honest."'], who: 'BIRK' },
    { arc: 'arc_heatran', stage: 'active' },
    { flag: 'magma_stone_returned' },
    { toast: 'The Magma Stone is returned — something deep has begun, slowly, to wake.' },
  ],
  // MAGMARCH II: the revisit — the tenant, woken.
  ev_sinnoh_heatran: [
    { say: ['The Crater Hall is hotter than you left it — honestly hotter, the way a forge is honest. The stone glows at the edges like a coal that has remembered something. And the lava floor at the hall\u2019s heart is not a floor anymore. It is a back. Rising.', 'MAGMARCH comes up out of its own mountain the way grievances come up out of old ground: slowly, and with total conviction. It looks at the returned stone. It looks at the hands that returned it. The examination begins.'], who: '' },
    { panel: 'crater-magmarch' },
    { arc: 'arc_heatran', stage: 'active' },
    { wildBattleCatch: { species: 'heatran', level: 375, legendary: true } },
    { arc: 'arc_heatran', stage: 'complete' },
    { flag: 'arc_heatran_done' },
    { toast: 'MAGMARCH is yours. The crater settles back to its long, warm patience.' },
  ],
  ev_sinnoh_regigigas: [
    { say: ['The deep room of Rimefall Temple has waited since the lake froze the first time — and today it does not wait alone. Three small giants stand in your party\u2019s light, and the dais at the room\u2019s heart answers them the way deep water answers a dropped stone: slowly, and then all at once.', 'The statue is not a statue. It never was. COLOSSOR unfolds out of ten thousand years of stillness joint by joint, moss and patience falling away, until the continent-mover stands at the height the room was built for and looks down — at its three, and at the trainer they chose to follow here. That choice is the only key this door ever had. It has turned. Defend it.'], who: '' },
    { panel: 'temple-colossor' },
    { arc: 'arc_regigigas', stage: 'active' },
    { wildBattleCatch: { species: 'regigigas', level: 380, legendary: true } },
    { arc: 'arc_regigigas', stage: 'complete' },
    { flag: 'arc_regigigas_done' },
    { toast: 'COLOSSOR is yours. The temple, wardens say, is one degree warmer than it has ever been.' },
  ],
  // LUNACYGN I: the meeting at Brightmoon — she does not stay either.
  ev_sinnoh_cresselia_meet: [
    { say: ['Brightmoon Island, and the pond keeping the moon\u2019s shape out of loyalty — and this time, when the pond\u2019s light stands up, it does not settle back into a feather. LUNACYGN rises whole: crescent-winged, dawn-pink ribbons trailing, regarding you with the patience of a lighthouse that has decided to move.', 'She provided once, for a sleeping boy. For herself she provides differently: a circuit of the region\u2019s night roads — Routes 218, 219, 221, 223 and 230, walked at her pace and met at yours. The antidote does not sit in a shrine, trainer. It travels. So travel.'], who: '' },
    { arc: 'arc_cresselia', stage: 'active' },
    { flag: 'cresselia_roaming' },
    { toast: 'LUNACYGN took to her crescent trail — she is roaming Borea now.' },
  ],
  // LUNACYGN II: the roaming face (the shared step-counter idiom).
  ev_sinnoh_cresselia: [
    { say: ['The light here goes crescent at the edges — and then she is simply in it, the way moonrise is in a clear sky: LUNACYGN, hanging above the road with her ribbons moving in a wind that is entirely hers.', 'For every nightmare there is an antidote, and the antidote has stopped running — not cornered, never cornered. Choosing. The choice, apparently, is a battle, fought in good dreams\u2019 name. Accept it gently.'], who: '' },
    { panel: 'crescent-lunacygn' },
    { arc: 'arc_cresselia', stage: 'active' },
    { wildBattleCatch: { species: 'cresselia', level: 372, legendary: true } },
    { arc: 'arc_cresselia', stage: 'complete' },
    { flag: 'arc_cresselia_done' },
    { toast: 'LUNACYGN is yours. Sleep, all over Borea, runs a little deeper tonight.' },
  ],
  // NOCTARCH: the inn event. The locked harbour inn opens only for
  // the Conference's finisher (sinnoh_complete) with the boy already
  // woken (darkrai_unlocked); the sleep itself is the ferry. No
  // distribution item exists — the key is the event, by flag.
  ev_sinnoh_darkrai_inn: [
    { say: ['The harbour inn at Bridgeport has kept its best room locked for fifty years — one guest, the old keepers say, who never checked in and never left. Tonight the keeper looks at you — the hand that carried the Lunar Wing — and takes a key off its hook without a word.', '"Room\u2019s yours," she says. "Mind the dreams. They\u2019re local." The bed is narrow, the pillow cold, and the dark at the window not entirely the night\u2019s. You sleep the way sailors sleep before weather: completely, and on purpose.'], who: '' },
    { flag: 'darkrai_inn_done' },
    { say: ['The dream has a shoreline. Black water, a pond that reflects nothing the sky admits to, and trees that grow toward the water as if listening. You know this island. You have simply never arrived at it from inside a sleeping head before.', 'Darkmoon Island. And at its heart the dark shape that stood over a sailor\u2019s boy\u2019s bed for a month stands over its own — patient as debt, and considerably less patient about you.'], who: '' },
    { panel: 'inn-noctarch' },
    { warp: { map: 'newmoon-island', x: 11, y: 11 } },
    { arc: 'arc_darkrai', stage: 'active' },
    { wildBattleCatch: { species: 'darkrai', level: 378, legendary: true } },
    { arc: 'arc_darkrai', stage: 'complete' },
    { flag: 'arc_darkrai_done' },
    { toast: 'NOCTARCH is yours. You wake in the inn room, and the pillow is warm, and the dreams are only dreams.' },
  ],
  // NOCTARCH: the face alone, for re-fires after a fled/failed inn
  // night (the entry gate stands on darkrai_inn_done).
  ev_sinnoh_darkrai: [
    { say: ['The pond that reflects nothing has company, and the company has been waiting with the patience of the place itself. NOCTARCH unfolds out of the island\u2019s own dark — not attacking, not fleeing: presenting itself, the way a debt presents itself. Here to be settled.'], who: '' },
    { panel: 'darkmoon-noctarch' },
    { arc: 'arc_darkrai', stage: 'active' },
    { wildBattleCatch: { species: 'darkrai', level: 378, legendary: true } },
    { arc: 'arc_darkrai', stage: 'complete' },
    { flag: 'arc_darkrai_done' },
    { toast: 'NOCTARCH is yours. Darkmoon Island, for the first time in fifty years, sounds like an ordinary island at night.' },
  ],
  ev_sinnoh_shaymin: [
    { say: ['Petal Paradise lives past its billing the way shrines do: quietly, and completely — a meadow at the end of the sea road, in bloom past all reason. The letter in your bag seems to weigh less here. The flowers seem to weigh more. Gratitude does that to a place.', 'At the meadow\u2019s heart the bloom moves against the wind — and a small green shape with a flower on either ear lifts its head out of the blossom, considers you with total unafraid calm, and makes the decision the Gracidea field made in Honeyfield: an appointment, kept. GRATHOG. The Gratitude Kin, in its own house, offering the house\u2019s one examination. Pass it gently.'], who: '' },
    { panel: 'paradise-grathog' },
    { arc: 'arc_shaymin', stage: 'active' },
    { wildBattleCatch: { species: 'shaymin', level: 374, legendary: true } },
    { arc: 'arc_shaymin', stage: 'complete' },
    { flag: 'arc_shaymin_done' },
    { toast: 'GRATHOG is yours. Somewhere behind you, unnoticed, the whole meadow blooms a second time.' },
  ],
  ev_sinnoh_spiritomb: [
    { say: ['The Sealed Keystone leaves your hands the way warm things leave cold ones — reluctantly, and then all at once — and seats itself into the Weathered Tower\u2019s stones like it was always the mortar. The tower... clears its throat. A sound with far too many voices in it, arriving at one word by committee.', 'One hundred and eight grudges, pressed into one cracked stone for longer than the road has had a name — and the stone has just been handed back its address. CENTWISP rises out of the keystone the way smoke rises out of a green fire: in spirals, in faces, in a grin that arrives several expressions before the rest of it. It was not summoned lightly. It will not leave early. Neither, it has decided, will you.'], who: '' },
    { panel: 'keystone-centwisp' },
    { arc: 'arc_spiritomb', stage: 'active' },
    { wildBattleCatch: { species: 'spiritomb', level: 365, legendary: true } },
    { arc: 'arc_spiritomb', stage: 'complete' },
    { flag: 'arc_spiritomb_done' },
    { toast: 'CENTWISP is yours. The tower keeps its silence again — a quieter count of it, this time.' },
  ],
  // Arc 4 Stage S7: the PRIMARCH capstone. The stairs event is a
  // ceremony, not a battle: entering Zenith Spire with the finale's
  // unlock standing, the Azure Flute answers by itself and the way
  // up opens (arceus_stairs_open). The face itself waits in the
  // Hall of Dawning and rides the same catch-only chain as every
  // one-of-one (flee AND KO re-fire; nothing dex-locks).
  ev_sinnoh_arceus_stairs: [
    { say: ['The Zenith Flute is warm before your hands ever reach it. At the pillar\u2019s broken heart, where the sky was chained and unchained, the little glass flute lifts its own note out of your bag — one clear sound, older than the mountain, that the stones answer like a name they were waiting to be called by.', 'And the sky, politely, builds stairs. Light laid over light, rising past the pillar\u2019s crown to a doorway that was always there and never open: the Hall of Dawning, the first room, above the top of the world. Whatever waits up there has waited since before waiting had a word. It can wait for you to climb.'], who: '' },
    { flag: 'arceus_stairs_open' },
    { toast: 'The Zenith Flute sang — and the stairs to the Hall of Dawning stand open above Zenith Spire.' },
  ],
  ev_sinnoh_arceus: [
    { say: ['The Hall of Dawning is not grand the way temples are grand. It is quiet the way the moment before a first word is quiet — a floor of pale light above all the weather there is, and at its centre, the shape every creation story starts with and none of them finish describing.', 'PRIMARCH regards you the way the sea regards a swimmer who crossed it honestly: without surprise, and without rescue. Everything on the road below — the lakes, the chains, the world behind the world — was, in some old sense, this one\u2019s to lend. It has come to see what the borrower made of the loan. Show it the whole road, trainer. All of it. It will know if you leave any out.'], who: '' },
    { panel: 'hall-primarch' },
    { arc: 'arc_arceus', stage: 'active' },
    { wildBattleCatch: { species: 'arceus', level: 400, legendary: true } },
    { arc: 'arc_arceus', stage: 'complete' },
    { flag: 'arc_arceus_done' },
    { toast: 'PRIMARCH is yours. Below the Hall, unnoticed by anyone, the whole world goes on — which was rather the point of it.' },
  ],
};

// ---------------------------------------------------------------------------
// SINNOH_LEGENDARY_ARCS — Stage S6. The thirteen Borea legendary
// arcs (a fourteenth, the PRIMARCH capstone, is appended by Stage S7),
// folded into LEGENDARY_ARCS by merge.mjs (the Yamato/Maris
// fold idiom); the live entries supersede the story-kanto designed
// stubs (CHRONARCH/COSMARCH/VOIDARCH key ONLY on sinnoh_climax_resolved
// per decision 9; COLOSSOR' gate is the three Regis' party
// presence, read live by its handler). Laws: every face rides
// { wildBattleCatch } (flee AND KO re-fire, nothing dex-locks) —
// CLIONARCH's "face" is an egg hatching; levels in band (CENTWISP
// 365, lake trio 370, LUNACYGN 372, GRATHOG 374, MAGMARCH 375,
// NOCTARCH 378, COLOSSOR 380, CHRONARCH/COSMARCH 388, VOIDARCH 392,
// CLIONARCH hatching at the floor 301); EMPATHIS + LUNACYGN roam on
// the Latias precedent (pure step-counter function, no new state).
// ---------------------------------------------------------------------------
export const EMPATHIS_LANDINGS = ['r201', 'r205', 'r210', 'r215', 'r222'];
export const LUNACYGN_LANDINGS = ['r218', 'r219', 'r221', 'r223', 'r230'];
export function roamLanding(stepsTotal, landings) {
  return landings[Math.floor((stepsTotal || 0) / 50) % landings.length];
}
// The Hallowed Tower (CENTWISP's site): a faced-rock object on
// Route 209 at (14,6), west of the Forsaken Tower — placed by this data
// spot + the sysInteract handler (the shipped object-append idiom;
// the generated maps9 rows are not edited).
export const HALLOWED_TOWER = { map: 'r209', x: 14, y: 6 };

export const SINNOH_LEGENDARY_ARCS = {
  arc_uxie: {
    id: 'arc_uxie', title: 'The Lake That Knows', species: 'uxie', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'Lake Insight is too still. Its guardian holds every memory of the region — and since the sky mended, it has been deciding whether the trainer who mended it is worth keeping.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — the lake spirits only face the trainer who answered VOIDARCH', flag: 'sinnoh_climax_resolved' },
      { text: 'Enter Insight Cavern at Lake Insight\u2019s heart and face LORACLE, level 370', catch: 'uxie' },
    ],
    lair: 'lake-acuity-cave',
  },
  arc_azelf: {
    id: 'arc_azelf', title: 'The Lake That Wills', species: 'azelf', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'Lake Gallant took the worst of the crisis and its guardian took it personally. What was taken by force has come home — and willpower, the wardens say, answers willpower.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — VOLITAR only faces the trainer who ended the counting of the lakes', flag: 'sinnoh_climax_resolved' },
      { text: 'Enter Gallant Cavern at Lake Gallant\u2019s heart and face VOLITAR, level 370', catch: 'azelf' },
    ],
    lair: 'lake-valor-cave',
  },
  arc_mesprit: {
    id: 'arc_mesprit', title: 'The Lake That Feels', species: 'mesprit', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'Lake Candor\u2019s guardian does not wait in its cavern. It runs — courteously, deliberately, entirely on purpose. Understanding why that is the test IS the test.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — she only visits a region whose sky is a sky again', flag: 'sinnoh_climax_resolved' },
      { text: 'Meet EMPATHIS at Candor Cavern, at Lake Candor\u2019s heart — she will not stay', flag: 'mesprit_roaming' },
      { text: 'Meet EMPATHIS, level 370, where she lands — her landings turn with your walking: Routes 201, 205, 210, 215 and 222, in turn', catch: 'mesprit' },
    ],
    lair: 'sinnoh-routes',
  },
  arc_dialga: {
    id: 'arc_dialga', title: 'The Pillar of Time', species: 'dialga', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'The chained god of time stood unchained for one held second at Zenith Spire, looked at the trainer who broke its chains — and was gone, like a candle deciding to be a star instead. Stars can be revisited.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — CHRONARCH\u2019s catch keys on the mended sky alone, nothing else', flag: 'sinnoh_climax_resolved' },
      { text: 'Return to Zenith Spire and face CHRONARCH, level 388', catch: 'dialga' },
    ],
    lair: 'spear-pillar',
  },
  arc_palkia: {
    id: 'arc_palkia', title: 'The Pillar of Space', species: 'palkia', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'Space folded wrong over Mt. Apex once, like a map crumpled by an unseen hand. The hand that uncrumpled it is invited back to the pillar — second, the way the appointments were always kept.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — COSMARCH\u2019s catch keys on the mended sky alone, nothing else', flag: 'sinnoh_climax_resolved' },
      { text: 'Face CHRONARCH first — the pillar keeps its appointments in order', flag: 'arc_dialga_done' },
      { text: 'Return to Zenith Spire and face COSMARCH, level 388', catch: 'palkia' },
    ],
    lair: 'spear-pillar',
  },
  arc_giratina: {
    id: 'arc_giratina', title: 'The World Behind the Waterfall', species: 'giratina', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'The banished one settled its audience on a platform of black glass and let the tear in the sky still. But Reversal Cave — where the Griseous Orb keeps its chamber — is its house on this side of the world.',
    steps: [
      { text: 'Resolve the Zenith Spire climax — answer VOIDARCH on the platform first', flag: 'sinnoh_climax_resolved' },
      { text: 'Return to Reversal Cave, past Farewell Spring, and face VOIDARCH, level 392, beyond the Griseous chamber', catch: 'giratina' },
    ],
    lair: 'turnback-cave',
  },
  arc_heatran: {
    id: 'arc_heatran', title: 'The Mountain\u2019s Furnace', species: 'heatran', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'Grim Mountain breathes like a forge, and something has rolled the stone that keeps its temper halfway across its crater hall. A local named Birk knows the mountain\u2019s temper — and its tenant.',
    steps: [
      { text: 'Meet Birk in the Wildreach, at Grim Mountain\u2019s foot', flag: 'buck_met' },
      { text: 'Climb with Birk to the Crater Hall and return the Magma Stone to its socket', flag: 'magma_stone_returned' },
      { text: 'Return to the Crater Hall and face MAGMARCH, level 375 — a stone returned is a bell rung, and he wakes to answer it', catch: 'heatran' },
    ],
    lair: 'stark-interior',
  },
  arc_regigigas: {
    id: 'arc_regigigas', title: 'The One Who Moved Continents', species: 'regigigas', region: 'Borea',
    hook: 'Rimefall Temple\u2019s lowest floor sleeps a giant that three smaller giants once served. The statue is not a statue, and its only key is company: it wakes for the three, or not at all.',
    steps: [
      { text: 'Bring PETRAGOLEM, CRYOGOLEM and SIDEROGOLEM WITH YOU, in your party, to Rimefall Temple — Maris\u2019s three tomb titans (the Dune Tomb, the Sea Tomb, the Iron Tomb)', flag: 'regi_trio_present' },
      { text: 'Descend to Rimefall Temple\u2019s depths and face COLOSSOR, level 380', catch: 'regigigas' },
    ],
    lair: 'snowpoint-temple-depths',
  },
  arc_cresselia: {
    id: 'arc_cresselia', title: 'The Feather of Good Dreams', species: 'cresselia', region: 'Borea',
    prereq: 'sinnoh_climax_resolved',
    hook: 'For every nightmare there is an antidote, and she keeps hers on an island shaped like the moon\u2019s other half — but the antidote does not sit in a shrine. It travels, on a crescent trail only the woken can follow.',
    steps: [
      { text: 'Take the Lunar Wing from LUNACYGN at Brightmoon Island and wake the sailor\u2019s son in Bridgeport', flag: 'lunar_wing_received' },
      { text: 'Resolve the climax, then return to Brightmoon Island and meet LUNACYGN — she will not stay', flag: 'cresselia_roaming' },
      { text: 'Meet LUNACYGN, level 372, where she lands — her landings turn with your walking: Routes 218, 219, 221, 223 and 230, in turn', catch: 'cresselia' },
    ],
    lair: 'sinnoh-routes',
  },
  arc_darkrai: {
    id: 'arc_darkrai', title: 'The Nightmare at the Inn', species: 'darkrai', region: 'Borea',
    hook: 'A locked inn in Bridgeport has had one guest for fifty years. The sailor\u2019s boy woke — and whatever stood over his bed has been noticed now, by the one trainer it cannot simply wait out.',
    steps: [
      { text: 'Wake the sailor\u2019s son with the Lunar Wing — let NOCTARCH learn your name first', flag: 'darkrai_unlocked' },
      { text: 'Finish the Lily of the Valley Conference — the inn only opens for the trainer the harbour watched finish it', flag: 'sinnoh_complete' },
      { text: 'Sleep at the harbour inn in Bridgeport (the house by the pier), and face NOCTARCH, level 378, where the dream ferries you: Darkmoon Island', catch: 'darkrai' },
    ],
    lair: 'newmoon-island',
  },
  arc_manaphy: {
    id: 'arc_manaphy', title: 'The Prince of the Sea Temple', species: 'manaphy', region: 'Borea',
    hook: 'An egg, blue as deep water, came in from a far sea in a Ranger\u2019s careful hands — and the Shingle lab has been keeping it warm, waiting for the one trainer the region would trust with a prince.',
    steps: [
      { text: 'Finish the Lily of the Valley Conference — the egg is entrusted only to the finished road', flag: 'sinnoh_complete' },
      { text: 'Collect the blue Egg from Professor Sorrel at the Shingle lab', flag: 'manaphy_egg_received' },
      { text: 'Walk with the Egg until it hatches: CLIONARCH, at the Borea band floor (level 301) — and breed it with MIMIBLOB at a Day-Care, and its egg hatches CLIONEA', catch: 'manaphy' },
    ],
    lair: 'rowan-lab',
  },
  arc_shaymin: {
    id: 'arc_shaymin', title: 'The Gratitude Bloom', species: 'shaymin', region: 'Borea',
    hook: 'A white-stone road north of the League ends in a flower field that only blooms for a thankful heart — and a letter in a famous hand is the field\u2019s only key.',
    steps: [
      { text: 'Finish the Lily of the Valley Conference — the letter is written only to the finished road', flag: 'sinnoh_complete' },
      { text: 'Receive Hawthorn\u2019s Letter from Professor Sorrel at the Shingle lab, where Hawthorn left it in trust', flag: 'oaks_letter_received' },
      { text: 'Walk the Foamline Path to Petal Paradise and face GRATHOG, level 374 — the Gracidea in Honeyfield\u2019s meadow will know its forme', catch: 'shaymin' },
    ],
    lair: 'flower-paradise',
  },
  arc_spiritomb: {
    id: 'arc_spiritomb', title: 'The Hundred and Eight', species: 'spiritomb', region: 'Borea',
    hook: 'A cracked keystone, cold in a way weather does not explain, and a ruined tower of stones on the Forsaken Tower road that has been holding its breath for a hundred years. Something in the stone is counting.',
    steps: [
      { text: 'Receive the Sealed Keystone from the traveller on Route 209, by the Forsaken Tower road', flag: 'odd_keystone_received' },
      { text: 'Face the Weathered Tower\u2019s stones on Route 209 (the weathered rock west of the Forsaken Tower) with the keystone in hand, and face CENTWISP, level 365', catch: 'spiritomb' },
    ],
    lair: 'r209',
  },
  // Arc 4 Stage S7: the fourteenth arc — the capstone, and the only
  // one gated on the FINALE rather than on any arc's completion:
  // its prereq flag (arceus_unlocked) is set by the finale
  // homecoming alone, so the arc cannot appear in any Quest Log
  // before the whole road has been walked home.
  arc_arceus: {
    id: 'arc_arceus', title: 'The Hall of Dawning', species: 'arceus', region: 'Borea',
    prereq: 'arceus_unlocked',
    hook: 'Above the oldest pillar in the world there is a first room, and in it the one who was present before the chains, before the lakes, before everything. It does not summon. It simply stops being unreachable — for exactly one trainer, the one the whole road was walked by.',
    steps: [
      { text: 'Walk the whole road home — the Zenith Flute is entrusted only at the finale, in Dawnwick, when every journey stands complete', flag: 'arceus_unlocked' },
      { text: 'Carry the Zenith Flute (it rides in your bag\u2019s key pocket) to Zenith Spire, atop Mt. Apex — play it where the sky was chained, and let it build the stairs', flag: 'arceus_stairs_open' },
      { text: 'Climb the stairs to the Hall of Dawning, above Zenith Spire, and face PRIMARCH, level 400', catch: 'arceus' },
    ],
    lair: 'hall-of-origin',
  },
};

// ---- Town Tales (ADR-025 §5): one per first-half settlement, in the
// JOHTO_TALES/HOENN_TALES data-driven idiom (offerLines / stageLines /
// finishLines + reward). Six of the nine pay this half's new keepsakes.
function sinnohTale(id, title, town, giver, stages, reward, rewardText, offerLines, stageLines, finishLines) {
  return { id, title, town, giver, stages, reward, rewardText, sinnohTale: true, offerLines, stageLines, finishLines };
}
export const SINNOH_TALES = {
  tale_sinnoh_twinleaf: sinnohTale('tale_sinnoh_twinleaf', 'The Ribbon in the Drawer', 'Clover Town', 'MOM’S NEIGHBOR ASHA',
    ['Ask young Tam by the pond about the ribbon box', 'Carry the word back to Asha'],
    { keepsake: 'dawnribbon' }, 'Daybreak Ribbon',
    ['You have Dara\'s look about you — no, her ROAD. She left this town with a ribbon case and a head full of stages, and her mother keeps the drawer she grew out of.', 'Her first ribbon box is still in it, and young Tam has been asking what a beginning looks like. Tell him, would you? Describe a first stage to a boy who has only seen the pond. Then come and tell me what he said.'],
    ['A ribbon box? From before DARA? ...Beginnings look small, don\'t they. Hers did too, once. That is — that is actually the whole secret, isn\'t it. Thank you. Tell Asha the pond approves.'],
    ['"The pond approves." Ha! That boy has been ready for a road for a year; he only needed the size of a beginning confirmed.', 'Take this — the Daybreak Ribbon, from her very first case. She sent it home with instructions: give it to someone whose road is still teaching them things. That is you, I think, champion or not.']),
  tale_sinnoh_sandgem: sinnohTale('tale_sinnoh_sandgem', 'Notes for the Professor', 'Shingle Town', 'LAB AIDE FERN',
    ['Ask Ana on the beach about the washed-up notebook', 'Return the word to Fern at the lab door'],
    { keepsake: 'starshard' }, 'Star Shard',
    ['One of the Professor\'s field notebooks went overboard on the Revelry crossing, and Ana the beachcomber swears the tide returned SOMETHING with writing in it.', 'Ask her what the water gave back. If it is his, the Professor will never admit he wants it. He has asked about the tide tables four times today.'],
    ['Oh, the tide gives back everything eventually — it is a gossip. A notebook, yes: swollen, sealed in a fisherman\'s oilskin, and inside — star charts. Hand-drawn. Somebody on that boat studies the sky the way sailors study weather: like it owes them money. Not the Professor\'s, love. Older hand than his.'],
    ['Star charts, in an older hand... Then it is from the Professor\'s own teacher\'s generation — the lab keeps a shelf for exactly this and admits it to no one.', 'For the errand: a Star Shard, out of the lab\'s specimen drawer. It fell before either of us was born and it still cuts starlight. The Professor pretends not to keep treasures. He keeps them in drawers, like everyone.']),
  tale_sinnoh_jubilife: sinnohTale('tale_sinnoh_jubilife', 'The Intern\'s Scoop', 'Revelry City', 'BROADCAST INTERN VESK',
    ['Ask Moss in the plaza what the cameras missed', 'Bring the quote back to Vesk'],
    { items: { superpotion: 2 } }, '2 Super Potions',
    ['I am THIS close to a staff job, and my segment is "the city, unscripted" — except the city keeps scripting itself whenever my camera is off.', 'Moss in the plaza saw the thing with the meteor-logo people and the TV station steps. Get me the quote, trainer. A real one. My editor can smell invented quotes through walls.'],
    ['The logo people? Sure, I saw them. Polite as bankers, asking the station about BROADCAST RANGES and old signal towers, then photographing the skyline like they were measuring it for a frame. Weirdest part? They bowed to the building when they left. Like it was already theirs. Quote me exactly, I dare you.'],
    ['"Like it was already theirs." — that is a quote with TEETH. The segment leads with it, and the staff job has my name in pencil by Friday.', 'Two Super Potions from the station\'s first-aid sponsorship. Off the record: watch the sky with those people, trainer. Nobody measures a skyline they do not intend to keep.']),
  tale_sinnoh_oreburgh: sinnohTale('tale_sinnoh_oreburgh', 'The Miner\'s Lunchbox', 'Coalseam City', 'MINER BRAM',
    ['Ask Sol at the museum about the sealed seam', 'Carry the word back to Bram at the pit gate'],
    { keepsake: 'coalseamcharm' }, 'Coal Seam Charm',
    ['Thirty years I have dug this mountain, and last week the seam gave us a lunchbox. Sealed in coal dust since before the gym was built, with a name scratched on it none of the old crew can read.', 'Sol at the museum reads old hands for a living. Ask her whose lunchbox the mountain kept. A man should know whose shift he is finishing.'],
    ['The name? Oh, I can read it — it is in the old pit shorthand, where every miner signed with his seam-mark. This one belonged to the FIRST foreman of Coalseam, the man who sank the original shaft. The box held a charm, trainer, for the man who would one day dig deepest. He left it as a wager with the mountain.'],
    ['The first foreman. Then the mountain has been holding a wager for a hundred years, and last week it paid out to MY shift.', 'The charm is yours — the Coal Seam Charm, by the foreman\'s own wager: it belongs to whoever digs deepest, and today that is a trainer who dug up the truth of it. Wear it low, where the seams run.']),
  tale_sinnoh_eterna: sinnohTale('tale_sinnoh_eterna', 'The Statue\'s Shadow', 'Heritage City', 'HISTORIAN ILSE',
    ['Ask the statue keeper what the shadow points at', 'Return the reading to Ilse'],
    { keepsake: 'meadowcord' }, 'Meadow Cord',
    ['The great statue in our square is older than the city, and at noon its shadow points at something the plaza stones were cut to hide. I have measured it for years. I am too old to go prying at paving.', 'The keeper knows the hour and the mark. Ask him what the shadow touches, trainer, and I will finally finish a footnote I have been writing for a decade.'],
    ['At noon? The shadow\'s hand rests on the third stone from the fountain — the one with the cord-marks, where the festival dancers used to tie the meadow cords. My grandfather swore the statue was built as a sundial for a festival nobody remembers. The mark is real, scholar\'s honor. I sweep around it.'],
    ['A sundial for a forgotten festival — the footnote is finished, and it is a chapter. Heritage was celebrating this valley before it was ever a city.', 'The Meadow Cord is yours — the keeper\'s family has held the festival cords for six generations, and this one, he says, wants a road instead of a drawer. It smells of grass. Everything true here does.']),
  tale_sinnoh_hearthome: sinnohTale('tale_sinnoh_hearthome', 'Auntie\'s Poffin Tin', 'Inglenook City', 'CONTEST AUNTIE ROSA',
    ['Ask Masa at the poffin house about the lost tin', 'Bring the word back to Rosa by the hall'],
    { keepsake: 'ribbonclasp' }, 'Ribbon Clasp',
    ['Forty years my poffins have fed this city\'s contestants, and my GRANDMOTHER\'S tin — the one with the clasp like a ribbon — has walked out of my kitchen.', 'Masa at the poffin house was the last to borrow it. Ask her where my tin has gone, and do not accept "the oven ate it." Ovens in Inglenook are professionals.'],
    ['The tin? Oh, stars, I have been carrying it in my apron for a WEEK, meaning to return it and fearing the scolding more each day. It is safe, it is polished, and the delay is entirely cowardice. Tell her... tell her the poffins this week were her recipe, and the hall noticed.'],
    ['A week in an apron, and my recipe carrying the hall. That girl is my successor and my punishment in one apron.', 'The Ribbon Clasp, then — off my own first contest case. You have ferried one cook\'s courage today, trainer. The clasp goes to a road that still has stages on it.']),
  tale_sinnoh_solaceon: sinnohTale('tale_sinnoh_solaceon', 'The Day-Care Egg Ledger', 'Repose Town', 'DAY CARE LADY UNA',
    ['Ask Ossa the ruin delver about the ledger stone', 'Return the reading to Una'],
    { keepsake: 'ruinbell' }, 'Ruin Bell',
    ['Our day-care keeps an egg ledger older than the town — every egg, every family, in my grandmother\'s hand. The first page refers to a "ledger stone" in the ruins, and I have never dared the dark to read it.', 'Ossa delves those halls weekly and fears nothing with a roof on it. Ask her what the stone says. A ledger should know its own first page.'],
    ['The ledger stone? Read it years ago, in torchlight, with the GLYPHEYE watching like examiners. It says the ruins were a day-care FIRST — a place where the old people raised young Kin among the stones, and the bells they used to call them home are still down there. One hangs by the carved chamber. It rings for whoever the ruins approve of.'],
    ['A day-care, before it was a ruin. Then my grandmother\'s ledger is a thousand pages long and most of them are stone. I shall copy that into the front, in my best hand.', 'And the bell approves of errands, it seems — the Ruin Bell is yours. Ossa brought it up this morning without a word, which from Ossa is a speech. It rings quiet. The ruins prefer it so.']),
  tale_sinnoh_veilstone: sinnohTale('tale_sinnoh_veilstone', 'The Clerk\'s Meteor', 'Shardfall City', 'DEPT CLERK VEE',
    ['Ask the meteor watcher about the fallen stone', 'Bring the word back to Vee at the store'],
    { items: { hyperpotion: 1 } }, 'Hyper Potion',
    ['Everyone shops here for the meteor story, nobody for the truth of it: a stone fell east of the city in my grandfather\'s time, and a watcher still keeps its crater like a garden.', 'Ask him what the stone actually is. My break is in ten minutes and I have wondered for six years. Six years, trainer. Put a price on THAT.'],
    ['What is it? A stone that fell out of a clear sky in my grandfather\'s spring, hit soft, and has been faintly WARM ever since — and things that orbit it in the stories are only stories. The truth is better: it dreams, trainer. Instruments hear it. A slow beat, like a heart that has not decided to wake. I keep the grass off it. That is the whole priesthood.'],
    ['"A heart that has not decided to wake." Six years of wondering, and the answer was worth every shift of it.', 'A Hyper Potion, from the store\'s own shelf, charged to my curiosity account. If that stone ever does decide, trainer — I hope it decides on a day you are in Shardfall.']),
  tale_sinnoh_floaroma: sinnohTale('tale_sinnoh_floaroma', 'Honey for the Road', 'Honeyfield Town', 'FLORIST WREN',
    ['Ask Orin the beekeeper about the meadow\'s slow spring', 'Carry the word back to Wren'],
    { items: { fullheal: 2 } }, '2 Full Heals',
    ['The meadow is late this year — the flowers are holding their breath, and a florist notices breath. My beds are fine. It is the WILD meadow that is slow.', 'Orin\'s bees read the meadow better than any instrument in Revelry. Ask him what the bees are waiting for. If it is the wind-works\' trouble, I want to know before the wind does.'],
    ['The bees are waiting on the wind, love — the works went quiet for days and the whole valley\'s air forgot its directions. Bees navigate by a map written in moving air. It is redrawn now, and the meadow will open within the week. Tell Wren the spring was delayed, not cancelled. Bees are never wrong about spring. Only early, or honest.'],
    ['Delayed, not cancelled. I shall put that on the shop sign and charge the season for the wisdom.', 'Two Full Heals, from the shop\'s road-stock — Honeyfield pays its messengers in remedies and flowers, and the flowers, as established, are late.']),
  // ---- Stage S5b: the second half's tales ----
  tale_sinnoh_pastoria: sinnohTale('tale_sinnoh_pastoria', 'The Charm in the Reeds', 'Fenland City', 'MARSH GUIDE SOLENNE',
    ['Ask Bog Kid Mire where the old fen charm was lost', 'Carry the word back to Solenne at the marsh gate'],
    { keepsake: 'fencharm' }, 'Fen Charm',
    ['Every marsh guide carries a fen charm — reed-woven, lake-blessed, older than the gym. Mine went into the reeds in the spring flood, and the marsh gives things back only to people it approves of.', 'Young Mire knows every reed bed in the Great Mire and owes the water no explanations. Ask him where lost things surface. If the marsh approves of the asking, trainer, it approves of you.'],
    ['Where do lost things surface? At the third reed bed past the sunken fence, when the water drops — everybody knows that except grown-ups. I found a charm there last week, woven one. I was keeping it for luck, but... the marsh said give it back. The marsh talks, you know. Mostly it says things like that.'],
    ['The third reed bed, and the marsh returning what the flood took — that is the whole of Fenland in one errand, trainer.', 'The Fen Charm is yours. The marsh has decided you are one of its errands now, which in Fenland is citizenship. Wear it low, where the water runs.']),
  tale_sinnoh_celestic: sinnohTale('tale_sinnoh_celestic', 'The Bell That Rings Downhill', 'Astral Town', 'SHRINE ELDER UME',
    ['Ask Historian Blythe what the shrine bell\'s inscription says', 'Return the reading to Elder Ume at the shrine'],
    { keepsake: 'shrinebell' }, 'Shrine Bell',
    ['Our shrine bell is older than the town, and its inscription is in the first writing — the kind that is half picture, half prayer. I have rung it for sixty years without once knowing what I was saying.', 'Blythe reads the old stones for the museum. Ask her what the bell has been saying, trainer. A woman should know her own longest sentence.'],
    ['The bell? Oh, I have crawled over that inscription with a lamp, Elder-bound. It is not a prayer TO the gods of time and space. It is a prayer FOR them — that they be left alone, in the old phrase, "to keep their own counsel and their own sky." Whoever cast that bell knew exactly what men would one day try with chains. It is a warning shaped like a blessing.'],
    ['A warning shaped like a blessing, rung by my hands for sixty years. Then the bell has been standing guard all along, and I its keeper without knowing. A good shape for a life to have taken.', 'Take the Shrine Bell — the small one, from the offering shelf. Ring it where the sky feels thin, trainer. Ring it kindly.']),
  tale_sinnoh_snowpoint: sinnohTale('tale_sinnoh_snowpoint', 'The Petal in the Ice', 'Rimefall City', 'TEMPLE ACOLYTE REN',
    ['Ask Ice Fisher Solvi what she cut out of the lake ice', 'Bring the word back to Ren at the temple steps'],
    { keepsake: 'frostpetal' }, 'Frost Petal',
    ['The temple keeps a winter garden behind glass — flowers pressed in ice by the first acolytes, so the dark months remember colour. This winter the ice gave one back, and Solvi cut it out before the lake could change its mind.', 'Ask her what flower the lake has been keeping. The temple should know what it has been guarding.'],
    ['What did I cut out? A petal, trainer — one perfect petal, pink-white, in ice older than the temple, older than the town. Not frozen-dead. Frozen HELD. My grandfather swore the lake keeps a garden of its own down there, from a summer before there were people to name it. Gracidea, he called the flowers. Said they bloom for gratitude. The lake was grateful about something, once, for a hundred years.'],
    ['A Gracidea petal, held by the lake since before the town — then the temple\'s winter garden is a page torn from a much older book, and we are footnotes.', 'The Frost Petal goes with you — Solvi\'s word and the temple\'s blessing on it. It has waited in the ice a hundred years for a road, she says. Yours will do nicely.']),
  tale_sinnoh_sunnyshore: sinnohTale('tale_sinnoh_sunnyshore', 'The Coil in the Lighthouse', 'Brightshore City', 'LIGHTHOUSE KEEPER BLY',
    ['Ask Panel Tech Juniper what the lighthouse\'s spare coil is humming', 'Carry the word back to Bly at the lighthouse door'],
    { keepsake: 'beaconcoil' }, 'Beacon Coil',
    ['Forty years I have kept this light, and last month the spare coil in the lamp room started humming — on a shelf, unconnected, in key with the beacon. A keeper notices a thing like that the way sailors notice weather.', 'Juniper maintains every panel in this city and half the gym besides. Ask her what my coil is humming ABOUT. Coils in Brightshore have opinions, but they usually keep them electrical.'],
    ['The coil? Oh, it is not broken — it is TUNED. Rainer rebuilt the beacon\'s array last spring and the spare picked up the new frequency like a song it already knew. It hums when the gym\'s voltage climbs, keeper. It hums loudest on battle days. Your coil is not haunted, Bly. It is a fan.'],
    ['A fan. Forty years of keeping the light, and my lamp room has been cheering for the gym the whole season. Brightshore, trainer. Even the hardware has a favourite.', 'The Beacon Coil is yours — take it before it starts humming at your battles too. If it does... let it. A little extra voltage never decided a match, but it has started a few legends.']),
};
// Wave W9 (actor completion beat B1): when The Intern's Scoop
// completes, Vesk takes the staff job his finish line promises —
// "the staff job has my name in pencil by Friday" — and relocates
// from the plaza (11,7) to the Revelry TV station door's west flank
// (15,4; the door-front tile (16,4) stays clear so the entrance is
// never sealed). Fired by the tale-completion watcher (ACT layer);
// positions only — no dialogue or tale logic changes.
SINNOH_TALES.tale_sinnoh_jubilife.onComplete = [
  { actorMove: { who: 'broadcast-intern-vesk@jubilife', to: [15, 4] } },
];
// Wave S2 (quest integrity): the sinnohTale factory predates the
// `revelation` field the other regions' tales carry — without it, the
// Quest Log's completed-tale line rendered "Complete. undefined" for
// all thirteen Sinnoh tales (taleStageText appends tale.revelation).
// The denouements live here, one per tale, each drawn from that
// tale's own closing lines — no new lore, just the missing field.
const SINNOH_REVELATIONS = {
  tale_sinnoh_twinleaf: 'Dara\u2019s mother has kept the drawer all these years because beginnings are not outgrown \u2014 they are handed on, and Tam by the pond has stopped waiting for his to look bigger.',
  tale_sinnoh_sandgem: 'The washed-up notebook was never the Professor\u2019s \u2014 its star charts are in his own teacher\u2019s hand, and the lab keeps a secret shelf for exactly the things it will not admit to treasuring.',
  tale_sinnoh_jubilife: 'The meteor-logo people bowed to the TV station like it was already theirs \u2014 and thanks to one intern\u2019s quote with teeth, the whole city now watches its skyline back.',
  tale_sinnoh_oreburgh: 'The lunchbox was the first foreman\u2019s wager with the mountain, sealed in coal before the gym existed \u2014 and the mountain held it for a hundred years, until the deepest digger\u2019s shift came round.',
  tale_sinnoh_eterna: 'The statue was never only a monument \u2014 it is a sundial for a festival older than the city, and Heritage was celebrating this valley before it had streets.',
  tale_sinnoh_hearthome: 'The tin was never stolen \u2014 it spent a week in the apron of Rosa\u2019s successor, and the scolding she feared turned out to be an inheritance.',
  tale_sinnoh_solaceon: 'The ruins were a day-care before they were ruins \u2014 Una\u2019s grandmother\u2019s ledger is a thousand pages long, and most of them are stone.',
  tale_sinnoh_veilstone: 'The fallen stone is warm, and dreaming, and in no hurry \u2014 a heart that has not decided to wake, kept like a garden by a priesthood of one.',
  tale_sinnoh_floaroma: 'The meadow was never blighted \u2014 the bees were waiting for the wind-works\u2019 air to remember its directions, and a delayed spring is not a cancelled one.',
  tale_sinnoh_pastoria: 'Lost things surface at the third reed bed when the water drops \u2014 the marsh gives back only to people it approves of, and it decided the asking itself was the approval.',
  tale_sinnoh_celestic: 'The bell\u2019s inscription is not a prayer to the gods of time and space, but for them \u2014 a warning shaped like a blessing, rung unknowing for sixty years by its own keeper.',
  tale_sinnoh_snowpoint: 'The lake keeps a garden of its own beneath the ice, from a summer before there were people \u2014 and once, for a hundred years, it was grateful about something.',
  tale_sinnoh_sunnyshore: 'The spare coil was never haunted \u2014 it is tuned to the beacon\u2019s new frequency and hums loudest on battle days. In Brightshore, even the hardware has a favourite.',
};
for (const [taleId, revelation] of Object.entries(SINNOH_REVELATIONS)) SINNOH_TALES[taleId].revelation = revelation;

export const SINNOH_NPCS = [
  // Rowan, in his lab (his event is the entry scene; this is the man).
  { map: 'rowan-lab', name: 'PROF. SORREL', x: 8, y: 3, dir: 'down', art: 'scientist', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#c0c0c0', sinnoh: 'rowan', dialogue: ['Walk my region carefully, trainer. It is older than the League, and it keeps its evidence in stone.'] },
  // Dawn, at home in Clover.
  { map: 'twinleaf', name: 'DARA', x: 12, y: 10, dir: 'down', art: 'cast-dara', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', sinnoh: 'dawn_twinleaf', dialogue: ['Clover is home — the pond, the pines, Mom\'s cooking in the evening. Every road I have starts here.'] },
  // Barry, in Revelry, at speed.
  { map: 'jubilife', name: 'BARRY', x: 13, y: 10, dir: 'left', art: 'kid', skin: '#f0c8a0', shirt: '#e8a818', pants: '#2c3049', hair: '#2a1a0a', sinnoh: 'barry', dialogue: ['No time! No time at all! The gym road is THAT way and I am already behind myself!'] },
  // The commanders, holding their floors (their battles are events).
  { map: 'valley-windworks', name: 'COMMANDER VESPER', x: 8, y: 3, dir: 'down', art: 'cmd-windworks', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a2a3a', hair: '#8a2a4a', sinnoh: 'mars', dialogue: ['The wind is ours until it finishes singing, darling.'] },
  { map: 'galactic-eterna', name: 'COMMANDER NOVA', x: 8, y: 3, dir: 'down', art: 'cmd-eterna', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a2a3a', hair: '#8a2a4a', sinnoh: 'jupiter', dialogue: ['Everything in these rooms is already counted, child. Including you.'] },
  { map: 'galactic-hq', name: 'COMMANDER SORIN', x: 9, y: 3, dir: 'down', art: 'cmd-hq', skin: '#e8b888', shirt: '#3a3a4a', pants: '#2a2a3a', hair: '#2a2a4a', sinnoh: 'saturn', dialogue: ['This facility is not a destination, trainer. It is a door, and doors here open inward only.'] },
  // Paul, distributed on the spine.
  { map: 'eterna', name: 'STELLAN', x: 19, y: 10, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_eterna', dialogue: ['Still walking. Noted.'] },
  { map: 'hearthome', name: 'STELLAN', x: 20, y: 9, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_hearthome', dialogue: ['...'] },
  { map: 'veilstone', name: 'STELLAN', x: 21, y: 9, dir: 'down', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_veilstone', dialogue: ['Shardfall. My streets. You know why you are here.'] },
  // Reggie, the Shardfall breeder (an original analogue, not the anime's).
  { map: 'veilstone', name: 'REGGIE', x: 24, y: 13, dir: 'down', art: 'gent', skin: '#e8b888', shirt: '#4a5a4a', pants: '#2a2a3a', hair: '#6a6a6a', sinnoh: 'reggie', dialogue: ['I raise Kin the slow way, trainer — the way that takes the whole of a life and calls it quick.'] },
  // Dawn again, at her first Super Contest (the hall is NPC-free S3a;
  // she is this stage's one authored addition there).
  { map: 'contest-hearthome', name: 'DARA', x: 5, y: 7, dir: 'right', art: 'cast-dara', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', sinnoh: 'dawn_contest', dialogue: ['Deep breath. Stage lights. Okay. OKAY. Watch me, {player}.'] },
  // The leaders, at their gyms' hearts (Maris's (7,2) idiom).
  { map: 'gym-oreburgh', name: 'RONAN', x: 7, y: 2, dir: 'down', art: 'lead-oreburgh', skin: '#e8b888', shirt: '#50368e', pants: '#2a2a3a', hair: '#5a3a2a', sinnoh: 'roark', dialogue: ['Welcome to Coalseam Gym. Records are strata, trainer — show me the present tense.'] },
  { map: 'gym-eterna', name: 'TANSY', x: 7, y: 2, dir: 'down', art: 'lead-eterna', skin: '#f0c8a0', shirt: '#324a83', pants: '#2a2a3a', hair: '#2a4a2a', sinnoh: 'gardenia', dialogue: ['Everything in this gym grows, challenger, including the difficulty.'] },
  { map: 'gym-hearthome', name: 'ODILE', x: 7, y: 2, dir: 'down', art: 'lead-hearthome', skin: '#f0c8a0', shirt: '#6a3a8a', pants: '#2a2a3a', hair: '#c0a0d8', sinnoh: 'fantina', dialogue: ['A battle is an appeal performed at speed, darling. Show me your grace.'] },
  { map: 'gym-veilstone', name: 'MAREN', x: 7, y: 2, dir: 'down', art: 'lead-veilstone', skin: '#f0c8a0', shirt: '#c85a3a', pants: '#2a2a3a', hair: '#8a3a5a', sinnoh: 'maylene', dialogue: ['No speeches in this gym. Stance up.'] },
  // Gym rosters (base trainer path: `trainer:` + beaten-flag dialogue).
  { map: 'gym-oreburgh', name: 'MINER COLE', x: 4, y: 5, dir: 'right', art: 'hiker', skin: '#e8b888', shirt: '#833732', pants: '#2c3049', hair: '#3a2a1a', trainer: 'roark_miner1', dialogue: ['Stubborn met stubborn. Ronan is at the back, past the seam.'] },
  { map: 'gym-oreburgh', name: 'MINER FENN', x: 11, y: 5, dir: 'left', art: 'hiker', skin: '#e8b888', shirt: '#833732', pants: '#2c3049', hair: '#3a2a1a', trainer: 'roark_miner2', dialogue: ['The museum upstairs sells my fossils now. Fame is a drafty thing.'] },
  { map: 'gym-eterna', name: 'AROMA ADEPT LIA', x: 4, y: 5, dir: 'right', art: 'lass', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', trainer: 'gardenia_adept1', dialogue: ['Watered, weeded, and beaten. The greenhouse door at the back is hers.'] },
  { map: 'gym-eterna', name: 'AROMA ADEPT ROSALIE', x: 11, y: 5, dir: 'left', art: 'lady', skin: '#f0c8a0', shirt: '#c83a7a', pants: '#2a2a3a', hair: '#8a2a1a', trainer: 'gardenia_adept2', dialogue: ['Everything blooms on schedule here. Even rematches. Ask another day.'] },
  { map: 'gym-hearthome', name: 'ACE TRAINER VERE', x: 4, y: 5, dir: 'right', art: 'acetrainer', skin: '#f0c8a0', shirt: '#3a3a6a', pants: '#2a2a3a', hair: '#4a2a3a', trainer: 'fantina_ace1', dialogue: ['Rehearsal concluded. The performance is through the curtain.'] },
  { map: 'gym-hearthome', name: 'ACE TRAINER MIRA', x: 11, y: 5, dir: 'left', art: 'acetrainer', skin: '#f0c8a0', shirt: '#3a3a6a', pants: '#2a2a3a', hair: '#4a2a3a', trainer: 'fantina_ace2', dialogue: ['And — scene. Hers is the stage at the back.'] },
  { map: 'gym-veilstone', name: 'BLACK BELT JON', x: 4, y: 5, dir: 'right', art: 'blackbelt', skin: '#e8b888', shirt: '#e8e8e8', pants: '#2a2a3a', hair: '#1a1a1a', trainer: 'maylene_belt1', dialogue: ['Tested, and passed. She is at the back. Yours cannot wait.'] },
  { map: 'gym-veilstone', name: 'BLACK BELT RUE', x: 11, y: 5, dir: 'left', art: 'blackbelt', skin: '#e8b888', shirt: '#e8e8e8', pants: '#2a2a3a', hair: '#1a1a1a', trainer: 'maylene_belt2', dialogue: ['Two years of mornings. Her AURAJACK has been listening. It always is.'] },
  // ---- Stage S5b actors ----
  // The second-half leaders, at their gyms' hearts ((7,2) idiom).
  { map: 'gym-pastoria', name: 'BREAKER BRADDOCK', x: 7, y: 2, dir: 'down', art: 'lead-pastoria', skin: '#e8b888', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#8a2a1a', sinnoh: 'wake', dialogue: ['BREAKER BRADDOCK! The ring is ready when you are, challenger!'] },
  { map: 'gym-canalave', name: 'DORAN', x: 7, y: 2, dir: 'down', art: 'lead-canalave', skin: '#e8b888', shirt: '#5a5a6a', pants: '#2a2a3a', hair: '#3a3a3a', sinnoh: 'byron', dialogue: ['Steel does not argue, challenger. It simply does not break.'] },
  { map: 'gym-snowpoint', name: 'NEVE', x: 7, y: 2, dir: 'down', art: 'lead-snowpoint', skin: '#f0c8a0', shirt: '#e8e8f0', pants: '#2a2a3a', hair: '#1a1a2a', sinnoh: 'candice', dialogue: ['Focus beats temperature, challenger. Show me yours.'] },
  { map: 'gym-sunnyshore', name: 'RAINER', x: 7, y: 2, dir: 'down', art: 'lead-sunnyshore', skin: '#f0c8a0', shirt: '#e8c832', pants: '#2a2a3a', hair: '#d8b84a', sinnoh: 'volkner', dialogue: ['Make it cost, challenger.'] },
  // Gym rosters, second half (base trainer path).
  { map: 'gym-pastoria', name: 'FISHER TAMSIN', x: 4, y: 5, dir: 'right', art: 'fisher', skin: '#e8b888', shirt: '#324a83', pants: '#2c3049', hair: '#3a2a1a', trainer: 'wake_fisher1', dialogue: ['Opinions overruled. The big ring is his, at the back.'] },
  { map: 'gym-pastoria', name: 'FISHER BOGUE', x: 11, y: 5, dir: 'left', art: 'fisher', skin: '#e8b888', shirt: '#324a83', pants: '#2c3049', hair: '#5a4a3a', trainer: 'wake_fisher2', dialogue: ['Wake is waiting, and Wake does not do patience at all.'] },
  { map: 'gym-canalave', name: 'FOREMAN HOLLIS', x: 4, y: 5, dir: 'right', art: 'cast-hollis', skin: '#e8b888', shirt: '#833732', pants: '#2c3049', hair: '#3a2a1a', trainer: 'byron_miner1', dialogue: ['Structurally sound. The face is his, at the back.'] },
  { map: 'gym-canalave', name: 'FOREMAN ILD', x: 11, y: 5, dir: 'left', art: 'hiker', skin: '#e8b888', shirt: '#833732', pants: '#2c3049', hair: '#6a6a6a', trainer: 'byron_miner2', dialogue: ['Harder than the work. He respects filings. Go on.'] },
  { map: 'gym-snowpoint', name: 'SKIER WRENNA', x: 4, y: 5, dir: 'right', art: 'lass', skin: '#f0c8a0', shirt: '#c83a7a', pants: '#2a2a3a', hair: '#8a2a1a', trainer: 'candice_skier1', dialogue: ['Line held — yours. She is at the top of the slope.'] },
  { map: 'gym-snowpoint', name: 'SKIER TOMAS', x: 11, y: 5, dir: 'left', art: 'kid', skin: '#e8b888', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#2a1a0a', trainer: 'candice_skier2', dialogue: ['No slide. Her YETIFIR approves slowly.'] },
  { map: 'gym-sunnyshore', name: 'TECHNICIAN SOLENNE', x: 4, y: 5, dir: 'right', art: 'lady', skin: '#f0c8a0', shirt: '#e8c832', pants: '#2a2a3a', hair: '#3a5a8a', trainer: 'volkner_tech1', dialogue: ['Bright work. He is at the back. Was that a smile?'] },
  { map: 'gym-sunnyshore', name: 'TECHNICIAN VOSS', x: 11, y: 5, dir: 'left', art: 'gent', skin: '#e8b888', shirt: '#4a4a5a', pants: '#2a2a3a', hair: '#4a3a2a', trainer: 'volkner_tech2', dialogue: ['No rebuild needed. He has already stood up.'] },
  // Paul at Lake Insight — the midpoint full battle.
  { map: 'lake-acuity', name: 'STELLAN', x: 20, y: 8, dir: 'left', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_acuity', dialogue: ['Six against six, {player}. This is the battle the whole region has been a draft of.'] },
  // Dawn at Lake Gallant — the Grand Festival beat.
  { map: 'lake-valor', name: 'DARA', x: 17, y: 8, dir: 'down', art: 'cast-dara', skin: '#f0c8a0', shirt: '#3a6ac8', pants: '#2a2a3a', hair: '#3a5a8a', sinnoh: 'dawn_festival', dialogue: ['The Grand Festival, {player}. My whole road, in one stage. Breathe with me.'] },
  // The Bridgeport sailor — the NOCTARCH beat's shore end.
  { map: 'canalave', name: 'SAILOR ELDRIC', x: 18, y: 8, dir: 'down', art: 'sailor', skin: '#e8b888', shirt: '#3a5a8a', pants: '#2a2a3a', hair: '#5a3a2a', sinnoh: 'sailor_eldric', dialogue: ['Mind the gulls, trainer. Everything in this port is watching something.'] },
  // The Conference floor (league-lobby): registrar, Paul, Tobias.
  { map: 'league-lobby', name: 'LEAGUE REGISTRAR', x: 8, y: 5, dir: 'down', art: 'clerk-borea', skin: '#e8b888', shirt: '#3a4a6a', pants: '#2a2a3a', hair: '#4a3a2a', sinnoh: 'sinnoh_conference', dialogue: ['Conference registration, trainer. The bracket is honest here. It only ever is.'] },
  { map: 'league-lobby', name: 'STELLAN', x: 5, y: 7, dir: 'right', art: 'rival', skin: '#f0c8a0', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#3a2a4a', sinnoh: 'paul_conference', dialogue: ['Quarter-final, {player}. This is the ink.'] },
  { map: 'league-lobby', name: 'CASSIAN', x: 11, y: 7, dir: 'left', art: 'acetrainer', skin: '#d8a878', shirt: '#2a2a3a', pants: '#2a2a3a', hair: '#1a1a1a', sinnoh: 'tobias', dialogue: ['Cassian. The bracket is waiting to see if the record survives you.'] },
  // ---- Stage S6 actors: Buck (MAGMARCH's accompaniment) + the
  // Route 209 traveller (the keystone's giver). ----
  { map: 'survival-area', name: 'BIRK', x: 14, y: 11, dir: 'down', art: 'hiker', skin: '#e8b888', shirt: '#c85a2a', pants: '#2c3049', hair: '#8a2a1a', sinnoh: 'buck', dialogue: ['Grim Mountain keeps its own counsel, trainer. And its own stone.'] },
  { map: 'r209', name: 'TRAVELLER MAREN', x: 11, y: 13, dir: 'down', art: 'gent', skin: '#d8a878', shirt: '#51296b', pants: '#2a2a3a', hair: '#6a6a6a', sinnoh: 'keystone_traveller', dialogue: ['Mind the tower road, trainer. Some stones on it are heavier than they look.'] },
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
  // ---- Stage S5b tale actors ----
  pastoria: {
    'MARSH GUIDE SOLENNE': { tale: 'tale_sinnoh_pastoria', role: 'giver' },
    'BOG KID MIRE': { tale: 'tale_sinnoh_pastoria', role: 'stage' },
  },
  celestic: {
    'SHRINE ELDER UME': { tale: 'tale_sinnoh_celestic', role: 'giver' },
    'HISTORIAN BLYTHE': { tale: 'tale_sinnoh_celestic', role: 'stage' },
  },
  snowpoint: {
    'TEMPLE ACOLYTE REN': { tale: 'tale_sinnoh_snowpoint', role: 'giver' },
    'ICE FISHER SOLVI': { tale: 'tale_sinnoh_snowpoint', role: 'stage' },
  },
  sunnyshore: {
    'LIGHTHOUSE KEEPER BLY': { tale: 'tale_sinnoh_sunnyshore', role: 'giver' },
    'PANEL TECH JUNIPER': { tale: 'tale_sinnoh_sunnyshore', role: 'stage' },
  },
};
