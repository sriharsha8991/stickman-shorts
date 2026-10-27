import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, CORAL_D, Clipboard, Cuts, Cutter, INK, K, MINT, MINT_D, PAPER, PainMeter, PlanBlock, PriceTag, SparkHost, TCOLS, W,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// WRAP · The 10-second check (3:55–4:31). Sunrise over the market. A stopwatch starts a 10-second countdown; a clipboard
// with two questions gets ticked (WOULD I BUY IT TODAY? · HOW MANY PLANS OPEN?), each with a tiny visual. "No" → NO stamp;
// the meter mutes. Takeaway: the cutter splits the tag (pain splits) but the slices snap back into ₹4,000 (not the price)
// — the hook's frame, looped. End card: Spark waves, "THE HIDDEN MECHANISM", education line.

const A = C(73);
const END = C(81);
const CUTS = cutTimes(A, END - 10, 150).filter((t) => Math.abs(t - C(79)) > 45);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.15, at: CONTENT }, { z: 1.08, at: [960, 480] }, { z: 1.12, at: [1150, 520] }];

export const S07_SFX: SfxCue[] = [
  [A, "pop", 0.4],
  [W(73, 4), "ding", 0.45],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [W(73, 4) + 6 + i * 9, "tick", 0.2]),
  [W(74, 5), "page", 0.45],
  [C(75), "scribble", 0.4],
  [W(75, 4), "tick", 0.4],
  [C(76), "scribble", 0.4],
  [W(76, 2), "thud", 0.4],
  [W(77, 5), "stamp", 0.6],
  [W(78, 4), "freeze", 0.35],
  [C(79) - 6, "whoosh", 0.45],
  [W(79, 5), "slam", 0.5],
  [W(80, 2), "kaching", 0.55],
  [END, "swirl", 0.35],
  [W(81, 1), "ding", 0.45],
  [W(82, 5), "stinger", 0.4],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

export const S07Check: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 1620, s: 1.45, e: "cut" },
    { f: C(75), x: 300, s: 1.45, e: "slow" },
    { f: C(77), x: 330, s: 3.0, e: "snap" },
    { f: C(78), x: 300, s: 1.45 },
    { f: C(80), x: 330, s: 2.6, e: "snap" },
    { f: END, x: 960, s: 2.2, e: "smooth" },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(77, 5), z: 1.25, at: [1150, 480], e: "snap" },
      { f: C(78), z: 1, e: "smooth" },
      { f: C(79), z: 1, e: "cut" },
      { f: W(80, 2), z: 1.2, at: [1150, 420], e: "snap" },
      { f: END, z: 1, e: "smooth" },
    ],
    places,
  );
  const z = punch(g, [W(73, 4), W(77, 5), W(79, 5), W(80, 2)], 0.045);

  const watchO = vis(g, A, C(79) - 4, 8);
  const secs = Math.max(0, 10 - Math.floor(interpolate(g, [W(73, 4), W(73, 4) + 300], [0, 10], clamp)));
  const boardO = vis(g, W(74, 5), C(79) - 4, 8);
  const take = vis(g, C(79), END, 6);
  const cutK = soft(g, W(79, 5) - 10, W(79, 5) + 2);
  const split = soft(g, W(79, 5), W(79, 5) + 12) * (1 - soft(g, W(80, 2) - 4, W(80, 2) + 4));
  const endO = soft(g, END, END + 14);

  const rows: Act[] = [
    [A, "presentBoth", "determined"],
    [W(73, 4), "pointUp", "excited"],
    [C(74), "count2", "determined"],
    [C(75), "count1", "thinking"],
    [C(76), "count2", "curious"],
    [C(77), "stop", "skeptical", "shake"],
    [C(78), "shrugBig", "smug"],
    [C(79), "pointSide", "neutral"],
    [W(80, 2), "fistPump", "wink", "nod"],
    [END, "wave1", "happy", "wave"],
    [C(82), "celebrate", "excited", "hop"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="dawn" />}
      hits={[W(77, 5) - from, W(80, 2) - from]}
      power={6}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* stopwatch */}
            <g transform={`translate(1150 300) scale(${pop(g, A + 2)})`} opacity={watchO * (g < W(74, 5) ? 1 : 0.0)}>
              <rect x={-30} y={-210} width={60} height={50} rx={10} fill={CHAR} />
              <circle r={170} fill={PAPER} {...K} strokeWidth={8} />
              <path d={`M 0 0 L 0 -150 A 150 150 0 ${secs <= 5 ? 1 : 0} 1 ${Math.sin(((10 - secs) / 10) * Math.PI * 2) * 150} ${-Math.cos(((10 - secs) / 10) * Math.PI * 2) * 150} Z`} fill={MINT} opacity={0.6} />
              <text x={0} y={46} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={140} fill={INK}>
                {secs}
              </text>
            </g>
            {/* clipboard (moves the stopwatch to the corner) */}
            <Clipboard
              x={1150}
              y={480}
              lines={["Would I buy it if I paid it ALL today?", "How many plans do I already have open?"]}
              f={g}
              ticks={[W(75, 4), W(76, 2)]}
              s={0.95 * pop(g, W(74, 5))}
              o={boardO}
              r={-2}
            />
            <g opacity={boardO} transform={`translate(1560 240) scale(0.42)`}>
              <circle r={170} fill={PAPER} {...K} strokeWidth={10} />
              <text x={0} y={46} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={140} fill={INK}>
                {secs}
              </text>
            </g>
            {g >= W(77, 5) && g < C(79) && (
              <g transform={`translate(1300 380) scale(${interpolate(g - W(77, 5), [0, 4, 8], [2.4, 0.9, 1], clamp)}) rotate(-12)`}>
                <rect x={-120} y={-64} width={240} height={128} rx={16} fill="rgba(255,255,255,0.8)" stroke={CORAL_D} strokeWidth={12} />
                <text x={0} y={34} textAnchor="middle" fontFamily={FONT.comic} fontSize={100} fill={CORAL_D}>
                  NO?
                </text>
              </g>
            )}
            <PainMeter x={1560} y={700} v={g >= W(78, 4) ? 0.08 : 0.55} s={0.4} o={vis(g, C(78), C(79) - 4)} label="…MUTED" />

            {/* takeaway: split the pain, not the price */}
            <g opacity={take}>
              {split < 0.02 && g < W(79, 5) && <PriceTag x={1150} y={420} text="₹4,000" w={520} fs={120} fill={PAPER} glow={0.5} />}
              {(split >= 0.02 || g >= W(79, 5)) &&
                [0, 1, 2, 3].map((i) => (
                  <PriceTag key={i} x={1150 + (i - 1.5) * 280 * split} y={420 + (i % 2 ? 30 : -30) * split} r={(i - 1.5) * 5 * split} text={split > 0.3 ? "₹1,000" : ""} w={split > 0.3 ? 240 : 130} fs={58} fill={PAPER} />
                ))}
              {g >= W(80, 2) && <PriceTag x={1150} y={420} text="₹4,000" sub="SAME PRICE" w={520} fs={120} fill={AMBER} s={pop(g, W(80, 2))} glow={1} />}
              <Cutter x={interpolate(cutK, [0, 1], [1600, 860])} y={interpolate(cutK, [0, 1], [120, 520])} r={-35} spin={g * 14} s={1} o={vis(g, C(79), W(79, 5) + 14, 6)} />
              {[0, 1, 2, 3].map((i) => (
                <PainMeter key={i} x={750 + i * 270} y={770} v={0.12 + 0.05 * Math.sin(g / 7 + i)} s={0.28} o={vis(g, W(79, 5) + 4, W(80, 2) - 2)} label="¼" />
              ))}
            </g>
          </g>

          {/* end card */}
          <g opacity={endO}>
            <rect x={0} y={0} width={1920} height={1080} fill={CHAR} opacity={0.82} />
            {Array.from({ length: 14 }, (_, i) => (
              <circle key={i} cx={(i * 151 + 60) % 1920} cy={120 + Math.sin(g / 9 + i) * 30} r={10} fill={[AMBER, MINT, CORAL][i % 3]} opacity={0.8} />
            ))}
            <PlanBlock x={1500} y={760} label="" fill={MINT} s={0.6} r={-3} />
            <PlanBlock x={1520} y={700} label="" fill={CORAL} s={0.6} r={4} />
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(80, 2), C(82)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(73, 4)} out={CE(73) + 4} x={960} y={110} size={110} color={MINT_D}>
            THE 10-SECOND CHECK
          </Big>
          <Big f={g} at={W(79, 5)} out={CE(79)} x={960} y={120} size={120} color={CORAL}>
            SPLITS THE PAIN
          </Big>
          <Big f={g} at={W(80, 2)} out={END - 4} x={960} y={120} size={130} color={INK}>
            NOT THE PRICE.
          </Big>
          {endO > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 160, textAlign: "center", opacity: endO }}>
              <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 96, color: PAPER, letterSpacing: 6, textShadow: `0 0 24px ${MINT}` }}>THE HIDDEN MECHANISM</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 40, color: MINT, marginTop: 14 }}>How AI, money and your brain quietly work</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: AMBER, marginTop: 18, opacity: soft(g, W(81, 3), W(81, 3) + 10) }}>Education, not financial advice</div>
            </div>
          )}
          <Cuts f={g} times={CUTS} seed={2} dur={18} />
          <Transition f={g} at={C(79)} kind="iris" colors={TCOLS} dur={18} irisAt={[960, 460]} />
          <Transition f={g} at={END} kind="slice" colors={[MINT, CORAL, AMBER]} dur={18} />
          <Transition f={g} at={C(82)} kind="flash" colors={[MINT, CORAL, AMBER]} dur={30} />
          <Transition f={g} at={C(82) + 100} kind="whip" colors={[MINT, CORAL, AMBER]} dur={30} />
        </>
      }
    />
  );
};
