import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bars, Bg, Big, Brick, C, CE, CORAL, Cuts, Doc, GOLD, INK, K, MINT, PURPLE, Pill, SPARK, SparkHost, Src, T, W, XStamp, clamp, contentShift, cutTimes, pop, sceneCam, soft, vis,
  CONTENT, type Frame,
} from "./world";

// CH4 · Attention (2:52–3:47). Blueprint world. The 2017 paper slams in → every word shines beams at the others →
// trophy/suitcase: what was too big? → WOW: a thick beam links "it" to "trophy" → the old one-word-at-a-time chain is
// stamped out → 3.5 days on 8 GPUs (a translation model, not ChatGPT: the blueprint) → G·P·T: the T is Transformer.

const A = C(54);
const B = CE(71);
const CUTS = cutTimes(A, B);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.1, at: [960, 420] }, { z: 1.5, at: SPARK }];
const ROW = ["The", "trophy", "didn't", "fit", "in", "the", "suitcase,", "because", "it", "was", "too", "big"];
// attention weights from "it" (illustrative)
const WT = [0.03, 0.62, 0.02, 0.05, 0.01, 0.02, 0.14, 0.03, 0, 0.03, 0.02, 0.03];

export const S05_SFX: SfxCue[] = [
  [C(54), "whoosh", 0.4],
  [W(54, 7), "slam", 0.55],
  [C(55), "scribble", 0.4],
  [C(56), "swirl", 0.4],
  [C(57), "ding", 0.35],
  [C(58), "page", 0.4],
  [C(59), "thud", 0.45],
  [W(59, 5), "boing", 0.4],
  [W(60, 1), "pop", 0.4],
  [C(61), "tick", 0.35],
  [C(62), "ding", 0.5],
  [W(63, 6), "riser", 0.35],
  [W(63, 8), "impact", 0.6],
  [C(64), "chains", 0.35],
  [W(64, 2), "stamp", 0.55],
  [W(65, 6), "page", 0.4],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [C(66) + i * 4, "pop", 0.28]),
  [W(67, 3), "stamp", 0.5],
  [C(68), "buzz", 0.3],
  [W(68, 5), "page", 0.4],
  [W(69, 4), "impact", 0.5],
  [W(69, 6), "kaching", 0.4],
  [C(70), "pop", 0.35],
  [C(71), "riser", 0.35],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Trophy: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 && <circle cx={0} cy={-60} r={170} fill={GOLD} opacity={0.35 * glow} />}
      <path d="M -90 -160 L 90 -160 L 70 -40 C 50 10 -50 10 -70 -40 Z" fill={GOLD} {...K} />
      <path d="M -90 -140 C -150 -140 -150 -60 -75 -55 M 90 -140 C 150 -140 150 -60 75 -55" fill="none" {...K} />
      <rect x={-20} y={0} width={40} height={60} fill={GOLD} {...K} />
      <rect x={-75} y={60} width={150} height={40} rx={8} fill={PURPLE} {...K} />
    </g>
  );
const Suitcase: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-130} y={-60} width={260} height={160} rx={20} fill={CORAL} {...K} />
      <path d="M -40 -60 L -40 -95 L 40 -95 L 40 -60" fill="none" {...K} strokeWidth={8} />
      <line x1={-130} y1={10} x2={130} y2={10} stroke={INK} strokeWidth={4} />
    </g>
  );

export const S05Attention: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 320, s: 1.45 },
    { f: C(61), x: 340, s: 2.8, e: "snap" },
    { f: C(63), x: 300, s: 1.45 },
    { f: C(65), x: 1600, s: 1.45 },
    { f: C(68), x: 1580, s: 2.6, e: "snap" },
    { f: C(69), x: 1620, s: 1.45 },
    { f: C(71), x: 300, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const beam = W(63, 8);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: beam - 4, z: 1.4, at: [1000, 640], e: "snap" },
    { f: beam + 40, z: 1, e: "smooth" },
  ], places);
  const z = punch(g, [W(54, 7), beam, W(64, 2), W(69, 4)], 0.045);

  const docO = vis(g, A, CE(55) + 4, 8);
  // beams from the focus word to all others (idea), then the trophy sentence
  const ideaO = vis(g, C(56), CE(57) + 4, 8);
  const IDEA = ["The", "cat", "sat", "on", "the", "mat"];
  const sentO = vis(g, C(58), CE(63) + 6, 8);
  const objO = vis(g, C(59), CE(62) + 4, 8);
  const linkK = soft(g, W(63, 0), beam);
  // row layout for the trophy sentence (two lines)
  const pos = ROW.map((w, i) => {
    const line = i < 7 ? 0 : 1;
    const idx = line ? i - 7 : i;
    const xs = line ? [760, 960, 1110, 1260, 1420] : [600, 790, 990, 1150, 1270, 1390, 1600];
    return [xs[idx], line ? 700 : 560] as [number, number];
  });
  const chainO = vis(g, C(64), CE(64) + 6, 6);
  const gpuO = vis(g, C(65), CE(66) + 6, 8);
  const transO = vis(g, C(67), CE(68) + 6, 8);
  const gptO = vis(g, C(69), CE(69) + 6, 8);
  const tExp = soft(g, W(69, 4), W(69, 4) + 14);

  const acts: Act[] = [
    [A, "pointUp", "curious"],
    [W(54, 7), "clap1", "laugh"],
    [C(56), "presentBoth", "excited"],
    [C(57), "thinkChin", "thinking"],
    [C(58), "pointSide", "happy"],
    [C(59), "pointDown", "curious"],
    [C(60), "shrugBig", "worried"],
    [C(61), "leanIn", "curious"],
    [C(62), "count1", "happy", "nod"],
    [W(63, 6), "doublePoint", "mindblown"],
    [C(64), "stop", "determined", "shake"],
    [C(65), "fistPump", "excited"],
    [C(66), "count2", "excited", "hop"],
    [C(67), "handsHips", "skeptical"],
    [C(68), "whisper", "wink"],
    [C(69), "pointUp", "smug"],
    [W(69, 4), "presentBoth", "excited", "nod"],
    [C(70), "pointSide", "neutral"],
    [C(71), "thinkChin", "curious"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="blue" />}
      hits={[W(54, 7) - from, beam - from, W(64, 2) - from]}
      power={8}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            <Doc x={1150} y={460} w={700} title={["Attention Is", "All You Need"]} year="Vaswani et al. · 2017" quote={["“based solely on", "attention mechanisms”"]} hl={soft(g, C(55), C(55) + 30)} s={0.95 * pop(g, W(54, 7) - 4)} o={docO} r={2} />

            {/* the idea: every word looks at every other word */}
            <g opacity={ideaO}>
              {IDEA.map((w, i) => {
                const x = 620 + i * 210;
                return (
                  <g key={w + i}>
                    {i !== 5 &&
                      (() => {
                        const x2 = 620 + 5 * 210;
                        const k = soft(g, C(56) + i * 4, C(56) + i * 4 + 12);
                        const th = g >= C(57) ? [3, 18, 10, 3, 2][i] : 5;
                        return <path d={`M ${x2} 470 Q ${(x + x2) / 2} ${280 - (5 - i) * 20} ${x} 470`} fill="none" stroke={GOLD} strokeWidth={th} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - k)} opacity={0.9} />;
                      })()}
                    <Brick x={x} y={520} text={w} color={i === 5 ? GOLD : PURPLE} fs={44} />
                  </g>
                );
              })}
              <Pill x={1150} y={720} text="WHICH WORDS MATTER TO “mat”?" fill={MINT} color={INK} fs={36} s={pop(g, C(57))} />
            </g>

            {/* trophy & suitcase */}
            <g opacity={objO}>
              <Suitcase x={1360} y={340} s={pop(g, C(59)) * 0.9} />
              <Trophy x={interpolate(g, [W(59, 5), W(59, 5) + 6, W(59, 5) + 12], [940, 1180, 1000], clamp)} y={330} s={pop(g, C(59)) * 0.9} glow={vis(g, C(62), CE(62) + 4)} />
            </g>
            <g opacity={sentO}>
              {linkK > 0 &&
                ROW.map((w, i) => {
                  if (i === 8) return null;
                  const [x1, y1] = pos[8];
                  const [x2, y2] = pos[i];
                  const th = 2 + WT[i] * 46;
                  return (
                    <path key={`b${i}`} d={`M ${x1} ${y1 - 30} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 170} ${x2} ${y2 - 30}`} fill="none" stroke={i === 1 ? GOLD : "#ffffff"} strokeOpacity={i === 1 ? 1 : 0.5} strokeWidth={th * linkK} strokeLinecap="round" />
                  );
                })}
              {ROW.map((w, i) => {
                const [x, y] = pos[i];
                const at = C(58) + 6 + i * 3 + (i >= 7 ? C(60) - C(58) - 10 : 0);
                const hiIt = i === 8 && g >= W(60, 1);
                return <Brick key={w + i} x={x} y={y} text={w} fs={40} color={hiIt ? GOLD : i === 1 && g >= C(62) ? GOLD : i % 2 ? MINT : PURPLE} s={pop(g, at)} glow={i === 1 ? linkK : hiIt ? 0.7 : 0} />;
              })}
              <T x={pos[8][0]} y={pos[8][1] + 100} fs={70} fill={GOLD} o={vis(g, C(61), C(62))}>
                ?
              </T>
            </g>

            {/* the old chain: one word at a time */}
            <g opacity={chainO}>
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i}>
                  <rect x={560 + i * 190} y={400} width={140} height={120} rx={16} fill={i === Math.floor((g - C(64)) / 6) % 6 ? GOLD : "#ffffff"} {...K} />
                  {i < 5 && <line x1={700 + i * 190} y1={460} x2={750 + i * 190} y2={460} stroke="#ffffff" strokeWidth={8} />}
                </g>
              ))}
              <T x={1110} y={340} fs={52} fill="#ffffff">
                OLD WAY: ONE WORD AT A TIME
              </T>
              <XStamp x={1110} y={460} f={g} at={W(64, 2)} s={1.1} />
            </g>

            {/* 3.5 days, 8 GPUs */}
            <g opacity={gpuO}>
              <g transform={`translate(800 400) scale(${pop(g, W(65, 6))})`}>
                <rect x={-170} y={-150} width={340} height={300} rx={24} fill="#ffffff" {...K} />
                <rect x={-170} y={-150} width={340} height={80} rx={24} fill={CORAL} {...K} />
                <T x={0} y={60} fs={150}>
                  3.5
                </T>
                <T x={0} y={130} fs={50} fill={PURPLE}>
                  DAYS
                </T>
              </g>
              {Array.from({ length: 8 }, (_, i) => (
                <g key={i} transform={`translate(${1220 + (i % 4) * 130} ${320 + Math.floor(i / 4) * 150}) scale(${pop(g, C(66) + i * 4)})`}>
                  <rect x={-50} y={-50} width={100} height={100} rx={10} fill={MINT} {...K} />
                  <rect x={-24} y={-24} width={48} height={48} rx={6} fill={INK} />
                  {[-30, -10, 10, 30].map((d) => (
                    <line key={d} x1={d} y1={-50} x2={d} y2={-64} stroke={INK} strokeWidth={5} />
                  ))}
                </g>
              ))}
              <T x={1415} y={600} fs={58} fill="#ffffff" o={soft(g, C(66) + 30, C(66) + 40)}>
                8 GPUs
              </T>
            </g>

            {/* a translation model, not ChatGPT: the blueprint */}
            <g opacity={transO}>
              <g transform={`translate(1150 400) scale(${pop(g, C(67))})`}>
                <rect x={-360} y={-160} width={720} height={320} rx={26} fill="#ffffff" {...K} />
                <T x={0} y={-60} fs={66}>
                  TRANSLATION MODEL
                </T>
                <T x={0} y={40} fs={90} fill={PURPLE}>
                  EN → DE · EN → FR
                </T>
              </g>
              <g transform={`translate(1150 690) rotate(-4) scale(${pop(g, W(68, 0))})`}>
                <rect x={-260} y={-50} width={520} height={100} rx={12} fill="none" stroke={CORAL} strokeWidth={10} />
                <T x={0} y={22} fs={64} fill={CORAL}>
                  NOT CHATGPT
                </T>
              </g>
              <Pill x={1150} y={180} text="THE BLUEPRINT" fill={MINT} color={INK} fs={44} s={pop(g, W(68, 5))} />
            </g>

            {/* G P T */}
            <g opacity={gptO}>
              {["G", "P", "T"].map((l, i) => (
                <g key={l} transform={`translate(${850 + i * 300} 380) scale(${pop(g, C(69) + i * 4) * (i === 2 ? 1 + 0.25 * tExp : 1 - 0.25 * tExp)})`}>
                  <rect x={-110} y={-120} width={220} height={240} rx={26} fill={i === 2 ? GOLD : PURPLE} {...K} />
                  <T x={0} y={60} fs={190} fill={i === 2 ? INK : "#ffffff"}>
                    {l}
                  </T>
                </g>
              ))}
              {["Generative", "Pre-trained", "Transformer"].map((w, i) => (
                <T key={w} x={850 + i * 300} y={600} fs={i === 2 ? 60 : 46} fill={i === 2 ? GOLD : "#ffffff"} o={tExp}>
                  {w}
                </T>
              ))}
            </g>

            {/* back to the scores */}
            <Bars x={1150} y={680} opts={[{ t: "mat", p: 0.55 }, { t: "floor", p: 0.22 }, { t: "sofa", p: 0.15 }, { t: "moon", p: 0.03 }]} grow={soft(g, C(70), C(70) + 20)} o={vis(g, C(70), B + 20)} dark showPct={false} />
            <T x={1150} y={250} fs={76} fill={GOLD} o={vis(g, C(71), B + 20)} stroke>
              …SO HOW DOES IT PICK?
            </T>
          </g>
          <SparkHost f={g} rows={acts} places={places} bulbs={[beam, W(69, 6)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={beam} out={CE(63) + 6} x={960} y={180} size={110} color={GOLD} r={-2}>
            “IT” → TROPHY
          </Big>
          <Src f={g} at={A} out={CE(55)}>
            Vaswani et al. (2017), arXiv:1706.03762
          </Src>
          <Src f={g} at={C(64)} out={CE(68)}>
            Vaswani et al. (2017): “dispensing with recurrence”; 41.8 BLEU after 3.5 days on eight GPUs
          </Src>
          <Cuts f={g} times={CUTS} seed={4} />
        </>
      }
    />
  );
};
