# Stickman Shorts

Automated vertical (9:16) stick-figure shorts for Instagram Reels and YouTube Shorts, built with
Remotion and the `stickman-video` engine.

- **Producing a video?** Follow `PIPELINE.md` step by step. One run = two finished videos: one from the 100-video plan + one life/productivity hack.
- Plan: `plan/content_plan.csv` (100 videos) · tracker: `plan/status.csv` · owner feedback: `plan/feedback.md`.
- Idea bank: `plan/hacks_ideas.csv` (life & productivity hacks, researched; built by `tools/build_hacks_ideas.py`; Drive sheet "Stickman Shorts — Life & productivity hacks (idea bank)"). Every run makes one hack video (slot B, PIPELINE.md step 2); owner can jump the queue with `ADD Hxx`.
- Toolchain: `bash setup.sh && source env.sh` (skills land in `_vendor/`, never commit it).
- Every video is hosted by **Spark** (`studio/src/shared/mascot.tsx`) and narrated with the offline channel voice
  (`tools/voiceover.py`, config `studio/voice.json`). Reference: `studio/src/v000-meet-spark/` (V000).
- Older references: `studio/src/scroll-trap/` (V002) and `studio/src/streak-hostage/` (V003) for scene craft.
- Shared components for new videos: `studio/src/shared/kit.tsx`. Music template: `studio/music/score_template.py`.
- Never post to social platforms, never invent facts, keep money topics educational (SEBI), and keep
  every video visually distinct (YouTube inauthentic-content rules).
