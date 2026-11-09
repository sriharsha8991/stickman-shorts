import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, type Hair, type DoodleFace } from "../shared/doodle";
import { MrTrick, type TrickMood } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T15 · "How many people does it take to share a birthday?" Spark Got Tricked #15 (PUZZLE, pencil look, 29.4 s).
// ONE world, one camera rig: a pencil office on a birthday afternoon. A round party table with a cake in the middle, a door
// in the back wall where Mr. Trick lets people in, a wall sign that counts them, and a wall calendar (365 DAYS) next to Spark.
// The first two to arrive (one of them is YOU) get a dashed line: SAME BIRTHDAY? Spark flips a coin on "fifty-fifty" and
// says it takes hundreds of people (bulb flickers: he is wrong). Mr. Trick keeps letting people in; the 23rd sits down on
// "twenty-three" and the door shuts: ONLY 23. Then lines join two other people (any two, not just you). After the drop,
// marigold lines join every pair around the table: 253 lines, the sign counts them, and the table becomes a web (the reveal).
// 50.7% for 23 people (365 equal days) and 253 pairs = 23 × 22 ÷ 2 were computed for facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const eo = Easing.out(Easing.cubic);

const ACCENT = "#f39a0b"; // marigold: candle flames, the pair lines, the counts
const ACCENT2 = "#fde3b0";
const WALL = "#ede6d4";
const FLOORC = "#d9cfba";
const CREAM = "#fffdf6";
const FLOOR = 1440;
const BACK = 720; // back wall meets the floor
const S = 2.4;
const SPY = FLOOR - 92.5 * S;
const SPARK_X = 1530;

// --- timing (anchored to spoken words) --------------------------------------------------------------------------------
const PROMISE = C(1);
const TRICK_IN = C(1) - 6;
const DOOR_OPEN = C(2) - 16;
const FIRST = C(2) - 12; // YOU walks in
const SECOND = W(2, 4); // "office": the second person
const WALK = 40;
const CLUE = SECOND + WALK; // dashed line: SAME BIRTHDAY?
const CLUE_OFF = C(3) + 24;
const COIN = W(3, 8) - 4; // "fifty-fifty": Spark flips a coin
const BUBBLE = W(4, 4) - 4; // "hundreds"
const BUBBLE_OFF = E(4) + 14;
const LAST = W(5, 4); // "twenty-three": the 23rd sits down
const DOOR_SHUT = LAST + 4;
const L1 = W(6, 3); // "any": a line between two other people
const L2 = W(6, 4) + 4;
const L3 = W(6, 6); // "not just you"
const YOUPULSE = W(6, 8);
const DROP = E(6) + 2;
const WEB0 = W(7, 1); // "people": the web starts
const WEB1 = W(7, 6) - 6; // all lines drawn just before "pairs!"
const HIT = W(7, 6); // "pairs!"
export { HIT };
const Q = C(8);
const LOOPTXT = VOICE_FRAMES - 22;

// --- the party table: 23 seats on an ellipse (seat 0 front centre, going round) ---------------------------------------
const TCX = 900;
const TCY = 1090; // ground of the seat ring centre
const RX = 470;
const RY = 320;
const N = 23;
type Seat = { x: number; g: number; s: number; th: number };
const SEATS: Seat[] = Array.from({ length: N }, (_, k) => {
  const th = Math.PI / 2 + (2 * Math.PI * k) / N;
  const sn = Math.sin(th);
  return { x: TCX + RX * Math.cos(th), g: TCY + RY * sn, s: 1.25 + 0.4 * ((1 + sn) / 2), th };
});
// who sits where, in the order they arrive (YOU first, front left; the second across the table)
const ORDER = [2, 13, 7, 18, 4, 11, 21, 9, 15, 0, 6, 16, 3, 12, 20, 8, 14, 1, 10, 19, 5, 17, 22];
const LOOKS: { hair: Hair; glasses?: boolean }[] = [
  { hair: "short" }, { hair: "long" }, { hair: "bun", glasses: true }, { hair: "curly" }, { hair: "bald", glasses: true }, { hair: "cap" },
  { hair: "long", glasses: true }, { hair: "short", glasses: true }, { hair: "curly" }, { hair: "bun" }, { hair: "bald" }, { hair: "short" },
  { hair: "long" }, { hair: "cap" }, { hair: "curly", glasses: true }, { hair: "bun" }, { hair: "short" }, { hair: "long" }, { hair: "bald", glasses: true },
  { hair: "curly" }, { hair: "short", glasses: true }, { hair: "bun" }, { hair: "long" },
];
// start of each person's walk: 1st and 2nd on their words, 3rd–18th through lines 4–5, the last five in the pause so the
// 23rd sits down on "twenty-three"
const STARTS: number[] = (() => {
  const a = [FIRST, SECOND];
  for (let i = 0; i < 16; i++) a.push(C(3) - 6 + i * 11);
  const lastStart = LAST - WALK;
  for (let i = 0; i < 5; i++) a.push(E(4) + Math.round(((lastStart - E(4)) * i) / 4));
  return a;
})();
const DOOR_X = 300;
const LEFT_X = TCX - RX - 40;
// where person p is at frame f: door → the left end of the table → round the ring to the seat
const personAt = (p: number, f: number): { x: number; g: number; s: number; on: boolean; moving: boolean; fc: number } => {
  const st = STARTS[p];
  const seat = SEATS[ORDER[p]];
  if (f < st) return { x: DOOR_X, g: BACK + 30, s: 1.2, on: false, moving: false, fc: 1 };
  const t = (f - st) / WALK;
  if (t >= 1) return { x: seat.x, g: seat.g, s: seat.s, on: true, moving: false, fc: seat.x < TCX ? 1 : -1 };
  // phase 1 (0–0.3): door to the left end; phase 2: along the ring (front way for front seats, back way for back seats)
  if (t < 0.3) {
    const u = Easing.inOut(Easing.sin)(t / 0.3);
    return { x: DOOR_X + (LEFT_X - DOOR_X) * u, g: BACK + 30 + (TCY - BACK - 30) * u, s: 1.2 + (1.45 - 1.2) * u, on: true, moving: true, fc: 1 };
  }
  const u = Easing.inOut(Easing.sin)((t - 0.3) / 0.7);
  let target = seat.th;
  const a0 = Math.PI; // the left end
  // go the short way round
  while (target - a0 > Math.PI) target -= 2 * Math.PI;
  while (target - a0 < -Math.PI) target += 2 * Math.PI;
  const th = a0 + (target - a0) * u;
  const rx = RX + 40 * (1 - u);
  const sn = Math.sin(th);
  const x = TCX + rx * Math.cos(th);
  const dx = -Math.sin(th) * (target - a0);
  return { x, g: TCY + RY * sn, s: 1.25 + 0.4 * ((1 + sn) / 2), on: true, moving: u < 0.98, fc: dx >= 0 ? 1 : -1 };
};
const arrived = (f: number) => STARTS.filter((s) => f >= s + WALK).length;
const headOf = (p: number, f: number): [number, number] => {
  const q = personAt(p, f);
  const j = solve({ ...STAND, x: q.x, y: q.g - 92.5 * q.s }, q.s, q.fc);
  return [j.headC[0], j.headC[1] - 4 * q.s];
};
const YOU = 0;

// the pairs: three early lines (none of them touch YOU), then every other pair, fanning out person by person
const EARLY: [number, number][] = [
  [5, 9],
  [12, 17],
  [3, 20],
];
const PAIRS: [number, number][] = (() => {
  const key = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
  const early = new Set(EARLY.map(([a, b]) => key(a, b)));
  const out: [number, number][] = [];
  for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) if (!early.has(key(a, b))) out.push([a, b]);
  return out;
})();
const webStart = (i: number) => WEB0 + (i * (WEB1 - 5 - WEB0)) / (PAIRS.length - 1);
const linesDone = (f: number) => {
  let n = 0;
  for (let i = 0; i < EARLY.length; i++) if (f >= [L1, L2, L3][i] + 8) n++;
  for (let i = 0; i < PAIRS.length; i++) if (f >= webStart(i) + 5) n++;
  return n;
};

// --- camera rig: hold → move → hold ------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [1500, 930, 1.36];
const WIDE: V3 = [960, 810, 0.72];
const MED: V3 = [1390, 880, 1.05];
const RING: V3 = [965, 830, 0.8];
const REVEAL: V3 = [1010, 815, 0.84];
const QCU: V3 = [1460, 930, 1.3];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 6, E(0) + 30, WIDE), // the promise: the whole room, Mr. Trick at the door
  k(C(3) - 8, C(3) + 14, MED), // Spark: the coin, "hundreds"
  k(E(4) + 2, E(4) + 22, WIDE), // the last people come in, the count
  k(E(5) + 6, E(5) + 26, RING), // the table
  k(DROP, DROP + 22, REVEAL), // the pause: a little closer
  k(Q - 14, Q + 8, QCU), // the question: his face
  k(E(8) - 2, VOICE_FRAMES - 4, F0), // the loop: frame 0's close-up
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

// --- the room ----------------------------------------------------------------------------------------------------------
const Room: React.FC<{ f: number }> = ({ f }) => {
  const doorOpen = interpolate(f, [DOOR_OPEN, DOOR_OPEN + 10, DOOR_SHUT, DOOR_SHUT + 6], [0, 1, 1, 0], { ...clamp, easing: eo });
  return (
    <g>
      <rect x={-1500} y={-2000} width={5200} height={2000 + BACK} fill={WALL} />
      <Hatch x={-1500} y={BACK - 60} w={5200} h={60} gap={26} o={0.12} />
      <rect x={-1500} y={BACK} width={5200} height={2200} fill={FLOORC} />
      <line x1={-1500} y1={BACK} x2={3700} y2={BACK} stroke={GRAPHITE} strokeWidth={8} />
      {/* floor boards in perspective */}
      {Array.from({ length: 13 }, (_, i) => -600 + i * 300).map((x) => (
        <line key={x} x1={x + (x - TCX) * 0.0} y1={BACK} x2={TCX + (x - TCX) * 1.9} y2={FLOOR + 300} stroke={GRAPHITE} strokeWidth={3} opacity={0.22} />
      ))}
      {/* bunting along the top of the wall */}
      <path d="M -200 -60 Q 500 40 1200 -60 Q 1900 40 2600 -60" stroke={GRAPHITE} strokeWidth={5} fill="none" />
      {Array.from({ length: 16 }, (_, i) => -120 + i * 170).map((x, i) => {
        const y = -60 + 70 * Math.sin((((x + 200) % 1400) / 1400) * Math.PI) + 8;
        return <path key={x} d={`M ${x - 34} ${y - 6} L ${x + 34} ${y - 6} L ${x} ${y + 62} Z`} fill={i % 3 === 0 ? ACCENT2 : PAPER} stroke={GRAPHITE} strokeWidth={5} strokeLinejoin="round" />;
      })}
      {/* window with the afternoon sun: light from the upper left */}
      <rect x={430} y={230} width={170} height={240} fill="#e4eef2" stroke={GRAPHITE} strokeWidth={8} />
      <line x1={515} y1={230} x2={515} y2={470} stroke={GRAPHITE} strokeWidth={5} />
      <line x1={430} y1={350} x2={600} y2={350} stroke={GRAPHITE} strokeWidth={5} />
      <circle cx={475} cy={280} r={26} fill="#fbe7a8" stroke={GRAPHITE} strokeWidth={4} />
      {/* the door in the back wall */}
      <rect x={DOOR_X - 85} y={BACK - 330} width={170} height={330} fill="#4a453e" stroke={GRAPHITE} strokeWidth={9} />
      <g transform={`translate(${DOOR_X - 85} 0) scale(${1 - 0.82 * doorOpen} 1) translate(${-(DOOR_X - 85)} 0)`}>
        <rect x={DOOR_X - 85} y={BACK - 330} width={170} height={330} fill={PAPER2} stroke={GRAPHITE} strokeWidth={8} />
        <circle cx={DOOR_X + 55} cy={BACK - 160} r={9} fill={GRAPHITE} />
      </g>
      {/* the wall calendar next to Spark */}
      <g transform="translate(1370 478) scale(0.72) translate(-1380 -330)">
        <rect x={1380} y={330} width={300} height={330} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />
        <rect x={1380} y={330} width={300} height={80} rx={10} fill={ACCENT2} stroke={GRAPHITE} strokeWidth={8} />
        {[1440, 1620].map((x) => (
          <line key={x} x1={x} y1={310} x2={x} y2={350} stroke={GRAPHITE} strokeWidth={9} strokeLinecap="round" />
        ))}
        <text x={1530} y={550} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={128} fill={GRAPHITE}>
          365
        </text>
        <text x={1530} y={625} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={GRAPHITE}>
          DAYS
        </text>
      </g>
      {/* balloons by the calendar */}
      {[[1250, 300, 0], [1320, 240, 1]].map(([x, y, i]) => (
        <g key={x} transform={`rotate(${Math.sin(f * 0.05 + i) * 3} ${x} ${y + 300})`}>
          <path d={`M ${x} ${y + 70} Q ${x - 20} ${y + 200} ${x + 10} ${y + 330}`} stroke={GRAPHITE} strokeWidth={3} fill="none" />
          <ellipse cx={x} cy={y} rx={56} ry={68} fill={i ? ACCENT2 : PAPER} stroke={GRAPHITE} strokeWidth={6} />
        </g>
      ))}
    </g>
  );
};

// the wall sign that counts: people, then pairs
const Sign: React.FC<{ f: number }> = ({ f }) => {
  const n = arrived(f);
  const pairs = linesDone(f);
  const showPairs = f >= L1;
  const val = showPairs ? pairs : n;
  const hit23 = f >= LAST && f < L1;
  const hit253 = f >= HIT;
  const pop = 1 + wobble(f, LAST, 0.08, 6) + wobble(f, HIT, 0.1, 6);
  const big = hit23 || hit253;
  return (
    <g>
      <rect x={640} y={90} width={480} height={300} rx={14} fill={CREAM} stroke={GRAPHITE} strokeWidth={9} />
      <text x={880} y={165} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={54} fill={GRAPHITE}>
        {showPairs ? "PAIRS" : "PEOPLE"}
      </text>
      <g transform={`translate(880 ${big && !hit253 ? 310 : 325}) scale(${pop})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={big ? 150 : 140} fill={big ? ACCENT : GRAPHITE} stroke={big ? GRAPHITE : "none"} strokeWidth={big ? 4 : 0}>
          {val}
        </text>
      </g>
      {hit23 && (
        <text x={880} y={372} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={GRAPHITE} opacity={interpolate(f, [LAST + 6, LAST + 12], [0, 1], clamp)}>
          = A 50/50 CHANCE
        </text>
      )}
    </g>
  );
};

// the party table and the cake
const TableBack: React.FC = () => (
  <g>
    <ellipse cx={TCX} cy={TCY - 80} rx={390} ry={250} fill="#c9b48f" stroke={GRAPHITE} strokeWidth={9} />
    <path d={`M ${TCX - 390} ${TCY - 80} L ${TCX - 390} ${TCY - 48} A 390 250 0 0 0 ${TCX + 390} ${TCY - 48} L ${TCX + 390} ${TCY - 80}`} fill="#a8916b" stroke={GRAPHITE} strokeWidth={8} />
    <ellipse cx={TCX} cy={TCY - 84} rx={355} ry={222} fill={PAPER} stroke={GRAPHITE} strokeWidth={5} />
    <Hatch x={TCX + 100} y={TCY - 290} w={280} h={400} gap={24} o={0.12} />
  </g>
);
const Cake: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <ellipse cx={TCX} cy={TCY - 92} rx={150} ry={40} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <rect x={TCX - 110} y={TCY - 200} width={220} height={105} fill="#f3d9cf" stroke={GRAPHITE} strokeWidth={7} />
    <ellipse cx={TCX} cy={TCY - 200} rx={110} ry={30} fill="#fbe9e2" stroke={GRAPHITE} strokeWidth={6} />
    <path d={`M ${TCX - 110} ${TCY - 160} q 27 22 55 0 q 27 22 55 0 q 27 22 55 0 q 27 22 55 0`} stroke={GRAPHITE} strokeWidth={4} fill="none" />
    {[-60, -20, 20, 60].map((dx, i) => {
      const fl = 1 + Math.sin(f * 0.5 + i * 1.7) * 0.12;
      return (
        <g key={dx}>
          <rect x={TCX + dx - 7} y={TCY - 262} width={14} height={60} fill={PAPER} stroke={GRAPHITE} strokeWidth={4} />
          <path d={`M ${TCX + dx} ${TCY - 266} q -12 -14 0 ${-34 * fl} q 12 ${20 * fl} 0 ${34 * fl}`} fill={ACCENT} stroke={GRAPHITE} strokeWidth={3} />
        </g>
      );
    })}
  </g>
);

// one doodle co-worker, walking or seated at the table
const Person: React.FC<{ p: number; f: number }> = ({ p, f }) => {
  const q = personAt(p, f);
  if (!q.on) return null;
  const look = LOOKS[p];
  const step = q.moving ? Math.sin((f - STARTS[p]) * 0.55) * 26 : 0;
  // when the 23rd sits down, everyone turns towards the camera in surprise for a moment; at the web, they look up
  const face: DoodleFace = f >= HIT && f < Q + 20 ? "shock" : f >= LAST && f < LAST + 30 ? "happy" : q.moving ? "plain" : p % 4 === 0 ? "happy" : "plain";
  const wave = !q.moving && f >= STARTS[p] + WALK && f < STARTS[p] + WALK + 14 ? 1 : 0;
  const arms = wave ? { ra1: 150, ra2: 20 } : p % 3 === 0 ? { ra1: 40, ra2: 60 } : { ra1: 20, ra2: 20 };
  return <Doodle x={q.x} ground={q.g} scale={q.s} facing={q.fc} hair={look.hair} glasses={look.glasses} face={face} pose={{ ...arms, la1: -20, la2: 10, ll1: step, rl1: -step, ll2: step > 0 ? 10 : 0, rl2: step < 0 ? 10 : 0 }} />;
};

// a line between two people's heads, growing from a to b
const PairLine: React.FC<{ a: number; b: number; f: number; at: number; dur?: number; w?: number; o?: number }> = ({ a, b, f, at, dur = 6, w = 4, o = 0.9 }) => {
  const g = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: eo });
  if (g <= 0) return null;
  const [x1, y1] = headOf(a, f);
  const [x2, y2] = headOf(b, f);
  return <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * g} y2={y1 + (y2 - y1) * g} stroke={ACCENT} strokeWidth={w} strokeLinecap="round" opacity={o} />;
};

export const S01_SFX: SfxCue[] = [
  [4, "swish", 0.2],
  [E(0) + 6, "whoosh", 0.28],
  [TRICK_IN + 2, "pop", 0.35],
  [PROMISE + 8, "ding", 0.18],
  [DOOR_OPEN, "page", 0.3],
  [CLUE, "scribble", 0.3],
  [C(3) - 8, "whoosh", 0.25],
  [COIN, "swish", 0.3],
  [COIN + 26, "clink", 0.4],
  [BUBBLE, "pop", 0.3],
  [E(4) + 2, "whoosh", 0.25],
  [LAST, "kaching", 0.4],
  [DOOR_SHUT + 4, "thud", 0.4],
  [E(5) + 6, "whoosh", 0.22],
  [L1, "scribble", 0.3],
  [L3, "scribble", 0.3],
  [YOUPULSE, "boing", 0.18],
  [DROP, "freeze", 0.2],
  [DROP + 2, "whoosh", 0.2],
  [WEB0, "riser", 0.3],
  [HIT, "impact", 0.75],
  [HIT + 1, "stinger", 0.38],
  [Q - 14, "whoosh", 0.25],
];

export const S01Party: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);

  const sparkKeys = gestureKeys([
    [0, { ...G.thinkChin, head: 8 }],
    [W(0, 2), { ...G.pointUp, ra1: 140, head: -6 }, "snap"], // "guess": counts on his fingers
    [W(0, 5), { ...G.thinkChin, head: 10 }, "snap"], // "number"
    [W(0, 7), { ...G.handsHips, head: -6 }, "snap"], // "before Spark does?": sure he will win
    [PROMISE - 2, { ...G.pointUp, head: -10 }, "snap"], // "Wait for the last part."
    [E(1) + 4, { ...G.armsCrossed }, "snap"],
    [C(2) + 2, { ...G.present, head: -4 }, "snap"], // "Two people": towards the table
    [W(2, 6), { ...G.doublePoint, head: 4 }, "snap"], // "share a birthday"
    [C(3) + 2, { ...G.thinkChin, head: 8 }, "snap"], // "How many people"
    [COIN - 6, { ra1: 70, ra2: 70, la1: -20, la2: 10, lean: 4 }, "snap"], // wind-up
    [COIN, { ra1: 140, ra2: 10, la1: -20, la2: 10, head: -10 }, "snap"], // flick
    [COIN + 24, { ra1: 60, ra2: 80, la1: -20, la2: 10, head: 6 }, "snap"], // catch
    [C(4) + 4, { ...G.handsHips, head: -6 }, "snap"], // "Spark says"
    [BUBBLE, { ...G.shrugBig, la1: -110, ra1: 110, head: -8 }, "snap"], // "hundreds": arms wide
    [E(4) + 10, { ...G.armsCrossed, head: -4 }, "snap"],
    [LAST - 2, { ...G.recoil }, "snap"], // "twenty-three"
    [LAST + 26, { ...G.facepalm }, "snap"],
    [C(6) + 4, { ...G.thinkChin, head: 6 }, "snap"], // "It can be"
    [L1 - 2, { ...G.pointSide, ra1: 110, head: -6 }, "snap"], // "any two people"
    [L3 - 2, { ...G.stop, head: 4 }, "snap"], // "not just you"
    [DROP + 2, { ...G.leanIn, head: 6 }, "smooth"],
    [HIT - 3, { ...G.mindBlown }, "snap"],
    [HIT + 26, { ...G.celebrate, head: -8 }, "snap"],
    [Q - 4, { ...G.doublePoint, ra1: 70, la1: 50, head: 6 }, "snap"],
    [W(8, 3), { ...G.beckon }, "snap"],
    [E(8) + 4, { ...G.thinkChin, head: 8 }, "snap"],
  ]);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(q, shake(t, LAST + 26, 3));
    q = addPose(q, nod(t, HIT + 2, 3));
    const hop = t >= HIT + 26 && t < HIT + 40 ? -Math.sin(((t - HIT - 26) / 14) * Math.PI) * 40 : 0;
    return { ...q, x: SPARK_X, y: SPY + hop };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "curious"],
      [W(0, 5), "thinking"],
      [W(0, 7), "smug"],
      [PROMISE - 2, "determined"],
      [E(1) + 4, "smug"],
      [C(2) + 2, "curious"],
      [C(3) + 2, "thinking"],
      [COIN, "excited"],
      [C(4) + 4, "smug"],
      [LAST - 2, "shock"],
      [LAST + 26, "worried"],
      [C(6) + 4, "thinking"],
      [L1 - 2, "curious"],
      [DROP + 2, "thinking"],
      [HIT - 3, "mindblown"],
      [HIT + 26, "excited"],
      [Q - 4, "happy"],
      [W(8, 3), "wink"],
      [E(8) + 4, "curious"],
    ];
    let m: Mood = "curious";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // the bulb flickers while he is sure about "hundreds", and lights on "pairs!"
  const bulb = (t: number) => {
    if (t >= HIT && t < Q + 30) return interpolate(t, [HIT, HIT + 3], [0.5, 1], clamp);
    if (t >= C(4) && t < LAST) {
      const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
      return n > 0.6 ? 0.45 : 0.08;
    }
    return 0;
  };

  // Mr. Trick at the door: pops up, tips his hat, waves people in, shuts the door on the 23rd
  const trickUp = interpolate(f, [TRICK_IN, TRICK_IN + 12], [0, 1], { ...clamp, easing: eoB });
  const tipHat = f >= PROMISE + 4 && f < E(1) + 6;
  const waving = f >= DOOR_OPEN && f < DOOR_SHUT;
  const tMood: TrickMood = f >= HIT - 6 && f < Q + 10 ? "surprised" : f >= DOOR_SHUT ? "smug" : "sly";
  const trickPose: Partial<Pose> = tipHat
    ? { ra1: 165, ra2: 70, la1: -20, la2: 20, head: -4 }
    : waving
      ? { ra1: 40, ra2: 30, la1: -100 + Math.sin(f * 0.35) * 30, la2: -60, head: 4 }
      : f >= DOOR_SHUT && f < DOOR_SHUT + 12
        ? { ra1: 40, ra2: 30, la1: -80, la2: -10, lean: -8 }
        : { ra1: 40, ra2: 30, la1: -30, la2: 20, head: 6 };

  // the coin: up on "fifty-fifty", spinning, back into his hand
  const coinT = interpolate(f, [COIN, COIN + 24], [0, 1], clamp);
  const coinOn = f >= COIN && f < COIN + 40;

  const dim = interpolate(f, [DROP, DROP + 8, HIT, HIT + 10], [0, 0.34, 0.34, 0.16], clamp) * interpolate(f, [Q + 10, Q + 30], [1, 0], clamp);

  // people drawn back to front; the table goes between the back half and the front half
  const people = Array.from({ length: N }, (_, p) => p).filter((p) => personAt(p, f).on);
  people.sort((a, b) => personAt(a, f).g - personAt(b, f).g);
  const behind = people.filter((p) => personAt(p, f).g < TCY - 30);
  const front = people.filter((p) => personAt(p, f).g >= TCY - 30);

  const youTag = (() => {
    const q = personAt(YOU, f);
    if (!q.on || f < STARTS[YOU] + WALK - 4) return null;
    const [hx, hy] = headOf(YOU, f);
    const s = 1 + wobble(f, YOUPULSE, 0.25, 6) + wobble(f, STARTS[YOU] + WALK, 0.2, 6);
    return (
      <g transform={`translate(${hx} ${hy - 78}) scale(${s})`}>
        <rect x={-62} y={-30} width={124} height={56} rx={12} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
        <text x={0} y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={GRAPHITE}>
          YOU
        </text>
      </g>
    );
  })();

  const clue = (() => {
    const o = interpolate(f, [CLUE, CLUE + 8, CLUE_OFF, CLUE_OFF + 10], [0, 1, 1, 0], clamp);
    if (o <= 0) return null;
    const [x1, y1] = headOf(0, f);
    const [x2, y2] = headOf(1, f);
    const g = interpolate(f, [CLUE, CLUE + 12], [0, 1], { ...clamp, easing: eo });
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return (
      <g opacity={o}>
        <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * g} y2={y1 + (y2 - y1) * g} stroke={ACCENT} strokeWidth={9} strokeDasharray="26 16" strokeLinecap="round" />
        <g transform={`translate(${mx} ${my - 60}) scale(${interpolate(f, [CLUE + 6, CLUE + 14], [0, 1], { ...clamp, easing: eoB })})`}>
          <rect x={-230} y={-44} width={460} height={76} rx={14} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
          <text x={0} y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={GRAPHITE}>
            SAME BIRTHDAY?
          </text>
        </g>
      </g>
    );
  })();

  const webGlow = interpolate(f, [HIT, HIT + 4, HIT + 24], [0, 1, 0.35], clamp);

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Room f={f} />
        <Sign f={f} />
        {/* Mr. Trick by the door */}
        {trickUp > 0 && (
          <g transform={`translate(0 ${(1 - trickUp) * 200})`} opacity={trickUp}>
            <MrTrick x={DOOR_X + 150} ground={BACK + 40} scale={1.25} facing={-1} mood={tMood} cane={waving ? "down" : "down"} pose={trickPose} />
          </g>
        )}
        {behind.map((p) => (
          <Person key={p} p={p} f={f} />
        ))}
        <TableBack />
        <Cake f={f} />
        {front.map((p) => (
          <Person key={p} p={p} f={f} />
        ))}
      </g>
      {dim > 0 && <rect x={-3000} y={-3000} width={9000} height={9000} fill="#2a2620" opacity={dim} />}
      <g filter="url(#pencil)">
        {dim > 0 && <Sign f={f} />}
        {clue}
        {EARLY.map(([a, b], i) => (
          <PairLine key={`e${i}`} a={a} b={b} f={f} at={[L1, L2, L3][i]} dur={10} w={8} />
        ))}
        {f >= WEB0 && PAIRS.map(([a, b], i) => <PairLine key={i} a={a} b={b} f={f} at={webStart(i)} dur={5} w={2.2 + webGlow * 1.4} o={0.6} />)}
        {f >= WEB0 &&
          Array.from({ length: N }, (_, p) => {
            const [hx, hy] = headOf(p, f);
            return <circle key={p} cx={hx} cy={hy} r={9 + webGlow * 4} fill={ACCENT} stroke={GRAPHITE} strokeWidth={4} />;
          })}
        {youTag}
      </g>
      <Spark f={f} trails={false} scale={S} facing={-1} base={{ x: SPARK_X, y: SPY }} talk={mouthAt} bulb={bulb} mood={mood} look={f >= Q - 4 ? 0 : -0.6} keys={sparkKeys} mod={sparkMod}>
        {(j: Joints) => {
          const parts: React.ReactNode[] = [];
          if (coinOn) {
            const h = Math.sin(coinT * Math.PI) * 230;
            const x = j.rHand[0];
            const y = j.rHand[1] - 20 - h;
            const sx = Math.cos((f - COIN) * 0.7);
            parts.push(
              <g key="coin" filter="url(#pencil)" transform={`translate(${x} ${y}) scale(${Math.max(0.12, Math.abs(sx))} 1)`}>
                <circle r={40} fill={sx > 0 ? ACCENT : PAPER} stroke={GRAPHITE} strokeWidth={6} />
                <circle r={27} fill="none" stroke={GRAPHITE} strokeWidth={3} opacity={0.6} />
              </g>,
            );
          }
          const bo = interpolate(f, [BUBBLE, BUBBLE + 8, BUBBLE_OFF - 8, BUBBLE_OFF], [0, 1, 1, 0], clamp);
          if (bo > 0) {
            const [hx, hy] = j.headC;
            const sc = interpolate(f, [BUBBLE, BUBBLE + 10], [0.4, 1], { ...clamp, easing: eoB });
            parts.push(
              <g key="bubble" filter="url(#pencil)" opacity={bo} transform={`translate(${hx - 330} ${hy - 250}) scale(${sc})`}>
                <path d="M -230 -80 Q -240 -150 -150 -150 L 170 -150 Q 250 -150 245 -80 L 245 20 Q 245 80 170 80 L 120 80 L 190 150 L 40 80 L -150 80 Q -235 80 -230 20 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
                <text x={8} y={-10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={72} fill={GRAPHITE}>
                  HUNDREDS!
                </text>
                <g transform="translate(8 40)">
                  {Array.from({ length: 9 }, (_, i) => (
                    <circle key={i} cx={-160 + i * 40} cy={0} r={11} fill="none" stroke={GRAPHITE} strokeWidth={4} />
                  ))}
                </g>
              </g>,
            );
          }
          return <>{parts}</>;
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
      GUESS THE
      <br />
      <span style={{ color: ACCENT }}>NUMBER</span>
    </>
  );
  const smallLine =
    f >= 300 && f < Q
      ? "The birthday problem: with 23 people, the chance that two share a birthday is 50.7% (365 equal days, no leap day; real birthdays are a little uneven, which makes a match slightly more likely). 23 × 22 ÷ 2 = 253 pairs."
      : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hook, -20, PROMISE - 6, 112)}
      {f >= LOOPTXT && top(hook, LOOPTXT, VOICE_FRAMES + 200, 112)}
      {f >= W(3, 8) && f < E(3) + 12 && top(<>A <span style={{ color: ACCENT }}>50/50</span> CHANCE?</>, W(3, 8), E(3) + 12, 104)}
      {f >= LAST && f < E(5) + 14 && top(<>ONLY <span style={{ color: ACCENT }}>23</span> PEOPLE!</>, LAST, E(5) + 14, 108)}
      {f >= HIT && f < Q && top(<><span style={{ color: ACCENT }}>253</span> PAIRS!</>, HIT, Q, 120)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1676, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(7) + 10 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1770, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 15</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1560} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["guess", "birthday", "last", "share", "fifty-fifty", "hundreds", "twenty-three", "any", "two", "pairs!", "number"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={[HIT]} power={5} svg={svg} html={html} />;
};
