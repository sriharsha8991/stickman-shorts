import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT, ease } from "../stickman/fx";
import type { SfxCue } from "./sfx";
import { TIMELINE } from "./timeline";
import { VOICE_CUES, VOICE_FRAMES } from "./voice";
import { VoiceCaptions } from "../shared/kit";
import { AMBER, C, CE, CHAR, CHAR2, CORAL, MINT, PAPER } from "./world";
import { S01Hook, S01_SFX } from "./S01Hook";
import { S02Checkout, S02_SFX } from "./S02Checkout";
import { S03Pain, S03_SFX } from "./S03Pain";
import { S04Slices, S04_SFX } from "./S04Slices";
import { S05Tower, S05_SFX } from "./S05Tower";
import { S06Rules, S06_SFX } from "./S06Rules";
import { S07Check, S07_SFX } from "./S07Check";

// L003 · Why 'Pay in 4' Feels Free (It Isn't) (long-form, 16:9, ~4:31)
const ASSETS = "l003-pay-in-four";

export type SceneProps = { from: number; dur: number };
type Scene = { c: React.FC<SceneProps>; from: number; sfx: SfxCue[] };

// One scene per chapter; each starts on its chapter's first cue. SFX frames are GLOBAL.
export const SCENES: Scene[] = [
  { c: S01Hook, from: 0, sfx: S01_SFX },
  { c: S02Checkout, from: C(9), sfx: S02_SFX },
  { c: S03Pain, from: C(21), sfx: S03_SFX },
  { c: S04Slices, from: C(40), sfx: S04_SFX },
  { c: S05Tower, from: C(52), sfx: S05_SFX },
  { c: S06Rules, from: C(66), sfx: S06_SFX },
  { c: S07Check, from: C(73), sfx: S07_SFX },
];

// Chapter cards sit on each chapter's 1-second pause.
export const CHAPTERS: { n: string; title: string; at: number; to: number }[] = [
  { n: "1", title: "The checkout trick", at: CE(8), to: C(9) },
  { n: "2", title: "The pain meter", at: CE(20), to: C(21) },
  { n: "3", title: "Four small numbers", at: CE(39), to: C(40) },
  { n: "4", title: "The stacking tower", at: CE(51), to: C(52) },
  { n: "5", title: "The rules catch up", at: CE(65), to: C(66) },
  { n: "✓", title: "The 10-second check", at: CE(72), to: C(73) },
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

// chapter card: a neon price tag swings down on a string over a charcoal wipe; the chapter title is the "price"
const ChapterTag: React.FC<{ n: string; title: string; dur: number }> = ({ n, title, dur }) => {
  const f = useCurrentFrame();
  const inK = ease(f, 0, 8);
  const out = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const swing = Math.sin(f / 5) * 7 * Math.exp(-f / 14);
  const drop = (1 - inK) * -900;
  const glow = 0.6 + 0.4 * Math.sin(f / 2.5);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: CHAR2, opacity: 0.96, clipPath: `circle(${inK * 120}% at 50% 0%)` }} />
      <div style={{ position: "absolute", left: 958, top: 0, width: 4, height: Math.max(0, 260 + drop), background: "#8a909c" }} />
      <div
        style={{
          position: "absolute",
          left: 330,
          width: 1260,
          top: 230,
          height: 480,
          transformOrigin: "50% -230px",
          transform: `translateY(${drop}px) rotate(${swing}deg)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: CHAR,
            border: `8px solid ${MINT}`,
            borderRadius: 40,
            boxShadow: `0 0 ${50 * glow}px ${MINT}, inset 0 0 ${30 * glow}px rgba(95,242,195,0.4)`,
          }}
        />
        <div style={{ position: "absolute", left: 600, top: 26, width: 60, height: 60, borderRadius: 30, background: CHAR2, border: `6px solid ${MINT}` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: FONT.title, fontWeight: 800, fontSize: 56, letterSpacing: 14, color: CORAL }}>
          {n === "✓" ? "WRAP-UP" : `CHAPTER ${n}`}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 104, color: PAPER, textTransform: "uppercase", lineHeight: 1, textShadow: `0 0 ${24 * glow}px ${MINT}` }}>
          {title}
        </div>
        <div style={{ position: "absolute", left: 120, right: 120, bottom: 70, height: 12, borderRadius: 6, background: AMBER, transform: `scaleX(${ease(f, 8, 24)})`, transformOrigin: "left" }} />
      </div>
    </AbsoluteFill>
  );
};

export const CAPTION_HI = [
  "Stop.", "quarter", "smaller.", "smaller?", "free.", "feeling", "trick", "stacking", "ten-second", "midnight.", "thousand", "wince.", "button",
  "Zero", "melts", "Six", "price.", "head.", "pain", "meter", "1998,", "name.", "paying.", "stings", "job.", "regulate", "brake",
  "Cash", "glued", "loosen", "credit", "weaken", "UPI", "quiet.", "further.", "slices", "sneaky.", "number", "big", "small", "Different", "later,",
  "slices,", "first", "illusion.", "sliced.", "everyone", "CFPB,", "five", "sixty-three", "percent", "same", "third", "stack.", "tower.", "tower?",
  "Britain,", "rules.", "regulated.", "risks,", "afford,", "support", "own.", "check.", "today?", "open?", "no,", "feel", "pain,",
  "education,", "hidden",
];
const CaptionLayer: React.FC = () => {
  const f = useCurrentFrame();
  return <VoiceCaptions f={f} cues={VOICE_CUES} x={260} w={1400} y={975} size={54} hi={CAPTION_HI.map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />;
};

// the SEBI/RBI line: on screen for the whole video (small, bottom-left corner, under the captions)
const Disclaimer: React.FC = () => (
  <div style={{ position: "absolute", left: 40, bottom: 14, fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: "#ffffff", background: "rgba(18,20,24,0.72)", padding: "3px 12px", borderRadius: 8 }}>
    Education, not financial advice
  </div>
);

export const Video: React.FC<VideoProps> = ({ music, sfx, voice, captions }) => {
  return (
    <AbsoluteFill style={{ background: CHAR }}>
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
      {[...SCENES.flatMap((s) => s.sfx), ...CHAPTERS.flatMap((c): SfxCue[] => [[c.at - 2, "swish", 0.45], [c.at + 10, "kaching", 0.45]])].map(([f, name, v = 1], k) => (
        <Sequence key={`s${k}`} from={Math.max(0, Math.round(f))} layout="none">
          {/* eslint-disable-next-line @remotion/volume-callback -- constant per-effect volume */}
          <Audio src={staticFile(`${ASSETS}/sfx/${name}.wav`)} volume={v * sfx} />
        </Sequence>
      ))}
      <Disclaimer />
      <CaptionLayer />
      {captions && null}
    </AbsoluteFill>
  );
};
