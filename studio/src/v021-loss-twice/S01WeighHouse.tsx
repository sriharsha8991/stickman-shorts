import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V021 · "Lose ₹500. Win ₹500. Not equal." (Designed to get you, ~27 s)
// World A: an old weigh house (burgundy wallpaper, wood floor) with a giant brass balance: LOSS pan vs GAIN pan.
// The loss side slams down; a ghost twin note proves the brain counts it twice; a GOOD BET ticket flutters away.
// Slice → World B: a coin-flip game show (navy stage, orange marquee). Tails = −₹500; heads = +₹ ???, the counter
// rolls to ₹1,000 ("most people want about double"). Hard cut back to the scale: ₹1,000 levels it. Twist: anything over
// ₹500 wins on average (MATH ✓) but the scale still tips to LOSS. Spark drops a calculator on GAIN: level. Loops to frame 0.
// Sources: Brown, Imai, Vieider & Camerer 2024 (JEL meta-analysis, mean ≈ 1.96); Tversky & Kahneman 1992 (λ ≈ 2.25).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 197;
const SX = 190; // Spark in the weigh house
const BX = 250; // Spark on the game-show stage

// palette: weigh house (A) + game show (B)
const WALL = "#7d2440";
const WALL2 = "#6a1d36";
const STRIPE = "#c9963a";
const WOOD = "#5a3a22";
const WOOD2 = "#47301c";
const BRASS = "#f0c040";
const BRASS2 = "#b8861e";
const LOSSC = "#e8505b";
const GAINC = "#58c26a";
const CREAM = "#fff4dc";
const NAVY = "#16204a";
const NAVY2 = "#22306a";
const STAGE = "#2b3a7a";
const ORANGE = "#ff8a1f";
const GOLD = "#ffd23f";
const INK = COL.ink;

const T = {
  lose: W(0, 0),
  win0: W(0, 3),
  not: W(0, 6),
  equal: W(0, 7),
  c1: C(1),
  brain: W(1, 1),
  loss1: W(1, 4),
  twice: W(1, 5),
  c2: C(2),
  talks: W(2, 2),
  out: W(2, 4),
  bets: W(2, 7),
  b0: C(3),
  flip: W(3, 3),
  coin: W(3, 5),
  c4: C(4),
  lose4: W(4, 2),
  c5: C(5),
  win5: W(5, 2),
  much: W(5, 4),
  c6: C(6),
  want: W(6, 2),
  double: W(6, 4),
  a2: C(7),
  thousand: W(7, 1),
  even: W(7, 5),
  c8: C(8),
  anything: W(8, 1),
  over: W(8, 2),
  wins: W(8, 5),
  c9: C(9),
  feel: W(9, 4),
  c10: C(10),
  scares: W(10, 5),
  c11: C(11),
  math: W(11, 2),
  flinch: W(11, 5),
  c12: C(12),
  price: W(12, 2),
  flip12: W(12, 4),
};
const LOOP = VOICE_FRAMES - 14;
const GAME0 = T.b0;
const GAME1 = T.a2;
const LAND = T.c4 - 2; // the flipped coin lands
const CALC = T.math + 3; // calculator lands on GAIN
const COINDROP = T.over + 4; // single coin lands on GAIN in the twist

const PX = 620; // scale pivot
const PY = 520;
const ARM = 250;
const CHAIN = 175;

const SHOTS: Shot[] = [
  { f: 0, z: 1.15, at: [560, 860], e: "cut" }, // frame 0: Spark + slammed scale
  { f: T.not - 3, z: 1.7, at: [380, 820], e: "snap" }, // INSERT LOSS pan
  { f: T.c1, z: 2.0, at: [SX + 20, HEADY], e: "cut" }, // CU: "your brain"
  { f: T.twice - 3, z: 1.45, at: [480, 820], e: "snap" }, // MED: twin note lands
  { f: T.c2, z: 1.0, at: [540, 960], e: "cut" }, // WIDE
  { f: T.out - 4, z: 1.45, at: [400, 980], e: "snap" }, // INSERT ticket
  { f: GAME0, z: 1.0, at: [540, 960], e: "cut" }, // slice → WIDE game show
  { f: GAME0 + 6, z: 1.15, at: [600, 820], e: "slow" }, // slow push
  { f: LAND - 3, z: 1.8, at: [720, 1130], e: "snap" }, // INSERT coin lands
  { f: T.lose4 - 3, z: 1.6, at: [300, 450], e: "snap" }, // TAILS panel
  { f: T.c5, z: 2.0, at: [BX + 20, HEADY], e: "cut" }, // CU: heads, how much?
  { f: T.win5 + 2, z: 1.6, at: [780, 450], e: "snap" }, // HEADS panel
  { f: T.c6, z: 1.2, at: [560, 700], e: "cut" }, // MED: counter + Spark
  { f: T.double - 2, z: 1.7, at: [780, 450], e: "snap" }, // punch on ₹1,000
  { f: GAME1, z: 1.1, at: [560, 880], e: "cut" }, // hard cut WIDE weigh house
  { f: T.even - 6, z: 1.5, at: [620, 720], e: "snap" }, // INSERT scale levels
  { f: T.c8, z: 2.0, at: [SX + 20, HEADY], e: "cut" }, // CU re-hook "But…"
  { f: T.over - 2, z: 1.35, at: [620, 700], e: "snap" }, // MED scale + stamp
  { f: T.c9, z: 2.05, at: [SX + 20, HEADY], e: "cut" }, // CU: won't feel it
  { f: T.c10, z: 1.25, at: [430, 900], e: "cut" }, // MED: flinch
  { f: T.math - 4, z: 1.6, at: [840, 760], e: "snap" }, // INSERT calculator on GAIN
  { f: T.flinch, z: 1.2, at: [520, 860], e: "smooth" }, // MED: level scale + Spark
  { f: T.c12, z: 2.05, at: [SX + 30, HEADY], e: "cut" }, // CU comment question
  { f: LOOP, z: 1.15, at: [560, 860], e: "cut" }, // back into frame 0
];

// --- props ------------------------------------------------------------------------------------------------------
const Note: React.FC<{ col: string; label?: string; r?: number; o?: number }> = ({ col, label = "₹500", r = 0, o = 1 }) => (
  <g transform={`rotate(${r})`} opacity={o}>
    <rect x={-78} y={-36} width={156} height={72} rx={8} fill={col} {...K} strokeWidth={5} />
    <rect x={-66} y={-26} width={132} height={52} rx={5} fill="none" stroke={INK} strokeWidth={2} opacity={0.4} />
    <circle cx={-46} cy={0} r={14} fill="#fff" opacity={0.45} />
    <text x={14} y={13} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">
      {label}
    </text>
  </g>
);

const Coin: React.FC<{ s?: number; spin?: number; face?: "₹" | "TAILS" | "HEADS" }> = ({ s = 1, spin = 0, face = "₹" }) => {
  const sx = Math.max(0.08, Math.abs(Math.cos(spin)));
  return (
    <g transform={`scale(${s * sx} ${s})`}>
      <circle r={62} fill={GOLD} {...K} strokeWidth={6} />
      <circle r={48} fill="none" stroke={BRASS2} strokeWidth={4} />
      <text y={face === "₹" ? 20 : 10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={face === "₹" ? 58 : 24} fill={BRASS2}>
        {face}
      </text>
    </g>
  );
};

const Calculator: React.FC = () => (
  <g>
    <rect x={-52} y={-70} width={104} height={140} rx={14} fill="#3a3f4b" {...K} strokeWidth={5} />
    <rect x={-40} y={-58} width={80} height={32} rx={4} fill="#b9e3a0" stroke={INK} strokeWidth={3} />
    <text x={32} y={-34} textAnchor="end" fontFamily={FONT.body} fontWeight={800} fontSize={22} fill={INK}>
      +
    </text>
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-38 + c * 28} y={-14 + r * 26} width={20} height={18} rx={4} fill={r === 2 && c === 2 ? ORANGE : CREAM} stroke={INK} strokeWidth={2} />),
    )}
  </g>
);

const Ticket: React.FC<{ r?: number }> = ({ r = 0 }) => (
  <g transform={`rotate(${r})`}>
    <path d="M -110 -46 L 110 -46 L 110 -14 Q 94 0 110 14 L 110 46 L -110 46 L -110 14 Q -94 0 -110 -14 Z" fill={GAINC} {...K} strokeWidth={5} />
    <line x1={-64} y1={-40} x2={-64} y2={40} stroke={INK} strokeWidth={3} strokeDasharray="7 6" />
    <text x={22} y={-4} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">
      GOOD
    </text>
    <text x={22} y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#fff" stroke={INK} strokeWidth={5} paintOrder="stroke">
      BET
    </text>
  </g>
);

const Stamp: React.FC<{ k: number; sq: number; text: string; col: string }> = ({ k, sq, text, col }) =>
  k > 0.01 ? (
    <g transform={`rotate(-10) scale(${k / sq} ${k * sq})`}>
      <rect x={-130} y={-46} width={260} height={92} rx={12} fill={CREAM} stroke={col} strokeWidth={9} />
      <text y={20} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={58} fill={col}>
        {text}
      </text>
    </g>
  ) : null;

// the balance. tilt > 0 = LOSS (left) side down. loss/gain = what sits on each pan.
const Scale: React.FC<{ tilt: number; loss: React.ReactNode; gain: React.ReactNode; f: number }> = ({ tilt, loss, gain }) => {
  const a = (tilt * Math.PI) / 180;
  const L: [number, number] = [PX - ARM * Math.cos(a), PY + ARM * Math.sin(a)];
  const R: [number, number] = [PX + ARM * Math.cos(a), PY - ARM * Math.sin(a)];
  const pan = (p: [number, number], label: string, col: string, items: React.ReactNode) => (
    <g>
      {[-92, 0, 92].map((dx) => (
        <line key={dx} x1={p[0]} y1={p[1]} x2={p[0] + dx} y2={p[1] + CHAIN} stroke={BRASS2} strokeWidth={5} />
      ))}
      <g transform={`translate(${p[0]} ${p[1] + CHAIN})`}>
        {items}
        <path d="M -118 0 L 118 0 Q 100 56 0 60 Q -100 56 -118 0 Z" fill={BRASS} {...K} strokeWidth={6} />
        <rect x={-58} y={14} width={116} height={34} rx={8} fill={col} stroke={INK} strokeWidth={4} />
        <text y={41} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill="#fff" stroke={INK} strokeWidth={4} paintOrder="stroke">
          {label}
        </text>
      </g>
    </g>
  );
  return (
    <g>
      {/* column + base */}
      <path d={`M ${PX - 150} ${GROUND} L ${PX + 150} ${GROUND} L ${PX + 100} ${GROUND - 60} L ${PX - 100} ${GROUND - 60} Z`} fill={BRASS2} {...K} />
      <rect x={PX - 22} y={PY} width={44} height={GROUND - 60 - PY} fill={BRASS} {...K} />
      <rect x={PX - 40} y={GROUND - 120} width={80} height={60} rx={8} fill={BRASS} {...K} />
      {/* beam */}
      <g transform={`translate(${PX} ${PY}) rotate(${-tilt})`}>
        <rect x={-ARM - 16} y={-14} width={2 * ARM + 32} height={28} rx={14} fill={BRASS} {...K} />
        <path d="M 0 -60 L 14 -14 L -14 -14 Z" fill={BRASS2} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <circle cx={PX} cy={PY} r={22} fill={BRASS2} {...K} strokeWidth={5} />
      <circle cx={PX} cy={PY} r={7} fill={INK} />
      {pan(L, "LOSS", LOSSC, loss)}
      {pan(R, "GAIN", GAINC, gain)}
    </g>
  );
};

const WeighHouse: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={WALL} />
    {Array.from({ length: 10 }, (_, i) => (
      <rect key={i} x={i * 120 + 40} y={0} width={14} height={GROUND - 260} fill={STRIPE} opacity={0.35} />
    ))}
    {/* wainscot */}
    <rect x={0} y={GROUND - 260} width={1080} height={260} fill={WALL2} />
    <rect x={0} y={GROUND - 272} width={1080} height={20} fill={STRIPE} stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={40 + i * 260} y={GROUND - 220} width={220} height={180} rx={10} fill="none" stroke={STRIPE} strokeWidth={5} opacity={0.5} />
    ))}
    {/* hanging lamp */}
    <line x1={900} y1={0} x2={900} y2={170} stroke={INK} strokeWidth={5} />
    <path d="M 850 170 L 950 170 L 930 140 L 870 140 Z" fill={BRASS} {...K} strokeWidth={5} />
    <circle cx={900} cy={182} r={16} fill={GOLD} stroke={INK} strokeWidth={4} />
    {/* floor */}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={WOOD} />
    {Array.from({ length: 6 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 70 + i * 90} x2={1080} y2={GROUND + 70 + i * 90} stroke={WOOD2} strokeWidth={6} />
    ))}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// --- world B: the coin-flip game show -------------------------------------------------------------------------------
const Panel: React.FC<{ x: number; title: string; col: string; lit: number; value: string; blink?: boolean; f: number }> = ({ x, title, col, lit, value, blink, f }) => (
  <g transform={`translate(${x} 450)`}>
    <rect x={-200} y={-150} width={400} height={300} rx={26} fill={NAVY2} {...K} strokeWidth={7} />
    <rect x={-200} y={-150} width={400} height={80} rx={26} fill={col} {...K} strokeWidth={7} />
    <text y={-94} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke">
      {title}
    </text>
    <rect x={-170} y={-50} width={340} height={170} rx={16} fill="#0b1030" stroke={INK} strokeWidth={4} />
    {lit > 0.01 && (
      <text
        y={66}
        textAnchor="middle"
        fontFamily={FONT.title}
        fontWeight={900}
        fontSize={86}
        fill={col}
        opacity={blink ? 0.45 + 0.55 * (Math.floor(f / 5) % 2) : 1}
        transform={`scale(${lit})`}
      >
        {value}
      </text>
    )}
  </g>
);

const GameShow: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect width={1080} height={1920} fill={NAVY} />
    {/* sunburst */}
    <g transform="translate(540 760)" opacity={0.18}>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M 0 0 L -70 -900 L 70 -900 Z" fill={ORANGE} transform={`rotate(${i * 22.5 + f * 0.3})`} />
      ))}
    </g>
    {/* marquee frame with chasing bulbs */}
    <rect x={60} y={250} width={960} height={420} rx={30} fill="none" stroke={ORANGE} strokeWidth={16} />
    {Array.from({ length: 22 }, (_, i) => {
      const t = i / 22;
      const per = 2 * (960 + 420);
      let d = t * per;
      let x = 60;
      let y = 250;
      if (d < 960) x += d;
      else if ((d -= 960) < 420) (x += 960), (y += d);
      else if ((d -= 420) < 960) (x += 960 - d), (y += 420);
      else (d -= 960), (y += 420 - d);
      return <circle key={i} cx={x} cy={y} r={10} fill={(i + Math.floor(f / 4)) % 3 === 0 ? "#fff" : GOLD} stroke={INK} strokeWidth={3} />;
    })}
    {/* landing pad */}
    <ellipse cx={720} cy={1210} rx={170} ry={36} fill={ORANGE} stroke={INK} strokeWidth={5} />
    <rect x={570} y={1210} width={300} height={GROUND - 1210} fill="#c9661a" {...K} strokeWidth={5} />
    {/* stage */}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={STAGE} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={i * 150} y1={GROUND} x2={i * 150 - 80} y2={1920} stroke={NAVY2} strokeWidth={6} />
    ))}
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [0, "thud", 0.6],
  [2, "clink", 0.35],
  [T.win0, "clink", 0.3],
  [T.not - 3, "whoosh", 0.25],
  [T.not, "impact", 0.55],
  [T.c1, "whoosh", 0.25],
  [T.twice - 4, "swish", 0.3],
  [T.twice, "slam", 0.55],
  [T.c2, "whoosh", 0.2],
  [T.talks, "pop", 0.35],
  [T.out, "boing", 0.35],
  [T.out + 6, "whoosh", 0.3],
  [GAME0 - 5, "whoosh_long", 0.45],
  [T.flip, "swish", 0.4],
  [LAND - 3, "whoosh", 0.25],
  [LAND, "thud", 0.5],
  [LAND + 2, "clink", 0.35],
  [T.lose4, "buzz", 0.35],
  [T.c5, "whoosh", 0.2],
  [T.win5 + 2, "ding", 0.35],
  [T.want - 8, "riser", 0.4],
  [T.want, "tick", 0.3],
  [T.want + 6, "tick", 0.3],
  [T.want + 12, "tick", 0.3],
  [T.double, "impact", 0.6],
  [GAME1, "whoosh", 0.3],
  [T.thousand + 3, "clink", 0.45],
  [T.even, "ding", 0.45],
  [T.c8, "whoosh", 0.25],
  [T.anything, "whoosh", 0.3],
  [COINDROP, "clink", 0.45],
  [T.wins, "stamp", 0.6],
  [T.c9, "whoosh", 0.2],
  [T.c10, "whoosh", 0.2],
  [T.scares, "boing", 0.3],
  [T.math - 6, "swish", 0.35],
  [CALC, "thud", 0.45],
  [CALC + 2, "clink", 0.4],
  [T.flinch, "ding", 0.45],
  [T.c12, "whoosh", 0.25],
  [T.flip12, "swish", 0.35],
  [LOOP, "thud", 0.6],
];

const HOLD: Partial<Pose> = { la1: -150, la2: -40, ra1: 150, ra2: 40, head: 6 }; // hands on cheeks, shocked

export const S01WeighHouse: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const game = f >= GAME0 && f < GAME1;
  const loopBack = f >= LOOP - 2;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.not, T.twice, T.double, T.wins, CALC], 0.035) };

  // --- scale state (world A) ---
  const twin = f >= T.twice - 4 && f < GAME0; // ghost twin LOSS note
  const twinY = interpolate(f, [T.twice - 4, T.twice], [-260, 0], clamp);
  const gain2 = f >= T.thousand - 2 && f < T.anything + 2; // second green note (₹1,000 total)
  const gain2Y = interpolate(f, [T.thousand - 2, T.thousand + 3], [-300, 0], clamp);
  const fly = interpolate(f, [T.anything, T.anything + 16], [0, 1], clamp); // the extra note flies away
  const coinOn = f >= COINDROP - 6 && f < LOOP - 2;
  const coinY = interpolate(f, [COINDROP - 6, COINDROP], [-320, -50], clamp);
  const calcT = interpolate(f, [T.math - 6, CALC], [0, 1], clamp);
  const calcOn = f >= T.math - 6 && f < LOOP - 2;

  let tilt: number;
  if (loopBack || f < T.twice) tilt = 16 + wobble(f, loopBack ? LOOP : 0, 7) + (f >= T.not && !loopBack ? wobble(f, T.not, 4) : 0);
  else if (f < GAME0) tilt = 26 + wobble(f, T.twice, 6) + (f >= T.out ? wobble(f, T.out, 3) : 0);
  else if (f < T.anything) tilt = interpolate(f, [T.thousand, T.even], [26, 0], { ...clamp }) + (f >= T.even ? wobble(f, T.even, 3) : 0);
  else if (f < CALC) tilt = ease(f, T.anything + 4, COINDROP + 6, 0, 18) + wobble(f, COINDROP, 4) + (f >= T.scares ? wobble(f, T.scares, 3) : 0);
  else tilt = ease(f, CALC, CALC + 14, 18, 0) + wobble(f, CALC + 14, 5);

  const lossItems = (
    <g>
      <g transform="translate(0 -34)">
        <Note col={LOSSC} r={-3} />
      </g>
      {twin && (
        <g transform={`translate(0 ${-74 + twinY})`}>
          <Note col={LOSSC} r={4} o={0.75} />
        </g>
      )}
    </g>
  );
  const gainItems = (
    <g>
      <g transform="translate(0 -34)">
        <Note col={GAINC} r={2} />
      </g>
      {gain2 && (
        <g transform={`translate(${fly * 420} ${-74 + gain2Y - Math.sin(fly * Math.PI) * 260}) rotate(${fly * 160})`}>
          <Note col={GAINC} r={-4} />
        </g>
      )}
      {coinOn && (
        <g transform={`translate(30 ${coinY}) scale(${squash(f, COINDROP, 0.25)[0]} ${squash(f, COINDROP, 0.25)[1]})`}>
          <Coin s={0.55} />
        </g>
      )}
    </g>
  );

  // ticket gag
  const ticketOn = !game && f >= T.c2 && f < GAME0;
  const ticketK = popIn(f, T.talks);
  const ticketFly = interpolate(f, [T.out + 4, T.bets + 8], [0, 1], clamp);
  const [tkx, tky] = arc(ticketFly, [440, 1000], [1250, 700], 260);

  // stamp MATH ✓
  const stampK = f >= T.wins && f < CALC + 10 && !game ? popIn(f, T.wins) : 0;
  const stampSq = squash(f, T.wins, 0.22)[1];

  // --- game show state (world B) ---
  const coinT = interpolate(f, [T.flip, LAND], [0, 1], clamp);
  const flying = f >= T.flip && f < LAND;
  const [cx, cy] = arc(coinT, [BX + 110, 950], [720, 1150], 640);
  const tailsK = f >= T.lose4 ? popIn(f, T.lose4) : 0;
  const headsK = f >= T.win5 + 2 ? popIn(f, T.win5 + 2) : 0;
  const count = Math.round(interpolate(f, [T.want, T.double], [500, 1000], clamp) / 50) * 50;
  const headsVal = f < T.want ? "+₹???" : `+₹${count.toLocaleString("en-IN")}`;

  const sparkKeys = game
    ? gestureKeys([
        [GAME0, G.beckon],
        [T.flip - 3, { la1: -30, la2: -20, ra1: 60, ra2: 70, head: 4 }, "snap"],
        [T.flip + 2, G.pointUp, "snap"],
        [T.c4, G.doublePoint, "snap"],
        [T.c5, G.thinkChin, "snap"],
        [T.much, G.shrugBig, "snap"],
        [T.want, G.present, "snap"],
        [T.double, G.mindBlown, "snap"],
      ])
    : gestureKeys([
        [0, HOLD],
        [T.not - 2, G.stop, "snap"],
        [T.c1, G.pointUp, "snap"],
        [T.twice - 2, G.mindBlown, "snap"],
        [T.c2, G.present, "snap"],
        [T.out - 2, G.recoil, "snap"],
        [GAME1, G.present, "snap"],
        [T.even, G.handsHips, "snap"],
        [T.c8, G.stop, "snap"],
        [T.over, G.pointSide, "snap"],
        [T.c9, G.facepalm, "snap"],
        [T.c10, G.recoil, "snap"],
        [T.math - 8, { la1: -20, la2: -10, ra1: 120, ra2: 40, head: 4 }, "snap"],
        [T.math, G.fistPump, "snap"],
        [T.c12, G.leanIn, "snap"],
        [T.price, { la1: -20, la2: -10, ra1: 110, ra2: 50, head: 6 }, "snap"],
        [LOOP - 2, HOLD],
      ]);

  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "shock";
    if (t < T.not) return "shock";
    if (t < T.c1) return "skeptical";
    if (t < T.twice) return "curious";
    if (t < T.c2) return "mindblown";
    if (t < T.out) return "excited";
    if (t < GAME0) return "worried";
    if (t < T.c4) return "excited";
    if (t < T.c5) return "worried";
    if (t < T.c6) return "curious";
    if (t < T.double) return "thinking";
    if (t < GAME1) return "shock";
    if (t < T.c8) return "happy";
    if (t < T.wins) return "smug";
    if (t < T.c9) return "wink";
    if (t < T.c10) return "sad";
    if (t < T.c11) return "worried";
    if (t < T.c12) return "determined";
    return "curious";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.twice, 26), bulbPulse(t, T.double, 24), bulbPulse(t, T.wins, 22), bulbPulse(t, T.math, 30));

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(addPose(q, shake(t, 0, 3)), shake(t, T.twice, 2));
    q = addPose(addPose(q, nod(t, T.c1 + 4, 1)), shake(t, T.out, 3));
    q = addPose(addPose(q, hop(t, T.flip, 22)), shake(t, T.lose4, 2));
    q = addPose(addPose(q, hop(t, T.double, 24)), nod(t, T.even, 1));
    q = addPose(addPose(q, nod(t, T.wins, 1)), shake(t, T.feel, 2));
    q = addPose(addPose(q, shake(t, T.scares, 3)), hop(t, T.math, 26));
    q = addPose(addPose(q, nod(t, T.price, 1)), shake(t, LOOP, 3));
    return { ...q, x: game ? BX : SX };
  };

  // coin in Spark's hand (before the flip in B, and on the final question in A)
  const coinInHand = (game && f < T.flip) || (!game && f >= T.c12 && f < T.flip12 + 2 && !loopBack);
  const endCoinT = interpolate(f, [T.flip12 + 2, T.flip12 + 20], [0, 1], clamp);
  const endCoinOn = !game && f >= T.flip12 + 2 && f < LOOP - 2;

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: game ? NAVY : WALL }} />}
      cam={cam}
      hits={[T.not, T.double, CALC]}
      power={10}
      svg={
        game ? (
          <>
            <GameShow f={f} />
            <Panel x={300} title="TAILS" col={LOSSC} lit={tailsK} value="−₹500" f={f} />
            <Panel x={780} title="HEADS" col={GAINC} lit={headsK} value={headsVal} blink={f < T.want} f={f} />
            {flying && (
              <g transform={`translate(${cx} ${cy})`}>
                <Coin s={0.9} spin={f * 0.7} />
              </g>
            )}
            {f >= LAND && (
              <g transform={`translate(720 1150) scale(${squash(f, LAND, 0.3)[0]} ${squash(f, LAND, 0.3)[1]})`}>
                <Coin s={0.9} face="TAILS" />
              </g>
            )}
            {f >= LAND && f < LAND + 14 && <Burst x={720} y={1150} at={LAND} f={f} size={160} color={GOLD} />}
            {f >= T.double && f < T.double + 16 && <Burst x={780} y={510} at={T.double} f={f} size={260} color={GAINC} />}
            <Spark f={f} scale={SS} base={{ x: BX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
              {(j) =>
                coinInHand ? (
                  <g transform={`translate(${j.rHand[0] + 6} ${j.rHand[1] - 30})`}>
                    <Coin s={0.6} spin={Math.sin(f / 6) * 0.4} />
                  </g>
                ) : null
              }
            </Spark>
          </>
        ) : (
          <>
            <WeighHouse />
            <Scale tilt={tilt} loss={lossItems} gain={gainItems} f={f} />
            {calcOn && (
              <g
                transform={(() => {
                  const R: [number, number] = [PX + ARM * Math.cos((tilt * Math.PI) / 180), PY - ARM * Math.sin((tilt * Math.PI) / 180) + CHAIN - 110];
                  const [x, y] = calcT < 1 ? arc(calcT, [SX + 120, 900], R, 220) : R;
                  const [sx, sy] = squash(f, CALC, 0.22);
                  return `translate(${x - 40} ${y}) rotate(${(1 - calcT) * -200}) scale(${sx * 0.8} ${sy * 0.8})`;
                })()}
              >
                <Calculator />
              </g>
            )}
            {f >= CALC && f < CALC + 14 && <Burst x={PX + ARM} y={PY + CHAIN} at={CALC} f={f} size={200} color={GAINC} />}
            {f >= T.twice && f < T.twice + 14 && <Burst x={PX - ARM} y={PY + 90 + CHAIN} at={T.twice} f={f} size={200} color={LOSSC} />}
            {ticketOn && (
              <g transform={`translate(${tkx} ${tky}) scale(${ticketK}) rotate(${ticketFly * 120 + Math.sin(f / 5) * 4})`}>
                <Ticket />
              </g>
            )}
            <g transform={`translate(${PX + 200} 330) rotate(${wobble(f, T.wins, 6)})`}>
              <Stamp k={stampK} sq={stampSq} text="MATH ✓" col={GAINC} />
            </g>
            <Spark f={f} scale={SS} base={{ x: SX, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
              {(j) =>
                coinInHand ? (
                  <g transform={`translate(${j.rHand[0] + 6} ${j.rHand[1] - 30})`}>
                    <Coin s={0.6} spin={Math.sin(f / 6) * 0.4} />
                  </g>
                ) : f >= T.math - 8 && f < T.math - 5 ? (
                  <g transform={`translate(${j.rHand[0]} ${j.rHand[1] - 40}) scale(0.8)`}>
                    <Calculator />
                  </g>
                ) : null
              }
            </Spark>
            {endCoinOn && (
              <g transform={(() => {
                const [x, y] = arc(endCoinT, [SX + 120, 860], [560, -200], 120);
                return `translate(${x} ${y})`;
              })()}>
                <Coin s={0.8} spin={f * 0.8} />
              </g>
            )}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words): −₹500 > +₹500 */}
          {(f < T.c1 - 2 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 132, transform: `rotate(-3deg) scale(${1 + wobble(f, 0, 0.04, 6)})`, whiteSpace: "nowrap" }}>
              <span style={{ color: LOSSC, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>−₹500</span>
              <span style={{ color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", margin: "0 18px" }}>&gt;</span>
              <span style={{ color: GAINC, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>+₹500</span>
            </div>
          )}
          <Slam f={f} at={T.twice} out={T.c2 + 4} x={540} y={330} size={190} color={LOSSC} stroke={`12px ${INK}`} rotate={-5}>
            2×
          </Slam>
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: INK, whiteSpace: "nowrap", opacity: 0.88, background: "rgba(255,255,255,0.7)", padding: "2px 12px", borderRadius: 8 }}>
                Brown et al. 2024, J. Econ. Lit. (meta-analysis) · an average, varies by person
              </div>
              <div style={{ position: "absolute", left: 96, top: 1752, fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: "#fff", opacity: 0.85 }}>
                Education, not financial advice
              </div>
              <div style={{ position: "absolute", right: 96, top: 1750, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: game ? ORANGE : GOLD, letterSpacing: 2, opacity: 0.9 }}>DESIGNED TO GET YOU</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["Lose", "Win", "Not", "equal.", "loss", "twice.", "good", "bets.", "flip", "coin.", "Tails,", "lose", "Heads,", "much?", "double.", "thousand.", "even.", "wins,", "average.", "feel", "small", "math,", "flinch.", "price", "flip?"]}
          />
          <Transition f={f} at={GAME0} kind="slice" size={VERTICAL} colors={[LOSSC, ORANGE, GOLD]} />
        </>
      }
    />
  );
};
