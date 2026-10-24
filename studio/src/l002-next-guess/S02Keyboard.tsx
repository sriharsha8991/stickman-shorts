import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Stage } from "../stickman/common";
import { FONT } from "../stickman/fx";
import { punch } from "../shared/kit";
import { Letterbox, type Place } from "../shared/camera";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import {
  Act, Arrow, Bg, Big, C, CE, CORAL, CREAM, Cuts, Doc, GOLD, INK, K, MINT, PURPLE, PURPLE_D, Pill, SPARK, SparkHost, Src, T, Tick, W, clamp, contentShift, cutTimes, pop,
  sceneCam, soft, vis,
  CONTENT, type Frame,
} from "./world";

// CH1 · Autocomplete, but huge (0:25–1:10). Phone keyboard suggests "late" after "I'm running" → THE WHOLE TRICK →
// WOW: the keyboard grows into a skyscraper (camera pulls back) → a mountain of text pours in (BOOKS/WEB/CODE/CHAT) →
// the training loop (hide the next bit, guess, check, nudge) → the GPT-4 report quote → "TOKEN?"

const A = C(8);
const B = CE(21);
const CUTS = cutTimes(A, B).filter((t) => Math.abs(t - W(12, 3)) > 40);
const FRAMES: Frame[] = [{ z: 1 }, { z: 1.2, at: CONTENT }, { z: 1.1, at: [960, 500] }, { z: 1.5, at: SPARK }];
const KEYROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export const S02_SFX: SfxCue[] = [
  [C(8) + 2, "pop", 0.4],
  ...Array.from({ length: 11 }, (_, i): SfxCue => [W(9, 1) + i * 2, "tick", 0.18]),
  [W(9, 5), "ding", 0.45],
  [C(10) + 4, "swish", 0.35],
  [W(11, 4), "boing", 0.3],
  [W(12, 3) - 30, "riser", 0.45],
  [W(12, 6), "impact", 0.6],
  [C(13), "whoosh_long", 0.45],
  ...[0, 1, 2, 3].map((i): SfxCue => [W(14, i), "pop", 0.4]),
  [C(15), "page", 0.4],
  [W(16, 0), "buzz", 0.35],
  [W(16, 1), "ding", 0.35],
  [W(16, 3), "clink", 0.4],
  [C(17), "swirl", 0.4],
  [C(18), "stamp", 0.45],
  [C(19), "page", 0.45],
  [C(20), "scribble", 0.4],
  [W(21, 1), "boing", 0.4],
  ...CUTS.map((t): SfxCue => [t - 4, "swish", 0.16]),
];

// phone with a keyboard and a text field
const PhoneKB: React.FC<{ f: number; x: number; y: number; s: number; o: number; typed: string; sugg: number }> = ({ f, x, y, s, o, typed, sugg }) => {
  if (o <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-210} y={-380} width={420} height={760} rx={56} fill={INK} />
      <rect x={-190} y={-350} width={380} height={700} rx={36} fill={CREAM} />
      <rect x={-165} y={-300} width={330} height={90} rx={18} fill="#ffffff" {...K} />
      <text x={-148} y={-240} fontFamily={FONT.body} fontWeight={800} fontSize={40} fill={INK}>
        {typed}
      </text>
      <rect x={-148 + typed.length * 21.5} y={-284} width={6} height={58} fill={PURPLE} opacity={Math.floor(f / 8) % 2} />
      {/* suggestion strip */}
      {["late", "out", "to"].map((w, i) => (
        <g key={w} opacity={sugg} transform={`translate(${-120 + i * 120} -80) scale(${i === 0 ? 1 + 0.12 * sugg : 1})`}>
          <rect x={-55} y={-34} width={110} height={68} rx={16} fill={i === 0 ? GOLD : "#ffffff"} {...K} strokeWidth={4} />
          <text x={0} y={14} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill={INK}>
            {w}
          </text>
        </g>
      ))}
      {KEYROWS.map((row, r) =>
        row.split("").map((ch, i) => (
          <g key={`${r}${i}`} transform={`translate(${-170 + r * 16 + i * 34} ${30 + r * 70})`}>
            <rect x={0} y={0} width={28} height={54} rx={6} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
            <text x={14} y={36} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={20} fill={INK}>
              {ch}
            </text>
          </g>
        )),
      )}
      <rect x={-110} y={250} width={220} height={54} rx={10} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

// the skyscraper keyboard: a tower whose windows are keys
const Tower: React.FC<{ f: number; x: number; rise: number; o: number; glow: number }> = ({ f, x, rise, o, glow }) => {
  if (o <= 0.01) return null;
  const h = 640 * rise;
  const w = 520;
  return (
    <g opacity={o}>
      <rect x={x - w / 2} y={880 - h} width={w} height={h} fill={PURPLE_D} {...K} />
      <clipPath id="l2tower">
        <rect x={x - w / 2} y={880 - h} width={w} height={h} />
      </clipPath>
      <g clipPath="url(#l2tower)">
        {Array.from({ length: 14 }, (_, r) =>
          Array.from({ length: 7 }, (_, i) => {
            const lit = (Math.floor(f / 6) + r * 3 + i * 5) % 9 === 0;
            return (
              <g key={`${r}-${i}`} transform={`translate(${x - w / 2 + 26 + i * 70} ${880 - 60 - r * 54})`}>
                <rect width={54} height={40} rx={6} fill={lit ? GOLD : "#efe6ff"} stroke={INK} strokeWidth={3} />
                <text x={27} y={29} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={20} fill={INK}>
                  {"QWERTYUIOPASDFGHJKLZXCVBNM"[(r * 7 + i) % 26]}
                </text>
              </g>
            );
          }),
        )}
      </g>
      {/* antenna + "next word" beacon */}
      <line x1={x} y1={880 - h} x2={x} y2={880 - h - 90 * rise} stroke={INK} strokeWidth={8} />
      <circle cx={x} cy={880 - h - 100 * rise} r={22 + 14 * glow} fill={GOLD} stroke={INK} strokeWidth={5} />
      <text x={x} y={880 - h - 140 * rise} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={42} fill={PURPLE} opacity={rise}>
        NEXT WORD?
      </text>
    </g>
  );
};

export const S02Keyboard: React.FC<SceneProps> = ({ from }) => {
  const g = from + useCurrentFrame();
  const places: Place[] = [
    { f: A, x: 320, s: 1.45 },
    { f: C(11), x: 340, s: 2.6, e: "snap" },
    { f: C(12), x: 240, s: 1.15 },
    { f: C(15), x: 1600, s: 1.45 },
    { f: C(18), x: 1620, s: 2.3, e: "snap" },
    { f: C(19), x: 1600, s: 1.45 },
    { f: C(21), x: 1580, s: 3.0, e: "snap" },
  ];
  const sh = contentShift(g, places);
  const towerUp = W(12, 3);
  const cam = sceneCam(g, from, CUTS, FRAMES, [
    { f: towerUp - 24, z: 1.7, at: [1150, 520], e: "smooth" },
    { f: towerUp, z: 1, e: "slow" },
    { f: C(14), z: 1.12, at: [1150, 460], e: "smooth" },
  ], places);
  const z = punch(g, [W(9, 5), W(12, 6), C(18), W(21, 1)], 0.04);

  const typed = "I'm running".slice(0, Math.max(0, Math.floor((g - W(9, 1)) / 2)));
  const sugg = soft(g, W(9, 5) - 4, W(9, 5) + 4);
  const phoneO = vis(g, A, towerUp - 2, 8);
  const phoneS = interpolate(g, [towerUp - 24, towerUp], [0.95, 2.4], clamp);
  const rise = soft(g, towerUp - 4, towerUp + 26);
  const towerO = vis(g, towerUp - 4, CE(14) + 6, 8);
  const pour = soft(g, C(13), C(13) + 60);
  const trainO = vis(g, C(15), CE(18), 8);
  const docO = vis(g, C(19), CE(21) + 6, 8);

  const rows: Act[] = [
    [A, "present", "happy"],
    [W(9, 1), "pointDown", "curious"],
    [W(9, 5), "fistPump", "excited", "nod"],
    [C(10), "doublePoint", "thinking"],
    [C(11), "whisper", "wink"],
    [C(12), "presentBoth", "excited", "hop"],
    [C(13), "pointUp", "mindblown"],
    [C(14), "count1", "happy"],
    [W(14, 2), "count2", "excited"],
    [C(15), "pointSide", "curious"],
    [C(16), "thinkChin", "thinking"],
    [W(16, 3), "clap1", "happy", "nod"],
    [C(17), "mindBlown", "shock", "shake"],
    [C(18), "present", "determined"],
    [C(19), "pointSide", "curious"],
    [C(20), "doublePoint", "excited", "nod"],
    [C(21), "recoil", "skeptical", "shake"],
  ];

  return (
    <Stage
      bg={<Bg f={g} kind={g < C(15) ? "lilac" : "paper"} />}
      hits={[W(12, 6) - from, W(21, 1) - from]}
      power={7}
      cam={{ ...cam, z: cam.z * z }}
      svg={
        <>
          <g transform={`translate(${sh} 0)`}>
            <PhoneKB f={g} x={1150} y={470} s={0.95 * pop(g, A) * (phoneS / 0.95)} o={phoneO} typed={typed} sugg={sugg} />
            {/* "what came before → next word" */}
            <g opacity={vis(g, C(10), CE(11), 6)}>
              <Arrow x1={720} y1={140} x2={1060} y2={360} k={soft(g, C(10), C(10) + 14)} color={PURPLE} />
              <Pill x={600} y={110} text="WHAT CAME BEFORE" fill={PURPLE} fs={34} s={pop(g, C(10))} />
              <Pill x={1530} y={330} text="→ NEXT WORD" fill={MINT} color={INK} fs={34} s={pop(g, W(10, 3))} />
            </g>

            {/* WOW: skyscraper keyboard + a mountain of text */}
            <Tower f={g} x={1150} rise={rise} o={towerO} glow={0.5 + 0.5 * Math.sin(g / 5)} />
            <g opacity={towerO * pour}>
              {Array.from({ length: 18 }, (_, i) => {
                const t = (g - C(13) - i * 4) / 40;
                if (t < 0) return null;
                const k = t % 1;
                const sx = 1150 + ((i * 97) % 500) - 250;
                return (
                  <g key={i} transform={`translate(${sx + Math.sin(i + g / 12) * 40} ${-60 + k * 200}) rotate(${(i * 37 + g * 2) % 360})`} opacity={1 - k}>
                    <rect x={-34} y={-44} width={68} height={88} rx={6} fill="#ffffff" stroke={INK} strokeWidth={3} />
                    {[0, 1, 2, 3].map((l) => (
                      <rect key={l} x={-24} y={-30 + l * 18} width={48 - (l % 2) * 14} height={6} fill="#c9c0ad" />
                    ))}
                  </g>
                );
              })}
              {["BOOKS", "WEBSITES", "CODE", "CONVERSATIONS"].map((w, i) => (
                <Pill key={w} x={[760, 1540, 790, 1520][i]} y={[300, 300, 520, 520][i]} text={w} fill={[PURPLE, MINT, GOLD, CORAL][i]} color={i === 0 || i === 3 ? "#ffffff" : INK} fs={38} s={pop(g, W(14, i))} o={vis(g, W(14, i), CE(14) + 4)} />
              ))}
            </g>

            {/* training: hide the next bit, guess, check, nudge, repeat */}
            <g opacity={trainO}>
              <rect x={640} y={190} width={1020} height={140} rx={24} fill="#ffffff" {...K} />
              <T x={700} y={285} fs={84} anchor="start">
                The sky is
              </T>
              <rect x={1080} y={208} width={300} height={104} rx={16} fill={g < W(16, 2) ? PURPLE : "#ffffff"} stroke={INK} strokeWidth={5} />
              <T x={1230} y={285} fs={84} fill={g < W(16, 2) ? "#ffffff" : MINT_D_OR(g)} o={1}>
                {g < W(16, 2) ? "???" : "blue"}
              </T>
              <g opacity={vis(g, W(16, 0), CE(18))}>
                <Pill x={860} y={460} text="GUESS: green" fill={CREAM} color={INK} fs={42} s={pop(g, W(16, 0))} />
                <path d="M 1050 420 L 1110 500 M 1110 420 L 1050 500" stroke={CORAL} strokeWidth={14} strokeLinecap="round" opacity={g >= W(16, 1) ? 1 : 0} />
                <Tick x={1240} y={460} f={g} at={W(16, 1) + 4} s={0.8} />
              </g>
              {/* the nudge knob */}
              <g transform={`translate(1500 470) scale(${pop(g, W(16, 3))})`} opacity={g >= W(16, 3) ? 1 : 0}>
                <circle r={70} fill={GOLD} {...K} />
                <line x1={0} y1={0} x2={0} y2={-60} stroke={INK} strokeWidth={10} strokeLinecap="round" transform={`rotate(${interpolate(g, [W(16, 3), W(16, 3) + 10], [-20, -8], clamp) + (g > C(17) ? (g - C(17)) * 9 : 0)})`} />
                <T x={0} y={120} fs={34}>
                  NUDGE
                </T>
              </g>
              {/* over and over */}
              <g opacity={vis(g, C(17), CE(18))} transform={`translate(1150 600)`}>
                <circle r={90} fill="none" stroke={PURPLE} strokeWidth={16} strokeDasharray="420 150" transform={`rotate(${(g - C(17)) * 14})`} />
                <T x={0} y={22} fs={64} fill={PURPLE}>
                  ↻
                </T>
                <T x={0} y={140} fs={44} o={soft(g, C(17) + 10, C(17) + 20)}>
                  {g < C(18) ? "AGAIN · AGAIN · AGAIN" : "TRAINING = PRACTICE AT THE NEXT BIT"}
                </T>
              </g>
            </g>

            {/* the GPT-4 report */}
            <g opacity={docO}>
              <Doc x={1150} y={470} w={760} title={["GPT-4 Technical Report"]} year="OpenAI · 2023" quote={["“pre-trained to predict", "the next token”"]} hl={soft(g, C(20), C(20) + 40)} s={pop(g, C(19)) * 0.95} r={-2} />
              <g opacity={vis(g, W(21, 1), CE(21) + 6)}>
                <circle cx={1310} cy={680} r={110 * pop(g, W(21, 1))} fill="none" stroke={CORAL} strokeWidth={12} />
              </g>
            </g>
          </g>
          <SparkHost f={g} rows={rows} places={places} bulbs={[W(11, 1), W(20, 4)]} />
        </>
      }
      html={
        <>
          <Big f={g} at={W(11, 2)} out={C(12) - 4} x={1150} y={170} size={110} color={GOLD} r={-2}>
            THAT'S THE WHOLE TRICK
          </Big>
          <Big f={g} at={W(21, 1)} out={CE(21) + 6} x={760} y={170} size={150} color={CORAL} r={3}>
            TOKEN?
          </Big>
          <Src f={g} at={C(19)} out={CE(21)}>
            OpenAI, GPT-4 Technical Report (2023), arXiv:2303.08774
          </Src>
          <Letterbox k={vis(g, towerUp - 24, CE(12), 8)} />
          <Cuts f={g} times={CUTS} seed={1} />
        </>
      }
    />
  );
};

const MINT_D_OR = (g: number) => (g > 0 ? "#14a37a" : INK);
