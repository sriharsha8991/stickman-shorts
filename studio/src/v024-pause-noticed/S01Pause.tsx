import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
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

// V024 · "You stopped scrolling for two seconds, and your app noticed." (Designed to get you, ~40 s, clarity rules)
// Two places only, each change announced by the narration:
// A) A coral evening balcony with string lights: Spark next to a big phone on a little table. The feed stops on a
//    CAKE post; a timer counts to 2.0 s; a stopwatch pops ("noticed"). The heart stays empty (LIKES). More cakes
//    scroll by and a clock spins (HOURS). "Imagine a helper inside the app…" → iris into the phone →
// B) INSIDE THE APP: a cream back room, a big screen, an orange HELPER holding a stopwatch. LOOK TIME list
//    (shoe short, cake long, car short), 2015 card TIME COUNTS, the screen fills with cakes (MORE LIKE THIS),
//    a video bar fills to the end (WATCHED TO THE END ✓), stopwatch → YOUR NEXT POSTS.
// A again) "Back on the balcony": ⋯ menu → NOT INTERESTED → the cake slides away, a sunset post comes in.
// Sources: Facebook newsroom 2015 (time spent); TikTok newsroom 2020; Instagram 2021 (via Engadget).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: coral sunset balcony + cream "inside the app" room
const SKY1 = "#ff9a76";
const SKY2 = "#ffc48a";
const SKY3 = "#ffdca8";
const CITY = "#c86a6a";
const RAIL = "#5a3a4a";
const DECK = "#9b5e4a";
const ROOM = "#fff1d6";
const ROOM2 = "#f8e2bb";
const ROOMF = "#c9a98a";
const SCREEN = "#24304f";
const SCREEN2 = "#34436b";
const RED = "#ff4d5a";
const GREEN = "#3fcf6a";
const GOLD = "#ffd23f";
const ORANGE = "#ff8a3d";
const PINK = "#ff9ec4";
const PAPER = "#fffaf0";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  stopped0: W(0, 1),
  two0: W(0, 4),
  noticed0: W(0, 9),
  c1: C(1),
  likes1: W(1, 4),
  c2: C(2),
  waste2: W(2, 3),
  hours2: W(2, 4),
  c3: C(3),
  helper3: W(3, 2),
  inside3: W(3, 3),
  watch3: W(3, 8),
  c4: C(4),
  counts4: W(4, 1),
  look4: W(4, 5),
  each4: W(4, 7),
  c5: C(5),
  y2015: W(5, 1),
  counts5: W(5, 5),
  c6: C(6),
  more6: W(6, 4),
  c7: C(7),
  finishing7: W(7, 4),
  counts7: W(7, 7),
  c8: C(8),
  pauses8: W(8, 2),
  next8: W(8, 6),
  c9: C(9),
  balcony9: W(9, 3),
  tap9: W(9, 4),
  not9: W(9, 5),
  less9: W(9, 9),
  c10: C(10),
  pause10: W(10, 3),
  today10: W(10, 5),
};
const LOOP = VOICE_FRAMES - 14;
const INSIDE = T.inside3; // iris into the phone on "inside"
const BACK = T.c9; // cut back to the balcony on "Back"

// staging — balcony
const SX_A = 330;
const TABLE = { x: 760, top: GROUND - 250 };
const PX = TABLE.x;
const PY = TABLE.top - 20 - 270; // big phone centre
// staging — inside the app
const SX_B = 880;
const HX = 230; // helper
const SCR = { x0: 100, x1: 800, y0: 420, y1: 870 };
const SCX = (SCR.x0 + SCR.x1) / 2;
const SCY = (SCR.y0 + SCR.y1) / 2;

const SHOTS: Shot[] = [
  { f: 0, z: 1.12, at: [560, 860], e: "cut" }, // frame 0: Spark + phone
  { f: 4, z: 1.2, at: [580, 860], e: "slow" },
  { f: T.c1 - 4, z: 1.45, at: [PX - 40, PY + 40], e: "slow" }, // INSERT: phone heart
  { f: T.c2 - 4, z: 1.1, at: [540, 820], e: "slow" }, // MED: clock + phone
  { f: T.c3 - 4, z: 1.3, at: [PX - 60, PY], e: "slow" }, // push towards the phone
  { f: INSIDE, z: 1.0, at: [540, 880], e: "cut" }, // WIDE: inside the app
  { f: T.c4 - 6, z: 1.1, at: [520, 740], e: "slow" }, // MED: LOOK TIME board
  { f: T.c5 - 6, z: 1.1, at: [500, 740], e: "slow" }, // MED: 2015 card
  { f: T.c6 - 6, z: 1.1, at: [520, 720], e: "slow" }, // MED: cakes
  { f: T.c7 - 6, z: 1.14, at: [500, 700], e: "slow" }, // INSERT: video bar
  { f: T.c8 - 6, z: 1.12, at: [600, 800], e: "slow" }, // MED: Spark + next posts
  { f: BACK, z: 1.08, at: [540, 880], e: "cut" }, // WIDE: back on the balcony
  { f: T.tap9 - 14, z: 1.35, at: [PX - 80, PY + 40], e: "slow" }, // INSERT: the tap
  { f: T.c10 - 6, z: 1.5, at: [SX_A + 40, HEADY + 60], e: "slow" }, // CU: question
  { f: LOOP, z: 1.12, at: [560, 860], e: "cut" }, // back into frame 0
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

type Kind = "cake" | "shoe" | "car" | "plant" | "sunset";
const HUE: Record<Kind, string> = { cake: "#ffe0ec", shoe: "#d9ecff", car: "#e3f7d9", plant: "#eaf6d6", sunset: "#ffd9b0" };

// a picture for a post, centred at (0,0), about 240 x 160
const Pic: React.FC<{ kind: Kind; s?: number; v?: number }> = ({ kind, s = 1, v = 0 }) => (
  <g transform={`scale(${s})`}>
    {kind === "cake" && (
      <g>
        <ellipse cx={0} cy={58} rx={92} ry={12} fill="#00000018" />
        <rect x={-74} y={4} width={148} height={54} rx={10} fill={v % 2 ? "#c98a55" : PINK} stroke={INK} strokeWidth={4} />
        <rect x={-56} y={-40} width={112} height={46} rx={10} fill={v % 2 ? PINK : "#fff3f8"} stroke={INK} strokeWidth={4} />
        <path d="M -56 -18 q 14 14 28 0 q 14 14 28 0 q 14 14 28 0 q 14 14 28 0" fill="none" stroke={WHITE} strokeWidth={6} />
        <circle cx={0} cy={-52} r={13} fill={RED} stroke={INK} strokeWidth={3} />
        <path d="M 0 -64 q 6 -14 16 -16" fill="none" stroke="#3b7a2a" strokeWidth={4} />
      </g>
    )}
    {kind === "shoe" && (
      <g>
        <path d="M -80 30 L -80 -10 Q -60 -30 -30 -30 L 0 0 Q 50 4 80 20 L 80 30 Z" fill="#5b8def" stroke={INK} strokeWidth={4} />
        <rect x={-84} y={30} width={168} height={14} rx={7} fill={WHITE} stroke={INK} strokeWidth={4} />
      </g>
    )}
    {kind === "car" && (
      <g>
        <path d="M -90 24 L -90 -4 L -50 -10 L -24 -38 L 34 -38 L 58 -10 L 90 -4 L 90 24 Z" fill={RED} stroke={INK} strokeWidth={4} />
        <circle cx={-48} cy={26} r={16} fill={INK} />
        <circle cx={50} cy={26} r={16} fill={INK} />
        <rect x={-16} y={-32} width={42} height={20} rx={4} fill="#bfe3ff" stroke={INK} strokeWidth={3} />
      </g>
    )}
    {kind === "plant" && (
      <g>
        <path d="M -36 10 L 36 10 L 26 56 L -26 56 Z" fill="#d07a4a" stroke={INK} strokeWidth={4} />
        <path d="M 0 10 Q -50 -20 -40 -60 Q -6 -40 0 10 Q 6 -50 40 -64 Q 46 -20 0 10" fill={GREEN} stroke={INK} strokeWidth={4} />
      </g>
    )}
    {kind === "sunset" && (
      <g>
        <circle cx={0} cy={10} r={44} fill={ORANGE} stroke={INK} strokeWidth={4} />
        <rect x={-110} y={20} width={220} height={50} fill="#5b8def" />
        <path d="M -70 34 h 50 M 10 46 h 60 M -40 58 h 40" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
      </g>
    )}
  </g>
);

// heart icon (outline or filled), centred
const HeartIcon: React.FC<{ s?: number; fill?: string }> = ({ s = 1, fill = "none" }) => (
  <path
    transform={`scale(${s})`}
    d="M 0 14 C -26 -4 -22 -24 -8 -24 C -2 -24 0 -18 0 -16 C 0 -18 2 -24 8 -24 C 22 -24 26 -4 0 14 Z"
    fill={fill}
    stroke={INK}
    strokeWidth={3.5}
    strokeLinejoin="round"
  />
);

const CARD_H = 290;
// one post card in the phone, centred at (0,0): picture + a bottom row with a heart and "⋯"
const Post: React.FC<{ kind: Kind; v?: number; heart?: number; dots?: number }> = ({ kind, v = 0, heart = 0, dots = 0 }) => (
  <g>
    <rect x={-128} y={-136} width={256} height={272} rx={16} fill={WHITE} stroke="#c9cfdc" strokeWidth={3} />
    <rect x={-118} y={-126} width={236} height={186} rx={12} fill={HUE[kind]} />
    <Pic kind={kind} v={v} s={0.95} />
    <g transform={`translate(-88 ${98}) scale(${1 + 0.9 * heart})`}>
      <HeartIcon s={1.1} />
    </g>
    <g transform={`translate(88 98) scale(${1 + 0.5 * dots})`}>
      {dots > 0.01 && <circle r={24} fill={GOLD} opacity={0.6 * dots} />}
      {[-14, 0, 14].map((x) => (
        <circle key={x} cx={x} cy={0} r={5} fill={INK} />
      ))}
    </g>
  </g>
);

type Feed = { kind: Kind; v?: number }[];
const FEED_A: Feed = [{ kind: "car" }, { kind: "shoe" }, { kind: "plant" }, { kind: "car" }, { kind: "cake" }, { kind: "cake", v: 1 }, { kind: "cake" }, { kind: "cake", v: 1 }, { kind: "cake" }, { kind: "cake", v: 1 }];
const FEED_BACK: Feed = [{ kind: "car" }, { kind: "shoe" }, { kind: "plant" }, { kind: "car" }, { kind: "cake" }, { kind: "sunset" }];

// the big phone, centred at (0,0): 300 x 560
const BigPhone: React.FC<{
  f: number;
  feed: Feed;
  p: number; // scroll position (card index at the centre)
  timer?: number | null;
  heart?: number;
  dots?: number;
  menu?: number;
  press?: number;
  slide?: number;
}> = ({ f, feed, p, timer = null, heart = 0, dots = 0, menu = 0, press = 0, slide = 0 }) => (
  <g>
    <circle r={330} fill={WHITE} opacity={0.12 * (0.85 + 0.15 * Math.sin(f / 8))} />
    <rect x={-150} y={-280} width={300} height={560} rx={36} fill="#16161e" {...K} strokeWidth={7} />
    <clipPath id="v024-screen">
      <rect x={-136} y={-250} width={272} height={500} rx={20} />
    </clipPath>
    <g clipPath="url(#v024-screen)">
      <rect x={-136} y={-250} width={272} height={500} fill="#eef1f7" />
      {feed.map((post, i) => {
        const y = (i - p) * CARD_H + 10;
        if (y < -460 || y > 460) return null;
        const cur = Math.abs(i - p) < 0.5;
        const gone = slide > 0 && i === 4;
        return (
          <g key={i} transform={`translate(${gone ? -330 * slide : 0} ${y})`}>
            <Post kind={post.kind} v={post.v} heart={cur ? heart : 0} dots={cur ? dots : 0} />
          </g>
        );
      })}
      {/* top bar */}
      <rect x={-136} y={-250} width={272} height={44} fill={WHITE} />
      <rect x={-40} y={-236} width={80} height={14} rx={7} fill="#d3d8e4" />
      {timer !== null && (
        <g transform="translate(78 -228)">
          <rect x={-50} y={-18} width={100} height={36} rx={18} fill={INK} />
          <text x={0} y={9} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill={GOLD}>
            {timer.toFixed(1)} s
          </text>
        </g>
      )}
      {/* bottom sheet with NOT INTERESTED */}
      {menu > 0.01 && (
        <g transform={`translate(0 ${250 - 190 * menu})`}>
          <rect x={-136} y={0} width={272} height={200} rx={20} fill={WHITE} stroke="#c9cfdc" strokeWidth={3} />
          <rect x={-30} y={12} width={60} height={8} rx={4} fill="#d3d8e4" />
          <g transform={`translate(0 76) scale(${1 - 0.08 * press})`}>
            <rect x={-118} y={-34} width={236} height={68} rx={14} fill={press > 0.5 ? "#ffd9dc" : "#fff0f1"} stroke={RED} strokeWidth={4} />
            <circle cx={-88} cy={0} r={15} fill="none" stroke={RED} strokeWidth={4} />
            <line x1={-98} y1={10} x2={-78} y2={-10} stroke={RED} strokeWidth={4} />
            <text x={10} y={9} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={24} fill={RED}>
              NOT INTERESTED
            </text>
          </g>
          <rect x={-90} y={136} width={180} height={14} rx={7} fill="#e3e6ee" />
        </g>
      )}
    </g>
  </g>
);

// a stopwatch centred at (0,0), radius r; hand angle in degrees
const Stopwatch: React.FC<{ r?: number; ang: number; press?: number }> = ({ r = 60, ang, press = 0 }) => (
  <g>
    <rect x={-r * 0.18} y={-r * 1.32 + press * 6} width={r * 0.36} height={r * 0.3} rx={4} fill={GOLD} stroke={INK} strokeWidth={4} />
    <rect x={-r * 0.1} y={-r * 1.06} width={r * 0.2} height={r * 0.12} fill={INK} />
    <circle r={r} fill={WHITE} stroke={INK} strokeWidth={6} />
    <circle r={r * 0.82} fill="none" stroke="#e1e5ee" strokeWidth={4} />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1={0} y1={-r * 0.72} x2={0} y2={-r * 0.82} stroke={INK} strokeWidth={3} transform={`rotate(${i * 30})`} />
    ))}
    <line x1={0} y1={0} x2={0} y2={-r * 0.68} stroke={RED} strokeWidth={5} strokeLinecap="round" transform={`rotate(${ang})`} />
    <circle r={r * 0.1} fill={INK} />
  </g>
);

// a clock with spinning hands (the "hours")
const Clock: React.FC<{ r?: number; t: number }> = ({ r = 70, t }) => (
  <g>
    <circle r={r} fill={WHITE} stroke={INK} strokeWidth={6} />
    {Array.from({ length: 4 }, (_, i) => (
      <line key={i} x1={0} y1={-r * 0.78} x2={0} y2={-r * 0.9} stroke={INK} strokeWidth={4} transform={`rotate(${i * 90})`} />
    ))}
    <line x1={0} y1={0} x2={0} y2={-r * 0.45} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${t * 2})`} />
    <line x1={0} y1={0} x2={0} y2={-r * 0.7} stroke={INK} strokeWidth={5} strokeLinecap="round" transform={`rotate(${t * 24})`} />
    <circle r={6} fill={INK} />
  </g>
);

// world A: coral evening balcony
const Balcony: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="v024-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SKY1} />
        <stop offset="0.55" stopColor={SKY2} />
        <stop offset="1" stopColor={SKY3} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#v024-sky)" />
    <circle cx={820} cy={760} r={110} fill="#fff1c4" opacity={0.85} />
    {/* far city */}
    {[
      [0, 820, 140],
      [130, 760, 110],
      [230, 860, 160],
      [380, 720, 120],
      [490, 800, 150],
      [630, 880, 130],
      [750, 780, 120],
      [860, 840, 230],
    ].map(([x, y, w], i) => (
      <g key={i}>
        <rect x={x} y={y} width={w} height={GROUND - 260 - y + 10} fill={CITY} opacity={0.75} />
        {Array.from({ length: 4 }, (_, k) => (
          <rect key={k} x={x + 18 + (k % 2) * 46} y={y + 30 + Math.floor(k / 2) * 60} width={22} height={28} fill="#ffe7a8" opacity={(i + k) % 3 ? 0.8 : 0.3} />
        ))}
      </g>
    ))}
    {/* string lights */}
    <path d="M -20 300 Q 270 400 560 310 Q 830 230 1100 330" fill="none" stroke={RAIL} strokeWidth={4} />
    {Array.from({ length: 11 }, (_, i) => {
      const x = -20 + i * 110;
      const y = i < 6 ? 300 + 100 * Math.sin((i / 5) * Math.PI) * 0.9 - 10 : 310 + 30 * Math.sin(((i - 5) / 5) * Math.PI) + (i - 5) * 4;
      return <circle key={i} cx={x} cy={y + 14} r={11} fill="#fff3a8" opacity={0.75 + 0.25 * Math.sin(f / 9 + i)} stroke={RAIL} strokeWidth={3} />;
    })}
    {/* railing */}
    <rect x={0} y={GROUND - 270} width={1080} height={20} fill={RAIL} />
    {Array.from({ length: 19 }, (_, i) => (
      <rect key={i} x={10 + i * 60} y={GROUND - 250} width={10} height={250} fill={RAIL} opacity={0.85} />
    ))}
    {/* potted plant on the left */}
    <g transform={`translate(90 ${GROUND})`}>
      <path d="M -50 -110 L 50 -110 L 38 0 L -38 0 Z" fill="#d07a4a" stroke={INK} strokeWidth={5} />
      <path d="M 0 -110 Q -70 -170 -60 -240 Q -10 -200 0 -110 Q 10 -220 60 -250 Q 70 -170 0 -110" fill={GREEN} stroke={INK} strokeWidth={5} />
    </g>
    {/* floor */}
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={DECK} />
    {Array.from({ length: 7 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 40 + i * 60} x2={1080} y2={GROUND + 40 + i * 60} stroke="#86503e" strokeWidth={5} />
    ))}
    {/* little round table */}
    <ellipse cx={TABLE.x} cy={TABLE.top} rx={170} ry={22} fill="#f2e2c8" stroke={INK} strokeWidth={6} />
    <rect x={TABLE.x - 12} y={TABLE.top + 18} width={24} height={GROUND - TABLE.top - 30} fill={RAIL} />
    <ellipse cx={TABLE.x} cy={GROUND - 6} rx={70} ry={12} fill={RAIL} />
    {/* phone stand */}
    <path d={`M ${PX - 60} ${TABLE.top - 4} L ${PX + 60} ${TABLE.top - 4} L ${PX + 30} ${TABLE.top - 26} L ${PX - 30} ${TABLE.top - 26} Z`} fill="#56597e" stroke={INK} strokeWidth={4} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// world B: inside the app
const AppRoom: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={ROOM} />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} x={i * 170} y={0} width={70} height={GROUND} fill={ROOM2} opacity={0.6} />
    ))}
    <g transform="translate(540 320)">
      <rect x={-250} y={-46} width={500} height={88} rx={16} fill={GOLD} {...K} />
      <Txt y={16} s={50}>
        INSIDE THE APP
      </Txt>
    </g>
    {/* the big screen */}
    <rect x={SCR.x0 - 14} y={SCR.y0 - 14} width={SCR.x1 - SCR.x0 + 28} height={SCR.y1 - SCR.y0 + 28} rx={26} fill="#3b3f52" {...K} />
    <rect x={SCR.x0} y={SCR.y0} width={SCR.x1 - SCR.x0} height={SCR.y1 - SCR.y0} rx={16} fill={SCREEN} />
    <rect x={SCX - 16} y={SCR.y1 + 14} width={32} height={60} fill="#3b3f52" stroke={INK} strokeWidth={5} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={ROOMF} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

export const S01_SFX: SfxCue[] = [
  [2, "swish", 0.15],
  [T.stopped0 + 6, "tick", 0.2],
  [T.two0, "tick", 0.15],
  [T.noticed0, "ding", 0.3],
  [T.likes1 - 4, "pop", 0.25],
  [T.waste2, "whoosh", 0.2],
  [T.hours2, "tick", 0.25],
  [T.helper3 - 2, "swirl", 0.12],
  [INSIDE - 8, "whoosh_long", 0.3],
  [INSIDE + 10, "ding", 0.15],
  [T.counts4, "tick", 0.2],
  [T.look4, "tick", 0.2],
  [T.each4 + 6, "tick", 0.2],
  [T.y2015 - 2, "pop", 0.3],
  [T.counts5, "page", 0.2],
  ...[0, 1, 2, 3, 4, 5].map((i) => [T.more6 - 12 + i * 6, "pop", 0.18] as SfxCue),
  [T.finishing7 - 4, "riser", 0.15],
  [T.counts7 + 2, "ding", 0.3],
  [T.pauses8, "swirl", 0.15],
  [T.next8, "pop", 0.25],
  [BACK - 6, "whoosh", 0.25],
  [T.balcony9 + 4, "pop", 0.2],
  [T.not9, "punch", 0.2],
  [T.not9 + 12, "swish", 0.25],
  [T.c10 - 4, "whoosh", 0.12],
  [LOOP, "ding", 0.12],
];

export const S01Pause: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const room = f >= INSIDE && f < BACK && !loopBack;
  const late = !room && f >= BACK && !loopBack;
  const early = !room && !late;
  const cam = camAt(f, SHOTS, VERTICAL);

  // --- balcony, first half ---
  // scroll: settles on the cake (index 4); later more cakes scroll by
  const pEarly = loopBack ? 4 : ease(f, 0, T.stopped0 + 10, 3.88, 4) + ease(f, T.waste2, T.c3 - 6, 0, 4);
  const timer = early && f >= T.stopped0 + 12 && f < T.c2 ? Math.min(2, Math.max(0, (f - (T.stopped0 + 12)) / 30)) : loopBack ? 0 : null;
  const watchK = early && f >= T.noticed0 - 2 && f < T.c2 ? popIn(f, T.noticed0 - 2) : 0;
  const heart = early ? ease(f, T.c1 + 2, T.likes1, 0, 1) - ease(f, T.c2 - 8, T.c2 + 4, 0, 1) : 0;
  const likesK = early && f >= T.likes1 - 4 && f < T.c2 - 2 ? popIn(f, T.likes1 - 4) : 0;
  const clockK = early && f >= T.hours2 - 4 && f < T.c3 + 10 ? popIn(f, T.hours2 - 4) : 0;

  // --- inside the app ---
  const s3 = room && f < T.c4 - 4;
  const s4 = room && f >= T.c4 - 4 && f < T.c6 - 4; // LOOK TIME list (+ 2015 card)
  const s6 = room && f >= T.c6 - 4 && f < T.c7 - 4;
  const s7 = room && f >= T.c7 - 4 && f < T.c8 - 4;
  const s8 = room && f >= T.c8 - 4;
  const bars = [ease(f, T.counts4, T.counts4 + 16, 0, 0.16), ease(f, T.look4 - 6, T.each4 + 2, 0, 0.9), ease(f, T.each4 + 4, T.each4 + 18, 0, 0.12)];
  const runWatch = room && !s7;
  const watchAng = runWatch ? (f - INSIDE) * 6 : s7 ? (T.c7 - 4 - INSIDE) * 6 : 0;
  const tickPress = (t: number) => Math.max(0, 1 - Math.abs(t) / 4);
  const press = room ? Math.max(tickPress(f - T.counts4), tickPress(f - T.look4), tickPress(f - T.each4 - 6), tickPress(f - T.counts5)) : 0;
  const cardK = s4 && f >= T.y2015 - 2 ? popIn(f, T.y2015 - 2) : 0;
  const cakeN = s6 ? Math.min(6, Math.max(0, Math.floor((f - (T.more6 - 12)) / 6) + 1)) : 0;
  const prog = s7 ? ease(f, T.finishing7 - 4, T.counts7, 0, 1) : 0;
  const doneK = s7 && f >= T.counts7 ? popIn(f, T.counts7) : 0;
  const nextK = s8 && f >= T.next8 - 6 ? popIn(f, T.next8 - 6) : 0;
  const arrowA = s8 ? ease(f, T.pauses8, T.next8 - 4, 0, 1) : 0;

  // --- balcony again: Not interested ---
  const dots = late ? ease(f, T.balcony9 - 4, T.balcony9 + 6, 0, 1) - ease(f, T.tap9 - 4, T.tap9, 0, 1) : 0;
  const menu = late ? ease(f, T.tap9 - 8, T.tap9 + 2, 0, 1) - ease(f, T.not9 + 10, T.not9 + 18, 0, 1) : 0;
  const pressB = late ? ease(f, T.not9 - 2, T.not9 + 2, 0, 1) : 0;
  const slide = late ? ease(f, T.not9 + 12, T.not9 + 24, 0, 1) : 0;
  const pBack = late ? 4 + ease(f, T.not9 + 22, T.not9 + 34, 0, 1) : 4;
  const lessK = late && f >= T.less9 - 4 && f < T.c10 + 20 ? popIn(f, T.less9 - 4) : 0;

  // --- Spark ---
  const sx = room ? SX_B : SX_A;
  const sparkKeys = !room
    ? gestureKeys([
        [0, G.pointSide],
        [T.noticed0 - 3, G.recoil, "snap"],
        [T.c1, G.pointUp, "smooth"],
        [T.c2, G.shrugBig, "smooth"],
        [T.c3, G.thinkChin, "smooth"],
        [BACK, G.rest, "snap"],
        [T.balcony9 + 2, G.pointSide, "smooth"],
        [T.not9 + 14, G.handsHips, "smooth"],
        [T.c10, G.present, "smooth"],
        [LOOP - 4, G.pointSide, "snap"],
      ])
    : gestureKeys([
        [INSIDE, G.presentBoth],
        [T.c4, G.pointSide, "smooth"],
        [T.c5, G.thinkChin, "smooth"],
        [T.c6, G.doublePoint, "smooth"],
        [T.c7, G.pointUp, "smooth"],
        [T.c8, G.mindBlown, "smooth"],
      ]);
  const facing = () => (room ? -1 : 1);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "worried";
    if (t < T.noticed0 - 3) return "worried";
    if (t < T.c1) return "shock";
    if (t < T.c2) return "skeptical";
    if (t < T.c3) return "worried";
    if (t < INSIDE) return "thinking";
    if (t < T.c4) return "curious";
    if (t < T.c5) return "neutral";
    if (t < T.c6) return "thinking";
    if (t < T.c7) return "excited";
    if (t < T.c8) return "curious";
    if (t < BACK) return "mindblown";
    if (t < T.not9 + 14) return "determined";
    if (t < T.c10) return "happy";
    if (t < T.today10) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.pauses8, 34), bulbPulse(t, T.counts7, 24), bulbPulse(t, T.not9 + 12, 24));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, shake(t, T.noticed0, 3));
    q = addPose(q, shake(t, T.hours2, 2));
    q = addPose(q, nod(t, T.counts5, 1));
    q = addPose(q, hop(t, T.more6, 10));
    q = addPose(q, hop(t, T.not9 + 14, 10));
    q = addPose(q, nod(t, T.today10, 1));
    return { ...q, x: sx };
  };
  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={facing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} />
  );

  const phoneEl = (
    <g transform={`translate(${PX} ${PY})`}>
      <BigPhone
        f={f}
        feed={late ? FEED_BACK : FEED_A}
        p={late ? pBack : pEarly}
        timer={timer}
        heart={heart}
        dots={dots}
        menu={menu}
        press={pressB}
        slide={slide}
      />
    </g>
  );

  const balconyEl = !room && (
    <>
      <Balcony f={f} />
      {phoneEl}
      {sparkEl}
      {watchK > 0.01 && (
        <g transform={`translate(${PX + 120} ${PY - 330}) scale(${watchK}) rotate(${wobble(f, T.noticed0 - 2, 10)})`}>
          <Stopwatch r={58} ang={(f - T.noticed0) * 8} />
        </g>
      )}
      {likesK > 0.01 && (
        <g transform={`translate(${PX - 200} ${PY + 200}) scale(${likesK})`}>
          <rect x={-90} y={-34} width={180} height={64} rx={14} fill={WHITE} {...K} strokeWidth={5} />
          <Txt y={13} s={38}>
            LIKES?
          </Txt>
        </g>
      )}
      {clockK > 0.01 && (
        <g transform={`translate(${SX_A + 10} ${HEADY - 260}) scale(${clockK})`}>
          <Clock r={72} t={f - T.hours2} />
          <g transform="translate(0 116)">
            <rect x={-82} y={-30} width={164} height={56} rx={12} fill={WHITE} {...K} strokeWidth={5} />
            <Txt y={12} s={36}>
              HOURS
            </Txt>
          </g>
        </g>
      )}
      {lessK > 0.01 && (
        <g transform={`translate(${PX} ${PY - 340}) scale(${lessK})`}>
          <rect x={-120} y={-38} width={240} height={72} rx={16} fill={WHITE} {...K} />
          <Txt y={14} s={42} c={GREEN}>
            SEE LESS
          </Txt>
        </g>
      )}
    </>
  );

  // inside-the-app screen content
  const rowY = (i: number) => SCR.y0 + 140 + i * 110;
  const roomEl = room && (
    <>
      <AppRoom />
      {/* screen title */}
      <text x={SCX} y={SCR.y0 + 64} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={WHITE}>
        {s3 ? "YOUR FEED" : s4 ? "LOOK TIME" : s6 ? "MORE LIKE THIS" : s7 ? "WATCHED TO THE END?" : "YOUR NEXT POSTS"}
      </text>
      {s3 && (
        <g transform={`translate(${SCX} ${SCY + 40}) scale(${0.95 * popIn(f, INSIDE + 2)})`}>
          <Post kind="cake" />
        </g>
      )}
      {s4 &&
        (["shoe", "cake", "car"] as Kind[]).map((k, i) => (
          <g key={k}>
            <rect x={SCR.x0 + 40} y={rowY(i) - 46} width={140} height={92} rx={12} fill={HUE[k]} />
            <g transform={`translate(${SCR.x0 + 110} ${rowY(i)})`}>
              <Pic kind={k} s={0.5} />
            </g>
            <rect x={SCR.x0 + 210} y={rowY(i) - 22} width={430} height={44} rx={22} fill={SCREEN2} />
            <rect x={SCR.x0 + 210} y={rowY(i) - 22} width={Math.max(44, 430 * bars[i])} height={44} rx={22} fill={i === 1 ? GOLD : "#8fa2d6"} opacity={bars[i] > 0.01 ? 1 : 0} />
          </g>
        ))}
      {cardK > 0.01 && (
        <g transform={`translate(${SCX + 60} ${SCY + 10}) scale(${cardK}) rotate(-3)`}>
          <rect x={-230} y={-110} width={460} height={220} rx={22} fill={PAPER} {...K} />
          <Txt y={-14} s={92}>
            2015
          </Txt>
          <Txt y={68} s={52} c={RED}>
            TIME COUNTS
          </Txt>
        </g>
      )}
      {s6 &&
        Array.from({ length: cakeN }, (_, i) => {
          const cx = SCR.x0 + 130 + (i % 3) * 220;
          const cy = SCR.y0 + 190 + Math.floor(i / 3) * 190;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${popIn(f, T.more6 - 12 + i * 6)})`}>
              <rect x={-96} y={-80} width={192} height={160} rx={14} fill={HUE.cake} stroke={WHITE} strokeWidth={4} />
              <Pic kind="cake" v={i} s={0.85} />
            </g>
          );
        })}
      {s7 && (
        <g>
          <rect x={SCR.x0 + 60} y={SCR.y0 + 100} width={SCR.x1 - SCR.x0 - 120} height={220} rx={16} fill="#11182c" />
          <path d={`M ${SCX - 34} ${SCR.y0 + 170} L ${SCX + 44} ${SCR.y0 + 210} L ${SCX - 34} ${SCR.y0 + 250} Z`} fill={WHITE} />
          <rect x={SCR.x0 + 60} y={SCR.y0 + 350} width={SCR.x1 - SCR.x0 - 120} height={26} rx={13} fill={SCREEN2} />
          <rect x={SCR.x0 + 60} y={SCR.y0 + 350} width={Math.max(26, (SCR.x1 - SCR.x0 - 120) * prog)} height={26} rx={13} fill={prog >= 1 ? GREEN : RED} />
          <circle cx={SCR.x0 + 60 + (SCR.x1 - SCR.x0 - 120) * prog} cy={SCR.y0 + 363} r={20} fill={WHITE} stroke={INK} strokeWidth={4} />
          {doneK > 0.01 && (
            <g transform={`translate(${SCR.x1 - 70} ${SCR.y0 + 110}) scale(${doneK})`}>
              <circle r={50} fill={GREEN} {...K} />
              <path d="M -22 2 L -6 18 L 24 -16" fill="none" stroke={WHITE} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
      )}
      {s8 && (
        <g>
          <g transform={`translate(${SCR.x0 + 140} ${SCY + 30})`}>
            <Stopwatch r={70} ang={(f - T.c8) * 6} />
          </g>
          {arrowA > 0.01 && (
            <path
              d={`M ${SCR.x0 + 230} ${SCY + 30} L ${SCR.x0 + 230 + 150 * arrowA} ${SCY + 30}`}
              stroke={GOLD}
              strokeWidth={16}
              strokeLinecap="round"
            />
          )}
          {arrowA > 0.95 && <path d={`M ${SCR.x0 + 380} ${SCY - 4} L ${SCR.x0 + 420} ${SCY + 30} L ${SCR.x0 + 380} ${SCY + 64} Z`} fill={GOLD} />}
          {nextK > 0.01 &&
            [2, 1, 0].map((i) => (
              <g key={i} transform={`translate(${SCR.x0 + 545 + i * 18} ${SCY + 30 - i * 18}) scale(${nextK})`}>
                <rect x={-96} y={-80} width={192} height={160} rx={14} fill={HUE.cake} stroke={WHITE} strokeWidth={4} />
                {i === 0 && <Pic kind="cake" s={0.85} />}
              </g>
            ))}
        </g>
      )}
      {/* the helper with the stopwatch */}
      <Actor
        f={f}
        color={ORANGE}
        scale={1.5}
        base={{ x: HX, y: GROUND - 92.5 * 1.5 }}
        keys={gestureKeys([[0, { ra1: 120, ra2: 30, la1: -20, la2: 20, head: -6 }]])}
        mod={(t, p) => addPose(p, idle(t, 3))}
        facing={1}
        face={s6 ? "happy" : "eyes"}
        trails={false}
      >
        {(j) => (
          <g transform={`translate(${j.rHand[0] + 10} ${j.rHand[1] - 50})`}>
            <Stopwatch r={56} ang={watchAng} press={press} />
          </g>
        )}
      </Actor>
      <g transform={`translate(${HX - 120} ${GROUND - 140})`}>
        <rect x={-90} y={-30} width={180} height={56} rx={12} fill={WHITE} {...K} strokeWidth={5} />
        <Txt y={12} s={36} c={ORANGE}>
          HELPER
        </Txt>
      </g>
      {sparkEl}
    </>
  );

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: room ? ROOM : SKY2 }} />}
      cam={cam}
      hits={[]}
      power={4}
      svg={room ? roomEl : balconyEl}
      html={
        <>
          {/* frame-0 overlay (4 words) */}
          {(f < T.noticed0 - 2 || loopBack) && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 250,
                textAlign: "center",
                fontFamily: FONT.title,
                fontWeight: 900,
                lineHeight: 1.0,
                fontSize: 104,
                transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
                opacity: loopBack ? 1 : interpolate(f, [T.noticed0 - 12, T.noticed0 - 2], [1, 0], clamp),
              }}
            >
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>IT SAW</div>
              <div style={{ color: GOLD, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>YOU PAUSE</div>
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 540,
                  top: 1690,
                  transform: "translate(-50%,-50%)",
                  fontFamily: FONT.body,
                  fontWeight: 700,
                  fontSize: 21,
                  color: INK,
                  whiteSpace: "nowrap",
                  opacity: 0.9,
                  background: "rgba(255,255,255,0.82)",
                  padding: "2px 12px",
                  borderRadius: 8,
                }}
              >
                Facebook newsroom 2015 · TikTok newsroom 2020 · Instagram 2021 · helper = illustration
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 96,
                  top: 1738,
                  fontFamily: FONT.title,
                  fontWeight: 900,
                  fontSize: 27,
                  color: room ? "#8a5a12" : "#7a2d3a",
                  WebkitTextStroke: `1px ${INK}`,
                  letterSpacing: 2,
                  opacity: 0.95,
                }}
              >
                DESIGNED TO GET YOU
              </div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["two", "seconds,", "noticed.", "likes", "hours", "helper", "stopwatch.", "long", "2015,", "more", "finishing", "pauses", "Not", "Interested", "today?"]}
          />
          <Transition f={f} at={INSIDE} kind="iris" size={VERTICAL} irisAt={[540, 860]} colors={[GOLD, ROOM, SKY1]} />
        </>
      }
    />
  );
};
