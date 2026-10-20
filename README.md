# Stickman Shorts

**The Hidden Mechanism**: how AI, money and your brain quietly work, explained with stick figures.
Vertical 1080×1920 shorts for Instagram Reels and YouTube Shorts, produced by Claude Code with
[Remotion](https://www.remotion.dev) and the [stickman-video](https://github.com/nispa/stickman-video) engine.

## How it runs

A Claude scheduled task fires every 8 hours and follows [`PIPELINE.md`](PIPELINE.md):

1. reads owner replies in the Gmail thread "Stickman Shorts — production updates" (PAUSE / REDO / SKIP / feedback)
2. picks the next video from [`plan/content_plan.csv`](plan/content_plan.csv)
3. verifies facts → scores hooks (≥ 55) → storyboards → builds scenes → composes an original score → renders → QA
4. commits the MP4 to `videos/`, files a Drive doc (script, captions, post copy, sources), updates
   [`plan/status.csv`](plan/status.csv), and replies in the Gmail thread

Nothing is posted automatically: the owner reviews and posts.

## Layout

```
PIPELINE.md            the per-run procedure (the automation follows this)
setup.sh               rebuilds the toolchain in a fresh container (~1 min)
videos/                rendered MP4s + post copy (runs clone sparse and skip the MP4s)
plan/                  content_plan.csv + .xlsx (100 videos), status.csv, feedback.md, topics.py (generator)
studio/                Remotion project
  src/stickman/        stick-figure engine (from nispa/stickman-video, fonts bundled locally)
  src/shared/kit.tsx   shared vertical-video components (kinetic captions, punch-ins, props)
  src/<slug>/          one folder per video (scenes, storyboard, facts, hooks, post copy)
  music/               per-video MIDI scores (+ score_template.py)
tools/render_midi.py   offline MIDI → MP3 with the GeneralUser GS SoundFont
```

## Skills used (pinned in setup.sh)

| Skill | Used for |
|---|---|
| nispa/stickman-video | stick-figure engine, SFX, render checks |
| remotion-dev/skills | Remotion best practices, captions, rendering |
| Jakeschincariol/youtube-agent-skill | hook formulas + `hookscore.py` |
| yaxeen/storytelling-skills | six psychology levers, three hook layers |
| iart-ai/tiktok-video-skills | retention pacing, loops, safe zones, kinetic captions |
| iart-ai/motion-design-skills | animation principles, art direction, composition |
| sirruf/music-gen-skill | MIDI composition approach (rendered with GeneralUser GS) |

## Run it by hand

```bash
bash setup.sh && source env.sh
cd studio && npx remotion studio          # preview
npx remotion render ScrollTrap out/scroll-trap.mp4
```

Remotion is free for individuals and small companies; larger organisations need a company licence.
