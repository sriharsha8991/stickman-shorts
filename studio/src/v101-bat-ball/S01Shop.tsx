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
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { arc, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V101 · Bat and ball cost ₹110. What did the ball cost? (10-second test, ~18.6 s)
// World: a gully sports shop in front of a chalkboard wall. Metaphor: ONE price tag that splits into two.
// Spark lives the trap first (slaps ₹10 on the ball), the total comes out ₹120 (buzzer), whip → ₹5 ✓.
// Then "more than half of top students said ten" (chalk mortarboards), the fast brain vs the sleeping
// CHECK magnifier, and "Did you say ten?" cuts back into frame 0.
// Sources: Frederick 2005 (J Econ Perspectives 19(4)); Kahneman 2011 p.45. Rupee version of the $1.10 problem.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const win = (f: number, a: number, b: number, fade = 6) => interpolate(f, [a - fade, a, b - fade, b], [0, 1, 1, 0], clamp);

const SS = 1.9;
const SX = 250;
const SGY = GROUND - 92.5 * SS;
const HEAD: [number, number] = [SX + 10, SGY - 135];

// palette: chalkboard shop
const BOARD = "#1f4d3a";
const BOARD2 = "#163a2c";
const CHALK = "#f3f1e7";
const WOOD = "#a0663a";
const WOOD2 = "#6e4224";
const TAGC = "#fff3d6";
const ORANGE = "#ff8c42";
const RED = "#e63946";
const GREEN = "#2fbf71";
const GOLD = "#ffd23f";
const BATC = "#e8c27a";
const INK = COL.ink;

const CT = 1110; // counter top
const RAIL = 300; // wooden rail the tags hang from
const COMBO: [number, number] = [790, 830];
const BATTAG: [number, number] = [630, 880];
const BALLTAG: [number, number] = [930, 905];
const TOTAL: [number, number] = [760, 600];
const BALL: [number, number] = [930, CT - 46];

const T = {
  hundred: W(0, 6),
  c1: C(1),
  more: W(1, 5),
  c2: C(2),
  cost: W(2, 4),
  ten: C(3),
  tooTen: W(3, 3),
  but: C(4),
  oneTen: W(4, 4),
  thats: C(5),
  twenty: W(5, 1),
  five0: C(6),
  five: W(6, 3),
  half: C(7),
  students: W(7, 5),
  saidTen: W(7, 7),
  fast: C(8),
  answered: W(8, 3),
  never: W(8, 5),
  checked: W(8, 6),
  did: C(9),
  ten9: W(9, 3),
};
const LOOP = VOICE_FRAMES - 14;
const LAND = T.ten + 16; // ₹10 sticker lands on the ball tag

const SHOTS: Shot[] = [
  { f: 0, z: 1.3, at: [560, 950], e: "cut" }, // frame 0: Spark + bat & ball under one ₹110 tag
  { f: T.hundred, z: 1.55, at: [760, 900], e: "snap" }, // insert: the tag
  { f: T.c1, z: 1.4, at: [730, 960], e: "cut" }, // insert: the tag splits onto bat + ball
  { f: T.c2, z: 2.1, at: HEAD, e: "snap" }, // CU Spark: "What did your ball cost?"
  { f: T.ten - 2, z: 1.05, at: [560, 1000], e: "cut" }, // wide: Spark throws ₹10 on the ball
  { f: T.but, z: 1.7, at: [640, 930], e: "snap" }, // insert: bat tag → ₹110
  { f: T.thats, z: 1.35, at: [700, 820], e: "cut" }, // total tag drops: ₹120 ✗
  { f: T.twenty + 8, z: 2.05, at: HEAD, e: "snap" }, // CU Spark: shock on the buzzer
  { f: T.five0, z: 1.1, at: [640, 950], e: "cut" }, // whip → wide reveal ₹5 ✓
  { f: T.half, z: 1.22, at: [540, 760], e: "cut" }, // the chalk board of caps
  { f: T.students, z: 1.42, at: [540, 720], e: "slow" }, // slow push while caps flip
  { f: T.fast, z: 2.2, at: [HEAD[0], HEAD[1] - 20], e: "snap" }, // CU Spark: fast brain
  { f: T.never - 4, z: 1.75, at: [730, 1010], e: "cut" }, // insert: CHECK magnifier asleep
  { f: T.did, z: 1.95, at: HEAD, e: "snap" }, // CU Spark: "Did you say ten?"
  { f: LOOP, z: 1.3, at: [560, 950], e: "cut" }, // back into frame 0
];

// --- background: chalkboard wall, rail, lamp, counter, floor -----------------------------------------------------
const Shop: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="v101lamp" cx="0.62" cy="0.18" r="0.7">
          <stop offset="0%" stopColor="#3f7a5e" />
          <stop offset="55%" stopColor={BOARD} />
          <stop offset="100%" stopColor={BOARD2} />
        </radialGradient>
      </defs>
      <rect width={1080} height={GROUND} fill="url(#v101lamp)" />
      {/* chalk smudges + doodles (stumps, a ball arc, scribbled sums) */}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx={random(`sx${i}`) * 1080} cy={150 + random(`sy${i}`) * 1000} rx={60 + random(`sr${i}`) * 120} ry={14 + random(`sq${i}`) * 26} fill={CHALK} opacity={0.035} />
      ))}
      <g stroke={CHALK} strokeWidth={5} fill="none" opacity={0.22} strokeLinecap="round">
        <line x1={110} y1={560} x2={110} y2={700} />
        <line x1={140} y1={560} x2={140} y2={700} />
        <line x1={170} y1={560} x2={170} y2={700} />
        <line x1={102} y1={556} x2={178} y2={556} />
        <path d="M 210 520 Q 300 420 390 540" strokeDasharray="10 12" />
        <circle cx={392} cy={548} r={12} />
        <path d="M 860 1010 l 40 0 M 880 990 l 0 40" />
      </g>
      <text x={150} y={480} fontFamily={FONT.comic} fontSize={44} fill={CHALK} opacity={0.2} transform="rotate(-6 150 480)">
        2 + 2 = 4 ✓
      </text>
      <text x={80} y={1010} fontFamily={FONT.comic} fontSize={38} fill={CHALK} opacity={0.18}>
        GULLY SPORTS
      </text>
      {/* hanging lamp */}
      <line x1={700} y1={0} x2={700} y2={150} stroke={INK} strokeWidth={5} />
      <path d="M 640 190 Q 700 120 760 190 Z" fill={ORANGE} stroke={INK} strokeWidth={5} />
      <ellipse cx={700} cy={192} rx={22} ry={10} fill="#fff6c8" opacity={0.7 + 0.1 * Math.sin(f / 7)} />
      {/* rail the tags hang from */}
      <rect x={440} y={RAIL - 14} width={640} height={28} rx={6} fill={WOOD} stroke={INK} strokeWidth={5} />
      {/* counter */}
      <rect x={450} y={CT} width={620} height={26} fill={WOOD} stroke={INK} strokeWidth={6} />
      <rect x={470} y={CT + 26} width={580} height={GROUND - CT - 26} fill={WOOD2} stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={500 + i * 190} y={CT + 56} width={150} height={GROUND - CT - 86} rx={6} fill="none" stroke={INK} strokeWidth={4} opacity={0.45} />
      ))}
      {/* floor */}
      <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#4a3020" />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={0} y1={GROUND + 40 + i * 70} x2={1080} y2={GROUND + 40 + i * 70} stroke="#2d1c12" strokeWidth={4} opacity={0.6} />
      ))}
      <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
    </svg>
  </AbsoluteFill>
);

// a price tag hanging from the rail (string drawn to the rail at RAIL)
const Tag: React.FC<{ x: number; y: number; w: number; h: number; k?: number; rot?: number; fill?: string; string?: boolean; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  k = 1,
  rot = 0,
  fill = TAGC,
  string = true,
  children,
}) => {
  const n = Math.min(34, h * 0.28);
  const d = `M ${-w / 2 + n} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2} ${h / 2} L ${-w / 2 + n} ${h / 2} L ${-w / 2} 0 Z`;
  return (
    <>
      {string && <line x1={x} y1={RAIL} x2={x} y2={y - (h / 2) * k} stroke={CHALK} strokeWidth={4} opacity={0.85} />}
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
        <path d={d} fill={fill} {...K} strokeWidth={7} />
        <circle cx={-w / 2 + n * 0.9} cy={0} r={9} fill={BOARD} stroke={INK} strokeWidth={4} />
        {children}
      </g>
    </>
  );
};
const TagText: React.FC<{ y?: number; size?: number; color?: string; x?: number; children: React.ReactNode }> = ({ y = 0, size = 90, color = INK, x = 14, children }) => (
  <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={FONT.comic} fontSize={size} fill={color}>
    {children}
  </text>
);

const Bat: React.FC = () => (
  <g transform={`translate(0 0)`}>
    {/* blade */}
    <path d={`M 480 ${CT - 8} L 480 ${CT - 58} Q 480 ${CT - 66} 492 ${CT - 66} L 760 ${CT - 60} L 760 ${CT - 8} Z`} fill={BATC} {...K} />
    <line x1={500} y1={CT - 36} x2={748} y2={CT - 34} stroke="#c99a52" strokeWidth={5} />
    {/* shoulder + handle with grip */}
    <path d={`M 760 ${CT - 58} Q 790 ${CT - 46} 800 ${CT - 40} L 800 ${CT - 26} Q 790 ${CT - 20} 760 ${CT - 10} Z`} fill={BATC} {...K} />
    <rect x={798} y={CT - 44} width={110} height={22} rx={10} fill="#3a86ff" {...K} strokeWidth={5} />
    {[820, 845, 870, 895].map((x) => (
      <line key={x} x1={x} y1={CT - 44} x2={x - 8} y2={CT - 22} stroke={INK} strokeWidth={3} opacity={0.5} />
    ))}
  </g>
);

const Ball: React.FC<{ f: number }> = ({ f }) => {
  const [sx, sy] = squash(f, T.five, 0.18);
  return (
    <g transform={`translate(${BALL[0]} ${BALL[1]}) scale(${sx} ${sy})`}>
      <circle r={46} fill="#c1272d" {...K} />
      <path d="M -30 -34 Q 4 0 -30 34" fill="none" stroke={CHALK} strokeWidth={4} strokeDasharray="6 6" />
      <path d="M -20 -40 Q 14 0 -20 40" fill="none" stroke={CHALK} strokeWidth={4} strokeDasharray="6 6" />
      <ellipse cx={14} cy={-18} rx={10} ry={6} fill="#fff" opacity={0.45} />
    </g>
  );
};

// chalk mortarboard (graduation cap) with an answer bubble
const Cap: React.FC<{ x: number; y: number; k: number; ans: "?" | "₹10" | "₹5"; flipK: number }> = ({ x, y, k, ans, flipK }) => {
  const col = ans === "₹10" ? RED : ans === "₹5" ? GREEN : CHALK;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path d="M -60 -18 L 0 -46 L 60 -18 L 0 10 Z" fill="none" stroke={CHALK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -34 -6 L -34 22 Q 0 40 34 22 L 34 -6" fill="none" stroke={CHALK} strokeWidth={6} />
      <path d="M 0 -18 L 50 -6 L 50 26" fill="none" stroke={GOLD} strokeWidth={4} />
      <g transform={`translate(0 84) scale(${1 + 0.25 * Math.sin(flipK * Math.PI)} ${Math.max(0.05, Math.abs(Math.cos(flipK * Math.PI)))})`}>
        <rect x={-58} y={-30} width={116} height={60} rx={14} fill={ans === "?" ? "none" : col} stroke={ans === "?" ? CHALK : INK} strokeWidth={5} />
        <text y={17} textAnchor="middle" fontFamily={FONT.comic} fontSize={46} fill={ans === "?" ? CHALK : "#fff"}>
          {ans}
        </text>
      </g>
    </g>
  );
};

// the CHECK magnifier, asleep on the counter
const Magnifier: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const breathe = 1 + 0.03 * Math.sin(f / 8);
  return (
    <g transform={`translate(700 ${CT - 92}) scale(${k * breathe}) rotate(-8)`}>
      <rect x={52} y={36} width={110} height={30} rx={14} transform="rotate(35 52 36)" fill={WOOD} {...K} strokeWidth={6} />
      <circle r={74} fill="#d9f3ff" fillOpacity={0.85} {...K} strokeWidth={10} />
      <path d="M -36 -4 Q -22 8 -8 -4" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M 10 -4 Q 24 8 38 -4" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M -10 30 Q 0 36 10 30" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <rect x={-62} y={92} width={124} height={44} rx={10} fill={CHALK} {...K} strokeWidth={5} />
      <text y={124} textAnchor="middle" fontFamily={FONT.comic} fontSize={34} fill={INK}>
        CHECK
      </text>
      {[0, 1, 2].map((i) => {
        const t = ((f / 22 + i / 3) % 1 + 1) % 1;
        return (
          <text key={i} x={70 + t * 70} y={-70 - t * 110} fontFamily={FONT.comic} fontSize={34 + i * 10} fill={CHALK} opacity={(1 - t) * 0.9}>
            z
          </text>
        );
      })}
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [0, "pop", 0.45],
  [T.hundred, "swish", 0.35],
  [T.c1, "shatter", 0.25],
  [T.c1 + 2, "swish", 0.45],
  [T.c1 + 14, "pop", 0.45],
  [T.more, "ding", 0.35],
  [T.c2, "whoosh", 0.35],
  [T.cost + 6, "boing", 0.35],
  [T.cost + 16, "tick", 0.3],
  [T.cost + 22, "tick", 0.3],
  [T.ten, "swish", 0.45],
  [LAND, "stamp", 0.6],
  [T.but, "whoosh", 0.35],
  [T.oneTen, "pop", 0.5],
  [T.thats - 2, "whoosh", 0.35],
  [T.thats + 12, "thud", 0.55],
  [T.twenty + 4, "buzz", 0.6],
  [T.five0 - 7, "whoosh_long", 0.55],
  [T.five, "ding", 0.6],
  [T.five + 4, "kaching", 0.45],
  [T.half, "whoosh", 0.35],
  ...Array.from({ length: 6 }, (_, i): SfxCue => [T.half + 10 + i * 6, "pop", 0.3]),
  [T.saidTen, "stinger", 0.35],
  [T.fast, "swirl", 0.4],
  [T.never - 4, "whoosh", 0.3],
  [T.checked, "boing", 0.3],
  [T.did, "swish", 0.35],
  [T.ten9, "ding", 0.3],
  [LOOP, "pop", 0.35],
];

export const S01Shop: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const cam0 = camAt(f, SHOTS, VERTICAL);
  const cam = { ...cam0, z: cam0.z * punch(f, [T.twenty + 4, T.five, T.saidTen], 0.035) };

  // --- tag states ---
  const loopBack = f >= T.did + 8; // tags reset for the loop (hidden by the CU until LOOP)
  const comboOn = f < T.c1 || loopBack;
  const splitP = interpolate(f, [T.c1, T.c1 + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pairK = win(f, T.c1, T.half + 1, 5);
  const totalDrop = interpolate(f, [T.thats + 2, T.thats + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const totalK = win(f, T.thats + 2, T.half + 1, 5);
  const boardK = win(f, T.half + 3, T.did + 8, 5);
  const magK = f < T.fast ? 0 : popIn(f, T.fast + 2) * interpolate(f, [T.did + 2, T.did + 8], [1, 0], clamp);
  const solved = f >= T.five0;
  const flipBat = interpolate(f, [T.oneTen - 4, T.oneTen + 4], [0, 1], clamp);
  const flipSolved = interpolate(f, [T.five0 - 1, T.five0 + 8], [0, 1], clamp);
  const batScaleX = (p: number) => Math.max(0.05, Math.abs(Math.cos(p * Math.PI)));

  // ₹10 sticker thrown by Spark onto the ball tag
  const throwT = interpolate(f, [T.ten + 2, LAND], [0, 1], clamp);
  const sticker = arc(throwT, [SX + 90, SGY - 170], [BALLTAG[0] + 10, BALLTAG[1]], 260);

  const ballText = f < LAND ? "?" : solved ? "₹5" : "₹10";
  const batText = f < T.oneTen ? null : solved ? "₹105" : "₹110";

  // caps: 6 of 10 flip to ₹10, the other 4 to ₹5
  const capAns = (i: number): ["?" | "₹10" | "₹5", number] => {
    const order = [0, 2, 3, 5, 7, 8].indexOf(i);
    const at = order >= 0 ? T.half + 10 + order * 6 : T.saidTen + 2;
    return [f < at ? "?" : order >= 0 ? "₹10" : "₹5", interpolate(f, [at - 3, at + 3], [0, 1], clamp)];
  };

  const overlayK = Math.max(interpolate(f, [T.cost + 10, T.cost + 16], [1, 0], clamp), interpolate(f, [LOOP - 4, LOOP], [0, 1], clamp));

  const sparkKeys = gestureKeys([
    [0, G.pointSide],
    [T.hundred, G.present, "snap"],
    [T.c1, G.count1, "snap"],
    [T.c2, G.thinkChin, "snap"],
    [T.ten, { ...G.pointSide, ra1: 120, ra2: 30, lean: 8 }, "snap"],
    [T.tooTen, G.shrugBig, "snap"],
    [T.but, G.pointSide, "snap"],
    [T.thats, G.handsHips, "snap"],
    [T.twenty + 4, G.recoil, "snap"],
    [T.five0, G.mindBlown, "snap"],
    [T.five + 8, G.present, "snap"],
    [T.half, G.presentBoth, "snap"],
    [T.saidTen, G.armsCrossed, "snap"],
    [T.fast, G.pointUp, "snap"],
    [T.never, G.facepalm, "snap"],
    [T.did, G.leanIn, "snap"],
    [T.ten9, G.beckon, "snap"],
    [LOOP, G.pointSide, "snap"],
  ]);
  const mood = (t: number): Mood =>
    t < T.hundred
      ? "curious"
      : t < T.c2
        ? "thinking"
        : t < T.ten
          ? "curious"
          : t < T.tooTen
            ? "smug"
            : t < T.but
              ? "laugh"
              : t < T.thats
                ? "skeptical"
                : t < T.five0
                  ? "shock"
                  : t < T.half
                    ? "mindblown"
                    : t < T.saidTen
                      ? "excited"
                      : t < T.fast
                        ? "worried"
                        : t < T.never
                          ? "determined"
                          : t < T.did
                            ? "sad"
                            : t < LOOP
                              ? "wink"
                              : "curious";
  const bulb = (t: number) =>
    Math.max(bulbPulse(t, T.five, 26), t >= T.fast && t < T.never ? 0.5 + 0.5 * Math.sign(Math.sin(t * 1.3)) : 0);

  return (
    <Stage
      bg={<Shop f={f} />}
      cam={cam}
      hits={[T.twenty + 4, T.five]}
      power={10}
      svg={
        <>
          {/* chalk board of caps (more than half said ₹10) */}
          {boardK > 0.01 && (
            <g opacity={boardK}>
              <rect x={110} y={420} width={860} height={440} rx={10} fill="none" stroke={CHALK} strokeWidth={6} strokeDasharray="22 14" opacity={0.6} />
              <text x={540} y={485} textAnchor="middle" fontFamily={FONT.comic} fontSize={48} fill={CHALK}>
                TOP UNIVERSITIES
              </text>
              {Array.from({ length: 10 }, (_, i) => {
                const [ans, k] = capAns(i);
                const x = 210 + (i % 5) * 165;
                const y = 560 + Math.floor(i / 5) * 175;
                return <Cap key={i} x={x} y={y} k={popIn(f, T.half + 2 + i * 2)} ans={ans} flipK={k} />;
              })}
            </g>
          )}

          <Bat />
          <Ball f={f} />

          {/* frame 0 + loop: ONE tag for both */}
          {comboOn && (
            <Tag x={COMBO[0]} y={COMBO[1]} w={330} h={170} rot={wobble(f, 0, 5, 10) + (loopBack ? wobble(f, LOOP, 7) : 0)} k={loopBack ? interpolate(f, [T.did + 8, T.did + 14], [0.6, 1], clamp) : 1}>
              <TagText size={104}>₹110</TagText>
            </Tag>
          )}
          {/* the split: two halves fly to the bat and the ball */}
          {!comboOn && pairK > 0.01 && (
            <g opacity={pairK}>
              <Tag
                x={interpolate(splitP, [0, 1], [COMBO[0] - 80, BATTAG[0]])}
                y={arc(splitP, [0, COMBO[1]], [0, BATTAG[1]], 70)[1]}
                w={interpolate(splitP, [0, 1], [170, 290])}
                h={interpolate(splitP, [0, 1], [170, 150])}
                rot={interpolate(splitP, [0, 1], [-20, 0]) + wobble(f, T.c1 + 14, 9)}
              >
                <g transform={`scale(${batScaleX(f < T.five0 ? flipBat : flipSolved)} 1)`} opacity={splitP > 0.8 ? 1 : 0}>
                  {batText === null ? (
                    <>
                      <TagText y={-28} size={42}>
                        BALL
                      </TagText>
                      <TagText y={26} size={56} color={ORANGE}>
                        +₹100
                      </TagText>
                    </>
                  ) : (
                    <TagText size={86} color={solved ? GREEN : INK}>
                      {batText}
                    </TagText>
                  )}
                </g>
              </Tag>
              <Tag
                x={interpolate(splitP, [0, 1], [COMBO[0] + 80, BALLTAG[0]])}
                y={arc(splitP, [0, COMBO[1]], [0, BALLTAG[1]], 90)[1]}
                w={interpolate(splitP, [0, 1], [170, 175])}
                h={150}
                rot={interpolate(splitP, [0, 1], [20, 0]) + wobble(f, T.c1 + 14, 9) + wobble(f, T.cost + 6, 14) + wobble(f, LAND, 12)}
              >
                <g transform={`scale(${f >= T.five0 ? batScaleX(flipSolved) : 1} 1)`} opacity={splitP > 0.8 ? 1 : 0}>
                  <TagText size={ballText === "?" ? 100 : 74} color={ballText === "₹5" ? GREEN : ballText === "₹10" ? RED : INK} x={12}>
                    {ballText}
                  </TagText>
                </g>
              </Tag>
            </g>
          )}
          {/* the ₹10 sticker in flight */}
          {throwT > 0 && throwT < 1 && (
            <g transform={`translate(${sticker[0]} ${sticker[1]}) rotate(${throwT * 540})`}>
              <circle r={44} fill={RED} {...K} strokeWidth={5} />
              <text y={15} textAnchor="middle" fontFamily={FONT.comic} fontSize={38} fill="#fff">
                ₹10
              </text>
            </g>
          )}
          {/* TOTAL tag: ₹120 ✗ → ₹110 ✓ */}
          {totalK > 0.01 && (
            <g opacity={totalK}>
              <Tag
                x={TOTAL[0]}
                y={interpolate(totalDrop, [0, 1], [RAIL - 120, TOTAL[1]])}
                w={340}
                h={170}
                fill={solved ? "#e4f8ec" : "#ffe1e1"}
                rot={wobble(f, T.thats + 12, 8) + wobble(f, T.five0, 6)}
                k={squash(f, T.thats + 12, 0.18)[1]}
              >
                <TagText y={-50} size={34} color={INK}>
                  TOTAL
                </TagText>
                <g transform={`scale(${solved ? batScaleX(flipSolved) : 1} 1)`}>
                  <TagText y={16} size={88} color={solved ? GREEN : RED}>
                    {solved ? "₹110 ✓" : "₹120"}
                  </TagText>
                </g>
              </Tag>
              {!solved && f >= T.twenty + 4 && (
                <g transform={`translate(${TOTAL[0] + 150} ${TOTAL[1] - 60}) scale(${popIn(f, T.twenty + 4)}) rotate(-10)`}>
                  <circle r={52} fill={RED} {...K} strokeWidth={6} />
                  <text y={26} textAnchor="middle" fontFamily={FONT.comic} fontSize={78} fill="#fff">
                    ✗
                  </text>
                </g>
              )}
              <Burst x={TOTAL[0]} y={TOTAL[1]} at={T.five} f={f} size={220} color={GOLD} />
            </g>
          )}

          {magK > 0.01 && <Magnifier f={f} k={magK} />}

          {/* SPARK on the shop floor (left, facing right) */}
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
              q = addPose(addPose(q, hop(t, T.five, 34)), hop(t, T.ten, 18));
              q = addPose(addPose(q, shake(t, T.twenty + 4)), nod(t, T.saidTen));
              return addPose(q, nod(t, T.ten9, 1));
            }}
          />
        </>
      }
      html={
        <>
          {overlayK > 0.01 && (
            <div style={{ position: "absolute", left: 540, top: 330, transform: "translate(-50%,-50%) rotate(-2deg)", opacity: overlayK, whiteSpace: "nowrap" }}>
              <span style={{ display: "inline-block", background: ORANGE, color: "#fff", padding: "6px 34px", fontFamily: FONT.comic, fontSize: 118, border: `7px solid ${INK}`, borderRadius: 18, WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill" }}>
                ₹110. BALL = ?
              </span>
            </div>
          )}
          <Slam f={f} at={T.five} out={T.half - 4} x={540} y={330} size={120} color={GREEN} stroke={`11px ${INK}`} rotate={-3}>
            BALL = ₹5
          </Slam>
          <Slam f={f} at={T.saidTen} out={T.fast - 4} x={540} y={330} size={90} color={RED} stroke={`10px ${CHALK}`} rotate={2}>
            MORE THAN HALF
          </Slam>
          <Slam f={f} at={T.never} out={T.did - 2} x={540} y={330} size={110} color={GOLD} stroke={`10px ${INK}`} rotate={-2}>
            NEVER CHECKED
          </Slam>
          {f >= T.five0 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1715, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: CHALK, whiteSpace: "nowrap", opacity: 0.9 }}>
                Frederick 2005 (J Econ Perspectives) · Kahneman 2011 · original: $1.10
              </div>
              <div style={{ position: "absolute", right: 96, top: 1770, fontFamily: FONT.title, fontWeight: 900, fontSize: 28, color: GOLD, letterSpacing: 2, opacity: 0.9 }}>10-SECOND TEST</div>
            </>
          )}
          <VoiceCaptions f={f} y={1500} cues={VOICE_CUES} hi={["hundred", "ten", "more", "five", "onetwenty", "half", "checked", "fast"]} />
          <Transition f={f} at={T.five0} kind="whip" size={VERTICAL} colors={[ORANGE, CHALK, GOLD]} />
        </>
      }
    />
  );
};
