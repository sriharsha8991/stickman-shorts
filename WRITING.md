# Writing for attention — the channel's craft guide

Applies to **every** script, Shorts and long-form (owner, 2026-10-22: "always interesting and attention
grabbing", in the style of top-tier YouTube writers, and grounded in how the brain pays attention). Each rule
names its source. Sources were checked on the web on 2026-10-22; items marked *(secondary)* were confirmed
through a write-up, not the original. Facts in a video still need their own checks (PIPELINE §4 / LONGFORM §5).

## The one-line philosophy
**Promise something specific, make the viewer feel the gap, pay it off better than they expected, and change
something on screen every few seconds while you do it.** Clickbait is fine *only if the video delivers*
(Veritasium, "Clickbait is Unreasonably Effective", 2021 *(secondary)*; MrBeast production guide, 2024).

## A. Packaging first (title + thumbnail before the script)
1. **Write the title and thumbnail before the script.** Drop any idea that can't be packaged. They "set the
   expectations for the viewer" (MrBeast guide, 2024: https://simonwillison.net/2024/Sep/15/how-to-succeed-in-mrbeast-production/).
2. **Open a curiosity gap that the video closes in full.** If the video doesn't match the packaging, viewers
   "feel like you were lied to and click off" (MrBeast guide). Never promise what the facts don't support.
3. **One focal point: Spark's expressive face plus one object**, with his eyes or hand pointing at it. People's
   eyes jump to faces within ~100 ms, and gaze direction steers attention (Crouzet, Kirchner & Thorpe 2010,
   *J Vision* 10(4):16; Friesen & Kingstone 1998). Industry "faces add X% CTR" claims are unverified: test instead.
4. **2–4 big words, not the title repeated.** Add tension or a twist to the title ("21 DAYS? NOPE."). High
   contrast, readable at phone size, no profanity, no logos.
5. **Judge packaging by watch time, not clicks.** YouTube's Test & Compare picks the variant with the highest
   watch-time share (https://support.google.com/youtube/answer/16391400). Give the owner 2–3 title options.

## B. The first 30 seconds
6. **Confirm the promise immediately.** No logo sting, no "hey guys", no context dump. YouTube's "intro" metric
   is how many viewers are still watching at 30 s, and its fix is to match the packaging and rework the opening
   (https://support.google.com/youtube/answer/9314415).
7. **Open on a specific, surprising question the viewer half-knows.** Curiosity peaks when people know a little
   but not the answer. It activates reward areas and improves memory for the answer (Loewenstein 1994,
   *Psych Bull* 116:75; Kang et al. 2009, *Psych Science*).
8. **Show, don't announce.** "Stop telling people what they will be watching and start showing them." The
   first minute is "the most important minute" (MrBeast guide).
9. **Long-form: say the payoff by 0:20** ("By the end you'll know exactly why…"), then start the first chapter.

## C. Structure and open loops
10. **Connect beats with BUT / THEREFORE, never "and then".** Each beat is caused by the last or complicates it
    (Trey Parker & Matt Stone, NYU/mtvU 2011 *(secondary)*).
11. **Open the next question before you close the current one.** Curiosity improves memory even for things
    learned around it (Gruber, Gelman & Ranganath 2014, *Neuron* 84:486). Justify open loops by **curiosity**,
    not Zeigarnik: a 2025 meta-analysis found no memory boost for unfinished tasks (Ghibellini & Meier 2025).
12. **Re-hook on schedule.** Long-form: a new question, twist or stakes every ~60–90 s (our rule of thumb), and
    a big one near minute 3 (MrBeast guide: "3 minute re-engagement").
13. **Every story needs friction.** "If everything is smooth sailing, then nobody cares." Even a 30 s Short needs
    an obstacle or contradiction (Jenny Hoyos, TED 2024: https://www.ted.com/talks/145078).
14. **Tell the mechanism through a character in a situation** (YOU at a checkout, YOU in bed at 1 AM), not as a
    summary. Narrative transportation lowers counter-arguing (Green & Brock 2000, *JPSP* 79:701).
15. **Misconception first.** State the common wrong belief in the viewer's own words, show why it fails, then the
    real mechanism. In Muller's studies, the clear expository videos taught little, while the misconception
    versions felt harder and roughly doubled learning (Muller et al. 2008, *J Comput Assist Learn* 24:144
    *(secondary for the size)*).

## D. Pacing and visuals
16. **Change something every 3–5 s, and change the picture whenever the idea changes.** Use a new prop, an action,
    a text callout, a punch-in or a cut. Cut anything decorative that doesn't carry the idea (Mayer 2020,
    coherence and segmenting principles). Long-form enforces this with `tools/beat_check.py`.
17. **Signal the structure on screen**: arrows, highlights, "1 / 2 / 3", chapter cards (Mayer, signaling).
18. **Captions show words as they're spoken; callouts are 1–3 keywords next to the visual.** Never a paragraph of
    narration as on-screen text (Mayer, redundancy).
19. **A surprise at every section turn.** Dopamine neurons respond to unexpected outcomes, i.e. reward
    prediction error (Schultz, Dayan & Montague 1997, *Science* 275:1593). Script the reveal so it breaks the
    viewer's prediction. Never say "dopamine hit" as a fact.
20. **Put your best moment earlier than feels natural.** Audience shrinks over a video (YouTube Help 9314415).
21. **Spark acts every line.** Pair every spoken beat with an expression (`mood`) and a gesture
    (`shared/gestures.ts`), with a 3-frame anticipation before big moves and a hold of 8–20 frames. React on the
    word (shock on the number, curious on the question, mindblown on the reveal, wink on the takeaway). Vary
    gestures: never the same one twice in a row.

## E. Explaining clearly
22. **One concrete example per abstract idea**: a named amount, an object, a moment ("₹1,000 split into four
    ₹250s", not "smaller payments"). Concrete words are easier to picture and remember (Paivio, dual coding).
23. **Write for the ear.** 6–10 words per line, one idea per line, "you" and "I", contractions, numbers written as
    spoken. Read it aloud: if you'd stumble, cut it.
24. **Every claim has a source in facts.md**, shown on screen while the number is up. Kurzgesagt publishes a
    sources sheet for every video (https://kurzgesagt.org/youtube/). Trust is the moat.

## F. Endings and re-watch
25. **Pay off fast and stop.** Give the answer "quickly and concisely", don't "overcook" it (Hoyos, TED 2024).
    The takeaway is one thing to do differently.
26. **End on awe or a smile ("wait, that's how it works?"), not on gloom or a lecture.** High-arousal emotions
    (awe, surprise) predicted sharing; sadness predicted less (Berger & Milkman 2012, *JMR* 49:192). For money
    and health topics, never manufacture anxiety (SEBI / medical rules).
27. **Loop the ending into the first frame** (Shorts) or into a question the next video answers (long-form).
28. **Learn from the spikes.** Rewatch spikes mark the moments people replayed or shared (YouTube Help 9314415).
    Note in the email which beats should spike, and ask the owner for retention screenshots.

## G. Retention v2 for Shorts (owner, 2026-10-23)
Week-one analytics: 37.4% stayed to watch, 62.6% swiped away, every Short stalled at ~1K views (the seed
test), 96.5% of views from the Shorts feed, audience 74% male and ~60% aged 25–44. Goal: stayed-to-watch above
50% and viewers held 20–27 s. Each Short follows the beat sheet in `plan/retention_v2.csv` when its ID is there.
29. **22–30 s, no exceptions for Shorts.** Holding a viewer 20–27 s should mean they watched almost all of it.
    Cut anything that doesn't serve the payoff, even true and interesting facts.
30. **Frame 0 is the best moment.** The strongest number or image is already on screen and moving at frame 0:
    no walk-in, no title card, no "you've heard…". Viewers decide in under ~2 s and most watch muted, so the
    overlay (≤ 6 words) is up from frame 0 for ≥ 2 s and says the same thing as the spoken hook
    (Opus Clip hook guide, creator advice: https://www.opus.pro/blog/youtube-shorts-hook-formulas).
31. **Beat sheet:** 0–2.5 s cold open + power-up FX · 2.5–6 s open loop (a promise, never answered there) ·
    6–14 s escalate (BUT/THEREFORE, one number per line, new visual every 2–3 s) · ~14 s re-hook (twist + sound
    hit + mood flip) · 16–24 s payoff that closes the loop · 24–27 s one action in ≤ 8 words, then cut
    mid-sentence back into frame 0 (no outro). Each Short is tested on a small seed audience first and only
    pushed wider if it holds them (vidIQ: https://vidiq.com/blog/post/youtube-shorts-algorithm/).
32. **Talk to a working professional**: office, deadlines, salary, code review, the commute. That's who watches.
33. **Series tag** "Hidden Mechanism #NN" small in a corner, and Spark's same sign-off pose on the last frame.

## Myths we never repeat
- "Humans have an 8-second attention span, less than a goldfish": no underlying study exists (BBC, 2017; WSJ, 2017).
- "Open loops work because of the Zeigarnik effect": it failed a 2025 meta-analysis; resumption (Ovsiankina) holds.
- "Dopamine = pleasure hits": the established finding is reward prediction error.
- "If it feels clear, they learned it": clarity can hide no learning (Muller 2008).

## Voice of the channel
Spark is a curious, slightly cheeky friend who has just discovered how something works and can't wait to show
you. He's never smug at the viewer's expense, never fear-mongering, and always honest about the caveat (the
caveat is part of the twist, not fine print). Tone references: the curiosity of Veritasium, the clarity of
Kurzgesagt, the pace of a top Short.
