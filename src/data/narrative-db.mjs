// src/data/narrative-db.mjs
// ============================================================================
// THE NARRATIVE DATABASE — the game's story architecture as DATA (MUSE
// directive Phase 5; Wave D). Arcs -> Volumes -> Chapters, derived from
// the shipped story tables (story.mjs CHAPTERS/ADR-015, arcs.mjs, the
// five regional story-*.mjs tables, quests.mjs Town Tales, frontier.mjs)
// — the same sources merge.mjs folds into the running game.
// tests/narrative-db-checks.mjs re-derives the mapping from those sources
// and fails on drift: edit the story tables, not this file, then refresh.
//
// DESIGN SEAM: the DB is the architecture + linkage layer (ids, order,
// dependencies, locations, cast, battles, mechanics, state flags). Prose
// presentation (hints, hooks, tale stages, arc step texts) stays single-
// sourced in the story tables, which the Quest Log already renders from;
// the DB never duplicates it, so the two can never drift apart.
//
// CANON DISCIPLINE (binding): every populated entry is the game's OWN
// original story, flagged canon: 'original'. canon: 'canon-structure'
// marks STRUCTURAL SLOTS ONLY — the sealed arcs (unova/kalos/alola/
// journeys/horizons) and their volumes, reserved for future verified
// material. No protected text, characters, or plot is stored or implied
// anywhere in this file. designedOnly legendary entries are design
// stubs the shipped LEGENDARY_ARCS tables themselves carry.
//
// SCHEMA (empty arrays and null flags are omitted on emission; readers
// treat a missing array as empty):
//   Arc:     { id, n, label, region, status, canon, completionFlag,
//              completionKey, volumes: [volumeIds] } (presentation and
//              badge metadata stays single-sourced in arcs.mjs)
//   Volume:  { id (the ADR-015 chapter id), n, arcId, act, canon,
//              events: [eventIds not owned by any chapter] }
//   Chapter: { id, arcId, volume (n), kind: 'main'|'legendary'|'tale'|'facility',
//              title, flag? (the completion flag, the quest tables' own name),
//              requiresFlags?: [flags], locations: [mapIds],
//              characters: [names], events: [merged EVENTS ids],
//              battles: [trainerIds], rivalBattles: [trainerIds],
//              wildBattles: [{species, level}], relationships: [bondNpcIds],
//              mechanics: [design-level tags], canon, bondNpc? (tales, raw source name),
//              symbolSlot? (facilities), designedOnly?, roaming?,
//              viaIntro? (the opening chapter completes via INTRO_SCRIPT) }
//
// VOLUME CONVENTIONS (asserted in the checks): one-volume arcs take
// their whole chain; Johto Vol 3 ends at the Fog Badge row, Vol 4 at
// the Rising Badge row, Vol 5 takes the rest; legendary chapters sit
// in their arc's LAST volume, Town Tales in its FIRST. Events are
// owned by the chapter whose quest/flag they complete (questDone >
// quest > flag link); the rest pool on the arc's first volume. Every
// merged EVENTS id appears exactly once across chapters + pools.
//
// The DB owns NO save state: the helpers below derive chapter state
// from the existing flag system (story.flags / story.quests /
// badges), mirroring the Quest Log — behavior and saves preserved.
// New arcs append as data; no engine changes.
// ============================================================================

import { arcStateOf, currentArcOf } from './arcs.mjs';

export const NARRATIVE_ARCS = [
{"id":"kanto","n":1,"label":"Arc 1","region":"Arden","status":"shipped","canon":"original","completionFlag":"champion","completionKey":"kanto","volumes":["indigo-league"]},
{"id":"orange","n":1.5,"label":"Arc 1.5","region":"Orange Islands","status":"next","canon":"original","completionFlag":"orange_champion","completionKey":"orange","volumes":["orange-islands"]},
{"id":"johto","n":2,"label":"Arc 2","region":"Johto","status":"shipped","canon":"original","completionFlag":"johto_complete","completionKey":"johto","volumes":["johto-journeys","johto-league-champions","master-quest"]},
{"id":"hoenn","n":3,"label":"Arc 3","region":"Hoenn","status":"shipped","canon":"original","completionFlag":"hoenn_complete","completionKey":"hoenn","volumes":["hoenn"]},
{"id":"frontier","n":3.5,"label":"Arc 3.5","region":"Battle Frontier","status":"shipped","canon":"original","completionFlag":"frontier_complete","completionKey":"frontier","volumes":["battle-frontier"]},
{"id":"sinnoh","n":4,"label":"Arc 4","region":"Sinnoh","status":"shipped","canon":"original","completionFlag":"sinnoh_complete","completionKey":"sinnoh","volumes":["sinnoh"]},
{"id":"unova","n":5,"label":"Arc 5","region":"Unova","status":"sealed","canon":"canon-structure","completionFlag":"unova_complete","completionKey":"unova","volumes":["unova"]},
{"id":"kalos","n":6,"label":"Arc 6","region":"Kalos","status":"sealed","canon":"canon-structure","completionFlag":"kalos_complete","completionKey":"kalos","volumes":["kalos"]},
{"id":"alola","n":7,"label":"Arc 7","region":"Alola","status":"sealed","canon":"canon-structure","completionFlag":"alola_complete","completionKey":"alola","volumes":["alola"]},
{"id":"journeys","n":8,"label":"Arc 8","region":"World","status":"sealed","canon":"canon-structure","completionFlag":"journeys_complete","completionKey":"journeys","volumes":["journeys"]},
{"id":"horizons","n":9,"label":"Arc 9","region":"World","status":"sealed","canon":"canon-structure","completionFlag":"horizons_complete","completionKey":"horizons","volumes":["horizons"]}
];

export const NARRATIVE_VOLUMES = [
{"id":"indigo-league","n":1,"arcId":"kanto","act":1,"canon":"original","events":["ev_rival_bridge","ev_tower_ghost","ev_silph_rival","ev_rival_route22","ev_viridian_gym_locked","ev_league_gate_deny","ev_e4_1","ev_e4_2","ev_e4_3","ev_e4_4","ev_bulbasaur_gift","ev_charmander","ev_squirtle_squad","ev_butterfree"]},
{"id":"orange-islands","n":2,"arcId":"orange","act":1,"canon":"original","events":["ev_orange_lapras","ev_orange_lapras_pod"]},
{"id":"johto-journeys","n":3,"arcId":"johto","act":1,"canon":"original","events":["ev_johto_silver_r30","ev_johto_well","ev_johto_silver_ilex_won","ev_johto_silver_ilex_lost","ev_johto_radio_takeover","ev_johto_radio_locked","ev_johto_director","ev_johto_radio_f2","ev_johto_silver_gate","ev_johto_silver_route"]},
{"id":"johto-league-champions","n":4,"arcId":"johto","act":1,"canon":"original"},
{"id":"master-quest","n":5,"arcId":"johto","act":1,"canon":"original"},
{"id":"hoenn","n":6,"arcId":"hoenn","act":2,"canon":"original","events":["ev_hoenn_standoff"]},
{"id":"battle-frontier","n":7,"arcId":"frontier","act":2,"canon":"original"},
{"id":"sinnoh","n":8,"arcId":"sinnoh","act":2,"canon":"original","events":["ev_sinnoh_acuity_glimpse","ev_sinnoh_verity_pressure","ev_sinnoh_gracidea","ev_sinnoh_zoroark"]},
{"id":"unova","n":9,"arcId":"unova","act":3,"canon":"canon-structure"},
{"id":"kalos","n":10,"arcId":"kalos","act":3,"canon":"canon-structure"},
{"id":"alola","n":11,"arcId":"alola","act":3,"canon":"canon-structure"},
{"id":"journeys","n":12,"arcId":"journeys","act":3,"canon":"canon-structure"},
{"id":"horizons","n":13,"arcId":"horizons","act":3,"canon":"canon-structure"}
];

export const NARRATIVE_CHAPTERS = [
{"id":"q_partner","arcId":"kanto","volume":1,"kind":"main","title":"Meet Prof. Hawthorn and receive your partner","flag":"metPartner","locations":["pallet"],"characters":["PROF. HAWTHORN"],"mechanics":["gift-pokemon"],"canon":"original","viaIntro":true},
{"id":"q_boulder","arcId":"kanto","volume":1,"kind":"main","title":"Win the Boulder Badge in Flintridge City","flag":"badge_boulder","requires":["q_partner"],"locations":["pewter","gym"],"characters":["BROCK"],"battles":["brock"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_cerulean","arcId":"kanto","volume":1,"kind":"main","title":"Cross Mt. Lunestone and reach Tidehaven City","flag":"reached_cerulean","requires":["q_boulder"],"locations":["cerulean"],"canon":"original"},
{"id":"q_cascade","arcId":"kanto","volume":1,"kind":"main","title":"Win the Cascade Badge in Tidehaven City","flag":"badge_cascade","requires":["q_cerulean"],"locations":["cerulean","gym-cerulean"],"characters":["MISTY"],"battles":["misty"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_bill","arcId":"kanto","volume":1,"kind":"main","title":"Help the researcher at the Sea Cottage","flag":"bill_helped","requires":["q_cascade"],"locations":["cerulean"],"characters":["BILL"],"events":["ev_bill"],"canon":"original"},
{"id":"q_vermilion","arcId":"kanto","volume":1,"kind":"main","title":"Reach Arcport City","flag":"reached_vermilion","requires":["q_bill"],"locations":["vermilion"],"canon":"original"},
{"id":"q_stanne","arcId":"kanto","volume":1,"kind":"main","title":"Sail on the St. Anne","flag":"stanne_done","requires":["q_vermilion"],"locations":["vermilion","stanne"],"characters":["ATTENDANT","RUE","COLE"],"events":["ev_stanne","ev_duo_stanne"],"battles":["duo2_vermilion"],"rivalBattles":["duo2_vermilion"],"relationships":["rue","cole"],"mechanics":["trainer-battle","bond-choice"],"canon":"original"},
{"id":"q_thunder","arcId":"kanto","volume":1,"kind":"main","title":"Win the Thunder Badge in Arcport City","flag":"badge_thunder","requires":["q_stanne"],"locations":["vermilion","gym-vermilion"],"characters":["LT. SURGE"],"battles":["surge"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_celadon","arcId":"kanto","volume":1,"kind":"main","title":"Reach Canopy City","flag":"reached_celadon","requires":["q_thunder"],"locations":["celadon"],"canon":"original"},
{"id":"q_rainbow","arcId":"kanto","volume":1,"kind":"main","title":"Win the Rainbow Badge in Canopy City","flag":"badge_rainbow","requires":["q_celadon"],"locations":["celadon","gym-celadon"],"characters":["ERIKA"],"battles":["erika"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_scope","arcId":"kanto","volume":1,"kind":"main","title":"Infiltrate the Game Corner and recover the Vantage Scope","flag":"scope_done","requires":["q_rainbow"],"locations":["gamecorner","hideout"],"characters":["THE BOSS (speaker)"],"events":["ev_hideout_entry","ev_scope_boss"],"battles":["rocket_admin_hideout"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_flute","arcId":"kanto","volume":1,"kind":"main","title":"Climb Hushmoor Tower and earn the Poke Flute","flag":"flute_got","requires":["q_scope"],"locations":["tower2"],"characters":["RUE","COLE","MR. FUJI"],"events":["ev_fuji"],"relationships":["rue","cole"],"mechanics":["bond-choice"],"canon":"original"},
{"id":"q_snorlax","arcId":"kanto","volume":1,"kind":"main","title":"Wake a sleeping NAPPASAUR","flag":"snorlax_west","requires":["q_flute"],"locations":["route12","route16"],"events":["ev_snorlax_east","ev_snorlax_west"],"wildBattles":[{"species":"snorlax","level":30},{"species":"snorlax","level":30}],"mechanics":["wild-battle"],"canon":"original"},
{"id":"q_soul","arcId":"kanto","volume":1,"kind":"main","title":"Win the Soul Badge in Bramble City","flag":"badge_soul","requires":["q_snorlax"],"locations":["fuchsia","gym-fuchsia"],"characters":["KOGA"],"battles":["koga"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_silph","arcId":"kanto","volume":1,"kind":"main","title":"Liberate Vantage Co. in Farsight City","flag":"silph_done","requires":["q_soul"],"locations":["silph2"],"characters":["ROCKET ADMIN","GIOVANNI (phone)","VANTAGE PRESIDENT"],"events":["ev_silph_boss"],"battles":["rocket_admin_silph"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_marsh","arcId":"kanto","volume":1,"kind":"main","title":"Win the Marsh Badge in Farsight City","flag":"badge_marsh","requires":["q_silph"],"locations":["saffron","gym-saffron"],"characters":["SABRINA"],"battles":["sabrina"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_mansion","arcId":"kanto","volume":1,"kind":"main","title":"Find the Secret Key in the Caldera Mansion","flag":"mansion_key","requires":["q_marsh"],"locations":["mansion"],"events":["ev_mansion_key"],"canon":"original"},
{"id":"q_volcano","arcId":"kanto","volume":1,"kind":"main","title":"Win the Volcano Badge on Caldera Town","flag":"badge_volcano","requires":["q_mansion"],"locations":["gym-cinnabar"],"characters":["BLAINE"],"battles":["blaine"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_earth","arcId":"kanto","volume":1,"kind":"main","title":"Win the Earth Badge in Fernmere City","flag":"badge_earth","requires":["q_volcano"],"locations":["viridian","gym-viridian"],"characters":["GIOVANNI"],"battles":["giovanni"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_movie","arcId":"kanto","volume":1,"kind":"main","title":"Answer the invitation to Exile Isle","flag":"movie_done","requires":["q_earth"],"locations":["vermilion","newisland","pallet"],"characters":["THE ARMORED ONE","RUE","COLE"],"events":["ev_movie_arrive","ev_movie_climax"],"wildBattles":[{"species":"mew","level":50}],"relationships":["rue","cole"],"mechanics":["bond-choice","wild-battle"],"canon":"original"},
{"id":"q_league","arcId":"kanto","volume":1,"kind":"main","title":"Pass the League gate on Route 23","flag":"league_gate_passed","requires":["q_movie"],"locations":["route22"],"characters":["LEAGUE GUARD"],"events":["ev_league_gate"],"canon":"original"},
{"id":"q_champion","arcId":"kanto","volume":1,"kind":"main","title":"Defeat the Elite Four and become Champion","flag":"champion","requires":["q_league"],"locations":["league"],"characters":["GARY"],"events":["ev_champion"],"battles":["gary_champion"],"rivalBattles":["gary_champion"],"relationships":["gary"],"mechanics":["bond-choice","trainer-battle","ending"],"canon":"original"},
{"id":"q_mewtwo","arcId":"kanto","volume":1,"kind":"main","title":"Face what sleeps in Tidehaven Cave","flag":"mewtwo_done","requires":["q_champion"],"locations":["ceruleancave"],"characters":["OMNIGEN"],"events":["ev_mewtwo"],"wildBattles":[{"species":"mewtwo","level":70}],"mechanics":["wild-battle"],"canon":"original"},
{"id":"q_diploma","arcId":"kanto","volume":1,"kind":"main","title":"Complete the Pokedex and claim your diploma","flag":"diploma","requires":["q_mewtwo"],"locations":["pallet"],"canon":"original"},
{"id":"q_orange_gsball","arcId":"orange","volume":2,"kind":"main","title":"Fetch the GS Orb from Prof. Ivy on Valencia Island","flag":"orange_gsball","locations":["ivy-lab"],"characters":["PROF. IVY"],"events":["ev_orange_ivy"],"canon":"original"},
{"id":"q_orange_crew","arcId":"orange","volume":2,"kind":"main","title":"Win the four Orange Crew badges","flag":"orange_crew_done","requires":["q_orange_gsball"],"locations":["mikan","mikan-gym","navel","navel-gym","trovita","trovita-gym","kumquat","kumquat-gym"],"canon":"original"},
{"id":"q_orange_league","arcId":"orange","volume":2,"kind":"main","title":"Challenge Drake at Pummelo Stadium and win the Orange League","flag":"orange_champion","requires":["q_orange_crew"],"locations":["pummelo-stadium"],"canon":"original"},
{"id":"q_orange_storm","arcId":"orange","volume":2,"kind":"main","title":"The Storm over Shamouti — calm the three titans and still the guardian's storm","flag":"orange_2000_storm_stilled","requires":["q_orange_league"],"locations":["shamouti-deep","shamouti"],"characters":["SLOWKING","VANCE HALLOWAY"],"events":["ev_orange_2000_climax"],"wildBattles":[{"species":"lugia","level":55}],"mechanics":["wild-battle"],"canon":"original"},
{"id":"q_johto_arrival","arcId":"johto","volume":3,"kind":"main","title":"Meet Professor Elm in New Bark Town","flag":"johto_arrival","locations":["newbark"],"characters":["PROF. ELM"],"events":["ev_johto_arrival"],"canon":"original"},
{"id":"q_johto_thief","arcId":"johto","volume":3,"kind":"main","title":"Watch for the red-haired thief — and report back to Elm","flag":"silver_reported","requires":["q_johto_arrival"],"locations":["elm-lab","cherrygrove"],"canon":"original"},
{"id":"q_johto_sprout","arcId":"johto","volume":3,"kind":"main","title":"Climb Sprout Tower and earn the Elder's blessing","flag":"sprout_tower_done","requires":["q_johto_thief"],"locations":["sprout-tower-1"],"canon":"original"},
{"id":"q_johto_zephyr","arcId":"johto","volume":3,"kind":"main","title":"Win the Zephyr Badge from Falkner in Violet City","flag":"badge_zephyr","requires":["q_johto_sprout"],"locations":["violet","gym-violet"],"characters":["FALKNER"],"battles":["falkner"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_well","arcId":"johto","volume":3,"kind":"main","title":"Clear Team Rocket out of the DOZELING Well","flag":"johto_well_cleared","requires":["q_johto_zephyr"],"locations":["slowpoke-well"],"canon":"original"},
{"id":"q_johto_gsball","arcId":"johto","volume":3,"kind":"main","title":"Deliver the GS Orb to Kurt in Azalea Town","flag":"gsball_delivered","requires":["q_johto_well"],"locations":["elm-lab"],"canon":"original"},
{"id":"q_johto_hive","arcId":"johto","volume":3,"kind":"main","title":"Win the Hive Badge from Bugsy in Azalea Town","flag":"badge_hive","requires":["q_johto_gsball"],"locations":["azalea","gym-azalea"],"characters":["BUGSY"],"battles":["bugsy"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_plain","arcId":"johto","volume":3,"kind":"main","title":"Win the Plain Badge from Whitney in Goldenrod City","flag":"badge_plain","requires":["q_johto_hive"],"locations":["goldenrod","gym-goldenrod"],"characters":["WHITNEY"],"battles":["whitney"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_burned","arcId":"johto","volume":3,"kind":"main","title":"See what woke in the Burned Tower","flag":"beasts_awakened","requires":["q_johto_plain"],"locations":["burned-tower-1"],"events":["ev_johto_burned"],"canon":"original"},
{"id":"q_johto_fog","arcId":"johto","volume":3,"kind":"main","title":"Win the Fog Badge from Morty in Ecruteak City","flag":"badge_fog","requires":["q_johto_burned"],"locations":["ecruteak","gym-ecruteak"],"characters":["MORTY"],"battles":["morty"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_potion","arcId":"johto","volume":4,"kind":"main","title":"Fetch the Secret Potion for Amphy, the lighthouse Pokemon","flag":"amphy_healed","requires":["q_johto_fog"],"locations":["lighthouse-1","cianwood"],"canon":"original"},
{"id":"q_johto_storm","arcId":"johto","volume":4,"kind":"main","title":"Win the Storm Badge from Chuck in Cianwood City","flag":"badge_storm","requires":["q_johto_potion"],"locations":["cianwood","gym-cianwood"],"characters":["CHUCK"],"battles":["chuck"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_mineral","arcId":"johto","volume":4,"kind":"main","title":"Win the Mineral Badge from Jasmine in Olivine City","flag":"badge_mineral","requires":["q_johto_storm"],"locations":["olivine","gym-olivine"],"characters":["JASMINE"],"battles":["jasmine"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_redgyarados","arcId":"johto","volume":4,"kind":"main","title":"Face the Red WRATHWYRM at the Lake of Rage","flag":"red_gyarados_done","requires":["q_johto_mineral"],"locations":["lake-of-rage"],"characters":["LANCE"],"events":["ev_johto_redgyarados"],"wildBattles":[{"species":"gyarados","level":162}],"mechanics":["wild-battle"],"canon":"original"},
{"id":"q_johto_hideout","arcId":"johto","volume":4,"kind":"main","title":"Clear the Hideout beneath Mahogany's souvenir shop","flag":"johto_hideout_cleared","requires":["q_johto_redgyarados"],"locations":["hideout"],"characters":["LANCE"],"events":["ev_johto_hideout"],"battles":["rocket_hideout_1","rocket_hideout_2","rocket_hideout_exec"],"wildBattles":[{"species":"electrode","level":166}],"mechanics":["trainer-battle","wild-battle"],"canon":"original"},
{"id":"q_johto_glacier","arcId":"johto","volume":4,"kind":"main","title":"Win the Glacier Badge from Pryce in Mahogany Town","flag":"badge_glacier","requires":["q_johto_hideout"],"locations":["mahogany","gym-mahogany"],"characters":["PRYCE"],"battles":["pryce"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_johto_radio","arcId":"johto","volume":4,"kind":"main","title":"Take back the Goldenrod Radio Tower","flag":"radio_tower_cleared","requires":["q_johto_glacier"],"locations":["radio-tower-1","goldenrod-underground-1"],"events":["ev_johto_radio_top"],"battles":["rocket_director_fake"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_johto_rising","arcId":"johto","volume":4,"kind":"main","title":"Win Clair's trust — and the Rising Badge — in Blackthorn","flag":"badge_rising","requires":["q_johto_radio"],"locations":["gym-blackthorn","dragons-den"],"canon":"original"},
{"id":"q_johto_conference","arcId":"johto","volume":5,"kind":"main","title":"Register for the Silver Conference at Silver Town","flag":"conference_registered","requires":["q_johto_rising"],"locations":["silvertown"],"canon":"original"},
{"id":"q_johto_gary","arcId":"johto","volume":5,"kind":"main","title":"The Silver Conference — beat Gary","flag":"beat_gary_johto","requires":["q_johto_conference"],"locations":["silver-stadium"],"canon":"original"},
{"id":"q_johto_harrison","arcId":"johto","volume":5,"kind":"main","title":"The Silver Conference — the quarter-final, and whatever it decides","flag":"johto_complete","requires":["q_johto_gary"],"locations":["silver-stadium"],"canon":"original"},
{"id":"q_johto_red","arcId":"johto","volume":5,"kind":"main","title":"Post-game: the silent trainer on Mt. Silver","flag":"red_defeated","requires":["q_johto_harrison"],"locations":["mt-silver"],"canon":"original"},
{"id":"q_hoenn_rescue","arcId":"hoenn","volume":6,"kind":"main","title":"Help Professor Birch — something is chasing him near Littleroot","flag":"birch_rescued","locations":["littleroot"],"characters":["PROF. BIRCH"],"events":["ev_hoenn_rescue"],"wildBattles":[{"species":"poochyena","level":203}],"mechanics":["wild-battle"],"canon":"original"},
{"id":"q_hoenn_arrival","arcId":"hoenn","volume":6,"kind":"main","title":"Meet Professor Birch in his Littleroot lab","flag":"hoenn_arrival","requires":["q_hoenn_rescue"],"locations":["littleroot"],"characters":["PROF. BIRCH"],"events":["ev_hoenn_arrival"],"canon":"original"},
{"id":"q_hoenn_wally","arcId":"hoenn","volume":6,"kind":"main","title":"Help Wally catch his first Pokemon in Petalburg","flag":"wally_helped","requires":["q_hoenn_arrival"],"locations":["petalburg"],"canon":"original"},
{"id":"q_hoenn_stone","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Stone Badge from Roxanne in Rustboro City","flag":"badge_stone","requires":["q_hoenn_wally"],"locations":["rustboro","gym-rustboro"],"characters":["ROXANNE"],"battles":["roxanne"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_knuckle","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Knuckle Badge from Brawly in Dewford Town","flag":"badge_knuckle","requires":["q_hoenn_stone"],"locations":["dewford","gym-dewford"],"characters":["BRAWLY"],"battles":["brawly"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_slateport_may","arcId":"hoenn","volume":6,"kind":"main","title":"Watch May compete at the Slateport Contest Hall","flag":"may_slateport_done","requires":["q_hoenn_knuckle"],"locations":["contest-slateport"],"canon":"original"},
{"id":"q_hoenn_meteor","arcId":"hoenn","volume":6,"kind":"main","title":"See what the two teams wanted at Meteor Falls","flag":"meteor_falls_done","requires":["q_hoenn_slateport_may"],"locations":["meteor-falls"],"characters":["PROF. COZMO"],"events":["ev_hoenn_meteor"],"canon":"original"},
{"id":"q_hoenn_dynamo","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Dynamo Badge from Wattson in Mauville City","flag":"badge_dynamo","requires":["q_hoenn_meteor"],"locations":["mauville","gym-mauville"],"characters":["WATTSON"],"battles":["wattson"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_verdanturf_may","arcId":"hoenn","volume":6,"kind":"main","title":"Watch May compete at the Verdanturf Contest Hall","flag":"may_verdanturf_done","requires":["q_hoenn_dynamo"],"locations":["contest-verdanturf"],"canon":"original"},
{"id":"q_hoenn_chimney","arcId":"hoenn","volume":6,"kind":"main","title":"Break up the clash on Mt. Chimney","flag":"chimney_clash_done","requires":["q_hoenn_verdanturf_may"],"locations":["mt-chimney"],"characters":["ADMIN SELKA"],"events":["ev_hoenn_chimney"],"canon":"original"},
{"id":"q_hoenn_heat","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Heat Badge from Flannery in Lavaridge Town","flag":"badge_heat","requires":["q_hoenn_chimney"],"locations":["lavaridge","gym-lavaridge"],"characters":["FLANNERY"],"battles":["flannery"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_fallarbor_may","arcId":"hoenn","volume":6,"kind":"main","title":"Watch May compete at the Fallarbor Contest Hall","flag":"may_fallarbor_done","requires":["q_hoenn_heat"],"locations":["contest-fallarbor"],"canon":"original"},
{"id":"q_hoenn_balance","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Balance Badge from Norman in Petalburg City","flag":"badge_balance","requires":["q_hoenn_fallarbor_may"],"locations":["petalburg","gym-petalburg"],"characters":["NORMAN"],"battles":["norman"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_institute","arcId":"hoenn","volume":6,"kind":"main","title":"Clear the team takeover at the Weather Institute on Route 119","flag":"institute_done","requires":["q_hoenn_balance"],"locations":["r119"],"characters":["INSTITUTE DIRECTOR'S AIDE"],"events":["ev_hoenn_institute"],"mechanics":["gift-pokemon"],"canon":"original"},
{"id":"q_hoenn_feather","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Feather Badge from Winona in Fortree City","flag":"badge_feather","requires":["q_hoenn_institute"],"locations":["fortree","gym-fortree"],"characters":["WINONA"],"battles":["winona"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_lilycove_may","arcId":"hoenn","volume":6,"kind":"main","title":"Watch May compete at the Lilycove Contest Hall","flag":"may_lilycove_done","requires":["q_hoenn_feather"],"locations":["contest-lilycove"],"canon":"original"},
{"id":"q_hoenn_mind","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Mind Badge from Tate and Liza in Mossdeep City","flag":"badge_mind","requires":["q_hoenn_lilycove_may"],"locations":["mossdeep","gym-mossdeep"],"characters":["LIZA"],"battles":["liza"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_pyre","arcId":"hoenn","volume":6,"kind":"main","title":"Mt. Pyre — stop the teams taking the orbs","flag":"orbs_taken","requires":["q_hoenn_mind"],"locations":["mt-pyre"],"characters":["PYRE KEEPER SATO"],"events":["ev_hoenn_pyre"],"canon":"original"},
{"id":"q_hoenn_magma_hideout","arcId":"hoenn","volume":6,"kind":"main","title":"Raid the Magma Hideout in Mt. Chimney's caldera","flag":"magma_hideout_done","requires":["q_hoenn_pyre"],"locations":["magma-hideout"],"events":["ev_hoenn_magma_hideout"],"canon":"original"},
{"id":"q_hoenn_aqua_hideout","arcId":"hoenn","volume":6,"kind":"main","title":"Stop Team Aqua stealing the submarine at Lilycove harbour","flag":"submarine_stolen","requires":["q_hoenn_magma_hideout"],"locations":["lilycove"],"events":["ev_hoenn_aqua_hideout"],"canon":"original"},
{"id":"q_hoenn_seafloor","arcId":"hoenn","volume":6,"kind":"main","title":"Dive to the Seafloor Cavern off Route 128","flag":"seafloor_done","requires":["q_hoenn_aqua_hideout"],"locations":["seafloor-cavern"],"events":["ev_hoenn_seafloor"],"canon":"original"},
{"id":"q_hoenn_climax","arcId":"hoenn","volume":6,"kind":"main","title":"End the clash of the weather titans","flag":"climax_resolved","requires":["q_hoenn_seafloor"],"locations":["sky-pillar"],"events":["ev_hoenn_rayquaza"],"canon":"original"},
{"id":"q_hoenn_rain","arcId":"hoenn","volume":6,"kind":"main","title":"Win the Rain Badge from Juan in Sootopolis City","flag":"badge_rain","requires":["q_hoenn_climax"],"locations":["sootopolis","gym-sootopolis"],"characters":["JUAN"],"battles":["juan"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_hoenn_wally_final","arcId":"hoenn","volume":6,"kind":"main","title":"Face Wally in Crown Road","flag":"wally_final_done","requires":["q_hoenn_rain"],"locations":["victoryroad"],"canon":"original"},
{"id":"q_hoenn_conference","arcId":"hoenn","volume":6,"kind":"main","title":"Register for the Ever Grande Conference","flag":"hoenn_conference_registered","requires":["q_hoenn_wally_final"],"locations":["league-evergrande"],"canon":"original"},
{"id":"q_hoenn_tyson","arcId":"hoenn","volume":6,"kind":"main","title":"The Ever Grande Conference — the final, against Tyson","flag":"hoenn_complete","requires":["q_hoenn_conference"],"locations":["league-evergrande"],"canon":"original"},
{"id":"q_sinnoh_arrival","arcId":"sinnoh","volume":8,"kind":"main","title":"Sail to Sinnoh — land at Sandgem Town","flag":"sinnoh_arrival","locations":["sandgem"],"events":["ev_sinnoh_arrival"],"mechanics":["chapter-card"],"canon":"original"},
{"id":"q_sinnoh_lab","arcId":"sinnoh","volume":8,"kind":"main","title":"Report to Professor Rowan's lab in Sandgem","flag":"rowan_registered","requires":["q_sinnoh_arrival"],"locations":["rowan-lab"],"characters":["PROF. ROWAN","PAUL"],"events":["ev_sinnoh_lab"],"canon":"original"},
{"id":"q_sinnoh_paul1","arcId":"sinnoh","volume":8,"kind":"main","title":"The cold-eyed trainer: take Paul's measure at the lab","flag":"paul1_done","requires":["q_sinnoh_lab"],"locations":["rowan-lab"],"canon":"original"},
{"id":"q_sinnoh_verity","arcId":"sinnoh","volume":8,"kind":"main","title":"Lake Verity — something moved on the water","flag":"verity_glimpse","requires":["q_sinnoh_paul1"],"locations":["lake-verity"],"events":["ev_sinnoh_verity"],"canon":"original"},
{"id":"q_sinnoh_roark","arcId":"sinnoh","volume":8,"kind":"main","title":"Oreburgh Gym — challenge Roark for the Coal Badge","flag":"badge_coal","requires":["q_sinnoh_verity"],"locations":["oreburgh","gym-oreburgh"],"characters":["ROARK"],"battles":["roark"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_windworks","arcId":"sinnoh","volume":8,"kind":"main","title":"Valley Windworks — break the lock-in","flag":"windworks_cleared","requires":["q_sinnoh_roark"],"locations":["valley-windworks"],"events":["ev_sinnoh_windworks"],"battles":["mars_windworks"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_sinnoh_gardenia","arcId":"sinnoh","volume":8,"kind":"main","title":"Eterna Gym — challenge Gardenia for the Forest Badge","flag":"badge_forest","requires":["q_sinnoh_windworks"],"locations":["eterna","gym-eterna"],"characters":["GARDENIA"],"battles":["gardenia"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_galactic","arcId":"sinnoh","volume":8,"kind":"main","title":"Eterna City — look into the Galactic building","flag":"galactic_eterna_done","requires":["q_sinnoh_gardenia"],"locations":["eterna"],"events":["ev_sinnoh_galactic"],"battles":["jupiter_eterna"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_sinnoh_fantina","arcId":"sinnoh","volume":8,"kind":"main","title":"Hearthome Gym — challenge Fantina for the Relic Badge","flag":"badge_relic","requires":["q_sinnoh_galactic"],"locations":["hearthome","gym-hearthome"],"characters":["FANTINA"],"battles":["fantina"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_dawn","arcId":"sinnoh","volume":8,"kind":"main","title":"Hearthome's Super Contest Hall — Dawn's first stage","flag":"dawn_hearthome_done","requires":["q_sinnoh_fantina"],"locations":["hearthome","contest-hearthome"],"canon":"original"},
{"id":"q_sinnoh_chimchar","arcId":"sinnoh","volume":8,"kind":"main","title":"The little fire Paul left behind","flag":"chimchar_beat_done","requires":["q_sinnoh_dawn"],"locations":["hearthome"],"canon":"original"},
{"id":"q_sinnoh_defog","arcId":"sinnoh","volume":8,"kind":"main","title":"Solaceon Ruins — claim the mist-clearing HM","flag":"defog_received","requires":["q_sinnoh_chimchar"],"locations":["solaceon-ruins"],"events":["ev_sinnoh_defog"],"canon":"original"},
{"id":"q_sinnoh_maylene","arcId":"sinnoh","volume":8,"kind":"main","title":"Veilstone Gym — challenge Maylene for the Cobble Badge","flag":"badge_cobble","requires":["q_sinnoh_defog"],"locations":["veilstone","gym-veilstone"],"characters":["MAYLENE"],"battles":["maylene"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_paul2","arcId":"sinnoh","volume":8,"kind":"main","title":"Veilstone — Paul's home turf: settle the measure again","flag":"paul_veilstone_done","requires":["q_sinnoh_maylene"],"locations":["veilstone"],"canon":"original"},
{"id":"q_sinnoh_wake","arcId":"sinnoh","volume":8,"kind":"main","title":"Pastoria Gym — challenge Crasher Wake for the Fen Badge","flag":"badge_fen","requires":["q_sinnoh_paul2"],"locations":["pastoria","gym-pastoria"],"characters":["CRASHER WAKE"],"battles":["wake"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_valor","arcId":"sinnoh","volume":8,"kind":"main","title":"Lake Valor — what the explosion left","flag":"valor_glimpse","requires":["q_sinnoh_wake"],"locations":["lake-valor"],"events":["ev_sinnoh_valor"],"canon":"original"},
{"id":"q_sinnoh_hq","arcId":"sinnoh","volume":8,"kind":"main","title":"Veilstone — raid the Galactic HQ","flag":"galactic_hq_done","requires":["q_sinnoh_valor"],"locations":["galactic-hq"],"events":["ev_sinnoh_hq_raid"],"battles":["saturn_hq"],"mechanics":["trainer-battle"],"canon":"original"},
{"id":"q_sinnoh_byron","arcId":"sinnoh","volume":8,"kind":"main","title":"Canalave Gym — challenge Byron for the Mine Badge","flag":"badge_mine","requires":["q_sinnoh_hq"],"locations":["canalave","gym-canalave"],"characters":["BYRON"],"battles":["byron"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_darkrai","arcId":"sinnoh","volume":8,"kind":"main","title":"Canalave — the sailor's son who cannot wake","flag":"darkrai_beat_done","requires":["q_sinnoh_byron"],"locations":["canalave"],"canon":"original"},
{"id":"q_sinnoh_candice","arcId":"sinnoh","volume":8,"kind":"main","title":"Snowpoint Gym — challenge Candice for the Icicle Badge","flag":"badge_icicle","requires":["q_sinnoh_darkrai"],"locations":["snowpoint","gym-snowpoint"],"characters":["CANDICE"],"battles":["candice"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_acuity","arcId":"sinnoh","volume":8,"kind":"main","title":"Lake Acuity — Paul, at full strength","flag":"paul_acuity_done","requires":["q_sinnoh_candice"],"locations":["lake-acuity"],"canon":"original"},
{"id":"q_sinnoh_rockclimb","arcId":"sinnoh","volume":8,"kind":"main","title":"Route 217 — the HM in the snow","flag":"rockclimb_received","requires":["q_sinnoh_acuity"],"locations":["r217"],"events":["ev_sinnoh_rockclimb"],"canon":"original"},
{"id":"q_sinnoh_volkner","arcId":"sinnoh","volume":8,"kind":"main","title":"Sunyshore Gym — challenge Volkner for the Beacon Badge","flag":"badge_beacon","requires":["q_sinnoh_rockclimb"],"locations":["sunnyshore","gym-sunnyshore"],"characters":["VOLKNER"],"battles":["volkner"],"mechanics":["gym-battle"],"canon":"original"},
{"id":"q_sinnoh_festival","arcId":"sinnoh","volume":8,"kind":"main","title":"Lake Valor — Dawn's Grand Festival","flag":"dawn_grand_festival_done","requires":["q_sinnoh_volkner"],"locations":["lake-valor"],"canon":"original"},
{"id":"q_sinnoh_coronet","arcId":"sinnoh","volume":8,"kind":"main","title":"Mt. Coronet — climb to the summit","flag":"coronet_climb_done","requires":["q_sinnoh_festival"],"locations":["mt-coronet-south","mt-coronet-central","mt-coronet-north","spear-pillar"],"events":["ev_sinnoh_coronet"],"canon":"original"},
{"id":"q_sinnoh_spear","arcId":"sinnoh","volume":8,"kind":"main","title":"Spear Pillar — the chained gods","flag":"spear_pillar_done","requires":["q_sinnoh_coronet"],"locations":["distortion-entrance"],"characters":["CYRUS"],"events":["ev_sinnoh_spear_pillar"],"canon":"original"},
{"id":"q_sinnoh_distortion","arcId":"sinnoh","volume":8,"kind":"main","title":"The Distortion World — answer the third god","flag":"sinnoh_climax_resolved","requires":["q_sinnoh_spear"],"locations":["distortion-entrance","distortion-platform"],"events":["ev_sinnoh_distortion_climax"],"canon":"original"},
{"id":"q_sinnoh_conference","arcId":"sinnoh","volume":8,"kind":"main","title":"Register for the Lily of the Valley Conference","flag":"sinnoh_conference_registered","requires":["q_sinnoh_distortion"],"locations":["pokemon-league"],"canon":"original"},
{"id":"q_sinnoh_paul_final","arcId":"sinnoh","volume":8,"kind":"main","title":"The Conference quarter-final — settle it with Paul","flag":"paul_conference_done","requires":["q_sinnoh_conference"],"locations":["pokemon-league"],"canon":"original"},
{"id":"q_sinnoh_tobias","arcId":"sinnoh","volume":8,"kind":"main","title":"The Conference semi-final — the darkest trainer","flag":"sinnoh_complete","requires":["q_sinnoh_paul_final"],"locations":["pokemon-league"],"canon":"original"},
{"id":"arc_zapdos","arcId":"kanto","volume":1,"kind":"legendary","title":"The Storm That Stayed","flag":"arc_zapdos_nest","locations":["powerplant"],"characters":["INSCRIPTION"],"events":["ev_zapdos"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_moltres","arcId":"kanto","volume":1,"kind":"legendary","title":"The Last Ember","flag":"arc_moltres_chamber","locations":["victoryroad"],"characters":["INSCRIPTION"],"events":["ev_moltres"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_articuno","arcId":"kanto","volume":1,"kind":"legendary","title":"Where the Sea Forgot to Move","flag":"arc_articuno_plate","locations":["seafoam"],"characters":["INSCRIPTION"],"events":["ev_articuno"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_mewtwo","arcId":"kanto","volume":1,"kind":"legendary","title":"The Dreaming Subject","flag":"mewtwo_cave","requires":["q_champion"],"locations":["ceruleancave"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_mew","arcId":"kanto","volume":1,"kind":"legendary","title":"The Blessing in the Rain","flag":"movie_done","locations":["newisland"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_hooh","arcId":"kanto","volume":1,"kind":"legendary","title":"The Rainbow Over the Ashes","flag":"hooh_summit","locations":["bell-tower-1"],"events":["ev_johto_hooh_glimpse","ev_johto_hooh"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_lugia","arcId":"kanto","volume":1,"kind":"legendary","title":"The Song Under the Whirlpools","flag":"birds_caught","requires":["arc_zapdos","arc_moltres","arc_articuno"],"mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_celebi","arcId":"johto","volume":5,"kind":"legendary","title":"The Ball That Hums at Shrines","flag":"celebi_shrine_opened","requires":["q_johto_burned"],"locations":["ilex-forest"],"events":["ev_johto_celebi"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_regirock","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Tomb in the Sand","flag":"regi_rock_open","locations":["desert-ruins"],"events":["ev_hoenn_regirock"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_regice","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Tomb in the Ice","flag":"regi_ice_open","locations":["island-cave"],"events":["ev_hoenn_regice"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_registeel","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Tomb in the Ruin","flag":"regi_steel_open","locations":["ancient-tomb"],"events":["ev_hoenn_registeel"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_kyogre","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Sea That Wants Everything","flag":"climax_resolved","requires":["q_hoenn_climax"],"locations":["r127-underwater"],"events":["ev_hoenn_kyogre"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_groudon","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Land That Wants Everything","flag":"climax_resolved","requires":["q_hoenn_climax"],"locations":["magma-hideout"],"events":["ev_hoenn_groudon"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_rayquaza","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Sky Settles It","flag":"climax_resolved","requires":["q_hoenn_climax"],"locations":["sky-pillar"],"events":["ev_hoenn_rayquaza_face"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_latios","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Jet Over the Water","flag":"climax_resolved","requires":["q_hoenn_climax"],"locations":["r125"],"events":["ev_hoenn_latios"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_latias","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Red Streak Over Hoenn","flag":"climax_resolved","requires":["q_hoenn_climax"],"events":["ev_hoenn_latias"],"mechanics":["capture"],"canon":"original","roaming":true},
{"id":"arc_jirachi","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Thousand-Year Wish","flag":"jirachi_star_fell","locations":["meteor-falls"],"events":["ev_hoenn_jirachi_witness","ev_hoenn_jirachi"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_deoxys","arcId":"hoenn","volume":6,"kind":"legendary","title":"The Triangle That Moves","flag":"deoxys_forme_touched","locations":["meteor-falls"],"events":["ev_hoenn_deoxys"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_regigigas","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The One Who Moved Continents","flag":"regi_trio_present","locations":["snowpoint-temple-depths"],"events":["ev_sinnoh_regigigas"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_uxie","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Lake That Knows","flag":"sinnoh_climax_resolved","requires":["q_sinnoh_distortion"],"locations":["lake-acuity-cave"],"events":["ev_sinnoh_uxie"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_mesprit","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Lake That Feels","flag":"mesprit_roaming","requires":["q_sinnoh_distortion"],"locations":["lake-verity"],"events":["ev_sinnoh_mesprit_meet","ev_sinnoh_mesprit"],"mechanics":["capture"],"canon":"original","roaming":true},
{"id":"arc_azelf","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Lake That Wills","flag":"sinnoh_climax_resolved","requires":["q_sinnoh_distortion"],"locations":["lake-valor-cave"],"events":["ev_sinnoh_azelf"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_dialga","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Pillar of Time","flag":"sinnoh_climax_resolved","requires":["q_sinnoh_distortion"],"locations":["spear-pillar"],"events":["ev_sinnoh_dialga"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_palkia","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Pillar of Space","flag":"arc_dialga_done","requires":["q_sinnoh_distortion"],"locations":["spear-pillar"],"events":["ev_sinnoh_palkia"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_giratina","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The World Behind the Waterfall","flag":"sinnoh_climax_resolved","requires":["q_sinnoh_distortion"],"locations":["turnback-cave"],"events":["ev_sinnoh_giratina"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_darkrai","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Nightmare at the Inn","flag":"sinnoh_complete","locations":["newmoon-island"],"events":["ev_sinnoh_darkrai_inn","ev_sinnoh_darkrai"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_cresselia","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Feather of Good Dreams","flag":"cresselia_roaming","requires":["q_sinnoh_distortion"],"locations":["fullmoon-island"],"events":["ev_sinnoh_fullmoon","ev_sinnoh_cresselia_meet","ev_sinnoh_cresselia"],"mechanics":["capture"],"canon":"original","roaming":true},
{"id":"arc_shaymin","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Gratitude Bloom","flag":"oaks_letter_received","locations":["flower-paradise"],"events":["ev_sinnoh_shaymin"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_heatran","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Mountain’s Furnace","flag":"magma_stone_returned","requires":["q_sinnoh_distortion"],"locations":["stark-interior"],"characters":["BUCK"],"events":["ev_sinnoh_magma_stone","ev_sinnoh_heatran"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_manaphy","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Prince of the Sea Temple","flag":"manaphy_egg_received","locations":["rowan-lab"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_spiritomb","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Hundred and Eight","flag":"odd_keystone_received","locations":["r209"],"events":["ev_sinnoh_spiritomb"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_arceus","arcId":"sinnoh","volume":8,"kind":"legendary","title":"The Hall of Origin","flag":"arceus_stairs_open","locations":["hall-of-origin"],"events":["ev_sinnoh_arceus_stairs","ev_sinnoh_arceus"],"mechanics":["capture"],"canon":"original","requiresFlags":["arceus_unlocked"]},
{"id":"arc_victini","arcId":"kanto","volume":1,"kind":"legendary","title":"The Victory in the Lighthouse","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_keldeo","arcId":"kanto","volume":1,"kind":"legendary","title":"The Fourth Sword","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_meloetta","arcId":"kanto","volume":1,"kind":"legendary","title":"The Song That Was Taken","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_genesect","arcId":"kanto","volume":1,"kind":"legendary","title":"The Fossil With a Cannon","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_xerneas","arcId":"kanto","volume":1,"kind":"legendary","title":"The Tree That Walked Away","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_yveltal","arcId":"kanto","volume":1,"kind":"legendary","title":"The Cocoon Under the Stone","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_zygarde","arcId":"kanto","volume":1,"kind":"legendary","title":"The Watcher in the Dark","flag":"zygarde_cells","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_diancie","arcId":"kanto","volume":1,"kind":"legendary","title":"The Princess of the Diamond Domain","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_hoopa","arcId":"kanto","volume":1,"kind":"legendary","title":"The Rings in the Desert","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_volcanion","arcId":"kanto","volume":1,"kind":"legendary","title":"The Steam of the Nebel Plateau","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_solgaleo","arcId":"kanto","volume":1,"kind":"legendary","title":"The Child of the Stars, Sun","flag":"cosmog_raised","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_lunala","arcId":"kanto","volume":1,"kind":"legendary","title":"The Child of the Stars, Moon","flag":"cosmog_raised","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_necrozma","arcId":"kanto","volume":1,"kind":"legendary","title":"The Light That Was Stolen","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_magearna","arcId":"kanto","volume":1,"kind":"legendary","title":"The Clockwork Gift","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_marshadow","arcId":"kanto","volume":1,"kind":"legendary","title":"The Shadow in Your Shadow","flag":"rainbow_witnessed","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_zeraora","arcId":"kanto","volume":1,"kind":"legendary","title":"The Thunder Without a Cloud","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_zacian","arcId":"kanto","volume":1,"kind":"legendary","title":"The Sword in the Mist","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_zamazenta","arcId":"kanto","volume":1,"kind":"legendary","title":"The Shield in the Mist","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_eternatus","arcId":"kanto","volume":1,"kind":"legendary","title":"The Darkest Day, Again","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_calyrex","arcId":"kanto","volume":1,"kind":"legendary","title":"The King of the Harvest","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_urshifu","arcId":"kanto","volume":1,"kind":"legendary","title":"The Two Scrolls","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_koraidon","arcId":"kanto","volume":1,"kind":"legendary","title":"The Winged King of the Crater","flag":"crater_friend","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_miraidon","arcId":"kanto","volume":1,"kind":"legendary","title":"The Iron Serpent of Tomorrow","flag":"crater_friend","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_terapagos","arcId":"kanto","volume":1,"kind":"legendary","title":"The Jewel Under the Academy","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_ogerpon","arcId":"kanto","volume":1,"kind":"legendary","title":"The Ogre of the Festival","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_pecharunt","arcId":"kanto","volume":1,"kind":"legendary","title":"The Peach That Binds","flag":"ogerpon_truth","mechanics":["capture"],"canon":"original","designedOnly":true},
{"id":"arc_lugia_shamouti","arcId":"orange","volume":2,"kind":"legendary","title":"The Guardian of the Sea","flag":"orange_2000_storm_stilled","locations":["shamouti-deep","fire-cave","lightning-cave","ice-cave"],"characters":["FEST ELDER MIRA","VANCE HALLOWAY","SLOWKING"],"events":["ev_orange_2000_storm","ev_orange_2000_moltres","ev_orange_2000_zapdos","ev_orange_2000_articuno","ev_orange_2000_lugia"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_raikou","arcId":"johto","volume":5,"kind":"legendary","title":"The Thunder That Walks","flag":"arc_raikou_sign2","requires":["q_johto_burned"],"locations":["national-park"],"events":["ev_johto_raikou"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_entei","arcId":"johto","volume":5,"kind":"legendary","title":"The Mountain's Heartbeat","flag":"arc_entei_sign2","requires":["q_johto_burned"],"locations":["mt-mortar-2"],"events":["ev_johto_entei"],"mechanics":["capture"],"canon":"original"},
{"id":"arc_suicune","arcId":"johto","volume":5,"kind":"legendary","title":"The North Wind's Errand","flag":"arc_suicune_sign2","requires":["q_johto_burned"],"locations":["bell-tower-1"],"events":["ev_johto_suicune"],"mechanics":["capture"],"canon":"original"},
{"id":"tale_pallet","arcId":"kanto","volume":1,"kind":"tale","title":"Mom's Care Package","locations":["pallet"],"characters":["MOM"],"relationships":["mom"],"bondNpc":"mom","canon":"original"},
{"id":"tale_viridian","arcId":"kanto","volume":1,"kind":"tale","title":"The Retired Ace","locations":["viridian"],"characters":["ACE MARLOW"],"relationships":["retiredace"],"bondNpc":"retiredace","canon":"original"},
{"id":"tale_pewter","arcId":"kanto","volume":1,"kind":"tale","title":"Brock's Day Off","locations":["pewter"],"characters":["CURATOR"],"relationships":["brock"],"bondNpc":"brock","canon":"original"},
{"id":"tale_cerulean","arcId":"kanto","volume":1,"kind":"tale","title":"The Stolen Bike Bell","locations":["cerulean"],"characters":["TESS"],"relationships":["misty"],"bondNpc":"misty","canon":"original"},
{"id":"tale_vermilion","arcId":"kanto","volume":1,"kind":"tale","title":"Fan Club Founder","locations":["vermilion"],"characters":["CHAIRMAN"],"relationships":["surge"],"bondNpc":"surge","canon":"original"},
{"id":"tale_lavender","arcId":"kanto","volume":1,"kind":"tale","title":"Names on the Wall","locations":["lavender"],"characters":["VOLUNTEER"],"relationships":["fuji"],"bondNpc":"fuji","canon":"original"},
{"id":"tale_celadon","arcId":"kanto","volume":1,"kind":"tale","title":"Roof Garden","locations":["celadon"],"characters":["GARDENER"],"relationships":["erika"],"bondNpc":"erika","canon":"original"},
{"id":"tale_saffron","arcId":"kanto","volume":1,"kind":"tale","title":"Two Gyms, One City","locations":["saffron"],"characters":["MASTER KO"],"relationships":["sabrina"],"bondNpc":"sabrina","canon":"original"},
{"id":"tale_fuchsia","arcId":"kanto","volume":1,"kind":"tale","title":"The Warden's Teeth","locations":["fuchsia"],"characters":["PRESERVE WARDEN"],"relationships":["koga"],"bondNpc":"koga","canon":"original"},
{"id":"tale_cinnabar","arcId":"kanto","volume":1,"kind":"tale","title":"Lab Notes","locations":["cinnabar"],"characters":["LAB TECH"],"relationships":["blaine"],"bondNpc":"blaine","canon":"original"},
{"id":"tale_newbark","arcId":"johto","volume":3,"kind":"tale","title":"A Letter for the Lab","locations":["newbark"],"characters":["ELDER MARA"],"bondNpc":"mara","canon":"original"},
{"id":"tale_cherrygrove","arcId":"johto","volume":3,"kind":"tale","title":"The Old Man and the Tide","locations":["cherrygrove"],"characters":["GUIDE GENT"],"bondNpc":"gent","canon":"original"},
{"id":"tale_violet","arcId":"johto","volume":3,"kind":"tale","title":"What the Tower Keeps","locations":["violet"],"characters":["OLD TOWERKEEP"],"bondNpc":"towerkeep","canon":"original"},
{"id":"tale_azalea","arcId":"johto","volume":3,"kind":"tale","title":"Rain for the DOZELING","locations":["azalea"],"characters":["MAIZIE"],"bondNpc":"maizie","canon":"original"},
{"id":"tale_goldenrod","arcId":"johto","volume":3,"kind":"tale","title":"Flowers for the Night Train","locations":["goldenrod"],"characters":["FLOWER SELLER UNA"],"bondNpc":"una","canon":"original"},
{"id":"tale_ecruteak","arcId":"johto","volume":3,"kind":"tale","title":"Two Towers, One Skyline","locations":["ecruteak"],"characters":["HISTORIAN ELIAS"],"bondNpc":"elias","canon":"original"},
{"id":"tale_olivine","arcId":"johto","volume":3,"kind":"tale","title":"The Light That Waits","locations":["olivine"],"characters":["LIGHTKEEPER ADA"],"bondNpc":"ada","canon":"original"},
{"id":"tale_cianwood","arcId":"johto","volume":3,"kind":"tale","title":"Salt on the Steps","locations":["cianwood"],"characters":["ISLAND ELDER BRAN"],"bondNpc":"bran","canon":"original"},
{"id":"tale_mahogany","arcId":"johto","volume":3,"kind":"tale","title":"The Lake Keeps Count","locations":["mahogany"],"characters":["LAKEWATCHER FENN"],"bondNpc":"fenn","canon":"original"},
{"id":"tale_blackthorn","arcId":"johto","volume":3,"kind":"tale","title":"What Dragons Remember","locations":["blackthorn"],"characters":["MOVE KEEPER ELDER"],"bondNpc":"elder","canon":"original"},
{"id":"tale_littleroot","arcId":"hoenn","volume":6,"kind":"tale","title":"The Town That Starts","locations":["littleroot"],"characters":["ELDER BRAMBLE"],"bondNpc":"bramble","canon":"original"},
{"id":"tale_petalburg","arcId":"hoenn","volume":6,"kind":"tale","title":"What Balance Weighs","locations":["petalburg"],"characters":["BALANCE KEEPER ORIN"],"bondNpc":"orin","canon":"original"},
{"id":"tale_rustboro","arcId":"hoenn","volume":6,"kind":"tale","title":"The Stone That Travels","locations":["rustboro"],"characters":["DEVON RESEARCHER PELL"],"bondNpc":"pell","canon":"original"},
{"id":"tale_slateport","arcId":"hoenn","volume":6,"kind":"tale","title":"The Price of the Tide","locations":["slateport"],"characters":["MARKET CRIER VESK"],"bondNpc":"vesk","canon":"original"},
{"id":"tale_sinnoh_twinleaf","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Ribbon in the Drawer","locations":["twinleaf"],"characters":["MOM’S NEIGHBOR ASHA"],"canon":"original"},
{"id":"tale_sinnoh_sandgem","arcId":"sinnoh","volume":8,"kind":"tale","title":"Notes for the Professor","locations":["sandgem"],"characters":["LAB AIDE FERN"],"canon":"original"},
{"id":"tale_sinnoh_jubilife","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Intern's Scoop","locations":["jubilife"],"characters":["BROADCAST INTERN VESK"],"canon":"original"},
{"id":"tale_sinnoh_oreburgh","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Miner's Lunchbox","locations":["oreburgh"],"characters":["MINER BRAM"],"canon":"original"},
{"id":"tale_sinnoh_eterna","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Statue's Shadow","locations":["eterna"],"characters":["HISTORIAN ILSE"],"canon":"original"},
{"id":"tale_sinnoh_hearthome","arcId":"sinnoh","volume":8,"kind":"tale","title":"Auntie's Poffin Tin","locations":["hearthome"],"characters":["CONTEST AUNTIE ROSA"],"canon":"original"},
{"id":"tale_sinnoh_solaceon","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Day-Care Egg Ledger","locations":["solaceon"],"characters":["DAY CARE LADY UNA"],"canon":"original"},
{"id":"tale_sinnoh_veilstone","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Clerk's Meteor","locations":["veilstone"],"characters":["DEPT CLERK VEE"],"canon":"original"},
{"id":"tale_sinnoh_floaroma","arcId":"sinnoh","volume":8,"kind":"tale","title":"Honey for the Road","locations":["floaroma"],"characters":["FLORIST WREN"],"canon":"original"},
{"id":"tale_sinnoh_pastoria","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Charm in the Reeds","locations":["pastoria"],"characters":["MARSH GUIDE SOLENNE"],"canon":"original"},
{"id":"tale_sinnoh_celestic","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Bell That Rings Downhill","locations":["celestic"],"characters":["SHRINE ELDER UME"],"canon":"original"},
{"id":"tale_sinnoh_snowpoint","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Petal in the Ice","locations":["snowpoint"],"characters":["TEMPLE ACOLYTE REN"],"canon":"original"},
{"id":"tale_sinnoh_sunnyshore","arcId":"sinnoh","volume":8,"kind":"tale","title":"The Coil in the Lighthouse","locations":["sunnyshore"],"characters":["LIGHTHOUSE KEEPER BLY"],"canon":"original"},
{"id":"facility_tower","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Tower","locations":["frontier-tower"],"characters":["ANABEL"],"canon":"original","symbolSlot":0},
{"id":"facility_factory","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Factory","locations":["frontier-factory"],"characters":["NOLAND"],"canon":"original","symbolSlot":1},
{"id":"facility_arena","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Arena","locations":["frontier-arena"],"characters":["GRETA"],"canon":"original","symbolSlot":2},
{"id":"facility_dome","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Dome","locations":["frontier-dome"],"characters":["TUCKER"],"canon":"original","symbolSlot":3},
{"id":"facility_pike","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Pike","locations":["frontier-pike"],"characters":["LUCY"],"canon":"original","symbolSlot":4},
{"id":"facility_palace","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Palace","locations":["frontier-palace"],"characters":["SPENCER"],"canon":"original","symbolSlot":5},
{"id":"facility_pyramid","arcId":"frontier","volume":7,"kind":"facility","title":"Battle Pyramid","locations":["frontier-pyramid","frontier-pyramid-a","frontier-pyramid-b","frontier-pyramid-c"],"characters":["BRANDON"],"canon":"original","symbolSlot":6}
];

// ---------- read helpers (pure; the DB stores no state of its own) ----------
export function narrativeArcById(id) { return NARRATIVE_ARCS.find((a) => a.id === id) || null; }
export function narrativeVolumeById(id) { return NARRATIVE_VOLUMES.find((v) => v.id === id) || null; }
export function narrativeChapterById(id) { return NARRATIVE_CHAPTERS.find((c) => c.id === id) || null; }
export function chaptersOfArc(arcId) { return NARRATIVE_CHAPTERS.filter((c) => c.arcId === arcId); }
export function chaptersOfVolume(n) { return NARRATIVE_CHAPTERS.filter((c) => c.volume === n); }
export function mainChainOf(arcId) { return NARRATIVE_CHAPTERS.filter((c) => c.arcId === arcId && c.kind === 'main'); }

// Chapter state, derived from the shipped flag system — the same
// semantics the Quest Log renders with (first incomplete chain row is
// current; story.quests tracks legendary arcs and tales; the Frontier
// reads its symbol slots). Returns one of:
// 'complete' | 'current' | 'available' | 'locked' | 'sealed' | 'designed'
export function chapterStateOf(state, id) {
  const ch = narrativeChapterById(id);
  if (!ch) return 'unknown';
  if (ch.designedOnly) return 'designed';
  const story = (state && state.story) || {};
  const flags = story.flags || {};
  if (ch.kind === 'main') {
    if (ch.flag && flags[ch.flag]) return 'complete';
    const arc = narrativeArcById(ch.arcId);
    if (!arc || arc.status === 'sealed') return 'sealed';
    if (!arcReached(state, ch.arcId)) return 'locked';
    const chain = mainChainOf(ch.arcId);
    const firstOpen = chain.find((c) => !(c.flag && flags[c.flag]));
    return firstOpen && firstOpen.id === ch.id ? 'current' : 'locked';
  }
  if (ch.kind === 'facility') {
    const syms = (state && state.badges && state.badges.symbols) || [];
    const s = syms[ch.symbolSlot];
    return s === 'gold' ? 'complete' : s === 'silver' ? 'current' : 'locked';
  }
  const q = (story.quests || {})[ch.id];
  if (q === 'complete') return 'complete';
  if (q) return 'current';
  const arc = narrativeArcById(ch.arcId);
  if (!arc || arc.status === 'sealed') return 'sealed';
  if (!arcReached(state, ch.arcId)) return 'locked';
  return 'available';
}

// arcStateOf's vocabulary is complete|current|locked-next|sealed
// ('sealed' is also its fallthrough for shipped-but-unreached arcs).
// REACHED = completed, current, or the homecoming directive's target.
export function arcReached(state, arcId) {
  const st = arcStateOf(state, arcId);
  return st === 'current' || st === 'complete' || st === 'locked-next';
}

export function currentChapterInArcOf(state, arcId) {
  const chain = mainChainOf(arcId);
  if (!chain.length) return null;
  const flags = ((state && state.story) || {}).flags || {};
  return chain.find((c) => !(c.flag && flags[c.flag])) || chain[chain.length - 1];
}
export function currentChapterOf(state) {
  const arc = currentArcOf(state);
  return arc ? currentChapterInArcOf(state, arc.id) : null;
}
export function nextObjectiveOf(state) {
  const ch = currentChapterOf(state);
  if (!ch) return null;
  return { chapterId: ch.id, title: ch.title, objective: ch.objective || ch.title, hint: ch.hint || null, arcId: ch.arcId, volume: ch.volume };
}
export function arcProgressOf(state, arcId) {
  const rows = chaptersOfArc(arcId).filter((c) => !c.designedOnly);
  const count = (kind) => {
    const ks = rows.filter((c) => c.kind === kind);
    return { done: ks.filter((c) => chapterStateOf(state, c.id) === 'complete').length, total: ks.length };
  };
  return {
    arcId, main: count('main'), legendary: count('legendary'),
    tales: count('tale'), facilities: count('facility'),
    designed: chaptersOfArc(arcId).length - rows.length,
  };
}
