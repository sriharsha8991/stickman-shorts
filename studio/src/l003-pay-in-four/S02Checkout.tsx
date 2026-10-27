import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, Cuts, INK, K, MINT, MINT_D, Note, PAPER, Phone, PriceTag, SPARK, SparkHost, Src, T, TCOLS, W, You,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, youHead, CONTENT, type Frame,
} from "./world";

// CH1 · The checkout trick (0:32–1:08). A phone checkout at midnight: ₹4,000 headphones, YOU winces; a "4 × ₹1,000 ·
// 0% interest" button slides in and the wince melts (Spark laughs). Iris → a six-week timeline: 25% today, then three
// more every two weeks, PAID at week 6 (source line: CFPB 2025). "Not the price" → WOW: the camera dives into YOU's head
// (zoom-through + flash) on "inside your head".

const A = C(9);
const B = CE(20);
const DIVE = C(20);
const CUTS = cutTimes(A, B, 155).filter((t) => Math.abs(t - C(15)) > 40 && t < DIVE - 30);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.25, at: CONTENT }, { z: 1.35, at: SPARK }, { z: 1.1, at: [960, 500] }];
const YOU_X = 980;

export const S02_SFX: SfxCue[] = [
  [A, "page", 0.4],
  [W(9, 5), "tick", 0.35],
  [W(10, 0), "pop", 0.4],
  [W(10, 2), "kaching", 0.45],
  [W(11, 1), "buzz", 0.4],
  [W(12, 3) - 4, "whoosh", 0.4],
  [W(12, 3), "clink", 0.45],
  [W(13, 5), "ding", 0.45],
  [W(14, 4), "swirl", 0.4],
  [W(14, 5), "boing", 0.3],
  [C(15) - 2, "whoosh_long", 0.4],
  [W(16, 3), "kaching", 0.45],
  [W(17, 1), "thud", 0.35],
  [W(17, 3), "thud", 0.35],
  [W(17, 5), "thud", 0.35],
  [W(18, 5), "stamp", 0.55],
  [W(19, 6), "slam", 0.45],
  [DIVE - 4, "riser", 0.5],
  [W(20, 4), "impact", 0.55],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

// headphones icon
const Headphones: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -80 30 L -80 -10 A 80 80 0 0 1 80 -10 L 80 30" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <rect x={-104} y={10} width={50} height={80} rx={20} fill={CORAL} {...K} />
    <rect x={54} y={10} width={50} height={80} rx={20} fill={CORAL} {...K} />
  </g>
);

export const S02Checkout: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45 },
    { f: C(14), x: 330, s: 2.7, e: "snap" },
    { f: C(15), x: 1600, s: 1.45 },
    { f: C(19), x: 1580, s: 3.2, e: "snap" },
    { f: C(20), x: 1620, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const head = youHead(1150 + sh - 170, 1.3);
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(13, 5), z: 1.25, at: [1250, 520], e: "snap" },
      { f: C(14) + 10, z: 1, e: "smooth" },
      { f: DIVE, z: 1, e: "cut" },
      { f: DIVE + 4, z: 3.2, at: head, e: "slow" },
    ],
    places,
  );
  const z = punch(g, [W(10, 2), W(13, 5), W(18, 5), W(19, 6)], 0.045);

  const shopO = vis(g, A - 10, C(15), 8);
  const btn = soft(g, W(12, 3) - 6, W(12, 3) + 6);
  const melted = g >= W(14, 4);
  const winceK = vis(g, W(11, 1), W(14, 4), 4);
  const lineO = vis(g, C(15), CE(18) + 6, 8);
  const nodes = [0, 1, 2, 3].map((i) => 650 + i * 333);
  const nodeAt = [W(16, 3), W(17, 1), W(17, 3), W(17, 5)];
  const youBack = vis(g, C(19), B + 20, 8);

  const rows: Act[] = [
    [A, "present", "curious"],
    [W(10, 2), "pointSide", "worried"],
    [C(11), "recoil", "worried", "shake"],
    [C(12), "pointDown", "curious"],
    [W(13, 5), "doublePoint", "excited"],
    [W(14, 4), "clap1", "laugh", "hop"],
    [C(15), "presentBoth", "happy"],
    [C(16), "count1", "neutral"],
    [C(17), "pointSide", "thinking"],
    [W(18, 5), "fistPump", "excited", "nod"],
    [C(19), "armsCrossed", "skeptical"],
    [C(20), "pointUp", "curious"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="market" />}
      hits={[W(10, 2) - from, W(18, 5) - from, W(20, 4) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* moon */}
            <g opacity={shopO}>
              <circle cx={1650} cy={150} r={60} fill={PAPER} opacity={0.9} />
              <circle cx={1680} cy={130} r={56} fill="#1d2027" />
            </g>
            {/* phone checkout */}
            <Phone x={1330} y={470} s={0.9 * pop(g, A + 2)} o={shopO} r={-3}>
              <rect x={-178} y={-326} width={356} height={70} fill={CHAR} />
              <text x={0} y={-280} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={34} fill={MINT}>
                CHECKOUT · 11:58 PM
              </text>
              {g >= W(10, 0) && <Headphones x={0} y={-150} s={pop(g, W(10, 0)) * 0.9} />}
              {g >= W(10, 2) && (
                <text x={0} y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={84} fill={INK} transform={`scale(${pop(g, W(10, 2))})`}>
                  ₹4,000
                </text>
              )}
              <rect x={-150} y={80} width={300} height={74} rx={18} fill={CORAL} {...K} strokeWidth={4} opacity={g >= W(10, 2) ? 1 : 0} />
              <text x={0} y={130} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={38} fill="#fff" opacity={g >= W(10, 2) ? 1 : 0}>
                PAY ₹4,000
              </text>
              {btn > 0 && (
                <g transform={`translate(${interpolate(btn, [0, 1], [420, 0])} 0)`}>
                  <rect x={-160} y={176} width={320} height={110} rx={20} fill={MINT} {...K} strokeWidth={5} />
                  <text x={0} y={224} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
                    4 × ₹1,000
                  </text>
                  <text x={0} y={268} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={28} fill={INK} opacity={soft(g, W(13, 5), W(13, 5) + 6)}>
                    0% interest
                  </text>
                </g>
              )}
            </Phone>
            {/* YOU at the counter */}
            <You
              f={g}
              x={YOU_X}
              beats={[
                [A, "present"],
                [W(11, 1), "recoil"],
                [W(12, 3), "pointSide"],
                [W(14, 4), "celebrate"],
              ]}
              face={(t) => (t >= W(11, 1) && t < W(14, 4) ? "sad" : t >= W(14, 4) ? "happy" : "eyes")}
              o={shopO}
              facing={1}
            />
            {winceK > 0 &&
              [0, 1, 2].map((i) => (
                <path key={i} d="M 0 0 Q 10 18 0 26 Q -10 18 0 0 Z" fill="#7fd3ff" stroke={INK} strokeWidth={3} transform={`translate(${YOU_X - 40 + i * 40} ${560 + ((g * 2 + i * 9) % 40)})`} opacity={winceK} />
              ))}
            {melted && (
              <g opacity={vis(g, W(14, 4), C(15) - 2)}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} cx={YOU_X - 60 + i * 30} cy={520 - (g - W(14, 4)) * (1 + i * 0.3)} r={10} fill={MINT} opacity={0.7} />
                ))}
              </g>
            )}

            {/* six-week timeline */}
            <g opacity={lineO}>
              <T x={1150} y={250} fs={64} fill={PAPER} stroke>
                HOW PAY-IN-4 WORKS
              </T>
              <line x1={600} y1={560} x2={600 + 1100 * soft(g, C(15), C(16))} y2={560} stroke={MINT} strokeWidth={12} strokeLinecap="round" />
              {nodes.map((x, i) => (
                <g key={i}>
                  <circle cx={x} cy={560} r={26} fill={g >= nodeAt[i] ? AMBER : CHAR} stroke={MINT} strokeWidth={8} />
                  <T x={x} y={640} fs={40} fill={PAPER}>
                    {i === 0 ? "TODAY" : `WEEK ${i * 2}`}
                  </T>
                  {g >= nodeAt[i] && (
                    <g transform={`translate(${x} ${interpolate(g, [nodeAt[i], nodeAt[i] + 8], [250, 440], clamp)})`}>
                      <rect x={-90} y={-40} width={180} height={80} rx={16} fill={i === 0 ? AMBER : MINT} {...K} />
                      <text x={0} y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
                        25%
                      </text>
                    </g>
                  )}
                </g>
              ))}
              {g >= W(18, 5) && (
                <g transform={`translate(${nodes[3]} 760) scale(${interpolate(g - W(18, 5), [0, 4, 8], [2.2, 0.9, 1], clamp)}) rotate(-8)`}>
                  <rect x={-120} y={-44} width={240} height={88} rx={12} fill="none" stroke={MINT_D} strokeWidth={10} />
                  <text x={0} y={22} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={MINT}>
                    PAID
                  </text>
                </g>
              )}
            </g>

            {/* not the price: YOU returns with the same tag */}
            <g opacity={youBack}>
              <PriceTag x={1250} y={330} text="₹4,000" sub="STILL" w={420} fs={92} s={pop(g, W(19, 6)) * 0.9} fill={AMBER} r={-4} />
              <You f={g} x={1150 - 170} beats={[[C(19), "shrugBig"], [C(20), "thinkChin"]]} face={() => "eyes"} facing={1} />
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(14, 4)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(9, 5)} out={CE(9)} x={960} y={110} size={96} color={PAPER}>
            MIDNIGHT CHECKOUT
          </Big>
          <Big f={g} at={W(11, 1)} out={CE(11)} x={620} y={220} size={110} color={CORAL} r={-4}>
            OUCH.
          </Big>
          <Big f={g} at={W(14, 4)} out={CE(14) + 8} x={620} y={220} size={110} color={MINT} r={3}>
            …AHH.
          </Big>
          <Big f={g} at={W(19, 6)} out={CE(19)} x={720} y={150} size={110} color={AMBER} r={-2}>
            NOT THE PRICE
          </Big>
          <Note f={g} at={A} out={CE(14)}>
            Illustrative prices · no real app
          </Note>
          <Src f={g} at={C(15)} out={CE(18)}>
            CFPB, BNPL report (Jan 2025): pay-in-4 = 0% interest, 25% down, then 3 payments every 2 weeks
          </Src>
          <Cuts f={g} times={CUTS} seed={1} dur={18} />
          <Transition f={g} at={C(15)} kind="iris" colors={TCOLS} irisAt={[960, 520]} dur={20} />
          <Transition f={g} at={W(20, 4)} kind="flash" colors={[CORAL, MINT, AMBER]} dur={16} />
        </>
      }
    />
  );
};
