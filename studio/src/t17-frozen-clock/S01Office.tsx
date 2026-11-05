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
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine, SOFT } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T17 · "Why do you see 1 clock stop, when you look?" Spark Got Tricked #4 (PLAY, pencil look, 28 s).
// ONE world, one camera rig: a pencil office in the last minute of the day. The wall clock on the left, the whiteboard on the right.
// The test: the clock fills the frame and the red second hand ticks exactly once a second, nothing else moves and the sound is off, so it is a fair try.
// Then Spark falls for it, the co-worker's stopwatch shows the clock was fine, and the board shows the lab result: 0.88 s felt like 1 s.
// Yarrow et al. 2001 (Nature), Melcher et al. 2020: see facts.md. The clock is our picture; the lab used a number on a screen.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const ACCENT = "#d8342a";
const CREAM = "#fffdf6";
const GROUND = 1440;
const S0 = 2.75;
const SX = 300; // Spark at his desk
const SX_BOARD = 1795; // Spark at the board
const WALL_FLOOR = 1120;
const CLOCK: [number, number, number] = [590, 640, 130]; // x, y, radius

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const TEST = C(2); // the clock fills the frame from here
const LOOK_BACK = W(2, 7);
const TEST_END = C(3); // the picture stays fully still until here
const JUMP = W(3, 3) - 2; // "can": his eyes jump back to the clock
const LONG = W(3, 5);
const BUT = W(3, 7);
const NEVER = W(3, 10);
const RUN0 = E(3) + 2;
const LAB = C(4);
const GROW1 = W(4, 3); // "under"
const GROW2 = W(4, 6); // "felt"
const HIT = W(4, 10); // "second!"
export { HIT };
const EYES = C(5);
const FILL = W(5, 6); // "then": the pencil starts
const FILLED = W(5, 8) + 6;
const RUN_BACK = E(5) + 1;
const Q = C(6);
const YOUQ = W(6, 1);
const LOOP0 = E(6) + 4;
const LOOP1 = VOICE_FRAMES - 3;
const HOME = RUN_BACK + 26;
const ARRIVE = LAB + 8;

// --- the second hand: an honest tick every 30 frames ----------------------------------------------------------------------
// Frame 0 + the hook: stuck on one second (Spark's feeling, exaggerated; said in small print later). The test + everything after: exact seconds.
// The clock is off screen during the board, so the seconds can run up to the frame-0 value for the loop.
const TICK0 = PROMISE + 6; // first tick after the stuck hook
const LONG_TICK_A = TICK0 + 30 * Math.ceil((JUMP - TICK0) / 30); // first tick after his eyes jump: skipped, so it hangs
const LONG_TICK_B = LONG_TICK_A + 30;
const START_SEC = 35;
const LOOP_TICK = VOICE_FRAMES - 26;
const secAt = (f: number): number => {
  if (f < TICK0) return START_SEC;
  if (f >= HOME - 40) {
    if (f >= LOOP_TICK) return START_SEC;
    return START_SEC - Math.ceil((LOOP_TICK - f) / 30);
  }
  if (f >= LONG_TICK_A && f < LONG_TICK_B) return START_SEC + 1 + Math.floor((LONG_TICK_A - 1 - TICK0) / 30);
  return START_SEC + 1 + Math.floor((f - TICK0) / 30);
};
const tickFrames: number[] = [];
for (let t = TICK0; t < VOICE_FRAMES; t += 30) tickFrames.push(t);
const handAngle = (f: number) => {
  const s = secAt(f);
  const prev = secAt(f - 1);
  const justTicked = f > 0 && s !== prev;
  const since = justTicked ? 0 : Math.min(...[0, 1, 2, 3].map((d) => (secAt(f - d) !== secAt(f - d - 1) ? d : 9)));
  const recoil = since === 0 ? 1.6 : since === 1 ? -0.8 : since === 2 ? 0.3 : 0;
  return s * 6 + recoil;
};

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [460, 830, 1.9];
const TESTCAM: [number, number, number] = [590, 660, 3.0];
const BOARD: [number, number, number] = [1430, 950, 1.08];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 12, PROMISE + 8, [470, 880, 1.55]), // Spark, the clock, and a tall hat behind the cabinet
  k(TEST - 18, TEST - 2, TESTCAM), // the clock fills the frame: the test
  k(TEST_END - 4, TEST_END + 18, [520, 945, 1.14]), // back: the whole corner
  k(RUN0 + 2, RUN0 + 30, BOARD), // along the wall to the whiteboard
  k(RUN_BACK, RUN_BACK + 26, [440, 880, 1.7]), // back to Spark and the clock
  k(LOOP0, LOOP1, F0), // frame 0 again
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
const scaleAt = (f: number) => interpolate(f, [HIT, HIT + 7, HIT + 12, HIT + 16, RUN_BACK - 6, RUN_BACK + 10], [S0, 3.12, 2.98, 3.02, 3.02, S0], { ...clamp, easing: sio });
const sparkX = (f: number) => {
  const go = interpolate(f, [RUN0, ARRIVE], [0, 1], { ...clamp, easing: sio });
  const back = interpolate(f, [RUN_BACK, HOME], [0, 1], { ...clamp, easing: sio });
  return SX + (SX_BOARD - SX) * go * (1 - back);
};
const running = (f: number) => (f >= RUN0 && f < ARRIVE) || (f >= RUN_BACK && f < HOME);

// --- the world: a pencil office at the end of the day -----------------------------------------------------------------------
const Room: React.FC = () => (
  <g>
    <SketchLine x1={-400} y1={WALL_FLOOR} x2={2300} y2={WALL_FLOOR} w={6} />
    <SketchLine x1={-400} y1={WALL_FLOOR - 40} x2={2300} y2={WALL_FLOOR - 40} w={3} />
    <Hatch x={-400} y={WALL_FLOOR + 6} w={2700} h={500} gap={42} o={0.12} />
    {/* window: the low evening sun is the light in the room */}
    <SketchBox x={-40} y={330} w={300} h={380} fill={CREAM} lw={7} />
    <circle cx={120} cy={590} r={58} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <Hatch x={-36} y={640} w={292} h={66} gap={14} o={0.5} />
    <SketchLine x1={110} y1={330} x2={110} y2={710} w={5} />
    <SketchLine x1={-54} y1={714} x2={274} y2={714} w={10} />
    <path d="M 40 714 L 240 714 L 560 1120 L 170 1120 Z" fill="#fff9e8" opacity={0.65} />
    {/* calendar + poster on the far wall so the walk has something to pass */}
    <SketchBox x={930} y={420} w={70} h={90} fill={CREAM} lw={4} />
    <SketchLine x1={930} y1={445} x2={1000} y2={445} w={4} />
    <SketchLine x1={940} y1={470} x2={990} y2={470} w={3} />
    <SketchLine x1={940} y1={490} x2={990} y2={490} w={3} />
    {/* filing cabinet: Mr. Trick hides behind it */}
    <ellipse cx={780} cy={1166} rx={88} ry={9} fill={GRAPHITE} opacity={0.2} />
    <SketchBox x={700} y={930} w={160} h={232} fill={PAPER2} lw={7} />
    <SketchLine x1={700} y1={1008} x2={860} y2={1008} w={5} />
    <SketchLine x1={700} y1={1086} x2={860} y2={1086} w={5} />
    <SketchLine x1={756} y1={968} x2={804} y2={968} w={6} />
    <SketchLine x1={756} y1={1046} x2={804} y2={1046} w={6} />
    <SketchLine x1={756} y1={1124} x2={804} y2={1124} w={6} />
    {/* the whiteboard + its pendant lamp */}
    <SketchLine x1={1440} y1={-200} x2={1440} y2={152} w={5} />
    <path d="M 1390 214 L 1490 214 L 1466 150 L 1414 150 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    <SketchBox x={1060} y={300} w={720} h={740} fill={CREAM} lw={9} />
    <SketchLine x1={1050} y1={1052} x2={1790} y2={1052} w={9} />
    {/* co-worker's desk on the far side */}
    <rect x={1120} y={1250} width={560} height={30} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <SketchLine x1={1160} y1={1280} x2={1160} y2={1420} w={12} />
    <SketchLine x1={1640} y1={1280} x2={1640} y2={1420} w={12} />
    <ellipse cx={1400} cy={1426} rx={320} ry={13} fill={GRAPHITE} opacity={0.15} />
  </g>
);

// Spark's desk: switched off, bag packed, ready to go home
const Desk: React.FC = () => (
  <g>
    <ellipse cx={370} cy={1408} rx={300} ry={16} fill={GRAPHITE} opacity={0.18} />
    <path d="M 110 1190 L 640 1190 L 668 1232 L 82 1232 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <rect x={82} y={1232} width={586} height={28} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <SketchLine x1={120} y1={1260} x2={120} y2={1402} w={12} />
    <SketchLine x1={630} y1={1260} x2={630} y2={1402} w={12} />
    {/* laptop, closed + the packed bag */}
    <path d="M 420 1196 L 560 1196 L 576 1214 L 408 1214 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 540 1120 L 646 1120 L 660 1208 L 528 1208 Z" fill="#6e685f" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 562 1120 q 32 -44 62 0" fill="none" stroke={GRAPHITE} strokeWidth={8} />
  </g>
);

// The wall clock. `big` is outside the pencil filter for the hands, so the second hand stays clean and easy to follow.
const ClockFace: React.FC = () => {
  const [cx, cy, r] = CLOCK;
  return (
    <g>
      <circle cx={cx + 8} cy={cy + 12} r={r + 8} fill={GRAPHITE} opacity={0.16} />
      <circle cx={cx} cy={cy} r={r + 12} fill={PAPER2} stroke={GRAPHITE} strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * (Math.PI / 180);
        const big = i % 5 === 0;
        const r1 = r - (big ? 18 : 8);
        return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * (r - 3)} y2={cy + Math.sin(a) * (r - 3)} stroke={GRAPHITE} strokeWidth={big ? 4.5 : 1.6} strokeLinecap="round" />;
      })}
      {[["12", 0], ["3", 90], ["6", 180], ["9", 270]].map(([t, d]) => {
        const a = (Number(d) - 90) * (Math.PI / 180);
        return (
          <text key={String(t)} x={cx + Math.cos(a) * (r - 40)} y={cy + Math.sin(a) * (r - 40) + 13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={GRAPHITE}>
            {t}
          </text>
        );
      })}
    </g>
  );
};
const ClockHands: React.FC<{ f: number }> = ({ f }) => {
  const [cx, cy, r] = CLOCK;
  const a = handAngle(f);
  return (
    <g>
      {/* 4:59 */}
      <line x1={cx} y1={cy} x2={cx + Math.cos(((149.5 - 90) * Math.PI) / 180) * r * 0.5} y2={cy + Math.sin(((149.5 - 90) * Math.PI) / 180) * r * 0.5} stroke={GRAPHITE} strokeWidth={10} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(((354 - 90) * Math.PI) / 180) * r * 0.76} y2={cy + Math.sin(((354 - 90) * Math.PI) / 180) * r * 0.76} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" />
      <g transform={`rotate(${a} ${cx} ${cy})`}>
        <line x1={cx} y1={cy + 28} x2={cx} y2={cy - r * 0.86} stroke={ACCENT} strokeWidth={5} strokeLinecap="round" />
        <circle cx={cx} cy={cy + 28} r={7} fill={ACCENT} />
      </g>
      <circle cx={cx} cy={cy} r={9} fill={ACCENT} stroke={GRAPHITE} strokeWidth={3} />
    </g>
  );
};

// the co-worker's stopwatch: the same ticks as the wall clock
const Stopwatch: React.FC<{ x: number; y: number; f: number; pop: number }> = ({ x, y, f, pop }) => {
  if (pop <= 0.01) return null;
  const a = secAt(f) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${pop})`}>
      <rect x={-13} y={-104} width={26} height={22} fill={GRAPHITE} rx={4} />
      <circle cx={0} cy={0} r={86} fill={CREAM} stroke={GRAPHITE} strokeWidth={9} />
      {Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={Math.cos(t) * 62} y1={Math.sin(t) * 62} x2={Math.cos(t) * 76} y2={Math.sin(t) * 76} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />;
      })}
      <line x1={0} y1={14} x2={0} y2={-68} stroke={ACCENT} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a})`} />
      <circle cx={0} cy={0} r={8} fill={ACCENT} />
    </g>
  );
};

// --- the board: what the lab found -------------------------------------------------------------------------------------------
const BX0 = 1100;
const BX1 = 1720;
const GAP_X = BX0 + (BX1 - BX0) * 0.12;
const ROW1 = 555;
const ROW2 = 790;
const BAR_H = 120;
const eyeAt = (f: number): [number, number] => {
  const e = interpolate(f, [W(5, 1) + 2, W(5, 2) + 6], [0, 1], { ...clamp, easing: sio });
  return [BX0 + (GAP_X - BX0) * e, ROW1 - 52 - Math.sin(e * Math.PI) * 44];
};
const Board: React.FC<{ f: number }> = ({ f }) => {
  if (f < RUN0 || f > HOME + 4) return null;
  const titleIn = interpolate(f, [LAB - 2, LAB + 10], [0, 1], { ...clamp, easing: eoB });
  const g1 = interpolate(f, [GROW1, GROW2 - 4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const g2 = f < GROW2 ? 0 : interpolate(f, [GROW2, HIT - 4, HIT, HIT + 4, HIT + 9], [0, 0.72, 1.035, 0.99, 1], clamp);
  const rowLabel = (text: string, x: number, y: number, at: number) => (
    <text x={x} y={y} fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={GRAPHITE} opacity={interpolate(f, [at - 2, at + 8], [0, 1], clamp)}>
      {text}
    </text>
  );
  const fillK = interpolate(f, [FILL, FILLED], [0, 1], clamp);
  const eyeOn = interpolate(f, [EYES - 2, EYES + 8], [0, 1], { ...clamp, easing: eoB });
  const [ex, ey] = eyeAt(f);
  const gapOn = f >= HIT ? 1 + Math.sin(f * 0.3) * 0.0 : 0;
  return (
    <g>
      <g opacity={titleIn}>
        <text x={1420} y={410} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={70} fill={GRAPHITE}>
          LAB TEST
        </text>
      </g>
      {/* row 1: how long the number was really on screen */}
      {f >= GROW1 - 2 && rowLabel("REALLY ON SCREEN", GAP_X + 62, ROW1 - 18, GROW1)}
      <rect x={GAP_X} y={ROW1} width={(BX1 - GAP_X) * g1} height={BAR_H} rx={8} fill={ACCENT} stroke={GRAPHITE} strokeWidth={6} />
      {g1 > 0.35 && (
        <text x={GAP_X + (BX1 - GAP_X) * g1 - 28} y={ROW1 + 86} textAnchor="end" fontFamily={FONT.title} fontWeight={900} fontSize={78} fill="#fff">
          0.88 s
        </text>
      )}
      {/* the part that was never on screen */}
      {gapOn > 0 && <rect x={BX0} y={ROW1} width={GAP_X - BX0 - 3} height={BAR_H} rx={6} fill="none" stroke={ACCENT} strokeWidth={6} strokeDasharray="14 10" />}
      {fillK > 0 && (
        <g>
          <clipPath id="gapfill">
            <rect x={BX0} y={ROW1} width={(GAP_X - BX0) * fillK} height={BAR_H} />
          </clipPath>
          <g clipPath="url(#gapfill)">
            <rect x={BX0} y={ROW1} width={GAP_X - BX0} height={BAR_H} fill="#f7c9c4" />
            <Hatch x={BX0} y={ROW1} w={GAP_X - BX0} h={BAR_H} gap={13} color={ACCENT} o={1} width={6} />
          </g>
        </g>
      )}
      {/* row 2: how long it felt */}
      {f >= GROW2 - 2 && rowLabel("FELT LIKE", BX0, ROW2 - 18, GROW2)}
      <rect x={BX0} y={ROW2} width={(BX1 - BX0) * g2} height={BAR_H} rx={8} fill={GRAPHITE} stroke={GRAPHITE} strokeWidth={6} />
      {g2 > 0.8 && (
        <text x={BX1 - 28} y={ROW2 + 86} textAnchor="end" fontFamily={FONT.title} fontWeight={900} fontSize={78} fill="#fff">
          1 FULL SECOND
        </text>
      )}
      {/* the two bars end together; only the start differs */}
      {f >= HIT && <line x1={BX0} y1={ROW1 - 4} x2={BX0} y2={ROW2 + BAR_H + 22} stroke={SOFT} strokeWidth={5} strokeDasharray="12 10" />}
      {f >= EYES && (
        <text x={BX0 - 16} y={ROW1 - 108} fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={ACCENT}>
          {f >= FILL ? "FILLED IN?" : "EYES JUMP"}
        </text>
      )}
      {/* the eye that jumps across the gap */}
      {f >= EYES - 2 && (
        <g transform={`translate(${ex} ${ey}) scale(${eyeOn})`}>
          <path d="M -46 0 Q 0 -38 46 0 Q 0 38 -46 0 Z" fill="#fff" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={6} cy={0} r={15} fill={GRAPHITE} />
        </g>
      )}
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [PROMISE - 10, "swish", 0.25],
  [PROMISE + 8, "pop", 0.3],
  [TEST - 16, "whoosh", 0.3],
  // real ticks, but none during the test (a sound would give a beat to compare with) and none while the clock hangs
  ...tickFrames.filter((t) => (t < TEST - 18 || t >= TEST_END) && t < RUN0 && t !== LONG_TICK_A).map((t) => [t, "tick", 0.6] as SfxCue),
  ...[LOOP_TICK - 60, LOOP_TICK - 30, LOOP_TICK].map((t) => [t, "tick", 0.5] as SfxCue),
  [JUMP - 10, "pop", 0.3],
  [JUMP + 2, "swish", 0.35],
  [BUT + 2, "pop", 0.35],
  [RUN0 + 2, "whoosh_long", 0.3],
  [ARRIVE - 2, "thud", 0.3],
  [GROW1, "scribble", 0.35],
  [HIT, "impact", 0.8],
  [HIT + 3, "ding", 0.45],
  [W(5, 2) + 2, "boing", 0.3],
  [FILL + 2, "scribble", 0.5],
  [RUN_BACK + 2, "whoosh_long", 0.28],
  [YOUQ + 2, "pop", 0.3],
];

export const S01Office: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const sNow = scaleAt(f);

  const POINT_CLOCK: Partial<Pose> = { ra1: 128, ra2: -6, la1: -14, la2: -8, head: -9, lean: -2 };
  const sparkKeys = gestureKeys([
    [0, POINT_CLOCK],
    [W(0, 7), { ...POINT_CLOCK, ra1: 134 }],
    [PROMISE - 2, { ...G.pointUp, head: -6 }, "snap"],
    [E(1) + 4, G.rest],
    [TEST_END + 4, { ...G.rest, head: 6 }],
    [JUMP - 12, { ...G.leanIn, head: 12 }, "snap"],
    [JUMP, { ...POINT_CLOCK, ra1: 136, head: -12 }, "snap"],
    [LONG, { ...G.mindBlown, ra1: 136, ra2: 40, la1: -120, la2: -60, head: -10 }, "snap"],
    [BUT - 2, { ...G.shrugBig, head: 8 }, "snap"],
    [NEVER, { ...G.facepalm }, "snap"],
    [RUN0, { ra1: 60, ra2: 70, la1: -60, la2: -70, lean: 12, head: 2 }, "snap"],
    [ARRIVE, { ...G.pointSide, ra1: 92, head: -2 }, "snap"],
    [GROW1, { ...G.thinkChin, head: -4 }, "snap"],
    [GROW2, { ...G.doublePoint, ra1: 98, la1: 66 }, "snap"],
    [HIT, G.mindBlown, "snap"],
    [EYES - 2, G.mindBlown],
    [EYES + 2, { ...G.pointSide, ra1: 112, head: -8 }, "snap"],
    [W(5, 3), { ...G.pointUp, ra1: 146, head: -8 }, "snap"],
    [FILLED, { ...G.present, head: -4 }, "snap"],
    [RUN_BACK, { ra1: 60, ra2: 70, la1: -60, la2: -70, lean: 12, head: 2 }, "snap"],
    [Q - 2, { ...G.leanIn, ra1: 82, ra2: 8 }, "snap"],
    [YOUQ, { ...G.doublePoint, ra1: 96, la1: 64, lean: 8 }, "snap"],
    [LOOP0 + 2, POINT_CLOCK, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, hop(t, HIT, 56));
    q = addPose(q, hop(t, LONG, 22));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, shake(t, BUT + 6, 3));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    if (running(t)) q = { ...q, ...walkCycle(t, 1.15) };
    const s = scaleAt(t);
    return { ...q, x: sparkX(t), y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [W(0, 7), "worried"],
      [PROMISE - 2, "curious"],
      [TEST - 4, "neutral"],
      [JUMP - 12, "curious"],
      [JUMP, "shock"],
      [LONG, "angry"],
      [BUT - 2, "worried"],
      [NEVER, "sad"],
      [RUN0, "determined"],
      [GROW1, "thinking"],
      [GROW2, "curious"],
      [W(4, 8), "shock"],
      [HIT, "mindblown"],
      [EYES + 2, "curious"],
      [FILL, "excited"],
      [RUN_BACK, "happy"],
      [Q - 2, "curious"],
      [YOUQ, "wink"],
      [LOOP0 + 2, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= HIT && t < RUN_BACK + 6) return interpolate(t, [HIT, HIT + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const facing = (t: number) => (t >= ARRIVE - 2 && t < HOME - 2 ? -1 : 1);

  // --- Mr. Trick: behind the cabinet, he draws Spark's eyes away, later he fills the gap on the board -------------------------
  const peek = interpolate(f, [PROMISE + 6, PROMISE + 20], [1330, 1150], { ...clamp, easing: eoB });
  const pop = interpolate(f, [TEST_END + 3, TEST_END + 15], [0, 1], { ...clamp, easing: eoB });
  const hide = interpolate(f, [NEVER - 2, NEVER + 12], [0, 1], { ...clamp, easing: ei });
  const cabinetG = Math.max(peek, 0) - 92 * pop + 92 * hide + 180 * hide;
  const waving = f >= TEST_END + 3 && f < JUMP + 6;
  const wave = waving ? Math.sin(f * 0.75) * 26 : 0;
  const atBoard = f >= NEVER + 16;
  const LADDER_G = 838;
  const boardX = 1000;
  const boardG = LADDER_G;
  const scribble = f >= FILL && f < FILLED + 2;
  const trickPose: Partial<Pose> = atBoard
    ? { ra1: scribble ? 92 + Math.sin(f * 1.5) * 8 : 62, ra2: scribble ? -6 : 60, la1: -24, la2: -12, head: -2, lean: 2 }
    : { ra1: waving ? 150 + wave : 44, ra2: waving ? -10 : 12, la1: 30, la2: 20, head: -3 };
  const tMood = f >= FILLED ? "smug" : f >= NEVER ? "surprised" : "sly";
  const trick = atBoard ? (
    <MrTrick x={boardX} ground={boardG} scale={1.42} facing={1} pose={trickPose} mood={tMood} cane="none">
      {(j) => {
        // the red pencil: upright while he waits, into the gap when he fills it
        const tx = scribble ? BX0 + 10 + (GAP_X - BX0 - 20) * Math.abs(Math.sin(f * 0.8)) : j.rHand[0] + 16;
        const ty = scribble ? ROW1 + 14 + (BAR_H - 28) * Math.abs(Math.sin(f * 1.7)) : j.rHand[1] - 110;
        return (
          <g>
            <line x1={j.rHand[0]} y1={j.rHand[1] + 6} x2={tx} y2={ty} stroke={ACCENT} strokeWidth={15} strokeLinecap="round" />
            <line x1={j.rHand[0]} y1={j.rHand[1] + 6} x2={tx} y2={ty} stroke={GRAPHITE} strokeWidth={3} />
          </g>
        );
      }}
    </MrTrick>
  ) : (
    <MrTrick x={790} ground={cabinetG} scale={1.42} facing={-1} pose={trickPose} mood={tMood} cane="none" />
  );

  // --- the co-worker and her stopwatch --------------------------------------------------------------------------------------
  const walkIn = interpolate(f, [JUMP + 6, BUT - 4], [0, 1], { ...clamp, easing: sio });
  const cx = 1060 + (885 - 1060) * walkIn;
  const COS = 2.2;
  const raised = interpolate(f, [BUT - 6, BUT + 6], [0, 1], { ...clamp, easing: eoB });
  const coPose: Partial<Pose> = {
    ...(walkIn > 0.01 && walkIn < 0.99 ? walkCycle(f, 0.6) : {}),
    ra1: 14 + 118 * raised,
    ra2: -6,
    la1: -16,
    la2: 8,
    head: -2,
  };
  const coJ = solve({ ...STAND, ...coPose, x: cx, y: GROUND - 92.5 * COS } as Pose, COS, -1);

  // --- darkness: the room dims for the drop, the lamp keeps the board and Spark lit ----------------------------------------------
  const dark = interpolate(f, [RUN0 + 4, LAB - 2], [0, 0.72], { ...clamp, easing: sio }) * interpolate(f, [RUN_BACK, RUN_BACK + 18], [1, 0], { ...clamp, easing: sio });

  const stillTest = f >= TEST - 2 && f < TEST_END;
  const jumpK = interpolate(f, [JUMP - 2, JUMP + 8], [0, 1], { ...clamp, easing: eio });
  const jumpEye = interpolate(f, [TEST_END + 10, TEST_END + 18], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [BUT - 8, BUT - 1], [1, 0], clamp);

  const svg = (
    <>
      <PencilDefs f={f} still={stillTest} />
      <defs>
        <mask id="lit" maskUnits="userSpaceOnUse" x={-500} y={-400} width={2900} height={2300}>
          <rect x={-500} y={-400} width={2900} height={2300} fill="#fff" />
          <ellipse cx={1430} cy={700} rx={540} ry={520} fill="#000" filter="url(#soft)" />
          <ellipse cx={sparkX(f)} cy={1090} rx={280} ry={470} fill="#000" filter="url(#soft)" />
        </mask>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={46} />
        </filter>
      </defs>
      <Paper />
      <g filter="url(#pencil)">
        <Room />
        <ClockFace />
        {!atBoard && <g>{trick}</g>}
        <SketchBox x={700} y={930} w={160} h={232} fill={PAPER2} lw={7} />
        <SketchLine x1={700} y1={1008} x2={860} y2={1008} w={5} />
        <SketchLine x1={700} y1={1086} x2={860} y2={1086} w={5} />
        <SketchLine x1={756} y1={968} x2={804} y2={968} w={6} />
        <SketchLine x1={756} y1={1046} x2={804} y2={1046} w={6} />
        <SketchLine x1={756} y1={1124} x2={804} y2={1124} w={6} />
        <Desk />
        {/* a stepladder beside the board */}
        <ellipse cx={1000} cy={1436} rx={104} ry={10} fill={GRAPHITE} opacity={0.2} />
        <SketchLine x1={950} y1={LADDER_G + 6} x2={920} y2={1430} w={10} />
        <SketchLine x1={1050} y1={LADDER_G + 6} x2={1080} y2={1430} w={10} />
        <SketchBox x={938} y={LADDER_G} w={124} h={18} fill={PAPER2} lw={6} />
        {[0, 1, 2, 3, 4].map((i) => (
          <SketchLine key={i} x1={944 - i * 5} y1={LADDER_G + 120 + i * 104} x2={1056 + i * 5} y2={LADDER_G + 120 + i * 104} w={7} />
        ))}
        <Doodle x={cx} ground={GROUND} scale={COS} facing={-1} hair="bun" glasses face={raised > 0.5 ? "happy" : "plain"} pose={coPose} />
      </g>
      <ClockHands f={f} />
      <Board f={f} />
      {atBoard && <g filter="url(#pencil)">{trick}</g>}
      <Stopwatch x={coJ.rHand[0] - 6} y={coJ.rHand[1] - 80} f={f} pop={raised * interpolate(f, [RUN0 + 20, RUN0 + 30], [1, 0], clamp)} />
      {/* Spark's look: the same eye as on the board later, it jumps from Mr. Trick to the clock */}
      {jumpEye > 0.01 && (
        <g transform={`translate(${770 + (640 - 770) * jumpK} ${835 + (806 - 835) * jumpK - Math.sin(jumpK * Math.PI) * 60}) scale(${jumpEye})`}>
          <path d="M -46 0 Q 0 -38 46 0 Q 0 38 -46 0 Z" fill="#fff" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={-6} cy={-6} r={15} fill={GRAPHITE} />
        </g>
      )}
      {dark > 0.005 && <rect x={-500} y={-400} width={2900} height={2300} fill="#191714" opacity={dark} mask="url(#lit)" />}
      <Spark f={f} trails={false} scale={sNow} facing={facing} base={{ x: SX, y: GROUND - 92.5 * sNow }} talk={(t) => (t > LOOP0 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={f < LOOP0 && f >= PROMISE ? 0.8 : 0.3} keys={sparkKeys} mod={sparkMod} />
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 110,
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
  const stopped = <>THE CLOCK <span style={{ color: ACCENT }}>STOPPED?</span></>;
  const smallLine =
    f < TEST_END
      ? ""
      : f < RUN0
        ? "Our drawing makes the stop bigger. The real stretch is about a tenth of a second."
        : f < LAB
          ? ""
          : f < EYES
            ? "Lab test: 30 people, a number on a screen, not a wall clock (Yarrow, 2001)."
            : f < Q
              ? "One explanation. Scientists still debate why it happens."
              : "";
  const lookHere = f >= TEST + 2 && f < LOOK_BACK;
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 4 && top(stopped, 0, PROMISE - 4)}
      {f >= LOOP0 + 6 && top(stopped, VOICE_FRAMES + 100, VOICE_FRAMES + 200)}
      {lookHere && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, fontSize: 92, color: GRAPHITE, WebkitTextStroke: `16px ${PAPER}`, paintOrder: "stroke fill" }}>
          LOOK UP HERE
          <div style={{ width: 56, height: 56, borderRadius: 28, background: GRAPHITE, margin: "22px auto 0" }} />
        </div>
      )}
      {f >= LONG - 2 && f < BUT - 4 && top(<>IT <span style={{ color: ACCENT }}>STOPPED!</span></>, LONG - 2, BUT - 4)}
      {f >= BUT + 2 && f < RUN0 && top(<>IT NEVER <span style={{ color: ACCENT }}>STOPPED</span></>, BUT + 2, RUN0, 104)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1692, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= TEST_END && f < E(6) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 4</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["stop,", "last", "look", "back.", "long.", "never", "stopped.", "lab,", "second!", "jump.", "fill", "happen?"]} />
    </>
  );

  const hits = [HIT, HIT + 2];
  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={hits} power={5} svg={svg} html={html} />;
};
