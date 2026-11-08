import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, walkCycle, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchLine, type Hair } from "../shared/doodle";
import { MrTrick, type TrickMood } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T34 · "Can you stop a song stuck in your head?" Spark Got Tricked #11 (STORY, pencil look, 29.6 s).
// ONE world, one camera rig: a morning street, a city bus cut open at its stop, right in front of an open-plan office.
// Pink music notes spin round Spark's head. Inside his head (a thought bubble) Mr. Trick turns the crank of a tiny music box:
// he keeps the song playing. Spark carries the song from the bus to his desk; covering his ears does nothing. Most of his
// co-workers have a song too (survey: most people, every week). A co-worker tosses him a stick of gum, he chews, the crank
// slows and the notes drop to the floor one by one: in lab tests gum made the song come back less (Beaman et al. 2015).
// One note keeps turning slowly (less, not gone), and the tests were small and quick (facts.md).

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const eo = Easing.out(Easing.cubic);
const ein = Easing.in(Easing.quad);

const ACCENT = "#e5488f"; // bubble-gum pink: the song's notes and the gum that slows them
const SKY = "#dde8ec";
const WALL = "#e9e1cf";
const CREAM = "#fffdf6";
const FLOOR = 1440;
const S = 2.4;
const SPY = FLOOR - 92.5 * S;

// --- timing (anchored to spoken words) --------------------------------------------------------------------------------
const BUBBLE = E(0) + 8; // the thought bubble opens: Mr. Trick and his music box
const PROMISE = C(1);
const SONG = W(2, 3); // "song,": the bus speaker plays
const STOP = E(2) - 6; // the bus has stopped
const WALK0 = E(2) + 2; // he steps off the bus
const WALK1 = W(3, 4) + 4; // at his desk ("music")
const EARS = W(3, 6); // "still": covers his ears
const WIDE0 = E(3) + 10; // camera out to the whole office
const MOST = W(4, 4); // "most"
const PEOPLE = [MOST, W(4, 5), W(4, 6), W(4, 7)]; // co-workers' notes pop, one per word
const DROP = E(4) + 4; // pause: lights + music drop, camera in
const TURN = C(5) + 8; // "In lab tests,": he turns to the co-worker
const THROW = W(5, 2) + 2; // she throws the gum
const CATCH = W(5, 4) - 2; // "gum": in his mouth

const FALL0 = W(5, 7); // "music": notes start to fall
const HIT = W(5, 10); // "less!"
export { HIT };
const CAV = C(6);
const Q = C(7);
const RISE = E(7) - 6; // the notes rise again for the loop
const LOOPTXT = VOICE_FRAMES - 22;

// --- where Spark stands --------------------------------------------------------------------------------------------------
const SXB = 640; // on the bus
const SXO = 1720; // at his desk
const sparkX = (f: number) => interpolate(f, [WALK0, WALK1], [SXB, SXO], { ...clamp, easing: Easing.inOut(Easing.sin) });
const walking = (f: number) => f > WALK0 + 2 && f < WALK1 - 2;
const facingAt = (f: number) => (f >= TURN && f < Q - 6 ? -1 : 1);

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [668, 1010, 1.85];
const BUS: V3 = [670, 1075, 1.3];
const OFFICE: V3 = [1690, 1075, 1.3];
const WIDE: V3 = [2140, 660, 0.6];
const GUM: V3 = [1700, 1075, 1.12];
const QCU: V3 = [1745, 1000, 1.75];
const F0B: V3 = [1748, 1010, 1.85];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 2, E(0) + 24, BUS), // pull back: the bus, the speaker, the bubble
  k(WALK0 - 4, WALK1 + 4, OFFICE), // follows him off the bus to his desk (the narration says "At the office")
  k(WIDE0, WIDE0 + 22, WIDE), // out to the whole office before "In a big survey"
  k(DROP, DROP + 22, GUM), // the pause: in on Spark and the co-worker, arrives before the line
  k(Q - 16, Q + 6, QCU), // the question: his face
  k(RISE - 4, VOICE_FRAMES, F0B), // the loop: frame 0's close-up
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

// --- a music note (♪): head + stem + flag ---------------------------------------------------------------------------------
const NoteGlyph: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number; color?: string; two?: boolean }> = ({ x, y, s = 1, rot = 0, o = 1, color = ACCENT, two }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <ellipse cx={-9} cy={14} rx={13} ry={10} transform="rotate(-20 -9 14)" fill={color} stroke={GRAPHITE} strokeWidth={3.5} />
    <line x1={3} y1={12} x2={3} y2={-30} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />
    {two ? (
      <g>
        <ellipse cx={25} cy={8} rx={13} ry={10} transform="rotate(-20 25 8)" fill={color} stroke={GRAPHITE} strokeWidth={3.5} />
        <line x1={37} y1={6} x2={37} y2={-36} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />
        <path d="M 3 -30 L 37 -36 L 37 -26 L 3 -20 Z" fill={GRAPHITE} />
      </g>
    ) : (
      <path d="M 3 -30 q 18 6 16 26 q -4 -12 -16 -14" fill={GRAPHITE} stroke={GRAPHITE} strokeWidth={2} />
    )}
  </g>
);

// --- the world: sky, street, the office building, the bus ---------------------------------------------------------------
const OX0 = 1150; // office front
const OX1 = 3420;
const OTOP = 560; // office ceiling
const Street: React.FC = () => (
  <g>
    <rect x={-3000} y={-3200} width={9000} height={3200 + FLOOR} fill={SKY} />
    {/* far skyline */}
    {[-700, -380, -60, 260, 3500, 3820].map((x, i) => (
      <g key={x}>
        <rect x={x} y={-300 - (i % 3) * 260} width={260} height={1800} fill="#cdd6d8" stroke={GRAPHITE} strokeWidth={6} />
        {Array.from({ length: 6 }, (_, r) => (
          <rect key={r} x={x + 50} y={-220 - (i % 3) * 260 + r * 160} width={60} height={80} fill="#b9c4c7" />
        ))}
      </g>
    ))}
    {/* morning sun */}
    <circle cx={-200} cy={-1500} r={150} fill="#fbe7a8" stroke={GRAPHITE} strokeWidth={8} />
    {/* the pavement + road */}
    <rect x={-3000} y={FLOOR} width={9000} height={1600} fill="#8f8b85" />
    <Hatch x={-3000} y={FLOOR + 10} w={9000} h={300} gap={30} color="#333" o={0.22} />
  </g>
);

const Building: React.FC = () => (
  <g>
    {/* upper floors over the office */}
    <rect x={OX0 - 40} y={-1250} width={OX1 - OX0 + 80} height={OTOP + 1250} fill={PAPER2} stroke={GRAPHITE} strokeWidth={10} />
    <Hatch x={OX0 - 30} y={-1240} w={OX1 - OX0 + 60} h={OTOP + 1230} gap={40} o={0.12} width={3} />
    {Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 7 }, (_, c) => (
        <rect key={`${r}${c}`} x={OX0 + 80 + c * 320} y={-1100 + r * 400} width={180} height={230} fill="#c8d5da" stroke={GRAPHITE} strokeWidth={6} />
      )),
    )}
    <rect x={OX0 + 700} y={OTOP - 150} width={700} height={100} fill={PAPER} stroke={GRAPHITE} strokeWidth={7} />
    <text x={OX0 + 1050} y={OTOP - 82} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={60} fill={GRAPHITE}>
      OFFICE
    </text>
    {/* the office: cut open, back wall + floor */}
    <rect x={OX0} y={OTOP} width={OX1 - OX0} height={FLOOR - OTOP} fill={WALL} stroke={GRAPHITE} strokeWidth={8} />
    <Hatch x={OX0} y={FLOOR - 60} w={OX1 - OX0} h={60} gap={22} o={0.18} />
    {/* back windows: the morning light */}
    {[OX0 + 120, OX0 + 760, OX0 + 1400, OX0 + 2000].map((x) => (
      <g key={x}>
        <rect x={x} y={OTOP + 110} width={300} height={330} fill="#eef4f2" stroke={GRAPHITE} strokeWidth={7} />
        <line x1={x + 150} y1={OTOP + 110} x2={x + 150} y2={OTOP + 440} stroke={GRAPHITE} strokeWidth={5} />
      </g>
    ))}
    {/* a wall clock: morning */}
    <g transform={`translate(${OX0 + 290} ${OTOP + 190})`}>
      <circle r={52} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      <line x1={0} y1={0} x2={0} y2={-34} stroke={GRAPHITE} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={24} y2={8} stroke={GRAPHITE} strokeWidth={7} strokeLinecap="round" />
    </g>
    {/* a plant by the door */}
    <rect x={OX0 + 30} y={FLOOR - 120} width={90} height={120} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    {[-40, -10, 20, 50].map((a, i) => (
      <path key={i} d={`M ${OX0 + 75} ${FLOOR - 120} q ${a} -90 ${a * 1.6} -170`} stroke={GRAPHITE} strokeWidth={8} fill="none" strokeLinecap="round" />
    ))}
    {/* bus stop sign on the pavement */}
    <line x1={1100} y1={FLOOR} x2={1100} y2={FLOOR - 470} stroke={GRAPHITE} strokeWidth={9} />
    <circle cx={1100} cy={FLOOR - 510} r={52} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />
    <text x={1100} y={FLOOR - 494} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={44} fill={GRAPHITE}>
      BUS
    </text>
  </g>
);

// a standing desk with a laptop; light comes from the back windows
const Desk: React.FC<{ x0: number; w?: number; top?: number; screen?: boolean }> = ({ x0, w = 300, top = 1200, screen = true }) => (
  <g>
    <ellipse cx={x0 + w / 2} cy={FLOOR + 4} rx={w / 2 + 20} ry={9} fill={GRAPHITE} opacity={0.22} />
    <rect x={x0 + 20} y={top + 24} width={18} height={FLOOR - top - 24} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <rect x={x0 + w - 38} y={top + 24} width={18} height={FLOOR - top - 24} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <rect x={x0} y={top} width={w} height={26} rx={6} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
    {screen && (
      <g>
        <path d={`M ${x0 + w * 0.32} ${top} L ${x0 + w * 0.36} ${top - 120} L ${x0 + w * 0.78} ${top - 120} L ${x0 + w * 0.74} ${top} Z`} fill="#d7e4ea" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
        <rect x={x0 + w * 0.26} y={top - 8} width={w * 0.56} height={10} rx={4} fill={PAPER2} stroke={GRAPHITE} strokeWidth={4} />
      </g>
    )}
  </g>
);

// the city bus, cut open at its stop: back wall with windows (the street scrolls past until it stops), poles, a ceiling speaker
const BX0 = -300;
const BX1 = 1050;
const BTOP = 640;
const SPEAKER: [number, number] = [380, BTOP + 50];
const busScroll = (f: number) => {
  // integral of the speed: constant part + the slowing part
  const a = STOP - 40;
  if (f <= a) return f * 9;
  const t = Math.min(f, STOP) - a;
  return a * 9 + 9 * t - (9 * t * t) / 80; // speed falls from 9 to 0 over 40 frames
};
const Bus: React.FC<{ f: number }> = ({ f }) => {
  const bob = f < STOP ? Math.sin(f * 0.5) * 2.5 : 0;
  const scroll = busScroll(f);
  return (
    <g transform={`translate(0 ${bob})`}>
      <defs>
        <clipPath id="t34win">
          {[BX0 + 120, BX0 + 470, BX0 + 820, BX0 + 1170].map((x) => (
            <rect key={x} x={x} y={BTOP + 120} width={260} height={220} />
          ))}
        </clipPath>
      </defs>
      {/* wheels (half hidden below the floor line) */}
      {[BX0 + 230, BX1 - 220].map((x) => (
        <g key={x} transform={`translate(${x} ${FLOOR + 20}) rotate(${-scroll * 0.6})`}>
          <circle r={70} fill={GRAPHITE} />
          <circle r={30} fill={PAPER2} />
          <line x1={-30} y1={0} x2={30} y2={0} stroke={GRAPHITE} strokeWidth={6} />
        </g>
      ))}
      <rect x={BX0} y={BTOP - 40} width={BX1 - BX0} height={FLOOR - BTOP + 40} rx={36} fill="#e9d9a9" stroke={GRAPHITE} strokeWidth={10} />
      <rect x={BX0 + 20} y={BTOP} width={BX1 - BX0 - 40} height={FLOOR - BTOP} fill="#efe6cc" />
      <Hatch x={BX0 + 20} y={FLOOR - 50} w={BX1 - BX0 - 40} h={50} gap={20} o={0.2} />
      {/* windows with the street going past */}
      <rect x={BX0} y={BTOP + 110} width={BX1 - BX0} height={240} fill={SKY} />
      <g clipPath="url(#t34win)">
        {Array.from({ length: 14 }, (_, i) => {
          const x = (((i * 300 - scroll) % 4200) + 4200) % 4200 - 600;
          const h = 120 + ((i * 53) % 90);
          return (
            <g key={i}>
              <rect x={x} y={BTOP + 340 - h} width={180} height={h} fill="#cdd6d8" stroke={GRAPHITE} strokeWidth={5} />
              <circle cx={x + 250} cy={BTOP + 290} r={40} fill="#b9c8b4" stroke={GRAPHITE} strokeWidth={5} />
            </g>
          );
        })}
      </g>
      {[BX0 + 120, BX0 + 470, BX0 + 820, BX0 + 1170].map((x) => (
        <rect key={x} x={x} y={BTOP + 120} width={260} height={220} fill="none" stroke={GRAPHITE} strokeWidth={7} />
      ))}
      {/* seats along the back wall */}
      {[BX0 + 80, BX0 + 900].map((x) => (
        <g key={x}>
          <rect x={x} y={FLOOR - 220} width={200} height={40} rx={10} fill="#c5b7d6" stroke={GRAPHITE} strokeWidth={6} />
          <rect x={x + 10} y={FLOOR - 380} width={40} height={170} rx={10} fill="#c5b7d6" stroke={GRAPHITE} strokeWidth={6} />
          <line x1={x + 30} y1={FLOOR - 180} x2={x + 30} y2={FLOOR} stroke={GRAPHITE} strokeWidth={7} />
          <line x1={x + 170} y1={FLOOR - 180} x2={x + 170} y2={FLOOR} stroke={GRAPHITE} strokeWidth={7} />
        </g>
      ))}
      {/* poles + ceiling rail */}
      <line x1={BX0 + 40} y1={BTOP + 40} x2={BX1 - 40} y2={BTOP + 40} stroke={GRAPHITE} strokeWidth={9} />
      {[BX0 + 380, 980].map((x) => (
        <line key={x} x1={x} y1={BTOP + 40} x2={x} y2={FLOOR} stroke={GRAPHITE} strokeWidth={10} />
      ))}
      {/* the open door at the front end */}
      <rect x={BX1 - 50} y={BTOP + 40} width={50} height={FLOOR - BTOP - 40} fill={SKY} stroke={GRAPHITE} strokeWidth={6} opacity={interpolate(f, [STOP - 4, STOP + 6], [0, 1], clamp)} />
    </g>
  );
};

// the bus speaker: pulses while the song plays
const Speaker: React.FC<{ f: number }> = ({ f }) => {
  const on = f >= SONG - 4 && f < WALK0 + 20;
  const pulse = on ? 1 + 0.08 * Math.max(0, Math.sin(f * 0.9)) : 1;
  return (
    <g transform={`translate(${SPEAKER[0]} ${SPEAKER[1]}) scale(${pulse})`}>
      <rect x={-70} y={-30} width={140} height={60} rx={14} fill={CREAM} stroke={GRAPHITE} strokeWidth={7} />
      {[-40, -20, 0, 20, 40].map((x) => (
        <line key={x} x1={x} y1={-16} x2={x} y2={16} stroke={GRAPHITE} strokeWidth={5} strokeLinecap="round" />
      ))}
      {on &&
        [0, 1].map((i) => {
          const r = ((f - SONG + i * 10) % 20) * 3 + 50;
          return <path key={i} d={`M ${-r} ${30 + r * 0.3} q ${r} ${r * 0.7} ${r * 2} 0`} stroke={ACCENT} strokeWidth={6} fill="none" opacity={0.7 - (r - 50) / 90} />;
        })}
    </g>
  );
};

// --- people: two on the bus, five co-workers in the office ---------------------------------------------------------------
type Person = { x: number; hair: Hair; glasses?: boolean; facing: number; note: number | null; desk?: number; face?: "plain" | "happy" | "bored" };
const BUSFOLK: Person[] = [
  { x: BX0 + 150, hair: "long", facing: 1, note: null, face: "bored" },
  { x: 1000 - 90, hair: "cap", glasses: true, facing: -1, note: null, face: "plain" },
];
const GIVER = 1360;
const OFFICEFOLK: Person[] = [
  { x: GIVER, hair: "bun", facing: 1, note: PEOPLE[0], desk: 1180, face: "plain" },
  { x: 2250, hair: "short", glasses: true, facing: 1, note: PEOPLE[1], desk: 2320, face: "plain" },
  { x: 2510, hair: "bald", facing: 1, note: PEOPLE[2], desk: 2580, face: "plain" },
  { x: 2770, hair: "curly", facing: 1, note: null, desk: 2840, face: "happy" },
  { x: 3150, hair: "long", glasses: true, facing: -1, note: PEOPLE[3], desk: 2960, face: "plain" },
];
const DS = 2.1;
const headOf = (x: number, facing: number, pose: Partial<Pose> = {}): [number, number] => {
  const j = solve({ ...STAND, ...pose, x, y: FLOOR - 92.5 * DS }, DS, facing);
  return [j.headC[0], j.headC[1] - 6];
};

// co-worker poses: typing, and the one who throws the gum
const giverPose = (f: number): Partial<Pose> => {
  const wind = interpolate(f, [THROW - 10, THROW - 2], [0, 1], { ...clamp, easing: eo });
  const fling = interpolate(f, [THROW - 2, THROW + 4], [0, 1], { ...clamp, easing: eoB });
  const back = interpolate(f, [THROW + 24, THROW + 40], [0, 1], { ...clamp, easing: eio });
  const typing = Math.sin(f * 0.8) * 6;
  const ra1 = 70 + typing + (wind * 70 - fling * 40 - wind * 70) * (1 - back) + fling * (1 - back) * 100;
  return { ra1, ra2: wind > 0 && fling < 1 ? -60 * wind : 50 - fling * 40 * (1 - back), la1: -70 - typing, la2: 50, lean: 4 - fling * 8 * (1 - back), head: -4 };
};
const typePose = (f: number, seed: number): Partial<Pose> => ({ ra1: 68 + Math.sin(f * 0.7 + seed) * 6, ra2: 55, la1: -68 - Math.sin(f * 0.7 + seed + 1.5) * 6, la2: 55, lean: 4, head: 6 });
const GIVER_HAND = (f: number): [number, number] => {
  const j = solve({ ...STAND, ...giverPose(f), x: GIVER, y: FLOOR - 92.5 * DS }, DS, 1);
  return [j.rHand[0], j.rHand[1]];
};

// notes that spin round a head
const N = 6;
const orbit = (cx: number, cy: number, i: number, ang: number, rx = 175, ry = 46) => {
  const a = ang + (i * Math.PI * 2) / N;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry - 8 * Math.sin(a * 2), front: Math.sin(a) > 0, a };
};
// spin angle: fast while the song plays, slows after the gum, picks up again for the loop
const spinSpeed = (f: number) => interpolate(f, [CATCH, HIT + 4, CAV + 30, RISE - 30, RISE + 10], [0.085, 0.018, 0.018, 0.04, 0.085], clamp);
const SPIN = (() => {
  const arr: number[] = [0];
  for (let i = 1; i <= VOICE_FRAMES + 40; i++) arr.push(arr[i - 1] + spinSpeed(i));
  return arr;
})();
const spinAt = (f: number) => SPIN[Math.max(0, Math.min(SPIN.length - 1, Math.floor(f)))];
const FALL = [0, 1, 2, 3, 4].map((i) => FALL0 + i * 6); // five of six notes drop; one keeps turning slowly
const LIFT = [0, 1, 2, 3, 4].map((i) => RISE - 18 + i * 5); // they lift back up into frame 0

export const S01_SFX: SfxCue[] = [
  [6, "swish", 0.25],
  [16, "swish", 0.22],
  [E(0) + 2, "whoosh", 0.3],
  [BUBBLE, "pop", 0.35],
  [PROMISE + 4, "pop", 0.2],
  [SONG, "ding", 0.25],
  [STOP - 10, "swirl", 0.18],
  [STOP + 2, "clink", 0.2],
  [WALK0 - 2, "whoosh_long", 0.24],
  [EARS, "thud", 0.18],
  [WIDE0, "whoosh", 0.28],
  ...PEOPLE.map((p, i) => [p + 2, "pop", 0.2 + i * 0.03] as SfxCue),
  [DROP, "freeze", 0.2],
  [DROP + 2, "whoosh", 0.22],
  [THROW, "swish", 0.45],
  [CATCH + 1, "pop", 0.45],
  ...FALL.map((t, i) => [t + 14, "tick", 0.3 + i * 0.04] as SfxCue),
  [HIT, "impact", 0.75],
  [HIT + 1, "stinger", 0.38],
  [Q - 16, "whoosh", 0.26],
  [RISE - 18, "riser", 0.2],
];

const SWAT_A: Partial<Pose> = { ra1: 150, ra2: 40, la1: -40, la2: -30, head: -6 };
const SWAT_B: Partial<Pose> = { ra1: 120, ra2: -40, la1: -60, la2: -20, head: 6 };

export const S01Song: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);

  const sparkKeys = gestureKeys([
    [0, SWAT_A],
    [7, SWAT_B, "snap"],
    [14, SWAT_A, "snap"],
    [21, SWAT_B, "snap"],
    [28, SWAT_A, "snap"],
    [W(0, 6), { ...G.mindBlown }, "snap"], // "stuck": hands at his head
    [E(0) + 4, { ...G.handsHips, head: 6 }, "snap"],
    [PROMISE - 2, { ...G.pointUp, head: -10 }, "snap"], // "Wait until the last part": points at the bubble
    [E(1) + 4, { ...G.armsCrossed }, "snap"],
    [C(2) - 2, { ...G.leanIn, head: -14 }, "snap"], // listens to the speaker
    [SONG + 6, { ...G.present, head: -6 }, "snap"],
    [WALK0, { ...G.rest }, "smooth"],
    [WALK1, { ...G.pointDown }, "snap"], // at his desk
    [EARS - 2, { ...G.mindBlown, head: 4 }, "snap"], // covers his ears: it does not help
    [C(4) - 2, { ...G.armsCrossed, head: 4 }, "snap"],
    [MOST - 2, { ...G.pointSide, head: -2 }, "snap"], // points at the co-workers
    [W(4, 8), { ...G.shrugBig }, "snap"], // "every week"
    [DROP + 2, { ...G.rest, lean: 10, head: 16 }, "smooth"], // slumps
    [C(5), { ...G.thinkChin }, "snap"],
    [TURN + 6, { ...G.rest, head: -4 }, "snap"], // turns to her
    [CATCH - 6, { ...G.recoil }, "snap"], // the gum flies in
    [CATCH + 6, { ...G.handsHips }, "snap"], // chewing
    [FALL0, { ...G.pointDown, head: 18 }, "snap"], // watches the notes fall
    [HIT - 2, { ...G.mindBlown }, "snap"],
    [HIT + 30, { ...G.celebrate, head: -6 }, "snap"],
    [CAV - 2, { ...G.thinkChin, head: 6 }, "snap"],
    [W(6, 4), { ...G.present }, "snap"], // "small,"
    [W(6, 6), { ...G.shrugBig, head: 8 }, "snap"], // "quick."
    [Q - 4, { ...G.doublePoint, head: 2 }, "snap"],
    [W(7, 4), { ...G.doublePoint, ra1: 108, la1: 78, head: 6 }, "snap"],
    [RISE, { ...G.recoil }, "snap"],
    [VOICE_FRAMES - 10, SWAT_A, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(q, shake(t, E(0) + 6, 2));
    q = addPose(q, nod(t, SONG + 8, 3)); // bobs to the song
    q = addPose(q, shake(t, EARS + 8, 3));
    q = addPose(q, nod(t, CATCH + 6, 3)); // chewing nods
    if (walking(t)) q = addPose(q, walkCycle(t, 0.42));
    return { ...q, x: sparkX(t), y: SPY + (walking(t) ? -Math.abs(Math.sin(t * 0.42)) * 6 : 0) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [W(0, 6), "worried"],
      [E(0) + 4, "angry"],
      [PROMISE - 2, "determined"],
      [E(1) + 4, "smug"],
      [C(2) - 2, "curious"],
      [SONG + 6, "happy"],
      [WALK1, "neutral"],
      [W(3, 4), "worried"],
      [C(4) - 2, "skeptical"],
      [MOST - 2, "curious"],
      [W(4, 8), "shock"],
      [DROP + 2, "sad"],
      [C(5), "thinking"],
      [TURN + 6, "curious"],
      [CATCH - 6, "shock"],
      [CATCH + 6, "determined"],
      [FALL0, "curious"],
      [HIT - 2, "mindblown"],
      [HIT + 30, "excited"],
      [CAV - 2, "skeptical"],
      [W(6, 6), "thinking"],
      [Q - 4, "happy"],
      [W(7, 4), "wink"],
      [RISE, "worried"],
      [VOICE_FRAMES - 10, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // the bulb flickers while the song has him, and lights when the gum works
  const bulb = (t: number) => {
    if (t >= HIT && t < CAV + 40) return interpolate(t, [HIT, HIT + 3], [0.5, 1], clamp);
    if (t < HIT) {
      const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
      return n > 0.66 ? 0.4 : 0.06;
    }
    if (t >= RISE) return 0.3;
    return 0;
  };
  // the mouth: talking, wide open for the gum, chewing after it
  const chewing = (t: number) => t >= CATCH && t < Q - 6;
  const talk = (t: number) => {
    if (t >= CATCH - 8 && t < CATCH) return 1;
    const m = mouthAt(t);
    return chewing(t) ? Math.max(m, 0.18 + 0.22 * Math.max(0, Math.sin(t * 0.55))) : m;
  };

  // Mr. Trick in the bubble: cranks, tips his hat, cranks faster, slows to a stop and looks surprised, starts again
  const crankSpeed = (t: number) => interpolate(t, [BUBBLE, BUBBLE + 10, CATCH, HIT, CAV + 30, RISE - 20, RISE], [0, 0.18, 0.18, 0.0, 0.0, 0.06, 0.2], clamp);
  const CRANK = (() => {
    let a = 0;
    for (let i = 0; i <= f; i++) a += crankSpeed(i);
    return a;
  })();
  const tipHat = f >= PROMISE + 2 && f < E(1) + 6;
  const tMood: TrickMood = f >= HIT - 10 && f < CAV + 30 ? "surprised" : (f >= EARS && f < DROP) || f >= RISE - 20 ? "smug" : "sly";
  const bubbleIn = interpolate(f, [BUBBLE, BUBBLE + 14], [0, 1], { ...clamp, easing: eoB });

  const dim = interpolate(f, [DROP, DROP + 8, C(5) + 4, C(5) + 14], [0, 0.22, 0.22, 0], clamp);
  const noteGlow = (t0: number) => interpolate(f, [t0, t0 + 8], [0, 1], { ...clamp, easing: eoB });
  const fadeOffice = interpolate(f, [DROP - 4, DROP + 10], [1, 0], clamp);

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Street />
        <Building />
        {OFFICEFOLK.map((p) => p.desk !== undefined && <Desk key={p.x} x0={p.desk} w={p.x === GIVER ? 150 : 170} top={1230} screen={p.x !== GIVER} />)}
        {/* Spark's own desk */}
        <Desk x0={1830} w={300} top={1215} />
        {/* a small gum pack on her desk */}
        <rect x={1215} y={1200} width={70} height={30} rx={6} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
        {OFFICEFOLK.map((p, i) => (
          <Doodle
            key={p.x}
            x={p.x}
            ground={FLOOR}
            scale={DS}
            facing={p.x === GIVER && f >= THROW - 14 && f < THROW + 40 ? 1 : p.facing}
            hair={p.hair}
            glasses={p.glasses}
            face={p.x === GIVER && f >= THROW - 12 ? "happy" : p.face}
            pose={p.x === GIVER ? giverPose(f) : typePose(f, i)}
          />
        ))}
        <Bus f={f} />
        <Speaker f={f} />
        {BUSFOLK.map((p, i) => (
          <Doodle key={p.x} x={p.x} ground={FLOOR} scale={DS} facing={p.facing} hair={p.hair} glasses={p.glasses} face={p.face} pose={i === 0 ? { ra1: 160, ra2: 10, la1: -10, la2: 10 } : { ra1: 60, ra2: 90, la1: -20, la2: 30, head: 14 }} />
        ))}
      </g>
      {/* co-workers' songs: a note pops over most heads, one per spoken word ("most people had this,") */}
      {OFFICEFOLK.map((p, i) => {
        if (p.note === null || f < p.note) return null;
        const [hx, hy] = headOf(p.x, p.facing, p.x === GIVER ? giverPose(f) : typePose(f, i));
        const s = noteGlow(p.note) * fadeOffice;
        if (s <= 0.01) return null;
        return (
          <g key={p.x}>
            {[0, 1].map((n) => {
              const o = orbit(hx, hy - 95, n * 3, spinAt(f) * 0.9 + i, 95, 26);
              return <NoteGlyph key={n} x={o.x} y={o.y} s={1.6 * s} rot={Math.sin(f / 6 + n) * 12} two={n === 1} />;
            })}
          </g>
        );
      })}
      <rect x={-4000} y={-4000} width={9000} height={9000} fill="#2a2620" opacity={dim} />
      <Spark f={f} trails={false} scale={S} facing={facingAt} base={{ x: SXB, y: SPY }} talk={talk} bulb={bulb} mood={mood} look={f >= C(2) - 2 && f < SONG + 6 ? -0.8 : f >= MOST - 2 && f < DROP ? 0.8 : 0.3} keys={sparkKeys} mod={sparkMod}>
        {(j: Joints) => {
          const [hx, hy] = j.headC;
          const R = j.headR;
          const ocx = hx;
          const ocy = hy - R * 1.9;
          const ang = spinAt(f);
          // thought bubble, up and to the right of his head
          const bx = hx + 170;
          const by = hy - 380;
          const crankA = CRANK;
          const boxX = bx + 60;
          const boxY = by + 50;
          const handle: [number, number] = [boxX - 52 + Math.cos(crankA) * 30, boxY + 2 + Math.sin(crankA) * 30];
          const trickHand = (jj: Joints) => jj.rHand;
          // the mouth (for the gum)
          const fc = facingAt(f);
          const mouth: [number, number] = [hx + fc * R * 0.45, hy + R * 0.45];
          const gumT = interpolate(f, [THROW + 2, CATCH], [0, 1], clamp);
          const gh = GIVER_HAND(THROW + 2);
          const gx = gh[0] + (mouth[0] - gh[0]) * gumT;
          const gy = gh[1] + (mouth[1] - gh[1]) * gumT - Math.sin(gumT * Math.PI) * 220;
          return (
            <g>
              {/* the song's notes round his head (back half first, a little smaller) */}
              {Array.from({ length: N }, (_, i) => {
                const o = orbit(ocx, ocy, i, ang);
                const fallAt = i < 5 ? FALL[i] : Infinity;
                const liftAt = i < 5 ? LIFT[i] : Infinity;
                const fallen = f >= fallAt && f < liftAt;
                const rising = f >= liftAt;
                if (fallen) {
                  // drop to the floor (gravity), small bounce, lie still
                  const o0 = orbit(ocx, ocy, i, spinAt(fallAt));
                  const t = f - fallAt;
                  const fy = FLOOR - 26;
                  const y = t < 14 ? interpolate(t, [0, 14], [o0.y, fy], { ...clamp, easing: ein }) : fy - Math.max(0, Math.sin(((t - 14) / 8) * Math.PI)) * (t < 22 ? 26 : 0);
                  const x = o0.x + (o0.x - ocx) * 0.7 * Math.min(1, t / 14);
                  const rot = interpolate(t, [0, 14], [0, 70 + i * 12], clamp);
                  return <NoteGlyph key={i} x={x} y={y} s={1.7} rot={rot} />;
                }
                if (rising) {
                  const p = interpolate(f, [liftAt, liftAt + 16], [0, 1], { ...clamp, easing: eio });
                  const o0 = orbit(ocx, ocy, i, spinAt(FALL[i]));
                  const sx = o0.x + (o0.x - ocx) * 0.7;
                  const x = sx + (o.x - sx) * p;
                  const y = FLOOR - 26 + (o.y - FLOOR + 26) * p - Math.sin(p * Math.PI) * 60;
                  return <NoteGlyph key={i} x={x} y={y} s={1.5 * (o.front ? 1 : 0.85)} rot={(1 - p) * (70 + i * 12)} />;
                }
                return <NoteGlyph key={i} x={o.x} y={o.y} s={1.5 * (o.front ? 1 : 0.82)} o={o.front ? 1 : 0.8} rot={Math.sin(f / 5 + i) * 14} two={i % 3 === 1} />;
              })}
              {/* the bus speaker's notes fly to his ear */}
              {[0, 1, 2].map((i) => {
                const t0 = SONG + 2 + i * 10;
                const p = interpolate(f, [t0, t0 + 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
                if (p <= 0 || p >= 1) return null;
                const x = SPEAKER[0] + (hx - SPEAKER[0]) * p;
                const y = SPEAKER[1] + 40 + (hy - SPEAKER[1] - 40) * p - Math.sin(p * Math.PI) * 80;
                return <NoteGlyph key={i} x={x} y={y} s={1.3 * (1 - p * 0.4)} rot={p * 40} />;
              })}
              {/* the gum: a pink stick in an arc from her hand into his mouth */}
              {gumT > 0 && gumT < 1 && (
                <g transform={`translate(${gx} ${gy}) rotate(${gumT * 540})`}>
                  <rect x={-24} y={-9} width={48} height={18} rx={4} fill={ACCENT} stroke={GRAPHITE} strokeWidth={4} />
                </g>
              )}
              {/* the thought bubble: inside his head, Mr. Trick keeps the song playing */}
              {bubbleIn > 0 && (
                <g transform={`translate(${bx} ${by}) scale(${bubbleIn}) translate(${-bx} ${-by})`}>
                  <g filter="url(#pencil)">
                    <circle cx={hx + 60} cy={hy - 130} r={13} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
                    <circle cx={hx + 95} cy={hy - 190} r={22} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
                    <ellipse cx={bx} cy={by} rx={200} ry={140} fill={CREAM} stroke={GRAPHITE} strokeWidth={8} />
                    {/* the music box: a pink box with a crank on its side */}
                    <rect x={boxX - 40} y={boxY - 40} width={110} height={78} rx={8} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} />
                    <rect x={boxX - 40} y={boxY - 52} width={110} height={16} rx={5} fill="#f6a8c9" stroke={GRAPHITE} strokeWidth={5} />
                    <circle cx={boxX - 52} cy={boxY + 2} r={7} fill={GRAPHITE} />
                    <MrTrick
                      x={bx - 95}
                      ground={by + 112}
                      scale={1.0}
                      facing={1}
                      cane="none"
                      mood={tMood}
                      pose={
                        tipHat
                          ? { ra1: 165, ra2: 70, la1: -20, la2: 20, head: -4 }
                          : { ra1: 70 + Math.sin(crankA) * 22, ra2: 20 + Math.cos(crankA) * 18, la1: -30, la2: 20, lean: 6, head: f >= HIT - 10 && f < CAV + 30 ? -8 : 4 }
                      }
                    >
                      {(jj: Joints) =>
                        tipHat ? null : (
                          <path d={`M ${boxX - 52} ${boxY + 2} L ${handle[0]} ${handle[1]} L ${trickHand(jj)[0]} ${trickHand(jj)[1]}`} stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        )
                      }
                    </MrTrick>
                  </g>
                  {/* little notes come out of the box while it plays */}
                  {crankSpeed(f) > 0.03 &&
                    [0, 1].map((i) => {
                      const ph = ((f * 1.2 + i * 18) % 36) / 36;
                      return <NoteGlyph key={i} x={boxX + 20 + ph * 50} y={boxY - 60 - ph * 50} s={0.75} o={1 - ph} rot={ph * 30} />;
                    })}
                </g>
              )}
            </g>
          );
        }}
      </Spark>
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
  const hook = <>STUCK IN YOUR <span style={{ color: ACCENT }}>HEAD</span></>;
  const smallLine =
    f >= MOST && f < DROP + 4
      ? "Online survey of 12,519 people in Finland (Liikkanen 2012): 89% said a song got stuck at least once a week."
      : f >= THROW && f < Q
        ? "Beaman et al. 2015: 3 small lab tests, 98 students, 2 to 3 minutes each, one song per test. People counted the song themselves. Not a cure."
        : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hook, -20, PROMISE - 6)}
      {f >= LOOPTXT && top(hook, LOOPTXT, VOICE_FRAMES + 200)}
      {f >= W(3, 6) && f < E(3) + 10 && top(<>STILL <span style={{ color: ACCENT }}>PLAYING</span></>, W(3, 6), E(3) + 10, 110)}
      {f >= MOST && f < DROP && top(<><span style={{ color: ACCENT }}>MOST</span> PEOPLE, EVERY WEEK</>, MOST, DROP, 92)}
      {f >= W(5, 3) && f < HIT && top(<>CHEWING <span style={{ color: ACCENT }}>GUM</span></>, W(5, 3), HIT + 2, 110)}
      {f >= HIT && f < CAV + 4 && top(<>THE SONG CAME BACK <span style={{ color: ACCENT }}>LESS</span></>, HIT, CAV + 4, 80)}
      {f >= W(6, 4) && f < Q && top(<>SMALL, QUICK TESTS</>, W(6, 4), Q, 96)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1676, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(6) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1760, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 11</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1560} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["song,", "head?", "last", "bus.", "office,", "still", "playing.", "most", "week.", "chewing", "gum", "less!", "small,", "quick.", "song"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: SKY }} />} cam={cam} hits={[HIT]} power={5} svg={svg} html={html} />;
};

export const _unused = { SketchLine, GRAPHITE };
