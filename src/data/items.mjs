// items.mjs — slice item data. Curated ball roster per GD §3.3 (phone-UI-sized).

export const BALLS = {
  pokeball:  { id: 'pokeball', name: 'Poke Ball', bonus: 1, desc: 'The baseline. Reliable.' },
  greatball: { id: 'greatball', name: 'Great Ball', bonus: 1.5, desc: '1.5x catch rate.' },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', bonus: 2, desc: '2x catch rate.' },
};

export const ITEMS = {
  potion: { id: 'potion', name: 'Potion', pocket: 'medicine', heal: 20, desc: 'Restores 20 HP.' },
  pokeball:  { id: 'pokeball', name: 'Poke Ball', pocket: 'balls', desc: BALLS.pokeball.desc },
  greatball: { id: 'greatball', name: 'Great Ball', pocket: 'balls', desc: BALLS.greatball.desc },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', pocket: 'balls', desc: BALLS.ultraball.desc },
  boulderbadge: { id: 'boulderbadge', name: 'Boulder Badge', pocket: 'key', desc: 'Won from Brock of Pewter Gym. Raises party obedience and Attack.' },
};

export const POCKETS = ['balls', 'medicine', 'key'];
