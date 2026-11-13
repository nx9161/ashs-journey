// story-kanto.mjs — Chapter 1 (Arden) campaign data: quest chain, scripted
// story events, legendary arcs, and the ending roll. Anime-first canon per
// the owner's watch order (docs/chronology-mapping.md); the games supply
// mechanics only. ALL dialogue is original writing in the anime's spirit —
// no quoted or closely-paraphrased anime/game lines (GC §3.3).
//
// Event step contract (engine): { say, who } | { battle } | { wildBattle } |
// { giveMon } | { give } | { flag } | { quest } | { questDone } | { arc } |
// { heal } | { warp } | { chapterCard } | { toast } | { ending } |
// { choice } | { sayVar } — the ADR-025 §2 bond steps: choice points
// (unlabelled options, deltas <= 2, every option advances the beat) and
// tier-variant line beats (silent when no variant exists for the tier).
// Gym aftermath lines live in the trainer defs, NOT here — these events
// carry the story AROUND the gyms. {player} is the name placeholder,
// matching dialogue.mjs.

// ---------------------------------------------------------------------------
// MAIN_QUESTS — the main-story objective chain, in order (renamed in
// Rejuvenation Phase 4: the name QUESTS now belongs to the Town Tales
// table in data/quests.mjs, per ADR-025 §5; the bundle is one scope).
// `flag` is the story flag that
// completes the objective (events below also emit questDone where a route
// can branch, e.g. either SOMNIBEAR).
// ---------------------------------------------------------------------------

export const MAIN_QUESTS = [
  { id: 'q_partner', flag: 'metPartner', text: 'Meet Prof. Hawthorn and receive your partner', hint: 'VOLTIK joins you at the very start of your journey — it has opinions, and a strong dislike of Capture Orbs. If you ever find yourselves parted, Prof. Hawthorn at his Dawnwick lab will set it right.' },
  { id: 'q_boulder', flag: 'badge_boulder', text: 'Win the Boulder Badge in Flintridge City', hint: 'Through Fernmere Forest, then challenge Brock. Water and Grass moves crack Rock types open.' },
  { id: 'q_cerulean', flag: 'reached_cerulean', text: 'Cross Mt. Lunestone and reach Tidehaven City', hint: 'The cave east of Flintridge is dark and full of SKREEBAT. Stock up on Potions before you go in.' },
  { id: 'q_cascade', flag: 'badge_cascade', text: 'Win the Cascade Badge in Tidehaven City', hint: 'Misty’s Water types fear Grass and Electric moves. Watch for her ASTRION.' },
  { id: 'q_bill', flag: 'bill_helped', text: 'Help the researcher at the Sea Cottage', hint: 'Cross Nugget Bridge, then follow Route 25 to the cottage on the cape. Something there is not what it seems.' },
  { id: 'q_vermilion', flag: 'reached_vermilion', text: 'Reach Arcport City', hint: 'South through the underground path from Tidehaven. The harbor smells of salt and adventure.' },
  { id: 'q_stanne', flag: 'stanne_done', text: 'Sail on the St. Anne', hint: 'Bill’s spare ticket gets you aboard. Enjoy the party — and keep an eye on the waiters.' },
  { id: 'q_thunder', flag: 'badge_thunder', text: 'Win the Thunder Badge in Arcport City', hint: 'Lt. Surge respects only power. Ground types shrug off his Electric moves entirely.' },
  { id: 'q_celadon', flag: 'reached_celadon', text: 'Reach Canopy City', hint: 'The department-store city lies west. The road bends past Hushmoor Town — mind the tower’s shadow.' },
  { id: 'q_rainbow', flag: 'badge_rainbow', text: 'Win the Rainbow Badge in Canopy City', hint: 'Erika’s Grass types wilt under Fire, Ice, and Flying moves.' },
  { id: 'q_scope', flag: 'scope_done', text: 'Infiltrate the Game Corner and recover the Vantage Scope', hint: 'That poster in the Game Corner is hiding something. Whatever is underneath it took the Scope — take it back.' },
  { id: 'q_flute', flag: 'flute_got', text: 'Climb Hushmoor Tower and earn the Kin Flute', hint: 'The Scope reveals what haunts the tower. Bring a gentle heart for the upper floors.' },
  { id: 'q_snorlax', flag: 'snorlax_west', text: 'Wake a sleeping SOMNIBEAR', hint: 'The Kin Flute’s tune is the only alarm clock a SOMNIBEAR respects. One sleeps east of Hushmoor, one west above Cycling Road — either road leads on.' },
  { id: 'q_soul', flag: 'badge_soul', text: 'Win the Soul Badge in Bramble City', hint: 'Koga’s Poison types and invisible walls reward patience. Ground and Psychic moves help.' },
  { id: 'q_silph', flag: 'silph_done', text: 'Liberate Vantage Co. in Farsight City', hint: 'Eleven floors of trouble, and the president is held on the top one. Find the card key and climb.' },
  { id: 'q_marsh', flag: 'badge_marsh', text: 'Win the Marsh Badge in Farsight City', hint: 'Sabrina’s Psychic types hit like prophecy. Bug, Ghost, and Dark moves are your friends.' },
  { id: 'q_mansion', flag: 'mansion_key', text: 'Find the Secret Key in the Caldera Mansion', hint: 'The burned mansion keeps its secrets in the basement. Read the surviving journals — they matter later.' },
  { id: 'q_volcano', flag: 'badge_volcano', text: 'Win the Volcano Badge on Caldera Town', hint: 'Blaine quizzes before he battles. Fire fears Water, Ground, and Rock.' },
  { id: 'q_earth', flag: 'badge_earth', text: 'Win the Earth Badge in Fernmere City', hint: 'The traveling leader has finally come home. Bring everything you have — this is the last door before the League.' },
  { id: 'q_movie', flag: 'movie_done', text: 'Answer the invitation to Exile Isle', hint: 'A courier brought it on a storm wind. Whatever waits there already knows your name.' },
  { id: 'q_league', flag: 'league_gate_passed', text: 'Pass the League gate on Route 23', hint: 'The guards check all eight badges. No exceptions, no shortcuts, no stories.' },
  { id: 'q_champion', flag: 'champion', text: 'Defeat the Elite Four and become Champion', hint: 'Four masters, then a face you know better than anyone. Heal between every door.' },
  { id: 'q_mewtwo', flag: 'mewtwo_done', text: 'Face what sleeps in Tidehaven Cave', hint: 'Post-game. The mansion journals pointed here all along. It has been waiting for someone strong enough.' },
  { id: 'q_diploma', flag: 'diploma', text: 'Complete the KinDex and claim your diploma', hint: 'Catch every species in Arden, then show Prof. Hawthorn a finished dex.' },
];

// ---------------------------------------------------------------------------
// EVENTS — scripted story beats, keyed by event id. Engine gates: SOMNIBEAR
// events require the pokeflute in the bag; ev_league_gate requires 8 badges;
// PRISMWING_EVENT requires owning a butterfree. The duo escalation runs
// r2_duo (slice, Route 2) -> duo2 (St. Anne) -> duo3 (tower cameo / Canopy)
// -> duo4 (Farsight) -> duo5 (islands) across the campaign.
// ---------------------------------------------------------------------------

export const EVENTS = {

  // -- Tidehaven: Bill's Sea Cottage ---------------------------------------
  ev_bill: [
    { say: ['...Hello? Is someone there? Oh, thank goodness — a human. With hands. Hands are very important right now.'], who: 'BILL' },
    { say: ['It is me. Bill. The researcher. And before you ask — yes, this small round Kin standing in my cottage IS me, wearing the consequences of my own experiment.', 'I was testing pod-to-pod transfers and the separation step... improvised. Now I am roughly forty percent MOONLET and one hundred percent embarrassed.'], who: 'BILL' },
    { say: ['The fix is on that terminal. Big friendly button. Press it, and try not to enjoy this too much.'], who: 'BILL' },
    { say: ['...And — THERE. Two legs, ten fingers, one dignity, slightly used. Bill is back!'], who: 'BILL' },
    { say: ['You saved my career and my afternoon, in that order. Take this — I get invited to a floating trainer party every year and I never go. A spare ticket for the St. Anne, docked in Arcport.', 'Go. Mingle. Battle someone who owns a butler. You have earned it.'], who: 'BILL' },
    { flag: 'bill_helped' },
    { questDone: 'q_bill' },
    { toast: 'Bill is himself again!' },
  ],

  // -- Tidehaven: Gary on the bridge ---------------------------------------
  ev_rival_bridge: [
    { say: ['Well, well. Look who finally crawled out of Mt. Lunestone.'], who: 'GARY' },
    { say: ['I was just up at that cottage on the cape. The researcher there let me scroll his whole database — some of us get the guided tour, {player}.'], who: 'GARY' },
    { say: ['Badges? Funny you should ask. Two already. I would show them off, but the glare might sting your eyes.'], who: 'GARY' },
    { say: ['And this — this is PRISMKIT. Everyone keeps asking why it has not evolved yet.', 'Because I am saving it. Evolution is a promise you make exactly once. When mine happens, it is going to mean something.'], who: 'GARY' },
    { choice: { npc: 'gary', who: 'GARY', prompt: 'PRISMKIT looks at you, head tilted. You —', options: [
      { label: 'Ask what PRISMKIT wants', delta: 2, say: ['...What PRISMKIT wants? Nobody asks that. They ask what it will BECOME.', 'Huh. It wants to win, obviously. Like me. ...Thanks for asking, I guess. Do not make it weird.'] },
      { label: 'Laugh at the speech', delta: -1, say: ['Oh, REAL mature, {player}. Laugh it up. In about ten minutes one of us is going to look extremely stupid, and it is not the one with two badges.'] },
      { label: 'Say nothing', delta: 0, say: ['...Yeah. You get it. Enough talk, then.'] },
    ] } },
    { say: ['Enough talk. Show me what the mountain taught you — if it taught you anything.'], who: 'GARY' },
    { battle: 'gary_cerulean' },
    { say: ['Tch. Fine. Take the win and the bridge. Tidehaven’s gym is just south — Misty has been bored all week, so try not to disappoint her too quickly.'], who: 'GARY' },
    { flag: 'rival_bridge_done' },
  ],

  // -- Arcport: boarding the St. Anne ------------------------------------
  ev_stanne: [
    { say: ['Ticket, please... Oh, lovely. Welcome aboard the St. Anne, young trainer!'], who: 'ATTENDANT' },
    { say: ['Three decks of ocean, two decks of snacks, and more trainers than you can battle before dessert. Mind the railing — the BRINEGULL have opinions.'], who: 'ATTENDANT' },
    { say: ['Somewhere below the waterline, crates shift in the dark. Stamped on each one, half scratched out: a single red letter.'], who: 'NARRATOR' },
    { quest: 'q_stanne' },
    { toast: 'You boarded the St. Anne!' },
  ],

  // -- St. Anne: the duo, in "disguise" -------------------------------------
  ev_duo_stanne: [
    { say: ['Two waiters approach your table. One has a moustache that is clearly drawn on. The other is wearing his apron upside down.'], who: 'NARRATOR' },
    { say: ['Bonjour! We are ze waiters, here to — how you say — wait upon you. And inspect your Kin. For health reasons. Ze health reasons are very strict.'], who: 'RUE' },
    { say: ['Rue. The accent. Maybe... less accent.'], who: 'COLE' },
    { say: ['I am IN CHARACTER, Cole.'], who: 'RUE' },
    { say: ['You are holding the menu upside down.'], who: 'COLE' },
    { say: ['It is AVANT-GARDE. ...Enough! The disguise was flawless and everyone on this ship knows it. Hand over the VOLTIK, {player} — the fun way or the other way!'], who: 'RUE' },
    { battle: 'duo2_vermilion' },
    { choice: { npc: ['rue', 'cole'], who: 'COLE', prompt: 'The duo is down, dripping, and tangled in a tablecloth. You —', options: [
      { label: 'Help them up', delta: 2, say: ['...You are helping us? We literally just tried to steal your VOLTIK. In waiter costumes.', 'Rue. Rue, the kid is HELPING us. I do not know what to do with that. File it under — under DECENT, I guess.'] },
      { label: 'Leave them dripping', delta: -1, say: ['Yeah. Yeah, that is fair. That is — ow — that is extremely fair, actually.'] },
    ] } },
    { say: ['Beaten... on a boat... in front of the soup course...'], who: 'RUE' },
    { say: ['Retreat! Service exit!'], who: 'COLE' },
    { say: ['There IS no service exit, it is a boat—'], who: 'RUE' },
    { say: ['THEN WE SWIM WITH DIGNITY.'], who: 'COLE' },
    { say: ['Some hours later, the horn sounds. The St. Anne weighs anchor and slides toward the horizon — and just like that, she is gone for good. Whatever she was carrying, she took it with her.'], who: 'NARRATOR' },
    { warp: { map: 'vermilion', x: 9, y: 10 } },
    { flag: 'stanne_done' },
    { questDone: 'q_stanne' },
  ],

  // -- Canopy: behind the poster -------------------------------------------
  ev_hideout_entry: [
    { say: ['Behind the poster: a switch, worn smooth by use. You press it.'], who: 'NARRATOR' },
    { say: ['A staircase breathes cold air up from below. Down here, the Game Corner’s cheerful music stops — and what replaces it is worse. Quiet people. Red letters. Doors that lock behind you.'], who: 'NARRATOR' },
    { flag: 'hideout_found' },
    { quest: 'q_scope' },
  ],

  // -- Game Corner hideout: the boss, by speaker ----------------------------
  ev_scope_boss: [
    { say: ['A voice crackles out of a ceiling speaker — calm, amused, and nowhere near this room in person.'], who: 'NARRATOR' },
    { say: ['So. You are the little storm rattling my Game Corner.', 'Every coin in every slot upstairs paid for this operation, child. And the one thing I keep down here, you have come to steal. I almost admire the efficiency.'], who: 'THE BOSS (speaker)' },
    { say: ['The Vantage Scope is in the keeping of my best administrator. Take it from him — if your Kin have the stomach for it.'], who: 'THE BOSS (speaker)' },
    { battle: 'rocket_admin_hideout' },
    { say: ['...Impressive. ANNOYING, but impressive. The Scope is yours.', 'A word of advice, free of charge: stop digging. The tower in Hushmoor Town has nothing you want to see clearly.'], who: 'THE BOSS (speaker)' },
    { give: { items: { silphscope: 1 }, text: 'Vantage Scope' } },
    { flag: 'scope_done' },
    { questDone: 'q_scope' },
    { toast: 'Got the Vantage Scope!' },
  ],

  // -- Hushmoor Tower: the ghost --------------------------------------------
  ev_tower_ghost: [
    { say: ['The air on this floor tastes of old incense. Something drifts between the headstones — a shape your eyes keep sliding off, like a word you almost remember.'], who: 'NARRATOR' },
    { say: ['You raise the Vantage Scope. The blur resolves: tall, weary, scarred — standing guard over one small grave.'], who: 'NARRATOR' },
    { say: ['It is not attacking. It is waiting. Guarding. The way a mother stands in a doorway during a storm.'], who: 'NARRATOR' },
    { wildBattle: { species: 'marowak', level: 30, uncatchable: true } },
    { say: ['The shape shudders — and softens. Below, small and skull-helmeted, a little face peers around a headstone... and the spirit finally, finally turns toward it.'], who: 'NARRATOR' },
    { say: ['She was never haunting this tower. She was refusing to leave it. Now, at last, she can. Rest well, guardian.'], who: 'NARRATOR' },
    { flag: 'ghost_rested' },
    { toast: 'The tower feels lighter.' },
  ],

  // -- Hushmoor Tower top: Mr. Fuji ------------------------------------------
  ev_fuji: [
    { say: ['Hold it right there, old-timer! The boss wants this tower QUIET, and you are the loudest thing in it!'], who: 'RUE' },
    { say: ['Rue. He has not said a word. He is meditating. This is rude of us, honestly.'], who: 'COLE' },
    { say: ['And YOU — {player}?! How do you keep finding the exact staircase we are standing on?!'], who: 'RUE' },
    { say: ['Plan B, Cole!'], who: 'RUE' },
    { say: ['We don’t HAVE a Plan B!'], who: 'COLE' },
    { say: ['Then for once in our lives, we improvise. Quietly. RUN.'], who: 'RUE' },
    { choice: { npc: ['rue', 'cole'], who: '', prompt: 'Their footsteps echo down the tower stairs. You —', options: [
      { label: 'Call after them: "You do not have to run!"', delta: 1, say: ['The footsteps stop. Just for a second. Somewhere below, a voice — Cole\'s — says, very quietly: "Huh." Then the running resumes, a little slower.'] },
      { label: 'Let them run', delta: 0, say: ['The tower swallows the sound of them, the way it swallows everything.'] },
    ] } },
    { say: ['Ah... thank you, young one. They wanted this tower emptied, so that no one would ask what was taken from it. Greed makes such loud ghosts.'], who: 'MR. FUJI' },
    { say: ['You climbed all this way for the lost one below, not for glory. I saw her light rise, you know. First time in years this tower has felt like a beginning instead of an ending.'], who: 'MR. FUJI' },
    { say: ['Take my flute. Its song is older than the tower — sleeping things hear it the way children hear a parent calling them home. Use it kindly.'], who: 'MR. FUJI' },
    { give: { items: { pokeflute: 1 }, text: 'Kin Flute' } },
    { flag: 'flute_got' },
    { questDone: 'q_flute' },
  ],

  // -- The two SOMNIBEAR (engine pre-checks pokeflute in bag) ------------------
  ev_snorlax_east: [
    { say: ['The path simply... ends. In fur. A mountain that breathes — in, out, in, out — directly on top of Route 12.'], who: 'NARRATOR' },
    { say: ['You raise the Kin Flute. The first notes wobble across the water. The mountain does not approve of being woken. Or of your technique.'], who: 'NARRATOR' },
    { wildBattle: { species: 'snorlax', level: 30 } },
    { flag: 'snorlax_east' },
    { flag: 'snorlax_done' },
    { questDone: 'q_snorlax' },
    { toast: 'The way south is open!' },
  ],

  ev_snorlax_west: [
    { say: ['At the top of Cycling Road’s slope, the hill itself is asleep. Legs that way, belly this way, entire road: occupied.'], who: 'NARRATOR' },
    { say: ['The flute’s tune rolls downhill ahead of you — and the hill sits up, deeply offended, looking for the musician.'], who: 'NARRATOR' },
    { wildBattle: { species: 'snorlax', level: 30 } },
    { flag: 'snorlax_west' },
    { flag: 'snorlax_done' },
    { questDone: 'q_snorlax' },
    { toast: 'Cycling Road is clear!' },
  ],

  // -- Vantage Co.: Gary, mid-tower ---------------------------------------------
  ev_silph_rival: [
    { say: ['{player}?! What are YOU doing on the eighth floor of a hostage situation?'], who: 'GARY' },
    { say: ['Do not give me that look. I smelled something rotten in Farsight and followed it up the elevator. Say what you want about me — even I do not let uniforms in matching shirts bully a whole company.'], who: 'GARY' },
    { say: ['And before you ask: yes, PRISMKIT is still PRISMKIT. Still saving it. When it changes, it will be because WE decided. Nobody else.'], who: 'GARY' },
    { choice: { npc: 'gary', who: 'GARY', prompt: 'He is grinning like this is a game. It is not a game. You —', options: [
      { label: 'Admit you followed the same smell', delta: 1, say: ['HA! Knew it. Two noses, one rotten building. That is us all over, {player} — everyone else smells flowers, we smell a fight.'] },
      { label: 'Tell him to stay out of your way', delta: -1, say: ['...Wow. Okay. Message received, hero. Do not come crying to the elevator when the top floor eats you.'] },
    ] } },
    { say: ['Race you to the top floor. Loser buys the lemonade and the winner gets eternal bragging rights.'], who: 'GARY' },
    { battle: 'gary_silph' },
    { say: ['Hah... okay. OKAY. You take the president’s floor. I will hold this elevator so this lot cannot regroup. Go be a hero, {player}.'], who: 'GARY' },
    { flag: 'silph_rival_done' },
  ],

  // -- Vantage Co.: the boss, almost in person -----------------------------------
  ev_silph_boss: [
    { say: ['You again. The child from beneath the Game Corner. My employer sends his regards — he would deliver them himself, but you are not worth his calendar.'], who: 'ROCKET ADMIN' },
    { battle: 'rocket_admin_silph' },
    { say: ['A phone rings on the president’s desk. The Admin goes the color of old milk and holds the receiver out like it might bite.'], who: 'NARRATOR' },
    { say: ['...So. The little trainer from Dawnwick, standing in my building, holding my company.', 'You have spirit. Spirit is a resource, and I collect resources. Remember this voice, child. When we meet properly, I will be considerably less charming.'], who: 'GIOVANNI (phone)' },
    { say: ['The line goes dead. For a moment, nobody in the room breathes.'], who: 'NARRATOR' },
    { say: ['Young trainer... you have saved Vantage Co. Words are cheap; prototypes are not. This is our one-of-one. It has never failed, not once, not for anyone. Use it on something that matters.'], who: 'VANTAGE PRESIDENT' },
    { give: { items: { masterball: 1 }, text: 'Master Orb' } },
    { flag: 'silph_done' },
    { questDone: 'q_silph' },
    { heal: true },
    { toast: 'Vantage Co. is free!' },
  ],

  // -- The three birds: trial flavor, then the battle -------------------------
  ev_zapdos: [
    { arc: 'arc_zapdos', stage: 'discovered' },
    { say: ['CARVED INTO THE PLANT’S WALL, HALF MELTED BY HEAT: "IT CAME DOWN WITH THE STORM AND NEVER LEFT. THE GENERATORS HUM ITS NAME."'], who: 'INSCRIPTION' },
    { say: ['Every hair on your arms stands on end. The air tastes of pennies and thunder. Something vast is nesting in the dark between the turbines.'], who: 'NARRATOR' },
    { arc: 'arc_zapdos', stage: 'active' },
    { wildBattle: { species: 'zapdos', level: 50, legendary: true } },
    { arc: 'arc_zapdos', stage: 'complete' },
    { toast: 'The storm settles.' },
  ],

  ev_moltres: [
    { arc: 'arc_moltres', stage: 'discovered' },
    { say: ['SCORCHED INTO THE CAVERN WALL: "IT CARRIES THE LAST EMBER OF THE FIRST FIRE. DO NOT ASK IT TO GO OUT."'], who: 'INSCRIPTION' },
    { say: ['Heat breathes out of the cracks ahead in slow waves, and the shadows thrown on the wall have wings. Far too many wings.'], who: 'NARRATOR' },
    { arc: 'arc_moltres', stage: 'active' },
    { wildBattle: { species: 'moltres', level: 50, legendary: true } },
    { arc: 'arc_moltres', stage: 'complete' },
    { toast: 'The ember dims to a glow.' },
  ],

  ev_articuno: [
    { arc: 'arc_articuno', stage: 'discovered' },
    { say: ['FROST ETCHED ACROSS A FROZEN PLATE: "IT SLEEPS WHERE THE SEA FORGOT HOW TO MOVE. WAKE IT GENTLY — OR NOT AT ALL."'], who: 'INSCRIPTION' },
    { say: ['Your breath fogs in the still air. Somewhere deep in the ice, something exhales winter itself — slow, and unbothered by centuries.'], who: 'NARRATOR' },
    { arc: 'arc_articuno', stage: 'active' },
    { wildBattle: { species: 'articuno', level: 50, legendary: true } },
    { arc: 'arc_articuno', stage: 'complete' },
    { toast: 'The ice sighs and settles.' },
  ],

  // -- The First Movie: Exile Isle (post-Earth Badge) --------------------------
  ev_movie_arrive: [
    { say: ['It arrives at dawn, out of a sky that was not stormy a minute ago — a WYRMARCH riding the wind like it owns the lease, a sealed envelope in one claw.'], who: 'NARRATOR' },
    { say: ['Heavy paper. A wax seal. No return address. Inside, one line of elegant script: "The strongest trainer in the region is requested. Come." — and a set of coordinates.'], who: 'NARRATOR' },
    { say: ['Your partner is already staring at the horizon like it made a promise out there. Fair enough. You have never once said no to the sky.'], who: 'NARRATOR' },
    { quest: 'q_movie' },
    { warp: { map: 'newisland', x: 8, y: 14 } },
    { say: ['Exile Isle: a castle that looks grown rather than built, cliffs like broken teeth, and a harbor master who bows far too deeply for a ferry stop.'], who: 'NARRATOR' },
    { say: ['Inside: long tables, a hall full of trainers every bit as bewildered as you — and outside, a storm building like the sea is holding its breath.'], who: 'NARRATOR' },
    { flag: 'movie_arrived' },
  ],

  ev_movie_climax: [
    { say: ['The host never shows a face. A figure in full armor takes the balcony, and its voice comes from everywhere the hall has speakers.'], who: 'NARRATOR' },
    { say: ['You were gathered to be measured. Most of what you call strength is inheritance and luck. I intend to find what is real.'], who: 'THE ARMORED ONE' },
    { say: ['Outside, the storm finds its voice all at once. Below the cliffs something enormous turns in the water — older than the castle, and angry at being woken for a party trick.'], who: 'NARRATOR' },
    { say: ['A serving hatch BURSTS open. Two very damp "waiters" tumble out, trailing seaweed and one (1) stolen tray of hors d’oeuvres.'], who: 'NARRATOR' },
    { say: ['Nobody move! This fortress of evil is now under the jurisdiction of— uh...'], who: 'RUE' },
    { say: ['Rue. Rue, read the room. We are surrounded by legend-class Kin and a man in a machine. Read. The. Room.'], who: 'COLE' },
    { say: ['...We will be over here. Quietly. Stealing NOTHING. For once, the show is bigger than the theft.'], who: 'RUE' },
    { choice: { npc: ['rue', 'cole'], who: 'COLE', prompt: 'Across the hall, the duo watches you face the storm. You —', options: [
      { label: 'Nod to them. Partners, this once.', delta: 1, say: ['Rue nods back, slow and solemn, like a general at a treaty signing. Cole is already crying a little. "We are part of history," he whispers. "Terrible, damp history."'] },
      { label: 'Face the storm alone', delta: 0, say: ['Some moments are not for sharing. The duo seems to understand — they step back, and give you the whole stage.'] },
    ] } },
    { say: ['And then — through the rain, small as a soap bubble and twice as unbothered — something pink drifts down and lands on the railing.'], who: 'NARRATOR' },
    { say: ['It looks at the storm. It looks at the armor. It looks at you. It is not afraid of any of it. It wants to PLAY.'], who: 'NARRATOR' },
    { wildBattle: { species: 'mew', level: 50, legendary: true } },
    { say: ['As quickly as it rose, the storm spends itself. Sunlight comes back like an apology. The armored figure is gone — leaving only questions, and one small pink blessing on the wind.'], who: 'NARRATOR' },
    { arc: 'arc_mew', stage: 'complete' },
    { flag: 'movie_done' },
    { questDone: 'q_movie' },
    { warp: { map: 'pallet', x: 9, y: 10 } },
    { toast: 'The storm clears over Exile Isle.' },
  ],

  // -- Route 22: the last taunt ------------------------------------------------
  ev_rival_route22: [
    { say: ['Knew I would find you here, {player}. Route 22 — where big talk goes to get measured.'], who: 'GARY' },
    { say: ['The League gate is just ahead, and I am NOT letting you walk through it first. Everything since Dawnwick comes down to who is still standing after this.'], who: 'GARY' },
    { say: ['And before you ask — yes, PRISMKIT is still PRISMKIT. I am saving its evolution for the League itself. When the whole region is watching. It deserves an entrance.'], who: 'GARY' },
    { choice: { npc: 'gary', who: 'GARY', prompt: 'The League gate glitters at the top of the road. You —', options: [
      { label: 'Wish him luck — and mean it', delta: 1, say: ['...Luck. HAH. I do not need— ...yeah. Yeah, okay. You too, {player}. Mean it back. Do not waste it.'] },
      { label: 'Promise to end his run here', delta: -1, say: ['Big words. You have been promising that since Dawnwick, and somehow we are BOTH still standing. Make it count this time.'] },
    ] } },
    { battle: 'gary_r22_final' },
    { say: ['Tch! Fine — warm-up over anyway. First one to the top of the Plateau wins everything. Do not be late, {player}.'], who: 'GARY' },
    { flag: 'rival_route22_done' },
  ],

  // -- Fernmere Gym: locked ------------------------------------------------------
  ev_viridian_gym_locked: [
    { say: ['The gym is locked. A brass plaque, recently polished: "THE LEADER TRAVELS. CHALLENGERS: RETURN WITH SEVEN BADGES."'], who: 'NARRATOR' },
    { say: ['Through the frosted glass: nothing. No lights, no movement. Whoever leads this gym, the whole region seems strangely happy not to talk about them.'], who: 'NARRATOR' },
  ],

  // -- Caldera Mansion: the Secret Key -------------------------------------------
  ev_mansion_key: [
    { say: ['Under a collapsed shelf, something glints — a heavy key, stamped with a flame.'], who: 'NARRATOR' },
    { say: ['The journal beside it is mostly ash. One page survives: careful notes about "the subject in the tank" — and a warning, underlined twice. "It dreams. It dreams."'], who: 'NARRATOR' },
    { arc: 'arc_mewtwo', stage: 'discovered' },
    { flag: 'mewtwo_journal' },
    { give: { items: { secretkey: 1 }, text: 'Secret Key' } },
    { flag: 'mansion_key' },
    { questDone: 'q_mansion' },
  ],

  // -- The League gate ------------------------------------------------------------
  ev_league_gate: [
    { say: ['Hold, trainer. Route 23 is not a road. It is a verdict. Eight badges — let us see them.'], who: 'LEAGUE GUARD' },
    { say: ['...Boulder. Cascade. Thunder. Rainbow. Soul. Marsh. Volcano. Earth. All eight — and every one earned. I can tell by the wear on them.'], who: 'LEAGUE GUARD' },
    { say: ['The Plateau is that way, {player}. Whatever happens up there, you already did the hardest part. You kept walking.'], who: 'LEAGUE GUARD' },
    { flag: 'league_gate_passed' },
    { questDone: 'q_league' },
  ],

  // The same checkpoint, below eight badges: the guard counts, refuses,
  // and walks the player back east of the gate (warp step, same map).
  ev_league_gate_deny: [
    { say: ['Hold, trainer. Route 23 is not a road. It is a verdict. Eight badges — let us see them.'], who: 'LEAGUE GUARD' },
    { say: ['I count what is there, {player}, and what is there is short of eight. The mountain does not grade on effort, and neither do I.'], who: 'LEAGUE GUARD' },
    { say: ['Boulder, Cascade, Thunder, Rainbow, Soul, Marsh, Volcano, Earth — earn the ones you are missing, and this gate opens like it was built for you. Step back now.'], who: 'LEAGUE GUARD' },
    { warp: { map: 'route22', x: 6, y: 5 } },
  ],

  // -- The Elite Four ---------------------------------------------------------------
  ev_e4_1: [
    { say: ['Welcome to the cold end of the road, {player}. I am Lorelei. Everything you love about summer ends at my door.'], who: 'LORELEI' },
    { battle: 'lorelei' },
  ],

  ev_e4_2: [
    { say: ['Bruno. My team and I train where the mountains argue back. Show me your strength — all of it. Nothing held back!'], who: 'BRUNO' },
    { battle: 'bruno' },
  ],

  ev_e4_3: [
    { say: ['Oh ho. A living child, come to visit old Agatha. I knew a boy like you once — all heart, no patience. He grew up to be a professor. Let us see what YOU grow into.'], who: 'AGATHA' },
    { battle: 'agatha' },
  ],

  ev_e4_4: [
    { say: ['Lance. I have watched your whole road from the sky, {player}. Dragons are not strong because they are born strong — they are strong because they endure. Endure me.'], who: 'LANCE' },
    { battle: 'lance' },
  ],

  // -- Champion: the reveal ----------------------------------------------------------
  ev_champion: [
    { say: ['...You actually did it. Four of them. In a row. I had a whole speech for this moment and I have forgotten every word of it.'], who: 'GARY' },
    { say: ['Fine. No speech. Just this: I saved my partner’s evolution for the biggest stage there is. No more waiting. It is time — OUR time.'], who: 'GARY' },
    { say: ['Whatever stands across from you now, {player} — that is us, finished deciding. Come and take the crown. If you can.'], who: 'GARY' },
    { choice: { npc: 'gary', who: 'GARY', prompt: 'The crown, the crowd, the whole road behind you both. You —', options: [
      { label: 'Tell him: "Wouldn\'t be here without you."', delta: 1, say: ['...Do NOT get sentimental on me before the biggest battle of our lives, {player}. ...Save it for after. When I have won. Obviously.'] },
      { label: 'Say nothing. Battle says it.', delta: 0, say: ['...Yeah. Yeah, that is the most {player} thing you have ever not said. Come on, then.'] },
    ] } },
    { battle: 'gary_champion' },
    { say: ['...Yeah. Yeah, okay. It had to be you, did it not. Champion. Ha! Say it back to me when we are old, {player}. I will still be one win behind, and twice as loud about it.'], who: 'GARY' },
    { sayVar: { npc: 'gary', scene: 'championAfter', who: 'GARY' } },
    { flag: 'champion' },
    { questDone: 'q_champion' },
    { ending: true },
  ],

  // -- Post-game: Tidehaven Cave ---------------------------------------------------------
  ev_mewtwo: [
    { say: ['Tidehaven Cave. The water runs strange here, the stones hum, and every wild thing inside is strong enough to have opinions about you.'], who: 'NARRATOR' },
    { say: ['At the heart of it: a stillness shaped like a person who never asked to exist. The journals were right. It dreams — and it has been dreaming of the day someone strong enough arrived.'], who: 'NARRATOR' },
    { say: ['So. You are the one the world made me to meet. Show me why.'], who: 'OMNIGEN' },
    { arc: 'arc_mewtwo', stage: 'active' },
    { wildBattle: { species: 'mewtwo', level: 70, legendary: true } },
    { arc: 'arc_mewtwo', stage: 'complete' },
    { flag: 'mewtwo_done' },
    { questDone: 'q_mewtwo' },
    { toast: 'The cave falls silent.' },
  ],

  // -- Starter gifts (anime beats, condensed) ----------------------------------------------
  ev_bulbasaur_gift: [
    { say: ['Oh! Careful where you step, dear — the seedlings are sleeping. I keep this garden as a haven, for Kin who needed somewhere quiet to land.'], who: 'CARETAKER' },
    { say: ['That BUDDIN has watched you since the gate. It is shy with people... WAS shy with people. It just planted itself squarely in your path — which, for that one, is a whole speech.'], who: 'CARETAKER' },
    { say: ['It wants to see the world that made you kind enough to stop for a garden. Will you take it with you? Treat it gently — it bruises like fruit and forgives like family.'], who: 'CARETAKER' },
    { giveMon: { species: 'bulbasaur', level: 10 } },
    { flag: 'bulbasaur_joined' },
    { toast: 'BUDDIN joined your team!' },
  ],

  ev_charmander: [
    { say: ['Rain, coming down in sheets — and on that flat rock, the smallest fire you have ever seen, fighting the whole sky to stay lit.'], who: 'NARRATOR' },
    { say: ['A EMBRY. Alone. Its tail flame gutters with every gust, and it keeps looking up the road — still waiting for someone who is not coming back.'], who: 'NARRATOR' },
    { say: ['You kneel in the mud and hold your jacket over the flame. It looks at you for a long moment... then steps under the shelter. And stays.'], who: 'NARRATOR' },
    { giveMon: { species: 'charmander', level: 10 } },
    { flag: 'charmander_joined' },
    { say: ['Someday, its old trainer may learn what he threw away — word travels, and Arcport talks. By then it will not matter. This one has a real partner now.'], who: 'NARRATOR' },
    { toast: 'EMBRY joined your team!' },
  ],

  ev_squirtle_squad: [
    { say: ['Trainer! Thank goodness. Officer, Arcport docks. Something keeps pranking my patrols — cones on the lighthouse, my hat in the harbor, sunglasses on every statue in the plaza. SUNGLASSES, trainer.'], who: 'OFFICER' },
    { say: ['THERE. By the crates. Five shapes, zero remorse, excellent eyewear. That is the squad. Go on then — catch the ringleader. Diplomatically.'], who: 'OFFICER' },
    { say: ['The leader steps out, shades down, arms crossed. It sizes up your partner with a long, professional look... then grins, and bumps your partner’s fist.'], who: 'NARRATOR' },
    { say: ['That is a BUBLET Squad salute. It has seen a hundred trainers bluff. Yours did not. The leader wants in — pranks henceforth purely recreational, and mostly aimed at your rivals.'], who: 'NARRATOR' },
    { giveMon: { species: 'squirtle', level: 10 } },
    { flag: 'squirtle_joined' },
    { toast: 'The BUBLET Squad leader joined!' },
  ],

  // -- Arcport coast: the migration send-off (engine gates on owning a butterfree) --
  ev_butterfree: [
    { say: ['The coast at Arcport is full of wings today — hundreds of PRISMWING rising on the sea wind, beginning the long flight to their breeding grounds.'], who: 'NARRATOR' },
    { say: ['Your PRISMWING is watching them. So is another — one it met on this very shore, whose wing pattern it has been quietly dreamy about for days.'], who: 'NARRATOR' },
    { say: ['This is the part of the journey nobody warns you about. Loving something sometimes means opening your hands.'], who: 'NARRATOR' },
    { say: ['Your PRISMWING looks back once — one long look, full of every battle and every berry — then lifts into the gold of the sky. Two wings become four, become a hundred, become gone.'], who: 'NARRATOR' },
    { say: ['Its page in your dex does not close. From today, it is marked CHERISHED. Some Kin you keep. This one, you carry.'], who: 'NARRATOR' },
    { flag: 'butterfree_released' },
    { toast: 'PRISMWING flew to its future.' },
  ],

  // -- Canopy City: the parley pair ARRIVE (Wave ACT proof) ---------------
  // RUE and COLE used to simply BE standing in the plaza whenever the
  // post-St. Anne window was open (a load-time append). Now the
  // loadMap resolver stages them hidden and this entry event walks
  // them in out of the Game Corner they serve: west door for RUE,
  // east door for COLE, south around the planters to their posts at
  // (8,8) / (9,8). Fired once by sysLoadMap (its done flag is the
  // gate); resolving the parley walks them back the same way.
  ev_parley_enter: [
    { say: ['The Game Corner doors spill light across the plaza — and two figures cross to the corner post, unhurried, like they hold the lease on it.'], who: 'NARRATOR' },
    { say: ['RUE and COLE. The parley, in person. They are waiting on YOU.'], who: 'NARRATOR' },
    { actorEnter: { who: 'rue@celadon', x: 12, y: 7, path: [[12, 8], [12, 9], [11, 9], [10, 9], [9, 9], [8, 9], [8, 8]], face: 'down' } },
    { actorEnter: { who: 'cole@celadon', x: 13, y: 7, path: [[13, 8], [13, 9], [12, 9], [11, 9], [10, 9], [9, 9], [9, 8]], face: 'down' } },
  ],
};

// The PRISMWING send-off, exported standalone for the overworld trigger.
export const PRISMWING_EVENT = EVENTS.ev_butterfree;

// The professor’s verdict on a certain herd. (Engine: shown when the player
// has caught 5+ tauros.)
export const BOVARCH_LINE = 'Five BOVARCH. FIVE. {player}, the ranch hand has started billing me for their catering. Wonderful Kin. Terrifying grocery bill.';

// ---------------------------------------------------------------------------
// LEGENDARY_ARCS — every legendary/mythical gets a side arc with quest-log
// requirements. Arden arcs are full designs wired to EVENTS above. Future
// region arcs are pattern-locked stubs (designedOnly: true) — real hooks and
// requirement lines, no playable claims until their act ships.
// ---------------------------------------------------------------------------

export const LEGENDARY_ARCS = {

  // ---- Arden (full) -------------------------------------------------------
  arc_zapdos: {
    id: 'arc_zapdos', title: 'The Storm That Stayed', species: 'zapdos',
    hook: 'An abandoned power plant east of Tidehaven hums with a storm that never moves on.',
    steps: [
      { text: 'Read the melted inscription at the Coilworks', flag: 'arc_zapdos_found' },
      { text: 'Reach the nest between the turbines', flag: 'arc_zapdos_nest' },
      { text: 'Face FULMINIS, level 50', catch: 'zapdos' },
    ],
    lair: 'powerplant',
  },
  arc_moltres: {
    id: 'arc_moltres', title: 'The Last Ember', species: 'moltres',
    hook: 'Deep inside Crown Road, the caverns breathe heat in slow, winged waves.',
    steps: [
      { text: 'Read the scorched inscription on Crown Road', flag: 'arc_moltres_found' },
      { text: 'Reach the ember chamber', flag: 'arc_moltres_chamber' },
      { text: 'Face PYREHAWK, level 50', catch: 'moltres' },
    ],
    lair: 'victoryroad',
  },
  arc_articuno: {
    id: 'arc_articuno', title: 'Where the Sea Forgot to Move', species: 'articuno',
    hook: 'Sailors out of Bramble swear the Rime currents stop dead around one frozen island.',
    steps: [
      { text: 'Cross the frozen currents of the Rime Islands', flag: 'arc_articuno_found' },
      { text: 'Read the frost-etched plate', flag: 'arc_articuno_plate' },
      { text: 'Face GLACIERNE, level 50', catch: 'articuno' },
    ],
    lair: 'seafoamislands',
  },
  arc_mewtwo: {
    id: 'arc_mewtwo', title: 'The Dreaming Subject', species: 'mewtwo',
    prereq: 'champion',
    hook: 'A burned journal page in the Caldera Mansion describes a subject that dreams — and the professor’s warning stands: some doors only open for a Champion.',
    steps: [
      { text: 'Find the surviving journal page in the Caldera Mansion', flag: 'mewtwo_journal' },
      { text: 'Become Champion of the Crown League', flag: 'champion' },
      { text: 'Enter Tidehaven Cave, north of Tidehaven City', flag: 'mewtwo_cave' },
      { text: 'Face OMNIGEN at the cave’s heart', climax: { species: 'mewtwo', level: 70, legendary: true } },
    ],
    lair: 'ceruleancave',
  },
  arc_mew: {
    id: 'arc_mew', title: 'The Blessing in the Rain', species: 'mew',
    hook: 'A sealed invitation, delivered by WYRMARCH on a storm wind, names you the guest of honor on Exile Isle.',
    steps: [
      { text: 'Win the Earth Badge', flag: 'badge_earth' },
      { text: 'Answer the invitation and cross to Exile Isle', flag: 'movie_arrived' },
      { text: 'Weather the storm and the Armored One’s test', flag: 'movie_done' },
      { text: 'Accept PRIMARA’s invitation to play', catch: 'mew' },
    ],
    lair: 'newisland',
  },

  // ---- Yamato (designed) -----------------------------------------------------
  // Stage J5: arc_hooh is LIVE (the designed entry, activated in
  // place). Two designed facts are superseded and recorded in the
  // register: the encounter level 70 predates the arc bands (ruling
  // 3) — the live face is Lv 182, inside Yamato's band; and the lair
  // id 'tintower' never existed as a map — the shipped tower is the
  // Chime Tower ('bell-tower': bell-tower-1 / bell-tower-2, the
  // summit where the face fires).
  arc_hooh: {
    id: 'arc_hooh', title: 'The Rainbow Over the Ashes', species: 'hooh', region: 'Yamato',
    hook: 'A tower in Lantern burned a hundred and fifty years ago — and something has circled its replacement ever since, waiting for a trainer with a pure heart.',
    steps: [
      { text: 'Hear the tower’s history from Lantern’s elders', flag: 'hooh_history' },
      { text: 'Receive the Clear Bell from the Kimono sisters', flag: 'hooh_bell_received' },
      { text: 'Climb the Chime Tower at dawn', flag: 'hooh_summit' },
      { text: 'Face IRISAVIS, level 182', catch: 'hooh' },
    ],
    lair: 'bell-tower',
  },
  arc_lugia: {
    id: 'arc_lugia', title: 'The Song Under the Whirlpools', species: 'lugia', region: 'Yamato', designedOnly: true,
    prereq: { arcs: ['arc_zapdos', 'arc_moltres', 'arc_articuno'] },
    hook: 'When the three birds of Arden are gathered, an old melody surfaces — the sea guardian only answers those who have met its storms.',
    steps: [
      { text: 'Catch FULMINIS, PYREHAWK, and GLACIERNE', flag: 'birds_caught' },
      { text: 'Receive the Silver Wing at the Maelstrom Islands' },
      { text: 'Descend to the deepest waterfall chamber' },
      { text: 'Face ABYSSORN, level 70', catch: 'lugia' },
    ],
    lair: 'whirlislands',
  },
  arc_celebi: {
    id: 'arc_celebi', title: 'The Voice of the Forest', species: 'celebi', region: 'Yamato', designedOnly: true,
    hook: 'Holly Forest has a shrine older than the road through it, and the charcoal maker swears the trees sometimes repeat your words back — forty years younger.',
    steps: [
      { text: 'Return the lost GALEDUCK to the charcoal maker' },
      { text: 'Receive the GS Orb from a grateful craftsman' },
      { text: 'Place the GS Orb at the forest shrine' },
      { text: 'Meet CHRONOFAE where the forest remembers', catch: 'celebi' },
    ],
    lair: 'ilexforest',
  },

  // ---- Maris (designed) ------------------------------------------------------
  arc_regirock: {
    id: 'arc_regirock', title: 'The Tomb in the Sand', species: 'regirock', region: 'Maris', designedOnly: true,
    hook: 'Braille in a sealed chamber off Route 111 names three tombs across Maris. The desert one is only the first lock.',
    steps: [
      { text: 'Read the braille in the Sealed Chamber' },
      { text: 'Open the Desert Tomb' },
      { text: 'Face PETRAGOLEM, level 40', catch: 'regirock' },
    ],
    lair: 'deserttomb',
  },
  arc_regice: {
    id: 'arc_regice', title: 'The Tomb in the Ice', species: 'regice', region: 'Maris', designedOnly: true,
    hook: 'North of Mistford, an island cave exhales air colder than the sea around it — and its door reads like a riddle about patience.',
    steps: [
      { text: 'Read the braille in the Sealed Chamber' },
      { text: 'Open the Sea Tomb and wait, perfectly still' },
      { text: 'Face CRYOGOLEM, level 40', catch: 'regice' },
    ],
    lair: 'islandcave',
  },
  arc_registeel: {
    id: 'arc_registeel', title: 'The Tomb in the Ruin', species: 'registeel', region: 'Maris', designedOnly: true,
    hook: 'The Iron Tomb west of Lotus Cove predates every map of Maris. Its door opens from the center of the room — and nowhere else.',
    steps: [
      { text: 'Read the braille in the Sealed Chamber' },
      { text: 'Open the Iron Tomb' },
      { text: 'Face SIDEROGOLEM, level 40', catch: 'registeel' },
    ],
    lair: 'ancienttomb',
  },
  arc_kyogre: {
    id: 'arc_kyogre', title: 'The Sea That Wants Everything', species: 'kyogre', region: 'Maris', designedOnly: true,
    hook: 'The rain over Craterlake is not weather anymore. It has intent.',
    steps: [
      { text: 'Wake ABYSSORCA’s trail at the Weather Institute' },
      { text: 'Descend into the Worldroot Cave' },
      { text: 'Face ABYSSORCA, level 70', catch: 'kyogre' },
    ],
    lair: 'caveoforigin',
  },
  arc_groudon: {
    id: 'arc_groudon', title: 'The Land That Wants Everything', species: 'groudon', region: 'Maris', designedOnly: true,
    hook: 'The drought over Craterlake is not weather anymore. It has a heartbeat, and it is under the mountain.',
    steps: [
      { text: 'Follow the Magma trail into Mt. Smokestack' },
      { text: 'Descend into the Worldroot Cave' },
      { text: 'Face TERRATITAN, level 70', catch: 'groudon' },
    ],
    lair: 'caveoforigin',
  },
  arc_rayquaza: {
    id: 'arc_rayquaza', title: 'The Sky Settles It', species: 'rayquaza', region: 'Maris', designedOnly: true,
    prereq: { arcs: ['arc_kyogre', 'arc_groudon'] },
    hook: 'When sea and land finally collide, the oldest voice in Maris’s sky is the only one both of them obey.',
    steps: [
      { text: 'Settle ABYSSORCA and TERRATITAN’s arcs', flag: 'weather_duo_done' },
      { text: 'Climb the Tempest Tower, floor by crumbling floor' },
      { text: 'Face STRATOWYRM, level 70', catch: 'rayquaza' },
    ],
    lair: 'skypillar',
  },
  arc_latios: {
    id: 'arc_latios', title: 'The Jet Over the Water', species: 'latios', region: 'Maris', designedOnly: true,
    hook: 'Fishermen keep reporting the same impossible thing: a blue jet-shaped shadow that outruns their boats and laughs like a boy.',
    steps: [
      { text: 'Hear the fishermen’s reports in Lotus Cove' },
      { text: 'Track the sightings across Maris’s sea routes' },
      { text: 'Meet AZURAVIS at full speed', catch: 'latios' },
    ],
    lair: 'hoennsearoutes',
  },
  arc_latias: {
    id: 'arc_latias', title: 'The Guardian of the Garden', species: 'latias', region: 'Maris', designedOnly: true,
    hook: 'Somewhere in Maris there is a garden that exists on no map, tended by something red, kind, and very fast.',
    steps: [
      { text: 'Earn the trust of the garden’s keeper' },
      { text: 'Follow the Eon trail to the hidden island' },
      { text: 'Meet RUBIAVIS in the secret garden', catch: 'latias' },
    ],
    lair: 'southernisland',
  },
  arc_jirachi: {
    id: 'arc_jirachi', title: 'The Thousand-Year Wish', species: 'jirachi', region: 'Maris', designedOnly: true,
    hook: 'A comet is coming, and a small voice has started singing in its sleep — it gets one week awake every thousand years.',
    steps: [
      { text: 'Reach the millennium comet’s festival grounds' },
      { text: 'Protect the sleeping star child on its journey' },
      { text: 'Make a wish worth waking for', catch: 'jirachi' },
    ],
    lair: 'forina',
  },
  arc_deoxys: {
    id: 'arc_deoxys', title: 'The Triangle That Moves', species: 'deoxys', region: 'Maris', designedOnly: true,
    hook: 'A meteorite on Birth Island sits in a perfect triangle of stones. The stones, researchers insist, were not arranged yesterday.',
    steps: [
      { text: 'Earn passage to Birth Island' },
      { text: 'Solve the triangle’s pattern without touching the meteorite' },
      { text: 'Face XENOGENE, level 70', catch: 'deoxys' },
    ],
    lair: 'birthisland',
  },

  // ---- Borea (designed) -------------------------------------------------------
  arc_regigigas: {
    id: 'arc_regigigas', title: 'The One Who Moved Continents', species: 'regigigas', region: 'Borea', designedOnly: true,
    prereq: { arcs: ['arc_regirock', 'arc_regice', 'arc_registeel'] },
    hook: 'Rimefall Temple’s lowest floor sleeps a giant that three smaller giants once served. It wakes only for their company.',
    steps: [
      { text: 'Bring PETRAGOLEM, CRYOGOLEM, and SIDEROGOLEM to the temple', flag: 'regi_trio_present' },
      { text: 'Descend to the temple’s lowest floor' },
      { text: 'Face COLOSSOR, level 70', catch: 'regigigas' },
    ],
    lair: 'snowpointtemple',
  },
  arc_uxie: {
    id: 'arc_uxie', title: 'The Lake That Knows', species: 'uxie', region: 'Borea', designedOnly: true,
    hook: 'Lake Insight is too still. Its guardian holds every memory of the region — and gives away none of them cheaply.',
    steps: [
      { text: 'Calm the crisis at the three great lakes', flag: 'lakes_calmed' },
      { text: 'Enter the cavern at Lake Insight’s heart' },
      { text: 'Face LORACLE, level 50', catch: 'uxie' },
    ],
    lair: 'lakeacuity',
  },
  arc_mesprit: {
    id: 'arc_mesprit', title: 'The Lake That Feels', species: 'mesprit', region: 'Borea', designedOnly: true,
    hook: 'Lake Candor’s guardian does not wait in its cavern. It runs — and it expects you to understand why that is the test.',
    steps: [
      { text: 'Calm the crisis at the three great lakes', flag: 'lakes_calmed' },
      { text: 'Touch the cavern at Lake Candor’s heart' },
      { text: 'Chase EMPATHIS across Borea', catch: 'mesprit' },
    ],
    lair: 'lakeverity',
  },
  arc_azelf: {
    id: 'arc_azelf', title: 'The Lake That Wills', species: 'azelf', region: 'Borea', designedOnly: true,
    hook: 'Lake Gallant took the worst of the crisis and its guardian took it personally. Willpower answers willpower.',
    steps: [
      { text: 'Calm the crisis at the three great lakes', flag: 'lakes_calmed' },
      { text: 'Enter the cavern at Lake Gallant’s heart' },
      { text: 'Face VOLITAR, level 50', catch: 'azelf' },
    ],
    lair: 'lakevalor',
  },
  arc_dialga: {
    id: 'arc_dialga', title: 'The Pillar of Time', species: 'dialga', region: 'Borea', designedOnly: true,
    prereq: { arcs: ['arc_uxie', 'arc_mesprit', 'arc_azelf'] },
    hook: 'Atop Mt. Apex, someone is trying to unmake the world with a chain the color of old blood. Time itself is watching.',
    steps: [
      { text: 'Gather the lake trio’s blessing', flag: 'lake_trio_blessing' },
      { text: 'Break the Red Chain’s ritual at the Zenith Spire' },
      { text: 'Face CHRONARCH, level 70', catch: 'dialga' },
    ],
    lair: 'spearpillar',
  },
  arc_palkia: {
    id: 'arc_palkia', title: 'The Pillar of Space', species: 'palkia', region: 'Borea', designedOnly: true,
    prereq: { arcs: ['arc_uxie', 'arc_mesprit', 'arc_azelf'] },
    hook: 'The sky over Mt. Apex is folding wrong, like a map being crumpled by an unseen hand.',
    steps: [
      { text: 'Gather the lake trio’s blessing', flag: 'lake_trio_blessing' },
      { text: 'Break the Red Chain’s ritual at the Zenith Spire' },
      { text: 'Face COSMARCH, level 70', catch: 'palkia' },
    ],
    lair: 'spearpillar',
  },
  arc_giratina: {
    id: 'arc_giratina', title: 'The World Behind the Waterfall', species: 'giratina', region: 'Borea', designedOnly: true,
    prereq: { arcs: ['arc_uxie', 'arc_mesprit', 'arc_azelf'] },
    hook: 'There is a fourth lake on no map, and a world on the other side of this one, where the banished one keeps the balance.',
    steps: [
      { text: 'Gather the lake trio’s blessing', flag: 'lake_trio_blessing' },
      { text: 'Enter the Mirrorworld through the torn sky' },
      { text: 'Face VOIDARCH, level 70', catch: 'giratina' },
    ],
    lair: 'distortionworld',
  },
  arc_darkrai: {
    id: 'arc_darkrai', title: 'The Nightmare at the Inn', species: 'darkrai', region: 'Borea', designedOnly: true,
    hook: 'A locked inn in Bridgeport has had one guest for fifty years. The harbor sailor’s boy has not woken in days.',
    steps: [
      { text: 'Help the sailor’s family in Bridgeport' },
      { text: 'Receive the Member Card in a dream you will not remember' },
      { text: 'Sail to Darkmoon Island' },
      { text: 'Face NOCTARCH, level 70', catch: 'darkrai' },
    ],
    lair: 'newmoonisland',
  },
  arc_cresselia: {
    id: 'arc_cresselia', title: 'The Feather of Good Dreams', species: 'cresselia', region: 'Borea', designedOnly: true,
    hook: 'For every nightmare there is an antidote, and she keeps hers on an island shaped like the moon’s other half.',
    steps: [
      { text: 'Take a Lunar Feather from Brightmoon Island' },
      { text: 'Heal the sailor’s boy in Bridgeport' },
      { text: 'Chase LUNACYGN’s crescent trail', catch: 'cresselia' },
    ],
    lair: 'fullmoonisland',
  },
  arc_shaymin: {
    id: 'arc_shaymin', title: 'The Gratitude Bloom', species: 'shaymin', region: 'Borea', designedOnly: true,
    hook: 'A white-stone road north of the League ends in a flower field that only blooms for a thankful heart.',
    steps: [
      { text: 'Receive Oak’s Letter' },
      { text: 'Walk the Foamline Path with gratitude in mind' },
      { text: 'Meet GRATHOG in the Petal Paradise', catch: 'shaymin' },
    ],
    lair: 'flowerparadise',
  },
  arc_heatran: {
    id: 'arc_heatran', title: 'The Mountain’s Furnace', species: 'heatran', region: 'Borea', designedOnly: true,
    hook: 'Grim Mountain breathes like a forge, and something has stolen the stone that keeps its temper in check.',
    steps: [
      { text: 'Climb Grim Mountain with a local guide' },
      { text: 'Recover the Magma Stone from the thieves' },
      { text: 'Return the stone — and face MAGMARCH, level 70', catch: 'heatran' },
    ],
    lair: 'starkmountain',
  },
  arc_manaphy: {
    id: 'arc_manaphy', title: 'The Prince of the Sea Temple', species: 'manaphy', region: 'Borea', designedOnly: true,
    hook: 'An egg, blue as deep water, washes in from a far sea — and the temple it was stolen from is sinking out of legend.',
    steps: [
      { text: 'Receive the mysterious blue egg' },
      { text: 'Guard the egg on the road to the sea temple' },
      { text: 'Hatch CLIONARCH where the temple surfaces', catch: 'manaphy' },
    ],
    lair: 'seatemple',
  },
  // Stage S6 addition to the designed register (CENTWISP's
  // placement was deferred at S1): the stub pre-registers the id in
  // the validator's quest vocabulary, as the other twelve Borea
  // stubs did; S6's live entry supersedes it in the merge fold.
  arc_spiritomb: {
    id: 'arc_spiritomb', title: 'The Hundred and Eight', species: 'spiritomb', region: 'Borea', designedOnly: true,
    hook: 'A cracked keystone, a ruined tower on the Forsaken Tower road, and a number the stones keep repeating: one hundred and eight.',
    steps: [
      { text: 'Receive the Odd Keystone' },
      { text: 'Set the keystone into the Hallowed Tower' },
      { text: 'Face what the tower was built to hold', catch: 'spiritomb' },
    ],
    lair: 'hallowedtower',
  },
  // Arc 4 Stage S7 addition to the designed register: the PRIMARCH
  // capstone's stub pre-registers arc_arceus in the validator's quest
  // vocabulary (the S6 arc_spiritomb precedent); S7's live entry in
  // SINNOH_LEGENDARY_ARCS supersedes it in the merge fold.
  arc_arceus: {
    id: 'arc_arceus', title: 'The Hall of Dawning', species: 'arceus', region: 'Borea', designedOnly: true,
    hook: 'Above the oldest pillar in the world there is said to be a first room, and in it the one who was present before the chains, before the lakes, before everything — waiting for a flute only a finished road can be trusted with.',
    steps: [
      { text: 'Be entrusted with the Azure Flute at journey\u2019s end' },
      { text: 'Play it at Zenith Spire, where the stairs should be' },
      { text: 'Climb to the Hall of Dawning', catch: 'arceus' },
    ],
    lair: 'halloforigin',
  },

  // ---- Unova (designed) -----------------------------------------------------------
  arc_victini: {
    id: 'arc_victini', title: 'The Victory in the Lighthouse', species: 'victini', region: 'Unova', designedOnly: true,
    hook: 'Liberty Garden’s lighthouse has been sealed for two centuries, and the keeper’s log ends mid-sentence: "It brought us luck. Then it hid."',
    steps: [
      { text: 'Earn the Liberty Pass' },
      { text: 'Open the lighthouse basement' },
      { text: 'Meet Victini, level 50', catch: 'victini' },
    ],
    lair: 'libertygarden',
  },
  arc_keldeo: {
    id: 'arc_keldeo', title: 'The Fourth Sword', species: 'keldeo', region: 'Unova', designedOnly: true,
    hook: 'Three old soldiers of Unova keep glancing at an empty fourth place at their glade — the student who ran ahead of the lesson.',
    steps: [
      { text: 'Earn the respect of Cobalion, Terrakion, and Virizion' },
      { text: 'Bring the three to the Moor of Icirrus' },
      { text: 'Witness Keldeo take up the sword', catch: 'keldeo' },
    ],
    lair: 'pledgegrove',
  },
  arc_meloetta: {
    id: 'arc_meloetta', title: 'The Song That Was Taken', species: 'meloetta', region: 'Unova', designedOnly: true,
    hook: 'A melody older than Unova has gone missing from the world — and a certain cafe pianist hums four notes of it when it rains.',
    steps: [
      { text: 'Gather the four forgotten verses across Unova' },
      { text: 'Play the verses at the Castelia cafe' },
      { text: 'Meet Meloetta where the song returns', catch: 'meloetta' },
    ],
    lair: 'casteliacafe',
  },
  arc_genesect: {
    id: 'arc_genesect', title: 'The Fossil With a Cannon', species: 'genesect', region: 'Unova', designedOnly: true,
    hook: 'A laboratory ruin outside the city keeps one pod unaccounted for — and satellite photos of the hills show a red shape that moves like nothing alive.',
    steps: [
      { text: 'Search the abandoned P2 Laboratory' },
      { text: 'Follow the burn marks into the hills' },
      { text: 'Face Genesect, level 70', catch: 'genesect' },
    ],
    lair: 'p2laboratory',
  },

  // ---- Kalos (designed) --------------------------------------------------------------
  arc_xerneas: {
    id: 'arc_xerneas', title: 'The Tree That Walked Away', species: 'xerneas', region: 'Kalos', designedOnly: true,
    hook: 'Kalos folklore says a great tree once stood where the weapon sleeps — and that the tree had antlers, and opinions.',
    steps: [
      { text: 'Uncover the ultimate weapon’s history' },
      { text: 'Enter the chamber beneath Geosenge' },
      { text: 'Face Xerneas, level 70', catch: 'xerneas' },
    ],
    lair: 'geosengechamber',
  },
  arc_yveltal: {
    id: 'arc_yveltal', title: 'The Cocoon Under the Stone', species: 'yveltal', region: 'Kalos', designedOnly: true,
    hook: 'The stones around Geosenge are not carved. They are drained. Something beneath the town has been feeding for three thousand years.',
    steps: [
      { text: 'Uncover the ultimate weapon’s history' },
      { text: 'Enter the chamber beneath Geosenge' },
      { text: 'Face Yveltal, level 70', catch: 'yveltal' },
    ],
    lair: 'geosengechamber',
  },
  arc_zygarde: {
    id: 'arc_zygarde', title: 'The Watcher in the Dark', species: 'zygarde', region: 'Kalos', designedOnly: true,
    hook: 'Terminus Cave has a final chamber the maps leave blank. The miners who found it describe the same dream afterwards: being counted.',
    steps: [
      { text: 'Gather Zygarde Cells across Kalos', flag: 'zygarde_cells' },
      { text: 'Reach the blank chamber of Terminus Cave' },
      { text: 'Face Zygarde, level 70', catch: 'zygarde' },
    ],
    lair: 'terminuscave',
  },
  arc_diancie: {
    id: 'arc_diancie', title: 'The Princess of the Diamond Domain', species: 'diancie', region: 'Kalos', designedOnly: true,
    hook: 'Deep beneath Kalos runs a kingdom of living crystal, and its heart diamond is going dark.',
    steps: [
      { text: 'Find the Carbink messengers in the caves' },
      { text: 'Descend into the Diamond Domain' },
      { text: 'Help Diancie remake the heart diamond', catch: 'diancie' },
    ],
    lair: 'diamonddomain',
  },
  arc_hoopa: {
    id: 'arc_hoopa', title: 'The Rings in the Desert', species: 'hoopa', region: 'Kalos', designedOnly: true,
    hook: 'A certain bottle, sealed a century ago in a desert ruin, has started ringing like a telephone. Nothing good ever rings like that.',
    steps: [
      { text: 'Find the Prison Bottle in the desert ruins' },
      { text: 'Weather the rings’ summoning storm' },
      { text: 'Face Hoopa Unbound, level 70', catch: 'hoopa' },
    ],
    lair: 'desertruins',
  },
  arc_volcanion: {
    id: 'arc_volcanion', title: 'The Steam of the Nebel Plateau', species: 'volcanion', region: 'Kalos', designedOnly: true,
    hook: 'Hunters who poach the plateau’s Kin keep coming down the mountain missing their traps — and smelling of boiled rain.',
    steps: [
      { text: 'Drive the poachers off the Nebel Plateau' },
      { text: 'Follow the steam vent trail' },
      { text: 'Meet Volcanion, level 70', catch: 'volcanion' },
    ],
    lair: 'nebelplateau',
  },

  // ---- Alola (designed) ----------------------------------------------------------------
  arc_solgaleo: {
    id: 'arc_solgaleo', title: 'The Child of the Stars, Sun', species: 'solgaleo', region: 'Alola', designedOnly: true,
    hook: 'A strange little nebula of a Kin has fallen into your life, and every old altar in Alola is suddenly relevant.',
    steps: [
      { text: 'Raise the Cosmog the professor rescued', flag: 'cosmog_raised' },
      { text: 'Sound the Sun Flute at the Altar of the Sunne' },
      { text: 'Watch Nebby become the sun', catch: 'solgaleo' },
    ],
    lair: 'altarofthesunne',
  },
  arc_lunala: {
    id: 'arc_lunala', title: 'The Child of the Stars, Moon', species: 'lunala', region: 'Alola', designedOnly: true,
    hook: 'A strange little nebula of a Kin has fallen into your life, and every old altar in Alola is suddenly relevant.',
    steps: [
      { text: 'Raise the Cosmog the professor rescued', flag: 'cosmog_raised' },
      { text: 'Sound the Moon Flute at the Altar of the Moone' },
      { text: 'Watch Nebby become the moon', catch: 'lunala' },
    ],
    lair: 'altarofthmoone',
  },
  arc_necrozma: {
    id: 'arc_necrozma', title: 'The Light That Was Stolen', species: 'necrozma', region: 'Alola', designedOnly: true,
    hook: 'Alola’s oldest legend is not about a god. It is about a wound — something that arrived hungry for light and never stopped aching.',
    steps: [
      { text: 'Learn the legend of the Blinding One' },
      { text: 'Ascend the tower in Ultra Space' },
      { text: 'Restore the light — face Necrozma, level 75', catch: 'necrozma' },
    ],
    lair: 'ultramegalopolis',
  },
  arc_magearna: {
    id: 'arc_magearna', title: 'The Clockwork Gift', species: 'magearna', region: 'Alola', designedOnly: true,
    hook: 'Five hundred years ago an artificer built a friend for a lonely princess. The friend is still keeping the appointment.',
    steps: [
      { text: 'Find the artificer’s workshop journal' },
      { text: 'Wind the heart that was never wound' },
      { text: 'Meet Magearna, level 70', catch: 'magearna' },
    ],
    lair: 'antiqueruins',
  },
  arc_marshadow: {
    id: 'arc_marshadow', title: 'The Shadow in Your Shadow', species: 'marshadow', region: 'Alola', designedOnly: true,
    hook: 'Trainers who have glimpsed the rainbow-winged one sometimes report a second shadow at their feet. It is studying your fighting spirit.',
    steps: [
      { text: 'Be witnessed by IRISAVIS’s rainbow', flag: 'rainbow_witnessed' },
      { text: 'Prove your spirit in three dojos' },
      { text: 'Face Marshadow, level 70', catch: 'marshadow' },
    ],
    lair: 'shadowdojo',
  },
  arc_zeraora: {
    id: 'arc_zeraora', title: 'The Thunder Without a Cloud', species: 'zeraora', region: 'Alola', designedOnly: true,
    hook: 'Lightning has been striking the same burnt meadow in clear weather for weeks, in a pattern that looks almost like footprints.',
    steps: [
      { text: 'Investigate the burnt meadow’s strike pattern' },
      { text: 'Follow the voltage trail at a run' },
      { text: 'Face Zeraora, level 70', catch: 'zeraora' },
    ],
    lair: 'burntmeadow',
  },

  // ---- Galar (designed) -------------------------------------------------------------------
  arc_zacian: {
    id: 'arc_zacian', title: 'The Sword in the Mist', species: 'zacian', region: 'Galar', designedOnly: true,
    hook: 'The Slumbering Weald does not appear on Galar’s maps in any way that stays true for long. The sword there is older than the kingdom.',
    steps: [
      { text: 'Enter the Slumbering Weald’s deep mist' },
      { text: 'Take up the Rusted Sword from the altar' },
      { text: 'Face Zacian, level 70', catch: 'zacian' },
    ],
    lair: 'slumberingweald',
  },
  arc_zamazenta: {
    id: 'arc_zamazenta', title: 'The Shield in the Mist', species: 'zamazenta', region: 'Galar', designedOnly: true,
    hook: 'Two heroes stand carved over Galar’s oldest gate — and the second statue’s shield has been polished recently. By rain. Or by use.',
    steps: [
      { text: 'Enter the Slumbering Weald’s deep mist' },
      { text: 'Take up the Rusted Shield from the altar' },
      { text: 'Face Zamazenta, level 70', catch: 'zamazenta' },
    ],
    lair: 'slumberingweald',
  },
  arc_eternatus: {
    id: 'arc_eternatus', title: 'The Darkest Day, Again', species: 'eternatus', region: 'Galar', designedOnly: true,
    hook: 'The sky over Hammerlocke is bruising purple, and the oldest mural in the vault is starting to look less like history and more like a schedule.',
    steps: [
      { text: 'Gather the Wishing Stars falling over Galar' },
      { text: 'Ascend the Energy Plant tower' },
      { text: 'Face Eternatus, level 70', catch: 'eternatus' },
    ],
    lair: 'energyplant',
  },
  arc_calyrex: {
    id: 'arc_calyrex', title: 'The King of the Harvest', species: 'calyrex', region: 'Galar', designedOnly: true,
    hook: 'The Crown Tundra’s oldest village keeps a statue of a king nobody remembers — and carrot fields that still get tended by no one.',
    steps: [
      { text: 'Restore the king’s statue in Freezington' },
      { text: 'Reunite the king with his loyal steed' },
      { text: 'Meet Calyrex at the Crown Shrine', catch: 'calyrex' },
    ],
    lair: 'crownshrine',
  },
  arc_urshifu: {
    id: 'arc_urshifu', title: 'The Two Scrolls', species: 'urshifu', region: 'Galar', designedOnly: true,
    hook: 'On the Isle of Armor, a dojo keeps a small bear with a giant’s discipline problem — it has mastered everything except choosing.',
    steps: [
      { text: 'Raise the dojo’s Kubfu through its trials' },
      { text: 'Choose a tower: the Waters or the Darkness' },
      { text: 'Read the scroll — Urshifu stands', catch: 'urshifu' },
    ],
    lair: 'isleofarmor',
  },

  // ---- Paldea (designed) ---------------------------------------------------------------------
  arc_koraidon: {
    id: 'arc_koraidon', title: 'The Winged King of the Crater', species: 'koraidon', region: 'Paldea', designedOnly: true,
    hook: 'Something ancient fell out of Area Zero and into your life, hungry, winged, and oddly fond of sandwiches.',
    steps: [
      { text: 'Befriend the brute from the crater', flag: 'crater_friend' },
      { text: 'Descend into Area Zero’s depths' },
      { text: 'Face Koraidon where the past leaks through', catch: 'koraidon' },
    ],
    lair: 'areazero',
  },
  arc_miraidon: {
    id: 'arc_miraidon', title: 'The Iron Serpent of Tomorrow', species: 'miraidon', region: 'Paldea', designedOnly: true,
    hook: 'Something futuristic fell out of Area Zero and into your life, silent, electric, and oddly fond of sandwiches.',
    steps: [
      { text: 'Befriend the serpent from the crater', flag: 'crater_friend' },
      { text: 'Descend into Area Zero’s depths' },
      { text: 'Face Miraidon where the future leaks through', catch: 'miraidon' },
    ],
    lair: 'areazero',
  },
  arc_terapagos: {
    id: 'arc_terapagos', title: 'The Jewel Under the Academy', species: 'terapagos', region: 'Paldea', designedOnly: true,
    hook: 'The hidden treasure of Area Zero is not gold. It is a small, sleeping jewel with the whole type chart written in its shell.',
    steps: [
      { text: 'Complete the academy’s treasure hunt' },
      { text: 'Reach the deepest chamber of Area Zero' },
      { text: 'Wake Terapagos, level 85', catch: 'terapagos' },
    ],
    lair: 'areazerodepths',
  },
  arc_ogerpon: {
    id: 'arc_ogerpon', title: 'The Ogre of the Festival', species: 'ogerpon', region: 'Kitakami', designedOnly: true,
    hook: 'Kitakami’s festival celebrates heroes who drove off an ogre. The village’s oldest masks tell the story the other way around.',
    steps: [
      { text: 'Hear the true story from the mask maker’s grandchild' },
      { text: 'Recover the stolen masks from the Loyal Three' },
      { text: 'Meet Ogerpon at the Dreaded Den', catch: 'ogerpon' },
    ],
    lair: 'dreadedden',
  },
  arc_pecharunt: {
    id: 'arc_pecharunt', title: 'The Peach That Binds', species: 'pecharunt', region: 'Kitakami', designedOnly: true,
    hook: 'An old caretaker in Mossui keeps a peach-shaped shell in a drawer and a story she will only tell once the masks are home.',
    steps: [
      { text: 'Restore Ogerpon’s masks and name', flag: 'ogerpon_truth' },
      { text: 'Hear the caretaker’s confession' },
      { text: 'Face Pecharunt, level 70', catch: 'pecharunt' },
    ],
    lair: 'mossuitown',
  },
};

// ---------------------------------------------------------------------------
// The ending roll + the Hall of Fame.
// ---------------------------------------------------------------------------

export const HALL_OF_FAME = [
  'The doors close behind you. The chamber is round, quiet, and older than the League itself.',
  'One by one, your team’s names are etched into the light.',
  'Trainers who come after you will stand in this room and read YOUR names.',
  'Welcome home, Champion.',
];

export const CREDITS_LINES = [
  'You beat the League.',
  'Not with the strongest team in Arden — with the team that never stopped walking beside you.',
  'Every badge was a person who believed the road would test you fairly. Every rival was a mirror. Every goodbye made room for a hello.',
  'Thank you for playing ASH’S JOURNEY — an unofficial fan homage, made by fans, for fans.',
  'The road does not end at the Plateau. It just gets saltier.',
  // ADR-027 (Stage F): the static 'TO BE CONTINUED — the Amber Isles
  // await.' card is RETIRED — the arc transition machine (src/game/
  // arcs.mjs) replaces it: runEnding now hands off to the ARC COMPLETE
  // summary card + the pinned "Go home" directive, so only one ending
  // plays and it names the road ahead from the registry.
];
