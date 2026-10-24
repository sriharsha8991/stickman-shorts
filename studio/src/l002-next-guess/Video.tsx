import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, ease } from "../stickman/fx";
import type { SfxCue } from "./sfx";
import { TIMELINE } from "./timeline";
import { VOICE_CUES, VOICE_FRAMES } from "./voice";
import { VoiceCaptions } from "../shared/kit";
import { C, CE, CREAM, GOLD, INK, MINT, PURPLE, PURPLE_D } from "./world";
import { S01Hook, S01_SFX } from "./S01Hook";
import { S02Keyboard, S02_SFX } from "./S02Keyboard";
import { S03Tokens, S03_SFX } from "./S03Tokens";
import { S04Loop, S04_SFX } from "./S04Loop";
import { S05Attention, S05_SFX } from "./S05Attention";
import { S06Dial, S06_SFX } from "./S06Dial";
import { S07Sure, S07_SFX } from "./S07Sure";
import { S08Recap, S08_SFX } from "./S08Recap";

// L002 · ChatGPT Doesn't Know What It's Going to Say Next (long-form, 16:9, ~5:10)
const ASSETS = "l002-next-guess";

export type SceneProps = { from: number; dur: number };
type Scene = { c: React.FC<SceneProps>; from: number; sfx: SfxCue[] };

// One scene per chapter; each starts on its chapter's first cue. SFX frames are GLOBAL.
export const SCENES: Scene[] = [
  { c: S01Hook, from: 0, sfx: S01_SFX },
  { c: S02Keyboard, from: C(8), sfx: S02_SFX },
  { c: S03Tokens, from: C(22), sfx: S03_SFX },
  { c: S04Loop, from: C(37), sfx: S04_SFX },
  { c: S05Attention, from: C(54), sfx: S05_SFX },
  { c: S06Dial, from: C(72), sfx: S06_SFX },
  { c: S07Sure, from: C(84), sfx: S07_SFX },
  { c: S08Recap, from: C(91), sfx: S08_SFX },
];

// Chapter cards sit on each chapter's 1-second pause.
export const CHAPTERS: { n: string; title: string; at: number; to: number }[] = [
  { n: "1", title: "Autocomplete, but huge", at: CE(7), to: C(8) },
  { n: "2", title: "It reads chunks", at: CE(21), to: C(22) },
  { n: "3", title: "The next-token loop", at: CE(36), to: C(37) },
  { n: "4", title: "Attention", at: CE(53), to: C(54) },
  { n: "5", title: "The temperature dial", at: CE(71), to: C(72) },
  { n: "6", title: "Sure, and wrong", at: CE(83), to: C(84) },
  { n: "✓", title: "One sentence", at: CE(90), to: C(91) },
];

export const DURATION = VOICE_FRAMES;
export type VideoProps = { music: number; sfx: number; voice: string; captions: boolean };

const duck = (f: number) => {
  let g = 1;
  for (const c of TIMELINE.cues) {
    if (f < c.startFrame - 10) break;
    g = Math.min(g, interpolate(f, [c.startFrame - 8, c.startFrame, c.endFrame, c.endFrame + 10], [1, 0.4, 0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return g;
};

// typewriter chapter card: a sheet of paper drops in, the title types out, the bell dings
const ChapterTag: React.FC<{ n: string; title: string; dur: number }> = ({ n, title, dur }) => {
  const f = useCurrentFrame();
  const inK = ease(f, 0, 7);
  const out = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chars = Math.floor(interpolate(f, [4, 4 + title.length * 0.8], [0, title.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: PURPLE_D, opacity: 0.97 * inK }} />
      <div
        style={{
          position: "absolute",
          left: 360,
          width: 1200,
          top: 230,
          height: 520,
          background: CREAM,
          border: `8px solid ${INK}`,
          borderRadius: 18,
          transform: `translateY(${(1 - inK) * -700}px) rotate(${(1 - inK) * -6}deg)`,
          boxShadow: "0 24px 0 rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: FONT.title, fontWeight: 800, fontSize: 60, letterSpacing: 14, color: PURPLE }}>
          {n === "✓" ? "WRAP-UP" : `CHAPTER ${n}`}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 116, color: INK, textTransform: "uppercase", lineHeight: 1 }}>
          {title.slice(0, chars)}
          <span style={{ color: PURPLE, opacity: Math.floor(f / 4) % 2 ? 1 : 0.2 }}>▌</span>
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, bottom: 70, height: 14, borderRadius: 7, background: MINT, transform: `scaleX(${ease(f, 6, 22)})`, transformOrigin: "left" }} />
      </div>
      <div style={{ position: "absolute", right: 300, top: 180, width: 70, height: 70, borderRadius: 35, background: GOLD, border: `6px solid ${INK}`, transform: `scale(${interpolate(f, [14, 18, 24], [0, 1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})` }} />
    </AbsoluteFill>
  );
};

export const CAPTION_HI = [
  "guess.", "picks,", "check.", "database.", "plans", "fun", "one", "sentence.", "better", "keyboard", "late", "next", "trick.", "skyscraper", "mountain",
  "training:", "predict", "token.", "token?", "surprise.", "chunks", "tokens.", "four", "characters.", "three", "quarters", "hundred", "seventy-five",
  "number.", "numbers.", "strawberry?", "str,", "aw,", "berry.", "writes.", "scores", "mat", "moon", "picks", "sticks", "again.", "faster", "never",
  "piece,", "locked", "matter?", "seventeen,", "attention", "trophy.", "trophy", "ditched", "half", "eight", "translation", "blueprint.", "transformer.",
  "temperature", "low,", "safe.", "tallest", "up,", "zero", "two.", "jazz", "brainstorming.", "personality.", "sure", "wrong?", "likely,", "check.",
  "guessing", "sure.", "context", "steering", "options,", "facts", "magic.", "prediction.",
];
const CaptionLayer: React.FC = () => {
  const f = useCurrentFrame();
  return <VoiceCaptions f={f} cues={VOICE_CUES} x={260} w={1400} y={975} size={54} hi={CAPTION_HI.map((w) => w.replace(/[^a-z0-9-]/g, ""))} />;
};

export const Video: React.FC<VideoProps> = ({ music, sfx, voice, captions }) => {
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Audio
        src={staticFile(`${ASSETS}/music.mp3`)}
        volume={(f) => music * (voice ? duck(f) : 1) * interpolate(f, [0, 10, DURATION - 60, DURATION], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
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
      {[...SCENES.flatMap((s) => s.sfx), ...CHAPTERS.flatMap((c): SfxCue[] => [[c.at - 2, "whoosh", 0.45], [c.at + 14, "ding", 0.5]])].map(([f, name, v = 1], k) => (
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
