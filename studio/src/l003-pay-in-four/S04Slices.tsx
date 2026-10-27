import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, CORAL_D, Cuts, INK, K, MINT, Note, PAPER, PainMeter, PlanBlock, PriceTag, SPARK, SparkHost, T, TCOLS, W, You,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// CH3 · Four small numbers (2:08–2:46). Coral checker counter. A big number display: the brain judges what's in front of
// it. A balance: ₹4,000 slams down heavy, ₹1,000 floats light. WOW: split-screen before/after (ONCE vs SPLIT) with two
// pain meters. Three later payments drop one at a time while an "excitement" balloon deflates. A price pizza cut into four;
// YOU tastes only the first slice (the rest go grey). Slices snap back together: SAME PIZZA. Open loop: blocks begin to
// stack in the background.

const A = C(40);
const B = CE(51);
const SPLIT = C(44);
const PIZZA = C(48);
const CUTS = cutTimes(A, B, 160).filter((t) => Math.abs(t - SPLIT) > 45 && Math.abs(t - PIZZA) > 45 && Math.abs(t - C(45)) > 30);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.25, at: CONTENT }, { z: 1.35, at: SPARK }, { z: 1.1, at: [960, 480] }];

export const S04_SFX: SfxCue[] = [
  [A, "swirl", 0.35],
  [W(40, 4), "boing", 0.35],
  [W(41, 6), "pop", 0.45],
  [W(42, 5), "slam", 0.55],
  [W(43, 5), "pop", 0.4],
  [SPLIT - 4, "whoosh", 0.45],
  [W(44, 6), "impact", 0.5],
  [C(45), "tick", 0.35],
  [W(46, 2), "thud", 0.35],
  [W(46, 4), "thud", 0.35],
  [W(46, 6), "thud", 0.35],
  [W(47, 3), "freeze", 0.35],
  [PIZZA - 4, "whoosh_long", 0.35],
  [W(48, 5), "slam", 0.45],
  [W(49, 4), "pop", 0.45],
  [W(50, 5), "clink", 0.45],
  [W(50, 7), "stamp", 0.55],
  [C(51), "riser", 0.4],
  [W(51, 6), "thud", 0.45],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

// a price pizza: 4 slices, each can be pulled out (k) and greyed (grey)
const Pizza: React.FC<{ x: number; y: number; s: number; pull: number[]; grey: number[]; o?: number }> = ({ x, y, s, pull, grey, o = 1 }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {[0, 1, 2, 3].map((i) => {
        const a0 = -90 + i * 90;
        const mid = ((a0 + 45) * Math.PI) / 180;
        const dx = Math.cos(mid) * 90 * pull[i];
        const dy = Math.sin(mid) * 90 * pull[i];
        const R = 230;
        const p0 = [Math.cos((a0 * Math.PI) / 180) * R, Math.sin((a0 * Math.PI) / 180) * R];
        const p1 = [Math.cos(((a0 + 90) * Math.PI) / 180) * R, Math.sin(((a0 + 90) * Math.PI) / 180) * R];
        return (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            <path d={`M 0 0 L ${p0[0]} ${p0[1]} A ${R} ${R} 0 0 1 ${p1[0]} ${p1[1]} Z`} fill={grey[i] > 0.5 ? "#c9c2b8" : AMBER} {...K} strokeWidth={7} />
            <path d={`M ${p0[0] * 0.92} ${p0[1] * 0.92} A ${R * 0.92} ${R * 0.92} 0 0 1 ${p1[0] * 0.92} ${p1[1] * 0.92}`} fill="none" stroke={grey[i] > 0.5 ? "#a9a29a" : CORAL} strokeWidth={22} />
            <text x={Math.cos(mid) * 130} y={Math.sin(mid) * 130 + 14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
              ₹1,000
            </text>
          </g>
        );
      })}
    </g>
  );

export const S04Slices: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45, e: "cut" },
    { f: C(43), x: 330, s: 3.0, e: "snap" },
    { f: SPLIT, x: 300, s: 1.45, e: "cut" },
    { f: C(45), x: 1600, s: 1.45, e: "slow" },
    { f: C(49), x: 1580, s: 2.6, e: "snap" },
    { f: C(50), x: 1600, s: 1.45 },
    { f: C(51), x: 320, s: 1.45, e: "slow" },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(42, 5), z: 1.3, at: [1000, 600], e: "snap" },
      { f: C(43), z: 1, e: "smooth" },
      { f: SPLIT, z: 1, e: "cut" },
      { f: W(44, 6), z: 1.12, at: [960, 520], e: "snap" },
      { f: C(45), z: 1, e: "smooth" },
      { f: W(50, 7), z: 1.25, at: [1150 + sh, 500], e: "snap" },
      { f: C(51), z: 1, e: "smooth" },
    ],
    places,
  );
  const z = punch(g, [W(42, 5), W(44, 6), W(48, 5), W(50, 7)], 0.05);

  const p1 = vis(g, A - 6, SPLIT, 2);
  const p2 = vis(g, SPLIT, C(45), 2);
  const p3 = vis(g, C(45), PIZZA, 2);
  const p4 = vis(g, PIZZA, B + 20, 2);
  const tilt = g < W(42, 5) ? 0 : g < W(43, 5) ? interpolate(g, [W(42, 5), W(42, 5) + 8], [0, -14], clamp) : interpolate(g, [W(43, 5), W(43, 5) + 10], [-14, 9], clamp);
  const later = [W(46, 2), W(46, 4), W(46, 6)];
  const balloon = interpolate(g, [W(47, 1), CE(47)], [1, 0.35], clamp);
  const pulled = soft(g, W(48, 5), W(48, 5) + 10) * (1 - soft(g, W(50, 5), W(50, 5) + 8));
  const greyK = g >= W(49, 6) && g < W(50, 5) ? 1 : 0;

  const rows: Act[] = [
    [A, "leanIn", "smug"],
    [C(41), "pointSide", "curious"],
    [W(42, 5), "recoil", "shock"],
    [C(43), "whisper", "wink"],
    [SPLIT, "presentBoth", "neutral"],
    [W(44, 6), "doublePoint", "excited", "nod"],
    [C(45), "thinkChin", "thinking"],
    [C(46), "count1", "neutral"],
    [C(47), "shrugBig", "sad"],
    [C(48), "present", "wink"],
    [W(49, 4), "pointDown", "laugh", "hop"],
    [C(50), "armsCrossed", "skeptical"],
    [W(50, 7), "fistPump", "determined", "nod"],
    [C(51), "beckon", "curious"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="slice" />}
      hits={[W(42, 5) - from, W(44, 6) - from, W(50, 7) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* staging 1: number display + balance */}
            <g opacity={p1}>
              <g transform={`translate(1150 260) scale(${pop(g, W(41, 6))})`} opacity={vis(g, W(41, 6), CE(41) + 6)}>
                <rect x={-330} y={-110} width={660} height={220} rx={24} fill={CHAR} {...K} strokeWidth={7} />
                <text x={0} y={46} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={140} fill={MINT}>
                  ₹1,000
                </text>
                <g transform="translate(-420 0)">
                  <ellipse rx={70} ry={46} fill="#fff" {...K} strokeWidth={6} />
                  <circle cx={14} r={24} fill={INK} />
                </g>
              </g>
              <g transform="translate(1150 520)" opacity={vis(g, C(42) - 4, SPLIT)}>
                <rect x={-14} y={0} width={28} height={330} fill={CHAR} />
                <path d="M -90 330 L 90 330 L 50 300 L -50 300 Z" fill={CHAR} />
                <g transform={`rotate(${tilt})`}>
                  <rect x={-380} y={-12} width={760} height={24} rx={12} fill={CHAR} />
                  <g transform="translate(-340 0)">
                    <line x1={0} y1={0} x2={-60} y2={130} stroke={INK} strokeWidth={5} />
                    <line x1={0} y1={0} x2={60} y2={130} stroke={INK} strokeWidth={5} />
                    <rect x={-110} y={130} width={220} height={24} rx={10} fill={PAPER} {...K} />
                    {g >= W(42, 5) && <PlanBlock x={0} y={78} label="₹4,000" fill={CORAL} s={0.62 * pop(g, W(42, 5))} paid={4} />}
                  </g>
                  <g transform="translate(340 0)">
                    <line x1={0} y1={0} x2={-60} y2={130} stroke={INK} strokeWidth={5} />
                    <line x1={0} y1={0} x2={60} y2={130} stroke={INK} strokeWidth={5} />
                    <rect x={-110} y={130} width={220} height={24} rx={10} fill={PAPER} {...K} />
                    {g >= W(43, 5) && <PlanBlock x={0} y={78} label="₹1,000" fill={MINT} s={0.62 * pop(g, W(43, 5))} paid={1} />}
                  </g>
                </g>
              </g>
              <T x={800} y={380} fs={52} fill={CORAL_D} o={vis(g, W(42, 5), SPLIT)}>
                BIG DECISION
              </T>
              <T x={1500} y={380} fs={52} fill={CORAL_D} o={vis(g, W(43, 5), SPLIT)}>
                small one
              </T>
            </g>

            {/* staging 2 (WOW): split-screen ONCE vs SPLIT */}
            <g opacity={p2} transform={`translate(${-sh} 0)`}>
              <rect x={0} y={0} width={960} height={1080} fill={CORAL} opacity={0.18} />
              <rect x={960} y={0} width={960} height={1080} fill={MINT} opacity={0.22} />
              <line x1={960} y1={0} x2={960} y2={1080} stroke={INK} strokeWidth={10} />
              <T x={620} y={250} fs={72} fill={CORAL_D}>
                PAY ONCE
              </T>
              <T x={1460} y={250} fs={72} fill="#0f6e52">
                SPLIT IN 4
              </T>
              <PriceTag x={620} y={400} text="₹4,000" w={380} fs={84} s={0.85} fill={PAPER} />
              <PriceTag x={1460} y={400} text="₹1,000" w={380} fs={84} s={0.85} fill={PAPER} />
              <PainMeter x={620} y={720} v={g >= W(44, 6) ? 0.9 : 0.4} s={0.62} />
              <PainMeter x={1460} y={720} v={g >= W(44, 6) ? 0.2 : 0.4} s={0.62} />
            </g>

            {/* staging 3: later payments + deflating excitement */}
            <g opacity={p3}>
              {later.map((at, i) =>
                g >= at ? (
                  <g key={i} transform={`translate(${780 + i * 300} ${interpolate(g, [at, at + 10], [-200, 420], clamp)})`}>
                    <line x1={0} y1={-500} x2={0} y2={-110} stroke="#8a909c" strokeWidth={4} />
                    <PriceTag x={0} y={0} text="₹1,000" sub={`WEEK ${(i + 1) * 2}`} w={230} fs={56} s={0.9} r={4 - i * 4} />
                  </g>
                ) : null,
              )}
              <g transform={`translate(1150 760)`}>
                <line x1={0} y1={0} x2={0} y2={-120 * balloon} stroke={INK} strokeWidth={4} />
                <ellipse cx={0} cy={-120 * balloon - 60 * balloon} rx={70 * balloon} ry={85 * balloon} fill={PINK_OR(balloon)} {...K} strokeWidth={5} />
                <text x={0} y={60} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={36} fill={INK} opacity={vis(g, C(47), PIZZA)}>
                  EXCITEMENT
                </text>
              </g>
            </g>

            {/* staging 4: the pizza */}
            <g opacity={p4}>
              <Pizza x={1150} y={500} s={0.9 * pop(g, PIZZA + 2)} pull={[pulled, pulled * 0.6, pulled * 0.6, pulled * 0.6]} grey={[0, greyK, greyK, greyK]} />
              <You
                f={g}
                x={720}
                beats={[
                  [PIZZA, "present"],
                  [W(49, 4), "pointSide"],
                  [W(50, 5), "shrugBig"],
                ]}
                face={(t) => (t >= W(49, 4) && t < W(50, 5) ? "happy" : "eyes")}
                o={vis(g, PIZZA, C(51) + 10)}
                facing={1}
              />
              {g >= W(50, 7) && (
                <g transform={`translate(1150 500) scale(${interpolate(g - W(50, 7), [0, 4, 8], [2.4, 0.9, 1], clamp)}) rotate(-8)`}>
                  <rect x={-260} y={-56} width={520} height={112} rx={14} fill="rgba(255,255,255,0.85)" stroke={CORAL_D} strokeWidth={12} />
                  <text x={0} y={28} textAnchor="middle" fontFamily={FONT.comic} fontSize={78} fill={CORAL_D}>
                    SAME ₹4,000
                  </text>
                </g>
              )}
              {/* open loop: blocks start stacking */}
              {[0, 1, 2].map((i) => {
                const at = W(51, 6) + i * 6;
                return g >= at ? <PlanBlock key={i} x={1600} y={interpolate(g, [at, at + 8], [-100, 790 - i * 105], clamp)} label={["SHOES", "PHONE", "TRIP"][i]} fill={[MINT, CORAL, AMBER][i]} s={0.9} r={(i - 1) * 3} paid={1} /> : null;
              })}
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(44, 6), W(50, 7)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(40, 4)} out={CE(40) + 4} x={960} y={130} size={130} color={CORAL}>
            SNEAKY.
          </Big>
          <Big f={g} at={W(44, 6)} out={CE(44)} x={960} y={105} size={100} color={AMBER}>
            DIFFERENT FEELING
          </Big>
          <Big f={g} at={W(46, 2)} out={CE(46)} x={1150} y={130} size={110} color={PAPER}>
            …LATER.
          </Big>
          <Big f={g} at={W(49, 6)} out={CE(49) + 4} x={960} y={130} size={110} color={MINT}>
            ONLY THE FIRST SLICE
          </Big>
          <Big f={g} at={W(50, 5)} out={CE(50)} x={960} y={130} size={120} color={AMBER} r={-2}>
            NOT SMALLER. SLICED.
          </Big>
          <Note f={g} at={A} out={B}>
            Illustrative amounts
          </Note>
          <Cuts f={g} times={CUTS} seed={3} dur={18} />
          <Transition f={g} at={SPLIT} kind="whip" colors={TCOLS} dur={16} />
          <Transition f={g} at={C(45)} kind="iris" colors={TCOLS} dur={18} irisAt={[960, 500]} />
          <Transition f={g} at={PIZZA} kind="slice" colors={TCOLS} dur={18} />
        </>
      }
    />
  );
};

const PINK_OR = (k: number) => (k > 0.7 ? "#ff4fa3" : k > 0.5 ? "#ff8cc1" : "#d9b3c4");
