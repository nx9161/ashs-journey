// johto-actors.mjs — Stage J4a: the Yamato story actors (runJohtoNpc +
// startJohtoBattle), extracted verbatim from overworld-systems.mjs by
// War Room W7 (Cap Relief): the B2-R1 frozen cap (5,254) is relieved by
// extraction into registered sibling modules, never by raising the cap.
// Attached to OverworldScene.prototype, same as its source block;
// overworld.mjs calls the same hooks through the scene.

import { TRAINERS } from '../data/maps.mjs';
import { ITEMS, BADGE_SETS } from '../data/items.mjs';
import { BattleScene } from './battle.mjs';
import { bondTrainerVariant, recordBattleBond } from './bonds.mjs';
import { checkArcCompletion } from './arcs.mjs';
import {
  APRICORN_IDS, APRICORN_TO_BALL, kurtCollect, kurtOrderStatus, kurtPlaceOrder,
} from './johto-systems.mjs';
import { OverworldScene } from './overworld.mjs';
import { key, rtOf } from './overworld-systems.mjs';

Object.assign(OverworldScene.prototype, {
  // ---------- Stage J4a: Yamato story actors (west) ----------
  // One dispatch for every NPC carrying a `johto:` key (appended at
  // loadMap from story-johto.mjs JOHTO_NPCS). Leaders ride the shared
  // leader runner (startJohtoBattle = the startOrangeBattle idiom:
  // the trainer def's intro, then a BattleScene whose winTrainer award
  // writes badges.johto + the badge_<root> flag). Elm, Kurt, the
  // Sprout Elder and the well Rockets are state-driven scenes.
  runJohtoNpc(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    const jBadges = (st.badges && st.badges.johto) || [];
    const say = (lines, cb, who) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, who === undefined ? npc.name : who);
    const kind = npc.johto;
    // Stage J5 badge-order gate (register, J5 addendum): the server
    // validator refuses any save whose badges are not a PREFIX of
    // the earn order (bad-badge-order), but Yamato's geography would
    // otherwise let a player earn Fog before Plain, Mineral before
    // Storm, or Glacier before Mineral — a legitimate playthrough
    // producing a save the server rejects. Fixed at the source:
    // every Yamato leader's BATTLE (never their scenes or errands)
    // requires the earlier Yamato badges. Data-driven from
    // BADGE_SETS.johto — leader index i refuses while the player
    // holds fewer than i Yamato badges, naming where the first
    // missing badge's leader waits. Falkner (index 0) is always open.
    const JOHTO_LEADER_WAITS = {
      zephyrbadge: 'Aven, in Iris City\'s gym',
      hivebadge: 'Bex, in Cinder Town\'s gym',
      plainbadge: 'Willa, in Signal City\'s gym',
      fogbadge: 'Silas, in Lantern City\'s gym',
      stormbadge: 'Rourke, in Tidewall City\'s gym',
      mineralbadge: 'Liora, in Beacon City\'s gym',
      glacierbadge: 'Albin, in Redwood Town\'s gym',
      risingbadge: 'Rhea, in Cragmoor City\'s gym',
    };
    const badgeOrderRefusal = (badgeId) => {
      const idx = BADGE_SETS.johto.indexOf(badgeId);
      if (idx <= 0 || jBadges.length >= idx) return null;
      const miss = BADGE_SETS.johto[jBadges.length];
      const missItem = ITEMS[miss];
      return ['The League keeps an order in Yamato, challenger, and I keep it with them: the badges are earned in sequence here, first to last.',
        'You are missing the ' + (missItem ? missItem.name : miss) + ' — ' + (JOHTO_LEADER_WAITS[miss] || 'its leader') + ' is where that road goes next. Win that badge first, and I will be here, ready, when you come back.'];
    };

    if (kind === 'daycare') { this.openDaycare(npc); return true; }

    if (kind === 'elm') {
      if (!flags.johto_arrival && !flags.ev_johto_arrival_done) { this.runEvent('ev_johto_arrival'); return true; }
      if (flags.silver_r30_done && !flags.silver_reported) {
        say(['You met him. On Route 30, with the RIDGEJAW — yes. Yes, that is my missing page, walking around with red hair and no intention of apologizing.',
          'A name. You are sure? ...Riven. One of the aides found his practice registration in the hedge by the window — half a card, all the name we need. Riven.',
          'Thank you, {player}. A lab keeps records, and now mine has its page back — the rest of that story is his to write, and I suspect he will write it at you, repeatedly. The road west is yours: Iris first, then Cinder. And when you reach Hendrik — remember what you are carrying.'], () => {
          flags.silver_reported = true;
          g.ui.toast('You reported the thief to Linden.');
        });
        return true;
      }
      if (flags.silver_reported) { say(['Riven. The record is complete, and the road is yours, {player}. Iris, Cinder, and Hendrik — in that order, the way the wind goes.']); return true; }
      say(['North through Blossom, then Route 30 to Iris, {player}. And eyes open — red hair, no fear. Come back to me with whatever you find.']);
      return true;
    }

    if (kind === 'sprout_elder') {
      if (flags.sprout_tower_done) { say(['The tower sways, and so do we all. Aven\'s birds are watching the road for you, child.']); return true; }
      say(['You climbed. Slowly, I hope — the tower dislikes being hurried, and so do my knees.',
        'I am Li, keeper of this creaking old prayer. The monks tell me your legs danced on the stairs, and the tower tells me the rest: you bend, traveler. You do not break.',
        'Take these, and an old man\'s ruling with them: Aven of the Iris Gym now owes you his proper challenge. Tell him the tower said so. It usually sways him.'], () => {
        st.bag.superpotion = (st.bag.superpotion || 0) + 2;
        flags.sprout_tower_done = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Got 2 Super Potions!');
      });
      return true;
    }

    if (kind === 'kurt') {
      // Stage J6: apricorn crafting rides AHEAD of Kurt's story chain
      // (a pending order reports/collects first; a carried apricorn
      // offers the craft menu, whose "Just talk" re-enters this
      // handler with a one-shot session pass so the GS Orb chain
      // below runs byte-identically).
      st.session = st.session || { learnQueue: [] };
      const kStatus = kurtOrderStatus(st);
      if (kStatus.busy) {
        if (kStatus.ready) {
          say(['It is done, {player}. Smell that — fresh shell, warm as bread. One ball at a time, made properly.'], () => {
            const res = kurtCollect(st);
            if (res.ok) { g.audio.playSfx('dex-register'); g.ui.toast('Got the ' + ITEMS[res.ball].name + '!'); }
          });
          return true;
        }
        say(['The ball is on the bench, and the bench does not hurry. Walk about ' + kStatus.remaining + ' more steps out there — the work settles at walking pace, like everything true in this town.']);
        return true;
      }
      if (st.session.kurtTalkOnce) {
        delete st.session.kurtTalkOnce;
      } else {
        const ownedApricorns = APRICORN_IDS.filter((id) => (st.bag[id] || 0) > 0);
        if (ownedApricorns.length) {
          say(['Forty years I have worked Capture Orbs by hand, trainer — and my eyes still catch a podnut in a bag before the bag is even open. You are carrying ripe ones.',
            'One ball at a time — that is the workbench law — and it settles over 250 steps of your walking. Shall I work one for you?'], () => {
            const items = ownedApricorns.map((id) => ({ label: 'Craft: ' + ITEMS[id].name + ' -> ' + ITEMS[APRICORN_TO_BALL[id]].name, value: id }));
            items.push({ label: 'Just talk', value: '__talk' });
            items.push({ label: 'Leave', value: null });
            g.ui.showMenu('Hand Hendrik a podnut?', items, (v) => {
              if (v === '__talk') { st.session.kurtTalkOnce = true; this.runJohtoNpc(npc); return; }
              if (!v) return;
              const res = kurtPlaceOrder(st, v);
              if (res.ok) say(['He takes the ' + ITEMS[v].name + ' in both hands, the way you would take a sleeping bird.', 'Come back after 250 steps of walking, {player}. The ball will be on the bench, and so will I.']);
              else say(['The workbench is busy, trainer. One ball at a time.']);
            });
          });
          return true;
        }
      }
      if (!flags.johto_well_cleared) {
        if (flags.kurt_well_plea) { say(['Still sitting, still useless, still proud — the back has union rules, apparently. The well, trainer. Three Rockets, and DOZPOTAM who deserve better. My house will keep.']); return true; }
        say(['Mind the well on your way past, trainer. Something down there smells like a market that should not exist. If you find an old man investigating it badly — that will be me, shortly.']); return true; }
      if (!flags.gsball_delivered) {
        if ((st.bag.gsball || 0) > 0) {
          say(['The well is quiet, the DOZPOTAM are whole, and Cinder can hear itself think again. You did in an hour what my back would not let me do all day, {player}.',
            '...Wait. Wait wait wait. That — in your bag. Gold and silver bands, warm as a held hand. Let me see it. LET me see it.',
            'Forty years I have worked Capture Orbs by hand. Forty years, and I have never — feel that? It is not locked. It is not broken. It is WAITING, and no tool I own speaks its language. Even I cannot open this ball, trainer.',
            'But listen. ...There. It hums. It has hummed twice since I took it — both times when the wind came through Holly Forest, from the old shrine in the trees. Whatever this ball is waiting for, it is waiting THERE. Keep it with me a while. Let an old man study it properly, and when the forest calls, we will both know.'], () => {
            st.bag.gsball = (st.bag.gsball || 0) - 1;
            if (st.bag.gsball <= 0) delete st.bag.gsball;
            flags.gsball_delivered = true;
            flags.kurt_has_ball = true;
            // The ball's whereabouts, recorded precisely in the
            // boolean flag vocabulary (the validator's flag law):
            // the GS Orb is IN KURT'S HOUSE, in his study, until
            // J5's shrine scene moves it.
            flags.gsball_at_kurt_house = true;
            g.audio.playSfx('dex-register');
            g.ui.toast('Hendrik is studying the Sealed Orb.');
          });
          return true;
        }
        say(['The well is quiet, the DOZPOTAM are whole, and Cinder can hear itself think again. You did in an hour what my back would not let me do all day, {player}.',
          'Hawthorn wrote that you carry a ball no machine can open. Bring it to this house when you can — an old pair of hands would like its turn at being defeated by it.']);
        return true;
      }
      // Stage J5: the ball stirs. Once the tower has woken
      // (beasts_awakened), Kurt's study scene resolves: he returns
      // the ball to the bag and the whereabouts chain moves exactly —
      // kurt_has_ball / gsball_at_kurt_house clear, the ball is back
      // with the player, and the historical gsball_delivered stands.
      if (flags.beasts_awakened && !flags.gsball_back_with_player) {
        say(['You have come at the right hour, {player}. Sit — no. Stand. You will want to be standing for this.',
          'The night the tower woke — and do not ask me how an old man in Cinder knows which night that was, the BALL told me — it began to hum. Not at the Ilex wind, the way it used to. Through it. Like something far away had finally answered, and the answer was a place, and the place was a shrine.',
          'Forty years of craft, and the conclusion of all my study is this: it was never mine to keep, and it is done being studied. Here. Take it back, trainer. Whatever it has been waiting for is awake now — and it is waiting in Holly Forest, at the old shrine, for the hands that carried it here.'], () => {
          st.bag.gsball = (st.bag.gsball || 0) + 1;
          flags.kurt_has_ball = false;
          flags.gsball_at_kurt_house = false;
          flags.gsball_back_with_player = true;
          if (!st.story.quests.arc_celebi) st.story.quests.arc_celebi = 'discovered';
          g.audio.playSfx('dex-register');
          g.ui.toast('Hendrik returned the Sealed Orb.');
        });
        return true;
      }
      if (flags.gsball_back_with_player && !flags.arc_celebi_done) {
        say(['It is yours again, and louder than ever, I\'ll wager. The shrine in Ilex, {player} — through the forest gate, in the old clearing. Go and let the ball finish its one errand.']);
        return true;
      }
      if (flags.arc_celebi_done) {
        say(['An open ball, an answered forest, and news that walked here faster than you did. Keep the ball, {player}. Some tools a craftsman makes once in a lifetime. That one, nobody made — and now it is a souvenir of the day time itself said hello to Cinder.']);
        return true;
      }
      say(['The ball sits in my study and hums at the Ilex wind. Patience, trainer. Some locks are not picked. They are answered.']);
      return true;
    }

    if (kind === 'rocket_well_1' || kind === 'rocket_well_2' || kind === 'rocket_well_3') {
      const tid = kind;
      if (flags['beat_' + tid]) { say(['...We are leaving. We were ALWAYS leaving. This never happened.']); return true; }
      if (!flags.kurt_well_plea) { say(['Work site, trainer. Authorized personnel, tail division. Come back when you have a uniform — or do not come back at all.']); return true; }
      say([TRAINERS[tid] ? TRAINERS[tid].intro[0] : 'For the boss!'], () => {
        this.startJohtoBattle(tid, (won) => {
          if (!won) return;
          if (flags.beat_rocket_well_1 && flags.beat_rocket_well_2 && flags.beat_rocket_well_3 && !flags.johto_well_cleared) {
            flags.johto_well_cleared = true;
            say(['The last Vanta scrambles up the ladder and does not look back. Below, in the wet dark, the DOZPOTAM lift their heads one by one — slow, unhurried, already forgetting, which is the kindest thing about them.', 'Somewhere above, a bent old man is about to hear the best news of his year. Hendrik\'s house, trainer. And bring what you are carrying — he has waited long enough.'], null, 'NARRATOR');
          }
        });
      }, npc.name);
      return true;
    }

    // ================= Stage J4b: the east actors =================
    if (kind === 'pharmacist') {
      if (flags.amphy_healed) { say(['Lumi\'s light is back over the water — the whole island saw it come on at dusk. That is the best review this pharmacy has ever had, trainer.']); return true; }
      if ((st.bag.secretpotion || 0) > 0) { say(['That potion in your bag is the real article — my own mix, both hands, no shortcuts. Get it across the water to the lighthouse, and do not drop it. Lumi is counting on a steady hand.']); return true; }
      say(['You have the look of an errand that matters. Let me guess — no. Let me KNOW: it is Lumi, isn\'t it. The lighthouse Kin, sick these past weeks, and Beacon out of its depth.',
        'This is the Secret Potion. My family\'s recipe, the strong one — we make it for exactly one patient at a time, and today the patient is a lighthouse. Carry it carefully, trainer. Half of Yamato\'s ships steer by that light.'], () => {
        st.bag.secretpotion = (st.bag.secretpotion || 0) + 1;
        flags.secret_potion_got = true;
        g.audio.playSfx('dex-register');
        g.ui.toast('Got the Secret Potion!');
      });
      return true;
    }

    if (kind === 'jasmine_light') {
      if (flags.amphy_healed) { say(['Look at her. Look at that light — steady, warm, all the way to the horizon. Lumi is well, trainer, and every ship between here and Tidewall knows it tonight because of you.', 'And now I owe you the other thing I promised myself I would give properly: a battle, with nothing held back and nothing weighing on it. My gym, when you are ready. I will be there. So will FERROWYRM.']); return true; }
      if ((st.bag.secretpotion || 0) > 0) {
        say(['That smell — honey and iron and something green. The Tidewall mix. You actually crossed the sea for her. Trainer... thank you. Hold her steady for me. Lumi, love — medicine. The good kind, from across the water.'], () => {
          st.bag.secretpotion = (st.bag.secretpotion || 0) - 1;
          if (st.bag.secretpotion <= 0) delete st.bag.secretpotion;
          flags.amphy_healed = true;
          g.audio.playSfx('heal');
          say(['She drinks. A long, shuddering breath — and then the lamp room does what it has done every dusk for a hundred years, all at once, like a held note finally sounded: the light comes on. Slowly. Then completely. Out past the harbor mouth, three ships sound their horns in answer.', 'Lumi is well. And I... I am free to be a gym leader again, with my whole heart in it. My gym is across the plaza, trainer. Come and take your battle — you have more than earned the queue jumping.'], null, 'LIORA');
        });
        return true;
      }
      if (!flags.jasmine_asked) {
        say(['Oh — a trainer. Forgive me, I — my name is Liora. I keep Beacon\'s gym, most days. These days I keep this room.',
          'This is Lumi. Her light has guided Beacon\'s ships since before I was born, and she is sick — a fever no medicine in this city touches. The pharmacy in Tidewall, across Route 40, makes one thing that might: their Secret Potion. I cannot leave her. The ships cannot wait much longer. Trainer... would you go? For a lighthouse?'], () => { flags.jasmine_asked = true; });
        return true;
      }
      say(['Lumi is holding on. The Tidewall pharmacy, trainer — across the sea road, Route 40. Their Secret Potion is her best hope, and you are its fastest ship.']);
      return true;
    }

    if (kind === 'lance_lake') {
      if (flags.red_gyarados_done) { say(['The lake is quiet — listen to it being quiet. That is our work, trainer. Redwood next: whatever made this lake scream is buried under that town, and I mean to dig. Meet me there.']); return true; }
      say(['Careful at the water\'s edge, trainer. Something in that lake is in pain, and pain that size does not stay in the lake for long. Whatever you came here to do — do it gently, or do it fast. Ideally both.']);
      return true;
    }

    if (kind === 'lance_mahogany') {
      if (flags.johto_hideout_cleared) { say(['The signal is dead and the lake is calm — I checked from the air at dawn. the Vanta Syndicate\'s Yamato operation ended in that basement, trainer. What remains is the honest work: Albin, Cragmoor, and a Conference with your name rising up its bracket.']); return true; }
      if (!flags.red_gyarados_done) { say(['You have the look of a trainer between errands, so let me lend you one: the Wrathmere Lake, north of here. Something red is tearing it apart, and I do not believe in coincidences with scales. Look into it. Then come back and tell me what the water said.']); return true; }
      say(['You saw the lake. You heard the signal in its screaming. The source is here, {player} — under the souvenir shop, behind the postcards: a transmitter, a power core, and the whole Yamato operation of a team that should have stayed beaten.', 'WYRMARCH and I take the front, through the shop\'s stair. You take everything that moves behind us. Are you ready to go down?'], () => {
        g.ui.showMenu('Enter the Hideout with Darian?', [
          { label: 'Descend', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
      });
      return true;
    }

    if (kind === 'clair') {
      if (jBadges.includes('risingbadge')) { say(['The Rising Badge sits well on you, {player}. The den chose, the shrine approved, and I — I concur, which the clan will tell you is the rarest of the three. The Conference road is yours. Do not waste it.']); return true; }
      if (flags.clair_beaten) { say(['The gym is settled between us — the DEN is not. North of the town, through the cliff mouth: the Drake\'s Den, the elder, the old questions, the shrine. The badge waits there, {player}. It has only ever waited there.']); return true; }
      // Stage J5: Clair's battle gates at index 7 like every other
      // leader's (the den award path beyond it is unchanged).
      const clairRefusal = badgeOrderRefusal('risingbadge');
      if (clairRefusal) { say(clairRefusal); return true; }
      const ct = TRAINERS.clair;
      say([ct.intro[0]], () => {
        g.ui.showMenu('Challenge Rhea?', [
          { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          this.startJohtoBattle('clair', (won) => {
            if (!won) return;
            flags.clair_beaten = true;
            say(['North, then. The cliff behind this town, the water that runs black and patient — the Drake\'s Den. The elder will ask you the old questions, and the shrine will ask its own. Pass, and the Rising Badge is yours by the clan\'s law. Fail... and you may try again. Dragons respect persistence almost as much as strength.'], null, 'RHEA');
          });
        });
      });
      return true;
    }

    if (kind === 'den_elder') {
      if (jBadges.includes('risingbadge')) { say(['The badge rose, the shrine is quiet, and the dragons have a new name to respect, {player}. Walk the Conference road the way you walked this den: like you belong on it. You do.']); return true; }
      if (!flags.clair_beaten) { say(['I am the elder of this den, and this is a place of judgment, not tourism. The test is for those Rhea has faced and failed to dismiss — win her gym first, trainer, and then come and be weighed properly.']); return true; }
      // The elder's test: three questions (every answer is heard —
      // the choice law — and the elder's verdict names what the
      // answers showed), then the shrine battle. Win the battle and
      // the Rising Badge is awarded HERE, by the exact leader-award
      // representation (badges.johto push + badge_rising flag) —
      // the badge-count proof: 7 after the gym, 8 after the den.
      say(['So. Rhea faced you and could not dismiss you. Then the den will weigh what the gym could not. Three questions, trainer, the old ones. Answer as yourself — the shrine can hear varnish crack.', 'First: a young dragon in your care loses, badly, in front of the whole clan. What do you do?'], () => {
        let honest = 0;
        const ask2 = () => {
          g.ui.showMenu('Second: what makes a dragon strong?', [
            { label: 'A heart that trusts its trainer', value: 'honest' },
            { label: 'Breeding and bloodline', value: 'proud' },
            { label: 'Fear. Theirs, of me', value: 'cruel' },
          ], (v2) => {
            if (v2 === 'honest') honest++;
            say(['Last: your rival stands where you are standing, asking for the badge you came for. What do you hope for them?'], () => {
              g.ui.showMenu('The elder waits.', [
                { label: 'That they pass, and meet me at the top', value: 'honest' },
                { label: 'Nothing. The den decides', value: 'proud' },
                { label: 'That they fail where I did not', value: 'cruel' },
              ], (v3) => {
                if (v3 === 'honest') honest++;
                flags.den_test_done = true;
                const verdict = honest >= 2
                  ? 'Your answers have the shape of the thing itself, trainer. The clan has a word for trainers like you, and it is not a small one.'
                  : 'Your answers are... armored. But armor can be learned out of a person, and the shrine\'s question is the honest one. Let us see which of you shows up to it.';
                say([verdict, 'Now the shrine asks its question. Keeper Sora — the floor is yours.'], () => {
                  this.startJohtoBattle('den_shrine', (won) => {
                    if (!won) return;
                    if (!st.badges.johto.includes('risingbadge')) st.badges.johto.push('risingbadge');
                    flags.badge_rising = true;
                    g.audio.playSfx('badge');
                    say(['It is decided, then — by gym, by word, and by battle, the full measure of the old law.', 'The RISING BADGE is yours, {player}. Eight badges. The whole of Yamato, answered. Rhea will hear of this before you reach the town — the den has its own ways of telling her. The road north is open now: Lastlight Pass, Lastlight Town, and the Conference that has been waiting for you since Galefield.'], null, 'DEN ELDER');
                  });
                });
              });
            });
          });
        };
        g.ui.showMenu('The elder waits.', [
          { label: 'Kneel. It lost with me, not for me', value: 'honest' },
          { label: 'Train it harder before dusk', value: 'proud' },
          { label: 'Trade it for a stronger one', value: 'cruel' },
        ], (v1) => { if (v1 === 'honest') honest++; say(['Second question comes the way weather does, trainer — whether you are ready or not.'], ask2, 'DEN ELDER'); });
      });
      return true;
    }

    if (kind === 'silver_gate') {
      if (jBadges.length >= 8) { say(['Eight badges, counted with my own eyes — the pass is yours, Conference trainer. Hald, veteran of this road, at your service. Riven, when you are ready, is in the stadium. So is the young man with the red hair\'s opposite number. Make it a good one.']); return true; }
      say(['Pass Officer Hald — the League keeps me at this end of the road to count, so let me count for you, trainer: ' + jBadges.length + ' of 8 Yamato badges in that case.', 'The rule is the rule, and it turns nobody away forever: earn the eight — Cragmoor and the Drake\'s Den hold the last of it for most — and this road opens like it was built for you. Because by then, trainer, it will have been.']);
      return true;
    }

    if (kind === 'conference') {
      if (flags.johto_complete) { say(['The bracket is archived, the confetti is swept, and your name is in the Conference book in the good ink, trainer. Whatever mountain is next — and there is always a next one — Lastlight Town was glad to host this chapter.']); return true; }
      if (jBadges.length < 8) { say(['Conference registration, trainer — and I can see by your case that the road is not finished with you yet. Eight Yamato badges open this bracket. You hold ' + jBadges.length + '. Cragmoor is the usual last stop. I will keep your page open.']); return true; }
      if (!flags.conference_registered) {
        say(['Eight badges. Counted, verified, and — if I may — well carried, trainer. Let me write your name into the Lastlight Conference properly... There. Registered.', 'The bracket: two qualifying battles, here in this stadium, then the names you already know are waiting deeper in. Vale is on the far side of the draw. He asked me to tell you the bracket was "finally interesting." His words. Begin when you are ready — speak to me for each qualifier.'], () => {
          flags.conference_registered = true;
          g.audio.playSfx('dex-register');
          g.ui.toast('Registered for the Lastlight Conference!');
        });
        return true;
      }
      if (!flags.beat_conference_q1) {
        say(['Qualifier one, trainer. Brenna, of the western road — a clean battler with a cleaner record. The floor is yours when you call it.'], () => {
          g.ui.showMenu('Begin qualifier one?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('conference_q1', null); });
        });
        return true;
      }
      if (!flags.beat_conference_q2) {
        say(['One down. Qualifier two: Cato, who has been telling the stands all morning that the draw did him a favour. Correct him, would you?'], () => {
          g.ui.showMenu('Begin qualifier two?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('conference_q2', null); });
        });
        return true;
      }
      if (!flags.beat_gary_johto) { say(['The qualifiers are behind you, and the whole stadium knows what is next. Vale is on the pitch, pretending not to warm up. Go and give these people the match they came for.']); return true; }
      if (!flags.harrison_faced) { say(['Vale is beaten, and the bracket has one name left on your side of it: Harrison, in the quarter-final. He is standing by the pitch with his CHARHOUND and his good manners. End this Conference properly, trainer.']); return true; }
      say(['The Conference is decided, and decided honestly. The book has it. So does everyone who was here.']);
      return true;
    }

    if (kind === 'gary_stadium') {
      if (flags.johto_complete) { say(['Still here? The Conference is over and you are still the story of it — even Harrison\'s people are telling it your way. Go home, {player}. Dawnwick first. It is what the road is FOR. Smell ya later — and I mean that warmer than it sounds.']); return true; }
      if (flags.beat_gary_johto) { say(['Beaten, and — fine, I will say it in the open where it costs me: beaten FAIR, by the best version of you there has ever been. Harrison is next, {player}. He is better than his bracket manners suggest. Do not lose to him after beating me. I would never recover, and neither would you.']); return true; }
      if (!flags.conference_registered) { say(['Registration first, {player}. Even I had to sign the book — the official, by the bracket board. Then qualifiers. THEN you may lose to me properly, in order, like tradition demands.']); return true; }
      if (!flags.beat_conference_q2) { say(['Qualifiers first. Brenna, then Cato — the bracket is the bracket, even for the main event. I will be right here, being patient at a professional standard.']); return true; }
      const gt = TRAINERS.gary_johto;
      say(gt.intro.map((l) => l.replace('{player}', st.player.name)), () => {
        g.ui.showMenu('Face Vale — the Lastlight Conference centrepiece?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.startJohtoBattle('gary_johto', null); });
      }, 'VALE');
      return true;
    }

    if (kind === 'harrison') {
      if (flags.johto_complete) { say(['The Conference book is closed and your name is in it in the good ink, trainer. Whatever either of us does next, this stadium saw the real thing. Travel well. CHARHOUND and I will be telling this one for years.']); return true; }
      if (!flags.beat_gary_johto) { say(['Harrison, from Rootlet Town. We are on a collision course, you and I — but Vale is your road to me, and the bracket does not bend. Beat him first. I will be here, and I will be ready either way.']); return true; }
      // The quarter-final (mechanism recorded at his trainer def):
      // a real full-strength battle, fought FRIENDLY — the predicate
      // is FACED, not won. Win or lose, the branch-true honours play,
      // johto_complete is set, and the Foundation machine itself
      // fires (checkArcCompletion — ARC COMPLETE card, regionsDone,
      // the pinned Maris directive; nothing here writes regionsDone).
      say(['So it is us. Vale is beaten — I watched it from the tunnel, and I will carry that match with me whatever happens here.', 'Quarter-final rules, trainer, and Conference stakes. Give me everything you gave him. CHARHOUND and I did not cross the bracket for less.'], () => {
        g.ui.showMenu('The quarter-final — face Harrison?', [
          { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const ht = bondTrainerVariant(g.state, TRAINERS.harrison);
          g.scenes.push(new BattleScene({
            kind: 'trainer', trainer: ht, returnTo: this, rt: rtOf(g), friendly: true,
            onEnd: (won, fled) => {
              if (fled) return;
              recordBattleBond(g.state, ht.id, won, fled);
              flags.harrison_faced = true;
              if (won) flags.harrison_won = true; else flags.harrison_lost = true;
              const lines = won ? [
                '...Well. WELL. The card says your name, trainer — the judges did not even deliberate. An upset, the papers will call it. It was not an upset. I was there. It was a better team, on a bigger day.',
                'Take the semi-final road with my respect — you have beaten the two best trainers in this bracket back to back, and one of them is standing here applauding. The Conference is yours in every way that history checks.',
              ] : [
                '...It is decided. The final exchange — CHARHOUND endures, the crowd comes up off its seats like a tide, and the judges\' card, when it turns, says Harrison.',
                'Do not hang your head. DO NOT. You beat Vale Hawthorn in this stadium, you carried eight badges across a region that tests everything, and you took me to the last Kin I own. The loss stands — that is sport. So does everything you did to get here — that is history.',
                'Vale is in the tunnel, trainer. Even he is applauding. Especially him, though he will deny the especially.',
              ];
              say(lines, () => {
                flags.johto_complete = true;
                g.audio.playSfx('badge');
                say(['Lastlight Conference — the run ends in honours, and Yamato ends with it: eight badges, a rivalry settled, a lake calmed, a tower retaken, and a Conference that will be argued about in Lastlight Town for a decade. The road home is waiting, trainer. It always was.'], () => { checkArcCompletion(g); }, 'NARRATOR');
              }, 'HARRISON');
            },
          }));
        });
      });
      return true;
    }

    if (kind === 'red') {
      if (!flags.johto_complete) { say(['...'], null, 'ROSS'); return true; }
      if (flags.red_defeated) {
        say(['...!', '...'], () => {
          g.ui.showMenu('Battle Ross again?', [
            { label: 'Battle', value: 'yes' }, { label: 'Not yet', value: 'no' },
          ], (v) => { if (v === 'yes') this.startJohtoBattle('red', null); });
        }, 'ROSS');
        return true;
      }
      say(['...'], () => {
        this.startJohtoBattle('red', (won) => {
          if (!won) return;
          flags.red_defeated = true;
          say(['...!!', 'He tips his cap — once, the way a mountain might bow — and turns back to the snow and the silence, satisfied in a way that has nothing to do with winning. Some names are not beaten, exactly. They are answered. His was.'], null, 'ROSS');
        });
      }, 'ROSS');
      return true;
    }

    // ---- Stage J5: legendary witnesses, elders, and the stairs ----
    // The beast chases' sign-steps. Each beast has TWO witnesses in
    // order: the first reports the passing and points to the second;
    // the second points to the lair. A witness only files their
    // report after beasts_awakened, and the second only after the
    // first (a trail reads from the beginning) — the flags they set
    // are the arc steps' flags.
    const BEAST_SIGNS = {
      beast_sign_raikou_1: { arc: 'arc_raikou', sign: 'arc_raikou_sign1', prev: null, toast: 'VOLTIGRIS\'s trail: a storm-split pine on Route 35. It went east.',
        dormant: ['Storms I can read. That one last week, I could not. It came out of a clear sky, struck the old pine twice — and here is the part my report left out: the second bolt had already happened when the first one\'s thunder arrived. Backwards weather. I have stopped writing that down where supervisors can see it.'],
        lines: ['There — see the pine? Black on the east side, and the grass around it combed FLAT, all one way, like something enormous stood here letting the storm off its back in waves.',
          'I was up the pole when it happened, trainer. The lightning came twice, and between the flashes something stood in the road looking at the tree — four legs, a mane like a storm deciding to be hair, and fast the way ideas are fast. It did not flee. It departed. There is a difference, and my hands knew it before I did.',
          'It went east, toward the park road. Thunder that hunts, hunts open ground — if you are following it, the National Park is where I would stand and wait to be found.'],
        again: ['The pine is still black, the grass still combed. East, trainer — the National Park\'s open ground, when the air starts standing up on your arms.'],
        after: ['They say the park\'s storm has a keeper now, and the keeper has a trainer. My reports have gone back to being very dull, and I have never been happier to file one.'] },
      beast_sign_raikou_2: { arc: 'arc_raikou', sign: 'arc_raikou_sign2', prev: 'arc_raikou_sign1', toast: 'VOLTIGRIS\'s trail ends at the National Park\'s storm field.',
        tooEarly: ['The meadow stones, you mean? Scorch marks shaped almost like writing. Something passed here, certainly — but if you want the start of the trail it is west: Route 35, the storm-split pine, and a watcher named Iben who saw more of it than I did. Trails, like sentences, read best from the beginning.'],
        lines: ['Look at the stones — no. LOOK at them. Scorch in spirals, and at the centre of every spiral, a print. A pawprint, trainer, burned into meadow stone like a signature pressed into sealing wax.',
          'Whatever signed this meadow was not passing through. It was announcing. East of here the land opens out — the National Park, all that flat green under all that sky. A creature made of storm does not hide in woods and alleys. It waits in the open, daring the weather to argue.'],
        again: ['The stones keep their signature. The park, trainer — open ground, when your hair starts to rise.'],
        after: ['I heard the thunder over the park stop all at once, like a sentence finishing. Rangers talk, trainer. Congratulations — the meadow stones make sense now: it was practising its autograph.'] },
      beast_sign_entei_1: { arc: 'arc_entei', sign: 'arc_entei_sign1', prev: null, toast: 'MAGMALION\'s trail: warm pawprints in the Ashen Tower\'s ash. It went toward heat.',
        dormant: ['One hundred and fifty years of ash, and my whole duty is to keep it unstepped-in. Something died in this tower, trainer, and something else has been keeping the grief warm ever since. I sweep around the prints. That is all I will say while the basement sleeps.'],
        lines: ['You have been below — I can tell; everyone who has wears the same quiet for a day. Then look, and do not step: the ash by the north wall. Prints. Enormous, fresh, and warm to the back of the hand, in a tower that has been cold since before my grandfather\'s grandfather.',
          'The monks\' old books say the fire-beast walks out of this ash when it walks at all, and goes where the earth itself is hot. Mortar, trainer. The mountain east of us has a furnace in it that no one dug. Whatever was reborn in fire will go home to heat eventually.'],
        again: ['Prints in the ash, pointing east. Mt. Millstone, trainer — follow the warmth.'],
        after: ['The ash is cold this morning — truly cold, for the first time in my tenure. The tower feels... finished with something. Whatever you did on that mountain, monk\'s honour: the old tower thanks you.'] },
      beast_sign_entei_2: { arc: 'arc_entei', sign: 'arc_entei_sign2', prev: 'arc_entei_sign1', toast: 'MAGMALION\'s trail ends in Mt. Millstone\'s deep chamber.',
        tooEarly: ['You feel it too? The warm draught from the upper halls. Master says it is geology. Master also says I imagine the smell of woodsmoke. Start where the prints are, trainer — the Ashen Tower in Lantern keeps an ashkeeper who reads ash the way you read a map.'],
        lines: ['Shh — feel the floor. There. Again. The mountain has a heartbeat, and it is not mine. It started the week the tower in Lantern woke; Master doubled our training and tripled his pretending not to notice.',
          'Twice now I have seen the steam burst UP the chimney vents with nothing cooking below, and once — once — I heard a sound come down the shafts like a furnace clearing its throat. Whatever is using the deep chamber has a volcano\'s manners. Go carefully, trainer. The upper halls, and mind the heat.'],
        again: ['The heartbeat is still there, under the floor. The deep chamber, trainer — upper halls, and mind the heat.'],
        after: ['The mountain is quiet. Not cold — quiet, the way a dojo is quiet after the last bow. Master has started admitting he noticed things. Progress on every front, then.'] },
      beast_sign_suicune_1: { arc: 'arc_suicune', sign: 'arc_suicune_sign1', prev: null, toast: 'BOREPARD was seen at the Chime Tower\'s foot. The wardens say it comes for the last time when its kin are quiet.',
        dormant: ['I wind the tower bells and polish what the wind leaves. On certain mornings the big bell is wet — WET, trainer — though the night was dry as paper. The last keeper wrote it in the log for forty years and never once explained it. Keepers do not explain. We record.'],
        lines: ['Then you are the one the logbook has been waiting for, because I am recording it now: three mornings since the tower woke, I have come at dawn and found it standing at the Chime Tower\'s foot. Still as a held breath. Ribbons moving in a wind that was not blowing anything else.',
          'It did not run from me. It does not run, the old texts say — it arrives, when the water of the world needs carrying somewhere. The texts also say it will not come to the tower for the last time until its kin are quiet. The thunder and the fire first, trainer. Then, the tower\'s foot, at dawn.'],
        again: ['Dawn, the tower\'s foot — but only when the others are quiet. It keeps its own order, that one.'],
        after: ['This morning the big bell was dry, and the tower felt ordinary, and ordinary has never felt so much like a gift. The logbook has your name in it now, trainer. Keepers record. That is the highest honour we have.'] },
      beast_sign_suicune_2: { arc: 'arc_suicune', sign: 'arc_suicune_sign2', prev: 'arc_suicune_sign1', toast: 'BOREPARD\'s route ends at the Chime Tower\'s foot.',
        tooEarly: ['Fishers notice water, trainer — it is most of the job. If it is the clear-running water you are asking after, start in Lantern. The bell wardens keep a log of strange mornings, and lately every morning in it is strange.'],
        lines: ['You see this shore? The northernmost rocks of Tidewall, where the inlet runs muddy nine days in ten. Last week it ran CLEAR — clear as a poured glass, all the way out to the second buoy — and a shape went along the waterline faster than the current, not swimming, not flying. Walking on the skin of the sea like it was a road it owned.',
          'My grandmother had a word for water that cleans itself as it goes, and the word was a name, and I am not saying it out loud where the gulls can steal it. But the Lantern wardens will. It was travelling, trainer, settling its route. Where it ends, they say, is a tower — when the time is right.'],
        again: ['The inlet has gone back to muddy, which almost disappoints me. The tower in Lantern, trainer — its foot, at dawn, when the others are quiet.'],
        after: ['The harbourmaster asked me why the fish have been calm all week. I told him the water signed a treaty. He laughed. Let him — you and I know what walked the shoreline.'] },
    };
    const BS = BEAST_SIGNS[kind];
    if (BS) {
      if (!flags.beasts_awakened) { say(BS.dormant); return true; }
      if (flags[BS.arc + '_done']) { say(BS.after); return true; }
      if (flags[BS.sign]) { say(BS.again); return true; }
      if (BS.prev && !flags[BS.prev]) { say(BS.tooEarly); return true; }
      say(BS.lines, () => {
        flags[BS.sign] = true;
        if (BS.prev && st.story.quests[BS.arc] !== 'complete') st.story.quests[BS.arc] = 'active';
        g.ui.toast(BS.toast);
      });
      return true;
    }

    if (kind === 'hooh_elder') {
      if (flags.hooh_history) {
        if (flags.hooh_bell_received) { say(['The bell, the summit, the dawn. Go, trainer — the sky has waited a hundred and fifty years for somebody specific, and my money is on the shape of your shadow.']); return true; }
        if (flags.arc_raikou_done && flags.arc_entei_done && flags.arc_suicune_done) { say(['The beasts are quiet and the sisters are waiting, {player}. The dance theatre, across town — ask for the eldest dance, and mind your manners: they are older than they look, and so is their gift.']); return true; }
        say(['The history you have; the bell you have not, and the bell waits on the beasts. Quiet the thunder, the fire, and the north wind first, {player} — then the sisters. The tower keeps its order, and so do I.']);
        return true;
      }
      say(['You ask an old man about towers, in Lantern, in this year of all years. Walk with me — my knees teach better than my chair does.',
        'A hundred and fifty years ago this town kept two towers, so that whichever way the great bird came over the hills there would be bells beneath it. The bells were never alarms, child. They were doorbells. Then lightning — ordinary, stupid, indifferent lightning — took the western tower, and three Kin who slept in its basement died in a fire no one could outrun.',
        'And the bird came back. That is the part the histories whisper: it came down through the smoke and it CALLED — and the three who died stood up out of the ash and ran, remade: one into thunder, one into the mountain\'s fire, one into the north wind itself. Then it circled the new tower once, and it has been waiting ever since — not for worship. For a heart it could trust with what it protects.',
        'You saw it, didn\'t you. On the road, in the morning, most likely — it likes to look at candidates before candidates know there is a test. The sisters at the dance theatre keep its bell. When the three it raised are quiet, ask them. And climb at dawn. Everything about that bird happens at dawn.'], () => {
        flags.hooh_history = true;
        if (!st.story.quests.arc_hooh) st.story.quests.arc_hooh = 'discovered';
        g.ui.toast('Elder Gensai told you the tower\'s history.');
      });
      return true;
    }

    if (kind === 'kimono_bell') {
      if (flags.hooh_bell_received) { say(['The bell is lighter than it looks, isn\'t it. Crystal should be heavy. It is not, because it was never really ours — we were only ever its shelf. The summit, trainer. At dawn. Dance attendance is not required, but it is tradition to bow to the sky.']); return true; }
      if (!flags.hooh_history) { say(['You have come about the bell — do not look surprised; the theatre hears everything the tower hears, and the tower hears the town think. But the order of things matters here, trainer: the history first. Elder Gensai walks the east street by the towers most days. Let him tell you about the fire, and the three, and the waiting. Then we will talk about what we keep.']); return true; }
      if (!(flags.arc_raikou_done && flags.arc_entei_done && flags.arc_suicune_done)) { say(['We know about the waking — the theatre\'s floor hummed the night it happened, and three of our dances have been restless ever since. The bell we keep is for the bird, trainer, and the bird will not be called while the three it raised are still abroad and unsettled. Quiet VOLTIGRIS. Quiet MAGMALION. Let BOREPARD finish its errand last, the way it likes. Then come back to us, and bring your best listening.']); return true; }
      say(['Then it is time. Sisters — the eldest dance. The one we perform when the tower\'s guest is finally expected.',
        'They dance it without music, and the silence is the music: five women becoming weather, becoming wings, becoming a tower standing and a tower remembered — and at the dance\'s still centre, Moeko lifts a box of pale cedar and opens it on a bell of clear crystal, cold as well-water, older than the theatre, older than the town\'s second skyline.',
        'The Clear Bell. It has been rung exactly never, trainer. Bells like this are not rung — they are ANSWERED. Take it to the summit at dawn, and hold it where the sky can see it. If the heart is right, the sky will do the rest. It usually does, with hearts like yours.'], () => {
        st.bag.clearbell = (st.bag.clearbell || 0) + 1;
        flags.hooh_bell_received = true;
        if (st.story.quests.arc_hooh !== 'complete') st.story.quests.arc_hooh = 'active';
        g.audio.playSfx('dex-register');
        g.ui.toast('Received the Clear Bell!');
      });
      return true;
    }

    if (kind === 'hideout_stairs') {
      if (!flags.red_gyarados_done) { say(['Storage, trainer — postcards, keyrings, forty cases of commemorative spoons. Nothing down those stairs but stock and spiders, and the spiders pay no rent. Move along and browse the mugs.']); return true; }
      if (flags.johto_hideout_cleared) {
        say(['The basement is quiet again — stock, spiders, and a fine set of empty cages we keep as a warning to future inventory. Have a look if you like; you have earned the tour.'], () => {
          g.ui.showMenu('Take the shop stairs down?', [
            { label: 'Go down', value: 'yes' }, { label: 'Stay up here', value: 'no' },
          ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
        });
        return true;
      }
      say(['You are with the dragon man? Then you already know what my "storage" really is. The stairs are behind the counter, trainer, and whatever is making my stock vibrate is at the bottom of them. Go — and come back with my shop quiet again.'], () => {
        g.ui.showMenu('Take the shop stairs down?', [
          { label: 'Go down', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.enterJohtoHideout(); });
      });
      return true;
    }

    // ---- the west leaders ----
    const LEADERS = {
      falkner: { badge: 'zephyrbadge', gate: 'sprout_tower_done',
        gateLines: ['Not yet, challenger. On this side of Yamato we do it in order: Newleaf Tower first — the climb, the monks, the Elder\'s blessing. My gym is the second half of the test, and I will not rob you of the first.'],
        post: 'The tower sways, the gulls turn, and Iris is quiet below us. Any time your team wants the sky again, challenger, my gym is its address.' },
      bugsy: { badge: 'hivebadge', gate: null, gateLines: [],
        post: 'The webs are re-strung and the forest is humming again. You are welcome under these trees any time, Hive Badge holder.' },
      whitney: { badge: 'plainbadge', gate: null, gateLines: [],
        post: 'No crying this time — I practiced! Come back for a rematch whenever, Plain Badge holder. MOOBELLE asks about your team by name now. By NAME.' },
      morty: { badge: 'fogbadge', gate: null, gateLines: [],
        post: 'The fog keeps its counsel and so do I. Walk carefully in it, Fog Badge holder — it has decided you are interesting.' },
      // Stage J4b east leaders on the same runner: Jasmine's battle
      // story-gate is the potion delivery (amphy_healed), and Pryce's
      // is the hideout (canon order — the occupation ends first).
      // Stage J5 adds the badge-order gate ahead of both (see
      // badgeOrderRefusal): Storm (4) must precede Mineral (5) and
      // Glacier (6) may not precede either — the J4b note's
      // either-order freedom survives only where the prefix law
      // allows it (Chuck before Jasmine was already prefix-true).
      chuck: { badge: 'stormbadge', gate: null, gateLines: [],
        post: 'Any time the sea brings you back, Storm Badge holder, my gym is its loudest address. Bring your hands — and your appetite. My wife insists on feeding challengers who survive me.' },
      jasmine: { badge: 'mineralbadge', gate: 'amphy_healed',
        gateLines: ['I am sorry — truly. I cannot battle while Lumi is sick. A leader who fights with her heart in a lighthouse lamp room is no leader at all, and my FERROWYRM deserves better from me. The light first, trainer. Please. The light first.'],
        post: 'Lumi\'s light and your Mineral Badge, trainer — Beacon shines twice tonight. Come back for a rematch whenever the harbor looks quiet. It so rarely is, and I so rarely mind.' },
      pryce: { badge: 'glacierbadge', gate: 'johto_hideout_cleared',
        gateLines: ['Not yet, challenger. My town is sitting on a Vanta nest, my lake is screaming, and an old man does not hand out badges over an occupation. Clear what is under the souvenir shop — Darian is in town, and the lake road is north. Then come back, and winter will receive you properly.'],
        post: 'The lake is calm, the town is ours, and the Glacier Badge is where it belongs — with the warm-hearted. Winter remembers you kindly, trainer. That is rarer than the badge.' },
    };
    const L = LEADERS[kind];
    if (!L) return false;
    if (jBadges.includes(L.badge)) {
      if (kind === 'morty' && flags.beasts_awakened) {
        say(['So. You have seen the empty plinths too, and the one who watched you from the lamplight\'s edge. Hear the names the tower-keepers use, {player}: VOLTIGRIS, the thunder that walks. MAGMALION, the mountain that burns. And BOREPARD, the north wind made visible — the one whose eyes you met.',
          'They slept as statues for a hundred and fifty years, under a promise nobody wrote down. Promises end. What woke them, I cannot tell you — but they will cross your road again, all three, and when they do, remember: they are not angry. They are AWAKE. There is a difference, and it matters.']);
        return true;
      }
      say([L.post]); return true;
    }
    // Stage J5: the badge-order gate composes ahead of each leader's
    // own story gate (the League's order is the outer law; Sprout
    // Tower / Lumi / the hideout keep their inner gates untouched).
    const orderRefusal = badgeOrderRefusal(L.badge);
    if (orderRefusal) { say(orderRefusal); return true; }
    if (L.gate && !flags[L.gate]) { say(L.gateLines); return true; }
    if (kind === 'morty' && !flags.beasts_awakened) {
      say(['Silas of Lantern. Before we battle, a keeper\'s courtesy: the Ashen Tower stands open in the west of town, and its basement has been... restless. Look into it, trainer. A leader likes to know what his challengers have seen. Then come back, and we will see each other clearly.']);
      return true;
    }
    if (kind === 'morty' && flags.beasts_awakened) {
      say(['You have been below the tower. I can see the ash on you — not on your clothes, {player}. On the way you hold still.',
        'Then you know what I know: the statues are gone, and something with eyes like deep water is abroad in Yamato. We will speak of it properly after. First — the Fog Badge has been waiting for a challenger the fog respects.'], () => {
        g.ui.showMenu('Challenge Silas?', [
          { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
        ], (v) => { if (v === 'yes') this.startJohtoBattle('morty', null); });
      });
      return true;
    }
    const t0 = TRAINERS[kind];
    say([t0.intro[0]], () => {
      g.ui.showMenu('Challenge ' + t0.name + '?', [
        { label: 'Challenge', value: 'yes' }, { label: 'Not yet', value: 'no' },
      ], (v) => { if (v === 'yes') this.startJohtoBattle(kind, null); });
    });
    return true;
  },

  // The shared leader runner, Yamato seat (startOrangeBattle's idiom):
  // the def's intro has already played in the handler above for the
  // menu leaders, so this goes straight to the BattleScene; winTrainer
  // writes the badge itself. onWin(won) fires from the battle's onEnd.
  startJohtoBattle(trainerId, onWin) {
    const g = this.game;
    const t0 = TRAINERS[trainerId];
    if (!t0) { if (onWin) onWin(false); return; }
    const t = bondTrainerVariant(g.state, t0);
    g.scenes.push(new BattleScene({
      kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
      onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); if (onWin) onWin(!!won && !fled); },
    }));
  },
});
