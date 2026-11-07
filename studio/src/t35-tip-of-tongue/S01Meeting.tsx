import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { addPose, idle, solve, STAND, type Joints, type Pose } from "../stickman/stick";
import { FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SfxCue } from "./sfx";
import { VoiceCaptions } from "../shared/kit";
import { Spark, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { wobble } from "../shared/motion";
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine, type DoodleFace } from "../shared/doodle";
import { MrTrick, type TrickMood } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T35 · "Why does a word hide when you need it?" Spark Got Tricked #9 (STORY, pencil look, 28.9 s).
// ONE world, one camera rig: a pencil meeting room. Spark stands at the whiteboard (left) in the middle of his talk;
// Mr. Trick stands on top of the whiteboard and holds the hidden word on a string, a card with seven empty slots.
// Three co-workers sit at the table (right) under a wall calendar. The word hides, comes close and hides again; Spark
// works out the first letter himself, grabs the card, the string snaps and STAPLER fills in. Then a co-worker shows how:
// ask for the first letter. D'Angelo & Humphreys 2015 (Cognition 142:166) + Brown 1991 (Psych Bull 109:204): facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);
const eo = Easing.out(Easing.cubic);

const ACCENT = "#e4572e"; // the hidden word
const CREAM = "#fffdf6";
const WALL = "#e7e1d4";
const FLOOR = 1440;
const S = 2.6;
const WORD = "STAPLER";

// --- timing (anchored to spoken words) --------------------------------------------------------------------------------
const YANK1 = W(0, 4); // "hide"
const KNOW0 = W(0, 8);
const PROMISE = C(1);
const KNOW = W(2, 1);
const CANNOT = W(2, 7);
const ADULTS = C(3);
const ONCE = W(3, 5);
const FLIP = C(4) - 5; // "Later": the calendar page turns
const BACK = FLIP + 14; // the camera goes back to Spark
const LOWER = [BACK + 6, BACK + 30] as const; // the card comes down to his mouth again
const HIDE2 = W(4, 6); // "hide"
const DROP = E(4) + 4; // lights + music drop
const TRY0 = C(5) + 8; // letters flicker in his thought bubble
const GOT_S = W(5, 5); // "themselves": S!
const CROUCH = GOT_S + 8;
const JUMP = GOT_S + 16;
const GRAB = GOT_S + 24;
const LAND = GOT_S + 34;
const HIT = W(5, 9); // "often!" the string snaps
export { HIT };
const FILL = (i: number) => HIT + 2 + i * 3; // letters T..R fill in
const TABLE0 = C(6);
const FIRST = W(6, 4);
const FINDW = W(6, 7);
const Q = C(7);
const TOSS = Q + 10;
const NEW0 = Q + 24;
const NEW1 = Q + 54;
const LOOP = VOICE_FRAMES - 22;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [470, 930, 2.25];
const WIDE: V3 = [720, 880, 0.98];
const CAL: V3 = [1480, 860, 1.08];
const PUSH: V3 = [530, 830, 1.2];
const TABLE: V3 = [790, 880, 0.94];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(E(0) + 4, PROMISE - 8, WIDE), // pull back: the meeting, Mr. Trick on the whiteboard
  k(E(2) + 4, ADULTS + 2, CAL), // over to the table and the calendar
  k(BACK, BACK + 18, WIDE), // "Later": back to Spark
  k(DROP + 2, DROP + 26, PUSH), // the pause: slow push in, lights down
  k(TABLE0 - 16, TABLE0 + 6, TABLE), // "So ask": Spark and the co-worker with the note
  k(Q - 14, Q + 8, F0), // the question: back to Spark's face = frame 0
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
const BOARD = { x: 70, y: 540, w: 820, h: 520 };
const TBL = { x0: 1040, x1: 1960, top: 1180 };
const Room: React.FC = () => (
  <g>
    <rect x={-800} y={-800} width={3800} height={FLOOR + 800} fill={WALL} />
    {/* a low wood strip on the wall */}
    <rect x={-800} y={1230} width={3800} height={18} fill={PAPER2} stroke={GRAPHITE} strokeWidth={3} opacity={0.8} />
    <rect x={-800} y={FLOOR} width={3800} height={300} fill={PAPER2} />
    <Hatch x={-800} y={FLOOR} w={3800} h={300} gap={30} o={0.18} />
    <SketchLine x1={-800} y1={FLOOR} x2={3000} y2={FLOOR} w={7} />
    {/* the window behind the table: grey day */}
    <SketchBox x={1980} y={330} w={300} h={520} fill="#c9cdd0" lw={8} />
    <line x1={2130} y1={330} x2={2130} y2={850} stroke={GRAPHITE} strokeWidth={6} />
    <Hatch x={1990} y={340} w={280} h={500} gap={26} o={0.15} width={2} />
    {/* the lamp over the table: the light in the room */}
    <line x1={1500} y1={-800} x2={1500} y2={120} stroke={GRAPHITE} strokeWidth={4} />
    <path d="M 1420 200 L 1452 118 L 1548 118 L 1580 200 Z" fill="#fff3c8" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    {/* a plant in the corner */}
    <path d="M -120 1440 L -100 1300 L 20 1300 L 40 1440 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    {[-70, -30, 10].map((x, i) => (
      <path key={i} d={`M ${x} 1300 Q ${x - 40 + i * 30} 1180 ${x - 10 + i * 20} 1090`} stroke={GRAPHITE} strokeWidth={5} fill="none" />
    ))}
  </g>
);
const LampGlow: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="tableGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6d8" stopOpacity={0.85} />
        <stop offset="1" stopColor="#fff6d8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={1500} cy={760} rx={620} ry={700} fill="url(#tableGlow)" />
  </g>
);

const Board: React.FC = () => (
  <g>
    <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={9} />
    <Hatch x={BOARD.x + 10} y={BOARD.y + 10} w={120} h={BOARD.h - 20} gap={22} o={0.08} width={2} />
    {/* tray + legs */}
    <rect x={BOARD.x + 40} y={BOARD.y + BOARD.h} width={BOARD.w - 80} height={20} rx={6} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    {[BOARD.x + 90, BOARD.x + BOARD.w - 110].map((x) => (
      <rect key={x} x={x} y={BOARD.y + BOARD.h + 20} width={20} height={FLOOR - BOARD.y - BOARD.h - 20} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    ))}
    {/* Spark's slide: a drawing of the thing he wants to name (a stapler) and a big question mark */}
    <g transform="translate(640 905) rotate(-4)">
      <path d="M -120 40 L 120 40 L 120 62 L -120 62 Z" fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -116 36 L -116 4 Q -110 -22 -70 -22 L 110 -18 Q 128 -14 124 4 L 120 36 Z" fill="#d8d2c4" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
      <line x1={-80} y1={8} x2={100} y2={10} stroke={GRAPHITE} strokeWidth={3} opacity={0.5} />
      <circle cx={-96} cy={50} r={6} fill={GRAPHITE} />
    </g>
    <text x={820} y={830} fontFamily={FONT.title} fontWeight={900} fontSize={96} fill={GRAPHITE} opacity={0.75} transform="rotate(8 820 830)">
      ?
    </text>
    {/* a chart nobody is looking at */}
    <polyline points="150,1000 220,960 290,975 360,920" fill="none" stroke={GRAPHITE} strokeWidth={5} opacity={0.4} />
  </g>
);

const Calendar: React.FC<{ f: number }> = ({ f }) => {
  const x0 = 1250;
  const y0 = 330;
  const cw = 66;
  const flip = interpolate(f, [FLIP, FLIP + 12], [0, 1], { ...clamp, easing: eio });
  const page = flip < 0.5 ? 0 : 1;
  const sy = Math.abs(Math.cos(flip * Math.PI));
  const markDay = page === 0 ? 2 : 4;
  const markAt = page === 0 ? ONCE : FLIP + 8;
  const m = interpolate(f, [markAt, markAt + 10], [0, 1], { ...clamp, easing: eoB });
  return (
    <g>
      {/* the pin */}
      <circle cx={x0 + (cw * 7) / 2} cy={y0 - 20} r={10} fill={GRAPHITE} />
      <g transform={`translate(0 ${y0}) scale(1 ${sy}) translate(0 ${-y0})`}>
        <rect x={x0} y={y0} width={cw * 7} height={300} rx={8} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
        <rect x={x0} y={y0} width={cw * 7} height={70} rx={8} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <g key={i}>
            <text x={x0 + cw * i + cw / 2} y={y0 + 50} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={GRAPHITE}>
              {d}
            </text>
            {i > 0 && <line x1={x0 + cw * i} y1={y0 + 70} x2={x0 + cw * i} y2={y0 + 300} stroke={GRAPHITE} strokeWidth={3} opacity={0.5} />}
          </g>
        ))}
        {/* the day a word hid: a small empty word card */}
        {m > 0.01 && (
          <g transform={`translate(${x0 + cw * markDay + cw / 2} ${y0 + 180}) scale(${m}) rotate(-6)`}>
            <rect x={-28} y={-22} width={56} height={44} rx={6} fill={CREAM} stroke={ACCENT} strokeWidth={5} />
            {[-14, 0, 14].map((x) => (
              <line key={x} x1={x - 5} y1={8} x2={x + 5} y2={8} stroke={ACCENT} strokeWidth={4} strokeLinecap="round" />
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

// --- the word card ---------------------------------------------------------------------------------------------------------
const CW = 7 * 40 + 44;
const CH = 112;
// n = letters shown (0 = all slots empty); new = a fresh empty card (the loop)
const Card: React.FC<{ x: number; y: number; rot: number; f: number; n: number; scale?: number }> = ({ x, y, rot, f, n, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-CW / 2} y={0} width={CW} height={CH} rx={16} fill={CREAM} stroke={ACCENT} strokeWidth={7} />
    <circle cx={0} cy={14} r={6} fill={ACCENT} />
    {WORD.split("").map((ch, i) => {
      const cx = -CW / 2 + 22 + 20 + i * 40;
      const shown = i < n;
      const pop = shown ? interpolate(f, [i === 0 ? GOT_S + 6 : FILL(i), (i === 0 ? GOT_S + 6 : FILL(i)) + 6], [0.4, 1], { ...clamp, easing: eoB }) : 1;
      return shown ? (
        <text key={i} x={cx} y={88} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={60 * pop} fill={ACCENT}>
          {ch}
        </text>
      ) : (
        <line key={i} x1={cx - 13} y1={86} x2={cx + 13} y2={86} stroke={ACCENT} strokeWidth={6} strokeLinecap="round" />
      );
    })}
  </g>
);

// --- Mr. Trick on top of the whiteboard -----------------------------------------------------------------------------------
const TRICK_X = 790;
const TRICK_G = BOARD.y;
const TRICK_S = 1.6;
const trickState = (f: number) => {
  // falls backwards off the board when the string snaps, peeks back up, climbs back for the loop
  const fall = interpolate(f, [HIT, HIT + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const peek = interpolate(f, [HIT + 24, HIT + 34, TABLE0 - 10, TABLE0], [0, 1, 1, 0], { ...clamp, easing: eo });
  const back = interpolate(f, [Q - 20, Q - 2], [0, 1], { ...clamp, easing: eoB });
  const lift = interpolate(f, [CANNOT - 6, CANNOT + 2, CANNOT + 22, CANNOT + 34], [0, 1, 1, 0], { ...clamp, easing: eio });
  const tugs = [YANK1, HIDE2];
  const tug = Math.max(...tugs.map((a) => interpolate(f, [a - 6, a, a + 8, a + 18], [0, 1, 1, 0], clamp)));
  const pulled = interpolate(f, [GRAB, LAND, HIT], [0, 1, 1], clamp) * (f < HIT ? 1 : 0); // Spark pulls him forward
  return { fall: f >= Q - 20 ? 1 - back : fall, peek, lift, tug, pulled };
};
const trickPose = (f: number): Partial<Pose> => {
  const s = trickState(f);
  const tipHat = f >= PROMISE + 4 && f < E(1) + 8;
  return {
    ra1: tipHat ? 165 : 92 + s.lift * 58 + s.tug * 40 - s.pulled * 30,
    ra2: tipHat ? 70 : 6 - s.tug * 20,
    la1: tipHat ? -40 : -30 - s.tug * 20,
    la2: 20,
    head: s.lift * -6 + s.pulled * 14,
    lean: s.tug * -10 + s.pulled * 22,
  };
};
const trickHand = (f: number): [number, number] => {
  const p: Pose = { ...STAND, ...trickPose(f), x: TRICK_X, y: TRICK_G - 92.5 * TRICK_S };
  const j = solve(p, TRICK_S, -1);
  return [j.rHand[0], j.rHand[1]];
};

// where the card hangs when Mr. Trick holds it out of reach
const hangAt = (f: number): [number, number] => {
  const [hx, hy] = trickHand(f);
  return [hx + 4, hy + 330];
};

type CardState = { x: number; y: number; rot: number; anchor: [number, number] | null; n: number; scale: number };
// mouth = Spark's mouth, hand = his raised hand (both from his joints)
const cardAt = (f: number, mouth: [number, number], hand: [number, number]): CardState | null => {
  const hang = hangAt(f);
  const anchor = trickHand(f);
  const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const n = f >= HIT ? Math.min(7, 1 + Math.max(0, Math.floor((f - HIT - 2) / 3) + 1)) : f >= GOT_S + 6 ? 1 : 0;
  // 1) frame 0: in his mouth; a small dip (anticipation), then yanked up with an overshoot
  if (f < YANK1 - 6) return { x: mouth[0] + 4, y: mouth[1] + 14, rot: -4 + Math.sin(f / 9) * 2, anchor, n, scale: 0.72 };
  if (f < LOWER[0]) {
    const dip = interpolate(f, [YANK1 - 6, YANK1], [0, 14], clamp);
    const t = interpolate(f, [YANK1, YANK1 + 16], [0, 1], { ...clamp, easing: eoB });
    const p = mix([mouth[0] + 4, mouth[1] + 14 + dip], hang, t);
    return { x: p[0], y: p[1], rot: -4 + wobble(f, YANK1 + 14, 14, 9), anchor, n, scale: 0.72 + 0.28 * t };
  }
  // 2) "Later": it comes down to his mouth again, then hides again
  if (f < HIDE2 + 18) {
    const down = interpolate(f, [LOWER[0], LOWER[1]], [0, 1], { ...clamp, easing: eio });
    const up = interpolate(f, [HIDE2, HIDE2 + 16], [0, 1], { ...clamp, easing: eoB });
    const dip = interpolate(f, [HIDE2 - 6, HIDE2, HIDE2 + 2], [0, 14, 0], clamp);
    const p = mix(mix(hang, [mouth[0] + 4, mouth[1] + 14], down), hang, up);
    return { x: p[0], y: p[1] + dip, rot: -2 + wobble(f, HIDE2 + 14, 12, 9), anchor, n, scale: 1 - 0.28 * down * (1 - up) };
  }
  // 3) he grabs it, pulls, the string snaps, he holds it up
  if (f < GRAB) return { x: hang[0], y: hang[1], rot: wobble(f, GOT_S + 6, 6, 8), anchor, n, scale: 1 };
  if (f < TOSS) {
    const t = interpolate(f, [GRAB, GRAB + 4], [0, 1], clamp);
    const p = mix(hang, [hand[0], hand[1] - CH - 30], t);
    return { x: p[0], y: p[1], rot: f >= HIT ? -6 + wobble(f, HIT, 10, 10) : 4, anchor: f < HIT ? anchor : null, n, scale: f >= HIT ? interpolate(f, [HIT, HIT + 8], [1, 1.14], { ...clamp, easing: eoB }) : 1 };
  }
  // 4) the loop: he tosses the full card away; a new empty card comes down into his mouth
  if (f < NEW0) {
    const t = interpolate(f, [TOSS, NEW0], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    return { x: hand[0] + t * 700, y: hand[1] - CH - 30 - Math.sin(t * Math.PI) * 260, rot: t * 160, anchor: null, n: 7, scale: 1.14 };
  }
  const t = interpolate(f, [NEW0, NEW1], [0, 1], { ...clamp, easing: eio });
  const top: [number, number] = [mouth[0] + 4, mouth[1] - 600];
  const p = mix(top, [mouth[0] + 4, mouth[1] + 14], t);
  return { x: p[0], y: p[1], rot: -4 + Math.sin(f / 9) * 2 * t, anchor: [anchor[0], anchor[1]], n: 0, scale: 1 - 0.28 * t };
};

// the string from the card up to Mr. Trick's hand (snaps on the hit: two loose ends recoil)
const String_: React.FC<{ c: CardState; f: number }> = ({ c, f }) => {
  if (!c.anchor) {
    if (f >= HIT && f < HIT + 30) {
      const a = trickHand(HIT - 1);
      const t = interpolate(f, [HIT, HIT + 14], [0, 1], { ...clamp, easing: eo });
      return (
        <g opacity={1 - interpolate(f, [HIT + 18, HIT + 30], [0, 1], clamp)}>
          <path d={`M ${a[0]} ${a[1]} q ${-30 * t} ${80 + 60 * t} ${20 * t} ${150 - 60 * t}`} stroke={GRAPHITE} strokeWidth={4} fill="none" />
          <path d={`M ${c.x} ${c.y} q ${30 * t} ${-60 - 40 * t} ${-10 * t} ${-120 + 40 * t}`} stroke={GRAPHITE} strokeWidth={4} fill="none" />
        </g>
      );
    }
    return null;
  }
  const [ax, ay] = c.anchor;
  const slack = interpolate(f, [GRAB, LAND], [0, 1], clamp) > 0 && f < HIT ? 0 : 18;
  return <path d={`M ${ax} ${ay} Q ${(ax + c.x) / 2 - slack} ${(ay + c.y) / 2} ${c.x} ${c.y + 12}`} stroke={GRAPHITE} strokeWidth={4} fill="none" strokeLinecap="round" />;
};

// --- co-workers at the table ----------------------------------------------------------------------------------------------
type Mate = { x: number; hair: "long" | "bald" | "curly"; glasses?: boolean; facing: number };
const MATES: Mate[] = [
  { x: 1190, hair: "long", glasses: true, facing: -1 },
  { x: 1480, hair: "bald", facing: -1 },
  { x: 1770, hair: "curly", facing: -1 },
];
const MATE_S = 2.0;
const NOTE_UP = [FIRST - 10, FIRST] as const;
const matePose = (i: number, f: number): Partial<Pose> => {
  if (i === 0) {
    const up = interpolate(f, [NOTE_UP[0], NOTE_UP[1], Q - 10, Q], [0, 1, 1, 0], { ...clamp, easing: eoB });
    return { ra1: 40 + up * 120, ra2: 60 - up * 50, la1: -30, la2: 40, head: -6 + up * -4 };
  }
  const bob = nodAt(f, ADULTS + i * 12);
  return { ra1: 40, ra2: 70, la1: -40, la2: 60, head: 6 + bob };
};
const nodAt = (f: number, at: number) => (f >= at && f < at + 24 ? Math.sin(((f - at) / 24) * Math.PI * 2) * 8 : 0);
const mateFace = (i: number, f: number): DoodleFace => {
  if (f >= HIT && f < TABLE0) return "shock";
  if (f >= TABLE0) return i === 0 ? "happy" : "plain";
  if (f >= ADULTS + i * 12 && f < FLIP) return "bored";
  return "plain";
};
const Mates: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {MATES.map((m, i) => (
      <Doodle key={i} x={m.x} ground={FLOOR - 40} scale={MATE_S} facing={m.facing} hair={m.hair} glasses={m.glasses} face={mateFace(i, f)} pose={matePose(i, f)} />
    ))}
  </g>
);
const Table: React.FC = () => (
  <g>
    <ellipse cx={(TBL.x0 + TBL.x1) / 2} cy={FLOOR + 6} rx={480} ry={14} fill={GRAPHITE} opacity={0.2} />
    <rect x={TBL.x0} y={TBL.top} width={TBL.x1 - TBL.x0} height={34} rx={8} fill={PAPER2} stroke={GRAPHITE} strokeWidth={7} />
    <path d={`M ${TBL.x0 + 30} ${TBL.top + 34} L ${TBL.x1 - 30} ${TBL.top + 34} L ${TBL.x1 - 50} ${FLOOR - 4} L ${TBL.x0 + 50} ${FLOOR - 4} Z`} fill="#ddd5c3" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
    <Hatch x={TBL.x0 + 60} y={TBL.top + 50} w={TBL.x1 - TBL.x0 - 120} h={FLOOR - TBL.top - 70} gap={24} o={0.14} width={2} />
    {/* cups and papers */}
    {[1330, 1620].map((x) => (
      <g key={x}>
        <path d={`M ${x - 26} ${TBL.top - 60} L ${x + 26} ${TBL.top - 60} L ${x + 20} ${TBL.top} L ${x - 20} ${TBL.top} Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
        <path d={`M ${x + 24} ${TBL.top - 46} q 22 4 2 30`} stroke={GRAPHITE} strokeWidth={5} fill="none" />
      </g>
    ))}
    <rect x={1860} y={TBL.top - 10} width={80} height={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={3} transform={`rotate(-4 1900 ${TBL.top})`} />
  </g>
);
// small thought bubbles over the co-workers: "this happens to us too"
const MateBubbles: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {MATES.map((m, i) => {
      const at = ADULTS + 4 + i * 12;
      const p = interpolate(f, [at, at + 10, FLIP - 6, FLIP + 2], [0, 1, 1, 0], { ...clamp, easing: eoB });
      if (p <= 0.01) return null;
      const bx = m.x - 30;
      const by = 820;
      return (
        <g key={i} transform={`translate(${bx} ${by}) scale(${p})`}>
          <circle cx={40} cy={86} r={10} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
          <ellipse cx={0} cy={0} rx={86} ry={58} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
          <rect x={-46} y={-24} width={92} height={48} rx={8} fill={CREAM} stroke={ACCENT} strokeWidth={5} />
          {[-24, 0, 24].map((x) => (
            <line key={x} x1={x - 8} y1={10} x2={x + 8} y2={10} stroke={ACCENT} strokeWidth={5} strokeLinecap="round" />
          ))}
        </g>
      );
    })}
  </g>
);

// the sticky note in the co-worker's hand: the first letter
const Note: React.FC<{ f: number }> = ({ f }) => {
  const up = interpolate(f, [NOTE_UP[0], NOTE_UP[1]], [0, 1], { ...clamp, easing: eoB });
  if (f < NOTE_UP[0] - 2 || f >= Q) return null;
  const p: Pose = { ...STAND, ...matePose(0, f), x: MATES[0].x, y: FLOOR - 40 - 92.5 * MATE_S };
  const j: Joints = solve(p, MATE_S, MATES[0].facing);
  const [hx, hy] = j.rHand;
  return (
    <g transform={`translate(${hx} ${hy - 70}) rotate(${-8 + wobble(f, NOTE_UP[1], 8, 8)}) scale(${0.6 + up * 0.4})`}>
      <rect x={-75} y={-75} width={150} height={150} fill="#fff1a8" stroke={GRAPHITE} strokeWidth={6} />
      <text x={0} y={42} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={120} fill={ACCENT}>
        S
      </text>
    </g>
  );
};

// Spark's thought bubble: he tries letters himself and lands on S
const LETTERS = ["A", "M", "B", "T", "K", "S"];
const TryBubble: React.FC<{ f: number }> = ({ f }) => {
  const p = interpolate(f, [TRY0, TRY0 + 10, GRAB - 4, GRAB + 2], [0, 1, 1, 0], { ...clamp, easing: eoB });
  if (p <= 0.01) return null;
  const idx = f >= GOT_S ? LETTERS.length - 1 : Math.min(LETTERS.length - 2, Math.floor(Math.max(0, f - TRY0 - 6) / 5));
  const got = f >= GOT_S;
  const pop = got ? 1 + wobble(f, GOT_S, 0.12, 6) : 1;
  const bx = 250;
  const by = 560;
  return (
    <g transform={`translate(${bx} ${by}) scale(${p})`}>
      <circle cx={120} cy={150} r={18} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
      <circle cx={160} cy={205} r={11} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={120} ry={100} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
      <text x={0} y={44} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={126 * pop} fill={got ? ACCENT : GRAPHITE} opacity={got ? 1 : 0.55}>
        {LETTERS[idx]}
        {got ? "!" : "?"}
      </text>
    </g>
  );
};

// rays behind Spark on the hit
const Burst: React.FC<{ f: number }> = ({ f }) => {
  const p = interpolate(f, [HIT, HIT + 8, TABLE0 - 14, TABLE0], [0, 1, 1, 0], { ...clamp, easing: eo });
  if (p <= 0.01) return null;
  const cx = 470;
  const cy = 820;
  return (
    <g opacity={0.55 * p} transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * p}) rotate(${(f - HIT) * 0.25})`}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const b = a + Math.PI / 22;
        return <path key={i} d={`M 0 0 L ${Math.cos(a) * 900} ${Math.sin(a) * 900} L ${Math.cos(b) * 900} ${Math.sin(b) * 900} Z`} fill={i % 2 ? "#ffd9c9" : "#ffe9bf"} />;
      })}
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [YANK1 - 6, "tick", 0.25],
  [YANK1, "swish", 0.5],
  [YANK1 + 14, "boing", 0.25],
  [E(0) + 4, "whoosh", 0.3],
  [PROMISE + 4, "pop", 0.25],
  [CANNOT - 4, "swish", 0.3],
  [E(2) + 4, "whoosh_long", 0.28],
  ...[0, 1, 2].map((i) => [ADULTS + 4 + i * 12, "pop", 0.22] as SfxCue),
  [ONCE, "ding", 0.3],
  [FLIP, "page", 0.5],
  [BACK, "whoosh", 0.28],
  [HIDE2, "swish", 0.5],
  [HIDE2 + 14, "boing", 0.25],
  [DROP, "freeze", 0.25],
  ...[0, 1, 2, 3, 4].map((i) => [TRY0 + 6 + i * 5, "tick", 0.18] as SfxCue),
  [GOT_S, "ding", 0.45],
  [JUMP, "swish", 0.35],
  [GRAB, "clink", 0.3],
  [HIT, "impact", 0.8],
  [HIT + 1, "stinger", 0.4],
  ...[1, 2, 3, 4, 5, 6].map((i) => [FILL(i), "pop", 0.16] as SfxCue),
  [HIT + 14, "thud", 0.3],
  [TABLE0 - 16, "whoosh", 0.28],
  [FIRST, "pop", 0.35],
  [Q - 14, "whoosh", 0.3],
  [TOSS, "swish", 0.35],
  [NEW1 - 2, "pop", 0.25],
];

export const S01Meeting: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);

  // --- Spark: at the whiteboard, facing the table ----------------------------------------------------------------------
  const SX = 430;
  const SY = FLOOR;
  const reach = { ra1: 172, ra2: 4, la1: -40, la2: 30, head: -22 };
  const mouthPoint = { ra1: 30, ra2: 150, la1: -20, la2: 20, head: -4 }; // a finger at his mouth (frame 0)
  const sparkKeys = gestureKeys([
    [0, mouthPoint],
    [YANK1, { ...reach }, "snap"], // grabs after the word
    [KNOW0, { ...G.shrugBig }, "snap"],
    [PROMISE - 2, { ...G.pointUp, ra1: 150, head: -16 }, "snap"],
    [E(1) + 2, { ...G.handsHips, head: -4 }, "snap"],
    [KNOW, { ...G.pointSide, ra1: 60, ra2: 10, head: 4 }, "snap"], // at his slide
    [W(2, 4), { ...G.thinkChin, head: 6 }, "snap"],
    [CANNOT - 4, { ...reach }, "snap"],
    [W(2, 9), { ...G.facepalm }, "snap"],
    [E(2) + 6, { ...G.armsCrossed, head: 8 }, "snap"],
    [LOWER[0], { ...G.leanIn, ra1: 120, ra2: 30, head: -14 }, "snap"],
    [HIDE2 - 2, { ...G.recoil, head: -16 }, "snap"],
    [HIDE2 + 16, { ...G.handsHips, head: 10 }, "snap"],
    [DROP, { ...G.thinkChin, head: -10 }, "snap"],
    [GOT_S, { ...G.pointUp, ra1: 160, head: -14 }, "snap"],
    [CROUCH, { ...G.leanIn, lean: 16, ra1: 40, ra2: 40, head: -12 }, "snap"], // anticipation
    [JUMP, { ...reach }, "snap"],
    [LAND, { ...G.fistPump, ra1: 120, ra2: 50, lean: -6, head: -10 }, "snap"], // pulling
    [HIT, { ...G.celebrate, la1: -150, la2: -95, head: -10 }, "snap"], // card up high + a hand at his head
    [HIT + 40, { ...G.celebrate, la1: -60, la2: -30, head: -8 }, "snap"],
    [TABLE0 + 4, { ...G.pointSide, ra1: 150, ra2: 30, la1: -30, la2: 20, head: 0 }, "snap"],
    [FIRST + 2, { ...G.pointSide, ra1: 140, ra2: 20, la1: 60, la2: 10, head: -4 }, "snap"], // points at the note
    [FINDW, { ...G.thinkChin, ra1: 150, ra2: 30, la1: 25, la2: 80, head: 6 }, "snap"],
    [Q - 4, { ...G.doublePoint, head: 2 }, "snap"],
    [TOSS - 4, { ...G.celebrate, ra1: 120, ra2: 60, head: -6 }, "snap"],
    [TOSS + 4, { ...G.pointSide, ra1: 70, ra2: -10, head: 0 }, "snap"], // the throw
    [NEW0 + 6, { ...G.leanIn, head: -14 }, "snap"],
    [NEW1 - 4, mouthPoint, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 4));
    q = addPose(q, hop(t, YANK1 + 2, 16));
    q = addPose(q, nod(t, PROMISE + 6, 2));
    q = addPose(q, hop(t, CANNOT - 2, 40));
    q = addPose(q, shake(t, HIDE2 + 18, 3));
    q = addPose(q, nod(t, GOT_S + 2, 1));
    q = addPose(q, hop(t, JUMP, 70));
    q = addPose(q, hop(t, HIT + 2, 22));
    q = addPose(q, nod(t, FIRST + 6, 2));
    q = addPose(q, nod(t, FINDW + 4, 2));
    const crouch = interpolate(t, [CROUCH, CROUCH + 4, JUMP, JUMP + 2], [0, 26, 26, 0], clamp);
    return { ...q, x: SX, y: SY - 92.5 * S + (q.y - p.y) + crouch };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "shock"],
      [KNOW0, "worried"],
      [PROMISE - 2, "determined"],
      [E(1) + 2, "smug"],
      [KNOW, "happy"],
      [W(2, 4), "thinking"],
      [CANNOT - 4, "determined"],
      [W(2, 9), "sad"],
      [LOWER[0], "excited"],
      [HIDE2 - 2, "shock"],
      [HIDE2 + 16, "angry"],
      [DROP, "thinking"],
      [GOT_S, "excited"],
      [CROUCH, "determined"],
      [HIT, "mindblown"],
      [HIT + 40, "laugh"],
      [TABLE0 + 4, "happy"],
      [FIRST + 2, "curious"],
      [FINDW, "smug"],
      [Q - 4, "wink"],
      [NEW0 + 6, "worried"],
      [NEW1 - 4, "shock"],
    ];
    let m: Mood = "shock";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he cannot find it and lights when he does
  const bulb = (t: number) => {
    if (t >= GOT_S && t < HIT) return 0.55;
    if (t >= HIT && t < Q) return interpolate(t, [HIT, HIT + 3], [0.5, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };

  // --- Mr. Trick -----------------------------------------------------------------------------------------------------------
  const ts = trickState(f);
  const tMood: TrickMood = f >= HIT && f < Q - 20 ? "surprised" : (f >= HIDE2 && f < GRAB) || f >= NEW1 ? "smug" : "sly";
  const fallRot = 25 * Math.sin(ts.fall * Math.PI);
  const fallY = ts.fall * 440 - ts.peek * 220;
  const trick = (
    <g transform={`translate(0 ${fallY}) rotate(${fallRot} ${TRICK_X + 40} ${TRICK_G})`}>
      <MrTrick x={TRICK_X} ground={TRICK_G} scale={TRICK_S} facing={-1} pose={trickPose(f)} mood={tMood} cane="none" />
    </g>
  );

  // lights down in the pause before the answer
  const dim = interpolate(f, [DROP, DROP + 10, HIT - 2, HIT], [0, 0.22, 0.22, 0], clamp);

  const svg = (
    <>
      <PencilDefs f={f} />
      <Paper />
      <g filter="url(#pencil)">
        <Room />
        <LampGlow />
        <Calendar f={f} />
        {trick}
        <Board />
        <Mates f={f} />
        <Table />
      </g>
      <Burst f={f} />
      <Spark
        f={f}
        trails={false}
        scale={S}
        facing={1}
        base={{ x: SX, y: SY - 92.5 * S }}
        talk={(t) => mouthAt(t)}
        bulb={bulb}
        mood={mood}
        look={f >= Q - 4 && f < TOSS ? 0.9 : 0.3}
        keys={sparkKeys}
        mod={sparkMod}
      >
        {(j) => {
          const mouth: [number, number] = [j.headC[0] + 6, j.headC[1] + 13 * S];
          const c = cardAt(f, mouth, j.rHand);
          if (!c) return null;
          return (
            <g>
              <String_ c={c} f={f} />
              <Card x={c.x} y={c.y} rot={c.rot} f={f} n={c.n} scale={c.scale} />
            </g>
          );
        }}
      </Spark>
      <g filter="url(#pencil)">
        <MateBubbles f={f} />
        <Note f={f} />
      </g>
      <TryBubble f={f} />
      {dim > 0 && <rect x={-1000} y={-1000} width={4000} height={4000} fill="#1d1b18" opacity={dim} />}
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 104) => (
    <div
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        top: 96,
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
  const hook = <>IT&apos;S ON MY <span style={{ color: ACCENT }}>TONGUE</span></>;
  const smallLine =
    f < HIT
      ? f >= ADULTS + 30 && f < FLIP
        ? "Most adults say it happens about once a week (review of studies, 1991)."
        : ""
      : f < TABLE0 - 6
        ? "Lab tests, 2015: people found hard, rare words. When they found the word, it got stuck less on a later test."
        : f < Q
          ? "In the tests, first-letter hints helped too. A small help, not a cure."
          : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(hook, -20, PROMISE - 6)}
      {f >= LOOP && top(hook, LOOP, VOICE_FRAMES + 200)}
      {f >= ONCE && f < FLIP && top(<>ABOUT ONCE A <span style={{ color: ACCENT }}>WEEK</span></>, ONCE, FLIP)}
      {f >= HIDE2 && f < DROP + 4 && top(<>THE SAME WORD <span style={{ color: ACCENT }}>AGAIN</span></>, HIDE2, DROP + 4, 96)}
      {f >= HIT + 16 && f < TABLE0 - 6 && top(<>IT HIDES <span style={{ color: ACCENT }}>LESS</span> OFTEN</>, HIT + 16, TABLE0 - 6, 100)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1680, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(6) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1752, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 9</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1580} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["hide", "last", "cannot", "once", "week.", "same", "again.", "themselves,", "less", "often!", "first", "letter,", "most?"]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2]} power={5} svg={svg} html={html} />;
};
