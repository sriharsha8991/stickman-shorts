import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, runCycle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H30 · "Stop. Who told you that you need eight glasses?" (~36.6 s, promise → build → reveal, Myth check)
// ONE sunny kitchen, wider than the screen, one camera rig:
//  A (x≈0–1250)   the counter with eight glasses. A doctor opens the folder marked PROOF: the pages are empty.
//  B (x≈1450–2400) the lunch table with a tall empty jug, under an old 1945 report whose bottom is rolled up.
//                  Spark pulls the cord, the page unrolls to the line people missed, the food turns see-through and pours
//                  into the jug. Then today's correction: food a fifth, drinks the rest, even tea → jug full (best picture).
// Sources: Valtin 2002 (Am J Physiol), Food and Nutrition Board 1945 via Valtin, National Academies 2004 (see facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);

const SS = 1.9;

// palette: butter kitchen, navy counter, red gingham, water blue (no teal except Spark)
const WALL = "#fff0c9";
const WALL2 = "#f8dfa6";
const NAVY = "#27365c";
const NAVY2 = "#3a4d7e";
const FLOOR = "#c9794b";
const FLOOR2 = "#b2653c";
const CLOTH = "#e2574c";
const WATER = "#2f9bea";
const WATER2 = "#7cc6f7";
const TEA = "#c67a2e";
const PAPER = "#f4e4bb";
const PAPER2 = "#d9c48f";
const YEL = "#ffd23f";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  stop0: W(0, 0),
  told0: W(0, 2),
  eight0: W(0, 7),
  c1: C(1),
  line1: W(1, 3),
  missed1: W(1, 6),
  c2: C(2),
  found2: W(2, 2),
  no2: W(2, 3),
  study2: W(2, 4),
  rule2: W(2, 7),
  e2: E(2),
  c3: C(3),
  old3: W(3, 2),
  report3: W(3, 3),
  big3: W(3, 6),
  number3: W(3, 7),
  c4: C(4),
  line4: W(4, 5),
  below4: W(4, 6),
  e4: E(4),
  c5: C(5),
  most5: W(5, 2),
  food5: W(5, 8),
  e5: E(5),
  c6: C(6),
  food6: W(6, 3),
  fifth6: W(6, 7),
  c7: C(7),
  drinks7: W(7, 1),
  rest7: W(7, 4),
  tea7: W(7, 6),
  e7: E(7),
  c8: C(8),
  thirst8: W(8, 6),
  c9: C(9),
  heat9: W(9, 3),
  exercise9: W(9, 6),
  c10: C(10),
  tea10: W(10, 4),
  today10: W(10, 5),
};
const LOOP = VOICE_FRAMES - 12;

// --- staging (world coordinates) -----------------------------------------------------------------------------------
const SX0 = 250;
const SXB = 1530;
const RUN0 = T.c3 - 24;
const RUN1 = T.c3 + 6;
const COUNTER = 1000;
const GX = (i: number) => 400 + i * 88;
const HERO = 3;
const DOCX = 900;
const DOC0 = T.c2 - 34;
const DOC1 = T.c2 + 2;
const TABLE = 1120;
const PX0 = 1520;
const PX1 = 2280;
const PTOP = 110;
const ROLL0 = 468;
const ROLL1 = 716;
const CORDX = 1610;
const SOUPX = 1700;
const MELX = 1932;
const TEAX = 2094;
const GLASSX = 2154;
const JUGX = 2262;
const JUGW = 180;
const JUGH = 340;
const MOUTH: [number, number] = [JUGX - 30, TABLE - JUGH + 6];

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 540, 880, 1.25], // frame 0: Spark + one glass
  [T.eight0 - 4, T.eight0 + 22, 640, 820, 1.0], // pull back: eight glasses
  [T.c1 - 10, T.c1 + 10, 370, 900, 1.36], // CU Spark (promise)
  [T.c2 - 22, T.c2 + 2, 640, 820, 1.0], // wide: doctor
  [RUN0, RUN1, 1920, 820, 1.0], // travel along the kitchen ("But an old report")
  [T.c6 + 2, T.c6 + 22, 1930, 815, 1.03], // the old page leaves, a little more room for the streams
  [T.c8 - 16, T.c8 + 6, 1680, 880, 1.2], // CU Spark drinks
  [T.c9 - 8, T.c9 + 12, 1780, 840, 1.08], // the sun comes in
  [T.c10 - 8, T.c10 + 12, 1660, 900, 1.26], // CU question
  [LOOP, LOOP, 540, 880, 1.25], // cut back into frame 0
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- helpers ----------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number; o?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
  o = 1,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={w} fontSize={s} fill={c} opacity={o}>
    {children}
  </text>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={4} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

// a drinking glass; (0,0) = centre of its base. level 0..1
const Glass: React.FC<{ level?: number; slosh?: number; color?: string }> = ({ level = 0.72, slosh = 0, color = WATER }) => {
  const H = 190;
  const hw = (y: number) => 37 + (11 * -y) / H; // half width at height y (y<0)
  const yL = -8 - (H - 14) * level;
  return (
    <g>
      {level > 0.01 && (
        <path
          d={`M ${-hw(-8) + 4} -8 L ${-hw(yL) + 4} ${yL - slosh} Q 0 ${yL + slosh * 0.5} ${hw(yL) - 4} ${yL + slosh} L ${hw(-8) - 4} -8 Z`}
          fill={color}
        />
      )}
      <path d={`M ${-hw(-H)} ${-H} L ${-hw(0)} 0 L ${hw(0)} 0 L ${hw(-H)} ${-H}`} fill="none" {...K} strokeWidth={7} />
      <line x1={-hw(-H)} y1={-H} x2={hw(-H)} y2={-H} {...K} strokeWidth={5} opacity={0.55} />
      <path d={`M ${-hw(-H) + 13} ${-H + 18} L ${-hw(-20) + 11} -22`} stroke={WHITE} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.75} />
    </g>
  );
};

// a stream of water from a point to a point; g0..g1 = which part of the path is drawn (0..1)
const Stream: React.FC<{ d: string; color: string; g0: number; g1: number; f: number; hi: string }> = ({ d, color, g0, g1, f, hi }) => {
  if (g1 <= g0 + 0.001) return null;
  const dash = `${g1 - g0} 2`;
  return (
    <g>
      <path d={d} pathLength={1} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={-g0} />
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={17} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={-g0} />
      {g1 - g0 > 0.2 && <path d={d} pathLength={1} fill="none" stroke={hi} strokeWidth={6} strokeLinecap="round" strokeDasharray="0.05 0.09" strokeDashoffset={-f * 0.022} opacity={0.9} />}
    </g>
  );
};

const arcPath = (a: [number, number], b: [number, number], top: number) => `M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2 + 20} ${top} ${b[0]} ${b[1]}`;
const P_SOUP = arcPath([SOUPX, TABLE - 116], MOUTH, 610);
const P_MEL = arcPath([MELX, TABLE - 138], MOUTH, 640);
// with the old page gone the streams can rise high: the best picture
const P_SOUP2 = arcPath([SOUPX, TABLE - 116], MOUTH, 150);
const P_MEL2 = arcPath([MELX, TABLE - 138], MOUTH, 230);
const P_TEA = arcPath([TEAX, TABLE - 84], MOUTH, 340);
const P_GLASS = arcPath([GLASSX, TABLE - 146], MOUTH, 470);

// --- the world ----------------------------------------------------------------------------------------------------------
const Lamp: React.FC<{ x: number; f: number }> = ({ x, f }) => (
  <g transform={`translate(${x} 150) rotate(${1.6 * Math.sin(f * 0.04 + x)})`}>
    <line x1={0} y1={-400} x2={0} y2={0} stroke={INK} strokeWidth={5} />
    <path d="M -74 66 Q -60 0 0 0 Q 60 0 74 66 Z" fill={NAVY2} {...K} strokeWidth={6} />
    <ellipse cx={0} cy={68} rx={32} ry={12} fill={YEL} {...K} strokeWidth={4} />
  </g>
);

const World: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-1000} y={-900} width={4600} height={2200} fill={WALL} />
    {/* wall tiles, low */}
    <rect x={-1000} y={770} width={4600} height={520} fill={WALL2} />
    {Array.from({ length: 56 }, (_, i) => (
      <line key={i} x1={-1000 + i * 84} y1={770} x2={-1000 + i * 84} y2={1290} stroke="#eccf8e" strokeWidth={4} />
    ))}
    {Array.from({ length: 6 }, (_, i) => (
      <line key={i} x1={-1000} y1={770 + i * 84} x2={3600} y2={770 + i * 84} stroke="#eccf8e" strokeWidth={4} />
    ))}
    <rect x={-1000} y={762} width={4600} height={10} fill={INK} opacity={0.25} />
    {/* place A: window above the counter */}
    <g transform="translate(1250 420)">
      <rect x={-230} y={-190} width={460} height={330} rx={10} fill="#bfe6ff" {...K} strokeWidth={8} />
      <line x1={0} y1={-190} x2={0} y2={140} {...K} strokeWidth={7} />
      <line x1={-230} y1={-30} x2={230} y2={-30} {...K} strokeWidth={7} />
      <rect x={-256} y={140} width={512} height={22} rx={6} fill={NAVY2} {...K} strokeWidth={6} />
    </g>
    <Lamp x={230} f={f} />
    <Lamp x={1270} f={f} />
    {/* floor */}
    <rect x={-1000} y={GROUND} width={4600} height={1300} fill={FLOOR} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-1000} y1={GROUND + 40 + i * 70 + i * i * 6} x2={3600} y2={GROUND + 40 + i * 70 + i * i * 6} stroke={FLOOR2} strokeWidth={5} />
    ))}
    <rect x={-1000} y={GROUND - 4} width={4600} height={10} fill={INK} opacity={0.35} />
    {/* place A: counter */}
    <rect x={-1000} y={COUNTER + 34} width={2190} height={GROUND - COUNTER - 34} fill={NAVY2} />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={-860 + i * 240} y={COUNTER + 66} width={196} height={GROUND - COUNTER - 92} rx={10} fill="none" stroke={NAVY} strokeWidth={6} />
    ))}
    <rect x={-1000} y={COUNTER} width={2210} height={34} rx={6} fill={NAVY} {...K} strokeWidth={6} />
  </g>
);

// lunch table foreground (place B); the cloth carries the words
const Table: React.FC = () => (
  <g>
    <rect x={1572} y={TABLE + 14} width={1530} height={GROUND - TABLE - 14} fill={CLOTH} />
    {Array.from({ length: 22 }, (_, i) => (
      <rect key={i} x={1572 + i * 70} y={TABLE + 14} width={35} height={GROUND - TABLE - 14} fill={WHITE} opacity={0.2} />
    ))}
    {Array.from({ length: 3 }, (_, i) => (
      <rect key={i} x={1572} y={TABLE + 14 + i * 56} width={1530} height={28} fill={WHITE} opacity={0.14} />
    ))}
    <line x1={1572} y1={TABLE + 14} x2={1572} y2={GROUND} {...K} strokeWidth={6} />
    <rect x={1556} y={TABLE} width={1550} height={20} rx={6} fill={WHITE} {...K} strokeWidth={6} />
  </g>
);

// see-through foods: xray 0..1, water 0..1 (share of its height)
const clipR = (id: string, top: number, h: number, x: number, w: number, wave: number) => (
  <g clipPath={`url(#${id})`}>
    <rect x={x} y={top} width={w} height={h} fill={WATER} />
    <ellipse cx={x + w / 2} cy={top} rx={w / 2} ry={wave} fill={WATER2} />
  </g>
);

const Soup: React.FC<{ xray: number; water: number; f: number }> = ({ xray, water, f }) => {
  const H = 96;
  const top = -H * water;
  return (
    <g>
      <defs>
        <clipPath id="h30soup">
          <path d={`M -92 ${-H} L 92 ${-H} Q 84 -6 28 -6 L -28 -6 Q -84 -6 -92 ${-H} Z`} />
        </clipPath>
      </defs>
      {/* steam, before x-ray */}
      <g opacity={1 - xray}>
        <path d={`M -30 ${-H - 12} q -12 -22 0 -40 q 12 -18 0 -40`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.25} transform={`translate(${2 * Math.sin(f * 0.1)} 0)`} />
        <path d={`M 26 ${-H - 12} q 12 -22 0 -40 q -12 -18 0 -40`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.25} transform={`translate(${2 * Math.sin(f * 0.1 + 2)} 0)`} />
      </g>
      <path d={`M -92 ${-H} L 92 ${-H} Q 84 -6 28 -6 L -28 -6 Q -84 -6 -92 ${-H} Z`} fill="#fff6e6" />
      <ellipse cx={0} cy={-H} rx={92} ry={18} fill="#f0a93b" opacity={1 - xray} />
      {xray > 0.01 && clipR("h30soup", top, H + 20, -96, 192, 8)}
      <path d={`M -92 ${-H} L 92 ${-H} Q 84 -6 28 -6 L -28 -6 Q -84 -6 -92 ${-H} Z`} fill="none" {...K} strokeWidth={7} />
      <ellipse cx={0} cy={-H} rx={92} ry={18} fill="none" {...K} strokeWidth={6} />
      <rect x={-30} y={-8} width={60} height={8} rx={3} fill={INK} />
    </g>
  );
};

const Melon: React.FC<{ xray: number; water: number }> = ({ xray, water }) => {
  const R = 118;
  const top = -R * water;
  const shape = `M ${-R} -4 A ${R} ${R} 0 0 1 ${R} -4 Z`;
  return (
    <g>
      <defs>
        <clipPath id="h30mel">
          <path d={`M ${-R + 14} -4 A ${R - 14} ${R - 14} 0 0 1 ${R - 14} -4 Z`} />
        </clipPath>
      </defs>
      <path d={shape} fill="#39a84d" {...K} strokeWidth={7} />
      <path d={`M ${-R + 14} -4 A ${R - 14} ${R - 14} 0 0 1 ${R - 14} -4 Z`} fill="#fff6e6" />
      <path d={`M ${-R + 14} -4 A ${R - 14} ${R - 14} 0 0 1 ${R - 14} -4 Z`} fill="#f0545c" opacity={1 - xray} />
      {xray > 0.01 && clipR("h30mel", top, R + 8, -R, R * 2, 8)}
      {[-54, -18, 22, 56, -32, 36, 2].map((x, i) => (
        <ellipse key={i} cx={x} cy={i < 4 ? -30 : -62} rx={6} ry={9} fill={INK} opacity={1 - xray * 0.55} />
      ))}
    </g>
  );
};

const TeaCup: React.FC<{ level?: number }> = ({ level = 1 }) => (
  <g>
    <ellipse cx={0} cy={-4} rx={66} ry={10} fill={WHITE} {...K} strokeWidth={5} />
    <path d="M 44 -58 q 34 2 26 24 q -6 14 -34 12" fill="none" {...K} strokeWidth={8} />
    <path d="M -52 -72 L 52 -72 Q 50 -10 18 -10 L -18 -10 Q -50 -10 -52 -72 Z" fill={WHITE} {...K} strokeWidth={6} />
    <ellipse cx={0} cy={-72} rx={52} ry={11} fill={TEA} opacity={level} {...K} strokeWidth={5} />
  </g>
);

const Jug: React.FC<{ level: number; band: number; label: string; labelK: number; slosh: number }> = ({ level, band, label, labelK, slosh }) => {
  const H = JUGH;
  const hw = JUGW / 2;
  const y = -H * level;
  const yBand = -H * band;
  return (
    <g>
      <defs>
        <clipPath id="h30jug">
          <path d={`M ${-hw + 4} ${-H} L ${hw - 4} ${-H} L ${hw - 10} -4 L ${-hw + 10} -4 Z`} />
        </clipPath>
      </defs>
      {/* handle */}
      <path d={`M ${hw - 2} ${-H + 54} q 62 10 56 88 q -4 70 -66 70`} fill="none" {...K} strokeWidth={14} />
      <path d={`M ${-hw} ${-H} L ${hw} ${-H} L ${hw - 8} 0 L ${-hw + 8} 0 Z`} fill={WHITE} opacity={0.72} />
      <g clipPath="url(#h30jug)">
        {level > 0.005 && (
          <>
            <path d={`M ${-hw} ${y + slosh} Q 0 ${y - slosh * 1.5} ${hw} ${y - slosh} L ${hw} 0 L ${-hw} 0 Z`} fill={WATER2} />
            {band > 0.005 && <rect x={-hw} y={yBand} width={JUGW} height={-yBand} fill={WATER} />}
            {band > 0.005 && <line x1={-hw} y1={yBand} x2={hw} y2={yBand} stroke={INK} strokeWidth={5} strokeDasharray="14 10" />}
            {band <= 0.005 && <path d={`M ${-hw} ${y + slosh} Q 0 ${y - slosh * 1.5} ${hw} ${y - slosh} L ${hw} 0 L ${-hw} 0 Z`} fill={WATER} />}
          </>
        )}
      </g>
      {/* five equal marks */}
      {[1, 2, 3, 4].map((i) => (
        <line key={i} x1={hw - 42} y1={(-H * i) / 5} x2={hw - 10} y2={(-H * i) / 5} {...K} strokeWidth={5} />
      ))}
      <path d={`M ${-hw} ${-H} L ${hw} ${-H} L ${hw - 8} 0 L ${-hw + 8} 0 Z`} fill="none" {...K} strokeWidth={8} />
      <path d={`M ${-hw} ${-H} q -34 -8 -42 -30 q 26 -2 42 8`} fill={WHITE} {...K} strokeWidth={7} />
      {labelK > 0.01 && (
        <g transform={`translate(-6 ${-H * 0.52}) scale(${labelK})`}>
          <rect x={-74} y={-36} width={148} height={72} rx={12} fill={YEL} {...K} strokeWidth={5} />
          <Txt y={15} s={44}>
            {label}
          </Txt>
        </g>
      )}
    </g>
  );
};

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [T.stop0, "thud", 0.42],
  [T.stop0 + 1, "clink", 0.3],
  ...[0, 1, 2, 4, 5, 6, 7].map((_, i) => [T.eight0 - 2 + i * 3, "clink", 0.1] as SfxCue),
  [T.c1 - 10, "whoosh", 0.1],
  [T.line1, "pop", 0.14],
  [DOC0 + 8, "swish", 0.1],
  [T.found2, "page", 0.3],
  [T.no2 + 2, "pop", 0.14],
  [RUN0 + 2, "whoosh_long", 0.16],
  [T.big3, "stamp", 0.22],
  [T.below4, "boing", 0.12],
  [T.e4 + 14, "tick", 0.2],
  [T.e4 + 24, "tick", 0.24],
  [T.c5 - 6, "swish", 0.26],
  [T.c5 + 2, "page", 0.34],
  [T.food5, "impact", 0.46],
  [T.food5 + 8, "swirl", 0.24],
  [T.food6, "pop", 0.14],
  [T.fifth6, "ding", 0.22],
  [T.drinks7, "swirl", 0.2],
  [T.tea7, "impact", 0.44],
  [T.tea7 + 2, "ding", 0.3],
  [T.c8 - 6, "clink", 0.14],
  [T.heat9, "pop", 0.18],
  [T.c10 + 4, "clink", 0.2],
  [LOOP, "whoosh", 0.12],
];

export const S01Jug: React.FC<SceneProps> = () => {
  const real = useCurrentFrame();
  const loopBack = real >= LOOP;
  // the loop: the last frames hold the opening frame while the glass falls from above; frame 0 continues the fall
  const f = loopBack ? 0 : real;
  const cam = camAtRig(real);

  // ---------------- glasses ----------------
  const fall = f < T.stop0 ? interpolate(f, [0, T.stop0], [-70, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const loopFall = loopBack ? interpolate(real, [LOOP, VOICE_FRAMES], [-700, -70], { ...clamp, easing: Easing.in(Easing.quad) }) : null;
  const heroY = loopFall ?? fall;
  const [hsx, hsy] = !loopBack && f >= T.stop0 ? squash(f, T.stop0, 0.16) : ([1, 1] as [number, number]);
  const heroS = interpolate(f, [T.eight0 - 4, T.eight0 + 20], [1.42, 1], { ...clamp, easing: eio });
  const heroSlosh = !loopBack && f >= T.stop0 ? 11 * Math.exp(-(f - T.stop0) / 14) * Math.sin((f - T.stop0) * 0.7) : 0;
  const glassPop = (i: number) => (i === HERO ? 1 : popIn(f, T.eight0 + Math.abs(i - HERO) * 3));

  // ---------------- doctor ----------------
  const docX = (t: number) => (t < DOC0 ? 1320 : ease(t, DOC0, DOC1, 1320, DOCX));
  const docOn = f >= DOC0 && f < RUN1 + 10;
  const folderOpen = interpolate(f, [T.found2 - 4, T.found2 + 8], [0, 1], { ...clamp, easing: eio });
  const noK = f >= T.no2 ? popIn(f, T.no2) * interpolate(f, [RUN0 + 2, RUN0 + 10], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const docKeys = gestureKeys([
    [0, { ra1: 34, ra2: 62, la1: -34, la2: -62 }],
    [T.no2 + 4, { ra1: 38, ra2: 66, la1: -38, la2: -66, head: 8 }, "smooth"],
    [T.rule2 + 2, { ra1: 34, ra2: 62, la1: -34, la2: -62, head: 0 }, "smooth"],
    [RUN0, { ra1: 95, ra2: 0, la1: -15, la2: 10 }, "snap"],
  ]);
  const docMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 9));
    if (t >= DOC0 && t < DOC1) q = addPose(q, walkCycle(t - DOC0, 0.38));
    q = addPose(q, shake(t, T.no2 + 2, 3));
    return { ...q, x: docX(t) };
  };

  // ---------------- report ----------------
  const lineK = f >= T.big3 ? popIn(f, T.big3) : 0;
  const titleK = f >= T.old3 ? popIn(f, T.old3) : 0;
  const tug = f < T.c5 - 6 ? (f >= T.e4 + 2 ? 4 * Math.sin((f - T.e4) * 0.5) * interpolate(f, [T.e4 + 2, T.c5 - 6], [0.3, 1], clamp) : 0) : 0;
  const rollK = interpolate(f, [T.c5 - 4, T.c5 + 8, T.c5 + 13, T.c5 + 17], [0, 1.05, 0.98, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const rollY = ROLL0 + (ROLL1 - ROLL0) * rollK + (rollK < 0.01 ? Math.max(0, tug) : 0);
  const rollR = 21 - 7 * Math.min(1, rollK);
  const pageUp = interpolate(f, [T.c6 - 8, T.c6 + 10], [0, -1250], { ...clamp, easing: Easing.in(Easing.cubic) });
  const lineHl = f >= T.most5 ? interpolate(f, [T.most5, T.most5 + 8], [0, 1], { ...clamp, easing: eo }) : 0;

  // ---------------- water ----------------
  const X0 = T.food5 - 2;
  const xray = interpolate(f, [X0, X0 + 12], [0, 1], { ...clamp, easing: eo });
  const fw = (full: number) => interpolate(f, [X0, X0 + 26], [0, full], { ...clamp, easing: Easing.bezier(0.2, 1.1, 0.4, 1) });
  const STOP1 = T.c6 - 6;
  const STOP2 = T.c8 - 22;
  const flow = (at: number, stop: number, off = 0): [number, number] => [
    interpolate(f, [stop, stop + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }),
    interpolate(f, [at + off, at + off + 16], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }),
  ];
  const soupF = flow(X0 + 4, STOP1);
  const melF = flow(X0 + 8, STOP1);
  const soup2 = flow(T.drinks7 + 6, STOP2, 6);
  const mel2 = flow(T.drinks7 + 6, STOP2, 10);
  const teaF = flow(T.drinks7 - 2, STOP2);
  const glassF = flow(T.drinks7 + 4, STOP2);
  const level = (() => {
    if (f < X0 + 16) return 0;
    if (f < T.food6) return interpolate(f, [X0 + 16, STOP1 + 6], [0, 0.72], { ...clamp, easing: Easing.out(Easing.quad) });
    if (f < T.drinks7 + 8) return interpolate(f, [T.food6, T.fifth6 + 6], [0.72, 0.2], { ...clamp, easing: eio });
    return interpolate(f, [T.drinks7 + 8, T.tea7 + 4], [0.2, 0.97], { ...clamp, easing: Easing.inOut(Easing.quad) });
  })();
  const band = f >= T.fifth6 + 6 ? 0.2 : 0;
  const jugSlosh = (f >= X0 + 16 && f < T.food6 ? 7 * Math.sin(f * 0.5) : 0) + (f >= T.drinks7 && f < STOP2 + 8 ? 8 * Math.sin(f * 0.48) : 0) + (f >= T.tea7 ? 6 * Math.exp(-(f - T.tea7) / 18) * Math.sin(f * 0.8) : 0);
  const labelNew = f >= T.c6 - 2;
  const labelK = f >= T.big3 ? (labelNew ? popIn(f, T.c6 - 2) : popIn(f, T.big3 + 4)) : 0;
  const [jsx, jsy] = f >= T.tea7 ? squash(f, T.tea7 + 2, 0.08) : ([1, 1] as [number, number]);
  const dim = interpolate(f, [T.e4 + 4, T.e4 + 16, T.c5 - 4, T.c5 + 6], [0, 0.3, 0.3, 0], clamp);
  const burst = interpolate(f, [T.tea7 - 2, T.tea7 + 8, STOP2 + 14, STOP2 + 28], [0, 1, 1, 0], clamp);

  // banners on the cloth (one at a time)
  const b1 = f >= T.food6 ? popIn(f, T.food6) * interpolate(f, [T.c7 - 8, T.c7 - 1], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const b2 = f >= T.drinks7 ? popIn(f, T.drinks7) * interpolate(f, [T.c8 - 14, T.c8 - 6], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const b2text = "FOOD + DRINKS";
  const b1text = f >= T.fifth6 - 2 ? "FOOD: ABOUT A FIFTH" : "FOOD";

  // bubbles
  const missK = f >= T.line1 - 2 && f < T.c2 - 14 ? popIn(f, T.line1 - 2) * interpolate(f, [T.c2 - 24, T.c2 - 16], [1, 0], clamp) : 0;
  const thirstK = f >= T.c8 + 8 && f < T.c9 - 2 ? popIn(f, T.c8 + 8) * interpolate(f, [T.c9 - 10, T.c9 - 2], [1, 0], clamp) : 0;
  const moreK = f >= T.heat9 && f < T.c10 - 2 ? popIn(f, T.heat9) * interpolate(f, [T.c10 - 10, T.c10 - 2], [1, 0], clamp) : 0;
  const askK = f >= T.c10 + 4 ? popIn(f, T.c10 + 4) : 0;

  // sun
  const sunK = f >= T.heat9 - 2 ? popIn(f, T.heat9 - 2) * interpolate(f, [T.c10 - 8, T.c10], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;

  // things Spark holds
  const holdGlass = f >= T.c8 - 8 && f < T.c10 - 8;
  const holdTea = f >= T.c10 - 4;
  const tableTea = f >= T.c10 - 6 ? 0 : 1;
  const tableGlass = f >= T.c8 - 10 && f < T.c10 + 400 ? 0 : 1;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.handsHips],
    [T.told0, G.doublePoint, "snap"],
    [T.eight0, G.presentBoth, "smooth"],
    [T.c1, G.pointUp, "snap"],
    [T.line1, G.count1, "smooth"],
    [T.missed1, G.leanIn, "snap"],
    [T.c2 - 16, G.rest, "smooth"],
    [T.c2 + 2, G.pointSide, "smooth"],
    [T.no2 + 2, G.shrugBig, "snap"],
    [RUN0, { ra1: 60, ra2: 80, la1: -60, la2: -80, lean: 12 }, "smooth"],
    [RUN1, G.rest, "smooth"],
    [T.report3 - 2, G.pointUp, "snap"],
    [T.big3, G.presentBoth, "snap"],
    [T.c4, G.thinkChin, "smooth"],
    [T.line4, { ra1: 140, ra2: -2, la1: -18, la2: 8, head: -6 }, "smooth"],
    [T.e4 + 6, { ra1: 156, ra2: -6, la1: -22, la2: 8, head: -10, lean: 4 }, "smooth"],
    [T.c5 - 8, { ra1: 170, ra2: 0, la1: -40, la2: 10, head: -12, lean: -6 }, "smooth"], // anticipation: up on his toes
    [T.c5 + 6, { ra1: 52, ra2: 14, la1: -26, la2: 8, head: 6, lean: 10 }, "snap"], // the pull
    [T.food5 - 1, G.mindBlown, "snap"],
    [T.c6 - 2, G.thinkChin, "smooth"],
    [T.fifth6, G.count1, "snap"],
    [T.c7, G.pointSide, "smooth"],
    [T.tea7 - 4, G.recoil, "smooth"],
    [T.tea7, G.celebrate, "snap"],
    [T.c8 - 22, G.rest, "smooth"],
    [T.c8 - 2, { ra1: 70, ra2: 95, la1: -16, la2: 8, head: -8 }, "smooth"], // drinks
    [T.thirst8, G.handsHips, "smooth"],
    [T.c9, { ra1: 70, ra2: 95, la1: -40, la2: -90 }, "snap"],
    [T.c10, { ra1: 100, ra2: 40, la1: -20, la2: 10 }, "smooth"],
    [T.tea10, { ra1: 118, ra2: 34, la1: -60, la2: -30, lean: 5 }, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t < T.stop0 + 8) return "shock";
    if (t < T.eight0) return "skeptical";
    if (t < T.c1) return "curious";
    if (t < T.missed1) return "wink";
    if (t < T.no2) return "curious";
    if (t < RUN0) return "worried";
    if (t < T.report3) return "determined";
    if (t < T.c4) return "curious";
    if (t < T.e4 + 6) return "thinking";
    if (t < T.food5 - 1) return "excited";
    if (t < T.c6 - 2) return "mindblown";
    if (t < T.c7) return "thinking";
    if (t < T.tea7 - 4) return "curious";
    if (t < T.c8 - 22) return "mindblown";
    if (t < T.thirst8) return "happy";
    if (t < T.c10) return "determined";
    if (t < T.tea10) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.food5 - 1, 56), bulbPulse(t, T.tea7, 66));
  const running = (t: number) => t >= RUN0 && t < RUN1;
  const jogging = (t: number) => t >= T.heat9 && t < T.c10 - 6;
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (running(t)) q = addPose(q, runCycle(t - RUN0, 0.5));
    if (jogging(t)) q = addPose(q, runCycle(t - T.heat9, 0.3));
    q = addPose(q, hop(t, T.food5 + 2, 18));
    q = addPose(q, hop(t, T.tea7, 26));
    q = addPose(q, nod(t, T.thirst8 + 2, 2));
    q = addPose(q, shake(t, T.no2 + 4, 2));
    const stepIn = interpolate(t, [T.tea7 - 16, T.tea7 + 2, T.c8 - 26, T.c8 - 8], [0, 130, 130, 0], { ...clamp, easing: eio });
    return { ...q, x: (t < RUN0 ? SX0 : ease(t, RUN0, RUN1, SX0, SXB)) + stepIn };
  };
  const sNow = (() => {
    if (real >= LOOP) return 2.2;
    if (f < T.eight0 + 20) return interpolate(f, [T.eight0 - 4, T.eight0 + 20], [2.2, SS], { ...clamp, easing: eio });
    if (f < T.c6) return interpolate(f, [T.food5 - 2, T.food5 + 8, T.c6 - 12, T.c6], [SS, 2.4, 2.4, SS], { ...clamp, easing: eio });
    if (f < T.c8) return interpolate(f, [T.tea7 - 2, T.tea7 + 8, T.c8 - 24, T.c8 - 10], [SS, 2.7, 2.7, SS], { ...clamp, easing: eio });
    return SS;
  })();

  const gripped = f >= T.e4 + 6 && f < T.c5 + 10;

  const svg = (
    <>
      <World f={f} />
      <defs>
        <clipPath id="h30rays">
          <rect x={1000} y={-900} width={2600} height={GROUND + 900 - 4} />
        </clipPath>
        <clipPath id="h30page">
          <rect x={PX0 - 10} y={PTOP - 10} width={PX1 - PX0 + 20} height={rollY - PTOP + 10} />
        </clipPath>
      </defs>

      {/* flat rays behind the table for the best picture */}
      {burst > 0.01 && (
        <g opacity={burst} clipPath="url(#h30rays)">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M 0 0 L 1500 -130 L 1500 130 Z" fill="#ffe28a" transform={`translate(${JUGX - 60} 700) rotate(${i * 30 + f * 0.12})`} />
          ))}
        </g>
      )}

      {/* ---------- A: the counter ---------- */}
      {Array.from({ length: 8 }, (_, i) => {
        if (i === HERO) return null;
        const k = glassPop(i);
        if (k < 0.01) return null;
        return (
          <g key={i} transform={`translate(${GX(i)} ${COUNTER}) scale(${k})`}>
            <Glass />
          </g>
        );
      })}
      <g transform={`translate(${GX(HERO)} ${COUNTER + heroY}) scale(${heroS * hsx} ${heroS * hsy})`}>
        <Glass slosh={heroSlosh} />
      </g>
      {!loopBack && f >= T.stop0 && f < T.stop0 + 14 && (
        <g transform={`translate(${GX(HERO)} ${COUNTER - 330})`} opacity={1 - (f - T.stop0) / 14}>
          {[-48, -18, 18, 48].map((x, i) => (
            <circle key={i} cx={x * (1 + (f - T.stop0) * 0.05)} cy={-(f - T.stop0) * (5 - Math.abs(x) * 0.04) + 0.32 * (f - T.stop0) ** 2} r={9} fill={WATER} {...K} strokeWidth={3} />
          ))}
        </g>
      )}

      {/* ---------- B: the old report on the wall (it rises away when "experts now say") ---------- */}
      <g transform={`translate(0 ${pageUp})`}>
      <g clipPath="url(#h30page)">
        <rect x={PX0} y={PTOP} width={PX1 - PX0} height={ROLL1 - PTOP + 50} fill={PAPER} {...K} strokeWidth={7} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={PX0 + 12} y1={PTOP + 60 * i + 16} x2={PX1 - 12} y2={PTOP + 60 * i + 22} stroke={PAPER2} strokeWidth={2} opacity={0.6} />
        ))}
        <g transform={`translate(${(PX0 + PX1) / 2} ${PTOP + 84}) scale(${0.9 + 0.1 * Math.min(1, titleK)})`}>
          <Txt y={0} s={60} c={NAVY}>
            HEALTH REPORT, 1945
          </Txt>
        </g>
        {lineK > 0.01 && (
          <g transform={`translate(${(PX0 + PX1) / 2} ${PTOP + 214}) scale(${lineK})`}>
            <Txt y={0} s={82}>
              ADULTS NEED
            </Txt>
            <Txt y={96} s={104} c="#c53a30">
              2.5 LITERS A DAY
            </Txt>
          </g>
        )}
        <g transform={`translate(${(PX0 + PX1) / 2} ${ROLL0 + 118})`}>
          <rect x={-352} y={-92 + 2} width={704 * lineHl} height={208} rx={12} fill={YEL} />
          <Txt y={-4} s={92}>
            MOST OF THIS IS
          </Txt>
          <Txt y={92} s={104}>
            IN YOUR FOOD
          </Txt>
        </g>
      </g>
      {/* the roll */}
      <rect x={PX0 - 22} y={rollY - 6} width={PX1 - PX0 + 44} height={rollR * 2} rx={rollR} fill={PAPER} {...K} strokeWidth={7} />
      <rect x={PX0 - 8} y={rollY + 2} width={PX1 - PX0 + 16} height={5} fill={PAPER2} />
      <circle cx={PX0 - 4} cy={PTOP + 8} r={9} fill="#c53a30" {...K} strokeWidth={4} />
      <circle cx={PX1 + 4} cy={PTOP + 8} r={9} fill="#c53a30" {...K} strokeWidth={4} />
      </g>

      {/* ---------- B: the lunch table ---------- */}
      <Table />
      <g transform={`translate(${SOUPX} ${TABLE}) scale(1.22)`}>
        <Soup xray={xray} water={fw(0.88)} f={f} />
      </g>
      <g transform={`translate(${MELX} ${TABLE}) scale(1.17)`}>
        <Melon xray={xray} water={fw(0.82)} />
      </g>
      {tableGlass > 0 && (
        <g transform={`translate(${GLASSX} ${TABLE}) scale(0.78)`}>
          <Glass />
        </g>
      )}
      {tableTea > 0 && (
        <g transform={`translate(${TEAX} ${TABLE})`}>
          <TeaCup />
        </g>
      )}
      <g transform={`translate(${JUGX} ${TABLE}) scale(${jsx} ${jsy})`}>
        <Jug level={level} band={band} label={labelNew ? "WATER" : "2.5 L"} labelK={labelK} slosh={jugSlosh} />
      </g>

      {/* ---------- streams ---------- */}
      <Stream d={P_SOUP} color={WATER} hi={WHITE} g0={soupF[0]} g1={soupF[1]} f={f} />
      <Stream d={P_MEL} color={WATER} hi={WHITE} g0={melF[0]} g1={melF[1]} f={f} />
      <Stream d={P_SOUP2} color={WATER} hi={WHITE} g0={soup2[0]} g1={soup2[1]} f={f} />
      <Stream d={P_MEL2} color={WATER} hi={WHITE} g0={mel2[0]} g1={mel2[1]} f={f} />
      <Stream d={P_TEA} color={TEA} hi="#ffd9a8" g0={teaF[0]} g1={teaF[1]} f={f} />
      <Stream d={P_GLASS} color={WATER2} hi={WHITE} g0={glassF[0]} g1={glassF[1]} f={f} />

      {/* ---------- words on the cloth ---------- */}
      {b1 > 0.01 && (
        <g transform={`translate(1985 ${TABLE + 86}) scale(${b1})`}>
          <rect x={-345} y={-54} width={690} height={108} rx={14} fill={WHITE} {...K} strokeWidth={7} />
          <Txt y={25} s={72}>
            {b1text}
          </Txt>
        </g>
      )}
      {b2 > 0.01 && (
        <g transform={`translate(1985 ${TABLE + 86}) scale(${b2})`}>
          <rect x={-345} y={-54} width={690} height={108} rx={14} fill={YEL} {...K} strokeWidth={7} />
          <Txt y={27} s={80}>
            {b2text}
          </Txt>
        </g>
      )}

      {/* ---------- doctor ---------- */}
      {docOn && (
        <Actor f={f} color={COL.purple} scale={1.75} base={{ x: 1320, y: GROUND - 92.5 * 1.75 }} keys={docKeys} mod={docMod} facing={(t) => (t < RUN0 ? -1 : 1)} face="happy" trails={false}>
          {(j) => {
            const bx = (j.lHand[0] + j.rHand[0]) / 2;
            const by = (j.lHand[1] + j.rHand[1]) / 2 - 8;
            const cover = Math.cos(folderOpen * Math.PI * 0.92);
            return (
              <g transform={`translate(${bx} ${by})`}>
                <rect x={-100} y={-70} width={200} height={140} rx={8} fill={WHITE} {...K} strokeWidth={6} />
                <line x1={0} y1={-70} x2={0} y2={70} {...K} strokeWidth={4} opacity={0.5} />
                <g transform={`translate(-100 0) scale(${cover} 1)`}>
                  <rect x={0} y={-70} width={200} height={140} rx={8} fill="#f0b23c" {...K} strokeWidth={6} />
                  {cover > 0.25 && (
                    <g transform={`translate(100 0)`}>
                      <Txt y={18} s={52}>
                        PROOF
                      </Txt>
                    </g>
                  )}
                </g>
              </g>
            );
          }}
        </Actor>
      )}
      {docOn && (
        <g transform={`translate(${docX(f) + 8} 866)`}>
          <rect x={-92} y={-30} width={184} height={60} rx={30} fill={WHITE} {...K} strokeWidth={5} />
          <Txt y={15} s={42} c={COL.purple}>
            DOCTOR
          </Txt>
        </g>
      )}
      {noK > 0.01 && (
        <g transform={`translate(${DOCX - 70} 680) scale(${noK}) rotate(${wobble(f, T.no2, 5)})`}>
          <Bubble w={330} h={120} tail={70}>
            <Txt y={22} s={66}>
              NO STUDY
            </Txt>
          </Bubble>
        </g>
      )}

      {/* ---------- bubbles ---------- */}
      {missK > 0.01 && (
        <g transform={`translate(${SX0 + 240} 720) scale(${missK}) rotate(${wobble(f, T.line1, 5)})`}>
          <Bubble w={350} h={116} fill={YEL} tail={-100}>
            <Txt y={21} s={60}>
              WHAT LINE?
            </Txt>
          </Bubble>
        </g>
      )}
      {thirstK > 0.01 && (
        <g transform={`translate(${SXB + 270} 780) scale(${thirstK}) rotate(${wobble(f, T.c8 + 8, 5)})`}>
          <Bubble w={440} h={120} tail={-140}>
            <Txt y={22} s={60}>
              THIRSTY? DRINK.
            </Txt>
          </Bubble>
        </g>
      )}
      {moreK > 0.01 && (
        <g transform={`translate(${SXB + 270} 780) scale(${moreK}) rotate(${wobble(f, T.heat9, 5)})`}>
          <Bubble w={370} h={120} fill={YEL} tail={-120}>
            <Txt y={22} s={64}>
              DRINK MORE
            </Txt>
          </Bubble>
        </g>
      )}
      {askK > 0.01 && f < LOOP && (
        <g transform={`translate(${SXB + 250} 780) scale(${askK}) rotate(${wobble(f, T.c10 + 4, 5)})`}>
          <Bubble w={340} h={120} tail={-110}>
            <Txt y={22} s={66}>
              YOUR TEA?
            </Txt>
          </Bubble>
        </g>
      )}

      {/* the sun at the window of place B */}
      {sunK > 0.01 && (
        <g transform={`translate(2030 470) scale(${sunK})`}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-10} y={-178} width={20} height={46} rx={10} fill="#ffb21f" {...K} strokeWidth={4} transform={`rotate(${i * 30 + f * 0.5})`} />
          ))}
          <circle r={118} fill={YEL} {...K} strokeWidth={7} />
          <Txt y={18} s={60}>
            HEAT
          </Txt>
        </g>
      )}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={1}>
        {(j) => {
          // the cord runs from the roll to the ring; the ring is in his hand while he pulls
          const ring: [number, number] = gripped ? [j.rHand[0], j.rHand[1]] : f < T.e4 ? [CORDX, ROLL0 + 300 + 3 * Math.sin(f * 0.08)] : [CORDX, rollY + 310];
          const show = f >= RUN1 - 16 && f < T.c6 + 30;
          const cordTop = rollY + rollR * 2 - 6;
          return (
            <>
              {show && (
                <g opacity={interpolate(f, [T.c5 + 12, T.c5 + 26], [1, 0], clamp)}>
                  <path d={`M ${CORDX} ${cordTop} L ${ring[0]} ${ring[1] - 18}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
                  <circle cx={ring[0]} cy={ring[1]} r={20} fill="none" stroke="#c53a30" strokeWidth={9} />
                </g>
              )}
              {holdGlass && (
                <g transform={`translate(${j.rHand[0] + 16} ${j.rHand[1] + 42}) rotate(${jogging(f) ? 0 : -14}) scale(0.62)`}>
                  <Glass />
                </g>
              )}
              {holdTea && f < LOOP && (
                <g transform={`translate(${j.rHand[0] + 12} ${j.rHand[1] + 28}) scale(${0.95 * popIn(f, T.c10 - 4)})`}>
                  <TeaCup />
                </g>
              )}
              {jogging(f) && (
                <g>
                  {[0, 1].map((i) => {
                    const t = ((f + i * 11) % 22) / 22;
                    return <path key={i} d="M 0 -14 Q 9 2 0 10 Q -9 2 0 -14 Z" fill={WATER} {...K} strokeWidth={3} transform={`translate(${j.headC[0] + (i ? 62 : -60) + t * (i ? 16 : -16)} ${j.headC[1] - 24 + t * 54}) `} opacity={1 - t} />;
                  })}
                </g>
              )}
            </>
          );
        }}
      </Spark>

      {dim > 0.01 && <rect x={-1000} y={-900} width={4600} height={3400} fill="#1c1430" opacity={dim} />}
    </>
  );

  const overlay = real < T.c1 - 4 || loopBack;
  const html = (
    <>
      {overlay && (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 270,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 168,
            color: WATER,
            WebkitTextStroke: `12px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          8 GLASSES.
          <br />
          SAYS WHO?
        </div>
      )}
      {real >= 300 && real < LOOP - 4 && (
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
            {real < T.c5 - 4
              ? "US report, 1945, via Valtin 2002. One likely start of the rule, not proven"
              : real < T.c6 - 8
                ? 'Its words: "Most of this quantity is contained in prepared foods."'
                : "US National Academies, 2004: about 80% from drinks, 20% from food"}
          </div>
          <div
            style={{
              position: "absolute",
              left: 96,
              top: 1745,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 21,
              color: INK,
              whiteSpace: "nowrap",
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
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
        f={real}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "eight", "glasses", "line", "missed", "doctor", "no", "study", "report", "number", "below", "food", "fifth", "drinks", "tea", "thirst", "heat", "exercise"]}
      />
    </>
  );

  const hits = [T.stop0 + 1, T.food5, T.tea7];
  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={hits} power={4} svg={svg} html={html} />;
};
