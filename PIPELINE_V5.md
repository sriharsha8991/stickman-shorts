# Stickman Shorts — Plan v5 runbook (owner, 2026-11-09)

**This file is the production runbook from 2026-11-09.** `PIPELINE.md` is the archive: use it only where this file points to
it (inbox commands §1, toolchain §3, render + mastering §8, delivery §10). Where the two disagree, this file wins.
The why, with the numbers: Claude Doc "Stickman Shorts — Plan v5: the redesign" (https://claude.ai/artifact/P6yDXsryFtroJ3ABCLukcN).

Why it changed: 58 Shorts (12 Oct–9 Nov) earned 35.7K views and none passed YouTube's first ~1K-view test. The clarity
reset of 29 Oct lifted "stayed to watch" from 35% to about 52%; the pencil series Spark Got Tricked fell back to 38% (4 posted).
The best holders were everyday beliefs and body feelings asked as the viewer's own question. So: one format (Real Check),
real photos as evidence, Spark as a small reactor, one Short a day, and a two-week test that changes one thing at a time.

## 1. Inbox (unchanged)
Follow `PIPELINE.md` §1 (thread 1a159c3adf191ae8, PAUSE/RESUME/REDO/SKIP/ADD/VOICE/feedback, `plan/inbox_state.json`).
New owner command: `PHOTOS Rxx` = the owner added photos for Rxx to the Drive Photo library (§3).

## 2. Pick the Short
1. Owner REDO first. Then the lowest `Day` row of `plan/slate_v5.csv` with Arm A or B whose ID is not `Produced`/`Skipped`
   in `plan/status.csv`. Arm C rows are finished Spark Got Tricked Shorts: nothing to make, they only set the posting order.
2. If that row is `Waiting for photos` and no photos have arrived, make the next A/B row instead (and say so in the email).
3. When every A/B row is produced: make nothing new. Send the email asking for the test results (§9) and stop.
4. A topic that fails fact checking → `Skipped` with the reason, take the next row from `plan/slate_v5_reserve.csv`.
5. Slate v4 (`plan/slate_v4.csv`) and the old plan/hack queues are paused until the owner decides on day 15.

## 3. Facts and photos (gate)
- Verify every claim in the row on the day from primary sources (papers, NASA, national weather/health agencies). Write
  `studio/src/<slug>/facts.md` (claim → verdict → source). The verdict must be true; caveats said in plain words.
  Health topics: "Education, not medical advice" in the description and pinned comment.
- **Photos live in Drive, always (owner, 2026-11-09).** The library is the Drive folder "Stickman Shorts / Photo library"
  (id `14pOfC1HSmKun60-zaF9ztKsKKnDfJXSe`): one Google Doc per Short, "<ID> · <topic> — photos". Renders only ever use
  photos pulled from that doc. Steps:
  1. **Find:** `python3 tools/fetch_photo.py --slug <slug> --query "<subject>" --source openverse|nasa|commons --list`
     (licences kept: public domain, CC0, CC BY, CC BY-SA). Commons often answers 429 to this sandbox; Openverse also
     covers Commons and Flickr. To look at a candidate, `--pick N --name candN` downloads it locally; open it with Read.
     Hosts that refuse downloads (e.g. live.staticflickr.com) are fine: Google fetches them in step 2.
  2. **Store:** Drive `create_file` with `contentMimeType: text/markdown`, parent `14pOfC1HSmKun60-zaF9ztKsKKnDfJXSe`,
     title "<ID> · <topic> — photos", text = per photo `## <file>.jpg — <which line>`, `![<file>.jpg](<direct image URL>)`,
     then `<title> · <author> · <licence> · <source page>` (copy R01's doc, id `1W6JIjBucvmPg3Bh6iBPl0ECnOHRyL4YzTi9OtEK1jcw`).
     Google copies each image into the doc at full size, so no image bytes go through the model.
  3. **Use:** Drive `download_file_content(fileId=<doc id>, exportMimeType="text/html")`; the large result is saved to a
     file whose path the tool prints; then `python3 tools/drive_photos.py --slug <slug> --export <that path>` writes
     `studio/public/<slug>/photos/*.jpg` and fails if any heading has no image (fix the URL in the doc, or swap the photo).
  4. **Log:** `studio/src/<slug>/photos.json` (from fetch_photo.py, plus `"drive_doc": "<doc id>"`) and the credits in
     `facts.md`, `videos/<ID>.md` and the spec's `credit` fields. Open every final photo with Read before building.
  Owner photos: the owner can add a doc to the Photo library the same way (or paste photos into one) with a licence line
  under each; `PHOTOS Rxx` in the thread points the run to it. No licence line → do not use the photo.
- **No licensed photos at all:** finish the script, voice, facts and spec with placeholder photos, set the row to
  `Waiting for photos` in `plan/status.csv`, do not render, and say in the email what is missing.
- Never: Google Images, news or agency photos, an identifiable real person as the subject (names go on a text card),
  logos or brands, AI-generated images presented as real photos, a photo that only decorates (swap test: if a random
  photo would do, cut it).

## 4. Script (gate)
- Format **Real Check**: one belief on trial → evidence → a verdict stamp (MYTH / TRUE / HALF TRUE) → why it sticks → the
  comment question. 28–36 s, about 64–80 words. No generic promise line: the stamp is the open loop.
- Hook = line 1: the viewer's own question, a complete sentence of 10 words or fewer, spoken from 0.2 s.
  `hookscore.py` (PIPELINE.md §5.1) ≥ 55 as spoken (no digit tricks), max 3 rounds.
- Line 2: who says it ("Quiz books and classrooms say yes."). Lines 3–6: one clue per sentence. The verdict line ends with
  "!" and lands at about 18–22 s, after a `[pause 0.9]`–`[pause 1.0]`. Then one line of nuance or why, then the question.
- Clarity rules stay (they lifted retention): simple everyday English, complete sentences of 6–12 words, af_heart at 0.85×,
  `--gap 0.45`. Gate: `python3 tools/clarity_check.py --slug <slug> --realcheck` prints PASS (≤ 2.3 words/s overall,
  ≤ 3.2 speaking). Short words push the speaking pace up: use fuller words and commas before cutting pauses.

## 5. Build from the template (no bespoke scenes)
- A Short is `studio/src/<slug>/spec.ts` (`RealSpec`, `studio/src/shared/realcheck.tsx`) + `voice.ts` + a 6-line `Video.tsx`.
  Copy `studio/src/r01-great-wall/` and change the spec. Register the composition in `studio/src/Root.tsx`.
- One `beats` entry per spoken line: `show` (`{photo: i}`, `{card, sub}`, `{split: [...]}`), optional `tag` (≤ 3 words),
  Spark `mood` + `gesture`. `verdictAt: [cue, word]` = the word the stamp lands on. `spark: true` for Arm A, `false` for B.
- Each Short: its own bold background colour and accent (never the previous Short's), its own photos.
- If the template can't show something, extend `realcheck.tsx` for every Short (and check R01 still renders); never fork it.
- Layout is fixed by the template: everything that matters sits between y 280 and y 1280 and away from the right
  120 px (YouTube's title, channel and buttons cover the rest). Captions at y ~1232. Spark's circle is bottom-left.

## 6. Checks (replace the self-scored critic)
Contact sheet (`node stickman-sheet.mjs <Comp> out/sheet.png 0 45 <one frame per line> <verdict+10> <last>`), then answer
yes/no, all must be yes:
1. Frame 0: the photo shows the thing named in the hook, and the overlay reads at phone size.
2. Every photo is real, licensed, logged in `photos.json`, and shows what its line says (you looked at it).
3. The picture changes on the spoken word it belongs to; no picture is on screen longer than ~5 s without a change.
4. The stamp lands on the verdict word, on the evidence photo, after the pause.
5. No text or face below y 1280 or in the right 120 px; captions never cover the stamp or Spark's face.
6. The last frame matches frame 0 (loop).

## 7. Music, render, QA
- SFX: `python3 $ENGINE/scripts/gen_audio.py --out studio/public/<slug> --plan "intro:<seconds>"` (the template plays
  whoosh on picture changes, stamp + impact on the verdict, and drops the music for ~0.5 s before it).
- Music: copy `studio/music/t15-birthday_score.py` (times in seconds) to `studio/music/<slug>_score.py`, new key, tempo and
  instruments, sparse under the voice, silent in the drop, a hit on the verdict; render with `tools/render_midi.py`.
- Render, master and QA as `PIPELINE.md` §8 (`--crf 25`, x264 re-encode at crf 26–27 if over 15 MB, −14 LUFS,
  `check_render.py`, first/last frame loop check). Render runs long on this machine (~15 min): run it in the background.

## 8. Deliver
As `PIPELINE.md` §10 (videos/<ID>-<slug>.mp4 via `git add --sparse`, `videos/<ID>.md`, status row, Drive doc
"<ID> · <Title>" in the Videos folder, one email, SendUserFile). Changes:
- `videos/<ID>.md`: title = the viewer's question; description with sources AND photo credits (from `photos.json`); the
  pinned comment = the comment question + "Sources in the description".
- The status row notes the **Arm** (A/B), hook score, clarity numbers, verdict time, photo sources.
- The email adds: **the posting order for the next 3 days** from `plan/slate_v5.csv` (A/B/C rows, one a day at the same
  time), and which finished Shorts are waiting to be posted.

## 9. The test and the weekly review
- One Short a day at a fixed time the owner picks; nothing else changes for 14 days (`plan/slate_v5.csv`, Day order).
- Each Monday the owner sends the Shorts export (stayed to watch, average % viewed, views, comments). Log it in
  `plan/test_v5.csv` (ID, Arm, posted date, views at 72 h, stayed %, avg % viewed, comments) and email a short readout.
  No export → no numbers; never estimate.
- Day 15 decision rules: A beats C by ≥ 5 points → Real Check is the default. B ≥ A → Spark leaves the body of the
  Shorts and stays as sign-off. No arm ≥ 55% → next two weeks test topics taken from viewer comments.

## 10. Guardrails (unchanged)
Never post to social platforms; email only the owner; never delete Drive files or rewrite git history; no invented
facts; real people only as words or labelled generic figures; money topics educational only; Shorts stay clean.
