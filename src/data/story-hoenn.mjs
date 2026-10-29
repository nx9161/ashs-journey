// story-hoenn.mjs — Arc 3 (Hoenn) campaign data, Stage H4a: the FIRST
// HALF of the Advanced spine (arrival -> Flannery) plus the Magma/Aqua
// seed chain (Meteor Falls, Mt. Chimney) and May's contest beats.
// Quest chain, leader / gym / villain trainer defs, scripted events,
// Town Tales and the loadMap NPC tables, in the story-johto.mjs idiom
// exactly (the CAPT JOHTO precedent: actors are appended / patched at
// loadMap, never written into the generated maps7.mjs).
// Anime is primary canon (ADR-015); ALL dialogue is original writing
// in the game's voice — no quoted or closely-paraphrased lines.
//
// Stage split: H4a ships badges 1-4 (stone / knuckle / dynamo / heat),
// the Birch rescue + lab arrival, May's co-spine opening and her
// Slateport / Verdanturf / Fallarbor contest beats, Wally's first beat,
// and the Magma/Aqua SEEDS. H4b (appended below the marked seams)
// ships the east: Norman -> Juan, the Weather Institute full beat,
// Mt. Pyre orbs, the hideouts, Seafloor Cavern, the drought/deluge
// climax (which sets/clears the weather override flags the H4a
// renderer reads — src/game/weather.mjs: climax_drought /
// climax_deluge), the Lucario special, and the Ever Grande Conference
// -> hoenn_complete through the Foundation machine.
//
// The visual weather layer itself lives in src/game/weather.mjs
// (ruling 4: presentation ONLY — no battle/encounter effects).

// ---------------------------------------------------------------------------
// HOENN_QUESTS — the Hoenn main-story objective chain (first-half rows),
// in the MAIN_QUESTS idiom (id / flag / text / hint). `flag` is the story
// flag that completes the objective. H4b appends the east rows below
// the marked seam.
// ---------------------------------------------------------------------------
export const HOENN_QUESTS = [
  { id: 'q_hoenn_rescue', flag: 'birch_rescued', text: 'Help Professor Birch — something is chasing him near Littleroot', hint: 'Shouting, just off the Littleroot road. A wild Poochyena has the professor cornered — drive it off.' },
  { id: 'q_hoenn_arrival', flag: 'hoenn_arrival', text: 'Meet Professor Birch in his Littleroot lab', hint: 'Birch\'s lab stands at the north edge of Littleroot. He owes you a proper welcome — and your Hoenn journey needs registering.' },
  { id: 'q_hoenn_wally', flag: 'wally_helped', text: 'Help Wally catch his first Pokemon in Petalburg', hint: 'A frail boy in Petalburg wants to catch a Pokemon of his own before his family moves. He has the heart; he needs a borrowed partner and a steady friend.' },
  { id: 'q_hoenn_stone', flag: 'badge_stone', text: 'Win the Stone Badge from Roxanne in Rustboro City', hint: 'Roxanne keeps Rustboro\'s gym with Rock types raised from the quarry stone itself. Water, Grass, Fighting, Ground and Steel moves crack them.' },
  { id: 'q_hoenn_knuckle', flag: 'badge_knuckle', text: 'Win the Knuckle Badge from Brawly in Dewford Town', hint: 'Brawly trains where the surf breaks. His Fighting types fear Flying and Psychic moves — and respect anyone who crossed the water to reach him.' },
  { id: 'q_hoenn_slateport_may', flag: 'may_slateport_done', text: 'Watch May compete at the Slateport Contest Hall', hint: 'May is entering her first big contest in Slateport. She would never ask you to come. Come anyway.' },
  { id: 'q_hoenn_meteor', flag: 'meteor_falls_done', text: 'See what the two teams wanted at Meteor Falls', hint: 'North of Rustboro, the falls run cold under old star-stone. Professor Cozmo studies the meteorites there — and lately, he has had watchers.' },
  { id: 'q_hoenn_dynamo', flag: 'badge_dynamo', text: 'Win the Dynamo Badge from Wattson in Mauville City', hint: 'Wattson built Mauville\'s grid and its gym with his own hands. His Electric types fear Ground moves above all.' },
  { id: 'q_hoenn_verdanturf_may', flag: 'may_verdanturf_done', text: 'Watch May compete at the Verdanturf Contest Hall', hint: 'Verdanturf\'s hall is small and serious about it. May has been practicing a new appeal all week.' },
  { id: 'q_hoenn_chimney', flag: 'chimney_clash_done', text: 'Break up the clash on Mt. Chimney', hint: 'Two teams, one volcano, and a meteorite that does not belong to either of them. The cable car from Route 112 climbs straight into it.' },
  { id: 'q_hoenn_heat', flag: 'badge_heat', text: 'Win the Heat Badge from Flannery in Lavaridge Town', hint: 'Flannery is new to her grandfather\'s gym and determined to burn bright enough to fill it. Her Fire types fear Water, Ground and Rock moves.' },
  { id: 'q_hoenn_fallarbor_may', flag: 'may_fallarbor_done', text: 'Watch May compete at the Fallarbor Contest Hall', hint: 'Ash country. The Fallarbor crowd judges hard and applauds harder. May knows it — she picked this hall on purpose.' },
  // --- H4b: the east rows append here ---
];

// ---------------------------------------------------------------------------
// HOENN_TRAINERS — merged into TRAINERS by merge.mjs. Leader shape is
// the Kanto gym idiom exactly, plus badgeSet: 'hoenn' so winTrainer's
// award path writes badges.hoenn + the badge_<root> flag. Leader aces
// carry an authored keepsake (the Classic leader-ace pattern).
// Levels ride the Hoenn band (201-300), ruling 6 curve for H4a:
// Roxanne ace 215, Brawly 225, Wattson 235, Flannery 245.
// ---------------------------------------------------------------------------
export const HOENN_TRAINERS = {
  roxanne: {
    id: 'roxanne', name: 'Roxanne', title: 'Rustboro Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['I am Roxanne, and this gym is my classroom as much as my arena. Every stone in it was placed to teach one lesson: what looks immovable is only waiting for the right pressure. Show me yours, challenger.'],
    lose: ['Pressure, perfectly applied... The class is yours today.', 'The Stone Badge is yours. Take the quarry road north sometime — the falls up there have been teaching the same lesson longer than either of us.'],
    team: [
      { species: 'geodude', level: 209 },
      { species: 'aron', level: 212 },
      { species: 'nosepass', level: 215, keepsake: 'fossilspur' },
    ],
    reward: 6600, badge: 'stonebadge',
  },
  brawly: {
    id: 'brawly', name: 'Brawly', title: 'Dewford Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['You crossed open water to stand on my mats — good. Out here we read a challenger the way we read a wave: not by how loud it arrives, but by whether it is still standing after the break. Show me your balance, trainer.'],
    lose: ['Clean through the break, and still standing... Beautifully surfed.', 'The Knuckle Badge is yours. The tide that carried you here will carry you further — Slateport next, if the sea road calls. Mind the contest crowds; they are louder than the surf.'],
    team: [
      { species: 'machop', level: 219 },
      { species: 'meditite', level: 222 },
      { species: 'makuhita', level: 225, keepsake: 'secondwindribbon' },
    ],
    reward: 7200, badge: 'knucklebadge',
  },
  wattson: {
    id: 'wattson', name: 'Wattson', title: 'Mauville Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['Wahahaha! A challenger with sparks in their step! I built this city\'s grid with these hands, youngster, and I built this gym to trip anyone who walks it carelessly. Mind the barriers — they bite in my favorite key!'],
    lose: ['Wahaha — BZZT! Beaten, and grinning about it! That has not happened in far too long.', 'The Dynamo Badge is yours! Take the north road when you are ready — but a word from an old electrician: something up by the volcano is drawing current it should not. Teams, arguing over a rock. Watch yourself up there.'],
    team: [
      { species: 'voltorb', level: 229 },
      { species: 'magneton', level: 231 },
      { species: 'electrike', level: 233 },
      { species: 'manectric', level: 235, keepsake: 'thunderheadpin' },
    ],
    reward: 7800, badge: 'dynamobadge',
  },
  flannery: {
    id: 'flannery', name: 'Flannery', title: 'Lavaridge Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['I — I am Flannery, and this gym was my grandfather\'s before it was mine, and I will thank you not to go easy on either of us. The springs outside are for resting. In here, we burn. Show me you can stand the heat, challenger!'],
    lose: ['Beaten — fairly, completely beaten, in my own fire... Grandfather would say that is the tuition. He would be right.', 'The Heat Badge is yours. It is warm. It is always warm — that is how you will know it is real. Whatever is smoking up on Chimney, trainer... after this battle, I believe you can face it.'],
    team: [
      { species: 'numel', level: 239 },
      { species: 'slugma', level: 241 },
      { species: 'camerupt', level: 243 },
      { species: 'torkoal', level: 245, keepsake: 'embereed' },
    ],
    reward: 8400, badge: 'heatbadge',
  },
  // Gym rosters (plain talk-to trainers, the Sprout monk idiom).
  rustboro_gym_1: {
    id: 'rustboro_gym_1', name: 'Youngster Bram', title: 'Rustboro Gym Trainer', ai: 'basic',
    intro: ['Roxanne makes us sign the quarry book and check our boots. Then she makes us battle every challenger twice as hard. Boots checked. Book signed. Your turn.'],
    lose: ['Checked, signed, and beaten. The book has a column for that too, probably.'],
    team: [
      { species: 'geodude', level: 205 },
      { species: 'aron', level: 207 },
    ],
    reward: 500,
  },
  rustboro_gym_2: {
    id: 'rustboro_gym_2', name: 'Hiker Sella', title: 'Rustboro Gym Trainer', ai: 'basic',
    intro: ['I haul stone for this gym on weekdays and defend it on all the others. The stone does not care which day it is. Neither do I.'],
    lose: ['Hauled down fair and square. Roxanne is at the back, challenger — mind the compass stone. It points at whoever is proudest. Today, that is you.'],
    team: [
      { species: 'geodude', level: 207 },
      { species: 'nosepass', level: 209 },
    ],
    reward: 550,
  },
  dewford_gym_1: {
    id: 'dewford_gym_1', name: 'Blackbelt Rook', title: 'Dewford Gym Trainer', ai: 'basic',
    intro: ['In the dark, footwork is everything. Brawly turns the lights down on purpose. He says the sea does not fight you in daylight either — it fights you in weather. Step up.'],
    lose: ['Your footwork found me in the dark. Brawly is through the gloom, trainer — follow the sound of the surf in the walls.'],
    team: [
      { species: 'machop', level: 216 },
      { species: 'meditite', level: 218 },
    ],
    reward: 600,
  },
  dewford_gym_2: {
    id: 'dewford_gym_2', name: 'Battle Girl Sana', title: 'Dewford Gym Trainer', ai: 'basic',
    intro: ['Everyone asks why a fighting gym sits on a surf island. Because a wave is just a punch the ocean throws forever, that is why. Catch mine!'],
    lose: ['Caught, and returned with interest! Brawly felt that one through the mats, I promise you.'],
    team: [
      { species: 'makuhita', level: 220 },
      { species: 'machop', level: 221 },
    ],
    reward: 650,
  },
  mauville_gym_1: {
    id: 'mauville_gym_1', name: 'Camper Ilya', title: 'Mauville Gym Trainer', ai: 'basic',
    intro: ['Wattson wired these barriers himself and still apologizes to them when they trip. I do not apologize. I conduct. Ready?'],
    lose: ['Grounded. Completely grounded. Wattson is laughing somewhere behind that last barrier — I can hear the grid hum it.'],
    team: [
      { species: 'voltorb', level: 226 },
      { species: 'electrike', level: 228 },
    ],
    reward: 700,
  },
  mauville_gym_2: {
    id: 'mauville_gym_2', name: 'Engineer Pask', title: 'Mauville Gym Trainer', ai: 'basic',
    intro: ['I maintain this gym\'s grid. Every challenger is a load test. You look like a heavy one — good. The grid has been bored all week.'],
    lose: ['Load test: failed, gloriously. The old man at the back is your prize, trainer. Try not to trip his favorite barrier on the way.'],
    team: [
      { species: 'magnemite', level: 229 },
      { species: 'magneton', level: 231 },
    ],
    reward: 750,
  },
  lavaridge_gym_1: {
    id: 'lavaridge_gym_1', name: 'Kindler Fenn', title: 'Lavaridge Gym Trainer', ai: 'basic',
    intro: ['The floor grates breathe spring steam, and the footing here is a local tradition and a local test. Mind your step — then mind my Slugma.'],
    lose: ['Out-steamed and out-fought. Flannery is at the back, past the last grate. She has been pacing. Challengers make her nervous; nervous makes her dangerous.'],
    team: [
      { species: 'slugma', level: 236 },
      { species: 'numel', level: 238 },
    ],
    reward: 800,
  },
  lavaridge_gym_2: {
    id: 'lavaridge_gym_2', name: 'Hiker Brasa', title: 'Lavaridge Gym Trainer', ai: 'basic',
    intro: ['Her grandfather\'s portrait watches that door. Every challenger swears he nods at them. He has never nodded at me, and I work here. Battle me, and I will check if he nods at you.'],
    lose: ['...He nodded. At YOU. Unbelievable. Go on, then — Flannery is waiting, and the portrait has opinions now.'],
    team: [
      { species: 'numel', level: 239 },
      { species: 'vulpix', level: 241 },
    ],
    reward: 850,
  },
  // Magma / Aqua seed chain (H4a): first contact at Meteor Falls is a
  // grunt scuffle the story survives either way (battleAny); the
  // Chimney clash is the first real team battle — admins, also
  // battleAny: the clash breaks up whatever the outcome, and the
  // branch flags record what actually happened.
  magma_grunt_falls: {
    id: 'magma_grunt_falls', name: 'Magma Grunt', title: 'Team Magma', ai: 'basic',
    intro: ['This cave is a worksite! Red scarves only! The professor\'s rocks are coming with us — orders — and you are leaving the way you came in!'],
    lose: ['The rocks — the ADMIN will hear about this! The land will be expanded anyway, you hear me? ANYWAY!'],
    team: [
      { species: 'poochyena', level: 212 },
      { species: 'numel', level: 214 },
    ],
    reward: 700,
  },
  aqua_grunt_falls: {
    id: 'aqua_grunt_falls', name: 'Aqua Grunt', title: 'Team Aqua', ai: 'basic',
    intro: ['Blue scarves, this cave, NOW! Those land-grabbers in red are stealing star-stone to wake things best left asleep — and I am not letting a bystander complicate a rescue!'],
    lose: ['Fine — FINE. You fight like the tide: annoying, and everywhere. The stone is theirs anyway. It was ALWAYS going to be theirs. That is the problem!'],
    team: [
      { species: 'poochyena', level: 212 },
      { species: 'carvanha', level: 214 },
    ],
    reward: 700,
  },
  magma_admin_chimney: {
    id: 'magma_admin_chimney', name: 'Admin Brask', title: 'Team Magma Admin', ai: 'smart',
    intro: ['Brask, Team Magma. You stand on the throat of the world, trainer, holding a conversation that is over. The meteorite goes into the crater, the mountain remembers what land is FOR — step aside, or be stepped over.'],
    lose: ['...You delayed a mountain. Do you understand how absurd that is? A trainer, delaying a MOUNTAIN. Very well. The crater keeps. So do we.'],
    team: [
      { species: 'mightyena', level: 232 },
      { species: 'numel', level: 234 },
      { species: 'camerupt', level: 236 },
    ],
    reward: 2400,
  },
  aqua_admin_chimney: {
    id: 'aqua_admin_chimney', name: 'Admin Selka', title: 'Team Aqua Admin', ai: 'smart',
    intro: ['Selka, Team Aqua — and the only adult on this volcano, apparently. The red scarves mean to feed star-stone to a crater, trainer. Whatever you think of my crew, help me stop THAT first. Questions drown later.'],
    lose: ['Beaten by the bystander. The sea provides ironies the way it provides everything: constantly, and without asking. The crater is quiet — that is what matters. For today.'],
    team: [
      { species: 'mightyena', level: 232 },
      { species: 'carvanha', level: 234 },
      { species: 'sharpedo', level: 236 },
    ],
    reward: 2400,
  },
  // --- H4b trainers append here ---
};

// ---------------------------------------------------------------------------
// HOENN_EVENTS — merged into EVENTS by merge.mjs. Map-entry scenes
// (sysLoadMap fires them once, flag-gated). Leader / May / Wally /
// Birch scenes live in overworld-systems (runHoennNpc) because they
// are menu- and state-driven, not step-driven.
// ---------------------------------------------------------------------------
export const HOENN_EVENTS = {
  // -- Littleroot: the rescue (first littleroot entry) ----------------
  // The Advanced opening, adapted to a carried-team reality: the wild
  // Poochyena is a band-floor face the player's veteran team drives
  // off — the beat is Birch's peril and gratitude, not a starter pick.
  // A flee stalls the chain (nothing set), so it re-fires on entry.
  ev_hoenn_rescue: [
    { say: ['Shouting — close, and getting closer. Around the bend of the Littleroot road a man in a lab coat is backed against the fence line, briefcase held up like a very small shield, while a wild Poochyena worries at the hem of his coat with the total confidence of the young and territorial.'], who: 'NARRATOR' },
    { say: ['You — trainer! Yes, you, with the team that walks like it has somewhere to be! A hand, if you would! This youngster objects to my fieldwork, my footwear, and my entire profession, in that order!'], who: 'PROF. BIRCH' },
    { wildBattle: { species: 'poochyena', level: 203, uncatchable: true } },
    { say: ['Gone — over the fence and into the long grass, dignity intact on exactly one side of this encounter. ...Thank you. Sincerely. Professor Birch, of the Littleroot lab — you have caught me at my most empirical.', 'Come to the lab, trainer. Proper thanks, a proper registration, and a chair that no Poochyena has opinions about. North side of town. I will put the kettle on and pretend this never happens weekly.'], who: 'PROF. BIRCH' },
    { flag: 'birch_rescued' },
    { toast: 'You drove off the Poochyena!' },
  ],

  // -- Birch's lab: the arrival (first birch-lab entry) --------------
  ev_hoenn_arrival: [
    { say: ['Birch\'s lab smells of kettle steam, field mud, and paper — a working lab, not a showroom. Assistants weave between specimen shelves with the ease of people who have dodged the same Poochyena-shaped hazards for years.'], who: 'NARRATOR' },
    { say: ['There. Registered, stamped, and entirely official: your Hoenn journey begins in this lab, with a rescued professor as its first entry. Professor Hawthorn wrote ahead, you know. The letter just said: "He walks far and arrives kind. Register whatever he asks."', 'You will want the gym road: Petalburg first — mind young Wally there, he is frailer than he looks and braver than he knows — then Rustboro, and Roxanne. And a warning from my own fieldwork: Hoenn is arguing with itself this year. Land people, sea people, and weather that cannot pick a side. Walk carefully, and walk anyway.'], who: 'PROF. BIRCH' },
    { say: ['Oh — and my neighbor\'s girl, May, is somewhere about town. A beginning coordinator, all nerves and ribbon dreams. If a contest hall ever crosses your road, trainer, that is her world the way gyms are yours. You might learn something in the seats. She would die before saying so, but she hopes you come.'], who: 'PROF. BIRCH' },
    { flag: 'hoenn_arrival' },
    { flag: 'birch_registered' },
    { toast: 'Your Hoenn journey is registered!' },
  ],

  // -- Meteor Falls: first contact (entry, Stone Badge held) ---------
  // Both teams glimpsed; one grunt scuffle (battleAny: the story
  // survives either way, the branch flag records the outcome); the
  // meteorite changes hands in the confusion — the seed of Chimney.
  ev_hoenn_meteor: [
    { say: ['Meteor Falls runs cold and loud, and today it has an audience it did not invite. On the lower ledge: red scarves, hauling equipment. On the upper: blue, watching them do it. Between them, a grey-haired professor with a specimen case clutched to his chest like a hymn book in a storm.'], who: 'NARRATOR' },
    { say: ['Cozmo. Professor Cozmo — the meteorites of this cave are my life\'s work, and these — these COSTUMES are trying to make them a crowbar! Tell them, trainer! Tell them star-stone is for STUDYING!'], who: 'PROF. COZMO' },
    { battleAny: { trainer: 'magma_grunt_falls', winFlag: 'meteor_magma_won', loseFlag: 'meteor_magma_lost' } },
    { say: ['Whatever the scuffle decided, it decided too loudly. In the echo and the spray, a red-scarfed shape slips past the professor — and when the case is opened on the ledge to check the damage, one meteorite is simply not in it anymore.', 'Gone. Forty years of cataloguing, and the finest stone I ever held is a handle in someone else\'s plan. They spoke of a mountain, trainer. A crater. Chimney, unless my ears have gone the way of my specimen. Whatever they mean to feed that rock to — star-stone remembers the sky, and mountains remember being fire. I do not enjoy that arithmetic.'], who: 'PROF. COZMO' },
    { flag: 'meteor_falls_done' },
    { flag: 'teams_glimpsed' },
    { flag: 'cozmo_met' },
    { toast: 'A meteorite was taken from Meteor Falls.' },
  ],

  // -- Mt. Chimney: the clash (entry, Dynamo Badge held) -------------
  // The first REAL team battle: Brask at the crater machine. Selka's
  // crew breaks it up with you; the meteorite's use is teased, not
  // explained — the full answer is H4b's Weather Institute / Pyre.
  ev_hoenn_chimney: [
    { say: ['The Chimney summit is a argument with a view. A machine squats at the crater rim — red-scarfed engineers swarming it, a specimen case bolted into its heart — and across the ash, blue scarves are coming up the far slope like a tide that has learned to climb.'], who: 'NARRATOR' },
    { say: ['You are late, trainer, and the mountain is early. Stand with me or stand aside — the crater does not get fed today.'], who: 'ADMIN SELKA' },
    { battleAny: { trainer: 'magma_admin_chimney', winFlag: 'chimney_magma_won', loseFlag: 'chimney_magma_lost' } },
    { say: ['Win or lose, the moment breaks the way surf breaks: the machine shudders, the case is wrenched free by blue hands and gone down the far slope, and Brask\'s crew falls back into the ash haze swearing at the weather, the sea, and you — impartially, and at length.', 'They will try again somewhere the mountain cannot argue back. A weather station, a shrine, a cave under the sea — Hoenn is full of old machinery, trainer, and both our crews collect it. Watch the sky. When it starts choosing sides, you will know we failed to.'], who: 'ADMIN SELKA' },
    { flag: 'chimney_clash_done' },
    { flag: 'meteorite_teased' },
    { toast: 'The Chimney clash broke up — for now.' },
  ],
  // --- H4b events append here ---
};

// ---------------------------------------------------------------------------
// HOENN_TALES — Town Tales for the first-half settlements, folded into
// QUESTS by merge.mjs (the shipped tales table — one tale system, no
// parallel). Shape is the quests.mjs shape law (<=3 stages, reward up
// front, a lore revelation at the end); the Hoenn rows carry their
// dialogue lines as data (offerLines / stageLines / finishLines) and
// `hoennTale: true` keys the generic data-driven branch of runTaleNpc
// (the same branch the Johto tales ride).
// ---------------------------------------------------------------------------
export const HOENN_TALES = {
  tale_littleroot: {
    id: 'tale_littleroot', town: 'Littleroot Town', giver: 'ELDER BRAMBLE', title: 'The Town That Starts', hoennTale: true,
    stages: [
      'Ask Ms. Harlow in Littleroot what every journey here starts with',
      'Tell Elder Bramble what Ms. Harlow said',
    ],
    reward: { items: { superpotion: 2 } }, rewardText: '2 Super Potions',
    bondNpc: 'bramble', bondDelta: 1,
    revelation: 'Every trainer who ever left Littleroot was seen off from the same fence post — Bramble carved a notch for each one into its back, where only the town can see. Yours went in this morning.',
    offerLines: ['Seventy years I have watched trainers leave this town, and the town has a ritual for it that nobody wrote down. I am the ritual\'s memory, trainer, and my memory is going where memories go.', 'Ask Ms. Harlow what every journey here starts with. Bring me her answer exactly, and two Super Potions are yours — Littleroot pays its historians.'],
    stageLines: ['What does every journey here start with? He finally sent someone to ask. It starts with a packed bag checked twice, trainer, and a doorstep stood on longer than necessary.', 'And a wave from the fence post that is not for the road at all — it is for the town, so the town knows to keep the home fires lit for a return it cannot schedule. Tell Bramble: twice-checked, long doorstep, fence-post wave. All three.'],
    finishLines: ['Twice-checked, long doorstep, fence-post wave. She kept all three pieces. Of course she did — she has performed the ritual four hundred times and never once called it one.', 'I carve a notch in that post for every departure, on the side only the town can see. Yours went in this morning, trainer, while you were busy being rescued by a professor. Two Super Potions. Come home someday and count the notches. Yours will be the one that came back.'],
  },
  tale_petalburg: {
    id: 'tale_petalburg', town: 'Petalburg City', giver: 'BALANCE KEEPER ORIN', title: 'What Balance Weighs', hoennTale: true,
    stages: [
      'Ask Fisher Lio in Petalburg what the pond taught him about balance',
      'Tell Keeper Orin what Lio said',
    ],
    reward: { items: { greatball: 2 } }, rewardText: '2 Great Balls',
    bondNpc: 'orin', bondDelta: 1,
    revelation: 'The gym\'s balance rooms were built by Orin\'s grandfather, a pond fisherman who believed a trainer\'s stance should be judged the way a heron judges water — by what does not ripple.',
    offerLines: ['I keep the balance rooms of Norman\'s gym, trainer — sweeping, chalking, judging stances. Thirty years of it, and I still cannot say what balance weighs. The man who taught me could. He fishes the pond now and answers nothing quickly.', 'Ask Fisher Lio what the pond taught him. Bring me the whole answer. Two Great Balls — knowledge should travel with tackle.'],
    stageLines: ['What the pond taught me? Orin sent you. Sit on the bank a moment — no. Stand. The lesson stands.', 'A heron does not balance, boy. A heron commits. Every ripple it refuses to make is a fish deciding it is safe. Balance is not stillness — it is the weight of everything you chose not to disturb. Tell the keeper the pond said so.'],
    finishLines: ['The weight of everything you chose not to disturb... Forty years, and the old fox still teaches in riddles that turn out to be instructions.', 'His grandfather built those rooms, you know. A fisherman, building a gym — and every tamer since has stood in them learning to be a heron. Two Great Balls, trainer. Disturb little.'],
  },
  tale_rustboro: {
    id: 'tale_rustboro', town: 'Rustboro City', giver: 'DEVON RESEARCHER PELL', title: 'The Stone That Travels', hoennTale: true,
    stages: [
      'Ask Trainer School Kid Moss in Rustboro about the travelling stone',
      'Tell Researcher Pell what Moss said',
    ],
    reward: { items: { superpotion: 2 } }, rewardText: '2 Super Potions',
    bondNpc: 'pell', bondDelta: 1,
    revelation: 'The school\'s travelling stone has been carried out of Rustboro and brought home by forty years of departing students — it has seen more of Hoenn than most researchers, and the school registers its journeys like a student.',
    offerLines: ['Devon keeps records of everything in this city except the one thing that matters to its children. There is a stone at the Trainer School, trainer — a plain river stone — that has travelled further than I have. The school will not explain it to a researcher. They might explain it to you.', 'Ask young Moss about the travelling stone. The full custom, exactly. Two Super Potions for the fieldwork — Devon pays for data, even the embarrassing kind.'],
    stageLines: ['The stone? You are not a teacher. ...You do not LOOK like a teacher. Fine. The stone goes with whoever leaves.', 'Every student who leaves Rustboro for a journey takes it in their pack, and someone brings it home — a sibling, a friend, a Pidgey in one famous case. It has been to every gym in Hoenn. It is enrolled here, technically. Its attendance is better than mine. Tell the researcher: it travels because leaving is a subject too, and the stone is the only one of us who has passed it forty times.'],
    finishLines: ['Enrolled. Attendance better than the students. Forty journeys in a school register I was never shown...', 'Devon studies how Pokemon change the world, trainer. That stone is how the world changes BACK — one pack, one road, one homecoming at a time. Two Super Potions. And if you pass the school on your way out... you did not hear this from me, but check your pack. Just in case.'],
  },
  tale_slateport: {
    id: 'tale_slateport', town: 'Slateport City', giver: 'MARKET CRIER VESK', title: 'The Price of the Tide', hoennTale: true,
    stages: [
      'Ask Beachcomber Ana in Slateport how the market prices the tide',
      'Tell Crier Vesk what Ana said',
    ],
    reward: { items: { greatball: 3 } }, rewardText: '3 Great Balls',
    bondNpc: 'vesk', bondDelta: 1,
    revelation: 'Slateport\'s market has priced by the tide for a hundred years because Ana\'s great-grandmother, its first crier, refused to sell a sailor anything at low water that he would regret at high — the tide table is a kindness, kept as a price list.',
    offerLines: ['FISH! CLOTH! BERRIES AT TIDE PRICE! — forgive me, trainer, the voice does it on its own now. You have heard the market cry tide prices all morning and wondered. Everyone wonders. Nobody asks the shore.', 'Beachcomber Ana knows why we price by the tide. Ask her, bring me the reason whole, and three Great Balls change hands — a crier pays for his material.'],
    stageLines: ['Why tide prices? My great-grandmother started this market with one stall and one rule, and the rule outlived the stall by a century.', 'She would not sell a sailor anything at low water that he would regret at high. So the prices breathe with the tide: cheap when the boats are leaving and a man buys brave, dear when they return and he buys honest. It is not commerce, trainer. It is a kindness with numbers on it. Tell Vesk the shore said so.'],
    finishLines: ['A kindness with numbers on it. A hundred years my family has cried those prices, and the reason was a grandmother refusing to let a sailor shop foolish...', 'That is going in tomorrow\'s cry, trainer — word for word, at full volume, at high tide when honesty is expensive. Three Great Balls. Spend them brave or spend them honest, as the water decides.'],
  },
  // --- H4b tales append here ---
};

// ---------------------------------------------------------------------------
// HOENN_NPCS / HOENN_NPC_PATCHES — the loadMap-append idiom (quests.mjs
// CAPT JOHTO precedent): appended actors carry `hoenn` (runHoennNpc
// owns them) or `trainer` (the generic trainer path) or `tale`+`role`
// (the tales above); patches stamp tale roles onto existing maps7
// townsfolk by name. The generated maps7 data is never edited.
// Gym leaders stand at (7,2), the Johto leader idiom; gym trainers
// fill the shipped empty gym floors (H3 register: layouts waiting
// for leaders/rosters).
// ---------------------------------------------------------------------------
export const HOENN_NPCS = [
  { map: 'birch-lab', x: 7, y: 3, name: 'PROF. BIRCH', art: 'scientist', skin: '#f0c8a0', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#3a2a1a', hoenn: 'birch',
    dialogue: ['The field is my library, trainer. It keeps trying to eat me, but it IS my library.'] },
  { map: 'littleroot', x: 15, y: 8, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_littleroot',
    dialogue: ['Contests are not the soft option, you know. They are battles where the crowd grades your footwork.'] },
  { map: 'petalburg', x: 13, y: 7, name: 'WALLY', art: 'kid', skin: '#f0d8b8', shirt: '#7a9a4a', pants: '#3a3a4a', hair: '#4a7a4a', hoenn: 'wally',
    dialogue: ['I caught one. Me. A Ralts, by the pond grass — well. We caught each other, I think.'] },
  { map: 'gym-petalburg', x: 7, y: 2, name: 'NORMAN', art: 'gym5', skin: '#e8b888', shirt: '#4a4a5a', pants: '#2a2a3a', hair: '#2a2a3a', hoenn: 'norman',
    dialogue: ['Balance is not standing still, challenger. Come back when the road has taught you that, and I will test it personally.'] },
  { map: 'gym-rustboro', x: 7, y: 2, name: 'ROXANNE', art: 'gym1', skin: '#f0c8a0', shirt: '#7a3a3a', pants: '#3a3a4a', hair: '#5a2a3a', hoenn: 'roxanne',
    dialogue: ['Every stone in this gym was placed to teach. Mind the compass stone.'] },
  { map: 'gym-rustboro', x: 4, y: 5, name: 'YOUNGSTER BRAM', art: 'youngster', skin: '#f0c8a0', shirt: '#3a7a4a', pants: '#2a2a3a', hair: '#7a4a1a', trainer: 'rustboro_gym_1',
    dialogue: ['Boots checked. Book signed.'] },
  { map: 'gym-rustboro', x: 11, y: 5, name: 'HIKER SELLA', art: 'hiker', skin: '#d8a878', shirt: '#8a6a3a', pants: '#3a3a2a', hair: '#2a1a0a', trainer: 'rustboro_gym_2',
    dialogue: ['The stone does not care which day it is.'] },
  { map: 'gym-dewford', x: 7, y: 2, name: 'BRAWLY', art: 'gym2', skin: '#d8a878', shirt: '#2a6a8a', pants: '#2a2a3a', hair: '#1a2a4a', hoenn: 'brawly',
    dialogue: ['Read the wave, trainer. Then stand in it.'] },
  { map: 'gym-dewford', x: 4, y: 5, name: 'BLACKBELT ROOK', art: 'blackbelt', skin: '#c89878', shirt: '#e8e0c8', pants: '#3a3a3a', hair: '#1a1a1a', trainer: 'dewford_gym_1',
    dialogue: ['In the dark, footwork is everything.'] },
  { map: 'gym-dewford', x: 11, y: 5, name: 'BATTLE GIRL SANA', art: 'lass', skin: '#f0c8a0', shirt: '#c05a7a', pants: '#2a2a3a', hair: '#2a1a3a', trainer: 'dewford_gym_2',
    dialogue: ['A wave is a punch the ocean throws forever.'] },
  { map: 'gym-mauville', x: 7, y: 2, name: 'WATTSON', art: 'elder', skin: '#e8b888', shirt: '#e8c832', pants: '#3a4a5a', hair: '#e8e8e8', hoenn: 'wattson',
    dialogue: ['Wahahaha! Mind the barriers, youngster!'] },
  { map: 'gym-mauville', x: 4, y: 5, name: 'CAMPER ILYA', art: 'camper', skin: '#f0c8a0', shirt: '#4a7a3a', pants: '#3a3a2a', hair: '#7a1a1a', trainer: 'mauville_gym_1',
    dialogue: ['I do not apologize. I conduct.'] },
  { map: 'gym-mauville', x: 11, y: 5, name: 'ENGINEER PASK', art: 'scientist', skin: '#d8a878', shirt: '#5a6a7a', pants: '#2a2a3a', hair: '#4a4a5a', trainer: 'mauville_gym_2',
    dialogue: ['Every challenger is a load test.'] },
  { map: 'gym-lavaridge', x: 7, y: 2, name: 'FLANNERY', art: 'gym4', skin: '#f0c8a0', shirt: '#c83a2a', pants: '#2a2a3a', hair: '#c83a1a', hoenn: 'flannery',
    dialogue: ['In here, we burn. That is the whole policy.'] },
  { map: 'gym-lavaridge', x: 4, y: 5, name: 'KINDLER FENN', art: 'camper', skin: '#e8b888', shirt: '#a03a2a', pants: '#3a3a2a', hair: '#3a2a1a', trainer: 'lavaridge_gym_1',
    dialogue: ['Mind your step — then mind my Slugma.'] },
  { map: 'gym-lavaridge', x: 11, y: 5, name: 'HIKER BRASA', art: 'hiker', skin: '#c89878', shirt: '#6a5a3a', pants: '#3a3a2a', hair: '#1a1a0a', trainer: 'lavaridge_gym_2',
    dialogue: ['The portrait watches that door. It has never nodded at me.'] },
  { map: 'contest-slateport', x: 8, y: 6, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_contest_slateport',
    dialogue: ['First big hall. First big crowd. Watch me anyway.'] },
  { map: 'contest-verdanturf', x: 8, y: 6, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_contest_verdanturf',
    dialogue: ['New appeal. Practiced all week. Do not tell me to relax.'] },
  { map: 'contest-fallarbor', x: 8, y: 6, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_contest_fallarbor',
    dialogue: ['I picked the hardest crowd in Hoenn on purpose.'] },
  { map: 'meteor-falls', x: 12, y: 8, name: 'PROF. COZMO', art: 'scientist', skin: '#e8b888', shirt: '#f0f0f0', pants: '#4a4a5a', hair: '#c0c0c0', hoenn: 'cozmo',
    dialogue: ['Star-stone is for STUDYING. I shall be saying it in my sleep.'] },
  { map: 'mt-chimney', x: 12, y: 6, name: 'ADMIN BRASK', art: 'rocket', skin: '#d8a878', shirt: '#a02a2a', pants: '#2a2a3a', hair: '#2a1a0a', hoenn: 'magma_admin_npc',
    dialogue: ['The crater keeps, trainer. So do we.'] },
  { map: 'mt-chimney', x: 14, y: 8, name: 'ADMIN SELKA', art: 'rocket', skin: '#f0c8a0', shirt: '#2a4a8a', pants: '#2a2a3a', hair: '#1a3a5a', hoenn: 'aqua_admin_npc',
    dialogue: ['Watch the sky, trainer. When it chooses sides, we failed to stop it.'] },
  { map: 'fortree', x: 12, y: 10, name: 'WEATHER WATCHER ILSE', art: 'picnicker', skin: '#e8b888', shirt: '#3a7a6a', pants: '#3a3a2a', hair: '#5a3a2a', hoenn: 'weather_watcher',
    dialogue: ['The Institute up the route reads this valley\'s rain like scripture. Lately the scripture argues back.'] },
  // --- H4b actors append here ---
];

export const HOENN_NPC_PATCHES = [
  { map: 'littleroot', name: 'ELDER BRAMBLE', tale: 'tale_littleroot', role: 'giver' },
  { map: 'littleroot', name: 'MS. HARLOW', tale: 'tale_littleroot', role: 'stage' },
  { map: 'petalburg', name: 'BALANCE KEEPER ORIN', tale: 'tale_petalburg', role: 'giver' },
  { map: 'petalburg', name: 'FISHER LIO', tale: 'tale_petalburg', role: 'stage' },
  { map: 'rustboro', name: 'DEVON RESEARCHER PELL', tale: 'tale_rustboro', role: 'giver' },
  { map: 'rustboro', name: 'TRAINER SCHOOL KID MOSS', tale: 'tale_rustboro', role: 'stage' },
  { map: 'slateport', name: 'MARKET CRIER VESK', tale: 'tale_slateport', role: 'giver' },
  { map: 'slateport', name: 'BEACHCOMBER ANA', tale: 'tale_slateport', role: 'stage' },
  // --- H4b patches append here ---
];
