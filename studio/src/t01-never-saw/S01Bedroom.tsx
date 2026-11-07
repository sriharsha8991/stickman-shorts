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
import { CaptionBand, Doodle, GRAPHITE, Hatch, PAPER, PAPER2, Paper, PencilDefs, SketchBox, SketchLine, SOFT } from "../shared/doodle";
import { MrTrick } from "../shared/mrtrick";
import { VOICE_CUES, VOICE_FRAMES, mouthAt } from "./voice";
// T01 · "Why might you remember one word you never saw?" Spark Got Tricked #8 (PLAY, pencil look, 35.2 s).
// ONE world, one camera rig: a pencil bedroom at night. A roller list hangs on the wall (left), Spark sits up in bed (right),
// a lamp on the nightstand is the light, a small TV on the dresser further right.
// The viewer reads 15 words (picture fully still). Spark "remembers" SLEEP (magenta) in his thought bubble. The list rolls back:
// SLEEP was never there; the word cracks, falls and smashes on the blanket. Lines from BED and DREAM (then the whole list) run
// into his head, where his brain drew SLEEP. The TV shows the lab test: people heard lists like this and still wrote SLEEP.
// Roediger & McDermott 1995 (JEP:LMC 21:803), Exp. 2: see facts.md.

const W = (cue: number, word: number) => VOICE_CUES[cue].words[Math.min(word, VOICE_CUES[cue].words.length - 1)].s;
const C = (cue: number) => VOICE_CUES[cue].startFrame;
const E = (cue: number) => VOICE_CUES[cue].endFrame;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const eio = Easing.inOut(Easing.cubic);
const eoB = Easing.bezier(0.2, 0.9, 0.3, 1.14);

const ACCENT = "#c2347a"; // the word that was never there
const CREAM = "#fffdf6";
const NIGHT = "#d9d3c6";
const FLOOR = 1440;
const S = 3.0;

// the 15 words, as printed in the 1995 paper (Exp. 2 "sleep" list)
const WORDS = ["BED", "REST", "AWAKE", "TIRED", "DREAM", "WAKE", "NIGHT", "BLANKET", "DOZE", "SLUMBER", "SNORE", "PILLOW", "PEACE", "YAWN", "DROWSY"];

// --- timing ---------------------------------------------------------------------------------------------------------------
const PROMISE = C(1);
const TRICK_IN = PROMISE - 8;
const PULL1 = W(2, 0) + 2; // "Read": he pulls the cord, the list unrolls
const UNROLL1 = [PULL1 + 2, PULL1 + 26] as const;
const STILL0 = UNROLL1[1] + 22; // camera has arrived: everything is still from here
const STILL1 = C(3); // "Was the word sleep on the list?"
const ROLLUP = [STILL1 + 4, STILL1 + 24] as const;
const SLEEPW = W(3, 3);
const YES = E(3) + 2;
const PULL2 = C(4) + 2;
const UNROLL2 = [PULL2 + 2, PULL2 + 24] as const;
const NEVER = W(4, 5);
const HIT = W(4, 6); // "there!"
export { HIT };
const SMASH = HIT + 16;
const BEDW = W(5, 3);
const DREAMW = W(5, 5);
const ADDED = W(5, 8);
const BIG = W(5, 9); // "sleep." the biggest reaction
const TV0 = C(6);
const TV_ON = W(6, 1);
const HALF = W(7, 1);
const PAPERS = W(7, 6);
const Q = C(8);
const YOUQ = W(8, 1);
const ROLL_END = W(8, 3);
const LOOP1 = VOICE_FRAMES - 3;

// --- camera rig: hold → move → hold --------------------------------------------------------------------------------------
type V3 = [number, number, number];
const F0: V3 = [760, 900, 1.42];
const WIDE: V3 = [540, 960, 1.0];
const TEST: V3 = [400, 650, 1.32];
const ROOM: V3 = [560, 930, 1.04];
const REVEAL: V3 = [600, 880, 1.12];
const TVCAM: V3 = [1560, 940, 1.55];
type CamKey = [number, number, number, number, number];
const k = (a: number, b: number, c: V3): CamKey => [a, b, c[0], c[1], c[2]];
const RIG: CamKey[] = [
  k(0, 0, F0),
  k(PROMISE - 16, PROMISE + 4, WIDE), // the whole room: Mr. Trick, the rolled list, the lamp
  k(UNROLL1[1] - 2, STILL0 - 2, TEST), // onto the list, then nothing moves
  k(STILL1, STILL1 + 20, ROOM), // back: the list rolls up, Spark answers
  k(E(4) + 8, E(4) + 30, REVEAL), // the pause: a slow push to Spark and the list
  k(TV0 - 14, TV0 + 8, TVCAM), // "In one test": over to the TV
  k(Q - 18, Q + 4, F0), // back to Spark's face for the question = frame 0
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

// --- the roller list ------------------------------------------------------------------------------------------------------
const LX = 70;
const LW = 600;
const LTOP = 250; // the roller
const LBOT = 930; // fully open
const ROW = 76;
// 0 = rolled up, 1 = open. Unrolls with a small overshoot; rolls up with anticipation (a tug down first).
const openAt = (f: number) => {
  if (f < UNROLL1[0]) return 0;
  if (f < ROLLUP[0]) return interpolate(f, [UNROLL1[0], UNROLL1[1] - 4, UNROLL1[1]], [0, 1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (f < UNROLL2[0]) return interpolate(f, [ROLLUP[0], ROLLUP[0] + 4, ROLLUP[1]], [1, 1.03, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (f < ROLL_END) return interpolate(f, [UNROLL2[0], UNROLL2[1] - 4, UNROLL2[1]], [0, 1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return interpolate(f, [ROLL_END, ROLL_END + 4, ROLL_END + 20], [1, 1.03, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
};
const wordPos = (i: number): [number, number] => {
  const col = i < 8 ? 0 : 1;
  const row = i < 8 ? i : i - 8;
  return [LX + 60 + col * 290, LTOP + 110 + row * ROW];
};

const List: React.FC<{ f: number }> = ({ f }) => {
  const o = openAt(f);
  const bottom = LTOP + 30 + (LBOT - LTOP - 30) * Math.min(1.04, o);
  const circ = (i: number, at: number) => {
    const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (p <= 0 || f >= Q) return null;
    const [x, y] = wordPos(i);
    const w = WORDS[i].length * 36 + 40;
    const rx = w / 2;
    const cx = x - 20 + rx;
    const len = Math.PI * 2 * Math.max(rx, 44);
    return <ellipse cx={cx} cy={y - 18} rx={rx} ry={44} fill="none" stroke={GRAPHITE} strokeWidth={6} strokeDasharray={len} strokeDashoffset={len * (1 - p)} transform={`rotate(-3 ${cx} ${y - 18})`} />;
  };
  return (
    <g>
      <clipPath id="sheet">
        <rect x={LX} y={LTOP + 20} width={LW} height={Math.max(0, bottom - LTOP - 20)} />
      </clipPath>
      <g clipPath="url(#sheet)">
        <rect x={LX} y={LTOP} width={LW} height={LBOT - LTOP + 30} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
        {WORDS.map((w, i) => {
          const [x, y] = wordPos(i);
          return (
            <text key={w} x={x} y={y} fontFamily={FONT.title} fontWeight={900} fontSize={58} fill={GRAPHITE} letterSpacing={1}>
              {w}
            </text>
          );
        })}
        {circ(0, BEDW)}
        {circ(4, DREAMW)}
      </g>
      {/* the bottom bar of the sheet */}
      <rect x={LX - 6} y={bottom - 4} width={LW + 12} height={22} rx={8} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
      {/* the roller on top */}
      <rect x={LX - 24} y={LTOP - 6} width={LW + 48} height={46} rx={22} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      <Hatch x={LX - 10} y={LTOP} w={LW + 20} h={34} gap={12} o={0.3} width={2} />
      {/* the cord with a ring, on the right of the roller */}
      <line x1={LX + LW + 6} y1={LTOP + 30} x2={LX + LW + 6} y2={1000 + (bottom - LTOP) * 0.06} stroke={GRAPHITE} strokeWidth={4} />
      <circle cx={LX + LW + 6} cy={1014 + (bottom - LTOP) * 0.06} r={14} fill="none" stroke={GRAPHITE} strokeWidth={5} />
    </g>
  );
};

// --- the room -------------------------------------------------------------------------------------------------------------
const Room: React.FC = () => (
  <g>
    {/* wall + wallpaper stripes, floor */}
    <rect x={-800} y={-800} width={3600} height={FLOOR + 800} fill={NIGHT} />
    {Array.from({ length: 40 }, (_, i) => (
      <line key={i} x1={-760 + i * 90} y1={-800} x2={-760 + i * 90} y2={FLOOR} stroke={GRAPHITE} strokeWidth={2} opacity={0.12} />
    ))}
    <rect x={-800} y={FLOOR} width={3600} height={300} fill={PAPER2} />
    <Hatch x={-800} y={FLOOR} w={3600} h={300} gap={28} o={0.2} />
    <SketchLine x1={-800} y1={FLOOR} x2={2800} y2={FLOOR} w={7} />
    {/* window with the moon, between the bed and the dresser */}
    <SketchBox x={1130} y={300} w={300} h={380} fill="#5c6670" lw={8} />
    <line x1={1280} y1={300} x2={1280} y2={680} stroke={GRAPHITE} strokeWidth={6} />
    <line x1={1130} y1={490} x2={1430} y2={490} stroke={GRAPHITE} strokeWidth={6} />
    <circle cx={1210} cy={390} r={44} fill={CREAM} stroke={GRAPHITE} strokeWidth={4} />
    <circle cx={1232} cy={378} r={40} fill="#5c6670" />
    {[
      [1350, 360],
      [1380, 580],
      [1180, 600],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={5} fill={CREAM} />
    ))}
  </g>
);

const LAMP_X = 130;
const Lamp: React.FC = () => (
  <g>
    {/* soft light from the lamp: the lamp is the light in the room */}
    <defs>
      <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6d8" stopOpacity={0.9} />
        <stop offset="1" stopColor="#fff6d8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={LAMP_X} cy={1110} r={560} fill="url(#lampGlow)" />
    {/* nightstand */}
    <rect x={20} y={1250} width={230} height={FLOOR - 1250} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    <line x1={20} y1={1340} x2={250} y2={1340} stroke={GRAPHITE} strokeWidth={5} />
    <circle cx={135} cy={1300} r={7} fill={GRAPHITE} />
    <circle cx={135} cy={1390} r={7} fill={GRAPHITE} />
    {/* the lamp */}
    <rect x={LAMP_X - 14} y={1150} width={28} height={100} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <ellipse cx={LAMP_X} cy={1248} rx={56} ry={12} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
    <path d={`M ${LAMP_X - 54} 1160 L ${LAMP_X - 34} 1060 L ${LAMP_X + 34} 1060 L ${LAMP_X + 54} 1160 Z`} fill="#fff3c8" stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

const BED_X0 = 720;
const BED_X1 = 1070;
const MATT = 1260;
const Bed: React.FC<{ part: "back" | "front" }> = ({ part }) =>
  part === "back" ? (
    <g>
      {/* headboard on the right + pillow */}
      <rect x={BED_X1 - 40} y={1020} width={50} height={FLOOR - 1020} rx={14} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      <path d={`M ${BED_X1 - 190} ${MATT - 6} Q ${BED_X1 - 196} ${MATT - 86} ${BED_X1 - 120} ${MATT - 80} L ${BED_X1 - 50} ${MATT - 74} Q ${BED_X1 - 30} ${MATT - 30} ${BED_X1 - 52} ${MATT - 4} Z`} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
    </g>
  ) : (
    <g>
      {/* mattress + blanket over Spark's legs, footboard on the left */}
      <ellipse cx={(BED_X0 + BED_X1) / 2} cy={FLOOR + 4} rx={200} ry={12} fill={GRAPHITE} opacity={0.22} />
      <rect x={BED_X0} y={MATT + 40} width={BED_X1 - BED_X0 - 30} height={70} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      <path
        d={`M ${BED_X0 - 6} ${MATT + 60} L ${BED_X0 + 10} ${MATT + 4} Q ${BED_X0 + 90} ${MATT - 34} ${BED_X1 - 200} ${MATT - 8} Q ${BED_X1 - 150} ${MATT + 10} ${BED_X1 - 60} ${MATT + 2} L ${BED_X1 - 34} ${MATT + 66} Z`}
        fill="#f1ead8"
        stroke={GRAPHITE}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      {/* a simple check on the blanket */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={BED_X0 + 80 + i * 100} y1={MATT - 10 + (i === 0 ? 10 : 0)} x2={BED_X0 + 60 + i * 100} y2={MATT + 62} stroke={GRAPHITE} strokeWidth={3} opacity={0.35} />
      ))}
      <line x1={BED_X0} y1={MATT + 30} x2={BED_X1 - 40} y2={MATT + 30} stroke={GRAPHITE} strokeWidth={3} opacity={0.35} />
      {[BED_X0 + 10, BED_X1 - 70].map((x) => (
        <rect key={x} x={x} y={MATT + 110} width={22} height={FLOOR - MATT - 110} fill={PAPER2} stroke={GRAPHITE} strokeWidth={5} />
      ))}
      <rect x={BED_X0 - 30} y={1170} width={40} height={FLOOR - 1170} rx={12} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
    </g>
  );

// --- the TV on the dresser: the lab test --------------------------------------------------------------------------------
const TVX = 1290;
const TVY = 700;
const TVW = 540;
const TVH = 400;
const TV: React.FC<{ f: number }> = ({ f }) => {
  const on = interpolate(f, [TV_ON, TV_ON + 6, LOOP1 - 60, LOOP1 - 50], [0, 1, 1, 0], clamp);
  const half = interpolate(f, [HALF, HALF + 10], [0, 1], { ...clamp, easing: eoB });
  const paper = interpolate(f, [PAPERS - 4, PAPERS + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // sound lines from the speaker to the headphones while they listen
  const listen = f >= TV_ON + 6 && f < HALF;
  const people: { x: number; hair: "long" | "short"; glasses?: boolean; sleep: boolean }[] = [
    { x: TVX + 150, hair: "long", sleep: true },
    { x: TVX + 390, hair: "short", glasses: true, sleep: false },
  ];
  return (
    <g>
      {/* dresser */}
      <rect x={TVX - 40} y={TVY + TVH + 30} width={TVW + 80} height={FLOOR - TVY - TVH - 30} fill={PAPER2} stroke={GRAPHITE} strokeWidth={6} />
      <line x1={TVX - 40} y1={TVY + TVH + 140} x2={TVX + TVW + 40} y2={TVY + TVH + 140} stroke={GRAPHITE} strokeWidth={5} />
      <rect x={TVX + TVW / 2 - 50} y={TVY + TVH} width={100} height={30} fill={GRAPHITE} />
      <rect x={TVX - 18} y={TVY - 18} width={TVW + 36} height={TVH + 36} rx={20} fill={GRAPHITE} />
      <rect x={TVX} y={TVY} width={TVW} height={TVH} rx={8} fill={on > 0.5 ? CREAM : "#59544c"} />
      <clipPath id="tv">
        <rect x={TVX} y={TVY} width={TVW} height={TVH} rx={8} />
      </clipPath>
      {on > 0.01 && (
        <g clipPath="url(#tv)" opacity={on}>
          <rect x={TVX} y={TVY} width={TVW} height={58} fill={PAPER2} />
          <text x={TVX + TVW / 2} y={TVY + 42} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={GRAPHITE}>
            A MEMORY TEST
          </text>
          {/* a speaker on the wall of the test room */}
          <rect x={TVX + TVW / 2 - 26} y={TVY + 74} width={52} height={40} rx={6} fill={PAPER2} stroke={GRAPHITE} strokeWidth={4} />
          <circle cx={TVX + TVW / 2} cy={TVY + 94} r={10} fill={GRAPHITE} />
          {listen &&
            [0, 1, 2].map((r) => {
              const t = ((f - TV_ON + r * 10) % 30) / 30;
              return (
                <g key={r} opacity={1 - t}>
                  <path d={`M ${TVX + TVW / 2 - 40 - t * 60} ${TVY + 80} q -14 14 0 28`} stroke={GRAPHITE} strokeWidth={4} fill="none" strokeLinecap="round" />
                  <path d={`M ${TVX + TVW / 2 + 40 + t * 60} ${TVY + 80} q 14 14 0 28`} stroke={GRAPHITE} strokeWidth={4} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
          {people.map((p, i) => (
            <g key={i}>
              <Doodle x={p.x} ground={TVY + 400} scale={0.95} facing={1} hair={p.hair} glasses={p.glasses} face={f >= PAPERS + 8 && p.sleep ? "happy" : "plain"} pose={{ ra1: 50, ra2: 60, la1: 40, la2: 70, head: 10 }} />
              {/* headphones */}
              <path d={`M ${p.x - 24} ${TVY + 212} Q ${p.x} ${TVY + 168} ${p.x + 24} ${TVY + 212}`} stroke={GRAPHITE} strokeWidth={6} fill="none" />
              <rect x={p.x - 32} y={TVY + 206} width={14} height={22} rx={5} fill={GRAPHITE} />
              <rect x={p.x + 18} y={TVY + 206} width={14} height={22} rx={5} fill={GRAPHITE} />
              {/* desk + paper */}
              <rect x={p.x - 110} y={TVY + 300} width={220} height={20} fill={PAPER2} stroke={GRAPHITE} strokeWidth={4} />
              <rect x={p.x - 104} y={TVY + 320} width={14} height={80} fill={PAPER2} stroke={GRAPHITE} strokeWidth={3} />
              <rect x={p.x + 90} y={TVY + 320} width={14} height={80} fill={PAPER2} stroke={GRAPHITE} strokeWidth={3} />
              <g transform={`translate(${p.x + 6} ${TVY + 286}) rotate(-4)`}>
                <rect x={-70} y={-120 * paper} width={140} height={120 * paper + 14} fill="#fffef9" stroke={GRAPHITE} strokeWidth={3} />
                {paper > 0.6 && (
                  <g opacity={(paper - 0.6) / 0.4}>
                    {["BED", "REST", p.sleep ? "SLEEP" : "TIRED"].map((w, j) => (
                      <text key={w} x={-58} y={-86 + j * 34} fontFamily={FONT.title} fontWeight={900} fontSize={26} fill={w === "SLEEP" ? ACCENT : GRAPHITE}>
                        {w}
                      </text>
                    ))}
                  </g>
                )}
              </g>
            </g>
          ))}
          {half > 0.01 && (
            <g transform={`translate(${TVX + TVW / 2} ${TVY + 150}) scale(${half}) rotate(-3)`}>
              <rect x={-170} y={-34} width={340} height={56} rx={12} fill={CREAM} stroke={ACCENT} strokeWidth={6} />
              <text x={0} y={8} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={36} fill={ACCENT}>
                ABOUT HALF
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

// --- Spark's thought bubble ------------------------------------------------------------------------------------------------
const BX = 690;
const BY = 380;
const BW = 360;
const BH = 470;
const MEM = [
  { w: "BED", at: STILL1 + 6 },
  { w: "DREAM", at: STILL1 + 14 },
  { w: "PILLOW", at: STILL1 + 22 },
];
const Bubble: React.FC<{ f: number }> = ({ f }) => {
  const show = interpolate(f, [STILL1 + 2, STILL1 + 12, Q - 16, Q - 6], [0, 1, 1, 0], { ...clamp, easing: eoB });
  if (show <= 0.01) return null;
  const pop = (at: number) => interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: eoB });
  // SLEEP: pops in on "sleep", cracks on "there!", falls and smashes on the blanket
  const sx = BX + BW / 2;
  const sy = BY + 360;
  const fall = interpolate(f, [HIT + 2, SMASH], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const smashed = f >= SMASH;
  const crack = f >= HIT;
  const ghost = interpolate(f, [ADDED - 2, BIG + 2], [0, 1], clamp); // the dashed SLEEP his brain drew
  return (
    <g>
      <g transform={`translate(${BX + BW / 2} ${BY + BH / 2}) scale(${show}) translate(${-(BX + BW / 2)} ${-(BY + BH / 2)})`}>
        <ellipse cx={BX + BW / 2} cy={BY + BH / 2} rx={BW / 2} ry={BH / 2} fill={CREAM} stroke={GRAPHITE} strokeWidth={6} />
        {[
          [BX + 70, BY + BH + 30, 26],
          [BX + 30, BY + BH + 90, 16],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={CREAM} stroke={GRAPHITE} strokeWidth={5} />
        ))}
        {MEM.map((m, i) => {
          const p = pop(m.at);
          return (
            <text key={m.w} x={BX + BW / 2} y={BY + 110 + i * 82} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={60} fill={GRAPHITE} opacity={p} transform={`translate(0 ${(1 - p) * 20})`}>
              {m.w}
            </text>
          );
        })}
        {ghost > 0.01 && (
          <text x={sx} y={sy + 18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={74} fill="none" stroke={ACCENT} strokeWidth={3} strokeDasharray="10 7" opacity={ghost}>
            SLEEP
          </text>
        )}
      </g>
      {f >= SLEEPW && !smashed && (
        <g transform={`translate(${sx + fall * 40} ${sy + fall * (MATT - 30 - sy)}) rotate(${fall * 24}) scale(${interpolate(f, [SLEEPW, SLEEPW + 8], [0.3, 1], { ...clamp, easing: eoB }) * show})`}>
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={74} fill={ACCENT}>
            SLEEP
          </text>
          {crack && <path d="M -40 -40 L -16 -6 L -30 10 L -4 40" stroke={GRAPHITE} strokeWidth={6} fill="none" strokeLinecap="round" />}
          {crack && <path d="M 40 -38 L 20 0 L 36 34" stroke={GRAPHITE} strokeWidth={5} fill="none" strokeLinecap="round" />}
        </g>
      )}
      {smashed &&
        f < Q &&
        ["S", "L", "E", "E", "P"].map((ch, i) => {
          const t = f - SMASH;
          const dx = (i - 2) * 52 + (i - 2) * Math.min(t, 14) * 2;
          const lift = Math.max(0, 40 - Math.pow(t - 7, 2)) * 1.4;
          const rot = (i - 2) * 30 * Math.min(1, t / 12);
          return (
            <text key={i} x={sx - 40 + dx} y={MATT - 2 - lift} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={70} fill={ACCENT} opacity={interpolate(t, [0, 60, 90], [1, 1, 0.55], clamp)} transform={`rotate(${rot} ${sx - 40 + dx} ${MATT - 20})`}>
              {ch}
            </text>
          );
        })}
    </g>
  );
};

// lines from the list into Spark's head: BED and DREAM first, then every word
const Links: React.FC<{ f: number; head: [number, number] }> = ({ f, head }) => {
  if (f < BEDW || f >= TV0) return null;
  const one = (i: number, at: number, w: number, o: number) => {
    const p = interpolate(f, [at, at + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    if (p <= 0) return null;
    const [x, y] = wordPos(i);
    const x0 = x + WORDS[i].length * 36 + 10;
    const y0 = y - 20;
    const mx = (x0 + head[0]) / 2;
    const my = Math.min(y0, head[1]) - 80;
    const d = `M ${x0} ${y0} Q ${mx} ${my} ${head[0]} ${head[1]}`;
    return <path key={i} d={d} stroke={i === 0 || i === 4 ? ACCENT : GRAPHITE} strokeWidth={w} fill="none" strokeLinecap="round" opacity={o} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
  };
  return (
    <g>
      {one(0, BEDW + 2, 7, 0.95)}
      {one(4, DREAMW + 2, 7, 0.95)}
      {WORDS.map((_, i) => (i === 0 || i === 4 ? null : one(i, ADDED - 6 + (i % 5) * 2, 3, 0.45)))}
    </g>
  );
};

export const S01_SFX: SfxCue[] = [
  [W(0, 3), "pop", 0.22],
  [TRICK_IN, "swish", 0.3],
  [PROMISE - 14, "whoosh", 0.3],
  [W(1, 3), "pop", 0.3],
  [PULL1, "swish", 0.35],
  [UNROLL1[0], "page", 0.5],
  [UNROLL1[1] - 2, "thud", 0.25],
  [STILL1 + 2, "whoosh", 0.25],
  [ROLLUP[0], "page", 0.45],
  ...MEM.map((m) => [m.at, "pop", 0.25] as SfxCue),
  [SLEEPW, "ding", 0.35],
  [YES, "boing", 0.3],
  [PULL2, "swish", 0.35],
  [UNROLL2[0], "page", 0.5],
  [NEVER, "tick", 0.3],
  [HIT, "impact", 0.8],
  [HIT + 2, "stamp", 0.4],
  [SMASH, "shatter", 0.6],
  [BEDW + 2, "scribble", 0.3],
  [DREAMW + 2, "scribble", 0.3],
  [ADDED - 6, "swirl", 0.35],
  [BIG, "ding", 0.55],
  [TV0 - 12, "whoosh_long", 0.28],
  [TV_ON, "clink", 0.35],
  [HALF, "pop", 0.35],
  [PAPERS, "scribble", 0.35],
  [Q - 16, "whoosh", 0.3],
  [YOUQ, "pop", 0.3],
  [ROLL_END, "page", 0.4],
];

export const S01Bedroom: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAtRig(f);
  const still = f >= STILL0 && f < STILL1; // the read test: nothing moves
  const fa = still ? STILL0 : f; // everything acts on the frozen frame during the test

  // --- Spark (sits up in bed, facing left at the list) -------------------------------------------------------------------
  const SX = 860;
  const SY = MATT + 150;
  const sparkKeys = gestureKeys([
    [0, { ...G.armsCrossed, head: -6 }],
    [W(0, 3), { ...G.pointUp, ra1: 160, ra2: 60, head: -8 }, "snap"], // taps his head: "I remember everything"
    [W(0, 7), { ...G.armsCrossed, head: -8 }, "snap"],
    [PROMISE - 2, { ...G.pointUp, head: -8 }, "snap"],
    [E(1) + 2, { ...G.handsHips, head: -6 }, "snap"],
    [PULL1, { ...G.leanIn, head: -12 }, "snap"],
    [UNROLL1[1] - 6, { ...G.thinkChin, head: -14 }, "snap"], // reading
    [STILL1 + 2, { ...G.present, ra1: 120, head: -10 }, "snap"],
    [SLEEPW, { ...G.pointUp, ra1: 150, head: -14 }, "snap"],
    [YES - 2, { ...G.armsCrossed, head: -4 }, "snap"], // "YES!"
    [PULL2, { ...G.handsHips, head: -8 }, "snap"],
    [NEVER - 2, { ...G.leanIn, head: -14 }, "snap"],
    [HIT, { ...G.recoil, head: -14 }, "snap"],
    [HIT + 14, { ...G.pointDown, head: 14 }, "snap"], // looks at the broken word
    [BEDW - 2, { ...G.pointSide, ra1: 100, head: -10 }, "snap"],
    [DREAMW, { ...G.pointSide, ra1: 118, head: -14 }, "snap"],
    [ADDED - 4, { ...G.thinkChin, head: -6 }, "snap"],
    [BIG, { ...G.mindBlown, head: -8 }, "snap"],
    [TV0 + 6, { ...G.pointSide, ra1: 80, head: 0 }, "snap"],
    [HALF, { ...G.shrugBig }, "snap"],
    [PAPERS, { ...G.presentBoth, head: -6 }, "snap"],
    [Q - 4, { ...G.leanIn, ra1: 80, ra2: 10, head: 4 }, "snap"],
    [YOUQ, { ...G.doublePoint, lean: 8 }, "snap"],
    [ROLL_END + 6, { ...G.armsCrossed, head: -6 }, "snap"],
  ]);
  const sparkMod = (t: number, p: Pose) => {
    let q = addPose(p, idle(t, 3));
    q = addPose(q, nod(t, PROMISE + 4, 2));
    q = addPose(q, nod(t, YES, 3));
    q = addPose(q, hop(t, HIT, 12));
    q = addPose(q, shake(t, SMASH + 6, 3));
    q = addPose(q, hop(t, BIG, 14));
    q = addPose(q, nod(t, PAPERS + 6, 2));
    q = addPose(q, nod(t, YOUQ + 4, 2));
    return { ...q, x: SX, y: SY + (q.y - p.y) };
  };
  const mood = (t: number): Mood => {
    const seq: [number, Mood][] = [
      [0, "smug"],
      [W(0, 7), "curious"],
      [PROMISE - 2, "wink"],
      [E(1) + 2, "determined"],
      [UNROLL1[1] - 6, "thinking"],
      [STILL1 + 2, "happy"],
      [SLEEPW, "excited"],
      [YES - 2, "smug"],
      [NEVER - 2, "worried"],
      [HIT, "shock"],
      [HIT + 14, "sad"],
      [BEDW - 2, "curious"],
      [ADDED - 4, "thinking"],
      [BIG, "mindblown"],
      [TV0 + 6, "curious"],
      [HALF, "skeptical"],
      [PAPERS, "laugh"],
      [Q - 4, "curious"],
      [YOUQ, "wink"],
      [ROLL_END + 6, "smug"],
    ];
    let m: Mood = "smug";
    for (const [a, v] of seq) if (t >= a) m = v;
    return m;
  };
  // his bulb flickers while he is wrong and lights only when he is right
  const bulb = (t: number) => {
    if (t >= BIG - 2 && t < Q) return interpolate(t, [BIG - 2, BIG + 2], [0.2, 1], clamp);
    const n = Math.abs(Math.sin(Math.floor(t / 4) * 12.9898) * 43758.5453) % 1;
    return n > 0.62 ? 0.42 : 0.08;
  };
  const facing = -1;
  const look = f >= Q ? 0.9 : 0.3;
  const blanketTop = MATT + 6;

  // --- Mr. Trick: by the cord on the left; pulls it (anticipation: crouch, then tug) -----------------------------------------
  const trickX = interpolate(fa, [TRICK_IN, TRICK_IN + 26], [-200, 600], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tug = (a: number) => interpolate(fa, [a - 6, a, a + 6, a + 14], [0, 1, 1, 0], clamp);
  const pulling = Math.max(tug(PULL1), tug(ROLLUP[0]), tug(PULL2), tug(ROLL_END));
  const trickMood = fa >= HIT && fa < BIG ? "smug" : fa >= BIG && fa < Q ? "surprised" : "sly";
  const tipHat = fa >= PROMISE + 6 && fa < E(1) + 10;
  const trickPose: Partial<Pose> = {
    ra1: pulling > 0 ? 170 : tipHat ? 160 : 40,
    ra2: pulling > 0 ? 10 : tipHat ? 70 : 30,
    la1: 50,
    la2: 30,
    head: pulling > 0 ? -10 : 4,
    lean: pulling * 8,
  };
  const trickGround = FLOOR + pulling * 6;

  // Spark's head (approx.), for the lines from the list
  const head: [number, number] = [SX - 20, SY - 400];

  const svg = (
    <>
      <PencilDefs f={fa} still={still} />
      <Paper />
      <g filter="url(#pencil)">
        <Room />
        <Lamp />
        <TV f={fa} />
        <List f={fa} />
        <Bed part="back" />
      </g>
      {/* Spark sits in bed: drawn above the blanket line only */}
      <clipPath id="inBed">
        <rect x={SX - 700} y={-1200} width={1400} height={blanketTop + 1200} />
      </clipPath>
      <g clipPath="url(#inBed)">
        <Spark f={fa} trails={false} scale={S} facing={facing} base={{ x: SX, y: SY }} talk={(t) => (still ? 0 : mouthAt(t))} bulb={bulb} mood={mood} look={look} keys={sparkKeys} mod={sparkMod} />
      </g>
      <g filter="url(#pencil)">
        <Bed part="front" />
        {trickX > -150 && <MrTrick x={trickX} ground={trickGround} scale={1.8} facing={1} pose={trickPose} mood={trickMood as "sly" | "smug" | "surprised"} cane={pulling > 0 ? "none" : "down"} />}
      </g>
      <Links f={fa} head={head} />
      <Bubble f={fa} />
      {/* Spark's answer */}
      {fa >= YES && fa < HIT && (
        <g transform={`translate(${SX + 80} ${SY - 520}) scale(${interpolate(fa, [YES, YES + 8], [0.3, 1], { ...clamp, easing: eoB })}) rotate(-6)`}>
          <path d="M -90 -50 L 90 -50 Q 110 -50 110 -30 L 110 30 Q 110 50 90 50 L 20 50 L 40 90 L -10 50 L -90 50 Q -110 50 -110 30 L -110 -30 Q -110 -50 -90 -50 Z" fill={CREAM} stroke={GRAPHITE} strokeWidth={6} strokeLinejoin="round" />
          <text x={0} y={20} textAnchor="middle" fontFamily={FONT.title} fontWeight={900} fontSize={64} fill={GRAPHITE}>
            YES!
          </text>
        </g>
      )}
    </>
  );

  const slam = (at: number) => 1 + wobble(f, at, 0.05, 6);
  const top = (text: React.ReactNode, at: number, until: number, size = 112) => (
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
        opacity: interpolate(f, [until - 8, until], [1, 0], clamp),
        transform: `scale(${slam(at)}) rotate(-1.5deg)`,
      }}
    >
      {text}
    </div>
  );
  const watch = <>WATCH THESE WORDS</>;
  const smallLine =
    f < HIT
      ? ""
      : f < TV0
        ? "The word sleep is not on the list. Look again."
        : f < Q - 6
          ? "Lab test, 1995: students heard 15-word lists. Sleep came back on 55% of lists."
          : f < ROLL_END
            ? "One lab test with students. On screen you read the words; in the test they heard them."
            : "";
  const html = (
    <>
      <CaptionBand />
      {f < PROMISE - 6 && top(watch, 0, PROMISE - 6, 104)}
      {f >= ROLL_END + 16 && top(watch, ROLL_END + 16, VOICE_FRAMES + 200, 104)}
      {f >= HIT && f < BEDW - 4 && top(<><span style={{ color: ACCENT }}>SLEEP</span> WAS NEVER THERE</>, HIT, BEDW - 4, 96)}
      {f >= BIG && f < TV0 - 6 && top(<>YOUR BRAIN <span style={{ color: ACCENT }}>ADDED</span> IT</>, BIG, TV0 - 6, 100)}
      {smallLine && <div style={{ position: "absolute", left: 40, right: 40, top: 1684, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 25, color: "#d9d2c4" }}>{smallLine}</div>}
      {f >= 300 && f < E(8) && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1736, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 28, letterSpacing: 2, color: "#f6efdf" }}>SPARK GOT TRICKED</div>
          <div style={{ fontFamily: FONT.title, fontWeight: 900, fontSize: 25, letterSpacing: 1, color: "#fff", background: ACCENT, padding: "2px 12px", borderRadius: 8 }}>TIMES FOOLED: 8</div>
        </div>
      )}
      <VoiceCaptions f={f} y={1592} size={54} x={24} w={1032} cues={VOICE_CUES} hi={["remember", "never", "last", "remember", "sleep", "there!", "bed", "dream,", "added", "test,", "half", "sleep."]} />
    </>
  );

  return <Stage bg={<AbsoluteFill style={{ background: PAPER }} />} cam={cam} hits={[HIT, HIT + 2, SMASH]} power={5} svg={svg} html={html} />;
};

// keep SOFT referenced (palette)
export const _soft = SOFT;
