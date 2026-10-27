import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CORAL, CORAL_D, Cuts, Cutter, INK, K, MINT, Note, PAPER, Pill, PlanBlock, PriceTag, SPARK, SparkHost, T, W, XStamp,
  contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// HOOK (0:00–0:32). Frame 0: a neon ₹4,000 price tag under a giant pizza cutter + "PAY IN 4 = ?". On "four" the cutter
// slices it into four ₹1,000 tags. The brain's magnifier only reads one slice. 4 × 1,000 = 4,000, but the FEELING bars
// differ. Myth "NO INTEREST = FREE" stamped. Promise: brain trick · stacking tower · 10-second check.

const CUTS = cutTimes(0, CE(8), 150);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.35, at: SPARK }, { z: 1.1, at: [960, 520] }];

export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.3],
  [W(0, 0), "punch", 0.5],
  [W(0, 8) - 6, "whoosh", 0.45],
  [W(0, 8), "slam", 0.55],
  [W(0, 8) + 4, "shatter", 0.3],
  [W(1, 4), "pop", 0.35],
  [W(1, 6), "ding", 0.4],
  [C(2), "clink", 0.4],
  [W(2, 7), "thud", 0.4],
  [W(3, 5), "boing", 0.35],
  [C(4), "page", 0.4],
  [W(4, 7), "stamp", 0.6],
  [W(5, 2), "tick", 0.35],
  [W(5, 6), "buzz", 0.35],
  [C(6), "swirl", 0.35],
  [W(6, 7), "pop", 0.35],
  [W(7, 5), "thud", 0.4],
  [W(8, 2), "tick", 0.4],
  [W(8, 7), "ding", 0.4],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

// a cartoon brain with a magnifier, for "your brain is judging"
const Brain: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) =>
  s <= 0.01 || o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -90 20 C -140 10 -130 -70 -80 -70 C -70 -120 0 -120 10 -80 C 50 -120 120 -90 100 -40 C 150 -20 130 50 80 50 C 60 90 -10 90 -20 60 C -60 80 -110 60 -90 20 Z" fill="#ffb3c1" {...K} strokeWidth={6} />
      <path d="M -40 -60 Q -10 -30 -40 0 M 30 -60 Q 0 -20 40 10 M -70 20 Q -30 30 -20 50" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );

export const S01Hook: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: 0, x: 300, s: 1.5 },
    { f: C(4), x: 1600, s: 1.45 },
    { f: C(6), x: 1580, s: 3.1, e: "snap" },
    { f: C(7), x: 1600, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [{ f: W(0, 8), z: 1.15, at: [1150, 470], e: "snap" }, { f: W(0, 8) + 30, z: 1, e: "smooth" }], places);
  const z = punch(g, [W(0, 8), W(4, 7), W(5, 6)], 0.045);

  const sliced = g >= W(0, 8);
  const cutK = soft(g, W(0, 8) - 10, W(0, 8) + 2); // cutter sweep
  const split = soft(g, W(0, 8), W(0, 8) + 14); // tags fan out
  const rejoin = soft(g, C(2), C(2) + 14); // tags slide back together
  const tagsO = vis(g, -10, C(3) - 4, 8);
  const mag = vis(g, C(1), CE(1) + 6);

  const rows: Act[] = [
    [0, "armsCrossed", "skeptical"],
    [W(0, 0), "stop", "determined", "shake"],
    [W(0, 8), "pointSide", "shock"],
    [C(1), "thinkChin", "curious"],
    [W(1, 6), "count1", "smug", "nod"],
    [C(2), "presentBoth", "neutral"],
    [C(3), "shrugBig", "curious"],
    [C(4), "handsHips", "skeptical"],
    [W(4, 7), "facepalm", "laugh", "shake"],
    [C(5), "doublePoint", "thinking"],
    [C(6), "leanIn", "excited"],
    [C(7), "pointSide", "happy"],
    [C(8), "count2", "determined", "nod"],
  ];

  // the 4 slices: positions fan out from the single tag
  const four = [0, 1, 2, 3].map((i) => ({
    x: 1150 + (i - 1.5) * interpolate(split, [0, 1], [0, 300]) * (1 - rejoin * 0.25),
    y: 450 + (i % 2 ? 1 : -1) * 30 * split * (1 - rejoin) - 90 * rejoin,
    r: (i - 1.5) * 6 * split * (1 - rejoin),
  }));

  return (
    <Stage
      bg={<Bg f={g} kind="market" />}
      hits={[W(0, 8) - from, W(4, 7) - from]}
      power={8}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* the single tag, then the four slices */}
            {!sliced && <PriceTag x={1150} y={450} text="₹4,000" sub="HEADPHONES" glow={0.6 + 0.4 * Math.sin(g / 4)} o={tagsO} w={560} fs={130} />}
            {sliced &&
              four.map((p, i) => (
                <PriceTag key={i} x={p.x} y={p.y} r={p.r} text="₹1,000" w={rejoin > 0 ? 250 : 260} fs={62} s={0.95 - 0.2 * rejoin} o={tagsO} glow={i === 0 ? mag : 0} fill={i === 0 && mag > 0 ? MINT : PAPER} />
              ))}
            {/* the giant cutter sweeps down through the tag */}
            <Cutter x={interpolate(cutK, [0, 1], [1500, 820])} y={interpolate(cutK, [0, 1], [180, 520])} r={-35} spin={g * 14} s={1.1} o={vis(g, -10, W(0, 8) + 18, 6)} />
            {/* brain + magnifier reads one slice */}
            <g opacity={mag}>
              <Brain x={four[0].x - 10} y={300} s={pop(g, C(1)) * 0.8} />
              <g transform={`translate(${four[0].x + 10} ${four[0].y}) rotate(${Math.sin(g / 8) * 6})`}>
                <circle r={120} fill="#ffffff" opacity={0.2} stroke={INK} strokeWidth={12} />
                <line x1={84} y1={84} x2={170} y2={170} stroke={INK} strokeWidth={22} strokeLinecap="round" />
              </g>
            </g>
            <Pill x={1150} y={720} text="IT ONLY READS ONE SLICE" fill={CORAL} s={pop(g, W(1, 6))} o={vis(g, W(1, 6), CE(1) + 6)} fs={44} />
            {/* equation */}
            <g opacity={vis(g, C(2), C(4) - 4)}>
              <T x={1150} y={640} fs={68} fill={PAPER} stroke s={pop(g, W(2, 5))}>
                4 × ₹1,000 = ₹4,000
              </T>
            </g>
            {/* feeling bars: big vs small */}
            <g opacity={vis(g, C(3), C(4) - 4)}>
              <T x={1150} y={210} fs={44} fill={AMBER}>
                HOW IT FEELS
              </T>
              <rect x={1020} y={240 + 160 * (1 - soft(g, C(3), C(3) + 12))} width={110} height={160 * soft(g, C(3), C(3) + 12)} fill={CORAL} {...K} />
              <rect x={1180} y={360} width={110} height={40 * soft(g, W(3, 5), W(3, 5) + 10)} fill={MINT} {...K} />
              <T x={1075} y={140 + 300} fs={30} fill="#fff">
                ONCE
              </T>
              <T x={1235} y={440} fs={30} fill="#fff">
                SPLIT
              </T>
            </g>
            {/* myth */}
            <g opacity={vis(g, C(4), CE(5) + 6)} transform={`translate(1150 420) scale(${pop(g, C(4))})`}>
              <PriceTag x={0} y={0} text="0% = FREE?" w={560} fs={84} fill={AMBER} />
              <XStamp x={30} y={0} f={g} at={W(4, 7)} label="MYTH" s={0.85} />
            </g>
            <g opacity={vis(g, C(5), CE(5) + 6)}>
              <Pill x={1150} y={680} text="PRICE: SAME" fill={MINT} color={INK} s={pop(g, W(5, 2))} fs={48} />
              <Pill x={1150} y={790} text="FEELING: CHANGED" fill={CORAL} s={pop(g, W(5, 6))} fs={48} />
            </g>
            {/* promise: 3 icons */}
            <g opacity={vis(g, C(6), CE(8) + 10)}>
              <g transform={`translate(650 430) scale(${pop(g, W(6, 7))})`}>
                <circle r={130} fill={PAPER} {...K} strokeWidth={6} />
                <Brain x={0} y={10} s={0.95} />
                <T x={0} y={190} fs={42} fill={MINT}>
                  THE TRICK
                </T>
              </g>
              <g transform={`translate(960 430) scale(${pop(g, W(7, 5))})`}>
                <circle r={130} fill={PAPER} {...K} strokeWidth={6} />
                {[0, 1, 2].map((i) => (
                  <PlanBlock key={i} x={(i - 1) * 6} y={60 - i * 52} label="" s={0.42} fill={[MINT, CORAL, AMBER][i]} r={(i - 1) * 4} />
                ))}
                <T x={0} y={190} fs={42} fill={MINT}>
                  THE DATA
                </T>
              </g>
              <g transform={`translate(1270 430) scale(${pop(g, W(8, 2))})`}>
                <circle r={130} fill={PAPER} {...K} strokeWidth={6} />
                <circle r={84} fill="#ffffff" {...K} strokeWidth={6} />
                <line x1={0} y1={0} x2={Math.sin(g / 6) * 60} y2={-Math.cos(g / 6) * 60} stroke={CORAL_D} strokeWidth={10} strokeLinecap="round" />
                <T x={0} y={130 - 96} fs={36}>
                  10s
                </T>
                <T x={0} y={190} fs={42} fill={MINT}>
                  THE CHECK
                </T>
              </g>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(6, 7)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={-14} out={W(0, 8) - 2} x={960} y={130} size={130} color={MINT}>
            PAY IN 4 = ?
          </Big>
          <Big f={g} at={W(0, 8)} out={CE(1)} x={960} y={130} size={120} color={AMBER} r={-2}>
            SAME PRICE. LESS PAIN?
          </Big>
          <Big f={g} at={W(3, 5)} out={C(4) - 2} x={1150} y={110} size={110} color={CORAL} r={3}>
            WHY?
          </Big>
          <Big f={g} at={W(6, 2)} out={CE(8) + 6} x={860} y={150} size={96} color={PAPER}>
            BY THE END
          </Big>
          <Note f={g} at={0} out={C(4)}>
            Prices are illustrative
          </Note>
          <Cuts f={g} times={CUTS} dur={20} />
        </>
      }
    />
  );
};
