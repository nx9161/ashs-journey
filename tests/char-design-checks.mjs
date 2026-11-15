// char-design-checks.mjs — the NAMED & SERVICE CHARACTER guard
// (War Room Wave W-CHAR2, NO-SAME-KIT fix sequence #7; C6 townsfolk
// section added by W-CHAR3, fix sequence #8). Run:
//   node tests/char-design-checks.mjs                  (exit 1 on failure)
//   node tests/char-design-checks.mjs --write-snapshot (T0 only: regenerate
//                                                       the invariant baseline)
//
// Why this exists: the NO-SAME-KIT audit (§2) measured 742 posted NPCs
// served by a clone-heavy cast — one clerk design on 50 posts, 354 of
// 594 named posts sharing an exact design with a different person.
// W-CHAR1 fixed the 23 posted bosses; W-CHAR2 gives every named person
// a distinct design (per-character cast-* kinds, T2–T4) and splits the
// service classes into per-region uniform kinds with personal palettes
// (T1). This guard is the ratchet that makes the burn-down permanent,
// in the W13 / gym-identity form: green at every merge, pins move only
// in-commit alongside the work that moves the measurement.
//
//   C1 closure — every scoped post resolves through kit-cast (no forge
//      fall-through), re-proving leader-cast L1 over the wider scope.
//   C2 named uniqueness (ratchet) — NAMED_DUP_GROUPS / NAMED_DUP_POSTS
//      must equal the pins exactly (50/354 at T0 → 0/0 at T4). Groups
//      whose posts are all the same person (same display name) are
//      correct-by-design and excluded, per the plan's census.
//   C3 service ceiling (ratchet) — SERVICE_DUP_POSTS pin (116 at T0 →
//      0 at T1), SERVICE_MAX_DESIGN_POSTS pin (50 at T0 → ≤3 at T1),
//      and no service design repeated within one map (measured 0 at
//      T0; armed at its final form from the start).
//   C4 cast registry — every cast-* kind and every per-region service
//      kind (clerk-/attendant-/host-<region>) carried by a scoped post
//      is registered in BOTH NPC_SWAP_KEYS and KIT_CAST_SPEC in
//      src/engine/art.mjs, and the set in use equals the pinned
//      registry (empty at T0; tranches add their kinds in-commit).
//   C5 invariants — every scoped post is pinned against the T0
//      snapshot (tests/char-design-snapshot.json): map, position, dir,
//      name, dialogue, event/quest/tale linkage, story-slug fields and
//      trainer linkage hash-identical; the ONLY fields that may ever
//      differ are the design fields (art + skin/shirt/pants/hair),
//      and only on posts listed in SPEC_DESIGN_EXCEPTIONS below (each
//      entry lands in-commit with its tranche, disclosed in its
//      checklist). The actor-lifecycle default tables
//      (ACTOR_DEFAULTS + ACTOR_FLAG_DEFAULTS) are hash-pinned too.
//   R  registers (Director rulings, 2026-11-15) — ferry captains
//      (CAPT …) classify NAMED; gym attendants classify SERVICE.
//   C6 townsfolk (W-CHAR3 closure) — the GENERIC register (posts in
//      neither W2 register: no personal name after class-prefix
//      stripping, no service function) pinned at its measured final
//      form: 10 posts / 10 designs, no duplicate groups, max 1 post
//      per design, no design repeated within one map, and — the hole
//      C2/C3 could not see — no generic design key equal to any named
//      or service design key (GENERIC_CROSS_REGISTER_COLLISIONS,
//      measured 2 at W3 T0: moon2#1 SCIENTIST ≡ cinnabar#1 TOM and
//      violet#0 MONK SAGE ≡ ecruteak#0 SAGE OF THE BELLS; burned to 0
//      by palette-varianting the two generic posts, design fields
//      only). The C5 snapshot covers the 10 generic posts from W3 T0
//      on, under the same hash discipline and exceptions list.
//
// Census assembly is byte-for-byte the leader-cast assembly (merged
// MAPS via maps.mjs + maps2–9 in merge order, + JOHTO/HOENN/SINNOH_NPCS
// + TALE_NPCS + PARLEY_NPCS + the 2 Frontier Brain posts extracted
// from frontier.mjs literals), _cloneIx stamped exactly as loadMap
// stamps it, design resolved by the engine's own path — so this suite
// and leader-cast can never drift on what a "post" is. Classification
// is the W-CHAR2 plan's: function first (kind nurse/clerk or a
// counter-role word in the name → service), then a personal name after
// stripping trainer-class prefixes → named, else generic (W3 scope).

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(join(ROOT, p));
const sha = (s) => createHash('sha256').update(s).digest('hex');

// ---------- ratchet pins (T0: measured on main 49463353) ----------
const PIN = {
  NAMED_POSTS: 594,
  NAMED_DESIGNS: 551, // T4: 537 + 14 tail kinds (wave final: every distinct named person uniquely designed)
  SERVICE_POSTS: 131,
  SERVICE_DESIGNS: 69,
  SCOPE_POSTS: 725,
  NAMED_DUP_GROUPS: 0, // T4: 8 - 8 retired tail groups (FINAL — no design shared by 2+ distinct named persons)
  NAMED_DUP_POSTS: 0, // T4: 23 - 23 retired tail posts (FINAL)
  SERVICE_DUP_POSTS: 99,
  SERVICE_MAX_DESIGN_POSTS: 3,
  SERVICE_TOWN_REPEAT_PAIRS: 0,
  // W-CHAR3 C6 townsfolk pins (measured on main aaae0042):
  GENERIC_POSTS: 10,
  GENERIC_DESIGNS: 10,
  EXEMPT_POSTS: 7, // count-only — exempt designs belong to the Kin/furniture guards
  GENERIC_DUP_GROUPS: 0,
  GENERIC_DUP_POSTS: 0,
  GENERIC_MAX_DESIGN_POSTS: 1,
  GENERIC_TOWN_REPEAT_PAIRS: 0,
  GENERIC_CROSS_REGISTER_COLLISIONS: 0, // W3 T0 measured 2; burned to 0 by the 2 palette variants in this closure (FINAL)
};
// C4: cast-*/service-region kinds in use, pinned. T1: the 14 service
// kinds (clerk/attendant/host × region; Trial Grounds is the game's
// sixth region block — T0's region list predated the service census
// isolating its 8 clerk posts, so CAST_KIND_RE below carries 'trial'
// from T1, disclosed in the T1 checklist).
// T2: + 144 cast-* kinds (named crowd I: 143 persons of the lady/
// elder/worker/youngster/hiker groups + cast-gensai, the measured
// clone-breaker side-effect repair disclosed in the T2 checklist).
// T3: + 116 cast-* kinds (named crowd II: the sailor/lass/gent/kid/
// ranger/scientist/fisher groups; YOUNGSTER TAM and METEOR WATCHER
// SOL repoint onto their existing T2 kinds, no new kind).
// T4: + 14 cast-* kinds (named tail: monk/bugcatcher/aide/grunt/
// camper/officer/swimmer groups; BUG MANIAC FERN's two posts share
// her one kind — same person, one design).
const PINNED_CAST_KINDS = ['attendant-amber', 'attendant-borea', 'attendant-maris', 'attendant-yamato', 'cast-ada', 'cast-amara', 'cast-ana', 'cast-ana-lass', 'cast-ana-pilgrim', 'cast-ana-regal', 'cast-ana-swimmer', 'cast-anka', 'cast-anselm', 'cast-anselm-tower', 'cast-anthea', 'cast-asha', 'cast-asha-crater', 'cast-bly', 'cast-blythe', 'cast-bo-cycling', 'cast-bo-rancher', 'cast-bo-swimmer', 'cast-bo-trainee', 'cast-bo-triathlete', 'cast-borin', 'cast-bram-foreman', 'cast-bram-miner', 'cast-bram-oldhand', 'cast-bramble', 'cast-bramble-lakeside', 'cast-bran', 'cast-brant', 'cast-breakwater', 'cast-brin-ash', 'cast-brin-warehouse', 'cast-brine', 'cast-bryn-ashwalker', 'cast-bryn-hiker', 'cast-bryn-stall', 'cast-bryn-tunneler', 'cast-cal', 'cast-cal-excavator', 'cast-chairman', 'cast-chiemi', 'cast-cole', 'cast-colm', 'cast-coralie', 'cast-corin', 'cast-dara', 'cast-deepkeeper', 'cast-del-causeway', 'cast-del-swimmer', 'cast-doss-gamer', 'cast-doss-harbour', 'cast-doss-hiker', 'cast-dunebergamot', 'cast-dunekumq', 'cast-dunepumm', 'cast-dunesham', 'cast-dunmore', 'cast-dust-hiker', 'cast-dust-ruin', 'cast-earl', 'cast-elder-den', 'cast-elder-move', 'cast-elder-pip', 'cast-elias', 'cast-elias-historian', 'cast-ember', 'cast-ember-sailor', 'cast-fen', 'cast-fenn-bird', 'cast-fenn-gardener', 'cast-fenn-lake', 'cast-fenn-meadow', 'cast-fern-aide', 'cast-fern-lab', 'cast-fern-maniac', 'cast-ferryman', 'cast-festustrov', 'cast-festusvale', 'cast-frost', 'cast-frostkeeper', 'cast-fuego', 'cast-fuji', 'cast-gail', 'cast-garr', 'cast-gateguard', 'cast-gensai', 'cast-gorannave', 'cast-goranpumm', 'cast-gorantrov', 'cast-hald', 'cast-halden', 'cast-hale', 'cast-hana', 'cast-hana-florist', 'cast-harlow', 'cast-herald', 'cast-hollis', 'cast-host', 'cast-hugo', 'cast-ilse', 'cast-ilse-historian', 'cast-ines', 'cast-io-runner', 'cast-io-trend', 'cast-io-warden', 'cast-iris', 'cast-jonas', 'cast-jun', 'cast-juniper-host', 'cast-juniper-tech', 'cast-juno-mechanic', 'cast-juno-turbine', 'cast-keeper-daycare', 'cast-kest', 'cast-kestrel', 'cast-kett-sailor', 'cast-kio', 'cast-kit', 'cast-kobe', 'cast-li', 'cast-lilofire', 'cast-lilomika', 'cast-lilonave', 'cast-lio-apprentice', 'cast-lio-berry', 'cast-lio-camper', 'cast-lio-fisher', 'cast-lio-streak', 'cast-liv', 'cast-log', 'cast-luna', 'cast-lux', 'cast-maizie', 'cast-mara-curator', 'cast-mara-dive', 'cast-mara-producer', 'cast-maraval', 'cast-maren', 'cast-marina-ice', 'cast-marinabergamot', 'cast-marinapumm', 'cast-marl', 'cast-mary-fan', 'cast-masa-cook', 'cast-masa-master', 'cast-masa-spring', 'cast-meridian', 'cast-mina', 'cast-mira', 'cast-mira-fest', 'cast-mira-jogger', 'cast-mira-lass', 'cast-mira-oldale', 'cast-mire', 'cast-mirel', 'cast-momoko', 'cast-moss', 'cast-moss-school', 'cast-moss-spring', 'cast-nia', 'cast-norn', 'cast-northstar', 'cast-oda', 'cast-odo-burner', 'cast-odo-tracker', 'cast-official', 'cast-okonkwo', 'cast-oktay', 'cast-olin', 'cast-onen', 'cast-oona', 'cast-orbit', 'cast-orin-bee', 'cast-orr', 'cast-oss', 'cast-ossa', 'cast-ossa-dragon', 'cast-ossa-ruin', 'cast-ossian', 'cast-pavel', 'cast-pell', 'cast-pell-norwick', 'cast-petra', 'cast-picokumq', 'cast-pike', 'cast-piotr-host', 'cast-piotr-uncle', 'cast-piotr-warden', 'cast-pip', 'cast-poppy', 'cast-pran', 'cast-reed', 'cast-regaltrov', 'cast-regalvale', 'cast-ren', 'cast-rhea', 'cast-rosa', 'cast-rose', 'cast-rue', 'cast-rue-apprentice', 'cast-rue-caspian', 'cast-rue-charcutter', 'cast-rue-condo', 'cast-rue-cutter', 'cast-rue-lass', 'cast-rue-youngster', 'cast-ryu', 'cast-sable', 'cast-sakura', 'cast-sato', 'cast-seth', 'cast-sol-apprentice', 'cast-sol-beach', 'cast-sol-fan', 'cast-sol-guide', 'cast-sol-hiker', 'cast-sol-meteor', 'cast-sol-pond', 'cast-sol-statue', 'cast-sola', 'cast-sola-picnic', 'cast-sola-sun', 'cast-sola-wanderer', 'cast-solange', 'cast-solene', 'cast-solenne', 'cast-solvi', 'cast-sora', 'cast-sorrel', 'cast-sorrel-aide', 'cast-sorrel-climber', 'cast-sula-boatman', 'cast-sula-boatwoman', 'cast-sutter', 'cast-tam', 'cast-tam-grounds', 'cast-tam-host', 'cast-tess', 'cast-theo', 'cast-tov', 'cast-towerkeep', 'cast-ulamae', 'cast-ulo', 'cast-umber', 'cast-ume', 'cast-una', 'cast-una-commuter', 'cast-una-daycare', 'cast-veda', 'cast-veda-soaker', 'cast-vesk-crier', 'cast-vesk-intern', 'cast-vesk-ski', 'cast-vex', 'cast-vey', 'cast-volta', 'cast-voltakeeper', 'cast-voss', 'cast-vul', 'cast-wade', 'cast-westwind', 'cast-willow', 'cast-wren-breeder', 'cast-wren-cartographer', 'cast-wren-catcher', 'cast-wren-coast', 'cast-wren-fest', 'cast-wren-float', 'cast-wren-florist', 'cast-wren-hiker', 'cast-wren-scout', 'cast-wren-treehouse', 'cast-yara', 'cast-yuki', 'cast-yuki-fan', 'clerk-amber', 'clerk-arden', 'clerk-borea', 'clerk-maris', 'clerk-trial', 'clerk-yamato', 'host-arden', 'host-borea', 'host-maris', 'host-yamato'];
// C5: post keys (map#ordinal) whose DESIGN fields may differ from the
// T0 snapshot. T0: none — any design-field change fails. Tranches add
// their spec-listed posts here in-commit, disclosed in the checklist.
// T2 adds 158 keys: the 156 repointed crowd-I posts, FLORIST WREN's
// same-person spillover post (house-oldale#0), and ecruteak#5 (ELDER
// GENSAI — the clone-breaker repair). Two of the 158 also carry a
// shirt-palette split (blackthorn#1, sendoff-spring#0).
// T3 adds 138 keys: the 133 repointed crowd-II posts plus 5
// same-person spillover posts (canalave#4 SAILOR BRINE, canalave#5
// SAILOR LUNA, league-evergrande#5 SUTTER, cerulean#6 + moro#4 PIP).
// No palette splits in T3; the full design-by-design census diff vs
// main measured exactly these 138 changes and zero side effects.
// T4 adds 15 keys: the 15 repointed tail posts (BUG MANIAC FERN's
// two posts both listed). No palette splits in T4; the census diff
// vs main measured exactly these 15 changes and zero side effects.
// W-CHAR3 adds 2 keys: the 2 generic cross-register colliders,
// palette-varianted design-fields-only (moon2#1 SCIENTIST hair →
// grey #8a8a8a — the scientist kind force-fixes the lab-coat shirt
// in KIT_CAST_SPEC, so hair is the free visible field; violet#0
// MONK SAGE shirt → saffron-rust robe #b85c2a). No kind changes,
// no other fields touched.
const SPEC_DESIGN_EXCEPTIONS = [
  'amity-square#0',
  'azalea#0',
  'azalea#1',
  'azalea#3',
  'bell-tower-1#0',
  'birch-lab#0',
  'birch-lab#1',
  'blackthorn#0',
  'blackthorn#1',
  'blackthorn#2',
  'canalave#0',
  'canalave#1',
  'canalave#2',
  'canalave#3',
  'canalave#4',
  'canalave#5',
  'canalave-library#0',
  'celadon#0',
  'celadon#1',
  'celadon#3',
  'celestic#0',
  'celestic#1',
  'celestic#2',
  'celestic#3',
  'celestic-shrine#0',
  'cerulean#0',
  'cerulean#6',
  'cherrygrove#3',
  'cianwood#0',
  'cianwood#1',
  'cianwood#2',
  'cianwood#3',
  'cinnabar#4',
  'contest-hearthome#0',
  'dance-theater#0',
  'dance-theater#1',
  'dark-cave#0',
  'daycare#0',
  'dewford#0',
  'dewford#1',
  'dewford#3',
  'dragons-den#0',
  'ecruteak#1',
  'ecruteak#2',
  'ecruteak#3',
  'ecruteak#4',
  'ecruteak#5',
  'elm-lab#1',
  'eterna#0',
  'eterna#1',
  'eterna#2',
  'eterna#3',
  'eterna-forest#0',
  'evergrande#0',
  'evergrande#1',
  'evergrande#2',
  'evergrande#3',
  'fallarbor#0',
  'fallarbor#1',
  'fallarbor#2',
  'fallarbor#3',
  'fight-area#0',
  'fight-area#1',
  'fight-area#2',
  'fire-isle#0',
  'floaroma#0',
  'floaroma#1',
  'floaroma#2',
  'floaroma#3',
  'fortree#0',
  'fortree#1',
  'fortree#2',
  'fortree#3',
  'frontier-arena#0',
  'frontier-dome#0',
  'frontier-factory#0',
  'frontier-palace#0',
  'frontier-pike#0',
  'frontier-pyramid#0',
  'frontier-tower#0',
  'frontierhub#0',
  'frontierhub#1',
  'frontierhub#2',
  'frontierhub#3',
  'frontierhub#4',
  'fuchsia#2',
  'fuego-ironworks#0',
  'fullmoon-island#0',
  'fullmoon-island#1',
  'galactic-eterna#0',
  'galactic-hq#0',
  'gamecorner#0',
  'gamecorner#1',
  'gamecorner#2',
  'goldenrod#0',
  'goldenrod#1',
  'goldenrod#4',
  'goldenrod-underground-1#0',
  'goldenrod-underground-2#0',
  'great-marsh-gate#0',
  'gym-azalea#0',
  'gym-blackthorn#0',
  'gym-canalave#0',
  'gym-canalave#2',
  'gym-cianwood#0',
  'gym-dewford#0',
  'gym-ecruteak#0',
  'gym-eterna#0',
  'gym-fortree#0',
  'gym-goldenrod#0',
  'gym-hearthome#0',
  'gym-lavaridge#0',
  'gym-mahogany#0',
  'gym-mauville#0',
  'gym-mossdeep#0',
  'gym-olivine#0',
  'gym-oreburgh#0',
  'gym-pastoria#0',
  'gym-petalburg#0',
  'gym-rustboro#0',
  'gym-snowpoint#0',
  'gym-sootopolis#0',
  'gym-sunnyshore#0',
  'gym-veilstone#0',
  'gym-violet#0',
  'hearthome#0',
  'hearthome#1',
  'hearthome#2',
  'hearthome#3',
  'house-azalea#0',
  'house-blackthorn#0',
  'house-canalave#0',
  'house-cherrygrove#0',
  'house-cianwood#0',
  'house-ecruteak#0',
  'house-eterna#0',
  'house-fight#0',
  'house-floaroma#0',
  'house-fuchsia#0',
  'house-hearthome#0',
  'house-hearthome-poffin#0',
  'house-jubilife#0',
  'house-jubilife-condo#0',
  'house-kumquat#0',
  'house-lavaridge#0',
  'house-littleroot#0',
  'house-littleroot-rival#0',
  'house-mikan#0',
  'house-newbark#0',
  'house-oldale#0',
  'house-olivine#0',
  'house-oreburgh#0',
  'house-pastoria#0',
  'house-petalburg#0',
  'house-resort-villa#0',
  'house-rustboro#0',
  'house-sandgem#0',
  'house-shamouti#0',
  'house-silvertown#0',
  'house-slateport#0',
  'house-snowpoint#0',
  'house-solaceon#0',
  'house-sunnyshore#0',
  'house-twinleaf#0',
  'house-twinleaf-rival#0',
  'house-valencia#0',
  'house-veilstone#0',
  'house-violet#0',
  'ice-isle#0',
  'ice-isle#1',
  'ilex-forest#1',
  'indigo#0',
  'indigo#1',
  'iron-island#0',
  'iron-island#1',
  'jagged-pass#0',
  'jubilife#0',
  'jubilife#1',
  'jubilife#3',
  'jubilife-tv#0',
  'kumquat#0',
  'kumquat#1',
  'kumquat#4',
  'kumquat-gym#1',
  'kurt-house#0',
  'lake-of-rage#0',
  'lake-valor#0',
  'lake-valor#1',
  'lake-verity#0',
  'lavaridge#0',
  'lavaridge#1',
  'lavaridge#2',
  'lavaridge#3',
  'lavender#2',
  'league-evergrande#0',
  'league-evergrande#1',
  'league-evergrande#2',
  'league-evergrande#5',
  'league-lobby#0',
  'league-lobby#1',
  'lighthouse-1#0',
  'lighthouse-2#0',
  'lightning-isle#0',
  'lightning-isle#1',
  'lilycove#0',
  'lilycove#1',
  'lilycove#2',
  'lilycove#3',
  'littleroot#0',
  'littleroot#1',
  'littleroot#2',
  'littleroot#3',
  'mahogany#0',
  'mahogany#1',
  'mahogany#2',
  'mahogany#4',
  'mauville#0',
  'mauville#1',
  'mauville#2',
  'mauville#3',
  'meteor-falls#0',
  'mikan#0',
  'mikan#1',
  'mikan#4',
  'mikan-gym#1',
  'moon2#1',
  'moro#0',
  'moro#1',
  'moro#2',
  'moro#4',
  'mossdeep#0',
  'mossdeep#1',
  'mossdeep#2',
  'mossdeep#3',
  'mt-chimney#0',
  'mt-mortar-1#0',
  'mt-pyre#0',
  'mt-silver#0',
  'national-park#1',
  'national-park#2',
  'navel#0',
  'navel#1',
  'navel#2',
  'navel#3',
  'navel-gym#1',
  'newbark#0',
  'newbark#1',
  'newisland#0',
  'newmoon-island#0',
  'oldale#0',
  'oldale#1',
  'oldale#2',
  'oldale#3',
  'olivine#2',
  'olivine#4',
  'oreburgh#0',
  'oreburgh#1',
  'oreburgh#2',
  'oreburgh#3',
  'oreburgh-mine#0',
  'pacifidlog#0',
  'pacifidlog#1',
  'pacifidlog#2',
  'pacifidlog#3',
  'pallet#0',
  'pallet#5',
  'pastoria#0',
  'pastoria#1',
  'pastoria#3',
  'petalburg#0',
  'petalburg#2',
  'petalburg#3',
  'petalburg-woods#0',
  'pewter#0',
  'pokemon-league#0',
  'pummelo#0',
  'pummelo#1',
  'pummelo#2',
  'pummelo#3',
  'pummelo#5',
  'r101#0',
  'r102#0',
  'r102#1',
  'r103#0',
  'r104#0',
  'r104#1',
  'r110#0',
  'r110#1',
  'r111#0',
  'r111#1',
  'r112#0',
  'r113#0',
  'r114#0',
  'r115#0',
  'r116#0',
  'r117#0',
  'r118#0',
  'r119#0',
  'r120#0',
  'r121#0',
  'r121#1',
  'r123#0',
  'r201#0',
  'r202#0',
  'r203#0',
  'r204#0',
  'r205#0',
  'r206#0',
  'r207#0',
  'r208#0',
  'r209#0',
  'r210#0',
  'r210-north#0',
  'r211#0',
  'r212#0',
  'r212-south#0',
  'r213#0',
  'r214#0',
  'r215#0',
  'r216#0',
  'r217#0',
  'r218#0',
  'r221#0',
  'r222#0',
  'r224#0',
  'r225#0',
  'r227#0',
  'r228#0',
  'r31#0',
  'r32#0',
  'r33#0',
  'r34#0',
  'r35#0',
  'r36#0',
  'r37#0',
  'r38#0',
  'r39#0',
  'r42#0',
  'r43#0',
  'r44#0',
  'r45#0',
  'radio-tower-1#0',
  'radio-tower-3#0',
  'resort-area#0',
  'resort-area#1',
  'resort-area#2',
  'rocktunnel#0',
  'route-silver#0',
  'route11#0',
  'route20#0',
  'route3#0',
  'route4#1',
  'route7#0',
  'route8#1',
  'route9#0',
  'route9#1',
  'route22#0',
  'rowan-lab#0',
  'rowan-lab#1',
  'rustboro#0',
  'rustboro#1',
  'rustboro#2',
  'rustboro#3',
  'rusturf-tunnel#0',
  'saffron#2',
  'sandgem#0',
  'sandgem#1',
  'sandgem#2',
  'sandgem#3',
  'sendoff-spring#0',
  'shamouti#0',
  'shamouti#1',
  'shamouti#2',
  'shamouti#3',
  'shamouti#5',
  'silph1#0',
  'silph1#2',
  'silver-stadium#0',
  'silver-stadium#1',
  'silvertown#0',
  'silvertown#1',
  'silvertown#2',
  'slateport#0',
  'slateport#1',
  'slateport#2',
  'slateport#3',
  'slateport#4',
  'snowpoint#0',
  'snowpoint#1',
  'snowpoint#2',
  'snowpoint#3',
  'solaceon#0',
  'solaceon#1',
  'solaceon#2',
  'solaceon#3',
  'sootopolis#0',
  'sootopolis#1',
  'sootopolis#2',
  'sootopolis#3',
  'spring-path#0',
  'sprout-tower-1#0',
  'sprout-tower-2#2',
  'stark-mountain#0',
  'sunnyshore#0',
  'sunnyshore#1',
  'sunnyshore#2',
  'sunnyshore#3',
  'sunnyshore-lighthouse#0',
  'survival-area#0',
  'survival-area#1',
  'survival-area#2',
  'tower2#0',
  'trovita#0',
  'trovita#1',
  'trovita#2',
  'trovita#5',
  'trovita-gym#1',
  'twinleaf#0',
  'twinleaf#1',
  'twinleaf#2',
  'twinleaf#3',
  'twinleaf#4',
  'valencia#5',
  'valley-windworks#0',
  'veilstone#0',
  'veilstone#1',
  'veilstone#2',
  'veilstone#3',
  'verdanturf#0',
  'verdanturf#1',
  'verdanturf#2',
  'verdanturf#3',
  'vermilion#0',
  'vermilion#3',
  'vermilion#4',
  'violet#0',
  'violet#1',
  'violet#2',
  'violet#3',
  'viridian#1',
  'whirl-islands-2#0',
];

// ---------- census, assembled per map in loadMap order ----------
const { MAPS } = await imp('src/data/maps.mjs');
for (let i = 2; i <= 9; i++) {
  const m = await imp(`src/data/maps${i}.mjs`);
  Object.assign(MAPS, m[`MAPS${i}`]);
}
const { JOHTO_NPCS } = await imp('src/data/story-johto.mjs');
const { HOENN_NPCS } = await imp('src/data/story-hoenn.mjs');
const { SINNOH_NPCS } = await imp('src/data/story-sinnoh.mjs');
const { TALE_NPCS } = await imp('src/data/quests.mjs');
const { PARLEY_NPCS } = await imp('src/game/bonds.mjs');
const art = await imp('src/engine/art.mjs');
const { npcArtKind, kitCastVariant, npcSwapFor, KIT_CAST_EXCEPTIONS } = art;
const { ACTOR_DEFAULTS, ACTOR_FLAG_DEFAULTS } = await imp('src/game/actors.mjs');

const byMap = new Map();
const put = (map, npc) => {
  if (!byMap.has(map)) byMap.set(map, []);
  byMap.get(map).push({ map, ...npc });
};
for (const [id, m] of Object.entries(MAPS)) for (const n of (m.npcs || [])) put(id, n);
for (const arr of [JOHTO_NPCS, HOENN_NPCS, SINNOH_NPCS, TALE_NPCS, PARLEY_NPCS])
  for (const n of arr) if (n.map) put(n.map, n);
// Frontier Brain posts (conditional; literals extracted from source —
// if the literal shape changes, extraction finds != 2 and C1 fails
// loudly, on purpose; same contract as leader-cast L1).
const frontierSrc = fs.readFileSync(join(ROOT, 'src/game/frontier.mjs'), 'utf8');
const brainRe = /name: '([A-Z]+)', x: [^,]+, y: [^,]+, art: '([a-z]+)', dir: 'down', frontierBrain: '(pike|pyramid)',\s+skin: '(#[0-9a-f]+)', shirt: '(#[0-9a-f]+)', pants: '(#[0-9a-f]+)', hair: '(#[0-9a-f]+)'/g;
const brainPosts = [];
for (const m of frontierSrc.matchAll(brainRe)) {
  brainPosts.push({ map: m[3] === 'pike' ? 'frontier-pike' : 'frontier-pyramid-a', name: m[1], art: m[2], skin: m[4], shirt: m[5], pants: m[6], hair: m[7] });
}
for (const b of brainPosts) put(b.map, b);

// stamp _cloneIx per map exactly as loadMap does; key = map#ordinal
const posts = [];
for (const [map, list] of byMap) {
  const seen = new Map();
  list.forEach((n, ix) => {
    const key = (n.art || '') + '|' + [n.skin, n.shirt, n.pants, n.hair].join('/');
    n._cloneIx = seen.get(key) || 0;
    seen.set(key, n._cloneIx + 1);
    n._key = `${map}#${ix}`;
    posts.push(n);
  });
}

const designKey = (n) => {
  const kind = npcArtKind(n);
  if (kind === 'pc' || KIT_CAST_EXCEPTIONS.has(kind)) return 'EXEMPT:' + kind;
  const v = kitCastVariant(n, kind);
  if (v) return kind + '|' + v.key;
  const sw = npcSwapFor(n, kind);
  if (sw) return kind + '|AUTH|' + JSON.stringify(sw);
  return kind + '|FORGE';
};

// ---- classification (W-CHAR2 plan §1, verbatim) ----
const SERVICE_NAME_RE = /CLERK|NURSE|REGISTRAR|RECEPTIONIST|CASHIER|VENDOR|ATTENDANT|CONCIERGE|HOSTESS|TICKET|AGENT|PHARMACIST/;
const CLASS_PREFIXES = ['ACE TRAINER', 'BUG CATCHER', 'KIMONO GIRL', 'BLACK BELT', 'YOUNGSTER', 'LASS', 'HIKER', 'SAILOR', 'LADY', 'GENT', 'GENTLEMAN', 'WORKER', 'SCIENTIST', 'FISHER', 'FISHERMAN', 'CAMPER', 'BIKER', 'RANGER', 'TWIN', 'KID', 'ELDER', 'MONK', 'SWIMMER', 'PICNICKER', 'OFFICER', 'GRUNT', 'COACH', 'AIDE', 'TRAINER', 'FAN', 'BOY', 'GIRL', 'MAN', 'WOMAN', 'MR.', 'MRS.', 'MISS', 'DR.', 'PROF.', 'PROFESSOR', 'CAPTAIN', 'CHIEF', 'GUARD', 'WAITER', 'WAITRESS', 'CHEF', 'ARTIST', 'DANCER', 'MUSICIAN', 'STUDENT', 'TEACHER', 'FARMER', 'RANCHER', 'BREEDER', 'COLLECTOR', 'MANIAC', 'ADEPT', 'TAMER', 'MASTER', 'SAGE', 'MEDIUM', 'PSYCHIC', 'HEX', 'BEAUTY', 'SWIMMER', 'TUBER', 'RUIN', 'DRAGON', 'BIRD', 'POKE', 'CHANNELER', 'ENGINEER', 'PAINTER', 'GUITARIST', 'JUGGLER', 'FIREBREATHER', 'BURGLAR', 'GAMBLER', 'FISHER'];
function classify(n) {
  const kind = npcArtKind(n);
  if (kind === 'pc' || KIT_CAST_EXCEPTIONS.has(kind)) return 'exempt';
  const name = (n.name || '').toUpperCase().trim();
  // T1: the per-region service kinds are the 'clerk' kind's successors
  // — posts T0 classified by kind==='clerk' whose names carry no
  // counter-role word (GYM GUIDE, LEAGUE GUIDE, DEPT MANAGER VEE,
  // SHOPKEEPER PELL) stay SERVICE on their region kinds, so the T0
  // classification (and every named pin) is preserved exactly.
  if (kind === 'nurse' || kind === 'clerk' || /^(clerk|attendant|host)-/.test(kind) || SERVICE_NAME_RE.test(name)) return 'service';
  if (!name) return 'generic';
  let rest = name;
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const p of CLASS_PREFIXES) {
      if (rest === p) return 'generic';
      if (rest.startsWith(p + ' ')) { rest = rest.slice(p.length + 1); stripped = true; }
    }
  }
  return 'named';
}

for (const n of posts) {
  n._kind = npcArtKind(n);
  n._design = designKey(n);
  n._class = classify(n);
}
const named = posts.filter((p) => p._class === 'named');
const service = posts.filter((p) => p._class === 'service');
const scope = posts.filter((p) => p._class === 'named' || p._class === 'service');
const generic = posts.filter((p) => p._class === 'generic'); // W-CHAR3 scope (C6)
const exempt = posts.filter((p) => p._class === 'exempt');

function dupGroups(list, samePersonOk) {
  const g = new Map();
  for (const p of list) {
    if (!g.has(p._design)) g.set(p._design, []);
    g.get(p._design).push(p);
  }
  const groups = [];
  for (const [design, ps] of g) {
    if (ps.length < 2) continue;
    const names = new Set(ps.map((p) => (p.name || '').toUpperCase()));
    if (samePersonOk && names.size < 2) continue;
    groups.push({ design, posts: ps.length });
  }
  return groups;
}

// ---------- invariant snapshot (C5) ----------
const DESIGN_FIELDS = ['art', 'skin', 'shirt', 'pants', 'hair'];
function stable(v, seen = new Set()) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'function') return '"[fn]"';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (seen.has(v)) return '"[circular]"';
  seen.add(v);
  let out;
  if (Array.isArray(v)) out = '[' + v.map((x) => stable(x, seen)).join(',') + ']';
  else out = '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k], seen)).join(',') + '}';
  seen.delete(v);
  return out;
}
function postHashes(n) {
  const inv = {};
  for (const k of Object.keys(n)) {
    if (k === 'map' || k === '_cloneIx' || k.startsWith('_')) continue;
    if (DESIGN_FIELDS.includes(k)) continue;
    inv[k] = n[k];
  }
  const design = {};
  for (const f of DESIGN_FIELDS) design[f] = n[f] === undefined ? null : n[f];
  return { inv: sha(stable(inv)), design: sha(stable(design)) };
}
const actorHash = sha(stable({ ACTOR_DEFAULTS, ACTOR_FLAG_DEFAULTS }));
const SNAP_PATH = join(ROOT, 'tests', 'char-design-snapshot.json');

if (process.argv.includes('--write-snapshot')) {
  const snap = { wave: 'W-CHAR2 T0 + W-CHAR3 T0', base: '49463353', actorHash, posts: {} };
  for (const n of [...scope, ...generic]) snap.posts[n._key] = { name: n.name || '', ...postHashes(n) };
  fs.writeFileSync(SNAP_PATH, JSON.stringify(snap, null, 1) + '\n');
  console.log(`char-design snapshot written: ${scope.length + generic.length} posts (W2 scope + W3 generic), actorHash ${actorHash.slice(0, 12)}…`);
  process.exit(0);
}

// ---------- checks ----------
let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) pass++;
  else { fail++; failures.push(label); }
}

// census pins
ok(posts.length === 742, `census: 742 total posts (got ${posts.length})`);
ok(named.length === PIN.NAMED_POSTS, `census pin: named posts ${PIN.NAMED_POSTS} (got ${named.length})`);
ok(new Set(named.map((p) => p._design)).size === PIN.NAMED_DESIGNS, `census pin: named designs ${PIN.NAMED_DESIGNS} (got ${new Set(named.map((p) => p._design)).size})`);
ok(service.length === PIN.SERVICE_POSTS, `census pin: service posts ${PIN.SERVICE_POSTS} (got ${service.length})`);
ok(new Set(service.map((p) => p._design)).size === PIN.SERVICE_DESIGNS, `census pin: service designs ${PIN.SERVICE_DESIGNS} (got ${new Set(service.map((p) => p._design)).size})`);
ok(scope.length === PIN.SCOPE_POSTS, `census pin: scope posts ${PIN.SCOPE_POSTS} (got ${scope.length})`);
ok(generic.length === PIN.GENERIC_POSTS, `census pin: generic posts ${PIN.GENERIC_POSTS} (got ${generic.length})`);
ok(new Set(generic.map((p) => p._design)).size === PIN.GENERIC_DESIGNS, `census pin: generic designs ${PIN.GENERIC_DESIGNS} (got ${new Set(generic.map((p) => p._design)).size})`);
ok(exempt.length === PIN.EXEMPT_POSTS, `census pin: exempt posts ${PIN.EXEMPT_POSTS} (got ${exempt.length})`);
ok(brainPosts.length === 2, `census: expected 2 Frontier Brain posts extracted, got ${brainPosts.length}`);

// C1 closure
let forge = 0;
for (const n of scope) {
  if (n._design.endsWith('|FORGE')) {
    forge++;
    ok(false, `C1 forge-placeholder post: ${n.name || '(unnamed)'} @ ${n.map} kind=${n._kind}`);
  }
}
ok(forge === 0, `C1: ${forge} scoped posts render via the forge placeholder`);

// C2 named uniqueness (ratchet)
const nGroups = dupGroups(named, true);
const nDupPosts = nGroups.reduce((a, g) => a + g.posts, 0);
ok(nGroups.length === PIN.NAMED_DUP_GROUPS, `C2 ratchet: NAMED_DUP_GROUPS ${PIN.NAMED_DUP_GROUPS} (measured ${nGroups.length})`);
ok(nDupPosts === PIN.NAMED_DUP_POSTS, `C2 ratchet: NAMED_DUP_POSTS ${PIN.NAMED_DUP_POSTS} (measured ${nDupPosts})`);

// C3 service ceiling (ratchet)
const sGroups = dupGroups(service, false);
const sDupPosts = sGroups.reduce((a, g) => a + g.posts, 0);
const sMax = sGroups.reduce((a, g) => Math.max(a, g.posts), 0);
ok(sDupPosts === PIN.SERVICE_DUP_POSTS, `C3 ratchet: SERVICE_DUP_POSTS ${PIN.SERVICE_DUP_POSTS} (measured ${sDupPosts})`);
ok(sMax === PIN.SERVICE_MAX_DESIGN_POSTS, `C3 ratchet: SERVICE_MAX_DESIGN_POSTS ${PIN.SERVICE_MAX_DESIGN_POSTS} (measured ${sMax})`);
const svcTown = new Map();
for (const p of service) {
  const k = p._design + ' @ ' + p.map;
  svcTown.set(k, (svcTown.get(k) || 0) + 1);
}
const townRepeats = [...svcTown.values()].filter((v) => v >= 2).length;
ok(townRepeats === PIN.SERVICE_TOWN_REPEAT_PAIRS, `C3: service designs repeated within one map ${PIN.SERVICE_TOWN_REPEAT_PAIRS} (measured ${townRepeats})`);

// C6 townsfolk uniqueness + cross-register collisions (W-CHAR3 ratchet)
const gGroups = dupGroups(generic, false);
const gDupPosts = gGroups.reduce((a, g) => a + g.posts, 0);
const gDesignCounts = new Map();
for (const p of generic) gDesignCounts.set(p._design, (gDesignCounts.get(p._design) || 0) + 1);
const gMax = Math.max(0, ...gDesignCounts.values());
ok(gGroups.length === PIN.GENERIC_DUP_GROUPS, `C6 ratchet: GENERIC_DUP_GROUPS ${PIN.GENERIC_DUP_GROUPS} (measured ${gGroups.length})`);
ok(gDupPosts === PIN.GENERIC_DUP_POSTS, `C6 ratchet: GENERIC_DUP_POSTS ${PIN.GENERIC_DUP_POSTS} (measured ${gDupPosts})`);
ok(gMax === PIN.GENERIC_MAX_DESIGN_POSTS, `C6 ratchet: GENERIC_MAX_DESIGN_POSTS ${PIN.GENERIC_MAX_DESIGN_POSTS} (measured ${gMax})`);
const genTown = new Map();
for (const p of generic) {
  const k = p._design + ' @ ' + p.map;
  genTown.set(k, (genTown.get(k) || 0) + 1);
}
const genTownRepeats = [...genTown.values()].filter((v) => v >= 2).length;
ok(genTownRepeats === PIN.GENERIC_TOWN_REPEAT_PAIRS, `C6: generic designs repeated within one map ${PIN.GENERIC_TOWN_REPEAT_PAIRS} (measured ${genTownRepeats})`);
const nsDesignKeys = new Set([...named, ...service].map((p) => p._design));
const crossHits = generic.filter((p) => nsDesignKeys.has(p._design));
ok(crossHits.length === PIN.GENERIC_CROSS_REGISTER_COLLISIONS, `C6 ratchet: GENERIC_CROSS_REGISTER_COLLISIONS ${PIN.GENERIC_CROSS_REGISTER_COLLISIONS} (measured ${crossHits.length}${crossHits.length ? ': ' + crossHits.map((p) => p._key).join(', ') : ''})`);

// C4 cast registry — registration is verified against the art.mjs
// source tables (NPC_SWAP_KEYS / KIT_CAST_SPEC are module-const, not
// exported; both are single literal blocks).
const artSrc = fs.readFileSync(join(ROOT, 'src/engine/art.mjs'), 'utf8');
function tableBlock(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) return '';
  let depth = 0, j = src.indexOf('{', i);
  const start = j;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(start, j + 1);
  }
  return '';
}
const swapBlock = tableBlock(artSrc, 'const NPC_SWAP_KEYS =');
const specBlock = tableBlock(artSrc, 'const KIT_CAST_SPEC =');
ok(!!swapBlock && !!specBlock, 'C4: NPC_SWAP_KEYS and KIT_CAST_SPEC blocks found in art.mjs');
const inTable = (block, kind) => new RegExp(`['"]?${kind.replace(/[-]/g, '\\-')}['"]?\\s*:`).test(block);
const CAST_KIND_RE = /^cast-|^(clerk|attendant|host)-(arden|yamato|maris|borea|amber|trial)$/;
const usedCastKinds = [...new Set(scope.map((p) => p._kind).filter((k) => CAST_KIND_RE.test(k)))].sort();
for (const k of usedCastKinds) {
  ok(inTable(swapBlock, k), `C4 ${k}: registered in NPC_SWAP_KEYS`);
  ok(inTable(specBlock, k), `C4 ${k}: carries a KIT_CAST_SPEC entry`);
}
ok(JSON.stringify(usedCastKinds) === JSON.stringify([...PINNED_CAST_KINDS].sort()), `C4 registry pin: [${PINNED_CAST_KINDS.join(', ')}] (in use: [${usedCastKinds.join(', ')}])`);

// C5 invariants vs the T0 snapshot
const snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
ok(snap.actorHash === actorHash, 'C5: actor-lifecycle default tables hash-identical to T0');
const snapKeys = Object.keys(snap.posts);
ok(snapKeys.length === PIN.SCOPE_POSTS + PIN.GENERIC_POSTS, `C5: snapshot holds ${PIN.SCOPE_POSTS + PIN.GENERIC_POSTS} posts (${PIN.SCOPE_POSTS} W2 scope + ${PIN.GENERIC_POSTS} W3 generic; got ${snapKeys.length})`);
const exceptions = new Set(SPEC_DESIGN_EXCEPTIONS);
let invBad = 0, designBad = 0, missing = 0;
const seenKeys = new Set();
for (const n of [...scope, ...generic]) {
  seenKeys.add(n._key);
  const s = snap.posts[n._key];
  if (!s) { missing++; ok(false, `C5 post missing from snapshot: ${n._key} (${n.name || ''})`); continue; }
  const h = postHashes(n);
  if (h.inv !== s.inv) { invBad++; if (invBad <= 10) ok(false, `C5 invariant drift: ${n._key} (${n.name || ''}) — non-design field changed`); }
  if (h.design !== s.design && !exceptions.has(n._key)) { designBad++; if (designBad <= 10) ok(false, `C5 design change off-spec: ${n._key} (${n.name || ''}) — art/palette changed on a post no tranche spec lists`); }
}
ok(invBad === 0, `C5: ${invBad} scoped posts drifted in invariant fields`);
ok(designBad === 0, `C5: ${designBad} scoped posts changed design fields off-spec`);
ok(missing === 0 && snapKeys.every((k) => seenKeys.has(k)), 'C5: snapshot key set == live post key set (W2 scope + W3 generic; no post added, removed, or re-keyed)');

// R registers (Director rulings)
const capts = scope.filter((p) => /^CAPT\s/.test((p.name || '').toUpperCase()));
ok(capts.length > 0 && capts.every((p) => p._class === 'named'), `R1: all ${capts.length} ferry captains classify NAMED`);
const attendants = scope.filter((p) => /ATTENDANT/.test((p.name || '').toUpperCase()));
ok(attendants.length > 0 && attendants.every((p) => p._class === 'service'), `R2: all ${attendants.length} gym attendants classify SERVICE`);

console.log(`char-design census: ${posts.length} posts · named ${named.length}/${new Set(named.map((p) => p._design)).size} designs · service ${service.length}/${new Set(service.map((p) => p._design)).size} designs · generic ${generic.length}/${new Set(generic.map((p) => p._design)).size} designs · dup named ${nDupPosts} posts in ${nGroups.length} groups · dup service ${sDupPosts} posts, max design ${sMax} · dup generic ${gDupPosts} posts, cross-register collisions ${crossHits.length}`);
for (const f of failures.slice(0, 20)) console.log('FAIL', f);
console.log(`char-design-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
