import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, runCycle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V030 · "Did you get your microwave from melted chocolate?" (~36.4 s, promise → build → reveal, How it started)
// ONE world, wider than the screen, one camera rig:
//  A (x≈-300–1180)  your kitchen: a microwave on the counter, Spark holding a melting chocolate bar.
//  B (x≈1260–2500)  through the door, a 1940s radar lab: the tall RADAR MACHINE, a small bench, the engineer in his coat.
//                   Chocolate melts in his pocket, popcorn pops all over the lab, an egg goes in a kettle, a co-worker
//                   looks inside, the lights drop, THE EGG EXPLODES IN HIS FACE (best picture). Back to the kitchen.
// Sources: Lemelson-MIT, HISTORY.com, SMECC biography, Wikipedia (the story is told, not proven) — see facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);

// palette: peach kitchen, steel-blue lab, chocolate, popcorn cream, yolk yellow (no teal except Spark)
const PEACH = "#ffdcc4";
const PEACH2 = "#f8c4a2";
const STEEL = "#b7cfe2";
const STEEL2 = "#88a8c4";
const NAVY = "#24344f";
const NAVY2 = "#38506f";
const FLOORK = "#a8664a";
const FLOORK2 = "#935539";
const FLOORL = "#3f5672";
const FLOORL2 = "#34495f";
const CHOC = "#6d3b1c";
const CHOC2 = "#8d5329";
const WRAP = "#d9342b";
const CREAM = "#fff3c9";
const CREAM2 = "#f4cf6b";
const YOLK = "#ffc21a";
const SILVER = "#d5dce3";
const SILVER2 = "#a5b1bd";
const WHITE = "#ffffff";
const YEL = "#ffd23f";
const INK = COL.ink;

const T = {
  stop0: W(0, 0),
  micro0: W(0, 5),
  melted0: W(0, 7),
  c1: C(1),
  last1: W(1, 3),
  messy1: W(1, 7),
  e1: E(1),
  c2: C(2),
  story2: W(2, 1),
  eng2: W(2, 4),
  choc2: W(2, 5),
  melted2: W(2, 6),
  radar2: W(2, 9),
  c3: C(3),
  why3: W(3, 2),
  pop3: W(3, 6),
  near3: W(3, 7),
  c4: C(4),
  popped4: W(4, 1),
  no4: W(4, 3),
  fire4: W(4, 4),
  c5: C(5),
  egg5: W(5, 4),
  kettle5: W(5, 7),
  c6: C(6),
  co6: W(6, 1),
  looked6: W(6, 2),
  e6: E(6),
  c7: C(7),
  boom7: W(7, 3),
  c8: C(8),
  waves8: W(8, 1),
  now8: W(8, 4),
  food8: W(8, 7),
  e8: E(8),
  c9: C(9),
  why9: W(9, 5),
  c10: C(10),
  heat10: W(10, 3),
  today10: W(10, 4),
};
const LOOP = VOICE_FRAMES - 10;

// --- staging (world coordinates) -----------------------------------------------------------------------------------
const SX0 = 250;
const SXB = 1490;
const RUN0 = T.c2 - 6;
const RUN1 = T.c2 + 28;
const BACK0 = T.now8 - 6;
const BACK1 = T.now8 + 30;
const COUNTER = 1000;
const MWX = 680;
const MWW = 400;
const MWH = 250;
const BENCHX = 1905;
const BENCH = 1095;
const ENGX = 1730;
const ENGS = 1.75;
const COX0 = 1320;
const COX1 = 1805;
const MACHX = 2020;
const HORNY = 1030;
const KTOP = 975;

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 490, 880, 1.2], // frame 0: Spark + chocolate + microwave
  [T.c1 - 8, T.c1 + 12, 400, 900, 1.34], // CU promise
  [RUN0, RUN1, 1870, 900, 1.05], // through the door into the lab
  [T.choc2 - 8, T.choc2 + 12, 1730, 930, 1.28], // the pocket
  [T.c3 - 6, T.c3 + 14, 1810, 920, 1.08], // engineer + machine
  [T.c4 - 4, T.c4 + 12, 1830, 860, 1.0], // room for the popcorn
  [T.c5 - 6, T.c5 + 14, 1810, 930, 1.18], // the kettle
  [T.c6 - 14, T.c6 + 6, 1770, 910, 1.08], // the co-worker walks in
  [T.e6 + 2, T.boom7 - 2, 1830, 950, 1.3], // slow push: nobody move
  [T.boom7 - 2, T.boom7 + 6, 1810, 860, 1.08], // the hit: whole picture
  [T.boom7 + 8, T.c8 - 8, 1810, 870, 1.12], // held, very slow
  [T.c8 - 4, T.c8 + 14, 1830, 910, 1.08], // the waves
  [BACK0, BACK1, 560, 880, 1.14], // back through the door
  [T.c9 - 8, T.c9 + 12, 380, 900, 1.34], // CU Spark
  [T.c10 - 8, T.c10 + 12, 490, 880, 1.2], // frame 0 again
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- helpers ----------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; o?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  o = 1,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={900} fontSize={s} fill={c} opacity={o}>
    {children}
  </text>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={4} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

const Pill: React.FC<{ x: number; y: number; w: number; c: string; k?: number; s?: number; children: React.ReactNode }> = ({ x, y, w, c, k = 1, s = 42, children }) =>
  k < 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect x={-w / 2} y={-32} width={w} height={64} rx={32} fill={WHITE} {...K} strokeWidth={5} />
      <Txt y={s * 0.36} s={s} c={c}>
        {children}
      </Txt>
    </g>
  );

// a melting chocolate bar. (0,0) = where the hand holds it. melt 0..1
const ChocBar: React.FC<{ melt: number; f: number }> = ({ melt, f }) => {
  const d1 = 40 + 60 * melt + 5 * Math.sin(f * 0.07);
  const d2 = 26 + 90 * melt + 6 * Math.sin(f * 0.05 + 1);
  const d3 = 34 + 40 * melt + 4 * Math.sin(f * 0.09 + 2);
  return (
    <g>
      {/* wrapper at the bottom */}
      <rect x={-62} y={-8} width={124} height={92} rx={8} fill={WRAP} {...K} strokeWidth={6} />
      <rect x={-62} y={-8} width={124} height={22} fill={WHITE} opacity={0.4} />
      {/* solid squares */}
      <rect x={-62} y={-122} width={124} height={118} rx={10} fill={CHOC} {...K} strokeWidth={6} />
      <line x1={0} y1={-118} x2={0} y2={-8} stroke={CHOC2} strokeWidth={6} />
      <line x1={-58} y1={-65} x2={58} y2={-65} stroke={CHOC2} strokeWidth={6} />
      {/* the melted part runs over the wrapper */}
      <path
        d={`M -66 -30 L 66 -30 L 66 ${d3 - 20} Q 66 ${d3} 52 ${d3} Q 38 ${d3} 38 ${d3 - 20} L 34 -6 Q 26 -2 20 2 L 20 ${d2 - 14} Q 20 ${d2} 6 ${d2} Q -8 ${d2} -8 ${d2 - 14} L -8 4 Q -16 2 -24 -2 L -26 ${d1 - 16} Q -26 ${d1} -42 ${d1} Q -58 ${d1} -58 ${d1 - 16} L -60 -6 Q -66 -14 -66 -30 Z`}
        fill={CHOC}
        {...K}
        strokeWidth={5}
      />
      <path d={`M -48 -18 q 0 18 0 ${10 + 40 * melt}`} stroke={CHOC2} strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M 8 -14 q 0 18 0 ${14 + 60 * melt}`} stroke={CHOC2} strokeWidth={7} strokeLinecap="round" fill="none" />
    </g>
  );
};

const Drop: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 12 }) => (
  <path d={`M 0 ${-r * 1.7} Q ${r} 0 0 ${r} Q ${-r} 0 0 ${-r * 1.7} Z`} transform={`translate(${x} ${y})`} fill={CHOC} {...K} strokeWidth={3} />
);

// invisible waves, drawn as moving arcs from (x,y) in the direction dir
const Waves: React.FC<{ x: number; y: number; dir: number; len: number; h: number; f: number; o?: number; c?: string }> = ({ x, y, dir, len, h, f, o = 1, c = WHITE }) => (
  <g transform={`translate(${x} ${y}) scale(${dir} 1)`} opacity={o}>
    {[0, 1, 2, 3].map((i) => {
      const t = ((f * 0.022 + i / 4) % 1 + 1) % 1;
      const r = 14 + t * len;
      const a = h * (0.3 + 0.7 * t);
      return <path key={i} d={`M ${r * 0.72} ${-a} Q ${r * 1.18} 0 ${r * 0.72} ${a}`} fill="none" stroke={c} strokeWidth={13} strokeLinecap="round" strokeDasharray="5 20" opacity={Math.sin(t * Math.PI)} />;
    })}
  </g>
);

const Popcorn: React.FC<{ x: number; y: number; r: number; rot: number }> = ({ x, y, r, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 20})`}>
    <path d="M -20 8 Q -30 -8 -14 -14 Q -14 -28 2 -24 Q 16 -30 20 -14 Q 32 -6 22 8 Q 22 22 6 18 Q -6 26 -14 16 Q -20 16 -20 8 Z" fill={CREAM} {...K} strokeWidth={4} />
    <circle cx={2} cy={2} r={6} fill={CREAM2} />
  </g>
);

const PopBag: React.FC<{ puff: number }> = ({ puff }) => (
  <g transform={`scale(${1 + puff * 0.12} ${1 + puff * 0.2})`}>
    <path d={`M -48 56 L -56 -46 L -38 -62 L -18 -48 L 4 -64 L 24 -48 L 54 -62 L 50 56 Z`} fill={WHITE} {...K} strokeWidth={6} />
    {[-34, -10, 14, 36].map((x, i) => (
      <rect key={i} x={x - 8} y={-40} width={15} height={92} fill={WRAP} opacity={0.85} />
    ))}
    <rect x={-44} y={-16} width={88} height={36} rx={8} fill={YEL} {...K} strokeWidth={4} />
    <Txt y={11} s={19}>
      POPCORN
    </Txt>
  </g>
);

const Egg: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <path d="M 0 -30 C 18 -30 26 -6 24 8 C 22 24 10 30 0 30 C -10 30 -22 24 -24 8 C -26 -6 -18 -30 0 -30 Z" fill={WHITE} {...K} strokeWidth={5} />
  </g>
);

const Kettle: React.FC = () => (
  <g>
    {/* spout */}
    <path d="M -56 -58 Q -92 -70 -104 -106 L -84 -112 Q -74 -86 -46 -84 Z" fill={SILVER} {...K} strokeWidth={6} />
    {/* body: rounded, open at the top */}
    <path d="M -66 0 Q -76 -60 -46 -102 L 46 -102 Q 76 -60 66 0 Z" fill={SILVER} {...K} strokeWidth={7} />
    <path d="M -48 -14 Q -56 -56 -34 -90" stroke={WHITE} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.85} />
    <ellipse cx={0} cy={-102} rx={46} ry={12} fill={NAVY} {...K} strokeWidth={6} />
    {/* the hole on the side, the machine's tube pushed against it */}
    <circle cx={60} cy={-60} r={16} fill={NAVY} {...K} strokeWidth={5} />
    <rect x={-70} y={-4} width={140} height={8} rx={4} fill={SILVER2} />
  </g>
);

const Microwave: React.FC<{ on: number; f: number; pop: number; steam: number }> = ({ on, f, pop, steam }) => {
  const H = MWH;
  const W2 = MWW;
  return (
    <g transform={`scale(${1 + 0.06 * pop})`}>
      <rect x={-W2 / 2} y={-H} width={W2} height={H - 12} rx={18} fill="#f2f4f6" {...K} strokeWidth={8} />
      {/* door + window */}
      <rect x={-W2 / 2 + 18} y={-H + 18} width={W2 - 130} height={H - 48} rx={12} fill="#dfe5ea" {...K} strokeWidth={5} />
      <rect x={-W2 / 2 + 36} y={-H + 36} width={W2 - 166} height={H - 84} rx={8} fill={on > 0.5 ? "#ffd98a" : "#384a60"} {...K} strokeWidth={5} />
      <rect x={W2 / 2 - 126} y={-H + 40} width={10} height={H - 92} rx={5} fill={INK} />
      {/* bowl of food turning inside */}
      <g transform={`translate(${-W2 / 2 + 36 + (W2 - 166) / 2} ${-H + 36 + H - 84 - 16})`}>
        <ellipse cx={0} cy={6} rx={84} ry={9} fill={SILVER2} {...K} strokeWidth={3} />
        <path d="M -56 -42 L 56 -42 Q 50 0 22 0 L -22 0 Q -50 0 -56 -42 Z" fill={WHITE} {...K} strokeWidth={4} />
        <path d="M -52 -42 Q -34 -66 0 -60 Q 34 -68 52 -42 Z" fill="#f0a93b" {...K} strokeWidth={4} />
        <rect x={-30 + 14 * Math.sin(f * 0.12 * on)} y={-28} width={22} height={12} rx={4} fill={WRAP} />
        {steam > 0.01 &&
          [-24, 8, 32].map((x, i) => (
            <path key={i} d={`M ${x} -72 q -12 -14 0 -28 q 10 -12 0 -24`} fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" opacity={steam * (0.5 + 0.5 * Math.sin(f * 0.2 + i))} />
          ))}
      </g>
      {on > 0.5 && <Waves x={-W2 / 2 + 62} y={-H + 96} dir={1} len={120} h={34} f={f * 3} c="#b5622a" o={0.85} />}
      {/* panel */}
      <rect x={W2 / 2 - 96} y={-H + 26} width={78} height={38} rx={6} fill={NAVY} {...K} strokeWidth={4} />
      <Txt x={W2 / 2 - 57} y={-H + 56} s={26} c="#7cf0a0">
        {on > 0.5 ? "0:30" : "12:00"}
      </Txt>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={W2 / 2 - 94 + c * 26} y={-H + 80 + r * 26} width={20} height={18} rx={4} fill={SILVER} stroke={INK} strokeWidth={3} />),
      )}
      <rect x={W2 / 2 - 94} y={-H + 164} width={72} height={26} rx={6} fill={WRAP} stroke={INK} strokeWidth={3} />
      {/* feet */}
      <rect x={-W2 / 2 + 22} y={-14} width={44} height={14} rx={4} fill={INK} />
      <rect x={W2 / 2 - 66} y={-14} width={44} height={14} rx={4} fill={INK} />
    </g>
  );
};

// the world behind everything -------------------------------------------------------------------------------------------
const World: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* ---- kitchen ---- */}
    <rect x={-1100} y={-900} width={2310} height={2200} fill={PEACH} />
    {Array.from({ length: 16 }, (_, i) => (
      <circle key={i} cx={-300 + ((i * 193) % 1500)} cy={120 + ((i * 271) % 620)} r={9} fill={PEACH2} opacity={0.7} />
    ))}
    {/* wall cabinets */}
    <g>
      <rect x={-300} y={200} width={1420} height={260} rx={8} fill="#ef8a5c" {...K} strokeWidth={8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={-280 + i * 284} y={222} width={252} height={216} rx={8} fill="#f6a177" stroke={INK} strokeWidth={5} />
          <circle cx={-52 + i * 284 - (i % 2 ? 196 : 0)} cy={330} r={11} fill={YEL} {...K} strokeWidth={4} />
        </g>
      ))}
    </g>
    {/* tiles above the counter */}
    <rect x={-1100} y={800} width={2310} height={200} fill="#fff1e4" />
    {Array.from({ length: 30 }, (_, i) => (
      <line key={i} x1={-1100 + i * 80} y1={800} x2={-1100 + i * 80} y2={1000} stroke={PEACH2} strokeWidth={4} />
    ))}
    {[880, 960].map((y) => (
      <line key={y} x1={-1100} y1={y} x2={1210} y2={y} stroke={PEACH2} strokeWidth={4} />
    ))}
    <rect x={-1100} y={GROUND} width={2310} height={1200} fill={FLOORK} />
    {Array.from({ length: 7 }, (_, i) => (
      <line key={i} x1={-1100} y1={GROUND + 40 + i * 70 + i * i * 6} x2={1210} y2={GROUND + 40 + i * 70 + i * i * 6} stroke={FLOORK2} strokeWidth={5} />
    ))}
    {/* counter */}
    <rect x={-1100} y={COUNTER + 30} width={2230} height={GROUND - COUNTER - 30} fill="#c8724e" />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={-860 + i * 240} y={COUNTER + 60} width={196} height={GROUND - COUNTER - 88} rx={10} fill="none" stroke={FLOORK2} strokeWidth={6} />
    ))}
    <rect x={-1100} y={COUNTER} width={2240} height={32} rx={6} fill={NAVY2} {...K} strokeWidth={6} />

    {/* ---- lab ---- */}
    <rect x={1210} y={-900} width={1900} height={2200} fill={STEEL} />
    <rect x={1210} y={880} width={1900} height={420} fill={STEEL2} />
    <rect x={1210} y={872} width={1900} height={10} fill={INK} opacity={0.3} />
    {/* pipes */}
    <rect x={1210} y={130} width={1900} height={22} fill={NAVY2} {...K} strokeWidth={5} />
    {[1420, 1800, 2260].map((x) => (
      <rect key={x} x={x} y={118} width={32} height={46} rx={4} fill={SILVER2} {...K} strokeWidth={4} />
    ))}
    {/* shelf of radar tubes */}
    <g>
      <rect x={1340} y={700} width={420} height={18} rx={4} fill={NAVY2} {...K} strokeWidth={5} />
      {[1400, 1490, 1580, 1680].map((x, i) => (
        <g key={x} transform={`translate(${x} 700)`}>
          <rect x={-26} y={-34} width={52} height={34} rx={4} fill={NAVY} {...K} strokeWidth={4} />
          <path d={`M -20 -34 Q -30 -96 0 -110 Q 30 -96 20 -34 Z`} fill={i % 2 ? "#ffe7a8" : "#fff6dd"} {...K} strokeWidth={5} />
        </g>
      ))}
    </g>
    {/* lamp */}
    <g transform={`translate(1880 170) rotate(${1.4 * Math.sin(f * 0.04)})`}>
      <line x1={0} y1={-60} x2={0} y2={70} stroke={INK} strokeWidth={5} />
      <path d="M -74 130 Q -60 70 0 70 Q 60 70 74 130 Z" fill={NAVY2} {...K} strokeWidth={6} />
      <ellipse cx={0} cy={132} rx={32} ry={11} fill={YEL} {...K} strokeWidth={4} />
    </g>
    {/* floor */}
    <rect x={1210} y={GROUND} width={1900} height={1200} fill={FLOORL} />
    {Array.from({ length: 22 }, (_, i) => (
      <rect key={i} x={1210 + i * 90} y={GROUND} width={45} height={1200} fill={FLOORL2} opacity={0.6} />
    ))}
    <rect x={1210} y={GROUND - 4} width={1900} height={10} fill={INK} opacity={0.35} />

    {/* ---- the door between them ---- */}
    <rect x={1130} y={250} width={150} height={GROUND - 250} fill={NAVY} />
    <rect x={1150} y={280} width={110} height={GROUND - 280} fill="#16202f" {...K} strokeWidth={6} />
    <rect x={1120} y={236} width={170} height={44} rx={6} fill={NAVY2} {...K} strokeWidth={6} />
  </g>
);

// bench + machine (stay in the lab)
const Machine: React.FC<{ f: number; on: number }> = ({ f, on }) => {
  const sweep = f * 3.2;
  return (
    <g>
      {/* cabinet */}
      <rect x={MACHX} y={470} width={330} height={GROUND - 470} rx={14} fill={NAVY} {...K} strokeWidth={8} />
      <rect x={MACHX + 22} y={494} width={286} height={250} rx={12} fill={NAVY2} {...K} strokeWidth={5} />
      {/* radar screen */}
      <circle cx={MACHX + 165} cy={619} r={104} fill="#10291f" {...K} strokeWidth={7} />
      <circle cx={MACHX + 165} cy={619} r={70} fill="none" stroke="#56d68a" strokeWidth={3} opacity={0.6} />
      <circle cx={MACHX + 165} cy={619} r={36} fill="none" stroke="#56d68a" strokeWidth={3} opacity={0.6} />
      <line x1={MACHX + 165} y1={619} x2={MACHX + 165 + 96 * Math.cos((sweep * Math.PI) / 180)} y2={619 + 96 * Math.sin((sweep * Math.PI) / 180)} stroke="#7cf0a0" strokeWidth={6} strokeLinecap="round" />
      {/* name plate */}
      <rect x={MACHX + 28} y={768} width={274} height={140} rx={10} fill={WHITE} {...K} strokeWidth={6} />
      <Txt x={MACHX + 165} y={826} s={50}>
        RADAR
      </Txt>
      <Txt x={MACHX + 165} y={884} s={50}>
        MACHINE
      </Txt>
      {/* lamps + dials */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={MACHX + 75 + i * 90} cy={952} r={22} fill={i === 1 ? (on > 0.5 ? "#7cf0a0" : "#3a6a50") : i === 0 ? WRAP : YEL} {...K} strokeWidth={5} />
      ))}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${MACHX + 95 + i * 140} 1060)`}>
          <circle r={46} fill={WHITE} {...K} strokeWidth={6} />
          <line x1={0} y1={0} x2={30 * Math.cos(f * 0.05 + i)} y2={30 * Math.sin(f * 0.05 + i)} stroke={WRAP} strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {/* the tube that sends the waves out */}
      <rect x={MACHX - 50} y={HORNY - 30} width={60} height={60} rx={8} fill={SILVER} {...K} strokeWidth={6} />
      <rect x={MACHX - 62} y={HORNY - 42} width={18} height={84} rx={6} fill={SILVER2} {...K} strokeWidth={5} />
    </g>
  );
};

const Bench: React.FC = () => (
  <g>
    <rect x={BENCHX - 66} y={BENCH + 20} width={18} height={GROUND - BENCH - 20} fill={NAVY2} {...K} strokeWidth={5} />
    <rect x={BENCHX + 48} y={BENCH + 20} width={18} height={GROUND - BENCH - 20} fill={NAVY2} {...K} strokeWidth={5} />
    <rect x={BENCHX - 92} y={BENCH} width={184} height={24} rx={6} fill="#c79256" {...K} strokeWidth={6} />
  </g>
);

// --- pieces ------------------------------------------------------------------------------------------------------------
type Fly = { x0: number; y0: number; vx: number; vy: number; t0: number; land: number; r: number; rot: number };
const KERNELS: Fly[] = Array.from({ length: 46 }, (_, i) => {
  const a = random(`v030k${i}`);
  const b = random(`v030l${i}`);
  const c = random(`v030m${i}`);
  return {
    x0: BENCHX - 16,
    y0: 945,
    vx: (a - 0.5) * 34,
    vy: -(10 + b * 22),
    t0: i * 1.05,
    land: GROUND + 2 + c * 26,
    r: 16 + c * 14,
    rot: a * 360,
  };
});

// where egg bits land and stick (wall + floor)
type Bit = { x: number; y: number; r: number; yolk: boolean; delay: number };
const BITS: Bit[] = Array.from({ length: 34 }, (_, i) => {
  const a = random(`v030a${i}`) * Math.PI * 2;
  const d = 300 + random(`v030b${i}`) * 780;
  const x = BENCHX - 16 + Math.cos(a) * d;
  const y = 700 + Math.sin(a) * d * 0.72;
  return {
    x: Math.min(2420, x),
    y: Math.min(GROUND + 50, y),
    r: 13 + random(`v030c${i}`) * 26,
    yolk: i % 2 === 0,
    delay: random(`v030d${i}`) * 6,
  };
});
const splat = (r: number) => `M ${r} 0 Q ${r * 1.1} ${r * 0.8} ${r * 0.34} ${r * 0.82} Q ${r * 0.1} ${r * 1.5} ${-r * 0.4} ${r * 0.86} Q ${-r * 1.4} ${r * 0.8} ${-r * 0.95} ${r * 0.1} Q ${-r * 1.5} ${-r * 0.6} ${-r * 0.5} ${-r * 0.82} Q ${-r * 0.1} ${-r * 1.4} ${r * 0.4} ${-r * 0.86} Q ${r * 1.3} ${-r * 0.9} ${r} 0 Z`;

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [T.stop0, "thud", 0.34],
  [T.micro0, "ding", 0.16],
  [T.c1 - 8, "whoosh", 0.08],
  [T.messy1, "boing", 0.14],
  [T.c2 - 14, "thud", 0.14],
  [RUN0 + 2, "whoosh_long", 0.16],
  [T.melted2, "swirl", 0.16],
  [T.why3, "pop", 0.14],
  [T.pop3, "swish", 0.12],
  [T.near3, "buzz", 0.05],
  ...[0, 2, 3, 5, 7, 8, 11, 13, 15, 16, 19, 21, 24, 26, 29, 32, 34, 37, 40].map((d, i) => [T.popped4 + d, "pop", 0.09 + (i % 3) * 0.03] as SfxCue),
  [T.fire4, "ding", 0.14],
  [T.c5 - 2, "clink", 0.2],
  [T.kettle5 + 2, "clink", 0.18],
  [T.c6 - 2, "swish", 0.08],
  [T.e6 + 4, "tick", 0.2],
  [T.e6 + 13, "tick", 0.24],
  [T.e6 + 22, "tick", 0.28],
  [T.boom7 - 1, "explosion", 0.42],
  [T.boom7 + 1, "impact", 0.4],
  [T.boom7 + 8, "shatter", 0.1],
  [T.c8 + 10, "buzz", 0.05],
  [BACK0 + 2, "whoosh_long", 0.14],
  [T.food8 + 4, "ding", 0.3],
  [T.why9, "pop", 0.14],
  [T.heat10, "swish", 0.08],
  [LOOP, "whoosh", 0.1],
];

export const S01Lab: React.FC<SceneProps> = () => {
  const real = useCurrentFrame();
  const loopBack = real >= LOOP;
  const f = loopBack ? 0 : real;
  const cam = camAtRig(real);

  // ---------------- kitchen bar ----------------
  const melt0 = interpolate(f, [0, T.melted0 + 10], [0.25, 1], { ...clamp, easing: eo });
  const barDown = T.c2 - 22;
  const barAt: [number, number] = [415, COUNTER - 84];
  const barPick = T.heat10 - 6;
  const barK = (t: number) => {
    if (t < barDown) return 0;
    if (t < barDown + 12) return interpolate(t, [barDown, barDown + 12], [0, 1], { ...clamp, easing: eio });
    if (t < barPick) return 1;
    return interpolate(t, [barPick, barPick + 14], [1, 0], { ...clamp, easing: eio });
  };
  const barOnCounter = barK(f) >= 0.999;

  // microwave
  const mwOn = f >= T.now8 + 6 && f < T.food8 + 4 ? 1 : 0;
  const mwSteam = f >= T.food8 ? interpolate(f, [T.food8, T.food8 + 12, T.c10, T.c10 + 12], [0, 1, 1, 0], clamp) : 0;
  const mwPop = f >= T.micro0 - 2 && f < T.micro0 + 18 ? Math.sin(((f - T.micro0 + 2) / 20) * Math.PI) : 0;

  // ---------------- engineer ----------------
  const meltL = interpolate(f, [T.choc2 - 6, T.melted2 + 12], [0.05, 1], { ...clamp, easing: eio });
  const insertK = f >= T.choc2 - 4 ? popIn(f, T.choc2 - 4) * interpolate(f, [T.c3 + 4, T.c3 + 12], [1, 0], { ...clamp, easing: ei }) : 0;
  const whyK = f >= T.why3 ? popIn(f, T.why3) * interpolate(f, [T.near3 + 6, T.near3 + 14], [1, 0], { ...clamp, easing: ei }) : 0;
  const bagK = f >= T.pop3 - 6 ? popIn(f, T.pop3 - 6) : 0;
  const bagGone = T.c5 - 8;
  const bagOn = f >= T.pop3 - 8 && f < bagGone + 14;
  const POP0 = T.popped4 - 2;
  const bagShake = f >= POP0 - 6 && f < POP0 + 46 ? 7 * Math.sin(f * 1.7) : 0;
  const fireK = f >= T.no4 ? popIn(f, T.no4) * interpolate(f, [T.c5 - 14, T.c5 - 6], [1, 0], { ...clamp, easing: ei }) : 0;
  const wavesOn = interpolate(f, [T.near3 - 2, T.near3 + 8], [0, 1], clamp);
  const wavesOff = interpolate(f, [BACK0 - 8, BACK0], [1, 0], clamp);

  const kettleK = f >= T.c5 - 2 ? popIn(f, T.c5 - 2) : 0;
  const eggHold = f >= T.egg5 - 12 && f < T.kettle5 - 2;
  const eggDrop = f >= T.kettle5 - 2 && f < T.kettle5 + 8;
  const eggK = f >= T.egg5 - 12 ? popIn(f, T.egg5 - 12) : 0;
  const BOOM = T.boom7;
  const boomed = f >= BOOM;
  const rumble = f >= T.c6 + 20 && f < BOOM ? interpolate(f, [T.c6 + 20, BOOM - 2], [0.5, 6], clamp) : 0;
  const kShakeX = rumble * Math.sin(f * 2.3);
  const kShakeR = rumble * 0.5 * Math.sin(f * 1.9);
  const [ksx, ksy] = boomed ? squash(f, BOOM, 0.22) : ([1 + rumble * 0.008, 1 - rumble * 0.006] as [number, number]);

  const engBack0 = T.kettle5 + 4;
  const engBack1 = T.kettle5 + 36;
  const engX = (t: number) => (t < engBack0 ? ENGX : ease(t, engBack0, engBack1, ENGX, 1270));
  const engKeys = gestureKeys([
    [0, { ra1: 12, ra2: 6, la1: -12, la2: -6 }],
    [T.choc2 - 2, { ra1: 16, ra2: 10, la1: -14, la2: -6, head: 8 }, "smooth"],
    [T.melted2, { ra1: 34, ra2: 96, la1: -30, la2: -30, head: 22, lean: 6 }, "snap"],
    [T.c3 - 2, G.thinkChin, "smooth"],
    [T.pop3 - 6, { ra1: 88, ra2: -4, la1: -14, la2: 8, head: -2 }, "smooth"],
    [POP0, { ra1: 96, ra2: -4, la1: -70, la2: -40, head: -6, lean: -6 }, "snap"],
    [T.c5 - 8, { ra1: 150, ra2: 10, la1: -14, la2: 8 }, "snap"],
    [T.egg5 - 10, { ra1: 86, ra2: -8, la1: -14, la2: 8, head: 4 }, "smooth"],
    [T.kettle5, { ra1: 74, ra2: 20, la1: -14, la2: 8, head: 10, lean: 6 }, "smooth"],
    [engBack1, { ra1: 60, ra2: 40, la1: -60, la2: -40, head: 0 }, "smooth"],
    [BOOM, { ra1: 150, ra2: 20, la1: -150, la2: -20, head: -10, lean: -12 }, "snap"],
    [T.c8 + 4, G.rest, "smooth"],
  ]);
  const engMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 9));
    if (t >= engBack0 && t < engBack1) q = addPose(q, walkCycle(t - engBack0, 0.5));
    q = addPose(q, hop(t, POP0, 14));
    q = addPose(q, hop(t, BOOM, 22));
    return { ...q, x: engX(t) };
  };

  // ---------------- co-worker ----------------
  const coIn0 = T.kettle5 + 14;
  const coIn1 = T.looked6 + 2;
  const coOn = f >= coIn0 - 2 && f < BACK1;
  const coX = (t: number) => (t < coIn0 ? COX0 : ease(t, coIn0, coIn1, COX0, COX1)) + (t >= BOOM ? -70 * Math.min(1, (t - BOOM) / 7) : 0);
  const coKeys = gestureKeys([
    [0, G.rest],
    [T.looked6, { ra1: 20, ra2: 40, la1: -20, la2: -30, lean: 8, head: 8 }, "smooth"],
    [T.looked6 + 16, { ra1: 44, ra2: 40, la1: 30, la2: 40, lean: 24, head: 26 }, "smooth"],
    [BOOM, { ra1: 130, ra2: 60, la1: -130, la2: -60, lean: -20, head: -18 }, "snap"],
    [BOOM + 26, { ra1: 60, ra2: 60, la1: -60, la2: -60, lean: -6, head: 2 }, "smooth"],
    [T.c8 + 8, { ra1: 90, ra2: 110, la1: -14, la2: 8, lean: -2, head: 4 }, "smooth"],
  ]);
  const coMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 5));
    if (t >= coIn0 && t < coIn1) q = addPose(q, walkCycle(t - coIn0, 0.46));
    q = addPose(q, hop(t, BOOM, 26));
    q = addPose(q, shake(t, BOOM + 30, 3));
    return { ...q, x: coX(t) };
  };

  // ---------------- explosion ----------------
  const rays = interpolate(f, [BOOM - 1, BOOM + 4, T.c8 - 10, T.c8 + 4], [0, 1, 1, 0], clamp);
  const flash = f >= BOOM && f < BOOM + 10 ? interpolate(f, [BOOM, BOOM + 3, BOOM + 10], [0.2, 1.25, 0], clamp) : 0;
  const dim = interpolate(f, [T.e6 + 2, T.e6 + 12, BOOM - 1, BOOM], [0, 0.42, 0.42, 0], clamp);
  const toldK = f >= BOOM + 28 ? popIn(f, BOOM + 28) * interpolate(f, [T.c8 - 10, T.c8 - 2], [1, 0], { ...clamp, easing: ei }) : 0;
  const lens = boomed && real < BACK0 + 6 ? 1 : 0;
  const lensDrip = interpolate(f, [BOOM + 6, T.c8 + 20], [0, 70], clamp);

  // labels + bubbles
  const engK = f >= T.eng2 - 4 ? popIn(f, T.eng2 - 4) * interpolate(f, [T.c4 - 8, T.c4], [1, 0], clamp) : 0;
  const coK = f >= T.co6 - 8 ? popIn(f, T.co6 - 8) * interpolate(f, [BOOM - 2, BOOM], [1, 0], clamp) : 0;
  const messyK = f >= T.messy1 - 2 && f < T.c2 - 2 ? popIn(f, T.messy1 - 2) * interpolate(f, [T.c2 - 14, T.c2 - 4], [1, 0], clamp) : 0;
  const kettleLabel = f >= T.kettle5 - 4 && f < T.c6 + 4 ? popIn(f, T.kettle5 - 4) * interpolate(f, [T.c6 - 8, T.c6 + 2], [1, 0], clamp) : 0;
  const eggLabel = f >= T.egg5 - 8 && f < T.kettle5 ? popIn(f, T.egg5 - 8) : 0;
  const wavesLabel = f >= T.waves8 - 4 ? popIn(f, T.waves8 - 4) * interpolate(f, [BACK0 - 6, BACK0 + 2], [1, 0], { ...clamp, easing: ei }) : 0;
  const foodK = f >= T.food8 - 2 && f < T.c9 + 8 ? popIn(f, T.food8 - 2) * interpolate(f, [T.c9 - 4, T.c9 + 6], [1, 0], clamp) : 0;
  const askK = f >= T.why9 - 4 && f < T.c10 ? popIn(f, T.why9 - 4) * interpolate(f, [T.c10 - 8, T.c10], [1, 0], clamp) : 0;
  const qK = f >= T.c10 + 4 && !loopBack ? popIn(f, T.c10 + 4) : 0;

  // --- Spark ---
  const sparkKeys = gestureKeys([
    [0, G.pointSide],
    [T.stop0 + 2, { ra1: 92, ra2: 2, la1: -40, la2: -40, lean: -4 }, "snap"],
    [T.micro0, G.doublePoint, "smooth"],
    [T.melted0, { ra1: 96, ra2: -2, la1: -24, la2: 10, head: 6 }, "smooth"],
    [T.c1, { ra1: 84, ra2: 6, la1: -92, la2: -74, lean: -5 }, "snap"],
    [T.last1, { ra1: 84, ra2: 6, la1: -165, la2: -6, head: -6 }, "smooth"],
    [T.messy1, { ra1: 74, ra2: 18, la1: -74, la2: -100, head: 10, lean: -3 }, "snap"],
    [barDown - 4, { ra1: 80, ra2: 6, la1: -16, la2: 8, lean: 6 }, "smooth"],
    [barDown + 12, G.rest, "smooth"],
    [RUN0 + 2, { ra1: 60, ra2: 80, la1: -60, la2: -80, lean: 12 }, "smooth"],
    [RUN1, G.pointSide, "smooth"],
    [T.melted2, G.doublePoint, "snap"],
    [T.c3 - 2, G.thinkChin, "smooth"],
    [T.pop3, G.pointSide, "smooth"],
    [POP0, G.celebrate, "snap"],
    [T.fire4, G.presentBoth, "smooth"],
    [T.c5, G.leanIn, "smooth"],
    [T.egg5, G.pointSide, "snap"],
    [T.c6 - 4, G.stop, "snap"],
    [T.looked6, G.stop, "smooth"],
    [T.e6 + 2, G.recoil, "smooth"],
    [BOOM, { ra1: 132, ra2: 42, la1: -132, la2: -42, head: -6, lean: -4 }, "snap"],
    [T.c8 - 6, G.rest, "smooth"],
    [T.waves8, G.pointSide, "snap"],
    [BACK0, { ra1: 60, ra2: 80, la1: -60, la2: -80, lean: 12 }, "smooth"],
    [BACK1, G.presentBoth, "smooth"],
    [T.c9, G.thinkChin, "smooth"],
    [T.why9 - 2, G.pointUp, "snap"],
    [T.c10, { ra1: 100, ra2: -6, la1: -20, la2: 10, lean: 6 }, "smooth"],
    [barPick + 2, { ra1: 92, ra2: 2, la1: -40, la2: -40, lean: -4 }, "smooth"],
  ]);
  const mood = (t: number): Mood => {
    if (t < T.micro0) return "shock";
    if (t < T.c1) return "skeptical";
    if (t < T.messy1) return "wink";
    if (t < barDown) return "laugh";
    if (t < T.choc2) return "determined";
    if (t < T.c3) return "curious";
    if (t < T.pop3) return "thinking";
    if (t < POP0) return "curious";
    if (t < T.c5) return "excited";
    if (t < T.c6 - 4) return "curious";
    if (t < BOOM) return "worried";
    if (t < T.c8 - 6) return "mindblown";
    if (t < BACK0) return "curious";
    if (t < T.c9) return "happy";
    if (t < T.why9 - 2) return "thinking";
    if (t < T.c10) return "determined";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, POP0, 26), bulbPulse(t, BOOM, 80), bulbPulse(t, T.why9, 34));
  const sparkX = (t: number) => {
    let x = SX0;
    if (t >= RUN0) x = ease(t, RUN0, RUN1, SX0, SXB);
    if (t >= BACK0) x = ease(t, BACK0, BACK1, SXB, SX0);
    return x;
  };
  const running = (t: number) => (t >= RUN0 && t < RUN1) || (t >= BACK0 && t < BACK1);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (t >= RUN0 && t < RUN1) q = addPose(q, runCycle(t - RUN0, 0.5));
    if (t >= BACK0 && t < BACK1) q = addPose(q, runCycle(t - BACK0, 0.5));
    q = addPose(q, hop(t, POP0, 18));
    q = addPose(q, hop(t, BOOM + 1, 30));
    q = addPose(q, nod(t, T.why9 + 2, 2));
    q = addPose(q, shake(t, T.c6 + 6, 3));
    const stepIn = interpolate(t, [BOOM - 10, BOOM + 4, T.c8 - 8, T.c8 + 8], [0, -20, -20, 0], { ...clamp, easing: eio });
    return { ...q, x: sparkX(t) + stepIn };
  };
  const sNow = (() => {
    if (f >= BOOM - 6 && f < T.c8 + 10) return interpolate(f, [BOOM - 4, BOOM + 5, T.c8 - 8, T.c8 + 8], [1.9, 2.5, 2.5, 1.9], { ...clamp, easing: eio });
    if (f < RUN1) return interpolate(f, [RUN0, RUN1], [2.1, 1.9], { ...clamp, easing: eio });
    if (f >= BACK0) return interpolate(f, [BACK0, BACK1], [1.9, 2.1], { ...clamp, easing: eio });
    return 1.9;
  })();
  const facing = (t: number) => (t >= BACK0 && t < BACK1 ? -1 : 1);
  const holdBar = (t: number) => t < barDown + 12 || t >= barPick;
  const kitchenDropOn = f < barDown;

  const svg = (
    <>
      <World f={f} />
      <defs>
        <clipPath id="v030floorclip">
          <rect x={1210} y={-900} width={1900} height={GROUND + 900 - 2} />
        </clipPath>
      </defs>

      {/* flat rays from the kettle: the best picture */}
      {rays > 0.01 && (
        <g opacity={rays} clipPath="url(#v030floorclip)">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M 0 0 L 1700 -150 L 1700 150 Z" fill="#ffe38a" transform={`translate(${BENCHX - 10} ${KTOP}) rotate(${i * 30 + f * 0.1})`} />
          ))}
        </g>
      )}

      {/* ---------- lab sign ---------- */}
      <g transform={`translate(1880 ${362 + 3 * Math.sin(f * 0.05)}) rotate(${-1 + wobble(f, RUN1 - 6, 3)})`}>
        <rect x={-300} y={-62} width={600} height={120} rx={14} fill={YEL} {...K} strokeWidth={7} />
        <Txt y={24} s={66}>
          RADAR LAB, 1940s
        </Txt>
      </g>

      <Machine f={f} on={wavesOn} />
      <Bench />

      {/* egg bits stuck on the wall (behind the actors) */}
      {boomed &&
        BITS.map((b, i) => {
          const t0 = BOOM + b.delay;
          const k = interpolate(f, [t0, t0 + 11], [0, 1], { ...clamp, easing: eo });
          if (k <= 0) return null;
          const x = BENCHX - 16 + (b.x - (BENCHX - 16)) * k;
          const y = KTOP + (b.y - KTOP) * k - 80 * Math.sin(k * Math.PI);
          const landed = k >= 1;
          const drip = landed ? Math.min(18, (f - t0 - 11) * 0.12) : 0;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {landed && b.y < GROUND - 10 && <rect x={-5} y={0} width={10} height={b.r + drip} rx={5} fill={b.yolk ? YOLK : WHITE} />}
              <path d={splat(b.r * (landed ? 1 : 0.7))} fill={b.yolk ? YOLK : WHITE} {...K} strokeWidth={4} />
              {b.yolk && <circle r={b.r * 0.3} cx={-b.r * 0.2} cy={-b.r * 0.2} fill="#fff0b0" />}
            </g>
          );
        })}

      {/* ---------- kettle ---------- */}
      {kettleK > 0.01 && (
        <g transform={`translate(${BENCHX + kShakeX} ${BENCH}) rotate(${kShakeR}) scale(${kettleK * ksx} ${kettleK * ksy})`}>
          <Kettle />
        </g>
      )}
      {eggDrop && (
        <g transform={`translate(${BENCHX - 2} ${interpolate(f, [T.kettle5 - 2, T.kettle5 + 8], [KTOP - 58, KTOP + 34], { ...clamp, easing: ei })})`}>
          <Egg s={1.1} />
        </g>
      )}

      {/* ---------- waves from the tube ---------- */}
      {f >= T.near3 - 2 && f < BACK0 && (
        <Waves x={MACHX - 62} y={HORNY} dir={-1} len={f >= T.c8 - 4 ? 280 : f >= T.c5 ? 90 : 120} h={f >= T.c8 - 4 ? 170 : f >= T.c5 ? 44 : 72} f={f * 2} c={f >= T.c8 - 4 ? "#ffb21f" : WHITE} o={wavesOn * wavesOff * interpolate(f, [BOOM - 1, BOOM, T.c8 - 6, T.c8 + 4], [1, 0, 0, 1], clamp)} />
      )}

      {/* the burst itself, on the frames of the hit */}
      {flash > 0.01 && (
        <g transform={`translate(${BENCHX - 8} ${KTOP - 26}) scale(${flash})`}>
          <path d={Array.from({ length: 16 }, (_, i) => `${i === 0 ? "M" : "L"} ${(i % 2 ? 150 : 300) * Math.cos((i * Math.PI) / 8)} ${(i % 2 ? 150 : 300) * Math.sin((i * Math.PI) / 8)}`).join(" ") + " Z"} fill={WHITE} {...K} strokeWidth={8} />
          <path d={splat(106)} fill={YOLK} {...K} strokeWidth={6} />
        </g>
      )}

      {/* ---------- kitchen: microwave, bar on the counter ---------- */}
      <g transform={`translate(${MWX} ${COUNTER})`}>
        <Microwave on={mwOn} f={f} pop={mwPop} steam={mwSteam} />
      </g>
      {barOnCounter && (
        <g transform={`translate(${barAt[0]} ${barAt[1]}) rotate(4) scale(0.8)`}>
          <ChocBar melt={1} f={f} />
        </g>
      )}
      {kitchenDropOn &&
        [0, 1].map((i) => {
          const tt = ((f + i * 26) % 52) / 52;
          return <Drop key={i} x={SX0 + 178 + i * 20} y={interpolate(tt, [0, 1], [930, GROUND + 6], { easing: ei })} r={13} />;
        })}
      {f < barDown + 40 && (
        <ellipse cx={SX0 + 192} cy={GROUND + 18} rx={interpolate(f, [0, T.c1], [52, 96], clamp)} ry={12} fill={CHOC} {...K} strokeWidth={4} />
      )}

      {/* ---------- engineer ---------- */}
      <Actor f={f} color={COL.orange} scale={ENGS} base={{ x: ENGX, y: GROUND - 92.5 * ENGS }} keys={engKeys} mod={engMod} facing={(t) => (t >= engBack0 && t < engBack1 ? -1 : 1)} face={boomed ? "sad" : "happy"} trails={false}>
        {(j) => {
          const nx = j.neck[0];
          const ny = j.neck[1];
          const hx = j.hip[0];
          const hy = j.hip[1];
          // the white lab coat
          const px = nx + (hx - nx) * 0.42 + 24;
          const py = ny + (hy - ny) * 0.42;
          const showBar = f >= T.eng2 - 20 && f < T.c5;
          return (
            <>
              <path d={`M ${nx - 26} ${ny + 2} L ${nx + 26} ${ny + 2} L ${hx + 50} ${hy + 34} L ${hx - 50} ${hy + 34} Z`} fill={WHITE} {...K} strokeWidth={6} />
              <line x1={nx} y1={ny + 4} x2={hx} y2={hy + 32} {...K} strokeWidth={4} />
              {showBar && (
                <g transform={`translate(${px} ${py}) scale(0.34)`}>
                  <ChocBar melt={meltL} f={f} />
                </g>
              )}
              <rect x={px - 24} y={py + 2} width={48} height={40} rx={5} fill={SILVER} {...K} strokeWidth={5} />
              {bagOn && (
                <g
                  transform={`translate(${j.rHand[0] + 42 + bagShake} ${j.rHand[1] - 24}) rotate(${bagShake * 0.8 + (f >= bagGone ? (f - bagGone) * 8 : 0)}) scale(${bagK * interpolate(f, [bagGone, bagGone + 12], [1, 0], { ...clamp, easing: ei })})`}
                >
                  <g transform="scale(1.35)"><PopBag puff={f >= POP0 - 6 && f < POP0 + 46 ? 1 : 0} /></g>
                </g>
              )}
              {eggHold && (
                <g transform={`translate(${j.rHand[0] + 14} ${j.rHand[1] - 26}) scale(${eggK * 1.1})`}>
                  <Egg />
                </g>
              )}
            </>
          );
        }}
      </Actor>
      {engK > 0.01 && f < BACK1 && <Pill x={engX(f) - 70} y={846} w={268} c={COL.orange} k={engK}>ENGINEER</Pill>}

      {/* ---------- co-worker ---------- */}
      {coOn && (
        <Actor f={f} color={COL.purple} scale={ENGS} base={{ x: COX0, y: GROUND - 92.5 * ENGS }} keys={coKeys} mod={coMod} facing={1} face={boomed ? "none" : "happy"} trails={false}>
          {(j) => {
            const [hx, hy] = j.headC;
            const r = j.headR;
            if (!boomed) return null;
            const k = popIn(f, BOOM);
            const blink = Math.floor(f / 11) % 4 === 3;
            return (
              <g transform={`translate(${hx} ${hy}) scale(${k * 1.32})`}>
                {/* a face full of egg */}
                <path d={splat(r * 1.28)} fill={WHITE} {...K} strokeWidth={5} />
                <path d={splat(r * 0.86)} fill={YOLK} {...K} strokeWidth={4} transform="translate(2 8)" />
                <rect x={-r * 0.8} y={r * 0.7} width={13} height={r * 0.9 + Math.min(40, (f - BOOM) * 0.5)} rx={6} fill={YOLK} {...K} strokeWidth={3} />
                <rect x={r * 0.4} y={r * 0.8} width={11} height={r * 0.5 + Math.min(24, (f - BOOM) * 0.3)} rx={5} fill={WHITE} {...K} strokeWidth={3} />
                {/* two eyes looking out */}
                {blink ? (
                  <>
                    <line x1={-r * 0.52} y1={-4} x2={-r * 0.1} y2={-4} {...K} strokeWidth={6} />
                    <line x1={r * 0.2} y1={-4} x2={r * 0.62} y2={-4} {...K} strokeWidth={6} />
                  </>
                ) : (
                  <>
                    <circle cx={-r * 0.3} cy={-4} r={r * 0.26} fill={WHITE} {...K} strokeWidth={4} />
                    <circle cx={r * 0.4} cy={-4} r={r * 0.26} fill={WHITE} {...K} strokeWidth={4} />
                    <circle cx={-r * 0.3} cy={-3} r={r * 0.09} fill={INK} />
                    <circle cx={r * 0.4} cy={-3} r={r * 0.09} fill={INK} />
                  </>
                )}
                {/* half a shell on top */}
                <path d={`M ${-r * 0.8} ${-r * 0.84} L ${-r * 0.5} ${-r * 1.14} L ${-r * 0.2} ${-r * 0.92} L ${r * 0.12} ${-r * 1.18} L ${r * 0.42} ${-r * 0.92} L ${r * 0.8} ${-r * 1.08} Q ${r} ${-r * 0.6} ${r * 0.72} ${-r * 0.56} L ${-r * 0.7} ${-r * 0.56} Q ${-r} ${-r * 0.62} ${-r * 0.8} ${-r * 0.84} Z`} fill={WHITE} {...K} strokeWidth={5} transform={`rotate(-10) translate(0 ${-r * 0.2})`} />
              </g>
            );
          }}
        </Actor>
      )}
      {coOn && coK > 0.01 && <Pill x={coX(f)} y={820} w={290} c={COL.purple} k={coK}>CO-WORKER</Pill>}

      {/* ---------- popcorn all over the lab ---------- */}
      {f >= POP0 &&
        KERNELS.map((k, i) => {
          const t = f - POP0 - k.t0;
          if (t < 0) return null;
          const g = 0.9;
          const yTop = k.y0 + k.vy * t + 0.5 * g * t * t;
          const tLand = (-k.vy + Math.sqrt(k.vy * k.vy + 2 * g * (k.land - k.y0))) / g;
          const tt = Math.min(t, tLand);
          const x = Math.min(2420, Math.max(1370, k.x0 + k.vx * tt));
          const y = t >= tLand ? k.land : yTop;
          if (real >= BACK1 + 40) return null;
          return <Popcorn key={i} x={x} y={y} r={k.r} rot={k.rot + tt * 14} />;
        })}

      {/* insert: the pocket, big */}
      {insertK > 0.01 && (
        <g transform={`translate(1950 690) scale(${insertK})`}>
          <line x1={-110} y1={120} x2={-178} y2={330} {...K} strokeWidth={5} />
          <circle r={158} fill="#fff6e6" {...K} strokeWidth={8} />
          <g transform="translate(0 -6) scale(0.92)">
            <ChocBar melt={meltL} f={f} />
          </g>
          <rect x={-104} y={36} width={208} height={106} rx={12} fill={SILVER} {...K} strokeWidth={6} />
          <path d={`M -86 58 L 86 58`} {...K} strokeWidth={4} opacity={0.5} />
          {meltL > 0.5 && <Drop x={-44 + 6 * Math.sin(f * 0.1)} y={110 + ((f * 2) % 28)} r={11} />}
        </g>
      )}

      {/* ---------- bubbles ---------- */}
      {whyK > 0.01 && (
        <g transform={`translate(${ENGX + 40} 750) scale(${whyK}) rotate(${wobble(f, T.why3, 6)})`}>
          <Bubble w={210} h={110} fill={YEL} tail={-30}>
            <Txt y={22} s={68}>
              WHY?
            </Txt>
          </Bubble>
        </g>
      )}
      {fireK > 0.01 && (
        <g transform={`translate(1640 720) scale(${fireK}) rotate(${wobble(f, T.no4, 5)})`}>
          <Bubble w={340} h={118} tail={-90}>
            <Txt y={24} s={72}>
              NO FIRE!
            </Txt>
          </Bubble>
        </g>
      )}
      {messyK > 0.01 && (
        <g transform={`translate(${SX0 + 240} 700) scale(${messyK}) rotate(${wobble(f, T.messy1 - 2, 5)})`}>
          <Bubble w={420} h={116} fill={YEL} tail={-130}>
            <Txt y={22} s={60}>
              IT GETS MESSY
            </Txt>
          </Bubble>
        </g>
      )}
      {toldK > 0.01 && (
        <g transform={`translate(1690 560) scale(${toldK}) rotate(${wobble(f, BOOM + 28, 5) - 2})`}>
          <Bubble w={500} h={124} fill={YEL} tail={-190}>
            <Txt y={25} s={72}>
              I SAID MESSY!
            </Txt>
          </Bubble>
        </g>
      )}
      {foodK > 0.01 && (
        <g transform={`translate(${MWX - 30} 610) scale(${foodK})`}>
          <Bubble w={360} h={110} tail={-30}>
            <Txt y={22} s={64}>
              YOUR FOOD
            </Txt>
          </Bubble>
        </g>
      )}
      {askK > 0.01 && (
        <g transform={`translate(${SX0 + 230} 660) scale(${askK}) rotate(${wobble(f, T.why9 - 4, 5)})`}>
          <Bubble w={330} h={120} fill={YEL} tail={-110}>
            <Txt y={24} s={72}>
              ASK WHY
            </Txt>
          </Bubble>
        </g>
      )}
      {qK > 0.01 && (
        <g transform={`translate(${SX0 + 260} 640) scale(${qK}) rotate(${wobble(f, T.c10 + 4, 5)})`}>
          <Bubble w={520} h={116} tail={-170}>
            <Txt y={22} s={58}>
              WHAT DID YOU HEAT?
            </Txt>
          </Bubble>
        </g>
      )}
      {kettleLabel > 0.01 && <Pill x={BENCHX} y={BENCH + 62} w={210} c={INK} k={kettleLabel}>KETTLE</Pill>}
      {eggLabel > 0.01 && <Pill x={ENGX + 160} y={830} w={130} c={INK} k={eggLabel}>EGG</Pill>}
      {wavesLabel > 0.01 && (
        <g transform={`translate(1850 790) scale(${wavesLabel})`}>
          <Bubble w={500} h={112} tail={120}>
            <Txt y={22} s={60}>
              INVISIBLE WAVES
            </Txt>
          </Bubble>
        </g>
      )}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={facing}>
        {(j) => {
          const k = barK(f);
          if (!holdBar(f) || running(f)) return null;
          const hx = j.rHand[0] + 8;
          const hy = j.rHand[1] - 10;
          const x = hx + (barAt[0] - hx) * k;
          const y = hy + (barAt[1] - hy) * k;
          return (
            <g transform={`translate(${x} ${y}) rotate(${4 * k}) scale(${1 - 0.2 * k})`}>
              <ChocBar melt={f < T.c2 ? melt0 : 1} f={f} />
            </g>
          );
        }}
      </Spark>

      {dim > 0.01 && <rect x={-1100} y={-900} width={4400} height={3400} fill="#0d1626" opacity={dim} />}
      {/* the kettle stays lit while the lights drop */}
      {dim > 0.01 && kettleK > 0.01 && (
        <g transform={`translate(${BENCHX + kShakeX} ${BENCH}) rotate(${kShakeR}) scale(${ksx} ${ksy})`} opacity={dim / 0.42}>
          <Kettle />
        </g>
      )}
    </>
  );

  const overlay = real < T.c1 - 4 || loopBack;
  const html = (
    <>
      {overlay && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 158,
            color: YEL,
            WebkitTextStroke: `12px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          CHOCOLATE
          <br />
          MADE THIS?
        </div>
      )}
      {/* a bit of egg on the camera */}
      {lens > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <g transform={`translate(985 620) scale(${popIn(f, BOOM + 2)})`}>
            <rect x={-24} y={30} width={26} height={70 + lensDrip} rx={13} fill={YOLK} {...K} strokeWidth={4} />
            <path d={splat(124)} fill={WHITE} {...K} strokeWidth={6} />
            <path d={splat(68)} fill={YOLK} {...K} strokeWidth={5} />
            <circle cx={-18} cy={-18} r={18} fill="#fff0b0" />
          </g>
        </svg>
      )}
      {real >= 300 && real < LOOP - 4 && (
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
            {real < T.c5 - 4
              ? "Story from a 1958 magazine article. No lab record proves it."
              : real < T.c8 - 6
                ? "Please don't try this: an egg in its shell can burst in a microwave."
                : "Spencer, Raytheon: patent filed in 1945. First oven sold in 1947."}
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
            HOW IT STARTED
          </div>
        </>
      )}
      <VoiceCaptions
        f={real}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "microwave", "chocolate", "last", "messy", "melted", "radar", "machine", "why", "popcorn", "popped", "fire", "egg", "kettle", "co-worker", "exploded", "face", "invisible", "waves", "food", "ask", "heat"]}
      />
    </>
  );

  const hits = [T.stop0 + 1, BOOM, BOOM + 2];
  return <Stage bg={<AbsoluteFill style={{ background: PEACH }} />} cam={cam} hits={hits} power={6} svg={svg} html={html} />;
};
