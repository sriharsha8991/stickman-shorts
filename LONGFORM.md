# Stickman Shorts — long-form explainer runbook

One long-form explainer (3–6 min, 16:9) **every 40 hours** (owner, 2026-10-22). Same channel, same host
(**Spark**), same voice, same guardrails as the Shorts (`PIPELINE.md`). This file only lists what is
different or extra for long-form; where it says "as PIPELINE §n", follow that section. Nothing here ever posts to
YouTube: a human reviews and posts.

## 0. Fixed references (long-form)

| What | Where |
|---|---|
| Topic plan | `plan/longform_plan.csv` (IDs `L001`…, 10 detailed narrated briefs). Drive mirrors: sheet `1DevWe_keQNiaSs_NCi1oL3OI7KLIf-RDS-ZyfE3ti24`, narrated doc `18qpmXQVUacVxDAKTKR2Gr-zm7LSHNkb9IeQXGsaOQCs` (update the sheet's Status when a video ships) |
| Cadence state | `plan/longform_state.json` (`interval_hours` 40, `last_started_utc`, `last_id`, `last_message_id`, `paused`) |
| Tracker | `plan/status.csv` (same file as the Shorts; rows `Lxxx`) |
| Profanity policy notes | `plan/longform_policy.md` |
| Retention gate | `tools/beat_check.py` (no stretch > 5 s without a visual change) |
| Writing craft | `WRITING.md` (sourced rules from top creators + attention psychology: read before every script) |
| Spark acting | `studio/src/shared/mascot.tsx` (15 moods) + `studio/src/shared/gestures.ts` (gesture library); reference sheet: `npx remotion still SparkSheet out/spark-sheet.png --frame=20` |
| Thumbnails | `studio/src/thumbs/LongThumbs.tsx` (compositions `ThumbLxxx`, 1280×720), PNGs in `videos/thumbs/` |
| Everything else | as `PIPELINE.md` §0 (Drive folders, Gmail thread `1a159c3adf191ae8`, owner, Spark, voice) |

## 1. Gate: is a long-form run due? (cheap; do this first)

The scheduled task checks every 8 hours; only every 5th check (40 h) makes a video.
1. Read `plan/longform_state.json` and `plan/inbox_state.json` from `main` with the GitHub tool
   (`get_file_contents`), **without cloning**.
2. End the run quietly (no email, no notification, no commit) if any of these hold:
   - `longform_state.paused` is true, or `inbox_state.paused` is true (the owner paused the whole pipeline);
   - `last_started_utc` is set and now − `last_started_utc` < **39.5 hours**.
3. Otherwise the run is due. Clone (as PIPELINE §1.1, sparse), then **immediately** set
   `last_started_utc` to now (UTC, ISO 8601), commit `Long-form: start <date>` and push, so a later check can't
   start a second run while this one is rendering.

## 2. Inbox (long-form commands only)

Read the Gmail thread (`get_thread 1a159c3adf191ae8`). Owner messages are defined as PIPELINE §1.2, but use
`longform_state.last_message_id` as the "already processed" marker (the Shorts run keeps its own). Act only on
long-form commands, oldest first:
- `LONG PAUSE` → `longform_state.paused = true`, reply "Long-form paused until you reply LONG RESUME", commit, end.
- `LONG RESUME` → `paused = false`.
- `REDO Lxxx: <notes>` → make Lxxx again this run with the notes (remake = `videos/Lxxx-<slug>-v2.mp4`).
- `SKIP Lxxx` → Skipped in `status.csv`.
- `ADD L: <topic>` → append a `Planned` row to `longform_plan.csv` (next free ID; fill the columns; facts are
  verified when it's produced).
- Long-form feedback (mentions "long-form"/"long video"/an L ID) → dated line in `plan/feedback.md`, apply from now on.
Ignore everything else (Shorts commands belong to the Shorts run). `PAUSE`/`RESUME` for the whole pipeline are
handled by the Shorts run; this run only respects `inbox_state.paused`. Save the newest message id to
`longform_state.last_message_id`.

## 3. Pick the topic

An emailed `REDO Lxxx`, else an L row with Status `Redo` in `status.csv`, else the first row of
`longform_plan.csv` whose ID isn't `Produced`/`Skipped`. The row is a full brief: title + A/B titles, thumbnail
text and concept, hook, promise, misconception, a narrated chapter plan, re-hooks, wow moments, Spark acting,
visual world, retention devices, ending, verified facts with sources, cautions, risk flag and length. Build from it,
but re-verify every fact on the day (§5), and if a fact changed, change the script rather than the facts. Two `Failed` on the same ID → `Skipped`, take the next.
If none is left: email the owner six new researched topic suggestions (pillars as the plan) and stop.
Slug `l0NN-short-kebab-title`; composition id = PascalCase of the slug (e.g. `L001FeedDecides`).

## 4. Toolchain and skills

As PIPELINE §3 (`bash setup.sh && source env.sh`, read the skills). Also read
`youtube-agent-skill/skills/yt-script/SKILL.md` closely: long-form structure, retention, chapters.

## 5. Facts (gate)

As PIPELINE §4, with more claims: every claim, number, date and quote in the script gets a row in
`studio/src/<slug>/facts.md` (claim → verdict → primary source URL). The row's **Facts to verify** is the
starting list, not the full list. Each on-screen number shows a short source line while it's on screen.
Risk flags as PIPELINE §4 (Finance-edu / Health-edu / Policy-check / Security-edu / Legal-edu lines on screen).

## 6. Script, pacing and pauses (gate)

- **Read `WRITING.md` first and apply all of it**: packaging first, misconception first, BUT/THEREFORE beats,
  curiosity-driven open loops, a re-hook every ~60–90 s plus a big one near 3:00, one concrete example per idea,
  write for the ear, pay off fast, end on awe. Draft the hook three ways, read each aloud, keep the one that
  makes you want the answer most, and score it (≥ 55).

- **Length 3–6 min** (row's target ± 0.5 min) at **120–140 words per minute**, measured over the whole
  voiceover including pauses: `wpm = spoken words ÷ (VOICE_FRAMES / 1800)`. That's roughly 360–840 words.
  If wpm > 140 → add pauses or cut words; if < 120 → tighten. Re-run the voice and re-measure.
- **Voice pacing (measured 2026-10-22):** the channel voice at its Shorts speed (1.1×) talks at about 190 wpm,
  far too fast. For long-form, run the voiceover with **`--speed 0.95 --gap 0.8`**: same voice, slightly slower,
  0.8 s between caption lines (≈ 137 wpm on a test script). Keep caption lines at 6–9 words. To tune, move
  `--gap` within 0.5–1.0 and `--speed` within 0.95–1.0, nothing else.
- **Pauses 0.5–1.0 s, never longer:** the line gap is the default pause; add `[pause 1.0]` rows after each big
  reveal and at every chapter break. Never stack two pause rows; never a pause > 1.0 s.
  (Since 2026-10-22 a `[pause x]` row *replaces* the line gap before it in `voiceover.py`, so the silence is exactly
  x s: `[pause 1.0]` = 1.0 s, not gap + 1.0.)
- **Structure** (Mechanism Reveal, stretched):
  1. **Hook, 0–7 s**: the cold open, a question that works muted plus a text overlay (5 hooks scored with
     `hookscore.py`, use one ≥ 55, as PIPELINE §5.1).
  2. **Promise, by 0:20**: what they'll understand by the end ("By the end you'll know…").
  3. **4–6 chapters** (from the row): each one asks a question, shows the mechanism, gives a proof or example,
     and lands a mini-payoff. End each chapter with an open loop into the next ("But that's not the strange
     part…").
  4. **Recap + one takeaway** (what to do differently), then a 5–8 s end card with Spark (no fake CTA promises).
- Spark speaks as the host ("I", "you"), 4–10 words per caption line, numbers written as spoken.
- **Profanity (owner-approved, long-form only):** optionally **one** profane word, **only inside the first 7 seconds**,
  and only if it sharpens the hook. Never after 7 s, never in the title, thumbnail, description or chapter names,
  never a slur or hateful language, never aimed at a person or group. On screen, obscure it (`f***`). Before using
  a *strong* word (like the f-word), re-check the official page (`support.google.com/youtube/answer/6162278`,
  "Inappropriate language"). If it doesn't clearly allow strong profanity in the opening, use a mild word
  ("damn", "hell"), which the page lists as full-ad eligible, or none. Details and sources: `plan/longform_policy.md`.
  The Shorts stay clean.

## 7. Storyboard: a change every 3–5 seconds (gate)

`studio/src/<slug>/storyboard.md` has one row per beat, anchored to spoken words, with **a new visual element,
sound cue or text callout every 3–5 seconds**. Rotate the types (new prop or character action → text callout →
camera punch-in or cut → SFX accent), with uneven spacing and no dead air. Plus:
- A scene change (new staging or background state) at least every 20–40 s. A short chapter card (≤ 1.5 s)
  sits on each chapter's pause.
- One "wow" moment per chapter, and Spark's bulb on each chapter's aha.
- **Spark acts every line** (WRITING.md §D.21): an expression (`mood`) plus a gesture from `shared/gestures.ts`
  on every spoken beat, built with `gestureKeys()` (anticipation + holds), with `nod/hop/wave/shake` layers on
  emphasis. Never the same gesture twice in a row, and at least 8 different moods per video. The plan row's
  'Spark acting' column is the starting script for his performance.
- One visual world per video (its own metaphor, palette and props), different from the latest Shorts and the
  previous long-form video.

## 8. Build the scenes (16:9)

```bash
cd ~/stickman && source env.sh
python3 $ENGINE/scripts/new_video.py --project studio --slug <slug> --size 1920x1080
rm studio/src/<slug>/S01Example.tsx
python3 tools/voiceover.py --slug <slug> --script studio/src/<slug>/voice.txt --speed 0.95 --gap 0.8
```
- **One scene file per chapter** (`S01Hook.tsx`, `S02<Name>.tsx`, …); each scene starts on its chapter's first
  cue frame. Wire them in `Video.tsx` (copy the pattern from `studio/src/h26-coffee-cutoff/Video.tsx`), with
  `DURATION = VOICE_FRAMES`. Root defaultProps `{ music: 0.28, sfx: 0.6, voice: "voice.wav", captions: false }`.
- **16:9 layout**: canvas 1920×1080, safe zone x 96–1824 / y 54–1026, title zone y 90–330, action y 360–880,
  ground ≈ y 880, captions `<VoiceCaptions f={from + f} cues={VOICE_CUES} x={260} w={1400} y={975} size={54} hi={[…]} />`.
  Spark at scale 1.3–1.5 in the left or right third, other figures 1.1–1.3. One hero per frame. Draw your own
  backgrounds: the kit's `DayBg/NightBg/Bed/Nightstand` are vertical-only.
- Spark rules as PIPELINE §6 (on screen as host throughout, lip-sync `mouthAt`, bulb on each aha, never
  restyled). `cd studio && npx tsc --noEmit` must pass.

## 9. Visual check (gate)

For every chapter: `node stickman-sheet.mjs <Comp> out/sheet-<n>.png <8 frames across the chapter>`. Open each
PNG and fix overlaps, off-safe-zone items and unreadable text (as PIPELINE §7).

## 10. Music, render, QA (gate)

1. SFX: `python3 $ENGINE/scripts/gen_audio.py --out studio/public/<slug> --plan "intro:<seconds>"`.
2. Score: `studio/music/<slug>_score.py` (from `score_template.py`), one section per chapter with a variation
   each, sparse under the voice, small lifts on the reveals, a loop-friendly ending; render with
   `tools/render_midi.py … --reverb --length <seconds>`.
3. Render in the background and poll; never exceed `nproc`. A 5-min video takes ~30–45 min on 2 CPUs:
   `cd studio && npx remotion render <Comp> out/<ID>-<slug>.mp4 --concurrency=$(nproc)`, then
   `bash tools/master_audio.sh studio/out/<ID>-<slug>.mp4 studio/out/<ID>-<slug>-m.mp4`.
4. **Size ≤ 45 MB** (GitHub rejects files over 100 MB). If larger, re-encode the video:
   `ffmpeg -i in.mp4 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart out.mp4`
   (go up to crf 28 if needed). Always end with `-movflags +faststart`.
5. QA (all must pass; fix and re-render if not):
   - `ffprobe`: 1920×1080, duration 3–6 min, audio present.
   - wpm 120–140 (from §6); no pause row > 1.0 s.
   - `python3 tools/beat_check.py studio/out/<ID>-<slug>-m.mp4 --max 5` exits 0 (no stretch > 5 s without
     a visual change). Report its `median_gap_s`.
   - `check_render.py` (measure the stereo peak; the checker's mono downmix can over-read it); speech ≥ 5 dB above
     the music-only gaps.
   - Look at the first frame, the last frame and the first frame of every chapter.
   - Profanity check: no profanity after 7 s, and none in the title, description or thumbnail.

## 11. Thumbnail

The plan already has a first thumbnail for each row (`videos/thumbs/<ID>-thumb.png`, made by
`studio/src/thumbs/LongThumbs.tsx`). After the video exists, update that entry so the thumbnail matches what
the video really shows: same world and palette, Spark's face large with the row's mood and gesture, one object,
2–4 words that add tension, no profanity, no logos (WRITING.md §A). Also make **two alternates** for Test &
Compare (`<ID>-thumb-b.png`, `-c.png`): a different expression or word angle. Render them with
`npx remotion still Thumb<ID> …` and commit them to `videos/thumbs/`.

## 12. Deliver

1. `videos/<ID>.md`: YouTube title (< 70 chars, no profanity), description (2–3 lines, then **chapters** as
   `0:00 Intro`, `m:ss <chapter>`… from the cue frames, then sources), 3–5 hashtags, a pinned-comment idea,
   hook + score, duration, wpm, beat-check median gap.
2. `videos/<ID>-<slug>.mp4` + thumbnail (`git add --sparse`). Links as PIPELINE §10.2.
3. Drive doc `<ID> · <Title>` in the Videos folder (as PIPELINE §10.3), with the chapters + timestamps.
4. `plan/status.csv` row `<ID>,Produced,…`. Set `longform_state.last_id`, commit `<ID>: <Title>`, push.
   `git pull --rebase` first if rejected. The Shorts run pushes too; if `Root.tsx` conflicts, keep both sets of compositions.
5. Email: `send_message` to `srih8991@gmail.com`, `replyThreadId 1a159c3adf191ae8`, subject
   "Re: Stickman Shorts — production updates". Put a **"⬇ Download MP4 · LONG-FORM <ID>"** button at the top, then
   **"⬇ Thumbnail" buttons** (raw links to the 3 PNGs), then title + the 2 alternate titles, watch link, Drive doc,
   duration, wpm, hook + score, chapters, description, QA notes,
   decisions needed, the next long-form topic and the next due time (start + 40 h). Sign it "— Claude".
   Append the returned id to `plan/inbox_state.json` `sent_ids` **and** set `longform_state.last_message_id`;
   commit and push.
6. `SendUserFile` the MP4 and the thumbnails.

## 13. Guardrails and failures

PIPELINE §9 and §11 apply unchanged (verified facts only, SEBI/medical lines, no logos or copyrighted characters,
never post, never email anyone but the owner, never delete Drive files or rewrite git history). If the video
can't be finished after one fix-and-retry, mark it `Failed` with a reason, push, and email the owner. Keep
`last_started_utc` as set, so the next attempt is 40 h later.
