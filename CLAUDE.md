# Stickman Shorts

Automated vertical (9:16) stick-figure shorts for Instagram Reels and YouTube Shorts, built with
Remotion and the `stickman-video` engine.

- **Producing a video?** Follow `PIPELINE.md` step by step. One run = ONE Short (owner 2026-10-27), alternating plan video (Vxxx) and life/productivity hack (Hxx). First 10 seconds + clarity rules: PIPELINE.md §5.6, WRITING.md §H.
- **Long-form: STOPPED** (owner 2026-10-27, `longform_state.paused`). Only if the owner sends LONG RESUME: follow `LONGFORM.md` (3–6 min, 16:9, 130–135 wpm, 0.5–1 s pauses, a change every 3–5 s, a screen transition every 5–7 s, Spark changes size/side every chapter via `shared/camera.tsx`, one video every 40 h; plan `plan/longform_plan.csv`, IDs Lxxx, state `plan/longform_state.json`).
- Plan: `plan/content_plan.csv` (100 videos) · tracker: `plan/status.csv` · owner feedback: `plan/feedback.md`.
- Idea bank: `plan/hacks_ideas.csv` (life & productivity hacks, researched; built by `tools/build_hacks_ideas.py`; Drive sheet "Stickman Shorts — Life & productivity hacks (idea bank)"). Hacks alternate with plan videos (PIPELINE.md step 2); owner can jump the queue with `ADD Hxx`.
- Toolchain: `bash setup.sh && source env.sh` (skills land in `_vendor/`, never commit it).
- **Retention v2 (2026-10-23):** Shorts are 22–30 s with the best moment at frame 0; per-video beat sheets for V013–V035 and every unproduced hack in `plan/retention_v2.csv` (source `plan/retention_v2.py`, which also patches both plan CSVs; the builders call it). Hooks open with an anime-style power-up from `studio/src/shared/powerup.tsx` (demo `PowerUpDemo`).
- **Writing craft:** `WRITING.md` (sourced rules from top creators + attention psychology) applies to every script.
- **Spark acting:** 15 moods in `mascot.tsx`, gestures in `studio/src/shared/gestures.ts`, reference sheet composition `SparkSheet`. Owner asked (2026-10-22) for more gestures and expressions: Spark acts every line.
- Every video is hosted by **Spark** (`studio/src/shared/mascot.tsx`) and narrated with the offline channel voice
  (`tools/voiceover.py`, config `studio/voice.json`: female `af_heart` @ 1.0× since 2026-10-27). Reference: `studio/src/v000-meet-spark/` (V000).
- Older references: `studio/src/scroll-trap/` (V002) and `studio/src/streak-hostage/` (V003) for scene craft.
- Shared components for new videos: `studio/src/shared/kit.tsx`. Music template: `studio/music/score_template.py`.
- Profanity: Shorts stay clean. Long-form may use one word in the first 7 s only, never in titles/thumbnails (`plan/longform_policy.md`).
- Never post to social platforms, never invent facts, keep money topics educational (SEBI), and keep
  every video visually distinct (YouTube inauthentic-content rules).
