import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, CORAL_D, Cuts, GROUND, INK, K, MINT, MINT_D, PAPER, PINK, PlanBlock, SPARK, SparkHost, Src, T, TCOLS, W, You,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// CH5 · The rules catch up (3:31–3:55). Cool hall with columns. A velvet rope with plan blocks OUTSIDE it and a rule
// book. A calendar page flips to 15 JUL 2026 and a REGULATED stamp lands; the blocks hop inside the rope. Three goals pop
// as cards: clear information · affordable borrowing · support. Pull back: a watchman's lamp outside the tower vs YOU's
// own small stack that only YOU can see.

const A = C(66);
const B = CE(72);
const SWAP = C(71);
const CUTS = cutTimes(A, B, 155).filter((t) => Math.abs(t - SWAP) > 45);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.35, at: SPARK }, { z: 1.08, at: [960, 470] }];

export const S06_SFX: SfxCue[] = [
  [A, "page", 0.4],
  [W(66, 6), "buzz", 0.35],
  [W(67, 1), "page", 0.5],
  [W(67, 6), "stamp", 0.6],
  [W(67, 6) + 10, "boing", 0.3],
  [W(68, 4), "pop", 0.45],
  [W(69, 5), "pop", 0.45],
  [W(70, 1), "pop", 0.45],
  [W(70, 5), "ding", 0.35],
  [SWAP - 4, "whoosh_long", 0.35],
  [W(71, 3), "clink", 0.4],
  [W(72, 6), "kaching", 0.45],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Card: React.FC<{ x: number; y: number; s: number; title: string; color: string; icon: React.ReactNode }> = ({ x, y, s, title, color, icon }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-170} y={-190} width={340} height={380} rx={30} fill={PAPER} {...K} strokeWidth={7} />
      <circle cx={0} cy={-60} r={80} fill={color} {...K} strokeWidth={6} />
      <g transform="translate(0 -60)">{icon}</g>
      <foreignObject x={-150} y={40} width={300} height={140}>
        <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: INK, textAlign: "center", lineHeight: 1.05 }}>{title}</div>
      </foreignObject>
    </g>
  );

export const S06Rules: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45, e: "cut" },
    { f: C(67), x: 330, s: 2.8, e: "snap" },
    { f: C(68), x: 300, s: 1.45 },
    { f: C(70), x: 1620, s: 1.45, e: "slow" },
    { f: C(72), x: 1580, s: 3.2, e: "snap" },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(67, 1), z: 1.3, at: [1300, 420], e: "snap" },
      { f: W(67, 6) + 14, z: 1, e: "smooth" },
      { f: SWAP, z: 1, e: "cut" },
      { f: SWAP + 2, z: 1.1, at: [760, 560], e: "slow" },
    ],
    places,
  );
  const z = punch(g, [W(67, 6), W(68, 4), W(69, 5), W(70, 1)], 0.04);

  const p1 = vis(g, A - 6, C(68) - 2, 6);
  const p2 = vis(g, C(68), SWAP, 2);
  const p3 = vis(g, SWAP, B + 20, 2);
  const inside = soft(g, W(67, 6) + 6, W(67, 6) + 20);
  const flip = soft(g, W(67, 1) - 4, W(67, 1) + 8);

  const rows: Act[] = [
    [A, "presentBoth", "neutral"],
    [W(66, 6), "stop", "skeptical"],
    [C(67), "pointUp", "excited", "nod"],
    [W(67, 6), "fistPump", "happy", "hop"],
    [C(68), "count1", "neutral"],
    [C(69), "count2", "neutral"],
    [C(70), "present", "happy"],
    [C(71), "pointSide", "thinking"],
    [C(72), "leanIn", "determined", "nod"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="hall" />}
      hits={[W(67, 6) - from]}
      power={6}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* staging 1: rope + rulebook + calendar */}
            <g opacity={p1}>
              {/* rope */}
              {[800, 1200].map((x) => (
                <g key={x}>
                  <rect x={x - 12} y={620} width={24} height={GROUND - 620} fill={AMBER} {...K} strokeWidth={4} />
                  <circle cx={x} cy={612} r={22} fill={AMBER} {...K} strokeWidth={4} />
                </g>
              ))}
              <path d="M 800 640 Q 1000 720 1200 640" fill="none" stroke={CORAL_D} strokeWidth={16} />
              <T x={1000} y={600} fs={34} fill={CHAR}>
                THE RULES
              </T>
              {[0, 1, 2].map((i) => (
                <PlanBlock
                  key={i}
                  x={interpolate(inside, [0, 1], [1440 + i * 18, 1000 + (i - 1) * 8])}
                  y={GROUND - 50 - i * 100 - Math.sin(inside * Math.PI) * 120}
                  label={["PAY IN 4", "PAY IN 4", "PAY IN 4"][i]}
                  fill={[MINT, CORAL, AMBER][i]}
                  s={0.7}
                  r={(i - 1) * 4}
                />
              ))}
              {/* calendar */}
              <g transform={`translate(1350 330) scale(${pop(g, W(67, 1) - 6)})`} opacity={vis(g, W(67, 1) - 6, C(68) - 2)}>
                <rect x={-150} y={-150} width={300} height={300} rx={24} fill={PAPER} {...K} strokeWidth={7} />
                <rect x={-150} y={-150} width={300} height={80} rx={24} fill={CORAL} {...K} strokeWidth={7} />
                <text x={0} y={-95} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill="#fff">
                  {flip > 0.5 ? "JUL 2026" : "JUN 2026"}
                </text>
                <text x={0} y={60} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={140} fill={INK} transform={`scale(1 ${Math.abs(1 - 2 * Math.min(1, flip * 1.0))})`}>
                  {flip > 0.5 ? "15" : "30"}
                </text>
              </g>
              {g >= W(67, 6) && (
                <g transform={`translate(1100 330) scale(${interpolate(g - W(67, 6), [0, 4, 8], [2.4, 0.9, 1], clamp)}) rotate(-10)`}>
                  <rect x={-250} y={-56} width={500} height={112} rx={14} fill="rgba(255,255,255,0.85)" stroke={MINT_D} strokeWidth={12} />
                  <text x={0} y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={80} fill={MINT_D}>
                    REGULATED
                  </text>
                </g>
              )}
            </g>

            {/* staging 2: the three goals */}
            <g opacity={p2}>
              <T x={1150} y={190} fs={56} fill={CHAR}>
                THE UK RULES AIM FOR
              </T>
              <Card
                x={750}
                y={520}
                s={pop(g, W(68, 4))}
                title="CLEAR INFO ON RISKS"
                color={MINT}
                icon={
                  <text x={0} y={34} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={100} fill={INK}>
                    i
                  </text>
                }
              />
              <Card
                x={1150}
                y={520}
                s={pop(g, W(69, 5))}
                title="BORROWING YOU CAN AFFORD"
                color={AMBER}
                icon={<path d="M -40 0 L -10 30 L 45 -30" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />}
              />
              <Card
                x={1550}
                y={520}
                s={pop(g, W(70, 1))}
                title="SUPPORT IF YOU FALL BEHIND"
                color={PINK}
                icon={
                  <g>
                    <circle r={44} fill="none" stroke="#fff" strokeWidth={22} />
                    <circle r={44} fill="none" stroke={CORAL} strokeWidth={22} strokeDasharray="34 34" />
                  </g>
                }
              />
            </g>

            {/* staging 3: watchman outside vs your own stack */}
            <g opacity={p3}>
              <g transform={`translate(1350 ${GROUND}) scale(0.6)`}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <PlanBlock key={i} x={(i % 2) * 10} y={-60 - i * 110} label="" fill={[MINT, CORAL, AMBER, PINK][i % 4]} r={(i % 3) - 1} />
                ))}
              </g>
              <g transform={`translate(1640 ${GROUND - 260})`}>
                <rect x={-10} y={0} width={20} height={260} fill={CHAR} />
                <path d={`M 0 0 L ${-380 + Math.sin(g / 12) * 40} -160 L ${-380 + Math.sin(g / 12) * 40} 140 Z`} fill={AMBER} opacity={0.25} />
                <circle r={30} fill={AMBER} {...K} strokeWidth={5} />
              </g>
              <T x={1500} y={380} fs={40} fill={CHAR} o={soft(g, W(71, 3), W(71, 3) + 8)}>
                RULES: FROM OUTSIDE
              </T>
              <You f={g} x={720} beats={[[SWAP, "present"], [W(72, 4), "pointDown"]]} facing={1} />
              {[0, 1, 2].map((i) => (
                <PlanBlock key={i} x={900} y={GROUND - 40 - i * 72} label="MINE" fill={[MINT, CORAL, AMBER][i]} s={0.6 * pop(g, W(72, 4) + i * 4)} r={(i - 1) * 3} />
              ))}
              <T x={900} y={GROUND - 290} fs={44} fill={CORAL_D} o={soft(g, W(72, 6), W(72, 6) + 8)}>
                ONLY YOU SEE THIS
              </T>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(72, 6)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(66, 6)} out={CE(66)} x={960} y={130} size={110} color={CORAL}>
            OUTSIDE THE RULES
          </Big>
          <Big f={g} at={W(67, 6)} out={CE(67)} x={960} y={130} size={110} color={MINT}>
            SINCE 15 JULY 2026
          </Big>
          <Src f={g} at={C(66)} out={CE(70)}>
            UK FCA, PS26/1 (Feb 2026): deferred payment credit regulated from 15 July 2026
          </Src>
          <Cuts f={g} times={CUTS} seed={0} dur={18} />
          <Transition f={g} at={SWAP} kind="shutter" colors={TCOLS} dur={18} />
        </>
      }
    />
  );
};
