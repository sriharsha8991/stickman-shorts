#!/usr/bin/env python3
"""Slate v4 (owner 2026-11-04): the next 30 Shorts, one niche, series "Spark Got Tricked".
Source of plan/slate_v4.csv. Run: python3 plan/slate_v4.py   (lints every script against tools/clarity_check.py's line rules)."""
import csv, re, sys
from pathlib import Path

P = lambda s: f"[pause {s}]"
# id, slug, format, title, overlay, frame0, trap (Mr. Trick + Spark's fail), payoff by ~10 s, reveal, world, question, script, claim+numbers, caveat, sources, flags
R = []
def add(*a): R.append(a)

add("T01","t01-never-saw","PLAY","Did you really see this word?","WATCH THESE WORDS",
"A word list sliding past on a bedroom wall; Spark holds up a pillow, sure of himself",
"Mr. Trick pins up the list and whispers. Spark brags that he remembers everything, then shouts SLEEP!",
"The question: was sleep on the list? Spark says yes.",
"The list rolls back, word by word. There is no SLEEP. The word falls off Spark's memory wall and smashes.",
"Night-blue bedroom with one long wall",
"Did you see sleep on the list?",
["Why might you remember 1 word you never saw?","Wait for the last part.","Read these words once, and try to remember them.",P(6.5),"Was the word sleep on the list?",P(1.0),"Look again, because it was never there!",P(1.2),"Your brain saw bed and dream, and added sleep.","In one test, people recalled it about half the time.","Did you see sleep on the list?"],
"Lists of related words make people recall a word that was never shown. Exp 2, 15-word lists: false recall 55%, a rate across lists. Show the 15-word sleep list on screen.",
"One lab test with students; 55% is a rate across lists.",
"https://personality-project.org/revelle/syllabi/classreadings/rm95/rm95.html",
"Show bed, rest, awake, tired, dream, wake, night, blanket, doze, slumber, snore, pillow, peace, yawn, drowsy. Words on screen, not spoken.")

add("T02","t02-eye-hole","PLAY","Is there a hole in your eye?","YOUR EYE'S HOLE",
"Two big dots; Spark covers one eye, the other eye huge",
"Spark says his eyes are perfect. Mr. Trick steals a dot from the wall in front of him.",
"The right dot disappears as the viewer moves closer.",
"The eye opens in cross-section: the gap where no vision happens, and the brain paints over it.",
"Optician's room, eye chart on the wall",
"Did the dot disappear for you?",
["Why can your eye never see this 1 spot?","Wait for the last part. One dot will disappear.","Close your left eye, and look at the left dot.","Now move your phone slowly towards your face.",P(3.0),"That dot landed on your blind spot!",P(0.6),"Your brain fills that gap, so you never notice.","Did the dot disappear for you?"],
"Each eye has a blind spot about 15 degrees from centre, about 5 degrees wide; the brain fills it in.",
"Tell viewers to move slowly, because the distance differs. Phones only.",
"https://www.uni-muenster.de/imperia/md/content/psyifp/ae_lappe/meermeier_2023.pdf; https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00534/full",
"Dots about 5.5 cm apart on a phone (about 20 cm viewing, my calculation). Will not work on TV or tablet (about 20% of watch time). Owner tests on a real phone first.")

add("T03","t03-real-colour","PLAY","Can your eyes paint a colour that is not there?","STARE AT SPARK",
"Spark filled solid orange-red, one black dot on his chest, nervous face",
"Mr. Trick has painted Spark red and stolen his teal. The viewer's eyes will bring it back.",
"The screen turns white with a thin Spark outline; the colour ghost appears.",
"The viewer sees a ghost Spark in a colour that is not on the screen, close to his real colour.",
"Plain paint shop, one big white wall",
"What colour did you see?",
["Why do you see 1 colour that is never there?","Wait for the last part. Spark will get his colour back.","Stare at the black dot for ten seconds, and do not move.",P(10.0),"Now look at this white wall, and keep still.",P(2.5),"That colour is not on your screen right now!","Your eyes got tired, so white looks roughly opposite.","What colour did you see on the wall?"],
"Staring at a colour leaves a roughly opposite, paler colour on white. Studies used 20-30 s stares.",
"Say roughly opposite, not exact. No source gives a minimum stare, so 10 s is untested.",
"https://eprints.soton.ac.uk/507287/1/s44271-025-00331-5.pdf; https://www.illusionsindex.org/i/negative-afterimages",
"Owner must test on a real phone. If 10 s is too weak, raise it to 15-18 s and allow up to 40 s. Static picture during the stare, no flashing.")

add("T04","t04-same-grey","ILLUSION","Are these two squares really the same colour?","SAME COLOUR?",
"Checkerboard with a shadow across it, A and B marked; Spark laughs at the idea",
"Spark bets his bulb that B is lighter. Mr. Trick takes the bet.",
"A grey bar slides from A to B, and the board fades away.",
"With the board gone, both squares are one grey. Spark's bulb is carried off.",
"Original board in a games room",
"Did you believe they matched?",
["Why do you never see these 2 squares match?","Wait for the last part.","Square A looks dark, and square B looks light.","But watch what happens when the board goes away.",P(1.0),"They are exactly the same grey colour!",P(1.2),"Your brain sees a shadow, and it corrects for it.","Did you believe that they matched?"],
"Squares A and B are the same grey.",
"Credit: based on Adelson's checker-shadow illusion. Adelson argues this shows vision working well.",
"https://persci.mit.edu/gallery/checkershadow; https://illusionsindex.org/ir/20-checkershadow",
"Draw our own board. Check pixel values after final encoding.")

add("T05","t05-door-swap","STORY","Would you notice if the person talking to you changed?","SAME PERSON?",
"Stranger with a map, a door coming in from the side, Spark squinting",
"Spark gives directions confidently while Mr. Trick carries the door. Spark never notices the swap.",
"Behind the door the two men swap.",
"Replay from above: door passes, man A walks off, man B keeps talking, Spark still chatting.",
"Sunny university path",
"Would you have noticed?",
["Would you notice 1 stranger being swapped with another?","Wait for the last part.","A man asked strangers for directions.","Then two men carried a door between them.","Behind the door, a different man took his place.",P(1.0),"About half the people did not notice him change!",P(1.0),"It was a small test, with only fifteen people.","Would you have noticed the new man?"],
"Exp 1: 7 of 15 noticed, 8 did not. Noticers were students aged about 20-30.",
"Very small test. Say about half, never most.",
"https://gwern.net/doc/psychology/cognitive-bias/illusion-of-depth/1998-simons.pdf",
"")

add("T06","t06-say-colour","PLAY","Can you pass this simple colour test?","SAY THE COLOUR",
"The word RED in green letters, Spark with his mouth open and stuck",
"Spark races through the easy round, then trips over every word in round two.",
"Round one is easy. Round two, the viewer stumbles.",
"Spark's mouth jams on the word, and a giant word falls on him.",
"Game show set",
"Which word stopped you?",
["You fail this 1 colour test. Can you stop reading?","Wait for the last part.","Say each colour out loud, and do not read.",P(2.5),"Now try these words, and say only the colour.",P(4.0),"Did your mouth get stuck on the word?",P(0.8),"Your brain reads the word before you can stop it!","In the old test, people became much slower.","Which word stopped you just now?"],
"Stroop Exp 2: 100 students, 63.3 s for squares vs 110.3 s for conflicting words per 100 responses (74% longer).",
"74% is the 1935 card test.",
"https://eclass.uoa.gr/modules/document/file.php/PHS244/Stroop%2C%20JEP%20%281935%29.pdf",
"Colour-blind viewers may not be able to play.")

add("T07","t07-missed-gorilla","STORY","Could you miss a gorilla right in front of you?","YOU MISSED THIS",
"A chest scan with a tiny gorilla shape inside; Spark's face close to it, not seeing",
"Spark counts passes with a clicker while a gorilla suit walks behind him.",
"The gorilla walks through and most of Spark's attention stays on the ball.",
"The lung scan grows to fill the screen: a gorilla shape inside it, with 20 OF 24 DOCTORS.",
"Basketball court, then a dark scan screen on its wall",
"Did you see the gorilla coming?",
["How can you miss 1 gorilla in front of you?","Wait for the last part. Even doctors missed one.","People counted ball passes in a short video.","A person in a gorilla suit walked through the game.","About half of the people did not see it.","So scientists hid a gorilla in some lung scans.",P(1.0),"Twenty of twenty-four doctors missed it!",P(1.0),"Your eyes can look, and your brain can miss.","Did you see the gorilla coming?"],
"Simons & Chabris: 46% missed across events, 56% gorilla only (secondhand). Drew: 20 of 24 radiologists missed it; 12 of those 20 looked straight at it.",
"Doctors were searching for lung spots, and they still found more spots than untrained people. Only 24 doctors.",
"https://search.bwh.harvard.edu/new/pubs/DrewVoWolfe13.pdf; https://psychologyalevel.com/simons-and-chabris-1999-inattentional-blindness/",
"Re-check Simons numbers in the primary paper on the day. Our own drawing, never the original video.")

add("T08","t08-count-f","PLAY","How many Fs can you count?","COUNT THE F",
"A sentence on a blackboard, Spark holding up three fingers proudly",
"Spark answers THREE, slams the chalk. Mr. Trick adds up behind him.",
"The answer: there are six.",
"Three small OF words light up, one by one, each with an F Spark missed.",
"Old school classroom",
"How many Fs did you count?",
["How many letters will you miss in this 1 sentence?","Wait for the last part.","Count every letter F in this sentence.",P(4.0),"Spark counted three, but there are six.",P(1.0),"Look at the small word of, three times!",P(1.0),"Readers often miss letters in small common words.","How many Fs did you count?"],
"Missing-letter effect: in Healy's passage, 'the' held 28% of the t's but 62% of missed t's. Sentence has 6 Fs (counted).",
"The research used passages, not this sentence, whose origin is unknown.",
"https://link.springer.com/content/pdf/10.3758/BF03197437.pdf",
"Never present the sentence as a study. Do not repeat the 'v sound' explanation.")

add("T09","t09-two-tables","ILLUSION","Are these two tables really different?","WHICH IS LONGER?",
"Two table tops, Spark with a tape measure tangled round him",
"Spark tries to sell the long table for double. Mr. Trick lifts the top off.",
"Legs vanish; one top starts to turn.",
"The turned top lands exactly on the other, and they match.",
"Furniture shop",
"Which table would you buy?",
["Why would you lose a bet on these 2 tables?","Wait for the last part.","The left table looks long, and the right looks wide.","Now I remove the legs, and turn one top.",P(1.0),"They are exactly the same shape!",P(1.2),"Your brain sees depth in a flat picture.","So it stretches one table without asking you.","Which table would you buy from me?"],
"Top surfaces are the same shape, one rotated 90 degrees.",
"Only the tops match, not the legs. Credit Shepard.",
"https://openaccess.city.ac.uk/id/eprint/10695/1/Paradoxical%20perception%20of%20surfaces%20in%20the%20Shepard%20tabletop%20illusion..pdf; https://en.wikipedia.org/wiki/Shepard_tables",
"Build the geometry exactly, then check the overlay in a still.")

add("T10","t10-wrong-photo","STORY","Would you defend a choice you never made?","YOU PICKED THIS?",
"Two face cards in a hand, one being swapped; Spark grinning, sure",
"Mr. Trick does the card trick. Spark explains at length why he loves the face he did not pick.",
"Spark is handed the wrong face.",
"Rewind shows the swap. Spark's speech bubble of reasons collapses.",
"Dim card-magic stage",
"Would you have noticed the swap?",
["Why would you defend 1 choice you never made?","Wait for the last part.","People picked the better looking face from two photos.","Then a scientist secretly swapped the photo they chose.",P(1.0),"Only about one person in eight noticed right away!",P(1.0),"Then they explained why they liked that face.","Would you have noticed the swap?"],
"118 people, 354 swapped trials. 13% detected at the moment, at most 26% by any measure.",
"Face photos, not big life decisions.",
"https://philarchive.org/archive/JOHFTD; https://www.lunduniversity.lu.se/lup/publication/c579a9b6-1b4a-4572-932e-0ff15f9832b4",
"Check replications on the day. Invented faces only.")

add("T11","t11-crossed-fingers","PLAY","Can one thing feel like two?","CROSS YOUR FINGERS",
"Two crossed fingers, huge, a small round ball between them; Spark seeing double",
"Spark crosses his fingers and starts looking for the second ball everywhere.",
"The viewer feels two.",
"Skin map: those two outer sides never normally touch one thing, so the brain says TWO.",
"Toy shop with a shelf of balls",
"Did you feel two?",
["Why do your 2 fingers feel what is never there?","Wait for the last part.","Cross two fingers on one hand, just like this.","Now touch a small round thing with both tips.",P(3.0),"Does that one thing feel like two now?",P(0.8),"Those two sides of your fingers never normally meet!","So your brain decides there must be two things.","Did you feel two things or one?"],
"Crossed fingers: about 93% 'two' vs 16.7% with parallel fingers (blindfolded).",
"Small clinical sample, so no number on screen. Do not state the explanation as settled.",
"https://core.ac.uk/download/217535047.pdf; https://www.illusionsindex.org/i/80-aristotle",
"")

add("T12","t12-the-the","PLAY","Did you just miss a word?","READ THIS ONCE",
"A sign with a sentence that has THE THE across a line break; Spark reads it with a finger",
"Mr. Trick slips an extra word in. Spark reads it aloud without noticing.",
"The second THE lights up.",
"Spark looks back at everything he has read, every sign now with an extra THE.",
"Train station, departure board",
"Did you see the extra word?",
["How will you miss this 1 extra word?","Wait for the last part.","Read the sign once, and tell me what it says.",P(3.0),"Now look closely, because the word the is there twice.",P(1.0),"In one lab test, readers noticed less than half the time!",P(1.0),"Did you see the extra word?"],
"Staub et al.: 51 people, 36 items: repeated 'the' noticed 45.8%, repeated noun 90.2%.",
"Lab sentences. Do not call it repetition blindness.",
"https://par.nsf.gov/servlets/purl/10094230; https://propel.umass.edu/sites/default/files/publications/2025-03/HuangStaubLLC2021.pdf",
"Sign wording chosen by the run, e.g. a line break between the two words. Hook is said before the sign is read.")

add("T13","t13-maths-horse","STORY","Would you have believed this horse could do maths?","HORSE DOES MATHS?",
"A horse tapping a hoof at a chalkboard, Spark clapping and amazed",
"Spark is Hans's biggest fan and buys the T-shirt. Mr. Trick does not appear: nobody meant to trick anyone.",
"Hans answers correctly in front of a crowd.",
"A curtain hides the answer from the questioner; the horse keeps tapping, and is wrong, again and again.",
"Old Berlin courtyard, 1900s",
"Do you give away answers with your face?",
["Why would you never doubt 1 horse doing maths?","Wait for the last part.","In Germany, Hans tapped his hoof to give answers.","Experts looked for a trick and found nothing.","Then the person asking did not know the answer.",P(1.0),"Now Hans was almost always wrong!",P(1.0),"He had been reading tiny head movements all along.","Do you give away answers with your face?"],
"Numerals: 98% right when questioner knew (42 tests), 8% when not (49). Pfungst investigated; cues unintentional.",
"No fraud. His owner did not know.",
"https://gutenberg.org/files/33936/33936-h/33936-h.htm; https://www.britannica.com/topic/Clever-Hans",
"Generic labelled figures only.")

add("T14","t14-grow-room","ILLUSION","Can a room make you grow?","WATCH HIM GROW",
"Spark huge in one corner of a checked room, a tiny Spark in the other",
"Mr. Trick builds the room and invites Spark to stroll. Spark grows and thinks he is a giant.",
"Spark walks across and grows.",
"Camera lifts through the ceiling: the room is a crooked wedge, one corner much farther away.",
"Fairground attraction, one peephole",
"Would you walk into this room?",
["Why do you see 1 person grow before your eyes?","Wait for the last part. I will open the roof.","Spark walks across, and he grows with every step.","But look through the hole, and the room looks normal.",P(1.0),"From above, the walls and floor are crooked!",P(1.0),"One corner is much farther away from you.","Your brain trusts the room, and changes the person.","Would you walk into this room?"],
"Ames room: looks normal from one viewing point with one eye; people seem to change size.",
"Works from one point only. No year on screen, because sources differ.",
"https://moodle2.units.it/pluginfile.php/753075/mod_resource/content/2/amesdemonstratio00itte_bw.pdf; https://www.newworldencyclopedia.org/entry/Ames_room",
"Best use of the camera rig: build the wedge in true perspective.")

add("T15","t15-birthday","PUZZLE","How many people does it take to share a birthday?","GUESS THE NUMBER",
"A party room, one guest, a counter, Spark holding a calendar with 365 on it",
"Spark bets it takes 180 guests. Mr. Trick opens the door to guest 23 and rings a bell.",
"The number: twenty-three.",
"Lines draw between every pair of guests until the room is a dense web of 253 lines.",
"Party room with balloons",
"What number did you guess?",
["Why do you guess this 1 birthday number wrong?","Wait for the last part.","How many people must stand in one room?","We want a fair chance that two share a birthday.",P(1.0),"You only need twenty-three people!",P(1.0),"That is because every pair of people counts.","What number did you guess?"],
"23 people: 50.73% (assumes 365 equal days). Pairs: 253. Both computed and checked.",
"Two people share with each other, not with you.",
"https://en.wikipedia.org/wiki/Birthday_problem; https://www.chiefscientist.gov.au/2011/05/the-birthday-problem",
"")

add("T16","t16-fake-hand","STORY","Can your brain adopt a fake hand?","THIS HAND IS FAKE",
"A rubber hand on a table, Spark looking at it with love; a wall hides his own hand",
"Mr. Trick brushes both. Spark names the fake hand and refuses to give it back.",
"Spark says Ouch for the fake hand.",
"The wall lifts: his real hand was there all along, and Spark looks shocked at it.",
"Science fair table",
"Would you try this at home?",
["How can your brain believe 1 fake hand is yours?","Wait for the last part.","Hide one real hand behind a small wall.","Then place a fake hand right in front of you.","A friend brushes both hands at the same moment.",P(1.0),"The touch can feel like it is on the fake hand!",P(1.0),"Your brain joins what you see with what you feel.","It does not work on everyone.","Would you try this at home?"],
"Botvinick & Cohen 1998: 10 subjects; 8 of 10 reported it (secondhand).",
"Not everyone feels it. No number on screen unless the primary is opened.",
"https://www.sciencedaily.com/releases/1998/02/980225074435.htm; https://pmc.ncbi.nlm.nih.gov/articles/PMC7519080",
"")

add("T17","t17-frozen-clock","PLAY","Have you seen a clock stop when you look at it?","THE CLOCK STOPPED?",
"A wall clock, second hand frozen mid-tick, Spark staring at it, one brow up",
"Spark runs to complain to the shop that sold it. Mr. Trick shows him it is fine.",
"The viewer recognises the feeling.",
"Timeline: the eye jump, then the moment that stretches, the extra fraction shown by a bar.",
"Clock repair shop with many clocks",
"Have you ever seen this happen?",
["Why do you see 1 clock stop when you look?","Wait for the last part.","Look away from a clock, then look back quickly.","The first second can feel too long to you.",P(0.6),"In a lab test, less than one second felt like a full second!",P(1.0),"Your eyes jump, and your brain fills that moment.","Have you ever seen this happen to you?"],
"Yarrow 2001: n=30; digit judged equal to 1 s when seen 880 ms (22° jump) or 811 ms (55°).",
"Lab counter test, not a wall clock.",
"https://openaccess.city.ac.uk/id/eprint/333/2/Illusory_perceptions_of_space_and_time_preserve_cross-saccadic_perceptual_continuity.pdf",
"Never say time stops. Do not state the brain's filling-in as certain.")

add("T18","t18-this-is-you","STORY","Can one short text describe you perfectly?","THIS IS YOU",
"A paper with YOU at the top, handed straight to the camera; Spark astonished, reading it",
"Mr. Trick, as a fortune teller, gives Spark his reading. Spark cries, it is so true. Then every student opens the same page.",
"The viewer feels described.",
"A whole classroom holds up the same page, all reading the same words.",
"Purple fortune tent, then a classroom",
"Did that text fit you?",
["How can 1 short text describe you so well?","Wait for the last part.","You want other people to like you very much.","You have strengths that you do not use yet.",P(1.0),"A teacher gave these words to every student!",P(1.0),"They rated it over four out of five.","So be careful with fortune tellers and online tests.","Did that text fit you?"],
"Forer: same text for all students, mean 4.26 of 5 (secondhand).",
"Published 1949. Say over four, not an exact figure.",
"https://en.wikipedia.org/wiki/Bertram_Forer; https://skepdic.com/forer.html",
"Find Forer's paper on the day if possible.")

add("T19","t19-mirror-eyes","PLAY","Have you ever seen your own eyes move?","WATCH YOUR EYES",
"Spark nose-to-nose with his mirror image, both eyes wide",
"Spark tries to catch his eyes moving, faster and faster. A friend beside him laughs.",
"Nothing moves in the mirror.",
"Friend's view: the eyes clearly jump. The mirror's view: still.",
"Bathroom at night",
"Did you see them move?",
["Why have you never seen your 2 eyes move?","Wait for the last part.","Stand close to a mirror, and look at one eye.","Now look quickly at your other eye.",P(2.0),"Your eyes moved, but you did not see them!",P(1.0),"A friend standing beside you can see them jump.","Your brain turns vision down during these fast jumps.","Did you see your eyes move?"],
"Suppression during eye jumps is partial, about 3-10× (secondary).",
"Partial suppression. Not blindness. The mirror demo is a secondhand classic.",
"https://www.doi.org/10.1038/371511A0; https://www.michaelbach.de/ot/lum-saccadicSuppression/",
"")

add("T20","t20-time-slows","STORY","Does time really slow down when you are scared?","TIME SLOWS DOWN?",
"Spark falling backward from a tower, watch on his wrist, mouth open",
"Mr. Trick pushes the button. Spark screams, swears the fall lasted a week.",
"The test is set up: a watch flashing numbers too fast to read.",
"Watch: nobody reads it better. Then the memory stretches out, like a long film strip beside a short real one.",
"Theme-park tower at dusk",
"Did time ever slow down for you?",
["Does time stop for you in 1 scary fall?","Wait for the last part. Scientists dropped people to check.","Volunteers fell from a tall tower into a net.","They wore a watch that flashed numbers too fast.","If time slowed, they could read those numbers.",P(1.0),"They could not read them any better!",P(1.0),"But they remembered the fall as much longer.","Did time ever slow down for you?"],
"Stetson 2007: 2.49 s fall; estimates rose 36% over others' falls; in-flight reading no better than ground.",
"Very small sample. No height on screen, because the paper is inconsistent.",
"https://eagleman.com/wp-content/uploads/2013/02/stetson_2007.pdf",
"Show a net and clearly safe set-up. No dare to imitate.")

add("T21","t21-mixed-letters","MYTH","Did Cambridge really prove you can read mixed-up words?","CAN YOU RAED TIHS?",
"Mixed-up sentence on a phone, Spark reading it easily, showing off",
"Spark forwards the famous email to everyone. Mr. Trick pushes the real letter from the scientist in front of him.",
"The viewer reads it easily.",
"SALT and SLAT side by side: same first letter, same last letter, and two different words.",
"Library at night",
"Did you believe that email?",
["Why did you never doubt this 1 famous email?","Wait for the last part.","Read this mixed-up sentence, and it still makes sense.","A famous email said Cambridge researchers proved this.","A Cambridge scientist looked, and knew of no such study.",P(1.0),"Salt and slat share their first and last letters!",P(1.0),"So the other letters matter, and mixed words slow you.","Did you believe that email?"],
"Davis: knows of no one at Cambridge UK researching it; 'only first and last' is clearly wrong; 11% reading slowdown (Rayner, via Davis).",
"You often can read them, so this is not 'all false'.",
"https://www.mrc-cbu.cam.ac.uk/people/matt-davis/cmabridge/",
"Do not name Davis in the hook.")

add("T22","t22-flip-face","ILLUSION","Why does this face look fine upside down?","LOOKS NORMAL?",
"An upside-down invented face, smiling calmly; Spark tilting his whole body to look",
"Mr. Trick hangs the portrait. Spark says it is lovely and rotates it, then jumps out of his sneakers.",
"Nothing seems wrong upside down.",
"The face rotates slowly upright and turns monstrous, and Spark screams.",
"Art gallery",
"Did you see it coming?",
["Why do you miss what is wrong with 1 face?","Wait for the last part.","Look at this upside down face for a moment.","Does anything look wrong with it to you?",P(1.0),"Now I will slowly turn the picture around.",P(1.0),"The eyes and mouth were flipped the whole time!",P(1.2),"People rate it as far less strange upside down.","Scientists still debate why this happens.","Did you see that coming?"],
"Grotesqueness on 7-point scale: 6.73 upright vs 3.89 inverted, n=12 (Bartlett & Searcy 1993).",
"Not 'totally normal' upside down. Explanation disputed.",
"https://www.ece.uvic.ca/~bctill/papers/facerec/bartlett93.pdf; https://blogs.scientificamerican.com/illusion-chasers/illusion-of-the-week-the-margaret-thatcher-illusion-a-retrospective/",
"No evidence it works on cartoon faces: the run must test the drawing and use a detailed invented face, not a real person. Not Spark's face.")

add("T23","t23-fake-coins","PLAY","Can you spot the fake coin flips?","WHICH IS FAKE?",
"Two rows of coins, A and B, Spark pointing at the wrong one, smiling",
"Mr. Trick flips real coins, Spark fakes his row, and Spark is certain he made the real-looking one.",
"Row A looks real.",
"Row A is stamped HUMAN; Row B's long streak glows, and a hundred flips scroll past with streaks everywhere.",
"Old casino table without chips, coins only",
"Which row did you pick?",
["Can you spot the 1 fake row of coins?","Wait for the last part.","Row A keeps switching between heads and tails.","Row B has five heads all in a row.","Which row did a human make up?",P(1.5),"Row A is the fake row!",P(1.0),"People switch too often when they fake coin flips.","In a hundred real flips, that long streak is very likely.","Which row did you pick?"],
"Run of 5+ either side in 100 fair flips: 97.2% (computed and checked). Fakes alternate too often (qualitative).",
"Rows are our own example.",
"https://cris.huji.ac.il/en/publications/the-perception-of-randomness/; https://scispace.com/pdf/belief-in-the-law-of-small-numbers-3wihxjnjvv.pdf",
"Do not make it about gambling.")

add("T24","t24-fading-dots","PLAY","Can you make these colours vanish?","STARE AT THE DOT",
"Soft colour blobs around one small dot, Spark at the edge, one finger up: shh",
"Spark goes to steal the blobs while the viewer is staring. Mr. Trick is sneaking too.",
"The colours fade.",
"A blink, and everything returns; a tag says THEY NEVER LEFT.",
"Quiet art studio, grey wall",
"Did the colours fade for you?",
["Stare 10 seconds. Why do these colours disappear?","Wait for the last part.","Look only at the small dot in the centre.",P(7.5),"Are the soft colours starting to fade away now?",P(1.0),"Those colours never left your screen!",P(0.8),"Your brain can ignore things that do not change.","Did the colours fade for you?"],
"Blurry, low-contrast shapes can fade with steady gaze; small eye movements bring them back.",
"Say can fade. Not everyone sees it fast.",
"https://par.nsf.gov/servlets/purl/10429897; https://peerj.com/articles/119",
"Picture must be fully static during the stare, except Spark outside the shapes? Test: if Spark distracts, hide him. Owner tests on a real phone.")

add("T25","t25-small-box","STORY","Why does the small box feel heavier?","SAME WEIGHT?",
"Big box and small box on a scale, level; Spark straining at the small one",
"Spark picks up the big one easily, then almost drops the small one. Mr. Trick shows the scale, and Spark lifts again, still fooled.",
"The scale says equal.",
"Spark knows the truth, tries again, and his arm still drops.",
"Post office counter",
"Which box would you pick?",
["Why does 1 small box fool you every time?","Wait for the last part. Knowing the truth does not help.","These two boxes weigh exactly the same.","But lift them, and the small one feels heavier.",P(0.6),"Now you know they match, so lift them again.",P(1.0),"The small box still feels heavier to you!",P(0.8),"Your brain expects a big box to be heavy.","Which box would you pick up?"],
"Size-weight illusion (Charpentier 1891): persists when you know; expectations explain about half.",
"Cause not fully settled; say expects as part of why.",
"https://ore.exeter.ac.uk/rest/bitstreams/98475/retrieve; https://pubmed.ncbi.nlm.nih.gov/10598479/",
"")

add("T26","t26-nobody-looked","STORY","Do people notice you as much as you think?","EVERYONE IS LOOKING?",
"Spark in a silly shirt, face red, a room of people; a big spotlight on him",
"Mr. Trick gives Spark the shirt, Spark walks in sweating. The spotlight is only in his head.",
"Spark guesses half the room noticed.",
"Spotlight switches off: most of the room is on their phones, and only a few look up.",
"Bright university lecture room",
"What embarrassed you this week?",
["Why do you think everyone saw your 1 mistake?","Wait for the last part. One silly shirt proved it.","Students wore an embarrassing shirt into a full room.","They guessed far more people noticed than really did.",P(1.0),"Only about one person in four noticed it!",P(1.0),"You are the centre of your own world only.","So that mistake is smaller than it feels.","What embarrassed you this week?"],
"Actual about 23% (confirmed via Macrae et al. citation). Guess about 46% from a weak blog only.",
"Open JPSP 78:211 before showing 46. About a quarter did notice.",
"https://core.ac.uk/download/300057876.pdf; https://eprints.soton.ac.uk/45092/1/SE_and_IOT.pdf",
"Generic shirt, no real singer's face. ")

add("T27","t27-dancer","MYTH","Which way is this dancer turning for you?","WHICH WAY?",
"A silhouette dancer turning on a spot; Spark's head turning with her, dizzy",
"Mr. Trick sells a BRAIN TYPE test. Spark takes it twice and gets opposite answers.",
"She flips direction for many viewers.",
"Silhouette seen from the side turns into a flat shadow, showing no depth.",
"Theatre stage, one spotlight",
"Which way did she turn for you?",
["Which way is she turning? Why does it switch?","Wait for the last part.","The internet says this shows your left or right brain.","A flat shadow has no depth, so both ways fit.",P(1.0),"Your brain just picks one direction for itself!",P(1.0),"I found no proof it shows your brain type.","Which way did she turn for you?"],
"Ambiguous figure: viewing time 0.508 clockwise, 3.68 reversals a minute (n=24).",
"The debunk is a neurologist's blog; no peer-reviewed test. Say no proof found, not disproven.",
"https://rcastoragev2.blob.core.windows.net/12a46e9a17214030adca68399618f2a4/PMC3485768.pdf; https://theness.com/neurologicablog/the-spinning-girl-illusion-revisited/",
"Draw a new figure from a true 3D orthographic spin, not Kayahara's art.")

add("T28","t28-still-moves","PLAY","Can a still picture start to move?","STARE HERE",
"A slow, soft turning pattern with a centre dot, Spark at the side with his eyes closed",
"Mr. Trick sets the wheel turning. Spark stares too long, and everything he looks at wobbles.",
"After the stare, Spark's still picture appears to drift.",
"A label: THIS PICTURE IS NOT MOVING, while the viewer sees it drifting.",
"Pottery studio with a turning wheel",
"Did the picture move for you?",
["Stare 10 seconds before you see this picture move.","Wait for the last part. The picture never moves.","Look only at the centre while the wheel turns.",P(10.0),"Now look at this still picture of Spark.",P(2.0),"He is not moving, but your brain says he is!",P(0.8),"Your brain got used to that motion.","Did the picture move for you?"],
"Steady motion leaves a drift the other way. Studies used 4-30 s of adaptation.",
"Stop if it feels uncomfortable (small line on screen).",
"https://eprints.soton.ac.uk/421387/1/BartlettGrafAdams2018.pdf; https://www.ofcom.org.uk/__data/assets/pdf_file/0021/16248/gn_flash.pdf",
"SAFETY: slow, low contrast, 5 or fewer bands, no flash, no reversal, no saturated red. Owner tests before posting. Skip if in doubt.")

add("T29","t29-easy-question","PUZZLE","Can you answer this easy question?","EASY QUESTION?",
"Two cards A and B, Spark slapping B, certain",
"Mr. Trick tells the story of Linda. Spark falls for it, loudly.",
"Most pick B.",
"Two circles: all bank tellers, and inside it the smaller group. B can never be larger.",
"Quiz night in a cafe",
"Which one did you pick?",
["Why will you probably fail this 1 easy question?","Wait for the last part.","Linda cares about fairness and joins protest marches.","Is she a bank worker, or a bank worker and feminist?",P(2.5),"The first answer is always more likely!",P(1.0),"The second answer needs two things to be true.","In one study, most students chose the second answer.","Which answer did you pick?"],
"85% of 142 UBC undergraduates chose the conjunction.",
"Debated: frequency wording reduces it, and people may read 'probable' differently.",
"https://pages.ucsd.edu/~mckenzie/TverskyKahneman1983PsychRev.pdf; https://pages.ucsd.edu/~scoulson/203/gigerenzer1.pdf",
"Keep the tone neutral.")

add("T30","t30-half-lake","PUZZLE","Can you beat your first answer?","HALF THE LAKE?",
"A lake with one lily pad doubling, Spark standing on a pad, about to sink",
"Spark shouts 24! and steps forward. The lake stays half empty beneath him and he falls in.",
"The fast answer is wrong.",
"Time runs backward from a full lake: one day back, and it is exactly half.",
"Green lake, camera rising from one pad to the whole lake",
"What was your first answer?",
["Why does your first answer fail this 1 puzzle?","Wait for the last part. The answer is one day away.","Lily pads on a lake double every single day.","They cover the whole lake in forty-eight days.","So when did they cover half of the lake?",P(2.5),"It is not day twenty-four at all!",P(1.0),"It is day forty-seven, because they double once more.","Your fast answer often speaks before you check it.","What was your first answer?"],
"Cognitive Reflection Test item (Frederick 2005). Answer 47 by logic.",
"Do not show a percentage wrong. Many people have seen it before.",
"https://en.wikipedia.org/wiki/Cognitive_reflection_test; https://arxiv.org/pdf/2010.12727",
"")

# --- Everyday rows added 2026-11-04 (owner: relatable daily life for our real audience) ------------------------------------------------
add("T31","t31-voice-note","STORY","Why does your voice sound wrong on recordings?","THAT IS YOU?",
"A phone playing a voice note; Spark's face in shock, hands on his head",
"Spark records a proud voice note for the family group, plays it, and tries to delete it. Mr. Trick holds the phone just out of reach.",
"The viewer recognises the shock of their own voice.",
"Spark's head in cross-section: two sound paths, through the air and through the bones. The phone only catches the air path, and that line is the only one left.",
"Pencil living room, sofa, phone on a table",
"Do you hate your voice notes?",
["Why does your voice sound wrong on every recording?","Wait for the last part.","You send a voice note, and then you play it.",P(0.6),"That person sounds strange, but that person is you.","You hear yourself through the air and through your bones.",P(0.8),"A recording has only the air part!",P(1.0),"So other people hear the voice on the recording.","Do you hate your voice notes?"],
"Own voice reaches us by air and bone; the bone part dominated at 1-2 kHz for most of 10 speech sounds (Reinfeldt 2010).",
"Part of the reason, not the only one. Do not say deeper. Not everyone dislikes it.",
"https://research.chalmers.se/publication/125312; https://journals.sagepub.com/doi/10.1068/p7526",
"")
add("T32","t32-other-lane","STORY","Why does the other lane always look faster?","MY LANE IS SLOW",
"Spark in a small doodle car, stuck, a car going past his window; he glares at it",
"Spark changes lanes, and his old lane starts moving. He changes back. Mr. Trick waves from the lane he just left.",
"Spark's old lane moves right after he leaves it.",
"Top view of two lanes: the cars that pass him stay beside him for a long time, while the ones he passes are gone quickly.",
"Pencil city road at rush hour",
"Do you change lanes too often?",
["Why does the other lane always look faster to you?","Wait for the last part.","You change lanes in traffic, and your old lane moves.","Scientists tested this with two lanes on a computer.","Both lanes had the same average speed.",P(1.0),"But cars passing you stayed in view for longer!",P(1.0),"Slow cars behind you quickly leave your view.","Do you change lanes too often?"],
"Simulation with equal speeds: overtaken 43 s vs passing 33 s per 10 min. 120 driving students watching video: 70% said next lane faster, though it was slightly slower.",
"A simulation and video, not real driving. Cars only. Lanes are not always equal.",
"https://people.brandeis.edu/~moshep/Projects/DoTheyReallyMoveFaster/133.redelmeier.pdf",
"")
add("T33","t33-way-home","STORY","Why does the way home feel shorter?","SAME ROAD?",
"Spark asleep on a doodle bus seat, a sign saying HOME, and a road on a map",
"Spark groans all the way there on the bus, then gets home in what feels like a blink. Mr. Trick holds up the same map.",
"Same road both ways.",
"The road drawn twice, the same length. Spark measures both with a tape and looks betrayed.",
"Pencil bus, village road",
"Did your last trip feel like this?",
["Why does the way home feel shorter to you?","Wait for the last part.","You travel to a new place, and it takes forever.","Then you come home on the very same road.",P(1.0),"The way back often feels much shorter!",P(1.0),"Scientists tested this on real bus and bicycle trips.","You expected a long trip back, so it surprised you.","Did your last trip feel like this?"],
"Return trip effect: bus (69), bike (93) and video (139) studies. Authors favour broken expectations.",
"Cause not settled. Do not quote 22%.",
"https://jayscholar.etown.edu/facpubharvest/443/; https://www.psychologicalscience.org/news/motr/why-the-drive-home-really-does-feel-shorter.html",
"")
add("T34","t34-stuck-song","STORY","Can you stop a song stuck in your head?","STUCK IN YOUR HEAD",
"Music notes spinning round Spark's head on a doodle bus; he tries to swat them",
"Mr. Trick is a tiny band inside Spark's head. Spark tries everything, then chews gum and the band falls quiet.",
"Spark carries the song from bus to office.",
"The notes slow down and drop to the floor as he chews, one by one.",
"Pencil bus, then office desk",
"Which song is stuck in your head?",
["Can you stop the 1 song stuck in your head?","Wait for the last part.","You hear one song on the morning bus.","At work, it is still playing inside your head.","In one big survey, most people had this every week.",P(1.0),"In a lab test, chewing gum made it happen less!",P(0.8),"It was a small test with only one song.","Which song is stuck in your head?"],
"12,519 Finnish internet users: 89.2% at least weekly. Gum: 3 experiments (n=44, 18, 36), fewer self-reported intrusions.",
"Self-selected survey. Gum test used one tune in the lab, 2-3 minutes. Not a cure.",
"https://journals.sagepub.com/doi/10.1177/0305735611406578; https://core.ac.uk/download/42151264.pdf",
"No real song and no real lyrics: an invented tune only.")
add("T35","t35-tip-of-tongue","STORY","Why does a word hide when you need it?","IT'S ON MY TONGUE",
"A word half visible on Spark's tongue, Spark in a meeting, pointing at his mouth",
"Spark is mid-sentence in a meeting. Mr. Trick pulls the word away on a string, always just out of reach.",
"The word hides.",
"Spark gets the first letter, and the word slides back into his mouth.",
"Pencil meeting room",
"Which word hides from you most?",
["Why does 1 word hide when you need it?","Wait for the last part.","You know the word, but you cannot say it.","Almost everyone gets this, often about once a week.","It can come back with that same word later.",P(1.0),"Finding it yourself makes it less likely to return!",P(0.8),"So try the first letter before you search online.","Which word hides from you most?"],
"About weekly; solved during the episode about half the time (review). D'Angelo & Humphreys 2015: 6 experiments; first-letter cues helped; being told the full word did not (secondhand via BPS).",
"Rare-word lab tasks. Not a cure.",
"https://experts.mcmaster.ca/display/publication1426228; https://www.bps.org.uk/research-digest/why-words-get-stuck-tip-your-tongue-and-how-stop-it-recurring",
"Re-open the 2015 abstract on the day: part of this is secondhand.")
add("T36","t36-forgot-name","STORY","Why do you forget a name right after hearing it?","WHAT WAS THE NAME?",
"A doodle person shaking Spark's hand, name badge blank; Spark's eyes wide, panic",
"Round the table people say their names. Spark rehearses his own line, and every name falls off the table. Mr. Trick sweeps them up.",
"Spark misses the name.",
"A row of people reading words in turn: the words just before Spark's turn fade to grey.",
"Pencil office, first day, meeting table",
"Whose name did you forget today?",
["Why do you forget a name right after hearing it?","Wait for the last part.","Everyone says their name in a new meeting.","You are busy planning what you will say.",P(0.6),"Scientists tested this with people reading words in turn.",P(1.0),"They remembered far fewer words from the person before them!",P(0.8),"It was not a test of names, but it may explain it.","Whose name did you forget today?"],
"Brenner 1973: 88 male undergraduates, own words 87%, neighbour's 37%; weak recall about 9 s around own turn.",
"Words, not names. Say may. Applying it to names is our inference.",
"https://deepblue.lib.umich.edu/bitstream/handle/2027.42/33869/0000130.pdf;sequence=1",
"")
add("T37","t37-yawn-test","PLAY","Did you just yawn because of this?","DO NOT YAWN",
"Spark mid-yawn, huge mouth, eyes closed, next to a sleepy doodle co-worker",
"Mr. Trick yawns, Spark yawns, the whole doodle office yawns one by one.",
"The yawn spreads across the room.",
"One big yawn runs along a row of people to the camera, and Spark points at the viewer.",
"Pencil office after lunch",
"Did you yawn while watching this?",
["Did you just yawn because of this stick figure?","Wait for the last part.","Watch Spark yawn, and try very hard not to.",P(3.0),"Did you feel one coming just now?",P(0.8),"In one big study, about two in three people yawned!",P(0.8),"Many say it shows you care, but proof is weak.","Did you yawn while watching this?"],
"222 of 328 (67.7%) yawned at least once at a video; empathy not significant after age. Others report 40-55%.",
"Not everyone does. Empathy link not supported. Some yawns happen anyway (18 of 55 controls).",
"https://pmc.ncbi.nlm.nih.gov/articles/PMC3954725; https://www.frontiersin.org/articles/10.3389/fpsyg.2015.01735/full",
"")
add("T38","t38-falling-jerk","STORY","Why does your body jump as you fall asleep?","WHY DID I JUMP?",
"Spark in bed, flying 30 cm above the mattress, eyes wide; a clock reads night",
"Spark is almost asleep. Mr. Trick pulls a little rug from under the dream, and Spark jolts awake.",
"The jolt, in a dark bedroom.",
"Sleeping doodle people across a city jolt at different windows, one after the other.",
"Pencil bedroom, then a city at night",
"Did this happen to you last night?",
["Why does your body jump as you fall asleep?","Wait for the last part.","You are almost asleep, and you feel yourself fall.","Your whole body jumps, and you are awake.",P(1.0),"This is very common, and it is usually harmless!",P(0.8),"Some say it comes from our ape past.","That story has no solid proof behind it.","Did this happen to you last night?"],
"About 70% ever, about 10% daily, secondhand only.",
"Education, not medical advice. Nobody knows exactly why. No percentage on screen unless a primary source is opened.",
"https://sleep.com/sleep-health/hypnic-jerks; https://livescience.com/39225-why-people-twitch-falling-asleep.html; https://en.wikipedia.org/wiki/Hypnic_jerk",
"")
add("T39","t39-word-breaks","PLAY","Why does a word break if you repeat it?","SAY DOOR 30 TIMES",
"The word DOOR on a door; Spark repeating it, one eye twitching, the letters falling off",
"Mr. Trick dares Spark to say door again and again. The letters crack, and the door stops being a door.",
"The word starts to feel empty.",
"The door opens by itself, and the meaning walks back in as the letters refill.",
"Pencil hallway at home",
"Which word broke for you today?",
["Why does 1 word break if you repeat it?","Wait for the last part.","Say the word door out loud, again and again.",P(7.0),"Does it sound strange or empty now?",P(0.8),"Repeat a word many times, and its meaning can fade!",P(0.8),"It comes back very soon, so do not worry.","Which word broke for you today?"],
"Semantic satiation: Smith 1984 n=32, slower decisions after 30 vs 3 repeats; Kounios 2000; Kuhl & Anderson 2011.",
"Small samples and some mixed results. Meaning fades only briefly.",
"https://link.springer.com/content/pdf/10.3758/BF03198310.pdf; https://link.springer.com/content/pdf/10.3758/s13423-011-0110-0.pdf",
"")
add("T40","t40-hangry","STORY","Why are you angry just before lunch?","11:45 AM ANGER",
"Spark red-faced at his desk, a clock at 11:45, a lunch box in reach",
"Mr. Trick moves the lunch box away. Spark snaps at a doodle co-worker over a stapler, then eats and apologises.",
"He snaps, he eats, the anger is gone.",
"A hunger bar and an anger bar rise together across the day, drawn as a pencil graph.",
"Pencil office near lunchtime",
"What do you do when you are hungry?",
["Why are you angry just before lunch?","Wait for the last part.","You snap at someone at eleven in the morning.","Then you eat, and the anger is gone.","Scientists asked people five times a day for three weeks.",P(1.0),"When they felt hungrier, they felt angrier and more irritable!",P(0.8),"But this study cannot prove that hunger caused it.","What do you do when you are hungry?"],
"Swami 2022: 64 adults, 81.3% women, mostly Austria, 21 days, 9,142 responses. Fixed predictors: anger 14%, irritability 19%.",
"Education, not medical advice. Correlational, self-report. Do not quote 48%.",
"https://journals.plos.org/plosone/article/file?id=10.1371%2Fjournal.pone.0269629&type=printable",
"")

# Everyday settings for the rows that stay (same facts). Index: 4 overlay, 5 frame 0, 6 trap, 9 world, 11 script edits.
EVERYDAY = {
"T01": ("Spark in bed at night, sure of himself, reading a list by a doodle lamp","Tired after work, Spark brags that he remembers everything. Mr. Trick hangs the list on the bedroom wall.","Pencil bedroom at night"),
"T02": ("Spark on a sofa, phone close to his face, one eye shut","On the sofa at night, Spark says his eyes are perfect. Mr. Trick steals a dot from the phone.","Pencil sofa at home, a real phone screen"),
"T03": ("Spark filled solid red on a freshly painted wall, one black dot on his chest","Decorating at home, Mr. Trick paints Spark red. The viewer's eyes bring his colour back.","Pencil room being painted, one big white wall"),
"T04": ("A checked kitchen floor with a shadow across it, A and B marked; Spark with a mop laughing at the idea","Spark mops the kitchen and says square A is dirty and B is clean. Mr. Trick bets him.","Pencil kitchen, checked floor, fridge shadow"),
"T05": ("A stranger with a phone map asks Spark the way; a door is coming in from the side","Spark gives directions proudly while two movers carry a door through. He never notices the swap.","Pencil street near a bus stop"),
"T06": ("A parent and a child with flash cards: the word RED in green ink. Spark's mouth is stuck","Helping a child with flash cards, Spark races through round one, then trips over every word in round two.","Pencil dining table after school"),
"T07": ("A doctor's scan on a wall with a tiny gorilla shape; Spark's face close to it, not seeing","At a child's school game, Spark counts passes with a clicker while a gorilla suit walks behind him.","Pencil school court, then a clinic wall"),
"T08": ("A report on an office desk with a boss's red pen; Spark holding up three fingers proudly","Spark checks a report before sending it and answers THREE. His boss hands it back with the small words circled.","Pencil office desk"),
"T10": ("Two face photos on a cafe table, one being swapped; Spark grinning, sure","Spark's friend asks which photo is better. Mr. Trick swaps them, and Spark explains why he loves the one he did not pick.","Pencil cafe table"),
"T11": ("Two crossed fingers, huge, on a pea at the dinner table; Spark seeing double","At dinner, Spark crosses his fingers on one pea and starts looking for the second one everywhere.","Pencil dinner table at home"),
"T12": ("A phone with a message to the boss, the the across a line break; Spark about to press send","Spark checks a message to his boss and sends it. Mr. Trick slipped an extra word in.","Pencil desk, a phone screen"),
"T15": ("An office birthday cake and a calendar with 365 on it; Spark doing sums on his hand","Spark bets it takes 180 co-workers. Mr. Trick lets in co-worker 23, and two people cut the cake.","Pencil office, cake, balloons"),
"T16": ("A rubber hand on a kitchen table, Spark looking at it with love; a cereal box hides his own hand","A friend brushes both hands with a makeup brush. Spark names the fake hand and refuses to give it back.","Pencil kitchen table with a friend"),
"T17": ("An office wall clock, second hand frozen at 4:59; Spark staring at it, bag packed","Spark waits to go home and sees the clock stop. He complains to a co-worker, who shows him it is fine.","Pencil office, last minute of the day"),
"T18": ("A phone with TODAY'S HOROSCOPE handed to the camera; Spark on a bus, astonished, reading","Spark reads his horoscope on the bus and cries, it is so true. Then every passenger shows the same words.","Pencil morning bus, then a classroom"),
"T19": ("Spark at a bathroom mirror with a toothbrush, nose to nose with his reflection, eyes wide","Brushing his teeth, Spark tries to catch his eyes moving. His partner laughs in the doorway.","Pencil bathroom, morning"),
"T22": ("A family photo on a fridge, upside down, smiling calmly; Spark tilting his whole body to look","A child stuck the photo on upside down. Spark says it is lovely, turns it, then jumps out of his sneakers.","Pencil kitchen fridge"),
"T24": ("Soft colour blobs around one dot on a phone; Spark on the sofa, one finger up: shh","Bored on the sofa, Spark stares at his phone, and Mr. Trick sneaks up to steal the colours.","Pencil sofa; the test picture fills the screen"),
"T25": ("A big parcel and a small parcel on a doorstep scale, level; Spark straining at the small one","Spark picks up the big parcel easily, then almost drops the small one. The courier shows him the scale.","Pencil front door, delivery day"),
"T26": ("Spark with a coffee stain on his shirt, in a full office lift, a big spotlight on him","Spark spills coffee and feels everyone staring. The spotlight is only in his head.","Pencil office lift, then a room"),
}
PENCIL = "PENCIL: shared/doodle.tsx. Graphite world on paper, doodle people, Spark in full colour. "
_out = []
for r in R:
    r = list(r)
    if r[0] in EVERYDAY:
        r[5], r[6], r[9] = EVERYDAY[r[0]]
    _out.append(r)
R = _out
_edit = {
"T04": [("But watch what happens when the board goes away.", "But watch what happens when the floor goes away.")],
"T12": [("Read the sign once, and tell me what it says.", "Read this message once, and tell me what it says.")],
"T15": [("How many people must stand in one room?", "How many people must work in your office?")],
}
for r in R:
    for a, b in _edit.get(r[0], []):
        assert a in r[11], a
        r[11] = [b if x == a else x for x in r[11]]

HEAD = ["Order","ID","Slug","Format","Title","Hook (spoken)","Hook score","Overlay","Promise line","Voice script (rows split by |)","Frame 0","Spark + Mr. Trick","First payoff (by ~10 s)","Reveal","World","Comment question","Claim + numbers","Caveat","Sources (re-verify on the day)","Flags","Est. length (s)","Est. reveal line (s)"]
BLOCK = ["cognitive","heuristic","paradigm","leverage","utility","salience","anchoring","mechanism","stimulus","valuation","bias","nudge"]
OUT = Path(__file__).with_name("slate_v4.csv")
# hookscore (vendored by setup.sh). Its own docs say it barely separates hits from misses, so it is a check, not a verdict.
SCORE = lambda t: ""
_hs = Path(__file__).resolve().parent.parent / "_vendor/youtube-agent-skill/skills/yt-script/hookscore.py"
if _hs.exists():
    import importlib.util
    _sp = importlib.util.spec_from_file_location("hookscore", _hs)
    _m = importlib.util.module_from_spec(_sp)
    _sp.loader.exec_module(_m)
    SCORE = lambda t: _m.score(t)[1]
probs = []
# Order changed 2026-11-04 (7-day export + owner): everyday situations first; stare tests last, after the owner's phone test.
ORDER = ["T31","T37","T36","T17","T26","T11","T32","T01","T35","T38","T34","T08","T02","T33","T15","T40","T39","T19","T05","T12","T18","T06","T04","T25","T10","T16","T07","T22","T03","T24"]
# Kept for later, not in this slate: T09 tables, T13 horse, T14 room, T20 tower, T21 email, T23 coins, T27 dancer, T28 still picture, T29 Linda, T30 lake.
assert len(set(ORDER)) == 30
R = sorted([r for r in R if r[0] in ORDER], key=lambda r: ORDER.index(r[0]))
rows = []
for n, r in enumerate(R, 1):
    (i, slug, fmt, title, ov, f0, trap, pay, rev, world, q, script, claim, cav, src, flags) = r
    lines = [s for s in script if not s.startswith("[pause")]
    pauses = [float(s[7:-1]) for s in script if s.startswith("[pause")]
    words = sum(len(l.split()) for l in lines)
    est = 0.2 + words / 2.95 + 0.45 * (len(lines) - 1) + sum(pauses) + 0.7
    for l in lines:
        c = len(l.split())
        if c < 5 or c > 14:
            probs.append(f"{i} {c} words: {l}")
        if not re.search(r"[.?!]$", l):
            probs.append(f"{i} no end: {l}")
        for b in BLOCK:
            if b in l.lower():
                probs.append(f"{i} blocked {b}: {l}")
        for w in re.findall(r"[A-Za-z'-]+", l):
            if len(w) >= 13:
                probs.append(f"{i} long word {w}")
    if len(lines[0].split()) > 10:
        probs.append(f"{i} hook {len(lines[0].split())} words")
    if len(ov.split()) > 4:
        probs.append(f"{i} overlay: {ov}")
    if not any(re.search(r"\b(end|last|wait|stay|until|finish|final)\b", l, re.I) for l in lines[:3]):
        probs.append(f"{i} no promise")
    if len([p for p in pauses if p >= 0.5]) < 2:
        probs.append(f"{i} pauses")
    if est > (40 if i in ("T03", "T24") else 34):
        probs.append(f"{i} est {est:.1f}s")
    # estimated start of the first line ending in "!" (the reveal line)
    t = 0.2
    rev_s = ""
    for row in script:
        if row.startswith("[pause"):
            t += float(row[7:-1])
            continue
        if row.endswith("!") and rev_s == "":
            rev_s = round(t, 1)
        t += len(row.split()) / 2.95 + 0.45
    if rev_s == "":
        probs.append(f"{i} no reveal line ending in !")
    rows.append([n, i, slug, fmt, title, lines[0], SCORE(lines[0]), ov, lines[1], " | ".join(script), f0, trap, pay, rev, world, q, claim, cav, src, (PENCIL + flags).strip(), round(est, 1), rev_s])
with OUT.open("w", newline="") as f:
    w = csv.writer(f)
    w.writerow(HEAD)
    w.writerows(rows)
print(len(rows), "rows; est length", min(r[-2] for r in rows), "-", max(r[-2] for r in rows))
for p in probs:
    print(" -", p)
sys.exit(1 if probs else 0)
