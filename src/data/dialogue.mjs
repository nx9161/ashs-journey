// dialogue.mjs — original writing only. Anime story beats are plot facts, not scripts.
// No quoted or closely-paraphrased anime lines (GC §3.3).

export const INTRO_SCRIPT = {
  professor: 'PROF. HAWTHORN',
  lines: [
    'Ah — you made it. I was starting to worry the alarm won again.',
    'Welcome to the world of Pokemon! My name is Hawthorn. I study how Pokemon and people grow together.',
    'You must be {player}. That spark in your eyes — you are ready for the road.',
    'Now then... every trainer begins with a partner. But I have a confession.',
    'The three young Pokemon I set aside for new trainers... they have already found homes this morning.',
    'There is one left. A difficult one. It has opinions, and it has already shocked two of my aides today.',
  ],
  starterMoment: [
    'Go on — say hello. Careful now...',
    '...It shocked you too! Ha! That means it likes you. Mostly.',
    'Listen well: this one will never stay inside a Poke Ball. It walks beside you, or not at all.',
    'A bond like that is rarer than any badge. Treat it well, {player}.',
    'Your journey starts on Route 1, north of Pallet Town. Catch Pokemon, grow strong — and when you are ready, Pewter Gym awaits.',
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
  evolution: 'PIKACHU turned away! It does not want to change — not ever.',
  box: 'PIKACHU leapt right back out! It walks beside you, or not at all.',
};

export const TUTORIAL_AIDE_EXTRA = [
  'One more thing — press START anytime to open the menu. Bag, party, dex, save... it is all there.',
];

export const GYM_WIN_TEXT = [
  'You defeated Gym Leader Brock!',
];

export const SLICE_CAPSTONE = [
  '{player} received the Boulder Badge!',
  'With the Boulder Badge, your Pokemon will obey you, and your team hits a little harder.',
  '...To be continued. The road to Cerulean City lies ahead — in the next chapter.',
];
