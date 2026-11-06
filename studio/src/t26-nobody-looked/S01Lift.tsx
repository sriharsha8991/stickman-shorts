import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, walkCycle, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine, SOFT, type Hair } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T26 · "Why do you think everyone saw your 1 mistake?" Spark Got Tricked #5 (STORY, pencil look, 30.5 s).
// ONE world, one camera rig: a building in cut-away. Left: an office lift. Right, through its door: a raked test room with twelve students at desks.
// Mr. Trick walks along the roof with a lamp: the spotlight is his, it is only in the head. Dark + white staring eyes = what it feels like.
// Spark flips the wall switch: the lights come on, nine heads are down over their papers, one in each row of four looked up.
// Gilovich, Medvec & Savitsky 2000: see facts.md. People write on paper (a test room in 2000, no phones); the phones come back in the lift.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const ACCENT = "#ffc61a";
const CREAM = "#fffdf6";
const COFFEE = "#7b4a22";
const NIGHT = "#191714";
const GROUND = 1440;
const ROOF = 330;
const S0 = 2.75;
const S_ROOM = 2.5;
const LIFT_X = 540;
const ROOM_X = 1300; // Spark, next to the switch
const SWITCH: [number, number] = [1178, 1000];
const DOOR_X = 1075;
const STUDENT_X = 1775;

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const SHIRT_WORD = W(1, 6);
const MOVE = C(2) - 21;
const ARRIVE = C(2) + 9;
const IN_WALK0 = W(2, 3) - 2;
const IN_WALK1 = W(2, 8) + 4;
const EMBARRASS = W(2, 6);
const GUESS = C(3);
const REALLY = W(3, 7);
const REACH = E(3) + 4; // the pause: he reaches for the switch
const CLICK = C(4) - 1;
const LIGHT1 = CLICK + 5;
const ONE = W(4, 2);
const IN = W(4, 3);
const FOUR = W(4, 4);
const HIT = W(4, 5); // "noticed"
export { HIT };
const CENTRE = C(5);
const RUN_BACK = E(5) - 2;
const HOME = C(6) + 2;
const MIST = W(6, 1);
const SMALLER = W(6, 4);
const FEELS = W(6, 7);
const Q = C(7);
const YOUQ = W(7, 2);
const CLICK2 = E(7) + 1;
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [LIFT_X, 1010, 1.85];
const WHOLE: [number, number, number] = [LIFT_X, 950, 1.0];
const ROOM: [number, number, number] = [1650, 960, 1.0];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 12, PROMISE + 8, WHOLE), // the whole lift, and who holds the lamp
  k(MOVE, ARRIVE - 3, ROOM), // through the door, into the test room
  k(CENTRE - 6, CENTRE + 22, [1640, 1000, 1.08]), // a slow step closer to the students
  k(RUN_BACK, HOME, [LIFT_X, 950, 1.06]), // back to the lift
  k(MIST - 6, MIST + 14, [LIFT_X, 1085, 1.5]), // the stain
  k(CLICK2 - 8, LOOP1, F0),
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const e = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * e, fy: cur.fy + (fy - cur.fy) * e, z: cur.z + (z - cur.z) * e };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};
const scaleAt = (f: number) =>
  interpolate(f, [MOVE, ARRIVE, HIT, HIT + 7, HIT + 12, RUN_BACK, HOME], [S0, S_ROOM, S_ROOM, 2.86, 2.74, 2.74, S0], { ...clamp, easing: sio });
const sparkX = (f: number) => {
  const go = interpolate(f, [MOVE, ARRIVE], [0, 1], { ...clamp, easing: sio });
  const back = interpolate(f, [RUN_BACK, HOME], [0, 1], { ...clamp, easing: sio });
  return LIFT_X + (ROOM_X - LIFT_X) * go * (1 - back);
};
const running = (f: number) => (f >= MOVE && f < ARRIVE) || (f >= RUN_BACK && f < HOME);

// --- darkness: on until Spark flips the switch, back on for the loop ------------------------------------------------------
const darkAt = (f: number) => interpolate(f, [CLICK, LIGHT1], [1, 0], clamp) + interpolate(f, [CLICK2, CLICK2 + 5], [0, 1], clamp);

// --- the student + the lamp -----------------------------------------------------------------------------------------------
const studentX = (f: number) => interpolate(f, [IN_WALK0, IN_WALK1], [DOOR_X, STUDENT_X], { ...clamp, easing: sio });
const lampX = (f: number) => (f >= CLICK2 - 22 ? LIFT_X : interpolate(f, [MOVE, ARRIVE + 6], [LIFT_X, 1640], { ...clamp, easing: sio }));
const coneTarget = (f: number) => {
  if (f >= CLICK2 - 22) return sparkX(f);
  const onStudent = interpolate(f, [W(2, 2), IN_WALK0 + 10], [0, 1], { ...clamp, easing: sio });
  return sparkX(f) + (studentX(f) - sparkX(f)) * onStudent;
};
const coneWide = (f: number) => (f < MOVE || f >= CLICK2 - 22 ? 250 : 205);

// --- the lift people -----------------------------------------------------------------------------------------------------
type Person = { x: number; ground: number; scale: number; hair: Hair; glasses?: boolean };
const LIFT_P: Person[] = [
  { x: 258, ground: 1418, scale: 2.08, hair: "bun" },
  { x: 372, ground: 1400, scale: 1.92, hair: "short", glasses: true },
  { x: 722, ground: 1400, scale: 1.92, hair: "curly" },
  { x: 842, ground: 1418, scale: 2.08, hair: "cap" },
];
const LIFT_GLANCE = 2; // the one who looks up from the phone

// --- the test room: three rows of four, one person in each row looks up --------------------------------------------------------
const ROWS = [
  { ground: 668, scale: 1.14, xs: [1442, 1652, 1862, 2072], hairs: ["short", "long", "curly", "bun"] as Hair[], looker: 3, at: ONE },
  { ground: 890, scale: 1.34, xs: [1408, 1630, 1852, 2074], hairs: ["curly", "cap", "short", "long"] as Hair[], looker: 0, at: IN },
  { ground: 1130, scale: 1.56, xs: [1440, 1660, 1880, 2100], hairs: ["bald", "short", "long", "curly"] as Hair[], looker: 2, at: FOUR },
];
const DESK_LEFT = 1330;
const DESK_RIGHT = 2460;
const deskTop = (ground: number, scale: number) => ground - 82 * scale;
const BUBBLES = [
  { row: 0, i: 1, text: "MY TEST", at: W(5, 3) },
  { row: 1, i: 2, text: "LUNCH?", at: W(5, 6) },
  { row: 2, i: 0, text: "MY HAIR?", at: W(5, 8) },
];

// --- drawings -------------------------------------------------------------------------------------------------------------
const World: React.FC = () => (
  <g>
    {/* the building: roof line + a strip of wall beyond the lift */}
    <SketchLine x1={-500} y1={ROOF} x2={2900} y2={ROOF} w={10} />
    <Hatch x={-500} y={ROOF - 26} w={3400} h={26} gap={18} o={0.34} />
    <Hatch x={-500} y={ROOF} w={560} h={1110} gap={30} o={0.24} />

    {/* the lift: brushed back wall, seam, rail, floor number + buttons */}
    <rect x={60} y={ROOF} width={940} height={GROUND - ROOF} fill={CREAM} />
    <SketchBox x={60} y={ROOF + 6} w={940} h={GROUND - ROOF - 6} lw={9} />
    <Hatch x={66} y={ROOF + 12} w={928} h={1090} gap={64} o={0.1} />
    <SketchLine x1={530} y1={ROOF + 90} x2={530} y2={GROUND} w={4} color={SOFT} />
    <SketchLine x1={550} y1={ROOF + 90} x2={550} y2={GROUND} w={4} color={SOFT} />
    <SketchLine x1={60} y1={1170} x2={1000} y2={1170} w={9} />
    <SketchBox x={455} y={ROOF + 28} w={170} h={64} fill={PAPER2} lw={5} />
    <text x={540} y={ROOF + 76} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={GRAPHITE}>
      4
    </text>
    <SketchBox x={905} y={760} w={64} h={160} fill={PAPER2} lw={5} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={937} cy={792 + i * 46} r={13} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
    ))}

    {/* the test room */}
    <rect x={1000} y={ROOF} width={1900} height={GROUND - ROOF} fill={PAPER} />
    <Hatch x={1130} y={ROOF + 8} w={1800} h={GROUND - ROOF - 8} gap={70} o={0.07} />
    {/* the door between them */}
    <rect x={1012} y={840} width={126} height={600} fill={NIGHT} opacity={0.82} />
    <SketchBox x={1012} y={840} w={126} h={600} lw={9} />
    <path d="M 1138 840 L 1216 802 L 1216 1414 L 1138 1440 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <circle cx={1198} cy={1130} r={8} fill={GRAPHITE} />
    {/* floor */}
    <SketchLine x1={-500} y1={GROUND} x2={2900} y2={GROUND} w={8} />
    <Hatch x={-500} y={GROUND + 4} w={3400} h={120} gap={34} o={0.3} />
  </g>
);

const Switch: React.FC<{ on: boolean }> = ({ on }) => (
  <g>
    <rect x={SWITCH[0] - 26} y={SWITCH[1] - 40} width={52} height={80} rx={7} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <rect x={SWITCH[0] - 10} y={SWITCH[1] - (on ? 26 : 2)} width={20} height={28} fill={on ? ACCENT : GRAPHITE} stroke={GRAPHITE} strokeWidth={3} />
  </g>
);

const Bubble: React.FC<{ x: number; y: number; text: string; pop: number; size?: number; tail?: number }> = ({ x, y, text, pop, size = 38, tail = 0 }) => {
  if (pop <= 0.01) return null;
  const w = text.length * size * 0.66 + 40;
  const h = size + 34;
  return (
    <g transform={`translate(${x} ${y}) scale(${pop})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={h / 2} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
      <circle cx={tail - 8} cy={12} r={8} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
      <circle cx={tail} cy={30} r={5} fill={CREAM} stroke={GRAPHITE} strokeWidth={3.5} />
      <text x={0} y={-h / 2 + size * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={GRAPHITE}>
        {text}
      </text>
    </g>
  );
};

// A pair of wide white eyes in the dark: they look at the target.
const StareEyes: React.FC<{ hx: number; hy: number; s: number; tx: number; ty: number; pop: number }> = ({ hx, hy, s, tx, ty, pop }) => {
  if (pop <= 0.01) return null;
  const ang = Math.atan2(ty - hy, tx - hx);
  const dx = Math.cos(ang) * 4.4 * s;
  const dy = Math.sin(ang) * 3.2 * s;
  const e = (ox: number) => (
    <g transform={`translate(${hx + ox * s} ${hy}) scale(${pop})`}>
      <ellipse rx={9.2 * s} ry={7.6 * s} fill="#fffef6" stroke={GRAPHITE} strokeWidth={1.6 * s} />
      <circle cx={dx} cy={dy} r={3.7 * s} fill={NIGHT} />
    </g>
  );
  return (
    <g>
      {e(-10)}
      {e(10)}
    </g>
  );
};

// The student's silly shirt, drawn over her doodle: loud yellow with a cross-eyed face.
const SillyShirt: React.FC<{ neck: [number, number]; hip: [number, number]; s: number; big: number }> = ({ neck, hip, s, big }) => {
  const cx = (neck[0] + hip[0]) / 2;
  const cy = (neck[1] + hip[1]) / 2 + 3 * s;
  return (
    <g>
      <path
        d={`M ${neck[0] - 19 * s} ${neck[1] + 5 * s} L ${neck[0] + 19 * s} ${neck[1] + 5 * s} L ${hip[0] + 22 * s} ${hip[1] + 2 * s} L ${hip[0] - 22 * s} ${hip[1] + 2 * s} Z`}
        fill={ACCENT}
        stroke={GRAPHITE}
        strokeWidth={3 * s}
        strokeLinejoin="round"
      />
      <g transform={`translate(${cx} ${cy}) scale(${s * big})`}>
        <circle r={12.5} fill="#fff" stroke={GRAPHITE} strokeWidth={1.8} />
        <circle cx={-4.2} cy={-3} r={2.8} fill="#fff" stroke={GRAPHITE} strokeWidth={1.1} />
        <circle cx={4.2} cy={-3} r={2.8} fill="#fff" stroke={GRAPHITE} strokeWidth={1.1} />
        <circle cx={-2.9} cy={-2.2} r={1.3} fill={GRAPHITE} />
        <circle cx={2.9} cy={-2.2} r={1.3} fill={GRAPHITE} />
        <path d="M -5.5 4 Q 0 9.5 5.5 4 Z" fill={GRAPHITE} />
        <path d="M 0.5 6 q 2 5.5 4.5 2.5 l -1 -3 Z" fill="#e8595a" />
      </g>
    </g>
  );
};

// The coffee on Spark's chest. `k` = 1 is the huge frame-0 stain; it shrinks on "smaller".
const Stain: React.FC<{ x: number; y: number; k: number; s: number }> = ({ x, y, k: kk, s }) => (
  <g transform={`translate(${x} ${y}) scale(${(kk * s) / 2.75})`}>
    <path
      d="M -30 -38 C -6 -66 34 -56 46 -30 C 72 -22 74 12 52 26 C 54 56 34 66 22 50 C 18 76 -8 92 -14 62 C -40 76 -66 52 -52 28 C -80 12 -66 -30 -30 -38 Z"
      fill={COFFEE}
      stroke={GRAPHITE}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <circle cx={74} cy={46} r={9} fill={COFFEE} stroke={GRAPHITE} strokeWidth={3} />
    <circle cx={-72} cy={-34} r={7} fill={COFFEE} stroke={GRAPHITE} strokeWidth={3} />
  </g>
);

const Cup: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -30 -40 L 30 -40 L 22 44 L -22 44 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -27 -6 L 27 -6 L 25 20 L -25 20 Z" fill={COFFEE} />
    <rect x={-35} y={-52} width={70} height={14} rx={5} fill={GRAPHITE} />
    <path d="M -34 -40 q -10 16 -3 30" stroke={COFFEE} strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [3, "pop", 0.28],
  [PROMISE - 10, "swish", 0.3],
  [PROMISE + 8, "pop", 0.32],
  [SHIRT_WORD, "swish", 0.3],
  [MOVE + 1, "whoosh_long", 0.32],
  [MOVE + 8, "thud", 0.22],
  [IN_WALK0 + 4, "swish", 0.24],
  [EMBARRASS + 2, "pop", 0.34],
  [GUESS + 1, "pop", 0.3],
  [W(3, 1) + 2, "pop", 0.32],
  [W(3, 3), "pop", 0.34],
  [W(3, 5) - 2, "boing", 0.24],
  [REACH + 8, "tick", 0.45],
  [CLICK, "stamp", 0.7],
  [ONE, "pop", 0.36],
  [IN, "pop", 0.38],
  [FOUR, "pop", 0.42],
  [HIT, "impact", 0.85],
  [HIT + 3, "ding", 0.5],
  [W(5, 3) + 1, "pop", 0.3],
  [W(5, 6) + 1, "pop", 0.3],
  [W(5, 8) + 1, "pop", 0.3],
  [RUN_BACK + 1, "whoosh_long", 0.3],
  [SMALLER, "swirl", 0.42],
  [FEELS, "ding", 0.3],
  [YOUQ, "pop", 0.3],
  [CLICK2, "stamp", 0.5],
];

export const S01Lift: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const sNow = scaleAt(f);
  const dark = darkAt(f);
  const lit = dark < 0.5;

  // --- Spark ------------------------------------------------------------------------------------------------------------
  const CUP_POSE: Partial<Pose> = { ra1: 74, ra2: 30, la1: -80, la2: -60, head: 4, lean: -7 };
  const RUN: Partial<Pose> = { ra1: 60, ra2: 70, la1: -60, la2: -70, lean: 12, head: 2 };
  const sparkKeys = gestureKeys([
    [0, CUP_POSE],
    [W(0, 4), { ...CUP_POSE, la1: -112, la2: -40, head: -4 }, "snap"],
    [PROMISE - 2, { ...G.pointUp, head: -10 }, "snap"],
    [SHIRT_WORD, { ...G.pointUp, ra1: 148, head: -14 }, "snap"],
    [E(1) + 2, G.rest],
    [MOVE, RUN, "snap"],
    [ARRIVE, { ...G.pointSide, ra1: 92, head: -2 }, "snap"],
    [EMBARRASS, { ...G.doublePoint, ra1: 96, la1: 70, head: -3 }, "snap"],
    [GUESS, { ...G.armsCrossed, head: 4 }, "snap"],
    [W(3, 5), { ...G.handsHips, head: -6, lean: -3 }, "snap"],
    [REALLY, { ...G.thinkChin, head: 8 }, "snap"],
    [REACH, { ra1: 92, ra2: 6, la1: -10, la2: -8, lean: -6, head: -6 }, "snap"], // he turned: this arm is the one at the switch
    [CLICK - 8, { ra1: 104, ra2: 2, la1: -10, la2: -8, lean: 6, head: -2 }],
    [CLICK, { ra1: 86, ra2: 6, la1: -12, la2: -8, lean: 8, head: 0 }, "snap"],
    [CLICK + 12, { ...G.recoil }, "snap"],
    [ONE, { ...G.pointSide, ra1: 118, head: -8 }, "snap"],
    [HIT, { ...G.celebrate, la1: -138, la2: -24, ra1: 138, ra2: 24, head: -8, lean: -2 }, "snap"],
    [CENTRE - 2, { ...G.celebrate, la1: -132, la2: -24, ra1: 132, ra2: 24, head: -8 }],
    [CENTRE + 2, { ...G.presentBoth, head: -3 }, "snap"],
    [W(5, 6), { ...G.pointSide, ra1: 110, head: -6 }, "snap"],
    [W(5, 8), { ...G.shrugBig, head: 8 }, "snap"],
    [RUN_BACK, RUN, "snap"],
    [HOME, G.rest],
    [MIST, { ...G.pointDown, ra1: 34, ra2: 30, head: 16 }, "snap"],
    [SMALLER, { ...G.recoil, head: 14 }, "snap"],
    [FEELS, { ...G.celebrate, la1: -120, ra1: 120, head: -6 }, "snap"],
    [Q - 2, { ...G.leanIn, ra1: 82, ra2: 8 }, "snap"],
    [YOUQ, { ...G.doublePoint, ra1: 96, la1: 64, lean: 8 }, "snap"],
    [CLICK2, CUP_POSE, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, hop(t, HIT, 58));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, nod(t, W(3, 5) + 2, 2));
    q = addPose(q, shake(t, CLICK + 16, 2));
    q = addPose(q, hop(t, FEELS, 24));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    if (running(t)) q = { ...q, ...walkCycle(t, 1.15) };
    const s = scaleAt(t);
    return { ...q, x: sparkX(t), y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [W(0, 4), "worried"],
      [PROMISE - 2, "curious"],
      [MOVE, "determined"],
      [EMBARRASS, "excited"],
      [GUESS, "smug"],
      [REALLY, "thinking"],
      [REACH, "curious"],
      [CLICK + 6, "shock"],
      [HIT, "mindblown"],
      [CENTRE, "happy"],
      [W(5, 8), "laugh"],
      [RUN_BACK, "happy"],
      [MIST, "worried"],
      [SMALLER, "shock"],
      [FEELS, "excited"],
      [Q - 2, "curious"],
      [YOUQ, "wink"],
      [CLICK2, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= HIT && t < CLICK2) return interpolate(t, [HIT, HIT + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const facing = (t: number) => (t >= REACH && t < CLICK + 8 ? -1 : t >= RUN_BACK && t < HOME ? -1 : 1);

  const stainK = (t: number) => {
    const shrink = t < SMALLER ? 0 : interpolate(t, [SMALLER, SMALLER + 12, SMALLER + 17, SMALLER + 22], [0, 1.05, 0.97, 1], clamp);
    const grow = interpolate(t, [CLICK2, CLICK2 + 8], [0, 1], { ...clamp, easing: eoB });
    return 1 - 0.84 * shrink * (1 - grow);
  };
  const cupOn = f < MOVE + 4 || f >= CLICK2;
  const cupFall = interpolate(f, [MOVE + 4, MOVE + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

  // --- Mr. Trick, on the roof ----------------------------------------------------------------------------------------------
  const popUp = interpolate(f, [PROMISE - 6, PROMISE + 10], [1, 0], { ...clamp, easing: eoB });
  const popBack = interpolate(f, [CLICK2 - 24, CLICK2 - 6], [1, 0], { ...clamp, easing: eoB });
  const trickWalking = f >= MOVE && f < ARRIVE + 6;
  const fled = interpolate(f, [CLICK + 6, CLICK + 34], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const trickX = f >= CLICK2 - 28 ? LIFT_X + 70 : lampX(f) + 70 + fled * 1080;
  const trickG = ROOF + (f >= CLICK2 - 28 ? popBack : popUp) * 300;
  const tScared = f >= CLICK;
  const trickMood = f >= CLICK2 - 28 ? "smug" : tScared ? "surprised" : "sly";
  const trickPose: Partial<Pose> = {
    ...(trickWalking || (fled > 0 && fled < 1) ? walkCycle(f, 0.9) : {}),
    ra1: tScared && f < CLICK2 - 28 ? 150 : 46,
    ra2: 24,
    la1: -36,
    la2: -18,
    head: 6,
    lean: fled > 0 && fled < 1 ? 10 : 0,
  };
  const trickOn = trickX < 2600;

  // --- the room ---------------------------------------------------------------------------------------------------------
  const stuPose: Partial<Pose> = {
    ...(f >= IN_WALK0 && f < IN_WALK1 ? walkCycle(f, 0.62) : {}),
    ...(f < CLICK + 8 ? { ra1: 30, ra2: 112, la1: -30, la2: -112, head: 10, lean: 3 } : f < CENTRE ? { ra1: 14, ra2: 6, la1: -14, la2: -6, head: -3 } : { ra1: 60, ra2: 30, la1: -60, la2: -30, head: -5 }),
  };
  const SS = 2.16;
  const sx = studentX(f);
  const stuJ = solve({ ...STAND, ...stuPose, x: sx, y: GROUND - 92.5 * SS } as Pose, SS, 1);
  const stuOn = f >= IN_WALK0 && f < RUN_BACK + 34;
  const shirtBig = 1 + wobble(f, EMBARRASS, 0.3, 8);
  const headY = (j: { headC: [number, number]; headR: number }) => j.headC[1] - (j.headR * 1.22 - j.headR) * 0.8;

  const rowPeople = ROWS.map((r, ri) => (
    <g key={ri}>
      {r.xs.map((x, i) => {
        const looker = i === r.looker;
        const looking = looker && f >= r.at;
        const lookK = looking ? interpolate(f, [r.at, r.at + 9], [0, 1], { ...clamp, easing: eoB }) : 0;
        const fac = x < sx ? 1 : -1;
        const pose: Partial<Pose> = lit
          ? looking
            ? { ra1: 16, ra2: 18, la1: -16, la2: -18, head: -4 }
            : { ra1: 22, ra2: 14, la1: -22, la2: -14, head: 28, lean: 14 + Math.sin(f * 0.05 + i) * 1 }
          : { ra1: 14, ra2: 12, la1: -14, la2: -12, head: -2 };
        const j = solve({ ...STAND, ...pose, x, y: r.ground - 92.5 * r.scale } as Pose, r.scale, fac);
        const hy = headY(j);
        const ex = j.headC[0] + fac * 7 * r.scale;
        const down = lit && !looking;
        const fade = down ? 1 - 0.5 * interpolate(f, [ONE - 4, ONE + 8], [0, 1], clamp) * interpolate(f, [CENTRE - 4, CENTRE + 8], [1, 0], clamp) : 1;
        return (
          <g key={i} opacity={fade}>
            {looking && <circle cx={j.headC[0]} cy={hy} r={47 * r.scale * lookK} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />}
            <Doodle x={x} ground={r.ground} scale={r.scale} facing={fac} hair={r.hairs[i]} face={looking ? "shock" : "plain"} pose={pose} />
            {/* heads down: the eyes are shut lids, reading the sheet */}
            {down && (
              <g>
                <ellipse cx={ex + 0.5 * r.scale} cy={hy - 1 * r.scale} rx={11 * r.scale} ry={4.5 * r.scale} fill="#fffaf0" />
                <path d={`M ${ex - 9 * r.scale} ${hy} q ${4 * r.scale} ${3.4 * r.scale} ${8 * r.scale} 0 M ${ex + 2 * r.scale} ${hy} q ${4 * r.scale} ${3.4 * r.scale} ${8 * r.scale} 0`} fill="none" stroke={GRAPHITE} strokeWidth={2.2 * r.scale} strokeLinecap="round" />
              </g>
            )}
            {looking && <StareEyes hx={j.headC[0] + fac * 3 * r.scale} hy={hy - 1 * r.scale} s={r.scale * 0.72} tx={stuJ.neck[0]} ty={stuJ.neck[1]} pop={lookK} />}
          </g>
        );
      })}
      <rect x={DESK_LEFT} y={deskTop(r.ground, r.scale)} width={DESK_RIGHT - DESK_LEFT} height={r.ground - deskTop(r.ground, r.scale)} fill={PAPER2} />
      <SketchLine x1={DESK_LEFT} y1={deskTop(r.ground, r.scale)} x2={DESK_RIGHT} y2={deskTop(r.ground, r.scale)} w={8} />
      <Hatch x={DESK_LEFT} y={deskTop(r.ground, r.scale) + 8} w={DESK_RIGHT - DESK_LEFT} h={r.ground - deskTop(r.ground, r.scale) - 8} gap={26} o={0.28} />
      {/* a test sheet on the desk in front of every person */}
      {r.xs.map((x, i) => (
        <path key={i} d={`M ${x - 22 * r.scale} ${deskTop(r.ground, r.scale) - 2} L ${x + 22 * r.scale} ${deskTop(r.ground, r.scale) - 2} L ${x + 30 * r.scale} ${deskTop(r.ground, r.scale) + 11 * r.scale} L ${x - 30 * r.scale} ${deskTop(r.ground, r.scale) + 11 * r.scale} Z`} fill="#fff" stroke={GRAPHITE} strokeWidth={3} />
      ))}
    </g>
  ));
  const roomEyes = ROWS.map((r, ri) =>
    r.xs.map((x, i) => {
      const pop = dark > 0.5 ? interpolate(f, [W(3, ri * 2 + 1) - 3 + i, W(3, ri * 2 + 1) + 5 + i], [0, 1], { ...clamp, easing: eoB }) : 0;
      if (pop <= 0.01) return null;
      const j = solve({ ...STAND, ra1: 14, ra2: 12, la1: -14, la2: -12, head: -2, x, y: r.ground - 92.5 * r.scale } as Pose, r.scale, x < sx ? 1 : -1);
      return <StareEyes key={`${ri}${i}`} hx={j.headC[0]} hy={headY(j)} s={r.scale} tx={stuJ.neck[0]} ty={stuJ.neck[1]} pop={pop} />;
    }),
  );

  // --- the lift people ---------------------------------------------------------------------------------------------------
  const liftLit = lit && f >= CLICK;
  const glance = interpolate(f, [HOME + 2, HOME + 8, SMALLER + 16, SMALLER + 24], [0, 1, 1, 0], clamp);
  const liftPeople = LIFT_P.map((p, i) => {
    const fac = p.x < sparkX(f) ? 1 : -1;
    const looks = i === LIFT_GLANCE && glance > 0.5;
    const pose: Partial<Pose> = liftLit && !looks ? { ra1: 44, ra2: 86, la1: -26, la2: -24, head: 24, lean: 7 } : { ra1: 14, ra2: 10, la1: -14, la2: -10, head: -2 };
    const j = solve({ ...STAND, ...pose, x: p.x, y: p.ground - 92.5 * p.scale } as Pose, p.scale, fac);
    return (
      <g key={i}>
        {looks && <circle cx={j.headC[0]} cy={headY(j)} r={37 * p.scale} fill={ACCENT} stroke={GRAPHITE} strokeWidth={4} />}
        <Doodle x={p.x} ground={p.ground} scale={p.scale} facing={fac} hair={p.hair} glasses={p.glasses} face={looks ? "plain" : "plain"} pose={pose} />
        {liftLit && !looks && (
          <rect x={j.rHand[0] - 15 * p.scale * 0.7} y={j.rHand[1] - 32} width={21 * p.scale * 0.7} height={48} rx={5} fill={GRAPHITE} stroke={GRAPHITE} transform={`rotate(${fac * -12} ${j.rHand[0]} ${j.rHand[1]})`} />
        )}
      </g>
    );
  });
  const liftEyes =
    dark > 0.5 &&
    (f < MOVE + 22 || f >= CLICK2) &&
    LIFT_P.map((p, i) => {
      const fac = p.x < sparkX(f) ? 1 : -1;
      const j = solve({ ...STAND, ra1: 14, ra2: 10, la1: -14, la2: -10, head: -2, x: p.x, y: p.ground - 92.5 * p.scale } as Pose, p.scale, fac);
      const pop = f >= CLICK2 ? interpolate(f, [CLICK2 + i, CLICK2 + 7 + i], [0, 1], { ...clamp, easing: eoB }) : 1;
      return <StareEyes key={i} hx={j.headC[0]} hy={headY(j)} s={p.scale * 0.92} tx={sparkX(f)} ty={1090} pop={pop} />;
    });

  // --- the lamp ----------------------------------------------------------------------------------------------------------
  const ax = lampX(f);
  const ay = ROOF + 18;
  const tx = coneTarget(f);
  const cw = coneWide(f);
  const conePts = `${ax - 22},${ay} ${ax + 22},${ay} ${tx + cw},${GROUND} ${tx - cw},${GROUND}`;

  const svg = (
    <>
      <PencilDefs f={f} />
      <defs>
        <mask id="lampLit" maskUnits="userSpaceOnUse" x={-600} y={-500} width={3700} height={2700}>
          <rect x={-600} y={-500} width={3700} height={2700} fill="#fff" />
          <polygon points={conePts} fill="#000" filter="url(#softL)" />
          <ellipse cx={tx} cy={GROUND} rx={cw + 12} ry={46} fill="#000" filter="url(#softL)" />
          <rect x={-600} y={-500} width={3700} height={ROOF + 500} fill="#000" />
        </mask>
        <filter id="softL" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <clipPath id="onRoof">
          <rect x={-600} y={-500} width={3700} height={ROOF + 500 + 4} />
        </clipPath>
      </defs>
      <Paper />
      <g filter="url(#pencil)">
        <World />
        <Switch on={!(dark > 0.5)} />
        {f < CLICK2 + 60 && f >= MOVE - 30 && rowPeople}
        {liftPeople}
        {f >= MOVE + 10 && !cupOn && <Cup x={LIFT_X - 60 + cupFall * -40} y={GROUND - 30 - (1 - cupFall) * 260} rot={-20 - cupFall * 70} s={1.05} />}
        {f >= MOVE + 10 && !cupOn && <ellipse cx={LIFT_X - 90} cy={GROUND - 2} rx={58 * cupFall} ry={9} fill={COFFEE} opacity={0.75} />}
        {stuOn && <Doodle x={sx} ground={GROUND} scale={SS} facing={1} hair="long" face={f < CLICK + 8 ? "shock" : "happy"} pose={stuPose} />}
        {stuOn && <ellipse cx={sx} cy={GROUND + 3} rx={82} ry={8} fill={GRAPHITE} opacity={0.22} />}
        <g clipPath="url(#onRoof)">
          {trickOn && (
            <MrTrick x={trickX} ground={trickG} scale={1.26} facing={f >= CLICK && f < CLICK2 - 28 ? 1 : -1} pose={trickPose} mood={trickMood as "sly" | "smug" | "surprised"} cane="none" />
          )}
        </g>
      </g>
      {stuOn && <SillyShirt neck={stuJ.neck} hip={stuJ.hip} s={SS} big={shirtBig} />}
      {/* darkness with one bright cone: what it feels like */}
      {dark > 0.003 && <rect x={-600} y={-500} width={3700} height={2700} fill={NIGHT} opacity={dark * 0.8} mask="url(#lampLit)" />}
      {dark > 0.003 && (
        <g opacity={dark}>
          <polygon points={conePts} fill={ACCENT} opacity={0.22} />
          <ellipse cx={tx} cy={GROUND} rx={cw} ry={34} fill={ACCENT} opacity={0.42} />
          <path d={`M ${ax - 30} ${ay + 6} L ${ax + 30} ${ay + 6} L ${ax + 18} ${ay - 30} L ${ax - 18} ${ay - 30} Z`} fill={ACCENT} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      {/* the shirt hanging from the roof on the promise: "one silly shirt" */}
      {f >= SHIRT_WORD - 4 && f < MOVE + 2 && (
        <g transform={`translate(${LIFT_X + 220} ${ROOF + interpolate(f, [SHIRT_WORD - 4, SHIRT_WORD + 8], [-200, 92], { ...clamp, easing: eoB })}) rotate(${wobble(f, SHIRT_WORD + 6, 7, 6)})`}>
          <line x1={0} y1={-200} x2={0} y2={-18} stroke={GRAPHITE} strokeWidth={5} />
          <path d="M -24 -14 Q 0 -30 24 -14 L 72 8 L 58 48 L 38 40 L 38 134 L -38 134 L -38 40 L -58 48 L -72 8 Z" fill={ACCENT} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <g transform="translate(0 56) scale(2.2)">
            <circle r={12.5} fill="#fff" stroke={GRAPHITE} strokeWidth={1.8} />
            <circle cx={-4.2} cy={-3} r={2.8} fill="#fff" stroke={GRAPHITE} strokeWidth={1.1} />
            <circle cx={4.2} cy={-3} r={2.8} fill="#fff" stroke={GRAPHITE} strokeWidth={1.1} />
            <circle cx={-2.9} cy={-2.2} r={1.3} fill={GRAPHITE} />
            <circle cx={2.9} cy={-2.2} r={1.3} fill={GRAPHITE} />
            <path d="M -5.5 4 Q 0 9.5 5.5 4 Z" fill={GRAPHITE} />
          </g>
        </g>
      )}
      {f < CLICK && f >= GUESS - 2 && roomEyes}
      {liftEyes}
      {/* her guess, then what the students were really thinking about */}
      {f >= W(3, 1) && f < CLICK && (
        <Bubble x={sx - 8} y={stuJ.headC[1] - 76} text="EVERYONE SAW!" size={46} pop={interpolate(f, [W(3, 1), W(3, 1) + 9], [0, 1], { ...clamp, easing: eoB })} />
      )}
      {f >= CENTRE - 2 && f < RUN_BACK + 34 &&
        BUBBLES.map((b) => {
          const r = ROWS[b.row];
          const x = r.xs[b.i];
          const j = solve({ ...STAND, x, y: r.ground - 92.5 * r.scale } as Pose, r.scale, 1);
          return <Bubble key={b.text} x={x + 6} y={j.headC[1] - 54 * r.scale + 10} text={b.text} size={34} tail={-4} pop={interpolate(f, [b.at, b.at + 8], [0, 1], { ...clamp, easing: eoB })} />;
        })}
      <Spark f={f} trails={false} scale={sNow} facing={facing} base={{ x: LIFT_X, y: GROUND - 92.5 * sNow }} talk={(t) => (t > CLICK2 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={f >= PROMISE && f < CLICK2 ? 0.7 : 0.3} keys={sparkKeys} mod={sparkMod}>
        {(j) => {
          const cx = (j.neck[0] + j.hip[0]) / 2;
          const cy = j.neck[1] + (j.hip[1] - j.neck[1]) * 0.42;
          return (
            <g>
              <Stain x={cx} y={cy} k={stainK(f)} s={sNow} />
              {cupOn && <Cup x={j.lHand[0]} y={j.lHand[1] - 34} rot={-24} s={0.95} />}
            </g>
          );
        }}
      </Spark>
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 104,
        textAlign: "center",
        fontFamily: FONT.title,
        fontWeight: 900,
        lineHeight: 1.02,
        fontSize: size,
        color: GRAPHITE,
        WebkitTextStroke: `18px ${PAPER}`,
        paintOrder: "stroke fill",
        opacity: interpolate(f, [until - 8, until], [1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const looking = (
    <>
      EVERYONE IS <span style={{ color: "#c98a00" }}>LOOKING?</span>
    </>
  );
  const smallLine =
    f < HIT
      ? ""
      : f < RUN_BACK
        ? "One study, 2000: about 1 in 4 could name the face on the shirt."
        : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 4 && top(looking, 0, PROMISE - 4)}
      {f >= CLICK2 + 4 && top(looking, VOICE_FRAMES + 100, VOICE_FRAMES + 200)}
      {f >= HIT && f < CENTRE + 10 && top(<>ONLY ABOUT <span style={{ color: "#c98a00" }}>1 IN 4</span></>, HIT, CENTRE + 10, 104)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1684, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 330 && f < E(7) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: GRAPHITE, background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 5</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["everyone", "mistake?", "last", "silly", "shirt", "embarrassing", "full", "guessed", "noticed", "four", "centre", "own", "smaller", "week?"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2]} power={5} svg={svg} html={html} />;
};
