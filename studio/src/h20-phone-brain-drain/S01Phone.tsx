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
import { arc, ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H20 · "Is your phone making you less smart right now?" (Myth check, ~43 s, clarity rules 2026-10-29)
// Two places only, each change announced by the narration:
// A) A sunny home study: mustard wall, window, a wooden door on the left and a desk on the right with a book,
//    a laptop and a glowing phone on a stand. Spark looks at the phone, worried. "Most people say yes": YES!
//    bubbles. "Another reason": a big ? over Spark. "In 2017, scientists…" → slice into
// B) a calm blue-grey MEMORY TEST room: two desks, PHONE ON DESK vs PHONE IN OTHER ROOM, score bars (illustration)
//    → the right one is higher. Newspaper: PHONES MAKE US LESS SMART. TESTED AGAIN: the bars become equal.
//    A stack of 56 STUDIES. A card SHORT-TERM MEMORY: SMALL DROP. The headline shrinks to EFFECT: SMALL.
// A again) "Back at your desk": the phone flies through the door marked OTHER ROOM; the door closes.
//    Comment question; loops into frame 0.
// Sources: Ward, Duke, Gneezy & Bos 2017 (JACR); preregistered replication, Acta Psychologica 2022;
// Parry 2024 meta-analysis (Media Psychology, 56 studies).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: sunny mustard study + calm blue-grey test room
const WALL = "#f4c25a";
const WALL2 = "#eab449";
const WOOD = "#a8683f";
const WOOD2 = "#c98a55";
const FLOOR = "#8f5a38";
const SKYW = "#9fd6ff";
const LEAF = "#6cbf5a";
const ROOMW = "#dfe6f3";
const ROOMW2 = "#cfd9ea";
const ROOMF = "#8e9cb8";
const BOARD = "#2f3b55";
const BOARD2 = "#45547a";
const RED = "#ff4d5a";
const GREEN = "#3fcf6a";
const GOLD = "#ffd23f";
const ORANGE = "#ff8a3d";
const PAPER = "#fffaf0";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  phone0: W(0, 2),
  smart0: W(0, 6),
  c1: C(1),
  yes1: W(1, 3),
  but1: W(1, 4),
  focus1: W(1, 8),
  reason1: W(1, 10),
  c2: C(2),
  y2017: W(2, 1),
  sci2: W(2, 2),
  test2: W(2, 7),
  c3: C(3),
  room3: W(3, 6),
  better3: W(3, 7),
  c4: C(4),
  said4: W(4, 2),
  smart4: W(4, 7),
  c5: C(5),
  repeated5: W(5, 2),
  diff5: W(5, 7),
  gone5: W(5, 9),
  c6: C(6),
  review6: W(6, 2),
  fifty6: W(6, 5),
  c7: C(7),
  small7: W(7, 4),
  drop7: W(7, 5),
  memory7: W(7, 8),
  c8: C(8),
  effect8: W(8, 5),
  small8: W(8, 9),
  c9: C(9),
  desk9: W(9, 3),
  put9: W(9, 4),
  room9: W(9, 9),
  c10: C(10),
  now10: W(10, 5),
};
const LOOP = VOICE_FRAMES - 14;
const ROOM0 = T.sci2 + 4; // slice into the test room on "scientists"
const BACK = T.desk9; // cut back to the study on "desk"

// staging — study
const SX_A = 400;
const DESK = { x0: 590, x1: 990, top: GROUND - 300 };
const PHONE_A: [number, number] = [735, DESK.top - 112]; // phone on its stand
const DOOR = { x: 70, w: 200, top: GROUND - 600 };
const DOOR_IN: [number, number] = [DOOR.x + DOOR.w / 2, GROUND - 330];
// staging — test room
const SX_B = 850;
const DX = [250, 600];
const DTOP = GROUND - 210;
const BAR = { y0: 560, y1: 790, w: 120 };

const SHOTS: Shot[] = [
  { f: 0, z: 1.28, at: [600, 900], e: "cut" }, // frame 0: Spark + phone
  { f: 4, z: 1.38, at: [610, 900], e: "slow" }, // slow push while he asks
  { f: T.c1 - 4, z: 1.12, at: [520, 800], e: "slow" }, // MED: YES! bubbles + ?
  { f: T.c2 - 4, z: 1.2, at: [560, 820], e: "slow" }, // MED: 2017 card
  { f: ROOM0, z: 1.04, at: [540, 860], e: "cut" }, // WIDE: test room
  { f: T.c3 - 6, z: 1.12, at: [530, 840], e: "slow" }, // MED: desks + bars
  { f: T.c4 - 6, z: 1.1, at: [540, 820], e: "slow" }, // MED: newspaper
  { f: T.c5 - 6, z: 1.12, at: [530, 840], e: "slow" }, // MED: bars equal
  { f: T.c6 - 6, z: 1.15, at: [530, 800], e: "slow" }, // MED: 56 STUDIES
  { f: T.c7 - 6, z: 1.2, at: [520, 780], e: "slow" }, // INSERT: memory card
  { f: T.c8 - 6, z: 1.12, at: [560, 820], e: "slow" }, // MED: Spark + headline shrinks
  { f: BACK, z: 1.1, at: [540, 880], e: "cut" }, // WIDE: back in the study
  { f: T.c10 - 6, z: 1.5, at: [SX_A + 40, HEADY + 60], e: "slow" }, // CU: question
  { f: LOOP, z: 1.28, at: [600, 900], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={w} fontSize={s} fill={c}>
    {children}
  </text>
);

// a phone centred at (0,0), about 120 x 216; glow = 0..1 screen light
const Phone: React.FC<{ f: number; glow?: number; s?: number }> = ({ f, glow = 1, s = 1 }) => (
  <g transform={`scale(${s})`}>
    {glow > 0.01 && <circle r={110} fill={WHITE} opacity={0.18 * glow * (0.8 + 0.2 * Math.sin(f / 6))} />}
    <rect x={-60} y={-108} width={120} height={216} rx={20} fill="#16161e" {...K} strokeWidth={6} />
    <rect x={-50} y={-94} width={100} height={188} rx={10} fill={glow > 0.5 ? "#bfe3ff" : "#3a4058"} />
    {glow > 0.5 && (
      <>
        <rect x={-38} y={-76} width={76} height={26} rx={8} fill={WHITE} />
        <rect x={-38} y={-40} width={60} height={26} rx={8} fill={WHITE} />
        <rect x={-38} y={-4} width={70} height={26} rx={8} fill={WHITE} />
        <circle cx={40} cy={-80} r={13} fill={RED} stroke={INK} strokeWidth={3} />
      </>
    )}
  </g>
);

// world A: sunny home study
const Study: React.FC<{ f: number; door: number; phoneOnDesk: boolean; sign: number }> = ({ f, door, phoneOnDesk, sign }) => (
  <g>
    <rect width={1080} height={1920} fill={WALL} />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={i * 130} y={0} width={14} height={GROUND} fill={WALL2} opacity={0.6} />
    ))}
    {/* window with a tree */}
    <g transform="translate(520 380)">
      <rect x={0} y={0} width={420} height={330} rx={12} fill={SKYW} {...K} />
      <circle cx={300} cy={250} r={120} fill={LEAF} />
      <circle cx={190} cy={290} r={80} fill="#58a84a" />
      <circle cx={90} cy={70} r={34} fill="#fff3b0" opacity={0.9} />
      <line x1={210} y1={0} x2={210} y2={330} stroke={INK} strokeWidth={8} />
      <line x1={0} y1={165} x2={420} y2={165} stroke={INK} strokeWidth={8} />
      <rect x={-20} y={326} width={460} height={22} rx={6} fill={WOOD2} {...K} strokeWidth={5} />
    </g>
    {/* door (left) with an OTHER ROOM sign; door = 0 closed .. 1 open */}
    <rect x={DOOR.x} y={DOOR.top} width={DOOR.w} height={GROUND - DOOR.top} fill="#3b2a22" {...K} />
    <g transform={`translate(${DOOR.x} 0)`}>
      <path
        d={`M 0 ${DOOR.top} L ${DOOR.w * (1 - 0.75 * door)} ${DOOR.top + 30 * door} L ${DOOR.w * (1 - 0.75 * door)} ${GROUND - 20 * door} L 0 ${GROUND} Z`}
        fill={WOOD}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <circle cx={DOOR.w * (1 - 0.75 * door) - 26} cy={GROUND - 300} r={11} fill={GOLD} stroke={INK} strokeWidth={4} />
    </g>
    {sign > 0.01 && <g transform={`translate(${DOOR.x + DOOR.w / 2 + 20} ${DOOR.top - 50}) scale(${sign})`}>
      <rect x={-118} y={-34} width={236} height={64} rx={12} fill={PAPER} {...K} strokeWidth={5} />
      <Txt y={12} s={34}>
        OTHER ROOM
      </Txt>
    </g>}
    {/* floor */}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={FLOOR} />
    {Array.from({ length: 6 }, (_, i) => (
      <line key={i} x1={i * 200} y1={GROUND} x2={i * 200 - 80} y2={1920} stroke="#7a4b2e" strokeWidth={5} />
    ))}
    {/* desk */}
    <rect x={DESK.x0} y={DESK.top} width={DESK.x1 - DESK.x0} height={34} rx={8} fill={WOOD2} {...K} />
    <rect x={DESK.x0 + 24} y={DESK.top + 34} width={26} height={GROUND - DESK.top - 34} fill={WOOD} stroke={INK} strokeWidth={5} />
    <rect x={DESK.x1 - 50} y={DESK.top + 34} width={26} height={GROUND - DESK.top - 34} fill={WOOD} stroke={INK} strokeWidth={5} />
    {/* book stack + laptop */}
    <rect x={DESK.x0 + 20} y={DESK.top - 30} width={100} height={30} rx={4} fill="#5b8def" stroke={INK} strokeWidth={4} />
    <rect x={DESK.x0 + 28} y={DESK.top - 56} width={88} height={26} rx={4} fill={RED} stroke={INK} strokeWidth={4} />
    <g transform={`translate(${DESK.x1 - 120} ${DESK.top})`}>
      <path d="M -80 0 L 80 0 L 96 -8 L -96 -8 Z" fill="#b9c2d6" stroke={INK} strokeWidth={4} />
      <rect x={-74} y={-128} width={148} height={120} rx={10} fill="#b9c2d6" stroke={INK} strokeWidth={5} />
      <rect x={-62} y={-116} width={124} height={96} rx={6} fill={WHITE} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={-50} y={-104 + i * 22} width={i === 3 ? 50 : 98} height={10} rx={5} fill="#c9d3e6" />
      ))}
    </g>
    {/* phone stand */}
    <path d={`M ${PHONE_A[0] - 44} ${DESK.top} L ${PHONE_A[0] + 44} ${DESK.top} L ${PHONE_A[0] + 20} ${DESK.top - 18} L ${PHONE_A[0] - 20} ${DESK.top - 18} Z`} fill="#56597e" stroke={INK} strokeWidth={4} />
    {phoneOnDesk && (
      <g transform={`translate(${PHONE_A[0]} ${PHONE_A[1]})`}>
        <Phone f={f} />
      </g>
    )}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// world B: the memory test room
const TestRoom: React.FC<{ sign: boolean }> = ({ sign }) => (
  <g>
    <rect width={1080} height={1920} fill={ROOMW} />
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={i * 190} y={0} width={90} height={GROUND} fill={ROOMW2} opacity={0.5} />
    ))}
    {sign && (
      <g transform="translate(430 380)">
        <rect x={-260} y={-50} width={520} height={96} rx={16} fill={GOLD} {...K} />
        <Txt y={20} s={58}>
          MEMORY TEST
        </Txt>
      </g>
    )}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={ROOMF} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

const TestDesk: React.FC<{ x: number; phone: boolean }> = ({ x, phone }) => (
  <g transform={`translate(${x} 0)`}>
    <rect x={-130} y={DTOP} width={260} height={30} rx={8} fill="#c4cbe0" {...K} />
    <rect x={-110} y={DTOP + 30} width={22} height={GROUND - DTOP - 30} fill="#9aa3bf" stroke={INK} strokeWidth={4} />
    <rect x={88} y={DTOP + 30} width={22} height={GROUND - DTOP - 30} fill="#9aa3bf" stroke={INK} strokeWidth={4} />
    {/* test paper */}
    <rect x={-60} y={DTOP - 10} width={90} height={12} rx={3} fill={PAPER} stroke={INK} strokeWidth={3} />
    {phone && (
      <g transform={`translate(70 ${DTOP - 8})`}>
        <rect x={-34} y={-8} width={68} height={12} rx={5} fill="#16161e" stroke={INK} strokeWidth={3} />
      </g>
    )}
  </g>
);

export const S01_SFX: SfxCue[] = [
  [2, "swish", 0.12],
  [T.phone0, "ding", 0.15],
  ...[0, 1, 2].map((i) => [T.yes1 - 6 + i * 6, "pop", 0.2] as SfxCue),
  [T.reason1, "boing", 0.2],
  [T.y2017, "pop", 0.3],
  [ROOM0 - 8, "whoosh_long", 0.3],
  [T.test2, "page", 0.25],
  [T.room3, "pop", 0.2],
  [T.better3, "ding", 0.25],
  [T.said4, "page", 0.3],
  [T.smart4, "stamp", 0.25],
  [T.repeated5, "whoosh", 0.2],
  [T.gone5, "pop", 0.25],
  [T.review6 - 4, "thud", 0.3],
  [T.fifty6, "pop", 0.2],
  [T.small7, "pop", 0.2],
  [T.drop7, "tick", 0.2],
  [T.effect8, "swirl", 0.15],
  [T.small8, "pop", 0.25],
  [BACK - 6, "whoosh", 0.2],
  [T.put9, "swish", 0.25],
  [T.room9 + 6, "thud", 0.3],
  [T.c10 - 4, "whoosh", 0.12],
  [LOOP, "ding", 0.12],
];

// test-takers write with a pencil
const WRITE: Partial<Pose> = { ra1: 40, ra2: 70, la1: -30, la2: 40, head: 12 };
const CHEER: Partial<Pose> = { ra1: 150, ra2: 20, la1: -30, la2: 40, head: -4 };

export const S01Phone: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const room = f >= ROOM0 && f < BACK && !loopBack;
  const study = !room;
  const late = study && f >= BACK && !loopBack;
  const cam = camAt(f, SHOTS, VERTICAL);

  // --- study, first half ---
  const yesK = (i: number) => (study && !late && f >= T.yes1 - 6 + i * 6 && f < T.c2 ? popIn(f, T.yes1 - 6 + i * 6) : 0);
  const qK = study && !late && f >= T.reason1 - 4 && f < T.c2 + 8 ? popIn(f, T.reason1 - 4) : 0;
  const yearK = study && !late && f >= T.y2017 - 2 ? popIn(f, T.y2017 - 2) : 0;

  // --- test room ---
  const s4 = room && f >= T.c4 - 4 && f < T.c5 - 4;
  const s5 = room && f >= T.c5 - 4 && f < T.c6 - 4;
  const s6 = room && f >= T.c6 - 4 && f < T.c7 - 4;
  const s7 = room && f >= T.c7 - 4 && f < T.c8 - 4;
  const s8 = room && f >= T.c8 - 4;
  const barsOn = room && f < T.c6 - 4;
  const labK = room && f >= ROOM0 + 20 ? popIn(f, ROOM0 + 20) : 0;
  // bar heights (illustration): first test → right higher; tested again → equal
  const better = room ? ease(f, T.room3, T.better3 + 12, 0, 1) : 0;
  const equal = room ? ease(f, T.diff5, T.gone5 + 12, 0, 1) : 0;
  const hL = 0.5 + 0.08 * better + 0.12 * equal;
  const hR = 0.5 + 0.2 * better;
  const paperK = s4 ? popIn(f, T.c4 - 4) : 0;
  const againK = s5 ? popIn(f, T.c5 - 4) : 0;
  const stackN = s6 ? Math.round(ease(f, T.review6 - 4, T.fifty6 + 10, 1, 9)) : 0;
  const cardK = s7 ? popIn(f, T.c7 - 4) : 0;
  const dropA = s7 ? ease(f, T.drop7 - 4, T.drop7 + 14, 0, 1) : 0;
  const shrink = s8 ? ease(f, T.effect8 - 6, T.small8 + 6, 0, 1) : 0;

  // --- study, second half: the phone flies through the door ---
  const fly0 = T.put9 + 2;
  const fly1 = T.room9 + 4;
  const door = late ? Math.max(ease(f, T.put9 - 8, T.put9 + 4, 0, 1) - ease(f, fly1 + 2, fly1 + 14, 0, 1), 0) : 0;
  const flying = late && f >= fly0 && f < fly1;
  const gone = late && f >= fly1;
  const phoneOnDesk = !(late && f >= fly0);
  const flyP = flying ? arc(ease(f, fly0, fly1, 0, 1), PHONE_A, DOOR_IN, 260) : PHONE_A;

  // --- Spark ---
  const sx = room ? SX_B : SX_A;
  const sparkKeys = study
    ? gestureKeys([
        [0, G.pointSide],
        [T.c1, G.shrugBig, "smooth"],
        [T.reason1, G.thinkChin, "smooth"],
        [T.c2, G.pointUp, "smooth"],
        [BACK, G.rest, "snap"],
        [T.put9 - 6, G.pointSide, "smooth"],
        [fly1 + 6, G.handsHips, "smooth"],
        [T.c10, G.present, "smooth"],
        [LOOP - 4, G.pointSide, "snap"],
      ])
    : gestureKeys([
        [ROOM0, G.presentBoth],
        [T.c3, G.pointSide, "smooth"],
        [T.better3, G.fistPump, "snap"],
        [T.c4, G.recoil, "smooth"],
        [T.c5, G.armsCrossed, "smooth"],
        [T.gone5, G.shrugBig, "smooth"],
        [T.c6, G.pointSide, "smooth"],
        [T.c7, G.thinkChin, "smooth"],
        [T.small7, G.pointSide, "smooth"],
        [T.c8, G.present, "smooth"],
        [T.small8, G.pointDown, "smooth"],
      ]);
  const facing = (t: number) => {
    if (room) return -1;
    if (late && t >= T.put9 - 6 && t < fly1 + 6) return -1; // points at the door
    return 1;
  };
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "worried";
    if (t < T.c1) return "worried";
    if (t < T.reason1) return "skeptical";
    if (t < T.c2) return "curious";
    if (t < ROOM0) return "curious";
    if (t < T.c3) return "neutral";
    if (t < T.c4) return "excited";
    if (t < T.c5) return "shock";
    if (t < T.gone5) return "skeptical";
    if (t < T.c6) return "mindblown";
    if (t < T.c7) return "curious";
    if (t < T.c8) return "thinking";
    if (t < BACK) return "smug";
    if (t < T.c10) return "determined";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.gone5, 30), bulbPulse(t, T.small8, 30), bulbPulse(t, T.room9, 26));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.smart4, 3));
    q = addPose(q, hop(t, T.gone5, 12));
    q = addPose(q, nod(t, T.small8, 1));
    q = addPose(q, hop(t, fly1 + 2, 10));
    q = addPose(q, nod(t, T.now10, 1));
    return { ...q, x: sx };
  };

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={facing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
  );

  // bars on the test-room board
  const barEl = (x: number, h: number, col: string) => (
    <g>
      <rect x={x - BAR.w / 2} y={BAR.y0} width={BAR.w} height={BAR.y1 - BAR.y0} rx={14} fill={BOARD2} />
      <rect x={x - BAR.w / 2 + 10} y={BAR.y1 - (BAR.y1 - BAR.y0) * h} width={BAR.w - 20} height={(BAR.y1 - BAR.y0) * h - 10} rx={10} fill={col} />
    </g>
  );

  const roomEl = room && (
    <>
      <TestRoom sign={!s6} />
      {/* the board behind the desks */}
      {barsOn && (
        <g>
          <rect x={90} y={BAR.y0 - 70} width={680} height={BAR.y1 - BAR.y0 + 230} rx={20} fill={BOARD} {...K} />
          <Txt x={430} y={BAR.y0 - 22} s={32} c={WHITE}>
            {f >= T.c5 - 4 ? "TESTED AGAIN: SCORE" : "SCORE"}
          </Txt>
          {barEl(DX[0], hL, ORANGE)}
          {barEl(DX[1], hR, f >= T.better3 && equal < 0.5 ? GREEN : ORANGE)}
          {f >= T.gone5 && (
            <g transform={`translate(${(DX[0] + DX[1]) / 2} ${BAR.y0 + 60}) scale(${popIn(f, T.gone5)})`}>
              <rect x={-70} y={-34} width={140} height={60} rx={12} fill={WHITE} {...K} strokeWidth={5} />
              <Txt y={14} s={36}>
                SAME
              </Txt>
            </g>
          )}
          <text x={756} y={BAR.y0 - 22} textAnchor="end" fontFamily={FONT.body} fontWeight={700} fontSize={20} fill="#aab4d4">
            illustration
          </text>
        </g>
      )}
      {/* desk labels */}
      {barsOn &&
        [0, 1].map((i) => (
          <g key={i} transform={`translate(${DX[i]} ${BAR.y1 + 78}) scale(${labK})`}>
            <rect x={-160} y={-52} width={320} height={98} rx={14} fill={i ? PAPER : WHITE} {...K} strokeWidth={5} />
            <Txt y={-10} s={30}>
              {i ? "PHONE IN" : "PHONE ON"}
            </Txt>
            <Txt y={28} s={30}>
              {i ? "OTHER ROOM" : "DESK"}
            </Txt>
          </g>
        ))}
      {/* test-takers behind their desks */}
      {[0, 1].map((i) => (
        <Actor
          key={i}
          f={f}
          color={ORANGE}
          scale={1.25}
          base={{ x: DX[i] - 20, y: GROUND - 92.5 * 1.25 }}
          keys={gestureKeys(i && f >= T.better3 && f < T.c5 ? [[0, WRITE], [T.better3, CHEER, "snap"]] : [[0, WRITE]])}
          mod={(t, p) => addPose(p, idle(t + 7 * i, 3))}
          facing={1}
          face={i && f >= T.better3 && f < T.c5 ? "happy" : "eyes"}
          trails={false}
        />
      ))}
      <TestDesk x={DX[0]} phone />
      <TestDesk x={DX[1]} phone={false} />
      {/* newspaper */}
      {paperK > 0.01 && (
        <g transform={`translate(440 720) scale(${paperK}) rotate(${-4 + wobble(f, T.c4 - 4, 4)})`}>
          <rect x={-330} y={-200} width={660} height={400} rx={10} fill={PAPER} {...K} />
          <Txt y={-140} s={34} c="#777">
            THE NEWS
          </Txt>
          <line x1={-290} y1={-118} x2={290} y2={-118} stroke={INK} strokeWidth={4} />
          <Txt y={-36} s={64}>
            PHONES MAKE
          </Txt>
          <Txt y={42} s={64} c={RED}>
            US LESS SMART
          </Txt>
          {[0, 1, 2].map((r) => (
            <rect key={r} x={-290} y={90 + r * 30} width={r === 2 ? 340 : 580} height={14} rx={7} fill="#d6d0c2" />
          ))}
        </g>
      )}
      {/* tested again card */}
      {false && againK > 0.01 && (
        <g transform={`translate(430 470) scale(${againK})`}>
          <rect x={-200} y={-44} width={400} height={84} rx={16} fill={GOLD} {...K} />
          <Txt y={16} s={46}>
            TESTED AGAIN
          </Txt>
        </g>
      )}
      {/* 56 studies stack */}
      {s6 && (
        <g transform="translate(430 0)">
          <rect x={-230} y={DTOP - 314} width={460} height={22} rx={6} fill={BOARD2} {...K} strokeWidth={5} />
          <rect x={-200} y={DTOP - 292} width={16} height={60} fill={BOARD2} />
          <rect x={184} y={DTOP - 292} width={16} height={60} fill={BOARD2} />
          {Array.from({ length: stackN }, (_, i) => (
            <g key={i} transform={`translate(${(i % 2 ? 8 : -8)} ${DTOP - 330 - i * 34}) rotate(${(i % 3) - 1})`}>
              <rect x={-180} y={-16} width={360} height={32} rx={5} fill={i % 2 ? PAPER : "#f1e8d2"} stroke={INK} strokeWidth={4} />
            </g>
          ))}
          {f >= T.fifty6 - 4 && (
            <g transform={`translate(0 ${DTOP - 330 - stackN * 34 - 80}) scale(${popIn(f, T.fifty6 - 4)})`}>
              <rect x={-190} y={-50} width={380} height={96} rx={16} fill={GOLD} {...K} />
              <Txt y={18} s={54}>
                56 STUDIES
              </Txt>
            </g>
          )}
        </g>
      )}
      {/* short-term memory card */}
      {cardK > 0.01 && (
        <g transform={`translate(430 700) scale(${cardK})`}>
          <rect x={-300} y={-230} width={600} height={430} rx={22} fill={WHITE} {...K} />
          <Txt y={-160} s={46}>
            SHORT-TERM MEMORY
          </Txt>
          {/* thought bubble holding a number */}
          <g transform="translate(-110 -30)">
            <ellipse rx={150} ry={80} fill="#eef3ff" stroke={INK} strokeWidth={5} />
            <Txt y={20} s={56} c="#5b6b9a">
              7 3 9 2
            </Txt>
          </g>
          {/* level gauge with a tiny drop */}
          <g transform="translate(180 -30)">
            <rect x={-46} y={-100} width={92} height={200} rx={14} fill="#e5e9f2" stroke={INK} strokeWidth={5} />
            <rect x={-36} y={-90 + 16 * dropA} width={72} height={180 - 16 * dropA} rx={10} fill={GREEN} />
            {dropA > 0.2 && <path d="M -12 -128 L 12 -128 L 12 -112 L 24 -112 L 0 -90 L -24 -112 L -12 -112 Z" fill={RED} stroke={INK} strokeWidth={3} transform={`translate(80 ${20})`} />}
          </g>
          <Txt y={160} s={50} c={RED}>
            {f >= T.drop7 - 4 ? "SMALL DROP" : ""}
          </Txt>
        </g>
      )}
      {/* the headline shrinks: EFFECT: SMALL */}
      {s8 && (
        <g transform={`translate(${430} ${720 + 20 * shrink}) scale(${(1 - 0.35 * shrink) * popIn(f, T.c8 - 4)}) rotate(-4)`}>
          <rect x={-330} y={-130} width={660} height={260} rx={14} fill={PAPER} {...K} strokeWidth={6 / (1 - 0.35 * shrink)} />
          <Txt y={shrink < 0.5 ? -14 : -10} s={shrink < 0.5 ? 64 : 92}>
            {shrink < 0.5 ? "PHONES MAKE" : "EFFECT:"}
          </Txt>
          <Txt y={shrink < 0.5 ? 66 : 96} s={shrink < 0.5 ? 64 : 110} c={shrink < 0.5 ? RED : GREEN}>
            {shrink < 0.5 ? "US LESS SMART" : "SMALL"}
          </Txt>
        </g>
      )}
      {sparkEl}
    </>
  );

  const studyEl = study && (
    <>
      <Study f={f} door={door} phoneOnDesk={phoneOnDesk} sign={late && f >= T.put9 - 10 ? popIn(f, T.put9 - 10) : 0} />
      {sparkEl}
      {/* YES! bubbles from many people */}
      {[0, 1, 2].map((i) =>
        yesK(i) > 0.01 ? (
          <g key={i} transform={`translate(${150 + i * 170} ${560 - (i % 2) * 70}) scale(${yesK(i)}) rotate(${i % 2 ? 5 : -5})`}>
            <path d="M -76 -40 Q -76 -60 -56 -60 L 56 -60 Q 76 -60 76 -40 L 76 20 Q 76 40 56 40 L -10 40 L -30 66 L -30 40 L -56 40 Q -76 40 -76 20 Z" fill={WHITE} {...K} strokeWidth={5} />
            <Txt y={0} s={44}>
              YES!
            </Txt>
          </g>
        ) : null,
      )}
      {qK > 0.01 && (
        <g transform={`translate(${SX_A + 60} ${HEADY - 250}) scale(${qK}) rotate(${wobble(f, T.reason1 - 4, 8)})`}>
          <circle r={70} fill={GOLD} {...K} />
          <Txt y={36} s={110}>
            ?
          </Txt>
        </g>
      )}
      {/* the phone in flight to the door */}
      {flying && (
        <g transform={`translate(${flyP[0]} ${flyP[1]}) rotate(${-360 * ease(f, fly0, fly1, 0, 1)}) scale(${1 - 0.4 * ease(f, fly0, fly1, 0, 1)})`}>
          <Phone f={f} />
        </g>
      )}
      {gone && f < T.c10 && (
        <g transform={`translate(${DESK.x0 + 150} ${DESK.top - 230}) scale(${popIn(f, fly1 + 4)})`}>
          <rect x={-150} y={-44} width={300} height={84} rx={16} fill={WHITE} {...K} />
          <Txt y={16} s={44} c={GREEN}>
            FOCUS TIME
          </Txt>
        </g>
      )}
    </>
  );

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: room ? ROOMW : WALL }} />}
      cam={cam}
      hits={[]}
      power={4}
      svg={room ? roomEl : studyEl}
      html={
        <>
          {/* frame-0 overlay (≤ 4 words) */}
          {(f < T.c1 - 6 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 108, transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`, opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 6], [1, 0], clamp) }}>
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>PHONE =</div>
              <div style={{ color: RED, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>LESS SMART?</div>
            </div>
          )}
          {yearK > 0.01 && f < ROOM0 && (
            <div style={{ position: "absolute", left: 540, top: 420, transform: `translate(-50%,-50%) scale(${yearK}) rotate(-3deg)`, background: WHITE, border: `6px solid ${INK}`, borderRadius: 22, padding: "10px 40px", fontFamily: FONT.title, fontWeight: 900, fontSize: 96, color: INK }}>
              2017
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1690, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 21, color: INK, whiteSpace: "nowrap", opacity: 0.9, background: "rgba(255,255,255,0.82)", padding: "2px 12px", borderRadius: 8 }}>
                Ward et al. 2017 · replication, Acta Psychologica 2022 · Parry 2024 review (56 studies)
              </div>
              <div style={{ position: "absolute", right: 96, top: 1738, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: room ? "#3b5bab" : "#7a3d12", WebkitTextStroke: `1px ${INK}`, letterSpacing: 2, opacity: 0.95 }}>MYTH CHECK</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["phone", "smart", "yes,", "reason.", "2017,", "memory", "another", "better.", "less", "repeated", "gone.", "fifty-six", "small", "short-term", "effect,", "small.", "desk,", "room.", "now?"]}
          />
          <Transition f={f} at={ROOM0} kind="slice" size={VERTICAL} colors={[GOLD, ROOMW, WALL]} />
        </>
      }
    />
  );
};
