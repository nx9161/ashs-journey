// story-johto.mjs — Arc 2 (Johto) campaign data, Stage J4a: the WEST
// chain (New Bark -> Ecruteak). Quest chain, leader / rival / Rocket
// trainer defs, scripted events, Town Tales and the loadMap NPC tables
// (the CAPT JOHTO precedent in quests.mjs: actors are appended /
// patched at loadMap, never written into the generated maps6.mjs).
// Anime is primary canon (ADR-015); ALL dialogue is original writing
// in the game's voice — no quoted or closely-paraphrased lines.
//
// Stage split: J4a ships the west (badges 1-4: zephyr / hive / plain /
// fog), the Silver thief thread's first clash, the DOZELING Well +
// Kurt + GS Orb delivery, and the Burned Tower awakening that ARMS
// J5's beast arcs. J4b (this stage, appended below the marked seams)
// ships the east: the Olivine/Cianwood medicine errand + Storm and
// Mineral badges, Silver's second and third clashes, the Red WRATHWYRM
// + Lance + the Rocket Hideout + Glacier Badge, the Radio Tower
// takeover, Clair + the Dragon's Den test (the Rising Badge is awarded
// AT THE DEN, not in the gym), the route-silver badge gate, the Silver
// Conference (Gary must-win centrepiece, then Harrison — see the
// Harrison mechanism note at his trainer def), johto_complete through
// the Foundation machine, and Red on Mt. Silver as post-game. J5 (this
// stage, appended at the marked seams) ships the legendary arcs the
// earlier stages armed: the three beasts (chases + lair faces on
// `beasts_awakened`), Celebi (the GS Orb's return and the Ilex
// shrine), and Ho-Oh (the designed arc_hooh, activated in
// story-kanto.mjs) — plus the badge-order leader gate and the Rocket
// Hideout interior map's re-homed staging (engine side).
//
// New event-step kind consumed by runSteps (Stage J5):
//   { wildBattleCatch: { species, level, legendary } }
//     — a one-of-one legendary face: the chain advances ONLY on a
//       catch (a flee OR a KO stalls it with nothing set, so the
//       encounter re-fires until the species is caught — a one-of-one
//       can never dex-lock a player). See overworld-systems.
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
  { id: 'q_johto_well', flag: 'johto_well_cleared', text: 'Clear Team Rocket out of the DOZELING Well', hint: 'Below Azalea Town, Rockets are cutting DOZELING tails to sell. Kurt went down to stop them and hurt his back — finish what he started.' },
  { id: 'q_johto_gsball', flag: 'gsball_delivered', text: 'Deliver the GS Orb to Kurt in Azalea Town', hint: 'The ball no machine can open, carried all the way from Valencia. Kurt of Azalea works Capture Orbs by hand, the old way — his house stands in the east of town.' },
  { id: 'q_johto_hive', flag: 'badge_hive', text: 'Win the Hive Badge from Bugsy in Azalea Town', hint: 'Bugsy\'s Bug types are proud and quick. Fire, Flying and Rock moves end arguments with them.' },
  { id: 'q_johto_plain', flag: 'badge_plain', text: 'Win the Plain Badge from Whitney in Goldenrod City', hint: 'Whitney\'s Miltank is famous all over Johto, and not for being gentle. Bring a team that can take a rolling hit — and give one back.' },
  { id: 'q_johto_burned', flag: 'beasts_awakened', text: 'See what woke in the Burned Tower', hint: 'In Ecruteak, the tower that burned a hundred and fifty years ago stands open and ash-smelling. Its basement held three statues. Held.' },
  { id: 'q_johto_fog', flag: 'badge_fog', text: 'Win the Fog Badge from Morty in Ecruteak City', hint: 'Morty reads the fog the way sailors read weather. His Ghost types fear Ghost and Dark moves — and respect trainers who have looked into the tower.' },
  // --- J4b: the east rows (appended at the J4a seam) ---
  { id: 'q_johto_potion', flag: 'amphy_healed', text: 'Fetch the Secret Potion for Amphy, the lighthouse Pokemon', hint: 'Amphy, the Ampharos whose light guides Olivine\'s ships, is sick in the Glitter Lighthouse. The pharmacy across Route 40 in Cianwood makes a Secret Potion — Jasmine is waiting on it.' },
  { id: 'q_johto_storm', flag: 'badge_storm', text: 'Win the Storm Badge from Chuck in Cianwood City', hint: 'Chuck trains where the sea hits the island hardest. His Fighting types fear Flying and Psychic moves — and respect anyone who crossed the water to reach him.' },
  { id: 'q_johto_mineral', flag: 'badge_mineral', text: 'Win the Mineral Badge from Jasmine in Olivine City', hint: 'Jasmine will not battle while Amphy is sick — the errand comes first. Her Steelix fears Fire, Fighting and Ground moves.' },
  { id: 'q_johto_redgyarados', flag: 'red_gyarados_done', text: 'Face the Red WRATHWYRM at the Lake of Rage', hint: 'North of Mahogany, something red and furious is tearing the lake apart. The fishermen say it was not always red — or always furious.' },
  { id: 'q_johto_hideout', flag: 'johto_hideout_cleared', text: 'Clear the Rocket Hideout beneath Mahogany\'s souvenir shop', hint: 'Lance is waiting in Mahogany Town. Whatever is humming under that shop is the same signal that has been hurting the lake.' },
  { id: 'q_johto_glacier', flag: 'badge_glacier', text: 'Win the Glacier Badge from Pryce in Mahogany Town', hint: 'Pryce has trained through fifty winters and one Rocket occupation. His Ice types fear Fire, Fighting, Rock and Steel moves.' },
  { id: 'q_johto_radio', flag: 'radio_tower_cleared', text: 'Take back the Goldenrod Radio Tower', hint: 'With the hideout gone, Team Rocket has seized the Radio Tower to broadcast their return. The real Director is being held somewhere below the city — the Card Key is with him.' },
  { id: 'q_johto_rising', flag: 'badge_rising', text: 'Win Clair\'s trust — and the Rising Badge — in Blackthorn', hint: 'Clair\'s gym is only the first half. By the clan\'s law the badge itself is given in the Dragon\'s Den, after the elder\'s test. Her Dragon types fear Ice and Dragon moves.' },
  { id: 'q_johto_conference', flag: 'conference_registered', text: 'Register for the Silver Conference at Silver Town', hint: 'Eight Johto badges open the road north: Blackthorn, Route Silver, Silver Town. The Conference Official in the stadium keeps the bracket.' },
  { id: 'q_johto_gary', flag: 'beat_gary_johto', text: 'The Silver Conference — beat Gary', hint: 'He has been waiting on the far side of the bracket all arc. ABYSSAR and all. This one you have to win.' },
  { id: 'q_johto_harrison', flag: 'johto_complete', text: 'The Silver Conference — the quarter-final, and whatever it decides', hint: 'Harrison of Littleroot, and a Houndoom that has ended better runs than yours. Face him with everything — the Conference, and Johto, end on the far side of this battle.' },
  { id: 'q_johto_red', flag: 'red_defeated', text: 'Post-game: the silent trainer on Mt. Silver', hint: 'Past Silver Town, the mountain keeps one more name off every bracket. He has been standing on that dais a long time, saying nothing, waiting for someone worth the silence.' },
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
  // plus a SKREEP. NOT a leader (no badge, no smart AI, no keepsake) —
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
    intro: ['The tower sways so the PITCHLET at its heart can feel the weather. We train the same way: bend, do not break. Show me your bend, traveler.'],
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
  // The DOZELING Well Rockets (plain trainers; the johto NPC handler
  // gates their battles on Kurt's plea and counts the clear).
  rocket_well_1: {
    id: 'rocket_well_1', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['Hey! This well is a work site! DOZELING tails, one snip at a time — the boss calls it harvesting. I call it overtime. Scram!'],
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
  // ================= Stage J4b: the east =================
  chuck: {
    id: 'chuck', name: 'Chuck', title: 'Cianwood Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['You crossed the whole sea to stand in my gym — good. Out here we train where the waves hit, because a wave does not care about your excuses. Neither do I. Show me a team the storm respects!'],
    lose: ['Hah! Knocked clean off my feet — and I have excellent feet!', 'The Storm Badge is yours. You hit like weather, trainer. Like weather.'],
    team: [
      { species: 'primeape', level: 148 },
      { species: 'poliwrath', level: 151 },
      { species: 'machamp', level: 154, keepsake: 'secondwindribbon' },
    ],
    reward: 6600, badge: 'stormbadge',
  },
  jasmine: {
    id: 'jasmine', name: 'Jasmine', title: 'Olivine Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['Amphy is well. The light is turning again, and the ships are safe — because of you. So now... now I can battle with my whole heart. My Steelix has been patient. I have not.'],
    lose: ['Oh...! Beaten, truly beaten. Amphy\'s light and your battle — Olivine is bright today in every way there is.', 'The Mineral Badge is yours. Hold it up to the lighthouse sometime. It shines back.'],
    team: [
      { species: 'magnemite', level: 154 },
      { species: 'magneton', level: 157 },
      { species: 'steelix', level: 160, keepsake: 'fossilspur' },
    ],
    reward: 7000, badge: 'mineralbadge',
  },
  pryce: {
    id: 'pryce', name: 'Pryce', title: 'Mahogany Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['Fifty winters I have trained in this town, and I will tell you the secret of every one of them: winter does not hate you. Winter is simply honest about what you are. Let us be honest, then.'],
    lose: ['...Warm. That is the word. Your team fights warm, the way my Piloswine and I did when we were both young and foolish.', 'The Glacier Badge is yours. It will not melt. Neither, I think, will you.'],
    team: [
      { species: 'seel', level: 162 },
      { species: 'dewgong', level: 165 },
      { species: 'piloswine', level: 168, keepsake: 'tortoisecharm' },
    ],
    reward: 7400, badge: 'glacierbadge',
  },
  // Clair carries NO badge field on purpose: by the clan's law the
  // Rising Badge is awarded in the Dragon's Den, after the elder's
  // test — the den handler writes the exact leader-award
  // representation (badges.johto push + badge_rising flag) when the
  // test is passed. A gym win here sets clair_beaten only.
  clair: {
    id: 'clair', name: 'Clair', title: 'Blackthorn Gym Leader', ai: 'smart', badgeSet: 'johto',
    intro: ['I am Clair. The clan has kept dragons since before your maps had names for these mountains, and I keep this gym the way we keep everything: completely. You may try to be the exception.'],
    lose: ['...Beaten. In my own gym, by — very well. VERY well.', 'But understand this: you have won a battle here, not the badge. The badge is not mine to hand over in a gym. The Dragon\'s Den decides — the elder, the shrine, the old questions. Go and be judged properly.'],
    team: [
      { species: 'dragonair', level: 172 },
      { species: 'dragonair', level: 174 },
      { species: 'gyarados', level: 175 },
      { species: 'kingdra', level: 178, keepsake: 'tidepearl' },
    ],
    reward: 8000,
  },
  den_shrine: {
    id: 'den_shrine', name: 'Shrine Keeper Sora', title: 'Dragon\'s Den Keeper', ai: 'smart',
    intro: ['The elder has heard your answers. Now the shrine asks its own question, and it only speaks battle. Answer carefully, trainer of Blackthorn\'s choosing.'],
    lose: ['The shrine is satisfied. So, I think, are the dragons.'],
    team: [
      { species: 'dragonair', level: 174 },
      { species: 'kingdra', level: 177 },
    ],
    reward: 1200,
  },
  // Silver, second clash (Ilex Forest): the stolen starter grown
  // (Croconaw, a touch stronger), a GLOOMBITE, a Sneasel he caught on
  // the road. Fought through battleAny like the first clash — the
  // branch flag records the honest outcome.
  silver_ilex: {
    id: 'silver_ilex', name: 'Silver', title: 'Red-Haired Trainer', ai: 'basic',
    intro: ['You again. Route 30 was interrupted, not finished. Croconaw — we finish it here.'],
    lose: ['...Again?! No — no, this is data. You are data. I will be back with better.'],
    team: [
      { species: 'golbat', level: 128 },
      { species: 'sneasel', level: 131 },
      { species: 'croconaw', level: 134 },
    ],
    reward: 0,
  },
  // Silver, third clash (Route Silver): the rivalry closes here.
  // His starter is fully grown at last — Feraligatr — and the team
  // around it is a real team. Still battleAny: he concedes the race
  // either way, in words (the handler event's closing lines).
  silver_route: {
    id: 'silver_route', name: 'Silver', title: 'Red-Haired Trainer', ai: 'basic',
    intro: ['Last road, trainer. Whatever is left between us, we settle it here — Feraligatr and I have been waiting for a finish line.'],
    lose: ['...There it is. There is the gap. I have been measuring it wrong all this time.'],
    team: [
      { species: 'crobat', level: 178 },
      { species: 'sneasel', level: 180 },
      { species: 'magneton', level: 182 },
      { species: 'feraligatr', level: 184 },
    ],
    reward: 0,
  },
  // The Rocket Hideout gauntlet (staged as the descent event — see
  // ev_johto_hideout; J3b authored no hideout interior map and
  // maps6 stays untouched, so the gauntlet plays as a scripted
  // descent from Mahogany's souvenir shop with Lance beside you).
  rocket_hideout_1: {
    id: 'rocket_hideout_1', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['The shop is closed! The basement is DEFINITELY closed! Nobody ordered a hero!'],
    lose: ['Security! SECURITY! ...The security is also me. Run!'],
    team: [
      { species: 'koffing', level: 158 },
      { species: 'golbat', level: 160 },
    ],
    reward: 800,
  },
  rocket_hideout_2: {
    id: 'rocket_hideout_2', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['You hear that hum? That is the sound of every WRATHWYRM on the lake answering US. Keep walking and you join the choir — as the example!'],
    lose: ['The hum... it stopped for a second there. Did you feel it stop? That is bad. That is very bad.'],
    team: [
      { species: 'arbok', level: 161 },
      { species: 'weezing', level: 163 },
    ],
    reward: 850,
  },
  rocket_hideout_exec: {
    id: 'rocket_hideout_exec', name: 'Executive Vey', title: 'Team Rocket Executive', ai: 'smart',
    intro: ['I am Vey. I sign the orders the grunts are afraid to read aloud. The lake, the signal, this little shop of horrors — my paperwork, all of it. And you are the audit.'],
    lose: ['Audit... accepted. The signal dies with this room, trainer. Tell the man with the WYRMARCH that Vey sends her regards — and her resignation.'],
    team: [
      { species: 'hypno', level: 164 },
      { species: 'houndoom', level: 166 },
    ],
    reward: 2000,
  },
  // The Radio Tower takeover gauntlet (post-hideout, canon order).
  rocket_radio_1: {
    id: 'rocket_radio_1', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['This station is under new management! All broadcasts are belong — are property of — look, just hand over the badges, kid!'],
    lose: ['We interrupt this takeover for a message from our sponsors: pain.'],
    team: [
      { species: 'golbat', level: 166 },
      { species: 'koffing', level: 167 },
    ],
    reward: 900,
  },
  rocket_underground: {
    id: 'rocket_underground', name: 'Rocket Grunt', title: 'Team Rocket', ai: 'basic',
    intro: ['Nobody comes down here! The old man in the back is a — a storage item! Very valuable! Very stored!'],
    lose: ['Stored... defeated... The Director is going to be furious. The REAL one. Oh no.'],
    team: [
      { species: 'arbok', level: 168 },
      { species: 'golbat', level: 169 },
    ],
    reward: 950,
  },
  rocket_radio_2: {
    id: 'rocket_radio_2', name: 'Rocket Senior', title: 'Team Rocket', ai: 'basic',
    intro: ['The Card Key? Then the old man talked. They always talk. The tower is still ours above this floor, trainer — come and take the stairs.'],
    lose: ['Stairs... yours. The Director upstairs is not going to like this. Either of them.'],
    team: [
      { species: 'arbok', level: 169 },
      { species: 'weezing', level: 170 },
    ],
    reward: 1000,
  },
  rocket_director_fake: {
    id: 'rocket_director_fake', name: 'Director?', title: 'Radio Tower Director', ai: 'smart',
    intro: ['Ah, our rescuer! I am the Director, as you can plainly — the suit, trainer. Judge the suit. Everything is under control, the Rockets have fled, and you may go home with our gratit— why are you still standing there.'],
    lose: ['The suit... was expensive... Petrel — no. VEY. Vey said the suit would work. Nobody questions a suit, she said...'],
    team: [
      { species: 'persian', level: 172 },
      { species: 'hypno', level: 173 },
      { species: 'houndoom', level: 174 },
    ],
    reward: 2200,
  },
  // The Silver Conference bracket (Silver Stadium).
  conference_q1: {
    id: 'conference_q1', name: 'Brenna', title: 'Conference Trainer', ai: 'smart',
    intro: ['Qualifier one, and the draw gave me you. I did not cross Johto to be anyone\'s warm-up, trainer. Neither did you. Good — let us be honest about it.'],
    lose: ['Honest it was. The bracket is yours to climb — climb it loudly, I want my loss to mean something.'],
    team: [
      { species: 'noctowl', level: 180 },
      { species: 'lanturn', level: 182 },
      { species: 'xatu', level: 184 },
    ],
    reward: 3000,
  },
  conference_q2: {
    id: 'conference_q2', name: 'Cato', title: 'Conference Trainer', ai: 'smart',
    intro: ['Second qualifier. They are saying your name in the stands already — did you know? I intend to make them say mine instead.'],
    lose: ['Say it, then. Say yours. You earned the volume. The Gary match is next — I will be in the front row, taking notes and taking it personally.'],
    team: [
      { species: 'magmar', level: 183 },
      { species: 'electabuzz', level: 185 },
      { species: 'heracross', level: 186 },
    ],
    reward: 3200,
  },
  // THE GARY BATTLE — the arc's centrepiece. A REAL trainer battle
  // the player must WIN (standard league idiom: losing leaves
  // beat_gary_johto unset and Gary re-challengeable after healing —
  // no soft-lock). His team is built from his Kanto identity, grown
  // to the Conference: MENTARCH and EMBERMANE from his road, GRIMSHADE
  // and Umbreon from his Johto years, AERARCH from the first sky
  // you shared — and ABYSSAR, his starter, anchoring it all, the
  // INFERNOX-vs-ABYSSAR echo the whole rivalry has pointed at.
  gary_johto: {
    id: 'gary_johto', name: 'Gary', title: 'Silver Conference Trainer', ai: 'smart',
    intro: ['Well. Look who the bracket dragged in.', 'Kanto champion, Orange winner — and still the second-most interesting trainer in this stadium. I have waited two regions for this draw, {player}. Do not make me regret the wait.'],
    lose: ['...Ha. Hahaha. Yeah. Yeah, that is the one I wanted.', 'Two regions, and it still comes down to us at the end of the bracket. Take the win. Take it all the way to Harrison — and do not you dare lose to him after beating me.'],
    team: [
      { species: 'pidgeot', level: 186 },
      { species: 'alakazam', level: 188 },
      { species: 'arcanine', level: 189 },
      { species: 'gengar', level: 190 },
      { species: 'umbreon', level: 191 },
      { species: 'blastoise', level: 193, keepsake: 'tidepearl' },
    ],
    reward: 9000,
  },
  // HARRISON — the quarter-final, and the Harrison mechanism
  // (RECORDED DECISION, Stage J4b): preference (a), a scripted
  // climax, is INEXPRESSIBLE in this engine — the only endure hook
  // is the classic battle's tutorial lesson-mon (battle.mjs: gated
  // on the tutorial flag, wild foes only), trainer battles expose no
  // scripted-outcome / forced-result step, and runSteps has no
  // conditional branch for post-battle text. So branch (b) ships, as
  // the brief specifies: a REAL full-strength battle whose
  // completion predicate is FACED (fought friendly through the
  // stadium handler, win or lose, never a blackout) — with
  // branch-true text: canon-honours lines on a loss (the quarter-
  // final loss stands, staged with dignity), upset-acknowledged
  // lines on a win, and johto_complete set either way.
  harrison: {
    id: 'harrison', name: 'Harrison', title: 'Silver Conference Trainer', ai: 'smart',
    intro: ['Harrison, from Littleroot Town — a long way from home, same as you. I watched your Gary match from the tunnel. Whatever happens here, trainer, this crowd is getting a final worthy of a semi.'],
    lose: ['There it is! There is the battle I crossed an ocean of brackets for!'],
    team: [
      { species: 'sneasel', level: 192 },
      { species: 'xatu', level: 193 },
      { species: 'hypno', level: 194 },
      { species: 'steelix', level: 195 },
      { species: 'miltank', level: 196 },
      { species: 'houndoom', level: 198 },
    ],
    reward: 9500,
  },
  // RED — post-completion, gated on johto_complete in his handler.
  // The canon team at the band ceiling: VOLTIK 200, the rest
  // 195-198. Rematchable: talk again, battle again.
  red: {
    id: 'red', name: 'Red', title: 'Trainer', ai: 'smart',
    intro: ['...'],
    lose: ['...!'],
    team: [
      { species: 'espeon', level: 195 },
      { species: 'snorlax', level: 196 },
      { species: 'venusaur', level: 197 },
      { species: 'charizard', level: 198 },
      { species: 'blastoise', level: 198 },
      { species: 'pikachu', level: 200 },
    ],
    reward: 12000,
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
    { say: ['I am not asking you to chase a thief across Johto — you have badges to earn and a whole region to see. I am asking smaller: keep your eyes open. If you cross paths with whoever did this, come back and tell me what you found. A lab keeps records. Today, mine has a page missing.', 'Violet City is your road: north through Cherrygrove, then Route 30. Professor Hawthorn speaks well of you, trainer. So does Hawthorn\'s friend in Azalea — a man named Kurt, who works Capture Orbs by hand. When you reach him... you are carrying something he should see. But that is a later page. Go safely.'], who: 'PROF. ELM' },
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

  // -- DOZELING Well: Kurt's plea (first well entry) -------------------
  ev_johto_well: [
    { say: ['The well smells of wet stone and something worse — a sweet, wrong smell, like a market stall in a cave. Halfway down the ladder, a voice you know from Azalea\'s doorsteps calls up, tight with pain.'], who: 'NARRATOR' },
    { say: ['Careful on that rung — and careful below it, too. Kurt. Yes, THAT Kurt, sitting in the mud like a dropped tool. I came down to have words with the tail-cutters and my back had words with ME. Fair trade, the old traitor.', 'Listen, trainer. Three of them are still down there, and the DOZELING are too gentle to run and too slow to hide. I cannot climb, I cannot fight, and I am too proud to crawl past them. So the well is yours, if you will take it. Clear them out. Every last one. For the DOZELING — and so an old man\'s pride survives the afternoon.'], who: 'KURT' },
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
    { arc: 'arc_raikou', stage: 'discovered' },
    { arc: 'arc_entei', stage: 'discovered' },
    { arc: 'arc_suicune', stage: 'discovered' },
    { flag: 'beasts_awakened' },
    { flag: 'beast_seen_suicune' },
    { flag: 'johto_burned_tower' },
    { toast: 'Something ancient has woken.' },
  ],

  // ================= Stage J4b events =================
  // -- Silver, second clash (Ilex Forest): TWO stagings of one beat.
  // sysLoadMap picks the variant by the Route 30 branch flag, so his
  // opening lines genuinely branch on silver_r30_won / _lost; the
  // battle itself is the shared battleAny (win or lose advances).
  ev_johto_silver_ilex_won: [
    { say: ['The Ilex trees close overhead like a held breath. Then — a laugh, short and disbelieving, from the Azalea-side path. Red hair. A GLOOMBITE riding the thermals between the trunks. And a Croconaw, bigger than you remember, keeping pace like a shadow with teeth.'], who: 'NARRATOR' },
    { say: ['Route 30. I have replayed it every night since. You got LUCKY — the grass, the light, one lucky bounce. Luck is not a strategy, trainer. It runs out. Watch it run out.'], who: 'SILVER' },
    { battleAny: { trainer: 'silver_ilex', winFlag: 'silver_ilex_won', loseFlag: 'silver_ilex_lost' } },
    { say: ['He is gone into the trees before the echo is — but slower than last time, and looking back once, the way a person looks at a measuring mark they did not expect to move.'], who: 'NARRATOR' },
    { flag: 'silver_ilex_done' },
    { toast: 'Silver is measuring himself against you now.' },
  ],
  ev_johto_silver_ilex_lost: [
    { say: ['The Ilex trees close overhead like a held breath. Then — footsteps, unhurried, from the Azalea-side path. Red hair. A GLOOMBITE in the branches. And a Croconaw, bigger than you remember, wearing Route 30 like a medal.'], who: 'NARRATOR' },
    { say: ['You. I wondered when the road would return my practice partner. Route 30 was not a fluke, and this forest is about to prove it twice. Croconaw — encore.'], who: 'SILVER' },
    { battleAny: { trainer: 'silver_ilex', winFlag: 'silver_ilex_won', loseFlag: 'silver_ilex_lost' } },
    { say: ['He is gone into the trees before the echo is — but slower than you would expect from a boy in a hurry, and looking back once, at the space where the battle happened, like it surprised him too.'], who: 'NARRATOR' },
    { flag: 'silver_ilex_done' },
    { toast: 'Silver is measuring himself against you now.' },
  ],

  // -- The Red WRATHWYRM (Lake of Rage entry): a one-time CATCHABLE
  // wildBattle. The runSteps fled guard is the whole law here:
  // fleeing leaves the chain unfinished (no flag, no event-done), so
  // the encounter re-fires on the next entry and completes NOTHING;
  // a catch or a KO resolves it exactly once, and red_gyarados_done
  // gates it forever after. Lance arrives in the aftermath, inside
  // the same scene.
  ev_johto_redgyarados: [
    { say: ['The lake is wrong before you even see it. Gulls are screaming inland, away from the water, and the sound coming off the shore is not waves — it is something enormous, thrashing in water too shallow to hold it, over and over, like a bell being struck underwater.'], who: 'NARRATOR' },
    { say: ['Then the surface breaks. Red. Not sunset-red — scale-red, fin-red, a WRATHWYRM the colour of a wound, thirty feet of fury trying to shake a sound out of its own skull that only it can hear. The fishermen are on the shore with their boats pulled up and their hats in their hands. Nobody is fishing today.'], who: 'NARRATOR' },
    { say: ['It sees you. Whatever is screaming inside its head, for one moment you are louder. The Red WRATHWYRM comes at the shore like weather.'], who: 'NARRATOR' },
    { wildBattle: { species: 'gyarados', level: 162 } },
    { say: ['Quiet. Not peace — exhaustion, the lake settling back into its banks, the gulls daring their way down again one at a time. And over it, a new sound: wings. Very large wings, folding.'], who: 'NARRATOR' },
    { say: ['You felt it too, then. Not the rage — the cause. I am Lance. I train dragons, and I have been following a signal across Johto that should not exist: a radio wave, tuned like a hand on a shoulder, that Pokemon cannot refuse. It is loudest here. It drove that WRATHWYRM out of the deep water and painted it with its own fury.', 'Signals have sources, trainer. This one is close — buried under a town that smells of cedar and souvenirs. Mahogany. Meet me there. Bring that look with you — the one you are wearing now. We are going to need it.'], who: 'LANCE' },
    { flag: 'red_gyarados_done' },
    { flag: 'lance_met' },
    { toast: 'Lance is waiting in Mahogany Town.' },
  ],

  // -- The Rocket Hideout (the descent, run from Lance in Mahogany):
  // a gauntlet of must-win { battle } steps — a loss stalls the chain
  // with no flag and no event-done, so talking to Lance re-runs the
  // descent; it can never half-clear. The MEGACELL power core is a
  // wildBattle staged as a battle (uncatchable — it is a machine's
  // heart, not a wild encounter). Lance fights beside you in the
  // dialogue between beats, not as a mechanic.
  ev_johto_hideout: [
    { say: ['Behind the souvenir shop\'s counter, under a trapdoor stacked with unsold keychains: stairs. The air coming up is warm, electric, and humming at a pitch that makes your teeth ache — the lake\'s scream, at its source.'], who: 'NARRATOR' },
    { say: ['WYRMARCH walks point with me — you watch our backs, trainer, and I will watch yours. Whatever they are powering down here, it ends tonight. On three. One — two —'], who: 'LANCE' },
    { battle: 'rocket_hideout_1' },
    { say: ['The first room folds. Lance does not even slow down — somewhere to your left a WYRMARCH\'s wingbeat puts out a row of lights like candles, and the humming climbs a note. The core is close. The core is AWAKE.'], who: 'NARRATOR' },
    { battle: 'rocket_hideout_2' },
    { say: ['There. The power core: a ring of MEGACELL, wired into the transmitter like beads on a wire, pouring themselves into the signal. They cannot be caught and they cannot be reasoned with — they can only be emptied. Gently is not available. Go.'], who: 'LANCE' },
    { wildBattle: { species: 'electrode', level: 166, uncatchable: true } },
    { say: ['The core cracks open like an egg of light. The hum stutters — drops — dies, floor by floor, and in the sudden quiet you can hear the lake, miles north, going calm. One door remains, and behind it, the hand that signed the orders.'], who: 'NARRATOR' },
    { battle: 'rocket_hideout_exec' },
    { say: ['It is over. The transmitter is dark, the signal is dead, and Team Rocket\'s little empire under the souvenir shop is a basement again — wet concrete and abandoned paperwork.', 'You fight the way the lake needed someone to fight, trainer. Remember that. Now — Mahogany has a gym, and an old man in it who has been waiting out an occupation. Pryce is free to take challengers again. Tell him Lance sent you. Tell him the lake is quiet.'], who: 'LANCE' },
    { flag: 'johto_hideout_cleared' },
    { toast: 'The Rocket Hideout is cleared!' },
  ],

  // -- The Radio Tower takeover (staged AFTER the hideout) ---------
  ev_johto_radio_takeover: [
    { say: ['The Radio Tower\'s lobby is too quiet, and every speaker in it is playing the same thing: a cheerful jingle, cut off mid-note, and a voice you do not know, reading the same sentence it was reading when you walked the plaza an hour ago. "— we are back. Tell your Pokemon to listen closely. We are back —"'], who: 'NARRATOR' },
    { say: ['Team Rocket has taken the tower. With the hideout gone they have gone loud instead — a broadcast to every Pokemon in Johto, calling them to a new Rocket age. The staff are locked out, the stairs are guarded, and somewhere above you a fake cheerful voice is reading your region its future. Not today.'], who: 'NARRATOR' },
    { battle: 'rocket_radio_1' },
    { flag: 'radio_takeover_active' },
    { flag: 'radio_f1_cleared' },
    { toast: 'Team Rocket holds the upper floors!' },
  ],
  ev_johto_radio_locked: [
    { say: ['The stair door to the third floor is locked — a card reader, blinking red, patient as a held breath. From below, the tower\'s own speakers carry a waltz. From above, boots.'], who: 'NARRATOR' },
    { say: ['A whisper through the stairwell grille — the tower engineer, hiding in a cable run: "Trainer! The Director has the Card Key — but the man upstairs in the Director\'s suit is NOT him. The real Director is being held below the city, in the Underground\'s south passage. Free him. The key opens this door — and only this door matters now."'], who: 'ENGINEER DARA' },
    { flag: 'radio_locked_seen' },
    { toast: 'The real Director is in the Underground!' },
  ],
  ev_johto_director: [
    { say: ['The Underground\'s south passage smells of damp wool and old bargains. At its far end, behind a stall\'s worth of crates: a Rocket guard, a rope, and a very dignified man in a broadcasting blazer, sitting on a box with the posture of a king on a very small throne.'], who: 'NARRATOR' },
    { battle: 'rocket_underground' },
    { say: ['Untied, brushed down, and furious in the quiet way of men who sign licences: "Director Ainsley Hale, Goldenrod Radio. You have my thanks and my outrage, trainer, in equal measure. They took my tower, my microphone, and — the insult I cannot forgive — my SUIT is being worn by a Rocket upstairs, badly."', '"Take this. My Card Key. It opens the tower\'s locked floor — the stairs above the second. Go and take my building back. And trainer — when you reach the top floor, the man in my suit will try to thank you for rescuing him. He rehearsed it. I can hear him through the vents."'], who: 'DIRECTOR HALE' },
    { give: { items: { cardkey: 1 }, text: 'Got the Card Key!' } },
    { flag: 'radio_director_rescued' },
    { toast: 'The Card Key opens the tower\'s locked floor.' },
  ],
  ev_johto_radio_f2: [
    { say: ['The Card Key turns the reader green. Beyond the door: the second floor\'s last guard, standing in a drift of torn broadcast schedules, already reaching for a ball.'], who: 'NARRATOR' },
    { battle: 'rocket_radio_2' },
    { flag: 'radio_f2_cleared' },
    { toast: 'The top floor is open. The Director\'s office waits.' },
  ],
  ev_johto_radio_top: [
    { say: ['The Director\'s office. A wide desk, a warmer suit than the real Director has ever owned, and behind it a man arranging his face into gratitude like a bouquet. On the desk, the master microphone. On his face, when he sees your badge case: the exact moment the rehearsal fails.'], who: 'NARRATOR' },
    { battle: 'rocket_director_fake' },
    { say: ['It ends the way takeovers end when one trainer climbs the whole building: quickly, and then all at once. The fake Director is hauled down the stairs by his own former guards, the master microphone is cut, and Director Hale\'s real voice — crackling up from the plaza speakers, borrowed from a handheld set — says the only honest broadcast of the day:', '"— to every trainer and Pokemon in Johto: the tower is ours again. Theirs is over. Team Rocket has left the air."', 'Below, Goldenrod is cheering at loudspeakers. Rocket is gone from Johto — the well, the lake, the tower: finished. The road east is calling, trainer. Blackthorn. Then the Conference.'], who: 'NARRATOR' },
    { flag: 'radio_tower_cleared' },
    { toast: 'Team Rocket has left Johto!' },
  ],

  // -- Route Silver: the badge gate. Fired by sysLoadMap when a
  // player WITHOUT all 8 Johto badges enters route-silver; the warp
  // step returns them to Blackthorn's east edge — turned back with
  // directions, never stuck (the pass is re-enterable the moment
  // the eighth badge lands).
  ev_johto_silver_gate: [
    { say: ['At the mouth of Silver Pass, a League official in a wind-cut coat steps into the road with one hand raised — not unkindly. Just finally.'], who: 'NARRATOR' },
    { say: ['"Conference road, trainer, and the Conference keeps its one rule: eight Johto badges, earned in Johto, no exceptions and no shortcuts — I have turned back gym leaders\' own children at this post, so do not take it personally."', '"Blackthorn is behind you, and Clair and the Dragon\'s Den are where the last of it waits for most. When your case holds eight, this road will be the proudest walk of your life. I will be here. I am always here."'], who: 'PASS OFFICER HALD' },
    { warp: { map: 'blackthorn', x: 28, y: 8 } },
  ],

  // -- Silver, third clash (Route Silver, past the gate): the
  // rivalry with Silver closes. battleAny — win or lose, the words
  // land: he acknowledges the gap either way.
  ev_johto_silver_route: [
    { say: ['Halfway up Silver Pass, where the wind has opinions and the road narrows to single file: red hair, a Crobat on the crosswind, and a Feraligatr standing in the road like a toll. He has been waiting. By the look of the camp ashes behind him, he has been waiting a while.'], who: 'NARRATOR' },
    { say: ['I stole a Pokemon from a glass case, and I told myself the case was the crime. Then a trainer from a boat kept showing up — Route 30, the forest — and the story kept not going the way I wrote it.', 'One more measurement, {player}. The real one. Feraligatr: FULL strength. No excuses left in either of us.'], who: 'SILVER' },
    { battleAny: { trainer: 'silver_route', winFlag: 'silver_route_won', loseFlag: 'silver_route_lost' } },
    { say: ['Whatever the battle decided, he stands in the settling dust doing the arithmetic he has avoided all arc — and then, astonishingly, he laughs. Once. Like it hurts and helps at the same time.', '"There is the gap. Not luck. Not the road. You trained yours like partners and I trained mine like weapons, and the weapons kept... looking at me. Waiting to be asked, not aimed." He looks at Feraligatr. Feraligatr looks back, patient as a tide. "...We are going back to Azalea. There is a man there who makes balls by hand, and a lab with a page missing. I do not know how you return a beginning. I am going to learn."', 'He steps out of the road. The whole road, all of it, held his breath with him — Silver Pass is yours, trainer. The Conference is at the top of it. Go and be measured by better judges than me.'], who: 'SILVER' },
    { flag: 'silver_route_done' },
    { toast: 'The road to the Conference is clear.' },
  ],

  // ================= Stage J5: legendary staging =================
  // The episode-1 echo: a one-time glimpse on Route 29, fired by the
  // sysLoadMap gate the first time the player enters r29 in the Johto
  // arc before the tower history is heard. Dialogue-only flavour —
  // it sets hooh_glimpsed, never a quest requirement.
  ev_johto_hooh_glimpse: [
    { say: ['The morning is doing its best impression of an ordinary one — and then the light changes.', 'Something crosses the sun: vast, unhurried, wings like a flag of every colour the sky owns. It does not look down. It does not need to. For three heartbeats the whole route is beneath a rainbow that is going somewhere on purpose — and then the sky is just the sky again, and a little poorer for it.'], who: 'NARRATOR' },
    { arc: 'arc_hooh', stage: 'discovered' },
    { flag: 'hooh_glimpsed' },
    { toast: 'Something rainbow-winged crossed the morning. Ecruteak\'s elders would know that shape.' },
  ],
  // Raikou's face: the storm field of the National Park, after both
  // trail signs. Catch-only chain (wildBattleCatch) — flee or KO and
  // the storm simply gathers again another day.
  ev_johto_raikou: [
    { say: ['The park\'s open ground has been holding its breath all day — the fountain still, the grass combed flat by a wind that only blows at ankle height. Then the thunder arrives, except the sky is empty, and the thunder has legs.', 'It stands in the storm field looking at you the way weather looks at a house: without malice, without negotiation. Every hair on your arms stands up to greet it.'], who: 'NARRATOR' },
    { arc: 'arc_raikou', stage: 'active' },
    { wildBattleCatch: { species: 'raikou', level: 178, legendary: true } },
    { arc: 'arc_raikou', stage: 'complete' },
    { flag: 'arc_raikou_done' },
    { toast: 'Raikou is yours. The storm lets go of the park all at once, like a held breath let out.' },
  ],
  // Entei's face: Mt. Mortar's deep chamber — the volcanic heart.
  ev_johto_entei: [
    { say: ['The mountain has been warm all the way up, but this chamber is the warmth\'s source — the rock ticks with cooling and heating, and somewhere below the floor something enormous turns over in the earth\'s sleep.', 'It steps out of the heat-shimmer already awake, already looking at you, ash sliding off a back broad as a lintel. The chamber\'s whole held breath goes out of it in one long, low note.'], who: 'NARRATOR' },
    { arc: 'arc_entei', stage: 'active' },
    { wildBattleCatch: { species: 'entei', level: 180, legendary: true } },
    { arc: 'arc_entei', stage: 'complete' },
    { flag: 'arc_entei_done' },
    { toast: 'Entei is yours. The mountain settles around you like a dog deciding to stay.' },
  ],
  // Suicune's face: the Bell Tower's foot (bell-tower-1 entry), gated
  // by its signs AND by both other beasts being caught — it comes to
  // the tower when the others are quieted.
  ev_johto_suicune: [
    { say: ['It is standing at the tower\'s foot when you come in, exactly as the wardens said it would be once the others were quiet: patient as frost, ribbons hanging in air that has forgotten how to move.', 'It regards you the way deep water regards the shore — with total, courteous attention. The north wind, arriving politely late, moves through the tower bells and every one of them almost rings.'], who: 'NARRATOR' },
    { arc: 'arc_suicune', stage: 'active' },
    { wildBattleCatch: { species: 'suicune', level: 184, legendary: true } },
    { arc: 'arc_suicune', stage: 'complete' },
    { flag: 'arc_suicune_done' },
    { toast: 'Suicune is yours. Somewhere above you, one bell rings once, very softly, on nobody\'s hand.' },
  ],
  // Celebi: the GS Orb at the Ilex shrine (fired by the shrine's
  // faced-tile interact in overworld-systems, not a map-entry gate —
  // the shrine is a place you go to, not a room you pass through).
  ev_johto_celebi: [
    { say: ['The GS Orb comes out of your bag already warm. At the shrine\'s foot it clicks — a small, definite sound, like a latch being asked a question and answering yes — and the two halves open on nothing at all, and the nothing is looking at you.', 'Then the forest breathes in. For one held moment Ilex is young: saplings where the old oaks stand, light the colour of first mornings, leaf-mould unstepped-on by any boot that has ever existed. A small green shape hangs in that younger light, wings ticking like a clock that counts in seasons, and it is laughing — delighted, entirely unafraid — and the laugh says: you took the long way round, and the long way round was the way.'], who: 'NARRATOR' },
    { flag: 'celebi_shrine_opened' },
    { arc: 'arc_celebi', stage: 'active' },
    { wildBattleCatch: { species: 'celebi', level: 170, legendary: true } },
    { arc: 'arc_celebi', stage: 'complete' },
    { flag: 'arc_celebi_done' },
    { say: ['When it is over the forest is old again, and kind about it. The GS Orb hangs open and empty in your hand — an ordinary impossible object, its one errand run. You keep it. Some souvenirs are proof; this one is a receipt.'], who: 'NARRATOR' },
    { toast: 'Celebi is yours. The empty GS Orb stays in your bag — a memento.' },
  ],
  // Ho-Oh: the Bell Tower summit, with the Clear Bell in hand.
  ev_johto_hooh: [
    { say: ['The summit bells take the Clear Bell\'s chime up like a relay — hand to hand, bronze to crystal — and throw it out over Ecruteak in a single widening ring.', 'Then the sky answers. It comes down out of the morning in no hurry at all: seven colours in good order, a crest like a sunrise deciding to stay, eyes that have watched a tower burn and a tower rise and are interested — genuinely, courteously interested — in what you are. The perch takes its weight the way the tower takes weather. Five hundred years of ash settle, very quietly, in your chest.'], who: 'NARRATOR' },
    { flag: 'hooh_summit' },
    { arc: 'arc_hooh', stage: 'active' },
    { wildBattleCatch: { species: 'hooh', level: 182, legendary: true } },
    { arc: 'arc_hooh', stage: 'complete' },
    { flag: 'arc_hooh_done' },
    { toast: 'Ho-Oh is yours. Every bell in Ecruteak rings once — the sisters will say it was the wind, and smile when they say it.' },
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
    id: 'tale_azalea', town: 'Azalea Town', giver: 'MAIZIE', title: 'Rain for the DOZELING', johtoTale: true,
    stages: [
      'Ask the Wellkeeper Jonas in Azalea about the DOZELING rain story',
      'Tell Maizie the story, the way Jonas told it',
    ],
    reward: { items: { hyperpotion: 1 } }, rewardText: '1 Hyper Potion',
    bondNpc: 'maizie', bondDelta: 1,
    revelation: 'The wellkeeper\'s grandfather swore the great drought broke the morning a whole town simply stood in the dry well and sang — the DOZELING answered first, and the rain answered them.',
    offerLines: ['Everyone says the DOZELING brought the rain back to Azalea, once, in the big drought. Everyone! But nobody tells it PROPERLY anymore.', 'Wellkeeper Jonas tells it properly. Go and hear it from him, then tell it back to me — a Hyper Potion for the full story, no skipping the good parts.'],
    stageLines: ['The rain story? You want it properly, then. Sit on the well rim — no, not IN, sit ON.', 'My grandfather was there. A year with no rain, the well dry as a drum, and the whole town gone quiet with thirst. Then old Yuna — Kurt\'s mother — climbed down and started SINGING into the empty well, and one by one the town joined her, and the DOZELING lifted their heads and sang back. By morning: rain. A week of it. Tell Maizie all of it — especially the singing.'],
    finishLines: ['They SANG into the well?! And the DOZELING sang back, and THEN the rain...', 'That is the best version. That is the one I am telling from now on, and I am telling it exactly like that. A Hyper Potion — earned. Storytellers should be paid properly; Jonas says so.'],
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
  tale_olivine: {
    id: 'tale_olivine', town: 'Olivine City', giver: 'LIGHTKEEPER ADA', title: 'The Light That Waits', johtoTale: true,
    stages: [
      'Ask Sailor Joss in Olivine what the harbor does when the light goes out',
      'Tell Lightkeeper Ada what Joss said',
    ],
    reward: { items: { superpotion: 2 } }, rewardText: '2 Super Potions',
    bondNpc: 'ada', bondDelta: 1,
    revelation: 'When the lighthouse went dark in the great storm, Olivine\'s fishing fleet did not stay in port — every boat lit its own lamp and held a line of small lights from the harbor mouth to open water, and the big ships steered home by their neighbors.',
    offerLines: ['Forty years I have kept that light, trainer, through Amphy and her mother before her. Everybody asks how the light works. Nobody asks what the harbor does on the nights it cannot.', 'Ask Sailor Joss, down by the water. He was out in the great storm, the year the lamp failed. Bring me what he tells you — two Super Potions for the story, told straight.'],
    stageLines: ['The year the light failed? I was nineteen, and my father\'s boat was the last one out. You want to know what the harbor did, ask what the boats did.', 'Every fishing boat in Olivine lit its lamp and took station — harbor mouth to open water, a road of small lights on black sea. The big ships steered by US, trainer. Tell Ada: the light never really went out. It just changed hands for a night.'],
    finishLines: ['It changed hands... He said that? That old — of course he said that. It is the truest thing ever said about this port, and a sailor said it in one breath.', 'That is why Amphy\'s light matters, trainer. Not because the harbor is helpless without it. Because on the one night it mattered, the harbor learned it was not. Two Super Potions — and thank you for carrying that home to me.'],
  },
  tale_cianwood: {
    id: 'tale_cianwood', town: 'Cianwood City', giver: 'ISLAND ELDER BRAN', title: 'Salt on the Steps', johtoTale: true,
    stages: [
      'Ask Surf Kid Nia in Cianwood why the gym steps are worn in the middle',
      'Tell Island Elder Bran what Nia said',
    ],
    reward: { items: { greatball: 2 } }, rewardText: '2 Great Balls',
    bondNpc: 'bran', bondDelta: 1,
    revelation: 'The gym\'s stone steps are worn hollow in the middle because for a hundred years every challenger, winner or loser, has sat on the same step afterward to watch the sea — Chuck\'s master started it, sitting with the trainers he had just beaten until their hands stopped shaking.',
    offerLines: ['Look at the gym steps as you pass, trainer. Worn in the middle, like a saddle. A hundred years of challengers did that — but not the way you think.', 'Surf Kid Nia watches those steps every day from the water. Ask her what she sees, and bring me her answer. Two Great Balls for it — island knowledge should travel.'],
    stageLines: ['The steps? Oh, I know the steps. I surf past them every morning, and every morning somebody is sitting in the hollow.', 'Winners sit there. Losers sit there LONGER. And here is the thing nobody from the mainland believes: Chuck sits there too. After every battle. Next to whoever he just fought, saying nothing, until their hands stop shaking. His master did it. His master\'s master did it. The stone remembers a hundred years of sitting still until it is over.'],
    finishLines: ['Until their hands stop shaking... She sees it clearly, that girl. Clearer than the ones who climb.', 'That hollow is the real trophy of this island, trainer. Badges leave. The sitting stays. Two Great Balls — and when your hands shake out there, find a step. It is what they are for.'],
  },
  tale_mahogany: {
    id: 'tale_mahogany', town: 'Mahogany Town', giver: 'LAKEWATCHER FENN', title: 'The Lake Keeps Count', johtoTale: true,
    stages: [
      'Ask Timberwright Oda in Mahogany what the lake gave back',
      'Tell Lakewatcher Fenn what Oda said',
    ],
    reward: { items: { hyperpotion: 1 } }, rewardText: '1 Hyper Potion',
    bondNpc: 'fenn', bondDelta: 1,
    revelation: 'Oda\'s grandfather, the town\'s first timberwright, threw his wedding ring into the lake in a rage after an argument — and a RUSTCARP delivered it back to his doorstep plank three winters later, in the spring melt, the week the couple\'s fiftieth anniversary came due. Mahogany says the lake keeps count of everything it is owed and everything it owes.',
    offerLines: ['Thirty years I have watched that lake, trainer, and I will tell you its one law for an errand: the lake keeps count. What it takes, it owes. What it is given, it remembers.', 'Timberwright Oda knows a count the lake settled. Ask him what the lake gave back. A Hyper Potion for the telling — some stories are medicine.'],
    stageLines: ['What the lake gave back? My grandfather\'s ring. Sit — no, stand there, the story is short and I tell it standing, the way he did.', 'He threw it in after a row with my grandmother, the winter they were wed — threw it far, and was too proud to fish for it. Three winters later the spring melt comes down, and on the doorstep plank, in a clump of weed: the ring. A RUSTCARP had been carrying it, or the current had, or the lake had. In Mahogany we do not separate those. It came back the week of their fiftieth. He never took it off again.'],
    finishLines: ['The week of their fiftieth. The count kept to the WEEK. That is the lake all over, trainer — slow as ice and exact as a ledger.', 'That is why this town did not panic when the water turned strange lately. We know the lake. What is taken from it is owed, and what is owed comes back. A Hyper Potion — earned, and counted.'],
  },
  tale_blackthorn: {
    id: 'tale_blackthorn', town: 'Blackthorn City', giver: 'MOVE KEEPER ELDER', title: 'What Dragons Remember', johtoTale: true,
    stages: [
      'Ask Dragon Tamer Ryu in Blackthorn what the dragons remember',
      'Tell the Move Keeper Elder what Ryu said',
    ],
    reward: { items: { fullheal: 1 } }, rewardText: '1 Full Heal',
    bondNpc: 'elder', bondDelta: 1,
    revelation: 'The clan\'s dragons are not taught their oldest moves in the den at all — the tamers take the young ones to the same black rocks above the town every spring, because a dragon learns a move twice: once in the body, and once in the place its grandmother learned it.',
    offerLines: ['I keep the moves of this clan written in books, trainer, and I will confess a keeper\'s shame for an errand: there is one thing the dragons know that none of my books can hold.', 'Dragon Tamer Ryu trains the young ones on the black rocks. Ask him what the dragons remember that I cannot write. A Full Heal for the answer — accuracy is a kind of medicine too.'],
    stageLines: ['What do they remember? Elder, you old book — come here in spring and SEE. We take the young ones to the black rocks above town, the same rocks, every year.', 'A dragon learns a move twice. Once in the body — that part your elder can write down. And once in the PLACE: the rock where its grandmother learned it, the wind off the same cliff. They stand where she stood and the move arrives like something remembered, not taught. Tell the keeper: it is not that the books are wrong. It is that dragons keep their library in geography.'],
    finishLines: ['A library in geography... Fifty years of ink, and the true catalogue is a hillside. Of course. Of COURSE.', 'I will write that in the front of the first book, where the young keepers will trip over it: the moves live in the clan twice — in the hand, and in the ground. A Full Heal, trainer, for the truest footnote of my life.'],
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
  { map: 'sprout-tower-1', x: 10, y: 6, name: 'MONK JIN', art: 'monk', skin: '#e8b888', shirt: '#50368e', pants: '#2c3049', hair: '#2a1a0a', trainer: 'sprout_monk_1',
    dialogue: ['You bend well, traveler. The stairs are yours.'] },
  { map: 'sprout-tower-2', x: 10, y: 5, name: 'MONK REI', art: 'monk', skin: '#d8a878', shirt: '#50368e', pants: '#2c3049', hair: '#1a1a1a', trainer: 'sprout_monk_2',
    dialogue: ['They dance, your legs. The Elder is expecting you.'] },
  { map: 'sprout-tower-2', x: 8, y: 2, name: 'ELDER LI', art: 'elder', skin: '#e8b888', shirt: '#5a4a6a', pants: '#3a3a4a', hair: '#e8e8e8', johto: 'sprout_elder',
    dialogue: ['The tower sways, and so do we all. That is not weakness, child. That is how tall things survive.'] },
  { map: 'gym-azalea', x: 7, y: 2, name: 'BUGSY', art: 'gym2', skin: '#f0c8a0', shirt: '#324a83', pants: '#3a3a2a', hair: '#3a6a2a', johto: 'bugsy',
    dialogue: ['Every web in this room is load-bearing, challenger.'] },
  { map: 'slowpoke-well', x: 5, y: 2, name: 'ROCKET GRUNT', art: 'rocket', skin: '#e8b888', shirt: '#2a2a2a', pants: '#2a2a3a', hair: '#3a2a1a', johto: 'rocket_well_1',
    dialogue: ['This well is a work site. Scram!'] },
  { map: 'slowpoke-well', x: 13, y: 5, name: 'ROCKET GRUNT', art: 'rocket', skin: '#d8a878', shirt: '#2a2a2a', pants: '#2a2a3a', hair: '#1a1a1a', johto: 'rocket_well_2',
    dialogue: ['You people are bad for business.'] },
  { map: 'slowpoke-well', x: 10, y: 10, name: 'ROCKET SENIOR', art: 'rocket', skin: '#c89878', shirt: '#3a2a3a', pants: '#2a2a3a', hair: '#5a5a5a', johto: 'rocket_well_3',
    dialogue: ['I run this well crew.'] },
  { map: 'kurt-house', x: 4, y: 3, name: 'KURT', art: 'elder', skin: '#e8b888', shirt: '#2d4377', pants: '#3a3a4a', hair: '#e8e8e8', johto: 'kurt',
    dialogue: ['Balls made by hand remember the hand. Machines never learned that.'] },
  { map: 'gym-goldenrod', x: 7, y: 2, name: 'WHITNEY', art: 'gym3', skin: '#f0c8a0', shirt: '#e88ab0', pants: '#4a3a5a', hair: '#e8a0b8', johto: 'whitney',
    dialogue: ['My Miltank has been waiting ALL week for a real challenger.'] },
  { map: 'gym-ecruteak', x: 7, y: 2, name: 'MORTY', art: 'gym4', skin: '#e8b888', shirt: '#4a3a6a', pants: '#2a2a3a', hair: '#d8c8a0', johto: 'morty',
    dialogue: ['The fog is honest. It hides nothing that matters.'] },
  // ---- Stage J4b: the east actors ----
  { map: 'gym-cianwood', x: 7, y: 2, name: 'CHUCK', art: 'bruno', skin: '#d8a878', shirt: '#a03a2a', pants: '#3a3a2a', hair: '#2a1a0a', johto: 'chuck',
    dialogue: ['We train where the waves hit, challenger!'] },
  { map: 'house-cianwood', x: 10, y: 5, name: 'CHUCK\'S WIFE', art: 'lady', skin: '#f0c8a0', shirt: '#e8e0c8', pants: '#5a4a6a', hair: '#6a4a2a', johto: 'chucks_wife',
    dialogue: ['My husband is at the gym, roaring at the weather.'] },
  { map: 'lighthouse-2', x: 5, y: 4, name: 'JASMINE', art: 'lady', skin: '#f0c8a0', shirt: '#c8d4e0', pants: '#4a5a6a', hair: '#8a6a4a', johto: 'jasmine_light',
    dialogue: ['Amphy... please hold on. The light has to hold on.'] },
  { map: 'gym-olivine', x: 7, y: 2, name: 'JASMINE', art: 'lady', skin: '#f0c8a0', shirt: '#c8d4e0', pants: '#4a5a6a', hair: '#8a6a4a', johto: 'jasmine',
    dialogue: ['Amphy first. Everything in Olivine is Amphy first, until the light is well.'] },
  { map: 'lake-of-rage', x: 16, y: 15, name: 'LANCE', art: 'lance', skin: '#f0c8a0', shirt: '#7a2a3a', pants: '#2a2a3a', hair: '#c83a3a', johto: 'lance_lake',
    dialogue: ['The lake is screaming, trainer. Something is making it scream.'] },
  { map: 'mahogany', x: 18, y: 7, name: 'LANCE', art: 'lance', skin: '#f0c8a0', shirt: '#7a2a3a', pants: '#2a2a3a', hair: '#c83a3a', johto: 'lance_mahogany',
    dialogue: ['Mahogany smells of cedar and souvenirs. One of those is a lie.'] },
  { map: 'gym-mahogany', x: 7, y: 2, name: 'PRYCE', art: 'elder', skin: '#e8b888', shirt: '#dfe8ee', pants: '#3a4a5a', hair: '#e8e8e8', johto: 'pryce',
    dialogue: ['Winter is honest about what you are. So am I.'] },
  { map: 'gym-blackthorn', x: 7, y: 2, name: 'CLAIR', art: 'acetrainer', skin: '#f0c8a0', shirt: '#3a4a7a', pants: '#2a2a4a', hair: '#4a6ac8', johto: 'clair',
    dialogue: ['The clan keeps dragons. I keep this gym. Completely.'] },
  { map: 'silver-stadium', x: 13, y: 5, name: 'GARY', art: 'gary', skin: '#f0c8a0', shirt: '#3a5a9a', pants: '#2a2a3a', hair: '#6a4a2a', johto: 'gary_stadium',
    dialogue: ['Took you long enough. The bracket has been boring without you.'] },
  { map: 'silver-stadium', x: 9, y: 5, name: 'HARRISON', art: 'acetrainer', skin: '#d8a878', shirt: '#7a672a', pants: '#3a3a2a', hair: '#a03a2a', johto: 'harrison',
    dialogue: ['Harrison, from Littleroot. I have been watching your side of the bracket with great interest.'] },
  { map: 'mt-silver-cave', x: 8, y: 2, name: 'RED', art: 'rival', skin: '#f0c8a0', shirt: '#c83a2a', pants: '#2a3a5a', hair: '#2a1a0a', johto: 'red',
    dialogue: ['...'] },
  // ---- Stage J5: legendary witnesses, elders, and the hideout stairs.
  // The beast "signs" are witness NPCs placed by this same append
  // idiom — generated signs are inert text (no flags), and a tracked
  // chase needs state. Their handlers live with runJohtoNpc.
  { map: 'r35', x: 17, y: 7, name: 'STORMWATCHER IBEN', art: 'camper', dir: 'down', johto: 'beast_sign_raikou_1',
    dialogue: ['I watch weather for the park service. Lately the weather watches back.'] },
  { map: 'r36', x: 22, y: 6, name: 'RANGER SOLVEIG', art: 'picnicker', dir: 'down', johto: 'beast_sign_raikou_2',
    dialogue: ['Mind the meadow stones. Something has been signing them.'] },
  { map: 'burned-tower-1', x: 5, y: 8, name: 'ASHKEEPER MONK', art: 'elder', dir: 'down', johto: 'beast_sign_entei_1',
    dialogue: ['I keep the ashes of the old tower. Some of them, lately, are warm.'] },
  { map: 'mt-mortar-1', x: 15, y: 5, name: 'KARATE TRAINEE BO', art: 'blackbelt', dir: 'down', johto: 'beast_sign_entei_2',
    dialogue: ['Master trains above. Something else trains above too, I think.'] },
  { map: 'ecruteak', x: 24, y: 6, name: 'BELL WARDEN YUKI', art: 'elder', dir: 'down', johto: 'beast_sign_suicune_1',
    dialogue: ['The tower bells know more weather than the sky does.'] },
  { map: 'cianwood', x: 24, y: 5, name: 'FISHERWOMAN NOOR', art: 'fisher', dir: 'down', johto: 'beast_sign_suicune_2',
    dialogue: ['The north shore keeps a secret most mornings.'] },
  { map: 'ecruteak', x: 20, y: 5, name: 'ELDER GENSAI', art: 'elder', dir: 'down', johto: 'hooh_elder',
    dialogue: ['Two towers, one skyline, and a story older than both. Ask, if you have the time it deserves.'] },
  { map: 'dance-theater', x: 5, y: 8, name: 'KIMONO SISTER MOEKO', art: 'kimono', dir: 'down', johto: 'kimono_bell',
    dialogue: ['We dance the tower\'s seasons. The eldest of us keeps something for the tower, too.'] },
  { map: 'mahogany', x: 20, y: 6, name: 'SHOPKEEPER PELL', art: 'clerk', dir: 'down', johto: 'hideout_stairs', hideoutWarp: 'rocket-hideout',
    dialogue: ['Souvenirs above. Storage below. Mind the stairs — they are steeper than they look, and they look steep.'] },
  // ---- Stage J6: the Day-Care couple. The keeper already stands in
  // the maps6 interior (stamped johto:'daycare' by JOHTO_NPC_PATCHES
  // below); his wife joins him by this same append idiom. Both run
  // the one Day-Care flow (overworld-systems openDaycare).
  { map: 'daycare', x: 4, y: 7, name: 'DAY-CARE WOMAN', art: 'lady', skin: '#f0c8a0', shirt: '#7c3fa5', pants: '#2c3049', hair: '#8a8a8a', johto: 'daycare',
    dialogue: ['Every guest gets a name, a nap schedule, and a song. No exceptions in forty years.'] },
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
  // ---- Stage J4b: east tale actors + functional stamps ----
  { map: 'olivine', name: 'LIGHTKEEPER ADA', tale: 'tale_olivine', role: 'giver' },
  { map: 'olivine', name: 'SAILOR JOSS', tale: 'tale_olivine', role: 'stage' },
  { map: 'cianwood', name: 'ISLAND ELDER BRAN', tale: 'tale_cianwood', role: 'giver' },
  { map: 'cianwood', name: 'SURF KID NIA', tale: 'tale_cianwood', role: 'stage' },
  { map: 'mahogany', name: 'LAKEWATCHER FENN', tale: 'tale_mahogany', role: 'giver' },
  { map: 'mahogany', name: 'TIMBERWRIGHT ODA', tale: 'tale_mahogany', role: 'stage' },
  { map: 'blackthorn', name: 'MOVE KEEPER ELDER', tale: 'tale_blackthorn', role: 'giver' },
  { map: 'blackthorn', name: 'DRAGON TAMER RYU', tale: 'tale_blackthorn', role: 'stage' },
  // Functional stamps (the `johto` key routes these existing maps6
  // townsfolk into runJohtoNpc; loadMap's patch code copies it):
  { map: 'house-cianwood', name: 'PHARMACIST WREN', johto: 'pharmacist' },
  { map: 'dragons-den', name: 'DEN ELDER', johto: 'den_elder' },
  { map: 'route-silver', name: 'VETERAN HALD', johto: 'silver_gate' },
  { map: 'silver-stadium', name: 'CONFERENCE OFFICIAL', johto: 'conference' },
  // Stage J6: the Day-Care keeper (a maps6 roster NPC) joins the
  // runJohtoNpc dispatch as the breeding/eggs host.
  { map: 'daycare', name: 'DAY-CARE KEEPER', johto: 'daycare' },
];

// ---------------------------------------------------------------------------
// JOHTO_LEGENDARY_ARCS — Stage J5. The five Johto legendary arcs,
// folded into LEGENDARY_ARCS by merge.mjs exactly the way Orange's
// arcs fold (one arcs table, one quest log). arc_hooh is NOT here:
// it was designed inside LEGENDARY_ARCS (story-kanto.mjs) and J5
// activated it in place there. arc_celebi IS here, and Object.assign
// order makes this live entry supersede the designed one in
// story-kanto.mjs — the designed steps (a POSTDUCK errand) never
// matched the shipped GS Orb story J4a actually told.
//
// Shared laws (all five arcs):
//  - prereq `beasts_awakened` for the beasts and Celebi; Ho-Oh's
//    prereq rides its steps (beasts complete before the bell).
//  - Every face uses the catch-only wildBattleCatch chain: flee OR
//    KO stalls the event with nothing set, so the encounter re-fires
//    until the species is CAUGHT. Arc completion = the catch.
//  - Levels sit in Johto's band (101-200): the beasts at 178/180/184,
//    Celebi 170, Ho-Oh 182 (in LEGENDARY_ARCS; ruling 3 supersedes
//    the designed Lv 70).
// ---------------------------------------------------------------------------
export const JOHTO_LEGENDARY_ARCS = {
  arc_raikou: {
    id: 'arc_raikou', title: 'The Thunder That Walks', species: 'raikou', region: 'Johto',
    prereq: 'beasts_awakened',
    hook: 'The Burned Tower\'s basement stands empty — and on clear nights since, the thunder over Goldenrod has had a shape in it, and the shape has been getting closer.',
    steps: [
      { text: 'Talk to Stormwatcher Iben on Route 35 — she saw lightning strike the same pine twice and then walk away from it', flag: 'arc_raikou_sign1' },
      { text: 'Talk to Ranger Solveig on Route 36 about the scorch-signed meadow stones', flag: 'arc_raikou_sign2' },
      { text: 'Face Raikou, level 178, in the National Park\'s storm field — its thunder hunts open ground', catch: 'raikou' },
    ],
    lair: 'national-park',
  },
  arc_entei: {
    id: 'arc_entei', title: 'The Mountain\'s Heartbeat', species: 'entei', region: 'Johto',
    prereq: 'beasts_awakened',
    hook: 'It was born, the old monks say, in the lightning that burned the tower — and ash on the Burned Tower floor has been warm on cold mornings ever since the awakening.',
    steps: [
      { text: 'Talk to the Ashkeeper Monk in the Burned Tower about the pawprints in the ash', flag: 'arc_entei_sign1' },
      { text: 'Talk to Karate Trainee Bo in Mt. Mortar about the heat below the upper halls', flag: 'arc_entei_sign2' },
      { text: 'Face Entei, level 180, in Mt. Mortar\'s deep chamber — the volcanic heart of the mountain', catch: 'entei' },
    ],
    lair: 'mt-mortar-2',
  },
  arc_suicune: {
    id: 'arc_suicune', title: 'The North Wind\'s Errand', species: 'suicune', region: 'Johto',
    prereq: 'beasts_awakened',
    hook: 'Of the three that woke beneath the Burned Tower, one runs with the north wind and purifies what it passes — and the tower wardens say it saves its last call for the tower itself, when its kin are quiet.',
    steps: [
      { text: 'Talk to Bell Warden Yuki in Ecruteak about the shape seen at the Bell Tower\'s foot', flag: 'arc_suicune_sign1' },
      { text: 'Talk to Fisherwoman Noor on Cianwood\'s north shore about the water that ran clear', flag: 'arc_suicune_sign2' },
      { text: 'Quiet Raikou and Entei first — then face Suicune, level 184, at the Bell Tower\'s foot, where it comes when the others are still', catch: 'suicune' },
    ],
    lair: 'bell-tower',
  },
  arc_celebi: {
    id: 'arc_celebi', title: 'The Ball That Hums at Shrines', species: 'celebi', region: 'Johto',
    prereq: 'beasts_awakened',
    hook: 'The GS Orb Kurt has been studying began to hum the night the tower woke — and Kurt, who trusts old objects the way sailors trust weather, says it is not his to keep any longer.',
    steps: [
      { text: 'Return to Kurt in Azalea Town — the GS Orb stirred the night the tower woke, and he is giving it back', flag: 'gsball_back_with_player' },
      { text: 'Take the GS Orb to the forest shrine in Ilex Forest and stand before it', flag: 'celebi_shrine_opened' },
      { text: 'Face Celebi, level 170, in the forest\'s younger light', catch: 'celebi' },
    ],
    lair: 'ilex-forest',
  },
};
