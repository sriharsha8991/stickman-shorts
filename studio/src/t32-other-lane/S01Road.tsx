import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake, wave } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine, SOFT, type Hair } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T32 · "Why does your lane lose the race to lane 2?" Spark Got Tricked #7 (STORY, pencil look, 28.5 s).
// ONE world, one camera rig: a pencil city road at rush hour, seen from the side. Lane 2 (far) above, lane 1 (near) below.
// Spark sits in a small open blue car. He changes lanes, and his old lane moves: Mr. Trick drives past in it and waves.
// A scientist puts the computer test on a big roadside screen: a top view of two lanes, same average speed.
// The reveal: a tight bunch of cars crawls past YOU for a long time; the cars YOU pass are gone quickly. Bars at the true ratio 43 : 33.
// Redelmeier & Tibshirani 1999 (Nature 401:35): see facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const ACCENT = "#2f6fd6"; // Spark's car = YOU
const ACCENT_D = "#1f4f9e";
const CREAM = "#fffdf6";
const G1 = 1440; // lane 1 wheels (near)
const G2 = 1290; // lane 2 wheels (far)
const PAVE = 1110;
const SX = 640; // Spark's car never moves forward: the traffic moves around it
const S = 2.4;
const S_BIG = 2.6;
const SLOT = 420;

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const CH0 = W(2, 1) - 2; // "change"
const CH1 = CH0 + 22;
const MOVES = W(2, 8); // "moves."
const TRICK0 = CH1 + 6;
const TRICK1 = E(2) + 24;
const SCI = C(3);
const SIM_ON = W(3, 7) - 2; // "a computer"
const SAME = W(4, 4);
const PAUSE = E(4) + 4;
const SLOW0 = C(5);
const HIT = W(5, 10); // "them!"
export { HIT };
const FAST0 = C(6);
const GONE = W(6, 6); // "gone"
const QUICK = W(6, 7);
const BIG = E(6) - 2; // the biggest reaction: both bars, mindblown
const Q = C(7);
const YOUQ = W(7, 1);
const BACK0 = W(7, 2) - 2; // "change lanes": he does it again
const BACK1 = BACK0 + 22;
const LANE2_GO = BACK1 + 2;
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [620, 1150, 1.8];
const WIDE: [number, number, number] = [540, 980, 1.0];
const LANES: [number, number, number] = [620, 1190, 1.5];
const BOARD: [number, number, number] = [540, 880, 1.0];
const REVEAL: [number, number, number] = [560, 600, 1.15];
const QCAM: [number, number, number] = [630, 1060, 1.45];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 12, PROMISE + 8, WIDE), // the whole road, Mr. Trick behind Spark
  k(CH0 - 20, CH0 - 2, LANES), // closer to the lanes; the change happens in the hold
  k(SCI - 10, SCI + 10, BOARD), // up: the scientist and the big screen
  k(PAUSE, PAUSE + 22, REVEAL), // the pause: a slow push into the screen
  k(Q - 18, Q + 2, QCAM), // back to Spark for the question
  k(BACK1 + 2, LOOP1 - 6, F0), // down to lane 1: frame 0
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

// --- Spark's lane: anticipation, swerve, overshoot, settle ---------------------------------------------------------------
const laneY = (f: number) => {
  const up = interpolate(f, [CH0 - 4, CH0, CH1 - 4, CH1, CH1 + 5], [G1, G1 + 7, G2 - 9, G2 + 3, G2], { ...clamp, easing: sio });
  if (f < BACK0 - 4) return up;
  return interpolate(f, [BACK0 - 4, BACK0, BACK1 - 4, BACK1, BACK1 + 5], [G2, G2 - 7, G1 + 9, G1 - 3, G1], { ...clamp, easing: sio });
};
const carTilt = (f: number) => {
  const a = interpolate(f, [CH0, CH1], [0, 1], clamp);
  const b = interpolate(f, [BACK0, BACK1], [0, 1], clamp);
  return -7 * Math.sin(Math.PI * a) + 7 * Math.sin(Math.PI * b) + wobble(f, CH1, 2.5, 6) + wobble(f, BACK1, 2.5, 6);
};

// --- the traffic: slots of 420 px; each lane has one empty slot (the gap) --------------------------------------------------
// lane 2: moves at frame 0 (a car passes behind Spark), stops with the gap at Spark, moves again after he leaves (loop).
const off2 = (f: number) =>
  interpolate(f, [0, CH0 - 6], [-SLOT, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [LANE2_GO, VOICE_FRAMES], [0, SLOT], { ...clamp, easing: Easing.in(Easing.quad) });
// lane 1: stopped, then moves the moment Spark leaves it (Mr. Trick drives past), stops with a gap at Spark again.
const off1 = (f: number) => interpolate(f, [TRICK0, TRICK1], [0, 2 * SLOT], { ...clamp, easing: Easing.inOut(Easing.quad) });

type Car = { k: number; hair: Hair; shade: number };
const LANE2: Car[] = [
  { k: -4, hair: "short", shade: 0.3 },
  { k: -3, hair: "long", shade: 0.4 },
  { k: -2, hair: "bald", shade: 0.25 },
  { k: -1, hair: "curly", shade: 0.45 },
  { k: 1, hair: "bun", shade: 0.3 },
  { k: 2, hair: "cap", shade: 0.4 },
  { k: 3, hair: "short", shade: 0.3 },
];
const LANE1: Car[] = [
  { k: -6, hair: "bun", shade: 0.35 },
  { k: -5, hair: "short", shade: 0.3 },
  { k: -4, hair: "long", shade: 0.4 },
  { k: -3, hair: "cap", shade: 0.3 },
  // k -1 is Mr. Trick's open car; k -2 is the gap Spark comes back to at the end
  { k: 1, hair: "curly", shade: 0.45 },
  { k: 2, hair: "bald", shade: 0.3 },
];
const TRICK_K = -1;

// --- drawings -------------------------------------------------------------------------------------------------------------
const City: React.FC = () => (
  <g>
    {[
      [-520, 520, 300],
      [-200, 380, 240],
      [60, 600, 210],
      [960, 470, 260],
      [1240, 560, 300],
      [1560, 420, 260],
    ].map(([x, top, w], i) => (
      <g key={i}>
        <rect x={x} y={top} width={w} height={PAVE - top} fill={PAPER2} />
        <SketchBox x={x} y={top} w={w} h={PAVE - top} lw={6} />
        <Hatch x={x} y={top} w={w} h={PAVE - top} gap={34} o={0.16} />
        {Array.from({ length: Math.floor((PAVE - top - 60) / 110) }, (_, r) =>
          Array.from({ length: Math.floor((w - 40) / 70) }, (_, c) => (
            <rect key={`${r}_${c}`} x={x + 28 + c * 70} y={top + 40 + r * 110} width={34} height={52} fill={CREAM} stroke={GRAPHITE} strokeWidth={3} />
          )),
        )}
      </g>
    ))}
    {/* a low evening sun: the light comes from the left */}
    <circle cx={-80} cy={250} r={90} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return <line key={i} x1={-80 + Math.cos(a) * 112} y1={250 + Math.sin(a) * 112} x2={-80 + Math.cos(a) * 150} y2={250 + Math.sin(a) * 150} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />;
    })}
  </g>
);

const Road: React.FC = () => (
  <g>
    {/* pavement + kerb */}
    <rect x={-800} y={PAVE} width={3400} height={70} fill={PAPER2} />
    <SketchLine x1={-800} y1={PAVE} x2={2600} y2={PAVE} w={6} />
    <SketchLine x1={-800} y1={PAVE + 66} x2={2600} y2={PAVE + 66} w={8} />
    {/* the road */}
    <rect x={-800} y={PAVE + 70} width={3400} height={300} fill="#e4dbc6" />
    <Hatch x={-800} y={PAVE + 70} w={3400} h={300} gap={44} o={0.12} />
    {Array.from({ length: 22 }, (_, i) => (
      <rect key={i} x={-760 + i * 160} y={1316} width={86} height={9} rx={4} fill={CREAM} stroke={GRAPHITE} strokeWidth={3} />
    ))}
    <SketchLine x1={-800} y1={1462} x2={2600} y2={1462} w={8} />
    {/* lane numbers painted on the road */}
    {[
      ["2", 1258],
      ["1", 1410],
    ].map(([n, y]) => (
      <text key={n} x={430} y={y} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={120} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} transform={`translate(0 ${y}) scale(1 0.5) translate(0 ${-Number(y)})`}>
        {n}
      </text>
    ))}
  </g>
);

const Driver: React.FC<{ x: number; y: number; hair: Hair }> = ({ x, y, hair }) => (
  <g>
    {hair === "long" && <path d={`M ${x - 26} ${y + 26} Q ${x - 30} ${y - 30} ${x} ${y - 28} Q ${x + 30} ${y - 30} ${x + 26} ${y + 26} Z`} fill={GRAPHITE} />}
    <circle cx={x} cy={y} r={22} fill="#fffaf0" stroke={GRAPHITE} strokeWidth={5} />
    {hair === "short" && <path d={`M ${x - 22} ${y - 2} Q ${x - 18} ${y - 32} ${x + 4} ${y - 26} Q ${x + 22} ${y - 22} ${x + 22} ${y - 4} Q ${x} ${y - 16} ${x - 22} ${y - 2} Z`} fill={GRAPHITE} />}
    {hair === "bun" && <circle cx={x - 6} cy={y - 28} r={10} fill={GRAPHITE} />}
    {hair === "curly" && [-18, -6, 6, 18].map((d, i) => <circle key={i} cx={x + d} cy={y - 20 + Math.abs(d) * 0.4} r={8} fill={GRAPHITE} />)}
    {hair === "cap" && <path d={`M ${x - 22} ${y - 6} Q ${x} ${y - 34} ${x + 22} ${y - 6} L ${x + 38} ${y - 4} L ${x - 22} ${y - 6} Z`} fill={GRAPHITE} />}
    <circle cx={x + 9} cy={y - 2} r={3} fill={GRAPHITE} />
    <line x1={x + 4} y1={y + 10} x2={x + 14} y2={y + 10} stroke={GRAPHITE} strokeWidth={3} strokeLinecap="round" />
  </g>
);

/** A side-view doodle car facing right. `open` = no roof (Spark's and Mr. Trick's). */
const SideCar: React.FC<{ x: number; g: number; fill?: string; shade?: number; open?: boolean; hair?: Hair; rot?: number; part?: "all" | "back" | "front" }> = ({
  x,
  g,
  fill = CREAM,
  shade = 0.3,
  open,
  hair,
  rot = 0,
  part = "all",
}) => {
  const back = part !== "front";
  const front = part !== "back";
  return (
    <g transform={`rotate(${rot} ${x} ${g - 40})`}>
      {back && <ellipse cx={x} cy={g + 2} rx={160} ry={11} fill={GRAPHITE} opacity={0.22} />}
      {back && !open && (
        <g>
          <path d={`M ${x - 112} ${g - 122} L ${x - 78} ${g - 204} L ${x + 46} ${g - 204} L ${x + 92} ${g - 122} Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M ${x - 90} ${g - 128} L ${x - 66} ${g - 190} L ${x + 38} ${g - 190} L ${x + 74} ${g - 128} Z`} fill="#dfe5ea" stroke={GRAPHITE} strokeWidth={3} />
          {hair && <Driver x={x + 6} y={g - 152} hair={hair} />}
          <line x1={x - 10} y1={g - 200} x2={x - 10} y2={g - 124} stroke={GRAPHITE} strokeWidth={6} />
        </g>
      )}
      {back && open && (
        <g>
          {/* seat back + windscreen */}
          <path d={`M ${x - 128} ${g - 120} L ${x - 140} ${g - 186} Q ${x - 132} ${g - 200} ${x - 116} ${g - 190} L ${x - 104} ${g - 120} Z`} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${x + 74} ${g - 124} L ${x + 104} ${g - 196}`} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />
          <path d={`M ${x + 80} ${g - 124} L ${x + 106} ${g - 186} L ${x + 92} ${g - 124} Z`} fill="#dfe5ea" opacity={0.8} />
        </g>
      )}
      {front && (
        <g>
          <path
            d={`M ${x - 150} ${g - 44} L ${x - 152} ${g - 108} Q ${x - 150} ${g - 126} ${x - 128} ${g - 126} L ${x + 92} ${g - 126} Q ${x + 140} ${g - 112} ${x + 154} ${g - 84} L ${x + 154} ${g - 46} Q ${x + 152} ${g - 36} ${x + 140} ${g - 36} L ${x - 140} ${g - 36} Q ${x - 150} ${g - 36} ${x - 150} ${g - 44} Z`}
            fill={fill}
            stroke={GRAPHITE}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {fill === CREAM && <Hatch x={x - 150} y={g - 84} w={304} h={46} gap={14} o={shade} width={2.5} />}
          <line x1={x - 20} y1={g - 120} x2={x - 20} y2={g - 44} stroke={GRAPHITE} strokeWidth={4} opacity={0.7} />
          <line x1={x + 4} y1={g - 96} x2={x + 26} y2={g - 96} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />
          <circle cx={x + 146} cy={g - 92} r={9} fill={CREAM} stroke={GRAPHITE} strokeWidth={3} />
          {[-92, 96].map((d) => (
            <g key={d}>
              <circle cx={x + d} cy={g - 30} r={31} fill={GRAPHITE} />
              <circle cx={x + d} cy={g - 30} r={12} fill={PAPER} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

// --- the computer test on the big screen (top view; cars drive right) -----------------------------------------------------
const DY = -150; // the board sits high, so Spark's head stays under it
const BB = { x: 140, y: 290 + DY, w: 800, h: 590 };
const SCR = { x: 170, y: 320 + DY, w: 740, h: 530 };
const L2Y = 470 + DY; // lane 2 centre in the screen
const L1Y = 570 + DY; // lane 1 centre
const YOU_X = 540;
const BAR_X = 200;
const BAR_W = 640;
const TopCar: React.FC<{ x: number; y: number; you?: boolean; hi?: number }> = ({ x, y, you, hi = 0 }) => (
  <g>
    {hi > 0.01 && <rect x={x - 58} y={y - 36} width={116} height={72} rx={20} fill="none" stroke={GRAPHITE} strokeWidth={5} strokeDasharray="10 8" opacity={hi} />}
    <rect x={x - 46} y={y - 26} width={92} height={52} rx={14} fill={you ? ACCENT : CREAM} stroke={GRAPHITE} strokeWidth={5} />
    <rect x={x - 8} y={y - 19} width={30} height={38} rx={6} fill={you ? ACCENT_D : "#dfe5ea"} stroke={GRAPHITE} strokeWidth={3} />
  </g>
);

const Screen: React.FC<{ f: number }> = ({ f }) => {
  const on = interpolate(f, [SIM_ON, SIM_ON + 8, BACK1, BACK1 + 8], [0, 1, 1, 0], clamp);
  // the road under YOU scrolls left: slow while YOU is stuck, fast while YOU passes
  const speed = (t: number) => (t < SLOW0 ? 3 : t < FAST0 - 8 ? 1 : t < QUICK + 6 ? 10 : 2);
  let scroll = 0;
  for (let t = SIM_ON; t < f; t++) scroll += speed(t);
  // three cars in a tight bunch crawl past YOU (slow part); later YOU passes three cars that are far apart (fast part)
  const slow = (j: number) => 400 - j * 115 + 5 * Math.max(0, Math.min(f, QUICK + 30) - SLOW0);
  const fast = (j: number) => 660 + j * 230 - 13 * Math.max(0, f - FAST0);
  const beside = (x: number) => (Math.abs(x - YOU_X) < 92 ? 1 : 0);
  const bar1 = interpolate(f, [SLOW0, HIT], [0, 1], clamp);
  const bar2 = interpolate(f, [FAST0, QUICK], [0, 33 / 43], clamp);
  const bars = interpolate(f, [SLOW0 - 6, SLOW0 + 4], [0, 1], clamp);
  const sameK = interpolate(f, [SAME - 4, SAME + 6], [0, 1], { ...clamp, easing: eoB });
  const label = (text: string, x: number, y: number, size = 34, color = GRAPHITE, anchor: "start" | "middle" | "end" = "start") => (
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={color}>
      {text}
    </text>
  );
  return (
    <g>
      {/* posts */}
      <rect x={300} y={BB.y + BB.h} width={26} height={PAVE + 30 - BB.y - BB.h} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
      <rect x={760} y={BB.y + BB.h} width={26} height={PAVE + 30 - BB.y - BB.h} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
      <rect x={BB.x} y={BB.y} width={BB.w} height={BB.h} rx={22} fill={GRAPHITE} />
      <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={8} fill={on > 0.5 ? CREAM : "#ebe3d1"} />
      {on < 0.5 && <Hatch x={SCR.x} y={SCR.y} w={SCR.w} h={SCR.h} gap={60} o={0.1} />}
      <clipPath id="scr">
        <rect x={SCR.x} y={SCR.y} width={SCR.w} height={SCR.h} rx={8} />
      </clipPath>
      {on > 0.01 && (
        <g clipPath="url(#scr)" opacity={on}>
          <rect x={SCR.x} y={SCR.y} width={SCR.w} height={72} fill={PAPER2} />
          {label("COMPUTER TEST", 540, SCR.y + 52, 44, GRAPHITE, "middle")}
          {/* the road, from above */}
          <rect x={SCR.x} y={L2Y - 55} width={SCR.w} height={210} fill="#e4dbc6" />
          <line x1={SCR.x} y1={L2Y - 55} x2={SCR.x + SCR.w} y2={L2Y - 55} stroke={GRAPHITE} strokeWidth={6} />
          <line x1={SCR.x} y1={L1Y + 55} x2={SCR.x + SCR.w} y2={L1Y + 55} stroke={GRAPHITE} strokeWidth={6} />
          {Array.from({ length: 12 }, (_, i) => {
            const x = SCR.x + ((((i * 90 - scroll) % 1080) + 1080) % 1080) - 100;
            return <rect key={i} x={x} y={L2Y + 46} width={50} height={8} rx={3} fill={GRAPHITE} opacity={0.7} />;
          })}
          {label("2", SCR.x + 16, L2Y + 14, 38, SOFT)}
          {label("1", SCR.x + 16, L1Y + 14, 38, SOFT)}
          {/* lane 1: the cars around YOU keep pace with YOU */}
          <TopCar x={YOU_X - 200} y={L1Y} />
          <TopCar x={YOU_X + 210} y={L1Y} />
          {/* lane 2 */}
          {f < FAST0 && [0, 1, 2].map((j) => <TopCar key={j} x={slow(j)} y={L2Y} hi={f >= SLOW0 ? beside(slow(j)) : 0} />)}
          {f >= FAST0 - 10 && [0, 1, 2].map((j) => <TopCar key={`f${j}`} x={fast(j)} y={L2Y} hi={beside(fast(j))} />)}
          <TopCar x={YOU_X} y={L1Y} you />
          {label("YOU", YOU_X, L1Y + 96, 34, ACCENT, "middle")}
          {/* same average speed: two equal arrows */}
          {sameK > 0.01 && f < SLOW0 && (
            <g opacity={Math.min(1, sameK)}>
              {label("SAME AVERAGE SPEED", 540, 760 + DY, 50, GRAPHITE, "middle")}
            </g>
          )}
          {/* the time bars: the true ratio from the study, 43 to 33 */}
          {bars > 0.01 && (
            <g opacity={bars}>
              {label("THEY PASSED YOU", BAR_X, 706 + DY, 34)}
              <rect x={BAR_X} y={716 + DY} width={BAR_W} height={34} rx={8} fill="none" stroke={SOFT} strokeWidth={3} />
              <rect x={BAR_X} y={716 + DY} width={BAR_W * bar1} height={34} rx={8} fill={GRAPHITE} />
              {label("YOU PASSED THEM", BAR_X, 792 + DY, 34, ACCENT)}
              {f >= FAST0 - 4 && <rect x={BAR_X} y={802 + DY} width={BAR_W} height={34} rx={8} fill="none" stroke={SOFT} strokeWidth={3} />}
              <rect x={BAR_X} y={802 + DY} width={BAR_W * bar2} height={34} rx={8} fill={ACCENT} />
              {f >= HIT && (
                <g transform={`translate(${BAR_X + BAR_W - 10} ${702 + DY}) scale(${interpolate(f, [HIT, HIT + 8], [0.2, 1], { ...clamp, easing: eoB })}) rotate(-6)`}>
                  <rect x={-150} y={-34} width={160} height={46} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
                  {label("LONGER", -70, 2, 34, GRAPHITE, "middle")}
                </g>
              )}
              {f >= QUICK && (
                <g transform={`translate(${BAR_X + BAR_W * (33 / 43) + 14} ${832 + DY}) scale(${interpolate(f, [QUICK, QUICK + 8], [0.2, 1], { ...clamp, easing: eoB })}) rotate(-4)`}>
                  {label("SHORTER", 0, 0, 34, ACCENT)}
                </g>
              )}
            </g>
          )}
        </g>
      )}
      {/* cable down to the scientist's laptop */}
      <path d={`M 230 ${BB.y + BB.h} C 230 ${BB.y + BB.h + 80} 160 ${BB.y + BB.h + 70} 180 ${BB.y + BB.h + 150}`} stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [4, "horn", 0.35],
  [W(0, 4), "pop", 0.25],
  [PROMISE - 10, "whoosh", 0.3],
  [PROMISE + 6, "pop", 0.3],
  [CH0 - 1, "whoosh", 0.4],
  [CH1, "thud", 0.3],
  [TRICK0 + 30, "horn", 0.4],
  [MOVES, "boing", 0.3],
  [SCI - 8, "whoosh_long", 0.28],
  [SCI + 14, "swish", 0.24],
  [SIM_ON, "scribble", 0.4],
  [SAME, "ding", 0.3],
  [PAUSE + 2, "whoosh_long", 0.25],
  [W(5, 3), "tick", 0.3],
  [HIT, "impact", 0.85],
  [HIT + 3, "stamp", 0.5],
  [FAST0 + 2, "whoosh", 0.4],
  [GONE, "swish", 0.3],
  [QUICK, "pop", 0.4],
  [BIG, "ding", 0.55],
  [Q - 12, "whoosh", 0.25],
  [YOUQ, "pop", 0.3],
  [BACK0, "whoosh", 0.4],
  [BACK1, "thud", 0.3],
  [LANE2_GO + 30, "horn", 0.3],
];

export const S01Road: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const ly = laneY(f);
  const sAt = (t: number) => interpolate(t, [PAUSE + 4, PAUSE + 24, Q - 14, Q + 4], [S, S_BIG, S_BIG, S], { ...clamp, easing: sio });

  // --- Spark ------------------------------------------------------------------------------------------------------------
  const WHEEL: Partial<Pose> = { ra1: 72, ra2: 22, la1: 62, la2: 30, lean: 6, head: -2 };
  const sparkKeys = gestureKeys([
    [0, { ...G.handsHips, head: -10, lean: -4 }],
    [W(0, 7), { ...G.pointSide, ra1: 128, head: -14 }, "snap"], // at lane 2
    [E(0) + 4, { ...G.armsCrossed, head: -6 }, "snap"],
    [PROMISE - 2, { ...G.pointUp, head: -8 }, "snap"],
    [E(1) + 2, G.rest],
    [CH0 - 6, WHEEL, "snap"],
    [CH1 + 2, { ...G.armsCrossed, head: 4 }, "snap"],
    [W(2, 7) - 2, { ...G.recoil, head: 10 }, "snap"],
    [TRICK1 - 10, { ...G.handsHips, head: 12 }, "snap"],
    [SCI, { ...G.pointSide, ra1: 100, head: -4 }, "snap"], // at the scientist (he turns left)
    [SIM_ON, { ...G.pointUp, ra1: 150, head: -16 }, "snap"],
    [SAME - 2, { ...G.thinkChin, head: -10 }, "snap"],
    [PAUSE + 4, { ...G.leanIn, head: -14 }, "snap"],
    [W(5, 2), { ...G.pointUp, ra1: 140, head: -16 }, "snap"],
    [HIT, { ...G.recoil, head: -14 }, "snap"],
    [HIT + 12, { ...G.presentBoth, la1: -110, ra1: 110, head: -14 }, "snap"],
    [FAST0, { ...G.pointUp, ra1: 136, head: -16 }, "snap"],
    [BIG, { ...G.mindBlown, head: -10 }, "snap"],
    [Q - 4, { ...G.leanIn, ra1: 80, ra2: 10 }, "snap"],
    [YOUQ, { ...G.doublePoint, lean: 8 }, "snap"],
    [BACK0 - 4, WHEEL, "snap"],
    [BACK1 + 8, { ...G.handsHips, head: -10, lean: -4 }, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, shake(t, W(2, 7) + 2, 3));
    q = addPose(q, nod(t, SAME + 6, 2));
    q = addPose(q, hop(t, HIT, 10));
    q = addPose(q, hop(t, BIG, 12));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    return { ...q, x: SX - 34, y: laneY(t) - 112 + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "angry"],
      [E(0) + 4, "skeptical"],
      [PROMISE - 2, "wink"],
      [CH0 - 6, "determined"],
      [CH1 + 2, "smug"],
      [W(2, 7) - 2, "shock"],
      [TRICK1 - 10, "angry"],
      [SCI, "curious"],
      [SAME - 2, "thinking"],
      [PAUSE + 4, "curious"],
      [W(5, 2), "worried"],
      [HIT, "shock"],
      [HIT + 12, "excited"],
      [BIG, "mindblown"],
      [Q - 4, "curious"],
      [YOUQ, "wink"],
      [BACK0 - 4, "determined"],
      [BACK1 + 8, "angry"],
    ];
    let m: Mood = "angry";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= HIT && t < BACK0) return interpolate(t, [HIT, HIT + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const facing = (t: number) => (t >= SCI && t < SIM_ON ? -1 : 1);
  const look = f < E(0) + 4 ? 0.8 : f >= SIM_ON && f < Q - 4 ? 0.6 : 0.3;

  // --- Mr. Trick: his open car is behind Spark in lane 1; it moves the moment Spark leaves --------------------------------
  const trickX = SX + TRICK_K * SLOT + off1(f);
  const trickWave = f >= TRICK0 + 18 && f < TRICK1 + 30;
  const trickMood = f >= HIT && f < Q ? "surprised" : trickWave || f >= Q ? "smug" : "sly";
  const trickPose: Partial<Pose> = {
    ra1: trickWave ? 150 : 40,
    ra2: trickWave ? 20 : 30,
    la1: 60,
    la2: 30,
    head: trickWave ? -8 : 4,
    ...(trickWave ? wave(f, TRICK0 + 18, 70) : {}),
  };

  // --- the scientist ----------------------------------------------------------------------------------------------------
  const sciX = interpolate(f, [SCI - 4, SCI + 26], [-160, 190], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sciWalk = f >= SCI - 4 && f < SCI + 26;
  const sciPose: Partial<Pose> = { ra1: 62, ra2: 66, la1: 52, la2: 70, head: f >= SIM_ON - 4 ? -16 : 6, ...(sciWalk ? { lean: 6 } : {}) };

  const lane2 = (part: "back" | "front") =>
    LANE2.map((c) => {
      const x = SX + c.k * SLOT + off2(f);
      if (x < -500 || x > 1700) return null;
      return <SideCar key={`${c.k}${part}`} x={x} g={G2} hair={c.hair} shade={c.shade} part={part} />;
    });
  const lane1 = (part: "back" | "front") =>
    LANE1.map((c) => {
      const x = SX + c.k * SLOT + off1(f);
      if (x < -500 || x > 1700) return null;
      return <SideCar key={`${c.k}${part}`} x={x} g={G1} hair={c.hair} shade={c.shade} part={part} />;
    });
  const inLane2 = ly < (G1 + G2) / 2;
  const sparkClip = ly - 66;

  const sparkCar = (
    <g>
      <SideCar x={SX} g={ly} fill={ACCENT} open rot={carTilt(f)} part="back" />
      <clipPath id="sparkSeat">
        <rect x={SX - 600} y={-800} width={1200} height={sparkClip + 800} />
      </clipPath>
      <g clipPath="url(#sparkSeat)">
        <Spark f={f} trails={false} scale={sAt(f)} facing={facing} base={{ x: SX - 34, y: ly - 112 }} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={look} keys={sparkKeys} mod={sparkMod} />
      </g>
      <SideCar x={SX} g={ly} fill={ACCENT} open rot={carTilt(f)} part="front" />
    </g>
  );
  const trickCar = (
    <g>
      <SideCar x={trickX} g={G1} open part="back" />
      <clipPath id="trickSeat">
        <rect x={trickX - 600} y={-800} width={1200} height={G1 - 66 + 800} />
      </clipPath>
      <g clipPath="url(#trickSeat)">
        <MrTrick x={trickX - 30} ground={G1 - 104 + 92.5 * 1.7} scale={1.7} facing={1} pose={trickPose} mood={trickMood as "sly" | "smug" | "surprised"} cane="none" />
      </g>
      <SideCar x={trickX} g={G1} open part="front" />
    </g>
  );

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <City />
        <Road />
      </g>
      <Screen f={f} />
      <g filter="url(#pencil)">
        {f >= SCI - 6 && (
          <g>
            <Doodle x={sciX} ground={PAVE + 60} scale={1.6} facing={1} hair="bun" glasses face={f >= SAME ? "happy" : "plain"} pose={sciPose} />
            <g transform={`translate(${sciX + 64} ${PAVE - 150}) rotate(-8)`}>
              <rect x={-40} y={-30} width={80} height={52} rx={6} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
              <rect x={-48} y={22} width={96} height={10} rx={4} fill={GRAPHITE} />
            </g>
          </g>
        )}
        {lane2("back")}
        {lane2("front")}
      </g>
      {inLane2 && sparkCar}
      <g filter="url(#pencil)">
        {lane1("back")}
        {lane1("front")}
        {trickX > -500 && trickX < 1700 && trickCar}
      </g>
      {!inLane2 && sparkCar}
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 116) => (
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
  const slow = (
    <>
      MY LANE IS <span style={{ color: ACCENT }}>SLOW</span>
    </>
  );
  const smallLine =
    f < SIM_ON
      ? ""
      : f < HIT
        ? "Computer test with two lanes. Nature, 1999."
        : f < Q
          ? "Same number of passes. Being passed: 43 s. Passing: 33 s. Per 10 minutes."
          : f < BACK1
            ? "In a video test, most drivers said the next lane was faster. It was a bit slower."
            : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 4 && top(slow, 0, PROMISE - 4)}
      {f >= BACK1 + 4 && top(slow, BACK1 + 4, VOICE_FRAMES + 200)}
      {f >= HIT && f < FAST0 && top(<>PASSED FOR <span style={{ color: "#5a5650" }}>LONGER</span></>, HIT, FAST0, 104)}
      {f >= QUICK && f < Q - 6 && top(<>YOU PASS <span style={{ color: ACCENT }}>QUICKLY</span></>, QUICK, Q - 6, 104)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1684, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(7) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 7</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["lane", "lose", "2?", "last", "change", "moves.", "computer.", "same", "longer", "them!", "gone", "quickly.", "often?"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2]} power={5} svg={svg} html={html} />;
};
