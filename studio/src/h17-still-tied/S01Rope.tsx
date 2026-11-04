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
import { arc, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H17 · "Why is your mind still on your last task?" (~36 s, promise → build → reveal, Your brain did this; eighteenth hack, Focus)
// ONE world, one camera rig: a coral office. Place A: a laptop with an unfinished email. Place B: the new task (table + board of five sheets).
// A yellow rope runs from the laptop to Spark's head and pulls him back, whatever he does. He writes a one-minute note, sticks it on the laptop,
// and the rope lets go of him and ties itself to the note. The whole office is in frame for that. The five red crosses flip to green ticks.
// Leroy 2009; Leroy & Glomb 2018: see facts.md. The email, the boss and the five sheets are our own illustration.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);

// palette: coral office, cream furniture, slate-blue floor (no teal except Spark)
const WALL = "#ee7f64";
const WALL2 = "#f49a80";
const WALL3 = "#d8644a";
const CREAM = "#fbeed2";
const CREAM2 = "#e6d3ad";
const FLOOR = "#2f3556";
const FLOOR2 = "#262b47";
const SLATE = "#2b3148";
const YEL = "#ffd23f";
const ROPE2 = "#d9a514";
const BLUE = "#3a7fdb";
const RED = "#d92c2c";
const GREEN = "#1f9d55";
const WHITE = "#ffffff";
const INK = COL.ink;

// --- timing ---------------------------------------------------------------------------------------------------------------
const STOP = W(0, 0);
const SWITCHING = W(0, 1);
const ONE = W(0, 7);
const WAITW = C(1);
const LAST = W(1, 3);
const REEL0 = E(1) + 2; // the rope reels him back to the desk
const REEL1 = REEL0 + 18;
const YOU = C(2);
const STOPW = W(2, 1);
const EMAILW = W(2, 3);
const BOSSW = W(2, 6);
const NEEDS = W(2, 7);
const LEAVE = W(3, 1);
const WALK1 = LEAVE + 42;
const STAYS = W(3, 5);
const ROPEW = W(3, 9);
const TESTS = C(4);
const NEWW = W(4, 5);
const WORSE = W(4, 7);
const THEN = C(5);
const STUDENTS = W(5, 1);
const BEFORE = W(5, 6);
const BACK0 = BEFORE - 12;
const BACK1 = BACK0 + 36;
const WROTE = C(6);
const NOTEW = W(6, 4);
const WHERE = W(6, 6);
const AGAIN = W(6, 9);
const SLAP = E(6) - 2;
const OFF0 = SLAP + 8; // he walks off, the rope goes tight again
const OFF1 = OFF0 + 16;
const LETGO = W(7, 2);
const LAND = LETGO + 20;
const RUN1 = LETGO + 24;
const NEWB = W(7, 6);
const BETTER = W(7, 9);
const HOLDT = E(7) + 12; // THE NOTE HOLDS IT
const WRITE = C(8);
const Q = C(9);
const LOOP0 = E(9) + 4; // the rope comes back for him
const LOOP1 = VOICE_FRAMES - 4;

// --- camera rig: hold → move (ease in-out) → hold ----------------------------------------------------------------------------
const F0: [number, number, number] = [540, 880, 1.0];
const A_MED: [number, number, number] = [480, 880, 1.14];
const B_MED: [number, number, number] = [1110, 880, 1.0];
const A_NOTE: [number, number, number] = [430, 880, 1.2];
const WIDE: [number, number, number] = [800, 840, 0.7];
const B_CU: [number, number, number] = [1010, 880, 1.16];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(REEL0, REEL1 + 4, A_MED), // the desk
  k(LEAVE + 2, LEAVE + 26, B_MED), // along the room to the new task
  k(BACK0 + 2, BACK0 + 26, A_NOTE), // back along the rope to the desk
  k(OFF0 - 4, OFF1 + 4, WIDE), // the whole office: rope, note, new task
  k(HOLDT + 40, WRITE - 2, [806, 840, 0.72]), // a very slow push while it sinks in
  k(Q - 8, Q + 12, B_CU), // he asks you
  k(LOOP0 + 2, LOOP1 - 2, F0), // frame 0 again
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

// --- Spark's path ---------------------------------------------------------------------------------------------------------
const SX0 = 800; // frame 0
const SXA = 520; // at the desk
const SXB = 955; // at the new task
const SXT = 800; // the rope stops him here before the reveal
type PK = [number, number, ((t: number) => number)?];
const PATH: PK[] = [
  [0, SX0],
  [REEL0, SX0],
  [REEL1, SXA, ei],
  [LEAVE, SXA],
  [WALK1, SXB, sio],
  [BACK0, SXB],
  [BACK1, SXA, sio],
  [OFF0, SXA],
  [OFF1, SXT, sio],
  [LETGO, SXT],
  [RUN1, SXB, eo],
  [LOOP0 + 8, SXB],
  [LOOP0 + 24, SX0, ei],
];
const xAt = (f: number) => {
  if (f <= PATH[0][0]) return PATH[0][1];
  for (let i = 1; i < PATH.length; i++) {
    const [a, ax] = PATH[i - 1];
    const [b, bx, e] = PATH[i];
    if (f <= b) return b <= a ? bx : ax + (bx - ax) * interpolate(f, [a, b], [0, 1], { ...clamp, easing: e ?? sio });
  }
  return PATH[PATH.length - 1][1];
};
const walking = (t: number) => (t >= LEAVE && t < WALK1) || (t >= BACK0 && t < BACK1) || (t >= OFF0 && t < OFF1);
const running = (t: number) => t >= LETGO && t < RUN1;

// --- fixed places ---------------------------------------------------------------------------------------------------------
const DESK_X = 250;
const DESK_TOP = GROUND - 200;
const LAP_Y = DESK_TOP - 12; // bottom of the screen
const LAP_W = 350;
const LAP_H = 240;
const HOOK: [number, number] = [DESK_X + LAP_W / 2 - 16, LAP_Y - LAP_H - 2]; // the rope is tied here, on top of the laptop
const PIN: [number, number] = [DESK_X + 88, LAP_Y - LAP_H + 34]; // the push pin on the stuck note
const BOARD_X = 1335;
const BOARD_Y = 770;
const TABLE_X = 1335;

// --- helpers --------------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end" }> = ({ x = 0, y, s, c = INK, children, a = "middle" }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={900} fontSize={s} fill={c}>
    {children}
  </text>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = 0, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 4} L ${tail + 6} ${h / 2 + 44} L ${tail + 30} ${h / 2 - 4} Z`} fill={fill} {...K} strokeWidth={6} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} {...K} strokeWidth={6} />
    <rect x={tail - 22} y={h / 2 - 9} width={48} height={10} fill={fill} />
    {children}
  </g>
);

// the rope: a yellow cord with an ink edge and small twist marks
const ropePts = (a: [number, number], b: [number, number], sag: number, amp: number, phase: number) => {
  const n = 28;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = a[0] + (b[0] - a[0]) * s;
    const y = a[1] + (b[1] - a[1]) * s + 4 * sag * s * (1 - s) + Math.sin(s * Math.PI) * Math.sin(s * 22 - phase) * amp;
    pts.push([x, y]);
  }
  return pts;
};
const Rope: React.FC<{ pts: [number, number][] }> = ({ pts }) => {
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={21} />
      <path d={d} stroke={YEL} strokeWidth={13} />
      <path d={d} stroke={ROPE2} strokeWidth={5} strokeDasharray="10 16" />
    </g>
  );
};

const WorldBack: React.FC = () => (
  <g>
    <rect x={-900} y={-1500} width={3800} height={1500 + GROUND} fill={WALL} />
    {/* tall lighter panels: rhythm along the wall */}
    {Array.from({ length: 11 }, (_, i) => (
      <rect key={i} x={-860 + i * 340} y={-1500} width={250} height={1500 + GROUND - 240} fill={WALL2} opacity={0.42} />
    ))}
  </g>
);
const World: React.FC = () => (
  <g>
    <rect x={-900} y={GROUND - 240} width={3800} height={240} fill={WALL3} />
    <rect x={-900} y={GROUND - 250} width={3800} height={12} fill={CREAM} />
    {/* window between the two places */}
    <g transform="translate(762 640)">
      <rect x={-150} y={-190} width={300} height={380} fill="#cfe5f5" {...K} strokeWidth={8} />
      <circle cx={46} cy={-74} r={48} fill={WHITE} opacity={0.9} />
      <path d="M -146 186 L -146 80 L -84 80 L -84 30 L -28 30 L -28 104 L 34 104 L 34 54 L 92 54 L 92 112 L 146 112 L 146 186 Z" fill="#9dbfdd" />
      <line x1={0} y1={-190} x2={0} y2={190} stroke={INK} strokeWidth={8} />
      <line x1={-150} y1={0} x2={150} y2={0} stroke={INK} strokeWidth={8} />
      <rect x={-172} y={190} width={344} height={22} fill={CREAM} {...K} strokeWidth={6} />
    </g>
    {/* floor */}
    <rect x={-900} y={GROUND} width={3800} height={1400} fill={FLOOR} />
    <rect x={-900} y={GROUND} width={3800} height={12} fill={INK} />
    {Array.from({ length: 20 }, (_, i) => (
      <line key={i} x1={-900 + i * 220} y1={GROUND + 12} x2={-1300 + i * 260} y2={2700} stroke={FLOOR2} strokeWidth={8} />
    ))}
    {/* hanging lamps */}
    {[DESK_X, 762, BOARD_X].map((x, i) => (
      <g key={i} transform={`translate(${x} ${i === 1 ? 30 : 70})`}>
        <line x1={0} y1={-1900} x2={0} y2={0} stroke={INK} strokeWidth={8} />
        <path d="M -82 54 Q -70 -10 0 -10 Q 70 -10 82 54 Z" fill={CREAM} {...K} strokeWidth={7} />
        <circle cx={0} cy={62} r={15} fill={YEL} {...K} strokeWidth={5} />
      </g>
    ))}
    {/* the desk */}
    <g transform={`translate(${DESK_X} ${DESK_TOP})`}>
      <rect x={-215} y={0} width={430} height={26} rx={8} fill={CREAM} {...K} strokeWidth={7} />
      <rect x={-192} y={26} width={26} height={174} fill={CREAM2} {...K} strokeWidth={7} />
      <rect x={166} y={26} width={26} height={174} fill={CREAM2} {...K} strokeWidth={7} />
      <rect x={-146} y={26} width={120} height={96} fill={CREAM2} {...K} strokeWidth={6} />
      <rect x={-112} y={62} width={52} height={10} rx={4} fill={INK} />
    </g>
    {/* the new-task table */}
    <g transform={`translate(${TABLE_X} ${DESK_TOP})`}>
      <rect x={-215} y={0} width={430} height={26} rx={8} fill={CREAM} {...K} strokeWidth={7} />
      <rect x={-192} y={26} width={26} height={174} fill={CREAM2} {...K} strokeWidth={7} />
      <rect x={166} y={26} width={26} height={174} fill={CREAM2} {...K} strokeWidth={7} />
      <rect x={-80} y={-50} width={160} height={50} fill={WHITE} {...K} strokeWidth={6} />
      <line x1={-80} y1={-34} x2={80} y2={-34} stroke={INK} strokeWidth={4} />
      <line x1={-80} y1={-18} x2={80} y2={-18} stroke={INK} strokeWidth={4} />
    </g>
    {/* plant at the far end */}
    <g transform={`translate(1660 ${GROUND})`}>
      <path d="M -44 0 L -56 -100 L 56 -100 L 44 0 Z" fill={SLATE} {...K} strokeWidth={7} />
      {[-34, -10, 16, 38].map((a, i) => (
        <path key={i} d={`M 0 -100 Q ${a * 2.4} -210 ${a * 4} ${-260 + (i % 2) * 40}`} fill="none" stroke="#3f7d4a" strokeWidth={20} strokeLinecap="round" />
      ))}
    </g>
  </g>
);

// the laptop with the unfinished email
const Laptop: React.FC<{ f: number }> = ({ f }) => {
  const typed = interpolate(f, [YOU - 8, STOPW], [0.55, 0.72], clamp);
  const blink = Math.floor(f / 12) % 2 === 0;
  const cx = -128 + 256 * typed * 0.92;
  return (
    <g transform={`translate(${DESK_X} ${LAP_Y})`}>
      <rect x={-LAP_W / 2 - 24} y={-4} width={LAP_W + 48} height={18} rx={8} fill={CREAM2} {...K} strokeWidth={6} />
      <rect x={-LAP_W / 2} y={-LAP_H} width={LAP_W} height={LAP_H} rx={14} fill={SLATE} {...K} strokeWidth={7} />
      <rect x={-LAP_W / 2 + 14} y={-LAP_H + 14} width={LAP_W - 28} height={LAP_H - 28} rx={6} fill={WHITE} />
      <rect x={-LAP_W / 2 + 14} y={-LAP_H + 14} width={LAP_W - 28} height={58} fill={BLUE} />
      <Txt y={-LAP_H + 60} s={46} c={WHITE}>
        EMAIL
      </Txt>
      <line x1={-128} y1={-LAP_H + 112} x2={128} y2={-LAP_H + 112} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <line x1={-128} y1={-LAP_H + 150} x2={96} y2={-LAP_H + 150} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      <line x1={-128} y1={-LAP_H + 188} x2={cx} y2={-LAP_H + 188} stroke={INK} strokeWidth={11} strokeLinecap="round" />
      {blink && <rect x={cx + 12} y={-LAP_H + 168} width={8} height={40} fill={BLUE} />}
    </g>
  );
};

const NoteFace: React.FC<{ w: number; h: number; l1?: number; l2?: number; r?: number }> = ({ w, h, l1 = 1, l2 = 1, r = 0 }) => (
  <g transform={`rotate(${r})`}>
    <rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} fill={INK} opacity={0.22} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={YEL} {...K} strokeWidth={Math.max(4, w * 0.018)} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.14} fill="#f2bf22" />
    {l1 > 0.01 && (
      <g opacity={l1}>
        <Txt y={-h * 0.08} s={h * 0.2}>
          START HERE:
        </Txt>
      </g>
    )}
    {l2 > 0.01 && (
      <g opacity={l2}>
        <Txt y={h * 0.26} s={h * 0.2} c={BLUE}>
          LINE 3
        </Txt>
      </g>
    )}
  </g>
);

// one sheet on the board: blank → red cross → (flip) → green tick
const Sheet: React.FC<{ x: number; y: number; f: number; cross: number; tick: number }> = ({ x, y, f, cross, tick }) => {
  const flip = f >= tick - 5 && f < tick + 5 ? Math.abs(interpolate(f, [tick - 5, tick + 5], [1, -1], clamp)) : 1;
  const crossK = popIn(f, cross);
  const showTick = f >= tick;
  const tickK = popIn(f, tick + 3);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip} 1) rotate(${wobble(f, cross, 4)})`}>
      <rect x={-37} y={-52} width={74} height={104} fill={WHITE} {...K} strokeWidth={5} />
      {!showTick && crossK > 0.01 && (
        <g transform={`scale(${crossK})`} stroke={RED} strokeWidth={15} strokeLinecap="round">
          <line x1={-20} y1={-22} x2={20} y2={22} />
          <line x1={20} y1={-22} x2={-20} y2={22} />
        </g>
      )}
      {showTick && (
        <g transform={`scale(${tickK})`}>
          <path d="M -24 2 L -7 22 L 26 -24" fill="none" stroke={GREEN} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

const Pill: React.FC<{ x: number; y: number; w: number; c: string; children: React.ReactNode }> = ({ x, y, w, c, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-30} width={w} height={60} rx={30} fill={WHITE} {...K} strokeWidth={5} />
    <Txt y={14} s={38} c={c}>
      {children}
    </Txt>
  </g>
);

// --- the scene ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [STOP, "thud", 0.7],
  [SWITCHING, "boing", 0.28],
  [ONE, "tick", 0.55],
  [ONE + 8, "tick", 0.55],
  [LAST, "pop", 0.4],
  [REEL0, "swish", 0.6],
  [REEL1, "thud", 0.55],
  [YOU + 6, "tick", 0.3],
  [YOU + 14, "tick", 0.3],
  [YOU + 21, "tick", 0.3],
  [STOPW, "pop", 0.45],
  [BOSSW - 4, "pop", 0.3],
  [NEEDS, "ding", 0.4],
  [LEAVE + 2, "whoosh", 0.3],
  [STAYS, "boing", 0.7],
  [ROPEW, "pop", 0.4],
  [NEWW, "tick", 0.5],
  [NEWW + 7, "tick", 0.5],
  [WORSE - 8, "buzz", 0.22],
  [WORSE, "buzz", 0.35],
  [STUDENTS, "pop", 0.45],
  [BACK0 + 2, "whoosh_long", 0.32],
  [NOTEW, "pop", 0.45],
  [W(6, 3), "tick", 0.42],
  [WHERE, "scribble", 0.6],
  [AGAIN + 6, "scribble", 0.5],
  [SLAP, "slam", 0.65],
  [OFF1, "boing", 0.45],
  [OFF0 + 8, "freeze", 0.16],
  [LETGO, "boing", 0.95],
  [LETGO + 2, "whoosh", 0.55],
  [LAND, "pop", 0.6],
  [NEWB, "ding", 0.42],
  [NEWB + 6, "ding", 0.42],
  [NEWB + 12, "ding", 0.42],
  [NEWB + 18, "ding", 0.42],
  [NEWB + 24, "ding", 0.5],
  [BETTER, "impact", 0.9],
  [BETTER + 2, "crash", 0.28],
  [HOLDT, "pop", 0.4],
  [WRITE + 3, "swish", 0.3],
  [W(8, 2), "ding", 0.4],
  [Q + 2, "pop", 0.3],
  [LOOP0 + 2, "swish", 0.55],
  [LOOP0 + 8, "boing", 0.5],
];

export const S01Rope: React.FC<SceneProps> = ({ from }) => {
  const f = useCurrentFrame() + from;
  const cam = camAtRig(f);
  const loopBack = f >= LOOP0;

  // lights: a drop before the reveal; on "better" they come up over flat rays
  const dim = interpolate(f, [OFF0 + 4, OFF1 + 2, LETGO - 2, LETGO + 4], [0, 0.5, 0.5, 0], { ...clamp, easing: sio });
  const rays = interpolate(f, [BETTER - 2, BETTER + 12, WRITE - 12, WRITE + 4], [0, 1, 1, 0], clamp);

  // --- Spark's acting -------------------------------------------------------------------------------------------------
  const strain = { lean: 12, head: 8, ra1: 88, ra2: 78, la1: -30, la2: 20 }; // leaning away from the rope, palm up
  const strainHard = { lean: 16, head: 4, ra1: 70, ra2: 20, la1: -66, la2: -20 };
  const type = { ra1: 62, ra2: 40, la1: -22, la2: -16, head: 12, lean: 4 };
  const holdSheet = { ra1: 74, ra2: 34, la1: -18, la2: 10, head: -8, lean: 6 };
  const write = { ra1: 110, ra2: 30, la1: -20, la2: 12, head: 2, lean: 6 };
  const sparkKeys = gestureKeys([
    [0, { ...strain, ...G.stop, lean: 12 }],
    [W(0, 3), { ...G.stop, lean: 10, head: 6 }, "smooth"],
    [ONE - 2, { ...G.count1, lean: 10 }, "snap"],
    [WAITW - 3, G.stop, "snap"],
    [W(1, 3), { ...G.pointSide, lean: 8, head: -2 }, "snap"],
    [REEL0, { ...G.recoil, ra1: 110, ra2: 20 }, "snap"],
    [REEL1, { ...G.recoil, lean: -8 }, "smooth"],
    [YOU - 8, type, "smooth"],
    [STOPW, { ...type, ra2: 66, head: 6 }, "snap"],
    [EMAILW + 2, { ...G.stop, lean: 0, head: 4 }, "smooth"],
    [BOSSW, { ...G.shrugBig, head: 6 }, "smooth"],
    [LEAVE - 3, G.rest, "snap"],
    [STAYS, { ...strainHard, lean: -14 }, "snap"],
    [STAYS + 10, strainHard, "smooth"],
    [ROPEW - 2, { ...G.pointSide, lean: 8, head: 6 }, "snap"],
    [TESTS - 2, holdSheet, "smooth"],
    [W(4, 3), { ...holdSheet, ...G.recoil, lean: -8 }, "snap"],
    [W(4, 5), holdSheet, "smooth"],
    [WORSE, G.facepalm, "snap"],
    [THEN - 3, { ...G.thinkChin, lean: 4 }, "smooth"],
    [STUDENTS + 6, G.pointUp, "snap"],
    [BACK0 - 3, G.rest, "snap"],
    [BACK1 + 2, G.present, "smooth"],
    [WROTE - 6, write, "smooth"],
    [NOTEW, { ...write, ra2: 44 }, "snap"],
    [WHERE, { ...write, ra2: 18, head: 8 }, "smooth"],
    [AGAIN, { ...write, ra2: 46, head: 2 }, "smooth"],
    [SLAP - 6, { ...write, ra1: 150, ra2: 30, lean: -4 }, "smooth"], // wind-up
    [SLAP, { ra1: 90, ra2: 8, la1: -18, la2: 10, lean: 12, head: 8 }, "snap"],
    [OFF0, G.rest, "snap"],
    [OFF1 - 2, strain, "smooth"],
    [OFF1 + 3, { ...strainHard, lean: 18 }, "snap"],
    [LETGO, { ...strainHard, lean: 22, head: -6 }, "smooth"],
    [LETGO + 3, { ...G.celebrate, lean: 16 }, "snap"],
    [RUN1, { ...G.fistPump, lean: 8 }, "smooth"],
    [NEWB - 4, G.pointSide, "snap"],
    [BETTER - 3, G.recoil, "smooth"],
    [BETTER, G.mindBlown, "snap"],
    [WRITE - 8, G.mindBlown, "smooth"],
    [WRITE - 2, { ...G.pointSide, ra1: 96, head: 2, lean: 2 }, "snap"],
    [W(8, 2), { ...G.fistPump, la1: -40 }, "snap"],
    [Q - 3, G.present, "smooth"],
    [W(9, 3), { ra1: 150, ra2: 120, la1: -18, la2: 10, head: 6 }, "snap"], // points at his own head
    [LOOP0 + 8, { ...G.recoil, ra1: 110, ra2: 20 }, "snap"],
    [LOOP1 - 8, { ...G.stop, lean: 12 }, "smooth"],
  ]);
  const mood = (t: number): Mood => {
    if (t < W(0, 3)) return "shock";
    if (t < ONE) return "curious";
    if (t < WAITW) return "excited";
    if (t < REEL0) return "wink";
    if (t < REEL1 + 6) return "shock";
    if (t < BOSSW) return "happy";
    if (t < LEAVE) return "worried";
    if (t < STAYS) return "determined";
    if (t < ROPEW) return "shock";
    if (t < TESTS) return "skeptical";
    if (t < WORSE) return "worried";
    if (t < THEN - 3) return "sad";
    if (t < BACK0) return "curious";
    if (t < WROTE) return "thinking";
    if (t < SLAP) return "determined";
    if (t < OFF1) return "smug";
    if (t < LETGO) return "worried";
    if (t < RUN1) return "shock";
    if (t < BETTER - 3) return "excited";
    if (t < WRITE - 8) return "mindblown";
    if (t < Q - 3) return "happy";
    if (t < LOOP0) return "curious";
    if (t < LOOP1 - 8) return "shock";
    return "shock";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, BETTER, 80), bulbPulse(t, NOTEW, 22), bulbPulse(t, W(8, 2), 22));
  const scaleAt = (t: number) => {
    const big = interpolate(t, [BETTER - 3, BETTER + 2], [1.9, 3.0], { ...clamp, easing: eio });
    const back = interpolate(t, [WRITE - 10, WRITE + 2], [0, 1], { ...clamp, easing: eio });
    return big + (1.9 - big) * back;
  };
  const sNow = scaleAt(f);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (running(t)) q = addPose(q, runCycle(t - LETGO, 0.7, 0.9));
    if (walking(t)) q = addPose(q, walkCycle(t, 0.42));
    if (t >= WHERE - 4 && t < SLAP - 8) q = addPose(q, { ra2: Math.sin(t * 1.4) * 10 });
    q = addPose(q, hop(t, BETTER, 34));
    q = addPose(q, hop(t, RUN1, 12));
    q = addPose(q, nod(t, W(1, 3), 2));
    q = addPose(q, nod(t, W(8, 2), 2));
    q = addPose(q, shake(t, W(4, 6), 2));
    const s = scaleAt(t);
    const tt = [STAYS, W(4, 4)].reduce((a, t0) => a - 46 * interpolate(t, [t0, t0 + 4, t0 + 16], [0, 1, 0], { ...clamp, easing: sio }), 0) - 14 * interpolate(t, [SWITCHING, SWITCHING + 4, SWITCHING + 14], [0, 1, 0], { ...clamp, easing: sio });
    return { ...q, x: xAt(t) + tt, y: GROUND - 92.5 * s + q.y - p.y };
  };
  const facing = (t: number) => {
    if (t >= REEL1 + 4 && t < BOSSW - 2) return -1; // at the laptop
    if (t >= BACK0 && t < OFF0) return -1;
    if (t >= STAYS + 8 && t < TESTS - 4) return -1; // he looks back along the rope
    if (t >= WRITE - 2 && t < Q - 3) return -1; // points at the note, far away
    if (t >= W(4, 3) && t < W(4, 5)) return -1;
    if (t >= OFF1 + 6 && t < LETGO) return -1; // looks back at the rope
    return 1;
  };

  // --- the rope ---------------------------------------------------------------------------------------------------------
  // tension: 1 = tight, 0 = slack on the floor
  const tight = (() => {
    if (f < REEL0) return 1;
    if (f < REEL1 + 6) return interpolate(f, [REEL0, REEL1 + 6], [1, 0], clamp);
    if (f < STAYS - 8) return interpolate(f, [LEAVE, STAYS - 8], [0, 0.5], clamp);
    if (f < BACK0) return interpolate(f, [STAYS - 8, STAYS], [0.5, 1], clamp);
    if (f < BACK1) return interpolate(f, [BACK0, BACK1], [1, 0], clamp);
    if (f < OFF0) return 0;
    if (f < OFF1 + 3) return interpolate(f, [OFF0, OFF1 + 3], [0, 1], clamp);
    return 1;
  })();
  const released = f >= LETGO && f < LOOP0 + 6;
  const relK = interpolate(f, [LETGO, LAND], [0, 1], { ...clamp, easing: sio }); // free end flying to the note
  const returnK = interpolate(f, [LOOP0, LOOP0 + 8], [0, 1], { ...clamp, easing: eo }); // free end flying back to him
  const coilK = interpolate(f, [LAND - 2, LAND + 8], [0, 1], { ...clamp, easing: eo }) * interpolate(f, [LOOP0, LOOP0 + 3], [1, 0], clamp);
  const headRel: [number, number] = [SXT - 44, GROUND - 92.5 * 1.9 * 1.88];

  const ropeDraw = (j: { headC: [number, number]; headR: number }) => {
    const end: [number, number] = [j.headC[0] - j.headR * 1.02, j.headC[1] - j.headR * 0.12];
    const onHead = !released && f < LETGO + 1;
    const afterLoop = f >= LOOP0 + 6;
    if (onHead || afterLoop) {
      const sagFloor = Math.max(0, GROUND - 20 - (HOOK[1] + end[1]) / 2);
      const sag = 8 + (1 - tight) * sagFloor * 0.98;
      const amp = tight > 0.95 ? 2.6 + (f >= OFF1 && f < LETGO ? 2.4 : 0) : 0;
      const yank = [STAYS, W(4, 4), OFF1].reduce((a, t0) => a + interpolate(f, [t0, t0 + 3, t0 + 18], [0, 12, 0], clamp), 0);
      const pts = ropePts(HOOK, end, sag, amp + yank, f * 1.5);
      return (
        <>
          <Rope pts={pts} />
          <circle cx={end[0]} cy={end[1]} r={18} fill={YEL} {...K} strokeWidth={6} />
          <path d={`M ${end[0] - 10} ${end[1] - 8} L ${end[0] + 10} ${end[1] + 8} M ${end[0] + 10} ${end[1] - 8} L ${end[0] - 10} ${end[1] + 8}`} stroke={ROPE2} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    }
    return null;
  };

  // free rope after the release, drawn in the world (not on Spark)
  const freeRope = (() => {
    if (!released) return null;
    if (f >= LOOP0) {
      // flying back to his head
      const head: [number, number] = [SXB - 40, GROUND - 92.5 * 1.9 * 1.88];
      const e = arc(returnK, PIN, head, 220);
      return <Rope pts={ropePts(HOOK, e, 16, (1 - returnK) * 16, f)} />;
    }
    const e = arc(relK, headRel, PIN, 300);
    const ampl = (1 - relK) * 60 + 8;
    const dying = interpolate(f, [LAND - 4, LAND + 6], [1, 0], clamp);
    return dying > 0.01 ? (
      <>
        <Rope pts={ropePts(HOOK, e, 30 * dying, ampl * dying, f * 1.8)} />
        <circle cx={e[0]} cy={e[1]} r={19} fill={YEL} {...K} strokeWidth={6} />
      </>
    ) : null;
  })();

  // --- props ------------------------------------------------------------------------------------------------------------
  const notDone = popIn(f, STOPW) * interpolate(f, [LEAVE, LEAVE + 8], [1, 0], { ...clamp, easing: ei });
  const oneK = popIn(f, ONE) * interpolate(f, [E(0) + 4, WAITW + 2], [1, 0], { ...clamp, easing: ei });
  const lastK = popIn(f, LAST) * interpolate(f, [REEL0 - 4, REEL0 + 2], [1, 0], { ...clamp, easing: ei });
  const ropeK = popIn(f, ROPEW) * interpolate(f, [TESTS, TESTS + 8], [1, 0], { ...clamp, easing: ei });
  const worseK = popIn(f, WORSE) * interpolate(f, [THEN - 6, THEN + 2], [1, 0], { ...clamp, easing: ei });
  const signK = popIn(f, STUDENTS + 6);
  const beforeK = popIn(f, BACK1 - 8) * interpolate(f, [WROTE - 2, WROTE + 6], [1, 0], { ...clamp, easing: ei });

  // boss: walks in from the right, then ahead to the new task, then out
  const bossX = interpolate(f, [BOSSW - 18, BOSSW + 6, LEAVE - 2, LEAVE + 30, TESTS - 8, TESTS + 16], [1240, 800, 800, 1560, 1560, 1960], { ...clamp, easing: sio });
  const bossWalking = (t: number) => (t >= BOSSW - 18 && t < BOSSW + 6) || (t >= LEAVE - 2 && t < LEAVE + 30) || (t >= TESTS - 8 && t < TESTS + 16);
  const bossBubble = popIn(f, NEEDS) * interpolate(f, [LEAVE - 8, LEAVE], [1, 0], { ...clamp, easing: ei });
  // scientist: walks in on "students", hands the pen, leaves
  const sciX = interpolate(f, [STUDENTS - 12, STUDENTS + 12, BACK0, BACK1 + 2, WROTE - 22, WROTE + 12], [1720, 1270, 1270, 760, 760, 1120], { ...clamp, easing: sio });
  const sciWalking = (t: number) => (t >= STUDENTS - 12 && t < STUDENTS + 12) || (t >= BACK0 && t < BACK1 + 2) || (t >= WROTE - 22 && t < WROTE + 12);

  // big note while it is being written (INSERT), then it flies onto the laptop
  const noteIn = popIn(f, NOTEW);
  const l1 = interpolate(f, [WHERE, WHERE + 8], [0, 1], clamp);
  const l2 = interpolate(f, [AGAIN + 2, AGAIN + 10], [0, 1], clamp);
  const flyK = interpolate(f, [SLAP - 8, SLAP], [0, 1], { ...clamp, easing: ei });
  const noteFrom: [number, number] = [302, 610];
  const noteTo: [number, number] = [DESK_X + 2, LAP_Y - LAP_H / 2 + 8];
  const notePos = arc(flyK, noteFrom, noteTo, 40);
  const noteScale = interpolate(flyK, [0, 1], [1, 0.72]);
  const notePop = interpolate(f, [LOOP0, LOOP0 + 5], [1, 0], { ...clamp, easing: ei });
  const noteSq = squash(f, SLAP, 0.16);
  const noteR = interpolate(flyK, [0, 1], [-3, 3]) + wobble(f, SLAP, 3);

  // stopwatch: one full turn during the line
  const clockK = popIn(f, W(6, 3)) * interpolate(f, [SLAP - 8, SLAP - 2], [1, 0], { ...clamp, easing: ei });
  const clockA = interpolate(f, [W(6, 3), SLAP - 10], [0, 360], clamp); // a clock hand: linear on purpose

  // coil + tag at the reveal
  const tagK = popIn(f, HOLDT) * interpolate(f, [WRITE - 6, WRITE + 2], [1, 0], { ...clamp, easing: ei });
  const writeK = popIn(f, W(8, 1)) * interpolate(f, [Q - 8, Q], [1, 0], { ...clamp, easing: ei });
  const qK = popIn(f, W(9, 1)) * interpolate(f, [LOOP0 - 6, LOOP0 + 2], [1, 0], { ...clamp, easing: ei });

  const SHEETS = [0, 1, 2, 3, 4];
  const sheetX = (i: number) => BOARD_X - 170 + i * 85;
  const onB = f >= LEAVE && f < BACK1 + 4 ? true : f >= OFF0 - 6 && f < LOOP0 + 18;

  const svg = (
    <>
      <defs>
        <clipPath id="wallOnly">
          <rect x={-900} y={-1500} width={3800} height={1500 + GROUND} />
        </clipPath>
      </defs>
      <WorldBack />
      {rays > 0.01 && (
        <g clipPath="url(#wallOnly)">
          <g transform={`translate(${SXB} 840) rotate(${(f - BETTER) * 0.09}) scale(${0.6 + rays * 0.6})`} opacity={rays * 0.85}>
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i * Math.PI * 2) / 14;
              const b = a + Math.PI / 14;
              return <path key={i} d={`M 0 0 L ${Math.cos(a) * 2400} ${Math.sin(a) * 2400} L ${Math.cos(b) * 2400} ${Math.sin(b) * 2400} Z`} fill={WALL2} />;
            })}
          </g>
        </g>
      )}
      <World />
      {/* the board with the five sheets */}
      {onB && (
        <g>
          <rect x={BOARD_X - 232} y={BOARD_Y - 150} width={464} height={236} rx={14} fill={CREAM} {...K} strokeWidth={8} />
          <Txt x={BOARD_X} y={BOARD_Y - 92} s={58}>
            NEW TASK
          </Txt>
          {SHEETS.map((i) => (
            <Sheet key={i} x={sheetX(i)} y={BOARD_Y + 8} f={f} cross={WORSE - 8 + i * 4} tick={f >= LETGO ? NEWB + i * 6 : 99999} />
          ))}
        </g>
      )}
      {/* on "better": sheets with ticks burst out of the stack and fall away */}
      {f >= BETTER && f < BETTER + 56 &&
        [-420, -300, -190, -90, 30, 140, 240, 330].map((dx, i) => {
          const u = interpolate(f, [BETTER + (i % 3), BETTER + 50], [0, 1], clamp);
          const p = arc(Math.pow(u, 0.7), [TABLE_X, DESK_TOP - 50], [TABLE_X + dx, DESK_TOP + 120], 560 + (i % 4) * 90);
          return (
            <g key={i} transform={`translate(${p[0]} ${p[1]}) rotate(${dx * 0.1 + u * (i % 2 ? 280 : -280)}) scale(${1.1 * interpolate(u, [0.8, 1], [1, 0], clamp)})`}>
              <rect x={-36} y={-46} width={72} height={92} fill={WHITE} {...K} strokeWidth={5} />
              <path d="M -20 2 L -6 18 L 22 -20" fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      <Laptop f={f} />
      {/* the rope's knot on the laptop */}
      <circle cx={HOOK[0]} cy={HOOK[1]} r={15} fill={YEL} {...K} strokeWidth={6} />
      {notDone > 0.01 && (
        <g transform={`translate(${DESK_X} ${HOOK[1] - 66}) scale(${notDone}) rotate(${wobble(f, STOPW, 4)})`}>
          <Bubble w={290} h={78} fill={YEL} tail={0}>
            <Txt y={17} s={48}>
              NOT DONE
            </Txt>
          </Bubble>
        </g>
      )}
      {/* the note stuck on the laptop, then the coil on the note */}
      {f >= SLAP && notePop > 0.01 && (
        <g transform={`translate(${noteTo[0]} ${noteTo[1]}) scale(${0.72 * notePop * noteSq[0]} ${0.72 * notePop * noteSq[1]})`}>
          <NoteFace w={340} h={280} r={3} />
        </g>
      )}
      {freeRope}
      {coilK > 0.01 && (
        <g>
          {/* neat loops hanging from the laptop's corner, the free end tied to the pin on the note */}
          <g transform={`translate(${HOOK[0] + 44} ${HOOK[1] + 8}) scale(${coilK})`}>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <ellipse cx={-6 + i * 13} cy={62} rx={58} ry={70 - i * 3} fill="none" stroke={INK} strokeWidth={21} />
                <ellipse cx={-6 + i * 13} cy={62} rx={58} ry={70 - i * 3} fill="none" stroke={YEL} strokeWidth={13} />
              </g>
            ))}
          </g>
          <path d={`M ${HOOK[0] - 2} ${HOOK[1] + 4} Q ${(HOOK[0] + PIN[0]) / 2 + 12} ${(HOOK[1] + PIN[1]) / 2 + 26} ${PIN[0]} ${PIN[1]}`} fill="none" stroke={INK} strokeWidth={21} strokeLinecap="round" opacity={coilK} />
          <path d={`M ${HOOK[0] - 2} ${HOOK[1] + 4} Q ${(HOOK[0] + PIN[0]) / 2 + 12} ${(HOOK[1] + PIN[1]) / 2 + 26} ${PIN[0]} ${PIN[1]}`} fill="none" stroke={YEL} strokeWidth={13} strokeLinecap="round" opacity={coilK} />
          <circle cx={PIN[0]} cy={PIN[1]} r={17 * coilK} fill={RED} {...K} strokeWidth={6} />
        </g>
      )}
      {dim > 0.01 && <rect x={-900} y={-1500} width={3800} height={4600} fill="#170d2a" opacity={dim} />}

      {/* boss */}
      {f >= BOSSW - 20 && bossX < 1950 && (
        <g>
          <Actor f={f} color={COL.orange} scale={1.75} base={{ x: bossX, y: GROUND - 92.5 * 1.75 }} keys={[{ f: 0, p: { ra1: 60, ra2: 70, la1: -70, la2: -60 } }]} mod={(t, p) => addPose(addPose(p, idle(t, 7)), bossWalking(t) ? walkCycle(t, 0.42) : {})} facing={(t) => (t < BOSSW + 6 ? -1 : t < LEAVE - 2 ? -1 : 1)} face="happy" trails={false}>
            {(j) => (
              <g>
                <path d={`M ${j.neck[0]} ${j.neck[1] + 2} L ${j.neck[0] - 12} ${j.neck[1] + 24} L ${j.neck[0]} ${j.neck[1] + 86} L ${j.neck[0] + 12} ${j.neck[1] + 24} Z`} fill={RED} {...K} strokeWidth={4} />
              </g>
            )}
          </Actor>
          <Pill x={bossX} y={GROUND - 80} w={146} c={COL.orange}>
            BOSS
          </Pill>
        </g>
      )}
      {bossBubble > 0.01 && (
        <g transform={`translate(690 700) scale(${bossBubble}) rotate(${wobble(f, NEEDS, 4)})`}>
          <Bubble w={350} h={134} tail={84}>
            <Txt y={-10} s={52}>
              NEW TASK.
            </Txt>
            <Txt y={44} s={52} c={RED}>
              NOW!
            </Txt>
          </Bubble>
        </g>
      )}
      {/* scientist with the sign on a pole */}
      {sciX < 1700 && f >= STUDENTS - 12 && f < WROTE + 13 && (
        <Actor f={f} color={COL.orange} scale={1.7} base={{ x: sciX, y: GROUND - 92.5 * 1.7 }} keys={[{ f: 0, p: { ra1: 70, ra2: 90, la1: -20, la2: 10 } }]} mod={(t, p) => addPose(addPose(p, idle(t, 9)), sciWalking(t) ? walkCycle(t, 0.42) : {})} facing={(t) => (t < WROTE - 22 ? -1 : 1)} face="happy" trails={false}>
          {(j) => (
            <>
              <path d={`M ${j.neck[0] - 26} ${j.neck[1] + 2} L ${j.neck[0] + 26} ${j.neck[1] + 2} L ${j.hip[0] + 48} ${j.hip[1] + 34} L ${j.hip[0] - 48} ${j.hip[1] + 34} Z`} fill={WHITE} {...K} strokeWidth={6} />
              {signK > 0.01 && (
                <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) scale(${signK}) rotate(${wobble(f, STUDENTS + 6, 3) + (sciWalking(f) ? Math.sin(f * 0.42) * 2 : 0)})`}>
                  <line x1={0} y1={30} x2={0} y2={-380} stroke={INK} strokeWidth={12} strokeLinecap="round" />
                  <rect x={-170} y={-530} width={340} height={158} rx={14} fill={WHITE} {...K} strokeWidth={7} />
                  <Txt y={-462} s={52}>
                    TEST WITH
                  </Txt>
                  <Txt y={-402} s={56} c={BLUE}>
                    STUDENTS
                  </Txt>
                </g>
              )}
            </>
          )}
        </Actor>
      )}

      {/* stopwatch */}
      {clockK > 0.01 && (
        <g transform={`translate(${DESK_X + 454} 610) scale(${clockK})`}>
          <rect x={-16} y={-122} width={32} height={30} fill={SLATE} {...K} strokeWidth={5} />
          <circle r={96} fill={WHITE} {...K} strokeWidth={8} />
          <path d={`M 0 0 L 0 -82 A 82 82 0 ${clockA > 180 ? 1 : 0} 1 ${Math.sin((clockA * Math.PI) / 180) * 82} ${-Math.cos((clockA * Math.PI) / 180) * 82} Z`} fill={YEL} />
          <line x1={0} y1={0} x2={Math.sin((clockA * Math.PI) / 180) * 76} y2={-Math.cos((clockA * Math.PI) / 180) * 76} stroke={RED} strokeWidth={8} strokeLinecap="round" />
          <circle r={9} fill={INK} />
          <Txt y={152} s={44}>
            1 MINUTE
          </Txt>
        </g>
      )}
      {/* the big note while it is written */}
      {noteIn > 0.01 && f < SLAP && (
        <g transform={`translate(${notePos[0]} ${notePos[1]}) scale(${noteIn * noteScale})`}>
          <NoteFace w={340} h={280} l1={l1} l2={l2} r={noteR} />
        </g>
      )}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={facing}>
        {(j) => (
          <>
            {ropeDraw(j)}
            {/* the sheet he holds at the new task */}
            {f >= TESTS - 2 && f < WORSE - 2 && (
              <g transform={`translate(${j.rHand[0] + 34} ${j.rHand[1] - 20}) rotate(${6 + Math.sin(f * 0.2) * 3})`}>
                <rect x={-44} y={-58} width={88} height={116} fill={WHITE} {...K} strokeWidth={5} />
                <line x1={-28} y1={-30} x2={28} y2={-30} stroke={INK} strokeWidth={5} />
                <line x1={-28} y1={-6} x2={28} y2={-6} stroke={INK} strokeWidth={5} />
                <line x1={-28} y1={18} x2={12} y2={18} stroke={INK} strokeWidth={5} />
              </g>
            )}
            {/* the pen */}
            {f >= NOTEW - 8 && f < SLAP - 8 && (
              <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(-50)`}>
                <rect x={-8} y={-60} width={16} height={84} rx={4} fill={RED} {...K} strokeWidth={4} />
                <path d="M -8 -60 L 0 -82 L 8 -60 Z" fill={WHITE} {...K} strokeWidth={4} />
              </g>
            )}
          </>
        )}
      </Spark>

      {/* speech bubbles */}
      {oneK > 0.01 && (
        <g transform={`translate(${SX0 - 110} 760) scale(${oneK}) rotate(${wobble(f, ONE, 4)})`}>
          <Bubble w={360} h={110} fill={YEL} tail={94}>
            <Txt y={20} s={58}>
              1 MINUTE?
            </Txt>
          </Bubble>
        </g>
      )}
      {lastK > 0.01 && (
        <g transform={`translate(${SX0 - 150} 750) scale(${lastK}) rotate(${wobble(f, LAST, 4)})`}>
          <Bubble w={430} h={110} tail={130}>
            <Txt y={20} s={56}>
              THE LAST PART
            </Txt>
          </Bubble>
        </g>
      )}
      {ropeK > 0.01 && (
        <g transform={`translate(830 660) scale(${ropeK}) rotate(${wobble(f, ROPEW, 4)})`}>
          <Bubble w={360} h={110} fill={YEL} tail={-40}>
            <Txt y={20} s={56}>
              LIKE A ROPE
            </Txt>
          </Bubble>
        </g>
      )}
      {worseK > 0.01 && (
        <g transform={`translate(${SXB + 12} 650) scale(${worseK}) rotate(${wobble(f, WORSE, 4)})`}>
          <Bubble w={320} h={110} tail={-30}>
            <Txt y={22} s={74} c={RED}>
              WORSE
            </Txt>
          </Bubble>
        </g>
      )}
      {beforeK > 0.01 && (
        <g transform={`translate(${DESK_X + 10} ${HOOK[1] - 76}) scale(${beforeK})`}>
          <Bubble w={380} h={100} fill={YEL} tail={0}>
            <Txt y={18} s={54}>
              BEFORE LEAVING
            </Txt>
          </Bubble>
        </g>
      )}
      {tagK > 0.01 && (
        <g transform={`translate(${DESK_X + 90} ${HOOK[1] - 96}) scale(${tagK * 1.25}) rotate(${wobble(f, HOLDT, 3)})`}>
          <Bubble w={430} h={94} fill={YEL} tail={-60}>
            <Txt y={17} s={48}>
              THE NOTE HOLDS IT
            </Txt>
          </Bubble>
        </g>
      )}
      {writeK > 0.01 && (
        <g transform={`translate(${SXB - 260} 660) scale(${writeK * 1.3}) rotate(${wobble(f, W(8, 1), 3)})`}>
          <Bubble w={500} h={92} fill={YEL} tail={120}>
            <Txt y={17} s={50}>
              WRITE THE NOTE FIRST
            </Txt>
          </Bubble>
        </g>
      )}
      {qK > 0.01 && (
        <g transform={`translate(${SXB - 130} 700) scale(${qK}) rotate(${wobble(f, W(9, 1), 4)})`}>
          <Bubble w={520} h={150} tail={120}>
            <Txt y={-8} s={58}>
              WHAT TASK IS
            </Txt>
            <Txt y={52} s={58}>
              IN YOUR HEAD?
            </Txt>
          </Bubble>
        </g>
      )}
    </>
  );

  // --- screen-space text ---------------------------------------------------------------------------------------------------
  const overlayOn = f < WAITW - 2 || f >= LOOP1 - 8;
  const betterK = popIn(f, BETTER);
  const betterOut = interpolate(f, [WRITE - 14, WRITE - 4], [1, 0], { ...clamp, easing: ei });
  const html = (
    <>
      {overlayOn && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 258,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 122,
            color: YEL,
            WebkitTextStroke: `11px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: f >= LOOP1 - 8 ? interpolate(f, [LOOP1 - 8, LOOP1 - 2], [0, 1], clamp) : interpolate(f, [WAITW - 12, WAITW - 2], [1, 0], clamp),
          }}
        >
          STOP SWITCHING
          <br />
          TASKS
        </div>
      )}
      {f >= BETTER - 3 && betterOut > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 262,
            textAlign: "center",
            opacity: betterOut,
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            color: WHITE,
            WebkitTextStroke: `11px ${INK}`,
            paintOrder: "stroke fill",
          }}
        >
          <div style={{ fontSize: 76 }}>THE NEW TASK WENT</div>
          <div style={{ fontSize: 176, color: YEL, transform: `scale(${betterK}) rotate(-2deg)` }}>BETTER!</div>
        </div>
      )}
      {f >= 310 && f < LOOP0 && (
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
            {f < TESTS
              ? "The email and the boss are our own example"
              : f < THEN
                ? "Leroy, 2009; Leroy & Glomb, 2018. The sheets are a picture, not data."
                : f < LETGO
                  ? "Small tests with students (Leroy & Glomb, Organization Science, 2018)"
                  : "It helped the new task. Going back to the old task was not tested."}
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
            YOUR BRAIN DID THIS
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "minute", "last", "boss", "rope.", "rope", "worse.", "worse", "students", "one-minute", "note", "better!", "better", "head?", "head"]}
      />
    </>
  );

  const hits = [STOP + 1, BETTER, BETTER + 2];
  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={hits} power={6} svg={svg} html={html} />;
};
