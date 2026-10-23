import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle } from "../stickman/stick";
import { Actor } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V013 · "AI won't take your job…" Myth vs Reality on a mustard factory floor (charcoal floor, hazard band).
// The BOSS points at the quote (MYTH: half true). 758 mini consultants get GPT-4 (laptops glow); three bars
// grow (more, faster, better). Then a blue AI robot strolls in and TRIPS on a wire labelled TRICK TASK.
// Bar chart: NO AI 84% vs WITH AI ~60–70% → "−19 POINTS" (wow). A gold, sparkly report hides a red ✗
// (wrong but polished). COPIER (red) piles up copies; CHECKER (purple) finds the ✗ with a magnifier.
// Caveat pill + a paper plane ("the lesson travels"). ASK → CHECK → USE chips. The boss walks in again (loop).
// Dell'Acqua et al. 2023, HBS Working Paper 24-013 (758 BCG consultants, GPT-4).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) =>
  interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const WS = 1.5;
const WGY = GROUND - 92.5 * WS;
const MUSTARD = "#ffc94a";
const AIBLUE = "#2b7de9";
const BOSS = "#5b6270";
const GOLD = "#f2b705";
const RED = "#e5322d";

// --- anchors ----------------------------------------------------------------------------------------
const T = {
  job: W(0, 4),
  someone: W(0, 5),
  will: W(0, 8),
  heard: C(1),
  half: W(1, 5),
  exp: C(2),
  n758: W(2, 3),
  consult: W(2, 6),
  gpt: W(2, 8),
  most: C(3),
  more: W(3, 5),
  faster: W(3, 6),
  better: W(3, 8),
  but: C(4),
  built: W(4, 4),
  trip: W(4, 6),
  up: W(4, 9),
  there: C(5),
  nineteen: W(5, 4),
  right: W(5, 10),
  wrongAns: C(6),
  wrong: W(6, 2),
  polished: W(6, 6),
  so: C(7),
  edge: W(7, 2),
  anyone: W(7, 6),
  copy: W(7, 8),
  checking: W(8, 1),
  knowing: W(8, 2),
  aiWrong: W(8, 7),
  study: C(9),
  firm: W(9, 3),
  travels: W(9, 7),
  practise: C(10),
  checkAI: W(10, 1),
  asking: W(10, 5),
  because: C(11),
  boss: W(11, 2),
  walking: W(11, 4),
};
const LOOP = VOICE_FRAMES - 20;

// --- background: mustard factory floor ------------------------------------------------------------------
const Factory: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v13wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor={MUSTARD} />
        </linearGradient>
        <pattern id="v13haz" width="80" height="60" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
          <rect width="40" height="60" fill={COL.ink} />
          <rect x="40" width="40" height="60" fill="#ffd23f" />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#v13wall)" />
      {/* wall panels */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={i * 270} y1={180} x2={i * 270} y2={GROUND - 30} stroke="#e8ad2c" strokeWidth={6} />
      ))}
      {/* overhead pipe with rivets */}
      <rect x={0} y={150} width={1080} height={34} fill="#d98f1f" stroke={COL.ink} strokeWidth={5} />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={60 + i * 110} cy={167} r={6} fill={COL.ink} />
      ))}
      {/* slow gears in the corners */}
      {[
        [90, 700, 60, 1],
        [1010, 760, 46, -1.3],
      ].map(([x, y, r, sp], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${f * sp})`} opacity={0.35}>
          {Array.from({ length: 8 }, (_, k) => (
            <rect key={k} x={-10} y={-r - 16} width={20} height={26} fill="#c47d12" transform={`rotate(${k * 45})`} />
          ))}
          <circle r={r} fill="#c47d12" />
          <circle r={r * 0.35} fill={MUSTARD} />
        </g>
      ))}
      {/* floor */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#3a3f4b" />
      <rect x={0} y={GROUND} width={1080} height={34} fill="url(#v13haz)" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// tiny consultant with a laptop (the crowd of 758)
const Mini: React.FC<{ x: number; y: number; k: number; glow: number; c: string }> = ({ x, y, k, glow, c }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle cy={-62} r={15} fill="#fff" {...K} strokeWidth={4} />
      <line x1={0} y1={-46} x2={0} y2={-10} stroke={COL.ink} strokeWidth={5} />
      <path d="M -16 4 L 0 -10 L 16 4" fill="none" stroke={COL.ink} strokeWidth={5} />
      <rect x={-30} y={-40} width={60} height={34} rx={5} fill={glow > 0.5 ? AIBLUE : "#9aa3b2"} stroke={COL.ink} strokeWidth={4} />
      <rect x={-26} y={-36} width={52} height={26} rx={3} fill={c} opacity={glow * 0.7} />
    </g>
  ) : null;

// the AI robot (blue box on legs)
const Robot: React.FC<{ x: number; rot: number; step: number; face: "ok" | "dizzy" }> = ({ x, rot, step, face }) => (
  <g transform={`translate(${x} ${GROUND}) rotate(${rot} 40 0)`}>
    <line x1={-28} y1={-80} x2={-28 + step * 22} y2={0} stroke={COL.ink} strokeWidth={9} strokeLinecap="round" />
    <line x1={28} y1={-80} x2={28 - step * 22} y2={0} stroke={COL.ink} strokeWidth={9} strokeLinecap="round" />
    <rect x={-80} y={-230} width={160} height={150} rx={22} fill={AIBLUE} {...K} />
    <rect x={-58} y={-210} width={116} height={86} rx={12} fill="#cfe6ff" {...K} strokeWidth={5} />
    {face === "ok" ? (
      <>
        <circle cx={-24} cy={-172} r={9} fill={COL.ink} />
        <circle cx={24} cy={-172} r={9} fill={COL.ink} />
        <path d="M -20 -146 Q 0 -134 20 -146" fill="none" {...K} strokeWidth={5} />
      </>
    ) : (
      <>
        <path d="M -32 -180 L -16 -164 M -16 -180 L -32 -164 M 16 -180 L 32 -164 M 32 -180 L 16 -164" {...K} strokeWidth={5} />
        <ellipse cx={0} cy={-140} rx={10} ry={8} fill={COL.ink} />
      </>
    )}
    <line x1={0} y1={-230} x2={0} y2={-262} stroke={COL.ink} strokeWidth={6} />
    <circle cy={-268} r={10} fill="#ff5d8f" {...K} strokeWidth={4} />
    <text x={0} y={-94} textAnchor="middle" fontFamily={FONT.comic} fontSize={34} fill="#fff">
      AI
    </text>
  </g>
);

// a report page
const Report: React.FC<{ x: number; y: number; s?: number; shine: number; x2: number; r?: number }> = ({ x, y, s = 1, shine, x2, r = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${r})`}>
    <rect x={-120} y={-160} width={240} height={320} rx={14} fill="#fffdf4" stroke={shine > 0.5 ? GOLD : COL.ink} strokeWidth={shine > 0.5 ? 12 : 6} />
    <rect x={-120} y={-160} width={240} height={320} rx={14} fill="none" {...K} strokeWidth={4} />
    <rect x={-86} y={-126} width={172} height={22} rx={6} fill={AIBLUE} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={-86} y={-80 + i * 34} width={i === 4 ? 100 : 172} height={12} rx={6} fill="#c9cdd6" />
    ))}
    {x2 > 0.01 && (
      <g transform={`translate(52 92) scale(${x2})`}>
        <path d="M -36 -36 L 36 36 M 36 -36 L -36 36" stroke={RED} strokeWidth={16} strokeLinecap="round" />
      </g>
    )}
  </g>
);

const Sparkle: React.FC<{ x: number; y: number; k: number; r?: number }> = ({ x, y, k, r = 34 }) =>
  k > 0.01 ? (
    <path
      transform={`translate(${x} ${y}) scale(${k})`}
      d={`M 0 ${-r} Q 6 -6 ${r} 0 Q 6 6 0 ${r} Q -6 6 ${-r} 0 Q -6 -6 0 ${-r} Z`}
      fill="#fff6c2"
      stroke={COL.ink}
      strokeWidth={4}
    />
  ) : null;

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "stinger", 0.35],
  [T.someone, "slam", 0.55],
  [T.half, "stamp", 0.65],
  [T.heard + 30, "whoosh", 0.35],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [T.n758 + i * 3, "tick", 0.22]),
  [T.gpt, "ding", 0.45],
  [T.more, "pop", 0.4],
  [T.faster, "swish", 0.45],
  [T.better, "kaching", 0.4],
  [T.but, "boing", 0.3],
  [T.trip, "whoosh", 0.45],
  [T.up, "crash", 0.6],
  [T.there + 4, "riser", 0.4],
  [T.nineteen, "impact", 0.8],
  [T.wrong, "buzz", 0.4],
  [T.polished, "ding", 0.55],
  [T.edge, "whoosh", 0.4],
  ...Array.from({ length: 4 }, (_, i): SfxCue => [T.copy + i * 4, "page", 0.3]),
  [T.aiWrong, "stamp", 0.6],
  [T.study, "page", 0.35],
  [T.travels, "whoosh_long", 0.45],
  [T.checkAI, "pop", 0.5],
  [T.boss, "thud", 0.45],
  [LOOP, "swirl", 0.35],
];

export const S01Line: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // boss: on at the hook, walks out, walks back in at the end (loop)
  const bossX = (t: number) =>
    t < T.because
      ? interpolate(t, [T.heard + 30, T.exp + 6], [860, 1260], { ...clamp, easing: Easing.in(Easing.quad) })
      : interpolate(t, [T.because, T.walking + 12], [1260, 860], { ...clamp, easing: Easing.out(Easing.quad) });
  const bossWalking = (t: number) => (t >= T.heard + 30 && t < T.exp + 6) || (t >= T.because && t < T.walking + 12);
  const bossOn = f < T.exp + 8 || f >= T.because;
  const bossKeys = gestureKeys([
    [0, { ...G.pointSide, ra1: 120 }],
    [T.heard + 26, G.rest],
    [T.walking + 12, G.handsHips, "snap"],
  ]);

  // crowd of 758
  const crowdK = win(f, T.n758, T.most + 6, 8);
  const glow = interpolate(f, [T.gpt, T.gpt + 8], [0, 1], clamp);
  const count = Math.round(interpolate(f, [T.n758, T.consult + 6], [0, 758], { ...clamp, easing: Easing.out(Easing.cubic) }));

  // three bars
  const barsK = win(f, T.most, T.but + 4, 6);
  const grow = (at: number, to: number) => interpolate(f, [at, at + 12], [0, to], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

  // robot trip
  const robotK = win(f, T.but, T.there + 10, 6);
  const rX = interpolate(f, [T.but, T.trip], [1080, 640], clamp);
  const rWalk = f < T.trip ? Math.sin(f / 3.2) : 0;
  const rRot = interpolate(f, [T.trip, T.up], [0, -88], { ...clamp, easing: Easing.in(Easing.cubic) });
  const wireK = interpolate(f, [T.built - 4, T.built + 4], [0, 1], clamp);

  // chart
  const chartK = win(f, T.there, T.wrongAns + 2, 6);
  const H = 520;
  const hNo = interpolate(f, [T.there + 2, T.there + 22], [0, 0.845 * H], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hAi = interpolate(f, [T.there + 8, T.nineteen], [0, 0.65 * H], { ...clamp, easing: Easing.out(Easing.cubic) });

  // polished report
  const repK = win(f, T.wrongAns, T.so + 4, 6);
  const shine = f >= T.polished ? 1 : 0;

  // workers
  const workK = win(f, T.so, T.study + 4, 8);
  const pile = Math.min(5, Math.max(0, Math.floor((f - T.copy) / 4) + 1));
  const lensX = interpolate(f, [T.checking, T.aiWrong], [700, 766], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const found = f >= T.aiWrong ? pop(f, T.aiWrong) : 0;

  // paper plane (the lesson travels)
  const planeT = interpolate(f, [T.travels - 6, T.practise + 6], [0, 1], clamp);
  const planeK = planeT > 0 && planeT < 1 ? 1 : 0;

  // ask → check → use chips
  const chipsK = win(f, T.practise, T.because + 8, 6);

  const sparkKeys = gestureKeys([
    [0, G.armsCrossed],
    [T.someone, G.pointSide, "snap"],
    [T.half, G.shrugBig, "snap"],
    [T.exp, G.present, "snap"],
    [T.gpt, G.pointUp, "snap"],
    [T.more, G.count1, "snap"],
    [T.better, G.fistPump, "snap"],
    [T.but, G.stop, "snap"],
    [T.up, G.facepalm, "snap"],
    [T.there, G.pointSide, "snap"],
    [T.nineteen, G.mindBlown, "snap"],
    [T.wrong, G.pointDown, "snap"],
    [T.polished, G.recoil, "snap"],
    [T.edge, G.thinkChin, "snap"],
    [T.anyone, G.shrugBig, "snap"],
    [T.checking, G.pointUp, "snap"],
    [T.aiWrong, G.doublePoint, "snap"],
    [T.study, G.armsCrossed, "snap"],
    [T.travels, G.present, "snap"],
    [T.checkAI, G.count2, "snap"],
    [T.asking, G.beckon, "snap"],
    [T.boss, G.whisper, "snap"],
    [LOOP + 4, G.armsCrossed],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.heard
      ? "skeptical"
      : t < T.exp
        ? "smug"
        : t < T.most
          ? "curious"
          : t < T.but
            ? "excited"
            : t < T.up
              ? "worried"
              : t < T.there
                ? "laugh"
                : t < T.nineteen
                  ? "curious"
                  : t < T.wrongAns
                    ? "mindblown"
                    : t < T.polished
                      ? "skeptical"
                      : t < T.edge
                        ? "shock"
                        : t < T.checking
                          ? "thinking"
                          : t < T.study
                            ? "determined"
                            : t < T.practise
                              ? "neutral"
                              : t < T.because
                                ? "happy"
                                : t < LOOP
                                  ? "wink"
                                  : "skeptical";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.nineteen, 30), bulbPulse(t, T.aiWrong, 30));

  const z = punch(f, [T.half, T.up, T.nineteen, T.aiWrong], 0.035);
  const hookK = Math.max(interpolate(f, [T.heard - 4, T.heard + 2], [1, 0], clamp), interpolate(f, [LOOP + 2, LOOP + 10], [0, 1], clamp));

  const bars: [string, string, number, number, string][] = [
    ["MORE TASKS", "+12%", T.more, 0.55, "#2fa84f"],
    ["FASTER", "+25%", T.faster, 0.7, AIBLUE],
    ["QUALITY", "+40%", T.better, 0.95, "#8e44ad"],
  ];

  return (
    <Stage
      bg={<Factory f={f} />}
      hits={[T.half, T.up, T.nineteen, T.aiWrong]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* crowd of consultants */}
          {crowdK > 0.01 && (
            <g opacity={crowdK}>
              {Array.from({ length: 20 }, (_, i) => {
                const c = i % 5;
                const r = Math.floor(i / 5);
                const k = pop(f, T.n758 + i * 1.2);
                return <Mini key={i} x={400 + c * 135 + (r % 2) * 40} y={800 + r * 130} k={k} glow={glow} c="#bfe0ff" />;
              })}
            </g>
          )}

          {/* three bars */}
          {barsK > 0.01 && (
            <g opacity={barsK}>
              {bars.map(([label, v, at, w, col], i) => {
                const y = 760 + i * 160;
                const len = grow(at, w * 560);
                return (
                  <g key={label}>
                    <text x={380} y={y - 18} fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={COL.ink}>
                      {label}
                    </text>
                    <rect x={380} y={y} width={560} height={70} rx={18} fill="#fff6dc" {...K} strokeWidth={5} />
                    <rect x={380} y={y} width={Math.max(0, len)} height={70} rx={18} fill={col} {...K} strokeWidth={5} />
                    {f >= at + 6 && (
                      <text x={380 + len - 16} y={y + 52} textAnchor="end" fontFamily={FONT.comic} fontSize={50} fill="#fff" stroke={COL.ink} strokeWidth={2}>
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* trip wire + robot */}
          {robotK > 0.01 && (
            <g opacity={robotK}>
              <g opacity={wireK}>
                <rect x={470} y={GROUND - 110} width={14} height={110} fill="#9aa3b2" {...K} strokeWidth={4} />
                <rect x={620} y={GROUND - 110} width={14} height={110} fill="#9aa3b2" {...K} strokeWidth={4} />
                <line x1={477} y1={GROUND - 60} x2={627} y2={GROUND - 60} stroke={RED} strokeWidth={8} />
                <g transform={`translate(420 ${GROUND - 330}) scale(${pop(f, T.built)})`}>
                  <rect x={-110} y={-30} width={220} height={56} rx={12} fill={RED} {...K} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill="#fff">
                    TRICK TASK
                  </text>
                </g>
              </g>
              <Robot x={rX} rot={rRot} step={rWalk} face={f >= T.up ? "dizzy" : "ok"} />
              {f >= T.up && f < T.up + 16 && <Burst x={560} y={GROUND - 40} at={T.up} f={f} size={260} color={AIBLUE} />}
            </g>
          )}

          {/* chart: NO AI vs WITH AI */}
          {chartK > 0.01 && (
            <g opacity={chartK}>
              <line x1={380} y1={GROUND - 30} x2={990} y2={GROUND - 30} stroke={COL.ink} strokeWidth={6} />
              {[
                [540, hNo, "#9aa3b2", "NO AI", "84%"],
                [830, hAi, AIBLUE, "WITH AI", "60–70%"],
              ].map(([x, h, col, lab, val]) => (
                <g key={lab as string}>
                  <rect x={(x as number) - 95} y={GROUND - 30 - (h as number)} width={190} height={h as number} rx={12} fill={col as string} {...K} />
                  <text x={x as number} y={GROUND - 54} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill="#fff" stroke={COL.ink} strokeWidth={1.5}>
                    {lab}
                  </text>
                  {(h as number) > 60 && (
                    <text x={x as number} y={GROUND - 46 - (h as number)} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={COL.ink}>
                      {val}
                    </text>
                  )}
                </g>
              ))}
              <text x={685} y={GROUND - 30 - 0.845 * H - 70} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill={COL.ink} opacity={interpolate(f, [T.there + 10, T.there + 18], [0, 1], clamp)}>
                RIGHT ANSWER ON THE TRICK TASK
              </text>
            </g>
          )}

          {/* polished-but-wrong report */}
          {repK > 0.01 && (
            <g opacity={repK}>
              <Report x={700} y={1000} s={pop(f, T.wrongAns) * 1.05} shine={shine} x2={f >= T.wrong ? pop(f, T.wrong) : 0} r={-3} />
              {[
                [560, 820, 0],
                [860, 860, 3],
                [590, 1170, 6],
                [850, 1160, 9],
              ].map(([x, y, d], i) => (
                <Sparkle key={i} x={x} y={y} k={f >= T.polished ? pop(f, T.polished + d) * (0.8 + 0.2 * Math.sin((f + i * 7) / 4)) : 0} />
              ))}
            </g>
          )}

          {/* COPIER + CHECKER */}
          {workK > 0.01 && (
            <g opacity={workK}>
              {/* copy pile */}
              {Array.from({ length: pile }, (_, i) => (
                <g key={i} transform={`translate(${470 + (i % 2) * 6} ${GROUND - 26 - i * 22})`}>
                  <rect x={-60} y={-12} width={120} height={22} rx={4} fill="#fffdf4" {...K} strokeWidth={4} />
                </g>
              ))}
              {pile > 0 && (
                <text x={470} y={GROUND - 60 - pile * 22} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={RED} stroke={COL.ink} strokeWidth={1.5}>
                  COPY ×{pile}
                </text>
              )}
              <Actor
                f={f}
                color={RED}
                scale={WS}
                label="COPIER"
                face={f >= T.aiWrong ? "sad" : "happy"}
                base={{ x: 600, y: WGY }}
                facing={-1}
                keys={[
                  { f: 0, p: G.rest },
                  { f: T.copy - 2, p: G.rest },
                  { f: T.copy + 2, p: G.pointDown },
                  { f: T.aiWrong - 2, p: G.pointDown },
                  { f: T.aiWrong + 2, p: G.shrugBig },
                ]}
                mod={(t, p) => addPose(addPose(p, idle(t, 4)), hop(t, T.copy, 24))}
              />
              <Actor
                f={f}
                color={COL.purple}
                scale={WS}
                label="CHECKER"
                face={f >= T.aiWrong ? "happy" : "eyes"}
                base={{ x: 880, y: WGY }}
                facing={-1}
                keys={[
                  { f: 0, p: G.rest },
                  { f: T.checking - 2, p: G.rest },
                  { f: T.checking + 4, p: { ...G.pointSide, ra1: 70 } },
                  { f: T.aiWrong - 2, p: { ...G.pointSide, ra1: 70 } },
                  { f: T.aiWrong + 2, p: G.celebrate },
                ]}
                mod={(t, p) => addPose(addPose(p, idle(t, 6)), hop(t, T.aiWrong, 30))}
              />
              {/* checker's page + magnifier */}
              <Report x={745} y={1110} s={0.4} shine={0} x2={found} r={4} />
              <g transform={`translate(${lensX} 1146)`}>
                <line x1={34} y1={34} x2={84} y2={84} stroke="#6b4a2b" strokeWidth={16} strokeLinecap="round" />
                <circle r={54} fill="#e6f6ff" fillOpacity={0.5} {...K} strokeWidth={8} />
              </g>
              {found > 0 && (
                <g transform={`translate(880 810) scale(${found})`}>
                  <rect x={-120} y={-34} width={240} height={68} rx={18} fill={COL.purple} {...K} strokeWidth={5} />
                  <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={48} fill="#fff">
                    FOUND IT
                  </text>
                </g>
              )}
            </g>
          )}

          {/* paper plane */}
          {planeK > 0 && (
            <g transform={`translate(${interpolate(planeT, [0, 1], [260, 1180])} ${980 - Math.sin(planeT * Math.PI) * 260}) rotate(${-12 + planeT * 18})`}>
              <path d="M -60 0 L 60 -10 L -30 30 Z" fill="#fff" {...K} strokeWidth={5} />
              <path d="M -30 30 L -10 4" {...K} strokeWidth={4} />
            </g>
          )}

          {/* ASK → CHECK → USE */}
          {chipsK > 0.01 && (
            <g opacity={chipsK}>
              {[
                ["ASK", AIBLUE, 820, T.practise + 2],
                ["CHECK", COL.purple, 990, T.checkAI],
                ["USE", "#2fa84f", 1160, T.asking],
              ].map(([lab, col, y, at], i) => {
                const big = lab === "CHECK" && f >= T.checkAI;
                return (
                  <g key={lab as string} transform={`translate(680 ${y}) scale(${pop(f, at as number) * (big ? 1.18 : 1)})`}>
                    <rect x={-170} y={-52} width={340} height={104} rx={26} fill={col as string} {...K} />
                    <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={76} fill="#fff" stroke={COL.ink} strokeWidth={2}>
                      {lab}
                    </text>
                    {i < 2 && <path d="M 0 60 L 0 104 M -16 90 L 0 106 L 16 90" fill="none" {...K} />}
                  </g>
                );
              })}
            </g>
          )}

          {/* BOSS */}
          {bossOn && (
            <Actor
              f={f}
              color={BOSS}
              scale={1.6}
              label="BOSS"
              accessory="tie"
              face={f >= T.because ? "eyes" : "angry"}
              base={{ x: 860, y: GROUND - 92.5 * 1.6 }}
              facing={(t) => (t >= T.heard + 30 && t < T.exp + 6 ? 1 : -1)}
              keys={bossKeys}
              mod={(t, p) => {
                let q = addPose(p, idle(t, 2));
                if (bossWalking(t)) q = addPose(q, walkCycle(t));
                return addPose(q, { x: bossX(t) - 860 });
              }}
            />
          )}

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 165, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 7));
              q = addPose(addPose(q, hop(t, T.better, 34)), hop(t, T.aiWrong, 40));
              q = addPose(addPose(q, shake(t, T.half)), nod(t, T.checkAI));
              return q;
            }}
          />
        </>
      }
      html={
        <>
          {/* hook overlay (frame 1 + loop) */}
          {hookK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 400, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: hookK, textAlign: "center" }}>
              <div style={{ background: COL.ink, color: "#fff", borderRadius: 20, padding: "10px 34px", fontFamily: FONT.comic, fontSize: 104, letterSpacing: 3, lineHeight: 1, whiteSpace: "nowrap" }}>
                AI WON'T TAKE <span style={{ color: MUSTARD }}>YOUR JOB…</span>
              </div>
              {f >= T.someone && f < T.heard && (
                <div style={{ marginTop: 22, transform: `scale(${pop(f, T.someone)}) rotate(3deg)`, fontFamily: FONT.comic, fontSize: 84, color: "#fff", WebkitTextStroke: `9px ${COL.ink}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
                  …SOMEONE USING AI WILL
                </div>
              )}
            </div>
          )}
          {f >= T.half && f < T.exp + 4 && <Stamp f={f} at={T.half} x={560} y={440} text="HALF TRUE" size={120} color={RED} r={-7} />}
          {f >= T.n758 - 4 && f < T.most && (
            <div style={{ position: "absolute", left: 600, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.n758)})`, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 170, color: "#fff", WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>{count}</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 48, color: COL.ink, whiteSpace: "nowrap" }}>
                CONSULTANTS {f >= T.gpt && <span style={{ background: AIBLUE, color: "#fff", borderRadius: 10, padding: "0 12px", marginLeft: 8 }}>+ GPT-4</span>}
              </div>
            </div>
          )}
          <Slam f={f} at={T.most} out={T.but - 4} x={580} y={440} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            ON MOST TASKS: WIN
          </Slam>
          <Slam f={f} at={T.built} out={T.there - 4} x={560} y={440} size={92} color="#fff" stroke={`9px ${COL.ink}`} rotate={2}>
            BUILT TO TRIP THE AI
          </Slam>
          {f >= T.nineteen && f < T.wrongAns && (
            <div style={{ position: "absolute", left: 600, top: 400, transform: `translate(-50%,-50%) scale(${pop(f, T.nineteen)}) rotate(-3deg)`, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: RED, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1, whiteSpace: "nowrap" }}>−19 POINTS</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: COL.ink, whiteSpace: "nowrap" }}>LESS LIKELY TO BE RIGHT</div>
            </div>
          )}
          <Slam f={f} at={T.wrong} out={T.polished - 2} x={600} y={440} size={110} color={RED} stroke={`9px ${COL.ink}`} rotate={-2}>
            WRONG…
          </Slam>
          <Slam f={f} at={T.polished} out={T.so - 4} x={600} y={440} size={100} color={GOLD} stroke={`9px ${COL.ink}`} rotate={2}>
            …BUT POLISHED ✨
          </Slam>
          <Slam f={f} at={T.anyone} out={T.checking - 4} x={600} y={440} size={100} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            ANYONE CAN COPY
          </Slam>
          <Slam f={f} at={T.checking} out={T.study - 4} x={600} y={440} size={112} color={COL.purple} stroke={`9px #fff`} rotate={2}>
            CHECK &gt; COPY
          </Slam>
          {f >= T.study && f < T.practise && (
            <div style={{ position: "absolute", left: 580, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.study)}) rotate(-2deg)`, fontFamily: FONT.title, fontWeight: 900, fontSize: 56, color: "#fff", background: COL.ink, borderRadius: 16, padding: "8px 26px", whiteSpace: "nowrap", opacity: interpolate(f, [T.practise - 6, T.practise], [1, 0], clamp) }}>
              CAVEAT: ONE STUDY · ONE FIRM · 2023
            </div>
          )}
          <Slam f={f} at={T.checkAI} out={T.because - 4} x={560} y={440} size={84} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            CHECK IT. DON'T JUST ASK IT.
          </Slam>
          {/* source line */}
          <div style={{ position: "absolute", left: 540, top: 1690, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#fff", whiteSpace: "nowrap", background: "rgba(26,26,26,0.55)", borderRadius: 10, padding: "2px 12px" }}>
            Dell'Acqua et al. 2023, HBS Working Paper 24-013 · 758 consultants
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["half", "seven", "hundred", "fifty-eight", "gpt-4", "more", "faster", "better", "trip", "nineteen", "wrong", "polished", "copy", "checking", "wrong", "travels", "checking", "again"]} />
        </>
      }
    />
  );
};
