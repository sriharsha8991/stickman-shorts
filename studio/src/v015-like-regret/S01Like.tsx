import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V015 · The Like button's builder regrets it. Retention v2 cut (~28.5 s), Mini Origin Doc, power-up "dash"
// (H14 before it used beam). Storybook documentary: parchment page, ink frame, crimson + navy + gold.
// Frame 0: a giant gold thumbs-up; a small grey BUILDER figure holds a phone with a padlock; Spark dashes in from
// the left. 2007 year card → all-nighter clock → AWESOME button → little bits of positivity fly out → pings at
// random times → YOU checking, a crowd of thumbs chanting MORE → quote card "bright dings of pseudo-pleasure"
// (Guardian 2017) → BLOCKED list → ASK FIRST sticky note → "Because the next like…" thumb grows → frame 0.
// Source: Paul Lewis, "'Our minds can be hijacked'", The Guardian, 6 Oct 2017.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 200;
const PAPER = "#f3e6c8";
const PAPER2 = "#e6d3a6";
const CRIMSON = "#c2362b";
const NAVY = "#23395b";
const GOLD = "#e8a91c";
const INK = COL.ink;
const PEAK = POWER_PEAK.dash; // 8

const T = {
  stop: W(0, 2),
  likes: W(0, 4),
  guy: C(1),
  built: W(1, 3),
  locked: W(1, 7),
  phone: W(1, 10),
  why: C(2),
  fear: W(2, 3),
  feature: W(2, 6),
  y2007: C(3),
  night: W(3, 4),
  awesome: W(3, 6),
  button: W(3, 7),
  idea: W(4, 1),
  send: W(4, 2),
  positivity: W(4, 6),
  but: C(5),
  arrive: W(5, 2),
  unpred: W(5, 3),
  so: C(6),
  keep: W(6, 2),
  checking: W(6, 3),
  called: W(7, 1),
  bright: W(7, 3),
  pseudo: W(7, 6),
  blocked: W(8, 1),
  reddit: W(8, 2),
  quit: W(8, 3),
  locked2: W(8, 5),
  before: W(9, 1),
  ask: W(9, 4),
  hoping: W(9, 8),
  because: C(10),
  next: W(10, 2),
  like: W(10, 3),
};
const LOOP = VOICE_FRAMES - 16;

// --- background: storybook page ----------------------------------------------------------------------
const Page: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="v15vig" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor={PAPER} />
          <stop offset="100%" stopColor={PAPER2} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#v15vig)" />
      {/* paper fibres */}
      {Array.from({ length: 40 }, (_, i) => (
        <line
          key={i}
          x1={random(`fx${i}`) * 1080}
          y1={random(`fy${i}`) * 1920}
          x2={random(`fx${i}`) * 1080 + 40 + random(`fl${i}`) * 60}
          y2={random(`fy${i}`) * 1920 + 6}
          stroke="#b89a5e"
          strokeWidth={2}
          opacity={0.25}
        />
      ))}
      {/* ink page frame with corner flourishes */}
      <rect x={40} y={210} width={1000} height={1580} fill="none" stroke={INK} strokeWidth={5} opacity={0.75} />
      <rect x={56} y={226} width={968} height={1548} fill="none" stroke={INK} strokeWidth={2} opacity={0.5} />
      {[
        [56, 226],
        [1024, 226],
        [56, 1774],
        [1024, 1774],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={12} fill={CRIMSON} stroke={INK} strokeWidth={3} />
      ))}
      {/* brush-stroke ground */}
      <path d={`M 60 ${GROUND + 4} Q 300 ${GROUND - 6} 540 ${GROUND + 2} T 1020 ${GROUND}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d={`M 120 ${GROUND + 26} Q 400 ${GROUND + 18} 700 ${GROUND + 28}`} fill="none" stroke={INK} strokeWidth={3} opacity={0.4} />
      {/* drifting ink motes */}
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={`m${i}`} cx={(random(`mx${i}`) * 1000 + f * (0.4 + random(`ms${i}`))) % 1000 + 40} cy={300 + random(`my${i}`) * 900} r={3} fill={INK} opacity={0.18} />
      ))}
    </svg>
  </AbsoluteFill>
);

// --- generic thumbs-up (hand-drawn, no logo) --------------------------------------------------------------
const Thumb: React.FC<{ x: number; y: number; s: number; color?: string; r?: number }> = ({ x, y, s, color = GOLD, r = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-95} y={-10} width={38} height={120} rx={8} fill={NAVY} {...K} strokeWidth={6} />
    <path d="M -55 -6 L -20 -6 L -6 -86 Q -2 -112 22 -104 Q 40 -96 34 -64 L 26 -14 L 78 -14 Q 100 -12 98 12 L 92 96 Q 88 116 66 116 L -55 116 Z" fill={color} {...K} strokeWidth={6} />
    {[22, 52, 82].map((yy) => (
      <line key={yy} x1={40} y1={yy} x2={94} y2={yy} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    ))}
  </g>
);

const BigPhone: React.FC<{ x: number; y: number; s?: number; r?: number; screen?: string; children?: React.ReactNode }> = ({ x, y, s = 1, r = 0, screen = "#9fd3f5", children }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-80} y={-150} width={160} height={300} rx={26} fill="#222" {...K} strokeWidth={7} />
    <rect x={-66} y={-128} width={132} height={250} rx={12} fill={screen} />
    <circle cy={136} r={7} fill="#555" />
    {children}
  </g>
);

const Padlock: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) =>
  s > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -34 -10 L -34 -44 Q -34 -78 0 -78 Q 34 -78 34 -44 L 34 -10" fill="none" stroke={INK} strokeWidth={14} />
      <path d="M -34 -10 L -34 -44 Q -34 -78 0 -78 Q 34 -78 34 -44 L 34 -10" fill="none" stroke="#c9c9c9" strokeWidth={7} />
      <rect x={-52} y={-14} width={104} height={84} rx={12} fill={CRIMSON} {...K} strokeWidth={6} />
      <circle cy={18} r={10} fill={INK} />
      <rect x={-4} y={20} width={8} height={24} fill={INK} />
    </g>
  ) : null;

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "whoosh_long", 0.6],
  [PEAK, "impact", 0.75],
  [T.likes, "ding", 0.35],
  [T.locked, "chains", 0.45],
  [T.locked + 6, "clink", 0.5],
  [T.fear, "boing", 0.3],
  [T.y2007, "page", 0.5],
  [T.night, "tick", 0.35],
  [T.awesome, "pop", 0.45],
  [T.button, "ding", 0.4],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.send + i * 7, "pop", 0.2]),
  [T.unpred, "ding", 0.35],
  [T.unpred + 13, "ding", 0.25],
  [T.unpred + 21, "ding", 0.3],
  [T.keep, "swish", 0.35],
  [T.checking, "tick", 0.35],
  [T.called - 12, "riser", 0.45],
  [T.bright, "stinger", 0.55],
  [T.pseudo, "freeze", 0.35],
  [T.reddit, "stamp", 0.5],
  [T.quit, "stamp", 0.5],
  [T.locked2, "stamp", 0.5],
  [T.ask, "slam", 0.45],
  [T.hoping, "gold", 0.45],
  [T.next, "swirl", 0.4],
  [LOOP - 6, "whoosh", 0.45],
];

export const S01Like: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // dash in from off-screen left
  const dashX = interpolate(f, [0, PEAK], [-420, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

  // frame-0 tableau (thumb + builder + locked phone): until "Two thousand seven", and back for the loop
  const openK = Math.max(win(f, -10, T.y2007, 6), interpolate(f, [T.because - 6, T.because + 2], [0, 1], clamp));
  const thumbS = f < T.because ? 1.6 + 0.04 * Math.sin(f / 9) + interpolate(f, [T.why, T.fear + 10], [0, 0.35], clamp) : interpolate(f, [T.because, T.like + 10, LOOP], [1.0, 1.7, 1.6], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const lockS = f < T.because ? (f < 1 ? 1 : interpolate(f, [T.locked - 4, T.locked + 2, T.locked + 6], [1, 1.35, 1], clamp)) : 1;

  // 2007 / all-nighter / AWESOME button
  const yearK = win(f, T.y2007 - 2, T.idea, 6);
  const clockSpin = interpolate(f, [T.night - 6, T.awesome], [0, 7 * 30], clamp); // 11 pm → 6 am
  const btnK = interpolate(f, [T.awesome - 4, T.awesome + 4], [0, 1], clamp);
  // positivity: little thumbs fly to phones
  const posK = win(f, T.idea - 2, T.but, 6);
  // unpredictable pings
  const pingK = win(f, T.but - 2, T.so, 6);
  // YOU checking + crowd of thumbs
  const youK = win(f, T.so - 2, T.called - 2, 6);
  // quote card
  const quoteK = win(f, T.called - 4, T.blocked - 2, 6);
  // blocked list
  const listK = win(f, T.blocked - 2, T.before - 2, 6);
  // ask first
  const askK = win(f, T.before - 2, T.because - 2, 6);

  const overlayK = Math.max(interpolate(f, [T.why - 8, T.why], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.pointSide, lean: 14 }],
    [PEAK - 2, { ...G.pointSide, lean: 18 }],
    [PEAK, { ...G.pointSide, lean: -4 }, "snap"],
    [T.stop, G.leanIn, "snap"],
    [T.likes, G.pointSide, "snap"],
    [T.built, G.present, "snap"],
    [T.locked, G.recoil, "snap"],
    [T.why, G.thinkChin, "snap"],
    [T.fear, G.shrugBig, "snap"],
    [T.y2007, G.pointUp, "snap"],
    [T.night, G.count1, "snap"],
    [T.awesome, G.presentBoth, "snap"],
    [T.idea, G.beckon, "snap"],
    [T.positivity, G.celebrate, "snap"],
    [T.but, G.stop, "snap"],
    [T.unpred, G.doublePoint, "snap"],
    [T.keep, G.pointDown, "snap"],
    [T.checking, G.facepalm, "snap"],
    [T.called, G.leanIn, "snap"],
    [T.pseudo, G.mindBlown, "snap"],
    [T.blocked, G.count1, "snap"],
    [T.quit, G.count2, "snap"],
    [T.locked2, G.armsCrossed, "snap"],
    [T.before, G.whisper, "snap"],
    [T.ask, G.pointUp, "snap"],
    [T.hoping, G.thinkChin, "snap"],
    [T.because, G.pointSide, "snap"],
    [LOOP, { ...G.pointSide, lean: 14 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.guy ? "smug" : t < T.locked ? "curious" : t < T.why ? "shock" : t < T.y2007 ? "thinking" : t < T.idea ? "excited" : t < T.but ? "happy" : t < T.so ? "worried" : t < T.called ? "skeptical" : t < T.blocked ? "mindblown" : t < T.before ? "determined" : t < T.because ? "wink" : "smug";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.pseudo, 30), bulbPulse(t, T.hoping, 24) * 0.8);
  const z = punch(f, [T.locked, T.awesome, T.unpred, T.bright, T.ask], 0.035);

  return (
    <Stage
      bg={<Page f={f} />}
      hits={[...powerHits("dash", 0), T.locked, T.bright]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="dash" f={f} at={0} x={SX} y={GROUND} h={185 * SS} dir={1} layer="back" />

          {/* frame-0 tableau: giant thumb, builder, padlocked phone */}
          {openK > 0.01 && (
            <g opacity={openK}>
              <Thumb x={520} y={880} s={thumbS} r={-6 + 3 * Math.sin(f / 14)} />
              {f >= T.because && thumbS > 1.3 && <Burst x={520} y={840} at={T.like} f={f} size={360} color={GOLD} />}
              <Actor
                f={f}
                color="#9a9a9a"
                scale={1.3}
                label="BUILDER"
                face={f > T.locked && f < T.y2007 ? "angry" : "happy"}
                base={{ x: 890, y: GROUND - 92.5 * 1.3 }}
                facing={-1}
                keys={[
                  { f: 0, p: { ra1: 120, ra2: 40, la1: -30, la2: 20 } },
                  { f: T.locked, p: { ra1: 125, ra2: 50, la1: -30, la2: 20 } },
                  { f: T.fear, p: { ra1: 125, ra2: 50, la1: -40, la2: 20, lean: 10 } },
                ]}
                mod={(t, q) => addPose(q, idle(t, 9))}
              />
              <BigPhone x={800} y={GROUND - 300} s={0.5} r={-8}>
                <Padlock x={0} y={10} s={lockS} />
              </BigPhone>
              {f >= T.locked - 2 && f < T.y2007 && (
                <g transform={`translate(770 ${GROUND - 470}) scale(${pop(f, T.locked)}) rotate(-4)`}>
                  <rect x={-150} y={-30} width={300} height={56} rx={10} fill={CRIMSON} {...K} strokeWidth={5} />
                  <text y={10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#fff" letterSpacing={1}>
                    PARENTAL CONTROLS: ON
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 2007 · all-nighter · AWESOME button */}
          {yearK > 0.01 && (
            <g opacity={yearK}>
              {/* night window */}
              <g transform={`translate(690 800) scale(${pop(f, T.y2007 - 2)})`}>
                <rect x={-230} y={-170} width={460} height={300} rx={12} fill={NAVY} {...K} strokeWidth={8} />
                <line x1={0} y1={-170} x2={0} y2={130} stroke={INK} strokeWidth={6} />
                <line x1={-230} y1={-20} x2={230} y2={-20} stroke={INK} strokeWidth={6} />
                <circle cx={-120} cy={-95} r={40} fill="#f6efd0" />
                <circle cx={-104} cy={-106} r={36} fill={NAVY} />
                {Array.from({ length: 7 }, (_, i) => (
                  <circle key={i} cx={-200 + random(`st${i}`) * 400} cy={-150 + random(`sy${i}`) * 260} r={4} fill="#fff" opacity={0.5 + 0.5 * Math.sin(f / 5 + i)} />
                ))}
              </g>
              {/* clock */}
              {f >= T.night - 6 && (
                <g transform={`translate(860 1110) scale(${pop(f, T.night - 6)})`}>
                  <circle r={78} fill="#fff" {...K} strokeWidth={7} />
                  {Array.from({ length: 12 }, (_, i) => (
                    <line key={i} x1={0} y1={-62} x2={0} y2={-52} stroke={INK} strokeWidth={4} transform={`rotate(${i * 30})`} />
                  ))}
                  <line x1={0} y1={0} x2={0} y2={-40} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${330 + clockSpin})`} />
                  <line x1={0} y1={0} x2={0} y2={-58} stroke={CRIMSON} strokeWidth={5} strokeLinecap="round" transform={`rotate(${clockSpin * 12})`} />
                  <text y={120} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={INK}>
                    {clockSpin > 150 ? "6 AM" : "11 PM"}
                  </text>
                </g>
              )}
              {/* awesome button */}
              {btnK > 0.01 && (
                <g transform={`translate(560 1120) scale(${pop(f, T.awesome - 4)})`}>
                  <ellipse cy={22} rx={150} ry={40} fill="#7a1d16" {...K} strokeWidth={6} />
                  <ellipse cy={interpolate(f, [T.button, T.button + 4, T.button + 10], [0, 14, 0], clamp)} rx={150} ry={40} fill={CRIMSON} {...K} strokeWidth={6} />
                  <text y={-62} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={CRIMSON} stroke={INK} strokeWidth={3} paintOrder="stroke">
                    “AWESOME”
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the idea: little bits of positivity fly to phones */}
          {posK > 0.01 && (
            <g opacity={posK}>
              <g transform={`translate(600 1150)`}>
                <ellipse cy={22} rx={130} ry={34} fill="#7a1d16" {...K} strokeWidth={6} />
                <ellipse cy={Math.abs(Math.sin(f / 4)) * 10} rx={130} ry={34} fill={CRIMSON} {...K} strokeWidth={6} />
              </g>
              {[
                [430, 720],
                [640, 660],
                [860, 740],
              ].map(([x, y], i) => (
                <BigPhone key={i} x={x} y={y} s={0.55 * pop(f, T.idea + i * 4)} r={(i - 1) * 6} />
              ))}
              {Array.from({ length: 9 }, (_, i) => {
                const st = T.send + i * 6;
                const p = interpolate(f, [st, st + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
                if (p <= 0 || p >= 1) return null;
                const tx = [430, 640, 860][i % 3];
                const ty = [720, 660, 740][i % 3];
                const x = 600 + (tx - 600) * p;
                const y = 1120 + (ty - 1120) * p - Math.sin(p * Math.PI) * 160;
                return <Thumb key={i} x={x} y={y} s={0.32} r={(p - 0.5) * 40} />;
              })}
            </g>
          )}

          {/* likes arrive unpredictably: random pings */}
          {pingK > 0.01 && (
            <g opacity={pingK}>
              <BigPhone x={640} y={900} s={1.25} screen="#fdf6e3">
                {[0, 13, 21, 37, 44].map((d, i) => {
                  const at = T.unpred + d;
                  return f >= at ? (
                    <g key={i} transform={`translate(${-30 + random(`px${i}`) * 60} ${-90 + i * 44}) scale(${pop(f, at) * 0.8})`}>
                      <rect x={-56} y={-18} width={112} height={36} rx={18} fill={CRIMSON} {...K} strokeWidth={3} />
                      <text y={9} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill="#fff">
                        +{[1, 3, 1, 7, 2][i]} LIKE{[1, 3, 1, 7, 2][i] > 1 ? "S" : ""}
                      </text>
                    </g>
                  ) : null;
                })}
              </BigPhone>
              {/* timeline with irregular ticks */}
              <line x1={360} y1={1210} x2={960} y2={1210} stroke={INK} strokeWidth={5} />
              {[0.05, 0.12, 0.44, 0.51, 0.9].map((p, i) => (
                <g key={i} transform={`translate(${360 + p * 600} 1210) scale(${pop(f, T.arrive + i * 5)})`}>
                  <circle r={14} fill={GOLD} {...K} strokeWidth={4} />
                </g>
              ))}
              <text x={660} y={1260} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={INK}>
                WHEN? NO PATTERN.
              </text>
            </g>
          )}

          {/* YOU keep checking + a crowd of thumbs demanding more */}
          {youK > 0.01 && (
            <g opacity={youK}>
              {Array.from({ length: 7 }, (_, i) => {
                const a = -Math.PI * (0.1 + (i / 6) * 0.8);
                const x = 680 + Math.cos(a) * 300;
                const y = 1000 + Math.sin(a) * 300;
                const k = pop(f, T.so + i * 3);
                return (
                  <g key={i}>
                    <Thumb x={x} y={y + Math.sin(f / 3 + i) * 8} s={0.42 * k} r={(i - 3) * 8} />
                    {f >= T.keep + i * 2 && (
                      <text x={x} y={y - 70} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill={CRIMSON} stroke={INK} strokeWidth={2} paintOrder="stroke">
                        MORE!
                      </text>
                    )}
                  </g>
                );
              })}
              <Actor
                f={f}
                color={COL.orange}
                scale={1.45}
                label="YOU"
                face="eyes"
                base={{ x: 680, y: GROUND - 92.5 * 1.45 }}
                facing={-1}
                keys={[
                  { f: 0, p: { ra1: 40, ra2: 100, la1: -20, la2: 10, head: 14 } },
                  { f: T.keep, p: { ra1: 40, ra2: 100, la1: -20, la2: 10, head: 14 } },
                  { f: T.keep + 6, p: { ra1: 10, ra2: 10, la1: -20, la2: 10, head: 0 } },
                  { f: T.checking, p: { ra1: 40, ra2: 100, la1: -20, la2: 10, head: 14 } },
                  { f: T.checking + 6, p: { ra1: 10, ra2: 10, la1: -20, la2: 10, head: 0 } },
                  { f: T.checking + 14, p: { ra1: 40, ra2: 100, la1: -20, la2: 10, head: 14 } },
                ]}
                mod={(t, q) => addPose(q, idle(t, 4))}
              />
              <text x={680} y={GROUND - 420} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={NAVY}>
                CHECK #{Math.min(99, 1 + Math.floor(Math.max(0, f - T.so) / 3))}
              </text>
            </g>
          )}

          {/* quote card */}
          {quoteK > 0.01 && (
            <g opacity={quoteK} transform={`translate(650 920) scale(${pop(f, T.called - 4)}) rotate(-2)`}>
              <rect x={-330} y={-250} width={660} height={500} rx={10} fill="#fffaf0" {...K} strokeWidth={8} />
              <rect x={-310} y={-230} width={620} height={460} rx={6} fill="none" stroke={CRIMSON} strokeWidth={4} />
              <text x={-280} y={-90} fontFamily="Georgia, serif" fontSize={200} fill={CRIMSON} opacity={0.35}>
                “
              </text>
              {["bright dings", "of pseudo-", "pleasure"].map((l, i) => (
                <text key={i} y={-90 + i * 100} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={86} fill={INK} opacity={interpolate(f, [T.bright + i * 7, T.bright + i * 7 + 5], [0, 1], clamp)}>
                  {l}
                </text>
              ))}
              <text y={200} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={NAVY} letterSpacing={1}>
                HOW HE DESCRIBED LIKES · GUARDIAN, 2017
              </text>
            </g>
          )}

          {/* blocked list */}
          {listK > 0.01 && (
            <g opacity={listK}>
              {[
                { t: "REDDIT", at: T.reddit, s: "BLOCKED" },
                { t: "SNAPCHAT", at: T.quit, s: "QUIT" },
                { t: "NEW APPS", at: T.locked2, s: "LOCKED" },
              ].map((r, i) =>
                f >= r.at - 6 ? (
                  <g key={i} transform={`translate(660 ${780 + i * 180}) scale(${pop(f, r.at - 6)})`}>
                    <rect x={-300} y={-60} width={600} height={120} rx={14} fill="#fffaf0" {...K} strokeWidth={6} />
                    <text x={-260} y={20} fontFamily={FONT.title} fontWeight={900} fontSize={60} fill={INK}>
                      {r.t}
                    </text>
                    {f >= r.at && (
                      <g transform={`translate(160 0) rotate(-8) scale(${interpolate(f - r.at, [0, 5, 8], [2.2, 0.9, 1], clamp)})`}>
                        <rect x={-120} y={-38} width={240} height={76} rx={8} fill="none" stroke={CRIMSON} strokeWidth={7} />
                        <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill={CRIMSON}>
                          {r.s}
                        </text>
                      </g>
                    )}
                  </g>
                ) : null,
              )}
            </g>
          )}

          {/* ask first: sticky note on the phone */}
          {askK > 0.01 && (
            <g opacity={askK}>
              <BigPhone x={660} y={950} s={1.3} screen="#fdf6e3">
                <Thumb x={0} y={-10} s={0.5} color="#e8d9b0" />
              </BigPhone>
              {f >= T.ask - 4 && (
                <g transform={`translate(680 930) rotate(${-6 + Math.sin(f / 10) * 1.5}) scale(${pop(f, T.ask - 4)})`}>
                  <rect x={-200} y={-140} width={400} height={280} fill="#ffe36b" {...K} strokeWidth={6} />
                  <rect x={-60} y={-160} width={120} height={36} fill="#f3e6c8" opacity={0.8} />
                  {["WHAT AM I", "HOPING FOR?"].map((l, i) => (
                    <text key={i} y={-20 + i * 82} textAnchor="middle" fontFamily={FONT.comic} fontSize={66} fill={INK}>
                      {l}
                    </text>
                  ))}
                </g>
              )}
            </g>
          )}

          {/* SPARK (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={1}
            keys={sparkKeys}
            trails={f < PEAK + 4}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = { ...q, x: q.x + dashX };
              q = addPose(addPose(q, hop(t, T.positivity, 36)), hop(t, T.pseudo, 30));
              q = addPose(addPose(q, shake(t, T.checking)), nod(t, T.hoping));
              return q;
            }}
          />
          <PowerUp kind="dash" f={f} at={0} x={SX} y={GROUND} h={185 * SS} dir={1} layer="front" />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 80, top: 250, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: NAVY, letterSpacing: 2, opacity: 0.85 }}>HIDDEN MECHANISM #15</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 132, color: GOLD, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1 }}>HE BUILT “LIKE”.</div>
              <div style={{ display: "inline-block", marginTop: 10, background: CRIMSON, color: "#fff", padding: "4px 30px", fontFamily: FONT.comic, fontSize: 88, border: `6px solid ${INK}` }}>THEN LOCKED HIS PHONE</div>
            </div>
          )}
          <Slam f={f} at={T.why} out={T.y2007 - 4} x={540} y={470} size={92} color={NAVY} stroke={`8px #fffaf0`} rotate={-2}>
            WHY FEAR HIS OWN FEATURE?
          </Slam>
          {yearK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 450, transform: `translate(-50%,-50%) scale(${pop(f, T.y2007)}) rotate(-3deg)`, opacity: yearK, textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 190, color: CRIMSON, lineHeight: 1, textShadow: `5px 5px 0 ${INK}` }}>2007</div>
              {f >= T.night - 4 && <div style={{ display: "inline-block", fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#fffaf0", background: NAVY, padding: "2px 18px" }}>ONE ALL-NIGHTER</div>}
            </div>
          )}
          <Slam f={f} at={T.idea} out={T.but - 4} x={540} y={470} size={90} color={GOLD} stroke={`9px ${INK}`} rotate={2}>
            LITTLE BITS OF POSITIVITY
          </Slam>
          <Slam f={f} at={T.but} out={T.so - 4} x={540} y={470} size={110} color={CRIMSON} stroke={`9px #fffaf0`} rotate={-2}>
            BUT… WHEN?
          </Slam>
          <Slam f={f} at={T.so} out={T.called - 6} x={540} y={470} size={110} color={NAVY} stroke={`9px #fffaf0`} rotate={2}>
            SO YOU CHECK
          </Slam>
          <Slam f={f} at={T.blocked} out={T.before - 4} x={540} y={470} size={92} color={CRIMSON} stroke={`9px #fffaf0`} rotate={-2}>
            HIS OWN RULES
          </Slam>
          <Slam f={f} at={T.before} out={T.because - 4} x={540} y={470} size={110} color={NAVY} stroke={`9px ${GOLD}`} rotate={2}>
            ASK FIRST
          </Slam>
          <div style={{ position: "absolute", left: 540, top: 1720, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: INK, whiteSpace: "nowrap", background: "rgba(243,230,200,0.85)", padding: "2px 12px" }}>
            Source: P. Lewis, “Our minds can be hijacked”, The Guardian, 6 Oct 2017
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["stop", "likes?", "built", "locked", "fear", "seven.", "all-nighter.", "awesome", "positivity.", "unpredictably.", "checking.", "pseudo-pleasure.", "reddit,", "snapchat,", "apps.", "hoping", "next"]}
          />
        </>
      }
    />
  );
};
