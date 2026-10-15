// moves.mjs — slice move data. Original implementations of documented systems.
// cat: 'physical' | 'special' | 'status'. Effects are simple, named, and reviewable.

export const MOVES = {
  tackle:      { id: 'tackle', name: 'Tackle', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  scratch:     { id: 'scratch', name: 'Scratch', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  quickattack: { id: 'quickattack', name: 'Quick Attack', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 30, priority: 1 },
  pound:       { id: 'pound', name: 'Pound', type: 'normal', cat: 'physical', power: 40, acc: 100, pp: 35, priority: 0 },
  growl:       { id: 'growl', name: 'Growl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'foe', atk: -1 } },
  tailwhip:    { id: 'tailwhip', name: 'Tail Whip', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  leer:        { id: 'leer', name: 'Leer', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', def: -1 } },
  supersonic:  { id: 'supersonic', name: 'Supersonic', type: 'normal', cat: 'status', power: 0, acc: 55, pp: 20, priority: 0, effect: { target: 'foe', status: 'confusion' } },
  thundershock:{ id: 'thundershock', name: 'Thunder Shock', type: 'electric', cat: 'special', power: 40, acc: 100, pp: 30, priority: 0, effect: { target: 'foe', status: 'paralysis', chance: 10 } },
  ember:       { id: 'ember', name: 'Ember', type: 'fire', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0, effect: { target: 'foe', status: 'burn', chance: 10 } },
  watergun:    { id: 'watergun', name: 'Water Gun', type: 'water', cat: 'special', power: 40, acc: 100, pp: 25, priority: 0 },
  vinewhip:    { id: 'vinewhip', name: 'Vine Whip', type: 'grass', cat: 'physical', power: 45, acc: 100, pp: 25, priority: 0 },
  gust:        { id: 'gust', name: 'Gust', type: 'flying', cat: 'special', power: 40, acc: 100, pp: 35, priority: 0 },
  peck:        { id: 'peck', name: 'Peck', type: 'flying', cat: 'physical', power: 35, acc: 100, pp: 35, priority: 0 },
  poisonsting: { id: 'poisonsting', name: 'Poison Sting', type: 'poison', cat: 'physical', power: 15, acc: 100, pp: 35, priority: 0, effect: { target: 'foe', status: 'poison', chance: 30 } },
  stringshot:  { id: 'stringshot', name: 'String Shot', type: 'bug', cat: 'status', power: 0, acc: 95, pp: 40, priority: 0, effect: { target: 'foe', spe: -2 } },
  leechlife:   { id: 'leechlife', name: 'Leech Life', type: 'bug', cat: 'physical', power: 20, acc: 100, pp: 15, priority: 0, effect: { target: 'foe', drain: 0.5 } },
  rockthrow:   { id: 'rockthrow', name: 'Rock Throw', type: 'rock', cat: 'physical', power: 50, acc: 90, pp: 15, priority: 0 },
  lowkick:     { id: 'lowkick', name: 'Low Kick', type: 'fighting', cat: 'physical', power: 50, acc: 100, pp: 20, priority: 0 },
  defensecurl: { id: 'defensecurl', name: 'Defense Curl', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: { target: 'self', def: 1 } },
  harden:      { id: 'harden', name: 'Harden', type: 'normal', cat: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: { target: 'self', def: 1 } },
};

// effect: { target:'foe'|'self', atk/def/spa/spd/spe stages [-6,6], status, chance (0-100), drain }
