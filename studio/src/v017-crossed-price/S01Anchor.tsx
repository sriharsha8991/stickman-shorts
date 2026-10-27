import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V017 · Why ₹2,999 crossed out makes ₹999 feel cheap. Retention v2 cut (~28 s), Myth vs Reality, power-up "beam".
// World: a sunset harbour (peach sky, navy sea, wooden dock). Metaphor: the crossed-out price is an ANCHOR.
// Frame 0: Spark fires a beam that blasts the struck ₹2,999 off a hanging price tag; it turns into an anchor and
// drops into the sea, chained to ₹999. Then the 1974 wheel test (a ship's-wheel "wheel of fortune" lands on 10 or 65),
// the UN question, two depth gauges (saw 10 → guessed 25 %, saw 65 → guessed 45 %), anchors dragging the guesses,
// back to the tag (₹999 = STEAL?), the payoff (cover the old price, chain snaps), and the next tag swings in = frame 0.
// Source: Tversky & Kahneman (1974), Science 185(4157):1124–1131. Prices are illustrative.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const SX = 205;
const SEA = 1070; // sea surface
const NAVY = "#1d3557";
const NAVY2 = "#12233b";
const PEACH = "#ffd3a5";
const CREAM = "#fff6e6";
const RED = "#e63946";
const GOLD = "#f4b942";
const WOOD = "#8b5a2b";
const STEEL = "#5c6b7a";
const INK = COL.ink;
const PEAK = POWER_PEAK.beam; // 14

const T = {
  crossed: W(0, 1),
  n2999: W(0, 2),
  never: W(0, 5),
  pay: W(0, 6),
  but: C(1),
  decides: W(1, 2),
  doPay: W(1, 5),
  how: W(1, 6),
  researchers: C(2),
  spun: W(2, 1),
  wheel: W(2, 3),
  ten: W(2, 4),
  sixty: W(2, 6),
  then: C(3),
  share: W(3, 2),
  african: W(3, 7),
  spin10: C(4),
  people: W(4, 2),
  n25: W(4, 4),
  spin65: C(5),
  n45: W(5, 2),
  random: C(6),
  dragged: W(6, 3),
  next: C(7),
  n999: W(7, 3),
  steal: W(7, 8),
  cover: C(8),
  old: W(8, 2),
  worth: W(8, 5),
  now: C(9),
  nextW: W(9, 4),
};
const LOOP = VOICE_FRAMES - 16;
const TX = 700; // tag centre
const TY = 820;

// --- background: sunset harbour ---------------------------------------------------------------------------------
const Harbour: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="v17sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb38a" />
          <stop offset="70%" stopColor={PEACH} />
          <stop offset="100%" stopColor="#ffe9c9" />
        </linearGradient>
        <linearGradient id="v17sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a4a73" />
          <stop offset="100%" stopColor={NAVY2} />
        </linearGradient>
      </defs>
      <rect width={1080} height={SEA} fill="url(#v17sky)" />
      <circle cx={820} cy={SEA - 40} r={150} fill="#ffeaa0" opacity={0.85} />
      {/* distant lighthouse + far shore */}
      <path d={`M 0 ${SEA - 30} Q 180 ${SEA - 70} 360 ${SEA - 34} L 360 ${SEA} L 0 ${SEA} Z`} fill="#c97b63" opacity={0.6} />
      <g transform={`translate(120 ${SEA - 60})`} opacity={0.7}>
        <path d="M -16 0 L -10 -110 L 10 -110 L 16 0 Z" fill={CREAM} stroke={INK} strokeWidth={3} />
        <rect x={-10} y={-80} width={20} height={14} fill={RED} />
        <rect x={-10} y={-50} width={20} height={14} fill={RED} />
        <rect x={-13} y={-128} width={26} height={18} fill={GOLD} stroke={INK} strokeWidth={3} />
      </g>
      {/* gulls */}
      {[0, 1, 2].map((i) => {
        const x = ((f * (1.2 + i * 0.3) + i * 300) % 1300) - 110;
        const y = 300 + i * 70 + Math.sin(f / 9 + i) * 10;
        return <path key={i} d={`M ${x - 18} ${y} Q ${x - 9} ${y - 12} ${x} ${y} Q ${x + 9} ${y - 12} ${x + 18} ${y}`} fill="none" stroke={INK} strokeWidth={4} opacity={0.5} />;
      })}
      <rect y={SEA} width={1080} height={1920 - SEA} fill="url(#v17sea)" />
      {Array.from({ length: 9 }, (_, i) => {
        const y = SEA + 30 + i * 90;
        const off = Math.sin(f / 14 + i) * 30;
        return (
          <path
            key={i}
            d={`M ${-40 + off} ${y} q 60 -16 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`}
            fill="none"
            stroke="#ffffff"
            strokeWidth={4}
            opacity={0.12}
          />
        );
      })}
      {/* sun glints */}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={760 + random(`gx${i}`) * 140 - 70} y={SEA + 14 + i * 16} width={40 + random(`gw${i}`) * 60} height={5} rx={3} fill="#ffeaa0" opacity={0.35 + 0.2 * Math.sin(f / 6 + i)} />
      ))}
      {/* dock under Spark */}
      <rect x={20} y={GROUND} width={430} height={44} fill={WOOD} stroke={INK} strokeWidth={6} />
      {[60, 150, 240, 330].map((x) => (
        <line key={x} x1={x} y1={GROUND} x2={x} y2={GROUND + 44} stroke={INK} strokeWidth={3} opacity={0.5} />
      ))}
      {[70, 250, 420].map((x) => (
        <rect key={x} x={x - 16} y={GROUND + 44} width={32} height={520} fill="#6b4423" stroke={INK} strokeWidth={5} />
      ))}
      {/* bollard */}
      <g transform={`translate(400 ${GROUND})`}>
        <rect x={-22} y={-50} width={44} height={50} rx={8} fill={STEEL} stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-60} width={60} height={16} rx={6} fill={STEEL} stroke={INK} strokeWidth={5} />
      </g>
    </svg>
  </AbsoluteFill>
);

// --- props ------------------------------------------------------------------------------------------------------
const Anchor: React.FC<{ x: number; y: number; s?: number; r?: number; label?: string }> = ({ x, y, s = 1, r = 0, label }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <circle cy={-130} r={24} fill="none" stroke={STEEL} strokeWidth={14} />
    <circle cy={-130} r={24} fill="none" stroke={INK} strokeWidth={3} />
    <rect x={-12} y={-108} width={24} height={200} rx={8} fill={STEEL} {...K} strokeWidth={5} />
    <rect x={-70} y={-86} width={140} height={22} rx={10} fill={STEEL} {...K} strokeWidth={5} />
    <path d="M -110 30 Q -100 110 0 112 Q 100 110 110 30" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <path d="M -110 30 Q -100 110 0 112 Q 100 110 110 30" fill="none" stroke={STEEL} strokeWidth={20} strokeLinecap="round" />
    <path d="M -136 46 L -110 8 L -84 46 Z" fill={STEEL} {...K} strokeWidth={5} />
    <path d="M 136 46 L 110 8 L 84 46 Z" fill={STEEL} {...K} strokeWidth={5} />
    {label && (
      <g transform="translate(0 -20)">
        <rect x={-96} y={-30} width={192} height={60} rx={10} fill={CREAM} {...K} strokeWidth={5} />
        <text y={18} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={INK}>
          {label}
        </text>
      </g>
    )}
  </g>
);

const Chain: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number; sag?: number }> = ({ x1, y1, x2, y2, p = 1, sag = 0 }) => {
  const n = 12;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        if (t > p) return null;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag;
        const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return <ellipse key={i} cx={x} cy={y} rx={20} ry={11} fill="none" stroke={GOLD} strokeWidth={8} transform={`rotate(${ang + (i % 2 ? 0 : 90)} ${x} ${y})`} />;
      })}
    </g>
  );
};

// hanging price tag; `old` = 0..1 visibility of the struck ₹2,999 line
const Tag: React.FC<{ x: number; y: number; r?: number; s?: number; old: number; oldText?: string; newText?: string; glow?: number; cover?: number }> = ({
  x,
  y,
  r = 0,
  s = 1,
  old,
  oldText = "₹2,999",
  newText = "₹999",
  glow = 0,
  cover = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <line x1={0} y1={-260} x2={0} y2={-150} stroke={INK} strokeWidth={5} />
    <path d="M -210 -110 L -120 -165 L 120 -165 L 210 -110 L 210 165 L -210 165 Z" fill={CREAM} {...K} strokeWidth={8} />
    <circle cy={-118} r={18} fill={PEACH} stroke={INK} strokeWidth={5} />
    <text y={-62} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={RED} letterSpacing={6}>
      SALE
    </text>
    {old > 0.01 && (
      <g opacity={old}>
        <text y={6} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill="#8a8a8a">
          {oldText}
        </text>
        <line x1={-140} y1={-18} x2={140} y2={-18} stroke={RED} strokeWidth={10} strokeLinecap="round" />
      </g>
    )}
    {cover > 0.01 && (
      <g transform={`translate(${interpolate(cover, [0, 1], [320, 0])} 0) rotate(-3)`}>
        <rect x={-170} y={-50} width={340} height={80} rx={10} fill={NAVY} {...K} strokeWidth={6} />
        <text y={10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={CREAM} letterSpacing={3}>
          NO OLD PRICE
        </text>
      </g>
    )}
    {glow > 0.01 && <ellipse cy={100} rx={190} ry={70} fill="#ffeaa0" opacity={glow * 0.8} />}
    <text y={130} textAnchor="middle" fontFamily={FONT.comic} fontSize={130} fill={RED} stroke={INK} strokeWidth={6} paintOrder="stroke">
      {newText}
    </text>
  </g>
);

// ship's wheel as a wheel of fortune; seg 0 = 10, seg 3 = 65
const LABELS = ["10", "40", "85", "65", "20", "90", "35", "75", "5", "55", "30", "70"];
const Helm: React.FC<{ x: number; y: number; s: number; rot: number; hi?: number }> = ({ x, y, s, rot, hi = -1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g transform={`rotate(${rot})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45})`}>
          <rect x={-10} y={-300} width={20} height={70} rx={8} fill={WOOD} {...K} strokeWidth={5} />
          <circle cy={-300} r={20} fill={WOOD} {...K} strokeWidth={5} />
        </g>
      ))}
      <circle r={232} fill="#c48a4a" {...K} strokeWidth={8} />
      {LABELS.map((l, i) => {
        const a0 = ((i * 30 - 15 - 90) * Math.PI) / 180;
        const a1 = ((i * 30 + 15 - 90) * Math.PI) / 180;
        return (
          <path
            key={i}
            d={`M 0 0 L ${222 * Math.cos(a0)} ${222 * Math.sin(a0)} A 222 222 0 0 1 ${222 * Math.cos(a1)} ${222 * Math.sin(a1)} Z`}
            fill={i === hi ? GOLD : i % 2 ? CREAM : "#f2d7b0"}
            stroke={INK}
            strokeWidth={3}
          />
        );
      })}
      {LABELS.map((l, i) => (
        <text key={`t${i}`} transform={`rotate(${i * 30}) translate(0 -160)`} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT.comic} fontSize={54} fill={INK}>
          {l}
        </text>
      ))}
      <circle r={62} fill={WOOD} {...K} strokeWidth={7} />
      <circle r={22} fill={GOLD} {...K} strokeWidth={5} />
    </g>
    {/* pointer */}
    <path d="M -30 -262 L 30 -262 L 0 -212 Z" fill={RED} {...K} strokeWidth={6} />
  </g>
);

// depth gauge pole in the sea; value in %
const GY0 = 1250;
const GPX = 5.0;
const gy = (v: number) => GY0 - v * GPX;
const Gauge: React.FC<{ f: number; x: number; anchorV: number; guess: number; label: string; k: number; tug: number }> = ({ f, x, anchorV, guess, label, k, tug }) => (
  <g opacity={k}>
    <rect x={x - 14} y={gy(100) - 10} width={28} height={GY0 - gy(100) + 20} rx={8} fill={CREAM} {...K} strokeWidth={5} />
    {[0, 25, 50, 75, 100].map((v) => (
      <g key={v}>
        <line x1={x - 14} x2={x + 14} y1={gy(v)} y2={gy(v)} stroke={INK} strokeWidth={4} />
        <text x={x - 30} y={gy(v) + 10} textAnchor="end" fontFamily={FONT.title} fontWeight={800} fontSize={28} fill={CREAM} opacity={0.8}>
          {v}
        </text>
      </g>
    ))}
    {/* anchor at the spin number */}
    <Anchor x={x - 64} y={gy(anchorV) + 30} s={0.32} r={-8} />
    <text x={x - 64} y={gy(anchorV) + 94} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={GOLD} stroke={INK} strokeWidth={5} paintOrder="stroke">
      {anchorV}
    </text>
    {/* chain anchor → buoy */}
    {tug > 0.01 && <Chain x1={x - 50} y1={gy(anchorV)} x2={x + 52} y2={gy(guess)} p={tug} sag={10} />}
    {/* guess buoy */}
    {guess > 0.2 && (
      <g transform={`translate(${x + 60} ${gy(guess) + Math.sin(f / 7) * 3}) rotate(${tug > 0.5 ? Math.sin(f / 3) * 6 : 0})`}>
        <circle r={34} fill={CREAM} {...K} strokeWidth={6} />
        <path d="M -34 0 A 34 34 0 0 1 0 -34 L 0 0 Z" fill={RED} />
        <path d="M 34 0 A 34 34 0 0 1 0 34 L 0 0 Z" fill={RED} />
        <circle r={34} fill="none" stroke={INK} strokeWidth={6} />
        <circle r={13} fill={NAVY} stroke={INK} strokeWidth={4} />
        <text x={56} y={18} fontFamily={FONT.comic} fontSize={62} fill={CREAM} stroke={INK} strokeWidth={6} paintOrder="stroke">
          {Math.round(guess)}%
        </text>
      </g>
    )}
    <text x={x} y={GY0 + 76} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={CREAM} letterSpacing={2}>
      {label}
    </text>
  </g>
);

// --- sfx --------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "riser", 0.35],
  [PEAK - 6, "whoosh_long", 0.5],
  [PEAK, "impact", 0.7],
  [PEAK + 2, "shatter", 0.35],
  [T.never, "swish", 0.4],
  [T.decides, "chains", 0.5],
  [T.decides + 12, "crash", 0.35],
  [T.doPay, "thud", 0.55],
  [T.how, "boing", 0.35],
  [T.researchers, "whoosh", 0.4],
  [T.spun, "swirl", 0.45],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [T.spun + 4 + i * 4, "tick", 0.25]),
  [T.ten, "ding", 0.5],
  [T.sixty - 6, "swish", 0.35],
  [T.sixty + 2, "ding", 0.5],
  [T.then, "pop", 0.4],
  [T.african, "stinger", 0.35],
  [T.spin10, "whoosh", 0.35],
  [T.n25, "pop", 0.5],
  [T.spin65 - 4, "riser", 0.45],
  [T.n45, "slam", 0.7],
  [T.random, "chains", 0.45],
  [T.dragged, "stinger", 0.5],
  [T.next, "whoosh", 0.4],
  [T.n999, "kaching", 0.5],
  [T.steal, "stamp", 0.6],
  [T.cover, "swish", 0.45],
  [T.old, "shatter", 0.4],
  [T.worth, "ding", 0.4],
  [T.now, "whoosh", 0.4],
  [LOOP - 4, "chains", 0.35],
];

export const S01Anchor: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // --- windows ---
  const tagK = Math.max(win(f, -10, T.researchers, 6), win(f, T.next + 4, VOICE_FRAMES + 30, 6));
  const wheelK = win(f, T.researchers - 2, T.spin10, 6);
  const gaugeK = win(f, T.spin10 - 2, T.next, 6);
  const nextK = interpolate(f, [T.now - 4, T.now + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) });

  // cold open: struck price plate blasts off at PEAK, becomes an anchor at "never", drops at "decides"
  const plateUp = interpolate(f, [PEAK, PEAK + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const morph = interpolate(f, [T.never - 4, T.never + 6], [0, 1], clamp);
  const drop = interpolate(f, [T.decides, T.decides + 22], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const ancX = TX + interpolate(plateUp, [0, 1], [0, 150]);
  const ancY0 = TY - 40 - plateUp * 110;
  const ancY = ancY0 + drop * (1250 - ancY0);
  const yank = interpolate(f, [T.doPay - 2, T.doPay + 4, T.doPay + 16], [0, 26, 14], clamp);
  const splash = T.decides + Math.round(22 * Math.sqrt((SEA - ancY0) / (1250 - ancY0)));

  // tag in the second act (anchor already in the sea)
  const act2 = f >= T.next - 8;
  const snap = f >= T.old;
  const swingUp = interpolate(f, [T.old, T.old + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });

  // wheel
  const rot =
    f < T.ten
      ? interpolate(f, [T.spun - 6, T.ten], [0, 1080], { ...clamp, easing: Easing.out(Easing.cubic) })
      : interpolate(f, [T.sixty - 10, T.sixty + 2], [1080, 1350], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hiSeg = f >= T.sixty + 2 ? 3 : f >= T.ten ? 0 : -1;
  const wheelS = interpolate(f, [T.then - 4, T.then + 8], [1, 0.36], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const wheelX = interpolate(f, [T.then - 4, T.then + 8], [690, 880], clamp);
  const wheelY = interpolate(f, [T.then - 4, T.then + 8], [900, 700], clamp);

  // gauges
  const gA = interpolate(f, [T.people - 4, T.n25 + 4], [0, 25], { ...clamp, easing: Easing.out(Easing.cubic) });
  const gBk = interpolate(f, [T.spin65 - 4, T.spin65 + 2], [0, 1], clamp);
  const gB = interpolate(f, [T.spin65 + 4, T.n45], [0, 45], { ...clamp, easing: Easing.in(Easing.quad) });
  const tug = interpolate(f, [T.random, T.dragged + 4], [0, 1], clamp);

  const overlayK = Math.max(interpolate(f, [T.how - 4, T.how + 4], [1, 0], clamp), interpolate(f, [LOOP - 6, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, { ...G.pointSide, ra1: 95, ra2: 10, lean: 6 }],
    [PEAK - 4, { ...G.pointSide, ra1: 88, ra2: 4, lean: 2 }],
    [PEAK, { ...G.pointSide, ra1: 80, ra2: 0, lean: 14 }, "snap"],
    [T.n2999 + 10, G.handsHips, "snap"],
    [T.never, G.stop, "snap"],
    [T.decides, G.pointDown, "snap"],
    [T.doPay, G.recoil, "snap"],
    [T.how, G.shrugBig, "snap"],
    [T.researchers, G.present, "snap"],
    [T.ten, G.count1, "snap"],
    [T.sixty, G.count2, "snap"],
    [T.then, G.thinkChin, "snap"],
    [T.african, G.leanIn, "snap"],
    [T.spin10, G.pointSide, "snap"],
    [T.n25, G.presentBoth, "snap"],
    [T.n45, G.recoil, "snap"],
    [T.random, G.facepalm, "snap"],
    [T.dragged, G.mindBlown, "snap"],
    [T.next, G.doublePoint, "snap"],
    [T.steal, G.armsCrossed, "snap"],
    [T.cover, G.beckon, "snap"],
    [T.old, G.fistPump, "snap"],
    [T.worth, G.whisper, "snap"],
    [T.now, { ...G.pointSide, ra1: 95, ra2: 10, lean: 6 }, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK
      ? "determined"
      : t < T.never
        ? "smug"
        : t < T.doPay
          ? "skeptical"
          : t < T.researchers
            ? "curious"
            : t < T.then
              ? "excited"
              : t < T.spin10
                ? "thinking"
                : t < T.n45
                  ? "curious"
                  : t < T.random
                    ? "shock"
                    : t < T.next
                      ? "mindblown"
                      : t < T.cover
                        ? "skeptical"
                        : t < T.worth
                          ? "happy"
                          : t < T.now
                            ? "wink"
                            : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.dragged, 28), bulbPulse(t, T.old, 24));
  const z = punch(f, [PEAK, T.doPay, T.n45, T.dragged, T.steal], 0.035);

  return (
    <Stage
      bg={<Harbour f={f} />}
      hits={[...powerHits("beam", 0), T.doPay, T.n45]}
      power={10}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="beam" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={TX} ty={TY - 20} layer="back" />

          {/* ACT 1 + ACT 3: the tag */}
          {tagK > 0.01 && (
            <g opacity={tagK}>
              {!act2 ? (
                <>
                  {f >= T.decides && <Chain x1={TX} y1={TY + 165 + yank} x2={ancX} y2={ancY - 130} p={interpolate(f, [T.decides, T.decides + 10], [0, 1], clamp)} />}
                  <Tag x={TX} y={TY + yank} r={yank * 0.3} old={f < PEAK ? 1 : 0} />
                  {/* struck plate flying off, then turning into the anchor */}
                  {f >= PEAK && (
                    <g>
                      {morph < 1 && (
                        <g transform={`translate(${ancX} ${ancY0 + 34}) rotate(${plateUp * 18 - morph * 18}) scale(${0.75 * (1 - morph)})`}>
                          <rect x={-160} y={-62} width={320} height={110} rx={12} fill={CREAM} {...K} strokeWidth={6} />
                          <text y={20} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill="#8a8a8a">
                            ₹2,999
                          </text>
                          <line x1={-140} y1={-4} x2={140} y2={-4} stroke={RED} strokeWidth={10} strokeLinecap="round" />
                        </g>
                      )}
                      {morph > 0 && <Anchor x={ancX} y={ancY} s={0.85 * morph} r={drop * 6} label="₹2,999" />}
                    </g>
                  )}
                  <Burst x={TX} y={TY - 20} at={PEAK} f={f} size={300} color={GOLD} />
                  {f >= splash && f < splash + 30 && (
                    <g>
                      {Array.from({ length: 9 }, (_, i) => {
                        const d = f - splash;
                        const a = (-160 + i * 17.5) * (Math.PI / 180);
                        return <circle key={i} cx={ancX + Math.cos(a) * d * 7} cy={SEA + Math.sin(a) * d * 9 + d * d * 0.5} r={12 - d * 0.35} fill={CREAM} opacity={1 - d / 30} />;
                      })}
                      <ellipse cx={ancX} cy={SEA} rx={40 + (f - splash) * 8} ry={10 + (f - splash) * 1.5} fill="none" stroke={CREAM} strokeWidth={5} opacity={1 - (f - splash) / 30} />
                    </g>
                  )}
                  <Burst x={TX} y={TY + 165} at={T.doPay} f={f} size={180} color={RED} />
                </>
              ) : (
                <>
                  {/* the anchor lies in the sea, chained to the tag, until the chain snaps on "old" */}
                  <g opacity={interpolate(f, [T.now - 2, T.now + 8], [1, 0], clamp)}><Anchor x={TX + 120} y={1250 + (snap ? swingUp * 40 : 0)} s={0.75} r={6} label="₹2,999" /></g>
                  {!snap ? (
                    <Chain x1={TX} y1={TY + 179} x2={TX + 120} y2={1140} />
                  ) : (
                    <g opacity={1 - swingUp}>
                      <Chain x1={TX + 60} y1={1050 + swingUp * 60} x2={TX + 120} y2={1140} />
                    </g>
                  )}
                  <Tag
                    x={TX + (f >= T.now ? interpolate(nextK, [0, 1], [0, -1100]) : 0)}
                    y={TY + (snap ? interpolate(swingUp, [0, 1], [14, -10]) : 14)}
                    r={snap ? Math.sin((f - T.old) / 5) * 8 * (1 - swingUp * 0.6) : 4}
                    old={1}
                    glow={interpolate(f, [T.n999 - 2, T.n999 + 6, T.cover - 6, T.cover], [0, 1, 1, 0], clamp)}
                    cover={interpolate(f, [T.cover + 2, T.cover + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) })}
                  />
                  {f >= T.steal && f < T.cover + 4 && (
                    <g transform={`translate(${TX + 40} ${TY + 210}) rotate(-10) scale(${interpolate(f - T.steal, [0, 5, 8], [2.2, 0.9, 1], clamp)})`}>
                      <rect x={-170} y={-50} width={340} height={96} rx={10} fill="none" stroke={RED} strokeWidth={9} />
                      <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={74} fill={RED}>
                        "STEAL!"
                      </text>
                    </g>
                  )}
                  {f >= T.worth && f < T.now + 6 && (
                    <g transform={`translate(${TX} ${TY - 300}) scale(${pop(f, T.worth)}) rotate(${Math.sin(f / 8) * 2})`}>
                      <rect x={-210} y={-56} width={420} height={104} rx={14} fill={GOLD} {...K} strokeWidth={6} />
                      <text y={20} textAnchor="middle" fontFamily={FONT.comic} fontSize={62} fill={INK}>
                        WORTH ₹999?
                      </text>
                    </g>
                  )}
                  {/* the next tag swings in = frame 0 */}
                  {f >= T.now - 4 && <Tag x={TX + interpolate(nextK, [0, 1], [700, 0])} y={TY} r={interpolate(nextK, [0, 1], [-14, 0])} old={1} />}
                </>
              )}
            </g>
          )}

          {/* ACT 2a: the wheel */}
          {wheelK > 0.01 && (
            <g opacity={wheelK}>
              <Helm x={wheelX} y={wheelY} s={wheelS * pop(f, T.researchers - 2)} rot={rot} hi={hiSeg} />
              {f >= T.ten && f < T.then + 4 && (
                <g transform={`translate(560 1210) scale(${pop(f, T.ten)})`}>
                  <rect x={-90} y={-56} width={180} height={104} rx={14} fill={GOLD} {...K} strokeWidth={6} />
                  <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={86} fill={INK}>
                    10
                  </text>
                </g>
              )}
              {f >= T.sixty && f < T.then + 4 && (
                <g transform={`translate(840 1210) scale(${pop(f, T.sixty)})`}>
                  <text x={-140} y={20} textAnchor="middle" fontFamily={FONT.comic} fontSize={50} fill={CREAM} stroke={INK} strokeWidth={5} paintOrder="stroke">
                    OR
                  </text>
                  <rect x={-90} y={-56} width={180} height={104} rx={14} fill={GOLD} {...K} strokeWidth={6} />
                  <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={86} fill={INK}>
                    65
                  </text>
                </g>
              )}
              {/* the question: globe with ? */}
              {f >= T.then && (
                <g transform={`translate(620 900) scale(${pop(f, T.then + 2)})`}>
                  <circle r={150} fill="#4f86c6" {...K} strokeWidth={7} />
                  <path d="M -40 -120 Q 30 -110 50 -60 Q 70 -10 30 40 Q 10 90 -10 130 Q -40 80 -50 30 Q -90 -10 -70 -60 Q -70 -100 -40 -120 Z" fill="#8cc084" stroke={INK} strokeWidth={4} />
                  <ellipse rx={150} ry={50} fill="none" stroke={INK} strokeWidth={3} opacity={0.4} />
                  <g transform={`translate(130 -120) rotate(${Math.sin(f / 6) * 8})`}>
                    <circle r={56} fill={CREAM} {...K} strokeWidth={6} />
                    <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill={RED}>
                      ?
                    </text>
                  </g>
                  <text x={-20} y={225} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={CREAM} stroke={INK} strokeWidth={6} paintOrder="stroke" opacity={interpolate(f, [T.share, T.share + 6], [0, 1], clamp)}>
                    % OF UN COUNTRIES IN AFRICA?
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ACT 2b: the gauges */}
          {gaugeK > 0.01 && (
            <g opacity={gaugeK}>
              <Gauge f={f} x={480} anchorV={10} guess={gA} label="SAW 10" k={1} tug={tug} />
              <Gauge f={f} x={780} anchorV={65} guess={gB} label="SAW 65" k={gBk} tug={tug} />
              {f >= T.n45 + 6 && (
                <g transform={`translate(640 ${gy(100) - 70}) scale(${pop(f, T.n45 + 6)}) rotate(-3)`}>
                  <rect x={-150} y={-46} width={300} height={88} rx={12} fill={GOLD} {...K} strokeWidth={6} />
                  <text y={22} textAnchor="middle" fontFamily={FONT.comic} fontSize={62} fill={INK}>
                    +20 POINTS
                  </text>
                </g>
              )}
              <Burst x={840} y={gy(45)} at={T.n45} f={f} size={240} color={GOLD} />
            </g>
          )}

          {/* SPARK on the dock (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: SX, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = addPose(addPose(q, hop(t, T.n45, 30)), hop(t, T.old, 34));
              q = addPose(addPose(q, shake(t, T.steal)), nod(t, T.worth));
              return q;
            }}
          />
          <PowerUp kind="beam" f={f} at={0} x={SX} y={GROUND} h={185 * SS} tx={TX} ty={TY - 20} layer="front" />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 80, top: 236, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: NAVY, letterSpacing: 2, opacity: 0.85 }}>HIDDEN MECHANISM #17</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 430, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 124, color: "#8a8a8a", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 1, textDecoration: "line-through", textDecorationColor: RED, textDecorationThickness: 14 }}>₹2,999</div>
              <div style={{ display: "inline-block", marginTop: 12, background: RED, color: "#fff", padding: "4px 30px", fontFamily: FONT.comic, fontSize: 108, border: `6px solid ${INK}` }}>₹999 = STEAL?</div>
            </div>
          )}
          <Slam f={f} at={T.researchers} out={T.then - 4} x={540} y={420} size={104} color={CREAM} stroke={`9px ${INK}`} rotate={-2}>
            THE WHEEL TEST
          </Slam>
          <Slam f={f} at={T.then} out={T.spin10 - 4} x={540} y={420} size={96} color={GOLD} stroke={`9px ${INK}`} rotate={2}>
            THEN: GUESS THIS
          </Slam>
          <Slam f={f} at={T.spin10} out={T.spin65 - 4} x={540} y={420} size={104} color={CREAM} stroke={`9px ${INK}`} rotate={-2}>
            SAW 10 → 25%
          </Slam>
          <Slam f={f} at={T.spin65} out={T.random - 4} x={540} y={420} size={112} color={GOLD} stroke={`10px ${INK}`} rotate={2}>
            SAW 65 → 45%
          </Slam>
          <Slam f={f} at={T.random} out={T.next - 4} x={540} y={420} size={110} color={RED} stroke={`10px ${CREAM}`} rotate={-3}>
            RANDOM. STILL STUCK.
          </Slam>
          <Slam f={f} at={T.next} out={T.cover - 4} x={540} y={420} size={104} color={CREAM} stroke={`9px ${INK}`} rotate={2}>
            THE ANCHOR = ₹2,999
          </Slam>
          <Slam f={f} at={T.cover} out={T.now - 4} x={540} y={420} size={100} color={GOLD} stroke={`9px ${INK}`} rotate={-2}>
            COVER THE OLD PRICE
          </Slam>
          {f >= T.researchers - 4 && f < LOOP - 6 && (
            <div style={{ position: "absolute", left: 540, top: 1735, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: CREAM, whiteSpace: "nowrap" }}>
              Tversky & Kahneman 1974 (Science) · median guesses · prices illustrative
            </div>
          )}
          <div style={{ position: "absolute", left: 540, top: 1780, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 800, fontSize: 24, color: GOLD, whiteSpace: "nowrap", letterSpacing: 1 }}>
            Education, not financial advice
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["crossedout", "twentynine", "ninetynine", "decides", "wheel", "ten", "sixtyfive", "african", "twentyfive", "fortyfive", "random", "dragged", "nine", "steal", "cover", "worth"]}
          />
        </>
      }
    />
  );
};
