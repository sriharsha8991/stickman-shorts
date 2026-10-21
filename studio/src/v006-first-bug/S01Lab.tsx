import React from "react";
import { AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Actor, P, SNAP, addPose, idle, walkCycle, type Key } from "../stickman/stick";
import { Burst, COL, FONT, Slam, SpeedLines } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V006 · The first computer bug was a real bug. Mini Origin Doc in a sepia "archive" look.
// Spark is the documentary host with a magnifying glass. Beats: the 1947 logbook page → the
// room-sized relay machine → zoom into a relay → a moth → taped into the logbook, the note writes
// itself word by word → "Actual." gets circled (the aha) → rewind 1947 → 1878 to an Edison letter →
// MYTH stamp → the moth's red-carpet moment (wow) → museum case → "check for moths" (moth flies off).

loadFont({ family: "Caveat", url: staticFile("fonts/caveat-latin-700-normal.woff2"), weight: "700", format: "woff2" });
const HAND = "Caveat";

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const pop = (f: number, at: number) => interpolate(f, [at, at + 5, at + 9], [0, 1.12, 1], clamp);

const SS = 1.85;
const SGY = GROUND - 92.5 * SS;
const ES = 1.5;
const EGY = GROUND - 92.5 * ES;
const INK = "#3b2a1a";
const ENG = "#5d7a99";

// --- archive background ------------------------------------------------------
const ArchiveBg: React.FC<{ f: number; warm: number }> = ({ f, warm }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3e8cc" />
          <stop offset="100%" stopColor="#dcc79c" />
        </linearGradient>
        <radialGradient id="vig" cx="50%" cy="48%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#2a1a08" stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#arch)" />
      <rect width={1080} height={1920} fill="#b0702a" opacity={0.18 * warm} />
      {/* wall panelling */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 216 + 108} y1={640} x2={i * 216 + 108} y2={GROUND} stroke="#cdb88d" strokeWidth={3} />
      ))}
      <rect x={0} y={GROUND} width={1080} height={1920 - GROUND} fill="#b99d6c" />
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={5} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 130 - 40} y1={GROUND + 4} x2={i * 130 - 120} y2={1920} stroke="#a88b5c" strokeWidth={3} />
      ))}
      {/* film grain + flicker */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={i}
          cx={random(`gx${i}-${Math.floor(f / 2)}`) * 1080}
          cy={random(`gy${i}-${Math.floor(f / 2)}`) * 1920}
          r={1 + random(`gr${i}`) * 2}
          fill="#3b2a1a"
          opacity={0.18}
        />
      ))}
      <rect width={1080} height={1920} fill="url(#vig)" />
      <rect width={1080} height={1920} fill="#fff" opacity={0.03 * Math.sin(f * 1.7) + 0.02} />
    </svg>
  </AbsoluteFill>
);

// --- the moth ---------------------------------------------------------------
const Moth: React.FC<{ f: number; s?: number; flap?: boolean; flat?: boolean; shades?: boolean }> = ({ f, s = 1, flap = true, flat, shades }) => {
  const w = flat ? 1 : flap ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9)) : 0.9;
  return (
    <g transform={`scale(${s})`}>
      <g transform={`scale(${w} 1)`}>
        <path d="M 0 -6 C -30 -50 -78 -46 -70 -10 C -66 8 -30 6 0 2 Z" fill="#8b7355" {...K} strokeWidth={4} />
        <path d="M 0 -6 C 30 -50 78 -46 70 -10 C 66 8 30 6 0 2 Z" fill="#8b7355" {...K} strokeWidth={4} />
        <path d="M 0 2 C -24 8 -54 30 -40 44 C -28 54 -10 26 0 10 Z" fill="#a08766" {...K} strokeWidth={4} />
        <path d="M 0 2 C 24 8 54 30 40 44 C 28 54 10 26 0 10 Z" fill="#a08766" {...K} strokeWidth={4} />
        <circle cx={-40} cy={-18} r={8} fill="#5a4630" />
        <circle cx={40} cy={-18} r={8} fill="#5a4630" />
      </g>
      <ellipse cx={0} cy={6} rx={9} ry={28} fill="#5a4630" {...K} strokeWidth={4} />
      <path d="M -3 -20 Q -14 -46 -26 -52 M 3 -20 Q 14 -46 26 -52" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      {shades && (
        <g>
          <rect x={-16} y={-16} width={14} height={8} rx={3} fill="#111" />
          <rect x={2} y={-16} width={14} height={8} rx={3} fill="#111" />
          <line x1={-2} y1={-13} x2={2} y2={-13} stroke="#111" strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

// --- the relay machine --------------------------------------------------------
const MX0 = 380;
const MX1 = 1020;
const MY0 = 660;
const ROWS = 7;
const COLS = 6;
const relayPos = (r: number, c: number) => [MX0 + 52 + c * 100, MY0 + 70 + r * 72] as const;
const MOTH_R = 3;
const MOTH_C = 3;
const [RX, RY] = relayPos(MOTH_R, MOTH_C);

const Machine: React.FC<{ f: number; build: number; clickRate: number; alarm: number; mothO: number }> = ({ f, build, clickRate, alarm, mothO }) => {
  const panels = [0, 1, 2];
  const pw = (MX1 - MX0) / 3;
  return (
    <g>
      {panels.map((i) => {
        const t = interpolate(build, [i * 0.22, i * 0.22 + 0.4], [0, 1], clamp);
        const x = MX0 + i * pw;
        return (
          <g key={i} opacity={t} transform={`translate(0 ${(1 - t) * 80})`}>
            <rect x={x + 4} y={MY0} width={pw - 8} height={GROUND - MY0} rx={8} fill="#6e6353" {...K} strokeWidth={5} />
            <rect x={x + 18} y={MY0 + 22} width={pw - 36} height={GROUND - MY0 - 70} rx={4} fill="#3e362c" />
          </g>
        );
      })}
      {/* relays */}
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => {
          const [x, y] = relayPos(r, c);
          const t = interpolate(build, [0.3 + (r * COLS + c) * 0.012, 0.45 + (r * COLS + c) * 0.012], [0, 1], clamp);
          const phase = Math.floor(f * clickRate * (0.6 + random(`rp${r}${c}`) * 0.8) + random(`ro${r}${c}`) * 10);
          const on = clickRate > 0 ? phase % 2 === 0 : (r + c) % 3 === 0;
          const isMoth = r === MOTH_R && c === MOTH_C;
          return (
            <g key={`${r}-${c}`} opacity={t}>
              <rect x={x - 34} y={y - 24} width={68} height={48} rx={6} fill="#c9b58a" stroke="#1a1a1a" strokeWidth={3} />
              <rect x={x - 26} y={y - 16} width={20} height={32} rx={3} fill="#8c7a55" />
              <line x1={x + 2} y1={y + 12} x2={x + 26} y2={on ? y - 14 : y + 4} stroke="#1a1a1a" strokeWidth={5} strokeLinecap="round" />
              <circle cx={x + 26} cy={y - 16} r={5} fill={on ? "#ffd23f" : "#6b5a3a"} />
              {isMoth && mothO > 0 && (
                <g transform={`translate(${x - 4} ${y + 2})`} opacity={mothO}>
                  <Moth f={f} s={0.32} flap={false} />
                </g>
              )}
            </g>
          );
        }),
      )}
      {/* warning lamp */}
      <g opacity={build}>
        <rect x={MX0 + 270} y={MY0 - 40} width={100} height={40} rx={6} fill="#4a4136" {...K} strokeWidth={4} />
        <circle cx={MX0 + 320} cy={MY0 - 52} r={24} fill={alarm > 0 && Math.floor(f / 5) % 2 === 0 ? COL.red : "#7a3a2a"} {...K} strokeWidth={4} />
        {alarm > 0 && Math.floor(f / 5) % 2 === 0 && <circle cx={MX0 + 320} cy={MY0 - 52} r={60} fill={COL.red} opacity={0.25} />}
        <text x={MX0 + 320} y={MY0 + 14} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={20} fill="#e9dcbd" letterSpacing={3}>
          RELAY CALCULATOR
        </text>
      </g>
    </g>
  );
};

// --- the logbook page ---------------------------------------------------------
const NOTE = ["First", "actual", "case", "of", "bug", "being", "found."];
const LogPage: React.FC<{ f: number; x: number; y: number; r?: number; s?: number; tape: number; words: number[]; circle: number; mothFlap?: boolean }> = ({
  f,
  x,
  y,
  r = 0,
  s = 1,
  tape,
  words,
  circle,
  mothFlap,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-330} y={-280} width={660} height={560} rx={6} fill="#000" opacity={0.18} transform="translate(12 14)" />
    <rect x={-330} y={-280} width={660} height={560} rx={6} fill="#f7efd9" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 11 }, (_, i) => (
      <line key={i} x1={-300} x2={300} y1={-230 + i * 48} y2={-230 + i * 48} stroke="#b9c7d8" strokeWidth={2} />
    ))}
    <line x1={-250} x2={-250} y1={-280} y2={280} stroke="#d99a9a" strokeWidth={3} />
    {/* illegible log scribbles (no invented text) */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M -230 ${-240 + i * 48} q 20 -14 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0`}
        stroke={INK}
        strokeWidth={3}
        fill="none"
        opacity={0.55}
      />
    ))}
    {/* the moth */}
    <g transform="translate(0 -20)">
      <Moth f={f} s={1.15} flap={!!mothFlap} flat={!mothFlap} />
    </g>
    {/* tape */}
    {tape > 0 && (
      <g opacity={Math.min(1, tape * 2)} transform={`translate(0 -20) scale(${lerp(1.6, 1, Math.min(1, tape))}) rotate(-8)`}>
        <rect x={-130} y={-30} width={260} height={56} fill="#fffbe6" opacity={0.7} stroke="#c9bb8a" strokeWidth={2} />
      </g>
    )}
    {/* handwritten note */}
    <text x={-230} y={190} fontFamily={HAND} fontWeight={700} fontSize={58} fill={INK}>
      {NOTE.map((w, i) => (
        <tspan key={i} opacity={words[i] ?? 0} dx={i === 0 ? 0 : 12}>
          {w}
        </tspan>
      ))}
    </text>
    {/* red marker circle around "actual" */}
    {circle > 0 && (
      <ellipse
        cx={-12}
        cy={172}
        rx={84}
        ry={44}
        fill="none"
        stroke={COL.red}
        strokeWidth={7}
        strokeDasharray={600}
        strokeDashoffset={600 * (1 - circle)}
        transform="rotate(-5 -12 172)"
      />
    )}
  </g>
);

// --- 1878 letter --------------------------------------------------------------
const Letter: React.FC<{ s: number }> = ({ s }) => (
  <g transform={`scale(${s})`}>
    <rect x={-300} y={-200} width={600} height={400} rx={4} fill="#e8d5a8" stroke={INK} strokeWidth={5} transform="rotate(2)" />
    <path d="M -300 -200 l 40 0 l -40 30 z" fill="#d4bd88" />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M -240 ${-140 + i * 40} q 25 -12 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} stroke={INK} strokeWidth={3} fill="none" opacity={0.4} />
    ))}
    <circle cx={220} cy={140} r={36} fill="#a3271f" {...K} strokeWidth={4} />
    <circle cx={220} cy={140} r={20} fill="none" stroke="#7a1a14" strokeWidth={3} />
  </g>
);

// --- museum case --------------------------------------------------------------
const Museum: React.FC<{ f: number; o: number }> = ({ f, o }) => (
  <g opacity={o}>
    <rect x={530} y={1060} width={420} height={230} fill="#7b6446" {...K} strokeWidth={5} />
    <rect x={560} y={1090} width={360} height={60} rx={4} fill="#d9c49a" stroke={INK} strokeWidth={3} />
    <text x={740} y={1118} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={24} fill={INK} letterSpacing={2}>
      SMITHSONIAN
    </text>
    <text x={740} y={1142} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={15} fill={INK}>
      National Museum of American History
    </text>
    <g transform="translate(740 900) scale(0.42)">
      <LogPage f={f} x={0} y={0} tape={1} words={[1, 1, 1, 1, 1, 1, 1]} circle={0} />
    </g>
    <rect x={540} y={740} width={400} height={320} fill="#cfe6ea" opacity={0.22} stroke="#fff" strokeWidth={5} />
    <line x1={570} y1={770} x2={650} y2={850} stroke="#fff" strokeWidth={6} opacity={0.6} />
    <line x1={590} y1={760} x2={700} y2={870} stroke="#fff" strokeWidth={3} opacity={0.5} />
  </g>
);

// laptop prop for the payoff
const Laptop: React.FC<{ err: number }> = ({ err }) => (
  <g>
    <rect x={-80} y={-110} width={160} height={110} rx={8} fill="#2a2a2a" {...K} strokeWidth={4} />
    <rect x={-68} y={-98} width={136} height={86} rx={4} fill={err > 0 ? "#5a1414" : "#4b7bb0"} />
    {err > 0 && (
      <text y={-46} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill="#ff6b5e" opacity={err}>
        ERROR
      </text>
    )}
    <path d="M -100 0 L 100 0 L 110 14 L -110 14 Z" fill="#555" {...K} strokeWidth={4} />
  </g>
);

const Magnifier: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <line x1={0} y1={0} x2={-34} y2={34} stroke="#6b4a2a" strokeWidth={12} strokeLinecap="round" />
    <circle cx={22} cy={-22} r={32} fill="#dff3f7" fillOpacity={0.35} stroke={COL.ink} strokeWidth={7} />
  </g>
);

// --- sfx ----------------------------------------------------------------------
const clickTimes = () => Array.from({ length: 10 }, (_, i) => W(3, 2) + i * 5);
export const S01_SFX: SfxCue[] = [
  [W(0, 1), "pop", 0.4],
  [C(1), "stinger", 0.55],
  [W(1, 4), "stamp", 0.5],
  [W(2, 3), "whoosh_long", 0.4],
  ...clickTimes().map((t): SfxCue => [t, "tick", 0.35]),
  [W(4, 1), "buzz", 0.45],
  [W(4, 5), "swish", 0.4],
  [C(5), "whoosh", 0.5],
  [W(6, 1), "impact", 0.65],
  [W(7, 1), "stamp", 0.45],
  ...NOTE.map((_, i): SfxCue => [W(8, i), "scribble", 0.18]),
  [W(9, 4), "ding", 0.7],
  [W(10, 9), "pop", 0.45],
  [C(11), "whoosh_long", 0.55],
  [W(11, 3), "thud", 0.6],
  [C(12) + 4, "page", 0.5],
  [W(13, 4), "stamp", 0.7],
  [W(14, 4), "gold", 0.55],
  [W(14, 4) + 2, "kaching", 0.3],
  [C(15), "swish", 0.45],
  [W(16, 5), "buzz", 0.4],
  [W(17, 2), "boing", 0.5],
  [W(17, 2) + 8, "whoosh", 0.4],
];

export const S01Lab: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const yearIn = C(1);
  const machIn = C(2);
  const wrong = C(4);
  const zoomIn = C(5);
  const moth = W(6, 1);
  const back = C(7);
  const taped = W(7, 1);
  const aha = W(9, 4); // "Actual."
  const rewind = C(11);
  const letter = C(12);
  const myth = C(13);
  const famous = C(14);
  const museum = C(15);
  const payoff = C(16);
  const flyOff = W(17, 2);

  // which "set" is on stage
  const showPage = f < yearIn + 18 || (f >= back - 6 && f < rewind + 14);
  const showMachine = f >= yearIn && f < back + 12;
  const pageX = f < yearIn + 18 ? lerp(640, 1500, ease(f, yearIn, yearIn + 18)) : lerp(1500, 640, ease(f, back - 6, back + 10)) + (f >= rewind ? lerp(0, -1200, ease(f, rewind, rewind + 14)) : 0);
  const machO = interpolate(f, [machIn - 4, machIn + 4, back, back + 12], [0, 1, 1, 0], clamp);
  const build = interpolate(f, [machIn, W(3, 2)], [0, 1], clamp);
  const clickRate = f >= W(3, 2) && f < wrong + 10 ? 0.5 : f >= C(4) ? 0 : 0.08;
  const alarm = f >= W(4, 1) && f < zoomIn + 20 ? 1 : 0;

  // camera: zoom into the relay with the moth, then back out
  const zk = ease(f, zoomIn, zoomIn + 22) * (1 - ease(f, back - 8, back + 6));
  const camZ = lerp(1, 2.6, zk);
  const camX = lerp(0, RX - 540, zk);
  const camY = lerp(0, RY - 960, zk);
  const z = punch(f, [C(1), W(1, 4), W(4, 1), moth, taped, aha, W(11, 3), W(13, 4), W(14, 4), flyOff], 0.035);

  // note words appear as they're spoken
  const words = NOTE.map((_, i) => interpolate(f, [W(8, i) - 2, W(8, i) + 4], [0, 1], clamp));
  const circle = interpolate(f, [aha - 2, aha + 12], [0, 1], clamp);
  const tape = interpolate(f, [taped, taped + 6], [0, 1], clamp);

  // year counter for the rewind
  const year = Math.round(interpolate(f, [rewind + 2, W(11, 3) + 4], [1947, 1878], { ...clamp, easing: Easing.inOut(Easing.quad) }));
  const warm = interpolate(f, [rewind, rewind + 20, myth - 6, myth + 6], [0, 1, 1, 0], clamp);

  // famous moth
  const starO = interpolate(f, [famous - 2, famous + 6, museum - 6, museum], [0, 1, 1, 0], clamp);

  // Spark
  const sparkX = (t: number) => {
    if (t < yearIn) return 200;
    if (t < zoomIn) return 195;
    if (t < museum) return 200;
    if (t < payoff) return lerp(200, 280, ease(t, museum, museum + 18));
    return lerp(280, 420, ease(t, payoff, payoff + 20));
  };
  const sparkMood = (t: number): Mood =>
    t >= moth && t < back ? "shock" : t >= aha && t < rewind ? "smug" : t >= myth && t < famous ? "smug" : t >= W(16, 5) && t < flyOff ? "neutral" : t >= flyOff ? "shock" : "happy";
  const bulb = (t: number) => Math.max(bulbPulse(t, aha, 45), bulbPulse(t, W(14, 4), 20) * 0.7, bulbPulse(t, moth, 14) * 0.5);
  const holdMag = f < yearIn || (f >= back && f < aha) || f >= W(17, 0);
  const holdLaptop = f >= payoff;
  const sparkKeys: Key[] = [
    { f: 0, p: { ra1: 100, ra2: -30, la1: -18 } }, // magnifier toward the page
    { f: W(0, 1) - 3, p: { ra1: 100, ra2: -30 } },
    { f: W(0, 1) + 3, p: { ra1: 120, ra2: -40, la1: -18 }, e: SNAP },
    { f: yearIn - 2, p: { ra1: 120, ra2: -40 } },
    { f: yearIn + 4, p: { ...P.pointR, ra1: 130 }, e: SNAP }, // points up at the year
    { f: W(2, 3) - 3, p: { ...P.pointR, ra1: 130 } },
    { f: W(2, 3) + 4, p: { la1: -120, la2: -20, ra1: 120, ra2: 20 }, e: SNAP }, // "the size of a room"
    { f: C(3) + 6, p: { la1: -120, la2: -20, ra1: 120, ra2: 20 } },
    { f: C(3) + 14, p: { ...P.pointR } },
    { f: W(4, 1) - 2, p: { ...P.pointR } },
    { f: W(4, 1) + 4, p: { ...P.shrug }, e: SNAP }, // "something's wrong"
    { f: zoomIn - 2, p: { ...P.shrug } },
    { f: zoomIn + 4, p: { ...P.pointR, ra1: 110 } },
    { f: moth - 2, p: { ...P.pointR } },
    { f: moth + 4, p: { ...P.shock }, e: SNAP },
    { f: back - 2, p: { ...P.shock } },
    { f: back + 6, p: { ra1: 100, ra2: -30, la1: -18 } },
    { f: C(8) - 2, p: { ra1: 100, ra2: -30 } },
    { f: C(8) + 6, p: { ...P.pointR, ra1: 105 } },
    { f: C(9) - 2, p: { ...P.pointR, ra1: 105 } },
    { f: C(9) + 4, p: { ...P.think }, e: SNAP }, // "but read that again"
    { f: aha - 2, p: { ...P.think } },
    { f: aha + 3, p: { ra1: 150, ra2: -10, la1: -18 }, e: SNAP }, // finger up: "Actual."
    { f: C(10) + 10, p: { ra1: 150, ra2: -10 } },
    { f: C(10) + 18, p: { ...P.shrug } },
    { f: rewind - 2, p: { ...P.shrug } },
    { f: rewind + 4, p: { ...P.pointL, la1: -110 }, e: SNAP }, // rewind "back in"
    { f: letter - 2, p: { ...P.pointL, la1: -110 } },
    { f: letter + 6, p: { ...P.pointR, ra1: 110 } },
    { f: myth - 2, p: { ...P.pointR, ra1: 110 } },
    { f: myth + 4, p: { la1: -60, la2: -100, ra1: 60, ra2: 100 } }, // arms crossed-ish
    { f: W(13, 4) - 2, p: { la1: -60, la2: -100, ra1: 60, ra2: 100 } },
    { f: W(13, 4) + 3, p: { ...P.pointR, ra1: 80 }, e: SNAP },
    { f: famous - 2, p: { ...P.pointR, ra1: 80 } },
    { f: famous + 4, p: { ...P.cheer }, e: SNAP }, // "famous"
    { f: museum - 2, p: { ...P.cheer } },
    { f: museum + 8, p: { ...P.pointR, ra1: 100 } },
    { f: payoff - 2, p: { ...P.pointR, ra1: 100 } },
    { f: payoff + 8, p: { ra1: 85, ra2: 10, la1: -18, la2: 8 } }, // holds the laptop
    { f: W(17, 0) - 2, p: { ra1: 85, ra2: 10, la1: -18, la2: 8 } },
    { f: W(17, 0) + 4, p: { ra1: 85, ra2: 10, la1: 60, la2: 40, head: 10 }, e: SNAP }, // peers with the magnifier
    { f: flyOff - 2, p: { ra1: 85, ra2: 10, la1: 60, la2: 40, head: 10 } },
    { f: flyOff + 4, p: { ra1: 85, ra2: 10, la1: -150, la2: -10, head: -14, lean: -6 }, e: SNAP },
  ];

  // engineers hunting (cue 4)
  const engO = interpolate(f, [W(4, 2), W(4, 2) + 4, zoomIn + 6, zoomIn + 14], [0, 1, 1, 0], clamp);
  const engX = (base: number, t: number) => lerp(base + 500, base, ease(t, W(4, 2), W(4, 5) + 10));

  // moth flight at the end
  const flyK = interpolate(f, [flyOff, VOICE_FRAMES], [0, 1], clamp);
  const flyX = 470 + flyK * 520 + Math.sin(flyK * 14) * 50;
  const flyY = 1020 - flyK * 820 + Math.cos(flyK * 11) * 40;

  return (
    <Stage
      bg={<ArchiveBg f={f} warm={warm} />}
      hits={[W(1, 4), moth, W(11, 3), W(13, 4)]}
      power={10}
      cam={{ z: camZ * z, x: camX, y: camY }}
      svg={
        <>
          {/* machine set */}
          {showMachine && (
            <g opacity={machO}>
              <Machine f={f} build={build} clickRate={clickRate} alarm={alarm} mothO={f >= W(5, 2) ? 1 : 0} />
              {f >= moth && f < back + 12 && <Burst x={RX} y={RY} at={moth} f={f} size={70} color={COL.gold} />}
              {/* flashlight engineers */}
              {engO > 0 &&
                [620, 860].map((bx, i) => (
                  <g key={bx} opacity={engO}>
                    <Actor
                      f={f}
                      color={ENG}
                      scale={ES}
                      label="ENGINEER"
                      face="eyes"
                      base={{ x: bx, y: EGY }}
                      facing={-1}
                      keys={[
                        { f: 0, p: {} },
                        { f: W(4, 5) + 8, p: {} },
                        { f: W(4, 5) + 14, p: { la1: -120, la2: -10 }, e: SNAP },
                      ]}
                      mod={(t, p) => {
                        const q = { ...p, x: engX(bx, t) };
                        if (t < W(4, 5) + 10) return addPose(q, walkCycle(t + i * 7, 0.3));
                        return addPose(q, idle(t, 4 + i));
                      }}
                    >
                      {(j) =>
                        f >= W(4, 5) + 10 ? (
                          <path
                            d={`M ${j.lHand[0]} ${j.lHand[1]} L ${j.lHand[0] - 170} ${j.lHand[1] - 160 + Math.sin(f * 0.2 + i) * 30} L ${j.lHand[0] - 210} ${j.lHand[1] - 40 + Math.sin(f * 0.2 + i) * 30} Z`}
                            fill="#fff3b0"
                            opacity={0.45}
                          />
                        ) : null
                      }
                    </Actor>
                  </g>
                ))}
            </g>
          )}

          {/* zoomed-in moth flaps once it's found */}
          {f >= moth && f < back && (
            <g transform={`translate(${RX - 4} ${RY + 2})`}>
              <Moth f={f} s={0.34 + 0.3 * pop(f, moth)} flap />
            </g>
          )}

          {/* logbook */}
          {showPage && pageX < 1450 && pageX > -600 && (
            <LogPage
              f={f}
              x={pageX}
              y={f < yearIn ? 930 : 900}
              r={f < yearIn ? -3 : 2}
              s={f < yearIn ? 0.78 : 0.82}
              tape={f < yearIn + 18 ? 1 : tape}
              words={f < yearIn + 18 ? NOTE.map(() => 1) : words}
              circle={f < yearIn + 18 ? 0 : circle}
            />
          )}

          {/* 1878 letter */}
          {f >= letter - 4 && f < myth + 10 && (
            <g transform={`translate(650 940) rotate(${lerp(-25, -3, ease(f, letter - 4, letter + 10))})`} opacity={interpolate(f, [letter - 4, letter + 4, myth, myth + 10], [0, 1, 1, 0], clamp)}>
              <Letter s={0.95 * pop(f, letter - 4)} />
            </g>
          )}
          {f >= rewind && f < letter && <SpeedLines f={f} from={rewind} to={letter} dir={-1} color="#c7ab78" />}

          {/* famous moth: red carpet + flashes */}
          {starO > 0 && (
            <g opacity={starO}>
              <path d={`M 560 1290 L 880 1290 L 800 1130 L 640 1130 Z`} fill="#a3271f" opacity={0.85} />
              <ellipse cx={720} cy={1140} rx={200} ry={30} fill="#fff6c8" opacity={0.35} />
              <path d="M 640 640 L 800 640 L 900 1140 L 540 1140 Z" fill="#fff6c8" opacity={0.18} />
              <g transform={`translate(720 ${980 + Math.sin(f * 0.25) * 12}) rotate(${Math.sin(f * 0.2) * 6})`}>
                <Moth f={f} s={1.5 * pop(f, famous)} flap shades />
              </g>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const t0 = famous + 4 + i * 6;
                const fl = interpolate(f, [t0, t0 + 2, t0 + 7], [0, 1, 0], clamp);
                const x = [520, 940, 600, 880, 560, 960][i];
                const y = [760, 820, 1210, 1180, 980, 1010][i];
                return <circle key={i} cx={x} cy={y} r={70} fill="#fff" opacity={fl * 0.9} />;
              })}
            </g>
          )}
          {f >= W(14, 4) && f < museum && <Burst x={720} y={980} at={W(14, 4)} f={f} size={240} color={COL.gold} />}

          {/* museum */}
          {f >= museum - 4 && f < payoff + 12 && <Museum f={f} o={interpolate(f, [museum - 4, museum + 8, payoff, payoff + 12], [0, 1, 1, 0], clamp)} />}

          {/* moth flies off at the end */}
          {f >= flyOff && (
            <g transform={`translate(${flyX} ${flyY}) rotate(${Math.sin(f * 0.4) * 20})`}>
              <Moth f={f} s={0.75} flap />
            </g>
          )}

          {/* SPARK, documentary host */}
          {!(f >= zoomIn + 8 && f < back - 4) && (
            <Spark
              f={f}
              scale={SS}
              base={{ x: 200, y: SGY }}
              talk={(t) => mouthAt(t)}
              bulb={bulb}
              mood={sparkMood}
              look={f >= rewind && f < letter ? -1 : 1}
              keys={sparkKeys}
              mod={(t, p) => {
                const q = { ...p, x: sparkX(t) };
                if (Math.abs(sparkX(t) - sparkX(t - 1)) > 1.2) return addPose(q, walkCycle(t, 0.3));
                return addPose(q, idle(t, 5));
              }}
            >
              {(j) => (
                <>
                  {holdMag && !holdLaptop && (
                    <g transform={`translate(${j.rHand[0]} ${j.rHand[1]})`}>
                      <Magnifier s={1.1} />
                    </g>
                  )}
                  {holdLaptop && (
                    <g transform={`translate(${j.rHand[0] + 70} ${j.rHand[1] + 14})`}>
                      <Laptop err={interpolate(f, [W(16, 5), W(16, 5) + 4], [0, 1], clamp)} />
                    </g>
                  )}
                  {holdLaptop && f >= W(17, 0) && (
                    <g transform={`translate(${j.lHand[0]} ${j.lHand[1]})`}>
                      <Magnifier s={0.9} />
                    </g>
                  )}
                </>
              )}
            </Spark>
          )}
        </>
      }
      html={
        <>
          {/* hook layer at frame 0 */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 420,
              transform: "translate(-50%,-50%) rotate(-2deg)",
              opacity: interpolate(f, [yearIn - 6, yearIn], [1, 0], clamp),
              background: "#f7efd9",
              border: `6px solid ${INK}`,
              boxShadow: `8px 8px 0 ${INK}`,
              borderRadius: 12,
              padding: "14px 30px",
              fontFamily: HAND,
              fontWeight: 700,
              fontSize: 66,
              color: INK,
              whiteSpace: "nowrap",
            }}
          >
            “First actual case of bug being found.”
          </div>
          <Slam f={f} at={0} out={yearIn - 6} x={540} y={570} size={50} font={FONT.title} weight={900} color={INK} spacing={3}>
            THE FIRST COMPUTER BUG WAS A REAL BUG
          </Slam>

          {/* year card */}
          <Slam f={f} at={yearIn} out={C(3) - 6} x={540} y={400} size={150} color="#f7efd9" stroke={`10px ${INK}`}>
            SEPT 9, 1947
          </Slam>
          <Slam f={f} at={W(1, 4)} out={C(3) - 6} x={540} y={540} size={64} font={FONT.title} weight={900} color={INK} spacing={10}>
            HARVARD · MARK II
          </Slam>
          <Slam f={f} at={W(3, 2)} out={wrong - 4} x={540} y={420} size={110} color="#ffd23f" stroke={`8px ${INK}`} rotate={-3}>
            CLICK CLACK CLICK
          </Slam>
          <Slam f={f} at={W(4, 1)} out={zoomIn - 2} x={540} y={420} size={130} color={COL.red} stroke={`8px #fff`} rotate={2}>
            SOMETHING'S WRONG
          </Slam>
          <Slam f={f} at={moth} out={back - 6} x={540} y={420} size={170} color="#f7efd9" stroke={`10px ${INK}`}>
            A MOTH.
          </Slam>
          <Slam f={f} at={W(6, 3)} out={back - 6} x={540} y={570} size={64} font={FONT.title} weight={900} color="#fff" spacing={6}>
            A REAL ONE
          </Slam>
          <Slam f={f} at={taped} out={C(9) - 6} x={540} y={400} size={90} color="#f7efd9" stroke={`8px ${INK}`}>
            TAPED INTO THE LOGBOOK
          </Slam>
          <Slam f={f} at={aha} out={rewind - 4} x={540} y={400} size={150} color={COL.red} stroke={`9px #fff`} rotate={-4}>
            “ACTUAL”?
          </Slam>
          {f >= W(10, 7) && f < rewind && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 540,
                transform: `translate(-50%,-50%) scale(${pop(f, W(10, 7))})`,
                background: "#ffd23f",
                border: `5px solid ${INK}`,
                borderRadius: 14,
                padding: "8px 26px",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 54,
                letterSpacing: 2,
                color: INK,
                whiteSpace: "nowrap",
              }}
            >
              “BUG” ALREADY MEANT GLITCH
            </div>
          )}

          {/* rewind year counter */}
          {f >= rewind && f < myth && (
            <div
              style={{
                position: "absolute",
                left: 540,
                top: 410,
                transform: `translate(-50%,-50%) scale(${f >= W(11, 3) + 4 ? interpolate(f, [W(11, 3) + 4, W(11, 3) + 9, W(11, 3) + 13], [1.25, 0.95, 1], clamp) : 1})`,
                fontFamily: FONT.comic,
                fontSize: 190,
                color: "#f7efd9",
                WebkitTextStroke: `10px ${INK}`,
                paintOrder: "stroke fill",
                letterSpacing: 8,
                opacity: interpolate(f, [rewind, rewind + 4, myth - 6, myth], [0, 1, 1, 0], clamp),
              }}
            >
              {year}
            </div>
          )}
          {f >= letter && f < myth && (
            <div
              style={{
                position: "absolute",
                left: 650,
                top: 935,
                width: 470,
                transform: `translate(-50%,-50%) rotate(-3deg)`,
                opacity: interpolate(f, [letter + 6, letter + 14], [0, 1], clamp),
                fontFamily: HAND,
                fontWeight: 700,
                fontSize: 54,
                lineHeight: 1.05,
                color: INK,
                textAlign: "center",
              }}
            >
              “‘Bugs’ — as such little faults and difficulties are called…”
            </div>
          )}
          <Slam f={f} at={W(12, 1)} out={myth - 4} x={540} y={560} size={52} font={FONT.title} weight={900} color={INK} spacing={4}>
            THOMAS EDISON, IN A LETTER
          </Slam>

          {/* myth stamp */}
          {f >= myth && f < famous && (
            <div
              style={{
                position: "absolute",
                left: 640,
                top: 920,
                transform: `translate(-50%,-50%) scale(${pop(f, myth)}) rotate(2deg)`,
                background: "#f7efd9",
                border: `6px solid ${INK}`,
                borderRadius: 14,
                padding: "26px 34px",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 60,
                color: INK,
                whiteSpace: "nowrap",
                boxShadow: `8px 8px 0 ${INK}`,
              }}
            >
              THE MOTH INVENTED “BUG”
            </div>
          )}
          {f >= W(13, 4) && f < famous && (
            <div
              style={{
                position: "absolute",
                left: 650,
                top: 925,
                transform: `translate(-50%,-50%) rotate(-12deg) scale(${interpolate(f - W(13, 4), [0, 5, 8, 11], [2.6, 0.9, 1.04, 1], clamp)})`,
                border: `12px solid ${COL.red}`,
                borderRadius: 18,
                padding: "4px 40px",
                fontFamily: FONT.title,
                fontWeight: 900,
                fontSize: 150,
                letterSpacing: 10,
                color: COL.red,
                background: "rgba(247,239,217,0.85)",
              }}
            >
              MYTH
            </div>
          )}
          <Slam f={f} at={W(14, 4)} out={museum - 4} x={540} y={420} size={170} color={COL.gold} stroke={`10px ${INK}`} rotate={-3}>
            FAMOUS!
          </Slam>
          <Slam f={f} at={museum} out={payoff - 4} x={540} y={410} size={80} color="#f7efd9" stroke={`8px ${INK}`}>
            STILL THERE TODAY
          </Slam>
          <Slam f={f} at={W(17, 0)} x={540} y={420} size={140} color="#ffd23f" stroke={`9px ${INK}`} rotate={-3}>
            CHECK FOR MOTHS
          </Slam>

          <VoiceCaptions f={f} cues={VOICE_CUES} hi={["bug", "moth", "1947", "relay", "actual", "edison", "bugs", "famous", "smithsonian", "moths", "glitch"]} />
        </>
      }
    />
  );
};
