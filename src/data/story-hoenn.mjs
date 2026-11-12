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
  // --- H4b: the east rows ---
  { id: 'q_hoenn_balance', flag: 'badge_balance', text: 'Win the Balance Badge from Norman in Petalburg City', hint: 'The deferred meeting, at full circle: Norman has waited behind four badges of road. His Normal types fear Fighting moves — and respect balance.' },
  { id: 'q_hoenn_institute', flag: 'institute_done', text: 'Clear the team takeover at the Weather Institute on Route 119', hint: 'Red scarves asked about drought records; blue ones about rain. Now the Institute has gone quiet on the radio. Go and make it loud again.' },
  { id: 'q_hoenn_feather', flag: 'badge_feather', text: 'Win the Feather Badge from Winona in Fortree City', hint: 'Winona fights from the canopy, where the rain road ends. Her Flying types fear Electric, Ice and Rock moves.' },
  { id: 'q_hoenn_lilycove_may', flag: 'may_lilycove_done', text: 'Watch May compete at the Lilycove Contest Hall', hint: 'The last hall on May\'s road, in the harbour city. Three ribbons ride on this one — hers, and the road\'s opinion of her.' },
  { id: 'q_hoenn_mind', flag: 'badge_mind', text: 'Win the Mind Badge from Tate and Liza in Mossdeep City', hint: 'Twins, one gym, two battles back to back — the pair fight as one mind in two bodies. Their Psychic types fear Bug, Ghost and Dark moves.' },
  { id: 'q_hoenn_pyre', flag: 'orbs_taken', text: 'Mt. Pyre — stop the teams taking the orbs', hint: 'The shrine mountain east of Lilycove keeps two old orbs asleep in stone. Both teams have stopped pretending they do not want them.' },
  { id: 'q_hoenn_magma_hideout', flag: 'magma_hideout_done', text: 'Raid the Magma Hideout in Mt. Chimney\'s caldera', hint: 'A door in the caldera wall, cut while the clash covered the digging. Maxie is done hiding what the orbs are for.' },
  { id: 'q_hoenn_aqua_hideout', flag: 'submarine_stolen', text: 'Stop Team Aqua stealing the submarine at Lilycove harbour', hint: 'A research submarine, a harbour at low tide, and blue scarves with a schedule. Whatever is under the sea, Archie means to reach it first.' },
  { id: 'q_hoenn_seafloor', flag: 'seafloor_done', text: 'Dive to the Seafloor Cavern off Route 128', hint: 'Mind Badge, a partner who knows Dive, and a trench that has waited since before there were teams. Steven in Mossdeep can teach the way down.' },
  { id: 'q_hoenn_climax', flag: 'climax_resolved', text: 'End the clash of the weather titans', hint: 'When the sky chooses sides, the answer is older than either side: a green pillar east of Pacifidlog, and something asleep at its top.' },
  { id: 'q_hoenn_rain', flag: 'badge_rain', text: 'Win the Rain Badge from Juan in Sootopolis City', hint: 'Sootopolis is reached only from below — surface inside its crater lake. Juan, the last gym, keeps Water types and a conductor\'s patience.' },
  { id: 'q_hoenn_wally_final', flag: 'wally_final_done', text: 'Face Wally in Victory Road', hint: 'The boy from Petalburg, grown into the road. He asked to be remembered kindly. He did not ask to be gone easy on.' },
  { id: 'q_hoenn_conference', flag: 'hoenn_conference_registered', text: 'Register for the Ever Grande Conference', hint: 'Eight Hoenn badges open the league hall at Ever Grande. The registrar keeps the bracket; Tyson waits at the end of it.' },
  { id: 'q_hoenn_tyson', flag: 'hoenn_complete', text: 'The Ever Grande Conference — the final, against Tyson', hint: 'Face him with everything the region taught you. However the card falls, Hoenn ends on the far side of this battle.' },
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
  // --- H4b: gyms 5-8 (ruling 6 curve: Norman ace 255, Winona 265,
  // Tate & Liza 275, Juan 285 — aces at the range tops) ---
  norman: {
    id: 'norman', name: 'Norman', title: 'Petalburg Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['Four badges, and the road kept its word — so will I. I am Norman, and this gym tests the one thing every strong trainer eventually runs out of: balance. No tricks in my team, challenger. Only weight, placed honestly. Show me yours does not tip.'],
    lose: ['Tipped — cleanly, and by the trainer I deferred in this very room. There is a symmetry in that I will be telling people about.', 'The Balance Badge is yours. Five down. The road east gets wetter and stranger from here — Fortree, then the sea itself. Walk it the way you walked to me: honestly.'],
    team: [
      { species: 'vigoroth', level: 249 },
      { species: 'linoone', level: 251 },
      { species: 'spinda', level: 252 },
      { species: 'slaking', level: 255, keepsake: 'tortoisecharm' },
    ],
    reward: 9000, badge: 'balancebadge',
  },
  winona: {
    id: 'winona', name: 'Winona', title: 'Fortree Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['I am Winona, and I keep the sky over Fortree. Down on the ground a battle is arithmetic. Up here it is weather — it arrives from the direction you were not watching. Mind the canopy, challenger, and mind the wind.'],
    lose: ['Read the wind, and flown through it... The canopy itself applauds, and so do I.', 'The Feather Badge is yours. East now: Lilycove, the shrine mountain, and a sea that keeps secrets at depth. The sky will be watching. So will I.'],
    team: [
      { species: 'swellow', level: 259 },
      { species: 'pelipper', level: 261 },
      { species: 'skarmory', level: 263 },
      { species: 'altaria', level: 265, keepsake: 'sparrowfeather' },
    ],
    reward: 9600, badge: 'featherbadge',
  },
  // TATE & LIZA — the double-battle adaptation, recorded honestly:
  // this engine has NO 2v2 battle (battle scenes are 1v1 end to end),
  // so the twins ship as a back-to-back PAIR in one gym visit: Tate
  // opens, Liza closes and carries the badge. Nothing here pretends
  // two foes stood on the field at once.
  tate: {
    id: 'tate', name: 'Tate', title: 'Mossdeep Gym Leader', ai: 'smart',
    intro: ['I am Tate — the left half of this gym. My sister and I share one strategy the way we share everything: completely, and without asking. Beat me, and you have only beaten the half that was talking.'],
    lose: ['Beaten — and Liza felt it from across the room, which is rather the point of us. Sister! The challenger is warmed up. Finish the lesson we started.'],
    team: [
      { species: 'xatu', level: 270 },
      { species: 'solrock', level: 274 },
    ],
    reward: 5000,
  },
  liza: {
    id: 'liza', name: 'Liza', title: 'Mossdeep Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['Liza — the half that was listening. Tate showed me your whole team, challenger; that is what a first half is FOR. Two minds, one gym. Come and meet the second one.'],
    lose: ['Two minds, one gym — and one better trainer standing in it. Tate is laughing. So am I. That is also rather the point of us.', 'The Mind Badge is yours — from both of us, which in Mossdeep is the only way anything is given. Steven Stone keeps a house by the shore here. What he teaches opens the deep road. You have earned the lesson.'],
    team: [
      { species: 'claydol', level: 272 },
      { species: 'lunatone', level: 275, keepsake: 'ironacorn' },
    ],
    reward: 10200, badge: 'mindbadge',
  },
  juan: {
    id: 'juan', name: 'Juan', title: 'Sootopolis Gym Leader', ai: 'smart', badgeSet: 'hoenn',
    intro: ['Juan, of Sootopolis — a city you reached from beneath the sea, in the middle of the end of the weather. My gym is the last quiet water in Hoenn, challenger. I intend to conduct this battle the way I conduct everything: precisely, and to a finish.'],
    lose: ['Precisely conducted — by you. Magnificent. The last badge in Hoenn could not have asked for a better keeper to lose it to.', 'The Rain Badge is yours. Eight badges, trainer. Ever Grande is east, the Conference is lit, and a boy named Wally is somewhere on that road with something to prove to both of you. Go and be history.'],
    team: [
      { species: 'luvdisc', level: 279 },
      { species: 'whiscash', level: 281 },
      { species: 'crawdaunt', level: 283 },
      { species: 'kingdra', level: 285, keepsake: 'tidepearl' },
    ],
    reward: 10800, badge: 'rainbadge',
  },
  petalburg_gym_1: {
    id: 'petalburg_gym_1', name: 'Ace Trainer Dario', title: 'Petalburg Gym Trainer', ai: 'basic',
    intro: ['Norman\'s rooms test your stance before they test your team. I am the first room. Stand honestly, trainer.'],
    lose: ['Honest stance, honest win. The keeper by the pond will approve — Norman is at the back.'],
    team: [{ species: 'linoone', level: 246 }, { species: 'vigoroth', level: 248 }],
    reward: 900,
  },
  petalburg_gym_2: {
    id: 'petalburg_gym_2', name: 'Cool Trainer Marn', title: 'Petalburg Gym Trainer', ai: 'basic',
    intro: ['Everyone underestimates a gym with no type tricks. Then the weight arrives, all at once, honestly. Like this.'],
    lose: ['Weight received — and returned. Norman deferred a meeting with you once, trainer. He is done deferring.'],
    team: [{ species: 'spinda', level: 247 }, { species: 'zangoose', level: 249 }],
    reward: 950,
  },
  fortree_gym_1: {
    id: 'fortree_gym_1', name: 'Bird Keeper Ansel', title: 'Fortree Gym Trainer', ai: 'basic',
    intro: ['The canopy gym turns on rotating gates and bad sightlines. Winona\'s rule: if you cannot see the wind, battle like it sees you.'],
    lose: ['It saw you fine. Winona is up the last turn, trainer — mind the wind.'],
    team: [{ species: 'swellow', level: 256 }, { species: 'pelipper', level: 258 }],
    reward: 1000,
  },
  fortree_gym_2: {
    id: 'fortree_gym_2', name: 'Picnicker Wren', title: 'Fortree Gym Trainer', ai: 'basic',
    intro: ['I picnic at altitude and battle at altitude. The drop is not part of the test. Probably. Battle!'],
    lose: ['Grounded, fairly. The Feather Badge is one leader past me, trainer.'],
    team: [{ species: 'tropius', level: 257 }, { species: 'altaria', level: 260 }],
    reward: 1050,
  },
  mossdeep_gym_1: {
    id: 'mossdeep_gym_1', name: 'Psychic Hollis', title: 'Mossdeep Gym Trainer', ai: 'basic',
    intro: ['The twins know what I am about to do before I do it. It makes sparring efficient and losing educational. Your turn to be educated.'],
    lose: ['Educated, apparently, was me. The pair are at the back — both of them. That is not a warning. It is the whole gym.'],
    team: [{ species: 'kirlia', level: 266 }, { species: 'xatu', level: 268 }],
    reward: 1100,
  },
  mossdeep_gym_2: {
    id: 'mossdeep_gym_2', name: 'Hex Maniac Ione', title: 'Mossdeep Gym Trainer', ai: 'basic',
    intro: ['Two leaders, one mind, zero mercy for a challenger who plans only one battle ahead. Plan for two, trainer. Starting with mine.'],
    lose: ['Planned, and executed. Tate first, then Liza — and may your second plan be as good as your first.'],
    team: [{ species: 'claydol', level: 267 }, { species: 'solrock', level: 270 }],
    reward: 1150,
  },
  sootopolis_gym_1: {
    id: 'sootopolis_gym_1', name: 'Swimmer Cato', title: 'Sootopolis Gym Trainer', ai: 'basic',
    intro: ['You surfaced in our lake to reach this gym. Juan respects that enormously. He still made me battle you first. Tradition.'],
    lose: ['Tradition satisfied. Juan conducts at the back, trainer — precisely, and to a finish.'],
    team: [{ species: 'whiscash', level: 276 }, { species: 'seaking', level: 278 }],
    reward: 1200,
  },
  sootopolis_gym_2: {
    id: 'sootopolis_gym_2', name: 'Beauty Ondine', title: 'Sootopolis Gym Trainer', ai: 'basic',
    intro: ['The last gym in Hoenn keeps its water like a held note. I am the note before the conductor. Sing, trainer.'],
    lose: ['Sung, and answered. The Rain Badge is one conductor past me.'],
    team: [{ species: 'milotic', level: 277 }, { species: 'kingdra', level: 280 }],
    reward: 1250,
  },
  // --- H4b: the villain chains converge (admins + leaders in band) ---
  aqua_admin_institute: {
    id: 'aqua_admin_institute', name: 'Admin Shelly', title: 'Team Aqua Admin', ai: 'smart',
    intro: ['Shelly, Team Aqua — and this Institute is under new management until its rain records say what we need them to say. The sea is coming back to this region, trainer. We are just reading its mail first.'],
    lose: ['Read, and answered... The records are yours, then. For all the good dry paper will do anyone when the real rain comes.'],
    team: [
      { species: 'mightyena', level: 252 },
      { species: 'carvanha', level: 254 },
      { species: 'sharpedo', level: 256 },
    ],
    reward: 2600,
  },
  magma_admin_pyre: {
    id: 'magma_admin_pyre', name: 'Admin Courtney', title: 'Team Magma Admin', ai: 'smart',
    intro: ['Courtney, Team Magma. Analysis complete: you are... an obstacle. The orbs on this mountain are not decorations, trainer. They are leashes. And leashes are for holding — or for letting go, at the chosen moment.'],
    lose: ['Analysis... revised. You are a larger obstacle than modelled. The orbs are taken anyway — both crews, both leashes, gone in the smoke. Tell the keepers Courtney sends her regrets. And her regards.'],
    team: [
      { species: 'numel', level: 266 },
      { species: 'camerupt', level: 268 },
    ],
    reward: 2800,
  },
  magma_admin_hideout: {
    id: 'magma_admin_hideout', name: 'Admin Tabitha', title: 'Team Magma Admin', ai: 'smart',
    intro: ['Tabitha, Team Magma — and you have walked into the mountain\'s own furnace room, trainer. The leader is below with the orb and the old fire. You get me first. Everyone gets me first. It is my whole personality, and I have made peace with it.'],
    lose: ['Through — THROUGH, and the furnace room is yours. Maxie! MAXIE, the bystander is done being a bystander!'],
    team: [
      { species: 'mightyena', level: 272 },
      { species: 'camerupt', level: 275 },
    ],
    reward: 3000,
  },
  maxie: {
    id: 'maxie', name: 'Maxie', title: 'Team Magma Leader', ai: 'smart',
    intro: ['Maxie. You have delayed my teams at a falls, a crater, and a shrine, trainer — a pattern any scientist would call data. The land was here before the sea covered it, and it will be here when my work is done. The orb answers the old fire. I merely... hold the leash, until the moment comes to let go.'],
    lose: ['Beaten — in my own furnace, at the threshold of the work itself. Very well, data is data: the moment is not here. It is BELOW. Everything I need sleeps under the sea your friends worship. Take this hideout, trainer. Take it. The deep does not have doors.'],
    team: [
      { species: 'mightyena', level: 276 },
      { species: 'crobat', level: 277 },
      { species: 'camerupt', level: 278 },
    ],
    reward: 6000,
  },
  aqua_admin_hideout: {
    id: 'aqua_admin_hideout', name: 'Admin Matt', title: 'Team Aqua Admin', ai: 'smart',
    intro: ['Matt, Team Aqua, bro — and this harbour, this boat, this whole beautiful schedule is OURS now. The boss has waited his whole life to go down where the sea keeps its first heartbeat. You are not postponing that, trainer. Nobody is.'],
    lose: ['Postponed — me, anyway. Boss! BOSS, the schedule has a trainer-shaped problem!'],
    team: [
      { species: 'mightyena', level: 272 },
      { species: 'sharpedo', level: 275 },
    ],
    reward: 3000,
  },
  archie: {
    id: 'archie', name: 'Archie', title: 'Team Aqua Leader', ai: 'smart',
    intro: ['Archie, of Team Aqua. I have dreamed of the deep since I was a boy the sea kept almost taking. Everything above the water is borrowed, trainer — I am simply returning the region to its owner. The submarine goes down with or without your blessing. Choose how this looks.'],
    lose: ['Chosen — and chosen well, you magnificent storm warning. But hear the harbour, trainer: the engines are already turning. The submarine is GONE, and so am I. The deep is calling, and for once in my life, I am answering on time.'],
    team: [
      { species: 'mightyena', level: 276 },
      { species: 'crobat', level: 277 },
      { species: 'sharpedo', level: 278 },
    ],
    reward: 6000,
  },
  // --- H4b: Wally, grown (Victory Road, in-band 286-292) ---
  wally_final: {
    id: 'wally_final', name: 'Wally', title: 'Trainer', ai: 'smart',
    intro: ['You remembered my name kindly, {player}. I have thought about how this sentence ends for a whole region: not with thanks. With a battle. Ralts is a Gardevoir now, and my hands do not shake at the wrong moments anymore. They shake at the right ones. Face me — the way I always meant to face you.'],
    lose: ['There it is. There is the whole road, in one battle: the pond grass, the borrowed Zigzagoon, and THIS. I am not the boy who needed help standing anymore — and you are still the trainer who helped him stand. Both of those are true. The league doors are yours. Mine will keep. I will be right behind you, forever, one road back and closing.'],
    team: [
      { species: 'altaria', level: 286 },
      { species: 'delcatty', level: 288 },
      { species: 'roselia', level: 289 },
      { species: 'magneton', level: 290 },
      { species: 'gardevoir', level: 292, keepsake: 'gardeniasash' },
    ],
    reward: 7000,
  },
  // --- H4b: the Ever Grande Conference bracket ---
  conference_h_p1: {
    id: 'conference_h_p1', name: 'Soren', title: 'Conference Trainer', ai: 'smart',
    intro: ['Preliminary one, and the draw gives me the trainer the whole harbour is talking about. Good. I did not cross the sea roads to be anyone\'s footnote.'],
    lose: ['Footnote it is — but a loud one. Climb, trainer. The bracket gets heavier from here.'],
    team: [
      { species: 'manectric', level: 288 },
      { species: 'flygon', level: 290 },
      { species: 'walrein', level: 291 },
    ],
    reward: 3400,
  },
  conference_h_p2: {
    id: 'conference_h_p2', name: 'Priya', title: 'Conference Trainer', ai: 'smart',
    intro: ['Second preliminary. I watched your first match from the rail and took four pages of notes. Page five is titled: how I beat you. Let us write it together.'],
    lose: ['Page five, revised: how you beat me. Fairly, and in front of everyone I know. Tyson is deeper in, trainer — and Morrison is between you and him, smiling.'],
    team: [
      { species: 'breloom', level: 290 },
      { species: 'aggron', level: 292 },
      { species: 'milotic', level: 293 },
    ],
    reward: 3600,
  },
  morrison: {
    id: 'morrison', name: 'Morrison', title: 'Conference Trainer', ai: 'smart',
    intro: ['Morrison! Your semi-final, my semi-final, and a friendship the bracket does not care about one bit. I checked: it really does not. So — no holding back, either of us. That IS the friendship, as far as I can tell.'],
    lose: ['Beaten by my friend, in a semi-final, with the whole region watching — do you know, I would not trade a single part of that sentence. The final is yours, trainer. Tyson is waiting, and his TINKLETOM has never once smiled at anyone. Go and give it a reason to.'],
    team: [
      { species: 'girafarig', level: 293 },
      { species: 'growlithe', level: 294 },
      { species: 'swampert', level: 296, keepsake: 'tortoisecharm' },
    ],
    reward: 5000,
  },
  // TYSON — the final, and the Tyson mechanism (the Harrison
  // precedent, mirrored exactly): a scripted forced result is
  // INEXPRESSIBLE in this engine (no scripted-outcome step for
  // trainer battles), so the final ships as a REAL full-strength
  // battle fought FRIENDLY whose completion predicate is FACED.
  // The canonical narrow loss STANDS on the loss branch with
  // canon-honours text; on a win the branch acknowledges the upset
  // on the floor (the Harrison solution) — and hoenn_complete is
  // set either way, because the arc's win was never this card:
  // it was the climax, the eight badges, and Scott's invitation.
  tyson: {
    id: 'tyson', name: 'Tyson', title: 'Ever Grande Conference Finalist', ai: 'smart',
    intro: ['Tyson. You have beaten everyone the bracket put between us, including my friend — he is in the front row now, cheering for both of us, which is very Morrison of him. This is the final, trainer. I did not come to Ever Grande to be a chapter in anyone else\'s story. Come and take the ending, if it is yours.'],
    lose: ['There it is. There is the final I crossed a region for.'],
    team: [
      { species: 'hariyama', level: 294 },
      { species: 'shiftry', level: 295 },
      { species: 'donphan', level: 296 },
      { species: 'sceptile', level: 297 },
      { species: 'meowth', level: 297 },
      { species: 'metagross', level: 298, keepsake: 'ironacorn' },
    ],
    reward: 12000,
  },
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
  // -- Weather Institute: the takeover (r119 entry, Balance held) ---
  // Team Aqua holds the Institute for its rain records (our staging
  // of the canon institute beat). battleAny: the story survives
  // either way; the records are freed regardless, and the grateful
  // staff hand over the Institute's own Castform — canon's gift, and
  // Castform's obtainable source in this game (flagged for H6/H7:
  // castform_received; species dex 351, ONE entry, no formes —
  // ruling 2).
  ev_hoenn_institute: [
    { say: ['The Weather Institute stands over Route 119\'s rain like a lighthouse over a harbour — and today its windows are watched by blue scarves. Inside, the great rain-gauges tick in a held breath of a room, and a researcher with a clipboard meets you at the door at a run.'], who: 'NARRATOR' },
    { say: ['They came an hour ago — polite, at first. Drought records, deluge records, a hundred years of sky, and they would not say WHY. Then polite ran out. Their admin is upstairs with our director and our Castform, and the stairs are watched. Trainer — please. The sky is the one thing this valley reads honestly. Do not let them make it a weapon with footnotes.'], who: 'INSTITUTE DIRECTOR\'S AIDE' },
    { battleAny: { trainer: 'aqua_admin_institute', winFlag: 'institute_aqua_won', loseFlag: 'institute_aqua_lost' } },
    { say: ['Win or lose, the moment breaks the takeover\'s nerve: word runs down the stairs that the road has arrived in force, the blue scarves pour out into the rain they came to study, and the Institute exhales all at once — gauges ticking, kettle on, a hundred years of sky safe in its ledgers.', 'From the director, with the whole staff behind her: "Our Castform has lived in this building\'s weather all its life — it has never once been surprised by the sky. Take it with you, trainer. Where you are going, the sky is about to do things our ledgers have no columns for. It should have a witness it trusts."'], who: 'NARRATOR' },
    { giveMon: { species: 'castform', level: 258 } },
    { flag: 'institute_done' },
    { flag: 'castform_received' },
    { toast: 'The Weather Institute is free — and Castform joined you!' },
  ],

  // -- Mt. Pyre: the orbs taken (entry, Mind Badge held) --------------
  // Both teams converge on the shrine; one admin battle (battleAny),
  // and the orbs are taken in the smoke EITHER WAY — the fiction's
  // point is that arriving bravely is not the same as arriving in
  // time. Sets up both hideouts.
  ev_hoenn_pyre: [
    { say: ['Mt. Pyre breathes mist and old names. The shrine at its heart keeps two orbs asleep in stone — one the red of banked coals, one the blue of deep water — and today the mist has scarves in it. Red on the lower terraces. Blue on the upper. And between them, two keepers with their backs to the shrine door, doing arithmetic nobody should have to do.'], who: 'NARRATOR' },
    { say: ['KEEPERS! They mean to take the orbs — the leashes of the old ones! Children, the mountain has kept them sleeping since before there were teams to want them. Whatever else happens on this mountain today — remember that we TRIED to keep the world\'s oldest argument in its bed.'], who: 'PYRE KEEPER SATO' },
    { battleAny: { trainer: 'magma_admin_pyre', winFlag: 'pyre_magma_won', loseFlag: 'pyre_magma_lost' } },
    { say: ['The battle\'s noise is the cover, and both crews knew it before you did. In the smoke and the shouting, hands close on stone at the shrine — red-scarfed hands take the red orb, blue-scarfed the blue, and the mountain\'s mist swallows both crews whole before any keeper\'s voice can hold them.', 'The shrine stands empty for the first time in living memory, and somehow the mist is louder than the battle was. The keepers look at the bare stone the way sailors look at a horizon that has started, very carefully, to choose a colour.'], who: 'NARRATOR' },
    { flag: 'pyre_done' },
    { flag: 'orbs_taken' },
    { flag: 'red_orb_taken' },
    { flag: 'blue_orb_taken' },
    { toast: 'The orbs were taken from Mt. Pyre.' },
  ],

  // -- Magma Hideout: the caldera door (entry, orbs taken) -----------
  ev_hoenn_magma_hideout: [
    { say: ['The caldera door H3\'s road hinted at stands open on furnace air. Inside Mt. Chimney, Team Magma has built a second crater — orderly, humming, terrified of its own leader\'s patience — and at its heart, under glass, the red orb turns slowly in its cradle like something dreaming of weather.'], who: 'NARRATOR' },
    { battleAny: { trainer: 'magma_admin_hideout', winFlag: 'magma_hideout_won', loseFlag: 'magma_hideout_lost' } },
    { battleAny: { trainer: 'maxie', winFlag: 'maxie_won', loseFlag: 'maxie_lost' } },
    { say: ['Whatever the battles decided, Maxie\'s retreat is a scientist\'s, not a soldier\'s: measured, unhurried, and already elsewhere. The orb cradle stands empty — not smashed, not looted. Carried out the way a surgeon carries a heart. On the console, one line of the plan remains lit, and it is not about land at all. It is a depth sounding.', 'The furnace room ticks as it cools. Somewhere under the sea your rivals worship, an old fire is about to be introduced to salt water — and Maxie is counting on the introduction going exactly the way a mountain would want it to.'], who: 'NARRATOR' },
    { flag: 'magma_hideout_done' },
    { flag: 'maxie_faced' },
    { toast: 'The Magma Hideout is emptied — the orb went deeper.' },
  ],

  // -- Aqua Hideout: the submarine stolen (entry, Pyre done) ---------
  ev_hoenn_aqua_hideout: [
    { say: ['Lilycove harbour, under the warehouse the charts call a boathouse: Team Aqua\'s hideout, all tide-smell and engine light. The research submarine rides her cradle in the flooded dock — a yellow, patient, impossible machine — and blue scarves are casting off her lines one by one with the terrible calm of people ahead of schedule.'], who: 'NARRATOR' },
    { battleAny: { trainer: 'aqua_admin_hideout', winFlag: 'aqua_hideout_won', loseFlag: 'aqua_hideout_lost' } },
    { battleAny: { trainer: 'archie', winFlag: 'archie_won', loseFlag: 'archie_lost' } },
    { say: ['The battles buy minutes, and minutes are not the currency this heist runs on. In the wash of the last exchange the cradle locks sing open, the submarine slides into black harbour water with her lights hooded, and Archie — on her conning tower, saluting no one in particular — goes down with her into the deep he has dreamed about since boyhood.', 'The harbour closes over the theft without a ripple to prosecute. But a stolen submarine leaves one honest clue: her heading. East, then down — toward the trenches off Route 128, where the charts go quiet and the water turns the colour of the first morning.'], who: 'NARRATOR' },
    { flag: 'aqua_hideout_done' },
    { flag: 'archie_faced' },
    { flag: 'submarine_stolen' },
    { toast: 'The submarine was stolen — it dived toward Route 128.' },
  ],

  // -- Seafloor Cavern: the first titan wakes (entry, sub stolen) ----
  // CLIMAX PHASE 1 — DROUGHT. Our staging: Magma reached the deep
  // chamber first (the depth sounding from the hideout console) and
  // Maxie, out of patience with the surface, lets the red orb's
  // leash go in the one place land and sea are the same pressure.
  // Groudon wakes: climax_drought SET (the deluge flag is not set;
  // the phases never overlap — see the standoff event).
  ev_hoenn_seafloor: [
    { say: ['The Seafloor Cavern is not a cave. It is a held breath the ocean has been holding since the world was young — basalt chambers, water the colour of bottled night, and at its heart a floor that is warm through boot leather. Red scarves have been here. Red scarves are GONE from here, which is worse: their instruments stand abandoned mid-reading, needles pegged, in a silence that is getting hotter.'], who: 'NARRATOR' },
    { battleAny: { trainer: 'maxie', winFlag: 'seafloor_maxie_won', loseFlag: 'seafloor_maxie_lost' } },
    { say: ['Whatever the battle\'s verdict, it arrives one heartbeat too late to matter. Maxie — scorched, exultant, halfway to a sermon — holds the red orb up to the chamber\'s heart the way a key is held up to a lock. "The leash," he says, almost gently, "was never for holding. It was for CHOOSING THE MOMENT."', 'The floor answers. Not an earthquake — earthquakes end. This is a waking: heat rolling up through basalt like a sunrise through a wall, light the colour of a kiln\'s heart, and a shape older than the sea floor itself rising out of the world\'s oldest ground with the sun already gathering at its shoulders. Groudon does not roar. The SKY roars for it, all across Hoenn, as the rain simply... stops. Everywhere. At once.', 'Maxie is gone into the light and the steam, laughing or weeping — the cavern does not say. What it says, in heat shimmer and falling dust, is simpler: get to the surface. Get to Sootopolis. A titan is walking toward the sea, and the sea has never once in its life intended to be walked on.'], who: 'NARRATOR' },
    { flag: 'seafloor_done' },
    { flag: 'groudon_woken' },
    { flag: 'climax_drought' },
    { toast: 'Groudon has woken. The drought begins.' },
  ],

  // -- Sootopolis: the answer + the standoff (entry, Seafloor done) --
  // CLIMAX PHASE 2 — DELUGE. Kyogre answers: the drought flag is
  // CLEARED and the deluge flag SET by this scene's steps (the
  // clearFlag steps below), so the renderer phases sun -> rain and
  // the two flags never stand together (the weather module's
  // drought-wins precedence stays a corruption guard, never a
  // staged state). The titans CONVERGE here; neither is battled,
  // caught, or consumed — appearances only (their catch arcs are
  // H6's, opened by climax_resolved).
  ev_hoenn_standoff: [
    { say: ['Sootopolis, from below: a crater lake under a sun that has forgotten how to set, the city\'s white walls shimmering, its people gathered along the water stairs being calm in the specific way of people who have decided to be calm together. The lake is warm. The lake is rising. The lake, a fisherman says to no one, has a heartbeat today.'], who: 'NARRATOR' },
    { say: ['It comes over the crater rim the way weather used to come when the world was newer: a wall of water with a mind in it, blue as the first deep, and the drought\'s white sky breaks above it like a held note breaking. Kyogre has answered. Rain returns to Hoenn all at once, everywhere, at war with the sun — and between the two titans, in a crater full of steam and screaming gulls, stands one small white city, holding its breath in chorus.'], who: 'NARRATOR' },
    { clearFlag: 'climax_drought' },
    { flag: 'climax_deluge' },
    { flag: 'kyogre_answered' },
    { say: ['The standoff does not resolve. That is its horror and its mercy: two old answers to the world\'s first question, glaring at each other across a city neither has yet chosen to step on, while the sky tears itself between drought and deluge fast enough to see. An old keeper is waiting by the Cave of Origin\'s mouth, trainer, and she is looking at you the way people look at the last page of a letter.'], who: 'NARRATOR' },
    { flag: 'standoff_seen' },
    { toast: 'Kyogre has answered. The standoff holds — for now.' },
  ],

  // -- Sky Pillar: Rayquaza descends (entry, standoff seen) ----------
  // CLIMAX RESOLUTION. Rayquaza wakes and descends; BOTH climax
  // flags are CLEARED by this scene's steps, so the renderer falls
  // back to per-map fields region-wide (asserted by the suite).
  // climax_resolved is THE flag H6 keys its titan catch arcs off:
  // set exactly here, never earlier.
  ev_hoenn_rayquaza: [
    { say: ['The Sky Pillar has stood east of Pacifidlog since before there were charts to leave it off of, and its top floor has been slept on, all these centuries, by the sky\'s own answer to the argument below. You climb through weather that cannot decide what it is — rain falling UP past the broken roof-slabs, sunlight arriving in rain\'s clothing — and at the summit, the green serpent of the upper air uncoils from its ring of old stone and considers you the way the horizon considers a ship.'], who: 'NARRATOR' },
    { say: ['Rayquaza does not battle you. Rayquaza does not even, in any sense the ledgers keep, notice you — and somehow that is the most reassuring thing that has ever happened on this mountain of air. It rises. It shines, once, the green of deep water seen from above. Then the sky over Hoenn simply... opens its hand, and the serpent goes down into the standoff like a verdict coming home.'], who: 'NARRATOR' },
    { say: ['What the city saw, it will tell for a hundred years: the green light between the titans, the drought guttering out like a candle, the deluge softening to ordinary rain, two old answers turning — slowly, sullenly, ALIVE and unharmed and uncaught — back toward the deep places they came from. The weather over Hoenn becomes weather again: local, arguable, kind. The region breathes. So, eventually, do you.'], who: 'NARRATOR' },
    { clearFlag: 'climax_drought' },
    { clearFlag: 'climax_deluge' },
    { flag: 'rayquaza_descended' },
    { flag: 'climax_resolved' },
    { toast: 'Rayquaza descended. The clash of titans is over.' },
  ],

  // ================= Stage H6: legendary arcs =================
  // The ten faces. Every face rides the shipped catch-only chain
  // ({ wildBattleCatch } — flee OR KO stalls the event with nothing
  // set, so the encounter re-fires until the species is CAUGHT; arc
  // completion = the catch). The weather trio + Rayquaza key off
  // climax_resolved (set ONLY by ev_hoenn_rayquaza above): their
  // climax roles were appearances, no catch state existed — H6 opens
  // every catch. Levels ride the late band (285-300).
  ev_hoenn_regirock: [
    { say: ['Beyond the parted sealstones, the inner chamber is older than the desert that buried it — and it is occupied. A shape unfolds from the gloom with the patience of geology: arms first, then shoulders, then a head with no face at all, only seven small lights arranged like a held thought.', 'It does not roar. Mountains do not roar. It simply stands where it has stood since before Hoenn had a name, and waits to see whether you are another century, or something new.'], who: 'NARRATOR' },
    { arc: 'arc_regirock', stage: 'active' },
    { wildBattleCatch: { species: 'regirock', level: 285, legendary: true } },
    { arc: 'arc_regirock', stage: 'complete' },
    { flag: 'arc_regirock_done' },
    { toast: 'Regirock is yours. The tomb settles back into its long, unbothered silence.' },
  ],
  ev_hoenn_regice: [
    { say: ['The inner chamber is a held breath of blue-white. The cold coming off the figure at its heart is not weather — it is a decision, made a very long time ago, to never melt. Crystals tick and settle in its surface like a slow clock.', 'Seven lights wake in its featureless face, one by one, the way stars come out. It has been cold for three thousand years. It can spare you a battle.'], who: 'NARRATOR' },
    { arc: 'arc_regice', stage: 'active' },
    { wildBattleCatch: { species: 'regice', level: 285, legendary: true } },
    { arc: 'arc_regice', stage: 'complete' },
    { flag: 'arc_regice_done' },
    { toast: 'Regice is yours. Behind you, the cave\'s cold softens by one honest degree.' },
  ],
  ev_hoenn_registeel: [
    { say: ['The inner chamber gleams dully, every surface worn smooth by centuries of stillness. At its heart, something the colour of old iron unfolds from a crouch it has held since the cliff above was young — slowly, joint by joint, like a gate deciding to be a guardian instead.', 'Seven lights arrange themselves in its face. The metal of it is wrong for any forge: too dark, too patient, fallen out of the sky before there were smiths to wonder at it.'], who: 'NARRATOR' },
    { arc: 'arc_registeel', stage: 'active' },
    { wildBattleCatch: { species: 'registeel', level: 285, legendary: true } },
    { arc: 'arc_registeel', stage: 'complete' },
    { flag: 'arc_registeel_done' },
    { toast: 'Registeel is yours. The tomb\'s gleam dims, its long watch handed over.' },
  ],
  // Latias: the roaming face — fired by the sysLoadMap roam hook
  // when the player enters whichever staged landing she currently
  // holds (the rotation rides the persisted walked-step counter).
  ev_hoenn_latias: [
    { say: ['You almost miss her — the light here has a red edge to it that light should not have, and then the air folds, and she is simply THERE: small, bright, curious, hanging a wingspan away with her head tipped like a question.', 'She has crossed half of Hoenn ahead of you and behind you, outrunning weather and rumour alike, and now she has stopped running — not cornered, never cornered. Choosing. The choice, apparently, is a battle.'], who: 'NARRATOR' },
    { arc: 'arc_latias', stage: 'active' },
    { wildBattleCatch: { species: 'latias', level: 290, legendary: true } },
    { arc: 'arc_latias', stage: 'complete' },
    { flag: 'arc_latias_done' },
    { toast: 'Latias is yours. The red streak over Hoenn has a name in your log now — and a home.' },
  ],
  // Latios: the event face at the Eon stop (the Shoal Cave island
  // shore on Route 125), fired by the sysOnStep shore hook.
  ev_hoenn_latios: [
    { say: ['The island\'s shore is quiet in the particular way of a place that is waited-in. Then the water offshore stands up in a clean blue line, and the line has wings, and the wings have opinions about you.', 'Latios folds out of his own speed at the tideline and regards you with the bright, measuring calm of something that has watched this shore for a very long time, waiting to see who would finally think to land on it.'], who: 'NARRATOR' },
    { arc: 'arc_latios', stage: 'active' },
    { wildBattleCatch: { species: 'latios', level: 290, legendary: true } },
    { arc: 'arc_latios', stage: 'complete' },
    { flag: 'arc_latios_done' },
    { toast: 'Latios is yours. The Eon stop keeps its quiet — it is just sharing it now.' },
  ],
  ev_hoenn_groudon: [
    { say: ['The hideout\'s foundry floors are cold. Its owners are gone. But the magma pool at the back of the deep chamber is NOT cold, and it is not still, and as you come down the last slope it begins, unmistakably, to rise.', 'It withdrew here when the sky settled its argument — back to the earth\'s own heat, to sleep the way continents sleep. It is not asleep now. The pool stands up in red-black armour, and the whole mountain remembers whose house this actually is.'], who: 'NARRATOR' },
    { arc: 'arc_groudon', stage: 'active' },
    { wildBattleCatch: { species: 'groudon', level: 298, legendary: true } },
    { arc: 'arc_groudon', stage: 'complete' },
    { flag: 'arc_groudon_done' },
    { toast: 'Groudon is yours. The magma pool settles, ordinary as a forge at closing time.' },
  ],
  ev_hoenn_kyogre: [
    { say: ['The trench water below the dive light is doing something water should not do: it is holding a shape. A vast shape. The shape opens one eye the size of a porthole in the blue dark, and the pressure of its attention arrives a half-second before the sight of it does.', 'It sleeps here, in the deep it nearly drowned the world with — and it has decided, in the unhurried way of tides, to see what the trainer who ended the deluge actually is. The trench holds its breath. So does everything in it.'], who: 'NARRATOR' },
    { arc: 'arc_kyogre', stage: 'active' },
    { wildBattleCatch: { species: 'kyogre', level: 298, legendary: true } },
    { arc: 'arc_kyogre', stage: 'complete' },
    { flag: 'arc_kyogre_done' },
    { toast: 'Kyogre is yours. The trench exhales, slow as a sleeping tide.' },
  ],
  // The catch face — NOT ev_hoenn_rayquaza (that was the climax
  // appearance, an uncatchable descent). This is the return ascent.
  ev_hoenn_rayquaza_face: [
    { say: ['The pillar is quieter than your first climb — no argument below for its sleeper to settle, only wind, coming home to roost. At the summit the ring of old stone is empty for exactly one heartbeat.', 'Then the sky folds, green as deep water seen from above, and Rayquaza is coiled in its ring again, considering you with the total, courteous attention of the oldest thing in Hoenn\'s sky. It descended once for the world. This time, it has come down for you.'], who: 'NARRATOR' },
    { arc: 'arc_rayquaza', stage: 'active' },
    { wildBattleCatch: { species: 'rayquaza', level: 300, legendary: true } },
    { arc: 'arc_rayquaza', stage: 'complete' },
    { flag: 'arc_rayquaza_done' },
    { toast: 'Rayquaza is yours. The summit wind, for once, has nothing to say.' },
  ],
  // Jirachi I: the star fall, witnessed at Meteor Falls once the
  // Space Center\'s news is in hand (entry gate in sysLoadMap).
  ev_hoenn_jirachi_witness: [
    { say: ['The falls are loud the way they always are — and then, for exactly three seconds, they are not the loudest thing in the cave. Light comes down the north shaft in a clean white line, unhurried, deliberate: a star, falling indoors, on appointment.', 'It lands beyond the lower falls without a sound, and the spray where it fell keeps glowing faintly, like the water is remembering it. The Space Center said a Wish Maker wakes beneath the comet. The comet, it seems, has sent a piece of itself ahead — down there. By the meteorstone. Go and be polite.'], who: 'NARRATOR' },
    { arc: 'arc_jirachi', stage: 'active' },
    { flag: 'jirachi_star_fell' },
    { toast: 'A star fell at Meteor Falls. Something small is waking by the lower falls.' },
  ],
  // Jirachi II: the wish beat at the lower-falls meteorstone
  // (13,11), fired by the meteorstone interact once the star fell.
  ev_hoenn_jirachi: [
    { say: ['The meteorstone is warm. Curled against it, no bigger than a secret, is a small yellow shape with streamers like ribbons on a parcel — asleep on its feet, swaying, humming a note you feel in your teeth more than hear.', 'One eye opens. Then the other. Then the third one — the true one, in its belly, the one that hears wishes the way ears hear thunder — and the little Wish Maker looks at you, looks at the comet going over far above, and makes a decision older than the Space Center, older than the falls: a wish is only real if somebody has to work for it. Catch, then. Earn the wish.'], who: 'NARRATOR' },
    { arc: 'arc_jirachi', stage: 'active' },
    { wildBattleCatch: { species: 'jirachi', level: 292, legendary: true } },
    { arc: 'arc_jirachi', stage: 'complete' },
    { flag: 'arc_jirachi_done' },
    { toast: 'Jirachi is yours. Somewhere above the falls, a comet files the wish away under "answered".' },
  ],
  // Deoxys: the crater face at the north-chamber meteorite (21,4),
  // fired by the meteorstone interact once the rumour is in hand.
  ev_hoenn_deoxys: [
    { say: ['The crater meteorite is not warm the way sun-warmed stone is warm. It is warm the way a held hand is warm — recently, and on purpose. As you reach it, the stone\'s heart answers with light: a core of orange fire, unfolding out of the rock in limbs that cannot decide what shape honesty requires.', 'It came down with the old shower, before there were falls to name it by, and it has been rehearsing shapes ever since — waiting for an audience worth the performance. The rehearsals are over. This is the performance.'], who: 'NARRATOR' },
    { arc: 'arc_deoxys', stage: 'active' },
    { wildBattleCatch: { species: 'deoxys', level: 295, legendary: true } },
    { arc: 'arc_deoxys', stage: 'complete' },
    { flag: 'arc_deoxys_done' },
    { toast: 'Deoxys is yours. The crater stone goes quiet — its tenant has moved into your party.' },
  ],
};

// ---------------------------------------------------------------------------
// HOENN_LEGENDARY_ARCS — Stage H6. The ten Hoenn legendary arcs,
// folded into LEGENDARY_ARCS by merge.mjs exactly the way Johto's
// fold works (one arcs table, one quest log). Object.assign order
// makes these LIVE entries supersede the designed stubs in
// story-kanto.mjs — the stubs' lair ids ('deserttomb', 'skypillar',
// 'birthisland', 'forina') never existed as maps, their levels (40/70)
// predate the arc bands, and arc_rayquaza's designed prereq
// ({ arcs: [kyogre, groudon] }) is superseded by the H4b ruling: the
// trio + Rayquaza key off the `climax_resolved` flag alone.
//
// Shared laws (all ten arcs):
//  - Every face uses the catch-only wildBattleCatch chain: flee OR
//    KO stalls the event with nothing set, so the encounter re-fires
//    until the species is CAUGHT. Arc completion = the catch.
//  - The Regi tombs are SELF-CONTAINED: there is no Sealed Chamber
//    map in the shipped Hoenn, so no cross-tomb prerequisite chain
//    exists — each tomb's own inscription is its only key (the
//    simplification is recorded in the register).
//  - Levels sit in Hoenn's late band: Regis 285, the Eon pair 290,
//    Jirachi 292, Deoxys 295, the titans 298, Rayquaza 300 (ceiling).
// ---------------------------------------------------------------------------
export const HOENN_LEGENDARY_ARCS = {
  arc_regirock: {
    id: 'arc_regirock', title: 'The Tomb in the Sand', species: 'regirock', region: 'Hoenn',
    hook: 'Under the Route 111 desert, a sand-drowned chamber keeps a tenant older than the road above it — and its door is a riddle about patience.',
    steps: [
      { text: 'Read the dotted inscription on the stone by the Desert Ruins door', flag: 'regi_rock_read' },
      { text: 'Stand before the sealstone and wait out the six slow breaths it asks for', flag: 'regi_rock_open' },
      { text: 'Face Regirock, level 285, beyond the parted sealstones', catch: 'regirock' },
    ],
    lair: 'desert-ruins',
  },
  arc_regice: {
    id: 'arc_regice', title: 'The Tomb in the Ice', species: 'regice', region: 'Hoenn',
    hook: 'Inside the Route 105 island rock, a chamber floored in old ice keeps its tenant the way winter keeps a lake — and its door is a riddle about order.',
    steps: [
      { text: 'Read the dotted inscription on the stone by the Island Cave door', flag: 'regi_ice_read' },
      { text: 'Greet the chamber\'s two boulders in the inscription\'s order — west first, then east', flag: 'regi_ice_open' },
      { text: 'Face Regice, level 285, beyond the parted sealstones', catch: 'regice' },
    ],
    lair: 'island-cave',
  },
  arc_registeel: {
    id: 'arc_registeel', title: 'The Tomb in the Ruin', species: 'registeel', region: 'Hoenn',
    hook: 'A cliff chamber east of the rain road, older than any map of Hoenn. Its door is a riddle about kinship: iron opens to iron.',
    steps: [
      { text: 'Read the dotted inscription on the stone by the Ancient Tomb door', flag: 'regi_steel_read' },
      { text: 'Press your hand to the sealstone with a Steel-type partner standing beside you', flag: 'regi_steel_open' },
      { text: 'Face Registeel, level 285, beyond the parted sealstones', catch: 'registeel' },
    ],
    lair: 'ancient-tomb',
  },
  arc_latias: {
    id: 'arc_latias', title: 'The Red Streak Over Hoenn', species: 'latias', region: 'Hoenn',
    prereq: 'climax_resolved',
    hook: 'Since the titans settled, something red, kind and impossibly fast has been crossing Hoenn\'s routes and waters — landing, watching, and moving on. It is not fleeing. It is deciding where to be met.',
    steps: [
      { text: 'End the clash of the weather titans — she only came down once the sky was safe', flag: 'climax_resolved' },
      { text: 'Meet Latias, level 290, where she lands — her landings turn with your walking: Routes 110, 118, 123, the Route 127 sea and Route 134, in turn', catch: 'latias' },
    ],
    lair: 'hoenn-routes',
  },
  arc_latios: {
    id: 'arc_latios', title: 'The Jet Over the Water', species: 'latios', region: 'Hoenn',
    prereq: 'climax_resolved',
    hook: 'Fishermen keep reporting the same impossible thing: a blue jet-shaped shadow that outruns their boats — except at one quiet shore, where it slows, and waits.',
    steps: [
      { text: 'End the clash of the weather titans — he only slowed down once the sea was calm', flag: 'climax_resolved' },
      { text: 'Land on the Shoal Cave island on Route 125 — the Eon stop — and face Latios, level 290, at its tideline', catch: 'latios' },
    ],
    lair: 'r125',
  },
  arc_groudon: {
    id: 'arc_groudon', title: 'The Land That Wants Everything', species: 'groudon', region: 'Hoenn',
    prereq: 'climax_resolved',
    hook: 'When the sky settled the argument, the land\'s answer did not die and was not caught — it withdrew, sullen and alive, to the earth\'s own heat.',
    steps: [
      { text: 'End the clash of the weather titans at the Sky Pillar', flag: 'climax_resolved' },
      { text: 'Return to the deep chamber of Team Magma\'s old hideout and face Groudon, level 298, risen from its magma pool', catch: 'groudon' },
    ],
    lair: 'magma-hideout',
  },
  arc_kyogre: {
    id: 'arc_kyogre', title: 'The Sea That Wants Everything', species: 'kyogre', region: 'Hoenn',
    prereq: 'climax_resolved',
    hook: 'The deluge ended, but the sea\'s answer was never caught — it sleeps now in the deep it nearly drowned the world with, and it knows your name.',
    steps: [
      { text: 'End the clash of the weather titans at the Sky Pillar', flag: 'climax_resolved' },
      { text: 'Dive the Route 127 trench and face Kyogre, level 298, in the deep (Mind Badge + a partner who knows Dive)', catch: 'kyogre' },
    ],
    lair: 'r127-underwater',
  },
  arc_rayquaza: {
    id: 'arc_rayquaza', title: 'The Sky Settles It', species: 'rayquaza', region: 'Hoenn',
    prereq: 'climax_resolved',
    hook: 'It descended once, for the world, and asked nothing. The summit keeps its ring of old stone — and the sleeper, the wardens say, has started watching the road up.',
    steps: [
      { text: 'End the clash of the weather titans — the descent was an appearance, not a meeting', flag: 'climax_resolved' },
      { text: 'Climb the Sky Pillar again and face Rayquaza, level 300, at the summit', catch: 'rayquaza' },
    ],
    lair: 'sky-pillar',
  },
  arc_jirachi: {
    id: 'arc_jirachi', title: 'The Thousand-Year Wish', species: 'jirachi', region: 'Hoenn',
    hook: 'A comet is crossing Hoenn, and the Space Center\'s oldest file says a Wish Maker wakes beneath it — briefly, and only for wishes worth working for.',
    steps: [
      { text: 'Ask Researcher Orbit at the Mossdeep Space Center about the comet crossing Hoenn', flag: 'arc_jirachi_news' },
      { text: 'Witness the star fall at Meteor Falls', flag: 'jirachi_star_fell' },
      { text: 'Follow the fallen light to the meteorstone by the lower falls and face Jirachi, level 292 — earn the wish', catch: 'jirachi' },
    ],
    lair: 'meteor-falls',
  },
  arc_deoxys: {
    id: 'arc_deoxys', title: 'The Triangle That Moves', species: 'deoxys', region: 'Hoenn',
    hook: 'Something fell with the old meteor shower at Meteor Falls and never cooled. The Space Center tracks it the way you track weather: respectfully, and from a distance.',
    steps: [
      { text: 'Hear the Space Center\'s rumour from Researcher Orbit in Mossdeep', flag: 'arc_deoxys_rumor' },
      { text: 'Face Deoxys, level 295, at the crater meteorite in Meteor Falls\' north chamber', catch: 'deoxys' },
      { text: 'Return to the meteorite with Deoxys in your party — it remembers every shape it has ever been', flag: 'deoxys_forme_touched' },
    ],
    lair: 'meteor-falls',
  },
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
    stageLines: ['The stone? You are not a teacher. ...You do not LOOK like a teacher. Fine. The stone goes with whoever leaves.', 'Every student who leaves Rustboro for a journey takes it in their pack, and someone brings it home — a sibling, a friend, a DUNPLUME in one famous case. It has been to every gym in Hoenn. It is enrolled here, technically. Its attendance is better than mine. Tell the researcher: it travels because leaving is a subject too, and the stone is the only one of us who has passed it forty times.'],
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
  { map: 'petalburg', x: 13, y: 7, name: 'WALLY', art: 'kid', skin: '#f0d8b8', shirt: '#7c3fa5', pants: '#3a3a4a', hair: '#4a7a4a', hoenn: 'wally',
    dialogue: ['I caught one. Me. A Ralts, by the pond grass — well. We caught each other, I think.'] },
  { map: 'gym-petalburg', x: 7, y: 2, name: 'NORMAN', art: 'gym5', skin: '#e8b888', shirt: '#4a4a5a', pants: '#2a2a3a', hair: '#2a2a3a', hoenn: 'norman',
    dialogue: ['Balance is not standing still, challenger. Come back when the road has taught you that, and I will test it personally.'] },
  { map: 'gym-rustboro', x: 7, y: 2, name: 'ROXANNE', art: 'gym1', skin: '#f0c8a0', shirt: '#7a3a3a', pants: '#3a3a4a', hair: '#5a2a3a', hoenn: 'roxanne',
    dialogue: ['Every stone in this gym was placed to teach. Mind the compass stone.'] },
  { map: 'gym-rustboro', x: 4, y: 5, name: 'YOUNGSTER BRAM', art: 'youngster', skin: '#f0c8a0', shirt: '#324a83', pants: '#2a2a3a', hair: '#7a4a1a', trainer: 'rustboro_gym_1',
    dialogue: ['Boots checked. Book signed.'] },
  { map: 'gym-rustboro', x: 11, y: 5, name: 'HIKER SELLA', art: 'hiker', skin: '#d8a878', shirt: '#50368e', pants: '#3a3a2a', hair: '#2a1a0a', trainer: 'rustboro_gym_2',
    dialogue: ['The stone does not care which day it is.'] },
  { map: 'gym-dewford', x: 7, y: 2, name: 'BRAWLY', art: 'gym2', skin: '#d8a878', shirt: '#2a6a8a', pants: '#2a2a3a', hair: '#1a2a4a', hoenn: 'brawly',
    dialogue: ['Read the wave, trainer. Then stand in it.'] },
  { map: 'gym-dewford', x: 4, y: 5, name: 'BLACKBELT ROOK', art: 'blackbelt', skin: '#c89878', shirt: '#e8e0c8', pants: '#3a3a3a', hair: '#1a1a1a', trainer: 'dewford_gym_1',
    dialogue: ['In the dark, footwork is everything.'] },
  { map: 'gym-dewford', x: 11, y: 5, name: 'BATTLE GIRL SANA', art: 'lass', skin: '#f0c8a0', shirt: '#c05a7a', pants: '#2a2a3a', hair: '#2a1a3a', trainer: 'dewford_gym_2',
    dialogue: ['A wave is a punch the ocean throws forever.'] },
  { map: 'gym-mauville', x: 7, y: 2, name: 'WATTSON', art: 'elder', skin: '#e8b888', shirt: '#e8c832', pants: '#3a4a5a', hair: '#e8e8e8', hoenn: 'wattson',
    dialogue: ['Wahahaha! Mind the barriers, youngster!'] },
  { map: 'gym-mauville', x: 4, y: 5, name: 'CAMPER ILYA', art: 'camper', skin: '#f0c8a0', shirt: '#324a83', pants: '#3a3a2a', hair: '#7a1a1a', trainer: 'mauville_gym_1',
    dialogue: ['I do not apologize. I conduct.'] },
  { map: 'gym-mauville', x: 11, y: 5, name: 'ENGINEER PASK', art: 'scientist', skin: '#d8a878', shirt: '#5a6a7a', pants: '#2a2a3a', hair: '#4a4a5a', trainer: 'mauville_gym_2',
    dialogue: ['Every challenger is a load test.'] },
  { map: 'gym-lavaridge', x: 7, y: 2, name: 'FLANNERY', art: 'gym4', skin: '#f0c8a0', shirt: '#c83a2a', pants: '#2a2a3a', hair: '#c83a1a', hoenn: 'flannery',
    dialogue: ['In here, we burn. That is the whole policy.'] },
  { map: 'gym-lavaridge', x: 4, y: 5, name: 'KINDLER FENN', art: 'camper', skin: '#e8b888', shirt: '#a03a2a', pants: '#3a3a2a', hair: '#3a2a1a', trainer: 'lavaridge_gym_1',
    dialogue: ['Mind your step — then mind my Slugma.'] },
  { map: 'gym-lavaridge', x: 11, y: 5, name: 'HIKER BRASA', art: 'hiker', skin: '#c89878', shirt: '#2d4377', pants: '#3a3a2a', hair: '#1a1a0a', trainer: 'lavaridge_gym_2',
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
  // --- H4b actors ---
  { map: 'gym-petalburg', x: 4, y: 5, name: 'ACE TRAINER DARIO', art: 'acetrainer', skin: '#d8a878', shirt: '#4a6a8a', pants: '#2a2a3a', hair: '#1a1a1a', trainer: 'petalburg_gym_1',
    dialogue: ['Stand honestly, trainer.'] },
  { map: 'gym-petalburg', x: 11, y: 5, name: 'COOL TRAINER MARN', art: 'lass', skin: '#f0c8a0', shirt: '#7a4a6a', pants: '#2a2a3a', hair: '#3a2a4a', trainer: 'petalburg_gym_2',
    dialogue: ['Then the weight arrives, all at once, honestly.'] },
  { map: 'gym-fortree', x: 7, y: 2, name: 'WINONA', art: 'gym3', skin: '#f0c8a0', shirt: '#5a7a9a', pants: '#e8e8e8', hair: '#7a9ab8', hoenn: 'winona',
    dialogue: ['Mind the canopy, challenger, and mind the wind.'] },
  { map: 'gym-fortree', x: 4, y: 5, name: 'BIRD KEEPER ANSEL', art: 'camper', skin: '#e8b888', shirt: '#833732', pants: '#3a3a2a', hair: '#5a3a1a', trainer: 'fortree_gym_1',
    dialogue: ['If you cannot see the wind, battle like it sees you.'] },
  { map: 'gym-fortree', x: 11, y: 5, name: 'PICNICKER WREN', art: 'picnicker', skin: '#f0c8a0', shirt: '#c8a03a', pants: '#2a304a', hair: '#8a5a2a', trainer: 'fortree_gym_2',
    dialogue: ['I picnic at altitude and battle at altitude.'] },
  { map: 'gym-mossdeep', x: 7, y: 2, name: 'TATE', art: 'kid', skin: '#f0d8b8', shirt: '#6a5a9a', pants: '#2a2a3a', hair: '#3a3a6a', hoenn: 'tate_liza',
    dialogue: ['I am Tate — the left half of this gym.'] },
  { map: 'gym-mossdeep', x: 9, y: 2, name: 'LIZA', art: 'lass', skin: '#f0d8b8', shirt: '#8a5a9a', pants: '#2a2a3a', hair: '#3a3a6a', hoenn: 'liza_flavor',
    dialogue: ['Liza — the half that was listening.'] },
  { map: 'gym-mossdeep', x: 4, y: 5, name: 'PSYCHIC HOLLIS', art: 'scientist', skin: '#d8a878', shirt: '#5a5a7a', pants: '#2a2a3a', hair: '#2a2a3a', trainer: 'mossdeep_gym_1',
    dialogue: ['Losing here is educational.'] },
  { map: 'gym-mossdeep', x: 11, y: 5, name: 'HEX MANIAC IONE', art: 'lass', skin: '#e8b888', shirt: '#3a2a4a', pants: '#2a2a3a', hair: '#1a1a2a', trainer: 'mossdeep_gym_2',
    dialogue: ['Plan for two battles, trainer.'] },
  { map: 'gym-sootopolis', x: 7, y: 2, name: 'JUAN', art: 'gym5', skin: '#e8b888', shirt: '#2a4a6a', pants: '#e8e8e8', hair: '#e8e8e8', hoenn: 'juan',
    dialogue: ['Precisely, and to a finish.'] },
  { map: 'gym-sootopolis', x: 4, y: 5, name: 'SWIMMER CATO', art: 'camper', skin: '#d8a878', shirt: '#2a6a8a', pants: '#2a2a3a', hair: '#2a1a0a', trainer: 'sootopolis_gym_1',
    dialogue: ['Tradition, trainer.'] },
  { map: 'gym-sootopolis', x: 11, y: 5, name: 'BEAUTY ONDINE', art: 'lass', skin: '#f0c8a0', shirt: '#4a8a9a', pants: '#2a2a3a', hair: '#6a3a5a', trainer: 'sootopolis_gym_2',
    dialogue: ['Sing, trainer.'] },
  { map: 'mossdeep', x: 14, y: 9, name: 'STEVEN', art: 'acetrainer', skin: '#f0c8a0', shirt: '#4a4a5a', pants: '#6a2a2a', hair: '#b8c8d8', hoenn: 'steven',
    dialogue: ['Stones, steel, and the deep road. I collect all three.'] },
  { map: 'contest-lilycove', x: 8, y: 6, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_contest_lilycove',
    dialogue: ['The last hall on my road. Watch how it ends.'] },
  { map: 'lilycove', x: 16, y: 8, name: 'MAY', art: 'lass', skin: '#f0c8a0', shirt: '#c83a3a', pants: '#2a4a6a', hair: '#6a4a2a', hoenn: 'may_festival',
    dialogue: ['The Grand Festival, {player}. My whole road, in one hall.'] },
  { map: 'victory-road', x: 11, y: 6, name: 'WALLY', art: 'kid', skin: '#f0d8b8', shirt: '#7c3fa5', pants: '#3a3a4a', hair: '#4a7a4a', hoenn: 'wally_final',
    dialogue: ['I have thought about how this sentence ends for a whole region.'] },
  { map: 'cave-of-origin', x: 8, y: 7, name: 'KEEPER ANTHEA', art: 'elder', skin: '#e8b888', shirt: '#2d4377', pants: '#2a2a3a', hair: '#c0c0c0', hoenn: 'origin_keeper',
    dialogue: ['The cave keeps the first argument. The sky keeps its answer.'] },
  { map: 'petalburg-woods', x: 12, y: 9, name: 'AURA KEEPER', art: 'elder', skin: '#d8a878', shirt: '#6b2941', pants: '#2a2a3a', hair: '#e8e8e8', hoenn: 'lucario_keeper',
    dialogue: ['The old tree remembers an aura that walked like a friend.'] },
  { map: 'league-evergrande', x: 9, y: 5, name: 'LEAGUE REGISTRAR', art: 'scientist', skin: '#e8b888', shirt: '#3a4a6a', pants: '#2a2a3a', hair: '#4a3a2a', hoenn: 'hoenn_conference',
    dialogue: ['Eight badges open this bracket, trainer.'] },
  { map: 'league-evergrande', x: 13, y: 8, name: 'MORRISON', art: 'youngster', skin: '#f0c8a0', shirt: '#c85a2a', pants: '#2a304a', hair: '#7a3a1a', hoenn: 'morrison',
    dialogue: ['No holding back, either of us. That IS the friendship.'] },
  { map: 'league-evergrande', x: 11, y: 8, name: 'TYSON', art: 'acetrainer', skin: '#d8a878', shirt: '#60243a', pants: '#2a2a3a', hair: '#2a2a1a', hoenn: 'tyson',
    dialogue: ['Come and take the ending, if it is yours.'] },
  { map: 'league-evergrande', x: 15, y: 12, name: 'SCOTT', art: 'gent', skin: '#e8b888', shirt: '#7a6a2a', pants: '#3a3a2a', hair: '#5a4a2a', hoenn: 'scott',
    dialogue: ['I scout battle the way other men scout weather: professionally, and with great enjoyment.'] },
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
