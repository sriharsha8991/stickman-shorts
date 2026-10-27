import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT, Slam } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions, punch } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V025 · Why do you finish movies you hate? (Your brain did this, ~25.4 s)
// World: a dark plum movie auditorium, an awful sock-puppet monster film on the screen, a green EXIT glow.
// Metaphor: the ₹400 ticket is a ball-and-chain on Spark's ankle. He lives it (slumped, chained), the coins fly
// out of the ticket (gone either way), SUNK COST, slice → the theatre study (random discounts → full-price
// buyers used more tickets, first half of the season), back in the seat: the chain is PAPER and rips,
// "Your brain is.", the ticket flips to FREE? and he stands up for the EXIT; the question cuts back into frame 0.
// Source: Arkes & Blumer 1985, OBHDP 35:124–140 (Experiment 2).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SX = 380; // Spark's seat (hip x)
const SITY = 1188;
const STANDY = GROUND - 92.5 * SS;
const SX2 = 235; // standing on the theatre-study stage
const HEAD_SIT: [number, number] = [392, SITY - 132];
const WALK = 140; // he steps away from the seat when he stands
const HEAD_STAND: [number, number] = [SX + WALK + 10, STANDY - 135];
const HEAD_STAGE: [number, number] = [SX2 + 10, STANDY - 135];

// palette: plum cinema
const WALL = "#2a1433";
const WALL2 = "#170a1e";
const VELVET = "#8e1b3a";
const VELVET2 = "#5c0f25";
const SCREEN = "#bfc9d6";
const TICKET = "#ffd166";
const TICKET2 = "#f4a83a";
const CREAM = "#fff3d6";
const EXITG = "#3ddc84";
const GOLD = "#ffd23f";
const RED = "#e63946";
const STEEL = "#a7b0bb";
const INK = COL.ink;

const TK: [number, number] = [770, 1196]; // the ticket ball on the floor
const NOTCH: [number, number] = [TK[0] - 150, TK[1] + 10];

const T = {
  hate: W(0, 6),
  c1: C(1),
  hundred: W(1, 3),
  c2: C(2),
  waste: W(2, 2),
  hours: W(2, 5),
  but: C(3),
  money: W(3, 2),
  gone: W(3, 4),
  way: W(3, 6),
  staying: C(4),
  back: W(4, 4),
  brain5: C(5),
  hates: W(5, 3),
  wasting: W(5, 4),
  one: C(6),
  random: W(6, 3),
  discounts: W(6, 5),
  full: C(7),
  more: W(7, 4),
  plays: W(7, 5),
  early: C(8),
  least: W(8, 5),
  ticket9: C(9),
  isnt: W(9, 2),
  holding: W(9, 3),
  brain: W(10, 1),
  your10: C(10),
  ask: C(11),
  free: W(11, 4),
  would: W(11, 5),
  stay: W(11, 7),
  what: C(12),
  paid: W(12, 7),
};
const LOOP = VOICE_FRAMES - 14;
const STUDY0 = T.one; // slice into the theatre study
const STUDY1 = T.ticket9; // cut back to the auditorium
const RIP = T.holding + 4;
const STAND_AT = T.stay;

const SHOTS: Shot[] = [
  { f: 0, z: 1.42, at: [565, 1060], e: "cut" }, // frame 0: slumped Spark + ₹400 ticket on a chain
  { f: T.hate - 3, z: 2.1, at: HEAD_SIT, e: "snap" }, // CU: "hate"
  { f: T.c1, z: 1.8, at: [735, 1170], e: "cut" }, // INSERT: the ticket, PAID stamp
  { f: T.c2, z: 1.0, at: [540, 960], e: "cut" }, // WIDE: the auditorium, hourglass
  { f: T.but, z: 1.45, at: [640, 1030], e: "snap" }, // MED: coins fly out of the ticket
  { f: T.staying, z: 2.0, at: HEAD_SIT, e: "snap" }, // CU: sinks in the seat
  { f: T.brain5, z: 1.9, at: HEAD_SIT, e: "cut" },
  { f: T.brain5 + 2, z: 2.3, at: [HEAD_SIT[0], HEAD_SIT[1] - 10], e: "slow" }, // slow push, bulb flickers
  { f: STUDY0, z: 1.05, at: [540, 960], e: "cut" }, // slice → WIDE theatre stage
  { f: T.random - 2, z: 1.25, at: [600, 880], e: "snap" }, // INSERT: tickets get random stickers
  { f: T.full, z: 1.42, at: [660, 1060], e: "cut" }, // INSERT: stub piles
  { f: T.early, z: 1.15, at: [540, 1000], e: "cut" }, // MED: FIRST HALF tag
  { f: T.least - 6, z: 1.95, at: HEAD_STAGE, e: "snap" }, // CU: skeptical "at least"
  { f: STUDY1, z: 1.35, at: [570, 1110], e: "cut" }, // back in the seat
  { f: T.isnt, z: 1.85, at: [560, 1215], e: "snap" }, // INSERT: the chain is paper
  { f: T.your10, z: 2.2, at: HEAD_SIT, e: "snap" }, // CU: "Your brain is."
  { f: T.ask, z: 1.75, at: [745, 1170], e: "cut" }, // INSERT: ticket flips to FREE?
  { f: T.would, z: 1.1, at: [560, 1000], e: "cut" }, // WIDE: he stands up
  { f: T.what, z: 1.9, at: HEAD_STAND, e: "snap" }, // CU: the comment question
  { f: LOOP, z: 1.42, at: [565, 1060], e: "cut" }, // back into frame 0
];

// --- background: plum auditorium ---------------------------------------------------------------------------------
const Auditorium: React.FC<{ f: number; exitK: number }> = ({ f, exitK }) => {
  const flick = 0.82 + 0.1 * Math.sin(f / 3.1) + 0.06 * Math.sin(f / 1.7);
  const bob = Math.sin(f / 9) * 18;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="v025wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={WALL2} />
            <stop offset="60%" stopColor={WALL} />
            <stop offset="100%" stopColor={WALL2} />
          </linearGradient>
          <radialGradient id="v025beam" cx="0.5" cy="0" r="1">
            <stop offset="0%" stopColor="#e9f0ff" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#e9f0ff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={GROUND} fill="url(#v025wall)" />
        {/* side curtains */}
        {[0, 1].map((s) => (
          <g key={s} transform={s ? "translate(1080 0) scale(-1 1)" : undefined}>
            <path d="M 0 0 L 130 0 Q 110 300 140 620 Q 120 800 150 980 L 0 980 Z" fill={VELVET} stroke={INK} strokeWidth={6} />
            {[30, 70, 105].map((x) => (
              <path key={x} d={`M ${x} 0 Q ${x - 10} 400 ${x + 8} 980`} stroke={VELVET2} strokeWidth={10} fill="none" />
            ))}
          </g>
        ))}
        {/* the screen + an awful sock-puppet monster film */}
        <rect x={150} y={300} width={780} height={520} rx={8} fill={SCREEN} opacity={flick} stroke={INK} strokeWidth={8} />
        <g opacity={0.9 * flick}>
          <rect x={150} y={700} width={780} height={120} fill="#8796a8" />
          {/* cardboard city */}
          {[200, 300, 420, 700, 800].map((x, i) => (
            <rect key={x} x={x} y={600 - (i % 2) * 50} width={80} height={110 + (i % 2) * 50} fill="#6c7a8c" stroke={INK} strokeWidth={4} />
          ))}
          {/* the sock monster on a visible stick */}
          <g transform={`translate(${560 + Math.sin(f / 14) * 40} ${560 + bob}) rotate(${Math.sin(f / 6) * 8})`}>
            <line x1={0} y1={60} x2={0} y2={260} stroke="#5a4636" strokeWidth={10} />
            <path d="M -60 70 L -60 -60 Q -60 -110 0 -110 Q 60 -110 60 -60 L 60 70 Z" fill="#e8e1d0" stroke={INK} strokeWidth={6} />
            {[-30, 0, 30].map((y) => (
              <rect key={y} x={-60} y={y} width={120} height={14} fill={RED} opacity={0.75} />
            ))}
            <circle cx={-22} cy={-62} r={20} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={24} cy={-66} r={14} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={-16 + Math.sin(f / 4) * 6} cy={-58} r={8} fill={INK} />
            <circle cx={26 + Math.cos(f / 5) * 4} cy={-64} r={6} fill={INK} />
            <path d="M -36 -16 Q 0 18 36 -16" fill="#3a0c0c" stroke={INK} strokeWidth={5} />
            <path d="M -24 -10 l 8 14 l 8 -14 M 4 -10 l 8 14 l 8 -14" fill="#fff" stroke={INK} strokeWidth={2} />
          </g>
          {/* film scratches */}
          {[0, 1, 2].map((i) => (
            <line key={i} x1={200 + random(`sc${i}-${Math.floor(f / 3)}`) * 700} y1={300} x2={205 + random(`sd${i}-${Math.floor(f / 3)}`) * 700} y2={820} stroke="#fff" strokeWidth={2} opacity={0.5} />
          ))}
        </g>
        {/* projector beam from behind */}
        <path d="M 540 -40 L 150 300 L 930 300 Z" fill="url(#v025beam)" opacity={0.6} />
        {/* back rows: seat silhouettes facing the screen */}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M ${70 + i * 115} 960 q 0 -60 50 -60 q 50 0 50 60 l 0 30 l -100 0 Z`} fill="#3d1c48" stroke={INK} strokeWidth={5} />
        ))}
        <rect x={0} y={985} width={1080} height={30} fill="#3d1c48" stroke={INK} strokeWidth={5} />
        {/* EXIT door, right wall */}
        <rect x={905} y={1030} width={140} height={GROUND - 1030} fill="#1d2b22" stroke={INK} strokeWidth={6} />
        <rect x={905} y={1030} width={140} height={GROUND - 1030} fill={EXITG} opacity={0.12 + 0.3 * exitK} />
        <rect x={922} y={1052} width={106} height={44} rx={6} fill={EXITG} stroke={INK} strokeWidth={4} opacity={0.75 + 0.25 * exitK} />
        <text x={975} y={1086} textAnchor="middle" fontFamily={FONT.comic} fontSize={36} fill={INK}>
          EXIT
        </text>
        <ellipse cx={975} cy={1070} rx={120 + 40 * exitK} ry={60 + 20 * exitK} fill={EXITG} opacity={0.08 + 0.12 * exitK} />
        {/* floor: aisle carpet */}
        <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#3a1226" />
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={80 + i * 150} cy={GROUND + 18} r={5} fill={GOLD} opacity={0.5 + 0.3 * Math.sin(f / 10 + i)} />
        ))}
        <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};

// Spark's seat (side view: back behind him on the left, cushion under him, armrest in front)
const Seat: React.FC = () => (
  <g>
    <path d={`M ${SX - 120} ${SITY + 30} L ${SX - 110} ${SITY - 190} Q ${SX - 100} ${SITY - 230} ${SX - 60} ${SITY - 222} L ${SX - 44} ${SITY + 30} Z`} fill={VELVET} {...K} />
    <rect x={SX - 112} y={SITY + 6} width={200} height={44} rx={16} fill={VELVET} {...K} />
    <rect x={SX - 80} y={SITY + 50} width={26} height={GROUND - SITY - 50} fill="#2d2d36" {...K} strokeWidth={5} />
    <rect x={SX + 34} y={SITY + 50} width={26} height={GROUND - SITY - 50} fill="#2d2d36" {...K} strokeWidth={5} />
  </g>
);

const Hourglass: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const sand = interpolate(f, [T.waste, T.but + 40], [1, 0.25], clamp);
  return (
    <g transform={`translate(560 ${GROUND - 70}) scale(${k}) rotate(${wobble(f, T.hours, 10)})`}>
      <rect x={-52} y={-78} width={104} height={14} rx={5} fill="#a0663a" {...K} strokeWidth={5} />
      <rect x={-52} y={64} width={104} height={14} rx={5} fill="#a0663a" {...K} strokeWidth={5} />
      <path d="M -40 -64 L 40 -64 L 6 0 L 40 64 L -40 64 L -6 0 Z" fill="#d9f3ff" fillOpacity={0.7} {...K} strokeWidth={5} />
      <path d={`M ${-34 * sand} ${-58 + (1 - sand) * 50} L ${34 * sand} ${-58 + (1 - sand) * 50} L 4 -4 L -4 -4 Z`} fill={GOLD} />
      <path d={`M -36 62 L 36 62 L ${36 * (1 - sand) * 0.8} ${62 - (1 - sand) * 50} L ${-36 * (1 - sand) * 0.8} ${62 - (1 - sand) * 50} Z`} fill={GOLD} />
      <line x1={0} y1={-4} x2={0} y2={60} stroke={GOLD} strokeWidth={4} strokeDasharray="6 5" strokeDashoffset={-f * 2} />
    </g>
  );
};

// the ticket "ball" (front face): ₹400 → (PAID stamp) → FREE?
const Ticket: React.FC<{ f: number; x: number; y: number; k: number; rot: number; text: string; textCol: string; flipX: number; stamp: number }> = ({ x, y, k, rot, text, textCol, flipX, stamp }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
    <g transform={`scale(${flipX} 1)`}>
      <path d="M -150 -80 L 150 -80 L 150 -22 A 22 22 0 0 0 150 22 L 150 80 L -150 80 L -150 22 A 22 22 0 0 0 -150 -22 Z" fill={TICKET} {...K} strokeWidth={7} />
      <line x1={86} y1={-72} x2={86} y2={72} stroke={TICKET2} strokeWidth={5} strokeDasharray="10 8" />
      <text x={-24} y={-38} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={30} fill={INK} letterSpacing={3}>
        ADMIT ONE
      </text>
      <text x={-24} y={50} textAnchor="middle" fontFamily={FONT.comic} fontSize={text.length > 4 ? 88 : 96} fill={textCol}>
        {text}
      </text>
      <text x={118} y={10} textAnchor="middle" fontFamily={FONT.comic} fontSize={30} fill={INK} transform="rotate(90 118 0)">
        ROW F
      </text>
    </g>
    {stamp > 0.01 && (
      <g transform={`translate(-30 -50) rotate(-10) scale(${0.62 * stamp})`} opacity={0.92}>
        <rect x={-120} y={-46} width={240} height={92} rx={12} fill="none" stroke={RED} strokeWidth={9} />
        <text y={30} textAnchor="middle" fontFamily={FONT.comic} fontSize={84} fill={RED}>
          PAID
        </text>
      </g>
    )}
  </g>
);

// chain links along a sagging curve from Spark's ankle to the ticket notch; `paper` 0..1 turns steel into paper
const Chain: React.FC<{ a: [number, number]; b: [number, number]; paper: number; rip: number; f: number }> = ({ a, b, paper, rip, f }) => {
  const n = 9;
  const col = paper > 0.5 ? CREAM : STEEL;
  const links = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let x = a[0] + (b[0] - a[0]) * t;
    let y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 46;
    if (rip > 0) {
      // the two halves drop to the floor after the tear
      const side = t < 0.5 ? -1 : 1;
      const d = Math.min(1, rip);
      const drop = Math.sin(Math.min(Math.abs(t - 0.5) * 2, 1) * Math.PI * 0.5);
      y = interpolate(d, [0, 1], [y, Math.min(GROUND - 14, y + (1 - drop) * 60)]);
      x += side * d * 26;
    }
    links.push(
      <ellipse
        key={i}
        cx={x}
        cy={y}
        rx={20}
        ry={12}
        transform={`rotate(${i % 2 ? 0 : 90} ${x} ${y})`}
        fill={i % 2 && paper > 0.5 ? CREAM : "none"}
        stroke={col}
        strokeWidth={paper > 0.5 ? 6 : 8}
        strokeDasharray={paper > 0.5 ? "8 4" : undefined}
      />,
    );
  }
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 46];
  return (
    <g>
      {links.filter((_, i) => rip <= 0 || (i !== 4 && i !== 5))}
      {/* ankle cuff */}
      <rect x={a[0] - 22} y={a[1] - 16} width={44} height={30} rx={8} fill={paper > 0.5 ? CREAM : STEEL} {...K} strokeWidth={5} />
      {rip > 0 && rip < 1.6 && (
        <g>
          {Array.from({ length: 10 }, (_, i) => {
            const ang = random(`p${i}`) * Math.PI * 2;
            const r = 30 + rip * 120 * (0.6 + random(`q${i}`) * 0.6);
            return (
              <rect key={i} x={mid[0] + Math.cos(ang) * r} y={mid[1] - 20 + Math.sin(ang) * r * 0.7 + rip * rip * 40} width={18} height={10} fill={CREAM} stroke={INK} strokeWidth={2} transform={`rotate(${f * 9 + i * 40} ${mid[0] + Math.cos(ang) * r} ${mid[1]})`} opacity={Math.max(0, 1 - rip / 1.6)} />
            );
          })}
        </g>
      )}
    </g>
  );
};

// --- theatre study stage ------------------------------------------------------------------------------------------
const StageBg: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="v025spot" cx="0.6" cy="0.55" r="0.55">
          <stop offset="0%" stopColor="#ffe8b0" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#ffe8b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={GROUND} fill="#6b1430" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M ${i * 95} 0 Q ${i * 95 + 30 + Math.sin(f / 30 + i) * 6} 640 ${i * 95} ${GROUND}`} stroke="#4a0c21" strokeWidth={22} fill="none" />
      ))}
      {/* valance */}
      <path d="M 0 0 L 1080 0 L 1080 240 Q 990 300 900 240 Q 810 300 720 240 Q 630 300 540 240 Q 450 300 360 240 Q 270 300 180 240 Q 90 300 0 240 Z" fill={VELVET} stroke={INK} strokeWidth={6} />
      <path d="M 0 236 Q 90 296 180 236 Q 270 296 360 236 Q 450 296 540 236 Q 630 296 720 236 Q 810 296 900 236 Q 990 296 1080 236" stroke={GOLD} strokeWidth={8} fill="none" />
      <rect width={1080} height={GROUND} fill="url(#v025spot)" />
      {/* wooden stage floor */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#7a4a26" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={0} y1={GROUND + 30 + i * 60} x2={1080} y2={GROUND + 30 + i * 60} stroke="#55321a" strokeWidth={4} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

const SeasonTicket: React.FC<{ x: number; y: number; k: number; off: number; rot: number }> = ({ x, y, k, off, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
    <rect x={-78} y={-48} width={156} height={96} rx={10} fill={CREAM} {...K} strokeWidth={5} />
    <text y={-10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill={INK} letterSpacing={2}>
      SEASON
    </text>
    <text y={28} textAnchor="middle" fontFamily={FONT.comic} fontSize={34} fill={VELVET}>
      10 PLAYS
    </text>
    {off > 0.01 && (
      <g transform={`translate(52 -36) scale(${off}) rotate(14)`}>
        <circle r={36} fill={GOLD} {...K} strokeWidth={4} />
        <text y={4} textAnchor="middle" fontFamily={FONT.comic} fontSize={26} fill={INK}>
          %
        </text>
        <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={18} fill={INK}>
          OFF
        </text>
      </g>
    )}
  </g>
);

const Stub: React.FC<{ x: number; y: number; k: number; col: string }> = ({ x, y, k, col }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <path d="M -80 -22 L 80 -22 L 80 -8 A 8 8 0 0 0 80 8 L 80 22 L -80 22 L -80 8 A 8 8 0 0 0 -80 -8 Z" fill={col} {...K} strokeWidth={5} />
    <line x1={40} y1={-18} x2={40} y2={18} stroke={INK} strokeWidth={3} strokeDasharray="5 4" opacity={0.6} />
  </g>
);

const OFF_IDX = [1, 2, 3, 5]; // 4 of 6 got a discount at random (in the study: 36 of 54)
const TIX: [number, number][] = [
  [500, 780],
  [700, 780],
  [895, 780],
  [500, 960],
  [700, 960],
  [895, 960],
];

export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.4],
  [T.hate - 3, "whoosh", 0.3],
  [T.hate + 6, "boing", 0.3],
  [T.c1, "swish", 0.35],
  [T.hundred, "stamp", 0.7],
  [T.c2, "whoosh", 0.3],
  [T.waste, "pop", 0.45],
  [T.hours, "tick", 0.4],
  [T.hours + 8, "tick", 0.35],
  [T.but, "swish", 0.35],
  ...Array.from({ length: 4 }, (_, i): SfxCue => [T.money + i * 4, "whoosh", 0.25]),
  [T.gone + 6, "clink", 0.3],
  [T.staying, "whoosh", 0.25],
  [T.back, "thud", 0.45],
  [T.brain5, "swirl", 0.35],
  [T.wasting, "stinger", 0.45],
  [STUDY0 - 6, "whoosh_long", 0.55],
  ...OFF_IDX.map((_, i): SfxCue => [T.random + 4 + i * 7, "pop", 0.4]),
  ...Array.from({ length: 7 }, (_, i): SfxCue => [T.full + 12 + i * 6, "page", 0.35]),
  [T.plays, "ding", 0.4],
  [T.early + 6, "tick", 0.35],
  [T.least - 6, "whoosh", 0.25],
  [STUDY1, "whoosh", 0.35],
  [T.isnt, "swish", 0.3],
  [RIP, "shatter", 0.35],
  [RIP + 1, "crash", 0.25],
  [T.brain, "ding", 0.55],
  [T.ask, "swish", 0.3],
  [T.free - 2, "swish", 0.4],
  [T.free + 4, "kaching", 0.4],
  [STAND_AT, "boing", 0.35],
  [T.what, "whoosh", 0.3],
  [T.paid, "pop", 0.3],
  [LOOP, "chains", 0.35],
];

const SIT: Partial<Pose> = { y: SITY, ll1: 78, ll2: -70, rl1: 92, rl2: -84, lean: -6 };
const STANDP: Partial<Pose> = { y: STANDY, ll1: -12, ll2: 4, rl1: 12, rl2: -4, lean: 0 };
const sit = (g: Partial<Pose>, extra: Partial<Pose> = {}) => ({ ...g, ...SIT, ...extra, lean: (SIT.lean ?? 0) + (g.lean ?? 0) + (extra.lean ?? 0) });
const stand = (g: Partial<Pose>) => ({ ...g, ...STANDP, lean: g.lean ?? 0 });

export const S01Cinema: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const study = f >= STUDY0 && f < STUDY1;
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.hundred, T.wasting, RIP, T.brain], 0.035) };

  const loopBack = f >= LOOP - 2;
  const standing = f >= STAND_AT && !loopBack;

  // ticket states
  const stampK = f >= T.hundred && f < T.ask && !loopBack ? popIn(f, T.hundred) : 0;
  const flip = interpolate(f, [T.free - 4, T.free + 4], [0, 1], clamp);
  const freeOn = f >= T.free && !loopBack;
  const tkFlipX = f < T.free - 4 || loopBack ? 1 : Math.max(0.05, Math.abs(Math.cos(flip * Math.PI)));
  const [tsx, tsy] = squash(f, T.hundred, 0.12);
  const tkRot = -4 + wobble(f, T.hundred, 6) + wobble(f, RIP, 5) + wobble(f, T.free, 8) + (f < T.c1 ? Math.sin(f / 5) * 2 : 0);
  const chainPaper = loopBack ? 0 : interpolate(f, [T.ticket9 + 6, T.isnt + 6], [0, 1], clamp);
  const ripP = loopBack || f < RIP ? 0 : (f - RIP) / 14;
  const hourK = f >= T.waste && f < T.staying ? popIn(f, T.waste) * interpolate(f, [T.staying - 8, T.staying], [1, 0], clamp) : 0;
  const exitK = interpolate(f, [T.stay - 10, T.stay + 10], [0, 1], clamp) * (loopBack ? 0 : 1);

  // study props
  const tixK = win(f, STUDY0 + 4, T.full + 10, 6);
  const pileK = win(f, T.full + 6, STUDY1, 4);
  const halfK = popIn(f, T.early + 6);

  const overlayK = Math.max(interpolate(f, [T.hundred + 6, T.hundred + 14], [1, 0], clamp), interpolate(f, [LOOP - 4, LOOP], [0, 1], clamp));

  const sparkKeys = study
    ? gestureKeys([
        [STUDY0, stand(G.presentBoth)],
        [T.random, stand(G.pointSide), "snap"],
        [T.full, stand(G.doublePoint), "snap"],
        [T.plays, stand(G.fistPump), "snap"],
        [T.early, stand(G.armsCrossed), "snap"],
        [T.least, stand(G.thinkChin), "snap"],
      ])
    : gestureKeys([
        [0, sit(G.thinkChin, { head: 14 })],
        [T.hate, sit(G.facepalm), "snap"],
        [T.c1, sit(G.pointDown), "snap"],
        [T.c2, sit(G.shrugBig), "snap"],
        [T.but, sit(G.pointSide, { lean: 10 }), "snap"],
        [T.gone, sit(G.recoil), "snap"],
        [T.staying, sit({ ...G.shrugBig, head: 16 }, { y: SITY + 10, lean: -8 }), "snap"],
        [T.brain5, sit(G.pointUp), "snap"],
        [T.wasting, sit(G.thinkChin), "snap"],
        [STUDY1, sit(G.rest)],
        [STUDY1 + 3, sit(G.stop)],
        [T.isnt, sit({ ...G.fistPump, ra1: 60, ra2: 30 }, { lean: -14 }), "snap"],
        [RIP, sit(G.recoil), "snap"],
        [T.your10, sit(G.pointUp), "snap"],
        [T.brain + 6, sit(G.mindBlown), "snap"],
        [T.ask, sit(G.thinkChin), "snap"],
        [T.free, sit(G.present), "snap"],
        [STAND_AT, stand(G.celebrate), "snap"],
        [T.what, stand(G.leanIn), "snap"],
        [T.paid - 6, stand(G.beckon), "snap"],
        [LOOP - 2, sit(G.thinkChin, { head: 14 })],
      ]);

  const mood = (t: number): Mood =>
    t >= LOOP - 2
      ? "sad"
      : t < T.hate
        ? "sad"
        : t < T.c1
          ? "angry"
          : t < T.c2
            ? "skeptical"
            : t < T.but
              ? "worried"
              : t < T.staying
                ? "shock"
                : t < T.brain5
                  ? "sad"
                  : t < T.wasting
                    ? "thinking"
                    : t < STUDY0
                      ? "determined"
                      : t < T.full
                        ? "curious"
                        : t < T.early
                          ? "excited"
                          : t < STUDY1
                            ? "skeptical"
                            : t < RIP
                              ? "determined"
                              : t < T.your10
                                ? "shock"
                                : t < T.ask
                                  ? "mindblown"
                                  : t < T.free
                                    ? "curious"
                                    : t < T.what
                                      ? "happy"
                                      : "wink";
  const bulb = (t: number) =>
    Math.max(bulbPulse(t, T.brain, 28), t >= T.brain5 && t < T.wasting + 8 ? 0.5 + 0.5 * Math.sign(Math.sin(t * 1.3)) : 0);

  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 2));
    q = addPose(addPose(q, hop(t, STAND_AT, 30)), shake(t, RIP));
    q = addPose(addPose(q, nod(t, T.plays)), shake(t, T.hate, 2));
    q = addPose(q, nod(t, T.paid, 1));
    if (!study) q = { ...q, x: q.x + (t >= LOOP - 2 ? 0 : interpolate(t, [STAND_AT, STAND_AT + 12], [0, WALK], { ...clamp, easing: Easing.out(Easing.cubic) })) };
    return q;
  };

  const coins = Array.from({ length: 4 }, (_, i) => {
    const t0 = T.money + i * 4;
    const t = interpolate(f, [t0, t0 + 26], [0, 1], clamp);
    const p = arc(t, [TK[0] - 30 + i * 22, TK[1] - 20], [700 + i * 110, 380 - i * 30], 260);
    return { p, t, op: f < t0 ? 0 : interpolate(t, [0, 0.7, 1], [1, 1, 0], clamp), s: 1 - t * 0.5 };
  });

  return (
    <Stage
      bg={study ? <StageBg f={f} /> : <Auditorium f={f} exitK={exitK} />}
      cam={cam}
      hits={[T.hundred, RIP, T.brain]}
      power={10}
      svg={
        study ? (
          <>
            {/* six season tickets; 4 get a %-OFF sticker at random */}
            {tixK > 0.01 && (
              <g opacity={tixK}>
                {TIX.map(([x, y], i) => {
                  const oi = OFF_IDX.indexOf(i);
                  const at = T.random + 4 + oi * 7;
                  return <SeasonTicket key={i} x={x} y={y} k={1.25 * popIn(f, STUDY0 + 6 + i * 3)} off={oi >= 0 ? popIn(f, at) : 0} rot={(i % 2 ? 3 : -3) + (oi >= 0 ? wobble(f, at, 8) : 0)} />;
                })}
              </g>
            )}
            {/* stub piles: full price used more tickets (first half of the season) */}
            {pileK > 0.01 && (
              <g opacity={pileK}>
                {[0, 1, 2, 3].map((i) => {
                  const at = T.full + 12 + i * 12;
                  const yy = interpolate(f, [at - 8, at], [700, GROUND - 34 - i * 66], { ...clamp, easing: Easing.in(Easing.quad) });
                  return f >= at - 8 ? <Stub key={i} x={530} y={yy} k={1.35 * squash(f, at, 0.2)[1]} col={TICKET} /> : null;
                })}
                {[0, 1, 2].map((i) => {
                  const at = T.full + 18 + i * 12;
                  const yy = interpolate(f, [at - 8, at], [700, GROUND - 34 - i * 66], { ...clamp, easing: Easing.in(Easing.quad) });
                  return f >= at - 8 ? <Stub key={i} x={835} y={yy} k={1.35 * squash(f, at, 0.2)[1]} col={CREAM} /> : null;
                })}
                <text x={530} y={GROUND + 60} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={GOLD} stroke={INK} strokeWidth={2}>
                  FULL PRICE
                </text>
                <text x={835} y={GROUND + 60} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={CREAM} stroke={INK} strokeWidth={2}>
                  DISCOUNT
                </text>
                <Burst x={530} y={GROUND - 250} at={T.plays} f={f} size={160} color={GOLD} />
                {halfK > 0.01 && (
                  <g transform={`translate(690 860) scale(${halfK}) rotate(${-3 + wobble(f, T.early + 6, 6)})`}>
                    <rect x={-210} y={-44} width={420} height={88} rx={14} fill={CREAM} {...K} />
                    <text y={16} textAnchor="middle" fontFamily={FONT.comic} fontSize={48} fill={VELVET}>
                      FIRST HALF ONLY
                    </text>
                  </g>
                )}
              </g>
            )}
            <Spark f={f} scale={SS} base={{ x: SX2, y: STANDY }} facing={1} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
          </>
        ) : (
          <>
            <Seat />
            {hourK > 0.01 && <Hourglass f={f} k={hourK} />}
            {/* coins leaving the ticket */}
            {coins.map(({ p, op, s }, i) =>
              op > 0.01 ? (
                <g key={i} transform={`translate(${p[0]} ${p[1]}) scale(${s})`} opacity={op}>
                  <circle r={34} fill={GOLD} {...K} strokeWidth={5} />
                  <text y={13} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill={INK}>
                    ₹
                  </text>
                </g>
              ) : null,
            )}
            <Ticket
              f={f}
              x={TK[0]}
              y={TK[1]}
              k={1}
              rot={tkRot}
              text={freeOn ? "FREE?" : "₹400"}
              textCol={freeOn ? "#1f9d57" : f >= T.gone && f < T.ask && !loopBack ? "#9a7a3a" : INK}
              flipX={tkFlipX * tsx}
              stamp={stampK * tsy}
            />
            <Spark
              f={f}
              scale={SS}
              base={{ x: SX, y: SITY }}
              facing={1}
              talk={(t) => mouthAt(t)}
              bulb={bulb}
              mood={mood}
              look={1}
              keys={sparkKeys}
              mod={sparkMod}
            >
              {(j) => <Chain a={[j.rFoot[0] + 4, j.rFoot[1] - 6]} b={NOTCH} paper={chainPaper} rip={standing ? Math.max(1.2, ripP) : ripP} f={f} />}
            </Spark>
          </>
        )
      }
      html={
        <>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 330, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", background: RED, color: "#fff", padding: "6px 34px", fontFamily: FONT.comic, fontSize: 110, border: `7px solid ${INK}`, borderRadius: 18, WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill" }}>
                PAID ₹400. HATE IT.
              </span>
            </div>
          )}
          <Slam f={f} at={T.wasting} out={STUDY0 - 6} x={540} y={330} size={130} color={GOLD} stroke={`11px ${INK}`} rotate={-3}>
            SUNK COST
          </Slam>
          <Slam f={f} at={RIP} out={T.your10 + 2} x={540} y={330} size={120} color={CREAM} stroke={`11px ${INK}`} rotate={3}>
            IT&apos;S PAPER
          </Slam>
          {f >= STUDY0 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1715, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: CREAM, whiteSpace: "nowrap", opacity: 0.9 }}>
                Arkes &amp; Blumer 1985 · 54 season-ticket buyers · Education, not financial advice
              </div>
              <div style={{ position: "absolute", right: 96, top: 1770, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: GOLD, letterSpacing: 2, opacity: 0.9 }}>YOUR BRAIN DID THIS</div>
            </>
          )}
          <VoiceCaptions f={f} y={1500} cues={VOICE_CUES} hi={["hate", "hate?", "hundred", "hundred.", "hours", "hours.", "gone", "back", "back.", "wasting", "discounts", "discounts.", "more", "least", "least.", "holding", "brain", "free", "free,", "stay", "stay?", "paid", "paid?"]} />
          <Transition f={f} at={STUDY0} kind="slice" size={VERTICAL} colors={[VELVET, GOLD, CREAM]} />
        </>
      }
    />
  );
};
