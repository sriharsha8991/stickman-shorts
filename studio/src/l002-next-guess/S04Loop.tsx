import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT, SpeedLines } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Letterbox, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bars, Bg, Big, Brick, C, CE, Cuts, GOLD, INK, K, MINT, Note, PURPLE, Pill, SPARK, SparkHost, T, W, XStamp, clamp, contentShift, cutTimes, pop, sceneCam,
  soft, vis, type Opt,
  CONTENT, type Frame,
} from "./world";

// CH3 · The next-token loop (1:59–2:52). "The cat sat on the…" → a bar chart of options (mat tall, floor shorter, moon
// tiny) → one chunk picked (gold) and stuck on the end → the loop runs again, faster and faster (WOW, riser, speed
// lines) → text streaming in a chat window → "It never wrote the sentence. It wrote the next piece." → each chunk is
// locked in → open loop: which earlier words matter?

const A = C(37);
const B = CE(53);
const CUTS = cutTimes(A, B).filter((t) => t < C(45) - 20 || t > CE(46) + 10);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.5, at: SPARK }, { z: 1.1, at: [960, 420] }];
const OPTS1: Opt[] = [
  { t: "mat", p: 0.55 },
  { t: "floor", p: 0.22 },
  { t: "sofa", p: 0.15 },
  { t: "moon", p: 0.03 },
];
const OPTS2: Opt[] = [
  { t: "and", p: 0.41 },
  { t: ".", p: 0.33 },
  { t: "while", p: 0.17 },
  { t: "purring", p: 0.09 },
];
const MORE = ["and", "purred", "while", "the", "rain", "tapped", "on", "the", "window", ",", "and", "nobody", "knew", "what", "came", "next", "…"];

export const S04_SFX: SfxCue[] = [
  [C(37), "page", 0.4],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [C(37) + 4 + i * 5, "tick", 0.25]),
  [W(38, 6), "riser", 0.3],
  [W(39, 0), "pop", 0.4],
  [W(39, 5), "pop", 0.35],
  [W(40, 0), "boing", 0.35],
  [W(41, 5), "kaching", 0.5],
  [C(42), "whoosh", 0.4],
  [W(42, 5), "stamp", 0.45],
  [W(43, 3), "swirl", 0.45],
  [C(44), "pop", 0.35],
  [W(44, 5), "ding", 0.35],
  [C(45) - 10, "riser", 0.6],
  ...Array.from({ length: 16 }, (_, i): SfxCue => [C(45) + Math.round(66 * Math.sqrt(i / 16) * 2.3), "tick", 0.3]),
  [W(46, 5), "impact", 0.55],
  [C(47), "whoosh_long", 0.4],
  [W(48, 1), "freeze", 0.45],
  [W(49, 3), "stinger", 0.5],
  [C(50), "page", 0.4],
  [W(50, 6), "stamp", 0.55],
  [W(51, 2), "clink", 0.45],
  [C(52), "buzz", 0.3],
  [W(53, 5), "boing", 0.35],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Lock: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -18 -10 L -18 -30 A 18 18 0 0 1 18 -30 L 18 -10" fill="none" stroke={INK} strokeWidth={8} />
      <rect x={-28} y={-12} width={56} height={44} rx={8} fill={GOLD} {...K} strokeWidth={4} />
    </g>
  );

export const S04Loop: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 300, s: 1.45 },
    { f: C(45), x: 330, s: 2.4, e: "snap" },
    { f: C(47), x: 1600, s: 1.45 },
    { f: C(49), x: 1580, s: 3.2, e: "snap" },
    { f: C(50), x: 1620, s: 1.45 },
    { f: C(52), x: 320, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: W(41, 5), z: 1.3, at: [1150, 600], e: "snap" },
    { f: C(43), z: 1, e: "smooth" },
    { f: C(45), z: 1.08, at: [1150, 520], e: "slow" },
    { f: W(46, 5), z: 1.0, e: "snap" },
  ], places);
  const z = punch(g, [W(41, 5), W(46, 5), W(49, 3), W(50, 6)], 0.045);

  // the sentence on the paper
  const base = "The cat sat on the";
  const stuck = g >= W(42, 5);
  const fastA = C(45);
  const fastB = W(46, 5);
  // fast loop: words appear accelerating (step shrinks from 14 to 3 frames)
  const nFast = g < fastA ? 0 : Math.min(MORE.length, Math.floor(Math.pow((g - fastA) / (fastB - fastA), 0.7) * MORE.length));
  const words = [base, ...(stuck ? ["mat"] : []), ...(g >= W(44, 5) ? ["and"] : []), ...MORE.slice(1, Math.max(1, nFast))];
  const sentence = words.join(" ").replace(" ,", ",");
  const paperO = vis(g, A, CE(46) + 6, 8);
  const chart = g < C(44) ? 1 : 2;
  const grow = chart === 1 ? soft(g, W(38, 6), W(40, 3)) : soft(g, C(44), W(44, 4));
  const pickK = chart === 1 ? soft(g, W(41, 5), W(41, 5) + 6) * (1 - soft(g, C(43), C(43) + 8)) : soft(g, W(44, 5), W(44, 5) + 6);
  const barsO = chart === 1 ? vis(g, C(38), C(43) + 8, 8) : vis(g, C(44), C(45) - 4, 6);
  const fly = soft(g, C(42), W(42, 5));
  const fastO = vis(g, fastA, CE(46) + 6);
  const speed = fastO > 0 ? interpolate(g, [fastA, fastB], [1, 6], clamp) : 1;
  // random bars that flicker in the fast loop
  const fastOpts: Opt[] = [0, 1, 2, 3].map((i) => ({ t: ["▮", "▮", "▮", "▮"][i], p: 0.15 + 0.8 * Math.abs(Math.sin(Math.floor((g - fastA) / Math.max(2, 9 - speed)) * (i + 1.7))) }));

  const chatO = vis(g, C(47), CE(49) + 6, 8);
  const chatWords = "Sure! Cats love warm, soft places, so a mat by the window is a classic spot".split(" ");
  const nChat = Math.floor(interpolate(g, [C(47) + 6, CE(47)], [0, chatWords.length], clamp));

  const rows: Act[] = [
    [A, "present", "curious"],
    [C(38), "stop", "thinking"],
    [W(39, 0), "pointSide", "happy"],
    [C(40), "pointDown", "laugh"],
    [C(41), "thinkChin", "curious"],
    [W(41, 5), "fistPump", "excited", "nod"],
    [C(42), "presentBoth", "happy"],
    [C(43), "pointUp", "curious"],
    [C(44), "doublePoint", "excited"],
    [C(45), "clap1", "excited"],
    [C(46), "mindBlown", "mindblown", "shake"],
    [C(47), "pointSide", "curious"],
    [C(48), "whisper", "thinking"],
    [W(49, 3), "celebrate", "mindblown", "hop"],
    [C(50), "stop", "determined"],
    [C(51), "count1", "neutral"],
    [C(52), "armsCrossed", "skeptical"],
    [C(53), "thinkChin", "curious"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="night" />}
      hits={[W(41, 5) - from, W(46, 5) - from, W(49, 3) - from]}
      power={8}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          {fastO > 0 && <SpeedLines f={g} from={fastA} to={fastB + 10} color="#7b2ff7" />}
          <g transform={`translate(${sh} 0)`}>
            {/* paper in the typewriter */}
            <g opacity={paperO}>
              <rect x={560} y={130} width={1180} height={190} rx={14} fill="#ffffff" {...K} />
              <foreignObject x={590} y={140} width={1120} height={170}>
                <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: nFast > 8 ? 42 : 56, color: INK, lineHeight: 1.15 }}>
                  {sentence}
                  <span style={{ color: PURPLE, opacity: Math.floor(g / 6) % 2 ? 1 : 0.15 }}>▌</span>
                </div>
              </foreignObject>
              {nFast > 0 && (
                <Pill x={1150} y={360} text={`STEP ${nFast + 2} · SCORE · PICK · STICK`} fill={PURPLE} fs={34} />
              )}
            </g>
            {/* bars */}
            {fastO <= 0 && (
              <Bars x={1150} y={700} opts={chart === 1 ? OPTS1 : OPTS2} grow={grow} pick={0} pickK={pickK} o={Math.max(0, Math.min(1, barsO))} dark />
            )}
            {fastO > 0 && <Bars x={1150} y={700} opts={fastOpts} grow={1} pick={Math.floor((g - fastA) / 6) % 4} pickK={1} o={fastO} dark showPct={false} />}
            {/* the picked chunk flies up onto the paper */}
            {fly > 0 && fly < 1 && <Brick x={interpolate(fly, [0, 1], [916, 1200])} y={interpolate(fly, [0, 1], [560, 230])} text="mat" color={GOLD} s={1 - 0.2 * fly} r={fly * 10} />}
            <Pill x={1150} y={420} text="LOOP: RUN IT ALL AGAIN" fill={MINT} color={INK} fs={40} s={pop(g, W(43, 3))} o={vis(g, W(43, 3), CE(43) + 4)} />
            {g >= W(43, 3) && g < C(45) && (
              <g transform={`translate(1660 560) rotate(${(g - W(43, 3)) * 10})`} opacity={vis(g, W(43, 3), C(45) - 4)}>
                <circle r={80} fill="none" stroke={MINT} strokeWidth={16} strokeDasharray="380 120" />
              </g>
            )}

            {/* chat window streaming */}
            <g opacity={chatO}>
              <rect x={460} y={150} width={900} height={560} rx={30} fill="#ffffff" {...K} />
              <rect x={460} y={150} width={900} height={70} rx={30} fill={PURPLE} />
              <T x={910} y={198} fs={36} fill="#ffffff">
                CHAT
              </T>
              <rect x={860} y={250} width={460} height={80} rx={24} fill={MINT} {...K} strokeWidth={4} />
              <T x={1090} y={302} fs={34} font={FONT.body} weight={800}>
                Where do cats like to sit?
              </T>
              <foreignObject x={500} y={360} width={760} height={300}>
                <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: INK, lineHeight: 1.25, background: "#efe6ff", borderRadius: 24, padding: "14px 22px", border: `4px solid ${INK}` }}>
                  {chatWords.slice(0, Math.max(1, nChat)).join(" ")}
                  <span style={{ color: PURPLE }}>▌</span>
                </div>
              </foreignObject>
            </g>

            {/* draft → reveal ✗ ; chunks locked in */}
            <g opacity={vis(g, C(50), CE(51) + 4)}>
              <g transform={`translate(1000 300) scale(${pop(g, C(50))})`}>
                <rect x={-230} y={-80} width={460} height={160} rx={20} fill="#ffffff" {...K} />
                <T x={0} y={20} fs={60}>
                  DRAFT → REVEAL
                </T>
                <XStamp x={0} y={0} f={g} at={W(50, 6)} s={0.6} />
              </g>
              <g opacity={soft(g, C(51), C(51) + 8)}>
                {["The", "cat", "sat", "on", "the", "mat"].map((w, i) => (
                  <g key={w + i}>
                    <Brick x={560 + i * 170} y={600} text={w} color={i === 5 ? GOLD : PURPLE} w={150} fs={44} />
                    <Lock x={560 + i * 170} y={530} s={pop(g, W(51, 2) + i * 3)} />
                  </g>
                ))}
              </g>
            </g>

            {/* open loop: which earlier words matter? */}
            <g opacity={vis(g, C(52), B + 20)}>
              {["The", "trophy", "didn't", "fit", "in", "the", "suitcase"].map((w, i) => (
                <g key={w + i} transform={`translate(${800 + (i % 4) * 280} ${330 + Math.floor(i / 4) * 170 + Math.sin(g / 10 + i) * 10})`} opacity={soft(g, C(52) + i * 3, C(52) + i * 3 + 8)}>
                  <Brick x={0} y={0} text={w} color={i % 2 ? MINT : PURPLE} fs={44} />
                  <T x={60} y={-50} fs={40} fill={GOLD} o={soft(g, C(53), C(53) + 8)}>
                    ?
                  </T>
                </g>
              ))}
              <circle cx={1150 + Math.sin(g / 14) * 260} cy={420} r={150} fill="#ffffff" opacity={0.12 * soft(g, C(53), C(53) + 10)} />
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(49, 3), W(41, 5)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(40, 0)} out={CE(40)} x={1700} y={600} size={80} color={MINT} r={6}>
            tiny!
          </Big>
          <Big f={g} at={W(46, 5)} out={CE(46) + 4} x={1600} y={330} size={140} color={GOLD} r={6}>
            FASTER!
          </Big>
          <Big f={g} at={W(48, 1)} out={C(49)} x={760} y={190} size={100} color="#ffffff">
            IT NEVER WROTE THE SENTENCE
          </Big>
          <Big f={g} at={W(49, 3)} out={CE(49) + 10} x={760} y={190} size={100} color={GOLD}>
            IT WROTE THE NEXT PIECE
          </Big>
          <Big f={g} at={W(53, 5)} out={B + 10} x={1150} y={170} size={110} color={GOLD} r={-2}>
            WHICH WORDS MATTER?
          </Big>
          <Note f={g} at={C(38)} out={CE(44)}>
            Illustrative scores
          </Note>
          <Note f={g} at={C(47)} out={CE(47)}>
            Illustration
          </Note>
          <Letterbox k={vis(g, C(48), CE(49), 8)} />
          <Cuts f={g} times={CUTS} seed={3} />
        </>
      }
    />
  );
};
