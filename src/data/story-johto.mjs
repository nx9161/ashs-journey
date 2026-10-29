// story-johto.mjs — Arc 2 (Johto) campaign data, Stage J4a: the WEST
// chain (New Bark -> Ecruteak). Quest chain, leader / rival / Rocket
// trainer defs, scripted events, Town Tales and the loadMap NPC tables
// (the CAPT JOHTO precedent in quests.mjs: actors are appended /
// patched at loadMap, never written into the generated maps6.mjs).
// Anime is primary canon (ADR-015); ALL dialogue is original writing
// in the game's voice — no quoted or closely-paraphrased lines.
//
// Stage split: J4a ships the west (badges 1-4: zephyr / hive / plain /
// fog), the Silver thief thread's first clash, the Slowpoke Well +
// Kurt + GS Ball delivery, and the Burned Tower awakening that ARMS
// J5's beast arcs. J4b owns the east + the Silver Conference; J5 owns
// the beast / Celebi / Ho-Oh encounters (this stage only sets their
// arming flags — see the flag map in docs/audit-register.md).
//
// New event-step kinds consumed by runSteps (overworld-systems.mjs):
//   { battleAny: { trainer, winFlag, loseFlag } }
//     — a scripted trainer battle the story survives either way
//       (Silver on Route 30): fought friendly (a loss costs nothing
//       and never blacks out), the branch flag records the honest
//       outcome, and the chain advances on a win OR a loss. Fleeing
//       stalls the chain (the event re-fires), as everywhere.

// ---------------------------------------------------------------------------
// JOHTO_QUESTS — the Johto main-story objective chain (west rows), in
// the MAIN_QUESTS idiom (id / flag / text / hint). `flag` is the story
// flag that completes the objective. J4b appends the east rows below
// the marked seam.
// ---------------------------------------------------------------------------
export const JOHTO_QUESTS = [
  { id: 'q_johto_arrival', flag: 'johto_arrival', text: 'Meet Professor Elm in New Bark Town', hint: 'Elm\'s lab stands at the north edge of New Bark, the first building past the dock. Something happened there just before your boat came in.' },
  { id: 'q_johto_thief', flag: 'silver_reported', text: 'Watch for the red-haired thief — and report back to Elm', hint: 'A starter was stolen from Elm\'s lab. The thief was seen heading north, toward Cherrygrove and Route 30. If you meet him, tell Elm what you saw.' },
  { id: 'q_johto_sprout', flag: 'sprout_tower_done', text: 'Climb Sprout Tower and earn the Elder\'s blessing', hint: 'Violet City\'s tower sways like the Pokemon it honors. Falkner expects challengers to climb it first — the monks inside are the first half of his test.' },
  { id: 'q_johto_zephyr', flag: 'badge_zephyr', text: 'Win the Zephyr Badge from Falkner in Violet City', hint: 'Falkner keeps Violet\'s gym with birds raised in the tower\'s shadow. Flying types fear Electric, Ice and Rock moves.' },
  { id: 'q_johto_well', flag: 'johto_well_cleared', text: 'Clear Team Rocket out of the Slowpoke Well', hint: 'Below Azalea Town, Rockets are cutting Slowpoke tails to sell. Kurt went down to stop them and hurt his back — finish what he started.' },
  { id: 'q_johto_gsball', flag: 'gsball_delivered', text: 'Deliver the GS Ball to Kurt in Azalea Town', hint: 'The ball no machine can open, carried all the way from Valencia. Kurt of Azalea works Poke Balls by hand, the old way — his house stands in the east of town.' },
  { id: 'q_johto_hive', flag: 'badge_hive', text: 'Win the Hive Badge from Bugsy in Azalea Town', hint: 'Bugsy\'s Bug types are proud and quick. Fire, Flying and Rock moves end arguments with them.' },
  { id: 'q_johto_plain', flag: 'badge_plain', text: 'Win the Plain Badge from Whitney in Goldenrod City', hint: 'Whitney\'s Miltank is famous all over Johto, and not for being gentle. Bring a team that can take a rolling hit — and give one back.' },
  { id: 'q_johto_burned', flag: 'beasts_awakened', text: 'See what woke in the Burned Tower', hint: 'In Ecruteak, the tower that burned a hundred and fifty years ago stands open and ash-smelling. Its basement held three statues. Held.' },
  { id: 'q_johto_fog', flag: 'badge_fog', text: 'Win the Fog Badge from Morty in Ecruteak City', hint: 'Morty reads the fog the way sailors read weather. His Ghost types fear Ghost and Dark moves — and respect trainers who have looked into the tower.' },
  // --- J4b APPEND SEAM: the east rows (storm / mineral / glacier /
  // rising + the Silver Conference) join here. ---
];

// ---------------------------------------------------------------------------
// JOHTO_TRAINERS — merged into TRAINERS by merge.mjs. Leader shape is
// the Kanto gym idiom exactly, plus badgeSet: 'johto' so winTrainer's
// award path writes badges.johto + the badge_<root> flag. Leader aces
// carry an authored keepsake (the Classic leader-ace pattern —
// rules.foeKeepsakeFor reads the team entry's keepsake).
// ---------------------------------------------------------------------------
export const JOHTO_TRAINERS = {
  falkner: {
    id: 'falkner', name: 'Falkner', title: 'Violet Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['So the tower let you through. Good — my father kept this gym before me, and the birds keep it with me now. We do not hand the sky to anyone who has not climbed for it.'],
    lose: ['Beaten fairly, at altitude... My father would have liked that battle.', 'The Zephyr Badge is yours. The wind over Violet is yours to borrow now — spend it well.'],
    team: [
      { species: 'pidgeotto', level: 108 },
      { species: 'noctowl', level: 111 },
      { species: 'pidgeot', level: 114, keepsake: 'sparrowfeather' },
    ],
    reward: 4600, badge: 'zephyrbadge',
  },
  bugsy: {
    id: 'bugsy', name: 'Bugsy', title: 'Azalea Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['You found my gym under the trees — most people walk past it twice. I have studied Bug Pokemon my whole life, challenger. Every web in this room is load-bearing.'],
    lose: ['My webbing... cut clean through. You really did your homework out there.', 'The Hive Badge is yours. Take a breath of the forest on your way out — Azalea smells best after a good battle.'],
    team: [
      { species: 'ariados', level: 120 },
      { species: 'heracross', level: 123 },
      { species: 'scizor', level: 126, keepsake: 'ironacorn' },
    ],
    reward: 5200, badge: 'hivebadge',
  },
  whitney: {
    id: 'whitney', name: 'Whitney', title: 'Goldenrod Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['Hi! I am Whitney, and everybody in Goldenrod already knows how this goes, so let us skip to the fun part. My Miltank has been waiting ALL week for a real challenger.'],
    lose: ['Waaah! You — you actually stopped her roll...', 'Sniff. Okay. Okay! The Plain Badge is yours. It is not plain at all, whatever people say. Neither is that battle you just fought.'],
    team: [
      { species: 'clefairy', level: 131 },
      { species: 'snubbull', level: 134 },
      { species: 'miltank', level: 138, keepsake: 'tortoisecharm' },
    ],
    reward: 5800, badge: 'plainbadge',
  },
  morty: {
    id: 'morty', name: 'Morty', title: 'Ecruteak Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['I train in the fog because the fog is honest — it hides nothing that matters and shows everything that does. You have the look of someone the tower has already spoken to. Let us see what it said.'],
    lose: ['The fog lifts, and there you stand. Clear as a bell.', 'The Fog Badge is yours. Whatever woke under this town, trainer — it will be looking for a heart like the one that just beat me.'],
    team: [
      { species: 'gastly', level: 140 },
      { species: 'haunter', level: 143 },
      { species: 'misdreavus', level: 145 },
      { species: 'gengar', level: 148, keepsake: 'spectrebell' },
    ],
    reward: 6400, badge: 'fogbadge',
  },
  // Silver, first clash (Route 30): the stolen starter at band floor
  // plus a Zubat. NOT a leader (no badge, no smart AI, no keepsake) —
  // the battle is fought through the battleAny event step, win or
  // lose, and the branch flag records what actually happened.
  silver_r30: {
    id: 'silver_r30', name: 'Silver', title: 'Red-Haired Trainer', ai: 'basic',
    intro: ['...You saw nothing. That lab, that Pokemon — none of it is your business. Move, or I move you.'],
    lose: ['Tch. Lucky. Take your little victory — it changes nothing. Weak Pokemon, weak trainers... I will fix both.'],
    team: [
      { species: 'zubat', level: 104 },
      { species: 'croconaw', level: 106 },
    ],
    reward: 0,
  },
  // Sprout Tower gauntlet (the monks are plain talk-to trainers).
  sprout_monk_1: {
    id: 'sprout_monk_1', name: 'Monk Jin', title: 'Sprout Tower Monk', ai: 'basic',
    intro: ['The tower sways so the Bellsprout at its heart can feel the weather. We train the same way: bend, do not break. Show me your bend, traveler.'],
    lose: ['You bend well. The stairs are yours — mind the sway on the way up.'],
    team: [
      { species: 'bellsprout', level: 106 },
      { species: 'bellsprout', level: 107 },
    ],
    reward: 400,
  },
  sprout_monk_2: {
    id: 'sprout_monk_2', name: 'Monk Rei', title: 'Sprout Tower Monk', ai: 'basic',
    intro: ['One floor from the Elder, and this is where most challengers discover their legs have opinions. Yours brought you this far. Let us see if they dance.'],
    lose: ['They dance. The Elder is expecting you — he has been expecting you since the tower started swaying this morning.'],
    team: [
      { species: 'bellsprout', level: 108 },
      { species: 'hoothoot', level: 109 },
    ],
    reward: 450,
  },
  // The Slowpoke Well Rockets (plain trainers; the johto NPC handler
  // gates their battles on Kurt's plea and counts the clear).
  rocket_well_1: {
    id: 'rocket_well_1', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['Hey! This well is a work site! Slowpoke tails, one snip at a time — the boss calls it harvesting. I call it overtime. Scram!'],
    lose: ['Ow — okay, okay! The tail business was the boss\'s idea anyway...'],
    team: [
      { species: 'rattata', level: 118 },
      { species: 'zubat', level: 119 },
    ],
    reward: 700,
  },
  rocket_well_2: {
    id: 'rocket_well_2', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['Another do-gooder down the ladder. You people are bad for business, you know that?'],
    lose: ['Business... ruined... The boss is going to hear about this. From someone else. I am leaving.'],
    team: [
      { species: 'ekans', level: 120 },
      { species: 'koffing', level: 121 },
    ],
    reward: 750,
  },
  rocket_well_3: {
    id: 'rocket_well_3', name: 'Rocket Senior', title: 'Team Rocket', ai: 'basic',
    intro: ['I run this well crew. The old man upstairs already learned what happens to heroes down here. Last lesson is free, kid.'],
    lose: ['Crew! Fall back — FALL BACK! The well is not worth this. Nothing down here is worth this.'],
    team: [
      { species: 'arbok', level: 123 },
      { species: 'golbat', level: 124 },
    ],
    reward: 900,
  },
};

// ---------------------------------------------------------------------------
// JOHTO_EVENTS — merged into EVENTS by merge.mjs. Map-entry scenes
// (sysLoadMap fires them once, flag-gated). Leader / Kurt / Elder
// scenes live in overworld-systems (runJohtoNpc) because they are
// menu- and state-driven, not step-driven.
// ---------------------------------------------------------------------------
export const JOHTO_EVENTS = {
  // -- New Bark: the arrival (first elm-lab entry) ---------------------
  ev_johto_arrival: [
    { say: ['Elm\'s lab is not the calm place the ferry captain described. Paper covers the floor like leaves. A glass case near the back stands open and empty, and two aides are arguing in the hushed voices people use at the scene of a small disaster.'], who: 'NARRATOR' },
    { say: ['Oh — a trainer! From the boat, by your pack. I am Professor Elm. Forgive the lab. Forgive everything, actually — it has been that kind of morning.', 'First, the duty: your Johto journey, registered. There. Whatever else today has done, it has not stopped that.'], who: 'PROF. ELM' },
    { say: ['Now the rest. This case held three young Pokemon this morning, waiting for new trainers. It holds two. Sometime before dawn, someone came through that window, helped themselves to the third — a Totodile, already strong for its age — and was gone over the fence before the alarm finished waking up.', 'The guard on the dock saw red hair. That is all anyone saw. Red hair, and no fear at all.'], who: 'PROF. ELM' },
    { say: ['I am not asking you to chase a thief across Johto — you have badges to earn and a whole region to see. I am asking smaller: keep your eyes open. If you cross paths with whoever did this, come back and tell me what you found. A lab keeps records. Today, mine has a page missing.', 'Violet City is your road: north through Cherrygrove, then Route 30. Professor Hawthorn speaks well of you, trainer. So does Hawthorn\'s friend in Azalea — a man named Kurt, who works Poke Balls by hand. When you reach him... you are carrying something he should see. But that is a later page. Go safely.'], who: 'PROF. ELM' },
    { flag: 'johto_arrival' },
    { flag: 'elm_registered' },
    { toast: 'Your Johto journey is registered!' },
  ],

  // -- Route 30: the first Silver clash (battleAny: win or lose) -------
  ev_johto_silver_r30: [
    { say: ['A shape cuts across the Route 30 grass — too fast for a hiker, too careless for a bird. Red hair. A carrier under one arm, the kind labs use. And at his heel, a Croconaw whose every glance checks with him first, the way new partners do.'], who: 'NARRATOR' },
    { say: ['...You. You were at the lab. I saw your boat from the hill.', 'Do not bother denying it. And do not bother with the speech either — I know what I took, and I know why. That lab keeps Pokemon in glass cases waiting for permission to live. Mine is LIVING now.'], who: 'SILVER' },
    { say: ['You want to judge me, judge me the way trainers do. Come on, then. Croconaw — show them what a head start looks like.'], who: 'SILVER' },
    { battleAny: { trainer: 'silver_r30', winFlag: 'silver_r30_won', loseFlag: 'silver_r30_lost' } },
    { say: ['Whatever the battle decided, it decides nothing for him. He recalls his Pokemon mid-motion, already turning away — over the fence line and into the trees before the grass has finished swaying, gone like he was never standing there at all.', 'On the path where he stood: nothing. No card, no name, no clue. Only Elm\'s missing page, still missing. Elm will want to hear about this.'], who: 'NARRATOR' },
    { flag: 'silver_r30_done' },
    { toast: 'The red-haired thief got away.' },
  ],

  // -- Slowpoke Well: Kurt's plea (first well entry) -------------------
  ev_johto_well: [
    { say: ['The well smells of wet stone and something worse — a sweet, wrong smell, like a market stall in a cave. Halfway down the ladder, a voice you know from Azalea\'s doorsteps calls up, tight with pain.'], who: 'NARRATOR' },
    { say: ['Careful on that rung — and careful below it, too. Kurt. Yes, THAT Kurt, sitting in the mud like a dropped tool. I came down to have words with the tail-cutters and my back had words with ME. Fair trade, the old traitor.', 'Listen, trainer. Three of them are still down there, and the Slowpoke are too gentle to run and too slow to hide. I cannot climb, I cannot fight, and I am too proud to crawl past them. So the well is yours, if you will take it. Clear them out. Every last one. For the Slowpoke — and so an old man\'s pride survives the afternoon.'], who: 'KURT' },
    { flag: 'kurt_well_plea' },
    { toast: 'Kurt is counting on you.' },
  ],

  // -- Burned Tower basement: the awakening (first B1F entry) ----------
  // This scene ARMS J5: beasts_awakened + the Suicune sighting are the
  // flags the three beast arcs and Morty's naming dialogue read. No
  // battle, no catch — a glimpse, staged honestly.
  ev_johto_burned: [
    { say: ['The basement of the Burned Tower smells of rain that fell a hundred and fifty years ago. Three plinths stand in a row at the chamber\'s heart, worn smooth by centuries of reverence — and all three are empty. Whatever slept here as statues is not sleeping here anymore.'], who: 'NARRATOR' },
    { say: ['A sound. Not a footstep — a held breath, released. At the far edge of the lamplight, where the broken stairs fall away: a shape. Tall. Blue as deep water under ice, with a crest like a wave deciding. It is watching you the way weather watches a coastline.'], who: 'NARRATOR' },
    { say: ['You do not reach for a ball. Some meetings are not battles, and your hand knows it before your head does. The shape holds your gaze for one long, measuring moment — then it is simply gone, and the basement is a basement again, and your heart is very loud in it.', 'Three plinths. Three absences. Ecruteak is going to want to hear about this — and Morty most of all.'], who: 'NARRATOR' },
    { flag: 'beasts_awakened' },
    { flag: 'beast_seen_suicune' },
    { flag: 'johto_burned_tower' },
    { toast: 'Something ancient has woken.' },
  ],
};

// ---------------------------------------------------------------------------
// JOHTO_TALES — Town Tales for the west settlements, folded into
// QUESTS by merge.mjs (the shipped tales table — one tale system, no
// parallel). Shape is the quests.mjs shape law (<=3 stages, reward up
// front, a lore revelation at the end); the Johto rows additionally
// carry their dialogue lines as data (offerLines / stageLines /
// finishLines) because their givers and stage actors are townsfolk
// patched in below, and the generic Johto branch of runTaleNpc plays
// the lines from the def. `johtoTale: true` is that branch's key.
// ---------------------------------------------------------------------------
export const JOHTO_TALES = {
  tale_newbark: {
    id: 'tale_newbark', town: 'New Bark Town', giver: 'ELDER MARA', title: 'A Letter for the Lab', johtoTale: true,
    stages: [
      'Carry Elder Mara\'s letter to Aide Lin in Elm\'s Lab',
      'Bring Aide Lin\'s reply back to Elder Mara in New Bark Town',
    ],
    reward: { items: { superpotion: 2 } }, rewardText: '2 Super Potions',
    bondNpc: 'mara', bondDelta: 1,
    revelation: 'Mara\'s letter is the forty-first she has written to that lab — she wrote the first to Elm\'s grandfather, asking whether a girl who watched the wind could ever be a scientist. The lab still keeps every one.',
    offerLines: ['Forty years I have watched trainers leave this town, and the lab still answers my letters faster than my own grandchildren.', 'Carry this one to Aide Lin for me? It is about the wind over the dock — it changed this spring, and changed winds mean changed journeys. The Quest Log has it. Two Super Potions for your legs, trainer.'],
    stageLines: ['A letter from Mara? Oh — oh, this is about the spring wind. She noticed before our instruments did. Again.', 'Here, my reply, sealed properly. Tell her the lab says thank you — and that she was right. She is always right. It is extremely annoying and we love her for it.'],
    finishLines: ['Lin\'s seal, Lin\'s hand. Forty-one letters, trainer, and every one answered.', 'I wrote the first to Elm\'s grandfather, when I was a girl who watched the wind and wondered if watching could be a science. The lab keeps them all, they tell me.', 'Two Super Potions, as promised. Mind the wind out there — it has started something new this year.'],
  },
  tale_cherrygrove: {
    id: 'tale_cherrygrove', town: 'Cherrygrove City', giver: 'GUIDE GENT', title: 'The Old Man and the Tide', johtoTale: true,
    stages: [
      'Ask Old Marin in Cherrygrove about the tide table',
      'Tell the Guide Gent what Marin said',
    ],
    reward: { items: { greatball: 2 } }, rewardText: '2 Great Balls',
    bondNpc: 'gent', bondDelta: 1,
    revelation: 'Marin carved Cherrygrove\'s tide table into the harbor stone fifty years ago, from memory, after the printed one washed away — the Gent has been quietly checking his tours against it ever since.',
    offerLines: ['Welcome, welcome! Best tour in Cherrygrove, no charge for trainers — and one small fee of the road: a question I cannot answer.', 'Old Marin down by the water keeps this town\'s tide table in his head. Ask him when the high tide turns, and bring me his answer? Two Great Balls for the errand — a guide pays his sources.'],
    stageLines: ['The tide table? Ha! The boy wants my tide table. I carved it in the harbor stone the year the printed one washed out to sea — fifty years gone, and the stone still reads true.', 'Tell the Gent: high water turns when the gulls stop arguing. He will know what it means. They always do, eventually.'],
    finishLines: ['When the gulls stop arguing... ha! That is Marin all over — the whole table in one rude sentence, and accurate to the minute.', 'Fifty years that man has carried the sea in his head. My tours just borrow it. Two Great Balls, trainer — and if anyone asks, you heard the tide from ME.'],
  },
  tale_violet: {
    id: 'tale_violet', town: 'Violet City', giver: 'OLD TOWERKEEP', title: 'What the Tower Keeps', johtoTale: true,
    stages: [
      'Ask Monk Sage in Violet City about the tower\'s first stone',
      'Tell the Old Towerkeep what the Sage said',
    ],
    reward: { items: { superpotion: 2 } }, rewardText: '2 Super Potions',
    bondNpc: 'towerkeep', bondDelta: 1,
    revelation: 'The tower\'s first stone was carried up by hand, by the towerkeep\'s own great-grandmother — the monks let her set it because she refused to hand it over to anyone else.',
    offerLines: ['Sixty years I have kept that tower\'s door, and I will tell you its secret for an errand: nobody alive remembers why its first stone is smaller than the rest. Nobody but the monks, and they are not telling ME.', 'Ask Monk Sage, here in town. Bring me his answer and I will tell you what the door has taught me. Two Super Potions ride on it.'],
    stageLines: ['The first stone of Sprout Tower? Ah. The old keeper has sent another one to ask.', 'It is small because the woman who carried it up the hill would not give it to stronger hands. "A tower that sways must start with a stone that was carried gently," she said. The towerkeep\'s own great-grandmother, trainer. Tell him the monks kept her name: Aya.'],
    finishLines: ['Aya. ...My great-grandmother\'s name was Aya. Sixty years at that door and the tower kept HER secret from me, not the stone\'s.', 'A tower that sways starts with a stone carried gently. That is the whole philosophy of this town in one sentence, and my family paid for it in shoe leather. Two Super Potions, trainer — and thank you.'],
  },
  tale_azalea: {
    id: 'tale_azalea', town: 'Azalea Town', giver: 'MAIZIE', title: 'Rain for the Slowpoke', johtoTale: true,
    stages: [
      'Ask the Wellkeeper Jonas in Azalea about the Slowpoke rain story',
      'Tell Maizie the story, the way Jonas told it',
    ],
    reward: { items: { hyperpotion: 1 } }, rewardText: '1 Hyper Potion',
    bondNpc: 'maizie', bondDelta: 1,
    revelation: 'The wellkeeper\'s grandfather swore the great drought broke the morning a whole town simply stood in the dry well and sang — the Slowpoke answered first, and the rain answered them.',
    offerLines: ['Everyone says the Slowpoke brought the rain back to Azalea, once, in the big drought. Everyone! But nobody tells it PROPERLY anymore.', 'Wellkeeper Jonas tells it properly. Go and hear it from him, then tell it back to me — a Hyper Potion for the full story, no skipping the good parts.'],
    stageLines: ['The rain story? You want it properly, then. Sit on the well rim — no, not IN, sit ON.', 'My grandfather was there. A year with no rain, the well dry as a drum, and the whole town gone quiet with thirst. Then old Yuna — Kurt\'s mother — climbed down and started SINGING into the empty well, and one by one the town joined her, and the Slowpoke lifted their heads and sang back. By morning: rain. A week of it. Tell Maizie all of it — especially the singing.'],
    finishLines: ['They SANG into the well?! And the Slowpoke sang back, and THEN the rain...', 'That is the best version. That is the one I am telling from now on, and I am telling it exactly like that. A Hyper Potion — earned. Storytellers should be paid properly; Jonas says so.'],
  },
  tale_goldenrod: {
    id: 'tale_goldenrod', town: 'Goldenrod City', giver: 'FLOWER SELLER UNA', title: 'Flowers for the Night Train', johtoTale: true,
    stages: [
      'Ask Bike Hand Ryo in Goldenrod about the night train bouquet',
      'Tell Una what Ryo decided',
    ],
    reward: { items: { greatball: 3 } }, rewardText: '3 Great Balls',
    bondNpc: 'una', bondDelta: 1,
    revelation: 'Una\'s stall has supplied the night train\'s bouquet every single day for nineteen years — the conductors change, the city changes, and the flowers on the driver\'s desk do not.',
    offerLines: ['Nineteen years my stall has put flowers on the night train, trainer — every day, no misses. Today the driver retires, and I cannot decide his last bouquet to save my life.', 'Ryo at the bike shop courted his wife with my flowers on that very train. Ask him what a last bouquet should say. Three Great Balls for a good answer — flowers are serious business.'],
    stageLines: ['Una\'s retiring driver? Oh, that bouquet matters. Let me think like a young fool in love, because that is who I was on that train.', 'Not red — too loud for a goodbye. White and yellow: thanks, and good roads. And ONE stem of whatever blooms by the tracks in summer, so the train itself is in it. Tell her Ryo says: a bouquet should say what the route would say.'],
    finishLines: ['White and yellow, and one stem from the tracks themselves... Oh, that boy. That is exactly right and I knew it and needed HIM to say it.', 'Nineteen years of bouquets, trainer. Conductors change, the city changes — the flowers on the driver\'s desk do not. Three Great Balls. Spend them somewhere the road smells sweet.'],
  },
  tale_ecruteak: {
    id: 'tale_ecruteak', town: 'Ecruteak City', giver: 'HISTORIAN ELIAS', title: 'Two Towers, One Skyline', johtoTale: true,
    stages: [
      'Ask the Sage of the Bells in Ecruteak about the second tower',
      'Tell Historian Elias what the Sage said',
    ],
    reward: { items: { fullheal: 1 } }, rewardText: '1 Full Heal',
    bondNpc: 'elias', bondDelta: 1,
    revelation: 'Ecruteak raised two towers so that whichever way the wind — or the great bird — came from, there would be a welcome: the bells were never alarms, Elias says. They were doorbells.',
    offerLines: ['Every visitor asks me why Ecruteak built TWO towers, and every book in my shop gives a different answer, which means none of them know.', 'The Sage of the Bells knows. Ask him, and bring me the true answer — a Full Heal for it, and my shop\'s gratitude, which is worth at least as much in certain circles.'],
    stageLines: ['Why two towers? Elias finally asks a real question. Listen, then.', 'One tower is a lookout. Two towers are a welcome. Whichever way the great bird came over the hills, there would be bells under it, and a roof raised in its honor. The bells were never alarms, child. They were doorbells. Tell the historian the Sage said so — and tell him to write THAT in a book.'],
    finishLines: ['Doorbells. A hundred and fifty years of scholarship and the answer is doorbells — and it is TRUE, I can feel it being true.', 'Two welcomes, one skyline, and one of them ashes. We keep the remaining bells polished anyway. Some welcomes you keep ready forever. A Full Heal, trainer — and the next book in my shop will say it properly.'],
  },
};

// ---------------------------------------------------------------------------
// JOHTO_NPCS / JOHTO_NPC_PATCHES — the loadMap-append idiom (quests.mjs
// CAPT JOHTO precedent): appended actors carry `johto` (runJohtoNpc
// owns them) or `trainer` (the generic trainer path) or `tale`+`role`
// (the tales above); patches stamp tale roles onto existing maps6
// townsfolk by name. The generated maps6 data is never edited.
// Appearances follow the quests.mjs APPEAR idiom (skin/shirt/pants/
// hair); `art` names the sprite family the map data already uses.
// ---------------------------------------------------------------------------
export const JOHTO_NPCS = [
  { map: 'elm-lab', x: 8, y: 4, name: 'PROF. ELM', art: 'scientist', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#6a4a2a', johto: 'elm',
    dialogue: ['The lab keeps records, trainer. Today, one page is missing — and I mean to see it found.'] },
  { map: 'gym-violet', x: 7, y: 2, name: 'FALKNER', art: 'gym1', skin: '#e8b888', shirt: '#3a5a8a', pants: '#2a2a3a', hair: '#2a3a6a', johto: 'falkner',
    dialogue: ['My father kept this gym before me. The birds keep it with me now.'] },
  { map: 'sprout-tower-1', x: 10, y: 6, name: 'MONK JIN', art: 'monk', skin: '#e8b888', shirt: '#8a6a3a', pants: '#4a3a2a', hair: '#2a1a0a', trainer: 'sprout_monk_1',
    dialogue: ['You bend well, traveler. The stairs are yours.'] },
  { map: 'sprout-tower-2', x: 10, y: 5, name: 'MONK REI', art: 'monk', skin: '#d8a878', shirt: '#8a6a3a', pants: '#4a3a2a', hair: '#1a1a1a', trainer: 'sprout_monk_2',
    dialogue: ['They dance, your legs. The Elder is expecting you.'] },
  { map: 'sprout-tower-2', x: 8, y: 2, name: 'ELDER LI', art: 'elder', skin: '#e8b888', shirt: '#5a4a6a', pants: '#3a3a4a', hair: '#e8e8e8', johto: 'sprout_elder',
    dialogue: ['The tower sways, and so do we all. That is not weakness, child. That is how tall things survive.'] },
  { map: 'gym-azalea', x: 7, y: 2, name: 'BUGSY', art: 'gym2', skin: '#f0c8a0', shirt: '#4a7a3a', pants: '#3a3a2a', hair: '#3a6a2a', johto: 'bugsy',
    dialogue: ['Every web in this room is load-bearing, challenger.'] },
  { map: 'slowpoke-well', x: 5, y: 2, name: 'ROCKET GRUNT', art: 'rocket', skin: '#e8b888', shirt: '#2a2a2a', pants: '#2a2a3a', hair: '#3a2a1a', johto: 'rocket_well_1',
    dialogue: ['This well is a work site. Scram!'] },
  { map: 'slowpoke-well', x: 13, y: 5, name: 'ROCKET GRUNT', art: 'rocket', skin: '#d8a878', shirt: '#2a2a2a', pants: '#2a2a3a', hair: '#1a1a1a', johto: 'rocket_well_2',
    dialogue: ['You people are bad for business.'] },
  { map: 'slowpoke-well', x: 10, y: 10, name: 'ROCKET SENIOR', art: 'rocket', skin: '#c89878', shirt: '#3a2a3a', pants: '#2a2a3a', hair: '#5a5a5a', johto: 'rocket_well_3',
    dialogue: ['I run this well crew.'] },
  { map: 'kurt-house', x: 4, y: 3, name: 'KURT', art: 'elder', skin: '#e8b888', shirt: '#6a5a3a', pants: '#3a3a4a', hair: '#e8e8e8', johto: 'kurt',
    dialogue: ['Balls made by hand remember the hand. Machines never learned that.'] },
  { map: 'gym-goldenrod', x: 7, y: 2, name: 'WHITNEY', art: 'gym3', skin: '#f0c8a0', shirt: '#e88ab0', pants: '#4a3a5a', hair: '#e8a0b8', johto: 'whitney',
    dialogue: ['My Miltank has been waiting ALL week for a real challenger.'] },
  { map: 'gym-ecruteak', x: 7, y: 2, name: 'MORTY', art: 'gym4', skin: '#e8b888', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#d8c8a0', johto: 'morty',
    dialogue: ['The fog is honest. It hides nothing that matters.'] },
];

export const JOHTO_NPC_PATCHES = [
  { map: 'newbark', name: 'ELDER MARA', tale: 'tale_newbark', role: 'giver' },
  { map: 'elm-lab', name: 'AIDE LIN', tale: 'tale_newbark', role: 'stage' },
  { map: 'cherrygrove', name: 'GUIDE GENT', tale: 'tale_cherrygrove', role: 'giver' },
  { map: 'cherrygrove', name: 'OLD MARIN', tale: 'tale_cherrygrove', role: 'stage' },
  { map: 'violet', name: 'OLD TOWERKEEP', tale: 'tale_violet', role: 'giver' },
  { map: 'violet', name: 'MONK SAGE', tale: 'tale_violet', role: 'stage' },
  { map: 'azalea', name: 'MAIZIE', tale: 'tale_azalea', role: 'giver' },
  { map: 'azalea', name: 'WELLKEEPER JONAS', tale: 'tale_azalea', role: 'stage' },
  { map: 'goldenrod', name: 'FLOWER SELLER UNA', tale: 'tale_goldenrod', role: 'giver' },
  { map: 'goldenrod', name: 'BIKE HAND RYO', tale: 'tale_goldenrod', role: 'stage' },
  { map: 'ecruteak', name: 'HISTORIAN ELIAS', tale: 'tale_ecruteak', role: 'giver' },
  { map: 'ecruteak', name: 'SAGE OF THE BELLS', tale: 'tale_ecruteak', role: 'stage' },
];
