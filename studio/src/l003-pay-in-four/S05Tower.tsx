import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Letterbox, Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, Cuts, Doc, GROUND, INK, K, MINT, PAPER, PINK, PlanBlock, SPARK, SparkHost, Src, T, TCOLS, W, You, YOU_COL,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// CH4 · The stacking tower (2:46–3:31). Dark skyline + searchlights. The CFPB report drops (2022 lender data); five
// people, one lights up: about 1 in 5 with a credit record used BNPL (21.2%). The number that stopped me: 63% counts up
// with a riser and a 10×10 grid fills (multiple loans open at once); 1 in 3 used more than one lender. WOW: plan blocks
// thud onto a tower (headphones, shoes, phone case…), more rain down, the camera pulls back on a giant wobbling tower; YOU
// can only see one block through a magnifier. Open loop: a searchlight sweeps — who is watching the tower?

const A = C(52);
const B = CE(65);
const NUM = C(56);
const TOWER = C(60);
const CUTS = cutTimes(A, B, 160).filter((t) => Math.abs(t - NUM) > 45 && Math.abs(t - TOWER) > 45 && Math.abs(t - W(57, 1)) > 40 && Math.abs(t - C(63)) > 50);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.35, at: SPARK }, { z: 1.08, at: [960, 470] }];

const BLOCKS: { label: string; at: () => number; fill: string }[] = [
  { label: "HEADPHONES", at: () => W(60, 6), fill: MINT },
  { label: "SHOES", at: () => W(61, 2), fill: CORAL },
  { label: "PHONE CASE", at: () => W(61, 6), fill: AMBER },
  { label: "JACKET", at: () => W(63, 1), fill: PINK },
  { label: "TRIP", at: () => W(63, 1) + 5, fill: MINT },
  { label: "GROCERIES", at: () => W(63, 1) + 10, fill: CORAL },
  { label: "GAME", at: () => W(63, 1) + 15, fill: AMBER },
  { label: "LAPTOP", at: () => W(63, 1) + 20, fill: MINT },
  { label: "GIFT", at: () => W(63, 1) + 25, fill: PINK },
  { label: "WATCH", at: () => W(63, 1) + 30, fill: CORAL },
];

export const S05_SFX: SfxCue[] = [
  [A, "page", 0.45],
  [W(52, 7), "stamp", 0.45],
  [W(53, 4), "tick", 0.4],
  [W(54, 1), "pop", 0.35],
  [W(54, 3), "ding", 0.45],
  [W(55, 3), "kaching", 0.4],
  [NUM - 30, "riser", 0.55],
  [W(57, 1), "impact", 0.6],
  [W(58, 4), "tick", 0.35],
  [W(59, 2), "slam", 0.45],
  [TOWER, "whoosh", 0.4],
  ...BLOCKS.slice(0, 3).map((b): SfxCue => [b.at() + 8, "thud", 0.55]),
  ...BLOCKS.slice(3).map((b): SfxCue => [b.at() + 8, "thud", 0.35]),
  [W(63, 1) + 40, "crash", 0.3],
  [W(64, 7), "chains", 0.35],
  [C(65), "whoosh_long", 0.35],
  [W(65, 5), "stinger", 0.45],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Person: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-90} r={34} fill={color} {...K} strokeWidth={5} />
    <path d="M -60 40 Q -60 -40 0 -44 Q 60 -40 60 40 Z" fill={color} {...K} strokeWidth={5} />
  </g>
);

// small svg pill (dark)
const Pill2: React.FC<{ x: number; y: number; text: string; o: number }> = ({ x, y, text, o }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <rect x={-text.length * 13 - 30} y={-34} width={text.length * 26 + 60} height={68} rx={34} fill={CHAR} stroke={MINT} strokeWidth={4} />
      <text x={0} y={13} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={36} fill={MINT}>
        {text}
      </text>
    </g>
  );

export const S05Tower: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45, e: "cut" },
    { f: NUM, x: 330, s: 3.0, e: "snap" },
    { f: C(57), x: 300, s: 1.45 },
    { f: TOWER, x: 1620, s: 1.45, e: "slow" },
    { f: C(64), x: 1580, s: 2.6, e: "snap" },
    { f: C(65), x: 1620, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const pull = soft(g, W(63, 1) + 4, W(63, 1) + 40); // tower group scales down = camera pulls back
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(57, 1), z: 1.3, at: [900, 470], e: "snap" },
      { f: C(58), z: 1, e: "smooth" },
      { f: W(60, 6), z: 1.25, at: [750, 700], e: "snap" },
      { f: C(62), z: 1.15, at: [750, 560], e: "smooth" },
      { f: C(63), z: 1, e: "cut" },
      { f: W(64, 7), z: 1.2, at: [750, 520], e: "snap" },
      { f: C(65), z: 1, e: "slow" },
    ],
    places,
  );
  const z = punch(g, [W(52, 7), W(57, 1), W(59, 2), W(60, 6) + 8], 0.05);

  const p1 = vis(g, A - 6, NUM, 2);
  const p2 = vis(g, NUM, TOWER, 2);
  const p3 = vis(g, TOWER, B + 20, 2);
  const pct = Math.round(interpolate(g, [W(57, 0) - 20, W(57, 1) + 2], [0, 63], clamp));
  const cells = Math.round(interpolate(g, [W(57, 1), C(58) + 30], [0, 63], clamp));
  const wob = g > W(63, 1) + 30 ? Math.sin(g / 6) * interpolate(g, [W(63, 1) + 30, W(64, 7), B], [1.5, 3.5, 2], clamp) : 0;
  const ts = 1 - 0.45 * pull;
  const towerX = 1150;
  const magO = vis(g, C(64), B + 10);
  const searchA = Math.sin((g - C(65)) / 14) * 30;

  const rows: Act[] = [
    [A, "present", "neutral"],
    [W(52, 7), "pointSide", "curious"],
    [C(53), "thinkChin", "thinking"],
    [W(54, 3), "count1", "happy"],
    [C(55), "presentBoth", "neutral"],
    [NUM, "whisper", "worried"],
    [W(57, 1), "mindBlown", "shock", "shake"],
    [C(58), "pointSide", "worried"],
    [W(59, 2), "count2", "skeptical"],
    [TOWER, "presentBoth", "curious"],
    [C(61), "pointUp", "neutral"],
    [C(62), "shrugBig", "smug"],
    [C(63), "recoil", "shock", "hop"],
    [C(64), "facepalm", "sad"],
    [C(65), "handsHips", "determined", "nod"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="city" />}
      hits={[W(57, 1) - from, W(59, 2) - from, W(63, 1) + 40 - from]}
      power={8}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* staging 1: the report + 1 in 5 */}
            <g opacity={p1}>
              <Doc x={820} y={440} title={["CFPB REPORT", "BUY NOW,", "PAY LATER"]} year="Jan 2025 · 2022 lender data" s={0.6 * pop(g, A + 2)} r={-4} w={600} />
              <Pill2 x={820} y={760} text="US CONSUMER WATCHDOG" o={soft(g, W(52, 7), W(52, 7) + 8)} />
              <g opacity={vis(g, C(54), NUM)}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i} transform={`translate(${1180 + i * 130} ${interpolate(g, [C(54) + i * 3, C(54) + i * 3 + 8], [1100, 640], clamp)})`}>
                    <Person x={0} y={0} s={0.9} color={i === 2 && g >= W(54, 3) ? YOU_COL : "#6b7280"} />
                  </g>
                ))}
                <T x={1440} y={420} fs={110} fill={AMBER} s={pop(g, W(54, 3))} o={g >= W(54, 3) ? 1 : 0}>
                  1 in 5
                </T>
                <T x={1440} y={500} fs={40} fill={PAPER} o={soft(g, C(55), C(55) + 10)}>
                  used buy now, pay later
                </T>
              </g>
            </g>

            {/* staging 2: 63% + grid + 1 in 3 lenders */}
            <g opacity={p2}>
              <T x={860} y={540} fs={260} fill={CORAL} stroke o={g >= W(57, 0) - 20 ? 1 : 0} s={g >= W(57, 1) ? pop(g, W(57, 1)) : 1}>
                {pct}%
              </T>
              <T x={860} y={640} fs={40} fill={PAPER} o={soft(g, C(58), C(58) + 10)}>
                had 2+ loans open at once
              </T>
              <g transform="translate(1260 280)">
                {Array.from({ length: 100 }, (_, i) => (
                  <rect key={i} x={(i % 10) * 44} y={Math.floor(i / 10) * 44} width={36} height={36} rx={6} fill={i < cells ? CORAL : "#333849"} stroke={INK} strokeWidth={2} />
                ))}
              </g>
              <g opacity={vis(g, W(59, 2), TOWER)} transform={`translate(860 780) scale(${pop(g, W(59, 2))})`}>
                <rect x={-330} y={-56} width={660} height={112} rx={28} fill={AMBER} {...K} strokeWidth={6} />
                <text x={0} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={INK}>
                  1 in 3: 2+ LENDERS
                </text>
              </g>
            </g>

            {/* staging 3: the tower */}
            <g opacity={p3}>
              <g transform={`translate(${towerX} ${GROUND}) scale(${ts}) rotate(${wob})`}>
                {BLOCKS.map((b, i) => {
                  const at = b.at();
                  if (g < at) return null;
                  const yy = interpolate(g, [at, at + 8], [-1400, -60 - i * 110], clamp);
                  return <PlanBlock key={i} x={((i * 37) % 5) * 6 - 12} y={yy} label={b.label} fill={b.fill} s={1} r={((i * 13) % 7) - 3} paid={1} />;
                })}
                {g >= W(62, 2) &&
                  BLOCKS.slice(0, 3).map((b, i) => (
                    <g key={`t${i}`} transform={`translate(240 ${-60 - i * 110}) scale(${pop(g, W(62, 2) + i * 4)})`}>
                      <rect x={-6} y={-30} width={150} height={60} rx={12} fill={PAPER} {...K} strokeWidth={4} />
                      <text x={69} y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={INK}>
                        ₹1,000
                      </text>
                    </g>
                  ))}
              </g>
              {/* YOU with a magnifier sees one block */}
              <g opacity={magO}>
                <You f={g} x={620} beats={[[C(64), "pointSide"]]} facing={1} />
                <g transform={`translate(${towerX - 40} ${GROUND - 60 * ts - 20})`}>
                  <circle r={90} fill="#ffffff" opacity={0.18} stroke={PAPER} strokeWidth={10} />
                </g>
              </g>
              {/* searchlight */}
              <g opacity={vis(g, C(65), B + 20)}>
                <path d={`M ${towerX} -40 L ${towerX - 160 + searchA * 6} ${GROUND} L ${towerX + 160 + searchA * 6} ${GROUND} Z`} fill={AMBER} opacity={0.18} />
                <circle cx={towerX + searchA * 6} cy={GROUND - 20} r={150} fill={AMBER} opacity={0.12} />
              </g>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(57, 1)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={NUM + 4} out={W(57, 0)} x={960} y={140} size={110} color={PAPER}>
            THE NUMBER…
          </Big>
          <Big f={g} at={W(63, 0)} out={CE(63) + 10} x={960} y={130} size={150} color={CORAL} r={-3}>
            THEY STACK.
          </Big>
          <Big f={g} at={W(64, 7)} out={CE(64)} x={960} y={130} size={100} color={AMBER}>
            NO SLICE SHOWS THE TOWER
          </Big>
          <Big f={g} at={W(65, 5)} out={B + 12} x={960} y={130} size={110} color={MINT}>
            WHO'S WATCHING?
          </Big>
          <Src f={g} at={A + 10} out={CE(55)}>
            CFPB (13 Jan 2025), 2022 data: 21.2% of consumers with a credit record took a BNPL loan
          </Src>
          <Src f={g} at={C(57)} out={CE(59)}>
            CFPB (Jan 2025): ~63% of BNPL borrowers had overlapping loans; 33% used 2+ lenders
          </Src>
          <Letterbox k={vis(g, NUM, W(57, 1) + 10, 8)} />
          <Cuts f={g} times={CUTS} seed={4} dur={18} />
          <Transition f={g} at={NUM} kind="iris" colors={TCOLS} irisAt={[960, 520]} dur={18} />
          <Transition f={g} at={TOWER} kind="whip" colors={TCOLS} dur={16} />
          <Transition f={g} at={C(63)} kind="flash" colors={[CORAL, MINT, AMBER]} dur={14} />
        </>
      }
    />
  );
};
