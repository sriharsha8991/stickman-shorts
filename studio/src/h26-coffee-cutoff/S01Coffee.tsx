import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H26 · Your 3 PM coffee is stealing an hour of sleep. Mechanism Reveal in a time-of-day room (Premium).
// 3 PM: YOU sips coffee ("I sleep fine"). Adenosine (sleep pressure) fills a tube; caffeine beans plug its
// receptors. Half-life ≈ 4 h: a cup gauge drains 100 → 50 → ~25% while the clock runs 3 → 7 → 11 PM; range 2–8 h.
// Wow: night falls, YOU is in bed and a ghost cup rises from the mug to hold YOU's eyes open. Study: 12 people,
// 400 mg, 6 h before bed → > 1 hour less sleep, mostly unnoticed. Caveat card: big dose, bodies vary.
// Payoff: an 8-hour cut-off wedge on a clock; bed 11 → coffee by 3; the sky returns to 3 PM amber (loop).
// "Education, not medical advice" stays on screen (Health-edu).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 6, at + 11], [0, 1.1, 1], clamp);
const soft = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.6;
const YGY = GROUND - 92.5 * YS;
const COFFEE = "#6b3f1f";
const CREMA = "#c58b4e";
const ADEN = "#a58cf0";
const AMBER = "#ffb347";
const NIGHT = "#1b1f4a";

// --- background: the sky changes with the time of day (k: 0 = 3 PM amber, 1 = night) ------------------------
const Room: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const top = interpolateColors(k, [0, 0.5, 1], ["#ffd59a", "#c98bb9", "#0f1233"]);
  const bot = interpolateColors(k, [0, 0.5, 1], ["#fff1d6", "#f3c6a8", NIGHT]);
  const floor = interpolateColors(k, [0, 1], ["#c88b5a", "#3b2f4f"]);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="h26bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="100%" stopColor={bot} />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#h26bg)" />
        <circle cx={interpolate(k, [0, 1], [880, 980])} cy={interpolate(k, [0, 1], [470, 1200])} r={90} fill="#fff3c4" opacity={1 - k} />
        <circle cx={interpolate(k, [0, 1], [120, 975])} cy={interpolate(k, [0, 1], [1200, 660])} r={70} fill="#f4f1ff" opacity={k} />
        <circle cx={interpolate(k, [0, 1], [150, 1000])} cy={interpolate(k, [0, 1], [1190, 645])} r={62} fill={top} opacity={k} />
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={(i * 397) % 1080} cy={260 + ((i * 211) % 900)} r={i % 3 === 0 ? 4 : 2.5} fill="#fff" opacity={k * (0.5 + 0.5 * Math.sin(f * 0.08 + i))} />
        ))}
        <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill={floor} />
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={0} y1={GROUND + 40 + i * 90} x2={1080} y2={GROUND + 40 + i * 90} stroke="#000" strokeWidth={3} opacity={0.12} />
        ))}
        <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};

const Mug: React.FC<{ f: number; steam?: number; level?: number; s?: number }> = ({ f, steam = 1, level = 1, s = 1 }) => (
  <g transform={`scale(${s})`}>
    {[0, 1].map((i) => (
      <path key={i} d={`M ${-12 + i * 22} -60 q 10 -16 0 -32 q -10 -16 0 -32`} stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" opacity={steam * (0.5 + 0.3 * Math.sin(f * 0.15 + i))} />
    ))}
    <rect x={-38} y={-54} width={76} height={58} rx={10} fill="#fff" {...K} strokeWidth={5} />
    <path d="M 38 -42 q 26 0 26 16 q 0 16 -26 16" fill="none" stroke={COL.ink} strokeWidth={5} />
    <rect x={-30} y={-46 + 12 * (1 - level)} width={60} height={12 * level + 0.01} fill={COFFEE} />
  </g>
);

const Ghost: React.FC<{ x: number; y: number; s: number; f: number; reach: number }> = ({ x, y, s, f, reach }) =>
  s > 0.01 ? (
    <g transform={`translate(${x} ${y + Math.sin(f * 0.12) * 10}) scale(${s})`} opacity={0.9}>
      <path d={`M 50 -10 Q ${90 + 30 * reach} ${-30} ${110 + 50 * reach} ${-40 + 30 * reach}`} stroke="#dff7ff" strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={`M 50 20 Q ${90 + 30 * reach} ${10} ${110 + 50 * reach} ${-4 + 30 * reach}`} stroke="#dff7ff" strokeWidth={12} fill="none" strokeLinecap="round" />
      <path
        d={`M -60 -70 L 60 -70 L 56 40 Q 40 ${70 + Math.sin(f * 0.3) * 8} 20 40 Q 0 ${72 + Math.cos(f * 0.3) * 8} -20 40 Q -40 ${70 + Math.sin(f * 0.3 + 1) * 8} -56 40 Z`}
        fill="#f2fbff"
        stroke="#8fd3ff"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M -60 -50 q -34 0 -34 24 q 0 24 34 24" fill="none" stroke="#8fd3ff" strokeWidth={6} />
      <ellipse cx={-22} cy={-20} rx={10} ry={14} fill={COL.ink} />
      <ellipse cx={22} cy={-20} rx={10} ry={14} fill={COL.ink} />
      <path d="M -16 14 q 16 12 32 0" stroke={COL.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  ) : null;

const Bed: React.FC = () => (
  <g>
    <rect x={470} y={1150} width={540} height={90} rx={18} fill="#e7e2f7" {...K} />
    <rect x={985} y={1030} width={34} height={260} rx={10} fill="#7a5a8a" {...K} />
    <rect x={480} y={1210} width={30} height={80} fill="#7a5a8a" {...K} strokeWidth={5} />
    <rect x={860} y={1100} width={120} height={60} rx={26} fill="#fff" {...K} strokeWidth={5} />
  </g>
);

// --- sfx --------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [W(0, 3), "clink", 0.4],
  [W(0, 6), "swish", 0.35],
  [W(0, 8), "pop", 0.45],
  [W(1, 3), "pop", 0.35],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [W(2, 3) + i * 7, "pop", 0.18]),
  [W(2, 7), "ding", 0.35],
  [W(3, 1), "thud", 0.45],
  [W(3, 1) + 6, "thud", 0.4],
  [W(3, 1) + 12, "thud", 0.4],
  [W(3, 6), "boing", 0.3],
  [W(4, 3), "tick", 0.4],
  [W(4, 6), "swish", 0.35],
  [W(5, 4), "pop", 0.4],
  [W(5, 7), "pop", 0.45],
  [W(6, 0), "whoosh_long", 0.4],
  [W(6, 6), "swirl", 0.4],
  [W(6, 10), "impact", 0.45],
  ...Array.from({ length: 12 }, (_, i): SfxCue => [W(7, 4) + i * 2, "tick", 0.2]),
  [W(7, 7), "stamp", 0.4],
  [W(8, 0), "tick", 0.45],
  [W(9, 1), "shatter", 0.4],
  [W(10, 2), "stamp", 0.5],
  [W(11, 2), "page", 0.4],
  [W(12, 3), "scribble", 0.4],
  [W(12, 6), "ding", 0.4],
  [W(13, 2), "tick", 0.4],
  [W(13, 3), "whoosh", 0.4],
  [W(13, 5), "clink", 0.45],
];

export const S01Coffee: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const E = VOICE_FRAMES;
  const hour = W(0, 8);
  const notice = C(1);
  const sleepy = W(2, 3);
  const aden = W(2, 7);
  const plugs = W(3, 1);
  const catchAt = C(4);
  const halfLife = W(4, 3);
  const four = W(4, 6);
  const two = W(5, 4);
  const eight = W(5, 7);
  const night = C(6);
  const still = W(6, 6);
  const bedtime = W(6, 10);
  const study = C(7);
  const twelve = W(7, 4);
  const mg = W(7, 7);
  const sixH = C(8);
  const lost = W(9, 1);
  const didnt = W(10, 2);
  const caveat = C(11);
  const cutAt = C(12);
  const cutoff = W(12, 3);
  const eightH = W(12, 6);
  const eleven = W(13, 2);
  const coffee3 = W(13, 3);
  const by3 = W(13, 5);

  // time of day: amber → dusk (half-life demo) → night (bed) → dusk (cut-off) → amber (loop)
  const sky =
    f < night
      ? interpolate(f, [halfLife, four + 20], [0, 0.45], clamp)
      : f < caveat
        ? interpolate(f, [night, night + 18], [0.45, 1], clamp)
        : f < coffee3
          ? interpolate(f, [caveat, caveat + 20], [1, 0.55], clamp)
          : interpolate(f, [coffee3, by3 + 10], [0.55, 0], clamp);

  // phases
  const tubeK = interpolate(f, [C(2) - 2, C(2) + 8, catchAt - 6, catchAt + 2], [0, 1, 1, 0], clamp);
  const cupK = interpolate(f, [catchAt, catchAt + 10, night - 4, night + 4], [0, 1, 1, 0], clamp);
  const bedK = interpolate(f, [night, night + 14, caveat - 4, caveat + 6], [0, 1, 1, 0], clamp);
  const bedDx = interpolate(f, [night, night + 14], [500, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const statsK = interpolate(f, [study - 2, study + 10, caveat - 6, caveat + 2], [0, 1, 1, 0], clamp);
  const clockK = interpolate(f, [cutAt - 2, cutAt + 10, E - 26, E - 16], [0, 1, 1, 0], clamp);
  const youVis = f < night ? 1 : f >= cutAt ? soft(f, cutAt, cutAt + 12) : 0;

  // half-life gauge: 100 → 50 (4 h) → ~25 (8 h)
  const lvl = f < four + 4 ? interpolate(f, [halfLife, four + 4], [1, 0.5], clamp) : interpolate(f, [four + 4, four + 30], [0.5, 0.25], clamp);
  const clockStr =
    f < halfLife ? "3:00 PM" : f < four + 4 ? (lvl > 0.75 ? "3:00 PM" : "7:00 PM") : f < four + 30 ? (lvl > 0.37 ? "7:00 PM" : "11:00 PM") : f < coffee3 ? "11:00 PM" : "3:00 PM";

  // ghost cup rises from the bedside mug (x 425) and floats to YOU's head (x ~ 905)
  const ghostS = interpolate(f, [still - 6, still + 8, caveat - 8, caveat + 2], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const ghostX = interpolate(f, [still - 6, still + 26], [425, 740], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ghostY = interpolate(f, [still - 6, still + 26], [1010, 960], clamp);
  const reach = interpolate(f, [still + 20, still + 34], [0, 1], clamp);

  const youKeys: Key[] = [
    { f: 0, p: { ...P.hold, ra1: 75, ra2: 50 } },
    { f: W(0, 3) - 2, p: { ...P.hold, ra1: 75, ra2: 50 } },
    { f: W(0, 3) + 6, p: { ...P.hold, ra1: 160, ra2: 85, head: -8 } },
    { f: hour - 4, p: { ...P.hold, ra1: 160, ra2: 85, head: -8 } },
    { f: hour + 4, p: { ...P.hold, ra1: 75, ra2: 50, head: 0 } },
    { f: notice, p: { ...P.hold, ra1: 75, ra2: 50 } },
    { f: notice + 6, p: { ...P.hold, ra1: 75, ra2: 50, la1: -55, la2: -100, head: 8 }, e: SNAP },
    { f: plugs - 2, p: { ...P.hold, ra1: 75, ra2: 50, la1: -55, la2: -100 } },
    { f: plugs + 6, p: { ...P.hold, ra1: 75, ra2: 50, la1: -140, la2: -30, head: -10 }, e: SNAP },
    { f: catchAt, p: { ...P.hold, ra1: 75, ra2: 50, la1: -140, la2: -30 } },
    { f: catchAt + 8, p: { ...P.hold, ra1: 75, ra2: 50, la1: -10 } },
    { f: cutAt + 4, p: { ...P.think } },
    { f: by3 - 4, p: { ...P.think } },
    { f: by3 + 2, p: { ...P.hold, ra1: 75, ra2: 50 }, e: SNAP },
  ];

  const sparkMood = (t: number): Mood =>
    t >= notice && t < C(2) ? "smug" : t >= still && t < study ? "shock" : t >= lost && t < didnt ? "shock" : t >= didnt && t < caveat ? "sad" : t >= by3 ? "happy" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, still, 40), bulbPulse(t, eightH, 20) * 0.6);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 110 } },
    { f: notice - 2, p: { ...P.pointR, ra1: 110 } },
    { f: notice + 4, p: { ...P.shrug } },
    { f: C(2) - 2, p: { ...P.shrug } },
    { f: C(2) + 6, p: { ...P.pointR, ra1: 140 } },
    { f: plugs - 2, p: { ...P.pointR, ra1: 140 } },
    { f: plugs + 6, p: { ...P.think } },
    { f: catchAt - 2, p: { ...P.think } },
    { f: catchAt + 6, p: { ...P.pointR, ra1: 125 } },
    { f: two - 2, p: { ...P.pointR, ra1: 125 } },
    { f: two + 4, p: { ...P.shrug } },
    { f: still - 2, p: { ...P.shrug } },
    { f: still + 3, p: { ra1: 160, ra2: -10, la1: -18 }, e: SNAP }, // aha
    { f: bedtime + 4, p: { ra1: 160, ra2: -10, la1: -18 } },
    { f: bedtime + 10, p: { ...P.shock } },
    { f: study - 2, p: { ...P.shock } },
    { f: study + 8, p: { ...P.pointR, ra1: 135 } },
    { f: lost - 2, p: { ...P.pointR, ra1: 135 } },
    { f: lost + 3, p: { ...P.shock }, e: SNAP },
    { f: didnt - 2, p: { ...P.shock } },
    { f: didnt + 4, p: { ...P.facepalm } },
    { f: caveat - 2, p: { ...P.facepalm } },
    { f: caveat + 6, p: { ...P.shrug } },
    { f: cutAt - 2, p: { ...P.shrug } },
    { f: cutAt + 6, p: { ...P.pointR, ra1: 120 } },
    { f: by3 - 2, p: { ...P.pointR, ra1: 120 } },
    { f: by3 + 3, p: { ...P.cheer }, e: SNAP },
  ];

  const z = punch(f, [hour, plugs, four, bedtime, lost, didnt, eightH, by3], 0.025);

  // cut-off clock wedge (3 → 11 = 8 hours)
  const CX = 700;
  const CY = 730;
  const CR = 170;
  const wedgeK = interpolate(f, [eightH - 4, eightH + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const handAng = (h: number) => (h / 12) * 360 - 90;
  const hourHand = f < coffee3 ? 11 : interpolate(f, [coffee3, by3], [11, 15], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const wedge = () => {
    const a0 = (handAng(3) * Math.PI) / 180;
    const a1 = ((handAng(3) + 240 * wedgeK) * Math.PI) / 180;
    const large = 240 * wedgeK > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${CX + Math.cos(a0) * CR} ${CY + Math.sin(a0) * CR} A ${CR} ${CR} 0 ${large} 1 ${CX + Math.cos(a1) * CR} ${CY + Math.sin(a1) * CR} Z`;
  };
  const hx = (h: number, r: number) => CX + Math.cos((handAng(h) * Math.PI) / 180) * r;
  const hy = (h: number, r: number) => CY + Math.sin((handAng(h) * Math.PI) / 180) * r;

  return (
    <Stage
      bg={<Room f={f} k={sky} />}
      hits={[bedtime, lost]}
      power={6}
      cam={{ z }}
      svg={
        <>
          {/* adenosine tube */}
          {tubeK > 0.01 && (
            <g opacity={tubeK}>
              <rect x={330} y={620} width={170} height={340} rx={30} fill="rgba(255,255,255,0.55)" {...K} />
              {Array.from({ length: 15 }, (_, i) => {
                const at = sleepy + i * 3;
                const k = interpolate(f, [at, at + 8], [0, 1], clamp);
                const col = i % 3;
                const row = Math.floor(i / 3);
                return k > 0.01 ? (
                  <g key={i} transform={`translate(${365 + col * 50 + (row % 2) * 8} ${925 - row * 58 - (1 - k) * 40})`} opacity={k * (f >= plugs + 4 ? 0.5 : 1)}>
                    <circle r={22} fill={ADEN} stroke={COL.ink} strokeWidth={3} />
                    <text y={9} textAnchor="middle" fontFamily={FONT.comic} fontSize={26} fill="#fff">z</text>
                  </g>
                ) : null;
              })}
            </g>
          )}
          {/* receptors: bean plugs drop in first, adenosine bounces off */}
          {tubeK > 0.01 && f >= plugs - 8 && (
            <g opacity={tubeK * soft(f, plugs - 8, plugs)}>
              <rect x={540} y={790} width={340} height={120} rx={24} fill="#ffe1ec" {...K} />
              {[0, 1, 2, 3].map((i) => {
                const x = 590 + i * 80;
                const at = plugs + i * 6;
                const drop = interpolate(f, [at - 8, at], [-160, 0], { ...clamp, easing: Easing.in(Easing.quad) });
                return (
                  <g key={i}>
                    <path d={`M ${x - 28} 790 v 46 a 28 28 0 0 0 56 0 v -46`} fill="#fff" stroke={COL.ink} strokeWidth={5} />
                    {f >= at - 8 && (
                      <g transform={`translate(${x} ${826 + drop}) rotate(${i * 20})`}>
                        <ellipse rx={24} ry={32} fill={COFFEE} stroke={COL.ink} strokeWidth={4} />
                        <path d="M 0 -26 q -10 26 0 52" stroke={CREMA} strokeWidth={5} fill="none" />
                      </g>
                    )}
                  </g>
                );
              })}
              {[0, 1, 2].map((i) => {
                const at = plugs + 22 + i * 5;
                const k = interpolate(f, [at, at + 16], [0, 1], clamp);
                return k > 0 && k < 1 ? (
                  <g key={i} transform={`translate(${620 + i * 90 + k * 50} ${740 - Math.sin(k * Math.PI) * 110})`} opacity={1 - k}>
                    <circle r={20} fill={ADEN} stroke={COL.ink} strokeWidth={3} />
                  </g>
                ) : null;
              })}
            </g>
          )}

          {/* half-life cup gauge */}
          {cupK > 0.01 && (
            <g opacity={cupK} transform="translate(500 720)">
              <clipPath id="h26cup">
                <path d="M -150 -170 L 150 -170 L 125 170 Q 120 190 100 190 L -100 190 Q -120 190 -125 170 Z" />
              </clipPath>
              <path d="M -150 -170 L 150 -170 L 125 170 Q 120 190 100 190 L -100 190 Q -120 190 -125 170 Z" fill="rgba(255,255,255,0.7)" />
              <rect x={-160} y={190 - 360 * lvl} width={320} height={360 * lvl} fill={COFFEE} clipPath="url(#h26cup)" />
              <rect x={-160} y={190 - 360 * lvl} width={320} height={14} fill={CREMA} clipPath="url(#h26cup)" />
              <path d="M -150 -170 L 150 -170 L 125 170 Q 120 190 100 190 L -100 190 Q -120 190 -125 170 Z" fill="none" {...K} strokeWidth={7} />
              <path d="M 150 -110 q 70 0 70 70 q 0 70 -84 70" fill="none" stroke={COL.ink} strokeWidth={7} />
              <text x={0} y={Math.min(150, 190 - 360 * lvl - 22)} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill="#fff" stroke={COL.ink} strokeWidth={6} paintOrder="stroke">
                {f < four + 30 ? `${Math.round(lvl * 100)}%` : "~25%"}
              </text>
            </g>
          )}

          {/* night: bed, sleeper, nightstand mug */}
          {bedK > 0.01 && (
            <g opacity={bedK} transform={`translate(${bedDx} 0)`}>
              <Bed />
              <circle cx={905} cy={1085} r={44} fill="#fff" stroke={COL.orange} strokeWidth={9} />
              {f >= still + 30 ? (
                <>
                  <circle cx={888} cy={1080} r={10} fill={COL.ink} />
                  <circle cx={922} cy={1080} r={10} fill={COL.ink} />
                  <path d="M 872 1060 h 30 M 908 1060 h 30" stroke={COL.ink} strokeWidth={4} strokeLinecap="round" />
                </>
              ) : (
                <path d="M 878 1082 q 10 8 20 0 M 912 1082 q 10 8 20 0" stroke={COL.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
              )}
              <path d="M 490 1150 Q 480 1100 560 1105 L 860 1112 Q 880 1150 860 1185 L 490 1185 Z" fill="#8f7fd6" {...K} />
              <text x={670} y={1165} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={42} fill="#fff">
                YOU
              </text>
            </g>
          )}
          {bedK > 0.01 && (
            <g opacity={bedK}>
              <rect x={360} y={1110} width={130} height={180} rx={10} fill="#7a5a8a" {...K} />
              <g transform="translate(425 1110)">
                <Mug f={f} steam={0} level={0.25} s={0.9} />
              </g>
            </g>
          )}
          <Ghost x={ghostX} y={ghostY} s={ghostS * 1.05} f={f} reach={reach} />
          {f >= bedtime && f < bedtime + 16 && <Burst x={905} y={1075} at={bedtime} f={f} size={160} color="#8fd3ff" />}

          {/* stats: 12 people + sleep bars */}
          {statsK > 0.01 && (
            <g opacity={statsK}>
              {Array.from({ length: 12 }, (_, i) => {
                const k = pop(f, twelve + i * 2);
                const x = 360 + (i % 6) * 85;
                const y = 520 + Math.floor(i / 6) * 115;
                return k > 0.01 ? (
                  <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity={f >= lost - 8 ? 0.35 : 1}>
                    <circle cy={-30} r={16} fill="#fff" stroke={COL.orange} strokeWidth={6} />
                    <path d="M 0 -14 v 30 M 0 16 l -14 22 M 0 16 l 14 22 M -16 0 h 32" stroke={COL.orange} strokeWidth={6} strokeLinecap="round" />
                  </g>
                ) : null;
              })}
              {f >= lost - 8 && (
                <g opacity={soft(f, lost - 8, lost) * (1 - soft(f, didnt - 4, didnt + 4))}>
                  <text x={330} y={790} fontFamily={FONT.title} fontWeight={900} fontSize={36} fill="#fff">
                    PLACEBO NIGHT
                  </text>
                  <rect x={330} y={802} width={600} height={46} rx={12} fill="#7ad7c4" {...K} strokeWidth={5} />
                  <text x={330} y={900} fontFamily={FONT.title} fontWeight={900} fontSize={36} fill="#fff">
                    400 MG, 6 H BEFORE BED
                  </text>
                  <rect x={330} y={912} width={600 - interpolate(f, [lost, lost + 10], [0, 140], clamp)} height={46} rx={12} fill="#7ad7c4" {...K} strokeWidth={5} />
                  {f >= lost && (
                    <g transform={`translate(${860 + interpolate(f, [lost, lost + 14], [0, 30], clamp)} ${935 + interpolate(f, [lost, lost + 14], [0, 36], clamp)}) rotate(${interpolate(f, [lost, lost + 14], [0, 14], clamp)})`}>
                      <rect x={-70} y={-23} width={140} height={46} rx={12} fill="#ff6b6b" {...K} strokeWidth={5} />
                    </g>
                  )}
                </g>
              )}
            </g>
          )}

          {/* cut-off clock */}
          {clockK > 0.01 && (
            <g opacity={clockK}>
              <circle cx={CX} cy={CY} r={CR} fill="#fffaf0" />
              {wedgeK > 0.01 && <path d={wedge()} fill="#ffd28a" opacity={0.9} />}
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1={hx(i, CR - 22)} y1={hy(i, CR - 22)} x2={hx(i, CR - 6)} y2={hy(i, CR - 6)} stroke={COL.ink} strokeWidth={i % 3 === 0 ? 8 : 4} />
              ))}
              <circle cx={CX} cy={CY} r={CR} fill="none" {...K} strokeWidth={8} />
              <line x1={CX} y1={CY} x2={hx(hourHand, 105)} y2={hy(hourHand, 105)} stroke={COL.ink} strokeWidth={12} strokeLinecap="round" />
              <circle cx={CX} cy={CY} r={12} fill={COL.ink} />
              <text x={hx(3, 125)} y={hy(3, 125) + 13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={COL.ink}>
                3
              </text>
              <text x={hx(11, 122)} y={hy(11, 122) + 13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={COL.ink}>
                11
              </text>
            </g>
          )}

          {/* YOU (with the mug) */}
          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            face={f >= notice && f < C(2) ? "happy" : f >= by3 ? "happy" : "eyes"}
            base={{ x: 820, y: YGY }}
            keys={youKeys}
            opacity={youVis}
            facing={-1}
            mod={(t, p) => addPose(p, idle(t, 4))}
          >
            {(j) =>
              f < night || f >= by3 - 10 ? (
                <g transform={`translate(${j.rHand[0] - 10} ${j.rHand[1] + 26})`}>
                  <Mug f={f} level={f < halfLife ? 1 : lvl} />
                </g>
              ) : null
            }
          </Actor>

          {/* SPARK (left) */}
          <Spark f={f} scale={SS} base={{ x: 170, y: SGY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={sparkMood} look={1} keys={sparkKeys} mod={(t, p) => addPose(p, idle(t, 8))} />
        </>
      }
      html={
        <>
          {/* hook overlay (frame 0) + loop */}
          <div
            style={{
              position: "absolute",
              left: 520,
              top: 420,
              transform: `translate(-50%,-50%) rotate(-2deg) scale(${f >= by3 ? pop(f, by3) : 1})`,
              opacity: Math.max(interpolate(f, [C(2) - 6, C(2) + 2], [1, 0], clamp), f >= by3 ? 1 : 0),
              fontFamily: FONT.comic,
              fontSize: 156,
              color: "#fff",
              WebkitTextStroke: `10px ${COL.ink}`,
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
              letterSpacing: 3,
              lineHeight: 1,
            }}
          >
            3 PM <span style={{ color: COFFEE, WebkitTextStroke: `10px #fff` }}>COFFEE</span>
          </div>
          {/* clock chip */}
          <div
            style={{
              position: "absolute",
              left: 860,
              top: 290,
              transform: "translate(-50%,-50%)",
              background: "rgba(20,20,40,0.85)",
              color: "#ffd28a",
              border: `5px solid ${COL.ink}`,
              borderRadius: 16,
              padding: "2px 20px",
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 54,
              whiteSpace: "nowrap",
              opacity: f >= cutAt && f < by3 ? 0 : 1,
            }}
          >
            {clockStr}
          </div>
          <Slam f={f} at={hour} out={notice + 30} x={520} y={600} size={78} color={AMBER} stroke={`8px ${COL.ink}`} rotate={-2}>
            −1 HOUR OF SLEEP?
          </Slam>
          {f >= W(1, 2) && f < C(2) + 4 && (
            <div style={{ position: "absolute", left: 640, top: 850, transform: `translate(-50%,-50%) scale(${pop(f, W(1, 2))})`, opacity: interpolate(f, [C(2) - 2, C(2) + 4], [1, 0], clamp), background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 40, padding: "6px 30px", fontFamily: FONT.comic, fontSize: 60, color: COL.ink, whiteSpace: "nowrap" }}>
              “I SLEEP FINE”
            </div>
          )}
          <Slam f={f} at={aden} out={catchAt - 4} x={560} y={430} size={100} color={ADEN} stroke={`9px ${COL.ink}`}>
            ADENOSINE
          </Slam>
          {f >= aden + 4 && f < plugs && (
            <div style={{ position: "absolute", left: 560, top: 530, transform: "translate(-50%,-50%)", fontFamily: FONT.title, fontWeight: 900, fontSize: 48, color: COL.ink, whiteSpace: "nowrap" }}>= SLEEP PRESSURE</div>
          )}
          {f >= plugs + 8 && f < catchAt - 2 && <Stamp f={f} at={plugs + 8} x={710} y={560} text="RECEPTORS BLOCKED" size={58} color={COFFEE} r={-6} />}
          <Slam f={f} at={halfLife} out={night - 4} x={540} y={470} size={88} color="#fff" stroke={`8px ${COL.ink}`} rotate={-2}>
            HALF-LIFE ≈ 4 H
          </Slam>
          {f >= two - 4 && f < night - 2 && (
            <div style={{ position: "absolute", left: 520, top: 990, transform: "translate(-50%,-50%)", display: "flex", gap: 14, fontFamily: FONT.title, fontWeight: 900, fontSize: 50, whiteSpace: "nowrap", color: COL.ink }}>
              <span style={{ background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 18px", transform: `scale(${pop(f, two)})` }}>2 H</span>
              <span style={{ alignSelf: "center" }}>····</span>
              <span style={{ background: "#ffd28a", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 18px" }}>4 H</span>
              <span style={{ alignSelf: "center" }}>····</span>
              <span style={{ background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 18px", transform: `scale(${pop(f, eight)})`, opacity: f >= eight - 1 ? 1 : 0 }}>8 H</span>
            </div>
          )}
          <Slam f={f} at={W(6, 7)} out={study - 4} x={560} y={560} size={82} color="#bfe9ff" stroke={`8px ${COL.ink}`} rotate={-2}>
            STILL IN YOU AT BEDTIME
          </Slam>
          <Slam f={f} at={study} out={caveat - 4} x={560} y={380} size={72} color="#fff" stroke={`7px ${COL.ink}`}>
            ONE SMALL STUDY · 12 PEOPLE
          </Slam>
          {f >= mg && f < lost - 8 && (
            <div style={{ position: "absolute", left: 600, top: 800, transform: `translate(-50%,-50%) rotate(-3deg) scale(${pop(f, mg)})`, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", whiteSpace: "nowrap" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <span style={{ background: COFFEE, color: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 22px", fontFamily: FONT.title, fontWeight: 900, fontSize: 70 }}>400 MG</span>
                <span style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 42, color: "#fff" }}>≈ 2–3 CUPS</span>
              </div>
              {f >= sixH && <span style={{ background: "#fff", color: COL.ink, border: `5px solid ${COL.ink}`, borderRadius: 14, padding: "0 18px", fontFamily: FONT.title, fontWeight: 900, fontSize: 56, transform: `scale(${pop(f, sixH)})` }}>6 H BEFORE BED</span>}
            </div>
          )}
          <Slam f={f} at={lost + 4} out={didnt - 2} x={600} y={700} size={60} color="#ff8a8a" stroke={`7px ${COL.ink}`}>
            &gt; 1 HOUR LESS SLEEP
          </Slam>
          {f >= didnt && f < caveat && (
            <div style={{ position: "absolute", left: 720, top: 900, transform: `translate(-50%,-50%) scale(${pop(f, didnt)})`, background: "#fff", border: `5px solid ${COL.ink}`, borderRadius: 40, padding: "4px 26px", fontFamily: FONT.comic, fontSize: 50, color: COL.ink, whiteSpace: "nowrap" }}>
              “SLEPT FINE”
            </div>
          )}
          {f >= didnt + 6 && f < caveat && <Stamp f={f} at={didnt + 6} x={580} y={760} text="MOSTLY DIDN'T NOTICE" size={58} color="#ff6b6b" r={-6} />}
          {f >= W(11, 2) && f < cutAt - 2 && (
            <div
              style={{
                position: "absolute",
                left: 600,
                top: 700,
                transform: `translate(-50%,-50%) rotate(-2deg) scale(${pop(f, W(11, 2))})`,
                background: "#fffaf0",
                border: `6px solid ${COL.ink}`,
                borderRadius: 18,
                padding: "16px 34px",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 58,
                color: COL.ink,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              <div>400 MG IS A BIG DOSE</div>
              <div style={{ color: "#8a5a2b", opacity: f >= W(11, 5) ? 1 : 0 }}>BODIES VARY: 2–8 H</div>
            </div>
          )}
          <Slam f={f} at={cutoff} out={eleven - 4} x={560} y={430} size={86} color={AMBER} stroke={`8px ${COL.ink}`} rotate={-2}>
            LAST CUP = BED − 8 H
          </Slam>
          {f >= eleven && f < by3 && (
            <div style={{ position: "absolute", left: 560, top: 430, transform: `translate(-50%,-50%) scale(${pop(f, eleven)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 80, color: "#fff", WebkitTextStroke: `6px ${COL.ink}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
              BED 11 PM → {f >= coffee3 ? <span style={{ color: AMBER }}>COFFEE BY 3</span> : "…"}
            </div>
          )}
          {/* sources + disclaimer */}
          <div style={{ position: "absolute", left: 540, top: 1585, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: sky > 0.3 ? "#f3efff" : "#5a3d2a", whiteSpace: "nowrap", opacity: f >= C(2) && f < cutAt ? 0.95 : 0 }}>
            {f < catchAt ? "Reichert, Deboer & Landolt (2022), J Sleep Res" : f < night ? "EFSA: average half-life ≈ 4 h (range 2–8 h)" : f < study ? "≈ a quarter left after 8 h at a 4 h half-life (approx.)" : "Drake et al. (2013), J Clin Sleep Med · n = 12, 400 mg"}
          </div>
          <div style={{ position: "absolute", left: 540, top: 1640, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 30, color: sky > 0.5 ? "#ffffff" : COL.ink, background: sky > 0.5 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.5)", borderRadius: 10, padding: "2px 16px", whiteSpace: "nowrap" }}>
            Education, not medical advice
          </div>
          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["three", "coffee", "hour", "sleep", "notice", "adenosine", "plugs", "receptors", "half-life", "four", "two", "eight", "bedtime", "twelve", "hundred", "six", "lost", "dose", "vary", "cut-off", "eleven"]} />
        </>
      }
    />
  );
};
