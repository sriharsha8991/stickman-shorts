import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Actor, addPose, idle, walkCycle, type Pose } from "../stickman/stick";
import { COL, FONT } from "../stickman/fx";
import { Stage } from "../stickman/common";
import type { SceneProps } from "./Video";
import type { SfxCue } from "./sfx";
import { GROUND, K, VoiceCaptions } from "../shared/kit";
import { Spark, bulbPulse, type Mood } from "../shared/mascot";
import { G, gestureKeys, hop, nod, shake } from "../shared/gestures";
import { arc, ease, popIn, squash, wobble } from "../shared/motion";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";

// H16 · "Your phone pings. Did you just lose 23 minutes?" (~37 s, promise → build → reveal, Myth check)
// ONE world, wider than the screen, one camera rig:
//  A (x≈0–1250)    a tangerine home office at your desk: the pinging phone wears a price tag (23 MIN); the tag moves to
//                  the wall clock; two OTHER JOB cards appear; a return arrow + clock wedge show what 23 minutes measures.
//  door            Spark runs into the room next door.
//  B (x≈1360–2700) a mint TEST ROOM: two groups, the same email job, one stopwatch each. Only GROUP 2 is interrupted.
//                  pause + music drop → GROUP 2 finishes first, work just as good, then its stopwatch flips into a giant
//                  STRESS gauge and the price tag lands on it: REAL COST (reveal). Back at the desk: phone face down.
// Sources: Mark, Gonzalez & Harris, CHI 2005; Gallup interview 2006; Mark, Gudith & Klocke, CHI 2008.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SS = 1.9;
const STANDY = GROUND - 92.5 * SS;
const FS = 1.7;
const FIGY = GROUND - 92.5 * FS - 140; // workers stand behind solid desks, so only head + arms show

// palette: tangerine office + navy wood · mint test room + pine
const WALL = "#ffbd86";
const WALL2 = "#f79b5e";
const NAVY = "#2e3a68";
const NAVY2 = "#222c52";
const CREAM = "#fff6e8";
const MINT = "#d3f2e2";
const MINT2 = "#aee0c9";
const PINE = "#2c6c59";
const PINE2 = "#1f5344";
const FLOORA = "#a4623a";
const FLOORB = "#8fb7a5";
const TAGC = "#ffd23f";
const RED = "#e8484f";
const GREEN = "#2fb463";
const AMBER = "#f6a623";
const WHITE = "#ffffff";
const INK = COL.ink;

const T = {
  ping0: W(0, 2),
  lose0: W(0, 6),
  n23: W(0, 7),
  c1: C(1),
  end1: W(1, 3),
  real1: W(1, 7),
  c2: C(2),
  number2: W(2, 1),
  else2: W(2, 4),
  c3: C(3),
  ping3: W(3, 2),
  two3: W(3, 6),
  other3: W(3, 7),
  jobs3: W(3, 8),
  c4: C(4),
  ret4: W(4, 2),
  n234: W(4, 4),
  later4: W(4, 6),
  e4: E(4),
  c5: C(5),
  test5: W(5, 2),
  groups5: W(5, 4),
  same5: W(5, 7),
  email5: W(5, 8),
  c6: C(6),
  one6: W(6, 1),
  inter6: W(6, 4),
  e6: E(6),
  c7: C(7),
  fin7: W(7, 3),
  faster7: W(7, 4),
  c8: C(8),
  good8: W(8, 5),
  c9: C(9),
  felt9: W(9, 2),
  stress9: W(9, 4),
  c10: C(10),
  desk10: W(10, 2),
  hour10: W(10, 5),
  no10: W(10, 7),
  c11: C(11),
  stress11: W(11, 3),
  today11: W(11, 5),
};
const LOOP = VOICE_FRAMES - 14;

// --- staging (world coordinates; about 2.5 screens wide) ------------------------------------------------------------
const SX0 = 290; // Spark at the desk
const SXB = 1960; // Spark in the test room
const WALK0 = T.e4 + 2; // desk → test room
const WALK1 = T.c5 + 26;
const BACK0 = T.c10 - 8; // test room → desk
const BACK1 = T.c10 + 26;
const DESK_TOP = 1040;
const LAP = { x: 545 };
const PHONE = { x: 815, w: 150, h: 270 };
const CLK = { x: 180, y: 535, r: 125 };
const CARD1 = { x: 565, y: 560 };
const CARD2 = { x: 850, y: 560 };
const DOOR = 1290;
const D1 = 1640; // group 1 desk
const D2 = 2280; // group 2 desk
const SW1 = { x: 1610, y: 610 };
const SW2 = { x: 2290, y: 610 };
const R0 = 105;
const GAUGE = { x: 1990, y: 525, s: 2.55 };

// --- camera rig: hold → move (ease in-out) → hold. [start, end, focal x, focal y, zoom] ---------------------------
type CamKey = [number, number, number, number, number];
const RIG: CamKey[] = [
  [0, 0, 560, 865, 1.25], // frame 0: Spark + the phone
  [T.c1 - 12, T.c1 + 8, 310, 930, 1.45], // CU Spark (promise)
  [T.c2 - 14, T.c2 + 8, 500, 800, 1.0], // MED: clock + desk
  [WALK0 + 4, WALK0 + 34, 1960, 820, 1.0], // travel through the door into the test room
  [T.c6 - 2, T.c6 + 20, 2015, 835, 1.04], // slow push: the interrupted group
  [T.e6 + 2, T.e6 + 22, 1960, 820, 1.0], // wide again in the pause (settles before the hit)
  [T.c9 - 4, T.c9 + 14, 1985, 820, 1.0], // reveal framing
  [T.c10 - 8, T.c10 + 22, 520, 860, 1.08], // back to the desk (announced by the voice)
  [T.c11 - 10, T.c11 + 10, 330, 930, 1.4], // CU question
  [LOOP, LOOP, 560, 865, 1.25], // cut back into frame 0
];
const camAtRig = (f: number) => {
  let cur = { fx: RIG[0][2], fy: RIG[0][3], z: RIG[0][4] };
  for (const [a, b, fx, fy, z] of RIG) {
    if (f < a) break;
    const k = b <= a ? 1 : interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    cur = { fx: cur.fx + (fx - cur.fx) * k, fy: cur.fy + (fy - cur.fy) * k, z: cur.z + (z - cur.z) * k };
  }
  return { x: cur.fx - 540, y: cur.fy - 960, z: cur.z };
};

// --- helpers ----------------------------------------------------------------------------------------------------------
const Txt: React.FC<{ x?: number; y: number; s: number; c?: string; children: React.ReactNode; a?: "middle" | "start" | "end"; w?: number; o?: number }> = ({
  x = 0,
  y,
  s,
  c = INK,
  children,
  a = "middle",
  w = 900,
  o = 1,
}) => (
  <text x={x} y={y} textAnchor={a} fontFamily={FONT.title} fontWeight={w} fontSize={s} fill={c} opacity={o}>
    {children}
  </text>
);

const Pill: React.FC<{ text: string; fill: string; w: number; s?: number; c?: string }> = ({ text, fill, w, s = 40, c = WHITE }) => (
  <g>
    <rect x={-w / 2} y={-38} width={w} height={76} rx={38} fill={fill} {...K} strokeWidth={5} />
    <Txt y={s * 0.36} s={s} c={c}>
      {text}
    </Txt>
  </g>
);

const Bubble: React.FC<{ w: number; h: number; fill?: string; tail?: number; children: React.ReactNode }> = ({ w, h, fill = WHITE, tail = -30, children }) => (
  <g>
    <path d={`M ${tail - 26} ${h / 2 - 6} L ${tail} ${h / 2 + 36} L ${tail + 26} ${h / 2 - 6} Z`} fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={4} />
    <rect x={tail - 22} y={h / 2 - 10} width={44} height={8} fill={fill} />
    {children}
  </g>
);

// price tag with its hole on top; (0,0) = hole
const PriceTag: React.FC<{ text: string; w?: number; h?: number; s?: number; fill?: string; c?: string }> = ({ text, w = 250, h = 100, s = 56, fill = TAGC, c = INK }) => (
  <g>
    <path
      d={`M ${-30} 0 L 30 0 L ${w / 2} 42 L ${w / 2} ${42 + h} L ${-w / 2} ${42 + h} L ${-w / 2} 42 Z`}
      fill={fill}
      {...K}
      strokeWidth={6}
    />
    <circle cx={0} cy={18} r={9} fill={WHITE} stroke={INK} strokeWidth={4} />
    <Txt y={42 + h / 2 + s * 0.36} s={s} c={c}>
      {text}
    </Txt>
  </g>
);

const Envelope: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-44} y={-30} width={88} height={60} rx={7} fill={WHITE} {...K} strokeWidth={5} />
    <path d="M -44 -28 L 0 8 L 44 -28" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

const Laptop: React.FC<{ fill: number; off?: number }> = ({ fill }) => (
  <g>
    <rect x={-150} y={-208} width={300} height={196} rx={14} fill={NAVY2} {...K} strokeWidth={6} />
    <rect x={-136} y={-194} width={272} height={168} rx={6} fill={CREAM} />
    <Txt y={-146} s={44}>
      YOUR JOB
    </Txt>
    {[0, 1].map((i) => (
      <line key={i} x1={-108} y1={-120 + i * 24} x2={i ? 54 : 108} y2={-120 + i * 24} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.3} />
    ))}
    <rect x={-112} y={-62} width={224} height={22} rx={11} fill={WHITE} stroke={INK} strokeWidth={4} />
    <rect x={-110} y={-60} width={220 * fill} height={18} rx={9} fill={GREEN} />
    <path d="M -180 -12 L 180 -12 L 196 0 L -196 0 Z" fill="#cfd4e3" {...K} strokeWidth={6} />
  </g>
);

// the phone standing on a little stand; (0,0) = bottom centre. flat 0..1 = laid face down.
const PhoneProp: React.FC<{ f: number; ring: number; flat: number; at: number }> = ({ f, ring, flat, at }) => {
  const { w, h } = PHONE;
  const buzz = ring > 0.5 ? 5 * Math.sin(f * 2.1) : 0;
  const rot = flat > 0 ? flat * 90 : 0;
  return (
    <g transform={`translate(${buzz} 0)`}>
      <g transform={`translate(${-140 * flat} ${-w * (1 - 0.8 * flat) * 0.5 * flat}) rotate(${rot}) scale(${1 - 0.8 * flat} 1)`}>
        <rect x={-w / 2} y={-h} width={w} height={h} rx={24} fill={NAVY2} {...K} strokeWidth={6} />
        <rect x={-w / 2 + 11} y={-h + 18} width={w - 22} height={h - 36} rx={10} fill={flat > 0.5 ? NAVY : "#fff3cf"} />
        {flat < 0.5 && (
          <g transform={`translate(0 ${-h + 96}) rotate(${ring > 0.5 ? 16 * Math.sin((f - at) * 0.9) : 0})`}>
            <path d="M -36 18 Q -30 -40 0 -44 Q 30 -40 36 18 L 46 30 L -46 30 Z" fill={RED} {...K} strokeWidth={5} />
            <circle cx={0} cy={38} r={10} fill={INK} />
          </g>
        )}
        {flat < 0.5 && (
          <Txt y={-44} s={32} c={INK}>
            PING!
          </Txt>
        )}
      </g>
      {ring > 0.01 &&
        [0, 1, 2].map((i) => {
          const p = ((f + i * 9) % 27) / 27;
          return <circle key={i} cx={0} cy={-h / 2} r={h * 0.55 + p * 140} fill="none" stroke={RED} strokeWidth={7} opacity={ring * (1 - p) * 0.85} />;
        })}
    </g>
  );
};

// a stopwatch that can flip over into a stress gauge; (0,0) = centre, radius R0.
// flip: 0 stopwatch → 1 gauge. hand = stopwatch hand angle. needle in degrees (-90 = far left, 90 = far right)
const Dial: React.FC<{ hand: number; flip: number; needle: number; done?: boolean }> = ({ hand, flip, needle, done }) => {
  const showGauge = flip > 0.5;
  const sx = Math.max(0.03, Math.abs(Math.cos(flip * Math.PI)));
  const r = R0 - 16;
  const bend = (a: number, b: number) => {
    const p = (d: number) => [r * Math.sin((d * Math.PI) / 180), 12 - r * Math.cos((d * Math.PI) / 180)];
    const [x0, y0] = p(a);
    const [x1, y1] = p(b);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  return (
    <g transform={`scale(${sx} 1)`}>
      <rect x={-16} y={-R0 - 26} width={32} height={22} rx={5} fill={NAVY} {...K} strokeWidth={5} />
      <circle cx={0} cy={0} r={R0} fill={done && !showGauge ? "#d7f6e1" : WHITE} {...K} strokeWidth={8} />
      {!showGauge && (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={0} y1={-R0 + 12} x2={0} y2={-R0 + (i % 3 ? 22 : 30)} stroke={INK} strokeWidth={i % 3 ? 3 : 6} transform={`rotate(${i * 30})`} />
          ))}
          <line x1={0} y1={14} x2={0} y2={-R0 + 30} stroke={done ? GREEN : RED} strokeWidth={8} strokeLinecap="round" transform={`rotate(${hand})`} />
          <circle cx={0} cy={0} r={11} fill={INK} />
          {done && (
            <path d="M -26 34 L -6 54 L 30 18" fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      )}
      {showGauge && (
        <g>
          <path d={bend(-82, -28)} fill="none" stroke={GREEN} strokeWidth={22} />
          <path d={bend(-28, 28)} fill="none" stroke={AMBER} strokeWidth={22} />
          <path d={bend(28, 82)} fill="none" stroke={RED} strokeWidth={22} />
          <line x1={0} y1={12} x2={0} y2={12 - r + 22} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${needle} 0 12)`} />
          <circle cx={0} cy={12} r={12} fill={INK} />
          <Txt y={62} s={28}>
            STRESS
          </Txt>
        </g>
      )}
    </g>
  );
};

const World: React.FC<{ f: number; dim: number; burst: number }> = ({ f, dim, burst }) => (
  <g>
    {/* ----- A: tangerine home office ----- */}
    <rect x={-700} y={-700} width={DOOR + 700} height={1990} fill={WALL} />
    <rect x={-700} y={880} width={DOOR + 700} height={420} fill={WALL2} />
    <rect x={-700} y={868} width={DOOR + 700} height={18} fill={NAVY} />
    {/* window with a small evening view, high on the wall, away from the action */}
    <g transform="translate(1110 500)">
      <rect x={-90} y={-180} width={180} height={300} fill="#ffe7b0" {...K} strokeWidth={8} />
      <circle cx={26} cy={-74} r={38} fill="#ff8f4f" />
      <path d="M -86 60 L -40 10 L 0 44 L 44 -4 L 86 42 L 86 116 L -86 116 Z" fill="#c76a3a" />
      <line x1={0} y1={-180} x2={0} y2={120} stroke={INK} strokeWidth={6} />
      <line x1={-90} y1={-30} x2={90} y2={-30} stroke={INK} strokeWidth={6} />
    </g>
    {/* plant on the floor at the far left */}
    <g transform={`translate(-30 ${GROUND})`}>
      <path d="M 0 -120 Q -70 -220 -50 -300 Q 0 -240 0 -120 Q 70 -220 60 -310 Q 4 -240 0 -120" fill={PINE} {...K} strokeWidth={5} />
      <path d="M -50 -120 L 50 -120 L 36 0 L -36 0 Z" fill={CREAM} {...K} strokeWidth={6} />
    </g>
    {/* ----- door frame between the two places ----- */}
    <rect x={DOOR - 10} y={-700} width={70} height={1990} fill={NAVY} />
    <rect x={DOOR + 60} y={-700} width={10} height={1990} fill={INK} opacity={0.3} />
    {/* ----- B: mint test room ----- */}
    <rect x={DOOR + 60} y={-700} width={2400} height={1990} fill={MINT} />
    {burst > 0.01 && (
      <g clipPath="url(#h16room)" opacity={burst}>
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d="M 0 0 L 1500 -170 L 1500 170 Z"
            fill="#ffc9b4"
            transform={`translate(${GAUGE.x} ${GAUGE.y}) rotate(${i * 22.5 + f * 0.12})`}
          />
        ))}
      </g>
    )}
    <rect x={DOOR + 60} y={1000} width={2400} height={300} fill={MINT2} />
    <rect x={DOOR + 60} y={986} width={2400} height={16} fill={PINE} />
    {/* ----- floors ----- */}
    <rect x={-700} y={GROUND} width={DOOR + 700} height={1200} fill={FLOORA} />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-700} y1={GROUND + 40 + i * 70 + i * i * 6} x2={DOOR} y2={GROUND + 40 + i * 70 + i * i * 6} stroke="#8d5230" strokeWidth={5} />
    ))}
    <rect x={DOOR - 10} y={GROUND} width={2600} height={1200} fill={FLOORB} />
    {Array.from({ length: 16 }, (_, i) => (
      <line key={i} x1={DOOR + 90 + i * 150} y1={GROUND} x2={DOOR + 90 + i * 150} y2={2500} stroke="#7aa391" strokeWidth={5} />
    ))}
    <rect x={-700} y={GROUND - 4} width={4800} height={10} fill={INK} opacity={0.35} />
    {dim > 0.01 && <rect x={DOOR + 70} y={-700} width={2400} height={3200} fill={INK} opacity={dim} />}
  </g>
);

// --- sound ------------------------------------------------------------------------------------------------------------
export const S01_SFX: SfxCue[] = [
  [1, "ding", 0.3],
  [T.ping0, "ding", 0.26],
  [T.n23, "pop", 0.16],
  [T.c1 - 10, "whoosh", 0.1],
  [T.real1, "pop", 0.18],
  [T.c2 - 10, "whoosh", 0.1],
  [T.number2 + 2, "swish", 0.2],
  [T.number2 + 22, "thud", 0.2],
  [T.ping3, "ding", 0.16],
  [T.two3, "pop", 0.2],
  [T.other3 + 4, "pop", 0.2],
  [T.ret4, "swish", 0.16],
  [T.later4 - 2, "ding", 0.14],
  [WALK0 + 4, "whoosh_long", 0.16],
  [T.groups5, "pop", 0.16],
  [T.same5, "stamp", 0.14],
  [T.email5 + 2, "tick", 0.14],
  [T.one6 + 6, "buzz", 0.1],
  [T.inter6 - 2, "ding", 0.2],
  [T.inter6 + 16, "ding", 0.16],
  [T.fin7, "ding", 0.42],
  [T.fin7 + 2, "pop", 0.2],
  [T.good8, "kaching", 0.16],
  [T.felt9 - 2, "swish", 0.2],
  [T.stress9 - 3, "impact", 0.42],
  [T.stress9 + 2, "stamp", 0.22],
  [T.stress9 + 6, "thud", 0.2],
  [BACK0, "whoosh_long", 0.16],
  [T.hour10, "pop", 0.18],
  [T.no10 + 2, "thud", 0.24],
  [T.c11 - 2, "pop", 0.12],
  [LOOP, "ding", 0.28],
];

export const S01Ping: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const loopBack = f >= LOOP - 2;
  const cam = camAtRig(f);
  const away = f >= WALK0 + 34 && f < BACK0 + 20; // nothing at the desk is on screen
  const backHome = f >= BACK0 + 20 && !loopBack;

  // ---------------- desk: phone + price tag + clock ----------------
  const ringing = loopBack || f < T.lose0 + 20 || (f >= T.ping3 - 2 && f < T.ping3 + 26);
  const flatK = !loopBack && f >= T.no10 - 4 ? interpolate(f, [T.no10 - 4, T.no10 + 4], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const tagFly = loopBack ? 0 : interpolate(f, [T.number2 + 2, T.number2 + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tagPos = arc(tagFly, [PHONE.x, 640], [CLK.x, CLK.y + CLK.r + 4], 110);
  const tagSwing = wobble(f, tagFly >= 1 ? T.number2 + 22 : 0, 10, 12) + (f < T.number2 ? 4 * Math.sin(f * 0.16) : 0);
  const tagOn = !away && !backHome && f < WALK0 + 40;
  const askK = !loopBack && f >= T.real1 - 4 && f < T.c2 - 6 ? popIn(f, T.real1 - 4) : 0;
  const wedge = !backHome && !loopBack ? interpolate(f, [T.ret4, T.later4], [0, 138], clamp) : 0;
  const minuteHand = wedge;

  // ---------------- other jobs + arrows ----------------
  const CARDS = [T.two3, T.other3 + 4];
  const cardK = (i: number) => (!loopBack && !away && !backHome && f >= CARDS[i] ? popIn(f, CARDS[i]) : 0);
  const a1 = interpolate(f, [T.two3 - 6, T.two3 + 4], [0, 1], clamp);
  const a2 = interpolate(f, [T.other3 + 2, T.other3 + 14], [0, 1], clamp);
  const a3 = interpolate(f, [T.ret4, T.n234 + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const retK = !loopBack && !away && !backHome && f >= T.later4 - 2 ? popIn(f, T.later4 - 2) : 0;

  // ---------------- test room ----------------
  const running1 = f >= T.email5 && !loopBack;
  const STOP2 = T.fin7;
  const STOP1 = T.good8;
  const handAt = (t: number) => Math.max(0, t - T.email5) * 9;
  const hand1 = running1 ? handAt(Math.min(f, STOP1)) : 0;
  const hand2 = running1 ? handAt(Math.min(f, STOP2)) : 0;
  const done2 = f >= STOP2;
  const done1 = f >= STOP1;
  const FLIPAT = T.c9 + 2;
  const flip2 = interpolate(f, [FLIPAT, FLIPAT + 9], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const flip1 = interpolate(f, [FLIPAT + 6, FLIPAT + 15], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const antic = interpolate(f, [T.c9 - 6, T.c9 + 2, T.c9 + 6], [1, 0.9, 1], clamp);
  const GROW0 = FLIPAT + 4;
  const GROW1 = T.stress9 + 2;
  const grow = interpolate(f, [GROW0, GROW1], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 1.45, 0.5, 1) });
  const gaugeX = SW2.x + (GAUGE.x - SW2.x) * grow;
  const gaugeY = SW2.y + (GAUGE.y - SW2.y) * grow;
  const gaugeS = 1 + (GAUGE.s - 1) * grow;
  const needle2 = (() => {
    const base = interpolate(f, [T.felt9, T.stress9], [-72, 70], { ...clamp, easing: Easing.in(Easing.cubic) });
    if (f < T.stress9) return base;
    return 62 + 16 * Math.exp(-(f - T.stress9) / 7) * Math.cos((f - T.stress9) * 0.9) + 2 * Math.sin(f * 0.8);
  })();
  const burst = interpolate(f, [T.stress9 - 3, T.stress9 + 6], [0, 1], clamp);
  const dim = interpolate(f, [T.e6 + 2, T.e6 + 14, T.c7 - 2, T.c7 + 6], [0, 0.16, 0.16, 0], clamp);
  const tagDrop = T.stress9 - 8;
  const realK = f >= tagDrop && f < BACK0 + 4;
  const realY = realK ? interpolate(f, [tagDrop, tagDrop + 10], [-280, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const realSq = squash(f, tagDrop + 10, 0.18);

  const sign = f >= T.same5 - 2 ? popIn(f, T.same5 - 2) * interpolate(f, [FLIPAT - 4, FLIPAT + 4], [1, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
  const pillY = ease(f, FLIPAT, FLIPAT + 14, 450, 1165);
  const groupK = f >= T.groups5 ? popIn(f, T.groups5) : 0;
  const inter = f >= T.inter6 - 4;
  const enve = f >= T.email5 - 2 ? popIn(f, T.email5 - 2) : 0;
  const whoK = f >= T.e6 + 12 && f < T.fin7 - 4 ? popIn(f, T.e6 + 12) * interpolate(f, [T.fin7 - 12, T.fin7 - 4], [1, 0], clamp) : 0;
  const firstK = f >= T.fin7 && f < FLIPAT ? popIn(f, T.fin7) : 0;
  const goodK = f >= T.good8 - 4 && f < FLIPAT ? popIn(f, T.good8 - 4) : 0;
  const sheet1 = f >= T.c8 + 6 && f < FLIPAT ? popIn(f, T.c8 + 6) : 0;
  const sheet2 = f >= T.c8 + 14 && f < FLIPAT ? popIn(f, T.c8 + 14) : 0;
  // interruptions pop around group 2: phone call, chat
  const POPS: [number, number, number, string][] = [
    [T.one6 + 6, D2 + 150, 790, "RING!"],
    [T.inter6 - 2, D2 - 148, 790, "HEY!"],
    [T.inter6 + 16, D2 + 158, 900, "RING!"],
  ];
  const popOut = interpolate(f, [T.e6 + 6, T.e6 + 14], [1, 0], clamp);

  // ---------------- back at the desk ----------------
  const hourK = backHome && f >= T.hour10 - 2 && f < T.c11 + 12 ? popIn(f, T.hour10 - 2) : 0;
  const lapFill = loopBack ? 0.3 : backHome ? interpolate(f, [T.no10 + 2, T.c11 + 40], [0.3, 0.86], clamp) : 0.3;
  const questionK = !loopBack && f >= T.c11 - 4 ? popIn(f, T.c11 - 4) : 0;

  // --- Spark ---
  const sparkX = (t: number) => {
    if (t >= LOOP - 2) return SX0;
    if (t < WALK0) return SX0;
    if (t < BACK0) return ease(t, WALK0, WALK1, SX0, SXB);
    return ease(t, BACK0, BACK1, SXB, SX0);
  };
  const sparkKeys = gestureKeys([
    [0, G.recoil],
    [T.lose0, G.shrugBig, "smooth"],
    [T.n23 + 8, G.pointSide, "smooth"],
    [T.c1, G.stop, "snap"],
    [T.end1, G.pointUp, "smooth"],
    [T.real1, G.doublePoint, "snap"],
    [T.c2, G.thinkChin, "smooth"],
    [T.number2, G.armsCrossed, "smooth"],
    [T.c3, G.present, "smooth"],
    [T.ping3, G.recoil, "snap"],
    [T.two3 - 2, G.count2, "snap"],
    [T.jobs3 + 6, G.pointSide, "smooth"],
    [T.ret4, G.doublePoint, "smooth"],
    [T.n234, G.handsHips, "smooth"],
    [T.later4, G.pointDown, "smooth"],
    [WALK0, G.rest, "smooth"],
    [T.c5 + 10, G.present, "smooth"],
    [T.same5, G.presentBoth, "snap"],
    [T.c6, G.pointSide, "smooth"],
    [T.inter6, G.doublePoint, "snap"],
    [T.e6 + 8, G.thinkChin, "smooth"],
    [T.c7, G.leanIn, "smooth"],
    [T.fin7 - 2, G.recoil, "snap"],
    [T.faster7 + 4, G.pointSide, "smooth"],
    [T.c8 + 4, G.shrugBig, "smooth"],
    [T.good8, G.celebrate, "snap"],
    [T.c9, G.leanIn, "smooth"],
    [T.felt9, G.recoil, "smooth"], // anticipation before the big reaction
    [T.stress9 - 2, G.mindBlown, "snap"],
    [BACK0, G.rest, "smooth"],
    [T.desk10, G.pointDown, "smooth"],
    [T.hour10, G.count1, "snap"],
    [T.no10, G.pointDown, "snap"],
    [T.no10 + 18, G.handsHips, "smooth"],
    [T.c11, G.beckon, "smooth"],
    [T.stress11, G.leanIn, "smooth"],
    [T.today11, G.doublePoint, "snap"],
    [LOOP - 2, G.recoil, "snap"],
  ]);
  const mood = (t: number): Mood => {
    if (t >= LOOP - 2) return "shock";
    if (t < T.lose0) return "shock";
    if (t < T.c1) return "worried";
    if (t < T.real1) return "determined";
    if (t < T.c2) return "wink";
    if (t < T.c3) return "skeptical";
    if (t < T.two3) return "curious";
    if (t < T.ret4) return "thinking";
    if (t < WALK0) return "happy";
    if (t < T.c6) return "excited";
    if (t < T.e6 + 8) return "curious";
    if (t < T.fin7 - 2) return "thinking";
    if (t < T.c8) return "shock";
    if (t < T.c9) return "laugh";
    if (t < T.stress9 - 2) return "worried";
    if (t < BACK0) return "mindblown";
    if (t < T.c11) return "determined";
    if (t < T.today11) return "curious";
    return "wink";
  };
  const bulb = (t: number) => Math.max(bulbPulse(t, T.stress9 - 2, 60), bulbPulse(t, T.later4 - 2, 14) * 0.6);
  const walking = (t: number) => t < LOOP - 2 && ((t >= WALK0 && t < WALK1) || (t >= BACK0 && t < BACK1));
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    if (walking(t)) q = addPose(q, walkCycle(t - WALK0, 0.42));
    q = addPose(q, hop(t, T.stress9, 26));
    q = addPose(q, hop(t, T.fin7, 14));
    q = addPose(q, nod(t, T.good8 + 4, 2));
    q = addPose(q, shake(t, T.else2 - 8, 2));
    return { ...q, x: sparkX(t) };
  };
  const sparkFacing = (t: number) => (t >= BACK0 && t < BACK1 ? -1 : 1);

  // workers
  const type1 = (t: number, seed: number) => ({ ra2: 8 * Math.sin(t * 0.7 + seed), la2: 8 * Math.sin(t * 0.7 + seed + 2) });
  const typing = { ra1: 58, ra2: 62, la1: -58, la2: -62 };
  const g1Keys = gestureKeys([
    [0, typing],
    [T.good8 + 2, G.fistPump, "smooth"],
    [FLIPAT + 8, G.rest, "smooth"],
  ]);
  const g2Keys = gestureKeys([
    [0, typing],
    [T.one6 + 6, { ...typing, head: 14, lean: 5 }, "snap"],
    [T.inter6, { ...typing, head: -14, lean: -5 }, "snap"],
    [T.e6 + 4, typing, "smooth"],
    [T.fin7, G.celebrate, "snap"],
    [T.c9 - 2, G.rest, "smooth"],
    [T.felt9, G.mindBlown, "snap"],
  ]);
  const g1Mod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t + 5, 3));
    if (t >= T.email5 && t < T.good8) q = addPose(q, type1(t, 1));
    return q;
  };
  const g2Mod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t + 13, 3));
    if (t >= T.email5 && t < T.fin7) q = addPose(q, type1(t, 3));
    q = addPose(q, hop(t, T.fin7, 8));
    if (t >= T.felt9 && t < BACK0) q = addPose(q, { lean: 3 * Math.sin(t * 1.6), head: 4 * Math.sin(t * 1.1) });
    return q;
  };
  const steam = f >= T.felt9 + 6 && f < BACK0 + 6;

  const svg = (
    <>
      <defs>
        <clipPath id="h16room">
          <rect x={DOOR + 70} y={-700} width={2400} height={GROUND + 700} />
        </clipPath>
      </defs>
      <World f={f} dim={dim} burst={burst} />

      {/* ---------- A: wall clock ---------- */}
      <g transform={`translate(${CLK.x} ${CLK.y})`}>
        <circle cx={0} cy={0} r={CLK.r} fill={WHITE} {...K} strokeWidth={9} />
        {wedge > 0.5 && (
          <path
            d={`M 0 0 L 0 ${-CLK.r + 12} A ${CLK.r - 12} ${CLK.r - 12} 0 ${wedge > 180 ? 1 : 0} 1 ${(CLK.r - 12) * Math.sin((wedge * Math.PI) / 180)} ${-(CLK.r - 12) * Math.cos((wedge * Math.PI) / 180)} Z`}
            fill={TAGC}
            opacity={0.9}
          />
        )}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={0} y1={-CLK.r + 10} x2={0} y2={-CLK.r + 28} stroke={INK} strokeWidth={6} transform={`rotate(${i * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-58} stroke={INK} strokeWidth={10} strokeLinecap="round" transform="rotate(300)" />
        <line x1={0} y1={0} x2={0} y2={-CLK.r + 28} stroke={RED} strokeWidth={8} strokeLinecap="round" transform={`rotate(${minuteHand})`} />
        <circle cx={0} cy={0} r={12} fill={INK} />
      </g>

      {/* ---------- A: desk ---------- */}
      <rect x={380} y={DESK_TOP} width={640} height={30} rx={8} fill={NAVY} {...K} strokeWidth={6} />
      <rect x={410} y={DESK_TOP + 30} width={32} height={GROUND - DESK_TOP - 30} fill={NAVY2} {...K} strokeWidth={5} />
      <rect x={958} y={DESK_TOP + 30} width={32} height={GROUND - DESK_TOP - 30} fill={NAVY2} {...K} strokeWidth={5} />
      <rect x={760} y={DESK_TOP + 30} width={200} height={110} rx={6} fill={NAVY} {...K} strokeWidth={5} />
      <circle cx={860} cy={DESK_TOP + 85} r={9} fill={TAGC} {...K} strokeWidth={3} />
      <g transform={`translate(${LAP.x} ${DESK_TOP})`}>
        <Laptop fill={lapFill} />
      </g>
      <g transform={`translate(${PHONE.x} ${DESK_TOP})`}>
        <PhoneProp f={f} ring={ringing ? 1 : 0} flat={flatK} at={0} />
      </g>

      {/* ---------- A: other jobs + arrows ---------- */}
      {!away && !backHome && !loopBack && f >= T.two3 - 6 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {a1 > 0.02 && <path d={`M ${LAP.x} 830 C ${LAP.x - 20} 760 ${CARD1.x - 10} 720 ${CARD1.x} 648`} stroke={INK} strokeWidth={10} pathLength={1} strokeDasharray={`${a1} 1`} />}
          {a2 > 0.02 && <path d={`M ${CARD1.x + 125} ${CARD1.y} L ${CARD2.x - 125} ${CARD2.y}`} stroke={INK} strokeWidth={10} pathLength={1} strokeDasharray={`${a2} 1`} />}
          {a3 > 0.02 && <path d={`M ${CARD2.x - 40} 648 C ${CARD2.x - 60} 720 770 770 ${LAP.x + 172} 850`} stroke={GREEN} strokeWidth={14} pathLength={1} strokeDasharray={`${a3} 1`} />}
          {a3 >= 1 && <path d={`M ${LAP.x + 214} 836 L ${LAP.x + 170} 852 L ${LAP.x + 178} 806`} stroke={GREEN} strokeWidth={14} />}
          {a2 >= 1 && <path d={`M ${CARD2.x - 150} ${CARD2.y - 24} L ${CARD2.x - 125} ${CARD2.y} L ${CARD2.x - 150} ${CARD2.y + 24}`} stroke={INK} strokeWidth={10} />}
        </g>
      )}
      {[CARD1, CARD2].map((c, i) => {
        const k = cardK(i);
        if (k < 0.01) return null;
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${k}) rotate(${(i ? 2 : -2) + wobble(f, CARDS[i], 5)})`}>
            <rect x={-122} y={-85} width={244} height={170} rx={12} fill={CREAM} {...K} strokeWidth={6} />
            <Txt y={-18} s={46}>
              OTHER
            </Txt>
            <Txt y={38} s={46}>
              JOB {i + 1}
            </Txt>
          </g>
        );
      })}
      {retK > 0.01 && (
        <g transform={`translate(700 410) scale(${retK})`}>
          <Pill text="TIME TO RETURN" fill={GREEN} w={420} s={44} />
        </g>
      )}

      {/* the price tag: hangs over the phone, then on the clock */}
      {tagOn && (
        <g transform={`translate(${tagPos[0]} ${tagPos[1]}) rotate(${tagSwing})`}>
          {tagFly <= 0 && <line x1={0} y1={18} x2={0} y2={130} stroke={INK} strokeWidth={5} />}
          <g transform={tagFly <= 0 ? "translate(0 -125)" : "translate(0 0)"}>
            <PriceTag text="23 MIN" />
          </g>
        </g>
      )}
      {askK > 0.01 && (
        <g transform={`translate(${SX0 + 90} 650) scale(${askK}) rotate(${wobble(f, T.real1 - 4, 5)})`}>
          <Bubble w={430} h={120} fill={TAGC} tail={-60}>
            <Txt y={20} s={58}>
              REAL COST = ?
            </Txt>
          </Bubble>
        </g>
      )}

      {/* ---------- B: test room ---------- */}
      {sign > 0.01 && (
        <g transform={`translate(1960 330) scale(${sign}) rotate(${-1 + wobble(f, T.same5, 3)})`}>
          <rect x={-320} y={-50} width={640} height={100} rx={12} fill={PINE} {...K} strokeWidth={6} />
          <Txt y={21} s={58} c={WHITE}>
            SAME EMAIL JOB
          </Txt>
        </g>
      )}

      {/* the workers stand behind solid desks */}
      <Actor f={f} color={COL.blue} scale={FS} base={{ x: D1, y: FIGY }} keys={g1Keys} mod={g1Mod} facing={1} face="happy" trails={false} />
      <Actor f={f} color={COL.orange} scale={FS} base={{ x: D2, y: FIGY }} keys={g2Keys} mod={g2Mod} facing={-1} face={f >= T.felt9 ? "sad" : "happy"} trails={false} />
      {steam &&
        [0, 1, 2, 3].map((i) => {
          const p = ((f + i * 8) % 32) / 32;
          const x = D2 + (i % 2 ? 1 : -1) * (46 + 40 * p);
          return <circle key={i} cx={x} cy={838 - 130 * p} r={14 + 22 * p} fill={WHITE} stroke={INK} strokeWidth={3} opacity={(1 - p) * 0.9} />;
        })}
      {[D1, D2].map((x, i) => (
        <g key={x}>
          <rect x={x - 180} y={DESK_TOP} width={360} height={GROUND - DESK_TOP} rx={8} fill={i ? PINE : PINE2} {...K} strokeWidth={6} />
          <rect x={x - 180} y={DESK_TOP} width={360} height={26} fill={INK} opacity={0.18} />
          {/* laptop back with the job on it */}
          <rect x={x - 105} y={DESK_TOP - 124} width={210} height={126} rx={10} fill="#cfd4e3" {...K} strokeWidth={6} />
          {enve > 0.01 && (
            <g transform={`translate(${x} ${DESK_TOP - 62}) scale(${enve})`}>
              <Envelope />
            </g>
          )}
        </g>
      ))}

      {groupK > 0.01 && (
        <>
          <g transform={`translate(${SW1.x} ${pillY}) scale(${groupK})`}>
            <Pill text="GROUP 1" fill={COL.blue} w={230} />
          </g>
          <g transform={`translate(${SW2.x - 10} ${pillY}) scale(${groupK * (inter ? 1 + wobble(f, T.inter6 - 4, 0.05) / 10 : 1)})`}>
            <Pill text={inter ? "INTERRUPTED" : "GROUP 2"} fill={inter ? RED : COL.orange} w={inter ? 350 : 230} />
          </g>
        </>
      )}

      {f >= WALK0 && (
        <g transform={`translate(${SW1.x} ${SW1.y}) rotate(${wobble(f, T.good8, 4)})`}>
          <Dial hand={hand1} flip={flip1} needle={-54 + 2 * Math.sin(f * 0.1)} done={done1} />
        </g>
      )}
      {f >= WALK0 && (
        <g transform={`translate(${gaugeX} ${gaugeY}) scale(${gaugeS * antic}) rotate(${f >= T.fin7 && f < FLIPAT ? wobble(f, T.fin7, 6) : 0})`}>
          <Dial hand={hand2} flip={flip2} needle={needle2} done={done2} />
        </g>
      )}

      {/* interruptions around group 2 */}
      {POPS.map(([at, x, y, txt], i) => {
        if (f < at || f > T.e6 + 14) return null;
        const k = popIn(f, at) * popOut;
        const shakeX = 3 * Math.sin((f - at) * 1.4);
        return (
          <g key={i} transform={`translate(${x + shakeX} ${y}) scale(${k}) rotate(${(i % 2 ? -5 : 5) + wobble(f, at, 8)})`}>
            <Bubble w={150} h={84} fill={txt === "RING!" ? "#ffd9d9" : "#fff6c9"} tail={x > D2 ? -36 : 36}>
              <Txt y={13} s={36} c={INK}>
                {txt}
              </Txt>
            </Bubble>
          </g>
        );
      })}
      {whoK > 0.01 && (
        <g transform={`translate(1960 745) scale(${whoK})`}>
          <Bubble w={340} h={120} fill={WHITE} tail={0}>
            <Txt y={-8} s={40}>
              WHO FINISHES
            </Txt>
            <Txt y={38} s={40}>
              FIRST?
            </Txt>
          </Bubble>
        </g>
      )}
      {firstK > 0.01 && (
        <g transform={`translate(${SW2.x - 20} 735) scale(${firstK}) rotate(${-2 + wobble(f, T.fin7, 6)})`}>
          <Pill text="FINISHED FIRST" fill={GREEN} w={400} s={44} />
        </g>
      )}
      {sheet1 > 0.01 && (
        <g transform={`translate(${D1} ${DESK_TOP - 34}) scale(${0.8 * sheet1}) rotate(-3)`}>
          <rect x={-84} y={-100} width={168} height={200} rx={8} fill={WHITE} {...K} strokeWidth={6} />
          <path d="M -46 2 L -12 42 L 52 -44" fill="none" stroke={GREEN} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {sheet2 > 0.01 && (
        <g transform={`translate(${D2} ${DESK_TOP - 34}) scale(${0.8 * sheet2}) rotate(3)`}>
          <rect x={-84} y={-100} width={168} height={200} rx={8} fill={WHITE} {...K} strokeWidth={6} />
          <path d="M -46 2 L -12 42 L 52 -44" fill="none" stroke={GREEN} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {goodK > 0.01 && (
        <g transform={`translate(1950 640) scale(${goodK})`}>
          <Pill text="JUST AS GOOD" fill={WHITE} c={GREEN} w={410} s={50} />
        </g>
      )}

      {/* ---------- REVEAL: the price tag lands on the stress gauge ---------- */}
      {realK && (
        <g transform={`translate(${GAUGE.x} ${GAUGE.y - 292 + realY}) scale(${realSq[0]} ${realSq[1]}) rotate(${wobble(f, tagDrop + 10, 5, 12)})`}>
          <g transform="translate(0 -115)">
            <PriceTag text="REAL COST" w={430} h={92} s={66} fill={TAGC} />
          </g>
        </g>
      )}

      {/* ---------- desk, last beat ---------- */}
      {hourK > 0.01 && (
        <g transform={`translate(${LAP.x + 90} 700) scale(${hourK}) rotate(${-2 + wobble(f, T.hour10, 5)})`}>
          <Pill text="1 HOUR, NO PINGS" fill={GREEN} w={520} s={46} />
        </g>
      )}
      {questionK > 0.01 && (
        <g transform={`translate(${SX0 + 90} 660) scale(${questionK}) rotate(${wobble(f, T.c11 - 4, 5)})`}>
          <Bubble w={450} h={150} fill={WHITE} tail={-60}>
            <Txt y={-10} s={52}>
              DID A PING
            </Txt>
            <Txt y={48} s={52}>
              STRESS YOU?
            </Txt>
          </Bubble>
        </g>
      )}

      <Spark f={f} trails={false} scale={SS} base={{ x: SX0, y: STANDY }} talk={(t) => mouthAt(t)} bulb={bulb} mood={mood} look={1} keys={sparkKeys} mod={sparkMod} facing={sparkFacing} />
    </>
  );

  const html = (
    <>
      {(f < T.c1 - 4 || loopBack) && (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            top: 262,
            textAlign: "center",
            fontFamily: FONT.title,
            fontWeight: 900,
            lineHeight: 1.0,
            fontSize: 118,
            color: TAGC,
            WebkitTextStroke: `10px ${INK}`,
            paintOrder: "stroke fill",
            transform: `rotate(-2deg) scale(${1 + wobble(f, loopBack ? LOOP : 0, 0.03, 8)})`,
            opacity: loopBack ? 1 : interpolate(f, [T.c1 - 14, T.c1 - 4], [1, 0], clamp),
          }}
        >
          LOSE 23 MINUTES?
        </div>
      )}
      {f >= 300 && f < LOOP - 4 && (
        <>
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 1700,
              transform: "translate(-50%,-50%)",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 21,
              color: INK,
              whiteSpace: "nowrap",
              opacity: 0.9,
              background: "rgba(255,255,255,0.85)",
              padding: "2px 12px",
              borderRadius: 8,
            }}
          >
            {f < WALK0 + 10
              ? "Gloria Mark, UC Irvine · office study 2005 + Gallup interview 2006"
              : f < BACK0
                ? "Mark et al., CHI 2008 · one small test: 48 people, mostly students · gauge is an illustration"
                : "A tip to try, not a study result"}
          </div>
          <div
            style={{
              position: "absolute",
              right: 96,
              top: 1745,
              fontFamily: FONT.title,
              fontWeight: 900,
              fontSize: 27,
              color: TAGC,
              WebkitTextStroke: `1px ${INK}`,
              letterSpacing: 2,
              opacity: 0.95,
              background: "rgba(20,20,40,0.55)",
              padding: "2px 10px",
              borderRadius: 8,
            }}
          >
            MYTH CHECK
          </div>
        </>
      )}
      <VoiceCaptions
        f={f}
        y={1570}
        cues={VOICE_CUES}
        hi={["ping", "pings", "23", "minutes", "cost", "end", "else", "two", "jobs", "return", "test", "same", "email", "interrupted", "faster", "good", "stress", "hour"]}
      />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: WALL }} />} cam={cam} hits={[]} power={4} svg={svg} html={html} />;
};
