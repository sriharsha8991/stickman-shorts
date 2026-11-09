import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs } from "../shared/doodle";
import { MrTrick, type TrickMood } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T33 · "Why does the way home feel shorter?" Spark Got Tricked #14 (STORY, pencil look, 30.9 s).
// ONE world, one camera rig: a pencil country road on a sunny morning. Spark's HOME (a cottage, a signpost LAKE →, a bus stop)
// on the left, the road, a NEW PLACE (a lake where a family has a picnic) far on the right. Spark rides his bike out: the
// same screen time as the ride back, but he droops, sweats and yawns. He rides home grinning, feet off the pedals, and is
// sure the road home is shorter. Mr. Trick holds up a map: it is the SAME ROAD. A bus and a bike go past a scientist with a
// stopwatch at the bus stop (van de Ven et al. 2011 tested bus and bike trips). Her board explains the idea the authors
// favour: the trip out took longer than expected (dashed bar short, real bar longer), so people expected a long trip back
// (dashed bar long). The real trip back is the same length as before: it ends early against the long dashed bar, and the
// coral gap is where it "felt fast". Coral is the accent: the road on the map, the real bars, the gap. The cause is still
// debated (facts.md): said as "They think" and in the source line.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const eo = Easing.out(Easing.cubic);

const ACCENT = "#f2604c"; // coral: the road on the map, the real trips, the "felt fast" gap
const ACCENT2 = "#fbd3c9";
const SKY = "#e3edf0";
const GRASS = "#dfe3c6";
const CREAM = "#fffdf6";
const FLOOR = 1440;
const S = 2.4;
const SPY = FLOOR - 92.5 * S; // standing hip height
const RIDEY = FLOOR - 262; // hip height on the saddle

// --- timing (anchored to spoken words) --------------------------------------------------------------------------------
const PROMISE = C(1);
const TRICK_IN = C(1) - 4; // Mr. Trick pops up behind the signpost
const OUT0 = C(2) - 6; // the ride out starts with "The ride"
const OUT1 = E(2) + 10; // at the lake
const BACK0 = C(3) - 4; // the ride back starts with "But"
const BACK1 = E(3) + 14; // home again
const HOP = BACK1 + 2; // he hops off the bike
const MAP = E(3) + 18; // Mr. Trick holds up the map (the pause)
const MAP_OFF = C(4) + 6;
const TEST = C(4); // "Scientists tested this"
const CLICK = W(4, 1); // "tested": the stopwatch clicks
const BUS0 = W(4, 3) - 16; // the bus drives past on "bus"
const BIKE0 = W(4, 6) - 16; // a cyclist on "bike"
const BOARD = E(4) + 2; // the board's cover lifts
const R1E = W(5, 2); // "the trip": dashed EXPECTED bar, row 1
const R1R = W(5, 5); // "took longer": the real bar grows past it
const LONGER = W(5, 6);
const R2E = W(6, 3); // "expected a long": dashed bar, row 2
const DROP = E(6) + 2; // pause: lights + music drop, camera in
const R2R = C(7) + 2; // "It was shorter": the real bar grows
const R2STOP = W(7, 4) + 4; // "that,": it stops early
const HIT = W(7, 8); // "fast!"
export { HIT };
const Q = C(8);
const HOPON = E(8) - 12; // he hops back on for the loop
const LOOPTXT = VOICE_FRAMES - 22;

// --- places ----------------------------------------------------------------------------------------------------------------
const SIGNX = 470;
const BIKE_HOME = 860; // where the bike stands at home
const LAKE_X = 3720; // where he turns at the lake
const SPARK_STAND = 1050; // where he stands after hopping off (between the bike and the board)
const BOARD_X0 = 1230;
const BOARD_X1 = 1850;
const BOARD_Y0 = 760;
const BOARD_Y1 = 1250;
const SCI_X = 1960;
const STOP_X = 2100;

// bike position + facing over time (the two rides take the same time: 80 and 82 frames)
const bikeX = (f: number) => {
  if (f < OUT0) return BIKE_HOME;
  if (f < OUT1) return interpolate(f, [OUT0, OUT1], [BIKE_HOME, LAKE_X], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (f < BACK0) return LAKE_X;
  return interpolate(f, [BACK0, BACK1], [LAKE_X, BIKE_HOME], { ...clamp, easing: Easing.inOut(Easing.sin) });
};
const bikeFacing = (f: number) => (f >= OUT1 + 2 && f < HOPON + 6 ? -1 : 1);
const riding = (f: number) => f < HOP + 2 || f >= HOPON + 6;
const moving = (f: number) => (f > OUT0 && f < OUT1) || (f > BACK0 && f < BACK1);
// distance travelled (for the wheels and pedals)
const DIST = (() => {
  const a: number[] = [0];
  for (let i = 1; i <= VOICE_FRAMES + 40; i++) a.push(a[i - 1] + Math.abs(bikeX(i) - bikeX(i - 1)));
  return a;
})();
const distAt = (f: number) => DIST[Math.max(0, Math.min(DIST.length - 1, Math.floor(f)))];

// where Spark's hip is
const hopP = (f: number) => interpolate(f, [HOP, HOP + 14], [0, 1], { ...clamp, easing: eio });
const hopOnP = (f: number) => interpolate(f, [HOPON - 8, HOPON + 6], [0, 1], { ...clamp, easing: eio });
const sparkXY = (f: number): [number, number] => {
  const rideX = bikeX(f) - 25 * bikeFacing(f);
  if (f < HOP) return [rideX, RIDEY];
  if (f < HOPON - 8) {
    const p = hopP(f);
    const x0 = BIKE_HOME - 25 * -1;
    return [x0 + (SPARK_STAND - x0) * p, RIDEY + (SPY - RIDEY) * p - Math.sin(p * Math.PI) * 70];
  }
  const p = hopOnP(f);
  const x1 = BIKE_HOME - 25;
  return [SPARK_STAND + (x1 - SPARK_STAND) * p, SPY + (RIDEY - SPY) * p - Math.sin(p * Math.PI) * 70];
};
const sparkFacing = (f: number) => (f < HOP + 6 ? bikeFacing(f) : f < HOPON - 4 ? 1 : 1);

// --- two-link leg IK for pedalling (local coords: +x forward, +y down, hip at 0,0) -------------------------------------
const TH = 48 * S;
const SH = 46 * S;
const deg = (r: number) => (r * 180) / Math.PI;
const legIK = (dx: number, dy: number): [number, number] => {
  const d = Math.min(Math.hypot(dx, dy), TH + SH - 1);
  const phi = deg(Math.atan2(dx, dy));
  const a = deg(Math.acos((TH * TH + d * d - SH * SH) / (2 * TH * d)));
  const b = deg(Math.acos((SH * SH + d * d - TH * TH) / (2 * SH * d)));
  const a1 = phi + a;
  const shin = phi - b;
  return [a1, shin - a1];
};
const CRANK: [number, number] = [45, 172]; // crank centre from the hip
const CR = 38;
const crankAngle = (f: number) => distAt(f) / 42;
const pedalLegs = (f: number): Partial<Pose> => {
  const a = crankAngle(f);
  const [l1, l2] = legIK(CRANK[0] + Math.sin(a) * CR, CRANK[1] - Math.cos(a) * CR);
  const [r1, r2] = legIK(CRANK[0] + Math.sin(a + Math.PI) * CR, CRANK[1] - Math.cos(a + Math.PI) * CR);
  return { ll1: l1, ll2: l2, rl1: r1, rl2: r2 };
};
// stopped at home on the bike: one foot on the ground, one on the pedal
const footDown = (): Partial<Pose> => {
  const [l1, l2] = legIK(-55, 222);
  const [r1, r2] = legIK(CRANK[0] + 24, CRANK[1] - 30);
  return { ll1: l1, ll2: l2, rl1: r1, rl2: r2 };
};
// "wheee": feet off the pedals on the ride home
const feetOut: Partial<Pose> = { ll1: 70, ll2: -20, rl1: 55, rl2: -10 };
const RIDE_ARMS: Partial<Pose> = { ra1: 78, ra2: 4, la1: 70, la2: 8, lean: 14, head: 4 };

// --- camera rig: hold → move → hold, then follow the rides -------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [800, 1080, 1.42];
const HOME_MED: V3 = [820, 1060, 1.12];
const MAPV: V3 = [880, 1040, 1.1];
const WIDE: V3 = [1380, 1000, 0.82];
const BOARDV: V3 = [1380, 1030, 0.98];
const REVEAL: V3 = [1385, 1030, 1.1];
const QCU: V3 = [990, 1050, 1.38];
const F0B: V3 = [800, 1080, 1.42];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 4, E(0) + 24, HOME_MED), // pull back: Mr. Trick at the signpost
  k(BACK1 - 4, BACK1 + 14, MAPV), // home again: the map
  k(TEST - 10, TEST + 12, WIDE), // the bus stop, the road, the scientist
  k(BOARD - 6, BOARD + 16, BOARDV), // the board
  k(DROP, DROP + 20, REVEAL), // the pause: in on the board
  k(Q - 14, Q + 8, QCU), // the question: his face
  k(HOPON - 10, VOICE_FRAMES - 4, F0B), // the loop: frame 0's close-up
];
const rigAt = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const e = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * e, fy: cur.fy + (fy - cur.fy) * e, z: cur.z + (z - cur.z) * e };
  }
  return cur;
};
// during the rides the camera follows the bike (eased in and out of the follow)
const camAtRig = (f: number) => {
  const r = rigAt(f);
  const follow = interpolate(f, [OUT0 - 8, OUT0 + 12, BACK1 - 10, BACK1 + 8], [0, 1, 1, 0], { ...clamp, easing: eio });
  const tx = bikeX(f) + 140 * bikeFacing(f);
  const fx = r.fx + (tx - r.fx) * follow;
  const fy = r.fy + (1060 - r.fy) * follow;
  const z = r.z + (1.0 - r.z) * follow;
  return { x: fx - 540, y: fy - 960, z };
};

// --- the world --------------------------------------------------------------------------------------------------------
const Land: React.FC = () => (
  <g>
    <rect x={-3000} y={-3200} width={11000} height={3200 + FLOOR} fill={SKY} />
    {/* the sun: light comes from the upper left */}
    <circle cx={200} cy={420} r={95} fill="#fbe7a8" stroke={GRAPHITE} strokeWidth={7} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={200 + Math.cos(a) * 125} y1={420 + Math.sin(a) * 125} x2={200 + Math.cos(a) * 160} y2={420 + Math.sin(a) * 160} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />;
    })}
    {/* far hills */}
    <path d={`M -2000 1180 Q -900 820 200 1100 Q 1200 760 2300 1080 Q 3300 800 4300 1090 Q 5200 860 6500 1120 L 6500 ${FLOOR} L -2000 ${FLOOR} Z`} fill="#cfd8c0" stroke={GRAPHITE} strokeWidth={6} />
    <Hatch x={-2000} y={1150} w={8500} h={FLOOR - 1150} gap={44} o={0.1} width={3} />
    {/* clouds */}
    {[[900, 520], [2100, 430], [3300, 560], [4500, 470]].map(([x, y]) => (
      <path key={x} d={`M ${x - 120} ${y} q 20 -60 80 -40 q 40 -60 100 -10 q 70 -20 70 40 q 10 40 -40 40 l -190 0 q -50 0 -20 -30 Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    ))}
    {/* grass verge + the road (grey strip on the floor line) */}
    <rect x={-3000} y={FLOOR - 40} width={11000} height={40} fill={GRASS} />
    <rect x={-3000} y={FLOOR} width={11000} height={1600} fill="#9a958d" />
    <Hatch x={-3000} y={FLOOR + 6} w={11000} h={60} gap={28} color="#333" o={0.25} />
    {/* fence posts: every 300 px, they slide past when the camera follows */}
    {Array.from({ length: 22 }, (_, i) => 1150 + i * 300)
      .filter((x) => x < 3300 || x > 4300)
      .map((x) => (
        <g key={x}>
          <line x1={x} y1={FLOOR - 40} x2={x} y2={FLOOR - 160} stroke={GRAPHITE} strokeWidth={9} strokeLinecap="round" />
          <line x1={x - 150} y1={FLOOR - 130} x2={x + 150} y2={FLOOR - 130} stroke={GRAPHITE} strokeWidth={5} />
          <line x1={x - 150} y1={FLOOR - 85} x2={x + 150} y2={FLOOR - 85} stroke={GRAPHITE} strokeWidth={5} />
        </g>
      ))}
    {/* a few roadside trees between home and the lake */}
    {[2350, 2900].map((x) => (
      <g key={x}>
        <rect x={x - 16} y={FLOOR - 300} width={32} height={260} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
        <circle cx={x} cy={FLOOR - 360} r={120} fill="#c9d4b0" stroke={GRAPHITE} strokeWidth={7} />
        <Hatch x={x - 20} y={FLOOR - 450} w={120} h={170} gap={18} o={0.25} />
      </g>
    ))}
  </g>
);

const Home: React.FC = () => (
  <g transform="translate(-110 0)">
    {/* the cottage */}
    <rect x={40} y={980} width={480} height={FLOOR - 40 - 980} fill={PAPER} stroke={GRAPHITE} strokeWidth={9} />
    <Hatch x={330} y={985} w={185} h={FLOOR - 40 - 985} gap={22} o={0.2} />
    <path d="M 10 990 L 280 760 L 550 990 Z" fill="#e8c7b5" stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
    <rect x={110} y={1100} width={120} height={120} fill="#e8f0f2" stroke={GRAPHITE} strokeWidth={7} />
    <line x1={170} y1={1100} x2={170} y2={1220} stroke={GRAPHITE} strokeWidth={5} />
    <rect x={310} y={1150} width={120} height={FLOOR - 40 - 1150} fill={PAPER2} stroke={GRAPHITE} strokeWidth={7} />
    <circle cx={410} cy={1280} r={7} fill={GRAPHITE} />
    <rect x={160} y={880} width={240} height={70} rx={8} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <text x={280} y={935} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={54} fill={GRAPHITE}>
      HOME
    </text>
  </g>
);

const Signpost: React.FC = () => (
  <g>
    <line x1={SIGNX} y1={FLOOR - 30} x2={SIGNX} y2={880} stroke={GRAPHITE} strokeWidth={14} strokeLinecap="round" />
    <path d={`M ${SIGNX - 30} 900 L ${SIGNX + 230} 900 L ${SIGNX + 280} 950 L ${SIGNX + 230} 1000 L ${SIGNX - 30} 1000 Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} strokeLinejoin="round" />
    <text x={SIGNX + 110} y={970} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={60} fill={GRAPHITE}>
      LAKE
    </text>
  </g>
);

const BusStop: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <line x1={STOP_X} y1={FLOOR - 30} x2={STOP_X} y2={980} stroke={GRAPHITE} strokeWidth={10} />
    <circle cx={STOP_X} cy={950} r={55} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />
    <text x={STOP_X} y={968} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={GRAPHITE}>
      BUS
    </text>
    {/* the scientist: stopwatch up, clipboard under her arm */}
    <Doodle x={SCI_X + interpolate(f, [TEST - 40, TEST - 4], [700, 0], { ...clamp, easing: eio })} ground={FLOOR} scale={2.1} facing={-1} hair="bun" glasses face={f >= CLICK && f < BOARD + 20 ? "happy" : "plain"} pose={f >= TEST - 6 && f < BOARD ? { ra1: 150, ra2: 20, la1: -40, la2: -70, head: -6 } : { ra1: 80, ra2: 30, la1: -40, la2: -70 }} />
  </g>
);

const LakeSide: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <ellipse cx={4150} cy={FLOOR - 20} rx={560} ry={70} fill="#bcd6df" stroke={GRAPHITE} strokeWidth={8} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${3900 + i * 170} ${FLOOR - 25} q 30 -14 60 0 q 30 14 60 0`} stroke={GRAPHITE} strokeWidth={4} fill="none" opacity={0.6} />
    ))}
    {[3780, 4620].map((x) => (
      <g key={x}>
        <rect x={x - 18} y={FLOOR - 330} width={36} height={300} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
        <circle cx={x} cy={FLOOR - 400} r={140} fill="#c9d4b0" stroke={GRAPHITE} strokeWidth={7} />
      </g>
    ))}
    <line x1={3340} y1={FLOOR - 30} x2={3340} y2={1020} stroke={GRAPHITE} strokeWidth={12} strokeLinecap="round" />
    <rect x={3230} y={960} width={220} height={90} rx={8} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
    <text x={3340} y={1025} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={GRAPHITE}>
      LAKE
    </text>
    {/* a family having a picnic: the new place */}
    <rect x={3880} y={FLOOR - 60} width={360} height={26} rx={6} fill={PAPER} stroke={GRAPHITE} strokeWidth={5} />
    <Doodle x={3940} ground={FLOOR - 40} scale={1.9} facing={-1} hair="long" face="happy" pose={{ ra1: 150, ra2: 20, la1: -20, la2: 10 }} />
    <Doodle x={4060} ground={FLOOR - 40} scale={1.3} facing={-1} hair="curly" face="happy" pose={{ ra1: 150 + Math.sin(f * 0.4) * 15, ra2: 20, la1: -20, la2: 10 }} />
    <Doodle x={4180} ground={FLOOR - 40} scale={1.9} facing={-1} hair="bald" glasses face="plain" pose={{ ra1: 40, ra2: 30, la1: -30, la2: -20 }} />
  </g>
);

// a pencil bus with passengers, driving past on the road
const Bus: React.FC<{ x: number; f: number }> = ({ x, f }) => (
  <g transform={`translate(${x} ${Math.sin(f * 0.6) * 2})`}>
    {[-300, 220].map((dx) => (
      <g key={dx} transform={`translate(${dx} ${FLOOR - 10}) rotate(${f * 14})`}>
        <circle r={58} fill={GRAPHITE} />
        <circle r={24} fill={PAPER2} />
        <line x1={-24} y1={0} x2={24} y2={0} stroke={GRAPHITE} strokeWidth={6} />
      </g>
    ))}
    <rect x={-420} y={FLOOR - 400} width={800} height={360} rx={40} fill="#e9d9a9" stroke={GRAPHITE} strokeWidth={10} />
    <Hatch x={-410} y={FLOOR - 120} w={780} h={70} gap={20} o={0.2} />
    {[-360, -190, -20, 150].map((wx, i) => (
      <g key={wx}>
        <rect x={wx} y={FLOOR - 360} width={140} height={130} fill="#eef4f2" stroke={GRAPHITE} strokeWidth={6} />
        <circle cx={wx + 70} cy={FLOOR - 280} r={26} fill="#fffaf0" stroke={GRAPHITE} strokeWidth={5} />
        {i % 2 === 0 && <path d={`M ${wx + 44} ${FLOOR - 288} q 26 -34 52 0`} fill={GRAPHITE} />}
      </g>
    ))}
    <rect x={310} y={FLOOR - 360} width={60} height={200} fill="#eef4f2" stroke={GRAPHITE} strokeWidth={6} />
  </g>
);

// a pencil bike. Wheels + frame drawn behind Spark; the handlebar + cranks are drawn in his children (in front).
const WR = 84;
const Bike: React.FC<{ x: number; facing: number; f: number }> = ({ x, facing: fc, f }) => {
  const spin = (distAt(f) / WR) * (180 / Math.PI);
  const rear: [number, number] = [x - fc * 150, FLOOR - WR];
  const front: [number, number] = [x + fc * 150, FLOOR - WR];
  const crank: [number, number] = [x - fc * 25 + fc * CRANK[0], RIDEY + CRANK[1]];
  const seat: [number, number] = [x - fc * 32, RIDEY + 8];
  const head: [number, number] = [x + fc * 100, RIDEY - 2];
  const st = { stroke: GRAPHITE, strokeWidth: 8, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g>
      <ellipse cx={x} cy={FLOOR + 2} rx={250} ry={10} fill={GRAPHITE} opacity={0.2} />
      {[rear, front].map(([wx, wy], i) => (
        <g key={i} transform={`translate(${wx} ${wy}) rotate(${spin * fc})`}>
          <circle r={WR} fill="none" stroke={GRAPHITE} strokeWidth={9} />
          <circle r={WR - 8} fill="none" stroke={GRAPHITE} strokeWidth={3} opacity={0.6} />
          {[0, 60, 120].map((a) => (
            <line key={a} x1={Math.cos((a * Math.PI) / 180) * (WR - 6)} y1={Math.sin((a * Math.PI) / 180) * (WR - 6)} x2={-Math.cos((a * Math.PI) / 180) * (WR - 6)} y2={-Math.sin((a * Math.PI) / 180) * (WR - 6)} stroke={GRAPHITE} strokeWidth={3} />
          ))}
          <circle r={7} fill={GRAPHITE} />
        </g>
      ))}
      <polyline points={[rear, crank, [head[0] - fc * 6, head[1] + 40], front].map((p) => p.join(",")).join(" ")} {...st} />
      <polyline points={[rear, seat, crank].map((p) => p.join(",")).join(" ")} {...st} />
      <line x1={seat[0]} y1={seat[1]} x2={head[0] - fc * 6} y2={head[1] + 40} {...st} />
      <line x1={head[0] - fc * 6} y1={head[1] + 40} x2={head[0]} y2={head[1]} {...st} />
      <rect x={seat[0] - 34} y={seat[1] - 10} width={68} height={16} rx={8} fill={GRAPHITE} />
      <circle cx={crank[0]} cy={crank[1]} r={16} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      {/* a basket on the front */}
      <path d={`M ${head[0] + fc * 4} ${head[1] + 30} l ${fc * 70} 0 l ${-fc * 10} 60 l ${-fc * 50} 0 Z`} fill={PAPER} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

// --- the board: trip out vs trip back, dashed = what you expected, solid coral = the real trip ----------------------------
const BX = BOARD_X0 + 40; // bars start
const BAR_REAL = 330;
const BAR_EXP1 = 200;
const BAR_EXP2 = 520;
const Board: React.FC<{ f: number }> = ({ f }) => {
  const cover = interpolate(f, [BOARD, BOARD + 12], [0, 1], { ...clamp, easing: eo });
  const e1 = interpolate(f, [R1E, R1E + 12], [0, BAR_EXP1], { ...clamp, easing: eo });
  const r1 = interpolate(f, [R1R - 6, R1R + 26], [0, BAR_REAL], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const e2 = interpolate(f, [R2E - 8, R2E + 22], [0, BAR_EXP2], { ...clamp, easing: eo });
  const r2 = interpolate(f, [R2R, R2STOP], [0, BAR_REAL], { ...clamp, easing: Easing.out(Easing.quad) });
  const gap = interpolate(f, [R2STOP, R2STOP + 8], [0, 1], clamp);
  const fastPop = interpolate(f, [HIT - 2, HIT + 6], [0, 1], { ...clamp, easing: eoB });
  const dash = (y: number, w: number) => w > 2 && <line x1={BX} y1={y} x2={BX + w} y2={y} stroke={GRAPHITE} strokeWidth={18} strokeDasharray="34 18" strokeLinecap="round" />;
  const real = (y: number, w: number) => w > 2 && <rect x={BX} y={y - 18} width={w} height={36} rx={12} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />;
  const label = (x: number, y: number, t: string, o: number, size = 36, color = GRAPHITE) => (
    <text x={x} y={y} fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={color} opacity={o}>
      {t}
    </text>
  );
  const tiny = (x: number, y: number, fc = 1, o = 1) => (
    <g transform={`translate(${x} ${y}) scale(${fc} 1)`} opacity={o}>
      <circle cx={-16} cy={0} r={10} fill="none" stroke={GRAPHITE} strokeWidth={4} />
      <circle cx={16} cy={0} r={10} fill="none" stroke={GRAPHITE} strokeWidth={4} />
      <path d="M -16 0 L -2 -16 L 12 -16 L 16 0 M -2 -16 L 2 0" stroke={GRAPHITE} strokeWidth={4} fill="none" />
    </g>
  );
  return (
    <g>
      {/* easel legs */}
      <line x1={BOARD_X0 + 80} y1={BOARD_Y1} x2={BOARD_X0 + 40} y2={FLOOR - 20} stroke={GRAPHITE} strokeWidth={10} strokeLinecap="round" />
      <line x1={BOARD_X1 - 80} y1={BOARD_Y1} x2={BOARD_X1 - 40} y2={FLOOR - 20} stroke={GRAPHITE} strokeWidth={10} strokeLinecap="round" />
      <ellipse cx={(BOARD_X0 + BOARD_X1) / 2} cy={FLOOR - 16} rx={330} ry={10} fill={GRAPHITE} opacity={0.18} />
      <rect x={BOARD_X0} y={BOARD_Y0} width={BOARD_X1 - BOARD_X0} height={BOARD_Y1 - BOARD_Y0} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={9} />
      {cover > 0.05 && (
        <g opacity={cover}>
          {label(BOARD_X0 + 40, BOARD_Y0 + 70, "TRIP OUT", 1, 46)}
          {tiny(BOARD_X0 + 300, BOARD_Y0 + 56, 1, 1)}
          {dash(BOARD_Y0 + 120, e1)}
          {real(BOARD_Y0 + 175, r1)}
          {e1 > 10 && label(BX + e1 + 16, BOARD_Y0 + 134, "EXPECTED", interpolate(f, [R1E + 6, R1E + 12], [0, 1], clamp), 40)}
          {r1 > 10 && label(BX + BAR_REAL + 16, BOARD_Y0 + 191, "LONGER", interpolate(f, [LONGER, LONGER + 6], [0, 1], clamp), 46, ACCENT)}
          {r1 > 2 && r1 < BAR_REAL - 2 && tiny(BX + r1, BOARD_Y0 + 140, 1)}
          <line x1={BOARD_X0 + 30} y1={BOARD_Y0 + 232} x2={BOARD_X1 - 30} y2={BOARD_Y0 + 232} stroke={GRAPHITE} strokeWidth={4} opacity={0.4} />
          {f >= R2E - 14 && label(BOARD_X0 + 40, BOARD_Y0 + 305, "TRIP BACK", interpolate(f, [R2E - 14, R2E - 6], [0, 1], clamp), 46)}
          
          {gap > 0 && <rect x={BX + BAR_REAL} y={BOARD_Y0 + 390} width={(BAR_EXP2 - BAR_REAL) * gap} height={54} rx={10} fill={ACCENT2} stroke={ACCENT} strokeWidth={5} />}
          {dash(BOARD_Y0 + 355, e2)}
          {real(BOARD_Y0 + 417, r2)}
          {e2 > 10 && label(BX + 290, BOARD_Y0 + 318, "EXPECTED", interpolate(f, [R2E + 10, R2E + 16], [0, 1], clamp), 36)}
          {r2 > 2 && r2 < BAR_REAL - 2 && tiny(BX + r2, BOARD_Y0 + 382, 1)}
          {fastPop > 0 && (
            <g transform={`translate(${BX + (BAR_REAL + BAR_EXP2) / 2} ${BOARD_Y0 + 428}) scale(${fastPop})`}>
              <text x={0} y={0} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={ACCENT} stroke={CREAM} strokeWidth={7} paintOrder="stroke">
                FAST!
              </text>
            </g>
          )}
          {f >= R2R && label(BOARD_X0 + 40, BOARD_Y0 + 472, "REAL TRIPS: SAME LENGTH", interpolate(f, [R2STOP, R2STOP + 8], [0, 1], clamp), 34, "#6a645b")}
        </g>
      )}
      {/* the cover: a sheet of paper that flips up */}
      {cover < 1 && (
        <g transform={`translate(0 ${BOARD_Y0}) scale(1 ${1 - cover}) translate(0 ${-BOARD_Y0})`}>
          <rect x={BOARD_X0 + 10} y={BOARD_Y0 + 10} width={BOARD_X1 - BOARD_X0 - 20} height={BOARD_Y1 - BOARD_Y0 - 20} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
          <Hatch x={BOARD_X0 + 14} y={BOARD_Y0 + 14} w={BOARD_X1 - BOARD_X0 - 28} h={BOARD_Y1 - BOARD_Y0 - 28} gap={30} o={0.15} />
        </g>
      )}
    </g>
  );
};

// Mr. Trick's map: one road between HOME and LAKE, arrows both ways
const MapCard: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-190} y={-130} width={380} height={260} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
    <path d="M -130 40 Q -60 -40 0 20 Q 60 80 130 0" stroke={ACCENT} strokeWidth={16} fill="none" strokeLinecap="round" />
    <path d="M -50 -30 l 26 4 l -12 22" stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 70 64 l -26 -2 l 12 -22" stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x={-165} y={30} width={40} height={36} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <path d="M -170 32 L -145 10 L -120 32 Z" fill={GRAPHITE} />
    <ellipse cx={140} cy={-6} rx={34} ry={16} fill="#bcd6df" stroke={GRAPHITE} strokeWidth={5} />
    <text x={0} y={-80} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={GRAPHITE}>
      SAME ROAD
    </text>
  </g>
);

export const S01_SFX: SfxCue[] = [
  [4, "swish", 0.2],
  [E(0) + 4, "whoosh", 0.28],
  [TRICK_IN + 2, "pop", 0.35],
  [PROMISE + 8, "ding", 0.18],
  [OUT0, "whoosh_long", 0.22],
  [OUT1 + 2, "swish", 0.25],
  [BACK0 + 2, "whoosh", 0.35],
  [W(3, 7), "boing", 0.2],
  [BACK1, "swish", 0.25],
  [HOP + 12, "thud", 0.3],
  [MAP, "page", 0.4],
  [MAP + 10, "pop", 0.25],
  [TEST - 10, "whoosh", 0.28],
  [CLICK + 2, "tick", 0.45],
  [BUS0 + 6, "whoosh_long", 0.3],
  [BIKE0 + 10, "swish", 0.3],
  [BOARD, "page", 0.4],
  [R1E + 2, "scribble", 0.3],
  [R1R, "scribble", 0.3],
  [LONGER, "pop", 0.25],
  [R2E - 6, "scribble", 0.3],
  [DROP, "freeze", 0.2],
  [DROP + 2, "whoosh", 0.2],
  [R2R + 2, "scribble", 0.32],
  [R2STOP, "clink", 0.35],
  [HIT, "impact", 0.75],
  [HIT + 1, "stinger", 0.38],
  [Q - 14, "whoosh", 0.25],
  [HOPON, "boing", 0.18],
];

export const S01Road: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);

  const sparkKeys = gestureKeys([
    [0, { ...G.thinkChin, head: 8 }],
    [W(0, 4), { ...G.pointSide, ra1: 120, head: -8 }, "snap"], // "there,": points down the road
    [W(0, 7), { ...G.shrugBig }, "snap"], // "coming home"
    [W(0, 9), { ...G.handsHips, head: 8 }, "snap"], // "Why?"
    [PROMISE - 2, { ...G.pointUp, head: -10 }, "snap"], // "Wait for the last part."
    [E(1) + 4, { ...G.armsCrossed }, "snap"],
    [OUT0 - 2, RIDE_ARMS, "snap"], // off he goes
    [OUT1 - 4, { ...RIDE_ARMS, head: 20, lean: 22 }, "smooth"], // droops over the bars
    [OUT1 + 6, RIDE_ARMS, "snap"],
    [BACK0 + 8, { ...G.celebrate, lean: -6 }, "snap"], // "wheee"
    [BACK1 - 16, RIDE_ARMS, "snap"],
    [HOP + 14, { ...G.handsHips, head: -6 }, "snap"], // sure he was quicker
    [MAP + 8, { ...G.recoil }, "snap"], // the map: same road
    [MAP + 26, { ...G.facepalm }, "snap"],
    [TEST + 4, { ...G.pointSide }, "snap"], // the scientist
    [W(4, 4) - 2, { ...G.present, head: -6 }, "snap"], // "bus"
    [W(4, 6) - 2, { ...G.doublePoint, head: 4 }, "snap"], // "bike"
    [BOARD + 4, { ...G.thinkChin }, "snap"],
    [R1R - 2, { ...G.pointSide, ra1: 115, head: -8 }, "snap"], // "took longer"
    [E(5) - 4, { ...G.shrugBig, head: 10 }, "snap"],
    [C(6) + 6, { ...G.thinkChin, head: 6 }, "snap"],
    [R2E - 2, { ...G.pointSide, ra1: 105 }, "snap"], // "a long trip back"
    [DROP + 2, { ...G.rest, lean: 6, head: 10 }, "smooth"],
    [R2R, { ...G.leanIn, head: -4 }, "snap"],
    [HIT - 3, { ...G.mindBlown }, "snap"],
    [HIT + 28, { ...G.celebrate, head: -8 }, "snap"],
    [Q - 4, { ...G.doublePoint, ra1: 60, la1: 40, head: 6 }, "snap"],
    [W(8, 4), { ...G.beckon }, "snap"],
    [HOPON - 10, RIDE_ARMS, "snap"],
    [VOICE_FRAMES - 4, { ...G.thinkChin, head: 8 }, "snap"],
  ]);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(q, shake(t, MAP + 26, 3));
    q = addPose(q, nod(t, HIT + 2, 3));
    // legs: on the bike (pedalling, feet out, or one foot down), or standing
    if (riding(t)) {
      if (moving(t) && t > BACK0 + 8 && t < BACK1 - 16) q = { ...q, ...feetOut };
      else if (moving(t)) q = { ...q, ...pedalLegs(t) };
      else q = { ...q, ...footDown() };
    } else if (t >= HOP && t < HOP + 14) {
      q = { ...q, ll1: -30, ll2: 40, rl1: 30, rl2: 30 };
    } else if (t >= HOPON - 8 && t < HOPON + 6) {
      q = { ...q, ll1: -30, ll2: 40, rl1: 30, rl2: 30 };
    }
    // tired on the way out: the head droops more and more
    if (t > OUT0 && t < OUT1) q = { ...q, head: q.head + interpolate(t, [OUT0, OUT1], [0, 14], clamp) };
    const [x, y] = sparkXY(t);
    const bob = moving(t) ? Math.sin(crankAngle(t) * 2) * 3 : 0;
    return { ...q, x, y: y + bob };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "curious"],
      [W(0, 4), "skeptical"],
      [W(0, 9), "curious"],
      [PROMISE - 2, "determined"],
      [E(1) + 4, "smug"],
      [OUT0, "neutral"],
      [OUT0 + 30, "sad"], // "takes forever"
      [OUT1 + 4, "worried"],
      [BACK0 + 4, "excited"],
      [BACK1 - 10, "happy"],
      [HOP + 14, "smug"],
      [MAP + 8, "shock"],
      [MAP + 26, "angry"],
      [TEST + 4, "curious"],
      [BOARD + 4, "thinking"],
      [R1R - 2, "sad"],
      [C(6) + 6, "worried"],
      [DROP + 2, "thinking"],
      [R2R, "curious"],
      [HIT - 3, "mindblown"],
      [HIT + 28, "excited"],
      [Q - 4, "happy"],
      [W(8, 4), "wink"],
      [HOPON - 10, "curious"],
    ];
    let m: Mood = "curious";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // the bulb flickers while he is sure about the wrong idea, and lights on "fast!"
  const bulb = (t: number) => {
    if (t >= HIT && t < Q + 30) return interpolate(t, [HIT, HIT + 3], [0.5, 1], clamp);
    if (t >= HOP + 10 && t < MAP + 8) {
      const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
      return n > 0.6 ? 0.45 : 0.08;
    }
    return 0;
  };
  const talk = (t: number) => {
    // a yawn on the ride out
    const yawn = interpolate(t, [OUT1 - 30, OUT1 - 22, OUT1 - 12, OUT1 - 6], [0, 1, 1, 0], clamp);
    return Math.max(mouthAt(t), yawn);
  };

  // Mr. Trick: pops up behind the signpost, tips his hat; holds up the map; then sits on the signpost and watches
  const trickUp = interpolate(f, [TRICK_IN, TRICK_IN + 12], [0, 1], { ...clamp, easing: eoB });
  const tipHat = f >= PROMISE + 6 && f < E(1) + 6;
  const mapUp = interpolate(f, [MAP - 4, MAP + 8, MAP_OFF, MAP_OFF + 10], [0, 1, 1, 0], { ...clamp, easing: eo });
  const tMood: TrickMood = f >= HIT - 6 && f < Q + 10 ? "surprised" : f >= MAP && f < MAP_OFF ? "smug" : "sly";
  const trickX = f < MAP - 10 ? SIGNX + 60 : SIGNX + 70;

  const busX = interpolate(f, [BUS0 - 30, BUS0 + 60], [-700, 3000], clamp);
  const cyclistX = interpolate(f, [BIKE0 - 30, BIKE0 + 60], [-400, 2900], clamp);

  const dim = interpolate(f, [DROP, DROP + 8, R2STOP, HIT], [0, 0.32, 0.32, 0], clamp);

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Land />
        <Home />
        <LakeSide f={f} />
        <BusStop f={f} />
        <Board f={f} />
        {/* Mr. Trick, behind the signpost */}
        {trickUp > 0 && (
          <g transform={`translate(0 ${(1 - trickUp) * 260})`}>
            <MrTrick
              x={trickX}
              ground={FLOOR - 40}
              scale={1.5}
              facing={1}
              mood={tMood}
              cane={f >= MAP - 6 && f < MAP_OFF + 10 ? "none" : "down"}
              pose={tipHat ? { ra1: 165, ra2: 70, la1: -20, la2: 20, head: -4 } : f >= MAP - 6 && f < MAP_OFF + 10 ? { ra1: 150, ra2: 10, la1: -150, la2: -10, head: -4 } : { ra1: 40, ra2: 30, la1: -30, la2: 20, head: 6 }}
            />
          </g>
        )}
        <Signpost />
        {/* the bus + a cyclist drive past on the road behind Spark */}
        {f > BUS0 - 30 && f < BUS0 + 60 && <Bus x={busX} f={f} />}
        {f > BIKE0 - 30 && f < BIKE0 + 60 && (
          <g>
            <Doodle x={cyclistX - 20} ground={FLOOR - 60} scale={1.8} facing={1} hair="cap" face="happy" pose={{ ra1: 75, ra2: 5, la1: 65, la2: 8, lean: 12, ll1: 60, ll2: -60, rl1: 20, rl2: 40 }} />
            {[-90, 90].map((dx) => (
              <circle key={dx} cx={cyclistX + dx} cy={FLOOR - 52} r={50} fill="none" stroke={GRAPHITE} strokeWidth={7} />
            ))}
            <polyline points={`${cyclistX - 90},${FLOOR - 52} ${cyclistX},${FLOOR - 52} ${cyclistX + 70},${FLOOR - 160} ${cyclistX + 90},${FLOOR - 52}`} stroke={GRAPHITE} strokeWidth={7} fill="none" />
          </g>
        )}
        <Bike x={bikeX(f)} facing={bikeFacing(f)} f={f} />
      </g>
      {/* the map Mr. Trick holds up (coral road) */}
      {mapUp > 0.02 && (
        <g filter="url(#pencil)">
          <MapCard x={SIGNX + 230} y={840 - (1 - mapUp) * 120} s={1.15 * mapUp} />
        </g>
      )}
      {/* lights drop before the reveal; the board stays lit */}
      {dim > 0 && (
        <g>
          <mask id="t33spot">
            <rect x={-4000} y={-4000} width={12000} height={12000} fill="white" />
            <rect x={BOARD_X0 - 30} y={BOARD_Y0 - 30} width={BOARD_X1 - BOARD_X0 + 60} height={BOARD_Y1 - BOARD_Y0 + 60} rx={20} fill="black" />
            <ellipse cx={SPARK_STAND} cy={1150} rx={190} ry={330} fill="black" />
          </mask>
          <rect x={-4000} y={-4000} width={12000} height={12000} fill="#2a2620" opacity={dim} mask="url(#t33spot)" />
        </g>
      )}
      <Spark f={f} trails={false} scale={S} facing={sparkFacing} base={{ x: BIKE_HOME - 25, y: RIDEY }} talk={talk} bulb={bulb} mood={mood} look={f >= MAP && f < MAP_OFF ? -0.9 : f >= BOARD && f < Q ? 0.8 : 0.3} keys={sparkKeys} mod={sparkMod}>
        {(j: Joints) => {
          if (!riding(f)) return null;
          const fc = bikeFacing(f);
          const x = bikeX(f);
          const head: [number, number] = [x + fc * 100, RIDEY - 2];
          const crank: [number, number] = [x - fc * 25 + fc * CRANK[0], RIDEY + CRANK[1]];
          const onBars = moving(f) && !(f > BACK0 + 8 && f < BACK1 - 16);
          const bar: [number, number] = onBars ? [(j.rHand[0] + j.lHand[0]) / 2, (j.rHand[1] + j.lHand[1]) / 2] : [head[0] + fc * 10, head[1] - 30];
          const a = crankAngle(f);
          const pd = (o: number): [number, number] => [crank[0] + fc * Math.sin(a + o) * CR, crank[1] - Math.cos(a + o) * CR];
          return (
            <g filter="url(#pencil)">
              <line x1={head[0]} y1={head[1]} x2={bar[0]} y2={bar[1]} stroke={GRAPHITE} strokeWidth={8} strokeLinecap="round" />
              <line x1={bar[0] - fc * 26} y1={bar[1] - 4} x2={bar[0] + fc * 22} y2={bar[1] + 4} stroke={GRAPHITE} strokeWidth={10} strokeLinecap="round" />
              {[0, Math.PI].map((o) => {
                const p = pd(o);
                return (
                  <g key={o}>
                    <line x1={crank[0]} y1={crank[1]} x2={p[0]} y2={p[1]} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" />
                    <rect x={p[0] - 16} y={p[1] - 5} width={32} height={10} rx={3} fill={GRAPHITE} />
                  </g>
                );
              })}
              {/* sweat drops on the ride out */}
              {f > OUT0 + 30 && f < OUT1 + 10 &&
                [0, 1].map((i) => {
                  const ph = ((f + i * 9) % 18) / 18;
                  return <path key={i} d={`M ${j.headC[0] - fc * (40 + i * 20)} ${j.headC[1] - 30 + ph * 50} q -8 14 0 18 q 8 -4 0 -18`} fill="#bcd6df" stroke={GRAPHITE} strokeWidth={3} opacity={1 - ph} />;
                })}
              {/* speed lines on the ride home */}
              {f > BACK0 + 8 && f < BACK1 - 10 &&
                [0, 1, 2].map((i) => (
                  <line key={i} x1={x - fc * 160} y1={RIDEY - 60 + i * 60} x2={x - fc * (260 + ((f * 7 + i * 30) % 60))} y2={RIDEY - 60 + i * 60} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
                ))}
            </g>
          );
        }}
      </Spark>
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 104) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 120,
        textAlign: "center",
        fontFamily: FONT.title,
        fontWeight: 900,
        lineHeight: 1.02,
        fontSize: size,
        color: GRAPHITE,
        WebkitTextStroke: `18px ${PAPER}`,
        paintOrder: "stroke fill",
        opacity: interpolate(f, [at, at + 4, until - 8, until], [0, 1, 1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const hook = (
    <>
      SLOW THERE,
      <br />
      <span style={{ color: ACCENT }}>FAST</span> HOME?
    </>
  );
  const smallLine =
    f >= TEST && f < Q
      ? "van de Ven, van Rijswijk & Roy 2011 (Psychonomic Bulletin & Review): 3 small studies, a bus trip, a bike trip and a video. Expectation is the authors' idea; the cause is still debated."
      : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hook, -20, PROMISE - 6, 100)}
      {f >= LOOPTXT && top(hook, LOOPTXT, VOICE_FRAMES + 200, 100)}
      {f >= W(2, 7) && f < E(2) + 14 && top(<>TAKES <span style={{ color: ACCENT }}>FOREVER</span></>, W(2, 7), E(2) + 14, 110)}
      {f >= W(3, 6) && f < BACK1 && top(<>FEELS <span style={{ color: ACCENT }}>SO SHORT</span></>, W(3, 6), BACK1, 110)}
      {f >= HIT && f < Q && top(<>SO IT FELT <span style={{ color: ACCENT }}>FAST!</span></>, HIT, Q, 104)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1676, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(7) + 10 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1770, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 14</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1560} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["lose", "home.", "last", "forever.", "same", "short.", "bus", "bike", "longer", "expected.", "long", "shorter", "fast!", "trip"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: SKY }} />} cam={cam} hits={[HIT]} power={5} svg={svg} html={html} />;
};

export const _unused = { walkCycle };
