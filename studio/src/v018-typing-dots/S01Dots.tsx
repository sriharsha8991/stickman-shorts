import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V018 · "Why do you feel nervous when the typing dots stop?" (Your brain did this, ~41 s, clarity rules 2026-10-29)
// Two places only, both announced by the narration:
// A) Spark's dusk living room (violet wall, big window with a pink-orange sunset city, floor lamp, rug,
//    small side table). He holds his phone: a chat with FRIEND, three typing dots... they stop. Nothing arrives.
// B) "a computer game": the whole frame becomes a monitor (dark bezel) showing a grassy field with two rocks.
//    Spark lifts a rock: a snake pops out and zaps him. A 50 / 50 sign goes up on one rock, FOR SURE (snake) on the other.
//    One chart: two STRESS bars, tall for 50 / 50, short for FOR SURE.
// "Now, back to your phone." → hard cut to the room. The empty chat gets a 50 / 50 tag. Spark puts the phone face-down
// on the side table and relaxes; it buzzes softly by itself. Comment question; loops into frame 0.
// Source: de Berker et al. 2016, Nature Communications 7:10996 (45 people, mild shocks); UCL news 29 Mar 2016.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.95;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette (dusk room + game screen)
const WALL = "#4a3f7a";
const WALL2 = "#3c3266";
const SUN1 = "#ffb36b";
const SUN2 = "#ff7f8e";
const CITY = "#2b2350";
const WOOD = "#7a5038";
const WOOD2 = "#5f3d2a";
const MUSTARD = "#e8b23a";
const LAMP = "#ffe3a0";
const BEZEL = "#2a2d34";
const BEZEL2 = "#3b3f48";
const GRASS = "#7cc96a";
const GRASS2 = "#5fae52";
const SKYG = "#bfe7ff";
const ROCK = "#9aa3ad";
const ROCK2 = "#77808b";
const SNAKE = "#8bc34a";
const RED = "#e8505b";
const GREEN = "#3fae5a";
const GOLD = "#ffd23f";
const BLUE = "#3d7be0";
const WHITE = "#ffffff";
const CHAT = "#eef1f6";
const BUBBLE = "#d9dee7";
const INK = COL.ink;

const T = {
  nervous: W(0, 4),
  typing0: W(0, 7),
  stop0: W(0, 9),
  c1: C(1),
  friend: W(1, 1),
  typing1: W(1, 3),
  c2: C(2),
  stopped: W(2, 3),
  nothing: W(2, 5),
  arrived: W(2, 6),
  c3: C(3),
  game: W(3, 7),
  c4: C(4),
  snake4: W(4, 1),
  rock4: W(4, 4),
  shock4: W(4, 8),
  c5: C(5),
  fifty5: W(5, 4),
  chance: W(5, 5),
  c6: C(6),
  caused: W(6, 3),
  stress6: W(6, 6),
  c7: C(7),
  knowing: W(7, 0),
  coming: W(7, 4),
  less: W(7, 6),
  c8: C(8),
  phone8: W(8, 4),
  c9: C(9),
  dots9: W(9, 2),
  guessing: W(9, 6),
  c10: C(10),
  put: W(10, 1),
  away: W(10, 4),
  wait: W(10, 6),
  c11: C(11),
  waited: W(11, 4),
  reply: W(11, 7),
};
const LOOP = VOICE_FRAMES - 14;
const GAME0 = T.c3; // shutter into the computer game
const BACK = T.c8; // hard cut back to the room
const DOWN = T.away + 2; // the phone lies face-down on the table from here
const BUZZ = T.wait + 22; // the phone buzzes by itself

// staging
const SX_R = 400; // Spark in the room
const PH = { x: SX_R + 205, y: HEADY + 150 }; // phone held up (approx. centre, for the camera)
const TABLE = { x: 840, top: 1080 };
const SX_G = 230; // Spark in the game
const R1 = 570; // 50 / 50 rock
const R2 = 860; // FOR SURE rock
const RY = GROUND - 30;
const BAR0 = 880; // bar baseline
const BAR_H1 = 340;
const BAR_H2 = 95;

// shots: one camera move per sentence, held 2.5–5 s, slow moves (clarity rules)
const SHOTS: Shot[] = [
  { f: 0, z: 1.45, at: [SX_R + 110, HEADY + 120], e: "cut" }, // frame 0: Spark + phone
  { f: 4, z: 1.6, at: [SX_R + 130, HEADY + 120], e: "slow" }, // slow push
  { f: T.c1 - 4, z: 2.15, at: [PH.x, PH.y], e: "slow" }, // INSERT: the chat, friend typing
  { f: T.c2 + 30, z: 1.75, at: [SX_R + 100, HEADY + 90], e: "slow" }, // CU face + phone: nothing arrived
  { f: GAME0, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: the computer game
  { f: T.c4 - 6, z: 1.3, at: [420, 1020], e: "slow" }, // MED: lift the rock
  { f: T.c5 - 6, z: 1.15, at: [620, 960], e: "slow" }, // MED: 50 / 50 sign
  { f: T.c6 - 6, z: 1.05, at: [640, 900], e: "slow" }, // WIDE: stress bars
  { f: T.c7 + 4, z: 1.15, at: [700, 920], e: "slow" }, // FOR SURE rock + short bar
  { f: BACK, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: back in the room
  { f: T.c9 - 4, z: 1.9, at: [PH.x, PH.y - 20], e: "slow" }, // INSERT: empty chat + 50 / 50 tag
  { f: T.c10 - 2, z: 1.2, at: [600, 1000], e: "slow" }, // MED: phone goes face-down
  { f: T.c11 - 2, z: 1.85, at: [SX_R + 30, HEADY + 30], e: "slow" }, // CU: comment question
  { f: LOOP, z: 1.45, at: [SX_R + 110, HEADY + 120], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
// three bouncing typing dots inside a grey bubble
const TypingBubble: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <g transform={`scale(${k})`} opacity={Math.min(1, k * 1.5)}>
    <rect x={-46} y={-20} width={92} height={40} rx={20} fill={BUBBLE} stroke={INK} strokeWidth={3} />
    {[0, 1, 2].map((i) => {
      const b = Math.max(0, Math.sin((f - i * 5) / 4.5));
      return <circle key={i} cx={-24 + i * 24} cy={-b * 7} r={7} fill="#6b7280" />;
    })}
  </g>
);

// the phone, drawn at its own centre. dots: 0..1 bubble size; tag: 0..1 "50 / 50" sticker on the screen
const ChatPhone: React.FC<{ f: number; dots: number; tag?: number; glow?: number; arrived?: number }> = ({ f, dots, tag = 0, glow = 0, arrived = 0 }) => (
  <g>
    {glow > 0 && <ellipse cx={0} cy={0} rx={150} ry={200} fill={LAMP} opacity={0.35 * glow} />}
    <rect x={-70} y={-125} width={140} height={250} rx={20} fill="#1b1b22" {...K} strokeWidth={5} />
    <rect x={-60} y={-112} width={120} height={224} rx={12} fill={CHAT} />
    {/* header: avatar + FRIEND */}
    <rect x={-60} y={-112} width={120} height={40} rx={12} fill="#dfe4ee" />
    <circle cx={-38} cy={-92} r={12} fill="#f4a261" stroke={INK} strokeWidth={2.5} />
    <text x={-20} y={-85} fontFamily={FONT.title} fontWeight={900} fontSize={19} fill={INK}>
      FRIEND
    </text>
    {/* my sent message (no words: just lines) */}
    <rect x={-14} y={-56} width={66} height={40} rx={14} fill={BLUE} stroke={INK} strokeWidth={2.5} />
    <line x1={-4} y1={-42} x2={42} y2={-42} stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
    <line x1={-4} y1={-28} x2={26} y2={-28} stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
    {/* their reply: typing dots, then (only at the very end) a thumbs-up bubble */}
    {dots > 0.01 && (
      <g transform="translate(-6 18)">
        <TypingBubble f={f} k={dots} />
      </g>
    )}
    {arrived > 0.01 && (
      <g transform={`translate(-14 18) scale(${arrived})`}>
        <rect x={-38} y={-22} width={76} height={44} rx={18} fill={BUBBLE} stroke={INK} strokeWidth={3} />
        <circle cx={0} cy={0} r={12} fill={GOLD} stroke={INK} strokeWidth={2.5} />
      </g>
    )}
    {tag > 0.01 && (
      <g transform={`translate(8 70) rotate(-8) scale(${tag})`}>
        <rect x={-50} y={-24} width={100} height={48} rx={10} fill={GOLD} stroke={INK} strokeWidth={4} />
        <text y={12} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK}>
          50 / 50
        </text>
      </g>
    )}
  </g>
);

// phone lying face-down on the table (seen from the side), with soft buzz lines
const PhoneDown: React.FC<{ f: number }> = ({ f }) => {
  const b = f >= BUZZ && f < BUZZ + 24;
  const jig = b ? Math.sin(f * 2.2) * 3 : 0;
  return (
    <g transform={`translate(${TABLE.x + jig} ${TABLE.top - 9})`}>
      <rect x={-62} y={-9} width={124} height={18} rx={7} fill="#1b1b22" stroke={INK} strokeWidth={4} />
      {b &&
        [-1, 1].map((s) => (
          <path key={s} d={`M ${s * 78} -14 l ${s * 10} -8 l ${s * -6} -6 l ${s * 12} -8`} fill="none" stroke={WHITE} strokeWidth={4} strokeLinecap="round" />
        ))}
    </g>
  );
};

const Rock: React.FC<{ lift?: number; wob?: number }> = ({ lift = 0, wob = 0 }) => (
  <g transform={`rotate(${-lift * 24 + wob}, 70, 0)`}>
    <path d="M -90 0 C -96 -60 -40 -104 10 -96 C 70 -90 100 -50 92 0 Z" fill={ROCK} {...K} strokeWidth={5} />
    <path d="M -40 -60 C -20 -76 10 -78 30 -70" fill="none" stroke={ROCK2} strokeWidth={6} strokeLinecap="round" />
    <path d="M -86 0 L 92 0" stroke={INK} strokeWidth={5} />
  </g>
);

const Snake: React.FC<{ k: number; f: number }> = ({ k, f }) => (
  <g transform={`scale(${k}) translate(0 ${-10 + Math.sin(f / 4) * 4})`}>
    <path d="M -50 0 C -50 -40 20 -30 10 -70 C 4 -96 40 -108 56 -92" fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
    <path d="M -50 0 C -50 -40 20 -30 10 -70 C 4 -96 40 -108 56 -92" fill="none" stroke={SNAKE} strokeWidth={17} strokeLinecap="round" />
    <circle cx={50} cy={-98} r={4} fill={INK} />
    <path d="M 64 -90 l 14 2 m -14 -2 l 12 8" stroke={RED} strokeWidth={3} strokeLinecap="round" />
  </g>
);

const Bolt: React.FC<{ k: number }> = ({ k }) => (
  <g transform={`scale(${k})`} opacity={k}>
    <path d="M 0 -60 L -22 0 L 0 0 L -14 60 L 30 -12 L 6 -12 L 22 -60 Z" fill={GOLD} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

const Sign: React.FC<{ text: string; col: string; snake?: boolean }> = ({ text, col, snake = false }) => (
  <g>
    <rect x={-6} y={0} width={12} height={110} fill={WOOD} stroke={INK} strokeWidth={4} />
    <rect x={-105} y={-58} width={210} height={70} rx={12} fill={col} {...K} strokeWidth={5} />
    {snake && <path d="M -82 -10 C -82 -34 -60 -30 -62 -44 C -64 -54 -50 -58 -44 -50" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    <text x={snake ? 14 : 0} y={-10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={snake ? 34 : 42} fill={INK}>
      {text}
    </text>
  </g>
);

// one chart: a STRESS bar (h = 0..1 of its full height)
const Bar: React.FC<{ x: number; h: number; full: number; col: string }> = ({ x, h, full, col }) => (
  <g transform={`translate(${x} ${BAR0})`}>
    <rect x={-52} y={-full} width={104} height={full} rx={10} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="8 8" opacity={0.25} />
    {h > 0.005 && <rect x={-52} y={-full * h} width={104} height={full * h} rx={10} fill={col} {...K} strokeWidth={5} />}
  </g>
);

// world A: dusk living room
const Room: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect width={1080} height={1920} fill={WALL} />
    {/* window with a sunset city */}
    <g transform="translate(560 560)">
      <defs>
        <linearGradient id="v018sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SUN2} />
          <stop offset="1" stopColor={SUN1} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={420} height={360} rx={14} fill="url(#v018sun)" {...K} />
      <circle cx={300} cy={250} r={48} fill="#fff1c4" opacity={0.9} />
      <path d="M 6 360 L 6 250 L 60 250 L 60 210 L 110 210 L 110 270 L 170 270 L 170 180 L 230 180 L 230 290 L 290 290 L 290 230 L 350 230 L 350 300 L 414 300 L 414 360 Z" fill={CITY} />
      {[[30, 270], [80, 230], [190, 210], [200, 250], [310, 250], [370, 320]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={10} height={12} fill={LAMP} opacity={0.5 + 0.4 * Math.sin(f / 20 + i)} />
      ))}
      <line x1={210} y1={0} x2={210} y2={360} stroke={INK} strokeWidth={7} />
      <line x1={0} y1={180} x2={420} y2={180} stroke={INK} strokeWidth={7} />
    </g>
    {/* floor lamp (left) with a warm glow */}
    <ellipse cx={150} cy={720} rx={260} ry={300} fill={LAMP} opacity={0.12} />
    <line x1={150} y1={760} x2={150} y2={GROUND} stroke={INK} strokeWidth={8} />
    <path d="M 90 760 L 210 760 L 180 660 L 120 660 Z" fill={LAMP} {...K} strokeWidth={5} />
    <ellipse cx={150} cy={GROUND} rx={46} ry={10} fill={INK} />
    {/* skirting + wooden floor */}
    <rect x={0} y={GROUND - 36} width={1080} height={36} fill={WALL2} stroke={INK} strokeWidth={4} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={WOOD} />
    {Array.from({ length: 7 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 60 + i * 85} x2={1080} y2={GROUND + 60 + i * 85} stroke={WOOD2} strokeWidth={5} />
    ))}
    {/* rug */}
    <ellipse cx={470} cy={GROUND + 40} rx={330} ry={34} fill="#9b6fc4" opacity={0.6} />
    {/* small side table */}
    <rect x={TABLE.x - 95} y={TABLE.top} width={190} height={22} rx={6} fill={MUSTARD} {...K} strokeWidth={5} />
    <line x1={TABLE.x - 70} y1={TABLE.top + 22} x2={TABLE.x - 80} y2={GROUND} stroke={INK} strokeWidth={8} />
    <line x1={TABLE.x + 70} y1={TABLE.top + 22} x2={TABLE.x + 80} y2={GROUND} stroke={INK} strokeWidth={8} />
    {/* a mug on the table */}
    <g transform={`translate(${TABLE.x - 50} ${TABLE.top})`}>
      <rect x={-20} y={-40} width={40} height={40} rx={6} fill={WHITE} {...K} strokeWidth={4} />
      <path d="M 20 -32 q 18 0 18 12 q 0 12 -18 12" fill="none" stroke={INK} strokeWidth={4} />
      {[0, 1].map((i) => (
        <path key={i} d={`M ${-6 + i * 12} -50 q -8 -12 0 -24 t 0 -24`} fill="none" stroke={WHITE} strokeWidth={4} opacity={0.4 + 0.3 * Math.sin(f / 9 + i)} strokeLinecap="round" />
      ))}
    </g>
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// world B: the computer game, framed as a monitor screen
const Game: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={SKYG} />
    {[[200, 420], [760, 360], [520, 520]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`} opacity={0.9}>
        <ellipse cx={0} cy={0} rx={70} ry={30} fill={WHITE} />
        <ellipse cx={40} cy={-14} rx={46} ry={26} fill={WHITE} />
      </g>
    ))}
    <rect y={GROUND - 120} width={1080} height={1920 - GROUND + 120} fill={GRASS} />
    {Array.from({ length: 22 }, (_, i) => (
      <path key={i} d={`M ${30 + i * 50} ${GROUND - 120 + (i % 3) * 60 + 40} l 8 -18 l 8 18`} fill="none" stroke={GRASS2} strokeWidth={5} strokeLinecap="round" />
    ))}
    <line x1={0} y1={GROUND - 120} x2={1080} y2={GROUND - 120} stroke={INK} strokeWidth={5} />
  </g>
);

const Bezel: React.FC = () => (
  <g>
    <path d="M 0 0 H 1080 V 1920 H 0 Z M 46 200 V 1640 H 1034 V 200 Z" fill={BEZEL} fillRule="evenodd" />
    <rect x={46} y={200} width={988} height={1440} rx={16} fill="none" stroke={BEZEL2} strokeWidth={10} />
    <circle cx={980} cy={1690} r={10} fill={GREEN} />
    <rect x={430} y={1676} width={220} height={26} rx={13} fill={BEZEL2} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  ...[8, 26, 44, 62].map((t) => [t, "tick", 0.12] as SfxCue),
  [T.stop0, "swish", 0.25],
  [T.c1 - 4, "whoosh", 0.15],
  ...[T.typing1, T.typing1 + 18, T.typing1 + 36].map((t) => [t, "tick", 0.12] as SfxCue),
  [T.stopped, "swish", 0.3],
  [GAME0 - 8, "whoosh_long", 0.3],
  [GAME0 + 6, "boing", 0.2],
  [T.rock4 - 2, "swish", 0.25],
  [T.snake4 + 14, "pop", 0.3],
  [T.shock4, "buzz", 0.45],
  [T.fifty5 - 2, "pop", 0.35],
  [T.caused, "riser", 0.2],
  [T.stress6, "impact", 0.35],
  [T.knowing + 6, "pop", 0.3],
  [T.less, "ding", 0.3],
  [BACK - 4, "whoosh", 0.25],
  [T.guessing - 4, "pop", 0.3],
  [DOWN, "thud", 0.3],
  [BUZZ, "buzz", 0.15],
  [BUZZ + 10, "ding", 0.25],
  [T.c11 - 2, "whoosh", 0.12],
  [LOOP, "tick", 0.15],
];

const HOLD: Partial<Pose> = { ra1: 55, ra2: 95, la1: -14, la2: 8, head: 6 };
const HOLD_CLOSE: Partial<Pose> = { ra1: 62, ra2: 105, la1: 25, la2: 70, head: 10, lean: 4 };
const TAP: Partial<Pose> = { ra1: 55, ra2: 95, la1: 40, la2: 90, head: 10, lean: 5 };
const LIFT: Partial<Pose> = { ra1: 70, ra2: 20, la1: -10, la2: 10, lean: 16, head: 10 };
const PLACE: Partial<Pose> = { ra1: 82, ra2: 10, la1: -14, la2: 8, lean: 12, head: 8 };

export const S01Dots: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const roomA = f < GAME0 || loopBack;
  const game = !loopBack && f >= GAME0 && f < BACK;
  const roomB = !loopBack && f >= BACK;
  const cam = camAt(f, SHOTS, VERTICAL);

  // typing dots on the phone: on from frame 0, off on "stop"; on again for "was typing", off on "stopped"
  const dotsK = loopBack
    ? 1
    : f < T.c1
      ? interpolate(f, [T.stop0 - 2, T.stop0 + 6], [1, 0], clamp)
      : f < T.c2 + 40
        ? Math.min(popIn(f, T.typing1 - 4), interpolate(f, [T.stopped - 2, T.stopped + 6], [1, 0], clamp))
        : 0;
  const tagK = roomB && f >= T.guessing - 4 ? popIn(f, T.guessing - 4) : 0;
  const arrivedK = 0;
  const holding = roomA || (roomB && f < DOWN);

  // --- game ---
  const lift = game ? Math.min(ease(f, T.rock4 - 4, T.rock4 + 6, 0, 1), ease(f, T.shock4 + 24, T.shock4 + 36, 1, 0)) : 0;
  const snakeK = game && f >= T.snake4 + 12 && f < T.shock4 + 30 ? popIn(f, T.snake4 + 12) : 0;
  const boltK = game && f >= T.shock4 && f < T.shock4 + 16 ? interpolate(f, [T.shock4, T.shock4 + 4, T.shock4 + 16], [0.4, 1.2, 0], clamp) : 0;
  const sign1 = game && f >= T.fifty5 - 2 ? popIn(f, T.fifty5 - 2) : 0;
  const sign2 = game && f >= T.knowing + 6 ? popIn(f, T.knowing + 6) : 0;
  const bar1 = game ? ease(f, T.caused - 4, T.stress6 + 4, 0, 1) : 0;
  const bar2 = game ? ease(f, T.coming, T.less + 6, 0, 1) : 0;
  const rockWob = game && f >= T.fifty5 && f < T.c7 ? 3 * Math.sin(f / 3) * (f < T.c6 ? 1 : 0.6) : 0;
  const [sqx, sqy] = squash(f, T.shock4 + 36, 0.12);

  // --- Spark ---
  const sx = game ? SX_G : SX_R;
  const sparkKeys = roomA
    ? gestureKeys([
        [0, HOLD],
        [T.stop0 - 2, HOLD],
        [T.stop0 + 2, HOLD_CLOSE, "smooth"],
        [T.c1, HOLD, "smooth"],
        [T.stopped, HOLD_CLOSE, "smooth"],
        [T.nothing + 4, TAP, "smooth"],
        [LOOP - 2, HOLD, "snap"],
      ])
    : game
      ? gestureKeys([
          [GAME0, G.presentBoth],
          [T.game, G.pointSide, "smooth"],
          [T.c4, G.present, "smooth"],
          [T.shock4 - 2, G.pointSide, "smooth"],
          [T.shock4, G.recoil, "snap"],
          [T.c5, G.pointSide, "smooth"],
          [T.c6, G.thinkChin, "smooth"],
          [T.stress6, G.shrugBig, "snap"],
          [T.c7, G.present, "smooth"],
          [T.less, G.handsHips, "smooth"],
        ])
      : gestureKeys([
          [BACK, HOLD],
          [T.c9, HOLD_CLOSE, "smooth"],
          [T.guessing, HOLD, "smooth"],
          [T.put, LIFT, "smooth"],
          [DOWN, PLACE, "smooth"],
          [DOWN + 14, G.rest, "smooth"],
          [T.wait, G.handsHips, "smooth"],
          [BUZZ, G.rest, "smooth"],
          [T.c11, G.beckon, "smooth"],
          [T.reply, G.present, "smooth"],
        ]);

  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "worried";
    if (t < T.stop0) return "curious";
    if (t < T.c1) return "worried";
    if (t < T.stopped) return "excited";
    if (t < GAME0) return "worried";
    if (t < T.c4) return "curious";
    if (t < T.shock4) return "determined";
    if (t < T.c5) return "shock";
    if (t < T.c6) return "thinking";
    if (t < T.c7) return "worried";
    if (t < T.less) return "skeptical";
    if (t < BACK) return "happy";
    if (t < T.guessing) return "thinking";
    if (t < T.c10) return "mindblown";
    if (t < BUZZ) return "happy";
    if (t < T.c11) return "wink";
    return "curious";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.stress6, 28), bulbPulse(t, T.guessing, 30));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.shock4, 3));
    q = addPose(q, nod(t, T.less, 1));
    q = addPose(q, hop(t, T.guessing, 14));
    q = addPose(q, nod(t, BUZZ + 4, 1));
    return { ...q, x: sx };
  };

  const phoneTilt = roomA ? -6 + (f >= T.nothing + 4 && f < GAME0 ? 4 * Math.sin(f / 3) : 0) : -6;
  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) =>
        holding ? (
          <g transform={`translate(${j.rHand[0] + 40} ${j.rHand[1] - 40}) rotate(${phoneTilt})`}>
            <ChatPhone f={f} dots={dotsK} tag={tagK} arrived={arrivedK} glow={0} />
          </g>
        ) : roomB && f >= T.put && f < DOWN ? null : null
      }
    </Spark>
  );

  // sweat drops on the stress beat (game)
  const sweat =
    game && f >= T.caused && f < T.c7
      ? [0, 1].map((i) => {
          const d = (f - T.caused + i * 12) % 30;
          return <path key={i} d={`M ${SX_G + 60 + i * 30} ${HEADY - 30 + d * 3} q 8 12 0 18 q -8 -6 0 -18`} fill="#7cc8f0" stroke={INK} strokeWidth={3} opacity={1 - d / 30} />;
        })
      : null;

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: game ? BEZEL : WALL }} />}
      cam={cam}
      hits={[T.shock4]}
      power={6}
      svg={
        game ? (
          <>
            <Game />
            {/* the 50 / 50 rock with a snake under it */}
            <g transform={`translate(${R1} ${RY}) scale(1.35)`}>
              {snakeK > 0.01 && <Snake k={snakeK} f={f} />}
              <g transform={`scale(${sqx} ${sqy})`}>
                <Rock lift={lift} wob={rockWob} />
              </g>
            </g>
            {boltK > 0.01 && (
              <g transform={`translate(${SX_G + 150} ${HEADY + 150})`}>
                <Bolt k={boltK} />
              </g>
            )}
            {f >= T.shock4 && f < T.shock4 + 14 && <Burst x={SX_G + 140} y={HEADY + 150} at={T.shock4} f={f} size={160} color={GOLD} />}
            {/* the FOR SURE rock */}
            <g transform={`translate(${R2} ${RY}) scale(1.35)`}>
              <Rock />
            </g>
            {sign1 > 0.01 && (
              <g transform={`translate(${R1} ${RY - 200}) scale(${sign1 * 1.3}) rotate(${wobble(f, T.fifty5 + 4, 6)})`}>
                <Sign text="50 / 50" col={GOLD} />
              </g>
            )}
            {sign2 > 0.01 && (
              <g transform={`translate(${R2} ${RY - 200}) scale(${sign2 * 1.3}) rotate(${wobble(f, T.knowing + 10, 6)})`}>
                <Sign text="FOR SURE" col="#cfe9ff" snake />
              </g>
            )}
            {/* one chart: two stress bars */}
            {f >= T.caused - 6 && (
              <>
                <text x={705} y={BAR0 - BAR_H1 - 40} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={52} fill={INK} opacity={interpolate(f, [T.caused - 6, T.caused + 4], [0, 1], clamp)}>
                  STRESS
                </text>
                <Bar x={R1} h={bar1} full={BAR_H1} col={RED} />
                {f >= T.knowing && <Bar x={R2} h={bar2 * (BAR_H2 / BAR_H1)} full={BAR_H1} col={GREEN} />}
              </>
            )}
            {sparkEl}
            {sweat}
            <Bezel />
          </>
        ) : (
          <>
            <Room f={f} />
            {roomB && f >= DOWN && <PhoneDown f={f} />}
            {roomB && f >= BUZZ && f < BUZZ + 30 && <ellipse cx={TABLE.x} cy={TABLE.top - 14} rx={110} ry={30} fill={LAMP} opacity={interpolate(f, [BUZZ, BUZZ + 6, BUZZ + 30], [0, 0.6, 0], clamp)} />}
            {sparkEl}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words) */}
          {(f < T.c1 - 6 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 104, transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`, opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 6], [1, 0], clamp) }}>
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>WHY DID</div>
              <div style={{ color: GOLD, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>IT STOP?</div>
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: game ? 1610 : 1700, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: INK, whiteSpace: "nowrap", opacity: 0.9, background: "rgba(255,255,255,0.8)", padding: "2px 12px", borderRadius: 8 }}>
                de Berker et al. 2016 · lab game, 45 people, mild shocks · not a texting study
              </div>
              <div style={{ position: "absolute", right: 96, top: 1752, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: GOLD, letterSpacing: 2, opacity: 0.95 }}>YOUR BRAIN DID THIS</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["nervous", "typing", "dots", "stop?", "stopped,", "nothing", "game.", "snake", "shock.", "fifty-fifty", "most", "stress.", "less", "stressful.", "phone.", "guessing.", "away,", "wait.", "reply?"]}
          />
          <Transition f={f} at={GAME0} kind="shutter" size={VERTICAL} colors={[BEZEL, GRASS, GOLD]} />
        </>
      }
    />
  );
};
