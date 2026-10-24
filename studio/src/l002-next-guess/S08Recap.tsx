import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { Act, Bg, Big, C, CE, CORAL, Cuts, GOLD, INK, K, MINT, PURPLE, PURPLE_D, SPARK, SparkHost, T, W, clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame } from "./world";

// WRAP-UP (4:52–end). The one sentence types out → context is the steering wheel → 1 · 2 · 3 checklist →
// "It isn't magic. It's prediction." (bulb) → end card: a blinking cursor + THE HIDDEN MECHANISM.

const A = C(91);
const END = CE(98);
const CUTS = cutTimes(A, END + 20);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.45, at: SPARK }];
const ONE = "It predicts the next chunk, over and over.";
const TIPS: [string, string][] = [
  ["GIVE IT CONTEXT", "who · what · for whom"],
  ["ASK FOR OPTIONS", "not one answer"],
  ["CHECK THE FACTS", "it states"],
];

export const S08_SFX: SfxCue[] = [
  [C(91), "page", 0.4],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [C(92) + i * 7, "tick", 0.22]),
  [CE(92), "ding", 0.45],
  [C(93), "swirl", 0.4],
  [C(94), "stamp", 0.45],
  [C(95), "stamp", 0.45],
  [C(96), "stamp", 0.45],
  [W(97, 3), "stinger", 0.5],
  [C(98), "riser", 0.3],
  [END + 4, "ding", 0.5],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

export const S08Recap: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45 },
    { f: C(93), x: 1600, s: 1.45 },
    { f: C(97), x: 1580, s: 3.0, e: "snap" },
    { f: C(98), x: 1560, s: 1.45 },
    { f: END, x: 520, s: 1.7 },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [{ f: END, z: 1, e: "smooth" }], places);
  const z = punch(g, [CE(92), C(94), C(95), C(96), W(97, 3)], 0.04);

  const n = Math.floor(interpolate(g, [C(92), CE(92)], [0, ONE.length], clamp));
  const oneO = vis(g, A, CE(92) + 10, 8);
  const wheelO = vis(g, C(93), CE(93) + 4, 8);
  const tipsO = vis(g, C(94), CE(96) + 8, 8);
  const endO = soft(g, END - 6, END + 10);

  const rows: Act[] = [
    [A, "present", "happy"],
    [C(92), "pointSide", "determined"],
    [C(93), "presentBoth", "excited"],
    [C(94), "count1", "happy", "nod"],
    [C(95), "count2", "happy"],
    [C(96), "pointUp", "determined", "nod"],
    [C(97), "thinkChin", "smug"],
    [W(97, 3), "celebrate", "mindblown", "hop"],
    [C(98), "pointDown", "wink"],
    [END, "wave1", "happy", "wave"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind={g < END ? "paper" : "night"} />}
      hits={[W(97, 3) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* the one sentence */}
            <g opacity={oneO}>
              <T x={1150} y={250} fs={60} fill={PURPLE}>
                YOUR ONE SENTENCE
              </T>
              <rect x={560} y={320} width={1180} height={260} rx={30} fill="#ffffff" {...K} />
              <foreignObject x={600} y={350} width={1100} height={210}>
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 70, color: INK, lineHeight: 1.15, textAlign: "center" }}>
                  {ONE.slice(0, n)}
                  <span style={{ color: PURPLE, opacity: Math.floor(g / 6) % 2 ? 1 : 0.15 }}>▌</span>
                </div>
              </foreignObject>
            </g>

            {/* context = steering wheel */}
            <g opacity={wheelO} transform={`translate(1150 470) scale(${pop(g, C(93))}) rotate(${Math.sin((g - C(93)) / 10) * 25})`}>
              <circle r={240} fill="none" stroke={INK} strokeWidth={46} />
              <circle r={240} fill="none" stroke={PURPLE} strokeWidth={30} />
              {[0, 120, 240].map((a) => (
                <rect key={a} x={-14} y={-230} width={28} height={230} fill={INK} transform={`rotate(${a})`} />
              ))}
              <circle r={70} fill={GOLD} {...K} />
              <T x={0} y={14} fs={36}>
                CONTEXT
              </T>
            </g>

            {/* 1 · 2 · 3 */}
            <g opacity={tipsO}>
              {TIPS.map(([a, b], i) => (
                <g key={a} transform={`translate(1150 ${240 + i * 200}) scale(${pop(g, C(94 + i))})`} opacity={g >= C(94 + i) ? 1 : 0}>
                  <rect x={-540} y={-80} width={1080} height={160} rx={30} fill="#ffffff" {...K} />
                  <circle cx={-450} cy={0} r={58} fill={[PURPLE, MINT, CORAL][i]} {...K} />
                  <T x={-450} y={26} fs={74} fill={i === 1 ? INK : "#ffffff"}>
                    {String(i + 1)}
                  </T>
                  <T x={-360} y={0} fs={64} anchor="start">
                    {a}
                  </T>
                  <T x={-360} y={52} fs={36} anchor="start" fill={PURPLE} font={FONT.body} weight={700}>
                    {b}
                  </T>
                </g>
              ))}
            </g>

            {/* blinking cursor */}
            <g opacity={vis(g, C(98), END - 6)}>
              <rect x={1130} y={300} width={46} height={240} fill={PURPLE} opacity={Math.floor(g / 12) % 2 ? 1 : 0.1} />
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(97, 3), END + 6]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(97, 3)} out={CE(97) + 6} x={760} y={200} size={120} color={GOLD} r={-2}>
            NOT MAGIC. PREDICTION.
          </Big>
          {endO > 0 && (
            <div style={{ position: "absolute", left: 820, top: 240, width: 980, opacity: endO, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.title, fontWeight: 800, fontSize: 46, letterSpacing: 12, color: MINT }}>THE HIDDEN MECHANISM</div>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 108, color: "#ffffff", lineHeight: 1.05, marginTop: 20 }}>
                FEED IT CONTEXT.
                <br />
                IT PREDICTS BETTER.<span style={{ color: MINT, opacity: Math.floor(g / 12) % 2 ? 1 : 0.1 }}>▌</span>
              </div>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: GOLD, marginTop: 30, background: PURPLE_D, display: "inline-block", padding: "6px 20px", borderRadius: 12 }}>
                Coming up: why AI makes things up
              </div>
            </div>
          )}
          <Cuts f={g} times={CUTS} seed={3} />
        </>
      }
    />
  );
};
