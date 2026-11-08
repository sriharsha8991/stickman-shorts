import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, type Pose } from "../stickman/stick";
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
// T08 · "How many Fs can you count?" Spark Got Tricked #12 (PLAY, pencil look, 30.1 s).
// ONE world, one camera rig: a pencil office. A typed report stands on a big clipboard on the desk (left), lit by a desk
// lamp; Spark stands at the end of the desk (right); Mr. Trick sits on top of the clipboard. The viewer counts the Fs with
// the picture fully still. Spark counts three (pencil ticks). His boss walks in, picks up the red pen and writes 6 on the
// report. Then the three small words OF get red circles, one by one: every F Spark missed is in OF.
// Missing-letter effect: Greenberg, Koriat & Shapiro 1992; Greenberg, Healy, Koriat & Kreiner 2004 (see facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const RED = "#d23a2c"; // the boss's red pen: the one accent colour
const CREAM = "#fffdf6";
const WALL = "#e6dcc6";
const FLOOR = 1440;
const DESK = 1170;
const S = 2.9;

// --- the report: one sentence, every letter placed on a fixed grid (typewriter) -------------------------------------------
const LINES = ["FINISHED FILES ARE", "THE RESULT OF YEARS", "OF SCIENTIFIC STUDY", "COMBINED WITH THE", "EXPERIENCE OF YEARS."];
const X0 = 112;
const ADV = 43.2;
const FS = 72;
const BASE = (i: number) => 528 + i * 118;
const charX = (col: number) => X0 + col * ADV;
// the six Fs (line, column); Spark finds the three in long words, the three in OF are missed
const SPARK_FS: [number, number][] = [
  [0, 0],
  [0, 9],
  [2, 10],
];
const OF_AT: [number, number][] = [
  [1, 11],
  [2, 0],
  [4, 11],
];
// sanity: the strings really hold six Fs, and the grid points at them
const _count = LINES.join("").split("F").length - 1;
if (_count !== 6) throw new Error(`expected 6 Fs, got ${_count}`);
for (const [l, c] of [...SPARK_FS, ...OF_AT.map(([l, c]) => [l, c + 1] as [number, number])]) if (LINES[l][c] !== "F") throw new Error(`no F at ${l},${c}`);

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const TRICK_UP = [PROMISE - 6, PROMISE + 10] as const;
const TEST0 = C(2);
const STILL0 = C(2) + 16; // camera has arrived on the report: nothing moves from here
const STILL1 = C(3); // "Spark counted three"
const TICKS = [W(3, 1), W(3, 1) + 6, W(3, 1) + 12];
const THREE = W(3, 2);
const SURE = W(3, 6);
const BOSS0 = C(3) + 14;
const BOSS1 = C(4) - 4;
const PICK = C(4) + 2;
const WRITE0 = W(4, 2) - 2; // "boss": she starts writing
const HIT = W(4, 4); // "six!"
export { HIT };
const R1 = W(5, 3); // "of"
const R2 = W(5, 5); // "there"
const R3 = W(5, 7); // "times."
const BIG = R3 + 3;
const SMALLW = W(6, 5);
const COMMONW = W(6, 6);
const Q = C(7);
const FSW = W(7, 2);
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [1100, 900, 1.6];
const WIDE: V3 = [540, 950, 0.85];
const TEST: V3 = [540, 742, 1.12];
const REVEAL: V3 = [670, 800, 0.9];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 18, PROMISE + 4, WIDE), // the whole desk: the report, Mr. Trick, Spark
  k(TEST0 - 8, STILL0 - 2, TEST), // onto the report, then nothing moves
  k(STILL1 - 2, STILL1 + 18, WIDE), // back: Spark counts, the boss walks in
  k(E(4) + 4, E(4) + 24, REVEAL), // the pause: push in on the report and Spark
  k(C(6) + 30, C(6) + 52, WIDE),
  k(Q - 16, Q + 6, F0), // back to Spark's face for the question = frame 0
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

// --- the room -------------------------------------------------------------------------------------------------------------
const Room: React.FC<{ f: number }> = ({ f }) => {
  // wall clock: the minute hand moves only outside the test (linear is fine for a clock hand)
  const minute = 300 + f * 0.05;
  return (
    <g>
      <rect x={-900} y={-900} width={3800} height={FLOOR + 900} fill={WALL} />
      {/* skirting + floor */}
      <rect x={-900} y={FLOOR} width={3800} height={1200} fill={PAPER2} />
      <Hatch x={-900} y={FLOOR} w={3800} h={1200} gap={30} o={0.18} />
      <SketchLine x1={-900} y1={FLOOR} x2={2900} y2={FLOOR} w={7} />
      <line x1={-900} y1={FLOOR - 40} x2={2900} y2={FLOOR - 40} stroke={GRAPHITE} strokeWidth={3} opacity={0.4} />
      {/* door on the far left, where the boss comes from */}
      <SketchBox x={-700} y={560} w={300} h={FLOOR - 560} fill={PAPER2} lw={7} />
      <circle cx={-440} cy={1040} r={12} fill={GRAPHITE} />
      {/* wall clock above Spark */}
      <circle cx={1660} cy={420} r={78} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={1660 + Math.sin(a) * 62} y1={420 - Math.cos(a) * 62} x2={1660 + Math.sin(a) * 70} y2={420 - Math.cos(a) * 70} stroke={GRAPHITE} strokeWidth={4} />;
      })}
      <line x1={1660} y1={420} x2={1660 + Math.sin((minute * Math.PI) / 180) * 54} y2={420 - Math.cos((minute * Math.PI) / 180) * 54} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />
      <line x1={1660} y1={420} x2={1660 + Math.sin(((150 + f * 0.004) * Math.PI) / 180) * 36} y2={420 - Math.cos(((150 + f * 0.004) * Math.PI) / 180) * 36} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" />
      {/* window on the right */}
      <SketchBox x={1560} y={300} w={360} h={520} fill="#cfd8d6" lw={8} />
      <line x1={1740} y1={300} x2={1740} y2={820} stroke={GRAPHITE} strokeWidth={6} />
      <line x1={1560} y1={560} x2={1920} y2={560} stroke={GRAPHITE} strokeWidth={6} />
      {/* office plant on the floor, behind Spark */}
      <path d="M 1420 1440 L 1400 1330 L 1520 1330 L 1500 1440 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
      {[-40, -15, 10, 35].map((a, i) => (
        <path key={i} d={`M 1460 1330 Q ${1460 + a * 2} ${1250 - i * 12} ${1460 + a * 3.4} ${1160 + (i % 2) * 30}`} stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" />
      ))}
      {[-40, -15, 10, 35].map((a, i) => (
        <ellipse key={i} cx={1460 + a * 3.4} cy={1166 + (i % 2) * 30} rx={26} ry={12} fill={PAPER2} stroke={GRAPHITE} strokeWidth={4} transform={`rotate(${a} ${1460 + a * 3.4} ${1166 + (i % 2) * 30})`} />
      ))}
    </g>
  );
};

// warm light pooled on the report (from the window light and the room lamp)
const Lamp: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="lampGlow08" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff7dc" stopOpacity={0.95} />
        <stop offset="1" stopColor="#fff7dc" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={520} cy={760} rx={760} ry={640} fill="url(#lampGlow08)" />
  </g>
);
export const _LampBody: React.FC = () => (
  <g>
    <ellipse cx={-230} cy={DESK - 4} rx={70} ry={14} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <path d={`M -230 ${DESK - 10} L -180 ${DESK - 210} L -60 ${DESK - 300}`} stroke={GRAPHITE} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M -100 ${DESK - 340} L -10 ${DESK - 360} L 10 ${DESK - 250} L -60 ${DESK - 270} Z`} fill="#fff1c0" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const Desk: React.FC = () => (
  <g>
    <ellipse cx={300} cy={FLOOR + 6} rx={820} ry={14} fill={GRAPHITE} opacity={0.18} />
    <rect x={-520} y={DESK} width={1630} height={34} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <rect x={-480} y={DESK + 34} width={1550} height={FLOOR - DESK - 34} fill="#e2d6bd" stroke={GRAPHITE} strokeWidth={6} />
    <Hatch x={-470} y={DESK + 40} w={1530} h={FLOOR - DESK - 50} gap={22} o={0.16} />
    {[-300, 400, 880].map((x) => (
      <g key={x}>
        <rect x={x} y={DESK + 70} width={160} height={70} rx={6} fill="none" stroke={GRAPHITE} strokeWidth={4} />
        <line x1={x + 55} y1={DESK + 105} x2={x + 105} y2={DESK + 105} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />
      </g>
    ))}
    {/* a coffee mug next to the clipboard */}
    <rect x={-120} y={DESK - 70} width={56} height={70} rx={8} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
    <path d={`M -64 ${DESK - 56} q 26 6 0 36`} stroke={GRAPHITE} strokeWidth={5} fill="none" />
  </g>
);

// --- the clipboard + report -------------------------------------------------------------------------------------------------
const BX0 = 60;
const BX1 = 1020;
const BY0 = 330;
const PX0 = 92;
const PX1 = 988;
const PY0 = 384;
const PY1 = DESK - 26;

const Board: React.FC<{ f: number }> = ({ f }) => {
  // pencil ticks: Spark's three Fs
  const tick = (i: number) => {
    const p = interpolate(f, [TICKS[i], TICKS[i] + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (p <= 0) return null;
    const [l, c] = SPARK_FS[i];
    const x = charX(c) + 6;
    const y = BASE(l) + 18;
    return <path key={i} d={`M ${x} ${y} l 12 12 l 22 -24`} stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
  };
  // red circles round every OF, one by one
  const ring = (i: number, at: number) => {
    const p = interpolate(f, [at, at + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (p <= 0) return null;
    const [l, c] = OF_AT[i];
    const cx = charX(c) + ADV;
    const cy = BASE(l) - 26;
    return (
      <ellipse key={i} cx={cx} cy={cy} rx={66} ry={52} fill="none" stroke={RED} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} transform={`rotate(-6 ${cx} ${cy})`} />
    );
  };
  const ringAt = [R1, R2, R3];
  // the F inside each OF turns red as its ring closes
  const redF = (l: number, c: number) => {
    const i = OF_AT.findIndex(([ol, oc]) => ol === l && oc + 1 === c);
    return i >= 0 && f >= ringAt[i] + 6;
  };
  const pulse = (l: number, c: number) => {
    const i = OF_AT.findIndex(([ol, oc]) => ol === l && oc + 1 === c);
    return i >= 0 ? 1 + wobble(f, ringAt[i] + 6, 0.12, 5) : 1;
  };
  // the boss's red 6: drawn by her pen, then a ring
  const six = interpolate(f, [WRITE0 + 4, HIT], [0, 1], clamp);
  const sixRing = interpolate(f, [HIT, HIT + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <g>
      {/* clipboard, standing on the desk on two small feet */}
      <rect x={BX0 + 40} y={DESK - 16} width={40} height={18} fill={GRAPHITE} />
      <rect x={BX1 - 80} y={DESK - 16} width={40} height={18} fill={GRAPHITE} />
      <rect x={BX0} y={BY0} width={BX1 - BX0} height={DESK - 14 - BY0} rx={18} fill="#c9b48e" stroke={GRAPHITE} strokeWidth={7} />
      <Hatch x={BX0 + 8} y={BY0 + 8} w={BX1 - BX0 - 16} h={40} gap={14} o={0.25} />
      <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
      {/* clip */}
      <rect x={430} y={BY0 - 34} width={220} height={92} rx={14} fill="#d8d4cc" stroke={GRAPHITE} strokeWidth={6} />
      <rect x={480} y={BY0 - 14} width={120} height={22} rx={8} fill="none" stroke={GRAPHITE} strokeWidth={4} />
      {/* the sentence */}
      {LINES.map((line, l) =>
        line.split("").map((ch, c) =>
          ch === " " ? null : (
            <text
              key={`${l}-${c}`}
              x={charX(c) + ADV / 2}
              y={BASE(l)}
              textAnchor="middle"
              fontFamily="'Liberation Mono', 'DejaVu Sans Mono', monospace"
              fontWeight={700}
              fontSize={FS}
              fill={redF(l, c) ? RED : GRAPHITE}
              transform={pulse(l, c) !== 1 ? `translate(${charX(c) + ADV / 2} ${BASE(l) - 26}) scale(${pulse(l, c)}) translate(${-(charX(c) + ADV / 2)} ${-(BASE(l) - 26)})` : undefined}
            >
              {ch}
            </text>
          ),
        ),
      )}
      {[0, 1, 2].map(tick)}
      {ringAt.map((at, i) => ring(i, at))}
      {six > 0 && (
        <g>
          <path d="M 195 1046 C 163 1040 145 1070 149 1098 C 153 1124 191 1126 197 1102 C 203 1080 173 1070 153 1088" stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - six} />
          {sixRing > 0 && <ellipse cx={175} cy={1084} rx={58} ry={50} fill="none" stroke={RED} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - sixRing} transform="rotate(-8 175 1084)" />}
        </g>
      )}
    </g>
  );
};

// --- the boss -------------------------------------------------------------------------------------------------------------
const BS = 2.5;
const BOSS_X0 = -420;
const BOSS_X1 = 30;
const PEN_REST: [number, number] = [180, DESK - 6];
const bossAt = (f: number) => {
  const walkP = interpolate(f, [BOSS0, BOSS1], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const x = BOSS_X0 + (BOSS_X1 - BOSS_X0) * walkP;
  const walking = f > BOSS0 && f < BOSS1 - 2;
  const sw = walking ? Math.sin((f - BOSS0) * 0.45) * 24 : 0;
  // arm: down by the side → reach for the pen → write → hold the pen up
  const reach = interpolate(f, [PICK - 4, PICK + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const lift = interpolate(f, [PICK + 8, WRITE0 + 2], [0, 1], { ...clamp, easing: eio });
  const writing = f >= WRITE0 + 4 && f < HIT + 2 ? Math.sin((f - WRITE0) * 0.9) * 5 : 0;
  const after = interpolate(f, [HIT + 6, HIT + 16], [0, 1], { ...clamp, easing: eio });
  let ra1 = 18 - sw * 0.6;
  let ra2 = -8;
  ra1 = ra1 + (50 - ra1) * reach;
  ra2 = ra2 + (0 - ra2) * reach;
  ra1 = ra1 + (70 + writing - ra1) * lift;
  ra2 = ra2 + (-12 - ra2) * lift;
  ra1 = ra1 + (34 - ra1) * after; // lowers the pen to her side
  ra2 = ra2 + (-30 - ra2) * after;
  const pose: Partial<Pose> = {
    ll1: -12 + sw,
    ll2: 4 + Math.max(0, -sw) * 0.8,
    rl1: 12 - sw,
    rl2: -4 - Math.max(0, sw) * 0.8,
    la1: -18 + sw * 0.6,
    la2: 8,
    ra1,
    ra2,
    lean: walking ? 4 : reach * (1 - lift) * 8,
    head: f >= HIT + 6 ? 8 : 0,
  };
  const p: Pose = { ...STAND, ...pose, x, y: FLOOR - 92.5 * BS - (walking ? Math.abs(Math.sin((f - BOSS0) * 0.45)) * 6 : 0) };
  const j = solve(p, BS, 1);
  return { x, pose, hand: j.rHand, holding: f >= PICK + 4, face: (f >= HIT + 6 ? "happy" : "plain") as "happy" | "plain" };
};
const Pen: React.FC<{ at: [number, number]; rot: number }> = ({ at, rot }) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${rot})`}>
    <rect x={-44} y={-8} width={78} height={16} rx={7} fill={RED} stroke={GRAPHITE} strokeWidth={4} />
    <path d="M 34 -7 L 50 0 L 34 7 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={3} strokeLinejoin="round" />
    <rect x={-44} y={-8} width={18} height={16} rx={5} fill={GRAPHITE} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [W(0, 2), "pop", 0.2],
  [PROMISE - 16, "whoosh", 0.3],
  [TRICK_UP[0] + 4, "boing", 0.25],
  [TEST0 - 6, "whoosh", 0.25],
  [STILL1 - 2, "whoosh", 0.25],
  ...TICKS.map((t) => [t, "scribble", 0.25] as SfxCue),
  [THREE, "pop", 0.3],
  [SURE, "ding", 0.2],
  [BOSS0 + 6, "tick", 0.18],
  [BOSS0 + 20, "tick", 0.18],
  [BOSS0 + 34, "tick", 0.18],
  [PICK + 4, "clink", 0.35],
  [WRITE0 + 4, "scribble", 0.4],
  [HIT, "impact", 0.75],
  [HIT + 2, "stamp", 0.4],
  [E(4) + 6, "whoosh_long", 0.25],
  [R1, "scribble", 0.4],
  [R2, "scribble", 0.4],
  [R3, "scribble", 0.4],
  [BIG, "ding", 0.55],
  [BIG + 10, "swirl", 0.3],
  [C(6) + 30, "whoosh", 0.25],
  [Q - 14, "whoosh", 0.3],
  [FSW, "pop", 0.3],
];

export const S01Report: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const still = f >= STILL0 && f < STILL1; // the count test: nothing moves
  const fa = still ? STILL0 : f;

  // --- Spark (stands at the right end of the desk, facing left at the report) --------------------------------------------
  const SX = 1040;
  const SY = FLOOR - 92.5 * S;
  const sparkKeys = gestureKeys([
    [0, { ...G.armsCrossed, head: -6 }],
    [W(0, 2), { ...G.pointSide, ra1: 112, head: -8 }, "snap"], // "letters": points at the report
    [W(0, 5), { ...G.shrugBig }, "snap"], // "miss"
    [W(0, 8), { ...G.thinkChin, head: 8 }, "snap"], // "boss"
    [PROMISE - 2, { ...G.pointUp, head: -8 }, "snap"],
    [E(1) + 2, { ...G.handsHips, head: -6 }, "snap"],
    [TEST0 - 4, { ...G.rest, head: 10 }, "snap"], // reads along with the viewer, arms down (out of the test area)
    [TICKS[0] - 2, { ...G.pointSide, ra1: 120, head: -12 }, "snap"],
    [TICKS[1] - 2, { ...G.pointSide, ra1: 104, head: -10 }, "snap"],
    [TICKS[2] - 2, { ...G.pointSide, ra1: 112, head: -12 }, "snap"],
    [THREE, { ...G.count1, ra1: 160, head: -6 }, "snap"],
    [SURE - 2, { ...G.armsCrossed, head: -4 }, "snap"],
    [C(4), { ...G.leanIn, head: -10 }, "snap"], // "But": he looks over at the boss
    [HIT, { ...G.recoil, head: -14 }, "snap"],
    [HIT + 16, { ...G.facepalm }, "snap"],
    [E(4) + 6, { ...G.leanIn, head: -12 }, "snap"],
    [R1 - 2, { ...G.pointSide, ra1: 114, head: -10 }, "snap"],
    [R2 - 2, { ...G.pointSide, ra1: 100, head: -12 }, "snap"],
    [BIG, { ...G.mindBlown, head: -8 }, "snap"],
    [C(6), { ...G.presentBoth, head: -6 }, "snap"],
    [SMALLW - 2, { ...G.thinkChin, head: 6 }, "snap"],
    [COMMONW + 4, { ...G.pointUp, head: -8 }, "snap"],
    [Q - 4, { ...G.leanIn, ra1: 80, ra2: 10, head: 4 }, "snap"],
    [FSW, { ...G.doublePoint, lean: 8 }, "snap"],
    [E(7) + 6, { ...G.armsCrossed, head: -6 }, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, nod(t, SURE + 2, 3));
    q = addPose(q, hop(t, HIT, 14));
    q = addPose(q, shake(t, HIT + 18, 3));
    q = addPose(q, hop(t, BIG, 16));
    q = addPose(q, nod(t, COMMONW + 6, 2));
    q = addPose(q, nod(t, FSW + 4, 2));
    // he steps back to read, so nothing of him is near the report during the test
    const back = interpolate(t, [TEST0 - 10, TEST0 + 8, STILL1 - 2, STILL1 + 12], [0, 170, 170, 0], { ...clamp, easing: eio });
    return { ...q, x: SX + back, y: SY + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "smug"],
      [W(0, 2), "excited"],
      [W(0, 5), "curious"],
      [W(0, 8), "worried"],
      [PROMISE - 2, "wink"],
      [E(1) + 2, "determined"],
      [TEST0 - 4, "thinking"],
      [TICKS[0] - 2, "determined"],
      [THREE, "excited"],
      [SURE - 2, "smug"],
      [C(4), "curious"],
      [HIT, "shock"],
      [HIT + 16, "sad"],
      [E(4) + 6, "worried"],
      [R1 - 2, "curious"],
      [BIG, "mindblown"],
      [C(6), "happy"],
      [SMALLW - 2, "thinking"],
      [COMMONW + 4, "excited"],
      [Q - 4, "curious"],
      [FSW, "wink"],
      [E(7) + 6, "smug"],
    ];
    let m: Mood = "smug";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= BIG - 2 && t < Q) return interpolate(t, [BIG - 2, BIG + 2], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const look = f >= Q ? 0.9 : f >= C(4) && f < HIT + 16 ? -0.6 : 0.3;

  // --- Mr. Trick: pops up behind the clipboard and sits on its top edge; drops back behind it at the reveal --------------
  const up = interpolate(fa, [TRICK_UP[0], TRICK_UP[1] - 4, TRICK_UP[1]], [0, 1.08, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const down = interpolate(fa, [BIG + 6, BIG + 20], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const trickGround = BY0 + 2 + (1 - up) * 300 + down * 340 - (fa >= BIG && fa < BIG + 8 ? Math.sin(((fa - BIG) / 8) * Math.PI) * 30 : 0);
  const tipHat = fa >= PROMISE + 6 && fa < E(1) + 10;
  const trickMood = fa >= HIT && fa < BIG ? "smug" : fa >= BIG ? "surprised" : "sly";
  const trickPose: Partial<Pose> = {
    ra1: tipHat ? 160 : fa >= HIT && fa < BIG ? 60 : 40,
    ra2: tipHat ? 70 : fa >= HIT && fa < BIG ? -120 : 30,
    la1: fa >= BIG ? -150 : 50,
    la2: fa >= BIG ? -20 : 30,
    head: 4,
  };

  const boss = bossAt(fa);
  const penAt: [number, number] = boss.holding ? [boss.hand[0] + 10, boss.hand[1] - 4] : PEN_REST;
  const penRot = boss.holding ? (fa >= HIT + 6 ? 70 : -10) : 0;

  const svg = (
    <>
      <PencilDefs f={fa} still={still} />
      <Paper />
      <g filter="url(#pencil)">
        <Room f={fa} />
        <Lamp />
        {up > 0.01 && down < 0.99 && <MrTrick x={930} ground={trickGround} scale={1.4} facing={-1} pose={trickPose} mood={trickMood as "sly" | "smug" | "surprised"} cane="none" />}
        <Board f={fa} />
        <Desk />
        {fa > BOSS0 && <Doodle x={boss.x} ground={FLOOR} scale={BS} facing={1} hair="bun" glasses face={boss.face} pose={boss.pose} />}
        <Pen at={penAt} rot={penRot} />
      </g>
      <Spark f={fa} trails={false} scale={S} facing={-1} base={{ x: SX, y: SY }} talk={(t) => (still ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={look} keys={sparkKeys} mod={sparkMod} />
      {/* Spark's answer: 3 (crossed out in red when the boss finds six) */}
      {fa >= THREE && fa < C(5) && (
        <g transform={`translate(${SX + 30} ${SY - 640}) scale(${interpolate(fa, [THREE, THREE + 8], [0.3, 1], { ...clamp, easing: eoB })}) rotate(-6)`}>
          <path d="M -80 -60 L 80 -60 Q 100 -60 100 -40 L 100 40 Q 100 60 80 60 L 30 60 L 50 100 L 0 60 L -80 60 Q -100 60 -100 40 L -100 -40 Q -100 -60 -80 -60 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <text x={0} y={34} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={100} fill={GRAPHITE}>
            3
          </text>
          {fa >= HIT + 2 && <path d="M -50 40 L 50 -40" stroke={RED} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(fa, [HIT + 2, HIT + 8], [0, 1], clamp)} />}
        </g>
      )}
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 96,
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
  const countF = <>COUNT THE <span style={{ color: RED }}>F</span>s</>;
  const smallLine =
    f < HIT
      ? ""
      : f < C(6)
        ? "The six Fs: FINISHED, FILES, OF, OF, SCIENTIFIC, OF."
        : f < Q - 6
          ? "Letter tests: people miss more letters in common small words like the and for (Greenberg et al. 1992). The tests used longer texts, not this sentence."
          : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(countF, 0, PROMISE - 6, 120)}
      {f >= TEST0 && f < STILL1 - 2 && top(countF, TEST0 + 4, STILL1 - 2, 120)}
      {f >= HIT && f < C(5) - 2 && top(<>THERE ARE <span style={{ color: RED }}>6</span></>, HIT, C(5) - 2, 120)}
      {f >= BIG && f < Q - 6 && top(<>3 <span style={{ color: RED }}>F</span>s HIDE IN <span style={{ color: RED }}>OF</span></>, BIG, Q - 6, 104)}
      {f >= E(7) + 6 && top(countF, E(7) + 6, VOICE_FRAMES + 200, 120)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1676, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(7) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1752, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: RED, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 12</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1584} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["letters", "miss", "last", "F", "three,", "six!", "of", "three", "small,", "common", "Fs"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2]} power={5} svg={svg} html={html} />;
};

// keep SOFT referenced (palette)
export const _soft = SOFT;
export const _loop = LOOP1;
