import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage, Stamp } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { POWER_PEAK, PowerUp, powerHits } from "../shared/powerup";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V014 · Why payment apps give you scratch cards. Retention v2 cut (~27 s), power-up "impact" (H03 before it used dash).
// Emerald "SCRATCH & WIN" carnival booth. Frame 0: a half-scratched giant card + coin under "₹0. AGAIN."; the
// impact frame lands on the card as ₹0 is revealed, a second card → ₹0 again. Open loop: BAD LUCK? ✗ → blueprint
// "BY DESIGN". Mini cards PAID/EMPTY + "?" card. 1950s pigeon box (random seeds; keeps pecking after EMPTY).
// RE-HOOK: the card grows into a slot machine inside a phone, the lever pulls itself (impact echo). Rules slip
// "Not all scratch cards guarantee a reward." Checklist PAY FOR THE THING ✓ / THE SCRATCH ✗. "Now scratch…" → frame 0.
// Sources: Paytm help page; ORF 2019; Ferster & Skinner 1957 via OpenStax/Lumen.

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
const BLUE = "#1d4ed8";
const PEAK = POWER_PEAK.impact; // 12

const T = {
  every: W(0, 2),
  pay0: W(0, 6),
  win: W(0, 8),
  nothing: W(0, 10),
  why: W(0, 11),
  stop: W(0, 14),
  not: W(1, 1),
  luck: W(1, 3),
  design: W(1, 6),
  some: C(2),
  pay: W(2, 2),
  dont: W(2, 4),
  never: W(2, 6),
  which: W(2, 8),
  fifties: W(3, 2),
  pigeons: W(3, 3),
  random: W(3, 7),
  pecks: W(3, 8),
  rewards: W(4, 1),
  pecking: W(4, 4),
  longest: W(4, 6),
  slot: W(5, 2),
  machine: W(5, 3),
  payment: W(5, 6),
  app: W(5, 7),
  rules: W(6, 2),
  notEvery: W(6, 4),
  wins: W(6, 7),
  thing: W(7, 4),
  notS: W(7, 5),
  scratchS: W(7, 7),
  now: C(8),
  nowScratch: W(8, 1),
};
const LOOP = VOICE_FRAMES - 16;
const S0 = 0.55; // frame-0 scratch progress of card 1 (loop target)
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

// --- slot-machine cabinet that grows around the card (re-hook) ------------------------------------------
const REEL = ["₹0", "₹5", "₹0", "₹0", "₹50", "₹0", "₹1", "₹0"];
const Reel: React.FC<{ x: number; f: number; start: number; stop: number; land: string }> = ({ x, f, start, stop, land }) => {
  const spinning = f >= start && f < stop;
  const idx = spinning ? Math.floor((f - start) * 1.3) % REEL.length : -1;
  const txt = f < start ? "?" : spinning ? REEL[idx] : land;
  const y = spinning ? ((f * 37) % 40) - 20 : 0;
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-62} y={-80} width={124} height={160} rx={14} fill="#fff" {...K} strokeWidth={5} />
      <text y={22 + y} textAnchor="middle" fontFamily={FONT.comic} fontSize={txt.length > 2 ? 46 : 56} fill={txt === "?" ? PINK : txt === "₹0" ? RED : GREEN} opacity={spinning ? 0.7 : 1}>
        {txt}
      </text>
    </g>
  );
};

// --- sfx ----------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [0, "scribble", 0.45],
  [PEAK, "punch", 0.7],
  [T.win - 6, "whoosh", 0.4],
  [T.win, "scribble", 0.4],
  [T.nothing + 4, "thud", 0.55],
  [T.stop, "boing", 0.35],
  [T.luck, "buzz", 0.35],
  [T.design, "stamp", 0.6],
  [T.pay, "kaching", 0.4],
  [T.dont, "boing", 0.4],
  [T.never, "swish", 0.35],
  [T.which, "pop", 0.4],
  [T.fifties - 8, "whoosh_long", 0.45],
  ...[0, 13, 21, 40].map((d): SfxCue => [T.random + d, "tick", 0.3]),
  [T.longest, "freeze", 0.4],
  [T.slot - 14, "riser", 0.45],
  [T.slot, "impact", 0.8],
  [T.machine + 6, "clink", 0.35],
  [T.machine + 14, "clink", 0.35],
  [T.machine + 22, "kaching", 0.35],
  [T.rules, "page", 0.45],
  [T.thing, "ding", 0.45],
  [T.scratchS, "buzz", 0.35],
  [T.now, "whoosh", 0.4],
  [LOOP, "scribble", 0.35],
];

const CX = 620;
const CY = 900;

export const S01Booth: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();

  // card 1: frame 0 (half scratched) → ₹0 at the impact peak; again at the loop (scratching towards S0)
  const loopIn = interpolate(f, [T.now - 2, T.now + 10], [1400, CX], { ...clamp, easing: Easing.out(Easing.cubic) });
  const inLoop = f >= T.now - 2;
  const scratch1 = inLoop ? interpolate(f, [T.nowScratch - 4, LOOP + 16], [0, S0], clamp) : interpolate(f, [0, PEAK], [S0, 1], clamp);
  const card1K = inLoop ? 1 : interpolate(f, [T.win - 6, T.win], [1, 0], clamp);
  const card1X = inLoop ? loopIn : interpolate(f, [T.win - 6, T.win], [CX, CX - 900], { ...clamp, easing: Easing.in(Easing.cubic) });
  // card 2: slides in on "win", fast scratch → ₹0 on "nothing"
  const card2X = interpolate(f, [T.win - 6, T.win + 2], [1400, CX], { ...clamp, easing: Easing.out(Easing.cubic) });
  const scratch2 = interpolate(f, [T.win + 2, T.nothing + 2], [0, 1], clamp);
  const card2K = f < T.win - 6 ? 0 : win(f, T.win - 6, T.some, 6);
  const blue = interpolate(f, [T.design - 4, T.design + 4], [0, 1], clamp) * (f < T.some ? 1 : 0);
  // coin path (zigzag)
  const zig = (t: number) => {
    const seg = Math.min(7.999, t * 8);
    const i = Math.floor(seg);
    const u = seg - i;
    const y0 = -CH / 2 + 70 + i * ((CH - 140) / 8);
    const y1 = y0 + (CH - 140) / 8;
    const x0 = i % 2 ? CW / 2 - 50 : -CW / 2 + 50;
    return [x0 + (-x0 - x0) * u, y0 + (y1 - y0) * u];
  };
  const coin = (() => {
    if (f < PEAK + 2) return { k: 1, x: card1X, s: scratch1 };
    if (f >= T.win && f < T.nothing + 6) return { k: 1, x: card2X, s: scratch2 };
    if (inLoop && f >= T.nowScratch - 6) return { k: interpolate(f, [T.nowScratch - 6, T.nowScratch], [0, 1], clamp), x: card1X, s: scratch1 };
    return null;
  })();

  // mini cards
  const miniK = win(f, T.some, T.fifties - 6, 6);
  const MINI = [
    { x: 270, w: true, at: T.pay - 4 },
    { x: 480, w: false, at: T.dont - 4 },
    { x: 660, w: false, at: T.dont },
    { x: 870, w: true, at: T.pay + 2 },
  ];
  const shuffle = interpolate(f, [T.never - 2, T.which + 4], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const qK = f >= T.which ? pop(f, T.which) * win(f, T.which, T.fifties - 6, 6) : 0;

  // pigeon lab
  const labK = win(f, T.fifties - 6, T.slot - 10, 8);
  const labIn = interpolate(f, [T.fifties - 8, T.fifties + 6], [-1200, 0], { ...clamp, easing: Easing.out(Easing.back(1.1)) });
  const peckOn = f >= T.pigeons && f < T.slot - 10;
  const peck = peckOn ? Math.max(0, Math.sin(((f - T.pigeons) / 8) * Math.PI * 2)) : 0;
  const pecks = peckOn ? Math.floor((f - T.pigeons) / 8) + 1 : 0;
  const SEEDS = [T.random, T.random + 13, T.random + 21, T.random + 40];
  const empty = f >= T.pecking - 4;

  // slot machine (re-hook)
  const slotK = win(f, T.slot - 8, T.rules - 4, 6);
  const grow = interpolate(f, [T.slot - 8, T.slot], [0.4, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const lever = f < T.machine ? 0 : Math.sin(Math.min(1, (f - T.machine) / 10) * Math.PI);
  const phoneK = interpolate(f, [T.payment - 6, T.payment + 4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // rules slip
  const rulesK = win(f, T.rules - 4, T.thing - 8, 6);
  const rulesU = interpolate(f, [T.rules - 4, T.rules + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // checklist
  const listK = win(f, T.thing - 8, T.now + 2, 6);

  const overlayK = Math.max(interpolate(f, [T.stop, T.stop + 8], [1, 0], clamp), interpolate(f, [T.nowScratch, T.nowScratch + 8], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, G.leanIn],
    [PEAK - 3, { ...G.leanIn, lean: 4 }],
    [PEAK, G.recoil, "snap"],
    [T.every, G.pointSide, "snap"],
    [T.win, G.leanIn, "snap"],
    [T.nothing, G.facepalm, "snap"],
    [T.why, G.shrugBig, "snap"],
    [T.not, G.stop, "snap"],
    [T.design, G.pointUp, "snap"],
    [T.pay, G.count1, "snap"],
    [T.dont, G.count2, "snap"],
    [T.never, G.thinkChin, "snap"],
    [T.fifties, G.presentBoth, "snap"],
    [T.random, G.whisper, "snap"],
    [T.pecking, G.pointSide, "snap"],
    [T.longest, G.mindBlown, "snap"],
    [T.slot - 3, G.recoil, "snap"],
    [T.slot, G.doublePoint, "snap"],
    [T.payment, G.handsHips, "snap"],
    [T.rules, G.pointDown, "snap"],
    [T.wins, G.armsCrossed, "snap"],
    [T.thing, G.celebrate, "snap"],
    [T.notS, G.stop, "snap"],
    [T.now, G.beckon, "snap"],
    [LOOP, G.leanIn, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < PEAK ? "determined" : t < T.why ? "sad" : t < T.not ? "worried" : t < T.design ? "skeptical" : t < T.some ? "smug" : t < T.never ? "excited" : t < T.fifties ? "thinking" : t < T.random ? "curious" : t < T.longest ? "excited" : t < T.slot - 3 ? "mindblown" : t < T.payment ? "shock" : t < T.rules ? "angry" : t < T.thing ? "skeptical" : t < T.now ? "happy" : t < LOOP ? "wink" : "determined";
  const bulb = (t: number) => Math.max(bulbPulse(t, T.machine, 34), bulbPulse(t, T.thing, 26) * 0.8);
  const z = punch(f, [T.nothing + 4, T.design, T.longest, T.thing], 0.035);

  return (
    <Stage
      bg={<Booth f={f} />}
      hits={[...powerHits("impact", 0), T.nothing + 4, ...powerHits("impact", T.slot - PEAK)]}
      power={12}
      cam={{ z }}
      svg={
        <>
          <PowerUp kind="impact" f={f} at={0} x={200} y={GROUND} tx={CX} ty={CY} layer="back" />
          <PowerUp kind="impact" f={f} at={T.slot - PEAK} x={200} y={GROUND} tx={CX} ty={CY} layer="back" />
          {/* card 1 */}
          <ScratchCard id="a" x={card1X} y={CY} k={card1K} r={-3} scratch={scratch1} face={<LoseFace />} />
          {/* card 2 (+ blueprint overlay on "design") */}
          {card2K > 0.01 && (
            <g opacity={card2K}>
              <ScratchCard id="b" x={card2X} y={CY} k={1} r={3} scratch={scratch2} face={<LoseFace />} />
              {blue > 0.01 && (
                <g opacity={blue} transform={`translate(${card2X} ${CY}) rotate(3)`}>
                  <rect x={-CW / 2} y={-CH / 2} width={CW} height={CH} rx={34} fill={BLUE} opacity={0.82} />
                  {Array.from({ length: 11 }, (_, i) => (
                    <line key={`v${i}`} x1={-CW / 2 + i * 44} y1={-CH / 2} x2={-CW / 2 + i * 44} y2={CH / 2} stroke="#9cc3ff" strokeWidth={2} opacity={0.6} />
                  ))}
                  {Array.from({ length: 13 }, (_, i) => (
                    <line key={`h${i}`} x1={-CW / 2} y1={-CH / 2 + i * 44} x2={CW / 2} y2={-CH / 2 + i * 44} stroke="#9cc3ff" strokeWidth={2} opacity={0.6} />
                  ))}
                  <rect x={-CW / 2 + 30} y={-CH / 2 + 30} width={CW - 60} height={CH - 60} rx={20} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="20 12" />
                  <text y={-150} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill="#fff">
                    WIN: SOMETIMES
                  </text>
                  <text y={-90} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill="#fff">
                    WHEN: UNKNOWN
                  </text>
                  <path d="M -170 40 L 170 40 M -170 25 L -170 55 M 170 25 L 170 55" stroke="#fff" strokeWidth={4} />
                  <text y={110} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={GOLD}>
                    COME BACK: ALWAYS
                  </text>
                </g>
              )}
            </g>
          )}
          {/* coin */}
          {coin && (() => {
            const [zx, zy] = zig(coin.s);
            return (
              <g transform={`translate(${coin.x + zx} ${CY + zy}) rotate(${f * 18}) scale(${coin.k})`}>
                <circle r={46} fill={GOLD} {...K} strokeWidth={6} />
                <circle r={30} fill="none" stroke="#c8961a" strokeWidth={5} />
                <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.ink}>
                  ₹
                </text>
              </g>
            );
          })()}
          {f >= PEAK && f < PEAK + 16 && <Burst x={CX} y={CY - 150} at={PEAK} f={f} size={300} color={GOLD} />}

          {/* mini cards */}
          {miniK > 0.01 && (
            <g opacity={miniK}>
              {MINI.map((m, i) => {
                const tx = interpolate(shuffle, [0, 1], [m.x, [870, 270, 870, 270][i]]);
                const ty = 900 - Math.sin(shuffle * Math.PI) * (i % 2 ? 120 : -60);
                const k = 1.3 * pop(f, T.some + i * 3) * (1 - shuffle * 0.4);
                return <MiniCard key={i} x={tx} y={ty} k={k} flip={interpolate(f, [m.at, m.at + 8], [0, 1], clamp) * (1 - shuffle)} win={m.w} />;
              })}
              {qK > 0.01 && <ScratchCard id="q" x={570} y={CY} k={qK * 0.7} scratch={1} face={<QFace f={f} />} />}
            </g>
          )}

          {/* 1950s pigeon box */}
          {labK > 0.01 && (
            <g opacity={labK} transform={`translate(${labIn} 0)`}>
              <rect x={310} y={620} width={640} height={620} rx={18} fill="#efe3c8" {...K} strokeWidth={8} />
              <rect x={330} y={640} width={600} height={580} rx={10} fill="#e2d2ad" />
              {/* key */}
              <circle cx={420} cy={860} r={34} fill={empty && f % 16 < 8 ? "#fff3a0" : "#f6d55c"} {...K} strokeWidth={5} />
              {/* hopper */}
              <rect x={380} y={1020} width={130} height={80} rx={8} fill="#8b6b45" {...K} strokeWidth={5} />
              <text x={445} y={1072} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={26} fill="#fff">
                {empty ? "EMPTY" : "FOOD"}
              </text>
              {SEEDS.map((s, i) =>
                f >= s && !empty ? (
                  <ellipse key={i} cx={420 + (i % 2 ? 40 : 80)} cy={interpolate(f, [s, s + 8], [1020, 1090], clamp)} rx={10} ry={7} fill="#c9962f" stroke={COL.ink} strokeWidth={3} opacity={interpolate(f, [s + 10, s + 18], [1, 0], clamp)} />
                ) : null,
              )}
              <g transform="translate(680 1180) scale(1.5)"><Pigeon x={0} y={0} peck={peck} /></g>
              <text x={630} y={700} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.ink}>
                PECKS: {pecks}
              </text>
            </g>
          )}

          {/* slot machine (re-hook) */}
          {slotK > 0.01 && (
            <g opacity={slotK} transform={`translate(${CX} ${CY}) scale(${grow})`}>
              {phoneK > 0.01 && (
                <g opacity={phoneK} transform={`scale(${interpolate(phoneK, [0, 1], [1.4, 1])})`}>
                  <rect x={-330} y={-460} width={660} height={900} rx={70} fill={COL.ink} />
                  <rect x={-300} y={-420} width={600} height={820} rx={44} fill="#f3f6fb" />
                  <rect x={-60} y={-445} width={120} height={14} rx={7} fill="#444" />
                  <text y={-370} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={34} fill={COL.ink}>
                    PAYMENT SUCCESSFUL ✓
                  </text>
                </g>
              )}
              <rect x={-250} y={-300} width={500} height={540} rx={36} fill={RED} {...K} strokeWidth={7} />
              <rect x={-210} y={-370} width={420} height={100} rx={24} fill={GOLD} {...K} strokeWidth={6} />
              <text y={-302} textAnchor="middle" fontFamily={FONT.comic} fontSize={56} fill={COL.ink}>
                SCRATCH &amp; WIN
              </text>
              {Array.from({ length: 9 }, (_, i) => (
                <circle key={i} cx={-200 + i * 50} cy={-378} r={9} fill={(Math.floor(f / 4) + i) % 2 === 0 ? "#fff6a8" : "#c99a00"} {...K} strokeWidth={3} />
              ))}
              <rect x={-220} y={-130} width={440} height={200} rx={22} fill="#2b2b2b" {...K} strokeWidth={6} />
              <g transform="translate(0 -30)">
                <Reel x={-140} f={f} start={T.machine + 2} stop={T.machine + 8} land="₹0" />
                <Reel x={0} f={f} start={T.machine + 2} stop={T.machine + 16} land="₹0" />
                <Reel x={140} f={f} start={T.machine + 2} stop={T.machine + 24} land="?" />
              </g>
              <rect x={-150} y={130} width={300} height={56} rx={14} fill="#9e1b2c" {...K} strokeWidth={5} />
              {/* lever */}
              <g transform={`translate(250 -120) rotate(${lever * 70})`}>
                <rect x={0} y={-12} width={22} height={160} rx={10} fill="#bbb" {...K} strokeWidth={5} transform="rotate(180 11 0)" />
                <circle cx={11} cy={-170} r={34} fill={RED} {...K} strokeWidth={5} />
              </g>
            </g>
          )}

          {/* rules slip */}
          {rulesK > 0.01 && (
            <g opacity={rulesK} transform={`translate(560 640)`}>
              <rect x={-330} y={0} width={660} height={560 * rulesU} fill={CREAM} {...K} strokeWidth={7} />
              <rect x={-350} y={-30} width={700} height={50} rx={25} fill="#d9c79c" {...K} strokeWidth={6} />
              {rulesU > 0.6 && (
                <g opacity={interpolate(rulesU, [0.6, 1], [0, 1])}>
                  <text x={-290} y={80} fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={COL.ink}>
                    SCRATCH CARD — HELP
                  </text>
                  {[150, 200, 250].map((y) => (
                    <rect key={y} x={-290} y={y} width={560} height={14} rx={7} fill="#cfc4a8" />
                  ))}
                  <rect x={-300} y={300} width={600} height={150} rx={12} fill="#fff1a8" stroke={GOLD} strokeWidth={5} />
                  <text x={0} y={365} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.ink}>
                    “Not all scratch cards
                  </text>
                  <text x={0} y={420} textAnchor="middle" fontFamily={FONT.comic} fontSize={44} fill={COL.ink}>
                    guarantee a reward.”
                  </text>
                  <text x={0} y={510} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={26} fill="#6b6b6b">
                    — a payment app's own help page
                  </text>
                </g>
              )}
            </g>
          )}

          {/* checklist */}
          {listK > 0.01 && (
            <g opacity={listK}>
              {[
                { t: "PAY FOR THE THING", ok: true, at: T.thing - 6, y: 820 },
                { t: "PAY FOR THE SCRATCH", ok: false, at: T.notS, y: 1010 },
              ].map((r) => (
                <g key={r.t} transform={`translate(600 ${r.y}) scale(${pop(f, r.at)})`}>
                  <rect x={-330} y={-70} width={660} height={140} rx={24} fill={r.ok ? "#d9f7e8" : "#ffe1e1"} {...K} strokeWidth={7} />
                  <text x={-290} y={20} fontFamily={FONT.comic} fontSize={54} fill={COL.ink}>
                    {r.t}
                  </text>
                  <text x={260} y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={90} fill={r.ok ? COL.green : RED}>
                    {r.ok ? "✓" : "✗"}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* SPARK (left, facing right) */}
          <Spark
            f={f}
            scale={SS}
            base={{ x: 175, y: SGY }}
            facing={1}
            talk={(t) => mouthAt(t)}
            bulb={bulb}
            mood={mood}
            look={1}
            keys={sparkKeys}
            mod={(t, p) => {
              let q = addPose(p, idle(t, 2));
              q = addPose(addPose(q, hop(t, T.design, 30)), hop(t, T.thing, 44));
              q = addPose(addPose(q, shake(t, T.luck)), nod(t, T.notS));
              return q;
            }}
          />
          <PowerUp kind="impact" f={f} at={0} x={200} y={GROUND} tx={CX} ty={CY} layer="front" />
          <PowerUp kind="impact" f={f} at={T.slot - PEAK} x={200} y={GROUND} tx={CX} ty={CY} layer="front" />
        </>
      }
      html={
        <>
          <div style={{ position: "absolute", right: 70, top: 262, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: "#fff", letterSpacing: 2, opacity: 0.9, textShadow: `2px 2px 0 ${COL.ink}` }}>HIDDEN MECHANISM #14</div>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: "translate(-50%,-50%) rotate(-3deg)", opacity: overlayK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 190, color: GOLD, WebkitTextStroke: `14px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>
                ₹0. <span style={{ color: "#fff" }}>AGAIN.</span>
              </div>
            </div>
          )}
          <Slam f={f} at={T.not} out={T.design - 4} x={540} y={470} size={130} color="#fff" stroke={`12px ${COL.ink}`} rotate={-2}>
            BAD LUCK?
          </Slam>
          {f >= T.luck + 4 && f < T.design && (
            <div style={{ position: "absolute", left: 540, top: 470, width: 640, height: 16, background: RED, transform: `translate(-50%,-50%) rotate(-6deg) scaleX(${interpolate(f, [T.luck + 4, T.luck + 10], [0, 1], clamp)})`, borderRadius: 8 }} />
          )}
          <div style={{ position: "absolute", inset: 0, opacity: interpolate(f, [T.some + 4, T.some + 10], [1, 0], clamp) }}>
            <Stamp f={f} at={T.design} x={540} y={470} text="BY DESIGN" color={GOLD} size={130} r={-6} />
          </div>
          {f >= T.some && f < T.fifties - 6 && (
            <Slam f={f} at={T.never} out={T.fifties - 10} x={540} y={470} size={110} color={PINK} stroke={`10px ${COL.ink}`} rotate={2}>
              WHICH ONE?
            </Slam>
          )}
          {labK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 470, transform: `translate(-50%,-50%) rotate(-2deg) scale(${pop(f, T.fifties - 4)})`, opacity: labK, textAlign: "center", whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONT.comic, fontSize: 120, color: CREAM, WebkitTextStroke: `10px ${COL.ink}`, paintOrder: "stroke fill", lineHeight: 1 }}>{f >= T.longest ? "STILL PECKING" : "1950s · LAB"}</div>
              <div style={{ display: "inline-block", marginTop: 8, fontFamily: FONT.title, fontWeight: 900, fontSize: 40, color: "#fff", background: COL.ink, padding: "2px 18px" }}>{f >= T.rewards ? "RANDOM REWARDS → LONGEST PECKING" : "FOOD AFTER A RANDOM NUMBER OF PECKS"}</div>
            </div>
          )}
          <Slam f={f} at={T.slot} out={T.payment - 6} x={540} y={420} size={108} color={GOLD} stroke={`12px ${COL.ink}`} rotate={-3}>
            SLOT MACHINE
          </Slam>
          <Slam f={f} at={T.thing} out={T.now - 4} x={540} y={470} size={120} color="#fff" stroke={`12px ${COL.ink}`} rotate={-2}>
            PAY FOR THE THING
          </Slam>
          <div style={{ position: "absolute", left: 540, top: 1720, transform: "translate(-50%,-50%)", textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 24, color: "#fff", whiteSpace: "nowrap", background: "rgba(11,84,64,0.75)", padding: "2px 12px" }}>
            Sources: payment-app help page · ORF 2019 · Ferster &amp; Skinner 1957
          </div>
          <VoiceCaptions
            f={f}
            y={1480}
            cues={VOICE_CUES}
            hi={["scratch", "nothing", "stop", "luck", "design", "pay", "never", "fifties", "pigeons", "random", "longest", "slot", "machine", "payment", "rules", "wins", "thing", "scratch..."]}
          />
        </>
      }
    />
  );
};
