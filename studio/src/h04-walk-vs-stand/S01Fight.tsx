import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle, type Joints } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H04 · Walk vs stand after lunch. Retention v2 cut (~29.2 s), Versus Fight, power-up "clash" (V016 before it used impact).
// World: a sunny office-rooftop ring at lunchtime (sky blue + turf lime + purple ropes + sunshine yellow), city
// skyline behind. Spark is the ring announcer on the RIGHT (V016 had him left). STAND (blue) vs WALK (orange),
// a SUGAR SPIKE meter over the ring. Round 1: STAND beats SIT a little (−0.31). Round 2: WALK (−0.72, more than
// double). Why: leg muscles soak sugar out of the blood. Dunstan 2012: 2-min strolls every 20 min → spike ≈ ¼ lower.
// Caveat card, then the payoff (2 min every ~30 min after lunch) and the loop back into the clash.
// Sources: Buffey et al. 2022, Sports Med 52:1765–1787; Dunstan et al. 2012, Diabetes Care 35:976–983.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const SX = 900;
const FS = 1.4; // fighters
const FGY = GROUND - 92.5 * FS;
const LX = 210; // left corner
const RX = 560; // right corner
const SKY1 = "#7cc8f2";
const SKY2 = "#d6f0ff";
const TURF = "#7cc644";
const ROPE = "#7b4fd6";
const SUN = "#ffd23f";
const BLUE = COL.blue;
const ORANGE = COL.orange;
const SUGAR = "#e5322d";
const INK = COL.ink;
const PEAK = POWER_PEAK.clash; // 10

const T = {
  stand: W(0, 1),
  lunch: W(0, 3),
  stop: W(0, 4),
  walk: W(1, 2),
  beat: W(1, 3),
  standing: W(1, 4),
  double: W(1, 8),
  r1: C(2),
  sitting: W(2, 4),
  little: W(2, 6),
  r2: C(3),
  walking: W(3, 2),
  hits: W(3, 3),
  twice: W(3, 6),
  hard: W(3, 8),
  why: C(4),
  working: W(4, 1),
  leg: W(4, 2),
  pull: W(4, 4),
  sugar: W(4, 5),
  blood: W(4, 9),
  inOne: C(5),
  lab: W(5, 2),
  strolls: W(5, 5),
  every: W(5, 6),
  twenty: W(5, 7),
  cut: C(6),
  spike: W(6, 3),
  quarter: W(6, 7),
  short: C(7),
  not: W(7, 4),
  diabetes: W(7, 6),
  so: C(8),
  lunch2: W(8, 2),
  stroll: W(8, 3),
  two: W(8, 4),
  half: W(8, 7),
  the: C(9),
  meter: W(9, 1),
  dips: W(9, 2),
};
const LOOP = VOICE_FRAMES - 16;

// --- background: rooftop ring at lunchtime ---------------------------------------------------------------------
const Rooftop: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h4sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY1} />
          <stop offset="70%" stopColor={SKY2} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h4sky)" />
      {/* noon sun */}
      <g transform={`translate(940 300) rotate(${f * 0.4})`}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-6} y={-130} width={12} height={34} rx={6} fill={SUN} transform={`rotate(${i * 30})`} />
        ))}
        <circle r={80} fill={SUN} stroke="#e8a91c" strokeWidth={6} />
      </g>
      {/* clouds */}
      {[0, 1, 2].map((i) => {
        const x = ((random(`cl${i}`) * 1200 + f * (0.5 + i * 0.2)) % 1300) - 150;
        const y = 330 + i * 120;
        return (
          <g key={i} opacity={0.85}>
            <ellipse cx={x} cy={y} rx={90} ry={30} fill="#fff" />
            <ellipse cx={x + 40} cy={y - 20} rx={55} ry={30} fill="#fff" />
          </g>
        );
      })}
      {/* city skyline */}
      {Array.from({ length: 14 }, (_, i) => {
        const w = 60 + random(`bw${i}`) * 50;
        const h = 160 + random(`bh${i}`) * 260;
        const x = i * 80 - 20;
        return (
          <g key={i}>
            <rect x={x} y={1050 - h} width={w} height={h} fill={i % 2 ? "#9bb4d6" : "#b7c9e4"} />
            {Array.from({ length: Math.floor(h / 50) }, (_, k) => (
              <rect key={k} x={x + 12} y={1050 - h + 20 + k * 50} width={w - 24} height={14} fill="#e8f2ff" opacity={0.6} />
            ))}
          </g>
        );
      })}
      {/* rooftop parapet */}
      <rect x={0} y={1050} width={1080} height={60} fill="#c9c2b4" stroke={INK} strokeWidth={5} />
      {/* turf ground */}
      <rect x={0} y={1110} width={1080} height={810} fill={TURF} />
      {Array.from({ length: 50 }, (_, i) => (
        <line key={i} x1={random(`gx${i}`) * 1080} y1={1130 + random(`gy${i}`) * 700} x2={random(`gx${i}`) * 1080 + 6} y2={1120 + random(`gy${i}`) * 700} stroke="#5aa02e" strokeWidth={4} />
      ))}
      {/* ring canvas (left two thirds) */}
      <path d={`M 40 ${GROUND} L 740 ${GROUND} L 700 1160 L 80 1160 Z`} fill="#f4efe2" stroke={INK} strokeWidth={6} />
      <rect x={30} y={GROUND} width={720} height={60} fill={ROPE} stroke={INK} strokeWidth={5} />
      <text x={390} y={GROUND + 44} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill="#fff" letterSpacing={6}>
        LUNCH BREAK ARENA
      </text>
      {/* posts + ropes */}
      {[50, 730].map((x) => (
        <rect key={x} x={x - 12} y={1000} width={24} height={GROUND - 1000} rx={6} fill="#eee" stroke={INK} strokeWidth={4} />
      ))}
      {[1030, 1090, 1150].map((y, i) => (
        <line key={y} x1={50} y1={y} x2={730} y2={y + 4} stroke={i === 1 ? SUN : ROPE} strokeWidth={8} />
      ))}
    </svg>
  </AbsoluteFill>
);

// --- SUGAR SPIKE meter ----------------------------------------------------------------------------------------
const Meter: React.FC<{ f: number; v: number; x?: number; y?: number; label?: string }> = ({ f, v, x = 390, y = 700, label = "SUGAR SPIKE" }) => {
  const w = 560;
  const fill = Math.max(0, Math.min(1, v));
  const col = fill > 0.7 ? SUGAR : fill > 0.45 ? "#f29a1d" : "#3aa35b";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2 - 8} y={-44} width={w + 16} height={88} rx={20} fill="#fff" {...K} strokeWidth={6} />
      <rect x={-w / 2} y={-34} width={w * fill} height={68} rx={14} fill={col} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={-w / 2 + (i + 1) * (w / 10)} x2={-w / 2 + (i + 1) * (w / 10)} y1={-34} y2={-18} stroke={INK} strokeWidth={3} opacity={0.4} />
      ))}
      <text y={-60} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={INK} letterSpacing={3}>
        {label}
      </text>
      {/* little sugar cubes jitter in the bar when high */}
      {fill > 0.6 &&
        Array.from({ length: 5 }, (_, i) => (
          <rect key={i} x={-w / 2 + 30 + i * 90 + Math.sin(f / 2 + i) * 4} y={-14 + Math.cos(f / 3 + i) * 6} width={22} height={22} fill="#fff" stroke={INK} strokeWidth={3} opacity={0.9} />
        ))}
    </g>
  );
};

const Gloves: React.FC<{ j: Joints; color: string }> = ({ j, color }) => (
  <>
    {[j.lHand, j.rHand].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={16} fill={color} {...K} strokeWidth={4} />
    ))}
  </>
);

const Bell: React.FC<{ f: number; at: number; n: string }> = ({ f, at, n }) => {
  const k = win(f, at - 2, at + 46, 6);
  if (k < 0.01) return null;
  return (
    <g opacity={k} transform={`translate(390 575) scale(${pop(f, at - 2) * 0.75}) rotate(${Math.sin((f - at) / 2) * 3})`}>
      <rect x={-210} y={-70} width={420} height={130} rx={18} fill={SUN} {...K} strokeWidth={7} />
      <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={92} fill={INK}>
        ROUND {n}
      </text>
    </g>
  );
};

// effect-size bar (bigger = bigger drop in the post-meal sugar response vs sitting)
const Drop: React.FC<{ y: number; v: number; max: number; label: string; num: string; color: string; k: number }> = ({ y, v, max, label, num, color, k }) =>
  k > 0.01 ? (
    <g opacity={k} transform={`translate(90 ${y})`}>
      <text x={0} y={-16} fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
        {label}
      </text>
      <rect x={0} y={0} width={(v / max) * 560} height={64} rx={12} fill={color} {...K} strokeWidth={5} />
      <text x={(v / max) * 560 + 18} y={50} fontFamily={FONT.comic} fontSize={62} fill={INK}>
        {num}
      </text>
    </g>
  ) : null;

// --- sfx --------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "whoosh_long", 0.55],
  [PEAK, "impact", 0.7],
  [PEAK + 6, "punch", 0.5],
  [PEAK + 12, "punch", 0.45],
  [T.stop, "freeze", 0.45],
  [T.walk, "swish", 0.35],
  [T.double, "slam", 0.6],
  [T.r1 - 2, "ding", 0.6],
  [T.sitting, "thud", 0.4],
  [T.little, "boing", 0.3],
  [T.r2 - 2, "ding", 0.6],
  [T.walking, "whoosh", 0.4],
  [T.hits, "punch", 0.6],
  [T.twice, "explosion", 0.4],
  [T.hard, "stinger", 0.45],
  [T.working, "swirl", 0.35],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.pull + i * 5, "pop", 0.22]),
  [T.lab, "page", 0.4],
  [T.strolls, "tick", 0.35],
  [T.twenty, "tick", 0.35],
  [T.cut - 8, "riser", 0.4],
  [T.quarter, "gold", 0.5],
  [T.short, "stamp", 0.45],
  [T.not, "buzz", 0.3],
  [T.stroll, "swish", 0.35],
  [T.half, "ding", 0.45],
  [LOOP - 6, "whoosh", 0.45],
];

export const S01Fight: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // windows
  const fightK = Math.max(win(f, -10, T.r1 - 4, 6), interpolate(f, [T.the - 6, T.the + 2], [0, 1], clamp));
  const r1K = win(f, T.r1 - 4, T.r2 - 4, 6);
  const r2K = win(f, T.r2 - 4, T.why - 2, 6);
  const whyK = win(f, T.why - 2, T.inOne - 2, 6);
  const labK = win(f, T.inOne - 2, T.short - 2, 6);
  const cavK = win(f, T.short - 2, T.so - 2, 6);
  const payK = win(f, T.so - 2, T.the - 2, 6);

  // meter: high at frame 0, shakes on the clash; dips at "double" and again at the loop
  const meterV =
    f < T.the
      ? interpolate(f, [0, PEAK, T.walk, T.double, T.double + 12], [0.9, 0.95, 0.95, 0.55, 0.5], clamp) + (f < T.walk ? 0.02 * Math.sin(f / 1.5) : 0)
      : interpolate(f, [T.the, T.dips, T.dips + 12], [0.92, 0.92, 0.6], clamp);

  const overlayK = Math.max(interpolate(f, [T.walk - 8, T.walk], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.presentBoth, lean: -6 }],
    [PEAK, { ...G.celebrate }, "snap"],
    [T.stand, G.pointSide, "snap"],
    [T.stop, G.stop, "snap"],
    [T.walk, G.count2, "snap"],
    [T.double, G.fistPump, "snap"],
    [T.r1, G.wave1, "snap"],
    [T.sitting, G.pointDown, "snap"],
    [T.little, G.shrugBig, "snap"],
    [T.r2, G.wave2, "snap"],
    [T.hits, G.fistPump, "snap"],
    [T.twice, G.celebrate, "snap"],
    [T.why, G.thinkChin, "snap"],
    [T.leg, G.pointSide, "snap"],
    [T.blood, G.mindBlown, "snap"],
    [T.inOne, G.count1, "snap"],
    [T.every, G.present, "snap"],
    [T.cut, G.pointDown, "snap"],
    [T.quarter, G.clap1, "snap"],
    [T.quarter + 6, G.clap2, "snap"],
    [T.short, G.armsCrossed, "snap"],
    [T.not, G.stop, "snap"],
    [T.so, G.beckon, "snap"],
    [T.stroll, G.present, "snap"],
    [T.half, G.pointUp, "snap"],
    [T.the, { ...G.presentBoth, lean: -6 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.stop ? "excited" : t < T.walk ? "skeptical" : t < T.r1 ? "smug" : t < T.little ? "curious" : t < T.r2 ? "neutral" : t < T.why ? "excited" : t < T.blood ? "thinking" : t < T.inOne ? "mindblown" : t < T.quarter ? "curious" : t < T.short ? "happy" : t < T.so ? "worried" : t < T.the ? "wink" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.blood, 30), bulbPulse(t, T.quarter, 22) * 0.8);
  const z = punch(f, [PEAK, T.double, T.hits, T.blood, T.quarter], 0.035);

  // fighters
  const standKeys = [
    { f: 0, p: { ra1: 120, ra2: 110, la1: -100, la2: -120, lean: 6 } },
    { f: PEAK + 6, p: { ra1: 95, ra2: 10, la1: -100, la2: -120, lean: 12 } },
    { f: PEAK + 12, p: { ra1: 120, ra2: 110, la1: -100, la2: -120, lean: 6 } },
    { f: T.stop, p: { ra1: 120, ra2: 110, la1: -100, la2: -120, lean: 6 } },
    { f: T.stop + 3, p: { ra1: 40, ra2: 10, la1: -40, la2: -10, lean: -4 } },
  ];
  const walkKeys = [
    { f: 0, p: { ra1: 120, ra2: 110, la1: -100, la2: -120, lean: 6 } },
    { f: PEAK + 12, p: { ra1: 95, ra2: 10, la1: -100, la2: -120, lean: 12 } },
    { f: PEAK + 18, p: { ra1: 120, ra2: 110, la1: -100, la2: -120, lean: 6 } },
  ];

  return (
    <Stage
      bg={<Rooftop f={f} />}
      hits={[...powerHits("clash", 0), T.double, T.hits]}
      power={11}
      cam={{ z }}
      svg={
        <>
          {fightK > 0.01 && <PowerUp kind="clash" f={f} at={0} x={LX} y={GROUND} h={185 * FS} tx={RX} layer="back" color={BLUE} rival={ORANGE} />}
          {fightK > 0.01 && f > T.the - 2 && <PowerUp kind="clash" f={f} at={T.the} x={LX} y={GROUND} h={185 * FS} tx={RX} layer="back" color={BLUE} rival={ORANGE} />}

          {/* frame-0 fight: STAND vs WALK + sugar meter */}
          {fightK > 0.01 && (
            <g opacity={fightK}>
              <Meter f={f} v={meterV} />
              <Actor f={f} color={BLUE} scale={FS} label="STAND" face="angry" base={{ x: LX, y: FGY }} facing={1} keys={standKeys} mod={(t, q) => addPose(q, idle(t, 3))}>
                {(j) => <Gloves j={j} color={BLUE} />}
              </Actor>
              <Actor
                f={f}
                color={ORANGE}
                scale={FS}
                label="WALK"
                face="angry"
                base={{ x: RX, y: FGY }}
                facing={-1}
                keys={walkKeys}
                mod={(t, q) => (t >= T.walk && t < T.r1 ? addPose({ ...q, x: q.x - Math.min(80, (t - T.walk) * 1.5) }, walkCycle(t, 0.3), false) : addPose(q, idle(t, 7)))}
              >
                {(j) => <Gloves j={j} color={ORANGE} />}
              </Actor>
              {f >= T.stop && f < T.walk + 4 && (
                <g transform={`translate(${LX} ${GROUND - 330}) scale(${pop(f, T.stop)})`}>
                  <rect x={-90} y={-36} width={180} height={64} rx={10} fill={SUGAR} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill="#fff">
                    STOP.
                  </text>
                </g>
              )}
              {f >= T.double && f < T.r1 && <Burst x={390 + 280 * meterV - 140} y={700} at={T.double} f={f} size={240} color="#3aa35b" />}
            </g>
          )}

          {/* ROUND 1: SIT vs STAND */}
          {r1K > 0.01 && (
            <g opacity={r1K}>
              <Bell f={f} at={T.r1} n="1" />
              {/* chair + SIT */}
              <g transform={`translate(${LX} ${GROUND})`}>
                <rect x={-60} y={-120} width={120} height={16} fill="#8a5a2b" stroke={INK} strokeWidth={4} />
                <rect x={30} y={-230} width={16} height={126} fill="#8a5a2b" stroke={INK} strokeWidth={4} />
                <line x1={-50} y1={-104} x2={-50} y2={0} stroke={INK} strokeWidth={8} />
                <line x1={40} y1={-104} x2={40} y2={0} stroke={INK} strokeWidth={8} />
              </g>
              <Actor
                f={f}
                color={COL.grey}
                scale={FS}
                label="SIT"
                face="sad"
                base={{ x: LX - 10, y: GROUND - 120 - 92.5 * FS * 0.55 }}
                facing={1}
                keys={[{ f: 0, p: { ll1: -85, ll2: 85, rl1: -80, rl2: 80, ra1: 20, la1: -20 } }]}
                mod={(t, q) => addPose(q, idle(t, 1))}
              />
              <Actor f={f} color={BLUE} scale={FS} label="STAND" face="happy" base={{ x: RX, y: FGY }} facing={-1} keys={[{ f: 0, p: { ra1: 40, la1: -40 } }, { f: T.sitting, p: { ra1: 150, ra2: 20, la1: -40 } }]} mod={(t, q) => addPose(q, idle(t, 5))} />
              <Drop y={720} v={0.31} max={0.8} label="SUGAR DROP vs SITTING" num="−0.31" color={BLUE} k={interpolate(f, [T.sitting, T.sitting + 8], [0, 1], clamp)} />
              {f >= T.little && (
                <text x={390} y={GROUND - 420} textAnchor="middle" fontFamily={FONT.comic} fontSize={60} fill={BLUE} stroke="#fff" strokeWidth={8} paintOrder="stroke" transform={`rotate(-4 390 ${GROUND - 420})`}>
                  A LITTLE.
                </text>
              )}
            </g>
          )}

          {/* ROUND 2: WALK steps in */}
          {r2K > 0.01 && (
            <g opacity={r2K}>
              <Bell f={f} at={T.r2} n="2" />
              <Drop y={720} v={0.31} max={0.8} label="STAND" num="−0.31" color={BLUE} k={1} />
              <Drop y={870} v={interpolate(f, [T.walking, T.hits + 4], [0, 0.72], { ...clamp, easing: Easing.out(Easing.back(1.4)) })} max={0.8} label="WALK" num="−0.72" color={ORANGE} k={interpolate(f, [T.walking - 4, T.walking], [0, 1], clamp)} />
              {f >= T.twice && (
                <g transform={`translate(540 1010) scale(${pop(f, T.twice)}) rotate(-6)`}>
                  <rect x={-120} y={-50} width={240} height={96} rx={14} fill={SUN} {...K} strokeWidth={6} />
                  <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={80} fill={INK}>
                    2.3×
                  </text>
                </g>
              )}
              <Actor
                f={f}
                color={ORANGE}
                scale={FS}
                label="WALK"
                face="happy"
                base={{ x: 300, y: FGY }}
                facing={1}
                keys={[{ f: 0, p: {} }, { f: T.hits, p: { ra1: 95, ra2: 0, lean: 10 } }, { f: T.hits + 8, p: { ra1: 150, ra2: 20, la1: -150, la2: -20 } }]}
                mod={(t, q) => (t < T.hits ? addPose({ ...q, x: q.x - 160 + (t - T.r2) * 1.9 }, walkCycle(t, 0.3), false) : addPose(q, idle(t, 4)))}
              >
                {(j) => <Gloves j={j} color={ORANGE} />}
              </Actor>
              {f >= T.hits && <Burst x={420} y={GROUND - 240} at={T.hits} f={f} size={260} color={ORANGE} />}
              <text x={390} y={GROUND - 12} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={26} fill={INK}>
                effect size vs sitting · 7 lab trials (Buffey 2022)
              </text>
            </g>
          )}

          {/* WHY: leg muscles pull sugar out of the blood */}
          {whyK > 0.01 && (
            <g opacity={whyK}>
              {/* blood vessel */}
              <g transform={`translate(0 ${interpolate(whyK, [0, 1], [30, 0])})`}>
                <rect x={60} y={700} width={680} height={120} rx={60} fill="#f6b3ad" {...K} strokeWidth={6} />
                <text x={110} y={680} fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={INK}>
                  BLOOD
                </text>
                {Array.from({ length: 9 }, (_, i) => {
                  const st = T.pull + i * 4;
                  const p = interpolate(f, [st, st + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
                  const x0 = 120 + i * 70;
                  const x = x0 + (420 - x0) * p;
                  const y = 760 + (1060 - 760) * p;
                  return p < 0.98 ? <rect key={i} x={x - 14} y={y - 14} width={28} height={28} fill="#fff" stroke={INK} strokeWidth={4} transform={`rotate(${i * 20 + f * 3} ${x} ${y})`} /> : null;
                })}
              </g>
              {/* giant leg with muscle */}
              <g transform={`translate(400 1100) scale(${pop(f, T.leg - 4) * 1.5})`}>
                <path d="M -60 -160 Q -110 -40 -60 80 L 60 80 Q 100 -40 60 -160 Z" fill={ORANGE} {...K} strokeWidth={7} />
                <ellipse cx={0} cy={-40} rx={52} ry={90} fill="#ff6b5b" opacity={0.5 + 0.4 * Math.abs(Math.sin(f / 4))} stroke={INK} strokeWidth={4} />
                <text y={-30} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#fff" stroke={INK} strokeWidth={4} paintOrder="stroke">
                  MUSCLE
                </text>
              </g>
            </g>
          )}

          {/* one lab study: strolls every 20 min, curve shrinks ~1/4 */}
          {labK > 0.01 && (
            <g opacity={labK}>
              {/* timeline with walk icons */}
              <g transform="translate(90 690)">
                <line x1={0} y1={0} x2={640} y2={0} stroke={INK} strokeWidth={6} />
                {Array.from({ length: 6 }, (_, i) => (
                  <g key={i} transform={`translate(${60 + i * 105} 0) scale(${pop(f, T.strolls + i * 4)})`}>
                    <circle r={30} fill={ORANGE} {...K} strokeWidth={4} />
                    <text y={11} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill="#fff">
                      2m
                    </text>
                  </g>
                ))}
                <text x={320} y={78} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={INK} opacity={interpolate(f, [T.twenty, T.twenty + 6], [0, 1], clamp)}>
                  EVERY 20 MINUTES
                </text>
              </g>
              {/* glucose curves */}
              <rect x={60} y={830} width={700} height={440} rx={20} fill="#fff" {...K} strokeWidth={6} opacity={0.95} />
              <g transform="translate(90 1220)">
                <path d="M 0 0 C 120 -330 260 -330 400 -140 S 560 -20 640 -10 L 640 0 Z" fill={SUGAR} opacity={0.35} stroke={SUGAR} strokeWidth={5} />
                <path
                  d={`M 0 0 C 120 ${-330 * interpolate(f, [T.cut, T.quarter], [1, 0.75], clamp)} 260 ${-330 * interpolate(f, [T.cut, T.quarter], [1, 0.75], clamp)} 400 ${-140 * interpolate(f, [T.cut, T.quarter], [1, 0.75], clamp)} S 560 -20 640 -10 L 640 0 Z`}
                  fill="#3aa35b"
                  opacity={interpolate(f, [T.cut - 6, T.cut], [0, 0.85], clamp)}
                  stroke="#1f6e3a"
                  strokeWidth={5}
                />
                <line x1={0} y1={0} x2={660} y2={0} stroke={INK} strokeWidth={6} />
                <text x={460} y={-240} fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={SUGAR}>
                  SITTING
                </text>
                <text x={460} y={-200} fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#1f6e3a" opacity={interpolate(f, [T.cut, T.cut + 6], [0, 1], clamp)}>
                  + STROLLS
                </text>
                {f >= T.quarter && (
                  <g transform={`translate(200 -340) scale(${pop(f, T.quarter)})`}>
                    <rect x={-130} y={-56} width={260} height={100} rx={14} fill={SUN} {...K} strokeWidth={6} />
                    <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={78} fill={INK}>
                      ≈ −¼
                    </text>
                  </g>
                )}
              </g>
              <text x={410} y={1258} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={26} fill={INK}>
                Dunstan 2012 · 19 adults · 5 h in a lab
              </text>
            </g>
          )}

          {/* caveat card */}
          {cavK > 0.01 && (
            <g opacity={cavK} transform={`translate(400 900) scale(${pop(f, T.short - 2)}) rotate(-2)`}>
              <rect x={-320} y={-210} width={640} height={420} rx={20} fill="#fff" {...K} strokeWidth={8} />
              <rect x={-320} y={-210} width={640} height={90} rx={20} fill={ROPE} {...K} strokeWidth={8} />
              <text y={-148} textAnchor="middle" fontFamily={FONT.comic} fontSize={62} fill="#fff">
                THE FINE PRINT
              </text>
              {["SHORT LAB STUDIES", "ONE DAY · REPEATED BREAKS", "NOT A DIABETES TREATMENT"].map((l, i) => (
                <text key={i} y={-40 + i * 80} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={i === 2 ? SUGAR : INK} opacity={interpolate(f, [T.short + i * 10, T.short + i * 10 + 5], [0, 1], clamp)}>
                  {l}
                </text>
              ))}
            </g>
          )}

          {/* payoff: after lunch, 2 min every ~30 min */}
          {payK > 0.01 && (
            <g opacity={payK}>
              <g transform={`translate(560 760) scale(${pop(f, T.so - 2)})`}>
                <circle r={150} fill="#fff" {...K} strokeWidth={8} />
                {[0, 1].map((h) => (
                  <path key={h} d={`M 0 0 L 0 -150 A 150 150 0 0 1 0 150 Z`} fill={h === 0 ? "#ffe9a8" : "none"} transform={`rotate(${h * 180})`} opacity={h === 0 ? interpolate(f, [T.half - 6, T.half + 4], [0, 1], clamp) : 0} />
                ))}
                {Array.from({ length: 12 }, (_, i) => (
                  <line key={i} x1={0} y1={-130} x2={0} y2={-112} stroke={INK} strokeWidth={5} transform={`rotate(${i * 30})`} />
                ))}
                <line x1={0} y1={0} x2={0} y2={-110} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${interpolate(f, [T.so, T.the], [0, 180], clamp)})`} />
                <circle r={10} fill={INK} />
                <text y={210} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={INK}>
                  AFTER LUNCH
                </text>
              </g>
              <Actor
                f={f}
                color={ORANGE}
                scale={1.2}
                label="YOU"
                face="happy"
                base={{ x: 200, y: GROUND - 92.5 * 1.2 }}
                facing={1}
                keys={[{ f: 0, p: {} }]}
                mod={(t, q) => addPose({ ...q, x: q.x + ((t - T.so) * 2.2) % 420 }, walkCycle(t, 0.28), false)}
              />
            </g>
          )}

          {/* SPARK — ring announcer, right side facing left */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={-1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={-1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = addPose(addPose(q, hop(t, PEAK, 30)), hop(t, T.twice, 36));
              q = addPose(addPose(q, shake(t, T.not)), nod(t, T.half));
              return q;
            }}
          />
          {fightK > 0.01 && <PowerUp kind="clash" f={f} at={0} x={LX} y={GROUND} h={185 * FS} tx={RX} layer="front" />}
          {fightK > 0.01 && f > T.the - 2 && <PowerUp kind="clash" f={f} at={T.the} x={LX} y={GROUND} h={185 * FS} tx={RX} layer="front" />}
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", left: 80, top: 236, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: INK, letterSpacing: 2, opacity: 0.8 }}>HIDDEN MECHANISM · HACK H04</div>
          <div style={{ position: "absolute", left: 540, top: 1745, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 26, color: INK, background: "rgba(255,255,255,0.85)", padding: "4px 16px", borderRadius: 8, whiteSpace: "nowrap" }}>
            Education, not medical advice
          </div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 430, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, lineHeight: 1, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill" }}>
                <span style={{ color: ORANGE }}>WALK</span> <span style={{ color: "#fff", fontSize: 100 }}>vs</span> <span style={{ color: BLUE }}>STAND</span>
              </div>
              <div style={{ display: "inline-block", marginTop: 6, background: SUN, color: INK, padding: "2px 26px", fontFamily: FONT.comic, fontSize: 72, border: `6px solid ${INK}` }}>AFTER LUNCH</div>
            </div>
          )}
          <Slam f={f} at={T.walk} out={T.r1 - 4} x={540} y={430} size={104} color={ORANGE} stroke={`9px ${INK}`} rotate={-2}>
            {f >= T.double ? "MORE THAN 2×" : "2-MIN WALK…"}
          </Slam>
          <Slam f={f} at={T.r1} out={T.r2 - 4} x={540} y={430} size={96} color={BLUE} stroke={`9px #fff`} rotate={2}>
            STAND vs SIT
          </Slam>
          <Slam f={f} at={T.r2} out={T.why - 4} x={540} y={430} size={104} color={ORANGE} stroke={`9px ${INK}`} rotate={-2}>
            WALK STEPS IN
          </Slam>
          <Slam f={f} at={T.why} out={T.inOne - 4} x={540} y={430} size={96} color={SUGAR} stroke={`9px #fff`} rotate={2}>
            MUSCLES PULL SUGAR
          </Slam>
          <Slam f={f} at={T.inOne} out={T.short - 4} x={540} y={430} size={96} color="#1f6e3a" stroke={`9px #fff`} rotate={-2}>
            2-MIN STROLLS
          </Slam>
          <Slam f={f} at={T.so} out={T.the - 4} x={540} y={430} size={92} color={ORANGE} stroke={`9px ${INK}`} rotate={2}>
            2 MIN · EVERY ~30 MIN
          </Slam>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["stand", "lunch?", "stop.", "walk", "double.", "standing", "sitting.", "little.", "walking", "twice", "muscles", "sugar", "blood.", "twenty", "quarter.", "diabetes", "stroll", "half", "dips—"]}
          />
        </>
      }
    />
  );
};
