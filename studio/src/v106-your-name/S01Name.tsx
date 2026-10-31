import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V106 · "Why do you hear your name in a noisy room?" (Your brain did this, ~41 s, clarity rules)
// TWO places. (1) A night garden party: paper lanterns, a loud speaker with music notes, grey party guests whose
// speech bubbles are only grey scribbles (noise). Spark listens to one friend (MAYA). Far away a guest calls
// "SPARK!" in a bright yellow bubble and Spark turns. (2) Shutter → a cream test lab: a person (SAM) wears big
// headphones; VOICE 1 (blue) goes into one ear, VOICE 2 (grey) into the other. SAM repeats voice 1 (REPEAT) and
// ignores voice 2 (IGNORE). Voice 2 says "SAM!". A card: three heads, one notices = 1 IN 3. A magnifier checks the
// ignored grey bubble and stops on the name. Hard cut back to the party: Spark calls "MAYA!" through the noise and
// she turns and waves. Comment question; the "SPARK!" bubble returns (loop).
// Sources: Moray 1959 (QJEP); Wood & Cowan 1995 (JEP:LMC), 34.6% via Conway, Cowan & Bunting 2001 (PB&R).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: party = plum night + warm lanterns; lab = cream + mint tiles
const SKY1 = "#2a2150";
const SKY2 = "#5b3b7c";
const HEDGE = "#24493a";
const HEDGE2 = "#1b382c";
const LAWN = "#3d6b45";
const LAWN2 = "#355e3c";
const LANT = ["#ff9b3d", "#ffd23f", "#ff6f6f", "#ffb1d8"];
const GUEST = "#a9a3c4";
const MAYA = "#ff8a3d";
const SAMC = "#3f7fd8";
const LAB1 = "#fbf3df";
const LAB2 = "#d8efe3";
const TILE = "#c3e2d1";
const TABLE = "#b07a4f";
const TABLE2 = "#8a5a36";
const BLUE = "#3f7fd8";
const GREY = "#8c90a3";
const YEL = "#ffd23f";
const RED = "#e8484f";
const GREEN = "#2fb463";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  c0: C(0),
  name0: W(0, 5),
  c1: C(1),
  never1: W(1, 1),
  brain1: W(1, 7),
  stopped1: W(1, 9),
  c2: C(2),
  loud2: W(2, 2),
  one2: W(2, 7),
  friend2: W(2, 8),
  c3: C(3),
  far3: W(3, 2),
  says3: W(3, 4),
  name3: W(3, 6),
  c4: C(4),
  head4: W(4, 4),
  c5: C(5),
  ear5: W(5, 1),
  diff5: W(5, 4),
  c6: C(6),
  repeated6: W(6, 1),
  ignored6: W(6, 5),
  c7: C(7),
  ignored7: W(7, 2),
  said7: W(7, 4),
  name7: W(7, 7),
  c8: C(8),
  one8: W(8, 1),
  three8: W(8, 3),
  noticed8: W(8, 5),
  c9: C(9),
  brain9: W(9, 3),
  checks9: W(9, 5),
  ignored9: W(9, 6),
  c10: C(10),
  back10: W(10, 1),
  call10: W(10, 5),
  name10: W(10, 9),
  c11: C(11),
  word11: W(11, 1),
  attention11: W(11, 5),
};
const LOOP = VOICE_FRAMES - 14;
const LAB0 = T.c4 - 10; // shutter covers the frame here
const BACK = T.c10 - 2; // hard cut back to the party ("So, back at the party")

// staging (party)
const SX = 300; // Spark in the party (front)
const SXL = 175; // Spark in the lab
const MX = 640; // MAYA (front, scene 1)
const BGY = 1110; // back row ground line
const BS = 1.1; // back-row figures scale
const CALLX = 110; // the guest who calls "SPARK!"
const BACKX = [470, 790];
// staging (lab)
const SAMX = 650;
const SAMS = 1.7;
const SAMY = GROUND - 92.5 * SAMS;
const TABLE_TOP = 1110;
const V1 = { x: 330, y: 560 }; // VOICE 1 bubble (left)
const V2 = { x: 870, y: 560 }; // VOICE 2 bubble (right)

const SHOTS: Shot[] = [
  { f: 0, z: 1.18, at: [380, 900], e: "cut" }, // frame 0: Spark turning + SPARK! bubble
  { f: T.c1 - 8, z: 1.5, at: [SX + 40, HEADY + 80], e: "slow" }, // CU Spark
  { f: T.c2 - 8, z: 1.0, at: [540, 960], e: "slow" }, // WIDE: party, one friend
  { f: T.c3 - 4, z: 1.14, at: [420, 880], e: "slow" }, // slow drift towards the caller
  { f: LAB0, z: 1.0, at: [540, 960], e: "cut" }, // WIDE lab
  { f: T.c5 - 6, z: 1.12, at: [580, 860], e: "slow" }, // MED: two voices
  { f: T.c6 + 6, z: 1.08, at: [560, 860], e: "slow" }, // hold
  { f: T.c7 - 6, z: 1.25, at: [720, 880], e: "slow" }, // INSERT: voice 2 bubble says SAM!
  { f: T.c8 - 8, z: 1.04, at: [540, 860], e: "slow" }, // WIDE: 1 IN 3 card
  { f: T.c9 - 6, z: 1.12, at: [540, 880], e: "slow" }, // MED: magnifier + Spark
  { f: BACK, z: 1.0, at: [540, 960], e: "cut" }, // WIDE party again
  { f: T.c10 + 40, z: 1.06, at: [560, 920], e: "slow" },
  { f: T.c11 - 6, z: 1.5, at: [SX + 60, HEADY + 60], e: "slow" }, // CU question
  { f: LOOP, z: 1.18, at: [380, 900], e: "cut" }, // back into frame 0
];

// --- small pieces ---------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number; font?: string }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
  font = FONT.title,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={font} fontWeight={w} fontSize={s} fill={c}>
    {children}
  </text>
);

// speech bubble centred at (0,0), tail towards (tx, ty) relative
const Bubble: React.FC<{ w: number; h: number; fill: string; tx: number; ty: number; stroke?: string; children?: React.ReactNode }> = ({ w, h, fill, tx, ty, stroke = INK, children }) => {
  const bx = Math.max(-w / 2 + 30, Math.min(w / 2 - 30, tx * 0.35));
  return (
    <g>
      <path d={`M ${bx - 22} ${h / 2 - 4} L ${tx} ${ty} L ${bx + 22} ${h / 2 - 4} Z`} fill={fill} stroke={stroke} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.4} fill={fill} stroke={stroke} strokeWidth={5} />
      <rect x={bx - 20} y={h / 2 - 12} width={40} height={14} fill={fill} />
      {children}
    </g>
  );
};

// grey noise scribbles inside a bubble (no words: just sound)
const Noise: React.FC<{ f: number; w: number; seed: number; c?: string }> = ({ f, w, seed, c = "#6f7389" }) => (
  <g>
    {[-16, 16].map((dy, r) => {
      const pts = Array.from({ length: 9 }, (_, i) => {
        const x = -w / 2 + 26 + (i * (w - 52)) / 8;
        const y = dy + 9 * Math.sin(f / 4 + i * 1.7 + seed + r);
        return `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ");
      return <path key={r} d={pts} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />;
    })}
  </g>
);

const Party: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="v106-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKY1} />
        <stop offset="1" stopColor={SKY2} />
      </linearGradient>
      <radialGradient id="v106-glow">
        <stop offset="0" stopColor="#ffd98a" stopOpacity={0.55} />
        <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#v106-sky)" />
    {Array.from({ length: 22 }, (_, i) => (
      <circle key={i} cx={(i * 197) % 1080} cy={80 + ((i * 131) % 520)} r={i % 4 ? 3 : 5} fill="#fff6d0" opacity={0.4 + 0.4 * Math.sin(f / 18 + i)} />
    ))}
    <circle cx={880} cy={260} r={70} fill="#fff3c4" opacity={0.95} />
    <circle cx={905} cy={245} r={62} fill={SKY1} opacity={0.25} />
    {/* hedge */}
    <path d={`M 0 ${BGY - 230} ${Array.from({ length: 12 }, (_, i) => `Q ${i * 95 + 47} ${BGY - 300} ${(i + 1) * 95} ${BGY - 230}`).join(" ")} L 1080 ${BGY} L 0 ${BGY} Z`} fill={HEDGE} />
    <rect x={0} y={BGY - 120} width={1080} height={120} fill={HEDGE2} opacity={0.5} />
    {/* lantern wire + paper lanterns */}
    <path d="M -20 700 Q 270 800 540 730 Q 810 660 1100 760" fill="none" stroke="#1a1430" strokeWidth={5} />
    {[90, 260, 430, 620, 800, 980].map((x, i) => {
      const y = i < 3 ? 700 + 100 * Math.sin((x / 540) * Math.PI) * 0.9 - 10 : 735 + 30 * Math.sin(((x - 540) / 540) * Math.PI);
      const sway = 3 * Math.sin(f / 22 + i);
      return (
        <g key={x} transform={`translate(${x} ${y}) rotate(${sway})`}>
          <circle cx={0} cy={44} r={90} fill="url(#v106-glow)" />
          <line x1={0} y1={0} x2={0} y2={12} stroke="#1a1430" strokeWidth={4} />
          <ellipse cx={0} cy={44} rx={34} ry={36} fill={LANT[i % 4]} stroke={INK} strokeWidth={4} />
          <path d="M -30 44 L 30 44 M -22 20 L 22 20 M -22 68 L 22 68" stroke={INK} strokeWidth={2.5} opacity={0.35} />
        </g>
      );
    })}
    {/* lawn */}
    <rect x={0} y={BGY} width={1080} height={1920 - BGY} fill={LAWN} />
    <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill={LAWN2} />
    {Array.from({ length: 16 }, (_, i) => (
      <path key={i} d={`M ${30 + i * 68} ${GROUND + 70 + (i % 3) * 60} l 8 -22 l 8 22`} fill="none" stroke="#2c4f33" strokeWidth={4} strokeLinecap="round" />
    ))}
  </g>
);

// the loud speaker on the right, with music notes
const Speaker: React.FC<{ f: number }> = ({ f }) => {
  const thump = 1 + 0.05 * Math.max(0, Math.sin(f / 3.2));
  return (
    <g transform={`translate(985 ${BGY})`}>
      <rect x={-70} y={-250} width={140} height={250} rx={14} fill="#2b2b3a" {...K} />
      <circle cx={0} cy={-170} r={30 * thump} fill="#55556e" stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-80} r={48 * thump} fill="#55556e" stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-80} r={16} fill="#1c1c28" />
      {[0, 1, 2].map((i) => {
        const p = ((f + i * 22) % 66) / 66;
        return (
          <text key={i} x={-70 - 60 * p - i * 10} y={-260 - 160 * p} fontSize={52} fontWeight={900} fill={YEL} stroke={INK} strokeWidth={2} opacity={1 - p} fontFamily={FONT.title}>
            ♪
          </text>
        );
      })}
    </g>
  );
};

const Lab: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={LAB1} />
    {Array.from({ length: 10 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => <rect key={`${r}-${c}`} x={c * 124 + 4} y={260 + r * 84} width={116} height={76} rx={6} fill={(r + c) % 2 ? LAB2 : TILE} opacity={0.75} />),
    )}
    <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#e8d9b8" />
    <rect x={0} y={GROUND} width={1080} height={14} fill="#cdb98f" />
    {/* sign on the wall */}
    <g transform="translate(540 300)">
      <rect x={-210} y={-44} width={420} height={88} rx={14} fill={WHITE} {...K} strokeWidth={5} />
      <Txt y={18} s={46}>
        LISTENING TEST
      </Txt>
    </g>
  </g>
);

const LabTable: React.FC = () => (
  <g>
    <rect x={430} y={TABLE_TOP} width={440} height={30} rx={8} fill={TABLE} {...K} />
    <rect x={460} y={TABLE_TOP + 30} width={26} height={GROUND - TABLE_TOP - 30} fill={TABLE2} />
    <rect x={814} y={TABLE_TOP + 30} width={26} height={GROUND - TABLE_TOP - 30} fill={TABLE2} />
    {/* a small microphone on the table */}
    <g transform={`translate(560 ${TABLE_TOP})`}>
      <rect x={-6} y={-70} width={12} height={70} fill="#555a6e" />
      <rect x={-20} y={-110} width={40} height={52} rx={20} fill="#3a3e4f" {...K} strokeWidth={4} />
      <rect x={-34} y={-6} width={68} height={10} rx={5} fill="#555a6e" />
    </g>
  </g>
);

// headphones drawn on a head (centre c, radius r)
const Headphones: React.FC<{ c: [number, number]; r: number; lHot: number; rHot: number }> = ({ c, r, lHot, rHot }) => (
  <g>
    <path d={`M ${c[0] - r - 6} ${c[1]} A ${r + 8} ${r + 14} 0 0 1 ${c[0] + r + 6} ${c[1]}`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <rect x={c[0] - r - 22} y={c[1] - 26} width={30} height={56} rx={12} fill={lHot > 0.5 ? BLUE : "#4a4e60"} {...K} strokeWidth={4} />
    <rect x={c[0] + r - 8} y={c[1] - 26} width={30} height={56} rx={12} fill={rHot > 0.5 ? GREY : "#4a4e60"} {...K} strokeWidth={4} />
  </g>
);

// a small head with headphones for the 1 IN 3 card
const MiniHead: React.FC<{ hot: boolean }> = ({ hot }) => (
  <g>
    {hot && <circle r={72} fill={YEL} opacity={0.6} />}
    <circle r={44} fill={WHITE} stroke={INK} strokeWidth={6} />
    <circle cx={-14} cy={-4} r={5} fill={INK} />
    <circle cx={14} cy={-4} r={5} fill={INK} />
    {hot ? <ellipse cx={0} cy={18} rx={9} ry={11} fill={INK} /> : <path d="M -12 20 L 12 20" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
    <Headphones c={[0, 0]} r={44} lHot={0} rHot={0} />
    {hot && (
      <Txt x={56} y={-46} s={64} c={RED}>
        !
      </Txt>
    )}
  </g>
);

const Magnifier: React.FC = () => (
  <g>
    <line x1={42} y1={42} x2={110} y2={110} stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <line x1={42} y1={42} x2={110} y2={110} stroke="#a0643c" strokeWidth={12} strokeLinecap="round" />
    <circle r={62} fill="#ffffff55" stroke={INK} strokeWidth={10} />
    <circle r={62} fill="none" stroke="#c9d3e8" strokeWidth={4} />
  </g>
);

// --- sound ----------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [2, "pop", 0.25],
  [T.brain1, "tick", 0.15],
  [T.c2 - 8, "whoosh", 0.15],
  [T.says3 + 4, "pop", 0.3],
  [T.name3 + 3, "boing", 0.2],
  [LAB0 - 8, "whoosh_long", 0.25],
  [T.ear5, "pop", 0.2],
  [T.diff5, "pop", 0.2],
  [T.repeated6, "tick", 0.18],
  [T.ignored6, "swish", 0.18],
  [T.said7, "ding", 0.25],
  [T.name7 + 2, "pop", 0.2],
  [T.c8 - 6, "whoosh", 0.15],
  [T.one8, "pop", 0.25],
  [T.noticed8, "ding", 0.2],
  [T.checks9 - 4, "swish", 0.18],
  [T.ignored9 + 12, "ding", 0.2],
  [BACK, "whoosh", 0.2],
  [T.call10, "pop", 0.3],
  [T.name10 + 6, "ding", 0.25],
  [T.word11, "pop", 0.2],
  [LOOP, "pop", 0.25],
].map((c) => c as SfxCue);

export const S01Name: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const lab = f >= LAB0 && f < BACK;
  const party2 = f >= BACK && !loopBack; // back at the party (end)
  const party1 = !lab && !party2; // scene 1 (and the loop frames)
  const cam = camAt(f, SHOTS, VERTICAL);

  // ---------------- party 1 ----------------
  // the caller's SPARK! bubble: on at frame 0 (hook image), off from c2, pops again on "says your name", and at the loop
  const callOn = loopBack || f < T.c2 - 10 || (f >= T.says3 + 2 && f < LAB0);
  const callK = loopBack ? popIn(f, LOOP - 2) : f < T.c2 - 10 ? (f < T.c2 - 20 ? 1 : interpolate(f, [T.c2 - 20, T.c2 - 10], [1, 0], clamp)) : popIn(f, T.says3 + 2);
  const mayaTalk = f >= T.c2 + 10 && f < T.says3 + 6 ? popIn(f, T.c2 + 10) : 0;
  const bang = f >= T.name3 + 2 && f < LAB0 ? popIn(f, T.name3 + 2) : loopBack ? 1 : 0;

  // ---------------- lab ----------------
  const hideV = f >= T.c8 - 2 && f < T.c9 - 2;
  const v1K = lab && !hideV && f >= T.ear5 - 2 ? popIn(f, T.ear5 - 2) : 0;
  const v2K = lab && !hideV && f >= T.diff5 - 2 ? popIn(f, T.diff5 - 2) : 0;
  const words1 = ["CAT", "TREE", "SHOE", "BOOK", "RAIN", "CUP", "DOOR", "BIRD", "MILK", "SUN", "HAT", "LAMP"];
  const words2 = ["BOX", "FISH", "ROAD", "BELL", "COAT", "LEAF", "CAKE", "SHIP", "WALL", "SEED", "KITE", "ROSE"];
  const wi = Math.floor(Math.max(0, f - T.ear5) / 22);
  const nameOn = f >= T.said7; // voice 2 now says SAM!
  const w1 = words1[wi % words1.length];
  const w2 = nameOn && f < T.c8 - 8 ? "SAM!" : words2[wi % words2.length];
  const repK = lab && f >= T.repeated6 - 2 ? popIn(f, T.repeated6 - 2) : 0;
  const ignK = lab && f >= T.ignored6 - 2 ? popIn(f, T.ignored6 - 2) : 0;
  const samSays = lab && f >= T.repeated6 && f < T.c8 - 8; // SAM repeats voice 1
  const samWord = words1[Math.max(0, wi - 1) % words1.length];
  const v2Dim = lab ? ease(f, T.ignored6, T.ignored6 + 14, 0, 1) * (nameOn && f < T.c8 - 8 ? 0 : 1) : 0;
  const samTurn = lab && f >= T.name7 - 2 && f < T.c8 - 8;
  const samBang = samTurn ? popIn(f, T.name7 - 2) : 0;
  const cardK = lab && f >= T.c8 - 6 && f < T.c9 + 2 ? popIn(f, T.c8 - 6) * (1 - ease(f, T.c9 - 8, T.c9 + 2, 0, 1)) : 0;
  const hotK = f >= T.one8 ? 1 : 0;
  const numK = f >= T.three8 ? popIn(f, T.three8) : 0;
  const magK = lab && f >= T.checks9 - 6 ? popIn(f, T.checks9 - 6) : 0;
  // the magnifier sweeps across the grey voice-2 bubble and stops on the name
  const sweep = ease(f, T.checks9 - 4, T.ignored9 + 10, 0, 1);
  const magX = V2.x - 150 + 150 * sweep + 40 * Math.sin(sweep * Math.PI * 2);
  const magFound = f >= T.ignored9 + 10;
  const w2Mag = magFound ? "SAM!" : w2;

  // ---------------- party 2 ----------------
  const callMaya = party2 && f >= T.call10 - 2 ? popIn(f, T.call10 - 2) : 0;
  const mayaTurned = party2 && f >= T.name10 + 4;
  const askK = party2 && f >= T.word11 - 6 ? popIn(f, T.word11 - 6) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.recoil],
    [T.c1, G.thinkChin, "smooth"],
    [T.brain1 - 4, G.pointUp, "smooth"],
    [T.c2, G.rest, "smooth"],
    [T.loud2, G.present, "smooth"],
    [T.friend2, G.rest, "smooth"],
    [T.name3, G.recoil, "snap"],
    [LAB0, G.presentBoth, "snap"],
    [T.c5, G.doublePoint, "smooth"],
    [T.c6, G.pointSide, "smooth"],
    [T.c7, G.leanIn, "smooth"],
    [T.name7, G.recoil, "snap"],
    [T.c8, G.count1, "smooth"],
    [T.noticed8, G.present, "smooth"],
    [T.c9, G.pointUp, "smooth"],
    [T.ignored9, G.pointSide, "smooth"],
    [BACK, G.rest, "snap"],
    [T.call10 - 6, G.whisper, "smooth"],
    [T.name10, G.wave1, "smooth"],
    [T.name10 + 12, G.wave2, "smooth"],
    [T.c11, G.beckon, "smooth"],
    [LOOP - 4, G.recoil, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "shock";
    if (t < T.c1) return "shock";
    if (t < T.stopped1) return "curious";
    if (t < T.c2) return "smug";
    if (t < T.name3) return "happy";
    if (t < LAB0) return "shock";
    if (t < T.c7) return "curious";
    if (t < T.c8) return "excited";
    if (t < T.c9) return "thinking";
    if (t < BACK) return "smug";
    if (t < T.c11) return "determined";
    if (t < T.attention11) return "curious";
    return "laugh";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.brain1, 24), bulbPulse(t, T.brain9, 30), bulbPulse(t, T.name10, 24));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.name0, 2));
    q = addPose(q, nod(t, T.friend2 - 20, 2));
    q = addPose(q, hop(t, T.name3 + 2, 14));
    q = addPose(q, nod(t, T.noticed8, 1));
    q = addPose(q, hop(t, T.name10 + 8, 14));
    q = addPose(q, nod(t, T.attention11, 1));
    const inLab = t >= LAB0 && t < BACK;
    return { ...q, x: inLab ? SXL : SX };
  };
  const sparkFacing = (t: number) => {
    if (t >= LOOP - 2) return -1;
    if (t >= LAB0) return 1;
    if (t < T.c2 - 8 || t >= T.name3 + 2) return -1;
    return 1;
  };

  // generic guest keys (small talk gestures)
  const guestKeys = (o: number) =>
    gestureKeys([
      [0, G.present],
      [30 + o, G.rest, "smooth"],
      [70 + o, G.shrugBig, "smooth"],
      [110 + o, G.present, "smooth"],
      [160 + o, G.rest, "smooth"],
      [220 + o, G.pointSide, "smooth"],
      [280 + o, G.present, "smooth"],
      [350 + o, G.rest, "smooth"],
      [BACK + o, G.present, "smooth"],
      [BACK + 60 + o, G.shrugBig, "smooth"],
      [BACK + 130 + o, G.rest, "smooth"],
      [BACK + 190 + o, G.present, "smooth"],
    ]);
  const guestMod = (o: number) => (t: number, p: Pose) => addPose(p, idle(t + o, 4));
  const mayaKeys = gestureKeys([
    [0, G.present],
    [T.c2 + 10, G.present],
    [T.c2 + 40, G.shrugBig, "smooth"],
    [T.c2 + 80, G.present, "smooth"],
    [BACK, G.present, "snap"],
    [T.name10 + 4, G.wave1, "snap"],
    [T.name10 + 14, G.wave2, "smooth"],
    [T.name10 + 24, G.wave1, "smooth"],
    [T.name10 + 34, G.wave2, "smooth"],
    [T.c11, G.rest, "smooth"],
  ]);
  const samKeys = gestureKeys([
    [0, G.rest],
    [T.repeated6, G.present, "smooth"],
    [T.name7, G.recoil, "snap"],
    [T.c8, G.rest, "smooth"],
  ]);

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={sparkFacing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
  );

  const guest = (x: number, o: number, label?: string) => (
    <Actor key={x} f={f} color={GUEST} scale={BS} base={{ x, y: BGY - 92.5 * BS }} keys={guestKeys(o)} mod={guestMod(o)} facing={x < 540 ? 1 : -1} face="eyes" trails={false} label={label} />
  );

  const noiseBubble = (x: number, y: number, seed: number, tx: number, ty: number, w = 200) => (
    <g key={`nb${x}`} transform={`translate(${x} ${y}) rotate(${3 * Math.sin(f / 20 + seed)})`}>
      <Bubble w={w} h={96} fill="#e7e5f1" tx={tx} ty={ty} stroke="#4a4560">
        <Noise f={f} w={w} seed={seed} />
      </Bubble>
    </g>
  );

  const partySvg = (
    <>
      <Party f={f} />
      <Speaker f={f} />
      {party1 && (
        <>
          {guest(CALLX, 0)}
          {guest(BACKX[0], 17)}
          {guest(BACKX[1], 35)}
          {/* grey noise bubbles from the crowd */}
          {noiseBubble(BACKX[0] + 10, 800, 1, -10, 120)}
          {noiseBubble(BACKX[1] - 20, 760, 4, 20, 160)}
          {!callOn && noiseBubble(CALLX + 60, 790, 7, -40, 130, 180)}
          {/* MAYA (front) */}
          <Actor f={f} color={MAYA} scale={1.7} base={{ x: MX, y: GROUND - 92.5 * 1.7 }} keys={mayaKeys} mod={(t, p) => addPose(p, idle(t, 3))} facing={-1} face="happy" trails={false} label="MAYA" />
          {mayaTalk > 0.01 && (
            <g transform={`translate(${MX + 150} ${HEADY - 150}) scale(${mayaTalk})`}>
              <Bubble w={220} h={110} fill={WHITE} tx={-110} ty={120}>
                {[-22, 4, 30].map((y, i) => (
                  <rect key={y} x={-80} y={y - 6} width={[160, 130, 90][i]} height={12} rx={6} fill={INK} opacity={0.75} />
                ))}
              </Bubble>
            </g>
          )}
          {sparkEl}
          {bang > 0.01 && (
            <g transform={`translate(${SX - 30} ${HEADY - 150}) scale(${bang}) rotate(${wobble(f, T.name3 + 2, 8)})`}>
              <Txt y={0} s={110} c={YEL}>
                !
              </Txt>
            </g>
          )}
          {/* the caller's bright name bubble */}
          {callOn && callK > 0.01 && (
            <g transform={`translate(${CALLX + 150} ${720}) scale(${callK}) rotate(${-4 + wobble(f, loopBack ? LOOP - 2 : T.says3 + 2, 6)})`}>
              <circle r={190} fill={YEL} opacity={0.22} />
              <Bubble w={330} h={130} fill={YEL} tx={-110} ty={150}>
                <Txt y={26} s={76}>
                  SPARK!
                </Txt>
              </Bubble>
            </g>
          )}
        </>
      )}
      {party2 && (
        <>
          {guest(BACKX[0], 17)}
          {guest(250, 40)}
          {noiseBubble(BACKX[0] + 10, 800, 2, -10, 120)}
          {noiseBubble(250, 760, 5, 10, 150, 180)}
          {/* MAYA now in the back crowd, facing away until her name */}
          <Actor
            f={f}
            color={MAYA}
            scale={BS}
            base={{ x: 790, y: BGY - 92.5 * BS }}
            keys={mayaKeys}
            mod={(t, p) => addPose(addPose(p, idle(t, 3)), mayaTurned ? hop(t, T.name10 + 4, 10) : {})}
            facing={mayaTurned ? -1 : 1}
            face="happy"
            trails={false}
            label="MAYA"
          />
          {!mayaTurned && noiseBubble(880, 770, 8, -30, 150, 170)}
          {sparkEl}
          {callMaya > 0.01 && (
            <g transform={`translate(${SX + 250} ${HEADY - 120}) scale(${callMaya}) rotate(${3 + wobble(f, T.call10 - 2, 6)})`}>
              <circle r={180} fill={YEL} opacity={0.22} />
              <Bubble w={300} h={124} fill={YEL} tx={-120} ty={130}>
                <Txt y={26} s={74}>
                  MAYA!
                </Txt>
              </Bubble>
            </g>
          )}
          {askK > 0.01 && (
            <g transform={`translate(${SX + 40} ${HEADY - 420}) scale(${askK}) rotate(${wobble(f, T.word11 - 6, 6)})`}>
              <Bubble w={200} h={170} fill={WHITE} tx={-30} ty={150}>
                <Txt y={36} s={110} c={RED}>
                  ?
                </Txt>
              </Bubble>
            </g>
          )}
        </>
      )}
    </>
  );

  // lab: SAM with headphones at the table
  const labSvg = (
    <>
      <Lab />
      {/* cables from the two voice bubbles */}
      <Actor
        f={f}
        color={SAMC}
        scale={SAMS}
        base={{ x: SAMX, y: SAMY }}
        keys={samKeys}
        mod={(t, p) => {
          let q = addPose(p, idle(t, 3));
          if (samTurn) q = addPose(q, { head: -14 } as Partial<Pose>);
          return q;
        }}
        facing={-1}
        face={samTurn ? "happy" : "eyes"}
        trails={false}
        label="SAM"
      >
        {(j) => {
          const lEar: [number, number] = [j.headC[0] - j.headR - 8, j.headC[1]];
          const rEar: [number, number] = [j.headC[0] + j.headR + 8, j.headC[1]];
          return (
            <>
              <Headphones c={j.headC} r={j.headR} lHot={v1K} rHot={v2K * (1 - v2Dim)} />
              {/* dotted sound paths from each bubble into each ear */}
              {v1K > 0.01 && (
                <path
                  d={`M ${V1.x + 60} ${V1.y + 80} Q ${(V1.x + lEar[0]) / 2} ${lEar[1] - 40} ${lEar[0] - 18} ${lEar[1]}`}
                  fill="none"
                  stroke={BLUE}
                  strokeWidth={9}
                  strokeDasharray="4 20"
                  strokeDashoffset={-f * 2}
                  strokeLinecap="round"
                  opacity={v1K}
                />
              )}
              {v2K > 0.01 && (
                <path
                  d={`M ${V2.x - 60} ${V2.y + 80} Q ${(V2.x + rEar[0]) / 2} ${rEar[1] - 40} ${rEar[0] + 18} ${rEar[1]}`}
                  fill="none"
                  stroke={nameOn && f < T.c8 - 8 ? "#e0b000" : GREY}
                  strokeWidth={9}
                  strokeDasharray="4 20"
                  strokeDashoffset={-f * 2}
                  strokeLinecap="round"
                  opacity={v2K * (1 - 0.5 * v2Dim)}
                />
              )}
              {samSays && (
                <g transform={`translate(${j.headC[0] - 200} ${j.headC[1] + 10})`}>
                  <Bubble w={190} h={84} fill={WHITE} tx={130} ty={30}>
                    <Txt y={16} s={44} c={BLUE}>
                      {samWord}
                    </Txt>
                  </Bubble>
                </g>
              )}
              {samBang > 0.01 && (
                <g transform={`translate(${j.headC[0] + 70} ${j.headC[1] - 120}) scale(${samBang})`}>
                  <Txt y={0} s={100} c={RED}>
                    !
                  </Txt>
                </g>
              )}
            </>
          );
        }}
      </Actor>
      <LabTable />
      {/* VOICE 1 bubble (blue, left) */}
      {v1K > 0.01 && (
        <g transform={`translate(${V1.x} ${V1.y}) scale(${v1K})`}>
          <Bubble w={300} h={150} fill="#dbe8ff" tx={80} ty={110} stroke={INK}>
            <Txt y={-24} s={30} c={BLUE}>
              VOICE 1
            </Txt>
            <Txt y={40} s={56}>
              {w1}
            </Txt>
          </Bubble>
          {repK > 0.01 && (
            <g transform={`translate(0 -132) scale(${repK})`}>
              <rect x={-130} y={-36} width={260} height={72} rx={36} fill={GREEN} {...K} strokeWidth={5} />
              <Txt y={14} s={40} c={WHITE}>
                REPEAT ✓
              </Txt>
            </g>
          )}
        </g>
      )}
      {/* VOICE 2 bubble (grey, right) */}
      {v2K > 0.01 && (
        <g transform={`translate(${V2.x} ${V2.y}) scale(${v2K})`} opacity={magFound && f >= T.c9 ? 1 : 1 - 0.35 * v2Dim}>
          <Bubble w={300} h={150} fill={nameOn && (f < T.c8 - 8 || magFound) ? YEL : "#e6e6ee"} tx={-80} ty={110} stroke={INK}>
            <Txt y={-24} s={30} c="#5d6270">
              VOICE 2
            </Txt>
            <Txt y={40} s={56} c={nameOn && (f < T.c8 - 8 || magFound) ? INK : "#5d6270"}>
              {f >= T.c9 ? w2Mag : w2}
            </Txt>
          </Bubble>
          {ignK > 0.01 && (
            <g transform={`translate(0 -132) scale(${ignK})`}>
              <rect x={-130} y={-36} width={260} height={72} rx={36} fill="#7a7f93" {...K} strokeWidth={5} />
              <Txt y={14} s={40} c={WHITE}>
                IGNORE ✗
              </Txt>
            </g>
          )}
        </g>
      )}
      {magK > 0.01 && (
        <g transform={`translate(${magX} ${V2.y + 30}) scale(${magK}) rotate(${-10 + wobble(f, T.ignored9 + 10, 8)})`}>
          <Magnifier />
        </g>
      )}
      {sparkEl}
      {/* 1 IN 3 card */}
      {cardK > 0.01 && (
        <g transform={`translate(540 ${640}) scale(${cardK})`}>
          <rect x={-380} y={-200} width={760} height={400} rx={30} fill={WHITE} {...K} />
          {[-230, 0, 230].map((x, i) => (
            <g key={x} transform={`translate(${x} -40)`}>
              <MiniHead hot={i === 0 && hotK > 0} />
            </g>
          ))}
          {numK > 0.01 && (
            <g transform={`translate(0 130) scale(${numK})`}>
              <Txt y={0} s={88} c={RED}>
                1 IN 3
              </Txt>
            </g>
          )}
          {f >= T.noticed8 && (
            <Txt x={-230} y={52} s={30} c={INK}>
              NOTICED
            </Txt>
          )}
        </g>
      )}
    </>
  );

  const html = (
    <>
      {(f < T.c1 - 4 || loopBack) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 118,
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>YOUR</div>
          <div style={{ color: YEL, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>NAME?!</div>
        </div>
      )}
      {f >= 300 && f < LOOP - 4 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1700,
              transform: "translate(-50%,-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 22,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            Moray 1959 · Wood &amp; Cowan 1995 · lab tests with headphones · pictures = illustration
          </div>
          <div
            style={{
              position: "absolute",
              right: 96,
              top: 1745,
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 27,
              color: YEL,
              WebkitTextStroke: `1px ${INK}`,
              letterSpacing: 2,
              opacity: 0.95,
            }}
          >
            YOUR BRAIN DID THIS
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1500}
        cues={VOICE_CUES}
        hi={["name", "noisy", "never", "brain", "one", "friend.", "headphones.", "different", "repeated", "ignored", "name.", "three", "noticed", "checks", "party,", "call", "attention?"]}
      />
      <Transition f={f} at={LAB0} kind="shutter" size={VERTICAL} colors={[LAB2, YEL, SKY2]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: lab ? LAB1 : SKY1 }} />} cam={cam} hits={[]} power={4} svg={lab ? labSvg : partySvg} html={html} />;
};
