// dialogue.mjs — original writing only. Anime story beats are plot facts, not scripts.
// No quoted or closely-paraphrased anime lines (GC §3.3).

export const INTRO_SCRIPT = {
  professor: 'PROF. HAWTHORN',
  lines: [
    'Ah — you made it. I was starting to worry the alarm won again.',
    'Welcome to the world of Kin! My name is Hawthorn. I study how Kin and people grow together.',
    'You must be {player}. That spark in your eyes — you are ready for the road.',
    'Now then... every trainer begins with a partner. But I have a confession.',
    'The three young Kin I set aside for new trainers... they have already found homes this morning.',
    'There is one left. A difficult one. It has opinions, and it has already shocked two of my aides today.',
  ],
  starterMoment: [
    'Go on — say hello. Careful now...',
    '...It shocked you too! Ha! That means it likes you. Mostly.',
    'Listen well: this one will never stay inside a Capture Orb. It walks beside you, or not at all.',
    'A bond like that is rarer than any badge. Treat it well, {player}.',
    'Your journey starts on Route 1, north of Dawnwick. Catch Kin, grow strong — and when you are ready, Flintridge Gym awaits.',
  ],
};

// PARTNER_MOODS — Yellow homage: talking to the partner (face it + A, or tap
// the mood pip) reads its current emotion. Mood is driven by battle beats
// (battle.mjs) and by petting (overworld.mjs). All lines original.
export const PARTNER_MOODS = {
  happy: 'is happy! It nuzzles your hand.',
  curious: 'tilts its head, curious.',
  sleepy: 'yawns... maybe it needs a rest soon.',
  excited: 'is buzzing with excitement! It hops in place.',
  sad: 'looks downcast. A win would cheer it up.',
};

// Yellow hard rules, original wording: the partner refuses the ball system
// outright (intro), refuses evolution, and refuses the PC box (guards in
// state.mjs). It walks beside you, or not at all.
export const PARTNER_REFUSAL = {
  evolution: 'VOLTIK turned away! It does not want to change — not ever.',
  box: 'VOLTIK leapt right back out! It walks beside you, or not at all.',
};

export const TUTORIAL_AIDE_EXTRA = [
  'One more thing — press START anytime to open the menu. Bag, party, dex, save... it is all there.',
];

export const GYM_WIN_TEXT = [
  'You defeated Gym Leader Brock!',
];

export const SLICE_CAPSTONE = [
  '{player} received the Boulder Badge!',
  'With the Boulder Badge, your Kin will obey you, and your team hits a little harder.',
  '...To be continued. The road to Tidehaven City lies ahead — in the next chapter.',
];

// BOND_DIALOGUE — Rejuvenation Phase 5 (ADR-025 §2): tier-variant line
// sets for the bond characters, keyed by derived tier. The PLOT is
// identical at every tier — only the temperature differs. Warm+ unlocks
// personal backstory; Cold unlocks guarded/short variants of the same
// beats. Resolved by bondSceneLines in game/bonds.mjs (fallback:
// close -> warm -> wary, cold -> wary). All lines original writing.
export const BOND_DIALOGUE = {
  gary: {
    // Battle intro lines (substituted into the trainer def clone at
    // battle construction — text only; team/AI/stats never vary, R3).
    battle: {
      cold: ['...You again. Do not slow me down, {player}. Some of us have a League to win.', 'Talk is over. Try to keep up this time.'],
      wary: ['Heh. Knew our paths would cross here, {player}. Hope you have been training — I have.', 'Enough talk. Show me what you have got!'],
      warm: ['There you are, {player}. I was starting to think the road had eaten you.', 'For the record? Half the trainers I beat this month bored me. You never do. Come on!'],
      close: ['{player}. Good. I have been saving my best for someone who could actually test it.', 'No taunts today. We both know what this is. Give me everything — I will return the favor.'],
    },
    battleLose: {
      cold: ['...Tch. Whatever. The League is still mine.'],
      wary: ['Tch. Fine. Take the win. I will take the next one — count on it.'],
      warm: ['Hah... okay. OKAY. You earned that one, {player}. Do not let it go to your head — I am still ahead on style points.'],
      close: ['...Yeah. That is the battle I have been chasing since Dawnwick. Do it again at the top, {player} — I will be waiting.'],
    },
    // Crown League: at Close, the post-champion scene GAINS these
    // mutual-respect lines (the standard scene plays identically).
    championAfter: {
      close: ['...You know what the worst part is? I am not even mad. Somewhere between Dawnwick and here, beating you stopped being the point.', 'PRISMKIT decided, in the end — because YOU pushed us hard enough to need to. That is what rivals are FOR, I guess.', 'So. Champion {player}. Say it back to me when we are old — and I will say it first. That is my concession speech. Do not tell anyone.'],
    },
    // Dawnwick lab small talk (the PRISMKIT beat, shaded).
    lab: {
      cold: ['What are YOU staring at? PRISMKIT and I have training to do. Some of us take this seriously.'],
      wary: ['Yo, {player}! The professor gave me a PRISMKIT — fluffy, clever, and all mine!', 'He says it will evolve to match how I battle. Just watch — we will be champions!'],
      warm: ['Yo, {player}! Meet PRISMKIT. Everyone keeps asking when it will evolve — like that is the whole point.', 'It will evolve when WE decide, not when a chart says. You get that, right? ...Course you do.'],
      close: ['You came back to the lab too, huh. PRISMKIT, look — it is the only other trainer on this road I actually respect.', 'Do not let it go to your head, {player}. I respect exactly one person and it is already too many.'],
    },
  },
  mom: {
    // Post-tale send-offs (Dawnwick talks after the Care Package).
    sendoff: {
      cold: ['Oh. It is you. The road keeping you busy, then. ...Mind the grass on Route 1, love.'],
      wary: ['My maps, her shop, your road. That is how a town stays stitched together, love.'],
      warm: ['There is my cartographer-in-training. Tea before you go — no, do not argue, the kettle is already on.', 'Half of Arden navigates by my handwriting, and my favorite trainer navigates by his own heart. Off you go, love.'],
      close: ['Sit. SIT. You are thin as a rail and twice as stubborn — where did you get that from, I wonder.', 'When you were small you mapped this house in crayon, every room a country. Look at you now, mapping the whole region. Come home sometimes, {player}. The door remembers you.'],
    },
  },
  hawthorn: {
    // Dex-rating framing lines ({n} is the caught count). The rating
    // itself — the count and its thresholds — never varies (a dex
    // entry is never bond-gated); only the warmth of the delivery.
    rating: {
      cold: ['{n} caught. The data is the data, whatever either of us feels about it. Keep walking.'],
      wary: ['{n} caught so far. The KinDex fills one honest page at a time — keep going.'],
      warm: ['{n} caught! Look at that. Every page of that dex is a place you stood and a creature that trusted you. Keep going!'],
      close: ['{n} caught. Do you know, in forty years of handing out KinDexes, yours is the one I check first in the morning. Whatever the number says — I am proud of the trainer carrying it.'],
    },
  },
  brock: {
    banter: {
      cold: ['Gym hours are posted by the door. The museum is that way. We are done here.'],
      wary: ['Back for the exhibits or the rematch talk? Either way, the stone here remembers every challenger.'],
      warm: ['You know the museum paid for this gym\'s roof twice over? Once in stone, once in patience.', 'My father said a leader\'s real job is the day OFF — anyone can be a wall. Being a door takes practice. You taught the whole city that, covering my desk.'],
      close: ['I keep a list, you know. Every challenger who ever made STRATON actually try. It is a short list, {player}, and your name is underlined.', 'When I retire, the museum gets my badge polish and the gym gets a plaque: "A trainer once covered the desk so the leader could rest." That was you. That mattered.'],
    },
  },
  misty: {
    banter: {
      cold: ['Pool\'s for training. If you are not challenging, you are dripping on my deck.'],
      wary: ['The bell still rings over the shop — I mean the gym. Old habits. You did that, trainer.'],
      warm: ['My sisters think the gym is the family business. It is not — the BIKE SHOP was. I turned it into this so nobody could call me the spare sister again.', 'That bell you saved? It rang over my cradle. Some heirlooms are just sounds a town refuses to lose.'],
      close: ['Between us, {player}? ASTRION only performs like that when it respects the other side of the pool. It has never once performed for my sisters.', 'Tidehaven blue is not a color here. It is a promise the water makes. You kept it better than most who were born to it.'],
    },
  },
  surge: {
    banter: {
      cold: ['State your business, soldier. The gym runs on voltage and punctuality.'],
      wary: ['Hah! The paper-fetcher. The Chairman still talks about those notebooks like you pulled them out of the sea barehanded.'],
      warm: ['You want to know why an old soldier runs an electric gym? Because out there, a live wire meant the radio worked, and the radio meant orders, and orders meant HOME.', 'The founder\'s tide tables hang in my office. Every commander needs one thing that was never wrong. Mine is a dead sailor\'s handwriting.'],
      close: ['I do not do speeches, so write this down: you fight like someone who reads the weather before the sky does. That is the whole art, {player}.', 'When the bay storms come, I stand on that dock and think about who I would want beside me in a real fight. Lately the list has a new name on it.'],
    },
  },
  erika: {
    banter: {
      cold: ['The gym keeps garden hours. Perfume and patience — you seem short on both today.'],
      wary: ['The roof garden asks after you. Plants remember who waters, in their way.'],
      warm: ['My grandmother planted that first bed the year the Game Corner\'s lights went up — "so the green stays taller," she said. Every perfume I make starts up there, in her soil.', 'People think Grass is the gentle type. Grass is the type that outlives EMPIRES, trainer. It just does it quietly.'],
      close: ['I keep one cutting from the roof that I give to no one — from the first bed, the grandmother bed. This season it rooted, {player}. When you are next in Canopy, it is yours to plant.', 'A garden is a promise you keep in public. You kept mine three times, in three weathers. The city is greener for you, and so am I.'],
    },
  },
  sabrina: {
    banter: {
      cold: ['I foresaw this conversation. It was short. It is over.'],
      wary: ['The hall stands. So does the Gym. You carried that sentence between us — few have.'],
      warm: ['You ask what strength is FOR. My father said: to protect. Master Ko said: to prove. I spent twenty years answering with silence.', 'My gift showed me a hundred futures as a child, and in none of them did anyone just... knock, and carry a message, and leave. You are very strange, trainer. It is restful.'],
      close: ['I will tell you what I have told no one: I still set two cups out, some mornings. One for the hall across the street. The feud is a house I grew up in — you are the first guest who made it feel less like one.', 'Whatever you face next, {player}, I have seen the shape of it. I am not afraid for you. That is the highest compliment my gift allows.'],
    },
  },
  koga: {
    banter: {
      cold: ['A ninja\'s gym has no small talk. State your purpose or become part of the scenery.'],
      wary: ['Janine speaks of the lure, and of you. In this family, that is not nothing.'],
      warm: ['My grandfather carved that lure the winter the marsh fed all of Bramble. A ninja learns patience from water: still on top, deep below.', 'Janine trains twice as hard since your visit. She says a stranger showed her what our family code looks like from outside. She is right to study it.'],
      close: ['The Warden\'s lure hangs by my door now, between my grandfather\'s portrait and my daughter\'s first badge sketch. You understand what that shelf means, {player}.', 'Poison is the honest type. It never pretends the world is safe — it teaches you to move through it anyway. You move well.'],
    },
  },
  blaine: {
    banter: {
      cold: ['Mind the ash, watch the quiz, state your business. The volcano is patient; I am less so.'],
      wary: ['The lab still talks about the hands that carried its notes home. Paper is stubborn. So are we.'],
      warm: ['That jungle page you recovered — I have read it a hundred times since. We followed a mirage no instrument could record, and I would do it again tomorrow.', 'People ask why a scientist runs a fire gym. Because data, like lava, does not care what you believed before it arrived.'],
      close: ['I never called that expedition a failure, {player}, and do you know why? A failure teaches you where the world ends. That trip taught me it does not. Neither do you.', 'When this island finally blows its top, the lab wants your name on the new building\'s first brick. Scientists are sentimental that way. Fire people too.'],
    },
  },
};
