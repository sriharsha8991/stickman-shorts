import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SOFT, SketchBox, SketchLine, type Hair } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T37 · "Did you just yawn because of this?" Spark Got Tricked #2 (PLAY, pencil look, 27 s).
// ONE world, one camera rig: a pencil office after lunch, a queue for the coffee machine going towards the camera. Spark is sure he will not yawn.
// Mr. Trick yawns at him, Spark loses in the test (camera locked, about 3 s). Then the wall screen plays a yawn video and pink mouths run along
// the queue to the camera: two in every three people. A big heart YOU CARE? goes soft on "the proof is weak". His last line turns into frame 0.
// Bartholomew & Cirulli 2014, Massen & Gallup 2017: see facts.md. The office and the queue are our own picture.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.12);

const ACCENT = "#d6336c";
const CREAM = "#fbf6ea";
const GROUND = 1440;
const S0 = 2.6;
const SX = 262;
const FLOOR = 1118;

// --- timing ---------------------------------------------------------------------------------------------------------------
const STOP = W(0, 0);
const YOURM = W(0, 8);
const LASTW = W(1, 3);
const WATCH = C(2);
const TRY = W(2, 3);
export const TEST0 = E(2) + 2; // the test: camera locked, Spark's yawn
const YAWN_FULL = TEST0 + 26;
const YAWN_HOLD = TEST0 + 66;
const YAWN_END = TEST0 + 86;
const FEEL = C(3);
const STUDY = C(4);
const SCREEN = W(4, 2) - 2; // the wall screen comes on
const WAVE = W(4, 4); // first mouth opens on "about"
export const YAWNED = W(4, 9) + 4;
const MANY = C(5);
const SAY = W(5, 2);
const BUT = W(5, 7);
const WEAK = W(5, 11);
const Q = C(6);
const YOUQ = W(6, 2);
const LOOP0 = E(6) + 1;
const LOOP1 = VOICE_FRAMES - 2;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [305, 985, 2.7];
const MED: [number, number, number] = [400, 1060, 1.72];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(C(1) - 7, C(1) + 13, [430, 1010, 1.36]), // the office, and a hat behind the coffee machine
  k(C(2) - 6, C(2) + 14, MED), // Spark and Mr. Trick
  k(E(2) - 18, E(2) + 2, F0), // his face, locked for the whole test
  k(E(3) + 1, E(3) + 22, [570, 1000, 1.2]), // the whole queue
  k(E(5) + 3, E(5) + 24, [300, 1040, 2.05]), // he asks you
  k(LOOP0, LOOP1, F0), // frame 0 again
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

// --- Spark's yawn: an overlay on his face, his design in mascot.tsx does not change ---------------------------------------
const yawnAt = (f: number) => {
  if (f < 12) return interpolate(f, [2, 9], [1, 0], { ...clamp, easing: ei });
  if (f >= LOOP0) return interpolate(f, [LOOP0 + 4, LOOP1 - 2], [0, 1], { ...clamp, easing: sio });
  if (f < TEST0) return 0;
  const a = interpolate(f, [TEST0 + 6, YAWN_FULL], [0, 1], { ...clamp, easing: sio });
  const b = interpolate(f, [YAWN_HOLD, YAWN_END], [1, 0], { ...clamp, easing: sio });
  return a * b;
};
const YawnFace: React.FC<{ j: Joints; y: number; s: number }> = ({ j, y, s }) => {
  if (y < 0.03) return null;
  const [hx, hy] = j.headC;
  const R = j.headR;
  const ang = (Math.atan2((hy - j.neck[1]) / (R + 3), (hx - j.neck[0]) / (R + 3)) * 180) / Math.PI + 90;
  const shut = interpolate(y, [0.15, 0.4], [0, 1], clamp);
  return (
    <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
      {shut > 0.02 &&
        [-9.5, 9.5].map((cx) => (
          <g key={cx} opacity={shut}>
            <circle cx={cx * s} cy={-3 * s} r={8 * s} fill="#fff" stroke="#22201e" strokeWidth={2.6 * s} />
            <path d={`M${(cx - 5.5) * s},${-4 * s} Q${cx * s},${1 * s} ${(cx + 5.5) * s},${-4 * s}`} stroke="#22201e" strokeWidth={2.5 * s} fill="none" strokeLinecap="round" />
          </g>
        ))}
      <ellipse cx={0} cy={(7 + 7.2 * y) * s} rx={(4 + 8.8 * y) * s} ry={(1.5 + 9.3 * y) * s} fill="#3b1d1d" stroke="#22201e" strokeWidth={1.9 * s} />
      {y > 0.45 && <ellipse cx={0} cy={(7 + 12.6 * y) * s} rx={7 * y * s} ry={3.6 * y * s} fill="#e86a6a" />}
      {y > 0.8 && <path d={`M${17.5 * s},${2.5 * s} q ${-2.4 * s} ${4 * s} 0 ${5.2 * s} q ${2.4 * s} ${-1.2 * s} 0 ${-5.2 * s} Z`} fill="#7fc4ee" stroke="#22201e" strokeWidth={0.7 * s} />}
    </g>
  );
};
const scaleAt = (f: number) => interpolate(f, [YAWNED, YAWNED + 7, YAWNED + 12, YAWNED + 16, BUT, BUT + 22, Q - 4, LOOP0], [S0, 3.12, 2.96, 3.0, 3.0, 2.74, 2.74, S0], { ...clamp, easing: sio });

// --- the queue: six people, far to near. Yawners 0, 2, 3, 5 = two in every three. Heads stay on the horizon ------------------
const SC = [0.9, 1.2, 1.6, 2.15, 2.9, 3.9];
const qx = (s: number) => 476 + (s - 0.9) * 128;
const qg = (s: number) => FLOOR + 22 + (s - 0.9) * 150;
type Person = { hair: Hair; glasses?: boolean; yawns: boolean; at: number };
const QUEUE: Person[] = [
  { hair: "bun", yawns: true, at: WAVE },
  { hair: "bald", glasses: true, yawns: false, at: 0 },
  { hair: "short", yawns: true, at: W(4, 5) + 2 },
  { hair: "long", yawns: true, at: W(4, 7) + 2 },
  { hair: "cap", yawns: false, at: 0 },
  { hair: "curly", glasses: true, yawns: true, at: W(4, 9) },
];
const qYawn = (i: number, f: number) => {
  const p = QUEUE[i];
  if (!p.yawns) return 0;
  const on = interpolate(f, [p.at - 3, p.at + (i === 5 ? 6 : 9)], [0, 1], { ...clamp, easing: eoB });
  const off = interpolate(f, [BUT - 8 + i * 4, BUT + 12 + i * 4], [1, 0], { ...clamp, easing: sio });
  return Math.min(1.08, on) * off;
};

const Office: React.FC<{ f: number }> = ({ f }) => {
  const screenOn = interpolate(f, [SCREEN, SCREEN + 6], [0, 1], clamp) * interpolate(f, [BUT - 6, BUT + 6], [1, 0], clamp);
  const tvY = 0.5 + 0.5 * Math.sin((f - SCREEN) * 0.1 - 1.2);
  return (
    <g>
      {/* floor + wall */}
      <SketchLine x1={-200} y1={FLOOR} x2={1280} y2={FLOOR} w={6} />
      <SketchLine x1={-200} y1={FLOOR - 42} x2={1280} y2={FLOOR - 42} w={3} />
      <Hatch x={-200} y={FLOOR + 6} w={1480} h={460} gap={40} o={0.13} />
      {/* ceiling lamp + its pool */}
      <SketchLine x1={420} y1={-40} x2={420} y2={170} w={4} />
      <path d="M 340 240 Q 356 170 420 170 Q 484 170 500 240 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      <Hatch x={350} y={190} w={140} h={50} gap={14} o={0.25} />
      {/* window, the afternoon sun */}
      <SketchBox x={-90} y={470} w={300} h={470} fill="#fdf9ef" />
      <SketchLine x1={60} y1={470} x2={60} y2={940} />
      <SketchLine x1={-90} y1={705} x2={210} y2={705} />
      <circle cx={140} cy={590} r={46} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <SketchLine key={a} x1={140 + Math.cos((a * Math.PI) / 180) * 58} y1={590 + Math.sin((a * Math.PI) / 180) * 58} x2={140 + Math.cos((a * Math.PI) / 180) * 76} y2={590 + Math.sin((a * Math.PI) / 180) * 76} w={3} />
      ))}
      <SketchBox x={-90} y={830} w={150} h={110} hatch={0.3} />
      <SketchLine x1={-110} y1={944} x2={230} y2={944} w={10} />
      {/* wall clock: two in the afternoon */}
      <circle cx={80} cy={340} r={62} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      <SketchLine x1={80} y1={340} x2={80} y2={298} />
      <SketchLine x1={80} y1={340} x2={112} y2={322} />
      {/* notice board + papers, right */}
      <SketchBox x={950} y={700} w={190} h={230} fill={PAPER2} />
      <SketchBox x={972} y={724} w={70} h={92} fill={CREAM} lw={3} />
      <SketchBox x={1056} y={748} w={62} h={80} fill={CREAM} lw={3} />
      <SketchBox x={984} y={832} w={110} h={72} fill={CREAM} lw={3} />
      {/* wall screen: a yawn video */}
      <SketchBox x={610} y={460} w={330} h={214} fill={screenOn > 0.5 ? "#fffdf6" : PAPER2} lw={8} />
      {screenOn < 0.5 && <Hatch x={618} y={468} w={314} h={198} gap={20} o={0.26} />}
      <SketchLine x1={775} y1={674} x2={775} y2={700} w={8} />
      {screenOn > 0.02 && (
        <g opacity={screenOn}>
          <circle cx={775} cy={580} r={56} fill="#fffaf0" stroke={GRAPHITE} strokeWidth={7} />
          <path d="M 742 562 q 10 9 20 0 M 788 562 q 10 9 20 0" fill="none" stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />
          <ellipse cx={775} cy={600} rx={10 + 14 * tvY} ry={4 + 17 * tvY} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
          <text x={775} y={514} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={32} fill={GRAPHITE}>
            A YAWN VIDEO
          </text>
        </g>
      )}
      {/* tall plant, far right */}
      <path d="M 1120 1110 L 1100 1010 L 1210 1010 L 1190 1110 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      {[-36, -12, 12, 36].map((a, i) => (
        <path key={i} d={`M 1155 1010 Q ${1155 + a * 2} 900 ${1155 + a * 3.4} ${830 + (i % 2) * 34}`} fill="none" stroke={GRAPHITE} strokeWidth={8} strokeLinecap="round" />
      ))}
    </g>
  );
};

const Machine: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={316} y={876} width={130} height={258} fill={CREAM} />
    <SketchBox x={316} y={876} w={130} h={258} lw={7} />
    <Hatch x={316} y={880} w={130} h={250} gap={22} o={0.16} />
    <SketchBox x={336} y={898} w={90} h={52} fill="#fffdf6" lw={4} />
    <SketchBox x={344} y={984} w={74} h={82} fill={PAPER2} lw={4} />
    <path d="M 366 1040 L 396 1040 L 392 1066 L 370 1066 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={4} />
    <path d={`M 381 ${1032 - (f % 40) * 0.2} q 8 -14 0 -26`} fill="none" stroke={SOFT} strokeWidth={3} />
    <circle cx={350} cy={920} r={5} fill={GRAPHITE} />
    <circle cx={372} cy={920} r={5} fill={GRAPHITE} />
  </g>
);

// The heart: what many people say. Goes soft on "the proof is weak". Not popped: the proof is weak, not gone.
const Heart: React.FC<{ f: number; handX: number; handY: number }> = ({ f, handX, handY }) => {
  const up = interpolate(f, [SAY - 4, SAY + 13], [0, 1], { ...clamp, easing: eoB });
  const soft = interpolate(f, [W(5, 9), WEAK + 12], [0, 1], { ...clamp, easing: sio });
  const off = interpolate(f, [E(5) + 3, E(5) + 12], [1, 0], { ...clamp, easing: ei });
  if (up < 0.01 || off < 0.01) return null;
  const hx = 455;
  const hy = 610 + 300 * soft;
  const s = up * off * (1 - 0.5 * soft);
  const sway = Math.sin(f * 0.13) * (1 - soft) * 8;
  return (
    <g>
      <path d={`M ${handX} ${handY} Q ${handX + 16} ${(handY + hy) / 2} ${hx + sway} ${hy + 148 * s}`} fill="none" stroke={GRAPHITE} strokeWidth={4} />
      <g transform={`translate(${hx + sway} ${hy}) scale(${s}) rotate(${wobble(f, WEAK, 5, 9) + soft * -9})`}>
        <path d="M 0 150 C -200 20 -188 -130 -78 -130 C -36 -130 -8 -104 0 -66 C 8 -104 36 -130 78 -130 C 188 -130 200 20 0 150 Z" fill={ACCENT} stroke={GRAPHITE} strokeWidth={9} strokeLinejoin="round" />
        <text x={0} y={-10} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill="#fff">
          IT SHOWS
        </text>
        <text x={0} y={46} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={50} fill="#fff">
          YOU CARE
        </text>
      </g>
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [C(1) - 6, "swish", 0.3],
  [LASTW - 3, "pop", 0.4],
  [WATCH - 12, "boing", 0.3],
  [WATCH + 2, "swish", 0.25],
  [E(3) + 2, "whoosh", 0.35],
  [SCREEN + 2, "tick", 0.6],
  [WAVE, "pop", 0.3],
  [W(4, 5) + 2, "pop", 0.35],
  [W(4, 7) + 2, "pop", 0.4],
  [YAWNED, "impact", 0.8],
  [YAWNED + 4, "ding", 0.45],
  [SAY, "pop", 0.45],
  [WEAK - 12, "swirl", 0.4],
  [E(5) + 4, "swish", 0.3],
  [YOUQ, "pop", 0.35],
];

export const S01Office: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const sNow = scaleAt(f);
  const YAWN: Partial<Pose> = { ra1: 146, ra2: 30, la1: -146, la2: -30, lean: -6, head: -13 };

  const sparkKeys = gestureKeys([
    [0, YAWN],
    [STOP + 2, { ...G.stop, ra1: 96, ra2: 70 }, "snap"],
    [W(0, 5), { ...G.pointSide, ra1: 88, head: 2 }, "snap"],
    [YOURM - 3, { ...G.doublePoint, ra1: 98, la1: 62 }, "snap"],
    [C(1), G.pointUp, "snap"],
    [E(1) + 6, G.armsCrossed],
    [WATCH + 2, { ...G.handsHips, lean: -6, head: -5 }, "snap"],
    [TRY - 2, { ...G.armsCrossed, lean: -8, head: -6 }, "snap"],
    [TEST0 - 3, { ...G.armsCrossed, lean: 2, head: 6 }],
    [TEST0 + 18, YAWN],
    [YAWN_HOLD + 4, YAWN],
    [YAWN_END, { ...G.rest, head: 6, lean: 4 }],
    [FEEL - 1, { ...G.thinkChin, head: 8 }, "snap"],
    [W(3, 4), { ...G.shrugBig, head: 8 }, "snap"],
    [STUDY - 8, G.rest],
    [STUDY + 2, G.present, "snap"],
    [WAVE, { ...G.doublePoint, ra1: 102, la1: 72 }, "snap"],
    [YAWNED, G.mindBlown, "snap"],
    [MANY - 4, { ...G.present, head: -4 }],
    [W(5, 3), { ...G.pointSide, ra1: 120 }, "snap"],
    [BUT - 2, { ...G.shrugBig, head: 6 }, "snap"],
    [WEAK, { ...G.facepalm }, "snap"],
    [Q - 2, { ...G.leanIn, ra1: 82, ra2: 8 }, "snap"],
    [YOUQ, { ...G.doublePoint, ra1: 96, la1: 64, lean: 8 }, "snap"],
    [LOOP0 + 2, G.rest],
    [LOOP1 - 12, YAWN],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, hop(t, YAWNED, 54));
    q = addPose(q, nod(t, LASTW, 2));
    q = addPose(q, shake(t, TRY + 4, 3));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    // he fights it: the head trembles
    if (t >= E(2) - 12 && t < TEST0 + 8) q = addPose(q, { head: Math.sin(t * 2.3) * 3.5 });
    const s = scaleAt(t);
    return { ...q, x: SX, y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "neutral"],
      [4, "shock"],
      [W(0, 3), "curious"],
      [YOURM - 3, "excited"],
      [C(1) - 2, "smug"],
      [WATCH, "determined"],
      [TRY, "smug"],
      [E(2) - 12, "worried"],
      [YAWN_END - 5, "sad"],
      [FEEL, "worried"],
      [W(3, 4), "curious"],
      [STUDY, "thinking"],
      [WAVE, "shock"],
      [YAWNED, "mindblown"],
      [MANY + 4, "happy"],
      [W(5, 3), "curious"],
      [BUT, "skeptical"],
      [WEAK, "laugh"],
      [Q, "curious"],
      [YOUQ, "wink"],
      [LOOP0 + 2, "neutral"],
    ];
    let m: Mood = "neutral";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= YAWNED && t < E(5) + 8) return interpolate(t, [YAWNED, YAWNED + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };

  // --- Mr. Trick ------------------------------------------------------------------------------------------------------------
  const peek = interpolate(f, [LASTW - 8, LASTW + 4], [1150, 1062], { ...clamp, easing: eoB });
  const jumpK = interpolate(f, [WATCH - 14, WATCH + 4], [0, 1], { ...clamp, easing: sio });
  const trickOut = f >= WATCH - 14;
  const tx = 440 + (545 - 440) * jumpK;
  const tg = (trickOut ? 1062 + (GROUND - 1062) * jumpK - Math.sin(jumpK * Math.PI) * 90 : peek) + (f > E(5) ? 0 : 0);
  const tS = 1 + 0.72 * jumpK;
  const tYawn = interpolate(f, [W(2, 1), W(2, 1) + 16, TRY + 16, TRY + 28], [0, 1, 1, 0], { ...clamp, easing: sio });
  const tMood = f >= BUT + 14 ? "surprised" : "sly";
  const tLaugh = f >= YAWN_FULL && f < FEEL + 20 ? Math.abs(Math.sin(f * 0.42)) * 7 : 0;
  const tPose: Partial<Pose> = (() => {
    if (f >= SAY - 6 && f < E(5) + 10) return { ra1: 118, ra2: 12, la1: -18, la2: 8, lean: f >= BUT + 14 ? -8 : 0, head: -4 };
    if (tYawn > 0.2) return { ra1: 138, ra2: 26, la1: -138, la2: -26, lean: -6, head: -10 };
    if (f >= YAWN_FULL) return { ra1: 34, ra2: 60, la1: -34, la2: -60, lean: -4, head: -6 };
    const w = f >= WATCH - 14 && f < WATCH + 4 ? walkCycle(f, 0.6) : {};
    return { ...w, ra1: 40, ra2: 20, la1: -22, la2: 10, head: -2 };
  })();
  const trick = (
    <MrTrick x={tx} ground={tg + tLaugh * -0.3} scale={tS} facing={-1} pose={tPose} mood={tMood} cane={f < WATCH - 14 ? "down" : "none"} yawn={tYawn} yawnColor={ACCENT}>
      {(j) => (f >= SAY - 4 && f < E(5) + 12 ? <Heart f={f} handX={j.rHand[0]} handY={j.rHand[1]} /> : null)}
    </MrTrick>
  );

  // --- the queue ------------------------------------------------------------------------------------------------------------
  const person = (i: number) => {
    const p = QUEUE[i];
    const s = SC[i];
    const y = qYawn(i, f);
    const sway = Math.sin(f * 0.05 + i * 1.3);
    const smug = !p.yawns && f >= p.at + 480;
    const armUp = i < 3 ? Math.min(1, y) * 0.75 : 0; // the near two keep their arms down, so faces stay clear
    const pose: Partial<Pose> = p.yawns
      ? { ra1: 16 + 122 * armUp, ra2: 8 + 18 * armUp, la1: -16 - 122 * armUp, la2: -8 - 18 * armUp, head: 5 + sway * 3 - 14 * Math.min(1, y), lean: 2 - 7 * armUp }
      : { ...G.armsCrossed, head: 4 + sway * 2 };
    return <Doodle key={i} x={qx(s)} ground={qg(s)} scale={s} facing={i === 1 ? 1 : -1} hair={p.hair} glasses={p.glasses} face={smug ? "happy" : "bored"} pose={pose} yawn={y} yawnColor={ACCENT} />;
  };

  const still = f >= TEST0 && f < YAWN_END + 4;
  const svg = (
    <>
      <PencilDefs f={f} still={still} />
      <Paper />
      <g filter="url(#pencil)">
        <Office f={f} />
        {!trickOut && trick}
        <Machine f={f} />
        {[0, 1, 2, 3].map(person)}
        {trickOut && trick}
        {[4, 5].map(person)}
      </g>
      <Spark f={f} trails={false} scale={sNow} base={{ x: SX, y: GROUND - 92.5 * sNow }} talk={(t) => (yawnAt(t) > 0.03 ? 0 : t > LOOP0 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={f >= WAVE ? 1 : 0.2} keys={sparkKeys} mod={sparkMod}>
        {(j) => <YawnFace j={j} y={yawnAt(f)} s={sNow} />}
      </Spark>
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 124) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 150,
        textAlign: "center",
        fontFamily: FONT.title,
        fontWeight: 900,
        lineHeight: 1,
        fontSize: size,
        color: GRAPHITE,
        WebkitTextStroke: `18px ${PAPER}`,
        paintOrder: "stroke fill",
        opacity: interpolate(f, [until - 8, until], [1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const dny = <>DO NOT <span style={{ color: ACCENT }}>YAWN</span></>;
  const smallLine =
    f < FEEL
      ? ""
      : f < STUDY
        ? "Not everyone yawns, and some yawns just happen."
        : f < MANY
          ? "222 of 328 yawned at a 3-minute yawn video (Bartholomew & Cirulli, 2014)."
          : f < Q
            ? "The studies do not agree (review: Massen & Gallup, 2017)."
            : "";
  const html = (
    <>
      <CaptionBand />
      {f < C(1) + 2 && top(dny, 0, C(1) + 2)}
      {f >= LOOP1 - 6 && top(dny, VOICE_FRAMES + 100, VOICE_FRAMES + 200)}
      {f >= WATCH + 1 && f < FEEL + 2 && top(dny, WATCH + 1, FEEL + 2)}
      {f >= YAWNED - 1 && f < W(5, 3) && top(<><span style={{ color: ACCENT, marginRight: 22 }}>2 IN 3</span><span>YAWNED</span></>, YAWNED, W(5, 3), 112)}
      {f >= WEAK - 1 && f < E(5) + 6 && top(<>WEAK <span style={{ color: ACCENT }}>PROOF</span></>, WEAK, E(5) + 6)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1692, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < LOOP0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 2</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={60} cues={VOICE_CUES} hi={["stop", "last", "yawn", "yawn.", "coming?", "two", "three", "yawned!", "care.", "weak.", "video?"]} />
    </>
  );

  const hits = [YAWNED, YAWNED + 2];
  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={hits} power={5} svg={svg} html={html} />;
};
