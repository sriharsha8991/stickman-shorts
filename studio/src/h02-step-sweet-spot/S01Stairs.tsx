import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H02 · Your step sweet spot depends on your age. Number Reveal on a sunny terracotta hillside.
// The dose-response curve IS a staircase (x = steps a day, height = lower risk). The first blocks
// (≈3,500 → 5,800 steps) jump up; the next 5,000 steps barely rise. A receipt (15 studies, 47,471 adults),
// a step counter, then −40% lands on a hit (wow). The staircase splits by age: 60+ (purple) goes flat at
// 6–8K, under 60 (coral) at 8–10K. "Linked to, not proof" stamp. Spark hops up the first steps; the
// counter rolls back to STEP 1 and the hook returns (loop).
// Paluch et al. 2022, Lancet Public Health 7(3):e219–28. Observational. Health-edu line on screen.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.8;
const SGY = GROUND - 92.5 * SS;
const CORAL = "#ff6b4a";
const PURPLE = "#7048e8";
const SAND = "#f3d9b1";
const LEMON = "#ffd43b";

// --- chart geometry ------------------------------------------------------------------------------
const S0 = 3500;
const S1 = 11000;
const X0 = 300;
const X1 = 990;
const sx = (s: number) => X0 + ((s - S0) / (S1 - S0)) * (X1 - X0);
const BASE = 26;
const HK = 900; // px per 1.0 of risk reduction
const lerpPts = (pts: [number, number][], s: number) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i];
    const [b, vb] = pts[i + 1];
    if (s <= b) return va + ((vb - va) * (s - a)) / (b - a);
  }
  return pts[pts.length - 1][1];
};
// Paluch 2022 quartile medians vs HR (lowest quartile = reference): 3,553 → 1.00, 5,801 → 0.60, 7,842 → 0.55, 10,901 → 0.47
const ALL: [number, number][] = [
  [3500, 0],
  [5800, 0.4],
  [7850, 0.45],
  [11000, 0.53],
];
// age curves: illustrative shapes that flatten where the paper reports the plateau
const OLD: [number, number][] = [
  [3500, 0],
  [5800, 0.4],
  [7000, 0.46],
  [11000, 0.47],
];
const YOUNG: [number, number][] = [
  [3500, 0],
  [5800, 0.33],
  [9000, 0.5],
  [11000, 0.51],
];
const BLOCK = 500;
const BLOCKS = Array.from({ length: (S1 - S0) / BLOCK }, (_, i) => S0 + i * BLOCK);
const hAt = (pts: [number, number][], s: number) => BASE + lerpPts(pts, s + BLOCK) * HK;
const stepPath = (pts: [number, number][]) => {
  let d = `M ${sx(S0)} ${GROUND - BASE}`;
  BLOCKS.forEach((s) => {
    const y = GROUND - hAt(pts, s);
    d += ` L ${sx(s)} ${y} L ${sx(s + BLOCK)} ${y}`;
  });
  return d;
};

// --- anchors -----------------------------------------------------------------------------------------
const T = {
  first: W(0, 1),
  two: W(0, 2),
  next: W(1, 4),
  five: W(1, 5),
  studies: C(2),
  adults: W(2, 2),
  q1: W(3, 1),
  q2: W(4, 1),
  forty: W(5, 2),
  flatten: W(6, 3),
  age: W(6, 8),
  over: C(7),
  oldBand: W(7, 3),
  under: C(8),
  youngBand: W(8, 3),
  obs: C(9),
  linked: W(9, 2),
  bottom: W(10, 2),
  add: W(10, 3),
  more: W(11, 4),
  start: C(12),
  firstStep: W(12, 3),
};
const LOOP = VOICE_FRAMES - 14;

// --- background: sunny terracotta hillside ---------------------------------------------------------
const Hill: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="h2sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe8c2" />
          <stop offset="100%" stopColor="#fff7e8" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#h2sky)" />
      {/* slow sun rays */}
      <g transform={`translate(880 300) rotate(${f * 0.15})`} opacity={0.35}>
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M 0 0 L 520 -40 L 520 40 Z" fill="#ffd8a0" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle cx={880} cy={300} r={84} fill="#ffc94d" stroke="#f59f00" strokeWidth={6} />
      {/* layered hills */}
      <path d="M 0 1010 Q 260 900 520 980 T 1080 940 L 1080 1290 L 0 1290 Z" fill="#f8c9a6" />
      <path d="M 0 1120 Q 300 1040 600 1110 T 1080 1080 L 1080 1290 L 0 1290 Z" fill="#f2b48a" />
      {/* ground */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#c96f4a" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 120 - 30} y={GROUND + 18 + (i % 2) * 22} width={70} height={14} rx={7} fill="#b35f3d" />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// --- sfx ----------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.4],
  [T.two, "whoosh", 0.45],
  [T.five, "swish", 0.4],
  ...Array.from({ length: 15 }, (_, i): SfxCue => [T.studies + i * 2, "tick", 0.22]),
  [T.adults, "kaching", 0.35],
  [T.q1, "clink", 0.4],
  [T.q2, "clink", 0.45],
  [T.forty - 22, "riser", 0.45],
  [T.forty, "impact", 0.75],
  [T.flatten, "whoosh", 0.45],
  [T.oldBand, "ding", 0.4],
  [T.youngBand, "ding", 0.45],
  [T.linked, "stamp", 0.6],
  [T.add, "boing", 0.4],
  [T.more, "boing", 0.45],
  [T.firstStep, "ding", 0.5],
  [LOOP, "swirl", 0.35],
];

export const S01Stairs: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  const segA = interpolate(f, [T.two, T.two + 8], [0, 1], clamp);
  const segB = interpolate(f, [T.five, T.five + 8], [0, 1], clamp);
  const segOut = interpolate(f, [T.studies + 20, T.studies + 30], [1, 0], clamp);
  const split = interpolate(f, [T.flatten, T.flatten + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const oldOn = interpolate(f, [T.over - 4, T.over + 10], [0, 1], clamp);
  const youngOn = interpolate(f, [T.under - 4, T.under + 10], [0, 1], clamp);
  const endFade = interpolate(f, [LOOP, LOOP + 10], [1, 0], clamp); // age lines fade for the loop
  const fortyK = interpolate(f, [T.forty, T.forty + 4, T.flatten - 6, T.flatten], [0, 1, 1, 0], clamp);
  const arrowA = interpolate(f, [T.two + 6, T.two + 16], [0, 1], clamp) * segOut;
  const arrowB = interpolate(f, [T.five + 6, T.five + 16], [0, 1], clamp) * segOut;

  // which blocks glow
  const blockFill = (s: number) => {
    if (s < 5800 && segA > 0.01 && f < T.studies + 30) return CORAL;
    if (s >= 5800 && segB > 0.01 && f < T.studies + 30) return LEMON;
    if (s < 5800 && f >= T.q1 && f < T.flatten) return CORAL;
    return SAND;
  };

  // counter in the title zone
  const counter = f < T.q2 ? Math.round(interpolate(f, [T.q1, T.q1 + 12], [0, 3500], clamp) / 50) * 50 : Math.round(interpolate(f, [T.q2, T.q2 + 12], [3500, 5800], clamp) / 50) * 50;
  const counterK = interpolate(f, [T.q1 - 4, T.q1 + 4, T.forty - 28, T.forty - 22], [0, 1, 1, 0], clamp);
  const pct = Math.round(interpolate(f, [T.forty - 22, T.forty], [0, 40], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const pctK = interpolate(f, [T.forty - 22, T.forty - 16, T.flatten - 6, T.flatten], [0, 1, 1, 0], clamp);

  // SPARK: walks onto the first steps at the end
  const climb = (t: number) => {
    // steps: 0 = ground, 1 = first block, 2 = second block
    const k1 = interpolate(t, [T.add, T.add + 12], [0, 1], clamp);
    const k2 = interpolate(t, [T.more, T.more + 12], [0, 1], clamp);
    const back = interpolate(t, [LOOP, LOOP + 12], [1, 0], clamp);
    const x1 = sx(S0) + 22 - 150;
    const x2 = sx(S0 + BLOCK) + 22 - 150;
    const y1 = hAt(ALL, S0);
    const y2 = hAt(ALL, S0 + BLOCK);
    const x = (k1 * x1 + k2 * (x2 - x1)) * back;
    const y = (k1 * y1 + k2 * (y2 - y1)) * back;
    return { x, y: -y };
  };
  const sparkKeys = gestureKeys([
    [0, G.present],
    [T.first, G.count1, "snap"],
    [T.next, G.count2, "snap"],
    [T.studies, G.presentBoth, "snap"],
    [T.q1, G.pointSide],
    [T.q2, { ...G.pointSide, ra1: 120 }, "snap"],
    [T.forty, G.mindBlown, "snap"],
    [T.flatten, G.present, "snap"],
    [T.over, G.pointUp, "snap"],
    [T.under, G.doublePoint, "snap"],
    [T.obs, G.armsCrossed, "snap"],
    [T.bottom, G.pointDown, "snap"],
    [T.add, G.fistPump, "snap"],
    [T.more, G.celebrate, "snap"],
    [T.firstStep, G.pointUp, "snap"],
    [LOOP + 2, G.present],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.first
      ? "curious"
      : t < T.studies
        ? "excited"
        : t < T.q1
          ? "thinking"
          : t < T.forty
            ? "curious"
            : t < T.flatten
              ? "mindblown"
              : t < T.obs
                ? "happy"
                : t < T.bottom
                  ? "skeptical"
                  : t < T.firstStep
                    ? "determined"
                    : t < LOOP
                      ? "wink"
                      : "curious";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.forty, 34), bulbPulse(t, T.firstStep, 20) * 0.7);

  const z = punch(f, [T.two, T.forty, T.oldBand, T.youngBand, T.linked], 0.03);
  const hookK = Math.max(interpolate(f, [T.studies - 6, T.studies + 2], [1, 0], clamp), interpolate(f, [LOOP + 2, LOOP + 10], [0, 1], clamp));
  const neutralK = 1 - split * 0.55 * endFade;

  const label = (s: number, text: string, y: number, color: string, k: number) =>
    k > 0.01 ? (
      <g transform={`translate(${sx(s)} ${y}) scale(${k})`}>
        <rect x={-text.length * 13 - 18} y={-30} width={text.length * 26 + 36} height={58} rx={29} fill={color} {...K} strokeWidth={5} />
        <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill="#fff">
          {text}
        </text>
      </g>
    ) : null;

  return (
    <Stage
      bg={<Hill f={f} />}
      hits={[T.forty, T.linked]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* y-axis hint */}
          <text x={sx(S0)} y={660} opacity={interpolate(f, [T.flatten, T.flatten + 8, LOOP, LOOP + 8], [1, 0, 0, 1], clamp)} fontFamily={FONT.title} fontWeight={800} fontSize={34} fill="#8a4b2e" letterSpacing={2}>
            ↑ LOWER RISK OF EARLY DEATH
          </text>
          {/* the staircase (all adults) */}
          <g opacity={neutralK}>
            {BLOCKS.map((s, i) => {
              const h = hAt(ALL, s);
              const rise = interpolate(f, [i * 1.2 - 30, i * 1.2 - 22], [0, 1], clamp); // already built at frame 0
              return <rect key={i} x={sx(s)} y={GROUND - h * Math.max(rise, 1)} width={sx(s + BLOCK) - sx(s)} height={h} fill={blockFill(s)} {...K} strokeWidth={5} />;
            })}
          </g>
          {/* age staircases */}
          {split > 0.01 && (
            <>
              <path d={stepPath(YOUNG)} fill="none" stroke={CORAL} strokeWidth={12} strokeLinejoin="round" opacity={youngOn * endFade} strokeDasharray={2400} strokeDashoffset={2400 * (1 - youngOn)} />
              <path d={stepPath(OLD)} fill="none" stroke={PURPLE} strokeWidth={12} strokeLinejoin="round" opacity={oldOn * endFade} strokeDasharray={2400} strokeDashoffset={2400 * (1 - oldOn)} />
            </>
          )}
          {/* plateau bands on the ground */}
          {f >= T.oldBand && (
            <g opacity={endFade}>
              <rect x={sx(6000)} y={GROUND - 6} width={(sx(8000) - sx(6000)) * pop(f, T.oldBand)} height={24} fill={PURPLE} {...K} strokeWidth={4} />
            </g>
          )}
          {f >= T.youngBand && (
            <g opacity={endFade}>
              <rect x={sx(8000)} y={GROUND + 22} width={(sx(10000) - sx(8000)) * pop(f, T.youngBand)} height={24} fill={CORAL} {...K} strokeWidth={4} />
            </g>
          )}
          {label(7000, "60+ · 6–8K", 760, PURPLE, f >= T.oldBand ? pop(f, T.oldBand) * endFade : 0)}
          {label(9000, "UNDER 60 · 8–10K", 680, CORAL, f >= T.youngBand ? pop(f, T.youngBand) * endFade : 0)}

          {/* +2,000 vs +5,000 arrows */}
          {arrowA > 0.01 && (
            <g opacity={arrowA}>
              <line x1={sx(5800) + 30} y1={GROUND - BASE} x2={sx(5800) + 30} y2={GROUND - BASE - 0.4 * HK * arrowA} stroke={COL.ink} strokeWidth={10} />
              <path d={`M ${sx(5800) + 8} ${GROUND - BASE - 0.4 * HK * arrowA + 20} L ${sx(5800) + 30} ${GROUND - BASE - 0.4 * HK * arrowA - 10} L ${sx(5800) + 52} ${GROUND - BASE - 0.4 * HK * arrowA + 20} Z`} fill={COL.ink} />
              {label(4650, "+2,000", GROUND - hAt(ALL, 5300) - 60, CORAL, pop(f, T.two))}
            </g>
          )}
          {arrowB > 0.01 && (
            <g opacity={arrowB}>
              <line x1={970} y1={GROUND - BASE - 0.4 * HK} x2={970} y2={GROUND - BASE - (0.4 + 0.13 * arrowB) * HK} stroke={COL.ink} strokeWidth={10} />
              <path d={`M 950 ${GROUND - BASE - (0.4 + 0.13 * arrowB) * HK + 18} L 970 ${GROUND - BASE - (0.4 + 0.13 * arrowB) * HK - 10} L 990 ${GROUND - BASE - (0.4 + 0.13 * arrowB) * HK + 18} Z`} fill={COL.ink} />
              {label(8400, "+5,000", GROUND - hAt(ALL, 10500) - 70, "#e8a400", pop(f, T.five))}
            </g>
          )}

          {/* step markers for 3,500 and 5,800 */}
          {f >= T.q1 && f < T.flatten && (
            <g transform={`translate(${sx(3550)} ${GROUND + 40}) scale(${pop(f, T.q1)})`}>
              <path d="M 0 -30 L -16 -2 L 16 -2 Z" fill={COL.ink} />
            </g>
          )}
          {f >= T.q2 && f < T.flatten && (
            <g transform={`translate(${sx(5800)} ${GROUND + 40}) scale(${pop(f, T.q2)})`}>
              <path d="M 0 -30 L -16 -2 L 16 -2 Z" fill={COL.ink} />
            </g>
          )}
          {f >= T.forty && f < T.forty + 16 && <Burst x={540} y={470} at={T.forty} f={f} size={320} color={CORAL} />}

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 150, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              const c = climb(t);
              let q = addPose(addPose(p, idle(t, 8)), { x: c.x, y: c.y });
              q = addPose(addPose(q, hop(t, T.add, 50)), hop(t, T.more, 50));
              return addPose(q, nod(t, T.oldBand));
            }}
          />
        </>
      }
      html={
        <>
          {/* axis labels */}
          {[3500, 5800, 8000, 10000].map((s) => (
            <div key={s} style={{ position: "absolute", left: sx(s), top: GROUND + 62, transform: "translate(-50%,-50%)", fontFamily: FONT.title, fontWeight: 800, fontSize: 32, color: "#fff", WebkitTextStroke: `6px ${COL.ink}`, paintOrder: "stroke fill" }}>
              {s === 3500 ? "3.5K" : s === 5800 ? "5.8K" : `${s / 1000}K`}
            </div>
          ))}
          {/* hook overlay (frame 1 + loop) */}
          {hookK > 0.01 && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 470,
                transform: `translate(-50%,-50%) rotate(-2deg)`,
                opacity: hookK,
                background: COL.ink,
                color: "#fff",
                borderRadius: 20,
                padding: "14px 40px",
                fontFamily: FONT.comic,
                fontSize: 100,
                letterSpacing: 3,
                lineHeight: 1.02,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              HOW MANY STEPS
              <br />
              <span style={{ color: LEMON }}>IS ENOUGH?</span>
            </div>
          )}
          {/* receipt: 15 studies, 47,471 adults */}
          {f >= T.studies && f < T.q1 && (
            <div style={{ position: "absolute", left: 540, top: 450, transform: "translate(-50%,-50%)", textAlign: "center", opacity: interpolate(f, [T.q1 - 6, T.q1], [1, 0], clamp) }}>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} style={{ width: 42, height: 56, background: "#fff", border: `4px solid ${COL.ink}`, borderRadius: 6, transform: `scale(${pop(f, T.studies + i * 2)})` }} />
                ))}
              </div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 64, color: COL.ink }}>15 STUDIES</div>
              {f >= T.adults && (
                <div style={{ fontFamily: FONT.comic, fontSize: 96, color: CORAL, WebkitTextStroke: `6px ${COL.ink}`, paintOrder: "stroke fill", transform: `scale(${pop(f, T.adults)})` }}>
                  {Math.round(interpolate(f, [T.adults, T.adults + 18], [0, 47471], clamp)).toLocaleString("en-US")} ADULTS
                </div>
              )}
            </div>
          )}
          {/* step counter */}
          {counterK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${0.9 + counterK * 0.1})`, opacity: counterK, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 150, color: "#fff", WebkitTextStroke: `10px ${COL.ink}`, paintOrder: "stroke fill" }}>{counter.toLocaleString("en-US")}</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 44, color: "#8a4b2e", letterSpacing: 3 }}>STEPS A DAY (MEDIAN)</div>
            </div>
          )}
          {/* −40% number reveal */}
          {pctK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) scale(${f >= T.forty ? pop(f, T.forty) : 0.9})`, opacity: pctK, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 210, color: CORAL, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>−{pct}%</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 44, color: COL.ink, opacity: fortyK }}>LOWER RISK, 3.5K → 5.8K (LINKED)</div>
            </div>
          )}
          <Slam f={f} at={T.flatten} out={T.over - 4} x={540} y={470} size={110} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            THEN IT FLATTENS
          </Slam>
          <Slam f={f} at={T.over} out={T.under - 4} x={540} y={470} size={110} color={PURPLE} stroke={`9px #fff`} rotate={-2}>
            60+: 6–8K
          </Slam>
          <Slam f={f} at={T.under} out={T.obs - 4} x={540} y={470} size={110} color={CORAL} stroke={`9px #fff`} rotate={2}>
            UNDER 60: 8–10K
          </Slam>
          {f >= T.linked && f < T.bottom && <Stamp f={f} at={T.linked} x={560} y={470} text="LINKED ≠ PROOF" size={86} color={PURPLE} r={-6} />}
          <Slam f={f} at={T.add} out={T.more - 2} x={540} y={470} size={96} color="#fff" stroke={`9px ${COL.ink}`} rotate={-3}>
            + A FEW HUNDRED
          </Slam>
          <Slam f={f} at={T.more} out={T.firstStep - 2} x={540} y={470} size={96} color={LEMON} stroke={`9px ${COL.ink}`} rotate={3}>
            + A FEW HUNDRED MORE
          </Slam>
          <Slam f={f} at={T.firstStep} out={LOOP} x={540} y={470} size={120} color="#fff" stroke={`10px ${COL.ink}`} rotate={-2}>
            STEP 1 ✓
          </Slam>
          {/* sources + health line */}
          <div style={{ position: "absolute", left: 540, top: 1585, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 25, color: "#7a3a20", whiteSpace: "nowrap", opacity: 0.92 }}>
            Paluch et al. 2022, Lancet Public Health · 15 cohorts · observational
          </div>
          <div style={{ position: "absolute", left: 540, top: 1630, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 800, fontSize: 28, color: COL.ink, background: "rgba(255,255,255,0.75)", borderRadius: 12, padding: "2px 14px", whiteSpace: "nowrap" }}>
            Education, not medical advice
          </div>
          <VoiceCaptions f={f} y={1480} cues={VOICE_CUES} hi={["first", "two", "five", "fifteen", "forty-seven", "thirty-five", "fifty-eight", "forty", "percent", "flatten", "age", "sixty?", "six", "eight", "ten", "observational.", "linked", "proof.", "few", "hundred", "first"]} />
        </>
      }
    />
  );
};
