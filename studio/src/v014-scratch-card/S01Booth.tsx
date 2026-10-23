import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V014 · Why payment apps give you scratch cards. Mechanism Reveal in an emerald "SCRATCH & WIN" carnival
// booth (gold marquee bulbs, red/white awning, wooden floor). Spark LEFT. A giant silver scratch card is
// scratched by a coin → BETTER LUCK NEXT TIME. Mini cards PAID / EMPTY, a "?" card. WOW: wipe to a 1950s
// pigeon lab box; the pigeon pecks for random seeds and keeps pecking after the hopper runs dry.
// PECK = PULL = PAY. NOT A BUG stamp, the rules slip, a fishhook carrying a MAYBE? card (aha), checklist,
// next card (loop). Sources: Paytm help page; ORF 2019; Ferster & Skinner 1957 via OpenStax/Lumen.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SGY = GROUND - 92.5 * SS;
const GREEN = "#0f6b4f";
const GREEN2 = "#0b5440";
const GOLD = "#ffc83d";
const FOIL = "#b9c2cc";
const RED = "#e5322d";
const PINK = "#ff5d8f";
const CREAM = "#fff7e0";

// --- anchors ----------------------------------------------------------------------------------------
const T = {
  paid: W(0, 1),
  rupees: W(0, 4),
  card: W(0, 7),
  better: C(1),
  luck: W(1, 1),
  time: W(1, 3),
  why: W(2, 1),
  scratch: W(2, 4),
  next: W(2, 6),
  some: C(3),
  pay: W(3, 2),
  empty: W(3, 5),
  never: W(4, 2),
  which: W(4, 4),
  fifties: W(5, 2),
  psych: W(5, 4),
  pigeons: W(5, 8),
  random: C(6),
  pecking: W(6, 4),
  longest: W(6, 6),
  even: C(7),
  food: W(7, 3),
  stopped: W(7, 4),
  same: C(8),
  slot: W(8, 4),
  busy: W(8, 6),
  emptyCard: W(9, 1),
  glitch: W(9, 5),
  rules: W(10, 1),
  notEvery: W(10, 4),
  wins: W(10, 7),
  maybe: W(11, 1),
  hook: W(11, 4),
  pick: W(12, 1),
  payment: W(12, 6),
  notScratch: W(12, 9),
  now: C(13),
  nextCard: W(13, 3),
};
const LOOP = VOICE_FRAMES - 20;

// --- background: emerald carnival booth ---------------------------------------------------------------
const Booth: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="v14wall" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0%" stopColor="#14876a" />
          <stop offset="100%" stopColor={GREEN2} />
        </radialGradient>
        <pattern id="v14boards" width="180" height="60" patternUnits="userSpaceOnUse">
          <rect width="180" height="60" fill="#c98a4b" />
          <line x1="0" y1="58" x2="180" y2="58" stroke="#9c6533" strokeWidth="4" />
          <line x1="90" y1="0" x2="90" y2="58" stroke="#9c6533" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#v14wall)" />
      {/* diamond wallpaper */}
      {Array.from({ length: 48 }, (_, i) => {
        const x = 60 + (i % 8) * 140 + (Math.floor(i / 8) % 2) * 70;
        const y = 300 + Math.floor(i / 8) * 160;
        return y < GROUND - 40 ? <path key={i} d={`M ${x} ${y - 18} L ${x + 12} ${y} L ${x} ${y + 18} L ${x - 12} ${y} Z`} fill="#1a9b7a" opacity={0.45} /> : null;
      })}
      {/* awning */}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M ${i * 120} 0 L ${i * 120 + 120} 0 L ${i * 120 + 120} 150 Q ${i * 120 + 60} 200 ${i * 120} 150 Z`} fill={i % 2 ? "#fff" : RED} stroke={COL.ink} strokeWidth={5} />
      ))}
      {/* marquee bulbs */}
      {Array.from({ length: 13 }, (_, i) => {
        const on = (Math.floor(f / 6) + i) % 3 === 0;
        return <circle key={i} cx={40 + i * 83.3} cy={222} r={13} fill={on ? GOLD : "#8a6d1c"} stroke={COL.ink} strokeWidth={3} />;
      })}
      {/* floor */}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="url(#v14boards)" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={COL.ink} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// --- giant scratch card -------------------------------------------------------------------------------
const CW = 440;
const CH = 560;
const ZIG = (() => {
  // zigzag across the foil (card coordinates, centred)
  const pts: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const y = -CH / 2 + 70 + i * ((CH - 140) / 8);
    pts.push(`${i % 2 ? CW / 2 - 50 : -CW / 2 + 50} ${y}`);
  }
  return `M ${pts.join(" L ")}`;
})();
const ZIGLEN = 8 * Math.hypot(CW - 100, (CH - 140) / 8);

const ScratchCard: React.FC<{ id: string; x: number; y: number; k: number; r?: number; scratch: number; face: React.ReactNode; label?: string }> = ({ id, x, y, k, r = 0, scratch, face, label = "SCRATCH & WIN" }) =>
  k > 0.01 ? (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>
      <rect x={-CW / 2 + 12} y={-CH / 2 + 14} width={CW} height={CH} rx={34} fill={COL.ink} opacity={0.35} />
      <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={34} fill={CREAM} {...K} strokeWidth={8} />
      <rect x={-CW / 2 + 22} y={-CH / 2 + 22} width={CW - 44} height={CH - 44} rx={22} fill="none" stroke={GOLD} strokeWidth={6} strokeDasharray="18 12" />
      {face}
      <mask id={`v14m${id}`}>
        <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} fill="#fff" />
        <path d={ZIG} fill="none" stroke="#000" strokeWidth={170} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${ZIGLEN * scratch} ${ZIGLEN * 2}`} />
      </mask>
      {scratch < 0.999 && (
        <g mask={`url(#v14m${id})`}>
          <rect x={-CW / 2 + 30} y={-CH / 2 + 30} width={CW - 60} height={CH - 60} rx={20} fill={FOIL} stroke="#8d97a3" strokeWidth={4} />
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={-CW / 2 + 40 + i * 40} y1={-CH / 2 + 40} x2={-CW / 2 + 10 + i * 40} y2={CH / 2 - 40} stroke="#d7dde3" strokeWidth={8} opacity={0.6} />
          ))}
          <text y={20} textAnchor="middle" fontFamily={FONT.comic} fontSize={58} fill="#6c7682">
            {label}
          </text>
        </g>
      )}
    </g>
  ) : null;

const LoseFace: React.FC = () => (
  <g>
    <text y={-120} textAnchor="middle" fontFamily={FONT.comic} fontSize={150} fill={RED} stroke={COL.ink} strokeWidth={4}>
      ₹0
    </text>
    <circle cy={10} r={56} fill={GOLD} {...K} strokeWidth={5} />
    <circle cx={-18} cy={0} r={6} fill={COL.ink} />
    <circle cx={18} cy={0} r={6} fill={COL.ink} />
    <path d="M -22 36 Q 0 20 22 36" fill="none" {...K} strokeWidth={5} />
    <text y={140} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={COL.ink}>
      BETTER LUCK
    </text>
    <text y={196} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill={COL.ink}>
      NEXT TIME
    </text>
  </g>
);

const QFace: React.FC<{ f: number }> = ({ f }) => (
  <text y={70} textAnchor="middle" fontFamily={FONT.comic} fontSize={260} fill={PINK} stroke={COL.ink} strokeWidth={6} transform={`rotate(${Math.sin(f / 5) * 6})`}>
    ?
  </text>
);

const MaybeFace: React.FC = () => (
  <text y={40} textAnchor="middle" fontFamily={FONT.comic} fontSize={130} fill={PINK} stroke={COL.ink} strokeWidth={5}>
    MAYBE?
  </text>
);

const MiniCard: React.FC<{ x: number; y: number; k: number; flip: number; win: boolean }> = ({ x, y, k, flip, win: w }) => {
  if (k < 0.01) return null;
  const sx = Math.abs(Math.cos(flip * Math.PI));
  const shown = flip > 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${k * Math.max(0.04, sx)} ${k})`}>
      <rect x={-80} y={-110} width={160} height={220} rx={18} fill={shown ? (w ? GOLD : "#d9dde2") : FOIL} {...K} strokeWidth={6} />
      {shown ? (
        <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={w ? 50 : 44} fill={COL.ink}>
          {w ? "PAID" : "EMPTY"}
        </text>
      ) : (
        <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#6c7682">
          ???
        </text>
      )}
    </g>
  );
};

// pigeon (faces left toward the key)
const Pigeon: React.FC<{ x: number; y: number; peck: number }> = ({ x, y, peck }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={-12} y1={0} x2={-18} y2={34} stroke="#e8743b" strokeWidth={6} />
    <line x1={14} y1={0} x2={18} y2={34} stroke="#e8743b" strokeWidth={6} />
    <ellipse cx={10} cy={-30} rx={70} ry={46} fill="#9aa5b8" {...K} strokeWidth={5} />
    <path d="M 40 -50 Q 110 -40 96 0 Q 70 -10 40 -20 Z" fill="#7d889c" {...K} strokeWidth={4} />
    <g transform={`rotate(${-peck * 38} -30 -50)`}>
      <circle cx={-52} cy={-78} r={30} fill="#7a8aa6" {...K} strokeWidth={5} />
      <path d="M -40 -62 Q -30 -40 -44 -30" fill="none" stroke="#5fb38a" strokeWidth={8} />
      <circle cx={-60} cy={-84} r={6} fill={COL.ink} />
      <path d="M -80 -80 L -102 -72 L -80 -66 Z" fill="#e8743b" stroke={COL.ink} strokeWidth={3} />
    </g>
  </g>
);

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.35],
  [T.paid, "ding", 0.4],
  [T.card - 4, "whoosh", 0.4],
  [T.card + 6, "scribble", 0.5],
  [T.time, "thud", 0.6],
  [T.why, "pop", 0.4],
  [T.pay, "kaching", 0.4],
  [T.empty, "boing", 0.45],
  [T.never, "swish", 0.35],
  [T.which, "swish", 0.35],
  [T.fifties - 8, "whoosh_long", 0.45],
  [T.pigeons, "page", 0.4],
  ...Array.from({ length: 8 }, (_, i): SfxCue => [T.random + 6 + i * 9, "tick", 0.25]),
  [T.stopped, "freeze", 0.45],
  [T.even + 40, "tick", 0.25],
  [T.slot, "clink", 0.4],
  [T.busy, "kaching", 0.4],
  [T.glitch, "stamp", 0.65],
  [T.rules, "page", 0.45],
  [T.maybe - 10, "riser", 0.4],
  [T.hook, "impact", 0.75],
  [T.payment, "ding", 0.45],
  [T.notScratch, "buzz", 0.35],
  [T.nextCard, "swish", 0.35],
  [LOOP, "swirl", 0.35],
];

const CX = 610; // card centre x
const CY = 930; // card centre y

export const S01Booth: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // phone → card
  const phoneK = Math.max(win(f, 0, T.card + 4, 6), win(f, T.pick - 2, T.now + 6, 6));
  const cardFly = interpolate(f, [T.card - 6, T.card + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const scratch1 = interpolate(f, [T.card + 6, T.time - 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const card1K = f < T.why ? cardFly : interpolate(f, [T.why - 4, T.why + 4], [1, 0], clamp);
  // coin following the zigzag
  const zigPt = (t: number) => {
    const seg = Math.min(7.999, t * 8);
    const i = Math.floor(seg);
    const u = seg - i;
    const y0 = -CH / 2 + 70 + i * ((CH - 140) / 8);
    const y1 = y0 + (CH - 140) / 8;
    const x0 = i % 2 ? CW / 2 - 50 : -CW / 2 + 50;
    const x1 = -x0;
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
  };
  const coinOn = f >= T.card + 6 && f < T.time + 6;
  const [zx, zy] = zigPt(scratch1);

  // card 2 (why scratch again?)
  const card2K = win(f, T.why, T.some, 5) * pop(f, T.why);
  // mini cards
  const miniK = win(f, T.some, T.fifties - 6, 6);
  const MINI = [
    { x: 330, w: true, at: T.pay - 4 },
    { x: 510, w: false, at: T.empty - 6 },
    { x: 690, w: true, at: T.pay + 2 },
    { x: 870, w: false, at: T.empty },
  ];
  const shuffle = interpolate(f, [T.never - 4, T.which + 10], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const qK = f >= T.which ? pop(f, T.which) * win(f, T.which, T.fifties - 6, 6) : 0;

  // lab
  const labK = win(f, T.fifties - 6, T.emptyCard - 2, 8);
  const labIn = interpolate(f, [T.fifties - 8, T.fifties + 6], [-1200, 0], { ...clamp, easing: Easing.out(Easing.back(1.1)) });
  const peckOn = f >= T.random && f < T.same;
  const peck = peckOn ? Math.max(0, Math.sin(((f - T.random) / 9) * Math.PI * 2)) : 0;
  const pecks = peckOn ? Math.floor((f - T.random) / 9) + 1 : f >= T.same ? Math.floor((T.same - T.random) / 9) : 0;
  const SEEDS = [T.random + 10, T.random + 34, T.random + 47, T.random + 76]; // irregular = "random"
  const hopperEmpty = f >= T.stopped - 2;
  const eqK = win(f, T.same - 2, T.emptyCard - 2, 6);

  // NOT A BUG card + rules + hook
  const card3K = win(f, T.emptyCard - 2, T.maybe - 6, 6) * pop(f, T.emptyCard - 2);
  const rulesK = win(f, T.rules - 2, T.maybe - 6, 6);
  const rulesU = interpolate(f, [T.rules - 2, T.rules + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const hookK = win(f, T.maybe - 6, T.pick, 6);
  const hookY = interpolate(f, [T.maybe - 6, T.hook], [-500, 0], { ...clamp, easing: Easing.out(Easing.back(1.3)) }) + Math.sin(f / 9) * 10;
  // next card (loop)
  const nextK = interpolate(f, [T.now, T.now + 6], [0, 1], clamp) * interpolate(f, [LOOP + 6, LOOP + 14], [1, 0], clamp);
  const nextX = interpolate(f, [T.now, T.now + 12], [1300, CX], { ...clamp, easing: Easing.out(Easing.cubic) });

  // YOU (orange) only for the hook + payoff
  const youK = Math.max(win(f, 0, T.card + 4, 6), win(f, T.pick - 2, T.now, 6));

  const sparkKeys = gestureKeys([
    [0, G.present],
    [T.rupees, G.pointSide, "snap"],
    [T.luck, G.facepalm, "snap"],
    [T.why, G.pointUp, "snap"],
    [T.pay, G.count1, "snap"],
    [T.empty, G.count2, "snap"],
    [T.never, G.shrugBig, "snap"],
    [T.fifties, G.pointSide, "snap"],
    [T.pigeons, G.whisper, "snap"],
    [T.random, G.leanIn, "snap"],
    [T.stopped, G.mindBlown, "snap"],
    [T.slot, G.doublePoint, "snap"],
    [T.emptyCard, G.handsHips, "snap"],
    [T.rules, G.pointDown, "snap"],
    [T.maybe, G.thinkChin, "snap"],
    [T.hook, G.celebrate, "snap"],
    [T.pick, G.presentBoth, "snap"],
    [T.notScratch, G.stop, "snap"],
    [T.now, G.beckon, "snap"],
    [LOOP + 4, G.present],
  ]);
  const sparkMood = (t: number): Mood =>
    t < T.better
      ? "smug"
      : t < T.why
        ? "sad"
        : t < T.some
          ? "curious"
          : t < T.never
            ? "thinking"
            : t < T.fifties
              ? "worried"
              : t < T.random
                ? "excited"
                : t < T.stopped
                  ? "curious"
                  : t < T.same
                    ? "mindblown"
                    : t < T.emptyCard
                      ? "skeptical"
                      : t < T.rules
                        ? "angry"
                        : t < T.maybe
                          ? "smug"
                          : t < T.pick
                            ? "happy"
                            : t < T.now
                              ? "determined"
                              : "wink";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.hook, 34), bulbPulse(t, T.stopped, 24) * 0.7);

  const z = punch(f, [T.time, T.stopped, T.glitch, T.hook], 0.035);
  const overlayK = Math.max(interpolate(f, [T.card - 6, T.card], [1, 0], clamp), interpolate(f, [LOOP + 2, LOOP + 10], [0, 1], clamp));

  // lab box geometry
  const BX = 360;
  const BY = 690;
  const BW = 520;
  const BH = GROUND - 30 - BY;

  return (
    <Stage
      bg={<Booth f={f} />}
      hits={[T.time, T.glitch, T.hook]}
      power={9}
      cam={{ z }}
      svg={
        <>
          {/* phone (hook + payoff) */}
          {phoneK > 0.01 && (
            <g opacity={phoneK} transform={`translate(${f < T.pick ? 800 : 640} ${f < T.pick ? 900 : 900}) scale(${0.9 + 0.1 * phoneK})`}>
              <rect x={-120} y={-220} width={240} height={440} rx={36} fill="#1b1b1b" {...K} />
              <rect x={-100} y={-190} width={200} height={380} rx={20} fill="#eafff6" />
              {f < T.pick ? (
                <>
                  <circle cy={-70} r={56} fill={f >= T.paid ? "#2fbf71" : "#cfd8d3"} {...K} strokeWidth={5} />
                  {f >= T.paid && <path d="M -24 -70 L -6 -50 L 28 -94" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />}
                  <text y={40} textAnchor="middle" fontFamily={FONT.comic} fontSize={58} fill={COL.ink}>
                    PAID
                  </text>
                  <text y={110} textAnchor="middle" fontFamily={FONT.comic} fontSize={70} fill={GREEN}>
                    ₹200
                  </text>
                </>
              ) : (
                <>
                  <text y={-110} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
                    PICK AN APP FOR
                  </text>
                  <g transform={`translate(0 -20) scale(${pop(f, T.payment - 2)})`}>
                    <rect x={-86} y={-36} width={172} height={72} rx={14} fill="#2fbf71" {...K} strokeWidth={4} />
                    <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#fff">
                      ✓ PAYMENT
                    </text>
                  </g>
                  <g transform={`translate(0 80) scale(${pop(f, T.notScratch - 2)})`}>
                    <rect x={-86} y={-36} width={172} height={72} rx={14} fill="#d9dde2" {...K} strokeWidth={4} />
                    <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill={RED}>
                      ✗ SCRATCH
                    </text>
                  </g>
                </>
              )}
            </g>
          )}

          {/* YOU */}
          {youK > 0.01 && (
            <g opacity={youK}>
              <Actor
                f={f}
                color={COL.orange}
                scale={1.45}
                label="YOU"
                face={f >= T.pick ? "happy" : "eyes"}
                base={{ x: 960, y: GROUND - 92.5 * 1.45 }}
                facing={-1}
                keys={[
                  { f: 0, p: { ...G.pointSide, ra1: 70 } },
                  { f: T.paid, p: { ...G.pointSide, ra1: 70 } },
                  { f: T.paid + 4, p: { ...G.pointSide, ra1: 95 } },
                  { f: T.pick - 2, p: G.rest },
                  { f: T.pick + 4, p: G.fistPump },
                ]}
                mod={(t, p) => addPose(p, idle(t, 2))}
              />
            </g>
          )}

          {/* card 1: the hook card being scratched */}
          <ScratchCard
            id="a"
            x={interpolate(cardFly, [0, 1], [860, CX])}
            y={interpolate(cardFly, [0, 1], [900, CY])}
            k={card1K}
            r={interpolate(cardFly, [0, 1], [-30, -3])}
            scratch={scratch1}
            face={<LoseFace />}
          />
          {coinOn && (
            <g transform={`translate(${CX + zx} ${CY + zy}) rotate(${f * 18})`}>
              <circle r={44} fill={GOLD} {...K} />
              <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={42} fill={COL.ink}>
                ₹
              </text>
            </g>
          )}
          {f >= T.time && f < T.time + 16 && <Burst x={CX} y={CY} at={T.time} f={f} size={320} color={RED} />}

          {/* card 2: why scratch again */}
          <ScratchCard id="b" x={CX} y={CY} k={card2K} r={3} scratch={0} face={<QFace f={f} />} />

          {/* mini cards: PAID / EMPTY, then shuffle */}
          {miniK > 0.01 && (
            <g opacity={miniK}>
              {MINI.map((m, i) => {
                const ang = shuffle * Math.PI * 2 + (i * Math.PI) / 2;
                const sx = interpolate(shuffle, [0, 0.15, 0.85, 1], [m.x, CX, CX, CX]) + Math.cos(ang) * 260 * Math.sin(shuffle * Math.PI);
                const sy = 860 + Math.sin(ang) * 120 * Math.sin(shuffle * Math.PI);
                const flipped = interpolate(f, [m.at, m.at + 8], [0, 1], clamp) * (1 - interpolate(f, [T.never - 4, T.never + 4], [0, 1], clamp));
                return <MiniCard key={i} x={sx} y={sy} k={pop(f, T.some + i * 3) * (1 - qK * 0.0)} flip={flipped} win={m.w} />;
              })}
            </g>
          )}
          {qK > 0.01 && <ScratchCard id="q" x={CX} y={CY} k={qK} r={-2} scratch={0} face={<QFace f={f} />} label="NEXT ONE?" />}

          {/* 1950s pigeon lab */}
          {labK > 0.01 && (
            <g opacity={labK} transform={`translate(${labIn} 0)`}>
              <rect x={BX} y={BY} width={BW} height={BH} rx={16} fill="#f3ead2" {...K} strokeWidth={8} />
              <rect x={BX + 16} y={BY + 16} width={BW - 32} height={BH - 32} rx={10} fill="#e7f4ff" opacity={0.55} />
              <line x1={BX + 60} y1={BY + 30} x2={BX + 120} y2={BY + BH - 40} stroke="#fff" strokeWidth={10} opacity={0.6} />
              {/* key on the left wall */}
              <circle cx={BX + 40} cy={BY + 250} r={26} fill={f >= T.random && peck > 0.8 ? GOLD : "#e08e2b"} {...K} strokeWidth={5} />
              <text x={BX + 40} y={BY + 205} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>
                KEY
              </text>
              {/* hopper */}
              <rect x={BX + 20} y={BY + BH - 120} width={90} height={60} rx={8} fill={hopperEmpty ? "#c9cdd6" : "#ffd27a"} {...K} strokeWidth={5} />
              <text x={BX + 65} y={BY + BH - 140} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={28} fill={hopperEmpty ? RED : COL.ink}>
                {hopperEmpty ? "EMPTY" : "FOOD"}
              </text>
              {/* falling seeds */}
              {SEEDS.map((s, i) =>
                f >= s && f < s + 14 && s < T.stopped ? (
                  <circle key={i} cx={BX + 55 + (i % 3) * 12} cy={interpolate(f, [s, s + 12], [BY + BH - 150, BY + BH - 90], clamp)} r={9} fill="#a8641f" {...K} strokeWidth={3} />
                ) : null,
              )}
              <g transform={`translate(${BX + 270} ${BY + BH - 40}) scale(1.45)`}><Pigeon x={0} y={0} peck={peck} /></g>
              {/* peck counter */}
              {f >= T.random && (
                <g transform={`translate(${BX + BW - 110} ${BY + 70})`}>
                  <rect x={-90} y={-40} width={180} height={80} rx={12} fill={COL.ink} />
                  <text y={-8} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={24} fill={GOLD}>
                    PECKS
                  </text>
                  <text y={28} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill="#fff">
                    {String(pecks).padStart(3, "0")}
                  </text>
                </g>
              )}
              {/* equation strip over the lab: PECK = PULL = PAY */}
              {eqK > 0.01 && (
                <g opacity={eqK}>
                  <rect x={BX - 20} y={BY + 80} width={BW + 40} height={170} rx={20} fill={CREAM} {...K} strokeWidth={6} />
                  {/* peck key */}
                  <g transform={`translate(${BX + 70} ${BY + 165}) scale(${pop(f, T.same)})`}>
                    <circle r={40} fill="#e08e2b" {...K} strokeWidth={5} />
                    <text y={70} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>PECK</text>
                  </g>
                  <text x={BX + 160} y={BY + 185} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink}>=</text>
                  {/* lever */}
                  <g transform={`translate(${BX + 250} ${BY + 165}) scale(${pop(f, T.slot)})`}>
                    <line x1={0} y1={30} x2={0} y2={-40} stroke={COL.ink} strokeWidth={10} strokeLinecap="round" transform={`rotate(${f >= T.slot ? interpolate(f, [T.slot, T.slot + 8, T.slot + 18], [0, 40, 0], clamp) : 0} 0 30)`} />
                    <circle cy={-44} r={20} fill={RED} {...K} strokeWidth={5} transform={`rotate(${f >= T.slot ? interpolate(f, [T.slot, T.slot + 8, T.slot + 18], [0, 40, 0], clamp) : 0} 0 30)`} />
                    <text y={70} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>PULL</text>
                  </g>
                  <text x={BX + 340} y={BY + 185} textAnchor="middle" fontFamily={FONT.comic} fontSize={64} fill={COL.ink}>=</text>
                  {/* pay button */}
                  <g transform={`translate(${BX + 440} ${BY + 165}) scale(${pop(f, T.busy - 4)})`}>
                    <rect x={-56} y={-34} width={112} height={68} rx={16} fill="#2fbf71" {...K} strokeWidth={5} />
                    <text y={13} textAnchor="middle" fontFamily={FONT.comic} fontSize={40} fill="#fff">PAY</text>
                    <text y={70} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={COL.ink}>TAP</text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* card 3: the empty card, NOT A BUG */}
          <ScratchCard id="c" x={CX} y={CY} k={card3K * (1 - rulesU * 0.25)} r={-4} scratch={1} face={<LoseFace />} />
          {/* rules slip */}
          {rulesK > 0.01 && (
            <g opacity={rulesK} transform={`translate(${CX} 1080)`}>
              <rect x={-330} y={-30} width={660} height={30 + 190 * rulesU} rx={12} fill="#fff" {...K} strokeWidth={6} />
              {rulesU > 0.6 && (
                <>
                  <text y={30} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={30} fill="#6b6b6b">
                    REWARDS · TERMS (a payment app's help page)
                  </text>
                  <rect x={-300} y={56} width={600} height={58} rx={8} fill={f >= T.notEvery ? "#fff3a3" : "#fff"} />
                  <text y={96} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={COL.ink}>
                    “Not all scratch cards guarantee a reward.”
                  </text>
                </>
              )}
            </g>
          )}

          {/* fishhook carrying a MAYBE? card */}
          {hookK > 0.01 && (
            <g opacity={hookK} transform={`translate(0 ${hookY})`}>
              <line x1={CX} y1={-200} x2={CX} y2={600} stroke={COL.ink} strokeWidth={5} />
              <path d={`M ${CX} 600 L ${CX} 660 Q ${CX} 720 ${CX - 50} 715 Q ${CX - 90} 705 ${CX - 80} 670`} fill="none" stroke="#7b8794" strokeWidth={14} strokeLinecap="round" />
              <path d={`M ${CX - 80} 670 L ${CX - 98} 690 L ${CX - 68} 690 Z`} fill="#7b8794" />
              <ScratchCard id="m" x={CX} y={990} k={0.82} r={Math.sin(f / 11) * 4} scratch={1} face={<MaybeFace />} />
            </g>
          )}
          {f >= T.hook && f < T.hook + 16 && <Burst x={CX} y={990} at={T.hook} f={f} size={340} color={GOLD} />}

          {/* next card (loop) */}
          <g opacity={nextK}><ScratchCard id="n" x={nextX} y={CY} k={0.9} r={-3} scratch={0} face={<LoseFace />} /></g>
          {f >= T.now + 10 && f < LOOP + 10 && (
            <g transform={`translate(${CX - 170 + Math.sin(f / 5) * 14} ${CY - 220})`}>
              <circle r={44} fill={GOLD} {...K} />
              <text y={14} textAnchor="middle" fontFamily={FONT.comic} fontSize={42} fill={COL.ink}>
                ₹
              </text>
            </g>
          )}

          {/* SPARK (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 165, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={sparkMood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 3));
              q = addPose(addPose(q, hop(t, T.fifties, 36)), hop(t, T.hook, 46));
              q = addPose(addPose(q, shake(t, T.luck)), nod(t, T.pick));
              return q;
            }}
          />
        </>
      }
      html={
        <>
          {/* hook overlay (frame 1 + loop) */}
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 560, top: 430, transform: "translate(-50%,-50%) rotate(-3deg)", opacity: overlayK, textAlign: "center" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 190, color: RED, WebkitTextStroke: `12px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 0.95 }}>₹0.</div>
              <div style={{ background: COL.ink, color: "#fff", borderRadius: 18, padding: "6px 30px", fontFamily: FONT.comic, fontSize: 82, letterSpacing: 3, whiteSpace: "nowrap" }}>
                BETTER LUCK <span style={{ color: GOLD }}>NEXT TIME.</span>
              </div>
            </div>
          )}
          <Slam f={f} at={T.time} out={T.why - 4} x={560} y={440} size={120} color={GOLD} stroke={`10px ${COL.ink}`} rotate={-3}>
            ...AGAIN.
          </Slam>
          <Slam f={f} at={T.why} out={T.some - 4} x={560} y={440} size={112} color="#fff" stroke={`10px ${COL.ink}`} rotate={2}>
            WHY SCRATCH AGAIN?
          </Slam>
          <Slam f={f} at={T.some} out={T.never - 4} x={560} y={440} size={104} color={GOLD} stroke={`10px ${COL.ink}`} rotate={-2}>
            SOME PAY. SOME DON'T.
          </Slam>
          <Slam f={f} at={T.never} out={T.fifties - 8} x={560} y={440} size={116} color={PINK} stroke={`10px ${COL.ink}`} rotate={2}>
            WHICH ONE NEXT?
          </Slam>
          <Slam f={f} at={T.fifties} out={T.random - 4} x={600} y={430} size={100} color="#fff" stroke={`9px ${COL.ink}`} rotate={-2}>
            1950s · PIGEON LAB
          </Slam>
          <Slam f={f} at={T.random} out={T.even - 4} x={600} y={430} size={110} color={GOLD} stroke={`10px ${COL.ink}`} rotate={2}>
            RANDOM REWARDS
          </Slam>
          <Slam f={f} at={T.stopped} out={T.same - 4} x={600} y={430} size={112} color={RED} stroke={`10px #fff`} rotate={-3}>
            STILL PECKING
          </Slam>
          <Slam f={f} at={T.same} out={T.emptyCard - 4} x={600} y={430} size={110} color="#fff" stroke={`10px ${COL.ink}`} rotate={2}>
            SAME PULL
          </Slam>
          {f >= T.glitch && f < T.rules && <Stamp f={f} at={T.glitch} x={CX} y={CY - 40} text="NOT A BUG" size={120} color={RED} r={-10} />}
          <Slam f={f} at={T.emptyCard} out={T.rules - 4} x={600} y={430} size={110} color={GOLD} stroke={`10px ${COL.ink}`} rotate={-2}>
            BY DESIGN
          </Slam>
          <Slam f={f} at={T.rules} out={T.maybe - 4} x={600} y={430} size={104} color="#fff" stroke={`10px ${COL.ink}`} rotate={2}>
            IT'S IN THE RULES
          </Slam>
          <Slam f={f} at={T.hook} out={T.pick - 4} x={600} y={430} size={140} color={PINK} stroke={`12px ${COL.ink}`} rotate={-4}>
            THE "MAYBE" = THE HOOK
          </Slam>
          <Slam f={f} at={T.pick} out={T.now - 4} x={560} y={430} size={100} color={GOLD} stroke={`10px ${COL.ink}`} rotate={-2}>
            PAY FOR THE THING
          </Slam>
          <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: "#eafff6", whiteSpace: "nowrap", background: "rgba(0,0,0,0.35)", borderRadius: 10, padding: "3px 14px" }}>
            Sources: Paytm help page · ORF 2019 · Ferster &amp; Skinner 1957 · ₹200 illustrative
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["rupees", "scratch", "better", "luck", "next", "pay", "empty", "never", "fifties", "pigeons", "random", "longest", "stopped", "slot", "glitch", "rules", "every", "maybe", "hook", "payment", "card"]}
          />
        </>
      }
    />
  );
};
