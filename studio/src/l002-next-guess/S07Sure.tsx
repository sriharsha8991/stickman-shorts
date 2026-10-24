import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bg, Big, Bubble, C, CE, CORAL, Cuts, Doc, GOLD, INK, K, MINT, MINT_D, Note, PURPLE, SPARK, SparkHost, Src, T, W, contentShift, cutTimes, pop, sceneCam, soft, vis,
  CONTENT, type Frame,
} from "./world";

// CH6 · Sure, and wrong (4:27–4:52). A laptop answers "Definitely!" with a confidence meter at 100% → two meters:
// SOUNDS LIKELY full, CHECKED empty → confident ≈ likely → OpenAI 2025 paper: training and tests reward guessing over
// admitting uncertainty (scoreboard: a guess can score, "I'm not sure" scores 0) → teaser for the next video.

const A = C(84);
const B = CE(90);
const CUTS = cutTimes(A, B);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.45, at: SPARK }];

export const S07_SFX: SfxCue[] = [
  [C(84), "pop", 0.4],
  [W(84, 5), "ding", 0.4],
  [W(84, 7), "buzz", 0.4],
  [C(85), "riser", 0.3],
  [W(85, 5), "kaching", 0.4],
  [W(85, 8), "buzz", 0.4],
  [C(86), "stamp", 0.45],
  [C(87), "page", 0.45],
  [C(88), "scribble", 0.4],
  [W(88, 5), "kaching", 0.35],
  [W(89, 2), "thud", 0.45],
  [C(90), "stinger", 0.45],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Meter: React.FC<{ x: number; y: number; label: string; v: number; col: string; s: number }> = ({ x, y, label, v, col, s }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-60} y={-200} width={120} height={400} rx={60} fill="#ffffff" {...K} />
      <rect x={-46} y={186 - 372 * v} width={92} height={372 * v} rx={46} fill={col} />
      <T x={0} y={270} fs={46}>
        {label}
      </T>
    </g>
  );

export const S07Sure: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 1620, s: 1.45 },
    { f: C(86), x: 300, s: 1.45 },
    { f: C(89), x: 330, s: 2.8, e: "snap" },
    { f: C(90), x: 300, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: W(84, 7), z: 1.25, at: [760, 360], e: "snap" },
    { f: C(85), z: 1, e: "smooth" },
  ], places);
  const z = punch(g, [W(84, 7), W(85, 8), C(86), W(89, 2)], 0.045);

  const lapO = vis(g, A, CE(84) + 4, 8);
  const meterO = vis(g, C(85), CE(86) + 4, 8);
  const docO = vis(g, C(87), CE(89) + 4, 8);
  const teaseO = vis(g, C(90), B + 20, 8);

  const rows: Act[] = [
    [A, "handsHips", "skeptical"],
    [W(84, 7), "facepalm", "worried"],
    [C(85), "pointUp", "determined"],
    [W(85, 8), "shrugBig", "sad"],
    [C(86), "present", "thinking"],
    [C(87), "pointSide", "curious"],
    [C(88), "count1", "skeptical"],
    [C(89), "whisper", "worried"],
    [C(90), "wave1", "excited", "hop"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="lilac" />}
      hits={[W(84, 7) - from, W(89, 2) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* a laptop that sounds very sure */}
            <g opacity={lapO}>
              <g transform={`translate(760 600) scale(${pop(g, A)})`}>
                <rect x={-240} y={-260} width={480} height={300} rx={20} fill={INK} />
                <rect x={-215} y={-235} width={430} height={250} rx={10} fill="#e9f2ff" />
                <path d="M -290 40 L 290 40 L 330 90 L -330 90 Z" fill="#9aa3ad" {...K} />
                <T x={0} y={-150} fs={44} font={FONT.body} weight={800}>
                  The answer is
                </T>
                <T x={0} y={-80} fs={50} font={FONT.body} weight={800} fill={PURPLE}>
                  definitely ███
                </T>
              </g>
              <Bubble x={830} y={180} w={540} h={140} s={pop(g, W(84, 2))} tail={-1}>
                <T x={0} y={22} fs={70} fill={PURPLE}>
                  “Definitely!”
                </T>
              </Bubble>
              <g transform={`translate(1350 430) scale(${pop(g, W(84, 5))})`}>
                <rect x={-170} y={-60} width={340} height={120} rx={20} fill="#ffffff" {...K} />
                <rect x={-150} y={-30} width={300 * soft(g, W(84, 5), W(84, 5) + 14)} height={60} rx={14} fill={MINT} />
                <T x={0} y={18} fs={44}>
                  CONFIDENCE 100%
                </T>
              </g>
              <g transform={`translate(1350 600) scale(${pop(g, W(84, 7))})`} opacity={g >= W(84, 7) ? 1 : 0}>
                <rect x={-150} y={-55} width={300} height={110} rx={18} fill={CORAL} {...K} />
                <T x={0} y={20} fs={58} fill="#ffffff">
                  WRONG
                </T>
              </g>
            </g>

            {/* likely vs checked */}
            <g opacity={meterO}>
              <Meter x={950} y={430} label="SOUNDS LIKELY" v={soft(g, W(85, 3), W(85, 5) + 10)} col={MINT} s={pop(g, C(85))} />
              <Meter x={1350} y={430} label="CHECKED" v={0.04} col={CORAL} s={pop(g, W(85, 8))} />
              <T x={1350} y={430} fs={150} fill={CORAL} o={g >= W(85, 8) ? 1 : 0}>
                ✗
              </T>
              <g opacity={soft(g, C(86), C(86) + 8)}>
                <rect x={760} y={120} width={780} height={110} rx={20} fill={GOLD} {...K} />
                <T x={1150} y={195} fs={58}>
                  CONFIDENT ≈ LIKELY ≠ TRUE
                </T>
              </g>
            </g>

            {/* the 2025 paper + a scoreboard */}
            <g opacity={docO}>
              <Doc x={900} y={460} w={600} title={["Why Language Models", "Hallucinate"]} year="Kalai et al. (OpenAI) · 2025" quote={["“reward guessing over", "acknowledging uncertainty”"]} hl={soft(g, C(88), C(88) + 30)} s={0.9 * pop(g, C(87))} r={-2} />
              <g transform={`translate(1450 430) scale(${pop(g, W(88, 5))})`}>
                <rect x={-200} y={-170} width={400} height={340} rx={24} fill="#ffffff" {...K} />
                <T x={0} y={-110} fs={44} fill={PURPLE}>
                  TEST SCORE
                </T>
                <T x={-170} y={-20} fs={44} anchor="start">
                  GUESS
                </T>
                <T x={170} y={-20} fs={50} anchor="end" fill={MINT_D}>
                  maybe +1
                </T>
                <T x={-170} y={80} fs={40} anchor="start" o={soft(g, W(89, 2), W(89, 2) + 6)}>
                  “NOT SURE”
                </T>
                <T x={170} y={80} fs={56} anchor="end" fill={CORAL} o={soft(g, W(89, 2), W(89, 2) + 6)}>
                  0
                </T>
              </g>
            </g>

            {/* tease */}
            <g opacity={teaseO} transform={`translate(1150 430) scale(${pop(g, C(90))})`}>
              <rect x={-420} y={-170} width={840} height={340} rx={30} fill={PURPLE} {...K} />
              <T x={0} y={-80} fs={44} fill={GOLD}>
                COMING UP ON THE CHANNEL
              </T>
              <T x={0} y={20} fs={84} fill="#ffffff">
                WHY AI MAKES
              </T>
              <T x={0} y={110} fs={84} fill="#ffffff">
                THINGS UP
              </T>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[C(86), W(88, 5)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={C(84)} out={W(84, 7) - 2} x={960} y={90 + 30} size={90} color={GOLD}>
            SO SURE…
          </Big>
          <Src f={g} at={C(87)} out={CE(89)}>
            Kalai et al. (2025), “Why Language Models Hallucinate”, arXiv:2509.04664
          </Src>
          <Note f={g} at={C(84)} out={CE(84)} top={64} left={1400}>
            Illustration
          </Note>
          <Cuts f={g} times={CUTS} seed={1} />
        </>
      }
    />
  );
};
