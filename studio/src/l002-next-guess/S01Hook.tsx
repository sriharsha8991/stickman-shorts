import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bg, Big, Bubble, C, CE, CORAL, Cuts, Doc, GOLD, INK, K, MINT, PURPLE, Pill, SPARK, SparkHost, T, W, XStamp, clamp, contentShift, cutTimes, pop, sceneCam, soft, vis,
  CONTENT, type Frame,
} from "./world";

// HOOK (0:00–0:25). Frame 0: a giant speech bubble "The cat sat on the [slot reel]" with MAT/HAT/MOON spinning in the
// blank + "IT'S ALL GUESSES". Two myths get stamped (DATABASE, FULL PLAN), "NEITHER", the promise: one sentence.

const CUTS = cutTimes(0, CE(7), 135);
const REEL = ["MAT", "HAT", "MOON", "SOFA", "MAT", "ROOF", "MAT"];

export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.35],
  [W(0, 7), "impact", 0.55],
  [W(1, 5), "boing", 0.3],
  [W(2, 5), "buzz", 0.35],
  [C(3), "whoosh", 0.4],
  [W(3, 5), "stamp", 0.6],
  [C(4), "page", 0.45],
  [W(4, 6), "stamp", 0.6],
  [W(5, 2), "slam", 0.5],
  [C(6), "scribble", 0.4],
  [W(6, 7), "ding", 0.45],
  [W(7, 3), "kaching", 0.35],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.45, at: SPARK }, { z: 1.1, at: [960, 520] }];

export const S01Hook: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: 0, x: 330, s: 1.5 },
    { f: C(5) + 6, x: 1580, s: 1.5 },
    { f: C(7), x: 1560, s: 2.7 },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [{ f: W(0, 7), z: 1.12, at: [1150, 420], e: "snap" }], places);
  const z = punch(g, [W(0, 7), W(3, 5), W(4, 6), W(5, 2)], 0.04);

  // slot reel in the blank: spins fast, slows, lands on MAT at "guess"; spins again on "how it picks"
  const spin = g < W(0, 7) ? g * 0.55 : g < W(1, 4) ? REEL.length - 1 : W(1, 4) <= g && g < C(3) ? (REEL.length - 1) + (g - W(1, 4)) * 0.35 : REEL.length - 1;
  const ri = Math.floor(spin) % REEL.length;
  const rf = spin % 1;
  const landed = g >= W(0, 7) && g < W(1, 4);
  const bubbleO = vis(g, -20, C(3) - 4, 8);

  const rows: Act[] = [
    [0, "leanIn", "curious"],
    [W(0, 7), "pointSide", "excited", "nod"],
    [C(1), "thinkChin", "thinking"],
    [C(2), "armsCrossed", "skeptical"],
    [C(3), "pointSide", "curious"],
    [W(3, 5), "shrugBig", "smug", "shake"],
    [C(4), "thinkChin", "skeptical"],
    [W(4, 6), "stop", "determined"],
    [C(5), "celebrate", "excited", "hop"],
    [C(6), "count1", "happy"],
    [C(7), "pointUp", "wink", "nod"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="paper" />}
      hits={[W(0, 7) - from, W(3, 5) - from, W(4, 6) - from, W(5, 2) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* the hook bubble */}
            <Bubble x={1150} y={420} w={1180} h={250} o={bubbleO} tail={-1}>
              <text x={-520} y={30} fontFamily={FONT.title} fontWeight={900} fontSize={96} fill={INK}>
                The cat sat on the
              </text>
              <g transform="translate(330 -10)">
                <rect x={-10} y={-80} width={250} height={150} rx={18} fill={landed ? GOLD : "#efe6ff"} {...K} />
                <clipPath id="l2reel">
                  <rect x={-10} y={-80} width={250} height={150} rx={18} />
                </clipPath>
                <g clipPath="url(#l2reel)">
                  {[-1, 0, 1].map((o) => (
                    <text key={o} x={115} y={36 + (o + rf) * 120} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={92} fill={o === 0 && landed ? INK : PURPLE}>
                      {REEL[(ri - o + REEL.length * 3) % REEL.length]}
                    </text>
                  ))}
                </g>
              </g>
            </Bubble>
            <Pill x={1150} y={690} text="HOW DOES IT PICK?" fill={PURPLE} s={pop(g, W(1, 4))} o={vis(g, W(1, 4), C(3) - 4)} fs={46} />
            <Pill x={1150} y={790} text="CHECKED?  ✗" fill={CORAL} s={pop(g, W(2, 5))} o={vis(g, W(2, 5), C(3) - 4)} fs={42} />

            {/* myth 1: the database */}
            <g opacity={vis(g, C(3), C(5) + 8)} transform={`translate(${880 - soft(g, C(5), C(5) + 14) * 900} ${490}) scale(${pop(g, C(3))})`}>
              <ellipse cx={0} cy={-170} rx={190} ry={50} fill={MINT} {...K} />
              <path d="M -190 -170 L -190 170 A 190 50 0 0 0 190 170 L 190 -170" fill={MINT} {...K} />
              <ellipse cx={0} cy={-170} rx={190} ry={50} fill="#9ff3d6" {...K} />
              {[-60, 50].map((y) => (
                <path key={y} d={`M -190 ${y} A 190 50 0 0 0 190 ${y}`} fill="none" {...K} />
              ))}
              <text x={0} y={-5} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={INK}>
                DATABASE
              </text>
              <g transform={`translate(150 120) rotate(${interpolate(g, [C(3), C(3) + 40], [-20, 10], clamp)})`}>
                <circle cx={0} cy={0} r={62} fill="#ffffffaa" stroke={INK} strokeWidth={10} />
                <line x1={44} y1={44} x2={120} y2={120} stroke={INK} strokeWidth={20} strokeLinecap="round" />
              </g>
              <XStamp x={0} y={0} f={g} at={W(3, 5)} label="MYTH" s={0.9} />
            </g>

            {/* myth 2: the whole answer planned first */}
            <g opacity={vis(g, C(4), C(5) + 8)} transform={`translate(${1420 + soft(g, C(5), C(5) + 14) * 900} 470)`}>
              <Doc x={0} y={0} title={["FULL ANSWER", "PLANNED"]} year="draft → reveal?" s={0.62 * pop(g, C(4))} r={4} />
              <XStamp x={0} y={0} f={g} at={W(4, 6)} label="MYTH" s={0.9} />
            </g>

            {/* the promise: one sentence */}
            <g opacity={vis(g, C(6), CE(7) + 10)}>
              <rect x={640 + 0} y={390} width={1020 * soft(g, C(6), C(6) + 16)} height={130} rx={20} fill="#ffffff" {...K} />
              <T x={1150} y={478} fs={70} o={soft(g, W(6, 5), W(6, 5) + 10)} fill={PURPLE}>
                one sentence
              </T>
              <rect x={1150 + 250} y={410} width={18} height={90} fill={PURPLE} opacity={Math.floor(g / 8) % 2} />
              <Pill x={1150} y={640} text="★ USE IT BETTER" fill={MINT} color={INK} s={pop(g, W(7, 3))} o={vis(g, W(7, 3), CE(7) + 10)} fs={50} />
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(6, 7)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={-14} out={C(1) + 20} x={960} y={150} size={120} color={GOLD}>
            IT'S ALL GUESSES
          </Big>
          <Big f={g} at={W(5, 2)} out={C(6) - 4} x={960} y={190} size={150} color={CORAL} r={-3}>
            NEITHER.
          </Big>
          <Cuts f={g} times={CUTS} dur={22} />
        </>
      }
    />
  );
};
