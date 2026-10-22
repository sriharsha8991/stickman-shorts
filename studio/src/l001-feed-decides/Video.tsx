import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COL, FONT, ease } from "../stickman/fx";
import { SfxCue } from "./sfx";
import { TIMELINE } from "./timeline";
import { VOICE_CUES, VOICE_FRAMES } from "./voice";
import { VoiceCaptions } from "../shared/kit";
import { C, CE, CYAN, HOT, NAVY, NEON } from "./world";
import { S01Hook, S01_SFX } from "./S01Hook";
import { S02Pick, S02_SFX } from "./S02Pick";
import { S03Signals, S03_SFX } from "./S03Signals";
import { S04Race, S04_SFX } from "./S04Race";
import { S05Loop, S05_SFX } from "./S05Loop";
import { S06Retrain, S06_SFX } from "./S06Retrain";
import { S07Recap, S07_SFX } from "./S07Recap";

// L001 · You Didn't Choose Your Last 10 Videos. This Did. (long-form, 16:9, ~4:55)
const ASSETS = "l001-feed-decides";

export type SceneProps = { from: number; dur: number };
type Scene = { c: React.FC<SceneProps>; from: number; sfx: SfxCue[] };

// One scene per chapter; each starts on its chapter's first cue. SFX frames are GLOBAL.
export const SCENES: Scene[] = [
  { c: S01Hook, from: 0, sfx: S01_SFX },
  { c: S02Pick, from: C(8), sfx: S02_SFX },
  { c: S03Signals, from: C(20), sfx: S03_SFX },
  { c: S04Race, from: C(38), sfx: S04_SFX },
  { c: S05Loop, from: C(55), sfx: S05_SFX },
  { c: S06Retrain, from: C(68), sfx: S06_SFX },
  { c: S07Recap, from: C(79), sfx: S07_SFX },
];

// Chapter cards sit on each chapter's 1-second pause (between the previous line's end and the chapter's first line).
export const CHAPTERS: { n: string; title: string; at: number; to: number }[] = [
  { n: "1", title: "The pick you didn't make", at: CE(7), to: C(8) },
  { n: "2", title: "What it reads", at: CE(19), to: C(20) },
  { n: "3", title: "The ranking race", at: CE(37), to: C(38) },
  { n: "4", title: "The loop", at: CE(54), to: C(55) },
  { n: "5", title: "Retrain it", at: CE(67), to: C(68) },
  { n: "✓", title: "Recap", at: CE(78), to: C(79) },
];

export const DURATION = VOICE_FRAMES;

export type VideoProps = { music: number; sfx: number; voice: string; captions: boolean };

const duck = (f: number) => {
  let g = 1;
  for (const c of TIMELINE.cues) {
    if (f < c.startFrame - 10) break;
    g = Math.min(
      g,
      interpolate(f, [c.startFrame - 8, c.startFrame, c.endFrame, c.endFrame + 10], [1, 0.4, 0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    );
  }
  return g;
};

// neon chapter card: slides over the scene for the length of the pause (+ a few frames)
const ChapterTag: React.FC<{ n: string; title: string; dur: number }> = ({ n, title, dur }) => {
  const f = useCurrentFrame();
  const inK = ease(f, 0, 7);
  const out = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: NAVY, opacity: 0.96 * inK }} />
      <div style={{ position: "absolute", left: 0, top: 520, height: 10, width: `${inK * 100}%`, background: HOT }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          textAlign: "center",
          fontFamily: FONT.title,
          fontWeight: 800,
          fontSize: 64,
          letterSpacing: 16,
          color: CYAN,
          transform: `scale(${interpolate(f, [0, 5, 9], [2, 0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
        }}
      >
        {n === "✓" ? "WRAP-UP" : `CHAPTER ${n}`}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 560,
          textAlign: "center",
          fontFamily: FONT.title,
          fontWeight: 900,
          fontSize: 130,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 3,
          transform: `translateX(${(1 - ease(f, 3, 14)) * -260}px)`,
          textShadow: `0 0 30px ${NEON}`,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

// word-by-word captions, drawn once over every scene with the global frame (never jump between scenes)
export const CAPTION_HI = [
  "choose", "ten", "machine", "spark", "reads", "picks", "shrink", "three", "taps", "one", "one.", "offered", "seventy", "percent",
  "recommendations.", "popular.", "views.", "signals.", "history.", "search", "subscribe", "likes", "dislikes.", "interested.",
  "channel.", "eight", "rate", "happy.", "hate", "guess.", "mind.", "do.", "choose.", "simplified", "two", "hundred", "score.",
  "screen.", "clicks.", "clickbait,", "finish.", "watch", "satisfaction", "keep", "nobody", "again", "cooking.", "harder.",
  "learns,", "smaller", "worlds.", "evil,", "votes.", "mean.", "pause", "edit", "delete", "regret.", "menu", "bonus", "hands.", "training",
];
const CaptionLayer: React.FC = () => {
  const f = useCurrentFrame();
  return <VoiceCaptions f={f} cues={VOICE_CUES} x={260} w={1400} y={975} size={54} hi={CAPTION_HI.map((w) => w.replace(/[^a-z0-9]/g, ""))} />;
};

export const Video: React.FC<VideoProps> = ({ music, sfx, voice, captions }) => {
  return (
    <AbsoluteFill style={{ background: COL.paper }}>
      <Audio
        src={staticFile(`${ASSETS}/music.mp3`)}
        volume={(f) =>
          music * (voice ? duck(f) : 1) * interpolate(f, [0, 10, DURATION - 60, DURATION], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        }
      />
      {voice && <Audio src={staticFile(`${ASSETS}/${voice}`)} />}
      {SCENES.map(({ c: S, from }, i) => {
        const dur = (SCENES[i + 1]?.from ?? DURATION) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <S from={from} dur={dur} />
          </Sequence>
        );
      })}
      {CHAPTERS.map((c, i) => (
        <Sequence key={`ch${i}`} from={c.at - 2} durationInFrames={c.to - c.at + 8}>
          <ChapterTag n={c.n} title={c.title} dur={c.to - c.at + 8} />
        </Sequence>
      ))}
      {[...SCENES.flatMap((s) => s.sfx), ...CHAPTERS.flatMap((c): SfxCue[] => [[c.at - 2, "whoosh", 0.45], [c.at + 2, "stinger", 0.35]])].map(([f, name, v = 1], k) => (
        <Sequence key={`s${k}`} from={Math.max(0, Math.round(f))} layout="none">
          {/* eslint-disable-next-line @remotion/volume-callback -- constant per-effect volume */}
          <Audio src={staticFile(`${ASSETS}/sfx/${name}.wav`)} volume={v * sfx} />
        </Sequence>
      ))}
      <CaptionLayer />
      {captions && null}
    </AbsoluteFill>
  );
};
