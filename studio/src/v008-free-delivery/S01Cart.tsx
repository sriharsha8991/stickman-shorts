import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, P, SNAP, addPose, idle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, mouthAt } from "./voice";

// V008 · You paid ₹150 to save ₹40. Number Reveal in a bright, peach-coloured shop aisle under a
// giant delivery-app banner ("FREE DELIVERY ABOVE ₹199"). YOU (orange) pads a ₹49 cart with chips,
// a sauce and a candle to clear the bar. Spark names the zero-price effect, shows the receipt
// (truffle vs basic chocolate: 27% → 69% when the cheap one goes free), flips the FREE badge to
// reveal "COST YOU ₹150" (wow), then the fix: would I buy it anyway? If not, pay the ₹40.
// All rupee amounts are illustrative (labelled on screen).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const YS = 1.5;
const YGY = GROUND - 92.5 * YS;
const YX = 470;
const CORAL = "#ff6b4a";
const MINT = "#21b07a";
const PLUM = "#2a1838";

// --- background: shop aisle ------------------------------------------------------
const Aisle: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v8wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4ea" />
          <stop offset="100%" stopColor="#ffd8c4" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#v8wall)" />
      {/* ceiling lights */}
      {[180, 540, 900].map((x, i) => (
        <g key={x}>
          <rect x={x - 90} y={150} width={180} height={18} rx={9} fill="#fff" opacity={0.85 + 0.1 * Math.sin(f * 0.07 + i)} />
          <path d={`M ${x - 90} 168 L ${x - 170} 260 L ${x + 170} 260 L ${x + 90} 168 Z`} fill="#fff" opacity={0.25} />
        </g>
      ))}
      {/* floor tiles */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#f2b99c" />
      {Array.from({ length: 10 }, (_, i) => (
        <line key={i} x1={i * 120 - 40} y1={GROUND} x2={i * 160 - 260} y2={1920} stroke="#e7a283" strokeWidth={4} />
      ))}
      {[1380, 1500, 1650, 1830].map((y) => (
        <line key={y} x1={0} y1={y} x2={1080} y2={y} stroke="#e7a283" strokeWidth={4} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={5} />
    </svg>
  </AbsoluteFill>
);

// shelf unit on the right wall (filler goods only: no brands)
const SHELF_Y = [800, 960];
const Shelves: React.FC = () => (
  <g>
    <rect x={540} y={660} width={500} height={420} rx={10} fill="#f7c9b1" {...K} strokeWidth={5} />
    {SHELF_Y.map((y) => (
      <rect key={y} x={530} y={y} width={520} height={18} rx={6} fill="#c97b5a" {...K} strokeWidth={5} />
    ))}
    {/* filler boxes */}
    {[
      [575, 760, 40, 40, "#9ad1d4"],
      [1000, 750, 46, 50, "#f6d55c"],
      [580, 912, 46, 48, "#c3aed6"],
      [700, 920, 40, 40, "#9ad1d4"],
      [1005, 915, 42, 45, "#f28c8c"],
    ].map(([x, y, w, h, c], i) => (
      <rect key={i} x={(x as number) - (w as number) / 2} y={y as number} width={w as number} height={h as number} rx={6} fill={c as string} {...K} strokeWidth={4} />
    ))}
  </g>
);

// --- products (generic) -----------------------------------------------------------
type Kind = "bread" | "chips" | "sauce" | "candle";
const Product: React.FC<{ k: Kind; x: number; y: number; r?: number; s?: number; cross?: number }> = ({ k, x, y, r = 0, s = 1, cross = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {k === "bread" && (
      <g>
        <path d="M -52 20 L -52 -14 Q -52 -44 -20 -44 L 20 -44 Q 52 -44 52 -14 L 52 20 Z" fill="#e3a35b" {...K} strokeWidth={5} />
        <path d="M -30 -30 L -16 -14 M 0 -32 L 12 -14 M 26 -30 L 36 -16" stroke="#b46f2c" strokeWidth={5} strokeLinecap="round" />
      </g>
    )}
    {k === "chips" && (
      <g>
        <path d="M -38 -50 L 38 -50 L 44 46 L -44 46 Z" fill="#ffcf3f" {...K} strokeWidth={5} />
        <path d="M -38 -50 L -32 -60 L -20 -50 L -8 -60 L 4 -50 L 16 -60 L 28 -50 L 38 -60" fill="none" stroke={COL.ink} strokeWidth={4} />
        <ellipse cx={0} cy={4} rx={22} ry={16} fill="#f08a24" {...K} strokeWidth={4} />
        <text y={40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={20} fill={COL.ink}>
          CHIPS
        </text>
      </g>
    )}
    {k === "sauce" && (
      <g>
        <rect x={-10} y={-62} width={20} height={20} rx={4} fill="#2b2b2b" {...K} strokeWidth={4} />
        <path d="M -10 -44 L 10 -44 L 26 -14 L 26 46 L -26 46 L -26 -14 Z" fill="#d7263d" {...K} strokeWidth={5} />
        <rect x={-20} y={0} width={40} height={28} rx={4} fill="#fff" {...K} strokeWidth={3} />
      </g>
    )}
    {k === "candle" && (
      <g>
        <rect x={-30} y={-30} width={60} height={76} rx={10} fill="#c3aed6" {...K} strokeWidth={5} />
        <line x1={0} y1={-30} x2={0} y2={-44} stroke={COL.ink} strokeWidth={4} />
        <path d="M 0 -72 Q 12 -54 0 -44 Q -12 -54 0 -72 Z" fill="#ffb703" {...K} strokeWidth={3} />
      </g>
    )}
    {cross > 0 && (
      <g opacity={Math.min(1, cross)} transform={`scale(${0.6 + 0.4 * Math.min(1, cross)})`}>
        <circle r={42} fill="rgba(255,255,255,0.75)" stroke={COL.red} strokeWidth={8} />
        <line x1={-22} y1={-22} x2={22} y2={22} stroke={COL.red} strokeWidth={10} strokeLinecap="round" />
        <line x1={22} y1={-22} x2={-22} y2={22} stroke={COL.red} strokeWidth={10} strokeLinecap="round" />
      </g>
    )}
  </g>
);

const CartBack: React.FC = () => (
  <g>
    <path d="M 640 1100 L 910 1100 L 888 1222 L 662 1222 Z" fill="#cfd8e3" opacity={0.55} />
  </g>
);
const CartFront: React.FC = () => (
  <g>
    {/* handle */}
    <path d="M 600 1062 L 628 1062 L 652 1104" fill="none" stroke={COL.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    {/* basket */}
    <path d="M 640 1100 L 910 1100 L 888 1222 L 662 1222 Z" fill="#a9b8c9" fillOpacity={0.55} {...K} strokeWidth={6} />
    {[700, 760, 820, 870].map((x) => (
      <line key={x} x1={x} y1={1104} x2={x - 6} y2={1218} stroke={COL.ink} strokeWidth={3} opacity={0.6} />
    ))}
    <line x1={652} y1={1160} x2={898} y2={1160} stroke={COL.ink} strokeWidth={3} opacity={0.6} />
    {/* frame + wheels */}
    <path d="M 662 1222 L 676 1256 L 870 1256 L 888 1222" fill="none" stroke={COL.ink} strokeWidth={6} />
    <circle cx={690} cy={1268} r={20} fill="#333" {...K} strokeWidth={4} />
    <circle cx={860} cy={1268} r={20} fill="#333" {...K} strokeWidth={4} />
  </g>
);

// --- the banner (top) ---------------------------------------------------------------
const Banner: React.FC<{ total: number; unlocked: boolean; paid: number; o: number; f: number }> = ({ total, unlocked, paid, o, f }) => {
  const x0 = 140;
  const x1 = 940;
  const k = Math.max(0, Math.min(1, total / 199));
  return (
    <g opacity={o}>
      <rect x={96} y={296} width={900} height={290} rx={30} fill={COL.ink} />
      <rect x={90} y={290} width={900} height={290} rx={30} fill="#fff" {...K} />
      <text x={540} y={372} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={66} fill={COL.ink} letterSpacing={1}>
        FREE DELIVERY ABOVE ₹199
      </text>
      <rect x={x0} y={410} width={x1 - x0} height={56} rx={28} fill="#f1e6df" {...K} strokeWidth={5} />
      <rect x={x0 + 4} y={414} width={Math.max(0, (x1 - x0 - 8) * k)} height={48} rx={24} fill={unlocked ? MINT : CORAL} />
      {unlocked && (
        <text x={540} y={450} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill="#fff" letterSpacing={3} opacity={0.6 + 0.4 * Math.sin(f * 0.3)}>
          UNLOCKED ✓
        </text>
      )}
      <text x={x0} y={540} fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={COL.ink}>
        CART ₹{Math.round(total)}
      </text>
      <g>
        <text x={x1} y={540} textAnchor="end" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill={paid > 0 ? MINT : unlocked ? "#b9b1ab" : CORAL}>
          {paid > 0 ? "DELIVERY ₹40 · PAID" : "DELIVERY ₹40"}
        </text>
        {unlocked && paid <= 0 && <line x1={x1 - 290} y1={522} x2={x1} y2={522} stroke={COL.ink} strokeWidth={6} />}
      </g>
    </g>
  );
};

// --- the receipt: two generic chocolates -------------------------------------------
const Truffle: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -70 0 L -112 -30 L -104 0 L -112 30 Z" fill="#e8b923" {...K} strokeWidth={5} />
    <path d="M 70 0 L 112 -30 L 104 0 L 112 30 Z" fill="#e8b923" {...K} strokeWidth={5} />
    <circle r={72} fill="#f2c94c" {...K} strokeWidth={6} />
    <path d="M -40 -40 Q -10 -60 30 -46" stroke="#fff6c9" strokeWidth={10} fill="none" strokeLinecap="round" />
  </g>
);
const Basic: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-56} y={-50} width={112} height={100} rx={14} fill="#7b4a2a" {...K} strokeWidth={6} />
    <line x1={0} y1={-46} x2={0} y2={46} stroke="#5a3218" strokeWidth={5} />
    <line x1={-52} y1={0} x2={52} y2={0} stroke="#5a3218" strokeWidth={5} />
  </g>
);
const Tag: React.FC<{ x: number; y: number; text: string; s: number; col: string }> = ({ x, y, text, s, col }) => (
  <g transform={`translate(${x} ${y}) rotate(-6) scale(${s})`}>
    <rect x={-84} y={-38} width={168} height={76} rx={14} fill={col} {...K} strokeWidth={5} />
    <circle cx={-62} cy={0} r={8} fill="#fff" {...K} strokeWidth={3} />
    <text x={12} y={20} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={56} fill="#fff">
      {text}
    </text>
  </g>
);

// --- items: shelf <-> cart --------------------------------------------------------------
type Item = { k: Kind; price: number; shelf: [number, number]; cart: [number, number]; r: number };
const ITEMS: Item[] = [
  { k: "chips", price: 50, shelf: [660, 744], cart: [744, 1062], r: -8 },
  { k: "sauce", price: 40, shelf: [800, 742], cart: [812, 1066], r: 6 },
  { k: "candle", price: 60, shelf: [900, 912], cart: [866, 1074], r: 10 },
];
const FLY = 12;
const arc = (a: [number, number], b: [number, number], t: number, h = 170): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(Math.PI * t) * h];

// --- sfx --------------------------------------------------------------------------------
const lands = () => [W(3, 3), W(3, 4), W(3, 6)].map((t) => t + FLY);
const crosses = () => [W(12, 3), W(12, 5), W(12, 8)];
export const S01_SFX: SfxCue[] = [
  [W(0, 3), "kaching", 0.45],
  [W(0, 9), "impact", 0.6],
  [W(1, 0), "whoosh_long", 0.45],
  [W(1, 3), "pop", 0.45],
  [W(2, 2), "ding", 0.45],
  ...lands().map((t): SfxCue => [t, "thud", 0.5]),
  [lands()[2] + 1, "kaching", 0.55],
  [lands()[2] + 2, "gold", 0.4],
  [C(4), "swish", 0.45],
  [C(5), "whoosh", 0.4],
  [W(5, 6), "pop", 0.45],
  [W(6, 3), "pop", 0.45],
  [W(7, 1), "ding", 0.45],
  [W(8, 3), "swirl", 0.45],
  [W(9, 4), "stamp", 0.55],
  [W(10, 2), "riser", 0.4],
  [W(10, 6), "impact", 0.75],
  [W(11, 3), "whoosh", 0.45],
  [W(11, 3) + 6, "shatter", 0.45],
  ...crosses().map((t): SfxCue => [t, "buzz", 0.35]),
  [W(13, 1), "whoosh", 0.4],
  [W(13, 2) + 10, "clink", 0.6],
  [W(13, 4), "ding", 0.5],
];

export const S01Cart: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const rewind = W(1, 0);
  const L = lands();
  const unlockAt = L[2];
  const zero = C(4);
  const proof = C(5);
  const pick = W(7, 1);
  const cheaper = W(8, 3);
  const free = W(9, 4);
  const hit = W(10, 6);
  const twist = C(11);
  const flip = W(11, 3);
  const ask = C(12);
  const X = crosses();
  const removeAt = W(13, 0);
  const pay = W(13, 2);
  const payLand = pay + 14;

  // item states
  const itemNow = (i: number) => {
    const it = ITEMS[i];
    const land = L[i];
    // hook: in the cart until the rewind
    if (f < rewind) return { p: it.cart, r: it.r, inCart: 1 };
    if (f < rewind + FLY) {
      const t = interpolate(f, [rewind + i * 2, rewind + i * 2 + FLY - 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
      return { p: arc(it.cart, it.shelf, t, 120), r: lerp(it.r, 0, t), inCart: 1 - t };
    }
    if (f < land - FLY) return { p: it.shelf, r: 0, inCart: 0 };
    if (f < land) {
      const t = interpolate(f, [land - FLY, land], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      return { p: arc(it.shelf, it.cart, t), r: lerp(0, it.r + 360, t), inCart: t };
    }
    if (f < removeAt + i * 3) return { p: it.cart, r: it.r, inCart: 1 };
    const t = interpolate(f, [removeAt + i * 3, removeAt + i * 3 + FLY + 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
    return { p: arc(it.cart, it.shelf, t, 150), r: lerp(it.r, 0, t), inCart: 1 - t };
  };
  const states = ITEMS.map((_, i) => itemNow(i));
  const total = 49 + ITEMS.reduce((sum, it, i) => sum + it.price * states[i].inCart, 0);
  const unlockedNow = total >= 198.5;
  const unlocked = unlockedNow;
  const paid = f >= payLand ? 1 : 0;

  const proofK = interpolate(f, [proof - 6, proof + 6, twist - 6, twist + 4], [0, 1, 1, 0], clamp);
  const storeO = 1 - proofK;

  // receipt bars (share of choosers, Experiment 2)
  const trufPct = f < hit - 16 ? 73 : Math.round(interpolate(f, [W(10, 2), hit], [73, 31], clamp));
  const basicPct = f < W(10, 2) ? 27 : Math.round(interpolate(f, [W(10, 2), hit], [27, 69], { ...clamp, easing: Easing.in(Easing.quad) }));
  const barsIn = interpolate(f, [pick, pick + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // coin
  const coinT = interpolate(f, [pay, payLand], [0, 1], clamp);
  const coin = arc([560, 1020], [800, 520], coinT, 240);

  const youKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    { f: W(0, 9) - 2, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    { f: W(0, 9) + 4, p: { ...P.cheer }, e: SNAP },
    { f: rewind - 2, p: { ...P.cheer } },
    { f: rewind + 8, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    ...L.flatMap((t): Key[] => [
      { f: t - 2, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
      { f: t + 3, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30, y: YGY + 10 }, e: SNAP },
      { f: t + 9, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    ]),
    { f: unlockAt + 2, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    { f: unlockAt + 8, p: { ...P.cheer, y: YGY - 30 }, e: SNAP },
    { f: zero + 6, p: { ...P.cheer, y: YGY - 30 } },
    { f: zero + 16, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    { f: X[0] - 2, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
    { f: X[0] + 6, p: { ...P.think }, e: SNAP },
    { f: pay - 4, p: { ...P.think } },
    { f: pay, p: { ra1: 150, ra2: -20, la1: 70, la2: 30 }, e: SNAP }, // throws the coin
    { f: pay + 12, p: { ra1: 150, ra2: -20, la1: 70, la2: 30 } },
    { f: pay + 20, p: { ...P.pointR, ra1: 92, ra2: 4, la1: 70, la2: 30 } },
  ];

  const sparkMood = (t: number): Mood =>
    t < rewind ? "smug" : t >= W(3, 6) && t < zero ? "shock" : t >= hit && t < twist ? "shock" : t >= twist && t < ask ? "smug" : t >= removeAt ? "happy" : "neutral";
  const bulb = (t: number) => Math.max(bulbPulse(t, flip, 40), bulbPulse(t, zero, 16) * 0.5);
  const sparkKeys: Key[] = [
    { f: 0, p: { ...P.pointR, ra1: 110 } },
    { f: W(0, 9) - 2, p: { ...P.pointR, ra1: 110 } },
    { f: W(0, 9) + 4, p: { ...P.shrug }, e: SNAP },
    { f: rewind - 2, p: { ...P.shrug } },
    { f: rewind + 4, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // up at the banner
    { f: W(2, 2) - 2, p: { ra1: 150, ra2: -10, la1: -18 } },
    { f: W(2, 2) + 4, p: { ra1: 135, ra2: 10, la1: -18 }, e: SNAP },
    { f: C(3) + 4, p: { ...P.pointR, ra1: 100 } },
    { f: W(3, 6) - 2, p: { ...P.pointR, ra1: 100 } },
    { f: W(3, 6) + 4, p: { ...P.facepalm }, e: SNAP }, // "a candle you don't need"
    { f: zero - 2, p: { ...P.facepalm } },
    { f: zero + 5, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // finger up: zero price effect
    { f: proof - 2, p: { ra1: 150, ra2: -10, la1: -18 } },
    { f: proof + 6, p: { ...P.pointR, ra1: 100 } }, // at the truffle
    { f: W(6, 1) - 2, p: { ...P.pointR, ra1: 100 } },
    { f: W(6, 1) + 4, p: { ...P.pointR, ra1: 112 }, e: SNAP },
    { f: pick - 2, p: { ...P.pointR, ra1: 112 } },
    { f: pick + 4, p: { ...P.shrug }, e: SNAP },
    { f: cheaper - 2, p: { ...P.shrug } },
    { f: cheaper + 6, p: { ...P.think } },
    { f: hit - 2, p: { ...P.think } },
    { f: hit + 3, p: { ...P.shock }, e: SNAP },
    { f: twist - 2, p: { ...P.shock } },
    { f: twist + 6, p: { ...P.pointR, ra1: 120 } },
    { f: flip - 2, p: { ...P.pointR, ra1: 120 } },
    { f: flip + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // aha
    { f: ask - 2, p: { ra1: 150, ra2: -10, la1: -18 } },
    { f: ask + 6, p: { ...P.think } },
    { f: X[0] - 2, p: { ...P.think } },
    { f: X[0] + 4, p: { ...P.pointR, ra1: 100 }, e: SNAP },
    { f: removeAt - 2, p: { ...P.pointR, ra1: 100 } },
    { f: removeAt + 6, p: { ...P.pointR, ra1: 135 }, e: SNAP },
    { f: payLand, p: { ...P.pointR, ra1: 135 } },
    { f: payLand + 6, p: { ...P.cheer }, e: SNAP },
  ];

  const z = punch(f, [W(0, 9), W(2, 2), unlockAt, zero, free, hit, flip, payLand], 0.035);
  const flipDeg = interpolate(f, [flip, flip + 12], [0, 180], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <Stage
      bg={<Aisle f={f} />}
      hits={[W(0, 9), unlockAt, hit, flip + 6]}
      power={11}
      cam={{ z }}
      under={
        <AbsoluteFill style={{ background: PLUM, opacity: proofK * 0.92 }} />
      }
      svg={
        <>
          <g opacity={storeO}>
            <Shelves />
            {/* shelf items (when not in the cart / flying) */}
            {ITEMS.map((it, i) => {
              const s = states[i];
              const flying = s.inCart > 0 && s.inCart < 1;
              if (s.inCart >= 1 || flying) return null;
              return <Product key={i} k={it.k} x={it.shelf[0]} y={it.shelf[1]} s={0.9} />;
            })}
            <CartBack />
            {/* bread: the ₹49 cart */}
            <Product k="bread" x={690} y={1078} r={-4} s={0.9} />
            {ITEMS.map((it, i) => {
              const s = states[i];
              if (s.inCart >= 1) {
                const cross = f >= X[i] && f < removeAt + i * 3 ? interpolate(f, [X[i], X[i] + 6], [0, 1], clamp) : 0;
                return <Product key={i} k={it.k} x={s.p[0]} y={s.p[1]} r={s.r} s={0.9} cross={cross} />;
              }
              return null;
            })}
            <CartFront />
            {ITEMS.map((it, i) => {
              const s = states[i];
              if (s.inCart > 0 && s.inCart < 1) return <Product key={i} k={it.k} x={s.p[0]} y={s.p[1]} r={s.r} s={0.9} />;
              return null;
            })}
            <Actor
              f={f}
              color={COL.orange}
              scale={YS}
              label="YOU"
              face={f >= X[0] && f < pay ? "sad" : f >= unlockAt && f < proof ? "happy" : f >= payLand ? "happy" : "eyes"}
              base={{ x: YX, y: YGY }}
              keys={youKeys}
              mod={(t, p) => addPose(p, idle(t, 5))}
            />
            {f >= unlockAt && f < unlockAt + 22 && <Burst x={540} y={440} at={unlockAt} f={f} size={260} color={MINT} />}
            {/* the coin */}
            {coinT > 0 && coinT < 1 && (
              <g transform={`translate(${coin[0]} ${coin[1]}) rotate(${coinT * 540})`}>
                <circle r={34} fill={COL.gold} {...K} strokeWidth={5} />
                <text y={12} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
                  ₹40
                </text>
              </g>
            )}
            {f >= payLand && f < payLand + 20 && <Burst x={800} y={520} at={payLand} f={f} size={180} color={COL.gold} />}
          </g>
          <Banner total={total} unlocked={unlocked && !paid} paid={paid} o={storeO} f={f} />

          {/* receipt: the chocolate study */}
          {proofK > 0.02 && (
            <g opacity={proofK}>
              <g transform={`translate(430 600) scale(${pop(f, proof + 2)})`}>
                <Truffle x={0} y={0} />
              </g>
              <g transform={`translate(790 600) scale(${pop(f, W(6, 1))})`}>
                <Basic x={0} y={0} />
              </g>
              {f >= W(5, 6) && <Tag x={500} y={480} s={pop(f, W(5, 6))} text={f >= cheaper ? "14¢" : "15¢"} col="#8e44ad" />}
              {f >= W(6, 3) && <Tag x={860} y={480} s={f >= free ? pop(f, free) * 1.15 : pop(f, W(6, 3))} text={f >= free ? "FREE" : "1¢"} col={f >= free ? MINT : "#8e44ad"} />}
              {f >= cheaper && f < cheaper + 16 && (
                <text x={680} y={420} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} fill="#ffd166" opacity={interpolate(f, [cheaper, cheaper + 4, cheaper + 12, cheaper + 16], [0, 1, 1, 0], clamp)}>
                  −1¢ EACH
                </text>
              )}
              {[
                { x: 430, name: "FANCY TRUFFLE", v: trufPct, col: COL.gold },
                { x: 790, name: "BASIC CHOCOLATE", v: basicPct, col: MINT },
              ].map((b) => {
                const h = 440 * (b.v / 100) * barsIn;
                return (
                  <g key={b.x}>
                    <text x={b.x} y={712} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill="#fff" letterSpacing={2}>
                      {b.name}
                    </text>
                    <rect x={b.x - 85} y={1230 - h} width={170} height={h} rx={10} fill={b.col} {...K} strokeWidth={5} />
                    {barsIn > 0.3 && (
                      <text x={b.x} y={1230 - h - 22} textAnchor="middle" fontFamily={FONT.comic} fontSize={92} fill="#fff" stroke={COL.ink} strokeWidth={6} paintOrder="stroke">
                        {b.v}%
                      </text>
                    )}
                  </g>
                );
              })}
              <line x1={320} x2={920} y1={1230} y2={1230} stroke="#fff" strokeWidth={5} />
              {f >= hit && <Burst x={790} y={880} at={hit} f={f} size={240} color={MINT} />}
            </g>
          )}

          {/* SPARK */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 150, y: SGY }}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => addPose(p, idle(t, 8))}
          />
        </>
      }
      html={
        <>
          {/* hook layer: readable on frame 0 */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 690,
              transform: `translate(-50%,-50%) rotate(-3deg) scale(${f < W(0, 9) ? 1 : pop(f, W(0, 9)) * 1})`,
              opacity: interpolate(f, [rewind - 4, rewind + 2], [1, 0], clamp),
              background: COL.red,
              color: "#fff",
              border: `6px solid ${COL.ink}`,
              boxShadow: `8px 8px 0 ${COL.ink}`,
              borderRadius: 16,
              padding: "8px 30px",
              fontFamily: FONT.comic,
              fontSize: 84,
              letterSpacing: 3,
              whiteSpace: "nowrap",
            }}
          >
            SPENT ₹150 · SAVED ₹40
          </div>
          <Slam f={f} at={W(2, 2)} out={C(3) + 6} x={540} y={690} size={100} color="#fff" stroke={`8px ${COL.ink}`}>
            ₹150 SHORT!
          </Slam>
          <Slam f={f} at={unlockAt} out={zero - 4} x={540} y={690} size={120} color={MINT} stroke={`8px ${COL.ink}`} rotate={-3}>
            UNLOCKED!
          </Slam>
          <Slam f={f} at={zero} out={proof - 6} x={540} y={690} size={104} color="#fff" stroke={`8px ${COL.ink}`}>
            THE ZERO PRICE EFFECT
          </Slam>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 330,
              transform: "translate(-50%,-50%)",
              opacity: proofK,
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 52,
              letterSpacing: 4,
              color: "#ffd166",
              whiteSpace: "nowrap",
            }}
          >
            ONE STUDY · REAL PURCHASES
          </div>
          {proofK > 0.02 && f >= pick && (
            <div
              style={{
                position: "absolute",
                left: 620,
                top: 1290,
                transform: "translate(-50%,-50%)",
                opacity: proofK * interpolate(f, [pick, pick + 8], [0, 1], clamp),
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 27,
                color: "#e6d9f0",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              Share of buyers · Shampanier, Mazar &amp; Ariely (2007)
            </div>
          )}

          {/* twist: the FREE badge flips */}
          {f >= twist && f < ask + 4 && (
            <div
              style={{
                position: "absolute",
                left: 560,
                top: 720,
                width: 620,
                height: 200,
                transform: `translate(-50%,-50%) scale(${pop(f, twist)}) perspective(1200px) rotateY(${flipDeg}deg)`,
                transformStyle: "preserve-3d",
                opacity: interpolate(f, [ask - 4, ask + 4], [1, 0], clamp),
              }}
            >
              {[
                { t: "FREE DELIVERY ✓", bg: MINT, back: false },
                { t: "COST YOU ₹150", bg: COL.red, back: true },
              ].map((side) => (
                <div
                  key={side.t}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    transform: side.back ? "rotateY(180deg)" : undefined,
                    background: side.bg,
                    border: `7px solid ${COL.ink}`,
                    borderRadius: 26,
                    boxShadow: `10px 10px 0 ${COL.ink}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT.comic,
                    fontSize: 92,
                    letterSpacing: 3,
                    color: "#fff",
                    WebkitTextStroke: `4px ${COL.ink}`,
                    paintOrder: "stroke fill",
                    whiteSpace: "nowrap",
                  }}
                >
                  {side.t}
                </div>
              ))}
            </div>
          )}
          <Slam f={f} at={ask} out={removeAt - 4} x={540} y={690} size={92} color="#fff" stroke={`8px ${COL.ink}`}>
            WOULD I BUY IT ANYWAY?
          </Slam>
          <Slam f={f} at={payLand} x={540} y={650} size={112} color={MINT} stroke={`8px ${COL.ink}`} rotate={-3}>
            JUST PAY THE ₹40
          </Slam>

          {/* standing disclaimer */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1555,
              transform: "translateX(-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 26,
              color: proofK > 0.5 ? "#e6d9f0" : "#7a4a36",
              whiteSpace: "nowrap",
              opacity: 0.9,
            }}
          >
            Education, not financial advice · prices are illustrative
          </div>

          <VoiceCaptions
            f={f}
            cues={VOICE_CUES}
            hi={["hundred", "fifty", "forty", "fortynine", "candle", "zero", "free", "truffle", "twentyseven", "sixtynine", "priciest", "anyway"]}
          />
        </>
      }
    />
  );
};

