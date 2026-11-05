import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, walkCycle, type Pose } from "../stickman/stick";
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
// T36 · "Why do you lose 1 name right after hearing it?" Spark Got Tricked #3 (STORY, pencil look, 29 s).
// ONE world, one camera rig: a pencil meeting room, first day, a turn goes clockwise round a table and ends at Spark. A violet ball shows whose turn it is.
// Round 1: names. Spark rehearses his own line, the two names just before his turn fall off and Mr. Trick sweeps them into the bin.
// Round 2: the same table is the word test. Words just before his turn go dark and empty, the far ones and his own stay lit: the reveal.
// Brenner 1973 (read in full), Forrin et al. 2019 for replications: see facts.md. The people, words and names are our own picture.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const ei = Easing.in(Easing.quad);
const sio = Easing.inOut(Easing.sin);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const ACCENT = "#6d3fd8";
const CREAM = "#fbf6ea";
const GROUND = 1440;
const S0 = 2.6;
const SX = 270;
const SAM_S = 2.1;
const SAM_HOME = 850;
const SAM_SHAKE = 622;
const BACK_S = 1.35;
const BACK_G = 1150;
const WALL_FLOOR = 1120;

// --- timing ---------------------------------------------------------------------------------------------------------------
const LOOP0 = E(7) + 1;
const LOOP1 = VOICE_FRAMES - 2;
const PROMISE = C(1);
const ROUND1 = C(2);
const BUSY = C(3);
const FALL1 = W(3, 3); // "planning": ANA goes
const FALL2 = W(3, 5) + 2; // "what": SAM goes
const SWEEP = E(3) - 8;
const MYTURN = E(3) + 4; // the ball reaches Spark in the pause
const TEST = C(4);
const DROP = E(4) + 6;
const ANSWER = C(5);
const GO_LAMP = W(5, 2); // "forgot"
const GO_CHAIR = W(5, 4);
const HIT = W(5, 9); // "turn!"
export { HIT };
const CAVEAT = C(6);
const NAMES_BACK = W(6, 8) - 4; // "names"
const Q = C(7);
const YOUQ = W(7, 3);

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
const F0: [number, number, number] = [425, 968, 2.1];
const WIDE: [number, number, number] = [535, 925, 1.08];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: [number, number, number]): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 6, PROMISE + 16, [470, 1000, 1.5]), // a tall hat behind the table
  k(ROUND1 - 8, ROUND1 + 14, WIDE), // the whole table
  k(BUSY - 6, BUSY + 16, [500, 880, 1.12]), // Spark, his thought, and the names
  k(SWEEP - 2, SWEEP + 18, [490, 960, 1.28]), // the bin, and his turn
  k(TEST - 8, TEST + 14, WIDE), // the same table, the word test
  k(CAVEAT + 2, CAVEAT + 24, [520, 930, 1.12]),
  k(Q - 12, Q + 12, [430, 985, 1.85]), // he asks you
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
const scaleAt = (f: number) => interpolate(f, [HIT, HIT + 7, HIT + 12, HIT + 16, CAVEAT, CAVEAT + 20], [S0, 3.05, 2.9, 2.95, 2.95, S0], { ...clamp, easing: sio });

// --- the people ------------------------------------------------------------------------------------------------------------
type Person = { name: string; word: string; x: number; hair: Hair; glasses?: boolean; bx: number; by: number; tok: [number, number] };
const PEOPLE: Person[] = [
  { name: "MAYA", word: "APPLE", x: 440, hair: "bun", bx: 452, by: 764, tok: [440, 806] },
  { name: "RAVI", word: "RIVER", x: 595, hair: "bald", glasses: true, bx: 608, by: 700, tok: [595, 806] },
  { name: "ANA", word: "CHAIR", x: 750, hair: "long", bx: 768, by: 764, tok: [750, 806] },
  { name: "SAM", word: "LAMP", x: SAM_HOME, hair: "short", bx: 888, by: 880, tok: [786, 985] },
];
const SPARK_TOK: [number, number] = [SX, 838];
const R1 = [W(2, 0), W(2, 2) + 2, W(2, 4) + 1, W(2, 6) + 1]; // names round
const R2 = [W(4, 3), W(4, 5), W(4, 6) + 2, W(4, 8)]; // words round
const R2_ME = E(4) + 2;

const samX = (f: number) => {
  const away = interpolate(f, [PROMISE - 6, PROMISE + 22], [0, 1], { ...clamp, easing: sio });
  const back = interpolate(f, [Q + 6, E(7) - 4], [0, 1], { ...clamp, easing: sio });
  return SAM_SHAKE + (SAM_HOME - SAM_SHAKE) * away * (1 - back);
};
const shakeAt = (f: number) => {
  const a = f < PROMISE - 8 ? interpolate(f, [PROMISE - 18, PROMISE - 8], [1, 0], clamp) : interpolate(f, [E(7) - 6, E(7) + 6], [0, 1], clamp);
  return a * Math.sin(f * 0.42) * 15;
};
const shaking = (f: number) => f < PROMISE - 6 || f >= E(7) - 8;

// the ball that shows whose turn it is
const tokenAt = (f: number): { x: number; y: number; o: number } | null => {
  const round = (stops: number[], me: number, off: number) => {
    if (f < stops[0] - 10 || f > off) return null;
    const pts: [number, number][] = [...PEOPLE.map((p) => p.tok), SPARK_TOK];
    const times = [...stops, me];
    let i = 0;
    while (i < times.length - 1 && f >= times[i + 1] - 8) i++;
    const to = pts[i];
    const from = i === 0 ? [to[0] - 80, to[1] - 150] : pts[i - 1];
    const e = interpolate(f, [times[i] - 8, times[i]], [0, 1], { ...clamp, easing: sio });
    const y = from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 74;
    return { x: from[0] + (to[0] - from[0]) * e, y, o: interpolate(f, [stops[0] - 10, stops[0] - 4, off - 7, off], [0, 1, 1, 0], clamp) };
  };
  return round(R1, MYTURN, TEST - 10) ?? round(R2, R2_ME, CAVEAT + 6);
};

// --- the room ---------------------------------------------------------------------------------------------------------------
const Room: React.FC<{ f: number }> = ({ f }) => {
  const test = f >= TEST && f < NAMES_BACK;
  return (
    <g>
      <SketchLine x1={-300} y1={WALL_FLOOR} x2={1380} y2={WALL_FLOOR} w={6} />
      <SketchLine x1={-300} y1={WALL_FLOOR - 40} x2={1380} y2={WALL_FLOOR - 40} w={3} />
      <Hatch x={-300} y={WALL_FLOOR + 6} w={1680} h={500} gap={42} o={0.12} />
      {/* window with blinds: the morning light comes from here */}
      <SketchBox x={-40} y={300} w={286} h={300} fill="#fffdf6" lw={7} />
      {[0, 1, 2, 3, 4].map((i) => (
        <SketchLine key={i} x1={-40} y1={332 + i * 28} x2={246} y2={332 + i * 28} w={3} />
      ))}
      <SketchLine x1={-52} y1={604} x2={258} y2={604} w={10} />
      <path d="M 60 604 L 150 604 L 420 1120 L 120 1120 Z" fill="#fff9e8" opacity={0.65} />
      {/* door on the right */}
      <SketchBox x={1002} y={520} w={230} h={600} fill={PAPER2} lw={7} />
      <circle cx={1024} cy={830} r={9} fill={GRAPHITE} />
      <Hatch x={1010} y={530} w={210} h={586} gap={30} o={0.16} />
      {/* the board */}
      <SketchBox x={296} y={330} w={664} h={250} fill="#fffdf6" lw={8} />
      <SketchLine x1={330} y1={592} x2={930} y2={592} w={7} />
      {f >= PROMISE - 6 && f < Q - 8 && (
        <text x={628} y={test ? 480 : 440} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={test ? 96 : 66} fill={GRAPHITE}>
          {test ? "WORD TEST" : "NEW TEAM"}
        </text>
      )}
      {!test && f >= PROMISE - 6 && f < Q - 8 && (
        <text x={628} y={516} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={48} fill={SOFT}>
          SAY YOUR NAME
        </text>
      )}
    </g>
  );
};

const Table: React.FC = () => (
  <g>
    {/* contact shadow */}
    <ellipse cx={610} cy={1408} rx={400} ry={20} fill={GRAPHITE} opacity={0.18} />
    <path d="M 330 1124 L 900 1124 L 980 1200 L 250 1200 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <Hatch x={250} y={1124} w={730} h={76} gap={46} o={0.1} />
    <rect x={250} y={1200} width={730} height={34} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <SketchLine x1={300} y1={1234} x2={300} y2={1400} w={13} />
    <SketchLine x1={930} y1={1234} x2={930} y2={1400} w={13} />
    {/* things on the table */}
    <SketchBox x={540} y={1100} w={120} h={70} fill="#fffdf6" lw={5} />
    <path d="M 526 1170 L 674 1170 L 688 1186 L 512 1186 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 760 1136 L 806 1136 L 800 1182 L 766 1182 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 806 1146 q 18 2 16 16 q -2 12 -18 10" fill="none" stroke={GRAPHITE} strokeWidth={5} />
    <path d="M 378 1160 L 468 1160 L 462 1186 L 368 1186 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={4} />
  </g>
);

const Bin: React.FC<{ jolt: number }> = ({ jolt }) => (
  <g transform={`translate(0 ${-jolt * 12}) rotate(${jolt * 3} 690 1420)`}>
    <ellipse cx={690} cy={1424} rx={72} ry={11} fill={GRAPHITE} opacity={0.2} />
    <path d="M 636 1310 L 744 1310 L 730 1424 L 650 1424 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
    <Hatch x={636} y={1314} w={108} h={108} gap={18} o={0.26} />
    <ellipse cx={690} cy={1310} rx={55} ry={11} fill="#4a4640" stroke={GRAPHITE} strokeWidth={6} />
  </g>
);

// A card or speech bubble. `empty` drains it: the word goes, a dashed outline stays. Drawn outside the pencil filter so words stay crisp.
const Card: React.FC<{ x: number; y: number; w?: number; h?: number; text: string; pop: number; color?: string; tail?: boolean; size?: number; empty?: number; dark?: number }> = ({ x, y, w = 168, h = 82, text, pop, color = ACCENT, tail = true, size = 46, empty = 0, dark = 0 }) => {
  if (pop <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${pop})`} opacity={Math.min(1, pop * 1.6)}>
      {tail && empty < 0.5 && <path d={`M -14 ${h / 2 - 3} L 2 ${h / 2 + 26} L 18 ${h / 2 - 3} Z`} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} strokeLinejoin="round" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={empty > 0.5 ? "none" : "#fffdf6"} stroke={empty > 0.5 ? (dark > 0.3 ? "#d9d2c4" : SOFT) : GRAPHITE} strokeWidth={6} strokeDasharray={empty > 0.5 ? "14 12" : undefined} />
      {tail && empty < 0.5 && <path d={`M -11 ${h / 2 - 6} L 15 ${h / 2 - 6}`} stroke="#fffdf6" strokeWidth={8} />}
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={color} opacity={1 - empty}>
        {text}
      </text>
      {empty > 0.5 && (
        <text x={0} y={size * 0.4} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={size * 1.15} fill={dark > 0.3 ? "#e6dfd0" : SOFT}>
          ?
        </text>
      )}
    </g>
  );
};

// Spark's thought cloud (what he plans to say)
const Cloud: React.FC<{ pop: number; lines: string[]; size?: number; color?: string; lift?: number }> = ({ pop, lines, size = 50, color = GRAPHITE, lift = 0 }) => {
  if (pop <= 0.01) return null;
  const cx = 218;
  const cy = 618 - lift;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${pop * 0.92})`}>
      <circle cx={118} cy={168} r={13} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} />
      <circle cx={100} cy={122} r={20} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} />
      <path d="M -130 40 C -192 30 -186 -50 -128 -52 C -128 -112 -46 -122 -14 -86 C 26 -130 110 -104 104 -52 C 170 -52 176 42 112 48 C 96 106 -2 104 -22 70 C -62 104 -130 92 -130 40 Z" fill="#fffdf6" stroke={GRAPHITE} strokeWidth={7} strokeLinejoin="round" />
      {lines.map((t, i) => (
        <text key={t} x={-10} y={-20 + i * (size + 8) - ((lines.length - 2) * (size + 8)) / 2 + size * 0.42} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={size} fill={color}>
          {t}
        </text>
      ))}
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [PROMISE - 5, "swish", 0.3],
  [PROMISE + 14, "pop", 0.35],
  [ROUND1 - 6, "swish", 0.25],
  ...R1.map((at) => [at, "pop", 0.32] as SfxCue),
  [BUSY + 2, "pop", 0.35],
  [FALL1 + 16, "thud", 0.35],
  [FALL2 + 16, "thud", 0.35],
  [SWEEP + 8, "swish", 0.35],
  [SWEEP + 21, "clink", 0.45],
  [MYTURN, "ding", 0.28],
  [TEST - 6, "whoosh", 0.3],
  [TEST + 4, "page", 0.5],
  ...R2.map((at) => [at, "tick", 0.5] as SfxCue),
  [R2_ME, "ding", 0.3],
  [GO_LAMP + 12, "clink", 0.42],
  [GO_CHAIR + 12, "clink", 0.42],
  [HIT, "impact", 0.8],
  [HIT + 3, "ding", 0.45],
  [NAMES_BACK, "page", 0.4],
  [Q - 10, "swish", 0.3],
  [YOUQ, "pop", 0.35],
];

export const S01Meeting: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const sNow = scaleAt(f);
  const HANDSHAKE: Partial<Pose> = { ra1: 76, ra2: 8, la1: -150, la2: -95, lean: -3, head: -2 };

  const sparkKeys = gestureKeys([
    [0, HANDSHAKE],
    [PROMISE - 12, HANDSHAKE],
    [PROMISE - 2, { ...G.pointUp, head: -6 }, "snap"],
    [E(1) + 8, G.rest],
    [ROUND1, { ...G.present, head: -4 }, "snap"],
    [W(2, 4), { ...G.pointSide, ra1: 104, head: -6 }, "snap"],
    [BUSY - 4, G.rest],
    [BUSY + 1, { ...G.thinkChin, head: -6 }, "snap"],
    [FALL1, { ...G.fistPump, head: -8 }, "snap"],
    [W(3, 6), { ...G.thinkChin, head: -8 }, "snap"],
    [MYTURN - 2, { ...G.fistPump, head: -6 }, "snap"],
    [MYTURN + 16, { ...G.fistPump, head: -6 }],
    [TEST - 12, { ...G.shrugBig, head: 8 }, "snap"],
    [TEST + 4, { ...G.present, head: -3 }, "snap"],
    [W(4, 4), { ...G.thinkChin, head: -6 }, "snap"],
    [R2_ME - 2, { ...G.pointUp, head: -6 }, "snap"],
    [DROP + 8, { ...G.rest, head: 4 }],
    [W(5, 1), { ...G.doublePoint, ra1: 106, la1: 76, head: -4 }, "snap"],
    [W(5, 5), { ...G.recoil }, "snap"],
    [HIT, G.mindBlown, "snap"],
    [CAVEAT - 4, G.mindBlown],
    [CAVEAT + 1, { ...G.shrugBig, head: 8 }, "snap"],
    [W(6, 5), { ...G.pointSide, ra1: 100 }, "snap"],
    [W(6, 8), { ...G.thinkChin, head: 8 }, "snap"],
    [Q - 2, { ...G.leanIn, ra1: 82, ra2: 8 }, "snap"],
    [YOUQ, { ...G.doublePoint, ra1: 96, la1: 64, lean: 8 }, "snap"],
    [E(7) - 8, HANDSHAKE, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, hop(t, HIT, 56));
    q = addPose(q, hop(t, MYTURN - 2, 26));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, shake(t, W(5, 5), 3));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    if (shaking(t)) q = addPose(q, { ra1: shakeAt(t) * 0.3 });
    const s = scaleAt(t);
    return { ...q, x: SX, y: GROUND - 92.5 * s + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [W(0, 4), "worried"],
      [PROMISE - 2, "curious"],
      [ROUND1, "happy"],
      [W(2, 4), "smug"],
      [BUSY + 1, "thinking"],
      [FALL1, "excited"],
      [W(3, 6), "thinking"],
      [MYTURN - 2, "excited"],
      [TEST - 12, "worried"],
      [TEST + 4, "curious"],
      [W(4, 4), "thinking"],
      [R2_ME - 2, "smug"],
      [DROP + 8, "neutral"],
      [W(5, 1), "curious"],
      [W(5, 5), "shock"],
      [HIT, "mindblown"],
      [CAVEAT + 1, "skeptical"],
      [W(6, 5), "curious"],
      [W(6, 8), "thinking"],
      [Q, "curious"],
      [YOUQ, "wink"],
      [E(7) - 8, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= HIT && t < Q - 4) return interpolate(t, [HIT, HIT + 4], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };

  // --- bubbles + cards ----------------------------------------------------------------------------------------------------
  const roundOut = interpolate(f, [TEST - 10, TEST - 1], [1, 0], { ...clamp, easing: ei });
  const nameFall = (i: number) => (i === 2 ? FALL1 : i === 3 ? FALL2 : 99999);
  const nameBubble = (p: Person, i: number) => {
    const at = R1[i];
    const pop = interpolate(f, [at - 2, at + 9], [0, 1], { ...clamp, easing: eoB }) * roundOut;
    const fallAt = nameFall(i);
    if (f >= fallAt) return null; // from here it is a falling tag (drawn below)
    return <Card key={p.name} x={p.bx} y={p.by} text={p.name} pop={pop} />;
  };
  // falling + swept name tags
  const FLOOR_X = [0, 0, 520, 600];
  const nameTag = (i: number) => {
    const p = PEOPLE[i];
    const a = nameFall(i);
    if (f < a || f > SWEEP + 24) return null;
    const fall = interpolate(f, [a, a + 16], [0, 1], { ...clamp, easing: ei });
    const sweep = interpolate(f, [SWEEP + 2 + (i - 2) * 3, SWEEP + 21], [0, 1], { ...clamp, easing: sio });
    const x0 = p.bx + (FLOOR_X[i] - p.bx) * fall;
    const y0 = p.by + (1398 - p.by) * fall - Math.sin(fall * Math.PI) * 30;
    const x = x0 + (690 - x0) * sweep;
    const y = y0 - Math.sin(sweep * Math.PI) * 90 + sweep * -60;
    const rot = fall * (i === 2 ? -14 : 12) * (1 - sweep);
    const s = 0.82 * (1 - sweep * 0.7);
    return (
      <g key={p.name} transform={`rotate(${rot} ${x} ${y})`} opacity={interpolate(f, [SWEEP + 19, SWEEP + 23], [1, 0], clamp)}>
        <Card x={x} y={y} text={p.name} pop={s} tail={false} />
      </g>
    );
  };
  const wordsOn = f >= TEST && f < NAMES_BACK + 4;
  const wordOff = interpolate(f, [NAMES_BACK - 2, NAMES_BACK + 4], [1, 0], { ...clamp, easing: ei });
  const goAt = (i: number) => (i === 3 ? GO_LAMP : i === 2 ? GO_CHAIR : 99999);
  const wordCard = (p: Person, i: number) => {
    const pop = interpolate(f, [R2[i] - 2, R2[i] + 8], [0, 1], { ...clamp, easing: eoB }) * wordOff;
    const empty = interpolate(f, [goAt(i), goAt(i) + 4], [0, 1], clamp);
    return <Card key={p.word} x={p.bx} y={p.by} text={p.word} pop={pop} empty={empty} dark={1} tail={empty < 0.5} />;
  };
  // the word itself falls out of the card into the bin
  const wordFall = (i: number) => {
    const p = PEOPLE[i];
    const a = goAt(i);
    if (f < a || f > a + 16) return null;
    const e = interpolate(f, [a, a + 14], [0, 1], { ...clamp, easing: ei });
    const x = p.bx + (690 - p.bx) * e;
    const y = p.by + (1310 - p.by) * e - Math.sin(e * Math.PI) * 60;
    return (
      <text key={p.word} x={x} y={y} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={46 * (1 - e * 0.5)} fill={ACCENT} transform={`rotate(${e * 40} ${x} ${y})`}>
        {p.word}
      </text>
    );
  };
  // back to names: the two far ones are there, the two near ones are empty
  const backPop = interpolate(f, [NAMES_BACK, NAMES_BACK + 8], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [Q - 12, Q - 2], [1, 0], { ...clamp, easing: ei });
  const nameBack = (p: Person, i: number) => <Card key={"b" + p.name} x={p.bx} y={p.by} text={p.name} pop={backPop} empty={i >= 2 ? 1 : 0} dark={0} tail={i < 2} />;

  // Spark's thought and his own card
  const cloud1 = interpolate(f, [BUSY, BUSY + 12], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [MYTURN - 4, MYTURN + 2], [1, 0], { ...clamp, easing: ei });
  const cloud2 = interpolate(f, [W(4, 4), W(4, 4) + 12], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [NAMES_BACK - 8, NAMES_BACK], [1, 0], { ...clamp, easing: ei });
  const sparkSays = interpolate(f, [MYTURN, MYTURN + 8], [0, 1], { ...clamp, easing: eoB }) * interpolate(f, [TEST - 14, TEST - 6], [1, 0], { ...clamp, easing: ei });

  // --- darkness: the room dims for the drop, then only the far people and Spark stay lit ---------------------------------------
  const dim = interpolate(f, [DROP, ANSWER - 4], [0, 0.5], { ...clamp, easing: sio }) + interpolate(f, [W(5, 2), HIT], [0, 0.26], { ...clamp, easing: sio });
  const dimOff = interpolate(f, [CAVEAT + 2, CAVEAT + 22], [1, 0], { ...clamp, easing: sio });
  const dark = dim * dimOff;

  // --- Mr. Trick -----------------------------------------------------------------------------------------------------------
  const peek = interpolate(f, [PROMISE + 8, PROMISE + 20], [1320, 1124], { ...clamp, easing: eoB });
  const jump = interpolate(f, [FALL1 + 4, FALL1 + 24], [0, 1], { ...clamp, easing: sio });
  const out = f >= FALL1 + 4;
  const sweepK = interpolate(f, [SWEEP, SWEEP + 20], [0, 1], { ...clamp, easing: sio });
  const tx = out ? 510 + (505 - 510) * jump + 110 * sweepK : 510;
  const tg = out ? 1124 + (1412 - 1124) * jump - Math.sin(jump * Math.PI) * 120 : peek;
  const tS = 1 + 0.42 * jump;
  const brushing = f >= SWEEP && f <= SWEEP + 22;
  const tMood = f >= HIT ? "smug" : f >= NAMES_BACK ? "surprised" : "sly";
  const armSwing = brushing ? Math.sin(f * 0.9) * 16 : 0;
  const tPose: Partial<Pose> = { ...(f >= FALL1 + 4 && f < FALL1 + 24 ? walkCycle(f, 0.5) : {}), ra1: 44 + armSwing, ra2: 12, la1: 30 + armSwing * 0.5, la2: 20, head: -3 };
  const trick = (
    <MrTrick x={tx} ground={tg} scale={tS} facing={1} pose={tPose} mood={tMood} cane="none">
      {(j) =>
        out ? (
          <g>
            <SketchLine x1={j.lHand[0]} y1={j.lHand[1] - 24} x2={j.rHand[0] + 48} y2={tg - 8} w={6} />
            <path d={`M ${j.rHand[0] + 28} ${tg - 16} L ${j.rHand[0] + 84} ${tg - 16} L ${j.rHand[0] + 96} ${tg + 6} L ${j.rHand[0] + 14} ${tg + 6} Z`} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
          </g>
        ) : null
      }
    </MrTrick>
  );

  const backPerson = (p: Person, i: number) => {
    const sway = Math.sin(f * 0.05 + i * 1.5) * 2;
    const tk = [...R1, ...R2];
    const talking = tk.some((a, n) => (n % 4 === i ? f >= a && f < a + 16 : false));
    const litFace = f >= HIT ? (i < 2 ? "happy" : "plain") : talking ? "shock" : "plain";
    return <Doodle key={p.name} x={p.x} ground={BACK_G} scale={BACK_S} facing={i === 2 ? -1 : 1} hair={p.hair} glasses={p.glasses} face={litFace} pose={{ head: sway, ra1: 16, ra2: 6, la1: -16, la2: -6 }} />;
  };

  // Sam, the neighbour: same blank badge at the start and the end
  const sx = samX(f);
  const walking = !shaking(f) && ((f >= PROMISE - 6 && f < PROMISE + 22) || (f >= Q + 6 && f < E(7) - 4));
  const samPose: Partial<Pose> = shaking(f)
    ? { ra1: 102 + shakeAt(f) * 0.3, ra2: 6, la1: -14, la2: -8, head: -2 }
    : { ...(walking ? walkCycle(f, 0.55) : {}), ra1: 18, ra2: -8, la1: -18, la2: 8, head: Math.sin(f * 0.04) * 2 };
  const samTalk = R1[3];
  const samFace = f >= samTalk && f < samTalk + 16 ? "shock" : "happy";
  const samHip = GROUND - 92.5 * SAM_S;
  const badgeY = samHip - 96;
  const badge = (
    <g transform={`translate(${sx - 8} ${badgeY}) rotate(-3)`}>
      <rect x={-52} y={-30} width={104} height={66} rx={7} fill="#fffdf6" stroke={GRAPHITE} strokeWidth={5} />
      <rect x={-52} y={-30} width={104} height={21} rx={7} fill={ACCENT} />
      <text x={0} y={-14} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={15} fill="#fff">HELLO</text>
      <line x1={-36} y1={22} x2={36} y2={22} stroke={SOFT} strokeWidth={3} strokeDasharray="7 6" />
    </g>
  );

  const token = tokenAt(f);
  const svg = (
    <>
      <PencilDefs f={f} />
      <defs>
        <mask id="lit" maskUnits="userSpaceOnUse" x={-400} y={-300} width={1900} height={2100}>
          <rect x={-400} y={-300} width={1900} height={2100} fill="#fff" />
          <ellipse cx={530} cy={830} rx={190} ry={260} fill="#000" filter="url(#soft)" />
          <ellipse cx={SX - 40} cy={960} rx={330} ry={510} fill="#000" filter="url(#soft)" />
        </mask>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={46} />
        </filter>
      </defs>
      <Paper />
      <g filter="url(#pencil)">
        <Room f={f} />
        {PEOPLE.slice(0, 3).map(backPerson)}
        {!out && trick}
        <Table />
        <Bin jolt={wobble(f, GO_LAMP + 13, 1, 8) + wobble(f, GO_CHAIR + 13, 1, 8) + wobble(f, SWEEP + 21, 1, 8)} />
        {out && trick}
        <Doodle x={sx} ground={GROUND} scale={SAM_S} facing={-1} hair={PEOPLE[3].hair} face={samFace} pose={samPose} />
      </g>
      {badge}
      {dark > 0.005 && <rect x={-400} y={-300} width={1900} height={2100} fill="#191714" opacity={dark} mask="url(#lit)" />}
      {f < TEST && PEOPLE.map(nameBubble)}
      {f < TEST && [2, 3].map(nameTag)}
      {wordsOn && PEOPLE.map(wordCard)}
      {wordsOn && [2, 3].map(wordFall)}
      {f >= NAMES_BACK && PEOPLE.map(nameBack)}
      {token && <circle cx={token.x} cy={token.y} r={21} fill={ACCENT} stroke={GRAPHITE} strokeWidth={5} opacity={token.o} />}
      <Spark f={f} trails={false} scale={sNow} base={{ x: SX, y: GROUND - 92.5 * sNow }} talk={(t) => (t > LOOP0 ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={f >= PROMISE && f < E(7) - 8 ? 0.8 : 0.2} keys={sparkKeys} mod={sparkMod} />
      <Cloud pop={cloud1} lines={["HI, I AM", "SPARK!"]} />
      <Cloud pop={cloud2} lines={["MY WORD:", "BOAT"]} color={ACCENT} lift={(sNow - S0) * 280} />
      <Card x={130} y={760} w={210} h={90} text="SPARK!" pop={sparkSays} color={GRAPHITE} />
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 130,
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
  const whatName = <>WHAT WAS THE <span style={{ color: ACCENT }}>NAME?</span></>;
  const smallLine =
    f < TEST
      ? ""
      : f < ANSWER
        ? "A 1973 test: 88 male students read words aloud in turn (Brenner)."
        : f < CAVEAT
          ? "Weak memory about 9 s before and after their own turn. Later tests agree."
          : f < Q
            ? "Words, not names: the link to names is our own guess."
            : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 2 && top(whatName, 0, PROMISE - 2)}
      {f >= LOOP1 - 12 && top(whatName, VOICE_FRAMES + 100, VOICE_FRAMES + 200)}
      {f >= HIT - 1 && f < CAVEAT + 2 && top(<>JUST BEFORE<br /><span style={{ color: ACCENT }}>YOUR TURN</span></>, HIT, CAVEAT + 2, 118)}
      {f >= W(6, 2) && f < NAMES_BACK - 4 && top(<>WORDS, NOT <span style={{ color: ACCENT }}>NAMES</span></>, W(6, 2), NAMES_BACK - 4)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1692, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(7) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 3</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={56} x={50} w={980} cues={VOICE_CUES} hi={["name", "last", "meeting.", "say.", "words", "forgot", "turn!", "names.", "today?"]} />
    </>
  );

  const hits = [HIT, HIT + 2];
  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={hits} power={5} svg={svg} html={html} />;
};
