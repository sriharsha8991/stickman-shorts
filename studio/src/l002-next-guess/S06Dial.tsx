import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bars, Bg, Big, C, CE, CORAL, Cuts, GOLD, INK, K, MINT, MINT_D, Note, PURPLE, PURPLE_D, SPARK, SparkHost, Src, T, W, clamp, contentShift, cutTimes, pop, sceneCam, soft,
  vis, type Opt,
  CONTENT, type Frame,
} from "./world";

// CH5 · The temperature dial (3:47–4:27). A big dial: low = it takes the tallest bar; high = the short bars get a chance
// (bars flatten) → OpenAI's API: 0 to 2 → split screen, same prompt: "mat" vs "moon, in tiny jazz shoes" → low for
// facts & code, higher for brainstorming → same engine, different personality → open loop.

const A = C(72);
const B = CE(83);
const CUTS = cutTimes(A, B);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.45, at: SPARK }, { z: 1.1, at: [960, 460] }];
const OPTS: Opt[] = [
  { t: "mat", p: 0.55 },
  { t: "floor", p: 0.22 },
  { t: "sofa", p: 0.15 },
  { t: "moon", p: 0.08 },
];

export const S06_SFX: SfxCue[] = [
  [C(72), "whoosh", 0.4],
  [W(72, 2), "slam", 0.5],
  ...Array.from({ length: 5 }, (_, i): SfxCue => [C(73) + 4 + i * 3, "tick", 0.3]),
  [W(74, 5), "kaching", 0.4],
  ...Array.from({ length: 7 }, (_, i): SfxCue => [C(75) + 4 + i * 3, "tick", 0.3]),
  [W(75, 7), "boing", 0.4],
  [C(76), "page", 0.4],
  [W(76, 8), "ding", 0.45],
  [C(77), "swish", 0.4],
  [C(78), "pop", 0.35],
  [C(79), "swish", 0.4],
  [W(80, 5), "boing", 0.45],
  [W(80, 8), "horn", 0.3],
  [C(81), "pop", 0.4],
  [W(81, 5), "pop", 0.4],
  [C(82), "swirl", 0.4],
  [C(83), "freeze", 0.35],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Dial: React.FC<{ x: number; y: number; s: number; v: number; o?: number }> = ({ x, y, s, v, o = 1 }) => {
  if (s <= 0.01 || o <= 0.01) return null;
  const ang = interpolate(v, [0, 1], [-120, 120]);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <circle r={230} fill="#ffffff" {...K} strokeWidth={8} />
      <path d="M -199 115 A 230 230 0 0 1 0 -230" fill="none" stroke={MINT} strokeWidth={26} />
      <path d="M 0 -230 A 230 230 0 0 1 199 115" fill="none" stroke={CORAL} strokeWidth={26} />
      {Array.from({ length: 13 }, (_, i) => {
        const a = ((-120 + i * 20) * Math.PI) / 180;
        return <line key={i} x1={Math.sin(a) * 180} y1={-Math.cos(a) * 180} x2={Math.sin(a) * 205} y2={-Math.cos(a) * 205} stroke={INK} strokeWidth={i % 6 === 0 ? 8 : 4} />;
      })}
      <g transform={`rotate(${ang})`}>
        <path d="M -16 0 L 0 -170 L 16 0 Z" fill={PURPLE} stroke={INK} strokeWidth={5} />
      </g>
      <circle r={36} fill={GOLD} {...K} />
      <text x={-150} y={170} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={MINT_D}>
        LOW
      </text>
      <text x={150} y={170} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={CORAL}>
        HIGH
      </text>
      <text x={0} y={110} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
        TEMPERATURE
      </text>
    </g>
  );
};

export const S06Dial: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45 },
    { f: C(75), x: 1600, s: 1.45 },
    { f: C(77), x: 960, s: 1.25 },
    { f: C(81), x: 1620, s: 1.45 },
    { f: C(83), x: 1580, s: 3.0, e: "snap" },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: C(73), z: 1.3, at: [780, 420], e: "snap" },
    { f: C(74), z: 1, e: "smooth" },
    { f: W(80, 5), z: 1.3, at: [1370, 480], e: "snap" },
    { f: C(81), z: 1, e: "smooth" },
  ], places);
  const z = punch(g, [W(72, 2), W(74, 5), W(76, 8), W(80, 5)], 0.045);

  const v = interpolate(g, [C(73), C(73) + 14, C(75), C(75) + 20], [0.5, 0.08, 0.08, 0.92], clamp);
  const flat = interpolate(v, [0, 0.5, 1], [-0.45, 0, 0.75]);
  const dialO = vis(g, A, CE(76) + 4, 8);
  const pickK = vis(g, W(74, 5), CE(74), 4);
  const pickHigh = vis(g, W(75, 7), CE(75), 4);
  const splitO = vis(g, C(77), CE(80) + 6, 8);
  const lowTxt = "The cat sat on the mat.";
  const hiTxt = "The cat sat on the moon, in tiny jazz shoes.";
  const nLow = Math.floor(interpolate(g, [C(78), CE(78)], [0, lowTxt.length], clamp));
  const nHi = Math.floor(interpolate(g, [C(80), CE(80)], [0, hiTxt.length], clamp));
  const useO = vis(g, C(81), CE(81) + 4, 8);
  const persO = vis(g, C(82), B + 20, 8);

  const rows: Act[] = [
    [A, "presentBoth", "excited"],
    [C(73), "pointDown", "neutral"],
    [C(74), "count1", "determined"],
    [C(75), "pointUp", "excited", "hop"],
    [C(76), "present", "happy"],
    [C(77), "pointSide", "curious"],
    [C(79), "doublePoint", "excited"],
    [W(80, 5), "clap1", "laugh", "shake"],
    [C(81), "count2", "happy"],
    [C(82), "shrugBig", "smug"],
    [C(83), "thinkChin", "worried"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="grid" />}
      hits={[W(72, 2) - from, W(80, 5) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            <Dial x={g < C(76) ? 860 : 1150} y={g < C(76) ? 420 : 400} s={pop(g, W(72, 2)) * (g < C(76) ? 0.85 : 1)} v={v} o={dialO} />
            <Bars x={1480} y={690} opts={OPTS} grow={soft(g, C(73), C(73) + 16)} flat={flat} pick={g >= W(75, 7) ? 3 : 0} pickK={Math.max(pickK, pickHigh)} s={0.75} o={vis(g, C(73), CE(75) + 4, 8)} />
            <g opacity={vis(g, C(76), CE(76) + 4, 6)}>
              <rect x={760} y={720} width={780} height={20} rx={10} fill={INK} />
              {[0, 0.5, 1, 1.5, 2].map((n, i) => (
                <g key={n} transform={`translate(${760 + i * 195} 730)`}>
                  <line x1={0} y1={-30} x2={0} y2={30} stroke={INK} strokeWidth={6} />
                  <T x={0} y={90} fs={52}>
                    {String(n)}
                  </T>
                </g>
              ))}
              <circle cx={760 + 780 * soft(g, W(76, 6), W(76, 8) + 4)} cy={730} r={26} fill={GOLD} {...K} />
            </g>

          </g>
          {/* split screen: same prompt, two temperatures (full width, not shifted) */}
          <g>
            <g opacity={splitO}>
              <rect x={150} y={120} width={800} height={520} rx={26} fill="#e8fff6" {...K} />
              <rect x={970} y={120} width={800} height={520} rx={26} fill="#fff0ee" {...K} />
              <T x={550} y={200} fs={56} fill={MINT_D}>
                LOW TEMPERATURE
              </T>
              <T x={1370} y={200} fs={56} fill={CORAL} o={soft(g, C(79), C(79) + 8)}>
                HIGH TEMPERATURE
              </T>
              <foreignObject x={190} y={260} width={720} height={260}>
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 54, color: INK, lineHeight: 1.2 }}>{lowTxt.slice(0, nLow)}</div>
              </foreignObject>
              <foreignObject x={1010} y={260} width={720} height={260}>
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 54, color: INK, lineHeight: 1.2 }}>{hiTxt.slice(0, nHi)}</div>
              </foreignObject>
              {/* the moon in jazz shoes */}
              <g transform={`translate(1370 520) scale(${pop(g, W(80, 5))})`} opacity={g >= W(80, 5) ? 1 : 0}>
                <path d="M 40 -90 A 95 95 0 1 0 40 90 A 75 75 0 1 1 40 -90 Z" fill={GOLD} {...K} />
                <ellipse cx={-30} cy={110} rx={40} ry={18} fill={INK} transform={`rotate(${Math.sin(g / 3) * 12} -30 110)`} />
                <ellipse cx={50} cy={110} rx={40} ry={18} fill={INK} transform={`rotate(${-Math.sin(g / 3) * 12} 50 110)`} />
                <rect x={-50} y={98} width={20} height={6} fill="#ffffff" />
                <rect x={30} y={98} width={20} height={6} fill="#ffffff" />
              </g>
              <g transform={`translate(550 540) scale(${pop(g, W(78, 5))})`} opacity={g >= W(78, 5) ? 1 : 0}>
                <rect x={-120} y={-30} width={240} height={60} rx={14} fill={PURPLE} {...K} />
                <T x={0} y={18} fs={40} fill="#ffffff">
                  MAT
                </T>
              </g>
            </g>
          </g>
          <g transform={`translate(${sh} 0)`}>

            {/* when to use which */}
            <g opacity={useO}>
              {[
                ["FACTS & CODE", "LOW", MINT],
                ["BRAINSTORMING", "HIGHER", CORAL],
              ].map(([a, b, col], i) => (
                <g key={a} transform={`translate(${880 + i * 560} 420) scale(${pop(g, i ? W(81, 5) : C(81))})`}>
                  <rect x={-250} y={-150} width={500} height={300} rx={30} fill="#ffffff" {...K} />
                  <rect x={-250} y={-150} width={500} height={90} rx={30} fill={col} {...K} />
                  <T x={0} y={-90} fs={50} fill={i ? "#ffffff" : INK}>
                    {a}
                  </T>
                  <T x={0} y={70} fs={110} fill={PURPLE_D}>
                    {b}
                  </T>
                </g>
              ))}
            </g>

            {/* same engine, different personality */}
            <g opacity={persO}>
              <g transform={`translate(1150 430) scale(${pop(g, C(82))})`}>
                <rect x={-200} y={-140} width={400} height={280} rx={40} fill={PURPLE} {...K} />
                <T x={0} y={-60} fs={44} fill="#ffffff">
                  SAME ENGINE
                </T>
                {[-1, 1].map((d) => (
                  <g key={d} transform={`translate(${d * 90} 40)`}>
                    <circle r={56} fill={d < 0 ? MINT : GOLD} {...K} />
                    <circle cx={-18} cy={-10} r={7} fill={INK} />
                    <circle cx={18} cy={-10} r={7} fill={INK} />
                    <path d={d < 0 ? "M -22 20 L 22 20" : "M -26 12 Q 0 44 26 12"} fill="none" {...K} strokeWidth={6} />
                  </g>
                ))}
              </g>
              <T x={1150} y={250} fs={80} fill={CORAL} o={vis(g, C(83), B + 20)} stroke>
                ONE UNCOMFORTABLE QUESTION…
              </T>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(75, 7), W(82, 3)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(73, 3)} out={CE(74)} x={1450} y={170} size={100} color={MINT}>
            PLAYS IT SAFE
          </Big>
          <Big f={g} at={W(75, 7)} out={CE(75) + 4} x={1450} y={170} size={100} color={CORAL} r={3}>
            SURPRISE PICKS
          </Big>
          <Src f={g} at={C(76)} out={CE(76) + 4}>
            OpenAI API reference: temperature “between 0 and 2”
          </Src>
          <Note f={g} at={C(77)} out={CE(80)}>
            Illustration
          </Note>
          <Cuts f={g} times={CUTS} seed={0} />
        </>
      }
    />
  );
};
