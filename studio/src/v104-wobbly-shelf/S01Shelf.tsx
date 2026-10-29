import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, Heart, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V104 · "You'd pay more for your wobbly shelf." (Your brain did this, ~27 s)
// World A: a Sunday flat-pack workshop (sky-blue wall, pegboard with tool outlines, pine floor, sawdust). Spark hugs his
// crooked home-made shelf; a perfect STORE shelf drops in and he still won't let go. Cut: the experiment on the same floor —
// BUILT IT (orange) assembles a flat-pack box, GOT IT (slate) gets one ready-made; coin stacks rise 5 vs 8 (+63%).
// The = sign, then an EFFORT price tag swings onto the built box. Iris → World B: a giant instruction-manual page
// (cream paper, numbered steps 1–8). Steps 7 + 8 skipped; the coin stack over the half-built box collapses to less than half.
// Hard cut back to the workshop: Spark drives the last screw home → big heart (the finish). Price tag PRICELESS; a STRANGER
// squints and the tag flips to FAIR PRICE. Comment question; loops into frame 0.
// Sources: Norton, Mochon & Ariely 2012, J. Consumer Psychology 22(3) — Exp. 1A ($0.78 vs $0.48), Exp. 3 ($1.46 vs $0.59).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 197;
const FS = 1.35; // plain figures
const FY = GROUND - 92.5 * FS;

// palette
const SKY = "#a9d8f2";
const SKY2 = "#8cc6e8";
const PEG = "#d9a86a";
const PEG2 = "#b98848";
const PINE = "#e8c48a";
const PINE2 = "#c99d5c";
const FLOOR = "#d7b27a";
const FLOOR2 = "#b98f55";
const CARD = "#c8945a";
const CARD2 = "#a8743e";
const PAPER = "#fbf3df";
const PAPER2 = "#efe2c2";
const BLUE = "#2f5fa8";
const ORANGE = "#ff8a1f";
const SLATE = "#7a8aa6";
const GREY = "#9aa0a8";
const GOLD = "#ffd23f";
const GOLD2 = "#c99a12";
const RED = "#e8505b";
const GREEN = "#3fae5a";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  pay: W(0, 1),
  wobbly: W(0, 5),
  shelf: W(0, 6),
  c1: C(1),
  store: W(1, 3),
  better: W(1, 5),
  c2: C(2),
  gave: W(2, 1),
  flat: W(2, 4),
  box: W(2, 5),
  c3: C(3),
  built: W(3, 1),
  half2: W(3, 3),
  ready: W(3, 6),
  c4: C(4),
  builders: W(4, 1),
  bid: W(4, 2),
  sixty: W(4, 3),
  more: W(4, 5),
  c5: C(5),
  same: W(5, 0),
  box5: W(5, 1),
  effort: W(5, 3),
  tag: W(5, 7),
  c6: C(6),
  catch: W(6, 3),
  c7: C(7),
  two: W(7, 1),
  early: W(7, 3),
  c8: C(8),
  dropped: W(8, 1),
  half8: W(8, 5),
  c9: C(9),
  love: W(9, 1),
  finish: W(9, 3),
  shelf9: W(9, 6),
  c10: C(10),
  selling: W(10, 0),
  made: W(10, 3),
  c11: C(11),
  price: W(11, 0),
  stranger: W(11, 4),
  would: W(11, 5),
  c12: C(12),
  wobbliest: W(12, 2),
  love12: W(12, 6),
};
const LOOP = VOICE_FRAMES - 14;
const EXP0 = T.c2; // experiment staging (cut)
const MAN0 = T.c6; // iris → manual page
const BACK = T.c9; // hard cut back to the workshop

// staging
const SX_A = 372; // Spark hugging the shelf
const SHX = 610; // home-made shelf centre
const STX = 870; // store shelf centre
const SX_E = 150; // Spark in the experiment
const BX1 = 430; // BUILT IT figure
const BOX1 = 585;
const BX2 = 760; // GOT IT figure
const BOX2 = 905;
const SX_M = 160; // Spark on the manual page
const MBX = 560; // half-built box on the manual
const MFX = 400; // builder on the manual

const SHOTS: Shot[] = [
  { f: 0, z: 1.2, at: [470, 980], e: "cut" }, // frame 0: Spark hugging the wobbly shelf
  { f: T.wobbly - 2, z: 1.6, at: [SHX, 1010], e: "snap" }, // INSERT the wobble
  { f: T.c1, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: store shelf drops
  { f: T.better - 2, z: 1.75, at: [SX_A + 20, HEADY + 10], e: "snap" }, // CU: still won't let go
  { f: EXP0, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: the experiment
  { f: EXP0 + 4, z: 1.1, at: [520, 1000], e: "slow" }, // slow push
  { f: T.built - 3, z: 1.55, at: [BOX1 - 40, 1120], e: "snap" }, // INSERT box assembles
  { f: T.ready - 3, z: 1.55, at: [BOX2 - 60, 1120], e: "snap" }, // INSERT ready-made box
  { f: T.c4, z: 1.15, at: [700, 900], e: "cut" }, // MED: coin stacks
  { f: T.sixty - 2, z: 1.45, at: [BOX1 + 30, 860], e: "snap" }, // punch the +63% stack
  { f: T.c5, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: same box
  { f: T.effort - 3, z: 1.6, at: [BOX1 + 10, 1080], e: "snap" }, // INSERT effort tag
  { f: T.tag + 4, z: 1.9, at: [SX_E + 30, HEADY + 10], e: "cut" }, // CU Spark: aha
  { f: MAN0, z: 1.0, at: [540, 960], e: "cut" }, // iris → WIDE manual page
  { f: T.c7, z: 1.5, at: [760, 430], e: "snap" }, // INSERT steps 7 + 8
  { f: T.early + 4, z: 1.2, at: [560, 1000], e: "snap" }, // MED half-built box
  { f: T.c8, z: 1.35, at: [MBX + 40, 860], e: "cut" }, // coin stack
  { f: T.half8 - 2, z: 1.55, at: [MBX + 40, 1000], e: "snap" }, // coins collapse
  { f: BACK, z: 2.0, at: [SX_A + 20, HEADY + 10], e: "cut" }, // CU: "you love…"
  { f: T.finish - 4, z: 1.55, at: [SHX, 1000], e: "snap" }, // INSERT last screw + heart
  { f: T.c10, z: 1.15, at: [520, 960], e: "cut" }, // MED: tag
  { f: T.c11, z: 1.0, at: [600, 960], e: "smooth" }, // WIDE: stranger walks in
  { f: T.would - 2, z: 1.6, at: [SHX + 40, 900], e: "snap" }, // INSERT tag flips
  { f: T.c12, z: 2.0, at: [SX_A + 20, HEADY + 10], e: "cut" }, // CU comment question
  { f: LOOP, z: 1.2, at: [470, 980], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
// the home-made shelf: crooked boards, one short leg, a screw sticking out (screw 0 = out, 1 = driven in)
const WobblyShelf: React.FC<{ rot: number; screw: number }> = ({ rot, screw }) => (
  <g transform={`translate(${SHX} ${GROUND}) rotate(${rot})`}>
    {/* uprights */}
    <path d="M -130 0 L -122 -430 L -96 -432 L -102 0 Z" fill={PINE} {...K} strokeWidth={5} />
    <path d="M 104 -14 L 112 -420 L 138 -416 L 130 -14 Z" fill={PINE} {...K} strokeWidth={5} />
    {/* wedge under the short leg */}
    <path d="M 98 -14 L 136 -14 L 140 0 L 96 0 Z" fill={PINE2} stroke={INK} strokeWidth={4} />
    {/* boards (crooked) */}
    <path d="M -146 -388 L 152 -398 L 152 -372 L -146 -362 Z" fill={PINE} {...K} strokeWidth={5} />
    <path d="M -146 -250 L 152 -228 L 152 -204 L -146 -226 Z" fill={PINE} {...K} strokeWidth={5} />
    <path d="M -146 -96 L 152 -104 L 152 -80 L -146 -72 Z" fill={PINE} {...K} strokeWidth={5} />
    {/* wood grain */}
    {[-372, -236, -86].map((y, i) => (
      <path key={i} d={`M -110 ${y} q 60 -6 120 0 t 110 2`} fill="none" stroke={PINE2} strokeWidth={3} />
    ))}
    {/* screws */}
    {[[-112, -376], [120, -385], [-112, -238], [-112, -84], [120, -92]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={6} fill={GREY} stroke={INK} strokeWidth={3} />
    ))}
    {/* the loose screw */}
    <g transform={`translate(${126 + (1 - screw) * 26} -216)`}>
      <rect x={-4} y={-5} width={(1 - screw) * 26 + 4} height={10} fill={GREY} stroke={INK} strokeWidth={3} />
      <circle cx={(1 - screw) * 26} cy={0} r={8} fill={GREY} stroke={INK} strokeWidth={3} />
    </g>
    {/* stuff on it: a plant + a mug */}
    <g transform="translate(-60 -398)">
      <path d="M -26 0 L 26 0 L 20 -44 L -20 -44 Z" fill="#d86a4a" {...K} strokeWidth={4} />
      <path d="M 0 -44 C -40 -90 -30 -110 -6 -80 M 0 -44 C 30 -100 46 -90 10 -70" fill="none" stroke={GREEN} strokeWidth={9} strokeLinecap="round" />
    </g>
    <g transform="translate(60 -232)">
      <rect x={-24} y={-48} width={48} height={48} rx={6} fill={WHITE} {...K} strokeWidth={4} />
      <path d="M 24 -38 q 22 0 22 14 q 0 14 -22 14" fill="none" stroke={INK} strokeWidth={4} />
    </g>
  </g>
);

// the store shelf: white, straight, a sparkle
const StoreShelf: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-110} y={-440} width={22} height={440} fill={WHITE} {...K} strokeWidth={5} />
    <rect x={88} y={-440} width={22} height={440} fill={WHITE} {...K} strokeWidth={5} />
    {[-430, -290, -150, -30].map((y) => (
      <rect key={y} x={-120} y={y} width={240} height={22} fill={WHITE} {...K} strokeWidth={5} />
    ))}
    <g transform={`translate(70 -400) rotate(${f * 4}) scale(${0.8 + 0.25 * Math.sin(f / 4)})`}>
      <path d="M 0 -26 L 6 -6 L 26 0 L 6 6 L 0 26 L -6 6 L -26 0 L -6 -6 Z" fill={GOLD} stroke={INK} strokeWidth={3} />
    </g>
    <g transform="translate(-60 -150) rotate(-8)">
      <rect x={-46} y={0} width={92} height={40} rx={6} fill={RED} {...K} strokeWidth={4} />
      <text y={29} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill={WHITE}>
        STORE
      </text>
    </g>
  </g>
);

// cardboard flat-pack box. p: 0 = flat panels, 1 = closed box. missing = steps left out (top, front)
const FlatBox: React.FC<{ p: number; missing?: boolean; glow?: number }> = ({ p, missing = false, glow = 0 }) => {
  const st = (i: number) => Math.max(0, Math.min(1, p * 4 - i)); // 4 stages
  const sides = st(0);
  const back = st(1);
  const front = missing ? 0 : st(2);
  const lid = missing ? 0 : st(3);
  return (
    <g>
      {glow > 0 && <ellipse cx={0} cy={-80} rx={130} ry={110} fill={GOLD} opacity={0.35 * glow} />}
      {/* base / flat panels */}
      <path d="M -80 0 L 80 0 L 110 -26 L -50 -26 Z" fill={CARD2} {...K} strokeWidth={5} />
      {p < 0.05 && (
        <>
          <rect x={-70} y={-18} width={70} height={14} fill={CARD} stroke={INK} strokeWidth={3} />
          <rect x={6} y={-18} width={70} height={14} fill={CARD} stroke={INK} strokeWidth={3} />
        </>
      )}
      {back > 0 && <path d={`M -50 -26 L 110 -26 L 110 ${-26 - 120 * back} L -50 ${-26 - 120 * back} Z`} fill={CARD2} {...K} strokeWidth={5} />}
      {sides > 0 && <path d={`M 80 0 L 110 -26 L 110 ${-26 - 120 * sides} L 80 ${-120 * sides} Z`} fill={CARD2} {...K} strokeWidth={5} />}
      {sides > 0 && <path d={`M -80 0 L -50 -26 L -50 ${-26 - 120 * sides} L -80 ${-120 * sides} Z`} fill={CARD} {...K} strokeWidth={5} opacity={0.9} />}
      {front > 0 && (
        <g>
          <path d={`M -80 0 L 80 0 L 80 ${-120 * front} L -80 ${-120 * front} Z`} fill={CARD} {...K} strokeWidth={5} />
          {front > 0.8 && <path d="M -30 -70 L 30 -70" stroke={CARD2} strokeWidth={6} />}
        </g>
      )}
      {lid > 0 && <path d={`M -80 -120 L 80 -120 L 110 -146 L -50 -146 Z`} fill={CARD} {...K} strokeWidth={5} opacity={lid} transform={`translate(0 ${(1 - lid) * -60})`} />}
    </g>
  );
};

// a coin stack of n coins (ellipses), with an optional ghost outline of `ghost` coins
const Coins: React.FC<{ n: number; ghost?: number }> = ({ n, ghost = 0 }) => (
  <g>
    {ghost > 0 && <rect x={-48} y={-ghost * 24 - 12} width={96} height={ghost * 24 + 12} rx={20} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 8" opacity={0.55} />}
    {Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => (
      <g key={i} transform={`translate(${Math.sin(i * 1.7) * 4} ${-i * 24})`}>
        <rect x={-44} y={-12} width={88} height={14} fill={GOLD2} stroke={INK} strokeWidth={4} />
        <ellipse cx={0} cy={-12} rx={44} ry={12} fill={GOLD} stroke={INK} strokeWidth={4} />
      </g>
    ))}
  </g>
);

const Tag: React.FC<{ text: string; col: string; r?: number; s?: number; icon?: boolean }> = ({ text, col, r = 0, s = 1, icon = false }) => (
  <g transform={`rotate(${r}) scale(${s})`}>
    <line x1={0} y1={-70} x2={0} y2={-30} stroke={INK} strokeWidth={4} />
    <path d="M -100 -30 L 100 -30 L 100 40 L -100 40 L -122 5 Z" fill={col} {...K} strokeWidth={5} />
    <circle cx={-96} cy={5} r={7} fill={PAPER} stroke={INK} strokeWidth={3} />
    {icon && <path d="M -62 -14 C -74 4 -74 18 -62 22 C -50 18 -50 4 -62 -14 Z" fill="#7cc8f0" stroke={INK} strokeWidth={3} />}
    <text x={icon ? 14 : 8} y={17} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={text.length > 8 ? 34 : 40} fill={WHITE} stroke={INK} strokeWidth={5} paintOrder="stroke">
      {text}
    </text>
  </g>
);

const Screwdriver: React.FC<{ r?: number }> = ({ r = 0 }) => (
  <g transform={`rotate(${r})`}>
    <rect x={-10} y={-30} width={20} height={60} rx={8} fill={RED} {...K} strokeWidth={4} />
    <rect x={-3} y={30} width={6} height={50} fill={GREY} stroke={INK} strokeWidth={3} />
  </g>
);

// world A: Sunday flat-pack workshop
const Workshop: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={SKY} />
    {/* window with sunlight */}
    <rect x={740} y={560} width={240} height={250} rx={12} fill="#fff8d8" {...K} />
    <line x1={860} y1={560} x2={860} y2={810} stroke={INK} strokeWidth={6} />
    <line x1={740} y1={685} x2={980} y2={685} stroke={INK} strokeWidth={6} />
    <path d="M 740 810 L 640 1290 L 1080 1290 L 980 810 Z" fill="#fff8d8" opacity={0.25} />
    {/* pegboard with tool outlines (kept below the title zone) */}
    <g transform="translate(40 610) scale(0.62)">
      <rect x={70} y={250} width={560} height={330} rx={14} fill={PEG} {...K} />
      {Array.from({ length: 9 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => <circle key={`${i}${j}`} cx={110 + i * 60} cy={290 + j * 62} r={5} fill={PEG2} />),
      )}
      <g stroke={INK} strokeWidth={5} fill="none" opacity={0.6} strokeLinecap="round">
        <path d="M 150 320 L 150 480 M 120 330 L 180 330" />
        <path d="M 260 320 L 260 500 M 245 320 L 275 320 L 275 360 L 245 360 Z" />
        <path d="M 370 330 C 420 330 420 400 370 400 L 370 520" />
        <path d="M 480 320 L 540 500 M 540 320 L 480 500" />
      </g>
    </g>
    {/* skirting + floor */}
    <rect x={0} y={GROUND - 40} width={1080} height={40} fill={SKY2} stroke={INK} strokeWidth={4} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={FLOOR} />
    {Array.from({ length: 7 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 60 + i * 85} x2={1080} y2={GROUND + 60 + i * 85} stroke={FLOOR2} strokeWidth={5} />
    ))}
    {/* sawdust */}
    {[120, 380, 520, 760, 940].map((x, i) => (
      <ellipse key={i} cx={x} cy={GROUND + 22 + (i % 2) * 18} rx={30} ry={7} fill="#f3dcae" />
    ))}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// world B: a giant instruction-manual page
const Manual: React.FC<{ f: number; skipK: number }> = ({ f, skipK }) => (
  <g>
    <rect width={1080} height={1920} fill={PAPER} />
    {Array.from({ length: 30 }, (_, i) => (
      <line key={i} x1={0} y1={i * 70} x2={1080} y2={i * 70} stroke={PAPER2} strokeWidth={3} />
    ))}
    {/* step strip */}
    {Array.from({ length: 8 }, (_, i) => {
      const x = 92 + i * 112;
      const skipped = i >= 6;
      const done = !skipped;
      return (
        <g key={i} transform={`translate(${x} 360)`}>
          <rect x={0} y={0} width={96} height={130} rx={10} fill={WHITE} stroke={BLUE} strokeWidth={5} />
          <circle cx={26} cy={26} r={18} fill={BLUE} />
          <text x={26} y={36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill={WHITE}>
            {i + 1}
          </text>
          {/* tiny drawing: a panel snapping on */}
          <rect x={30} y={60} width={44} height={44} fill="none" stroke={BLUE} strokeWidth={4} opacity={0.6} />
          <path d={`M ${i % 2 ? 30 : 74} 60 l ${i % 2 ? -12 : 12} -12`} stroke={BLUE} strokeWidth={4} opacity={0.6} />
          {done && <path d="M 56 98 L 70 114 L 96 80" fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
          {skipped && skipK > 0.01 && (
            <g opacity={0.5 + 0.5 * (Math.floor(f / 5) % 2)} transform={`translate(50 65) scale(${skipK})`}>
              <path d="M -32 -32 L 32 32 M 32 -32 L -32 32" stroke={RED} strokeWidth={11} strokeLinecap="round" />
            </g>
          )}
        </g>
      );
    })}
    <text x={540} y={300} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={BLUE} letterSpacing={6} opacity={0.75}>
      ASSEMBLY · 8 STEPS
    </text>
    {/* floor line drawn like a manual */}
    <line x1={60} y1={GROUND} x2={1020} y2={GROUND} stroke={BLUE} strokeWidth={6} />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <line key={i} x1={80 + i * 140} y1={GROUND + 6} x2={40 + i * 140} y2={GROUND + 60} stroke={BLUE} strokeWidth={4} opacity={0.4} />
    ))}
    {/* loose parts the builder never used */}
    <g transform={`translate(780 ${GROUND - 10}) rotate(-6)`}>
      <rect x={-80} y={-12} width={160} height={22} fill={CARD} {...K} strokeWidth={4} />
    </g>
    <g transform={`translate(840 ${GROUND - 36}) rotate(8)`}>
      <rect x={-70} y={-12} width={140} height={22} fill={CARD} {...K} strokeWidth={4} />
    </g>
  </g>
);

export const S01_SFX: SfxCue[] = [
  [0, "boing", 0.35],
  [T.wobbly, "swish", 0.25],
  [T.c1 - 6, "whoosh", 0.35],
  [T.store, "thud", 0.55],
  [T.store + 3, "ding", 0.3],
  [T.better - 2, "whoosh", 0.2],
  [EXP0, "whoosh", 0.25],
  [T.flat, "pop", 0.35],
  [T.box + 4, "pop", 0.3],
  [T.built, "tick", 0.4],
  [T.built + 7, "tick", 0.4],
  [T.built + 14, "tick", 0.4],
  [T.built + 21, "thud", 0.35],
  [T.ready - 3, "whoosh", 0.25],
  [T.ready, "pop", 0.4],
  [T.c4, "whoosh", 0.2],
  ...Array.from({ length: 8 }, (_, i) => [T.bid + i * 5, "clink", 0.25 + i * 0.03] as SfxCue),
  [T.sixty, "impact", 0.55],
  [T.c5, "whoosh", 0.2],
  [T.same, "ding", 0.35],
  [T.effort - 3, "swish", 0.3],
  [T.effort + 2, "clink", 0.35],
  [T.tag + 4, "whoosh", 0.2],
  [MAN0 - 4, "whoosh_long", 0.4],
  [MAN0 + 6, "page", 0.4],
  [T.c7, "whoosh", 0.2],
  [T.two, "buzz", 0.35],
  [T.early, "buzz", 0.3],
  [T.c8, "whoosh", 0.2],
  [T.dropped, "crash", 0.4],
  [T.dropped + 4, "clink", 0.35],
  [T.dropped + 10, "clink", 0.3],
  [T.half8, "slam", 0.5],
  [BACK, "whoosh", 0.25],
  [T.finish - 8, "tick", 0.35],
  [T.finish - 3, "tick", 0.35],
  [T.finish, "ding", 0.5],
  [T.c10, "whoosh", 0.2],
  [T.made - 2, "pop", 0.35],
  [T.c11, "whoosh", 0.25],
  [T.stranger, "boing", 0.25],
  [T.would, "stamp", 0.55],
  [T.c12, "whoosh", 0.2],
  [T.love12, "boing", 0.3],
  [LOOP, "boing", 0.35],
];

const HUG: Partial<Pose> = { ra1: 82, ra2: 40, la1: 70, la2: 52, lean: 9, head: 8 };
const HAMMER_UP: Partial<Pose> = { ra1: 150, ra2: 60, la1: 40, la2: 30, lean: 8 };
const HAMMER_DN: Partial<Pose> = { ra1: 70, ra2: 20, la1: 40, la2: 30, lean: 14, head: 10 };

export const S01Shelf: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const hook = f < EXP0 || loopBack;
  const exp = !loopBack && f >= EXP0 && f < MAN0;
  const man = !loopBack && f >= MAN0 && f < BACK;
  const end = !loopBack && f >= BACK;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.store, T.sixty, T.half8, T.finish, T.would], 0.035) };

  // --- world A: shelf ---
  const shelfRot =
    (hook ? 1.5 * Math.sin(f / 5) + wobble(f, loopBack ? LOOP : 0, 4) + wobble(f, T.wobbly, 3) + (f >= T.store ? wobble(f, T.store, 2.5) : 0) : 0) +
    (end ? 0.8 * Math.sin(f / 6) + wobble(f, T.finish, 3) + wobble(f, T.love12, 3) : 0);
  const screw = end ? ease(f, T.finish - 10, T.finish, 0, 1) : 0;
  const storeOn = f >= T.c1 - 8 && f < EXP0 && !loopBack;
  const storeY = interpolate(f, [T.c1 - 8, T.store], [-900, 0], clamp);
  const [ssx, ssy] = squash(f, T.store, 0.18);

  // hearts around the shelf (frame 0 + loop, and the big one on "finish")
  const hearts = (at: number, n: number, big = 1) =>
    Array.from({ length: n }, (_, i) => {
      const d = f - at - i * 6;
      if (d < 0 || d > 34) return null;
      const k = popIn(f, at + i * 6);
      return (
        <g key={`${at}-${i}`} transform={`translate(${SHX - 70 + i * 70} ${GROUND - 470 - d * 4}) scale(${k * big})`} opacity={interpolate(d, [22, 34], [1, 0], clamp)}>
          <Heart s={1.4} color={RED} />
        </g>
      );
    });

  // price tag in the end section
  const tagK = end && f >= T.made - 2 ? popIn(f, T.made - 2) : 0;
  const flip = interpolate(f, [T.would - 4, T.would + 2], [0, 1], clamp);
  const tagText = flip < 0.5 ? "PRICELESS" : "FAIR PRICE";
  const tagSx = Math.abs(Math.cos(flip * Math.PI));
  const strangerX = interpolate(f, [T.c11 - 4, T.stranger], [1200, 880], { ...clamp });

  // --- experiment ---
  const buildP = interpolate(f, [T.built - 2, T.built + 22], [0, 1], clamp);
  const readyK = f >= T.ready ? popIn(f, T.ready) : 0;
  const coinsA = Math.min(8, Math.floor(interpolate(f, [T.bid, T.bid + 40], [0, 8.99], clamp)));
  const coinsB = Math.min(5, Math.floor(interpolate(f, [T.bid, T.bid + 25], [0, 5.99], clamp)));
  const eqK = f >= T.same ? popIn(f, T.same) : 0;
  const effT = interpolate(f, [T.effort - 3, T.effort + 2], [0, 1], clamp);
  const [etx, ety] = arc(effT, [SX_E + 90, 900], [BOX1 - 10, 1185], 160);

  // --- manual ---
  const skipK = f >= T.two ? popIn(f, T.two) : 0;
  const manCoins = f < T.dropped ? 10 : 4;
  const tumble = interpolate(f, [T.dropped, T.dropped + 22], [0, 1], clamp);

  // --- Spark ---
  const sx = hook ? SX_A : exp ? SX_E : man ? SX_M : SX_A;
  const sparkKeys = hook
    ? gestureKeys([
        [0, HUG],
        [T.c1 - 2, HUG],
        [T.store, G.recoil, "snap"],
        [T.store + 10, HUG, "snap"],
        [LOOP - 2, HUG, "snap"],
      ])
    : exp
      ? gestureKeys([
          [EXP0, G.presentBoth],
          [T.flat, G.pointSide, "snap"],
          [T.c3, G.present, "snap"],
          [T.ready, G.doublePoint, "snap"],
          [T.c4, G.thinkChin, "snap"],
          [T.sixty, G.mindBlown, "snap"],
          [T.c5, G.handsHips, "snap"],
          [T.effort - 3, { ra1: 120, ra2: 20, la1: -20, la2: 10, lean: 4 }, "snap"],
          [T.effort + 2, G.pointSide, "snap"],
          [T.tag + 4, G.pointUp, "snap"],
        ])
      : man
        ? gestureKeys([
            [MAN0, G.stop],
            [T.c7, G.pointUp, "snap"],
            [T.early, G.shrugBig, "snap"],
            [T.c8, G.present, "snap"],
            [T.dropped, G.recoil, "snap"],
            [T.half8, G.facepalm, "snap"],
          ])
        : gestureKeys([
            [BACK, G.leanIn],
            [T.finish - 12, { ra1: 85, ra2: 10, la1: 70, la2: 40, lean: 10, head: 6 }, "snap"],
            [T.finish, G.celebrate, "snap"],
            [T.c10, G.present, "snap"],
            [T.made - 2, { ra1: 95, ra2: 30, la1: -15, la2: 10, lean: 6 }, "snap"],
            [T.c11, G.thinkChin, "snap"],
            [T.would, G.fistPump, "snap"],
            [T.c12, G.beckon, "snap"],
            [T.love12, HUG, "snap"],
          ]);

  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "excited";
    if (t < T.c1) return "excited";
    if (t < T.better) return "shock";
    if (t < EXP0) return "smug";
    if (t < T.c4) return "curious";
    if (t < T.sixty) return "thinking";
    if (t < T.c5) return "mindblown";
    if (t < T.tag + 4) return "skeptical";
    if (t < MAN0) return "happy";
    if (t < T.c8) return "worried";
    if (t < T.half8) return "shock";
    if (t < BACK) return "sad";
    if (t < T.finish) return "determined";
    if (t < T.c10) return "laugh";
    if (t < T.c11) return "wink";
    if (t < T.c12) return "thinking";
    return "curious";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.sixty, 24), bulbPulse(t, T.effort, 30), bulbPulse(t, T.finish, 30), bulbPulse(t, T.would, 22));

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(addPose(q, shake(t, T.store, 3)), nod(t, T.better, 2));
    q = addPose(addPose(q, nod(t, T.c3 + 4, 1)), hop(t, T.sixty, 24));
    q = addPose(addPose(q, nod(t, T.effort, 1)), shake(t, T.two, 2));
    q = addPose(addPose(q, shake(t, T.half8, 3)), hop(t, T.finish, 26));
    q = addPose(addPose(q, nod(t, T.would, 1)), shake(t, T.love12, 2));
    return { ...q, x: sx };
  };

  const builderKeys = gestureKeys([
    [EXP0, G.rest],
    [T.built - 4, HAMMER_UP, "snap"],
    [T.built, HAMMER_DN, "snap"],
    [T.built + 6, HAMMER_UP, "snap"],
    [T.built + 10, HAMMER_DN, "snap"],
    [T.built + 16, HAMMER_UP, "snap"],
    [T.built + 20, HAMMER_DN, "snap"],
    [T.built + 28, G.celebrate, "snap"],
    [T.c4, G.rest],
    [T.sixty, G.celebrate, "snap"],
    [T.c5, G.rest],
  ]);
  const readyKeys = gestureKeys([
    [EXP0, G.rest],
    [T.ready, G.shrugBig, "snap"],
    [T.ready + 30, G.rest],
    [T.sixty, G.armsCrossed, "snap"],
  ]);
  const manBuilderKeys = gestureKeys([
    [MAN0, G.celebrate],
    [T.two, G.celebrate],
    [T.early, G.shrugBig, "snap"],
    [T.dropped, G.recoil, "snap"],
    [T.half8, G.facepalm, "snap"],
  ]);
  const strangerKeys = gestureKeys([
    [T.c11 - 4, G.rest],
    [T.stranger, G.thinkChin, "snap"],
    [T.would, G.shrugBig, "snap"],
  ]);

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) =>
        end && f >= T.finish - 14 && f < T.finish + 6 ? (
          <g transform={`translate(${j.rHand[0]} ${j.rHand[1]})`}>
            <Screwdriver r={-90 + Math.sin(f) * 20} />
          </g>
        ) : null
      }
    </Spark>
  );

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: man ? PAPER : SKY }} />}
      cam={cam}
      hits={[T.store, T.sixty, T.half8, T.finish]}
      power={10}
      svg={
        man ? (
          <>
            <Manual f={f} skipK={skipK} />
            <g transform={`translate(${MBX} ${GROUND})`}>
              <FlatBox p={1} missing />
            </g>
            {/* coin stack over the half-built box */}
            <g transform={`translate(${MBX + 40} ${GROUND - 200})`}>
              <Coins n={manCoins} ghost={f >= T.dropped ? 10 : 0} />
            </g>
            {f >= T.dropped &&
              tumble < 1 &&
              Array.from({ length: 6 }, (_, i) => {
                const [x, y] = arc(tumble, [MBX + 40, GROUND - 300 - i * 24], [MBX + 40 + (i % 2 ? 1 : -1) * (120 + i * 40), GROUND - 10], 80 + i * 20);
                return (
                  <g key={i} transform={`translate(${x} ${y}) rotate(${tumble * 360 * (i % 2 ? 1 : -1)})`}>
                    <ellipse rx={40} ry={12} fill={GOLD} stroke={INK} strokeWidth={4} />
                  </g>
                );
              })}
            {f >= T.dropped + 22 &&
              Array.from({ length: 6 }, (_, i) => (
                <ellipse key={i} cx={MBX + 40 + (i % 2 ? 1 : -1) * (120 + i * 40)} cy={GROUND - 8} rx={40} ry={11} fill={GOLD} stroke={INK} strokeWidth={4} />
              ))}
            {f >= T.half8 && f < T.half8 + 14 && <Burst x={MBX + 40} y={GROUND - 260} at={T.half8} f={f} size={220} color={RED} />}
            <Actor f={f} color={ORANGE} scale={FS} base={{ x: MFX, y: FY }} keys={manBuilderKeys} mod={(t, p) => addPose(addPose(p, idle(t + 9, 3)), shake(t, T.half8, 2))} facing={1} face={f >= T.dropped ? "sad" : "happy"} label="BUILT IT" trails={false} />
            {sparkEl}
          </>
        ) : exp ? (
          <>
            <Workshop />
            <g transform={`translate(${BOX1} ${GROUND})`}>
              <FlatBox p={f < T.flat ? 0 : buildP} glow={f >= T.effort ? interpolate(f, [T.effort, T.effort + 8], [0, 1], clamp) : 0} />
            </g>
            {readyK > 0.01 ? (
              <g transform={`translate(${BOX2} ${GROUND}) scale(${readyK})`}>
                <FlatBox p={1} />
              </g>
            ) : (
              f >= T.flat && (
                <g transform={`translate(${BOX2} ${GROUND}) scale(${popIn(f, T.box + 4)})`}>
                  <FlatBox p={0} />
                </g>
              )
            )}
            {f >= T.flat && f < T.flat + 14 && <Burst x={BOX1} y={GROUND - 40} at={T.flat} f={f} size={140} color={ORANGE} />}
            {/* coin stacks = bids */}
            {f >= T.bid && f < T.c5 && (
              <>
                <g transform={`translate(${BOX1} ${GROUND - 190})`}>
                  <Coins n={coinsA} />
                </g>
                <g transform={`translate(${BOX2} ${GROUND - 190})`}>
                  <Coins n={coinsB} />
                </g>
              </>
            )}
            {f >= T.sixty && f < T.sixty + 14 && <Burst x={BOX1} y={GROUND - 390} at={T.sixty} f={f} size={220} color={GOLD} />}
            {/* = sign between the identical boxes */}
            {eqK > 0.01 && (
              <g transform={`translate(${(BOX1 + BOX2) / 2 + 10} ${GROUND - 90}) scale(${eqK})`}>
                <rect x={-34} y={-24} width={68} height={16} rx={6} fill={WHITE} stroke={INK} strokeWidth={4} />
                <rect x={-34} y={6} width={68} height={16} rx={6} fill={WHITE} stroke={INK} strokeWidth={4} />
              </g>
            )}
            {f >= T.effort - 3 && (
              <g transform={`translate(${etx} ${ety}) rotate(${(1 - effT) * 160 + wobble(f, T.effort + 2, 12)})`}>
                <Tag text="EFFORT" col={ORANGE} icon s={0.85} />
              </g>
            )}
            <Actor f={f} color={ORANGE} scale={FS} base={{ x: BX1, y: FY }} keys={builderKeys} mod={(t, p) => addPose(p, idle(t + 5, 3))} facing={1} face="happy" label="BUILT IT" trails={false}>
              {(j) =>
                f >= T.built - 4 && f < T.built + 26 ? (
                  <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(-30)`}>
                    <rect x={-6} y={-6} width={12} height={60} fill={PINE2} stroke={INK} strokeWidth={3} />
                    <rect x={-22} y={-18} width={44} height={22} rx={4} fill={GREY} stroke={INK} strokeWidth={3} />
                  </g>
                ) : null
              }
            </Actor>
            <Actor f={f} color={SLATE} scale={FS} base={{ x: BX2, y: FY }} keys={readyKeys} mod={(t, p) => addPose(p, idle(t + 13, 3))} facing={1} face={f >= T.sixty ? "eyes" : "happy"} label="GOT IT" trails={false} />
            {sparkEl}
          </>
        ) : (
          <>
            <Workshop />
            {storeOn && (
              <g transform={`translate(${STX} ${GROUND + storeY}) scale(${ssx} ${ssy})`}>
                <StoreShelf f={f} />
              </g>
            )}
            {f >= T.store && f < T.store + 14 && !loopBack && <Burst x={STX} y={GROUND - 10} at={T.store} f={f} size={180} color={WHITE} />}
            <WobblyShelf rot={shelfRot} screw={screw} />
            {hook && hearts(loopBack ? LOOP : 2, 3)}
            {end && hearts(T.finish, 3, 1.4)}
            {end && f >= T.finish && f < T.finish + 14 && <Burst x={SHX + 140} y={GROUND - 216} at={T.finish} f={f} size={160} color={GOLD} />}
            {tagK > 0.01 && (
              <g transform={`translate(${SHX + 40} ${GROUND - 300}) rotate(${wobble(f, T.made + 6, 10) + wobble(f, T.would + 2, 8)}) scale(${tagK * tagSx} ${tagK})`}>
                <Tag text={tagText} col={flip < 0.5 ? RED : GREEN} s={1.05} />
              </g>
            )}
            {end && f >= T.c11 - 4 && (
              <Actor f={f} color={GREY} scale={FS} base={{ x: strangerX, y: FY }} keys={strangerKeys} mod={(t, p) => addPose(p, idle(t + 21, 3))} facing={-1} face="eyes" label="STRANGER" trails={false} />
            )}
            {sparkEl}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words) */}
          {(f < T.c1 - 2 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 280, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 112, transform: `rotate(-3deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.04, 6)})` }}>
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>MY SHELF =</div>
              <div style={{ color: GOLD, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>PRICELESS</div>
            </div>
          )}
          <Slam f={f} at={T.sixty} out={T.c5 + 4} x={540} y={420} size={200} color={GOLD} stroke={`12px ${INK}`} rotate={-5}>
            +63%
          </Slam>
          <Slam f={f} at={T.half8} out={BACK - 2} x={540} y={700} size={120} color={RED} stroke={`12px ${INK}`} rotate={4}>
            UNDER HALF
          </Slam>
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: INK, whiteSpace: "nowrap", opacity: 0.88, background: "rgba(255,255,255,0.75)", padding: "2px 12px", borderRadius: 8 }}>
                {f < MAN0 ? "Norton, Mochon & Ariely 2012, J. Consumer Psych. (Exp. 1) · small student study" : "Norton, Mochon & Ariely 2012 (Exp. 3: unfinished vs finished boxes)"}
              </div>
              <div style={{ position: "absolute", left: 96, top: 1752, fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: man ? INK : WHITE, opacity: 0.85 }}>Education, not financial advice</div>
              <div style={{ position: "absolute", right: 96, top: 1750, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: man ? BLUE : ORANGE, letterSpacing: 2, opacity: 0.95 }}>YOUR BRAIN DID THIS</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["pay", "more", "wobbly", "shelf.", "store", "better.", "flat-pack", "built", "ready-made.", "sixty-three", "percent", "Same", "effort", "price", "tag.", "catch.", "two", "early?", "less", "half.", "finish,", "Selling", "stranger", "wobbliest", "love?"]}
          />
          <Transition f={f} at={MAN0} kind="iris" size={VERTICAL} colors={[BLUE, PAPER, ORANGE]} />
        </>
      }
    />
  );
};
