import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, Heart, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod } from "../shared/gestures";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H05 · "You bought a standing desk to protect your heart." (Myth check, ~35 s, promise → build → reveal)
// ONE world: a morning open-plan office, wider than the screen, one camera rig travelling along its wall.
//  A (x≈330–1000)  Spark's standing desk (already rising at frame 0), monitor with a heart sticker, office chair.
//                  The chair rolls away (SIT LESS ✓). Spark stands so still that a pigeon lands on his head (statue).
//  B (x≈1490–2260) a big wall screen: 83,000 PEOPLE (icons) wearing wrist trackers → REVEAL after the pause:
//                  STOOD LESS vs STOOD MORE, two equal hearts; the right one starts to swell, snaps back: NOT HEALTHIER.
//                  Then MOVE ✓ vs JUST STAND. Spark walks back to his desk: a WALK! note on the monitor.
// Sources: Ahmadi et al., Int J Epidemiol 2024 (doi:10.1093/ije/dyae136); Cochrane review, Shrestha et al. 2018.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;

// palette: lilac-grey wall, coral accents, slate carpet, birch desk, navy wall screen
const WALL = "#e7e2f5";
const WALL2 = "#d9d2ee";
const CORAL = "#ff7a59";
const CARPET = "#5f6d8c";
const CARPET2 = "#53607d";
const BIRCH = "#f1dcb4";
const BIRCH2 = "#d8b983";
const STEEL = "#8d96aa";
const STEEL2 = "#6f788c";
const SCREEN = "#203052";
const SCREEN2 = "#2c3f68";
const YEL = "#ffd23f";
const RED = "#e8484f";
const GREEN = "#2fb463";
const WHITE = "#ffffff";
const GREY = "#9aa3b5";
const INK = COL.ink;
const SPARKTEAL = "#0fb5a6"; // Spark's own arm inside the magnified wrist callout

const T = {
  desk0: W(0, 4),
  heart0: W(0, 8),
  c1: C(1),
  end1: W(1, 3),
  stand1: W(1, 6),
  c2: C(2),
  sit2: W(2, 4),
  less2: W(2, 5),
  c3: C(3),
  legs3: W(3, 2),
  still3: W(3, 4),
  statue3: W(3, 7),
  c4: C(4),
  tracked4: W(4, 1),
  eighty4: W(4, 2),
  people4: W(4, 4),
  years4: W(4, 6),
  c5: C(5),
  wrist5: W(5, 1),
  measured5: W(5, 3),
  stood5: W(5, 7),
  c6: C(6),
  stood6: W(6, 2),
  more6: W(6, 3),
  not6: W(6, 5),
  healthier6: W(6, 7),
  c7: C(7),
  heart7: W(7, 1),
  move7: W(7, 5),
  stand7: W(7, 8),
  c8: C(8),
  desk8: W(8, 3),
  remind8: W(8, 4),
  walk8: W(8, 7),
  c9: C(9),
  long9: W(9, 1),
  stand9: W(9, 4),
  day9: W(9, 6),
};
const LOOP = VOICE_FRAMES - 14;

// staging (world coordinates; the world is ~2.4 screens wide)
const SXA = 330;
const SXB = 1560;
const WB0 = T.c4 + 2; // walk A → B
const WB1 = T.c4 + 60;
const WA0 = T.c8 - 6; // walk B → A
const WA1 = T.c8 + 62;
const DX = 700; // desk centre
const DESK_UP = 1050;
const DESK_LOW = 1112;
const MON = { w: 300, h: 190 };
const SCR = { x0: 1640, x1: 2260, y0: 300, y1: 780 };
const SCX = (SCR.x0 + SCR.x1) / 2;
const LAND = T.statue3; // pigeon lands
const TAKEOFF = T.c4 + 2;

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 560, 960, 1.25], // frame 0: Spark + rising desk
  [T.c1 - 12, T.c1 + 8, 420, 880, 1.5], // CU Spark (promise)
  [T.c2 - 14, T.c2 + 6, 760, 940, 1.15], // MED: the chair rolls away
  [T.c3 - 6, T.c3 + 22, 450, 990, 1.4], // slow push: still legs + pigeon
  [WB0, WB0 + 24, 1860, 860, 1.0], // travel along the office to the wall screen
  [T.c5 - 10, T.c5 + 10, 1750, 860, 1.14], // push: the wrist tracker
  [T.c6 - 28, T.c6 - 8, 1830, 650, 1.08], // reveal framing: screen big + Spark (settles before the hit)
  [T.c7 - 10, T.c7 + 10, 1800, 870, 1.1], // MED: MOVE
  [T.c8 - 2, T.c8 + 22, 640, 930, 1.15], // travel back to the desk
  [T.c9 - 12, T.c9 + 8, 440, 880, 1.42], // CU question
  [LOOP, LOOP, 560, 960, 1.25], // cut back into frame 0
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- helpers ----------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number; font?: string; o?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
  font = FONT.title,
  o = 1,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={font} fontWeight={w} fontSize={s} fill={c} opacity={o}>
    {children}
  </text>
);

const Tag: React.FC<{ text: string; fill: string; w: number; s?: number; c?: string }> = ({ text, fill, w, s = 40, c = WHITE }) => (
  <g>
    <rect x={-w / 2} y={-36} width={w} height={72} rx={36} fill={fill} {...K} strokeWidth={5} />
    <Txt y={14} s={s} c={c}>
      {text}
    </Txt>
  </g>
);

const Bubble: React.FC<{ w: number; h: number; fill: string; tail: "l" | "r"; children: React.ReactNode }> = ({ w, h, fill, tail, children }) => (
  <g>
    <path d={tail === "l" ? `M ${-w / 2 + 20} ${h / 2 - 6} L ${-w / 2 - 14} ${h / 2 + 22} L ${-w / 2 + 50} ${h / 2 - 6} Z` : `M ${w / 2 - 20} ${h / 2 - 6} L ${w / 2 + 14} ${h / 2 + 22} L ${w / 2 - 50} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={24} fill={fill} stroke={INK} strokeWidth={4} />
    {children}
  </g>
);

// a small person icon for the wall screen; (0,0) = feet. walk = stride phase (0 = standing), dot = wrist tracker 0..1
const PersonIcon: React.FC<{ c: string; s?: number; walk?: number; dot?: number }> = ({ c, s = 1, walk = 0, dot = 0 }) => {
  const a = 22 * Math.sin(walk);
  return (
    <g transform={`scale(${s})`}>
      <circle cy={-58} r={9} fill={c} />
      <line x1={0} y1={-48} x2={0} y2={-22} stroke={c} strokeWidth={7} strokeLinecap="round" />
      <line x1={0} y1={-22} x2={-Math.sin(((walk ? a : 12) * Math.PI) / 180) * 22} y2={0} stroke={c} strokeWidth={7} strokeLinecap="round" />
      <line x1={0} y1={-22} x2={Math.sin(((walk ? a : 12) * Math.PI) / 180) * 22} y2={0} stroke={c} strokeWidth={7} strokeLinecap="round" />
      <line x1={0} y1={-44} x2={-10 + (walk ? a * 0.4 : 0)} y2={-24} stroke={c} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={-44} x2={10 - (walk ? a * 0.4 : 0)} y2={-24} stroke={c} strokeWidth={6} strokeLinecap="round" />
      {dot > 0.01 && <circle cx={10 - (walk ? a * 0.4 : 0)} cy={-26} r={5.5 * dot} fill={YEL} />}
    </g>
  );
};

// pigeon, (0,0) = feet; flap 0..1 = wings moving
const Pigeon: React.FC<{ f: number; flap: number; facing?: number }> = ({ f, flap, facing = 1 }) => {
  const wing = flap > 0.01 ? -55 * Math.sin(f * 1.6) * flap : 0;
  return (
    <g transform={`scale(${facing} 1)`}>
      <line x1={-6} y1={-2} x2={-8} y2={0} stroke={CORAL} strokeWidth={4} strokeLinecap="round" />
      <line x1={6} y1={-2} x2={4} y2={0} stroke={CORAL} strokeWidth={4} strokeLinecap="round" />
      <path d="M -40 -26 L -58 -22 L -44 -14 Z" fill={GREY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={-4} cy={-22} rx={34} ry={20} fill={GREY} stroke={INK} strokeWidth={4} />
      <circle cx={26} cy={-44} r={14} fill="#7f8aa1" stroke={INK} strokeWidth={4} />
      <path d="M 38 -46 L 50 -42 L 38 -38 Z" fill={CORAL} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={29} cy={-47} r={3} fill={INK} />
      <ellipse cx={18} cy={-30} rx={10} ry={7} fill="#7fc6a4" opacity={0.9} />
      <g transform={`translate(-6 -30) rotate(${wing})`}>
        <path d="M 0 0 Q -28 -8 -36 10 Q -14 12 0 0 Z" fill="#b8bfcd" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      </g>
    </g>
  );
};

// office room: wall, window, plant, water cooler, carpet
const Room: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-700} y={-700} width={4000} height={1840} fill={WALL} />
    {Array.from({ length: 20 }, (_, i) => (
      <rect key={i} x={-700 + i * 200} y={-700} width={8} height={1840} fill={WALL2} />
    ))}
    {/* coral accent stripe */}
    <rect x={-700} y={880} width={4000} height={26} fill={CORAL} opacity={0.85} />
    {/* window with morning sky (place A) */}
    <g>
      <rect x={60} y={300} width={420} height={500} fill="#c3e7ff" {...K} strokeWidth={10} />
      <circle cx={170} cy={420} r={50} fill={YEL} stroke="#ffb52e" strokeWidth={6} />
      <rect x={300} y={560} width={70} height={240} fill="#a9b6d6" />
      <rect x={380} y={620} width={90} height={180} fill="#97a5c9" />
      <rect x={80} y={640} width={90} height={160} fill="#b6c2df" />
      <rect x={230 + 10 * Math.sin(f / 45)} y={360} width={110} height={34} rx={17} fill={WHITE} opacity={0.9} />
      <line x1={270} y1={300} x2={270} y2={800} stroke={INK} strokeWidth={8} />
      <line x1={60} y1={550} x2={480} y2={550} stroke={INK} strokeWidth={8} />
      <rect x={40} y={796} width={460} height={22} rx={8} fill={WHITE} {...K} strokeWidth={5} />
    </g>
    {/* wall clock (seen while the camera travels) */}
    <g transform="translate(1180 470)">
      <circle r={70} fill={WHITE} stroke={INK} strokeWidth={8} />
      <line x1={0} y1={0} x2={-24} y2={-30} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin((f / 30) * 0.21) * 48} y2={-Math.cos((f / 30) * 0.21) * 48} stroke={CORAL} strokeWidth={5} strokeLinecap="round" />
      <circle r={7} fill={INK} />
    </g>
    {/* tall plant */}
    <g transform="translate(1180 1140)">
      <path d="M -60 0 L 60 0 L 48 -120 L -48 -120 Z" fill={CORAL} {...K} strokeWidth={6} />
      {[-40, -12, 18, 42].map((dx, i) => (
        <ellipse key={i} cx={dx} cy={-200 - (i % 2) * 70} rx={34} ry={90} transform={`rotate(${dx * 0.6 + Math.sin(f / 50 + i) * 2} ${dx} -120)`} fill={i % 2 ? "#3fa34d" : "#4fbb5d"} {...K} strokeWidth={5} />
      ))}
    </g>
    {/* water cooler */}
    <g transform="translate(1360 1140)">
      <rect x={-50} y={-230} width={100} height={230} rx={12} fill={WHITE} {...K} strokeWidth={6} />
      <rect x={-40} y={-380} width={80} height={150} rx={24} fill="#a8dcff" {...K} strokeWidth={6} />
      <rect x={-14} y={-160} width={28} height={18} rx={4} fill={STEEL} {...K} strokeWidth={4} />
    </g>
    {/* skirting + carpet */}
    <rect x={-700} y={1120} width={4000} height={26} fill={WHITE} />
    <rect x={-700} y={1144} width={4000} height={1400} fill={CARPET} />
    <rect x={-700} y={1144} width={4000} height={10} fill={INK} opacity={0.3} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-700} y1={1210 + i * 90 + i * i * 8} x2={3300} y2={1210 + i * 90 + i * i * 8} stroke={CARPET2} strokeWidth={5} />
    ))}
  </g>
);

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "whoosh", 0.12],
  [T.heart0 - 4, "pop", 0.16],
  [T.c1 - 2, "pop", 0.14],
  [T.c2 - 2, "swish", 0.12],
  [T.sit2 - 2, "whoosh", 0.16],
  [T.less2 + 2, "ding", 0.2],
  [T.still3 - 2, "tick", 0.16],
  [T.statue3 - 22, "swish", 0.14],
  [LAND, "thud", 0.18],
  [LAND + 3, "boing", 0.12],
  [TAKEOFF, "whoosh", 0.16],
  [T.tracked4 - 4, "pop", 0.14],
  [T.eighty4 - 4, "tick", 0.12],
  [T.eighty4 + 8, "tick", 0.12],
  [T.eighty4 + 16, "tick", 0.12],
  [T.eighty4 + 24, "tick", 0.12],
  [T.years4 - 2, "page", 0.2],
  [T.wrist5 - 2, "pop", 0.16],
  [T.measured5, "tick", 0.12],
  [T.measured5 + 12, "tick", 0.12],
  [T.measured5 + 24, "tick", 0.12],
  [T.c6 - 30, "whoosh_long", 0.12],
  [T.c6, "stinger", 0.18],
  [T.more6 + 2, "riser", 0.1],
  [T.not6 - 1, "boing", 0.22],
  [T.healthier6 - 2, "stamp", 0.24],
  [T.c7 - 6, "swish", 0.14],
  [T.move7 - 2, "pop", 0.18],
  [T.stand7 - 2, "pop", 0.14],
  [T.c8 - 2, "whoosh", 0.16],
  [T.remind8 - 3, "pop", 0.2],
  [T.walk8 - 2, "ding", 0.18],
  [T.long9 - 4, "pop", 0.18],
  [LOOP, "whoosh", 0.12],
].map((c) => c as SfxCue);

export const S01Office: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const cam = camAtRig(f);
  const lf = loopBack ? f - LOOP : f; // local time for the frame-0 state (repeats after the loop cut)

  // ---------------- place A: desk, monitor, chair ----------------
  const deskY = loopBack || f < 60 ? interpolate(lf, [-2, 34], [DESK_LOW, DESK_UP], { ...clamp, easing: Easing.out(Easing.cubic) }) : DESK_UP;
  const rising = (loopBack || f < 40) && lf < 34;
  const deskSettle = rising ? 0 : wobble(f, 34, 1.2, 5);
  const chairX = loopBack ? 980 : interpolate(f, [T.sit2 - 4, T.sit2 + 22], [980, 1090], { ...clamp, easing: Easing.out(Easing.cubic) });
  const chairSpin = loopBack ? 0 : wobble(f, T.sit2 + 22, 6, 6);
  const sitLessK = !loopBack && f >= T.less2 && f < T.c4 ? popIn(f, T.less2) : 0;
  const heartK = loopBack || f < T.remind8 - 4 ? 1 : 0;
  const noteK = !loopBack && f >= T.remind8 - 4 ? popIn(f, T.remind8 - 4) : 0;
  const stillK = !loopBack && f >= T.still3 - 2 && f < T.c4 ? popIn(f, T.still3 - 2) : 0;

  // ---------------- place B: the wall screen ----------------
  const studyK = !loopBack && f >= T.tracked4 - 4 && f < T.c6 - 24 ? popIn(f, T.tracked4 - 4) : 0;
  const gridOut = interpolate(f, [T.c6 - 30, T.c6 - 22], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const icons = 32;
  const iconK = (i: number) => (f >= T.eighty4 - 6 + i * 1.2 ? popIn(f, T.eighty4 - 6 + i * 1.2) : 0) * gridOut;
  const dotK = (i: number) => interpolate(f, [T.measured5 - 4 + (i % 8) * 3, T.measured5 + 4 + (i % 8) * 3], [0, 1], clamp);
  const yearsK = f >= T.years4 - 2 ? popIn(f, T.years4 - 2) * gridOut : 0;
  const yearsFlip = Math.floor(interpolate(f, [T.years4, T.years4 + 40], [0, 4], clamp));
  const callK = !loopBack && f >= T.wrist5 - 2 && f < T.c6 - 26 ? popIn(f, T.wrist5 - 2) * (1 - ease(f, T.c6 - 34, T.c6 - 26, 0, 1)) : 0;
  const stoodBar = interpolate(f, [T.measured5, T.stood5 + 6], [0.05, 0.92], { ...clamp, easing: Easing.out(Easing.quad) });

  // reveal (two hearts) and MOVE
  const revOut = 1 - ease(f, T.c7 - 6, T.c7 + 2, 0, 1);
  const labelK = f >= T.c6 - 2 && f < T.c7 + 2 ? popIn(f, T.c6 - 2) * revOut : 0;
  const heartsK = f >= T.c6 + 4 && f < T.c7 + 2 ? popIn(f, T.c6 + 4) * revOut : 0;
  const beat = (t: number) => 1 + 0.07 * Math.max(0, Math.sin(t * 0.42)) ** 3;
  const swell = f < T.not6 ? interpolate(f, [T.more6, T.not6 - 1], [1, 1.32], { ...clamp, easing: Easing.in(Easing.quad) }) : interpolate(f, [T.not6 - 1, T.not6 + 3, T.not6 + 8, T.not6 + 13], [1.32, 0.9, 1.04, 1], clamp);
  const eqK = f >= T.not6 + 2 && f < T.c7 + 2 ? popIn(f, T.not6 + 2) * revOut : 0;
  const notK = f >= T.healthier6 - 2 && f < T.c7 + 2 ? popIn(f, T.healthier6 - 2) * revOut : 0;
  const mvOut = 1 - ease(f, T.c8 + 30, T.c8 + 40, 0, 1);
  const smallHeartK = f >= T.heart7 - 3 && f < T.c8 + 40 ? popIn(f, T.heart7 - 3) * mvOut : 0;
  const moveK = f >= T.move7 - 3 && f < T.c8 + 40 ? popIn(f, T.move7 - 3) * mvOut : 0;
  const justK = f >= T.stand7 - 3 && f < T.c8 + 40 ? popIn(f, T.stand7 - 3) * mvOut : 0;
  const screenOn = !loopBack && f >= T.tracked4 - 8 && f < T.c8 + 40;

  // ---------------- question ----------------
  const askK = !loopBack && f >= T.long9 - 4 ? popIn(f, T.long9 - 4) : 0;

  // --- Spark ---
  const lookWrist = { ra1: 105, ra2: 95, la1: -15, la2: 10, head: 8 };
  const sparkKeys = gestureKeys([
    [0, G.present],
    [T.desk0, G.doublePoint, "smooth"],
    [T.heart0 - 4, G.fistPump, "smooth"],
    [T.c1, G.stop, "snap"],
    [T.end1, G.pointSide, "smooth"],
    [T.stand1, G.thinkChin, "smooth"],
    [T.c2, G.present, "smooth"],
    [T.less2, G.fistPump, "smooth"],
    [T.c3, G.armsCrossed, "smooth"],
    [T.still3 - 4, G.rest, "snap"],
    [LAND + 4, G.shrugBig, "smooth"],
    [T.c4, G.pointSide, "smooth"],
    [WB1 - 4, G.present, "smooth"],
    [T.c5, lookWrist, "smooth"],
    [T.stood5 + 6, G.rest, "smooth"],
    [T.c6, G.doublePoint, "smooth"],
    [T.more6, G.leanIn, "smooth"],
    [T.not6 - 6, G.recoil, "smooth"], // anticipation before the big reaction
    [T.not6, G.mindBlown, "snap"],
    [T.c7, G.pointUp, "smooth"],
    [T.move7 - 2, G.fistPump, "smooth"],
    [WA0, G.rest, "smooth"],
    [WA1 - 4, G.present, "smooth"],
    [T.c9, G.beckon, "smooth"],
    [T.day9, G.doublePoint, "smooth"],
    [LOOP - 4, G.present, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "excited";
    if (t < T.desk0) return "excited";
    if (t < T.c1) return "happy";
    if (t < T.end1) return "curious";
    if (t < T.stand1) return "thinking";
    if (t < T.c2) return "skeptical";
    if (t < T.c3) return "happy";
    if (t < T.still3 - 4) return "smug";
    if (t < LAND) return "neutral";
    if (t < T.c4) return "worried";
    if (t < WB1) return "determined";
    if (t < T.c5) return "curious";
    if (t < T.c6) return "thinking";
    if (t < T.more6) return "curious";
    if (t < T.not6 - 6) return "excited";
    if (t < T.not6) return "shock";
    if (t < T.c7) return "mindblown";
    if (t < T.move7) return "determined";
    if (t < WA1) return "happy";
    if (t < T.c9) return "excited";
    if (t < T.stand9) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.not6, 84), bulbPulse(t, T.remind8, 24));
  const sparkX = (t: number) => {
    if (t >= LOOP - 2) return SXA;
    if (t < WA0) return ease(t, WB0, WB1, SXA, SXB);
    return ease(t, WA0, WA1, SXB, SXA);
  };
  const walking = (t: number) => t < LOOP - 2 && ((t >= WB0 && t < WB1) || (t >= WA0 && t < WA1));
  const marching = (t: number) => t >= T.move7 && t < WA0;
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (t >= T.still3 - 4 && t < T.c4) q = { ...q, y: p.y }; // frozen like a statue: no idle bob
    if (walking(t)) q = addPose(q, walkCycle(t - WB0, 0.3));
    if (marching(t)) q = addPose(q, { ...walkCycle(t - T.move7, 0.32), y: -4 * Math.abs(Math.sin((t - T.move7) * 0.32)) });
    q = addPose(q, hop(t, T.less2 + 2, 12));
    q = addPose(q, hop(t, T.not6 + 2, 22));
    q = addPose(q, nod(t, T.stood5, 1));
    q = addPose(q, nod(t, T.walk8, 1));
    return { ...q, x: sparkX(t) };
  };
  const facing = (t: number) => (t >= WA0 && t < WA1 - 2 && t < LOOP - 2 ? -1 : 1);

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: SXA, y: STANDY }} facing={facing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) => {
        // wrist tracker: on the right forearm, near the hand
        const wx = j.rElbow[0] + (j.rHand[0] - j.rElbow[0]) * 0.78;
        const wy = j.rElbow[1] + (j.rHand[1] - j.rElbow[1]) * 0.78;
        const ang = (Math.atan2(j.rHand[1] - j.rElbow[1], j.rHand[0] - j.rElbow[0]) * 180) / Math.PI;
        // pigeon: flies in on an arc, lands on the head, flies off when Spark walks
        const headTop: [number, number] = [j.headC[0] - j.headR * 0.5, j.headC[1] - j.headR * 0.92];
        let pg: { x: number; y: number; flap: number; sx: number; sy: number; face: number } | null = null;
        if (!loopBack && f >= LAND - 22 && f < TAKEOFF + 26) {
          if (f < LAND) {
            const [x, y] = arc(interpolate(f, [LAND - 22, LAND], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }), [headTop[0] + 420, headTop[1] - 380], headTop, -60);
            pg = { x, y, flap: 1, sx: 1, sy: 1, face: -1 };
          } else if (f < TAKEOFF) {
            const [sx, sy] = squash(f, LAND, 0.22);
            pg = { x: headTop[0], y: headTop[1], flap: 0, sx, sy, face: f > LAND + 30 && f < LAND + 40 ? 1 : -1 };
          } else {
            const [x, y] = arc(interpolate(f, [TAKEOFF, TAKEOFF + 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }), headTop, [headTop[0] - 300, headTop[1] - 520], -40);
            pg = { x, y, flap: 1, sx: 1, sy: 1, face: -1 };
          }
        }
        return (
          <>
            <g transform={`translate(${wx} ${wy}) rotate(${ang})`}>
              <rect x={-12} y={-11} width={24} height={22} rx={5} fill={YEL} stroke={INK} strokeWidth={3.5} />
            </g>
            {pg && (
              <g transform={`translate(${pg.x} ${pg.y}) scale(${pg.sx} ${pg.sy})`}>
                <Pigeon f={f} flap={pg.flap} facing={pg.face} />
              </g>
            )}
            {stillK > 0.01 && (
              <g opacity={Math.min(1, stillK)}>
                <rect x={j.hip[0] - 70} y={j.hip[1] - 10} width={140} height={Math.max(j.lFoot[1], j.rFoot[1]) - j.hip[1] + 40} rx={26} fill="none" stroke={CORAL} strokeWidth={6} strokeDasharray="18 12" />
                <g transform={`translate(${j.hip[0] - 170} ${j.hip[1] + 90}) scale(${stillK}) rotate(${-4 + wobble(f, T.still3 - 2, 6)})`}>
                  <Tag text="STILL" fill={CORAL} w={150} s={40} />
                </g>
              </g>
            )}
          </>
        );
      }}
    </Spark>
  );

  // monitor top-left corner on the desk
  const monX = DX - MON.w / 2;
  const monY = deskY - 36 - MON.h;

  const svg = (
    <>
      <Room f={f} />

      {/* ---------- place B: wall screen + cabinet ---------- */}
      <rect x={SCR.x0 + 40} y={1000} width={SCR.x1 - SCR.x0 - 80} height={140} rx={10} fill={BIRCH} {...K} strokeWidth={6} />
      <line x1={SCX} y1={1010} x2={SCX} y2={1130} stroke={BIRCH2} strokeWidth={5} />
      <g>
        <rect x={SCR.x0 - 18} y={SCR.y0 - 18} width={SCR.x1 - SCR.x0 + 36} height={SCR.y1 - SCR.y0 + 36} rx={18} fill="#2a2e3c" {...K} />
        <rect x={SCR.x0} y={SCR.y0} width={SCR.x1 - SCR.x0} height={SCR.y1 - SCR.y0} rx={6} fill={screenOn ? SCREEN : "#1a2033"} />
        {screenOn && <rect x={SCR.x0} y={SCR.y0} width={SCR.x1 - SCR.x0} height={70} rx={6} fill={SCREEN2} />}
        {studyK > 0.01 && (
          <g opacity={Math.min(1, studyK)}>
            <Txt x={SCX} y={SCR.y0 + 50} s={40} c={WHITE}>
              HEART STUDY
            </Txt>
          </g>
        )}
        {/* 83,000 PEOPLE grid */}
        {Array.from({ length: icons }, (_, i) => {
          const k = iconK(i);
          if (k < 0.01) return null;
          const col = i % 8;
          const row = Math.floor(i / 8);
          return (
            <g key={i} transform={`translate(${SCR.x0 + 70 + col * 68} ${SCR.y0 + 200 + row * 92}) scale(${k})`}>
              <PersonIcon c={WHITE} s={1} dot={dotK(i)} />
            </g>
          );
        })}
        {f >= T.eighty4 - 4 && gridOut > 0.01 && (
          <g transform={`translate(${SCX} ${SCR.y1 - 40}) scale(${popIn(f, T.eighty4 - 4) * gridOut})`}>
            <rect x={-170} y={-36} width={340} height={64} rx={14} fill={YEL} {...K} strokeWidth={4} />
            <Txt y={14} s={46}>
              83,000 PEOPLE
            </Txt>
          </g>
        )}
        {yearsK > 0.01 && (
          <g transform={`translate(${SCR.x0 + 70} ${SCR.y0 + 40}) scale(${yearsK * 0.9})`}>
            <rect x={-48} y={-40} width={96} height={86} rx={10} fill={WHITE} {...K} strokeWidth={4} />
            <rect x={-48} y={-40} width={96} height={24} rx={8} fill={CORAL} {...K} strokeWidth={4} />
            {yearsFlip < 4 && <path d={`M -44 -14 L 44 -14 L 44 ${-14 + 50 * (1 - ((f - T.years4) % 10) / 10)} L -44 ${-14 + 50 * (1 - ((f - T.years4) % 10) / 10)} Z`} fill="#f2f2f2" opacity={0.9} />}
            <Txt y={30} s={30}>
              YEARS
            </Txt>
          </g>
        )}
        {/* REVEAL: two hearts */}
        {labelK > 0.01 && (
          <g opacity={Math.min(1, labelK)}>
            <g transform={`translate(${SCX - 155} ${SCR.y0 + 52}) scale(${labelK})`}>
              <Txt y={0} s={44} c={WHITE}>
                STOOD LESS
              </Txt>
            </g>
            <g transform={`translate(${SCX + 155} ${SCR.y0 + 52}) scale(${labelK})`}>
              <Txt y={0} s={44} c={YEL}>
                STOOD MORE
              </Txt>
            </g>
            <line x1={SCX} y1={SCR.y0 + 80} x2={SCX} y2={SCR.y1 - 20} stroke={SCREEN2} strokeWidth={6} strokeDasharray="14 12" />
            <g transform={`translate(${SCX - 155} ${SCR.y0 + 150})`}>
              <PersonIcon c={WHITE} s={0.8} />
            </g>
            <g transform={`translate(${SCX + 125} ${SCR.y0 + 150})`}>
              <PersonIcon c={YEL} s={0.8} />
            </g>
            <g transform={`translate(${SCX + 185} ${SCR.y0 + 150})`}>
              <PersonIcon c={YEL} s={0.8} />
            </g>
          </g>
        )}
        {heartsK > 0.01 && (
          <g>
            <g transform={`translate(${SCX - 155} ${SCR.y0 + 290}) scale(${heartsK * 3.8 * beat(f)})`}>
              <Heart s={1} color={RED} />
            </g>
            <g transform={`translate(${SCX + 155} ${SCR.y0 + 290}) scale(${heartsK * 3.8 * beat(f) * swell})`}>
              <Heart s={1} color={RED} />
            </g>
          </g>
        )}
        {eqK > 0.01 && (
          <g transform={`translate(${SCX} ${SCR.y0 + 280}) scale(${eqK})`}>
            <circle r={44} fill={WHITE} {...K} strokeWidth={5} />
            <Txt y={22} s={70}>
              =
            </Txt>
          </g>
        )}
        {notK > 0.01 && (
          <g transform={`translate(${SCX + 150} ${SCR.y1 - 52}) scale(${notK}) rotate(${-4 + wobble(f, T.healthier6 - 2, 6)})`}>
            <Tag text="NOT HEALTHIER" fill={RED} w={300} s={44} />
          </g>
        )}
        {/* MOVE, not just stand */}
        {smallHeartK > 0.01 && (
          <g transform={`translate(${SCX} ${SCR.y0 + 120}) scale(${smallHeartK * 1.7 * beat(f + 6)})`}>
            <Heart s={1} color={RED} />
          </g>
        )}
        {moveK > 0.01 && (
          <g transform={`translate(${SCX - 150} ${SCR.y0 + 330}) scale(${moveK})`}>
            <g transform="translate(0 50)">
              <PersonIcon c={WHITE} s={2.1} walk={f * 0.32} />
            </g>
            <g transform="translate(0 120)">
              <rect x={-110} y={-34} width={220} height={66} rx={33} fill={GREEN} {...K} strokeWidth={4} />
              <Txt y={14} s={46} c={WHITE}>
                MOVE ✓
              </Txt>
            </g>
          </g>
        )}
        {justK > 0.01 && (
          <g transform={`translate(${SCX + 150} ${SCR.y0 + 330}) scale(${justK})`} opacity={0.75}>
            <g transform="translate(0 50)">
              <PersonIcon c={GREY} s={2.1} />
            </g>
            <g transform="translate(0 120)">
              <Txt y={14} s={40} c={GREY}>
                JUST STAND
              </Txt>
            </g>
          </g>
        )}
      </g>

      {/* ---------- place A: chair ---------- */}
      <g transform={`translate(${chairX} 0) rotate(${chairSpin} 0 1160)`}>
        <rect x={-14} y={1150} width={28} height={90} fill={STEEL2} {...K} strokeWidth={4} />
        <path d="M -80 1270 L 80 1270" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <circle cx={-76} cy={1278} r={12} fill={INK} />
        <circle cx={76} cy={1278} r={12} fill={INK} />
        <circle cx={0} cy={1278} r={12} fill={INK} />
        <line x1={0} y1={1240} x2={0} y2={1270} stroke={INK} strokeWidth={8} />
        <rect x={-90} y={1124} width={180} height={36} rx={16} fill={CORAL} {...K} strokeWidth={5} />
        <rect x={56} y={940} width={44} height={190} rx={18} fill={CORAL} {...K} strokeWidth={5} />
      </g>
      {sitLessK > 0.01 && (
        <g transform={`translate(${chairX - 10} 1020) scale(${sitLessK}) rotate(${-3 + wobble(f, T.less2, 6)})`}>
          <Tag text="SIT LESS ✓" fill={GREEN} w={240} s={40} />
        </g>
      )}

      {/* ---------- place A: standing desk ---------- */}
      <g transform={`rotate(${deskSettle} ${DX} ${deskY})`}>
        {/* telescopic legs */}
        {[DX - 160, DX + 160].map((x) => (
          <g key={x}>
            <rect x={x - 22} y={1180} width={44} height={GROUND - 1180} fill={STEEL2} {...K} strokeWidth={5} />
            <rect x={x - 15} y={deskY + 20} width={30} height={1190 - deskY - 20} fill={STEEL} {...K} strokeWidth={5} />
            <rect x={x - 60} y={GROUND - 14} width={120} height={20} rx={8} fill={STEEL2} {...K} strokeWidth={5} />
          </g>
        ))}
        {/* monitor */}
        <rect x={DX - 18} y={deskY - 40} width={36} height={40} fill={STEEL2} {...K} strokeWidth={4} />
        <rect x={DX - 60} y={deskY - 10} width={120} height={14} rx={6} fill={STEEL2} {...K} strokeWidth={4} />
        <rect x={monX - 12} y={monY - 12} width={MON.w + 24} height={MON.h + 24} rx={16} fill="#2b3045" {...K} strokeWidth={6} />
        <rect x={monX} y={monY} width={MON.w} height={MON.h} rx={8} fill="#f4f7ff" />
        {heartK > 0.01 && (
          <g transform={`translate(${DX} ${monY + MON.h / 2 + 4}) scale(${2.3 * beat(f + 10)})`}>
            <Heart s={1} color={RED} />
          </g>
        )}
        {noteK > 0.01 && (
          <g transform={`translate(${DX} ${monY + MON.h / 2}) scale(${noteK}) rotate(${-5 + wobble(f, T.remind8 - 4, 8)})`}>
            <rect x={-118} y={-80} width={236} height={160} fill={YEL} {...K} strokeWidth={5} />
            <Txt y={-14} s={44}>
              TIME TO
            </Txt>
            <Txt y={44} s={64}>
              WALK!
            </Txt>
          </g>
        )}
        {/* desk top + control panel */}
        <rect x={DX - 220} y={deskY} width={440} height={30} rx={8} fill={BIRCH} {...K} strokeWidth={6} />
        <rect x={DX - 210} y={deskY + 30} width={84} height={30} rx={6} fill="#3a3f4f" {...K} strokeWidth={4} />
        <path d={`M ${DX - 194} ${deskY + 52} L ${DX - 182} ${deskY + 38} L ${DX - 170} ${deskY + 52} Z`} fill={rising ? GREEN : WHITE} />
        <path d={`M ${DX - 158} ${deskY + 38} L ${DX - 146} ${deskY + 52} L ${DX - 134} ${deskY + 38} Z`} fill={WHITE} opacity={0.7} />
        {rising && (
          <g transform={`translate(${DX + 270} ${deskY - 10})`} opacity={interpolate(lf, [20, 34], [1, 0], clamp)}>
            <path d="M 0 -60 L 30 -20 L 12 -20 L 12 30 L -12 30 L -12 -20 L -30 -20 Z" fill={GREEN} {...K} strokeWidth={5} />
          </g>
        )}
      </g>

      {sparkEl}

      {/* tracker callout (magnified wrist) */}
      {callK > 0.01 && (
        <g>
          <g transform={`translate(1425 540) scale(${callK})`}>
            <circle r={128} fill={WHITE} {...K} strokeWidth={7} />
            <rect x={-130} y={-34} width={260} height={68} fill={SPARKTEAL} />
            <rect x={-70} y={-72} width={140} height={144} rx={28} fill={YEL} {...K} strokeWidth={6} />
            <rect x={-54} y={-56} width={108} height={112} rx={18} fill={SCREEN} />
            <Txt y={-18} s={28} c={WHITE}>
              STOOD
            </Txt>
            <rect x={-40} y={6} width={80} height={22} rx={8} fill={SCREEN2} />
            <rect x={-40} y={6} width={80 * stoodBar} height={22} rx={8} fill={GREEN} />
            <Txt y={50} s={22} c={WHITE} o={0.8}>
              TIME
            </Txt>
          </g>
        </g>
      )}

      {askK > 0.01 && (
        <g transform={`translate(560 640) scale(${askK}) rotate(${wobble(f, T.long9 - 4, 6)})`}>
          <Bubble w={420} h={150} fill={WHITE} tail="l">
            <Txt y={-10} s={52}>
              HOW LONG DO
            </Txt>
            <Txt y={48} s={52}>
              YOU STAND?
            </Txt>
          </Bubble>
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
            fontSize: 112,
            color: YEL,
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          STANDING = HEALTHY?
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
              fontSize: 21,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            {f < T.c4
              ? "Sit-stand desks: less sitting, weak evidence (Cochrane review, Shrestha et al. 2018)"
              : "Ahmadi et al., Int J Epidemiol 2024 · 83,013 adults · observational · all standing, not only desks"}
          </div>
          <div
            style={{
              position: "absolute",
              left: 96,
              top: 1745,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 22,
              color: INK,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 10px",
              borderRadius: 8,
            }}
          >
            Education, not medical advice
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
              background: "rgba(20,20,40,0.55)",
              padding: "2px 10px",
              borderRadius: 8,
            }}
          >
            MYTH CHECK
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1570}
        cues={VOICE_CUES}
        hi={["standing", "desk", "heart", "end", "hour", "sit", "less", "legs", "still", "statue", "scientists", "eighty-three", "thousand", "years", "wrist", "tracker", "stood", "more", "not", "healthier", "hearts", "move", "stand", "remind", "walk", "long"]}
      />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={[]} power={4} svg={svg} html={html} />;
};

