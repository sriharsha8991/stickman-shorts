import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { STAND, addPose, idle, runCycle, solve, walkCycle, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { arc, popIn, wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SOFT, SketchBox, SketchLine } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T31 · "Why does your voice sound wrong on recordings?" Spark Got Tricked #1 (STORY, pencil look, 27 s).
// T31 · "Why do you never sound right on recordings?" Spark Got Tricked #1 (STORY, pencil look, 27 s).
// ONE world, one camera rig: a pencil living room. A voice note plays back, Spark hates it, Mr. Trick steals the phone and unrolls a sheet
// on the wall: a head with two sound paths. He rubs the bone path out with an eraser: the phone only ever gets the air path.
// Reinfeldt et al. 2010: see facts.md. The family and the words of the voice note are our own example.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.12);

const ACCENT = "#e8590c";
const CREAM = "#fbf6ea";
const BAND = "#2d2a26";
const GROUND = 1440;
const S0 = 2.5;
const HANDS: Partial<Pose> = { ra1: 118, ra2: 52, la1: -118, la2: -52, head: -3, lean: 0 };

// --- timing ---------------------------------------------------------------------------------------------------------------
const WHY = W(0, 8);
const LASTW = W(1, 3);
const SEND = C(2);
const PLAY = W(2, 6);
export const PLAYBACK = E(2) + 8; // the thin voice note plays in the pause
const DELETE = W(3, 2);
const SNATCH = W(3, 4) - 2;
const YOUW = W(3, 6);
const ROLL0 = E(3) + 8;
const ROLL1 = ROLL0 + 24;
const AIRW = W(4, 4);
const BONES = W(4, 6);
const SLAP = E(4) - 4; // the phone is stuck on the sheet
const DROP = E(4) + 2;
const REC = W(5, 1);
const ONLY = W(5, 3);
const PART = W(5, 6);
const OTHER = C(6);
const PEOPLE = W(6, 2);
const RECW = W(6, 8);
const Q = C(7);
const NOTESW = W(7, 5);
const LOOP0 = E(7) + 2;
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [390, 1040, 2.05];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(C(1) - 2, C(1) + 18, [565, 1000, 1.22]), // the room
  k(E(2) - 2, E(2) + 30, [430, 1010, 1.48]), // slow push on his face during the playback
  k(SNATCH - 2, SNATCH + 18, [620, 1000, 1.12]), // right, to the thief
  k(ROLL0 - 2, ROLL0 + 20, [540, 960, 1.0]), // the whole wall
  k(Q - 12, Q + 8, [250, 900, 1.75]), // he asks you
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

// --- Spark's path ---------------------------------------------------------------------------------------------------------
const SX0 = 280;
const SXJ = 545; // jumps for the phone
const SXD = 165; // beside the sheet
type PK = [number, number, ((t: number) => number)?];
const PATH: PK[] = [
  [0, SX0],
  [SNATCH + 4, SX0],
  [SNATCH + 22, SXJ, eo],
  [ROLL1 - 8, SXJ],
  [ROLL1 + 16, SXD, sio],
  [PART, SXD],
  [PART + 8, SXD + 22, sio],
  [LOOP0 + 1, SXD + 22],
  [LOOP1 - 4, SX0, sio],
];
const xAt = (f: number) => {
  if (f <= PATH[0][0]) return PATH[0][1];
  for (let i = 1; i < PATH.length; i++) {
    const [a, ax] = PATH[i - 1];
    const [b, bx, e] = PATH[i];
    if (f <= b) return ax + (bx - ax) * interpolate(f, [a, b], [0, 1], { ...clamp, easing: e ?? sio });
  }
  return PATH[PATH.length - 1][1];
};
const running = (t: number) => (t >= SNATCH + 4 && t < SNATCH + 22) || (t >= ROLL1 - 8 && t < ROLL1 + 16) || (t >= LOOP0 + 1 && t < LOOP1 - 4);
const scaleAt = (f: number) =>
  interpolate(f, [PART - 2, PART + 4, PART + 9, PART + 13, LOOP0, LOOP1], [S0, 3.12, 2.95, 3.0, 3.0, S0], { ...clamp, easing: sio });

// --- fixed places ---------------------------------------------------------------------------------------------------------
const TABLE_X = 470;
const TABLE_TOP = 1205;
const PT: [number, number] = [TABLE_X, TABLE_TOP - 92]; // phone on the table (centre)
const DANGLE: [number, number] = [770, 880];
const TAPE: [number, number] = [905, 590];
const CAB_X = 860;
const CAB_TOP = 1060;
const SHEET_X = 240;
const SHEET_W = 800;
const ROLL_Y = 322;
const ROD_Y = 1040;
const HEAD: [number, number, number] = [520, 660, 215];
const MOUTH: [number, number] = [728, 742];
const EAR: [number, number] = [316, 678];

// A wavy path along a cubic bezier.
type XY = [number, number];
const wave = (a: XY, c1: XY, c2: XY, b: XY, amp: number, n: number) => {
  const pts: string[] = [];
  const N = 110;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const u = 1 - s;
    const x = u * u * u * a[0] + 3 * u * u * s * c1[0] + 3 * u * s * s * c2[0] + s * s * s * b[0];
    const y = u * u * u * a[1] + 3 * u * u * s * c1[1] + 3 * u * s * s * c2[1] + s * s * s * b[1];
    const dx = 3 * u * u * (c1[0] - a[0]) + 6 * u * s * (c2[0] - c1[0]) + 3 * s * s * (b[0] - c2[0]);
    const dy = 3 * u * u * (c1[1] - a[1]) + 6 * u * s * (c2[1] - c1[1]) + 3 * s * s * (b[1] - c2[1]);
    const L = Math.hypot(dx, dy) || 1;
    const o = Math.sin(s * Math.PI * 2 * n) * amp * Math.min(1, Math.min(s, 1 - s) * 8);
    pts.push(`${i ? "L" : "M"} ${(x - (dy / L) * o).toFixed(1)} ${(y + (dx / L) * o).toFixed(1)}`);
  }
  return pts.join(" ");
};
const AIR_ARC = wave(MOUTH, [880, 220], [140, 300], [EAR[0] - 26, EAR[1] - 10], 12, 15);
const AIR_PHONE = wave([MOUTH[0] + 8, MOUTH[1] - 6], [790, 730], [800, 700], [TAPE[0] - 66, TAPE[1] + 30], 12, 4);

const Draw: React.FC<{ d: string; k: number; color?: string; w?: number }> = ({ d, k: kk, color = ACCENT, w = 11 }) => (
  <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, kk))} />
);

const Txt: React.FC<{ x: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number }> = ({ x, y, s, c = GRAPHITE, children, a = "middle", w = 900 }) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={w} fontSize={s} fill={c}>
    {children}
  </text>
);

// The phone: paper body, graphite edge, orange waveform: the one coloured object in the pencil world.
const BARS = [0.3, 0.55, 0.9, 0.5, 0.75, 1, 0.6, 0.35, 0.8, 0.5, 0.9, 0.4];
const Phone: React.FC<{ f: number; playing: boolean; s?: number; rot?: number; x: number; y: number; del?: number; mute?: boolean }> = ({ f, playing, s = 1, rot = 0, x, y, del = 0, mute }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-60} y={-108} width={120} height={216} rx={18} fill="#fffdf6" />
    <rect x={-64} y={-112} width={128} height={224} rx={20} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />
    <rect x={-52} y={-92} width={104} height={178} rx={6} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={3} />
    <circle cx={0} cy={-102} r={3.5} fill={GRAPHITE} />
    <g transform="translate(0 -24)">
      {BARS.map((b, i) => {
        const a = playing ? 0.55 + 0.45 * Math.sin(f * 0.75 + i * 1.9) : 0.75;
        const h = mute ? 8 : 12 + 72 * b * a;
        return <rect key={i} x={-46 + i * 7.9} y={-h / 2} width={5.4} height={h} rx={2.6} fill={ACCENT} />;
      })}
    </g>
    <circle cx={0} cy={52} r={22} fill={playing ? ACCENT : GRAPHITE} />
    {playing ? <path d="M -8 40 L -8 64 M 8 40 L 8 64" stroke="#fff" strokeWidth={7} strokeLinecap="round" /> : <path d="M -7 39 L 13 52 L -7 65 Z" fill="#fff" />}
    {del > 0.01 && (
      <g transform={`translate(0 -24) scale(${del})`}>
        <rect x={-58} y={-30} width={116} height={60} rx={10} fill={ACCENT} stroke={GRAPHITE} strokeWidth={4} />
        <Txt x={0} y={10} s={25} c="#fff">
          DELETE?
        </Txt>
      </g>
    )}
  </g>
);

// A bone, as anyone would draw one.
const Bone: React.FC = () => (
  <g>
    <path
      d="M 395 716 C 372 694 396 672 416 690 C 420 672 450 672 448 702 L 628 712 C 634 682 664 686 662 708 C 688 700 700 730 676 742 C 692 762 660 780 648 752 L 446 742 C 442 770 410 766 412 744 C 392 750 378 730 395 716 Z"
      fill="#fffdf6"
      stroke={GRAPHITE}
      strokeWidth={9}
      strokeLinejoin="round"
    />
    <SketchLine x1={470} y1={726} x2={610} y2={732} w={4} color={SOFT} />
  </g>
);

const Room: React.FC = () => (
  <g>
    {/* wall + floor */}
    <SketchLine x1={-120} y1={1300} x2={1200} y2={1300} w={6} />
    <SketchLine x1={-120} y1={1250} x2={1200} y2={1250} w={3} />
    <Hatch x={-120} y={1304} w={1320} h={240} gap={34} o={0.2} />
    {/* pendant lamp */}
    <SketchLine x1={140} y1={-10} x2={140} y2={205} w={4} />
    <path d="M 62 280 Q 80 205 140 205 Q 200 205 218 280 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <Hatch x={70} y={225} w={140} h={55} gap={14} o={0.25} />
    <circle cx={140} cy={290} r={16} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
    {/* window with curtains */}
    <SketchBox x={-110} y={430} w={270} h={480} fill="#fdf9ef" />
    <SketchLine x1={-50} y1={430} x2={-50} y2={910} />
    <SketchLine x1={-110} y1={670} x2={160} y2={670} />
        <SketchBox x={-110} y={700} w={50} h={210} hatch={0.3} />
    <SketchBox x={40} y={770} w={90} h={140} hatch={0.5} />
    <path d="M 120 420 Q 180 640 130 930 L 210 930 Q 190 640 205 420 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <Hatch x={140} y={430} w={60} h={490} gap={18} o={0.3} />
    <SketchLine x1={-110} y1={420} x2={230} y2={420} w={9} />
    {/* family photos */}
    {[
      [300, 470, 118, 150],
      [440, 440, 150, 112],
      [620, 470, 110, 140],
      [330, 660, 150, 110],
      [520, 620, 130, 160],
      [690, 650, 110, 130],
    ].map(([x, y, w, h], i) => (
      <g key={i}>
        <SketchBox x={x} y={y} w={w} h={h} fill={CREAM} />
        <path d={`M ${x + w * 0.16} ${y + h} Q ${x + w * 0.2} ${y + h * 0.66} ${x + w / 2} ${y + h * 0.66} Q ${x + w * 0.8} ${y + h * 0.66} ${x + w * 0.84} ${y + h} Z`} fill={SOFT} opacity={0.55} />
        <circle cx={x + w / 2} cy={y + h * 0.42} r={Math.min(w, h) * 0.2} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={4} />
        <circle cx={x + w / 2 - Math.min(w, h) * 0.07} cy={y + h * 0.4} r={2.8} fill={GRAPHITE} />
        <circle cx={x + w / 2 + Math.min(w, h) * 0.07} cy={y + h * 0.4} r={2.8} fill={GRAPHITE} />
        <path d={`M ${x + w / 2 - Math.min(w, h) * 0.08} ${y + h * 0.46} q ${Math.min(w, h) * 0.08} ${Math.min(w, h) * 0.08} ${Math.min(w, h) * 0.16} 0`} fill="none" stroke={GRAPHITE} strokeWidth={3} />
      </g>
    ))}
    {/* wall clock + shelf */}
    <circle cx={950} cy={510} r={72} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <SketchLine x1={950} y1={510} x2={950} y2={462} />
    <SketchLine x1={950} y1={510} x2={984} y2={528} />
    <SketchLine x1={850} y1={760} x2={1080} y2={760} w={8} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
        <SketchBox x={868 + i * 30} y={760 - 96 - (i % 2) * 14} w={26} h={96 + (i % 2) * 14} fill={i % 3 === 0 ? PAPER2 : CREAM} lw={3} />
      </g>
    ))}
    {/* plant, far left */}
    <path d="M -60 1370 L -80 1270 L 40 1270 L 20 1370 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    {[-36, -12, 12, 36].map((a, i) => (
      <path key={i} d={`M -20 1270 Q ${-20 + a * 2} 1170 ${-20 + a * 3.4} ${1100 + (i % 2) * 34}`} fill="none" stroke={GRAPHITE} strokeWidth={8} strokeLinecap="round" />
    ))}
    {/* rug */}
    <ellipse cx={560} cy={1405} rx={460} ry={46} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <ellipse cx={560} cy={1405} rx={400} ry={32} fill="none" stroke={SOFT} strokeWidth={3} />
    {/* slippers */}
    <path d="M 930 1402 q 40 -24 74 0 q -36 16 -74 0 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 950 1428 q 40 -24 74 0 q -36 16 -74 0 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
  </g>
);

const SolidSofa: React.FC = () => (
  <g fill={CREAM}>
    <path d="M 392 1340 L 392 1170 Q 392 1130 440 1130 L 780 1130 Q 828 1130 828 1170 L 828 1340 Z" />
    <rect x={350} y={1200} width={520} height={130} rx={24} />
  </g>
);
const Sofa: React.FC<{ f: number }> = ({ f }) => {
  const wake = interpolate(f, [PLAYBACK + 4, PLAYBACK + 9, PLAYBACK + 40, PLAYBACK + 52], [0, 1, 1, 0], clamp);
  return (
    <g>
      <path d="M 392 1340 L 392 1170 Q 392 1130 440 1130 L 780 1130 Q 828 1130 828 1170 L 828 1340 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      <Hatch x={400} y={1140} w={420} h={100} gap={22} o={0.22} />
      <rect x={372} y={1240} width={476} height={72} rx={18} fill={PAPER2} stroke={GRAPHITE} strokeWidth={7} />
      <rect x={350} y={1200} width={62} height={130} rx={24} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      <rect x={808} y={1200} width={62} height={130} rx={24} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      <SketchLine x1={410} y1={1312} x2={400} y2={1344} w={8} />
      <SketchLine x1={810} y1={1312} x2={820} y2={1344} w={8} />
      {/* cushion */}
      <path d="M 430 1240 L 440 1168 L 512 1176 L 508 1240 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      {/* the cat, asleep on the sofa until the voice note plays */}
      <g transform={`translate(712 ${1242 - wake * 5})`}>
        <path d="M -56 0 Q -60 -48 -6 -50 Q 36 -52 46 -14 L 46 0 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={6} />
        <Hatch x={-44} y={-40} w={56} h={36} gap={12} o={0.35} />
        <g transform={`translate(${48 - wake * 2} ${-24 - wake * 34})`}>
          <circle r={26} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={6} />
          <path d="M -22 -14 L -18 -40 L -4 -24 M 22 -14 L 18 -40 L 4 -24" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          {wake > 0.5 ? (
            <g fill={GRAPHITE}>
              <circle cx={-9} cy={-3} r={5.5} />
              <circle cx={10} cy={-3} r={5.5} />
              <ellipse cx={1} cy={12} rx={4} ry={5} />
            </g>
          ) : (
            <g fill="none" stroke={GRAPHITE} strokeWidth={4} strokeLinecap="round">
              <path d="M -14 -2 q 5 5 10 0" />
              <path d="M 5 -2 q 5 5 10 0" />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

const Cabinet: React.FC = () => (
  <g>
    <SketchBox x={CAB_X} y={CAB_TOP} w={220} h={270} fill={CREAM} lw={6} />
    <Hatch x={CAB_X} y={CAB_TOP + 6} w={220} h={262} gap={24} o={0.18} />
    <SketchLine x1={CAB_X + 110} y1={CAB_TOP} x2={CAB_X + 110} y2={CAB_TOP + 270} w={4} />
    <circle cx={CAB_X + 92} cy={CAB_TOP + 120} r={8} fill={GRAPHITE} />
    <circle cx={CAB_X + 128} cy={CAB_TOP + 120} r={8} fill={GRAPHITE} />
    <SketchLine x1={CAB_X + 16} y1={CAB_TOP + 270} x2={CAB_X + 12} y2={CAB_TOP + 288} w={8} />
    <SketchLine x1={CAB_X + 204} y1={CAB_TOP + 270} x2={CAB_X + 208} y2={CAB_TOP + 288} w={8} />
    {/* table lamp at the far end */}
    <SketchLine x1={CAB_X + 190} y1={CAB_TOP} x2={CAB_X + 190} y2={CAB_TOP - 70} w={6} />
    <path d={`M ${CAB_X + 148} ${CAB_TOP - 66} L ${CAB_X + 166} ${CAB_TOP - 124} L ${CAB_X + 214} ${CAB_TOP - 124} L ${CAB_X + 232} ${CAB_TOP - 66} Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
  </g>
);

const Table: React.FC = () => (
  <g>
    <ellipse cx={TABLE_X} cy={1412} rx={82} ry={14} fill={GRAPHITE} opacity={0.18} />
    <SketchLine x1={TABLE_X} y1={TABLE_TOP + 6} x2={TABLE_X} y2={1400} w={9} />
    <SketchLine x1={TABLE_X - 70} y1={1408} x2={TABLE_X + 70} y2={1408} w={9} />
    <ellipse cx={TABLE_X} cy={TABLE_TOP + 4} rx={118} ry={17} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
    {/* mug the phone leans on */}
    <path d={`M ${TABLE_X - 104} ${TABLE_TOP - 4} L ${TABLE_X - 104} ${TABLE_TOP - 62} L ${TABLE_X - 54} ${TABLE_TOP - 62} L ${TABLE_X - 54} ${TABLE_TOP - 4} Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    <path d={`M ${TABLE_X - 104} ${TABLE_TOP - 50} q -22 18 0 34`} fill="none" stroke={GRAPHITE} strokeWidth={6} />
  </g>
);

// The sheet: a head with its two sound paths.
const Sheet: React.FC<{ f: number; h: number }> = ({ f, h }) => {
  const airK = interpolate(f, [AIRW - 7, AIRW + 13], [0, 1], { ...clamp, easing: sio });
  const boneK = popIn(f, BONES - 4);
  const phoneK = interpolate(f, [REC, ONLY], [0, 1], { ...clamp, easing: sio });
  const eraseX = interpolate(f, [ONLY, PART - 3], [345, 705], clamp); // what is right of this x is still drawn
  const gone = f >= PART - 3;
  const buzz = f >= BONES && !gone ? Math.sin(f * 1.7) * 2.4 : 0;
  const airLabel = popIn(f, AIRW + 2);
  const onlyK = interpolate(f, [PART, PART + 8], [11, 18], clamp);
  return (
    <g>
      <clipPath id="sheetClip">
        <rect x={SHEET_X - 10} y={ROLL_Y} width={SHEET_W + 20} height={Math.max(0, h)} />
      </clipPath>
      <g clipPath="url(#sheetClip)">
        <rect x={SHEET_X} y={ROLL_Y} width={SHEET_W} height={ROD_Y - ROLL_Y + 4} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={7} />
        {/* the head, cut open */}
        <circle cx={HEAD[0]} cy={HEAD[1]} r={HEAD[2]} fill="#fffaf0" stroke={GRAPHITE} strokeWidth={11} />
        <circle cx={HEAD[0] + 3} cy={HEAD[1] - 2} r={HEAD[2] + 2} fill="none" stroke={GRAPHITE} strokeWidth={4} opacity={0.5} />
        <path d={`M 330 560 Q 400 440 ${HEAD[0] + 40} 452 Q 660 470 702 560 Q 610 500 500 512 Q 400 520 330 560 Z`} fill={GRAPHITE} />
        <circle cx={640} cy={612} r={34} fill="#fff" stroke={GRAPHITE} strokeWidth={7} />
        <circle cx={650} cy={612} r={10} fill={GRAPHITE} />
        {/* outer ear + inner ear */}
        <path d={`M ${EAR[0] + 4} 640 Q 280 640 282 680 Q 284 722 ${EAR[0] + 6} 716`} fill="#fffaf0" stroke={GRAPHITE} strokeWidth={9} />
        <path d="M 376 700 q 26 -24 12 -40 q -18 -14 -30 6 q -8 20 10 22" fill="none" stroke={GRAPHITE} strokeWidth={8} strokeLinecap="round" />
        {/* the mouth */}
        <path d={`M ${MOUTH[0] - 2} ${MOUTH[1] - 20} L ${MOUTH[0] - 62} ${MOUTH[1] + 4} L ${MOUTH[0] - 18} ${MOUTH[1] + 28} Z`} fill={GRAPHITE} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
        {/* the air path */}
        {f >= AIRW - 7 && <Draw d={AIR_ARC} k={airK} w={onlyK} />}
        {airLabel > 0.01 && (
          <g transform={`translate(860 400) scale(${airLabel})`}>
            <Txt x={0} y={22} s={76} c={ACCENT}>
              AIR
            </Txt>
          </g>
        )}
        {/* the bone path: rubbed out right to left */}
        {boneK > 0.01 && (
          <g>
            <clipPath id="boneClip">
              <rect x={eraseX} y={500} width={Math.max(0, 760 - eraseX)} height={360} />
            </clipPath>
            <g clipPath="url(#boneClip)">
              <g transform={`translate(${buzz} ${-buzz * 0.5}) translate(530 725) scale(${boneK}) translate(-530 -725)`}>
                <Bone />
                <Txt x={530} y={826} s={66}>
                  BONES
                </Txt>
              </g>
            </g>
            {/* the smudge the eraser leaves */}
            {f >= ONLY && (
              <g opacity={0.22}>
                <rect x={375} y={708} width={Math.max(0, eraseX - 375)} height={50} rx={22} fill={SOFT} />
              </g>
            )}
          </g>
        )}
        {f >= REC && <Draw d={AIR_PHONE} k={phoneK} w={onlyK} />}
      </g>
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [C(1) - 2, "swish", 0.35],
  [LASTW, "pop", 0.45],
  [SEND + 6, "swish", 0.25],
  [PLAY, "tick", 0.7],
  [SNATCH - 3, "whoosh", 0.5],
  [SNATCH + 10, "pop", 0.45],
  [SNATCH + 22, "boing", 0.4],
  [SNATCH + 38, "boing", 0.32],
  [ROLL0, "page", 0.8],
  [ROLL1 - 2, "thud", 0.5],
  [AIRW - 6, "scribble", 0.4],
  [BONES - 2, "pop", 0.5],
  [SLAP, "stamp", 0.55],
  [DROP + 8, "pop", 0.5],
  [ONLY - 1, "scribble", 0.7],
  [ONLY + 13, "scribble", 0.6],
  [PART, "impact", 0.8],
  [PEOPLE - 8, "pop", 0.3],
  [PEOPLE - 3, "pop", 0.3],
  [PEOPLE + 2, "pop", 0.3],
  [RECW, "ding", 0.55],
  [LOOP0 + 2, "page", 0.5],
  [LOOP0 + 8, "whoosh", 0.3],
];

export const S01Room: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const sNow = scaleAt(f);

  // --- Spark ----------------------------------------------------------------------------------------------------------------
  const sparkKeys = gestureKeys([
    [0, HANDS],
    [W(0, 8) - 3, G.shrugBig, "snap"],
    [C(1) + 2, G.stop, "snap"],
    [LASTW, G.pointUp, "snap"],
    [E(1) + 4, G.rest],
    [SEND, { ra1: 74, ra2: 8, la1: -14, la2: 8, lean: 5, head: 4 }],
    [SEND + 16, { ra1: 58, ra2: 118, la1: -22, la2: 10, head: -6, lean: -3 }, "snap"],
    [PLAY - 4, { ra1: 74, ra2: 26, la1: -66, la2: -56, lean: 2, head: 2 }, "snap"],
    [PLAYBACK + 4, { ra1: 74, ra2: 26, la1: -48, la2: -92, lean: -10, head: -10 }, "snap"],
    [DELETE, { ra1: 66, ra2: 56, la1: -30, la2: -30, lean: 8, head: 6 }, "snap"],
    [SNATCH + 2, G.recoil, "snap"],
    [SNATCH + 22, { ...G.pointUp, ra1: 150, ra2: 6, lean: 8 }, "snap"],
    [ROLL1 + 14, { ...G.thinkChin, head: -4 }],
    [AIRW, { ra1: 128, ra2: 2, la1: -16, la2: 10, head: -8 }, "snap"],
    [BONES, { ...G.count2, ra1: 118, ra2: 8 }, "snap"],
    [DROP, { ...G.thinkChin, head: 6 }, "snap"],
    [REC, { ...G.recoil, ra1: 110, ra2: 10 }, "snap"],
    [PART, { ...HANDS, ra1: 128, la1: -128 }, "snap"],
    [OTHER - 4, { ...G.thinkChin, head: 8 }],
    [PEOPLE, { ra1: 92, ra2: 12, la1: -14, la2: 10, lean: 3 }, "snap"],
    [RECW, G.shrugBig, "snap"],
    [Q - 6, { ...G.leanIn, ra1: 76, ra2: 8 }, "snap"],
    [NOTESW - 4, { ...G.leanIn, ra1: 66, ra2: 30 }, "snap"],
    [LOOP0 + 12, HANDS, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (running(t)) q = addPose(q, runCycle(t, 0.75, 0.9));
    q = addPose(q, hop(t, SNATCH + 22, 66));
    q = addPose(q, hop(t, SNATCH + 38, 54));
    q = addPose(q, hop(t, PART, 48));
    q = addPose(q, nod(t, LASTW + 2, 2));
    q = addPose(q, nod(t, W(6, 3), 2));
    q = addPose(q, shake(t, YOUW, 2));
    const s = scaleAt(t);
    return { ...q, x: xAt(t), y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const facing = (t: number) => (t >= ROLL1 - 8 && t < ROLL1 + 16 ? -1 : 1);
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [WHY - 3, "curious"],
      [LASTW, "excited"],
      [E(1) + 8, "happy"],
      [SEND + 14, "smug"],
      [PLAY - 2, "excited"],
      [PLAYBACK + 5, "shock"],
      [DELETE, "worried"],
      [SNATCH + 2, "shock"],
      [SNATCH + 20, "angry"],
      [ROLL1 - 8, "curious"],
      [AIRW - 2, "smug"],
      [BONES, "happy"],
      [DROP + 2, "thinking"],
      [DROP + 16, "worried"],
      [REC, "shock"],
      [PART, "mindblown"],
      [OTHER - 4, "thinking"],
      [PEOPLE, "curious"],
      [RECW, "laugh"],
      [Q - 6, "curious"],
      [NOTESW - 2, "wink"],
      [LOOP0 + 12, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= PART && t < LOOP0 + 6) return interpolate(t, [PART, PART + 4], [0.2, 1], clamp);
    const q = Math.floor(t / 4);
    const n = Math.abs(Math.sin(q * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };

  // --- phone ----------------------------------------------------------------------------------------------------------------
  const pickK = interpolate(f, [SEND + 6, SEND + 18], [0, 1], { ...clamp, easing: sio });
  const inHand = f >= SEND + 6 && f < SNATCH + 2;
  const playing = (f < E(0) + 6) || (f >= PLAYBACK - 2 && f < SNATCH + 2);
  const del = interpolate(f, [DELETE - 2, DELETE + 6], [0, 1], { ...clamp, easing: eoB }) * (f < SNATCH + 2 ? 1 : 0);
  const shakeP = f >= PLAYBACK && f < PLAYBACK + 40 ? Math.sin(f * 1.9) * 3.5 : 0;
  const phoneHand = (j: Joints) => {
    const hx = j.rHand[0] + 36;
    const hy = j.rHand[1] - 62;
    const x = PT[0] + (hx - PT[0]) * pickK;
    const y = PT[1] + (hy - PT[1]) * pickK - Math.sin(pickK * Math.PI) * 28;
    return <Phone f={f} playing={playing} x={x + shakeP} y={y} s={1 - pickK * 0.1} rot={-7 + pickK * 13} del={del} />;
  };
  const fromHand: [number, number] = [530, 975];
  const flyK = interpolate(f, [SNATCH + 2, SNATCH + 18], [0, 1], { ...clamp, easing: eo });
  const tapeK = interpolate(f, [SLAP - 16, SLAP], [0, 1], { ...clamp, easing: ei });
  const backK = interpolate(f, [LOOP0 + 6, LOOP1 - 4], [0, 1], { ...clamp, easing: sio });
  let px = PT[0];
  let py = PT[1];
  let pr = -7;
  let ps = 1;
  if (f >= SNATCH + 2) {
    const [ax, ay] = arc(flyK, fromHand, DANGLE, 60);
    px = ax;
    py = ay + Math.sin((f - SNATCH) * 0.24) * 5;
    pr = wobble(f, SNATCH + 18, 13, 16);
    ps = 0.9;
  }
  if (f >= SLAP - 16) {
    const [ax, ay] = arc(tapeK, DANGLE, TAPE, 60);
    px = ax;
    py = ay;
    pr = 0;
    ps = 0.9 + tapeK * 0.12;
  }
  if (f >= SLAP) {
    px = TAPE[0];
    py = TAPE[1];
    pr = wobble(f, SLAP, 3, 6);
  }
  if (f >= LOOP0 + 6) {
    const [ax, ay] = arc(backK, TAPE, PT, 70);
    px = ax;
    py = ay;
    pr = -7 * backK;
    ps = 1.02 - backK * 0.02;
  }
  const phoneBig = f >= PART && f < LOOP0 ? 1 + wobble(f, PART, 0.06, 7) : 1;

  // --- sheet + Mr. Trick ---------------------------------------------------------------------------------------------------
  const rollH = f < LOOP0
    ? interpolate(f, [ROLL0, ROLL1 - 6, ROLL1], [0, ROD_Y - ROLL_Y + 14, ROD_Y - ROLL_Y], { ...clamp, easing: sio })
    : interpolate(f, [LOOP0 + 2, LOOP0 + 20], [ROD_Y - ROLL_Y, 0], { ...clamp, easing: sio });
  const rodY = ROLL_Y + rollH;
  const peek = interpolate(f, [LASTW - 6, LASTW + 6], [1520, 1250], { ...clamp, easing: eoB });
  const jumpK = interpolate(f, [SNATCH - 10, SNATCH + 2], [0, 1], { ...clamp, easing: eo });
  const onRod = f >= DROP + 2;
  const walkK = interpolate(f, [DROP + 10, REC + 16], [0, 1], { ...clamp, easing: sio });
  const rubK = interpolate(f, [ONLY, PART - 3], [0, 1], clamp);
  const offK = interpolate(f, [PART + 1, PART + 15], [0, 1], { ...clamp, easing: eo });
  const mrX = onRod ? 925 + (420 - 925) * walkK + (770 - 420) * rubK + (850 - 770) * offK + (f < PART - 3 && f >= ONLY ? Math.sin(f * 1.5) * 30 : 0) : 925;
  const mrG = onRod ? (f < DROP + 10 ? interpolate(f, [DROP + 2, DROP + 10], [CAB_TOP, rodY], clamp) - Math.sin(((f - DROP - 2) / 8) * Math.PI) * 42 : rodY) : peek + (CAB_TOP - peek) * jumpK - Math.sin(jumpK * Math.PI) * 60;
  const mrMood = f >= PART ? "smug" : "sly";
  const eraserIn = f >= DROP + 6 ? popIn(f, DROP + 9) : 0;
  const mrWalking = (f >= DROP + 12 && f < REC + 14) || (f >= PART + 1 && f < PART + 15);
  const mrPose: Partial<Pose> = (() => {
    const w = mrWalking ? walkCycle(f, 0.55) : {};
    if (onRod && f < PART + 2) return { ...w, ra1: -26, ra2: -18, la1: -44, la2: -34, lean: -3, head: -8 } as Partial<Pose>;
    if (onRod) return { ...w, ra1: -24, ra2: -30, la1: -50, la2: -40, head: -6 } as Partial<Pose>;
    if (f >= SNATCH - 12) return { ra1: 88, ra2: 12, la1: -30, la2: 40, lean: -6, head: -4 } as Partial<Pose>;
    return { ra1: 30, ra2: 10, la1: -18, la2: 6, head: -2 } as Partial<Pose>;
  })();

  // the hook of the cane reaching for the phone, then holding it
  const reach = interpolate(f, [SNATCH - 8, SNATCH + 2], [0, 1], { ...clamp, easing: eo });
  const showCaneLine = f >= SNATCH - 8 && f < SLAP - 1;

  // family, last part
  const famK = (i: number) => interpolate(f, [PEOPLE - 8 + i * 5, PEOPLE + 6 + i * 5], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [LOOP0, LOOP0 + 12], [1, 0], { ...clamp, easing: ei });
  const FAM: { x: number; hair: "long" | "bald" | "cap"; glasses?: boolean }[] = [
    { x: 540, hair: "long" },
    { x: 680, hair: "bald", glasses: true },
    { x: 800, hair: "cap" },
  ];
  const veil = interpolate(f, [DROP, DROP + 14, PART - 2, PART + 2], [0, 0.34, 0.34, 0], clamp);
  const waveK = (i: number) => interpolate(f, [PEOPLE + 2 + i * 6, PEOPLE + 18 + i * 6], [0, 1], { ...clamp, easing: sio }) * (f < LOOP0 ? 1 : 0);
  const mouthG: [number, number] = [282, 868];

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Room />
        {/* the rolled sheet + its cord, in the room from the start */}
        <SketchLine x1={SHEET_X - 26} y1={ROLL_Y - 8} x2={SHEET_X + SHEET_W + 26} y2={ROLL_Y - 8} w={22} />
        <SketchLine x1={SHEET_X + SHEET_W + 8} y1={ROLL_Y} x2={SHEET_X + SHEET_W + 8} y2={interpolate(f, [ROLL0 - 6, ROLL0, ROLL0 + 6], [720, 756, 720], clamp)} w={4} />
        <circle cx={SHEET_X + SHEET_W + 8} cy={interpolate(f, [ROLL0 - 6, ROLL0, ROLL0 + 6], [720, 756, 720], clamp) + 8} r={10} fill={GRAPHITE} />
      </g>
      {veil > 0.005 && <rect x={-900} y={-900} width={3200} height={3300} fill={BAND} opacity={veil} />}
      {rollH > 2 && <rect x={SHEET_X} y={ROLL_Y} width={SHEET_W} height={Math.max(0, rollH)} fill="#fffdf6" />}
      {rollH > 2 && (
        <g filter="url(#pencil)">
          <Sheet f={f} h={rollH + 2} />
          <SketchLine x1={SHEET_X - 22} y1={rodY + 4} x2={SHEET_X + SHEET_W + 22} y2={rodY + 4} w={14} />
        </g>
      )}
      {/* family rises behind the sofa */}
      {f >= PEOPLE - 10 && f < LOOP0 + 14 && (
        <g clipPath="url(#famClip)">
          <clipPath id="famClip">
            <rect x={300} y={700} width={700} height={500} />
          </clipPath>
          {FAM.map((p, i) => {
            const g = 1660 - famK(i) * 240 + (f >= RECW ? Math.abs(Math.sin((f - RECW) * 0.3)) * 6 : 0);
            const pose = { ra1: 12, la1: -12 };
            const j = solve({ ...STAND, ...pose, x: p.x, y: g - 92.5 * 1.95 }, 1.95, -1);
            const R = j.headR * 1.22;
            return (
              <g key={i}>
                <circle cx={j.headC[0]} cy={j.headC[1] - (R - j.headR) * 0.8} r={R} fill="#fffaf0" />
                <g filter="url(#pencil)">
                  <Doodle x={p.x} ground={g} scale={1.95} facing={-1} hair={p.hair} glasses={p.glasses} face={f >= RECW ? "happy" : "plain"} pose={pose} />
                </g>
              </g>
            );
          })}
        </g>
      )}
      <SolidSofa />
      <g filter="url(#pencil)">
        <Sofa f={f} />
        {/* Mr. Trick, behind the cabinet until he jumps up */}
        {!onRod && (
          <MrTrick x={925} ground={mrG} scale={1.2} facing={-1} pose={mrPose} mood="sly" cane={f < SNATCH - 10 ? "none" : "none"}>
            {(j) =>
              showCaneLine ? (
                <g>
                  {(() => {
                    const tx = j.rHand[0] + (fromHand[0] - j.rHand[0]) * reach;
                    const ty = j.rHand[1] + (fromHand[1] - j.rHand[1]) * reach;
                    const hookX = f < SNATCH + 2 ? tx : px;
                    const hookY = f < SNATCH + 2 ? ty - 118 : py - 118 * ps;
                    return (
                      <g fill="none" stroke={GRAPHITE} strokeLinecap="round">
                        <line x1={j.rHand[0]} y1={j.rHand[1]} x2={hookX + 20} y2={hookY - 14} strokeWidth={7} />
                        <path d={`M ${hookX + 20} ${hookY - 14} q -4 -28 -26 -22 q -18 6 -10 30`} strokeWidth={7} />
                      </g>
                    );
                  })()}
                </g>
              ) : null
            }
          </MrTrick>
        )}
      </g>
      <rect x={CAB_X} y={CAB_TOP} width={220} height={270} fill={CREAM} />
      <g filter="url(#pencil)">
        <Cabinet />
      </g>
      {/* phone once it is off Spark's hand */}
      {f >= SNATCH + 2 && <Phone f={f} playing={f >= PART && f < LOOP0} x={px} y={py} s={ps * phoneBig} rot={pr} />}
      <g filter="url(#pencil)">
        {/* Mr. Trick on the rod with the eraser */}
        {onRod && (
          <MrTrick x={mrX} ground={mrG} scale={1.2} facing={-1} pose={mrPose} mood={mrMood} cane="none">
            {(j) =>
              eraserIn > 0.01 && (
                <g transform={`translate(${j.lHand[0] - 26} ${j.lHand[1] - 48}) scale(${eraserIn}) rotate(-12)`}>
                  <rect x={-58} y={-34} width={116} height={68} rx={10} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={6} />
                  <rect x={-14} y={-34} width={72} height={68} fill={GRAPHITE} />
                  <line x1={j.rHand[0] - j.lHand[0] + 26} y1={j.rHand[1] - j.lHand[1] + 48} x2={0} y2={30} stroke={GRAPHITE} strokeWidth={6} />
                </g>
              )
            }
          </MrTrick>
        )}
        {/* crumbs from the eraser */}
        {f >= ONLY &&
          f < PART + 26 &&
          Array.from({ length: 16 }, (_, i) => {
            const t0 = ONLY + i * 1.7;
            const d = f - t0;
            if (d < 0 || d > 26) return null;
            const x0 = 360 + ((t0 - ONLY) / (PART - 3 - ONLY)) * 335;
            const n = Math.sin(i * 37.1) * 26;
            return <rect key={i} x={x0 + n + d * (i % 2 ? 1.1 : -1.1)} y={740 + 0.5 * 0.62 * d * d} width={10} height={6} rx={2} fill={GRAPHITE} transform={`rotate(${i * 40} ${x0} ${740})`} opacity={interpolate(d, [18, 26], [1, 0], clamp)} />;
          })}
      </g>
      <ellipse cx={TABLE_X} cy={TABLE_TOP + 4} rx={116} ry={15} fill={CREAM} />
      <g filter="url(#pencil)">
        <Table />
      </g>
      {/* phone on the table, frame 0 and until he picks it up */}
      {f < SEND + 6 && <Phone f={f} playing={playing} x={PT[0]} y={PT[1]} rot={-7} />}
      {/* small bubble: the voice note he thinks is great */}
      {f >= SEND + 18 && f < PLAY - 4 && (
        <g transform={`translate(600 742) scale(${popIn(f, SEND + 20)})`} filter="url(#pencil)">
          <path d="M -178 -62 L 178 -62 L 178 58 L -40 58 L -96 104 L -92 58 L -178 58 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
          <Txt x={0} y={-12} s={46}>
            HI FAMILY,
          </Txt>
          <Txt x={0} y={38} s={46}>
            IT&apos;S ME!
          </Txt>
        </g>
      )}
      {/* the thin bubble: the same words, played back */}
      {f >= PLAYBACK + 2 && f < E(3) - 30 && (
        <g transform={`translate(${650 + Math.sin(f * 1.3) * 3} ${760 + Math.cos(f * 1.7) * 3})`} opacity={interpolate(f, [PLAYBACK + 2, PLAYBACK + 6], [0, 1], clamp)}>
          <rect x={-128} y={-52} width={256} height={124} rx={38} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={3} strokeDasharray="7 7" />
          <text x={0} y={0} textAnchor="middle" fontFamily={FONT.body} fontWeight={500} fontSize={44} fontStyle="italic" fill={GRAPHITE}>
            hi family,
          </text>
          <text x={0} y={46} textAnchor="middle" fontFamily={FONT.body} fontWeight={500} fontSize={44} fontStyle="italic" fill={GRAPHITE}>
            it&apos;s me...
          </text>
        </g>
      )}
      {/* orange air from his mouth to their ears */}
      {f >= PEOPLE && f < Q - 8 && (
        <g filter="url(#pencil)">
          {FAM.map((p, i) => (
            <Draw key={i} d={wave(mouthG, [mouthG[0] + 90, 930], [p.x - 150, 930 + i * 10], [p.x - 52, 1030], 9, 5 + i)} k={waveK(i)} w={8} />
          ))}
        </g>
      )}
      <Spark f={f} trails={false} scale={sNow} base={{ x: SX0, y: GROUND - 92.5 * sNow }} talk={(t) => (t > LOOP0 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={f >= REC ? 1 : 0.4} keys={sparkKeys} mod={sparkMod} facing={facing}>
        {(j) => <>{inHand && phoneHand(j)}</>}
      </Spark>
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6) + interpolate(f, [at - 2, at + 3], [0.4, 0], clamp) * -1;
  const top = (text: React.ReactNode, at: number, until: number) => (
    <div
      style={{
        position: "absolute",
        left: 30,
        right: 30,
        top: 150,
        textAlign: "center",
        fontFamily: FONT.title,
        fontWeight: 900,
        lineHeight: 1,
        fontSize: 124,
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
  const smallLine = f < PLAY
    ? ""
    : f < REC
      ? "We hear our own voice by air and through the head (Reinfeldt et al., 2010)."
      : f < OTHER
        ? "One main reason, not the only one (Reinfeldt et al., 2010)."
        : f < Q
          ? "Close to it: a phone microphone changes the sound a little."
          : "";
  const html = (
    <>
      <CaptionBand />
      {(f < C(1) + 2 || f >= LOOP1 - 8) && top(<>THAT IS <span style={{ color: ACCENT }}>YOU?</span></>, 0, f < 200 ? C(1) + 2 : VOICE_FRAMES + 20)}
      {f >= YOUW - 1 && f < ROLL0 + 1 && top(<>THAT IS <span style={{ color: ACCENT }}>YOU</span></>, YOUW, ROLL0 + 1)}
      {f >= PART - 1 && f < OTHER + 2 && top(<>ONLY <span style={{ color: ACCENT }}>AIR!</span></>, PART, OTHER + 2)}
      {f >= RECW - 1 && f < Q - 4 && top(<>SAME <span style={{ color: ACCENT }}>VOICE</span></>, RECW, Q - 4)}
      {f >= PLAY && smallLine && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1690, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>
      )}
      {f >= 300 && f < LOOP0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: BAND, background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 1</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={60} cues={VOICE_CUES} hi={["right", "last", "stranger,", "you.", "air,", "bones.", "only", "air", "other", "people", "hate"]} />
    </>
  );

  const hits = [PART, PART + 2, SLAP];
  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={hits} power={5} svg={svg} html={html} />;
};
