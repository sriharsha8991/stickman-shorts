import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V029 · "Stop. You never searched for most of what you watch." (~35 s, promise → build → reveal, Designed to get you)
// ONE world, wider than the screen, one moving belt that connects its two places, one camera rig:
//  A (x≈0–1200)     the seat at a crimson belt restaurant. A video on a plate rolls up, Spark stops it; food plates roll past;
//                   he takes a cake and feels he chose it.
//  B (x≈1200–2300)  the kitchen hatch at the head of the belt: only two metal hands are visible below a closed roll door,
//                   setting plates on the belt. KITCHEN → VIDEO APP, food → videos. Pause + belt stops + music drop.
//                   Over 7 of 10 minutes light up on the door, then the door rolls up: the app's computer (reveal).
// Source: YouTube chief product officer at CES, Jan 2018 (see facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;

// palette: crimson restaurant, warm wood, slate belt, cream kitchen
const WALL = "#b8394a";
const WALL2 = "#8f2a3b";
const WOOD = "#c98d52";
const WOOD2 = "#a56e3a";
const BELT = "#343a4d";
const STEEL = "#5a6788";
const STEEL2 = "#3f4a68";
const DOOR = "#9aa2b6";
const DOOR2 = "#7f889e";
const CREAM = "#fff3d6";
const YEL = "#ffd23f";
const WHITE = "#ffffff";
const GREEN = "#2fb463";
const INK = COL.ink;
const CARDS = ["#ff8f4f", "#6d7cf0", "#e65a9b", "#3bb3e0"];

const T = {
  stop0: W(0, 0),
  never0: W(0, 2),
  searched0: W(0, 3),
  c1: C(1),
  final1: W(1, 1),
  picked1: W(1, 5),
  c2: C(2),
  rest2: W(2, 2),
  belt2: W(2, 6),
  c3: C(3),
  plate3: W(3, 2),
  feels3: W(3, 3),
  choice3: W(3, 6),
  c4: C(4),
  kitchen4: W(4, 2),
  picks4: W(4, 3),
  plates4: W(4, 5),
  e4: E(4),
  c5: C(5),
  video5: W(5, 1),
  app5: W(5, 2),
  same5: W(5, 5),
  c6: C(6),
  watching6: W(6, 2),
  belt6: W(6, 6),
  e6: E(6),
  c7: C(7),
  yt7: W(7, 3),
  over7: W(7, 5),
  seven7: W(7, 6),
  minutes7: W(7, 9),
  c8: C(8),
  computer8: W(8, 2),
  picked8: W(8, 3),
  e8: E(8),
  c9: C(9),
  search9: W(9, 1),
  video9: W(9, 4),
  today9: W(9, 5),
  c10: C(10),
  last10: W(10, 3),
  search10: W(10, 5),
};
const LOOP = VOICE_FRAMES - 14;
const DOORUP_F = T.computer8 - 8;

// --- staging (world coordinates) -----------------------------------------------------------------------------------
const SX0 = 290; // Spark at the seat
const SXB = 1335; // Spark by the kitchen hatch
const WALK0 = T.c4 - 8;
const WALK1 = T.c4 + 24;
const BELTY = 1000;
const HATCH = { x0: 1520, x1: 2232, top: 90 };
const DOORB = 780; // the roll door's lower edge when closed
const RX = 1876; // robot centre
const BORN = 1838;
const SPACE = 300;
const HOOK_X = 700;

// --- the belt: one distance D(f) drives everything on it --------------------------------------------------------------
const BELT0 = T.c2 - 6;
const STOP0 = T.e6 + 2;
const STOP1 = T.e6 + 20;
const RE0 = T.search9;
const OWN_REL = T.video9 + 4; // Spark's own video leaves the hand
const RE1 = OWN_REL + 40;
const spd = (f: number) => {
  if (f < BELT0) return 0;
  if (f < STOP1) return 5 * interpolate(f, [BELT0, BELT0 + 18, STOP0, STOP1], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  if (f < RE0) return 0;
  return 4 * interpolate(f, [RE0, RE0 + 12, RE1 - 12, RE1], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
};
const DTABLE: number[] = (() => {
  const a = [0];
  for (let i = 1; i <= VOICE_FRAMES + 2; i++) a.push(a[i - 1] + spd(i));
  return a;
})();
const D = (f: number) => DTABLE[Math.max(0, Math.min(DTABLE.length - 1, Math.floor(f)))];

type Plate = { x0: number; kind: number }; // kind 0..3 food
const PLATES: Plate[] = Array.from({ length: 11 }, (_, k) => ({ x0: 1055 + SPACE * k, kind: k % 4 }));
const GRAB = T.plate3 - 4; // Spark takes plate 0
const GRAB1 = GRAB + 12;
const RELEASE = T.plates4 + 4; // he puts it back on the belt by the kitchen
const flipAt = (k: number) => {
  if (k >= 7) return -1; // born as videos
  if (k === 6) return T.video5 + 2;
  if (k === 5) return T.video5 + 14;
  if (k === 4) return T.video5 + 26;
  return 99999;
};

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 560, 880, 1.25], // frame 0: Spark + the video plate
  [T.c1 - 12, T.c1 + 10, 400, 930, 1.42], // CU Spark (promise)
  [T.c2 - 16, T.c2 + 6, 640, 820, 1.0], // WIDE: the seat and the belt
  [WALK0 + 2, WALK1 + 2, 1740, 820, 1.0], // travel along the belt to the kitchen (voice says "kitchen")
  [T.c6 - 6, T.c6 + 18, 1660, 850, 1.07], // slow push: Spark + hands
  [T.e6 + 2, T.e6 + 22, 1740, 820, 1.0], // wide in the pause (settles before the number)
  [T.c10 - 14, T.c10 + 8, 1500, 880, 1.16], // CU question
  [LOOP, LOOP, 560, 880, 1.25], // cut back into frame 0
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

const Pill: React.FC<{ text: string; fill: string; w: number; s?: number; c?: string; h?: number }> = ({ text, fill, w, s = 40, c = WHITE, h = 76 }) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} {...K} strokeWidth={5} />
    <Txt y={s * 0.36} s={s} c={c}>
      {text}
    </Txt>
  </g>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={4} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

// food on a plate; (0,0) = plate centre on the belt surface
const Food: React.FC<{ kind: number }> = ({ kind }) => {
  if (kind === 0)
    return (
      <g>
        {/* cake slice */}
        <path d="M -62 -14 L -62 -74 L 58 -96 L 58 -14 Z" fill="#fbe2b5" {...K} strokeWidth={5} />
        <rect x={-62} y={-50} width={120} height={12} fill="#e8747c" />
        <path d="M -62 -74 L 58 -96 L 58 -80 L -62 -60 Z" fill="#ff9fb0" {...K} strokeWidth={5} />
        <circle cx={6} cy={-100} r={15} fill="#e8384a" {...K} strokeWidth={4} />
      </g>
    );
  if (kind === 1)
    return (
      <g>
        {/* burger */}
        <path d="M -62 -58 Q -62 -112 0 -112 Q 62 -112 62 -58 Z" fill="#e9a955" {...K} strokeWidth={5} />
        <rect x={-66} y={-58} width={132} height={13} rx={6} fill="#6fbf4a" {...K} strokeWidth={4} />
        <rect x={-60} y={-45} width={120} height={16} rx={7} fill="#6b3d22" {...K} strokeWidth={4} />
        <rect x={-62} y={-29} width={124} height={17} rx={8} fill="#e9a955" {...K} strokeWidth={5} />
      </g>
    );
  if (kind === 2)
    return (
      <g>
        {/* noodle bowl */}
        <path d="M -44 -92 Q -24 -112 -6 -90 M -8 -92 Q 12 -112 30 -90" fill="none" stroke={WHITE} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
        <path d="M -72 -72 L 72 -72 Q 66 -14 0 -14 Q -66 -14 -72 -72 Z" fill="#f4f0e6" {...K} strokeWidth={5} />
        <path d="M -60 -72 Q -20 -86 0 -72 Q 26 -86 60 -72 Z" fill="#f3c64a" {...K} strokeWidth={4} />
      </g>
    );
  return (
    <g>
      {/* donut */}
      <circle cx={0} cy={-58} r={46} fill="#e8a65c" {...K} strokeWidth={5} />
      <path d="M -40 -68 Q -30 -102 0 -102 Q 34 -102 42 -66 Q 26 -52 8 -70 Q -16 -48 -40 -68 Z" fill="#f56f9f" />
      <circle cx={0} cy={-58} r={14} fill={WALL} {...K} strokeWidth={4} />
    </g>
  );
};

// a video standing on a plate; (0,0) = plate centre. check → the viewer's own pick.
const VideoCard: React.FC<{ color: string; check?: boolean; label?: string }> = ({ color, check, label }) => (
  <g>
    <rect x={-92} y={-146} width={184} height={132} rx={14} fill={color} {...K} strokeWidth={6} />
    {check ? (
      <path d="M -36 -82 L -8 -52 L 42 -112" fill="none" stroke={WHITE} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <>
        <circle cx={0} cy={-80} r={39} fill={WHITE} {...K} strokeWidth={5} />
        <path d="M -12 -100 L 20 -80 L -12 -60 Z" fill={INK} strokeLinejoin="round" />
      </>
    )}
    {label && (
      <g transform="translate(0 -178)">
        <Pill text={label} fill={WHITE} c={GREEN} w={230} s={34} h={56} />
      </g>
    )}
  </g>
);

const PlateDisc: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <g>
    <ellipse cx={0} cy={-4} rx={100} ry={15} fill={WHITE} {...K} strokeWidth={5} />
    <ellipse cx={0} cy={-6} rx={64} ry={8} fill="#e6dfd0" />
    {children}
  </g>
);

// a metal hand seen from above the plate; (0,0) = palm
const Hand: React.FC<{ flip?: number }> = ({ flip = 1 }) => (
  <g transform={`scale(${flip} 1)`}>
    <rect x={-24} y={-38} width={48} height={58} rx={16} fill={STEEL} {...K} strokeWidth={6} />
    <rect x={-40} y={2} width={22} height={48} rx={11} fill={STEEL2} {...K} strokeWidth={5} />
    <rect x={-11} y={8} width={22} height={50} rx={11} fill={STEEL2} {...K} strokeWidth={5} />
    <rect x={18} y={2} width={22} height={48} rx={11} fill={STEEL2} {...K} strokeWidth={5} />
  </g>
);

// the app's computer: a big robot cook, friendly, chest = 10 tile board (tiles are drawn separately on top)
const Robot: React.FC<{ f: number; tilt: number; eye: number; surprised: number }> = ({ f, tilt, eye, surprised }) => {
  const blink = (f + 11) % 83 < 4 ? 0.15 : 1;
  return (
    <g>
      {/* neck */}
      <rect x={RX - 44} y={322} width={88} height={40} fill={STEEL2} {...K} strokeWidth={6} />
      {/* body */}
      <rect x={RX - 352} y={352} width={704} height={700} rx={46} fill={STEEL} {...K} strokeWidth={8} />
      <rect x={RX - 336} y={362} width={672} height={296} rx={24} fill={INK} />
      {/* head + chef hat */}
      <g transform={`rotate(${tilt} ${RX} 330)`}>
        <path
          d={`M ${RX - 112} 196 Q ${RX - 172} 124 ${RX - 94} 104 Q ${RX - 58} 50 ${RX} 78 Q ${RX + 58} 50 ${RX + 94} 104 Q ${RX + 172} 124 ${RX + 112} 196 Z`}
          fill={WHITE}
          {...K}
          strokeWidth={7}
        />
        <Txt x={RX} y={160} s={45}>
          THE APP
        </Txt>
        <rect x={RX - 164} y={188} width={328} height={146} rx={38} fill={STEEL2} {...K} strokeWidth={8} />
        <rect x={RX - 140} y={208} width={280} height={106} rx={24} fill="#eaf0ff" {...K} strokeWidth={5} />
        <ellipse cx={RX - 66} cy={254} rx={21} ry={(21 + surprised * 8) * blink} fill={INK} />
        <ellipse cx={RX + 66} cy={254} rx={21} ry={(21 + surprised * 8) * blink} fill={INK} />
        <circle cx={RX - 66 + eye * 8} cy={246} r={6.5} fill={WHITE} />
        <circle cx={RX + 66 + eye * 8} cy={246} r={6.5} fill={WHITE} />
        {surprised > 0.5 ? (
          <ellipse cx={RX} cy={294} rx={16} ry={13} fill={INK} />
        ) : (
          <path d={`M ${RX - 34} 286 Q ${RX} 310 ${RX + 34} 286`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        )}
      </g>
    </g>
  );
};

// --- the world ----------------------------------------------------------------------------------------------------------
const Lantern: React.FC<{ x: number; y: number; f: number; c?: string }> = ({ x, y, f, c = "#ffcf7a" }) => (
  <g transform={`translate(${x} ${y}) rotate(${2.4 * Math.sin(f * 0.045 + x)})`}>
    <line x1={0} y1={-220} x2={0} y2={-46} stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={0} rx={56} ry={50} fill={c} {...K} strokeWidth={6} />
    <path d="M -50 -18 Q 0 -6 50 -18 M -52 16 Q 0 28 52 16" fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
    <rect x={-20} y={46} width={40} height={10} fill={INK} />
  </g>
);

const World: React.FC<{ f: number; beltD: number }> = ({ f, beltD }) => (
  <g>
    <rect x={-1000} y={-900} width={4400} height={2200} fill={WALL} />
    {/* wooden panel low on the wall */}
    <rect x={-1000} y={780} width={4400} height={240} fill={WALL2} />
    <rect x={-1000} y={768} width={4400} height={14} fill={INK} opacity={0.35} />
    {Array.from({ length: 8 }, (_, i) => (
      <Lantern key={i} x={-120 + i * 330} y={i % 2 ? 330 : 290} f={f} c={i % 3 === 1 ? "#ffb26b" : "#ffcf7a"} />
    ))}
    {/* cup shelf at the seat */}
    <g transform="translate(830 700)">
      <rect x={-200} y={0} width={400} height={18} fill={WOOD2} {...K} strokeWidth={5} />
      {[-140, -46, 48, 142].map((x, i) => (
        <g key={i} transform={`translate(${x} 0)`}>
          <path d="M -32 -58 L 32 -58 L 24 0 L -24 0 Z" fill={i % 2 ? "#fff0d4" : "#ffd9c2"} {...K} strokeWidth={5} />
        </g>
      ))}
    </g>
    {/* floor */}
    <rect x={-1000} y={GROUND} width={4400} height={1300} fill="#5e3226" />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-1000} y1={GROUND + 40 + i * 70 + i * i * 6} x2={3400} y2={GROUND + 40 + i * 70 + i * i * 6} stroke="#4a261c" strokeWidth={5} />
    ))}
    <rect x={-1000} y={GROUND - 4} width={4400} height={10} fill={INK} opacity={0.35} />
    {/* counter front */}
    <rect x={-1000} y={BELTY + 40} width={4400} height={GROUND - BELTY - 40} fill={WOOD} />
    {Array.from({ length: 34 }, (_, i) => (
      <line key={i} x1={-960 + i * 130} y1={BELTY + 40} x2={-960 + i * 130} y2={GROUND} stroke={WOOD2} strokeWidth={5} />
    ))}
    <rect x={-1000} y={BELTY + 40} width={4400} height={12} fill={INK} opacity={0.3} />
    {/* the belt: its marks travel with D(f) */}
    <rect x={-1000} y={BELTY} width={4400} height={40} fill={BELT} stroke={INK} strokeWidth={6} />
    {Array.from({ length: 60 }, (_, i) => {
      const x = ((i * 90 - beltD) % 5400 + 5400) % 5400 - 1000;
      return <line key={i} x1={x} y1={BELTY + 6} x2={x - 12} y2={BELTY + 34} stroke="#6d7591" strokeWidth={7} strokeLinecap="round" />;
    })}
  </g>
);

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [T.stop0 + 2, "thud", 0.32],
  [T.final1, "pop", 0.12],
  [T.c1 - 10, "whoosh", 0.1],
  [T.c2 - 14, "whoosh", 0.12],
  [T.belt2, "pop", 0.16],
  [T.plate3 - 2, "swish", 0.2],
  [T.feels3 + 2, "ding", 0.2],
  [WALK0 + 2, "whoosh_long", 0.16],
  [T.kitchen4, "pop", 0.18],
  [T.plates4, "thud", 0.16],
  [T.video5 + 2, "boing", 0.13],
  [T.app5, "stamp", 0.2],
  [T.video5 + 14, "pop", 0.13],
  [T.watching6, "pop", 0.14],
  [STOP0 + 6, "thud", 0.22],
  [T.yt7, "pop", 0.16],
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => [T.over7 + i * 5, "tick", 0.32] as SfxCue),
  [T.minutes7, "impact", 0.34],
  [T.computer8 - 8, "swish", 0.28],
  [T.computer8 - 4, "impact", 0.5],
  [T.computer8 + 8, "stamp", 0.2],
  [T.search9, "scribble", 0.15],
  [T.video9, "pop", 0.16],
  [OWN_REL, "thud", 0.2],
  [RE1 - 4, "ding", 0.3],
  [T.c10 - 2, "pop", 0.12],
  [LOOP, "swish", 0.16],
];

export const S01Belt: React.FC<SceneProps> = () => {
  const real = useCurrentFrame();
  const loopBack = real >= LOOP;
  // the loop: the last 14 frames replay frames 0–13, so the end flows straight into frame 0
  const f = loopBack ? real - LOOP : real;
  const cam = camAtRig(real);
  const d = D(f);

  // ---------------- hook plate ----------------
  const hookX = f < 8 ? interpolate(f, [0, 8], [930, HOOK_X], { ...clamp, easing: Easing.out(Easing.cubic) }) : HOOK_X - d;
  const hookRock = wobble(f, 8, 5, 8);

  // ---------------- plates ----------------
  const grabK = interpolate(f, [GRAB, GRAB1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

  // --- Spark position ---
  const sparkX = (t: number) => (t < WALK0 ? SX0 : ease(t, WALK0, WALK1, SX0, SXB));

  // the plate Spark takes
  const handAt = (t: number): [number, number] => [sparkX(t) + 150, 985];
  const takenPos = (): [number, number] => {
    const from: [number, number] = [PLATES[0].x0 - D(GRAB), BELTY - 2];
    if (f < GRAB1) return arc(grabK, from, handAt(f), 60);
    if (f < RELEASE) return handAt(f);
    return [handAt(RELEASE)[0] - (d - D(RELEASE)), BELTY - 2];
  };

  // ---------------- the metal hands ----------------
  const beltOn = f < STOP1;
  const dist = ((d - (PLATES[0].x0 - BORN)) % SPACE + SPACE) % SPACE;
  const hx0 = 112 + (dist < 140 ? BORN - dist : BORN - 140 + 140 * Easing.inOut(Easing.quad)((dist - 140) / (SPACE - 140)));
  const hy0 = dist < 140 ? 948 : 948 - 96 * Math.sin((Math.PI * (dist - 140)) / (SPACE - 140));
  const OWN_X = 1772;
  const placing = f >= T.c9 ? interpolate(f, [T.c9, T.c9 + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const lift = interpolate(f, [OWN_REL, OWN_REL + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const leftHand: [number, number] = beltOn
    ? [hx0, hy0]
    : [hx0 + (OWN_X - hx0) * placing + 60 * lift, hy0 + (948 - hy0) * placing - 90 * lift];
  const waveK = interpolate(f, [DOORUP_F + 14, DOORUP_F + 30, T.c9 - 8, T.c9 + 6], [0, 1, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const rightHand: [number, number] = [2108 + waveK * 26 * Math.sin(f * 0.24), 880 + 5 * Math.sin(f * 0.07) - 50 * waveK];

  // ---------------- kitchen door + reveal ----------------
  const DOORUP = DOORUP_F;
  const doorK = f >= DOORUP ? interpolate(f, [DOORUP, DOORUP + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.7, 0, 0.9, 0.6) }) : 0;
  const doorShake = f >= T.computer8 - 20 && f < DOORUP ? 3 * Math.sin(f * 2.3) : 0;
  const doorB = DOORB + (HATCH.top - DOORB) * doorK;
  const lights = interpolate(f, [DOORUP, DOORUP + 8], [0, 1], clamp);
  const dim = interpolate(f, [T.e6 + 2, T.e6 + 18, DOORUP, DOORUP + 8], [0, 0.32, 0.22, 0], clamp);
  const robotBounce = f >= DOORUP ? squash(f, DOORUP + 10, 0.05) : ([1, 1] as [number, number]);
  const burstK = interpolate(f, [DOORUP + 6, DOORUP + 14], [0, 1], clamp);

  // sign: KITCHEN flips to VIDEO APP on "app"
  const signFlip = interpolate(f, [T.app5 - 7, T.app5 + 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const signSy = Math.max(0.02, Math.abs(Math.cos(signFlip * Math.PI)));
  const signText = signFlip < 0.5 ? "KITCHEN" : "VIDEO APP";
  const signPop = f >= T.kitchen4 - 2 ? popIn(f, T.kitchen4 - 2) : 0;

  // tiles
  const TILE = 116;
  const tileAt = (i: number) => T.over7 + i * 5;
  const lit = (i: number) => i < 7 && f >= tileAt(i);
  const boardK = f >= T.yt7 - 8 ? interpolate(f, [T.yt7 - 8, T.yt7 + 2], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const bannerK = f >= T.minutes7 - 2 ? popIn(f, T.minutes7 - 2) : 0;
  const bannerOut = interpolate(f, [T.c9 - 10, T.c9 - 2], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) });
  const banner2 = f >= T.computer8 - 2 ? interpolate(f, [T.computer8 - 2, T.computer8 + 4], [0, 1], clamp) : 0;
  const ytK = f >= T.yt7 - 2 ? popIn(f, T.yt7 - 2) * (1 - doorK) : 0;
  const year = f >= T.c7 + 2 ? popIn(f, T.c7 + 2) * (1 - doorK) : 0;
  const hits = [T.stop0 + 1, T.minutes7, T.computer8 - 2];

  // search bar
  const searchK = f >= T.c9 - 4 ? popIn(f, T.c9 - 4) * interpolate(f, [T.c10 - 8, T.c10], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const SEARCH = "ONE VIDEO I WANT";
  const typed = SEARCH.slice(0, Math.floor(interpolate(f, [T.search9, T.video9 + 12], [0, SEARCH.length], clamp)));
  const ownOn = f >= T.c9 + 12;
  const ownK = ownOn ? popIn(f, T.c9 + 12) : 0;
  const ownX = f < OWN_REL ? OWN_X - 112 : OWN_X - 112 - (d - D(OWN_REL));

  // bubbles and pills
  const stopBurst = f >= T.stop0 && f < T.stop0 + 10 ? (f - T.stop0) / 10 : 0;
  const whoK = f >= T.picked1 - 6 && f < T.c2 - 6 ? popIn(f, T.picked1 - 6) : 0;
  const restK = f >= T.rest2 - 2 && f < WALK0 + 2 ? popIn(f, T.rest2 - 2) : 0;
  const beltK = f >= T.belt2 - 2 && f < T.c3 - 2 ? popIn(f, T.belt2 - 2) * interpolate(f, [T.c3 - 10, T.c3 - 2], [1, 0], clamp) : 0;
  const mineK = f >= T.feels3 && f < WALK0 + 2 ? popIn(f, T.feels3) : 0;
  const howK = f >= T.watching6 - 4 && f < T.e6 + 8 ? popIn(f, T.watching6 - 4) * interpolate(f, [T.e6, T.e6 + 8], [1, 0], clamp) : 0;
  const askK = f >= T.c10 - 2 ? popIn(f, T.c10 - 2) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.stop],
    [T.never0 + 6, G.armsCrossed, "smooth"],
    [T.c1, G.pointSide, "smooth"],
    [T.picked1, G.doublePoint, "snap"],
    [T.c2 - 8, G.rest, "smooth"],
    [T.rest2, G.presentBoth, "smooth"],
    [T.belt2, G.pointSide, "snap"],
    [GRAB - 6, { ra1: 70, ra2: 30, la1: -14, la2: 6, lean: 6 }, "smooth"],
    [GRAB1, { ra1: 74, ra2: 26, la1: -60, la2: -30, head: -4 }, "smooth"],
    [T.feels3 + 4, { ra1: 74, ra2: 26, la1: -150, la2: -30, head: -6 }, "snap"],
    [WALK0, { ra1: 72, ra2: 28, la1: -20, la2: 10 }, "smooth"],
    [T.plates4, G.pointSide, "snap"],
    [T.e4 + 6, G.thinkChin, "smooth"],
    [T.c5, G.doublePoint, "smooth"],
    [T.same5, G.shrugBig, "snap"],
    [T.c6, G.thinkChin, "smooth"],
    [T.belt6, G.leanIn, "smooth"],
    [T.c7, G.pointUp, "smooth"],
    [T.seven7, G.recoil, "snap"],
    [T.minutes7 + 6, G.handsHips, "smooth"],
    [T.c8, G.recoil, "smooth"], // anticipation for the big reaction
    [T.computer8 - 6, G.mindBlown, "snap"],
    [T.e8 + 44, G.rest, "smooth"],
    [T.c9, G.count1, "snap"],
    [T.video9, G.pointSide, "smooth"],
    [T.today9 + 8, G.fistPump, "snap"],
    [T.c10, G.beckon, "smooth"],
    [T.last10, G.leanIn, "smooth"],
    [T.search10, G.doublePoint, "snap"],
    [LOOP + 40, G.rest, "smooth"],
  ]);
  const mood = (t: number): Mood => {
    if (t < T.never0) return "shock";
    if (t < T.c1) return "skeptical";
    if (t < T.c2 - 8) return "wink";
    if (t < GRAB - 4) return "happy";
    if (t < WALK0) return "excited";
    if (t < T.c5) return "worried";
    if (t < T.c6) return "curious";
    if (t < T.c7) return "thinking";
    if (t < T.seven7) return "curious";
    if (t < T.c8) return "shock";
    if (t < T.e8 + 44) return "mindblown";
    if (t < T.c10) return "determined";
    if (t < T.search10) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.computer8 - 6, 96), bulbPulse(t, T.c9 + 4, 16) * 0.6);
  const walking = (t: number) => t >= WALK0 && t < WALK1;
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (walking(t)) q = addPose(q, walkCycle(t - WALK0, 0.42));
    q = addPose(q, hop(t, T.feels3 + 2, 16));
    q = addPose(q, hop(t, T.computer8 - 4, 30));
    q = addPose(q, hop(t, T.today9 + 8, 12));
    q = addPose(q, nod(t, T.picked1 + 2, 2));
    q = addPose(q, shake(t, T.seven7 + 2, 2));
    return { ...q, x: sparkX(t) };
  };

  const plateNodes = PLATES.map((p, k) => {
    if (k === 0 && f >= GRAB) return null;
    const x = p.x0 - d;
    if (x < -300 || x > BORN + 1) return null;
    if (k > 8) return null;
    const born = x0Born(p.x0);
    const lifted = f >= born ? interpolate(f, [born, born + 10], [46, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
    const fa = flipAt(k);
    const flip = interpolate(f, [fa, fa + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    const sx = Math.max(0.03, Math.abs(Math.cos(flip * Math.PI)));
    const rock = 1.4 * Math.sin(f * 0.22 + k) * (beltOn && f > BELT0 ? 1 : 0);
    return (
      <g key={k} transform={`translate(${x} ${BELTY - 2 - lifted}) rotate(${rock})`}>
        <PlateDisc>
          <g transform={`scale(${sx} 1)`}>{flip > 0.5 ? <VideoCard color={CARDS[k % 4]} /> : <Food kind={p.kind} />}</g>
        </PlateDisc>
      </g>
    );
  });

  const sNow = interpolate(f, [DOORUP - 2, DOORUP + 9, DOORUP + 14, T.e8 + 40, T.e8 + 52], [SS, 2.48, 2.4, 2.4, SS], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const taken = takenPos();

  const svg = (
    <>
      <defs>
        <clipPath id="v029hatch">
          <rect x={HATCH.x0} y={HATCH.top} width={HATCH.x1 - HATCH.x0} height={BELTY - HATCH.top} />
        </clipPath>
      </defs>
      <World f={f} beltD={d} />

      {/* ---------- B: kitchen hatch ---------- */}
      <g>
        <rect x={HATCH.x0 - 18} y={HATCH.top - 18} width={HATCH.x1 - HATCH.x0 + 36} height={BELTY - HATCH.top + 18} fill={WOOD2} {...K} strokeWidth={7} />
        <g clipPath="url(#v029hatch)">
          <rect x={HATCH.x0} y={HATCH.top} width={HATCH.x1 - HATCH.x0} height={BELTY - HATCH.top} fill={lights > 0.5 ? "#ffe9b0" : "#2a2230"} />
          {burstK > 0.01 && (
            <g opacity={burstK}>
              {Array.from({ length: 14 }, (_, i) => (
                <path key={i} d="M 0 0 L 1300 -150 L 1300 150 Z" fill="#ffd27a" transform={`translate(${RX} 510) rotate(${i * 25.7 + f * 0.1})`} />
              ))}
            </g>
          )}
          {lights > 0.02 && (
            <g transform={`translate(${RX} 1000) scale(${robotBounce[0]} ${robotBounce[1]}) translate(${-RX} -1000)`}>
              <Robot f={f} tilt={f >= T.search9 ? 7 * Math.sin(Math.min(1, (f - T.search9) / 14) * Math.PI * 0.5) : wobble(f, DOORUP + 12, 4, 10)} eye={-1} surprised={f >= T.search9 && f < T.c10 ? 1 : 0} />
            </g>
          )}
        </g>
      </g>

      {/* a stack of plates waiting in the kitchen */}
      <g clipPath="url(#v029hatch)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(2108 ${BELTY - 2 - i * 13})`}>
            <PlateDisc />
          </g>
        ))}
      </g>

      {/* ---------- arms + hands (from shoulders hidden behind the door) ---------- */}
      <g clipPath="url(#v029hatch)">
        <path d={`M ${RX - 330} 700 C ${RX - 400} 800 ${leftHand[0] + 40} 760 ${leftHand[0]} ${leftHand[1] - 30}`} fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" />
        <path d={`M ${RX - 330} 700 C ${RX - 400} 800 ${leftHand[0] + 40} 760 ${leftHand[0]} ${leftHand[1] - 30}`} fill="none" stroke={STEEL} strokeWidth={32} strokeLinecap="round" />
        <path d={`M ${RX + 330} 700 C ${RX + 330} 780 ${rightHand[0] + 30} 780 ${rightHand[0]} ${rightHand[1] - 30}`} fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" />
        <path d={`M ${RX + 330} 700 C ${RX + 330} 780 ${rightHand[0] + 30} 780 ${rightHand[0]} ${rightHand[1] - 30}`} fill="none" stroke={STEEL} strokeWidth={32} strokeLinecap="round" />
      </g>

      {/* ---------- the plates on the belt ---------- */}
      {plateNodes}

      {/* Spark's own video */}
      {ownOn && f < LOOP && (
        <g transform={`translate(${ownX} ${BELTY - 2}) scale(${ownK}) rotate(${wobble(f, RE1, 3, 8)})`}>
          <PlateDisc>
            <VideoCard color={GREEN} check label={f >= T.today9 ? "YOUR PICK" : undefined} />
          </PlateDisc>
        </g>
      )}

      {/* hands on top of the plates */}
      <g transform={`translate(${leftHand[0]} ${leftHand[1]})`}>
        <Hand />
      </g>
      <g transform={`translate(${rightHand[0]} ${rightHand[1]})`}>
        <Hand flip={-1} />
      </g>

      {/* the hook plate: big, it rolls in and Spark stops it */}
      {hookX > -300 && (
        <g transform={`translate(${hookX} ${BELTY - 2}) scale(1.4) rotate(${hookRock})`}>
          <PlateDisc>
            <VideoCard color={CARDS[1]} />
          </PlateDisc>
        </g>
      )}

      {/* ---------- the roll door ---------- */}
      <g clipPath="url(#v029hatch)">
        <g transform={`translate(${doorShake} 0)`}>
          <rect x={HATCH.x0} y={doorB - 900} width={HATCH.x1 - HATCH.x0} height={900} fill={DOOR} />
          {Array.from({ length: 22 }, (_, i) => (
            <line key={i} x1={HATCH.x0} y1={doorB - 18 - i * 42} x2={HATCH.x1} y2={doorB - 18 - i * 42} stroke={DOOR2} strokeWidth={6} />
          ))}
          <rect x={HATCH.x0} y={doorB - 16} width={HATCH.x1 - HATCH.x0} height={16} fill={INK} />
          {/* sign carried by the door */}
          {signPop > 0.01 && (
            <g transform={`translate(${RX} ${doorB - 590}) scale(${signPop} ${signPop * signSy}) rotate(${wobble(f, T.kitchen4, 3)})`}>
              <rect x={-290} y={-66} width={580} height={132} rx={14} fill={signFlip < 0.5 ? CREAM : YEL} {...K} strokeWidth={8} />
              <Txt y={32} s={92}>
                {signText}
              </Txt>
            </g>
          )}
        </g>
      </g>

      {/* ---------- YouTube said · 2018 ---------- */}
      {ytK > 0.01 && (
        <g transform={`translate(${RX + 40} 310) scale(${ytK})`}>
          <Pill text="YOUTUBE SAID" fill={WHITE} c={INK} w={350} s={42} h={68} />
        </g>
      )}
      {year > 0.01 && (
        <g transform={`translate(${RX - 234} 310) scale(${year})`}>
          <Pill text="2018" fill={INK} c={WHITE} w={150} s={42} h={68} />
        </g>
      )}

      {/* ---------- ten minutes: the board on the door becomes the robot's chest ---------- */}
      {boardK > 0.01 && (
        <g transform={`translate(${RX} 512) scale(${boardK})`}>
          {Array.from({ length: 10 }, (_, i) => {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = (col - 2) * (TILE + 12);
            const y = (row - 0.5) * (TILE + 12);
            const k = lit(i) ? popIn(f, tileAt(i)) : 1;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
                <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx={16} fill={lit(i) ? YEL : "#6a7184"} {...K} strokeWidth={6} />
                {lit(i) && <path d="M -18 -28 L 30 0 L -18 28 Z" fill={INK} strokeLinejoin="round" />}
              </g>
            );
          })}
        </g>
      )}
      {bannerK > 0.01 && bannerOut > 0.01 && (
        <g transform={`translate(${RX} 712) scale(${bannerK * bannerOut})`}>
          <rect x={-345} y={-50} width={690} height={100} rx={16} fill={banner2 > 0.5 ? WHITE : YEL} {...K} strokeWidth={7} />
          <Txt y={banner2 > 0.5 ? 20 : 25} s={banner2 > 0.5 ? 52 : 66}>
            {banner2 > 0.5 ? "THE APP'S COMPUTER PICKED" : "OVER 7 OF 10 MINUTES"}
          </Txt>
        </g>
      )}
      {searchK > 0.01 && (
        <g transform={`translate(${RX} 712) scale(${searchK})`}>
          <rect x={-345} y={-50} width={690} height={100} rx={50} fill={WHITE} {...K} strokeWidth={7} />
          <circle cx={-290} cy={-6} r={21} fill="none" stroke={INK} strokeWidth={8} />
          <line x1={-274} y1={10} x2={-256} y2={28} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <text x={-232} y={17} fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={INK}>
            {typed}
            {f % 20 < 12 && typed.length < SEARCH.length ? "|" : ""}
          </text>
        </g>
      )}

      {/* ---------- A: labels at the seat ---------- */}
      {whoK > 0.01 && (
        <g transform={`translate(545 690) scale(${whoK}) rotate(${wobble(f, T.picked1, 5)})`}>
          <Bubble w={400} h={120} fill={YEL} tail={-120}>
            <Txt y={20} s={58}>
              WHO PICKED?
            </Txt>
          </Bubble>
        </g>
      )}
      {restK > 0.01 && (
        <g transform={`translate(640 450) scale(${restK}) rotate(${-1 + wobble(f, T.rest2, 4)})`}>
          <rect x={-290} y={-58} width={580} height={116} rx={12} fill={CREAM} {...K} strokeWidth={7} />
          <Txt y={27} s={76}>
            RESTAURANT
          </Txt>
        </g>
      )}
      {beltK > 0.01 && (
        <g transform={`translate(760 800) scale(${beltK})`}>
          <Pill text="MOVING BELT" fill={INK} c={YEL} w={400} s={48} />
        </g>
      )}
      {mineK > 0.01 && (
        <g transform={`translate(${SX0 + 330} 690) scale(${mineK}) rotate(${-2 + wobble(f, T.feels3, 5)})`}>
          <Bubble w={420} h={124} fill={WHITE} tail={-140}>
            <Txt y={22} s={62}>
              MY CHOICE!
            </Txt>
          </Bubble>
        </g>
      )}
      {howK > 0.01 && (
        <g transform={`translate(${SXB + 120} 690) scale(${howK}) rotate(${wobble(f, T.watching6, 5)})`}>
          <Bubble w={380} h={124} fill={WHITE} tail={-70}>
            <Txt y={22} s={66}>
              HOW MUCH?
            </Txt>
          </Bubble>
        </g>
      )}
      {askK > 0.01 && f < LOOP && (
        <g transform={`translate(${SXB + 170} 690) scale(${askK}) rotate(${wobble(f, T.c10, 5)})`}>
          <Bubble w={470} h={124} fill={WHITE} tail={-70}>
            <Txt y={21} s={60}>
              LAST SEARCH?
            </Txt>
          </Bubble>
        </g>
      )}

      {/* the plate Spark takes (behind him when on the belt) */}
      {f >= GRAB && taken[0] > -300 && (
        <g transform={`translate(${taken[0]} ${taken[1]})`}>
          <PlateDisc>
            <Food kind={0} />
          </PlateDisc>
        </g>
      )}
      {stopBurst > 0 && (
        <g transform={`translate(${HOOK_X - 130} 880)`} opacity={1 - stopBurst}>
          {[-30, 0, 30].map((a) => (
            <line key={a} x1={0} y1={-40 - stopBurst * 26} x2={0} y2={-74 - stopBurst * 34} stroke={WHITE} strokeWidth={10} strokeLinecap="round" transform={`rotate(${a - 60})`} />
          ))}
        </g>
      )}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={1} />

      {dim > 0.01 && <rect x={-1000} y={-900} width={4400} height={3400} fill="#150a18" opacity={dim} />}
    </>
  );

  const html = (
    <>
      {(real < T.c1 - 4 || loopBack) && (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 172,
            color: YEL,
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          YOU DIDN'T<br />PICK THIS
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
            {real < T.c7 - 4
              ? "The restaurant is only an example to explain the idea"
              : real < T.c9
                ? "YouTube's product chief at CES, January 2018 · an old number, from YouTube itself"
                : "A tip to try, not a study result"}
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
            DESIGNED TO GET YOU
          </div>
        </>
      )}
      <VoiceCaptions
        f={real}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "never", "searched", "final", "picture", "picked", "restaurant", "belt", "plate", "choice", "kitchen", "plates", "video", "app", "much", "youtube", "seven", "ten", "minutes", "computer", "search", "today", "last"]}
      />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={hits} power={4} svg={svg} html={html} />;
};

// the frame on which a belt plate leaves the metal hand and lands (D crosses BORN - 140)
function x0Born(x0: number) {
  const target = x0 - BORN + 140;
  if (target <= 0) return -999;
  for (let i = 0; i < DTABLE.length; i++) if (DTABLE[i] >= target) return i;
  return 99999;
}
