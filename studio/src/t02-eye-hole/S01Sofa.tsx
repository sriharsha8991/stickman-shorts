import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T02 · "Is there a hole in your eye?" Spark Got Tricked #13 (PLAY, pencil look).
// Place 1: a pencil living room at night. Spark sits on the sofa under a blanket with his phone; Mr. Trick sits on the sofa arm.
// The camera moves into Spark's phone and the phone screen grows to fill the viewer's screen: the blind-spot test (two dots,
// fully still). Place 2 (announced: "Inside your eye"): an iris opens on a top-down pencil drawing of an eye. The ray from the
// right dot lands on the one spot with no light cells, where the nerve leaves for the brain; the brain fills the gap.
// Facts: Meermeier et al. 2023, Vision Research 211:108208 (see facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

export const INDIGO = "#4b3bd1"; // the right dot: the one accent colour
const CREAM = "#fffdf6";
const WALL = "#d6ccb7"; // paper wall, darker for night
const NIGHT = "#4c5262";
const FLOOR = 1440;
const SEAT = 1188;
const S = 2.6;
const SX = 600;

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const END_W = W(1, 6); // "end": Mr. Trick tips his hat
const CLAIM = C(2);
const ALL_W = W(2, 5);
const PUSH0 = E(2) - 2; // camera into the phone
const CARD0 = C(3) - 2; // the phone screen grows to fill the screen
const CARD1 = CARD0 + 16;
export const STILL0 = CARD1 + 2; // test: nothing moves from here
export const STILL1 = C(5); // "The right dot..."
const RING = W(5, 1); // "right"
const BLIND = W(5, 6);
const HIT = W(5, 7); // "spot!"
const SHRINK0 = E(5) - 26;
const SHRINK1 = SHRINK0 + 14;
const IRIS0 = E(5) + 18; // the pause: into Spark's eye
const IRIS1 = IRIS0 + 16;
const RAYF0 = C(6) + 4;
const RAYR0 = W(6, 2);
const DISC = W(6, 4); // "spot"
const NOCELLS = W(6, 6); // "no"
const BIG = W(6, 8); // "cells."
const BRAIN = W(7, 1);
const FILLS = W(7, 2);
const NEVER = W(7, 7);
const BACK0 = E(7) + 2; // iris closes: back to the sofa
const BACK1 = BACK0 + 12;
const Q = C(8);
const DOTW = W(8, 2);
export const REVEAL_HIT = BIG;
export { HIT };

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [640, 930, 1.7];
const WIDE: V3 = [560, 1010, 0.96];
const MED: V3 = [740, 1000, 1.12];
const PHONE: V3 = [690, 838, 2.1];
const EYE: V3 = [567, 924, 3.4];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 2, E(0) + 22, WIDE), // the room: sofa, lamp, Mr. Trick on the arm
  k(CLAIM - 6, CLAIM + 14, MED),
  k(PUSH0, PUSH0 + 18, PHONE), // into the phone
  k(SHRINK1, SHRINK1 + 18, MED), // back out: Spark and Mr. Trick
  k(IRIS0 - 14, IRIS0 + 4, EYE), // into Spark's eye
  k(BACK0 - 1, BACK0, F0), // (hidden under the panel) back to frame 0
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

// --- the room -------------------------------------------------------------------------------------------------------------
const Room: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-900} y={-900} width={3800} height={FLOOR + 900} fill={WALL} />
    <rect x={-900} y={FLOOR} width={3800} height={1200} fill={PAPER2} />
    <Hatch x={-900} y={FLOOR} w={3800} h={1200} gap={30} o={0.2} />
    <SketchLine x1={-900} y1={FLOOR} x2={2900} y2={FLOOR} w={7} />
    <line x1={-900} y1={FLOOR - 40} x2={2900} y2={FLOOR - 40} stroke={GRAPHITE} strokeWidth={3} opacity={0.4} />
    {/* night window with the moon, above the sofa */}
    <SketchBox x={400} y={250} w={520} h={420} fill={NIGHT} lw={9} />
    <line x1={660} y1={250} x2={660} y2={670} stroke={GRAPHITE} strokeWidth={7} />
    <circle cx={810} cy={360} r={46} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
    <circle cx={830} cy={348} r={40} fill={NIGHT} />
    {[[470, 320], [560, 420], [720, 300], [880, 520], [520, 560]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={4 + (i % 2) * 2} fill={CREAM} opacity={0.5 + 0.3 * Math.abs(Math.sin(f * 0.05 + i))} />
    ))}
    {/* picture frame on the right wall */}
    <SketchBox x={1180} y={420} w={220} h={170} fill={PAPER2} lw={6} hatch={18} />
    {/* rug */}
    <ellipse cx={620} cy={FLOOR + 60} rx={620} ry={46} fill={PAPER} stroke={GRAPHITE} strokeWidth={5} />
    <Hatch x={80} y={FLOOR + 30} w={1080} h={60} gap={18} o={0.16} />
  </g>
);

// floor lamp on the left: the visible warm light
const LampLight: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="lamp02" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff3cf" stopOpacity={0.95} />
        <stop offset="1" stopColor="#fff3cf" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={180} cy={820} rx={720} ry={620} fill="url(#lamp02)" />
  </g>
);
const LampBody: React.FC = () => (
  <g>
    <ellipse cx={60} cy={FLOOR - 6} rx={80} ry={16} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <line x1={60} y1={FLOOR - 12} x2={60} y2={700} stroke={GRAPHITE} strokeWidth={10} strokeLinecap="round" />
    <path d="M -40 700 L 160 700 L 120 560 L 0 560 Z" fill="#fff1c0" stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <Hatch x={-10} y={566} w={130} h={40} gap={14} o={0.18} />
  </g>
);

// sofa: back + arms behind Spark, the seat front + blanket in front of him
const SofaBack: React.FC = () => (
  <g>
    <ellipse cx={640} cy={FLOOR + 4} rx={520} ry={16} fill={GRAPHITE} opacity={0.2} />
    <path d="M 210 1200 L 210 960 Q 210 900 270 900 L 1010 900 Q 1070 900 1070 960 L 1070 1200 Z" fill="#c9b79a" stroke={GRAPHITE} strokeWidth={8} strokeLinejoin="round" />
    <Hatch x={220} y={910} w={840} h={280} gap={20} o={0.18} />
    <line x1={640} y1={920} x2={640} y2={1180} stroke={GRAPHITE} strokeWidth={4} opacity={0.5} />
    {/* cushion on the left */}
    <path d="M 300 1180 Q 280 1060 330 1040 Q 420 1020 440 1080 Q 450 1150 430 1180 Z" fill={PAPER} stroke={GRAPHITE} strokeWidth={6} />
  </g>
);
const SofaFront: React.FC = () => (
  <g>
    {/* arms */}
    <path d="M 150 1440 L 150 1110 Q 150 1060 210 1060 L 270 1060 Q 320 1060 320 1110 L 320 1440 Z" fill="#bba886" stroke={GRAPHITE} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 960 1440 L 960 1110 Q 960 1060 1010 1060 L 1080 1060 Q 1130 1060 1130 1110 L 1130 1440 Z" fill="#bba886" stroke={GRAPHITE} strokeWidth={8} strokeLinejoin="round" />
    {/* seat front */}
    <rect x={300} y={SEAT + 4} width={680} height={FLOOR - SEAT - 4} rx={16} fill="#c9b79a" stroke={GRAPHITE} strokeWidth={8} />
    <Hatch x={310} y={SEAT + 60} w={660} h={FLOOR - 120 - SEAT} gap={22} o={0.2} />
    {/* blanket over Spark's lap */}
    <path d={`M ${SX - 190} ${SEAT - 20} Q ${SX} ${SEAT - 60} ${SX + 190} ${SEAT - 18} L ${SX + 210} ${SEAT + 170} Q ${SX} ${SEAT + 200} ${SX - 210} ${SEAT + 172} Z`} fill={PAPER} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    {[-120, -40, 40, 120].map((d) => (
      <line key={d} x1={SX + d} y1={SEAT - 30} x2={SX + d * 1.1} y2={SEAT + 180} stroke={GRAPHITE} strokeWidth={4} opacity={0.35} />
    ))}
  </g>
);

// --- the phone (in Spark's hand): two dots on its screen ----------------------------------------------------------------------
const PW = 74;
const PH = 128;
const Phone: React.FC<{ x: number; y: number; rightDot: number }> = ({ x, y, rightDot }) => (
  <g transform={`translate(${x} ${y}) rotate(-4)`}>
    <circle cx={-40} cy={0} r={150} fill="#eaf1ff" opacity={0.22} />
    <rect x={-PW / 2 - 6} y={-PH / 2 - 8} width={PW + 12} height={PH + 16} rx={14} fill={GRAPHITE} />
    <rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} rx={6} fill={PAPER} />
    <circle cx={-PW / 2 + 9} cy={-14} r={5} fill={GRAPHITE} />
    <circle cx={PW / 2 - 9} cy={-14} r={5} fill={INDIGO} opacity={rightDot} />
  </g>
);

// --- the test card (screen coordinates, 1080 × 1500) -----------------------------------------------------------------------
export const DOT_L: [number, number] = [120, 660];
export const DOT_R: [number, number] = [960, 660];
export const DOT_RAD = 34;
const TestCard: React.FC<{ f: number }> = ({ f }) => {
  const ring = interpolate(f, [RING, RING + 10], [0, 1], { ...clamp, easing: eo });
  return (
    <svg width={1080} height={1500} viewBox="0 0 1080 1500" style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={0} y={0} width={1080} height={1500} fill={PAPER} />
      <circle cx={DOT_L[0]} cy={DOT_L[1]} r={DOT_RAD} fill={GRAPHITE} />
      <circle cx={DOT_R[0]} cy={DOT_R[1]} r={DOT_RAD} fill={INDIGO} />
      {/* look-here arrow under the left dot */}
      <path d={`M ${DOT_L[0]} ${DOT_L[1] + 140} L ${DOT_L[0]} ${DOT_L[1] + 64} M ${DOT_L[0] - 22} ${DOT_L[1] + 88} L ${DOT_L[0]} ${DOT_L[1] + 62} L ${DOT_L[0] + 22} ${DOT_L[1] + 88}`} stroke={GRAPHITE} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={60} y={DOT_L[1] + 200} fontFamily={FONT.title} fontWeight={900} fontSize={46} fill={GRAPHITE}>
        LOOK HERE
      </text>
      <text x={540} y={300} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={66} fill={GRAPHITE}>
        CLOSE YOUR LEFT EYE
      </text>
      {ring > 0 && (
        <circle cx={DOT_R[0]} cy={DOT_R[1]} r={74} fill="none" stroke={INDIGO} strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-90 ${DOT_R[0]} ${DOT_R[1]})`} />
      )}
    </svg>
  );
};

// --- place 2: inside the eye (top view, screen coordinates) -----------------------------------------------------------------
const EC: [number, number] = [450, 880];
const ER = 300;
const RET = 282; // retina radius (inside the wall)
const LENS: [number, number] = [450, 612];
const PF: [number, number] = [450, 250]; // left dot (looked at)
const PR: [number, number] = [700, 250]; // right dot
// where the ray from the right dot meets the retina
const hitRetina = (from: [number, number]): [number, number] => {
  const dx = LENS[0] - from[0];
  const dy = LENS[1] - from[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const ox = LENS[0] - EC[0];
  const oy = LENS[1] - EC[1];
  const b = ox * ux + oy * uy;
  const c = ox * ox + oy * oy - RET * RET;
  const t = -b + Math.sqrt(b * b - c);
  return [LENS[0] + ux * t, LENS[1] + uy * t];
};
const DISC_AT = hitRetina(PR);
const DISC_ANG = Math.atan2(DISC_AT[1] - EC[1], DISC_AT[0] - EC[0]);
const FOVEA: [number, number] = [EC[0], EC[1] + RET];
const NERVE_OUT: [number, number] = [EC[0] + Math.cos(DISC_ANG) * (ER + 70), EC[1] + Math.sin(DISC_ANG) * (ER + 70)];
const BRAIN_C: [number, number] = [170, 1340];

const Brain: React.FC<{ glow: number }> = ({ glow }) => (
  <g transform={`translate(${BRAIN_C[0]} ${BRAIN_C[1]})`}>
    {glow > 0 && <ellipse cx={0} cy={0} rx={150} ry={120} fill="#fff1c0" opacity={0.7 * glow} />}
    <path d="M -100 10 Q -112 -50 -62 -66 Q -40 -96 0 -82 Q 40 -100 70 -70 Q 112 -56 104 -6 Q 118 40 74 58 Q 50 84 6 70 Q -36 88 -64 62 Q -108 56 -100 10 Z" fill="#f3d9d3" stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -60 -30 Q -30 -50 -10 -24 Q 10 0 40 -24 M -70 20 Q -40 0 -14 26 Q 14 44 50 18 M 0 -78 Q -6 -40 6 -10" stroke={GRAPHITE} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

const EyePanel: React.FC<{ f: number }> = ({ f }) => {
  const rayF = interpolate(f, [RAYF0, RAYF0 + 16], [0, 1], { ...clamp, easing: eo });
  const rayR = interpolate(f, [RAYR0, DISC], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ring = interpolate(f, [DISC, DISC + 9], [0, 1], { ...clamp, easing: eo });
  const ringPulse = 1 + wobble(f, BIG, 0.18, 6);
  const brainGlow = interpolate(f, [BRAIN, BRAIN + 8], [0, 1], clamp);
  const signal = interpolate(f, [BRAIN, FILLS + 10], [0, 1], { ...clamp, easing: eio });
  const fill = interpolate(f, [FILLS, FILLS + 18], [0, 1], { ...clamp, easing: eo });
  const dotGone = interpolate(f, [NEVER - 4, NEVER + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // a ray drawn from a → b → c (lens), with length progress p
  const seg = (a: [number, number], b: [number, number], c: [number, number], p: number, col: string, w: number) => {
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const tot = l1 + l2;
    return <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`} stroke={col} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${tot * p} ${tot}`} />;
  };
  // light cells along the back of the eye; none on the disc
  const cells: React.ReactNode[] = [];
  for (let a = 18; a <= 162; a += 4.5) {
    const r = (a * Math.PI) / 180;
    const d = Math.abs(r - DISC_ANG);
    if (d < 0.13) continue;
    cells.push(<line key={a} x1={EC[0] + Math.cos(r) * (RET - 18)} y1={EC[1] + Math.sin(r) * (RET - 18)} x2={EC[0] + Math.cos(r) * RET} y2={EC[1] + Math.sin(r) * RET} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />);
  }
  const dAng = (DISC_ANG * 180) / Math.PI;
  return (
    <svg width={1080} height={1500} viewBox="0 0 1080 1500" style={{ position: "absolute", left: 0, top: 0 }}>
      <rect x={0} y={0} width={1080} height={1500} fill={PAPER} />
      <g filter="url(#pencil)">
        <Hatch x={0} y={1420} w={1080} h={80} gap={20} o={0.14} />
        {/* nerve from the disc to the brain */}
        <path d={`M ${DISC_AT[0]} ${DISC_AT[1]} L ${NERVE_OUT[0]} ${NERVE_OUT[1]} Q ${NERVE_OUT[0] - 40} ${NERVE_OUT[1] + 90} ${BRAIN_C[0] + 30} ${BRAIN_C[1] - 70}`} stroke={GRAPHITE} strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d={`M ${DISC_AT[0]} ${DISC_AT[1]} L ${NERVE_OUT[0]} ${NERVE_OUT[1]} Q ${NERVE_OUT[0] - 40} ${NERVE_OUT[1] + 90} ${BRAIN_C[0] + 30} ${BRAIN_C[1] - 70}`} stroke="#d8cdb8" strokeWidth={16} fill="none" strokeLinecap="round" />
        {signal > 0 && (
          <path d={`M ${BRAIN_C[0] + 30} ${BRAIN_C[1] - 70} Q ${NERVE_OUT[0] - 40} ${NERVE_OUT[1] + 90} ${NERVE_OUT[0]} ${NERVE_OUT[1]} L ${DISC_AT[0]} ${DISC_AT[1]}`} stroke="#e8b84a" strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - signal} />
        )}
        {/* the eye, seen from above: front (lens) at the top */}
        <circle cx={EC[0]} cy={EC[1]} r={ER} fill={CREAM} stroke={GRAPHITE} strokeWidth={9} />
        <Hatch x={EC[0] - ER + 30} y={EC[1] + 80} w={2 * ER - 60} h={ER - 110} gap={22} o={0.1} />
        <path d={`M ${EC[0] - 150} ${EC[1] - ER + 44} Q ${EC[0]} ${EC[1] - ER - 92} ${EC[0] + 150} ${EC[1] - ER + 44}`} stroke={GRAPHITE} strokeWidth={7} fill="#eef3f4" />
        <line x1={EC[0] - 140} y1={LENS[1] - 6} x2={EC[0] - 72} y2={LENS[1] - 6} stroke={GRAPHITE} strokeWidth={14} strokeLinecap="round" />
        <line x1={EC[0] + 72} y1={LENS[1] - 6} x2={EC[0] + 140} y2={LENS[1] - 6} stroke={GRAPHITE} strokeWidth={14} strokeLinecap="round" />
        <ellipse cx={LENS[0]} cy={LENS[1]} rx={66} ry={30} fill="#e3ecee" stroke={GRAPHITE} strokeWidth={6} />
        {/* retina: the light cells */}
        <path d={`M ${EC[0] + Math.cos(0.3) * RET} ${EC[1] + Math.sin(0.3) * RET} A ${RET} ${RET} 0 0 1 ${EC[0] + Math.cos(Math.PI - 0.3) * RET} ${EC[1] + Math.sin(Math.PI - 0.3) * RET}`} stroke="#e7a99a" strokeWidth={10} fill="none" opacity={0.8} />
        {cells}
        {/* the disc: where the nerve leaves, no light cells */}
        <circle cx={DISC_AT[0]} cy={DISC_AT[1]} r={22} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
        {fill > 0 && (
          <g opacity={fill}>
            <Hatch x={DISC_AT[0] - 20} y={DISC_AT[1] - 20} w={40} h={40} gap={7} color="#c98c2c" o={0.9} width={4} />
          </g>
        )}
      </g>
      {/* the two dots + rays (crisp) */}
      <circle cx={PF[0]} cy={PF[1]} r={24} fill={GRAPHITE} />
      <circle cx={PR[0]} cy={PR[1]} r={24} fill={INDIGO} opacity={1 - dotGone * 0.92} />
      {dotGone > 0 && <circle cx={PR[0]} cy={PR[1]} r={30 * dotGone} fill={PAPER} opacity={dotGone} />}
      {seg(PF, LENS, FOVEA, rayF, GRAPHITE, 7)}
      {seg(PR, LENS, DISC_AT, rayR, INDIGO, 9)}
      {ring > 0 && (
        <circle cx={DISC_AT[0]} cy={DISC_AT[1]} r={46 * ringPulse} fill="none" stroke={INDIGO} strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(${dAng} ${DISC_AT[0]} ${DISC_AT[1]})`} />
      )}
      <g filter="url(#pencil)">
        <Brain glow={brainGlow} />
      </g>
    </svg>
  );
};

export const S01_SFX: SfxCue[] = [
  [W(0, 3), "pop", 0.2],
  [E(0) + 2, "whoosh", 0.3],
  [PROMISE + 4, "boing", 0.25],
  [END_W, "ding", 0.18],
  [CLAIM - 6, "whoosh", 0.2],
  [ALL_W, "swish", 0.25],
  [PUSH0, "whoosh_long", 0.3],
  [CARD0 + 4, "page", 0.25],
  [RING, "scribble", 0.35],
  [HIT, "impact", 0.7],
  [HIT + 2, "stamp", 0.35],
  [SHRINK0, "whoosh", 0.25],
  [IRIS0 - 14, "whoosh_long", 0.3],
  [RAYR0, "swish", 0.25],
  [DISC, "pop", 0.4],
  [BIG, "ding", 0.55],
  [BIG + 6, "swirl", 0.3],
  [FILLS, "scribble", 0.35],
  [BACK0, "whoosh", 0.3],
  [DOTW, "pop", 0.25],
];

export const S01Sofa: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const still = f >= STILL0 && f < STILL1; // the test: nothing moves
  const fa = still ? STILL0 : f;

  // --- Spark (sits on the sofa, phone in his right hand) -------------------------------------------------------------------
  const SY = SEAT - 4;
  const holdPhone = { ra1: 96, ra2: 78 }; // phone up in front of his face
  const sparkKeys = gestureKeys([
    [0, { ...G.rest, ...holdPhone, la1: -20, la2: 10, head: 6 }],
    [W(0, 4), { ...G.rest, ...holdPhone, la1: -60, la2: -90, head: 4 }, "snap"], // "never": hand to his closed eye
    [E(0) + 4, { ...G.rest, ...holdPhone, la1: -24, la2: 12, head: -4 }, "snap"],
    [W(1, 3), { ...G.rest, ...holdPhone, la1: -150, la2: -20, head: -8 }, "snap"], // "disappear": points up, surprised
    [END_W, { ...G.rest, ...holdPhone, la1: -70, la2: -110, head: 8 }, "snap"], // "end": shrug
    [CLAIM, { ...G.rest, ...holdPhone, la1: -40, la2: -150, head: -6 }, "snap"], // taps his glasses
    [ALL_W, { ...G.rest, ...holdPhone, la1: -110, la2: -40, head: -10 }, "snap"], // "everything": arm wide
    [PUSH0 + 2, { ...G.rest, ...holdPhone, la1: -20, la2: 10, head: 8 }, "snap"],
    [HIT, { ...G.rest, ...holdPhone, la1: -70, la2: -60, head: -14, lean: -8 }, "snap"],
    [SHRINK1 + 4, { ...G.rest, ...holdPhone, la1: -50, la2: -140, head: 10, lean: 4 }, "snap"], // scratches his head
    [IRIS0 - 10, { ...G.rest, ...holdPhone, la1: -24, la2: 12, head: 0 }, "snap"],
    [BACK1, { ...G.rest, ...holdPhone, la1: -20, la2: 10, head: 6 }, "snap"],
    [DOTW, { ...G.rest, ...holdPhone, la1: -90, la2: 0, head: 4, lean: 6 }, "snap"], // points at the viewer
    [E(8) + 4, { ...G.rest, ...holdPhone, la1: -20, la2: 10, head: 6 }, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 2));
    q = addPose(q, nod(t, E(0) - 6, 2));
    q = addPose(q, nod(t, ALL_W + 6, 2));
    q = addPose(q, hop(t, HIT, 10));
    q = addPose(q, shake(t, HIT + 14, 3));
    q = addPose(q, nod(t, DOTW + 4, 2));
    return { ...q, x: SX, y: SY + (q.y - p.y) * 0.4 };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "wink"],
      [W(0, 4), "curious"],
      [E(0) + 4, "excited"],
      [END_W, "curious"],
      [CLAIM, "smug"],
      [ALL_W, "determined"],
      [PUSH0 + 2, "wink"],
      [HIT, "shock"],
      [SHRINK1 + 4, "worried"],
      [BACK1, "happy"],
      [DOTW, "wink"],
    ];
    let m: Mood = "wink";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= BIG - 2 && t < Q) return interpolate(t, [BIG - 2, BIG + 2], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  // the phone's right dot: gone for Spark when he holds it close (he is fooled too)
  const sparkDot = f >= HIT && f < SHRINK1 + 30 ? 0 : 1;

  // --- Mr. Trick on the sofa arm ---------------------------------------------------------------------------------------------
  const tipHat = fa >= END_W - 2 && fa < E(1) + 10;
  const laugh = fa >= HIT && fa < IRIS0;
  const caneAt = fa >= PROMISE && fa < END_W - 2; // points his cane at the phone
  const trickPose: Partial<Pose> = {
    ra1: tipHat ? 160 : caneAt ? 100 : laugh ? 60 : 40,
    ra2: tipHat ? 70 : caneAt ? 0 : laugh ? -120 : 30,
    la1: laugh ? -60 : -30,
    la2: laugh ? -100 : 20,
    head: laugh ? -10 + Math.sin(fa * 0.8) * 4 : 4,
    lean: caneAt ? -10 : 0,
  };
  const trickMood = laugh ? "smug" : "sly";

  // Spark in the eye panel (standing, presenting)
  const pKeys = gestureKeys([
    [0, { ...G.rest, ...holdPhone, la1: -24, la2: 12 }],
    [RAYR0, { ...G.rest, ...holdPhone, la1: -100, la2: 0, head: 6 }, "snap"], // points at the ray
    [BIG, { ...G.mindBlown, head: -8 }, "snap"],
    [BRAIN, { ...G.rest, ...holdPhone, la1: -110, la2: 20, head: 10 }, "snap"], // points at the brain
    [NEVER, { ...G.thinkChin, head: 8 }, "snap"],
  ]);
  const pMood = (t: number): Mood => (t >= NEVER ? "thinking" : t >= BRAIN ? "happy" : t >= BIG ? "mindblown" : t >= RAYR0 ? "curious" : "worried");
  const pMod = (t: number, p: Pose) => addPose(addPose(p, idle(t, 2)), hop(t, BIG, 16));

  const svg = (
    <>
      <PencilDefs f={fa} still={still} />
      <Paper />
      <g filter="url(#pencil)">
        <Room f={fa} />
        <LampLight />
        <SofaBack />
      </g>
      <Spark
        f={fa}
        trails={false}
        scale={S}
        facing={1}
        base={{ x: SX, y: SY }}
        talk={(t) => (still ? 0 : mouthAt(t))}
        bulb={bulb}
        mood={mood}
        look={f >= HIT && f < IRIS0 ? 0.6 : 0.4}
        keys={sparkKeys}
        mod={sparkMod}
      >
        {(j) => <Phone x={j.rHand[0] + 6} y={j.rHand[1] - 50} rightDot={sparkDot} />}
      </Spark>
      {/* solid underlay: the pencil grain makes fills see-through, so Spark's legs are hidden by plain shapes first */}
      <rect x={300} y={SEAT - 10} width={680} height={FLOOR - SEAT + 14} fill="#c9b79a" />
      <path d={`M ${SX - 190} ${SEAT - 20} Q ${SX} ${SEAT - 60} ${SX + 190} ${SEAT - 18} L ${SX + 210} ${SEAT + 170} Q ${SX} ${SEAT + 200} ${SX - 210} ${SEAT + 172} Z`} fill={PAPER} />
      <g filter="url(#pencil)">
        <SofaFront />
        <LampBody />
        <MrTrick x={1050} ground={1062} scale={1.35} facing={-1} pose={trickPose} mood={trickMood} cane={caneAt ? "none" : "down"}>
          {(j) =>
            caneAt ? <line x1={j.rHand[0]} y1={j.rHand[1]} x2={j.rHand[0] - 120} y2={j.rHand[1] - 30} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" /> : null
          }
        </MrTrick>
      </g>
    </>
  );

  // the phone screen grows into the test card, then shrinks back
  const grow = interpolate(f, [CARD0, CARD1], [0, 1], { ...clamp, easing: eio });
  const shrink = interpolate(f, [SHRINK0, SHRINK1], [0, 1], { ...clamp, easing: eio });
  const cardP = f < SHRINK0 ? grow : 1 - shrink;
  const cardOn = f >= CARD0 && f < SHRINK1;
  const pw = PW * PHONE[2];
  const ph = PH * PHONE[2];
  const cw = pw + (1080 - pw) * cardP;
  const ch = ph + (1500 - ph) * cardP;
  const cx = 540 - cw / 2;
  const cy = (960 - ph / 2) * (1 - cardP);

  // iris into the eye and back out
  const irisIn = interpolate(f, [IRIS0, IRIS1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const irisOut = interpolate(f, [BACK0, BACK1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const irisR = f < BACK0 ? irisIn * 1300 : (1 - irisOut) * 1300;
  const panelOn = f >= IRIS0 && f < BACK1;

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
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
        opacity: interpolate(f, [until - 8, until], [1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const hole = <>YOUR EYE'S <span style={{ color: INDIGO }}>HOLE</span></>;
  const label = (text: string, x: number, y: number, at: number, until: number) =>
    f >= at && f < until ? (
      <div style={{ position: "absolute", left: x, top: y, fontFamily: FONT.title, fontWeight: 900, fontSize: 52, color: GRAPHITE, WebkitTextStroke: `12px ${PAPER}`, paintOrder: "stroke fill", transform: `scale(${interpolate(f, [at, at + 8], [0.4, 1], { ...clamp, easing: eoB })})`, transformOrigin: "left center", opacity: interpolate(f, [until - 6, until], [1, 0], clamp) }}>
        {text}
      </div>
    ) : null;
  const smallLine =
    f < 290
      ? ""
      : f < STILL1
        ? "Phones only. Keep looking at the left dot. The distance is different on every phone."
        : f >= C(6) && f < Q - 6
          ? "The blind spot is where the nerve leaves the eye: no light cells there (Meermeier et al. 2023, Vision Research). Drawing not to scale. With both eyes open, each eye covers the other's gap."
          : "";
  const html = (
    <>
      {cardOn && (
        <div style={{ position: "absolute", left: cx, top: cy, width: cw, height: ch, overflow: "hidden", borderRadius: 14 * (1 - cardP), opacity: interpolate(f, [CARD0, CARD0 + 4], [0, 1], clamp) }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1500, transform: `scale(${cw / 1080})`, transformOrigin: "0 0" }}>
            <TestCard f={f} />
          </div>
        </div>
      )}
      {panelOn && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1500, clipPath: `circle(${irisR}px at 540px 905px)` }}>
          <EyePanel f={f} />
          <svg width={1080} height={1500} viewBox="0 0 1080 1500" style={{ position: "absolute", left: 0, top: 0 }}>
            <Spark f={f} trails={false} scale={2.6} facing={-1} base={{ x: 905, y: 1440 - 92.5 * 2.6 }} talk={(t) => mouthAt(t)} bulb={bulb} mood={pMood} look={-0.5} keys={pKeys} mod={pMod}>
            </Spark>
          </svg>
          {f >= NOCELLS && f < BRAIN - 2 && (
            <svg width={1080} height={1500} style={{ position: "absolute", left: 0, top: 0 }}>
              <path d={`M 330 1250 L ${DISC_AT[0] + 34} ${DISC_AT[1] + 40}`} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - interpolate(f, [NOCELLS, NOCELLS + 8], [0, 1], clamp)} />
            </svg>
          )}
          {label("NO LIGHT CELLS", 300, 1240, NOCELLS, BRAIN - 2)}
          {label("YOUR BRAIN", 290, 1300, BRAIN, Q)}
        </div>
      )}
      <CaptionBand />
      {f < E(0) + 10 && top(hole, 0, E(0) + 10, 116)}
      {f >= BLIND && f < IRIS0 && top(<>BLIND <span style={{ color: INDIGO }}>SPOT</span></>, BLIND, IRIS0, 124)}
      {f >= E(8) + 2 && top(hole, E(8) + 2, VOICE_FRAMES + 200, 116)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1672, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 290 && f < E(8) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1760, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: INDIGO, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 13</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1560} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["eye", "spot?", "disappear,", "end", "everything.", "left", "slowly", "blind", "spot!", "no", "light", "brain", "gap,", "dot"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={still ? camAtRig(STILL0) : cam} hits={[HIT, BIG]} power={5} svg={svg} html={html} />;
};

export const _doodle = Doodle;
