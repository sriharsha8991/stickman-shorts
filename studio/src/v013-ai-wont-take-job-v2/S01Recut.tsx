import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V013 v2 · "AI won't take your job…" re-cut for retention v2 (owner, 2026-10-23): 30 s, best image at frame 0.
// Same mustard factory world as v1. Cold open: the WITH AI bar crashes from 84% to ~65% while Spark charges
// up (power-up "charge") and recoils: −19 POINTS. Open loop: "on most tasks AI made them faster… so what went
// wrong?" Robot trips on TRICK TASK. Chart 84% vs about 2 in 3. Re-hook: a gold, sparkly report gets a red ✗
// stamped through it (wrong but polished). Magnifier: CHECK IT. Caveat pill. ASK → CHECK → USE.
// "Because the next report…" cuts back to frame 0 (bars full, overlay). Dell'Acqua et al. 2023, HBS WP 24-013.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const MUSTARD = "#ffc94a";
const AIBLUE = "#2b7de9";
const GOLD = "#f2b705";
const RED = "#e5322d";

const PEAK = POWER_PEAK.charge; // 28
const T = {
  trust: W(0, 1),
  gpt: W(0, 2),
  n758: W(0, 5),
  lost: W(0, 10),
  nineteen: W(0, 11),
  most: W(1, 1),
  faster: W(1, 6),
  what: C(2),
  wrongQ: W(2, 3),
  built: W(3, 3),
  trip: W(3, 5),
  ai: W(3, 7),
  without: C(4),
  n84: W(4, 2),
  right: W(4, 6),
  withAI: C(5),
  two: W(5, 3),
  wrongAns: W(6, 2),
  looked: W(6, 4),
  polished: W(6, 6),
  edge: W(7, 1),
  using: W(7, 3),
  checking: W(7, 6),
  study: C(8),
  firm: W(8, 3),
  ask: C(9),
  check: W(9, 2),
  use: W(9, 4),
  because: C(10),
  report: W(10, 3),
};
const LOOP = VOICE_FRAMES - 14;

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
  [0, "riser", 0.45],
  [PEAK, "impact", 0.85],
  [PEAK + 2, "crash", 0.4],
  [T.n758, "tick", 0.3],
  [T.nineteen, "stamp", 0.5],
  [T.most, "whoosh", 0.35],
  [T.faster, "swish", 0.45],
  [T.wrongQ, "boing", 0.45],
  [T.built, "page", 0.3],
  [T.trip, "whoosh", 0.45],
  [T.ai + 6, "crash", 0.55],
  [T.n84, "pop", 0.4],
  [T.two, "thud", 0.6],
  [T.looked, "ding", 0.5],
  [T.polished, "stamp", 0.75],
  [T.checking, "kaching", 0.45],
  [T.study, "page", 0.35],
  [T.ask, "pop", 0.4],
  [T.check, "pop", 0.45],
  [T.use, "ding", 0.45],
  [T.because, "riser", 0.35],
];

const H = 520;
const Chart: React.FC<{ k: number; hNo: number; hAi: number; label: boolean; minus: number }> = ({ k, hNo, hAi, label, minus }) =>
  k > 0.01 ? (
    <g opacity={k}>
      <line x1={380} y1={GROUND - 30} x2={990} y2={GROUND - 30} stroke={COL.ink} strokeWidth={6} />
      {/* ghost line at 84% */}
      <line x1={380} y1={GROUND - 30 - 0.845 * H} x2={990} y2={GROUND - 30 - 0.845 * H} stroke={COL.ink} strokeWidth={4} strokeDasharray="14 10" opacity={0.5} />
      {(
        [
          [540, hNo, "#9aa3b2", "NO AI", "84%"],
          [830, hAi, AIBLUE, "WITH AI", "≈2 in 3"],
        ] as const
      ).map(([x, h, col, lab, val]) => (
        <g key={lab}>
          <rect x={x - 95} y={GROUND - 30 - h} width={190} height={h} rx={12} fill={col} {...K} />
          <text x={x} y={GROUND - 54} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill="#fff" stroke={COL.ink} strokeWidth={1.5}>
            {lab}
          </text>
          {label && h > 60 && (lab === "NO AI" || h < 0.8 * H) && (
            <text x={x} y={GROUND - 46 - h} textAnchor="middle" fontFamily={FONT.comic} fontSize={54} fill={COL.ink}>
              {val}
            </text>
          )}
        </g>
      ))}
      {minus > 0.01 && (
        <g transform={`translate(830 ${GROUND - 30 - 0.845 * H - 10}) scale(${minus}) rotate(-6)`}>
          <rect x={-120} y={-56} width={240} height={86} rx={16} fill={RED} {...K} />
          <text y={12} textAnchor="middle" fontFamily={FONT.comic} fontSize={70} fill="#fff">
            −19
          </text>
        </g>
      )}
    </g>
  ) : null;

export const S01Recut: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // chart: cold open (crash), the proof (84 vs 2 in 3), loop (full again)
  const full = 0.845 * H;
  const low = 0.65 * H;
  const chartK = Math.max(win(f, 0, T.most, 1), win(f, T.without - 2, T.wrongAns, 6), f >= T.because - 2 ? interpolate(f, [T.because - 2, T.because + 4], [0, 1], clamp) : 0);
  let hNo = full;
  let hAi = full;
  if (f < T.most) hAi = interpolate(f, [PEAK - 4, PEAK], [full, low], { ...clamp, easing: Easing.in(Easing.cubic) });
  else if (f < T.because - 2) {
    hNo = interpolate(f, [T.without, T.n84 + 6], [0, full], { ...clamp, easing: Easing.out(Easing.cubic) });
    hAi = interpolate(f, [T.withAI, T.two + 2], [0, low], { ...clamp, easing: Easing.out(Easing.cubic) });
  }
  const minus = f < T.most ? (f >= PEAK ? pop(f, PEAK) : 0) : f >= T.two + 2 && f < T.because ? pop(f, T.two + 2) : 0;

  // faster bar (open loop)
  const fastK = win(f, T.most - 2, T.what + 4, 6);
  const fastLen = interpolate(f, [T.faster - 6, T.faster + 6], [0, 0.72 * 560], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

  // robot trip
  const robotK = win(f, T.built - 6, T.without + 2, 6);
  const rX = interpolate(f, [T.built - 6, T.trip + 4], [1080, 640], clamp);
  const rWalk = f < T.trip + 4 ? Math.sin(f / 3.2) : 0;
  const rRot = interpolate(f, [T.trip + 4, T.ai + 6], [0, -88], { ...clamp, easing: Easing.in(Easing.cubic) });

  // report (re-hook)
  const repK = win(f, T.wrongAns - 4, T.study, 6);
  const shine = f >= T.looked ? 1 : 0;
  const lensX = interpolate(f, [T.edge, T.checking], [520, 752], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const lensK = win(f, T.edge - 2, T.study, 6);

  // caveat + chips
  const chipsK = win(f, T.ask - 2, T.because + 2, 6);

  const sparkKeys = gestureKeys([
    [0, G.handsHips],
    [PEAK - 3, G.handsHips],
    [PEAK, G.recoil, "snap"],
    [T.gpt, G.pointSide, "snap"],
    [T.nineteen, G.pointDown, "snap"],
    [T.most, G.present, "snap"],
    [T.faster, G.fistPump, "snap"],
    [T.what, G.shrugBig, "snap"],
    [T.built, G.stop, "snap"],
    [T.ai + 6, G.facepalm, "snap"],
    [T.without, G.count1, "snap"],
    [T.withAI, G.count2, "snap"],
    [T.two, G.mindBlown, "snap"],
    [T.wrongAns, G.thinkChin, "snap"],
    [T.polished, G.recoil, "snap"],
    [T.edge, G.pointUp, "snap"],
    [T.checking, G.doublePoint, "snap"],
    [T.study, G.armsCrossed, "snap"],
    [T.ask, G.beckon, "snap"],
    [T.use, G.celebrate, "snap"],
    [T.because, G.whisper, "snap"],
    [LOOP, G.handsHips, "snap"],
  ]);
  const sparkMood = (t: number): Mood =>
    t < PEAK
      ? "determined"
      : t < T.gpt
        ? "shock"
        : t < T.most
          ? "skeptical"
          : t < T.what
            ? "excited"
            : t < T.built
              ? "curious"
              : t < T.without
                ? "laugh"
                : t < T.two
                  ? "thinking"
                  : t < T.wrongAns
                    ? "mindblown"
                    : t < T.polished
                      ? "happy"
                      : t < T.edge
                        ? "shock"
                        : t < T.study
                          ? "determined"
                          : t < T.ask
                            ? "neutral"
                            : t < T.because
                              ? "wink"
                              : t < LOOP
                                ? "worried"
                                : "smug";
  const bulb = (t: number) => Math.max(bulbPulse(t, PEAK, 26), bulbPulse(t, T.polished, 28), bulbPulse(t, T.checking, 24) * 0.8);

  const z = punch(f, [T.ai + 6, T.two, T.polished], 0.035);
  const overlayK = Math.max(interpolate(f, [70, 78], [1, 0], clamp), interpolate(f, [T.because + 2, T.because + 8], [0, 1], clamp));

  return (
    <Stage
      bg={<Factory f={f} />}
      hits={[...powerHits("charge", 0), T.ai + 6, T.two, T.polished]}
      power={10}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="charge" f={f} at={0} x={170} y={GROUND} h={185 * SS} layer="back" />

          <Chart k={chartK} hNo={hNo} hAi={hAi} label={f >= T.without || f < T.most} minus={minus} />

          {/* faster bar (open loop) */}
          {fastK > 0.01 && (
            <g opacity={fastK}>
              <text x={380} y={862} fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={COL.ink}>
                MOST TASKS: FASTER
              </text>
              <rect x={380} y={880} width={560} height={90} rx={20} fill="#fff6dc" {...K} strokeWidth={5} />
              <rect x={380} y={880} width={Math.max(0, fastLen)} height={90} rx={20} fill={AIBLUE} {...K} strokeWidth={5} />
              {f >= T.faster && (
                <text x={380 + fastLen - 18} y={946} textAnchor="end" fontFamily={FONT.comic} fontSize={64} fill="#fff" stroke={COL.ink} strokeWidth={2}>
                  +25%
                </text>
              )}
            </g>
          )}

          {/* trip wire + robot */}
          {robotK > 0.01 && (
            <g opacity={robotK}>
              <rect x={470} y={GROUND - 110} width={14} height={110} fill="#9aa3b2" {...K} strokeWidth={4} />
              <rect x={620} y={GROUND - 110} width={14} height={110} fill="#9aa3b2" {...K} strokeWidth={4} />
              <line x1={477} y1={GROUND - 60} x2={627} y2={GROUND - 60} stroke={RED} strokeWidth={8} />
              <g transform={`translate(560 ${GROUND - 330}) scale(${pop(f, T.built - 2)})`}>
                <rect x={-110} y={-30} width={220} height={56} rx={12} fill={RED} {...K} strokeWidth={5} />
                <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill="#fff">
                  TRICK TASK
                </text>
              </g>
              <Robot x={rX} rot={rRot} step={rWalk} face={f >= T.ai + 6 ? "dizzy" : "ok"} />
              {f >= T.ai + 6 && f < T.ai + 22 && <Burst x={560} y={GROUND - 40} at={T.ai + 6} f={f} size={260} color={AIBLUE} />}
            </g>
          )}

          {/* polished-but-wrong report + magnifier */}
          {repK > 0.01 && (
            <g opacity={repK}>
              <Report x={700} y={1000} s={pop(f, T.wrongAns - 4) * 1.1} shine={shine} x2={f >= T.polished ? interpolate(f, [T.polished, T.polished + 4, T.polished + 8], [2.4, 0.9, 1], clamp) : 0} r={-3} />
              {[
                [560, 820, 0],
                [860, 860, 3],
                [590, 1170, 6],
                [850, 1160, 9],
              ].map(([x, y, d], i) => (
                <Sparkle key={i} x={x} y={y} k={f >= T.looked && f < T.polished + 6 ? pop(f, T.looked + d) * (0.8 + 0.2 * Math.sin((f + i * 7) / 4)) : 0} />
              ))}
              {f >= T.polished && f < T.polished + 16 && <Burst x={752} y={1092} at={T.polished} f={f} size={300} color={RED} />}
              {lensK > 0.01 && (
                <g opacity={lensK} transform={`translate(${lensX} 1092)`}>
                  <circle r={78} fill="#e7f6ff" fillOpacity={0.35} stroke={COL.ink} strokeWidth={12} />
                  <rect x={50} y={50} width={30} height={120} rx={10} fill={COL.ink} transform="rotate(-45 65 65)" />
                </g>
              )}
            </g>
          )}

          {/* ASK → CHECK → USE */}
          {chipsK > 0.01 && (
            <g opacity={chipsK}>
              {(
                [
                  ["ASK", T.ask, "#9aa3b2"],
                  ["CHECK", T.check, "#2fa84f"],
                  ["USE", T.use, AIBLUE],
                ] as const
              ).map(([lab, at, col], i) => {
                const k = f >= at - 2 ? pop(f, at - 2) : 0;
                const big = lab === "CHECK" ? 1.25 : 1;
                return (
                  <g key={lab} transform={`translate(${470 + i * 200} 1000) scale(${k * big})`}>
                    <rect x={-88} y={-50} width={176} height={100} rx={22} fill={col} {...K} />
                    <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill="#fff">
                      {lab}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* SPARK (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 170, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = addPose(addPose(q, hop(t, T.faster, 30)), hop(t, T.use, 40));
              q = addPose(addPose(q, shake(t, T.two)), nod(t, T.checking));
              return q;
            }}
          />
          <PowerUp kind="charge" f={f} at={0} x={170} y={GROUND} h={185 * SS} layer="front" />
        </>
      }
      html={
        <>
          {/* series tag */}
          <div style={{ position: "absolute", left: 60, top: 230, fontFamily: FONT.title, fontWeight: 900, fontSize: 30, color: COL.ink, letterSpacing: 2, opacity: 0.75 }}>HIDDEN MECHANISM #13</div>
          {/* hook overlay (frame 0 + loop) */}
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 560, top: 430, transform: "translate(-50%,-50%) rotate(-3deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ background: COL.ink, color: "#fff", borderRadius: 18, padding: "6px 34px", fontFamily: FONT.comic, fontSize: 96, letterSpacing: 3 }}>AI USERS:</div>
              <div style={{ fontFamily: FONT.comic, fontSize: 170, color: RED, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>−19 POINTS</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 36, color: COL.ink }}>ON ONE TRICK TASK · 758 CONSULTANTS</div>
            </div>
          )}
          <Slam f={f} at={T.most} out={T.what - 4} x={560} y={440} size={110} color="#fff" stroke={`10px ${COL.ink}`} rotate={-2}>
            SAME STUDY…
          </Slam>
          <Slam f={f} at={T.what} out={T.built - 4} x={560} y={440} size={120} color={RED} stroke={`10px #fff`} rotate={2}>
            WHAT WENT WRONG?
          </Slam>
          <Slam f={f} at={T.built} out={T.without - 4} x={560} y={440} size={110} color={MUSTARD} stroke={`10px ${COL.ink}`} rotate={-2}>
            ONE TRICK TASK
          </Slam>
          {f >= T.without && f < T.wrongAns && (
            <div style={{ position: "absolute", left: 600, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.without)})`, fontFamily: FONT.title, fontWeight: 900, fontSize: 46, color: "#fff", background: COL.ink, borderRadius: 14, padding: "6px 20px", whiteSpace: "nowrap", opacity: interpolate(f, [T.wrongAns - 6, T.wrongAns], [1, 0], clamp) }}>
              RIGHT ANSWER ON THE TRICK TASK
            </div>
          )}
          <Slam f={f} at={T.looked} out={T.polished - 2} x={560} y={430} size={110} color={GOLD} stroke={`10px ${COL.ink}`} rotate={-2}>
            LOOKS GREAT…
          </Slam>
          <Slam f={f} at={T.polished} out={T.edge - 4} x={560} y={430} size={150} color={RED} stroke={`12px #fff`} rotate={3}>
            …AND WRONG.
          </Slam>
          <Slam f={f} at={T.checking} out={T.study - 4} x={560} y={430} size={130} color="#2fa84f" stroke={`10px ${COL.ink}`} rotate={-2}>
            CHECK IT.
          </Slam>
          {f >= T.study - 2 && f < T.ask && (
            <div style={{ position: "absolute", left: 560, top: 440, transform: `translate(-50%,-50%) scale(${pop(f, T.study - 2)}) rotate(-2deg)`, fontFamily: FONT.title, fontWeight: 900, fontSize: 44, color: "#fff", background: COL.ink, borderRadius: 16, padding: "8px 22px", whiteSpace: "nowrap", opacity: interpolate(f, [T.ask - 6, T.ask], [1, 0], clamp) }}>
              CAVEAT: ONE STUDY · ONE FIRM · 2023 · GPT-4
            </div>
          )}
          <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#fff", whiteSpace: "nowrap", background: "rgba(0,0,0,0.35)", borderRadius: 10, padding: "3px 14px" }}>
            Dell'Acqua et al. 2023 · HBS Working Paper 24-013 · 758 BCG consultants
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["trust", "gpt-4", "seven", "hundred", "fifty-eight", "lost", "nineteen", "faster", "wrong", "trip", "eighty-four", "two", "three", "polished", "checking", "study", "firm", "ask", "check", "use", "report"]} />
        </>
      }
    />
  );
};
