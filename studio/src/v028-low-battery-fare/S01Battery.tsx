import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V028 · "Does your cab cost more when your battery is low?" (Myth check, ~40 s, clarity rules 2026-10-29)
// Two places only, each change announced by the narration:
// A) A rainy night street with a bus stop and a streetlight. Spark holds a big phone: battery 5% (red), a cab app
//    with FARE ₹ ? and a BOOK button. "You might pay extra": the fare arrow climbs and coins drop out of the phone.
//    "In 2016" card → "a cab company checked its own data" → iris into
// B) the company's bright data room: a big wall screen. FULL vs ALMOST EMPTY phones get YES ticks (illustration),
//    more ticks on the empty side. "The company says": battery ✗ price. "Prices go up when many people want a car":
//    a map fills with people, few cars, the PRICE arrow rises.
// A again) "Back on the street": PRICE: SAME. "Rush and say yes": a ticking clock, BOOK → YES. "Charge early": the
//    battery fills green, two fare cards to compare. Comment question; loops into frame 0.
// Sources: Keith Chen (Uber) on NPR Hidden Brain 2016; Uber Pricing Principles.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: rainy indigo night street + bright cream data room
const SKY1 = "#1f2150";
const SKY2 = "#3a3577";
const BLDG = "#2b2a5e";
const WIN = "#ffd36e";
const ROAD = "#34345a";
const ROAD2 = "#4a4a78";
const LAMP = "#ffe9a3";
const ROOM = "#fff1d6";
const ROOM2 = "#f2dcb4";
const FLOORB = "#d9bf93";
const SCREEN = "#1d2a4a";
const SCREEN2 = "#2c3d66";
const RED = "#ff4d5a";
const GREEN = "#3fcf6a";
const GOLD = "#ffd23f";
const ORANGE = "#ff8a3d";
const CREAM = "#fff8e8";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  battery0: W(0, 7),
  low0: W(0, 9),
  c1: C(1),
  pay1: W(1, 2),
  extra1: W(1, 3),
  why1: W(1, 6),
  c2: C(2),
  y2016: W(2, 1),
  company2: W(2, 4),
  data2: W(2, 8),
  c3: C(3),
  empty3: W(3, 3),
  accepted3: W(3, 5),
  more3: W(3, 8),
  c4: C(4),
  says4: W(4, 3),
  battery4: W(4, 4),
  not4: W(4, 6),
  c5: C(5),
  many5: W(5, 4),
  want5: W(5, 6),
  car5: W(5, 8),
  c6: C(6),
  street6: W(6, 3),
  not6: W(6, 7),
  c7: C(7),
  rush7: W(7, 5),
  yes7: W(7, 8),
  c8: C(8),
  phone8: W(8, 2),
  compare8: W(8, 7),
  c9: C(9),
  dying9: W(9, 7),
};
const LOOP = VOICE_FRAMES - 14;
const ROOM0 = T.company2 + 10; // iris into the data room right after "company"
const BACK = T.street6; // cut back to the street on "street"

// staging
const SX_A = 450; // Spark on the street
const SX_B = 865; // Spark in the data room
const LAMPX = 880;
const SCR = { x: 60, y: 470, w: 700, h: 560 }; // wall screen

// rough phone position on the street (for the camera)
const PHX = SX_A + 175;
const PHY = HEADY + 95;

// shots: one camera move per sentence, held 2.2–4 s, slow moves (clarity rules)
const SHOTS: Shot[] = [
  { f: 0, z: 1.3, at: [SX_A + 90, HEADY + 120], e: "cut" }, // frame 0: Spark + phone
  { f: 4, z: 1.42, at: [SX_A + 100, HEADY + 110], e: "slow" }, // slow push while he asks
  { f: T.c1 - 4, z: 1.8, at: [PHX, PHY + 30], e: "slow" }, // INSERT: the phone, fare arrow, coins
  { f: T.c2 - 4, z: 1.15, at: [SX_A + 80, HEADY + 40], e: "slow" }, // MED: 2016 card
  { f: ROOM0, z: 1.06, at: [540, 880], e: "cut" }, // WIDE: data room
  { f: T.c3 - 6, z: 1.15, at: [520, 830], e: "slow" }, // MED: the screen, FULL vs ALMOST EMPTY
  { f: T.c4 - 6, z: 1.1, at: [545, 850], e: "slow" }, // MED: company says
  { f: T.c5 - 6, z: 1.2, at: [500, 820], e: "slow" }, // INSERT: the map
  { f: BACK, z: 1.3, at: [SX_A + 110, HEADY + 80], e: "cut" }, // MED: back on the street
  { f: T.c7 - 6, z: 1.7, at: [PHX, PHY + 10], e: "slow" }, // INSERT: phone + clock
  { f: T.c8 - 6, z: 1.2, at: [SX_A + 30, HEADY + 20], e: "slow" }, // MED: charge + compare
  { f: T.c9 - 6, z: 1.55, at: [SX_A + 90, HEADY + 80], e: "slow" }, // CU: question
  { f: LOOP, z: 1.3, at: [SX_A + 90, HEADY + 120], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={w} fontSize={s} fill={c}>
    {children}
  </text>
);

// battery icon centred at (0,0): v = 0..1 charge
const BatteryIcon: React.FC<{ v: number; s?: number; blink?: number; plug?: boolean }> = ({ v, s = 1, blink = 1, plug = false }) => {
  const col = v < 0.2 ? RED : v < 0.5 ? GOLD : GREEN;
  return (
    <g transform={`scale(${s})`}>
      <rect x={-34} y={-17} width={64} height={34} rx={7} fill={WHITE} stroke={INK} strokeWidth={4} />
      <rect x={30} y={-8} width={8} height={16} rx={2} fill={INK} />
      <rect x={-29} y={-12} width={Math.max(3, 54 * v)} height={24} rx={4} fill={col} opacity={blink} />
      {plug && <path d="M -4 -14 L -12 3 L -2 3 L -6 16 L 8 -4 L -2 -4 L 4 -14 Z" fill={GOLD} stroke={INK} strokeWidth={2.5} />}
    </g>
  );
};

type Screen = "fare" | "same" | "book" | "yes" | "calm";
// the big phone, centred at (0,0), about 160 x 290
const BigPhone: React.FC<{ f: number; v: number; mode: Screen; arrow: number; plug?: boolean; tap?: number }> = ({ f, v, mode, arrow, plug = false, tap = 0 }) => {
  const low = v < 0.2;
  const blink = low ? interpolate(Math.sin(f / 4), [-1, 1], [0.35, 1]) : 1;
  const pct = Math.round(v * 100);
  return (
    <g>
      <rect x={-82} y={-148} width={164} height={296} rx={24} fill="#16161e" {...K} strokeWidth={6} />
      <rect x={-70} y={-130} width={140} height={262} rx={12} fill={CREAM} />
      {/* status bar */}
      <g transform="translate(26 -110)">
        <BatteryIcon v={v} s={0.62} blink={blink} plug={plug} />
      </g>
      <Txt x={-8} y={-102} s={24} c={low ? RED : INK} a="end">
        {pct}%
      </Txt>
      {/* cab card */}
      <rect x={-60} y={-82} width={120} height={58} rx={10} fill={GOLD} stroke={INK} strokeWidth={3} />
      <rect x={-40} y={-66} width={44} height={20} rx={6} fill={WHITE} stroke={INK} strokeWidth={2.5} />
      <circle cx={-32} cy={-44} r={6} fill={INK} />
      <circle cx={-4} cy={-44} r={6} fill={INK} />
      <Txt x={34} y={-46} s={22}>
        CAB
      </Txt>
      {/* fare */}
      <Txt y={-2} s={20} c="#666">
        FARE
      </Txt>
      {mode === "same" ? (
        <Txt y={44} s={36} c={INK}>
          SAME
        </Txt>
      ) : (
        <Txt x={arrow > 0.01 ? -14 : 0} y={44} s={42}>
          ₹ ?
        </Txt>
      )}
      {arrow > 0.01 && mode !== "same" && (
        <g transform={`translate(40 ${36 - 14 * arrow}) scale(${arrow})`}>
          <path d="M 0 -22 L 14 0 L 5 0 L 5 18 L -5 18 L -5 0 L -14 0 Z" fill={RED} stroke={INK} strokeWidth={3} />
        </g>
      )}
      {/* BOOK / YES button */}
      <g transform={`translate(0 96) scale(${1 - 0.08 * tap})`}>
        <rect x={-54} y={-24} width={108} height={48} rx={24} fill={mode === "yes" ? GREEN : mode === "calm" ? WHITE : ORANGE} stroke={INK} strokeWidth={4} />
        <Txt y={10} s={26} c={mode === "calm" ? INK : WHITE}>
          {mode === "yes" ? "YES!" : "BOOK"}
        </Txt>
      </g>
    </g>
  );
};

// a small phone used in the data-room illustration
const MiniPhone: React.FC<{ v: number; mark: number; ok: boolean }> = ({ v, mark, ok }) => (
  <g>
    <rect x={-30} y={-46} width={60} height={92} rx={10} fill="#16161e" stroke={WHITE} strokeWidth={3} />
    <rect x={-24} y={-38} width={48} height={74} rx={5} fill={CREAM} />
    <g transform="translate(0 -14)">
      <BatteryIcon v={v} s={0.55} />
    </g>
    {mark > 0.01 && (
      <g transform={`translate(70 0) scale(${mark})`}>
        <circle r={30} fill={ok ? GREEN : "#8a8fa8"} stroke={WHITE} strokeWidth={4} />
        <Txt y={13} s={36} c={WHITE}>
          {ok ? "✓" : "✗"}
        </Txt>
      </g>
    )}
  </g>
);

// world A: rainy night street
const Street: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="v028sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKY1} />
        <stop offset="1" stopColor={SKY2} />
      </linearGradient>
      <radialGradient id="v028lamp" cx="0.5" cy="0" r="1">
        <stop offset="0" stopColor={LAMP} stopOpacity={0.55} />
        <stop offset="1" stopColor={LAMP} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#v028sky)" />
    {/* buildings with lit windows */}
    {[
      [0, 520, 230],
      [250, 640, 200],
      [470, 470, 240],
      [730, 590, 350],
    ].map(([x, top, w], i) => (
      <g key={i}>
        <rect x={x} y={top} width={w} height={GROUND - top} fill={BLDG} />
        {Array.from({ length: Math.floor((GROUND - top - 300) / 90) }, (_, r) =>
          Array.from({ length: Math.floor(w / 70) }, (_, c) => ((r * 3 + c + i) % 4 !== 0 ? <rect key={`${r}-${c}`} x={x + 22 + c * 70} y={top + 40 + r * 90} width={34} height={46} rx={4} fill={WIN} opacity={0.55 + 0.25 * ((r + c + i) % 2)} /> : null)),
        )}
      </g>
    ))}
    {/* pavement + wet road */}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={ROAD} />
    <rect y={GROUND} width={1080} height={26} fill={ROAD2} />
    {Array.from({ length: 5 }, (_, i) => (
      <rect key={i} x={60 + i * 240} y={GROUND + 150} width={120} height={14} rx={7} fill={WHITE} opacity={0.35} />
    ))}
    <ellipse cx={LAMPX - 140} cy={GROUND + 70} rx={260} ry={30} fill={LAMP} opacity={0.18} />
    {/* bus stop shelter (left) */}
    <g>
      <rect x={40} y={GROUND - 430} width={260} height={24} rx={6} fill="#5a6a9a" {...K} strokeWidth={5} />
      <rect x={52} y={GROUND - 406} width={12} height={406} fill="#8a96bd" stroke={INK} strokeWidth={4} />
      <rect x={276} y={GROUND - 406} width={12} height={406} fill="#8a96bd" stroke={INK} strokeWidth={4} />
      <rect x={70} y={GROUND - 400} width={200} height={250} rx={6} fill="#9fb6ff" opacity={0.25} stroke={INK} strokeWidth={3} />
      <rect x={70} y={GROUND - 120} width={200} height={20} rx={5} fill="#c58a4a" stroke={INK} strokeWidth={4} />
      <rect x={90} y={GROUND - 100} width={10} height={100} fill={INK} />
      <rect x={240} y={GROUND - 100} width={10} height={100} fill={INK} />
    </g>
    {/* streetlight */}
    <path d={`M ${LAMPX - 300} ${GROUND} L ${LAMPX - 20} ${GROUND - 640} L ${LAMPX + 70} ${GROUND - 640} L ${LAMPX + 180} ${GROUND} Z`} fill="url(#v028lamp)" />
    <rect x={LAMPX + 60} y={GROUND - 700} width={16} height={700} fill="#56597e" stroke={INK} strokeWidth={4} />
    <path d={`M ${LAMPX + 68} ${GROUND - 700} Q ${LAMPX + 60} ${GROUND - 760} ${LAMPX} ${GROUND - 740}`} fill="none" stroke={INK} strokeWidth={10} />
    <path d={`M ${LAMPX - 50} ${GROUND - 720} L ${LAMPX + 40} ${GROUND - 720} L ${LAMPX + 20} ${GROUND - 650} L ${LAMPX - 30} ${GROUND - 650} Z`} fill={LAMP} stroke={INK} strokeWidth={5} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// gentle rain on top of the street
const Rain: React.FC<{ f: number }> = ({ f }) => (
  <g opacity={0.45}>
    {Array.from({ length: 46 }, (_, i) => {
      const x0 = (i * 173) % 1140;
      const y = (((i * 311 + f * 26) % 2000) + 2000) % 2000 - 80;
      const x = x0 - y * 0.12;
      return <line key={i} x1={x} y1={y} x2={x - 7} y2={y + 54} stroke="#cfd8ff" strokeWidth={3} strokeLinecap="round" />;
    })}
  </g>
);

// world B: the company's data room
const Room: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={ROOM} />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={i * 140} y={0} width={70} height={GROUND} fill={ROOM2} opacity={0.35} />
    ))}
    {/* sign */}
    <g transform="translate(410 360)">
      <rect x={-230} y={-48} width={460} height={92} rx={16} fill={GOLD} {...K} strokeWidth={6} />
      <Txt y={20} s={56}>
        CAB COMPANY
      </Txt>
    </g>
    <rect x={0} y={GROUND - 34} width={1080} height={34} fill={ROOM2} stroke={INK} strokeWidth={4} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={FLOORB} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    {/* screen stand */}
    <rect x={SCR.x + SCR.w / 2 - 20} y={SCR.y + SCR.h} width={40} height={GROUND - SCR.y - SCR.h} fill="#9aa6b8" stroke={INK} strokeWidth={5} />
    <rect x={SCR.x + SCR.w / 2 - 120} y={GROUND - 24} width={240} height={24} rx={8} fill="#9aa6b8" stroke={INK} strokeWidth={5} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [2, "swish", 0.12],
  [T.battery0, "tick", 0.2],
  [T.extra1, "pop", 0.25],
  [T.extra1 + 10, "clink", 0.25],
  [T.why1, "tick", 0.15],
  [T.y2016, "pop", 0.3],
  [ROOM0 - 8, "whoosh_long", 0.3],
  [T.data2, "ding", 0.2],
  ...[0, 1, 2].map((i) => [T.accepted3 + i * 7, "pop", 0.2] as SfxCue),
  ...[0, 1, 2].map((i) => [T.more3 - 4 + i * 7, "pop", 0.25] as SfxCue),
  [T.says4, "pop", 0.25],
  [T.not4, "stamp", 0.35],
  [T.many5, "pop", 0.2],
  [T.want5, "riser", 0.15],
  [BACK - 6, "whoosh", 0.2],
  [T.not6, "tick", 0.2],
  [T.rush7 - 10, "tick", 0.2],
  [T.rush7, "tick", 0.2],
  [T.rush7 + 10, "tick", 0.2],
  [T.yes7, "pop", 0.3],
  [T.phone8, "ding", 0.25],
  [T.compare8, "pop", 0.2],
  [T.c9 - 4, "whoosh", 0.12],
  [LOOP, "tick", 0.15],
];

// Spark holds the phone in his right hand in front of his chest
const HOLD: Partial<Pose> = { ra1: 50, ra2: 85, la1: -14, la2: 8, head: 8 };
const HOLD_HIP: Partial<Pose> = { ra1: 50, ra2: 85, la1: -60, la2: 80, head: 8 };
const HOLD_RECOIL: Partial<Pose> = { ra1: 50, ra2: 85, la1: -60, la2: 60, head: -10, lean: -10 };
const HOLD_UP: Partial<Pose> = { ra1: 50, ra2: 85, la1: -165, la2: 5, head: -8 };
const HOLD_TAP: Partial<Pose> = { ra1: 50, ra2: 85, la1: 40, la2: 70, head: 14, lean: 6 };
const HOLD_RELAX: Partial<Pose> = { ra1: 50, ra2: 85, la1: -30, la2: 20, head: 4 };
const OFFER: Partial<Pose> = { ra1: 80, ra2: 30, la1: -16, la2: 10, lean: 8, head: 6 };

export const S01Battery: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const room = f >= ROOM0 && f < BACK && !loopBack;
  const street = !room;
  const late = street && f >= BACK && !loopBack; // second half on the street
  const cam = camAt(f, SHOTS, VERTICAL);

  // --- street, first half ---
  const arrow = street && !late && !loopBack && f < T.c2 + 10 ? ease(f, T.pay1, T.extra1 + 6, 0, 1) : 0;
  const yearK = street && !late && f >= T.y2016 - 2 ? popIn(f, T.y2016 - 2) : 0;

  // --- data room ---
  const markK = (at: number) => (room && f >= at ? popIn(f, at) : 0);
  const s3 = room && f >= T.c3 - 6 && f < T.c4 - 4;
  const s4 = room && f >= T.c4 - 4 && f < T.c5 - 4;
  const s5 = room && f >= T.c5 - 4;
  const s2 = room && !s3 && !s4 && !s5;
  const sayK = s4 ? popIn(f, T.c4 - 4) : 0;
  const stampK = s4 && f >= T.not4 - 2 ? popIn(f, T.not4 - 2) : 0;
  const people = s5 ? Math.round(ease(f, T.many5 - 6, T.want5 + 6, 3, 20)) : 0;
  const priceUp = s5 ? ease(f, T.want5, T.car5 + 14, 0, 1) : 0;

  // --- street, second half ---
  const sameK = late && f < T.c7 - 4 && f >= T.not6 - 4 ? popIn(f, T.not6 - 4) : 0;
  const rushing = late && f >= T.c7 && f < T.c8 - 4;
  const yes = late && f >= T.yes7 && f < T.c8 - 4;
  const charging = late && f >= T.c8 - 4;
  const batt = charging ? ease(f, T.phone8 - 6, T.compare8, 0.05, 1) : 0.05;
  const cardsK = charging && f >= T.compare8 - 8 ? popIn(f, T.compare8 - 8) : 0;
  const tap = rushing ? Math.max(0, Math.sin(f / 2.2)) : 0;
  const mode: Screen = yes ? "yes" : sameK > 0 ? "same" : charging ? "calm" : "fare";

  // --- Spark ---
  const sx = room ? SX_B : SX_A;
  const sparkKeys = street
    ? gestureKeys([
        [0, HOLD_HIP],
        [T.c1, HOLD_RECOIL, "snap"],
        [T.c2, HOLD_UP, "smooth"],
        [T.company2, HOLD, "smooth"],
        [BACK, HOLD, "snap"],
        [T.not6, HOLD_HIP, "smooth"],
        [T.c7, HOLD_TAP, "smooth"],
        [T.c8, HOLD_RELAX, "smooth"],
        [T.compare8, HOLD_UP, "smooth"],
        [T.c9 - 4, OFFER, "smooth"],
        [LOOP - 4, HOLD_HIP, "snap"],
      ])
    : gestureKeys([
        [ROOM0, G.presentBoth],
        [T.c3, G.pointSide, "smooth"],
        [T.accepted3, G.thinkChin, "smooth"],
        [T.more3, G.mindBlown, "snap"],
        [T.c4, G.armsCrossed, "smooth"],
        [T.not4, G.present, "smooth"],
        [T.c5, G.pointSide, "smooth"],
        [T.car5, G.pointUp, "smooth"],
      ]);
  const facing = room ? -1 : 1;
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "worried";
    if (t < T.c1) return "worried";
    if (t < T.c2) return "shock";
    if (t < ROOM0) return "curious";
    if (t < T.c3) return "curious";
    if (t < T.more3) return "thinking";
    if (t < T.c4) return "mindblown";
    if (t < T.not4) return "skeptical";
    if (t < T.c5) return "smug";
    if (t < BACK) return "excited";
    if (t < T.c7) return "neutral";
    if (t < T.c8) return "worried";
    if (t < T.c9) return "happy";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.more3, 30), bulbPulse(t, T.rush7, 34), bulbPulse(t, T.phone8, 30));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.extra1, 3));
    q = addPose(q, hop(t, T.more3, 12));
    q = addPose(q, nod(t, T.not4, 1));
    q = addPose(q, nod(t, T.not6, 1));
    if (rushing) q = addPose(q, { la2: 70 + 10 * Math.sin(t / 2.2) - (p.la2 ?? 0) * 0 });
    q = addPose(q, nod(t, T.dying9, 1));
    return { ...q, x: sx };
  };

  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={facing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) => {
        if (room) return null;
        const px = j.rHand[0] + 40;
        const py = j.rHand[1] - 70;
        // coins drop out of the phone on "extra"
        const coins =
          !late && f >= T.extra1 && f < T.c2 + 6
            ? [0, 1, 2, 3].map((i) => {
                const t = f - T.extra1 - i * 5;
                if (t < 0) return null;
                const y = py + 150 + 0.9 * t * t;
                if (y > GROUND - 14) return <ellipse key={i} cx={px - 50 + i * 32} cy={GROUND - 10} rx={18} ry={7} fill={GOLD} stroke={INK} strokeWidth={3} />;
                return (
                  <g key={i} transform={`translate(${px - 50 + i * 32} ${y})`}>
                    <circle r={17} fill={GOLD} stroke={INK} strokeWidth={4} />
                    <Txt y={8} s={20}>
                      ₹
                    </Txt>
                  </g>
                );
              })
            : null;
        return (
          <>
            {charging && (
              <>
                <path d={`M ${px} ${py + 148} C ${px} ${py + 260} ${px + 120} ${py + 200} ${px + 130} ${GROUND - 60}`} fill="none" stroke={INK} strokeWidth={7} />
                <rect x={px + 95} y={GROUND - 64} width={70} height={64} rx={10} fill="#5a6a9a" stroke={INK} strokeWidth={5} />
                <path d={`M ${px + 126} ${GROUND - 52} l -9 18 l 10 0 l -4 16 l 14 -22 l -10 0 l 5 -12 Z`} fill={GOLD} stroke={INK} strokeWidth={2} />
              </>
            )}
            <g transform={`translate(${px} ${py}) rotate(${-4 + (rushing ? 2 * Math.sin(f / 1.5) : 0)})`}>
              <BigPhone f={f} v={batt} mode={mode} arrow={arrow} plug={charging} tap={tap} />
            </g>
            {coins}
            {/* rush: tap rings on the button + a ticking clock */}
            {rushing && (
              <>
                <circle cx={px} cy={py + 96} r={30 + 26 * ((f % 10) / 10)} fill="none" stroke={WHITE} strokeWidth={5} opacity={1 - (f % 10) / 10} />
                <g transform={`translate(${px + 150} ${py - 170}) scale(${popIn(f, T.c7)})`}>
                  <circle r={52} fill={WHITE} stroke={INK} strokeWidth={6} />
                  <line x1={0} y1={0} x2={0} y2={-36} stroke={INK} strokeWidth={6} strokeLinecap="round" />
                  <line x1={0} y1={0} x2={30 * Math.sin(f / 3)} y2={-30 * Math.cos(f / 3)} stroke={RED} strokeWidth={5} strokeLinecap="round" />
                </g>
                {[0, 1].map((i) => (
                  <path key={i} d={`M ${j.headC[0] - 70 - i * 20} ${j.headC[1] - 40 + i * 30} q -10 18 0 26 q 10 -8 0 -26 Z`} fill="#9fd8ff" stroke={INK} strokeWidth={2.5} opacity={0.6 + 0.4 * Math.sin(f / 3 + i)} />
                ))}
              </>
            )}
            {sameK > 0.01 && (
              <g transform={`translate(${px + 10} ${py - 210}) scale(${sameK}) rotate(${wobble(f, T.not6, 4)})`}>
                <rect x={-150} y={-44} width={300} height={84} rx={16} fill={WHITE} {...K} strokeWidth={6} />
                <Txt y={16} s={44}>
                  PRICE: SAME
                </Txt>
              </g>
            )}
          </>
        );
      }}
    </Spark>
  );

  // the wall screen content (room)
  const screenEl = room && (
    <g transform={`translate(${SCR.x} ${SCR.y})`}>
      <rect x={-16} y={-16} width={SCR.w + 32} height={SCR.h + 32} rx={22} fill="#3b3f52" {...K} strokeWidth={6} />
      <rect width={SCR.w} height={SCR.h} rx={10} fill={SCREEN} />
      {s2 && (
        <g>
          <Txt x={SCR.w / 2} y={80} s={50} c={WHITE}>
            RIDE DATA · 2016
          </Txt>
          {Array.from({ length: 7 }, (_, r) => {
            const y = 130 + ((r * 56 + (f - ROOM0) * 1.6) % 392);
            return <rect key={r} x={60} y={y} width={SCR.w - 120 - (r % 3) * 90} height={26} rx={8} fill={SCREEN2} />;
          })}
        </g>
      )}
      {s3 && (
        <g>
          <Txt x={SCR.w / 2} y={66} s={40} c={WHITE}>
            ACCEPTED HIGH PRICE?
          </Txt>
          <Txt x={190} y={130} s={34} c={GREEN}>
            FULL
          </Txt>
          <Txt x={500} y={130} s={34} c={RED}>
            ALMOST EMPTY
          </Txt>
          <line x1={SCR.w / 2 - 10} y1={110} x2={SCR.w / 2 - 10} y2={SCR.h - 40} stroke={SCREEN2} strokeWidth={6} />
          {[0, 1, 2].map((i) => (
            <g key={`l${i}`} transform={`translate(160 ${210 + i * 110})`}>
              <MiniPhone v={0.9} mark={markK(T.accepted3 + i * 7)} ok={i === 0} />
            </g>
          ))}
          {[0, 1, 2].map((i) => (
            <g key={`r${i}`} transform={`translate(470 ${210 + i * 110})`}>
              <MiniPhone v={0.06} mark={markK(T.more3 - 4 + i * 7)} ok={i < 2} />
            </g>
          ))}
          <text x={SCR.w - 16} y={SCR.h - 14} textAnchor="end" fontFamily={FONT.body} fontWeight={700} fontSize={20} fill="#aab4d4">
            illustration
          </text>
        </g>
      )}
      {s4 && (
        <g transform={`translate(${SCR.w / 2} 0)`}>
          <Txt y={80} s={44} c={GOLD}>
            THE COMPANY SAYS:
          </Txt>
          <g transform={`translate(0 270) scale(${sayK})`}>
            <g transform="translate(-200 0)">
              <BatteryIcon v={0.06} s={2.4} />
            </g>
            <line x1={-90} y1={0} x2={90} y2={0} stroke={WHITE} strokeWidth={10} strokeDasharray="18 14" />
            <path d="M 90 -22 L 120 0 L 90 22 Z" fill={WHITE} />
            {/* price tag */}
            <g transform="translate(210 0)">
              <path d="M -60 -50 L 50 -50 L 80 0 L 50 50 L -60 50 Z" fill={GOLD} stroke={INK} strokeWidth={5} />
              <circle cx={44} cy={0} r={9} fill={SCREEN} />
              <Txt x={-8} y={14} s={40}>
                ₹
              </Txt>
            </g>
          </g>
          {stampK > 0.01 && (
            <g transform={`translate(0 270) scale(${1.6 - 0.6 * stampK}) rotate(-8)`} opacity={stampK}>
              <circle r={70} fill={RED} stroke={WHITE} strokeWidth={8} />
              <Txt y={30} s={90} c={WHITE}>
                ✗
              </Txt>
            </g>
          )}
          <Txt y={470} s={34} c={WHITE}>
            {f >= T.battery4 ? "BATTERY DOES NOT CHANGE PRICES" : ""}
          </Txt>
        </g>
      )}
      {s5 && (
        <g>
          {/* city map */}
          {[110, 230, 350, 470].map((y) => (
            <rect key={`h${y}`} x={30} y={y} width={480} height={18} fill={SCREEN2} />
          ))}
          {[110, 260, 410].map((x) => (
            <rect key={`v${x}`} x={x} y={40} width={18} height={480} fill={SCREEN2} />
          ))}
          {Array.from({ length: people }, (_, i) => {
            const x = 50 + ((i * 97) % 440);
            const y = 70 + ((i * 151) % 430);
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${popIn(f, T.many5 - 6 + i * 3)})`}>
                <circle cy={-12} r={9} fill={ORANGE} />
                <rect x={-8} y={-2} width={16} height={18} rx={6} fill={ORANGE} />
              </g>
            );
          })}
          {[
            [160, 230],
            [330, 110],
            [420, 400],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y + 9})`}>
              <rect x={-24} y={-14} width={48} height={24} rx={8} fill={GOLD} stroke={INK} strokeWidth={3} />
              <circle cx={-12} cy={12} r={6} fill={INK} />
              <circle cx={12} cy={12} r={6} fill={INK} />
            </g>
          ))}
          <Txt x={270} y={SCR.h - 6} s={30} c={WHITE}>
            {people > 6 ? "MANY PEOPLE" : ""}
          </Txt>
          {/* PRICE gauge */}
          <g transform="translate(610 0)">
            <Txt y={70} s={34} c={WHITE}>
              PRICE
            </Txt>
            <rect x={-40} y={100} width={80} height={380} rx={14} fill={SCREEN2} />
            <rect x={-30} y={470 - 360 * (0.25 + 0.7 * priceUp)} width={60} height={360 * (0.25 + 0.7 * priceUp) - 10} rx={10} fill={priceUp > 0.5 ? RED : GOLD} />
            {priceUp > 0.3 && <path d={`M 0 ${80 - 10 * priceUp} l 26 30 l -52 0 Z`} fill={RED} stroke={WHITE} strokeWidth={3} transform={`translate(0 ${70 - 60 * priceUp})`} />}
          </g>
        </g>
      )}
    </g>
  );

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: room ? ROOM : SKY1 }} />}
      cam={cam}
      hits={[]}
      power={4}
      svg={
        street ? (
          <>
            <Street f={f} />
            {sparkEl}
            {cardsK > 0.01 &&
              [0, 1].map((i) => (
                <g key={i} transform={`translate(${SX_A - 140 + i * 280} ${HEADY - 300}) scale(${popIn(f, T.compare8 - 8 + i * 6)}) rotate(${i ? 4 : -4})`}>
                  <rect x={-110} y={-80} width={220} height={160} rx={18} fill={WHITE} {...K} strokeWidth={6} />
                  <Txt y={-26} s={36}>
                    {`CAB ${i + 1}`}
                  </Txt>
                  <rect x={-70} y={10} width={i ? 90 : 140} height={30} rx={10} fill={i ? GREEN : GOLD} stroke={INK} strokeWidth={3} />
                  <Txt x={-70} y={70} s={22} a="start" c="#555">
                    FARE
                  </Txt>
                </g>
              ))}
            <Rain f={f} />
          </>
        ) : (
          <>
            <Room />
            {screenEl}
            {sparkEl}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words) */}
          {(f < T.c1 - 6 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 104, transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`, opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 6], [1, 0], clamp) }}>
              <div style={{ color: RED, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>LOW BATTERY</div>
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>HIGHER FARE?</div>
            </div>
          )}
          {yearK > 0.01 && f < ROOM0 && (
            <div style={{ position: "absolute", left: 540, top: 420, transform: `translate(-50%,-50%) scale(${yearK}) rotate(-3deg)`, background: WHITE, border: `6px solid ${INK}`, borderRadius: 22, padding: "10px 40px", fontFamily: FONT.title, fontWeight: 900, fontSize: 96, color: INK }}>
              2016
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1690, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: INK, whiteSpace: "nowrap", opacity: 0.9, background: "rgba(255,255,255,0.82)", padding: "2px 12px", borderRadius: 8 }}>
                Uber economist K. Chen, NPR Hidden Brain 2016 · Uber Pricing Principles
              </div>
              <div style={{ position: "absolute", left: 96, top: 1742, fontFamily: FONT.body, fontWeight: 700, fontSize: 22, color: room ? INK : WHITE, opacity: 0.85 }}>Education, not financial advice</div>
              <div style={{ position: "absolute", right: 96, top: 1738, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: room ? "#b5651d" : GOLD, WebkitTextStroke: `1px ${INK}`, letterSpacing: 2, opacity: 0.95 }}>MYTH CHECK</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["cab", "battery", "low?", "extra", "2016,", "data.", "empty", "accepted", "often.", "not", "change", "many", "car.", "street,", "rush", "yes.", "Charge", "early,", "compare", "dying"]}
          />
          <Transition f={f} at={ROOM0} kind="iris" size={VERTICAL} colors={[GOLD, ROOM, SKY2]} />
        </>
      }
    />
  );
};
