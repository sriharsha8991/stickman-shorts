import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, runCycle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { arc, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V032 · "Can one cent change what you buy?" (~38 s, promise → build → reveal, Your brain did this, plan pillar B)
// ONE world, one sideways camera rig: an evening pen shop with aubergine walls. Place A: a giant price tag and a torch that lights
// the first number. Place B, further along the same shop: the pen test, two pens on stands, a hundred little people.
// One small coin bounces off both tags, both first numbers change, 26 little people run across the room: 44 → 18.
// Numbers: Manning & Sprott 2009, J Consumer Research; Thomas & Morwitz 2005 — see facts.md. Rupee tags are an illustration.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);

// palette: aubergine shop, cream panels, walnut floor, marigold accents (no teal except Spark)
const AUB = "#4a2a63";
const AUB2 = "#5b3779";
const AUB3 = "#3a1f4f";
const CREAM = "#f6e7c8";
const CREAM2 = "#e8d3a8";
const WALNUT = "#4d2f22";
const WALNUT2 = "#3d241a";
const YEL = "#ffd23f";
const GOLD = "#f0ac2a";
const BLUE = "#3a7fdb";
const GREY = "#b9b2ad";
const RED = "#e23b3b";
const COPPER = "#d9803f";
const COPPER2 = "#f2a86a";
const WHITE = "#ffffff";
const INK = COL.ink;

// --- timing ---------------------------------------------------------------------------------------------------------------
const STOP = W(0, 0);
const ONE_N = W(0, 6);
const PROM = C(1);
const LAST = W(1, 3);
const COIN = W(1, 7);
const CROWDW = W(1, 10);
const BRAIN = C(2);
const FIRST = W(2, 6);
const SO = C(3);
const CHEAPER = W(3, 5);
const TWO = W(3, 7);
const GO0 = W(4, 1) - 6; // he runs after "Scientists tested"
const GO1 = GO0 + 30;
const CHEAP = W(4, 5);
const COSTLY = W(4, 9);
const FORTY = C(5);
const CHOSE = W(5, 5);
const THEN = C(6);
const FLICK = W(6, 2);
const HIT1 = W(6, 3);
const HIT2 = W(6, 5);
const CENT = W(6, 7);
const FLOOR = HIT2 + 23;
const REST = FLOOR + 12;
const DROP = E(6) + 2;
const NOW = C(7);
const RUN = W(7, 1);
const EIGHT = W(7, 2);
const DID = E(7) + 8; // ONE CENT DID THIS
const READ = C(8);
const BACK0 = READ - 8;
const BACK1 = BACK0 + 28;
const WHOLE = W(8, 3);
const PICK = W(8, 7);
const Q = C(9);
const LOOP = VOICE_FRAMES - 10;

// --- camera rig: hold → move (ease in-out) → hold ----------------------------------------------------------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 590, 960, 1.04], // frame 0: tag + Spark
  [PROM - 8, PROM + 12, 330, 1020, 1.34], // CU promise, coin
  [E(1) + 2, BRAIN - 2, 560, 960, 1.0], // the tag
  [SO + 2, SO + 18, 540, 960, 1.0],
  [GO0, GO0 + 24, 1900, 960, 1.0], // along the shop to the test
  [DROP, NOW - 6, 1900, 940, 0.96], // a little further back: the whole room is ready
  [DID + 8, READ - 12, 1900, 945, 0.98], // barely moving while it sinks in
  [BACK0, BACK0 + 24, 560, 960, 1.0], // back to the tag
  [Q - 6, Q + 12, 590, 960, 1.04], // frame 0 again
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

// --- Spark's path ---------------------------------------------------------------------------------------------------------
const SX0 = 215;
const SXM = 545;
const SXB = 1900;
type PK = [number, number];
const PATH: PK[] = [
  [0, SX0],
  [SO, SX0],
  [SO + 22, SXM],
  [GO0, SXM],
  [GO1, SXB],
  [BACK0, SXB],
  [BACK1, SX0],
];
const xAt = (f: number) => {
  if (f <= PATH[0][0]) return PATH[0][1];
  for (let i = 1; i < PATH.length; i++) {
    const [a, ax] = PATH[i - 1];
    const [b, bx] = PATH[i];
    if (f <= b) return b <= a ? bx : ax + (bx - ax) * interpolate(f, [a, b], [0, 1], { ...clamp, easing: sio });
  }
  return PATH[PATH.length - 1][1];
};
const running = (t: number) => (t >= GO0 && t < GO1) || (t >= BACK0 && t < BACK1);
const walking = (t: number) => t >= SO && t < SO + 22;

// --- helpers --------------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end" }> = ({ x = 0, y, s, c = INK, children, a = "middle" }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={900} fontSize={s} fill={c}>
    {children}
  </text>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={5} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

// a hanging paper price tag; every character is drawn on its own so a single number can be lit
const FS = 190;
const adv = (c: string) => (c === "." ? 0.34 : c === "₹" || c === "$" ? 0.66 : 0.64) * FS;
const widthOf = (chars: string[]) => chars.reduce((a, c) => a + adv(c), 0);
const TAG_H = FS * 1.34 + 56;
const charCentre = (chars: string[], i: number) => {
  let x = -widthOf(chars) / 2;
  for (let k = 0; k < i; k++) x += adv(chars[k]);
  return x + adv(chars[i]) / 2;
};
const Tag: React.FC<{ x: number; y: number; s?: number; r?: number; chars: string[]; dim?: number[]; hi?: number[]; flip?: number; str?: number }> = ({ x, y, s = 1, r = 0, chars, dim = [], hi = [], flip = 1, str = 900 }) => {
  const w = widthOf(chars) + 70;
  return (
    <g transform={`translate(${x} ${y - 500}) rotate(${r}) translate(0 500) scale(${s})`}>
      <line x1={0} y1={-str / s} x2={0} y2={30} stroke={CREAM2} strokeWidth={5 / s} />
      <path d={`M ${-w / 2 + 26} 34 L ${w / 2 - 26} 34 Q ${w / 2} 34 ${w / 2} 60 L ${w / 2} ${TAG_H - 22} Q ${w / 2} ${TAG_H} ${w / 2 - 26} ${TAG_H} L ${-w / 2 + 26} ${TAG_H} Q ${-w / 2} ${TAG_H} ${-w / 2} ${TAG_H - 22} L ${-w / 2} 60 Q ${-w / 2} 34 ${-w / 2 + 26} 34 Z`} fill={WHITE} {...K} strokeWidth={8} />
      <circle cx={0} cy={18} r={22} fill={WHITE} {...K} strokeWidth={8} />
      <circle cx={0} cy={18} r={8} fill={AUB} />
      <g transform={`translate(0 ${TAG_H / 2 + 20}) scale(1 ${flip}) translate(0 ${-(TAG_H / 2 + 20)})`}>
        {chars.map((c, i) => {
          const cx = charCentre(chars, i);
          const h = hi[i] ?? 0;
          const d = dim[i] ?? 0;
          return (
            <g key={i}>
              {h > 0.01 && <rect x={cx - adv(c) * 0.5 * h} y={TAG_H / 2 + 20 - FS * 0.56 * h} width={adv(c) * h} height={FS * 1.0 * h} rx={16} fill={YEL} />}
              <g transform={`translate(${cx} ${TAG_H / 2 + 20}) scale(${1 + h * 0.12}) translate(${-cx} ${-(TAG_H / 2 + 20)})`}>
                <Txt x={cx} y={TAG_H / 2 + 20 + FS * 0.34} s={FS} c={interpolateColors(d, [0, 1], [INK, "#d9d3cd"])}>
                  {c}
                </Txt>
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
};

const Coin: React.FC<{ r?: number; spin?: number }> = ({ r = 46, spin = 1 }) => (
  <g transform={`scale(${spin} 1)`}>
    <circle r={r} fill={COPPER} {...K} strokeWidth={6} />
    <circle r={r * 0.74} fill={COPPER2} stroke={COPPER} strokeWidth={5} />
    <Txt y={r * 0.36} s={r * 1.05}>
      1
    </Txt>
  </g>
);

const Pen: React.FC<{ costly?: boolean }> = ({ costly }) =>
  costly ? (
    <g>
      <rect x={-140} y={-24} width={230} height={48} rx={22} fill="#20182b" {...K} />
      <rect x={-30} y={-24} width={18} height={48} fill={GOLD} {...K} strokeWidth={4} />
      <rect x={-140} y={-10} width={120} height={7} fill={GOLD} />
      <path d="M 90 -22 L 158 -6 L 182 0 L 158 6 L 90 22 Z" fill={GOLD} {...K} />
      <line x1={110} y1={0} x2={178} y2={0} stroke={INK} strokeWidth={4} />
    </g>
  ) : (
    <g>
      <rect x={-130} y={-15} width={240} height={30} rx={8} fill={BLUE} {...K} />
      <rect x={-130} y={-15} width={70} height={30} rx={8} fill="#1f4f99" {...K} />
      <path d="M 110 -14 L 158 0 L 110 14 Z" fill={WHITE} {...K} />
    </g>
  );

// the world: one long shop --------------------------------------------------------------------------------------------------
const World: React.FC = () => (
  <g>
    <rect x={-800} y={-800} width={3800} height={2000} fill={AUB} />
    {/* wall shelves with notebooks + pen cups, low contrast */}
    {[150, 1150, 2430].map((x, k) => (
      <g key={k}>
        {[330, 500, 670].map((y, r) => (
          <g key={r}>
            <rect x={x - 240} y={y} width={480} height={14} fill={AUB3} />
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={x - 225 + i * 50} y={y - 44 - ((i * 7 + r * 5 + k * 3) % 4) * 11} width={36} height={44 + ((i * 7 + r * 5 + k * 3) % 4) * 11} rx={4} fill={i % 3 === 0 ? AUB3 : AUB2} />
            ))}
          </g>
        ))}
      </g>
    ))}
    {/* cream panel below: the people and Spark stand against it */}
    <rect x={-800} y={880} width={3800} height={420} fill={CREAM} />
    <rect x={-800} y={872} width={3800} height={16} fill={CREAM2} {...K} strokeWidth={4} />
    {Array.from({ length: 22 }, (_, i) => (
      <line key={i} x1={-700 + i * 180} y1={905} x2={-700 + i * 180} y2={1290} stroke={CREAM2} strokeWidth={5} />
    ))}
    {/* floor */}
    <rect x={-800} y={GROUND} width={3800} height={900} fill={WALNUT} />
    <rect x={-800} y={GROUND} width={3800} height={12} fill={INK} />
    {Array.from({ length: 16 }, (_, i) => (
      <line key={i} x1={-800 + i * 260} y1={GROUND + 12} x2={-1000 + i * 260} y2={2200} stroke={WALNUT2} strokeWidth={8} />
    ))}
    {/* pillar + arch between the shop front and the back room */}
    <rect x={1140} y={-800} width={120} height={2090} fill={AUB3} {...K} />
    <rect x={1120} y={850} width={160} height={440} fill={WALNUT} {...K} />
    {/* the shop counter */}
    <g transform={`translate(910 ${GROUND})`}>
      <rect x={-170} y={-225} width={340} height={225} fill={WALNUT} {...K} />
      <rect x={-188} y={-245} width={376} height={26} rx={8} fill={GOLD} {...K} />
      <Txt y={-110} s={62} c={CREAM}>
        PEN
      </Txt>
      <Txt y={-46} s={62} c={CREAM}>
        SHOP
      </Txt>
      <g transform="translate(90 -245)">
        <rect x={-30} y={-72} width={60} height={72} rx={6} fill={BLUE} {...K} />
        <line x1={-14} y1={-72} x2={-22} y2={-126} stroke={RED} strokeWidth={10} strokeLinecap="round" />
        <line x1={6} y1={-72} x2={14} y2={-136} stroke={YEL} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  </g>
);

// a stand with a pen + its label
const Stand: React.FC<{ x: number; k: number; costly?: boolean; f: number; at: number; count?: number; countK?: number; hit?: number }> = ({ x, k, costly, f, at, count = 0, countK = 0, hit = 0 }) => (
  <g transform={`translate(${x} 990) scale(${k}) translate(${-x} -990)`}>
    <g transform={`translate(${x} 738) rotate(${-8 + wobble(f, at + 3, 7)})`}>
      <Pen costly={costly} />
    </g>
    <rect x={x - 150} y={785} width={300} height={205} rx={12} fill={costly ? "#2b2038" : WHITE} {...K} />
    <Txt x={x} y={840} s={44} c={costly ? GOLD : BLUE}>
      {costly ? "COSTLY PEN" : "CHEAP PEN"}
    </Txt>
    {costly && countK > 0.01 && (
      <g transform={`translate(${x} 915) scale(${countK * (1 + hit * 0.16)})`}>
        <rect x={-124} y={-58} width={248} height={118} rx={16} fill={YEL} {...K} />
        <Txt x={-44} y={30} s={92}>
          {count}
        </Txt>
        <Txt x={58} y={-2} s={38}>
          OF
        </Txt>
        <Txt x={58} y={40} s={38}>
          100
        </Txt>
      </g>
    )}
  </g>
);

// --- the hundred little people --------------------------------------------------------------------------------------------
const hash = (i: number, m: number) => ((i * 2654435761) >>> 0) % m;
// where they first stand together: 20 × 5
const GATHER = Array.from({ length: 100 }, (_, i) => ({ x: 1580 + (i % 20) * 34 + ((Math.floor(i / 20) % 2) * 17), y: 1140 + Math.floor(i / 20) * 34 }));
const shuffled = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a + 3, 1009) - hash(b + 3, 1009));
// left crowd slots (nearest the cheap pen first), right crowd slots
const LEFT = (() => {
  const s: [number, number][] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) s.push([1400 + c * 34 + (r % 2) * 14, 1050 + r * 37]);
  return s.sort((a, b) => Math.hypot(a[0] - 1600, (a[1] - 1190) * 1.2) - Math.hypot(b[0] - 1600, (b[1] - 1190) * 1.2));
})();
const RIGHT = (() => {
  const s: [number, number][] = [];
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) s.push([2060 + c * 36 + (r % 2) * 14, 1050 + r * 37]);
  // the ones nearest the front + centre stay
  return s.sort((a, b) => Math.hypot(a[0] - 2180, (a[1] - 1272) * 1.1) - Math.hypot(b[0] - 2180, (b[1] - 1272) * 1.1)).slice(0, 44);
})();
type Mini = { id: number; home: [number, number]; to?: [number, number]; goes: number; side: 0 | 1 };
const MINIS: Mini[] = (() => {
  const out: Mini[] = [];
  let l = 0;
  let r = 0;
  shuffled.forEach((id, k) => {
    if (k < 56) out.push({ id, home: LEFT[l++], goes: 0, side: 0 });
    else out.push({ id, home: RIGHT[r++], goes: 0, side: 1 });
  });
  // the 26 farthest on the right run across; they fill the next free slots on the left, nearest first
  const rightOnes = out.filter((m) => m.side === 1).sort((a, b) => RIGHT.indexOf(b.home) - RIGHT.indexOf(a.home));
  rightOnes.slice(0, 26).forEach((m, k) => {
    m.to = LEFT[56 + k];
    m.goes = k;
  });
  return out;
})();

const MiniP: React.FC<{ x: number; y: number; c: string; phase: number; moving: number; lean: number; arms: number; k: number }> = ({ x, y, c, phase, moving, lean, arms, k }) => {
  const sw = Math.sin(phase) * 16 * moving;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <g transform={`rotate(${lean})`}>
        <line x1={0} y1={-30} x2={-7 - sw} y2={0} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={-30} x2={7 + sw} y2={0} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={-30} x2={0} y2={-58} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        <line x1={0} y1={-52} x2={-14} y2={-40 - arms * 22} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={-52} x2={14} y2={-40 - arms * 22} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <circle cx={0} cy={-70} r={15} fill={c} stroke={INK} strokeWidth={5} />
      </g>
    </g>
  );
};

// --- the scene ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [STOP, "thud", 0.7],
  [ONE_N, "ding", 0.5],
  [LAST, "pop", 0.45],
  [COIN, "clink", 0.7],
  [CROWDW, "clink", 0.5],
  [BRAIN + 2, "pop", 0.35],
  [FIRST, "ding", 0.55],
  [SO + 2, "whoosh", 0.25],
  [CHEAPER, "pop", 0.4],
  [TWO - 6, "swish", 0.5],
  [TWO + 6, "thud", 0.45],
  [TWO + 18, "clink", 0.45],
  [GO0, "whoosh_long", 0.4],
  [GO0 + 24, "pop", 0.3],
  [CHEAP - 2, "pop", 0.5],
  [COSTLY - 2, "pop", 0.6],
  [FORTY + 2, "swish", 0.3],
  [CHOSE, "whoosh", 0.3],
  [W(5, 7), "ding", 0.5],
  [FLICK, "swish", 0.45],
  [HIT1, "clink", 0.9],
  [HIT2, "clink", 0.9],
  [FLOOR, "clink", 0.55],
  [REST, "clink", 0.3],
  [DROP + 4, "freeze", 0.2],
  [RUN, "whoosh_long", 0.5],
  [EIGHT, "impact", 0.9],
  [EIGHT + 2, "crash", 0.3],
  [DID, "ding", 0.5],
  [BACK0, "whoosh_long", 0.35],
  [WHOLE, "tick", 0.5],
  [WHOLE + 8, "tick", 0.5],
  [WHOLE + 16, "tick", 0.5],
  [PICK, "ding", 0.5],
  [W(9, 1), "pop", 0.45],
];

export const S01Shop: React.FC<SceneProps> = ({ from }) => {
  const f = useCurrentFrame() + from;
  const cam = camAtRig(f);
  const loopBack = f >= LOOP - 6;

  // lights: a drop before the reveal
  const dim = interpolate(f, [DROP, DROP + 9, NOW - 2, NOW + 3], [0, 0.56, 0.56, 0], { ...clamp, easing: sio });
  const rays = interpolate(f, [NOW, NOW + 12, READ - 18, READ - 6], [0, 1, 1, 0], clamp);

  // --- Spark's acting -------------------------------------------------------------------------------------------------
  const torchUp = { ra1: 128, ra2: 4, la1: -18, la2: 10, head: -8 };
  const sparkKeys = gestureKeys([
    [0, G.stop],
    [W(0, 2), { ...G.stop, lean: -3, head: 6 }, "smooth"],
    [ONE_N - 3, { ...G.pointUp, ra1: 128 }, "snap"],
    [PROM - 2, G.stop, "snap"],
    [LAST, { ...G.pointUp, ra1: 145 }, "smooth"],
    [W(1, 5), { ...G.fistPump, ra1: 118, ra2: 62 }, "smooth"],
    [COIN + 2, { ra1: 150, ra2: 10, la1: -22, la2: 10, head: -14 }, "snap"],
    [CROWDW + 2, { ra1: 118, ra2: 62, la1: -20, la2: 10, head: -2 }, "smooth"],
    [BRAIN - 12, torchUp, "smooth"],
    [W(2, 3), { ...torchUp, head: -14, lean: 5 }, "smooth"],
    [SO, { ra1: 118, ra2: 8, la1: -22, la2: 16, head: -8 }, "smooth"],
    [TWO, { ra1: 120, ra2: 6, la1: -30, la2: 20, head: -10, lean: 3 }, "smooth"],
    [GO0 - 2, G.rest, "snap"],
    [GO1 + 2, G.present, "smooth"],
    [CHEAP - 3, G.pointSide, "snap"],
    [COSTLY - 3, G.pointSide, "snap"],
    [FORTY - 6, G.presentBoth, "smooth"],
    [W(5, 3), G.thinkChin, "smooth"],
    [CHOSE, G.doublePoint, "snap"],
    [THEN - 6, { ra1: 95, ra2: 70, la1: -24, la2: 8, head: 4 }, "smooth"],
    [FLICK - 5, { ra1: 40, ra2: 110, la1: -26, la2: 8, lean: 7, head: 8 }, "smooth"], // wind-up
    [FLICK, { ra1: 155, ra2: 8, la1: -30, la2: 16, lean: -8, head: -18 }, "snap"],
    [HIT1 + 4, { ra1: 135, ra2: 8, la1: -30, la2: 16, lean: -4, head: -12 }, "smooth"],
    [DROP + 2, { ...G.leanIn, head: -10 }, "smooth"],
    [NOW - 2, G.recoil, "snap"],
    [EIGHT, G.mindBlown, "snap"],
    [DID - 2, G.mindBlown, "smooth"],
    [DID + 18, G.pointDown, "smooth"],
    [BACK0 - 2, G.rest, "snap"],
    [BACK1 - 2, torchUp, "snap"],
    [PICK, { ...G.fistPump, la1: -40 }, "snap"],
    [Q - 2, G.present, "smooth"],
    [W(9, 2), G.count1, "snap"],
    [W(9, 5), { ...G.count1, head: 8 }, "smooth"],
    [LOOP - 10, G.stop, "smooth"],
  ]);
  const mood = (t: number): Mood => {
    if (t < W(0, 3)) return "shock";
    if (t < PROM - 2) return "curious";
    if (t < W(1, 5)) return "wink";
    if (t < E(1)) return "excited";
    if (t < W(2, 3)) return "curious";
    if (t < SO) return "thinking";
    if (t < TWO) return "smug";
    if (t < GO0) return "skeptical";
    if (t < FORTY) return "happy";
    if (t < CHOSE) return "thinking";
    if (t < THEN - 6) return "smug";
    if (t < DROP) return "determined";
    if (t < NOW - 2) return "worried";
    if (t < EIGHT) return "shock";
    if (t < READ - 10) return "mindblown";
    if (t < WHOLE) return "thinking";
    if (t < Q) return "happy";
    if (t < W(9, 5)) return "curious";
    if (t < LOOP - 10) return "wink";
    return "shock";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, EIGHT, 80), bulbPulse(t, FIRST, 22), bulbPulse(t, PICK, 22));
  const scaleAt = (t: number) => {
    const big = interpolate(t, [NOW - 2, EIGHT], [1.9, 2.3], { ...clamp, easing: eio });
    const back = interpolate(t, [READ - 16, READ - 6], [0, 1], { ...clamp, easing: eio });
    return big + (1.9 - big) * back;
  };
  const sNow = scaleAt(f);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (running(t)) q = addPose(q, runCycle(t - GO0, 0.62, 0.9));
    if (walking(t)) q = addPose(q, walkCycle(t, 0.42));
    q = addPose(q, hop(t, EIGHT, 30));
    q = addPose(q, hop(t, FLICK, 10));
    q = addPose(q, nod(t, W(1, 4), 2));
    q = addPose(q, nod(t, PICK, 2));
    q = addPose(q, shake(t, W(3, 4), 1));
    const s = scaleAt(t);
    return { ...q, x: xAt(t), y: GROUND - 92.5 * s + q.y - p.y };
  };
  const facing = (t: number) => {
    if (t >= GO0 && t < GO1) return 1;
    if (t >= BACK0 && t < BACK1) return -1;
    if (t >= CHEAP - 3 && t < COSTLY - 3) return -1;
    if (t >= NOW + 8 && t < DID - 2) return -1; // he watches the crowd arrive
    if (t >= SO + 22 && t < TWO - 4) return -1; // the left tag
    return 1;
  };

  // --- the tag at place A -----------------------------------------------------------------------------------------------
  const T1 = ["₹", "1", "9", "9"];
  const T2 = ["₹", "2", "0", "0"];
  const placeK = interpolate(f, [SO, SO + 20], [0, 1], { ...clamp, easing: eio }) * interpolate(f, [GO1, GO1 + 1], [1, 0], clamp); // tag 1 moves aside; home again once off camera
  const t1x = 650 + (300 - 650) * placeK;
  const t1y = 545 + (590 - 545) * placeK;
  const t1s = 1.05 + (0.72 - 1.05) * placeK;
  const t1r = wobble(f, SO + 20, 2.5) + Math.sin(f * 0.05) * 0.5 + wobble(f, STOP, 1.8);
  const t2k = interpolate(f, [TWO - 8, TWO + 6], [0, 1], { ...clamp, easing: eo }) * interpolate(f, [GO1, GO1 + 1], [1, 0], clamp);
  const t2x = 790;
  const t2y = interpolate(t2k, [0, 1], [-420, 590]);
  const t2r = -wobble(f, TWO + 6, 4);

  // first number lit, the rest dim. Frame 0 + loop already show it (the promise of the picture)
  const dimRest = Math.max(interpolate(f, [0, 1, PROM + 10, PROM + 24], [1, 1, 0, 0], clamp), interpolate(f, [FIRST - 6, FIRST + 4, GO0, GO0 + 2], [0, 1, 1, 0], clamp), interpolate(f, [LOOP - 10, LOOP - 2], [0, 1], clamp));
  const hiFirst = Math.max(interpolate(f, [0, 1, PROM + 10, PROM + 24], [1, 1, 0, 0], clamp), interpolate(f, [FIRST - 4, FIRST + 4, GO0, GO0 + 2], [0, 1, 1, 0], clamp), interpolate(f, [LOOP - 10, LOOP - 2], [0, 1], clamp));
  // the whole price, one number at a time
  const readK = (i: number) => interpolate(f, [WHOLE - 6 + i * 8, WHOLE + i * 8, Q + 16, Q + 30], [0, 1, 1, 0], clamp);
  const t1hi = [0, hiFirst + readK(0) * (1 - hiFirst), Math.max(readK(1)), Math.max(readK(2))];
  const t1dim = [dimRest, 0, dimRest, dimRest];
  const dim2 = interpolate(f, [TWO + 6, TWO + 14], [0, 1], clamp);

  // torch beam: from his hand to one number
  const torchOn = interpolate(f, [BRAIN - 4, BRAIN + 3, GO0 - 4, GO0], [0, 1, 1, 0], clamp) + interpolate(f, [BACK1 - 2, BACK1 + 4, PICK + 8, PICK + 16], [0, 1, 1, 0], clamp);
  const tHoleY = t1y + 500 - 500; // tag hole
  const num1 = [t1x + charCentre(T1, 1) * t1s, tHoleY + (TAG_H / 2 + 20) * t1s] as const;
  const num2 = [t2x + charCentre(T2, 1) * 0.72, 590 + (TAG_H / 2 + 20) * 0.72] as const;
  const toTwo = interpolate(f, [TWO + 4, TWO + 14], [0, 1], { ...clamp, easing: eio }) * interpolate(f, [GO0 - 8, GO0 - 4], [1, 0], clamp);
  const lastX = interpolate(f, [WHOLE - 6, WHOLE + 16, WHOLE + 24], [num1[0], 650 + charCentre(T1, 3) * 1.05, 650 + charCentre(T1, 3) * 1.05], clamp);
  const beamX = f >= BACK0 ? lastX : num1[0] + (num2[0] - num1[0]) * toTwo;
  const beamY = f >= BACK0 ? 545 + (TAG_H / 2 + 20) * 1.05 : num1[1] + (num2[1] - num1[1]) * toTwo;

  const firstK = popIn(f, FIRST + 2) * interpolate(f, [SO - 8, SO], [1, 0], { ...clamp, easing: ei });
  const cheapK = popIn(f, CHEAPER) * interpolate(f, [GO0 - 8, GO0 - 2], [1, 0], { ...clamp, easing: ei });
  const gapCoin = popIn(f, TWO + 18) * interpolate(f, [GO0 - 6, GO0 - 1], [1, 0], { ...clamp, easing: ei });

  // promise bubbles + the coin in his hand
  const lastK = popIn(f, LAST) * interpolate(f, [COIN - 6, COIN], [1, 0], { ...clamp, easing: ei });
  const coinUp = interpolate(f, [COIN, COIN + 12, COIN + 28], [0, 1, 0], { ...clamp });
  const coinBubble = popIn(f, COIN + 2) * interpolate(f, [E(1) - 2, E(1) + 8], [1, 0], { ...clamp, easing: ei });

  // --- place B ----------------------------------------------------------------------------------------------------------
  const k1 = popIn(f, CHEAP);
  const k2 = popIn(f, COSTLY);
  const onB = f >= GO0 && f < BACK0 + 26;
  const flipAt = (hit: number) => interpolate(f, [hit - 2, hit + 3, hit + 8], [1, 0, 1], clamp);
  const tA = f < HIT1 + 3 ? ["$", "2", ".", "0", "0"] : ["$", "1", ".", "9", "9"];
  const tB = f < HIT2 + 3 ? ["$", "3", ".", "9", "9"] : ["$", "4", ".", "0", "0"];
  const hiA = interpolate(f, [HIT1 + 4, HIT1 + 11], [0, 1], { ...clamp, easing: eo });
  const hiB = interpolate(f, [HIT2 + 4, HIT2 + 11], [0, 1], { ...clamp, easing: eo });
  const swingA = wobble(f, HIT1, 7, 12);
  const swingB = wobble(f, HIT2, 7, 12);

  // the coin's bounce path
  const coinPos = (() => {
    if (f < FLICK) return null;
    const p0: [number, number] = [SXB + 62, 1010];
    const p1: [number, number] = [1640, 610];
    const p2: [number, number] = [2160, 610];
    const p3: [number, number] = [2006, 1258];
    const p4: [number, number] = [2036, 1258];
    if (f < HIT1) return arc((f - FLICK) / (HIT1 - FLICK), p0, p1, 170);
    if (f < HIT2) return arc((f - HIT1) / (HIT2 - HIT1), p1, p2, 120);
    if (f < FLOOR) return arc(interpolate(f, [HIT2, FLOOR], [0, 1], { easing: ei }), p2, p3, 30);
    if (f < REST) return arc((f - FLOOR) / (REST - FLOOR), p3, p4, 46);
    return p4;
  })();
  const coinSpin = f < REST ? Math.cos(f * 0.9) : 1;
  const coinPulse = 1 + wobble(f, DID, 0.14, 7);
  const coinOut = interpolate(f, [BACK0 - 2, BACK0], [1, 0], clamp);

  // the scientist
  const sciX = interpolate(f, [GO0 + 22, GO0 + 42, FORTY - 8, FORTY + 8], [2600, 2235, 2235, 2600], { ...clamp, easing: sio });

  // the count on the costly stand
  const countK = popIn(f, W(5, 7));
  const count = Math.round(interpolate(f, [RUN, EIGHT + 22], [44, 18], { ...clamp, easing: eio }));
  const countHit = interpolate(f, [EIGHT + 18, EIGHT + 24, EIGHT + 40], [0, 1, 0], clamp);

  // the people
  const people = onB
    ? MINIS.map((m) => {
        const at = FORTY + hash(m.id + 11, 44); // pop in together
        if (f < at - 3) return null;
        const pop = popIn(f, at);
        const s0 = W(5, 5) + (hash(m.id + 5, 14)); // walk to their pen
        const go = interpolate(f, [s0, s0 + 24], [0, 1], { ...clamp, easing: sio });
        const g = GATHER[m.id];
        let x = g.x + (m.home[0] - g.x) * go;
        let y = g.y + (m.home[1] - g.y) * go;
        let moving = go > 0 && go < 1 ? 1 : 0;
        let c = interpolateColors(go, [0.55, 1], [GREY, m.side ? GOLD : BLUE]);
        let lean = 0;
        let arms = 0;
        let hopY = 0;
        const shiver = f >= DROP + 6 && f < RUN && m.to ? Math.sin(f * 1.6 + m.id) * 1.4 : 0;
        if (m.to) {
          const r0 = RUN + m.goes * 1.25;
          const dur = 26;
          const rk = interpolate(f, [r0, r0 + dur], [0, 1], { ...clamp, easing: sio });
          if (f >= r0 - 4 && f < r0) lean = 8; // wind-up, leaning back
          if (rk > 0 && rk < 1) {
            moving = 1;
            lean = -14;
            arms = 1;
            hopY = Math.abs(Math.sin(rk * Math.PI * 4)) * 26;
          }
          x += (m.to[0] - m.home[0]) * rk;
          y += (m.to[1] - m.home[1]) * rk;
          c = rk > 0.75 ? interpolateColors(rk, [0.75, 1], [GOLD, BLUE]) : c;
          // a small squash as they land
          if (rk >= 1) arms = interpolate(f, [r0 + dur, r0 + dur + 8], [1, 0], clamp);
        }
        return { id: m.id, x: x + shiver, y: y - hopY, ground: y, c, phase: f * 0.9 + m.id, moving, lean, arms, k: pop };
      }).filter((p): p is NonNullable<typeof p> => !!p).sort((a, b) => a.ground - b.ground)
    : [];
  // arrival + the kick-up dust for the runners
  const dust = onB && f >= RUN
    ? MINIS.filter((m) => m.to).map((m) => {
        const r0 = RUN + m.goes * 1.25;
        const a = interpolate(f, [r0, r0 + 10, r0 + 22], [0, 1, 0], clamp);
        return { x: m.home[0], y: m.home[1], a };
      })
    : [];

  const q1 = popIn(f, W(8, 3)) * interpolate(f, [Q - 8, Q], [1, 0], { ...clamp, easing: ei });
  const q2 = popIn(f, W(9, 1)) * interpolate(f, [LOOP - 12, LOOP - 2], [1, 0], { ...clamp, easing: ei });

  const svg = (
    <>
      <defs>
        <clipPath id="wallOnly">
          <rect x={-800} y={-800} width={3800} height={1672} />
        </clipPath>
      </defs>
      <World />
      {/* flat sun rays on the wall behind the test */}
      {rays > 0.01 && (
        <g clipPath="url(#wallOnly)">
        <g transform={`translate(1900 690) rotate(${(f - NOW) * 0.1}) scale(${0.6 + rays * 0.6})`} opacity={rays * 0.9}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i * Math.PI * 2) / 14;
            const b = a + Math.PI / 14;
            return <path key={i} d={`M 0 0 L ${Math.cos(a) * 1500} ${Math.sin(a) * 1500} L ${Math.cos(b) * 1500} ${Math.sin(b) * 1500} Z`} fill={AUB2} />;
          })}
        </g>
        </g>
      )}
      {dim > 0.01 && <rect x={-800} y={-800} width={3800} height={3000} fill="#120a1c" opacity={dim} />}

      {/* the test room */}
      {onB && (
        <>
          <Stand x={1640} k={k1} f={f} at={CHEAP} />
          <Stand x={2160} k={k2} f={f} at={COSTLY} costly count={count} countK={countK} hit={countHit} />
          {k1 > 0.01 && <Tag x={1640} y={500} s={0.62 * k1} r={swingA} chars={tA} hi={[0, hiA]} dim={[0, 0, hiA, hiA, hiA]} flip={flipAt(HIT1)} />}
          {k2 > 0.01 && <Tag x={2160} y={500} s={0.62 * k2} r={swingB} chars={tB} hi={[0, hiB]} dim={[0, 0, hiB, hiB, hiB]} flip={flipAt(HIT2)} />}
          {sciX < 2480 && (
            <g>
              <Actor f={f} color={COL.orange} scale={1.7} base={{ x: sciX, y: GROUND - 92.5 * 1.7 }} keys={[{ f: 0, p: { ra1: 70, ra2: 60, la1: -20, la2: 10 } }]} mod={(t, p) => addPose(addPose(p, idle(t, 9)), (t >= GO0 + 22 && t < GO0 + 42) || t >= FORTY - 8 ? walkCycle(t, 0.42) : {})} facing={-1} face="happy" trails={false}>
                {(j) => (
                  <>
                    <path d={`M ${j.neck[0] - 26} ${j.neck[1] + 2} L ${j.neck[0] + 26} ${j.neck[1] + 2} L ${j.hip[0] + 48} ${j.hip[1] + 34} L ${j.hip[0] - 48} ${j.hip[1] + 34} Z`} fill={WHITE} {...K} strokeWidth={6} />
                    <g transform={`translate(${j.rHand[0] - 12} ${j.rHand[1] - 26})`}>
                      <rect x={-32} y={-42} width={64} height={84} rx={6} fill="#c79256" {...K} strokeWidth={5} />
                      <rect x={-24} y={-28} width={48} height={62} fill={WHITE} {...K} strokeWidth={3} />
                    </g>
                  </>
                )}
              </Actor>
              <g transform={`translate(${sciX} ${GROUND + 52})`}>
                <rect x={-104} y={-30} width={208} height={60} rx={30} fill={WHITE} {...K} strokeWidth={5} />
                <Txt y={14} s={36} c={COL.orange}>
                  SCIENTIST
                </Txt>
              </g>
            </g>
          )}
          {dust.map((d, i) =>
            d.a > 0.01 ? <circle key={i} cx={d.x} cy={d.y - 8} r={12 + d.a * 16} fill={WHITE} opacity={d.a * 0.7} /> : null,
          )}
          {people.map((p) => (
            <MiniP key={p.id} x={p.x} y={p.y} c={p.c} phase={p.phase} moving={p.moving} lean={p.lean} arms={p.arms} k={p.k} />
          ))}
        </>
      )}

      {/* place A: the tags */}
      {f < GO1 + 2 || f >= BACK0 ? (
        <>
          <Tag x={t1x} y={t1y} s={t1s} r={t1r} chars={T1} dim={t1dim} hi={t1hi} />
          {t2k > 0.01 && <Tag x={t2x} y={t2y} s={0.72} r={t2r} chars={T2} dim={[0, 0, dim2, dim2]} hi={[0, dim2]} />}
          {gapCoin > 0.01 && (
            <g transform={`translate(${(t1x + t2x) / 2 + 0} 700) scale(${gapCoin})`}>
              <Coin r={36} />
            </g>
          )}
        </>
      ) : null}
      {firstK > 0.01 && (
        <g transform={`translate(830 930) scale(${firstK}) rotate(${wobble(f, FIRST + 2, 4)})`}>
          <Bubble w={420} h={104} fill={YEL} tail={-130}>
            <Txt y={22} s={58}>
              FIRST NUMBER
            </Txt>
          </Bubble>
        </g>
      )}
      {cheapK > 0.01 && (
        <g transform={`translate(300 876) scale(${cheapK}) rotate(${wobble(f, CHEAPER, 3)})`}>
          <rect x={-180} y={-40} width={360} height={82} rx={20} fill={YEL} {...K} strokeWidth={5} />
          <Txt y={18} s={50}>
            MUCH CHEAPER?
          </Txt>
        </g>
      )}
      {lastK > 0.01 && (
        <g transform={`translate(${SX0 + 275} 806) scale(${lastK}) rotate(${wobble(f, LAST, 4)})`}>
          <Bubble w={430} h={116} fill={YEL} tail={-130}>
            <Txt y={22} s={58}>
              THE LAST PART
            </Txt>
          </Bubble>
        </g>
      )}
      {coinBubble > 0.01 && (
        <g transform={`translate(${SX0 + 275} 806) scale(${coinBubble}) rotate(${wobble(f, COIN + 2, 4)})`}>
          <Bubble w={430} h={116} tail={-130}>
            <Txt y={22} s={56}>
              ONE SMALL COIN
            </Txt>
          </Bubble>
        </g>
      )}

      {/* the coin in the air */}
      {coinPos && coinOut > 0 && (
        <g transform={`translate(${coinPos[0]} ${coinPos[1]}) scale(${(f >= FLOOR ? squash(f, FLOOR, 0.3)[0] : 1) * coinPulse})`}>
          <Coin r={40} spin={Math.max(0.2, Math.abs(coinSpin))} />
        </g>
      )}
      {/* impact rays when the coin hits a tag */}
      {[HIT1, HIT2].map((h, i) => {
        const t = interpolate(f, [h, h + 12], [0, 1], { ...clamp, easing: eo });
        if (f < h || f > h + 14) return null;
        return (
          <g key={i} transform={`translate(${i ? 2160 : 1640} 610)`}>
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k * Math.PI) / 4;
              return <line key={k} x1={Math.cos(a) * (40 + 30 * t)} y1={Math.sin(a) * (40 + 30 * t)} x2={Math.cos(a) * (60 + 80 * t)} y2={Math.sin(a) * (60 + 80 * t)} stroke={YEL} strokeWidth={10} strokeLinecap="round" opacity={1 - t} />;
            })}
          </g>
        );
      })}

      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (loopBack ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={facing}>
        {(j) => (
          <>
            {torchOn > 0.01 && (
              <g opacity={Math.min(1, torchOn)}>
                <polygon points={`${j.rHand[0]},${j.rHand[1]} ${beamX - 62},${beamY} ${beamX + 62},${beamY}`} fill={YEL} opacity={0.42} />
                <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(${(Math.atan2(beamY - j.rHand[1], beamX - j.rHand[0]) * 180) / Math.PI})`}>
                  <rect x={-34} y={-11} width={62} height={22} rx={4} fill={RED} {...K} strokeWidth={4} />
                  <path d="M 26 -13 L 44 -20 L 44 20 L 26 13 Z" fill={YEL} {...K} strokeWidth={4} />
                </g>
              </g>
            )}
            {/* the coin in his hand before he flicks it */}
            {((f >= COIN - 12 && f < E(1) + 6) || (f >= THEN - 2 && f < FLICK)) && (
              <g transform={`translate(${j.rHand[0] + 6} ${j.rHand[1] - 34 - coinUp * (f < E(1) + 6 ? 210 : 0)}) scale(${f < E(1) + 6 ? 1.15 : 1})`}>
                <Coin r={40} spin={f >= COIN && f < COIN + 28 ? Math.max(0.2, Math.abs(Math.cos(f * 0.8))) : 1} />
              </g>
            )}
          </>
        )}
      </Spark>
      {q1 > 0.01 && (
        <g transform={`translate(700 990) scale(${q1}) rotate(${wobble(f, W(8, 3), 4)})`}>
          <Bubble w={560} h={106} fill={YEL} tail={-180}>
            <Txt y={22} s={50}>
              READ THE WHOLE PRICE
            </Txt>
          </Bubble>
        </g>
      )}
      {q2 > 0.01 && (
        <g transform={`translate(640 990) scale(${q2}) rotate(${wobble(f, W(9, 1), 4)})`}>
          <Bubble w={560} h={150} tail={-200}>
            <Txt y={-8} s={58}>
              WHICH PRICE
            </Txt>
            <Txt y={52} s={58}>
              FOOLED YOU?
            </Txt>
          </Bubble>
        </g>
      )}
    </>
  );

  // --- screen-space text ---------------------------------------------------------------------------------------------------
  const overlayOn = f < PROM - 4 || loopBack;
  const bigK = popIn(f, EIGHT);
  const bigOut = interpolate(f, [READ - 14, READ - 4], [1, 0], { ...clamp, easing: ei });
  const didK = popIn(f, DID);
  const centK = popIn(f, CENT) * interpolate(f, [DROP + 2, DROP + 10], [1, 0], { ...clamp, easing: ei });
  const html = (
    <>
      {overlayOn && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 258,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 122,
            color: YEL,
            WebkitTextStroke: `11px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [PROM - 14, PROM - 4], [1, 0], clamp),
          }}
        >
          ONE NUMBER
          <br />
          FOOLS YOU
        </div>
      )}
      {centK > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 340,
            transform: `translate(-50%,-50%) scale(${centK}) rotate(-2deg)`,
            fontFamily: FONT.title,
            fontWeight: 900,
            fontSize: 110,
            color: YEL,
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: "stroke fill",
            whiteSpace: "nowrap",
          }}
        >
          JUST ONE CENT
        </div>
      )}
      {f >= EIGHT - 3 && bigOut > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: 30,
            right: 30,
            top: 244,
            textAlign: "center",
            opacity: bigOut,
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            color: WHITE,
            WebkitTextStroke: `11px ${INK}`,
            paintOrder: "stroke fill",
          }}
        >
          <div style={{ fontSize: 158, color: YEL, transform: `scale(${bigK}) rotate(-2deg)` }}>ONLY 18</div>
          {didK > 0.01 && <div style={{ fontSize: 72, transform: `scale(${didK})` }}>ONE CENT DID THIS</div>}
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
              fontSize: 22,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            {f < GO1
              ? "Rupee tags are our own example (Thomas & Morwitz, 2005)"
              : f < NOW
                ? "Test prices were US dollars (Manning & Sprott, Journal of Consumer Research, 2009)"
                : f < BACK0
                  ? "One test with pens. It does not happen every time."
                  : "Rupee tags are our own example"}
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
            YOUR BRAIN DID THIS
          </div>
          <div
            style={{
              position: "absolute",
              left: 96,
              top: 1745,
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 22,
              color: "#fff",
              opacity: 0.92,
              background: "rgba(20,20,40,0.55)",
              padding: "4px 12px",
              borderRadius: 8,
            }}
          >
            Education, not financial advice
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1548}
        size={62}
        cues={VOICE_CUES}
        hi={["stop", "number", "number.", "last", "coin", "crowd.", "first", "cheaper", "hundred.", "scientists", "cheap", "costly", "forty-four", "cent.", "only", "eighteen", "whole", "price", "fooled"]}
      />
    </>
  );

  const hits = [STOP + 1, EIGHT, EIGHT + 2];
  return <Stage bg={<AbsoluteFill style={{ background: AUB }} />} cam={cam} hits={hits} power={6} svg={svg} html={html} />;
};
