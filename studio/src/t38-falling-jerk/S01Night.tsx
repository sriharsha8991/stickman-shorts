import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, walkCycle, type Joints, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchLine, type Hair } from "../shared/doodle";
import { MrTrick, type TrickMood } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T38 · "Why does your body jump as you fall asleep?" Spark Got Tricked #10 (STORY, pencil look, 27.8 s).
// ONE world, one camera rig: an apartment building at night, cut open like a doll's house. Spark's bedroom is bottom-middle.
// Mr. Trick stands on the nightstand. Spark falls asleep, dreams he walks on a rug, Mr. Trick yanks the rug, little dream-Spark
// falls and real Spark's whole body jumps awake. He thinks he fell, but his bed never moved. The camera pulls back: in the other
// rooms sleepers jump too, one after another (6 of the 8 others: "most people"). It is normal (AASM, facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const eo = Easing.out(Easing.cubic);
const ein = Easing.in(Easing.quad);

const ACCENT = "#ec8f1c"; // amber: the dream rug, the jolt, the lights that click on
const NIGHT = "#22304d";
const WALL = "#e6dfcf";
const CREAM = "#fffdf6";
const FLOOR = 1440;
const S = 2.4;

// --- timing (anchored to spoken words) --------------------------------------------------------------------------------
const LAND0 = 18; // frame 0: he drops back on the mattress
const SIT1 = W(0, 4) + 4; // "jump,": sits up
const PROMISE = C(1);
const LIE = E(1) + 6; // lies back down
const BUB = W(2, 2); // "almost": the dream bubble
const REACH = BUB + 12; // Mr. Trick takes the tassel
const YANK = W(2, 6); // "feel": he yanks the rug
const DROPM = W(2, 8); // "fall.": little Spark falls
const JOLT = W(3, 3); // "jumps,": the real jump
const SIT2 = W(3, 6) + 2; // "awake.": sits up
const LOOKD = C(4); // "But look,": leans over the edge
const PAT = W(4, 3); // "bed": pats the mattress
const DROP = E(4) + 4; // lights + music drop, camera pulls back
const WIN = [W(5, 0), W(5, 1) + 2, W(5, 2), W(5, 3), W(5, 4) + 2, W(5, 6)]; // the other sleepers jump, one after another
const HIT = W(5, 7); // "normal!"
export { HIT };
const BACK = HIT + 52; // camera back into the bedroom
const MUG = W(6, 2); // "coffee,"
const WORSE = W(6, 8); // "worse."
const Q = C(7);
const LIE2 = VOICE_FRAMES - 30; // lies down for the loop
const RE = VOICE_FRAMES - 8; // the loop jump: at VOICE_FRAMES he is in the frame-0 pose
const LOOPTXT = VOICE_FRAMES - 20;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [350, 1110, 1.75];
const ROOM: V3 = [490, 1040, 1.08];
const BED: V3 = [470, 1000, 1.35];
const WIDE: V3 = [490, 260, 0.36];
const QCU: V3 = [440, 1010, 1.95];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 4, PROMISE - 6, ROOM), // pull back: the bedroom, Mr. Trick on the nightstand
  k(LIE - 2, LIE + 20, BED), // in to the bed and the dream
  k(SIT2 + 6, SIT2 + 26, ROOM), // he sits up: the room
  k(DROP, DROP + 22, WIDE), // the pause: out to the whole building, it arrives before the line
  k(BACK, BACK + 20, ROOM), // back into the room for the tip
  k(Q - 14, Q + 8, QCU), // the question: his face
  k(LIE2 + 4, RE + 2, F0), // the loop: frame 0
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const e = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: eio });
    cur = { fx: cur.fx + (fx - cur.fx) * e, fy: cur.fy + (fy - cur.fy) * e, z: cur.z + (z - cur.z) * e };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- the building --------------------------------------------------------------------------------------------------------
const RW = 900; // room inner width
const RH = 760; // room inner height
const roomX = (c: number) => -900 + c * 940;
const roomFloor = (r: number) => FLOOR - r * 800;

const Sky: React.FC = () => (
  <g>
    <rect x={-3000} y={-4200} width={8000} height={4200 + FLOOR} fill={NIGHT} />
    {/* stars */}
    {Array.from({ length: 34 }, (_, i) => {
      const x = -1100 + ((i * 397) % 3200);
      const y = -2400 + ((i * 211) % 1300);
      const r = 5 + (i % 3) * 3;
      return <path key={i} d={`M ${x - r} ${y} L ${x + r} ${y} M ${x} ${y - r} L ${x} ${y + r}`} stroke="#f3ead2" strokeWidth={4} opacity={0.7} />;
    })}
    {/* the moon */}
    <circle cx={1560} cy={-1450} r={130} fill="#f6efdb" stroke={GRAPHITE} strokeWidth={8} />
    <circle cx={1615} cy={-1490} r={118} fill={NIGHT} />
    {/* the street */}
    <rect x={-3000} y={FLOOR} width={8000} height={1600} fill="#4a4a4f" />
    <Hatch x={-3000} y={FLOOR + 10} w={8000} h={400} gap={34} color="#222" o={0.25} />
  </g>
);

const Facade: React.FC = () => (
  <g>
    <rect x={-940} y={-1000} width={2860} height={FLOOR + 1000} fill={PAPER2} stroke={GRAPHITE} strokeWidth={10} />
    <Hatch x={-930} y={-990} w={2840} h={FLOOR + 980} gap={40} o={0.12} width={3} />
    {/* roof: a small water tank + an aerial */}
    <rect x={1300} y={-1170} width={220} height={170} rx={20} fill={PAPER2} stroke={GRAPHITE} strokeWidth={8} />
    <line x1={-500} y1={-1000} x2={-500} y2={-1260} stroke={GRAPHITE} strokeWidth={8} />
    <line x1={-580} y1={-1200} x2={-420} y2={-1200} stroke={GRAPHITE} strokeWidth={6} />
  </g>
);

// a room interior (wall + floor + back window); the bed is drawn by the sleeper
const RoomShell: React.FC<{ c: number; r: number; window?: boolean }> = ({ c, r, window = true }) => {
  const x0 = roomX(c);
  const fl = roomFloor(r);
  const top = fl - RH;
  return (
    <g>
      <rect x={x0} y={top} width={RW} height={RH} fill={WALL} />
      <Hatch x={x0} y={fl - 60} w={RW} h={60} gap={22} o={0.18} />
      <SketchLine x1={x0} y1={fl} x2={x0 + RW} y2={fl} w={6} />
      {window && (
        <g>
          <rect x={x0 + RW / 2 - 110} y={top + 90} width={220} height={240} fill={NIGHT} stroke={GRAPHITE} strokeWidth={7} />
          <line x1={x0 + RW / 2} y1={top + 90} x2={x0 + RW / 2} y2={top + 330} stroke={GRAPHITE} strokeWidth={5} />
          <circle cx={x0 + RW / 2 + 60} cy={top + 150} r={4} fill="#f3ead2" />
          <circle cx={x0 + RW / 2 - 50} cy={top + 230} r={3} fill="#f3ead2" />
        </g>
      )}
    </g>
  );
};

const Bed: React.FC<{ x0: number; x1: number; top: number; fl: number; head: "left" | "right" }> = ({ x0, x1, top, fl, head }) => {
  const hx = head === "left" ? x0 - 12 : x1 - 18;
  return (
    <g>
      <ellipse cx={(x0 + x1) / 2} cy={fl + 4} rx={(x1 - x0) / 2 + 20} ry={10} fill={GRAPHITE} opacity={0.22} />
      <rect x={hx} y={top - 130} width={30} height={fl - top + 130} rx={8} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      <rect x={x0} y={top} width={x1 - x0} height={50} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      <rect x={x0} y={top + 50} width={x1 - x0} height={44} fill="#d9cfb8" stroke={GRAPHITE} strokeWidth={6} />
      <Hatch x={x0 + 6} y={top + 54} w={x1 - x0 - 12} h={36} gap={16} o={0.25} width={2} />
      {[x0 + 14, x1 - 34].map((x) => (
        <rect key={x} x={x} y={top + 94} width={20} height={fl - top - 94} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
      ))}
      {/* pillow */}
      <path
        d={head === "left" ? `M ${x0 + 14} ${top - 4} q 0 -42 60 -40 l 70 0 q 40 0 40 40 Z` : `M ${x1 - 14} ${top - 4} q 0 -42 -60 -40 l -70 0 q -40 0 -40 40 Z`}
        fill={CREAM}
        stroke={GRAPHITE}
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </g>
  );
};

// jolt marks: short amber strokes flying out around a point
const JoltMarks: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  if (t < 0 || t > 18) return null;
  const p = interpolate(t, [0, 6], [0, 1], { ...clamp, easing: eo });
  const o = interpolate(t, [10, 18], [1, 0], clamp);
  return (
    <g opacity={o} stroke={ACCENT} strokeWidth={9 * s} strokeLinecap="round">
      {[-150, -110, -70, -30, 30].map((a, i) => {
        const r0 = (70 + 40 * p) * s;
        const r1 = r0 + 50 * s * p;
        const ra = (a * Math.PI) / 180;
        return <line key={i} x1={x + Math.cos(ra) * r0} y1={y + Math.sin(ra) * r0} x2={x + Math.cos(ra) * r1} y2={y + Math.sin(ra) * r1} />;
      })}
    </g>
  );
};

// --- the other rooms: 8 sleepers, 6 jump (one after another), 2 sleep on -------------------------------------------------
type Room = { c: number; r: number; hair: Hair; glasses?: boolean; head: "left" | "right"; jolt: number | null };
const ROOMS: Room[] = [
  { c: 2, r: 1, hair: "long", head: "right", jolt: WIN[0] },
  { c: 0, r: 0, hair: "bald", glasses: true, head: "left", jolt: WIN[1] },
  { c: 1, r: 2, hair: "bun", head: "left", jolt: WIN[2] },
  { c: 2, r: 0, hair: "short", head: "right", jolt: WIN[3] },
  { c: 0, r: 2, hair: "curly", glasses: true, head: "right", jolt: WIN[4] },
  { c: 1, r: 1, hair: "cap", head: "right", jolt: WIN[5] },
  { c: 0, r: 1, hair: "short", head: "left", jolt: null },
  { c: 2, r: 2, hair: "long", glasses: true, head: "left", jolt: null },
];
const DS = 2.0;
const Sleeper: React.FC<{ room: Room; f: number }> = ({ room, f }) => {
  const x0 = roomX(room.c);
  const fl = roomFloor(room.r);
  const bx0 = room.head === "left" ? x0 + 70 : x0 + 290;
  const bx1 = bx0 + 540;
  const mTop = fl - 200;
  const t = room.jolt === null ? -1 : f - room.jolt;
  const air = t < 0 ? 0 : t < 6 ? interpolate(t, [0, 6], [0, 70], { ...clamp, easing: eo }) : interpolate(t, [6, 18], [70, 0], { ...clamp, easing: ein });
  const awake = t >= 0;
  const hipX = room.head === "left" ? bx0 + 250 : bx1 - 250;
  const hipY = mTop - 16 - air;
  const facing = room.head === "left" ? 1 : -1;
  const sitUp = awake ? interpolate(t, [20, 34], [0, 1], { ...clamp, easing: eio }) : 0;
  const rot = -90 + 90 * sitUp + (awake && t < 18 ? Math.sin(t * 1.2) * 6 : 0);
  const pose: Partial<Pose> = {
    rot,
    ll1: 90 + rot + 4,
    ll2: 0,
    rl1: 90 + rot - 2,
    rl2: 0,
    ra1: awake && t < 18 ? 120 : 20,
    ra2: awake && t < 18 ? -20 : 30,
    la1: awake && t < 18 ? 80 : -20,
    la2: -10,
    head: 0,
  };
  // light: dark room until the jump, then the lamp clicks on
  const light = awake ? interpolate(t, [2, 6], [0, 1], { ...clamp, easing: eo }) : 0;
  const zz = room.jolt === null;
  const top = fl - RH;
  const lampX = room.head === "left" ? x0 + RW - 120 : x0 + 120;
  return (
    <g>
      <defs>
        <clipPath id={`rc${room.c}${room.r}`}>
          <rect x={x0} y={top} width={RW} height={RH} />
        </clipPath>
      </defs>
      <Bed x0={bx0} x1={bx1} top={mTop} fl={fl} head={room.head} />
      {/* a small bedside lamp */}
      <g>
        <rect x={lampX - 50} y={fl - 170} width={100} height={170} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
        <line x1={lampX} y1={fl - 170} x2={lampX} y2={fl - 250} stroke={GRAPHITE} strokeWidth={6} />
        <path d={`M ${lampX - 55} ${fl - 250} L ${lampX - 32} ${fl - 320} L ${lampX + 32} ${fl - 320} L ${lampX + 55} ${fl - 250} Z`} fill={light > 0.5 ? "#ffd98a" : CREAM} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <Doodle x={hipX} ground={hipY + 92.5 * DS} scale={DS} facing={facing} hair={room.hair} glasses={room.glasses} face={awake ? "shock" : "plain"} yawn={awake ? 0 : 0.38} pose={pose} />
      {/* blanket over the legs while lying */}
      {sitUp < 0.5 && (
        <path
          d={
            room.head === "left"
              ? `M ${hipX - 30} ${mTop - 6 - air} q 20 -50 80 -52 L ${bx1 - 10} ${mTop - 40 - air} L ${bx1 - 4} ${mTop + 40} L ${hipX - 40} ${mTop + 40} Z`
              : `M ${hipX + 30} ${mTop - 6 - air} q -20 -50 -80 -52 L ${bx0 + 10} ${mTop - 40 - air} L ${bx0 + 4} ${mTop + 40} L ${hipX + 40} ${mTop + 40} Z`
          }
          fill="#cfd6e0"
          stroke={GRAPHITE}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      )}
      {sitUp >= 0.5 && <rect x={Math.min(hipX, hipX + facing * 240) - 10} y={mTop - 30} width={260} height={70} rx={14} fill="#cfd6e0" stroke={GRAPHITE} strokeWidth={6} />}
      {/* night: dark until the lamp clicks on */}
      <rect x={x0} y={top} width={RW} height={RH} fill={NIGHT} opacity={0.52 * (1 - light * 0.85)} />
      {light > 0 && (
        <g clipPath={`url(#rc${room.c}${room.r})`}>
          <ellipse cx={lampX} cy={fl - 280} rx={420} ry={360} fill="#ffcf73" opacity={0.3 * light} />
        </g>
      )}
      {awake && <JoltMarks x={hipX - facing * 60} y={hipY - 40} t={t} s={1.1} />}
      {zz && (
        <text x={room.head === "left" ? bx0 + 120 : bx1 - 140} y={mTop - 150 - Math.sin(f / 20) * 10} fontFamily={FONT.title} fontWeight={900} fontSize={70} fill="#c9d3e6" opacity={0.85}>
          z z
        </text>
      )}
    </g>
  );
};

// --- Spark's bedroom (room c1 r0): bed, nightstand, wall lamp, a clock ------------------------------------------------
const SB = { x0: 100, x1: 690, top: 1250 };
const SPX = 430; // Spark's hip x
const SPY = SB.top - 18; // hip y lying on the mattress
const NS = { x0: 720, x1: 920, top: 1236 }; // nightstand
const TRICK_X = 800;
const TRICK_S = 1.4;

const SparkRoom: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <RoomShell c={1} r={0} window={false} />
    {/* small window above the headboard */}
    <rect x={70} y={760} width={170} height={210} fill={NIGHT} stroke={GRAPHITE} strokeWidth={7} />
    <line x1={155} y1={760} x2={155} y2={970} stroke={GRAPHITE} strokeWidth={5} />
    <circle cx={205} cy={800} r={18} fill="#f6efdb" />
    <Bed x0={SB.x0} x1={SB.x1} top={SB.top} fl={FLOOR} head="left" />
    {/* nightstand + a small alarm clock (late at night) */}
    <ellipse cx={(NS.x0 + NS.x1) / 2} cy={FLOOR + 4} rx={110} ry={9} fill={GRAPHITE} opacity={0.22} />
    <rect x={NS.x0} y={NS.top} width={NS.x1 - NS.x0} height={FLOOR - NS.top} rx={8} fill={PAPER2} stroke={GRAPHITE} strokeWidth={7} />
    <line x1={NS.x0 + 20} y1={NS.top + 100} x2={NS.x1 - 20} y2={NS.top + 100} stroke={GRAPHITE} strokeWidth={5} />
    <circle cx={(NS.x0 + NS.x1) / 2} cy={NS.top + 60} r={8} fill={GRAPHITE} />
    <g transform={`translate(888 ${NS.top - 40})`}>
      <circle r={36} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      <line x1={0} y1={0} x2={-4} y2={-24} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={14} y2={-10 + Math.sin(f / 30) * 0.5} stroke={GRAPHITE} strokeWidth={4} strokeLinecap="round" />
      <line x1={-22} y1={30} x2={-30} y2={42} stroke={GRAPHITE} strokeWidth={5} />
      <line x1={22} y1={30} x2={30} y2={42} stroke={GRAPHITE} strokeWidth={5} />
    </g>
    {/* the wall lamp: the light in the room */}
    <path d="M 600 720 L 600 760" stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 560 820 L 575 760 L 625 760 L 640 820 Z" fill="#ffe9a8" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
  </g>
);
const SparkLampGlow: React.FC<{ dim: number }> = ({ dim }) => (
  <g>
    <defs>
      <radialGradient id="t38glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff1c4" stopOpacity={0.8} />
        <stop offset="1" stopColor="#fff1c4" stopOpacity={0} />
      </radialGradient>
    </defs>
    <clipPath id="t38room">
      <rect x={40} y={680} width={900} height={760} />
    </clipPath>
    <ellipse cx={600} cy={980} rx={620} ry={560} fill="url(#t38glow)" opacity={1 - dim} clipPath="url(#t38room)" />
    {/* evening shade in the corners of the room */}
    <rect x={40} y={680} width={900} height={760} fill={NIGHT} opacity={0.1 + dim * 0.4} />
  </g>
);

// --- Spark: lying (L=1) or sitting up in bed (L=0), lifted by `air` ------------------------------------------------------
const lying = (t: number) => {
  if (t < SIT1) return 1;
  if (t < LIE) return interpolate(t, [SIT1, SIT1 + 14], [1, 0], { ...clamp, easing: eoB });
  if (t < SIT2) return interpolate(t, [LIE, LIE + 22], [0, 1], { ...clamp, easing: eio });
  if (t < LIE2) return interpolate(t, [SIT2, SIT2 + 14], [1, 0], { ...clamp, easing: eoB });
  return interpolate(t, [LIE2, LIE2 + 14], [0, 1], { ...clamp, easing: eio });
};
const AIR0 = 130;
const airAt = (t: number) => {
  if (t < LAND0) return interpolate(t, [0, LAND0], [AIR0, 0], { ...clamp, easing: ein });
  if (t < LAND0 + 12) return Math.sin(((t - LAND0) / 12) * Math.PI) * 22; // bounce
  if (t >= JOLT - 6 && t < JOLT) return interpolate(t, [JOLT - 6, JOLT], [0, -8], clamp); // dip (anticipation)
  if (t >= JOLT && t < JOLT + 8) return interpolate(t, [JOLT, JOLT + 8], [-8, 160], { ...clamp, easing: eoB });
  if (t >= JOLT + 8 && t < JOLT + 12) return 160;
  if (t >= JOLT + 12 && t < JOLT + 24) return interpolate(t, [JOLT + 12, JOLT + 24], [160, 0], { ...clamp, easing: ein });
  if (t >= JOLT + 24 && t < JOLT + 34) return Math.sin(((t - JOLT - 24) / 10) * Math.PI) * 20;
  if (t >= RE) return interpolate(t, [RE, VOICE_FRAMES], [0, AIR0], { ...clamp, easing: eo });
  return 0;
};
const inAir = (t: number) => t < LAND0 || (t >= JOLT && t < JOLT + 24) || t >= RE;
const asleep = (t: number) => t >= LIE + 20 && t < JOLT;

// --- the dream bubble ----------------------------------------------------------------------------------------------------
const BX = 430;
const BY = 905;
const BRX = 230;
const BRY = 150;
const RUG_Y = 1004;
const bubbleP = (f: number) => {
  const inP = interpolate(f, [BUB, BUB + 14], [0, 1], { ...clamp, easing: eoB });
  const pop = interpolate(f, [JOLT, JOLT + 8], [0, 1], { ...clamp, easing: eo });
  return { scale: inP * (1 + 0.18 * pop), o: f >= JOLT + 8 ? 0 : 1 - pop * 0.9 };
};
const rugDX = (f: number) => interpolate(f, [YANK, YANK + 8], [0, 420], { ...clamp, easing: eo });
const miniAt = (f: number) => {
  const walk = interpolate(f, [BUB + 10, YANK - 2], [0, 1], clamp);
  const x = 320 + walk * 90;
  const fall = interpolate(f, [DROPM, DROPM + 16], [0, 1], { ...clamp, easing: ein });
  return { x: x + fall * 20, y: RUG_Y - 6 + fall * 320, rot: fall * 70, walking: f > BUB + 10 && f < YANK - 2 };
};

// --- Mr. Trick on the nightstand -----------------------------------------------------------------------------------------
const trickPose = (f: number): Partial<Pose> => {
  const tipHat = f >= PROMISE + 4 && f < E(1) + 8;
  if (tipHat) return { ra1: 165, ra2: 70, la1: -20, la2: 20, head: -4 };
  // reach for the tassel, crouch (anticipation), yank back
  const reach = interpolate(f, [REACH, REACH + 10, YANK + 30, YANK + 50], [0, 1, 1, 0], { ...clamp, easing: eio });
  const crouch = interpolate(f, [YANK - 8, YANK - 2, YANK], [0, 1, 0], clamp);
  const yank = interpolate(f, [YANK, YANK + 6, YANK + 34, YANK + 50], [0, 1, 1, 0], { ...clamp, easing: eoB });
  // loop: he does it again
  const yank2 = interpolate(f, [RE - 10, RE - 4, RE, RE + 4], [0, 1, 1, 0.6], { ...clamp, easing: eoB });
  // silent laugh while Spark checks the floor
  const laugh = f >= PAT - 6 && f < DROP ? 1 : 0;
  // the mug
  const mug = interpolate(f, [MUG - 8, MUG, WORSE, WORSE + 10], [0, 1, 1, 0], { ...clamp, easing: eoB });
  const recoil = interpolate(f, [WORSE, WORSE + 4, WORSE + 24, WORSE + 34], [0, 1, 1, 0], clamp);
  const surprised = f >= HIT && f < BACK ? 1 : 0;
  return {
    ra1: 20 + reach * 70 + crouch * 6 - yank * 60 + yank2 * 70 + laugh * 10 + mug * 72 - recoil * 30 + surprised * 50,
    ra2: 10 - reach * 10 - yank * 40 + laugh * 120 - mug * 14 + surprised * 60,
    la1: -20 - surprised * 60 - laugh * 10,
    la2: 20 - surprised * 60,
    lean: crouch * 14 - yank * 18 + reach * 6 - yank2 * 12 - recoil * 14,
    head: laugh * Math.sin(f / 2.5) * 5 + reach * 6 - yank * 8,
  };
};
const trickHand = (f: number): [number, number] => {
  const p: Pose = { ...STAND, ...trickPose(f), x: TRICK_X, y: NS.top - 92.5 * TRICK_S };
  const j = solve(p, TRICK_S, -1);
  return [j.rHand[0], j.rHand[1]];
};

export const S01_SFX: SfxCue[] = [
  [LAND0, "thud", 0.4],
  [LAND0 + 2, "boing", 0.18],
  [SIT1, "swish", 0.2],
  [E(0) + 4, "whoosh", 0.3],
  [PROMISE + 4, "pop", 0.25],
  [LIE, "swish", 0.18],
  [BUB, "pop", 0.3],
  [YANK - 6, "tick", 0.2],
  [YANK, "swish", 0.6],
  [YANK + 6, "boing", 0.3],
  [DROPM, "whoosh", 0.35],
  [JOLT, "impact", 0.7],
  [JOLT + 1, "pop", 0.35],
  [JOLT + 24, "thud", 0.4],
  [SIT2 + 6, "whoosh", 0.22],
  [PAT, "thud", 0.15],
  [PAT + 10, "thud", 0.15],
  [DROP, "freeze", 0.22],
  [DROP + 2, "whoosh_long", 0.28],
  ...WIN.map((w, i) => [w, "pop", 0.22 + i * 0.03] as SfxCue),
  [HIT, "impact", 0.8],
  [HIT + 1, "stinger", 0.4],
  [BACK, "whoosh", 0.28],
  [MUG, "clink", 0.3],
  [WORSE, "swish", 0.35],
  [Q - 14, "whoosh", 0.28],
  [RE - 4, "swish", 0.3],
];

const JOLT_ARMS: Partial<Pose> = { ra1: 125, ra2: -10, la1: 95, la2: -10, head: -6 };
const ALONG: Partial<Pose> = { ra1: 14, ra2: 4, la1: -14, la2: -4, head: 0 };

export const S01Night: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);

  const sparkKeys = gestureKeys([
    [0, JOLT_ARMS],
    [LAND0, { ra1: 60, ra2: 40, la1: -40, la2: -20, head: 0 }, "snap"],
    [SIT1, { ...G.shrugBig }, "snap"],
    [SIT1 + 24, { ...G.rest, head: -14 }, "smooth"], // looks one way
    [SIT1 + 44, { ...G.rest, head: 12 }, "smooth"], // and the other
    [PROMISE - 2, { ...G.pointUp, head: -10 }, "snap"],
    [E(1) + 2, { ...G.handsHips, head: -4 }, "snap"],
    [LIE, ALONG, "smooth"],
    [LIE + 26, { ra1: 24, ra2: 30, la1: -10, la2: -4, head: 0 }, "smooth"], // asleep, arms by his side
    [JOLT - 2, JOLT_ARMS, "snap"],
    [JOLT + 24, { ra1: 60, ra2: 30, la1: -50, la2: -20, head: 0 }, "snap"],
    [SIT2, { ...G.recoil }, "snap"],
    [SIT2 + 16, { ...G.shrugBig, head: 10 }, "snap"],
    [LOOKD, { ra1: 28, ra2: 10, la1: -28, la2: -10, lean: 12, head: 24 }, "snap"], // leans over the edge: the floor?
    [PAT, { ra1: 55, ra2: 20, la1: -20, la2: 20, lean: 18, head: 18 }, "snap"], // pats the mattress
    [PAT + 5, { ra1: 32, ra2: 20, la1: -20, la2: 20, lean: 18, head: 18 }, "snap"],
    [PAT + 10, { ra1: 55, ra2: 20, la1: -20, la2: 20, lean: 18, head: 18 }, "snap"],
    [PAT + 15, { ra1: 32, ra2: 20, la1: -20, la2: 20, lean: 18, head: 18 }, "snap"],
    [W(4, 6), { ...G.thinkChin, head: 8 }, "snap"],
    [HIT - 2, { ...G.mindBlown }, "snap"],
    [HIT + 34, { ...G.celebrate, head: -6 }, "snap"],
    [BACK + 6, { ...G.handsHips, head: 2 }, "snap"],
    [MUG, { ...G.pointSide, ra1: 92, ra2: 4, head: 4 }, "snap"], // looks at the mug
    [WORSE - 2, { ...G.stop, ra1: 92, ra2: 80 }, "snap"], // pushes it away
    [Q - 4, { ...G.doublePoint, head: 2 }, "snap"],
    [W(7, 4), { ...G.doublePoint, ra1: 108, la1: 78, head: 6 }, "snap"],
    [LIE2, ALONG, "smooth"],
    [RE - 2, JOLT_ARMS, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(q, nod(t, PROMISE + 6, 2));
    q = addPose(q, shake(t, W(4, 5), 2));
    q = addPose(q, nod(t, MUG + 4, 1));
    const L = lying(t);
    const air = airAt(t);
    const flail = inAir(t) ? Math.sin(t * 0.9) * 5 : 0;
    const rot = -90 * L + (inAir(t) ? 6 : 0) + flail;
    const splay = inAir(t) ? 14 : 4;
    return {
      ...q,
      rot,
      ll1: 90 + rot + splay,
      ll2: inAir(t) ? -18 : 0,
      rl1: 90 + rot - splay,
      rl2: inAir(t) ? 12 : 0,
      lean: q.lean * (1 - L),
      head: q.head * (1 - L * 0.7),
      x: SPX,
      y: SPY - air,
    };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [LAND0 + 6, "worried"],
      [PROMISE - 2, "determined"],
      [E(1) + 2, "smug"],
      [LIE, "happy"],
      [LIE + 20, "neutral"], // asleep (eyes drawn shut below)
      [JOLT - 2, "shock"],
      [SIT2 + 16, "worried"],
      [LOOKD, "sad"],
      [PAT, "skeptical"],
      [W(4, 6), "thinking"],
      [HIT - 2, "mindblown"],
      [HIT + 34, "laugh"],
      [BACK + 6, "happy"],
      [MUG, "curious"],
      [WORSE - 2, "determined"],
      [Q - 4, "happy"],
      [W(7, 4), "wink"],
      [LIE2, "neutral"],
      [RE - 2, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // the bulb flickers while he is fooled and lights when he gets it
  const bulb = (t: number) => {
    if (t >= HIT && t < BACK + 30) return interpolate(t, [HIT, HIT + 3], [0.5, 1], clamp);
    if ((t >= SIT2 && t < HIT) || t < LAND0 + 40 || t >= RE) {
      const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
      return n > 0.62 ? 0.42 : 0.08;
    }
    return 0;
  };

  // --- Mr. Trick -----------------------------------------------------------------------------------------------------------
  const tMood: TrickMood = (f >= HIT && f < BACK) || (f >= WORSE && f < WORSE + 30) ? "surprised" : (f >= YANK && f < SIT2 + 20) || (f >= PAT - 6 && f < DROP) || f >= RE - 10 ? "smug" : "sly";
  const tHand = trickHand(f);

  // --- the dream bubble ----------------------------------------------------------------------------------------------------
  const bp = bubbleP(f);
  const showBubble = f >= BUB && f < JOLT + 8;
  const mini = miniAt(f);
  const dx = rugDX(f);
  const holding = f >= REACH + 6 && f < YANK + 40; // Mr. Trick holds the tassel / the rug
  const rugEnd: [number, number] = [BX + 170 + dx, RUG_Y + 8];
  const tassel = showBubble || (f >= YANK && f < YANK + 40);

  const dim = interpolate(f, [DROP, DROP + 10, HIT - 2, HIT], [0, 0.6, 0.6, 0], clamp);
  const globalDim = interpolate(f, [DROP, DROP + 8, DROP + 22, WIN[0] - 2], [0, 0.18, 0.18, 0], clamp);

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Sky />
        <Facade />
        {ROOMS.map((r, i) => (
          <RoomShell key={`s${i}`} c={r.c} r={r.r} />
        ))}
        {ROOMS.map((r, i) => (
          <Sleeper key={i} room={r} f={f} />
        ))}
        <SparkRoom f={f} />
        <SparkLampGlow dim={dim} />
        <MrTrick x={TRICK_X} ground={NS.top} scale={TRICK_S} facing={-1} pose={trickPose(f)} mood={tMood} cane="none">
          {(j: Joints) => {
            const m = interpolate(f, [MUG - 8, MUG, WORSE + 4, WORSE + 12], [0, 1, 1, 0], { ...clamp, easing: eoB });
            if (m <= 0.01) return null;
            const [hx, hy] = j.rHand;
            return (
              <g transform={`translate(${hx} ${hy - 6}) scale(${m})`}>
                <path d="M -26 -44 L 26 -44 L 21 8 L -21 8 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={5} strokeLinejoin="round" />
                <path d="M -26 -32 q -24 4 -4 28" stroke={GRAPHITE} strokeWidth={5} fill="none" />
                <rect x={-24} y={-40} width={48} height={12} fill="#7a5233" />
                {[-10, 6].map((x, i) => (
                  <path key={x} d={`M ${x} -56 q -10 -16 0 -30 q 10 -14 0 -28`} stroke={SOFT_STEAM} strokeWidth={4} fill="none" opacity={0.6 + 0.3 * Math.sin(f / 6 + i)} />
                ))}
              </g>
            );
          }}
        </MrTrick>
        {/* Spark's jolt marks */}
        <JoltMarks x={SPX - 120} y={SPY - AIR0 - 40} t={f + 8} s={1.3} />
        <JoltMarks x={SPX - 120} y={SPY - 160 - 40} t={f - JOLT} s={1.3} />
        <JoltMarks x={SPX - 120} y={SPY - AIR0 - 40} t={f - VOICE_FRAMES + 8} s={1.3} />
      </g>
      <Spark
        f={f}
        trails={false}
        scale={S}
        facing={1}
        base={{ x: SPX, y: SPY }}
        talk={(t) => (asleep(t) ? 0 : mouthAt(t))}
        bulb={bulb}
        mood={mood}
        look={f >= SIT1 + 20 && f < SIT1 + 40 ? -0.9 : f >= SIT1 + 40 && f < PROMISE ? 0.9 : f >= LOOKD && f < W(4, 6) ? 0.8 : f >= Q - 4 && f < LIE2 ? 0.6 : 0.3}
        keys={sparkKeys}
        mod={sparkMod}
      >
        {(j) => {
          if (!(asleep(f) || (f >= LIE2 + 14 && f < RE - 2))) return null;
          // eyes shut while he sleeps (drawn over his glasses lenses, in the head's own angle)
          const [hx, hy] = j.headC;
          const R = j.headR;
          const ang = (Math.atan2((hy - j.neck[1]) / (R + 3), (hx - j.neck[0]) / (R + 3)) * 180) / Math.PI + 90;
          return (
            <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
              {[-9.5, 9.5].map((cx) => (
                <g key={cx}>
                  <circle cx={cx * S} cy={-3 * S} r={7 * S} fill="#ffffff" />
                  <path d={`M${(cx - 5) * S},${-3 * S} Q${cx * S},${1.5 * S} ${(cx + 5) * S},${-3 * S}`} stroke={COL.ink} strokeWidth={2.4 * S} fill="none" strokeLinecap="round" />
                </g>
              ))}
            </g>
          );
        }}
      </Spark>
      {/* the dream bubble: little Spark walks on a rug, Mr. Trick yanks the rug, little Spark falls */}
      {showBubble && (
        <g opacity={bp.o} transform={`translate(${BX} ${BY}) scale(${bp.scale}) translate(${-BX} ${-BY})`}>
          <defs>
            <clipPath id="t38bub">
              <ellipse cx={BX} cy={BY} rx={BRX - 4} ry={BRY - 4} />
            </clipPath>
          </defs>
          <g filter="url(#pencil)">
            <circle cx={250} cy={1130} r={14} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
            <circle cx={280} cy={1085} r={22} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
            <ellipse cx={BX} cy={BY} rx={BRX} ry={BRY} fill="#3a4a6e" stroke={GRAPHITE} strokeWidth={8} />
          </g>
          <g clipPath="url(#t38bub)">
            {/* dream stars */}
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={260 + i * 80} cy={820 + (i % 2) * 40} r={4} fill="#f3ead2" opacity={0.8} />
            ))}
            {/* the rug: a floor in the dream */}
            <g filter="url(#pencil)" transform={`translate(${dx} 0)`}>
              <rect x={BX - 180} y={RUG_Y} width={350} height={22} rx={6} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={BX - 160 + i * 60} y1={RUG_Y + 4} x2={BX - 160 + i * 60} y2={RUG_Y + 18} stroke="#fff3d6" strokeWidth={4} />
              ))}
            </g>
            <Spark
              f={f}
              trails={false}
              scale={0.85}
              facing={1}
              base={{ x: mini.x, y: mini.y - 92.5 * 0.85 }}
              keys={gestureKeys([
                [0, { ...G.rest }],
                [YANK + 4, { ra1: 150, ra2: 20, la1: -150, la2: -20 }, "snap"],
              ])}
              mod={(t, p) => ({ ...(mini.walking ? addPose(p, walkCycle(t, 0.3)) : p), x: mini.x, y: mini.y - 92.5 * 0.85, rot: mini.rot })}
              mood={(t) => (t >= YANK + 2 ? "shock" : "happy")}
            />
          </g>
        </g>
      )}
      {/* the tassel: from the rug's end to Mr. Trick's hand */}
      {tassel && (
        <g filter="url(#pencil)">
          {holding ? (
            <path d={`M ${Math.min(rugEnd[0], BX + BRX - 10)} ${rugEnd[1]} Q ${(rugEnd[0] + tHand[0]) / 2} ${rugEnd[1] + 30} ${tHand[0]} ${tHand[1]}`} stroke={ACCENT} strokeWidth={8} fill="none" strokeLinecap="round" />
          ) : (
            <path d={`M ${BX + BRX - 12} ${RUG_Y + 8} q 30 10 26 48`} stroke={ACCENT} strokeWidth={8} fill="none" strokeLinecap="round" opacity={bp.o} />
          )}
          {f >= YANK + 4 && f < YANK + 40 && (
            <g transform={`translate(${tHand[0]} ${tHand[1]}) rotate(${wobble(f, YANK + 4, 20, 8)})`}>
              <path d="M -10 -10 q 30 -20 50 6 q -10 30 -46 26 Z" fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
            </g>
          )}
        </g>
      )}
      {globalDim > 0 && <rect x={-4000} y={-4000} width={9000} height={9000} fill="#141a2a" opacity={globalDim} />}
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 104) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 110,
        textAlign: "center",
        fontFamily: FONT.title,
        fontWeight: 900,
        lineHeight: 1.02,
        fontSize: size,
        color: GRAPHITE,
        WebkitTextStroke: `18px ${PAPER}`,
        paintOrder: "stroke fill",
        opacity: interpolate(f, [at, at + 4, until - 8, until], [0, 1, 1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const hook = <>WHY DID I <span style={{ color: ACCENT }}>JUMP</span>?</>;
  const smallLine =
    f >= 300 && f < DROP
      ? "Education, not medical advice."
      : f >= WIN[0] && f < BACK
        ? "Sleep doctors (AASM): 60 to 70% of people get these “sleep starts”. Nobody knows exactly why."
        : f >= MUG - 10 && f < Q
          ? "AASM: hard exercise late and too little sleep can also make them worse. Strong or frequent ones that worry you? Ask a doctor. Education, not medical advice."
          : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hook, -20, PROMISE - 6)}
      {f >= LOOPTXT && top(hook, LOOPTXT, VOICE_FRAMES + 200)}
      {f >= PAT && f < DROP + 6 && top(<>YOUR BED DID NOT <span style={{ color: ACCENT }}>MOVE</span></>, PAT, DROP + 6, 96)}
      {f >= WIN[0] + 4 && f < HIT && top(<><span style={{ color: ACCENT }}>MOST</span> PEOPLE FEEL THIS</>, WIN[0] + 4, HIT + 4, 96)}
      {f >= HIT && f < BACK && top(<>IT IS <span style={{ color: ACCENT }}>NORMAL</span></>, HIT, BACK, 112)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1676, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(6) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1760, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 10</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1560} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["jump,", "last", "fall.", "jumps,", "awake.", "bed", "move.", "Most", "normal!", "coffee,", "stress,", "worse.", "night?"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: NIGHT }} />} cam={cam} hits={[JOLT, HIT]} power={5} svg={svg} html={html} />;
};

const SOFT_STEAM = "#8d877d";
