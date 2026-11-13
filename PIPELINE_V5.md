# Stickman Shorts — Plan v5 runbook (owner, 2026-11-09; v5.1 update 2026-11-10 in §0)

**This file is the production runbook from 2026-11-09.** `PIPELINE.md` is the archive: use it only where this file points to
it (inbox commands §1, toolchain §3, render + mastering §8, delivery §10). Where the two disagree, this file wins.
The why, with the numbers: Claude Doc "Stickman Shorts — Plan v5: the redesign" (https://claude.ai/artifact/P6yDXsryFtroJ3ABCLukcN).

Why it changed: 58 Shorts (12 Oct–9 Nov) earned 35.7K views and none passed YouTube's first ~1K-view test. The clarity
reset of 29 Oct lifted "stayed to watch" from 35% to about 52%; the pencil series Spark Got Tricked fell back to 38% (4 posted).
The best holders were everyday beliefs and body feelings asked as the viewer's own question. So: one format (Real Check),
real photos as evidence, Spark as a small reactor, one Short a day, and a two-week test that changes one thing at a time.

## 0. Plan v5.1 (owner, 2026-11-10): tighter Real Check now, the owner's voice from Sunday 15 Nov
**This section wins over §2–§9 below wherever they disagree.** Same format, same template, same photo rules.
Why: the owner asked to keep v5 but make it much better, and will record the narration himself from Sun 15 Nov.
A real voice is the biggest fix for both "stayed to watch" and YouTube's mass-produced-content reviews.

**0.0 Bridge until Sun 2026-11-15, 23:00 IST (owner, 2026-11-13) — this block wins over 0.2 until then**
- Check the clock first: `date -u`. Before **2026-11-15T17:30Z** (= Sun 15 Nov, 23:00 IST) the run follows the old v5
  TTS plan: make ONE Real Check v5.1 Short per run (0.1 format), narrated with TTS (`tools/voiceover.py`, af_heart 0.85×,
  `--gap 0.45`, TTS pauses and gates of 0.1; hookscore ≥ 55 as spoken). Status row and email say **Voice: tts**.
- **The owner's scripts stay reserved.** R07, R08, R13–R17 (and any later row whose state starts `Owner voice:`) are
  NEVER made with TTS. They stay `Waiting for voice`, and a recording that arrives before the cut-off is still used
  (owner-voice path of 0.2) if the owner drops one; otherwise they wait for Monday.
- **What to make instead:** the lowest-Day row of `plan/slate_v5.csv` whose State starts `Bridge TTS` and is not
  Produced/Skipped. If there is none, the run writes one new row first: next free ID (R18, R19, …), Day = highest Day
  + 1, Arm alternating from the previous row (R18 = B, R19 = A, …), State `Bridge TTS (until 15 Nov 23:00 IST)`, a topic
  picked by 0.1 (everyday phone, money, apps, body, food belief; not already on the slate or in the reserve; not a worn
  school-quiz myth), facts verified on the day. Then it makes that row end to end (§3–§8) the same run.
- Inbox, photos in Drive, checks, render, delivery and the email are unchanged. The email still lists which owner
  recordings are missing (R07, R08, R13–R17) under "Record these by Saturday", and says owner voice starts with the
  first run after Sun 23:00 IST.
- **From 2026-11-15T17:30Z:** this block no longer applies. Unproduced `Bridge TTS` rows are left as they are (state
  `Bridge TTS: not made`), never voiced by TTS again; 0.2 applies to every new Short, starting from R07.

**0.1 Tighter Real Check (every Short from 2026-11-11, TTS or owner voice)**
- Length **20–26 s**, hard cap 28 s (`clarity_check.py --realcheck` now fails above 28 s). 50–65 words, **7 lines**.
  The owner's export showed engaged viewers give about 19–24 s whatever the length, so 30+ s only loses completion.
- Line 1 = the viewer's question (≤ 10 words), spoken from 0.2 s, over the strongest evidence photo, overlay on frame 0.
- **No "who says it" line and no filler** ("Quiz books say yes", "so it sounds believable"). Line 2 is already evidence:
  a number, a named test, or what was measured. One clue per line, lines 2–4.
- Line 5 = the verdict, ends with "!", stamp on the verdict word, landing at **11–16 s** (was 18–22 s).
- Line 6 = the one caveat or the "why it sticks", in plain words. Line 7 = the comment question (≥ 5 words).
- TTS pauses: `[pause 0.5]`–`[pause 0.6]` between lines, one `[pause 0.8]` before the verdict line, nothing longer
  (R01 had 1.0–1.4 s of dead air three times). Pace gates stay: ≤ 2.3 words/s overall, ≤ 3.2 speaking, af_heart 0.85×.
- Topics after R06: beliefs the viewer acts on every day (phone, money, apps, body, food), where the answer changes what
  they do tomorrow. Not the worn school-quiz myths (plan/slate_v5_reserve.csv R09–R12 are now last resort only).
- The A/B/C arm labels stay on the rows (A: `spark: true`, B: `spark: false`) but §9's day-15 rules are replaced by 0.4.

**0.2 Owner voice (every Short from Sun 2026-11-15, 23:00 IST — before that see 0.0; IDs R07, R08, R13 onwards)**
- The script is **fixed**: `plan/voice/<ID>.txt` (7 lines, already fact-checked on the date in the slate row). Copy it to
  `studio/src/<slug>/voice.txt` unchanged: the owner has recorded exactly these words. Still re-verify the claim on the
  day (§3); if a fact no longer holds, do NOT build: mark the row `Waiting for voice`, write the corrected line(s) in the
  email and ask the owner to re-record that one file.
- The recording is in the Drive folder **"Stickman Shorts / Voice"** (id `1RuViZLgd-ub0_5wUeqKu9CbAY8Zqat1H`), one audio
  file per Short named with the ID (`R07.m4a`, `R13.mp3`, …; any extension). Find it with Drive `search_files`
  (`parentId = '1RuViZLgd-ub0_5wUeqKu9CbAY8Zqat1H' and title contains '<ID>'`; newest wins), then
  `download_file_content(fileId)`; the large result is saved to a file whose path the tool prints.
- Build the voice from it (instead of `tools/voiceover.py`):
  `python3 tools/owner_voice.py --slug <slug> --script studio/src/<slug>/voice.txt --audio <saved result path or media file>`
  It splits the recording on the owner's pauses, writes `voice.wav`, `voice.ts`, `timeline.ts/.json` exactly like
  voiceover.py, and prints the real timings. If it reports fewer chunks than lines, retry with `--min-silence 0.15`;
  if that fails too, do not guess: `Waiting for voice` + ask for a re-record with one-second pauses.
  Listen-check by numbers: the printed line durations must look sane (about 2–5 s each, total 18–28 s).
- Gate: `python3 tools/clarity_check.py --slug <slug> --realcheck --owner-voice` (length ≤ 28 s, line lengths; the TTS
  pace, gap and pause-row checks are skipped; speaking above 3.4 words/s fails: ask for a slower take).
- `videos/<ID>.md`, the status row and the email say **Voice: owner**. Never mix TTS and the owner's voice in one Short.
- **No recording for today's row:** take the next row that has one. None at all: make nothing new, set the row to
  `Waiting for voice`, and send the one email saying which IDs are missing (and which finished Shorts are still unposted).
  Never fall back to TTS for an owner-voice row.
- First owner-voice run (R07): this path has only been tested on a synthetic recording. If the Drive download or the
  split fails for a reason not covered here, fix the tool for every Short, push the fix, and say what changed.

**0.3 Next week's scripts (so the owner can record once a week)**
- When two or fewer owner-voice rows are left unproduced in `plan/slate_v5.csv`, this run ALSO writes the next seven:
  pick topics by 0.1, verify every claim from primary sources, write 7-line scripts (5–14 words a line), save them as
  `plan/voice/<ID>.txt`, append the rows (next IDs, alternating Arm A/B, state `Owner voice: script fixed in …`), put
  them in a Drive doc "Voiceover scripts — week of <date>" in the Stickman Shorts folder, and add them to the email
  under **Record these by Saturday**, with the recording notes below. Do not pause the day's Short for this.
- Recording notes for the owner (repeat in that email): one file per Short named with the ID; quiet room, phone 15–20 cm
  away; read line by line with a clear one-second pause between lines; normal talking speed, the verdict word with
  punch; a wrong take is fine, just upload the best one to Drive › Stickman Shorts › Voice.

**0.4 Reading the results (replaces §9's day-15 rules)**
- The owner drops the Studio Shorts export in the Stickman Shorts Drive folder each Sunday (or sends it in the thread).
  Log it in `plan/test_v5.csv` with one more note per row: `voice: tts` or `voice: owner`. Never estimate numbers.
- The question for the week of 15 Nov is one thing only: owner voice vs TTS on the same format. Pass mark for a Short:
  stayed to watch ≥ 60% at 48 h, or more than 3,000 views. Report the median of each group and the best three topics;
  next week's topics (0.3) lean to whatever those three have in common.

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
