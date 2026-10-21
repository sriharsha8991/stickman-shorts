import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Key } from "../stickman/stick";
import { Burst, COL, Dust, FONT, Slam } from "../stickman/fx";
import { Card, Stage, fall } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, Phone, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V004 · UPI made spending stop hurting. Versus Fight in a boxing ring: CASH vs UPI, Spark is the
// ring announcer. A PAIN meter (the "pain of paying") fills with every cash note and stays silent on
// every UPI tap. Twist: the surprising winner is CASH — the sting was protecting you.
// Every beat is anchored to a spoken word (VOICE_CUES).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const FS = 1.5; // fighters' scale
const FY = GROUND - 92.5 * FS;
const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const CASH = COL.dollar;
const UPI = COL.purple;
const MX = 962; // pain meter x
const M_TOP = 720;
const M_BOT = 1180;

// --- arena ------------------------------------------------------------------
const ArenaBg: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute" }}>
    <defs>
      <linearGradient id="arena" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#140f26" />
        <stop offset="55%" stopColor="#2a2148" />
        <stop offset="100%" stopColor="#3a2d5e" />
      </linearGradient>
      <radialGradient id="spot">
        <stop offset="0%" stopColor="#fff6d0" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#fff6d0" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#arena)" />
    {/* spotlight cones */}
    {[300, 780].map((x, i) => (
      <path key={x} d={`M ${x - 40} 0 L ${x + 40} 0 L ${x + 260 + Math.sin(f * 0.02 + i) * 30} 1290 L ${x - 260 + Math.sin(f * 0.02 + i) * 30} 1290 Z`} fill="#fff6d0" opacity={0.06} />
    ))}
    <ellipse cx={540} cy={1280} rx={520} ry={70} fill="url(#spot)" />
    {/* crowd silhouettes */}
    {Array.from({ length: 22 }, (_, i) => {
      const x = 20 + i * 50;
      const bob = Math.sin(f * 0.15 + i * 1.7) * 4;
      return (
        <g key={i} opacity={0.55}>
          <circle cx={x} cy={905 + (i % 2) * 18 + bob} r={20} fill="#0d0a1a" />
          <rect x={x - 26} y={925 + (i % 2) * 18 + bob} width={52} height={80} rx={20} fill="#0d0a1a" />
        </g>
      );
    })}
    {/* ring canvas + apron */}
    <rect x={0} y={1000} width={1080} height={290} fill="#4a3c78" opacity={0.35} />
    <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#1a1430" />
    <rect x={30} y={GROUND} width={1020} height={70} fill="#b8322c" stroke={COL.ink} strokeWidth={5} />
    {/* posts + ropes */}
    {[40, 1040].map((x) => (
      <rect key={x} x={x - 12} y={980} width={24} height={310} rx={6} fill="#d8d8d8" stroke={COL.ink} strokeWidth={4} />
    ))}
    {[1020, 1100, 1180].map((y, i) => (
      <line key={y} x1={40} y1={y} x2={1040} y2={y + 6} stroke={["#e5322d", "#ffffff", "#2b7de9"][i]} strokeWidth={8} opacity={0.9} />
    ))}
  </svg>
);

// boxing gloves at the hands
const Gloves: React.FC<{ j: { lHand: [number, number]; rHand: [number, number] }; color?: string }> = ({ j, color = COL.red }) => (
  <>
    {[j.lHand, j.rHand].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={17} fill={color} {...K} strokeWidth={4} />
        <path d={`M ${x - 9} ${y + 4} Q ${x} ${y + 12} ${x + 9} ${y + 4}`} stroke={COL.ink} strokeWidth={3} fill="none" />
      </g>
    ))}
  </>
);

const Note: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-64} y={-30} width={128} height={60} rx={6} fill="#c9b8e8" stroke="#5b3f8c" strokeWidth={4} />
    <rect x={-56} y={-22} width={112} height={44} rx={3} fill="none" stroke="#5b3f8c" strokeWidth={2} />
    <text y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill="#3d2766">
      ₹500
    </text>
  </g>
);

const Check: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s})`}>
    <circle r={34} fill={COL.green} {...K} strokeWidth={5} />
    <path d="M -15 2 L -4 13 L 17 -12" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// the pain-of-paying meter
const Meter: React.FC<{ v: number; o: number; f: number; ouch: number }> = ({ v, o, f, ouch }) => {
  const h = M_BOT - M_TOP;
  const fillH = h * Math.max(0, Math.min(1, v));
  const col = v < 0.35 ? COL.green : v < 0.65 ? COL.yellow : COL.red;
  const shake = ouch > 0 ? Math.sin(f * 2.2) * 5 * ouch : 0;
  return (
    <g opacity={o} transform={`translate(${shake} 0)`}>
      <rect x={MX - 32} y={M_TOP} width={64} height={h} rx={30} fill="#1a1430" stroke="#fff" strokeWidth={5} />
      <rect x={MX - 22} y={M_BOT - 10 - fillH * 0.96} width={44} height={fillH * 0.96} rx={20} fill={col} />
      <circle cx={MX} cy={M_BOT + 34} r={44} fill={col} stroke="#fff" strokeWidth={5} />
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={MX - 32} x2={MX - 16} y1={M_BOT - h * t} y2={M_BOT - h * t} stroke="#fff" strokeWidth={3} />
      ))}
      <text x={MX} y={M_TOP - 22} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} letterSpacing={3} fill="#fff">
        PAIN
      </text>
    </g>
  );
};

// note release frames (round 1: "count", "notes", "Every", "one", "stings")
const NOTES = () => [W(4, 1), W(4, 4), W(4, 5), W(4, 6), W(4, 7)];
const TAPS = () => [W(7, 0), C(8) + 10, C(8) + 50, C(9) + 10, C(10) + 20, C(10) + 70, C(11) + 15];

export const S01_SFX: SfxCue[] = [
  [0, "horn", 0.45],
  [W(0, 0), "punch", 0.6],
  [W(0, 2), "punch", 0.7],
  [W(1, 6), "page", 0.5],
  [W(2, 5), "ding", 0.5],
  [C(3), "stinger", 0.6],
  [C(3) + 2, "horn", 0.3],
  ...NOTES().map((t): SfxCue => [t + 12, "punch", 0.55]),
  [W(5, 4), "impact", 0.6],
  [C(6), "stinger", 0.6],
  [W(7, 0), "pop", 0.6],
  [W(7, 1), "ding", 0.8],
  [W(7, 3), "whoosh", 0.4],
  ...TAPS().slice(1).map((t): SfxCue => [t, "kaching", 0.3]),
  [C(8), "page", 0.5],
  [C(10), "page", 0.5],
  [W(10, 6), "pop", 0.5],
  [C(12), "riser", 0.4],
  [W(12, 3), "thud", 0.7],
  [W(13, 0), "slam", 0.7],
  [W(13, 0) + 4, "gold", 0.5],
  [W(13, 4), "ding", 0.6],
  [C(14), "swish", 0.5],
  [C(15), "scribble", 0.3],
  [W(15, 6), "ding", 0.5],
];

export const S01Ring: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const r1 = C(3);
  const r2 = C(6);
  const twist = C(12);
  const win = W(13, 0);
  const aha = W(13, 4); // "protecting"
  const fix = C(14);

  // --- pain meter value
  let pain = 0;
  NOTES().forEach((t) => (pain += 0.16 * ease(f, t + 10, t + 16)));
  pain *= 1 - ease(f, r2, r2 + 18); // drains for round 2
  pain += f >= r2 + 18 && f < twist ? Math.abs(Math.sin(f * 0.5)) * 0.015 : 0; // flatline wiggle
  pain += 0.12 * ease(f, W(15, 3), W(15, 3) + 10) + 0.12 * ease(f, W(15, 6), W(15, 6) + 10); // the sting comes back
  // loop bookend: flickers back to zero
  const endFlick = interpolate(f, [VOICE_FRAMES - 16, VOICE_FRAMES - 10, VOICE_FRAMES - 7, VOICE_FRAMES - 1], [1, 0.3, 0.8, 0], clamp);
  pain *= endFlick;
  const ouch = Math.max(0, ...NOTES().map((t) => interpolate(f, [t + 12, t + 14, t + 24], [0, 1, 0], clamp)));
  const meterO = interpolate(f, [r1, r1 + 10], [0, 1], clamp);

  // --- positions
  const cashX = (() => {
    if (f < r1) return 250;
    if (f < r2) return lerp(250, 520, ease(f, r1, r1 + 24));
    if (f < twist) return lerp(520, 1350, ease(f, r2, r2 + 26));
    return 430;
  })();
  const upiX = (() => {
    if (f < r1) return 830;
    if (f < r2) return lerp(830, 1350, ease(f, r1, r1 + 26));
    if (f < twist) return lerp(1350, 560, ease(f, r2 + 4, r2 + 30));
    return lerp(560, 790, ease(f, twist, twist + 16));
  })();
  const walking = (x: (t: number) => number, t: number) => Math.abs(x(t) - x(t - 1)) > 1.2;

  const cashKeys: Key[] = [
    { f: 0, p: { la1: -70, la2: -110, ra1: 60, ra2: 110 } }, // guard
    { f: W(1, 6) - 4, p: { la1: -70, la2: -110, ra1: 60, ra2: 110 } },
    { f: W(1, 6) + 2, p: { ra1: 125, ra2: -10, la1: -60, la2: -110 }, e: SNAP }, // holds the ₹500 note out
    { f: r1 - 2, p: { ra1: 125, ra2: -10 } },
    { f: r1 + 26, p: { ...P.hold } },
    ...NOTES().flatMap((t): Key[] => [
      { f: t - 2, p: { ...P.hold } },
      { f: t + 3, p: { ra1: 100, ra2: -10, la1: 50, la2: 60 }, e: SNAP }, // hands a note over
      { f: t + 9, p: { ...P.hold } },
    ]),
    { f: W(5, 4) - 2, p: { ...P.hold } },
    { f: W(5, 4) + 4, p: { ...P.sad }, e: SNAP }, // "pain"
    { f: r2, p: { ...P.sad } },
    { f: r2 + 4, p: {} },
    { f: win - 2, p: { la1: -70, la2: -110, ra1: 60, ra2: 110 } },
    { f: win + 4, p: { la1: -125, la2: -20, ra1: 125, ra2: 20, head: -6 }, e: SNAP },
  ];
  const upiKeys: Key[] = [
    { f: 0, p: { la1: -60, la2: -110, ra1: 70, ra2: 110 } },
    { f: W(2, 5) - 4, p: { la1: -60, la2: -110, ra1: 70, ra2: 110 } },
    { f: W(2, 5) + 2, p: { la1: -150, la2: -10, ra1: 70, ra2: 110 }, e: SNAP }, // phone up: "tap"
    { f: r1 - 2, p: { la1: -150, la2: -10 } },
    { f: r1 + 4, p: {} },
    { f: r2 + 30, p: { la1: -60, la2: -100, ra1: 30, ra2: 10 } },
    { f: W(7, 3) - 2, p: { la1: -60, la2: -100 } },
    { f: W(7, 3) + 4, p: { ...P.cheer }, e: SNAP }, // "zero pain"
    { f: C(8) - 2, p: { ...P.cheer } },
    { f: C(8) + 6, p: { la1: -60, la2: -100, ra1: 30, ra2: 10, lean: -6 } },
    { f: twist, p: { la1: -60, la2: -100, ra1: 30, ra2: 10 } },
    { f: win - 2, p: { la1: -60, la2: -100 } },
    { f: win + 6, p: { ...P.sad }, e: SNAP },
  ];

  const sparkMood = (t: number): Mood =>
    t >= W(7, 3) && t < C(8) ? "shock" : t >= twist && t < win ? "neutral" : t >= win && t < fix ? "smug" : "happy";
  const bulb = (t: number) => Math.max(bulbPulse(t, aha, 40), bulbPulse(t, W(5, 4), 16) * 0.6);
  const sparkKeys: Key[] = [
    { f: 0, p: { ra1: 120, ra2: 40, la1: -18 } }, // mic up, announcer
    { f: W(0, 1) - 3, p: { ra1: 120, ra2: 40 } },
    { f: W(0, 1) + 3, p: { ra1: 120, ra2: 40, la1: -150, la2: -20 }, e: SNAP }, // "versus!"
    { f: C(1) - 2, p: { ra1: 120, ra2: 40, la1: -150, la2: -20 } },
    { f: C(1) + 4, p: { ra1: 120, ra2: 40, la1: -95, la2: 0 } }, // points at CASH (left)
    { f: C(2) - 2, p: { ra1: 120, ra2: 40, la1: -95 } },
    { f: C(2) + 4, p: { ra1: 95, ra2: 0, la1: -18, la2: 8 } }, // points at UPI (right)
    { f: r1 - 4, p: { ra1: 95, ra2: 0 } },
    { f: r1 + 24, p: { ...P.pointR, ra1: 80 } },
    { f: W(5, 4) - 3, p: { ...P.pointR, ra1: 80 } },
    { f: W(5, 4) + 3, p: { ...P.pointR, ra1: 50 } }, // points at the meter
    { f: W(7, 3) - 2, p: { ...P.pointR, ra1: 50 } },
    { f: W(7, 3) + 3, p: { ...P.shock }, e: SNAP },
    { f: C(8) - 2, p: { ...P.shock } },
    { f: C(8) + 4, p: { ra1: 140, ra2: 10, la1: -18 } }, // points up at the receipts
    { f: twist - 2, p: { ra1: 140, ra2: 10 } },
    { f: twist + 4, p: { ...P.think } },
    { f: win - 3, p: { ...P.think } },
    { f: win + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // "CASH!" arm up
    { f: aha - 2, p: { ra1: 150, ra2: -10 } },
    { f: aha + 4, p: { ...P.pointR, ra1: 75 } },
    { f: fix - 2, p: { ...P.pointR, ra1: 75 } },
    { f: fix + 4, p: { ra1: 70, ra2: 70, la1: -18 } }, // holds the phone up
  ];
  const holdsMic = f < r1 + 20;
  const holdsPhone = f >= fix;

  const tapPop = (t: number) => interpolate(f, [t, t + 5, t + 9, t + 22, t + 28], [0, 1.2, 1, 1, 0], clamp);

  const z = punch(f, [0, W(0, 2), r1, ...NOTES().map((t) => t + 12), W(5, 4), r2, W(7, 1), W(12, 3), win, aha, fix], 0.04);

  return (
    <Stage
      bg={<ArenaBg f={f} />}
      hits={[W(5, 4), W(12, 3), win]}
      power={12}
      cam={{ z }}
      svg={
        <>
          <Meter v={pain} o={meterO} f={f} ouch={ouch} />
          {ouch > 0.05 && (
            <text x={MX - 120} y={M_BOT - pain * (M_BOT - M_TOP) - 10} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={COL.red} stroke="#fff" strokeWidth={3} paintOrder="stroke" opacity={ouch} transform={`rotate(-10 ${MX - 120} ${M_BOT - pain * (M_BOT - M_TOP)})`}>
              OUCH!
            </text>
          )}
          {f >= r2 + 18 && f < twist && (
            <text x={MX} y={M_BOT + 48} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill="#fff">
              0
            </text>
          )}

          {/* flying notes: CASH hand → meter */}
          {NOTES().map((t, i) => {
            if (f < t || f > t + 14) return null;
            const k = (f - t) / 12;
            const x0 = cashX + 95;
            const y0 = FY - 70;
            const x = lerp(x0, MX, Math.min(1, k));
            const y = lerp(y0, M_BOT, Math.min(1, k)) - Math.sin(Math.min(1, k) * Math.PI) * 140;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${k * 200})`} opacity={k > 1 ? 0 : 1}>
                <Note s={0.7} />
              </g>
            );
          })}

          {/* "3 in 4" pictogram */}
          {f >= W(10, 4) && f < twist && (
            <g opacity={interpolate(f, [W(10, 4), W(10, 4) + 6, twist - 8, twist], [0, 1, 1, 0], clamp)}>
              {[0, 1, 2, 3].map((i) => {
                const x = 330 + i * 140;
                const red = i < 3 && f >= W(10, 4 + i);
                const s = interpolate(f, [W(10, 4) + i * 3, W(10, 4) + i * 3 + 6], [0, 1], clamp);
                return (
                  <g key={i} transform={`translate(${x} 780) scale(${s})`}>
                    <circle cy={-46} r={22} fill={red ? COL.red : "#c9c3dd"} {...K} strokeWidth={4} />
                    <rect x={-26} y={-20} width={52} height={66} rx={20} fill={red ? COL.red : "#c9c3dd"} {...K} strokeWidth={4} />
                    {red && <path d="M 0 -110 L 0 -80 M -12 -98 L 0 -110 L 12 -98" stroke="#ffd23f" strokeWidth={7} fill="none" strokeLinecap="round" />}
                  </g>
                );
              })}
            </g>
          )}

          {/* CASH fighter */}
          {cashX < 1300 && (
            <Actor
              f={f}
              color={CASH}
              scale={FS}
              label="CASH"
              face={f >= W(5, 4) && f < r2 ? "sad" : "happy"}
              base={{ x: 250, y: FY }}
              keys={cashKeys}
              mod={(t, p) => {
                const xf = (u: number) =>
                  u < r1 ? 250 : u < r2 ? lerp(250, 520, ease(u, r1, r1 + 24)) : u < twist ? lerp(520, 1350, ease(u, r2, r2 + 26)) : 430;
                const q = { ...p, x: xf(t), y: t >= twist ? fall(t, twist + 18, -500, FY, 12) : FY };
                if (walking(xf, t)) return addPose(q, walkCycle(t, 0.3));
                return addPose(q, idle(t, 2));
              }}
            >
              {(j) => (
                <>
                  <Gloves j={j} color={f >= r1 + 20 && f < r2 ? "#cfe8c8" : COL.red} />
                  {f >= W(1, 6) && f < r1 + 2 && (
                    <g transform={`translate(${j.rHand[0] + 50} ${j.rHand[1] - 40})`}>
                      <Note s={interpolate(f, [W(1, 6), W(1, 6) + 6], [0, 1], clamp)} />
                    </g>
                  )}
                  {f >= r1 + 24 && f < r2 && (
                    <g transform={`translate(${(j.lHand[0] + j.rHand[0]) / 2 + 70} ${(j.lHand[1] + j.rHand[1]) / 2 - 20})`}>
                      <Note s={0.8} />
                      <g transform="translate(6 -8)">
                        <Note s={0.8} />
                      </g>
                    </g>
                  )}
                  {f >= win && (
                    <g transform={`translate(${j.hip[0]} ${j.hip[1] - 8}) scale(${interpolate(f, [win, win + 6, win + 10], [0, 1.2, 1], clamp)})`}>
                      <rect x={-46} y={-16} width={92} height={32} rx={8} fill={COL.gold} {...K} strokeWidth={4} />
                      <circle r={20} fill="#ffe27a" {...K} strokeWidth={4} />
                      <text y={8} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={22} fill={COL.ink}>
                        1
                      </text>
                    </g>
                  )}
                </>
              )}
            </Actor>
          )}
          {f >= twist && <Dust x={430} y={GROUND} at={twist + 30} f={f} spread={200} />}

          {/* UPI fighter */}
          {upiX < 1300 && (
            <Actor
              f={f}
              color={UPI}
              scale={FS}
              label="UPI"
              face={f >= win ? "sad" : "happy"}
              base={{ x: 830, y: FY }}
              facing={-1}
              keys={upiKeys}
              mod={(t, p) => {
                const xf = (u: number) =>
                  u < r1 ? 830 : u < r2 ? lerp(830, 1350, ease(u, r1, r1 + 26)) : u < twist ? lerp(1350, 560, ease(u, r2 + 4, r2 + 30)) : lerp(560, 790, ease(u, twist, twist + 16));
                const q = { ...p, x: xf(t) };
                if (walking(xf, t)) return addPose(q, walkCycle(t, 0.3));
                return addPose(q, idle(t, 6));
              }}
            >
              {(j) => (
                <>
                  <Gloves j={j} color={f >= W(2, 5) - 4 && f < twist ? "#e0d0f5" : COL.red} />
                  {f >= W(2, 5) - 4 && f < twist && (
                    <g>
                      <Phone x={j.lHand[0] - 30} y={j.lHand[1] - 5} s={0.75} scroll={f * 2} />
                    </g>
                  )}
                  {TAPS().map((t, i) =>
                    f >= t && f < t + 28 ? (
                      <g key={i} transform={`translate(${j.lHand[0] - 10} ${j.lHand[1] - 150 - (f - t) * 2})`}>
                        <Check s={tapPop(t) * (i === 0 ? 1.4 : 0.8)} />
                      </g>
                    ) : null,
                  )}
                </>
              )}
            </Actor>
          )}
          {/* the "tap" ripple in the intro */}
          {f >= W(2, 5) && f < W(2, 5) + 20 && (
            <circle cx={790} cy={FY - 250} r={interpolate(f, [W(2, 5), W(2, 5) + 20], [10, 120])} fill="none" stroke="#e0d0f5" strokeWidth={6} opacity={interpolate(f, [W(2, 5), W(2, 5) + 20], [1, 0])} />
          )}
          {f >= win && <Burst x={430} y={FY - 200} at={win} f={f} size={260} color={COL.gold} />}

          {/* SPARK, the ring announcer */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 540, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={f >= C(1) && f < C(2) ? -1 : f >= C(8) && f < twist ? 0 : 1}
            keys={sparkKeys}
            mod={(t, p) => {
              const xf = (u: number) => lerp(540, 165, ease(u, r1 - 2, r1 + 22));
              const q = { ...p, x: xf(t) };
              if (walking(xf, t)) return addPose(q, walkCycle(t, 0.3));
              return addPose(q, idle(t, 9));
            }}
          >
            {(j) => (
              <>
                {holdsMic && (
                  <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(-20)`}>
                    <rect x={-7} y={-6} width={14} height={46} rx={5} fill="#333" {...K} strokeWidth={3} />
                    <circle cy={-16} r={16} fill="#9a9a9a" {...K} strokeWidth={3} />
                  </g>
                )}
                {holdsPhone && <Phone x={j.rHand[0] + 10} y={j.rHand[1] - 70} s={1.25} scroll={f >= C(15) ? (f - C(15)) * 4 : 0} />}
              </>
            )}
          </Spark>
        </>
      }
      html={
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 262,
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 28,
              padding: "6px 20px",
              borderRadius: 30,
              whiteSpace: "nowrap",
            }}
          >
            Education, not financial advice
          </div>

          {/* intro */}
          <Slam f={f} at={W(0, 0)} out={r1 - 6} x={250} y={430} size={140} color="#cfe8c8" stroke={`9px ${COL.ink}`} rotate={-4}>
            CASH
          </Slam>
          <Slam f={f} at={W(0, 1)} out={r1 - 6} x={540} y={520} size={90} color={COL.yellow} stroke={`7px ${COL.ink}`}>
            VS
          </Slam>
          <Slam f={f} at={W(0, 2)} out={r1 - 6} x={820} y={430} size={140} color="#e0d0f5" stroke={`9px ${COL.ink}`} rotate={4}>
            UPI
          </Slam>
          <Slam f={f} at={W(1, 6)} out={C(2) - 4} x={540} y={640} size={66} font={FONT.title} weight={900} color="#fff" spacing={3}>
            ₹500 NOTE = OUCH
          </Slam>
          <Slam f={f} at={W(2, 5)} out={r1 - 6} x={540} y={640} size={66} font={FONT.title} weight={900} color="#fff" spacing={3}>
            ₹500 TAP = NOTHING?
          </Slam>

          {/* rounds */}
          {[
            { at: r1, out: r1 + 40, text: "ROUND 1 · CASH", bg: CASH },
            { at: r2, out: r2 + 40, text: "ROUND 2 · UPI", bg: UPI },
          ].map((r) => (
            <div
              key={r.text}
              style={{
                position: "absolute",
                left: 540,
                top: 400,
                transform: `translate(-50%,-50%) scale(${interpolate(f - r.at, [0, 5, 9], [2.4, 0.95, 1], clamp)})`,
                opacity: f < r.at ? 0 : interpolate(f, [r.at, r.at + 3, r.out, r.out + 8], [0, 1, 1, 0], clamp),
                background: r.bg,
                color: "#fff",
                border: `6px solid ${COL.ink}`,
                borderRadius: 18,
                padding: "10px 40px",
                fontFamily: FONT.comic,
                fontSize: 96,
                letterSpacing: 4,
                whiteSpace: "nowrap",
                boxShadow: `8px 8px 0 ${COL.ink}`,
              }}
            >
              {r.text}
            </div>
          ))}
          <Slam f={f} at={W(5, 4)} out={r2 - 6} x={540} y={430} size={100} color={COL.red} stroke={`8px #fff`} rotate={-3}>
            PAIN OF PAYING
          </Slam>
          <Slam f={f} at={W(7, 3)} out={C(8) - 2} x={540} y={430} size={120} color="#e0d0f5" stroke={`8px ${COL.ink}`}>
            ZERO PAIN
          </Slam>

          {/* receipts */}
          <Card f={f} at={C(8)} out={twist - 6} x={540} y={300} w={900} n="1" accent={COL.blue} size={34}>
            <b>2008 study:</b> for the same meal, people offered <b>more</b> when paying by card than with cash.
          </Card>
          <Card f={f} at={C(10)} out={twist - 6} x={540} y={490} w={900} n="2" accent={COL.red} size={34}>
            <b>2024 survey:</b> <b>3 in 4</b> UPI users say they spend more because of UPI. <span style={{ fontSize: 24, color: COL.grey }}>(self-reported)</span>
          </Card>

          {/* twist + payoff */}
          <Slam f={f} at={twist} out={win - 4} x={540} y={420} size={100} color="#fff" stroke={`8px ${COL.ink}`}>
            WHO REALLY WINS?
          </Slam>
          <Slam f={f} at={win} out={fix - 6} x={540} y={380} size={110} color={COL.gold} stroke={`8px ${COL.ink}`} rotate={-3}>
            WINNER: CASH
          </Slam>
          <Slam f={f} at={aha} out={fix - 6} x={540} y={520} size={58} font={FONT.title} weight={900} color="#fff" spacing={2}>
            THE STING WAS PROTECTING YOU
          </Slam>
          <Slam f={f} at={fix} x={540} y={390} size={100} color={COL.red} stroke={`8px #fff`}>
            PUT THE STING BACK
          </Slam>
          {f >= C(15) && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 530,
                transform: `translate(-50%,-50%) translateY(${(1 - interpolate(f, [C(15), C(15) + 10], [0, 1], clamp)) * 40}px)`,
                opacity: interpolate(f, [C(15), C(15) + 10], [0, 1], clamp),
                background: COL.yellow,
                color: COL.ink,
                border: `5px solid ${COL.ink}`,
                borderRadius: 16,
                padding: "12px 28px",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 54,
                letterSpacing: 2,
                whiteSpace: "nowrap",
              }}
            >
              EVERY WEEK: SCROLL YOUR UPI HISTORY
            </div>
          )}

          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["cash", "upi", "pain", "stings", "card", "three", "four", "sting", "protecting", "history"]} />
        </>
      }
    />
  );
};
