import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V026 · "Only 2 left!" (Designed to get you, ~31 s)
// World A: a night-market gift shop: indigo night, string lights, a red neon sign ONLY 2 LEFT! over a tiny cubby
// holding exactly two magenta gift boxes. Behind it, a purple roller shutter. Spark panics, wallet in hand.
// Iris → World B: a 1970s test kitchen (peach wallpaper, avocado counter): two glass jars, 10 cookies vs 2, hearts
// float over the jar people want. A hand grabs 8 cookies out of jar A (10 → 2) and its hearts double.
// Back in the shop: the shutter rolls up on a full warehouse (the wow), a giant rubber stamp ✗ hits the sign
// (false urgency), the sun rises, the sign still says 2, Spark puts his wallet away. Loops into frame 0.
// Sources: Worchel, Lee & Adewole 1975 (JPSP 32:906); CCPA Guidelines for Prevention and Regulation of Dark Patterns 2023.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 197;
const SX = 290; // Spark in the shop
const LX = 190; // Spark in the lab

// palette: night market (A) + 1970s test kitchen (B)
const NIGHT = "#1b1645";
const NIGHT2 = "#2a2266";
const DAWN = "#ffc9a3";
const DAY = "#9fd8ff";
const NEON = "#ff2e4d";
const MAGENTA = "#e0338f";
const MAG2 = "#a61f68";
const PURPLE = "#5b2a86";
const PURPLE2 = "#47206b";
const AMBER = "#ffb347";
const GOLD = "#ffd23f";
const CREAM = "#fff6e6";
const WOOD = "#b57a48";
const WOOD2 = "#7d4f2b";
const PEACH = "#ffd9b8";
const MUSTARD = "#e8b23a";
const AVOCADO = "#8aa14a";
const AVO2 = "#66792f";
const COOKIE = "#c98a4b";
const CHIP = "#4a2a14";
const GLASS = "#e9f6ff";
const ORANGE = "#ff8c42";
const SHOPKEEP = "#9b6bd6";
const RED = "#d7263d";
const INK = COL.ink;

const T = {
  two0: W(0, 1),
  brain: W(0, 4),
  panicked: W(0, 6),
  c1: C(1),
  overpay: W(1, 4),
  ten1: W(1, 6),
  lab: C(2),
  ten2: W(2, 2),
  jar2: W(2, 6),
  c3: C(3),
  c4: C(4),
  wanted: W(4, 1),
  two4: W(4, 3),
  c5: C(5),
  changed: W(5, 1),
  count: W(5, 4),
  c6: C(6),
  dropped: W(6, 2),
  two6: W(6, 4),
  c7: C(7),
  even: W(7, 3),
  more7: W(7, 4),
  shop: C(8),
  trick: W(8, 3),
  c9: C(9),
  fake: W(9, 6),
  c10: C(10),
  bans: W(10, 3),
  c11: C(11),
  falseW: W(11, 2),
  c12: C(12),
  tomorrow: W(12, 3),
  c13: C(13),
  never: W(13, 4),
  hurry: W(13, 7),
  c14: C(14),
  see: W(14, 3),
};
const LOOP = VOICE_FRAMES - 14;
const LAB0 = T.lab;
const LAB1 = T.shop;
const ROLL0 = T.c9 + 2; // shutter rolls up
const ROLL1 = T.fake;
const CLOSE0 = T.c12; // next day: shutter back down
const CLOSE1 = T.c12 + 16;
const GRAB = T.dropped - 4; // hand dips into jar A

const SHOTS: Shot[] = [
  { f: 0, z: 1.25, at: [600, 860], e: "cut" }, // frame 0: sign + Spark + two boxes
  { f: T.panicked - 4, z: 2.0, at: [SX + 20, HEADY], e: "snap" }, // CU: "…just panicked."
  { f: T.c1, z: 1.4, at: [400, 980], e: "cut" }, // MED: wallet
  { f: T.overpay - 2, z: 1.85, at: [400, 1010], e: "snap" }, // INSERT: coins fly out
  { f: T.ten1 - 2, z: 1.75, at: [SX + 20, HEADY - 70], e: "snap" }, // CU: stopwatch over his head
  { f: LAB0, z: 1.0, at: [540, 960], e: "cut" }, // iris → WIDE lab
  { f: T.ten2 - 2, z: 1.65, at: [560, 930], e: "snap" }, // INSERT jar A (10)
  { f: T.c3, z: 1.65, at: [860, 930], e: "cut" }, // INSERT jar B (2)
  { f: T.c4, z: 1.2, at: [700, 880], e: "cut" }, // MED: hearts
  { f: T.two4, z: 1.45, at: [860, 820], e: "snap" },
  { f: T.c5, z: 2.0, at: [LX + 20, HEADY], e: "cut" }, // CU Spark
  { f: T.changed + 2, z: 1.6, at: [710, 680], e: "snap" }, // INSERT magnifier
  { f: T.c6, z: 1.05, at: [600, 900], e: "cut" }, // WIDE: the hand
  { f: T.dropped - 2, z: 1.6, at: [560, 880], e: "snap" }, // INSERT jar A 10 → 2
  { f: T.c7, z: 2.0, at: [LX + 20, HEADY], e: "cut" }, // CU: "They wanted it even more."
  { f: T.even - 2, z: 1.3, at: [600, 800], e: "snap" }, // MED: hearts double
  { f: LAB1, z: 1.0, at: [540, 960], e: "cut" }, // back in the shop, WIDE
  { f: T.trick - 3, z: 1.5, at: [880, 930], e: "snap" }, // MED shopkeeper
  { f: T.c9, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: shutter rolls up (wow)
  { f: T.c9 + 4, z: 1.12, at: [720, 900], e: "slow" },
  { f: T.c10, z: 1.95, at: [SX + 20, HEADY], e: "cut" }, // CU Spark
  { f: T.bans - 4, z: 1.6, at: [640, 470], e: "snap" }, // INSERT sign + stamp
  { f: T.c11, z: 1.6, at: [380, 1020], e: "cut" }, // MED: FALSE URGENCY
  { f: T.c12, z: 1.0, at: [540, 900], e: "cut" }, // WIDE: sunrise
  { f: T.c13, z: 1.6, at: [640, 480], e: "cut" }, // INSERT: sign still says 2
  { f: T.never - 2, z: 1.4, at: [380, 960], e: "snap" }, // MED: wallet goes away
  { f: T.c14, z: 2.05, at: [SX + 20, HEADY], e: "cut" }, // CU: the comment question
  { f: LOOP, z: 1.25, at: [600, 860], e: "cut" }, // back into frame 0
];

// --- props ------------------------------------------------------------------------------------------------------
const GiftBox: React.FC<{ x: number; y: number; s?: number; col?: string }> = ({ x, y, s = 1, col = MAGENTA }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-42} y={-78} width={84} height={78} rx={6} fill={col} {...K} strokeWidth={5} />
    <rect x={-48} y={-92} width={96} height={20} rx={5} fill={col === MAGENTA ? MAG2 : col} {...K} strokeWidth={5} />
    <rect x={-7} y={-92} width={14} height={92} fill={GOLD} stroke={INK} strokeWidth={3} />
    <path d="M 0 -92 C -26 -122 -40 -96 0 -92 C 40 -96 26 -122 0 -92" fill={GOLD} stroke={INK} strokeWidth={4} />
  </g>
);

const Cookie: React.FC<{ x: number; y: number; s?: number; r?: number }> = ({ x, y, s = 1, r = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <circle r={30} fill={COOKIE} stroke={INK} strokeWidth={4} />
    <circle cx={-10} cy={-8} r={5} fill={CHIP} />
    <circle cx={11} cy={-3} r={4.5} fill={CHIP} />
    <circle cx={-2} cy={12} r={5} fill={CHIP} />
    <circle cx={14} cy={14} r={3.5} fill={CHIP} />
  </g>
);

const HeartIcon: React.FC<{ x: number; y: number; k: number; col?: string }> = ({ x, y, k, col = NEON }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k * 1.5})`}>
      <path d="M 0 22 C -40 -6 -30 -38 0 -18 C 30 -38 40 -6 0 22 Z" fill={col} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    </g>
  ) : null;

const Wallet: React.FC<{ open: number }> = ({ open }) => (
  <g>
    <rect x={-34} y={-24} width={68} height={48} rx={8} fill={WOOD2} {...K} strokeWidth={4} />
    <g transform={`translate(0 -24) rotate(${-open * 55}) translate(0 24)`}>
      <rect x={-34} y={-24} width={68} height={24} rx={6} fill={WOOD} {...K} strokeWidth={4} />
    </g>
    <circle cx={22} cy={4} r={6} fill={GOLD} stroke={INK} strokeWidth={3} />
  </g>
);

const Coin: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <ellipse rx={22} ry={22} fill={GOLD} stroke={INK} strokeWidth={4} />
    <text y={10} textAnchor="middle" fontFamily={FONT.comic} fontSize={28} fill={INK}>
      ₹
    </text>
  </g>
);

const Stopwatch: React.FC<{ x: number; y: number; k: number; a: number }> = ({ x, y, k, a }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-12} y={-82} width={24} height={20} rx={4} fill={GOLD} {...K} strokeWidth={4} />
      <circle r={62} fill={CREAM} {...K} />
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={0} y1={-50} x2={0} y2={-40} stroke={INK} strokeWidth={4} transform={`rotate(${i * 36})`} />
      ))}
      <path d={`M 0 0 L 0 -48 A 48 48 0 ${a > 180 ? 1 : 0} 1 ${48 * Math.sin((a * Math.PI) / 180)} ${-48 * Math.cos((a * Math.PI) / 180)} Z`} fill={NEON} opacity={0.35} />
      <line x1={0} y1={0} x2={0} y2={-46} stroke={RED} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a})`} />
      <circle r={7} fill={INK} />
    </g>
  ) : null;

// --- world A: night-market shop -------------------------------------------------------------------------------------
const WALL_X0 = 560;
const WALL_X1 = 1020;
const WALL_Y0 = 560;
const CUBBY_Y = 1060; // plank the two boxes stand on
const SIGN_Y = 430;

const Shop: React.FC<{ f: number; day: number; roll: number; signRot: number; stampMark: number; signSq: number }> = ({ f, day, roll, signRot, stampMark, signSq }) => {
  const sky = day > 0.01 ? (day < 0.5 ? DAWN : DAY) : NIGHT;
  return (
    <g>
      <rect width={1080} height={1920} fill={NIGHT} />
      <rect width={1080} height={1920} fill={DAWN} opacity={interpolate(day, [0, 0.5, 1], [0, 1, 0])} />
      <rect width={1080} height={1920} fill={DAY} opacity={interpolate(day, [0.5, 1], [0, 1], clamp)} />
      {sky === NIGHT &&
        Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={(i * 211) % 1080} cy={60 + ((i * 97) % 200)} r={i % 3 === 0 ? 4 : 2.5} fill="#fff" opacity={0.4 + 0.4 * Math.abs(Math.sin(f / 13 + i))} />
        ))}
      {/* moon sets, sun rises */}
      <circle cx={150} cy={interpolate(day, [0, 0.5], [190, 420], clamp)} r={56} fill="#fff4c2" opacity={1 - day} stroke={INK} strokeWidth={4} />
      <circle cx={930} cy={interpolate(day, [0.2, 1], [560, 170], clamp)} r={70} fill={GOLD} opacity={interpolate(day, [0.1, 0.4], [0, 1], clamp)} stroke={INK} strokeWidth={5} />
      {/* back street wall */}
      <rect x={0} y={520} width={1080} height={GROUND - 520} fill={NIGHT2} opacity={1 - day * 0.6} />
      <rect x={0} y={520} width={1080} height={GROUND - 520} fill="#f3d9c2" opacity={day * 0.75} />
      {Array.from({ length: 9 }, (_, r) => (
        <line key={r} x1={0} y1={560 + r * 84} x2={WALL_X0} y2={560 + r * 84} stroke={INK} strokeWidth={2} opacity={0.18} />
      ))}
      {/* string lights */}
      <path d="M -20 250 Q 270 330 540 260 Q 810 330 1100 250" fill="none" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 11 }, (_, i) => {
        const x = -20 + i * 112;
        const half = x < 540 ? 0 : 1;
        const u = half === 0 ? (x + 20) / 560 : (x - 540) / 560;
        const y = half === 0 ? (1 - u) ** 2 * 250 + 2 * u * (1 - u) * 330 + u * u * 260 : (1 - u) ** 2 * 260 + 2 * u * (1 - u) * 330 + u * u * 250;
        const on = (Math.floor(f / 8) + i) % 3 !== 0;
        return <circle key={i} cx={x} cy={y + 16} r={11} fill={[AMBER, MAGENTA, GOLD][i % 3]} stroke={INK} strokeWidth={3} opacity={on ? 1 : 0.45} />;
      })}
      {/* warehouse behind the shutter */}
      <rect x={WALL_X0} y={WALL_Y0} width={WALL_X1 - WALL_X0} height={GROUND - WALL_Y0} fill="#2b1a3f" {...K} />
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => <GiftBox key={`${r}-${c}`} x={WALL_X0 + 52 + c * 90} y={GROUND - 4 - r * 112} s={0.95} col={(r + c) % 4 === 0 ? MAG2 : MAGENTA} />),
      )}
      {/* roller shutter */}
      <defs>
        <clipPath id="v026-wall">
          <rect x={WALL_X0} y={WALL_Y0} width={WALL_X1 - WALL_X0} height={GROUND - WALL_Y0} />
        </clipPath>
      </defs>
      <g clipPath="url(#v026-wall)">
        <g transform={`translate(0 ${-roll * (GROUND - WALL_Y0)})`}>
          <rect x={WALL_X0} y={WALL_Y0} width={WALL_X1 - WALL_X0} height={GROUND - WALL_Y0} fill={PURPLE} />
          {Array.from({ length: 18 }, (_, i) => (
            <line key={i} x1={WALL_X0} y1={WALL_Y0 + 20 + i * 42} x2={WALL_X1} y2={WALL_Y0 + 20 + i * 42} stroke={PURPLE2} strokeWidth={8} />
          ))}
          <rect x={WALL_X0 + 200} y={GROUND - 40} width={60} height={16} rx={6} fill={INK} />
        </g>
      </g>
      <rect x={WALL_X0} y={WALL_Y0} width={WALL_X1 - WALL_X0} height={GROUND - WALL_Y0} fill="none" {...K} />
      <rect x={WALL_X0 - 14} y={WALL_Y0 - 30} width={WALL_X1 - WALL_X0 + 28} height={36} rx={8} fill={PURPLE2} {...K} />
      {/* the tiny cubby with two boxes (in front) */}
      <rect x={640} y={CUBBY_Y} width={300} height={22} rx={4} fill={WOOD} {...K} />
      <rect x={650} y={CUBBY_Y + 22} width={18} height={GROUND - CUBBY_Y - 22} fill={WOOD2} {...K} strokeWidth={4} />
      <rect x={912} y={CUBBY_Y + 22} width={18} height={GROUND - CUBBY_Y - 22} fill={WOOD2} {...K} strokeWidth={4} />
      <GiftBox x={735} y={CUBBY_Y} />
      <GiftBox x={850} y={CUBBY_Y} />
      {/* the neon sign */}
      <line x1={420} y1={250} x2={420} y2={SIGN_Y - 70} stroke={INK} strokeWidth={5} />
      <line x1={860} y1={250} x2={860} y2={SIGN_Y - 70} stroke={INK} strokeWidth={5} />
      <g transform={`translate(640 ${SIGN_Y}) rotate(${signRot}) scale(${1 / signSq} ${signSq})`}>
        <rect x={-372} y={-82} width={744} height={164} rx={22} fill={NEON} opacity={0.25 + 0.15 * Math.abs(Math.sin(f / 5))} transform="scale(1.06 1.12)" />
        <rect x={-360} y={-76} width={720} height={152} rx={20} fill={NEON} {...K} strokeWidth={7} />
        <rect x={-342} y={-60} width={684} height={120} rx={14} fill="none" stroke="#fff" strokeWidth={4} opacity={(Math.floor(f / 6) % 5 === 0) ? 0.3 : 0.9} />
        <text y={36} textAnchor="middle" fontFamily={FONT.comic} fontSize={104} fill="#fff" stroke={INK} strokeWidth={4} paintOrder="stroke fill">
          ONLY 2 LEFT!
        </text>
        {stampMark > 0.01 && (
          <g opacity={stampMark} transform="rotate(-10)">
            <circle r={118} fill="none" stroke={RED} strokeWidth={18} />
            <path d="M -70 -70 L 70 70 M 70 -70 L -70 70" stroke={RED} strokeWidth={22} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* pavement */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#3a3270" />
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#c9b8a6" opacity={day} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={i * 170} y1={GROUND} x2={i * 170 - 80} y2={1920} stroke={INK} strokeWidth={3} opacity={0.25} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    </g>
  );
};

// --- world B: 1970s test kitchen ------------------------------------------------------------------------------------
const TABLE_Y = 1080;
const JA = 560;
const JB = 860;
const JAR_W = 190;
const JAR_H = 250;
// cookie slots inside a jar (bottom up)
const SLOTS: [number, number][] = [
  [-50, -32], [0, -30], [50, -32],
  [-28, -86], [26, -84],
  [-52, -138], [2, -140], [52, -136],
  [-24, -192], [30, -190],
];

const Jar: React.FC<{ x: number; n: number; out?: number[] }> = ({ x, n, out = [] }) => (
  <g>
    <rect x={x - JAR_W / 2 - 6} y={TABLE_Y - JAR_H - 34} width={JAR_W + 12} height={30} rx={8} fill={MUSTARD} {...K} strokeWidth={5} />
    <rect x={x - JAR_W / 2} y={TABLE_Y - JAR_H} width={JAR_W} height={JAR_H} rx={28} fill={GLASS} opacity={0.55} {...K} />
    {SLOTS.slice(0, n).map(([dx, dy], i) =>
      out.includes(i) ? null : <Cookie key={i} x={x + dx} y={TABLE_Y + dy - 8} r={(i * 47) % 360} s={0.92} />,
    )}
    <rect x={x - JAR_W / 2 + 18} y={TABLE_Y - JAR_H + 20} width={16} height={JAR_H - 60} rx={8} fill="#fff" opacity={0.7} />
  </g>
);

const Kitchen: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect width={1080} height={1920} fill={PEACH} />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={i * 130 - 20} y={0} width={46} height={TABLE_Y} fill={MUSTARD} opacity={0.28} />
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <circle key={i} cx={i * 130 + 45} cy={330 + (i % 2) * 70} r={18} fill={ORANGE} opacity={0.35} />
    ))}
    {/* wall clock */}
    <g transform="translate(860 400)">
      <circle r={70} fill={CREAM} {...K} />
      <line x1={0} y1={0} x2={0} y2={-48} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${f * 6})`} />
      <line x1={0} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={7} strokeLinecap="round" />
    </g>
    {/* counter */}
    <rect x={330} y={TABLE_Y} width={760} height={34} rx={6} fill={AVOCADO} {...K} />
    <rect x={350} y={TABLE_Y + 34} width={720} height={GROUND - TABLE_Y - 34} fill={AVO2} {...K} />
    {Array.from({ length: 4 }, (_, i) => (
      <rect key={i} x={370 + i * 175} y={TABLE_Y + 60} width={150} height={GROUND - TABLE_Y - 90} rx={8} fill={AVOCADO} opacity={0.6} stroke={INK} strokeWidth={3} />
    ))}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#c46a3a" />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={i * 140} y={GROUND} width={70} height={1920 - GROUND} fill="#a9552b" />
    ))}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [0, "buzz", 0.25],
  [T.two0, "ding", 0.35],
  [T.brain - 2, "whoosh", 0.3],
  [T.panicked, "boing", 0.35],
  [T.c1, "swish", 0.25],
  [T.overpay, "kaching", 0.5],
  [T.overpay + 4, "clink", 0.35],
  [T.overpay + 9, "clink", 0.3],
  [T.ten1, "tick", 0.4],
  [T.ten1 + 8, "tick", 0.35],
  [T.ten1 + 16, "tick", 0.35],
  [LAB0 - 6, "whoosh_long", 0.45],
  ...Array.from({ length: 10 }, (_, i): SfxCue => [T.ten2 + i * 3, "pop", 0.22]),
  [T.c3, "whoosh", 0.25],
  [T.c3 + 4, "pop", 0.4],
  [T.c3 + 9, "pop", 0.4],
  [T.wanted, "ding", 0.35],
  [T.two4, "ding", 0.45],
  [T.c5, "whoosh", 0.25],
  [T.changed + 2, "swish", 0.3],
  [T.count, "pop", 0.35],
  [T.c6, "swish", 0.25],
  [GRAB, "whoosh", 0.35],
  [T.dropped + 4, "swirl", 0.4],
  [T.c7, "whoosh", 0.25],
  [T.even, "stinger", 0.5],
  [T.even + 2, "ding", 0.45],
  [LAB1, "whoosh", 0.35],
  [T.trick - 3, "swish", 0.3],
  [T.trick, "scribble", 0.3],
  [ROLL0, "riser", 0.4],
  [ROLL0 + 4, "chains", 0.35],
  [ROLL1, "impact", 0.6],
  [T.c10, "whoosh", 0.25],
  [T.bans - 4, "whoosh", 0.35],
  [T.bans, "stamp", 0.7],
  [T.c11, "swish", 0.25],
  [T.falseW, "slam", 0.5],
  [CLOSE0, "chains", 0.3],
  [CLOSE1, "thud", 0.45],
  [T.tomorrow, "swirl", 0.3],
  [T.c13, "whoosh", 0.25],
  [T.c13 + 6, "buzz", 0.25],
  [T.never, "pop", 0.35],
  [T.hurry, "ding", 0.4],
  [T.c14, "whoosh", 0.3],
  [T.see, "pop", 0.3],
  [LOOP, "buzz", 0.25],
];

const HOLDW: Partial<Pose> = { ra1: 62, ra2: 40, la1: -24, la2: -40, head: 6 };

export const S01Shelf: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const lab = f >= LAB0 && f < LAB1;
  const loopBack = f >= LOOP - 2;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.panicked, T.even, ROLL1, T.bans], 0.035) };

  // --- shop state ---
  const roll = loopBack ? 0 : f < ROLL0 ? 0 : f < CLOSE0 ? interpolate(f, [ROLL0, ROLL1], [0, 0.96], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) }) : interpolate(f, [CLOSE0, CLOSE1], [0.96, 0], clamp);
  const day = loopBack ? 0 : interpolate(f, [T.c12, T.c12 + 34], [0, 1], clamp);
  const stampY = f < T.bans - 10 || f > T.bans + 26 ? -400 : f <= T.bans ? interpolate(f, [T.bans - 10, T.bans], [-260, SIGN_Y - 30], { ...clamp, easing: (t) => t * t }) : interpolate(f, [T.bans + 6, T.bans + 26], [SIGN_Y - 30, -260], clamp);
  const stampMark = loopBack ? 0 : f >= T.bans && f < CLOSE0 ? 1 : f >= CLOSE0 ? interpolate(f, [CLOSE0, CLOSE0 + 14], [1, 0], clamp) : 0;
  const signSq = squash(f, T.bans, 0.2)[1];
  const signRot = wobble(f, T.bans, 6) + wobble(f, T.two0, 4) + Math.sin(f / 19) * 1.2;

  const sparkKeys = lab
    ? gestureKeys([
        [LAB0, G.presentBoth],
        [T.ten2, G.pointSide, "snap"],
        [T.c3, G.doublePoint, "snap"],
        [T.wanted, G.present, "snap"],
        [T.two4, G.pointUp, "snap"],
        [T.c5, G.thinkChin, "snap"],
        [T.count, G.shrugBig, "snap"],
        [T.c6, G.leanIn, "snap"],
        [T.dropped, G.recoil, "snap"],
        [T.c7, G.stop, "snap"],
        [T.even, G.mindBlown, "snap"],
      ])
    : gestureKeys([
        [0, { ...HOLDW, la1: -70, la2: -30 }],
        [T.brain, { ...HOLDW, la1: -150, la2: -30, head: -8 }, "snap"],
        [T.c1, HOLDW, "snap"],
        [T.overpay, { ...HOLDW, ra1: 96, ra2: 10, head: 12 }, "snap"],
        [T.ten1, { ...HOLDW, la1: -160, la2: -10 }, "snap"],
        [LAB1, G.armsCrossed],
        [T.trick, G.pointSide, "snap"],
        [T.c9, G.recoil, "snap"],
        [ROLL1, G.doublePoint, "snap"],
        [T.c10, G.pointUp, "snap"],
        [T.bans, G.fistPump, "snap"],
        [T.c11, G.presentBoth, "snap"],
        [T.c12, G.pointUp, "snap"],
        [T.c13, G.handsHips, "snap"],
        [T.never, { ...G.rest, ra1: 20, ra2: 30 }, "snap"],
        [T.hurry, G.celebrate, "snap"],
        [T.c14, G.leanIn, "snap"],
        [T.see - 2, G.beckon, "snap"],
        [LOOP - 2, { ...HOLDW, la1: -70, la2: -30 }],
      ]);

  const mood = (t: number): Mood =>
    t >= LOOP - 2
      ? "shock"
      : t < T.brain
        ? "shock"
        : t < T.c1
          ? "worried"
          : t < T.overpay
            ? "determined"
            : t < T.ten1
              ? "shock"
              : t < LAB0
                ? "curious"
                : t < T.c4
                  ? "excited"
                  : t < T.c5
                    ? "happy"
                    : t < T.c6
                      ? "thinking"
                      : t < T.dropped
                        ? "curious"
                        : t < T.even
                          ? "shock"
                          : t < LAB1
                            ? "mindblown"
                            : t < T.c9
                              ? "skeptical"
                              : t < T.c10
                                ? "shock"
                                : t < T.c11
                                  ? "angry"
                                  : t < T.c12
                                    ? "determined"
                                    : t < T.c13
                                      ? "thinking"
                                      : t < T.never
                                        ? "smug"
                                        : t < T.c14
                                          ? "laugh"
                                          : "curious";
  const bulb = (t: number) =>
    Math.max(bulbPulse(t, T.two4, 26), bulbPulse(t, T.even, 30), bulbPulse(t, ROLL1, 26), t >= T.brain && t < T.c1 ? 0.5 + 0.5 * Math.sign(Math.sin(t * 1.6)) : 0);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(addPose(q, shake(t, T.panicked, 3)), hop(t, T.two4, 24));
    q = addPose(addPose(q, shake(t, T.dropped + 2, 2)), hop(t, T.even, 30));
    q = addPose(addPose(q, nod(t, T.trick)), hop(t, ROLL1, 26));
    q = addPose(addPose(q, nod(t, T.falseW, 1)), hop(t, T.hurry, 30));
    q = addPose(q, nod(t, T.see, 1));
    return { ...q, x: lab ? LX : SX };
  };

  // wallet: in his right hand until "never", then tucked away
  const walletK = lab ? 0 : f < T.never + 6 || loopBack ? 1 : interpolate(f, [T.never + 6, T.never + 12], [1, 0], clamp);
  const walletOpen = interpolate(f, [T.overpay - 4, T.overpay, T.overpay + 22, T.overpay + 30], [0, 1, 1, 0], clamp);
  // coins fly out of the wallet on "overpay"
  const coins = [0, 1, 2].map((i) => {
    const t0 = T.overpay + i * 4;
    const tt = interpolate(f, [t0, t0 + 22], [0, 1], clamp);
    return { k: f >= t0 && f < t0 + 22 && !lab ? 1 : 0, p: arc(tt, [SX + 110, 960], [SX + 60 + i * 120, 1500], 180 + i * 40), r: f * 12 + i * 40 };
  });
  const watchK = !lab && f >= T.ten1 - 2 && f < LAB0 ? popIn(f, T.ten1) : 0;
  const watchA = interpolate(f, [T.ten1, LAB0], [0, 300], clamp);

  // --- lab state ---
  const outA = f >= T.dropped ? [2, 3, 4, 5, 6, 7, 8, 9] : [];
  const jarAn = f >= T.ten2 - 1 ? Math.min(10, Math.max(0, Math.floor((f - T.ten2 + 3) / 3))) : 0;
  const jarBn = f >= T.c3 + 4 ? (f >= T.c3 + 9 ? 2 : 1) : 0;
  // flying cookies taken by the hand
  const handY = interpolate(f, [GRAB - 10, GRAB, T.dropped, T.dropped + 14], [-200, TABLE_Y - JAR_H - 40, TABLE_Y - JAR_H - 40, -260], clamp);
  const handOn = lab && f >= GRAB - 10 && f < T.dropped + 16;
  const heartsB = (f >= T.wanted ? 1 : 0) + (f >= T.wanted + 6 ? 1 : 0) + (f >= T.two4 ? 1 : 0);
  const heartsA0 = f >= T.wanted + 3 && f < T.c6 ? 1 : 0;
  const heartsA = f >= T.even ? 5 : 0;
  const magK = lab && f >= T.changed && f < T.c6 ? popIn(f, T.changed + 2) : 0;

  // shopkeeper
  const keepMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t + 30, 3));
    if (t >= T.trick - 4 && t < ROLL0) {
      const s = Math.sin(t * 0.9);
      q = { ...q, ra1: q.ra1 + 10 * s, la1: q.la1 - 10 * s };
    }
    return q;
  };
  const keepFacing = (t: number) => (t >= ROLL0 + 6 && t < CLOSE1 ? 1 : -1);
  const keepKeys = gestureKeys([
    [0, G.rest],
    [T.trick - 4, { ra1: 70, ra2: 90, la1: -70, la2: -90, head: 8 }, "snap"],
    [ROLL0 + 6, G.recoil, "snap"],
    [ROLL1 + 6, G.shrugBig, "snap"],
    [CLOSE1, G.rest],
  ]);
  const keepOn = !lab && f >= LAB1 - 2 && !loopBack;

  const slamFake = f >= ROLL1 && f < T.c10 + 2;

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: lab ? PEACH : NIGHT }} />}
      cam={cam}
      hits={[T.panicked, ROLL1, T.bans]}
      power={10}
      svg={
        lab ? (
          <>
            <Kitchen f={f} />
            <Jar x={JA} n={jarAn} out={outA} />
            <Jar x={JB} n={jarBn} />
            {/* hearts: how much people wanted each jar */}
            {Array.from({ length: 3 }, (_, i) => (
              <HeartIcon key={`b${i}`} x={JB - 60 + i * 60} y={TABLE_Y - JAR_H - 90 - (i === 1 ? 30 : 0) + Math.sin(f / 9 + i) * 6} k={i < heartsB ? popIn(f, T.wanted + [0, 6, T.two4 - T.wanted][i]) : 0} />
            ))}
            <HeartIcon x={JA} y={TABLE_Y - JAR_H - 90 + Math.sin(f / 9) * 6} k={heartsA0 ? popIn(f, T.wanted + 3) * 0.8 : 0} col="#ff9bb0" />
            {Array.from({ length: 5 }, (_, i) => (
              <HeartIcon key={`a${i}`} x={JA - 120 + i * 60} y={TABLE_Y - JAR_H - 100 - (i % 2) * 40 + Math.sin(f / 8 + i) * 6} k={heartsA ? popIn(f, T.even + i * 2) * 1.05 : 0} />
            ))}
            {f >= T.even && <Burst x={JA} y={TABLE_Y - JAR_H - 110} at={T.even} f={f} size={190} color={NEON} />}
            {/* magnifier: same cookie, same cookie */}
            {magK > 0.01 && (
              <g transform={`translate(710 680) scale(${magK})`}>
                <line x1={110} y1={90} x2={190} y2={170} stroke={WOOD2} strokeWidth={26} strokeLinecap="round" />
                <circle r={150} fill={CREAM} {...K} strokeWidth={8} />
                <Cookie x={-70} y={0} s={1.5} />
                <Cookie x={70} y={0} s={1.5} r={40} />
                <text y={22} textAnchor="middle" fontFamily={FONT.comic} fontSize={70} fill={INK} opacity={f >= T.count ? 1 : 0}>
                  =
                </text>
              </g>
            )}
            {/* the hand that takes 8 cookies */}
            {handOn && (
              <g transform={`translate(${JA} ${handY})`}>
                <rect x={-34} y={-900} width={68} height={880} fill={ORANGE} {...K} />
                <ellipse cx={0} cy={0} rx={56} ry={46} fill={ORANGE} {...K} />
              </g>
            )}
            {f >= T.dropped &&
              f < T.dropped + 24 &&
              [2, 3, 4, 5, 6, 7, 8, 9].map((s, i) => {
                const tt = interpolate(f, [T.dropped, T.dropped + 20], [0, 1], clamp);
                const p = arc(tt, [JA + SLOTS[s][0], TABLE_Y + SLOTS[s][1]], [JA - 400 + i * 130, -120], 120);
                return <Cookie key={s} x={p[0]} y={p[1]} r={f * 9 + i * 30} s={0.92} />;
              })}
            <Spark f={f} scale={SS} base={{ x: LX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
          </>
        ) : (
          <>
            <Shop f={f} day={day} roll={roll} signRot={signRot} stampMark={stampMark} signSq={signSq} />
            {/* giant rubber stamp */}
            {stampY > -380 && (
              <g transform={`translate(640 ${stampY})`}>
                <rect x={-34} y={-260} width={68} height={160} rx={14} fill={WOOD} {...K} />
                <ellipse cx={0} cy={-270} rx={70} ry={40} fill={WOOD2} {...K} />
                <rect x={-150} y={-110} width={300} height={70} rx={10} fill="#444" {...K} />
                <rect x={-140} y={-44} width={280} height={30} rx={6} fill={RED} {...K} strokeWidth={4} />
              </g>
            )}
            {keepOn && (
              <Actor f={f} color={SHOPKEEP} scale={1.45} base={{ x: 985, y: GROUND - 92.5 * 1.45 }} keys={keepKeys} mod={keepMod} facing={keepFacing} face="happy" label="SHOP" trails={false} />
            )}
            {coins.map((c, i) => (c.k ? <Coin key={i} x={c.p[0]} y={c.p[1]} r={c.r} /> : null))}
            <Stopwatch x={SX + 150} y={HEADY - 160} k={watchK} a={watchA} />
            <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
              {(j) =>
                walletK > 0.01 ? (
                  <g transform={`translate(${j.rHand[0] + 6} ${j.rHand[1] - 4}) scale(${walletK})`}>
                    <Wallet open={walletOpen} />
                  </g>
                ) : null
              }
            </Spark>
            {f >= ROLL1 && f < ROLL1 + 16 && <Burst x={790} y={900} at={ROLL1} f={f} size={220} color={GOLD} />}
          </>
        )
      }
      html={
        <>
          {slamFake && (
            <Slam f={f} at={ROLL1} out={T.c10} x={300} y={640} size={120} color={GOLD} stroke={`11px ${INK}`} rotate={-4}>
              FAKE?
            </Slam>
          )}
          <Slam f={f} at={T.falseW} out={T.c12 + 2} x={540} y={420} size={100} color={NEON} stroke={`11px ${INK}`} rotate={-3}>
            FALSE URGENCY
          </Slam>
          <Slam f={f} at={T.even} out={LAB1} x={540} y={330} size={128} color={NEON} stroke={`11px ${INK}`} rotate={3}>
            EVEN MORE!
          </Slam>
          {f >= T.c4 + 6 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1712, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: INK, whiteSpace: "nowrap", opacity: 0.85, background: "rgba(255,255,255,0.55)", padding: "2px 12px", borderRadius: 8 }}>
                {f < LAB1 ? "Worchel, Lee & Adewole 1975 · illustration" : "CCPA dark patterns guidelines 2023 · Education, not legal advice"}
              </div>
              <div style={{ position: "absolute", right: 96, top: 1768, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: lab ? "#8a3d12" : GOLD, letterSpacing: 2, opacity: 0.9 }}>DESIGNED TO GET YOU</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["two", "left?", "panicked.", "overpay,", "ten", "test:", "two", "wanted", "count.", "dropped", "even", "more.", "trick.", "fake.", "bans", "false", "urgency.", "tomorrow.", "hurry.", "left\"?"]}
          />
          <Transition f={f} at={LAB0} kind="iris" size={VERTICAL} irisAt={[SX + 20, 760]} colors={[INK, MUSTARD, NEON]} />
        </>
      }
    />
  );
};
