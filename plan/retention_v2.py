"""Retention v2 (owner, 2026-10-23): rewrites for V013–V035 and every unproduced hack.

Why: first-week Shorts analytics (16–22 Oct): 37.4% stayed to watch, 62.6% swiped away, every Short
stalled at ~1K views (seed test), 96.5% of views from the Shorts feed, audience 74% male / ~60% aged 25–44.
The old scripts put their best fact at 10–15 s. These rows move it to frame 0 and cap Shorts at 22–30 s
so viewers who stay are held for 20–27 s.

Each entry overrides the plan row's hook columns and adds a beat sheet (WRITING.md §G, PIPELINE §5):
  overlay   frame-1 text (≤ 6 words)           hook     spoken line 1, lands by 2.5 s
  cold_open what is ALREADY happening on frame 0
  open_loop line at ~2.5–6 s that promises an answer later (paid off at ~16–24 s)
  rehook    the twist/“but” beat at ~14 s (sound hit + mood flip)
  loop      the last line/frame that cuts back into frame 0
  length    target seconds (22–30)              fx       power-up hook preset (shared/powerup.tsx)

Facts are NOT new: every number comes from the plan row's Facts to verify / Verified finding and still
goes through PIPELINE §4. `python3 plan/retention_v2.py` patches content_plan.csv + hacks_ideas.csv and
writes plan/retention_v2.csv; topics.py and tools/build_hacks_ideas.py call apply() so a rebuild keeps it.
"""
import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FIELDS = ["overlay", "hook", "cold_open", "open_loop", "rehook", "loop", "length", "fx"]


def R(overlay, hook, cold_open, open_loop, rehook, loop, length, fx):
    return dict(zip(FIELDS, [overlay, hook, cold_open, open_loop, rehook, loop, length, fx]))


REWRITE = {
    # ---------------------------------------------------------------- 100-video plan
    "V013": R("AI USERS: −19 POINTS", "These consultants used GPT-4 and got nineteen points worse.",
              "The −19 bar crashes down; Spark recoils as his aura flares",
              "Same study: on most tasks AI made them faster. So what went wrong?",
              "Their wrong answers looked MORE polished: gold frame, then a red ✗ stamps through it",
              "'Because the next report—' → cut to the crashing bar", 27, "charge"),
    "V014": R("₹0. AGAIN.", "You've scratched a hundred of these and won almost nothing.",
              "Spark scratches frantically: ₹0 slams into frame, then another ₹0",
              "That's not bad luck. It's the design.",
              "The card grows into a slot machine; the lever pulls itself",
              "'Now scratch—' → first card again", 27, "impact"),
    "V015": R("HE BUILT 👍. THEN BLOCKED IT.", "He helped build the Like button. Then locked it out of his own phone.",
              "Spark zips in beside a giant thumbs-up; a tiny engineer padlocks his phone",
              "Why would the builder fear his own feature?",
              "His own words: 'bright dings of pseudo-pleasure' (on screen, sourced)",
              "'Because the next like—' → thumb grows again", 27, "dash"),
    "V016": R("ESTIMATE: 2 DAYS. ACTUAL: ?", "You said two days. It's been two weeks.",
              "Spark stamps 2 DAYS on a ticket; a WORK gauge overloads and cracks as calendar pages fly",
              "And you'll do it again on the next ticket. Here's why.",
              "Knowing about the planning fallacy doesn't fix it",
              "'Now, how long for—' → stamp again", 26, "meter"),
    "V017": R("₹2,999 ✗  ₹999 = STEAL?", "That crossed-out ₹2,999 was never the price. It's bait.",
              "Spark fires a beam that blasts the struck-through ₹2,999 off the tag",
              "A random number can do the same thing to your brain. Watch.",
              "The wheel landed on a random number, and it still moved people's guesses",
              "'Now look at the next—' → anchor drops", 26, "beam"),
    "V018": R("typing…", "Typing. Stopped. Typing. Stopped. Why is this torture?",
              "Three dots blink on and off; Spark's heartbeat line spikes with every blink",
              "There's a study that explains exactly this feeling.",
              "Not knowing stressed people more than knowing bad news was coming",
              "'Oh, they're typing—' → dots again", 25, "charge"),
    "V019": R("CONFIDENTLY WRONG.", "It answered instantly. Confidently. And it was completely wrong.",
              "A robot answers in a flash; a red ✗ slams onto the answer",
              "It isn't lying. It's doing exactly what we taught it.",
              "The scoring taught it to bluff: a guess can score, 'I don't know' can't",
              "'Then ask it again—' → robot answers", 25, "impact"),
    "V020": R("NO THANKS, I HATE SAVING MONEY.", "To close this pop-up, you have to insult yourself.",
              "Spark's cursor hovers over the insult button; the pop-up flexes an aura at him",
              "That's not a joke. It has a name.",
              "It's on India's official list of dark patterns (policy-check)",
              "'Click no. Then—' → pop-up returns", 22, "clash"),
    "V021": R("LOSE ₹500 vs FIND ₹500", "Losing five hundred rupees hurts more than finding it feels good.",
              "A LOSS gauge overloads past the GAIN gauge and cracks",
              "How much more? There's a number for it.",
              "It's roughly double (later estimates vary): the scale slams to one side",
              "'So next time you—' → the two notes again", 26, "meter"),
    "V022": R("LGTM ✅", "AI wrote five hundred lines. You reviewed five.",
              "A code scroll taller than the building drops; Spark stamps LGTM without looking",
              "Line three hundred and twelve is about to ruin your week.",
              "Line 312 was the bug (comedy, no stats)",
              "'LGTM—' → scroll drops again", 22, "dash"),
    "V023": R("THIS GLUE FAILED.", "Post-it notes started as a glue that didn't work.",
              "A FAILED stamp slams onto a lab jar; the jar's note slides off",
              "It sat unused for years. Then one bookmark changed everything.",
              "A hymn-book bookmark kept falling out, and the failure finally had a job",
              "'So keep your failures, because—' → stamp again", 28, "impact"),
    "V024": R("YOU PAUSED 1.4 SECONDS.", "You didn't like it. You didn't comment. It still knows.",
              "A clerk behind the screen clicks a stopwatch: 1.4 s",
              "The scroll you don't do is data. Here's how.",
              "Watch time is a ranking signal the platforms say they use",
              "'Click—' → stopwatch again", 26, "beam"),
    "V025": R("I PAID FOR THIS.", "The movie is terrible, but you paid four hundred, so you stay.",
              "Spark is chained to a cinema seat by a giant ticket, straining against it",
              "Staying doesn't get your money back. It costs you something else.",
              "Leaving doesn't refund the ticket; staying costs two more hours",
              "'Credits roll—' → back in the seat", 22, "charge"),
    "V026": R("ONLY 2 LEFT!", "Only two left. Are there really only two?",
              "A countdown timer slams into frame; Spark flinches",
              "India's consumer regulator has a name for this trick.",
              "Behind the tiny shelf: a full warehouse; false urgency is a listed dark pattern (policy-check)",
              "'Timer resets to 10:00—' → slam again", 26, "impact"),
    "V027": R("MAKE IT BETTER. (×47)", "You've typed 'make it better' forty-seven times.",
              "AI sprints on a hamster wheel; Spark dashes past it with a coffee",
              "And the best version was hiding three tries ago.",
              "Version 3 was the good one",
              "'Make it better—' → wheel spins", 22, "dash"),
    "V028": R("BATTERY 4%. PRICE UP?", "Does your cab price go up when your battery is low?",
              "A dying phone at 4%; two price tags power up and clash over it",
              "It's a myth, but with a true core that's weirder.",
              "People with low battery ARE more willing to accept surge; the company says it doesn't use battery level",
              "'Battery blinks—' → 4% again", 28, "clash"),
    "V029": R("YOU DIDN'T PICK THIS.", "Most of what you watch, you never searched for.",
              "A conveyor of thumbnails drops videos into Spark's lap; a CHOSEN-FOR-YOU gauge fills and cracks",
              "Someone at YouTube put a number on it.",
              "A YouTube exec said over 70% of watch time comes from recommendations (2018)",
              "'Up next—' → conveyor again", 27, "meter"),
    "V030": R("WHO MELTED MY CHOCOLATE?", "The microwave started with a melted chocolate bar.",
              "A radar dish fires a beam; the chocolate in a pocket melts on contact",
              "Other people saw it happen. One man noticed.",
              "He noticed what others ignored (details per facts check)",
              "'Melts again—' → beam", 28, "beam"),
    "V031": R("ONE SMALL CHANGE.", "The client wants one small change.",
              "A pebble lands on Spark's desk and starts glowing with an aura",
              "Small. Just one. What could go wrong?",
              "The small change was the database",
              "'One small change—' → pebble again", 22, "charge"),
    "V032": R("₹99 ≠ ₹100?", "Ninety-nine rupees isn't a hundred. Your brain disagrees.",
              "₹99 slams onto a price tag; Spark squints through a tiny keyhole at the 9",
              "One rupee is buying something much bigger than a rupee.",
              "Your brain reads the first digit and files it in a cheaper bracket",
              "'Keyhole closes—' → ₹99 slams again", 25, "impact"),
    "V033": R("1 THUMB vs 1,000 TESTS", "It's your willpower against thousands of A/B tests.",
              "Spark and an army with clipboards power up; auras clash in the middle",
              "It's not a fair fight. But there's one move that wins.",
              "You win by changing the arena, not by trying harder",
              "'The army regroups—' → clash again", 28, "clash"),
    "V034": R("IS MY IDEA GOOD?", "You asked AI if your startup idea is good.",
              "AI zips in as a hype-man with pom-poms before Spark finishes typing",
              "It'll say yes. It would say yes to the opposite idea too.",
              "Sycophancy: training on human ratings rewards agreeable answers",
              "'Is my idea good—' → pom-poms", 22, "dash"),
    "V035": R("MYTH: 75% AUTO-REJECTED", "Seventy-five percent of resumes rejected by robots? Prove it.",
              "Spark fires a beam that knocks the fake 75% badge off a robot gatekeeper",
              "Here's where that number actually came from.",
              "The famous number traces back to an unsourced sales claim",
              "'Badge falls off—' → beam", 28, "beam"),
    # ---------------------------------------------------------------- hacks (unproduced only)
    "H03": R("3 MINUTES. NO GYM.", "Three one-minute bursts a day. No gym.",
             "Spark charges up halfway up a staircase, rocks lifting off the steps",
             "Hidden in things you already do. Here's where.",
             "Non-exercisers doing ~3 bursts a day were linked to far lower risk (observational)",
             "'Third burst—' → stairs again", 26, "charge"),
    "H04": R("WALK vs STAND", "After lunch: walk or stand? One wins by double.",
             "Two figures power up after a meal; auras clash over a sugar meter",
             "And it's not the one your desk is selling.",
             "Walking lowered the spike more than double what standing did",
             "'Meter dips—' → clash", 27, "clash"),
    "H05": R("STANDING = HEALTHY?", "You bought a standing desk to get healthier. Not so fast.",
             "Spark fires a beam that blasts HEALTHY off a standing-desk ad",
             "The desk works. Just not the way you think.",
             "Standing still is still still: the health evidence is weak",
             "'Desk rises—' → beam", 26, "beam"),
    "H06": R("50 STAIRS A DAY", "Five flights of stairs a day.",
             "A lift dings; Spark dashes past it up the stairs",
             "That's about the cost of skipping one lift ride. Here's the payoff.",
             "Linked to 20% lower heart-disease risk (observational)",
             "'Ding—' → dash again", 25, "dash"),
    "H07": R("ONLY WORKOUT ON WEEKENDS?", "If you only work out on weekends, you're not wasting it.",
             "A WEEKEND gauge fills on Saturday and Sunday, then overloads",
             "There's a big study that counted the payoff.",
             "Weekend warriors had ~30% lower death risk vs inactive (association)",
             "'Monday—' → gauge resets", 26, "meter"),
    "H08": R("ONLY AT THE GYM", "Lock your favourite show so it only plays at the gym.",
             "A padlock slams onto a phone showing a show; Spark recoils",
             "It worked. Then something happened.",
             "+51% gym visits at first, then the boost faded without the lock",
             "'Chest locks—' → padlock slams", 26, "impact"),
    "H09": R("STUCK? STAND UP.", "Stuck on an idea? Your legs can help.",
             "Spark's bulb is dead; he takes one step and it charges up with an aura",
             "But only for one kind of thinking.",
             "It helped brainstorming, not maths",
             "'Bulb flickers—' → charge", 25, "charge"),
    "H10": R("2 HOURS. ONE WEEK.", "There's a weekly dose of nature: two hours.",
             "A GREEN TIME gauge fills park by park and cracks at 120",
             "Below that number, something strange happened.",
             "Under 120 minutes showed no link; it can be split into short visits",
             "'New week—' → gauge empties", 26, "meter"),
    "H11": R("SAME FOOD. DIFFERENT WEIGHT.", "Same extra food. Very different weight gain. Why?",
             "Two figures eat the same giant plate; one starts tapping with speed streaks",
             "The difference was smaller than a workout.",
             "Tiny everyday movements (NEAT) explained the difference (n=16)",
             "'Foot taps—' → plates again", 26, "dash"),
    "H14": R("WILLPOWER: 3% LEFT", "You've been told willpower drains like a battery.",
             "A willpower battery at 3%; Spark fires a beam that shatters the battery icon",
             "Twenty-three labs tested it.",
             "Across 2,141 people the effect was about zero (d = 0.04)",
             "'Battery 100%—' → beam", 27, "beam"),
    "H15": R("+33% ON MONDAYS", "There's a reason your new plan starts on a Monday.",
             "A door marked MONDAY blasts open with an impact frame",
             "And one start day beat Monday by a mile.",
             "A new semester: +47%",
             "'Next door glows—' → door blasts open", 26, "impact"),
    "H16": R("23 MINUTES TO REFOCUS?", "That '23 minutes to refocus' stat? Not what it means.",
             "A ping clashes with Spark's focus aura mid-task",
             "The number is real. The story around it isn't.",
             "Interruptions didn't slow people; they stressed them",
             "'Ping!—' → clash", 27, "clash"),
    "H17": R("STILL IN THE LAST TAB", "Part of your brain is still in your last tab.",
             "Spark dashes between two screens, leaving afterimages behind at each",
             "Even finishing isn't enough. Here's the fix.",
             "Close it cleanly: write the next step down, then switch",
             "'Threads snap—' → dash", 26, "dash"),
    "H18": R("WHY CAN'T I STOP THINKING ABOUT IT?", "That unfinished task keeps popping into your head.",
             "Pop-ups of one task keep slamming into Spark's head",
             "There's a one-line fix, and it's not finishing it.",
             "Making a specific plan stopped the intrusive thoughts (one lab)",
             "'Last pop-up—' → slam", 26, "impact"),
    "H19": R("CAN'T SLEEP? WRITE THIS.", "Five minutes of writing helped people fall asleep faster.",
             "Spark's pen charges up with an aura over a notebook at night",
             "But it has to be the right list.",
             "Writing what's NOT done beat writing what IS done (~9 min faster, small study)",
             "'Lights out—' → pen charges", 26, "charge"),
    "H20": R("YOUR PHONE STEALS YOUR BRAIN?", "The viral 'your phone drains your brain' study. Then this happened.",
             "Spark fires a beam that knocks the phone off the desk",
             "Other scientists tried to repeat it.",
             "The famous version is overstated: effects small and debated",
             "'Phone slides—' → beam", 28, "beam"),
    "H21": R("10 MINUTES OFF", "A ten-minute break really does recharge you.",
             "An ENERGY gauge refills during a break and overloads",
             "Just don't expect it to do this one thing.",
             "Feel better: yes. Work better on hard tasks: not reliably",
             "'Battery loops—' → gauge refills", 25, "meter"),
    "H22": R("TIMER vs VIBES", "Scheduled breaks vs 'I'll stop when I'm tired'.",
             "A timer and a sleepy cloud power up and clash",
             "One of them leaves you more drained.",
             "Same work done; the timer group felt better",
             "'Timer rings—' → clash", 26, "clash"),
    "H23": R("26 MINUTES", "NASA let pilots nap in the cockpit.",
             "An alarm slams; a pilot's eyes snap open with an impact frame",
             "Here's what twenty-six minutes did.",
             "Fewer lapses after the nap; the famous 34%/54% numbers aren't in the report",
             "'Alarm beeps—' → slam", 25, "impact"),
    "H24": R("DUE: SOMEDAY", "'End of the month' is the most dangerous deadline you can set.",
             "Spark dashes toward a deadline that keeps sliding away",
             "Setting your own deadline helps. Just not like that.",
             "Evenly spaced deadlines beat one big one",
             "'Next step—' → dash", 25, "dash"),
    "H25": R("TAKES 2 MINUTES?", "You spent twenty minutes planning a two-minute task.",
             "A 2-MIN task card glows and charges; a planning doc piles up behind Spark",
             "There's a rule for this.",
             "Under two minutes? Do it now (a rule of thumb, not science)",
             "'List shrinks—' → charge", 22, "charge"),
    "H28": R("5 MINUTES. JUST BREATHE OUT.", "Five minutes of breathing beat meditation in one study.",
             "A CALM gauge fills with each long exhale and overloads",
             "The trick is in how you breathe out.",
             "Two short inhales, one long exhale (small, not preregistered)",
             "'Balloon fills—' → gauge", 25, "meter"),
    "H29": R("OPEN THE CURTAINS", "Your body clock is reading the light right now.",
             "Morning sun beams through the curtains straight onto Spark",
             "Light at the wrong time showed the opposite link.",
             "More day light linked to better mental health; more night light to worse",
             "'Sun rises—' → beam", 26, "beam"),
    "H30": R("8 GLASSES. SAYS WHO?", "Nobody can find the study behind eight glasses a day.",
             "A giant glass slams down with an impact frame",
             "And a fifth of your water was hiding somewhere else.",
             "About 20% of your water comes from food",
             "'Glass refills—' → slam", 25, "impact"),
    "H31": R("50%", "Strong friendships were linked to fifty percent better odds of survival.",
             "Spark's phone buzzes; a friend dashes in with afterimages",
             "Researchers compared it to something surprising.",
             "Social ties ranked alongside quitting smoking (observational)",
             "'Phone buzzes—' → dash", 25, "dash"),
    "H32": R("SPEND IT ON THEM", "Spending on someone else made people happier.",
             "Two figures power up, a chai cup between them, auras clash",
             "And the amount that worked was surprisingly small.",
             "It was the small amount, not the big one",
             "'Chai returns—' → clash", 25, "clash"),
    "H33": R("GRATITUDE = HAPPINESS?", "Gratitude journaling won't change your life overnight.",
             "A HAPPINESS gauge barely fills, then Spark charges it",
             "Here's what it actually does.",
             "Small boost; it doesn't beat other active exercises",
             "'Pen taps—' → charge", 26, "charge"),
    "H34": R("COLD SHOWER CHALLENGE", "Cold showers cut sick days by 29%. But not colds.",
             "Spark fires through an icy beam of water from the shower head",
             "Same illness. Fewer days off. How?",
             "Same days of illness, fewer days off (avoid with heart conditions)",
             "'Tap turns warm—' → beam", 27, "beam"),
    "H35": R("ONE MORE SCROLL", "Reading on a glowing screen made people fall asleep later.",
             "A phone slams onto the pillow with an impact frame",
             "How much later? Less than you'd think.",
             "~10 minutes, in a tiny lab study",
             "'Screen dims—' → slam", 25, "impact"),
    "H36": R("TOO HOT TO SLEEP?", "Waking up a lot on hot nights? Heat steals deep sleep.",
             "A HEAT gauge rises past red and cracks over a sweaty bed",
             "Cold rooms didn't do the same. Here's why.",
             "Heat cuts slow-wave and REM sleep; cool rooms with blankets didn't",
             "'Fan spins—' → gauge", 25, "meter"),
    "H37": R("SMILE = HAPPY?", "The famous pen-in-your-teeth smile study failed.",
             "A pen and a real smile power up and clash",
             "Then the story got twistier.",
             "Busted, then partly un-busted: a real posed smile helped a little",
             "'Smile returns—' → clash", 27, "clash"),
}

# Column names in the two plan CSVs.
PLAN_COLS = {"overlay": "Hook overlay (frame 1)", "hook": "Hook line (caption)", "loop": "Loop / bookend", "length": "Length (s)"}


def apply(rows, columns):
    """Patch rows (lists in `columns` order) in place. Leaves produced rows alone unless listed."""
    idx = {c: columns.index(c) for c in ["ID", *PLAN_COLS.values()] if c in columns}
    for r in rows:
        rw = REWRITE.get(r[idx["ID"]])
        if not rw:
            continue
        for k, col in PLAN_COLS.items():
            if col in idx:
                r[idx[col]] = rw[k]
    return rows


def apply_dicts(rows):
    """Same as apply() for rows that are dicts keyed by column name (topics.build_rows)."""
    for r in rows:
        rw = REWRITE.get(r.get("ID"))
        if rw:
            for k, col in PLAN_COLS.items():
                if col in r:
                    r[col] = rw[k]
    return rows


def _patch_csv(path):
    with open(path, newline="", encoding="utf-8") as fh:
        data = list(csv.reader(fh))
    head, rows = data[0], data[1:]
    apply(rows, head)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(head)
        w.writerows(rows)
    return len(rows)


def main():
    root = os.path.dirname(HERE)
    _patch_csv(os.path.join(HERE, "content_plan.csv"))
    _patch_csv(os.path.join(HERE, "hacks_ideas.csv"))
    out = os.path.join(HERE, "retention_v2.csv")
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["ID", "Hook overlay (frame 1)", "Spoken hook (by 2.5 s)", "Cold open (frame 0)", "Open loop (2.5-6 s)",
                    "Re-hook (~14 s)", "Loop / bookend", "Length (s)", "Power-up FX"])
        for k, v in REWRITE.items():
            w.writerow([k, *[v[f] for f in FIELDS]])
    print(f"patched plan CSVs; wrote {os.path.relpath(out, root)} ({len(REWRITE)} rows)")


if __name__ == "__main__":
    main()
