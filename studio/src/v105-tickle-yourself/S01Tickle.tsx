import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, type Pose } from "../stickman/stick";
import { Burst, COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { camAt, Transition, VERTICAL, type Shot } from "../shared/camera";
import { ease, popIn, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// V105 · "Why can't you tickle yourself?" (10-second test, ~28 s, clarity rules 2026-10-29)
// Two places only, the change announced by the narration ("In a lab, ..."):
// A) Spark's sunny peach bedroom in the morning. He tickles his own chin with a big pink feather: nothing happens.
//    "Your brain knows what your hand will do": a dashed GHOST feather appears first where the hand is going,
//    and the real feather slides along the dotted path into it. A FEELING meter beside him stays low.
// B) "In a lab": a lilac lab with a long white table. A PERSON (orange) moves a lever with one hand; a small robot
//    arm copies the lever and strokes the person's other hand with a soft foam tip. No delay: nothing.
//    "1/5 SECOND" card: the robot lags, the person laughs, the same FEELING meter jumps up.
//    INSERT: the dashed GUESS tip sits where the lever says, the real TOUCH tip arrives late: the guess missed.
//    Spark offers the feather to the viewer: comment question. Loops into frame 0.
// Sources: Blakemore, Wolpert & Frith 1998 Nature Neuroscience 1:635; Blakemore, Frith & Wolpert 1999 J Cogn Neurosci 11:551.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const HEADY = STANDY - 200;

// palette: sunny peach bedroom + lilac lab
const WALL = "#ffd6bf";
const WALL2 = "#f5b99a";
const SKY = "#9fd8ff";
const LEAF = "#6cbf5a";
const LEAF2 = "#4f9e44";
const FLOOR = "#c98f5e";
const FLOOR2 = "#b37a4c";
const BEDC = "#7d8ee8";
const PINK = "#ff7eb6";
const PINK2 = "#e0569a";
const LAB = "#d9d2f2";
const LAB2 = "#c4bbe6";
const TILE = "#e9e4fa";
const STEEL = "#9aa6b8";
const STEEL2 = "#6f7b8e";
const FOAM = "#ffe08a";
const ORANGE = "#ff8a3d";
const GOLD = "#ffd23f";
const RED = "#e8505b";
const GREEN = "#3fae5a";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  tickle0: W(0, 2),
  now0: W(0, 5),
  c1: C(1),
  stop1: W(1, 0),
  brain1: W(1, 4),
  blocks: W(1, 5),
  c2: C(2),
  knows: W(2, 2),
  hand2: W(2, 5),
  c3: C(3),
  touch3: W(3, 3),
  weaker: W(3, 5),
  c4: C(4),
  lab: W(4, 2),
  tickled4: W(4, 4),
  robot4: W(4, 8),
  c5: C(5),
  waited: W(5, 3),
  fifth: W(5, 5),
  tickled5: W(5, 10),
  c6: C(6),
  touch6: W(6, 1),
  late: W(6, 3),
  guess: W(6, 7),
  missed: W(6, 8),
  c7: C(7),
  who: W(7, 0),
  most: W(7, 5),
};
const LOOP = VOICE_FRAMES - 14;
const LAB0 = T.lab + 10; // shutter into the lab right after the word "lab"
const DELAY = T.waited; // from here the robot copies the lever 6 frames (0.2 s) late
const LAG = 6;

// staging
const SX_A = 470; // Spark in the bedroom
const METER_A = { x: 780, y0: 1150, h: 380 };
const SX_B = 860; // Spark in the lab
const PX = 360; // the PERSON in the lab
const PS = 1.6;
const PY = GROUND - 92.5 * PS;
const TT = PY + 10; // table top
const LEVX = 150; // lever pivot
const RBX = 690; // robot shoulder x
const RBY = TT - 150; // robot shoulder y
const METER_B = { x: 150, y0: 900, h: 330 };

// shots: one camera move per sentence, held 2.5–5 s, slow moves (clarity rules)
const SHOTS: Shot[] = [
  { f: 0, z: 1.35, at: [SX_A + 30, HEADY + 120], e: "cut" }, // frame 0: Spark + feather
  { f: 4, z: 1.5, at: [SX_A + 30, HEADY + 110], e: "slow" }, // slow push while he tries
  { f: T.c1 - 4, z: 1.15, at: [SX_A + 120, HEADY + 160], e: "slow" }, // MED: "stop trying"
  { f: T.c2 - 4, z: 1.85, at: [SX_A + 70, HEADY + 70], e: "slow" }, // INSERT: hand, feather, dotted path, ghost
  { f: T.c3 - 4, z: 1.3, at: [SX_A + 150, HEADY + 170], e: "slow" }, // MED: FEELING meter stays low
  { f: LAB0, z: 1.12, at: [540, 1040], e: "cut" }, // WIDE: the lab
  { f: T.c5 - 6, z: 1.15, at: [560, 1000], e: "slow" }, // MED: robot, person, 1/5 SECOND
  { f: T.c6 - 6, z: 1.75, at: [560, TT - 40], e: "slow" }, // INSERT: GUESS vs TOUCH on the palm
  { f: T.c7 - 6, z: 1.6, at: [SX_B - 60, HEADY + 90], e: "slow" }, // CU: Spark asks the question
  { f: LOOP, z: 1.35, at: [SX_A + 30, HEADY + 120], e: "cut" }, // back into frame 0
];

// --- props --------------------------------------------------------------------------------------------------------
// a big pink feather, drawn with its quill at (0,0), pointing up (-y)
const Feather: React.FC<{ ghost?: boolean; s?: number }> = ({ ghost = false, s = 1 }) => (
  <g transform={`scale(${s})`} opacity={ghost ? 0.75 : 1}>
    <path
      d="M 0 0 C -8 -40 -40 -90 -30 -150 C -24 -190 0 -220 14 -230 C 30 -200 36 -150 28 -100 C 22 -60 10 -30 0 0 Z"
      fill={ghost ? "none" : PINK}
      stroke={ghost ? GOLD : INK}
      strokeWidth={ghost ? 6 : 5}
      strokeDasharray={ghost ? "14 10" : undefined}
      strokeLinejoin="round"
    />
    {!ghost && (
      <>
        <path d="M 0 0 C 4 -70 8 -150 12 -224" fill="none" stroke={PINK2} strokeWidth={5} strokeLinecap="round" />
        {[-60, -100, -140, -180].map((y, i) => (
          <path key={i} d={`M ${6 + i} ${y} l -22 -16 M ${8 + i} ${y + 8} l 18 -18`} stroke={PINK2} strokeWidth={3} strokeLinecap="round" />
        ))}
      </>
    )}
    <path d="M 0 0 L -3 22" stroke={ghost ? GOLD : INK} strokeWidth={5} strokeLinecap="round" />
  </g>
);

// FEELING meter: a tall capsule that fills from the bottom (v: 0..1)
const Meter: React.FC<{ x: number; y0: number; h: number; v: number; k: number }> = ({ x, y0, h, v, k }) => {
  const col = v > 0.6 ? RED : v > 0.3 ? GOLD : GREEN;
  return (
    <g transform={`translate(${x} ${y0}) scale(${k})`} opacity={Math.min(1, k * 1.4)}>
      <rect x={-46} y={-h} width={92} height={h} rx={46} fill={WHITE} {...K} strokeWidth={6} />
      {v > 0.01 && <rect x={-36} y={-10 - (h - 20) * v} width={72} height={(h - 20) * v} rx={34} fill={col} />}
      <text y={52} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
        FEELING
      </text>
    </g>
  );
};

// world A: sunny peach bedroom
const Bedroom: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect width={1080} height={1920} fill={WALL} />
    {/* window: blue sky + a tree */}
    <g transform="translate(90 560)">
      <rect x={0} y={0} width={300} height={340} rx={14} fill={SKY} {...K} />
      <circle cx={220} cy={80} r={40} fill="#fff4b0" />
      <g transform={`rotate(${Math.sin(f / 30) * 2}, 120, 330)`}>
        <rect x={110} y={210} width={22} height={130} fill="#8a5a3b" />
        <circle cx={120} cy={190} r={74} fill={LEAF} stroke={INK} strokeWidth={5} />
        <circle cx={80} cy={210} r={40} fill={LEAF2} />
      </g>
      <line x1={150} y1={0} x2={150} y2={340} stroke={INK} strokeWidth={7} />
      <line x1={0} y1={170} x2={300} y2={170} stroke={INK} strokeWidth={7} />
      <rect x={-14} y={330} width={328} height={22} rx={6} fill={WHITE} {...K} strokeWidth={5} />
    </g>
    {/* skirting + wooden floor */}
    <rect x={0} y={GROUND - 34} width={1080} height={34} fill={WALL2} stroke={INK} strokeWidth={4} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill={FLOOR} />
    {Array.from({ length: 7 }, (_, i) => (
      <line key={i} x1={0} y1={GROUND + 60 + i * 85} x2={1080} y2={GROUND + 60 + i * 85} stroke={FLOOR2} strokeWidth={5} />
    ))}
    {/* bed corner on the left, behind Spark */}
    <rect x={-20} y={GROUND - 170} width={230} height={170} rx={16} fill={BEDC} {...K} strokeWidth={5} />
    <rect x={-20} y={GROUND - 200} width={240} height={60} rx={24} fill={WHITE} {...K} strokeWidth={5} />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

// world B: lilac lab
const Lab: React.FC = () => (
  <g>
    <rect width={1080} height={1920} fill={LAB} />
    {Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (
        <rect key={`${r}-${c}`} x={20 + c * 150} y={420 + r * 130} width={138} height={118} rx={8} fill={TILE} opacity={0.7} />
      )),
    )}
    {/* LAB sign */}
    <g transform="translate(540 330)">
      <rect x={-110} y={-44} width={220} height={88} rx={14} fill={WHITE} {...K} strokeWidth={6} />
      <text y={22} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={60} fill={INK}>
        LAB
      </text>
    </g>
    <rect x={0} y={GROUND - 34} width={1080} height={34} fill={LAB2} stroke={INK} strokeWidth={4} />
    <rect y={GROUND} width={1080} height={1920 - GROUND} fill="#b9b3cf" />
    <line x1={0} y1={GROUND} x2={1080} y2={GROUND} stroke={INK} strokeWidth={6} />
  </g>
);

const Table: React.FC = () => (
  <g>
    <rect x={60} y={TT} width={760} height={34} rx={8} fill={WHITE} {...K} strokeWidth={6} />
    <rect x={90} y={TT + 34} width={700} height={GROUND - TT - 34} fill="#ece9f6" stroke={INK} strokeWidth={5} />
    <line x1={90} y1={TT + 110} x2={790} y2={TT + 110} stroke={LAB2} strokeWidth={5} />
  </g>
);

// two-link arm from shoulder (sx, sy) to target (tx, ty)
const ik = (sx: number, sy: number, tx: number, ty: number, L1: number, L2: number): [number, number] => {
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.max(Math.abs(L1 - L2) + 1, Math.min(L1 + L2 - 1, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const b = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  return [sx + L1 * Math.cos(a + b), sy + L1 * Math.sin(a + b)];
};

const Robot: React.FC<{ tip: [number, number]; on: boolean }> = ({ tip, on }) => {
  const [ex, ey] = ik(RBX, RBY, tip[0], tip[1] - 26, 170, 150);
  return (
    <g>
      {/* base on the table */}
      <rect x={RBX - 70} y={TT - 110} width={140} height={110} rx={14} fill={STEEL} {...K} strokeWidth={6} />
      <circle cx={RBX + 38} cy={TT - 70} r={9} fill={on ? GREEN : STEEL2} stroke={INK} strokeWidth={3} />
      <rect x={RBX - 18} y={RBY} width={36} height={TT - 110 - RBY} fill={STEEL2} stroke={INK} strokeWidth={5} />
      <line x1={RBX} y1={RBY} x2={ex} y2={ey} stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <line x1={RBX} y1={RBY} x2={ex} y2={ey} stroke={STEEL} strokeWidth={20} strokeLinecap="round" />
      <line x1={ex} y1={ey} x2={tip[0]} y2={tip[1] - 26} stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <line x1={ex} y1={ey} x2={tip[0]} y2={tip[1] - 26} stroke={STEEL} strokeWidth={16} strokeLinecap="round" />
      <circle cx={RBX} cy={RBY} r={20} fill={STEEL2} stroke={INK} strokeWidth={5} />
      <circle cx={ex} cy={ey} r={16} fill={STEEL2} stroke={INK} strokeWidth={5} />
      {/* soft foam tip */}
      <ellipse cx={tip[0]} cy={tip[1] - 12} rx={26} ry={18} fill={FOAM} stroke={INK} strokeWidth={5} />
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [2, "swish", 0.18],
  [24, "swish", 0.15],
  [T.now0 + 10, "tick", 0.2],
  [T.stop1, "pop", 0.25],
  [T.brain1, "ding", 0.25],
  [T.c2 - 4, "whoosh", 0.15],
  [T.knows, "pop", 0.25],
  [T.hand2 + 4, "swish", 0.2],
  [T.c3 + 4, "pop", 0.2],
  [T.weaker, "tick", 0.2],
  [LAB0 - 8, "whoosh_long", 0.3],
  [T.robot4, "clink", 0.25],
  [T.fifth - 2, "pop", 0.35],
  [T.tickled5 - 4, "riser", 0.15],
  [T.tickled5, "boing", 0.3],
  [T.touch6, "pop", 0.25],
  [T.guess, "pop", 0.25],
  [T.c7 - 4, "whoosh", 0.12],
  [LOOP, "tick", 0.15],
];

const TICKLE_SELF: Partial<Pose> = { ra1: 18, ra2: 104, la1: -14, la2: 8, head: -10 };
const HOLD_DOWN: Partial<Pose> = { ra1: 30, ra2: 20, la1: -14, la2: 8, head: 4 };
const OFFER: Partial<Pose> = { ra1: 80, ra2: 30, la1: -16, la2: 10, lean: 8, head: 6 };

export const S01Tickle: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const home = f < LAB0 || loopBack;
  const lab = !home;
  const cam = camAt(f, SHOTS, VERTICAL);

  // --- bedroom ---
  const ghostK = home && !loopBack && f >= T.knows - 2 && f < T.hand2 + 30 ? Math.min(popIn(f, T.knows - 2), interpolate(f, [T.hand2 + 14, T.hand2 + 30], [1, 0], clamp)) : 0;
  const pathK = home && !loopBack && f < T.hand2 + 30 ? Math.min(ease(f, T.knows, T.knows + 12, 0, 1), interpolate(f, [T.hand2, T.hand2 + 14], [1, 0], clamp)) : 0;
  const meterAK = home && !loopBack && f >= T.c3 ? popIn(f, T.c3) : 0;
  const meterAV = (home && !loopBack ? ease(f, T.touch3, T.touch3 + 14, 0, 0.32) - ease(f, T.weaker, T.weaker + 16, 0, 0.18) : 0) + 0.01 * Math.sin(f / 4);

  // --- lab ---
  const lagOn = f >= DELAY;
  const phase = (t: number) => Math.sin(t / 5);
  const amp = lab ? ease(f, T.tickled4 - 10, T.tickled4 + 4, 0, 1) : 0;
  const cardK = lab && f >= T.fifth - 2 ? popIn(f, T.fifth - 2) : 0;
  const laughing = lab && f >= T.tickled5 && f < T.c7;
  const meterBK = lab && f >= T.tickled5 - 20 ? popIn(f, T.tickled5 - 20) : 0;
  const meterBV = lab ? ease(f, T.tickled5 - 8, T.tickled5 + 10, 0.12, 0.88) + (laughing ? 0.03 * Math.sin(f / 2) : 0) : 0;
  const labelTouch = lab && f >= T.touch6 && f < T.c7 ? popIn(f, T.touch6) : 0;
  const labelGuess = lab && f >= T.guess - 2 && f < T.c7 ? popIn(f, T.guess - 2) : 0;
  const ghostTip = lab && f >= T.c6 - 6 && f < T.c7 ? interpolate(f, [T.c6 - 6, T.c6 + 6], [0, 1], clamp) : 0;

  // the person's lever arm sways; the robot copies it (late after DELAY)
  const personKeys = gestureKeys([
    [0, { ra1: 52, ra2: 34, la1: -40, la2: -30, head: 8 }],
  ]);
  const personMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t + 7, 2));
    q = addPose(q, { la1: 14 * amp * phase(t), la2: 6 * amp * phase(t) });
    q = addPose(q, shake(t, T.tickled5, 3));
    return q;
  };

  // --- Spark ---
  const sx = lab ? SX_B : SX_A;
  const sparkKeys = home
    ? gestureKeys([
        [0, TICKLE_SELF],
        [T.c1, G.stop, "snap"],
        [T.brain1, G.pointUp, "smooth"],
        [T.c2 - 6, HOLD_DOWN, "smooth"],
        [T.hand2, TICKLE_SELF, "smooth"],
        [T.weaker, G.shrugBig, "smooth"],
        [LOOP - 4, TICKLE_SELF, "snap"],
      ])
    : gestureKeys([
        [LAB0, G.presentBoth],
        [T.robot4, G.pointSide, "smooth"],
        [T.c5, G.thinkChin, "smooth"],
        [T.fifth, G.count1, "smooth"],
        [T.tickled5, G.mindBlown, "snap"],
        [T.c6, G.pointSide, "smooth"],
        [T.missed, G.shrugBig, "smooth"],
        [T.c7 - 6, OFFER, "smooth"],
      ]);
  // Spark faces left (towards the lab table) in the lab
  const facing = lab && f < T.c7 - 6 ? -1 : 1;

  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "skeptical";
    if (t < T.now0 + 6) return "skeptical";
    if (t < T.c1) return "neutral";
    if (t < T.brain1) return "smug";
    if (t < T.c2) return "determined";
    if (t < T.c3) return "thinking";
    if (t < LAB0) return "sad";
    if (t < T.c5) return "curious";
    if (t < T.tickled5) return "thinking";
    if (t < T.c6) return "mindblown";
    if (t < T.missed) return "excited";
    if (t < T.c7) return "happy";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.brain1, 30), bulbPulse(t, T.knows, 34), bulbPulse(t, T.tickled5, 30));
  const tickleWig = (t: number) => (t < T.c1 || (t >= T.hand2 + 14 && t < T.weaker) || t >= LOOP - 2 ? 1 : 0);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, { ra2: 10 * tickleWig(t) * Math.sin(t / 2.2) });
    q = addPose(q, nod(t, T.blocks, 1));
    q = addPose(q, hop(t, T.tickled5, 14));
    q = addPose(q, nod(t, T.most, 1));
    return { ...q, x: sx };
  };

  // feather on Spark's hand (bedroom: pointing up at his chin; lab: held, or offered to the viewer)
  const featherRot = (t: number) => (lab ? (t >= T.c7 - 6 ? 30 : -10) : -82 + tickleWig(t) * 9 * Math.sin(t / 2));
  const sparkEl = (
    <Spark f={f} scale={SS} base={{ x: sx, y: STANDY }} facing={facing} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod}>
      {(j) => {
        const gx = j.headC[0] + 42;
        const gy = j.headC[1] + 75;
        return (
          <>
            {pathK > 0.01 && (
              <path d={`M ${j.rHand[0]} ${j.rHand[1]} Q ${gx + 120} ${(gy + j.rHand[1]) / 2} ${gx} ${gy}`} fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray="4 16" strokeLinecap="round" opacity={pathK} />
            )}
            {ghostK > 0.01 && (
              <g transform={`translate(${gx} ${gy}) rotate(-82) scale(${ghostK})`}>
                <Feather ghost s={0.55} />
              </g>
            )}
            <g transform={`translate(${j.rHand[0]} ${j.rHand[1]}) rotate(${featherRot(f) * (facing === -1 ? -1 : 1)})`}>
              <Feather s={lab ? 0.7 : 0.55} />
            </g>
          </>
        );
      }}
    </Spark>
  );

  // "nothing happens" dots next to Spark's face at the hook
  const dotsK = home && (f < T.c1 || loopBack) ? interpolate(f, [T.now0 + 6, T.now0 + 14], [0, 1], clamp) : 0;

  return (
    <Stage
      bg={<AbsoluteFill style={{ background: lab ? LAB : WALL }} />}
      cam={cam}
      hits={[T.tickled5]}
      power={5}
      svg={
        home ? (
          <>
            <Bedroom f={f} />
            {meterAK > 0.01 && <Meter x={METER_A.x} y0={METER_A.y0} h={METER_A.h} v={Math.max(0, meterAV)} k={meterAK} />}
            {sparkEl}
            {dotsK > 0.01 &&
              [0, 1, 2].map((i) => (
                <circle key={i} cx={SX_A + 150 + i * 30} cy={HEADY - 130} r={9} fill={INK} opacity={dotsK * interpolate(Math.sin(f / 5 - i), [-1, 1], [0.3, 1])} />
              ))}
          </>
        ) : (
          <>
            <Lab />
            {/* the lever stand (left) */}
            <rect x={LEVX - 40} y={TT - 40} width={80} height={40} rx={8} fill={STEEL} {...K} strokeWidth={5} />
            <Actor
              f={f}
              color={ORANGE}
              scale={PS}
              base={{ x: PX, y: PY }}
              keys={personKeys}
              mod={personMod}
              facing={1}
              face={laughing ? "happy" : "eyes"}
              label="PERSON"
              trails={false}
            >
              {(j) => {
                const swayNow = amp * phase(f);
                const swayLate = amp * phase(lagOn ? f - LAG : f);
                const palm: [number, number] = [j.rHand[0] + 30, TT - 2];
                const tip: [number, number] = [palm[0] + 55 * swayLate, palm[1] - 8];
                const guessTip: [number, number] = [palm[0] + 55 * swayNow, palm[1] - 8];
                return (
                  <>
                    {/* lever from the pivot to the left hand */}
                    <line x1={LEVX} y1={TT - 40} x2={j.lHand[0]} y2={j.lHand[1]} stroke={INK} strokeWidth={14} strokeLinecap="round" />
                    <line x1={LEVX} y1={TT - 40} x2={j.lHand[0]} y2={j.lHand[1]} stroke={STEEL2} strokeWidth={7} strokeLinecap="round" />
                    <circle cx={j.lHand[0]} cy={j.lHand[1]} r={16} fill={RED} stroke={INK} strokeWidth={4} />
                    <Table />
                    {/* the person's open hand on the table */}
                    <line x1={j.rHand[0]} y1={j.rHand[1]} x2={palm[0] - 20} y2={palm[1] - 4} stroke={INK} strokeWidth={9} strokeLinecap="round" />
                    <ellipse cx={palm[0]} cy={palm[1] - 6} rx={40} ry={13} fill="#ffd2b0" stroke={INK} strokeWidth={4} />
                    {/* GUESS ghost tip (where the lever says the touch should be) */}
                    {ghostTip > 0.01 && (
                      <ellipse cx={guessTip[0]} cy={guessTip[1] - 12} rx={34} ry={24} fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray="10 8" opacity={ghostTip} />
                    )}
                    <Robot tip={tip} on={amp > 0.5} />
                    {laughing &&
                      [0, 1].map((i) => (
                        <text key={i} x={PX + (i ? 60 : -110)} y={PY - 360 - ((f + i * 10) % 30)} fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={ORANGE} stroke={INK} strokeWidth={2} opacity={1 - ((f + i * 10) % 30) / 30}>
                          HA
                        </text>
                      ))}
                    {labelTouch > 0.01 && (
                      <g transform={`translate(${tip[0] + 10} ${tip[1] + 70}) scale(${labelTouch * 0.8})`}>
                        <rect x={-80} y={-30} width={160} height={56} rx={12} fill={WHITE} {...K} strokeWidth={5} />
                        <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={INK}>
                          TOUCH
                        </text>
                      </g>
                    )}
                    {labelGuess > 0.01 && (
                      <g transform={`translate(${guessTip[0] + 30} ${palm[1] - 150}) scale(${labelGuess * 0.8})`}>
                        <rect x={-80} y={-30} width={160} height={56} rx={12} fill={GOLD} {...K} strokeWidth={5} />
                        <text y={14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={38} fill={INK}>
                          GUESS
                        </text>
                      </g>
                    )}
                  </>
                );
              }}
            </Actor>
            {meterBK > 0.01 && <Meter x={METER_B.x} y0={METER_B.y0} h={METER_B.h} v={meterBV} k={meterBK} />}
            {cardK > 0.01 && (
              <g transform={`translate(${RBX - 150} ${RBY - 210}) scale(${cardK}) rotate(${wobble(f, T.fifth + 2, 5)})`}>
                <rect x={-150} y={-56} width={300} height={104} rx={18} fill={WHITE} {...K} strokeWidth={6} />
                <circle cx={-100} cy={-4} r={30} fill={WHITE} stroke={INK} strokeWidth={5} />
                <line x1={-100} y1={-4} x2={-100 + 20 * Math.sin(f / 6)} y2={-4 - 20 * Math.cos(f / 6)} stroke={RED} strokeWidth={5} strokeLinecap="round" />
                <text x={36} y={10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={40} fill={INK}>
                  1/5 SECOND
                </text>
              </g>
            )}
            {f >= T.tickled5 && f < T.tickled5 + 14 && <Burst x={PX} y={PY - 300} at={T.tickled5} f={f} size={170} color={GOLD} />}
            {sparkEl}
          </>
        )
      }
      html={
        <>
          {/* frame-0 overlay (≤ 4 words) */}
          {(f < T.c1 - 6 || loopBack) && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: FONT.title, fontWeight: 900, lineHeight: 1.0, fontSize: 108, transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`, opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 6], [1, 0], clamp) }}>
              <div style={{ color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>TICKLE</div>
              <div style={{ color: PINK, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>YOURSELF</div>
            </div>
          )}
          {f >= 300 && f < LOOP - 4 && (
            <>
              <div style={{ position: "absolute", left: 540, top: 1700, transform: "translate(-50%,-50%)", fontFamily: FONT.body, fontWeight: 700, fontSize: 23, color: INK, whiteSpace: "nowrap", opacity: 0.9, background: "rgba(255,255,255,0.8)", padding: "2px 12px", borderRadius: 8 }}>
                Blakemore, Wolpert & Frith 1998 · Blakemore et al. 1999 (16 adults, robot test)
              </div>
              <div style={{ position: "absolute", right: 96, top: 1752, fontFamily: FONT.title, fontWeight: 900, fontSize: 27, color: PINK2, letterSpacing: 2, opacity: 0.95 }}>10-SECOND TEST</div>
            </>
          )}
          <VoiceCaptions
            f={f}
            y={1500}
            cues={VOICE_CUES}
            hi={["tickle", "yourself,", "Stop", "brain", "blocks", "knows", "hand", "weaker.", "lab,", "robot.", "fifth", "second,", "tickled.", "late,", "guess", "missed.", "most?"]}
          />
          <Transition f={f} at={LAB0} kind="shutter" size={VERTICAL} colors={[LAB2, PINK, GOLD]} />
        </>
      }
    />
  );
};
