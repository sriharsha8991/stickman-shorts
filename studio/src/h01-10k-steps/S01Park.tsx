import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H01 · 10,000 steps came from a pedometer, not a study. Myth vs Reality on a sunrise walking path.
// YOU (orange) walks under a giant step counter stuck on 9,999 / 10,000 → "MISSED". Spark traces the
// number to a 1965 pedometer ("MANPO-KEI" = 10,000-steps meter), stamps MYTH, then a hard wipe to
// REALITY: 57 studies, a risk curve that drops to −47% at ~7,000 and flattens (wow + aha). Payoff:
// the goal becomes 7,000 ✓, "links, not guarantees", and it ends back on 9,999 (loop).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const fmtK = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.5;
const YGY = GROUND - 92.5 * YS;
const YX = 640;
const SKY_TOP = "#7cc6e8";
const LEAF = "#2d9d6a";
const BAD = "#e5484d";

// --- background: sunrise park --------------------------------------------------------
const Park: React.FC<{ f: number; walk: number }> = ({ f, walk }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h1sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY_TOP} />
          <stop offset="55%" stopColor="#cfe9f2" />
          <stop offset="100%" stopColor="#ffe2b8" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h1sky)" />
      <circle cx={880} cy={980 - Math.min(60, f * 0.05)} r={90} fill="#ffd166" opacity={0.95} />
      <circle cx={880} cy={980 - Math.min(60, f * 0.05)} r={130} fill="#ffd166" opacity={0.25} />
      {/* clouds drift */}
      {[0, 1, 2].map((i) => {
        const x = ((120 + i * 380 - f * (0.4 + i * 0.15)) % 1300 + 1300) % 1300 - 110;
        return (
          <g key={i} transform={`translate(${x} ${700 + i * 70})`} opacity={0.85}>
            <ellipse rx={80} ry={26} fill="#fff" />
            <ellipse cx={-40} cy={-14} rx={40} ry={24} fill="#fff" />
            <ellipse cx={30} cy={-20} rx={46} ry={30} fill="#fff" />
          </g>
        );
      })}
      {/* hills */}
      <path d={`M 0 1100 Q 260 980 520 1080 Q 800 1180 1080 1040 L 1080 ${GROUND} L 0 ${GROUND} Z`} fill="#95d5b2" />
      <path d={`M 0 1180 Q 300 1120 620 1190 Q 860 1240 1080 1170 L 1080 ${GROUND} L 0 ${GROUND} Z`} fill="#74c69d" />
      {/* trees scroll slowly with the walk */}
      {[0, 1, 2, 3].map((i) => {
        const x = ((i * 330 - walk * 0.35) % 1320 + 1320) % 1320 - 120;
        return (
          <g key={i} transform={`translate(${x} ${1200})`}>
            <rect x={-10} y={-20} width={20} height={70} fill="#7f5539" />
            <circle cy={-60} r={56} fill={LEAF} {...K} strokeWidth={4} />
          </g>
        );
      })}
      {/* path + grass */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#52b788" />
      <rect x={0} y={GROUND - 6} width={1080} height={70} fill="#e9d8a6" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = ((i * 150 - walk) % 1350 + 1350) % 1350 - 120;
        return <rect key={i} x={x} y={GROUND + 22} width={70} height={10} rx={5} fill="#d4b483" />;
      })}
      <line x1={0} y1={GROUND - 6} x2={1080} y2={GROUND - 6} stroke={COL.ink} strokeWidth={5} />
      {Array.from({ length: 14 }, (_, i) => (
        <path
          key={i}
          d={`M ${40 + random(`g${i}`) * 1000} ${1420 + random(`h${i}`) * 420} l -8 -22 m 8 22 l 6 -26 m -6 26 l 14 -18`}
          stroke="#2d6a4f"
          strokeWidth={4}
          fill="none"
        />
      ))}
    </svg>
  </AbsoluteFill>
);

// --- the step counter (title zone) -----------------------------------------------------
const Counter: React.FC<{ steps: number; goal: number; status: "missed" | "hit" | "none"; s: number; o: number; f: number }> = ({ steps, goal, status, s, o, f }) => {
  const k = Math.min(1, steps / goal);
  const R = 74;
  const col = status === "hit" ? LEAF : status === "missed" ? BAD : COL.ink;
  return (
    <g opacity={o} transform={`translate(540 430) scale(${s})`}>
      <rect x={-394} y={-134} width={800} height={268} rx={56} fill={COL.ink} />
      <rect x={-400} y={-140} width={800} height={268} rx={56} fill="#fff" {...K} />
      <circle cx={-270} cy={-6} r={R} fill="none" stroke="#e6ecef" strokeWidth={22} />
      <circle
        cx={-270}
        cy={-6}
        r={R}
        fill="none"
        stroke={col}
        strokeWidth={22}
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * R}
        strokeDashoffset={2 * Math.PI * R * (1 - k)}
        transform="rotate(-90 -270 -6)"
      />
      {/* shoe icon */}
      <path d="M -300 6 Q -300 -26 -280 -26 L -262 -6 Q -236 -2 -232 14 L -300 14 Z" fill={col} />
      <text x={-150} y={-60} fontFamily={FONT.title} fontWeight={800} fontSize={40} fill="#7a8a90" letterSpacing={6}>
        STEPS TODAY
      </text>
      <text x={-150} y={40} fontFamily={FONT.title} fontWeight={900} fontSize={120} fill={COL.ink}>
        {fmtK(steps)}
      </text>
      <text x={-150} y={98} fontFamily={FONT.title} fontWeight={800} fontSize={44} fill="#7a8a90">
        GOAL {fmtK(goal)}
      </text>
      {status !== "none" && (
        <g transform={`translate(270 70) rotate(-6)`} opacity={status === "missed" ? 0.75 + 0.25 * Math.sin(f * 0.3) : 1}>
          <rect x={-112} y={-36} width={224} height={72} rx={36} fill={col} {...K} strokeWidth={5} />
          <text y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill="#fff" letterSpacing={2}>
            {status === "missed" ? "MISSED ✗" : "DONE ✓"}
          </text>
        </g>
      )}
    </g>
  );
};

// --- the 1965 pedometer (generic, no brand) --------------------------------------------
const Pedometer: React.FC<{ f: number; s: number }> = ({ f, s }) => {
  const needle = -120 + ((f * 9) % 240);
  return (
    <g transform={`scale(${s})`}>
      <rect x={-34} y={-238} width={68} height={60} rx={12} fill="#b8b2a7" {...K} strokeWidth={5} />
      <rect x={-160} y={-190} width={320} height={380} rx={60} fill="#f1e9d2" {...K} strokeWidth={7} />
      <circle cy={-40} r={112} fill="#fffaf0" {...K} strokeWidth={6} />
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((-120 + i * 24) * Math.PI) / 180;
        return <line key={i} x1={Math.sin(a) * 84} y1={-40 - Math.cos(a) * 84} x2={Math.sin(a) * 100} y2={-40 - Math.cos(a) * 100} stroke={COL.ink} strokeWidth={i % 5 === 0 ? 6 : 3} />;
      })}
      <line x1={0} y1={-40} x2={Math.sin((needle * Math.PI) / 180) * 80} y2={-40 - Math.cos((needle * Math.PI) / 180) * 80} stroke={BAD} strokeWidth={6} strokeLinecap="round" />
      <circle cy={-40} r={10} fill={COL.ink} />
      <rect x={-120} y={100} width={240} height={60} rx={12} fill="#c0392b" {...K} strokeWidth={5} />
      <text y={144} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill="#fff" letterSpacing={3}>
        MANPO-KEI
      </text>
    </g>
  );
};

// --- the risk curve (shape simplified; anchors: 100% at 2k, −47% at 7k) -----------------
const CX0 = 360;
const CX1 = 960;
const CY0 = 760;
const CYB = 1200;
const sx = (steps: number) => CX0 + ((steps - 2000) / 10000) * (CX1 - CX0);
const risk = (steps: number) => 100 * (0.5 + 0.5 * Math.exp(-(steps - 2000) / 1900));
const ry = (r: number) => CY0 + ((100 - r) / 60) * (CYB - 60 - CY0);

// --- sfx --------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  ...[0, 14, 28, 42, 56, 70].map((t): SfxCue => [t, "tick", 0.25]),
  [W(0, 9), "buzz", 0.5],
  [W(1, 3), "pop", 0.45],
  [W(1, 4), "stamp", 0.5],
  [W(2, 6), "whoosh", 0.4],
  [W(2, 6) + 12, "thud", 0.6],
  [W(2, 8), "slam", 0.5],
  [W(3, 1), "pop", 0.45],
  [W(3, 3), "pop", 0.45],
  [W(3, 4), "pop", 0.45],
  [W(4, 6), "stamp", 0.7],
  [C(5), "whoosh_long", 0.5],
  [C(5) + 4, "stinger", 0.4],
  [W(5, 7), "page", 0.5],
  [W(5, 7) + 8, "thud", 0.45],
  [C(6), "swish", 0.4],
  [W(6, 6), "pop", 0.4],
  [C(7), "riser", 0.4],
  [W(7, 3), "impact", 0.75],
  [C(8), "swish", 0.4],
  [W(8, 6), "ding", 0.55],
  [W(9, 5), "kaching", 0.4],
  [W(9, 5) + 2, "gold", 0.35],
  [W(10, 2), "clink", 0.4],
  ...[0, 8, 16, 24, 32, 40, 48, 56].map((t): SfxCue => [W(11, 5) + t, "tick", 0.3]),
];

export const S01Park: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const failed = W(0, 9);
  const notStudy = W(1, 4);
  const ped = W(2, 6);
  const year = W(2, 8);
  const tr = [W(3, 1), W(3, 3), W(3, 4)];
  const myth = W(4, 6);
  const wipe = C(5);
  const pile = W(5, 7);
  const chart = C(6);
  const two = W(6, 6);
  const hit = W(7, 3);
  const flat = W(8, 6);
  const back = C(9);
  const done = W(9, 5);
  const every = W(9, 6);
  const links = C(10);
  const end = C(11);
  const tick0 = W(11, 5);

  // phases
  const awayK = interpolate(f, [C(2) - 4, C(2) + 8, back - 8, back + 4], [0, 1, 1, 0], clamp); // YOU + counter step aside
  const pedK = interpolate(f, [ped, ped + 12, wipe - 2, wipe + 6], [0, 1, 1, 0], clamp);
  const pedY = interpolate(f, [ped, ped + 12], [-900, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const wipeX = interpolate(f, [wipe - 4, wipe + 10], [-1200, 1200], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pileK = interpolate(f, [pile, pile + 10, chart - 4, chart + 4], [0, 1, 1, 0], clamp);
  const chartK = interpolate(f, [chart - 2, chart + 8, back - 8, back + 2], [0, 1, 1, 0], clamp);
  const curveT = interpolate(f, [chart + 4, C(7) - 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const flatT = interpolate(f, [C(8), flat + 6], [0, 1], clamp);

  // walking: the background scrolls while YOU walks (not during the chart)
  const walking = (t: number) => (t < failed - 4 || (t >= every && t < links) || t >= end ? 1 : 0);
  let walk = 0;
  for (let t = 0; t < f; t += 1) walk += walking(t) * 5;

  // counter
  const counter = (() => {
    if (f < C(2)) return { steps: 9999, goal: 10000, status: "missed" as const };
    if (f < end) return { steps: Math.round(interpolate(f, [back + 4, done], [6400, 7214], clamp)), goal: 7000, status: f >= done ? ("hit" as const) : ("none" as const) };
    return { steps: Math.round(interpolate(f, [tick0, VOICE_FRAMES - 4], [9930, 9999], clamp)), goal: 10000, status: f >= W(11, 4) ? ("missed" as const) : ("none" as const) };
  })();
  const counterO = 1 - awayK;
  const counterS = f >= back && f < end ? (f >= done ? pop(f, done) : 1) : f >= end ? 1 : 1;

  const youKeys: Key[] = [
    { f: 0, p: {} },
    { f: failed - 3, p: {} },
    { f: failed + 4, p: { ...P.sad }, e: SNAP },
    { f: C(2) - 2, p: { ...P.sad } },
    { f: back + 4, p: {} },
    { f: done - 2, p: {} },
    { f: done + 5, p: { ...P.cheer, y: YGY - 40 }, e: SNAP },
    { f: every - 2, p: { ...P.cheer, y: YGY - 40 } },
    { f: every + 6, p: {} },
    { f: W(11, 4) - 2, p: {} },
    { f: W(11, 4) + 6, p: { ...P.facepalm } },
    { f: tick0 + 6, p: {} },
  ];

  const sparkMood = (t: number): Mood =>
    t >= failed && t < C(1) ? "sad" : t >= myth && t < wipe ? "smug" : t >= hit && t < C(8) ? "shock" : t >= flat && t < back ? "happy" : t >= back && t < links ? "happy" : t >= W(11, 4) ? "smug" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, flat, 40), bulbPulse(t, notStudy, 14) * 0.5);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 140 } },
    { f: failed - 2, p: { ...P.pointR, ra1: 140 } },
    { f: failed + 4, p: { ...P.shrug }, e: SNAP },
    { f: C(1) + 2, p: { ...P.shrug } },
    { f: C(1) + 8, p: { ...P.think } },
    { f: notStudy - 2, p: { ...P.think } },
    { f: notStudy + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // finger up
    { f: ped - 2, p: { ra1: 150, ra2: -10, la1: -18 } },
    { f: ped + 14, p: { ...P.shock }, e: SNAP }, // pedometer lands
    { f: year + 6, p: { ...P.shock } },
    { f: tr[0] - 2, p: { ...P.pointR, ra1: 130 } },
    { f: tr[2] + 10, p: { ...P.pointR, ra1: 130 } },
    { f: myth - 2, p: { ...P.pointR, ra1: 120 } },
    { f: myth + 4, p: { ...P.shrug }, e: SNAP },
    { f: wipe - 2, p: { ...P.shrug } },
    { f: wipe + 8, p: { ...P.think } },
    { f: chart + 2, p: { ...P.think } },
    { f: chart + 10, p: { ...P.pointR, ra1: 110 } }, // at the curve
    { f: hit - 2, p: { ...P.pointR, ra1: 110 } },
    { f: hit + 3, p: { ...P.shock }, e: SNAP },
    { f: C(8) + 2, p: { ...P.shock } },
    { f: C(8) + 10, p: { ...P.pointR, ra1: 100 } },
    { f: flat - 2, p: { ...P.pointR, ra1: 100 } },
    { f: flat + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // aha
    { f: back - 2, p: { ra1: 150, ra2: -10, la1: -18 } },
    { f: back + 6, p: { ...P.pointR, ra1: 140 } },
    { f: done - 2, p: { ...P.pointR, ra1: 140 } },
    { f: done + 4, p: { ...P.cheer }, e: SNAP },
    { f: links - 2, p: { ...P.cheer } },
    { f: links + 6, p: { ...P.shrug } },
    { f: end, p: { ...P.shrug } },
    { f: end + 8, p: { ...P.pointR, ra1: 140 } },
  ];

  const z = punch(f, [failed, notStudy, ped + 12, myth, wipe + 4, hit, flat, done, W(11, 4)], 0.035);

  // curve path drawn up to curveT
  const curvePts = Array.from({ length: 61 }, (_, i) => 2000 + (i / 60) * 10000).filter((s) => (s - 2000) / 10000 <= curveT + 1e-6);
  const d = curvePts.map((s, i) => `${i ? "L" : "M"} ${sx(s).toFixed(1)} ${ry(risk(s)).toFixed(1)}`).join(" ");
  const flatPts = Array.from({ length: 31 }, (_, i) => 7000 + (i / 30) * 5000 * flatT);
  const dFlat = flatPts.map((s, i) => `${i ? "L" : "M"} ${sx(s).toFixed(1)} ${ry(risk(s)).toFixed(1)}`).join(" ");
  const pct = Math.round(interpolate(f, [C(7), hit], [0, 47], { ...clamp, easing: Easing.in(Easing.quad) }));

  return (
    <Stage
      bg={<Park f={f} walk={walk} />}
      hits={[failed, ped + 12, myth, hit, done]}
      power={11}
      cam={{ z }}
      svg={
        <>
          <Counter steps={counter.steps} goal={counter.goal} status={counter.status} s={counterS} o={counterO} f={f} />

          {/* footprints on "every step still counts" */}
          {f >= every &&
            f < links + 20 &&
            [0, 1, 2, 3, 4].map((i) => (
              <ellipse
                key={i}
                cx={360 + i * 120}
                cy={GROUND + 26 + (i % 2) * 14}
                rx={22}
                ry={11}
                fill="#7f5539"
                opacity={interpolate(f, [every + i * 4, every + i * 4 + 4, links + 10, links + 20], [0, 0.8, 0.8, 0], clamp)}
              />
            ))}

          {/* YOU walks (steps aside for the history + science) */}
          <Actor
            f={f}
            color={COL.orange}
            scale={YS}
            label="YOU"
            face={f >= failed && f < C(2) ? "sad" : f >= done && f < end ? "happy" : "eyes"}
            base={{ x: YX, y: YGY }}
            keys={youKeys}
            opacity={1 - awayK}
            mod={(t, p) => (walking(t) ? addPose(p, walkCycle(t, 0.28)) : addPose(p, idle(t, 4)))}
          />

          {/* the 1965 pedometer */}
          {pedK > 0.01 && (
            <g opacity={pedK} transform={`translate(700 ${930 + pedY})`}>
              <Pedometer f={f} s={1} />
            </g>
          )}
          {f >= ped + 12 && f < ped + 32 && <Burst x={700} y={1100} at={ped + 12} f={f} size={200} color={COL.yellow} />}

          {/* REALITY: the pile of 57 studies */}
          {pileK > 0.01 && (
            <g opacity={pileK}>
              {Array.from({ length: 12 }, (_, i) => {
                const yy = interpolate(f, [pile + i, pile + i + 6], [-700, 0], { ...clamp, easing: Easing.in(Easing.quad) });
                return (
                  <g key={i} transform={`translate(${650 + (random(`p${i}`) - 0.5) * 30} ${1250 - i * 26 + yy}) rotate(${(random(`r${i}`) - 0.5) * 8})`}>
                    <rect x={-150} y={-12} width={300} height={24} rx={4} fill={i % 3 === 0 ? "#fff" : "#f4f1ea"} {...K} strokeWidth={4} />
                  </g>
                );
              })}
            </g>
          )}

          {/* REALITY: the curve */}
          {chartK > 0.01 && (
            <g opacity={chartK}>
              <rect x={300} y={700} width={720} height={590} rx={26} fill="rgba(255,255,255,0.92)" {...K} />
              <line x1={CX0} y1={CYB} x2={CX1 + 20} y2={CYB} stroke={COL.ink} strokeWidth={5} />
              <line x1={CX0} y1={CY0 - 30} x2={CX0} y2={CYB} stroke={COL.ink} strokeWidth={5} />
              {[2000, 4000, 7000, 10000, 12000].map((s) => (
                <g key={s}>
                  <line x1={sx(s)} y1={CYB} x2={sx(s)} y2={CYB + 12} stroke={COL.ink} strokeWidth={4} />
                  <text x={sx(s)} y={CYB + 52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={s === 7000 ? LEAF : COL.ink}>
                    {s / 1000}K
                  </text>
                </g>
              ))}
              <text x={CX0 + 14} y={CY0 - 20} fontFamily={FONT.title} fontWeight={800} fontSize={32} fill="#5c6b70" letterSpacing={2}>
                RISK OF EARLY DEATH
              </text>
              <path d={d} stroke={BAD} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {flatT > 0 && <path d={dFlat} stroke="#f2c12e" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.85} />}
              {f >= two && <circle cx={sx(2000)} cy={ry(100)} r={14 * pop(f, two)} fill={COL.ink} />}
              {curveT >= 0.5 && f >= W(6, 0) && <circle cx={sx(7000)} cy={ry(risk(7000))} r={18 * pop(f, Math.max(W(6, 0), chart + 4 + Math.round((C(7) - chart - 8) * 0.5)))} fill={LEAF} {...K} strokeWidth={4} />}
              {f >= C(7) && (
                <g>
                  <line x1={sx(2000)} y1={ry(100)} x2={sx(7000) + 30} y2={ry(100)} stroke="#9aa5a9" strokeWidth={4} strokeDasharray="10 10" />
                  <path d={`M ${sx(7000)} ${ry(100) + 10} L ${sx(7000)} ${ry(risk(7000)) - 26}`} stroke={LEAF} strokeWidth={8} markerEnd="" />
                  <path d={`M ${sx(7000) - 16} ${ry(risk(7000)) - 44} L ${sx(7000)} ${ry(risk(7000)) - 24} L ${sx(7000) + 16} ${ry(risk(7000)) - 44}`} stroke={LEAF} strokeWidth={8} fill="none" strokeLinecap="round" />
                  <text x={sx(7000) + 64} y={ry(78)} fontFamily={FONT.comic} fontSize={110} fill={LEAF} stroke={COL.ink} strokeWidth={5} paintOrder="stroke">
                    −{pct}%
                  </text>
                </g>
              )}
              {f >= hit && f < hit + 22 && <Burst x={sx(7000) + 140} y={ry(78) - 40} at={hit} f={f} size={220} color={LEAF} />}
            </g>
          )}

          {/* the wipe (hard cut to reality) */}
          {f >= wipe - 4 && f < wipe + 12 && <rect x={wipeX} y={0} width={1200} height={1920} fill={COL.ink} />}

          {/* SPARK */}
          <Spark f={f} scale={SS} base={{ x: 150, y: SGY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={sparkMood} look={1} keys={sparkKeys} mod={(t, p) => addPose(p, idle(t, 8))} />
        </>
      }
      html={
        <>
          {/* hook layer: readable on frame 0 */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 680,
              transform: "translate(-50%,-50%) rotate(-3deg)",
              opacity: interpolate(f, [C(1) + 10, C(1) + 18], [1, 0], clamp),
              background: COL.ink,
              color: "#fff",
              borderRadius: 16,
              padding: "6px 30px",
              fontFamily: FONT.comic,
              fontSize: 90,
              letterSpacing: 4,
              whiteSpace: "nowrap",
            }}
          >
            10,000 STEPS? SAYS WHO?
          </div>
          <Slam f={f} at={notStudy} out={ped - 4} x={540} y={680} size={120} color={BAD} stroke={`8px #fff`} rotate={-3}>
            NOT A STUDY
          </Slam>
          <Slam f={f} at={year} out={tr[0] - 4} x={540} y={420} size={190} color="#fff" stroke={`10px ${COL.ink}`}>
            JAPAN · 1965
          </Slam>
          {/* translation pills */}
          {[
            { at: tr[0], a: "MAN", b: "10,000" },
            { at: tr[1], a: "PO", b: "STEPS" },
            { at: tr[2], a: "KEI", b: "METER" },
          ].map((r, i) =>
            f >= r.at && f < wipe ? (
              <div
                key={r.a}
                style={{
                  position: "absolute",
                  left: 540,
                  top: 320 + i * 100,
                  transform: `translate(-50%,-50%) scale(${pop(f, r.at)})`,
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  fontFamily: FONT.title,
                  fontWeight: 900,
                  fontSize: 70,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ background: "#c0392b", color: "#fff", padding: "0 22px", borderRadius: 14, border: `5px solid ${COL.ink}` }}>{r.a}</span>
                <span style={{ color: COL.ink }}>=</span>
                <span style={{ background: "#fff", color: COL.ink, padding: "0 22px", borderRadius: 14, border: `5px solid ${COL.ink}` }}>{r.b}</span>
              </div>
            ) : null,
          )}
          {f >= myth && f < wipe && <Stamp f={f} at={myth} x={560} y={690} text="MYTH" size={150} color={BAD} />}
          {f >= wipe && f < chart && <Stamp f={f} at={wipe + 4} x={540} y={430} text="REALITY" size={140} color={LEAF} r={-6} />}
          <Slam f={f} at={pile} out={chart - 4} x={540} y={640} size={96} color="#fff" stroke={`8px ${COL.ink}`}>
            57 STUDIES · 2025 REVIEW
          </Slam>
          <Slam f={f} at={chart} out={back - 6} x={540} y={330} size={84} color="#fff" stroke={`8px ${COL.ink}`}>
            7,000 vs 2,000 STEPS A DAY
          </Slam>
          <Slam f={f} at={C(8)} out={back - 4} x={540} y={450} size={120} color="#f2c12e" stroke={`9px ${COL.ink}`} rotate={-3}>
            THE CURVE FLATTENS
          </Slam>
          {chartK > 0.02 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 1610,
                transform: "translate(-50%,-50%)",
                opacity: chartK,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 26,
                color: "#1d3b2f",
                whiteSpace: "nowrap",
              }}
            >
              Ding et al. (2025), Lancet Public Health · linked, not proven · shape simplified
            </div>
          )}
          {pedK > 0.02 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 1610,
                transform: "translate(-50%,-50%)",
                opacity: pedK,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 26,
                color: "#1d3b2f",
                whiteSpace: "nowrap",
              }}
            >
              Origin “likely” the 1965 pedometer name · Lee et al. (2019), JAMA Intern Med
            </div>
          )}
          <Slam f={f} at={done} out={links - 4} x={540} y={680} size={110} color={LEAF} stroke={`8px #fff`} rotate={-3}>
            AIM FOR ~7,000
          </Slam>
          <Slam f={f} at={links} out={end - 4} x={540} y={680} size={78} color="#fff" stroke={`8px ${COL.ink}`}>
            LINKS, NOT GUARANTEES
          </Slam>

          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1555,
              transform: "translateX(-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 28,
              color: "#1b4332",
              whiteSpace: "nowrap",
              opacity: 0.9,
            }}
          >
            Education, not medical advice
          </div>
          <VoiceCaptions
            f={f}
            cues={VOICE_CUES}
            hi={["ten", "thousand", "failed", "study", "pedometer", "nineteen", "sixtyfive", "manpokei", "rule", "fiftyseven", "seven", "fortyseven", "modest", "links"]}
          />
        </>
      }
    />
  );
};
