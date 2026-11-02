import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V023 · "Your sticky notes use a glue that failed." (~34 s, promise → build → reveal)
// ONE world, wider than the screen, one camera rig travelling along it:
//  A (x≈0–1250)    a butter-yellow GLUE LAB: a yellow note on the wall peels off by itself (hook), a SCIENTIST
//                  tries to make STRONG GLUE, the test paper slides off the board (WEAK), a lens shows the tiny
//                  sticky balls, a wall calendar flips (YEARS LATER) and the jar gathers a cobweb.
//  door            Spark carries the jar out of the lab.
//  B (x≈1330–2600) a rose CHURCH CHOIR: the CO-WORKER sings, his paper bookmarks keep falling out of his book.
//                  pause + music drop → glue from the jar turns three bookmarks yellow and they stay; one peels off
//                  clean, flies up and grows into a giant STICKY NOTE, small notes pop everywhere (REVEAL),
//                  the big note lands on the jar as KEEP, the question, loop back to the lab wall.
// Sources: Lemelson-MIT (Art Fry & Spencer Silver); HISTORY.com (Post-it Notes debut); MNopedia; NIHF.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const FS = 1.7; // other figures
const FIGY = GROUND - 92.5 * FS;

// palette: butter lab with terracotta tiles · rose church with plum wood
const LAB = "#fff0c9";
const LAB2 = "#f6dfa6";
const TERRA = "#e0754f";
const BENCH = "#b8794b";
const BENCH2 = "#94592f";
const ROSE = "#f7d6cf";
const ROSE2 = "#ecbfb6";
const PLUM = "#7a3e5c";
const WOOD = "#a0653f";
const FLOOR = "#c58c5c";
const FLOOR2 = "#b27a4c";
const NOTE = "#ffe14d";
const NOTE2 = "#f5c912";
const RED = "#e8484f";
const GREEN = "#2fb463";
const WHITE = "#ffffff";
const GREY = "#9aa3b5";
const GLASS = "#d9f0ff";
const GLUE = "#f4ead2";
const INK = COL.ink;

const T = {
  c0: C(0),
  failed0: W(0, 7),
  c1: C(1),
  end1: W(1, 3),
  throw1: W(1, 6),
  idea1: W(1, 9),
  c2: C(2),
  sci2: W(2, 1),
  tried2: W(2, 2),
  strong2: W(2, 6),
  c3: C(3),
  weak3: W(3, 3),
  tiny3: W(3, 6),
  balls3: W(3, 8),
  c4: C(4),
  later4: W(4, 1),
  cow4: W(4, 3),
  sang4: W(4, 4),
  church4: W(4, 7),
  c5: C(5),
  marks5: W(5, 1),
  falling5: W(5, 3),
  book5: W(5, 7),
  e5: E(5),
  c6: C(6),
  put6: W(6, 2),
  weak6: W(6, 4),
  them6: W(6, 7),
  c7: C(7),
  became7: W(7, 1),
  sticky7: W(7, 3),
  today7: W(7, 7),
  c8: C(8),
  keep8: W(8, 1),
  ideas8: W(8, 4),
  c9: C(9),
  again9: W(9, 5),
};
const LOOP = VOICE_FRAMES - 14;

// --- staging (world coordinates; the world is ~2.5 screens wide) ------------------------------------------------------
const SX0 = 320; // Spark at the wall note
const SX1 = 470; // Spark beside the bench
const SXB = 1540; // Spark in the church
const WALK0 = T.cow4 - 6; // walk lab → church
const WALK1 = T.cow4 + 66;
const NOTEW = { x: 590, y: 640, s: 230 }; // the hook note on the lab wall
const BENCH_TOP = 1040;
const JAR0 = { x: 690, y: BENCH_TOP }; // jar on the bench (bottom centre)
const BOARD = { x: 880, y0: 760, y1: BENCH_TOP }; // upright test board
const SCI_X = 1060;
const CAL = { x: 1160, y: 560 };
const DOOR = 1290;
const LECT = { x: 1700, top: 1040 }; // lectern between Spark and the singer
const SING_X = 1980;
const CHOIR = [2140, 2320];
const RISER = 1205;
const BIG = { x: 1790, y: 520 }; // the giant sticky note at the reveal

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 470, 900, 1.2], // frame 0: Spark + the note on the wall
  [T.c1 - 12, T.c1 + 8, 360, 860, 1.5], // CU Spark (promise)
  [T.c2 - 16, T.c2 + 6, 730, 880, 1.04], // MED: the bench and the scientist
  [T.c3 + 4, T.c3 + 22, 790, 840, 1.14], // slow push: the board + the lens
  [WALK0 + 6, WALK0 + 30, 1770, 880, 1.04], // travel through the door into the church
  [T.c5 - 8, T.c5 + 12, 1830, 900, 1.24], // push: the book and the falling bookmarks
  [T.e5 + 2, T.e5 + 24, 1775, 790, 1.08], // reveal framing in the pause (settles before the hit)
  [T.c8 - 8, T.c8 + 12, 1690, 900, 1.16], // MED: KEEP on the jar
  [T.c9 - 12, T.c9 + 8, 1600, 860, 1.4], // CU question
  [LOOP, LOOP, 470, 900, 1.2], // cut back into frame 0
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

const Bubble: React.FC<{ w: number; h: number; fill: string; children: React.ReactNode }> = ({ w, h, fill, children }) => (
  <g>
    <path d={`M ${-30} ${h / 2 - 6} L ${-6} ${h / 2 + 34} L ${30} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={4} />
    {children}
  </g>
);

// a sticky note, (0,0) = centre; curl 0..1 lifts the bottom-left corner; lines = scribble lines
const StickyNote: React.FC<{ s: number; curl?: number; lines?: number; children?: React.ReactNode }> = ({ s, curl = 0, lines = 0, children }) => {
  const h = s / 2;
  const c = curl * s * 0.42;
  return (
    <g>
      <path d={`M ${-h} ${-h} L ${h} ${-h} L ${h} ${h} L ${-h + c} ${h} Q ${-h + c * 0.25} ${h - c * 0.25} ${-h} ${h - c} Z`} fill={NOTE} {...K} strokeWidth={Math.max(3, s / 40)} />
      <rect x={-h} y={-h} width={s} height={s * 0.16} fill={NOTE2} opacity={0.75} />
      {curl > 0.02 && <path d={`M ${-h} ${h - c} Q ${-h + c * 0.15} ${h - c * 0.15} ${-h + c} ${h} L ${-h + c * 0.75} ${h - c * 0.75} Z`} fill={NOTE2} stroke={INK} strokeWidth={Math.max(3, s / 40)} strokeLinejoin="round" />}
      {Array.from({ length: lines }, (_, i) => (
        <line key={i} x1={-h * 0.62} y1={-h * 0.25 + i * s * 0.18} x2={h * (0.55 - (i % 2) * 0.25)} y2={-h * 0.25 + i * s * 0.18} stroke={INK} strokeWidth={Math.max(3, s / 45)} strokeLinecap="round" opacity={0.55} />
      ))}
      {children}
    </g>
  );
};

// glue jar, (0,0) = bottom centre; dust 0..1, web 0..1 (cobweb drawn on), keep 0..1 (KEEP note on the front)
const Jar: React.FC<{ strike?: number; dust?: number; web?: number; tilt?: number }> = ({ strike = 0, dust = 0, web = 0, tilt = 0 }) => (
  <g transform={`rotate(${tilt} 0 -60)`}>
    <rect x={-52} y={-150} width={104} height={150} rx={18} fill={GLASS} {...K} strokeWidth={6} />
    <rect x={-46} y={-92} width={92} height={88} rx={12} fill={GLUE} />
    {[[-24, -40], [6, -60], [26, -30], [-8, -22], [20, -74], [-30, -70]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={7} fill={WHITE} stroke="#d8c9a6" strokeWidth={2} />
    ))}
    <rect x={-58} y={-172} width={116} height={30} rx={8} fill={TERRA} {...K} strokeWidth={6} />
    <rect x={-48} y={-138} width={96} height={42} rx={6} fill={WHITE} stroke={INK} strokeWidth={4} />
    <Txt y={-109} s={strike > 0.5 ? 22 : 24} w={900}>
      {strike > 0.5 ? "WEAK GLUE" : "GLUE"}
    </Txt>
    {dust > 0.01 && <rect x={-52} y={-172} width={104} height={172} rx={18} fill="#8f8a7a" opacity={0.28 * dust} />}
    {web > 0.01 && (
      <g stroke="#6f6a60" strokeWidth={2.5} fill="none" opacity={0.85}>
        <path d={`M 58 -172 L ${58 - 70 * web} -172`} />
        <path d={`M 58 -172 L 58 ${-172 + 70 * web}`} />
        <path d={`M 58 -172 L ${58 - 52 * web} ${-172 + 52 * web}`} />
        {web > 0.5 && <path d="M 30 -172 Q 40 -158 58 -146 M 12 -172 Q 30 -146 58 -128" />}
      </g>
    )}
  </g>
);

// an open song book, (0,0) = spine bottom; tabs: [x offset, height, colour]
const Book: React.FC<{ tabs: [number, number, string][] }> = ({ tabs }) => (
  <g>
    {tabs.map(([x, h, c], i) => (
      <rect key={i} x={x - 9} y={-118 - h} width={18} height={h + 10} rx={3} fill={c} stroke={INK} strokeWidth={3} />
    ))}
    <path d="M 0 -6 L -92 -18 L -92 -122 L 0 -110 Z" fill={WHITE} {...K} strokeWidth={5} />
    <path d="M 0 -6 L 92 -18 L 92 -122 L 0 -110 Z" fill={WHITE} {...K} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i} stroke={INK} strokeWidth={3} opacity={0.4}>
        <line x1={-78} y1={-96 + i * 20} x2={-14} y2={-88 + i * 20} />
        <line x1={14} y1={-88 + i * 20} x2={78} y2={-96 + i * 20} />
      </g>
    ))}
    <path d="M -98 -14 L 0 0 L 98 -14" fill="none" stroke={PLUM} strokeWidth={10} strokeLinecap="round" />
  </g>
);

// the lab (A), the door, the church (B)
const World: React.FC<{ f: number; calPage: number; calK: number }> = ({ f, calPage, calK }) => (
  <g>
    {/* ----- lab wall: butter tiles + terracotta stripe ----- */}
    <rect x={-700} y={-700} width={DOOR + 700} height={1990} fill={LAB} />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={`v${i}`} x1={-600 + i * 160} y1={860} x2={-600 + i * 160} y2={1150} stroke={LAB2} strokeWidth={5} />
    ))}
    {Array.from({ length: 4 }, (_, i) => (
      <line key={`h${i}`} x1={-700} y1={880 + i * 80} x2={DOOR} y2={880 + i * 80} stroke={LAB2} strokeWidth={5} />
    ))}
    <rect x={-700} y={846} width={DOOR + 700} height={22} fill={TERRA} opacity={0.9} />
    {/* high shelf with flasks */}
    <rect x={40} y={460} width={300} height={18} rx={6} fill={BENCH} {...K} strokeWidth={5} />
    {[90, 170, 260].map((x, i) => (
      <g key={x} transform={`translate(${x} 460)`}>
        <path d={`M -14 -80 L 14 -80 L 14 -50 L ${30 + i * 4} -6 Q ${30 + i * 4} 0 ${24 + i * 4} 0 L ${-24 - i * 4} 0 Q ${-30 - i * 4} 0 ${-30 - i * 4} -6 L -14 -50 Z`} fill={GLASS} {...K} strokeWidth={5} />
        <path d={`M ${-26 - i * 4} -14 L ${26 + i * 4} -14 L ${24 + i * 4} -2 L ${-24 - i * 4} -2 Z`} fill={[TERRA, GREEN, "#7d8bf0"][i]} opacity={0.8} />
      </g>
    ))}
    {/* wall calendar (YEARS LATER) */}
    <g transform={`translate(${CAL.x} ${CAL.y})`}>
      <rect x={-90} y={-100} width={180} height={190} rx={10} fill={WHITE} {...K} strokeWidth={6} />
      <rect x={-90} y={-100} width={180} height={46} rx={10} fill={TERRA} {...K} strokeWidth={6} />
      <circle cx={-46} cy={-100} r={8} fill={INK} />
      <circle cx={46} cy={-100} r={8} fill={INK} />
      {calK < 0.5 ? (
        <g opacity={0.5}>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-70 + (i % 4) * 38} y={-36 + Math.floor(i / 4) * 38} width={26} height={24} rx={4} fill={LAB2} />
          ))}
        </g>
      ) : (
        <g>
          <Txt y={6} s={36}>
            YEARS
          </Txt>
          <Txt y={50} s={36}>
            LATER
          </Txt>
        </g>
      )}
      {calPage > 0.01 && calPage < 0.99 && (
        <path d={`M -90 -54 L 90 -54 L 90 ${-54 + 144 * (1 - calPage)} L -90 ${-54 + 144 * (1 - calPage)} Z`} fill="#f7f2e6" stroke={INK} strokeWidth={4} />
      )}
    </g>
    {/* ----- door frame between the two places ----- */}
    <rect x={DOOR - 10} y={-700} width={70} height={1990} fill={PLUM} />
    <rect x={DOOR + 60} y={-700} width={10} height={1990} fill={INK} opacity={0.25} />
    {/* ----- church wall: rose + plum wood panels ----- */}
    <rect x={DOOR + 60} y={-700} width={2400} height={1990} fill={ROSE} />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={DOOR + 120 + i * 190} y={900} width={150} height={220} rx={10} fill={ROSE2} stroke={PLUM} strokeWidth={4} opacity={0.8} />
    ))}
    <rect x={DOOR + 60} y={872} width={2400} height={20} fill={PLUM} />
    {/* tall arched windows with simple coloured panes */}
    {[1560, 2060, 2520].map((x, wi) => (
      <g key={x} transform={`translate(${x} 160)`}>
        <path d="M -110 560 L -110 120 A 110 110 0 0 1 110 120 L 110 560 Z" fill="#bfe3ff" stroke={PLUM} strokeWidth={10} />
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => (
            <rect key={`${r}${c}`} x={-96 + c * 98} y={140 + r * 104} width={94} height={100} fill={[NOTE, "#8fd0ff", "#ff9e8a", "#b6e39a"][(r + c + wi) % 4]} opacity={0.55} />
          )),
        )}
        <line x1={0} y1={20} x2={0} y2={560} stroke={PLUM} strokeWidth={8} />
        <line x1={-110} y1={340} x2={110} y2={340} stroke={PLUM} strokeWidth={8} />
        <rect x={-126} y={556} width={252} height={20} rx={6} fill={WOOD} {...K} strokeWidth={5} />
        <rect x={-30 + 6 * Math.sin(f / 40 + wi)} y={70} width={60} height={14} rx={7} fill={WHITE} opacity={0.4} />
      </g>
    ))}
    {/* choir riser */}
    <rect x={2030} y={RISER} width={600} height={90} fill={WOOD} {...K} strokeWidth={6} />
    {/* ----- floor (tiles in the lab, boards in the church) ----- */}
    <rect x={-700} y={GROUND} width={DOOR + 700} height={1200} fill="#d9a46f" />
    {Array.from({ length: 14 }, (_, i) => (
      <line key={i} x1={-700 + i * 150} y1={GROUND} x2={-700 + i * 150} y2={2500} stroke="#c48d58" strokeWidth={5} />
    ))}
    <rect x={DOOR - 10} y={GROUND} width={2600} height={1200} fill={FLOOR} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={DOOR} y1={GROUND + 40 + i * 70 + i * i * 6} x2={4000} y2={GROUND + 40 + i * 70 + i * i * 6} stroke={FLOOR2} strokeWidth={5} />
    ))}
    <rect x={-700} y={GROUND - 4} width={4800} height={10} fill={INK} opacity={0.35} />
  </g>
);

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "swish", 0.1],
  [T.failed0 - 8, "swish", 0.16],
  [T.failed0 + 22, "thud", 0.14],
  [T.c1 - 2, "pop", 0.14],
  [T.end1, "whoosh", 0.12],
  [T.c2 - 10, "whoosh", 0.12],
  [T.tried2, "thud", 0.18],
  [T.strong2 - 2, "pop", 0.18],
  [T.weak3 - 2, "swish", 0.16],
  [T.weak3 + 20, "thud", 0.12],
  [T.weak3 + 2, "boing", 0.14],
  [T.tiny3 - 3, "pop", 0.18],
  [T.balls3 - 2, "ding", 0.16],
  [T.c4 - 2, "page", 0.22],
  [T.c4 + 8, "page", 0.16],
  [T.later4 + 6, "scribble", 0.1],
  [WALK0 + 6, "whoosh_long", 0.14],
  [T.sang4, "ding", 0.1],
  [T.marks5 + 2, "swish", 0.14],
  [T.falling5 + 2, "swish", 0.14],
  [T.book5 + 2, "swish", 0.14],
  [T.book5 + 20, "boing", 0.1],
  [T.e5 + 2, "whoosh_long", 0.1],
  [T.c6 - 2, "stinger", 0.16],
  [T.weak6, "pop", 0.16],
  [T.weak6 + 9, "pop", 0.16],
  [T.weak6 + 18, "pop", 0.16],
  [T.became7 - 2, "swish", 0.16],
  [T.sticky7 - 2, "impact", 0.2],
  [T.sticky7 + 2, "gold", 0.16],
  [T.today7 - 2, "pop", 0.14],
  [T.today7 + 6, "pop", 0.12],
  [T.today7 + 12, "pop", 0.12],
  [T.c8 + 2, "whoosh", 0.14],
  [T.keep8 + 2, "stamp", 0.2],
  [T.c9 - 2, "pop", 0.18],
  [LOOP, "whoosh", 0.12],
].map((c) => c as SfxCue);

export const S01Glue: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const cam = camAtRig(f);

  // ---------------- hook: the note on the lab wall peels off by itself ----------------
  const PEEL0 = T.failed0 - 34;
  const DROP = T.failed0 - 6;
  const LANDF = DROP + 24;
  const curl = loopBack ? interpolate(f - LOOP, [0, 12], [0, 0.35], clamp) : interpolate(f, [0, PEEL0, DROP], [0.2, 0.35, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const notePos = (() => {
    if (loopBack || f < DROP) return { x: NOTEW.x, y: NOTEW.y, r: 0, sx: 1, sy: 1 };
    const k = interpolate(f, [DROP, LANDF], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const [x, y] = arc(k, [NOTEW.x, NOTEW.y], [NOTEW.x + 60, GROUND - 8], 60);
    const [sx, sy] = squash(f, LANDF, 0.2);
    return { x: x + 26 * Math.sin(k * 7), y: k >= 1 ? GROUND + 10 : y, r: k >= 1 ? -4 : 40 * Math.sin(k * 5) + wobble(f, LANDF, 6), sx, sy: k >= 1 ? sy * 0.22 : sy };
  })();

  // ---------------- lab: the test board, the paper, the lens ----------------
  const paperOn = f >= T.tried2 - 4;
  const paperSlap = squash(f, T.tried2, 0.22);
  const paperFall = interpolate(f, [T.weak3 - 6, T.weak3 + 20], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const strongK = f >= T.strong2 - 2 && f < WALK0 ? popIn(f, T.strong2 - 2) : 0;
  const strike = loopBack ? 0 : interpolate(f, [T.weak3 - 2, T.weak3 + 6], [0, 1], clamp);
  const weakK = f >= T.weak3 && f < WALK0 ? popIn(f, T.weak3) : 0;
  const lensOut = 1 - ease(f, T.c4 - 8, T.c4 + 2, 0, 1);
  const lensK = !loopBack && f >= T.tiny3 - 4 && f < T.c4 + 2 ? popIn(f, T.tiny3 - 4) * lensOut : 0;
  const ballsTagK = !loopBack && f >= T.balls3 - 4 && f < T.c4 + 2 ? popIn(f, T.balls3 - 4) * lensOut : 0;
  const calPage = loopBack ? 0 : interpolate(f, [T.c4 - 2, T.c4 + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const calK = loopBack ? 0 : f >= T.c4 + 6 ? 1 : 0;
  const dust = loopBack ? 0 : interpolate(f, [T.c4, T.later4 + 14], [0, 1], clamp);
  const web = loopBack ? 0 : interpolate(f, [T.later4 + 4, T.later4 + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  // ---------------- Spark position + the jar ----------------
  const sparkX = (t: number) => {
    if (t >= LOOP - 2) return SX0;
    if (t < WALK0) return ease(t, T.c2 - 8, T.c2 + 22, SX0, SX1);
    return ease(t, WALK0, WALK1, SX1, SXB);
  };
  let GRAB = WALK0;
  for (let t = WALK0; t < WALK1; t++) {
    if (sparkX(t) >= JAR0.x - 60) {
      GRAB = t;
      break;
    }
  }
  const PUT = WALK1 + 4; // jar set down on the lectern
  const jarState: "bench" | "hand" | "lectern" = loopBack || f < GRAB ? "bench" : f < PUT ? "hand" : "lectern";

  // ---------------- church: singing, falling bookmarks, glue, reveal ----------------
  const singing = (t: number) => t >= T.sang4 - 4 && t < T.c6 - 6;
  const FALLS = [T.marks5 + 2, T.falling5 + 2, T.book5 + 2];
  const STICKS = [T.weak6 + 4, T.weak6 + 13, T.weak6 + 22];
  const PULL = T.became7 - 4; // one yellow bookmark peels off clean
  const BIGAT = T.sticky7 - 4; // it grows into the giant sticky note
  const bigOut = T.c8 + 2; // flies down onto the jar
  const KEEPAT = T.keep8;
  const minis: [number, number, number, number][] = [
    // x, y, size, rotation
    [1480, 760, 92, -8],
    [2110, 760, 96, 6],
    [1430, 1000, 84, 5],
    [2240, 1010, 90, -6],
    [1590, 300, 80, 10],
    [2010, 300, 86, -10],
    [2235, 560, 88, 7],
    [1700, 230, 78, 4],
    [2180, 1180, 80, -4],
    [1345, 560, 80, -5],
  ];
  const revealOn = !loopBack && f >= BIGAT - 2;
  const bigK = revealOn && f < KEEPAT + 4 ? popIn(f, BIGAT) : 0;
  const bigFly = interpolate(f, [bigOut, KEEPAT], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const miniOut = 1 - ease(f, T.c8 - 6, T.c8 + 8, 0, 1);
  const keepK = !loopBack && f >= KEEPAT ? 1 : 0;
  const askK = !loopBack && f >= T.c9 - 4 ? popIn(f, T.c9 - 4) : 0;

  // --- Spark ---
  const carry = { ra1: 62, ra2: 58, la1: -16, la2: 10 };
  const sparkKeys = gestureKeys([
    [0, { ra1: 118, ra2: 18, la1: -16, la2: 10, head: -6 }], // fingers on the note's corner
    [T.failed0 - 8, G.recoil, "snap"],
    [T.failed0 + 8, G.shrugBig, "smooth"],
    [T.c1, G.stop, "snap"],
    [T.end1, G.pointSide, "smooth"],
    [T.idea1, G.handsHips, "smooth"],
    [T.c2 - 8, G.rest, "smooth"],
    [T.c2 + 22, G.present, "smooth"],
    [T.strong2, G.fistPump, "smooth"],
    [T.weak3 - 6, G.recoil, "snap"],
    [T.weak3 + 4, G.facepalm, "smooth"],
    [T.tiny3 - 4, G.pointUp, "snap"],
    [T.balls3, G.doublePoint, "smooth"],
    [T.c4, G.thinkChin, "smooth"],
    [WALK0 - 4, G.rest, "smooth"],
    [GRAB, carry, "smooth"],
    [T.sang4 + 4, carry, "smooth"],
    [PUT - 4, G.present, "smooth"],
    [T.marks5, G.pointSide, "smooth"],
    [T.book5 - 4, G.facepalm, "snap"],
    [T.e5 + 6, G.thinkChin, "smooth"],
    [T.c6, G.doublePoint, "snap"],
    [T.them6 + 2, G.fistPump, "smooth"],
    [T.became7, G.recoil, "smooth"], // anticipation before the big reaction
    [T.sticky7 - 2, G.mindBlown, "snap"],
    [T.today7 + 10, G.celebrate, "smooth"],
    [T.c8, G.pointDown, "smooth"],
    [T.ideas8, G.present, "smooth"],
    [T.c9, G.beckon, "smooth"],
    [T.again9, G.doublePoint, "smooth"],
    [LOOP - 4, { ra1: 118, ra2: 18, la1: -16, la2: 10, head: -6 }, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "curious";
    if (t < T.failed0 - 8) return "curious";
    if (t < T.c1) return "shock";
    if (t < T.end1) return "determined";
    if (t < T.c2) return "wink";
    if (t < T.strong2) return "thinking";
    if (t < T.weak3 - 6) return "excited";
    if (t < T.tiny3 - 4) return "sad";
    if (t < T.c4) return "curious";
    if (t < WALK0) return "thinking";
    if (t < T.sang4) return "determined";
    if (t < T.marks5) return "happy";
    if (t < T.book5 - 4) return "worried";
    if (t < T.e5 + 6) return "skeptical";
    if (t < T.c6) return "thinking";
    if (t < T.became7) return "excited";
    if (t < T.sticky7 - 2) return "shock";
    if (t < T.c8) return "mindblown";
    if (t < T.c9) return "happy";
    if (t < T.again9) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.sticky7 - 2, 70), bulbPulse(t, T.e5 + 14, 14) * 0.6);
  const walking = (t: number) => t < LOOP - 2 && ((t >= WALK0 && t < WALK1) || (t >= T.c2 - 8 && t < T.c2 + 22));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (walking(t)) q = addPose(q, walkCycle(t - WALK0, 0.3));
    q = addPose(q, hop(t, T.failed0 - 6, 14));
    q = addPose(q, hop(t, T.sticky7, 26));
    q = addPose(q, nod(t, T.sang4 + 10, 2));
    q = addPose(q, shake(t, T.weak3 + 6, 2));
    return { ...q, x: sparkX(t) };
  };

  const jarTilt = wobble(f, PUT, 8) + (jarState === "hand" ? -6 : 0) + wobble(f, KEEPAT, 6);
  const keepNote = keepK > 0 && (
    <g transform={`translate(0 -84) scale(${squash(f, KEEPAT, 0.25)[0]} ${squash(f, KEEPAT, 0.25)[1]}) rotate(${-6 + wobble(f, KEEPAT, 6)})`}>
      <StickyNote s={96}>
        <Txt y={14} s={34}>
          KEEP
        </Txt>
      </StickyNote>
    </g>
  );
  const jarEl = (x: number, y: number, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Jar strike={strike} dust={dust} web={web} tilt={jarTilt} />
      {keepNote}
    </g>
  );

  const sparkEl = (
    <Spark f={f} trails={false} scale={SS} base={{ x: SX0, y: STANDY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) => (jarState === "hand" ? jarEl(j.rHand[0] + 8, j.rHand[1] + 70, 0.82) : null)}
    </Spark>
  );

  // the singer (CO-WORKER) holding the open book, facing Spark
  const holdBook = { ra1: 42, ra2: 88, la1: -42, la2: -88, head: -6 };
  const reach = { ra1: 95, ra2: 20, la1: -70, la2: -70, head: 6, lean: 6 };
  const singKeys = gestureKeys([
    [0, holdBook],
    [T.book5 - 2, { ...holdBook, head: 14 }, "snap"],
    [T.e5 + 4, holdBook, "smooth"],
    [T.put6 - 2, reach, "smooth"],
    [T.them6, holdBook, "smooth"],
    [PULL, { ...holdBook, ra1: 150, ra2: 20 }, "snap"],
    [T.sticky7 + 10, { ...holdBook, la1: -150, la2: -20, ra1: 150, ra2: 20 }, "smooth"],
    [T.c8 + 4, holdBook, "smooth"],
  ]);
  const singMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t + 11, 3));
    if (singing(t)) q = addPose(q, { head: 6 * Math.sin(t * 0.18) });
    q = addPose(q, hop(t, T.sticky7 + 6, 18));
    return q;
  };
  const bookTabs = (bx: number): [number, number, string][] => {
    const tabs: [number, number, string][] = [];
    if (f < T.marks5 && !loopBack) {
      [-40, 0, 40].forEach((x) => tabs.push([x, 40, WHITE]));
    } else if (f < T.marks5 + 2) {
      [-40, 0, 40].forEach((x) => tabs.push([x, 40, WHITE]));
    } else {
      FALLS.forEach((at, i) => {
        if (f < at) tabs.push([[-40, 0, 40][i], 40, WHITE]);
      });
    }
    STICKS.forEach((at, i) => {
      if (f >= at + 1 && !(i === 1 && f >= PULL + 2)) {
        const [, sy] = squash(f, at + 1, 0.3);
        tabs.push([[-46, 6, 50][i], 44 * sy, NOTE]);
      }
    });
    void bx;
    return tabs;
  };

  const singer = (
    <Actor f={f} color={COL.orange} scale={FS} base={{ x: SING_X, y: FIGY }} keys={singKeys} mod={singMod} facing={-1} face="happy" label="CO-WORKER" trails={false}>
      {(j) => {
        const bx = (j.lHand[0] + j.rHand[0]) / 2;
        const by = j.neck[1] + 172;
        return (
          <g transform={`translate(${bx} ${by}) scale(1.05)`}>
            <Book tabs={bookTabs(bx)} />
          </g>
        );
      }}
    </Actor>
  );

  // book position (approximate, for falling bookmarks / flying glue): fixed point in front of the singer
  const BOOK = { x: SING_X - 40, y: 1160 };

  const svg = (
    <>
      <World f={f} calPage={calPage} calK={calK} />

      {/* ---------- lab: the hook note on the wall ---------- */}
      <g transform={`translate(${notePos.x} ${notePos.y}) rotate(${notePos.r}) scale(${notePos.sx} ${notePos.sy})`}>
        <StickyNote s={NOTEW.s} curl={curl} lines={3} />
      </g>

      {/* ---------- lab: scientist + bench ---------- */}
      <Actor
        f={f}
        color={COL.blue}
        scale={FS}
        base={{ x: SCI_X, y: FIGY }}
        keys={gestureKeys([
          [0, { ra1: 30, ra2: 40, la1: -40, la2: -60 }],
          [T.tried2 - 6, { ra1: 70, ra2: 10, la1: -95, la2: -10, lean: 8 }, "snap"],
          [T.strong2, G.fistPump, "smooth"],
          [T.weak3 - 2, G.recoil, "snap"],
          [T.weak3 + 10, G.shrugBig, "smooth"],
          [T.c4, G.rest, "smooth"],
        ])}
        mod={(t, p) => addPose(addPose(p, idle(t + 5, 4)), shake(t, T.weak3 + 12, 2))}
        facing={-1}
        face={f >= T.weak3 && f < WALK0 ? "sad" : "happy"}
        label="SCIENTIST"
        trails={false}
      />
      {/* test board */}
      <rect x={BOARD.x - 80} y={BOARD.y0} width={160} height={BOARD.y1 - BOARD.y0} rx={8} fill="#d9a46f" {...K} strokeWidth={6} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={BOARD.x - 60} y1={BOARD.y0 + 50 + i * 80} x2={BOARD.x + 60} y2={BOARD.y0 + 60 + i * 80} stroke="#b9824f" strokeWidth={4} />
      ))}
      {paperOn && !loopBack && (
        <g
          transform={`translate(${BOARD.x + paperFall * -150} ${BOARD.y0 + 120 + paperFall * (GROUND - BOARD.y0 - 130) - 4 * 60 * paperFall * (1 - paperFall)}) rotate(${paperFall >= 1 ? 3 : Math.sin(paperFall * 9) * 25}) scale(${paperSlap[0]} ${paperSlap[1] * (paperFall >= 1 ? 0.22 : 1)})`}
        >
          <rect x={-60} y={-80} width={120} height={160} fill={WHITE} {...K} strokeWidth={5} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-40} y1={-50 + i * 32} x2={40} y2={-50 + i * 32} stroke={INK} strokeWidth={3} opacity={0.35} />
          ))}
        </g>
      )}
      {/* bench */}
      <rect x={540} y={BENCH_TOP} width={600} height={34} rx={8} fill={BENCH} {...K} strokeWidth={6} />
      {[580, 1100].map((x) => (
        <rect key={x} x={x - 16} y={BENCH_TOP + 34} width={32} height={GROUND - BENCH_TOP - 34} fill={BENCH2} {...K} strokeWidth={5} />
      ))}
      {/* beaker + pot on the bench */}
      <g transform={`translate(1000 ${BENCH_TOP})`}>
        <path d="M -40 0 L -46 -90 L 46 -90 L 40 0 Z" fill={GLASS} {...K} strokeWidth={5} />
        <path d="M -42 -40 L 42 -40 L 40 0 L -40 0 Z" fill={GLUE} />
      </g>
      {jarState === "bench" && jarEl(JAR0.x, JAR0.y)}
      {strongK > 0.01 && (
        <g transform={`translate(${JAR0.x} ${JAR0.y - 240}) scale(${strongK}) rotate(${-4 + wobble(f, T.strong2 - 2, 6)})`}>
          <Tag text="STRONG GLUE?" fill={GREEN} w={320} s={38} />
          {strike > 0.01 && <line x1={-140} y1={0} x2={-140 + 280 * strike} y2={0} stroke={RED} strokeWidth={10} strokeLinecap="round" />}
        </g>
      )}
      {weakK > 0.01 && (
        <g transform={`translate(${JAR0.x + 40} ${JAR0.y - 320}) scale(${weakK}) rotate(${5 + wobble(f, T.weak3, 8)})`}>
          <Tag text="WEAK" fill={RED} w={170} s={42} />
        </g>
      )}

      {/* ---------- church: lectern, choir, singer ---------- */}
      {CHOIR.map((x, i) => (
        <Actor
          key={x}
          f={f}
          color={GREY}
          scale={1.5}
          base={{ x, y: RISER - 92.5 * 1.5 }}
          keys={[{ f: 0, p: { ra1: 60, ra2: 70, la1: -60, la2: -70 } }]}
          mod={(t, p) => {
            let q = addPose(p, idle(t + 7 * (i + 1), 3));
            if (singing(t)) q = addPose(q, { head: 5 * Math.sin(t * 0.16 + i) });
            q = addPose(q, hop(t, T.today7 + 4 * i, 14));
            return q;
          }}
          facing={-1}
          face="happy"
          trails={false}
        />
      ))}
      {singer}
      {/* lectern */}
      <g transform={`translate(${LECT.x} 0)`}>
        <path d={`M -70 ${LECT.top} L 70 ${LECT.top - 24} L 70 ${LECT.top + 16} L -70 ${LECT.top + 40} Z`} fill={WOOD} {...K} strokeWidth={6} />
        <rect x={-16} y={LECT.top + 30} width={32} height={GROUND - LECT.top - 30} fill={PLUM} {...K} strokeWidth={5} />
        <rect x={-60} y={GROUND - 18} width={120} height={20} rx={6} fill={PLUM} {...K} strokeWidth={5} />
      </g>
      {jarState === "lectern" && jarEl(LECT.x, LECT.top - 6 + 0)}
      {/* music notes while they sing */}
      {Array.from({ length: 9 }, (_, i) => {
        const t0 = T.sang4 + i * 16;
        const d = f - t0;
        if (d < 0 || d > 46 || f >= T.c6 - 6 || loopBack) return null;
        const src = [SING_X - 10, CHOIR[0], CHOIR[1]][i % 3];
        const y0 = i % 3 === 0 ? 820 : 760;
        return (
          <g key={i} transform={`translate(${src - 30 - d * 1.4 + 10 * Math.sin(d / 6)} ${y0 - d * 3.2})`} opacity={interpolate(d, [0, 6, 34, 46], [0, 1, 1, 0])}>
            <Txt y={0} s={58} c={PLUM} font={FONT.body}>
              ♪
            </Txt>
          </g>
        );
      })}
      {/* falling paper bookmarks (they stay on the floor until the reveal clears) */}
      {FALLS.map((at, i) => {
        if (f < at || loopBack) return null;
        const k = interpolate(f, [at, at + 26], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const [x, y] = arc(k, [BOOK.x + [-36, 0, 40][i], BOOK.y - 30], [BOOK.x - 110 + i * 60, GROUND - 6], -30);
        const flat = k >= 1;
        return (
          <g key={i} transform={`translate(${x + (flat ? 0 : 22 * Math.sin(k * 8 + i))} ${y}) rotate(${flat ? 88 + i * 4 : k * 200 + i * 30})`}>
            <rect x={-9} y={-34} width={18} height={68} rx={3} fill={WHITE} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
      {/* glue → three yellow bookmarks arc from the jar into the book */}
      {STICKS.map((at, i) => {
        const t0 = at - 12;
        if (f < t0 || f >= at + 1 || loopBack) return null;
        const k = interpolate(f, [t0, at], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
        const [x, y] = arc(k, [LECT.x, LECT.top - 170], [BOOK.x + [-42, 6, 46][i], BOOK.y - 110], 90);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(1 - k) * 60}) scale(${1.7 - 0.7 * k})`}>
            <rect x={-9} y={-28} width={18} height={56} rx={3} fill={NOTE} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}

      {sparkEl}

      {/* ---------- lens: tiny sticky balls ---------- */}
      {lensK > 0.01 && (
        <g>
          <line x1={BOARD.x - 10} y1={BOARD.y0 + 140} x2={BOARD.x - 130} y2={640} stroke={INK} strokeWidth={5} strokeDasharray="12 10" opacity={Math.min(1, lensK)} />
          <g transform={`translate(${BOARD.x - 160} 560) scale(${lensK})`}>
            <circle r={170} fill={WHITE} {...K} strokeWidth={8} />
            <clipPath id="lens">
              <circle r={164} />
            </clipPath>
            <g clipPath="url(#lens)">
              {/* board (wood), glue balls, paper resting on their tops */}
              <rect x={-180} y={40} width={360} height={140} fill="#d9a46f" />
              <line x1={-180} y1={40} x2={180} y2={40} stroke={INK} strokeWidth={5} />
              {Array.from({ length: 7 }, (_, i) => (
                <g key={i} transform={`translate(${-135 + i * 45} ${40 - 20})`}>
                  <circle r={20} fill={GLUE} stroke={INK} strokeWidth={4} />
                  <circle cx={-6} cy={-7} r={5} fill={WHITE} />
                </g>
              ))}
              <g transform={`translate(${interpolate(f, [T.balls3, T.balls3 + 30], [0, -10], clamp)} ${-4 - 8 * Math.max(0, Math.sin((f - T.balls3) / 9))})`}>
                <rect x={-180} y={-34} width={360} height={30} fill={WHITE} stroke={INK} strokeWidth={5} />
              </g>
              {Array.from({ length: 7 }, (_, i) => (
                <circle key={i} cx={-135 + i * 45} cy={-2} r={5} fill={RED} opacity={interpolate(f, [T.balls3 - 4, T.balls3 + 4], [0, 1], clamp)} />
              ))}
            </g>
            <rect x={-30} y={168} width={60} height={110} rx={20} fill={PLUM} {...K} strokeWidth={6} transform="rotate(-20)" />
          </g>
          {ballsTagK > 0.01 && (
            <g transform={`translate(${BOARD.x - 160} 330) scale(${ballsTagK}) rotate(${-3 + wobble(f, T.balls3 - 4, 6)})`}>
              <Tag text="TINY STICKY BALLS" fill={TERRA} w={420} s={38} />
            </g>
          )}
        </g>
      )}

      {/* ---------- REVEAL: one bookmark peels off clean and becomes the sticky note ---------- */}
      {revealOn && f < BIGAT && (
        <g
          transform={(() => {
            const k = interpolate(f, [PULL, BIGAT], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            const [x, y] = arc(k, [BOOK.x + 6, BOOK.y - 150], [BIG.x, BIG.y], 120);
            return `translate(${x} ${y}) rotate(${k * 360})`;
          })()}
        >
          <rect x={-10} y={-30} width={20} height={60} rx={3} fill={NOTE} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {revealOn &&
        minis.map(([x, y, s, r], i) => {
          const at = T.today7 - 4 + i * 3;
          if (f < at) return null;
          const k = popIn(f, at) * miniOut;
          if (k < 0.01) return null;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r + wobble(f, at, 8)}) scale(${k})`}>
              <StickyNote s={s} lines={2} />
            </g>
          );
        })}
      {bigK > 0.01 && (
        <g
          transform={(() => {
            const [x, y] = arc(bigFly, [BIG.x, BIG.y], [LECT.x, LECT.top - 90], -40);
            const s = interpolate(bigFly, [0, 1], [1, 0.25]);
            return `translate(${x} ${y}) scale(${bigK * s}) rotate(${-4 + wobble(f, BIGAT, 6) + bigFly * 8})`;
          })()}
        >
          <StickyNote s={440}>
            <Txt y={-20} s={70}>
              STICKY
            </Txt>
            <Txt y={60} s={70}>
              NOTE
            </Txt>
          </StickyNote>
        </g>
      )}

      {askK > 0.01 && (
        <g transform={`translate(${SXB + 10} 640) scale(${askK}) rotate(${wobble(f, T.c9 - 4, 6)})`}>
          <Bubble w={400} h={140} fill={WHITE}>
            <Txt y={-8} s={50}>
              WHICH ONE
            </Txt>
            <Txt y={46} s={50}>
              COULD YOU USE?
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
            fontSize: 120,
            color: NOTE,
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          THIS GLUE FAILED.
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
            {f < WALK0 ? "Spencer Silver, 3M, 1968 · Lemelson-MIT · HISTORY.com" : "Art Fry, 3M · choir bookmarks · sold in US stores from 1980 (HISTORY.com, NIHF)"}
          </div>
          <div
            style={{
              position: "absolute",
              right: 96,
              top: 1745,
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 27,
              color: NOTE,
              WebkitTextStroke: `1px ${INK}`,
              letterSpacing: 2,
              opacity: 0.95,
              background: "rgba(20,20,40,0.55)",
              padding: "2px 10px",
              borderRadius: 8,
            }}
          >
            HOW IT STARTED
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1570}
        cues={VOICE_CUES}
        hi={["sticky", "notes", "glue", "failed", "end", "idea", "scientist", "strong", "weak", "tiny", "balls", "years", "later", "co-worker", "choir", "bookmarks", "falling", "note", "today", "keep", "ideas", "again"]}
      />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: LAB }} />} cam={cam} hits={[]} power={4} svg={svg} html={html} />;
};
