// Real Check: the Plan v5 template (owner, 2026-11-09). One belief on trial, real photos as the evidence, a verdict stamp
// as the payoff. A Short is a SPEC (data) + its voice files, not a hand-built scene:
//   studio/src/rNN-<slug>/spec.ts   → export const SPEC: RealSpec = {...}
//   studio/src/rNN-<slug>/voice.ts  → from tools/voiceover.py
//   studio/src/rNN-<slug>/Video.tsx → 10 lines: <RealCheck spec={SPEC} cues={VOICE_CUES} frames={VOICE_FRAMES} mouth={mouthAt} />
// Layout (PIPELINE_V5 §4): everything that matters sits between y 280 and y 1280, because YouTube covers roughly the
// bottom 25–35% of the screen with the title and buttons. Captions at y ~1215. Nothing important below y 1290.
// Spark is a small reactor in a circle (spec.spark = true) at the hook, from just before the verdict, and on the question.
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONT } from "../stickman/fx";
import { addPose, idle, type Pose } from "../stickman/stick";
import { VoiceCaptions } from "./kit";
import { Spark, type Mood } from "./mascot";
import { G, gestureKeys } from "./gestures";
import { wobble } from "./motion";

export type Verdict = "MYTH" | "TRUE" | "HALF TRUE";
export type Photo = {
  file: string; // inside public/<slug>/photos/
  credit: string; // "NASA / public domain", "Jane Doe / CC BY 4.0 / Wikimedia Commons" (also in photos.json + description)
  focus?: [number, number]; // object-position, 0–1 (default centre)
  zoom?: [number, number]; // slow push from → to (default 1 → 1.08)
};
// what the frame shows on a spoken line
export type Show =
  | { photo: number } // one photo, full frame
  | { card: string; sub?: string } // a big text card (a quote, a number); also the fallback when no photo exists
  | { split: [SplitSide, SplitSide] }; // WHAT YOU THINK | WHAT IS REAL
export type SplitSide = { label: string; photo?: number; text?: string };
export type Beat = {
  show?: Show; // keep the previous picture when absent
  tag?: string; // a sticker word on the picture (≤ 3 words), slams on the line's first word
  mood?: Mood; // Spark's mood from this line
  gesture?: keyof typeof G; // Spark's arms from this line
};
export type RealSpec = {
  id: string; // R01
  slug: string; // r01-great-wall (= public/<slug>/)
  n: number; // Real Check #n (series tag)
  bg: string; // background colour (bold, one per Short)
  accent: string; // tag + highlight colour
  overlay: string; // the belief on trial, ≤ 4 words, shown at the hook and on the loop
  photos: Photo[];
  beats: Beat[]; // one per spoken line (pause rows excluded), same order as VOICE_CUES
  verdict: Verdict;
  verdictAt: [number, number]; // [cue, word] the stamp lands on
  spark: boolean; // Arm A true, Arm B false
  hi?: string[]; // caption words to highlight
  music?: number; // music volume (default 0.3)
};
type Cue = { i: number; text: string; startFrame: number; endFrame: number; words: { w: string; s: number; e: number }[] };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const INK = "#1d1b19";
const PAPER = "#fffaf0";
const VERDICT_COL: Record<Verdict, string> = { MYTH: "#e0352b", TRUE: "#1f9d55", "HALF TRUE": "#e08a12" };

// the picture frame (a print on the background)
const FX = 60;
const FY = 300;
const FW = 960;
const FH = 830;

const PhotoView: React.FC<{ slug: string; p: Photo; t: number }> = ({ slug, p, t }) => {
  const [z0, z1] = p.zoom ?? [1, 1.08];
  const z = interpolate(t, [0, 150], [z0, z1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const [fx, fy] = p.focus ?? [0.5, 0.5];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#cfc8ba" }}>
      <Img
        src={staticFile(`${slug}/photos/${p.file}`)}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}
      />
      <div style={{ position: "absolute", left: 14, top: 14, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: FONT.body, fontWeight: 600, fontSize: 22 }}>
        Photo: {p.credit}
      </div>
    </AbsoluteFill>
  );
};

const CardView: React.FC<{ text: string; sub?: string; accent: string }> = ({ text, sub, accent }) => (
  <AbsoluteFill style={{ background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 60 }}>
    <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 92, lineHeight: 1.05, color: INK, textAlign: "center" }}>{text}</div>
    {sub && <div style={{ marginTop: 26, fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: accent, textAlign: "center" }}>{sub}</div>}
  </AbsoluteFill>
);

const SplitView: React.FC<{ spec: RealSpec; sides: [SplitSide, SplitSide]; t: number }> = ({ spec, sides, t }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "row", background: PAPER }}>
    {sides.map((s, i) => {
      const inP = interpolate(t, [i * 10, i * 10 + 14], [0, 1], { ...clamp, easing: eoB });
      return (
        <div key={i} style={{ position: "relative", flex: 1, borderLeft: i ? `8px solid ${INK}` : undefined, overflow: "hidden", opacity: inP, transform: `translateY(${(1 - inP) * 40}px)` }}>
          {s.photo !== undefined && spec.photos[s.photo] ? <PhotoView slug={spec.slug} p={spec.photos[s.photo]} t={t} /> : <CardView text={s.text ?? ""} accent={spec.accent} />}
          <div style={{ position: "absolute", top: 16, left: 0, right: 0, textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 10, background: i ? spec.accent : INK, color: "#fff", fontFamily: FONT.title, fontWeight: 900, fontSize: 40 }}>{s.label}</span>
          </div>
        </div>
      );
    })}
  </AbsoluteFill>
);

const Frame: React.FC<{ spec: RealSpec; show: Show; t: number }> = ({ spec, show, t }) => {
  if ("photo" in show) {
    const p = spec.photos[show.photo];
    return p ? <PhotoView slug={spec.slug} p={p} t={t} /> : <CardView text="PHOTO MISSING" accent={spec.accent} />;
  }
  if ("card" in show) return <CardView text={show.card} sub={show.sub} accent={spec.accent} />;
  return <SplitView spec={spec} sides={show.split} t={t} />;
};

export const RealCheck: React.FC<{ spec: RealSpec; cues: Cue[]; frames: number; mouth: (f: number) => number }> = ({ spec, cues, frames, mouth }) => {
  const f = useCurrentFrame();
  const C = (i: number) => cues[Math.min(i, cues.length - 1)].startFrame;
  const E = (i: number) => cues[Math.min(i, cues.length - 1)].endFrame;
  const [vc, vw] = spec.verdictAt;
  const VERDICT = cues[vc].words[Math.min(vw, cues[vc].words.length - 1)].s;
  const LOOP = frames - 20;

  // which picture is on screen: the last beat with a `show` at or before the current line; the loop returns to the first
  const shows: { at: number; show: Show }[] = [];
  spec.beats.forEach((b, i) => b.show && i < cues.length && shows.push({ at: C(i) - 4, show: b.show }));
  if (!shows.length) shows.push({ at: 0, show: { card: spec.overlay } });
  shows[0].at = 0;
  shows.push({ at: LOOP, show: shows[0].show });
  let cur = 0;
  shows.forEach((s, i) => f >= s.at && (cur = i));
  const prev = Math.max(0, cur - 1);
  const since = f - shows[cur].at;
  const SWAP = 16; // the new picture slides in over the old one: ease-out with a small overshoot
  const swapP = cur === 0 ? 1 : interpolate(since, [0, SWAP], [0, 1], { ...clamp, easing: eoB });

  // the verdict: silence and a slight dim before it, the stamp lands with a hit
  const stampP = interpolate(f, [VERDICT - 2, VERDICT + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const stampEnd = shows.find((s) => s.at > VERDICT + 10)?.at ?? LOOP;
  const stampOn = f >= VERDICT - 2 && f < stampEnd;
  const dimBefore = interpolate(f, [VERDICT - 26, VERDICT - 10, VERDICT, VERDICT + 6], [0, 0.25, 0.25, 0], clamp);
  const shake = f >= VERDICT && f < VERDICT + 14 ? Math.sin((f - VERDICT) * 2.3) * (14 - (f - VERDICT)) * 1.2 : 0;

  // the overlay: the belief at the hook and on the loop
  const overlayO = f < LOOP ? interpolate(f, [0, 2, E(0) + 10, E(0) + 20], [1, 1, 1, 0], clamp) : interpolate(f, [LOOP, LOOP + 6], [0, 1], clamp);
  // the tag sticker of the current line
  const lineIdx = cues.findIndex((c, i) => f >= c.startFrame - 4 && f < (cues[i + 1]?.startFrame ?? frames) - 4);
  const tag = lineIdx >= 0 ? spec.beats[lineIdx]?.tag : undefined;
  const tagAt = lineIdx >= 0 ? C(lineIdx) : 0;

  // Spark in his circle: visible at the hook, from just before the verdict, and to the end
  const sparkO = spec.spark
    ? Math.max(interpolate(f, [0, 1, E(1) + 4, E(1) + 14], [1, 1, 1, 0], clamp), interpolate(f, [VERDICT - 30, VERDICT - 18], [0, 1], clamp))
    : 0;
  const sparkPop = 1 + wobble(f, VERDICT, 0.12, 6);
  const keys = gestureKeys(
    spec.beats.map((b, i): [number, Partial<Pose>, "snap"] => [Math.max(0, C(i) - 3), { ...(b.gesture ? G[b.gesture] : G.rest) }, "snap"]),
  );
  const moodAt = (t: number): Mood => {
    let m: Mood = "curious";
    spec.beats.forEach((b, i) => b.mood && t >= C(i) - 3 && (m = b.mood));
    if (t >= VERDICT - 2 && t < VERDICT + 40) m = "mindblown";
    return m;
  };

  // sounds: whoosh on every picture change, silence + stamp + impact on the verdict
  const sfx: [number, string, number][] = [
    ...shows.slice(1).map((s): [number, string, number] => [s.at, "whoosh", 0.3]),
    [VERDICT - 1, "stamp", 0.8],
    [VERDICT, "impact", 0.6],
  ];
  const duck = (fr: number) => {
    let g = 1;
    for (const c of cues) g = Math.min(g, interpolate(fr, [c.startFrame - 8, c.startFrame, c.endFrame, c.endFrame + 10], [1, 0.4, 0.4, 1], clamp));
    // the music drops out for the half second before the verdict
    g *= interpolate(fr, [VERDICT - 26, VERDICT - 16, VERDICT - 1, VERDICT], [1, 0, 0, 1], clamp);
    return g;
  };
  const musicVol = spec.music ?? 0.3;

  const frameTilt = -1.2 + Math.sin(f / 90) * 0.3;
  return (
    <AbsoluteFill style={{ background: spec.bg }}>
      <Audio src={staticFile(`${spec.slug}/music.mp3`)} volume={(fr) => musicVol * duck(fr) * interpolate(fr, [0, 8, frames - 30, frames], [0, 1, 1, 0], clamp)} />
      <Audio src={staticFile(`${spec.slug}/voice.wav`)} />
      {sfx.map(([at, name, v], i) => (
        <Sequence key={i} from={Math.max(0, at)} layout="none">
          {/* eslint-disable-next-line @remotion/volume-callback -- constant per-effect volume */}
          <Audio src={staticFile(`${spec.slug}/sfx/${name}.wav`)} volume={v} />
        </Sequence>
      ))}
      {/* soft light from the upper left */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 25% 15%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)" }} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
        {/* the print */}
        <div style={{ position: "absolute", left: FX, top: FY, width: FW, height: FH, transform: `rotate(${frameTilt}deg)`, background: "#fff", padding: 14, borderRadius: 18, boxShadow: "0 18px 40px rgba(0,0,0,0.28)" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 10 }}>
            {cur > 0 && swapP < 1 && <Frame spec={spec} show={shows[prev].show} t={f - shows[prev].at} />}
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - swapP) * 105}%)` }}>
              <Frame spec={spec} show={shows[cur].show} t={since} />
            </div>
            <AbsoluteFill style={{ background: "#000", opacity: dimBefore }} />
            {stampOn && (
              <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    transform: `scale(${2.4 - 1.4 * stampP}) rotate(-12deg)`,
                    opacity: interpolate(stampP, [0, 0.3], [0, 1], clamp),
                    border: `14px solid ${VERDICT_COL[spec.verdict]}`,
                    borderRadius: 26,
                    padding: "10px 40px",
                    color: VERDICT_COL[spec.verdict],
                    background: "rgba(255,255,255,0.82)",
                    fontFamily: FONT.title,
                    fontWeight: 900,
                    fontSize: spec.verdict === "HALF TRUE" ? 120 : 170,
                    letterSpacing: 6,
                  }}
                >
                  {spec.verdict}
                </div>
              </AbsoluteFill>
            )}
          </div>
          {/* series tab on the print */}
          <div style={{ position: "absolute", left: 30, top: -34, padding: "4px 16px", borderRadius: 10, background: INK, color: "#fff", fontFamily: FONT.title, fontWeight: 900, fontSize: 30, letterSpacing: 2 }}>
            REAL CHECK #{spec.n}
          </div>
          {tag && f < VERDICT - 26 && (
            <div
              style={{
                position: "absolute",
                right: -10,
                top: 40,
                transform: `rotate(6deg) scale(${interpolate(f - tagAt, [0, 8], [0.3, 1], { ...clamp, easing: eoB })})`,
                padding: "10px 22px",
                borderRadius: 14,
                background: spec.accent,
                color: "#fff",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 54,
                boxShadow: "0 8px 0 rgba(0,0,0,0.25)",
              }}
            >
              {tag}
            </div>
          )}
        </div>
        {/* Spark's circle, bottom left of the print (the right edge is under YouTube's buttons) */}
        {sparkO > 0.01 && (
          <div style={{ position: "absolute", left: 36, top: 840, width: 300, height: 300, opacity: sparkO, transform: `scale(${sparkO * sparkPop})`, transformOrigin: "50% 50%" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", boxShadow: "0 10px 26px rgba(0,0,0,0.3)" }} />
            <svg width={300} height={300} viewBox="0 0 280 280" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <clipPath id="sparkCircle">
                  <circle cx={140} cy={140} r={128} />
                </clipPath>
              </defs>
              <circle cx={140} cy={140} r={128} fill={spec.bg} opacity={0.35} />
              <g clipPath="url(#sparkCircle)">
                <Spark
                  f={f}
                  trails={false}
                  scale={2.2}
                  facing={1}
                  base={{ x: 150, y: 385 }}
                  keys={keys}
                  mod={(t, p) => ({ ...addPose(p, idle(t, 4)), x: 150, y: 385 })}
                  talk={mouth}
                  mood={moodAt}
                  bulb={(t) => (t >= VERDICT ? interpolate(t, [VERDICT, VERDICT + 3], [0.5, 1], clamp) : 0)}
                />
              </g>
            </svg>
          </div>
        )}
      </AbsoluteFill>
      {/* the belief on trial */}
      {overlayO > 0.01 && (
        <div style={{ position: "absolute", left: 30, right: 30, top: 120, textAlign: "center", opacity: overlayO, transform: `scale(${1 + wobble(f, LOOP, 0.05, 6)})` }}>
          <span style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 104, lineHeight: 1, color: INK, WebkitTextStroke: `16px #fff`, paintOrder: "stroke fill" }}>{spec.overlay}</span>
        </div>
      )}
      <VoiceCaptions f={f} y={1232} size={54} x={30} w={1020} cues={cues} hi={spec.hi ?? []} />
      {/* a fade so the loop seam is soft */}
      <AbsoluteFill style={{ background: spec.bg, opacity: interpolate(f, [LOOP - 4, LOOP, LOOP + 4], [0, 0.5, 0], clamp) }} />
    </AbsoluteFill>
  );
};

/** Composition length helper: the voice sets the length. */
export const realDuration = (frames: number) => frames;
export const _eio = eio;
