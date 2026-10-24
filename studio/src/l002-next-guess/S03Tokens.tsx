import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import type { Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Bg, Big, Brick, C, CE, CORAL, Cuts, GOLD, INK, K, MINT, NIGHT, Note, PURPLE, Pill, SPARK, SparkHost, Src, T, W, clamp, contentShift, cutTimes, pop, sceneCam, soft, vis,
  CONTENT, type Frame,
} from "./world";

// CH2 · It reads chunks (1:10–1:59). WORDS ✗ → a sentence on a conveyor gets CHOPPED into token bricks (wow) →
// whole words vs pieces → 1 token ≈ 4 chars ≈ ¾ word, 100 tokens ≈ 75 words (OpenAI Help) → bricks flip to numbers,
// the model only sees numbers → strawberry callback: str | aw | berry, the r's hide inside.

const A = C(22);
const B = CE(36);
const CUTS = cutTimes(A, B);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.45, at: SPARK }, { z: 1.1, at: [960, 480] }];
const PIECES = [
  { t: "The", whole: true, id: "791" },
  { t: "cat", whole: true, id: "8415" },
  { t: "sat", whole: true, id: "7731" },
  { t: "un", whole: false, id: "359" },
  { t: "believ", whole: false, id: "32898" },
  { t: "ably", whole: false, id: "2603" },
  { t: "still", whole: true, id: "2928" },
];

export const S03_SFX: SfxCue[] = [
  [W(22, 2), "stinger", 0.4],
  [W(23, 3), "buzz", 0.35],
  [C(24), "whoosh", 0.4],
  [W(24, 3), "slam", 0.6],
  ...PIECES.map((_, i): SfxCue => [W(24, 3) + 4 + i * 3, "pop", 0.32]),
  [W(25, 1), "ding", 0.35],
  [W(25, 6), "boing", 0.3],
  [W(26, 6), "impact", 0.5],
  [C(27), "pop", 0.4],
  [C(28), "tick", 0.3],
  [W(28, 6), "kaching", 0.4],
  [C(29), "swirl", 0.45],
  [C(30), "buzz", 0.3],
  [C(31), "boing", 0.4],
  [W(32, 4), "slam", 0.55],
  [C(33), "freeze", 0.4],
  [C(34), "stamp", 0.4],
  [C(35), "pop", 0.35],
  [C(36), "whoosh_long", 0.4],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

const Strawberry: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) =>
  o <= 0.01 || s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M 0 150 C -150 60 -140 -80 -60 -90 C -30 -95 -10 -85 0 -80 C 10 -85 30 -95 60 -90 C 140 -80 150 60 0 150 Z" fill="#ff4b5c" {...K} />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx={-70 + (i % 4) * 46 + (Math.floor(i / 4) % 2) * 20} cy={-40 + Math.floor(i / 4) * 55} rx={6} ry={10} fill={GOLD} />
      ))}
      <path d="M -70 -90 L -20 -120 L 0 -150 L 20 -120 L 70 -90 L 20 -100 L 0 -85 L -20 -100 Z" fill="#2fa84f" {...K} />
    </g>
  );

export const S03Tokens: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 1600, s: 1.45 },
    { f: C(22), x: 1580, s: 2.8, e: "snap" },
    { f: C(24), x: 1620, s: 1.45 },
    { f: C(29), x: 300, s: 1.45 },
    { f: C(31), x: 330, s: 2.6, e: "snap" },
    { f: C(33), x: 300, s: 1.45 },
    { f: C(36), x: 1600, s: 1.45 },
  ];
  const sh = contentShift(g, places);
  const chop = W(24, 3);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: chop - 2, z: 1.35, at: [1150, 560], e: "snap" },
    { f: chop + 30, z: 1, e: "smooth" },
    { f: W(26, 4), z: 1.18, at: [1100, 420], e: "snap" },
  ], places);
  const z = punch(g, [chop, W(26, 4), W(28, 6), W(32, 4)], 0.045);

  // conveyor of pieces: joined → chopped (gaps open) → flipped to numbers
  const gap = soft(g, chop, chop + 12);
  const flip = soft(g, C(29), C(29) + 16);
  const colour = soft(g, W(25, 1), W(25, 1) + 8);
  const rowO = vis(g, C(24), CE(30), 8);
  const widths = PIECES.map((p) => Math.max(90, p.t.length * 46 * 0.52 + 44));
  const total = widths.reduce((a, b) => a + b, 0) + gap * 22 * (PIECES.length - 1);
  let cx = 1150 - total / 2;
  const slide = interpolate(g, [C(24), chop - 4], [500, 0], clamp);

  const strawO = vis(g, C(31), CE(35), 8);
  const split = soft(g, W(32, 4), W(32, 4) + 12);

  const rows: Act[] = [
    [A, "whisper", "curious"],
    [C(23), "stop", "skeptical", "shake"],
    [C(24), "pointSide", "excited"],
    [W(24, 3), "recoil", "shock"],
    [C(25), "presentBoth", "happy"],
    [C(26), "count1", "thinking"],
    [C(27), "thinkChin", "curious"],
    [C(28), "fistPump", "excited", "nod"],
    [C(29), "pointSide", "curious"],
    [C(30), "armsCrossed", "skeptical"],
    [C(31), "leanIn", "wink"],
    [W(32, 4), "pointDown", "excited"],
    [C(33), "facepalm", "laugh"],
    [C(34), "shrugBig", "neutral"],
    [C(35), "handsHips", "determined", "nod"],
    [C(36), "pointUp", "excited", "hop"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind={g < C(29) ? "grid" : "lilac"} />}
      hits={[chop - from, W(32, 4) - from]}
      power={8}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            {/* WORDS ✗ */}
            <g opacity={vis(g, C(23), C(24) + 6)} transform={`translate(1150 420) scale(${pop(g, C(23))})`}>
              <T x={0} y={40} fs={170}>
                WORDS
              </T>
              <line x1={-280} y1={-10} x2={280} y2={-10} stroke={CORAL} strokeWidth={26} strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - soft(g, W(23, 3), W(23, 3) + 8))} />
            </g>

            {/* the conveyor */}
            <g opacity={rowO}>
              <rect x={600} y={640} width={1100} height={36} rx={18} fill={INK} />
              {Array.from({ length: 12 }, (_, i) => (
                <circle key={i} cx={630 + i * 95} cy={658} r={10} fill={MINT} transform={`rotate(${g * 8} ${630 + i * 95} 658)`} />
              ))}
              {PIECES.map((p, i) => {
                const w = widths[i];
                const x = cx + w / 2 + slide;
                cx += w + gap * 22;
                const col = interpolate(colour, [0, 1], [0, 1]) > 0.5 ? (p.whole ? PURPLE : MINT) : PURPLE;
                const label = flip > 0.5 ? p.id : p.t;
                return (
                  <g key={i} transform={`translate(${x} 0) scale(${flip > 0 ? Math.abs(Math.cos(flip * Math.PI)) : 1} 1) translate(${-x} 0)`}>
                    <Brick x={x} y={590 - gap * (i % 2 ? 18 : 6)} text={label} color={flip > 0.5 ? GOLD : col} w={flip > 0.5 ? undefined : w} r={gap * (i % 2 ? 4 : -3) * (1 - soft(g, chop + 12, chop + 30))} />
                  </g>
                );
              })}
              {/* the cleaver */}
              <g transform={`translate(1150 ${interpolate(g, [chop - 10, chop, chop + 20], [-300, 470, -300], clamp)})`}>
                <rect x={-120} y={-80} width={240} height={150} rx={10} fill="#cfd6dc" {...K} />
                <rect x={-30} y={-200} width={60} height={130} rx={10} fill="#7a4a2a" {...K} />
              </g>
              <Pill x={900} y={380} text="WHOLE WORDS" fill={PURPLE} fs={36} s={pop(g, W(25, 1))} o={vis(g, W(25, 1), CE(25) + 4)} />
              <Pill x={1420} y={380} text="PIECES" fill={MINT} color={INK} fs={36} s={pop(g, W(25, 6))} o={vis(g, W(25, 6), CE(25) + 4)} />
            </g>

            {/* the rules of thumb */}
            <g opacity={vis(g, C(26), CE(28), 8)}>
              <g transform={`translate(1150 300) scale(${pop(g, W(26, 2))})`}>
                <T x={0} y={0} fs={110} fill={PURPLE} stroke>
                  {g < C(27) ? "1 TOKEN ≈ 4 CHARACTERS" : g < C(28) ? "≈ ¾ OF A WORD" : ""}
                </T>
              </g>
              {g >= C(27) && g < C(28) && (
                <g transform={`translate(1150 430) scale(${pop(g, C(27))})`}>
                  <circle r={110} fill="#ffffff" {...K} />
                  <path d={`M 0 0 L 0 -110 A 110 110 0 1 1 -110 0 Z`} fill={MINT} {...K} />
                </g>
              )}
              {g >= C(28) && (
                <g transform={`translate(1150 360)`}>
                  {[0, 1].map((i) => {
                    const v = Math.round(interpolate(g, [C(28) + 6, W(28, 6)], [0, i ? 75 : 100], clamp));
                    return (
                      <g key={i} transform={`translate(${i ? 260 : -260} 0) scale(${pop(g, C(28) + i * 8)})`}>
                        <rect x={-220} y={-120} width={440} height={240} rx={30} fill={i ? MINT : PURPLE} {...K} />
                        <T x={0} y={20} fs={120} fill={i ? INK : "#ffffff"}>
                          {v}
                        </T>
                        <T x={0} y={90} fs={46} fill={i ? INK : "#ffffff"}>
                          {i ? "WORDS" : "TOKENS"}
                        </T>
                      </g>
                    );
                  })}
                  <T x={0} y={30} fs={110} o={soft(g, W(28, 3), W(28, 3) + 6)}>
                    ≈
                  </T>
                </g>
              )}
            </g>

            {/* the model only sees numbers */}
            <g opacity={vis(g, C(30), CE(30) + 6)} transform={`translate(1150 400) scale(${pop(g, C(30))})`}>
              <rect x={-170} y={-130} width={340} height={200} rx={30} fill={NIGHT} {...K} />
              <circle cx={0} cy={-30} r={60} fill="#ffffff" {...K} />
              <circle cx={Math.sin(g / 8) * 20} cy={-30} r={26} fill={PURPLE} />
              <T x={0} y={50} fs={36} fill="#ffffff">
                THE MODEL
              </T>
            </g>

            {/* strawberry callback */}
            <g opacity={strawO}>
              <Strawberry x={1150} y={420} s={pop(g, C(31)) * (1 - split)} o={1 - split} />
              {["str", "aw", "berry"].map((t, i) => (
                <Brick key={t} x={1150 + (i - 1) * 260 * split} y={460} text={t} color={[CORAL, PURPLE, MINT][i]} s={split} fs={64} w={[170, 140, 230][i]} glow={vis(g, C(33), CE(33)) * 0.6} />
              ))}
              {/* hidden r's */}
              <g opacity={vis(g, C(33), CE(34))}>
                {[[-260, 0], [260, -20], [260, 20]].map(([dx, dy], i) => (
                  <T key={i} x={1150 + dx + (i === 2 ? 40 : i === 1 ? -40 : 0)} y={460 - 70 + dy} fs={52} fill={CORAL} o={0.45 + 0.4 * Math.sin(g / 5 + i)}>
                    r
                  </T>
                ))}
                <Pill x={1150} y={640} text="THE R'S HIDE INSIDE THE CHUNKS" fill={GOLD} color={INK} fs={38} s={pop(g, C(33))} />
              </g>
              <Pill x={1150} y={250} text="ONE REASON · NOT THE ONLY ONE" fill={INK} fs={40} s={pop(g, C(34))} o={vis(g, C(34), CE(35))} />
            </g>

            {/* "now watch it write": a typewriter peeks in */}
            <g opacity={vis(g, C(36), B + 20)} transform={`translate(1150 ${interpolate(g, [C(36), C(36) + 16], [900, 560], clamp)})`}>
              <rect x={-300} y={-120} width={600} height={240} rx={40} fill={PURPLE} {...K} />
              <rect x={-220} y={-260} width={440} height={160} rx={8} fill="#ffffff" {...K} />
              <T x={0} y={-160} fs={60} font={FONT.body} weight={800}>
                The cat sat…
              </T>
              {Array.from({ length: 10 }, (_, i) => (
                <circle key={i} cx={-240 + i * 53} cy={40} r={20} fill={CREAMISH} {...K} strokeWidth={3} />
              ))}
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(26, 4), W(33, 3)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(22, 2)} out={C(23) - 2} x={760} y={200} size={130} color={GOLD} r={-3}>
            SURPRISE #1
          </Big>
          <Big f={g} at={chop} out={chop + 50} x={960} y={190} size={140} color={MINT} r={2}>
            CHOP!
          </Big>
          <Big f={g} at={C(29) + 8} out={CE(30)} x={1150 + (g < C(30) ? 0 : 0)} y={180} size={96} color={GOLD}>
            EVERY CHUNK → A NUMBER
          </Big>
          <Note f={g} at={C(24)} out={CE(25)}>
            Illustration: real splits vary by tokenizer
          </Note>
          <Note f={g} at={C(29)} out={CE(30)}>
            Illustrative ID numbers
          </Note>
          <Src f={g} at={C(26)} out={CE(28)}>
            OpenAI Help Center, “What are tokens?” (English text)
          </Src>
          <Src f={g} at={C(32)} out={CE(34)}>
            GPT-4 tokenizer (cl100k) split · Zhang et al. 2024, arXiv:2410.19730
          </Src>
          <Cuts f={g} times={CUTS} seed={2} />
        </>
      }
    />
  );
};

const CREAMISH = "#f6efe0";
