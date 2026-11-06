import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Pose } from "../stickman/stick";
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
// T11 · "Why do your 2 fingers feel what is never there?" Spark Got Tricked #6 (PLAY, pencil look, 30.6 s).
// ONE world, one camera rig: a family dinner table, seen from the viewer's chair. Spark is toy-sized on the table. One pea on the plate.
// The huge hand comes from the top: it is the viewer's own hand. Pea-green accent on the pea and on the two sides of the fingers that touch it.
// Reveal: the fingers uncross and the two green marks travel apart until they touch two different things (salt + pepper). The fingers cross
// again on the one pea, and two dashed peas pop out of the marks: what the brain reports. Fiorio et al. 2014 + Illusions Index: see facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const ACCENT = "#7cc52d";
const ACCENT_D = "#4d8f12";
const CREAM = "#fffaf0";
const SKIN = "#f3e2c9"; // a warm paper tone: the viewer's hand, any viewer
const GROUND = 1440;
const S0 = 2.5;
const PLATE_X = 610;
const PLATE_Y = 1302;
const PEA_R = 35;
const PEA_Y = PLATE_Y - 26;
const HAND_DOWN = PEA_Y - 306; // palm origin when the tips touch the pea
const HAND_UP = HAND_DOWN - 170;

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const CROSS = C(2);
const CROSSED = W(2, 7) + 4; // "like"
const NOW = C(3);
const PEA_WORD = W(3, 3);
const NOSE_WORD = W(3, 6);
const TEST0 = E(3);
const TEST1 = C(4);
const FEEL = W(4, 4);
const TWO_Q = W(4, 6);
const NORMALLY = C(5);
const SIDES = W(5, 3);
const UNCROSS0 = W(5, 5);
const TOUCH = W(5, 7);
const SLIDE0 = W(5, 7) - 6;
const HIT = W(5, 10); // "things!"
export { HIT };
const SO = C(6);
const BRAIN = W(6, 2);
const HIT2 = W(6, 9); // "things."
const Q = C(7);
const YOUQ = W(7, 1);
const TWOQ = W(7, 3);
const ONEQ = W(7, 4);
const LOOP0 = E(7) + 1;
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [545, 1185, 1.72];
const WIDE: [number, number, number] = [540, 960, 1.0];
const TABLE: [number, number, number] = [570, 1085, 1.36];
const REV1: [number, number, number] = [600, 1010, 1.28];
const REV2: [number, number, number] = [515, 1090, 1.3];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 12, PROMISE + 18, WIDE), // the whole table, the family, and who put the pea there
  k(CROSS - 12, CROSS + 12, TABLE), // the hand + the plate. Holds still through the test.
  k(TEST1 + 2, TEST1 + 24, WIDE), // he goes looking for the second pea
  k(NORMALLY - 4, NORMALLY + 18, REV1), // the fingers
  k(SO + 2, SO + 26, REV2), // the pea again
  k(HIT2 + 8, Q, [515, 1090, 1.36]), // slow push on the reveal
  k(LOOP0, LOOP1, F0),
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

// --- the hand ------------------------------------------------------------------------------------------------------------
// crossAt: 1 = crossed, 0 = side by side. handY: palm origin.
const crossAt = (f: number) => {
  const open = interpolate(f, [PROMISE - 8, PROMISE + 14], [1, 0], { ...clamp, easing: eio });
  const cross = interpolate(f, [W(2, 2), CROSSED], [0, 1], { ...clamp, easing: eio });
  const un = interpolate(f, [UNCROSS0, TOUCH + 6], [0, 1], { ...clamp, easing: eio });
  const back = interpolate(f, [SO + 10, W(6, 6)], [0, 1], { ...clamp, easing: eio });
  const setup = f < CROSS ? open : cross;
  return setup * (1 - un * (1 - back));
};
const handYAt = (f: number) => {
  const up = interpolate(f, [PROMISE - 8, PROMISE + 14], [0, 1], { ...clamp, easing: eio });
  const down = interpolate(f, [NOW + 2, PEA_WORD + 4], [0, 1], { ...clamp, easing: eio });
  const up2 = interpolate(f, [UNCROSS0 - 4, TOUCH + 6], [0, 1], { ...clamp, easing: eio });
  const down2 = interpolate(f, [SO + 14, W(6, 6) + 2], [0, 1], { ...clamp, easing: eio });
  const a = lerp(HAND_DOWN, HAND_UP, up * (1 - down));
  return lerp(a, HAND_UP + 18, up2 * (1 - down2));
};
type V = [number, number];
const fingerPts = (c: number, which: "index" | "middle"): { B: V; Q: V; T: V } =>
  which === "index"
    ? { B: [-44, -40], Q: [lerp(-46, -18, c), lerp(140, 158, c)], T: [lerp(-47, 80, c), 300] }
    : { B: [44, -40], Q: [lerp(46, 18, c), lerp(140, 158, c)], T: [lerp(47, -80, c), 300] };
const at = (p: { B: V; Q: V; T: V }, t: number): V => [
  (1 - t) * (1 - t) * p.B[0] + 2 * (1 - t) * t * p.Q[0] + t * t * p.T[0],
  (1 - t) * (1 - t) * p.B[1] + 2 * (1 - t) * t * p.Q[1] + t * t * p.T[1],
];
const tan = (p: { B: V; Q: V; T: V }, t: number): V => {
  const dx = 2 * (1 - t) * (p.Q[0] - p.B[0]) + 2 * t * (p.T[0] - p.Q[0]);
  const dy = 2 * (1 - t) * (p.Q[1] - p.B[1]) + 2 * t * (p.T[1] - p.Q[1]);
  const n = Math.hypot(dx, dy) || 1;
  return [dx / n, dy / n];
};
// the side of the finger that faces away from the other finger when they are side by side
const markOf = (c: number, which: "index" | "middle") => {
  const p = fingerPts(c, which);
  const d = tan(p, 0.97);
  const sign = which === "index" ? 1 : -1;
  const n: V = [-d[1] * sign, d[0] * sign];
  const P: V = [p.T[0] + n[0] * 37 - d[0] * 12, p.T[1] + n[1] * 37 - d[1] * 12];
  return { P, d };
};
// half width of a finger along its length: thick at the root, thin at the tip
const halfW = (t: number) => lerp(45, 36, t);
const tubePath = (p: { B: V; Q: V; T: V }, extra: number) => {
  const L: V[] = [];
  const R: V[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const a = at(p, t);
    const d = tan(p, t);
    const w = halfW(t) + extra;
    L.push([a[0] - d[1] * w, a[1] + d[0] * w]);
    R.push([a[0] + d[1] * w, a[1] - d[0] * w]);
  }
  const w1 = halfW(1) + extra;
  return `M ${L.map((q) => q.join(" ")).join(" L ")} A ${w1} ${w1} 0 0 0 ${R[18].join(" ")} L ${R.slice().reverse().map((q) => q.join(" ")).join(" L ")} Z`;
};
const Finger: React.FC<{ c: number; which: "index" | "middle"; mark: number }> = ({ c, which, mark }) => {
  const p = fingerPts(c, which);
  const crease = (t: number) => {
    const a = at(p, t);
    const d = tan(p, t);
    const n: V = [-d[1], d[0]];
    const w = halfW(t) - 8;
    return <path d={`M ${a[0] - n[0] * w} ${a[1] - n[1] * w} Q ${a[0] + d[0] * 7} ${a[1] + d[1] * 7} ${a[0] + n[0] * w} ${a[1] + n[1] * w}`} fill="none" stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" opacity={0.6} />;
  };
  const m = markOf(c, which);
  return (
    <g>
      <path d={tubePath(p, 0)} fill={SKIN} stroke={GRAPHITE} strokeWidth={10} strokeLinejoin="round" />
      {crease(0.34)}
      {crease(0.66)}
      {mark > 0.01 && (
        <g opacity={Math.min(1, mark * 1.5)}>
          <line x1={m.P[0] - m.d[0] * 42 * mark} y1={m.P[1] - m.d[1] * 42 * mark} x2={m.P[0] + m.d[0] * 22 * mark} y2={m.P[1] + m.d[1] * 22 * mark} stroke={ACCENT} strokeWidth={22} strokeLinecap="round" />
          <line x1={m.P[0] - m.d[0] * 42 * mark} y1={m.P[1] - m.d[1] * 42 * mark} x2={m.P[0] + m.d[0] * 22 * mark} y2={m.P[1] + m.d[1] * 22 * mark} stroke={ACCENT_D} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
        </g>
      )}
    </g>
  );
};
// Palm side, pointing down: the two crossed fingers, the other two curled over the palm, the thumb holding them.
const Hand: React.FC<{ x: number; y: number; c: number; mark: number; s?: number; rot?: number; sleeve?: boolean }> = ({ x, y, c, mark, s = 1, rot = 0, sleeve = true }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {sleeve && (
      <g>
        <path d="M -16 -320 L -40 -1700 L 214 -1700 L 176 -320 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
        <Hatch x={-36} y={-1700} w={246} h={1370} gap={30} o={0.26} />
      </g>
    )}
    <Finger c={c} which="index" mark={mark} />
    <Finger c={c} which="middle" mark={mark} />
    {/* the palm */}
    <path d="M -2 -318 L 168 -318 Q 226 -210 222 -60 Q 218 -14 170 -12 L 80 -14 Q 0 8 -80 -14 Q -104 -30 -102 -90 Q -96 -220 -2 -318 Z" fill={SKIN} stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
    <path d="M 30 -270 Q 90 -210 150 -250" fill="none" stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
    {/* the two curled fingers: their tips lie across the palm */}
    <g fill={SKIN} stroke={GRAPHITE} strokeWidth={9}>
      <rect x={58} y={-112} width={176} height={70} rx={35} />
      <rect x={70} y={-176} width={160} height={68} rx={34} />
    </g>
    {/* the thumb lies over them, from the far side of the palm */}
    <path d="M -112 -210 Q -60 -116 40 -116 Q 112 -112 118 -146 Q 120 -182 66 -178 Q 8 -176 -24 -252 Z" fill={SKIN} stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
    <path d="M 74 -170 Q 104 -172 106 -148" fill="none" stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
    {sleeve && <rect x={-24} y={-350} width={210} height={54} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />}
  </g>
);

const Pea: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = PEA_R }) => (
  <g>
    <ellipse cx={x} cy={y + r * 0.86} rx={r * 0.95} ry={r * 0.18} fill={GRAPHITE} opacity={0.28} />
    <circle cx={x} cy={y} r={r} fill={ACCENT} stroke={GRAPHITE} strokeWidth={6} />
    <path d={`M ${x - r * 0.5} ${y - r * 0.28} Q ${x - r * 0.25} ${y - r * 0.62} ${x + r * 0.12} ${y - r * 0.6}`} fill="none" stroke="#e8f8c8" strokeWidth={r * 0.17} strokeLinecap="round" />
    <path d={`M ${x + r * 0.15} ${y + r * 0.7} Q ${x + r * 0.62} ${y + r * 0.55} ${x + r * 0.74} ${y + r * 0.1}`} fill="none" stroke={ACCENT_D} strokeWidth={r * 0.13} strokeLinecap="round" />
  </g>
);
const GhostPea: React.FC<{ x: number; y: number; r: number; pop: number; spin?: number }> = ({ x, y, r, pop, spin = 0 }) =>
  pop <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${pop})`}>
      <circle r={r} fill={ACCENT} opacity={0.3} />
      <circle r={r} fill="none" stroke={ACCENT_D} strokeWidth={8} strokeDasharray={`${r * 0.42} ${r * 0.3}`} strokeLinecap="round" transform={`rotate(${spin})`} />
    </g>
  );
// a salt or pepper pot, standing on the table
const Shaker: React.FC<{ x: number; base: number; letter: string; dark?: boolean; w?: number; h?: number }> = ({ x, base, letter, dark, w = 94, h = 262 }) => (
  <g>
    <ellipse cx={x} cy={base} rx={w * 0.62} ry={13} fill={GRAPHITE} opacity={0.25} />
    <path d={`M ${x - w / 2} ${base} L ${x - w / 2} ${base - h + 42} Q ${x} ${base - h - 24} ${x + w / 2} ${base - h + 42} L ${x + w / 2} ${base} Z`} fill={dark ? "#cfc6b2" : CREAM} stroke={GRAPHITE} strokeWidth={8} strokeLinejoin="round" />
    <SketchLine x1={x - w / 2} y1={base - h + 48} x2={x + w / 2} y2={base - h + 48} w={5} />
    {[-18, 0, 18].map((d) => (
      <circle key={d} cx={x + d} cy={base - h + 18 - Math.abs(d) * 0.1} r={4.5} fill={GRAPHITE} />
    ))}
    <text x={x} y={base - h * 0.28} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={58} fill={GRAPHITE}>
      {letter}
    </text>
  </g>
);

const World: React.FC = () => (
  <g>
    <Paper />
    {/* back wall: window at dusk + a picture + shelf */}
    <Hatch x={-400} y={-300} w={1900} h={1450} gap={42} o={0.1} />
    <rect x={40} y={170} width={330} height={400} fill={PAPER2} />
    <Hatch x={40} y={170} w={330} h={400} gap={15} o={0.42} />
    <circle cx={290} cy={270} r={44} fill={PAPER} stroke={GRAPHITE} strokeWidth={5} />
    <SketchBox x={40} y={170} w={330} h={400} lw={10} />
    <SketchLine x1={205} y1={170} x2={205} y2={570} w={7} />
    <SketchLine x1={40} y1={370} x2={370} y2={370} w={7} />
    <SketchBox x={830} y={230} w={200} h={150} fill={PAPER2} lw={7} />
    <path d="M 845 360 L 900 290 L 945 340 L 980 300 L 1016 360 Z" fill="none" stroke={GRAPHITE} strokeWidth={5} strokeLinejoin="round" />
    <SketchLine x1={-300} y1={1010} x2={1500} y2={1010} w={5} color={SOFT} />
    {/* the lamp over the table: the light in the room */}
    <line x1={280} y1={-200} x2={280} y2={60} stroke={GRAPHITE} strokeWidth={7} />
  </g>
);
const Lamp: React.FC = () => (
  <g>
    <path d="M 196 118 Q 280 22 364 118 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
    <circle cx={280} cy={124} r={20} fill="#ffe9a8" stroke={GRAPHITE} strokeWidth={5} />
  </g>
);
const Table: React.FC = () => (
  <g>
    {/* the table top seen from a chair: a wide trapezoid that fills the bottom of the world */}
    <path d="M 60 1150 L 1020 1150 L 1420 1560 L -340 1560 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={10} strokeLinejoin="round" />
    <Hatch x={-340} y={1150} w={1760} h={410} gap={78} o={0.08} />
    {/* fork + knife beside the plate */}
    <g stroke={GRAPHITE} strokeWidth={8} strokeLinecap="round" fill="none">
      <path d="M 906 1254 L 982 1372" />
      <path d="M 902 1244 l -12 -28 M 914 1238 l -12 -28 M 926 1232 l -12 -28" strokeWidth={6} />
    </g>
    {/* a napkin Spark can lift + a water glass */}
    <path d="M 74 1330 L 196 1318 L 214 1382 L 66 1398 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    <g>
      <path d="M 912 1140 L 926 1262 L 992 1262 L 1006 1140 Z" fill="#dfe9ea" fillOpacity={0.55} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
      <SketchLine x1={918} y1={1176} x2={1000} y2={1176} w={3} color={SOFT} />
    </g>
    {/* the plate: rim + well. Only one pea on it. */}
    <ellipse cx={PLATE_X} cy={PLATE_Y} rx={214} ry={58} fill={PAPER} stroke={GRAPHITE} strokeWidth={8} />
    <ellipse cx={PLATE_X} cy={PLATE_Y} rx={158} ry={37} fill={CREAM} stroke={SOFT} strokeWidth={5} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [2, "pop", 0.26],
  [PROMISE - 12, "whoosh_long", 0.26],
  [W(1, 3), "pop", 0.26],
  [CROSS - 12, "swish", 0.24],
  [CROSSED, "pop", 0.3],
  [PEA_WORD + 4, "thud", 0.24],
  [NOSE_WORD, "pop", 0.26],
  [TEST0 + 4, "tick", 0.42],
  [TEST0 + 34, "tick", 0.42],
  [TEST0 + 64, "tick", 0.42],
  [TWO_Q, "boing", 0.3],
  [TWO_Q + 14, "swish", 0.24],
  [NORMALLY - 4, "swish", 0.26],
  [SIDES - 7, "pop", 0.34],
  [UNCROSS0, "swirl", 0.32],
  [SLIDE0, "whoosh", 0.3],
  [HIT, "impact", 0.82],
  [HIT + 3, "ding", 0.42],
  [SO + 12, "swirl", 0.26],
  [W(6, 6) + 2, "thud", 0.24],
  [HIT2, "impact", 0.9],
  [HIT2 + 2, "ding", 0.52],
  [YOUQ, "pop", 0.28],
  [TWOQ, "pop", 0.28],
  [ONEQ, "pop", 0.3],
  [LOOP0 + 2, "whoosh", 0.24],
];

export const S01Dinner: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const c = crossAt(f);
  const handY = handYAt(f);
  const mark = interpolate(f, [SIDES - 7, SIDES + 5], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [LOOP0, LOOP0 + 12], [1, 0], clamp);
  // in the test the pea rolls very slowly under the tips: how to do it
  const roll = interpolate(f, [TEST0, TEST1], [0, 1], clamp);
  const rollX = Math.sin(roll * Math.PI * 3) * 5;
  const handX = PLATE_X + rollX;

  // --- Spark ---------------------------------------------------------------------------------------------------------------
  const F0_POSE: Partial<Pose> = { ...G.pointSide, ra1: 104, ra2: 8, la1: -42, la2: -58, head: -6, lean: -5 };
  const sparkKeys = gestureKeys([
    [0, F0_POSE],
    [W(0, 8), { ...G.shrugBig, head: 8 }, "snap"],
    [PROMISE, { ...G.stop, head: -4 }, "snap"],
    [W(1, 3), { ...G.pointUp, head: -10 }, "snap"],
    [CROSS, { ...G.present, head: -4 }, "snap"],
    [W(2, 7), { ...G.pointSide, ra1: 112, head: -6 }, "snap"],
    [NOW, { ...G.doublePoint, ra1: 88, la1: 62 }, "snap"],
    [NOSE_WORD, { ...G.whisper, ra1: 26, ra2: 140, lean: 3, head: 2 }, "snap"],
    [W(3, 8), { ...G.handsHips, head: 3 }, "snap"],
    [TEST1 - 6, { ...G.thinkChin, head: 8 }, "snap"],
    [FEEL, { ...G.leanIn, ra1: 72, ra2: 4, head: -4 }, "snap"],
    [TWO_Q, { ...G.celebrate, la1: -96, la2: -40, ra1: 138, ra2: 14, head: -6 }, "snap"],
    [TWO_Q + 14, { ra1: 66, ra2: 6, la1: -14, la2: -8, head: 20, lean: 14 }, "snap"], // bends and lifts the napkin
    [NORMALLY - 2, { ...G.shrugBig, head: 8 }, "snap"],
    [SIDES, { ...G.pointSide, ra1: 112, ra2: 2, head: -6 }, "snap"],
    [TOUCH, { ...G.thinkChin, head: 6 }, "snap"],
    [HIT, { ...G.recoil, ra1: 96, ra2: 40, la1: -96, la2: -40 }, "snap"],
    [SO, { ...G.present, head: -4 }, "snap"],
    [BRAIN, { ...G.pointUp, ra1: 148, ra2: 92, head: 4 }, "snap"],
    [HIT2, { ...G.celebrate, la1: -142, la2: -18, ra1: 142, ra2: 18, head: -8, lean: -2 }, "snap"],
    [HIT2 + 40, { ...G.presentBoth, ra1: 82, ra2: 10, la1: 40, la2: 30, head: -3 }, "snap"],
    [Q, { ...G.leanIn, ra1: 82, ra2: 8 }, "snap"],
    [YOUQ, { ...G.doublePoint, ra1: 96, la1: 64, lean: 8 }, "snap"],
    [TWOQ, { ...G.count2, head: -4 }, "snap"],
    [ONEQ, { ...G.count1, head: 6 }, "snap"],
    [LOOP0 + 2, F0_POSE, "snap"],
  ]);
  const sparkXAt = (t: number) => {
    const toNapkin = interpolate(t, [TWO_Q + 10, TWO_Q + 24, NORMALLY - 4, NORMALLY + 12], [340, 262, 262, 330], { ...clamp, easing: sio });
    const rev = interpolate(t, [SO, SO + 22], [0, 1], { ...clamp, easing: sio });
    const home = interpolate(t, [LOOP0, LOOP1], [0, 1], { ...clamp, easing: sio });
    return lerp(lerp(toNapkin, 232, rev), 340, home);
  };
  const stepping = (t: number) => (t >= TWO_Q + 10 && t < TWO_Q + 24) || (t >= NORMALLY - 4 && t < NORMALLY + 12) || (t >= SO && t < SO + 22) || (t >= LOOP0 && t < LOOP1 - 6);
  const scaleAt = (t: number) => interpolate(t, [HIT2 - 1, HIT2 + 7, HIT2 + 12, Q, Q + 8, LOOP0, LOOP1], [S0, 2.92, 2.78, 2.78, 2.6, 2.6, S0], { ...clamp, easing: sio });
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, hop(t, HIT2, 72));
    q = addPose(q, hop(t, TWO_Q, 26));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, nod(t, CROSSED, 2));
    q = addPose(q, shake(t, NORMALLY, 2));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    if (stepping(t)) q = { ...q, ...walkCycle(t, 1.05) };
    const s = scaleAt(t);
    return { ...q, x: sparkXAt(t), y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [W(0, 8), "curious"],
      [PROMISE, "wink"],
      [CROSS, "happy"],
      [W(2, 7), "smug"],
      [NOW, "excited"],
      [W(3, 8), "smug"],
      [TEST1 - 6, "thinking"],
      [FEEL, "curious"],
      [TWO_Q, "excited"],
      [TWO_Q + 14, "worried"],
      [SIDES, "curious"],
      [TOUCH, "thinking"],
      [HIT, "shock"],
      [SO, "happy"],
      [HIT2, "mindblown"],
      [Q, "curious"],
      [YOUQ, "wink"],
      [TWOQ, "laugh"],
      [LOOP0 + 2, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= HIT && t < LOOP0) return interpolate(t, [HIT, HIT + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const facing = (t: number) => (t >= TWO_Q + 10 && t < NORMALLY + 4 ? -1 : t >= SO && t < SO + 22 ? -1 : t >= LOOP0 && t < LOOP0 + 6 ? -1 : 1);
  const sNow = scaleAt(f);

  // the napkin he lifts
  const napkinUp = interpolate(f, [TWO_Q + 20, TWO_Q + 30, NORMALLY - 2, NORMALLY + 6], [0, 1, 1, 0], { ...clamp, easing: sio });

  // --- ghost peas ----------------------------------------------------------------------------------------------------------
  const ghostF0 = interpolate(f, [PROMISE - 14, PROMISE - 4], [1, 0], clamp) + interpolate(f, [LOOP0 + 8, LOOP1], [0, 1], { ...clamp, easing: eoB });
  const ghostQ = interpolate(f, [TWO_Q, TWO_Q + 9], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [NORMALLY + 2, NORMALLY + 12], [1, 0], clamp);
  const ghostRev = interpolate(f, [HIT2, HIT2 + 9], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [LOOP0 - 6, LOOP0 + 6], [1, 0], clamp);
  const GH_DX = 216;
  const GH_Y = PEA_Y - 92;
  const GH_R = 66;
  const mL = markOf(c, "index");
  const mR = markOf(c, "middle");
  const dashLine = (m: { P: V }, gx: number) => {
    const ax = handX + m.P[0];
    const ay = handY + m.P[1];
    return <line x1={ax} y1={ay} x2={gx} y2={GH_Y + 30} stroke={ACCENT_D} strokeWidth={7} strokeDasharray="4 18" strokeLinecap="round" opacity={ghostRev} />;
  };

  // --- salt + pepper: two different things ------------------------------------------------------------------------------
  const slideIn = interpolate(f, [SLIDE0, HIT], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const slideOut = interpolate(f, [SO + 2, SO + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const slideK = slideIn * (1 - slideOut);
  const handUpX = PLATE_X;
  const SHK_TOUCH_L = handUpX + markOf(0, "index").P[0] - 49;
  const SHK_TOUCH_R = handUpX + markOf(0, "middle").P[0] + 49;
  const shakeL = lerp(-120, SHK_TOUCH_L, slideK);
  const shakeR = lerp(1300, SHK_TOUCH_R, slideK);
  const shakerBase = PLATE_Y - 62;
  const shakerH = shakerBase - (HAND_UP + 18 + 306 - 62);
  const hitBump = wobble(f, HIT, 0.04, 6);

  // --- Mr. Trick: on the table, behind the glass. He put the one pea there. --------------------------------------------------
  const trickUp = interpolate(f, [PROMISE - 2, PROMISE + 14, CROSS - 12, CROSS + 2], [0, 1, 1, 0], { ...clamp, easing: eoB });
  const trickUp2 = interpolate(f, [TWO_Q + 12, TWO_Q + 24, NORMALLY - 6, NORMALLY + 8], [0, 1, 1, 0], { ...clamp, easing: eoB });
  const trickUp3 = 0; // no Mr. Trick in the reveal: the picture stays clean
  const trickK = Math.max(trickUp, trickUp2, trickUp3);
  const trickMood = trickUp3 > 0 ? "surprised" : trickUp2 > 0 ? "smug" : "sly";
  const trickPose: Partial<Pose> = trickUp2 > 0 ? { ra1: 150, ra2: 10, la1: -30, la2: -20, head: 4 } : trickUp3 > 0 ? { ra1: 74, ra2: 40, la1: -74, la2: -40, head: -6, lean: -5 } : { ra1: 40, ra2: 24, la1: -28, la2: -18, head: 6 };

  // --- the family, behind the table ---------------------------------------------------------------------------------------
  const nosePop = interpolate(f, [NOSE_WORD, NOSE_WORD + 12], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [LOOP0, LOOP0 + 10], [1, 0], clamp);
  const manFeels = f >= TWO_Q - 4;
  const happyAll = f >= HIT2;
  const womanHead = 10 + Math.sin(f * 0.04) * 2;
  const manX = 208;
  const manS = 3.55;
  const manGround = 1362;

  const svg = (
    <>
      <PencilDefs f={f} />
      <defs>
        <filter id="halo" x="-30%" y="-30%" width="160%" height="160%">
          <feMorphology in="SourceAlpha" operator="dilate" radius={8} result="fat" />
          <feFlood floodColor={PAPER} />
          <feComposite in2="fat" operator="in" result="pad" />
          <feMerge>
            <feMergeNode in="pad" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#pencil)">
        <World />
        <Doodle x={manX} ground={manGround} scale={manS} hair="bald" glasses face={happyAll ? "happy" : manFeels ? "shock" : "plain"} facing={1} pose={{ ra1: 30, ra2: 20, la1: -30, la2: -20, head: 3 }} />
        <Doodle x={960} ground={1372} scale={3.45} hair="bun" face={happyAll ? "happy" : f >= TWO_Q ? "bored" : "plain"} facing={-1} pose={{ ra1: 26, ra2: 26, la1: -26, la2: -26, head: womanHead }} />
        <Lamp />
        <Table />
      </g>
      {/* his crossed fingers on his own nose: the test works there too (a small hand, seen when the camera is wide) */}
      {nosePop > 0.01 && (
        <g filter="url(#pencil)">
          <Hand x={manX + 20} y={752} c={1} mark={0} s={0.17 * nosePop} rot={180} sleeve={false} />
        </g>
      )}
      <g filter="url(#pencil)">
        {/* Mr. Trick pops up behind the glass */}
        {trickK > 0.01 && (
          <g>
            <clipPath id="trickClip">
              <rect x={700} y={-200} width={500} height={1645} />
            </clipPath>
            <g clipPath="url(#trickClip)" filter="url(#halo)">
              <MrTrick x={905} ground={1436 + (trickUp3 > 0 ? 190 : 0) + (1 - trickK) * 560} scale={2.15} facing={-1} mood={trickMood as "sly"} pose={trickPose} cane="down" />
            </g>
          </g>
        )}
        {/* the napkin, up in his hand */}
        <path
          d={`M 74 ${1330 - napkinUp * 86} L 196 ${1318 - napkinUp * 110} L 214 ${1382 - napkinUp * 62} L 66 ${1398 - napkinUp * 30} Z`}
          fill={PAPER}
          stroke={GRAPHITE}
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={napkinUp > 0.02 ? 1 : 0}
        />
        <Pea x={PLATE_X + rollX * 0.5} y={PEA_Y} />
        <GhostPea x={PLATE_X + 146} y={PEA_Y - 2} r={PEA_R + 4} pop={Math.max(Math.min(1, ghostF0), ghostQ)} />
        {slideK > 0.01 && (
          <g>
            <Shaker x={shakeL} base={shakerBase} letter="S" h={shakerH} />
            <Shaker x={shakeR} base={shakerBase} letter="P" dark h={shakerH} />
          </g>
        )}
        {ghostRev > 0.01 && (
          <g>
            {dashLine(mL, PLATE_X + GH_DX)}
            {dashLine(mR, PLATE_X - GH_DX)}
            <GhostPea x={PLATE_X - GH_DX} y={GH_Y} r={GH_R} pop={ghostRev} spin={f * 0.3} />
            <GhostPea x={PLATE_X + GH_DX} y={GH_Y} r={GH_R} pop={ghostRev} spin={-f * 0.3} />
          </g>
        )}
      </g>
      {/* solid copy under the pencil one: the filter's grain has holes, and nothing behind the hand may show through */}
      <g transform={`translate(${PLATE_X} ${handY + 150}) scale(${1 + hitBump}) translate(${-PLATE_X} ${-(handY + 150)})`}>
        <Hand x={handX} y={handY} c={c} mark={0} />
      </g>
      <g filter="url(#pencil)">
        <g transform={`translate(${PLATE_X} ${handY + 150}) scale(${1 + hitBump}) translate(${-PLATE_X} ${-(handY + 150)})`}>
          <Hand x={handX} y={handY} c={c} mark={mark} />
        </g>
      </g>
      <Spark f={f} trails={false} scale={sNow} facing={facing} base={{ x: 340, y: GROUND - 92.5 * sNow }} talk={(t) => (t > LOOP0 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={0.6} keys={sparkKeys} mod={sparkMod} />
    </>
  );

  const slam = (at0: number) => 1 + wobble(f, at0, 0.05, 6);
  const top = (text: React.ReactNode, at0: number, until: number, size = 112) => (
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
        transform: `scale(${slam(at0)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const hookText = (
    <>
      CROSS YOUR <span style={{ color: ACCENT_D }}>FINGERS</span>
    </>
  );
  const smallLine = f >= HIT2 && f < LOOP0 ? "Most people feel two, not everyone. The reason is a best guess." : "";
  const testK = interpolate(f, [TEST0, TEST0 + 6, TEST1 - 4, TEST1], [0, 1, 1, 0], clamp);
  const dots = [0, 1, 2].map((i) => f >= TEST0 + 4 + i * 30);

  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hookText, 0, PROMISE - 6)}
      {f >= LOOP0 + 8 && top(hookText, VOICE_FRAMES + 100, VOICE_FRAMES + 200)}
      {f >= NOSE_WORD && f < TEST0 + 2 && top(<>A PEA OR <span style={{ color: ACCENT_D }}>YOUR NOSE</span></>, NOSE_WORD, TEST0 + 2, 96)}
      {f >= TEST0 && f < TEST1 && top(<>TRY IT <span style={{ color: ACCENT_D }}>NOW</span></>, TEST0 + 2, TEST1, 124)}
      {f >= HIT && f < SO + 6 && top(<>NORMALLY <span style={{ color: ACCENT_D }}>TWO THINGS</span></>, HIT, SO + 6, 96)}
      {f >= HIT2 && f < LOOP0 && top(<>YOUR BRAIN <span style={{ color: ACCENT_D }}>SAYS TWO</span></>, HIT2, LOOP0, 100)}
      {testK > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1570, opacity: testK, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", gap: 30 }}>
            {dots.map((on, i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: 23, border: "6px solid #f6efdf", background: on ? ACCENT : "transparent", boxSizing: "border-box" }} />
            ))}
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: "#f6efdf" }}>Closed eyes make it stronger.</div>
        </div>
      )}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1684, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 27, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 330 && f < E(7) && !(testK > 0.01) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: GRAPHITE, background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 6</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["fingers", "never", "last", "cross", "pea", "nose", "two", "normally", "different", "things!", "brain", "one?"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2, HIT2, HIT2 + 2]} power={5} svg={svg} html={html} />;
};
