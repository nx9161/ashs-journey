// items.mjs — full Generation-I item economy (WS9 parity): balls, medicine,
// stones, fossils, key items, all 50 TMs + 5 HMs. Prices are the original's
// documented mart prices; sell price is half unless noted.

export const BALLS = {
  pokeball:  { id: 'pokeball', name: 'Poke Ball', bonus: 1, desc: 'The baseline. Reliable.' },
  greatball: { id: 'greatball', name: 'Great Ball', bonus: 1.5, desc: 'A better catch rate.' },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', bonus: 2, desc: 'The best standard ball.' },
  masterball: { id: 'masterball', name: 'Master Ball', bonus: 999, desc: 'Catches without fail. One exists.' },
  safariball: { id: 'safariball', name: 'Safari Ball', bonus: 1, desc: 'Issued at the Safari Zone gate.' },
  // Stage J6: Kurt's apricorn balls. Each carries a `rule` that the
  // catch calculation in BOTH battle engines evaluates against the
  // live battle (src/game/ball-rules.mjs) — the bonus is NEVER flat
  // flavour: the desc states the real condition, and a rule that does
  // not meet its condition multiplies by exactly 1. `bonus` stays the
  // nominal 1; the rule supplies the true multiplier.
  levelball: { id: 'levelball', name: 'Level Ball', bonus: 1, rule: 'level', desc: 'Kurt-made. The bigger your lead\'s level edge over the wild foe, the stronger it pulls: over 4x its level x8, over 2x x4, over 1x x2, otherwise x1.' },
  lureball: { id: 'lureball', name: 'Lure Ball', bonus: 1, rule: 'lure', desc: 'Kurt-made. x3 on a Pokemon hooked while fishing; x1 on any other encounter.' },
  moonball: { id: 'moonball', name: 'Moon Ball', bonus: 1, rule: 'moon', desc: 'Kurt-made. x4 on a species that evolves by Moon Stone; x1 on anything else.' },
  loveball: { id: 'loveball', name: 'Love Ball', bonus: 1, rule: 'love', desc: 'Kurt-made. x8 when the wild foe is the same species as your lead; x1 otherwise.' },
  fastball: { id: 'fastball', name: 'Fast Ball', bonus: 1, rule: 'fast', desc: 'Kurt-made. x4 on a species whose base Speed is 100 or more; x1 on slower species.' },
  friendball: { id: 'friendball', name: 'Friend Ball', bonus: 1, rule: 'friend', desc: 'Kurt-made. A plain x1 catch — but a Pokemon caught in it starts out trusting you (friendship set high).' },
  heavyball: { id: 'heavyball', name: 'Heavy Ball', bonus: 1, rule: 'heavy', desc: 'Kurt-made. Pulls harder the bulkier the foe\'s battler tier: S x1, M x1.5, L x2.5, XL x4.' },
};

// TM number -> move id (canonical Gen-1 assignments; moves live in moves data).
export const TM_MOVES = {
  1: 'megapunch', 2: 'razorwind', 3: 'swordsdance', 4: 'whirlwind', 5: 'megakick',
  6: 'toxic', 7: 'horndrill', 8: 'bodyslam', 9: 'takedown', 10: 'doubleedge',
  11: 'bubblebeam', 12: 'watergun', 13: 'icebeam', 14: 'blizzard', 15: 'hyperbeam',
  16: 'payday', 17: 'submission', 18: 'counter', 19: 'seismictoss', 20: 'rage',
  21: 'megadrain', 22: 'solarbeam', 23: 'dragonrage', 24: 'thunderbolt', 25: 'thunder',
  26: 'earthquake', 27: 'fissure', 28: 'dig', 29: 'psychic', 30: 'teleport',
  31: 'mimic', 32: 'doubletam', 33: 'reflect', 34: 'bide', 35: 'metronome',
  36: 'selfdestruct', 37: 'eggbomb', 38: 'fireblast', 39: 'swift', 40: 'skullbash',
  41: 'softboiled', 42: 'dreameater', 43: 'skyattack', 44: 'rest', 45: 'thunderwave',
  46: 'psywave', 47: 'explosion', 48: 'rockslide', 49: 'triattack', 50: 'substitute',
};
export const HM_MOVES = { 1: 'cut', 2: 'fly', 3: 'surf', 4: 'strength', 5: 'flash' };
const TM_PRICES = {
  1: 3000, 2: 2000, 3: 2000, 4: 1000, 5: 3000, 6: 4000, 7: 2000, 8: 4000, 9: 3000, 10: 4000,
  11: 2000, 12: 1000, 13: 4000, 14: 5500, 15: 5500, 16: 2000, 17: 3000, 18: 2000, 19: 2000, 20: 2000,
  21: 3000, 22: 4000, 23: 2000, 24: 2000, 25: 5500, 26: 4000, 27: 5000, 28: 2000, 29: 4000, 30: 1000,
  31: 2000, 32: 1000, 33: 2000, 34: 2000, 35: 3000, 36: 2000, 37: 2000, 38: 5500, 39: 2000, 40: 2000,
  41: 2000, 42: 3000, 43: 5000, 44: 2000, 45: 2000, 46: 2000, 47: 3000, 48: 3000, 49: 3000, 50: 2000,
};

export const ITEMS = {
  // Balls
  pokeball:  { id: 'pokeball', name: 'Poke Ball', pocket: 'balls', price: 200, desc: BALLS.pokeball.desc },
  greatball: { id: 'greatball', name: 'Great Ball', pocket: 'balls', price: 600, desc: BALLS.greatball.desc },
  ultraball: { id: 'ultraball', name: 'Ultra Ball', pocket: 'balls', price: 1200, desc: BALLS.ultraball.desc },
  masterball: { id: 'masterball', name: 'Master Ball', pocket: 'balls', desc: BALLS.masterball.desc },
  safariball: { id: 'safariball', name: 'Safari Ball', pocket: 'balls', desc: BALLS.safariball.desc },
  // Stage J6: apricorn balls — Kurt-only (canon): no price, so no mart
  // ever stocks them; the Cheat Terminal stocks them from data like
  // everything else.
  levelball: { id: 'levelball', name: 'Level Ball', pocket: 'balls', desc: BALLS.levelball.desc },
  lureball: { id: 'lureball', name: 'Lure Ball', pocket: 'balls', desc: BALLS.lureball.desc },
  moonball: { id: 'moonball', name: 'Moon Ball', pocket: 'balls', desc: BALLS.moonball.desc },
  loveball: { id: 'loveball', name: 'Love Ball', pocket: 'balls', desc: BALLS.loveball.desc },
  fastball: { id: 'fastball', name: 'Fast Ball', pocket: 'balls', desc: BALLS.fastball.desc },
  friendball: { id: 'friendball', name: 'Friend Ball', pocket: 'balls', desc: BALLS.friendball.desc },
  heavyball: { id: 'heavyball', name: 'Heavy Ball', pocket: 'balls', desc: BALLS.heavyball.desc },
  // Stage J6: apricorns (pocket 'items') — picked from apricorn trees
  // across Johto (src/game/johto-systems.mjs APRICORN_TREES); Kurt in
  // Azalea crafts one into its matching ball. No price: never mart stock.
  redapricorn: { id: 'redapricorn', name: 'Red Apricorn', pocket: 'items', desc: 'A ripe red apricorn. Kurt of Azalea can work it into a Level Ball.' },
  blueapricorn: { id: 'blueapricorn', name: 'Blue Apricorn', pocket: 'items', desc: 'A ripe blue apricorn. Kurt of Azalea can work it into a Lure Ball.' },
  yellowapricorn: { id: 'yellowapricorn', name: 'Yellow Apricorn', pocket: 'items', desc: 'A ripe yellow apricorn. Kurt of Azalea can work it into a Moon Ball.' },
  greenapricorn: { id: 'greenapricorn', name: 'Green Apricorn', pocket: 'items', desc: 'A ripe green apricorn. Kurt of Azalea can work it into a Friend Ball.' },
  pinkapricorn: { id: 'pinkapricorn', name: 'Pink Apricorn', pocket: 'items', desc: 'A ripe pink apricorn. Kurt of Azalea can work it into a Love Ball.' },
  whiteapricorn: { id: 'whiteapricorn', name: 'White Apricorn', pocket: 'items', desc: 'A ripe white apricorn. Kurt of Azalea can work it into a Fast Ball.' },
  blackapricorn: { id: 'blackapricorn', name: 'Black Apricorn', pocket: 'items', desc: 'A ripe black apricorn. Kurt of Azalea can work it into a Heavy Ball.' },
  // Medicine
  potion: { id: 'potion', name: 'Potion', pocket: 'medicine', price: 300, heal: 20, desc: 'Restores 20 HP.' },
  superpotion: { id: 'superpotion', name: 'Super Potion', pocket: 'medicine', price: 700, heal: 50, desc: 'Restores 50 HP.' },
  hyperpotion: { id: 'hyperpotion', name: 'Hyper Potion', pocket: 'medicine', price: 1200, heal: 200, desc: 'Restores 200 HP.' },
  maxpotion: { id: 'maxpotion', name: 'Max Potion', pocket: 'medicine', price: 2500, heal: 9999, desc: 'Fully restores HP.' },
  fullrestore: { id: 'fullrestore', name: 'Full Restore', pocket: 'medicine', price: 3000, heal: 9999, cureStatus: true, desc: 'Full HP + cures status.' },
  antidote: { id: 'antidote', name: 'Antidote', pocket: 'medicine', price: 100, cure: 'poison', desc: 'Cures poison.' },
  parlyzheal: { id: 'parlyzheal', name: 'Parlyz Heal', pocket: 'medicine', price: 200, cure: 'paralysis', desc: 'Cures paralysis.' },
  awakening: { id: 'awakening', name: 'Awakening', pocket: 'medicine', price: 250, cure: 'sleep', desc: 'Wakes a sleeping Pokemon.' },
  burnheal: { id: 'burnheal', name: 'Burn Heal', pocket: 'medicine', price: 250, cure: 'burn', desc: 'Cures a burn.' },
  iceheal: { id: 'iceheal', name: 'Ice Heal', pocket: 'medicine', price: 250, cure: 'freeze', desc: 'Thaws a frozen Pokemon.' },
  fullheal: { id: 'fullheal', name: 'Full Heal', pocket: 'medicine', price: 600, cure: 'all', desc: 'Cures any status.' },
  revive: { id: 'revive', name: 'Revive', pocket: 'medicine', price: 1500, revive: 0.5, desc: 'Revives with half HP.' },
  maxrevive: { id: 'maxrevive', name: 'Max Revive', pocket: 'medicine', price: 4000, revive: 1, desc: 'Revives with full HP.' },
  ether: { id: 'ether', name: 'Ether', pocket: 'medicine', price: 1200, ppRestore: 10, desc: 'Restores 10 PP of one move.' },
  maxether: { id: 'maxether', name: 'Max Ether', pocket: 'medicine', price: 2000, ppRestore: 999, desc: 'Fully restores one move\'s PP.' },
  elixir: { id: 'elixir', name: 'Elixir', pocket: 'medicine', price: 3000, ppRestoreAll: 10, desc: 'Restores 10 PP to all moves.' },
  maxelixir: { id: 'maxelixir', name: 'Max Elixir', pocket: 'medicine', price: 4500, ppRestoreAll: 999, desc: 'Fully restores all PP.' },
  rarecandy: { id: 'rarecandy', name: 'Rare Candy', pocket: 'medicine', levelUp: true, desc: 'Raises level by 1.' },
  xpcandy: { id: 'xpcandy', name: 'XP Candy', pocket: 'medicine', xpBoost: 800, desc: 'A sparring prize. Grants 800 XP to one Pokemon.' },
  // Evolution stones
  firestone: { id: 'firestone', name: 'Fire Stone', pocket: 'items', price: 2100, desc: 'Evolves certain Fire lines.' },
  waterstone: { id: 'waterstone', name: 'Water Stone', pocket: 'items', price: 2100, desc: 'Evolves certain Water lines.' },
  thunderstone: { id: 'thunderstone', name: 'Thunder Stone', pocket: 'items', price: 2100, desc: 'Evolves certain Electric lines. The partner refuses it — firmly.' },
  leafstone: { id: 'leafstone', name: 'Leaf Stone', pocket: 'items', price: 2100, desc: 'Evolves certain Grass lines.' },
  moonstone: { id: 'moonstone', name: 'Moon Stone', pocket: 'items', price: 0, desc: 'A stone that fell with the Clefairy legends of Mt. Moon.' },
  sunstone: { id: 'sunstone', name: 'Sun Stone', pocket: 'items', price: 0, desc: 'A stone that glows like bottled morning. Evolves certain sun-loving lines.' },
  // Treasures / misc
  nugget: { id: 'nugget', name: 'Nugget', pocket: 'items', price: 10000, desc: 'A gold nugget. Sell it at a mart.' },
  stardust: { id: 'stardust', name: 'Stardust', pocket: 'items', price: 2000, desc: 'Fine red sand. Sell it at a mart.' },
  starpiece: { id: 'starpiece', name: 'Star Piece', pocket: 'items', price: 9800, desc: 'A glittering gem shard. Sell it at a mart.' },
  // Fossils (revived at the Cinnabar Lab)
  helixfossil: { id: 'helixfossil', name: 'Helix Fossil', pocket: 'key', desc: 'A spiral fossil from Mt. Moon. The Cinnabar Lab can revive it.' },
  domefossil: { id: 'domefossil', name: 'Dome Fossil', pocket: 'key', desc: 'A domed fossil from Mt. Moon. The Cinnabar Lab can revive it.' },
  oldamber: { id: 'oldamber', name: 'Old Amber', pocket: 'key', desc: 'Ancient tree sap with something preserved inside.' },
  escaperope: { id: 'escaperope', name: 'Escape Rope', pocket: 'items', price: 550, desc: 'A long, sturdy rope. Warps you out of caves and buildings to the last town where you healed your team.' },
  // Key items
  bicycle: { id: 'bicycle', name: 'Bicycle', pocket: 'key', desc: 'Ride with SELECT; twice as fast. Cycling Road loves it.' },
  bikevoucher: { id: 'bikevoucher', name: 'Bike Voucher', pocket: 'key', desc: 'Good for one free bicycle at the Cerulean bike shop.' },
  oldrod: { id: 'oldrod', name: 'Old Rod', pocket: 'key', desc: 'Fish by facing water and pressing A. Catches humble things.' },
  goodrod: { id: 'goodrod', name: 'Good Rod', pocket: 'key', desc: 'A better rod. Better splashes.' },
  superrod: { id: 'superrod', name: 'Super Rod', pocket: 'key', desc: 'The best rod there is.' },
  silphscope: { id: 'silphscope', name: 'Silph Scope', pocket: 'key', desc: 'Reveals unseen presences. The Tower\'s ghost, for instance.' },
  pokeflute: { id: 'pokeflute', name: 'Poke Flute', pocket: 'key', desc: 'Its melody can wake anything. Even a roadblock.' },
  cardkey: { id: 'cardkey', name: 'Card Key', pocket: 'key', desc: 'Opens the sliding doors of Silph Co.' },
  secretkey: { id: 'secretkey', name: 'Secret Key', pocket: 'key', desc: 'Opens the Cinnabar Gym. Still warm from the mansion ruins.' },
  ssticket: { id: 'ssticket', name: 'S.S. Ticket', pocket: 'key', desc: 'A boarding pass for a luxury cruise from Vermilion.' },
  coincase: { id: 'coincase', name: 'Coin Case', pocket: 'key', desc: 'Holds Game Corner coins.' },
  coin: { id: 'coin', name: 'Game Coin', pocket: 'key', desc: 'Game Corner currency. Win at the slots; spend at the prize corner.' },
  itemfinder: { id: 'itemfinder', name: 'Itemfinder', pocket: 'key', desc: 'Beeps near hidden items when used (SELECT near a spot).' },
  townmap: { id: 'townmap', name: 'Town Map', pocket: 'key', desc: 'Kanto at a glance. Gary\'s sister would approve.' },
  goldteeth: { id: 'goldteeth', name: 'Gold Teeth', pocket: 'key', desc: 'The Safari warden\'s lost teeth. He\'d be grateful.' },
  // Badges (key pocket; effects enforced by the field-move + obedience systems)
  boulderbadge: { id: 'boulderbadge', name: 'Boulder Badge', pocket: 'key', desc: 'From Brock of Pewter. Lets you use FLASH outside battle; Attack rises.' },
  cascadebadge: { id: 'cascadebadge', name: 'Cascade Badge', pocket: 'key', desc: 'From Misty of Cerulean. Pokemon up to Lv30 obey; CUT outside battle.' },
  thunderbadge: { id: 'thunderbadge', name: 'Thunder Badge', pocket: 'key', desc: 'From Lt. Surge of Vermilion. FLY outside battle; Speed rises.' },
  rainbowbadge: { id: 'rainbowbadge', name: 'Rainbow Badge', pocket: 'key', desc: 'From Erika of Celadon. Up to Lv50 obey; STRENGTH outside battle.' },
  soulbadge: { id: 'soulbadge', name: 'Soul Badge', pocket: 'key', desc: 'From Koga of Fuchsia. SURF outside battle; Defense rises.' },
  marshbadge: { id: 'marshbadge', name: 'Marsh Badge', pocket: 'key', desc: 'From Sabrina of Saffron. Up to Lv70 obey.' },
  volcanobadge: { id: 'volcanobadge', name: 'Volcano Badge', pocket: 'key', desc: 'From Blaine of Cinnabar. Special rises.' },
  earthbadge: { id: 'earthbadge', name: 'Earth Badge', pocket: 'key', desc: 'From the Viridian Gym. All Pokemon obey. The League gate opens.' },
  // Orange Crew badges (Stage O2): the Kanto representation exactly —
  // a key-pocket ITEMS row per badge, the id in badges.orange, and the
  // badge_<root> story flag (winTrainer / cheatClaimBadge write all
  // three from the trainer def / claim, never a parallel shape).
  coraleyebadge: { id: 'coraleyebadge', name: 'Coral-Eye Badge', pocket: 'key', desc: 'From Cissy of Mikan. Won on her water range — aim first, battle second.' },
  searubybadge: { id: 'searubybadge', name: 'Sea Ruby Badge', pocket: 'key', desc: 'From Danny of Navel. The climb was the first half of the challenge.' },
  spikeshellbadge: { id: 'spikeshellbadge', name: 'Spike Shell Badge', pocket: 'key', desc: 'From Rudy of Trovita. He tests a team type by type, then dances.' },
  jadestarbadge: { id: 'jadestarbadge', name: 'Jade Star Badge', pocket: 'key', desc: 'From Luana of Kumquat. Her double battle: two pairs, back to back, no rest.' },
  // Johto badges (Stage J4a): the Kanto representation exactly — a
  // key-pocket ITEMS row per badge, the id in badges.johto, and the
  // badge_<root> story flag. West four ship playable in J4a; the east
  // four rows exist now so the set, the Cheat Terminal stock and the
  // validator sequence are complete before J4b stages their gyms.
  zephyrbadge: { id: 'zephyrbadge', name: 'Zephyr Badge', pocket: 'key', desc: 'From Falkner of Violet. The wind over the tower road is yours to borrow.' },
  hivebadge: { id: 'hivebadge', name: 'Hive Badge', pocket: 'key', desc: 'From Bugsy of Azalea. Won under the trees, in a room of load-bearing webs.' },
  plainbadge: { id: 'plainbadge', name: 'Plain Badge', pocket: 'key', desc: 'From Whitney of Goldenrod. It is not plain at all, whatever people say.' },
  fogbadge: { id: 'fogbadge', name: 'Fog Badge', pocket: 'key', desc: 'From Morty of Ecruteak. For a trainer the fog decided to show things to.' },
  stormbadge: { id: 'stormbadge', name: 'Storm Badge', pocket: 'key', desc: 'From Chuck of Cianwood. For a team the storm respects.' },
  mineralbadge: { id: 'mineralbadge', name: 'Mineral Badge', pocket: 'key', desc: 'From Jasmine of Olivine. It shines back at the lighthouse.' },
  glacierbadge: { id: 'glacierbadge', name: 'Glacier Badge', pocket: 'key', desc: 'From Pryce of Mahogany. It will not melt. Neither will you.' },
  risingbadge: { id: 'risingbadge', name: 'Rising Badge', pocket: 'key', desc: 'From Clair of Blackthorn — awarded in the Dragon\'s Den, by the clan\'s law, after the elder\'s test.' },
  // Hoenn badges (Stage H4a): the Kanto representation exactly — a
  // key-pocket ITEMS row per badge, the id in badges.hoenn, and the
  // badge_<root> story flag. First four are playable in H4a; the east
  // four rows ship now so the earn order is complete from day one
  // (H4b's leaders award them without touching this table).
  stonebadge: { id: 'stonebadge', name: 'Stone Badge', pocket: 'key', desc: 'From Roxanne of Rustboro. Cut from the same stone her gym is built from.' },
  knucklebadge: { id: 'knucklebadge', name: 'Knuckle Badge', pocket: 'key', desc: 'From Brawly of Dewford. For a team that can take a wave standing up.' },
  dynamobadge: { id: 'dynamobadge', name: 'Dynamo Badge', pocket: 'key', desc: 'From Wattson of Mauville. It hums faintly in a thunderstorm.' },
  heatbadge: { id: 'heatbadge', name: 'Heat Badge', pocket: 'key', desc: 'From Flannery of Lavaridge. Warm to the touch, always.' },
  balancebadge: { id: 'balancebadge', name: 'Balance Badge', pocket: 'key', desc: 'From Norman of Petalburg. Perfectly weighted, either way up.' },
  featherbadge: { id: 'featherbadge', name: 'Feather Badge', pocket: 'key', desc: 'From Winona of Fortree. Light enough to ride the canopy wind.' },
  mindbadge: { id: 'mindbadge', name: 'Mind Badge', pocket: 'key', desc: 'From Tate and Liza of Mossdeep. Two halves, one thought.' },
  rainbadge: { id: 'rainbadge', name: 'Rain Badge', pocket: 'key', desc: 'From Juan of Sootopolis. It smells of deep water and old rain.' },
  // Frontier Symbols (Stage F0): the Kanto representation adapted to
  // the Frontier's shape — a key-pocket ITEMS row per Symbol, but the
  // earned state itself is NOT a bag/badge array: it is the slot array
  // badges.symbols (slot i = facility BADGE_SETS.symbols[i], each slot
  // null | 'silver' | 'gold'). Silver sets the slot; Gold raises it.
  // These rows are the case/display record of a Symbol once earned —
  // they are earned-only and never stock (see the Cheat Terminal
  // exclusion in overworld-systems.mjs openCheatShop).
  abilitysymbol: { id: 'abilitysymbol', name: 'Ability Symbol', pocket: 'key', desc: 'From the Battle Tower. Struck in silver for the first long climb, and in gold for the trainer who climbs twice as far again.' },
  knowledgesymbol: { id: 'knowledgesymbol', name: 'Knowledge Symbol', pocket: 'key', desc: 'From the Battle Factory. For winning with borrowed partners — proof that what you know matters more than what you own.' },
  gutssymbol: { id: 'gutssymbol', name: 'Guts Symbol', pocket: 'key', desc: 'From the Battle Arena. Three turns, judged without mercy — for a team that never once fought scared.' },
  tacticssymbol: { id: 'tacticssymbol', name: 'Tactics Symbol', pocket: 'key', desc: 'From the Battle Dome. Won through a whole tournament bracket, one read at a time, under the brightest lights on the island.' },
  lucksymbol: { id: 'lucksymbol', name: 'Luck Symbol', pocket: 'key', desc: 'From the Battle Pike. The rooms choose what happens to you in there; this says you walked out smiling anyway.' },
  spiritsymbol: { id: 'spiritsymbol', name: 'Spirit Symbol', pocket: 'key', desc: 'From the Battle Palace. For trusting your partners to choose their own moves — and being right to trust them.' },
  bravesymbol: { id: 'bravesymbol', name: 'Brave Symbol', pocket: 'key', desc: 'From the Battle Pyramid. Carried up through the dark, floor by floor, with only what you brought in your bag.' },
  // Stage J4b key item: the Cianwood pharmacy's Secret Potion, the
  // medicine errand's whole cargo (delivered to Amphy in the Glitter
  // Lighthouse; the delivery scene removes it from the bag).
  secretpotion: { id: 'secretpotion', name: 'Secret Potion', pocket: 'key', desc: 'A dense, honey-bright medicine from the Cianwood pharmacy. For Amphy, the lighthouse Pokemon — handle with both hands.' },
  // Stage J5 key item: the Clear Bell, given by Ecruteak's Kimono
  // sisters once the three awakened beasts are quieted — its chime is
  // the Bell Tower summit's invitation to Ho-Oh (arc_hooh).
  clearbell: { id: 'clearbell', name: 'Clear Bell', pocket: 'key', desc: 'A bell of clear, cold crystal, kept by the Kimono sisters of Ecruteak. Its chime carries further than sound should — something in the high sky is meant to hear it.' },
  winnerstrophy: { id: 'winnerstrophy', name: "Winner's Trophy", pocket: 'items', collectible: true, desc: 'COLLECTIBLE — The Orange League Winner\'s Trophy, presented at Pummelo Stadium. It catches southern light from every angle.' },
  // Cheat Shop collectibles (owner order 2026-10-28): anime/book canon
  // treasures with NO game system to hook — honestly labeled COLLECTIBLE
  // in the shop, with no effects of any kind.
  gsball: { id: 'gsball', name: 'GS Ball', pocket: 'items', collectible: true, desc: 'COLLECTIBLE — A gold-and-silver ball no machine can open. It hums near old shrines.' },
  pinkanberry: { id: 'pinkanberry', name: 'Pinkan Berry', pocket: 'items', collectible: true, desc: 'COLLECTIBLE — A rosy island berry. One bite blushes fur and feathers pink for a day.' },
  minimistylure: { id: 'minimistylure', name: 'Mini-Misty Lure', pocket: 'items', collectible: true, desc: 'COLLECTIBLE — A hand-painted fishing lure, a tiny redhead in a yellow top. Fish approve.' },
  rainbowwing: { id: 'rainbowwing', name: 'Rainbow Wing', pocket: 'items', collectible: true, desc: 'COLLECTIBLE — A single feather in every color at once. It is warm, as if just flown in.' },
};

// TMs + HMs are generated from the canonical maps (single-use TMs, reusable HMs).
for (let n = 1; n <= 50; n++) {
  const id = 'tm' + String(n).padStart(2, '0');
  ITEMS[id] = { id, name: 'TM' + String(n).padStart(2, '0'), pocket: 'tm', move: TM_MOVES[n], price: TM_PRICES[n], desc: 'Teaches ' + TM_MOVES[n] + '. One use.' };
}
for (let n = 1; n <= 5; n++) {
  const id = 'hm0' + n;
  ITEMS[id] = { id, name: 'HM0' + n, pocket: 'hm', move: HM_MOVES[n], desc: 'Teaches ' + HM_MOVES[n] + '. Unlimited use; the move cannot be forgotten normally.' };
}

// ---------- Keepsakes (Rejuvenation Phase 3, ADR-025 §3) ----------
// Held items: one per Pokemon (mon.keepsake), carried in the bag's
// 'keepsakes' pocket — non-consumable, non-sellable, stack 1 each (a
// keepsake is a unique object). EFFECT LAW (banned by this data shape):
// every entry MUST declare exactly one conditional `kind` with its
// window/trigger parameters — there is no field here that can express a
// flat always-on % stat boost, and src/game/keepsakes.mjs resolves ONLY
// the kinds below. `effect` is the one-line summary-screen text (§3c).
export const KEEPSAKES = {
  sparrowfeather: { id: 'sparrowfeather', name: 'Sparrow Feather', kind: 'underdogDamage', factor: 1.25, levelGap: 3, effect: 'Deals x1.25 damage while 3+ levels below the foe.' },
  tortoisecharm: { id: 'tortoisecharm', name: 'Tortoise Charm', kind: 'koSave', effect: 'Once per battle, survives a KO from above half HP at 1 HP.' },
  secondwindribbon: { id: 'secondwindribbon', name: 'Second-Wind Ribbon', kind: 'lowHpSpeed', hpFrac: 0.25, stages: 1, effect: 'Once per battle, at 25% HP or less, Speed rises 1 stage.', price: 3000, minBadges: 7 },
  embereed: { id: 'embereed', name: 'Ember Seed', kind: 'statusChance', moveType: 'fire', status: 'burn', bonus: 10, effect: "Fire moves gain +10% burn chance; the holder can't be frozen." },
  tidepearl: { id: 'tidepearl', name: 'Tide Pearl', kind: 'typeWard', moveType: 'electric', factor: 0.8, effect: 'Takes x0.8 damage from Electric moves.' },
  gloomfang: { id: 'gloomfang', name: 'Gloom Fang', kind: 'statusChance', moveType: 'poison', status: 'poison', bonus: 10, rtCooldown: 0.85, effect: 'Poison moves: +10% poison chance (RT: cooldown x0.85).' },
  ironacorn: { id: 'ironacorn', name: 'Iron Acorn', kind: 'firstHitWard', factor: 0.85, effect: 'Takes x0.85 from the first hit it takes each battle.' },
  spectrebell: { id: 'spectrebell', name: 'Spectre Bell', kind: 'matchupDamage', moveType: 'ghost', vsType: 'psychic', factor: 1.2, effect: 'Ghost moves deal x1.2 vs Psychic-types.' },
  gardeniasash: { id: 'gardeniasash', name: 'Gardenia Sash', kind: 'healBoost', factor: 1.5, effect: 'Healing moves on the holder restore +50%.' },
  thunderheadpin: { id: 'thunderheadpin', name: 'Thunderhead Pin', kind: 'lowHpDamage', moveType: 'electric', factor: 1.15, hpFrac: 0.5, effect: 'Electric moves deal x1.15 while at 50% HP or less.' },
  fossilspur: { id: 'fossilspur', name: 'Fossil Spur', kind: 'fasterFoeDamage', moveType: 'rock', factor: 1.15, effect: 'Rock moves deal x1.15 vs faster foes.' },
  championsribbon: { id: 'championsribbon', name: "Champion's Ribbon", kind: 'xpBoost', factor: 1.2, effect: 'Holder gains x1.2 XP.' },
};
// The bag/mart surface of the same pieces (ITEMS is the bag's table).
// price exists ONLY on the Second-Wind Ribbon (its Celadon shop source);
// minBadges is the mart's late-game gate for that stock (see openMart).
// No other keepsake carries a price: they are never bought or sold.
for (const k of Object.values(KEEPSAKES)) {
  ITEMS[k.id] = {
    id: k.id, name: k.name, pocket: 'keepsakes', desc: k.effect,
    ...(k.price ? { price: k.price, minBadges: k.minBadges || 0 } : {}),
  };
}

// ---------- Badge sets (Stage O2) ----------
// The canonical earn order per badge set, in ONE place: the leader
// award path (battle.mjs, via each trainer def's badge + badgeSet),
// the Cheat Terminal's prefix-complete claim rule, and the server
// validator's prefix rule (tools/api-scripts/gen-tables.mjs emits
// badgeSequences FROM this table) all read these lists — a badge set
// can never drift between the game, the shop, and the cloud.
// Root flag convention: badge_<id minus the 'badge' suffix>
// (badge_coraleye, badge_boulder, ...), exactly as Kanto shipped.
export const BADGE_SETS = {
  kanto: ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'],
  orange: ['coraleyebadge', 'searubybadge', 'spikeshellbadge', 'jadestarbadge'],
  johto: ['zephyrbadge', 'hivebadge', 'plainbadge', 'fogbadge', 'stormbadge', 'mineralbadge', 'glacierbadge', 'risingbadge'],
  hoenn: ['stonebadge', 'knucklebadge', 'dynamobadge', 'heatbadge', 'balancebadge', 'featherbadge', 'mindbadge', 'rainbadge'],
  // Stage F0: the Frontier SLOT ORDER — facility ids, NOT item ids and
  // NOT an earn order. Slot i of badges.symbols belongs to facility
  // symbols[i] (its ITEMS row is the '<name>symbol' row above: tower ->
  // abilitysymbol, factory -> knowledgesymbol, arena -> gutssymbol,
  // dome -> tacticssymbol, pike -> lucksymbol, palace -> spiritsymbol,
  // pyramid -> bravesymbol). Slots are UNORDERED: any facility can be
  // won in any order, so no prefix rule reads this list — the server
  // validator tier-checks the slots and gen-tables deliberately emits
  // NO badgeSequence for symbols.
  symbols: ['tower', 'factory', 'arena', 'dome', 'pike', 'palace', 'pyramid'],
};
export const ORANGE_BADGES = BADGE_SETS.orange;

export const POCKETS = ['balls', 'items', 'medicine', 'tm', 'hm', 'key', 'keepsakes'];
