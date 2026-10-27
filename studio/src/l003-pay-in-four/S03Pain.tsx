import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Letterbox, Transition, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  AMBER, Act, Bg, Big, C, CE, CHAR, CORAL, CORAL_D, Cuts, Cutter, Doc, INK, K, MINT, MINT_D, Note, PAPER, PainMeter, Phone, SPARK, SparkHost, Src, T, TCOLS, W, Wallet,
  clamp, contentShift, cutTimes, pop, sceneCam, soft, vis, CONTENT, type Frame,
} from "./world";

// CH2 · The pain meter (1:08–2:08). Mint lab grid. A pain meter on a wallet; the 1998 paper drops in (Prelec &
// Loewenstein, "The Red and the Black"); a coin leaves → the needle jumps (sting). The sting is a BRAKE (shopping cart
// screeches to a stop). Slice → BUY and PAY glued together by cash; a card loosens the glue and they drift apart (aha bulb
// on "weaken"). Shutter → throwback to the cash-vs-UPI Short: tap, the needle drops to CALM. WOW: the giant cutter
// returns and slices the meter into four mini meters.

const A = C(21);
const B = CE(39);
const SWAP1 = C(29);
const SWAP2 = C(35);
const CUTS = cutTimes(A, B, 160).filter((t) => Math.abs(t - SWAP1) > 45 && Math.abs(t - SWAP2) > 45 && Math.abs(t - W(39, 2)) > 40);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.22, at: CONTENT }, { z: 1.08, at: [960, 470] }, { z: 1.35, at: SPARK }];

export const S03_SFX: SfxCue[] = [
  [A, "pop", 0.4],
  [W(21, 5), "tick", 0.4],
  [W(22, 1), "page", 0.45],
  [W(22, 6), "stamp", 0.45],
  [C(24), "slam", 0.5],
  [W(25, 3), "clink", 0.45],
  [W(25, 6), "buzz", 0.45],
  [W(26, 8), "ding", 0.4],
  [W(27, 5), "scribble", 0.4],
  [W(28, 2), "crash", 0.3],
  [W(28, 3), "thud", 0.45],
  [SWAP1 - 4, "whoosh", 0.4],
  [W(29, 5), "stamp", 0.4],
  [W(30, 7), "buzz", 0.4],
  [W(31, 6), "swirl", 0.4],
  [W(32, 4), "pop", 0.45],
  [W(33, 3), "stinger", 0.5],
  [W(34, 6), "page", 0.35],
  [SWAP2 - 4, "whoosh_long", 0.35],
  [W(35, 4), "boing", 0.35],
  [W(36, 3), "tick", 0.45],
  [W(36, 7), "freeze", 0.4],
  [C(37), "riser", 0.45],
  [W(39, 2) - 6, "whoosh", 0.5],
  [W(39, 2), "slam", 0.6],
  [W(39, 2) + 3, "shatter", 0.35],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

// pain value over time (0 calm → 1 ouch)
const pain = (g: number) => {
  const base = 0.18 + 0.03 * Math.sin(g / 7);
  const spike = (at: number, h: number, decay = 30) => (g < at ? 0 : h * Math.exp(-(g - at) / decay));
  const quiet = g >= W(36, 7) ? interpolate(g, [W(36, 7), W(36, 7) + 12], [1, 0.15], clamp) : 1;
  return (base + spike(W(25, 6), 0.75, 40) + spike(W(30, 7), 0.75, 50)) * quiet;
};

// shopping cart with a brake
const Cart: React.FC<{ x: number; y: number; s: number; o: number; skid: number }> = ({ x, y, s, o, skid }) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-6 * skid})`} opacity={o}>
      <path d="M -170 -110 L -130 -110 L -90 40 L 130 40 L 160 -70 L -110 -70" fill="none" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
      <rect x={-100} y={-60} width={250} height={90} fill={MINT} opacity={0.5} />
      <circle cx={-70} cy={80} r={26} fill={CHAR} />
      <circle cx={110} cy={80} r={26} fill={CHAR} />
      {skid > 0 &&
        [0, 1, 2].map((i) => <line key={i} x1={-200 - i * 40} y1={100 + i * 4} x2={-120 - i * 40} y2={100 + i * 4} stroke={INK} strokeWidth={6} opacity={skid * 0.6} />)}
    </g>
  );

// a labelled box (BUY / PAY)
const Box: React.FC<{ x: number; y: number; label: string; fill: string; s?: number; children?: React.ReactNode }> = ({ x, y, label, fill, s = 1, children }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-130} width={300} height={260} rx={30} fill={fill} {...K} strokeWidth={7} />
    <text x={0} y={-60} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={58} fill={INK}>
      {label}
    </text>
    {children}
  </g>
);

export const S03Pain: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 1620, s: 1.45 },
    { f: C(26), x: 1580, s: 3.0, e: "snap" },
    { f: C(27), x: 1620, s: 1.45 },
    { f: SWAP1, x: 300, s: 1.45, e: "cut" },
    { f: C(33), x: 330, s: 3.2, e: "snap" },
    { f: C(34), x: 300, s: 1.45 },
    { f: C(37), x: 1600, s: 1.45, e: "slow" },
    { f: C(38), x: 1580, s: 2.6, e: "snap" },
  ];
  const sh = contentShift(g, places);
  const cam = sceneCam(
    g,
    from,
    CUTS,
    FRAMES,
    [
      { f: W(25, 6), z: 1.3, at: [1000 + sh, 520], e: "snap" },
      { f: C(26), z: 1, e: "smooth" },
      { f: C(38), z: 1.12, at: [1150 + sh, 500], e: "slow" },
      { f: W(39, 2), z: 1, e: "snap" },
    ],
    places,
  );
  const z = punch(g, [W(25, 6), W(28, 3), W(33, 3), W(39, 2)], 0.05);

  const p1 = vis(g, A - 6, SWAP1, 2);
  const p2 = vis(g, SWAP1, SWAP2, 2);
  const p3 = vis(g, SWAP2, B + 20, 2);
  const v = pain(g);
  const coinK = soft(g, W(25, 3), W(25, 3) + 14);
  const cartK = soft(g, C(28), W(28, 3));
  const loosen = soft(g, W(31, 6), W(33, 3) + 10);
  const card = g >= W(32, 4);
  const sliced = g >= W(39, 2);
  const cutK = soft(g, W(39, 2) - 12, W(39, 2));
  const fan = soft(g, W(39, 2), W(39, 2) + 8);

  const rows: Act[] = [
    [A, "present", "curious"],
    [W(21, 5), "pointSide", "neutral"],
    [C(22), "count2", "thinking"],
    [C(23), "presentBoth", "neutral"],
    [C(24), "pointUp", "excited", "nod"],
    [W(25, 6), "recoil", "worried"],
    [C(26), "whisper", "smug"],
    [C(27), "thinkChin", "thinking"],
    [W(28, 2), "stop", "determined"],
    [SWAP1, "presentBoth", "happy"],
    [C(30), "clap2", "worried"],
    [C(31), "pointSide", "curious"],
    [W(32, 4), "doublePoint", "skeptical"],
    [W(33, 3), "mindBlown", "mindblown", "shake"],
    [C(34), "pointUp", "thinking"],
    [C(35), "wave1", "happy", "wave"],
    [W(36, 7), "shrugBig", "smug"],
    [C(37), "pointSide", "excited"],
    [C(38), "leanIn", "wink"],
    [W(39, 2), "celebrate", "mindblown", "hop"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind="brain" />}
      hits={[W(25, 6) - from, W(28, 3) - from, W(39, 2) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* staging 1: meter + paper + brake */}
            <g opacity={p1}>
              <PainMeter x={1000} y={560} v={v} s={0.85 * pop(g, A + 2)} />
              <Wallet x={1000} y={760} s={0.6} open={coinK} />
              {coinK > 0 && coinK < 1 && (
                <circle cx={1000 + coinK * 200} cy={700 - Math.sin(coinK * Math.PI) * 200} r={26} fill={AMBER} {...K} strokeWidth={4} />
              )}
              <Doc
                x={1460}
                y={470}
                title={["THE RED AND", "THE BLACK"]}
                year="Prelec & Loewenstein · 1998"
                quote={g >= C(27) ? ["“pain of paying … important", "role in consumer self-regulation”"] : []}
                hl={soft(g, W(27, 5), W(27, 5) + 30)}
                s={0.62 * pop(g, W(22, 1))}
                o={vis(g, W(22, 1), C(28) - 2)}
                r={3}
                w={620}
              />
              <Cart x={interpolate(cartK, [0, 1], [700, 1400])} y={700} s={0.9} o={vis(g, C(28), SWAP1 - 4)} skid={g >= W(28, 3) ? 1 : 0} />
              {g >= W(28, 3) && (
                <g transform={`translate(1560 520) scale(${pop(g, W(28, 3))})`}>
                  <polygon points="-90,-36 -36,-90 36,-90 90,-36 90,36 36,90 -36,90 -90,36" fill={CORAL} {...K} strokeWidth={6} />
                  <text x={0} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill="#fff">
                    BRAKE
                  </text>
                </g>
              )}
            </g>

            {/* staging 2: BUY + PAY glue */}
            <g opacity={p2}>
              {(() => {
                const bx = interpolate(loosen, [0, 1], [1000, 830]);
                const px = interpolate(loosen, [0, 1], [1300, 1480]);
                const thick = interpolate(loosen, [0, 1], [70, 8]);
                return (
                  <g>
                    <path
                      d={`M ${bx + 120} 520 C ${(bx + px) / 2} ${520 + 40 * loosen}, ${(bx + px) / 2} ${520 + 40 * loosen}, ${px - 120} 520`}
                      stroke={AMBER}
                      strokeWidth={thick}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={loosen > 0.6 ? "18 18" : undefined}
                    />
                    <Box x={bx} y={520} label="BUY" fill={MINT} s={0.9 * pop(g, SWAP1 + 2)}>
                      <path d="M -60 30 L -60 0 A 60 60 0 0 1 60 0 L 60 30" fill="none" stroke={INK} strokeWidth={12} />
                      <rect x={-78} y={20} width={36} height={60} rx={14} fill={CORAL} {...K} />
                      <rect x={42} y={20} width={36} height={60} rx={14} fill={CORAL} {...K} />
                    </Box>
                    <Box x={px} y={520} label="PAY" fill={card ? AMBER : PAPER} s={0.9 * pop(g, SWAP1 + 6)}>
                      {!card ? (
                        <g>
                          <rect x={-90} y={0} width={180} height={90} rx={10} fill="#9be3b8" {...K} strokeWidth={4} />
                          <circle cx={0} cy={45} r={22} fill="none" stroke={INK} strokeWidth={4} />
                        </g>
                      ) : (
                        <g transform={`scale(${pop(g, W(32, 4))})`}>
                          <rect x={-100} y={-6} width={200} height={120} rx={14} fill={CHAR} {...K} strokeWidth={4} />
                          <rect x={-70} y={20} width={40} height={30} rx={6} fill={AMBER} />
                          <rect x={-100} y={70} width={200} height={14} fill="#555a66" />
                        </g>
                      )}
                    </Box>
                    <T x={(bx + px) / 2} y={360} fs={48} fill={CORAL_D} o={soft(g, W(29, 5), W(29, 5) + 8) * (1 - loosen)}>
                      GLUED
                    </T>
                    <T x={(bx + px) / 2} y={360} fs={48} fill={CORAL_D} o={loosen}>
                      LOOSE
                    </T>
                  </g>
                );
              })()}
              <PainMeter x={1150} y={830} v={v} s={0.42} o={vis(g, C(30), C(32))} />
            </g>

            {/* staging 3: UPI throwback, quiet sting, sliced meter */}
            <g opacity={p3}>
              <g transform={`translate(760 470) rotate(-4) scale(${pop(g, SWAP2 + 2)})`} opacity={vis(g, SWAP2, C(37) + 10)}>
                <rect x={-230} y={-250} width={460} height={500} rx={24} fill={PAPER} {...K} strokeWidth={7} />
                <text x={0} y={-190} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={CORAL_D}>
                  THROWBACK
                </text>
                <text x={0} y={-140} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={36} fill={INK}>
                  CASH vs UPI
                </text>
                <Phone x={0} y={60} s={0.42}>
                  <circle cx={0} cy={0} r={100} fill={MINT} {...K} />
                  <text x={0} y={22} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={64} fill={INK}>
                    TAP
                  </text>
                </Phone>
              </g>
              {!sliced && <PainMeter x={1240} y={520} v={v} s={0.7 * pop(g, SWAP2 + 4)} label={g >= W(36, 7) ? "…QUIET" : "PAIN OF PAYING"} />}
              {sliced &&
                [0, 1, 2, 3].map((i) => (
                  <PainMeter key={i} x={1150 + (i - 1.5) * interpolate(fan, [0, 1], [10, 300])} y={500 + (i % 2) * 60 * fan} v={0.08 + 0.03 * Math.sin(g / 6 + i)} s={0.4 + 0.1 * (1 - fan)} label="¼" />
                ))}
              <Cutter x={interpolate(cutK, [0, 1], [1700, 900])} y={interpolate(cutK, [0, 1], [150, 620])} r={-40} spin={g * 16} s={1.1} o={vis(g, C(37), W(39, 2) + 16, 6)} />
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(33, 3), W(24, 0)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(21, 5)} out={CE(21)} x={960} y={130} size={110} color={MINT_D}>
            A PAIN METER
          </Big>
          <Big f={g} at={C(24)} out={CE(25) + 6} x={960} y={130} size={130} color={CORAL}>
            THE PAIN OF PAYING
          </Big>
          <Big f={g} at={W(26, 8)} out={CE(26) + 6} x={760} y={150} size={120} color={AMBER} r={-3}>
            IT HAS A JOB
          </Big>
          <Big f={g} at={W(33, 3)} out={CE(34) + 6} x={1150} y={150} size={110} color={CORAL} r={2}>
            WEAKER LINK
          </Big>
          <Big f={g} at={W(39, 2)} out={B + 10} x={960} y={140} size={140} color={AMBER} r={-3}>
            SLICED!
          </Big>
          <Src f={g} at={W(22, 1)} out={CE(28)}>
            Prelec & Loewenstein (1998), Marketing Science 17(1)
          </Src>
          <Src f={g} at={C(32)} out={CE(34)}>
            Prelec & Loewenstein (1998): credit cards “tend to weaken coupling”
          </Src>
          <Note f={g} at={SWAP2} out={CE(36)}>
            Callback: our cash-vs-UPI Short
          </Note>
          <Letterbox k={vis(g, C(38), W(39, 2) + 20, 8)} />
          <Cuts f={g} times={CUTS} seed={2} dur={18} />
          <Transition f={g} at={SWAP1} kind="slice" colors={TCOLS} dur={18} />
          <Transition f={g} at={SWAP2} kind="shutter" colors={TCOLS} dur={18} />
        </>
      }
    />
  );
};
