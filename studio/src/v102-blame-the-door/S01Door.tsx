import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle, type Pose } from "../stickman/stick";
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

// V102 · Why you forget why you walked into a room (Your brain did this, ~29 s)
// World: a sunny dollhouse-cutaway apartment: mint LIVING ROOM | partition with one open doorway | butter KITCHEN.
// Metaphor: the doorway is a guillotine for thoughts. Spark's ✂ thought bubble hits the wall above the door and
// is sliced; the top half is filed in the SCENE 1 drawer. Shutter → blueprint lab lanes (DOOR vs NO DOOR), back in
// the kitchen: CATCH, three busy bubbles become juggling balls, he drops two and carries ONE thought through the
// door intact. The comment question cuts back into frame 0.
// Sources: Radvansky, Krawietz & Tamplin 2011 (QJEP 64:1632); McFadyen et al. 2021 (BMC Psychology 9:41).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 197;
const KX = 790; // kitchen spot
const LX = 300; // living-room spot
const LAB_X = 200;

// partition (cutaway wall between the rooms) + doorway
const PX0 = 600;
const PX1 = 680;
const CEIL = 230;
const LINTEL = 740;
const BUB_DX = 112; // thought bubble offset in front of Spark
const BUB_R = 84;

// palette: sunny apartment
const MINT = "#bfe8d6";
const MINT2 = "#9fd6c0";
const BUTTER = "#ffe9a8";
const BUTTER2 = "#f7d77a";
const WOOD = "#c98b55";
const WOOD2 = "#9a6436";
const CREAM = "#fffaf0";
const CORAL = "#ff6b5a";
const SKY = "#8fd3ff";
const NAVY = "#183a5a";
const NAVY2 = "#22507a";
const BLUE_LN = "#6fb3e6";
const GREEN = "#2fbf71";
const RED = "#e63946";
const GOLD = "#ffd23f";
const ORANGE = "#ff8c42";
const INK = COL.ink;

const T = {
  forgot: W(0, 2),
  blame: W(0, 4),
  door0: W(0, 6),
  c1: C(1),
  memory: W(1, 4),
  why: C(2),
  brain2: W(2, 2),
  scenes: W(2, 6),
  c3: C(3),
  ends: W(3, 2),
  scene3: W(3, 4),
  c4: C(4),
  room4: W(4, 2),
  filed: W(4, 4),
  lab: C(5),
  carried: W(5, 4),
  rooms5: W(5, 7),
  c6: C(6),
  after: W(6, 1),
  forgot6: W(6, 5),
  more: W(6, 6),
  c7: C(7),
  nodoor: W(7, 2),
  fewer: W(7, 4),
  mistakes: W(7, 5),
  but: C(8),
  catch: W(8, 6),
  c9: C(9),
  minds: W(9, 5),
  busy: W(9, 7),
  c10: C(10),
  juggling: W(10, 2),
  three10: W(10, 3),
  c11: C(11),
  carry: W(11, 1),
  one: W(11, 2),
  not: W(11, 4),
  three11: W(11, 5),
  c12: C(12),
  forget12: W(12, 3),
  room12: W(12, 7),
};
const LOOP = VOICE_FRAMES - 14;
const REW0 = T.why; // rewind gag
const REW1 = T.why + 26;
const WALK0 = T.c3 - 4; // walk right with the ✂ thought
const WALK1 = T.ends + 34;
// the bubble's top half hits the partition when its centre reaches PX0 - BUB_R
const xWalkR = (t: number) => interpolate(t, [WALK0, WALK1], [LX, KX], clamp);
const SLICE = (() => {
  for (let t = WALK0; t < WALK1; t++) if (xWalkR(t) + BUB_DX >= PX0 - BUB_R) return t;
  return T.ends;
})();
const LAB0 = T.lab;
const LAB1 = T.but;
const WALKB0 = T.carry; // walk back (left) with ONE thought in his hands
const WALKB1 = T.three11 + 10;
const DOOR_PASS = Math.round(WALKB0 + ((KX - 640) / (KX - LX)) * (WALKB1 - WALKB0));

const sparkX = (t: number) => {
  if (t >= LOOP - 2) return KX;
  if (t < REW0) return KX;
  if (t < WALK0) return interpolate(t, [REW0, REW1], [KX, LX], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  if (t < LAB0) return xWalkR(t);
  if (t < LAB1) return LAB_X;
  if (t < WALKB0) return KX;
  return interpolate(t, [WALKB0, WALKB1], [KX, LX], clamp);
};
const moving = (t: number) => (t >= WALK0 && t < WALK1) || (t >= WALKB0 && t < WALKB1 && t < LOOP - 2);
const facingAt = (t: number) => {
  if (t >= LOOP - 2) return 1;
  if (t < T.blame) return 1;
  if (t < REW0) return -1;
  if (t < T.c4) return 1;
  if (t < LAB0) return -1;
  if (t < WALKB0) return 1;
  if (t < WALKB1) return -1;
  return 1;
};

const SHOTS: Shot[] = [
  { f: 0, z: 1.42, at: [760, 960], e: "cut" }, // frame 0: Spark just through the doorway, empty "?" bubble
  { f: T.forgot - 2, z: 1.95, at: [KX + 40, HEADY - 40], e: "snap" }, // CU: "Forgot why?"
  { f: T.blame - 2, z: 1.6, at: [640, 820], e: "snap" }, // INSERT: the door
  { f: T.c1, z: 2.15, at: [KX, HEADY + 10], e: "cut" }, // CU: "You didn't lose your memory."
  { f: REW0, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: rewind gag + SCENE 1 / SCENE 2
  { f: T.scenes - 2, z: 1.1, at: [540, 900], e: "snap" },
  { f: T.c3, z: 1.4, at: [470, 900], e: "cut" }, // MED: walking with the ✂ thought
  { f: SLICE - 3, z: 1.85, at: [560, 760], e: "snap" }, // INSERT: the slice
  { f: T.c4, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: the half flies into the drawer
  { f: T.filed, z: 1.2, at: [470, 1000], e: "snap" },
  { f: LAB0, z: 1.0, at: [540, 960], e: "cut" }, // shutter → WIDE lab
  { f: T.carried, z: 1.2, at: [600, 760], e: "smooth" },
  { f: T.c6, z: 1.55, at: [660, 500], e: "cut" }, // INSERT: top lane, ✗ ✗
  { f: T.c7, z: 1.55, at: [660, 830], e: "cut" }, // INSERT: bottom lane
  { f: T.fewer + 4, z: 1.12, at: [540, 860], e: "snap" }, // MED
  { f: LAB1, z: 2.05, at: [KX, HEADY], e: "cut" }, // CU: "But… a catch"
  { f: T.c9, z: 1.3, at: [KX - 10, 820], e: "cut" }, // MED: three bubbles
  { f: T.c9 + 3, z: 1.48, at: [KX - 10, 800], e: "slow" }, // slow push
  { f: T.c10, z: 1.05, at: [600, 940], e: "cut" }, // WIDE: juggling
  { f: T.c11, z: 1.3, at: [700, 980], e: "cut" }, // MED: drops two, holds one
  { f: DOOR_PASS - 8, z: 1.6, at: [640, 960], e: "snap" }, // INSERT: through the door, intact
  { f: T.c12, z: 2.0, at: [LX + 30, HEADY - 10], e: "cut" }, // CU: the comment question
  { f: LOOP, z: 1.42, at: [760, 960], e: "cut" }, // back into frame 0
];

// --- background: sunny cutaway apartment ------------------------------------------------------------------------
const Apartment: React.FC<{ f: number; signK: number; drawer: number }> = ({ f, signK, drawer }) => (
  <g>
      <rect width={1080} height={1920} fill="#fff4e0" />
      {/* outside sky above the cutaway roof */}
      <rect width={1080} height={CEIL} fill={SKY} />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${((f * 0.6 + i * 560) % 1300) - 160} ${90 + i * 50})`}>
          <ellipse cx={0} cy={0} rx={80} ry={30} fill="#fff" />
          <ellipse cx={50} cy={-14} rx={50} ry={28} fill="#fff" />
        </g>
      ))}
      {/* living room wall */}
      <rect x={0} y={CEIL} width={PX0} height={GROUND - CEIL} fill={MINT} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={i * 90 + 30} y1={CEIL} x2={i * 90 + 30} y2={GROUND} stroke={MINT2} strokeWidth={10} opacity={0.6} />
      ))}
      {/* kitchen wall: tiles */}
      <rect x={PX1} y={CEIL} width={1080 - PX1} height={GROUND - CEIL} fill={BUTTER} />
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 6 }, (_, c) => (
          <rect key={`${r}-${c}`} x={PX1 + 8 + c * 70} y={880 + r * 52} width={62} height={44} rx={6} fill={BUTTER2} opacity={0.55} />
        )),
      )}
      {/* kitchen window */}
      <rect x={760} y={420} width={220} height={200} rx={10} fill={SKY} {...K} />
      <line x1={870} y1={420} x2={870} y2={620} stroke={INK} strokeWidth={6} />
      <line x1={760} y1={520} x2={980} y2={520} stroke={INK} strokeWidth={6} />
      {/* fridge */}
      <rect x={905} y={930} width={150} height={GROUND - 930} rx={14} fill={CREAM} {...K} />
      <line x1={905} y1={1050} x2={1055} y2={1050} stroke={INK} strokeWidth={5} />
      <rect x={918} y={980} width={12} height={50} rx={5} fill={INK} />
      <rect x={918} y={1080} width={12} height={70} rx={5} fill={INK} />
      {/* living room: framed picture, lamp, filing cabinet */}
      <rect x={250} y={440} width={190} height={140} rx={6} fill={CREAM} {...K} />
      <path d="M 268 560 L 320 490 L 360 535 L 395 500 L 425 560 Z" fill={MINT2} stroke={INK} strokeWidth={4} />
      <circle cx={400} cy={475} r={16} fill={GOLD} stroke={INK} strokeWidth={4} />
      <line x1={500} y1={GROUND} x2={500} y2={1000} stroke={INK} strokeWidth={7} />
      <path d="M 450 1000 L 550 1000 L 525 930 L 475 930 Z" fill={CORAL} {...K} />
      <ellipse cx={500} cy={GROUND - 4} rx={36} ry={10} fill={INK} />
      <rect x={70} y={970} width={170} height={GROUND - 970} rx={8} fill="#b8c6cf" {...K} />
      <rect x={80 - drawer * 70} y={990} width={150} height={130} rx={6} fill="#d6e1e8" {...K} />
      <rect x={130 - drawer * 70} y={1040} width={50} height={14} rx={6} fill={INK} />
      <text x={155 - drawer * 70} y={1100} textAnchor="middle" fontFamily={FONT.comic} fontSize={30} fill={INK}>
        SCENE 1
      </text>
      <rect x={80} y={1135} width={150} height={130} rx={6} fill="#d6e1e8" {...K} />
      <rect x={130} y={1185} width={50} height={14} rx={6} fill={INK} />
      {/* partition with the open doorway (cutaway) */}
      <rect x={PX0} y={CEIL} width={PX1 - PX0} height={LINTEL - CEIL} fill="#f4f0e6" {...K} />
      <rect x={PX0 - 10} y={LINTEL - 22} width={PX1 - PX0 + 20} height={26} rx={4} fill={WOOD} {...K} />
      <rect x={PX0 - 10} y={LINTEL} width={14} height={GROUND - LINTEL} fill={WOOD} {...K} strokeWidth={4} />
      <rect x={PX1 - 4} y={LINTEL} width={14} height={GROUND - LINTEL} fill={WOOD} {...K} strokeWidth={4} />
      {/* the door slab swung open into the kitchen */}
      <path d={`M ${PX1 + 10} ${LINTEL + 6} L ${PX1 + 70} ${LINTEL + 40} L ${PX1 + 70} ${GROUND - 20} L ${PX1 + 10} ${GROUND}`} fill={WOOD2} {...K} />
      <circle cx={PX1 + 56} cy={1030} r={8} fill={GOLD} stroke={INK} strokeWidth={3} />
      {/* roof line */}
      <rect x={-10} y={CEIL - 18} width={1100} height={22} fill={CORAL} {...K} />
      {/* SCENE signs */}
      {signK > 0.01 && (
        <>
          <g transform={`translate(300 330) scale(${signK}) rotate(${-4 + wobble(f, 0, 0)})`}>
            <rect x={-120} y={-44} width={240} height={88} rx={12} fill={INK} />
            <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={MINT}>
              SCENE 1
            </text>
          </g>
          <g transform={`translate(880 330) scale(${signK}) rotate(4)`}>
            <rect x={-120} y={-44} width={240} height={88} rx={12} fill={INK} />
            <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={BUTTER}>
              SCENE 2
            </text>
          </g>
        </>
      )}
      {/* floor */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill={WOOD} />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={0} y1={GROUND + 40 + i * 70} x2={1080} y2={GROUND + 40 + i * 70} stroke={WOOD2} strokeWidth={4} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// --- lab: blueprint with two lanes -------------------------------------------------------------------------------
const LANE_A = 600;
const LANE_B = 940;
const LDOOR = 640;
const LabBg: React.FC<{ f: number }> = ({ f }) => (
  <g>
      <rect width={1080} height={1920} fill={NAVY} />
      {Array.from({ length: 28 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 72} x2={1080} y2={i * 72} stroke={NAVY2} strokeWidth={2} />
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <line key={`v${i}`} x1={i * 72 + ((f * 0.3) % 72)} y1={0} x2={i * 72 + ((f * 0.3) % 72)} y2={1920} stroke={NAVY2} strokeWidth={2} />
      ))}
      {[LANE_A, LANE_B].map((y) => (
        <g key={y}>
          <rect x={300} y={y - 240} width={680} height={240} fill="#1f4a72" stroke={BLUE_LN} strokeWidth={5} strokeDasharray="14 8" />
          <line x1={300} y1={y} x2={980} y2={y} stroke={CREAM} strokeWidth={7} />
        </g>
      ))}
      {/* the doorway on lane A */}
      <rect x={LDOOR - 40} y={LANE_A - 240} width={80} height={44} fill={CREAM} opacity={0.9} />
      <line x1={LDOOR - 40} y1={LANE_A - 196} x2={LDOOR - 40} y2={LANE_A} stroke={CREAM} strokeWidth={8} />
      <line x1={LDOOR + 40} y1={LANE_A - 196} x2={LDOOR + 40} y2={LANE_A} stroke={CREAM} strokeWidth={8} />
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#10283f" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={BLUE_LN} strokeWidth={6} />
  </g>
);

// --- props ------------------------------------------------------------------------------------------------------
const Scissors: React.FC<{ s?: number; col?: string }> = ({ s = 1, col = INK }) => (
  <g transform={`scale(${s})`}>
    <line x1={-6} y1={8} x2={34} y2={-26} stroke={col} strokeWidth={7} strokeLinecap="round" />
    <line x1={-6} y1={-8} x2={34} y2={26} stroke={col} strokeWidth={7} strokeLinecap="round" />
    <circle cx={-20} cy={-14} r={12} fill="none" stroke={col} strokeWidth={6} />
    <circle cx={-20} cy={14} r={12} fill="none" stroke={col} strokeWidth={6} />
  </g>
);

// thought bubble; `part` = "full" | "top" | "bottom" (sliced halves), content = scissors / "?" / a word
const Bubble: React.FC<{ x: number; y: number; k: number; r?: number; part?: "full" | "top" | "bottom"; content: "scissors" | "q" | string; tail?: [number, number] | null; rot?: number; col?: string }> = ({
  x,
  y,
  k,
  r = BUB_R,
  part = "full",
  content,
  tail,
  rot = 0,
  col = CREAM,
}) => {
  if (k <= 0.01) return null;
  const clip = part === "top" ? `M ${-r - 20} ${-r - 20} L ${r + 20} ${-r - 20} L ${r + 20} 0 L ${-r - 20} 0 Z` : part === "bottom" ? `M ${-r - 20} 0 L ${r + 20} 0 L ${r + 20} ${r + 20} L ${-r - 20} ${r + 20} Z` : null;
  const id = `v102clip-${part}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g>
      {tail && part !== "top" && (
        <>
          <circle cx={(x * 2 + tail[0]) / 3} cy={(y * 0.9 + tail[1] * 1.1) / 2 + 26} r={12 * k} fill={col} {...K} strokeWidth={4} />
          <circle cx={(x + tail[0] * 2) / 3} cy={(y * 0.4 + tail[1] * 1.6) / 2 + 10} r={8 * k} fill={col} {...K} strokeWidth={4} />
        </>
      )}
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
        {clip && (
          <defs>
            <clipPath id={id}>
              <path d={clip} />
            </clipPath>
          </defs>
        )}
        <g clipPath={clip ? `url(#${id})` : undefined}>
          <path
            d={`M ${-r} 0 C ${-r} ${-r * 0.7} ${-r * 0.6} ${-r} 0 ${-r} C ${r * 0.6} ${-r} ${r} ${-r * 0.7} ${r} 0 C ${r} ${r * 0.7} ${r * 0.6} ${r} 0 ${r} C ${-r * 0.6} ${r} ${-r} ${r * 0.7} ${-r} 0 Z`}
            fill={col}
            {...K}
          />
          {content === "scissors" ? (
            <g transform={`translate(-4 -2)`}>
              <Scissors s={r / 60} />
            </g>
          ) : content === "q" ? (
            <text y={r * 0.36} textAnchor="middle" fontFamily={FONT.comic} fontSize={r * 1.15} fill={INK}>
              ?
            </text>
          ) : (
            <text y={r * 0.16} textAnchor="middle" fontFamily={FONT.comic} fontSize={content.length > 5 ? r * 0.42 : r * 0.5} fill={INK}>
              {content}
            </text>
          )}
        </g>
        {clip && <line x1={-r - 4} y1={0} x2={r + 4} y2={0} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
      </g>
    </g>
  );
};

const Mark: React.FC<{ x: number; y: number; k: number; ok: boolean }> = ({ x, y, k, ok }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <circle r={40} fill={ok ? GREEN : RED} {...K} strokeWidth={5} />
      {ok ? (
        <path d="M -18 2 L -4 16 L 20 -14" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      )}
    </g>
  ) : null;

export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.4],
  [T.forgot - 2, "whoosh", 0.3],
  [T.forgot + 4, "boing", 0.3],
  [T.blame - 2, "swish", 0.35],
  [T.door0, "thud", 0.5],
  [T.c1, "whoosh", 0.25],
  [T.memory, "ding", 0.45],
  [REW0, "whoosh_long", 0.45],
  [REW0 + 6, "scribble", 0.3],
  [T.scenes, "pop", 0.45],
  [T.scenes + 5, "pop", 0.4],
  [T.c3, "swish", 0.25],
  [SLICE - 3, "whoosh", 0.35],
  [SLICE, "slam", 0.6],
  [SLICE + 1, "shatter", 0.25],
  [T.c4, "swish", 0.3],
  [T.filed + 8, "thud", 0.55],
  [LAB0 - 6, "whoosh_long", 0.5],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [LAB0 + 24 + i * 20, "tick", 0.25]),
  [T.forgot6, "buzz", 0.45],
  [T.more, "buzz", 0.4],
  [T.c7, "whoosh", 0.25],
  [T.fewer, "ding", 0.35],
  [T.fewer + 8, "ding", 0.35],
  [T.mistakes + 2, "buzz", 0.25],
  [LAB1, "whoosh", 0.3],
  [T.catch, "stamp", 0.6],
  [T.c9 + 6, "pop", 0.4],
  [T.c9 + 14, "pop", 0.4],
  [T.c9 + 22, "pop", 0.4],
  [T.busy, "swirl", 0.4],
  [T.c10, "whoosh", 0.25],
  ...Array.from({ length: 5 }, (_, i): SfxCue => [T.c10 + 8 + i * 11, "boing", 0.18]),
  [T.one, "pop", 0.35],
  [T.not, "boing", 0.3],
  [T.not + 6, "boing", 0.25],
  [DOOR_PASS, "ding", 0.55],
  [T.c12, "whoosh", 0.3],
  [T.room12, "pop", 0.3],
  [LOOP, "pop", 0.35],
];

const walkLegs = (t: number): Partial<Pose> => {
  const w = walkCycle(t, 0.42);
  return { ll1: w.ll1, ll2: w.ll2, rl1: w.rl1, rl2: w.rl2 };
};
const HOLDP: Partial<Pose> = { ra1: 26, ra2: 58, la1: -26, la2: -58, head: 6 };
const JUG: Partial<Pose> = { ra1: 46, ra2: 80, la1: -46, la2: -80, head: -10 };

export const S01Door: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const lab = f >= LAB0 && f < LAB1;
  const loopBack = f >= LOOP - 2;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.door0, SLICE, T.catch, DOOR_PASS], 0.035) };

  const signK = f >= T.scenes && f < LAB0 ? popIn(f, T.scenes) : 0;
  const drawer = loopBack ? 0 : interpolate(f, [T.c4, T.c4 + 8, T.filed + 6, T.filed + 9], [0, 1, 1, 0], clamp);

  const overlayK = Math.max(interpolate(f, [T.c1 - 4, T.c1 + 4], [1, 0], clamp), interpolate(f, [LOOP - 4, LOOP], [0, 1], clamp));

  const sparkKeys = lab
    ? gestureKeys([
        [LAB0, G.presentBoth],
        [T.carried, G.pointUp, "snap"],
        [T.c6, G.doublePoint, "snap"],
        [T.more, G.facepalm, "snap"],
        [T.c7, G.thinkChin, "snap"],
        [T.fewer, G.present, "snap"],
      ])
    : gestureKeys([
        [0, { ...G.shrugBig, head: 10 }],
        [T.forgot, G.thinkChin, "snap"],
        [T.blame, G.pointSide, "snap"],
        [T.c1, G.stop, "snap"],
        [T.memory, G.pointUp, "snap"],
        [REW0, G.recoil, "snap"],
        [REW1, G.presentBoth, "snap"],
        [T.scenes, G.doublePoint, "snap"],
        [WALK0, G.rest],
        [SLICE, G.recoil, "snap"],
        [T.c4, G.pointSide, "snap"],
        [T.filed + 6, G.facepalm, "snap"],
        [LAB1, G.armsCrossed],
        [T.catch, G.handsHips, "snap"],
        [T.c9, G.thinkChin, "snap"],
        [T.busy, G.shrugBig, "snap"],
        [T.c10, JUG, "snap"],
        [T.c11, G.stop, "snap"],
        [T.one, HOLDP, "snap"],
        [DOOR_PASS + 4, { ...HOLDP, head: -8 }],
        [T.c12, G.leanIn, "snap"],
        [T.room12 - 4, G.beckon, "snap"],
        [LOOP - 2, { ...G.shrugBig, head: 10 }],
      ]);

  const mood = (t: number): Mood =>
    t >= LOOP - 2
      ? "worried"
      : t < T.forgot
        ? "worried"
        : t < T.blame
          ? "thinking"
          : t < T.c1
            ? "angry"
            : t < T.memory
              ? "worried"
              : t < REW0
                ? "happy"
                : t < T.scenes
                  ? "curious"
                  : t < WALK0
                    ? "excited"
                    : t < SLICE
                      ? "determined"
                      : t < T.c4
                        ? "shock"
                        : t < LAB0
                          ? "sad"
                          : t < T.c6
                            ? "excited"
                            : t < T.c7
                              ? "shock"
                              : t < T.fewer
                                ? "skeptical"
                                : t < LAB1
                                  ? "happy"
                                  : t < T.c9
                                    ? "skeptical"
                                    : t < T.c10
                                      ? "worried"
                                      : t < T.c11
                                        ? "laugh"
                                        : t < DOOR_PASS
                                          ? "determined"
                                          : t < T.c12
                                            ? "happy"
                                            : "wink";
  const bulb = (t: number) =>
    Math.max(bulbPulse(t, T.memory, 26), bulbPulse(t, DOOR_PASS, 30), t >= T.c1 && t < T.memory ? 0.5 + 0.5 * Math.sign(Math.sin(t * 1.4)) : 0);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    if (moving(t)) q = { ...q, ...walkLegs(t), y: q.y - Math.abs(Math.sin(t * 0.42)) * 6 };
    if (t >= REW0 && t < REW1) q = { ...q, lean: q.lean - 14 };
    if (t >= T.c10 && t < T.c11) {
      const s = Math.sin(t * 0.55);
      q = { ...q, ra1: q.ra1 + 26 * s, la1: q.la1 + 26 * s };
    }
    q = addPose(addPose(q, hop(t, T.scenes, 26)), shake(t, SLICE));
    q = addPose(addPose(q, nod(t, T.fewer)), shake(t, T.forgot, 2));
    q = addPose(addPose(q, hop(t, DOOR_PASS, 34)), nod(t, T.room12, 1));
    return { ...q, x: lab ? LAB_X : sparkX(t) };
  };

  // --- thought bubbles ---
  const fc = facingAt(f);
  const bx = sparkX(f) + BUB_DX * fc;
  const tail: [number, number] = [sparkX(f) + 40 * fc, HEADY - 30];
  // "?" bubble: frame 0 → line 2, after the slice arrival → lab, the loop frame
  const qK = loopBack ? 1 : f < REW0 ? 1 - interpolate(f, [REW0, REW0 + 6], [0, 1], clamp) : f >= SLICE + 26 && f < LAB0 ? popIn(f, SLICE + 26) : 0;
  // ✂ bubble: full from the end of the rewind until the slice
  const fullK = f >= REW1 - 8 && f < SLICE && !loopBack ? popIn(f, REW1 - 4) : 0;
  // halves after the slice
  const topT = interpolate(f, [T.filed - 6, T.filed + 8], [0, 1], clamp);
  const topPos = f < T.filed - 6 ? ([PX0 - BUB_R - 2, LINTEL] as [number, number]) : arc(topT, [PX0 - BUB_R - 2, LINTEL], [155, 1050], 170);
  const topK = f >= SLICE && f < T.filed + 9 && !loopBack ? interpolate(topT, [0.8, 1], [1, 0.35], clamp) : 0;
  const tsy = squash(f, SLICE, 0.22)[1];
  const botK = f >= SLICE && f < SLICE + 24 ? interpolate(f, [SLICE + 10, SLICE + 24], [1, 0], clamp) : 0;

  // three busy bubbles → juggling balls
  const words = ["KEYS", "EMAIL", "CALL MOM"];
  const busyBubbles = words.map((w, i) => {
    const at = T.c9 + 6 + i * 8;
    const home: [number, number] = [KX - 150 + i * 140, 700 - (i === 1 ? 70 : 0)];
    if (f < T.c10) return { w, k: f >= LAB1 ? popIn(f, at) : 0, p: home, r: 70, rot: Math.sin(f / 7 + i) * 5 };
    // juggling cascade
    const ph = ((f - T.c10) * 0.035 + i / 3) % 1;
    const jx = KX + 150 * Math.cos(ph * Math.PI * 2);
    const jy = 860 - 260 * Math.abs(Math.sin(ph * Math.PI * 2 + 0.3));
    const intro = interpolate(f, [T.c10, T.c10 + 10], [0, 1], clamp);
    let p: [number, number] = [home[0] + (jx - home[0]) * intro, home[1] + (jy - home[1]) * intro];
    let k = 1 - interpolate(f, [T.c10, T.c10 + 10], [0, 0.12], clamp);
    let r = 70;
    if (f >= T.c11) {
      // two bounce away, one ("✂") is held
      const freeze = T.c11;
      const ph0 = ((freeze - T.c10) * 0.035 + i / 3) % 1;
      const p0: [number, number] = [KX + 150 * Math.cos(ph0 * Math.PI * 2), 860 - 260 * Math.abs(Math.sin(ph0 * Math.PI * 2 + 0.3))];
      if (i !== 1) {
        const at2 = i === 0 ? T.not : T.not + 6;
        const tt = interpolate(f, [at2 - 6, at2 + 22], [0, 1], clamp);
        p = f < at2 - 6 ? p0 : arc(tt, p0, [i === 0 ? 1180 : 1240, GROUND - 40], 160);
      } else {
        k = 0; // replaced by the held ✂ thought
      }
      r = 70;
    }
    return { w, k: f >= T.c10 && f < LOOP - 2 ? k : 0, p, r, rot: Math.sin((f - T.c10) / 5 + i) * 10 };
  });
  const heldK = f >= T.c11 && f < LOOP - 2 ? popIn(f, T.one) : 0;

  // lab walkers
  const wT = (t: number) => interpolate(t, [LAB0 + 20, LAB0 + 20 + 150], [340, 870], clamp);
  const walking = (t: number) => t >= LAB0 + 20 && t < LAB0 + 170;
  const labMod = (t: number, p: Pose) => {
    let q = { ...p, x: wT(t) };
    if (walking(t)) q = { ...q, ...walkLegs(t) };
    return q;
  };
  const crossed = wT(f) > LDOOR + 30;

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: lab ? NAVY : WOOD }} />}
      cam={cam}
      hits={[T.door0, SLICE, T.catch]}
      power={10}
      svg={
        lab ? (
          <>
            <LabBg f={f} />
            {/* lane walkers carrying a box */}
            {[LANE_A, LANE_B].map((ly, li) => (
              <Actor
                key={ly}
                f={f}
                color={ORANGE}
                scale={0.85}
                base={{ x: 340, y: ly - 92.5 * 0.85 }}
                keys={[{ f: 0, p: { ra1: 78, ra2: -12, la1: 62, la2: -4 } }]}
                mod={labMod}
                trails={false}
              >
                {(j) => (
                  <g transform={`translate(${j.rHand[0] + 16} ${j.rHand[1] - 6})`}>
                    <rect x={-30} y={-30} width={60} height={56} rx={6} fill={WOOD} {...K} strokeWidth={4} />
                    {li === 0 && crossed && (
                      <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={CREAM}>
                        ?
                      </text>
                    )}
                  </g>
                )}
              </Actor>
            ))}
            <text x={640} y={LANE_A - 262} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={GOLD}>
              WITH A DOOR
            </text>
            <text x={640} y={LANE_B - 262} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={SKY}>
              NO DOOR
            </text>
            <Mark x={790} y={LANE_A - 300 + 70} k={popIn(f, T.forgot6)} ok={false} />
            <Mark x={890} y={LANE_A - 300 + 70} k={popIn(f, T.more)} ok={false} />
            <Mark x={700} y={LANE_B - 230} k={popIn(f, T.fewer)} ok />
            <Mark x={800} y={LANE_B - 230} k={popIn(f, T.fewer + 8)} ok />
            <Mark x={900} y={LANE_B - 230} k={popIn(f, T.mistakes + 2) * 0.8} ok={false} />
            <Burst x={840} y={LANE_A - 230} at={T.forgot6} f={f} size={120} color={RED} />
            <Spark f={f} scale={SS} base={{ x: LAB_X, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
          </>
        ) : (
          <>
            <Apartment f={f} signK={signK} drawer={drawer} />
            {/* sliced top half waits at the wall, then gets filed */}
            <Bubble x={topPos[0]} y={topPos[1]} k={topK * tsy} part="top" content="scissors" rot={f < T.filed - 6 ? wobble(f, SLICE, 8) : topT * -160} />
            <Spark
              f={f}
              scale={SS}
              base={{ x: KX, y: STANDY }}
              facing={facingAt}
              talk={(t) => mouthAt(t)}
              bulb={bulb}
              mood={mood}
              look={1}
              keys={sparkKeys}
              mod={sparkMod}
            >
              {(j) => (
                <>
                  {heldK > 0.01 && (
                    <Bubble x={(j.rHand[0] + j.lHand[0]) / 2} y={(j.rHand[1] + j.lHand[1]) / 2 - 10} k={heldK} r={58} content="scissors" />
                  )}
                </>
              )}
            </Spark>
            {/* thought bubbles (drawn over the wall, in front of the partition) */}
            <Bubble x={sparkX(f) + BUB_DX} y={LINTEL - 8} k={qK} r={74} content="q" tail={[sparkX(f) + 40, HEADY - 30]} rot={Math.sin(f / 9) * 4} />
            <Bubble x={bx} y={LINTEL} k={fullK} content="scissors" tail={tail} rot={Math.sin(f / 8) * 3} />
            <Bubble x={bx} y={LINTEL} k={botK} part="bottom" content="scissors" tail={tail} />
            {busyBubbles.map((b, i) => (
              <Bubble key={i} x={b.p[0]} y={b.p[1]} k={b.k} r={b.r} content={b.w} rot={b.rot} col={i === 0 ? "#ffe0dc" : i === 1 ? "#dff3ff" : "#e9ffe0"} />
            ))}
            {f >= DOOR_PASS && f < DOOR_PASS + 30 && <Burst x={640} y={980} at={DOOR_PASS} f={f} size={150} color={GREEN} />}
          </>
        )
      }
      html={
        <>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 330, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", background: CORAL, color: "#fff", padding: "6px 34px", fontFamily: FONT.comic, fontSize: 112, border: `7px solid ${INK}`, borderRadius: 18, WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill" }}>
                WHY AM I HERE?
              </span>
            </div>
          )}
          <Slam f={f} at={SLICE} out={T.c4 + 4} x={540} y={470} size={150} color={CORAL} stroke={`12px ${INK}`} rotate={-4}>
            CUT!
          </Slam>
          <Slam f={f} at={T.catch} out={T.c9 + 4} x={540} y={330} size={130} color={GOLD} stroke={`11px ${INK}`} rotate={3}>
            THE CATCH
          </Slam>
          <Slam f={f} at={T.busy} out={T.c10 + 6} x={540} y={330} size={120} color={CREAM} stroke={`11px ${INK}`} rotate={-3}>
            BUSY MIND
          </Slam>
          {f >= REW0 && f < REW1 && (
            <>
              <div style={{ position: "absolute", left: 90, top: 270, fontFamily: FONT.title, fontWeight: 900, fontSize: 64, color: "#fff", WebkitTextStroke: `3px ${INK}`, paintOrder: "stroke fill" }}>◀◀ REWIND</div>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ position: "absolute", left: 0, top: ((f * 37 + i * 410) % 1920), width: 1080, height: 10, background: "rgba(255,255,255,0.35)" }} />
              ))}
            </>
          )}
          {f >= LAB0 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1715, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: lab ? CREAM : INK, whiteSpace: "nowrap", opacity: 0.85 }}>
                Radvansky et al. 2011 · McFadyen et al. 2021 · illustration
              </div>
              <div style={{ position: "absolute", right: 96, top: 1770, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: lab ? GOLD : "#7a3b12", letterSpacing: 2, opacity: 0.9 }}>YOUR BRAIN DID THIS</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["why?", "door.", "memory.", "scenes.", "ends", "filed", "door,", "more.", "door?", "fewer", "catch.", "busy.", "three", "juggling", "one", "thought,", "forget"]}
          />
          <Transition f={f} at={LAB0} kind="shutter" size={VERTICAL} colors={[NAVY, BLUE_LN, CREAM]} />
        </>
      }
    />
  );
};
